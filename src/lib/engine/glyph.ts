import type { QuizPack } from './types';
import { makeRng } from '../../../scripts/lib/rng';

/**
 * Deterministic procedural glyph generator -- renders a character's axis vector as a
 * box-drawing "topographic readout" for the holoprojector UI (see src/lib/styles/tokens.css).
 *
 * ## The field
 *
 * One radial-wave source is placed per axis, at the vertices of a regular polygon
 * (apex pointing up). Axis i (0-indexed, in `pack.axes` order) contributes
 *
 *   (v_i/100) * exp(-d_i^2 / sigma^2) * cos(k_i * d_i + phi_i)
 *
 * to the field at each sample point, where d_i is the distance to source i. Summed
 * across axes this gives concentric, overlapping ripples -- exactly the zero-crossings
 * of that sum are what gets drawn, via a 16-case marching-squares table over
 * box-drawing glyphs. Blank cells are the field's interior/exterior; only the crossings
 * are inked, which is what keeps this a contour reading rather than a filled blob.
 *
 * `phi_i` (phase) and `k_i` (wavenumber) are seeded from `xmur3(characterId) ->
 * mulberry32` (the mulberry32 half is scripts/lib/rng.ts's `makeRng`, already the
 * project's deterministic PRNG -- see its header comment for why Math.random() is
 * banned here). Four independent seeds are minted from one xmur3 hash stream (phase,
 * wavenumber, dither, fracture) so that tuning one channel's noise never reshuffles
 * another's.
 *
 * ## Orthogonal channels
 *
 * The one hard constraint: no two axes may modulate the same visual property, keyed by
 * axis *index* (not id) so packs with a different axis count and different axis
 * semantics still render distinctly. Each channel below hits a different stage of the
 * pipeline on purpose, so they can't cancel each other out:
 *
 *   0  symmetry     -- blends the field with its own left-right mirror image
 *                      (post field-sum, pre-threshold)
 *   1  edge hardness -- adds per-corner dither noise before the threshold test
 *                      (corner-sampling stage)
 *   2  convergence  -- scales the polygon's source radius in/out
 *                      (source placement)
 *   3  shear        -- skews the sample coordinates before distance is measured
 *                      (coordinate transform)
 *   4  vertical density -- multiplies field amplitude by a row-indexed gradient
 *                      (amplitude stage)
 *   5  scale        -- exponentially widens/narrows the shared Gaussian envelope sigma
 *                      (kernel width)
 *   6  fracture     -- stochastically blanks or junction-replaces already-chosen
 *                      glyphs (post-render pass, the only discrete/stochastic one)
 *
 * A pack with fewer axes just doesn't exercise the higher-indexed channels -- the
 * generator never assumes seven.
 */

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * xmur3 -- 32-bit string hash. Used only to turn a string into a stream of numeric
 * seeds for `makeRng` (mulberry32). Call the returned function again to mint another,
 * independent seed from the same string.
 */
function xmur3(str: string): () => number {
	let h = 1779033703 ^ str.length;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return () => {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		h ^= h >>> 16;
		return h >>> 0;
	};
}

// ---------------------------------------------------------------------------
// Marching squares -> box-drawing glyphs
// ---------------------------------------------------------------------------

const BLANK = ' ';

/**
 * 16-case marching-squares table. Corners are TL, TR, BR, BL (clockwise from
 * top-left), each 1 if the (possibly dithered) field sample there is above the
 * threshold. Case index = TL*8 + TR*4 + BR*2 + BL*1.
 *
 * All-in (15) and all-out (0) are blank -- interior and exterior read the same, only
 * the crossing itself is drawn. The two saddle cases (TR+BL in / TL+BR in, indices 5
 * and 10) are the genuinely ambiguous ones with only 4 samples; each resolves to the
 * diagonal that actually connects its two "in" corners rather than an arbitrary
 * tie-break, which is why ╱ and ╲ are in the glyph set at all.
 */
const MARCH_TABLE: readonly string[] = [
	BLANK, // 0000
	'┐', // 0001 BL
	'┌', // 0010 BR
	'─', // 0011 BR,BL
	'└', // 0100 TR
	'╱', // 0101 TR,BL (saddle)
	'│', // 0110 TR,BR
	'┘', // 0111 TR,BR,BL
	'┘', // 1000 TL
	'│', // 1001 TL,BL
	'╲', // 1010 TL,BR (saddle)
	'└', // 1011 TL,BR,BL
	'─', // 1100 TL,TR
	'┌', // 1101 TL,TR,BL
	'┐', // 1110 TL,TR,BR
	BLANK // 1111
];

/** Junction glyphs used only by the fracture (volatility) pass. */
const FRACTURE_GLYPHS: readonly string[] = ['┼', '├', '┤', '┬', '┴'];

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------

/**
 * Visual height of one row, in units of one column's width. A row's distance is
 * MULTIPLIED by this when measuring, so a shape that is circular on screen is squat in
 * cell coordinates -- otherwise every "circular" ripple renders as a tall ellipse.
 *
 * Measured, not guessed: JetBrains Mono is 1000 units/em with a 600-unit advance, so a
 * cell is 0.6em wide, and scripts/og.ts renders the panel at `lineHeight: 1.3`. Hence
 * 1.3 / 0.6 = 2.1667.
 *
 * WAS 0.5, WHICH WAS THIS VALUE INVERTED (and then some -- 4.33x off). The prose above
 * it was right and the number contradicted it: 0.5 models a cell twice as WIDE as tall.
 * The damage was at `baseRadius = MARGIN * Math.min(cx, cy)` below -- with rows scaled
 * DOWN, `cy` was always the smaller term, so on the shipping 22x14 panel the radius was
 * pinned to 2.67 and only 7 of 22 columns could ever be inked. Every card rendered the
 * contour field as a narrow vertical smear instead of a topographic readout. Nothing
 * caught it because the glyphs stayed deterministic and distinct -- `npm run audit`'s
 * `glyph-uniqueness` passed throughout -- so the failure was purely visual.
 *
 * If the og card's `fontSize`/`lineHeight` pair ever changes, this has to change with it.
 */
const ROW_ASPECT = 1.3 / 0.6;
/** Fraction of the limiting half-dimension the base polygon radius is allowed to use. */
const MARGIN = 0.82;
/** Cosine cycles packed across the base radius, before per-axis wavenumber jitter. */
const RINGS = 1.1;
/** Per-axis wavenumber jitter, as a fraction of the base wavenumber. */
const K_JITTER = 0.3;
/** Convergence (warmth-channel) radius range: source radius *= this ^ -channelValue. */
const CONVERGENCE_RANGE = 1.7;
/** Scale (ambition-channel) sigma range: sigma *= this ^ channelValue. */
const SCALE_RANGE = 1.6;
/** Shear (defiance-channel) max coordinate skew, in cells of x per cell of y. */
const SHEAR_MAX = 0.85;
/** Vertical-density (hope-channel) max amplitude swing top-to-bottom. */
const HOPE_STRENGTH = 0.85;
/**
 * Contour threshold, tested against |field|. The field oscillates around 0 and decays
 * to 0 at long range, so an exact-zero threshold makes the far field (many terms, all
 * individually tiny but essentially never exactly zero) flip sign at random -- speckle
 * that fills the whole canvas instead of leaving it clean between real ring structure.
 * Testing the *magnitude* against a threshold well above that floor draws only the
 * genuine rings around each source and reliably blanks everything else.
 */
const THRESHOLD = 0.13;
/**
 * Edge-hardness (candor-channel) max dither noise, defined as a fraction of
 * `THRESHOLD` rather than a standalone constant on purpose: dither must never be able
 * to flip a cell on its own regardless of how extreme the candor value is, or the most
 * concealed characters flood the whole canvas with noise instead of a smeared boundary.
 */
const DITHER_MAX = 0.5 * THRESHOLD;
/** Fracture (volatility-channel) max per-cell probability of being blanked or junctioned. */
const FRACTURE_MAX = 0.4;

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

interface Source {
	x: number;
	y: number;
	weight: number;
	k: number;
	phi: number;
}

function clamp01(x: number): number {
	return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Value of axis at `index` for this character, or 0 if the pack has no such axis. */
function channel(values: number[], index: number): number {
	return index < values.length ? values[index] : 0;
}

export function glyphFor(pack: QuizPack, characterId: string, cols = 40, rows = 20): string[] {
	const character = pack.characters.find((c) => c.id === characterId);
	if (!character) {
		throw new Error(`glyphFor: unknown character "${characterId}" in pack "${pack.id}"`);
	}
	if (cols < 2 || rows < 2) {
		throw new Error(`glyphFor: cols and rows must both be >= 2, got ${cols}x${rows}`);
	}

	const axisIds = pack.axes.map((a) => a.id);
	const n = axisIds.length;
	// -1..1 per axis, in pack.axes order -- this is the only place axis *ids* are read.
	// Everything past this point addresses axes purely by index.
	const values = axisIds.map((id) => (character.vector[id] ?? 0) / 100);

	// Four independent seeds from one hash stream: touching one channel's noise never
	// reshuffles another's.
	const seedStream = xmur3(`${pack.id}:${character.id}`);
	const rngPhase = makeRng(seedStream());
	const rngWavenumber = makeRng(seedStream());
	const rngDither = makeRng(seedStream());
	const rngFracture = makeRng(seedStream());

	// --- named channels, by axis index only ---------------------------------------
	const symmetryF = channel(values, 0); // order
	const edgeHardnessF = channel(values, 1); // candor
	const convergenceF = channel(values, 2); // warmth
	const shearF = channel(values, 3); // defiance
	const verticalF = channel(values, 4); // hope
	const scaleF = channel(values, 5); // ambition
	const fractureF = channel(values, 6); // volatility

	// --- layout: an (n)-gon of sources in aspect-corrected "visual" coordinates -----
	const cx = (cols - 1) / 2;
	const cy = ((rows - 1) * ROW_ASPECT) / 2;
	const baseRadius = MARGIN * Math.min(cx, cy);
	const sourceRadius = baseRadius * Math.pow(CONVERGENCE_RANGE, -convergenceF);
	const sigma = baseRadius * 0.62 * Math.pow(SCALE_RANGE, scaleF);
	const sigma2 = Math.max(sigma * sigma, 1e-6);
	const kBase = (TAU * RINGS) / Math.max(baseRadius, 1e-6);

	const sources: Source[] = axisIds.map((_, i) => {
		const angle = -Math.PI / 2 + (TAU * i) / n;
		return {
			x: cx + sourceRadius * Math.cos(angle),
			y: cy + sourceRadius * Math.sin(angle),
			weight: values[i],
			k: kBase * (1 - K_JITTER / 2 + K_JITTER * rngWavenumber.next()),
			phi: rngPhase.next() * TAU
		};
	});

	// --- sample the field at cell corners: (rows+1) x (cols+1) grid ----------------
	const cornerRows = rows + 1;
	const cornerCols = cols + 1;
	const field: number[][] = [];
	for (let r = 0; r < cornerRows; r++) {
		// Vertical-density gradient: >0 pushes mass up (rows near the top boosted),
		// <0 settles it toward the bottom. Depends only on row, so it composes cleanly
		// with the per-source terms below.
		const rowFrac = r / rows;
		const hopeMult = 1 + HOPE_STRENGTH * verticalF * (0.5 - rowFrac);

		const row: number[] = new Array(cornerCols);
		for (let c = 0; c < cornerCols; c++) {
			// Shear: skew x by a multiple of y before measuring distance to any source,
			// which tilts the whole rendered pattern off-axis without moving the sources.
			const rawY = r * ROW_ASPECT;
			const dyFromCenter = rawY - cy;
			const vx = c + SHEAR_MAX * shearF * dyFromCenter;
			const vy = rawY;

			let total = 0;
			for (const s of sources) {
				if (s.weight === 0) continue;
				const dx = vx - s.x;
				const dy = vy - s.y;
				const d2 = dx * dx + dy * dy;
				const d = Math.sqrt(d2);
				total += s.weight * Math.exp(-d2 / sigma2) * Math.cos(s.k * d + s.phi);
			}
			row[c] = total * hopeMult;
		}
		field.push(row);
	}

	// --- symmetry: blend the field with its own left-right mirror ------------------
	// The polygon's apex-up layout places source i and source (n-i mod n) as mirror
	// images of each other about the vertical centre line, so mirroring the *field*
	// (not just re-deriving it) is a meaningful "enforce symmetry" operation and not
	// just an averaging trick.
	const symmetryAmt = clamp01((symmetryF + 1) / 2);
	if (symmetryAmt > 0) {
		for (let r = 0; r < cornerRows; r++) {
			const row = field[r];
			const mirrored = new Array(cornerCols);
			for (let c = 0; c < cornerCols; c++) mirrored[c] = row[cornerCols - 1 - c];
			for (let c = 0; c < cornerCols; c++) {
				row[c] = row[c] * (1 - symmetryAmt) + (row[c] + mirrored[c]) * 0.5 * symmetryAmt;
			}
		}
	}

	// --- edge hardness: per-corner dither before the threshold test ----------------
	// Low candor (concealed) -> more dither -> the boundary smears; high candor
	// (plainspoken) -> zero dither -> a crisp, exact threshold.
	const ditherAmt = clamp01((1 - edgeHardnessF) / 2) * DITHER_MAX;
	const above: boolean[][] = [];
	for (let r = 0; r < cornerRows; r++) {
		const outRow: boolean[] = new Array(cornerCols);
		for (let c = 0; c < cornerCols; c++) {
			const noise = ditherAmt > 0 ? ditherAmt * (rngDither.next() * 2 - 1) : 0;
			outRow[c] = Math.abs(field[r][c] + noise) > THRESHOLD;
		}
		above.push(outRow);
	}

	// --- marching squares over the corner grid --------------------------------------
	const grid: string[][] = [];
	for (let r = 0; r < rows; r++) {
		const outRow: string[] = new Array(cols);
		for (let c = 0; c < cols; c++) {
			const tl = above[r][c];
			const tr = above[r][c + 1];
			const br = above[r + 1][c + 1];
			const bl = above[r + 1][c];
			const idx = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
			outRow[c] = MARCH_TABLE[idx];
		}
		grid.push(outRow);
	}

	// --- fracture: stochastic post-pass, the one discrete/broken channel -----------
	// High volatility blanks out or junction-replaces already-drawn contour cells,
	// breaking continuous iso-lines into runs and jitter. Low volatility leaves the
	// marching-squares output untouched.
	const fractureAmt = clamp01((fractureF + 1) / 2) * FRACTURE_MAX;
	if (fractureAmt > 0) {
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				if (grid[r][c] === BLANK) continue;
				if (rngFracture.next() >= fractureAmt) continue;
				grid[r][c] = rngFracture.next() < 0.5 ? BLANK : FRACTURE_GLYPHS[rngFracture.int(FRACTURE_GLYPHS.length)];
			}
		}
	}

	return grid.map((row) => row.join(''));
}

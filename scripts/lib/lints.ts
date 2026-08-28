import { deriveStats, questionsForTier } from '../../src/lib/engine/score';
import type { AxisId, QuizPack, TierId } from '../../src/lib/engine/types';
import { correlation, cosine, maxOffDiagonal, participationRatio } from './linalg';
import { scoreOf, TierScorer, winnerIndex } from './fastscore';
import { makeRng, type Rng } from './rng';

/** Thresholds. Changing one of these is a decision about the roster, not a tuning knob. */
export const LIMITS = {
	maxAxisCorrelation: 0.62,
	minEffectiveDimensions: 4.0,
	maxTwinCosine: 0.9,
	/** Every character needs at least this many axes at or below the negative floor. */
	generalistFloor: -35,
	generalistMinAxes: 2
} as const;

export function zRoster(pack: QuizPack): { axes: AxisId[]; rows: number[][] } {
	const axes = pack.axes.map((a) => a.id);
	const { mean, sd } = deriveStats(pack);
	return {
		axes,
		rows: pack.characters.map((c) => axes.map((a) => ((c.vector[a] ?? 0) - mean[a]) / sd[a]))
	};
}

export interface CorrelationResult {
	max: number;
	pair: [AxisId, AxisId];
	matrix: number[][];
}

/** Pearson r between axis pairs, taken across the roster. */
export function axisCorrelation(pack: QuizPack): CorrelationResult {
	const axes = pack.axes.map((a) => a.id);
	const rows = pack.characters.map((c) => axes.map((a) => c.vector[a] ?? 0));
	const R = correlation(rows);
	const { value, i, j } = maxOffDiagonal(R);
	return { max: value, pair: [axes[i], axes[j]], matrix: R };
}

/**
 * Participation ratio of the correlation-matrix eigenvalues.
 *
 * Measured on the correlation matrix rather than the raw covariance on purpose: the
 * engine z-scores every axis before it scores anything (see rank() in score.ts), so
 * the space the quiz actually operates in is the z-space. Using raw covariance would
 * reward authoring one axis on a wider numeric scale, which changes nothing downstream.
 */
export function effectiveDimensions(pack: QuizPack): number {
	return participationRatio(axisCorrelation(pack).matrix);
}

/** Every character pair whose z-vector cosine exceeds the threshold, worst first. */
export function findTwins(
	pack: QuizPack,
	threshold: number = LIMITS.maxTwinCosine
): Array<[string, string, number]> {
	const { rows } = zRoster(pack);
	const ids = pack.characters.map((c) => c.id);
	const out: Array<[string, string, number]> = [];
	for (let i = 0; i < rows.length; i++) {
		for (let j = i + 1; j < rows.length; j++) {
			const c = cosine(rows[i], rows[j]);
			if (c > threshold) out.push([ids[i], ids[j], c]);
		}
	}
	return out.sort((a, b) => b[2] - a[2]);
}

/** Closest pair regardless of threshold, for reporting headroom. */
export function closestPair(pack: QuizPack): [string, string, number] {
	const all = findTwins(pack, -2);
	return all[0] ?? ['', '', -1];
}

export interface GeneralistOffender {
	id: string;
	count: number;
	axes: AxisId[];
}

/**
 * A character with no strong negatives never wins: it sits near the roster centroid and
 * loses every cosine to whichever specialist is pointing the same general direction.
 */
export function findGeneralists(pack: QuizPack): GeneralistOffender[] {
	const axes = pack.axes.map((a) => a.id);
	const out: GeneralistOffender[] = [];
	for (const c of pack.characters) {
		const low = axes.filter((a) => (c.vector[a] ?? 0) <= LIMITS.generalistFloor);
		if (low.length < LIMITS.generalistMinAxes) out.push({ id: c.id, count: low.length, axes: low });
	}
	return out;
}

// ---------------------------------------------------------------------------
// Reachability
// ---------------------------------------------------------------------------

export interface ReachabilityResult {
	unreachable: string[];
	/** Winning answer set per reachable character, for spot-checking against scoreQuiz. */
	witness: Map<string, number[]>;
	/** Best achieved (target - best rival) margin per character. Negative means unreachable. */
	bestMargin: Map<string, number>;
}

/** The option closest to its own question's centroid: the least opinionated start. */
function neutralAnswers(scorer: TierScorer, axes: AxisId[]): Int32Array {
	return Int32Array.from(scorer.questions, (q) => {
		const centroid = axes.map(
			(a) => q.options.reduce((s, o) => s + (o.v[a] ?? 0), 0) / q.options.length
		);
		let best = 0;
		let bestD = Infinity;
		q.options.forEach((o, oi) => {
			const d = axes.reduce((s, a, ai) => s + ((o.v[a] ?? 0) - centroid[ai]) ** 2, 0);
			if (d < bestD) {
				bestD = d;
				best = oi;
			}
		});
		return best;
	});
}

/**
 * Coordinate ascent on the margin (target score minus best rival score) over the answer
 * set. Repeatedly takes the best single-answer change until nothing improves; several
 * restarts because the margin surface is not concave.
 *
 * This is a search for an existence proof, not an optimiser: the moment the target
 * actually wins, the answer set is a witness and we stop.
 */
export function checkReachability(
	pack: QuizPack,
	tier: TierId,
	opts: { seed?: number; restarts?: number; maxSweeps?: number } = {}
): ReachabilityResult {
	const restarts = opts.restarts ?? 6;
	const maxSweeps = opts.maxSweeps ?? 12;
	const rng: Rng = makeRng(opts.seed ?? 0x5eed);

	const axes = pack.axes.map((a) => a.id);
	const scorer = new TierScorer(pack, tier);
	const ids = scorer.charIds;
	const C = ids.length;
	const gravity = Float64Array.from(ids, (id) => pack.calibration.gravity[id] ?? 1);
	const raw = new Float64Array(C);

	const margin = (answers: Int32Array, target: number): number => {
		scorer.raw(answers, raw);
		const mine = scoreOf(raw[target], gravity[target]);
		let rival = -Infinity;
		for (let c = 0; c < C; c++) {
			if (c === target) continue;
			const s = scoreOf(raw[c], gravity[c]);
			if (s > rival) rival = s;
		}
		return mine - rival;
	};

	const neutral = neutralAnswers(scorer, axes);
	const unreachable: string[] = [];
	const witness = new Map<string, number[]>();
	const bestMargin = new Map<string, number>();

	for (let target = 0; target < C; target++) {
		let bestSeen = -Infinity;
		let found: Int32Array | null = null;

		for (let r = 0; r < restarts && !found; r++) {
			const answers =
				r === 0
					? Int32Array.from(neutral)
					: Int32Array.from(scorer.optionCounts, (n) => rng.int(n));

			for (let sweep = 0; sweep < maxSweeps; sweep++) {
				let changed = false;
				for (let qi = 0; qi < answers.length; qi++) {
					const original = answers[qi];
					let bestOpt = original;
					let bestVal = margin(answers, target);
					for (let oi = 0; oi < scorer.optionCounts[qi]; oi++) {
						if (oi === original) continue;
						answers[qi] = oi;
						const v = margin(answers, target);
						if (v > bestVal) {
							bestVal = v;
							bestOpt = oi;
						}
					}
					answers[qi] = bestOpt;
					if (bestOpt !== original) changed = true;
				}
				if (!changed) break;
			}

			const m = margin(answers, target);
			if (m > bestSeen) bestSeen = m;
			scorer.raw(answers, raw);
			if (winnerIndex(raw, gravity, ids) === target) found = Int32Array.from(answers);
		}

		bestMargin.set(ids[target], bestSeen);
		if (found) witness.set(ids[target], Array.from(found));
		else unreachable.push(ids[target]);
	}

	return { unreachable, witness, bestMargin };
}

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

export interface StructuralIssue {
	rule: string;
	detail: string;
}

const TIERS: TierId[] = ['short', 'medium', 'long'];

/** Shape violations that make the pack incoherent regardless of its statistics. */
export function structuralIssues(pack: QuizPack): StructuralIssue[] {
	const issues: StructuralIssue[] = [];
	const push = (rule: string, detail: string) => issues.push({ rule, detail });

	const axes = pack.axes.map((a) => a.id);
	const axisSet = new Set(axes);
	if (axes.length !== axisSet.size) push('duplicate-axis-id', `axes: ${axes.join(', ')}`);

	// characters
	const seenChar = new Set<string>();
	for (const c of pack.characters) {
		if (seenChar.has(c.id)) push('duplicate-character-id', c.id);
		seenChar.add(c.id);
		const missing = axes.filter((a) => c.vector[a] === undefined);
		if (missing.length) push('character-missing-axis', `${c.id} is missing: ${missing.join(', ')}`);
		const extra = Object.keys(c.vector).filter((k) => !axisSet.has(k));
		if (extra.length) push('character-undeclared-axis', `${c.id} declares: ${extra.join(', ')}`);
	}

	// questions
	const seenQ = new Set<string>();
	for (const q of pack.questions) {
		if (seenQ.has(q.id)) push('duplicate-question-id', q.id);
		seenQ.add(q.id);
		if (!axisSet.has(q.primaryAxis))
			push('question-undeclared-primary-axis', `${q.id} -> "${q.primaryAxis}"`);
		if (!TIERS.includes(q.tier)) push('question-bad-tier', `${q.id} -> "${q.tier}"`);
		if (q.options.length !== 4)
			push('question-option-count', `${q.id} has ${q.options.length} options, expected 4`);

		const seenOpt = new Set<string>();
		for (const o of q.options) {
			// Scoped to the question: packs commonly reuse a/b/c/d across questions and
			// nothing downstream requires option ids to be globally unique.
			if (seenOpt.has(o.id)) push('duplicate-option-id', `${q.id}.${o.id}`);
			seenOpt.add(o.id);
			const badAxis = Object.keys(o.v).filter((k) => !axisSet.has(k));
			if (badAxis.length)
				push('option-undeclared-axis', `${q.id}.${o.id} -> ${badAxis.join(', ')}`);
			for (const cid of Object.keys(o.sig ?? {})) {
				if (!seenChar.has(cid)) push('sig-unknown-character', `${q.id}.${o.id} -> "${cid}"`);
			}
		}
	}

	// eclipses must name real characters
	for (const c of pack.characters) {
		for (const e of c.eclipses ?? []) {
			if (!seenChar.has(e)) push('eclipses-unknown-character', `${c.id} -> "${e}"`);
		}
	}

	// theme: the numbers must be in range before anything renders them.
	//
	// Checked here rather than at render time because the failure is otherwise invisible.
	// An out-of-gamut oklch value does not throw, it clamps — so a mistyped theme ships a
	// plausible-looking wrong colour, and the sRGB mirror in scripts/og/palette.ts agrees
	// with it, because both derive from the same wrong number. The audit is the last place
	// that can say so.
	const theme = pack.theme;
	if (!theme) {
		push('theme-missing', 'pack declares no theme');
	} else {
		const hex = /^#[0-9a-f]{6}$/i;
		for (const [k, v] of Object.entries({
			bgBase: theme.bgBase,
			surfaceSunk: theme.surfaceSunk,
			surfaceRaised: theme.surfaceRaised,
			surfaceRaised2: theme.surfaceRaised2
		})) {
			if (!hex.test(v)) {
				push('theme-surface-not-hex', `${k} = "${v}" (expected #rrggbb)`);
				continue;
			}
			const lin = [1, 3, 5]
				.map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
				.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
			const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
			if (luminance > 0.15)
				push('theme-surface-too-light', `${k} = "${v}" has luminance ${luminance.toFixed(3)} — there is no light mode`);
		}
		for (const [k, c] of Object.entries({
			accentPrimary: theme.accentPrimary,
			accentSecondary: theme.accentSecondary,
			textPrimary: theme.textPrimary,
			textSecondary: theme.textSecondary,
			textFaint: theme.textFaint
		})) {
			const [l, chroma, hue] = c;
			if (!(l >= 0 && l <= 1)) push('theme-oklch-lightness', `${k}: L=${l} outside 0..1`);
			if (!(chroma >= 0 && chroma <= 0.5))
				push('theme-oklch-chroma', `${k}: C=${chroma} outside 0..0.5`);
			if (!(hue >= 0 && hue < 360)) push('theme-oklch-hue', `${k}: h=${hue} outside 0..360`);
		}
		for (const [k, pct] of Object.entries(theme.mix)) {
			if (!(pct >= 0 && pct <= 100))
				push('theme-mix-percent', `mix.${k} = ${pct} outside 0..100`);
		}
		// An empty animation name renders `animation: <duration> <ease>` with no keyframes —
		// legal CSS that simply never animates. Silent, so it gets a rule.
		if (!theme.anim?.enter) push('theme-anim-enter', 'anim.enter is empty');
		if (!theme.anim?.idle) push('theme-anim-idle', 'anim.idle is empty');
		if (!theme.fontDisplay) push('theme-font-display', 'fontDisplay is empty');
		if (!theme.fontMono) push('theme-font-mono', 'fontMono is empty');
	}

	if (!pack.chrome?.label) push('chrome-label', 'chrome.label is empty');
	for (const k of ['idle', 'inProgress', 'sealed'] as const) {
		if (!pack.chrome?.status?.[k]) push('chrome-status', `chrome.status.${k} is empty`);
	}

	// amplitude by tier: the short tier must hit harder on its primary axis than the long one.
	//
	// Both packs' questions.ts headers state this as a hard band (short ±70..90, medium
	// ±50..70, long ±30..55). Measured, NEITHER pack honours it — star-wars is outside that
	// band in 10 of 34 units and harry-potter in 12 — so gating on the band would fail
	// working, calibrated content, and by this repo's own doctrine a rule that fires on
	// known-good material is the thing that is wrong.
	//
	// What IS true, and what the band was reaching for, is the ordering: median amplitude
	// falls across the tiers in both packs (star-wars 90/60/50, harry-potter 85/80/55). That
	// is the property that matters — it is what stops a ten-question tier producing mush,
	// and its failure mode is a long tier less decisive than the short one.
	const peaks: Record<string, number[]> = { short: [], medium: [], long: [] };
	for (const q of pack.questions) {
		const peak = Math.max(...q.options.map((o) => Math.abs(o.v[q.primaryAxis] ?? 0)));
		peaks[q.tier]?.push(peak);
	}
	const median = (a: number[]) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : NaN);
	const [ms, mm, ml] = [median(peaks.short), median(peaks.medium), median(peaks.long)];
	// End to end, not adjacent: adjacent tiers may legitimately tie (the synthetic _fixture
	// pack ties medium and long at 65), and the defect this guards against is a LONG tier
	// that is no more decisive than the short one.
	if (Number.isFinite(ms) && Number.isFinite(ml) && ms <= ml)
		push('tier-amplitude', `short median ${ms} is not above long ${ml} — the tiers are not graded`);
	if (Number.isFinite(ms) && ms < 70)
		push('tier-amplitude', `short median ${ms} is under 70 — too little signal for a 10-question tier`);

	// signature polarity: a `sig` hint must not name a character the option scores AGAINST.
	//
	// `sig` is hand-placed character affinity, and nothing else checks it against the roster.
	// A hint on an option whose axis value is the opposite sign to that character's own
	// vector pulls the taker toward a result the very same answer scores them away from.
	//
	// Skipped for `_fixture`: its character vectors were SOLVED numerically to hit the audit's
	// correlation, twin and reachability targets, not authored to mean anything, so semantic
	// agreement between an option and a character is not a property it was ever built to have.
	// Its two flagged hints are also asserted by score.test.ts as engine coverage.
	for (const q of pack.id === '_fixture' ? [] : pack.questions) {
		for (const o of q.options) {
			for (const cid of Object.keys(o.sig ?? {})) {
				const c = pack.characters.find((x) => x.id === cid);
				if (!c) continue;
				for (const [axis, val] of Object.entries(o.v) as [string, number][]) {
					const cv = c.vector[axis] ?? 0;
					if (Math.abs(val) >= 40 && Math.abs(cv) >= 40 && Math.sign(val) !== Math.sign(cv)) {
						push(
							'sig-polarity',
							`${q.id}.${o.id} hints "${cid}" but scores ${axis}=${val} while ${cid} is ${cv}`
						);
						break;
					}
				}
			}
		}
	}

	// tiers: declared once each, nested, and counts matching the question bank
	const declared = pack.tiers.map((t) => t.id);
	for (const t of TIERS) {
		if (declared.filter((d) => d === t).length !== 1)
			push('tier-declaration', `tier "${t}" must be declared exactly once`);
	}
	let prev = -1;
	for (const t of TIERS) {
		const actual = questionsForTier(pack, t).length;
		const spec = pack.tiers.find((x) => x.id === t);
		if (spec && spec.questionCount !== actual)
			push('tier-count-mismatch', `${t}: declares ${spec.questionCount}, bank yields ${actual}`);
		if (actual <= prev)
			push('tier-nesting', `${t} yields ${actual} questions, not more than the tier below (${prev})`);
		prev = actual;
	}
	// calibration completeness + freshness
	const cal = pack.calibration;
	for (const a of axes) {
		if (cal.mean[a] === undefined) push('calibration-missing-mean', a);
		if (cal.sd[a] === undefined) push('calibration-missing-sd', a);
		if (cal.axisWeight[a] === undefined) push('calibration-missing-axis-weight', a);
	}
	for (const c of pack.characters) {
		if (cal.gravity[c.id] === undefined) push('calibration-missing-gravity', c.id);
	}
	for (const t of TIERS) {
		if (!cal.marginScale[t]) push('calibration-missing-margin-scale', t);
	}

	// A stale mean/sd silently mis-scores every respondent, so it is a hard failure with
	// an obvious remedy rather than a warning nobody reads.
	const derived = deriveStats(pack);
	const drifted = axes.filter(
		(a) =>
			Math.abs((cal.mean[a] ?? 0) - derived.mean[a]) > 1e-6 ||
			Math.abs((cal.sd[a] ?? 0) - derived.sd[a]) > 1e-6
	);
	if (drifted.length)
		push(
			'calibration-stale',
			`mean/sd disagree with the roster on: ${drifted.join(', ')} — run \`npm run calibrate -- ${pack.id}\``
		);

	return issues;
}

import { describe, expect, it } from 'vitest';
import { PACKS, getPack } from '../../src/lib/packs';
import { themeColorSources, themeVars } from '../../src/lib/engine/theme';
import { mixOklchOverHex, oklchToHex, paletteFor, type Palette } from './palette';

/**
 * The OG cards and the site must be the same colours. Satori can't parse oklch/color-mix,
 * so the card renderer uses an sRGB mirror — and nothing except this file enforces that the
 * mirror still matches.
 *
 * The previous version of this test could not do that job. It re-derived each pinned hex
 * from an oklch triple RETYPED HERE AS A LITERAL, so it compared palette.ts against the
 * test rather than against tokens.css: the two could drift together and still pass. Both
 * sides now derive from one `PackTheme`, and the check that carries weight is that the
 * mirror agrees with the CSS string the site actually ships, resolved back to sRGB by an
 * independent path.
 */

function assertHexWithinTolerance(actual: string, expected: string) {
	const a = parseInt(actual.slice(1), 16);
	const e = parseInt(expected.slice(1), 16);
	const channels = (n: number) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	const [ar, ag, ab] = channels(a);
	const [er, eg, eb] = channels(e);
	expect(Math.abs(ar - er), `red channel: ${actual} vs ${expected}`).toBeLessThanOrEqual(1);
	expect(Math.abs(ag - eg), `green channel: ${actual} vs ${expected}`).toBeLessThanOrEqual(1);
	expect(Math.abs(ab - eb), `blue channel: ${actual} vs ${expected}`).toBeLessThanOrEqual(1);
}

/**
 * Which shipped CSS token backs each palette key. Declared rather than inferred, so a token
 * that loses its mirror fails here instead of silently rendering the wrong card. Two of
 * these are composites — `glow-text` is a box-shadow and `scanline` is a gradient — which
 * is why the containment assertion below exists alongside the colour one.
 */
const TOKEN_OF: Record<keyof Palette, string> = {
	accentPrimary: 'accent-primary',
	accentSecondary: 'accent-secondary',
	textPrimary: 'text-primary',
	textSecondary: 'text-secondary',
	textFaint: 'text-faint',
	accentPrimaryDim: 'accent-primary-dim',
	bgBase: 'bg-base',
	surfaceRaised: 'surface-raised',
	ruleHairline: 'rule-hairline',
	ruleStrong: 'rule-strong',
	glowText: 'glow-text',
	scanlineStripe: 'scanline'
};

const OKLCH = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/;
const MIX = new RegExp(
	`^color-mix\\(in oklch,\\s*${OKLCH.source}\\s+([\\d.]+)%,\\s*(transparent|#[0-9a-fA-F]{6})\\)$`
);

/**
 * Independent re-implementation of what a browser does with the shipped string. Throws
 * rather than skipping: a colour form this cannot model is a card that renders wrong with
 * nothing in the build log, which is the failure mode the whole file exists to prevent.
 *
 * Note the two mix models are genuinely different and easy to conflate — `color-mix` over
 * `transparent` collapses to alpha on the source colour, while over a hex it is a real
 * Oklab blend.
 */
function resolveCss(value: string): string {
	const m = value.match(MIX);
	if (m) {
		const [l, c, h, pct, over] = [+m[1], +m[2], +m[3], +m[4] / 100, m[5]];
		if (over.toLowerCase() === 'transparent') {
			const hex = oklchToHex(l, c, h);
			const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
			return `rgba(${r},${g},${b},${pct})`;
		}
		return mixOklchOverHex(l, c, h, pct, over);
	}
	const p = value.match(new RegExp(`^${OKLCH.source}$`));
	if (p) return oklchToHex(+p[1], +p[2], +p[3]);
	if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
	throw new Error(
		`unparseable theme colour "${value}" — satori cannot render this and the mirror cannot model it`
	);
}

/*
 * Iterating PACKS is the point: adding a pack to the registry automatically adds its
 * palette tests, so a new pack cannot ship with no OG wiring at all — the failure the old
 * flat PALETTE object could not even express.
 */
describe.each(PACKS.map((p) => [p.id, p] as const))(
	'%s: OG palette mirrors the shipped CSS',
	(_id, pack) => {
		const palette = paletteFor(pack.theme);
		const sources = themeColorSources(pack.theme);
		const vars = themeVars(pack.theme);

		it.each(Object.keys(TOKEN_OF) as (keyof Palette)[])('%s', (key) => {
			const resolved = resolveCss(sources[key]);
			if (resolved.startsWith('#')) assertHexWithinTolerance(resolved, palette[key]);
			else expect(resolved).toBe(palette[key]);

			// ...and the token the browser actually gets still CONTAINS that colour. This is
			// what catches a composite (shadow, gradient) drifting away from what we mirrored.
			expect(vars[TOKEN_OF[key]]).toContain(sources[key]);
		});
	}
);

describe('star-wars is pinned', () => {
	/*
	 * The shipped pack must not move through any of this. These are the exact literals
	 * scripts/og/palette.ts hard-coded before the theme refactor — if a transcription typo
	 * crept into star-wars/theme.ts, every derivation above would agree with itself and
	 * only this test would notice.
	 */
	it('derives byte-identically to the pre-refactor palette literals', () => {
		expect(paletteFor(getPack('star-wars')!.theme)).toEqual({
			accentPrimary: '#88c9e2',
			accentSecondary: '#d4afdc',
			textPrimary: '#dfeef4',
			textSecondary: '#9baeb6',
			textFaint: '#64757c',
			accentPrimaryDim: '#2a3c45',
			bgBase: '#080b0f',
			surfaceRaised: '#0e151d',
			ruleHairline: 'rgba(136,201,226,0.22)',
			ruleStrong: 'rgba(136,201,226,0.45)',
			glowText: 'rgba(136,201,226,0.35)',
			scanlineStripe: 'rgba(136,201,226,0.05)'
		});
	});
});

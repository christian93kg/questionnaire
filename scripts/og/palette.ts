/**
 * sRGB colours for the OG card renderer — the satori half of a pack's theme.
 *
 * A pack's theme is stored as NUMBERS in `src/lib/engine/theme.ts`, and rendered twice:
 * `themeVars()` builds oklch()/color-mix() strings for the browser, and `paletteFor()`
 * below runs the same triples through Oklab -> linear sRGB -> sRGB (D65) for satori, whose
 * CSS parser (`parse-css-color`) understands only hex/rgb/hsl — and neither librsvg nor
 * resvg implement oklch or color-mix at all.
 *
 * This used to be a frozen object of hand-pinned hexes, with `palette.test.ts` re-deriving
 * each one from an oklch triple RETYPED IN THE TEST. That made three independent copies of
 * the same twelve colours (tokens.css, here, the test) of which only two were ever
 * compared — tokens.css could drift and nothing failed. Deriving from PackTheme collapses
 * that to one source; the test now closes the loop by parsing the CSS the site actually
 * ships and checking this mirror against it.
 */
import type { Oklch, PackTheme } from '../../src/lib/engine/theme';

export interface Palette {
	accentPrimary: string;
	accentSecondary: string;
	textPrimary: string;
	textSecondary: string;
	textFaint: string;
	accentPrimaryDim: string;
	bgBase: string;
	surfaceRaised: string;
	/** color-mix(..., transparent) collapses to plain alpha on the accent-primary channel. */
	ruleHairline: string;
	ruleStrong: string;
	glowText: string;
	scanlineStripe: string;
}

export function paletteFor(t: PackTheme): Palette {
	const rgba = (c: Oklch, pct: number) => {
		const hex = oklchToHex(...c);
		const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
		return `rgba(${r},${g},${b},${pct / 100})`;
	};
	return {
		accentPrimary: oklchToHex(...t.accentPrimary),
		accentSecondary: oklchToHex(...t.accentSecondary),
		textPrimary: oklchToHex(...t.textPrimary),
		textSecondary: oklchToHex(...t.textSecondary),
		textFaint: oklchToHex(...t.textFaint),
		accentPrimaryDim: mixOklchOverHex(
			...t.accentPrimary,
			t.mix.accentPrimaryDim / 100,
			t.bgBase
		),
		bgBase: t.bgBase,
		surfaceRaised: t.surfaceRaised,
		ruleHairline: rgba(t.accentPrimary, t.mix.ruleHairline),
		ruleStrong: rgba(t.accentPrimary, t.mix.ruleStrong),
		glowText: rgba(t.accentPrimary, t.mix.glowText),
		scanlineStripe: rgba(t.accentPrimary, t.mix.scanline)
	};
}

// --- oklch -> sRGB, D65 (Björn Ottosson's reference matrices) ---------------------------
//
// Also exported so palette.test.ts can resolve a shipped CSS string back to sRGB by an
// independent path and compare the two.

export function oklchToHex(L: number, C: number, hueDeg: number): string {
	const hRad = (hueDeg * Math.PI) / 180;
	return oklabToHex(L, C * Math.cos(hRad), C * Math.sin(hRad));
}

export function oklabToHex(L: number, a: number, b: number): string {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

	const l = l_ ** 3;
	const m = m_ ** 3;
	const s = s_ ** 3;

	const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

	return `#${[rLin, gLin, bLin].map(channelToHex).join('')}`;
}

export function hexToLinear(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	const r = (n >> 16) & 255;
	const g = (n >> 8) & 255;
	const b = n & 255;
	return [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)];
}

export function linearToOklab(r: number, g: number, b: number): [number, number, number] {
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);
	return [
		0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
		1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
	];
}

/** oklab of `mix%` of an oklch colour over a hex base — models color-mix(in oklch, ...). */
export function mixOklchOverHex(L: number, C: number, hueDeg: number, mix: number, baseHex: string): string {
	const hRad = (hueDeg * Math.PI) / 180;
	const top: [number, number, number] = [L, C * Math.cos(hRad), C * Math.sin(hRad)];
	const base = linearToOklab(...hexToLinear(baseHex));
	const blended = top.map((v, i) => mix * v + (1 - mix) * base[i]) as [number, number, number];
	return oklabToHex(...blended);
}

function srgbToLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
	const clamped = Math.max(0, Math.min(1, c));
	return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function channelToHex(linear: number): string {
	const v = Math.round(linearToSrgb(linear) * 255);
	return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
}

/**
 * sRGB colours for the OG card renderer.
 *
 * `src/lib/styles/tokens.css` defines the design system in oklch()/color-mix(), which is
 * correct for browsers but unusable here: satori's CSS parser (`parse-css-color`) only
 * understands hex/rgb/hsl, and neither librsvg nor resvg implement oklch or color-mix at
 * all. Every value below is a verified sRGB conversion of the matching token, computed
 * once and pinned as a literal so this file has no runtime dependency on a colour-math
 * library. `palette.test.ts` re-derives each one from its oklch triple (Oklab -> linear
 * sRGB -> sRGB, D65) and fails the moment this file and tokens.css drift apart.
 *
 * Token -> value mapping (see tokens.css for the source declarations):
 *   accent-primary      oklch(0.8 0.075 225)
 *   accent-secondary    oklch(0.8 0.075 320)
 *   text-primary        oklch(0.94 0.018 222)
 *   text-secondary      oklch(0.74 0.024 224)
 *   text-faint          oklch(0.55 0.022 226)
 *   accent-primary-dim  color-mix(in oklch, oklch(0.8 0.075 225) 30%, bg-base)
 *   bg-base             already hex in tokens.css
 *   surface-raised      already hex in tokens.css
 *   rule-hairline       color-mix(in oklch, accent-primary 22%, transparent) -> rgba alpha
 *   rule-strong         color-mix(in oklch, accent-primary 45%, transparent) -> rgba alpha
 *   glow-text           color-mix(in oklch, accent-primary 35%, transparent) -> rgba alpha
 *   scanline stripe     color-mix(in oklch, accent-primary 5%,  transparent) -> rgba alpha
 */

export const PALETTE = {
	accentPrimary: '#88c9e2',
	accentSecondary: '#d4afdc',
	textPrimary: '#dfeef4',
	textSecondary: '#9baeb6',
	textFaint: '#64757c',
	accentPrimaryDim: '#2a3c45',
	bgBase: '#080b0f',
	surfaceRaised: '#0e151d',

	/** color-mix(..., transparent) collapses to plain alpha on the accent-primary channel. */
	ruleHairline: 'rgba(136,201,226,0.22)',
	ruleStrong: 'rgba(136,201,226,0.45)',
	glowText: 'rgba(136,201,226,0.35)',
	scanlineStripe: 'rgba(136,201,226,0.05)'
} as const;

// --- oklch -> sRGB, D65 (Björn Ottosson's reference matrices) ---------------------------
//
// Exported so the test can re-derive PALETTE independently. Not used by og.ts at
// render time — satori gets the literals above.

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

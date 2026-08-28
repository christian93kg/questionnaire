/**
 * Pack theming — the shape lives here, the values live in each pack.
 *
 * The engine is fandom-agnostic, so it owns the *vocabulary* of a theme (which tokens
 * exist, how they compose) and never a colour. A pack owns the numbers. That split is
 * what lets `scripts/og/palette.ts` mirror a theme into sRGB for satori without either
 * side hand-copying the other's values — the historical failure this file exists to end,
 * where tokens.css, palette.ts and palette.test.ts were three independent copies of the
 * same twelve colours and only two of them were ever checked against each other.
 *
 * Colours are stored as NUMBERS, not CSS strings, because they have to be rendered twice
 * by two different consumers: `themeVars()` builds `oklch()` / `color-mix()` strings for
 * the browser, and `paletteFor()` in scripts/og/palette.ts runs the same triples through
 * Oklab -> sRGB for satori, which cannot parse either function. A theme stored as strings
 * would force the OG side to parse CSS; a theme stored as numbers makes both sides
 * derivations of one source.
 */

/** Perceptual lightness 0..1, chroma, hue in degrees. */
export type Oklch = readonly [l: number, c: number, h: number];

export interface PackTheme {
	/* --- colour, as numbers (see file header for why not strings) --- */
	accentPrimary: Oklch;
	accentSecondary: Oklch;
	textPrimary: Oklch;
	textSecondary: Oklch;
	textFaint: Oklch;

	/**
	 * Near-black surfaces, already sRGB. oklch buys nothing this close to black — the
	 * chroma is below the quantisation step — and keeping them hex means the OG mirror
	 * passes them through untouched instead of round-tripping them for no reason.
	 */
	bgBase: string;
	surfaceSunk: string;
	surfaceRaised: string;
	surfaceRaised2: string;

	/** `color-mix()` proportions, as percentages — the number that lands in the CSS. */
	mix: {
		ruleHairline: number;
		ruleStrong: number;
		accentPrimaryDim: number;
		accentSecondaryDim: number;
		glowSoft: number;
		glowText: number;
		scanline: number;
	};

	/** Blur radii in px for the two glow shadows. */
	glow: { softBlurPx: number; textBlurPx: number };

	/** Scanline geometry: an N-px stripe repeating every M px. */
	scanline: { stripePx: number; periodPx: number };

	fontDisplay: string;
	fontMono: string;

	/**
	 * Names of `@keyframes` declared in `src/lib/styles/animations.css`. Keyframes cannot
	 * be parameterised by a custom property, so a pack selects an animation by name rather
	 * than describing one; the registry is global because an unused `@keyframes` is inert.
	 */
	anim: { enter: string; idle: string };
}

/** The chrome strings in the shell header. Pack-owned so a second pack is not a reskin. */
export interface PackChrome {
	label: string;
	status: { idle: string; inProgress: string; sealed: string };
}

const OK = ([l, c, h]: Oklch) => `oklch(${l} ${c} ${h})`;
const MIX = (c: Oklch, pct: number, over: string) =>
	`color-mix(in oklch, ${OK(c)} ${pct}%, ${over})`;

/**
 * The bare colour behind each token the OG card mirrors.
 *
 * Exported separately from `themeVars()` so `scripts/og/palette.test.ts` can assert that a
 * *composite* token — `--glow-text` is a box-shadow, `--scanline` is a gradient — still
 * contains the colour the palette claims to mirror, without having to parse a shadow or a
 * gradient. Keys match `Palette`'s keys one-for-one, deliberately.
 */
export function themeColorSources(t: PackTheme) {
	return {
		accentPrimary: OK(t.accentPrimary),
		accentSecondary: OK(t.accentSecondary),
		textPrimary: OK(t.textPrimary),
		textSecondary: OK(t.textSecondary),
		textFaint: OK(t.textFaint),
		accentPrimaryDim: MIX(t.accentPrimary, t.mix.accentPrimaryDim, t.bgBase),
		bgBase: t.bgBase,
		surfaceRaised: t.surfaceRaised,
		ruleHairline: MIX(t.accentPrimary, t.mix.ruleHairline, 'transparent'),
		ruleStrong: MIX(t.accentPrimary, t.mix.ruleStrong, 'transparent'),
		glowText: MIX(t.accentPrimary, t.mix.glowText, 'transparent'),
		scanlineStripe: MIX(t.accentPrimary, t.mix.scanline, 'transparent')
	} as const;
}

/** Every custom property the components reference, keyed without the leading `--`. */
export function themeVars(t: PackTheme): Record<string, string> {
	const s = themeColorSources(t);
	return {
		'bg-base': t.bgBase,
		'surface-sunk': t.surfaceSunk,
		'surface-raised': t.surfaceRaised,
		'surface-raised-2': t.surfaceRaised2,
		'rule-hairline': s.ruleHairline,
		'rule-strong': s.ruleStrong,
		'text-primary': s.textPrimary,
		'text-secondary': s.textSecondary,
		'text-faint': s.textFaint,
		'accent-primary': s.accentPrimary,
		'accent-secondary': s.accentSecondary,
		'accent-primary-dim': s.accentPrimaryDim,
		'accent-secondary-dim': MIX(t.accentSecondary, t.mix.accentSecondaryDim, 'transparent'),
		'glow-soft': `0 0 ${t.glow.softBlurPx}px ${MIX(t.accentPrimary, t.mix.glowSoft, 'transparent')}`,
		'glow-text': `0 0 ${t.glow.textBlurPx}px ${s.glowText}`,
		'scanline':
			`repeating-linear-gradient(180deg, ${s.scanlineStripe} 0 ${t.scanline.stripePx}px, ` +
			`transparent ${t.scanline.stripePx}px ${t.scanline.periodPx}px)`,
		'font-display': t.fontDisplay,
		'font-mono': t.fontMono,
		'anim-enter': t.anim.enter,
		'anim-idle': t.anim.idle
	};
}

/**
 * A value that could close the `<style>` tag or the rule is a real hazard here, not a
 * hypothetical: the caller renders this with `{@html}` so the declarations land in the
 * prerendered HTML. Throwing fails the prerender loudly rather than shipping a broken
 * page — the same trade `src/lib/site.ts`'s `absolute()` makes on a missing origin.
 */
const CSS_SAFE = /^[^<>{};\\]*$/;

export function themeCss(t: PackTheme, selector = ':root'): string {
	const decls = Object.entries(themeVars(t)).map(([k, v]) => {
		if (!CSS_SAFE.test(v)) throw new Error(`theme token --${k} is not CSS-safe: ${v}`);
		return `--${k}:${v}`;
	});
	return `${selector}{${decls.join(';')}}`;
}

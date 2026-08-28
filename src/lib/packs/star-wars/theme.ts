/**
 * star-wars theme — the holo-blue intake terminal.
 *
 * Transcribed 1:1 from the `:root` block `src/lib/styles/tokens.css` shipped before
 * theming became per-pack. Nothing here is a redesign: `src/lib/engine/theme.test.ts`
 * pins `themeCss(THEME)` against the declarations that file used to carry, and
 * `scripts/og/palette.test.ts` pins the derived sRGB mirror against the hexes
 * `scripts/og/palette.ts` used to hard-code.
 *
 * `import type` only, and never from `$lib`. This module is loaded by `tsx` in
 * scripts/og.ts, scripts/audit.ts and scripts/calibrate.ts, and by vitest — none of which
 * resolve the `$lib` alias. A value import here breaks all four.
 */
import type { PackChrome, PackTheme } from '../../engine/theme';

export const THEME: PackTheme = {
	accentPrimary: [0.8, 0.075, 225],
	accentSecondary: [0.8, 0.075, 320],
	textPrimary: [0.94, 0.018, 222],
	textSecondary: [0.74, 0.024, 224],
	textFaint: [0.55, 0.022, 226],

	bgBase: '#080b0f',
	surfaceSunk: '#05070a',
	surfaceRaised: '#0e151d',
	surfaceRaised2: '#131c26',

	mix: {
		ruleHairline: 22,
		ruleStrong: 45,
		accentPrimaryDim: 30,
		accentSecondaryDim: 40,
		glowSoft: 18,
		glowText: 35,
		scanline: 5
	},

	glow: { softBlurPx: 28, textBlurPx: 18 },
	scanline: { stripePx: 1, periodPx: 3 },

	fontDisplay: "'Helvetica Neue', Helvetica, Arial, sans-serif",
	fontMono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",

	anim: { enter: 'holo-rise', idle: 'holo-flicker' }
};

/**
 * The shell header. These three status strings were hardcoded in the root layout and are
 * driven by route shape (landing / in-progress / sealed), not by pack state — the layout
 * still picks which one, the pack only supplies the words.
 */
export const CHROME: PackChrome = {
	label: 'Holo-record · intake',
	status: {
		idle: 'AWAITING SUBJECT',
		inProgress: 'SUBJECT PRESENT',
		sealed: 'RECORD SEALED'
	}
};

/**
 * harry-potter theme — ink, parchment and candle.
 *
 * Deliberately not the star-wars terminal in a different hue. That pack is cold,
 * blue-grey and back-lit, like a screen in a dark room; this one is warm, low and
 * front-lit, like a page under a candle. The shared type scale and spacing stay the same,
 * which is the point of the split — the two quizzes are the same *product* and different
 * *rooms*.
 *
 * `import type` only, and never from `$lib`. Loaded by `tsx` in scripts/og.ts,
 * scripts/audit.ts and scripts/calibrate.ts, and by vitest — none resolve the alias.
 */
import type { PackChrome, PackTheme } from '../../engine/theme';

export const THEME: PackTheme = {
	/** Candle. Warm amber, kept under L 0.8 so parchment text still reads as the brightest thing. */
	accentPrimary: [0.78, 0.115, 75],
	/** Oxblood — the ledger-ink second colour, for the axis poles and the opposite card. */
	accentSecondary: [0.55, 0.145, 25],

	textPrimary: [0.93, 0.022, 85],
	textSecondary: [0.74, 0.026, 82],
	textFaint: [0.55, 0.022, 78],

	// Warm near-blacks. star-wars' surfaces are blue-black (#080b0f); these carry the same
	// lightness with the hue pulled to the other side of neutral, which is most of why the
	// two pages read as different places before you have read a word.
	bgBase: '#0d0a07',
	surfaceSunk: '#080605',
	surfaceRaised: '#17110c',
	surfaceRaised2: '#201810',

	mix: {
		ruleHairline: 20,
		ruleStrong: 42,
		accentPrimaryDim: 28,
		accentSecondaryDim: 45,
		// Candlelight is a wider, softer falloff than a holo-projector's edge glow.
		glowSoft: 15,
		glowText: 26,
		// Ruled paper, not a CRT scanline: fainter and further apart, so it reads as the
		// faint horizontal rule of a page rather than as a screen artefact.
		scanline: 4
	},

	glow: { softBlurPx: 34, textBlurPx: 24 },
	scanline: { stripePx: 1, periodPx: 5 },

	fontDisplay: "'Iowan Old Style', Palatino, 'Palatino Linotype', Georgia, serif",
	/**
	 * NOTE: `fontMono` is the BODY face, not necessarily a monospace one. The token name is
	 * inherited from star-wars, where the body face happened to be mono; renaming it would
	 * touch every component for no behavioural gain. Here it is a text serif, because a
	 * monospaced body is a terminal tell and this room is a library.
	 */
	fontMono: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",

	anim: { enter: 'ink-settle', idle: 'candle-waver' }
};

/**
 * The shell header. star-wars runs an intake-record framing; this is the school's own
 * paperwork — a register that is opened, written in, and closed.
 */
export const CHROME: PackChrome = {
	label: 'The register · open',
	status: {
		idle: 'NO NAME ENTERED',
		inProgress: 'ENTRY IN PROGRESS',
		sealed: 'ENTRY CLOSED'
	}
};

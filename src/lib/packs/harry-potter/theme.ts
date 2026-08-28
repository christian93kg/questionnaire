/**
 * harry-potter theme — "The Ledger".
 *
 * Values as delivered by the Claude Design pass against
 * `_design/harry-potter.design-prompt.md` (project "Harry Potter questionnaire",
 * `Ledger Theme.dc.html`). Transcribed verbatim; the hex comments are the design's own
 * stated resolutions and the contrast ratios it measured are recorded below.
 *
 * The brief's stated trap was that "parchment" describes the register, not the background —
 * a parchment-cream `bgBase` would be a light-mode page. This design keeps every surface
 * under Y = 0.012 (the audit's ceiling is 0.15) and puts the warmth in hue rather than
 * lightness, which is the right resolution.
 *
 * What makes it a library rather than the star-wars terminal, in the designer's own terms:
 * the repeating line became a RULED PAGE instead of a raster. It runs at 28px — body
 * leading, not a scan period — at 4% mix, so text sits on the rules the way handwriting
 * sits on a ruled sheet. No bloom, no phosphor, no back-light.
 *
 * Measured contrast on `bgBase`: textPrimary 16.06:1, textSecondary 9.68:1,
 * textFaint 4.60:1, accentPrimary 9.74:1. All five oklch triples sit inside sRGB before
 * clamping (max chroma 0.09), so the social card and the browser resolve to the same hex.
 *
 * `import type` only, and never from `$lib`. Loaded by `tsx` in scripts/og.ts,
 * scripts/audit.ts and scripts/calibrate.ts, and by vitest — none resolve the alias.
 */
import type { PackChrome, PackTheme } from '../../engine/theme';

export const THEME: PackTheme = {
	/** Iron-gall amber — candle on paper. The writing hand. */
	accentPrimary: [0.78, 0.09, 72],
	/** Sanguine chalk — the counterweight, used for axis poles and the opposite card. */
	accentSecondary: [0.7, 0.08, 26],

	textPrimary: [0.93, 0.012, 80],
	textSecondary: [0.775, 0.016, 74],
	textFaint: [0.58, 0.018, 70],

	// Warm near-blacks. star-wars' surfaces are blue-black (#080b0f); these carry the same
	// order of lightness with the hue on the other side of neutral, which is most of why the
	// two pages read as different places before you have read a word.
	bgBase: '#0d0a07',
	surfaceSunk: '#080604',
	surfaceRaised: '#17120c',
	surfaceRaised2: '#211a12',

	mix: {
		ruleHairline: 14,
		ruleStrong: 30,
		accentPrimaryDim: 18,
		accentSecondaryDim: 16,
		glowSoft: 26,
		glowText: 34,
		// 4% at a 28px period: the rules of a page, not the raster of a screen.
		scanline: 4
	},

	glow: { softBlurPx: 26, textBlurPx: 18 },
	/** One-px rule every 28px — the body leading, so text sits ON the rules. */
	scanline: { stripePx: 1, periodPx: 28 },

	fontDisplay: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
	/**
	 * NOTE: `fontMono` is the BODY face, not necessarily a monospace one. The token name is
	 * inherited from star-wars, where the body happened to be mono; renaming it would touch
	 * every component for no behavioural gain. Here it is Charter — a text serif, because a
	 * monospaced body is a terminal tell and this room is a library.
	 */
	fontMono: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif",

	anim: { enter: 'ink-settle', idle: 'candle-draught' }
};

/**
 * The shell header. star-wars runs an intake-record framing; this is the book itself — a
 * ledger that is closed, written in, then sealed.
 */
export const CHROME: PackChrome = {
	label: 'Ledger · entry',
	status: {
		idle: 'CLOSED',
		inProgress: 'IN WRITING',
		sealed: 'SEALED'
	}
};

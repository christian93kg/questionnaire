import type { PackChrome, PackTheme } from '$lib/engine/theme';
import type { QuizPack } from '$lib/engine/types';
import harryPotter from './harry-potter';
import starWars from './star-wars';

/** Registration order. The landing page sorts by form code, so this is not display order. */
export const PACKS: QuizPack[] = [starWars, harryPotter];

/**
 * No longer a redirect target — `/` is a real landing page listing PACKS, and no longer the
 * source of the landing page's palette either (that is SITE_THEME). Retained because the
 * routing and tooling still reference a canonical default pack.
 */
export const DEFAULT_PACK_ID = 'star-wars';

/**
 * Chrome for routes that belong to no pack. Deliberately plain: the front page is the
 * hallway, and each quiz's theme should be the surprise behind its own door.
 */
export const SITE_CHROME: PackChrome = {
	label: 'Questionnaires',
	status: { idle: 'SELECT A FILE', inProgress: 'SELECT A FILE', sealed: 'SELECT A FILE' }
};

/**
 * The hallway's own palette, for routes that belong to no pack.
 *
 * This previously fell back to DEFAULT_PACK_ID's theme, which meant the landing page was
 * painted in star-wars' holo-blue — the same accent, background and face as the first quiz.
 * That is precisely the failure the landing brief names: whatever character the hallway
 * has belongs to whichever quiz shipped first, and looks more arbitrary with every quiz
 * added. The design's own rationale ends "the door itself gave nothing away"; a hallway in
 * one quiz's colours gives away that quiz.
 *
 * So: near-achromatic. Chroma is held at or below 0.012 throughout — enough to keep the
 * greys from going flat and dead, not enough to read as a hue, and deliberately far from
 * both shipped packs (star-wars sits at chroma 0.075 hue 225, harry-potter at 0.09 hue 72).
 * The faces are the plainest system stacks available rather than either pack's.
 *
 * When a third quiz lands, nothing here should need to change. That is the test.
 */
export const SITE_THEME: PackTheme = {
	accentPrimary: [0.8, 0.012, 250],
	accentSecondary: [0.7, 0.012, 250],
	textPrimary: [0.95, 0.006, 250],
	textSecondary: [0.78, 0.008, 250],
	textFaint: [0.62, 0.01, 250],

	bgBase: '#0b0c0e',
	surfaceSunk: '#08090a',
	surfaceRaised: '#14161a',
	surfaceRaised2: '#1c1f24',

	mix: {
		ruleHairline: 18,
		ruleStrong: 40,
		accentPrimaryDim: 24,
		accentSecondaryDim: 24,
		glowSoft: 0,
		// No glow at all on the hallway: a lit page is a page with a mood.
		glowText: 0,
		// No overlay either — neither a scanline nor a ruled page, since both are somebody's
		// texture. The surface is just a surface.
		scanline: 0
	},

	glow: { softBlurPx: 0, textBlurPx: 0 },
	scanline: { stripePx: 0, periodPx: 1 },

	fontDisplay:
		'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	fontMono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',

	anim: { enter: 'site-rise', idle: 'site-still' }
};

export function getPack(id: string): QuizPack | undefined {
	return PACKS.find((p) => p.id === id);
}

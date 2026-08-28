import { PACKS } from '$lib/packs';

export const prerender = true;

/**
 * The front door. This was a 307 to DEFAULT_PACK_ID, which was right while there was
 * exactly one quiz and wrong the moment there were two.
 *
 * No `pack` key is returned, deliberately: `page.data.pack` staying undefined is the
 * signal the root layout uses to pick SITE_CHROME over a quiz's own chrome.
 */
export function load() {
	return {
		packs: PACKS.map((p) => ({
			id: p.id,
			title: p.title,
			formCode: p.formCode,
			eyebrow: p.intro.eyebrow,
			characterCount: p.characters.length,
			questionCount: p.questions.length,
			estMinutes: Math.min(...p.tiers.map((t) => t.estMinutes))
		}))
	};
}

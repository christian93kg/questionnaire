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
		/**
		 * Alphabetical by form code, fixed — per the landing design's scaling answer.
		 *
		 * Deliberately not newest-first and not most-taken: both of those imply a
		 * recommendation, and the quizzes are peers. The order is arbitrary but visibly
		 * mechanical, which is what stops any one of them reading as the featured slot.
		 */
		packs: [...PACKS]
			.sort((a, b) => a.formCode.localeCompare(b.formCode))
			.map((p) => ({
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

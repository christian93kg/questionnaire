import { error } from '@sveltejs/kit';
import { PACKS, getPack } from '$lib/packs';

export const prerender = true;

/**
 * One static route per character. GitHub Pages has no SSR, so without this every shared
 * link would preview identically in a chat app — the crawler never runs the JS that
 * decodes ?a=. The slug is cosmetic for scoring; it exists for the OG card.
 */
export function entries() {
	return PACKS.flatMap((p) => p.characters.map((c) => ({ pack: p.id, character: c.id })));
}

export function load({ params }) {
	const pack = getPack(params.pack);
	if (!pack) error(404, 'No such questionnaire');
	const character = pack.characters.find((c) => c.id === params.character);
	if (!character) error(404, 'No such result');
	return { pack, character };
}

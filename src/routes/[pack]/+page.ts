import { error } from '@sveltejs/kit';
import { PACKS, getPack } from '$lib/packs';

export const prerender = true;

export function entries() {
	return PACKS.map((p) => ({ pack: p.id }));
}

export function load({ params }) {
	const pack = getPack(params.pack);
	if (!pack) error(404, 'No such questionnaire');
	return { pack };
}

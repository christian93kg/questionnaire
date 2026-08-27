import { error } from '@sveltejs/kit';
import { PACKS, getPack } from '$lib/packs';
import { questionsForTier } from '$lib/engine/score';
import type { TierId } from '$lib/engine/types';

export const prerender = true;

export function entries() {
	return PACKS.flatMap((p) => p.tiers.map((t) => ({ pack: p.id, tier: t.id })));
}

export function load({ params }) {
	const pack = getPack(params.pack);
	if (!pack) error(404, 'No such questionnaire');
	const tier = pack.tiers.find((t) => t.id === params.tier);
	if (!tier) error(404, 'No such length');
	return { pack, tier, questions: questionsForTier(pack, tier.id as TierId) };
}

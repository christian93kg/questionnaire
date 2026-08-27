import type { QuizPack } from '$lib/engine/types';
import starWars from './star-wars';

export const PACKS: QuizPack[] = [starWars];

export const DEFAULT_PACK_ID = 'star-wars';

export function getPack(id: string): QuizPack | undefined {
	return PACKS.find((p) => p.id === id);
}

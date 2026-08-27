import type { QuizPack } from './types';

export type Rarity = 'rare' | 'uncommon' | 'common';

/** Below this simulated win rate a result is worth calling out on the card. */
const RARE = 0.01;
const UNCOMMON = 0.025;

/**
 * Rarity is read from the calibrator's simulated win rate, not authored by hand — so it
 * cannot drift away from what the scoring actually does. `desiredShare` is the target the
 * solver aims at; `audit.winRate` is what it hit, and only the latter is honest here.
 */
export function rarityOf(pack: QuizPack, characterId: string): Rarity {
	const rate = pack.calibration.audit?.winRate?.[characterId];
	if (typeof rate !== 'number' || rate <= 0) return 'common';
	if (rate < RARE) return 'rare';
	if (rate < UNCOMMON) return 'uncommon';
	return 'common';
}

/** Percentage of respondents who land here, for display. Null when uncalibrated. */
export function shareOf(pack: QuizPack, characterId: string): number | null {
	const rate = pack.calibration.audit?.winRate?.[characterId];
	if (typeof rate !== 'number' || rate <= 0) return null;
	return rate * 100;
}

export function rarityLabel(pack: QuizPack, characterId: string): string | null {
	const share = shareOf(pack, characterId);
	if (share === null) return null;
	const rarity = rarityOf(pack, characterId);
	if (rarity === 'common') return null;
	const shown = share < 1 ? share.toFixed(1) : Math.round(share).toString();
	return `${rarity === 'rare' ? 'Rare' : 'Uncommon'} · ${shown}% land here`;
}

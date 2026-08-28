import type { PackChrome } from '$lib/engine/theme';
import type { QuizPack } from '$lib/engine/types';
import harryPotter from './harry-potter';
import starWars from './star-wars';

/** Order here is the order the landing page lists them in. */
export const PACKS: QuizPack[] = [starWars, harryPotter];

/**
 * No longer a redirect target — `/` is a real landing page listing PACKS. This is now the
 * pack whose *theme* dresses the routes that belong to no pack (the landing page, any
 * error page), because the shell still needs a set of colour tokens to paint with.
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

export function getPack(id: string): QuizPack | undefined {
	return PACKS.find((p) => p.id === id);
}

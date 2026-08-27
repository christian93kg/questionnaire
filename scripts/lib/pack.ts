import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AxisId, QuizPack } from '../../src/lib/engine/types';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..', '..');
export const PACKS_ROOT = join(REPO_ROOT, 'src', 'lib', 'packs');

export function packDir(packId: string): string {
	return join(PACKS_ROOT, packId);
}

/** Every directory under src/lib/packs that has an index.ts. */
export function listPacks(): string[] {
	if (!existsSync(PACKS_ROOT)) return [];
	return readdirSync(PACKS_ROOT)
		.filter((name) => {
			const dir = join(PACKS_ROOT, name);
			return statSync(dir).isDirectory() && existsSync(join(dir, 'index.ts'));
		})
		.sort();
}

function isQuizPack(v: unknown): v is QuizPack {
	if (typeof v !== 'object' || v === null) return false;
	const p = v as Partial<QuizPack>;
	return (
		typeof p.id === 'string' &&
		Array.isArray(p.axes) &&
		Array.isArray(p.characters) &&
		Array.isArray(p.questions) &&
		Array.isArray(p.tiers)
	);
}

/**
 * Load a pack by id. Packs are resolved at runtime, not imported statically, so a
 * pack that is still being authored simply doesn't exist yet rather than breaking
 * the build of the tools that will eventually check it.
 */
export async function loadPack(packId: string): Promise<QuizPack> {
	const entry = join(packDir(packId), 'index.ts');
	if (!existsSync(entry)) {
		const available = listPacks();
		throw new Error(
			`pack "${packId}" not found: expected ${entry}\n` +
				(available.length
					? `available packs: ${available.join(', ')}`
					: `no packs exist yet under ${PACKS_ROOT}`)
		);
	}

	const mod: Record<string, unknown> = await import(pathToFileURL(entry).href);
	const candidates = [mod.default, mod.pack, mod[`${packId}Pack`], mod[packId]];
	const found = candidates.find(isQuizPack);
	if (!found) {
		throw new Error(
			`pack "${packId}" at ${entry} exports no QuizPack.\n` +
				`expected a default export, or a named export "pack" / "${packId}Pack".`
		);
	}
	if (found.id !== packId) {
		throw new Error(`pack at ${entry} declares id "${found.id}" but lives in directory "${packId}"`);
	}
	return found;
}

export function axisIds(pack: QuizPack): AxisId[] {
	return pack.axes.map((a) => a.id);
}

import { describe, expect, it, vi } from 'vitest';
import { glyphFor } from './glyph';
import { starWars } from '../packs/star-wars';
import { fixturePack } from '../packs/_fixture';
import type { Character, QuizPack } from './types';

const COLS = 40;
const ROWS = 20;

function hammingFraction(a: string[], b: string[]): number {
	const flatA = a.join('');
	const flatB = b.join('');
	let diff = 0;
	for (let i = 0; i < flatA.length; i++) if (flatA[i] !== flatB[i]) diff++;
	return diff / flatA.length;
}

/** Clone `pack` with one character's vector replaced. Everything else is shared. */
function withVector(pack: QuizPack, characterId: string, vector: Character['vector']): QuizPack {
	return {
		...pack,
		characters: pack.characters.map((c) => (c.id === characterId ? { ...c, vector } : c))
	};
}

describe('glyphFor contract', () => {
	it('throws for an unknown character id', () => {
		expect(() => glyphFor(starWars, 'does-not-exist')).toThrow();
	});

	it('throws for a grid smaller than 2x2', () => {
		expect(() => glyphFor(starWars, 'vader', 1, 20)).toThrow();
		expect(() => glyphFor(starWars, 'vader', 40, 1)).toThrow();
	});
});

describe('determinism', () => {
	it('produces byte-identical output across repeated calls', () => {
		const first = glyphFor(starWars, 'vader');
		const second = glyphFor(starWars, 'vader');
		expect(second).toEqual(first);
	});

	it('produces byte-identical output for every character across repeated calls', () => {
		for (const c of starWars.characters) {
			expect(glyphFor(starWars, c.id)).toEqual(glyphFor(starWars, c.id));
		}
	});

	it('produces identical output after a fresh module re-import', async () => {
		const before = glyphFor(starWars, 'yoda');
		vi.resetModules();
		const fresh = await import('./glyph');
		const after = fresh.glyphFor(starWars, 'yoda');
		expect(after).toEqual(before);
	});
});

describe('dimensions', () => {
	it('returns exactly rows strings of exactly cols characters at the default size', () => {
		const g = glyphFor(starWars, 'vader');
		expect(g).toHaveLength(ROWS);
		for (const row of g) expect(row).toHaveLength(COLS);
	});

	it('honours a custom cols x rows', () => {
		const g = glyphFor(starWars, 'vader', 12, 6);
		expect(g).toHaveLength(6);
		for (const row of g) expect(row).toHaveLength(12);
	});

	it('every row is the same length regardless of content', () => {
		for (const c of starWars.characters) {
			const g = glyphFor(starWars, c.id);
			const lengths = new Set(g.map((r) => r.length));
			expect(lengths.size).toBe(1);
			expect([...lengths][0]).toBe(COLS);
		}
	});
});

describe('distinctness', () => {
	it('renders substantially different grids for characters with very different vectors', () => {
		// Vader and Yoda sit near-opposite on several axes (order, candor, warmth,
		// hope, volatility) -- a generator that collapses axes to noise or to a
		// near-constant shape would fail this even though it might pass a single
		// close-pair check.
		const a = glyphFor(starWars, 'vader');
		const b = glyphFor(starWars, 'yoda');
		expect(hammingFraction(a, b)).toBeGreaterThan(0.2);
	});
});

describe('channel sensitivity', () => {
	// A neutral baseline (every axis at 0) isolates each perturbation: with everything
	// else silent, a change on axis i must be the only thing moving the render.
	function neutralVector(pack: QuizPack): Character['vector'] {
		const v: Character['vector'] = {};
		for (const axis of pack.axes) v[axis.id] = 0;
		return v;
	}

	it('changing any single axis changes the render, for every axis in the pack', () => {
		const characterId = starWars.characters[0].id;
		const basePack = withVector(starWars, characterId, neutralVector(starWars));
		const base = glyphFor(basePack, characterId);

		for (const axis of starWars.axes) {
			const perturbedVector = { ...neutralVector(starWars), [axis.id]: 70 };
			const perturbedPack = withVector(starWars, characterId, perturbedVector);
			const perturbed = glyphFor(perturbedPack, characterId);
			expect(
				hammingFraction(base, perturbed),
				`axis "${axis.id}" (index ${starWars.axes.indexOf(axis)}) did not move the render`
			).toBeGreaterThan(0);
		}
	});
});

describe('cross-pack support', () => {
	it('renders a non-7-axis pack without error, at the correct dimensions', () => {
		expect(fixturePack.axes.length).not.toBe(7);
		for (const c of fixturePack.characters) {
			const g = glyphFor(fixturePack, c.id);
			expect(g).toHaveLength(ROWS);
			for (const row of g) expect(row).toHaveLength(COLS);
		}
	});

	it('still varies per character on a non-7-axis pack', () => {
		const ids = fixturePack.characters.map((c) => c.id).slice(0, 2);
		const [a, b] = ids.map((id) => glyphFor(fixturePack, id));
		expect(hammingFraction(a, b)).toBeGreaterThan(0);
	});
});

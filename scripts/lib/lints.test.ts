import { describe, expect, it } from 'vitest';
import type { QuizPack } from '../../src/lib/engine/types';
import { fixturePack } from '../../src/lib/packs/_fixture';
import {
	axisCorrelation,
	checkReachability,
	effectiveDimensions,
	findGeneralists,
	findTwins,
	LIMITS,
	structuralIssues
} from './lints';

/** Deep-ish clone so a mutation test cannot leak into the next case. */
function clone(pack: QuizPack): QuizPack {
	return structuredClone(pack) as QuizPack;
}

describe('the fixture pack clears every lint', () => {
	it('structure', () => {
		expect(structuralIssues(fixturePack)).toEqual([]);
	});
	it('axis correlation', () => {
		expect(axisCorrelation(fixturePack).max).toBeLessThanOrEqual(LIMITS.maxAxisCorrelation);
	});
	it('effective dimensions', () => {
		expect(effectiveDimensions(fixturePack)).toBeGreaterThanOrEqual(LIMITS.minEffectiveDimensions);
	});
	it('twins', () => {
		expect(findTwins(fixturePack)).toEqual([]);
	});
	it('no generalists', () => {
		expect(findGeneralists(fixturePack)).toEqual([]);
	});
	it('reachability', () => {
		expect(checkReachability(fixturePack, 'long', { seed: 0x5eed, restarts: 8 }).unreachable).toEqual(
			[]
		);
	});
});

describe('the lints actually catch what they claim to', () => {
	it('flags a duplicated character as a twin', () => {
		const p = clone(fixturePack);
		p.characters.push({ ...p.characters[0], id: 'sentinel_copy', name: 'Copy' });
		p.calibration.gravity.sentinel_copy = 1;
		const twins = findTwins(p);
		expect(twins.map(([a, b]) => [a, b])).toContainEqual(['sentinel', 'sentinel_copy']);
	});

	it('flags a character with no strong negatives', () => {
		const p = clone(fixturePack);
		p.characters[0].vector = { resolve: 10, candor: 5, order: 0, warmth: -10, risk: 5 };
		expect(findGeneralists(p).map((g) => g.id)).toContain('sentinel');
	});

	it('flags a missing axis key, a bad primaryAxis and a bogus sig target', () => {
		const p = clone(fixturePack);
		delete p.characters[1].vector.order;
		p.questions[0].primaryAxis = 'charisma';
		p.questions[1].options[0].sig = { nobody: 1 };
		const rules = structuralIssues(p).map((i) => i.rule);
		expect(rules).toContain('character-missing-axis');
		expect(rules).toContain('question-undeclared-primary-axis');
		expect(rules).toContain('sig-unknown-character');
	});

	it('flags a tier whose declared count no longer matches the bank', () => {
		const p = clone(fixturePack);
		p.tiers[0].questionCount = 99;
		expect(structuralIssues(p).map((i) => i.rule)).toContain('tier-count-mismatch');
	});

	it('flags a stale calibration', () => {
		const p = clone(fixturePack);
		p.calibration.mean.resolve = 999;
		expect(structuralIssues(p).map((i) => i.rule)).toContain('calibration-stale');
	});

	it('flags an unreachable character', () => {
		const p = clone(fixturePack);
		// Park a character at the roster centroid: it can never out-cosine a specialist.
		p.characters.push({
			...p.characters[0],
			id: 'nowhere',
			name: 'Nowhere',
			vector: { resolve: -14, candor: -26, order: -16, warmth: -26, risk: -24 }
		});
		p.calibration.gravity.nowhere = 0.65;
		expect(checkReachability(p, 'long', { seed: 1, restarts: 4 }).unreachable).toContain('nowhere');
	});
});

import { describe, expect, it } from 'vitest';
import { scoreQuiz } from '../../src/lib/engine/score';
import type { TierId } from '../../src/lib/engine/types';
import { fixturePack } from '../../src/lib/packs/_fixture';
import { scoreOf, TierScorer, topMargin, winnerIndex } from './fastscore';
import { RespondentSampler } from './respondents';
import { makeRng } from './rng';

const TIERS: TierId[] = ['short', 'medium', 'long'];

/**
 * The calibration solver does not call scoreQuiz in its inner loop, so this is the
 * contract that keeps it honest: if score.ts changes, these fail rather than the
 * next calibration silently fitting a model the site does not use.
 */
describe('TierScorer mirrors the shipped engine', () => {
	const gravity = Float64Array.from(
		fixturePack.characters,
		(c) => fixturePack.calibration.gravity[c.id] ?? 1
	);
	const ids = fixturePack.characters.map((c) => c.id);

	for (const tier of TIERS) {
		it(`agrees with scoreQuiz on tier "${tier}"`, () => {
			const scorer = new TierScorer(fixturePack, tier);
			const rng = makeRng(20260827);
			const raw = new Float64Array(ids.length);

			for (let trial = 0; trial < 400; trial++) {
				const answers = Array.from(scorer.optionCounts, (n) => rng.int(n));
				const truth = scoreQuiz(fixturePack, tier, answers);
				scorer.raw(answers, raw);

				expect(ids[winnerIndex(raw, gravity, ids)]).toBe(truth.winner);
				for (const entry of truth.ranked) {
					const c = ids.indexOf(entry.characterId);
					expect(raw[c]).toBeCloseTo(entry.raw, 12);
					expect(scoreOf(raw[c], gravity[c])).toBeCloseTo(entry.score, 12);
				}
				expect(topMargin(raw, gravity)).toBeCloseTo(
					truth.ranked[0].score - truth.ranked[1].score,
					12
				);
			}
		});
	}
});

describe('simulation is deterministic', () => {
	it('produces identical respondents for the same seed', () => {
		const sampler = new RespondentSampler(fixturePack);
		const draw = (seed: number): string => {
			const rng = makeRng(seed);
			const out = new Int32Array(sampler.questionCount);
			const acc: number[] = [];
			for (let i = 0; i < 50; i++) {
				sampler.draw(rng, 'coherent', out);
				acc.push(...out);
			}
			return acc.join('');
		};
		expect(draw(7)).toBe(draw(7));
		expect(draw(7)).not.toBe(draw(8));
	});

	it('never touches Math.random', () => {
		const original = Math.random;
		Math.random = () => {
			throw new Error('scripts must not use Math.random');
		};
		try {
			const sampler = new RespondentSampler(fixturePack);
			const rng = makeRng(1);
			const out = new Int32Array(sampler.questionCount);
			sampler.draw(rng, 'coherent', out);
			sampler.draw(rng, 'uniform', out);
			expect(out.length).toBe(fixturePack.questions.length);
		} finally {
			Math.random = original;
		}
	});
});

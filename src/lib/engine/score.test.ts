import { describe, expect, it } from 'vitest';
import {
	accumulate,
	answerCode,
	characterCosine,
	deriveStats,
	maxSignaturePerCharacter,
	questionsForTier,
	rank,
	scoreQuiz,
	sectionsForTier,
	sortRanked
} from './score';
import type { Character, QuizPack, TierId } from './types';
import { fixturePack } from '../packs/_fixture';
import { starWars } from '../packs/star-wars';
import { makeRng } from '../../../scripts/lib/rng';

const TIERS: TierId[] = ['short', 'medium', 'long'];

/**
 * Minimal hand-built pack used where the fixture pack's 12-character roster is too rich
 * to reason about by hand. Two axes, few questions, calibration derived via deriveStats
 * itself (so the calibration is trustworthy without hand computation) plus flat
 * axisWeight/gravity so `rank()` behaves as simply as possible.
 */
function miniPack(): QuizPack {
	const axes = [
		{ id: 'a', label: 'A', negative: { label: 'Neg', blurb: '' }, positive: { label: 'Pos', blurb: '' } },
		{ id: 'b', label: 'B', negative: { label: 'Neg', blurb: '' }, positive: { label: 'Pos', blurb: '' } }
	];
	const characters: Character[] = [
		{ id: 'c1', name: 'C1', epithet: '', vector: { a: 50, b: 50 }, blurb: '', strength: '', blindspot: '', region: 'x' },
		{ id: 'c2', name: 'C2', epithet: '', vector: { a: 60, b: 40 }, blurb: '', strength: '', blindspot: '', region: 'x' },
		{ id: 'c3', name: 'C3', epithet: '', vector: { a: 40, b: 60 }, blurb: '', strength: '', blindspot: '', region: 'x' }
	];
	const questions = [
		{
			id: 'qa',
			text: 'qa',
			tier: 'short' as const,
			primaryAxis: 'a',
			options: [
				{ id: 'qaa', text: 'a', v: { a: 80 } },
				{ id: 'qab', text: 'b', v: { a: -80 } }
			]
		},
		{
			id: 'qb',
			text: 'qb',
			tier: 'short' as const,
			primaryAxis: 'b',
			options: [
				{ id: 'qba', text: 'a', v: { b: 80 } },
				{ id: 'qbb', text: 'b', v: { b: -80 } }
			]
		}
	];
	const partial = {
		id: 'mini',
		version: 1,
		title: 'mini',
		formCode: 'MN-01',
		intro: { eyebrow: '', lede: [], fine: '' },
		axes,
		characters,
		questions,
		tiers: [{ id: 'short' as const, label: '', blurb: '', questionCount: questions.length, estMinutes: 1 }],
		signatureWeight: 0
	};
	const stats = deriveStats(partial as unknown as QuizPack);
	const calibration = {
		mean: stats.mean,
		sd: stats.sd,
		axisWeight: { a: 1, b: 1 },
		gravity: { c1: 1, c2: 1, c3: 1 },
		marginScale: { short: 0.05, medium: 0.05, long: 0.05 },
		simulations: 0,
		generatedAt: '',
		audit: { winRate: {}, unreachable: [], maxAxisCorrelation: 0, effectiveDimensions: 0, twins: [] }
	};
	// theme/chrome are required on QuizPack but irrelevant to scoring; borrowing the
	// fixture's keeps these doubles honest without a second literal to maintain.
	return {
		...partial,
		calibration,
		theme: fixturePack.theme,
		chrome: fixturePack.chrome
	} as QuizPack;
}

/** A pack where one axis is asked 20x and another only once, same option magnitude. */
function coveragePack(manyCount: number): QuizPack {
	const axes = [
		{ id: 'manyAxis', label: 'Many', negative: { label: 'Neg', blurb: '' }, positive: { label: 'Pos', blurb: '' } },
		{ id: 'onceAxis', label: 'Once', negative: { label: 'Neg', blurb: '' }, positive: { label: 'Pos', blurb: '' } }
	];
	const characters: Character[] = [
		{ id: 'manyChar', name: 'ManyChar', epithet: '', vector: { manyAxis: 80, onceAxis: 0 }, blurb: '', strength: '', blindspot: '', region: 'x' },
		{ id: 'onceChar', name: 'OnceChar', epithet: '', vector: { manyAxis: 0, onceAxis: 80 }, blurb: '', strength: '', blindspot: '', region: 'x' }
	];
	const questions = [];
	for (let i = 0; i < manyCount; i++) {
		questions.push({
			id: `many${i}`,
			text: `many ${i}`,
			tier: 'short' as const,
			primaryAxis: 'manyAxis',
			options: [
				{ id: `many${i}a`, text: 'a', v: { manyAxis: 80 } },
				{ id: `many${i}b`, text: 'b', v: { manyAxis: -80 } }
			]
		});
	}
	questions.push({
		id: 'once0',
		text: 'once',
		tier: 'short' as const,
		primaryAxis: 'onceAxis',
		options: [
			{ id: 'once0a', text: 'a', v: { onceAxis: 80 } },
			{ id: 'once0b', text: 'b', v: { onceAxis: -80 } }
		]
	});
	const partial = {
		id: 'coverage',
		version: 1,
		title: 'coverage',
		formCode: 'CV-01',
		intro: { eyebrow: '', lede: [], fine: '' },
		axes,
		characters,
		questions,
		tiers: [{ id: 'short' as const, label: '', blurb: '', questionCount: questions.length, estMinutes: 1 }],
		signatureWeight: 0
	};
	const stats = deriveStats(partial as unknown as QuizPack);
	const calibration = {
		mean: stats.mean,
		sd: stats.sd,
		axisWeight: { manyAxis: 1, onceAxis: 1 },
		gravity: { manyChar: 1, onceChar: 1 },
		marginScale: { short: 0.05, medium: 0.05, long: 0.05 },
		simulations: 0,
		generatedAt: '',
		audit: { winRate: {}, unreachable: [], maxAxisCorrelation: 0, effectiveDimensions: 0, twins: [] }
	};
	// theme/chrome are required on QuizPack but irrelevant to scoring; borrowing the
	// fixture's keeps these doubles honest without a second literal to maintain.
	return {
		...partial,
		calibration,
		theme: fixturePack.theme,
		chrome: fixturePack.chrome
	} as QuizPack;
}

describe('scoreQuiz answer-count contract', () => {
	it('throws when there are too few answers', () => {
		expect(() => scoreQuiz(fixturePack, 'short', [0, 0, 0])).toThrow();
	});

	it('throws when there are too many answers', () => {
		expect(() => scoreQuiz(fixturePack, 'short', [0, 0, 0, 0, 0])).toThrow();
	});

	it('throws for the medium tier with the short tier answer count', () => {
		const shortAnswers = questionsForTier(fixturePack, 'short').map(() => 0);
		expect(() => scoreQuiz(fixturePack, 'medium', shortAnswers)).toThrow();
	});
});

describe('determinism', () => {
	it('produces an identical result for identical inputs, across tiers', () => {
		for (const tier of TIERS) {
			const answers = questionsForTier(fixturePack, tier).map((_, i) => (i * 3 + 1) % 4);
			const first = scoreQuiz(fixturePack, tier, answers);
			const second = scoreQuiz(fixturePack, tier, answers);
			const third = scoreQuiz(fixturePack, tier, [...answers]);
			expect(second).toEqual(first);
			expect(third).toEqual(first);
		}
	});
});

describe('ranked', () => {
	it('is sorted descending by score and contains every character exactly once', () => {
		const rng = makeRng(42);
		for (const tier of TIERS) {
			const qs = questionsForTier(fixturePack, tier);
			for (let trial = 0; trial < 20; trial++) {
				const answers = qs.map(() => rng.int(4));
				const { ranked } = scoreQuiz(fixturePack, tier, answers);
				expect(ranked).toHaveLength(fixturePack.characters.length);
				expect(new Set(ranked.map((r) => r.characterId)).size).toBe(fixturePack.characters.length);
				for (let i = 1; i < ranked.length; i++) {
					expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
				}
				ranked.forEach((r, i) => expect(r.rank).toBe(i));
			}
		}
	});
});

describe('crew', () => {
	it('never contains the winner, never exceeds 3, and stays outside the twin-cosine radius', () => {
		const axes = fixturePack.axes.map((a) => a.id);
		const rng = makeRng(1234);
		for (const tier of TIERS) {
			const qs = questionsForTier(fixturePack, tier);
			for (let trial = 0; trial < 30; trial++) {
				const answers = qs.map(() => rng.int(4));
				const { winner, crew } = scoreQuiz(fixturePack, tier, answers);
				expect(crew.length).toBeLessThanOrEqual(3);
				expect(crew).not.toContain(winner);
				expect(new Set(crew).size).toBe(crew.length);
				for (const memberId of crew) {
					expect(characterCosine(fixturePack, winner, memberId, axes)).toBeLessThanOrEqual(0.9);
				}
			}
		}
	});
});

describe('opposite', () => {
	it('is the character with the minimum cosine when that minimum is below -0.15, and null otherwise', () => {
		// Two axes, three characters clustered along the same diagonal (c1 in the middle).
		// Answering purely "positive" or purely "negative" on both axes lands the user
		// exactly on the roster mean's opposite corner from nobody in particular (cos 0
		// against everyone) -- opposite must be null. Answering the two axes in opposite
		// directions produces a real anti-correlated character -- opposite must be set.
		const pack = miniPack();

		const bothPositive = scoreQuiz(pack, 'short', [0, 0]);
		expect(Math.min(...bothPositive.ranked.map((r) => r.cos))).toBeCloseTo(0, 9);
		expect(bothPositive.opposite).toBeNull();

		const bothNegative = scoreQuiz(pack, 'short', [1, 1]);
		expect(Math.min(...bothNegative.ranked.map((r) => r.cos))).toBeCloseTo(0, 9);
		expect(bothNegative.opposite).toBeNull();

		const mixed = scoreQuiz(pack, 'short', [0, 1]);
		const mixedMinCos = Math.min(...mixed.ranked.map((r) => r.cos));
		expect(mixedMinCos).toBeLessThan(-0.15);
		expect(mixed.opposite).toBe('c3');
		expect(mixed.ranked.find((r) => r.characterId === mixed.opposite)!.cos).toBeCloseTo(mixedMinCos, 9);

		const mixedOther = scoreQuiz(pack, 'short', [1, 0]);
		expect(mixedOther.opposite).toBe('c2');
	});

	it('holds the null/min-cos invariant across many random fixture-pack answers', () => {
		const rng = makeRng(99);
		for (const tier of TIERS) {
			const qs = questionsForTier(fixturePack, tier);
			for (let trial = 0; trial < 40; trial++) {
				const answers = qs.map(() => rng.int(4));
				const { ranked, opposite } = scoreQuiz(fixturePack, tier, answers);
				const minCos = Math.min(...ranked.map((r) => r.cos));
				if (opposite === null) {
					expect(minCos).toBeGreaterThanOrEqual(-0.15);
				} else {
					expect(minCos).toBeLessThan(-0.15);
					expect(ranked.find((r) => r.characterId === opposite)!.cos).toBeCloseTo(minCos, 9);
				}
			}
		}
	});
});

describe('confidence / confidenceBand / stability', () => {
	it('confidenceBand matches the documented thresholds, and both are in range', () => {
		const rng = makeRng(777);
		const bandFor = (c: number) => (c < 0.55 ? 'provisional' : c < 0.78 ? 'clear' : 'unambiguous');
		for (const tier of TIERS) {
			const qs = questionsForTier(fixturePack, tier);
			for (let trial = 0; trial < 30; trial++) {
				const answers = qs.map(() => rng.int(4));
				const { confidence, confidenceBand, stability } = scoreQuiz(fixturePack, tier, answers);
				expect(confidenceBand).toBe(bandFor(confidence));
				expect(confidence).toBeGreaterThanOrEqual(0);
				expect(confidence).toBeLessThanOrEqual(1);
				expect(stability).toBeGreaterThanOrEqual(0);
				expect(stability).toBeLessThanOrEqual(1);
			}
		}
	});
});

describe('decisive', () => {
	it('has at most 3 entries, sorted by delta descending, with in-range questionIndex', () => {
		const rng = makeRng(55);
		for (const tier of TIERS) {
			const qs = questionsForTier(fixturePack, tier);
			for (let trial = 0; trial < 15; trial++) {
				const answers = qs.map(() => rng.int(4));
				const { decisive } = scoreQuiz(fixturePack, tier, answers);
				expect(decisive.length).toBeLessThanOrEqual(3);
				expect(decisive.length).toBe(Math.min(3, qs.length));
				for (let i = 1; i < decisive.length; i++) {
					expect(decisive[i - 1].delta).toBeGreaterThanOrEqual(decisive[i].delta);
				}
				for (const d of decisive) {
					expect(d.questionIndex).toBeGreaterThanOrEqual(0);
					expect(d.questionIndex).toBeLessThan(qs.length);
					expect(d.questionId).toBe(qs[d.questionIndex].id);
				}
			}
		}
	});
});

describe('tier nesting', () => {
	it('short is a strict order-preserving subset of medium, which is a strict subset of long', () => {
		const shortIds = questionsForTier(fixturePack, 'short').map((q) => q.id);
		const mediumIds = questionsForTier(fixturePack, 'medium').map((q) => q.id);
		const longIds = questionsForTier(fixturePack, 'long').map((q) => q.id);

		expect(shortIds.every((id) => mediumIds.includes(id))).toBe(true);
		expect(mediumIds.every((id) => longIds.includes(id))).toBe(true);
		// order-preserving: filtering medium down to the short ids reproduces short exactly
		expect(mediumIds.filter((id) => shortIds.includes(id))).toEqual(shortIds);
		expect(longIds.filter((id) => mediumIds.includes(id))).toEqual(mediumIds);

		expect(mediumIds.length).toBeGreaterThan(shortIds.length);
		expect(longIds.length).toBeGreaterThan(mediumIds.length);
	});
});

describe('sectionsForTier', () => {
	it('returns [] for a pack with no sections declared', () => {
		expect(sectionsForTier(fixturePack, 'short')).toEqual([]);
		expect(sectionsForTier(fixturePack, 'long')).toEqual([]);
	});

	it('covers every question in the tier exactly once, in contiguous, gapless, pack-declaration order', () => {
		for (const tier of TIERS) {
			const qs = questionsForTier(starWars, tier);
			const sections = sectionsForTier(starWars, tier);

			const declOrder = starWars.sections!.map((s) => s.id);
			const presentIds = sections.map((s) => s.id);
			expect(presentIds).toEqual(declOrder.filter((id) => presentIds.includes(id)));

			let cursor = 0;
			for (const s of sections) {
				expect(s.startIndex).toBe(cursor);
				expect(s.endIndex).toBeGreaterThan(s.startIndex);
				expect(s.count).toBe(s.endIndex - s.startIndex);
				for (let i = s.startIndex; i < s.endIndex; i++) {
					expect(qs[i].section).toBe(s.id);
				}
				cursor = s.endIndex;
			}
			expect(cursor).toBe(qs.length);
		}
	});

	it('numbers sections 1-based against a shared total, and omits a section with zero questions in this tier', () => {
		for (const tier of TIERS) {
			const sections = sectionsForTier(starWars, tier);
			sections.forEach((s, i) => {
				expect(s.index).toBe(i + 1);
				expect(s.total).toBe(sections.length);
			});
		}
		// `disclosure` (candor) has no short-tier question in the star-wars pack.
		expect(sectionsForTier(starWars, 'short').some((s) => s.id === 'disclosure')).toBe(false);
		expect(sectionsForTier(starWars, 'medium').some((s) => s.id === 'disclosure')).toBe(true);
	});

	it('nests: every section present in short is present in medium, and every section in medium is present in long', () => {
		const shortIds = sectionsForTier(starWars, 'short').map((s) => s.id);
		const mediumIds = sectionsForTier(starWars, 'medium').map((s) => s.id);
		const longIds = sectionsForTier(starWars, 'long').map((s) => s.id);

		expect(shortIds.every((id) => mediumIds.includes(id))).toBe(true);
		expect(mediumIds.every((id) => longIds.includes(id))).toBe(true);
		// the long tier carries every question, so it is the only tier guaranteed to show all sections
		expect(longIds).toEqual(starWars.sections!.map((s) => s.id));
	});

	it('throws when a section is not contiguous in the given tier', () => {
		const pack: QuizPack = {
			...starWars,
			sections: [
				{ id: 'a', label: 'A' },
				{ id: 'b', label: 'B' }
			],
			questions: [
				{ ...starWars.questions[0], section: 'a' },
				{ ...starWars.questions[1], section: 'b' },
				{ ...starWars.questions[2], section: 'a' }
			]
		};
		expect(() => sectionsForTier(pack, 'long')).toThrow(/not contiguous/);
	});
});

describe('coverage normalisation', () => {
	it('keeps vector values in range and does not let a 20x-asked axis force the winner', () => {
		const pack = coveragePack(20);
		const qs = questionsForTier(pack, 'short');
		expect(qs.length).toBe(21);

		// Answer the 20 manyAxis questions in perfect alternation (cancels out) and the
		// single onceAxis question decisively toward onceChar.
		const answers = qs.map((q, i) => (q.id === 'once0' ? 0 : i % 2));
		const { vector, winner } = scoreQuiz(pack, 'short', answers);

		for (const value of Object.values(vector)) {
			expect(value).toBeGreaterThanOrEqual(-100);
			expect(value).toBeLessThanOrEqual(100);
		}
		// The 20x-asked axis nets to a wash; the winner must follow the one real signal,
		// not default to the character aligned with the over-asked axis.
		expect(winner).toBe('onceChar');
	});

	it('still keeps vector values in range when the over-asked axis is answered all one way', () => {
		const pack = coveragePack(20);
		const qs = questionsForTier(pack, 'short');
		const answers = qs.map((q) => (q.id === 'once0' ? 0 : 0));
		const { vector } = scoreQuiz(pack, 'short', answers);
		for (const value of Object.values(vector)) {
			expect(value).toBeGreaterThanOrEqual(-100);
			expect(value).toBeLessThanOrEqual(100);
		}
	});
});

describe('answerCode', () => {
	it('is deterministic and fixed-width regardless of tier', () => {
		const codes: Record<string, string> = {};
		for (const tier of TIERS) {
			const answers = questionsForTier(fixturePack, tier).map(() => 0);
			const code = answerCode(fixturePack, tier, answers);
			codes[tier] = code;
			expect(answerCode(fixturePack, tier, answers)).toBe(code);
		}
		const lengths = new Set(Object.values(codes).map((c) => c.length));
		expect(lengths.size).toBe(1);
	});

	it('differs for different answers', () => {
		const qs = questionsForTier(fixturePack, 'short');
		const a = answerCode(fixturePack, 'short', qs.map(() => 0));
		const b = answerCode(fixturePack, 'short', qs.map((_, i) => (i === 0 ? 1 : 0)));
		expect(a).not.toBe(b);
	});
});

describe('deriveStats', () => {
	it('matches a hand-computed mean/sd on a tiny pack', () => {
		const pack = miniPack();
		const stats = deriveStats(pack);
		// a-values: 50, 60, 40 -> mean 50, population variance ((0)+(100)+(100))/3 = 66.667
		expect(stats.mean.a).toBeCloseTo(50, 9);
		expect(stats.sd.a).toBeCloseTo(Math.sqrt(200 / 3), 9);
		// b-values: 50, 40, 60 -> same distribution, same mean/sd
		expect(stats.mean.b).toBeCloseTo(50, 9);
		expect(stats.sd.b).toBeCloseTo(Math.sqrt(200 / 3), 9);
	});

	it('never returns an sd of 0, even when every character shares the same axis value', () => {
		const pack = miniPack();
		for (const c of pack.characters) c.vector.a = 50; // collapse all variance on axis "a"
		const stats = deriveStats(pack);
		expect(stats.sd.a).toBeGreaterThan(0);
	});
});

describe('maxSignaturePerCharacter', () => {
	it('matches a hand count of the fixture pack sig fields, tier by tier', () => {
		expect(maxSignaturePerCharacter(fixturePack, 'short')).toMatchObject({
			sentinel: 0.6,
			quartermaster: 0.5,
			archivist: 0,
			champion: 0
		});
		expect(maxSignaturePerCharacter(fixturePack, 'medium')).toMatchObject({
			sentinel: 0.6,
			quartermaster: 0.5,
			ghost: 0.5,
			champion: 0.6,
			drifter: 0
		});
		expect(maxSignaturePerCharacter(fixturePack, 'long')).toMatchObject({
			sentinel: 0.6,
			quartermaster: 0.5,
			ghost: 0.5,
			champion: 0.6,
			drifter: 0.5,
			confessor: 0.6
		});
	});
});

describe('accumulate', () => {
	it('matches a hand-computed sum/cover/sigHit on the fixture pack short tier', () => {
		const qs = questionsForTier(fixturePack, 'short');
		const axes = fixturePack.axes.map((a) => a.id);
		const answers = [0, 0, 0, 0];
		const { sum, cover, sigHit } = accumulate(qs, answers, axes);

		// resolve: q01a=70, q02a=(none=0), q03a=-30, q04a=(none=0) -> 40
		expect(sum.resolve).toBeCloseTo(40, 9);
		// spreads: q01 (70..-70)/1=70, q02 axis absent=0, q03 (35..-35)=35, q04 absent=0 -> 105
		expect(cover.resolve).toBeCloseTo(105, 9);
		expect(sigHit).toEqual({ sentinel: 0.6, quartermaster: 0.5 });
	});
});

describe('sortRanked tie-breaking', () => {
	it('breaks score ties by higher gravity first, then by id ascending', () => {
		const entries = [
			{ characterId: 'zeta', cos: 0, raw: 0.5, score: 0.5 },
			{ characterId: 'alpha', cos: 0, raw: 0.5, score: 0.5 },
			{ characterId: 'high-gravity', cos: 0, raw: 0.5, score: 0.5 }
		];
		const gravity = { zeta: 1, alpha: 1, 'high-gravity': 5 };
		const sorted = sortRanked(entries, gravity).map((e) => e.characterId);
		expect(sorted).toEqual(['high-gravity', 'alpha', 'zeta']);
	});

	it('never reorders by score when scores differ', () => {
		const entries = [
			{ characterId: 'low', cos: 0, raw: 0.1, score: 0.1 },
			{ characterId: 'high', cos: 0, raw: 0.9, score: 0.9 }
		];
		const sorted = sortRanked(entries, { low: 99, high: 1 }).map((e) => e.characterId);
		expect(sorted).toEqual(['high', 'low']);
	});
});

describe('characterCosine', () => {
	it('is ~1 for a character against itself and 0 for an unknown id', () => {
		const axes = fixturePack.axes.map((a) => a.id);
		const id = fixturePack.characters[0].id;
		expect(characterCosine(fixturePack, id, id, axes)).toBeCloseTo(1, 6);
		expect(characterCosine(fixturePack, id, 'does-not-exist', axes)).toBe(0);
	});
});

describe('rank', () => {
	it('is consistent with scoreQuiz for a hand-checked cosine sign', () => {
		const pack = miniPack();
		const axes = pack.axes.map((a) => a.id);
		const sigMax = maxSignaturePerCharacter(pack, 'short');
		const sums = accumulate(questionsForTier(pack, 'short'), [0, 1], axes); // a positive, b negative
		const entries = rank(pack, sums, axes, 0, sigMax);
		const c2 = entries.find((e) => e.characterId === 'c2')!; // c2 leans +a/-b, should agree
		const c3 = entries.find((e) => e.characterId === 'c3')!; // c3 leans -a/+b, should disagree
		expect(c2.cos).toBeGreaterThan(c3.cos);
	});
});

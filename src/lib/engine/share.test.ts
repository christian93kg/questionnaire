import { describe, expect, it } from 'vitest';
import { questionsForTier } from './score';
import { decodeResult, encodeResult, questionSetHash } from './share';
import type { QuizPack, TierId } from './types';
import { fixturePack } from '../packs/_fixture';
import { makeRng } from '../../../scripts/lib/rng';

const TIERS: TierId[] = ['short', 'medium', 'long'];

function clone(pack: QuizPack): QuizPack {
	return structuredClone(pack);
}

function answersFor(pack: QuizPack, tier: TierId, pick: (i: number) => number): number[] {
	return questionsForTier(pack, tier).map((_, i) => pick(i));
}

/**
 * Local re-implementation of share.ts's base64url writer, used only to hand-craft byte
 * sequences (e.g. a bad schema-version byte) that encodeResult() itself cannot produce.
 * Same alphabet as share.ts by spec, not by import -- this is test scaffolding, not a
 * dependency on the implementation.
 */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function toBase64Url(bytes: Uint8Array): string {
	let out = '';
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i];
		const b = bytes[i + 1];
		const c = bytes[i + 2];
		out += B64[a >> 2];
		out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
		if (b === undefined) break;
		out += B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
		if (c === undefined) break;
		out += B64[c & 63];
	}
	return out;
}

describe('encodeResult / decodeResult round-trip', () => {
	for (const tier of TIERS) {
		it(`preserves answers exactly on tier "${tier}"`, () => {
			const answers = answersFor(fixturePack, tier, (i) => i % 4);
			const blob = encodeResult(fixturePack, tier, answers);
			const res = decodeResult(fixturePack, blob);
			expect(res.status).toBe('ok');
			if (res.status !== 'ok') return;
			expect(res.answers).toEqual(answers);
			expect(res.tier).toBe(tier);
			expect(res.packVersion).toBe(fixturePack.version);
			expect(res.assertedWinner).toBeUndefined();
		});

		it(`round-trips assertedWinner on tier "${tier}"`, () => {
			const answers = answersFor(fixturePack, tier, (i) => i % 4);
			for (const character of fixturePack.characters) {
				const blob = encodeResult(fixturePack, tier, answers, character.id);
				const res = decodeResult(fixturePack, blob);
				expect(res.status).toBe('ok');
				if (res.status !== 'ok') return;
				expect(res.assertedWinner).toBe(character.id);
				expect(res.answers).toEqual(answers);
			}
		});
	}

	it('blob is URL-safe and untouched by encodeURIComponent', () => {
		const answers = answersFor(fixturePack, 'long', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'long', answers, fixturePack.characters[0].id);
		expect(blob).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(encodeURIComponent(blob)).toBe(blob);
	});

	it('is lossless across many random answer arrays and tiers (property check)', () => {
		const rng = makeRng(0xc0ffee);
		for (const tier of TIERS) {
			const qs = questionsForTier(fixturePack, tier);
			for (let trial = 0; trial < 200; trial++) {
				const answers = qs.map(() => rng.int(4));
				const withWinner = rng.int(2) === 0;
				const winnerId = withWinner
					? fixturePack.characters[rng.int(fixturePack.characters.length)].id
					: undefined;
				const blob = encodeResult(fixturePack, tier, answers, winnerId);
				const res = decodeResult(fixturePack, blob);
				expect(res.status).toBe('ok');
				if (res.status !== 'ok') continue;
				expect(res.answers).toEqual(answers);
				expect(res.tier).toBe(tier);
				expect(res.assertedWinner).toBe(winnerId);
			}
		}
	});
});

describe('the hash is over ids, not prose or version', () => {
	it('editing question and option text does not break an existing link', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);

		const edited = clone(fixturePack);
		const q = edited.questions.find((q) => q.id === 'q01')!;
		q.text = 'This question has been completely rewritten for clarity.';
		q.preamble = 'Also a new preamble that did not exist before.';
		for (const opt of q.options) opt.text = `rewritten: ${opt.text}`;

		const res = decodeResult(edited, blob);
		expect(res.status).toBe('ok');
	});

	it('bumping pack.version alone does not break an existing link', () => {
		const answers = answersFor(fixturePack, 'medium', (i) => (i + 1) % 4);
		const blob = encodeResult(fixturePack, 'medium', answers);

		const bumped = clone(fixturePack);
		bumped.version = fixturePack.version + 41;

		const res = decodeResult(bumped, blob);
		expect(res.status).toBe('ok');
	});
});

describe('structural changes to the question set are never silently accepted', () => {
	it('changing a question id yields superseded', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);

		const changed = clone(fixturePack);
		changed.questions.find((q) => q.id === 'q01')!.id = 'q01-renamed';

		const res = decodeResult(changed, blob);
		expect(res.status).toBe('superseded');
	});

	it('removing a question from the tier yields superseded', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);

		const shrunk = clone(fixturePack);
		shrunk.questions = shrunk.questions.filter((q) => q.id !== 'q04');

		const res = decodeResult(shrunk, blob);
		expect(res.status).toBe('superseded');
	});

	it('adding a question to the tier yields superseded', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);

		const grown = clone(fixturePack);
		grown.questions.push({
			id: 'q00-new',
			text: 'A brand new question.',
			tier: 'short',
			primaryAxis: 'resolve',
			options: [
				{ id: 'n0', text: 'a', v: { resolve: 10 } },
				{ id: 'n1', text: 'b', v: { resolve: -10 } },
				{ id: 'n2', text: 'c', v: { resolve: 5 } },
				{ id: 'n3', text: 'd', v: { resolve: -5 } }
			]
		});

		const res = decodeResult(grown, blob);
		expect(res.status).toBe('superseded');
	});
});

describe('malformed input', () => {
	it('rejects garbage characters', () => {
		expect(decodeResult(fixturePack, '!!! not base64url !!!').status).toBe('malformed');
	});

	it('rejects an empty string', () => {
		expect(decodeResult(fixturePack, '').status).toBe('malformed');
	});

	it('rejects a truncated blob', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);
		expect(decodeResult(fixturePack, blob.slice(0, 4)).status).toBe('malformed');
	});

	it('rejects a blob whose schema-version byte is wrong, even if everything else is valid', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const hash = questionSetHash(fixturePack, 'short');
		const HEADER_BYTES = 7;
		const answerBytes = Math.ceil(answers.length / 4);
		const bytes = new Uint8Array(HEADER_BYTES + answerBytes);
		bytes[0] = 2; // real schema version is 1
		bytes[1] = 0; // short tier rank, no asserted winner
		bytes[2] = answers.length;
		bytes[3] = fixturePack.version & 0xff;
		bytes[4] = (fixturePack.version >> 8) & 0xff;
		bytes[5] = hash & 0xff;
		bytes[6] = (hash >> 8) & 0xff;
		answers.forEach((a, i) => {
			bytes[HEADER_BYTES + (i >> 2)] |= (a & 3) << ((i & 3) * 2);
		});

		expect(decodeResult(fixturePack, toBase64Url(bytes)).status).toBe('malformed');
	});
});

describe('migrations', () => {
	it('a matching remap correctly reconstructs answers and reports migrated', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i); // q01=0, q02=1, q03=2, q04=3
		const blob = encodeResult(fixturePack, 'short', answers); // encoded at v1, order q01..q04

		// v2 reorders the short tier to q02, q01, q04, q03 -- same ids, same options, just
		// resequenced, which is enough to change questionSetHash (order is part of the hash).
		const v2 = clone(fixturePack);
		v2.version = 2;
		const byId = new Map(v2.questions.map((q) => [q.id, q]));
		const newOrder = [
			'q02',
			'q01',
			'q04',
			'q03',
			...v2.questions.filter((q) => q.tier !== 'short').map((q) => q.id)
		];
		v2.questions = newOrder.map((id) => byId.get(id)!);
		v2.migrations = [
			{
				fromVersion: 1,
				toVersion: 2,
				tier: 'short',
				// new[0]=q02 <- old[1], new[1]=q01 <- old[0], new[2]=q04 <- old[3], new[3]=q03 <- old[2]
				remap: [{ take: 1 }, { take: 0 }, { take: 3 }, { take: 2 }]
			}
		];

		const res = decodeResult(v2, blob);
		expect(res.status).toBe('migrated');
		if (res.status !== 'migrated') return;
		expect(res.answers).toEqual([answers[1], answers[0], answers[3], answers[2]]);
		expect(res.answers).toEqual([1, 0, 3, 2]);
	});

	it('an absent migration chain yields superseded, never a wrong answer', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);

		const v2 = clone(fixturePack);
		v2.version = 2;
		v2.questions.find((q) => q.id === 'q01')!.id = 'q01-renamed';
		// no migrations array at all

		const res = decodeResult(v2, blob);
		expect(res.status).toBe('superseded');
	});

	it('a migration chain that references the wrong tier/version yields superseded, never a wrong answer', () => {
		const answers = answersFor(fixturePack, 'short', (i) => i % 4);
		const blob = encodeResult(fixturePack, 'short', answers);

		const v2 = clone(fixturePack);
		v2.version = 2;
		v2.questions.find((q) => q.id === 'q01')!.id = 'q01-renamed';
		// migration exists but for the wrong tier, so it can never be found
		v2.migrations = [
			{
				fromVersion: 1,
				toVersion: 2,
				tier: 'medium',
				remap: [{ take: 0 }, { take: 1 }, { take: 2 }, { take: 3 }]
			}
		];

		const res = decodeResult(v2, blob);
		expect(res.status).toBe('superseded');
	});
});

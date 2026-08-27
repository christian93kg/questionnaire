import { questionsForTier } from './score';
import { TIER_RANK, type PackMigration, type QuizPack, type TierId } from './types';

const SCHEMA_VERSION = 1;
const HEADER_BYTES = 7;
const FLAG_HAS_WINNER = 0x80;

const TIERS: TierId[] = ['short', 'medium', 'long'];

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

function fromBase64Url(s: string): Uint8Array | null {
	const vals: number[] = [];
	for (const ch of s) {
		const v = B64.indexOf(ch);
		if (v < 0) return null;
		vals.push(v);
	}
	const bytes: number[] = [];
	for (let i = 0; i < vals.length; i += 4) {
		const [a, b, c, d] = [vals[i], vals[i + 1], vals[i + 2], vals[i + 3]];
		if (b === undefined) break;
		bytes.push(((a << 2) | (b >> 4)) & 0xff);
		if (c === undefined) break;
		bytes.push(((b << 4) | (c >> 2)) & 0xff);
		if (d === undefined) break;
		bytes.push(((c << 6) | d) & 0xff);
	}
	return new Uint8Array(bytes);
}

/**
 * FNV-1a over the ordered (question id, option ids) tuple, truncated to 16 bits.
 * Deliberately over ids and not prose, so copy edits never invalidate a shared link.
 */
export function questionSetHash(pack: QuizPack, tier: TierId): number {
	const parts = questionsForTier(pack, tier).map((q) => `${q.id}:${q.options.map((o) => o.id).join(',')}`);
	const s = parts.join('|');
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0) & 0xffff;
}

function sortedCharacterIds(pack: QuizPack): string[] {
	return pack.characters.map((c) => c.id).sort();
}

export function encodeResult(
	pack: QuizPack,
	tier: TierId,
	answers: number[],
	assertedWinner?: string
): string {
	const winnerIndex = assertedWinner ? sortedCharacterIds(pack).indexOf(assertedWinner) : -1;
	const hasWinner = winnerIndex >= 0;

	const answerBytes = Math.ceil(answers.length / 4);
	const bytes = new Uint8Array(HEADER_BYTES + answerBytes + (hasWinner ? 2 : 0));

	bytes[0] = SCHEMA_VERSION;
	bytes[1] = TIER_RANK[tier] | (hasWinner ? FLAG_HAS_WINNER : 0);
	bytes[2] = answers.length;
	bytes[3] = pack.version & 0xff;
	bytes[4] = (pack.version >> 8) & 0xff;
	const hash = questionSetHash(pack, tier);
	bytes[5] = hash & 0xff;
	bytes[6] = (hash >> 8) & 0xff;

	answers.forEach((a, i) => {
		bytes[HEADER_BYTES + (i >> 2)] |= (a & 3) << ((i & 3) * 2);
	});

	if (hasWinner) {
		bytes[HEADER_BYTES + answerBytes] = winnerIndex & 0xff;
		bytes[HEADER_BYTES + answerBytes + 1] = (winnerIndex >> 8) & 0xff;
	}

	return toBase64Url(bytes);
}

export type DecodeOutcome =
	| {
			status: 'ok' | 'migrated';
			tier: TierId;
			answers: number[];
			packVersion: number;
			assertedWinner?: string;
	  }
	| { status: 'malformed' }
	| { status: 'superseded'; packVersion: number; tier: TierId };

export function decodeResult(pack: QuizPack, blob: string): DecodeOutcome {
	const bytes = fromBase64Url(blob);
	if (!bytes || bytes.length < HEADER_BYTES) return { status: 'malformed' };
	if (bytes[0] !== SCHEMA_VERSION) return { status: 'malformed' };

	const tier = TIERS[bytes[1] & 0x03];
	if (!tier) return { status: 'malformed' };
	const hasWinner = (bytes[1] & FLAG_HAS_WINNER) !== 0;

	const count = bytes[2];
	const packVersion = bytes[3] | (bytes[4] << 8);
	const hash = bytes[5] | (bytes[6] << 8);

	const answerBytes = Math.ceil(count / 4);
	if (bytes.length < HEADER_BYTES + answerBytes + (hasWinner ? 2 : 0)) return { status: 'malformed' };

	const answers: number[] = [];
	for (let i = 0; i < count; i++) {
		answers.push((bytes[HEADER_BYTES + (i >> 2)] >> ((i & 3) * 2)) & 3);
	}

	let assertedWinner: string | undefined;
	if (hasWinner) {
		const idx = bytes[HEADER_BYTES + answerBytes] | (bytes[HEADER_BYTES + answerBytes + 1] << 8);
		assertedWinner = sortedCharacterIds(pack)[idx];
	}

	if (hash === questionSetHash(pack, tier) && answers.length === questionsForTier(pack, tier).length) {
		return { status: 'ok', tier, answers, packVersion, assertedWinner };
	}

	const migrated = applyMigrations(pack, tier, packVersion, answers);
	if (migrated) {
		return { status: 'migrated', tier, answers: migrated, packVersion, assertedWinner };
	}

	// A silently-changed personality result is worse than no result.
	return { status: 'superseded', packVersion, tier };
}

function applyMigrations(
	pack: QuizPack,
	tier: TierId,
	fromVersion: number,
	answers: number[]
): number[] | null {
	if (!pack.migrations?.length) return null;

	let current = answers;
	let version = fromVersion;
	const guard = pack.migrations.length + 1;

	for (let step = 0; step < guard; step++) {
		if (version === pack.version) break;
		const next: PackMigration | undefined = pack.migrations.find(
			(m) => m.fromVersion === version && m.tier === tier
		);
		if (!next) return null;

		const remapped: number[] = [];
		for (const rule of next.remap) {
			if ('drop' in rule) continue;
			const v = current[rule.take];
			if (v === undefined) return null;
			remapped.push(v);
		}
		current = remapped;
		version = next.toVersion;
	}

	if (version !== pack.version) return null;
	if (current.length !== questionsForTier(pack, tier).length) return null;
	return current;
}

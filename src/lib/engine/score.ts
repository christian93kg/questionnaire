import {
	TIER_RANK,
	type AxisId,
	type AxisVector,
	type Character,
	type CharacterScore,
	type ConfidenceBand,
	type DecisiveAnswer,
	type Question,
	type QuizPack,
	type ScoreResult,
	type Section,
	type TierId
} from './types';

/** Blend of magnitude agreement into the otherwise scale-invariant cosine. */
const BETA = 0.15;
/** Soft clip on the user z-vector, in sigmas. */
const TANH_CLIP = 2.5;
/** Crew members closer than this to an already-picked member are skipped. */
const CREW_TWIN_COSINE = 0.9;
/** Below this cosine a character counts as a genuine opposite. */
const OPPOSITE_MAX_COSINE = -0.15;
/** Signature weight is damped for short tiers relative to this question count. */
const SIGNATURE_REFERENCE_QUESTIONS = 34;

export function questionsForTier(pack: QuizPack, tier: TierId): Question[] {
	return pack.questions.filter((q) => TIER_RANK[q.tier] <= TIER_RANK[tier]);
}

/** A `Section` resolved against one tier's question list: its contiguous slice and its
 *  position among the sections that actually appear in that tier. */
export interface TierSection extends Section {
	/** Index into `questionsForTier(pack, tier)` of this section's first question. */
	startIndex: number;
	/** Exclusive end index into the same array. */
	endIndex: number;
	count: number;
	/** 1-based position among the sections present in this tier. */
	index: number;
	/** How many sections are present in this tier, in total. */
	total: number;
}

/**
 * Sections actually present in `tier`, in `pack.sections` declaration order, each carrying
 * the index range it occupies in `questionsForTier(pack, tier)`. Drives the interstitial
 * screens: a pack with no `sections` declared yields `[]`, and a section with zero questions
 * in this tier is simply absent rather than showing an empty part.
 *
 * Requires each section's questions to be contiguous within the tier (an authoring
 * invariant, not a runtime one derived here) -- violating it throws rather than silently
 * mis-numbering parts.
 */
export function sectionsForTier(pack: QuizPack, tier: TierId): TierSection[] {
	const qs = questionsForTier(pack, tier);
	const declared = pack.sections ?? [];

	const out: TierSection[] = [];
	for (const section of declared) {
		let startIndex = -1;
		let endIndex = -1;
		let count = 0;
		qs.forEach((q, i) => {
			if (q.section !== section.id) return;
			if (startIndex === -1) startIndex = i;
			endIndex = i + 1;
			count++;
		});
		if (count === 0) continue;
		if (endIndex - startIndex !== count) {
			throw new Error(
				`section "${section.id}" is not contiguous in tier "${tier}" -- questions must be reordered so each section's questions sit together`
			);
		}
		out.push({ ...section, startIndex, endIndex, count, index: 0, total: 0 });
	}
	out.forEach((s, i) => {
		s.index = i + 1;
		s.total = out.length;
	});
	return out;
}

/** Roster mean and sd per axis. Bootstraps calibration before the solver has run. */
export function deriveStats(pack: QuizPack) {
	const axes = pack.axes.map((a) => a.id);
	const mean: Record<AxisId, number> = {};
	const sd: Record<AxisId, number> = {};
	for (const a of axes) {
		const vals = pack.characters.map((c) => c.vector[a] ?? 0);
		const m = vals.reduce((s, v) => s + v, 0) / vals.length;
		const variance = vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;
		mean[a] = m;
		sd[a] = Math.max(Math.sqrt(variance), 1e-6);
	}
	return { mean, sd };
}

/**
 * Per-axis spread of a question: half the range its options can move that axis.
 * This is what makes an axis asked once and an axis asked eight times comparable.
 */
function questionSpread(q: Question, axis: AxisId): number {
	const vals = q.options.map((o) => o.v[axis] ?? 0);
	return (Math.max(...vals) - Math.min(...vals)) / 2;
}

/** Highest signature total each character could collect across a tier. */
export function maxSignaturePerCharacter(pack: QuizPack, tier: TierId): Record<string, number> {
	const out: Record<string, number> = {};
	for (const c of pack.characters) out[c.id] = 0;
	for (const q of questionsForTier(pack, tier)) {
		for (const c of pack.characters) {
			const best = Math.max(0, ...q.options.map((o) => o.sig?.[c.id] ?? 0));
			out[c.id] += best;
		}
	}
	return out;
}

interface Sums {
	sum: Record<AxisId, number>;
	cover: Record<AxisId, number>;
	sigHit: Record<string, number>;
}

/**
 * Accumulate raw axis totals and coverage.
 *
 * `neutralise` replaces that one answer with its own question's option centroid rather
 * than with zero, which isolates the effect of the choice from the effect of the question
 * being asked at all. Coverage is deliberately unaffected, so normalisation stays stable
 * across jackknife replicates.
 */
export function accumulate(
	qs: Question[],
	answers: number[],
	axes: AxisId[],
	neutralise = -1
): Sums {
	const sum: Record<AxisId, number> = {};
	const cover: Record<AxisId, number> = {};
	const sigHit: Record<string, number> = {};
	for (const a of axes) {
		sum[a] = 0;
		cover[a] = 0;
	}

	qs.forEach((q, i) => {
		const chosen = q.options[answers[i]];
		for (const a of axes) {
			if (i === neutralise) {
				sum[a] += q.options.reduce((s, o) => s + (o.v[a] ?? 0), 0) / q.options.length;
			} else {
				sum[a] += chosen.v[a] ?? 0;
			}
			cover[a] += questionSpread(q, a);
		}
		if (i !== neutralise && chosen.sig) {
			for (const [cid, v] of Object.entries(chosen.sig)) {
				sigHit[cid] = (sigHit[cid] ?? 0) + v;
			}
		}
	});

	return { sum, cover, sigHit };
}

interface RankedEntry {
	characterId: string;
	cos: number;
	raw: number;
	score: number;
}

export function rank(
	pack: QuizPack,
	sums: Sums,
	axes: AxisId[],
	sigWeight: number,
	sigMax: Record<string, number>
): RankedEntry[] {
	const { mean, sd, axisWeight, gravity } = pack.calibration;
	const { sum, cover, sigHit } = sums;

	// Range-normalise, then whiten and soft-clip. Without the range normalisation a
	// heavily-asked axis silently dominates and the profile chart lies about it.
	const maxCover = Math.max(...axes.map((a) => cover[a]), 1e-9);
	const W: Record<AxisId, number> = {};
	const zu: Record<AxisId, number> = {};
	for (const a of axes) {
		const u = (100 * sum[a]) / Math.max(cover[a], 1e-9);
		W[a] = (axisWeight[a] ?? 1) * Math.sqrt(cover[a] / maxCover);
		const z = (u - mean[a]) / sd[a];
		zu[a] = TANH_CLIP * Math.tanh(z / TANH_CLIP);
	}

	const userNorm = Math.sqrt(axes.reduce((s, a) => s + W[a] * zu[a] ** 2, 0));

	return pack.characters.map((c) => {
		let dot = 0;
		let charNorm2 = 0;
		for (const a of axes) {
			const zc = ((c.vector[a] ?? 0) - mean[a]) / sd[a];
			dot += W[a] * zu[a] * zc;
			charNorm2 += W[a] * zc * zc;
		}
		const charNorm = Math.sqrt(charNorm2);
		const cos = dot / (charNorm * userNorm + 1e-9);
		const agree = 1 - Math.abs(userNorm - charNorm) / (userNorm + charNorm + 1e-9);
		const base = (1 - BETA) * ((cos + 1) / 2) + BETA * agree;

		const sig = sigMax[c.id] > 0 ? (sigHit[c.id] ?? 0) / sigMax[c.id] : 0;
		const raw = (1 - sigWeight) * base + sigWeight * sig;

		// Gravity as an exponent keeps the result in [0,1] and bites hardest near the
		// top of the range, which is where ties actually happen.
		const g = gravity[c.id] ?? 1;
		return { characterId: c.id, cos, raw, score: Math.pow(Math.max(raw, 0), 1 / g) };
	});
}

export function sortRanked(entries: RankedEntry[], gravity: Record<string, number>): RankedEntry[] {
	// Ties break toward the rarer result, then by id so results are machine-independent.
	return [...entries].sort(
		(a, b) =>
			b.score - a.score ||
			(gravity[b.characterId] ?? 1) - (gravity[a.characterId] ?? 1) ||
			a.characterId.localeCompare(b.characterId)
	);
}

export function characterCosine(pack: QuizPack, aId: string, bId: string, axes: AxisId[]): number {
	const { mean, sd } = pack.calibration;
	const byId = new Map(pack.characters.map((c) => [c.id, c]));
	const a = byId.get(aId);
	const b = byId.get(bId);
	if (!a || !b) return 0;
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (const ax of axes) {
		const za = ((a.vector[ax] ?? 0) - mean[ax]) / sd[ax];
		const zb = ((b.vector[ax] ?? 0) - mean[ax]) / sd[ax];
		dot += za * zb;
		na += za * za;
		nb += zb * zb;
	}
	return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

function dominantAxis(v: AxisVector | undefined, sd: Record<AxisId, number>, axes: AxisId[]): AxisId {
	let best = axes[0];
	let bestVal = -Infinity;
	for (const a of axes) {
		const scaled = Math.abs((v?.[a] ?? 0) / sd[a]);
		if (scaled > bestVal) {
			bestVal = scaled;
			best = a;
		}
	}
	return best;
}

/**
 * Human-readable display artifact, not the decoder input — the share blob carries the
 * real answers. Fixed width regardless of tier, so a 34-question code stays pasteable.
 */
export function answerCode(pack: QuizPack, tier: TierId, answers: number[]): string {
	const s = `${pack.formCode}${tier}${answers.join('')}`;
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
	let out = '';
	for (let i = 0; i < 8; i++) {
		out += alphabet[(h >>> (i * 4)) & 31];
		h = Math.imul(h ^ (h >>> 13), 16777619);
	}
	return `${pack.formCode.replace('-', '')}-${tier[0].toUpperCase()}-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

export function scoreQuiz(pack: QuizPack, tier: TierId, answers: number[]): ScoreResult {
	const qs = questionsForTier(pack, tier);
	if (answers.length !== qs.length) {
		throw new Error(`expected ${qs.length} answers for tier ${tier}, got ${answers.length}`);
	}
	const axes = pack.axes.map((a) => a.id);
	const { mean, sd, gravity, marginScale } = pack.calibration;

	const sigWeight = pack.signatureWeight * (qs.length / SIGNATURE_REFERENCE_QUESTIONS);
	const sigMax = maxSignaturePerCharacter(pack, tier);

	const sums = accumulate(qs, answers, axes);
	const ranked = sortRanked(rank(pack, sums, axes, sigWeight, sigMax), gravity);
	const winner = ranked[0].characterId;
	const runnerUp = ranked[1].characterId;
	const baseLead = ranked[0].score - ranked[1].score;

	// One jackknife pass yields both confidence and the decisive answers.
	let stable = 0;
	const deltas = qs.map((q, i) => {
		const alt = sortRanked(
			rank(pack, accumulate(qs, answers, axes, i), axes, sigWeight, sigMax),
			gravity
		);
		const byId = new Map(alt.map((e) => [e.characterId, e.score]));
		const lead = (byId.get(winner) ?? 0) - (byId.get(runnerUp) ?? 0);
		if (alt[0].characterId === winner) stable++;
		return {
			q,
			i,
			delta: baseLead - lead,
			wouldFlip: alt[0].characterId !== winner,
			counterfactualWinner: alt[0].characterId !== winner ? alt[0].characterId : undefined
		};
	});

	const stability = stable / Math.max(qs.length, 1);
	const scale = marginScale[tier] || 0.02;
	const confidence = 0.65 * stability + 0.35 * (baseLead / (baseLead + scale));
	const confidenceBand: ConfidenceBand =
		confidence < 0.55 ? 'provisional' : confidence < 0.78 ? 'clear' : 'unambiguous';

	const decisive: DecisiveAnswer[] = deltas
		.slice()
		.sort((a, b) => b.delta - a.delta)
		.slice(0, 3)
		.map((d) => ({
			questionId: d.q.id,
			questionIndex: d.i,
			optionId: d.q.options[answers[d.i]].id,
			delta: d.delta,
			wouldFlip: d.wouldFlip,
			counterfactualWinner: d.counterfactualWinner,
			axis: dominantAxis(d.q.options[answers[d.i]].v, sd, axes)
		}));

	const byId = new Map<string, Character>(pack.characters.map((c) => [c.id, c]));
	const winnerChar = byId.get(winner);
	const crew: string[] = [];
	for (const entry of ranked.slice(1)) {
		if (crew.length === 3) break;
		if (winnerChar?.eclipses?.includes(entry.characterId)) continue;
		// Against the winner as well as against each other: "closest matches" is only
		// interesting if it isn't three restatements of the result you already got.
		if (characterCosine(pack, winner, entry.characterId, axes) > CREW_TWIN_COSINE) continue;
		if (crew.some((k) => characterCosine(pack, k, entry.characterId, axes) > CREW_TWIN_COSINE)) continue;
		crew.push(entry.characterId);
	}

	const least = ranked.reduce((a, b) => (a.cos < b.cos ? a : b));
	const opposite = least.cos < OPPOSITE_MAX_COSINE ? least.characterId : null;

	const vector: Record<AxisId, number> = {};
	const z: Record<AxisId, number> = {};
	const coverage: Record<AxisId, number> = {};
	for (const a of axes) {
		const u = (100 * sums.sum[a]) / Math.max(sums.cover[a], 1e-9);
		vector[a] = u;
		z[a] = TANH_CLIP * Math.tanh((u - mean[a]) / sd[a] / TANH_CLIP);
		coverage[a] = sums.cover[a];
	}

	const scores: CharacterScore[] = ranked.map((e, i) => ({
		characterId: e.characterId,
		score: e.score,
		raw: e.raw,
		cos: e.cos,
		rank: i
	}));

	return {
		packId: pack.id,
		packVersion: pack.version,
		tier,
		vector,
		z,
		coverage,
		ranked: scores,
		winner,
		crew,
		opposite,
		confidence,
		confidenceBand,
		stability,
		decisive,
		answers: [...answers],
		code: answerCode(pack, tier, answers)
	};
}

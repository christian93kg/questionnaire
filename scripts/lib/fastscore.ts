import { maxSignaturePerCharacter, questionsForTier } from '../../src/lib/engine/score';
import type { AxisId, Question, QuizPack, TierId } from '../../src/lib/engine/types';

/**
 * A hot-loop mirror of `rank()` + `sortRanked()` from src/lib/engine/score.ts.
 *
 * WHY THIS EXISTS, and why it is not a second scoring model:
 *   `scoreQuiz` is the only exported entry point, and it runs a full jackknife
 *   (one re-rank per question) to produce confidence/decisive answers. That is
 *   O(Q * C) rankings per respondent -- ~11e9 inner operations for 200k x 34 x 48,
 *   which is minutes-to-hours, not seconds. Calibration only ever needs the winner
 *   and the top1-top2 margin, so this class computes exactly the `rank()` half and
 *   nothing else.
 *
 * The arithmetic below is a line-for-line transcription of `rank()`. It is pinned to
 * the real engine by scripts/lib/fastscore.test.ts, which asserts identical winners
 * and identical scores against `scoreQuiz` on random answer sets. If score.ts changes,
 * that test fails rather than the calibration silently drifting.
 *
 * The only structural difference is precomputation: coverage, the axis weights W, and
 * every character's z-vector and norm are constant across respondents, so they are
 * hoisted out of the loop.
 */

const BETA = 0.15;
const TANH_CLIP = 2.5;
const SIGNATURE_REFERENCE_QUESTIONS = 34;

export class TierScorer {
	readonly tier: TierId;
	readonly questions: Question[];
	readonly axes: AxisId[];
	readonly charIds: string[];
	readonly optionCounts: Int32Array;

	private readonly A: number;
	private readonly C: number;
	private readonly maxOpts: number;
	/** Flat [questionIndex][optionIndex][axis] -> option value. */
	private readonly optV: Float64Array;
	/** Flat [questionIndex][optionIndex][character] -> signature value. Empty when unused. */
	private readonly optSig: Float64Array;
	private readonly hasSig: boolean;
	/** W[a] * zc[c][a], flat [character][axis]. */
	private readonly wzc: Float64Array;
	private readonly charNorm: Float64Array;
	private readonly sigMaxInv: Float64Array;
	private readonly W: Float64Array;
	private readonly cover: Float64Array;
	private readonly mean: Float64Array;
	private readonly sd: Float64Array;
	private readonly sigWeight: number;

	// Scratch, reused across calls. Never escapes.
	private readonly sum: Float64Array;
	private readonly zu: Float64Array;
	private readonly sigHit: Float64Array;

	constructor(pack: QuizPack, tier: TierId) {
		this.tier = tier;
		this.questions = questionsForTier(pack, tier);
		this.axes = pack.axes.map((a) => a.id);
		this.charIds = pack.characters.map((c) => c.id);

		const A = (this.A = this.axes.length);
		const C = (this.C = this.charIds.length);
		const Q = this.questions.length;
		const maxOpts = Math.max(1, ...this.questions.map((q) => q.options.length));

		this.optionCounts = Int32Array.from(this.questions.map((q) => q.options.length));
		this.optV = new Float64Array(Q * maxOpts * A);
		this.hasSig = this.questions.some((q) => q.options.some((o) => o.sig && Object.keys(o.sig).length));
		this.optSig = new Float64Array(this.hasSig ? Q * maxOpts * C : 0);

		const charIndex = new Map(this.charIds.map((id, i) => [id, i]));
		this.questions.forEach((q, qi) => {
			q.options.forEach((o, oi) => {
				const base = (qi * maxOpts + oi) * A;
				for (let a = 0; a < A; a++) this.optV[base + a] = o.v[this.axes[a]] ?? 0;
				if (this.hasSig && o.sig) {
					const sbase = (qi * maxOpts + oi) * C;
					for (const [cid, v] of Object.entries(o.sig)) {
						const ci = charIndex.get(cid);
						if (ci !== undefined) this.optSig[sbase + ci] += v;
					}
				}
			});
		});
		this.maxOpts = maxOpts;

		const { mean, sd, axisWeight } = pack.calibration;
		this.mean = Float64Array.from(this.axes, (a) => mean[a] ?? 0);
		this.sd = Float64Array.from(this.axes, (a) => Math.max(sd[a] ?? 1, 1e-6));

		// Coverage is a property of the question set, not of the answers.
		this.cover = new Float64Array(A);
		for (const q of this.questions) {
			for (let a = 0; a < A; a++) {
				const vals = q.options.map((o) => o.v[this.axes[a]] ?? 0);
				this.cover[a] += (Math.max(...vals) - Math.min(...vals)) / 2;
			}
		}
		const maxCover = Math.max(...this.cover, 1e-9);
		this.W = new Float64Array(A);
		for (let a = 0; a < A; a++) {
			this.W[a] = (axisWeight[this.axes[a]] ?? 1) * Math.sqrt(this.cover[a] / maxCover);
		}

		this.wzc = new Float64Array(C * A);
		this.charNorm = new Float64Array(C);
		pack.characters.forEach((c, ci) => {
			let norm2 = 0;
			for (let a = 0; a < A; a++) {
				const zc = ((c.vector[this.axes[a]] ?? 0) - this.mean[a]) / this.sd[a];
				this.wzc[ci * A + a] = this.W[a] * zc;
				norm2 += this.W[a] * zc * zc;
			}
			this.charNorm[ci] = Math.sqrt(norm2);
		});

		this.sigWeight = pack.signatureWeight * (Q / SIGNATURE_REFERENCE_QUESTIONS);
		const sigMax = maxSignaturePerCharacter(pack, tier);
		this.sigMaxInv = Float64Array.from(this.charIds, (id) => (sigMax[id] > 0 ? 1 / sigMax[id] : 0));

		this.sum = new Float64Array(A);
		this.zu = new Float64Array(A);
		this.sigHit = new Float64Array(C);
	}

	get characterCount(): number {
		return this.C;
	}

	get questionCount(): number {
		return this.questions.length;
	}

	/** Fill `out` (length = character count) with the pre-gravity `raw` score of each character. */
	raw(answers: ArrayLike<number>, out: Float64Array): void {
		const { A, C, sum, zu, sigHit, optV, optSig, mean, sd, W, cover, wzc, charNorm, maxOpts } = this;

		sum.fill(0);
		for (let qi = 0; qi < this.questions.length; qi++) {
			const base = (qi * maxOpts + answers[qi]) * A;
			for (let a = 0; a < A; a++) sum[a] += optV[base + a];
		}

		let userNorm2 = 0;
		for (let a = 0; a < A; a++) {
			const u = (100 * sum[a]) / Math.max(cover[a], 1e-9);
			const z = (u - mean[a]) / sd[a];
			const zc = TANH_CLIP * Math.tanh(z / TANH_CLIP);
			zu[a] = zc;
			userNorm2 += W[a] * zc * zc;
		}
		const userNorm = Math.sqrt(userNorm2);

		if (this.hasSig) {
			sigHit.fill(0);
			for (let qi = 0; qi < this.questions.length; qi++) {
				const sbase = (qi * maxOpts + answers[qi]) * C;
				for (let c = 0; c < C; c++) sigHit[c] += optSig[sbase + c];
			}
		}

		const sw = this.sigWeight;
		for (let c = 0; c < C; c++) {
			let dot = 0;
			const off = c * A;
			for (let a = 0; a < A; a++) dot += wzc[off + a] * zu[a];
			const cn = charNorm[c];
			const cos = dot / (cn * userNorm + 1e-9);
			const agree = 1 - Math.abs(userNorm - cn) / (userNorm + cn + 1e-9);
			const base = (1 - BETA) * ((cos + 1) / 2) + BETA * agree;
			const sig = this.hasSig ? sigHit[c] * this.sigMaxInv[c] : 0;
			out[c] = (1 - sw) * base + sw * sig;
		}
	}
}

/**
 * Winner index under a gravity vector, matching `sortRanked`'s ordering exactly:
 * score desc, then gravity desc, then character id ascending.
 *
 * Compares `log(raw) / g` rather than `raw ** (1/g)`. exp() is strictly increasing, so
 * the ordering is identical, and it removes ~150M pow() calls from the solver loop.
 */
export function winnerIndex(
	raw: Float64Array,
	gravity: Float64Array,
	charIds: string[]
): number {
	let best = -1;
	let bestKey = -Infinity;
	for (let c = 0; c < raw.length; c++) {
		const r = raw[c];
		const key = r <= 0 ? -Infinity : Math.log(r) / gravity[c];
		if (
			key > bestKey ||
			(key === bestKey &&
				best >= 0 &&
				(gravity[c] > gravity[best] ||
					(gravity[c] === gravity[best] && charIds[c].localeCompare(charIds[best]) < 0)))
		) {
			bestKey = key;
			best = c;
		}
	}
	return best;
}

/** Actual score of a character under gravity. Matches score.ts exactly. */
export function scoreOf(raw: number, g: number): number {
	return Math.pow(Math.max(raw, 0), 1 / g);
}

/** Top-1 minus top-2 score margin. */
export function topMargin(raw: Float64Array, gravity: Float64Array): number {
	let first = -Infinity;
	let second = -Infinity;
	for (let c = 0; c < raw.length; c++) {
		const s = scoreOf(raw[c], gravity[c]);
		if (s > first) {
			second = first;
			first = s;
		} else if (s > second) {
			second = s;
		}
	}
	return first - second;
}

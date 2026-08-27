import { deriveStats } from '../../src/lib/engine/score';
import type { QuizPack } from '../../src/lib/engine/types';
import { cholesky, covariance } from './linalg';
import { gumbel, type Rng } from './rng';

export type RespondentModel = 'uniform' | 'coherent';

/** exp(THETA * cos) -- how sharply a coherent respondent prefers on-axis options. */
const THETA = 3;
/** Ridge added to the roster covariance so respondents are not confined to the roster hull. */
const RIDGE = 0.15;

/**
 * Draws answer vectors over the master question bank (pack.questions order).
 *
 * uniform  -- every option equally likely. The null model: what the pack does to
 *             someone who is not actually answering.
 * coherent -- a latent preference vector p ~ N(0, cov(z-roster) + 0.15 I), then each
 *             question resolved by softmax over exp(THETA * cos(option, p)) via
 *             Gumbel-max. This is the model calibration is solved against, because it
 *             produces internally consistent respondents, which is what real people are.
 *
 * Option vectors are divided by the roster sd per axis before the cosine, which puts
 * them in the same whitened space that p is drawn in. Without that, an axis authored
 * on a wider numeric scale would silently dominate every respondent's choices.
 */
export class RespondentSampler {
	readonly questionCount: number;
	private readonly A: number;
	private readonly maxOpts: number;
	private readonly optionCounts: Int32Array;
	/** Unit-length whitened option vectors, flat [question][option][axis]. */
	private readonly optUnit: Float64Array;
	private readonly L: number[][];
	private readonly p: Float64Array;
	private readonly g: Float64Array;

	constructor(pack: QuizPack) {
		const axes = pack.axes.map((a) => a.id);
		const { mean, sd } = deriveStats(pack);
		this.A = axes.length;
		this.questionCount = pack.questions.length;
		this.maxOpts = Math.max(1, ...pack.questions.map((q) => q.options.length));
		this.optionCounts = Int32Array.from(pack.questions.map((q) => q.options.length));

		this.optUnit = new Float64Array(this.questionCount * this.maxOpts * this.A);
		pack.questions.forEach((q, qi) => {
			q.options.forEach((o, oi) => {
				const base = (qi * this.maxOpts + oi) * this.A;
				let n2 = 0;
				for (let a = 0; a < this.A; a++) {
					const v = (o.v[axes[a]] ?? 0) / Math.max(sd[axes[a]] ?? 1, 1e-6);
					this.optUnit[base + a] = v;
					n2 += v * v;
				}
				const n = Math.sqrt(n2);
				if (n > 1e-12) for (let a = 0; a < this.A; a++) this.optUnit[base + a] /= n;
			});
		});

		const zChars = pack.characters.map((c) =>
			axes.map((a) => ((c.vector[a] ?? 0) - mean[a]) / sd[a])
		);
		const sigma = covariance(zChars);
		for (let i = 0; i < this.A; i++) sigma[i][i] += RIDGE;
		this.L = cholesky(sigma);

		this.p = new Float64Array(this.A);
		this.g = new Float64Array(this.A);
	}

	/** Fill `out` (length = master question count) with one respondent's option indices. */
	draw(rng: Rng, model: RespondentModel, out: Int32Array): void {
		if (model === 'uniform') {
			for (let qi = 0; qi < this.questionCount; qi++) out[qi] = rng.int(this.optionCounts[qi]);
			return;
		}

		const { A, p, g, L, optUnit, maxOpts } = this;
		for (let a = 0; a < A; a++) g[a] = rng.normal();
		let pNorm2 = 0;
		for (let i = 0; i < A; i++) {
			let s = 0;
			for (let k = 0; k <= i; k++) s += L[i][k] * g[k];
			p[i] = s;
			pNorm2 += s * s;
		}
		const scale = THETA / (Math.sqrt(pNorm2) + 1e-12);

		for (let qi = 0; qi < this.questionCount; qi++) {
			const n = this.optionCounts[qi];
			let best = 0;
			let bestKey = -Infinity;
			for (let oi = 0; oi < n; oi++) {
				const base = (qi * maxOpts + oi) * A;
				let dot = 0;
				for (let a = 0; a < A; a++) dot += optUnit[base + a] * p[a];
				const key = dot * scale + gumbel(rng);
				if (key > bestKey) {
					bestKey = key;
					best = oi;
				}
			}
			out[qi] = best;
		}
	}
}

/** Index of each tier question inside the master bank, so one draw serves every tier. */
export function tierIndexMap(pack: QuizPack, tierQuestionIds: string[]): Int32Array {
	const pos = new Map(pack.questions.map((q, i) => [q.id, i]));
	return Int32Array.from(tierQuestionIds, (id) => pos.get(id) ?? 0);
}

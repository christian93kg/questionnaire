import { deriveStats, questionsForTier } from '../../src/lib/engine/score';
import type { AxisId, QuizPack, TierId } from '../../src/lib/engine/types';
import { correlation, cosine, maxOffDiagonal, participationRatio } from './linalg';
import { scoreOf, TierScorer, winnerIndex } from './fastscore';
import { makeRng, type Rng } from './rng';

/** Thresholds. Changing one of these is a decision about the roster, not a tuning knob. */
export const LIMITS = {
	maxAxisCorrelation: 0.62,
	minEffectiveDimensions: 4.0,
	maxTwinCosine: 0.9,
	/** Every character needs at least this many axes at or below the negative floor. */
	generalistFloor: -35,
	generalistMinAxes: 2
} as const;

export function zRoster(pack: QuizPack): { axes: AxisId[]; rows: number[][] } {
	const axes = pack.axes.map((a) => a.id);
	const { mean, sd } = deriveStats(pack);
	return {
		axes,
		rows: pack.characters.map((c) => axes.map((a) => ((c.vector[a] ?? 0) - mean[a]) / sd[a]))
	};
}

export interface CorrelationResult {
	max: number;
	pair: [AxisId, AxisId];
	matrix: number[][];
}

/** Pearson r between axis pairs, taken across the roster. */
export function axisCorrelation(pack: QuizPack): CorrelationResult {
	const axes = pack.axes.map((a) => a.id);
	const rows = pack.characters.map((c) => axes.map((a) => c.vector[a] ?? 0));
	const R = correlation(rows);
	const { value, i, j } = maxOffDiagonal(R);
	return { max: value, pair: [axes[i], axes[j]], matrix: R };
}

/**
 * Participation ratio of the correlation-matrix eigenvalues.
 *
 * Measured on the correlation matrix rather than the raw covariance on purpose: the
 * engine z-scores every axis before it scores anything (see rank() in score.ts), so
 * the space the quiz actually operates in is the z-space. Using raw covariance would
 * reward authoring one axis on a wider numeric scale, which changes nothing downstream.
 */
export function effectiveDimensions(pack: QuizPack): number {
	return participationRatio(axisCorrelation(pack).matrix);
}

/** Every character pair whose z-vector cosine exceeds the threshold, worst first. */
export function findTwins(
	pack: QuizPack,
	threshold: number = LIMITS.maxTwinCosine
): Array<[string, string, number]> {
	const { rows } = zRoster(pack);
	const ids = pack.characters.map((c) => c.id);
	const out: Array<[string, string, number]> = [];
	for (let i = 0; i < rows.length; i++) {
		for (let j = i + 1; j < rows.length; j++) {
			const c = cosine(rows[i], rows[j]);
			if (c > threshold) out.push([ids[i], ids[j], c]);
		}
	}
	return out.sort((a, b) => b[2] - a[2]);
}

/** Closest pair regardless of threshold, for reporting headroom. */
export function closestPair(pack: QuizPack): [string, string, number] {
	const all = findTwins(pack, -2);
	return all[0] ?? ['', '', -1];
}

export interface GeneralistOffender {
	id: string;
	count: number;
	axes: AxisId[];
}

/**
 * A character with no strong negatives never wins: it sits near the roster centroid and
 * loses every cosine to whichever specialist is pointing the same general direction.
 */
export function findGeneralists(pack: QuizPack): GeneralistOffender[] {
	const axes = pack.axes.map((a) => a.id);
	const out: GeneralistOffender[] = [];
	for (const c of pack.characters) {
		const low = axes.filter((a) => (c.vector[a] ?? 0) <= LIMITS.generalistFloor);
		if (low.length < LIMITS.generalistMinAxes) out.push({ id: c.id, count: low.length, axes: low });
	}
	return out;
}

// ---------------------------------------------------------------------------
// Reachability
// ---------------------------------------------------------------------------

export interface ReachabilityResult {
	unreachable: string[];
	/** Winning answer set per reachable character, for spot-checking against scoreQuiz. */
	witness: Map<string, number[]>;
	/** Best achieved (target - best rival) margin per character. Negative means unreachable. */
	bestMargin: Map<string, number>;
}

/** The option closest to its own question's centroid: the least opinionated start. */
function neutralAnswers(scorer: TierScorer, axes: AxisId[]): Int32Array {
	return Int32Array.from(scorer.questions, (q) => {
		const centroid = axes.map(
			(a) => q.options.reduce((s, o) => s + (o.v[a] ?? 0), 0) / q.options.length
		);
		let best = 0;
		let bestD = Infinity;
		q.options.forEach((o, oi) => {
			const d = axes.reduce((s, a, ai) => s + ((o.v[a] ?? 0) - centroid[ai]) ** 2, 0);
			if (d < bestD) {
				bestD = d;
				best = oi;
			}
		});
		return best;
	});
}

/**
 * Coordinate ascent on the margin (target score minus best rival score) over the answer
 * set. Repeatedly takes the best single-answer change until nothing improves; several
 * restarts because the margin surface is not concave.
 *
 * This is a search for an existence proof, not an optimiser: the moment the target
 * actually wins, the answer set is a witness and we stop.
 */
export function checkReachability(
	pack: QuizPack,
	tier: TierId,
	opts: { seed?: number; restarts?: number; maxSweeps?: number } = {}
): ReachabilityResult {
	const restarts = opts.restarts ?? 6;
	const maxSweeps = opts.maxSweeps ?? 12;
	const rng: Rng = makeRng(opts.seed ?? 0x5eed);

	const axes = pack.axes.map((a) => a.id);
	const scorer = new TierScorer(pack, tier);
	const ids = scorer.charIds;
	const C = ids.length;
	const gravity = Float64Array.from(ids, (id) => pack.calibration.gravity[id] ?? 1);
	const raw = new Float64Array(C);

	const margin = (answers: Int32Array, target: number): number => {
		scorer.raw(answers, raw);
		const mine = scoreOf(raw[target], gravity[target]);
		let rival = -Infinity;
		for (let c = 0; c < C; c++) {
			if (c === target) continue;
			const s = scoreOf(raw[c], gravity[c]);
			if (s > rival) rival = s;
		}
		return mine - rival;
	};

	const neutral = neutralAnswers(scorer, axes);
	const unreachable: string[] = [];
	const witness = new Map<string, number[]>();
	const bestMargin = new Map<string, number>();

	for (let target = 0; target < C; target++) {
		let bestSeen = -Infinity;
		let found: Int32Array | null = null;

		for (let r = 0; r < restarts && !found; r++) {
			const answers =
				r === 0
					? Int32Array.from(neutral)
					: Int32Array.from(scorer.optionCounts, (n) => rng.int(n));

			for (let sweep = 0; sweep < maxSweeps; sweep++) {
				let changed = false;
				for (let qi = 0; qi < answers.length; qi++) {
					const original = answers[qi];
					let bestOpt = original;
					let bestVal = margin(answers, target);
					for (let oi = 0; oi < scorer.optionCounts[qi]; oi++) {
						if (oi === original) continue;
						answers[qi] = oi;
						const v = margin(answers, target);
						if (v > bestVal) {
							bestVal = v;
							bestOpt = oi;
						}
					}
					answers[qi] = bestOpt;
					if (bestOpt !== original) changed = true;
				}
				if (!changed) break;
			}

			const m = margin(answers, target);
			if (m > bestSeen) bestSeen = m;
			scorer.raw(answers, raw);
			if (winnerIndex(raw, gravity, ids) === target) found = Int32Array.from(answers);
		}

		bestMargin.set(ids[target], bestSeen);
		if (found) witness.set(ids[target], Array.from(found));
		else unreachable.push(ids[target]);
	}

	return { unreachable, witness, bestMargin };
}

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

export interface StructuralIssue {
	rule: string;
	detail: string;
}

const TIERS: TierId[] = ['short', 'medium', 'long'];

/** Shape violations that make the pack incoherent regardless of its statistics. */
export function structuralIssues(pack: QuizPack): StructuralIssue[] {
	const issues: StructuralIssue[] = [];
	const push = (rule: string, detail: string) => issues.push({ rule, detail });

	const axes = pack.axes.map((a) => a.id);
	const axisSet = new Set(axes);
	if (axes.length !== axisSet.size) push('duplicate-axis-id', `axes: ${axes.join(', ')}`);

	// characters
	const seenChar = new Set<string>();
	for (const c of pack.characters) {
		if (seenChar.has(c.id)) push('duplicate-character-id', c.id);
		seenChar.add(c.id);
		const missing = axes.filter((a) => c.vector[a] === undefined);
		if (missing.length) push('character-missing-axis', `${c.id} is missing: ${missing.join(', ')}`);
		const extra = Object.keys(c.vector).filter((k) => !axisSet.has(k));
		if (extra.length) push('character-undeclared-axis', `${c.id} declares: ${extra.join(', ')}`);
	}

	// questions
	const seenQ = new Set<string>();
	for (const q of pack.questions) {
		if (seenQ.has(q.id)) push('duplicate-question-id', q.id);
		seenQ.add(q.id);
		if (!axisSet.has(q.primaryAxis))
			push('question-undeclared-primary-axis', `${q.id} -> "${q.primaryAxis}"`);
		if (!TIERS.includes(q.tier)) push('question-bad-tier', `${q.id} -> "${q.tier}"`);
		if (q.options.length !== 4)
			push('question-option-count', `${q.id} has ${q.options.length} options, expected 4`);

		const seenOpt = new Set<string>();
		for (const o of q.options) {
			// Scoped to the question: packs commonly reuse a/b/c/d across questions and
			// nothing downstream requires option ids to be globally unique.
			if (seenOpt.has(o.id)) push('duplicate-option-id', `${q.id}.${o.id}`);
			seenOpt.add(o.id);
			const badAxis = Object.keys(o.v).filter((k) => !axisSet.has(k));
			if (badAxis.length)
				push('option-undeclared-axis', `${q.id}.${o.id} -> ${badAxis.join(', ')}`);
			for (const cid of Object.keys(o.sig ?? {})) {
				if (!seenChar.has(cid)) push('sig-unknown-character', `${q.id}.${o.id} -> "${cid}"`);
			}
		}
	}

	// eclipses must name real characters
	for (const c of pack.characters) {
		for (const e of c.eclipses ?? []) {
			if (!seenChar.has(e)) push('eclipses-unknown-character', `${c.id} -> "${e}"`);
		}
	}

	// tiers: declared once each, nested, and counts matching the question bank
	const declared = pack.tiers.map((t) => t.id);
	for (const t of TIERS) {
		if (declared.filter((d) => d === t).length !== 1)
			push('tier-declaration', `tier "${t}" must be declared exactly once`);
	}
	let prev = -1;
	for (const t of TIERS) {
		const actual = questionsForTier(pack, t).length;
		const spec = pack.tiers.find((x) => x.id === t);
		if (spec && spec.questionCount !== actual)
			push('tier-count-mismatch', `${t}: declares ${spec.questionCount}, bank yields ${actual}`);
		if (actual <= prev)
			push('tier-nesting', `${t} yields ${actual} questions, not more than the tier below (${prev})`);
		prev = actual;
	}
	// calibration completeness + freshness
	const cal = pack.calibration;
	for (const a of axes) {
		if (cal.mean[a] === undefined) push('calibration-missing-mean', a);
		if (cal.sd[a] === undefined) push('calibration-missing-sd', a);
		if (cal.axisWeight[a] === undefined) push('calibration-missing-axis-weight', a);
	}
	for (const c of pack.characters) {
		if (cal.gravity[c.id] === undefined) push('calibration-missing-gravity', c.id);
	}
	for (const t of TIERS) {
		if (!cal.marginScale[t]) push('calibration-missing-margin-scale', t);
	}

	// A stale mean/sd silently mis-scores every respondent, so it is a hard failure with
	// an obvious remedy rather than a warning nobody reads.
	const derived = deriveStats(pack);
	const drifted = axes.filter(
		(a) =>
			Math.abs((cal.mean[a] ?? 0) - derived.mean[a]) > 1e-6 ||
			Math.abs((cal.sd[a] ?? 0) - derived.sd[a]) > 1e-6
	);
	if (drifted.length)
		push(
			'calibration-stale',
			`mean/sd disagree with the roster on: ${drifted.join(', ')} — run \`npm run calibrate -- ${pack.id}\``
		);

	return issues;
}

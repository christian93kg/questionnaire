#!/usr/bin/env -S npx tsx
/**
 * Solve per-character `gravity` so simulated win rates match each character's desiredShare.
 *
 *   npx tsx scripts/calibrate.ts <packId> [--quick] [--seed N] [--n N] [--dry] [--gauge-fix]
 *
 * Writes src/lib/packs/<packId>/calibration.json.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveStats, scoreQuiz } from '../src/lib/engine/score';
import type { AxisId, PackCalibration, QuizPack, TierId } from '../src/lib/engine/types';
import { TierScorer, topMargin, winnerIndex } from './lib/fastscore';
import { median } from './lib/linalg';
import { axisCorrelation, checkReachability, effectiveDimensions, findTwins } from './lib/lints';
import { loadPack, packDir } from './lib/pack';
import { RespondentSampler, tierIndexMap, type RespondentModel } from './lib/respondents';
import { makeRng } from './lib/rng';

// --- Tuned constants. Empirical; changing one of these invalidates every existing pack. ---
const ROUNDS = 16;
/** Learning rate on the log-gravity update. Higher oscillates, lower does not converge in 16. */
const ETA = 0.18;
/** Geometric mean of the last TAIL rounds. This is what kills the residual oscillation. */
const TAIL = 5;
const GRAVITY_MIN = 0.65;
const GRAVITY_MAX = 1.9;
const DEFAULT_N = 200_000;
const QUICK_N = 20_000;
/** Gravity is solved against the full question set; short/medium are reported, not fitted. */
const FIT_TIER: TierId = 'long';
const TIERS: TierId[] = ['short', 'medium', 'long'];
/** How many respondents get re-scored through the real scoreQuiz as a pin. */
const VERIFY_SAMPLES = 300;

interface Args {
	packId: string;
	n: number;
	seed: number;
	dry: boolean;
	gaugeFix: boolean;
}

/**
 * Rescale the gravity vector to geometric mean 1.
 *
 * The winner is argmax_c log(raw_c)/g_c. Multiplying every g_c by a common k>0 scales
 * every key by 1/k, and since all raw are in (0,1) every key is negative, so the
 * ordering is untouched -- the overall LEVEL of gravity is an exact gauge freedom, and
 * only the ratios between characters carry information. Verified empirically: three
 * different k over 20k respondents on a 48-character pack produce zero winner changes.
 *
 * The prescribed update has no term that fixes that gauge, so the vector drifts upward
 * as a whole. That LOOKS like a defect -- the clamp is applied to a gauge-dependent
 * quantity, so characters pin at MAX at a level that carries no information.
 *
 * Measured, it is not a defect, it is load-bearing. Normalising to geometric mean 1
 * before the clamp is strictly worse on both packs on hand:
 *
 *   pack        default TV   --gauge-fix TV   clamped (default -> gauge-fix)
 *   _fixture      0.0046        0.0217          0/12  ->  2/12
 *   star-wars     0.1801        0.3987         16/48  -> 21/48
 *
 * The reason: the drift is what keeps the vector off the MIN bound, so [0.65, 1.90]
 * behaves as a one-sided constraint and over-winners keep the headroom they need to be
 * suppressed. Centring the vector pushes them into MIN, where the ratio information is
 * destroyed. So the clamp bounds are tuned to the drifting parameterisation, exactly as
 * the brief says.
 *
 * Kept as an opt-in diagnostic, not a default. --gauge-fix answers "is this character
 * pinned because the roster is wrong, or only because the whole vector floated up?"
 */
function gaugeFix(g: Float64Array): void {
	let s = 0;
	for (let c = 0; c < g.length; c++) s += Math.log(g[c]);
	const k = Math.exp(s / g.length);
	for (let c = 0; c < g.length; c++) g[c] /= k;
}

function parseArgs(argv: string[]): Args {
	const rest = argv.slice(2);
	const packId = rest.find((a) => !a.startsWith('-'));
	if (!packId) {
		console.error('usage: npx tsx scripts/calibrate.ts <packId> [--quick] [--seed N] [--n N] [--dry] [--gauge-fix]');
		process.exit(2);
	}
	const flag = (name: string): string | undefined => {
		const i = rest.indexOf(`--${name}`);
		if (i >= 0 && rest[i + 1] && !rest[i + 1].startsWith('-')) return rest[i + 1];
		const eq = rest.find((a) => a.startsWith(`--${name}=`));
		return eq?.split('=')[1];
	};
	const envN = process.env.CALIBRATE_N ? Number(process.env.CALIBRATE_N) : undefined;
	const n = Number(flag('n') ?? envN ?? (rest.includes('--quick') ? QUICK_N : DEFAULT_N));
	return {
		packId,
		n: Math.max(1000, Math.floor(n)),
		seed: Number(flag('seed') ?? process.env.CALIBRATE_SEED ?? 1),
		dry: rest.includes('--dry'),
		gaugeFix: rest.includes('--gauge-fix')
	};
}

/** desiredShare defaults to 1 when absent, then normalised to sum to 1. */
function targetShares(pack: QuizPack): Float64Array {
	const raw = pack.characters.map((c) => Math.max(c.desiredShare ?? 1, 0));
	const total = raw.reduce((s, v) => s + v, 0) || 1;
	return Float64Array.from(raw, (v) => v / total);
}

/** Roster stats and unit axis weights. Axis weights stay 1 until a reason to move them exists. */
function baseStats(pack: QuizPack): {
	mean: Record<AxisId, number>;
	sd: Record<AxisId, number>;
	axisWeight: Record<AxisId, number>;
} {
	const { mean, sd } = deriveStats(pack);
	const axisWeight: Record<AxisId, number> = {};
	for (const a of pack.axes) axisWeight[a.id] = 1;
	return { mean, sd, axisWeight };
}

function withCalibration(pack: QuizPack, patch: Partial<PackCalibration>): QuizPack {
	return { ...pack, calibration: { ...pack.calibration, ...patch } };
}

function fmtPct(v: number): string {
	return `${(100 * v).toFixed(2)}%`;
}

function pad(s: string, w: number): string {
	return s.length >= w ? s : s + ' '.repeat(w - s.length);
}

function padStart(s: string, w: number): string {
	return s.length >= w ? s : ' '.repeat(w - s.length) + s;
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv);
	const t0 = Date.now();

	const loaded = await loadPack(args.packId);
	// Calibration is what this script produces, so it never trusts the committed copy for
	// mean/sd; it recomputes from the roster and scores every respondent against that.
	const stats = baseStats(loaded);
	const pack = withCalibration(loaded, stats);

	const C = pack.characters.length;
	const ids = pack.characters.map((c) => c.id);
	const target = targetShares(pack);
	const sampler = new RespondentSampler(pack);
	const scorers = new Map<TierId, TierScorer>(TIERS.map((t) => [t, new TierScorer(pack, t)]));
	const maps = new Map<TierId, Int32Array>(
		TIERS.map((t) => [t, tierIndexMap(pack, scorers.get(t)!.questions.map((q) => q.id))])
	);

	console.log(
		`pack ${pack.id} v${pack.version} — ${C} characters, ${pack.questions.length} questions, ` +
			`${pack.axes.length} axes\nN=${args.n.toLocaleString()} seed=${args.seed} fitting on tier "${FIT_TIER}"\n`
	);

	// ---- Pass 1: draw the coherent cohort once and cache log(raw) on the fit tier. -------
	// `raw` does not depend on gravity, so 16 solver rounds are 16 argmax sweeps over a
	// cached matrix rather than 16 full simulations.
	const fitScorer = scorers.get(FIT_TIER)!;
	const fitMap = maps.get(FIT_TIER)!;
	const logRaw = new Float64Array(args.n * C);
	{
		const rng = makeRng(args.seed);
		const master = new Int32Array(sampler.questionCount);
		const tierAns = new Int32Array(fitScorer.questionCount);
		const raw = new Float64Array(C);
		for (let i = 0; i < args.n; i++) {
			sampler.draw(rng, 'coherent', master);
			for (let k = 0; k < tierAns.length; k++) tierAns[k] = master[fitMap[k]];
			fitScorer.raw(tierAns, raw);
			const off = i * C;
			for (let c = 0; c < C; c++) logRaw[off + c] = raw[c] > 0 ? Math.log(raw[c]) : -Infinity;
		}
	}
	const tSim = Date.now();
	console.log(`simulated ${args.n.toLocaleString()} coherent respondents in ${((tSim - t0) / 1000).toFixed(1)}s`);

	// ---- Pin the fast path to the real engine. ------------------------------------------
	verifyAgainstEngine(pack, fitScorer, fitMap, sampler, args.seed);

	// ---- Solve. --------------------------------------------------------------------------
	const gravity = new Float64Array(C).fill(1);
	const history: Float64Array[] = [];
	const observed = new Float64Array(C);
	const floor = 0.5 / args.n;

	// log(raw)/g is monotone in raw**(1/g), so the argmax is the same winner sortRanked
	// would pick; the exact-tie branch reproduces its gravity-then-id tiebreak.
	const measure = (g: Float64Array): void => {
		observed.fill(0);
		for (let i = 0; i < args.n; i++) {
			const off = i * C;
			let best = 0;
			let bestKey = -Infinity;
			for (let c = 0; c < C; c++) {
				const key = logRaw[off + c] / g[c];
				if (key > bestKey) {
					bestKey = key;
					best = c;
				} else if (key === bestKey && (g[c] > g[best] || (g[c] === g[best] && ids[c] < ids[best]))) {
					best = c;
				}
			}
			observed[best]++;
		}
		for (let c = 0; c < C; c++) observed[c] /= args.n;
	};

	for (let round = 0; round < ROUNDS; round++) {
		measure(gravity);
		const next = new Float64Array(C);
		for (let c = 0; c < C; c++) {
			const obs = Math.max(observed[c], floor);
			next[c] = gravity[c] * Math.pow(target[c] / obs, ETA);
		}
		if (args.gaugeFix) gaugeFix(next);
		for (let c = 0; c < C; c++) {
			next[c] = Math.min(GRAVITY_MAX, Math.max(GRAVITY_MIN, next[c]));
		}
		gravity.set(next);
		history.push(Float64Array.from(gravity));
		const clamped = Array.from(gravity).filter(
			(g) => g <= GRAVITY_MIN + 1e-9 || g >= GRAVITY_MAX - 1e-9
		).length;
		console.log(
			`  round ${padStart(String(round + 1), 2)}/${ROUNDS}  TV=${tvDistance(observed, target).toFixed(4)}` +
				`  gravity ${Math.min(...gravity).toFixed(3)}..${Math.max(...gravity).toFixed(3)}` +
				`  clamped ${clamped}/${C}`
		);
	}

	// Geometric mean of the last TAIL rounds.
	const final = new Float64Array(C);
	for (let c = 0; c < C; c++) {
		let s = 0;
		for (const h of history.slice(-TAIL)) s += Math.log(h[c]);
		final[c] = Math.exp(s / TAIL);
	}
	measure(final);
	const finalRates = Float64Array.from(observed);
	const tv = tvDistance(finalRates, target);

	// ---- Pass 2: margins per tier, plus the uniform-respondent null model. ---------------
	const margins = new Map<TierId, number>();
	const uniformRates = new Map<TierId, Float64Array>();
	const coherentRates = new Map<TierId, Float64Array>();
	for (const model of ['coherent', 'uniform'] as RespondentModel[]) {
		const rng = makeRng(model === 'coherent' ? args.seed : args.seed ^ 0x9e3779b9);
		const master = new Int32Array(sampler.questionCount);
		const raw = new Float64Array(C);
		const marginBuf = new Map<TierId, Float64Array>(
			TIERS.map((t) => [t, new Float64Array(args.n)])
		);
		const wins = new Map<TierId, Float64Array>(TIERS.map((t) => [t, new Float64Array(C)]));
		const buf = new Map<TierId, Int32Array>(
			TIERS.map((t) => [t, new Int32Array(scorers.get(t)!.questionCount)])
		);
		for (let i = 0; i < args.n; i++) {
			sampler.draw(rng, model, master);
			for (const t of TIERS) {
				const sc = scorers.get(t)!;
				const map = maps.get(t)!;
				const ans = buf.get(t)!;
				for (let k = 0; k < ans.length; k++) ans[k] = master[map[k]];
				sc.raw(ans, raw);
				wins.get(t)![winnerIndex(raw, final, ids)]++;
				marginBuf.get(t)![i] = topMargin(raw, final);
			}
		}
		for (const t of TIERS) {
			const w = wins.get(t)!;
			for (let c = 0; c < C; c++) w[c] /= args.n;
			(model === 'coherent' ? coherentRates : uniformRates).set(t, w);
			if (model === 'coherent') margins.set(t, median(marginBuf.get(t)!));
		}
	}

	// ---- Report. -------------------------------------------------------------------------
	report(pack, ids, finalRates, target, final, coherentRates, uniformRates, margins, tv);

	// ---- Audit block. --------------------------------------------------------------------
	const calibratedPack = withCalibration(pack, {
		gravity: Object.fromEntries(ids.map((id, c) => [id, final[c]]))
	});
	const reach = checkReachability(calibratedPack, 'long', { seed: args.seed });
	if (reach.unreachable.length) {
		console.log(`\n!! UNREACHABLE under the new gravity: ${reach.unreachable.join(', ')}`);
		console.log('   run `npm run audit` for detail; these characters can never be a result.');
	}

	const calibration: PackCalibration = {
		mean: stats.mean,
		sd: stats.sd,
		axisWeight: stats.axisWeight,
		gravity: Object.fromEntries(ids.map((id, c) => [id, round6(final[c])])),
		marginScale: Object.fromEntries(TIERS.map((t) => [t, round6(margins.get(t) ?? 0.02)])) as Record<
			TierId,
			number
		>,
		simulations: args.n,
		generatedAt: new Date().toISOString(),
		audit: {
			winRate: Object.fromEntries(ids.map((id, c) => [id, round6(finalRates[c])])),
			unreachable: reach.unreachable,
			maxAxisCorrelation: round6(axisCorrelation(pack).max),
			effectiveDimensions: round6(effectiveDimensions(pack)),
			twins: findTwins(pack).map(([a, b, c]) => [a, b, round6(c)] as [string, string, number])
		}
	};

	const outPath = join(packDir(args.packId), 'calibration.json');
	if (args.dry) {
		console.log(`\n--dry: not writing ${outPath}`);
	} else {
		writeFileSync(outPath, JSON.stringify(calibration, null, '\t') + '\n');
		console.log(`\nwrote ${outPath}`);
	}
	console.log(`elapsed ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

function round6(v: number): number {
	return Math.round(v * 1e6) / 1e6;
}

function tvDistance(observed: Float64Array, target: Float64Array): number {
	let s = 0;
	for (let c = 0; c < observed.length; c++) s += Math.abs(observed[c] - target[c]);
	return s / 2;
}

/**
 * TierScorer is a transcription of rank(); scoreQuiz is the shipped truth. If they ever
 * disagree the calibration is fitted to a model the site does not use, so this aborts.
 */
function verifyAgainstEngine(
	pack: QuizPack,
	scorer: TierScorer,
	map: Int32Array,
	sampler: RespondentSampler,
	seed: number
): void {
	const rng = makeRng(seed ^ 0x1234);
	const master = new Int32Array(sampler.questionCount);
	const ans = new Int32Array(scorer.questionCount);
	const raw = new Float64Array(pack.characters.length);
	const gravity = Float64Array.from(pack.characters, (c) => pack.calibration.gravity[c.id] ?? 1);
	let worst = 0;
	for (let i = 0; i < VERIFY_SAMPLES; i++) {
		sampler.draw(rng, 'coherent', master);
		for (let k = 0; k < ans.length; k++) ans[k] = master[map[k]];
		scorer.raw(ans, raw);
		const mine = scorer.charIds[winnerIndex(raw, gravity, scorer.charIds)];
		const truth = scoreQuiz(pack, scorer.tier, Array.from(ans));
		if (mine !== truth.winner) {
			throw new Error(
				`fast scorer disagrees with scoreQuiz on sample ${i}: got "${mine}", engine says "${truth.winner}".\n` +
					`scripts/lib/fastscore.ts is out of sync with src/lib/engine/score.ts — fix that before trusting any calibration.`
			);
		}
		for (const r of truth.ranked) {
			const c = scorer.charIds.indexOf(r.characterId);
			worst = Math.max(worst, Math.abs(r.raw - raw[c]));
		}
	}
	console.log(`verified fast scorer vs scoreQuiz on ${VERIFY_SAMPLES} samples (max |raw| delta ${worst.toExponential(1)})`);
}

function report(
	pack: QuizPack,
	ids: string[],
	rates: Float64Array,
	target: Float64Array,
	gravity: Float64Array,
	coherent: Map<TierId, Float64Array>,
	uniform: Map<TierId, Float64Array>,
	margins: Map<TierId, number>,
	tv: number
): void {
	const rows = ids.map((id, c) => ({
		id,
		rate: rates[c],
		target: target[c],
		gravity: gravity[c],
		uniform: uniform.get(FIT_TIER)![c],
		ratio: rates[c] / Math.max(target[c], 1e-12)
	}));
	const byRate = [...rows].sort((a, b) => b.rate - a.rate);
	const w = Math.max(4, ...ids.map((i) => i.length));

	const table = (title: string, list: typeof rows): void => {
		console.log(`\n${title}`);
		console.log(
			`  ${pad('character', w)}  ${padStart('coherent', 9)} ${padStart('target', 8)} ${padStart('x', 6)} ${padStart('uniform', 8)} ${padStart('gravity', 8)}`
		);
		for (const r of list) {
			const sat =
				r.gravity <= GRAVITY_MIN + 1e-9 ? ' <MIN' : r.gravity >= GRAVITY_MAX - 1e-9 ? ' <MAX' : '';
			console.log(
				`  ${pad(r.id, w)}  ${padStart(fmtPct(r.rate), 9)} ${padStart(fmtPct(r.target), 8)} ${padStart(r.ratio.toFixed(2), 6)} ${padStart(fmtPct(r.uniform), 8)} ${padStart(r.gravity.toFixed(3), 8)}${sat}`
			);
		}
	};

	table(`top ${Math.min(10, rows.length)} win rates (tier ${FIT_TIER})`, byRate.slice(0, 10));
	if (rows.length > 10) table(`bottom ${Math.min(10, rows.length)} win rates`, byRate.slice(-10));

	console.log('\nwin rate by tier (coherent respondents, final gravity)');
	for (const t of TIERS) {
		const r = coherent.get(t)!;
		const u = uniform.get(t)!;
		let tvT = 0;
		let tvU = 0;
		for (let c = 0; c < r.length; c++) {
			tvT += Math.abs(r[c] - target[c]);
			tvU += Math.abs(u[c] - target[c]);
		}
		const zero = ids.filter((_, c) => r[c] === 0);
		console.log(
			`  ${pad(t, 7)} TV(coherent)=${(tvT / 2).toFixed(4)}  TV(uniform)=${(tvU / 2).toFixed(4)}  ` +
				`marginScale=${(margins.get(t) ?? 0).toFixed(5)}` +
				(zero.length ? `  never wins: ${zero.join(', ')}` : '')
		);
	}

	console.log(`\nfinal TV distance (tier ${FIT_TIER}, coherent): ${tv.toFixed(4)}`);

	const saturated = rows.filter(
		(r) => r.gravity <= GRAVITY_MIN + 1e-9 || r.gravity >= GRAVITY_MAX - 1e-9
	);
	if (saturated.length) {
		const line = '='.repeat(72);
		console.log(`\n${line}`);
		console.log(`!! ${saturated.length} CHARACTER(S) SATURATED A GRAVITY CLAMP BOUND`);
		console.log(line);
		console.log('Gravity ran out of room. This is a roster problem, not a solver problem:');
		console.log('a character pinned at MAX cannot be pushed to its share by scoring alone');
		console.log('(usually no distinctive negative axes, or it is eclipsed by a near-twin);');
		console.log('a character pinned at MIN is dominating and needs a sharper rival, not less gravity.');
		for (const r of saturated) {
			const bound = r.gravity <= GRAVITY_MIN + 1e-9 ? 'MIN' : 'MAX';
			const char = pack.characters.find((c) => c.id === r.id);
			const low = pack.axes
				.map((a) => a.id)
				.filter((a) => (char?.vector[a] ?? 0) <= -35);
			console.log(
				`  ${pad(r.id, w)} pinned at ${bound} (${r.gravity.toFixed(3)}) — ` +
					`wins ${fmtPct(r.rate)} vs target ${fmtPct(r.target)}; ` +
					`strong-negative axes: ${low.length ? low.join(', ') : 'NONE'}`
			);
		}
		console.log(line);
	}
}

main().catch((err: unknown) => {
	console.error(`\ncalibrate failed: ${err instanceof Error ? err.message : String(err)}`);
	process.exit(1);
});

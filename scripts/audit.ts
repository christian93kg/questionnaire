#!/usr/bin/env -S npx tsx
/**
 * Pack lint gate. Exits non-zero if any check fails.
 *
 *   npx tsx scripts/audit.ts [packId ...]
 *
 * With no packId, audits every pack under src/lib/packs.
 */

import { scoreQuiz } from '../src/lib/engine/score';
import type { QuizPack, TierId } from '../src/lib/engine/types';
import {
	axisCorrelation,
	checkReachability,
	closestPair,
	effectiveDimensions,
	findGeneralists,
	findTwins,
	LIMITS,
	structuralIssues
} from './lib/lints';
import { listPacks, loadPack } from './lib/pack';

const REACH_TIER: TierId = 'long';

interface LintResult {
	name: string;
	pass: boolean;
	summary: string;
	details: string[];
}

function pad(s: string, w: number): string {
	return s.length >= w ? s : s + ' '.repeat(w - s.length);
}

// --- 0. structure -----------------------------------------------------------------------

function lintStructure(pack: QuizPack): LintResult {
	const issues = structuralIssues(pack);
	const byRule = new Map<string, string[]>();
	for (const i of issues) {
		if (!byRule.has(i.rule)) byRule.set(i.rule, []);
		byRule.get(i.rule)!.push(i.detail);
	}
	return {
		name: 'structure',
		pass: issues.length === 0,
		summary: issues.length ? `${issues.length} violation(s)` : 'schema, ids, tiers and calibration all coherent',
		details: [...byRule].map(([rule, ds]) => `${rule}: ${ds.join('; ')}`)
	};
}

// --- 1. axis correlation ----------------------------------------------------------------

function lintAxisCorrelation(pack: QuizPack): LintResult {
	const { max, pair, matrix } = axisCorrelation(pack);
	const axes = pack.axes.map((a) => a.id);
	const details: string[] = [];
	if (max > LIMITS.maxAxisCorrelation) {
		details.push(`"${pair[0]}" and "${pair[1]}" correlate at r = ${max.toFixed(3)} across the roster.`);
		details.push('They are measuring the same thing. Re-author one, or merge them and add a new axis.');
		for (let i = 0; i < axes.length; i++) {
			for (let j = i + 1; j < axes.length; j++) {
				if (Math.abs(matrix[i][j]) > LIMITS.maxAxisCorrelation)
					details.push(`  over limit: ${axes[i]} x ${axes[j]} = ${matrix[i][j].toFixed(3)}`);
			}
		}
	}
	return {
		name: 'axis-correlation',
		pass: max <= LIMITS.maxAxisCorrelation,
		summary: `max |r| = ${max.toFixed(3)} (limit ${LIMITS.maxAxisCorrelation}) — worst pair ${pair[0]} x ${pair[1]}`,
		details
	};
}

// --- 2. effective dimensionality --------------------------------------------------------

function lintDimensionality(pack: QuizPack): LintResult {
	const pr = effectiveDimensions(pack);
	const pass = pr >= LIMITS.minEffectiveDimensions;
	return {
		name: 'effective-dimensions',
		pass,
		summary: `participation ratio = ${pr.toFixed(3)} of ${pack.axes.length} axes (floor ${LIMITS.minEffectiveDimensions})`,
		details: pass
			? []
			: [
					`The roster only spans ~${pr.toFixed(1)} independent directions.`,
					'Characters are clustered along a few combinations of axes; add characters that occupy',
					'the unused corners, or drop the axes nobody is actually differentiated on.'
				]
	};
}

// --- 3. twins ---------------------------------------------------------------------------

function lintTwins(pack: QuizPack): LintResult {
	const twins = findTwins(pack);
	const closest = closestPair(pack);
	return {
		name: 'twins',
		pass: twins.length === 0,
		summary: twins.length
			? `${twins.length} pair(s) above cosine ${LIMITS.maxTwinCosine}`
			: `closest pair is ${closest[0]} / ${closest[1]} at cosine ${closest[2].toFixed(3)} (limit ${LIMITS.maxTwinCosine})`,
		details: twins.map(
			([a, b, c]) => `${a} / ${b} — cosine ${c.toFixed(4)}; one of these can never be the more interesting result`
		)
	};
}

// --- 4. no-generalist -------------------------------------------------------------------

function lintGeneralists(pack: QuizPack): LintResult {
	const offenders = findGeneralists(pack);
	return {
		name: 'no-generalist',
		pass: offenders.length === 0,
		summary: offenders.length
			? `${offenders.length} character(s) with fewer than ${LIMITS.generalistMinAxes} axes at or below ${LIMITS.generalistFloor}`
			: `every character has >= ${LIMITS.generalistMinAxes} axes at or below ${LIMITS.generalistFloor}`,
		details: offenders.map(
			(o) =>
				`${o.id} — only ${o.count} strong-negative axis/axes${o.axes.length ? ` (${o.axes.join(', ')})` : ''}. ` +
				'Give it something it is genuinely bad at; generalists sit near the centroid and lose every cosine.'
		)
	};
}

// --- 5. reachability --------------------------------------------------------------------

function lintReachability(pack: QuizPack): LintResult {
	const result = checkReachability(pack, REACH_TIER, { seed: 0x5eed, restarts: 8, maxSweeps: 16 });

	// Confirm one witness through the real engine, so "reachable" means reachable in the
	// scorer the site ships, not just in the search's own arithmetic.
	const details: string[] = [];
	let engineMismatch = 0;
	for (const [id, answers] of result.witness) {
		if (scoreQuiz(pack, REACH_TIER, answers).winner !== id) {
			engineMismatch++;
			details.push(`${id}: coordinate ascent found a witness that scoreQuiz does not agree wins — engine mismatch`);
		}
	}

	for (const id of result.unreachable) {
		const m = result.bestMargin.get(id) ?? -Infinity;
		details.push(
			`${id} — no answer set makes it win on tier "${REACH_TIER}". ` +
				`Best margin achieved: ${m.toFixed(5)} (needs > 0). It is dominated by a neighbour on every axis it leads.`
		);
	}

	const pass = result.unreachable.length === 0 && engineMismatch === 0;
	return {
		name: 'reachability',
		pass,
		summary: pass
			? `all ${pack.characters.length} characters win somewhere on tier "${REACH_TIER}"`
			: `${result.unreachable.length} unreachable, ${engineMismatch} engine mismatch(es)`,
		details
	};
}

// ----------------------------------------------------------------------------------------

function auditPack(pack: QuizPack): boolean {
	const lints = [
		lintStructure(pack),
		lintAxisCorrelation(pack),
		lintDimensionality(pack),
		lintTwins(pack),
		lintGeneralists(pack),
		lintReachability(pack)
	];

	const w = Math.max(...lints.map((l) => l.name.length));
	console.log(`\n=== ${pack.id} v${pack.version} — ${pack.characters.length} characters, ${pack.questions.length} questions, ${pack.axes.length} axes ===`);
	for (const l of lints) {
		console.log(`  ${l.pass ? 'PASS' : 'FAIL'}  ${pad(l.name, w)}  ${l.summary}`);
		for (const d of l.details) console.log(`        - ${d}`);
	}

	const failed = lints.filter((l) => !l.pass);
	console.log(
		failed.length
			? `  => ${pack.id}: FAIL (${failed.map((f) => f.name).join(', ')})`
			: `  => ${pack.id}: PASS`
	);
	return failed.length === 0;
}

async function main(): Promise<void> {
	const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
	const packIds = requested.length ? requested : listPacks();

	if (!packIds.length) {
		console.error('audit: no packs found under src/lib/packs — nothing to check.');
		process.exit(1);
	}

	let allPass = true;
	for (const id of packIds) {
		try {
			allPass = auditPack(await loadPack(id)) && allPass;
		} catch (err) {
			allPass = false;
			console.error(`\n=== ${id} ===\n  FAIL  load  ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	console.log(`\n${allPass ? 'audit passed' : 'AUDIT FAILED'} — ${packIds.length} pack(s): ${packIds.join(', ')}`);
	process.exit(allPass ? 0 : 1);
}

main().catch((err: unknown) => {
	console.error(`audit crashed: ${err instanceof Error ? err.stack : String(err)}`);
	process.exit(1);
});

#!/usr/bin/env -S npx tsx
/**
 * Pack lint gate. Exits non-zero if any check fails.
 *
 *   npx tsx scripts/audit.ts [packId ...]
 *
 * With no packId, audits every pack under src/lib/packs.
 */

import { glyphFor } from '../src/lib/engine/glyph';
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

// --- 6. glyph uniqueness -----------------------------------------------------------------

const GLYPH_COLS = 40;
const GLYPH_ROWS = 20;

/** Fraction of cells that differ between two equal-length glyph grids. */
function glyphHamming(a: string[], b: string[]): number {
	const flatA = a.join('');
	const flatB = b.join('');
	let diff = 0;
	for (let i = 0; i < flatA.length; i++) if (flatA[i] !== flatB[i]) diff++;
	return diff / flatA.length;
}

/**
 * Every character's glyph (scripts/../src/lib/engine/glyph.ts) must be visually
 * distinguishable from every other's, or the "each axis gets its own visual channel"
 * design is decoration rather than a system: two characters whose axis vectors differ
 * but whose renders don't are exactly the failure mode the orthogonal-channel design
 * exists to prevent.
 *
 * Threshold picked empirically against the star-wars roster (48 characters, 1128
 * pairs): the closest real pair (chewbacca / grogu, two "anchor" archetypes) sits at
 * a Hamming distance of ~0.1375 of the grid's 800 cells, with the next 9 closest pairs
 * all above 0.14. Two statistically independent grids at this generator's roster-mean
 * ink density (~19%) would be expected to differ in ~31% of cells by chance alone
 * (2*p*(1-p)), so 0.1375 is already a real, structurally-driven similarity rather than
 * noise. 0.10 sits comfortably below every observed pair (>=30 cells of headroom on
 * the closest one) while still catching a genuine near-duplicate should one be
 * authored later -- the same headroom relationship the twins lint's 0.90 cosine
 * ceiling has to its own closest-pair reading.
 */
const MIN_GLYPH_HAMMING = 0.1;

function lintGlyphUniqueness(pack: QuizPack): LintResult {
	const grids = pack.characters.map((c) => ({ id: c.id, grid: glyphFor(pack, c.id, GLYPH_COLS, GLYPH_ROWS) }));

	const degenerate: string[] = [];
	for (const { id, grid } of grids) {
		const flat = grid.join('');
		if (!flat.includes(' ')) degenerate.push(`${id} — entirely filled, no blank cells`);
		else if (flat.trim() === '') degenerate.push(`${id} — entirely blank`);
	}

	const tooClose: Array<[string, string, number]> = [];
	let closest: [string, string, number] = ['', '', Infinity];
	for (let i = 0; i < grids.length; i++) {
		for (let j = i + 1; j < grids.length; j++) {
			const d = glyphHamming(grids[i].grid, grids[j].grid);
			if (d < closest[2]) closest = [grids[i].id, grids[j].id, d];
			if (d < MIN_GLYPH_HAMMING) tooClose.push([grids[i].id, grids[j].id, d]);
		}
	}
	tooClose.sort((a, b) => a[2] - b[2]);

	const pass = degenerate.length === 0 && tooClose.length === 0;
	const details: string[] = [
		...degenerate,
		...tooClose.map(
			([a, b, d]) =>
				`${a} / ${b} — glyphs differ in only ${(d * 100).toFixed(1)}% of cells (floor ${(MIN_GLYPH_HAMMING * 100).toFixed(0)}%); one of these can't be told apart on the holoprojector`
		)
	];

	return {
		name: 'glyph-uniqueness',
		pass,
		summary: pass
			? `all ${pack.characters.length} glyphs distinct and non-degenerate — closest pair ${closest[0]} / ${closest[1]} at ${(closest[2] * 100).toFixed(1)}% (floor ${(MIN_GLYPH_HAMMING * 100).toFixed(0)}%)`
			: `${degenerate.length} degenerate glyph(s), ${tooClose.length} pair(s) below ${(MIN_GLYPH_HAMMING * 100).toFixed(0)}% Hamming distance`,
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
		lintReachability(pack),
		lintGlyphUniqueness(pack)
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

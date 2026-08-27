/**
 * Deterministic PRNG for calibration and audit.
 *
 * `Math.random()` is deliberately never used anywhere in scripts/: a calibration that
 * changes on every run cannot be reviewed in a diff, and an audit that fails only
 * sometimes is worse than no audit.
 */

export interface Rng {
	/** Uniform in [0, 1). */
	next(): number;
	/** Standard normal. */
	normal(): number;
	/** Integer in [0, n). */
	int(n: number): number;
}

/** mulberry32 — 32-bit state, passes gjrand, fast enough for the inner loop. */
export function makeRng(seed: number): Rng {
	let a = seed >>> 0;
	let spare: number | null = null;

	const next = (): number => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};

	// Box-Muller, cached spare. Guards u === 0 so log() never returns -Infinity.
	const normal = (): number => {
		if (spare !== null) {
			const s = spare;
			spare = null;
			return s;
		}
		let u = next();
		while (u === 0) u = next();
		const v = next();
		const r = Math.sqrt(-2 * Math.log(u));
		const theta = 2 * Math.PI * v;
		spare = r * Math.sin(theta);
		return r * Math.cos(theta);
	};

	return { next, normal, int: (n) => Math.min(n - 1, Math.floor(next() * n)) };
}

/** Gumbel(0,1) noise. argmax(logit + gumbel) samples exactly from softmax(logit). */
export function gumbel(rng: Rng): number {
	let u = rng.next();
	while (u === 0) u = rng.next();
	return -Math.log(-Math.log(u));
}

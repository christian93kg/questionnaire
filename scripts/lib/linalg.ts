/** Small dense-matrix helpers. Everything here is O(axes^3) at worst, so clarity wins. */

export type Matrix = number[][];

/** Column means and population sds of an n x d matrix. sd floored like deriveStats does. */
export function columnStats(rows: Matrix): { mean: number[]; sd: number[] } {
	const n = rows.length;
	const d = rows[0]?.length ?? 0;
	const mean = new Array<number>(d).fill(0);
	const sd = new Array<number>(d).fill(0);
	for (const r of rows) for (let j = 0; j < d; j++) mean[j] += r[j];
	for (let j = 0; j < d; j++) mean[j] /= n;
	for (const r of rows) for (let j = 0; j < d; j++) sd[j] += (r[j] - mean[j]) ** 2;
	for (let j = 0; j < d; j++) sd[j] = Math.max(Math.sqrt(sd[j] / n), 1e-6);
	return { mean, sd };
}

/** Population covariance of the columns of an n x d matrix. */
export function covariance(rows: Matrix): Matrix {
	const n = rows.length;
	const d = rows[0]?.length ?? 0;
	const { mean } = columnStats(rows);
	const C: Matrix = Array.from({ length: d }, () => new Array<number>(d).fill(0));
	for (const r of rows) {
		for (let i = 0; i < d; i++) {
			const di = r[i] - mean[i];
			for (let j = i; j < d; j++) C[i][j] += di * (r[j] - mean[j]);
		}
	}
	for (let i = 0; i < d; i++)
		for (let j = i; j < d; j++) {
			C[i][j] /= n;
			C[j][i] = C[i][j];
		}
	return C;
}

/** Pearson correlation of the columns. Equivalent to the covariance of the z-scored columns. */
export function correlation(rows: Matrix): Matrix {
	const { mean, sd } = columnStats(rows);
	return covariance(rows.map((r) => r.map((v, j) => (v - mean[j]) / sd[j])));
}

/** Largest |off-diagonal| entry. */
export function maxOffDiagonal(M: Matrix): { value: number; i: number; j: number } {
	let value = 0;
	let bi = 0;
	let bj = 0;
	for (let i = 0; i < M.length; i++)
		for (let j = 0; j < M.length; j++) {
			if (i === j) continue;
			if (Math.abs(M[i][j]) > value) {
				value = Math.abs(M[i][j]);
				bi = i;
				bj = j;
			}
		}
	return { value, i: bi, j: bj };
}

/**
 * Participation ratio of the eigenvalues, (sum L)^2 / sum L^2.
 *
 * No eigendecomposition needed: for a symmetric M, sum L = tr(M) and
 * sum L^2 = tr(M^2) = sum_ij M_ij^2. Exact, and it cannot fail to converge.
 */
export function participationRatio(M: Matrix): number {
	let trace = 0;
	let frobenius2 = 0;
	for (let i = 0; i < M.length; i++) {
		trace += M[i][i];
		for (let j = 0; j < M.length; j++) frobenius2 += M[i][j] ** 2;
	}
	return frobenius2 < 1e-12 ? 0 : (trace * trace) / frobenius2;
}

/**
 * Lower-triangular Cholesky factor. Falls back to sqrt of the (clamped) diagonal
 * for the pathological non-PD case, which the +0.15*I ridge should already prevent.
 */
export function cholesky(M: Matrix): Matrix {
	const d = M.length;
	const L: Matrix = Array.from({ length: d }, () => new Array<number>(d).fill(0));
	for (let i = 0; i < d; i++) {
		for (let j = 0; j <= i; j++) {
			let s = M[i][j];
			for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
			if (i === j) L[i][j] = Math.sqrt(Math.max(s, 1e-12));
			else L[i][j] = s / (L[j][j] || 1e-12);
		}
	}
	return L;
}

export function cosine(a: number[], b: number[]): number {
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		na += a[i] * a[i];
		nb += b[i] * b[i];
	}
	return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

/** In-place median of a Float64Array (sorts it). */
export function median(values: Float64Array): number {
	if (values.length === 0) return 0;
	values.sort();
	const mid = values.length >> 1;
	return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

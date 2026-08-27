import { describe, expect, it } from 'vitest';
import { PALETTE, mixOklchOverHex, oklchToHex } from './palette';

/**
 * tokens.css is the source of truth; palette.ts is a hand-pinned sRGB copy of it because
 * satori/resvg can't parse oklch. Nothing enforces that the two stay in sync except this
 * test — it re-derives each PALETTE hex from the oklch triple in tokens.css and fails the
 * moment they drift by more than 1/255 per channel.
 */

function assertHexWithinTolerance(actual: string, expected: string) {
	const a = parseInt(actual.slice(1), 16);
	const e = parseInt(expected.slice(1), 16);
	const channels = (n: number) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	const [ar, ag, ab] = channels(a);
	const [er, eg, eb] = channels(e);
	expect(Math.abs(ar - er), `red channel: ${actual} vs ${expected}`).toBeLessThanOrEqual(1);
	expect(Math.abs(ag - eg), `green channel: ${actual} vs ${expected}`).toBeLessThanOrEqual(1);
	expect(Math.abs(ab - eb), `blue channel: ${actual} vs ${expected}`).toBeLessThanOrEqual(1);
}

describe('palette matches tokens.css oklch source values', () => {
	it('accent-primary: oklch(0.8 0.075 225)', () => {
		assertHexWithinTolerance(oklchToHex(0.8, 0.075, 225), PALETTE.accentPrimary);
	});

	it('accent-secondary: oklch(0.8 0.075 320)', () => {
		assertHexWithinTolerance(oklchToHex(0.8, 0.075, 320), PALETTE.accentSecondary);
	});

	it('text-primary: oklch(0.94 0.018 222)', () => {
		assertHexWithinTolerance(oklchToHex(0.94, 0.018, 222), PALETTE.textPrimary);
	});

	it('text-secondary: oklch(0.74 0.024 224)', () => {
		assertHexWithinTolerance(oklchToHex(0.74, 0.024, 224), PALETTE.textSecondary);
	});

	it('text-faint: oklch(0.55 0.022 226)', () => {
		assertHexWithinTolerance(oklchToHex(0.55, 0.022, 226), PALETTE.textFaint);
	});

	it('accent-primary-dim: color-mix(in oklch, oklch(0.8 0.075 225) 30%, bg-base)', () => {
		const mixed = mixOklchOverHex(0.8, 0.075, 225, 0.3, PALETTE.bgBase);
		assertHexWithinTolerance(mixed, PALETTE.accentPrimaryDim);
	});

	it('bg-base and surface-raised are already hex in tokens.css — literal passthrough', () => {
		expect(PALETTE.bgBase).toBe('#080b0f');
		expect(PALETTE.surfaceRaised).toBe('#0e151d');
	});
});

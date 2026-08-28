import { describe, expect, it } from 'vitest';
import { PACKS, getPack } from '../packs';
import { themeCss, themeVars, type PackTheme } from './theme';

describe('themeCss', () => {
	/**
	 * The pin that makes the theme refactor a relocation rather than a redesign. Every
	 * declaration below was transcribed from the `:root {}` block `src/lib/styles/tokens.css`
	 * shipped before the colours moved into packs. The one intentional difference:
	 * `--accent-primary-dim` mixed over `var(--bg-base)` there and over the literal
	 * `#080b0f` here — same colour, and the literal is what the satori mirror needs.
	 */
	it('reproduces the star-wars :root block the site shipped pre-refactor', () => {
		expect(themeCss(getPack('star-wars')!.theme)).toBe(
			':root{' +
				'--bg-base:#080b0f;' +
				'--surface-sunk:#05070a;' +
				'--surface-raised:#0e151d;' +
				'--surface-raised-2:#131c26;' +
				'--rule-hairline:color-mix(in oklch, oklch(0.8 0.075 225) 22%, transparent);' +
				'--rule-strong:color-mix(in oklch, oklch(0.8 0.075 225) 45%, transparent);' +
				'--text-primary:oklch(0.94 0.018 222);' +
				'--text-secondary:oklch(0.74 0.024 224);' +
				'--text-faint:oklch(0.55 0.022 226);' +
				'--accent-primary:oklch(0.8 0.075 225);' +
				'--accent-secondary:oklch(0.8 0.075 320);' +
				'--accent-primary-dim:color-mix(in oklch, oklch(0.8 0.075 225) 30%, #080b0f);' +
				'--accent-secondary-dim:color-mix(in oklch, oklch(0.8 0.075 320) 40%, transparent);' +
				'--glow-soft:0 0 28px color-mix(in oklch, oklch(0.8 0.075 225) 18%, transparent);' +
				'--glow-text:0 0 18px color-mix(in oklch, oklch(0.8 0.075 225) 35%, transparent);' +
				'--scanline:repeating-linear-gradient(180deg, ' +
				'color-mix(in oklch, oklch(0.8 0.075 225) 5%, transparent) 0 1px, transparent 1px 3px);' +
				"--font-display:'Helvetica Neue', Helvetica, Arial, sans-serif;" +
				"--font-mono:ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;" +
				'--anim-enter:holo-rise;' +
				'--anim-idle:holo-flicker' +
				'}'
		);
	});

	/**
	 * The output is emitted with `{@html}` into `<svelte:head>`, so a value that can close
	 * the tag or the rule is a live hazard. Failing the prerender is the correct outcome —
	 * shipping the page with a broken style block is not.
	 */
	it.each([
		['closes the rule', '}'],
		['closes the tag', '</style><script>'],
		['ends the declaration', 'red;color:blue'],
		['escapes', 'red\\']
	])('throws when a value %s', (_label, bad) => {
		const t = { ...getPack('star-wars')!.theme, bgBase: bad } as PackTheme;
		expect(() => themeCss(t)).toThrow(/not CSS-safe/);
	});

	it('scopes to a caller-supplied selector', () => {
		expect(themeCss(getPack('star-wars')!.theme, '.x')).toMatch(/^\.x\{/);
	});
});

describe('every registered pack', () => {
	/*
	 * Iterating PACKS rather than naming star-wars: a pack added to the registry gets these
	 * checks for free, which is the only reason they catch anything a hand-written test
	 * for one pack would not.
	 */
	it.each(PACKS.map((p) => [p.id, p] as const))('%s declares a renderable theme', (_id, pack) => {
		const vars = themeVars(pack.theme);
		// Components reference these by name; a missing one renders as an invalid value and
		// the element silently falls back to its initial colour.
		for (const key of [
			'bg-base',
			'surface-sunk',
			'surface-raised',
			'surface-raised-2',
			'rule-hairline',
			'rule-strong',
			'text-primary',
			'text-secondary',
			'text-faint',
			'accent-primary',
			'accent-secondary',
			'accent-primary-dim',
			'accent-secondary-dim',
			'glow-soft',
			'glow-text',
			'scanline',
			'font-display',
			'font-mono',
			'anim-enter',
			'anim-idle'
		]) {
			expect(vars[key], `${pack.id} is missing --${key}`).toBeTruthy();
		}
		expect(() => themeCss(pack.theme)).not.toThrow();
	});

	it.each(PACKS.map((p) => [p.id, p] as const))('%s declares chrome strings', (_id, pack) => {
		expect(pack.chrome.label).toBeTruthy();
		expect(pack.chrome.status.idle).toBeTruthy();
		expect(pack.chrome.status.inProgress).toBeTruthy();
		expect(pack.chrome.status.sealed).toBeTruthy();
	});
});

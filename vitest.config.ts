import { defineConfig } from 'vitest/config';

/**
 * Standalone from vite.config.ts on purpose: the engine, the fixture pack and the
 * scripts/ tooling are all plain TypeScript, so the tests must not require a
 * `svelte-kit sync` to have run. Add a Svelte-aware project here if component tests
 * are ever needed.
 */
export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.{test,spec}.ts'],
		environment: 'node'
	}
});

import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({ fallback: '404.html' }),
			// Project Pages serve from /<repo>: without this every asset 404s in
			// production while working perfectly in dev.
			paths: {
				base: process.env.BASE_PATH ?? '',
				// relative:true (the default) makes `base` resolve to '../..' in prerendered
				// output, which is fine for navigation but produces
				// 'https://host../../../og/x.png' when concatenated onto an origin for
				// og:image. Absolute base keeps src/lib/site.ts honest.
				relative: false
			},
			prerender: { entries: ['*'] }
		})
	]
});

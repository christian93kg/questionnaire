import { error } from '@sveltejs/kit';
import { getPack } from '$lib/packs';
import type { LayoutLoad } from './$types';

export const prerender = true;

// No `entries()` here — SvelteKit only accepts it from +page.ts/+page.server.ts/+server.ts,
// and each child page already declares its own. The prerenderer walks those.

/**
 * Resolves the pack once for the whole `[pack]` subtree.
 *
 * The point of loading it HERE rather than in each `+page.ts` is that SvelteKit merges
 * every matched node's data into `page.data`, so the ROOT layout can read `page.data.pack`
 * and paint the theme and chrome without knowing anything about the route shape. The child
 * pages still resolve the pack themselves; this is additive.
 *
 * There is deliberately no `+layout.svelte` beside this file. Chrome markup here would
 * render inside the root layout's `{#key page.url.pathname}` block, so it would re-mount
 * and re-run the entrance animation on every single question.
 */
export const load: LayoutLoad = ({ params }) => {
	const pack = getPack(params.pack);
	if (!pack) error(404, 'No such questionnaire');
	return { pack };
};

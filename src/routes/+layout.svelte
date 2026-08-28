<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import '$lib/styles/tokens.css';
	import '$lib/styles/animations.css';
	import { themeCss } from '$lib/engine/theme';
	import { SITE_CHROME, SITE_THEME } from '$lib/packs';
	import type { QuizPack } from '$lib/engine/types';

	let { children } = $props();

	// `page.data` is every matched node's data merged, so the ROOT layout reads what
	// [pack]/+layout.ts loaded without matching on the route shape itself. `/` matches no
	// pack, and gets the hallway's OWN neutral palette — not the first pack's, which would
	// hand the landing page whichever quiz happened to ship first.
	const pack = $derived(page.data.pack as QuizPack | undefined);
	const theme = $derived(pack?.theme ?? SITE_THEME);
	const chrome = $derived(pack?.chrome ?? SITE_CHROME);

	// Chrome status line. Which of the three states is still derived from the route shape
	// (landing / in-progress / sealed); the pack only supplies the words.
	const status = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/quiz/')) return chrome.status.inProgress;
		if (path.includes('/r/')) return chrome.status.sealed;
		return chrome.status.idle;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!--
		The active pack's theme, as a `:root {}` block.

		In the head rather than on a wrapper element because these tokens paint `html`,
		`body` and the overscroll area, which no element inside the app can reach. Rendered
		during prerender rather than applied on mount, because a theme applied by JS flashes
		the previous pack's colours on every load. Only ever ONE pack's block is emitted, so
		there is nothing to leak across a client-side navigation and no cascade to fight.

		`{@html}` rather than a `<style>` child so the Svelte compiler does not mistake this
		for the component's own scoped style block. `themeCss()` throws on any value that
		could close the tag or the rule.
	-->
	{@html `<style data-theme="${pack?.id ?? 'site'}">${themeCss(theme)}</style>`}
</svelte:head>

<div class="shell">
	<div class="column">
		<header class="chrome">
			<span class="chrome-label">{chrome.label}</span>
			<span class="chrome-status">{status}</span>
		</header>
		{#key page.url.pathname}
			<main>
				{@render children()}
			</main>
		{/key}
	</div>
</div>

<style>
	.shell {
		min-height: 100vh;
		background: var(--bg-base);
		background-image: var(--scanline);
		display: flex;
		justify-content: center;
		padding: 0 0 var(--space-8);
	}
	.column {
		width: 100%;
		max-width: var(--measure);
		padding: var(--space-5) var(--space-4) 0;
		position: relative;
	}
	.chrome {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--rule-hairline);
	}
	.chrome-label {
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--accent-primary);
	}
	.chrome-status {
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		color: var(--text-faint);
	}
	main {
		/* Named via a custom property, not literally: a literal keyframe name here would be
		   scoped by the compiler and stop resolving. See src/lib/styles/animations.css. */
		animation: var(--anim-enter) var(--dur-slow) var(--ease) both;
	}
</style>

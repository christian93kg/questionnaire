<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import '$lib/styles/tokens.css';

	let { children } = $props();

	// Chrome status line. No per-pack state to read here, so it's derived from the route
	// shape alone — same three states the design specifies (landing / in-progress / sealed).
	const status = $derived.by(() => {
		const path = page.url.pathname;
		if (path.includes('/quiz/')) return 'SUBJECT PRESENT';
		if (path.includes('/r/')) return 'RECORD SEALED';
		return 'AWAITING SUBJECT';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<div class="column">
		<header class="chrome">
			<span class="chrome-label">Holo-record · intake</span>
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
		animation: holo-rise var(--dur-slow) var(--ease) both;
	}
</style>

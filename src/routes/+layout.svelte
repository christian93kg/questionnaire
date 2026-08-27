<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/tokens.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	main {
		max-width: var(--measure);
		margin: 0 auto;
		padding: var(--space-3) var(--space-2) var(--space-4);
	}
</style>

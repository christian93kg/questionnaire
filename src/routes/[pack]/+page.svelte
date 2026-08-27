<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();
	const pack = data.pack;
</script>

<svelte:head>
	<title>{pack.title}</title>
	<meta name="description" content={pack.intro.lede[0]} />
	<meta property="og:title" content={pack.title} />
	<meta property="og:description" content={pack.intro.lede[0]} />
</svelte:head>

<p class="eyebrow">{pack.intro.eyebrow} · Form {pack.formCode}</p>
<h1>{pack.title}</h1>
{#each pack.intro.lede as line}
	<p class="lede">{line}</p>
{/each}

<h2>How long have you got?</h2>
<ul class="tiers">
	{#each pack.tiers as tier}
		<li>
			<a href="{base}/{pack.id}/quiz/{tier.id}/">
				<strong>{tier.label}</strong>
				<span class="meta">{tier.questionCount} questions · ~{tier.estMinutes} min</span>
				<span class="blurb">{tier.blurb}</span>
			</a>
		</li>
	{/each}
</ul>

<p class="fine">{pack.intro.fine}</p>

<style>
	.eyebrow {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0 0 var(--space-2);
	}
	h1 {
		font-family: var(--font-mono);
		font-size: var(--step-3);
		line-height: 1.05;
		text-transform: uppercase;
		margin: 0 0 var(--space-2);
	}
	h2 {
		font-size: var(--step-1);
		margin: var(--space-4) 0 var(--space-2);
	}
	.lede {
		color: var(--dim);
		margin: 0 0 var(--space-1);
	}
	.tiers {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-1);
	}
	.tiers a {
		display: grid;
		gap: 0.2rem;
		padding: var(--space-2);
		background: var(--panel);
		border: 1px solid var(--edge);
		border-left: 2px solid var(--edge);
		border-radius: var(--radius);
		color: inherit;
		text-decoration: none;
		transition: border-color var(--motion-fast) var(--ease);
	}
	.tiers a:hover {
		border-left-color: var(--accent);
	}
	.meta,
	.blurb {
		font-size: 0.85rem;
		color: var(--dim);
	}
	.meta {
		font-family: var(--font-mono);
	}
	.fine {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--dim);
		margin-top: var(--space-4);
	}
</style>

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

<div class="intro">
	<p class="eyebrow">{pack.intro.eyebrow} · Form {pack.formCode}</p>
	<h1>{pack.title}</h1>
	{#each pack.intro.lede as line}
		<p class="lede">{line}</p>
	{/each}
</div>

<div class="picker">
	<h2>Select depth of assessment</h2>
	<ul class="tiers">
		{#each pack.tiers as tier}
			<li>
				<a href="{base}/{pack.id}/quiz/{tier.id}/">
					<span class="count">{tier.questionCount}</span>
					<span class="detail">
						<span class="name">{tier.label}</span>
						<span class="meta">{tier.questionCount} questions · ~{tier.estMinutes} min</span>
						<span class="blurb">{tier.blurb}</span>
					</span>
					<span class="arrow" aria-hidden="true">&rarr;</span>
				</a>
			</li>
		{/each}
	</ul>
	<p class="fine">{pack.intro.fine}</p>
</div>

<style>
	.intro {
		padding: var(--space-7) 0 var(--space-6);
	}
	.eyebrow {
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
		margin: 0;
	}
	h1 {
		font-family: var(--font-display);
		font-size: var(--type-3xl);
		line-height: 1;
		letter-spacing: var(--track-display);
		font-weight: 700;
		text-transform: uppercase;
		text-shadow: var(--glow-text);
		margin: var(--space-4) 0 0;
	}
	.lede {
		font-size: var(--type-base);
		line-height: 1.5;
		color: var(--text-secondary);
		max-width: 34ch;
		margin: var(--space-3) 0 0;
		text-wrap: pretty;
	}
	.picker {
		border-top: 1px solid var(--rule-hairline);
		padding-top: var(--space-4);
	}
	h2 {
		font-family: var(--font-mono);
		font-size: var(--type-2xs);
		font-weight: 400;
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--accent-primary);
		margin: 0 0 var(--space-3);
	}
	.tiers {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
	}
	.tiers a {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--surface-raised);
		border: 1px solid var(--rule-hairline);
		border-radius: var(--radius);
		color: inherit;
		text-decoration: none;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			transform var(--dur-fast) var(--ease);
	}
	.tiers a:hover {
		background: var(--surface-raised-2);
		border-color: var(--accent-primary);
		transform: translateX(2px);
	}
	.tiers a:active {
		transform: translateX(0);
	}
	.count {
		font-family: var(--font-display);
		font-size: var(--type-xl);
		font-weight: 700;
		color: var(--accent-primary);
		min-width: 2.2ch;
		text-shadow: var(--glow-text);
	}
	.detail {
		display: grid;
		gap: 3px;
	}
	.name {
		font-family: var(--font-display);
		font-size: var(--type-base);
		font-weight: 600;
		letter-spacing: 0.01em;
		text-transform: uppercase;
	}
	.meta,
	.blurb {
		font-size: var(--type-xs);
		color: var(--text-faint);
	}
	.arrow {
		font-size: var(--type-lg);
		color: var(--text-faint);
	}
	.fine {
		font-size: var(--type-xs);
		line-height: 1.6;
		color: var(--text-faint);
		margin: var(--space-4) 0 0;
	}
</style>

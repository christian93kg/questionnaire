<script lang="ts">
	import { base } from '$app/paths';
	let { data } = $props();
</script>

<svelte:head>
	<title>Questionnaires</title>
	<meta
		name="description"
		content="Personality questionnaires that score what you do under pressure against a roster of characters, not four boxes."
	/>
	<meta property="og:title" content="Questionnaires" />
	<meta
		property="og:description"
		content="Personality questionnaires that score what you do under pressure against a roster of characters, not four boxes."
	/>
</svelte:head>

<div class="intro">
	<p class="eyebrow">Index</p>
	<h1>Questionnaires</h1>
	<p class="lede">
		Each one scores what you do under pressure against a roster of characters, not four boxes. No
		sign-in. Nothing leaves this device.
	</p>
</div>

<div class="picker">
	<h2>Available</h2>
	<ul class="quizzes">
		{#each data.packs as pack}
			<li>
				<a href="{base}/{pack.id}/">
					<span class="code">{pack.formCode}</span>
					<span class="detail">
						<span class="name">{pack.title}</span>
						<span class="meta">
							{pack.characterCount} results · {pack.questionCount} questions · from ~{pack.estMinutes}
							min
						</span>
						<span class="blurb">{pack.eyebrow}</span>
					</span>
					<span class="arrow" aria-hidden="true">&rarr;</span>
				</a>
			</li>
		{/each}
	</ul>
	<p class="fine">Each one looks like the thing it is about.</p>
</div>

<style>
	/*
	 * Deliberately the plainest page on the site. It is the hallway: it borrows the shared
	 * type and spacing scale and whatever colour tokens the DEFAULT pack supplies, and does
	 * nothing to announce a world of its own — a quiz's theme should be the surprise behind
	 * its own door. Everything here is a var(), so this page follows the default theme
	 * rather than pinning a second copy of it.
	 */
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
		color: var(--text-faint);
		margin: 0 0 var(--space-3);
	}
	/*
	 * One column at every count. A grid that reflowed to two would put the third and fourth
	 * quiz side by side inside --measure (460px), which is narrower than two readable cards;
	 * a vertical list scales to any number without a breakpoint.
	 */
	.quizzes {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
	}
	.quizzes a {
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
	.quizzes a:hover {
		background: var(--surface-raised-2);
		border-color: var(--accent-primary);
		transform: translateX(2px);
	}
	.quizzes a:active {
		transform: translateX(0);
	}
	.code {
		font-family: var(--font-mono);
		font-size: var(--type-sm);
		letter-spacing: var(--track-label);
		color: var(--accent-primary);
		min-width: 4.5ch;
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
		text-wrap: balance;
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

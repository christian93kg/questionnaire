<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import AxisProfile from '$lib/components/AxisProfile.svelte';
	import { scoreQuiz } from '$lib/engine/score';
	import { decodeResult } from '$lib/engine/share';
	import { tap, REVEAL } from '$lib/haptics';
	import type { ScoreResult } from '$lib/engine/types';

	let { data } = $props();
	const { pack, character } = data;

	let toast = $state('');

	// Prerender emits the static per-character OG page; the answer blob is a client-only
	// concern, and reading searchParams during prerender is an error by design.
	const blob = $derived(browser ? page.url.searchParams.get('a') : null);

	const decoded = $derived(blob ? decodeResult(pack, blob) : null);

	const result = $derived.by((): ScoreResult | null => {
		if (!decoded || decoded.status === 'malformed' || decoded.status === 'superseded') return null;
		return scoreQuiz(pack, decoded.tier, decoded.answers);
	});

	const named = (id: string) => pack.characters.find((c) => c.id === id);
	const winner = $derived(result ? (named(result.winner) ?? character) : character);

	$effect(() => {
		if (result) tap(REVEAL);
	});

	const shareText = $derived(
		result
			? [
					`${pack.title}`,
					`I'm ${winner.name.toUpperCase()} — ${winner.epithet}.`,
					winner.strength,
					result.crew.length ? `Crew: ${result.crew.map((c) => named(c)?.name).join(', ')}.` : '',
					`${page.url.href}`,
					'Your turn.'
				]
					.filter(Boolean)
					.join('\n')
			: ''
	);

	async function copy() {
		try {
			await navigator.clipboard.writeText(shareText);
			toast = 'Copied — paste it in the group chat';
		} catch {
			const ta = document.createElement('textarea');
			ta.value = shareText;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand('copy');
				toast = 'Copied — paste it in the group chat';
			} catch {
				toast = 'Copy blocked — select the text instead';
			}
			document.body.removeChild(ta);
		}
	}

	const CONFIDENCE_COPY = {
		provisional: 'Provisional read. More questions would settle it.',
		clear: 'Clear read. The longer form would sharpen it.',
		unambiguous: 'Unambiguous. This is who the answers describe.'
	} as const;
</script>

<svelte:head>
	<title>{winner.name} — {pack.title}</title>
	<meta name="description" content={winner.blurb} />
	<meta property="og:title" content="{winner.name} — {winner.epithet}" />
	<meta property="og:description" content={winner.blurb} />
	<meta property="og:type" content="website" />
</svelte:head>

{#if decoded?.status === 'superseded'}
	<p class="eyebrow">Archive mismatch</p>
	<h1>This code can't be read</h1>
	<p class="lede">
		It was issued against Form {pack.formCode} revision {decoded.packVersion}. That revision has been
		superseded, and these answers can't be honestly mapped onto the current one.
	</p>
	<a class="btn" href="{base}/{pack.id}/">Take it yourself</a>
{:else if decoded?.status === 'malformed'}
	<p class="eyebrow">Unreadable</p>
	<h1>That link is damaged</h1>
	<p class="lede">The answer code didn't survive the trip. It may have been truncated in a chat app.</p>
	<a class="btn" href="{base}/{pack.id}/">Take it yourself</a>
{:else}
	{#if decoded?.status === 'migrated'}
		<p class="notice">Form {pack.formCode} was revised since this was issued. Reconstructed from archive.</p>
	{/if}

	<p class="eyebrow">{result ? 'Assessment complete' : 'One of 48 results'}</p>
	<h1 class="verdict">{winner.name}</h1>
	<p class="epithet">{winner.epithet}</p>
	<p class="body-copy">{winner.blurb}</p>

	<div class="facts">
		<div>
			<p class="k">What you're good at</p>
			<p class="v">{winner.strength}</p>
		</div>
		<div>
			<p class="k">Where it costs you</p>
			<p class="v warn">{winner.blindspot}</p>
		</div>
	</div>

	{#if result}
		<section>
			<p class="k">Your profile</p>
			<AxisProfile axes={pack.axes} z={result.z} />
		</section>

		<section>
			<p class="k">Closest to you</p>
			<ul class="plain">
				{#each result.crew as id}
					<li>{named(id)?.name} — <span class="dim">{named(id)?.epithet}</span></li>
				{/each}
			</ul>
		</section>

		{#if result.opposite}
			<section>
				<p class="k">Furthest from you</p>
				<p class="v">{named(result.opposite)?.name}</p>
			</section>
		{:else}
			<section>
				<p class="k">Furthest from you</p>
				<p class="v">No true opposite. You're legible to almost everyone in this file.</p>
			</section>
		{/if}

		<section>
			<p class="k">What decided it</p>
			<ul class="plain">
				{#each result.decisive as d}
					<li>
						Question {d.questionIndex + 1}{#if d.wouldFlip && d.counterfactualWinner}
							— answer it differently and this reads {named(d.counterfactualWinner)?.name}{/if}
					</li>
				{/each}
			</ul>
		</section>

		<section>
			<p class="k">Confidence</p>
			<p class="v">{CONFIDENCE_COPY[result.confidenceBand]}</p>
		</section>

		<div class="code"><span>Answer code</span><b>{result.code}</b></div>

		<div class="btn-row">
			<button class="btn" onclick={copy}>Copy result</button>
			<a class="btn ghost" href="{base}/{pack.id}/">Take it yourself</a>
		</div>
		<p class="toast">{toast}</p>
	{:else}
		<p class="lede">This is one of the possible results. Take it and find out which one is yours.</p>
		<a class="btn" href="{base}/{pack.id}/">Take the questionnaire</a>
	{/if}
{/if}

<style>
	.eyebrow,
	.k {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--dim);
		margin: 0 0 0.4rem;
	}
	.eyebrow {
		color: var(--accent);
		margin-bottom: var(--space-2);
	}
	h1,
	.verdict {
		font-family: var(--font-mono);
		font-size: var(--step-3);
		line-height: 1;
		text-transform: uppercase;
		margin: 0 0 0.4rem;
	}
	.epithet {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0 0 var(--space-2);
	}
	.body-copy,
	.lede {
		margin: 0 0 var(--space-3);
	}
	.lede {
		color: var(--dim);
	}
	.facts {
		border-top: 1px solid var(--edge);
		padding-top: var(--space-2);
		display: grid;
		gap: var(--space-2);
	}
	section {
		border-top: 1px solid var(--edge);
		margin-top: var(--space-3);
		padding-top: var(--space-2);
	}
	.v {
		margin: 0;
	}
	.v.warn {
		color: var(--warn);
	}
	.plain {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.3rem;
	}
	.dim {
		color: var(--dim);
	}
	.notice {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--dim);
		border-left: 2px solid var(--accent);
		padding-left: 0.7rem;
	}
	.code {
		margin-top: var(--space-3);
		border: 1px dashed var(--edge);
		border-radius: var(--radius);
		padding: 0.7rem 0.9rem;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		color: var(--dim);
		display: flex;
		justify-content: space-between;
		gap: 0.7rem;
		flex-wrap: wrap;
	}
	.code b {
		color: var(--accent);
		font-weight: 400;
	}
	.btn-row {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-top: var(--space-3);
	}
	.btn {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		background: var(--accent);
		color: var(--void);
		border: none;
		border-radius: 2px;
		padding: 0.85rem 1.5rem;
		cursor: pointer;
		font-weight: 700;
		text-decoration: none;
		margin-top: var(--space-2);
	}
	.btn.ghost {
		background: transparent;
		color: var(--bone);
		border: 1px solid var(--edge);
	}
	.toast {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		min-height: 1rem;
	}
</style>

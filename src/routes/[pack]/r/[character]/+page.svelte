<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import AxisProfile from '$lib/components/AxisProfile.svelte';
	import { scoreQuiz } from '$lib/engine/score';
	import { decodeResult } from '$lib/engine/share';
	import { tap, REVEAL } from '$lib/haptics';
	import { rarityOf, rarityLabel, shareOf } from '$lib/engine/rarity';
	import { glyphFor } from '$lib/engine/glyph';
	import { absolute } from '$lib/site';
	import type { ScoreResult } from '$lib/engine/types';

	let { data } = $props();
	const { pack, character } = data;

	let toast = $state('');
	let isShared = $state(false);

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

	// A shared link and your own result land on the identical URL shape, so the only
	// distinguisher is the marker set at finish(). Absent marker reads as shared, which
	// is the safe default: it never tells a stranger "this is you".
	$effect(() => {
		if (!blob) return;
		try {
			isShared = sessionStorage.getItem('own-result') !== blob;
		} catch {
			isShared = true;
		}
	});

	const rarity = $derived(rarityOf(pack, winner.id));
	const rarityText = $derived(rarityLabel(pack, winner.id));
	const share = $derived(shareOf(pack, winner.id));
	/** Derived from the winner's trait vector, so the art is the character, not decoration. */
	const glyph = $derived(glyphFor(pack, winner.id, 44, 12).join('\n'));

	// Chat crawlers do not resolve relative og:image URLs, and page.url.origin is
	// 'http://sveltekit-prerender' at build time. absolute() supplies origin + base path.
	const ogImage = $derived(absolute(`/og/${pack.id}/${winner.id}.png`));
	const canonicalUrl = $derived(absolute(`/${pack.id}/r/${winner.id}/`));

	/**
	 * The bare "Question 28 — answer it differently and this reads X" was useless: you had
	 * to retake the quiz to learn what Q28 even asked, and all three lines named the same
	 * runner-up. Resolve the real text, and state the alternative once.
	 */
	const decisiveDetail = $derived.by(() => {
		if (!result) return [];
		const flipAt = result.decisive.findIndex((d) => d.wouldFlip && d.counterfactualWinner);
		return result.decisive.map((d, i) => {
			const q = pack.questions.find((x) => x.id === d.questionId);
			return {
				text: q?.text ?? `Question ${d.questionIndex + 1}`,
				answer: q?.options.find((o) => o.id === d.optionId)?.text ?? '',
				alt: i === flipAt ? (named(d.counterfactualWinner!)?.name ?? null) : null
			};
		});
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

	<!--
		og:* uses property=, twitter:* uses name= — mixing them is the silent failure mode.
		og:url is the blob-free canonical path so every share of a character dedupes to one
		cached card; page.url.href would carry ?a= and defeat that.
	-->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={pack.title} />
	<meta property="og:title" content="{winner.name} — {winner.epithet}" />
	<meta property="og:description" content={winner.blurb} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:secure_url" content={ogImage} />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="{winner.name} — {winner.epithet}" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{winner.name} — {winner.epithet}" />
	<meta name="twitter:description" content={winner.blurb} />
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content="{winner.name} — {winner.epithet}" />
</svelte:head>

{#if decoded?.status === 'superseded'}
	<p class="eyebrow warn">Archive mismatch</p>
	<h1 class="err-head">This code can't be read</h1>
	<p class="lede">
		It was issued against Form {pack.formCode} revision {decoded.packVersion}. That revision has
		been superseded, and these answers can't be honestly mapped onto the current one.
	</p>
	<a class="btn" href="{base}/{pack.id}/">Take it yourself</a>
{:else if decoded?.status === 'malformed'}
	<p class="eyebrow warn">Unreadable</p>
	<h1 class="err-head">That link is damaged</h1>
	<p class="lede">The answer code didn't survive the trip. It may have been truncated in a chat app.</p>
	<a class="btn" href="{base}/{pack.id}/">Take it yourself</a>
{:else}
	{#if decoded?.status === 'migrated'}
		<p class="notice">Form {pack.formCode} was revised since this was issued. Reconstructed from archive.</p>
	{/if}

	<div class="card">
		<div class="card-head">
			<span>Disposition</span>
			{#if rarityText}
				<span class="rarity" class:rare={rarity === 'rare'}>{rarityText}</span>
			{:else}
				<span>{result ? 'Assessment complete' : `One of ${pack.characters.length} results`}</span>
			{/if}
		</div>

		{#if result && isShared}
			<p class="filed-by">Filed by someone else. Scroll down to run your own.</p>
		{/if}

		<pre class="glyph" aria-hidden="true">{glyph}</pre>

		<div class="card-body">
			<h1 class="verdict">{winner.name}</h1>
			<p class="epithet">{winner.epithet}</p>

			<p class="meta-row">
				{#if winner.debut}
					<span>Introduced in {winner.debut.title} ({winner.debut.year})</span>
				{/if}
				{#if share !== null}
					<span>{share < 1 ? share.toFixed(1) : Math.round(share)}% land here</span>
				{/if}
			</p>

			<p class="body-copy">{winner.blurb}</p>

			<div class="facts">
				<div>
					<p class="k">What you're good at</p>
					<p class="v">{winner.strength}</p>
				</div>
				<div>
					<p class="k accent">Where it costs you</p>
					<p class="v">{winner.blindspot}</p>
				</div>
			</div>
		</div>

		{#if result}
			<section class="profile-panel">
				<div class="section-head">
					<span>Your profile</span><span class="dim">{pack.axes.length} axes</span>
				</div>
				<AxisProfile axes={pack.axes} z={result.z} />
			</section>

			<section>
				<p class="k">Closest to you</p>
				<ul class="plain">
					{#each result.crew as id}
						<li>
							<a href="{base}/{pack.id}/r/{id}/">{named(id)?.name}</a>
							— <span class="dim">{named(id)?.epithet}</span>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<p class="k">Furthest from you</p>
				{#if result.opposite}
					<p class="v">
						<a href="{base}/{pack.id}/r/{result.opposite}/">{named(result.opposite)?.name}</a>
						— <span class="dim">{named(result.opposite)?.epithet}</span>
					</p>
				{:else}
					<p class="v">No true opposite. You're legible to almost everyone in this file.</p>
				{/if}
			</section>

			<section>
				<p class="k">What decided it</p>
				<ol class="decisive">
					{#each decisiveDetail as d}
						<li>
							<p class="dq">{d.text}</p>
							<p class="da">{d.answer}</p>
							{#if d.alt}
								<p class="dalt">Answer that one differently and this reads {d.alt}.</p>
							{/if}
						</li>
					{/each}
				</ol>
			</section>

			<section>
				<p class="k">Confidence</p>
				<p class="v">{CONFIDENCE_COPY[result.confidenceBand]}</p>
			</section>

			<div class="code-row">
				<span>{result.code}</span><span>FORM {pack.formCode}</span>
			</div>
		{/if}
	</div>

	{#if result}
		<div class="action-row">
			<button class="btn ghost" onclick={copy}>Copy result</button>
			<a class="btn ghost" href="{base}/{pack.id}/">Retake</a>
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
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
		margin: 0 0 0.4rem;
	}
	.eyebrow {
		margin: var(--space-4) 0 var(--space-2);
	}
	.eyebrow.warn {
		color: var(--accent-secondary);
	}
	.k.accent {
		color: var(--accent-secondary);
	}
	.err-head {
		font-family: var(--font-display);
		font-size: var(--type-2xl);
		line-height: 1.05;
		letter-spacing: var(--track-display);
		font-weight: 700;
		text-transform: uppercase;
		margin: 0 0 var(--space-3);
	}
	.lede {
		font-size: var(--type-base);
		line-height: 1.5;
		color: var(--text-secondary);
		margin: 0 0 var(--space-3);
		text-wrap: pretty;
	}
	.notice {
		font-size: var(--type-xs);
		line-height: 1.6;
		color: var(--text-faint);
		border-left: 2px solid var(--accent-primary);
		padding: 2px 0 2px var(--space-3);
		margin: var(--space-4) 0 0;
	}

	.card {
		margin-top: var(--space-4);
		background: var(--surface-raised);
		border: 1px solid var(--rule-hairline);
		border-top: 2px solid var(--accent-primary);
		border-radius: var(--radius);
		box-shadow: var(--glow-soft);
		overflow: hidden;
	}
	/* Decorative: the accessible identity is the name and epithet immediately below. */
	.glyph {
		margin: 0;
		padding: var(--space-4) 0 var(--space-2);
		font-family: var(--font-mono);
		font-size: clamp(7px, 2.5vw, 12px);
		line-height: 1.12;
		text-align: center;
		white-space: pre;
		overflow: hidden;
		color: var(--accent-primary);
		text-shadow: var(--glow-text);
		background-image: var(--scanline);
		border-bottom: 1px solid var(--rule-hairline);
		animation: holo-flicker 6s var(--ease) infinite;
	}
	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-4);
		margin: 0 0 var(--space-4);
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
	}
	.decisive {
		list-style: none;
		counter-reset: d;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-4);
	}
	.decisive li {
		counter-increment: d;
		padding-left: var(--space-5);
		position: relative;
	}
	.decisive li::before {
		content: counter(d, decimal-leading-zero);
		position: absolute;
		left: 0;
		top: 1px;
		font-size: var(--type-2xs);
		color: var(--accent-primary);
		letter-spacing: 0.08em;
	}
	.dq {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--type-sm);
		line-height: 1.4;
		color: var(--text-secondary);
		text-wrap: pretty;
	}
	.da {
		margin: var(--space-1) 0 0;
		font-size: var(--type-sm);
		color: var(--text-primary);
		border-left: 2px solid var(--accent-primary-dim);
		padding-left: var(--space-3);
	}
	.dalt {
		margin: var(--space-2) 0 0;
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--accent-secondary);
	}
	.rarity {
		color: var(--accent-primary);
	}
	.rarity.rare {
		color: var(--accent-secondary);
		text-shadow: var(--glow-text);
	}
	.filed-by {
		margin: 0;
		padding: var(--space-2) var(--space-4);
		border-bottom: 1px solid var(--rule-hairline);
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
	}
	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-4);
		background: var(--surface-sunk);
		border-bottom: 1px solid var(--rule-hairline);
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
	}
	.card-body {
		padding: var(--space-5) var(--space-4) var(--space-4);
	}
	.verdict {
		font-family: var(--font-display);
		font-size: var(--type-3xl);
		line-height: 0.9;
		letter-spacing: -0.03em;
		font-weight: 700;
		text-transform: uppercase;
		margin: 0;
		text-shadow: var(--glow-text);
	}
	.epithet {
		font-family: var(--font-display);
		font-size: var(--type-lg);
		font-style: italic;
		color: var(--accent-primary);
		margin: var(--space-2) 0 0;
	}
	.body-copy {
		font-size: var(--type-base);
		line-height: 1.55;
		color: var(--text-primary);
		margin: var(--space-4) 0 0;
		text-wrap: pretty;
	}
	.facts {
		display: grid;
		gap: var(--space-3);
		margin-top: var(--space-5);
		padding-top: var(--space-4);
		border-top: 1px solid var(--rule-hairline);
	}
	.v {
		font-size: var(--type-sm);
		line-height: 1.5;
		color: var(--text-primary);
		margin: 3px 0 0;
	}

	section {
		padding: var(--space-4);
		border-top: 1px solid var(--rule-hairline);
	}
	.profile-panel {
		background: var(--surface-sunk);
	}
	.section-head {
		display: flex;
		justify-content: space-between;
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--accent-primary);
		margin-bottom: var(--space-3);
	}
	.dim {
		color: var(--text-faint);
	}
	.plain {
		list-style: none;
		padding: 0;
		margin: 0.2rem 0 0;
		display: grid;
		gap: 0.3rem;
		font-size: var(--type-sm);
		color: var(--text-primary);
	}
	.code-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-top: 1px solid var(--rule-hairline);
		font-size: var(--type-2xs);
		letter-spacing: 0.08em;
		color: var(--text-faint);
	}

	.action-row {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-4);
	}
	.btn {
		display: inline-block;
		text-align: center;
		padding: var(--space-4);
		background: color-mix(in oklch, var(--accent-primary) 14%, var(--surface-raised));
		border: 1px solid var(--accent-primary);
		border-radius: var(--radius);
		font-family: var(--font-display);
		font-size: var(--type-base);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-primary);
		text-decoration: none;
		cursor: pointer;
		font: inherit;
		margin-top: var(--space-4);
	}
	.btn:hover {
		background: color-mix(in oklch, var(--accent-primary) 22%, var(--surface-raised));
	}
	.btn.ghost {
		flex: 1;
		margin-top: 0;
		padding: var(--space-3);
		background: none;
		border: 1px solid var(--rule-hairline);
		font-family: var(--font-mono);
		font-size: var(--type-xs);
		font-weight: 400;
		letter-spacing: var(--track-label);
		color: var(--text-secondary);
	}
	.btn.ghost:hover {
		background: none;
		border-color: var(--accent-primary);
		color: var(--text-primary);
	}
	.toast {
		font-size: var(--type-2xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--accent-primary);
		min-height: 1rem;
		margin: var(--space-2) 0 0;
	}
</style>

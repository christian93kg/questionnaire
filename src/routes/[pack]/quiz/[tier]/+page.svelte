<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { scoreQuiz, sectionsForTier } from '$lib/engine/score';
	import type { TierSection } from '$lib/engine/score';
	import { encodeResult } from '$lib/engine/share';
	import { tap, SELECT, BACK } from '$lib/haptics';
	import type { TierId } from '$lib/engine/types';

	let { data } = $props();
	const { pack, tier, questions } = data;

	// Sections actually present in this tier, keyed by the question index they open on, so
	// jumping to that index knows to show the chapter divider first. A tier missing a
	// section entirely (e.g. "disclosure" on the short tier) just never keys into this map.
	const allSections = sectionsForTier(pack, tier.id as TierId);
	/**
	 * Chapter dividers earn their place on a long run and get in the way on a short one.
	 * The short tier packs 6 sections into 10 questions -- two of them a single question --
	 * so you would tap through 6 dividers to answer 10 things. Gate on density rather than
	 * hardcoding a tier, so this stays right if the question bank is rebalanced.
	 */
	const MIN_QUESTIONS_PER_SECTION = 2.5;
	const sections =
		allSections.length > 0 && questions.length / allSections.length >= MIN_QUESTIONS_PER_SECTION
			? allSections
			: [];
	const sectionAtStart = new Map(sections.map((s) => [s.startIndex, s]));

	let answers = $state<number[]>([]);
	let index = $state(0);
	// The chapter divider for the section starting at `index`, or null when the current
	// question is showing. Only set moving forward -- `back()` always clears it, so
	// Backspace out of a section's first question lands on the previous question, not the
	// divider it just came from. Seeded from index 0 so section one gets its divider too.
	let pendingInterstitial = $state<TierSection | null>(sectionAtStart.get(0) ?? null);

	const current = $derived(questions[index]);
	// Same rule the design applies to the stem: long stems drop a size to keep the question
	// legible without pushing the options off-screen. Measured over scene AND handback, since
	// both render above the options and both take vertical space.
	const long = $derived(current.text.length + (current.ask?.length ?? 0) > 90);

	const ROMAN: Array<[number, string]> = [
		[10, 'X'],
		[9, 'IX'],
		[5, 'V'],
		[4, 'IV'],
		[1, 'I']
	];
	function toRoman(n: number): string {
		let out = '';
		for (const [v, sym] of ROMAN) {
			while (n >= v) {
				out += sym;
				n -= v;
			}
		}
		return out;
	}

	function goToIndex(i: number) {
		index = i;
		pendingInterstitial = sectionAtStart.get(i) ?? null;
	}

	function choose(option: number) {
		tap(SELECT);
		answers = [...answers.slice(0, index), option];
		if (index + 1 < questions.length) {
			goToIndex(index + 1);
		} else {
			finish();
		}
	}

	function advanceInterstitial() {
		tap(SELECT);
		pendingInterstitial = null;
	}

	function back() {
		if (index === 0) return;
		tap(BACK);
		index -= 1;
		pendingInterstitial = null;
		answers = answers.slice(0, index);
	}

	function finish() {
		const result = scoreQuiz(pack, tier.id as TierId, answers);
		const blob = encodeResult(pack, tier.id as TierId, answers, result.winner);
		// Mark this blob as self-authored. A shared link lands on the identical URL shape,
		// so without a marker the result page can't tell "you just finished" from
		// "someone sent you theirs" — and those want different copy.
		try {
			sessionStorage.setItem('own-result', blob);
		} catch {
			// private mode / storage disabled: falls back to the shared-link reading
		}
		goto(`${base}/${pack.id}/r/${result.winner}/?a=${blob}`);
	}

	// A single printable/space/enter key advances the divider; anything else (Tab, arrows,
	// Escape, modifier keys) passes through untouched so normal browser keyboard nav still
	// works while a divider is showing.
	function isAdvanceKey(key: string): boolean {
		return key.length === 1 || key === 'Enter' || key === ' ';
	}

	function onKey(e: KeyboardEvent) {
		if (pendingInterstitial) {
			if (e.key === 'Backspace') {
				back();
				e.preventDefault();
			} else if (isAdvanceKey(e.key)) {
				advanceInterstitial();
				e.preventDefault();
			}
			return;
		}
		if (e.key >= '1' && e.key <= '4') {
			choose(Number(e.key) - 1);
			e.preventDefault();
		} else if (e.key === 'Backspace' && index > 0) {
			back();
			e.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>{tier.label} · {pack.title}</title></svelte:head>

<div class="progress" aria-hidden="true">
	<div class="ticks">
		{#each questions as _, i}
			<span class="tick" class:done={i < index} class:now={i === index}></span>
		{/each}
	</div>
	<span class="count">{String(index + 1).padStart(2, '0')} / {questions.length}</span>
</div>

{#if pendingInterstitial}
	<button
		class="interstitial"
		onclick={advanceInterstitial}
		aria-label="Continue to {pendingInterstitial.label}"
	>
		<span class="part-label">
			Part {toRoman(pendingInterstitial.index)} of {toRoman(pendingInterstitial.total)}
		</span>
		<span class="section-label">{pendingInterstitial.label}</span>
		{#if pendingInterstitial.blurb}
			<span class="section-blurb">{pendingInterstitial.blurb}</span>
		{/if}
	</button>
{:else}
	<div class="qbody">
		<div class="stem-wrap">
			<p class="stem" class:long>{current.text}</p>
			{#if current.ask}
				<p class="ask">{current.ask}</p>
			{/if}
		</div>

		<div class="opts">
			{#each current.options as opt, n}
				<button class="opt" onclick={() => choose(n)}>
					<span class="key">{n + 1}</span>
					<span class="text">{opt.text}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<div class="nav">
	{#if index > 0}
		<button class="back" onclick={back}>&larr; Back</button>
	{:else}
		<a class="back" href="{base}/{pack.id}/">&larr; Back</a>
	{/if}
	<span class="hint">
		{pendingInterstitial ? 'Any key or tap to continue · Backspace back' : 'Keys 1–4 · Backspace back'}
	</span>
</div>

<style>
	.progress {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) 0 var(--space-2);
	}
	.ticks {
		flex: 1;
		display: flex;
		gap: 3px;
	}
	.tick {
		flex: 1;
		height: 3px;
		background: color-mix(in oklch, var(--accent-primary) 18%, transparent);
		transition: background var(--dur-fast) var(--ease);
	}
	.tick.done {
		background: var(--accent-primary);
	}
	.tick.now {
		background: var(--text-primary);
	}
	.count {
		font-size: var(--type-2xs);
		letter-spacing: 0.1em;
		color: var(--text-faint);
		white-space: nowrap;
	}
	.qbody {
		min-height: 52vh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}
	.interstitial {
		width: 100%;
		min-height: 52vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-6) var(--space-4);
		text-align: center;
		background: none;
		animation: var(--anim-enter) var(--dur-slow) var(--ease);
	}
	.part-label {
		font-family: var(--font-mono);
		font-size: var(--type-2xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--accent-primary);
		margin: 0;
	}
	.section-label {
		font-family: var(--font-display);
		font-size: var(--type-2xl);
		font-weight: 700;
		letter-spacing: var(--track-display);
		text-transform: uppercase;
		text-shadow: var(--glow-text);
		color: var(--text-primary);
		margin: 0;
	}
	.section-blurb {
		font-size: var(--type-base);
		line-height: 1.5;
		color: var(--text-secondary);
		max-width: 34ch;
		margin: 0;
		text-wrap: pretty;
	}
	.stem-wrap {
		padding-top: var(--space-4);
	}
	.stem {
		font-family: var(--font-display);
		font-weight: 600;
		letter-spacing: var(--track-display);
		color: var(--text-primary);
		margin: 0;
		text-wrap: pretty;
		font-size: var(--type-xl);
		line-height: 1.18;
	}
	.stem.long {
		font-size: var(--type-lg);
		line-height: 1.28;
	}
	/* The handback. Deliberately quieter than the stem and set in the body face: it is the
	   last beat of the scene, not a second question competing with the first. */
	.ask {
		font-family: var(--font-mono);
		font-weight: 400;
		color: var(--text-secondary);
		margin: var(--space-2) 0 0;
		font-size: var(--type-base);
		line-height: 1.4;
		text-wrap: pretty;
	}
	.opts {
		display: grid;
		gap: var(--space-2);
		margin-top: var(--space-5);
	}
	.opt {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-3);
		align-items: start;
		width: 100%;
		padding: var(--space-3) var(--space-4);
		min-height: 52px;
		background: var(--surface-raised);
		border: 1px solid var(--rule-hairline);
		border-left: 2px solid var(--accent-primary-dim);
		border-radius: var(--radius);
		transition:
			background var(--dur-fast) var(--ease),
			border-left-color var(--dur-fast) var(--ease);
	}
	.opt:hover {
		background: var(--surface-raised-2);
		border-left-color: var(--accent-primary);
	}
	.opt:active {
		background: color-mix(in oklch, var(--accent-primary) 16%, var(--surface-raised));
	}
	.key {
		font-size: var(--type-2xs);
		color: var(--text-faint);
		line-height: 1.75;
		min-width: 1ch;
	}
	.text {
		font-family: var(--font-display);
		font-size: var(--type-base);
		line-height: 1.35;
		color: var(--text-primary);
		text-wrap: pretty;
	}
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: var(--space-5);
		padding-top: var(--space-3);
		border-top: 1px solid var(--rule-hairline);
	}
	.back {
		font-size: var(--type-xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
		padding: var(--space-2) 0;
		border-bottom: none;
	}
	.back:hover {
		color: var(--text-primary);
	}
	.hint {
		font-size: var(--type-2xs);
		letter-spacing: 0.08em;
		color: var(--text-faint);
		white-space: nowrap;
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { scoreQuiz } from '$lib/engine/score';
	import { encodeResult } from '$lib/engine/share';
	import { tap, SELECT, BACK } from '$lib/haptics';
	import type { TierId } from '$lib/engine/types';

	let { data } = $props();
	const { pack, tier, questions } = data;

	let answers = $state<number[]>([]);
	let index = $state(0);

	const current = $derived(questions[index]);

	function choose(option: number) {
		tap(SELECT);
		answers = [...answers.slice(0, index), option];
		if (index + 1 < questions.length) {
			index += 1;
		} else {
			finish();
		}
	}

	function back() {
		if (index === 0) return;
		tap(BACK);
		index -= 1;
		answers = answers.slice(0, index);
	}

	function finish() {
		const result = scoreQuiz(pack, tier.id as TierId, answers);
		const blob = encodeResult(pack, tier.id as TierId, answers, result.winner);
		goto(`${base}/${pack.id}/r/${result.winner}/?a=${blob}`);
	}

	function onKey(e: KeyboardEvent) {
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

<div class="strip" aria-hidden="true">
	{#each questions as _, i}
		<span class="cell" class:done={i < answers.length} class:now={i === index}></span>
	{/each}
</div>

<p class="qnum">
	Question {String(index + 1).padStart(2, '0')} of {questions.length}
</p>
<h1 class="qtext">{current.text}</h1>

<div class="opts">
	{#each current.options as opt, n}
		<button class="opt" onclick={() => choose(n)}>
			<span class="key">{n + 1}</span>
			<span>{opt.text}</span>
		</button>
	{/each}
</div>

<div class="nav">
	{#if index > 0}
		<button class="back" onclick={back}>&larr; Previous</button>
	{:else}
		<a class="back" href="{base}/{pack.id}/">&larr; Start over</a>
	{/if}
	<span class="hint">Keys 1&ndash;4</span>
</div>

<style>
	.strip {
		display: flex;
		gap: 3px;
		margin-bottom: var(--space-3);
	}
	.cell {
		flex: 1;
		height: 5px;
		background: var(--panel-hi);
		transition: background var(--motion-fast) var(--ease);
	}
	.cell.done,
	.cell.now {
		background: var(--accent);
	}
	.qnum {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		color: var(--dim);
		margin: 0 0 var(--space-1);
	}
	.qtext {
		font-size: var(--step-2);
		line-height: 1.3;
		font-weight: 600;
		margin: 0 0 var(--space-3);
	}
	.opts {
		display: grid;
		gap: 0.6rem;
	}
	.opt {
		display: flex;
		gap: 0.9rem;
		align-items: flex-start;
		text-align: left;
		width: 100%;
		background: var(--panel-hi);
		border: 1px solid transparent;
		border-left: 2px solid var(--edge);
		border-radius: var(--radius);
		color: var(--bone);
		font: inherit;
		padding: 0.9rem 1rem;
		cursor: pointer;
		transition: border-color var(--motion-fast) var(--ease);
	}
	.opt:hover {
		border-left-color: var(--accent);
	}
	.key {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--dim);
		padding-top: 0.2rem;
	}
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: var(--space-2);
	}
	.back,
	.hint {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--dim);
	}
	.back {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.4rem 0;
		text-decoration: none;
	}
	.back:hover {
		color: var(--accent);
	}
</style>

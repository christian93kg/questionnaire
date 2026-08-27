<script lang="ts">
	import type { Axis } from '$lib/engine/types';

	/**
	 * Generic in axis count by construction. A second fandom pack declares a different
	 * number of axes with different names, so nothing here may assume seven or know what
	 * they mean.
	 */
	let {
		axes,
		z,
		clip = 2.5
	}: { axes: Axis[]; z: Record<string, number>; clip?: number } = $props();

	const pct = (v: number) => Math.max(-100, Math.min(100, (v / clip) * 100));

	function strength(v: number): string {
		const a = Math.abs(v);
		if (a >= 1.5) return 'markedly';
		if (a >= 0.75) return 'clearly';
		if (a >= 0.4) return 'somewhat';
		return 'hard to read';
	}
</script>

<ul class="profile">
	{#each axes as axis}
		{@const value = z[axis.id] ?? 0}
		{@const pole = value >= 0 ? axis.positive : axis.negative}
		{@const positive = value >= 0}
		{@const mag = Math.abs(pct(value)) / 2}
		<li>
			<div class="labels">
				<span class="pole" class:active={!positive}>{axis.negative.label}</span>
				<span class="pole" class:active={positive}>{axis.positive.label}</span>
			</div>
			<div class="track">
				<span class="mid"></span>
				<span
					class="fill"
					class:neg={!positive}
					style="left:{positive ? 50 : 50 - mag}%; width:{mag}%"
				></span>
			</div>
			<p class="read">
				{strength(value)}
				{Math.abs(value) < 0.4 ? '' : pole.label.toLowerCase()}
			</p>
		</li>
	{/each}
</ul>

<style>
	.profile {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-3);
	}
	li {
		display: grid;
		gap: 4px;
	}
	.labels {
		display: flex;
		justify-content: space-between;
		font-size: var(--type-2xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.pole {
		color: var(--text-faint);
	}
	.pole.active {
		color: var(--text-primary);
	}
	.track {
		position: relative;
		height: 10px;
		background: color-mix(in oklch, var(--accent-primary) 7%, transparent);
		border-top: 1px solid var(--rule-hairline);
	}
	.mid {
		position: absolute;
		left: 50%;
		top: -2px;
		bottom: -2px;
		width: 1px;
		background: var(--rule-strong);
	}
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		background: var(--accent-primary);
		box-shadow: 0 0 10px color-mix(in oklch, var(--accent-primary) 45%, transparent);
		transition:
			left var(--dur-slow) var(--ease),
			width var(--dur-slow) var(--ease);
	}
	.fill.neg {
		background: var(--accent-secondary);
		box-shadow: 0 0 10px color-mix(in oklch, var(--accent-secondary) 45%, transparent);
	}
	.read {
		margin: 0;
		font-size: var(--type-2xs);
		letter-spacing: 0.04em;
		color: var(--text-faint);
		text-align: right;
	}
</style>

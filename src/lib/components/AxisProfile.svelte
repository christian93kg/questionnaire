<script lang="ts">
	import type { Axis } from '$lib/engine/types';

	/**
	 * Generic in axis count by construction. Harry Potter declares a different number of
	 * axes with different names, so nothing here may assume seven or know what they mean.
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
		<li>
			<span class="neg">{axis.negative.label}</span>
			<span class="track">
				<span class="mid"></span>
				<span
					class="fill"
					class:left={value < 0}
					style="width:{Math.abs(pct(value)) / 2}%"
				></span>
			</span>
			<span class="pos">{axis.positive.label}</span>
			<span class="read">
				{strength(value)}
				{Math.abs(value) < 0.4 ? '' : pole.label.toLowerCase()}
			</span>
		</li>
	{/each}
</ul>

<style>
	.profile {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.55rem;
	}
	li {
		display: grid;
		grid-template-columns: 8rem 1fr 8rem;
		grid-template-areas: 'neg track pos' 'read read read';
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}
	.neg {
		grid-area: neg;
		text-align: right;
	}
	.pos {
		grid-area: pos;
	}
	.track {
		grid-area: track;
		position: relative;
		height: 6px;
		background: var(--panel-hi);
		overflow: hidden;
	}
	.mid {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--edge);
	}
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		background: var(--accent);
		transition: width var(--motion-slow) var(--ease);
	}
	.fill.left {
		left: auto;
		right: 50%;
	}
	.read {
		grid-area: read;
		font-size: 0.62rem;
		color: var(--edge);
		text-align: center;
	}
</style>

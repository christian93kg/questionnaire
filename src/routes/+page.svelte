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
	<p class="eyebrow">Personality intake</p>
	<h1>Pick a<br />questionnaire</h1>
	<p class="lede">
		Each one scores what you do under pressure against a roster of characters, not four boxes. No
		sign-in. Nothing leaves this device.
	</p>
</div>

<ul class="quizzes">
	{#each data.packs as pack}
		<li>
			<a href="{base}/{pack.id}/">
				<span class="detail">
					<span class="code">{pack.formCode}</span>
					<span class="name">{pack.title}</span>
					<span class="meta">
						{pack.characterCount} results · {pack.questionCount} questions · from ~{pack.estMinutes}
						min
					</span>
					<span class="meta">{pack.eyebrow}</span>
				</span>
				<span class="arrow" aria-hidden="true">&rarr;</span>
			</a>
		</li>
	{/each}
</ul>

<style>
	/*
	 * The hallway. Implemented from the landing design ("Design prompt: landing page" /
	 * Quiz Hallway Landing.dc.html), which is a spec rather than a mock.
	 *
	 * Its governing claim, and the reason there is nothing here to look at: "A hallway is
	 * legible without being interesting." One repeated object, no image, no per-card colour,
	 * no card larger or first or lit differently. Every card carries the same four fields in
	 * the same order at the same size, so scanning them is a comparison rather than a
	 * sequence of pitches — and the form code, the only accent mark on the card, is found
	 * before anything decorative because there is nothing decorative.
	 *
	 * TOKENS: everything resolves to the shared scale. The design asked for one new token,
	 * `--color-line-strong` ("same hue and chroma as the line colour, one lightness step
	 * up") — that already exists here as `--rule-strong`, which is the accent at 45% where
	 * `--rule-hairline` is 22%. Its `--surface-pressed` is our `--surface-sunk`, exactly as
	 * it predicted. So this ships with NO new tokens.
	 *
	 * One deliberate divergence: the design specified `--radius-md: 10px`, but the radius
	 * scale is shared across packs and the brief put it out of scope, so this uses the
	 * shared `--radius`.
	 */

	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		/* The largest gap on the page, and the only hierarchy it asserts. */
		margin: var(--space-7) 0 var(--space-7);
	}
	.eyebrow {
		font-family: var(--font-mono);
		font-size: var(--type-xs);
		letter-spacing: var(--track-label);
		text-transform: uppercase;
		color: var(--text-faint);
		margin: 0;
		/* One line, never wraps. */
		white-space: nowrap;
	}
	h1 {
		font-family: var(--font-display);
		font-size: var(--type-2xl);
		line-height: 1.02;
		letter-spacing: var(--track-display);
		font-weight: 700;
		text-transform: uppercase;
		margin: 0;
	}
	.lede {
		font-size: var(--type-base);
		line-height: 1.5;
		color: var(--text-faint);
		max-width: 40ch;
		margin: 0;
		text-wrap: pretty;
	}

	/*
	 * Semantic list, and the gap is the only separator — no rules, no dividers.
	 *
	 * Single column at every count, permanently: no reflow threshold, no two-up grid. The
	 * measure is 460px, which is narrower than two readable cards, so the only honest wide
	 * layout is no wide layout. At eight quizzes the page is simply longer — roughly three
	 * phone screens, a scroll rather than a problem.
	 */
	.quizzes {
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.quizzes a {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--surface-raised);
		border: 1px solid var(--rule-hairline);
		border-radius: var(--radius);
		color: inherit;
		text-decoration: none;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease);
	}

	/*
	 * Hover changes three things that are all static contrast — surface up one stop, border
	 * to the strong rule, arrow to full text colour — so the state reads with motion
	 * disabled. The arrow nudge below is decoration layered on top of that, not the signal.
	 */
	.quizzes a:hover {
		background: var(--surface-raised-2);
		border-color: var(--rule-strong);
	}
	.quizzes a:hover .arrow {
		color: var(--text-primary);
	}

	/* Recessed, with the border left strong: a press is legible with no transform at all. */
	.quizzes a:active {
		background: var(--surface-sunk);
		border-color: var(--rule-strong);
	}

	/* The ring sits outside the card, so it never crops against a neighbour. */
	.quizzes a:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 3px;
	}

	/* Four rows, fixed order, no exceptions. */
	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	/* The only accent element on the card. */
	.code {
		font-family: var(--font-mono);
		font-size: var(--type-xs);
		letter-spacing: 0.1em;
		color: var(--accent-primary);
	}
	.name {
		font-family: var(--font-display);
		font-size: var(--type-lg);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: -0.005em;
		line-height: 1.12;
		text-wrap: balance;
	}
	.meta {
		font-size: var(--type-xs);
		line-height: 1.4;
		color: var(--text-faint);
	}
	.arrow {
		font-size: var(--type-xl);
		line-height: 1;
		color: var(--text-faint);
		transition: color var(--dur-fast) var(--ease);
	}

	/*
	 * The arrow nudge is the one piece of motion on the page, and it is decoration: the
	 * three contrast changes above already carry the hover state. Scoped to
	 * `no-preference` rather than left to the global reduced-motion rule, because that rule
	 * kills the TRANSITION — which would leave the transform snapping into place instantly
	 * rather than not happening at all.
	 */
	@media (prefers-reduced-motion: no-preference) {
		.arrow {
			transition:
				color var(--dur-fast) var(--ease),
				transform var(--dur-fast) var(--ease);
		}
		.quizzes a:hover .arrow {
			transform: translateX(4px);
		}
	}
</style>

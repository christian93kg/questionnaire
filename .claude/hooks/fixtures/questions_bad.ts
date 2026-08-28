// lint-pack: star-wars
// KNOWN-BAD FIXTURE — every Tier-A rule tripped at least once, on purpose.
//
// This is the other half of the pair with questions_good.ts: `good` proves the
// rules do not over-fire, `bad` proves they fire at all. --selftest asserts the
// named rules below each land at least one hit, not merely that some count is
// high — a bad fixture that fails for the wrong reason proves nothing.
//
// Planted, unit by unit:
//   b1  displacement ("Your loyalty"), gloss-clause (", who is" + "which is to
//       say"), filter-word ("you feel"), trait-name (loyal / principled /
//       leader), hedge-option (maybe / try to), option-asymmetry (111 chars vs
//       34 next-longest — the answer key leaking as length)
//   b2  deny-noun (beskar — DENY tier, re-pointed 2026-08-27 from the old
//       blanket fandom ban; "Empire" stays as harmless ALLOW-tier flavour and
//       fires nothing under the new scheme), option-monotony (8/8/7/8 words),
//       duplicate-vector (a and d score identically)
//   b3  biography ("You have always"), intensifier ("absolutely"),
//       negation-list, trait-name (brave / ruthless), repeat-in-beat 1/3
//   b4  filter-word ("you notice"), so-much-as, repeat-in-beat 2/3
//   b5  appositive-verdict ("— a habit, not a verdict"), hedge-option ("Try
//       to"), trait-name ("cautious"), option-count (3), repeat-in-beat 3/3
//
// The shared 4-gram is "the right thing here" — a rhetorical template repeated
// across b3, b4 and b5, which is the BuzzFeed tell in its greppable form.

import type { Question } from '$lib/engine/types';

export const QUESTIONS_BAD: Question[] = [
	{
		id: 'b1',
		text:
			'Your loyalty is tested when your boss, who is under real pressure, asks you to cover for him, which is to say you feel the whole thing land on you.',
		tier: 'short',
		primaryAxis: 'warmth',
		options: [
			{ id: 'a', text: 'Be a loyal team player and cover.', v: { warmth: 2 } },
			{
				id: 'b',
				text:
					'Refuse, because you are a principled leader who does not compromise on the truth, no matter what it costs you personally.',
				v: { defiance: 3 }
			},
			{ id: 'c', text: 'Maybe try to talk to him later.', v: { candor: -1 } },
			{ id: 'd', text: 'Tell HR.', v: { candor: 2 } }
		]
	},
	{
		id: 'b2',
		text:
			'A smuggler friend asks you to move cargo past the Empire checkpoint with beskar in the crate.',
		tier: 'short',
		primaryAxis: 'defiance',
		options: [
			{ id: 'a', text: 'Move the cargo and say nothing at all.', v: { defiance: 2, candor: -2 } },
			{ id: 'b', text: 'Refuse the job and walk away from it.', v: { defiance: -2 } },
			{ id: 'c', text: 'Report the crate to the local authorities.', v: { order: 3 } },
			{ id: 'd', text: 'Open the crate and look inside it now.', v: { candor: -2, defiance: 2 } }
		]
	},
	{
		id: 'b3',
		text: 'You have always known the right thing here, and it is absolutely obvious.',
		tier: 'medium',
		primaryAxis: 'hope',
		options: [
			{ id: 'a', text: 'No warning, no notice, no chance. Leave.', v: { volatility: 3 } },
			{ id: 'b', text: 'Stay and be brave about it.', v: { hope: 2 } },
			{ id: 'c', text: 'Do the ruthless thing.', v: { warmth: -3 } },
			{ id: 'd', text: 'Wait.', v: { order: 1 } }
		]
	},
	{
		id: 'b4',
		text: 'Everyone else can see the right thing here, and you notice you cannot.',
		tier: 'medium',
		primaryAxis: 'candor',
		options: [
			{ id: 'a', text: "Ask them. It isn't pride so much as habit.", v: { candor: 2 } },
			{ id: 'b', text: 'Say nothing.', v: { candor: -2 } },
			{ id: 'c', text: 'Guess and commit.', v: { order: -3 } },
			{ id: 'd', text: 'Copy whoever moves first.', v: { defiance: -2 } }
		]
	},
	{
		id: 'b5',
		text: 'The right thing here is not the loud thing — a habit, not a verdict.',
		tier: 'long',
		primaryAxis: 'volatility',
		options: [
			{ id: 'a', text: 'Try to do it quietly.', v: { volatility: -2 } },
			{ id: 'b', text: 'Ask a cautious friend.', v: { order: 2 } },
			{ id: 'c', text: 'Wait for someone else.', v: { ambition: -2 } }
		]
	}
];

// KNOWN-GOOD FIXTURE — six units written to the standard in _craft/_exemplars.md.
//
// Its rule, inherited from the source repo's calibration log (five candidate
// rules there had to be loosened because they fired on good prose):
//
//     A rule that fires on the known-good fixture is wrong; the prose is not.
//
// If a new rule in question-lint.py trips anything below, fix the rule. Do not
// edit this file to make a rule pass. Editing it to widen coverage is fine —
// re-run --selftest afterwards and it must still report zero FAIL.
//
// Re-registered 2026-08-27 for the in-world doctrine inversion: each stem now
// carries exactly one ALLOW-tier register noun (manifest / transport / hangar),
// added by editing the STEM only — proof of the card's "world budget goes in
// the stem, not the options" rule: the reflavour needed almost no option edits.
// One exception: g4's option c named "Thursday," a capitalised day-name that
// pre-dates this file's inversion and only became a finding once
// capitalised-option shipped — genuinely new coverage catching something that
// was always a minor world-budget leak, not a regression from re-registering.
// Reworded to "that day" rather than left as an unexplained skip-ok.
//
// Deliberately exercised here, so the rules are proven not to over-fire:
//   - options of 1-8 words in the same unit (asymmetry must not fire on spread alone)
//   - "you know is wrong" (near-miss on filter-word, which owns see/feel/notice)
//   - "The one who trained you" (near-miss on gloss-clause, which needs a comma)
//   - "never", "ever" (near-miss on the intensifier list)
//   - four options across two units opening "Take it…" (near-miss on option-shape,
//     which only fires within a single unit, and on repeat-in-beat, which needs a
//     4-gram, not a 2-word open)
//   - one ALLOW-tier noun per stem, so skinned-question does not fire on this
//     fixture either — it is the target register, not a generic one wearing a skin

import type { Question } from '$lib/engine/types';

export const QUESTIONS_GOOD: Question[] = [
	{
		id: 'g1',
		text: "Your name is on a manifest you didn't file and can't fully defend.",
		tier: 'short',
		primaryAxis: 'candor',
		options: [
			{ id: 'a', text: 'Pull it back before the meeting.', v: { order: 2, candor: 1 } },
			{ id: 'b', text: "Read every line tonight. Then it's mine.", v: { order: 1, ambition: 2 } },
			{ id: 'c', text: 'Present it, and name the author out loud.', v: { candor: 3 } },
			{ id: 'd', text: 'Send it up unchanged.', v: { candor: -2, order: -1 } }
		]
	},
	{
		id: 'g2',
		text: 'The one who trained you is now the one holding the transport up.',
		tier: 'short',
		primaryAxis: 'warmth',
		options: [
			{ id: 'a', text: 'Say it to them first.', v: { candor: 2, warmth: 1 } },
			{ id: 'b', text: 'Route around them and keep moving.', v: { warmth: -2, order: 1 } },
			{ id: 'c', text: 'Take it to their manager with dates.', v: { order: 3, warmth: -1 } },
			{ id: 'd', text: "Wait. They've earned a bad month.", v: { warmth: 3, hope: 1 } }
		]
	},
	{
		id: 'g3',
		text: 'Two hours before the manifest closes, the shortcut appears and nobody would ever check.',
		tier: 'medium',
		primaryAxis: 'order',
		options: [
			{ id: 'a', text: 'Take it. The deadline is the job.', v: { order: -2, ambition: 2 } },
			{ id: 'b', text: 'Ship late and say why.', v: { candor: 3, order: 1 } },
			{ id: 'c', text: 'Take it and log it in the notes.', v: { order: 2, candor: 2 } },
			{ id: 'd', text: 'Ask for the extension now.', v: { order: 1, defiance: -2 } }
		]
	},
	{
		id: 'g4',
		text: 'A crewmate asks you to say you were in the hangar with them on Thursday.',
		tier: 'medium',
		primaryAxis: 'warmth',
		options: [
			{ id: 'a', text: 'No.', v: { warmth: -3, candor: 2 } },
			{ id: 'b', text: 'Yes, and never mention it again.', v: { warmth: 2, candor: -3 } },
			{ id: 'c', text: 'Ask what happened that day first.', v: { order: 2, warmth: 1 } },
			{ id: 'd', text: "Yes. Then tell them that's the last one.", v: { warmth: 1, candor: 3 } }
		]
	},
	{
		id: 'g5',
		text: 'The crew is celebrating a manifest count you know is wrong by a third.',
		tier: 'long',
		primaryAxis: 'candor',
		options: [
			{ id: 'a', text: 'Say it now, in the room.', v: { candor: 3, volatility: 2 } },
			{ id: 'b', text: 'Let them have tonight.', v: { warmth: 2, candor: -1 } },
			{ id: 'c', text: 'Send the correction to one person, quietly.', v: { candor: 1, order: 2 } },
			{ id: 'd', text: 'Nothing. The next quarter corrects it.', v: { candor: -3, hope: -1 } }
		]
	},
	{
		id: 'g6',
		text: "You're offered the transport you wanted, on a crew you'd have to break up first.",
		tier: 'long',
		primaryAxis: 'ambition',
		options: [
			{ id: 'a', text: 'Take it. Tell them on day one.', v: { ambition: 3, candor: 2 } },
			{ id: 'b', text: 'Turn it down.', v: { ambition: -3, warmth: 2 } },
			{ id: 'c', text: 'Take it and keep the team whole.', v: { ambition: 2, warmth: 3 } },
			{ id: 'd', text: 'Ask to start after the reorg lands.', v: { order: 3, ambition: 1 } }
		]
	}
];

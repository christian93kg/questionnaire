import type { Axis, Character, Question, QuizPack, PackCalibration } from '../../engine/types';
import calibrationJson from './calibration.json';

/**
 * Synthetic pack. Not shippable content -- it exists so scripts/calibrate.ts,
 * scripts/audit.ts and the engine unit tests have something small and deterministic
 * to run against.
 *
 * It is deliberately built to pass all five audit lints:
 *   - the 12 character vectors were solved for near-zero axis correlation (max |r| ~ 0.18)
 *     and a participation ratio of ~4.80 out of a possible 5.00,
 *   - no two characters are closer than cosine 0.69,
 *   - every character has at least two axes at or below -35,
 *   - every character is reachable on the long tier.
 * If a change here breaks one of those, that is the audit doing its job.
 */

const axes: Axis[] = [
	{
		id: 'resolve',
		label: 'Resolve',
		negative: { label: 'Yielding', blurb: 'Gives ground to keep the thing moving.' },
		positive: { label: 'Unyielding', blurb: 'Holds the line past the point of comfort.' },
		distinctFrom: 'Risk. Standing firm is not the same as gambling.'
	},
	{
		id: 'candor',
		label: 'Candor',
		negative: { label: 'Guarded', blurb: 'Says the minimum the situation requires.' },
		positive: { label: 'Disclosing', blurb: 'Puts the whole picture on the table early.' },
		distinctFrom: 'Warmth. Telling the truth is not the same as caring.'
	},
	{
		id: 'order',
		label: 'Order',
		negative: { label: 'Improvised', blurb: 'Works it out live, from the situation.' },
		positive: { label: 'Systematic', blurb: 'Builds the process before touching the problem.' },
		distinctFrom: 'Resolve. A plan is not a position.'
	},
	{
		id: 'warmth',
		label: 'Warmth',
		negative: { label: 'Detached', blurb: 'Keeps the people and the problem separate.' },
		positive: { label: 'Devoted', blurb: 'Answers to the people before the problem.' },
		distinctFrom: 'Candor. Loyalty is not disclosure.'
	},
	{
		id: 'risk',
		label: 'Risk',
		negative: { label: 'Cautious', blurb: 'Buys information before spending anything else.' },
		positive: { label: 'Reckless', blurb: 'Takes the shot while the shot exists.' },
		distinctFrom: 'Order. Improvising carefully is still cautious.'
	}
];

const characters: Character[] = [
	{
		id: 'sentinel',
		name: 'The Sentinel',
		epithet: 'holds the door',
		vector: { resolve: 70, candor: -80, order: 0, warmth: -55, risk: -80 },
		blurb: 'Immovable, unreadable, and entirely uninterested in whether you approve.',
		strength: 'Nothing gets past a position you have taken.',
		blindspot: 'People cannot follow a decision they were never told about.',
		desiredShare: 1,
		region: 'core'
	},
	{
		id: 'archivist',
		name: 'The Archivist',
		epithet: 'keeps the record straight',
		vector: { resolve: -70, candor: -80, order: 70, warmth: 0, risk: -70 },
		blurb: 'Would rather have the correct answer late than a plausible one now.',
		strength: 'The system survives you because you wrote it down.',
		blindspot: 'Some questions expire before the research does.',
		desiredShare: 1,
		region: 'core'
	},
	{
		id: 'auditor',
		name: 'The Auditor',
		epithet: 'reads the fine print aloud',
		vector: { resolve: 0, candor: 55, order: 70, warmth: -40, risk: -70 },
		blurb: 'Finds the discrepancy, names it, and does not soften the delivery.',
		strength: 'The problem is exactly as large as you say it is.',
		blindspot: 'Being right in the room is not the same as being useful in it.',
		desiredShare: 0.7,
		region: 'core'
	},
	{
		id: 'drifter',
		name: 'The Drifter',
		epithet: 'leaves before the bill',
		vector: { resolve: -70, candor: -40, order: -70, warmth: -40, risk: 80 },
		blurb: 'Improvises brilliantly, commits to nothing, and is gone by morning.',
		strength: 'You are never trapped by a plan you never made.',
		blindspot: 'Nothing compounds when you keep starting over.',
		desiredShare: 1.4,
		region: 'rim'
	},
	{
		id: 'hearthkeeper',
		name: 'The Hearthkeeper',
		epithet: 'keeps the light on',
		vector: { resolve: -40, candor: -80, order: -80, warmth: 55, risk: -80 },
		blurb: 'Builds the one place everyone can come back to, and never leaves it.',
		strength: 'People heal in the room you keep.',
		blindspot: 'A shelter you never leave becomes the whole world.',
		desiredShare: 1,
		region: 'rim'
	},
	{
		id: 'quartermaster',
		name: 'The Quartermaster',
		epithet: 'counts what everyone else spends',
		vector: { resolve: 40, candor: -40, order: 80, warmth: -55, risk: 0 },
		blurb: 'The plan exists, it is correct, and no, you may not have an exception.',
		strength: 'Nothing you rely on runs out unannounced.',
		blindspot: 'Inventory is not the same as purpose.',
		desiredShare: 0.8,
		region: 'core'
	},
	{
		id: 'ghost',
		name: 'The Ghost',
		epithet: 'was never here',
		vector: { resolve: -70, candor: -40, order: -70, warmth: -80, risk: -40 },
		blurb: 'Moves through the situation without touching it, and is not missed.',
		strength: 'You cannot be leveraged through a person you never named.',
		blindspot: 'Nobody comes looking for someone who was never there.',
		desiredShare: 0.6,
		region: 'rim'
	},
	{
		id: 'freelancer',
		name: 'The Freelancer',
		epithet: 'quotes the job, does the job',
		vector: { resolve: 55, candor: -40, order: -70, warmth: -70, risk: 0 },
		blurb: 'Terms up front, no attachments, and the work gets done regardless.',
		strength: 'The job is finished whether or not anyone is happy about it.',
		blindspot: 'Every relationship priced as a transaction eventually is one.',
		desiredShare: 1,
		region: 'rim'
	},
	{
		id: 'provocateur',
		name: 'The Provocateur',
		epithet: 'says the quiet part',
		vector: { resolve: -70, candor: 40, order: 0, warmth: -55, risk: 40 },
		blurb: 'Not trying to win the argument. Trying to see what the argument is hiding.',
		strength: 'The unsaid thing gets said, and the room finally moves.',
		blindspot: 'You broke the silence but you did not stay to rebuild.',
		desiredShare: 1.2,
		region: 'fringe'
	},
	{
		id: 'confessor',
		name: 'The Confessor',
		epithet: 'tells you first',
		vector: { resolve: 0, candor: 70, order: -80, warmth: 0, risk: -80 },
		blurb: 'Volunteers the damaging fact before anyone thinks to ask for it.',
		strength: 'Nobody can surprise you with your own history.',
		blindspot: 'Disclosure is not the same as repair.',
		desiredShare: 1,
		region: 'fringe'
	},
	{
		id: 'understudy',
		name: 'The Understudy',
		epithet: 'knows every line, waits offstage',
		vector: { resolve: -70, candor: -40, order: 0, warmth: -40, risk: -70 },
		blurb: 'Fully prepared for a role that nobody has offered, and will not ask.',
		strength: 'When it finally falls to you, you already know it cold.',
		blindspot: 'Readiness with no claim on it is just waiting.',
		desiredShare: 0.75,
		region: 'core'
	},
	{
		id: 'champion',
		name: 'The Champion',
		epithet: 'goes first, every time',
		vector: { resolve: 55, candor: -40, order: -40, warmth: 70, risk: 80 },
		blurb: 'Takes the hit meant for someone else and does not mention it afterwards.',
		strength: 'People are braver in the room because you are in it.',
		blindspot: 'You keep spending a body you have not asked permission to spend.',
		desiredShare: 1.95,
		region: 'fringe'
	}
];

const questions: Question[] = [
	{
		id: 'q01',
		text: 'The decision you argued for is failing in public. What happens next?',
		tier: 'short',
		primaryAxis: 'resolve',
		options: [
			{
				id: 'q01a',
				text: 'It fails on my terms. I am not reversing it in front of an audience.',
				v: { resolve: 70, candor: 35, warmth: -30 },
				sig: { sentinel: 0.6 }
			},
			{
				id: 'q01b',
				text: 'I hold it, quietly, and fix the parts nobody has noticed yet.',
				v: { resolve: 25, candor: -35, warmth: 30 }
			},
			{
				id: 'q01c',
				text: 'I say out loud that it is not working and ask what we do instead.',
				v: { resolve: -25, candor: 30, warmth: 35 }
			},
			{
				id: 'q01d',
				text: 'I let it go. Being attached to it is what made it worse.',
				v: { resolve: -70, candor: -30, warmth: -35 }
			}
		]
	},
	{
		id: 'q02',
		text: 'You learn something that would change how the group votes.',
		tier: 'short',
		primaryAxis: 'candor',
		options: [
			{
				id: 'q02a',
				text: 'Everyone hears it now, unedited, consequences included.',
				v: { candor: 70, order: 35, risk: 30 }
			},
			{
				id: 'q02b',
				text: 'I say it plainly, but only once the vote is actually on the table.',
				v: { candor: 25, order: -35, risk: -30 }
			},
			{
				id: 'q02c',
				text: 'I raise the question it implies without sourcing it.',
				v: { candor: -25, order: 30, risk: -35 }
			},
			{
				id: 'q02d',
				text: 'I keep it. Information I control is information nobody can misuse.',
				v: { candor: -70, order: -30, risk: 35 }
			}
		]
	},
	{
		id: 'q03',
		text: 'A job you have never done before lands on you on a Friday.',
		tier: 'short',
		primaryAxis: 'order',
		options: [
			{
				id: 'q03a',
				text: 'I map it end to end before I touch anything.',
				v: { order: 70, warmth: 35, resolve: -30 },
				sig: { quartermaster: 0.5 }
			},
			{
				id: 'q03b',
				text: 'I write down the three failure modes, then start.',
				v: { order: 25, warmth: -35, resolve: 30 }
			},
			{
				id: 'q03c',
				text: 'I start, and the shape of it tells me what the plan should have been.',
				v: { order: -25, warmth: 30, resolve: 35 }
			},
			{
				id: 'q03d',
				text: 'I do it. Planning an unfamiliar thing is planning a fiction.',
				v: { order: -70, warmth: -30, resolve: -35 }
			}
		]
	},
	{
		id: 'q04',
		text: 'Someone you rely on has clearly made a mess of their part.',
		tier: 'short',
		primaryAxis: 'warmth',
		options: [
			{
				id: 'q04a',
				text: 'I take the hit with them and we sort out the blame never.',
				v: { warmth: 70, risk: 35, candor: 30 }
			},
			{
				id: 'q04b',
				text: 'I cover the gap, then tell them privately what it cost.',
				v: { warmth: 25, risk: -35, candor: -30 }
			},
			{
				id: 'q04c',
				text: 'I route around them and note it for next time.',
				v: { warmth: -25, risk: 30, candor: -35 }
			},
			{
				id: 'q04d',
				text: 'The mess is theirs. I say so, to them and to whoever asks.',
				v: { warmth: -70, risk: -30, candor: 35 }
			}
		]
	},
	{
		id: 'q05',
		text: 'A door is open now and will not be open tomorrow.',
		tier: 'medium',
		primaryAxis: 'risk',
		options: [
			{
				id: 'q05a',
				text: 'Through it. I will find out what was on the other side afterwards.',
				v: { risk: 70, resolve: 35, order: -30 },
				sig: { champion: 0.6 }
			},
			{
				id: 'q05b',
				text: 'Through it, but I tell one person where I went.',
				v: { risk: 25, resolve: -35, order: 30 }
			},
			{
				id: 'q05c',
				text: 'I spend the hour I have finding out what is behind it.',
				v: { risk: -25, resolve: 30, order: 35 }
			},
			{
				id: 'q05d',
				text: 'Doors that close that fast were never really open.',
				v: { risk: -70, resolve: -30, order: -35 }
			}
		]
	},
	{
		id: 'q06',
		text: 'You are outvoted on something you think is a real mistake.',
		tier: 'medium',
		primaryAxis: 'resolve',
		options: [
			{
				id: 'q06a',
				text: 'I keep raising it until someone answers the actual objection.',
				v: { resolve: 65, order: 40, risk: 30 }
			},
			{
				id: 'q06b',
				text: 'I log the objection, in writing, and then execute the decision.',
				v: { resolve: 30, order: -40, risk: -30 }
			},
			{
				id: 'q06c',
				text: 'I execute it and quietly build the fallback nobody asked for.',
				v: { resolve: -30, order: 30, risk: -40 }
			},
			{
				id: 'q06d',
				text: 'They may be right. I was outvoted for a reason.',
				v: { resolve: -65, order: -30, risk: 40 }
			}
		]
	},
	{
		id: 'q07',
		text: 'Someone asks you a direct question about your own worst call.',
		tier: 'medium',
		primaryAxis: 'candor',
		options: [
			{
				id: 'q07a',
				text: 'The whole thing, including the part that still makes me wince.',
				v: { candor: 65, warmth: 40, resolve: -30 }
			},
			{
				id: 'q07b',
				text: 'The facts, cleanly, without the self-flagellation.',
				v: { candor: 30, warmth: -40, resolve: 30 }
			},
			{
				id: 'q07c',
				text: 'The lesson I took from it, not the incident itself.',
				v: { candor: -30, warmth: 30, resolve: 40 }
			},
			{
				id: 'q07d',
				text: 'I do not answer questions shaped like that.',
				v: { candor: -65, warmth: -30, resolve: -40 },
				sig: { ghost: 0.5 }
			}
		]
	},
	{
		id: 'q08',
		text: 'The process everyone follows is producing a bad outcome this week.',
		tier: 'medium',
		primaryAxis: 'order',
		options: [
			{
				id: 'q08a',
				text: 'Then the process gets amended, properly, before we run it again.',
				v: { order: 65, risk: 40, candor: 30 }
			},
			{
				id: 'q08b',
				text: 'We follow it this week and fix it in the review.',
				v: { order: 30, risk: -40, candor: -30 }
			},
			{
				id: 'q08c',
				text: 'I override it for this case and tell nobody it was an override.',
				v: { order: -30, risk: 30, candor: -40 }
			},
			{
				id: 'q08d',
				text: 'The process was always a suggestion. I do the right thing.',
				v: { order: -65, risk: -30, candor: 40 }
			}
		]
	},
	{
		id: 'q09',
		text: 'Two people you owe something to need you in different places.',
		tier: 'long',
		primaryAxis: 'warmth',
		options: [
			{
				id: 'q09a',
				text: 'I go to whoever is worse off and I stay until it is done.',
				v: { warmth: 65, resolve: 40, order: -30 }
			},
			{
				id: 'q09b',
				text: 'I split it, badly, and apologise to both.',
				v: { warmth: 30, resolve: -40, order: 30 }
			},
			{
				id: 'q09c',
				text: 'I go where I am actually useful, not where I am wanted.',
				v: { warmth: -30, resolve: 30, order: 40 }
			},
			{
				id: 'q09d',
				text: 'I tell both of them no and deal with the fallout.',
				v: { warmth: -65, resolve: -30, order: -40 }
			}
		]
	},
	{
		id: 'q10',
		text: 'The safe version of the plan is obviously worse than the exposed one.',
		tier: 'long',
		primaryAxis: 'risk',
		options: [
			{
				id: 'q10a',
				text: 'Exposed. A worse plan is not made better by being survivable.',
				v: { risk: 65, candor: 40, warmth: 30 },
				sig: { drifter: 0.5 }
			},
			{
				id: 'q10b',
				text: 'Exposed, with one hedge I do not tell anyone about.',
				v: { risk: 30, candor: -40, warmth: -30 }
			},
			{
				id: 'q10c',
				text: 'Safe now, exposed once we can afford to lose the round.',
				v: { risk: -30, candor: 30, warmth: -40 }
			},
			{
				id: 'q10d',
				text: 'Safe. Being here next month is most of the plan.',
				v: { risk: -65, candor: -30, warmth: 40 }
			}
		]
	},
	{
		id: 'q11',
		text: 'You are asked to drop a standard you set, for a good reason.',
		tier: 'long',
		primaryAxis: 'resolve',
		options: [
			{
				id: 'q11a',
				text: 'A standard with an exception clause was never a standard.',
				v: { resolve: 60, warmth: 45, candor: -35 }
			},
			{
				id: 'q11b',
				text: 'I hold it and absorb the cost of holding it myself.',
				v: { resolve: 30, warmth: -45, candor: 35 }
			},
			{
				id: 'q11c',
				text: 'I drop it once, name it as a one-off, and write down why.',
				v: { resolve: -30, warmth: 35, candor: 45 }
			},
			{
				id: 'q11d',
				text: 'Good reasons are exactly what standards are supposed to bend for.',
				v: { resolve: -60, warmth: -35, candor: -45 }
			}
		]
	},
	{
		id: 'q12',
		text: 'You are about to be trusted with something on a false impression.',
		tier: 'long',
		primaryAxis: 'candor',
		options: [
			{
				id: 'q12a',
				text: 'I correct it before they finish the sentence.',
				v: { candor: 60, risk: 45, order: 35 },
				sig: { confessor: 0.6 }
			},
			{
				id: 'q12b',
				text: 'I correct it, then take the thing anyway if they still offer.',
				v: { candor: 30, risk: -45, order: -35 }
			},
			{
				id: 'q12c',
				text: 'I take it and make the impression true before it matters.',
				v: { candor: -30, risk: 35, order: -45 }
			},
			{
				id: 'q12d',
				text: 'They formed that impression themselves. I take it.',
				v: { candor: -60, risk: -35, order: 45 }
			}
		]
	}
];

export const fixturePack: QuizPack = {
	id: '_fixture',
	version: 1,
	title: 'Fixture: Which Operator Are You?',
	formCode: 'FX-01',
	intro: {
		eyebrow: 'Synthetic pack',
		lede: [
			'Twelve questions, twelve operators, no lore.',
			'This pack exists to exercise the scoring engine, not to describe anyone.'
		],
		fine: 'Not a real quiz. Do not ship.'
	},
	axes,
	characters,
	questions,
	tiers: [
		{ id: 'short', label: 'Quick', blurb: 'Four questions.', questionCount: 4, estMinutes: 2 },
		{ id: 'medium', label: 'Standard', blurb: 'Eight questions.', questionCount: 8, estMinutes: 4 },
		{ id: 'long', label: 'Full', blurb: 'All twelve.', questionCount: 12, estMinutes: 6 }
	],
	signatureWeight: 0.1,
	calibration: calibrationJson as unknown as PackCalibration
};

export default fixturePack;

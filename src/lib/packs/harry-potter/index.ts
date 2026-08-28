import type { QuizPack } from '../../engine/types';
import { AXES } from './axes';
import { CHARACTERS } from './characters';
import { QUESTIONS } from './questions';
import calibration from './calibration.json';
import { CHROME, THEME } from './theme';

export const harryPotter: QuizPack = {
	id: 'harry-potter',
	version: 1,
	title: 'Who would you be at Hogwarts?',
	formCode: 'HG-01',
	intro: {
		eyebrow: 'School register',
		lede: [
			'A register, not a sorting. It does not ask which house you want; it asks what you did, and the house is a consequence of the answer.',
			'Forty-seven names on file, from the one who read ahead to the one who kept the ledger. Some of them are not people you would want to be, and they are on the list because somebody always is.'
		],
		fine: 'No sign-in · Nothing leaves this device · Send the file to anyone'
	},
	axes: AXES,
	characters: CHARACTERS,
	questions: QUESTIONS,
	/**
	 * Seven chapters, one per scoring axis, shown as full-screen interstitials ahead of
	 * their first question. Order here is presentation order and `QUESTIONS` is grouped to
	 * match, so each section's questions stay contiguous whichever tier is filtering them.
	 * Named for the plain-language version of each axis's poles (see `axes.ts`):
	 * precept -> Method, candour -> Disclosure, attachment -> Attachment,
	 * defiance -> Authority, reckoning -> Reckoning, ambition -> Appetite,
	 * temper -> Temper.
	 */
	sections: [
		{
			id: 'method',
			label: 'Method',
			blurb:
				'How the work actually gets done when the instructions and the situation disagree. Answer for the version you did, not the one you would write up afterwards.'
		},
		{
			id: 'disclosure',
			label: 'Disclosure',
			blurb:
				'What you say, what you sit on, and who gets to decide which. Nothing entered here is read out.'
		},
		{
			id: 'attachment',
			label: 'Attachment',
			blurb:
				'Who you would go for, and what it costs the people who did not ask. No names are needed. The pattern is the entry.'
		},
		{
			id: 'authority',
			label: 'Authority',
			blurb:
				'What you do when the person who outranks you is wrong, and everyone in the corridor can see that they are.'
		},
		{
			id: 'reckoning',
			label: 'Reckoning',
			blurb:
				'What happens to a debt somebody owes you. Whether it is collected, when, and by whom — and whether you were the one who let it go.'
		},
		{
			id: 'appetite',
			label: 'Appetite',
			blurb:
				'What you are actually going after, once nobody is in the room to hear you say it. There is no wrong amount to want.'
		},
		{
			id: 'temper',
			label: 'Temper',
			blurb:
				'What gets out of you before you have decided to let it out. Take the time, or do not — the register keeps the first answer either way.'
		}
	],
	tiers: [
		{
			id: 'short',
			label: 'Quick read',
			blurb: 'Ten questions. Blunt, and not vague.',
			questionCount: 10,
			estMinutes: 2
		},
		{
			id: 'medium',
			label: 'Standard',
			blurb: 'Twenty questions. Enough to split the close calls.',
			questionCount: 20,
			estMinutes: 4
		},
		{
			id: 'long',
			label: 'Full entry',
			blurb: 'Thirty-four questions. The quiet distinctions live down here.',
			questionCount: 34,
			estMinutes: 7
		}
	],
	signatureWeight: 0.12,
	calibration,
	theme: THEME,
	chrome: CHROME
};

export default harryPotter;

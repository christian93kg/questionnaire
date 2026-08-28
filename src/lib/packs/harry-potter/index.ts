import type { QuizPack } from '../../engine/types';
import { AXES } from './axes';
import { CHARACTERS } from './characters';
import { QUESTIONS } from './questions';
import calibration from './calibration.json';
import { CHROME, THEME } from './theme';

export const harryPotter: QuizPack = {
	id: 'harry-potter',
	/**
	 * 2 — the 2026-08-28 rewrite. Every question id changed, so `questionSetHash`
	 * (src/lib/engine/share.ts) no longer matches any version-1 link: those decode to
	 * `superseded` and show the older-version path instead of a silently different result.
	 * No `migrations` entry, deliberately — the answers cannot be remapped, because the
	 * questions they answered no longer exist.
	 */
	version: 2,
	title: 'Who would you be at Hogwarts?',
	formCode: 'HG-01',
	intro: {
		eyebrow: 'School register',
		lede: [
			'Thirty-four things go wrong in front of you — a cauldron over a first-year, a name the shopkeeper will not serve, somebody past the second buoy and not coming up. You get four ways out of each one and no time to be clever about it.',
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
				'Five things go wrong where there is a right way to fix them and no time to do it that way. Answer for what you did, not for the version you would write up afterwards.'
		},
		{
			id: 'disclosure',
			label: 'Disclosure',
			blurb:
				'Somebody is about to find out, or not, and it is down to you which. Nothing you enter here is read out.'
		},
		{
			id: 'attachment',
			label: 'Attachment',
			blurb:
				'Who you go for, and what it costs the people who did not ask you to. No names needed — the pattern is the entry.'
		},
		{
			id: 'authority',
			label: 'Authority',
			blurb:
				'The person who outranks you is wrong, and everyone in the corridor can see it. Five times, five different corridors.'
		},
		{
			id: 'reckoning',
			label: 'Reckoning',
			blurb:
				'Somebody owes you, or you owe them. Whether it gets collected, when, and by whom — and whether you were the one who let it go.'
		},
		{
			id: 'appetite',
			label: 'Appetite',
			blurb:
				'What you are actually going after, once there is nobody in the room to hear you say it. There is no wrong amount to want.'
		},
		{
			id: 'temper',
			label: 'Temper',
			blurb:
				'Four times something gets out of you before you have decided to let it out. Take your time, or do not — the register keeps the first answer either way.'
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

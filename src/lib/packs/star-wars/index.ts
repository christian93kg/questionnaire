import type { QuizPack } from '$lib/engine/types';
import { AXES } from './axes';
import { CHARACTERS } from './characters';
import { QUESTIONS } from './questions';
import calibration from './calibration.json';

export const starWars: QuizPack = {
	id: 'star-wars',
	version: 1,
	title: 'Who would you be in Star Wars?',
	formCode: 'R-77',
	intro: {
		eyebrow: 'Personnel assessment',
		lede: [
			'Questions about how you actually behave under pressure — not which lightsaber colour you like.',
			'Forty-eight possible results, from the one who holds the line to the one playing a much longer game than you are.'
		],
		fine: 'No sign-in · Nothing leaves your device · Send the link to anyone'
	},
	axes: AXES,
	characters: CHARACTERS,
	questions: QUESTIONS,
	tiers: [
		{
			id: 'short',
			label: 'Quick read',
			blurb: 'Ten questions. Coarse, but it will not be vague.',
			questionCount: 10,
			estMinutes: 2
		},
		{
			id: 'medium',
			label: 'Standard',
			blurb: 'Twenty questions. Enough to separate the close calls.',
			questionCount: 20,
			estMinutes: 4
		},
		{
			id: 'long',
			label: 'Full assessment',
			blurb: 'Thirty-four questions. The subtle ones live down here.',
			questionCount: 34,
			estMinutes: 7
		}
	],
	signatureWeight: 0.12,
	calibration
};

export default starWars;

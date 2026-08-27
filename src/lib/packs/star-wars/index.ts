import type { QuizPack } from '$lib/engine/types';
import { AXES } from './axes';
import { CHARACTERS } from './characters';
import { QUESTIONS } from './questions';
import calibration from './calibration.json';

export const starWars: QuizPack = {
	id: 'star-wars',
	// v3: QUESTIONS reordered into contiguous section groups for the interstitials below.
	// No id/text/vector changed, but order feeds questionSetHash (src/lib/engine/share.ts),
	// so existing v2 share links now decode as `superseded` rather than silently mis-scoring.
	// No migration is registered -- there is no answer-preserving remap for a pure reorder.
	version: 3,
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
	/**
	 * Seven themed chapters, shown as full-screen interstitials ahead of their first
	 * question. Order here is presentation order -- `QUESTIONS` is grouped to match, so
	 * each section's questions stay contiguous no matter which tier is filtering it.
	 * One section per scoring axis, renamed to the plain-language version of its
	 * `AxisPole` framing (see `axes.ts`): order -> Obligation, candor -> Disclosure,
	 * warmth -> Attachment, defiance -> Authority, hope -> Outlook, ambition -> Appetite,
	 * volatility -> Temper.
	 */
	sections: [
		{
			id: 'obligation',
			label: 'Obligation',
			blurb: 'What you actually owe, and who you owe it to, when a plan comes apart.'
		},
		{
			id: 'disclosure',
			label: 'Disclosure',
			blurb: 'What you say, what you sit on, and who gets to decide which.'
		},
		{
			id: 'attachment',
			label: 'Attachment',
			blurb: 'Who you would stay for, and what that costs everyone else.'
		},
		{
			id: 'authority',
			label: 'Authority',
			blurb: 'What you do when the people over you are wrong, or lying.'
		},
		{
			id: 'outlook',
			label: 'Outlook',
			blurb: 'Whether you think it comes out well, and what you do while you wait to find out.'
		},
		{
			id: 'appetite',
			label: 'Appetite',
			blurb: 'What you actually want, once nobody is watching you say so.'
		},
		{
			id: 'temper',
			label: 'Temper',
			blurb: 'What gets out of you before you have decided to let it.'
		}
	],
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

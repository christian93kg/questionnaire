import type { Axis } from '../../engine/types';

/**
 * Seven axes.
 *
 * THE CONSTRAINT THAT SHAPES ALL OF THEM: every axis must have canonical heroes AND
 * villains at BOTH poles. An axis where the admired characters cluster at one end is a
 * morality axis wearing a trait's name — it stops measuring behaviour and starts measuring
 * how good the taker wants to feel, and `npm run audit`'s correlation gate flags it because
 * it ends up correlated with every other axis at once.
 *
 * That test is what killed the two obvious candidates for this fandom:
 *   - `courage` — Gryffindor's own virtue, and there is no admired coward to anchor the
 *     negative pole. It is `defiance` and `temper` wearing a house crest.
 *   - `prejudice` — the villains own one pole outright. It is the morality axis, undisguised.
 * Both were cut before calibration rather than after, on the same reasoning that removed an
 * eighth star-wars axis (`sacrifice`).
 *
 * `reckoning` is the deliberately fandom-native one and the main departure from the
 * star-wars set: this is a world where what you do to someone who wronged you is the
 * recurring question, and it separates characters that `attachment` alone cannot — the
 * devoted-and-merciful sit a long way from the devoted-and-exacting.
 */
export const AXES: Axis[] = [
	{
		id: 'precept',
		label: 'Method',
		negative: { label: 'Improvised', blurb: 'You find out what the rule was afterwards.' },
		positive: { label: 'Ordered', blurb: 'You do it the way it is done, and it holds.' },
		distinctFrom:
			'Not obedience. Sirius improvises and defies; Percy is ordered and defers. Both poles hold either stance.'
	},
	{
		id: 'candour',
		label: 'Disclosure',
		negative: { label: 'Guarded', blurb: 'You hand over what the moment requires and no more.' },
		positive: { label: 'Plain-spoken', blurb: 'You say it while it is still awkward to say.' },
		distinctFrom:
			'Not warmth. Hagrid is plain-spoken and devoted; Bellatrix is plain-spoken and cruel with it.'
	},
	{
		id: 'attachment',
		label: 'Attachment',
		negative: { label: 'Detached', blurb: 'You keep the people and the problem apart.' },
		positive: { label: 'Devoted', blurb: 'A particular person outranks the plan.' },
		distinctFrom:
			'Not mercy. Bellatrix is devoted to one person and merciless to everyone else.'
	},
	{
		id: 'defiance',
		label: 'Authority',
		negative: { label: 'Deferent', blurb: 'Someone is in charge, and it is usually not you.' },
		positive: { label: 'Defiant', blurb: 'You have already decided what you will not do.' },
		distinctFrom:
			'Not method. Sirius is improvised and defiant; Umbridge is ordered and answers to nobody she can outrank.'
	},
	{
		id: 'reckoning',
		label: 'Reckoning',
		negative: { label: 'Merciful', blurb: 'The debt gets written off, usually early.' },
		positive: { label: 'Exacting', blurb: 'It gets collected, and the timing is yours.' },
		distinctFrom:
			'Not attachment. Snape is exacting and devoted; Luna is merciful and unattached to the outcome.'
	},
	{
		id: 'ambition',
		label: 'Appetite',
		negative: { label: 'Contented', blurb: 'What you have is close enough to what you wanted.' },
		positive: { label: 'Driven', blurb: 'There is a next thing, and you have named it.' },
		distinctFrom:
			'Not method. Hermione is driven and ordered; Fred is driven and improvises everything.'
	},
	{
		id: 'temper',
		label: 'Temper',
		negative: { label: 'Contained', blurb: 'It arrives late, in private, or not at all.' },
		positive: { label: 'Volatile', blurb: 'It is out before you have decided to let it out.' },
		distinctFrom:
			'Not disclosure. Lupin is contained and plain-spoken; Quirrell is contained and hiding everything.'
	}
];

export const AXIS_IDS = AXES.map((a) => a.id);

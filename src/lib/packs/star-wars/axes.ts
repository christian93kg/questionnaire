import type { Axis } from '$lib/engine/types';

/**
 * Seven axes. The orthogonality test that keeps this from collapsing into a
 * good/evil proxy: every axis must have canonical heroes AND villains at BOTH
 * poles. Where that isn't true, the axis is a morality axis wearing a disguise.
 *
 * An eighth axis, `sacrifice` (Self-Preserving <-> Self-Spending), was evaluated
 * and cut: it correlated ~0.5 with both warmth and hope and was the likeliest to
 * degenerate. It survives as question content, not as a scored dimension.
 */
export const AXES: Axis[] = [
	{
		id: 'order',
		label: 'Method',
		negative: { label: 'Improvised', blurb: 'You work it out on the way down.' },
		positive: { label: 'Ordered', blurb: 'You build the structure, then move.' },
		distinctFrom: 'Not legitimacy. Vader is ordered and deferent; Luthen is ordered and defiant.'
	},
	{
		id: 'candor',
		label: 'Disclosure',
		negative: { label: 'Concealed', blurb: 'People learn what they need to know.' },
		positive: { label: 'Plainspoken', blurb: 'You say the thing in the room it is about.' },
		distinctFrom:
			'Not warmth. Chewbacca is concealed and warm; K-2SO is candid and cold; Tarkin is both candid and cruel.'
	},
	{
		id: 'warmth',
		label: 'Attachment',
		negative: { label: 'Detached', blurb: 'You keep a working distance and it serves you.' },
		positive: { label: 'Bonded', blurb: 'Specific people are the reason you do any of it.' },
		distinctFrom:
			'Not virtue. Vader scores high here — attachment is his engine, and that is the point.'
	},
	{
		id: 'defiance',
		label: 'Stance',
		negative: { label: 'Deferent', blurb: 'You hold the line you were given.' },
		positive: { label: 'Defiant', blurb: 'You answer to the thing, not the org chart.' },
		distinctFrom: 'Not method. Thrawn is maximally ordered and deferent; Luthen is both ordered and defiant.'
	},
	{
		id: 'hope',
		label: 'Outlook',
		negative: { label: 'Hard-eyed', blurb: 'You did the arithmetic and stopped flinching.' },
		positive: { label: 'Hopeful', blurb: 'You think it can come out well, and act like it.' },
		distinctFrom:
			'Not goodness. Syril Karn believes desperately; Cassian does not. A hopeful villain is what proves this axis is real.'
	},
	{
		id: 'ambition',
		label: 'Appetite',
		negative: { label: 'Content', blurb: 'You do not want the chair.' },
		positive: { label: 'Ascendant', blurb: 'You want the chair and you would be good in it.' },
		distinctFrom: 'Not evil. Separates "seeks power" from "is dangerous" — Padmé and Palpatine share this pole.'
	},
	{
		id: 'volatility',
		label: 'Temper',
		negative: { label: 'Contained', blurb: 'Pressure makes you slower and quieter.' },
		positive: { label: 'Combustible', blurb: 'Pressure comes out of you before you choose it.' },
		distinctFrom:
			'Not method. Krennic and C-3PO are ordered and combustible; that pairing is what breaks the correlation with order.'
	}
];

export const AXIS_IDS = AXES.map((a) => a.id);

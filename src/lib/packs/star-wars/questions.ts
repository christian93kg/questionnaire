import type { Question } from '$lib/engine/types';

/**
 * Craft rules these are written against (see _craft/quiz-question.card.md):
 *  - Announced fails. An option never names the trait it scores for; it states the act.
 *  - Every option costs something, and a different something. An option that costs
 *    nothing is the flattering one, and flattering is the same as obviously-correct.
 *  - Each option leads to a different downstream state. Two matching futures: cut or merge.
 *  - The prompt hands back on a want-at-risk — it stops before the outcome.
 *  - Displacement: if the abstract noun is in the prompt, the answer key is in the question.
 *  - No fandom trivia. All the Star Wars is in the results.
 *
 * Amplitude by tier: short runs +/-70..90 on the primary axis (coarse but decisive),
 * long runs +/-30..55 (fine-grained). Mixing them is what stops the 10-question tier
 * producing mush without needing more questions.
 */

const q = (
	id: string,
	tier: Question['tier'],
	primaryAxis: string,
	text: string,
	options: Array<[string, Question['options'][number]['v']]>
): Question => ({
	id,
	tier,
	primaryAxis,
	text,
	options: options.map(([t, v], i) => ({ id: 'abcd'[i], text: t, v }))
});

export const QUESTIONS: Question[] = [
	// ============================================================ SHORT (10)
	q('trip-falling-apart', 'short', 'order', 'The group trip is falling apart in the chat. Nobody has booked anything.', [
		['Post an itinerary and start assigning people.', { order: 75, ambition: 45, candor: 25 }],
		['Book your own flight and tell them where you’ll be.', { order: -60, defiance: 65, warmth: -45, ambition: -10 }],
		['Message the two who are actually annoyed at each other.', { order: 15, candor: -25, warmth: 45 }],
		['Say nothing, turn up, carry the bags.', { order: -25, candor: -30, warmth: 40, ambition: -60 }]
	]),

	q('six-years', 'short', 'defiance', 'The organisation you gave six years to asks you for something you think is wrong.', [
		['Refuse, in writing, with your name on it.', { defiance: 95, candor: 55, ambition: -10 }],
		['Do it, and start building the case that stops it recurring.', { order: 50, defiance: 20, candor: -25, hope: 40 }],
		['Do it. You don’t get to pick which parts you believe in.', { defiance: -95, order: 25, warmth: -15 }],
		['Leave. Not loudly. Just stop being available.', { defiance: 65, candor: -40, ambition: -35, warmth: -20 }]
	]),

	q('sixteen-hours', 'short', 'warmth', 'Sixteen hours into the emergency. What’s actually keeping you there?', [
		['Two specific people who’d be in trouble if I left.', { warmth: 70, ambition: -35 }],
		['I said I’d stay. That’s the whole reason.', { order: 45, candor: -15, defiance: -40 }],
		['The problem itself. It’s interesting and it’s mine now.', { warmth: -80, order: 20, ambition: 40 }],
		['If I go, it lands on someone who can’t carry it.', { warmth: 35, hope: 30, defiance: 40 }]
	]),

	q('humiliating-thing', 'medium', 'candor', 'You learn something about a friend they’d be humiliated to have known.', [
		['Tell them you know, straight away.', { candor: 60, warmth: 30 }],
		['Never mention it. Behave as though you don’t.', { candor: -45, warmth: 30, volatility: -35 }],
		['Ask someone who’d know what it actually means.', { candor: -10, order: 25, warmth: -25, ambition: -10 }],
		['Wait. If it starts hurting them, then say it.', { candor: -20, order: 30, hope: 25, volatility: -45 }]
	]),

	q('says-theyve-changed', 'short', 'hope', 'Someone who hurt people badly says they’ve changed.', [
		['People do change. I’d rather be wrong about that than the other thing.', { hope: 95, warmth: 50, defiance: 15 }],
		['Believe it when a year of it has gone by.', { hope: 20, order: 40, candor: -10, volatility: -45 }],
		['Changed isn’t the same as owed. They can change somewhere else.', { hope: -60, warmth: -25, defiance: 45 }],
		['Nobody changes. They just get better at the cover.', { hope: -95, candor: -15, warmth: -40 }]
	]),

	q('empty-chair', 'short', 'ambition', 'The chair at the head of the table is empty and everyone is looking at it.', [
		['Take it. Someone has to, and I’d do it better than the alternatives.', { ambition: 90, candor: 25, order: 25 }],
		['Push the person who should have it forward, then back them.', { ambition: -50, warmth: 55, candor: 15 }],
		['Leave it empty. Run the meeting from where you’re sitting.', { ambition: 30, candor: -40, order: 20 }],
		['Genuinely don’t want it. Ask when you can go.', { ambition: -80, volatility: -40, candor: 20 }]
	]),

	q('body-under-pressure', 'short', 'volatility', 'Under real pressure, before you’ve thought about it, your body:', [
		['Goes quiet, and slow.', { volatility: -95, order: 35, candor: -20 }],
		['Gets loud and starts moving.', { volatility: 95, candor: 30, warmth: 35 }],
		['Narrows down to one single thing.', { volatility: -50, warmth: -45, order: 25, defiance: 25 }],
		['Starts improvising before your brain catches up.', { volatility: 75, order: -65, hope: 25 }]
	]),

	q('natural-job', 'short', 'order', 'Your natural job on a team.', [
		['The one with the plan.', { order: 75, ambition: 55 }],
		['The one who fixes it when the plan dies.', { order: -70, volatility: 45, candor: -5 }],
		['The one who brings everyone else up.', { warmth: 55, ambition: -40, hope: 45 }],
		['The one who takes the hit.', { warmth: 30, ambition: -35, defiance: -40, candor: -20 }]
	]),

	q('rule-covering-themselves', 'short', 'defiance', 'A rule you’ve followed for years turns out to have been invented by someone covering themselves.', [
		['Say so out loud, even though it’ll cost you.', { defiance: 95, candor: 55 }],
		['Keep following it. Rules hold things together.', { defiance: -95, order: 50, hope: 40 }],
		['Quietly stop, and mention it to nobody.', { candor: -45, defiance: 55, order: -45 }],
		['Work out who benefited. Keep that.', { candor: -30, ambition: 55, hope: -65, order: 30 }]
	]),

	q('under-everything', 'short', 'ambition', 'What you actually want, under everything else.', [
		['To matter to the people I love.', { warmth: 70, ambition: -40, hope: 40 }],
		['To be left alone with the few I choose.', { warmth: 15, ambition: -80, candor: -30, defiance: 45 }],
		['To fix something bigger than me.', { ambition: 50, order: 50, hope: 80 }],
		['To never be powerless again.', { ambition: 75, hope: -95, warmth: -40, volatility: 45 }]
	]),

	// =========================================================== MEDIUM (10)
	q('one-shot-bad-plan', 'medium', 'order', 'One shot at it, and the plan is bad.', [
		['Run it. Something turns up.', { order: -55, hope: 50, volatility: 45 }],
		['Rewrite it in the last ten minutes.', { order: 45, volatility: 30, ambition: 35, candor: 5 }],
		['Ignore the numbers. Go with your gut.', { order: -50, hope: 65, candor: 5 }],
		['Refuse. Bad plans get people killed.', { order: 50, defiance: 80, candor: 30, hope: -65 }]
	]),

	q('hardest-to-forgive', 'medium', 'warmth', 'Hardest thing for you to forgive.', [
		['Cowardice at the moment it mattered.', { warmth: -30, hope: -40, candor: 20 }],
		['Cruelty to someone who couldn’t fight back.', { warmth: 65, defiance: 45, volatility: 40 }],
		['Being lied to by someone who taught you.', { defiance: 75, candor: 20, warmth: 20, hope: -25 }],
		['Wasting something rare.', { warmth: -50, ambition: 45, order: 30, hope: -10 }]
	]),

	q('what-makes-it-out-loud', 'medium', 'candor', 'How much of what you’re actually thinking makes it out loud?', [
		['All of it. People can handle it.', { candor: 55, volatility: 55 }],
		['Most of it, edited for who’s in the room.', { candor: 25, order: 25 }],
		['The conclusion. Not the working.', { candor: -30, order: 30, warmth: -25 }],
		['Almost none of it. It isn’t everyone’s business.', { candor: -50, warmth: -10, volatility: -55 }]
	]),

	q('already-decided', 'medium', 'defiance', 'You’re told the decision has already been made.', [
		['Ask who made it, in front of everyone.', { defiance: 90, candor: 50 }],
		['Accept it and do it well.', { defiance: -95, order: 40, volatility: -50 }],
		['Accept it, and quietly build the thing that outlasts it.', { defiance: 45, candor: -40, order: 50 }],
		['Ignore it and see whether anyone notices.', { defiance: 70, order: -65, candor: -25, volatility: 40 }]
	]),

	q('junior-does-it-better', 'medium', 'ambition', 'Someone junior does something better than you would have.', [
		['Hand them more, publicly.', { ambition: -45, warmth: 55, candor: 35 }],
		['Note it. Watch how they handle the next one.', { ambition: 25, order: 35, candor: -35, volatility: -50 }],
		['Feel it land, then get past it.', { candor: 25, volatility: 50, warmth: 20, hope: 25 }],
		['Work out what they know that you don’t. Learn it.', { ambition: 50, order: 30, warmth: -40 }]
	]),

	q('three-years-wasted', 'medium', 'hope', 'The thing you’ve worked on for three years is clearly not going to work.', [
		['Keep going. It isn’t over until it’s over.', { hope: 95, order: -50, volatility: 35 }],
		['Stop today. Take what’s reusable.', { hope: -65, order: 40, ambition: 40 }],
		['Finish it properly anyway. It deserves an ending.', { order: 30, warmth: 35, ambition: -45, hope: 30 }],
		['You knew a year ago. You’ve been managing the exit since.', { hope: -80, candor: -35, order: 25 }]
	]),

	q('the-sharp-thing', 'short', 'volatility', 'Someone says the one thing designed to get to you, in front of other people.', [
		['Say the sharper thing back, immediately.', { volatility: 95, candor: 40, warmth: -25 }],
		['Nothing. Go still. Deal with it later.', { volatility: -95, candor: -35, order: 30 }],
		['Laugh, and let them own how that looked.', { volatility: -40, candor: 25, warmth: 30, hope: 40 }],
		['Leave the room.', { volatility: 50, candor: -30, defiance: 50, warmth: -25 }]
	]),

	q('budget-no-oversight', 'medium', 'candor', 'You’re handed a budget with no oversight.', [
		['Publish how you’re spending it before anyone asks.', { candor: 50, order: 45, ambition: -35 }],
		['Spend it fast on the thing that’s obviously needed.', { order: -75, volatility: 60, hope: 50 }],
		['Hold most of it back for when it matters more.', { order: 40, candor: -30, hope: -50, volatility: -60 }],
		['Build something they can’t take back.', { ambition: 65, defiance: 80, candor: -25, order: 30 }]
	]),

	q('lie-for-them', 'medium', 'warmth', 'A friend asks you to lie for them. Not badly — just enough.', [
		['Do it. That’s what the friendship is.', { warmth: 55, candor: -45, defiance: 30 }],
		['Refuse, and tell them why to their face.', { candor: 50, warmth: -45, defiance: 45, volatility: 35 }],
		['Do it, and tell them it’s the last time.', { warmth: 30, candor: 20, order: 25 }],
		['Ask what they’re actually protecting first.', { order: 30, candor: -20, warmth: 15, hope: 25 }]
	]),

	q('finally-asks', 'medium', 'candor', 'You’ve been carrying something alone for months. Someone finally asks.', [
		['Tell them the whole thing.', { candor: 65, warmth: 45, volatility: 55 }],
		['Give them the short version. Change the subject.', { candor: -30, warmth: 5, volatility: -40 }],
		['Say you’re fine. Mean it, mostly.', { candor: -40, warmth: -45, hope: 30, volatility: -55 }],
		['Ask about them instead. You’re better at that side.', { warmth: 35, candor: -20, ambition: -35 }]
	]),

	// ============================================================= LONG (14)
	q('nobody-noticed', 'long', 'ambition', 'The work is good. Nobody has noticed.', [
		['Say so. Out loud. To the person who decides.', { candor: 30, ambition: 55 }],
		['Do the next one bigger.', { ambition: 45, order: 30, candor: -25, volatility: 35 }],
		['It’s fine. The work was the point.', { ambition: -60, warmth: -25, hope: 40, candor: -20 }],
		['Make sure the people who did it with you get named.', { warmth: 55, ambition: -40, candor: 25 }]
	]),

	q('least-experienced', 'long', 'candor', 'Halfway through, the room turns out to be far more experienced than you.', [
		['Ask the obvious question anyway.', { candor: 40, hope: 40, ambition: -30 }],
		['Catch up afterwards, on your own time.', { candor: -35, order: 30, ambition: 30 }],
		['Contribute the one thing you actually know.', { order: 25, candor: 15, warmth: 25, ambition: -25 }],
		['Assume they’re wrong about something, and find it.', { defiance: 70, ambition: 40, warmth: -35, candor: -20 }]
	]),

	q('wrong-in-public', 'long', 'candor', 'How you handle being wrong in public.', [
		['Correct it immediately, in the same room.', { candor: 45, volatility: 15 }],
		['Go to the people affected, one at a time.', { candor: -20, warmth: 45, order: 25 }],
		['Let it stand. Fix the outcome without the announcement.', { candor: -50, order: 30, ambition: 25 }],
		['Argue it out until you’re sure which of you is wrong.', { candor: 35, volatility: 55, defiance: 65 }]
	]),

	q('not-your-business', 'long', 'warmth', 'A stranger is being treated badly and it’s genuinely not your business.', [
		['Make it your business, immediately.', { defiance: 80, warmth: 45, volatility: 80 }],
		['Get close enough that they know someone’s watching.', { warmth: 35, candor: -25, volatility: -40 }],
		['Find who’s responsible and go to them instead.', { order: 45, candor: 25, defiance: 35 }],
		['Nothing. You’d be making it about you.', { warmth: -50, volatility: -65, candor: -20, hope: -30 }]
	]),

	q('secret-not-yours', 'long', 'candor', 'What you do with a secret that isn’t yours.', [
		['Keep it. Forever.', { candor: -40, warmth: 35, volatility: -45 }],
		['Keep it unless keeping it starts costing someone.', { candor: -10, order: 30, hope: 30 }],
		['Tell the person it’s about.', { candor: 55, warmth: 30, defiance: 60 }],
		['Never mention it. Account for it in everything you do.', { candor: -30, order: 40, ambition: 35, warmth: -30 }]
	]),

	q('credit-not-yours', 'long', 'ambition', 'Somebody hands you the credit for work that was mostly someone else’s.', [
		['Name whose it actually was, on the spot.', { candor: 50, ambition: -35, warmth: 30 }],
		['Take it. Fix the record later.', { ambition: 55, candor: -35, order: 20 }],
		['Let it sit. They’ll work it out.', { candor: -45, warmth: -45, ambition: 25, volatility: -40 }],
		['Split it publicly, whatever that costs you.', { warmth: 55, candor: 35, ambition: -45 }]
	]),

	q('stupid-rule', 'long', 'defiance', 'The rule is stupid and following it will make things worse.', [
		['Follow it, and document exactly how it failed.', { order: 50, defiance: -95, candor: 25 }],
		['Break it and tell no one.', { defiance: 50, candor: -50, order: -50 }],
		['Break it and say you broke it.', { defiance: 90, candor: 45, volatility: 45 }],
		['Get it changed, however long that takes.', { order: 45, ambition: 40, defiance: 35, hope: 55 }]
	]),

	q('unexpected-hour', 'long', 'volatility', 'You get an hour back that you didn’t expect.', [
		['Something that’s been sitting on the list for weeks.', { order: 55, ambition: 30, volatility: -35 }],
		['Call someone you’ve been meaning to call.', { warmth: 60, candor: 20 }],
		['Nothing. Deliberately nothing.', { volatility: -80, ambition: -60, warmth: -30 }],
		['Start the thing you’ve been circling.', { order: -45, ambition: 50, hope: 60, volatility: 65 }]
	]),

	q('trust-quickly', 'long', 'hope', 'What gets someone past your guard fast.', [
		['They said a true thing that cost them something.', { candor: 40, hope: 45, warmth: 10 }],
		['They did what they said they’d do, twice.', { order: 50, candor: -20, hope: -30 }],
		['They were kind when nobody was counting.', { warmth: 60, hope: 70, ambition: -30 }],
		['Nothing does. Speed is the problem.', { hope: -90, candor: -25, order: 25, volatility: -45 }]
	]),

	q('explain-the-instinct', 'long', 'candor', 'You’re asked to explain a decision you made on instinct.', [
		['Build the reasoning afterwards. It’s usually there.', { order: 40, candor: -25, ambition: 30 }],
		['Say it was instinct and stand behind it.', { candor: 45, defiance: 70, order: -55 }],
		['Admit you’re not sure, and re-open it.', { candor: 40, hope: 40, ambition: -45, volatility: -35 }],
		['Explain it in the terms they’ll accept, not the real ones.', { candor: -50, order: 35, ambition: 35 }]
	]),

	q('someone-slipping', 'long', 'warmth', 'Someone you rely on has started slipping.', [
		['Say it directly, this week.', { candor: 50, warmth: 10, volatility: 35 }],
		['Cover for them and wait for it to pass.', { warmth: 35, candor: -45, hope: 45 }],
		['Quietly build the backup, then talk.', { order: 55, candor: -25, warmth: -5, hope: -55 }],
		['Ask what’s going on before deciding it’s a problem.', { warmth: 30, candor: 25, hope: 50, order: -30 }]
	]),

	q('flattering-and-wrong', 'long', 'candor', 'The version of the story that gets told about you is wrong, and flattering.', [
		['Set it straight every time.', { candor: 50, ambition: -45 }],
		['Let it run. It isn’t doing any harm.', { candor: -35, volatility: -50, ambition: 25, hope: 25 }],
		['Use it. It opens doors you’d otherwise have to force.', { candor: -45, ambition: 65, order: 30 }],
		['Only with the people who matter to you.', { candor: 25, warmth: 55, ambition: -30 }]
	]),

	q('trusted-or-effective', 'long', 'hope', 'You have to choose between being trusted and being effective.', [
		['Trusted. Everything else is downstream of that.', { candor: 50, warmth: 45, ambition: -55 }],
		['Effective. Results are what people actually needed.', { ambition: 55, candor: -35, hope: -40 }],
		['Effective now, and spend years earning the trust back.', { ambition: 40, candor: -25, order: 40, hope: -60 }],
		['Refuse the choice. It’s a false one.', { defiance: 85, hope: 90, order: 25 }]
	]),

	q('thirty-years-from-now', 'long', 'hope', 'Thirty years from now, the thing you’d be least comfortable having someone find out.', [
		['How much of it was luck.', { ambition: 35, candor: -10, hope: -15 }],
		['How often you were frightened, and of what.', { volatility: 45, candor: -25, warmth: 30 }],
		['Who you left behind to get here.', { warmth: -50, ambition: 60, hope: -45 }],
		['That you never decided. It just happened.', { order: -50, ambition: -60, hope: -15, defiance: -60 }]
	])
];

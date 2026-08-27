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
 *
 * Ordering: grouped by `section` (see `./index.ts`), not by tier -- `section` is one
 * scored axis per chapter (order/candor/warmth/defiance/hope/ambition/volatility ->
 * obligation/disclosure/attachment/authority/outlook/appetite/temper), and each group is
 * kept contiguous so `sectionsForTier` (src/lib/engine/score.ts) can hand back a clean
 * index range no matter which tier is filtering the array. Tier membership is still a
 * per-question property; short/medium/long questions are interleaved within a section in
 * whatever order they were authored. Reordering this array changes `questionSetHash`
 * (src/lib/engine/share.ts) even though no id/text/vector changed -- existing share links
 * decode as `superseded`, which is expected here and is why the pack version was bumped.
 */

const q = (
	id: string,
	tier: Question['tier'],
	primaryAxis: string,
	section: string,
	text: string,
	options: Array<[string, Question['options'][number]['v']]>
): Question => ({
	id,
	tier,
	primaryAxis,
	section,
	text,
	options: options.map(([t, v], i) => ({ id: 'abcd'[i], text: t, v }))
});

export const QUESTIONS: Question[] = [
	// ============================================================ OBLIGATION (order) — 2 short, 1 medium
	q('trip-falling-apart', 'short', 'order', 'obligation', 'The group trip is falling apart in the chat. Nobody has booked anything.', [
		['Post an itinerary and start assigning people.', { order: 75, ambition: 45, candor: 25 }],
		['Book your own flight and tell them where you’ll be.', { order: -60, defiance: 65, warmth: -45, ambition: -10 }],
		['Message the two who are actually annoyed at each other.', { order: 15, candor: -25, warmth: 45 }],
		['Say nothing, turn up, carry the bags.', { order: -25, candor: -30, warmth: 40, ambition: -60 }]
	]),

	q('two-days-before-deadline', 'short', 'order', 'obligation', 'The plan falls apart two days before the deadline, mid-sprint. Someone still has to fill the gap.', [
		['Draft the plan.', { order: 75, ambition: 55 }],
		['Find what’s broken and patch it fast.', { order: -70, volatility: 45, candor: -5 }],
		['Check on whoever looks like they’re about to crack.', { warmth: 55, ambition: -40, hope: 45 }],
		['Take the worst piece. Don’t mention it.', { warmth: 30, ambition: -35, defiance: -40, candor: -20 }]
	]),

	q('one-shot-bad-plan', 'medium', 'order', 'obligation', 'One shot at it, and the plan is bad.', [
		['Run it. Something turns up.', { order: -55, hope: 50, volatility: 45 }],
		['Rewrite it in the last ten minutes.', { order: 45, volatility: 30, ambition: 35, candor: 5 }],
		['Ignore the numbers. Go with your gut.', { order: -50, hope: 65, candor: 5 }],
		['Refuse. Bad plans get people killed.', { order: 50, defiance: 80, candor: 30, hope: -65 }]
	]),

	// ============================================================ DISCLOSURE (candor) — 0 short, 4 medium, 5 long
	q('humiliating-thing', 'medium', 'candor', 'disclosure', 'You learn something about a friend they’d be humiliated to have known.', [
		['Tell them you know, straight away.', { candor: 60, warmth: 30 }],
		['Never mention it. Behave as though you don’t.', { candor: -45, warmth: 30, volatility: -35 }],
		['Ask someone who’d know what it actually means.', { candor: -10, order: 25, warmth: -25, ambition: -10 }],
		['Wait. If it starts hurting them, then say it.', { candor: -20, order: 30, hope: 25, volatility: -45 }]
	]),

	q('about-to-vote-for-it-anyway', 'medium', 'candor', 'disclosure', 'The plan is bad and everyone is about to vote for it anyway.', [
		['Say nothing. Vote with the room.', { candor: -50, warmth: -10, volatility: -55 }],
		['Say exactly what’s wrong with it, now.', { candor: 55, volatility: 55 }],
		['Catch the two people after who’d actually listen.', { candor: -30, order: 30, warmth: -25 }],
		['Flag the one part you’re sure is wrong.', { candor: 25, order: 25 }]
	]),

	q('budget-no-oversight', 'medium', 'candor', 'disclosure', 'You’re handed a budget with no oversight.', [
		['Publish how you’re spending it before anyone asks.', { candor: 50, order: 45, ambition: -35 }],
		['Spend it fast on the thing that’s obviously needed.', { order: -75, volatility: 60, hope: 50 }],
		['Hold most of it back for when it matters more.', { order: 40, candor: -30, hope: -50, volatility: -60 }],
		['Build something they can’t take back.', { ambition: 65, defiance: 80, candor: -25, order: 30 }]
	]),

	q('finally-asks', 'medium', 'candor', 'disclosure', 'You’ve been carrying something alone for months. Someone finally asks.', [
		['Tell them the whole thing.', { candor: 65, warmth: 45, volatility: 55 }],
		['Give them the short version. Change the subject.', { candor: -30, warmth: 5, volatility: -40 }],
		['Say you’re fine. Mean it, mostly.', { candor: -40, warmth: -45, hope: 30, volatility: -55 }],
		['Ask about them instead. You’re better at that side.', { warmth: 35, candor: -20, ambition: -35 }]
	]),

	q('least-experienced', 'long', 'candor', 'disclosure', 'Halfway through, the room turns out to be far more experienced than you.', [
		['Ask the obvious question anyway.', { candor: 40, hope: 40, ambition: -30 }],
		['Catch up afterwards, on your own time.', { candor: -35, order: 30, ambition: 30 }],
		['Contribute the one thing you actually know.', { order: 25, candor: 15, warmth: 25, ambition: -25 }],
		['Assume they’re wrong about something, and find it.', { defiance: 70, ambition: 40, warmth: -35, candor: -20 }]
	]),

	q('wrong-number-in-the-room', 'long', 'candor', 'disclosure', 'You give the client the wrong number, out loud, with everyone listening.', [
		['Correct it now, in front of everyone.', { candor: 45, volatility: 15 }],
		['Let the meeting end, then fix the number quietly.', { candor: -50, order: 30, ambition: 25 }],
		['Pull the client aside after, and own it one-on-one.', { candor: -20, warmth: 45, order: 25 }],
		['Argue your number was right until someone proves otherwise.', { candor: 35, volatility: 55, defiance: 65 }]
	]),

	q('not-theirs-to-tell', 'long', 'candor', 'disclosure', 'Someone hands you something that was never theirs to tell — about someone who has no idea.', [
		['Tell the person it’s about.', { candor: 55, warmth: 30, defiance: 60 }],
		['Keep it. It was never yours to pass on.', { candor: -40, warmth: 35, volatility: -45 }],
		['Sit on it, unless staying quiet starts costing someone.', { candor: -10, order: 30, hope: 30 }],
		['Never mention it. Just treat them differently now.', { candor: -30, order: 40, ambition: 35, warmth: -30 }]
	]),

	q('explain-the-instinct', 'long', 'candor', 'disclosure', 'You’re asked to explain a decision you made on instinct.', [
		['Build the reasoning afterwards. It’s usually there.', { order: 40, candor: -25, ambition: 30 }],
		['Say it was instinct and stand behind it.', { candor: 45, defiance: 70, order: -55 }],
		['Admit you’re not sure, and re-open it.', { candor: 40, hope: 40, ambition: -45, volatility: -35 }],
		['Explain it in the terms they’ll accept, not the real ones.', { candor: -50, order: 35, ambition: 35 }]
	]),

	q('flattering-and-wrong', 'long', 'candor', 'disclosure', 'The version of the story that gets told about you is wrong, and flattering.', [
		['Set it straight every time.', { candor: 50, ambition: -45 }],
		['Let it run. It isn’t doing any harm.', { candor: -35, volatility: -50, ambition: 25, hope: 25 }],
		['Use it. It opens doors you’d otherwise have to force.', { candor: -45, ambition: 65, order: 30 }],
		['Only with the people who matter to you.', { candor: 25, warmth: 55, ambition: -30 }]
	]),

	// ============================================================ ATTACHMENT (warmth) — 1 short, 2 medium, 2 long
	q('sixteen-hours', 'short', 'warmth', 'attachment', 'Sixteen hours into the emergency. What’s actually keeping you there?', [
		['Two specific people who’d be in trouble if I left.', { warmth: 70, ambition: -35 }],
		['I said I’d stay. That’s the whole reason.', { order: 45, candor: -15, defiance: -40 }],
		['The problem itself. It’s interesting and it’s mine now.', { warmth: -80, order: 20, ambition: 40 }],
		['If I go, it lands on someone who can’t carry it.', { warmth: 35, hope: 30, defiance: 40 }]
	]),

	q('never-once-let-you-down', 'medium', 'warmth', 'attachment', 'Someone who’s never once let you down does, this time.', [
		['Say it hurt, and stay anyway.', { warmth: 60, candor: 35, hope: 30 }],
		['Go quiet. See if they notice.', { warmth: -30, candor: -40, volatility: -30 }],
		['Cut it off, cleanly, and don’t explain why.', { warmth: -70, defiance: 40, candor: -30 }],
		['Forgive it, and never bring it up again.', { warmth: 40, candor: -45, hope: 20 }]
	]),

	q('lie-for-them', 'medium', 'warmth', 'attachment', 'A friend asks you to lie for them. Not badly — just enough.', [
		['Do it. That’s what the friendship is.', { warmth: 55, candor: -45, defiance: 30 }],
		['Refuse, and tell them why to their face.', { candor: 50, warmth: -45, defiance: 45, volatility: 35 }],
		['Do it, and tell them it’s the last time.', { warmth: 30, candor: 20, order: 25 }],
		['Ask what they’re actually protecting first.', { order: 30, candor: -20, warmth: 15, hope: 25 }]
	]),

	q('not-your-business', 'long', 'warmth', 'attachment', 'A stranger is being treated badly and it’s genuinely not your business.', [
		['Make it your business, immediately.', { defiance: 80, volatility: 80, candor: 20 }],
		['Get close enough that they know someone’s watching.', { defiance: 20, candor: -25, volatility: -40 }],
		['Find who’s responsible and go to them instead.', { order: 45, candor: 25, defiance: 35 }],
		['Nothing. You’d be making it about you.', { warmth: -50, volatility: -65, candor: -20, hope: -30 }]
	]),

	q('someone-slipping', 'long', 'warmth', 'attachment', 'Someone you rely on has started slipping.', [
		['Say it directly, this week.', { candor: 50, warmth: 10, volatility: 35 }],
		['Cover for them and wait for it to pass.', { warmth: 35, candor: -45, hope: 45 }],
		['Quietly build the backup, then talk.', { order: 55, candor: -25, warmth: -5, hope: -55 }],
		['Ask what’s going on before deciding it’s a problem.', { warmth: 30, candor: 25, hope: 50, order: -30 }]
	]),

	// ============================================================ AUTHORITY (defiance) — 2 short, 1 medium, 1 long
	q('six-years', 'short', 'defiance', 'authority', 'The organisation you gave six years to asks you for something you think is wrong.', [
		['Refuse, in writing, with your name on it.', { defiance: 95, candor: 55, ambition: -10 }],
		['Do it, and start building the case that stops it recurring.', { order: 50, defiance: 20, candor: -25, hope: 40 }],
		['Do it. You don’t get to pick which parts you believe in.', { defiance: -95, order: 25, warmth: -15 }],
		['Leave. Not loudly. Just stop being available.', { defiance: 65, candor: -40, ambition: -35, warmth: -20 }]
	]),

	q('name-comes-off-the-project', 'short', 'defiance', 'authority', 'Your name comes off the project, quietly, with no explanation.', [
		['Ask why, right there, in the chat.', { defiance: 85, candor: 60, volatility: 35 }],
		['Let it go. It’s not worth the scene.', { defiance: -90, order: 30, volatility: -40 }],
		['Do the work anyway. Make sure it shows.', { defiance: 20, ambition: 55, order: 35, candor: -20 }],
		['Start looking for a project that won’t do this.', { defiance: 55, ambition: -20, hope: -40, candor: -25 }]
	]),

	q('already-decided', 'medium', 'defiance', 'authority', 'You’re told the decision has already been made.', [
		['Ask who made it, in front of everyone.', { defiance: 90, candor: 50 }],
		['Accept it and do it well.', { defiance: -95, order: 40, volatility: -50 }],
		['Accept it, and quietly build the thing that outlasts it.', { defiance: 45, candor: -40, order: 50 }],
		['Ignore it and see whether anyone notices.', { defiance: 70, order: -65, candor: -25, volatility: 40 }]
	]),

	q('panel-about-to-reject-them', 'long', 'defiance', 'authority', 'The interview panel is about to reject a candidate for a reason that has nothing to do with the job.', [
		['Say it, right there, now.', { defiance: 80, candor: 40, volatility: 40 }],
		['Say nothing. It’s not your call to make.', { defiance: -85, order: 35, candor: -30 }],
		['Flag it to whoever can actually overrule it.', { defiance: 30, order: 45, ambition: 20, candor: -15 }],
		['Vote your own way. Let the record show it.', { defiance: 60, candor: 20, order: -30 }]
	]),

	// ============================================================ OUTLOOK (hope) — 1 short, 1 medium, 3 long
	q('says-theyve-changed', 'short', 'hope', 'outlook', 'Someone who hurt people badly says they’ve changed.', [
		['People do change. I’d rather be wrong about that than the other thing.', { hope: 95, warmth: 50, defiance: 15 }],
		['Believe it when a year of it has gone by.', { hope: 20, order: 40, candor: -10, volatility: -45 }],
		['Changed isn’t the same as owed. They can change somewhere else.', { hope: -60, warmth: -25, defiance: 45 }],
		['Nobody changes. They just get better at the cover.', { hope: -95, candor: -15, warmth: -40 }]
	]),

	q('three-years-wasted', 'medium', 'hope', 'outlook', 'The thing you’ve worked on for three years is clearly not going to work.', [
		['Keep going. It isn’t over until it’s over.', { hope: 95, order: -50, volatility: 35 }],
		['Stop today. Take what’s reusable.', { hope: -65, order: 40, ambition: 40 }],
		['Finish it properly anyway. It deserves an ending.', { order: 30, warmth: 35, ambition: -45, hope: 30 }],
		['You knew a year ago. You’ve been managing the exit since.', { hope: -80, candor: -35, order: 25 }]
	]),

	q('three-weeks-in', 'long', 'hope', 'outlook', 'Someone new asks to run point on something that matters. It’s been three weeks.', [
		['Say yes — they told a costly truth.', { candor: 40, hope: 45, warmth: 10 }],
		['Say yes. They’ve delivered, twice, exactly as promised.', { order: 50, candor: -20, hope: -30 }],
		['Say yes. They were kind when it counted.', { warmth: 60, hope: 70, ambition: -30 }],
		['Refuse. Speed alone proves nothing.', { hope: -90, candor: -25, order: 25, volatility: -45 }]
	]),

	q('the-follow-up-question', 'long', 'hope', 'outlook', 'You’re presenting the numbers. They only look good if nobody asks the follow-up question.', [
		['Answer the follow-up before anyone asks it.', { candor: 55, hope: -30, ambition: -25 }],
		['Let the good numbers carry the room today.', { ambition: 45, candor: -35, hope: 40 }],
		['Answer it, but only if someone actually asks.', { candor: 15, order: 30, hope: -10 }],
		['Push it to next quarter.', { order: 40, ambition: 30, hope: -50 }]
	]),

	q('thirty-years-from-now', 'long', 'hope', 'outlook', 'Thirty years from now, the thing you’d be least comfortable having someone find out.', [
		['How much of it was luck.', { ambition: 35, candor: -10, hope: -15 }],
		['How often you were frightened, and of what.', { volatility: 45, candor: -25, warmth: 30 }],
		['Who you left behind to get here.', { warmth: -50, ambition: 60, hope: -45 }],
		['That you never decided. It just happened.', { order: -50, ambition: -60, hope: -15, defiance: -60 }]
	]),

	// ============================================================ APPETITE (ambition) — 2 short, 1 medium, 2 long
	q('empty-chair', 'short', 'ambition', 'appetite', 'The chair at the head of the table is empty and everyone is looking at it.', [
		['Take it. Someone has to, and I’d do it better than the alternatives.', { ambition: 90, candor: 25, order: 25 }],
		['Push the person who should have it forward, then back them.', { ambition: -50, warmth: 55, candor: 15 }],
		['Leave it empty. Run the meeting from where you’re sitting.', { ambition: 30, candor: -40, order: 20 }],
		['Genuinely don’t want it. Ask when you can go.', { ambition: -80, volatility: -40, candor: 20 }]
	]),

	q('sell-off-tomorrow', 'short', 'ambition', 'appetite', 'You can keep exactly one part of the life you’re building. Everything else is sold off tomorrow.', [
		['Keep the people.', { warmth: 70, ambition: -40, hope: 40 }],
		['Hold onto the ones you’d actually choose.', { warmth: 15, ambition: -80, candor: -30, defiance: 45 }],
		['Finish the thing you’re building.', { ambition: 50, order: 50, hope: 80 }],
		['Get the leverage. Never be caught short again.', { ambition: 75, hope: -95, warmth: -40, volatility: 45 }]
	]),

	q('junior-does-it-better', 'medium', 'ambition', 'appetite', 'Someone junior does something better than you would have.', [
		['Hand them more, publicly.', { ambition: -45, warmth: 55, candor: 35 }],
		['Note it. Watch how they handle the next one.', { ambition: 25, order: 35, candor: -35, volatility: -50 }],
		['Feel it land, and keep it to yourself.', { volatility: 45, warmth: 15, hope: 15 }],
		['Work out what they know that you don’t. Learn it.', { ambition: 50, order: 30, warmth: -40 }]
	]),

	q('nobody-noticed', 'long', 'ambition', 'appetite', 'The work is good. Nobody has noticed.', [
		['Say so. Out loud. To the person who decides.', { candor: 30, ambition: 55 }],
		['Do the next one bigger.', { ambition: 45, order: 30, candor: -25, volatility: 35 }],
		['It’s fine. The work was the point.', { ambition: -60, warmth: -25, hope: 40, candor: -20 }],
		['Make sure the people who did it with you get named.', { warmth: 55, ambition: -40, candor: 25 }]
	]),

	q('credit-not-yours', 'long', 'ambition', 'appetite', 'Somebody hands you the credit for work that was mostly someone else’s.', [
		['Name whose it actually was, on the spot.', { candor: 50, ambition: -35, warmth: 30 }],
		['Take it. Fix the record later.', { ambition: 55, candor: -35, order: 20 }],
		['Let it sit. They’ll work it out.', { candor: -45, warmth: -45, ambition: 25, volatility: -40 }],
		['Split it publicly, whatever that costs you.', { warmth: 55, candor: 35, ambition: -45 }]
	]),

	// ============================================================ TEMPER (volatility) — 2 short, 0 medium, 1 long
	q('body-under-pressure', 'short', 'volatility', 'temper', 'Under real pressure, before you’ve thought about it, your body:', [
		['Goes quiet, and slow.', { volatility: -95, order: 35, candor: -20 }],
		['Gets loud and starts moving.', { volatility: 95, candor: 30, warmth: 35 }],
		['Narrows down to one single thing.', { volatility: -50, warmth: -45, order: 25, defiance: 25 }],
		['Starts improvising before your brain catches up.', { volatility: 75, order: -65, hope: 25 }]
	]),

	q('the-sharp-thing', 'short', 'volatility', 'temper', 'Someone says the one thing designed to get to you, in front of other people.', [
		['Say the sharper thing back, immediately.', { volatility: 95, candor: 40, warmth: -25 }],
		['Nothing. Go still. Deal with it later.', { volatility: -95, candor: -35, order: 30 }],
		['Laugh, and let them own how that looked.', { volatility: -40, candor: 25, warmth: 30, hope: 40 }],
		['Leave the room.', { volatility: 50, candor: -30, defiance: 50, warmth: -25 }]
	]),

	q('unexpected-hour', 'long', 'volatility', 'temper', 'You get an hour back that you didn’t expect.', [
		['Something that’s been sitting on the list for weeks.', { order: 55, ambition: 30, volatility: -35 }],
		['Call someone you’ve been meaning to call.', { warmth: 60, candor: 20 }],
		['Nothing. Deliberately nothing.', { volatility: -80, ambition: -60, warmth: -30 }],
		['Start the thing you’ve been circling.', { order: -45, ambition: 50, hope: 60, volatility: 65 }]
	])
];

import type { Question } from '$lib/engine/types';

/**
 * Craft rules these are written against (see _craft/quiz-question.card.md):
 *  - Announced fails. An option never names the trait it scores for; it states the act.
 *  - Every option costs something, and a different something. An option that costs
 *    nothing is the flattering one, and flattering is the same as obviously-correct.
 *  - Each option leads to a different downstream state. Two matching futures: cut or merge.
 *  - The prompt hands back on a want-at-risk — it stops before the outcome.
 *  - Displacement: if the abstract noun is in the prompt, the answer key is in the question.
 *  - Diegetic, not costumed. The world arrives as pressure and register, in the stem;
 *    a proper noun in an option compares affinity, not behaviour. (Inverted 2026-08-27 --
 *    zero-fandom read as a generic quiz with a skin. See _craft/quiz-question.card.md.)
 *  - Narrator stays out. No clause certifying what the situation means ("it's clear that",
 *    "it's genuinely not your business") -- the shown detail forces the conclusion.
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
	q('trip-falling-apart', 'short', 'order', 'obligation', 'Nobody has booked the passage and the window closes tonight. Everyone is waiting on everyone.', [
		['Write the plan and hand out the jobs.', { order: 75, ambition: 45, candor: 25 }],
		['Set out alone, and leave word where you’ll be.', { order: -60, defiance: 65, warmth: -45, ambition: -10 }],
		['Quietly smooth over the two who are at odds.', { order: 15, candor: -25, warmth: 45 }],
		['Turn up. Carry what needs carrying. Mention it to no one.', { order: -25, candor: -30, warmth: 40, ambition: -60 }]
	]),

	q('two-days-before-deadline', 'short', 'order', 'obligation', 'The convoy ships out in two days, and the manifest just came apart.', [
		['Draft a new plan and assign the bays.', { order: 75, ambition: 55 }],
		['Find what’s jamming the line and force a fix.', { order: -70, volatility: 45, candor: -5 }],
		['Check on whoever looks ready to break.', { warmth: 55, ambition: -40, hope: 45 }],
		['Take the worst bay. Don’t mention it.', { warmth: 30, ambition: -35, defiance: -40, candor: -20 }]
	]),

	q('one-shot-bad-plan', 'medium', 'order', 'obligation', 'One run out of the spaceport tonight, and the plan is bad.', [
		['Run it. Something always turns up.', { order: -55, hope: 50, volatility: 45 }],
		['Rewrite it in the last few minutes before launch.', { order: 45, volatility: 30, ambition: 35, candor: 5 }],
		['Ignore the numbers and go with your gut.', { order: -50, hope: 65, candor: 5 }],
		['Refuse to fly it. Bad plans get people killed.', { order: 50, defiance: 80, candor: 30, hope: -65 }]
	]),

	// ============================================================ DISCLOSURE (candor) — 0 short, 4 medium, 5 long
	q('humiliating-thing', 'medium', 'candor', 'disclosure', 'You find out a crewmate’s discharge papers are forged, and they don’t know you know.', [
		['Tell them you know, straight away.', { candor: 60, warmth: 30 }],
		['Treat them exactly the same. Never raise it.', { candor: -45, warmth: 30, volatility: -35 }],
		['Find out quietly what it actually means.', { candor: -10, order: 25, warmth: -25, ambition: -10 }],
		['Wait. Say something only if it starts hurting them.', { candor: -20, order: 30, hope: 25, volatility: -45 }]
	]),

	q('about-to-vote-for-it-anyway', 'medium', 'candor', 'disclosure', 'The flight plan is bad, and the garrison’s about to sign off on it anyway.', [
		['Say nothing. Vote with the room.', { candor: -50, warmth: -10, volatility: -55 }],
		['Say exactly what’s wrong with it, in front of everyone.', { candor: 55, volatility: 55 }],
		['Catch the two people after who’d actually listen.', { candor: -30, order: 30, warmth: -25 }],
		['Flag the one part you’re sure is wrong.', { candor: 25, order: 25 }]
	]),

	q('budget-no-oversight', 'medium', 'candor', 'disclosure', 'You’re handed a stack of credits and no requisition to account for them.', [
		['Log every credit spent before anyone asks.', { candor: 50, order: 45, ambition: -35 }],
		['Spend it fast, on whatever’s obviously needed most.', { order: -75, volatility: 60, hope: 50 }],
		['Hold most of it back for when it matters more.', { order: 40, candor: -30, hope: -50, volatility: -60 }],
		['Build something with it they can’t take back.', { ambition: 65, defiance: 80, candor: -25, order: 30 }]
	]),

	q('finally-asks', 'medium', 'candor', 'disclosure', 'Months into the same long haul, someone finally asks over the comm how you’re doing.', [
		['Tell them the whole thing.', { candor: 65, warmth: 45, volatility: 55 }],
		['Give the short version, then change the subject.', { candor: -30, warmth: 5, volatility: -40 }],
		['Say you’re fine. Mostly mean it.', { candor: -40, warmth: -45, hope: 30, volatility: -55 }],
		['Ask about them instead. That’s easier ground.', { warmth: 35, candor: -20, ambition: -35 }]
	]),

	q('least-experienced', 'long', 'candor', 'disclosure', 'Halfway through the briefing, everyone else has flown the transport for years.', [
		['Ask the obvious question anyway.', { candor: 40, hope: 40, ambition: -30 }],
		['Catch up afterward, on your own time.', { candor: -35, order: 30, ambition: 30 }],
		['Contribute the one thing you actually know.', { order: 25, candor: 15, warmth: 25, ambition: -25 }],
		['Assume they’re wrong about something, and find it.', { defiance: 70, ambition: 40, warmth: -35, candor: -20 }]
	]),

	q('wrong-number-in-the-room', 'long', 'candor', 'disclosure', 'You quote the buyer the wrong number for the salvage, out loud, with the whole market listening.', [
		['Correct it now, before the buyer answers.', { candor: 45, volatility: 15 }],
		['Let the deal close, then fix the number quietly.', { candor: -50, order: 30, ambition: 25 }],
		['Pull the buyer aside, and own it one-on-one.', { candor: -20, warmth: 45, order: 25 }],
		['Argue your number was right until someone proves otherwise.', { candor: 35, volatility: 55, defiance: 65 }]
	]),

	q('not-theirs-to-tell', 'long', 'candor', 'disclosure', 'A crewmate tells you what a bunkmate’s medical file actually says, unasked.', [
		['Tell the person it’s about.', { candor: 55, warmth: 30, defiance: 60 }],
		['Keep it. It was never yours to pass on.', { candor: -40, warmth: 35, volatility: -45 }],
		['Sit on it, unless silence starts costing someone.', { candor: -10, order: 30, hope: 30 }],
		['Adjust how you deal with them, and never say why.', { candor: -30, order: 40, ambition: 35, warmth: -30 }]
	]),

	q('explain-the-instinct', 'long', 'candor', 'disclosure', 'In the hangar debrief, they want the reasoning behind a call you made on instinct.', [
		['Build the reasoning afterward. It’s usually there.', { order: 40, candor: -25, ambition: 30 }],
		['Say it was instinct, and stand behind it.', { candor: 45, defiance: 70, order: -55 }],
		['Admit you’re not sure, and reopen it.', { candor: 40, hope: 40, ambition: -45, volatility: -35 }],
		['Explain it in terms they’ll accept, not the real ones.', { candor: -50, order: 35, ambition: 35 }]
	]),

	q('flattering-and-wrong', 'long', 'candor', 'disclosure', 'The story people tell about that run in the cantina isn’t what happened, and it makes you look good.', [
		['Set it straight, every time.', { candor: 50, ambition: -45 }],
		['Let it run. It isn’t hurting anyone.', { candor: -35, volatility: -50, ambition: 25, hope: 25 }],
		['Use it. It opens doors you’d otherwise have to force.', { candor: -45, ambition: 65, order: 30 }],
		['Only correct it with the people who matter.', { candor: 25, warmth: 55, ambition: -30 }]
	]),

	// ============================================================ ATTACHMENT (warmth) — 1 short, 2 medium, 2 long
	q('sixteen-hours', 'short', 'warmth', 'attachment', 'Sixteen hours into the emergency, and the shift supervisor already called it. What’s actually keeping you there?', [
		['Two specific people who’d be in trouble by morning.', { warmth: 70, ambition: -35 }],
		['A promise to stay. That’s the whole reason.', { order: 45, candor: -15, defiance: -40 }],
		['The problem itself. It’s interesting, and it’s mine now.', { warmth: -80, order: 20, ambition: 40 }],
		['Leaving means it lands on someone who can’t carry it.', { warmth: 35, hope: 30, defiance: 40 }]
	]),

	q('never-once-let-you-down', 'medium', 'warmth', 'attachment', 'The one on the crew who’s never missed a comm call misses it, tonight.', [
		['Name it once. Stay anyway.', { warmth: 60, candor: 35, hope: 30 }],
		['Go quiet. Wait to see if they notice.', { warmth: -30, candor: -40, volatility: -30 }],
		['Cut it off, cleanly, and offer no explanation.', { warmth: -70, defiance: 40, candor: -30 }],
		['Forgive it, and never bring it up again.', { warmth: 40, candor: -45, hope: 20 }]
	]),

	q('lie-for-them', 'medium', 'warmth', 'attachment', 'A crewmate asks you to tell the checkpoint guard a story that isn’t quite true.', [
		['Do it. That’s what crew is for.', { warmth: 55, candor: -45, defiance: 30 }],
		['Refuse, and tell them why to their face.', { candor: 50, warmth: -45, defiance: 45, volatility: 35 }],
		['Do it, but tell them it’s the last time.', { warmth: 30, candor: 20, order: 25 }],
		['Ask what they’re actually protecting first.', { order: 30, candor: -20, warmth: 15, hope: 25 }]
	]),

	q('not-your-business', 'long', 'warmth', 'attachment', 'Guards are leaning on someone in the market, and nobody there knows your name.', [
		['Make it your business, right now.', { defiance: 80, volatility: 80, candor: 20 }],
		['Get close enough that they know someone’s watching.', { defiance: 20, candor: -25, volatility: -40 }],
		['Find whoever’s responsible, and take it to them.', { order: 45, candor: 25, defiance: 35 }],
		['Do nothing. Keep walking.', { warmth: -50, volatility: -65, candor: -20, hope: -30 }]
	]),

	q('someone-slipping', 'long', 'warmth', 'attachment', 'The medic you rely on, a week from the nearest port, has started getting the doses wrong.', [
		['Say it directly, before the next run.', { candor: 50, warmth: 10, volatility: 35 }],
		['Cover for them, and wait for it to pass.', { warmth: 35, candor: -45, hope: 45 }],
		['Quietly build a backup, then have the talk.', { order: 55, candor: -25, warmth: -5, hope: -55 }],
		['Ask what’s going on before calling it a problem.', { warmth: 30, candor: 25, hope: 50, order: -30 }]
	]),

	// ============================================================ AUTHORITY (defiance) — 2 short, 1 medium, 1 long
	q('six-years', 'short', 'defiance', 'authority', 'The order comes down from the garrison you’ve served six years, and you think it’s wrong.', [
		['Refuse, in writing, with your name on it.', { defiance: 95, candor: 55, ambition: -10 }],
		['Comply, and start building the case that stops it recurring.', { order: 50, defiance: 20, candor: -25, hope: 40 }],
		['Carry it out. You don’t get to pick which parts you believe in.', { defiance: -95, order: 25, warmth: -15 }],
		['Leave. Not loudly. Just stop being available.', { defiance: 65, candor: -40, ambition: -35, warmth: -20 }]
	]),

	q('name-comes-off-the-project', 'short', 'defiance', 'authority', 'Someone strikes your name from the manifest, quietly, and offers no reason.', [
		['Ask the clerk why, and don’t lower your voice.', { defiance: 85, candor: 60, volatility: 35 }],
		['Let it go. Not worth the scene.', { defiance: -90, order: 30, volatility: -40 }],
		['Do the work anyway. Make sure it shows.', { defiance: 20, ambition: 55, order: 35, candor: -20 }],
		['Start looking for a posting that won’t do this.', { defiance: 55, ambition: -20, hope: -40, candor: -25 }]
	]),

	q('already-decided', 'medium', 'defiance', 'authority', 'You’re told the posting’s already been decided, above your head.', [
		['Make them name who decided.', { defiance: 90, candor: 50 }],
		['Accept it. Do it well.', { defiance: -95, order: 40, volatility: -50 }],
		['Accept it, then quietly build what outlasts it.', { defiance: 45, candor: -40, order: 50 }],
		['Ignore it, and see if anyone notices.', { defiance: 70, order: -65, candor: -25, volatility: 40 }]
	]),

	q('panel-about-to-reject-them', 'long', 'defiance', 'authority', 'The hiring board is about to turn someone away for a reason that has nothing to do with the job.', [
		['Stop the vote and say why.', { defiance: 80, candor: 40, volatility: 40 }],
		['Sit through it. It isn’t your call.', { defiance: -85, order: 35, candor: -30 }],
		['Flag it to whoever can actually overrule it.', { defiance: 30, order: 45, ambition: 20, candor: -15 }],
		['Vote your own way, and let the record show it.', { defiance: 60, candor: 20, order: -30 }]
	]),

	// ============================================================ OUTLOOK (hope) — 1 short, 1 medium, 3 long
	q('says-theyve-changed', 'short', 'hope', 'outlook', 'Someone who ran smuggler routes and hurt people badly says they’ve changed, and wants back in.', [
		['People do change. I’d rather be wrong about that.', { hope: 95, warmth: 50, defiance: 15 }],
		['Believe it after a year’s gone by.', { hope: 20, order: 40, candor: -10, volatility: -45 }],
		['Changed isn’t owed. They can change somewhere else.', { hope: -60, warmth: -25, defiance: 45 }],
		['Nobody changes. They just hide it better.', { hope: -95, candor: -15, warmth: -40 }]
	]),

	q('three-years-wasted', 'medium', 'hope', 'outlook', 'The refit is three years old. The freighter still won’t fly.', [
		['Keep going. Three years is a reason to finish, not to stop.', { hope: 95, order: -50, volatility: 35 }],
		['Stop today, and take what’s still reusable.', { hope: -65, order: 40, ambition: 40 }],
		['Finish it properly anyway. It deserves an ending.', { order: 30, warmth: 35, ambition: -45, hope: 30 }],
		['You knew a year ago. You’ve been managing the exit since.', { hope: -80, candor: -35, order: 25 }]
	]),

	q('three-weeks-in', 'long', 'hope', 'outlook', 'The newest one aboard the transport asks to run point on the next job, three weeks in.', [
		['Say yes. They told a costly truth.', { candor: 40, hope: 45, warmth: 10 }],
		['Say yes. They’ve delivered, twice, exactly as promised.', { order: 50, candor: -20, hope: -30 }],
		['Say yes. They were kind when it counted.', { warmth: 60, hope: 70, ambition: -30 }],
		['Refuse. Three weeks proves nothing.', { hope: -90, candor: -25, order: 25, volatility: -45 }]
	]),

	q('the-follow-up-question', 'long', 'hope', 'outlook', 'You’re reading out the credits from the job. It only holds up if nobody asks what it actually cost.', [
		['Answer the follow-up before anyone asks it.', { candor: 55, hope: -30, ambition: -25 }],
		['Let the good numbers do the talking today.', { ambition: 45, candor: -35, hope: 40 }],
		['Answer it, but only if someone actually asks.', { candor: 15, order: 30, hope: -10 }],
		['Push the accounting to next run.', { order: 40, ambition: 30, hope: -50 }]
	]),

	q('thirty-years-from-now', 'long', 'hope', 'outlook', 'Thirty years from now, name the part of how you got here you’d least want known.', [
		['How much of it came down to luck.', { ambition: 35, candor: -10, hope: -15 }],
		['How often you were afraid, and of what.', { volatility: 45, candor: -25, warmth: 30 }],
		['Who you left behind to get here.', { warmth: -50, ambition: 60, hope: -45 }],
		['That you never actually decided anything.', { order: -50, ambition: -60, hope: -15, defiance: -60 }]
	]),

	// ============================================================ APPETITE (ambition) — 2 short, 1 medium, 2 long
	q('empty-chair', 'short', 'ambition', 'appetite', 'The command chair’s empty, and the whole bridge is looking at it.', [
		['Take it. Nobody else in the room would do it better.', { ambition: 90, candor: 25, order: 25 }],
		['Push whoever should have it forward, and back them.', { ambition: -50, warmth: 55, candor: 15 }],
		['Leave it empty, and run things from where you’re sitting.', { ambition: 30, candor: -40, order: 20 }],
		['Don’t want it. Ask when you can go.', { ambition: -80, volatility: -40, candor: 20 }]
	]),

	q('sell-off-tomorrow', 'short', 'ambition', 'appetite', 'Keep exactly one part of the life you’re building. Everything else is gone by tomorrow.', [
		['Keep the people.', { warmth: 70, ambition: -40, hope: 40 }],
		['Keep the two you’d choose if nobody was watching.', { warmth: 15, ambition: -80, candor: -30, defiance: 45 }],
		['Finish the thing you’re building.', { ambition: 50, order: 50, hope: 80 }],
		['Get the leverage. Never be caught short again.', { ambition: 75, hope: -95, warmth: -40, volatility: 45 }]
	]),

	q('junior-does-it-better', 'medium', 'ambition', 'appetite', 'On the approach to the hangar, the newest hire calls it better than you would have.', [
		['Hand them more, publicly.', { ambition: -45, warmth: 55, candor: 35 }],
		['Note it, and watch how they handle the next one.', { ambition: 25, order: 35, candor: -35, volatility: -50 }],
		['Wear it for a second. Then move on.', { volatility: 45, warmth: 15, hope: 15 }],
		['Work out what they know that you don’t, and learn it.', { ambition: 50, order: 30, warmth: -40 }]
	]),

	q('nobody-noticed', 'long', 'ambition', 'appetite', 'The fix is good. Nobody’s logged it in the manifest.', [
		['Say so, out loud, to whoever signs off.', { candor: 30, ambition: 55 }],
		['Do the next one bigger.', { ambition: 45, order: 30, candor: -25, volatility: 35 }],
		['It’s fine. The work was the point.', { ambition: -60, warmth: -25, hope: 40, candor: -20 }],
		['Make sure whoever helped gets named too.', { warmth: 55, ambition: -40, candor: 25 }]
	]),

	q('credit-not-yours', 'long', 'ambition', 'appetite', 'The buyer credits you for a job that was mostly someone else’s work, with the crew listening.', [
		['Name whose work it actually was, on the spot.', { candor: 50, ambition: -35, warmth: 30 }],
		['Take it, and fix the record later.', { ambition: 55, candor: -35, order: 20 }],
		['Say nothing, and let them work it out.', { candor: -45, warmth: -45, ambition: 25, volatility: -40 }],
		['Split it publicly, whatever that costs you.', { warmth: 55, candor: 35, ambition: -45 }]
	]),

	// ============================================================ TEMPER (volatility) — 2 short, 0 medium, 1 long
	q('body-under-pressure', 'short', 'volatility', 'temper', 'When the alarm goes off, before you’ve thought about it, your body:', [
		['Goes quiet, and still.', { volatility: -95, order: 35, candor: -20 }],
		['Gets loud, and moves first.', { volatility: 95, candor: 30, warmth: 35 }],
		['Narrows down to exactly one thing.', { volatility: -50, warmth: -45, order: 25, defiance: 25 }],
		['Starts improvising before your head catches up.', { volatility: 75, order: -65, hope: 25 }]
	]),

	q('the-sharp-thing', 'short', 'volatility', 'temper', 'Someone says the one thing built to get under your skin, while the whole crew is listening.', [
		['Say something sharper back, right away.', { volatility: 95, candor: 40, warmth: -25 }],
		['Nothing. Go still, and deal with it later.', { volatility: -95, candor: -35, order: 30 }],
		['Laugh. Let them own how that looked.', { volatility: -40, candor: 25, warmth: 30, hope: 40 }],
		['Get up and go, mid-sentence.', { volatility: 50, candor: -30, defiance: 50, warmth: -25 }]
	]),

	q('unexpected-hour', 'long', 'volatility', 'temper', 'An hour opens up that you didn’t expect to have.', [
		['Something that’s been sitting on the list for weeks.', { order: 55, ambition: 30, volatility: -35 }],
		['Call the person you’ve been meaning to call.', { warmth: 60, candor: 20 }],
		['Nothing. Deliberately, nothing.', { volatility: -80, ambition: -60, warmth: -30 }],
		['Start the thing you’ve been circling.', { order: -45, ambition: 50, hope: 60, volatility: 65 }]
	])
];

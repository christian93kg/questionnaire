import type { Question } from '../../engine/types';

/**
 * Question bank — 34 units. short 10 ⊂ medium 20 ⊂ long 34.
 *
 * FULL REWRITE 2026-08-28. Text, vectors and ids, all of it. The two passes recorded in the
 * previous header argued about the hinge, about lexicalisation, about which pressure ran
 * over its cap — and the bank they were arguing over could not be answered on one read.
 * That is the defect neither pass was looking for, so neither pass found it.
 *
 * WHAT WAS ACTUALLY WRONG, since both prior passes reported themselves clean:
 *
 * 1. INDEFINITE-REFERENT OPENERS. Six-plus stems opened on an unnamed thing — "Whatever
 *    keeps the gate", "Whatever keeps the common-room fire lit", "Whatever dropped it",
 *    "The one who serves the kitchens". Every one of them made a reader solve a riddle
 *    before reaching the choice. The construction was reached for to dodge a WARN-tier
 *    noun, and the WARN tier is advisory: `house-elf` costs one advisory line and buys a
 *    stem a reader understands instantly. That was always the better trade. The card now
 *    bans the construction outright.
 * 2. NO INCITING EVENT. `the-ghost-on-the-staircase` read "The ghost has told it the only
 *    way it can tell anything, and you are being asked whether to add the part it left
 *    out" — and never said what happened. Rereading does not recover it, because it is not
 *    there. `sworn-to-skip` ("the sworn kind and not the said kind") and
 *    `half-out-of-your-wand` ("what your family is") failed the same way.
 * 3. THE TAKER WAS A SPECTATOR. Objects acted; "you" received. Nothing was happening to
 *    anybody, in a body, in a room, now.
 * 4. ONE SETTING, THIRTY-FOUR TIMES. Books, files, registers, plates, print offices, rolls,
 *    forms, post bags, ledgers. The pack authoring-notes had already named the result —
 *    "the bank read as a civil-service drama" — and the fix applied was to spread the
 *    PRESSURES more evenly, which changed nothing, because pressure variety and scene
 *    variety are different axes and only the first was being measured. There is now a
 *    direct cap: at most 12 of 34 on paperwork. This bank runs exactly 12.
 *
 * THE SHAPE NOW: a scene, then an optional handback (`ask`), then four options. The scene
 * names an animate participant, puts the inciting event on the page, and uses present-tense
 * physical verbs. The handback is a short second line under the scene — sometimes a
 * question, sometimes pressure with no question in it, absent on nine of the 34. It varies
 * every single time, which is what keeps it from becoming the repeated template the kill
 * list bans; uniform it and that rule fires for real. Full doctrine:
 * `_craft/quiz-question.card.md` → "Legibility".
 *
 * THE TRACE, and why four of the five uses are gone. "Magic leaves a trace: underage use is
 * detectable, and someone is counting" generated five units and three of them fired inside
 * the castle, where the Trace does not apply — school is precisely where underage wizards
 * get to practise. It is off the pressure list. One unit keeps it, on the holidays, where
 * it is true. Its replacement is the pressure this school actually runs on: punishment is
 * collective, and the cost of your choice lands on people who did not make it and cannot
 * leave. See `_craft/packs/harry-potter/vocabulary.md`.
 *
 * WHAT WAS KEPT FROM THE PRIOR PASSES, because both got these right:
 *  - The single-sentence ", and" hinge is the house form. The exemplars are 4/5 hinge and a
 *    cap on it has now been checked and rejected twice. Variety lives inside the sentence.
 *  - Options stay terse, plain English, no proper nouns, and every one of them costs
 *    something.
 *  - No unit names a house, a named character, or a DENY-tier noun, and none grants the
 *    taker a house, a bloodline, a side, a profession, a possession or a rare power — in
 *    literal phrasing or in paraphrase. The four paraphrase leaks the last review caught
 *    ("the thing your family owns", "waves you past the queue", "your column") are not
 *    reintroduced: the bound things answer to the school, the queue advantage is a line in
 *    a file that a clerk reads out, and the byline is a prize entry.
 *
 * WHAT MOVED, and what it costs:
 *  - EVERY VECTOR IS RETUNED. `calibration.json` is solved against these vectors by
 *    `scripts/calibrate.ts`, so it MUST be regenerated (`npm run calibrate -- harry-potter`)
 *    and `npm run audit -- harry-potter` MUST pass before this ships. The audit gates that
 *    can legitimately fail here are reachability and twins.
 *  - EVERY ID IS NEW, and describes its stem. That changes `questionSetHash`
 *    (`src/lib/engine/share.ts`), so every share link from pack version 1 now decodes to
 *    `superseded` and shows the older-version path rather than a silently different
 *    character. That is the correct outcome and the reason ids were changed rather than
 *    kept: `decodeResult` returns `ok` on a hash match WITHOUT checking the pack version,
 *    so a reweight under the old ids would have rescored every live link in silence.
 *  - Amplitude still falls short → medium → long (median primary 85 / 65 / 55), array order
 *    is still grouped by `section` contiguously (`sectionsForTier()` throws otherwise), and
 *    there are still no `sig` hints.
 */

/**
 * Terse builder. Option ids are positional a|b|c|d, so options never carry their own ids.
 *
 * `ask` — the handback — is LAST, after the options array, and that position is not
 * cosmetic. The helper-form parser in `question-lint.py` takes the stem to be the last
 * string literal before the options array; a sixth argument in front of the array would
 * silently become the prompt and the real stem would go unlinted. See `_trailing_ask`.
 *
 * (Apostrophes and backticks in this file pair up on purpose. That parser skips string
 * literals but NOT comments, so one unmatched quote mark in a comment desyncs the scan
 * and the whole bank reports as zero units. It cost a debug cycle on 2026-08-28.)
 */
const q = (
	id: string,
	tier: Question['tier'],
	primaryAxis: string,
	section: string,
	text: string,
	options: Array<[string, Question['options'][number]['v']]>,
	ask?: string
): Question => ({
	id,
	tier,
	primaryAxis,
	section,
	text,
	...(ask ? { ask } : {}),
	options: options.map(([t, v], i) => ({ id: 'abcd'[i], text: t, v }))
});

export const QUESTIONS: Question[] = [
	// ================================================================ METHOD (precept)
	q('the-cauldron-goes-over', 'short', 'precept', 'method', 'The first-year two benches down has his flame right up, and the cauldron goes over — across the bench, across his hands.', [
		['Work the board sequence from the top, in order.', { precept: 85, candour: 20, temper: -30 }],
		['His hands first. The bench can burn.', { precept: -60, attachment: 70, temper: 30 }],
		['Shout for the master and hold everyone back.', { precept: 55, defiance: -50, ambition: -30 }],
		['Empty your own cauldron over it and see.', { precept: -85, defiance: 40, temper: 40, candour: -30 }]
	], 'You were not watching. Why not?'),
	q('the-staircase-locks', 'short', 'precept', 'method', 'The staircase swings out and locks facing an unlit corridor, and the portrait on the landing tells you to stand still and wait for it.', [
		['Wait. It swings back on a timetable.', { precept: 85, defiance: -25, temper: -35, attachment: -20, ambition: -30 }],
		['Walk the corridor and find your own way down.', { precept: -70, defiance: 40, ambition: 30 }],
		['Bang on the rail until somebody on the landing hears.', { precept: 20, candour: 75, attachment: 25, ambition: -40 }],
		['Climb the rail to the flight below.', { precept: -75, temper: 55, defiance: 25, candour: -25 }]
	], 'Twenty minutes now, and it has not moved.'),
	q('the-vine-and-the-sign', 'medium', 'precept', 'method', 'A vine through the greenhouse glass has a second-year by the ankle, and the sign on the bench says students are not to cut it.', [
		['Cut it. Read the sign after.', { precept: -70, defiance: 55, temper: 30 }],
		['Fetch the professor from the next greenhouse.', { precept: 60, defiance: -45, attachment: -25 }],
		['Work her foot out without touching the vine.', { precept: 45, attachment: 50, temper: -40 }],
		['Turn the sign to the wall, then cut it.', { precept: -40, candour: -70, ambition: 25 }]
	], 'She has stopped struggling.'),
	q('a-week-is-a-week', 'long', 'precept', 'method', 'The matron mended the wrist with a charm that needs a week to set. It feels fine already, and they pick the team on Thursday.', [
		['Sit it out. A week is a week.', { precept: 55, ambition: -55, temper: -30 }],
		['Ask her to look again and let you off early.', { precept: 45, candour: 45, defiance: -45, ambition: 45 }],
		['Fly on the day. Tell her when it is over.', { precept: -50, ambition: 50, candour: -35 }],
		['Fly on the day, and tell her first.', { precept: -30, candour: 65, defiance: 45 }]
	], 'Two days of the week left.'),
	q('sixty-points-before-pudding', 'long', 'precept', 'method', 'Sixty points come off before pudding, and the prefect is reading out how, item by item, to the whole table.', [
		['Stand up and take the two that were you.', { precept: 55, candour: 60, defiance: 30, temper: 35 }],
		['Let him finish the list.', { precept: -35, candour: -50, temper: -45, ambition: -30 }],
		['Find him afterwards, outside the hall.', { precept: 30, candour: 35, attachment: 20, temper: -40 }],
		['Say the list has the other four wrong.', { precept: -40, candour: 40, temper: 45, reckoning: 35 }]
	], 'He has not reached your name.'),

	// ================================================================ DISCLOSURE (candour)
	q('back-under-the-counter', 'short', 'candour', 'disclosure', "The apothecary serves the boy ahead of you, reads your friend's name off the next order, and puts that potion back under the counter.", [
		['Say what just happened, out loud, with the queue there.', { candour: 85, temper: 45, defiance: 35, reckoning: 30 }],
		['Buy your own and get out.', { candour: -85, attachment: -55, reckoning: -30, ambition: -25, precept: -25, temper: -30 }],
		['Tell him: serve them both or serve neither.', { candour: 70, precept: 25, attachment: 45, temper: -20 }],
		['Walk out together and leave it unbought.', { candour: -60, attachment: 60, defiance: 40, reckoning: -30, precept: -25, temper: -25 }]
	], 'Your friend has not said anything.'),
	q('a-hold-on-the-surname', 'medium', 'candour', 'disclosure', "Your friend's exam result is in the post the office holds back a day, and the clerk says the hold is on the surname, not the letter.", [
		['Make him turn the bag out where your friend can see.', { candour: 65, defiance: 40, temper: 25, precept: 30 }],
		['Get your friend the result another way and explain after.', { candour: -55, attachment: 55, precept: -25 }],
		['Take it to a prefect and name what the hold is for.', { candour: 60, precept: 45, defiance: 25, temper: 30 }],
		['Wait the day out and tell him when it comes.', { candour: -65, attachment: -45, temper: -35, ambition: -20 }]
	]),
	q('the-quill-is-writing', 'medium', 'candour', 'disclosure', 'The headmaster wants it in your own words, and the quill on his desk is already writing down everything said in the room.', [
		['Give it exactly as it happened.', { candour: 68, precept: 45, defiance: -35, ambition: -20, temper: -25 }],
		['Give the version you can stand being read back.', { candour: -55, precept: 20, defiance: 20, temper: -35 }],
		['Ask him to stop the quill first.', { candour: -68, defiance: 45, precept: -40, temper: 25 }],
		['Keep it short for the quill. Tell a friend the rest.', { candour: 52, attachment: 45, precept: -35, defiance: -30 }]
	], 'Including this.'),
	q('the-portrait-was-asked', 'long', 'candour', 'disclosure', 'The portrait by the library has watched you take the same corridor every night this term, and a prefect stopped in front of it this morning and asked.', [
		['Go to her first and say where you have been going.', { candour: 50, precept: 45, defiance: -35, attachment: 20, temper: -25 }],
		['Use a different corridor from tonight.', { candour: -45, precept: -30, defiance: -35, temper: -30 }],
		['Admit you were out. Leave the where alone.', { candour: -42, precept: 20, ambition: -20 }],
		['Let the portrait answer, and agree with whatever it says.', { candour: 32, precept: -20, defiance: -60, reckoning: -30 }]
	], 'It has not answered yet.'),
	q('set-in-type-by-people-who-were-not-there', 'long', 'candour', 'disclosure', "You watched the whole thing from the gallery, and the ministry's account of it is being set in type tonight by people who were not there.", [
		['Write it down and get it round the school by morning.', { candour: 52, defiance: 40, precept: -25, ambition: 20 }],
		['Wait to be asked, and answer only what is asked.', { candour: -32, defiance: -55, precept: 30, reckoning: -30 }],
		['Give it to somebody who is not a newspaper.', { candour: 30, attachment: 45, precept: -20, defiance: -20 }],
		['Let the printed version stand.', { candour: -55, reckoning: -35, ambition: -55, attachment: -35 }]
	]),

	// ================================================================ ATTACHMENT
	q('packed-for-the-kitchens', 'short', 'attachment', 'attachment', 'The house-elf who cleans your dormitory has been mending your things at night unasked, and the caretaker has just told it to pack for the kitchens.', [
		['Speak for it at the staff table, by name.', { attachment: 85, candour: 55, defiance: 35, reckoning: 30 }],
		['Do its rota tonight so the work looks done.', { attachment: 60, precept: -30, ambition: -50, temper: -25 }],
		['Tell the caretaker you asked it to.', { attachment: 25, candour: -45, precept: 20 }],
		['Put in for a replacement and move on.', { attachment: -80, candour: -50, temper: -30, reckoning: -30 }]
	], 'It is packing.'),
	q('past-the-second-buoy', 'short', 'attachment', 'attachment', 'The boy you came down with is past the second buoy and not coming up, and the oath you swore on your wand was never to swim here alone.', [
		['In. Let the oath take what it takes.', { attachment: 85, precept: -50, defiance: 55 }],
		['Run for the boathouse pole.', { attachment: 40, precept: 60, temper: -30 }],
		['Shout the castle down from where you stand.', { attachment: 30, candour: 70, ambition: -35 }],
		['Go for a teacher — four minutes there and back.', { attachment: -55, precept: 55, defiance: -50 }]
	], 'Nobody else on the bank.'),
	q('printed-before-the-hearing', 'medium', 'attachment', 'attachment', 'The ministry prints the names the courts have taken before the hearings happen now, and your closest friend is on the list going out in the morning.', [
		['Get to him before the post does.', { attachment: 65, defiance: 35, candour: 30, precept: -30 }],
		['Stay in. Let him read it with everyone else.', { attachment: -60, temper: -35, precept: 30, ambition: -25 }],
		['Put a different account into the print office tonight.', { attachment: 55, candour: 50, defiance: 45 }],
		['Say you barely know him, and keep saying it.', { attachment: -65, candour: -60, reckoning: -20, precept: -20, defiance: -40 }]
	], 'He does not know.'),
	q('the-fire-went-out', 'long', 'attachment', 'attachment', 'The fire went out on your watch, and the house-elf has just told the caretaker that the fault was its own.', [
		['Take the evening it has bought you.', { attachment: -50, candour: -60, reckoning: -30, ambition: -25, precept: -30, temper: -25 }],
		['Go to the caretaker tonight and put your name back on it.', { attachment: 45, candour: 55, precept: 25 }],
		['Work its rota for a week without saying why.', { attachment: 30, candour: -45, precept: -25, defiance: -25 }],
		['Tell it never to lie for you again.', { attachment: 20, candour: 40, precept: -20, temper: 25 }]
	], 'He believed it.'),
	q('both-fall-on-the-saturday', 'long', 'attachment', 'attachment', 'The promise you gave in October was sworn on your name, and it falls due the same Saturday as the only trial you will get all year.', [
		['Keep it. The day was promised.', { attachment: 55, ambition: -60, precept: 25 }],
		['Ask to be let off it before the week starts.', { attachment: -20, candour: 50, precept: 35, defiance: -45 }],
		['Split the day and hope the oath counts it.', { attachment: 20, precept: -45, temper: 25, defiance: -30, candour: -40 }],
		['Break it, and pay whatever breaking costs.', { attachment: -50, defiance: 45, temper: 30 }]
	]),

	// ================================================================ AUTHORITY (defiance)
	q('two-years-off-being-allowed', 'short', 'defiance', 'authority', 'Somebody is shut in the tower and shouting, and the charm that takes a door off its hinges is two years further on than anything you are allowed.', [
		['Say it. Whatever it costs after, it costs after.', { defiance: 85, candour: 50, precept: -45 }],
		['Pick the lock with something off the floor.', { defiance: -60, precept: 40, temper: -25 }],
		['Talk him through kicking it out from his side.', { defiance: -25, candour: 45, attachment: -30, reckoning: -20, precept: -25, temper: -20 }],
		['Run and put a seventh-year in front of it.', { defiance: -85, ambition: -35, temper: -35 }]
	], 'He has stopped shouting. What now?'),
	q('no-office-above-her', 'short', 'defiance', 'authority', 'Your head of house is writing the report at her desk, and what goes in goes under her hand alone, with no office above her to strike it out.', [
		['Give her nothing, and let her write it from memory.', { defiance: 82, candour: -55, precept: -25 }],
		['Stop her, and hear the line before she signs it.', { defiance: 75, precept: 40, candour: 35 }],
		['Give her the facts and let her draw it where she draws it.', { defiance: -78, precept: 45, candour: 25 }],
		['Offer to put it right yourself if she leaves it out.', { defiance: -70, ambition: 45, candour: -35 }]
	], 'Your paragraph is next.'),
	q('nobody-has-asked-it-yet', 'medium', 'defiance', 'authority', 'The portrait on the landing gives names to anybody who asks, and nobody has asked it yet. The prefect wants the names from you tonight.', [
		['Give him them before he thinks of the portrait.', { defiance: -60, precept: 45, attachment: -35 }],
		['Warn the others first. Refuse him after.', { defiance: 55, attachment: 55, precept: -30 }],
		['Say nothing, and let the portrait do what it does.', { defiance: 65, precept: -20, temper: 20 }],
		['Send him to the portrait himself.', { defiance: 55, candour: 40, precept: -25 }]
	]),
	q('rather-not-be-the-one', 'long', 'defiance', 'authority', 'The groundskeeper was told to keep you on the grounds tonight, and he has said he would rather not be the one who does it.', [
		['Walk past him and go.', { defiance: 50, precept: -25, attachment: -35 }],
		['Ask what it costs him if you go anyway.', { defiance: -30, attachment: 55, candour: 45 }],
		['Over the wall, and leave him out of it.', { defiance: 45, attachment: 35, precept: -20 }],
		['Stay in. Do not make him choose.', { defiance: -50, attachment: 45, ambition: -30 }]
	], 'The gate is behind him.'),
	q('three-days-into-the-ban', 'long', 'defiance', 'authority', 'You are three days into a broom ban and the pitch is empty, except for the seventh-year who reported you, down at the far goal with her back turned.', [
		['Serve the ban out. Walk back up.', { defiance: -50, precept: 45, ambition: -25 }],
		['Fly. Let her turn round.', { defiance: 55, temper: 35, precept: -35 }],
		['Walk down and ask what she reported.', { defiance: 30, candour: 60, temper: 25 }],
		['Let her leave, then fly.', { defiance: 40, candour: -65, temper: -30 }]
	]),

	// ================================================================ RECKONING
	q('they-want-something-back', 'short', 'reckoning', 'reckoning', 'The two who covered for you last winter have come to find you before curfew, and they want something back.', [
		['Report yourself for last winter first, then hear them.', { reckoning: 85, precept: 50, candour: 35 }],
		['Name your price before you hear theirs.', { reckoning: 50, ambition: 45, candour: -35 }],
		['Do it, whatever it is. A debt is a debt.', { reckoning: -85, attachment: 40, candour: -45 }],
		['Tell them you remember, and nothing else.', { reckoning: 20, temper: 30, precept: -25 }]
	], 'They have not said what yet.'),
	q('everything-but-the-name', 'medium', 'reckoning', 'reckoning', 'The ghost saw who pushed the second-year down the stairs and has told the staff everything but the name. You were the only other one up there.', [
		['Give them the name.', { reckoning: 65, candour: 55, precept: 30 }],
		['Leave out the part that makes it worse for him.', { reckoning: -60, candour: -50, attachment: 35 }],
		['Tell them to ask the ghost for it.', { reckoning: 25, precept: 35, candour: -25, defiance: -30 }],
		['Hold it until he has had the chance to say it himself.', { reckoning: -45, defiance: -25, precept: -30, attachment: 40 }]
	], 'What do you tell them?'),
	q('took-the-wrong-surname', 'medium', 'reckoning', 'reckoning', "The punishment book gave your friend the detention for the broken window instead of the boy who threw the stone, and that boy wants your notes tonight.", [
		['Lend him the notes.', { reckoning: -65, attachment: 30, candour: -20 }],
		['Have him ask again with your friend in the room.', { reckoning: 55, candour: 50, temper: 25, precept: 25 }],
		['Turn him down and go back to your own work.', { reckoning: 65, attachment: -45, candour: -40 }],
		['Hand them to your friend and let him decide.', { reckoning: -60, attachment: 55, candour: -35 }]
	]),
	q('neither-sent-nor-dropped', 'long', 'reckoning', 'reckoning', "The letter about the magic you did over the holidays sits on your head of house's desk, and she has neither sent it on nor said she will not.", [
		['Take the silence and never raise it.', { reckoning: -40, precept: -30, ambition: 25 }],
		['Thank her for it, plainly, and leave it there.', { reckoning: -40, candour: 45, attachment: 30, temper: -30 }],
		['Ask her outright what she means to do with it.', { reckoning: 15, defiance: 30, precept: 35, temper: 25 }],
		['Do it again in the holidays. She has not said stop.', { reckoning: 45, defiance: 45, temper: 30 }]
	], 'Three weeks now.'),
	q('a-second-name-on-the-page', 'long', 'reckoning', 'reckoning', 'A house-elf in the kitchens is working off an oath nobody living remembers it swearing, and the professor releasing it needs a second name under hers.', [
		['Sign it. Let the work stop tonight.', { reckoning: -65, attachment: 40, precept: -20 }],
		['Read what the oath binds before your name goes near it.', { reckoning: 15, precept: 50, candour: -25, defiance: 20 }],
		['Ask the elf first whether it wants releasing.', { reckoning: -45, attachment: 60, candour: 50 }],
		['Leave the page unsigned and the oath standing.', { reckoning: 60, candour: -30, attachment: -35 }]
	], 'She is holding it out to you.'),

	// ================================================================ APPETITE (ambition)
	q('forty-people-behind-you', 'short', 'ambition', 'appetite', 'The clerk opens your file, reads a line that was not in it last term, and takes you out of the queue and up to the front.', [
		['Take it. Go up.', { ambition: 85, candour: -55, precept: -30 }],
		['Stop him and go back to the end.', { ambition: -80, defiance: 45, precept: 35 }],
		['Make him say what the new line gets you.', { ambition: 40, candour: 65, defiance: 35 }],
		['Bring the two behind you up as well.', { ambition: 55, attachment: 55, candour: -25 }]
	], 'Forty people behind you.'),
	q('the-word-you-got-at-eleven', 'medium', 'ambition', 'appetite', 'The careers form is filling its own second page from the word the sorting gave you at eleven, and the professor who keeps it has stepped out.', [
		['Change the entries while she is out.', { ambition: 65, precept: -40, candour: -25 }],
		['Tell her the word was wrong, and say what you want instead.', { ambition: 55, candour: 65, defiance: 35 }],
		['Have her leave it unsigned until next term.', { ambition: -45, precept: 25, temper: -30, defiance: 25 }],
		['Take your name off every list she keeps.', { ambition: -70, defiance: 55, attachment: -35 }]
	], 'You can watch it writing.'),
	q('every-time-the-surname-is-set', 'medium', 'ambition', 'appetite', "The prize entry goes in tomorrow, and the ministry file flags itself every time your father's surname is set in type.", [
		['Enter under the other name.', { ambition: 70, candour: -65, precept: -25 }],
		['Enter under your own and let it flag.', { ambition: 50, candour: 60, defiance: 45 }],
		['Pull the entry and send it where the file cannot reach.', { ambition: 55, defiance: 50, attachment: -25 }],
		['Read what the file says about him, and take that to the master.', { ambition: 25, candour: 45, precept: 35 }]
	], 'There is a second name you could use.'),
	q('the-book-takes-no-crossings-out', 'long', 'ambition', 'appetite', 'The captain has put a boy who has never flown into your position, and the team sheet takes no crossings-out once the quill has left it.', [
		['Ask him why, in front of the squad.', { ambition: 45, candour: 60, defiance: 40, temper: 30, precept: 20 }],
		['Out-fly the boy at the trial and let it be obvious.', { ambition: 55, precept: -20, temper: 25 }],
		['Play whatever position is left, and be good in it.', { ambition: -55, precept: 45, attachment: 25 }],
		['Get the boy to stand down.', { ambition: 50, attachment: -30, candour: -55 }]
	], 'The quill is still in his hand.'),
	q('whoever-is-still-working', 'long', 'ambition', 'appetite', 'The professor is taking two of you to the demonstration, and she will take whoever still has a cauldron going when she comes back.', [
		['Be there, still working, when she comes back.', { ambition: 50, precept: 40, attachment: -30 }],
		['Work, and keep your friend working beside you.', { ambition: 40, attachment: 60, candour: 25 }],
		['Go up to bed.', { ambition: -65, attachment: -30, temper: -30, precept: -25 }],
		['Tell the others she is not coming back at all.', { ambition: 55, candour: -70, reckoning: 30, precept: -40 }]
	], 'Six of you are left, and one is your friend.'),

	// ================================================================ TEMPER
	q('poured-over-a-week-of-work', 'short', 'temper', 'temper', 'A week of your work goes under a bottle of ink, poured across the parchment, and the boy who poured it stays where he is to watch.', [
		['Fire something off before you have decided to.', { temper: 90, precept: -50, ambition: -20, candour: -35 }],
		['Wand down. Start the week again.', { temper: -85, precept: 40, candour: -20, reckoning: -30 }],
		['Answer him with your mouth and nothing else.', { temper: 55, candour: 75, defiance: 20, reckoning: 30 }],
		['Leave the room while you still can.', { temper: -40, attachment: -30, defiance: -25, precept: -30 }]
	]),
	q('telling-them-it-was-your-call', 'medium', 'temper', 'temper', 'You lost on the last play, and the boy who came off his broom to lose it is in the changing room telling everyone it was your call.', [
		['Put it to him in front of all of them.', { temper: 70, candour: 65, defiance: 30 }],
		['Get changed and get out.', { temper: -70, candour: -50, attachment: -45 }],
		['Wait for the room to empty, then have it out.', { temper: -55, candour: 35, reckoning: 40 }],
		['Agree with him, loudly, and end it there.', { temper: 30, candour: -40, attachment: 35, reckoning: -45, precept: -25, defiance: -30 }]
	], 'The room is listening to him.'),
	q('in-your-own-voice', 'long', 'temper', 'temper', 'The punishment book is reading out at the staff table, in your own voice, exactly what you called the caretaker last night.', [
		['Own it to his face while it is still reading.', { temper: 40, candour: 55, attachment: -20, precept: 30 }],
		['Shut the book.', { temper: -35, defiance: 35, candour: -20 }],
		['Wait until he has gone, then ask what else it has.', { temper: -45, precept: 30, candour: -50, attachment: -40 }],
		['Say it again, louder, so no version but yours stands.', { temper: 55, candour: 50, defiance: 45 }]
	], 'He is four seats down.'),
	q('again-for-the-landing', 'long', 'temper', 'temper', 'On the staircase somebody says what your mother was, then says it again for the landing, and the jinx is already half out of your wand.', [
		['Finish it.', { temper: 55, candour: 30, precept: -35, reckoning: 35 }],
		['Pocket the wand and take the long way round.', { temper: -50, defiance: -40, precept: 25, reckoning: -30 }],
		['Put it into the banister instead, where they can watch.', { temper: 30, candour: -30, defiance: 40 }],
		['Stand there until they run out of things to say.', { temper: -35, precept: 25, attachment: -30 }]
	])
];

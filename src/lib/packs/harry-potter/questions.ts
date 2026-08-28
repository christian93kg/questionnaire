import type { Question } from '../../engine/types';

/**
 * Question bank — 34 units. short 10 ⊂ medium 20 ⊂ long 34.
 *
 * IMMERSION PASS 2026-08-28, REVISED THE SAME DAY after a four-batch `question-reviewer` read
 * rejected half of it. Both the pass and its correction are recorded here, because the pass's
 * central mistake is the kind that gets made again.
 *
 * WHAT THE PASS GOT WRONG, AND WHY IT IS WORTH THE SPACE:
 *
 * 1. IT RE-LITIGATED A DECISION THIS REPO HAD ALREADY MADE, AND LOST. The pass treated the
 *    `"[situation], and [complication]"` hinge running 28 of 34 stems as a monoculture and
 *    capped it at 12. But the five exemplars are 5/5 SINGLE-SENTENCE and 4/5 HINGE, and
 *    `quiz-question.card.md` → "Not ported from story-loop" records a rule against the hinge as
 *    *checked and rejected 2026-08-28*: "it refutes the exemplars, all five of which use it...
 *    The hinge is the house form." The exemplars outrank every prose rule in `_craft/`,
 *    including any budget an author invents mid-pass. Driving the bank to 8 hinge / 11
 *    single-sentence moved it AWAY from its own target voice, and replaced one dominant shape
 *    with another — `"[situation]. [sentence stating the world-rule]."` at ~24 of 34 — which no
 *    exemplar uses at all. **Before capping a shape, check whether the exemplars use it.**
 * 2. THE DEFECT WAS NEVER THE HINGE. IT WAS LEXICALISATION. What actually reads as one voice is
 *    repeated CLAUSE WORDING, and the pass regenerated exactly the failure the pack's
 *    `## authoring-notes` recorded against the previous rewrite: `name-in-the-register` resolved
 *    on "what the ministry reads before it hires you" and `no-office-above-her` on "the book the
 *    ministry checks before it hires anyone", and one placement construction solved four units
 *    ("at eleven" ×2, "your first night here", "in first year"). Count phrases, not commas.
 * 3. "SAY NOTHING" WENT FROM 6 UNITS TO 0 AS A STRING AND SURVIVED AS A MOVE. Four units offered
 *    the same minimal-compliance slot under different words — "Answer only what you are made to
 *    answer" / "Answer what is asked and stop" / "Answer what she asks and stop there" / "Wait to
 *    be asked, and answer only that". `opener-repeat` reads the first two words and cannot see
 *    it. Now capped at two.
 * 4. APPETITE WAS DECLARED FIXED AND WAS NOT. The pass added self-acting objects to four
 *    costumed units and left the dilemmas intact: a legacy waiting list, school streaming,
 *    pre-publication censorship, a blacklist and a pen name. An object that ACTS on its own does
 *    not make a unit diegetic — the object has to GENERATE the choice. A human censor produces
 *    the same dilemma as a self-flagging file. All four are rebuilt on rules with no real-world
 *    equivalent: a file that grows a line it did not have, a form that fills its own second page,
 *    plates that harden against correction, a roll that will not take a second name.
 * 5. IT CREATED A DUPLICATE PAIR. Recasting `ink-across-the-parchment` onto the sorted-at-eleven
 *    pressure collided it with `half-out-of-your-wand`: same trigger (somebody names your label),
 *    same handback (wand already in motion), same four options in the same order. Split back —
 *    the ink unit now turns on the trace the retaliation would leave, not on the insult.
 *
 * ROLE-PREEMPTION IN PARAPHRASE — the class of defect the linter structurally cannot catch.
 * `role-preemption` is a list of LITERAL phrases, so it never fired on four stems that granted
 * the taker exactly what those phrases forbid: "the thing your family owns" and "three
 * generations of your family have been served" (a house that owns bound servants), a word that
 * "waves you past the queue" (the favoured side), and "your column" with an editor (a
 * profession). Each collapses the 47-name roster the way "your house" would. Two predated this
 * pass and survived two rewrites unnoticed. All four are gone: the bound things now answer to
 * the school and the gate, the advantage is a line in a file rather than an identity, and the
 * byline is a prize entry.
 *
 * WHAT SURVIVED THE REVIEW UNCHALLENGED, and is kept: `record`/`register` down from 16
 * occurrences in stems to a handful; the four cost-free options repriced; world-pressures spread
 * 4–5 across all eight rather than 6 of 8 over ceiling; and the three DISCLOSURE enactments —
 * the ledger that opens itself and reads a person, the post bag that knows which surnames it
 * holds, the quill that writes everything said in front of it.
 *
 * THE SHAPE, RESTATED CORRECTLY: the single-sentence hinge is the house form, per the exemplars.
 * Variety comes from INSIDE the sentence — a serial build, a semicolon, a non-hinge single
 * sentence (exemplar 4's shape), a short second beat when it earns one — and from the units
 * differing in substance. It does not come from splitting every stem in two.
 *
 * FROZEN, and the reason each is frozen:
 *
 * 1. EVERY OPTION VECTOR IS BYTE-IDENTICAL to the pre-pass bank. `calibration.json` is produced
 *    by simulating respondents over these vectors (`scripts/calibrate.ts`); changing one
 *    silently invalidates it and moves everybody's result. Both passes are text only.
 * 2. OPTION ORDER WITHIN A UNIT IS UNCHANGED. `q()` assigns ids positionally ('abcd'[i]) and
 *    share links encode the answer INDEX, so a reorder would remap every link in the wild to a
 *    different answer — and `questionSetHash` (src/lib/engine/share.ts) would not catch it,
 *    because it hashes ids and never text or order-of-meaning.
 * 3. IDS AND COUNT ARE UNCHANGED (34, same ids). Changing either does move the hash and does
 *    invalidate every share link. Several ids now describe a stem that has moved on —
 *    `name-in-the-register`, `checked-against-the-register`, `what-the-sorting-decided`. Ids are
 *    never rendered; renaming them would cost every live link to buy nothing.
 *
 * Also unchanged: array order is grouped by `section`, contiguously (`sectionsForTier()` throws
 * otherwise); median amplitude falls from short to long; and no `sig` hints.
 *
 * No unit names a house, a named character, or any DENY-tier noun, and none grants the taker a
 * house, a bloodline, a side, a possession or a rare power — in literal phrasing or paraphrase.
 */

/** Terse builder. Option ids are positional a|b|c|d, so options never carry their own ids. */
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
	// ================================================================ METHOD (precept)
	q('name-in-the-register', 'short', 'precept', 'method', 'The cauldron went over on your watch, and the first-year is still holding the ladle while the book waits open on the bench.', [
		['Write it up with your name at the top.', { precept: 85, candour: 35, temper: -20 }],
		['Shut the door on it. Nothing goes in the book.', { precept: -85, defiance: 55, ambition: -15 }],
		['Log the cauldron. Leave the name off.', { precept: 25, candour: -55, defiance: 20 }],
		['Walk the first-year down to the caretaker yourself.', { precept: -20, attachment: 45, candour: 30, defiance: -35 }]
	]),
	q('nobody-of-age', 'short', 'precept', 'method', 'The banister has just undone the repair you made this morning, mending itself back to instructions your dead grandmother left on it.', [
		['Stand clear until it has finished.', { precept: 85, defiance: -45, attachment: -20 }],
		['Work alongside it and mend what it will not touch.', { precept: -50, attachment: 55, candour: -20 }],
		['Fetch somebody old enough for it to obey.', { precept: 75, defiance: -30, ambition: -25 }],
		['Take it apart again tonight, once it has gone.', { precept: -80, candour: -55, temper: 30 }]
	]),
	q('the-curfew-charm', 'medium', 'precept', 'method', 'Nobody has shown you how to set the curfew charm, and the portrait by the gate has watched it done right for two hundred years.', [
		['Ask the portrait to talk you through it.', { precept: 65, candour: -20, ambition: -10, defiance: -35 }],
		['Guess at it, and set it anyway.', { precept: -60, temper: 25, ambition: 15 }],
		['Do what you did last time.', { precept: -30, candour: -15, ambition: -20 }],
		['Leave it unset, and say so at breakfast.', { precept: 40, candour: 40, ambition: -35 }]
	]),
	q('the-only-slot', 'long', 'precept', 'method', 'You swore to try the spell only under supervision, your last supervised hour went this morning, and the attempt is Thursday.', [
		['Sit it cold.', { precept: 50, ambition: -30, temper: -20 }],
		["Trade for an hour booked in somebody else's name.", { precept: 35, attachment: 35, candour: -25 }],
		['Try it unsupervised and let the oath do what it does.', { precept: -50, defiance: 45, temper: 25 }],
		['Withdraw from the attempt, and give them the reason.', { precept: 30, candour: 55, defiance: -25 }]
	]),
	q('wont-turn-the-key', 'long', 'precept', 'method', 'Smoke, two rows into the greenhouse, and the oath you gave on that lock will not let your hand turn the key.', [
		['Break the oath and take the door.', { precept: -50, temper: 40, defiance: 25 }],
		['Send the nearest first-year running for the groundskeeper.', { precept: 50, attachment: -30, ambition: -20, defiance: -40 }],
		['Work the lock by hand instead.', { precept: -35, temper: -30, ambition: -25 }],
		['Take everyone out the back way and leave it shut.', { precept: 35, attachment: 45, defiance: -25 }]
	]),

	// ================================================================ DISCLOSURE (candour)
	q('ledger-before-service', 'short', 'candour', 'disclosure', "The shop's ledger opens itself at your friend's name, reads him, and closes; the apothecary starts on the queue behind him.", [
		['Put it to the apothecary now, with the queue listening.', { candour: 85, temper: 45, defiance: 30, reckoning: 35 }],
		['Buy what you came for and get out.', { candour: -85, attachment: -30, reckoning: -20 }],
		['Tell them: him first, or nobody.', { candour: 75, precept: 20, attachment: 40 }],
		['Leave. Both of you, without giving them the row.', { candour: -70, attachment: 55, defiance: 35, reckoning: -30 }]
	]),
	q('post-by-surname', 'medium', 'candour', 'disclosure', "Your friend's exam pass is in the post bag with the letters the office holds a day, and the bag knows which surnames those are.", [
		['Make the clerk turn the bag out in front of you.', { candour: 65, defiance: 35, temper: 20 }],
		['Get your friend in another way and explain afterwards.', { candour: -55, attachment: 50, precept: -25 }],
		['Take it to a prefect and name what the bag is doing.', { candour: 60, precept: 40, attachment: 20, defiance: -35 }],
		["Wait for nine o'clock. Tell him when it is over.", { candour: -65, attachment: -30, reckoning: -20 }]
	]),
	q('on-the-record', 'medium', 'candour', 'disclosure', 'The headmaster wants it in your own words, with a quill on the desk that writes down everything said in front of it.', [
		['Give it exactly as it happened.', { candour: 68, precept: 45, defiance: -35, ambition: -20 }],
		['Give a version you can live with being read back.', { candour: -55, precept: 20, defiance: 20, temper: -25 }],
		['Refuse the quill. Say it to him with nothing writing.', { candour: -68, defiance: 45, precept: -40, temper: 30 }],
		['Keep it thin for the quill. Tell a friend the rest.', { candour: 52, attachment: 45, precept: -35, defiance: 25 }]
	]),
	q('printed-by-dawn', 'long', 'candour', 'disclosure', "You watched it from the gallery, and the ministry's account is already setting itself in type for the morning.", [
		['Write down what happened and get it out before dawn.', { candour: 52, defiance: 35, precept: -25, ambition: 20 }],
		['Wait to be asked, and answer only that.', { candour: -32, defiance: -40, precept: 30, reckoning: -20 }],
		['Send it to somebody who is not a newspaper.', { candour: 30, attachment: 45, precept: -20, defiance: 20 }],
		['Let the printed version stand.', { candour: -55, reckoning: -35, ambition: -45, attachment: -20 }]
	]),
	q('portrait-was-asked', 'long', 'candour', 'disclosure', 'The portrait outside the library has watched you take the same corridor every night this term, and this morning somebody asked it where you go.', [
		['Change where you go, starting tonight.', { candour: -35, precept: -30, defiance: 25, temper: -20 }],
		['Go to them and say where you have been going.', { candour: 50, precept: 45, defiance: -35, attachment: 20 }],
		['Admit you were out. Leave the where alone.', { candour: -42, precept: 20, defiance: -20, ambition: -20 }],
		['Let the portrait answer, and confirm only that.', { candour: 32, precept: -20, defiance: -45, reckoning: -20 }]
	]),

	// ================================================================ ATTACHMENT
	q('sworn-to-skip', 'short', 'attachment', 'attachment', 'They have their hand out for the sworn kind and not the said kind, and only one of those takes something out of you.', [
		['Swear it. Binding, on your name.', { attachment: 85, precept: -40, ambition: -45 }],
		['Say you will. Leave it unsworn.', { attachment: 50, candour: 40, precept: 20 }],
		['Sit in the hearing, and refuse to swear anything.', { attachment: -40, candour: 60, precept: 35 }],
		['Swear nothing. Go nowhere.', { attachment: -75, candour: -55, temper: -30 }]
	]),
	q('moved-for-mending', 'short', 'attachment', 'attachment', 'The one who cleans your dormitory takes no wage, would refuse one, and is being moved to the kitchens for mending your things unasked.', [
		['Speak for it, by name, at the staff table.', { attachment: 85, candour: 55, defiance: 35, reckoning: 30 }],
		['Do its rota yourself tonight, in its place.', { attachment: 60, precept: -30, ambition: -40 }],
		['Say you asked it to.', { attachment: 25, candour: -25, precept: 20 }],
		['Put in for a replacement and move on.', { attachment: -80, candour: -50, temper: -30, reckoning: -30 }]
	]),
	q('off-the-registry', 'medium', 'attachment', 'attachment', "The ministry prints the courts' lists now with no hearing between the two, and your closest friend is on tomorrow's.", [
		['Get to your friend before the morning edition.', { attachment: 65, defiance: 35, candour: 25 }],
		['Stay in, and let it print.', { attachment: -60, temper: -25, precept: 30 }],
		['Get a different account to the print office first.', { attachment: 55, candour: 50, defiance: 40 }],
		['Deny you know your friend at all.', { attachment: -65, candour: -40, reckoning: -20 }]
	]),
	q('oath-against-the-week', 'long', 'attachment', 'attachment', 'The promise you made in October was sworn and not said, and it falls due in the same week as the one thing you wanted.', [
		['Honour it.', { attachment: 55, ambition: -50, precept: 20 }],
		['Ask to be released from it before the week starts.', { attachment: -20, candour: 45, precept: 35, defiance: -30 }],
		['Split the week between them and see whether the oath can count.', { attachment: 20, precept: -45, temper: 25 }],
		['Break it. Pay whatever breaking it costs.', { attachment: -50, defiance: 40, temper: 30 }]
	]),
	q('told-it-was-them', 'long', 'attachment', 'attachment', 'Whatever keeps the common-room fire lit has told the caretaker it let the fire out, not you, and it was you.', [
		['Take the evening you have just been given.', { attachment: -50, candour: -45, reckoning: -20 }],
		['Put your name back on it, to the caretaker, tonight.', { attachment: 45, candour: 55, precept: 20 }],
		['Work its shift for a week without telling it why.', { attachment: 10, candour: -30, precept: -25 }],
		['Tell it never to lie for you again.', { attachment: 30, candour: 40, precept: -20 }]
	]),

	// ================================================================ AUTHORITY (defiance)
	q('two-years-off', 'short', 'defiance', 'authority', 'Somebody is shut inside the tower, and the charm that opens it fast is two years off being legal for you to say.', [
		['Say it, and let the trace land where it lands.', { defiance: 85, candour: 55, precept: -40 }],
		['Pick the lock instead.', { defiance: -70, precept: 45, temper: -25 }],
		['Talk them through kicking it out from inside.', { defiance: -25, candour: 40, attachment: -35 }],
		['Run for a seventh-year and hand it over.', { defiance: -85, ambition: -30, temper: -35 }]
	]),
	q('no-office-above-her', 'short', 'defiance', 'authority', 'Whatever your head of house writes tonight goes in under her hand alone, and there is no office above her to strike it out.', [
		['Give her nothing, and let her write it from memory.', { defiance: 82, candour: -55, precept: -25 }],
		['Stop her, and hear the line before she signs it.', { defiance: 75, precept: 40, candour: 30 }],
		['Give her the facts and let her draw the line.', { defiance: -78, precept: 45, candour: 25 }],
		['Offer to put it right yourself if she holds the line for now.', { defiance: -72, ambition: 40, candour: -35 }]
	]),
	q('the-portrait-on-the-landing', 'medium', 'defiance', 'authority', 'The portrait on the landing gives the names to anybody who asks and nobody has asked, and your head of house wants them from you tonight.', [
		['Give him the names before he thinks of the portrait.', { defiance: -60, precept: 45, attachment: -30 }],
		['Warn the portrait first. Refuse him after.', { defiance: 55, attachment: 50, precept: -30 }],
		['Hold your silence and let the portrait do what it does.', { defiance: 65, precept: -20, temper: 20 }],
		['Send him to the portrait himself.', { defiance: 55, candour: 40, precept: -25 }]
	]),
	q('whose-order-wins', 'long', 'defiance', 'authority', 'Whatever keeps the gate was told to hold you here tonight, and a word from you undoes the order it was given.', [
		['Order it aside, and go.', { defiance: 50, precept: -20, attachment: -15 }],
		['Find out what it costs the thing to be made to choose.', { defiance: -30, attachment: 55, candour: 40 }],
		['Go out the window. Leave it out of this.', { defiance: 40, attachment: 35, precept: -15 }],
		['Stay in. Do not make it choose.', { defiance: -45, attachment: 45, ambition: -30 }]
	]),
	q('wards-on-the-pitch', 'long', 'defiance', 'authority', 'The pitch wards logged somebody flying alone three days into your suspension, and the wards log the wand and not the hand.', [
		['Sit it out. Serve the rest.', { defiance: -50, precept: 40, ambition: -25 }],
		['Fly anyway, and let the wards log it twice.', { defiance: 50, temper: 30, precept: -35 }],
		['Have them show you exactly what the wards took.', { defiance: 30, candour: 40, precept: 20 }],
		['File that the wards logged the wrong flyer.', { defiance: 35, precept: 45, candour: -20 }]
	]),

	// ================================================================ RECKONING
	q('never-on-the-record', 'short', 'reckoning', 'reckoning', 'Tonight the two who know that nobody ever acted on your October trace want something from you before curfew.', [
		['Report yourself for last year first, then hear them out.', { reckoning: 85, precept: 50, candour: 30 }],
		['Name your price before you answer.', { reckoning: 50, ambition: 45, candour: -35 }],
		['Do it, and let last year go for good.', { reckoning: -85, attachment: 40, candour: -30 }],
		['Tell them you remember. Nothing else.', { reckoning: 15, temper: 30, precept: -25 }]
	]),
	q('the-ghost-on-the-staircase', 'medium', 'reckoning', 'reckoning', 'The ghost has told it the only way it can tell anything, and you are being asked whether to add the part it left out.', [
		['Give it to them straight.', { reckoning: 65, candour: 50, precept: 30 }],
		['Leave out the part that makes it worse.', { reckoning: -60, candour: -55, attachment: 30 }],
		['Answer what is asked and stop.', { reckoning: 20, precept: 40, candour: -20, defiance: -35 }],
		['Hold it until the other one can speak for themselves.', { reckoning: -45, defiance: 35, precept: -30 }]
	]),
	q('surname-that-blamed-him', 'medium', 'reckoning', 'reckoning', "The boy whose surname the book should have taken, instead of your friend's, wants to borrow your notes tonight.", [
		['Lend him the notes.', { reckoning: -55, attachment: 30, candour: -20 }],
		['Make him ask again with your friend in the room.', { reckoning: 55, candour: 50, temper: 20 }],
		['Turn him down and go back to your own work.', { reckoning: 65, attachment: -35, candour: -30 }],
		['Hand them to your friend and let him decide.', { reckoning: -50, attachment: 55, candour: -35 }]
	]),
	q('the-trace-that-went-unacted', 'long', 'reckoning', 'reckoning', 'She has the trace from the holidays on her desk, has not sent it on, and has not said she will not.', [
		['Take the silence and never raise it.', { reckoning: -40, precept: -30, ambition: 25 }],
		['Go back and thank her for it, plainly.', { reckoning: -25, candour: 45, attachment: 30 }],
		['Ask her outright what she means to do with it.', { reckoning: 15, defiance: -25, precept: 35 }],
		['Do it again over the holidays. She has not said stop.', { reckoning: 45, defiance: 40, temper: 30 }]
	]),
	q('wont-take-your-word', 'long', 'reckoning', 'reckoning', 'The one who serves the kitchens is working off an oath nobody alive remembers swearing, and the release needs a name on it tonight.', [
		['Sign it, and let the work stop today.', { reckoning: -45, attachment: 30, precept: -20 }],
		['Read what the oath actually binds before you sign.', { reckoning: -30, precept: 40, candour: -20, defiance: -35 }],
		['Get one more season of work out of it first.', { reckoning: 50, temper: 25, ambition: 20 }],
		['Leave the page unsigned and the oath standing.', { reckoning: 55, candour: -30, attachment: -25 }]
	]),

	// ================================================================ APPETITE (ambition)
	q('checked-against-the-register', 'short', 'ambition', 'appetite', 'The clerk opens your file, reads a line that was not in it last term, and waves you past the queue.', [
		['Walk past them. Take the short way.', { ambition: 85, candour: -55, precept: -30 }],
		['Stop him, and go back to the end of the queue.', { ambition: -80, defiance: 40, precept: 35 }],
		['Make him say what the new line gets you.', { ambition: 40, candour: 65, defiance: 30 }],
		['Take somebody else through with you.', { ambition: 55, attachment: 50, candour: -25 }]
	]),
	q('what-the-sorting-decided', 'medium', 'ambition', 'appetite', 'The careers form is filling its own second page from the word you were given at eleven, and you are watching it write.', [
		['Change the entries while she is out of the room.', { ambition: 65, precept: -35, candour: -20 }],
		['Say the word was wrong about you, and say what you want instead.', { ambition: 55, candour: 65, defiance: 30 }],
		['Have her leave it unsigned until next term.', { ambition: -35, precept: 20, temper: -30 }],
		['Take your name off every list she keeps.', { ambition: -70, defiance: 55, attachment: -20 }]
	]),
	q('flagged-in-the-file', 'medium', 'ambition', 'appetite', "The old inquiry file flags itself whenever your father's surname is set in type, so the prize entry goes up under another name or not at all.", [
		['Let it go up under the other name.', { ambition: 70, candour: -65, precept: -25 }],
		['Hold out for your own name on it.', { ambition: 50, candour: 60, defiance: 45 }],
		['Pull the entry, and put it where the file cannot reach.', { ambition: 55, defiance: 50, attachment: -25 }],
		['Read what the file says about him, and take that to the master.', { ambition: -30, candour: 40, precept: 30 }]
	]),
	q('the-plates-before-dawn', 'long', 'ambition', 'appetite', 'The plates are setting themselves for dawn with another name where yours should be, and they will not take a correction once set.', [
		['Put your claim in before they set, and owe whoever holds them.', { ambition: 50, candour: 40, precept: -20 }],
		['Keep your working and let the plates go.', { ambition: -35, precept: 45, candour: -25 }],
		['Get the credited one to ask for the correction instead.', { ambition: 40, attachment: 30, candour: -30 }],
		['Go over the print office with your name on the complaint.', { ambition: 45, defiance: 45, candour: 50 }]
	]),
	q('already-down-for-it', 'long', 'ambition', 'appetite', 'The seat that came free this morning goes to a name already on the roll, and the roll will not take a second.', [
		['Ask outright whose name is on the roll.', { ambition: 45, candour: 55, defiance: 20 }],
		['Find whoever held it last and have them put you forward.', { ambition: 40, attachment: 35, candour: -20 }],
		['Hold off until the roll is read, and take whatever is left.', { ambition: -30, precept: 20, temper: -25 }],
		['Let it go to the name already written.', { ambition: -50, precept: 40, defiance: -35 }]
	]),

	// ================================================================ TEMPER
	q('ink-across-the-parchment', 'short', 'temper', 'temper', 'A week of work goes under the ink on purpose, and the wand in your hand will leave a trace on whatever you do next.', [
		['Fire it off before you have decided to.', { temper: 90, precept: -50, ambition: -20 }],
		['Wand away. Start the week again.', { temper: -85, precept: 40, candour: -20, reckoning: -30 }],
		['Answer it with your mouth, wand down.', { temper: 55, candour: 75, defiance: 20, reckoning: 30 }],
		['Leave the room before the wand does anything.', { temper: -40, attachment: -30, defiance: -25 }]
	]),
	q('reaching-for-the-fire', 'medium', 'temper', 'temper', 'Your plate is taken away and goes down your sleeve, and whatever dropped it is at the grate with its hand out.', [
		['Catch its wrist before the grate does.', { temper: -60, attachment: 55, precept: -20, reckoning: -40 }],
		['Snap at it, and let it go through with the grate.', { temper: 70, attachment: -55, reckoning: 20 }],
		['Order it away from the fire. Now.', { temper: -55, precept: 35, attachment: 20, reckoning: -30 }],
		['Walk out and leave it to decide for itself.', { temper: -65, attachment: -50, precept: -20 }]
	]),
	q('word-for-word', 'long', 'temper', 'temper', 'The punishment book is reading out, at the staff table, what you called the caretaker last night in your own voice.', [
		['Own it, to his face, while it is still being read.', { temper: 40, candour: 55, attachment: -20 }],
		['Shut the book.', { temper: -35, defiance: 30, candour: -20 }],
		['Wait until he has gone, then ask what else it has.', { temper: -45, precept: 30, candour: -35, attachment: -35 }],
		['Say it again, louder, so no version but yours stands.', { temper: 55, candour: 50, defiance: 45 }]
	]),
	q('half-out-of-your-wand', 'long', 'temper', 'temper', 'On the staircase somebody says what your family is, louder this time for the landing, and the jinx that ends it is half out of your wand.', [
		['Finish it. Deal with the trace after.', { temper: 55, candour: 30, precept: -35, reckoning: 30 }],
		['Pocket the wand and take the long way round.', { temper: -50, defiance: -30, precept: 20, reckoning: -30 }],
		['Put it into the banister instead, where they can watch.', { temper: 30, candour: 20, defiance: 35 }],
		['Stand there until they run out of things to say.', { temper: -35, precept: 25, attachment: -20 }]
	]),
];

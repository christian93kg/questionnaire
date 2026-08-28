---
pack: harry-potter
---

# World vocabulary — harry-potter

Format contract: `_craft/packs/_FORMAT.md`. Tiers are matched case-insensitively.

The setting is a boarding school that is also a jurisdiction, inside a small, captured
state. That is the register to write in — staff, records, terms, post, punishment — not
spellwork. The rule of thumb this pack is built on: **the Sorting Hat's own questions are
mostly world-neutral, and the magic is in the wrapper.** A question that needs the reader
to know what a named object *is* has already failed.

## aliases

One per line, unquoted — `craft-gate.sh` matches a whole line as one alias.

```
harry potter
hogwarts
wizarding
```

## allow

Unlimited. Ordinary vocabulary a once-through reader has; no rule fires on any of it.

```
owl quill parchment wand spell potion cauldron charm hex jinx broom
"common room" dormitory corridor staircase greenhouse castle grounds
detention prefect headmaster "head of house" caretaker groundskeeper
portrait ghost cloak trunk lantern "the ministry" "house points" magic
term "the holidays" "notice board" "the post" curfew library
```

## warn

Advisory, max one per question. Each should survive being deleted from the sentence — if
the dilemma needs it to parse, it has drifted into referential territory.

```
muggle squib goblin "house-elf" auror azkaban dementor quidditch
hippogriff floo "the daily prophet" "death eater" "the sorting"
```

## deny

Hard fail. Trivia-only — a reader needs the books to know what it means — or it collapses
the roster the way a role grant does.

Three rulings that look wrong and are not. Recorded so nobody "fixes" them later:

- **The four house names are DENY, not ALLOW.** They read like core vocabulary, and they
  are — as *results*. In a question they compare affinity with the source material instead
  of behaviour: the taker picks the house they already believe they are, and the axis
  measures self-image. This is the same ruling that puts `grogu` on the star-wars DENY list
  — results may name a thing, questions may not. The roster carries the house in
  `Character.region`, which is where it belongs.
- **`patronus` and `boggart` are DENY even though they are famous.** Both are personality
  tests already, built into the fiction. A question about either is not a question, it is
  the answer key with a costume on.
- **Named characters are DENY as question nouns**, all of them, including the ones on the
  roster. A question built around a named character is referential by construction: delete
  the name and the dilemma collapses.

```
gryffindor slytherin ravenclaw hufflepuff horcrux "deathly hallows"
"elder wand" "resurrection stone" parseltongue parselmouth animagus
occlumency legilimency pensieve "room of requirement" "marauder's map"
thestral patronus boggart "unforgivable curse" "avada kedavra"
"expecto patronum" crucio imperius "priori incantatem" polyjuice
"felix felicis" "time-turner" sectumsempra basilisk triwizard
"goblet of fire" "philosopher's stone" "sorcerer's stone"
"chamber of secrets" "half-blood prince" "order of the phoenix"
dumbledore voldemort snape hagrid mcgonagall bellatrix umbridge
hermione ron harry neville luna draco sirius lupin
```

## register

Words that carry the world without being proper nouns at all — what a school, a punishment
book or a wartime ministry would say in any setting, but that land unmistakably here.

```
"of age" "on the record" "sworn" "the register" "your name is down"
"a letter from the ministry" "before the holidays" "after curfew"
"the staff table" "read out"
```

## role-preemption

Literal phrases, one per line. Second person is a situation, never a role, never a house,
never a bloodline, never a power. "You" is a student a long way from home with somewhere to
be — true of every character on the roster, contradictory of none. Grant the taker a house
and Luna and Neville stop being coherent results; grant a rare power and most of the roster
does.

```
your house
your patronus
your bloodline
you speak to snakes
you're pure-blood
you are pure-blood
you're muggle-born
you are muggle-born
you sense
you feel the magic
```

## world-pressures

Every question should trace to one. They are the load-bearing facts of the setting —
deliver them through the situation, not through a name.


- a school is also a jurisdiction, and what staff decide goes on a record that leaves with you
- blood decides how a room treats you before you speak
- portraits and ghosts remember, and repeat it to whoever asks
- punishment is collective: what you do is charged to the people you sleep beside, and they know whose fault it was
- a promise can be made binding, and breaking it takes something out of you
- you were sorted at eleven, and the label followed you
- a government can be captured quietly, and the newspaper goes first
- the ones who serve you are owned, and how you treat one is characterising

**The Trace is not on this list, and was, until 2026-08-28.** *"Magic leaves a trace: underage
use is detectable, and someone is counting"* generated five units and **three of them fired
inside the castle, where the Trace does not apply** — the Ministry does not monitor spellwork
at school, which is the whole reason term is where underage wizards get to practise. It is
still usable, but only where it is true: the holidays, and off the grounds. Two units keep it
on those terms. It is not a pressure the bank may reach for by default, because seven of every
ten times an author reaches for it, the scene is set at school.

Its replacement is the points-and-detention pressure above, and that one is genuinely
school-native: it is the only pressure on the list where the cost of your choice lands on
people who did not make it, in a room you cannot leave for another seven years.

## authoring-notes

Not injected by the gate — read when starting a bank.

**Ration the first one.** In the 2026-08-28 rewrite the record/jurisdiction pressure ended
up generating 7 of 34 units, and its phrasing lexicalised — four stems resolved on
near-identical "gets permanently logged" wording. It is the easiest of the eight to write,
which is exactly why it needs a cap. Note that none of the five exemplars uses it: authors
reached for it anyway.

**The cap is floor 3, ceiling 5 — not "no more than three."** It read "no more than three"
until the immersion pass later the same day, and that number is arithmetically unreachable:
34 units over 8 pressures floors at 4.25, so a 3-cap maxes out at 24 and cannot be met by any
bank of this size. It was not argued with, it was ignored — six of the eight pressures ran
over it, one (`sorted at eleven`) generated a single unit, and the bank read as a
civil-service drama. **A rule that cannot be satisfied is not a strict rule, it is a dead
one**, and this is the second time that shape of failure has cost a rewrite here: the
`skinned-question` advisory was cheaply satisfiable and got satisfied cheaply, which is what
made a whole bank costumed. State caps you can actually hit, and scale them to the bank size.

**Watch the phrasing, not the punctuation.** The tics that regrow under a clean linter are
repeated CLAUSE WORDING, and they are always set-level: read the whole bank's stems as one
block, and the whole bank's options as another, before shipping. That read is the
`question-reviewer` agent's lens 1, and it is the only check that catches any of this.
Three that got through a 0-FAIL lint:

- `"Say nothing"` in 6 of 34 options — `opener-repeat` reads the first TWO WORDS, so
  `"Buy what you came for. Say nothing."` is invisible to it. Rewriting the string is not
  enough either: the next pass cut it to zero and the MOVE survived in four units as
  "Answer only what you are made to" / "Answer what is asked and stop" / "Answer what she
  asks and stop there". Count the move, not the words.
- Two stems resolving on `"the ministry reads before it hires you"` and `"the book the
  ministry checks before it hires anyone"` — the same convergence recorded above for the
  record/jurisdiction pressure, regenerated by the pass that was fixing it.
- One construction solving four units: `at eleven` ×2, `your first night here`, `in first
  year`. Raising a pressure's unit count does not help if all the new units are the same
  sentence.

**Do NOT cap the `", and"` hinge. It is the house form.** An immersion pass on 2026-08-28
read 28-of-34 hinge stems as a monoculture and capped it at 12 — but the five exemplars are
**5/5 single-sentence and 4/5 hinge**, and `quiz-question.card.md` → "Not ported from
story-loop" already records a hinge rule as *checked and rejected* on the same grounds. The
cap drove the bank to 24% hinge and to a `"[situation]. [world-rule]."` shape at ~24 of 34
that **no exemplar uses**, then had to be reverted. Before capping any shape, check whether
the exemplars use it; if they do, the shape is not the defect and the repeated wording
inside it is. Variety belongs inside the sentence — a serial build, a semicolon, a non-hinge
single sentence (exemplar 4), a short second beat that earns itself.

**An object that acts on its own is not automatically diegetic.** The same pass "fixed" four
costumed APPETITE units by adding a self-flagging file, a self-writing form and self-setting
plates on top of unchanged real-world dilemmas — a legacy waiting list, school streaming,
pre-publication censorship, a blacklist and a pen name. A human censor produces the identical
choice, so the substitution test still passed clean on all four. The object has to GENERATE
the dilemma, not deliver it: a roll that will not accept a second name, plates that harden
against correction, a ward that logs the wand and not the hand.

**`role-preemption` is a literal-phrase list, so paraphrase walks straight past it.** Four
stems granted the taker exactly what that section forbids and never fired a rule: `the thing
your family owns` and `three generations of your family have been served` (a house that owns
bound servants), a word that `waves you past the queue` (the favoured side), and `your column`
with an editor (a profession). Two survived two rewrites. When reviewing, ask what the stem
assumes the taker HAS — not whether it uses a banned string.

**Count the SETTINGS, not just the pressures.** The 2026-08-28 bank spread its pressures 4–5
across all eight and still read as one thing, because pressure variety and scene variety are
different axes and only the first was being measured. Every unit was a document: a book, a
file, a form, a register, a roll, a set of printing plates, a post bag, a ledger, a punishment
book. The register is where a dilemma is easiest to generate, so an author under a pressure cap
will satisfy the cap and still write thirty-four office scenes. **Cap it directly: ≤12 of 34 on
paperwork.** The rest go where the school actually is — a classroom mid-lesson, a corridor
after curfew, a greenhouse, the pitch, the lake, the forest edge, the Great Hall at dinner, the
hospital wing, a staircase, the grounds in bad weather. This is the same failure shape as the
`skinned-question` and three-cap entries above: a rule that measures the wrong quantity gets
satisfied without fixing anything.

**And the pressure has to be ENACTED, not implied.** The same review found the difference
sharply: *"The one who clears your plate comes straight after the exam goes wrong, and
flinches before you have said anything"* fails, because a nervous employee is all the text
shows and the reader supplies the bondage from outside; exemplar 4 works because the elf
shut its own hand in the grate on the page. Test: what does the TEXT show happening that
could not happen anywhere else? "Nothing, but readers of the books will know" is a fail.

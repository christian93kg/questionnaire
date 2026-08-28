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
- magic leaves a trace: underage use is detectable, and someone is counting
- a promise can be made binding, and breaking it takes something out of you
- you were sorted at eleven, and the label followed you
- a government can be captured quietly, and the newspaper goes first
- the ones who serve you are owned, and how you treat one is characterising

## authoring-notes

Not injected by the gate — read when starting a bank.

**Ration the first one.** In the 2026-08-28 rewrite the record/jurisdiction pressure ended
up generating 7 of 34 units, and its phrasing lexicalised — four stems resolved on
near-identical "gets permanently logged" wording. It is the easiest of the eight to write,
which is exactly why it needs a cap. Note that none of the five exemplars uses it: authors
reached for it anyway. Aim for no more than three units on any single pressure.

**And the pressure has to be ENACTED, not implied.** The same review found the difference
sharply: *"The one who clears your plate comes straight after the exam goes wrong, and
flinches before you have said anything"* fails, because a nervous employee is all the text
shows and the reader supplies the bondage from outside; exemplar 4 works because the elf
shut its own hand in the grate on the page. Test: what does the TEXT show happening that
could not happen anywhere else? "Nothing, but readers of the books will know" is a fail.

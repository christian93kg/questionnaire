---
pack: star-wars
---

# World vocabulary — star-wars

Format contract: `_craft/packs/_FORMAT.md`. Tiers are matched case-insensitively.

**Doctrine inverted 2026-08-27.** These tiers replaced a blanket ban on all Star Wars
vocabulary in questions. The ban made the quiz read as a generic personality test with a
skin; the Pottermore Sorting Hat is 75–80% world-neutral in its actual questions, and the
magic is in the wrapper, not the nouns. In-world is the standard now. DENY is the precision
successor to the old blanket rule — trivia and roster-collapse only, not every noun.

## aliases

One per line, unquoted — `craft-gate.sh` matches a whole line as one alias.

```
star wars
starwars
```

## allow

Unlimited. This is the register the card asks for; no rule fires on any of it. Listed so
`skinned-question` has something to detect the *presence* of.

```
jedi "the force" lightsaber droid empire imperial stormtrooper rebellion rebel
"dark side" "bounty hunter" smuggler blaster cantina starship garrison checkpoint
credits salvage manifest transport comm hangar freighter spaceport "docking bay"
```

## warn

Advisory, max one per question. Each should survive being deleted from the sentence — if
the dilemma needs it to parse, it has drifted into referential territory and belongs on
ALLOW only after the capitals and substitution tests clear it, or off the bank entirely.

```
wookiee x-wing "tie fighter" hyperspace astromech resistance "first order"
"outer rim" speeder "moisture farm" hutt "imperial officer"
```

## deny

Hard fail. Either trivia-only — a reader needs the film to know what it means — or it
collapses the roster the way a role grant does.

Three rulings that look wrong and are not. Recorded so nobody "fixes" them later:

- **`sith` is DENY, not ALLOW**, even though it reads like core vocabulary. It is never
  spoken in the original trilogy: it is prequel vocabulary that fandom retro-applies to
  Vader. A once-through viewer knows "the dark side," not "Sith." On ALLOW it would be
  trivia dressed as register.
- **`mandalorian` is DENY, not a costume swap-in.** It is a demonym for a culture whose
  ethics are the point of naming it, not flavour text — using it as scenery *is* the
  referential failure, not a fix for it.
- **`grogu` is DENY as a question noun** even though he is on the roster. Results may name
  him; questions may not. A question built around a named character is referential by
  construction.

```
sith padawan mandalorian beskar grogu coruscant naboo alderaan endor jakku
scarif kamino dagobah twi'lek togruta gungan "jedi council" youngling
separatist "order 66" "clone wars" "kessel run" parsec kyber holocron
midi-chlorian moff inquisitor bantha "womp rat" tauntaun sarlacc corellian
```

## register

Words the card calls out as carrying the world without being proper nouns at all — what a
checkpoint, a supply run or a debt collector would say in any setting. A working stem can be
built from these alone with nothing named.

```
requisition papers "shift supervisor" "salvage rights" "three days out"
"answering the comm"
```

## role-preemption

Literal phrases, one per line. Second person is a situation, never a role, never a power,
never a side. "You" is a person a long way from home with somewhere to be — true of every
character on the roster, contradictory of none. Grant the taker a ship, a squadron, a
lightsaber or an intuition, and the roster stops being a roster of *people*: a
Force-sensitive taker makes Han, Leia and Cassian all incoherent as results.

```
your ship
your squadron
your lightsaber
you feel the force
you sense
```

## world-pressures

Every question should trace to one of these. They are the load-bearing facts of the setting
— deliver them through the situation, not through a name.

- an occupying authority can stop and search you, and paperwork is a weapon
- machines are people-ish, and how you treat one is characterising
- distance is fatal; nobody is coming to help
- there is an intuition some people trust and others sneer at
- being in debt to criminals is an ordinary way to live
- a working ship is the difference between freedom and being stuck
- wars are fought by ordinary people in old, failing equipment
- mentors and family are load-bearing and frequently go bad

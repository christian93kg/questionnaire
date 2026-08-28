#!/usr/bin/env python3
# question-lint.py — pre-commit gate on the question bank. Sibling to
# craft-gate.sh, opposite end of the turn: craft-gate injects doctrine BEFORE
# authoring (UserPromptSubmit); this checks the bank AFTER writing (PostToolUse)
# and can block on it.
#
# Adapted from christian93kg/story-loop .claude/hooks/prose-lint.py. Same
# architecture (Tier A FAIL / Tier B advisory / Tier C dossier), same `owner=`
# convention, same output caps, same escape hatch, same contract.
#
# WHY THIS EXISTS: the craft card is not missing — it is injected every prompt
# and is in context when bad questions get written. The failure is that the pass
# which checks a unit is the pass that wrote it, and it rubber-stamps its own
# habits. A quiz bank fails in exactly that shape: the author knows "no obviously
# correct option" and still writes one, because the option that scores for the
# trait the author likes gets fifteen more words of justification than its
# siblings. A reminder cannot fix a reminder-application problem; a hook can.
#
# CONTRACT (inherited verbatim from craft-gate.sh / prose-lint.py):
#   - degrade LOUDLY, never silently: a missing input warns and keeps going
#   - a crash must never block writing — errors exit 0
#   - constants here are the single source of truth; the card points, never restates
#
# WHAT IT PROVABLY CANNOT DO — do not add rules for these, they belong to the
# question reviewer (.claude/agents/question-reviewer.md):
#   voice uniformity across the whole bank (a repeated *rhetorical* template is
#   not a repeated string — `template-shape` catches only the literal case),
#   whether an option genuinely costs the taker something, whether two options
#   differ in *downstream state* when their vectors differ, telegraphing that
#   uses no gloss-clause, and the costumed/referential judgment calls the
#   capitals and substitution tests can't fully mechanise: a mundane dilemma
#   with nouns swapped that reads fake even though no single word is banned,
#   and a lowercase term that still can't be answered without outside
#   knowledge. All five are judgment calls across units. On the record: none of
#   them regex.
#
# TWO GOTCHAS INHERITED FROM THE SOURCE, BOTH DELIBERATELY REVERSED — see
# `parse_markdown` (GOTCHA 1) and `Scope` (GOTCHA 2) below.
#
# Modes:
#   question-lint.py <questions.ts|_exemplars.md>   report to stdout, exit 0
#   question-lint.py --hook          PostToolUse: hook JSON on stdin
#   question-lint.py --brief <file>  emit the question-reviewer context bundle
#   question-lint.py --selftest      fixtures + bank regression
#
# Self-check:  python3 .claude/hooks/question-lint.py --selftest

import argparse
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

VAULT = os.environ.get("CLAUDE_PROJECT_DIR", ".")
CARD = os.path.join(VAULT, "_craft", "quiz-question.card.md")
SPINE = os.path.join(VAULT, "_craft", "CRAFT_SPINE.md")
EXEMPLARS = os.path.join(VAULT, "_craft", "_exemplars.md")
FIXTURES = os.path.join(VAULT, ".claude", "hooks", "fixtures")
BANK_GLOB = os.path.join(VAULT, "src", "lib", "packs", "*", "questions.ts")

# The gate's trigger. The source keyed on the `_draft.md` suffix; questions are
# not drafts, they are TypeScript, so this keys on the questions-file basename
# in any directory plus the craft exemplars file. Matching on basename ALONE
# (not on a required parent dir) is deliberate and inherited: the source once
# required a literal `scratchpad/` parent, which meant a file written elsewhere
# sailed past unlinted and unannounced — the exact silent failure the "degrade
# LOUDLY" contract forbids. Off-convention paths are linted anyway and told
# where they should have been.
QUESTIONS_PATH_RE = re.compile(
    r"(?:^|/)(?:[\w.-]*_)?questions?(?:[_-][\w.-]+)?\.(?:ts|js|mjs|md)$"
    r"|(?:^|/)_craft/_exemplars\.md$",
    re.I,
)
CONVENTIONAL_PATH = "src/lib/packs/<pack>/questions.ts"

# Structural spec for one unit. Set here, not in the card — the card points.
OPTION_COUNT = 4
MAX_PROMPT_SENTENCES = 2
MAX_PROMPT_WORDS = 30

# option-asymmetry thresholds. The leak signature is ONE option standing clear
# of its three siblings, so the comparison is longest vs. SECOND-longest, not
# vs. the mean — a mean is dragged up by the outlier it is meant to catch.
# Calibrated against _craft/_exemplars.md, whose worst spread is 54 vs 45 chars
# (ratio 1.20, delta 9). Both conditions must hold, so a naturally long-but-
# balanced option set never fires. A rule that fires on the exemplars is wrong.
ASYM_RATIO = 1.6
ASYM_DELTA_CHARS = 18

# option-monotony: the spine's "read it aloud, vary one," restated for four
# options. Fires only when ALL FOUR scan the same length, and only above a floor
# — four three-word options that match are terse, not monotonous.
MONOTONY_SPREAD = 1
MONOTONY_MIN_WORDS = 6

# Output-hygiene caps on the rendered report, so a 40-unit bank cannot blow the
# hook-output budget. Unlike craft-gate.sh's MAX_BYTES these are not empirically
# derived against a threshold — they are just "enough to read at a glance."
MAX_REPORT_BYTES = 2048
MAX_REPORT_LINES = 25

# Bank-regression baseline: total Tier-A FAILs across the committed question
# bank at calibration time. --selftest asserts we never exceed it. Raising this
# number is only ever correct when new questions were committed, never to make a
# new PATTERNS entry pass.
#
# HELD AT 0 on 2026-08-27. First contact with the 34-unit bank found 11 hits;
# all eleven were read by hand and all eleven are true positives (four
# intensifiers, two all-four-options-same-length units, a "You realise" filter
# word, a "Maybe" hedge, "trust" named in a prompt the displacement test is
# about, and one option 63% longer than its siblings). None is a rule firing on
# good prose, so the baseline stays at 0 and the 11 stand as the fix list.
# Raising this number is only ever correct when new questions were committed AND
# hand-inspected, never to make a new PATTERNS entry pass, and never to silence
# findings that are simply not fixed yet.
# The source repo's calibration log is the reason the known-good fixture is not
# optional: five candidate rules there had to be loosened because they fired on
# good prose. The rule that came out of it, and that governs this file:
#   A rule that fires on the known-good fixture is wrong; the prose is not.
BASELINE_BANK_FAILS = 0

warnings = []


def warn(msg):
    warnings.append(msg)


# --------------------------------------------------------------------------
# GOTCHA 2 — the source's `narration_only()`, INVERTED.
#
# prose-lint.py blanks every quoted span before running its narrator rules, so
# that a rule about the narrator cannot fire on what a character says. Ported
# here unchanged, that is catastrophic: a quiz option IS a quoted string
# (`text: 'Refuse, in writing, with your name on it.'`), so every option in the
# bank would be blanked and every ported rule would run on nothing but TypeScript
# punctuation and report "clean."
#
# Options are the thing most needing lint — they are where the answer key leaks.
# So the blanking is not merely dropped, it is reversed: the parser pulls prompt
# and option text out as separate fields, and each rule declares which it runs
# against. `Scope.OPTION` is the inverse of the source's narration_only=True.
# --------------------------------------------------------------------------
class Scope:
    PROMPT = "prompt"
    OPTION = "option"
    BOTH = "both"


# --------------------------------------------------------------------------
# Tier A — FAIL rules.
#
# Every rule mechanises doctrine that already exists in _craft/. This file
# invents no craft rules; `owner` names the card and test that owns each one.
#
# TRIPWIRE: if the CRAFT rules below ever exceed ~15 entries, that is the signal
# the bank has become over-managed and the answer is a reset, not entry #16.
#
# CURRENTLY AT 16 — one over, and that is correct, not drift. Doctrine inversion
# 2026-08-27 removed the blanket fandom ban (fandom-noun, fandom-noun-soft: 2
# rules) and replaced it with three rules that each do work the blanket ban
# never did: deny-noun (the precision successor — DENY-tier vocabulary only,
# not every SW noun), role-preemption (granting the taker a ship/side/power,
# never checked before at all), and capitalised-option (general proper-noun
# leakage into an OPTION, not just SW nouns — the old rule never looked at
# capitalisation). 15 - 2 + 3 = 16. Collapsing any of the three into another
# blurs a distinct doctrine concern for the sake of a round number, so 16 stands
# until the next entry forces an actual reset.
#
# Exact accounting: PATTERNS (Tier A regex, scope-tagged) = gloss-clause,
# so-much-as, appositive-verdict, filter-word, negation-list, trait-name,
# hedge-option, displacement, intensifier, biography, deny-noun,
# role-preemption = 12. Non-regex Tier A craft checks in tier_a() = repeat-in-
# beat, option-asymmetry, option-monotony, capitalised-option = 4. 12 + 4 = 16.
# The two structural checks (option-count, duplicate-vector) are schema, not
# craft, and are not counted. WARN-tier and skinned-question are Tier B
# advisory and do not count toward this budget at all.
# --------------------------------------------------------------------------

# --- ported unchanged from prose-lint.py (all six catch real quiz tics) ---
PATTERNS = [
    dict(
        id="gloss-clause",
        rx=re.compile(
            r",\s+(?:which|who)\s+(?:is|isn't|was|wasn't|are|aren't)\b"
            r"|\bwhich is to say\b",
            re.I,
        ),
        owner="quiz-question KILL: a prompt that glosses what the situation means about the taker",
        note="telegraphing's greppable form — the prompt explaining its own subject",
        scope=Scope.BOTH,
    ),
    dict(
        id="so-much-as",
        rx=re.compile(
            r"\b(?:isn't|is not|wasn't|was not|not)\b[^.?!]{1,45}\bso much as\b", re.I
        ),
        owner="quiz-question Tests: delete-the-sentence — the situation forces the conclusion",
        scope=Scope.BOTH,
    ),
    dict(
        id="appositive-verdict",
        rx=re.compile(
            r"—\s*(?:a |an |the )?[a-z]{3,15},\s+not\s+(?:a |an |the )?"
            r"(?!more\b|less\b|much\b|many\b|often\b|always\b|never\b|yet\b|now\b|quite\b)"
            r"[a-z]{3,15}"
        ),
        owner="quiz-question KILL: a prompt that glosses what the situation means about the taker",
        note='the appositive verdict, e.g. "— a habit, not a verdict"',
        scope=Scope.BOTH,
    ),
    dict(
        id="filter-word",
        rx=re.compile(
            r"\byou\s+(?:see|saw|feel|felt|notice|noticed|realize|realise|realized|realised"
            r"|sense|sensed|register|registered)\b",
            re.I,
        ),
        owner="quiz-question KILL: filter-word openers",
        scope=Scope.BOTH,
    ),
    dict(
        id="negation-list",
        rx=re.compile(
            r"\bno\s+\w+,\s+no\s+\w+,\s+no\s+\w+|\bnot the \w+, not the \w+, not the \w+", re.I
        ),
        owner="quiz-question Tests: one-telling-particular — negation-list recap",
        scope=Scope.BOTH,
    ),
]

# --- new, this domain ---

# The trait-name test has no analogue in the source. An option that names the
# trait it scores for is answering the quiz on the taker's behalf: the reader
# picks the label they already believe about themselves instead of the act they
# would actually take, and the axis measures self-image, not behaviour.
TRAIT_WORDS = r"""
leader leaders leadership loyal loyalty disloyal ruthless ruthlessly ruthlessness
cautious cautiously caution rebel rebels rebellious ambitious ambitiously brave
bravely bravery courageous principled unprincipled pragmatic pragmatist idealist
idealistic reckless recklessly stubborn stubbornly selfless selfishly selfish
noble nobly cowardly coward arrogant humble humbly patient impulsive impulsively
methodical charismatic optimistic pessimistic cynical cynically trustworthy
protective compassionate empathetic decisive indecisive diplomatic calculating
honourable honorable dutiful obedient obediently defiant defiantly disciplined
"""
PATTERNS.append(
    dict(
        id="trait-name",
        rx=re.compile(r"\b(?:%s)\b" % "|".join(TRAIT_WORDS.split()), re.I),
        owner="quiz-question Tests: trait-name test / KILL: trait names inside an option",
        note="if the reader can name the trait from the option's own words, write the act alone",
        scope=Scope.OPTION,
    )
)

# The tell of a throwaway wrong answer. An author who has already decided which
# option is correct writes the other three at arm's length, and the hedge is
# where that shows: nobody hedges the option they mean.
PATTERNS.append(
    dict(
        id="hedge-option",
        rx=re.compile(
            r"\b(?:try to|tries to|trying to|attempt to|probably|maybe|perhaps|possibly"
            r"|sort of|kind of|i guess|i suppose|somewhat|hopefully|if possible|might"
            r"|a little bit|more or less|or something)\b",
            re.I,
        ),
        owner="quiz-question KILL: hedges and modals in an option",
        scope=Scope.OPTION,
    )
)

# --------------------------------------------------------------------------
# Doctrine inversion, 2026-08-27: in-world is now the standard, not zero-
# fandom. The old FANDOM_HARD / FANDOM_SOFT pair banned every Star Wars noun
# outright. That is gone. In its place, three tiers, all matched case-
# INSENSITIVE — the historical bug in this file was FANDOM_SOFT's comment
# claiming lowercase "force" stayed clean while `"the force"` sat inside
# FANDOM_HARD under re.I, so "the force of it" fired anyway. There is no
# analogous trap here: ALLOW fires no rule at all regardless of case, so there
# is nothing for a casing mismatch to break.
#
#   ALLOW — unlimited. Ordinary Star Wars vocabulary; this is the register the
#     card now asks for. Never checked by any rule below; listed here so
#     skinned-question has something to detect the *presence* of.
#   WARN  — advisory (Tier B), max one per question, and each one should
#     survive being deleted from the sentence (if the dilemma needs it to
#     parse, it has drifted into referential territory and belongs on ALLOW
#     only after the capitals/substitution tests clear it, or off the bank).
#   DENY  — hard fail (Tier A). Vocabulary that is either trivia-only (a
#     reader needs the film to know what it means) or collapses the roster
#     the way a role grant does.
#
# Two rulings that look wrong and are not — commented here so nobody "fixes"
# them later:
#   - "sith" is DENY, not ALLOW, even though it reads like core vocabulary. It
#     is never spoken in the original trilogy: it is prequel vocabulary
#     fandom retro-applies to Vader. A once-through viewer knows "the dark
#     side," not "Sith" — putting it on ALLOW would be trivia dressed as
#     register.
#   - "mandalorian" is DENY, not a costume swap-in. It is a demonym for a
#     culture whose ethics are the point of naming it, not flavour text — using
#     it as scenery is the referential failure, not a fix for it.
#   - "grogu" is DENY as a QUESTION noun even though he is a roster character:
#     results may name him, questions may not. A question built around a named
#     character is referential by construction.
ALLOW_WORDS = r"""
jedi "the force" lightsaber droid empire imperial stormtrooper rebellion rebel
"dark side" "bounty hunter" smuggler blaster cantina starship garrison checkpoint
credits salvage manifest transport comm hangar freighter spaceport "docking bay"
"""
WARN_WORDS = r"""
wookiee x-wing "tie fighter" hyperspace astromech resistance "first order"
"outer rim" speeder "moisture farm" hutt "imperial officer"
"""
DENY_WORDS = r"""
sith padawan mandalorian beskar grogu coruscant naboo alderaan endor jakku
scarif kamino dagobah twi'lek togruta gungan "jedi council" youngling
separatist "order 66" "clone wars" "kessel run" parsec kyber holocron
midi-chlorian moff inquisitor bantha "womp rat" tauntaun sarlacc corellian
"""
# Vocabulary the card calls out as register that carries the world without
# being a Star Wars proper noun at all — ordinary words a checkpoint, a supply
# run, or a debt collector would use in any setting. Used only by
# skinned-question below, never a fail condition on its own.
REGISTER_WORDS = r"""
requisition papers "shift supervisor" "salvage rights" "three days out"
"answering the comm"
"""


def _tier_terms(block):
    return [t.strip('"') for t in re.findall(r'"[^"]+"|\S+', block)]


def _tier_pattern(block):
    return re.compile(r"\b(?:%s)\b" % "|".join(re.escape(t) for t in _tier_terms(block)), re.I)


WARN_RX = _tier_pattern(WARN_WORDS)
DENY_RX = _tier_pattern(DENY_WORDS)
SKINNED_RX = re.compile(
    r"\b(?:%s)\b"
    % "|".join(
        re.escape(t)
        for t in _tier_terms(ALLOW_WORDS) + _tier_terms(WARN_WORDS)
        + _tier_terms(DENY_WORDS) + _tier_terms(REGISTER_WORDS)
    ),
    re.I,
)

PATTERNS.append(
    dict(
        id="deny-noun",
        rx=DENY_RX,
        owner="quiz-question card: Categories — Trivia/Referential kill list, DENY tier",
        note="trivia-only or roster-collapsing vocabulary; never belongs in a question",
        scope=Scope.BOTH,
    )
)

# role-preemption: granting the taker a ship, a squadron, a weapon, a side, or
# an intuitive power collapses the result space. If a question implies the
# taker is Force-sensitive, Han, Leia and Cassian all become incoherent
# results — the roster stops being a roster of *people*, and becomes a roster
# gated by a power most of it doesn't have.
PATTERNS.append(
    dict(
        id="role-preemption",
        rx=re.compile(
            r"\byour ship\b|\byour squadron\b|\byour lightsaber\b"
            r"|\byou feel the force\b|\byou sense\b",
            re.I,
        ),
        owner="quiz-question card: Standing rules — second person is situation, "
        "never role, never power, never side",
        scope=Scope.BOTH,
    )
)

# The displacement test: if the abstract noun is in the prompt, the answer key is
# in the question. Prompt-scoped only — an option may legitimately land on a
# concrete use of one of these words.
ABSTRACT_NOUNS = r"""
loyalty resentment trust distrust betrayal duty obligation integrity morality
ethics ambition allegiance conscience temptation cowardice courage guilt shame
pride ego honour honor sacrifice revenge vengeance responsibility commitment
authority obedience defiance ruthlessness compassion empathy
"""
PATTERNS.append(
    dict(
        id="displacement",
        rx=re.compile(r"\b(?:%s)\b" % "|".join(ABSTRACT_NOUNS.split()), re.I),
        owner="quiz-question Tests: displacement test (via dialogue-subtext: the real subject "
        "removable as a named noun and still unmistakable)",
        scope=Scope.PROMPT,
    )
)

# openings-and-cold-open: the strangest fact in the plainest sentence.
PATTERNS.append(
    dict(
        id="intensifier",
        rx=re.compile(
            r"\b(?:really|very|utterly|absolutely|completely|totally|incredibly"
            r"|extremely|deeply|desperately|literally|truly|profoundly)\b",
            re.I,
        ),
        owner="quiz-question KILL: intensifier-dressed stakes",
        scope=Scope.BOTH,
    )
)

# openings-and-cold-open: "you" arrives through a present situation, not a
# biographical résumé.
PATTERNS.append(
    dict(
        id="biography",
        rx=re.compile(
            r"\byou(?:'ve| have| had)\s+(?:always|never)\b"
            r"|\byou are the (?:kind|type|sort) of\b"
            r"|\byou're the (?:kind|type|sort) of\b"
            r"|\bever since you (?:were|could)\b",
            re.I,
        ),
        owner="quiz-question Tests: present-situation test / KILL: biography before situation",
        scope=Scope.PROMPT,
    )
)

# Craft rules that are not a single regex live in tier_a() below:
#   repeat-in-beat (ported), option-asymmetry, option-monotony, capitalised-option.
# Structural (schema, not craft):
#   option-count, duplicate-vector.

# capitalised-option: a capitalised token inside an option that is not the
# option's own first word and does not follow sentence-ending punctuation. "I"
# and its contractions are exempt — English capitalises the first-person
# pronoun regardless of position, which is not a world-budget leak. Everything
# else capitalised mid-option is a proper noun spending the world budget where
# the card says it must not go: the stem, never the options.
_WORD_RE = re.compile(r"[A-Za-z']+")
_I_FORMS = {"I", "I'll", "I'm", "I've", "I'd"}


def capitalised_option_hits(text):
    hits = []
    for m in _WORD_RE.finditer(text):
        w = m.group(0)
        if not w[0].isupper() or w in _I_FORMS:
            continue
        j = m.start() - 1
        while j >= 0 and text[j] == " ":
            j -= 1
        if j < 0 or text[j] in ".!?":
            continue  # sentence-initial (including option-initial) — allowed
        hits.append(w)
    return hits

STOPWORDS = set(
    """a an the and or but if of to in on at by for with from as is was are were be been being
    it its it's he she they them him her his hers their this that these those there here you your
    yours i me my we us our not no nor so than then too very can could will would shall should
    may might must do does did done have has had having what which who whom when where why how
    all any both each few more most other some such only own same s t just don now up down out
    off over under again further once about into through during before after above below between
    because while until what's don't didn't isn't wasn't i'd i'm they'll who'd that's"""
    .split()
)


# --------------------------------------------------------------------------
# Parsing — one Unit type, two front ends, so TS and Markdown can never drift.
#
#   Unit = dict(qid, line, prompt, options=[dict(text, line, vec)])
# --------------------------------------------------------------------------
FRONTMATTER_RE = re.compile(r"\A---\n.*?\n---\n", re.S)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
STR_RE = re.compile(r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|`(?:[^`\\]|\\.)*`", re.S)


def _unquote(s):
    return re.sub(r"\\(.)", r"\1", s[1:-1])


def _lineno(text, idx):
    return text.count("\n", 0, idx) + 1


def _match_bracket(text, start, opener, closer):
    """Index just past the bracket opened at `start`, skipping string literals
    and comments. Returns -1 if unbalanced."""
    depth, i, n = 0, start, len(text)
    while i < n:
        c = text[i]
        if c in "'\"`":
            m = STR_RE.match(text, i)
            i = m.end() if m else i + 1
            continue
        if c == "/" and i + 1 < n and text[i + 1] in "/*":
            if text[i + 1] == "/":
                i = text.find("\n", i)
                if i == -1:
                    return -1
            else:
                i = text.find("*/", i)
                if i == -1:
                    return -1
                i += 2
            continue
        if c == opener:
            depth += 1
        elif c == closer:
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def parse_ts_object_form(raw):
    """Extract units from a `Question[]` written as object literals. Anchors on
    each `options: [` block: the unit's prompt is the nearest preceding `text:`
    literal, its id the nearest preceding `id:` literal. Bracket matching skips
    strings and comments, so an apostrophe or a brace inside option prose cannot
    desync the parse."""
    units = []
    texts = [(m.start(), m.group(1)) for m in re.finditer(r"\btext\s*:\s*(%s)" % STR_RE.pattern, raw)]
    ids = [(m.start(), m.group(1)) for m in re.finditer(r"\bid\s*:\s*(%s)" % STR_RE.pattern, raw)]
    prev_end = 0
    for om in re.finditer(r"\boptions\s*:\s*\[", raw):
        astart = raw.index("[", om.start())
        aend = _match_bracket(raw, astart, "[", "]")
        if aend == -1:
            warn(f"unbalanced options[] at line {_lineno(raw, astart)} — unit skipped")
            continue
        block = raw[astart:aend]
        before = [(p, s) for p, s in texts if prev_end <= p < om.start()]
        if not before:
            warn(f"options[] at line {_lineno(raw, astart)} has no preceding `text:` — unit skipped")
            prev_end = aend
            continue
        ppos, prompt = before[-1]
        qid = next((_unquote(s) for p, s in reversed(ids) if p < ppos), "?")
        opts = []
        for tm in re.finditer(r"\btext\s*:\s*(%s)" % STR_RE.pattern, block):
            vec = None
            vm = re.compile(r"\bv\s*:\s*\{").search(block, tm.end())
            if vm:
                bstart = block.index("{", vm.start())
                bend = _match_bracket(block, bstart, "{", "}")
                if bend != -1:
                    vec = tuple(
                        sorted(
                            (k, float(v))
                            for k, v in re.findall(
                                r"([A-Za-z_$][\w$]*)\s*:\s*(-?\d+(?:\.\d+)?)", block[bstart:bend]
                            )
                            if float(v) != 0
                        )
                    )
            opts.append(
                dict(text=_unquote(tm.group(1)), line=_lineno(raw, astart + tm.start()), vec=vec)
            )
        units.append(
            dict(qid=qid, line=_lineno(raw, ppos), prompt=_unquote(prompt), options=opts)
        )
        prev_end = aend
    return units


# The bank in this repo is not written as object literals — it uses a `q(id,
# tier, axis, text, [[optText, vec], …])` helper, which has no `text:` or
# `options:` keys at all. The object-literal parser found ZERO units in it and
# said so loudly, which is the contract working; but a linter that warns instead
# of linting the actual bank is a linter that gets turned off. Hence a second
# front end. Both run; whichever finds units wins, and if both do, the results
# are merged, so neither authoring style can go unlinted.
TUPLE_ARRAY_RE = re.compile(r"\[\s*\[\s*(?:%s)" % STR_RE.pattern, re.S)


def parse_ts_helper_form(raw):
    """Extract units from `helper(…, 'prompt', [['option text', {vec}], …])`.
    Recognises the options array by shape, not by key name: an array whose first
    element is itself an array whose first element is a string literal. Type
    annotations (`Array<[string, T['v']]>`) and index expressions (`'abcd'[i]`)
    do not match that shape, so the helper's own definition is not mistaken for
    a unit."""
    units = []
    prev_end, i, n = 0, 0, len(raw)
    while i < n:
        c = raw[i]
        if c in "'\"`":
            m = STR_RE.match(raw, i)
            i = m.end() if m else i + 1
            continue
        if c != "[":
            i += 1
            continue
        end = _match_bracket(raw, i, "[", "]")
        if end == -1 or not TUPLE_ARRAY_RE.match(raw, i):
            i += 1
            continue
        block = raw[i:end]
        # Window the argument search to the current statement. Without this the
        # FIRST unit in a file picks up the import specifier and the helper's own
        # type annotations (`Question['tier']`) as arguments, and gets labelled
        # '$lib/engine/types' — a wrong label on a real finding, which is worse
        # than no label. Blank line = statement boundary; falls back to the
        # previous unit's end, which is already correct for units 2..n.
        nl = raw.rfind("\n\n", prev_end, i)
        lo = nl + 2 if nl != -1 else prev_end
        strs = [(m.start(), m.group(0)) for m in STR_RE.finditer(raw, lo, i)]
        if not strs:
            i, prev_end = end, end
            continue
        ppos, prompt = strs[-1]
        qid = _unquote(strs[0][1]) if len(strs) > 1 else "?"
        opts, j = [], 1  # skip the outer '['
        while j < len(block) - 1:
            if block[j] in "'\"`":
                m = STR_RE.match(block, j)
                j = m.end() if m else j + 1
                continue
            if block[j] != "[":
                j += 1
                continue
            tend = _match_bracket(block, j, "[", "]")
            if tend == -1:
                break
            tup = block[j:tend]
            tm = STR_RE.search(tup)
            if tm:
                vec = None
                bstart = tup.find("{", tm.end())
                if bstart != -1:
                    bend = _match_bracket(tup, bstart, "{", "}")
                    if bend != -1:
                        vec = tuple(
                            sorted(
                                (k, float(v))
                                for k, v in re.findall(
                                    r"([A-Za-z_$][\w$]*)\s*:\s*(-?\d+(?:\.\d+)?)",
                                    tup[bstart:bend],
                                )
                                if float(v) != 0
                            )
                        )
                opts.append(
                    dict(text=_unquote(tm.group(0)), line=_lineno(raw, i + j), vec=vec)
                )
            j = tend
        if opts:
            units.append(
                dict(qid=qid, line=_lineno(raw, ppos), prompt=_unquote(prompt), options=opts)
            )
        i, prev_end = end, end
    return units


def parse_typescript(raw):
    obj = parse_ts_object_form(raw)
    helper = parse_ts_helper_form(raw)
    if obj and helper:
        seen = {u["prompt"] for u in obj}
        return obj + [u for u in helper if u["prompt"] not in seen]
    return obj or helper


# GOTCHA 1 — the source's strip_meta() drops every `^\d+\.\s` line as a "choice
# menu item." Ported unchanged, a bank written with NUMBERED options would be
# silently invisible to the linter: it would report a prompt with zero options
# and call it clean. Numbered lines are therefore recognised as OPTIONS here,
# not discarded — the exact reversal of the source's intent, because in this
# domain the choice menu is the payload, not the scaffolding.
BULLET_RE = re.compile(r"^(?:[-*+]|\d+[.)])\s+(.*\S)\s*$")


def parse_markdown(raw):
    """Extract units from prose: a non-list line immediately followed by two or
    more bullet/numbered lines. Blockquote markers are stripped first so the
    exemplars file (units in `>` blocks) parses the same as a plain draft."""
    raw = COMMENT_RE.sub("", FRONTMATTER_RE.sub("", raw))
    lines = raw.split("\n")
    clean = [re.sub(r"^\s*>\s?", "", ln) for ln in lines]
    units, i = [], 0
    while i < len(clean):
        s = clean[i].strip()
        bullet = BULLET_RE.match(s)
        if not s or bullet or s.startswith("#") or s in ("---", "***", "___"):
            i += 1
            continue
        opts, j = [], i + 1
        while j < len(clean):
            t = clean[j].strip()
            if not t:
                if opts:
                    break
                j += 1
                continue
            b = BULLET_RE.match(t)
            if not b:
                break
            opts.append(dict(text=b.group(1), line=j + 1, vec=None))
            j += 1
        if len(opts) >= 2:
            units.append(dict(qid=f"L{i+1}", line=i + 1, prompt=s, options=opts))
            i = j
        else:
            i += 1
    return units


def parse(path_or_text, path_hint="", is_text=False):
    raw = path_or_text if is_text else open(path_or_text).read()
    hint = path_hint or (path_or_text if not is_text else "")
    if hint.lower().endswith((".ts", ".js", ".mjs")):
        units = parse_typescript(raw)
    elif hint.lower().endswith(".md"):
        units = parse_markdown(raw)
    else:
        units = parse_typescript(raw) or parse_markdown(raw)
    if not units:
        warn(f"no question units parsed from {hint or '<stdin>'} — nothing was checked.")
    return raw, units


def words(s):
    return re.findall(r"[a-z0-9']+", s.lower())


def sentences(s):
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", s) if x.strip()]


def ngrams(toks, n):
    return [" ".join(toks[i : i + n]) for i in range(len(toks) - n + 1)]


# --------------------------------------------------------------------------
# Checks
# --------------------------------------------------------------------------
def suppressed(raw):
    """`<!-- lint-ok: rule-id -->` anywhere in the file, or the TS-comment form
    `// lint-ok: rule-id`, disables that rule for the whole file."""
    return {
        m.group(1)
        for m in re.finditer(r"(?:<!--|//|/\*)\s*lint-ok:\s*([a-z-]+)", raw)
    }


def snippet(s, limit=88):
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= limit else s[: limit - 1] + "…"


def tier_a(units, skip):
    fails = []

    def add(rid, line, quote, owner):
        if rid not in skip:
            fails.append(dict(id=rid, line=line, quote=quote, owner=owner))

    for u in units:
        # --- regex rules, scoped (GOTCHA 2: options are linted, not blanked) ---
        for rule in PATTERNS:
            if rule["id"] in skip:
                continue
            targets = []
            if rule["scope"] in (Scope.PROMPT, Scope.BOTH):
                targets.append((u["line"], u["prompt"], "prompt"))
            if rule["scope"] in (Scope.OPTION, Scope.BOTH):
                targets += [(o["line"], o["text"], "option") for o in u["options"]]
            # One hit per rule per text, not per occurrence: a unit has five
            # texts and a bank has forty units, so finditer here would blow
            # MAX_REPORT_LINES on a single bad prompt and hide the other 39.
            for line, text, where in targets:
                m = rule["rx"].search(text)
                if m:
                    add(
                        rule["id"],
                        line,
                        f'{u["qid"]} {where}: "{snippet(text)}" ← {m.group(0)!r}',
                        rule["owner"],
                    )

        opts = u["options"]

        # --- structural (schema, not craft) ---
        if len(opts) != OPTION_COUNT:
            add(
                "option-count",
                u["line"],
                f'{u["qid"]}: {len(opts)} options, expected {OPTION_COUNT}',
                "quiz-question KILL: more or fewer than four options",
            )
        seen = {}
        for o in opts:
            if o["vec"] is None:
                continue
            if o["vec"] in seen:
                add(
                    "duplicate-vector",
                    o["line"],
                    f'{u["qid"]}: "{snippet(seen[o["vec"]], 34)}" and "{snippet(o["text"], 34)}" '
                    "score identically",
                    "spine ship test: name a different downstream state for each option; "
                    "if two share one, cut or merge",
                )
            else:
                seen[o["vec"]] = o["text"]

        if len(opts) < 2:
            continue

        # --- option-asymmetry: the answer key leaking as length ---
        lens = sorted((len(o["text"]), o["text"], o["line"]) for o in opts)
        top, second = lens[-1], lens[-2]
        if (
            top[0] >= ASYM_RATIO * max(1, second[0])
            and top[0] - second[0] >= ASYM_DELTA_CHARS
        ):
            add(
                "option-asymmetry",
                top[2],
                f'{u["qid"]}: {top[0]} chars vs {second[0]} next-longest — '
                f'"{snippet(top[1], 46)}"',
                "quiz-question KILL: one option markedly longer than its three siblings "
                "(length is how the correct answer leaks)",
            )

        # --- option-monotony: the spine's "vary one," restated for four options ---
        wl = [len(words(o["text"])) for o in opts]
        if max(wl) - min(wl) <= MONOTONY_SPREAD and min(wl) >= MONOTONY_MIN_WORDS:
            add(
                "option-monotony",
                u["line"],
                f'{u["qid"]}: all {len(opts)} options {wl} words — vary one',
                "spine ship test: read it aloud; if three consecutive sentences share a "
                "length, vary one",
            )

        # --- capitalised-option: the world budget belongs to the stem ---
        for o in opts:
            for w in capitalised_option_hits(o["text"]):
                add(
                    "capitalised-option",
                    o["line"],
                    f'{u["qid"]} option: "{snippet(o["text"])}" ← {w!r}',
                    "quiz-question card: Standing rules — world budget goes in the "
                    "stem, not the options",
                )

    # --- repeat-in-beat (ported). The source's unit is the beat; the analogue
    # here is the BANK, not one question: a 4-gram cannot repeat three times
    # inside forty words of options, and a template repeated across units is
    # exactly the BuzzFeed tell the port is meant to catch. ---
    if "repeat-in-beat" not in skip:
        grams = Counter()
        for u in units:
            for text in [u["prompt"]] + [o["text"] for o in u["options"]]:
                for g in set(ngrams(words(text), 4)):
                    grams[g] += 1
        for g, c in grams.most_common():
            if c < 3:
                break
            if all(t in STOPWORDS for t in g.split()):
                continue
            fails.append(
                dict(
                    id="repeat-in-beat",
                    line=0,
                    quote=f'"{g}" ×{c} across the bank',
                    owner="quiz-question KILL: a rhetorical template repeated across units",
                )
            )
    return fails


def tier_b(units, skip):
    adv = []

    for u in units:
        if "prompt-shape" in skip:
            break
        ns, nw = len(sentences(u["prompt"])), len(words(u["prompt"]))
        if ns > MAX_PROMPT_SENTENCES or nw > MAX_PROMPT_WORDS:
            adv.append(
                dict(
                    id="prompt-shape",
                    quote=f'{u["qid"]}: {ns} sentences / {nw} words '
                    f"(spec: ≤{MAX_PROMPT_SENTENCES} sentences) — {snippet(u['prompt'], 50)}",
                )
            )

    # Repeated structural shape across CONSECUTIVE units — the greppable half of
    # the reviewer's lens 3. The judgment half stays with the reviewer.
    if "template-shape" not in skip:
        opens = [(u["qid"], " ".join(words(u["prompt"])[:3])) for u in units]
        for i in range(len(opens) - 1):
            if opens[i][1] and opens[i][1] == opens[i + 1][1]:
                adv.append(
                    dict(
                        id="template-shape",
                        quote=f'{opens[i][0]} and {opens[i+1][0]} both open "{opens[i][1]}…"',
                    )
                )

    # Every unit's options opening on the same word is a shape, not a coincidence.
    if "option-shape" not in skip:
        for u in units:
            heads = [words(o["text"])[:1] for o in u["options"] if words(o["text"])]
            flat = [h[0] for h in heads if h]
            if len(flat) >= 3 and len(set(flat)) == 1:
                adv.append(
                    dict(id="option-shape", quote=f'{u["qid"]}: all options open "{flat[0]}…"')
                )

    # warn-noun: WARN-tier vocabulary is fine in moderation — the cap is one
    # per question, and each one should be droppable without breaking the
    # sentence. Advisory because WARN terms are legitimate register, not a
    # ban; the message flags the count so a unit that leans on two or more
    # gets a second look, not an automatic rewrite.
    if "warn-noun" not in skip:
        for u in units:
            for text, where in [(u["prompt"], "prompt")] + [
                (o["text"], "option") for o in u["options"]
            ]:
                hits = WARN_RX.findall(text)
                if hits:
                    over = " — exceeds the 1-per-question guideline" if len(hits) > 1 else ""
                    adv.append(
                        dict(
                            id="warn-noun",
                            quote=f'{u["qid"]} {where}: {hits} in "{snippet(text)}"{over}',
                        )
                    )

    # skinned-question: a stem with zero ALLOW/WARN/DENY/register vocabulary
    # is generic — the target register in moderation (the card caps this
    # around 10 of 34 in the bank), so advisory, not a fail. This is the
    # inverse of the old zero-fandom rule: it flags too LITTLE world, not too
    # much.
    if "skinned-question" not in skip:
        for u in units:
            if not SKINNED_RX.search(u["prompt"]):
                adv.append(
                    dict(
                        id="skinned-question",
                        quote=f'{u["qid"]}: no world vocabulary in the stem — '
                        f'"{snippet(u["prompt"])}"',
                    )
                )
    return adv


def tier_c(units):
    """Option dossier — no verdict. The source dumps each speaker's lines so a
    reader can judge them as a SET; this dumps option openings the same way,
    because voice uniformity across the bank is the reviewer's job, not a regex's."""
    if not units:
        return []
    heads = defaultdict(list)
    for u in units:
        for o in u["options"]:
            w = words(o["text"])[:2]
            if w:
                heads[" ".join(w)].append(u["qid"])
    shared = {k: v for k, v in heads.items() if len(v) >= 2}
    lines = [
        f"-- option dossier ({len(units)} units, "
        f"{sum(len(u['options']) for u in units)} options) -- no verdict; "
        "read the bank as a set"
    ]
    if shared:
        for k, v in sorted(shared.items(), key=lambda kv: -len(kv[1]))[:6]:
            lines.append(f'   opening "{k}…" ×{len(v)}: {", ".join(v[:6])}')
    else:
        lines.append("   no option opening repeats across units")
    return lines


# --------------------------------------------------------------------------
# Report
# --------------------------------------------------------------------------
def lint(path, want_c=True, path_hint=""):
    raw, units = parse(path, path_hint=path_hint or path)
    skip = suppressed(raw)
    fails = tier_a(units, skip)
    adv = tier_b(units, skip)
    cee = tier_c(units) if want_c else []
    return units, fails, adv, cee, skip


def render(units, fails, adv, cee, skip):
    out = []
    for w in warnings:
        out.append(f"!! QUESTION LINT WARNING: {w}")
    nopt = sum(len(u["options"]) for u in units)
    if not fails and not adv:
        out.append(f"QUESTION LINT: clean — {len(units)} units, {nopt} options.")
    else:
        for f in fails:
            loc = f"L{f['line']}" if f["line"] else "  "
            out.append(f"{loc} FAIL {f['id']}  {f['quote']}")
            out.append(f"       [{f['owner']}]")
        for a in adv:
            out.append(f"   ?  {a['id']}  {a['quote']}")
    if skip:
        out.append(f"   {len(skip)} rule(s) suppressed by lint-ok: {', '.join(sorted(skip))}")
    out += cee

    if len(out) > MAX_REPORT_LINES or len("\n".join(out)) > MAX_REPORT_BYTES:
        head = out[: MAX_REPORT_LINES - 1]
        out = head + [f"   …report capped ({len(fails)} FAIL, {len(adv)} advisory total)"]
    return "\n".join(out)


# --------------------------------------------------------------------------
# Question-reviewer bundle
# --------------------------------------------------------------------------
def brief(path):
    units, fails, adv, _, skip = lint(path, want_c=False)
    parts = ["=== QUESTION BANK UNDER REVIEW ==="]
    for u in units:
        parts.append(f'[{u["qid"]}] {u["prompt"]}')
        parts += [f'   - {o["text"]}' for o in u["options"]]
    for p, label in ((EXEMPLARS, "EXEMPLARS — the target voice"), (CARD, "CRAFT CARD"),
                     (SPINE, "CRAFT SPINE")):
        if os.path.isfile(p):
            parts += [f"\n=== {label} ===", open(p).read().strip()]
        else:
            # craft-gate.sh is UserPromptSubmit and does NOT fire for a subagent —
            # this material must be handed over explicitly or the reviewer works blind.
            parts.append(f"\n!! QUESTION LINT WARNING: {p} missing — reviewer working without it.")
    parts += ["\n=== LINTER ALREADY FOUND (do not re-report) ===",
              render(units, fails, adv, [], skip)]
    return "\n".join(parts)


# --------------------------------------------------------------------------
# Selftest
# --------------------------------------------------------------------------
def selftest():
    ok = True
    good = os.path.join(FIXTURES, "questions_good.ts")
    bad = os.path.join(FIXTURES, "questions_bad.ts")
    if not (os.path.isfile(good) and os.path.isfile(bad)):
        print("SELFTEST: fixtures missing — build both before trusting this hook", file=sys.stderr)
        return False

    for label, path, want_fail in (("bad ", bad, True), ("good", good, False)):
        warnings.clear()
        units, fails, adv, _, _ = lint(path, want_c=False)
        ids = Counter(f["id"] for f in fails)
        n = sum(ids.values())
        if want_fail:
            # Named rules, not just a count: a bad fixture that fails for the
            # wrong reason proves nothing about the rules it was built to trip.
            must = ["trait-name", "hedge-option", "option-asymmetry", "deny-noun",
                    "displacement", "gloss-clause", "filter-word", "duplicate-vector",
                    "option-monotony", "repeat-in-beat"]
            missing = [r for r in must if ids.get(r, 0) < 1]
            verdict = not missing and n >= 12
            print(f"SELFTEST bad : {n} FAIL over {len(units)} units {dict(ids)} "
                  f"+ {len(adv)} advisory -> {'PASS' if verdict else 'FAIL'}")
            if missing:
                print(f"   never fired: {', '.join(missing)}")
            ok &= verdict
        else:
            verdict = n == 0
            print(f"SELFTEST good: {n} FAIL over {len(units)} units {dict(ids)} "
                  f"+ {len(adv)} advisory -> {'PASS' if verdict else 'FAIL'}")
            for f in fails:
                print(f"   unexpected: {f['id']}  {f['quote'][:80]}")
            ok &= verdict

    # The exemplars are sworn to lint clean (_craft/_exemplars.md says so). If
    # they ever do not, the rule is wrong and the exemplar is right.
    warnings.clear()
    if os.path.isfile(EXEMPLARS):
        units, fails, adv, _, _ = lint(EXEMPLARS, want_c=False)
        verdict = not fails
        print(f"SELFTEST exemplars: {len(fails)} FAIL over {len(units)} units "
              f"-> {'PASS' if verdict else 'FAIL'}")
        for f in fails:
            print(f"   exemplar violation: {f['id']}  {f['quote'][:80]}")
        ok &= verdict
    else:
        print(f"!! SELFTEST WARNING: {EXEMPLARS} missing — target voice not checked")

    # Bank regression. Over zero units this is not a pass — saying PASS would
    # tell the reader a check ran that did not. SKIP, and stay exit 0, so a bank
    # that does not exist yet is not a red install.
    warnings.clear()
    banks = sorted(glob.glob(BANK_GLOB))
    if not banks:
        print(f"SELFTEST bank: SKIP (no {BANK_GLOB} yet) — no committed questions to regress against")
    else:
        total, nunits = 0, 0
        for b in banks:
            units, fails, _, _, _ = lint(b, want_c=False)
            nunits += len(units)
            total += len(fails)
            for f in fails[:8]:
                print(f"   bank {os.path.basename(b)}: {f['id']}  {f['quote'][:70]}")
        verdict = total <= BASELINE_BANK_FAILS
        print(f"SELFTEST bank: {total} FAIL across {nunits} units in {len(banks)} file(s) "
              f"vs baseline {BASELINE_BANK_FAILS} -> {'PASS' if verdict else 'FAIL'}")
        if not verdict:
            # Say which failure this is. A non-zero exit here means the BANK has
            # open findings, not that the hook is broken — and a reader who
            # cannot tell those apart turns the hook off.
            print("   ^ this is the bank's fix list, not a broken install: the fixtures "
                  "above passed. Fix the units or, if a rule is wrong, fix the rule "
                  "and prove it on questions_good.ts.")
        ok &= verdict

    for w in warnings:
        print(f"!! SELFTEST WARNING: {w}")
    return ok


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("target", nargs="?")
    ap.add_argument("--hook", action="store_true")
    ap.add_argument("--brief", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        sys.exit(0 if selftest() else 1)

    if a.hook:
        try:
            payload = json.load(sys.stdin)
        except Exception:
            sys.exit(0)
        p = (payload.get("tool_input") or {}).get("file_path", "")
        if not p or not QUESTIONS_PATH_RE.search(p) or not os.path.isfile(p):
            sys.exit(0)
        units, fails, adv, cee, skip = lint(p)
        report = render(units, fails, adv, cee, skip)
        # Linted either way, but say so when the bank is off-convention —
        # otherwise the next one lands somewhere this hook may not see. The
        # exemplars and the fixtures are linted on purpose and are not the bank,
        # so they are not "off-convention"; nagging about them would train the
        # advisory to be ignored, which costs it the one time it is real.
        norm = p.replace("\\", "/")
        if not re.search(
            r"(?:_craft/_exemplars\.md|\.claude/hooks/fixtures/[^/]+"
            r"|src/lib/packs/[^/]+/questions\.ts)$",
            norm,
        ):
            report = (
                f"   ?  bank-location  off-convention — the bank belongs at "
                f"{CONVENTIONAL_PATH}\n"
            ) + report
        if fails:
            print(report, file=sys.stderr)
            sys.exit(2)
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PostToolUse", "additionalContext": report}}))
        sys.exit(0)

    if not a.target:
        ap.print_usage(sys.stderr)
        sys.exit(0)

    if a.brief:
        print(brief(a.target))
        sys.exit(0)

    units, fails, adv, cee, skip = lint(a.target)
    print(render(units, fails, adv, cee, skip))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:  # a broken linter must never block writing
        print(f"!! QUESTION LINT ERROR: {type(e).__name__}: {e}", file=sys.stdout)
        sys.exit(0)

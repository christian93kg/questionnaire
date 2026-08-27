#!/bin/sh
# craft-gate.sh — UserPromptSubmit hook: inject the question-authoring spine,
# the quiz-question card digest, and (budget permitting) the exemplars, every
# turn. Sibling to question-lint.py, opposite end of the turn: this injects
# doctrine BEFORE authoring, the linter checks the bank AFTER writing.
#
# Adapted from christian93kg/story-loop .claude/hooks/craft-gate.sh.
#
# HARD CONSTRAINT: total stdout must stay well under Claude Code's internal
# hook-output threshold (observed in the source repo: ~24KB gets persisted to a
# file with only a ~2KB preview reaching the model — which silently disables the
# gate). MAX_BYTES below is the single source of truth for this budget; the card
# and CLAUDE.md point here rather than restating a number. 8200 is the largest
# size proven to arrive inline (23.4KB proven truncated). Degrade LOUDLY.
#
# Self-check:  sh .claude/hooks/craft-gate.sh | wc -c
# Steady state is ~6.2KB with spine + digest + exemplars, so a second card fits.

VAULT="${CLAUDE_PROJECT_DIR:-.}"
CRAFT="$VAULT/_craft"
SPINE="$CRAFT/CRAFT_SPINE.md"
CARD="$CRAFT/quiz-question.card.md"
EXEMPLARS="$CRAFT/_exemplars.md"
MAX_BYTES=8200
used=520   # chrome allowance: header + banners + footer (measured ~500)

warn() { printf '!! CRAFT GATE WARNING: %s\n' "$1"; }

printf '=== CRAFT GATE — auto-injected every turn; on non-authoring turns, ignore ===\n\n'

# --- 1. Spine (always) ---
if [ -s "$SPINE" ]; then
  cat "$SPINE"
  used=$(( used + $(wc -c < "$SPINE") ))
else
  warn "_craft/CRAFT_SPINE.md missing/empty — craft floor NOT loaded. Read _craft/CRAFT_SPINE.md before writing any question this turn."
fi

# --- 2. Card digest ---
if [ ! -f "$CARD" ]; then
  warn "no card at $CARD — no digest injected. Read _craft/quiz-question.card.md before writing any question this turn."
else
  digest=$(sed -n '/<!-- digest:start -->/,/<!-- digest:end -->/p' "$CARD" | sed '1d;$d')
  if [ -z "$digest" ]; then
    warn "no digest block in quiz-question.card.md — Read the full _craft/quiz-question.card.md before writing any question this turn."
  else
    dsize=$(printf '%s\n' "$digest" | wc -c)
    if [ $(( used + dsize )) -gt "$MAX_BYTES" ]; then
      warn "size budget reached — the quiz-question digest was NOT injected; Read _craft/quiz-question.card.md before writing any question this turn."
    else
      printf '\n=== CARD DIGEST ===\n\n%s\n' "$digest"
      used=$(( used + dsize ))
    fi
  fi
fi

# --- 3. Exemplars (budget permitting) ---
# The card describes the voice; the exemplars ARE the voice, and they outrank the
# card where the two disagree. They fit inside MAX_BYTES today, so they ride
# along. If they ever stop fitting, the gate says so instead of quietly dropping
# the single most load-bearing input.
if [ ! -s "$EXEMPLARS" ]; then
  warn "_craft/_exemplars.md missing/empty — the target voice is NOT in context. Read it before writing any question this turn."
else
  esize=$(wc -c < "$EXEMPLARS")
  if [ $(( used + esize )) -gt "$MAX_BYTES" ]; then
    warn "size budget reached — exemplars NOT injected; Read _craft/_exemplars.md before writing any question this turn."
  else
    printf '\n=== EXEMPLARS — the highest-fidelity statement of the target voice ===\n\n'
    cat "$EXEMPLARS"
    used=$(( used + esize ))
  fi
fi

printf '\n=== END CRAFT GATE — run every unit against the through-lines, the ship tests, and the digest above (already in context; no Read needed). Full tests, kill list and micro-examples: _craft/quiz-question.card.md. After writing, question-lint.py runs on PostToolUse; the judgment calls it cannot make belong to the question-reviewer agent, run on batches of ~8. Heed any WARNING lines above. ===\n'
exit 0

#!/bin/sh
# craft-gate.sh — UserPromptSubmit hook: inject the question-authoring spine,
# the quiz-question card digest, and (budget permitting) the ACTIVE PACK's
# exemplars and world-pressures, every turn. Sibling to question-lint.py,
# opposite end of the turn: this injects doctrine BEFORE authoring, the linter
# checks the bank AFTER writing.
#
# Adapted from christian93kg/story-loop .claude/hooks/craft-gate.sh.
#
# HARD CONSTRAINT: total stdout must stay well under Claude Code's internal
# hook-output threshold (observed in the source repo: ~24KB gets persisted to a
# file with only a ~2KB preview reaching the model — which silently disables the
# gate). MAX_BYTES below is the single source of truth for this budget; the card
# and CLAUDE.md point here rather than restating a number. 8200 was the largest
# size proven to arrive inline (23.4KB proven truncated).
#
# RAISED 8200 -> 9000 on 2026-08-28, when the spine took on story-loop's
# "narrator stays out" and "perception over stated emotion" (+684 bytes against
# 113 of headroom) and the gate started dropping the exemplars. Dropping them is
# the worst available trade: a pack's exemplars outrank every rule in _craft/,
# and on the pass that added those through-lines it was the exemplars that caught
# a proposed rule as wrong. 9000 is NOT proven inline — 8200 remains the largest
# size actually observed arriving — but it sits ~2.6x below the ~24KB threshold
# where truncation was seen, and the failure mode is loud (the warning below).
# If a WARNING ever appears with the budget apparently unspent, suspect the
# real threshold is between 8200 and 9000 and put this back.
#
# ONE PACK'S WORLD MATERIAL AT A TIME, NEVER TWO. That is arithmetic before it is
# doctrine: measured steady state is 8902 bytes (star-wars) and 8753
# (harry-potter) with spine + digest + that pack's exemplars + its
# world-pressures. A second pack's exemplars are ~2.8KB against ~100-250 bytes of
# headroom, so two will never both fit. It is also correct — you author one pack
# per turn, and injecting the wrong world's voice is worse than injecting none.
# The chosen pack is PRINTED in the header so a wrong guess is self-correcting.
#
# THE BUDGET IS TIGHT. A new pack's exemplars + world-pressures must fit in ~3.6KB.
# If a section starts getting dropped, trim that pack's material — do not raise
# MAX_BYTES, which is a measured property of the harness, not a preference.
#
# Self-check:  sh .claude/hooks/craft-gate.sh </dev/null | wc -c
#   (redirect stdin, or the prompt sniff below blocks waiting on the terminal)
#   Expect no WARNING lines and six '=== ' banners.

VAULT="${CLAUDE_PROJECT_DIR:-.}"
CRAFT="$VAULT/_craft"
SPINE="$CRAFT/CRAFT_SPINE.md"
CARD="$CRAFT/quiz-question.card.md"
CRAFT_PACKS="$CRAFT/packs"
MAX_BYTES=9000

# Output is ACCUMULATED, not streamed, so the budget arithmetic is measured rather
# than estimated. The previous version carried a hand-tuned `used=620` chrome
# allowance for the banners and footer; it under-counted, and the gate emitted
# 9056 bytes while reporting no warning at all. A budget check that can be wrong
# in the silent direction is worse than no budget check — the whole point of
# MAX_BYTES is that overrun is loud. `add()` appends, `size()` measures, and the
# footer is reserved up front so the last section cannot push the total over.
out=""
add() { out="$out$1"; }
size() { printf '%s' "$out" | wc -c; }

warn() { add "$(printf '!! CRAFT GATE WARNING: %s\n' "$1")
"; }

# --- 0. Which pack's world are we authoring in? ---------------------------
#
# UserPromptSubmit passes the payload JSON on stdin, which this gate previously
# ignored. `[ -t 0 ]` keeps the documented self-check from blocking on a tty.
payload=""
[ -t 0 ] || payload=$(cat 2>/dev/null || true)

installed=$(ls -1 "$CRAFT_PACKS" 2>/dev/null | while read -r d; do
  [ -f "$CRAFT_PACKS/$d/vocabulary.md" ] && printf '%s\n' "$d"
done)
# grep -c already prints 0 on no match (and exits 1) — an `|| echo 0` fallback
# here emits "0\n0", which every later [ -eq ] rejects as an illegal number.
n=$(printf '%s\n' "$installed" | grep -c .)

pack=""; why=""

# 1. explicit env var
if [ -n "$CRAFT_PACK" ] && [ -f "$CRAFT_PACKS/$CRAFT_PACK/vocabulary.md" ]; then
  pack="$CRAFT_PACK"; why="CRAFT_PACK"
fi

# 2. named in the prompt — id or alias, adopted ONLY on a unique match. A prompt
#    mentioning two packs is ambiguous, and guessing is the failure this avoids.
if [ -z "$pack" ] && [ -n "$payload" ]; then
  lower=$(printf '%s' "$payload" | tr 'A-Z' 'a-z')
  # Aliases are read LINE BY LINE and matched whole. `for t in $terms` would
  # word-split every multi-word alias — "star wars" becomes two tokens, neither
  # of which matches anything, so the pack it names is silently never selected.
  # A silent miss is exactly what the "degrade loudly" contract forbids.
  # Each matching pack prints its id once; the outer capture counts them, so
  # ambiguity (two packs named) is visible instead of resolved by luck.
  hits=$(for d in $installed; do
    { printf '%s\n' "$d"
      sed -n '/^## aliases/,/^## /p' "$CRAFT_PACKS/$d/vocabulary.md" 2>/dev/null \
        | sed -n '/^```/,/^```/p' | sed '/^```/d'
    } | while IFS= read -r t; do
          t=$(printf '%s' "$t" | tr -d '"' | sed 's/^ *//; s/ *$//')
          [ -z "$t" ] && continue
          case "$lower" in *"$t"*) printf '%s\n' "$d"; break ;; esac
        done
  done | sort -u)
  c=$(printf '%s' "$hits" | grep -c .)
  if [ "$c" -eq 1 ]; then
    pack="$hits"; why="named in the prompt"
  elif [ "$c" -gt 1 ]; then
    why="ambiguous: $(printf '%s' "$hits" | tr '\n' ' ')"
  fi
fi

# 3. repo-local pointer
if [ -z "$pack" ] && [ -s "$VAULT/.claude/craft-pack" ]; then
  p=$(head -1 "$VAULT/.claude/craft-pack" | tr -d '[:space:]')
  [ -n "$p" ] && [ -f "$CRAFT_PACKS/$p/vocabulary.md" ] && { pack="$p"; why=".claude/craft-pack"; }
fi

# 4. only one installed
if [ -z "$pack" ] && [ "$n" -eq 1 ]; then
  pack=$(printf '%s\n' "$installed"); why="only pack installed"
fi

# 5. otherwise: do not guess.

FOOTER=$(printf '\n=== END CRAFT GATE — run every unit against the through-lines, the ship tests, and the digest above (already in context; no Read needed). Full tests, kill list and micro-examples: _craft/quiz-question.card.md. Vocabulary tiers for this pack: _craft/packs/%s/vocabulary.md. After writing, question-lint.py runs on PostToolUse; the judgment calls it cannot make belong to the question-reviewer agent, run on batches of ~8. Heed any WARNING lines above. ===' "${pack:-<id>}")
# Reserve the footer: it is always emitted, so the sections below must fit around
# it, not merely under MAX_BYTES on their own.
CAP=$(( MAX_BYTES - $(printf '%s\n' "$FOOTER" | wc -c) ))

add "$(printf '=== CRAFT GATE — auto-injected every turn; on non-authoring turns, ignore ===\n')
"
add "$(printf '=== pack: %s (%s) ===\n' "${pack:-NONE}" "${why:-unresolved}")

"

if [ -z "$pack" ]; then
  warn "$(printf '%s pack(s) installed (%s) and none selected — exemplars and world-pressures NOT injected. Set CRAFT_PACK=<id>, or write the id to .claude/craft-pack, then re-prompt. Read _craft/packs/<id>/exemplars.md and vocabulary.md before writing any question this turn.' \
    "$n" "$(printf '%s' "$installed" | tr '\n' ' ')")"
fi

# --- 1. Spine (always) ---
if [ -s "$SPINE" ]; then
  add "$(cat "$SPINE")
"
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
    sec="$(printf '\n=== CARD DIGEST ===\n\n%s\n' "$digest")
"
    if [ $(( $(size) + $(printf '%s' "$sec" | wc -c) )) -gt "$CAP" ]; then
      warn "size budget reached — the quiz-question digest was NOT injected; Read _craft/quiz-question.card.md before writing any question this turn."
    else
      add "$sec"
    fi
  fi
fi

# --- 3. Exemplars for the active pack (budget permitting) ---
# The card describes the voice; the exemplars ARE the voice, and they outrank the
# card where the two disagree. Section order below puts them ahead of the
# world-pressures deliberately: if the budget runs out, pressures (card material,
# restatable) are dropped before exemplars (the thing nothing else can restate).
if [ -n "$pack" ]; then
  EXEMPLARS="$CRAFT_PACKS/$pack/exemplars.md"
  if [ ! -s "$EXEMPLARS" ]; then
    warn "$EXEMPLARS missing/empty — the target voice is NOT in context. Read it before writing any question this turn."
  else
    sec="$(printf '\n=== EXEMPLARS (%s) — the highest-fidelity statement of the target voice ===\n' "$pack")
$(cat "$EXEMPLARS")
"
    if [ $(( $(size) + $(printf '%s' "$sec" | wc -c) )) -gt "$CAP" ]; then
      warn "size budget reached — exemplars NOT injected; Read $EXEMPLARS before writing any question this turn."
    else
      add "$sec"
    fi
  fi

  # --- 4. World-pressures for the active pack (budget permitting) ---
  VOCAB="$CRAFT_PACKS/$pack/vocabulary.md"
  if [ ! -s "$VOCAB" ]; then
    warn "$VOCAB missing/empty — no world-pressures. Read it before writing any question this turn."
  else
    pressures=$(sed -n '/^## world-pressures/,/^## /p' "$VOCAB" | sed '1d' | sed '/^## /d')
    if [ -z "$(printf '%s' "$pressures" | tr -d '[:space:]')" ]; then
      warn "no ## world-pressures section in $VOCAB — questions have nothing to trace to."
    else
      sec="$(printf '\n=== WORLD-PRESSURES (%s) — every question traces to one ===\n%s\n' "$pack" "$pressures")
"
      if [ $(( $(size) + $(printf '%s' "$sec" | wc -c) )) -gt "$CAP" ]; then
        warn "size budget reached — world-pressures NOT injected; Read $VOCAB before writing any question this turn."
      else
        add "$sec"
      fi
    fi
  fi
fi

add "$FOOTER
"

# Last line of defence, and the reason the accumulate-then-print shape is worth
# it: this is the ONE place that knows the real byte count. If it ever fires, the
# per-section arithmetic above is wrong — fix that, do not raise MAX_BYTES.
total=$(size)
if [ "$total" -gt "$MAX_BYTES" ]; then
  printf '!! CRAFT GATE WARNING: emitted %s bytes against MAX_BYTES=%s — the gate may have been truncated and silently disabled. Trim a section; do not raise the cap.\n' \
    "$total" "$MAX_BYTES"
fi

printf '%s' "$out"
exit 0

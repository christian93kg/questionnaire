<div align="center">

<h1>questionnaire</h1>

<p><b>A trait-axis personality quiz engine, currently running a 48-character Star Wars pack.</b><br>
Built with <a href="https://svelte.dev/docs/kit">SvelteKit</a>, deployed static to <a href="https://pages.github.com/">GitHub Pages</a>.<br>
Adding a character is adding one vector, not editing every question.</p>

[![Live site](https://img.shields.io/badge/▶_live_site-christian93kg.github.io-7ee787?style=for-the-badge&labelColor=0c0d0b)](https://christian93kg.github.io/questionnaire/)
[![Use this template](https://img.shields.io/badge/use_this_template-→-e3b341?style=for-the-badge&labelColor=0c0d0b)](https://github.com/christian93kg/questionnaire/generate)

![SvelteKit](https://img.shields.io/badge/SvelteKit-static-a3a89b?style=flat-square&labelColor=0c0d0b)
![Audit](https://img.shields.io/badge/roster-audit_gated-a3a89b?style=flat-square&labelColor=0c0d0b)
![Characters](https://img.shields.io/badge/characters-48-a3a89b?style=flat-square&labelColor=0c0d0b)
![License](https://img.shields.io/badge/license-MIT-a3a89b?style=flat-square&labelColor=0c0d0b)

</div>

---

## Why this exists

Most "which character are you" quizzes are a decision tree with a costume on: a handful of hand-authored branches that dead-end in whichever result the author remembered to write for that path. Adding character 49 means re-threading every branch that could lead to it, so nobody ever does — the roster ossifies at whatever size the launch build shipped with.

This one scores differently. Every question moves you along seven psychological axes — `order`, `candor`, `warmth`, `defiance`, `hope`, `ambition`, `volatility` — and every character is just a point in that same seven-dimensional space. Matching is a distance calculation, not a lookup table. **Adding a character means adding one vector.** No question gets touched, no branch gets re-threaded.

The axes themselves are the interesting design constraint: none of them is good/evil in disguise. Each one has to have canonical heroes *and* villains at both poles, or it gets cut — an eighth axis (`sacrifice`) was tried and dropped for exactly this reason, because it kept collapsing into a morality proxy. `order` isn't legitimacy (Vader is ordered and deferent; Luthen is ordered and defiant). `hope` isn't goodness (Syril Karn believes desperately; Cassian doesn't — a hopeful villain is what proves the axis is real).

---

## Watch it work

A run against the 34-question tier, condensed:

```
you →  z-scored, soft-clipped vector across 7 axes
       order -0.8   candor +1.4   warmth +0.3   defiance +2.1
       hope  +0.6   ambition -1.1   volatility +1.8

engine →  weighted cosine similarity against 48 character vectors,
          plus a 15% magnitude-agreement term so a muted profile
          doesn't get matched to a character who is just loud

winner →  Cassian Andor · cosine 0.87 · confidence: unambiguous (0.81)
crew   →  Kleya Marsh, Luthen Rael, Mon Mothma  (closest matches that
          aren't restatements of the winner — capped at cosine 0.90)
opposite → the character furthest from you in the same space

decisive answers → the 3 questions that moved the result most,
                    found by jackknife: rerun the scorer with each
                    answer neutralised and see how much the lead moves
```

Every result also ships a shareable URL that round-trips your answers — no account, no server-side state.

---

## How the scoring actually works

This is the part worth reading if you're going to touch `src/lib/engine/score.ts`.

1. **Each question moves several axes at once**, not just its "primary" one. Answers accumulate into a raw per-axis total (`src/lib/engine/score.ts` `accumulate`), normalized by *coverage* — half the range that axis's options could have moved, summed across every question asked. This is what makes an axis asked once and an axis asked eight times comparable, and what keeps a heavily-asked axis from silently dominating the profile chart.
2. **The result is z-scored against the roster's own mean and standard deviation** (`deriveStats`), then soft-clipped at 2.5σ with `tanh` so one extreme answer can't blow out the whole vector.
3. **Matching is weighted cosine similarity** between your z-vector and each character's z-vector, axis weights scaled by `sqrt(coverage / maxCoverage)` so short quiz tiers don't let an under-asked axis swing the result. Cosine alone is scale-invariant — it can't tell "mildly ordered" from "extremely ordered" apart, which is a problem for characters who are moderate on paper but the *comparison point* for that trait. To fix that, **15% of the score is a magnitude-agreement term** (`BETA = 0.15`) that rewards a character whose vector length matches yours, not just its direction.
4. **A per-character "gravity" exponent** (solved by `npm run calibrate`, stored in `calibration.json`) pulls the score toward or away from 1.0 so rare/common results land at their intended share of the roster, without touching the raw cosine math.
5. **Confidence comes from a jackknife pass**, not a single number pulled out of the air: the scorer reruns with each answer neutralized (replaced with that question's own option centroid) and checks how often the winner still wins and how much the lead moves. That's also how "decisive answers" — the 3 answers that moved your result the most — get found.
6. **Crew and opposite are derived, not authored.** Crew is the closest non-winner results, but two picks that are cosine > 0.90 to each other or to the winner get filtered — "closest matches" isn't interesting if it's three restatements of the same result. Opposite is whoever's cosine to you is most negative.

None of this is fandom-specific. `score.ts` never mentions Star Wars — it only knows about `axes`, `characters`, and `questions` as declared by a `QuizPack`.

---

## The audit gates

A roster this data-driven can silently degrade — two characters becoming indistinguishable, an axis nobody's differentiated on, a character no answer set can ever produce. `npm run audit` (`scripts/audit.ts`) checks the whole roster against five gates and runs in CI on every push:

| Gate | Threshold | Catches |
|---|---|---|
| **Axis correlation** | max \|r\| ≤ 0.62 across the roster | Two axes measuring the same thing — re-author one or merge them |
| **Effective dimensionality** | participation ratio ≥ 4.0 of 7 axes | Characters clustered on a few axis combinations instead of spanning the space |
| **Twins** | no character pair > cosine 0.90 | Two characters that can never be the more interesting result relative to each other |
| **No generalists** | every character ≥ 2 axes at or below −35 | A character sitting near the centroid, weak on everything, losing every cosine comparison |
| **Reachability** | every character provably wins for *some* answer set | A character no one can ever actually get, confirmed by coordinate-ascent search then re-verified against the real scorer (not just the search's own arithmetic) |

`structure` is a sixth, non-negotiable check ahead of these five — schema, ids, tiers, and calibration coherence — that fails loud rather than producing a confusing downstream gate failure.

---

## Adding a fandom pack

The engine (`src/lib/engine/`) has no fandom awareness. A pack (`src/lib/packs/<pack-id>/`) is four files:

| File | Declares |
|---|---|
| `axes.ts` | The trait axes for this fandom — pick your own set, your own count, your own poles. Nothing forces seven. |
| `characters.ts` | Each character's `vector` across those axes, plus `blurb`, `strength`, `blindspot`, and roster-QA metadata. |
| `questions.ts` | Options that move axes, tagged with the smallest `tier` (`short`/`medium`/`long`) that includes them. |
| `index.ts` | Wires the above into a `QuizPack`, plus `calibration.json` (roster mean/sd, per-axis weights, per-character gravity — solved, not hand-tuned, by `npm run calibrate -- <pack-id>`). |

Register it in `src/lib/packs/index.ts`'s `PACKS` array and it's live at `/<pack-id>`. Run `npm run audit -- <pack-id>` before shipping it — same five gates, new roster. A Harry Potter pack is the planned second instance of this.

---

## Local dev

```bash
npm install
npm run dev              # local server
npm run audit             # roster lint gates (also runs pre-build)
npm run calibrate -- star-wars   # solve axis weights + per-character gravity
npm test                  # vitest
```

`npm run check` runs `svelte-check`; `npm run build` produces the static site in `build/` (this is also what CI deploys).

---

## Credits & license

- **Live site** — [christian93kg.github.io/questionnaire](https://christian93kg.github.io/questionnaire/)
- **Origin** — started as a single-file HTML/JS prototype; the pack/engine split, z-scored cosine scoring, calibration solver, and audit gates all came after, once "add a character" stopped being cheap enough to keep doing by hand.
- **Character art** — procedurally generated from each character's trait vector (`src/lib/engine/glyph.ts`). No third-party artwork is used or redistributed.
- **Font** — social cards are rendered with [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono), © 2020 The JetBrains Mono Project Authors, under the SIL Open Font License 1.1. The font is aggregated with, not merged into, this project; its license travels with it in [`scripts/og/fonts/OFL.txt`](scripts/og/fonts/OFL.txt).
- **License** — MIT, see [`LICENSE`](LICENSE). It covers this repository's code and generated assets, and grants no rights in third-party trademarks.
- Not affiliated with, authorized, or endorsed by Lucasfilm Ltd. or The Walt Disney Company. *Star Wars* and all associated names and marks are the property of Lucasfilm Ltd., used here nominatively to identify the fictional works discussed.

<div align="center">
<br>

**[Take the quiz →](https://christian93kg.github.io/questionnaire/)** · **[Use this template →](https://github.com/christian93kg/questionnaire/generate)**

</div>

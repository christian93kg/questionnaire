---
type: design_prompt
target: src/routes/+page.svelte
---

# Design prompt — the landing page

Paste everything below the line into Claude Design. Unlike the per-quiz prompts, this one
does **not** produce a `PackTheme` — the landing page deliberately has no theme of its own.
The deliverable is layout and card anatomy.

---

## The brief

Design the front page of a site that hosts several personality questionnaires. Right now
there are two — a Star Wars one and a Harry Potter one — and there will be more. The page
does one job: **list what is available and get out of the way.**

### The governing idea

The landing page is the hallway. Each quiz's theme is the room behind its door.

That is a design constraint, not a metaphor. Every quiz on this site is dressed as the thing
it is about — the Star Wars one is a cold holo-blue intake terminal, the Harry Potter one is
warm ink and candlelight — and the moment of arriving on one should be a small surprise. A
front page that announces a world of its own spends that surprise before the user has
chosen. It also ages badly: whatever character the hallway has will belong to whichever quiz
came first, and will look increasingly arbitrary as others are added.

So: **plain, quiet, and confidently unstyled.** Restraint is the brief, not a lack of one.

### What you may and may not use

The page inherits the site's shared type scale, spacing scale, timing and radius, and it
paints with the *default* pack's colour tokens (currently the Star Wars set) referenced only
as `var(--…)`. You are not choosing colours. If a future default changes, this page should
follow it without edits.

- No logo, no hero image, no illustration, no per-quiz colour on the cards.
- No screenshot or preview of a quiz's interior.
- Nothing that implies a ranking, a "featured" slot, or a recommended starting point. The
  quizzes are peers.

### The content

A short header, then one card per quiz.

Header: a small uppercase eyebrow, a large uppercase display-face title, and one sentence of
lede explaining what these are. The current lede is:

> Each one scores what you do under pressure against a roster of characters, not four boxes.
> No sign-in. Nothing leaves this device.

Each card is a link to `/<quiz-id>/` and carries exactly this, and no more:

| Field | Example | Note |
|---|---|---|
| form code | `R-77`, `HG-01` | short, monospaced, the only accent-coloured element |
| title | "Who would you be in Star Wars?" | the display face; may wrap to two lines |
| stats | "48 results · 34 questions · from ~2 min" | one line, metadata colour |
| eyebrow | "Standing intake", "School register" | the quiz's own framing, one line |
| affordance | a right-pointing arrow | indicates it is tappable |

### The layout question you must answer

**How does this page behave at two, three, four and eight quizzes?**

The column is **460px maximum, mobile-first**, and there is no wide layout. That is narrower
than two readable cards side by side, so a grid that reflows to two columns would stack the
third and fourth quiz into an unreadable 2×2 on a phone. State explicitly what you do:

- Does the list stay single-column at every count? (The current implementation does.)
- If you introduce grouping, sorting or a filter, at what count does it appear, and what
  does the page look like the moment *before* that threshold?
- Does the card shrink as the list grows, or does the page just get longer?

An answer that only addresses the two-quiz case is not an answer — the page exists precisely
because more are coming.

### Hard constraints

- Dark surfaces only; there is no light mode.
- Every value is a `var(--…)` reference to the shared tokens. If you need a value that has
  no token, say which token you would add and why — do not hard-code it.
- Fully keyboard navigable; the cards are `<a>` elements inside a list, with a visible
  `:focus-visible` ring.
- `prefers-reduced-motion` is honoured globally, so hover and press states must read without
  motion.
- The page is prerendered as static HTML. Nothing may depend on JavaScript to be legible or
  clickable.

---

## The deliverable

1. **A layout spec** for the header and the card list, in shared-token terms (spacing steps,
   type steps, which tokens each element uses). Not pixel values — token names.
2. **Card anatomy**, including the resting, hover, focus and pressed states.
3. **Your answer to the scaling question above**, with a mock at two, four and eight quizzes.
4. **Any token you would add** to the shared scale, with the reason. Adding one is allowed;
   adding one silently is not.
5. **At most 150 words** on why your version reads as a hallway rather than as a quiz.

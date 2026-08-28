---
type: design_prompt
target: src/lib/packs/harry-potter/theme.ts
---

# Design prompt — the Harry Potter questionnaire

Paste everything below the line into Claude Design (or any design tool). It is written to
produce something that can be **pasted straight into the code**: the deliverable is a filled
`PackTheme` object using the exact field names the app consumes, not a mood board.

Why that matters: `src/lib/engine/theme.ts` renders a pack's theme twice — once into CSS
custom properties for the browser, once through Oklab into sRGB for the social-card
renderer, which cannot parse `oklch()`. A design expressed as anything other than those
fields has to be transcribed by hand, and a transcription is a second source of truth. The
whole theming layer exists to avoid having one.

---

## The brief

You are designing the visual theme for the **second** quiz on a site that hosts several
personality questionnaires. Each quiz is scored the same way and rendered by the same
components; what makes each one feel like its own product is entirely the theme.

The site asks *"Who would you be at Hogwarts?"* and scores the taker against a roster of 47
characters across seven trait axes. It is not a Sorting Hat gimmick — the questions are
about what you do under pressure, and the result is a person, not a house.

### What already exists, and what you must not do

The first quiz is Star Wars, themed as a **holo-blue intake terminal**: near-black blue
surfaces (`#080b0f`), a cyan accent (`oklch(0.8 0.075 225)`), a monospaced body face, a CRT
scanline overlay, and a `holo-rise` entrance animation. It reads like a screen in a dark
room.

Two failure modes to avoid, in order of how bad they are:

1. **The Star Wars terminal in a different hue.** If your design is the same scanline
   terminal with amber instead of cyan, the two quizzes are one quiz with a colour picker.
   The structures must differ, not just the values — the texture, the type, the motion.
2. **Purple-wizard clipart.** No lightning bolts, no gold-on-purple, no "magical sparkle,"
   no faux-medieval blackletter. This is not merchandise.

### The register to design into

Ink, parchment, candle, and a late-night library. A school that is also a jurisdiction: a
register that gets opened, written in, and closed. Warm rather than cold, front-lit rather
than back-lit, low rather than bright. Paper texture rather than screen texture — if you use
a repeating line pattern, it should read as the faint rule of a ruled page, not as a CRT.

Where the Star Wars theme is a machine recording you, this one is a person writing you down.

### The three page types you are theming

All three are a single centred column, **460px maximum measure**, mobile-first. There is no
wide layout and no sidebar.

1. **Tier picker** (`/harry-potter/`) — an eyebrow line and form code, a large uppercase
   display-face title, two paragraphs of lede, then three tappable cards: question count,
   tier name, "N questions · ~M min", and a one-line blurb, with a right-pointing arrow.
2. **Question page** (`/harry-potter/quiz/long/`) — a progress indicator, a one-or-two
   sentence situation, and exactly four tappable options as full-width rows. Keyboard `1`–`4`
   selects; `Backspace` goes back. Between chapters, a full-screen interstitial with a
   section label and a blurb. This is the screen a taker sees 34 times, so it has to stay
   comfortable at length — this is where a high-contrast, high-chroma theme fails.
3. **Result card** (`/harry-potter/r/luna/`) — the character name in the display face with a
   text glow, an epithet, a rarity chip, blurb / strength / blindspot, an axis profile with
   seven labelled poles, a "crew" of three related characters, an opposite, a confidence
   band, and a share button.

### Hard constraints

- **No photography and no illustration.** Character art is generated procedurally from the
  taker's axis vector as a contour drawing, and it inherits `--accent-primary`. Do not design
  around imagery that does not exist.
- **Dark surfaces only.** There is no light mode. The four surface tokens are near-black by
  design; the warmth has to come from hue, not from lightness. **This is the trap in this
  brief** — "parchment" describes the *register*, not the background. A parchment-cream
  `bgBase` is a light-mode page. The audit now enforces this: every surface must have sRGB
  relative luminance **below 0.15** (the shipped `#080b0f` is 0.003).
- **Accents and text are `oklch` triples**, so one set of numbers renders both the CSS and
  the sRGB social card. Note what this does *not* give you: the audit range-checks L, C and
  H but does not gamut-check, and the sRGB converter silently clamps an out-of-gamut colour
  rather than erroring — so an extreme chroma will render differently on the card than in
  the browser and nothing will tell you. Keep chroma conservative. Surfaces are plain sRGB
  hex; at that lightness oklch buys nothing.
- **`prefers-reduced-motion` is honoured globally.** Both animations you specify must be
  decorative; nothing may depend on motion to be legible.
- **Contrast**, on `--bg-base`: `--text-primary` must clear **4.5:1** (WCAG AA body text);
  `--text-secondary` carries the lede and the result blurbs, so it must clear **4.5:1** too;
  `--text-faint` is metadata only and must clear **3:1**. State the three ratios you hit.
  None of these is machine-checked — they are on you.
- The type scale, spacing scale, durations, easing and radius are **shared across all
  quizzes** and are not yours to change. You are theming colour, type *face*, texture and
  motion only.

---

## The deliverable

Return **exactly this object, filled in**, plus the two `@keyframes` and a short rationale.
Field names and units are fixed.

```ts
export const THEME: PackTheme = {
  // Perceptual lightness 0..1, chroma 0..0.5, hue in degrees 0..359.
  accentPrimary:   [L, C, H],   // the one colour that carries the theme
  accentSecondary: [L, C, H],   // second colour: axis poles, the "opposite" card
  textPrimary:     [L, C, H],   // body text — must clear 4.5:1 on bgBase
  textSecondary:   [L, C, H],
  textFaint:       [L, C, H],   // metadata only

  bgBase:         '#rrggbb',    // the page
  surfaceSunk:    '#rrggbb',    // behind the column / overscroll
  surfaceRaised:  '#rrggbb',    // option rows, tier cards
  surfaceRaised2: '#rrggbb',    // the same, hovered or pressed

  // color-mix() proportions, as whole percentages 0..100.
  mix: {
    ruleHairline: N,       // accentPrimary over transparent — 1px rules
    ruleStrong: N,         // heavier dividers
    accentPrimaryDim: N,   // accentPrimary over bgBase — filled chips
    accentSecondaryDim: N,
    glowSoft: N,           // box-shadow colour
    glowText: N,           // text-shadow colour
    scanline: N            // the repeating line overlay — keep this LOW
  },

  glow:     { softBlurPx: N, textBlurPx: N },
  scanline: { stripePx: N, periodPx: N },   // an N-px line repeating every M px

  fontDisplay: "<css font stack>",  // headings, character names, counts
  fontMono:    "<css font stack>",  // BODY FACE. The name is inherited from the first
                                    // pack, where the body happened to be monospaced.
                                    // It does not have to be a monospace here.

  anim: { enter: '<keyframes-name>', idle: '<keyframes-name>' }
};

export const CHROME: PackChrome = {
  label: '<the shell header, left>',       // Star Wars uses 'Holo-record · intake'
  status: {                                 // shell header, right — route-driven
    idle: '<ALL CAPS>',                     // on the tier picker
    inProgress: '<ALL CAPS>',               // mid-quiz
    sealed: '<ALL CAPS>'                    // on a result
  }
};
```

**System-font stacks only.** The site loads no web fonts on the critical path, so name real
stacks with fallbacks, e.g. `"'Iowan Old Style', Palatino, Georgia, serif"`.

Also return:

- **Two `@keyframes` blocks** for `anim.enter` (a page entrance, ~420ms, runs once) and
  `anim.idle` (a slow ambient loop on the result card, ~6s). Give them names that could only
  belong to this theme. They must be visibly different in *kind* from the Star Wars pair —
  a translate-and-fade and an opacity flicker — not the same shapes retimed.
- **A rationale of at most 200 words**: what the theme is, which decision makes it read as a
  library rather than a terminal, and the contrast ratios for `textPrimary`, `textSecondary`
  and `accentPrimary` on `bgBase`.

## How it will be checked

Your values are validated before they can ship, so the numbers have to be real:

- `npm run audit` rejects an oklch lightness outside 0..1, a chroma above 0.5, a hue outside
  `[0, 360)` — **360 itself fails, the check is `hue < 360`, so use 0 for red** — a mix
  percentage outside 0..100, a surface that is not `#rrggbb` or whose sRGB relative
  luminance exceeds 0.15, and an empty animation name or font stack.
- `scripts/og/palette.test.ts` re-derives every colour independently through Oklab → sRGB
  and asserts it matches what the browser gets from the shipped CSS. A colour form it cannot
  model throws rather than silently rendering the social card in the wrong colour.
- The theme is emitted into a `:root {}` block in the prerendered HTML, so anything that
  could close a CSS rule is rejected at build time.

# Composing a landing page with Pane

Pane's landing sections are one-file blocks in `src/components/blocks/landing-*.tsx`. Each renders a finished section
with no props, takes every word as plain props (strings, numbers, booleans, arrays and objects of those) and exports
its props type and a `DEFAULT_<NAME>` constant. Pictures and product mocks go in optional `media` slots; without one,
the section draws a quiet built-in mock. The owner assembles pages visually at https://paneui.vercel.app/#/landing-builder
and exports a page file, an install command or a prompt; this guide is for building the same thing by hand.

Install: `npx shadcn@latest add https://paneui.vercel.app/r/<slug>.json` (one URL per section), or ask the Pane MCP
server (https://paneui.vercel.app/api/mcp) for each section's props first.

## The sections and what each is for

| Slug | Job | Key props |
| --- | --- | --- |
| `landing-nav` | Slim top bar: brand, 3–5 links, a sign-in link, one button. Sticky. | `brand`, `links`, `textLink`, `action` |
| `landing-hero` | The promise: two-tone headline, one sentence, two buttons, proof points, a playing mock. | `headline: [line, mutedLine]`, `description`, `primaryAction`, `layout`, `panel` |
| `landing-proof` | Evidence without logos: 2–4 figures with a source line, 1–2 quotes. | `figures`, `source`, `quotes`, `show` |
| `landing-steps` | How it works: heading, side note, three cards that each play a small mock. | `title`, `titleMuted`, `note`, `steps` |
| `landing-feature-rows` | Two or three alternating deep dives: headline, paragraph, ticked points, a panel. | `rows[].title` ("\n" = second line), `rows[].mock` |
| `landing-feature-grid` | Breadth: a hairline grid of 3–6 features and one wide row. | `features[].icon`, `wide`, `columns` |
| `landing-audience` | Two or three kinds of customer, one card each. | `audiences[].label`, `promise`, `points` |
| `landing-pricing` | Plans with a monthly / yearly switch, or a teaser with one plan beside the copy. | `layout`, `plans`, `billing` |
| `landing-faq` | The objections, answered: heading and note left, accordion right. | `items[].question`, `answer` |
| `landing-cta` | The closing ask: a filled band with headline, paragraph, two buttons. | `headline`, `tone`, `layout` |
| `landing-footer` | Brand line, social icons, link columns, copyright. | `columns`, `socials`, `copyright` |

`logo-marquee` and `testimonial-wall` also fit a landing page, but both move continuously; use at most one, and only
with real customers.

## Recommended orders

- **AI product** (the full story): nav, hero, proof, steps, feature rows, feature grid, pricing, faq, cta, footer.
- **Developer tool**: nav, hero (`panel="soft"`), steps, feature rows, feature grid, pricing (`layout="teaser"`),
  faq, cta (`tone="ink"`), footer.
- **Agency or service**: nav, hero, audience, steps (the process), feature grid (the services), pricing (fixed
  prices, `billing={false}`), faq, cta, footer.
- **Waitlist** (short): nav, hero (`layout="centered"`), feature grid (three features, `wide={null}`), faq,
  cta (`layout="centered"`), footer.

Rules of thumb: the hero makes the promise, proof backs it within one scroll, steps explain the mechanism, rows go
deep on two or three things, the grid shows breadth, pricing and FAQ remove the last doubts, the CTA repeats the one
action. Leave a section out rather than fill it with filler. Give sections an `id` so nav links (`#pricing`) land.

## Copy rules

- **Two-tone headline**: a plain first line and a muted second line that turns it, e.g. "Ask your data." / "See how
  it answered." Keep each line short enough to fit on one line in the split hero at 1280px (about 22 characters).
- **One sentence** under a headline: what the product does, for whom, and the concrete mechanism. No second paragraph.
- **Specific proof**: numbers with units and a source line ("Medians across 60 teams, 2026"), quotes with a name,
  role and company. Never "Trusted by 10,000+ teams" or unsourced stars.
- **Buttons say the action**: "Connect a warehouse", "Book a call". One primary and at most one secondary.
- **Invented content only** in demos and presets (Northwind, Harbor & Finch; agents Atlas, Quill, Sage). No real
  brands or logos.
- Plain words: no supercharge, seamless, unlock, magic, revolutionize; no exclamation marks; no trailing periods on
  buttons and labels.

## Motion rule

Sections arrive once: their parts rise 12–16px and fade in with a 60–80ms stagger when they scroll into view, a mock
plays its short story once when visible, and a button answers a press. Nothing loops for decoration. With
`prefers-reduced-motion` everything is simply there. Every section takes `reveal={false}` to switch arrival off.

## Brand and accent

Every section reads Pane's accent token. Set it once in global CSS and let the sections follow:

```css
:root { --pane-accent: #4338ca }
.dark { --pane-accent: #7b74da } /* lifted so it reads on a dark page */
```

Accent-filled buttons draw white text; for a light accent, set the section's own variable, e.g.
`html .lhr { --lhr-on-accent: #0a0a0a }` (hero), `--lfr-on-accent` (feature rows), `--lpr-on-accent` (pricing).
Sections follow a `.dark` class or `data-theme="dark"` on an ancestor and design their own Mono and Glass looks.

## The owner's slop list (never ship these)

- Tinted notice boxes, coloured pills, "New" or "Beta" badges.
- Emoji, sparkles for anything AI, gradient text, glows, blurred colour blobs behind content.
- Italicised accent words; a serif display face with negative kerning as decoration.
- Section numbering when the content is not a real sequence.
- Over-detailed fake UI; mocks stay small, quiet and abstract.
- Dividers and bordered containers around everything; a rainbow of shades and opacities.
- More than one accent colour, or the accent used everywhere so nothing leads.
- Hype headlines that fit any product; stacks of three or more buttons.

Check the finished page against `~/.claude/skills/unslop/references/signs.md` and screenshot it at 1440 and 390,
light and dark, before calling it done.

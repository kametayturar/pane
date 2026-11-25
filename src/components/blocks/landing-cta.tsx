"use client"

/**
 * Landing CTA – the closing band of a product landing page.
 *
 * A large rounded panel with a fine dotted texture holds a two-line headline (the second line muted), one
 * paragraph, a primary and a secondary button, a small reassurance line and an optional row of two to four
 * small text links. On the right sits the media slot. With no `media`, it shows a small card with three
 * setup rows that tick themselves off one after another when the band scrolls into view, then settle.
 *
 * ```tsx
 * <LandingCta
 *   headline={["Monday's queue,", "already drafted."]}
 *   description="Connect your support inbox. Atlas drafts every reply and waits for your approval."
 *   primaryAction={{ label: "Start free", href: "/signup" }}
 *   secondaryAction={{ label: "Book a demo", href: "/demo" }}
 *   reassurance="No card needed."
 *   links={[{ label: "For support leads", href: "/leads" }]}
 *   tone="accent" layout="split"
 * />
 * ```
 *
 * `tone` picks the panel: the accent colour, near-black ink, or a soft neutral panel with dark text. `layout`
 * "centered" drops the media and centres the copy. Every text colour on every tone keeps a 4.5:1 contrast
 * ratio in Classic, Mono and Glass, light and dark. Content is plain data (`DEFAULT_LANDING_CTA`), so a page
 * builder can edit and save it as JSON. The band rises in once; `reveal={false}` or reduced motion shows it still.
 */

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingCtaLink = {
  label: string
  href: string
}

export type LandingCtaMockRow = {
  /** The task, e.g. "Connect your inbox". */
  label: string
  /** A short line under it, e.g. "Gmail, about 2 minutes". */
  detail: string
}

/** The words inside the built-in mock: a small checklist that completes itself. */
export type LandingCtaMock = {
  /** Card title, e.g. "Getting started". */
  title: string
  /** Shown top right once all rows are ticked, e.g. "All set". */
  done: string
  /** The three rows. The first three are shown. */
  rows: LandingCtaMockRow[]
}

export type LandingCtaContent = {
  /** Two lines: the second is muted. One string gives a one-line headline. */
  headline?: [string, string?]
  /** One paragraph under the headline. Empty to hide. */
  description?: string
  /** The light button. `null` hides it. */
  primaryAction?: LandingCtaLink | null
  /** The outlined button. `null` hides it. */
  secondaryAction?: LandingCtaLink | null
  /** Small reassurance line under the buttons. Empty to hide. */
  reassurance?: string
  /** Two to four small text links under everything. More are cut to four; empty hides the row. */
  links?: LandingCtaLink[]
  /** Words for the built-in mock (merged over the default). Ignored when `media` is set. */
  mock?: Partial<LandingCtaMock>
}

export type LandingCtaProps = LandingCtaContent & {
  /** Your own picture or product mock, shown on the right instead of the built-in checklist. */
  media?: React.ReactNode
  /** "accent" fills the panel with the accent colour, "ink" with near-black, "soft" is a neutral panel with dark text. Default "accent". */
  tone?: "accent" | "ink" | "soft"
  /** "split" puts the copy left and the media right; "centered" drops the media and centres the copy. Default "split". */
  layout?: "split" | "centered"
  /** Level of the headline element. Default 2. */
  headingLevel?: 2 | 3
  /** Max content width in px. Default 1200. */
  width?: number
  /** Rise and fade the band in once when it enters the viewport. Default true. */
  reveal?: boolean
  /** Id of the section element. */
  id?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_LANDING_CTA_MOCK: LandingCtaMock = {
  title: "Getting started",
  done: "All set",
  rows: [
    { label: "Connect your inbox", detail: "Email or help desk, 2 minutes" },
    { label: "Open a first ticket", detail: "Atlas drafts the reply" },
    { label: "Approve the reply", detail: "Send it as is, or edit a line" },
  ],
}

export const DEFAULT_LANDING_CTA = {
  headline: ["Monday's queue,", "already drafted."],
  description: "Connect your support inbox. Atlas drafts a reply to every open ticket and waits for someone on your team to approve it.",
  primaryAction: { label: "Start free", href: "#start" },
  secondaryAction: { label: "Book a demo", href: "#demo" },
  reassurance: "No card needed. 100 tickets a month are free.",
  links: [
    { label: "For support leads", href: "#leads" },
    { label: "Moving from another help desk", href: "#switch" },
    { label: "Security", href: "#security" },
  ],
  mock: DEFAULT_LANDING_CTA_MOCK,
} satisfies Required<LandingCtaContent>

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lcta {
  --lcta-ink: #000;
  --lcta-surface: #fff;
  --lcta-accent: var(--pane-accent, #0060e2);
  --lcta-ease: cubic-bezier(.22, 1, .36, 1);
  --lcta-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --lcta-hk: 1;
  --lcta-hls: -.036em;
  --lcta-r-btn: 10px;
  --lcta-r-card: 14px;
  --lcta-r-panel: 24px;
  /* the panel (accent tone by default) */
  --lcta-bg: color-mix(in oklab, var(--lcta-accent) 88%, #000);
  --lcta-ring: transparent;
  --lcta-dot: rgb(255 255 255 / .24);
  --lcta-p1: #fff;
  --lcta-p2: rgb(255 255 255 / .9);
  --lcta-p3: rgb(255 255 255 / .78);
  --lcta-btn-bg: #fff;
  --lcta-btn-fg: var(--lcta-bg);
  --lcta-btn-hover: color-mix(in oklab, #fff 90%, var(--lcta-bg));
  --lcta-out: rgb(255 255 255 / .42);
  --lcta-out-hover: rgb(255 255 255 / .1);
  --lcta-focus: #fff;
  /* the mock card */
  --lcta-c1: color-mix(in oklab, var(--lcta-ink) 90%, transparent);
  --lcta-c2: color-mix(in oklab, var(--lcta-ink) 62%, transparent);
  --lcta-fill: color-mix(in oklab, var(--lcta-ink) 6%, transparent);
  --lcta-line: color-mix(in oklab, var(--lcta-ink) 9%, transparent);
  --lcta-tick: var(--lcta-accent);
  --lcta-card-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 6px -2px rgb(0 0 0 / .12), 0 22px 44px -18px rgb(0 0 0 / .4);
  position: relative;
  display: block;
  width: 100%;
  container: lcta / inline-size;
  font: 15px/24px var(--lcta-font);
  color: var(--lcta-p1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lcta {
  --lcta-ink: #fff;
  --lcta-surface: #1c1c1e;
  --lcta-accent: var(--pane-accent, #4d8dff);
  --lcta-bg: color-mix(in oklab, var(--lcta-accent) 58%, #000);
  --lcta-dot: rgb(255 255 255 / .18);
  --lcta-btn-hover: color-mix(in oklab, #fff 88%, var(--lcta-bg));
  --lcta-c1: color-mix(in oklab, var(--lcta-ink) 92%, transparent);
  --lcta-c2: color-mix(in oklab, var(--lcta-ink) 64%, transparent);
  --lcta-fill: color-mix(in oklab, var(--lcta-ink) 8%, transparent);
  --lcta-line: color-mix(in oklab, var(--lcta-ink) 10%, transparent);
  --lcta-tick: color-mix(in oklab, var(--lcta-accent) 80%, #000);
  --lcta-card-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 6px -2px rgb(0 0 0 / .45), 0 22px 44px -18px rgb(0 0 0 / .75);
}

/* ink: near-black, a hairline ring in dark mode so it still reads as a panel */
.lcta[data-tone="ink"] { --lcta-bg: #111113; --lcta-dot: rgb(255 255 255 / .16); --lcta-out: rgb(255 255 255 / .34) }
:is(.dark, [data-theme="dark"]) .lcta[data-tone="ink"] { --lcta-bg: #121214; --lcta-ring: rgb(255 255 255 / .1) }

/* soft: a neutral panel with dark text and a filled accent button */
.lcta[data-tone="soft"] {
  --lcta-bg: color-mix(in oklab, var(--lcta-ink) 3.5%, var(--lcta-surface));
  --lcta-ring: color-mix(in oklab, var(--lcta-ink) 5%, transparent);
  --lcta-dot: color-mix(in oklab, var(--lcta-ink) 15%, transparent);
  --lcta-p1: color-mix(in oklab, var(--lcta-ink) 90%, transparent);
  --lcta-p2: color-mix(in oklab, var(--lcta-ink) 66%, transparent);
  --lcta-p3: color-mix(in oklab, var(--lcta-ink) 60%, transparent);
  --lcta-btn-bg: var(--lcta-accent);
  --lcta-btn-fg: #fff;
  --lcta-btn-hover: color-mix(in oklab, var(--lcta-accent) 88%, #000);
  --lcta-out: color-mix(in oklab, var(--lcta-ink) 16%, transparent);
  --lcta-out-hover: color-mix(in oklab, var(--lcta-ink) 4%, transparent);
  --lcta-focus: var(--lcta-accent);
  --lcta-card-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .05), 0 16px 36px -16px rgb(0 0 0 / .2);
}
:is(.dark, [data-theme="dark"]) .lcta[data-tone="soft"] {
  --lcta-bg: color-mix(in oklab, var(--lcta-ink) 7.5%, #0a0a0a);
  --lcta-ring: color-mix(in oklab, var(--lcta-ink) 6%, transparent);
  --lcta-dot: color-mix(in oklab, var(--lcta-ink) 14%, transparent);
  --lcta-p1: color-mix(in oklab, var(--lcta-ink) 92%, transparent);
  --lcta-p2: color-mix(in oklab, var(--lcta-ink) 68%, transparent);
  --lcta-p3: color-mix(in oklab, var(--lcta-ink) 62%, transparent);
  --lcta-btn-bg: color-mix(in oklab, var(--lcta-accent) 74%, #000);
  --lcta-btn-hover: color-mix(in oklab, var(--lcta-accent) 66%, #000);
  --lcta-card-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 6px -2px rgb(0 0 0 / .4), 0 16px 36px -16px rgb(0 0 0 / .6);
}

/* Mono: ink on paper, square corners and a monospaced face; accent and ink both become solid black */
html[data-style="mono"] .lcta {
  --lcta-accent: #111; --lcta-bg: #111; --lcta-ring: transparent; --lcta-dot: rgb(255 255 255 / .2);
  --lcta-tick: #111; --lcta-card-shadow: 0 0 0 1px rgb(0 0 0 / .16);
  --lcta-ease: cubic-bezier(.2, .9, .1, 1);
  --lcta-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lcta-hk: .8; --lcta-hls: -.05em;
  --lcta-r-btn: 4px; --lcta-r-card: 6px; --lcta-r-panel: 8px;
}
html[data-style="mono"].dark .lcta {
  --lcta-accent: #f2f2f2; --lcta-bg: #141414; --lcta-ring: rgb(255 255 255 / .16); --lcta-dot: rgb(255 255 255 / .18);
  --lcta-btn-bg: #f2f2f2; --lcta-btn-fg: #000; --lcta-btn-hover: #d9d9d9;
  --lcta-tick: #f2f2f2; --lcta-card-shadow: 0 0 0 1px rgb(255 255 255 / .18);
}
html[data-style="mono"] .lcta[data-tone="soft"] {
  --lcta-bg: transparent; --lcta-ring: color-mix(in oklab, var(--lcta-ink) 14%, transparent);
  --lcta-dot: color-mix(in oklab, var(--lcta-ink) 16%, transparent);
  --lcta-btn-bg: #111; --lcta-btn-fg: #fff; --lcta-btn-hover: #333;
}
html[data-style="mono"].dark .lcta[data-tone="soft"] { --lcta-btn-bg: #f2f2f2; --lcta-btn-fg: #000; --lcta-btn-hover: #d9d9d9 }
html[data-style="mono"] .lcta-tick { border-radius: 3px }

/* Glass: solid panels stay solid and the card frosts over the dots; the soft panel itself is the glass sheet */
html[data-style="glass"] .lcta {
  --lcta-ink: var(--pane-ink); --lcta-surface: var(--pane-solid); --lcta-accent: var(--pane-accent);
  --lcta-ease: var(--pane-ease); --lcta-font: var(--pane-font);
  --lcta-c1: var(--pane-t1); --lcta-c2: var(--pane-t2);
  --lcta-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lcta-r-btn: 12px; --lcta-r-card: 18px; --lcta-r-panel: 28px;
}
html[data-style="glass"] .lcta[data-tone="soft"] {
  --lcta-p1: var(--pane-t1); --lcta-p2: var(--pane-t2); --lcta-p3: var(--pane-t2);
  --lcta-out: color-mix(in oklab, var(--pane-ink) 22%, transparent);
}
html[data-style="glass"]:not(.dark) .lcta:not([data-tone="soft"]) .lcta-card { --lcta-c2: color-mix(in oklab, var(--pane-ink) 90%, transparent) }
html[data-style="glass"] .lcta:not([data-tone="soft"]) .lcta-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
html[data-style="glass"] .lcta[data-tone="soft"] .lcta-panel { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
html[data-style="glass"] .lcta[data-tone="soft"] .lcta-card { background-color: var(--pane-tint-nested); box-shadow: var(--pane-shadow) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lcta:not([data-tone="soft"]) .lcta-card,
  html[data-style="glass"] .lcta[data-tone="soft"] .lcta-panel { -webkit-backdrop-filter: blur(16px) saturate(1.8); backdrop-filter: blur(16px) saturate(1.8) }
  html[data-style="glass"].dark .lcta:not([data-tone="soft"]) .lcta-card,
  html[data-style="glass"].dark .lcta[data-tone="soft"] .lcta-panel { -webkit-backdrop-filter: blur(16px) saturate(1.7); backdrop-filter: blur(16px) saturate(1.7) }
  html[data-style="glass"][data-refract] .lcta:not([data-tone="soft"]) .lcta-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.06); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.06) }
  html[data-style="glass"].dark[data-refract] .lcta:not([data-tone="soft"]) .lcta-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.6) brightness(.8); backdrop-filter: url(#pane-glass-card-d) saturate(1.6) brightness(.8) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] :is(.lcta .lcta-card, .lcta[data-tone="soft"] .lcta-panel) { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lcta *, .lcta *::before, .lcta *::after { box-sizing: border-box }
:where(.lcta) :is(h2, h3, p, ul, li, ol) { margin: 0; padding: 0; list-style: none }
:where(.lcta) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
.lcta :focus-visible { outline: 2px solid var(--lcta-focus); outline-offset: 3px }

.lcta-in { max-width: calc(var(--lcta-width, 1200px) + 48px); margin: 0 auto; padding: 48px 24px }
@container lcta (min-width: 880px) { .lcta-in { padding: 72px 24px } }

/* ---- panel ---- */
.lcta-panel {
  position: relative; overflow: hidden;   display: grid; gap: 40px; align-items: center;
  padding: 44px 24px 24px; border-radius: calc(var(--lcta-r-panel) - 4px);
  background: var(--lcta-bg); box-shadow: inset 0 0 0 1px var(--lcta-ring);
}
@container lcta (min-width: 560px) { .lcta-panel { padding: 56px 48px; border-radius: var(--lcta-r-panel) } }
@container lcta (min-width: 960px) { .lcta-panel { padding: 72px } }
/* Fine dots, denser towards the edges so the copy sits on a calm middle */
.lcta-panel::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle at center, var(--lcta-dot) 0 .9px, transparent 1.3px);
  background-size: 8px 8px; background-position: 4px 4px;
  -webkit-mask-image: radial-gradient(120% 120% at 28% 40%, rgb(0 0 0 / .12) 18%, #000 80%);
  mask-image: radial-gradient(120% 120% at 28% 40%, rgb(0 0 0 / .12) 18%, #000 80%);
}
.lcta[data-layout="centered"] .lcta-panel::before {
  -webkit-mask-image: radial-gradient(90% 120% at 50% 50%, rgb(0 0 0 / .1) 30%, #000 92%);
  mask-image: radial-gradient(90% 120% at 50% 50%, rgb(0 0 0 / .1) 30%, #000 92%);
}
@container lcta (min-width: 860px) {
  .lcta[data-layout="split"] .lcta-panel { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); column-gap: clamp(40px, 6cqi, 88px) }
}

/* ---- copy ---- */
.lcta-copy { position: relative; min-width: 0; container: lctac / inline-size }
.lcta[data-layout="centered"] .lcta-copy { width: 100%; max-width: 760px; margin: 0 auto; text-align: center }
.lcta-h {
  font-size: clamp(32px * var(--lcta-hk), 8cqi * var(--lcta-hk), 56px * var(--lcta-hk));
  line-height: 1.06; font-weight: 500; letter-spacing: var(--lcta-hls); color: var(--lcta-p1);
}
.lcta-h > span { display: block; text-wrap: balance }
.lcta-h > .lcta-h2 { color: var(--lcta-p3) }
.lcta-sub { margin-top: 20px; max-width: 34em; font-size: 16px; line-height: 26px; color: var(--lcta-p2); text-wrap: pretty }
.lcta[data-layout="centered"] .lcta-sub { margin-inline: auto }
@container lctac (min-width: 460px) { .lcta-sub { font-size: 17px; line-height: 28px } }

.lcta-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 32px }
@container lctac (min-width: 380px) { .lcta-actions { flex-direction: row; flex-wrap: wrap } }
.lcta[data-layout="centered"] .lcta-actions { justify-content: center }
.lcta-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px;
  border-radius: var(--lcta-r-btn); font-size: 15px; line-height: 1; font-weight: 500; white-space: nowrap;
  transition: background-color 160ms var(--lcta-ease), box-shadow 160ms var(--lcta-ease), transform 160ms var(--lcta-ease);
}
.lcta-btn:active { transform: scale(.98) }
.lcta-btn[data-variant="primary"] { background: var(--lcta-btn-bg); color: var(--lcta-btn-fg) }
.lcta-btn[data-variant="primary"]:hover { background: var(--lcta-btn-hover) }
.lcta-btn[data-variant="secondary"] { box-shadow: inset 0 0 0 1px var(--lcta-out); color: var(--lcta-p1) }
.lcta-btn[data-variant="secondary"]:hover { background: var(--lcta-out-hover) }

.lcta-note { margin-top: 16px; font-size: 13.5px; line-height: 20px; color: var(--lcta-p3) }
.lcta-links { display: flex; flex-wrap: wrap; gap: 0 24px; margin-top: 28px }
.lcta[data-layout="centered"] .lcta-links { justify-content: center }
.lcta-links a {
  display: inline-flex; align-items: center; min-height: 32px; border-radius: 4px;
  font-size: 13.5px; line-height: 20px; color: var(--lcta-p2);
  text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px;
  text-decoration-color: color-mix(in oklab, currentColor 40%, transparent);
  transition: color 160ms var(--lcta-ease), text-decoration-color 160ms var(--lcta-ease);
}
.lcta-links a:hover { color: var(--lcta-p1); text-decoration-color: currentColor }
.lcta-links a:focus-visible { outline-offset: 2px }

/* ---- media ---- */
.lcta-media { position: relative; min-width: 0; display: grid; place-items: center }
.lcta-media > * { max-width: 100% }

/* ---- built-in mock: a checklist that ticks itself off ---- */
.lcta-card {
  width: min(100%, 340px); border-radius: var(--lcta-r-card); background: var(--lcta-surface); box-shadow: var(--lcta-card-shadow);
  font-size: 13.5px; line-height: 20px; color: var(--lcta-c1); text-align: left;
}
.lcta-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 16px 18px 12px }
.lcta-card-head b { font-weight: 500; font-size: 14px; color: var(--lcta-c1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lcta-count { position: relative; display: grid; justify-items: end; flex: none; font-size: 12.5px; color: var(--lcta-c2); font-variant-numeric: tabular-nums }
.lcta-count > span { grid-area: 1 / 1; white-space: nowrap; transition: opacity 420ms var(--lcta-ease), filter 420ms var(--lcta-ease), transform 420ms var(--lcta-ease) }
.lcta-bar { height: 2px; margin: 0 18px; border-radius: 1px; background: var(--lcta-fill); overflow: hidden }
.lcta-bar i { display: block; height: 100%; background: var(--lcta-tick); transform-origin: 0 50%; transform: scaleX(calc(var(--s, 0) / 3)); transition: transform 560ms var(--lcta-ease) }
.lcta-rows { padding: 6px 18px 10px }
.lcta-row { display: grid; grid-template-columns: 20px minmax(0, 1fr); column-gap: 12px; align-items: start; padding: 10px 0 }
.lcta-row + .lcta-row { border-top: 1px solid var(--lcta-line) }
.lcta-tick {
  display: grid; place-items: center; width: 20px; height: 20px; margin-top: 0; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--lcta-line); color: transparent;
  transition: background-color 360ms var(--lcta-ease), box-shadow 360ms var(--lcta-ease), color 360ms var(--lcta-ease);
}
.lcta-tick svg { width: 12px; height: 12px; transform: scale(.6); opacity: 0; transition: transform 420ms var(--lcta-ease), opacity 280ms var(--lcta-ease) }
.lcta-row[data-done] .lcta-tick { background: var(--lcta-tick); box-shadow: inset 0 0 0 1.5px var(--lcta-tick); color: var(--lcta-surface) }
html[data-style="glass"] .lcta-row[data-done] .lcta-tick { color: #fff }
.lcta-row[data-done] .lcta-tick svg { transform: none; opacity: 1 }
.lcta-row-t { display: grid; min-width: 0 }
.lcta-row-t b { font-weight: 500; color: var(--lcta-c1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lcta-row-t small { font-size: 12.5px; line-height: 18px; color: var(--lcta-c2); text-wrap: pretty }
.lcta-card:not([data-step="3"]) .lcta-count .lcta-done, .lcta-card[data-step="3"] .lcta-count .lcta-n { opacity: 0; filter: blur(4px); transform: translateY(3px) }
.lcta-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* ---- arrival: the panel rises once, then its parts follow in reading order ---- */
.lcta[data-armed]:not([data-in]) .lcta-panel { opacity: 0 }
.lcta[data-armed][data-in] .lcta-panel { animation: lcta-rise 760ms var(--lcta-ease) backwards }
.lcta[data-armed][data-in] .lcta-r { animation: lcta-rise 680ms var(--lcta-ease) backwards; animation-delay: calc(140ms + var(--i) * 70ms) }
@keyframes lcta-rise { from { opacity: 0; transform: translateY(14px) } }

@media (prefers-reduced-motion: reduce) {
  .lcta *, .lcta *::before, .lcta *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  )
}

/** The checklist starts after the copy has arrived, then each row waits this long. */
const MOCK_LEAD = 900
const MOCK_STEP = 720

/* -------------------------------------------------------------------------- */
/*                              The built-in mock                             */
/* -------------------------------------------------------------------------- */

function ChecklistMock({ mock, animate, start }: { mock: LandingCtaMock; animate: boolean; start: boolean }) {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    if (!start || !animate) return
    const timers = [1, 2, 3].map((s) => window.setTimeout(() => setStep(s), MOCK_LEAD + MOCK_STEP * (s - 1)))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [start, animate])

  // Without the arrival (reveal off, reduced motion, no observer) the card simply shows its settled state.
  const shown = animate ? step : 3
  const rows = mock.rows.slice(0, 3)
  const label = `${mock.title}: ${rows.map((r) => r.label).join(", ")}. ${mock.done}.`

  return (
    <div className="lcta-card" data-step={shown} role="img" aria-label={label} style={{ "--s": shown } as React.CSSProperties}>
      <div className="lcta-card-head" aria-hidden>
        <b>{mock.title}</b>
        <span className="lcta-count">
          <span className="lcta-n">
            {Math.min(shown, rows.length)} of {rows.length}
          </span>
          <span className="lcta-done">{mock.done}</span>
        </span>
      </div>
      <div className="lcta-bar" aria-hidden>
        <i />
      </div>
      <ul className="lcta-rows" aria-hidden>
        {rows.map((r, i) => (
          <li key={i} className="lcta-row" data-done={shown > i ? "" : undefined}>
            <span className="lcta-tick">
              <Check strokeWidth={2.5} />
            </span>
            <span className="lcta-row-t">
              <b>{r.label}</b>
              <small>{r.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                     CTA                                    */
/* -------------------------------------------------------------------------- */

/** The closing band of a landing page: a two-tone headline, a paragraph and two buttons on a dotted panel, beside a small checklist that completes itself. */
export function LandingCta({
  headline = DEFAULT_LANDING_CTA.headline as [string, string?],
  description = DEFAULT_LANDING_CTA.description,
  primaryAction = DEFAULT_LANDING_CTA.primaryAction,
  secondaryAction = DEFAULT_LANDING_CTA.secondaryAction,
  reassurance = DEFAULT_LANDING_CTA.reassurance,
  links = DEFAULT_LANDING_CTA.links,
  mock,
  media,
  tone = "accent",
  layout = "split",
  headingLevel = 2,
  width = 1200,
  reveal = true,
  id,
  className,
}: LandingCtaProps) {
  const reduced = useReducedMotion()
  const headingId = React.useId()
  const rootRef = React.useRef<HTMLElement>(null)
  const [armed, setArmed] = React.useState(false)
  const [seen, setSeen] = React.useState(false)

  // Hide the band before the first paint only when it is going to rise in; otherwise everything is simply there.
  React.useLayoutEffect(() => {
    setArmed(reveal && !reduced && typeof IntersectionObserver !== "undefined")
  }, [reveal, reduced])

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          setSeen(true)
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const H = headingLevel === 3 ? "h3" : "h2"
  const [line1, line2] = headline
  const items = links.slice(0, 4)
  const story = { ...DEFAULT_LANDING_CTA_MOCK, ...mock }
  const split = layout === "split"
  let n = 0
  const r = () => ({ style: { "--i": n++ } as React.CSSProperties })

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn("lcta", className)}
      data-tone={tone}
      data-layout={layout}
      data-armed={armed ? "" : undefined}
      data-in={seen ? "" : undefined}
      aria-labelledby={headingId}
      style={{ "--lcta-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-cta" precedence="default">
        {CSS}
      </style>
      <div className="lcta-in">
        <div className="lcta-panel">
          <div className="lcta-copy">
            <H id={headingId} {...r()} className="lcta-r lcta-h">
              <span className="lcta-h1">{line1}</span>
              {line2 && (
                <>
                  {" "}
                  <span className="lcta-h2">{line2}</span>
                </>
              )}
            </H>
            {description && (
              <p {...r()} className="lcta-r lcta-sub">
                {description}
              </p>
            )}
            {(primaryAction || secondaryAction) && (
              <div {...r()} className="lcta-r lcta-actions">
                {primaryAction && (
                  <a className="lcta-btn" data-variant="primary" href={primaryAction.href}>
                    {primaryAction.label}
                  </a>
                )}
                {secondaryAction && (
                  <a className="lcta-btn" data-variant="secondary" href={secondaryAction.href}>
                    {secondaryAction.label}
                  </a>
                )}
              </div>
            )}
            {reassurance && (
              <p {...r()} className="lcta-r lcta-note">
                {reassurance}
              </p>
            )}
            {items.length > 0 && (
              <ul {...r()} className="lcta-r lcta-links" aria-label="More links">
                {items.map((l, i) => (
                  <li key={`${l.label}-${i}`}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {split && (
            <div className="lcta-r lcta-media" style={{ "--i": n + 1 } as React.CSSProperties}>
              {media ?? <ChecklistMock mock={story} animate={armed} start={seen} />}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}


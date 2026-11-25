"use client"

/**
 * Landing Feature Rows – the alternating feature rows of a product landing page.
 *
 * Each row is a headline (one or two lines), a paragraph, up to four ticked points and an optional link on one side,
 * and a media slot on the other, sitting in a soft dotted panel. Rows alternate sides on their own (`start` picks the
 * first side), and `band` gives every other row a soft full-bleed background. Without `media`, a row draws one of
 * three quiet built-in mocks (`mock: "chat" | "report" | "list"`) that plays its short story once when it is seen.
 *
 * Arrival is per row: the text parts rise 14px and fade in with a 70ms stagger, then the panel follows. On narrow
 * containers the media always sits under the text. Reduced motion shows every row in its finished state.
 *
 * Content is plain data (`DEFAULT_LANDING_FEATURE_ROWS`), so a page builder can edit and save it as JSON; only the
 * optional per-row `media` slot takes a React node.
 */

import * as React from "react"
import { ArrowUp, Check, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingFeatureRowsMock = "chat" | "report" | "list"

export type LandingFeatureRowsLink = { label: string; href: string }

/** Words inside a built-in mock. Every field is optional and falls back to the mock's own default. */
export type LandingFeatureRowsMockText = {
  /** Header of the mock window or card. */
  title?: string
  /** Small muted note on the right of the header. */
  note?: string
  /** chat: the question that appears first. */
  question?: string
  /** chat: the answer, up to 3 lines that write in. list: up to 5 rows that get ticked. */
  lines?: string[]
  /** chat: the placeholder in the message field. */
  placeholder?: string
  /** report: up to 4 rows that count up. Negative values subtract and show a minus sign. The total is their sum. */
  rows?: { label: string; value: number }[]
  /** report: label of the total row. */
  totalLabel?: string
  /** report: put before every number, e.g. "$". */
  prefix?: string
}

export type LandingFeatureRow = {
  /** The headline. Put "\n" in it for a second line. */
  title: string
  body: string
  /** Up to 4 ticked points under the paragraph. */
  points?: string[]
  link?: LandingFeatureRowsLink
  /** Built-in mock for this row when no `media` is given. Default: chat, report, list in turn. */
  mock?: LandingFeatureRowsMock
  /** Words inside the built-in mock. */
  mockText?: LandingFeatureRowsMockText
  /** Your own picture or product mock. It sits centred in the dotted panel. */
  media?: React.ReactNode
}

export type LandingFeatureRowsProps = {
  rows?: LandingFeatureRow[]
  /** Where the first row's media sits; later rows alternate. Default "media-right". */
  start?: "media-left" | "media-right"
  /** A soft full-bleed background on every other row (the second, fourth...). Default false. */
  band?: boolean
  /** Show the second line of each headline in a muted tone. Default false. */
  mutedSecondLine?: boolean
  /** Heading level of each row's headline. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** Max content width in px. Default 1200. */
  width?: number
  /** Each row's parts rise and fade in once when it scrolls into view. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_FEATURE_ROWS = {
  start: "media-right",
  band: false,
  mutedSecondLine: false,
  rows: [
    {
      title: "Ask about any customer.\nGet the whole story.",
      body: "Atlas reads the ticket history, the orders and your help centre, and answers with the sources behind it, so every reply leads back to where it came from.",
      points: ["Answers cite the tickets and pages they used", "Every draft waits for a person to approve it", "Works inside the help desk you already use"],
      link: { label: "See how answers work", href: "#answers" },
      mock: "chat",
      mockText: {
        title: "Atlas",
        note: "Harbor & Finch",
        question: "Why has this customer written three times?",
        lines: ["Order 4471 shipped late and has no tracking yet.", "On Monday they were promised a new date.", "I drafted a reply with that date for you to review."],
        placeholder: "Ask a follow-up",
      },
    },
    {
      title: "A queue that\nexplains itself.",
      body: "Sage tags and routes every request as it lands. Open any number to see the tickets behind it and who answered them.",
      link: { label: "Explore the queue", href: "#queue" },
      mock: "report",
      mockText: {
        title: "This week",
        note: "Northwind support",
        rows: [
          { label: "Open on Monday", value: 86 },
          { label: "New requests", value: 412 },
          { label: "Resolved", value: -431 },
          { label: "Merged duplicates", value: -29 },
        ],
        totalLabel: "Open now",
        prefix: "",
      },
    },
    {
      title: "Write it up once.\nAnswer it for good.",
      body: "Quill turns solved tickets into help-centre articles and works through the steps you would do by hand. Anything unclear waits for a person.",
      points: ["Drafts from the tickets your team resolved", "Asks before it changes a published page", "Keeps a record of every edit it made"],
      link: { label: "Read about articles", href: "#articles" },
      mock: "list",
      mockText: {
        title: "New article",
        note: "Quill",
        lines: ["Collect 12 resolved tickets", "Find the common question", "Write the steps in plain words", "Link the shipping policy", "Send to Rosa for review"],
      },
    },
  ],
} satisfies Pick<LandingFeatureRowsProps, "start" | "band" | "mutedSecondLine"> & { rows: LandingFeatureRow[] }

const MOCK_DEFAULTS: Record<LandingFeatureRowsMock, Required<LandingFeatureRowsMockText>> = {
  chat: {
    title: "Assistant",
    note: "Workspace",
    question: "What changed since last week?",
    lines: ["Two projects moved to review.", "One deadline slipped by three days.", "I listed the owners to follow up with."],
    placeholder: "Ask a follow-up",
    rows: [],
    totalLabel: "",
    prefix: "",
  },
  report: {
    title: "Summary",
    note: "This month",
    question: "",
    lines: [],
    placeholder: "",
    rows: [
      { label: "Carried over", value: 24 },
      { label: "New", value: 96 },
      { label: "Done", value: -88 },
      { label: "Dropped", value: -6 },
    ],
    totalLabel: "Open",
    prefix: "",
  },
  list: {
    title: "Checklist",
    note: "5 steps",
    question: "",
    lines: ["Collect the inputs", "Check them against the rules", "Flag anything unusual", "Prepare the draft", "Send it for review"],
    placeholder: "",
    rows: [],
    totalLabel: "",
    prefix: "",
  },
}

const MOCK_ORDER: LandingFeatureRowsMock[] = ["chat", "report", "list"]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lfr {
  --lfr-ink: #0a0a0a;
  --lfr-paper: #fff;
  --lfr-surface: #fff;
  --lfr-accent: var(--pane-accent, #0060e2);
  --lfr-on-accent: #fff;
  --lfr-t1: color-mix(in oklab, var(--lfr-ink) 88%, transparent);
  --lfr-t2: color-mix(in oklab, var(--lfr-ink) 61%, transparent);
  --lfr-t3: color-mix(in oklab, var(--lfr-ink) 45%, transparent);
  --lfr-t4: color-mix(in oklab, var(--lfr-ink) 27%, transparent);
  --lfr-fill: color-mix(in oklab, var(--lfr-ink) 5%, transparent);
  --lfr-line: color-mix(in oklab, var(--lfr-ink) 7%, transparent);
  --lfr-band: color-mix(in oklab, var(--lfr-ink) 2.5%, transparent);
  --lfr-panel: color-mix(in oklab, var(--lfr-accent) 3%, var(--lfr-paper));
  --lfr-panel-ring: inset 0 0 0 1px color-mix(in oklab, var(--lfr-ink) 6%, transparent);
  --lfr-dot: color-mix(in oklab, var(--lfr-accent) 30%, transparent);
  --lfr-card-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .05), 0 18px 40px -18px rgb(24 32 64 / .24);
  --lfr-ease: cubic-bezier(.22, 1, .36, 1);
  --lfr-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --lfr-title-ls: -.032em;
  --lfr-title-size: clamp(28px, 2.4cqi + 16px, 46px);
  --lfr-r-panel: 20px;
  --lfr-r-card: 12px;
  --lfr-r-in: 8px;
  --lfr-w: 1200px;
  position: relative;
  display: block;
  width: 100%;
  container: lfr / inline-size;
  font: 14px/22px var(--lfr-font);
  color: var(--lfr-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .lfr {
  --lfr-ink: #fff;
  --lfr-paper: #121214;
  --lfr-surface: #1c1c1e;
  --lfr-accent: var(--pane-accent, #4d8dff);
  --lfr-t1: color-mix(in oklab, var(--lfr-ink) 90%, transparent);
  --lfr-t2: color-mix(in oklab, var(--lfr-ink) 62%, transparent);
  --lfr-t3: color-mix(in oklab, var(--lfr-ink) 46%, transparent);
  --lfr-t4: color-mix(in oklab, var(--lfr-ink) 28%, transparent);
  --lfr-fill: color-mix(in oklab, var(--lfr-ink) 7%, transparent);
  --lfr-line: color-mix(in oklab, var(--lfr-ink) 9%, transparent);
  --lfr-band: color-mix(in oklab, var(--lfr-ink) 3%, transparent);
  --lfr-panel: color-mix(in oklab, var(--lfr-accent) 5%, var(--lfr-paper));
  --lfr-panel-ring: inset 0 0 0 1px color-mix(in oklab, var(--lfr-ink) 8%, transparent);
  --lfr-dot: color-mix(in oklab, var(--lfr-accent) 34%, transparent);
  --lfr-card-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px rgb(0 0 0 / .4), 0 20px 44px -18px rgb(0 0 0 / .7);
}

/* Mono: ink on paper, hairlines instead of shadows, small radii and a monospaced face */
html[data-style="mono"] .lfr {
  --lfr-ink: #000; --lfr-paper: #fff; --lfr-surface: #fff; --lfr-accent: #111; --lfr-on-accent: #fff;
  --lfr-panel: var(--lfr-paper);
  --lfr-panel-ring: inset 0 0 0 1px color-mix(in oklab, var(--lfr-ink) 14%, transparent);
  --lfr-dot: color-mix(in oklab, var(--lfr-ink) 20%, transparent);
  --lfr-line: color-mix(in oklab, var(--lfr-ink) 12%, transparent);
  --lfr-card-shadow: 0 0 0 1px rgb(0 0 0 / .16);
  --lfr-ease: cubic-bezier(.2, .9, .1, 1);
  --lfr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lfr-title-ls: -.045em; --lfr-title-size: clamp(26px, 2cqi + 14px, 40px);
  --lfr-r-panel: 6px; --lfr-r-card: 4px; --lfr-r-in: 3px;
}
html[data-style="mono"].dark .lfr {
  --lfr-ink: #fff; --lfr-paper: #0a0a0a; --lfr-surface: #0a0a0a; --lfr-accent: #f2f2f2; --lfr-on-accent: #0a0a0a;
  --lfr-panel-ring: inset 0 0 0 1px rgb(255 255 255 / .16);
  --lfr-dot: rgb(255 255 255 / .16);
  --lfr-card-shadow: 0 0 0 1px rgb(255 255 255 / .18);
}

/* Glass: the page wallpaper shows through; the mock card is the one glass surface (the panel stays clear) */
html[data-style="glass"] .lfr {
  --lfr-ink: var(--pane-ink); --lfr-surface: var(--pane-solid); --lfr-accent: var(--pane-accent);
  --lfr-t1: var(--pane-t1); --lfr-t2: var(--pane-t2); --lfr-t3: var(--pane-t3); --lfr-t4: var(--pane-t4);
  --lfr-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lfr-fill: color-mix(in oklab, var(--pane-ink) 7%, transparent);
  --lfr-band: rgb(255 255 255 / .2);
  --lfr-panel: rgb(255 255 255 / .14);
  --lfr-panel-ring: inset 0 0 0 1px rgb(255 255 255 / .5), inset 0 1px 0 rgb(255 255 255 / .6);
  --lfr-dot: rgb(255 255 255 / .75);
  --lfr-ease: var(--pane-ease); --lfr-font: var(--pane-font);
  --lfr-r-panel: 28px; --lfr-r-card: 20px; --lfr-r-in: 10px;
}
html[data-style="glass"].dark .lfr {
  --lfr-band: rgb(255 255 255 / .035);
  --lfr-panel: rgb(255 255 255 / .04);
  --lfr-panel-ring: inset 0 0 0 1px rgb(255 255 255 / .12), inset 0 1px 0 rgb(255 255 255 / .14);
  --lfr-dot: rgb(255 255 255 / .2);
  --lfr-line: color-mix(in oklab, var(--pane-ink) 14%, transparent);
}
html[data-style="glass"] .lfr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lfr-card { -webkit-backdrop-filter: blur(16px) saturate(1.8); backdrop-filter: blur(16px) saturate(1.8) }
  html[data-style="glass"].dark .lfr-card { -webkit-backdrop-filter: blur(16px) saturate(1.7); backdrop-filter: blur(16px) saturate(1.7) }
  html[data-style="glass"][data-refract] .lfr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.06); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.06) }
  html[data-style="glass"].dark[data-refract] .lfr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.6) brightness(.8); backdrop-filter: url(#pane-glass-card-d) saturate(1.6) brightness(.8) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lfr-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lfr *, .lfr *::before, .lfr *::after { box-sizing: border-box }
:where(.lfr) :is(h2, h3, h4, p, ul, li) { margin: 0; padding: 0 }
:where(.lfr) ul { list-style: none }
:where(.lfr) a { color: inherit; text-decoration: none }
.lfr :focus-visible { outline: 2px solid var(--lfr-accent); outline-offset: 3px; border-radius: 4px }

/* ---- row ---- */
.lfr-row { position: relative; padding: clamp(56px, 4cqi + 40px, 104px) 0 }
.lfr-row[data-band] { background: var(--lfr-band) }
.lfr-in {
  display: grid; gap: 40px; align-items: center;
  max-width: calc(var(--lfr-w) + 48px); margin: 0 auto; padding: 0 24px;
}
@container lfr (min-width: 820px) {
  .lfr-in { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); column-gap: clamp(48px, 6cqi, 96px) }
  .lfr-row[data-side="left"] .lfr-in { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) }
  .lfr-row[data-side="left"] .lfr-text { grid-column: 2; grid-row: 1 }
  .lfr-row[data-side="left"] .lfr-media { grid-column: 1; grid-row: 1 }
}

/* ---- text ---- */
.lfr-text { min-width: 0; max-width: 540px }
.lfr-title {
  font: 500 var(--lfr-title-size)/1.08 var(--lfr-font);
  letter-spacing: var(--lfr-title-ls); color: var(--lfr-ink); text-wrap: balance;
}
.lfr-title > span { display: block }
.lfr-title > span[data-muted] { color: var(--lfr-t3) }
.lfr-body { margin-top: 20px; max-width: 34em; font-size: 15px; line-height: 24px; color: var(--lfr-t2); text-wrap: pretty }
@container lfr (min-width: 640px) { .lfr-body { font-size: 16px; line-height: 26px } }
.lfr-points { display: grid; gap: 10px; margin-top: 24px }
.lfr-points li { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 12px; font-size: 14.5px; line-height: 22px; color: var(--lfr-t1) }
.lfr-points svg { margin-top: 3px; color: var(--lfr-accent) }
.lfr-link {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 28px;
  font-weight: 500; font-size: 14.5px; line-height: 20px; color: var(--lfr-accent);
  transition: opacity 160ms var(--lfr-ease);
}
.lfr-link svg { transition: transform 200ms var(--lfr-ease) }
.lfr-link:hover svg { transform: translateX(2px) }
.lfr-link:active { opacity: .7 }
.lfr-linkrow { display: block }

/* ---- media panel ---- */
.lfr-media { min-width: 0 }
.lfr-panel {
  position: relative; display: grid; place-items: center; overflow: hidden;
  min-height: clamp(300px, 22cqi + 200px, 480px);
  padding: clamp(28px, 4cqi + 12px, 64px) clamp(20px, 4cqi + 8px, 64px);
  border-radius: var(--lfr-r-panel); background: var(--lfr-panel); box-shadow: var(--lfr-panel-ring);
}
.lfr-panel::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle at center, var(--lfr-dot) 1px, transparent 1.3px);
  background-size: 8px 8px; background-position: center;
  -webkit-mask-image: radial-gradient(72% 70% at 50% 50%, transparent 30%, #000 100%);
  mask-image: radial-gradient(72% 70% at 50% 50%, transparent 30%, #000 100%);
}
/* A second, offset dot layer doubles the density in two corners, like halftone gathering at the edges */
.lfr-panel::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle at center, var(--lfr-dot) 1px, transparent 1.3px);
  background-size: 8px 8px; background-position: calc(50% + 4px) calc(50% + 4px);
  -webkit-mask-image: radial-gradient(55% 60% at 100% 0%, #000, transparent 75%), radial-gradient(50% 55% at 0% 100%, rgb(0 0 0 / .8), transparent 75%);
  mask-image: radial-gradient(55% 60% at 100% 0%, #000, transparent 75%), radial-gradient(50% 55% at 0% 100%, rgb(0 0 0 / .8), transparent 75%);
}
.lfr-panel > * { position: relative; z-index: 1; max-width: 100% }

/* ---- arrival: text parts, then the panel ---- */
.lfr-rv { transition: opacity 640ms var(--lfr-ease), transform 640ms var(--lfr-ease); transition-delay: var(--d, 0ms) }
.lfr-row[data-armed]:not([data-in]) .lfr-rv { opacity: 0; transform: translateY(14px); transition: none }

/* ---- mock card ---- */
.lfr-card {
  width: min(100%, 380px); overflow: hidden;
  border-radius: var(--lfr-r-card); background: var(--lfr-surface); box-shadow: var(--lfr-card-shadow);
  font-size: 13px; line-height: 19px; color: var(--lfr-t1); text-align: left;
}
.lfr-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 16px; box-shadow: inset 0 -1px 0 var(--lfr-line);
}
.lfr-head b { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-weight: 500; white-space: nowrap }
.lfr-head > span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; color: var(--lfr-t3) }
.lfr-av {
  display: grid; place-items: center; width: 20px; height: 20px; flex: none; border-radius: 50%;
  background: var(--lfr-fill); font-size: 11px; font-weight: 500; line-height: 1; color: var(--lfr-t2);
}

/* chat */
.lfr-chat { padding: 16px }
.lfr-q {
  width: fit-content; max-width: 85%; margin-left: auto; padding: 8px 12px;
  border-radius: 12px 12px 4px 12px; background: var(--lfr-fill); color: var(--lfr-t1);
}
.lfr-ans { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 10px; margin-top: 16px }
.lfr-ans p { display: grid; gap: 4px; color: var(--lfr-t1) }
.lfr-ans p > span { display: block }
.lfr-w { display: inline }
.lfr-compose {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 38px; margin-top: 20px; padding: 0 6px 0 12px;
  border-radius: var(--lfr-r-in); box-shadow: inset 0 0 0 1px var(--lfr-line); color: var(--lfr-t4);
}
.lfr-compose span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.lfr-compose i { display: grid; place-items: center; width: 26px; height: 26px; flex: none; border-radius: calc(var(--lfr-r-in) - 2px); background: var(--lfr-fill); color: var(--lfr-t3) }
.lfr-chat[data-phase="idle"] :is(.lfr-q, .lfr-w, .lfr-ans > .lfr-av) { opacity: 0 }
.lfr-chat[data-phase="play"] .lfr-ans > .lfr-av { animation: lfr-rise 420ms var(--lfr-ease) backwards; animation-delay: calc(var(--lfr-play, 0ms) + 600ms) }
.lfr-chat[data-phase="play"] .lfr-q { animation: lfr-rise 520ms var(--lfr-ease) backwards; animation-delay: var(--lfr-play, 0ms) }
.lfr-chat[data-phase="play"] .lfr-w { animation: lfr-word 460ms var(--lfr-ease) backwards; animation-delay: calc(var(--lfr-play, 0ms) + var(--wd, 0ms)) }

/* report */
.lfr-rep { padding: 4px 16px 12px }
.lfr-rrow { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; box-shadow: inset 0 -1px 0 var(--lfr-line) }
.lfr-rrow:nth-last-child(2) { box-shadow: none }
.lfr-rrow > span:first-child { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--lfr-t2) }
.lfr-num { font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--lfr-t1) }
.lfr-total { position: relative; padding-top: 12px; font-weight: 500; box-shadow: none }
.lfr-total > span:first-child { color: var(--lfr-ink) }
.lfr-total::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--lfr-t1); transform-origin: left }
.lfr-rep[data-phase="idle"] .lfr-total { opacity: 0 }
.lfr-rep[data-phase="play"] .lfr-total { animation: lfr-rise 520ms var(--lfr-ease) backwards; animation-delay: calc(var(--lfr-play, 0ms) + var(--td, 0ms)) }
.lfr-rep[data-phase="play"] .lfr-total::before { animation: lfr-draw 640ms var(--lfr-ease) backwards; animation-delay: calc(var(--lfr-play, 0ms) + var(--td, 0ms)) }

/* list */
.lfr-list { position: relative; padding: 8px; --lfr-rh: 40px }
.lfr-hl {
  position: absolute; left: 8px; right: 8px; top: 8px; height: var(--lfr-rh); border-radius: var(--lfr-r-in);
  background: var(--lfr-fill); opacity: 0; transform: translateY(calc(var(--s, 0) * var(--lfr-rh)));
  transition: transform 440ms var(--lfr-ease), opacity 260ms var(--lfr-ease);
}
.lfr-hl[data-on] { opacity: 1 }
.lfr-li { position: relative; display: flex; align-items: center; gap: 12px; height: var(--lfr-rh); padding: 0 10px; color: var(--lfr-t2); transition: color 240ms var(--lfr-ease) }
.lfr-li > span:last-child { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.lfr-li:is([data-on], [data-done]) { color: var(--lfr-t1) }
.lfr-tick {
  display: grid; place-items: center; width: 18px; height: 18px; flex: none; border-radius: 50%;
  box-shadow: inset 0 0 0 1.25px var(--lfr-t4); color: var(--lfr-on-accent);
  transition: background-color 240ms var(--lfr-ease), box-shadow 240ms var(--lfr-ease);
}
.lfr-tick svg { opacity: 0; transform: scale(.5); transition: opacity 200ms var(--lfr-ease), transform 360ms var(--lfr-ease) }
.lfr-li[data-done] .lfr-tick { background: var(--lfr-accent); box-shadow: inset 0 0 0 1.25px var(--lfr-accent) }
.lfr-li[data-done] .lfr-tick svg { opacity: 1; transform: none }

@keyframes lfr-rise { from { opacity: 0; transform: translateY(6px) } }
@keyframes lfr-word { from { opacity: 0; filter: blur(4px) } }
@keyframes lfr-draw { from { transform: scaleX(0) } }

@media (prefers-reduced-motion: reduce) {
  .lfr *, .lfr *::before, .lfr *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const STAGGER = 70 // ms between the text parts of a row
const WORD_MS = 55 // ms between the words of the chat answer
const STEP_MS = 540 // ms the list highlight rests on each row
const ROW_MS = 900 // report: one row's count
const ROW_GAP = 110 // report: delay between rows
const TOTAL_MS = 700 // report: the total's count

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

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/** True from the first moment the element is meaningfully on screen. */
function useSeen(ref: React.RefObject<Element | null>, threshold = 0.15) {
  const [seen, setSeen] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setSeen(true), 0)
      return () => window.clearTimeout(id)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  return seen
}

/** Milliseconds since `delay` after `active` turned true, capped at `total`. Lands on `total` even if frames never come. */
function useElapsed(active: boolean, delay: number, total: number) {
  const [el, setEl] = React.useState(0)
  React.useEffect(() => {
    if (!active) return
    let raf = 0
    const t0 = performance.now() + delay
    const tick = (ts: number) => {
      const e = ts - t0
      if (e >= total) return setEl(total)
      setEl(Math.max(0, e))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const fallback = window.setTimeout(() => setEl(total), delay + total + 400)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [active, delay, total])
  return el
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

function money(v: number, prefix: string) {
  const n = Math.round(Math.abs(v)).toLocaleString("en-US")
  return `${v < 0 ? "−" : ""}${prefix}${n}`
}

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>

/* -------------------------------------------------------------------------- */
/*                                    Mocks                                   */
/* -------------------------------------------------------------------------- */

type MockProps = {
  text: Required<LandingFeatureRowsMockText>
  /** Animations are allowed (mounted, no reduced motion). Off = the finished frame. */
  motion: boolean
  /** The panel has been seen: play the story. */
  play: boolean
  /** ms before the story starts once `play` is true. */
  delay: number
}

type Phase = "idle" | "play" | "done"
const phaseOf = (motion: boolean, play: boolean): Phase => (!motion ? "done" : play ? "play" : "idle")

function ChatMock({ text, motion, play }: MockProps) {
  const lines = text.lines.slice(0, 3)
  let w = 0
  return (
    <div className="lfr-card" aria-hidden>
      <div className="lfr-head">
        <b>
          <span className="lfr-av">{text.title.charAt(0)}</span>
          {text.title}
        </b>
        <span>{text.note}</span>
      </div>
      <div className="lfr-chat" data-phase={phaseOf(motion, play)}>
        <div className="lfr-q">{text.question}</div>
        <div className="lfr-ans">
          <span className="lfr-av">{text.title.charAt(0)}</span>
          <p>
            {lines.map((line, li) => (
              <span key={li}>
                {line.split(" ").map((word, wi) => {
                  // The answer starts 700ms after the question and pauses briefly between lines.
                  const wd = 700 + w++ * WORD_MS + li * 160
                  return (
                    <React.Fragment key={wi}>
                      <span className="lfr-w" style={{ "--wd": `${wd}ms` } as CSSVars}>
                        {word}
                      </span>{" "}
                    </React.Fragment>
                  )
                })}
              </span>
            ))}
          </p>
        </div>
        <div className="lfr-compose">
          <span>{text.placeholder}</span>
          <i>
            <ArrowUp size={14} strokeWidth={1.75} />
          </i>
        </div>
      </div>
    </div>
  )
}

function ReportMock({ text, motion, play, delay }: MockProps) {
  const rows = text.rows.slice(0, 4)
  const total = rows.reduce((s, r) => s + r.value, 0)
  const totalAt = (rows.length - 1) * ROW_GAP + ROW_MS * 0.85
  const end = totalAt + TOTAL_MS
  const phase = phaseOf(motion, play)
  const elapsed = useElapsed(phase === "play", delay, end)
  const at = phase === "done" ? end : elapsed
  return (
    <div className="lfr-card" aria-hidden>
      <div className="lfr-head">
        <b>{text.title}</b>
        <span>{text.note}</span>
      </div>
      <div className="lfr-rep" data-phase={phase} style={{ "--td": `${Math.round(totalAt)}ms` } as CSSVars}>
        {rows.map((r, i) => (
          <div className="lfr-rrow" key={`${r.label}-${i}`}>
            <span>{r.label}</span>
            <span className="lfr-num">{money(r.value * easeOut((at - i * ROW_GAP) / ROW_MS), text.prefix)}</span>
          </div>
        ))}
        <div className="lfr-rrow lfr-total">
          <span>{text.totalLabel}</span>
          <span className="lfr-num">{money(total * easeOut((at - totalAt) / TOTAL_MS), text.prefix)}</span>
        </div>
      </div>
    </div>
  )
}

function ListMock({ text, motion, play, delay }: MockProps) {
  const items = text.lines.slice(0, 5)
  const n = items.length
  const [step, setStep] = React.useState(-1)
  React.useEffect(() => {
    if (!motion || !play) return
    let k = -1
    let t = 0
    const next = () => {
      k++
      setStep(k)
      if (k < n) t = window.setTimeout(next, STEP_MS)
    }
    t = window.setTimeout(next, delay)
    return () => window.clearTimeout(t)
  }, [motion, play, delay, n])
  const s = motion ? step : n
  const on = s >= 0 && s < n
  return (
    <div className="lfr-card" aria-hidden>
      <div className="lfr-head">
        <b>{text.title}</b>
        <span>{text.note}</span>
      </div>
      <div className="lfr-list">
        <span className="lfr-hl" data-on={on || undefined} style={{ "--s": Math.min(Math.max(s, 0), n - 1) } as CSSVars} />
        <ul>
        {items.map((item, i) => (
          <li className="lfr-li" key={`${item}-${i}`} data-on={(on && s === i) || undefined} data-done={s > i || undefined}>
            <span className="lfr-tick">
              <Check size={12} strokeWidth={2.5} />
            </span>
            <span>{item}</span>
          </li>
        ))}
        </ul>
      </div>
    </div>
  )
}

const MOCKS: Record<LandingFeatureRowsMock, (p: MockProps) => React.ReactElement> = {
  chat: ChatMock,
  report: ReportMock,
  list: ListMock,
}

/* -------------------------------------------------------------------------- */
/*                                     Row                                    */
/* -------------------------------------------------------------------------- */

type RowProps = {
  row: LandingFeatureRow
  index: number
  mediaLeft: boolean
  band: boolean
  mutedSecondLine: boolean
  headingLevel: 2 | 3 | 4
  reveal: boolean
}

function Row({ row, index, mediaLeft, band, mutedSecondLine, headingLevel, reveal }: RowProps) {
  const rowRef = React.useRef<HTMLElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()
  const reduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  useIsoLayoutEffect(() => setMounted(true), [])
  const motion = mounted && !reduced
  const seen = useSeen(rowRef)
  const panelSeen = useSeen(panelRef, 0.3)

  const lines = row.title.split("\n").slice(0, 2)
  const points = (row.points ?? []).slice(0, 4)
  const textParts = 2 + points.length + (row.link ? 1 : 0)
  const panelDelay = reveal ? textParts * STAGGER + 60 : 0

  // The mock starts once its panel is on screen and has arrived: on wide screens right after the panel rises in,
  // on phones (panel under the text) as soon as it is scrolled to.
  const seenAt = React.useRef(0)
  const [play, setPlay] = React.useState<{ delay: number } | null>(null)
  React.useEffect(() => {
    if (seen && !seenAt.current) seenAt.current = performance.now()
  }, [seen])
  React.useEffect(() => {
    if (!panelSeen || play) return
    const since = seenAt.current ? performance.now() - seenAt.current : 0
    setPlay({ delay: Math.max(reveal ? panelDelay + 420 - since : 0, 220) })
  }, [panelSeen, play, reveal, panelDelay])

  const H = `h${headingLevel}` as "h2"
  const kind = row.mock ?? MOCK_ORDER[index % MOCK_ORDER.length]
  const Mock = MOCKS[kind]
  const mockText = { ...MOCK_DEFAULTS[kind], ...row.mockText } as Required<LandingFeatureRowsMockText>
  let part = 0
  const d = () => ({ "--d": `${part++ * STAGGER}ms` }) as CSSVars

  return (
    <section
      ref={rowRef}
      className="lfr-row"
      aria-labelledby={id}
      data-side={mediaLeft ? "left" : "right"}
      data-band={band || undefined}
      data-armed={(motion && reveal) || undefined}
      data-in={seen || undefined}
      style={{ "--lfr-play": `${Math.round(play?.delay ?? 0)}ms` } as CSSVars}
    >
      <div className="lfr-in">
        <div className="lfr-text">
          <H id={id} className="lfr-title lfr-rv" style={d()}>
            {lines.map((line, k) => (
              <span key={k} data-muted={(k === 1 && mutedSecondLine) || undefined}>
                {line}
              </span>
            ))}
          </H>
          <p className="lfr-body lfr-rv" style={d()}>
            {row.body}
          </p>
          {points.length > 0 && (
            <ul className="lfr-points">
              {points.map((p, k) => (
                <li key={k} className="lfr-rv" style={d()}>
                  <Check size={15} strokeWidth={2} aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
          {row.link && (
            <span className="lfr-linkrow lfr-rv" style={d()}>
              <a className="lfr-link" href={row.link.href}>
                {row.link.label}
                <ChevronRight size={15} strokeWidth={1.75} aria-hidden />
              </a>
            </span>
          )}
        </div>
        <div className="lfr-media lfr-rv" style={{ "--d": `${panelDelay}ms` } as CSSVars}>
          <div className="lfr-panel" ref={panelRef}>
            {row.media ?? <Mock text={mockText} motion={motion} play={!!play} delay={play?.delay ?? 0} />}
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Section                                   */
/* -------------------------------------------------------------------------- */

/** Alternating landing-page feature rows: headline, paragraph, ticks and a link beside a dotted media panel with a built-in mock that plays once. */
export function LandingFeatureRows({
  rows = DEFAULT_LANDING_FEATURE_ROWS.rows,
  start = "media-right",
  band = false,
  mutedSecondLine = false,
  headingLevel = 2,
  width = 1200,
  reveal = true,
  className,
}: LandingFeatureRowsProps) {
  return (
    <div className={cn("lfr", className)} style={{ "--lfr-w": `${width}px` } as CSSVars}>
      <style href="landing-feature-rows" precedence="default">
        {CSS}
      </style>
      {rows.map((row, i) => (
        <Row
          key={i}
          row={row}
          index={i}
          mediaLeft={(start === "media-left") === (i % 2 === 0)}
          band={band && i % 2 === 1}
          mutedSecondLine={mutedSecondLine}
          headingLevel={headingLevel}
          reveal={reveal}
        />
      ))}
    </div>
  )
}

"use client"

/**
 * Landing Hero – the opening of a product landing page.
 *
 * Left: an optional eyebrow, a two-line headline whose second line is muted, one supporting sentence, a primary
 * and a secondary action, a small reassurance line and up to four ticked proof points. Right: a large panel in
 * the accent colour with a fine dotted texture holding the media slot. With no `media`, the panel shows a small
 * story that plays once when it scrolls into view: a chat message with an attachment becomes a tidy record with
 * three fields and a quiet "checked" line, with a three-dot step indicator to revisit each frame.
 *
 * ```tsx
 * <LandingHero
 *   eyebrow="For support teams"
 *   headline={["Atlas drafts.", "You approve."]}
 *   description="Atlas reads each support request, checks the order and drafts an answer for a person to approve."
 *   primaryAction={{ label: "Start free", href: "/signup" }}
 *   secondaryAction={{ label: "See how it works", href: "#how" }}
 *   proof={["Works with email and chat", "A person approves every reply"]}
 *   layout="split" panel="accent"
 * />
 * ```
 *
 * Every word comes from plain-data props (`DEFAULT_LANDING_HERO` holds the defaults), so `<LandingHero />` renders
 * a finished section. The parts rise and fade in once, in reading order (headline, sentence, buttons, proof, then
 * the panel); `reveal={false}` or reduced motion shows everything at once.
 */

import * as React from "react"
import { Check, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingHeroAction = {
  label: string
  href: string
}

export type LandingHeroRecordRow = {
  label: string
  value: string
}

/** The words inside the built-in mock: a chat message whose attachment becomes a record. */
export type LandingHeroMock = {
  /** Who the chat is with, e.g. "Atlas". Its first letter is the avatar. */
  agent: string
  /** Time shown in the chat header, e.g. "09:14". */
  time: string
  /** The attachment's file name. */
  file: string
  /** Small line under the file name, e.g. "Email · Harbor & Finch". */
  fileMeta: string
  /** The message sent with the attachment. */
  message: string
  /** Placeholder in the chat's composer. */
  placeholder: string
  /** Small label above the record title, e.g. "Draft reply". */
  recordKind: string
  /** The record's title, e.g. "Ticket #2318". */
  recordTitle: string
  /** The record's fields. The first three are shown. */
  rows: LandingHeroRecordRow[]
  /** The quiet line under the fields once the record is checked. */
  checked: string
  /** Names of the three frames, read out by the step buttons. */
  steps: [string, string, string]
}

export type LandingHeroContent = {
  /** Small line above the headline. Empty to hide. */
  eyebrow?: string
  /** Two lines: the second is muted. One string gives a one-line headline. */
  headline?: [string, string?]
  /** One supporting sentence under the headline. */
  description?: string
  /** The filled button. `null` hides it. */
  primaryAction?: LandingHeroAction | null
  /** The plain button. `null` hides it. */
  secondaryAction?: LandingHeroAction | null
  /** Small reassurance line under the buttons, e.g. "No card needed". Empty to hide. */
  reassurance?: string
  /** Up to four short proof points, each with a plain tick. */
  proof?: string[]
  /** Words for the built-in mock (merged over the default). Ignored when `media` is set. */
  mock?: Partial<LandingHeroMock>
}

export type LandingHeroProps = LandingHeroContent & {
  /** Your own picture or product mock, placed on the panel instead of the built-in story. */
  media?: React.ReactNode
  /** "split" puts the text left and the panel right; "centered" stacks centred text above a wide panel. Default "split". */
  layout?: "split" | "centered"
  /** "accent" fills the panel with the accent colour; "soft" is a neutral dotted panel. Default "accent". */
  panel?: "accent" | "soft"
  /** Level of the headline element. Default 1. */
  headingLevel?: 1 | 2
  /** Rise and fade the parts in once when the section enters the viewport. Default true. */
  reveal?: boolean
  /** Id of the section element. */
  id?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_LANDING_HERO_MOCK: LandingHeroMock = {
  agent: "Atlas",
  time: "09:14",
  file: "ticket-2318.eml",
  fileMeta: "Email · Harbor & Finch",
  message: "Harbor & Finch say order 4471 is late. Can you draft a reply?",
  placeholder: "Message Atlas",
  recordKind: "Draft reply",
  recordTitle: "Ticket #2318",
  rows: [
    { label: "Customer", value: "Harbor & Finch" },
    { label: "Order", value: "#4471, in transit" },
    { label: "New date", value: "Thu 3 Dec" },
  ],
  checked: "Checked against the carrier's tracking",
  steps: ["A ticket comes in", "Atlas reads the thread", "A reply to approve"],
}

export const DEFAULT_LANDING_HERO = {
  eyebrow: "For support teams",
  headline: ["Atlas drafts.", "You approve."],
  description:
    "Northwind reads each support request, looks up the order and your help centre, and drafts an answer. A person on your team approves it before the customer sees a word.",
  primaryAction: { label: "Start free", href: "#start" },
  secondaryAction: { label: "See how it works", href: "#how-it-works" },
  reassurance: "100 tickets a month free. No card needed.",
  proof: ["Works with email, chat and your help desk", "Every answer cites its source", "Nothing reaches a customer without approval"],
  mock: DEFAULT_LANDING_HERO_MOCK,
} satisfies Required<LandingHeroContent>

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lhr {
  --lhr-ink: #000;
  --lhr-surface: #fff;
  --lhr-accent: var(--pane-accent, #0060e2);
  --lhr-on-accent: #fff;
  --lhr-btn: var(--lhr-accent);
  --lhr-panel-bg: var(--lhr-accent);
  --lhr-panel-dot: rgb(255 255 255 / .26);
  --lhr-panel-line: transparent;
  --lhr-t1: color-mix(in oklab, var(--lhr-ink) 88%, transparent);
  --lhr-t2: color-mix(in oklab, var(--lhr-ink) 61%, transparent);
  --lhr-t3: color-mix(in oklab, var(--lhr-ink) 45%, transparent);
  --lhr-t4: color-mix(in oklab, var(--lhr-ink) 27%, transparent);
  --lhr-fill: color-mix(in oklab, var(--lhr-ink) 5%, transparent);
  --lhr-line: color-mix(in oklab, var(--lhr-ink) 8%, transparent);
  --lhr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --lhr-card-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 6px -2px rgb(0 0 0 / .1), 0 18px 40px -16px rgb(0 0 0 / .32);
  --lhr-ease: cubic-bezier(.22, 1, .36, 1);
  --lhr-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --lhr-hk: 1;
  --lhr-hls: -.038em;
  --lhr-r-btn: 10px;
  --lhr-r-card: 14px;
  --lhr-r-panel: 24px;
  position: relative;
  display: block;
  width: 100%;
  container: lhr / inline-size;
  font: 15px/24px var(--lhr-font);
  color: var(--lhr-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .lhr {
  --lhr-ink: #fff;
  --lhr-surface: #1c1c1e;
  --lhr-accent: var(--pane-accent, #4d8dff);
  --lhr-btn: color-mix(in oklab, var(--lhr-accent) 78%, #000);
  --lhr-panel-bg: color-mix(in oklab, var(--lhr-accent) 66%, #000);
  --lhr-panel-dot: rgb(255 255 255 / .2);
  --lhr-t1: color-mix(in oklab, var(--lhr-ink) 92%, transparent);
  --lhr-t2: color-mix(in oklab, var(--lhr-ink) 64%, transparent);
  --lhr-t3: color-mix(in oklab, var(--lhr-ink) 46%, transparent);
  --lhr-t4: color-mix(in oklab, var(--lhr-ink) 28%, transparent);
  --lhr-fill: color-mix(in oklab, var(--lhr-ink) 7%, transparent);
  --lhr-line: color-mix(in oklab, var(--lhr-ink) 10%, transparent);
  --lhr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --lhr-card-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 6px -2px rgb(0 0 0 / .4), 0 18px 40px -16px rgb(0 0 0 / .7);
}
.lhr[data-panel="soft"] {
  --lhr-panel-bg: color-mix(in oklab, var(--lhr-ink) 3.5%, transparent);
  --lhr-panel-dot: color-mix(in oklab, var(--lhr-ink) 16%, transparent);
  --lhr-card-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .05), 0 14px 32px -14px rgb(0 0 0 / .18);
}
:is(.dark, [data-theme="dark"]) .lhr[data-panel="soft"] {
  --lhr-panel-bg: color-mix(in oklab, var(--lhr-ink) 4%, transparent);
  --lhr-panel-dot: color-mix(in oklab, var(--lhr-ink) 14%, transparent);
  --lhr-card-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 6px -2px rgb(0 0 0 / .4), 0 14px 32px -14px rgb(0 0 0 / .6);
}

/* Mono: ink on paper, hairlines, square corners and a monospaced face (a size smaller, it runs wider) */
html[data-style="mono"] .lhr {
  --lhr-ink: #000; --lhr-surface: #fff; --lhr-accent: #111; --lhr-on-accent: #fff; --lhr-btn: #111;
  --lhr-panel-bg: #111; --lhr-panel-dot: rgb(255 255 255 / .22);
  --lhr-shadow: 0 0 0 1px rgb(0 0 0 / .16); --lhr-card-shadow: 0 0 0 1px rgb(0 0 0 / .16);
  --lhr-line: color-mix(in oklab, var(--lhr-ink) 12%, transparent);
  --lhr-ease: cubic-bezier(.2, .9, .1, 1);
  --lhr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lhr-hk: .8; --lhr-hls: -.055em;
  --lhr-r-btn: 4px; --lhr-r-card: 6px; --lhr-r-panel: 8px;
}
html[data-style="mono"].dark .lhr {
  --lhr-ink: #fff; --lhr-surface: #0a0a0a; --lhr-accent: #f2f2f2; --lhr-on-accent: #000; --lhr-btn: #f2f2f2;
  --lhr-panel-bg: #141414; --lhr-panel-dot: rgb(255 255 255 / .2); --lhr-panel-line: rgb(255 255 255 / .14);
  --lhr-shadow: 0 0 0 1px rgb(255 255 255 / .18); --lhr-card-shadow: 0 0 0 1px rgb(255 255 255 / .18);
}
html[data-style="mono"] .lhr[data-panel="soft"] { --lhr-panel-bg: transparent; --lhr-panel-dot: color-mix(in oklab, var(--lhr-ink) 18%, transparent); --lhr-panel-line: var(--lhr-line) }

/* Glass: the mock's cards are frosted over the dotted panel; text takes Pane's stronger glass ramp */
html[data-style="glass"] .lhr {
  --lhr-ink: var(--pane-ink); --lhr-surface: var(--pane-solid); --lhr-accent: var(--pane-accent);
  --lhr-shadow: var(--pane-shadow); --lhr-ease: var(--pane-ease); --lhr-font: var(--pane-font);
  --lhr-t1: var(--pane-t1); --lhr-t2: var(--pane-t2); --lhr-t3: var(--pane-t3); --lhr-t4: var(--pane-t4);
  --lhr-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lhr-r-btn: 12px; --lhr-r-card: 18px; --lhr-r-panel: 28px;
}
html[data-style="glass"] .lhr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
html[data-style="glass"] .lhr-btn[data-variant="secondary"] { background-color: var(--pane-tint-float); background-image: var(--pane-sheen); box-shadow: var(--pane-shadow) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lhr-card { -webkit-backdrop-filter: blur(16px) saturate(1.8); backdrop-filter: blur(16px) saturate(1.8) }
  html[data-style="glass"].dark .lhr-card { -webkit-backdrop-filter: blur(16px) saturate(1.7); backdrop-filter: blur(16px) saturate(1.7) }
  html[data-style="glass"][data-refract] .lhr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.06); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.06) }
  html[data-style="glass"].dark[data-refract] .lhr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.6) brightness(.8); backdrop-filter: url(#pane-glass-card-d) saturate(1.6) brightness(.8) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lhr-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lhr *, .lhr *::before, .lhr *::after { box-sizing: border-box }
:where(.lhr) :is(h1, h2, p, ul, li, dl, dt, dd) { margin: 0; padding: 0 }
:where(.lhr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.lhr) a { color: inherit; text-decoration: none }
.lhr :focus-visible { outline: 2px solid var(--lhr-accent); outline-offset: 2px }

.lhr-in { max-width: 1248px; margin: 0 auto; padding: 40px 24px 48px; display: grid; gap: 48px }
@container lhr (min-width: 560px) { .lhr-in { padding: 56px 24px 72px; gap: 56px } }
@container lhr (min-width: 880px) {
  .lhr[data-layout="split"] .lhr-in {
    grid-template-columns: minmax(0, 11fr) minmax(0, 13fr); column-gap: clamp(40px, 5cqi, 72px); align-items: center;
    padding-top: 72px; padding-bottom: 88px;
  }
  .lhr[data-layout="centered"] .lhr-in { padding-top: 88px; padding-bottom: 88px; gap: 64px }
}

/* ---- copy ---- */
.lhr-copy { min-width: 0; container: lhrc / inline-size }
.lhr[data-layout="centered"] .lhr-copy { width: 100%; max-width: 880px; margin: 0 auto; text-align: center }
.lhr-eyebrow { margin-bottom: 20px; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--lhr-t2) }
.lhr-h {
  font-size: clamp(36px * var(--lhr-hk), 14cqi * var(--lhr-hk), 80px * var(--lhr-hk));
  line-height: 1.04; font-weight: 500; letter-spacing: var(--lhr-hls); color: var(--lhr-t1);
}
.lhr[data-layout="centered"] .lhr-h { font-size: clamp(36px * var(--lhr-hk), 8.4cqi * var(--lhr-hk), 72px * var(--lhr-hk)) }
.lhr-h > span { display: block; text-wrap: balance }
.lhr-h > .lhr-h2 { color: var(--lhr-t3) }
.lhr-sub { margin-top: 24px; max-width: 32em; font-size: 16px; line-height: 26px; color: var(--lhr-t2); text-wrap: pretty }
.lhr[data-layout="centered"] .lhr-sub { margin-inline: auto }
@container lhrc (min-width: 440px) { .lhr-sub { font-size: 18px; line-height: 28px } }

.lhr-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 32px }
@container lhrc (min-width: 400px) { .lhr-actions { flex-direction: row; flex-wrap: wrap } }
.lhr[data-layout="centered"] .lhr-actions { justify-content: center }
.lhr-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px;
  border-radius: var(--lhr-r-btn); font-size: 15px; line-height: 1; font-weight: 500; white-space: nowrap;
  transition: background-color 160ms var(--lhr-ease), box-shadow 160ms var(--lhr-ease), transform 160ms var(--lhr-ease);
}
.lhr-btn:active { transform: scale(.98) }
.lhr-btn[data-variant="primary"] { background: var(--lhr-btn); color: var(--lhr-on-accent) }
.lhr-btn[data-variant="primary"]:hover { background: color-mix(in oklab, var(--lhr-btn) 88%, #000) }
.lhr-btn[data-variant="secondary"] { background: var(--lhr-surface); box-shadow: inset 0 0 0 1px var(--lhr-line), var(--lhr-shadow); color: var(--lhr-t1) }
.lhr-btn[data-variant="secondary"]:hover { background-color: color-mix(in oklab, var(--lhr-surface) 94%, var(--lhr-ink)) }
html[data-style="mono"].dark .lhr-btn[data-variant="primary"]:hover { background: color-mix(in oklab, var(--lhr-btn) 86%, #000) }

.lhr-note { margin-top: 16px; font-size: 13px; line-height: 20px; color: var(--lhr-t3) }
.lhr-proof { list-style: none; display: grid; gap: 10px; margin-top: 36px }
.lhr[data-layout="centered"] .lhr-proof { justify-content: center; margin-top: 32px }
@container lhrc (min-width: 640px) { .lhr[data-layout="centered"] .lhr-proof { display: flex; flex-wrap: wrap; gap: 10px 28px } }
.lhr-proof li { display: flex; align-items: flex-start; gap: 10px; font-size: 15px; line-height: 22px; color: var(--lhr-t2); text-align: left; text-wrap: pretty }
.lhr-proof svg { flex: none; width: 16px; height: 16px; margin-top: 3px; color: var(--lhr-t2) }

/* ---- panel ---- */
.lhr-media { min-width: 0 }
.lhr-panel {
  position: relative; overflow: hidden; container: lhrp / inline-size;
  display: flex; flex-direction: column; align-items: stretch; justify-content: center;
  min-height: 420px; margin-inline: -24px; padding: 40px 20px 20px;
  background: var(--lhr-panel-bg); box-shadow: inset 0 0 0 1px var(--lhr-panel-line);
}
@container lhr (min-width: 560px) { .lhr-panel { margin-inline: 0; border-radius: var(--lhr-r-panel); padding: 48px 40px 24px; min-height: 480px } }
@container lhr (min-width: 880px) {
  .lhr[data-layout="split"] .lhr-panel { min-height: 560px }
  .lhr[data-layout="centered"] .lhr-panel { min-height: 520px; padding-top: 64px }
}
/* Fine dots, gathering towards the edges */
.lhr-panel::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle at center, var(--lhr-panel-dot) 0 .9px, transparent 1.3px);
  background-size: 8px 8px; background-position: 4px 4px;
  -webkit-mask-image: radial-gradient(130% 110% at 50% 46%, rgb(0 0 0 / .18) 22%, #000 78%);
  mask-image: radial-gradient(130% 110% at 50% 46%, rgb(0 0 0 / .18) 22%, #000 78%);
}
.lhr-slot { position: relative; flex: 1; display: grid; place-items: center; min-width: 0 }
.lhr-slot > * { max-width: 100% }

/* ---- built-in mock: a message becomes a tidy record ---- */
.lhr-stage { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; max-width: 640px; font-size: 13px; line-height: 20px }
.lhr-card { border-radius: var(--lhr-r-card); background: var(--lhr-surface); box-shadow: var(--lhr-card-shadow); text-align: left; min-width: 0 }

/* The record sits in the row under the chat and tucks up over its empty foot (or its composer), never over the message */
.lhr-chat { grid-area: 1 / 1; justify-self: start; align-self: start; width: min(82%, 276px) }
.lhr-chat-head { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-bottom: 1px solid var(--lhr-line) }
.lhr-ava { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--lhr-fill); font-size: 11px; font-weight: 600; color: var(--lhr-t2) }
html[data-style="mono"] .lhr-ava { border-radius: 4px }
.lhr-chat-head b { font-weight: 500; color: var(--lhr-t1) }
.lhr-chat-head time { margin-left: auto; font-size: 12px; color: var(--lhr-t3); font-variant-numeric: tabular-nums }
.lhr-chat-body { display: flex; justify-content: flex-end; padding: 14px 12px 44px 28px }
.lhr-bubble {
  display: grid; gap: 8px; padding: 8px; border-radius: calc(var(--lhr-r-card) - 2px); background: var(--lhr-fill);
  transition: opacity 560ms var(--lhr-ease), transform 560ms var(--lhr-ease);
}
.lhr-bubble p { padding: 0 4px 2px; color: var(--lhr-t1) }
.lhr-file {
  display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: calc(var(--lhr-r-card) - 6px); background: var(--lhr-surface);
  box-shadow: 0 0 0 1px var(--lhr-line); transition: box-shadow 420ms var(--lhr-ease);
}
html[data-style="glass"] .lhr-file { background: color-mix(in oklab, var(--pane-solid) 70%, transparent) }
.lhr-file-ic { display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 7px; background: var(--lhr-fill); color: var(--lhr-t2) }
.lhr-file-ic svg { width: 15px; height: 15px }
.lhr-file span:last-child { display: grid; min-width: 0 }
.lhr-file b { font-weight: 500; font-size: 12.5px; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lhr-file small { font-size: 12px; line-height: 16px; color: var(--lhr-t3) }
.lhr-compose { display: none; margin: 0 12px 12px; height: 32px; padding: 0 12px; border-radius: 8px; box-shadow: inset 0 0 0 1px var(--lhr-line); font-size: 12.5px; line-height: 32px; color: var(--lhr-t3); overflow: hidden; white-space: nowrap; text-overflow: ellipsis }

.lhr-rec {
  grid-area: 2 / 1; justify-self: end; align-self: start; width: min(88%, 300px); margin-top: -32px;
  transform-origin: 0 0;
  transition: opacity 640ms var(--lhr-ease), transform 760ms var(--lhr-ease);
}
.lhr-rec-head { display: grid; padding: 14px 16px 10px }
.lhr-rec-head small { font-size: 12px; line-height: 16px; color: var(--lhr-t3) }
.lhr-rec-head b { margin-top: 2px; font-size: 15px; line-height: 22px; font-weight: 500; color: var(--lhr-t1) }
.lhr-rows { padding: 0 16px }
.lhr-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 36px; border-top: 1px solid var(--lhr-line) }
.lhr-row dt { color: var(--lhr-t3) }
.lhr-row dd { position: relative; display: grid; justify-items: end; min-width: 0; font-weight: 500; color: var(--lhr-t1); font-variant-numeric: tabular-nums }
.lhr-row dd > span { grid-area: 1 / 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.lhr-skel { align-self: center; width: var(--w, 64px); height: 8px; border-radius: 4px; background: var(--lhr-fill); transition: opacity 360ms var(--lhr-ease) }
.lhr-val { transition: opacity 480ms var(--lhr-ease), filter 480ms var(--lhr-ease), transform 480ms var(--lhr-ease) }
.lhr-checked {
  display: flex; align-items: center; gap: 8px; padding: 10px 16px 14px; border-top: 1px solid var(--lhr-line);
  font-size: 12.5px; color: var(--lhr-t2); transition: opacity 480ms var(--lhr-ease), transform 480ms var(--lhr-ease);
}
.lhr-checked svg { flex: none; width: 14px; height: 14px; color: var(--lhr-t2) }

/* Wider panels show the composer; wide enough panels set the two cards side by side */
@container lhrp (min-width: 480px) {
  .lhr-compose { display: block }
  .lhr-chat-body { padding-bottom: 14px }
  .lhr-rec { margin-top: -36px }
}
@container lhrp (min-width: 700px) {
  .lhr-stage { max-width: 620px; grid-template-columns: auto auto; justify-content: space-between; column-gap: 24px }
  .lhr-chat { width: 276px }
  .lhr-rec { grid-area: 1 / 2; width: 300px; margin-top: 84px }
}

/* The story. Step 0: nothing yet. 1: the message arrives. 2: the attachment is read into a record. 3: fields fill, checked. */
.lhr-stage[data-step="0"] .lhr-bubble { opacity: 0; transform: translateY(10px) }
.lhr-stage:is([data-step="0"], [data-step="1"]) .lhr-rec { opacity: 0; transform: translate(-28px, -24px) scale(.96) }
.lhr-stage:is([data-step="2"], [data-step="3"]) .lhr-file { box-shadow: 0 0 0 1.5px var(--lhr-accent) }
.lhr-stage[data-step="3"] .lhr-file { box-shadow: 0 0 0 1px var(--lhr-line); transition-delay: 600ms }
.lhr-stage:not([data-step="3"]) .lhr-val { opacity: 0; filter: blur(4px); transform: translateY(3px) }
.lhr-stage[data-step="3"] .lhr-val { transition-delay: calc(var(--i) * 90ms) }
.lhr-stage[data-step="3"] .lhr-skel { opacity: 0; transition-delay: calc(var(--i) * 90ms) }
.lhr-stage:not([data-step="3"]) .lhr-checked { opacity: 0; transform: translateY(4px) }
.lhr-stage[data-step="3"] .lhr-checked { transition-delay: 420ms }

.lhr-steps { position: relative; display: flex; justify-content: center; gap: 2px; margin-top: 28px }
.lhr-step { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50% }
.lhr-step i { width: 6px; height: 6px; border-radius: 50%; background: rgb(255 255 255 / .42); transition: background-color 320ms var(--lhr-ease), transform 320ms var(--lhr-ease) }
.lhr-step[aria-current] i { background: #fff; transform: scale(1.15) }
.lhr-step:hover:not([aria-current]) i { background: rgb(255 255 255 / .7) }
.lhr-step:focus-visible { outline-color: #fff; outline-offset: 0 }
.lhr[data-panel="soft"] .lhr-step i { background: var(--lhr-t4) }
.lhr[data-panel="soft"] .lhr-step[aria-current] i { background: var(--lhr-t1) }
.lhr[data-panel="soft"] .lhr-step:hover:not([aria-current]) i { background: var(--lhr-t3) }
.lhr[data-panel="soft"] .lhr-step:focus-visible { outline-color: var(--lhr-accent) }
html[data-style="mono"] .lhr-step i { border-radius: 1px }
.lhr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* ---- arrival: once, in reading order ---- */
.lhr[data-armed] .lhr-copy:not([data-in]) .lhr-r, .lhr[data-armed] .lhr-media:not([data-in]) { opacity: 0 }
.lhr[data-armed] .lhr-copy[data-in] .lhr-r { animation: lhr-rise 720ms var(--lhr-ease) backwards; animation-delay: calc(var(--i) * 70ms) }
.lhr[data-armed] .lhr-media[data-in] { animation: lhr-rise 860ms var(--lhr-ease) backwards; animation-delay: var(--lhr-md, 0ms) }
@keyframes lhr-rise { from { opacity: 0; transform: translateY(14px) } }

@media (prefers-reduced-motion: reduce) {
  .lhr *, .lhr *::before, .lhr *::after { animation: none !important; transition: none !important }
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

const STAGGER = 70
/** The panel arrives after the copy: eyebrow, headline, sentence, buttons, note, proof (indices 0-5). */
const PANEL_DELAY = 6 * STAGGER
/** Wait after the panel has arrived before the story starts, then the time each frame holds. */
const STORY_LEAD = 520
const STORY_STEP = 1350

/* -------------------------------------------------------------------------- */
/*                              The built-in mock                             */
/* -------------------------------------------------------------------------- */

const SKELETON_WIDTHS = [72, 58, 66]

function RecordMock({ mock, start, delay, reduced }: { mock: LandingHeroMock; start: boolean; delay: number; reduced: boolean }) {
  const [step, setStep] = React.useState(0)
  const timers = React.useRef<number[]>([])
  const played = React.useRef(false)
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  React.useEffect(() => {
    if (!start || reduced || played.current) return
    played.current = true
    const at = (ms: number, s: number) => timers.current.push(window.setTimeout(() => setStep(s), ms))
    at(delay, 1)
    at(delay + STORY_STEP, 2)
    at(delay + STORY_STEP * 2, 3)
  }, [start, reduced, delay])
  React.useEffect(() => clear, [])

  const shown = reduced ? 3 : step
  const rows = mock.rows.slice(0, 3)
  const go = (s: number) => {
    clear()
    played.current = true
    setStep(s)
  }
  const label = `${mock.message} ${mock.file} becomes the record “${mock.recordTitle}”: ${rows.map((r) => `${r.label} ${r.value}`).join(", ")}. ${mock.checked}.`

  return (
    <>
      <div className="lhr-stage" data-step={shown} role="img" aria-label={label}>
        <div className="lhr-card lhr-chat" aria-hidden>
          <div className="lhr-chat-head">
            <span className="lhr-ava">{mock.agent.slice(0, 1).toUpperCase()}</span>
            <b>{mock.agent}</b>
            <time>{mock.time}</time>
          </div>
          <div className="lhr-chat-body">
            <div className="lhr-bubble">
              <div className="lhr-file">
                <span className="lhr-file-ic">
                  <FileText strokeWidth={1.75} />
                </span>
                <span>
                  <b>{mock.file}</b>
                  <small>{mock.fileMeta}</small>
                </span>
              </div>
              <p>{mock.message}</p>
            </div>
          </div>
          <div className="lhr-compose">{mock.placeholder}</div>
        </div>
        <div className="lhr-card lhr-rec" aria-hidden>
          <div className="lhr-rec-head">
            <small>{mock.recordKind}</small>
            <b>{mock.recordTitle}</b>
          </div>
          <dl className="lhr-rows">
            {rows.map((r, i) => (
              <div key={i} className="lhr-row" style={{ "--i": i } as React.CSSProperties}>
                <dt>{r.label}</dt>
                <dd>
                  <span className="lhr-skel" style={{ "--w": `${SKELETON_WIDTHS[i % 3]}px` } as React.CSSProperties} />
                  <span className="lhr-val">{r.value}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="lhr-checked">
            <Check strokeWidth={2} />
            {mock.checked}
          </p>
        </div>
      </div>
      <div className="lhr-steps" role="group" aria-label="Story frames">
        {mock.steps.map((name, i) => (
          <button
            key={i}
            type="button"
            className="lhr-step"
            aria-label={`Frame ${i + 1} of 3: ${name}`}
            aria-current={shown === i + 1 ? "step" : undefined}
            onClick={() => go(i + 1)}
          >
            <i />
          </button>
        ))}
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

/** The opening of a product landing page: a two-tone headline, one sentence, two actions and proof, beside a dotted accent panel with a small story. */
export function LandingHero({
  eyebrow = DEFAULT_LANDING_HERO.eyebrow,
  headline = DEFAULT_LANDING_HERO.headline as [string, string?],
  description = DEFAULT_LANDING_HERO.description,
  primaryAction = DEFAULT_LANDING_HERO.primaryAction,
  secondaryAction = DEFAULT_LANDING_HERO.secondaryAction,
  reassurance = DEFAULT_LANDING_HERO.reassurance,
  proof = DEFAULT_LANDING_HERO.proof,
  mock,
  media,
  layout = "split",
  panel = "accent",
  headingLevel = 1,
  reveal = true,
  id,
  className,
}: LandingHeroProps) {
  const reduced = useReducedMotion()
  const headingId = React.useId()
  const copyRef = React.useRef<HTMLDivElement>(null)
  const mediaRef = React.useRef<HTMLDivElement>(null)
  const [armed, setArmed] = React.useState(false)
  const [copyIn, setCopyIn] = React.useState(false)
  const [mediaIn, setMediaIn] = React.useState(false)
  const [mediaDelay, setMediaDelay] = React.useState(PANEL_DELAY)
  const copyAt = React.useRef(0)

  // Hide the parts before the first paint only when they are going to rise in; otherwise everything is simply there.
  React.useLayoutEffect(() => {
    setArmed(reveal && !reduced)
  }, [reveal, reduced])

  React.useEffect(() => {
    const copy = copyRef.current
    const med = mediaRef.current
    if (!copy || !med) return
    if (typeof IntersectionObserver === "undefined") {
      setCopyIn(true)
      setMediaIn(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          io.unobserve(e.target)
          if (e.target === copy) {
            copyAt.current = performance.now()
            setCopyIn(true)
          } else {
            // When the panel enters with the copy it waits its turn; entering later (phones) it rises at once.
            const since = copyAt.current ? performance.now() - copyAt.current : 0
            setMediaDelay(copyAt.current ? Math.max(0, PANEL_DELAY - since) : PANEL_DELAY)
            setMediaIn(true)
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(copy)
    io.observe(med)
    return () => io.disconnect()
  }, [])

  const H = headingLevel === 2 ? "h2" : "h1"
  const [line1, line2] = headline
  const points = proof.slice(0, 4)
  const story = { ...DEFAULT_LANDING_HERO_MOCK, ...mock }
  const r = (i: number) => ({ style: { "--i": i } as React.CSSProperties })

  return (
    <section
      id={id}
      className={cn("lhr", className)}
      data-layout={layout}
      data-panel={panel}
      data-armed={armed ? "" : undefined}
      aria-labelledby={headingId}
    >
      <style href="landing-hero" precedence="default">
        {CSS}
      </style>
      <div className="lhr-in">
        <div className="lhr-copy" ref={copyRef} data-in={copyIn ? "" : undefined}>
          {eyebrow && (
            <p {...r(0)} className="lhr-r lhr-eyebrow">
              {eyebrow}
            </p>
          )}
          <H id={headingId} {...r(1)} className="lhr-r lhr-h">
            <span className="lhr-h1">{line1}</span>
            {line2 && (
              <>
                {" "}
                <span className="lhr-h2">{line2}</span>
              </>
            )}
          </H>
          {description && (
            <p {...r(2)} className="lhr-r lhr-sub">
              {description}
            </p>
          )}
          {(primaryAction || secondaryAction) && (
            <div {...r(3)} className="lhr-r lhr-actions">
              {primaryAction && (
                <a className="lhr-btn" data-variant="primary" href={primaryAction.href}>
                  {primaryAction.label}
                </a>
              )}
              {secondaryAction && (
                <a className="lhr-btn" data-variant="secondary" href={secondaryAction.href}>
                  {secondaryAction.label}
                </a>
              )}
            </div>
          )}
          {reassurance && (
            <p {...r(4)} className="lhr-r lhr-note">
              {reassurance}
            </p>
          )}
          {points.length > 0 && (
            <ul {...r(5)} className="lhr-r lhr-proof">
              {points.map((p, i) => (
                <li key={i}>
                  <Check strokeWidth={2} aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className="lhr-media"
          ref={mediaRef}
          data-in={mediaIn ? "" : undefined}
          style={{ "--lhr-md": `${Math.round(mediaDelay)}ms` } as React.CSSProperties}
        >
          <div className="lhr-panel">
            <div className="lhr-slot">
              {media ?? (
                <RecordMock
                  mock={story}
                  start={mediaIn}
                  delay={(armed ? mediaDelay : 0) + STORY_LEAD}
                  reduced={reduced}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

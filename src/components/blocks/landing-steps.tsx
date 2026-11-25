"use client"

/**
 * Landing Steps – "How it works" as a real sequence.
 *
 * A two-tone heading on the left, an optional side note and link on the right, then two to four step cards in a
 * row (stacked on phones). Each card is a soft dotted stage holding a small mock that plays, and under it the
 * step's number, title and two lines. The built-in mocks tell one story across the cards and play in order once
 * the section is in view, each starting as the previous one finishes: something arrives in an inbox, rows of a
 * table fill in, a person approves it (a fourth step shows the activity log). A thin line under the stages fills
 * as the story advances; the step that is playing keeps full-strength text while the others are muted, and when
 * the story ends all are full strength.
 *
 * ```tsx
 * <LandingSteps
 *   title="From ticket to reply." titleMuted="One person signs off."
 *   steps={[{ title: "A request comes in", body: "…" }, { title: "Atlas drafts the reply", body: "…" }, { title: "You approve it", body: "…" }]}
 * />
 * ```
 *
 * Every word is plain data (strings, numbers, arrays of those), so the section can be edited and saved as JSON;
 * `<LandingSteps />` alone renders `DEFAULT_LANDING_STEPS`. A step can bring its own `media` instead of a mock.
 * `replayOnHover` replays a card's mock when it is hovered or focused. Reduced motion shows every mock finished.
 */

import * as React from "react"
import { ArrowRight, Check, FileText } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** The built-in mocks. Together they tell one story: it arrives, it is worked on, a person approves it, it is on the record. */
export type LandingStepsMock = "arrive" | "work" | "approve" | "log"

export type LandingStep = {
  /** Short title, e.g. "A request comes in". */
  title: string
  /** Two lines (about 100 characters). */
  body: string
  /** Which built-in mock plays on the stage. Default by position: arrive, work, approve, log. */
  mock?: LandingStepsMock
  /** Your own picture or mock for the stage, in place of the built-in one. */
  media?: React.ReactNode
  /** What the stage shows, for screen readers. Default: a description of the built-in mock. */
  mediaLabel?: string
  /** How long this step holds the story, in ms. Default: the built-in mock's length, or 2400 with `media`. */
  duration?: number
}

/** The words inside the built-in mocks. The approve card reuses the first two `work.rows`. */
export type LandingStepsStory = {
  inbox: {
    title: string
    meta: string
    from: string
    subject: string
    file: string
    size: string
    time: string
    earlierFrom: string
    earlierSubject: string
    earlierTime: string
  }
  work: { title: string; working: string; done: string; rows: { label: string; value: string }[] }
  approve: { title: string; pending: string; approved: string; action: string; note: string }
  log: { title: string; meta: string; items: { label: string; time: string }[] }
}

export type LandingStepsLink = { label: string; href: string }

export type LandingStepsProps = {
  /** First line of the heading. */
  title?: string
  /** Second line of the heading, muted. Empty to leave it out. */
  titleMuted?: string
  /** Side note on the right of the heading. Empty to leave it out. */
  note?: string
  /** Link under the side note. `null` to leave it out. */
  link?: LandingStepsLink | null
  /** Two to four steps; more than four are cut. */
  steps?: LandingStep[]
  /** Words inside the built-in mocks. */
  story?: LandingStepsStory
  /** Replay a card's mock when it is hovered or focused (after the story has played). Default false. */
  replayOnHover?: boolean
  /** Rise and fade the heading and cards in once when the section enters the viewport. Default true. */
  reveal?: boolean
  /** Level of the section heading; step titles sit one level below. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** id for the section (the heading gets `${id}-title`). */
  id?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Default content                              */
/* -------------------------------------------------------------------------- */

export const DEFAULT_LANDING_STEPS = {
  title: "From ticket to reply.",
  titleMuted: "One person signs off.",
  note: "Atlas reads each request and drafts the answer. Nothing reaches the customer until someone on your team approves it.",
  link: { label: "See a sample ticket", href: "#" },
  steps: [
    { title: "A request comes in", body: "Email, chat and help-desk forms land in one queue. Atlas picks each one up as it arrives." },
    { title: "Atlas drafts the reply", body: "It looks up the order, checks your help centre and fills in the answer, one fact at a time." },
    { title: "You approve it", body: "A person reads the draft, edits a line if needed and sends it. Every change stays on the ticket." },
  ],
  story: {
    inbox: {
      title: "Inbox",
      meta: "Support",
      from: "Harbor & Finch",
      subject: "Order 4471 is late",
      file: "tracking.png",
      size: "212 KB",
      time: "09:41",
      earlierFrom: "Sage",
      earlierSubject: "Morning queue",
      earlierTime: "Mon",
    },
    work: {
      title: "Ticket #2318",
      working: "Looking up",
      done: "4 facts",
      rows: [
        { label: "Customer", value: "Harbor & Finch" },
        { label: "Order", value: "#4471" },
        { label: "Status", value: "In transit" },
        { label: "Arrives", value: "Thu 3 Dec" },
      ],
    },
    approve: { title: "Ticket #2318", pending: "For review", approved: "Approved", action: "Approve", note: "Approved by Rosa at 09:44" },
    log: {
      title: "Activity",
      meta: "Today",
      items: [
        { label: "Received from Harbor & Finch", time: "09:41" },
        { label: "Drafted by Atlas", time: "09:42" },
        { label: "Approved by Rosa", time: "09:44" },
      ],
    },
  },
} satisfies Required<Pick<LandingStepsProps, "title" | "titleMuted" | "note" | "link" | "steps" | "story">>

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lst {
  --lst-ink: #000;
  --lst-surface: #fff;
  --lst-accent: var(--pane-accent, #0060e2);
  --lst-t1: color-mix(in oklab, var(--lst-ink) 88%, transparent);
  --lst-t2: color-mix(in oklab, var(--lst-ink) 61%, transparent);
  --lst-t3: color-mix(in oklab, var(--lst-ink) 45%, transparent);
  --lst-t4: color-mix(in oklab, var(--lst-ink) 27%, transparent);
  --lst-fill: color-mix(in oklab, var(--lst-ink) 6%, transparent);
  --lst-line: color-mix(in oklab, var(--lst-ink) 8%, transparent);
  --lst-stage: color-mix(in oklab, var(--lst-accent) 4%, var(--lst-surface));
  --lst-dot: color-mix(in oklab, var(--lst-accent) 26%, transparent);
  --lst-card-bg: var(--lst-surface);
  --lst-card: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .05), 0 14px 32px -14px rgb(20 30 60 / .18);
  --lst-btn: var(--lst-ink);
  --lst-btn-ink: var(--lst-surface);
  --lst-glint: rgb(255 255 255 / .7);
  --lst-ease: cubic-bezier(.22, 1, .36, 1);
  --lst-gap: 24px;
  --lst-r-stage: 16px;
  --lst-r-card: 12px;
  --lst-r-small: 6px;
  --lst-ls-title: -.035em;
  position: relative; display: block; width: 100%;
  container: lst / inline-size;
  font: 14px/22px var(--lst-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lst-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .lst {
  --lst-ink: #fff;
  --lst-surface: #1c1c1e;
  --lst-accent: var(--pane-accent, #4d8dff);
  --lst-t1: color-mix(in oklab, var(--lst-ink) 92%, transparent);
  --lst-t2: color-mix(in oklab, var(--lst-ink) 64%, transparent);
  --lst-t3: color-mix(in oklab, var(--lst-ink) 46%, transparent);
  --lst-t4: color-mix(in oklab, var(--lst-ink) 26%, transparent);
  --lst-fill: color-mix(in oklab, var(--lst-ink) 8%, transparent);
  --lst-line: color-mix(in oklab, var(--lst-ink) 11%, transparent);
  --lst-stage: color-mix(in oklab, var(--lst-accent) 7%, #121214);
  --lst-dot: color-mix(in oklab, var(--lst-accent) 34%, transparent);
  --lst-card: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px rgb(0 0 0 / .4), 0 16px 36px -16px rgb(0 0 0 / .7);
  --lst-glint: rgb(255 255 255 / .1);
}

/* Mono: ink on paper, 1px hairlines, tighter corners, a monospaced face a size smaller */
html[data-style="mono"] .lst {
  --lst-ink: #000; --lst-surface: #fff; --lst-accent: #111;
  --lst-stage: #f6f6f6; --lst-dot: rgb(0 0 0 / .13);
  --lst-card: 0 0 0 1px rgb(0 0 0 / .14);
  --lst-line: color-mix(in oklab, var(--lst-ink) 12%, transparent);
  --lst-ease: cubic-bezier(.2, .9, .1, 1);
  --lst-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lst-r-stage: 8px; --lst-r-card: 6px; --lst-r-small: 3px; --lst-ls-title: -.04em;
}
html[data-style="mono"].dark .lst {
  --lst-ink: #fff; --lst-surface: #0a0a0a; --lst-accent: #f2f2f2;
  --lst-stage: #111; --lst-dot: rgb(255 255 255 / .14);
  --lst-card: 0 0 0 1px rgb(255 255 255 / .16);
}
html[data-style="mono"] .lst-title { font-size: clamp(26px, 2.2cqi + 18px, 44px); font-weight: 500 }
html[data-style="mono"] .lst-step h3, html[data-style="mono"] .lst-step h4, html[data-style="mono"] .lst-step h5 { font-size: 15.5px }
html[data-style="mono"] .lst-body { font-size: 13px; line-height: 21px }
html[data-style="mono"] .lst-note { font-size: 14px; line-height: 23px }
html[data-style="mono"] .lst-card { font-size: 11.5px }

/* Glass: the stage is the frosted slab; the mock card inside stays a near-solid nested surface (no glass on glass) */
html[data-style="glass"] .lst {
  --lst-ink: var(--pane-ink); --lst-surface: var(--pane-solid); --lst-accent: var(--pane-accent);
  --lst-t1: var(--pane-t1); --lst-t2: var(--pane-t2); --lst-t3: var(--pane-t3); --lst-t4: var(--pane-t4);
  --lst-line: color-mix(in oklab, var(--pane-ink) 14%, transparent);
  --lst-card-bg: var(--pane-tint-nested); --lst-card: var(--pane-shadow);
  --lst-dot: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lst-ease: var(--pane-ease); --lst-font: var(--pane-font);
  --lst-r-stage: 24px; --lst-r-card: 14px;
}
html[data-style="glass"] .lst-stage { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lst-stage { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .lst-stage { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .lst-stage { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .lst-stage { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lst-stage { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lst *, .lst *::before, .lst *::after { box-sizing: border-box }
:where(.lst) :is(h2, h3, h4, h5, p, ol, li) { margin: 0; padding: 0 }
:where(.lst) ol { list-style: none }
.lst a { color: inherit; text-decoration: none }
.lst :focus-visible { outline: 2px solid var(--lst-accent); outline-offset: 3px; border-radius: 4px }

.lst-in { max-width: 1248px; margin: 0 auto; padding: clamp(64px, 4cqi + 48px, 112px) 24px }

/* ---- heading ---- */
.lst-head { display: grid; gap: 20px; margin-bottom: clamp(36px, 2cqi + 28px, 56px) }
@container lst (min-width: 820px) {
  .lst-head { grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); column-gap: 48px; align-items: end }
}
.lst-title {
  font-size: clamp(30px, 2.6cqi + 20px, 52px); line-height: 1.04; font-weight: 500; letter-spacing: var(--lst-ls-title);
  color: var(--lst-t1); text-wrap: balance;
}
.lst-title span { display: block; color: var(--lst-t3) }
.lst-aside { max-width: 400px; padding-bottom: 4px }
.lst-note { font-size: 15.5px; line-height: 25px; color: var(--lst-t2); text-wrap: pretty }
.lst-link {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 12px;
  font-weight: 500; font-size: 14.5px; color: var(--lst-t1);
  text-decoration: underline; text-decoration-color: var(--lst-t4); text-decoration-thickness: 1px; text-underline-offset: 5px;
  transition: text-decoration-color 160ms var(--lst-ease);
}
.lst-link:hover { text-decoration-color: var(--lst-t2) }
.lst-link svg { width: 14px; height: 14px; transition: transform 200ms var(--lst-ease) }
.lst-link:hover svg { transform: translateX(2px) }

/* ---- steps ---- */
.lst-steps { display: grid; grid-template-columns: minmax(0, 1fr); row-gap: 44px; column-gap: var(--lst-gap) }
@container lst (min-width: 600px) {
  .lst-steps[data-n="2"], .lst-steps[data-n="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) }
}
@container lst (min-width: 760px) {
  .lst-steps[data-n="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)) }
}
@container lst (min-width: 1000px) {
  .lst-steps[data-n="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)) }
}
.lst-step { min-width: 0; container: lst-step / inline-size }

.lst-stage {
  position: relative; overflow: hidden; display: grid; place-items: center;
  height: clamp(236px, 80cqi, 340px); border-radius: var(--lst-r-stage);
  background: var(--lst-stage); box-shadow: inset 0 0 0 1px var(--lst-line);
}
.lst-stage::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(var(--lst-dot) 1px, transparent 1.35px) 0 0 / 8px 8px;
  -webkit-mask-image: radial-gradient(70% 66% at 50% 50%, transparent 38%, #000 100%);
  mask-image: radial-gradient(70% 66% at 50% 50%, transparent 38%, #000 100%);
}
.lst-stage > * { position: relative }
.lst-media { width: 100%; height: 100%; display: grid; place-items: center }

/* Progress: one hairline segment per step, under the stages. In a row each segment reaches across the gap, so
   together they read as one line that fills from the first step to the last. */
.lst-seg { position: relative; height: 1px; margin: 22px 0 16px; background: var(--lst-line) }
.lst-seg i { position: absolute; inset: 0; background: var(--lst-accent); transform-origin: left center }
.lst-seg[data-s="wait"] i { transform: scaleX(0) }
.lst-seg[data-s="fill"] i { animation: lst-fill var(--dur) linear backwards }
@container lst (min-width: 760px) {
  .lst-steps[data-n="3"] .lst-step:not(:last-child) .lst-seg { margin-right: calc(var(--lst-gap) * -1) }
}
@container lst (min-width: 600px) {
  .lst-steps[data-n="2"] .lst-step:first-child .lst-seg,
  .lst-steps[data-n="4"] .lst-step:nth-child(odd) .lst-seg { margin-right: calc(var(--lst-gap) * -1) }
}
@container lst (min-width: 1000px) {
  .lst-steps[data-n="4"] .lst-step:not(:last-child) .lst-seg { margin-right: calc(var(--lst-gap) * -1) }
}

.lst-copy { transition: opacity 420ms var(--lst-ease) }
.lst-step[data-dim] .lst-copy { opacity: .38 }
.lst-num { display: block; font-size: 13px; line-height: 20px; font-weight: 500; color: var(--lst-accent); font-variant-numeric: tabular-nums }
.lst-step :is(h3, h4, h5) { margin-top: 6px; font-size: 17px; line-height: 24px; font-weight: 500; letter-spacing: -.012em; color: var(--lst-t1) }
.lst-body { margin-top: 6px; max-width: 42ch; font-size: 14.5px; line-height: 23px; color: var(--lst-t2); text-wrap: pretty }

/* ---- arrival: a short rise and fade, once ---- */
.lst[data-reveal="wait"] .lst-r { opacity: 0; transform: translateY(14px) }
.lst[data-reveal="in"] .lst-r {
  transition: opacity 640ms var(--lst-ease), transform 640ms var(--lst-ease);
  transition-delay: calc(var(--i, 0) * 70ms);
}

/* ---- mock card ---- */
.lst-mock { width: min(100% - 40px, 292px); pointer-events: none; user-select: none }
.lst-card {
  border-radius: var(--lst-r-card); background: var(--lst-card-bg); box-shadow: var(--lst-card);
  padding: 4px 14px 12px; font-size: 12.5px; line-height: 18px; color: var(--lst-t1);
}
.lst-ch { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 38px; border-bottom: 1px solid var(--lst-line) }
.lst-ct { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.lst-cm { color: var(--lst-t3); white-space: nowrap }
.lst-swap { display: grid; justify-items: end; align-items: center }
.lst-swap > * { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap }
.lst-swap > .lst-s1 { opacity: 0; visibility: hidden }

/* arrive */
.lst-list { position: relative; overflow: hidden; height: 148px; margin: 0 -14px -12px; padding: 0 14px }
.lst-msg { display: flex; gap: 10px; padding: 12px 0 }
.lst-new { height: 92px; border-bottom: 1px solid var(--lst-line) }
.lst-av {
  position: relative; flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%;
  background: var(--lst-fill); color: var(--lst-t2); font-size: 11px; font-weight: 500;
}
.lst-new .lst-av::after {
  content: ""; position: absolute; right: -1px; top: -1px; width: 7px; height: 7px; border-radius: 50%;
  background: var(--lst-accent); box-shadow: 0 0 0 2px var(--lst-card-bg);
}
.lst-mb { min-width: 0; flex: 1 }
.lst-ml { display: flex; justify-content: space-between; gap: 8px; line-height: 20px }
.lst-ml b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lst-time { color: var(--lst-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.lst-ms { color: var(--lst-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lst-old .lst-ml b { color: var(--lst-t2) }
.lst-old .lst-ms { color: var(--lst-t3) }
.lst-file {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 24px; margin-top: 6px; padding: 0 8px 0 6px;
  border-radius: var(--lst-r-small); box-shadow: inset 0 0 0 1px var(--lst-line); color: var(--lst-t1); font-size: 12px;
}
.lst-file svg { flex: none; width: 13px; height: 13px; color: var(--lst-t3) }
.lst-file span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lst-file i { font-style: normal; color: var(--lst-t3); white-space: nowrap }

/* work + approve rows */
.lst-rows { padding-top: 4px }
.lst-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 32px }
.lst-row + .lst-row { border-top: 1px solid var(--lst-line) }
.lst-rl { color: var(--lst-t3); white-space: nowrap }
.lst-rv { display: grid; justify-items: end; align-items: center; min-width: 0 }
.lst-rv > * { grid-area: 1 / 1 }
.lst-val { font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.lst-bar {
  width: 72px; height: 8px; border-radius: 4px; opacity: 0;
  background: var(--lst-fill) linear-gradient(90deg, transparent 0 30%, var(--lst-glint) 50%, transparent 70% 100%) no-repeat;
  background-size: 200% 100%; background-position: 150% 0;
}
.lst-row:nth-child(2) .lst-bar { width: 58px }
.lst-row:nth-child(3) .lst-bar { width: 44px }

/* approve */
.lst-tag { height: 22px }
.lst-tag > * { height: 22px; padding: 0 8px; border-radius: var(--lst-r-small); font-size: 11.5px; font-weight: 500 }
.lst-tag > .lst-s1 { background: var(--lst-fill); color: var(--lst-t2) }
.lst-tag > .lst-s2 { color: var(--lst-t1); padding-right: 0 }
.lst-tag svg { width: 13px; height: 13px; color: var(--lst-accent) }
.lst-foot { justify-items: start; height: 32px; margin-top: 10px }
.lst-btnwrap { position: relative }
.lst-btn {
  display: inline-flex; align-items: center; height: 28px; padding: 0 12px; border-radius: var(--lst-r-small);
  background: var(--lst-btn); color: var(--lst-btn-ink); font-size: 12px; font-weight: 500;
}
.lst-note2 { color: var(--lst-t3); font-size: 12px }
.lst-cur {
  position: absolute; left: 70%; top: 58%; width: 18px; height: 18px; opacity: 0;
  filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .25));
}
.lst-cur path { fill: #111; stroke: #fff; stroke-width: 1.6; stroke-linejoin: round }

/* log */
.lst-log { padding-top: 6px }
.lst-li { display: flex; align-items: center; gap: 8px; height: 30px }
.lst-li svg { flex: none; width: 14px; height: 14px; color: var(--lst-t3) }
.lst-li span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.lst-li .lst-time { flex: none }

/* ---- phases: idle (the start frame), play (the story), done (the natural, finished frame) ---- */
.lst-mock[data-phase="idle"] .lst-new { opacity: 0; transform: translateY(-8px) }
.lst-mock[data-phase="idle"] .lst-old { transform: translateY(-92px) }
.lst-mock[data-phase="idle"] .lst-work .lst-bar { opacity: 1 }
.lst-mock[data-phase="idle"] .lst-work .lst-val { opacity: 0 }
.lst-mock[data-phase="idle"] .lst-swap > .lst-s1 { opacity: 1; visibility: visible }
.lst-mock[data-phase="idle"] .lst-swap > .lst-s2 { opacity: 0 }
.lst-mock[data-phase="idle"] .lst-li { opacity: 0 }

.lst-mock[data-phase="play"] .lst-new { animation: lst-drop 620ms var(--lst-ease) 220ms backwards }
.lst-mock[data-phase="play"] .lst-old { animation: lst-push 620ms var(--lst-ease) 220ms backwards }
.lst-mock[data-phase="play"] .lst-file { animation: lst-in 420ms var(--lst-ease) 980ms backwards }
.lst-mock[data-phase="play"] .lst-work .lst-bar { animation: lst-shim 1100ms linear 2, lst-unbar 260ms var(--lst-ease) var(--d) backwards }
.lst-mock[data-phase="play"] .lst-work .lst-val { animation: lst-in 420ms var(--lst-ease) var(--d) backwards }
.lst-mock[data-phase="play"] .lst-swap > .lst-s1 { animation: lst-hide 220ms var(--lst-ease) var(--t) backwards }
.lst-mock[data-phase="play"] .lst-swap > .lst-s2 { animation: lst-in 380ms var(--lst-ease) var(--t) backwards }
.lst-mock[data-phase="play"] .lst-btn { animation: lst-press 240ms var(--lst-ease) 1380ms }
.lst-mock[data-phase="play"] .lst-cur { animation: lst-cursor 1900ms var(--lst-ease) 240ms }
.lst-mock[data-phase="play"] .lst-li { animation: lst-in 420ms var(--lst-ease) var(--d) backwards }

@keyframes lst-fill { from { transform: scaleX(0) } }
@keyframes lst-drop { from { opacity: 0; transform: translateY(-8px); filter: blur(3px) } }
@keyframes lst-push { from { transform: translateY(-92px) } }
@keyframes lst-in { from { opacity: 0; transform: translateY(3px); filter: blur(4px) } }
@keyframes lst-hide { from { opacity: 1; visibility: visible } to { opacity: 0; visibility: visible } }
@keyframes lst-unbar { from { opacity: 1 } to { opacity: 0 } }
@keyframes lst-shim { from { background-position: 150% 0 } to { background-position: -50% 0 } }
@keyframes lst-press { 0%, 100% { transform: none } 40% { transform: scale(.95) } }
@keyframes lst-cursor {
  0% { opacity: 0; transform: translate(64px, 44px) }
  14% { opacity: 1 }
  60% { transform: translate(0, 0) }
  64% { transform: translate(0, 0) scale(.86) }
  70% { transform: translate(0, 0) scale(1) }
  86% { opacity: 1; transform: translate(2px, 3px) }
  100% { opacity: 0; transform: translate(6px, 10px) }
}

@media (prefers-reduced-motion: reduce) {
  .lst *, .lst *::before, .lst *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Mocks                                    */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "play" | "done"

const MOCK_ORDER: LandingStepsMock[] = ["arrive", "work", "approve", "log"]
const MEDIA_DURATION = 2400

/** Length of each built-in story, in ms. The CSS delays above are written against these. */
function mockDuration(mock: LandingStepsMock, story: LandingStepsStory) {
  if (mock === "arrive") return 2200
  if (mock === "work") return workDelay(story.work.rows.length) + 700
  if (mock === "approve") return 2700
  return 300 + story.log.items.length * 380 + 700
}
const workDelay = (i: number) => 420 + i * 420

function mockLabel(mock: LandingStepsMock, story: LandingStepsStory) {
  if (mock === "arrive") return `${story.inbox.title}: a message from ${story.inbox.from} with ${story.inbox.file} arrives`
  if (mock === "work") return `${story.work.title}: ${story.work.rows.map((r) => `${r.label} ${r.value}`).join(", ")} fill in one by one`
  if (mock === "approve") return `${story.approve.title} changes from ${story.approve.pending} to ${story.approve.approved}`
  return `${story.log.title}: ${story.log.items.map((r) => r.label).join(", ")}`
}

function Cursor() {
  return (
    <svg className="lst-cur" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 1.8v11.4l3.1-2.9 2 4.3 2.1-1-2-4.2h4.3z" />
    </svg>
  )
}

function Mock({ mock, story, phase }: { mock: LandingStepsMock; story: LandingStepsStory; phase: Phase }) {
  const { inbox, work, approve, log } = story
  let body: React.ReactNode
  if (mock === "arrive") {
    body = (
      <div className="lst-card">
        <div className="lst-ch">
          <span className="lst-ct">{inbox.title}</span>
          <span className="lst-cm">{inbox.meta}</span>
        </div>
        <div className="lst-list">
          <div className="lst-msg lst-new">
            <span className="lst-av">{inbox.from.slice(0, 1)}</span>
            <div className="lst-mb">
              <div className="lst-ml">
                <b>{inbox.from}</b>
                <span className="lst-time">{inbox.time}</span>
              </div>
              <div className="lst-ms">{inbox.subject}</div>
              <span className="lst-file">
                <FileText strokeWidth={1.75} />
                <span>{inbox.file}</span>
                <i>{inbox.size}</i>
              </span>
            </div>
          </div>
          <div className="lst-msg lst-old">
            <span className="lst-av">{inbox.earlierFrom.slice(0, 1)}</span>
            <div className="lst-mb">
              <div className="lst-ml">
                <b>{inbox.earlierFrom}</b>
                <span className="lst-time">{inbox.earlierTime}</span>
              </div>
              <div className="lst-ms">{inbox.earlierSubject}</div>
            </div>
          </div>
        </div>
      </div>
    )
  } else if (mock === "work") {
    const rows = work.rows.slice(0, 5)
    body = (
      <div className="lst-card">
        <div className="lst-ch">
          <span className="lst-ct">{work.title}</span>
          <span className="lst-cm lst-swap" style={{ "--t": `${workDelay(rows.length) - 120}ms` } as React.CSSProperties}>
            <span className="lst-s1">{work.working}</span>
            <span className="lst-s2">{work.done}</span>
          </span>
        </div>
        <div className="lst-rows lst-work">
          {rows.map((r, i) => (
            <div className="lst-row" key={i} style={{ "--d": `${workDelay(i)}ms` } as React.CSSProperties}>
              <span className="lst-rl">{r.label}</span>
              <span className="lst-rv">
                <span className="lst-bar" />
                <span className="lst-val">{r.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  } else if (mock === "approve") {
    body = (
      <div className="lst-card">
        <div className="lst-ch">
          <span className="lst-ct">{approve.title}</span>
          <span className="lst-tag lst-swap" style={{ "--t": "1460ms" } as React.CSSProperties}>
            <span className="lst-s1">{approve.pending}</span>
            <span className="lst-s2">
              <Check strokeWidth={2.25} />
              {approve.approved}
            </span>
          </span>
        </div>
        <div className="lst-rows">
          {work.rows.slice(0, 2).map((r, i) => (
            <div className="lst-row" key={i}>
              <span className="lst-rl">{r.label}</span>
              <span className="lst-val">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="lst-foot lst-swap" style={{ "--t": "1900ms" } as React.CSSProperties}>
          <span className="lst-s1 lst-btnwrap">
            <span className="lst-btn">{approve.action}</span>
            <Cursor />
          </span>
          <span className="lst-s2 lst-note2">{approve.note}</span>
        </div>
      </div>
    )
  } else {
    body = (
      <div className="lst-card">
        <div className="lst-ch">
          <span className="lst-ct">{log.title}</span>
          <span className="lst-cm">{log.meta}</span>
        </div>
        <div className="lst-log">
          {log.items.slice(0, 5).map((r, i) => (
            <div className="lst-li" key={i} style={{ "--d": `${300 + i * 380}ms` } as React.CSSProperties}>
              <Check strokeWidth={2.25} />
              <span>{r.label}</span>
              <span className="lst-time">{r.time}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="lst-mock" data-phase={phase} aria-hidden="true">
      {body}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type StoryState = "static" | "ready" | "running" | "ended"

const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

export function LandingSteps({
  title = DEFAULT_LANDING_STEPS.title,
  titleMuted = DEFAULT_LANDING_STEPS.titleMuted,
  note = DEFAULT_LANDING_STEPS.note,
  link = DEFAULT_LANDING_STEPS.link,
  steps = DEFAULT_LANDING_STEPS.steps,
  story = DEFAULT_LANDING_STEPS.story,
  replayOnHover = false,
  reveal = true,
  headingLevel = 2,
  id,
  className,
}: LandingStepsProps) {
  const autoId = React.useId().replace(/:/g, "")
  const sectionId = id ?? `lst-${autoId}`
  const titleId = `${sectionId}-title`
  const H = `h${headingLevel}` as "h2"
  const HS = `h${headingLevel + 1}` as "h3"

  const list = steps.slice(0, 4)
  const n = list.length
  const mocks = list.map((s, i) => s.mock ?? MOCK_ORDER[i] ?? "log")
  const durations = list.map((s, i) => s.duration ?? (s.media ? MEDIA_DURATION : mockDuration(mocks[i], story)))
  const durKey = durations.join(",")

  const rootRef = React.useRef<HTMLElement>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const timers = React.useRef<number[]>([])
  const replaying = React.useRef<Set<number>>(new Set())

  // Server and first paint show everything finished; the layout effect arms the story only when motion is allowed.
  const [revealState, setRevealState] = React.useState<"off" | "wait" | "in">("off")
  const [storyState, setStoryState] = React.useState<StoryState>("static")
  const [active, setActive] = React.useState(-1)
  const [done, setDone] = React.useState(0)
  const [phases, setPhases] = React.useState<Phase[]>(() => list.map(() => "done"))

  const setPhase = React.useCallback((i: number, p: Phase) => {
    setPhases((prev) => {
      if (prev[i] === p) return prev
      const next = prev.slice()
      next[i] = p
      return next
    })
  }, [])

  // Arrival: rise and fade once when the section enters the viewport.
  useIsoLayoutEffect(() => {
    const root = rootRef.current
    if (!reveal || !root || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setRevealState("wait")
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealState("in")
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(root)
    // Backstop for a missed first callback (seen in headless runs): a one-off geometry check.
    const t = window.setTimeout(() => {
      const b = root.getBoundingClientRect()
      if (b.top < window.innerHeight && b.bottom > 0) {
        setRevealState("in")
        io.disconnect()
      }
    }, 700)
    return () => {
      io.disconnect()
      window.clearTimeout(t)
    }
  }, [reveal])

  // The story: play each mock in order, each starting as the previous one finishes. A step only starts once its own
  // stage is at least half in view, so on phones (cards stacked) a step waits for the reader to scroll to it.
  useIsoLayoutEffect(() => {
    const el = listRef.current
    const clear = () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
    if (!el || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStoryState("static")
      setActive(-1)
      setDone(n)
      setPhases(Array.from({ length: n }, () => "done"))
      return
    }
    const durs = durKey.split(",").map(Number)
    const stages = Array.from(el.querySelectorAll<HTMLElement>(":scope > li > .lst-stage"))
    const visible = new Set<number>()
    let next = 0 // the step waiting to play
    let busy = false
    setStoryState("ready")
    setActive(-1)
    setDone(0)
    setPhases(Array.from({ length: n }, () => "idle"))

    const tryPlay = () => {
      if (busy) return
      if (next >= n) {
        setActive(-1)
        setStoryState("ended")
        io.disconnect()
        return
      }
      if (!visible.has(next)) return
      const i = next
      busy = true
      setStoryState("running")
      setActive(i)
      setPhase(i, "play")
      timers.current.push(
        window.setTimeout(() => {
          setPhase(i, "done")
          setDone(i + 1)
          setActive(-1)
          busy = false
          next = i + 1
          tryPlay()
        }, durs[i]),
      )
    }
    const changed = () => {
      if (next === 0 && !busy && visible.has(0)) {
        // Let the arrival settle before the first mock plays.
        busy = true
        timers.current.push(
          window.setTimeout(() => {
            busy = false
            tryPlay()
          }, reveal ? 520 : 160),
        )
      } else tryPlay()
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = stages.indexOf(e.target as HTMLElement)
          if (e.isIntersecting && e.intersectionRatio >= 0.5) visible.add(i)
          else visible.delete(i)
        }
        changed()
      },
      { threshold: [0, 0.5] },
    )
    stages.forEach((s) => io.observe(s))
    // Backstop for a missed first callback (seen in headless runs): measure the stages once ourselves.
    timers.current.push(
      window.setTimeout(() => {
        if (next > 0 || busy) return
        stages.forEach((s, i) => {
          const b = s.getBoundingClientRect()
          const seen = Math.min(b.bottom, window.innerHeight) - Math.max(b.top, 0)
          if (b.height > 0 && seen / b.height >= 0.5) visible.add(i)
        })
        changed()
      }, 700),
    )
    return () => {
      io.disconnect()
      clear()
    }
  }, [n, durKey, reveal, setPhase])

  const replay = (i: number) => {
    if (!replayOnHover || storyState === "static" || phases[i] !== "done" || replaying.current.has(i)) return
    replaying.current.add(i)
    setPhase(i, "play")
    timers.current.push(
      window.setTimeout(() => {
        replaying.current.delete(i)
        setPhase(i, "done")
      }, durations[i]),
    )
  }

  const segState = (i: number) => {
    if (storyState === "static" || storyState === "ended" || i < done) return "full"
    return i === active ? "fill" : "wait"
  }

  let r = 0
  return (
    <section
      ref={rootRef}
      id={sectionId}
      aria-labelledby={titleId}
      className={cn("lst", className)}
      data-reveal={revealState}
      data-story={storyState}
    >
      <style href="pane-landing-steps" precedence="default">
        {CSS}
      </style>
      <div className="lst-in">
        <div className="lst-head">
          <H id={titleId} className="lst-title lst-r" style={{ "--i": r++ } as React.CSSProperties}>
            {title}
            {titleMuted ? <span>{titleMuted}</span> : null}
          </H>
          {note || link ? (
            <div className="lst-aside lst-r" style={{ "--i": r++ } as React.CSSProperties}>
              {note ? <p className="lst-note">{note}</p> : null}
              {link ? (
                <a className="lst-link" href={link.href}>
                  {link.label}
                  <ArrowRight strokeWidth={1.75} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <ol ref={listRef} className="lst-steps" data-n={n}>
          {list.map((s, i) => {
            const custom = s.media != null
            const label = s.mediaLabel ?? (custom ? undefined : mockLabel(mocks[i], story))
            const focusable = replayOnHover && !custom && storyState !== "static"
            return (
              <li
                key={i}
                className="lst-step lst-r"
                style={{ "--i": r++ } as React.CSSProperties}
                data-dim={storyState === "running" && active >= 0 && i !== active ? "" : undefined}
                aria-current={storyState === "running" && i === active ? "step" : undefined}
                onMouseEnter={() => replay(i)}
                onFocus={() => replay(i)}
              >
                <div
                  className="lst-stage"
                  role={label ? "img" : undefined}
                  aria-label={label}
                  tabIndex={focusable ? 0 : undefined}
                >
                  {custom ? <div className="lst-media">{s.media}</div> : <Mock mock={mocks[i]} story={story} phase={phases[i] ?? "done"} />}
                </div>
                <div className="lst-seg" data-s={segState(i)} style={{ "--dur": `${durations[i]}ms` } as React.CSSProperties} aria-hidden="true">
                  <i />
                </div>
                <div className="lst-copy">
                  <span className="lst-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <HS>{s.title}</HS>
                  <p className="lst-body">{s.body}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default LandingSteps

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** Where the card is: the plain results at equal weight, the one thing that needs you, or all clear. */
export type PulledFocusPhase = "recap" | "needs" | "done"
/** Which answer was given. */
export type PulledFocusChoice = "primary" | "secondary"

/** One finished kind of work: "18 invoices matched". */
export type PulledFocusResult = {
  count: number
  noun: string
  /** Past tense, shown only while the results sit at equal weight. */
  verb: string
}

/** What the card says once an answer is given. */
export type PulledFocusOutcome = { title: string; detail?: string }

export type PulledFocusAnswer = { label: string; outcome: PulledFocusOutcome }

/** The one thing that needs a person. */
export type PulledFocusDecision = {
  question: string
  detail?: string
  primary: PulledFocusAnswer
  /** Optional second answer, drawn as a quiet button. */
  secondary?: PulledFocusAnswer
}

export type PulledFocusLabels = {
  /** The headline while it needs you. Default "needs you". */
  needs: string
  /** The headline once answered. Default "moved". */
  moved: string
  /** After the "N done" in the caption while it needs you. Default "while you were away". */
  away: string
  /** After the "N done" in the caption when all is clear. Default "Nothing left for you". */
  clear: string
  /** The first button. Default "Review". */
  review: string
  /** The button that plays it again. Default "Replay". */
  replay: string
}

export type PulledFocusProps = {
  /** Who did the work. Default "Atlas". */
  agent?: string
  /** When the person left. Default "06:40". */
  since?: string
  /** When the work finished, and the time on the headline once answered. Default "09:41". */
  at?: string
  /** The finished work, one to four kinds. The total in the caption is these counts plus the one that needs you. Default 18 invoices, 14 emails, 8 reports. */
  results?: PulledFocusResult[]
  /** The one thing that needs a decision. Default: move the Harbor & Finch review to 15:00 (the answers name `agent` and `at`). */
  decision?: PulledFocusDecision
  labels?: Partial<PulledFocusLabels>
  /** Locale for the counts (1,248). Default: the page's own locale. */
  locale?: string
  /** Controlled phase. Passing it turns the built-in loop off. */
  phase?: PulledFocusPhase
  /** Which answer the "done" phase shows when `phase` is controlled. Default "primary". */
  choice?: PulledFocusChoice
  /** Play the built-in loop (recap, focus pulled, answered, repeat) until the first interaction with the card. Default: on when no `phase` or callback is passed. */
  autoPlay?: boolean
  /** Called when the person presses the first button. */
  onReview?: () => void
  /** Called when the person answers. Not called by the built-in loop. */
  onAnswer?: (choice: PulledFocusChoice) => void
  /** Called when the person presses replay. */
  onReplay?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.plf {
  --plf-ink: #000;
  --plf-surface: #fff;
  --plf-accent: #0060e2;
  --plf-t1: color-mix(in oklab, var(--plf-ink) 88%, transparent);
  --plf-t2: color-mix(in oklab, var(--plf-ink) 61%, transparent);
  --plf-t3: color-mix(in oklab, var(--plf-ink) 45%, transparent);
  --plf-t4: color-mix(in oklab, var(--plf-ink) 27%, transparent);
  --plf-fill: color-mix(in oklab, var(--plf-ink) 6%, transparent);
  --plf-line: color-mix(in oklab, var(--plf-ink) 6%, transparent);
  --plf-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --plf-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --plf-ease: cubic-bezier(.22, 1, .36, 1);
  /* three sizes: the lines (and what they shrink to), the questions, the body */
  --plf-fs: 30px; --plf-q: 22px; --plf-body: 15px; --plf-ls: -.03em; --plf-qls: -.015em;
  --plf-br: 22px; --plf-pad: 32px;
  /* measured in JS and written back on this element; these are only the first-paint guesses */
  --plf-n: 3; --plf-rs: 1; --plf-hs: 1; --plf-S: 1.85; --plf-zr: 44px; --plf-zn: 130px; --plf-zd: 140px; --plf-h: 420px;
  position: relative; container-type: inline-size; width: 100%; max-width: 400px; height: var(--plf-h);
  font: 400 var(--plf-body)/1.4 var(--plf-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--plf-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .plf {
  --plf-ink: #fff;
  --plf-surface: #1c1c1e;
  --plf-accent: #4d8dff;
  --plf-t1: color-mix(in oklab, var(--plf-ink) 90%, transparent);
  --plf-t2: color-mix(in oklab, var(--plf-ink) 62%, transparent);
  --plf-t3: color-mix(in oklab, var(--plf-ink) 46%, transparent);
  --plf-t4: color-mix(in oklab, var(--plf-ink) 28%, transparent);
  --plf-fill: color-mix(in oklab, var(--plf-ink) 8%, transparent);
  --plf-line: color-mix(in oklab, var(--plf-ink) 9%, transparent);
  --plf-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --plf-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, a hairline, a monospaced face, the pull shown by an underline as well as size */
html[data-style="mono"] .plf {
  --plf-ink: #000; --plf-surface: #fff; --plf-accent: #111;
  --plf-shadow: 0 0 0 1px rgb(0 0 0 / .14); --plf-drop: 0 0 0 0 transparent;
  --plf-ease: cubic-bezier(.2, .9, .1, 1); --plf-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --plf-ls: 0; --plf-qls: 0; --plf-q: 20px; --plf-body: 14px; --plf-br: 4px;
}
html[data-style="mono"].dark .plf { --plf-ink: #fff; --plf-surface: #0a0a0a; --plf-accent: #f2f2f2; --plf-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .plf-card { border-radius: 8px; --plf-fs: clamp(26px, calc((100cqw - 2 * var(--plf-pad)) / 11.8), 28px) }
html[data-style="mono"] .plf-head::after { content: ""; position: absolute; left: 0; right: 0; bottom: 3px; height: 1px; background: var(--plf-t2); opacity: 0; transition: opacity .5s var(--plf-ease) .34s }
html[data-style="mono"] .plf-card[data-phase="needs"] .plf-head::after { opacity: 1 }
html[data-style="mono"] .plf-card:not([data-phase="needs"]) .plf-head::after { transition-delay: 0s }
html[data-style="mono"] .plf-dot { margin-left: .3em }

/* Glass: the card carries the frost, the words sit on it in the Pane glass inks */
html[data-style="glass"] .plf {
  --plf-ink: var(--pane-ink); --plf-surface: var(--pane-solid); --plf-accent: var(--pane-accent); --plf-shadow: var(--pane-shadow);
  --plf-drop: 0 0 0 0 transparent; --plf-ease: var(--pane-ease); --plf-font: var(--pane-font);
  --plf-t1: var(--pane-t1); --plf-t2: var(--pane-t2); --plf-t3: var(--pane-t3); --plf-t4: var(--pane-t4);
}
html[data-style="glass"] .plf-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .plf-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .plf-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .plf-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .plf-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .plf-card, html[data-style="glass"].dark .plf-card, html[data-style="glass"][data-refract] .plf-card, html[data-style="glass"].dark[data-refract] .plf-card {
    -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none;
  }
}

.plf *, .plf *::before, .plf *::after { box-sizing: border-box }
:where(.plf) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.plf) p { margin: 0 }
.plf-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card: grows downward from a fixed top edge inside the height the root reserves for the tallest phase */
.plf-card { padding: 28px var(--plf-pad) 30px; border-radius: 28px; background: var(--plf-surface); box-shadow: var(--plf-shadow), var(--plf-drop) }

/* Words that change in place stack in one grid cell and cross-fade through a blur */
.plf-swap { display: grid }
.plf-swap > * {
  grid-area: 1 / 1; opacity: 0; filter: blur(8px); transform: translateY(.4em); pointer-events: none;
  transition: opacity .22s var(--plf-ease), filter .22s var(--plf-ease), transform .3s var(--plf-ease);
}
.plf-card[data-phase="recap"] .plf-on-rec, .plf-card[data-phase="needs"] .plf-on-need, .plf-card[data-phase="done"] .plf-on-done {
  opacity: 1; filter: none; transform: none; pointer-events: auto;
  transition: opacity .5s var(--plf-ease) .1s, filter .5s var(--plf-ease) .1s, transform .7s var(--plf-ease) .1s;
}
.plf-cap { height: 28px; color: var(--plf-t2); white-space: nowrap }
.plf-cap > * { line-height: 28px; min-width: 0; overflow: hidden; text-overflow: ellipsis }
.plf-cap b { font-size: var(--plf-q); font-weight: 600; letter-spacing: var(--plf-qls); color: var(--plf-t1) }

/* The results. Every line is placed by a transform: the finished ones shrink to half size and slide into one row, the last one takes the room. */
.plf-stage { position: relative; height: calc(var(--plf-n) * 40px + 36px); margin-top: 20px; transition: height .85s var(--plf-ease) }
.plf-card[data-phase="needs"] .plf-stage { height: calc(34px + 36px * var(--plf-S)); transition-delay: .3s }
.plf-card[data-phase="done"] .plf-stage { height: 72px }
.plf-ln {
  --x: 0px; --y: calc(var(--i, 0) * 40px); --s: 1;
  position: absolute; left: 0; top: 0; display: flex; align-items: baseline; gap: .26em; white-space: nowrap;
  font-size: var(--plf-fs); line-height: 36px; font-weight: 600; letter-spacing: var(--plf-ls); color: var(--plf-t2);
  transform-origin: 0 0; transform: translate(var(--x), var(--y)) scale(var(--s));
  transition: transform .85s var(--plf-ease), color .5s var(--plf-ease), font-weight .85s var(--plf-ease);
}
/* Long nouns never run past the card: the recap lines scale down to fit (--plf-rs, never below 13px), and what still does not fit is cut with an ellipsis (--nmax in the recap, --fmax in the folded row) */
.plf-f { --s: var(--plf-rs, 1) }
.plf-nm {
  display: block; min-width: 0; max-width: var(--nmax, none); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: max-width .85s var(--plf-ease);
}
.plf-card:is([data-phase="needs"], [data-phase="done"]) .plf-nm { max-width: var(--fmax, none) }
.plf-card[data-phase="needs"] .plf-nm { transition-delay: calc(var(--i, 0) * .1s) }
.plf-ln b { font-weight: 600; color: var(--plf-t1); font-variant-numeric: tabular-nums; transition: color .5s var(--plf-ease) }
.plf-vb { position: absolute; left: 100%; margin-left: .26em; transition: opacity .4s var(--plf-ease) }
.plf-dot { position: absolute; left: 100%; margin-left: .47em; opacity: 0; transition: opacity .4s var(--plf-ease) }
/* needs / done: the finished lines compress into one small row, staggered */
.plf-card:is([data-phase="needs"], [data-phase="done"]) .plf-f { --s: .5; --y: 0px; --x: var(--xf, 0px); font-weight: 500 }
.plf-card[data-phase="needs"] .plf-f { transition-delay: calc(var(--i, 0) * .1s) }
.plf-card:is([data-phase="needs"], [data-phase="done"]) .plf-vb { opacity: 0; transition-duration: .2s }
.plf-card:is([data-phase="needs"], [data-phase="done"]) .plf-f:not(.plf-last) .plf-dot { opacity: 1; transition-delay: .4s }

.plf-head { --y: calc(var(--plf-n) * 40px); --s: var(--plf-hs, 1); color: var(--plf-t1) }
.plf-at { font-style: normal; margin-left: .5em; font-size: .5em; font-weight: 500; letter-spacing: 0; color: var(--plf-t2) }
.plf-head .plf-swap > * { white-space: nowrap }
/* needs: focus is pulled, the headline swells and turns blue */
.plf-card[data-phase="needs"] .plf-head { --y: 34px; --s: var(--plf-S); font-weight: 700; transition-delay: .34s }
.plf-card[data-phase="needs"] .plf-head, .plf-card[data-phase="needs"] .plf-head b { color: var(--plf-accent); transition-delay: .34s }
/* done: focus is released, the headline settles back to ink and gets its time */
.plf-card[data-phase="done"] .plf-head { --y: 34px; --s: var(--plf-hs, 1); transition: transform .85s var(--plf-ease) .12s, color .5s var(--plf-ease) .5s, font-weight .85s var(--plf-ease) .12s }
.plf-card[data-phase="done"] .plf-head b { transition-delay: .5s }

/* Below the stage: three panes in one grid cell. The zone animates between their measured heights. */
.plf-zone { display: grid; margin-top: 20px; height: var(--plf-zr); transition: height .85s var(--plf-ease) }
.plf-card[data-phase="needs"] .plf-zone { height: var(--plf-zn); transition-delay: .3s }
.plf-card[data-phase="done"] .plf-zone { height: var(--plf-zd) }
.plf-z {
  grid-area: 1 / 1; align-self: start; opacity: 0; filter: blur(6px); transform: translateY(10px); pointer-events: none; visibility: hidden;
  transition: opacity .14s var(--plf-ease), filter .14s var(--plf-ease), transform .2s var(--plf-ease), visibility 0s linear .2s;
}
.plf-card[data-phase="recap"] .plf-z-rec, .plf-card[data-phase="needs"] .plf-z-need, .plf-card[data-phase="done"] .plf-z-done {
  opacity: 1; filter: none; transform: none; pointer-events: auto; visibility: visible;
  transition: opacity .5s var(--plf-ease) .2s, filter .5s var(--plf-ease) .2s, transform .7s var(--plf-ease) .2s, visibility 0s linear 0s;
}
.plf-card[data-phase="recap"] .plf-z-rec { transition-delay: .15s, .15s, .15s, 0s }
.plf-card[data-phase="needs"] .plf-z-need { transition-delay: .62s, .62s, .62s, 0s }
.plf-q { font-size: var(--plf-q); line-height: 28px; font-weight: 600; letter-spacing: var(--plf-qls); text-wrap: balance; color: var(--plf-t1) }
.plf-sub { margin-top: 6px; color: var(--plf-t2) }
.plf-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px }
.plf-z-rec .plf-btns { margin-top: 0 }
.plf-btn {
  height: 44px; padding: 0 22px; border-radius: var(--plf-br); font-weight: 500; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis;
  transition: transform .16s var(--plf-ease), background-color .2s var(--plf-ease), color .2s var(--plf-ease);
}
.plf-main {
  background: var(--plf-accent); color: var(--plf-surface);
  box-shadow: 0 1px 2px color-mix(in oklab, var(--plf-accent) 30%, transparent), inset 0 1px 0 rgb(255 255 255 / .18);
}
.plf-main:hover, .plf-main[data-sim] { background: color-mix(in oklab, var(--plf-accent) 88%, #000) }
.plf-ghost { color: var(--plf-t2) }
.plf-ghost:hover { background: var(--plf-fill); color: var(--plf-t1) }
/* a quiet button that starts a row sits flush with the copy; the need pane stacks its buttons when they do not fit side by side (data-wrap, measured) */
.plf-btns[data-wrap] { display: grid; justify-items: start }
.plf-z-done .plf-ghost, .plf-btns[data-wrap] .plf-ghost { margin-left: -22px }
.plf-btn:active, .plf-btn[data-sim] { transform: scale(.95) }
.plf-btn:focus-visible { outline: 2px solid var(--plf-accent); outline-offset: 2px }
html[data-style="mono"] .plf-main { box-shadow: none }
html[data-style="mono"] .plf-btn { padding: 0 18px }
html[data-style="mono"] .plf-z-done .plf-ghost, html[data-style="mono"] .plf-btns[data-wrap] .plf-ghost { margin-left: -18px }

@container (max-width: 388px) {
  .plf-card { --plf-pad: 24px; padding: 26px var(--plf-pad) 26px }
  .plf-btn { padding: 0 18px }
  .plf-z-done .plf-ghost, .plf-btns[data-wrap] .plf-ghost { margin-left: -18px }
}
@media (prefers-reduced-motion: reduce) {
  .plf *, .plf *::before, .plf *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

// How long the built-in loop rests in each phase (the last 170ms of a button phase is the pretend press).
const DWELL: Record<PulledFocusPhase, number> = { recap: 2000, needs: 3600, done: 4600 }
const NEXT: Record<PulledFocusPhase, PulledFocusPhase> = { recap: "needs", needs: "done", done: "recap" }
const PRESS_MS = 170

// Layout constants the CSS shares (px): line pitch, line height, where the headline sits under the folded row, caption row, gaps.
const PITCH = 40
const LH = 36
const HEAD_Y = 34
const CAP_H = 28
const GAP = 20

const DEFAULT_RESULTS: PulledFocusResult[] = [
  { count: 18, noun: "invoices", verb: "matched" },
  { count: 14, noun: "emails", verb: "sorted" },
  { count: 8, noun: "reports", verb: "filed" },
]

const defaultDecision = (agent: string, at: string): PulledFocusDecision => ({
  question: "Move the Harbor & Finch review to 15:00?",
  detail: "It clashes with the Northwind call at 14:00.",
  primary: {
    label: "Move it",
    outcome: { title: "Review moved to 15:00.", detail: `${agent}, ${at}: told the 4 attendees and updated the calendar.` },
  },
  secondary: {
    label: "Move the call",
    outcome: { title: "Northwind call moved to 15:00.", detail: `${agent}, ${at}: asked the 6 guests and updated the calendar.` },
  },
})

const DEFAULT_LABELS: PulledFocusLabels = {
  needs: "needs you",
  moved: "moved",
  away: "while you were away",
  clear: "Nothing left for you",
  review: "Review",
  replay: "Replay",
}

type Metrics = {
  xs: number[] // folded row: x offset of each line
  nmax: number[] // recap: widest noun per line (px, before scaling)
  fmax: number[] // folded row: widest noun per line (px, before the half-size scale)
  rs: number // recap scale so the widest line fits
  hs: number // headline scale so it fits at rest
  S: number // headline swell
  zr: number
  zn: number
  zd: number
  h: number
  wrap: boolean // the need pane's two buttons do not fit side by side
}
const sameMetrics = (a: Metrics | null, b: Metrics) => !!a && JSON.stringify(a) === JSON.stringify(b)

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

/* -------------------------------------------------------------------------- */
/*                                PulledFocus                                 */
/* -------------------------------------------------------------------------- */

export function PulledFocus(props: PulledFocusProps) {
  const {
    agent = "Atlas",
    since = "06:40",
    at = "09:41",
    results = DEFAULT_RESULTS,
    locale,
    phase: phaseProp,
    onReview,
    onAnswer,
    onReplay,
    className,
  } = props
  const labels = { ...DEFAULT_LABELS, ...props.labels }
  const decision = props.decision ?? defaultDecision(agent, at)
  const fmt = (n: number) => n.toLocaleString(locale)
  const controlled = phaseProp !== undefined
  const autoPlay = props.autoPlay ?? (!controlled && onReview === undefined && onAnswer === undefined && onReplay === undefined)

  const items = results.slice(0, 4)
  const finished = items.reduce((n, r) => n + r.count, 0)
  const total = finished + 1
  const list = items.map((r) => `${fmt(r.count)} ${r.noun} ${r.verb}`).join(", ")

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const zoneRef = React.useRef<HTMLDivElement>(null)
  const reviewRef = React.useRef<HTMLButtonElement>(null)
  const primaryRef = React.useRef<HTMLButtonElement>(null)
  const replayRef = React.useRef<HTMLButtonElement>(null)

  // Reduced motion with the built-in loop: one still frame (focus pulled), nothing plays; the buttons still work.
  const [inner, setInner] = React.useState<PulledFocusPhase>(() => (autoPlay && reduce ? "needs" : "recap"))
  const [picked, setPicked] = React.useState<PulledFocusChoice>("primary")
  const [auto, setAuto] = React.useState(autoPlay && !reduce)
  const [pressFor, setPressFor] = React.useState<PulledFocusPhase | null>(null)
  const [onScreen, setOnScreen] = React.useState(true)
  const [visible, setVisible] = React.useState(true)
  const [announce, setAnnounce] = React.useState("")
  const [m, setM] = React.useState<Metrics | null>(null)

  const phase = phaseProp ?? inner
  const choice = props.choice ?? picked
  const answer = (choice === "secondary" && decision.secondary ? decision.secondary : decision.primary).outcome
  const pressed = auto && pressFor === phase

  const autoRef = React.useRef(auto)
  autoRef.current = auto

  /** Moves to a phase. A person's press also moves keyboard focus to the new phase's main button, once it is in the DOM. */
  // The intent expires after 1.5s, so a parent that changes `phase` much later never pulls focus into the card.
  const focusNext = React.useRef<{ phase: PulledFocusPhase; at: number } | null>(null)
  const go = (next: PulledFocusPhase, user: boolean, ch?: PulledFocusChoice) => {
    if (user && cardRef.current?.contains(document.activeElement)) focusNext.current = { phase: next, at: Date.now() }
    if (ch) setPicked(ch)
    if (!controlled) setInner(next)
    setPressFor(null)
  }
  React.useLayoutEffect(() => {
    const want = focusNext.current
    if (!want || want.phase !== phase) return
    focusNext.current = null
    if (Date.now() - want.at > 1500) return
    ;({ recap: reviewRef, needs: primaryRef, done: replayRef })[phase].current?.focus({ preventScroll: true })
  }, [phase])

  // The person has taken over: the loop ends for good.
  const handOver = () => {
    if (!autoRef.current) return
    setAuto(false)
    setPressFor(null)
  }

  // Screen readers hear a change of phase, but only once a person is driving; the built-in loop stays quiet.
  const prevPhase = React.useRef(phase)
  React.useEffect(() => {
    if (prevPhase.current === phase) return
    prevPhase.current = phase
    if (autoRef.current) return
    setAnnounce(
      phase === "needs"
        ? `${fmt(finished)} done ${labels.away}. 1 ${labels.needs}: ${decision.question}${decision.detail ? ` ${decision.detail}` : ""}`
        : phase === "done"
          ? `${fmt(total)} done. ${answer.title}${answer.detail ? ` ${answer.detail}` : ""}`
          : `${agent} ran ${fmt(total)} tasks, ${fmt(finished)} done, 1 ${labels.needs}.`,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The loop runs only while the card is on screen in a visible tab. Each phase rests, pretends to press its button, then moves on; resuming restarts the rest of the current phase.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setVisible(document.visibilityState === "visible")
    update()
    document.addEventListener("visibilitychange", update)
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => setOnScreen(entries.some((x) => x.isIntersecting)))
      io.observe(el)
    }
    return () => {
      io?.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  const active = onScreen && visible

  React.useEffect(() => {
    if (!auto || !active || controlled) return
    const rest = DWELL[phase]
    const ids: number[] = []
    if (phase !== "done") ids.push(window.setTimeout(() => setPressFor(phase), rest - PRESS_MS))
    ids.push(window.setTimeout(() => go(NEXT[phase], false, "primary"), rest))
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      setPressFor(null) // a pause must not leave the pretend press on the button
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, active, phase, controlled])

  /* ---- measuring: where the folded lines sit, how far the headline swells, how tall each pane is, and the height to reserve ---- */
  const measure = () => {
    const card = cardRef.current
    const stage = stageRef.current
    const zone = zoneRef.current
    if (!card || !stage || !zone) return
    const head = stage.querySelector<HTMLElement>("[data-head]")
    if (!head) return
    const fs = parseFloat(getComputedStyle(head).fontSize) || 30
    const sw = stage.offsetWidth
    const floor = Math.min(1, 13 / fs) // a recap line never renders below 13px
    const round = (n: number) => Math.round(n * 1000) / 1000

    // Natural widths. scrollWidth ignores the clamp, so measuring never feeds on its own result.
    const lines = Array.from(stage.querySelectorAll<HTMLElement>(".plf-f"))
    const nat = lines.map((l) => l.querySelector<HTMLElement>("[data-nm]")?.scrollWidth ?? 0)
    const tail = lines.map((l) => {
      const nm = l.querySelector<HTMLElement>("[data-nm]")
      const vb = l.querySelector<HTMLElement>(".plf-vb")
      return (nm && vb ? Math.max(0, vb.offsetLeft - nm.offsetWidth) : 0) + (vb?.offsetWidth ?? 0)
    })

    // Recap: shrink all lines together to fit the widest, then cut a noun only if the 13px floor is not enough.
    const widest = Math.max(0, ...nat.map((w, i) => w + tail[i]))
    const rs = widest > sw ? Math.max(floor, Math.floor((sw / widest) * 1000) / 1000) : 1
    const nmax = nat.map((w, i) => (w + tail[i]) * rs > sw + 1 ? Math.min(w + 2, Math.max(fs * 4, Math.floor(sw / rs - tail[i]))) : w + 2)

    // Folded row at half size: close the gaps first, then share what is left between the nouns.
    const n = nat.length
    const half = nat.map((w) => w * 0.5)
    const sum = half.reduce((a, b) => a + b, 0)
    const gapMax = fs * 0.6
    const gapMin = fs * 0.4
    let gap = gapMax
    let fmax = nat.map((w) => w + 2)
    if (n > 1 && sum + (n - 1) * gapMax > sw) gap = Math.max(gapMin, (sw - sum) / (n - 1))
    if (sum + Math.max(0, n - 1) * gap > sw + 0.5) {
      const room = sw - Math.max(0, n - 1) * gap
      let lo = 0
      let hi = Math.max(...half)
      for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2
        if (half.reduce((a, h) => a + Math.min(h, mid), 0) > room) hi = mid
        else lo = mid
      }
      fmax = nat.map((w, i) => (half[i] > lo ? Math.max(24, Math.floor(lo * 2)) : w + 2))
    }
    const xs: number[] = []
    let acc = 0
    nat.forEach((w, i) => {
      xs.push(Math.round(acc * 10) / 10)
      acc += Math.min(w, fmax[i]) * 0.5 + gap
    })

    // Headline: fits at rest, and swells to the card width when it can.
    const hw = head.offsetWidth
    const hs = hw > sw ? Math.max(floor, Math.floor((sw / hw) * 1000) / 1000) : 1
    const S = Math.max(hs, Math.min(1.9, sw / (hw * 1.05)))

    // Panes: their heights, and whether the need pane's buttons fit side by side.
    const [zr, zn, zd] = Array.from(zone.children).map((c) => (c as HTMLElement).offsetHeight)
    const btns = zone.querySelector<HTMLElement>(".plf-z-need .plf-btns")
    const [b1, b2] = btns ? (Array.from(btns.children) as HTMLElement[]) : []
    const wrap = !!(btns && b1 && b2 && b1.offsetWidth + 8 + b2.offsetWidth > btns.clientWidth)
    const cs = getComputedStyle(card)
    const chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + CAP_H + 2 * GAP
    const stageH = [items.length * PITCH + LH, HEAD_Y + LH * S, 2 * LH]
    const h = Math.ceil(Math.max(chrome + stageH[0] + zr, chrome + stageH[1] + zn, chrome + stageH[2] + zd))
    const next: Metrics = { xs, nmax, fmax, rs, hs, S: round(S), zr, zn, zd, h, wrap }
    setM((prev) => (sameMetrics(prev, next) ? prev : next))
  }
  const measureRef = React.useRef(measure)
  React.useLayoutEffect(() => {
    measureRef.current = measure
    measure() // every render; it only sets state when something changed
  })
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let w = root.offsetWidth
    let alive = true
    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (root.offsetWidth === w) return
            w = root.offsetWidth
            measureRef.current()
          })
    ro?.observe(root)
    document.fonts?.ready.then(() => alive && measureRef.current())
    return () => {
      alive = false
      ro?.disconnect()
    }
  }, [])

  /* ---- what is shown ---- */
  const style = {
    "--plf-n": items.length,
    ...(m && { "--plf-rs": m.rs, "--plf-hs": m.hs, "--plf-S": m.S, "--plf-zr": `${m.zr}px`, "--plf-zn": `${m.zn}px`, "--plf-zd": `${m.zd}px`, "--plf-h": `${m.h}px` }),
  } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={cn("plf", className)}
      style={style}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") handOver()
      }}
      // Only a press, key or focus that lands on the card ends the built-in loop; the rest of the page can be clicked freely.
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) handOver()
      }}
      onKeyDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) handOver()
      }}
      onFocusCapture={handOver}
    >
      <style href="pulled-focus" precedence="default">
        {CSS}
      </style>
      <p className="plf-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <section ref={cardRef} className="plf-card" aria-label={`${agent} ran ${fmt(total)} tasks, ${since} to ${at}`} data-phase={phase} data-choice={choice}>
        {/* what the aria-hidden caption and lines show, always present for a screen reader that lands on the card */}
        <p className="plf-sr">
          {phase === "done"
            ? `${fmt(total)} done: ${list}, and 1 ${labels.moved} ${at}.`
            : `${fmt(finished)} done: ${list}. 1 ${labels.needs}.`}
        </p>
        <div className="plf-cap plf-swap" aria-hidden>
          <p className="plf-on-rec" title={`${since} to ${at} · ${agent} ran ${fmt(total)} tasks`}>
            {since} to {at} · {agent} ran {fmt(total)} tasks
          </p>
          <p className="plf-on-need" title={`${fmt(finished)} done ${labels.away}`}>
            <b>{fmt(finished)} done</b> {labels.away}
          </p>
          <p className="plf-on-done" title={`${fmt(total)} done ${labels.clear}`}>
            <b>{fmt(total)} done</b> {labels.clear}
          </p>
        </div>

        <div ref={stageRef} className="plf-stage" aria-hidden>
          {items.map((r, i) => (
            <p
              key={i}
              className={cn("plf-ln plf-f", i === items.length - 1 && "plf-last")}
              style={
                {
                  "--i": i,
                  "--xf": `${m?.xs[i] ?? 0}px`,
                  ...(m && { "--nmax": `${m.nmax[i]}px`, "--fmax": `${m.fmax[i]}px` }),
                } as React.CSSProperties
              }
            >
              <span className="plf-nm" data-nm>
                <b>{fmt(r.count)}</b> {r.noun}
              </span>
              <span className="plf-vb">{r.verb}</span>
              <span className="plf-dot">·</span>
            </p>
          ))}
          <p className="plf-ln plf-head" data-head>
            <b>1</b>
            <span className="plf-swap">
              <span className="plf-on-rec plf-on-need">{labels.needs}</span>
              <span className="plf-on-done">
                {labels.moved}
                <i className="plf-at">{at}</i>
              </span>
            </span>
          </p>
        </div>

        <div ref={zoneRef} className="plf-zone">
          <div className="plf-z plf-z-rec" inert={phase !== "recap"}>
            <div className="plf-btns">
              <button ref={reviewRef} type="button" className="plf-btn plf-main" data-sim={(pressed && phase === "recap") || undefined} onClick={() => { onReview?.(); go("needs", true) }}>
                {labels.review}
              </button>
            </div>
          </div>
          <div className="plf-z plf-z-need" inert={phase !== "needs"}>
            <p className="plf-q">{decision.question}</p>
            {decision.detail && <p className="plf-sub">{decision.detail}</p>}
            <div className="plf-btns" data-wrap={m?.wrap || undefined}>
              <button ref={primaryRef} type="button" className="plf-btn plf-main" data-sim={(pressed && phase === "needs") || undefined} onClick={() => { onAnswer?.("primary"); go("done", true, "primary") }}>
                {decision.primary.label}
              </button>
              {decision.secondary && (
                <button type="button" className="plf-btn plf-ghost" onClick={() => { onAnswer?.("secondary"); go("done", true, "secondary") }}>
                  {decision.secondary.label}
                </button>
              )}
            </div>
          </div>
          <div className="plf-z plf-z-done" inert={phase !== "done"}>
            <p className="plf-q">{answer.title}</p>
            {answer.detail && <p className="plf-sub">{answer.detail}</p>}
            <div className="plf-btns">
              <button ref={replayRef} type="button" className="plf-btn plf-ghost" onClick={() => { onReplay?.(); go("recap", true) }}>
                {labels.replay}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

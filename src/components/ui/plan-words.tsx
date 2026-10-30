"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** What the agent does with one step: run it, pause and ask first, or leave it out. */
export type PlanWordsMode = "run" | "ask" | "skip"

export type PlanWordsStep = {
  /** Stable id, used as the key in `value` and in callbacks. */
  id: string
  /** The step, as a short phrase. Default steps: "Pull Q3 revenue", "Reconcile invoices"... */
  title: string
  /** Rough minutes the step takes. Added up in the footer. Default 1. */
  minutes?: number
}

/** The chosen mode per step id. A step that is missing runs. */
export type PlanWordsModes = Record<string, PlanWordsMode>

export type PlanWordsChange = { id: string; mode: PlanWordsMode; step: PlanWordsStep }

export type PlanWordsProps = {
  /** Who proposes the plan. Default "Atlas". */
  agent?: string
  /** Line above the steps. Default "Atlas's plan for the Q3 board pack" (built from `agent`). */
  caption?: string
  /** The plan, in order. Default: the four steps of the Q3 board pack. */
  steps?: PlanWordsStep[]
  /** Controlled modes. The built-in loop is off while this is set. */
  value?: PlanWordsModes
  /** Starting modes when uncontrolled. */
  defaultValue?: PlanWordsModes
  /** Called when the person presses a step's word. Receives every step's mode and the one that changed. */
  onChange?: (modes: PlanWordsModes, change: PlanWordsChange) => void
  /** Controlled: true once Go has been pressed and the words have turned into statuses. The parent then owns the reset (change this back to false, or remount); an uncontrolled card with your own steps can use `resetAfter` instead. */
  started?: boolean
  /** Called when the person presses Go, with the final modes. Uncontrolled, the card then stays on the statuses until it is remounted or `resetAfter` elapses. */
  onGo?: (modes: PlanWordsModes) => void
  /** Text of the main button. Default "Go". */
  goLabel?: string
  /** Line under the steps before anything has been changed. Default "Tap Run to ask first or skip a step." */
  hint?: string
  /** Play the built-in loop (ask first, skip, Go) until the first interaction with the card. Default: on when no steps, value, callbacks or `started` are passed. Uncontrolled only: ignored (off) whenever `value` or `started` is set. */
  autoPlay?: boolean
  /** Uncontrolled only: milliseconds after Go before the card resets to its plan, so it can be used again. Default 6000 for the built-in card, otherwise never (0). */
  resetAfter?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.plw {
  --plw-ink: #000;
  --plw-surface: #fff;
  --plw-accent: #0060e2;
  --plw-t1: color-mix(in oklab, var(--plw-ink) 88%, transparent);
  --plw-t2: color-mix(in oklab, var(--plw-ink) 61%, transparent);
  --plw-t3: color-mix(in oklab, var(--plw-ink) 45%, transparent);
  --plw-t4: color-mix(in oklab, var(--plw-ink) 27%, transparent);
  --plw-skip: color-mix(in oklab, var(--plw-ink) 56%, transparent);
  --plw-fill: color-mix(in oklab, var(--plw-ink) 6%, transparent);
  --plw-hov: color-mix(in oklab, var(--plw-ink) 3.5%, transparent);
  --plw-prs: color-mix(in oklab, var(--plw-ink) 6.5%, transparent);
  --plw-line: color-mix(in oklab, var(--plw-ink) 6%, transparent);
  --plw-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --plw-drop: 0 24px 48px -24px rgb(0 0 0 / .14);
  --plw-ease: cubic-bezier(.22, 1, .36, 1);
  --plw-land: cubic-bezier(.3, 1.4, .5, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 440px;
  font: 15px/20px var(--plw-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--plw-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .plw {
  --plw-ink: #fff;
  --plw-surface: #1c1c1e;
  --plw-accent: #4d8dff;
  --plw-t1: color-mix(in oklab, var(--plw-ink) 90%, transparent);
  --plw-t2: color-mix(in oklab, var(--plw-ink) 62%, transparent);
  --plw-t3: color-mix(in oklab, var(--plw-ink) 46%, transparent);
  --plw-t4: color-mix(in oklab, var(--plw-ink) 28%, transparent);
  --plw-skip: color-mix(in oklab, var(--plw-ink) 58%, transparent);
  --plw-fill: color-mix(in oklab, var(--plw-ink) 8%, transparent);
  --plw-hov: color-mix(in oklab, var(--plw-ink) 5%, transparent);
  --plw-prs: color-mix(in oklab, var(--plw-ink) 9%, transparent);
  --plw-line: color-mix(in oklab, var(--plw-ink) 9%, transparent);
  --plw-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --plw-drop: 0 24px 48px -24px rgb(0 0 0 / .5);
}

/* Mono: ink on paper, a hairline, a monospaced face (a character is .6em wide there), smaller sizes so the steps still fit */
html[data-style="mono"] .plw {
  --plw-ink: #000; --plw-surface: #fff; --plw-accent: #111;
  --plw-shadow: 0 0 0 1px rgb(0 0 0 / .14); --plw-drop: 0 0 0 0 transparent;
  --plw-ease: cubic-bezier(.2, .9, .1, 1); --plw-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .plw { --plw-ink: #fff; --plw-surface: #0a0a0a; --plw-accent: #f2f2f2; --plw-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .plw-card { --plw-fs-l: clamp(17px, 4.2cqw, 18px); --plw-fs-m: 15px; --plw-fs-s: 13px; --plw-ls: 0; border-radius: 8px }
html[data-style="mono"] .plw-row { border-radius: 4px }
html[data-style="mono"] .plw-go { border-radius: 4px; box-shadow: none }
html[data-style="mono"] .plw-dot { border-radius: 2px }
html[data-style="mono"] .plw-row[data-m="ask"] .plw-mode { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .22em }

/* Glass: the card carries the frost, the words sit on it in the Pane glass inks */
html[data-style="glass"] .plw {
  --plw-ink: var(--pane-ink); --plw-surface: var(--pane-solid); --plw-accent: var(--pane-accent); --plw-shadow: var(--pane-shadow);
  --plw-drop: 0 0 0 0 transparent; --plw-ease: var(--pane-ease); --plw-font: var(--pane-font);
  --plw-t1: var(--pane-t1); --plw-t2: var(--pane-t2); --plw-t3: var(--pane-t3); --plw-t4: var(--pane-t4); --plw-skip: var(--pane-t3);
  --plw-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
}
html[data-style="glass"] .plw-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .plw-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .plw-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .plw-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .plw-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .plw-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.plw *, .plw *::before, .plw *::after { box-sizing: border-box }
:where(.plw) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
:where(.plw) p, :where(.plw) ol, :where(.plw) li { margin: 0; padding: 0 }
.plw-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card. Three sizes: the steps (l), the words and button (m), the small lines (s). */
.plw-card {
  --plw-pad: 32px; --plw-fs-l: clamp(18px, 6cqw, 26px); --plw-fs-m: 17px; --plw-fs-s: 15px; --plw-ls: -.02em;
  padding: 28px var(--plw-pad) 26px; border-radius: 28px; background: var(--plw-surface); box-shadow: var(--plw-shadow), var(--plw-drop);
}
.plw-card:focus { outline: none }
.plw-body { transition: opacity .3s var(--plw-ease), filter .3s var(--plw-ease) }
.plw-card[data-out] .plw-body { opacity: 0; filter: blur(6px) }
.plw-card[data-nt] *, .plw-card[data-nt] *::before, .plw-card[data-nt] *::after { transition: none !important; animation: none !important }
.plw-cap { font-size: var(--plw-fs-s); line-height: 20px; color: var(--plw-t2) }

/* A word that changes in place: the old one leaves upward through a blur, the new one lands from below. Both share one grid cell. */
.plw-g { display: inline-grid; vertical-align: top }
.plw-v { grid-area: 1 / 1; white-space: nowrap }
.plw-in { animation: plw-in .5s var(--plw-land) backwards }
.plw-out { animation: plw-out .3s var(--plw-ease) forwards }
@keyframes plw-in { from { opacity: 0; filter: blur(8px); transform: translateY(.32em) scale(.92) } }
@keyframes plw-out { to { opacity: 0; filter: blur(8px); transform: translateY(-.32em) scale(.92) } }

/* The steps */
.plw-list { list-style: none; margin: 10px -14px 0 }
.plw-list li { height: 56px }
.plw-row {
  position: relative; display: flex; align-items: center; gap: 12px; width: 100%; height: 100%; padding: 0 14px; border-radius: 16px;
  touch-action: manipulation; transition: background-color .2s var(--plw-ease);
}
.plw-row:disabled { cursor: default }
@media (hover: hover) { .plw-row:not(:disabled):hover { background: var(--plw-hov) } }
.plw-row[data-sim] { background: var(--plw-hov) }
.plw-row[data-press] { background: var(--plw-prs) }
.plw-row:focus-visible { outline: 2px solid var(--plw-accent); outline-offset: -2px }
/* the tick that lands when a step asks first */
.plw-row::before {
  content: ""; position: absolute; left: 3px; top: 50%; height: 26px; margin-top: -13px; width: 3px; border-radius: 2px;
  background: var(--plw-accent); transform: scaleY(0); transition: transform .5s var(--plw-land);
}
.plw-row[data-m="ask"]::before { transform: scaleY(1) }
.plw-txt {
  position: relative; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: var(--plw-fs-l); line-height: 1.3; font-weight: 500; letter-spacing: var(--plw-ls);
  transition: color .4s var(--plw-ease) .32s, opacity .4s var(--plw-ease) .32s, transform .5s var(--plw-ease) .32s;
}
/* the strike draws first, then the step settles lower and dims */
.plw-txt::after {
  content: ""; position: absolute; left: 0; right: 0; top: 51%; height: 3px; border-radius: 2px; background: var(--plw-t3);
  transform: scaleX(0); transform-origin: left; transition: transform .32s var(--plw-ease);
}
html[data-style="mono"] .plw-txt::after { height: 2px; top: 46% }
.plw-row[data-m="skip"] .plw-txt { color: var(--plw-t3); transform: translateY(3px) }
.plw-row[data-m="skip"] .plw-txt::after { transform: scaleX(1) }
.plw-row:not([data-m="skip"]) .plw-txt, .plw-row:not([data-m="skip"]) .plw-txt::after { transition-delay: 0s }
.plw-card[data-started] .plw-row[data-m="run"]:not([data-now]) .plw-txt { color: var(--plw-t2) }

.plw-mode {
  position: relative; margin-left: auto; padding-left: 18px; flex: none; display: inline-grid; justify-items: end;
  font-size: var(--plw-fs-m); line-height: 24px; font-weight: 500; color: var(--plw-t2); transition: color .35s var(--plw-ease);
}
.plw-mode .plw-g { justify-items: end }
.plw-row[data-m="ask"] .plw-mode, .plw-row[data-now] .plw-mode { color: var(--plw-accent) }
.plw-row[data-m="skip"] .plw-mode { color: var(--plw-skip) }
.plw-dot {
  position: absolute; left: 0; top: 50%; width: 10px; height: 10px; margin-top: -5px; border-radius: 50%; background: var(--plw-accent);
  transform: scale(0); transition: transform .5s var(--plw-land);
}
.plw-row[data-now] .plw-dot { transform: scale(1); animation: plw-pulse 2.2s ease-in-out .5s infinite }
.plw[data-idle] .plw-dot { animation-play-state: paused }
@keyframes plw-pulse { 50% { opacity: .35 } }

/* The line that says what the choices add up to. Every line it can ever say is laid out invisibly in the same cell, so it is as tall as the longest and nothing below moves. */
.plw-note { display: grid; margin-top: 12px; color: var(--plw-t2); font-size: var(--plw-fs-s); line-height: 22px; text-wrap: pretty }
.plw-note > * { grid-area: 1 / 1 }
.plw-note .plw-g { display: grid }
.plw-note .plw-v { white-space: normal }
.plw-ghost { visibility: hidden; pointer-events: none; user-select: none }

/* Footer: the total, and Go. The total's two versions share one cell, so it never changes height. */
.plw-foot { position: relative; min-height: 67px; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; padding-top: 20px; border-top: 1px solid var(--plw-line) }
.plw-sums { display: grid; flex: 1; min-width: 0; font-size: var(--plw-fs-s); line-height: 20px; color: var(--plw-t2) }
.plw-sums > p {
  grid-area: 1 / 1; align-self: center; transition: opacity .35s var(--plw-ease), filter .35s var(--plw-ease), transform .45s var(--plw-ease), visibility 0s linear .45s;
}
.plw-on2 { opacity: 0; visibility: hidden; filter: blur(6px); transform: translateY(8px) }
.plw-card[data-started] .plw-on1 { opacity: 0; visibility: hidden; filter: blur(6px); transform: translateY(-8px) }
.plw-card[data-started] .plw-on2 { opacity: 1; visibility: visible; filter: none; transform: none; transition-delay: .15s, .15s, .15s, 0s }
.plw-go {
  display: inline-grid; align-items: center; justify-items: center; flex: none; min-width: 92px; height: 46px; padding: 0 26px; border-radius: 24px;
  font-size: var(--plw-fs-m); font-weight: 600; line-height: 1; color: var(--plw-surface); background: var(--plw-accent);
  box-shadow: 0 1px 2px color-mix(in oklab, #000 35%, var(--plw-accent)), 0 8px 16px -8px color-mix(in oklab, var(--plw-accent) 55%, transparent);
  transition: transform .2s var(--plw-ease), opacity .3s var(--plw-ease), filter .3s var(--plw-ease), box-shadow .3s var(--plw-ease), visibility 0s;
}
.plw-go[data-sim] { transform: translateY(-1px) }
@media (hover: hover) { .plw-go:not(:disabled):hover { transform: translateY(-1px) } }
.plw-go:not(:disabled):active, .plw-go[data-press] { transform: scale(.95) }
.plw-go:focus-visible { outline: 2px solid var(--plw-accent); outline-offset: 3px }
.plw-go:disabled { cursor: default }
.plw-card:not([data-started]) .plw-go:disabled { opacity: .35; box-shadow: none }
.plw-card[data-started] .plw-go { position: absolute; right: 0; opacity: 0; visibility: hidden; filter: blur(6px); transform: scale(.96); box-shadow: none; pointer-events: none; transition: transform .2s var(--plw-ease), opacity .3s var(--plw-ease), filter .3s var(--plw-ease), box-shadow .3s var(--plw-ease), visibility 0s linear .3s }

@container (max-width: 388px) {
  .plw-card { --plw-pad: 22px; padding: 24px var(--plw-pad) 22px }
  html[data-style="mono"] .plw-card { --plw-fs-l: 15px; --plw-fs-m: 13px }
}
@media (prefers-reduced-motion: reduce) {
  .plw *, .plw *::before, .plw *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const NEXT: Record<PlanWordsMode, PlanWordsMode> = { run: "ask", ask: "skip", skip: "run" }
const WORD: Record<PlanWordsMode, string> = { run: "Run", ask: "Ask first", skip: "Skip" }
const AFTER: Record<PlanWordsMode, string> = { run: "Queued", ask: "Asks you", skip: "Skipped" }
const SPOKEN: Record<PlanWordsMode, string> = { run: "will run", ask: "will ask you first", skip: "is skipped" }

const DEFAULT_STEPS: PlanWordsStep[] = [
  { id: "revenue", title: "Pull Q3 revenue", minutes: 1 },
  { id: "invoices", title: "Reconcile invoices", minutes: 2 },
  { id: "summary", title: "Draft the summary", minutes: 2 },
  { id: "pdf", title: "Assemble the PDF", minutes: 1 },
]

/** The built-in moment, as (wait before, what happens). Ask first on the second step, ask then skip on the last, Go, rest, fade, again. */
type Act = "hov1" | "tap1" | "hov3" | "tap3" | "tap3b" | "hovGo" | "go" | "fade"
const SCRIPT: [number, Act][] = [
  [450, "hov1"],
  [350, "tap1"],
  [700, "hov3"],
  [250, "tap3"],
  [500, "tap3b"],
  [750, "hovGo"],
  [500, "go"],
  [4700, "fade"],
]
const ROLL_MS = 340

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const mq = window.matchMedia(rmQuery)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

type RollState = { cur: string; prev: string | null; n: number; anim: boolean }

/** A word that rolls in place when its text changes. `still` swaps it without motion. */
function Roll({ text, still }: { text: string; still: boolean }) {
  const [st, setSt] = React.useState<RollState>({ cur: text, prev: null, n: 0, anim: false })
  if (st.cur !== text) setSt({ cur: text, prev: still ? null : st.cur, n: st.n + 1, anim: !still })

  React.useEffect(() => {
    if (st.prev === null) return
    const n = st.n
    const id = window.setTimeout(() => setSt((s) => (s.n === n ? { ...s, prev: null } : s)), ROLL_MS)
    return () => window.clearTimeout(id)
  }, [st.n, st.prev])

  return (
    <span className="plw-g">
      {st.prev !== null && (
        <span key={`o${st.n}`} className="plw-v plw-out">
          {st.prev}
        </span>
      )}
      <span key={`i${st.n}`} className={cn("plw-v", st.anim && "plw-in")}>
        {st.cur}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  PlanWords                                 */
/* -------------------------------------------------------------------------- */

type Mark = number | "go" | null

export function PlanWords(props: PlanWordsProps) {
  const {
    agent = "Atlas",
    steps: stepsProp,
    value,
    defaultValue,
    onChange,
    started: startedProp,
    onGo,
    goLabel = "Go",
    hint = "Tap Run to ask first or skip a step.",
    className,
  } = props
  const caption = props.caption ?? `${agent}'s plan for the Q3 board pack`
  const steps = stepsProp && stepsProp.length > 0 ? stepsProp : DEFAULT_STEPS
  const bare = stepsProp === undefined && value === undefined && defaultValue === undefined && startedProp === undefined && onChange === undefined && onGo === undefined
  const autoPlay = value === undefined && startedProp === undefined && (props.autoPlay ?? bare)
  const resetMs = props.resetAfter ?? (bare ? 6000 : 0)

  const reduce = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [inner, setInner] = React.useState<PlanWordsModes>(() => defaultValue ?? {})
  const [innerStarted, setInnerStarted] = React.useState(false)
  const [touched, setTouched] = React.useState(false)
  const [auto, setAuto] = React.useState(autoPlay)
  const [beat, setBeat] = React.useState(0)
  const [sim, setSim] = React.useState<Mark>(null)
  const [press, setPress] = React.useState<Mark>(null)
  const [out, setOut] = React.useState(false)
  const [nt, setNt] = React.useState(false)
  const [onScreen, setOnScreen] = React.useState(true)
  const [visible, setVisible] = React.useState(true)
  const [announce, setAnnounce] = React.useState("")
  const pressTimer = React.useRef(0)
  const fadeTimers = React.useRef<number[]>([])
  const live = React.useRef(0)
  const capId = React.useId()

  const modes = value ?? inner
  const started = startedProp ?? innerStarted
  const modeOf = (s: PlanWordsStep): PlanWordsMode => modes[s.id] ?? "run"
  const frozen = reduce && auto
  const wasReduced = React.useRef(reduce)

  // Reduced motion with the built-in card: one still frame (a step that asks first, one that is skipped); the card is fully usable from there.
  React.useLayoutEffect(() => {
    // Reduced motion switched off mid-session while the loop was never taken over: drop the still frame and start the script from its first beat.
    if (wasReduced.current && !reduce && auto) {
      resetAll()
      setBeat(0)
    }
    wasReduced.current = reduce
    if (!bare || !reduce) return
    const a = steps[Math.min(1, steps.length - 1)]
    const b = steps[Math.min(3, steps.length - 1)]
    setInner({ [a.id]: "ask", [b.id]: "skip" })
    setTouched(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bare, reduce])

  /* ---- what the choices add up to ---- */
  const act = steps.filter((s) => modeOf(s) !== "skip")
  const asks = steps.filter((s) => modeOf(s) === "ask")
  const mins = act.reduce((a, s) => a + (s.minutes ?? 1), 0)
  const lead = act[0]
  const waiting = started && !!lead && modeOf(lead) === "ask"
  const workingId = started && lead && !waiting ? lead.id : null
  const note = !act.length
    ? "Nothing left to run."
    : asks.length === 1
      ? `Pauses for you before ${asks[0].title}.`
      : asks.length > 1
        ? `Pauses for you ${asks.length} times.`
        : touched || steps.some((s) => modeOf(s) !== "run")
          ? "Runs start to finish on its own."
          : hint
  const everyNote = [hint, "Nothing left to run.", "Runs start to finish on its own.", `Pauses for you ${steps.length} times.`, ...steps.map((s) => `Pauses for you before ${s.title}.`)]
  const still = reduce || nt

  /* ---- actions ---- */
  const say = (t: string) => {
    live.current += 1
    setAnnounce(t + (live.current % 2 ? "" : "​"))
  }
  const mark = (m: Mark) => {
    setPress(m)
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPress(null), 160)
  }

  const cycle = (i: number, user: boolean) => {
    if (started) return
    const s = steps[i]
    if (!s) return
    const mode = NEXT[modeOf(s)]
    const next = { ...modes, [s.id]: mode }
    if (value === undefined) setInner(next)
    setTouched(true)
    mark(i)
    if (user) {
      onChange?.(next, { id: s.id, mode, step: s })
      const left = steps.filter((x) => (next[x.id] ?? "run") !== "skip")
      const left2 = steps.filter((x) => next[x.id] === "ask")
      const n = left.length
      const m = left.reduce((a, x) => a + (x.minutes ?? 1), 0)
      const line = !n ? "Nothing left to run." : left2.length === 1 ? `Pauses for you before ${left2[0].title}.` : left2.length > 1 ? `Pauses for you ${left2.length} times.` : "Runs start to finish on its own."
      say(`${s.title} ${SPOKEN[mode]}. ${n} ${n === 1 ? "step" : "steps"}, about ${m} ${m === 1 ? "minute" : "minutes"}. ${line}`)
    }
  }

  const go = (user: boolean) => {
    if (started || !act.length) return
    if (startedProp === undefined) setInnerStarted(true)
    setSim(null)
    // The button is about to go inert: keep a keyboard user's place on the card.
    if (document.activeElement && document.activeElement === cardRef.current?.querySelector(".plw-go")) cardRef.current?.focus({ preventScroll: true })
    if (user) {
      onGo?.(modes)
      const first = act[0]
      say(modeOf(first) === "ask" ? `${agent} is waiting for you before ${first.title}.` : `${agent} is working, starting with ${first.title}. ${note}`)
    }
  }

  const resetAll = () => {
    if (value === undefined) setInner(defaultValue ?? {})
    if (startedProp === undefined) setInnerStarted(false)
    setTouched(false)
    setSim(null)
    setPress(null)
  }

  const clearFade = () => {
    fadeTimers.current.forEach((t) => window.clearTimeout(t))
    fadeTimers.current = []
  }
  /** Back to the plan: the body fades through a blur, the state resets while transitions are off, then it fades back in. */
  const fadeReset = (done?: () => void) => {
    clearFade()
    if (reduce) {
      resetAll()
      done?.()
      return
    }
    setOut(true)
    fadeTimers.current.push(
      window.setTimeout(() => {
        setNt(true)
        resetAll()
      }, 320),
      window.setTimeout(() => {
        setNt(false)
        setOut(false)
        done?.()
      }, 440),
    )
  }

  // The person has taken over: the loop ends for good (and a half-finished fade is put back).
  const handOver = () => {
    if (!auto) return
    setAuto(false)
    setSim(null)
    if (fadeTimers.current.length) {
      clearFade()
      setNt(false)
      setOut(false)
    }
  }

  const run = (a: Act) => {
    const first = Math.min(1, steps.length - 1)
    const last = Math.min(3, steps.length - 1)
    switch (a) {
      case "hov1":
        setSim(first)
        break
      case "tap1":
        setSim(null)
        cycle(first, false)
        break
      case "hov3":
        setSim(last)
        break
      case "tap3":
        cycle(last, false)
        break
      case "tap3b":
        cycle(last, false)
        setSim(null)
        break
      case "hovGo":
        setSim("go")
        break
      case "go":
        setSim(null)
        mark("go")
        go(false)
        break
      case "fade":
        setBeat(SCRIPT.length)
        fadeReset(() => setBeat(0))
        return
    }
    setBeat((b) => b + 1)
  }

  const fns = React.useRef({ run, fadeReset })
  React.useLayoutEffect(() => {
    fns.current = { run, fadeReset }
  })

  React.useEffect(
    () => () => {
      window.clearTimeout(pressTimer.current)
      fadeTimers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  // The loop runs only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setVisible(document.visibilityState === "visible")
    update()
    document.addEventListener("visibilitychange", update)
    if (typeof IntersectionObserver === "undefined") return () => document.removeEventListener("visibilitychange", update)
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((x) => x.isIntersecting)))
    io.observe(el)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  const active = onScreen && visible

  // The built-in moment, one timer per beat so a pause (off screen, hidden tab) simply picks the same beat up again.
  React.useEffect(() => {
    if (!auto || frozen || !active || beat >= SCRIPT.length) return
    const [wait, a] = SCRIPT[beat]
    const id = window.setTimeout(() => fns.current.run(a), wait)
    return () => window.clearTimeout(id)
  }, [auto, frozen, active, beat])

  // After a real Go on the built-in card: rest on the statuses, then go back to the plan so it can be played again.
  React.useEffect(() => {
    if (!started || auto || resetMs <= 0 || startedProp !== undefined) return
    const id = window.setTimeout(() => fns.current.fadeReset(), resetMs)
    return () => window.clearTimeout(id)
  }, [started, auto, resetMs, startedProp])

  const status = (s: PlanWordsStep) => (started ? (s.id === workingId ? "Working" : AFTER[modeOf(s)]) : WORD[modeOf(s)])

  return (
    <div
      ref={rootRef}
      className={cn("plw", className)}
      data-idle={!active || undefined}
      // Only a press, key, hover or focus that lands on the card ends the built-in loop; the rest of the page can be clicked freely.
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") handOver()
      }}
      onPointerDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) handOver()
      }}
      onKeyDownCapture={(e) => {
        if (e.nativeEvent.isTrusted) handOver()
      }}
      onFocusCapture={handOver}
    >
      <style href="plan-words" precedence="default">
        {CSS}
      </style>
      <p className="plw-sr" role="status" aria-live={auto ? "off" : "polite"}>
        {announce}
      </p>
      <div
        ref={cardRef}
        tabIndex={-1}
        className="plw-card"
        role="group"
        aria-labelledby={capId}
        data-started={started || undefined}
        data-out={out || undefined}
        data-nt={nt || undefined}
      >
        <div className="plw-body">
          <p id={capId} className="plw-cap">
            {caption}
          </p>
          <ol className="plw-list" role="list">
            {steps.map((s, i) => {
              const m = modeOf(s)
              const word = status(s)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="plw-row"
                    data-m={m}
                    data-now={s.id === workingId || undefined}
                    data-sim={sim === i || undefined}
                    data-press={press === i || undefined}
                    disabled={started}
                    aria-label={started ? `${s.title}: ${word.toLowerCase()}` : `${s.title}: ${word}. Press for ${WORD[NEXT[m]]}.`}
                    onClick={() => cycle(i, true)}
                  >
                    <span className="plw-txt">{s.title}</span>
                    <span className="plw-mode" aria-hidden>
                      <span className="plw-dot" />
                      <Roll text={word} still={still} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="plw-note">
            <Roll text={note} still={still} />
            {everyNote.map((t, i) => (
              <p key={i} className="plw-ghost" aria-hidden>
                {t}
              </p>
            ))}
          </div>
          <div className="plw-foot">
            <div className="plw-sums">
              <p className="plw-on1" aria-hidden={started}>
                <Roll text={String(act.length)} still={still} /> <Roll text={act.length === 1 ? "step" : "steps"} still={still} /> · about <Roll text={String(mins)} still={still} /> min
              </p>
              <p className="plw-on2" aria-hidden={!started}>
                {waiting ? `${agent} is waiting for you` : `${agent} is working`} · about <Roll text={String(mins)} still={still} /> min
              </p>
            </div>
            <button
              type="button"
              className="plw-go"
              disabled={started || !act.length}
              data-sim={sim === "go" || undefined}
              data-press={press === "go" || undefined}
              onClick={() => go(true)}
            >
              {goLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

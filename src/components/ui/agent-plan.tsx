"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PlanStepStatus = "pending" | "active" | "done" | "failed"

export type PlanStep = {
  /** Stable id – animations, timers and announcements follow the id, not the index. */
  id: string
  title: string
  /** One short line under the title. */
  detail?: string
  /** The tool the step calls, shown as a small code chip, e.g. "stripe.query". */
  tool?: string
  /** Run state of the step. Leave it out while the plan is a draft. */
  status?: PlanStepStatus
  /** How long the step took, in ms. Leave it out to have it measured from when the step turned active. */
  duration?: number
  /** What went wrong, for a failed step. */
  error?: string
}

export type PlanStatus = "draft" | "running" | "done"

export type AgentPlanProps = {
  /** Controlled steps. Pair with `onChange`. */
  steps?: PlanStep[]
  /** Initial steps when uncontrolled – edits are kept inside the component. */
  defaultSteps?: PlanStep[]
  /**
   * "draft" lets people edit, "running" executes, "done" is finished. Leave it out and the component
   * runs a built-in simulation when "Run plan" is pressed (handy for demos and docs).
   */
  status?: PlanStatus
  /** Every edit during review: rename, remove, reorder, add. */
  onChange?: (steps: PlanStep[]) => void
  /** "Run plan" was pressed – gets the steps in their final order. Also shows "Run again" once done. */
  onRun?: (steps: PlanStep[]) => void
  /** Shows a Cancel button next to Run plan. */
  onCancel?: () => void
  /** Shows "Retry from here" under failed steps. */
  onRetry?: (stepId: string) => void
  /** The goal of the plan, shown as the heading and used as the list's label. */
  title?: string
  /** Estimated run time shown in review, e.g. "~2 min". */
  estimate?: string
  /** Built-in simulation only: the id of a step that fails the first time it runs (to show "Retry from here"). */
  simulateFail?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.apl {
  --apl-ink: #000;
  --apl-surface: #fff;
  --apl-accent: #0060e2;
  --apl-danger: #d72400;
  --apl-t1: color-mix(in oklab, var(--apl-ink) 88%, transparent);
  --apl-t2: color-mix(in oklab, var(--apl-ink) 61%, transparent);
  --apl-t3: color-mix(in oklab, var(--apl-ink) 45%, transparent);
  --apl-t4: color-mix(in oklab, var(--apl-ink) 27%, transparent);
  --apl-fill: color-mix(in oklab, var(--apl-ink) 4.3%, transparent);
  --apl-line: color-mix(in oklab, var(--apl-ink) 6%, transparent);
  --apl-rail: color-mix(in oklab, var(--apl-ink) 8%, transparent);
  --apl-btn: color-mix(in oklab, var(--apl-ink) 88%, transparent);
  --apl-btn-ink: #fcfcfc;
  --apl-glint: rgb(255 255 255 / .82);
  --apl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --apl-ring: inset 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1);
  --apl-lift: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --apl-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  container: apl / inline-size;
  width: 100%;
  max-width: 440px;
  border-radius: 10px;
  background: var(--apl-surface);
  box-shadow: var(--apl-shadow);
  color: var(--apl-t1);
  font-family: var(--apl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .apl {
  --apl-ink: #fff;
  --apl-surface: #1c1c1e;
  --apl-accent: #4d8dff;
  --apl-danger: #ff6a4d;
  --apl-t1: color-mix(in oklab, var(--apl-ink) 90%, transparent);
  --apl-t2: color-mix(in oklab, var(--apl-ink) 62%, transparent);
  --apl-t3: color-mix(in oklab, var(--apl-ink) 46%, transparent);
  --apl-t4: color-mix(in oklab, var(--apl-ink) 28%, transparent);
  --apl-fill: color-mix(in oklab, var(--apl-ink) 6%, transparent);
  --apl-line: color-mix(in oklab, var(--apl-ink) 8%, transparent);
  --apl-rail: color-mix(in oklab, var(--apl-ink) 12%, transparent);
  --apl-btn: #f2f2f3;
  --apl-btn-ink: #111;
  --apl-glint: rgb(255 255 255 / .9);
  --apl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --apl-ring: inset 0 0 0 .5px rgb(255 255 255 / .16), 0 1px 1px -1px rgb(0 0 0 / .4);
  --apl-lift: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.apl *, .apl *::before, .apl *::after { box-sizing: border-box }
:where(.apl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.apl :focus-visible { outline: 2px solid color-mix(in oklab, var(--apl-accent) 60%, transparent); outline-offset: 1px }
.apl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Head */
.apl-head { display: flex; flex-direction: column; gap: 4px; padding: 16px 16px 10px }
.apl-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; line-height: 16px; color: var(--apl-t3) }
.apl-state, .apl-est { display: inline-flex; align-items: center; gap: 6px }
.apl-meta svg { width: 16px; height: 16px; flex: none }
.apl-title { margin: 0; font-size: 15px; font-weight: 500; line-height: 24px; color: var(--apl-ink); text-wrap: balance }

/* Steps */
.apl-list { margin: 0; padding: 0 6px 6px; list-style: none }
.apl-step {
  --apl-pl: 30px;
  position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px 8px var(--apl-pl);
  border-radius: 6px; outline-offset: -2px;
  transition: padding .42s var(--apl-ease), background-color .2s, box-shadow .2s, opacity .3s;
}
.apl[data-status="running"] .apl-step, .apl[data-status="done"] .apl-step { --apl-pl: 10px }
.apl[data-status="draft"] .apl-step:hover { background: var(--apl-fill) }
.apl-step[data-dragging] {
  z-index: 3; background: var(--apl-surface); box-shadow: var(--apl-lift); transition: box-shadow .2s, background-color .2s; cursor: grabbing;
}
.apl-step[data-shift] { transition: transform .3s var(--apl-ease) }
.apl-step[data-leaving] { overflow: hidden; pointer-events: none; animation: apl-leave .32s var(--apl-ease) forwards }

.apl-grip {
  position: absolute; left: 6px; top: 8px; display: grid; place-items: center; width: 18px; height: 20px; border-radius: 5px;
  color: var(--apl-t4); opacity: 0; cursor: grab; touch-action: none; transition: opacity .2s, color .2s, background-color .2s;
}
.apl-grip svg { width: 16px; height: 16px; fill: currentColor }
.apl-step:hover .apl-grip, .apl-step:focus-within .apl-grip, .apl-step[data-dragging] .apl-grip { opacity: 1 }
.apl-grip:hover { color: var(--apl-t2); background: var(--apl-fill) }
.apl[data-status="running"] .apl-grip, .apl[data-status="done"] .apl-grip { display: none }

.apl-marker {
  position: relative; flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
  background: var(--apl-surface); box-shadow: var(--apl-ring); color: var(--apl-t3);
  font-size: 11px; font-weight: 500; line-height: 11px; font-variant-numeric: tabular-nums;
  transition: background-color .32s, color .32s, box-shadow .32s;
}
.apl-marker svg { width: 16px; height: 16px; grid-area: 1 / 1 }
.apl-step[data-step="active"] .apl-marker { color: var(--apl-accent); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--apl-accent) 35%, transparent), 0 1px 1px -1px rgb(0 0 0 / .1) }
.apl-step[data-step="done"] .apl-marker { background: var(--apl-accent); color: #fff; box-shadow: none }
.apl-step[data-step="failed"] .apl-marker { background: var(--apl-danger); color: #fff; box-shadow: none }
.apl-spinner { animation: apl-pop .36s var(--apl-ease) backwards }
.apl-spinner line { stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; animation: apl-ray .8s linear infinite }
.apl-mark { animation: apl-pop .36s var(--apl-ease) backwards }
.apl-mark path { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: apl-draw .42s var(--apl-ease) .08s backwards }

/* The rail joins one marker to the next and fills blue as steps finish */
.apl-rail {
  position: absolute; left: calc(var(--apl-pl) + 9.5px); top: 31px; bottom: -5px; width: 1px; background: var(--apl-rail);
  opacity: 0; transition: opacity .3s .24s, left .42s var(--apl-ease); pointer-events: none;
}
.apl-rail::after { content: ""; position: absolute; inset: 0; background: var(--apl-accent); transform: scaleY(0); transform-origin: top; transition: transform .56s var(--apl-ease) }
.apl[data-status="running"] .apl-rail, .apl[data-status="done"] .apl-rail { opacity: 1 }
.apl-step[data-step="done"] .apl-rail::after { transform: scaleY(1) }

.apl-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px }
.apl-name { font-weight: 500; color: var(--apl-t1); overflow-wrap: anywhere; transition: color .3s }
.apl[data-status="running"] .apl-step[data-step="pending"] .apl-name { color: var(--apl-t3) }
.apl-name-input {
  width: 100%; margin: 0; padding: 0; border: 0; outline: 0; background: transparent; font: inherit; font-weight: 500; color: var(--apl-ink);
  box-shadow: 0 1.5px 0 -.5px color-mix(in oklab, var(--apl-accent) 60%, transparent);
}
.apl-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 12px; line-height: 16px; color: var(--apl-t3) }
.apl-detail { overflow-wrap: anywhere }
.apl-tool {
  display: inline-block; padding: 0 5px; border-radius: 5px; background: var(--apl-fill); color: var(--apl-t2); white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 16px;
}
.apl-error { margin-top: 2px; font-size: 12px; line-height: 16px; color: var(--apl-danger) }
.apl .apl-retry {
  align-self: flex-start; margin-top: 6px; height: 24px; padding: 0 8px; border-radius: 6px; background: var(--apl-surface);
  box-shadow: var(--apl-shadow); font-size: 12px; font-weight: 500; color: var(--apl-t1); transition: background-color .16s;
  animation: apl-in .42s var(--apl-ease) backwards;
}
.apl .apl-retry:hover { background: var(--apl-fill) }

.apl-aside { flex: none; display: flex; justify-content: flex-end; width: 22px; height: 20px; font-size: 12px; line-height: 20px; color: var(--apl-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.apl[data-status="running"] .apl-aside, .apl[data-status="done"] .apl-aside { width: auto; min-width: 22px }
.apl .apl-remove {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; margin: -4px -3px 0 0; border-radius: 6px; color: var(--apl-t3);
  opacity: 0; transition: opacity .2s, background-color .2s, color .2s;
}
.apl .apl-remove svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; fill: none }
.apl-step:hover .apl-remove, .apl-step:focus-within .apl-remove { opacity: 1 }
.apl .apl-remove:hover { background: var(--apl-fill); color: var(--apl-ink) }
.apl-time { animation: apl-fade .3s linear backwards }
.apl-step[data-step="failed"] .apl-time { color: var(--apl-danger) }
@media (hover: none) {
  .apl-grip, .apl .apl-remove { opacity: 1 }
}

/* Add step row folds away once the plan runs */
.apl-tail { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .42s var(--apl-ease), opacity .26s }
.apl[data-status="running"] .apl-tail, .apl[data-status="done"] .apl-tail { grid-template-rows: 0fr; opacity: 0 }
.apl-tail-clip { min-height: 0; overflow: hidden; padding: 0 6px }
.apl[data-status="running"] .apl-tail-clip, .apl[data-status="done"] .apl-tail-clip { visibility: hidden; transition: visibility 0s .42s }
.apl-add { display: flex; align-items: center; gap: 10px; height: 32px; margin: 2px 0; padding: 0 10px 0 30px; border-radius: 6px; cursor: text; transition: background-color .2s }
.apl-add:hover, .apl-add:focus-within { background: var(--apl-fill) }
.apl-add-icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--apl-t3) }
.apl-add-icon svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; fill: none }
.apl-add input { flex: 1; min-width: 0; margin: 0; padding: 0; border: 0; outline: 0; background: transparent; font: inherit; color: var(--apl-t1) }
.apl-add input::placeholder { color: var(--apl-t3) }
.apl-add:focus-within { outline: 2px solid color-mix(in oklab, var(--apl-accent) 60%, transparent); outline-offset: 1px }

/* Footer */
.apl-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 0 10px 0 16px; border-top: .5px solid var(--apl-line); font-size: 12px; line-height: 16px; color: var(--apl-t3) }
.apl-hint { min-width: 0 }
.apl-actions { display: flex; flex: none; gap: 8px; margin-left: auto }
.apl .apl-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 6px;
  font-size: 13px; font-weight: 500; line-height: 16px; white-space: nowrap; transition: background-color .16s, opacity .16s;
}
.apl .apl-btn svg { width: 16px; height: 16px; fill: currentColor }
.apl .apl-btn--secondary { background: var(--apl-surface); box-shadow: var(--apl-shadow); color: var(--apl-ink) }
.apl .apl-btn--secondary:hover { background: color-mix(in oklab, var(--apl-surface), var(--apl-ink) 3%) }
.apl .apl-btn--primary { padding-right: 8px; background: var(--apl-btn); color: var(--apl-btn-ink) }
.apl .apl-btn--primary:hover { opacity: .88 }
.apl .apl-btn--primary[disabled] { opacity: .4; cursor: default }
.apl-status { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 13px; line-height: 20px; color: var(--apl-t3); animation: apl-fade .32s linear backwards }
.apl-status svg { flex: none; width: 16px; height: 16px }
.apl-status[data-tone="done"] { color: var(--apl-t1) }
.apl-status[data-tone="done"] svg { color: var(--apl-accent) }
.apl-status[data-tone="failed"] { color: var(--apl-danger) }
.apl-status-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px }
.apl-status-icon .apl-spinner line { stroke: var(--apl-t2) }
.apl-elapsed { margin-left: auto; font-size: 12px; color: var(--apl-t4); font-variant-numeric: tabular-nums; animation: apl-fade .32s linear backwards }
.apl-shimmer { position: relative }
.apl-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--apl-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: apl-sweep 1.6s linear infinite;
}

@container apl (max-width: 399px) { .apl-hint { display: none } }
@container apl (max-width: 339px) {
  .apl-head { padding-inline: 12px }
  .apl-foot { padding-left: 12px; padding-right: 8px }
  .apl-list, .apl-tail-clip { padding-inline: 4px }
}

@keyframes apl-in { from { opacity: 0; transform: translateY(6px) } }
@keyframes apl-leave { from { height: var(--apl-h) } to { height: 0; opacity: 0; padding-top: 0; padding-bottom: 0 } }
@keyframes apl-pop { 0% { transform: scale(.5); opacity: 0 } 60% { transform: scale(1.1); opacity: 1 } 100% { transform: none } }
@keyframes apl-draw { from { stroke-dashoffset: 1 } }
@keyframes apl-ray { from { opacity: 1 } to { opacity: .15 } }
@keyframes apl-fade { from { opacity: 0 } }
@keyframes apl-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }

@media (prefers-reduced-motion: reduce) {
  .apl *, .apl *::before, .apl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const vb = { viewBox: "0 0 16 16", "aria-hidden": true } as const

const GripIcon = () => (
  <svg {...vb}>
    {[4, 8, 12].flatMap((y) => [6, 10].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" />))}
  </svg>
)
const CloseIcon = () => (
  <svg {...vb}>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </svg>
)
const PlusIcon = () => (
  <svg {...vb}>
    <path d="M8 3.75v8.5M3.75 8h8.5" />
  </svg>
)
const PlayIcon = () => (
  <svg {...vb}>
    <path d="M5.5 3.8v8.4L12 8z" />
  </svg>
)
const ListIcon = () => (
  <svg {...vb} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <path d="M6.5 4.5h6M6.5 8h6M6.5 11.5h6" />
    <circle cx="3.6" cy="4.5" r=".6" fill="currentColor" />
    <circle cx="3.6" cy="8" r=".6" fill="currentColor" />
    <circle cx="3.6" cy="11.5" r=".6" fill="currentColor" />
  </svg>
)
const ClockIcon = () => (
  <svg {...vb} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3.2l1.8 1.1" />
  </svg>
)
const WarnIcon = () => (
  <svg {...vb} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2.9 13.6 12.4H2.4z" />
    <path d="M8 6.8v2.6M8 11.1v.1" />
  </svg>
)
const CheckCircle = () => (
  <svg {...vb}>
    <circle cx="8" cy="8" r="6.25" fill="currentColor" />
    <path d="m5.2 8.2 2 2 3.6-4" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function Spinner() {
  return (
    <svg {...vb} className="apl-spinner" fill="none">
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1="8" y1="1.75" x2="8" y2="4.75" transform={`rotate(${i * 45} 8 8)`} style={{ animationDelay: `${-800 + i * 100}ms` }} />
      ))}
    </svg>
  )
}

function Mark({ failed }: { failed?: boolean }) {
  return (
    <svg {...vb} className="apl-mark">
      <path pathLength={1} d={failed ? "M8 4.6v4.2M8 11v.1" : "M4.2 8.4 6.8 11l5-5.6"} />
    </svg>
  )
}

function fmtMs(ms: number) {
  const s = ms / 1000
  if (s < 10) return `${s.toFixed(1)}s`
  if (s < 60) return `${Math.round(s)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

/** Deterministic 0.9–1.7s so a simulated run looks natural but repeatable. */
function simMs(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 900 + (h % 800)
}

type Timing = { start: number; end?: number }

/* -------------------------------------------------------------------------- */
/*                                 AgentPlan                                  */
/* -------------------------------------------------------------------------- */

export function AgentPlan({
  steps: stepsProp,
  defaultSteps,
  status: statusProp,
  onChange,
  onRun,
  onCancel,
  onRetry,
  title,
  estimate,
  simulateFail,
  className,
}: AgentPlanProps) {
  const uid = React.useId()
  const hintId = `${uid}-hint`
  const [innerSteps, setInnerSteps] = React.useState<PlanStep[]>(defaultSteps ?? [])
  const [innerStatus, setInnerStatus] = React.useState<PlanStatus>("draft")
  const steps = stepsProp ?? innerSteps
  const status = statusProp ?? innerStatus
  const simulate = statusProp === undefined
  const draft = status === "draft"

  const stepsRef = React.useRef(steps)
  React.useEffect(() => {
    stepsRef.current = steps
  })

  const [editing, setEditing] = React.useState<{ id: string; value: string } | null>(null)
  const [leaving, setLeaving] = React.useState<Record<string, number>>({})
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [draftText, setDraftText] = React.useState("")
  const [note, setNote] = React.useState("")
  const olRef = React.useRef<HTMLOListElement>(null)
  const prevRects = React.useRef<Map<string, DOMRect>>(new Map())
  const pendingFocus = React.useRef<string | null>(null)
  const counter = React.useRef(0)
  const timers = React.useRef<number[]>([])
  const failedOnce = React.useRef(false)
  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  const commit = (next: PlanStep[]) => {
    if (stepsProp === undefined) setInnerSteps(next)
    onChange?.(next)
  }

  /* ----------------------------- Run + simulation ---------------------------- */

  const startRun = () => {
    onRun?.(steps)
    if (!simulate) return
    failedOnce.current = false
    setInnerSteps((cur) => cur.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending", duration: undefined, error: undefined })))
    setInnerStatus("running")
  }

  const reset = () => {
    setInnerSteps((cur) => cur.map((s) => ({ ...s, status: undefined, duration: undefined, error: undefined })))
    setInnerStatus("draft")
  }

  const retry = (id: string) => {
    onRetry?.(id)
    if (!simulate) return
    setInnerSteps((cur) => {
      const at = cur.findIndex((s) => s.id === id)
      return cur.map((s, i) => (i < at ? s : { ...s, status: i === at ? "active" : "pending", duration: undefined, error: undefined }))
    })
  }

  const activeIndex = steps.findIndex((s) => s.status === "active")
  const activeId = activeIndex >= 0 ? steps[activeIndex].id : null
  React.useEffect(() => {
    if (!simulate || innerStatus !== "running" || !activeId) return
    const id = window.setTimeout(() => {
      // Decide outside the updater: updaters must stay pure (React may run them twice).
      const fails = simulateFail === activeId && !failedOnce.current
      if (fails) failedOnce.current = true
      setInnerSteps((cur) => {
        const at = cur.findIndex((s) => s.id === activeId)
        if (at < 0 || cur[at].status !== "active") return cur
        if (fails) {
          return cur.map((s, i) => (i === at ? { ...s, status: "failed", error: "The tool timed out – try again." } : s))
        }
        return cur.map((s, i) => (i === at ? { ...s, status: "done" } : i === at + 1 ? { ...s, status: "active" } : s))
      })
    }, simMs(activeId))
    return () => window.clearTimeout(id)
  }, [simulate, innerStatus, activeId, simulateFail])

  // Finished: every step done.
  const allDone = steps.length > 0 && steps.every((s) => s.status === "done")
  if (simulate && innerStatus === "running" && allDone) setInnerStatus("done")

  /* --------------------------------- Timing ---------------------------------- */

  const [times, setTimes] = React.useState<Record<string, Timing>>({})
  const [run, setRun] = React.useState<Timing | null>(null)
  const [now, setNow] = React.useState(0)
  const signature = steps.map((s) => `${s.id}:${s.status ?? ""}`).join("|")
  if (draft && (Object.keys(times).length > 0 || run)) {
    setTimes({})
    setRun(null)
  }
  const running = status === "running" && activeIndex >= 0
  React.useEffect(() => {
    if (status === "draft") return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const cur = stepsRef.current
      setTimes((prev) => {
        let next = prev
        const put = (id: string, v: Timing | undefined) => {
          if (next === prev) next = { ...prev }
          if (v) next[id] = v
          else delete next[id]
        }
        for (const s of cur) {
          const tm = prev[s.id]
          if (s.status === "active") {
            if (!tm || tm.end) put(s.id, { start: t })
          } else if (s.status === "done" || s.status === "failed") {
            if (tm && !tm.end) put(s.id, { ...tm, end: t })
          } else if (tm) put(s.id, undefined)
        }
        return next
      })
      setRun((r) => {
        const any = cur.some((s) => s.status === "active")
        const finished = cur.length > 0 && cur.every((s) => s.status === "done")
        if (!r) return any ? { start: t } : null
        if (finished && !r.end) return { ...r, end: t }
        if (!finished && r.end) return { start: r.start }
        return r
      })
    }
    const first = window.setTimeout(tick, 0)
    const iv = running ? window.setInterval(tick, 100) : undefined
    return () => {
      window.clearTimeout(first)
      if (iv) window.clearInterval(iv)
    }
  }, [status, signature, running])

  /* ------------------------------ FLIP + focus ------------------------------- */

  React.useLayoutEffect(() => {
    const ol = olRef.current
    if (!ol) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const next = new Map<string, DOMRect>()
    const items = ol.querySelectorAll<HTMLElement>(":scope > li[data-id]")
    items.forEach((el) => {
      const id = el.dataset.id as string
      const rect = el.getBoundingClientRect()
      next.set(id, rect)
      el.style.transition = ""
      const before = prevRects.current.get(id)
      if (reduce || el.hasAttribute("data-leaving")) return
      if (before) {
        const dy = before.top - rect.top
        if (Math.abs(dy) > 1) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.22, 1, .36, 1)" })
      } else if (prevRects.current.size > 0) {
        el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.22, 1, .36, 1)" })
      }
    })
    prevRects.current = next
    if (pendingFocus.current) {
      const target = [...items].find((el) => el.dataset.id === pendingFocus.current)
      pendingFocus.current = null
      target?.focus()
    }
  })

  /* --------------------------------- Edits ----------------------------------- */

  const say = (text: string) => setNote(text)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length || from === to) return
    const next = steps.slice()
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    pendingFocus.current = item.id
    say(`Moved "${item.title}" to position ${to + 1} of ${next.length}`)
    commit(next)
  }

  const remove = (id: string) => {
    const at = steps.findIndex((s) => s.id === id)
    if (at < 0 || leaving[id] !== undefined) return
    const el = [...(olRef.current?.querySelectorAll<HTMLElement>(":scope > li[data-id]") ?? [])].find((n) => n.dataset.id === id)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const neighbour = steps[at + 1] ?? steps[at - 1]
    pendingFocus.current = neighbour?.id ?? null
    setLeaving((l) => ({ ...l, [id]: el?.offsetHeight ?? 0 }))
    const title = steps[at].title
    const t = window.setTimeout(
      () => {
        setLeaving((l) => {
          const n = { ...l }
          delete n[id]
          return n
        })
        const cur = stepsRef.current
        commit(cur.filter((s) => s.id !== id))
        say(`Removed "${title}" – ${cur.length - 1} ${cur.length - 1 === 1 ? "step" : "steps"} left`)
      },
      reduce ? 0 : 320,
    )
    timers.current.push(t)
  }

  const add = () => {
    const text = draftText.trim()
    if (!text) return
    const id = `${uid}-n${counter.current++}`
    commit([...steps, { id, title: text }])
    setDraftText("")
    say(`Added "${text}" as step ${steps.length + 1}`)
  }

  const selectOnMount = React.useCallback((el: HTMLInputElement | null) => el?.select(), [])
  const skipBlur = React.useRef(false)

  const saveEdit = () => {
    if (!editing || skipBlur.current) return
    skipBlur.current = true
    const value = editing.value.trim()
    const cur = steps.find((s) => s.id === editing.id)
    if (cur && value && value !== cur.title) {
      commit(steps.map((s) => (s.id === editing.id ? { ...s, title: value } : s)))
      say(`Renamed step to "${value}"`)
    }
    pendingFocus.current = editing.id
    setEditing(null)
  }

  const startEdit = (id: string, value: string) => {
    skipBlur.current = false
    setEditing({ id, value })
  }

  const cancelEdit = () => {
    skipBlur.current = true
    if (editing) pendingFocus.current = editing.id
    setEditing(null)
  }

  const onStepKey = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (e.target !== e.currentTarget || !draft) return
    const items = [...(olRef.current?.querySelectorAll<HTMLElement>(":scope > li[data-id]") ?? [])]
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      const dir = e.key === "ArrowUp" ? -1 : 1
      if (e.altKey) move(index, index + dir)
      else items[index + dir]?.focus()
    } else if (e.key === "Enter") {
      e.preventDefault()
      startEdit(steps[index].id, steps[index].title)
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault()
      remove(steps[index].id)
    }
  }

  /* ---------------------------------- Drag ----------------------------------- */

  const drag = React.useRef<{ from: number; target: number; startY: number; tops: number[]; heights: number[]; els: HTMLElement[] } | null>(null)

  const onGripDown = (e: React.PointerEvent<HTMLSpanElement>, index: number) => {
    if (!draft || e.button !== 0) return
    const ol = olRef.current
    if (!ol) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const els = [...ol.querySelectorAll<HTMLElement>(":scope > li[data-id]")]
    drag.current = { from: index, target: index, startY: e.clientY, tops: els.map((el) => el.offsetTop), heights: els.map((el) => el.offsetHeight), els }
    setDragId(steps[index].id)
    els.forEach((el, i) => i !== index && el.setAttribute("data-shift", ""))
  }

  const onGripMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const d = drag.current
    if (!d) return
    const last = d.els.length - 1
    const minDy = -d.tops[d.from]
    const maxDy = d.tops[last] + d.heights[last] - d.tops[d.from] - d.heights[d.from]
    const dy = Math.max(minDy, Math.min(maxDy, e.clientY - d.startY))
    d.els[d.from].style.transform = `translateY(${dy}px)`
    const center = d.tops[d.from] + d.heights[d.from] / 2 + dy
    let target = 0
    d.els.forEach((_, j) => {
      if (j !== d.from && d.tops[j] + d.heights[j] / 2 < center) target++
    })
    d.target = target
    const h = d.heights[d.from]
    d.els.forEach((el, j) => {
      if (j === d.from) return
      let shift = 0
      if (j > d.from && j <= target) shift = -h
      else if (j < d.from && j >= target) shift = h
      el.style.transform = shift ? `translateY(${shift}px)` : ""
    })
  }

  const onGripUp = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setDragId(null)
    if (d.target !== d.from) {
      // Remember where everything is on screen, then let FLIP glide from there to the new order.
      const rects = new Map<string, DOMRect>()
      d.els.forEach((el) => rects.set(el.dataset.id as string, el.getBoundingClientRect()))
      prevRects.current = rects
      d.els.forEach((el) => {
        el.style.transition = "none"
        el.style.transform = ""
        el.removeAttribute("data-shift")
      })
      move(d.from, d.target)
    } else {
      d.els.forEach((el) => {
        el.style.transform = ""
        el.removeAttribute("data-shift")
      })
    }
  }

  /* --------------------------------- Render ---------------------------------- */

  const total = steps.length
  const doneCount = steps.filter((s) => s.status === "done").length
  const failed = steps.find((s) => s.status === "failed")
  const failedAt = failed ? steps.indexOf(failed) + 1 : 0
  const finished = status === "done" || (total > 0 && doneCount === total)
  const runElapsed = run ? (run.end ?? now) - run.start : 0
  const fmtTotal = runElapsed >= 1000 ? fmtMs(Math.round(runElapsed / 1000) * 1000) : fmtMs(runElapsed)
  const current = Math.min(doneCount + 1, total)

  const runText = failed
    ? `Step ${failedAt} failed: ${failed.title}${failed.error ? `. ${failed.error}` : ""}`
    : finished && !draft
      ? `Plan finished in ${fmtTotal}`
      : running
        ? `Running step ${current} of ${total}: ${steps[activeIndex].title}`
        : ""

  return (
    <section className={cn("apl", className)} data-status={status} aria-busy={running || undefined}>
      <style href="agent-plan" precedence="default">
        {CSS}
      </style>

      <div className="apl-head">
        <div className="apl-meta">
          <span className="apl-state">
            <ListIcon />
            <span>
              Plan · {total} {total === 1 ? "step" : "steps"}
            </span>
          </span>
          {estimate && draft && (
            <span className="apl-est">
              <ClockIcon />
              <span>
                <span className="apl-sr">Estimated time </span>
                {estimate}
              </span>
            </span>
          )}
        </div>
        {title && <h3 className="apl-title">{title}</h3>}
      </div>

      <p id={hintId} className="apl-sr">
        Press Enter to rename, Alt plus arrow keys to move, Delete to remove.
      </p>

      <ol ref={olRef} className="apl-list" aria-label={title ? `Plan: ${title}` : "Plan"}>
        {steps.map((step, i) => {
          const st = step.status ?? "pending"
          const t = times[step.id]
          const ms = step.duration ?? (t ? (t.end ?? now) - t.start : undefined)
          const isEditing = editing?.id === step.id
          const lv = leaving[step.id]
          const stateText = { pending: "Pending", active: "Running", done: "Done", failed: "Failed" }[st]
          return (
            <li
              key={step.id}
              className="apl-step"
              data-id={step.id}
              data-step={draft ? undefined : st}
              data-dragging={dragId === step.id || undefined}
              data-leaving={lv !== undefined || undefined}
              style={lv !== undefined ? ({ "--apl-h": `${lv}px` } as React.CSSProperties) : undefined}
              tabIndex={draft && lv === undefined ? 0 : undefined}
              aria-describedby={draft ? hintId : undefined}
              aria-current={st === "active" && !draft ? "step" : undefined}
              onKeyDown={(e) => onStepKey(e, i)}
            >
              {i < total - 1 && <span className="apl-rail" aria-hidden />}
              <span
                className="apl-grip"
                aria-hidden
                title="Drag to reorder"
                onPointerDown={(e) => onGripDown(e, i)}
                onPointerMove={onGripMove}
                onPointerUp={onGripUp}
                onPointerCancel={onGripUp}
              >
                <GripIcon />
              </span>
              <span className="apl-marker" aria-hidden>
                {draft || st === "pending" ? <span>{i + 1}</span> : st === "active" ? <Spinner /> : <Mark failed={st === "failed"} />}
              </span>
              <div className="apl-main">
                {isEditing ? (
                  <input
                    className="apl-name-input"
                    aria-label={`Step ${i + 1} name`}
                    value={editing.value}
                    ref={selectOnMount}
                    autoFocus
                    onChange={(e) => setEditing({ id: step.id, value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        saveEdit()
                      } else if (e.key === "Escape") {
                        e.preventDefault()
                        e.stopPropagation()
                        cancelEdit()
                      }
                    }}
                    onBlur={saveEdit}
                  />
                ) : (
                  <span className="apl-name" onDoubleClick={() => draft && startEdit(step.id, step.title)}>
                    {step.title}
                  </span>
                )}
                {(step.detail || step.tool) && (
                  <span className="apl-sub">
                    {step.detail && <span className="apl-detail">{step.detail}</span>}
                    {step.tool && <code className="apl-tool">{step.tool}</code>}
                  </span>
                )}
                {!draft && <span className="apl-sr">{`Step ${i + 1} of ${total}, ${stateText}`}</span>}
                {st === "failed" && !draft && (
                  <>
                    {step.error && <span className="apl-error">{step.error}</span>}
                    {onRetry || simulate ? (
                      <button type="button" className="apl-retry" onClick={() => retry(step.id)}>
                        Retry from here
                      </button>
                    ) : null}
                  </>
                )}
              </div>
              <span className="apl-aside">
                {draft ? (
                  <button type="button" className="apl-remove" aria-label={`Remove step ${i + 1}: ${step.title}`} onClick={() => remove(step.id)}>
                    <CloseIcon />
                  </button>
                ) : st === "active" ? (
                  <span className="apl-time" aria-hidden>
                    {ms !== undefined ? fmtMs(ms) : ""}
                  </span>
                ) : (st === "done" || st === "failed") && ms !== undefined ? (
                  <span className="apl-time">
                    <span className="apl-sr">{st === "done" ? "took " : "failed after "}</span>
                    {fmtMs(ms)}
                  </span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="apl-tail" aria-hidden={!draft || undefined} inert={!draft || undefined}>
        <div className="apl-tail-clip">
          <label className="apl-add">
            <span className="apl-add-icon" aria-hidden>
              <PlusIcon />
            </span>
            <input
              placeholder="Add step"
              aria-label="Add a step at the end"
              enterKeyHint="done"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  add()
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="apl-foot">
        {draft ? (
          <>
            <span className="apl-hint" aria-hidden>
              Drag to reorder · double-click to rename
            </span>
            <span className="apl-actions">
              {onCancel && (
                <button type="button" className="apl-btn apl-btn--secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
              <button type="button" className="apl-btn apl-btn--primary" disabled={total === 0} onClick={startRun}>
                Run plan
                <PlayIcon />
              </button>
            </span>
          </>
        ) : finished ? (
          <>
            <span className="apl-status" data-tone="done">
              <CheckCircle />
              <span>Done in {fmtTotal}</span>
            </span>
            <span className="apl-actions">
              <button type="button" className="apl-btn apl-btn--secondary" onClick={simulate ? reset : startRun}>
                Run again
              </button>
            </span>
          </>
        ) : failed ? (
          <span className="apl-status" data-tone="failed">
            <WarnIcon />
            <span>Stopped at step {failedAt} of {total}</span>
          </span>
        ) : (
          <>
            <span className="apl-status">
              <span className="apl-status-icon" aria-hidden>
                <Spinner />
              </span>
              <span className="apl-shimmer" data-text={`Running · ${current} of ${total}`}>
                Running · {current} of {total}
              </span>
            </span>
            <span className="apl-elapsed" aria-hidden>
              {fmtMs(Math.round(runElapsed / 1000) * 1000)}
            </span>
          </>
        )}
      </div>

      <div className="apl-sr" role="status" aria-live="polite">
        {note}
      </div>
      <div className="apl-sr" role="status" aria-live="polite">
        {runText}
      </div>
    </section>
  )
}

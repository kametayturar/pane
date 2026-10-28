"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type InstrumentPricingBilling = "monthly" | "yearly"

export type InstrumentPricingPlan = {
  id: string
  name: string
  /** One sentence under the name. */
  description: string
  /** Monthly base fee in dollars on monthly billing. */
  base: number
  /** Agent runs a month included in the base fee. */
  included: number
  /** Dollars per 1,000 runs beyond `included`. `null` = hard cap at `included`. */
  overage: number | null
  /** Bullets in the sheet, each with an ink tick. */
  features: string[]
  /** Label of the button. */
  cta: string
  /** Renders the button as a link when set. */
  href?: string
  /** Marks the plan with a signal outline and a RECOMMENDED tab. Use on one plan. */
  recommended?: boolean
}

/** A cell of the comparison: `true` = tick, `false` = dash, a string is shown in mono. */
export type InstrumentPricingCell = boolean | string

export type InstrumentPricingRow = {
  label: string
  /** One cell per plan, in the order of `plans`. */
  values: InstrumentPricingCell[]
}

export type InstrumentPricingGroup = {
  title: string
  rows: InstrumentPricingRow[]
}

export type InstrumentPricingQuote = {
  /** Total for one month at this volume and billing period, in dollars. */
  price: number
  /** The part of `price` that is the base fee. */
  base: number
  /** The part of `price` that is usage beyond the included runs. */
  usage: number
  /** False when the plan cannot serve this volume (hard cap). */
  available: boolean
}

export type InstrumentPricingProps = {
  /** Mono label above the title. */
  label?: React.ReactNode
  /** Serif title. Put `<em>` around the one italic word. */
  title?: React.ReactNode
  subtitle?: React.ReactNode
  plans?: InstrumentPricingPlan[]
  /** Rows of the comparison table. Cells line up with `plans`. */
  groups?: InstrumentPricingGroup[]
  /** Positions on the ruler, ascending, in runs a month. */
  stops?: number[]
  /** Selected runs a month (controlled). Snaps to the nearest stop. */
  runs?: number
  defaultRuns?: number
  onRunsChange?: (runs: number) => void
  billing?: InstrumentPricingBilling
  defaultBilling?: InstrumentPricingBilling
  onBillingChange?: (billing: InstrumentPricingBilling) => void
  /** Share taken off base fees on yearly billing (0.2 = 20%). */
  yearlyDiscount?: number
  /** Called when a plan button without `href` is pressed. */
  onSelectPlan?: (plan: InstrumentPricingPlan, ctx: { runs: number; billing: InstrumentPricingBilling; quote: InstrumentPricingQuote }) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ipr {
  --ipr-paper: #fafafa;
  --ipr-sheet: #ffffff;
  --ipr-ink: #0a0a0a;
  --ipr-signal: #0060e2;
  --ipr-signal-soft: color-mix(in oklab, var(--ipr-signal) 12%, transparent);
  --ipr-t1: color-mix(in oklab, var(--ipr-ink) 92%, transparent);
  --ipr-t2: color-mix(in oklab, var(--ipr-ink) 64%, transparent);
  --ipr-t3: color-mix(in oklab, var(--ipr-ink) 44%, transparent);
  --ipr-t4: color-mix(in oklab, var(--ipr-ink) 22%, transparent);
  --ipr-rule: color-mix(in oklab, var(--ipr-ink) 14%, transparent);
  --ipr-rule-2: color-mix(in oklab, var(--ipr-ink) 7%, transparent);
  --ipr-ok: #1f8a4c; --ipr-warn: #b7791f; --ipr-bad: #c4321a;
  --ipr-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ipr-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ipr-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ipr-ease: cubic-bezier(.2, .8, .2, 1);
  --ipr-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --ipr-surface: var(--ipr-sheet);
  --ipr-accent: var(--ipr-signal);
  --ipr-font: var(--ipr-sans);
  position: relative;
  display: block;
  width: 100%;
  container: ipr / inline-size;
  background: var(--ipr-paper);
  font: 13px/20px var(--ipr-font);
  color: var(--ipr-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ipr {
  --ipr-paper: #0c0c0d; --ipr-sheet: #1c1c1e; --ipr-ink: #f5f5f5; --ipr-signal: #4d8dff;
}
.ipr *, .ipr *::before, .ipr *::after { box-sizing: border-box }
:where(.ipr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ipr a { color: inherit; text-decoration: none }
.ipr :focus-visible { outline: 2px solid var(--ipr-accent); outline-offset: 2px }
.ipr-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.ipr-in { max-width: 1200px; margin: 0 auto; padding: 48px 16px 56px }
@container ipr (min-width: 640px) { .ipr-in { padding: 64px 32px 72px } }

.ipr-marks { position: absolute; inset: 0; pointer-events: none }
.ipr-marks i { position: absolute; width: 8px; height: 8px; border: 0 solid var(--ipr-t4) }
.ipr-marks i:nth-child(1) { left: -10px; top: -10px; border-width: 1px 0 0 1px }
.ipr-marks i:nth-child(2) { right: -10px; top: -10px; border-width: 1px 1px 0 0 }
.ipr-marks i:nth-child(3) { left: -10px; bottom: -10px; border-width: 0 0 1px 1px }
.ipr-marks i:nth-child(4) { right: -10px; bottom: -10px; border-width: 0 1px 1px 0 }

/* ---- head ---- */
.ipr-head { display: grid; gap: 20px; padding-bottom: 32px; border-bottom: 1px solid var(--ipr-rule); animation: ipr-fade 520ms var(--ipr-ease) backwards }
@container ipr (min-width: 880px) {
  .ipr-head { grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: end }
  .ipr-head > div { grid-column: 1 / span 7 }
  .ipr-head > p { grid-column: 9 / span 4 }
}
.ipr-label { display: flex; align-items: center; gap: 12px; margin: 0 0 16px; font: 500 11px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-label::before { content: ""; width: 24px; height: 1px; background: var(--ipr-t3); transform-origin: left; animation: ipr-grow 640ms var(--ipr-ease-trace) backwards }
.ipr-title { margin: 0; font: 400 clamp(32px, 2.6cqi + 20px, 56px)/1.04 var(--ipr-serif); letter-spacing: -.01em; color: var(--ipr-ink) }
.ipr-title em { font-style: italic }
.ipr-sub { margin: 0; max-width: 420px; font: 400 15px/24px var(--ipr-sans); color: var(--ipr-t2) }

/* ---- controls ---- */
.ipr-ctl { position: relative; display: grid; margin-top: 40px; background: var(--ipr-surface); box-shadow: 0 0 0 1px var(--ipr-rule); animation: ipr-fade 560ms var(--ipr-ease) backwards; animation-delay: 120ms }
.ipr-ctl > section { padding: 20px 20px 22px; min-width: 0 }
.ipr-ctl > section + section { border-top: 1px solid var(--ipr-rule) }
@container ipr (min-width: 760px) {
  .ipr-ctl { grid-template-columns: 252px minmax(0, 1fr) }
  .ipr-ctl > section { padding: 24px 28px 26px }
  .ipr-ctl > section + section { border-top: 0; border-left: 1px solid var(--ipr-rule) }
}
.ipr-k { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-note { margin: 14px 0 0; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .04em; color: var(--ipr-t3) }
.ipr-seg { position: relative; display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; margin-top: 14px; padding: 2px; border-radius: 2px; background: var(--ipr-paper); box-shadow: 0 0 0 1px var(--ipr-rule) }
.ipr-seg[data-full] { display: grid; width: 100% }
.ipr-seg-ind { position: absolute; top: 2px; bottom: 2px; left: 2px; width: calc((100% - 4px) / var(--n)); border-radius: 1px; background: var(--ipr-ink); transform: translateX(calc(var(--i) * 100%)); transition: transform 240ms var(--ipr-ease) }
.ipr-seg button { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 14px; font: 500 13px/1 var(--ipr-sans); color: var(--ipr-t2); white-space: nowrap; transition: color 160ms var(--ipr-ease) }
.ipr-seg button[aria-checked="true"] { color: var(--ipr-paper) }
.ipr-seg button small { font: 500 10px/1 var(--ipr-mono); letter-spacing: .04em; opacity: .7 }

.ipr-out { display: flex; align-items: baseline; gap: 8px }
.ipr-out b { font: 400 34px/38px var(--ipr-mono); letter-spacing: -.03em; color: var(--ipr-ink); font-variant-numeric: tabular-nums }
.ipr-out small { font: 500 11px/16px var(--ipr-mono); letter-spacing: .08em; color: var(--ipr-t3); text-transform: uppercase }

/* ---- the ruler slider ---- */
.ipr-ruler { position: relative; margin-top: 14px; padding: 0 14px; cursor: ew-resize; touch-action: pan-y; user-select: none; -webkit-user-select: none; outline-offset: 4px }
.ipr-rl { position: relative; height: 64px }
.ipr-rl::before { content: ""; position: absolute; left: 0; right: 0; top: 22px; height: 1px; background: var(--ipr-t4) }
.ipr-tk { position: absolute; top: 22px; width: 1px; height: 6px; background: var(--ipr-t4); transition: background-color 200ms var(--ipr-ease) }
.ipr-tk[data-major] { height: 12px }
.ipr-tk[data-on] { background: var(--ipr-t2) }
.ipr-lab { position: absolute; top: 40px; transform: translateX(-50%); font: 500 10px/14px var(--ipr-mono); letter-spacing: .04em; color: var(--ipr-t3); font-variant-numeric: tabular-nums; white-space: nowrap; transition: color 200ms var(--ipr-ease) }
.ipr-lab[data-on] { color: var(--ipr-t1) }
.ipr-thumb { position: absolute; top: 2px; width: 2px; height: 34px; margin-left: -1px; background: var(--ipr-accent); transition: left 240ms var(--ipr-ease) }
.ipr-thumb::before { content: ""; position: absolute; top: -2px; left: -6px; width: 14px; height: 8px; border-radius: 1px; background: var(--ipr-accent) }
@container ipr (max-width: 560px) { .ipr-lab[data-alt] { display: none } }
.ipr-foot { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0 0; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .04em; color: var(--ipr-t3) }
.ipr-foot span:last-child { text-align: right }

/* ---- plan sheets ---- */
.ipr-plans { display: grid; gap: 40px; margin: 40px 0 0; padding: 0; list-style: none }
@container ipr (min-width: 760px) { .ipr-plans { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; padding-top: 22px; margin-top: 28px } }
.ipr-plans > li { position: relative; display: flex }
.ipr-sheet { position: relative; display: flex; flex-direction: column; width: 100%; background: var(--ipr-surface); box-shadow: 0 0 0 1px var(--ipr-rule) }
.ipr-sheet[data-rec] { box-shadow: 0 0 0 1px var(--ipr-accent) }
.ipr-tab {
  position: absolute; left: 0; bottom: 100%; z-index: 1; height: 22px; padding: 0 10px; display: flex; align-items: center;
  background: var(--ipr-surface); box-shadow: 0 0 0 1px var(--ipr-accent); clip-path: inset(-1px -1px 0 -1px);
  font: 500 10px/1 var(--ipr-mono); letter-spacing: .1em; color: var(--ipr-accent);
}
@container ipr (max-width: 759px) { .ipr-plans > li:has(.ipr-tab) { margin-top: 22px } .ipr-warn:empty { display: none } .ipr-btn { margin-top: 20px } }
.ipr-sheet-in { position: relative; display: flex; flex: 1; flex-direction: column; padding: 24px 24px 28px }
.ipr-sheet-in::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--ipr-accent); pointer-events: none; opacity: 0 }
.ipr-idx { margin: 0; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-pname { margin: 6px 0 0; font: 400 34px/36px var(--ipr-serif); letter-spacing: -.01em; color: var(--ipr-ink) }
.ipr-pdesc { margin: 8px 0 0; min-height: 40px; color: var(--ipr-t2) }
.ipr-price { display: flex; align-items: baseline; gap: 8px; margin-top: 20px }
.ipr-amt { font: 400 40px/44px var(--ipr-mono); letter-spacing: -.04em; color: var(--ipr-ink); font-variant-numeric: tabular-nums; white-space: nowrap }
.ipr-per { font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; color: var(--ipr-t3); text-transform: uppercase }
.ipr-bill { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; min-height: 22px; margin: 6px 0 0; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .04em; color: var(--ipr-t3) }
.ipr-chip { padding: 1px 6px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--ipr-t4); font: 500 9.5px/14px var(--ipr-mono); letter-spacing: .08em; color: var(--ipr-t1) }
.ipr-break { margin: 18px 0 0; border-top: 1px solid var(--ipr-rule) }
.ipr-break div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--ipr-rule-2); font: 500 11.5px/16px var(--ipr-mono) }
.ipr-break dt { margin: 0; letter-spacing: .06em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-break dd { margin: 0; color: var(--ipr-t1); font-variant-numeric: tabular-nums; text-align: right }
.ipr-break dd[data-dim] { color: var(--ipr-t3) }
.ipr-warn { margin: 10px 0 0; min-height: 16px; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .04em; color: var(--ipr-warn) }
.ipr-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 40px; margin-top: 10px; padding: 0 16px;
  border-radius: 2px; font: 500 14px/1 var(--ipr-sans); white-space: nowrap;
  transition: background-color 160ms var(--ipr-ease), box-shadow 160ms var(--ipr-ease);
}
.ipr-btn svg { transition: transform 200ms var(--ipr-ease) }
.ipr-btn:hover svg { transform: translateX(2px) }
.ipr-btn[data-variant="primary"] { background: var(--ipr-ink); color: var(--ipr-paper) }
.ipr-btn[data-variant="primary"]:hover { background: color-mix(in oklab, var(--ipr-ink) 86%, var(--ipr-paper)) }
.ipr-btn[data-variant="secondary"] { box-shadow: inset 0 0 0 1px var(--ipr-t4); color: var(--ipr-t1) }
.ipr-btn[data-variant="secondary"]:hover { background: var(--ipr-rule-2); box-shadow: inset 0 0 0 1px var(--ipr-t3) }
.ipr-incl { margin: 24px 0 0; padding-top: 18px; border-top: 1px solid var(--ipr-rule); font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-feat { display: grid; gap: 10px; margin: 14px 0 0; padding: 0; list-style: none }
.ipr-feat li { display: flex; align-items: flex-start; gap: 10px; color: var(--ipr-t1) }
.ipr-tick { flex: none; width: 12px; height: 12px; margin-top: 4px; color: var(--ipr-ink) }
.ipr-tick path { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square; stroke-linejoin: miter }
.ipr-feat .ipr-tick path { stroke-dasharray: 1 }
/* The sheet sequence plays once the sheets scroll into view: sheets 100ms apart, ticks inside, all done in about 1s. */
@media (prefers-reduced-motion: no-preference) {
  .ipr-plans:not([data-play]) .ipr-sheet-in { clip-path: inset(0 0 100% 0) }
  .ipr-plans:not([data-play]) .ipr-feat .ipr-tick path { stroke-dashoffset: 1 }
  .ipr-plans:not([data-play]) .ipr-tab { opacity: 0 }
  .ipr-plans[data-play] .ipr-sheet-in { animation: ipr-sheet 480ms var(--ipr-ease-trace) backwards; animation-delay: calc(var(--i, 0) * 100ms) }
  .ipr-plans[data-play] .ipr-sheet-in::after { animation: ipr-scan 480ms var(--ipr-ease-trace) backwards; animation-delay: calc(var(--i, 0) * 100ms) }
  .ipr-plans[data-play] .ipr-feat .ipr-tick path { animation: ipr-draw 300ms var(--ipr-ease-trace) backwards; animation-delay: calc(var(--i, 0) * 100ms + 300ms + var(--j, 0) * 40ms) }
  .ipr-plans[data-play] .ipr-tab { animation: ipr-fade 300ms var(--ipr-ease) backwards; animation-delay: 300ms }
}

/* ---- comparison ---- */
.ipr-cmp { position: relative; margin: 72px 0 0 }
.ipr-cmp-h { margin: 0 0 20px; font: 400 clamp(24px, 1.6cqi + 16px, 34px)/1.1 var(--ipr-serif); letter-spacing: -.01em; color: var(--ipr-ink) }
.ipr-cmp-h em { font-style: italic }
.ipr-twrap { position: relative; background: var(--ipr-surface); box-shadow: 0 0 0 1px var(--ipr-rule) }
.ipr-table { width: 100%; border-collapse: collapse; table-layout: fixed }
.ipr-table th, .ipr-table td { padding: 11px 20px; text-align: left; font-weight: 400; vertical-align: top }
.ipr-table thead th { padding-top: 20px; padding-bottom: 16px; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3); border-bottom: 1px solid var(--ipr-rule) }
.ipr-table thead th[data-rec] { color: var(--ipr-accent); box-shadow: inset 0 2px 0 var(--ipr-accent) }
.ipr-table thead th:first-child, .ipr-table tbody th[scope="row"] { width: 34% }
.ipr-table tbody th[scope="row"] { color: var(--ipr-t1); font: 400 13px/20px var(--ipr-sans) }
.ipr-table tbody tr + tr th, .ipr-table tbody tr + tr td { border-top: 1px solid var(--ipr-rule-2) }
.ipr-table tbody tr.ipr-g th { padding-top: 28px; padding-bottom: 8px; border-top: 1px solid var(--ipr-rule); font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-table tbody tr.ipr-g:first-child th { border-top: 0; padding-top: 20px }
.ipr-table td { font: 500 12px/20px var(--ipr-mono); color: var(--ipr-t1); font-variant-numeric: tabular-nums }
.ipr-no { color: var(--ipr-t4) }
.ipr-plist { display: none }
@container ipr (max-width: 719px) {
  .ipr-twrap { display: none }
  .ipr-plist { display: block; position: relative; padding: 20px 20px 8px; background: var(--ipr-surface); box-shadow: 0 0 0 1px var(--ipr-rule) }
  .ipr-plist .ipr-seg { margin-top: 0 }
}
.ipr-pl-g { margin: 22px 0 4px; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-plist dl { margin: 0 }
.ipr-plist dl > div { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-top: 1px solid var(--ipr-rule-2) }
.ipr-plist dt { margin: 0; color: var(--ipr-t1); min-width: 0 }
.ipr-plist dd { margin: 0; flex: none; text-align: right; font: 500 12px/20px var(--ipr-mono); color: var(--ipr-t1); font-variant-numeric: tabular-nums }
.ipr-cap { margin: 16px 0 0; font: 500 10.5px/16px var(--ipr-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipr-t3) }
.ipr-cap b { font-weight: 500; color: var(--ipr-t1) }

@keyframes ipr-fade { from { opacity: 0 } }
@keyframes ipr-grow { from { transform: scaleX(0) } }
@keyframes ipr-draw { from { stroke-dashoffset: 1 } }
@keyframes ipr-sheet { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0) } }
@keyframes ipr-scan { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: 100%; opacity: 0 } }

@media (prefers-reduced-motion: reduce) {
  .ipr *, .ipr *::before, .ipr *::after { animation: none !important; transition: none !important }
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

function useSeen(ref: React.RefObject<Element | null>, threshold = 0) {
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
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  return seen
}

/** Counts to the target, then makes one tiny overshoot-and-return (about 1%). */
const settleCurve = (t: number) => 1 - Math.pow(1 - t, 3) + 0.045 * Math.sin(Math.PI * t) * t

function useSettle(target: number, active: boolean, duration = 700) {
  const reduced = useReducedMotion()
  const [shown, setShown] = React.useState(0)
  const cur = React.useRef(0)
  React.useEffect(() => {
    if (reduced || !active) return
    const from = cur.current
    let raf = 0
    let t0 = 0
    const done = () => {
      cur.current = target
      setShown(target)
    }
    const step = (ts: number) => {
      if (!t0) t0 = ts
      const t = Math.min(1, (ts - t0) / duration)
      if (t >= 1) return done()
      const v = from + (target - from) * settleCurve(t)
      cur.current = v
      setShown(v)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // If frames never arrive (throttled or captured page), still land on the real number.
    const fallback = window.setTimeout(done, duration + 300)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [target, active, reduced, duration])
  return reduced ? target : shown
}

const fmt = (v: number, d = 0) => v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
const money = (v: number, d: number) => `$${fmt(v, d)}`
const cents = (v: number) => Math.round(v * 100) / 100
const decimalsOf = (v: number) => (Number.isInteger(cents(v)) ? 0 : 2)
const short = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n))

/** What a plan costs a month at this volume. Pure, so you can reuse it for your own totals. */
export function quotePlan(plan: InstrumentPricingPlan, runs: number, billing: InstrumentPricingBilling, yearlyDiscount = 0.2): InstrumentPricingQuote {
  const base = cents(plan.base * (billing === "yearly" ? 1 - yearlyDiscount : 1))
  const over = Math.max(0, runs - plan.included)
  if (plan.overage === null) return { price: base, base, usage: 0, available: over === 0 }
  const usage = cents((over / 1000) * plan.overage)
  return { price: cents(base + usage), base, usage, available: true }
}

function Marks() {
  return (
    <span className="ipr-marks" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function Tick({ j }: { j?: number }) {
  return (
    <svg className="ipr-tick" viewBox="0 0 12 12" aria-hidden style={j === undefined ? undefined : ({ "--j": j } as React.CSSProperties)}>
      <path d="M2 6.5 4.8 9 10 3.4" pathLength={1} />
    </svg>
  )
}

function Num({ value, decimals = 0, prefix = "", active }: { value: number; decimals?: number; prefix?: string; active: boolean }) {
  const v = useSettle(value, active)
  return <>{`${prefix}${fmt(v, decimals)}`}</>
}

/* -------------------------------------------------------------------------- */
/*                              Segmented switch                              */
/* -------------------------------------------------------------------------- */

type SegOption<T extends string> = { value: T; label: React.ReactNode }

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  full,
}: {
  value: T
  onChange: (v: T) => void
  options: SegOption<T>[]
  label: string
  full?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (idx + step + options.length) % options.length
    onChange(options[next].value)
    ref.current?.querySelectorAll<HTMLElement>("button")[next]?.focus()
  }
  return (
    <div
      ref={ref}
      className="ipr-seg"
      role="radiogroup"
      aria-label={label}
      data-full={full ? "" : undefined}
      style={{ "--n": options.length, "--i": idx } as React.CSSProperties}
      onKeyDown={onKeyDown}
    >
      <span className="ipr-seg-ind" aria-hidden />
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Ruler slider                                 */
/* -------------------------------------------------------------------------- */

const MINOR = 5 // ticks per stop interval

function RunsRuler({ stops, index, onIndex, label }: { stops: number[]; index: number; onIndex: (i: number) => void; label: string }) {
  const inner = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef(false)
  const n = stops.length
  const at = (clientX: number) => {
    const r = inner.current?.getBoundingClientRect()
    if (!r || r.width === 0) return
    onIndex(Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * (n - 1)))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const d =
      e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 3 : e.key === "PageDown" ? -3 : 0
    if (d) onIndex(Math.min(n - 1, Math.max(0, index + d)))
    else if (e.key === "Home") onIndex(0)
    else if (e.key === "End") onIndex(n - 1)
    else return
    e.preventDefault()
  }
  const ticks: React.ReactNode[] = []
  for (let k = 0; k <= (n - 1) * MINOR; k++) {
    ticks.push(
      <i
        key={k}
        className="ipr-tk"
        data-major={k % MINOR === 0 ? "" : undefined}
        data-on={k <= index * MINOR ? "" : undefined}
        style={{ left: `${(k / ((n - 1) * MINOR)) * 100}%` }}
      />,
    )
  }
  return (
    <div
      className="ipr-ruler"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={n - 1}
      aria-valuenow={index}
      aria-valuetext={`${fmt(stops[index])} agent runs per month`}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        drag.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.focus({ preventScroll: true })
        at(e.clientX)
      }}
      onPointerMove={(e) => drag.current && at(e.clientX)}
      onPointerUp={(e) => {
        drag.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
      onPointerCancel={() => (drag.current = false)}
    >
      <div className="ipr-rl" ref={inner}>
        {ticks}
        {stops.map((s, i) => (
          <span
            key={s}
            className="ipr-lab"
            data-on={i <= index ? "" : undefined}
            data-alt={i % 2 === 1 && i !== n - 1 ? "" : undefined}
            style={{ left: `${(i / (n - 1)) * 100}%` }}
          >
            {short(s)}
          </span>
        ))}
        <span className="ipr-thumb" style={{ left: `${(index / (n - 1)) * 100}%` }} aria-hidden />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Default content                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_PLANS: InstrumentPricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For a first agent and a weekend of tracing.",
    base: 0,
    included: 1000,
    overage: null,
    cta: "Start free",
    features: ["1,000 agent runs a month", "Full trace viewer", "3 days of trace retention", "2 seats, 1 project", "Community support"],
  },
  {
    id: "team",
    name: "Team",
    description: "For product teams running agents in production.",
    base: 49,
    included: 10_000,
    overage: 2.5,
    cta: "Start 14-day trial",
    recommended: true,
    features: [
      "10,000 runs included, then $2.50 per 1k",
      "Eval suites and drift alerts",
      "Replay and diff any run",
      "PII redaction before storage",
      "30 days of trace retention",
      "10 seats, 10 projects",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    description: "For fleets of agents with audit and uptime duties.",
    base: 299,
    included: 100_000,
    overage: 1.2,
    cta: "Talk to sales",
    features: [
      "100,000 runs included, then $1.20 per 1k",
      "Everything in Team",
      "SSO and exportable audit log",
      "1 year of trace retention",
      "Unlimited seats and projects",
      "99.95% uptime SLA",
    ],
  },
]

const DEFAULT_GROUPS: InstrumentPricingGroup[] = [
  {
    title: "Usage",
    rows: [
      { label: "Agent runs included", values: ["1,000", "10,000", "100,000"] },
      { label: "Per 1,000 runs beyond", values: ["Hard cap", "$2.50", "$1.20"] },
      { label: "Projects", values: ["1", "10", "Unlimited"] },
      { label: "Seats", values: ["2", "10", "Unlimited"] },
    ],
  },
  {
    title: "Observability",
    rows: [
      { label: "Trace viewer", values: [true, true, true] },
      { label: "Trace retention", values: ["3 days", "30 days", "1 year"] },
      { label: "Eval suites", values: [false, "5 suites", "Unlimited"] },
      { label: "Replay and diff", values: [false, true, true] },
      { label: "Drift alerts", values: [false, true, true] },
    ],
  },
  {
    title: "Security",
    rows: [
      { label: "PII redaction", values: [false, true, true] },
      { label: "SSO / SAML", values: [false, false, true] },
      { label: "Audit log export", values: [false, false, true] },
      { label: "Data residency", values: [false, false, "EU or US"] },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Channel", values: ["Community", "Email", "Shared Slack"] },
      { label: "First response", values: ["Best effort", "1 business day", "1 hour"] },
      { label: "Uptime SLA", values: [false, false, "99.95%"] },
    ],
  },
]

const DEFAULT_STOPS = [1000, 2500, 5000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000]

function Cell({ v }: { v: InstrumentPricingCell }) {
  if (v === true)
    return (
      <>
        <Tick />
        <span className="ipr-sr">Included</span>
      </>
    )
  if (v === false)
    return (
      <>
        <span className="ipr-no" aria-hidden>
          –
        </span>
        <span className="ipr-sr">Not included</span>
      </>
    )
  return <>{v}</>
}

/* -------------------------------------------------------------------------- */
/*                                   Pricing                                  */
/* -------------------------------------------------------------------------- */

/** Pricing section in the Instrument style: ruler slider for usage, three sheets that recalculate live, and a comparison table. */
export function InstrumentPricing({
  label = "PRICING · METERED PER AGENT RUN",
  title = (
    <>
      Pay for the <em>runs</em> you trace.
    </>
  ),
  subtitle = "Every plan includes the full trace viewer. You meter what your agents actually do: no seats to count, no overage surprises.",
  plans = DEFAULT_PLANS,
  groups = DEFAULT_GROUPS,
  stops = DEFAULT_STOPS,
  runs: runsProp,
  defaultRuns = 25_000,
  onRunsChange,
  billing: billingProp,
  defaultBilling = "monthly",
  onBillingChange,
  yearlyDiscount = 0.2,
  onSelectPlan,
  className,
}: InstrumentPricingProps) {
  const rootRef = React.useRef<HTMLElement>(null)
  const seen = useSeen(rootRef)
  const plansRef = React.useRef<HTMLUListElement>(null)
  const play = useSeen(plansRef, 0.12)

  const nearest = React.useCallback(
    (r: number) => stops.reduce((best, s, i) => (Math.abs(s - r) < Math.abs(stops[best] - r) ? i : best), 0),
    [stops],
  )
  const [runsState, setRunsState] = React.useState(() => defaultRuns)
  const [billingState, setBillingState] = React.useState<InstrumentPricingBilling>(defaultBilling)
  const index = nearest(runsProp ?? runsState)
  const runs = stops[index]
  const billing = billingProp ?? billingState
  const recId = plans.find((p) => p.recommended)?.id
  const [mobilePlan, setMobilePlan] = React.useState<string | undefined>(undefined)
  const activePlanId = mobilePlan ?? recId ?? plans[0]?.id

  const setIndex = (i: number) => {
    if (i === index) return
    setRunsState(stops[i])
    onRunsChange?.(stops[i])
  }
  const setBilling = (b: InstrumentPricingBilling) => {
    setBillingState(b)
    onBillingChange?.(b)
  }

  const quotes = plans.map((p) => quotePlan(p, runs, billing, yearlyDiscount))
  const lowest = quotes.reduce((best, q, i) => (q.available && (best < 0 || q.price < quotes[best].price) ? i : best), -1)
  const rec = plans.findIndex((p) => p.recommended)
  const perDay = Math.round(runs / 30)
  const pct = Math.round(yearlyDiscount * 100)

  const activeIdx = Math.max(0, plans.findIndex((p) => p.id === activePlanId))

  return (
    <section className={cn("ipr", className)} ref={rootRef} aria-label="Pricing">
      <style href="instrument-pricing" precedence="default">
        {CSS}
      </style>
      <div className="ipr-in">
        <header className="ipr-head">
          <div>
            <p className="ipr-label">{label}</p>
            <h2 className="ipr-title">{title}</h2>
          </div>
          <p className="ipr-sub">{subtitle}</p>
        </header>

        <div className="ipr-ctl">
          <Marks />
          <section>
            <p className="ipr-k">Billing</p>
            <Segmented
              label="Billing period"
              value={billing}
              onChange={setBilling}
              full
              options={[
                { value: "monthly", label: "Monthly" },
                {
                  value: "yearly",
                  label: (
                    <>
                      Yearly <small>−{pct}%</small>
                    </>
                  ),
                },
              ]}
            />
            <p className="ipr-note">{billing === "yearly" ? `${pct}% off base fees, billed once a year` : `Switch to yearly and save ${pct}% on base fees`}</p>
          </section>
          <section>
            <p className="ipr-k">
              <span id="ipr-runs-label">Agent runs / month</span>
              <span className="ipr-out">
                <b>
                  <Num value={runs} active={seen} />
                </b>
                <small>runs</small>
              </span>
            </p>
            <RunsRuler stops={stops} index={index} onIndex={setIndex} label="Agent runs per month" />
            <p className="ipr-foot">
              <span>≈ {fmt(perDay)} runs a day</span>
              <span>Drag the ruler or use the arrow keys</span>
            </p>
          </section>
        </div>
        <p className="ipr-sr" aria-live="polite">
          {rec >= 0 ? `At ${fmt(runs)} runs a month, ${plans[rec].name} costs ${money(quotes[rec].price, decimalsOf(quotes[rec].price))} a month.` : ""}
        </p>

        <ul className="ipr-plans" ref={plansRef} data-play={play ? "" : undefined}>
          {plans.map((p, i) => {
            const q = quotes[i]
            const over = Math.max(0, runs - p.included)
            const perK = runs > 0 ? q.price / (runs / 1000) : 0
            const variant = p.recommended ? "primary" : "secondary"
            const btn = (
              <>
                {p.cta}
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
              </>
            )
            return (
              <li key={p.id}>
                <article className="ipr-sheet" data-rec={p.recommended ? "" : undefined} aria-label={`${p.name} plan`}>
                  <Marks />
                  {p.recommended && <span className="ipr-tab">RECOMMENDED</span>}
                  <div className="ipr-sheet-in" style={{ "--i": i } as React.CSSProperties}>
                    <p className="ipr-idx">Plan {String(i + 1).padStart(2, "0")}</p>
                    <h3 className="ipr-pname">{p.name}</h3>
                    <p className="ipr-pdesc">{p.description}</p>
                    <div className="ipr-price">
                      <span className="ipr-amt">
                        <Num value={q.price} decimals={decimalsOf(q.price)} prefix="$" active={seen} />
                      </span>
                      <span className="ipr-per">/ month</span>
                    </div>
                    <p className="ipr-bill">
                      <span>
                        {p.base === 0
                          ? "No card required"
                          : billing === "yearly"
                            ? `Billed yearly · ${money(cents(q.price * 12), decimalsOf(q.price * 12))} a year`
                            : "Billed monthly"}
                      </span>
                      {i === lowest && quotes.length > 1 && <span className="ipr-chip">LOWEST COST</span>}
                    </p>
                    <dl className="ipr-break">
                      <div>
                        <dt>Base</dt>
                        <dd>{money(q.base, decimalsOf(q.base))}</dd>
                      </div>
                      <div>
                        <dt>{over > 0 && p.overage !== null ? `+${short(over)} runs` : "Runs"}</dt>
                        <dd data-dim={over === 0 || p.overage === null ? "" : undefined}>
                          {p.overage === null ? (over > 0 ? "Capped" : "Included") : over === 0 ? "Included" : money(q.usage, 2)}
                        </dd>
                      </div>
                      <div>
                        <dt>Per 1k runs</dt>
                        <dd data-dim={!q.available ? "" : undefined}>
                          {q.available ? <Num value={perK} decimals={2} prefix="$" active={seen} /> : "–"}
                        </dd>
                      </div>
                    </dl>
                    <p className="ipr-warn" role="status">
                      {!q.available ? `Caps at ${fmt(p.included)} runs. ${fmt(over)} over.` : ""}
                    </p>
                    {p.href ? (
                      <a className="ipr-btn" data-variant={variant} href={p.href}>
                        {btn}
                      </a>
                    ) : (
                      <button type="button" className="ipr-btn" data-variant={variant} onClick={() => onSelectPlan?.(p, { runs, billing, quote: q })}>
                        {btn}
                      </button>
                    )}
                    <p className="ipr-incl">Includes</p>
                    <ul className="ipr-feat">
                      {p.features.map((f, j) => (
                        <li key={f}>
                          <Tick j={j} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        <figure className="ipr-cmp">
          <h3 className="ipr-cmp-h">
            Compare the <em>plans</em>
          </h3>
          <div className="ipr-twrap">
            <Marks />
            <table className="ipr-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} scope="col" data-rec={p.recommended ? "" : undefined}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <React.Fragment key={g.title}>
                    <tr className="ipr-g">
                      <th scope="colgroup" colSpan={plans.length + 1}>
                        {g.title}
                      </th>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.label}>
                        <th scope="row">{r.label}</th>
                        {plans.map((p, i) => (
                          <td key={p.id}>
                            <Cell v={r.values[i] ?? false} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ipr-plist">
            <Marks />
            <Segmented
              label="Plan to inspect"
              value={plans[activeIdx]?.id ?? ""}
              onChange={setMobilePlan}
              full
              options={plans.map((p) => ({ value: p.id, label: p.name }))}
            />
            {groups.map((g) => (
              <div key={g.title}>
                <p className="ipr-pl-g">{g.title}</p>
                <dl>
                  {g.rows.map((r) => (
                    <div key={r.label}>
                      <dt>{r.label}</dt>
                      <dd>
                        <Cell v={r.values[activeIdx] ?? false} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <figcaption className="ipr-cap">
            <b>FIG. 2</b> — What each plan includes
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

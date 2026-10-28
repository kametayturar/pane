"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UsageUnit = {
  /** Divide a raw reading by this before showing it (1e6 shows 32 300 000 as 32.3). */
  scale: number
  /** Written after the number, for example "M" or " GB". */
  suffix: string
  /** Decimals for the headline numbers. Axis labels use none. Defaults to 1. */
  decimals?: number
}

export type UsageMetric = {
  id: string
  /** Tab label, for example "API calls". */
  label: string
  /** Plural noun used in sentences, for example "calls". Defaults to the lower-cased label. */
  noun?: string
  /** Cumulative usage at the end of each day since the period started, for the days measured so far. */
  readings: number[]
  /** Days in the billing period. Defaults to 30. */
  days?: number
  /** The budget line, in raw units. */
  budget: number
  /** Lowest and highest budget the handle can take. Default: one axis step and the top of the axis. */
  budgetMin?: number
  budgetMax?: number
  /** How far one arrow key moves the budget. Defaults to a tenth of an axis step. */
  budgetStep?: number
  unit: UsageUnit
  /** What going over costs: `rate` dollars for every `per` units above the budget. `text` is the small note under the number. */
  overage?: { per: number; rate: number; text: string }
}

export type UsageForecastProps = {
  /** One tab per metric. Leave it out for three sample metrics. */
  metrics?: UsageMetric[]
  /** First day of the billing period, as YYYY-MM-DD. Defaults to 2026-09-01. */
  startDate?: string
  /** Heading of the card. */
  title?: string
  /** Line under the heading. Defaults to a sample plan line. */
  subtitle?: string
  /** Fractions of the budget that can raise an alert. Defaults to 50 %, 80 % and 100 %. */
  thresholds?: number[]
  /** Called while the budget moves (raw value while dragging, snapped value on release or key press). */
  onBudgetChange?: (metricId: string, budget: number) => void
  /** Called when an alert rule is switched on or off. */
  onAlertChange?: (metricId: string, threshold: number, enabled: boolean) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

function cumulative(incs: number[]) {
  let sum = 0
  return incs.map((n) => (sum += n))
}

/** Generates daily readings from weekday and weekend rates with a little deterministic wobble. */
function generate(start: string, days: number, weekday: number, weekend: number, seed: number) {
  const t0 = Date.parse(`${start}T00:00:00Z`)
  const incs: number[] = []
  for (let i = 0; i < days; i++) {
    const dow = new Date(t0 + i * 864e5).getUTCDay()
    const base = dow === 0 || dow === 6 ? weekend : weekday
    const wobble = (((i * 37 + seed * 11) % 23) - 11) / 100
    incs.push(Math.round(base * (1 + wobble)))
  }
  return cumulative(incs)
}

const START = "2026-09-01"

const API_INCS = [1.6, 1.8, 1.5, 1.7, 0.8, 0.6, 1.7, 1.6, 1.8, 1.5, 1.7, 0.7, 0.9, 1.7, 1.8, 1.6, 1.7, 1.8, 0.8, 0.7, 1.8, 1.7]

const DEFAULT_METRICS: UsageMetric[] = [
  {
    id: "api",
    label: "API calls",
    noun: "calls",
    readings: cumulative(API_INCS).map((n) => Math.round(n * 1e5) * 10),
    budget: 36e6,
    budgetStep: 1e6,
    unit: { scale: 1e6, suffix: "M" },
    overage: { per: 1000, rate: 0.2, text: "At $0.20 per 1k calls" },
  },
  {
    id: "storage",
    label: "Storage",
    noun: "GB written",
    readings: generate(START, 22, 38, 14, 3),
    budget: 900,
    budgetStep: 25,
    unit: { scale: 1, suffix: " GB", decimals: 0 },
    overage: { per: 1, rate: 0.08, text: "At $0.08 per extra GB" },
  },
  {
    id: "runs",
    label: "Agent hours",
    noun: "agent hours",
    readings: generate(START, 22, 150, 45, 5),
    budget: 4200,
    budgetStep: 100,
    unit: { scale: 1, suffix: " h", decimals: 0 },
    overage: { per: 1, rate: 1.4, text: "At $1.40 per extra hour" },
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ufc {
  --ufc-ink: #000;
  --ufc-surface: #fff;
  --ufc-accent: #0060e2;
  --ufc-over: #cb3a2e;
  --ufc-t1: color-mix(in oklab, var(--ufc-ink) 88%, transparent);
  --ufc-t2: color-mix(in oklab, var(--ufc-ink) 61%, transparent);
  --ufc-t3: color-mix(in oklab, var(--ufc-ink) 45%, transparent);
  --ufc-t4: color-mix(in oklab, var(--ufc-ink) 27%, transparent);
  --ufc-fill: color-mix(in oklab, var(--ufc-ink) 4.5%, transparent);
  --ufc-line: color-mix(in oklab, var(--ufc-ink) 7%, transparent);
  --ufc-grid: color-mix(in oklab, var(--ufc-ink) 7%, transparent);
  --ufc-series: color-mix(in oklab, var(--ufc-ink) 80%, transparent);
  --ufc-ring: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ufc-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px rgb(0 0 0 / .12), 0 2px 6px rgb(0 0 0 / .06);
  --ufc-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  margin-inline: auto;
  container-type: inline-size;
  background: var(--ufc-surface);
  color: var(--ufc-t1);
  border: 1px solid color-mix(in oklab, var(--ufc-ink) 7.5%, transparent);
  border-radius: 16px;
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: var(--ufc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .ufc {
  --ufc-ink: #fff;
  --ufc-surface: #1c1c1e;
  --ufc-accent: #4d8dff;
  --ufc-over: #ff6f61;
  --ufc-t1: color-mix(in oklab, var(--ufc-ink) 90%, transparent);
  --ufc-t2: color-mix(in oklab, var(--ufc-ink) 62%, transparent);
  --ufc-t3: color-mix(in oklab, var(--ufc-ink) 46%, transparent);
  --ufc-t4: color-mix(in oklab, var(--ufc-ink) 28%, transparent);
  --ufc-fill: color-mix(in oklab, var(--ufc-ink) 6.5%, transparent);
  --ufc-line: color-mix(in oklab, var(--ufc-ink) 9%, transparent);
  --ufc-grid: color-mix(in oklab, var(--ufc-ink) 9%, transparent);
  --ufc-series: color-mix(in oklab, var(--ufc-ink) 86%, transparent);
  --ufc-ring: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ufc-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px rgb(0 0 0 / .5);
}
.ufc *, .ufc *::before, .ufc *::after { box-sizing: border-box }
:where(.ufc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.ufc) :is(h2, p, dl, dd, dt, ul) { margin: 0; padding: 0 }
:where(.ufc) ul { list-style: none }
.ufc :focus-visible { outline: 2px solid color-mix(in oklab, var(--ufc-accent) 60%, transparent); outline-offset: 1px }
.ufc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.ufc-num { font-variant-numeric: tabular-nums }

/* ---- header ---- */
.ufc-header { display: flex; align-items: center; justify-content: space-between; gap: 12px 24px; flex-wrap: wrap }
.ufc-heading { min-width: 0 }
.ufc-title { font-size: 16px; line-height: 17.6px; font-weight: 500 }
.ufc-sub { color: var(--ufc-t3); margin-top: 3px }
.ufc-tabs { position: relative; display: inline-flex; padding: 3px; gap: 2px; border-radius: 18px; background: var(--ufc-fill) }
.ufc-thumb { position: absolute; top: 3px; bottom: 3px; left: 0; width: 0; border-radius: 14px; background: var(--ufc-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transition: transform .38s var(--ufc-ease), width .38s var(--ufc-ease); pointer-events: none }
:is(.dark, [data-theme="dark"]) .ufc-thumb { background: color-mix(in oklab, var(--ufc-surface) 78%, #fff) }
.ufc-tab { position: relative; height: 36px; padding: 0 12px; border-radius: 14px; font-weight: 500; color: var(--ufc-t3); white-space: nowrap; transition: color .2s var(--ufc-ease) }
.ufc-tab[aria-selected="true"] { color: var(--ufc-t1) }

/* ---- story ---- */
.ufc-story { display: flex; flex-direction: column; gap: 4px; min-height: 49px }
.ufc-headline { font-size: 19.9px; line-height: 25.85px; font-weight: 500; letter-spacing: -.012em; text-wrap: balance }
.ufc-detail { color: var(--ufc-t2) }
.ufc-word { display: inline-block; white-space: pre; animation: ufc-word .5s var(--ufc-ease) calc(var(--i) * 20ms) backwards }
@keyframes ufc-word { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }

/* ---- KPIs ---- */
.ufc-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) }
.ufc-kpi { display: flex; flex-direction: column; gap: 2px; padding: 0 20px; min-width: 0 }
.ufc-kpi:first-child { padding-left: 0 }
.ufc-kpi + .ufc-kpi { border-left: 1px solid var(--ufc-line) }
.ufc-kpi dt { color: var(--ufc-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ufc-val { font-size: 22px; line-height: 28.6px; font-weight: 500; letter-spacing: -.01em; display: flex; align-items: baseline }
.ufc-val small { font-size: 16px; line-height: 20.8px; font-weight: 500; color: var(--ufc-t2); margin-left: 1px; letter-spacing: 0 }
.ufc-val[data-over] { color: var(--ufc-over) }
.ufc-foot { font-size: 12px; line-height: 16.8px; color: var(--ufc-t3) }

/* ---- chart ---- */
.ufc-chart { position: relative; height: 264px; margin: 0 -4px; animation: ufc-fade .4s var(--ufc-ease) backwards }
@keyframes ufc-fade { from { opacity: 0 } to { opacity: 1 } }
.ufc-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.ufc-grid { stroke: var(--ufc-grid); stroke-width: 1 }
.ufc-baseline { stroke: var(--ufc-t4); stroke-width: 1 }
.ufc-axis { font-size: 12px; fill: var(--ufc-t3); font-variant-numeric: tabular-nums }
.ufc-today { stroke: var(--ufc-t4); stroke-width: 1 }
.ufc-todaylabel { font-size: 12px; font-weight: 500; fill: var(--ufc-t2) }
.ufc-future { fill: color-mix(in oklab, var(--ufc-ink) 3%, transparent) }
.ufc-band { fill: var(--ufc-series); opacity: .1 }
.ufc-bandover { fill: var(--ufc-over); opacity: .16 }
.ufc-fc { fill: none; stroke: var(--ufc-series); stroke-width: 1.75; stroke-dasharray: 4 4 }
.ufc-fcover { fill: none; stroke: var(--ufc-over); stroke-width: 1.75; stroke-dasharray: 4 4 }
.ufc-actual { fill: none; stroke: var(--ufc-series); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round }
.ufc-actualover { fill: none; stroke: var(--ufc-over); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round }
.ufc-budgetline { stroke: var(--ufc-t1); stroke-width: 1 }
.ufc-tick { stroke: var(--ufc-t1); stroke-width: 1.5; stroke-linecap: round }
.ufc-ticklabel { font-size: 12px; font-weight: 500; fill: var(--ufc-t2); stroke: var(--ufc-surface); stroke-width: 3px; paint-order: stroke; stroke-linejoin: round }
.ufc-drop { stroke: var(--ufc-over); stroke-width: 1; stroke-dasharray: 2 3; fill: none }
.ufc-marker { fill: var(--ufc-surface); stroke: var(--ufc-over); stroke-width: 2 }
.ufc-nowdot { fill: var(--ufc-series); stroke: var(--ufc-surface); stroke-width: 2 }
.ufc-hoverline { stroke: var(--ufc-t4); stroke-width: 1 }
.ufc-hoverdot { fill: var(--ufc-series); stroke: var(--ufc-surface); stroke-width: 2 }
.ufc-ylabels { position: absolute; left: 0; top: 0; bottom: 0; width: 46px; pointer-events: none }
.ufc-ylabel { position: absolute; right: 8px; font-size: 12px; line-height: 12px; color: var(--ufc-t3); transform: translateY(-50%); font-variant-numeric: tabular-nums; white-space: nowrap }
.ufc-hit { position: absolute; cursor: crosshair; touch-action: pan-y; border-radius: 4px }
.ufc-zone { position: absolute; display: flex; align-items: center; touch-action: none; cursor: ns-resize; z-index: 2 }
.ufc-handle {
  display: inline-flex; align-items: center; gap: 6px; height: 26px; margin-left: 8px; padding: 0 10px 0 7px; border-radius: 9999px;
  background: var(--ufc-surface); box-shadow: var(--ufc-ring); font-size: 12px; line-height: 16.8px; white-space: nowrap; touch-action: none;
  transition: box-shadow .2s var(--ufc-ease);
}
.ufc-handle[data-drag] { box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--ufc-accent) 55%, transparent), var(--ufc-ring) }
.ufc-handle svg { color: var(--ufc-t3) }
.ufc-handle em { font-style: normal; color: var(--ufc-t2) }
.ufc-handle b { font-weight: 500 }
.ufc-when { position: absolute; z-index: 1; display: flex; justify-content: center; width: 0; pointer-events: none }
.ufc-whenpill { height: 20px; padding: 0 8px; border-radius: 9999px; background: var(--ufc-surface); box-shadow: var(--ufc-ring); color: var(--ufc-over); font-size: 12px; line-height: 20px; font-weight: 500; white-space: nowrap; flex: none }
.ufc-tip { position: absolute; z-index: 3; width: max-content; min-width: 104px; padding: 8px 10px; border-radius: 12px; background: var(--ufc-surface); box-shadow: var(--ufc-pop); pointer-events: none; transition: transform .18s var(--ufc-ease), opacity .15s var(--ufc-ease); animation: ufc-fade .15s ease-out backwards }
.ufc-tiphead { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; line-height: 16.8px; color: var(--ufc-t2) }
.ufc-tiphead span:last-child { color: var(--ufc-t3) }
.ufc-tipval { font-size: 16px; line-height: 22px; font-weight: 500; font-variant-numeric: tabular-nums }
.ufc-tipfoot { font-size: 12px; line-height: 16.8px; color: var(--ufc-t3) }
.ufc-tip[data-over] .ufc-tipfoot { color: var(--ufc-over) }

/* ---- footer ---- */
.ufc-footer { display: flex; flex-direction: column; gap: 12px; padding-top: 12px; border-top: 1px solid color-mix(in oklab, var(--ufc-ink) 5.5%, transparent) }
.ufc-rules { display: flex; flex-wrap: wrap; align-items: center; gap: 8px }
.ufc-ruleslabel { color: var(--ufc-t2); margin-right: 2px }
.ufc-rule { display: inline-flex; align-items: center; gap: 0; height: 32px; padding: 0 12px 0 10px; border-radius: 9999px; color: var(--ufc-t2); box-shadow: inset 0 0 0 1px var(--ufc-line); transition: background-color .2s var(--ufc-ease), color .2s var(--ufc-ease), box-shadow .2s var(--ufc-ease) }
.ufc-rule[aria-pressed="true"] { background: var(--ufc-fill); color: var(--ufc-t1); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ufc-ink) 16%, transparent) }
@media (hover: hover) { .ufc-rule:hover { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ufc-ink) 20%, transparent) } }
.ufc-check { display: inline-flex; width: 0; overflow: hidden; transition: width .25s var(--ufc-ease), margin .25s var(--ufc-ease); color: var(--ufc-t1) }
.ufc-check svg { flex: none }
.ufc-rule[aria-pressed="true"] .ufc-check { width: 14px; margin-right: 6px }
.ufc-rulepct { font-weight: 500; margin-right: 8px }
.ufc-rulewhen { color: var(--ufc-t3); animation: ufc-word .4s var(--ufc-ease) backwards }
.ufc-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; line-height: 16.8px; color: var(--ufc-t3) }
.ufc-legend li { display: inline-flex; align-items: center; gap: 6px }
.ufc-hint { font-size: 12px; line-height: 16.8px; color: var(--ufc-t3) }

/* ---- narrow ---- */
@container (max-width: 560px) {
  .ufc { padding: 14px 16px 18px; gap: 16px }
  .ufc-kpi { padding: 0 12px }
  .ufc-val { font-size: 19px; line-height: 24px }
  .ufc-val small { font-size: 14px }
  .ufc-headline { font-size: 18px; line-height: 24px }
  .ufc-legend { gap: 4px 12px }
}
@container (max-width: 440px) {
  .ufc-kpis { grid-template-columns: 1fr 1fr }
  .ufc-kpi:nth-child(3) { grid-column: 1 / -1; border-left: 0; padding: 10px 0 0 0; margin-top: 10px; border-top: 1px solid var(--ufc-line) }
  .ufc-kpi:nth-child(2) { padding-right: 0 }
  .ufc-tabs { width: 100% }
  .ufc-tab { flex: 1; padding: 0 6px }
}

@media (prefers-reduced-motion: reduce) {
  .ufc *, .ufc *::before, .ufc *::after { animation: none !important; transition: none !important }
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
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches
const getReducedServer = () => false

/** A number that eases to its value and writes its text straight to the DOM (no React render per frame). */
function CountTo({ value, format }: { value: number; format: (n: number) => string }) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const ref = React.useRef<HTMLSpanElement>(null)
  const cur = React.useRef(value)
  const fmt = React.useRef(format)
  React.useEffect(() => {
    fmt.current = format
  })
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = fmt.current(cur.current)
  }, [])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      cur.current = value
      el.textContent = fmt.current(value)
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const diff = value - cur.current
      if (Math.abs(diff) < 0.0008 * Math.max(1, Math.abs(value))) {
        cur.current = value
        el.textContent = fmt.current(value)
        return
      }
      cur.current += diff * (1 - Math.exp(-dt / 100))
      el.textContent = fmt.current(cur.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return (
    <>
      <span ref={ref} className="ufc-num" aria-hidden />
      <span className="ufc-sr">{format(value)}</span>
    </>
  )
}

function Words({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ")
  return (
    <span className={className} key={text}>
      {words.map((w, i) => (
        <span className="ufc-word" key={i} style={{ "--i": i } as React.CSSProperties}>
          {w + (i < words.length - 1 ? " " : "")}
        </span>
      ))}
    </span>
  )
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function dayLabel(start: string, i: number) {
  const d = new Date(Date.parse(`${start}T00:00:00Z`) + i * 864e5)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`
}
function isWeekend(start: string, i: number) {
  const dow = new Date(Date.parse(`${start}T00:00:00Z`) + i * 864e5).getUTCDay()
  return dow === 0 || dow === 6
}

function fmt(n: number, u: UsageUnit, decimals = u.decimals ?? 1) {
  const v = n / u.scale
  return `${v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${u.suffix}`
}
function fmtNum(n: number, u: UsageUnit) {
  const d = u.decimals ?? 1
  return (n / u.scale).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
}
function fmtAxis(n: number, u: UsageUnit) {
  return `${Math.round(n / u.scale).toLocaleString("en-US")}${u.suffix}`
}
function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

type Model = {
  days: number
  today: number
  actual: number[]
  /** Forecast cumulative per day; index today..days-1 (earlier entries are the actual values). */
  fc: number[]
  lo: number[]
  hi: number[]
  axisMax: number
  axisStep: number
}

function niceStep(max: number) {
  const raw = max / 5
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw) return m * mag
  return 10 * mag
}

function buildModel(m: UsageMetric, start: string, ceiling: number): Model {
  const days = m.days ?? 30
  const actual = m.readings.slice(0, days)
  const today = actual.length - 1
  const incs = actual.map((v, i) => v - (i ? actual[i - 1] : 0))
  const recent = incs.slice(Math.max(0, incs.length - 21))
  const idx0 = incs.length - recent.length
  const wk: number[] = []
  const we: number[] = []
  recent.forEach((v, k) => (isWeekend(start, idx0 + k) ? we : wk).push(v))
  const mean = (a: number[], fallback: number) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : fallback)
  const all = mean(recent, 0)
  const wkMean = mean(wk, all)
  const weMean = mean(we, wkMean * 0.4)
  const sd = (a: number[], mu: number) => (a.length > 1 ? Math.sqrt(a.reduce((s, v) => s + (v - mu) ** 2, 0) / (a.length - 1)) : mu * 0.08)
  const wkSd = sd(wk, wkMean)
  const weSd = sd(we, weMean)
  const fc: number[] = [...actual]
  const lo: number[] = [...actual]
  const hi: number[] = [...actual]
  let variance = 0
  for (let i = today + 1; i < days; i++) {
    const weekend = isWeekend(start, i)
    fc[i] = fc[i - 1] + (weekend ? weMean : wkMean)
    variance += (weekend ? weSd : wkSd) ** 2
    const k = i - today
    const half = 1.28 * Math.sqrt(variance) + k * 0.085 * all
    lo[i] = Math.max(actual[today], fc[i] - half)
    hi[i] = fc[i] + half
  }
  const top = Math.max(hi[days - 1] * 1.03, ceiling)
  const axisStep = niceStep(top)
  return { days, today, actual, fc, lo, hi, axisMax: Math.ceil(top / axisStep) * axisStep, axisStep }
}

/** Fractional day index at which a rising series first reaches `level` (from index `from`), or null. */
function crossAt(series: number[], level: number, from = 0) {
  for (let i = Math.max(from, 0); i < series.length; i++) {
    if (series[i] >= level) {
      if (i === 0) return 0
      const a = series[i - 1]
      const b = series[i]
      return i - 1 + (b === a ? 1 : (level - a) / (b - a))
    }
  }
  return null
}

type Verdict = {
  kind: "passed" | "reach" | "under"
  /** Day index of the first day at or over the budget (for passed/reach). */
  day: number
  /** Fractional position for the marker. */
  frac: number | null
  early: number | null
  late: number | null
}

function verdict(model: Model, budget: number): Verdict {
  const { actual, fc, lo, hi, today, days } = model
  const passed = crossAt(actual, budget)
  if (passed !== null) return { kind: "passed", day: Math.ceil(passed), frac: passed, early: null, late: null }
  const f = crossAt(fc, budget, today)
  const toDay = (x: number | null) => (x === null ? null : Math.ceil(x - 1e-9))
  if (f === null) {
    return { kind: "under", day: days - 1, frac: null, early: toDay(crossAt(hi, budget, today)), late: null }
  }
  return { kind: "reach", day: Math.ceil(f - 1e-9), frac: f, early: toDay(crossAt(hi, budget, today)), late: toDay(crossAt(lo, budget, today)) }
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * A billing period usage chart with a forecast cone and a draggable budget line that dates the crossing. The forecast
 * uses separate weekday and weekend rates from recent days; the cone widens with the days ahead. Alert rules ride on the line.
 */
export function UsageForecast({
  metrics = DEFAULT_METRICS,
  startDate = START,
  title = "Usage forecast",
  subtitle = "Northwind Labs · Scale plan · Renews Oct 1",
  thresholds = [0.5, 0.8, 1],
  onBudgetChange,
  onAlertChange,
  className,
}: UsageForecastProps) {
  const uid = React.useId()
  const [metricId, setMetricId] = React.useState(metrics[0]?.id ?? "")
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0]
  const [budgets, setBudgets] = React.useState<Record<string, number>>({})
  const [alerts, setAlerts] = React.useState<Record<string, boolean>>({})
  const [status, setStatus] = React.useState("")
  const cb = React.useRef({ onBudgetChange, onAlertChange })
  React.useEffect(() => {
    cb.current = { onBudgetChange, onAlertChange }
  })

  const model = React.useMemo(() => {
    const ceiling = Math.max(metric.budgetMax ?? 0, metric.budget * 1.1)
    return buildModel(metric, startDate, ceiling)
  }, [metric, startDate])

  const u = metric.unit
  const budget = budgets[metric.id] ?? metric.budget
  const bMin = metric.budgetMin ?? model.axisStep
  const bMax = metric.budgetMax ?? model.axisMax
  const bStep = metric.budgetStep ?? model.axisStep / 10
  const { today, days, actual, fc, lo, hi } = model
  const used = actual[today]
  const projected = fc[days - 1]
  const v = verdict(model, budget)
  const over = Math.max(0, projected - budget)
  const cost = metric.overage ? (over / metric.overage.per) * metric.overage.rate : 0
  const noun = metric.noun ?? metric.label.toLowerCase()
  const closes = dayLabel(startDate, days - 1)

  const setBudget = (value: number) => {
    setBudgets((b) => ({ ...b, [metric.id]: value }))
    cb.current.onBudgetChange?.(metric.id, value)
  }

  const isOn = (p: number) => alerts[`${metric.id}:${p}`] ?? p >= 0.8
  const toggleRule = (p: number) => {
    const next = !isOn(p)
    setAlerts((a) => ({ ...a, [`${metric.id}:${p}`]: next }))
    cb.current.onAlertChange?.(metric.id, p, next)
    setStatus(`Alert at ${Math.round(p * 100)} percent ${next ? "on" : "off"}. Alert emails are simulated.`)
  }

  const ruleInfo = (p: number) => {
    const level = budget * p
    const a = crossAt(actual, level)
    if (a !== null) return { kind: "reached" as const, frac: a, day: Math.ceil(a), text: `Reached ${dayLabel(startDate, Math.ceil(a))}` }
    const f = crossAt(fc, level, today)
    if (f !== null) return { kind: "expected" as const, frac: f, day: Math.ceil(f - 1e-9), text: `Expected ${dayLabel(startDate, Math.ceil(f - 1e-9))}` }
    return { kind: "none" as const, frac: null, day: -1, text: "Not expected" }
  }

  /* ---- story ---- */
  const pctUsed = (used / budget) * 100
  const lowEnd = lo[days - 1]
  const highEnd = hi[days - 1]
  let headline: string
  let detail: string
  if (v.kind === "passed") {
    headline = `You passed the budget on ${dayLabel(startDate, v.day)}`
    const daysOver = days - 1 - v.day
    detail = `${daysOver === 0 ? "On the last day of" : `${daysOver} ${daysOver === 1 ? "day" : "days"} before`} the period closes. At this pace you end ${fmt(over, u)} over.`
  } else if (v.kind === "reach") {
    const left = days - 1 - v.day
    headline = `At this pace you reach the budget on ${dayLabel(startDate, v.day)}`
    const early = v.early !== null ? dayLabel(startDate, v.early) : null
    const late = v.late !== null ? dayLabel(startDate, v.late) : null
    const range = early && late && early !== late ? `, likely between ${early} and ${late}` : late === null && early ? `, likely from ${early} on` : ""
    detail = `${left === 0 ? "On the last day of" : `${left} ${left === 1 ? "day" : "days"} before`} the period closes${range}.`
  } else {
    const pct = Math.round((projected / budget) * 100)
    headline = `At this pace you finish the period at ${pct}% of the budget`
    detail = `${fmt(budget - projected, u, 0)} to spare on ${closes}${v.early !== null ? `, though a fast finish could reach the budget on ${dayLabel(startDate, v.early)}` : ""}.`
  }
  const storyText = `${metric.label}: ${headline}. ${detail}`

  const tabsRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const w = tabsRef.current
    const t = thumbRef.current
    if (!w || !t) return
    let first = true
    const place = () => {
      const a = w.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!a) return
      if (first) t.style.transition = "none"
      t.style.width = `${a.offsetWidth}px`
      t.style.transform = `translateX(${a.offsetLeft}px)`
      if (first) {
        t.getBoundingClientRect()
        t.style.transition = ""
        first = false
      }
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(w)
    return () => ro.disconnect()
  }, [metricId])

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = metrics.findIndex((m) => m.id === metric.id)
    let n = i
    if (e.key === "ArrowRight") n = (i + 1) % metrics.length
    else if (e.key === "ArrowLeft") n = (i + metrics.length - 1) % metrics.length
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = metrics.length - 1
    else return
    e.preventDefault()
    setMetricId(metrics[n].id)
    requestAnimationFrame(() => tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[n]?.focus())
  }

  if (!metric) return null
  const unitPart = u.suffix.trim()

  return (
    <div className={["ufc", className].filter(Boolean).join(" ")}>
      <style href="usage-forecast" precedence="default">
        {CSS}
      </style>

      <header className="ufc-header">
        <div className="ufc-heading">
          <h2 className="ufc-title">{title}</h2>
          <p className="ufc-sub">{subtitle}</p>
        </div>
        {metrics.length > 1 && (
          <div className="ufc-tabs" ref={tabsRef} role="tablist" aria-label="Metric" onKeyDown={onTabKey}>
            <span className="ufc-thumb" ref={thumbRef} aria-hidden />
            {metrics.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`${uid}-tab-${m.id}`}
                aria-selected={m.id === metric.id}
                aria-controls={`${uid}-panel`}
                tabIndex={m.id === metric.id ? 0 : -1}
                className="ufc-tab"
                onClick={() => setMetricId(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${metric.id}`} style={{ display: "contents" }}>
        <div className="ufc-story">
          <p className="ufc-headline" aria-hidden>
            <Words text={headline} />
          </p>
          <p className="ufc-detail" aria-hidden>
            <Words text={detail} />
          </p>
          <p className="ufc-sr" aria-live="polite">
            {storyText}
          </p>
        </div>

        <dl className="ufc-kpis">
          <div className="ufc-kpi">
            <dt>Used so far</dt>
            <dd className="ufc-val">
              <CountTo value={used / u.scale} format={(n) => n.toLocaleString("en-US", { minimumFractionDigits: u.decimals ?? 1, maximumFractionDigits: u.decimals ?? 1 })} />
              <small>{unitPart}</small>
            </dd>
            <dd className="ufc-foot">{Math.round(pctUsed)}% of budget</dd>
          </div>
          <div className="ufc-kpi">
            <dt>Projected by {closes}</dt>
            <dd className="ufc-val">
              <CountTo value={projected / u.scale} format={(n) => n.toLocaleString("en-US", { minimumFractionDigits: u.decimals ?? 1, maximumFractionDigits: u.decimals ?? 1 })} />
              <small>{unitPart}</small>
            </dd>
            <dd className="ufc-foot">
              Likely {fmtNum(lowEnd, u)}–{fmt(highEnd, u)}
            </dd>
          </div>
          <div className="ufc-kpi">
            <dt>Cost above budget</dt>
            <dd className="ufc-val" data-over={cost > 0 || undefined}>
              <CountTo value={cost} format={money} />
            </dd>
            <dd className="ufc-foot">{cost > 0 ? (metric.overage?.text ?? "") : "Within budget"}</dd>
          </div>
        </dl>

        <Chart
          key={metric.id}
          uid={uid}
          model={model}
          unit={u}
          startDate={startDate}
          budget={budget}
          bMin={bMin}
          bMax={bMax}
          bStep={bStep}
          noun={noun}
          v={v}
          rules={thresholds.filter((p) => isOn(p)).map((p) => ({ p, ...ruleInfo(p) }))}
          onBudget={setBudget}
          onAnnounce={setStatus}
          label={`${metric.label}, ${dayLabel(startDate, 0)} to ${closes}`}
        />
      </div>

      <footer className="ufc-footer">
        <div className="ufc-rules">
          <span className="ufc-ruleslabel">Alert at</span>
          {thresholds.map((p) => {
            const info = ruleInfo(p)
            const on = isOn(p)
            return (
              <button
                key={p}
                type="button"
                className="ufc-rule"
                aria-pressed={on}
                aria-label={`Alert at ${Math.round(p * 100)} percent of budget, ${info.text.toLowerCase()}, ${on ? "on" : "off"}`}
                onClick={() => toggleRule(p)}
              >
                <span className="ufc-check" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                  </svg>
                </span>
                <span className="ufc-rulepct">{Math.round(p * 100)}%</span>
                <span className="ufc-rulewhen" key={info.text} aria-hidden>
                  {info.text}
                </span>
              </button>
            )
          })}
        </div>
        <ul className="ufc-legend" aria-hidden>
          <li>
            <svg width="16" height="8" aria-hidden>
              <line x1="1" y1="4" x2="15" y2="4" stroke="var(--ufc-series)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Actual
          </li>
          <li>
            <svg width="16" height="8" aria-hidden>
              <line x1="0" y1="4" x2="16" y2="4" stroke="var(--ufc-series)" strokeWidth="1.75" strokeDasharray="4 4" />
            </svg>
            Forecast
          </li>
          <li>
            <svg width="12" height="10" aria-hidden>
              <rect width="12" height="10" rx="2" fill="var(--ufc-series)" opacity=".14" />
            </svg>
            Likely range
          </li>
          <li>
            <svg width="16" height="8" aria-hidden>
              <line x1="1" y1="4" x2="15" y2="4" stroke="var(--ufc-over)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Over budget
          </li>
        </ul>
      </footer>

      <div className="ufc-sr" role="status" aria-live="polite">
        {status}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Chart                                   */
/* -------------------------------------------------------------------------- */

type Rule = { p: number; kind: "reached" | "expected" | "none"; frac: number | null; day: number; text: string }

const PAD = { l: 52, r: 10, t: 30, b: 30 }
const HEIGHT = 264

function Chart({
  uid,
  model,
  unit,
  startDate,
  budget,
  bMin,
  bMax,
  bStep,
  noun,
  v,
  rules,
  onBudget,
  onAnnounce,
  label,
}: {
  uid: string
  model: Model
  unit: UsageUnit
  startDate: string
  budget: number
  bMin: number
  bMax: number
  bStep: number
  noun: string
  v: Verdict
  rules: Rule[]
  onBudget: (b: number) => void
  onAnnounce: (s: string) => void
  label: string
}) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const wrap = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const [hover, setHover] = React.useState<number | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [shown, setShown] = React.useState(budget)
  const spring = React.useRef({ x: budget, v: 0 })

  React.useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Settles on a snappy critically damped spring unless the pointer is dragging the line.
  React.useEffect(() => {
    if (dragging || reduced) return
    let raf = 0
    let last = performance.now()
    const w = 34
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const s = spring.current
      const x = s.x - budget
      const acc = -2 * w * s.v - w * w * x
      s.v += acc * dt
      s.x += s.v * dt
      if (Math.abs(s.x - budget) < (bMax - bMin) * 0.0004 && Math.abs(s.v) < (bMax - bMin) * 0.004) {
        s.x = budget
        s.v = 0
        setShown(budget)
        return
      }
      setShown(s.x)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [budget, dragging, reduced, bMax, bMin])

  const level = reduced || dragging ? budget : shown
  const { days, today, actual, fc, lo, hi, axisMax, axisStep } = model
  const W = Math.max(width, 280)
  const L = PAD.l
  const plotW = W - L - PAD.r
  const plotH = HEIGHT - PAD.t - PAD.b
  const X = (i: number) => L + (i / (days - 1)) * plotW
  const Y = (val: number) => PAD.t + plotH * (1 - val / axisMax)
  const bottom = PAD.t + plotH
  const levelY = Y(level)

  const pathOf = (series: number[], from: number, to: number) =>
    series
      .slice(from, to + 1)
      .map((val, k) => `${k === 0 ? "M" : "L"}${X(from + k).toFixed(1)} ${Y(val).toFixed(1)}`)
      .join(" ")
  const actualPath = pathOf(actual, 0, today)
  const fcPath = pathOf(fc, today, days - 1)
  const bandPath =
    `M${X(today).toFixed(1)} ${Y(actual[today]).toFixed(1)} ` +
    hi
      .slice(today + 1)
      .map((val, k) => `L${X(today + 1 + k).toFixed(1)} ${Y(val).toFixed(1)}`)
      .join(" ") +
    " " +
    lo
      .slice(today + 1)
      .map((_, k) => {
        const i = days - 1 - k
        return `L${X(i).toFixed(1)} ${Y(lo[i]).toFixed(1)}`
      })
      .join(" ") +
    " Z"

  const ticks: number[] = []
  for (let val = 0; val <= axisMax + 1e-9; val += axisStep) ticks.push(val)
  const xTicks: number[] = []
  for (let i = 0; i < days; i += plotW < 420 ? 14 : 7) xTicks.push(i)

  // Where the forecast meets the (animated) budget line.
  const crossFrac = v.kind === "passed" ? null : crossAt(fc, level, today)
  const cx = crossFrac === null ? null : X(crossFrac)
  const crossDay = crossFrac === null ? null : Math.ceil(crossFrac - 1e-9)
  const hideTick = (i: number) => cx !== null && Math.abs(X(i) - cx) < 40
  const nowY = Y(actual[today])

  const clipId = `${uid}-clip`
  const upId = `${uid}-up`
  const dnId = `${uid}-dn`

  /* ---- scrubbing the plot ---- */
  const hitRef = React.useRef<HTMLDivElement>(null)
  const dayFromX = (clientX: number) => {
    const r = hitRef.current?.getBoundingClientRect()
    if (!r) return 0
    const f = (clientX - (r.left + (L - 0))) / plotW
    return Math.max(0, Math.min(days - 1, Math.round(f * (days - 1))))
  }
  const insp = hover
  const inspVal = insp === null ? 0 : insp <= today ? actual[insp] : fc[insp]
  const describe = (i: number) => {
    const val = i <= today ? actual[i] : fc[i]
    const pct = Math.round((val / budget) * 100)
    return i <= today
      ? `${dayLabel(startDate, i)}, actual, ${fmt(val, unit)} ${noun}, ${pct}% of budget`
      : `${dayLabel(startDate, i)}, forecast, ${fmt(val, unit)} ${noun}, likely ${fmt(lo[i], unit)} to ${fmt(hi[i], unit)}, ${pct}% of budget`
  }
  const onPlotKey = (e: React.KeyboardEvent) => {
    const cur = hover ?? today
    let n = cur
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") n = cur - 1
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") n = cur + 1
    else if (e.key === "PageUp") n = cur + 7
    else if (e.key === "PageDown") n = cur - 7
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = days - 1
    else if (e.key === "Escape") {
      setHover(null)
      return
    } else return
    e.preventDefault()
    setHover(Math.max(0, Math.min(days - 1, n)))
  }

  /* ---- dragging / keys on the budget ---- */
  const drag = React.useRef<{ id: number } | null>(null)
  const clampB = (n: number) => Math.max(bMin, Math.min(bMax, n))
  const snap = (n: number) => clampB(Math.round(n / bStep) * bStep)
  const valueFromY = (clientY: number) => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r) return budget
    return clampB(((bottom - (clientY - r.top)) / plotH) * axisMax)
  }
  const onZoneDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId }
    setDragging(true)
    setHover(null)
    const raw = valueFromY(e.clientY)
    setShown(raw)
    spring.current = { x: raw, v: 0 }
    onBudget(raw)
  }
  const onZoneMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const raw = valueFromY(e.clientY)
    setShown(raw)
    spring.current = { x: raw, v: 0 }
    onBudget(raw)
  }
  const onZoneUp = (e: React.PointerEvent) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setDragging(false)
    const snapped = snap(valueFromY(e.clientY))
    onBudget(snapped)
    onAnnounce(`Budget ${fmt(snapped, unit)}.`)
  }
  const onHandleKey = (e: React.KeyboardEvent) => {
    let n = budget
    if (e.key === "ArrowUp" || e.key === "ArrowRight") n = budget + bStep
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") n = budget - bStep
    else if (e.key === "PageUp") n = budget + bStep * 5
    else if (e.key === "PageDown") n = budget - bStep * 5
    else if (e.key === "Home") n = bMin
    else if (e.key === "End") n = bMax
    else return
    e.preventDefault()
    const next = snap(n)
    onBudget(next)
  }
  const budgetText = `${fmt(budget, unit)} ${noun}, ${v.kind === "passed" ? `passed on ${dayLabel(startDate, v.day)}` : v.kind === "reach" ? `reached on ${dayLabel(startDate, v.day)}` : "not reached this period"}`

  // Tooltip placement.
  const tipW = 148
  const tipLeft = insp === null ? 0 : Math.min(Math.max(X(insp) + 12, L), W - tipW - 4)
  const flip = insp !== null && X(insp) + 12 + tipW > W - 4
  const tipTop = PAD.t + 6

  const budgetLabel = fmt(level, unit, level >= 100 ? 0 : (unit.decimals ?? 0))

  return (
    <div className="ufc-chart" ref={wrap}>
      <svg className="ufc-svg" viewBox={`0 0 ${W} ${HEIGHT}`} width={W} height={HEIGHT} role="img" aria-label={`${label}. ${v.kind === "reach" ? `At this pace usage reaches the budget on ${dayLabel(startDate, v.day)}.` : v.kind === "passed" ? `Usage passed the budget on ${dayLabel(startDate, v.day)}.` : "Usage stays under the budget."}`} aria-describedby={`${uid}-table`}>
        <defs>
          <clipPath id={upId}>
            <rect x={0} y={0} width={W} height={Math.max(0, levelY)} />
          </clipPath>
          <clipPath id={dnId}>
            <rect x={0} y={Math.max(0, levelY)} width={W} height={HEIGHT} />
          </clipPath>
          <clipPath id={clipId}>
            <rect x={L} y={PAD.t - 6} width={plotW + PAD.r} height={plotH + 6} />
          </clipPath>
        </defs>

        <rect className="ufc-future" x={X(today)} y={PAD.t} width={Math.max(0, X(days - 1) - X(today))} height={plotH} />
        {ticks.map((val, k) => (
          <line key={k} className={k === 0 ? "ufc-baseline" : "ufc-grid"} x1={L} x2={L + plotW} y1={Y(val)} y2={Y(val)} />
        ))}
        {xTicks.filter((i) => !hideTick(i)).map((i) => (
          <text key={i} className="ufc-axis" x={X(i)} y={bottom + 18} textAnchor={i === 0 ? "start" : "middle"}>
            {dayLabel(startDate, i)}
          </text>
        ))}
        <line className="ufc-today" x1={X(today)} x2={X(today)} y1={PAD.t - 8} y2={bottom} />
        <text className="ufc-todaylabel" x={X(today)} y={PAD.t - 16} textAnchor="middle">
          Today
        </text>

        <g clipPath={`url(#${clipId})`}>
          <g clipPath={`url(#${dnId})`}>
            <path className="ufc-band" d={bandPath} />
            <path className="ufc-fc" d={fcPath} />
            <path className="ufc-actual" d={actualPath} />
          </g>
          <g clipPath={`url(#${upId})`}>
            <path className="ufc-bandover" d={bandPath} />
            <path className="ufc-fcover" d={fcPath} />
            <path className="ufc-actualover" d={actualPath} />
          </g>
        </g>

        <line className="ufc-budgetline" x1={L} x2={L + plotW} y1={levelY} y2={levelY} />

        {rules.map((r) => {
          if (r.frac === null) return null
          const rx = X(r.frac)
          const ry = Y(budget * r.p)
          if (Math.abs(r.p - 1) < 1e-6 && v.kind !== "passed") return null
          return (
            <g key={r.p} style={{ transition: "opacity .25s" }}>
              <path className="ufc-tick" d={`M${rx} ${ry - 7}V${ry + 7}`} />
              <text className="ufc-ticklabel" x={rx - 7} y={ry - 10} textAnchor="end">
                {Math.round(r.p * 100)}%
              </text>
            </g>
          )
        })}

        {cx !== null && crossDay !== null && (
          <g>
            <path className="ufc-drop" d={`M${cx} ${levelY + 5}V${bottom}`} />
            <circle className="ufc-marker" cx={cx} cy={levelY} r={5} />
            {v.kind === "reach" && rules.some((r) => Math.abs(r.p - 1) < 1e-6) && (
              <text className="ufc-ticklabel" x={cx - 9} y={levelY - 10} textAnchor="end">
                100%
              </text>
            )}
          </g>
        )}
        <circle className="ufc-nowdot" cx={X(today)} cy={nowY} r={4} />

        {insp !== null && (
          <g>
            <line className="ufc-hoverline" x1={X(insp)} x2={X(insp)} y1={PAD.t} y2={bottom} />
            <circle className="ufc-hoverdot" cx={X(insp)} cy={Y(inspVal)} r={4} />
          </g>
        )}
      </svg>

      <div className="ufc-ylabels" aria-hidden>
        {ticks.map((val, k) => (
          <span key={k} className="ufc-ylabel" style={{ top: Y(val) }}>
            {k === 0 ? "0" : fmtAxis(val, unit)}
          </span>
        ))}
      </div>

      <div
        ref={hitRef}
        className="ufc-hit"
        style={{ left: L, top: PAD.t - 6, width: plotW, height: plotH + 6 }}
        role="slider"
        tabIndex={0}
        aria-label="Inspect a day"
        aria-valuemin={0}
        aria-valuemax={days - 1}
        aria-valuenow={hover ?? today}
        aria-valuetext={describe(hover ?? today)}
        onPointerMove={(e) => !dragging && setHover(dayFromX(e.clientX))}
        onPointerDown={(e) => !dragging && setHover(dayFromX(e.clientX))}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onPlotKey}
        onBlur={() => setHover(null)}
      />

      <div
        className="ufc-zone"
        style={{ left: L, width: plotW, top: levelY - 16, height: 32 }}
        onPointerDown={onZoneDown}
        onPointerMove={onZoneMove}
        onPointerUp={onZoneUp}
        onPointerCancel={onZoneUp}
      >
        <span
          className="ufc-handle"
          role="slider"
          tabIndex={0}
          aria-label="Budget"
          aria-orientation="vertical"
          aria-valuemin={bMin}
          aria-valuemax={bMax}
          aria-valuenow={Math.round(budget)}
          aria-valuetext={budgetText}
          aria-describedby={`${uid}-hint`}
          data-drag={dragging || undefined}
          onKeyDown={onHandleKey}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            {[4, 8, 12].map((cxx) => [6, 10].map((cyy) => <circle key={`${cxx}-${cyy}`} cx={cxx} cy={cyy} r="1" />))}
          </svg>
          <em>Budget</em>
          <b className="ufc-num">{budgetLabel}</b>
        </span>
      </div>

      {cx !== null && crossDay !== null && (
        <div className="ufc-when" style={{ left: cx, top: bottom + 6 }} aria-hidden>
          <span className="ufc-whenpill">{dayLabel(startDate, crossDay)}</span>
        </div>
      )}

      {insp !== null && (
        <div
          className="ufc-tip"
          style={{ left: flip ? undefined : tipLeft, right: flip ? W - X(insp) + 12 : undefined, top: tipTop }}
          data-over={inspVal >= budget || undefined}
          aria-hidden
        >
          <div className="ufc-tiphead">
            <span>{dayLabel(startDate, insp)}</span>
            <span>{insp <= today ? "Actual" : "Forecast"}</span>
          </div>
          <div className="ufc-tipval">{fmt(inspVal, unit)}</div>
          <div className="ufc-tipfoot">
            {insp > today ? `Likely ${fmtNum(lo[insp], unit)}–${fmt(hi[insp], unit)}` : `${Math.round((inspVal / budget) * 100)}% of budget`}
          </div>
        </div>
      )}

      <p id={`${uid}-hint`} className="ufc-sr">
        Drag the budget line or use the arrow keys.
      </p>
      <table id={`${uid}-table`} className="ufc-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reading</th>
            <th>Likely range</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: days }, (_, i) => (
            <tr key={i}>
              <td>
                {dayLabel(startDate, i)}
                {i > today ? " (forecast)" : ""}
              </td>
              <td>{fmt(i <= today ? actual[i] : fc[i], unit)}</td>
              <td>{i <= today ? "Measured" : `${fmtNum(lo[i], unit)} to ${fmt(hi[i], unit)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

"use client"

/**
 * Plain Charts – the everyday dashboard charts as one family: `LineChart`, `AreaChart`, `BarChart` (grouped or
 * stacked), `ComboChart` (bars plus a line on a second scale) and `DonutChart`.
 *
 * Every chart takes the same data: `data` is a list of rows `{ x: "2026-11-24", nova: 14210, sage: 8120 }` and
 * `series` names the keys to draw `[{ key: "nova", label: "Nova 2 Pro" }]`. An `x` written as `YYYY-MM-DD` is read as a
 * day ("Tue 24 Nov"); anything else is shown as written.
 *
 * The readout is a sentence above the plot, not a floating box: hovering or arrow-keying moves a hairline crosshair and
 * rewrites one line ("Tue 24 Nov  14.2k  Nova 2 Pro calls, 8% up on Monday"). Only the series that sentence is about
 * takes the accent; the rest stay ink-grey. The legend is plain words that also show and hide each series. When the
 * data changes, the marks move from their old values to the new ones once.
 *
 * ```tsx
 * <LineChart title="Calls by model" unit="calls" data={rows} series={models} />
 * <BarChart stacked format="currency" data={rows} series={models} />
 * <ComboChart lineKey="p95" data={rows} series={[{ key: "calls", label: "Calls" }, { key: "p95", label: "p95 latency", format: "duration" }]} />
 * <DonutChart format="currency" period="over 30 days" data={rows} series={models} />
 * ```
 *
 * Keyboard: Tab to the plot, Left/Right (Home/End) move along x, Up/Down change the series the sentence is about,
 * Escape returns to the latest point. A visually hidden table carries every value for screen readers.
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * How numbers read. `compact` 14.2k / 1.3M (default), `number` 14,210, `percent` takes fractions (0.084 → 8.4%),
 * `currency` $4,210 / $4.2k (see `currency`), `duration` takes milliseconds (840 ms, 1.24 s), or your own function.
 */
export type ChartFormat =
  | "compact"
  | "number"
  | "percent"
  | "currency"
  | "duration"
  | ((value: number, context: "axis" | "value") => string)

/** One row: `x` plus one number per series key. `null` or a missing key is a gap. `label` overrides the x wording. */
export type ChartDatum = { x: string; label?: string; [key: string]: string | number | null | undefined }

export type ChartSeries = {
  /** The key in each row. */
  key: string
  /** The word in the legend, e.g. "Nova 2 Pro". */
  label: string
  /** What follows the number in the sentence. Default: `label` plus the chart's `unit` ("Nova 2 Pro calls"). */
  noun?: string
  /** Overrides the chart's `format` for this series (the line of a combo usually has its own). */
  format?: ChartFormat
}

type CommonProps = {
  data: ChartDatum[]
  series: ChartSeries[]
  /** Names the chart for screen readers and the hidden table. Default: `title`, else "Chart". */
  label?: string
  /** Small heading at the top left. */
  title?: string
  /** Slot at the top right, e.g. a range switch. */
  actions?: React.ReactNode
  /** Plural noun for what is counted, used in the sentence: "calls", "tokens". */
  unit?: string
  format?: ChartFormat
  /** ISO currency code for `format="currency"`. Default "USD". */
  currency?: string
  /** Height of the plot in pixels. Default 220 (donut 200). */
  height?: number
  /** The series the sentence is about at first. Default: the first. */
  defaultFocus?: string
  onFocusChange?: (key: string) => void
  /** Series keys hidden at first. */
  defaultHidden?: string[]
  onHiddenChange?: (hidden: string[]) => void
  /** Called with the row index under the crosshair, or null when it returns to rest. */
  onActiveChange?: (index: number | null) => void
  /** Show the legend words. Default true. */
  legend?: boolean
  /** Shown when there is nothing to draw. Default "No data in this range". */
  emptyLabel?: string
  className?: string
}

export type LineChartProps = CommonProps
export type AreaChartProps = CommonProps & {
  /** Stack the areas so the top edge is the total. */
  stacked?: boolean
}
export type BarChartProps = CommonProps & {
  /** Stack the bars in one column per x instead of side by side. */
  stacked?: boolean
}
export type ComboChartProps = CommonProps & {
  /** The series drawn as a line on the right-hand scale. Default: the last series. The rest are bars. */
  lineKey?: string
  stacked?: boolean
}
export type DonutChartProps = CommonProps & {
  /** Use one row instead of the sum of all rows. */
  at?: number
  /** Words after the noun in the sentence, e.g. "over 30 days". */
  period?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pch {
  --pch-ink: #000;
  --pch-surface: #fff;
  --pch-accent: #0060e2;
  --pch-t1: color-mix(in oklab, var(--pch-ink) 88%, transparent);
  --pch-t2: color-mix(in oklab, var(--pch-ink) 61%, transparent);
  --pch-t3: color-mix(in oklab, var(--pch-ink) 45%, transparent);
  --pch-t4: color-mix(in oklab, var(--pch-ink) 27%, transparent);
  --pch-fill: color-mix(in oklab, var(--pch-ink) 4%, transparent);
  --pch-line: color-mix(in oklab, var(--pch-ink) 7%, transparent);
  --pch-base: color-mix(in oklab, var(--pch-ink) 16%, transparent);
  --pch-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --pch-ease: cubic-bezier(.22, 1, .36, 1);
  --pch-r: 20px;
  --pch-big: 30px;
  position: relative; container-type: inline-size; width: 100%; margin: 0;
  font: 13px/20px var(--pch-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--pch-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .pch {
  --pch-ink: #fff;
  --pch-surface: #1c1c1e;
  --pch-accent: #4d8dff;
  --pch-t1: color-mix(in oklab, var(--pch-ink) 90%, transparent);
  --pch-t2: color-mix(in oklab, var(--pch-ink) 62%, transparent);
  --pch-t3: color-mix(in oklab, var(--pch-ink) 46%, transparent);
  --pch-t4: color-mix(in oklab, var(--pch-ink) 28%, transparent);
  --pch-fill: color-mix(in oklab, var(--pch-ink) 6%, transparent);
  --pch-line: color-mix(in oklab, var(--pch-ink) 9%, transparent);
  --pch-base: color-mix(in oklab, var(--pch-ink) 20%, transparent);
  --pch-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}

/* Mono: ink on paper, a hairline frame, a monospaced face (wider, so the big number steps down) */
html[data-style="mono"] .pch {
  --pch-ink: #000; --pch-surface: #fff; --pch-accent: #111; --pch-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --pch-ease: cubic-bezier(.2, .9, .1, 1); --pch-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --pch-r: 8px; --pch-big: 26px;
}
html[data-style="mono"].dark .pch { --pch-ink: #fff; --pch-surface: #0a0a0a; --pch-accent: #f2f2f2; --pch-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="mono"] .pch-big { letter-spacing: -.04em }
html[data-style="mono"] .pch-key { border-radius: 2px }
html[data-style="mono"] .pch-key i { border-radius: 0 }
html[data-style="mono"] .pch-plot:focus-visible { border-radius: 2px }

/* Glass: the card carries the frost; marks and words use the Pane glass inks */
html[data-style="glass"] .pch {
  --pch-ink: var(--pane-ink); --pch-surface: var(--pane-solid); --pch-accent: var(--pane-accent); --pch-shadow: var(--pane-shadow);
  --pch-ease: var(--pane-ease); --pch-font: var(--pane-font); --pch-r: 24px;
  --pch-t1: var(--pane-t1); --pch-t2: var(--pane-t2); --pch-t3: var(--pane-t3); --pch-t4: var(--pane-t4);
  --pch-line: color-mix(in oklab, var(--pane-ink) 11%, transparent);
  --pch-base: color-mix(in oklab, var(--pane-ink) 24%, transparent);
  --pch-fill: color-mix(in oklab, var(--pane-ink) 6%, transparent);
}
html[data-style="glass"] .pch-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .pch-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .pch-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .pch-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .pch-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .pch-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.pch *, .pch *::before, .pch *::after { box-sizing: border-box }
:where(.pch) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.pch) p { margin: 0 }
.pch-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }

.pch-card { padding: 20px 24px 14px; border-radius: var(--pch-r); background: var(--pch-surface); box-shadow: var(--pch-shadow) }
.pch-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; min-height: 28px }
.pch-title { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--pch-t1) }
.pch-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-left: auto }

/* The sentence. Fixed height, so moving across the plot never moves the plot. */
.pch-read {
  display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 10px; height: 44px; margin-top: 10px; overflow: hidden;
  font-size: 15px; line-height: 22px; color: var(--pch-t2);
}
.pch-when { color: var(--pch-t2); white-space: nowrap }
.pch-big {
  font-size: var(--pch-big); line-height: 44px; font-weight: 500; letter-spacing: -.025em; color: var(--pch-t1);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.pch-what { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1 1 0 }
.pch-what b { font-weight: 500; color: var(--pch-t1) }
.pch-none { line-height: 44px; color: var(--pch-t3) }

.pch-plot { position: relative; margin-top: 8px; touch-action: pan-y; user-select: none; -webkit-user-select: none; border-radius: 8px; outline: none }
.pch-plot:focus-visible { outline: 2px solid var(--pch-accent); outline-offset: 4px }
.pch-plot svg { display: block; overflow: visible }
.pch-grid line { stroke: var(--pch-line); stroke-width: 1; shape-rendering: crispEdges }
.pch-grid line[data-zero] { stroke: var(--pch-base) }
.pch-tick { font-size: 12px; fill: var(--pch-t3); font-variant-numeric: tabular-nums }
.pch-tick[data-on] { fill: var(--pch-t1) }
.pch-fade { animation: pch-fade .42s var(--pch-ease) backwards }
.pch-line { fill: none; stroke: var(--c); stroke-width: 1.5px; stroke-linejoin: round; stroke-linecap: round; transition: stroke .22s var(--pch-ease), opacity .3s var(--pch-ease) }
.pch-line[data-focus] { stroke-width: 2px }
.pch-halo { fill: none; stroke: var(--pch-surface); stroke-width: 5px; stroke-linejoin: round; stroke-linecap: round }
.pch-area { fill: var(--cf); stroke: none; transition: fill .22s var(--pch-ease), opacity .3s var(--pch-ease) }
.pch-bar { fill: var(--c); transition: fill .22s var(--pch-ease), opacity .3s var(--pch-ease) }
.pch-plot [data-hidden] { opacity: 0 }
.pch-cross { stroke: var(--pch-t3); stroke-width: 1; shape-rendering: crispEdges; pointer-events: none }
.pch-band { fill: var(--pch-fill); pointer-events: none }
.pch-dot { fill: var(--pch-surface); stroke: var(--pch-accent); stroke-width: 2px; pointer-events: none }
.pch-empty { font-size: 13px; fill: var(--pch-t3) }
.pch-total { font-size: 20px; font-weight: 500; fill: var(--pch-t1); font-variant-numeric: tabular-nums; letter-spacing: -.01em }
.pch-total-l { font-size: 12px; fill: var(--pch-t3) }
.pch-slice { fill: var(--c); transition: fill .22s var(--pch-ease) }

/* The legend: plain words that show and hide each series */
.pch-keys { display: flex; flex-wrap: wrap; gap: 0 16px; margin-top: 8px }
.pch-key {
  display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 2px; border-radius: 6px;
  font-size: 13px; color: var(--pch-t2); transition: color .16s var(--pch-ease);
}
.pch-key:hover { color: var(--pch-t1) }
.pch-key:focus-visible { outline: 2px solid var(--pch-accent); outline-offset: 1px }
.pch-key i { flex: none; width: 12px; height: 2px; border-radius: 1px; background: var(--c); transition: background-color .22s var(--pch-ease), box-shadow .22s var(--pch-ease) }
.pch-key[data-mark="box"] i { width: 8px; height: 8px; border-radius: 2px }
.pch-key[data-focus] { color: var(--pch-t1) }
.pch-key[aria-pressed="false"] { color: var(--pch-t4); text-decoration: line-through; text-decoration-thickness: 1px }
.pch-key[aria-pressed="false"] i { background: transparent; box-shadow: inset 0 0 0 1px var(--pch-t4) }
.pch-key em { font-style: normal; color: var(--pch-t3); font-variant-numeric: tabular-nums }

@keyframes pch-fade { from { opacity: 0 } }

@container (max-width: 440px) {
  .pch-card { padding: 16px 16px 10px }
  .pch-read { height: 66px; column-gap: 8px }
  .pch-big { font-size: calc(var(--pch-big) - 4px) }
  .pch-what { flex-basis: 100%; white-space: normal; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; line-height: 22px }
  .pch-keys { gap: 0 12px }
}
@media (pointer: coarse) { .pch-key { height: 40px } }
@media (prefers-reduced-motion: reduce) {
  .pch *, .pch *::before, .pch *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Numbers                                  */
/* -------------------------------------------------------------------------- */

const nfCache = new Map<string, Intl.NumberFormat>()
function nf(key: string, opts: Intl.NumberFormatOptions) {
  let f = nfCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat("en", opts)
    nfCache.set(key, f)
  }
  return f
}
const lowerK = (s: string) => s.replace(/K\b/, "k")
const compact = (v: number) => lowerK(nf("c", { notation: "compact", maximumFractionDigits: 1 }).format(v))
const grouped = (v: number) => nf("g", { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0 }).format(v)
const dec = (v: number, d: number) => nf(`d${d}`, { maximumFractionDigits: d }).format(v)

function formatNumber(v: number, f: ChartFormat, currency: string, ctx: "axis" | "value"): string {
  if (typeof f === "function") return f(v, ctx)
  const a = Math.abs(v)
  switch (f) {
    case "percent": {
      const p = v * 100
      return `${dec(p, Math.abs(p) < 10 && p % 1 !== 0 ? 1 : 0)}%`
    }
    case "currency": {
      if (ctx === "axis" || a >= 10000)
        return lowerK(nf(`cc${currency}`, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(v))
      if (a >= 100) return nf(`c0${currency}`, { style: "currency", currency, maximumFractionDigits: 0 }).format(v)
      return nf(`c2${currency}`, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
    }
    case "duration":
      if (a < 1000) return `${Math.round(v)} ms`
      return `${dec(v / 1000, ctx === "axis" ? 1 : 2)} s`
    case "number":
      return ctx === "axis" ? compact(v) : grouped(v)
    default:
      return ctx === "axis" || a >= 10000 ? compact(v) : grouped(v)
  }
}

/** Round steps (1, 2, 2.5, 5 × 10ⁿ) that cover [lo, hi] in about `count` intervals. */
function niceTicks(lo: number, hi: number, count: number) {
  if (!(hi > lo)) hi = lo + 1
  const raw = (hi - lo) / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const r = raw / mag
  const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag
  const min = Math.floor(lo / step + 1e-9) * step
  const max = Math.ceil(hi / step - 1e-9) * step
  const ticks: number[] = []
  for (let t = min; t <= max + step / 2; t += step) ticks.push(Math.abs(t) < step / 1e6 ? 0 : +t.toPrecision(12))
  return { min, max: Math.max(max, min + step), ticks }
}

/* ---------------------------------- Days ---------------------------------- */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const DAY = 86400000
const dfLong = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
const dfTick = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const dfWeekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" })

type RowInfo = { long: string; tick: string; ms: number | null }
function rowInfo(d: ChartDatum): RowInfo {
  const ms = ISO_DAY.test(d.x) ? Date.UTC(+d.x.slice(0, 4), +d.x.slice(5, 7) - 1, +d.x.slice(8, 10)) : null
  if (ms == null || Number.isNaN(ms)) return { long: d.label ?? d.x, tick: d.label ?? d.x, ms: null }
  return { long: d.label ?? dfLong.format(ms), tick: dfTick.format(ms), ms }
}
/** "Monday" when the previous row is the day before, else its date or label. */
function prevWords(rows: RowInfo[], i: number) {
  const p = rows[i - 1]
  const c = rows[i]
  if (!p || !c) return ""
  if (p.ms != null && c.ms != null) return c.ms - p.ms === DAY ? dfWeekday.format(p.ms) : p.tick
  return p.long
}

function change(cur: number | null, prev: number | null, f: ChartFormat, when: string) {
  if (cur == null || prev == null || !when) return ""
  if (f === "percent") {
    const d = (cur - prev) * 100
    if (Math.abs(d) < 0.05) return `level with ${when}`
    return `${dec(Math.abs(d), 1)} pts ${d > 0 ? "up" : "down"} on ${when}`
  }
  if (prev === 0) return cur === 0 ? `level with ${when}` : `up from zero on ${when}`
  const r = ((cur - prev) / Math.abs(prev)) * 100
  if (Math.abs(r) < 0.5) return `level with ${when}`
  return `${dec(Math.abs(r), Math.abs(r) < 10 ? 1 : 0)}% ${r > 0 ? "up" : "down"} on ${when}`
}

const num = (d: ChartDatum | undefined, key: string): number | null => {
  const v = d?.[key]
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

/* --------------------------------- Colour --------------------------------- */

const ink = (a: number) => `color-mix(in oklab, var(--pch-ink) ${a}%, transparent)`
const LINE_STEPS = [34, 22, 15, 11]
const FILL_STEPS = [20, 13, 8.5, 6]
type Paint = { c: string; cf: string }
/** The focused series takes the accent; the rest step down in ink, in series order. */
function palette(keys: string[], focus: string | undefined, mark: "line" | "box"): Record<string, Paint> {
  const out: Record<string, Paint> = {}
  let n = 0
  for (const k of keys) {
    if (k === focus) {
      out[k] = { c: "var(--pch-accent)", cf: "color-mix(in oklab, var(--pch-accent) 13%, transparent)" }
    } else {
      const steps = mark === "line" ? LINE_STEPS : FILL_STEPS
      const a = steps[Math.min(n, steps.length - 1)]!
      out[k] = { c: ink(a), cf: ink(Math.max(3, a * 0.22)) }
      n++
    }
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                                Shared hooks                                */
/* -------------------------------------------------------------------------- */

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

function useWidth(fallback = 560) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(fallback)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(Math.max(200, Math.round(el.getBoundingClientRect().width)))
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/* cubic-bezier(.22, 1, .36, 1), the one curve, solved for x by Newton steps */
function ease(t: number) {
  const x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1
  const bx = (s: number) => 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s
  const dbx = (s: number) => 3 * (1 - s) * (1 - s) * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s * s * (1 - x2)
  let s = t
  for (let i = 0; i < 8; i++) {
    const e = bx(s) - t
    const d = dbx(s)
    if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break
    s = Math.min(1, Math.max(0, s - e / d))
  }
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s
}
const DURATION = 620

type Tween<T> = { start: (to: T) => T; align: (from: T, to: T) => [T, T]; mix: (a: T, b: T, k: number) => T; paint: (f: T) => void }

/**
 * Moves the painted frame to `target` once, in one rAF loop that writes SVG attributes directly (no React render per
 * frame). It animates only when `sig` (the data) changes; a resize repaints in place. A timeout lands the final frame if
 * frames never come (throttled tab, screenshot).
 */
function useTween<T>(target: T, sig: string, reduce: boolean, impl: Tween<T>) {
  const implRef = React.useRef(impl)
  React.useLayoutEffect(() => {
    implRef.current = impl
  })
  const shown = React.useRef<T | null>(null)
  const lastSig = React.useRef<string | null>(null)
  React.useLayoutEffect(() => {
    const o = implRef.current
    const moving = !reduce && lastSig.current !== sig
    lastSig.current = sig
    if (!moving) {
      o.paint(target)
      shown.current = target
      return
    }
    const [a, b] = o.align(shown.current ?? o.start(target), target)
    o.paint(a)
    shown.current = a
    let raf = 0
    let t0 = -1
    const land = () => {
      o.paint(target)
      shown.current = target
    }
    const step = (now: number) => {
      if (t0 < 0) t0 = now
      const k = Math.min(1, (now - t0) / DURATION)
      if (k >= 1) return land()
      const f = o.mix(a, b, ease(k))
      o.paint(f)
      shown.current = f
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const timer = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      land()
    }, DURATION + 400)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [target, sig, reduce])
}

/** Hidden series and the focused one, shared by every chart. */
function useSeriesState(series: ChartSeries[], p: CommonProps) {
  const [hidden, setHiddenRaw] = React.useState<string[]>(() => p.defaultHidden ?? [])
  const [focusRaw, setFocusRaw] = React.useState<string | undefined>(() => p.defaultFocus ?? series[0]?.key)
  const visible = series.filter((s) => !hidden.includes(s.key))
  const focus = visible.some((s) => s.key === focusRaw) ? focusRaw : visible[0]?.key
  const onFocusChange = p.onFocusChange
  const onHiddenChange = p.onHiddenChange
  const setFocus = (k: string) => {
    if (k === focusRaw) return
    setFocusRaw(k)
    onFocusChange?.(k)
  }
  const toggle = (k: string) => {
    const on = !hidden.includes(k)
    // Keep at least one series on screen.
    if (on && visible.length <= 1) return
    const next = on ? [...hidden, k] : hidden.filter((h) => h !== k)
    setHiddenRaw(next)
    onHiddenChange?.(next)
    if (!on) setFocus(k)
  }
  return { hidden, visible, focus, setFocus, toggle }
}

/* -------------------------------------------------------------------------- */
/*                              Shared rendering                              */
/* -------------------------------------------------------------------------- */

type Sentence = { when: string; big: string; noun: string; rest: string; text: string } | null

function Readout({ s, empty }: { s: Sentence; empty: string }) {
  return (
    <p className="pch-read" aria-hidden>
      {s ? (
        <>
          {s.when && <span className="pch-when">{s.when}</span>}
          <span className="pch-big">{s.big}</span>
          <span className="pch-what">
            <b>{s.noun}</b>
            {s.rest ? `, ${s.rest}` : ""}
          </span>
        </>
      ) : (
        <span className="pch-none">{empty}</span>
      )}
    </p>
  )
}

function Legend({
  series,
  hidden,
  focus,
  colors,
  mark,
  extra,
  onToggle,
  onFocus,
}: {
  series: ChartSeries[]
  hidden: string[]
  focus: string | undefined
  colors: Record<string, Paint>
  mark: (k: string) => "line" | "box"
  extra?: (k: string) => string
  onToggle: (k: string) => void
  onFocus: (k: string) => void
}) {
  return (
    <div className="pch-keys" role="group" aria-label="Series">
      {series.map((s) => {
        const on = !hidden.includes(s.key)
        return (
          <button
            key={s.key}
            type="button"
            className="pch-key"
            data-mark={mark(s.key)}
            data-focus={on && s.key === focus ? "" : undefined}
            aria-pressed={on}
            title={on ? `Hide ${s.label}` : `Show ${s.label}`}
            style={{ "--c": colors[s.key]?.c } as React.CSSProperties}
            onClick={() => onToggle(s.key)}
            onPointerEnter={(e) => e.pointerType === "mouse" && on && onFocus(s.key)}
          >
            <i aria-hidden />
            {s.label}
            {extra && on && <em>{extra(s.key)}</em>}
          </button>
        )
      })}
    </div>
  )
}

function Frame({
  p,
  label,
  sentence,
  live,
  children,
}: {
  p: CommonProps
  label: string
  sentence: Sentence
  live: string
  children: React.ReactNode
}) {
  return (
    <figure className={cn("pch", p.className)} aria-label={label}>
      <style href="plain-charts" precedence="default">
        {CSS}
      </style>
      <div className="pch-card">
        {(p.title || p.actions) && (
          <div className="pch-head">
            {p.title && <p className="pch-title">{p.title}</p>}
            {p.actions && <div className="pch-actions">{p.actions}</div>}
          </div>
        )}
        <Readout s={sentence} empty={p.emptyLabel ?? "No data in this range"} />
        {children}
        <p className="pch-sr" role="status" aria-live="polite">
          {live}
        </p>
      </div>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Line, area, bar and combo                          */
/* -------------------------------------------------------------------------- */

type Kind = "line" | "area" | "bar" | "combo"
/** Per series, per point: x (centre for points, left edge for bars), bar width, bottom and top in pixels. */
type Track = { x: number[]; w: number[]; y0: number[]; y1: number[]; r: number[]; b: number; bar: boolean }
type Tracks = Map<string, Track>

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** Resample to n points: linearly along a line (the polyline stays exact), nearest neighbour for bars. */
function resample(arr: number[], n: number, bar: boolean): number[] {
  const m = arr.length
  if (m === n) return arr.slice()
  if (m === 0) return new Array<number>(n).fill(Number.NaN)
  if (m === 1) return new Array<number>(n).fill(arr[0]!)
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? m - 1 : (i / (n - 1)) * (m - 1)
    if (bar) out[i] = arr[Math.round(f)]!
    else {
      const j = Math.min(m - 2, Math.floor(f))
      out[i] = lerp(arr[j]!, arr[j + 1]!, f - j)
    }
  }
  return out
}
const resampleTrack = (t: Track, n: number): Track => ({
  ...t,
  x: resample(t.x, n, t.bar),
  w: resample(t.w, n, t.bar),
  y0: resample(t.y0, n, t.bar),
  y1: resample(t.y1, n, t.bar),
  r: resample(t.r, n, true),
})

function linePath(t: Track) {
  let d = ""
  let pen = false
  for (let i = 0; i < t.x.length; i++) {
    const x = t.x[i]!
    const y = t.y1[i]!
    if (!Number.isFinite(y)) {
      pen = false
      continue
    }
    d += `${pen ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`
    pen = true
  }
  return d
}
function areaPath(t: Track) {
  let d = ""
  let run: number[] = []
  const flush = () => {
    if (run.length > 1) {
      d += run.map((i, j) => `${j ? "L" : "M"}${t.x[i]!.toFixed(1)},${t.y1[i]!.toFixed(1)}`).join("")
      for (let j = run.length - 1; j >= 0; j--) d += `L${t.x[run[j]!]!.toFixed(1)},${t.y0[run[j]!]!.toFixed(1)}`
      d += "Z"
    }
    run = []
  }
  for (let i = 0; i < t.x.length; i++) {
    if (Number.isFinite(t.y1[i]!) && Number.isFinite(t.y0[i]!)) run.push(i)
    else flush()
  }
  flush()
  return d
}
function barPath(t: Track) {
  let d = ""
  for (let i = 0; i < t.x.length; i++) {
    const x = t.x[i]!
    const w = t.w[i]!
    let top = t.y1[i]!
    let bot = t.y0[i]!
    if (!Number.isFinite(top) || !Number.isFinite(bot) || w < 0.5) continue
    const down = top > bot
    if (down) [top, bot] = [bot, top]
    const h = bot - top
    if (h < 0.5) continue
    const r = !down && t.r[i]! >= 0.5 ? Math.min(2, w / 2, h) : 0
    const X = x.toFixed(1), R = (x + w).toFixed(1), T = top.toFixed(1), B = bot.toFixed(1)
    d += r
      ? `M${X},${B}V${(top + r).toFixed(1)}Q${X},${T} ${(x + r).toFixed(1)},${T}H${(x + w - r).toFixed(1)}Q${R},${T} ${R},${(top + r).toFixed(1)}V${B}Z`
      : `M${X},${B}V${T}H${R}V${B}Z`
  }
  return d
}

function Cartesian(props: CommonProps & { kind: Kind; stacked?: boolean; lineKey?: string }) {
  const { data, series, kind, stacked = false, unit, format = "compact", currency = "USD", height = 220, legend = true, onActiveChange } = props
  const label = props.label ?? props.title ?? "Chart"
  const reduce = useReducedMotion()
  const [wrapRef, cw] = useWidth()
  const { hidden, visible, focus, setFocus, toggle } = useSeriesState(series, props)
  const [active, setActiveRaw] = React.useState<number | null>(null)
  const [live, setLive] = React.useState("")
  const setActive = (i: number | null) => {
    if (i === active) return
    setActiveRaw(i)
    onActiveChange?.(i)
  }

  const n = data.length
  const rows = React.useMemo(() => data.map(rowInfo), [data])
  const lineKey = kind === "combo" ? (props.lineKey ?? series[series.length - 1]?.key) : undefined
  const isBar = (k: string) => kind === "bar" || (kind === "combo" && k !== lineKey)
  const banded = kind === "bar" || kind === "combo"
  const fmtOf = (k: string) => series.find((s) => s.key === k)?.format ?? format
  const visKeys = visible.map((s) => s.key)
  const hasData = n > 0 && visKeys.some((k) => data.some((d) => num(d, k) != null))

  /* ------------------------------- Geometry -------------------------------- */
  const geo = React.useMemo(() => {
    const leftKeys = visKeys.filter((k) => k !== lineKey)
    const rightKeys = lineKey && visKeys.includes(lineKey) ? [lineKey] : []
    const stackLeft = stacked && (kind === "area" || kind === "bar" || kind === "combo")
    let lo = 0
    let hi = 0
    for (const d of data) {
      if (stackLeft) {
        let pos = 0
        let neg = 0
        for (const k of leftKeys) {
          const v = num(d, k) ?? 0
          if (v >= 0) pos += v
          else neg += v
        }
        hi = Math.max(hi, pos)
        lo = Math.min(lo, neg)
      } else {
        for (const k of leftKeys) {
          const v = num(d, k)
          if (v != null) {
            hi = Math.max(hi, v)
            lo = Math.min(lo, v)
          }
        }
      }
    }
    let rhi = 0
    let rlo = 0
    for (const d of data)
      for (const k of rightKeys) {
        const v = num(d, k)
        if (v != null) {
          rhi = Math.max(rhi, v)
          rlo = Math.min(rlo, v)
        }
      }
    const top = 8
    const bottom = height - 26
    const count = Math.max(2, Math.round((bottom - top) / 46))
    const L = niceTicks(lo, hi, count)
    const R = rightKeys.length ? niceTicks(rlo, rhi, L.ticks.length - 1) : null
    const leftFmt = fmtOf(leftKeys[0] ?? visKeys[0] ?? "")
    const rightFmt = lineKey ? fmtOf(lineKey) : format
    const lLabels = L.ticks.map((t) => formatNumber(t, leftFmt, currency, "axis"))
    const rLabels = R ? R.ticks.map((t) => formatNumber(t, rightFmt, currency, "axis")) : []
    const textW = (s: string) => s.length * 6.9
    const left = Math.ceil(Math.max(16, ...lLabels.map(textW)) + 10)
    const right = cw - (R ? Math.ceil(Math.max(16, ...rLabels.map(textW)) + 10) : banded ? 0 : 6)
    const pw = Math.max(10, right - left)
    const band = pw / Math.max(1, n)
    const px = (i: number) => (banded ? left + band * (i + 0.5) : n <= 1 ? left + pw / 2 : left + (i / (n - 1)) * pw)
    const yL = (v: number) => bottom - ((v - L.min) / (L.max - L.min)) * (bottom - top)
    const yR = R ? (v: number) => bottom - ((v - R.min) / (R.max - R.min)) * (bottom - top) : yL
    const zeroL = yL(Math.max(L.min, Math.min(L.max, 0)))
    const zeroR = R ? yR(Math.max(R.min, Math.min(R.max, 0))) : zeroL

    const frame: Tracks = new Map()
    const barKeys = series.filter((s) => isBar(s.key)).map((s) => s.key)
    const visBars = barKeys.filter((k) => visKeys.includes(k))
    const groupW = Math.min(band * (n <= 10 ? 0.62 : 0.74), stacked ? 44 : 22 * Math.max(1, visBars.length) + 8)
    const gap = visBars.length > 1 && groupW / visBars.length > 6 ? 2 : visBars.length > 1 ? 1 : 0
    const subW = stacked ? groupW : (groupW - gap * Math.max(0, visBars.length - 1)) / Math.max(1, visBars.length)
    const cumPos = new Array<number>(n).fill(0)
    const cumNeg = new Array<number>(n).fill(0)
    // Which stacked segment is on top of each column (the only one with rounded corners).
    const topKey = new Array<string | null>(n).fill(null)
    if (stackLeft)
      for (let i = 0; i < n; i++)
        for (const k of (kind === "area" ? leftKeys : visBars)) if ((num(data[i], k) ?? 0) > 0) topKey[i] = k

    for (const s of series) {
      const k = s.key
      const bar = isBar(k)
      const shown = visKeys.includes(k)
      const onRight = k === lineKey
      const y = onRight ? yR : yL
      const base = onRight ? zeroR : zeroL
      const t: Track = { x: [], w: [], y0: [], y1: [], r: [], b: base, bar }
      const slot = visBars.indexOf(k)
      for (let i = 0; i < n; i++) {
        const v = num(data[i], k)
        const cx = px(i)
        if (bar) {
          if (stacked) {
            const val = shown ? (v ?? 0) : 0
            const from = val >= 0 ? cumPos[i]! : cumNeg[i]!
            const to = from + val
            if (val >= 0) cumPos[i] = to
            else cumNeg[i] = to
            t.x.push(cx - groupW / 2)
            t.w.push(groupW)
            t.y0.push(y(from))
            t.y1.push(y(to))
            t.r.push(topKey[i] === k ? 1 : 0)
          } else {
            t.x.push(shown ? cx - groupW / 2 + slot * (subW + gap) : cx)
            t.w.push(shown ? subW : 0)
            t.y0.push(base)
            t.y1.push(shown && v != null ? y(v) : base)
            t.r.push(1)
          }
        } else if (kind === "area" && stacked) {
          const val = shown ? (v ?? 0) : 0
          const from = cumPos[i]!
          cumPos[i] = from + val
          t.x.push(cx)
          t.w.push(0)
          t.y0.push(y(from))
          t.y1.push(v == null && shown ? Number.NaN : y(from + val))
          t.r.push(0)
        } else {
          t.x.push(cx)
          t.w.push(0)
          t.y0.push(base)
          t.y1.push(v == null ? Number.NaN : y(v))
          t.r.push(0)
        }
      }
      frame.set(k, t)
    }

    // x labels: as many as fit, counted back from the latest; whole weeks for long runs of days.
    const maxLabels = Math.max(2, Math.floor(pw / 64))
    let every = Math.max(1, Math.ceil(n / maxLabels))
    if (rows[0]?.ms != null && n > 14 && every > 1 && every < 7) every = 7
    else if (rows[0]?.ms != null && every > 7) every = 7 * Math.ceil(every / 7)
    const xTicks: number[] = []
    for (let i = n - 1; i >= 0; i -= every) xTicks.unshift(i)

    return { top, bottom, left, right, pw, band, px, L, R, lLabels, rLabels, yL, yR, frame, xTicks, groupW, stackLeft, leftKeys }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, hidden, kind, stacked, lineKey, cw, height, format, currency, rows])

  /* ------------------------------- Painting -------------------------------- */
  const els = React.useRef(new Map<string, Partial<Record<"line" | "halo" | "area" | "bar", SVGPathElement | null>>>())
  const setEl = (k: string, part: "line" | "halo" | "area" | "bar") => (el: SVGPathElement | null) => {
    const e = els.current.get(k) ?? {}
    e[part] = el
    els.current.set(k, e)
  }
  const sig = JSON.stringify([data, series.map((s) => s.key), hidden, stacked, kind, lineKey, height])
  useTween<Tracks>(geo.frame, sig, reduce, {
    start: (to) => {
      const f: Tracks = new Map()
      for (const [k, t] of to) f.set(k, { ...t, y0: t.y0.map(() => t.b), y1: t.y1.map((v) => (Number.isFinite(v) ? t.b : v)) })
      return f
    },
    align: (from, to) => {
      const a: Tracks = new Map()
      const b: Tracks = new Map()
      for (const [k, t] of to) {
        const flat = { ...t, y0: t.y0.map(() => t.b), y1: t.y1.map(() => t.b) }
        const o = from.get(k) ?? flat
        const N = Math.max(o.x.length, t.x.length)
        a.set(k, resampleTrack({ ...o, bar: t.bar }, N))
        b.set(k, resampleTrack(t, N))
      }
      return [a, b]
    },
    mix: (a, b, e) => {
      const f: Tracks = new Map()
      for (const [k, tb] of b) {
        const ta = a.get(k)!
        const m = (p: number[], q: number[]) => q.map((v, i) => lerp(p[i]!, v, e))
        f.set(k, { ...tb, x: m(ta.x, tb.x), w: m(ta.w, tb.w), y0: m(ta.y0, tb.y0), y1: m(ta.y1, tb.y1) })
      }
      return f
    },
    paint: (f) => {
      for (const [k, t] of f) {
        const e = els.current.get(k)
        if (!e) continue
        e.bar?.setAttribute("d", barPath(t))
        if (e.line || e.halo) {
          const d = linePath(t)
          e.line?.setAttribute("d", d)
          e.halo?.setAttribute("d", d)
        }
        e.area?.setAttribute("d", areaPath(t))
      }
    },
  })

  /* ------------------------------- Sentence -------------------------------- */
  const lastIndex = (() => {
    if (!focus) return n - 1
    for (let i = n - 1; i >= 0; i--) if (num(data[i], focus) != null) return i
    return n - 1
  })()
  const idx = active ?? lastIndex
  const sentenceFor = (i: number, k: string | undefined): Sentence => {
    if (!hasData || !k || i < 0 || i >= n) return null
    const s = series.find((x) => x.key === k)
    if (!s) return null
    const f = fmtOf(k)
    const v = num(data[i], k)
    const when = rows[i]!.long
    const noun = s.noun ?? [s.label, unit].filter(Boolean).join(" ")
    const big = v == null ? "No data" : formatNumber(v, f, currency, "value")
    const rest = change(v, num(data[i - 1], k), f, prevWords(rows, i))
    return { when, big, noun, rest, text: `${when}: ${big} ${noun}${rest ? `, ${rest}` : ""}.` }
  }
  const sentence = sentenceFor(idx, focus)

  /* ------------------------------ Interaction ------------------------------ */
  const svgRef = React.useRef<SVGSVGElement>(null)
  const indexAt = (x: number) => {
    if (n <= 1) return 0
    const i = banded ? Math.floor((x - geo.left) / geo.band) : Math.round(((x - geo.left) / geo.pw) * (n - 1))
    return Math.max(0, Math.min(n - 1, i))
  }
  const seriesAt = (i: number, x: number, y: number): string | undefined => {
    // A line close to the pointer wins, then the bar or stacked area under it, then a line a little further away.
    let best: string | undefined
    let bestD = Infinity
    let hit: string | undefined
    for (const k of visKeys) {
      const t = geo.frame.get(k)
      if (!t) continue
      const top = t.y1[i]!
      const bot = t.y0[i]!
      if (!Number.isFinite(top)) continue
      if (t.bar) {
        const inX = x >= t.x[i]! - 1.5 && x <= t.x[i]! + t.w[i]! + 1.5
        const inY = y >= Math.min(top, bot) - 6 && y <= Math.max(top, bot) + 2
        if (!hit && inX && (stacked ? inY : true)) hit = k
      } else {
        if (kind === "area" && stacked && !hit && y >= top && y <= bot) hit = k
        const d = Math.abs(top - y)
        if (d < bestD) {
          bestD = d
          best = k
        }
      }
    }
    if (bestD < 10) return best
    return hit ?? (bestD < 26 ? best : undefined)
  }
  const onPointer = (e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg || !hasData) return
    const b = svg.getBoundingClientRect()
    const x = e.clientX - b.left
    const y = e.clientY - b.top
    const i = indexAt(x)
    setActive(i)
    const k = seriesAt(i, x, y)
    if (k) setFocus(k)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hasData) return
    const cur = active ?? lastIndex
    let i = cur
    let k = focus
    const vi = visKeys.indexOf(focus ?? "")
    switch (e.key) {
      case "ArrowRight":
        i = Math.min(n - 1, cur + 1)
        break
      case "ArrowLeft":
        i = Math.max(0, cur - 1)
        break
      case "Home":
        i = 0
        break
      case "End":
        i = n - 1
        break
      case "ArrowDown":
        k = visKeys[(vi + 1) % visKeys.length]
        break
      case "ArrowUp":
        k = visKeys[(vi - 1 + visKeys.length) % visKeys.length]
        break
      case "Escape":
        if (active == null) return
        setActive(null)
        setLive(sentenceFor(lastIndex, focus)?.text ?? "")
        e.preventDefault()
        return
      default:
        return
    }
    e.preventDefault()
    setActive(i)
    if (k && k !== focus) setFocus(k)
    setLive(sentenceFor(i, k)?.text ?? "")
  }

  /* -------------------------------- Render --------------------------------- */
  const colors = palette(
    visKeys,
    focus,
    kind === "line" || kind === "area" ? "line" : "box",
  )
  // The combo line crosses the bars, so when it is not the focus it stays a clear mid-ink rather than a faint one.
  if (lineKey && colors[lineKey] && lineKey !== focus) colors[lineKey] = { c: ink(52), cf: ink(4) }
  const hiddenColors = Object.fromEntries(series.filter((s) => !visKeys.includes(s.key)).map((s) => [s.key, { c: ink(20), cf: ink(4) }]))
  const allColors = { ...hiddenColors, ...colors }
  const { top, bottom, left, right, px, L, R, lLabels, rLabels } = geo
  const focusTrack = focus ? geo.frame.get(focus) : undefined
  const dotOn = focusTrack && !focusTrack.bar && hasData && Number.isFinite(focusTrack.y1[idx] ?? Number.NaN)
  const ticksKey = `${L.ticks.join()}|${R?.ticks.join() ?? ""}`
  const drawOrder = [
    ...series.filter((s) => isBar(s.key)),
    ...series.filter((s) => !isBar(s.key) && s.key !== focus),
    ...series.filter((s) => !isBar(s.key) && s.key === focus),
  ]
  const kindWord = kind === "combo" ? "bar and line chart" : kind === "area" ? "area chart" : kind === "bar" ? "bar chart" : "line chart"
  const along = rows[0]?.ms != null ? "days" : "points"

  return (
    <Frame p={props} label={label} sentence={sentence} live={live}>
      <div
        ref={wrapRef}
        className="pch-plot"
        role="group"
        tabIndex={hasData ? 0 : -1}
        aria-roledescription={kindWord}
        aria-label={`${label}. Left and right arrows move between ${along}; up and down change series; Escape returns to the latest.`}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible") && active == null && hasData) {
            setActive(lastIndex)
            setLive(sentenceFor(lastIndex, focus)?.text ?? "")
          }
        }}
        onBlur={() => setActive(null)}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") e.currentTarget.setPointerCapture(e.pointerId)
          onPointer(e)
        }}
        onPointerMove={onPointer}
        onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
      >
        <svg ref={svgRef} width={cw} height={height} viewBox={`0 0 ${cw} ${height}`} aria-hidden>
          <g className="pch-grid pch-fade" key={`g${ticksKey}`}>
            {L.ticks.map((t) => {
              const y = Math.round(geo.yL(t)) + 0.5
              return <line key={t} x1={left} x2={banded || R ? right : cw} y1={y} y2={y} data-zero={t === 0 || undefined} />
            })}
          </g>
          {hasData && (
            <g className="pch-fade" key={`t${ticksKey}`}>
              {L.ticks.map((t, i) => (
                <text key={t} className="pch-tick" x={left - 10} y={geo.yL(t)} dy=".32em" textAnchor="end">
                  {lLabels[i]}
                </text>
              ))}
              {R &&
                R.ticks.map((t, i) => (
                  <text key={t} className="pch-tick" x={right + 10} y={geo.yR(t)} dy=".32em" textAnchor="start">
                    {rLabels[i]}
                  </text>
                ))}
            </g>
          )}
          {hasData &&
            geo.xTicks.map((i) => {
              // Centred under its point or band, unless that would run past the plot's edge.
              const half = (rows[i]!.tick.length * 6.6) / 2
              let x = px(i)
              let anchor: "start" | "middle" | "end" = "middle"
              if (n > 1 && x + half > cw) {
                anchor = "end"
                x = Math.min(cw, banded ? right : x)
              } else if (n > 1 && x - half < left - 4) {
                anchor = "start"
                x = banded ? left : x
              }
              return (
                <text key={i} className="pch-tick" data-on={active === i || undefined} x={x} y={height - 6} textAnchor={anchor}>
                  {rows[i]!.tick}
                </text>
              )
            })}

          {hasData && active != null && banded && (
            <rect className="pch-band" x={left + geo.band * active} y={top} width={geo.band} height={bottom - top} rx={4} />
          )}

          {drawOrder.map((s) => {
            const k = s.key
            const c = allColors[k]!
            const off = !visKeys.includes(k) || undefined
            const style = { "--c": c.c, "--cf": c.cf } as React.CSSProperties
            if (isBar(k)) return <path key={k} ref={setEl(k, "bar")} className="pch-bar" style={style} data-hidden={off} />
            return (
              <g key={k} style={style} data-hidden={off}>
                {kind === "area" && <path ref={setEl(k, "area")} className="pch-area" />}
                {kind === "combo" && <path ref={setEl(k, "halo")} className="pch-halo" />}
                <path ref={setEl(k, "line")} className="pch-line" data-focus={k === focus || undefined} />
              </g>
            )
          })}

          {hasData && active != null && !banded && (
            <line className="pch-cross" x1={Math.round(px(active)) + 0.5} x2={Math.round(px(active)) + 0.5} y1={top} y2={bottom} />
          )}
          {dotOn && focusTrack && <circle className="pch-dot" cx={px(idx)} cy={focusTrack.y1[idx]} r={4} />}

          {!hasData && (
            <text className="pch-empty" x={cw / 2} y={(top + bottom) / 2} dy=".32em" textAnchor="middle">
              {props.emptyLabel ?? "No data in this range"}
            </text>
          )}
        </svg>
      </div>

      {legend && series.length > 0 && (
        <Legend
          series={series}
          hidden={hidden}
          focus={focus}
          colors={allColors}
          mark={(k) => (isBar(k) ? "box" : "line")}
          onToggle={toggle}
          onFocus={setFocus}
        />
      )}

      <table className="pch-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{along === "days" ? "Day" : "Point"}</th>
            {visible.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.x + i}>
              <th scope="row">{rows[i]!.long}</th>
              {visible.map((s) => {
                const v = num(d, s.key)
                return <td key={s.key}>{v == null ? "–" : formatNumber(v, fmtOf(s.key), currency, "value")}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  )
}

/** Lines over a shared x axis. The focused series is the accent line; the rest are thin ink lines. */
export function LineChart(props: LineChartProps) {
  return <Cartesian {...props} kind="line" />
}

/** Lines with a flat fill to the baseline (no gradients). `stacked` piles the areas so the top edge is the total. */
export function AreaChart(props: AreaChartProps) {
  return <Cartesian {...props} kind="area" />
}

/** Bars per x, side by side by default or `stacked` in one column. */
export function BarChart(props: BarChartProps) {
  return <Cartesian {...props} kind="bar" />
}

/** Bars on the left scale plus one series (`lineKey`, default the last) drawn as a line on its own right-hand scale. */
export function ComboChart(props: ComboChartProps) {
  return <Cartesian {...props} kind="combo" />
}

/* -------------------------------------------------------------------------- */
/*                                    Donut                                   */
/* -------------------------------------------------------------------------- */

type Arcs = Map<string, { a0: number; a1: number }>
const START = -Math.PI / 2

function arcPath(cx: number, cy: number, R: number, r: number, a0: number, a1: number): string {
  const span = a1 - a0
  if (span < 0.0005) return ""
  if (span > Math.PI * 2 - 0.0005) {
    // A full ring: two halves, since one arc cannot end where it starts.
    return `${arcPath(cx, cy, R, r, a0, a0 + Math.PI)}${arcPath(cx, cy, R, r, a0 + Math.PI, a0 + Math.PI * 2 - 0.0001)}`
  }
  const big = span > Math.PI ? 1 : 0
  const p = (rad: number, a: number) => `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`
  return `M${p(R, a0)}A${R},${R} 0 ${big} 1 ${p(R, a1)}L${p(r, a1)}A${r},${r} 0 ${big} 0 ${p(r, a0)}Z`
}

/** Each series' share of the total (the sum of all rows, or one row with `at`), as slices of one ring. */
export function DonutChart(props: DonutChartProps) {
  const { data, series, at, period, unit, format = "compact", currency = "USD", height = 200, legend = true } = props
  const label = props.label ?? props.title ?? "Chart"
  const reduce = useReducedMotion()
  const [wrapRef, cw] = useWidth()
  const { hidden, visible, focus, setFocus, toggle } = useSeriesState(series, props)
  const [live, setLive] = React.useState("")
  const fmtOf = (k: string) => series.find((s) => s.key === k)?.format ?? format

  const values = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const s of series) {
      if (at != null) out[s.key] = Math.max(0, num(data[at], s.key) ?? 0)
      else out[s.key] = data.reduce((sum, d) => sum + Math.max(0, num(d, s.key) ?? 0), 0)
    }
    return out
  }, [data, series, at])
  const visKeys = visible.map((s) => s.key)
  const total = visKeys.reduce((s, k) => s + (values[k] ?? 0), 0)
  const hasData = total > 0

  const D = Math.max(120, Math.min(height, cw - 8))
  const cx = cw / 2
  const cy = D / 2
  const R = D / 2 - 1
  const thick = Math.max(16, Math.min(30, D * 0.14))
  const r = R - thick

  const arcs = React.useMemo(() => {
    const m: Arcs = new Map()
    const gap = visKeys.length > 1 ? 2 / R : 0
    let a = START
    for (const s of series) {
      const v = visKeys.includes(s.key) && hasData ? (values[s.key] ?? 0) : 0
      const span = hasData ? (v / total) * Math.PI * 2 : 0
      m.set(s.key, { a0: a + (span > gap * 2 ? gap / 2 : 0), a1: a + span - (span > gap * 2 ? gap / 2 : 0) })
      a += span
    }
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, values, hidden, total, R])

  const els = React.useRef(new Map<string, SVGPathElement | null>())
  const geoRef = React.useRef({ cx, cy, R, r })
  React.useLayoutEffect(() => {
    geoRef.current = { cx, cy, R, r }
  })
  const sig = JSON.stringify([values, hidden, at])
  useTween<Arcs>(arcs, sig, reduce, {
    start: (to) => {
      const m: Arcs = new Map()
      for (const k of to.keys()) m.set(k, { a0: START, a1: START })
      return m
    },
    align: (from, to) => {
      const m: Arcs = new Map()
      for (const [k, v] of to) m.set(k, from.get(k) ?? { a0: v.a0, a1: v.a0 })
      return [m, to]
    },
    mix: (a, b, e) => {
      const m: Arcs = new Map()
      for (const [k, v] of b) {
        const o = a.get(k) ?? v
        m.set(k, { a0: lerp(o.a0, v.a0, e), a1: lerp(o.a1, v.a1, e) })
      }
      return m
    },
    paint: (f) => {
      const g = geoRef.current
      for (const [k, v] of f) els.current.get(k)?.setAttribute("d", arcPath(g.cx, g.cy, g.R, g.r, v.a0, v.a1))
    },
  })

  const share = (k: string) => (total > 0 ? ((values[k] ?? 0) / total) * 100 : 0)
  const shareText = (k: string) => `${dec(share(k), share(k) < 10 ? 1 : 0)}%`
  const sentenceFor = (k: string | undefined): Sentence => {
    if (!hasData || !k) return null
    const s = series.find((x) => x.key === k)
    if (!s) return null
    const big = formatNumber(values[k] ?? 0, fmtOf(k), currency, "value")
    const noun = s.noun ?? [s.label, unit].filter(Boolean).join(" ")
    const rest = `${period ? `${period}, ` : ""}${shareText(k)} of the total`
    return { when: "", big, noun, rest, text: `${big} ${noun}, ${rest}.` }
  }

  const onPointer = (e: React.PointerEvent) => {
    if (!hasData) return
    const b = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - b.left - cx
    const dy = e.clientY - b.top - cy
    const d = Math.hypot(dx, dy)
    if (d < r - 8 || d > R + 8) return
    let a = Math.atan2(dy, dx)
    while (a < START) a += Math.PI * 2
    for (const [k, v] of arcs) if (visKeys.includes(k) && a >= v.a0 - 0.02 && a <= v.a1 + 0.02) return setFocus(k)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hasData) return
    const vi = visKeys.indexOf(focus ?? "")
    let k: string | undefined
    if (e.key === "ArrowRight" || e.key === "ArrowDown") k = visKeys[(vi + 1) % visKeys.length]
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") k = visKeys[(vi - 1 + visKeys.length) % visKeys.length]
    else if (e.key === "Home") k = visKeys[0]
    else if (e.key === "End") k = visKeys[visKeys.length - 1]
    if (!k) return
    e.preventDefault()
    setFocus(k)
    setLive(sentenceFor(k)?.text ?? "")
  }

  const colors = palette(visKeys, focus, "box")
  const allColors = { ...Object.fromEntries(series.map((s) => [s.key, { c: ink(20), cf: ink(4) }])), ...colors }
  const totalFmt = fmtOf(visKeys[0] ?? "")

  return (
    <Frame p={props} label={label} sentence={sentenceFor(focus)} live={live}>
      <div
        ref={wrapRef}
        className="pch-plot"
        role="group"
        tabIndex={hasData ? 0 : -1}
        aria-roledescription="donut chart"
        aria-label={`${label}. Arrow keys move between slices.`}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setLive(sentenceFor(focus)?.text ?? "")
        }}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
      >
        <svg width={cw} height={D} viewBox={`0 0 ${cw} ${D}`} aria-hidden>
          <circle cx={cx} cy={cy} r={R - thick / 2} fill="none" stroke="var(--pch-fill)" strokeWidth={thick} />
          {series.map((s) => (
            <path
              key={s.key}
              ref={(el) => void els.current.set(s.key, el)}
              className="pch-slice"
              style={{ "--c": allColors[s.key]!.c } as React.CSSProperties}
            />
          ))}
          {hasData ? (
            <>
              <text className="pch-total" x={cx} y={cy - 2} textAnchor="middle">
                {formatNumber(total, totalFmt, currency, "value")}
              </text>
              <text className="pch-total-l" x={cx} y={cy + 18} textAnchor="middle">
                Total
              </text>
            </>
          ) : (
            <text className="pch-empty" x={cx} y={cy} dy=".32em" textAnchor="middle">
              {props.emptyLabel ?? "No data in this range"}
            </text>
          )}
        </svg>
      </div>

      {legend && series.length > 0 && (
        <Legend
          series={series}
          hidden={hidden}
          focus={focus}
          colors={allColors}
          mark={() => "box"}
          extra={hasData ? shareText : undefined}
          onToggle={toggle}
          onFocus={setFocus}
        />
      )}

      <table className="pch-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Series</th>
            <th scope="col">Value</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr key={s.key}>
              <th scope="row">{s.label}</th>
              <td>{formatNumber(values[s.key] ?? 0, fmtOf(s.key), currency, "value")}</td>
              <td>{shareText(s.key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  )
}

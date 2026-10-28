"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type CohortRow = {
  /** Row label, for example "Aug 2025". */
  label: string
  /** How many accounts joined in this cohort. */
  size: number
  /** Accounts still active in month 1, 2, 3 and so on. Only the months already measured; later months are left out. */
  retained: number[]
}

export type CohortSegment = {
  id: string
  /** Label on the segment switch. */
  label: string
  cohorts: CohortRow[]
}

export type CohortRetentionProps = {
  /** The segments to compare. The cohorts of all segments must line up. Leave it out for two sample segments. */
  segments?: CohortSegment[]
  /** Adds a first "All" option that sums the segments. Defaults to true. */
  includeAll?: boolean
  /** Heading of the card. */
  title?: string
  /** Line under the heading. Defaults to a sentence about monthly activity. */
  subtitle?: string
  /** Noun used in tooltips and the third figure, for example "workspaces". Defaults to "workspaces". */
  noun?: string
  /** Called when the cell under the cursor changes (null when cleared). */
  onCursorChange?: (cell: { cohort: string; month: number; rate: number } | null) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const COHORT_LABELS = ["Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026"]
const SIZES = [360, 386, 402, 416, 395, 398, 461, 434, 459, 502, 495, 491]

/** A sample segment: a curve that starts at m1 percent in month 1 and settles near m12 percent, improving a little with every cohort. */
function simulate(seed: number, share: number, m1: number, m12: number, gain: number): CohortRow[] {
  const rnd = mulberry(seed)
  return COHORT_LABELS.map((label, i) => {
    const size = Math.round(SIZES[i] * share + (rnd() - 0.5) * 8)
    const measured = 12 - i
    const retained: number[] = []
    for (let m = 1; m <= measured; m++) {
      const f = (Math.exp(-(m - 1) / 3.7) - Math.exp(-11 / 3.7)) / (1 - Math.exp(-11 / 3.7))
      const base = m12 + (m1 + gain * i - m12) * f + (gain * i * 0.25 * (m - 1)) / 11
      const r = Math.min(97, base + (rnd() - 0.5) * 2.6)
      retained.push(Math.round((size * r) / 100))
    }
    return { label, size, retained }
  })
}

const DEFAULT_SEGMENTS: CohortSegment[] = [
  { id: "self", label: "Self-serve", cohorts: simulate(11, 0.7, 70.5, 31, 0.5) },
  { id: "sales", label: "Sales-led", cohorts: simulate(23, 0.3, 84, 54, 0.45) },
]

/* -------------------------------------------------------------------------- */
/*                                 Table maths                                */
/* -------------------------------------------------------------------------- */

const NC = 12
const AVG = 12

type Table = {
  /** Cohort sizes and the average row total. */
  sizes: number[]
  /** Rates in percent, indexed row * 12 + month (month 0 is month 1). NaN where not measured. */
  rate: Float64Array
  retained: Float64Array
  /** Cohorts (rows) that have this month measured, for the average. */
  measured: number[]
}

function tableOf(cohorts: CohortRow[]): Table {
  const rate = new Float64Array(13 * NC).fill(NaN)
  const ret = new Float64Array(13 * NC).fill(NaN)
  const sizes: number[] = []
  const measured = new Array(NC).fill(0)
  cohorts.slice(0, 12).forEach((c, r) => {
    sizes.push(c.size)
    c.retained.slice(0, NC).forEach((n, m) => {
      rate[r * NC + m] = (n / Math.max(1, c.size)) * 100
      ret[r * NC + m] = n
      measured[m]++
    })
  })
  for (let m = 0; m < NC; m++) {
    let n = 0, s = 0
    cohorts.slice(0, 12).forEach((c) => {
      if (c.retained[m] !== undefined) { n += c.retained[m]; s += c.size }
    })
    if (s) { rate[AVG * NC + m] = (n / s) * 100; ret[AVG * NC + m] = n }
  }
  sizes.push(sizes.reduce((a, b) => a + b, 0))
  return { sizes, rate, retained: ret, measured }
}

function combine(segs: CohortSegment[]): CohortRow[] {
  return segs[0].cohorts.map((c, i) => {
    const retained: number[] = []
    for (let m = 0; m < c.retained.length; m++) retained.push(segs.reduce((s, g) => s + (g.cohorts[i]?.retained[m] ?? 0), 0))
    return { label: c.label, size: segs.reduce((s, g) => s + (g.cohorts[i]?.size ?? 0), 0), retained }
  })
}

/** Average rate of the last three cohorts that have the month, minus the first three. */
function delta(t: Table, month: number) {
  const rows: number[] = []
  for (let r = 0; r < 12; r++) if (!Number.isNaN(t.rate[r * NC + month])) rows.push(t.rate[r * NC + month])
  if (rows.length < 4) return 0
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  return mean(rows.slice(-3)) - mean(rows.slice(0, 3))
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.chr {
  --chr-rgb: 0 0 0;
  --chr-surface-rgb: 255 255 255;
  --chr-accent-rgb: 0 96 226;
  --chr-ink: rgb(var(--chr-rgb));
  --chr-surface: rgb(var(--chr-surface-rgb));
  --chr-accent: rgb(var(--chr-accent-rgb));
  --chr-good: #1f8f44;
  --chr-bad: #c8322b;
  --chr-t1: color-mix(in oklab, var(--chr-ink) 88%, transparent);
  --chr-t2: color-mix(in oklab, var(--chr-ink) 61%, transparent);
  --chr-t3: color-mix(in oklab, var(--chr-ink) 45%, transparent);
  --chr-t4: color-mix(in oklab, var(--chr-ink) 27%, transparent);
  --chr-fill: color-mix(in oklab, var(--chr-ink) 5.5%, transparent);
  --chr-line: color-mix(in oklab, var(--chr-ink) 7%, transparent);
  --chr-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px rgb(0 0 0 / .12), 0 2px 6px rgb(0 0 0 / .06);
  --chr-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 820px;
  margin-inline: auto;
  container-type: inline-size;
  background: var(--chr-surface);
  color: var(--chr-t1);
  border: 1px solid color-mix(in oklab, var(--chr-ink) 7.5%, transparent);
  border-radius: 16px;
  padding: 16px 20px 18px;
  font-family: var(--chr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .chr {
  --chr-rgb: 255 255 255;
  --chr-surface-rgb: 28 28 30;
  --chr-accent-rgb: 77 141 255;
  --chr-good: #3fb866;
  --chr-bad: #f0645a;
  --chr-t1: color-mix(in oklab, var(--chr-ink) 90%, transparent);
  --chr-t2: color-mix(in oklab, var(--chr-ink) 62%, transparent);
  --chr-t3: color-mix(in oklab, var(--chr-ink) 46%, transparent);
  --chr-t4: color-mix(in oklab, var(--chr-ink) 28%, transparent);
  --chr-fill: color-mix(in oklab, var(--chr-ink) 8%, transparent);
  --chr-line: color-mix(in oklab, var(--chr-ink) 9%, transparent);
  --chr-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px rgb(0 0 0 / .5);
}
.chr *, .chr *::before, .chr *::after { box-sizing: border-box }
:where(.chr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.chr) :is(h2, h3, p, dl, dd, dt, ul, li, table) { margin: 0; padding: 0 }
.chr :focus-visible { outline: 2px solid color-mix(in oklab, var(--chr-accent) 60%, transparent); outline-offset: 2px }
.chr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.chr-num { font-variant-numeric: tabular-nums }

/* ---- header ---- */
.chr-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap }
.chr-title { font-size: 16px; line-height: 20px; font-weight: 500 }
.chr-sub { color: var(--chr-t3); margin-top: 1px; font-size: 13px; max-width: 36ch; text-wrap: pretty }
.chr-seg { position: relative; display: inline-flex; padding: 3px; gap: 2px; border-radius: 12px; background: var(--chr-fill) }
.chr-thumb { position: absolute; top: 3px; bottom: 3px; left: 0; width: 0; border-radius: 9px; background: var(--chr-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transition: transform .38s var(--chr-ease), width .38s var(--chr-ease); pointer-events: none }
:is(.dark, [data-theme="dark"]) .chr-thumb { background: color-mix(in oklab, var(--chr-surface) 78%, #fff) }
.chr-opt { position: relative; height: 30px; padding: 0 11px; border-radius: 9px; font-weight: 500; font-size: 13px; color: var(--chr-t3); white-space: nowrap; transition: color .2s var(--chr-ease) }
.chr-opt[aria-checked="true"] { color: var(--chr-t1) }

/* ---- kpis ---- */
.chr-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 16px }
.chr-kpi { padding: 0 20px; border-left: 1px solid var(--chr-line); min-width: 0 }
.chr-kpi:first-child { padding-left: 0; border-left: 0 }
.chr-kpi:last-child { padding-right: 0 }
.chr-label { display: block; font-size: 13px; line-height: 18px; color: var(--chr-t2) }
.chr-kv { display: block; font-size: 22px; line-height: 30px; font-weight: 500; letter-spacing: -.012em; margin-top: 2px }
.chr-delta { display: flex; align-items: center; gap: 3px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--chr-good) }
.chr-delta[data-down] { color: var(--chr-bad) }
.chr-ctx { display: block; font-size: 12px; line-height: 16px; color: var(--chr-t3); margin-top: 1px }

/* ---- legend row ---- */
.chr-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px 20px; flex-wrap: wrap; margin-top: 18px }
.chr-legend { display: flex; align-items: center; gap: 10px; font-size: 12px; line-height: 16px; color: var(--chr-t3); min-height: 32px }
.chr-ramp { display: flex; flex-direction: column; gap: 2px }
.chr-ramp-sw { display: grid; grid-template-columns: repeat(5, 28px); gap: 1px }
.chr-ramp-sw i { display: block; height: 9px; background: color-mix(in oklab, var(--chr-ink) calc(var(--a) * 1%), transparent) }
.chr-ramp-sw i:first-child { border-radius: 3px 0 0 3px }
.chr-ramp-sw i:last-child { border-radius: 0 3px 3px 0 }
.chr-ramp-ticks { display: grid; grid-template-columns: repeat(5, 28px); gap: 1px; font-variant-numeric: tabular-nums; font-size: 11px; line-height: 12px }
.chr-ramp-ticks span { text-align: center }
.chr-legend-in { animation: chr-rise .45s var(--chr-ease) backwards; display: flex; align-items: center; gap: 10px }
.chr-age { display: inline-block; width: 64px; height: 6px; border-radius: 9999px; background: linear-gradient(90deg, color-mix(in oklab, var(--chr-ink) 25%, transparent), color-mix(in oklab, var(--chr-ink) 85%, transparent)) }
.chr-avgkey { display: inline-flex; align-items: center; gap: 6px }
.chr-avgkey i { display: block; width: 14px; height: 2.5px; border-radius: 9999px; background: var(--chr-accent) }
@keyframes chr-rise { from { opacity: 0; transform: translateY(3px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }

/* ---- chart ---- */
.chr-chart { position: relative; margin-top: 12px; outline-offset: 4px; border-radius: 8px; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.chr-svg { display: block; width: 100%; overflow: visible }
.chr-cell { transition: none }
.chr-val { font-size: 12px; font-weight: 500; text-anchor: middle; font-variant-numeric: tabular-nums; pointer-events: none }
.chr-grid { stroke: var(--chr-line); stroke-width: 1 }
.chr-line { fill: none; stroke-linejoin: round; stroke-linecap: round; pointer-events: none }
.chr-guide { stroke: var(--chr-t4); stroke-width: 1; stroke-dasharray: 2 3 }
.chr-ring { fill: none; stroke: var(--chr-t1); stroke-width: 1.5; pointer-events: none }
.chr-rowl { position: absolute; left: 0; display: flex; align-items: baseline; gap: 6px; font-size: 12px; line-height: 16px; color: var(--chr-t2); white-space: nowrap; transform: translateY(-50%); pointer-events: none; transition: opacity .25s var(--chr-ease), color .2s var(--chr-ease) }
.chr-rowl b { font-weight: 400; min-width: 52px }
.chr-rowl span { color: var(--chr-t3); font-variant-numeric: tabular-nums }
.chr-rowl[data-on] { color: var(--chr-t1) }
.chr-rowl[data-avg] b { font-weight: 500; color: var(--chr-t1) }
.chr-yl { position: absolute; left: 0; width: 38px; text-align: right; font-size: 12px; line-height: 12px; color: var(--chr-t3); transform: translateY(-50%); pointer-events: none; font-variant-numeric: tabular-nums }
.chr-cols { position: absolute; display: flex; font-size: 12px; line-height: 16px; color: var(--chr-t3); pointer-events: none; font-variant-numeric: tabular-nums }
.chr-cols span { flex: 1 1 0; text-align: center; transition: color .2s var(--chr-ease) }
.chr-cols span[data-on] { color: var(--chr-t1); font-weight: 500 }
.chr-colt { position: absolute; font-size: 12px; line-height: 16px; color: var(--chr-t3); pointer-events: none; text-align: center }
.chr-tip { position: absolute; left: 0; top: 0; z-index: 3; width: max-content; max-width: 230px; padding: 8px 10px; border-radius: 12px; background: var(--chr-surface); box-shadow: var(--chr-pop); pointer-events: none; opacity: 0; transition: opacity .15s var(--chr-ease) }
.chr-tip[data-on] { opacity: 1 }
.chr-tiphead { font-size: 12px; line-height: 16.8px; color: var(--chr-t2) }
.chr-tipval { font-size: 16px; line-height: 22px; font-weight: 500; font-variant-numeric: tabular-nums }
.chr-tipfoot { font-size: 12px; line-height: 16.8px; color: var(--chr-t3); font-variant-numeric: tabular-nums }
.chr-hint { font-size: 12px; line-height: 16px; color: var(--chr-t3); margin-top: 10px }

@container (max-width: 560px) {
  .chr { padding: 14px 16px 16px }
  .chr-kpi { padding: 0 10px }
  .chr-kpi:first-child { padding-left: 0 }
  .chr-kv { font-size: 18px; line-height: 26px }
  .chr-label { font-size: 12px; line-height: 16px }
  .chr-ctx { display: none }
  .chr-seg:not(.chr-seg-view) { width: 100% }
  .chr-seg:not(.chr-seg-view) .chr-opt { flex: 1; padding: 0 4px }
  .chr-val { font-size: 10.5px }
}

@media (prefers-reduced-motion: reduce) {
  .chr *, .chr *::before, .chr *::after { animation: none !important; transition: none !important }
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
      if (Math.abs(diff) < 0.0004 * Math.max(1, Math.abs(value))) {
        cur.current = value
        el.textContent = fmt.current(value)
        return
      }
      cur.current += diff * (1 - Math.exp(-dt / 120))
      el.textContent = fmt.current(cur.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return (
    <>
      <span ref={ref} className="chr-num" aria-hidden />
      <span className="chr-sr">{format(value)}</span>
    </>
  )
}

function Seg<T extends string>({ options, value, onChange, label, className }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const box = React.useRef<HTMLDivElement>(null)
  const thumb = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const b = box.current, t = thumb.current
    if (!b || !t) return
    const place = () => {
      const on = b.querySelector<HTMLElement>('[aria-checked="true"]')
      if (!on) return
      t.style.width = `${on.offsetWidth}px`
      t.style.transform = `translateX(${on.offsetLeft}px)`
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(b)
    return () => ro.disconnect()
  }, [value])
  const onKey = (e: React.KeyboardEvent) => {
    const i = options.findIndex((o) => o.id === value)
    let n = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % options.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + options.length) % options.length
    if (n < 0) return
    e.preventDefault()
    onChange(options[n].id)
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
  }
  return (
    <div ref={box} className={["chr-seg", className].filter(Boolean).join(" ")} role="radiogroup" aria-label={label} onKeyDown={onKey}>
      <span ref={thumb} className="chr-thumb" aria-hidden />
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} tabIndex={value === o.id ? 0 : -1} className="chr-opt" onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const RP = 30
const CH_PAD = 3
const AVG_GAP = 10
const FOOT = 40
const rowTop = (r: number) => r * RP + (r === AVG ? AVG_GAP : 0)
const CHART_H = 12 * RP + AVG_GAP + RP + FOOT
const PLOT_TOP = 6
const PLOT_H = 12 * RP + AVG_GAP + RP - 14
/** Curves view: the axis runs from 20 to 100 percent so the lines spread out. */
const yOfRate = (v: number) => PLOT_TOP + (1 - (v - 20) / 80) * PLOT_H
const heatAlpha = (v: number) => 0.07 + 0.8 * Math.min(1, Math.max(0, (v - 20) / 60))
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3))
const pctText = (n: number) => `${n.toFixed(1)}%`
const int = (n: number) => Math.round(n).toLocaleString("en-US")

type Cursor = { r: number; c: number } | null

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function CohortRetention({
  segments = DEFAULT_SEGMENTS,
  includeAll = true,
  title = "Cohort retention",
  subtitle = "Workspaces still active each month after signup. Data through Aug 31, 2026.",
  noun = "workspaces",
  onCursorChange,
  className,
}: CohortRetentionProps) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const opts = React.useMemo(() => {
    const list = segments.map((s) => ({ id: s.id, label: s.label, cohorts: s.cohorts }))
    return includeAll && segments.length > 1 ? [{ id: "all", label: "All", cohorts: combine(segments) }, ...list] : list
  }, [segments, includeAll])
  const [segId, setSegId] = React.useState(opts[0].id)
  const seg = opts.find((o) => o.id === segId) ?? opts[0]
  const [view, setView] = React.useState<"heat" | "curves">("heat")
  const [cursor, setCursor] = React.useState<Cursor>(null)
  const [W, setW] = React.useState(0)
  const [note, setNote] = React.useState("")

  const table = React.useMemo(() => tableOf(seg.cohorts), [seg])
  const labels = React.useMemo(() => seg.cohorts.slice(0, 12).map((c) => c.label), [seg])
  // which cells exist (the triangle): the same for every segment, taken from the first
  const cells = React.useMemo(() => {
    const t = tableOf(opts[0].cohorts)
    const out: { r: number; c: number; i: number }[] = []
    for (let r = 0; r <= AVG; r++) for (let c = 0; c < NC; c++) if (!Number.isNaN(t.rate[r * NC + c])) out.push({ r, c, i: r * NC + c })
    return out
  }, [opts])

  const chartRef = React.useRef<HTMLDivElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const cellRefs = React.useRef<(SVGRectElement | null)[]>([])
  const valRefs = React.useRef<(SVGTextElement | null)[]>([])
  const lineRefs = React.useRef<(SVGPathElement | null)[]>([])
  const gridRefs = React.useRef<(SVGLineElement | null)[]>([])
  const ringRef = React.useRef<SVGRectElement>(null)
  const guideRef = React.useRef<SVGLineElement>(null)
  const rowLRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const ylRefs = React.useRef<(HTMLSpanElement | null)[]>([])

  const narrow = W > 0 && W < 460
  const LX = narrow ? 56 : 108
  const cw = W ? (W - LX) / NC : 0

  const A = React.useRef({
    p: 0,
    pv: 0,
    pt: 0,
    cur: new Float64Array(13 * NC),
    from: new Float64Array(13 * NC),
    to: Float64Array.from(table.rate),
    washAt: 0,
    wash: true,
    cells,
    W: 0,
    LX: 108,
    cursor: null as Cursor,
    reduced,
    raf: 0,
    last: 0,
    wake: (() => {}) as () => void,
    tipX: 0,
    tipY: 0,
    tipInit: false,
    pos: new Float64Array(13 * NC * 2),
    measured: table.measured,
  })

  React.useEffect(() => {
    const a = A.current
    a.cells = cells
    a.reduced = reduced
    a.measured = table.measured
    a.pt = view === "curves" ? 1 : 0
    a.cursor = cursor
    a.wake()
  }, [cells, reduced, view, cursor, table.measured])

  // a new segment: every cell rewashes from where it is now to its new value, in a wave
  React.useEffect(() => {
    const a = A.current
    a.from.set(a.cur)
    a.to = Float64Array.from(table.rate)
    a.washAt = performance.now()
    a.wash = true
    a.wake()
  }, [table])

  const paint = React.useCallback(
    (now: number) => {
      const a = A.current
      if (!a.W) return false
      let moving = false
      const lx = a.LX
      const cwid = (a.W - lx) / NC
      const p = a.p
      const baseTop = 0
      // washing values
      const n13 = 13 * NC
      if (a.wash) {
        let alive = false
        for (let i = 0; i < n13; i++) {
          const to = a.to[i]
          if (Number.isNaN(to)) { a.cur[i] = NaN; continue }
          const r = Math.floor(i / NC), c = i % NC
          const delay = a.reduced ? 0 : c * 22 + r * 12
          const f = a.from[i]
          const k = a.reduced ? 1 : ease((now - a.washAt - delay) / 520)
          a.cur[i] = (Number.isNaN(f) ? 0 : f) + (to - (Number.isNaN(f) ? 0 : f)) * k
          if (k < 1) alive = true
        }
        if (!alive) a.wash = false
        else moving = true
      }
      const plotTop = PLOT_TOP
      const plotH = PLOT_H
      const yCurve = yOfRate
      // cells
      for (const cell of a.cells) {
        const { r, c, i } = cell
        const rect = cellRefs.current[i], txt = valRefs.current[i]
        if (!rect || !txt) continue
        const v = a.cur[i]
        const ord = (c / 11) * 0.62 + (r / 12) * 0.38
        const q = a.reduced ? p : Math.max(0, Math.min(1, p * 1.45 - 0.45 * ord))
        const qe = q * q * (3 - 2 * q)
        const hx = lx + c * cwid + cwid / 2, hy = baseTop + rowTop(r) + RP / 2
        const cx = hx + (lx + c * cwid + cwid / 2 - hx) * qe
        const cy = hy + (yCurve(v) - hy) * qe
        a.pos[i * 2] = cx
        a.pos[i * 2 + 1] = cy
        const w = (cwid - CH_PAD) + (7 - (cwid - CH_PAD)) * qe
        const h = (RP - CH_PAD) + (7 - (RP - CH_PAD)) * qe
        rect.setAttribute("x", (cx - w / 2).toFixed(2))
        rect.setAttribute("y", (cy - h / 2).toFixed(2))
        rect.setAttribute("width", Math.max(0, w).toFixed(2))
        rect.setAttribute("height", Math.max(0, h).toFixed(2))
        const rx = 6 + (3.5 - 6) * qe
        rect.setAttribute("rx", rx.toFixed(2))
        const heat = heatAlpha(v)
        const dotA = r === AVG ? 1 : 0.3 + 0.62 * (r / 11)
        const alpha = heat + (dotA - heat) * qe
        const isAvg = r === AVG
        const col = isAvg && qe > 0.5 ? "var(--chr-accent)" : "var(--chr-ink)"
        rect.style.fill = `color-mix(in oklab, ${col} ${(alpha * 100).toFixed(1)}%, transparent)`
        const dim = a.cursor && qe > 0.5 && !isAvg && a.cursor.r !== r && a.cursor.r !== AVG ? 0.3 : 1
        rect.style.opacity = String(dim)
        txt.setAttribute("x", cx.toFixed(2))
        txt.setAttribute("y", (cy + 4).toFixed(2))
        txt.style.opacity = String(Math.max(0, 1 - qe * 2.6))
        txt.style.fill = heat > 0.5 ? "var(--chr-surface)" : "var(--chr-t1)"
        const s = Number.isNaN(v) ? "" : String(Math.round(v))
        if (txt.textContent !== s) txt.textContent = s
      }
      // curves
      const lineO = Math.max(0, Math.min(1, (p - 0.55) / 0.45))
      for (let r = 0; r <= AVG; r++) {
        const path = lineRefs.current[r]
        if (!path) continue
        let d = ""
        for (let c = 0; c < NC; c++) {
          const v = a.cur[r * NC + c]
          if (Number.isNaN(v)) break
          d += `${c ? "L" : "M"}${(lx + c * cwid + cwid / 2).toFixed(2)},${yCurve(v).toFixed(2)}`
        }
        path.setAttribute("d", d)
        const dim = a.cursor && a.cursor.r !== r && a.cursor.r !== AVG && r !== AVG ? 0.18 : 1
        path.style.opacity = String(lineO * dim)
      }
      // grid and axis for curves
      for (let g = 0; g < 5; g++) {
        const y = yCurve(20 + g * 20)
        const l = gridRefs.current[g]
        if (l) { l.setAttribute("y1", String(y)); l.setAttribute("y2", String(y)); l.style.opacity = String(Math.max(0, (p - 0.3) / 0.7)) }
        const t = ylRefs.current[g]
        if (t) { t.style.top = `${y}px`; t.style.opacity = String(Math.max(0, (p - 0.4) / 0.6)) }
      }
      // row labels fade out in the curves view
      for (let r = 0; r <= AVG; r++) {
        const el = rowLRefs.current[r]
        if (el) {
          el.style.top = `${baseTop + rowTop(r) + RP / 2}px`
          el.style.opacity = String(1 - Math.min(1, p * 1.6))
        }
      }
      // cursor ring (heat) / guide (curves), and the tooltip anchor
      const cur = a.cursor
      const ring = ringRef.current, guide = guideRef.current
      const tip = tipRef.current
      if (cur) {
        const cell = a.cells.find((x) => x.r === cur.r && x.c === cur.c)
        if (cell) {
          const px = a.pos[cell.i * 2], py = a.pos[cell.i * 2 + 1]
          if (ring) {
            const size = 7 + ((cwid - CH_PAD) - 7) * (1 - p)
            const hh = 7 + ((RP - CH_PAD) - 7) * (1 - p)
            ring.setAttribute("x", (px - size / 2 - 1.5).toFixed(2))
            ring.setAttribute("y", (py - hh / 2 - 1.5).toFixed(2))
            ring.setAttribute("width", (size + 3).toFixed(2))
            ring.setAttribute("height", (hh + 3).toFixed(2))
            ring.setAttribute("rx", String(6 + (5 - 6) * p))
            ring.style.opacity = "1"
          }
          if (guide) {
            guide.setAttribute("x1", px.toFixed(2)); guide.setAttribute("x2", px.toFixed(2))
            guide.setAttribute("y1", String(plotTop)); guide.setAttribute("y2", String(plotTop + plotH))
            guide.style.opacity = String(Math.max(0, (p - 0.6) / 0.4))
          }
          if (tip) {
            const w = tip.offsetWidth, h = tip.offsetHeight
            let tx = px - w / 2, ty = py - (RP - CH_PAD) / 2 * (1 - p) - h - 10
            if (ty < -4) ty = py + 18
            tx = Math.max(0, Math.min(a.W - w, tx))
            if (!a.tipInit) { a.tipX = tx; a.tipY = ty; a.tipInit = true }
            const k = a.reduced ? 1 : 0.35
            a.tipX += (tx - a.tipX) * k
            a.tipY += (ty - a.tipY) * k
            tip.style.transform = `translate3d(${a.tipX.toFixed(1)}px, ${a.tipY.toFixed(1)}px, 0)`
            tip.dataset.on = ""
            if (Math.abs(tx - a.tipX) > 0.4 || Math.abs(ty - a.tipY) > 0.4) moving = true
          }
        }
      } else {
        if (ring) ring.style.opacity = "0"
        if (guide) guide.style.opacity = "0"
        if (tip) { delete tip.dataset.on; a.tipInit = false }
      }
      return moving
    },
    [],
  )

  React.useEffect(() => {
    const a = A.current
    const step = (now: number) => {
      a.raf = 0
      const dt = Math.min(0.033, Math.max(0.001, (now - (a.last || now - 16)) / 1000))
      a.last = now
      let moving = false
      // morph spring: slightly under critical, so it settles without wobble
      const K = 90, C = 2 * Math.sqrt(K) * 0.98
      if (a.reduced) { a.p = a.pt; a.pv = 0 } else {
        a.pv += (K * (a.pt - a.p) - C * a.pv) * dt
        a.p += a.pv * dt
        if (Math.abs(a.pt - a.p) < 0.0008 && Math.abs(a.pv) < 0.01) { a.p = a.pt; a.pv = 0 } else moving = true
      }
      if (paint(now)) moving = true
      if (moving) a.raf = requestAnimationFrame(step)
      else a.last = 0
    }
    a.wake = () => {
      if (!a.raf) a.raf = requestAnimationFrame(step)
    }
    a.wake()
    return () => {
      cancelAnimationFrame(a.raf)
      a.raf = 0
      a.wake = () => {}
    }
  }, [paint])

  React.useLayoutEffect(() => {
    const el = chartRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  React.useLayoutEffect(() => {
    const a = A.current
    a.W = W
    a.LX = LX
    a.wake()
  }, [W, LX])

  /* -------------------------------- pointer -------------------------------- */
  const cellAt = (clientX: number, clientY: number): Cursor => {
    const box = chartRef.current?.getBoundingClientRect()
    if (!box || !W) return null
    const x = clientX - box.left, y = clientY - box.top
    const a = A.current
    const col = Math.floor((x - LX) / cw)
    if (col < 0 || col >= NC) return null
    if (a.p < 0.5) {
      // heatmap: pick the row under the pointer
      for (let r = 0; r <= AVG; r++) {
        if (y >= rowTop(r) && y < rowTop(r) + RP && !Number.isNaN(a.to[r * NC + col])) return { r, c: col }
      }
      return null
    }
    // curves: the nearest line at that month
    let best = -1, bd = 22
    for (let r = 0; r <= AVG; r++) {
      const v = a.cur[r * NC + col]
      if (Number.isNaN(v)) continue
      const yy = yOfRate(v)
      if (Math.abs(yy - y) < bd) { bd = Math.abs(yy - y); best = r }
    }
    return best >= 0 ? { r: best, c: col } : null
  }
  const same = (x: Cursor, y: Cursor) => (x === null && y === null) || (x !== null && y !== null && x.r === y.r && x.c === y.c)
  const move = (c: Cursor, announce = false) => {
    if (same(c, cursor)) return
    setCursor(c)
    if (c) {
      const rate = table.rate[c.r * NC + c.c]
      onCursorChange?.({ cohort: c.r === AVG ? "All cohorts" : labels[c.r], month: c.c + 1, rate })
      if (announce) setNote(`${c.r === AVG ? "Average" : labels[c.r]}, month ${c.c + 1}, ${pctText(rate)} still active`)
    } else onCursorChange?.(null)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" && e.buttons === 0) return
    move(cellAt(e.clientX, e.clientY))
  }
  const onClick = (e: React.PointerEvent | React.MouseEvent) => {
    move(cellAt(e.clientX, e.clientY), true)
  }
  const onKey = (e: React.KeyboardEvent) => {
    const t = table
    const ok = (r: number, c: number) => r >= 0 && r <= AVG && c >= 0 && c < NC && !Number.isNaN(t.rate[r * NC + c])
    const cur0 = cursor ?? { r: 0, c: 0 }
    let n: Cursor | undefined
    if (e.key === "ArrowRight") n = ok(cur0.r, cur0.c + 1) ? { r: cur0.r, c: cur0.c + 1 } : cur0
    else if (e.key === "ArrowLeft") n = ok(cur0.r, cur0.c - 1) ? { r: cur0.r, c: cur0.c - 1 } : cur0
    else if (e.key === "ArrowDown") {
      let r = cur0.r + 1
      while (r <= AVG && !ok(r, cur0.c)) r++
      n = r <= AVG ? { r, c: cur0.c } : cur0
    } else if (e.key === "ArrowUp") {
      let r = cur0.r - 1
      while (r >= 0 && !ok(r, cur0.c)) r--
      n = r >= 0 ? { r, c: cur0.c } : cur0
    } else if (e.key === "Home") n = { r: cur0.r, c: 0 }
    else if (e.key === "End") {
      let c = NC - 1
      while (c > 0 && !ok(cur0.r, c)) c--
      n = { r: cur0.r, c }
    } else if (e.key === "Escape") {
      if (cursor) { e.preventDefault(); move(null) }
      return
    }
    if (n === undefined) return
    e.preventDefault()
    move(n, true)
  }

  /* -------------------------------- derived -------------------------------- */
  const m1 = table.rate[AVG * NC + 0]
  const m6 = table.rate[AVG * NC + 5]
  const total = table.sizes[12]
  const d1 = delta(table, 0), d6 = delta(table, 5)
  const tipCell = cursor
  const tipRate = tipCell ? table.rate[tipCell.r * NC + tipCell.c] : 0
  const tipN = tipCell ? table.retained[tipCell.r * NC + tipCell.c] : 0
  const tipBase = tipCell ? (tipCell.r === AVG ? table.measured[tipCell.c] === 12 ? total : seg.cohorts.slice(0, 12).filter((c) => c.retained[tipCell.c] !== undefined).reduce((s, c) => s + c.size, 0) : table.sizes[tipCell.r]) : 0
  const first = labels[0]
  const last = labels[labels.length - 1]

  return (
    <section className={["chr", className].filter(Boolean).join(" ")} aria-label={title}>
      <style href="chr" precedence="default">{CSS}</style>
      <header className="chr-head">
        <div>
          <h2 className="chr-title">{title}</h2>
          <p className="chr-sub">{subtitle}</p>
        </div>
        <Seg options={opts.map((o) => ({ id: o.id, label: o.label }))} value={seg.id} onChange={(v) => { setSegId(v); setNote(`Showing ${opts.find((o) => o.id === v)?.label}`) }} label="Segment" />
      </header>

      <dl className="chr-kpis">
        <div className="chr-kpi">
          <dt className="chr-label">Month 1 retention</dt>
          <dd className="chr-kv">
            <CountTo value={m1} format={pctText} />
          </dd>
          <Delta value={d1} />
        </div>
        <div className="chr-kpi">
          <dt className="chr-label">Month 6 retention</dt>
          <dd className="chr-kv">
            <CountTo value={m6} format={pctText} />
          </dd>
          <Delta value={d6} />
        </div>
        <div className="chr-kpi">
          <dt className="chr-label">New {noun}</dt>
          <dd className="chr-kv">
            <CountTo value={total} format={int} />
          </dd>
          <span className="chr-ctx">
            Signed up {first} to {last}
          </span>
        </div>
      </dl>

      <div className="chr-bar">
        <div className="chr-legend">
          {view === "heat" ? (
            <div className="chr-legend-in" key="heat">
              <span>% retained</span>
              <div className="chr-ramp" role="img" aria-label="Colour scale from 20 percent (light) to 80 percent (dark)">
                <div className="chr-ramp-sw">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <i key={i} style={{ "--a": heatAlpha(20 + i * 15) * 100 } as React.CSSProperties} />
                  ))}
                </div>
                <div className="chr-ramp-ticks" aria-hidden>
                  <span>20</span>
                  <span>35</span>
                  <span>50</span>
                  <span>65</span>
                  <span>80</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="chr-legend-in" key="curves">
              <span>Older</span>
              <i className="chr-age" aria-hidden />
              <span>Newer cohorts</span>
              <span className="chr-avgkey">
                <i aria-hidden />
                Average
              </span>
            </div>
          )}
        </div>
        <Seg className="chr-seg-view" options={[{ id: "heat" as const, label: "Heatmap" }, { id: "curves" as const, label: "Curves" }]} value={view} onChange={(v) => { setView(v); setNote(v === "heat" ? "Heatmap view" : "Retention curves view") }} label="View" />
      </div>

      <div
        ref={chartRef}
        className="chr-chart"
        style={{ height: CHART_H }}
        tabIndex={0}
        role="group"
        aria-label="Retention by cohort and month since signup"
        aria-describedby="chr-hint"
        onPointerMove={onPointerMove}
        onPointerDown={onClick}
        onPointerLeave={() => move(null)}
        onBlur={() => move(null)}
        onKeyDown={onKey}
      >
        <svg className="chr-svg" width="100%" height={CHART_H} aria-hidden>
          {[0, 1, 2, 3, 4].map((g) => (
            <line key={g} ref={(el) => { gridRefs.current[g] = el }} x1={LX} x2={Math.max(LX, W)} className="chr-grid" style={{ opacity: 0 }} />
          ))}
          {Array.from({ length: 13 }, (_, r) => (
            <path
              key={r}
              ref={(el) => { lineRefs.current[r] = el }}
              className="chr-line"
              style={{ opacity: 0, stroke: r === AVG ? "var(--chr-accent)" : `color-mix(in oklab, var(--chr-ink) ${(30 + 62 * (r / 11)).toFixed(0)}%, transparent)`, strokeWidth: r === AVG ? 2.5 : 1.5 }}
            />
          ))}
          <line ref={guideRef} className="chr-guide" style={{ opacity: 0 }} />
          {cells.map(({ i }) => (
            <g key={i}>
              <rect ref={(el) => { cellRefs.current[i] = el }} className="chr-cell" />
              <text ref={(el) => { valRefs.current[i] = el }} className="chr-val" />
            </g>
          ))}
          <rect ref={ringRef} className="chr-ring" style={{ opacity: 0 }} />
        </svg>
        {Array.from({ length: 13 }, (_, r) => (
          <div key={r} ref={(el) => { rowLRefs.current[r] = el }} className="chr-rowl" data-avg={r === AVG ? "" : undefined} data-on={cursor?.r === r ? "" : undefined} aria-hidden>
            <b>{r === AVG ? "Average" : narrow ? labels[r]?.replace(/ 20(\d\d)$/, " $1") : labels[r]}</b>
            {!narrow && <span>{int(table.sizes[r] ?? 0)}</span>}
          </div>
        ))}
        {[20, 40, 60, 80, 100].map((v, g) => (
          <span key={v} ref={(el) => { ylRefs.current[g] = el }} className="chr-yl" style={{ opacity: 0, left: Math.max(0, LX - 44) }} aria-hidden>
            {v}%
          </span>
        ))}
        <div className="chr-cols" style={{ left: LX, right: 0, top: 12 * RP + AVG_GAP + RP + 8 }} aria-hidden>
          {Array.from({ length: NC }, (_, c) => (
            <span key={c} data-on={cursor?.c === c ? "" : undefined}>
              {c + 1}
            </span>
          ))}
        </div>
        <div className="chr-colt" style={{ left: LX, right: 0, top: 12 * RP + AVG_GAP + RP + 26 }} aria-hidden>
          Months since signup
        </div>
        <div ref={tipRef} className="chr-tip" aria-hidden>
          {tipCell && (
            <>
              <div className="chr-tiphead">
                {tipCell.r === AVG ? "All cohorts" : labels[tipCell.r]} · Month {tipCell.c + 1}
              </div>
              <div className="chr-tipval">{pctText(tipRate)}</div>
              <div className="chr-tipfoot">
                {int(tipN)} of {int(tipBase)} {noun} still active
              </div>
            </>
          )}
        </div>
      </div>
      <p className="chr-hint" id="chr-hint">
        Use the arrow keys to move between cohorts and months, Home and End to jump within a cohort, and Escape to clear.
      </p>

      <div className="chr-sr" role="status" aria-live="polite">
        {note}
      </div>
      <table className="chr-sr">
        <caption>Share of all {noun} still active by months since signup</caption>
        <thead>
          <tr>
            <th>Cohort</th>
            <th>{noun}</th>
            {Array.from({ length: NC }, (_, c) => (
              <th key={c}>Month {c + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 13 }, (_, r) => (
            <tr key={r}>
              <td>{r === AVG ? "Average" : labels[r]}</td>
              <td>{int(table.sizes[r] ?? 0)}</td>
              {Array.from({ length: NC }, (_, c) => {
                const v = table.rate[r * NC + c]
                return <td key={c}>{Number.isNaN(v) ? "Not yet measured" : pctText(v)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Delta({ value }: { value: number }) {
  const down = value < 0
  return (
    <>
      <span className="chr-delta" data-down={down ? "" : undefined}>
        {down ? <ArrowDownRight size={13} strokeWidth={1.75} aria-hidden /> : <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden />}
        <CountTo value={value} format={(n) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)} pts`} />
      </span>
      <span className="chr-ctx">latest 3 vs first 3 cohorts</span>
    </>
  )
}

export default CohortRetention

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RidgelineSeries = {
  id: string
  label: string
  /** Raw observations. The ridge is their kernel density estimate. */
  values: number[]
}

export type RidgelineProps = {
  /** One ridge per series, drawn top to bottom. */
  series: RidgelineSeries[]
  /** What is measured. Names the chart for assistive technology. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header, e.g. a dataset switch. */
  actions?: React.ReactNode
  /** Unit after each value, such as "°" or " ms". */
  unit?: string
  /** Formats values. Overrides `unit`. */
  formatValue?: (value: number) => string
  /** Value range of the axis. Fix it to keep the axis still across datasets. Defaults to the data with room on each side. */
  domain?: [number, number]
  /** How far the tallest ridge rises into the rows above, in row heights. */
  overlap?: number
  /** Height of one row in pixels. */
  rowHeight?: number
  /** Smoothing in value units. Defaults to Silverman's rule per series. */
  bandwidth?: number
  /** Shades each ridge by its median, from a light tint to the full colour, with a stepped scale under the axis. */
  tint?: boolean
  /** Controlled id of the lifted ridge. */
  active?: string | null
  /** Initial lifted ridge when uncontrolled. */
  defaultActive?: string | null
  /** Called when the lifted ridge changes. */
  onActiveChange?: (id: string | null) => void
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rdg {
  --rdg-ink: #000;
  --rdg-surface: #fff;
  --rdg-accent: oklch(.6 .17 255);
  --rdg-t1: color-mix(in oklab, var(--rdg-ink) 88%, transparent);
  --rdg-t2: color-mix(in oklab, var(--rdg-ink) 61%, transparent);
  --rdg-t3: color-mix(in oklab, var(--rdg-ink) 45%, transparent);
  --rdg-t4: color-mix(in oklab, var(--rdg-ink) 27%, transparent);
  --rdg-fill: color-mix(in oklab, var(--rdg-ink) 6%, transparent);
  --rdg-line: color-mix(in oklab, var(--rdg-ink) 6%, transparent);
  --rdg-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --rdg-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --rdg-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0;
  padding: 18px 20px 14px;
  border-radius: 16px;
  background: var(--rdg-surface);
  box-shadow: var(--rdg-shadow);
  color: var(--rdg-t1);
  font-family: var(--rdg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .rdg {
  --rdg-ink: #fff;
  --rdg-surface: #1c1c1e;
  --rdg-accent: oklch(.72 .14 255);
  --rdg-t1: color-mix(in oklab, var(--rdg-ink) 90%, transparent);
  --rdg-t2: color-mix(in oklab, var(--rdg-ink) 62%, transparent);
  --rdg-t3: color-mix(in oklab, var(--rdg-ink) 46%, transparent);
  --rdg-t4: color-mix(in oklab, var(--rdg-ink) 28%, transparent);
  --rdg-fill: color-mix(in oklab, var(--rdg-ink) 8%, transparent);
  --rdg-line: color-mix(in oklab, var(--rdg-ink) 8%, transparent);
  --rdg-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --rdg-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.rdg) *, :where(.rdg) *::before, :where(.rdg) *::after { box-sizing: border-box }
:where(.rdg) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.rdg :focus-visible { outline: 2px solid color-mix(in oklab, var(--rdg-accent) 60%, transparent); outline-offset: 1px }

.rdg-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 8px 12px; margin-bottom: 8px }
.rdg-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--rdg-t1) }
.rdg-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--rdg-t3) }
.rdg-actions { flex: none }

.rdg-stage { position: relative; width: 100%; border-radius: 10px; outline-offset: 4px; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: crosshair; -webkit-tap-highlight-color: transparent }
.rdg-stage svg { display: block; width: 100%; height: 100%; overflow: visible }
.rdg-tick { stroke: var(--rdg-line); stroke-width: 1 }
.rdg-tl { font-size: 12px; fill: var(--rdg-t3); text-anchor: middle; font-variant-numeric: tabular-nums }
.rdg-rl { font-size: 12px; fill: var(--rdg-t3); text-anchor: end; transition: fill .2s }
.rdg-rl[data-on] { fill: var(--rdg-t1); font-weight: 600 }

.rdg-r { transition: opacity .28s var(--rdg-ease) }
.rdg-r[data-dim] { opacity: .32 }
.rdg-fill { fill: color-mix(in oklab, var(--rdg-accent) calc(11% + var(--m) * 36%), var(--rdg-surface)); transition: fill .45s var(--rdg-ease) }
.rdg-ln { fill: none; stroke: color-mix(in oklab, var(--rdg-accent) calc(40% + var(--m) * 52%), var(--rdg-surface)); stroke-width: 1.5; stroke-linejoin: round; transition: stroke .45s var(--rdg-ease) }
.rdg-med { stroke: color-mix(in oklab, var(--rdg-accent) calc(28% + var(--m) * 40%), var(--rdg-surface)); stroke-width: 1 }

.rdg-lift { pointer-events: none; opacity: 0; transform: translateY(0); transition: transform .5s cubic-bezier(.34, 1.56, .64, 1), opacity .2s }
.rdg-lift[data-on] { opacity: 1; transform: translateY(-6px) }
.rdg-lift .rdg-fill { fill: color-mix(in oklab, var(--rdg-accent) calc(22% + var(--m) * 36%), var(--rdg-surface)) }
.rdg-lift .rdg-ln { stroke: var(--rdg-accent); stroke-width: 2 }
.rdg-iqr { fill: color-mix(in oklab, var(--rdg-accent) 38%, transparent) }
.rdg-lift .rdg-med { stroke: var(--rdg-accent); stroke-width: 2; stroke-linecap: round }

.rdg-cross { stroke: var(--rdg-t3); stroke-width: 1; pointer-events: none; opacity: 0; transition: opacity .15s }
.rdg-cross[data-on] { opacity: 1 }

.rdg-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; min-width: 168px; padding: 8px 10px; border-radius: 10px;
  background: var(--rdg-surface); box-shadow: var(--rdg-tip); pointer-events: none; opacity: 0; transition: opacity .14s, transform .12s var(--rdg-ease);
  font-size: 12px; line-height: 16px;
}
.rdg-tip[data-on] { opacity: 1 }
.rdg-tip-h { margin: 0 0 4px; font-size: 12px; line-height: 16px; font-weight: 600; color: var(--rdg-t1) }
.rdg-tip-r { display: flex; justify-content: space-between; gap: 14px; color: var(--rdg-t2) }
.rdg-tip-r b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--rdg-t1) }
.rdg-tip-f { margin: 4px 0 0; padding-top: 4px; border-top: .5px solid var(--rdg-line); color: var(--rdg-t3); font-variant-numeric: tabular-nums }

.rdg-legend { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 6px; min-height: 16px; font-size: 11px; line-height: 16px; color: var(--rdg-t3); font-variant-numeric: tabular-nums }
.rdg-ramp { display: flex; gap: 2px }
.rdg-ramp i { width: 14px; height: 6px; border-radius: 2px; background: color-mix(in oklab, var(--rdg-accent) calc(11% + var(--m) * 36% + 8%), var(--rdg-surface)) }
.rdg-empty { display: grid; place-items: center; min-height: 160px; color: var(--rdg-t3) }
.rdg-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@media (max-width: 420px) { .rdg { padding: 14px 12px 10px } }
@media (prefers-reduced-motion: reduce) {
  .rdg *, .rdg *::before, .rdg *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Maths                                   */
/* -------------------------------------------------------------------------- */

/** Samples per ridge. Every curve lives on the same normalised grid, which is what lets any dataset morph into any other. */
const N = 96
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const nf = new Intl.NumberFormat("en", { maximumFractionDigits: 1 })

function quantile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const i = (sorted.length - 1) * p
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (i - lo)
}

type Stats = { sorted: number[]; n: number; min: number; max: number; q1: number; median: number; q3: number; h: number }

function statsOf(values: number[], bandwidth?: number): Stats {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  const n = sorted.length
  const min = sorted[0] ?? 0
  const max = sorted[n - 1] ?? 0
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  let h = bandwidth ?? 0
  if (!h || h <= 0) {
    const mean = sorted.reduce((a, b) => a + b, 0) / Math.max(1, n)
    const sd = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1))
    const spread = Math.min(sd || Infinity, (q3 - q1) / 1.34 || Infinity)
    h = isFinite(spread) && spread > 0 ? 0.9 * spread * n ** -0.2 : Math.max((max - min) / 30, 1)
  }
  return { sorted, n, min, max, q1, median, q3, h }
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

/** Gaussian kernel density on the normalised grid of a domain. */
function kde(s: Stats, lo: number, hi: number, out: Float64Array) {
  const norm = 1 / (s.n * s.h * Math.sqrt(2 * Math.PI))
  const inv = 1 / s.h
  for (let j = 0; j < N; j++) {
    const x = lo + ((hi - lo) * j) / (N - 1)
    let sum = 0
    for (let i = 0; i < s.n; i++) {
      const z = (x - s.sorted[i]!) * inv
      if (z > -5 && z < 5) sum += Math.exp(-0.5 * z * z)
    }
    out[j] = sum * norm
  }
}

function usePrefersReducedMotion() {
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

type Row = { cur: Float64Array; tgt: Float64Array; src: Float64Array; start: number }
type Cursor = { v: number; y: number | null } | null

const PAD_R = 10
const AXIS_H = 26
const STEPS = 5

/* -------------------------------------------------------------------------- */
/*                                  Ridgeline                                 */
/* -------------------------------------------------------------------------- */

export function Ridgeline({
  series,
  label,
  title,
  subtitle,
  actions,
  unit = "",
  formatValue,
  domain: domainProp,
  overlap = 2.4,
  rowHeight = 30,
  bandwidth,
  tint = true,
  active: activeProp,
  defaultActive = null,
  onActiveChange,
  emptyLabel = "No data yet",
  className,
}: RidgelineProps) {
  const reduced = usePrefersReducedMotion()
  const fmt = React.useCallback((v: number) => (formatValue ? formatValue(v) : `${nf.format(v).replace("-", "−")}${unit}`), [formatValue, unit])

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(0, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ------------------------------- Statistics ------------------------------ */
  const stats = React.useMemo(() => series.map((s) => statsOf(s.values, bandwidth)), [series, bandwidth])
  const domain = React.useMemo<[number, number]>(() => {
    if (domainProp) return domainProp
    let lo = Infinity
    let hi = -Infinity
    let hmax = 0
    for (const s of stats) {
      if (!s.n) continue
      lo = Math.min(lo, s.min)
      hi = Math.max(hi, s.max)
      hmax = Math.max(hmax, s.h)
    }
    if (!isFinite(lo)) return [0, 1]
    lo -= 3 * hmax
    hi += 3 * hmax
    const step = niceStep((hi - lo) / 6)
    return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step]
  }, [domainProp, stats])
  const [dLo, dHi] = domain
  const density = React.useMemo(() => {
    const arrs = stats.map((s) => {
      const a = new Float64Array(N)
      if (s.n) kde(s, dLo, dHi, a)
      return a
    })
    let mx = 1e-12
    for (const a of arrs) for (let j = 0; j < N; j++) if (a[j]! > mx) mx = a[j]!
    for (const a of arrs) for (let j = 0; j < N; j++) a[j] = a[j]! / mx
    return arrs
  }, [stats, dLo, dHi])

  /* -------------------------------- Selection ------------------------------ */
  const [activeInner, setActiveInner] = React.useState<string | null>(defaultActive)
  const active = activeProp !== undefined ? activeProp : activeInner
  const setActive = (id: string | null) => {
    setActiveInner(id)
    onActiveChange?.(id)
  }
  const [liftId, setLiftId] = React.useState<string | null>(active)
  if (active && active !== liftId) setLiftId(active)
  const [cursor, setCursor] = React.useState<Cursor>(null)
  const [kbOn, setKbOn] = React.useState(false)
  const activeIdx = active ? series.findIndex((s) => s.id === active) : -1
  const liftIdx = liftId ? series.findIndex((s) => s.id === liftId) : -1

  /* -------------------------------- Geometry ------------------------------- */
  const n = series.length
  const gut = clamp(Math.max(0, ...series.map((s) => s.label.length)) * 6.4 + 14, 34, 120)
  const plotL = gut
  const plotW = Math.max(40, width - gut - PAD_R)
  const padTop = Math.max(0, (overlap - 1) * rowHeight) + 6
  const H = padTop + n * rowHeight + AXIS_H
  const baseY = (i: number) => padTop + (i + 1) * rowHeight
  const scaleH = overlap * rowHeight
  const tickStep = niceStep((dHi - dLo) / Math.max(2, Math.min(10, Math.floor(plotW / 62))))
  const ticks: number[] = []
  for (let v = Math.ceil(dLo / tickStep - 1e-9) * tickStep; v <= dHi + 1e-9; v += tickStep) ticks.push(+v.toFixed(8))
  const medianFrac = (s: Stats) => (dHi > dLo ? clamp((s.median - dLo) / (dHi - dLo), 0, 1) : 0.5)
  const stepOf = (s: Stats) => (tint ? Math.round(medianFrac(s) * (STEPS - 1)) / (STEPS - 1) : 0.45)

  /* --------------------------------- Motion -------------------------------- */
  const svgRef = React.useRef<SVGSVGElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const crossRef = React.useRef<SVGLineElement>(null)
  const rowsRef = React.useRef(new Map<string, Row>())
  const dom = React.useRef({ lo: dLo, hi: dHi, init: false })
  const fillEls = React.useRef(new Map<string, SVGPathElement | null>())
  const lineEls = React.useRef(new Map<string, SVGPathElement | null>())
  const medEls = React.useRef(new Map<string, SVGLineElement | null>())
  const tickEls = React.useRef(new Map<number, SVGGElement | null>())
  const lift = React.useRef<{ fill: SVGPathElement | null; line: SVGPathElement | null; iqr: SVGPathElement | null; med: SVGLineElement | null }>({ fill: null, line: null, iqr: null, med: null })
  const raf = React.useRef(0)
  const lastTs = React.useRef(0)
  const live = React.useRef({ series, stats, density, dLo, dHi, plotL, plotW, scaleH, baseY, reduced, cursor, liftIdx, activeIdx, H, ticks })
  const frameRef = React.useRef<(ts: number) => void>(() => {})

  const wake = React.useCallback(() => {
    if (raf.current) return
    raf.current = requestAnimationFrame((ts) => frameRef.current(ts))
  }, [])

  React.useLayoutEffect(() => {
    live.current = { series, stats, density, dLo, dHi, plotL, plotW, scaleH, baseY, reduced, cursor, liftIdx, activeIdx, H, ticks }
    // new targets: rows keep their current curve and morph toward it; new rows start flat and roll in from the top
    const now = performance.now()
    const map = rowsRef.current
    const ids = new Set(series.map((s) => s.id))
    for (const id of map.keys()) if (!ids.has(id)) map.delete(id)
    series.forEach((s, i) => {
      const t = density[i]!
      const r = map.get(s.id)
      if (!r) map.set(s.id, { cur: reduced ? Float64Array.from(t) : new Float64Array(N), tgt: t, src: t, start: now + 60 + i * 55 })
      else if (r.src !== t) {
        r.src = t
        r.tgt = t
        r.start = now
      }
    })
    wake()
  })

  React.useLayoutEffect(() => {
    frameRef.current = (ts: number) => {
      raf.current = 0
      const L = live.current
      const dt = lastTs.current ? clamp(ts - lastTs.current, 0, 64) : 16
      lastTs.current = ts
      const k = 1 - Math.exp(-dt / 140)
      let moving = false

      // domain eases so the axis slides when a dataset brings a new range
      const D = dom.current
      if (!D.init || L.reduced) {
        D.lo = L.dLo
        D.hi = L.dHi
        D.init = true
      } else {
        const a = (L.dLo - D.lo) * (1 - Math.exp(-dt / 170))
        const b = (L.dHi - D.hi) * (1 - Math.exp(-dt / 170))
        D.lo += a
        D.hi += b
        if (Math.abs(L.dLo - D.lo) > 1e-4 * (L.dHi - L.dLo) || Math.abs(L.dHi - D.hi) > 1e-4 * (L.dHi - L.dLo)) moving = true
      }

      const x0 = L.plotL
      const dx = L.plotW / (N - 1)
      const buildLine = (cur: Float64Array, base: number, lift: number) => {
        let d = `M${x0.toFixed(1)} ${base.toFixed(1)}`
        let px = x0
        let py = base - cur[0]! * lift
        d += `L${px.toFixed(1)} ${py.toFixed(1)}`
        for (let j = 1; j < N; j++) {
          const x = x0 + j * dx
          const y = base - cur[j]! * lift
          d += `Q${px.toFixed(1)} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`
          px = x
          py = y
        }
        d += `L${px.toFixed(1)} ${py.toFixed(1)}L${px.toFixed(1)} ${base.toFixed(1)}`
        return d
      }
      const heightAt = (cur: Float64Array, f: number) => {
        const p = clamp(f, 0, 1) * (N - 1)
        const i = Math.min(N - 2, Math.floor(p))
        return cur[i]! + (cur[i + 1]! - cur[i]!) * (p - i)
      }

      L.series.forEach((s, i) => {
        const r = rowsRef.current.get(s.id)
        if (!r) return
        if (L.reduced) r.cur.set(r.tgt)
        else if (ts >= r.start) {
          let delta = 0
          for (let j = 0; j < N; j++) {
            const e = r.tgt[j]! - r.cur[j]!
            r.cur[j] = r.cur[j]! + e * k
            if (Math.abs(e) > delta) delta = Math.abs(e)
          }
          if (delta > 0.0006) moving = true
          else r.cur.set(r.tgt)
        } else moving = true
        const base = L.baseY(i)
        const line = buildLine(r.cur, base, L.scaleH)
        const fill = lineEls.current.get(s.id)
        const fl = fillEls.current.get(s.id)
        if (fl) fl.setAttribute("d", `${line}Z`)
        if (fill) fill.setAttribute("d", line.replace(/L[^L]*$/, ""))
        const st = L.stats[i]!
        const frac = L.dHi > L.dLo ? (st.median - D.lo) / (D.hi - D.lo) : 0.5
        const m = medEls.current.get(s.id)
        if (m) {
          const mx = x0 + clamp(frac, 0, 1) * L.plotW
          m.setAttribute("x1", mx.toFixed(1))
          m.setAttribute("x2", mx.toFixed(1))
          m.setAttribute("y1", base.toFixed(1))
          m.setAttribute("y2", (base - heightAt(r.cur, frac) * L.scaleH).toFixed(1))
        }
        // the lifted copy follows its source ridge, with the middle half shaded and the median marked
        if (i === L.liftIdx) {
          const lf = lift.current
          lf.fill?.setAttribute("d", `${line}Z`)
          lf.line?.setAttribute("d", line.replace(/L[^L]*$/, ""))
          if (lf.med && m) {
            for (const a of ["x1", "x2", "y1", "y2"]) lf.med.setAttribute(a, m.getAttribute(a) ?? "0")
          }
          if (lf.iqr) {
            const f1 = clamp((st.q1 - D.lo) / (D.hi - D.lo), 0, 1)
            const f3 = clamp((st.q3 - D.lo) / (D.hi - D.lo), 0, 1)
            let d = `M${(x0 + f1 * L.plotW).toFixed(1)} ${base.toFixed(1)}`
            const j1 = Math.ceil(f1 * (N - 1))
            const j3 = Math.floor(f3 * (N - 1))
            d += `L${(x0 + f1 * L.plotW).toFixed(1)} ${(base - heightAt(r.cur, f1) * L.scaleH).toFixed(1)}`
            for (let j = j1; j <= j3; j++) d += `L${(x0 + j * dx).toFixed(1)} ${(base - r.cur[j]! * L.scaleH).toFixed(1)}`
            d += `L${(x0 + f3 * L.plotW).toFixed(1)} ${(base - heightAt(r.cur, f3) * L.scaleH).toFixed(1)}L${(x0 + f3 * L.plotW).toFixed(1)} ${base.toFixed(1)}Z`
            lf.iqr.setAttribute("d", d)
          }
        }
      })

      // ticks follow the eased domain
      for (const [v, g] of tickEls.current) {
        if (!g) continue
        const x = x0 + ((v - D.lo) / (D.hi - D.lo)) * L.plotW
        g.setAttribute("transform", `translate(${x.toFixed(1)} 0)`)
        g.style.opacity = x < x0 - 1 || x > x0 + L.plotW + 1 ? "0" : ""
      }

      // crosshair and tooltip
      const c = L.cursor
      const cross = crossRef.current
      const tip = tipRef.current
      if (c && cross) {
        const x = x0 + clamp((c.v - D.lo) / (D.hi - D.lo), 0, 1) * L.plotW
        cross.setAttribute("x1", x.toFixed(1))
        cross.setAttribute("x2", x.toFixed(1))
        if (tip) {
          const wrap = wrapRef.current
          const tw = tip.offsetWidth
          const th = tip.offsetHeight
          const maxX = (wrap?.clientWidth ?? 0) - tw
          const left = clamp(x + 14 > maxX ? x - tw - 14 : x + 14, 0, Math.max(0, maxX))
          const y = c.y ?? (L.activeIdx >= 0 ? L.baseY(L.activeIdx) - 24 : 0)
          const top = clamp(y - th / 2 - 6, 0, Math.max(0, L.H - th))
          tip.style.transform = `translate(${left}px, ${top}px)`
        }
      }

      if (moving) raf.current = requestAnimationFrame((t) => frameRef.current(t))
    }
    wake()
  })

  React.useLayoutEffect(() => {
    return () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0 // reset so the loop restarts after StrictMode's dev double-mount
      lastTs.current = 0
    }
  }, [])

  /* ------------------------------ Interactions ----------------------------- */
  const valueAt = (clientX: number) => {
    const el = wrapRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const f = (clientX - rect.left - plotL) / plotW
    return dom.current.lo + clamp(f, 0, 1) * (dom.current.hi - dom.current.lo)
  }
  /** The ridge under the pointer: the front-most one whose fill contains it, else the nearest row. */
  const rowAt = (clientX: number, clientY: number) => {
    const el = wrapRef.current
    if (!el || !n) return -1
    const rect = el.getBoundingClientRect()
    const y = clientY - rect.top
    const f = clamp((clientX - rect.left - plotL) / plotW, 0, 1)
    const p = f * (N - 1)
    const j = Math.min(N - 2, Math.floor(p))
    for (let i = n - 1; i >= 0; i--) {
      const r = rowsRef.current.get(series[i]!.id)
      if (!r) continue
      const h = (r.cur[j]! + (r.cur[j + 1]! - r.cur[j]!) * (p - j)) * scaleH
      const b = baseY(i)
      if (h > 1.5 && y <= b + 1 && y >= b - h) return i
    }
    return clamp(Math.floor((y - padTop) / rowHeight), 0, n - 1)
  }
  const onPointer = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || e.type === "pointerdown") {
      const i = rowAt(e.clientX, e.clientY)
      const v = valueAt(e.clientX)
      const rect = wrapRef.current?.getBoundingClientRect()
      if (i >= 0 && v !== null && rect) {
        const id = series[i]!.id
        if (id !== active) setActive(id)
        setCursor({ v, y: e.clientY - rect.top })
        setKbOn(false)
      }
    }
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!n) return
    const idx = activeIdx >= 0 ? activeIdx : -1
    let next = idx
    let v = cursor?.v ?? null
    switch (e.key) {
      case "ArrowUp":
        next = idx < 0 ? n - 1 : Math.max(0, idx - 1)
        break
      case "ArrowDown":
        next = idx < 0 ? 0 : Math.min(n - 1, idx + 1)
        break
      case "Home":
        next = 0
        break
      case "End":
        next = n - 1
        break
      case "ArrowLeft":
      case "ArrowRight": {
        const base = v ?? (idx >= 0 ? stats[idx]!.median : (dLo + dHi) / 2)
        v = clamp(Math.round(base / tickStep) * tickStep + (e.key === "ArrowLeft" ? -tickStep : tickStep), dLo, dHi)
        if (idx < 0) next = Math.floor(n / 2)
        break
      }
      case "Escape":
        setActive(null)
        setCursor(null)
        return
      default:
        return
    }
    e.preventDefault()
    setKbOn(true)
    if (next !== idx && next >= 0) setActive(series[next]!.id)
    const target = next >= 0 ? next : idx
    setCursor({ v: v ?? (target >= 0 ? stats[target]!.median : (dLo + dHi) / 2), y: null })
  }

  /* --------------------------------- Output -------------------------------- */
  const hasData = n > 0 && stats.some((s) => s.n > 0)
  const act = activeIdx >= 0 ? stats[activeIdx]! : null
  const actSeries = activeIdx >= 0 ? series[activeIdx]! : null
  const cdf = act && cursor ? act.sorted.filter((x) => x <= cursor.v).length / Math.max(1, act.n) : null
  const pct = cdf === null ? null : Math.round(cdf * 100)
  const summary = actSeries && act ? `${actSeries.label}: median ${fmt(act.median)}, middle half ${fmt(act.q1)} to ${fmt(act.q3)}, range ${fmt(act.min)} to ${fmt(act.max)}, ${act.n} values` : ""
  const ramp = Array.from({ length: STEPS }, (_, i) => i / (STEPS - 1))
  const stageHeight = hasData ? H : 140

  return (
    <figure className={cn("rdg", className)} aria-label={label}>
      <style href="ridgeline" precedence="default">
        {CSS}
      </style>
      {(title || subtitle || actions) && (
        <div className="rdg-head">
          <div>
            {title && <p className="rdg-title">{title}</p>}
            {subtitle && <p className="rdg-sub">{subtitle}</p>}
          </div>
          {actions && <div className="rdg-actions">{actions}</div>}
        </div>
      )}

      <div
        ref={wrapRef}
        className="rdg-stage"
        style={{ height: stageHeight }}
        role="group"
        tabIndex={hasData ? 0 : -1}
        aria-label={`${label}. Up and down arrows lift a ridge, left and right arrows move the reading.`}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setKbOn(true)
        }}
        onBlur={() => {
          setKbOn(false)
          setActive(null)
          setCursor(null)
        }}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return
          setActive(null)
          setCursor(null)
        }}
      >
        {!hasData && <div className="rdg-empty">{emptyLabel}</div>}
        {hasData && width > 0 && (
          <svg ref={svgRef} width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden="true">
            {ticks.map((v) => (
              <g key={v} ref={(el) => void tickEls.current.set(v, el)} transform={`translate(${plotL + ((v - dLo) / (dHi - dLo)) * plotW} 0)`}>
                <line className="rdg-tick" x1="0" x2="0" y1={padTop - 2} y2={H - AXIS_H + 2} />
                <text className="rdg-tl" y={H - 8}>
                  {fmt(v)}
                </text>
              </g>
            ))}
            {series.map((s, i) => (
              <text key={s.id} className="rdg-rl" x={plotL - 10} y={baseY(i) - 3} data-on={activeIdx === i ? "" : undefined}>
                {s.label}
              </text>
            ))}
            {series.map((s, i) => (
              <g key={s.id} className="rdg-r" data-dim={activeIdx >= 0 && activeIdx !== i ? "" : undefined} style={{ "--m": stepOf(stats[i]!) } as React.CSSProperties}>
                <path className="rdg-fill" ref={(el) => void fillEls.current.set(s.id, el)} />
                <line className="rdg-med" ref={(el) => void medEls.current.set(s.id, el)} />
                <path className="rdg-ln" ref={(el) => void lineEls.current.set(s.id, el)} />
              </g>
            ))}
            {liftIdx >= 0 && stats[liftIdx] && (
              <g className="rdg-lift" data-on={activeIdx >= 0 ? "" : undefined} style={{ "--m": stepOf(stats[liftIdx]!) } as React.CSSProperties}>
                <path className="rdg-fill" ref={(el) => void (lift.current.fill = el)} />
                <path className="rdg-iqr" ref={(el) => void (lift.current.iqr = el)} />
                <line className="rdg-med" ref={(el) => void (lift.current.med = el)} />
                <path className="rdg-ln" ref={(el) => void (lift.current.line = el)} />
              </g>
            )}
            <line ref={crossRef} className="rdg-cross" data-on={cursor ? "" : undefined} y1={padTop - 2} y2={H - AXIS_H + 2} />
          </svg>
        )}
        <div ref={tipRef} className="rdg-tip" data-on={cursor && act && actSeries ? "" : undefined} aria-hidden="true">
          {act && actSeries && (
            <>
              <p className="rdg-tip-h">{actSeries.label}</p>
              <div className="rdg-tip-r">
                <span>Median</span>
                <b>{fmt(act.median)}</b>
              </div>
              <div className="rdg-tip-r">
                <span>Middle half</span>
                <b>{`${fmt(act.q1)} to ${fmt(act.q3)}`}</b>
              </div>
              <div className="rdg-tip-r">
                <span>Range</span>
                <b>{`${fmt(act.min)} to ${fmt(act.max)}`}</b>
              </div>
              {cursor && pct !== null && <p className="rdg-tip-f">{`${pct}% at or below ${fmt(cursor.v)}`}</p>}
            </>
          )}
        </div>
      </div>

      {tint && hasData && (
        <div className="rdg-legend" aria-hidden="true">
          <span>Median</span>
          <span>{fmt(dLo)}</span>
          <span className="rdg-ramp">
            {ramp.map((m) => (
              <i key={m} style={{ "--m": m } as React.CSSProperties} />
            ))}
          </span>
          <span>{fmt(dHi)}</span>
        </div>
      )}

      <p className="rdg-sr" role="status" aria-live="polite">
        {summary}
        {kbOn && cursor && pct !== null ? `. ${pct}% at or below ${fmt(cursor.v)}` : ""}
      </p>
      <div className="rdg-sr">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th>Series</th>
              <th>Median</th>
              <th>First quartile</th>
              <th>Third quartile</th>
              <th>Lowest</th>
              <th>Highest</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s, i) => (
              <tr key={s.id}>
                <th scope="row">{s.label}</th>
                <td>{fmt(stats[i]!.median)}</td>
                <td>{fmt(stats[i]!.q1)}</td>
                <td>{fmt(stats[i]!.q3)}</td>
                <td>{fmt(stats[i]!.min)}</td>
                <td>{fmt(stats[i]!.max)}</td>
                <td>{stats[i]!.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

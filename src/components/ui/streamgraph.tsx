"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type StreamSeries = {
  key: string
  label: string
  /** Any CSS colour. Defaults to the built-in series palette. */
  color?: string
}
export type StreamPoint = {
  key: string
  /** Full name of the point, used in the tooltip and table (e.g. "Week of Sep 22"). */
  label: string
  /** Short label for the time axis. Only points that have one are candidates for a tick. */
  axisLabel?: string
  values: Record<string, number | undefined>
}

export type StreamgraphProps = {
  /** Points in time. Datasets of any length morph into each other. */
  data: StreamPoint[]
  /** Layers from the centre out: the first runs through the middle and the rest alternate above and below it. */
  series: StreamSeries[]
  /** Names the chart for assistive technology. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header, e.g. a range switch. */
  actions?: React.ReactNode
  /** Unit after each value. */
  unit?: string
  /** Plot height in pixels. */
  height?: number
  /** `wiggle` minimises layer slopes, `silhouette` centres the stack, `zero` stacks from a flat baseline. */
  offset?: "wiggle" | "silhouette" | "zero"
  /** Formats values in the tooltip and table. */
  formatValue?: (value: number, series: StreamSeries) => string
  /** Controlled hidden layers. A hidden layer thins to nothing and the rest reflow. */
  hiddenSeries?: string[]
  defaultHiddenSeries?: string[]
  onHiddenSeriesChange?: (hidden: string[]) => void
  /** Called as the reading moves between points and layers. */
  onActiveChange?: (index: number | null, seriesKey: string | null) => void
  /** Layer toggles above the plot. */
  legend?: boolean
  /** Names each layer at its thickest stretch when the text fits. */
  directLabels?: boolean
  /** Header of the first column in the screen reader table. */
  categoryLabel?: string
  /** Shown when there are no points. */
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.stg {
  --stg-ink: #000;
  --stg-surface: #fff;
  --stg-accent: #0060e2;
  --stg-s0: oklch(.62 .14 255);
  --stg-s1: oklch(.5 .18 305);
  --stg-s2: oklch(.76 .15 75);
  --stg-s3: oklch(.64 .12 185);
  --stg-s4: oklch(.7 0 0);
  --stg-s5: oklch(.84 0 0);
  --stg-lt: #fff;
  --stg-t1: color-mix(in oklab, var(--stg-ink) 88%, transparent);
  --stg-t2: color-mix(in oklab, var(--stg-ink) 61%, transparent);
  --stg-t3: color-mix(in oklab, var(--stg-ink) 45%, transparent);
  --stg-t4: color-mix(in oklab, var(--stg-ink) 27%, transparent);
  --stg-fill: color-mix(in oklab, var(--stg-ink) 6%, transparent);
  --stg-line: color-mix(in oklab, var(--stg-ink) 6%, transparent);
  --stg-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --stg-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --stg-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0;
  padding: 18px 20px 14px;
  border-radius: 16px;
  background: var(--stg-surface);
  box-shadow: var(--stg-shadow);
  color: var(--stg-t1);
  font-family: var(--stg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .stg {
  --stg-ink: #fff;
  --stg-surface: #1c1c1e;
  --stg-accent: #4d8dff;
  --stg-s0: oklch(.7 .13 255);
  --stg-s1: oklch(.64 .16 305);
  --stg-s2: oklch(.78 .14 75);
  --stg-s3: oklch(.72 .11 185);
  --stg-s4: oklch(.6 0 0);
  --stg-s5: oklch(.45 0 0);
  --stg-lt: rgb(0 0 0 / .78);
  --stg-t1: color-mix(in oklab, var(--stg-ink) 90%, transparent);
  --stg-t2: color-mix(in oklab, var(--stg-ink) 62%, transparent);
  --stg-t3: color-mix(in oklab, var(--stg-ink) 46%, transparent);
  --stg-t4: color-mix(in oklab, var(--stg-ink) 28%, transparent);
  --stg-fill: color-mix(in oklab, var(--stg-ink) 8%, transparent);
  --stg-line: color-mix(in oklab, var(--stg-ink) 8%, transparent);
  --stg-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --stg-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.stg) *, :where(.stg) *::before, :where(.stg) *::after { box-sizing: border-box }
:where(.stg) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.stg :focus-visible { outline: 2px solid color-mix(in oklab, var(--stg-accent) 60%, transparent); outline-offset: 1px }

.stg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px }
.stg-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--stg-t1) }
.stg-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--stg-t3) }
.stg-actions { flex: none }

.stg-legend { display: flex; flex-wrap: wrap; gap: 4px 6px; margin: 0 0 8px -6px; padding: 0; list-style: none }
.stg-chip {
  display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px; border-radius: 12px;
  font-size: 12px; line-height: 16px; font-weight: 500; color: var(--stg-t2); transition: background-color .16s, color .16s, opacity .2s;
}
.stg-chip:hover, .stg-chip[data-iso] { background: var(--stg-fill); color: var(--stg-t1) }
.stg-chip i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); transition: transform .2s var(--stg-ease), opacity .2s }
.stg-chip[aria-pressed="false"] { color: var(--stg-t4) }
.stg-chip[aria-pressed="false"] i { opacity: .35; transform: scale(.7) }

.stg-stage { position: relative; width: 100%; border-radius: 10px; outline-offset: 4px; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: crosshair }
.stg-stage svg { display: block; width: 100%; height: 100%; overflow: visible }
.stg-l { fill: var(--c); stroke: var(--stg-surface); stroke-width: 2px; stroke-linejoin: round; transition: opacity .28s var(--stg-ease) }
.stg-l[data-dim] { opacity: .26 }
.stg-lb { pointer-events: none; font-size: 11px; font-weight: 500; fill: var(--lt, var(--stg-lt)); transition: opacity .2s }
.stg-lb[data-dim] { display: none }
.stg-cross { stroke: var(--stg-t3); stroke-width: 1; pointer-events: none; transition: opacity .15s }
.stg-ax { font-size: 11px; fill: var(--stg-t3); animation: stg-in .5s var(--stg-ease) backwards }

.stg-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; min-width: 150px; padding: 8px 10px; border-radius: 10px;
  background: var(--stg-surface); box-shadow: var(--stg-tip); pointer-events: none; opacity: 0; transition: opacity .14s;
  font-size: 12px; line-height: 16px;
}
.stg-tip[data-on] { opacity: 1 }
.stg-tip-h { margin-bottom: 4px; color: var(--stg-t3); font-size: 11px; line-height: 14px }
.stg-tip-r { display: flex; align-items: center; gap: 8px; color: var(--stg-t2) }
.stg-tip-r i { width: 8px; height: 2px; border-radius: 1px; background: var(--c) }
.stg-tip-r span { flex: 1 }
.stg-tip-r b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--stg-t1) }
.stg-tip-r[data-iso] { color: var(--stg-t1) }
.stg-tip-r[data-iso] span, .stg-tip-r[data-iso] b { font-weight: 600 }
.stg-tip-r[data-off] { opacity: .45 }
.stg-empty { display: grid; place-items: center; min-height: 160px; color: var(--stg-t3) }

.stg-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
@keyframes stg-in { from { opacity: 0 } }

@media (max-width: 420px) { .stg { padding: 14px 12px 10px } }
@media (prefers-reduced-motion: reduce) {
  .stg *, .stg *::before, .stg *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Maths                                   */
/* -------------------------------------------------------------------------- */

/** Every layer is resampled onto the same fixed grid so datasets of any length can morph into each other. */
const N = 161
const PALETTE = ["var(--stg-s0)", "var(--stg-s1)", "var(--stg-s2)", "var(--stg-s3)", "var(--stg-s4)", "var(--stg-s5)"]
const LABEL_INK = ["#fff", "#fff", "rgb(0 0 0 / .78)", "#fff", "rgb(0 0 0 / .78)", "rgb(0 0 0 / .7)"]

function resample(v: number[]): Float64Array {
  const out = new Float64Array(N)
  const n = v.length
  if (!n) return out
  if (n === 1) return out.fill(v[0]!)
  for (let i = 0; i < N; i++) {
    const p = (i / (N - 1)) * (n - 1)
    const j = Math.min(n - 2, Math.floor(p))
    const t = p - j
    const p0 = v[Math.max(0, j - 1)]!
    const p1 = v[j]!
    const p2 = v[j + 1]!
    const p3 = v[Math.min(n - 1, j + 2)]!
    // Catmull-Rom through the data points, so peaks stay soft instead of kinked.
    const y = 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    out[i] = Math.max(0, y)
  }
  return out
}

/** Inside-out order, bottom to top: series 0 in the middle, odd ones above it, even ones below. */
function insideOut(n: number): number[] {
  const below: number[] = []
  const above: number[] = []
  for (let i = 1; i < n; i++) (i % 2 ? above : below).push(i)
  return [...below.reverse(), 0, ...above].filter((i) => i < n)
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const nf = new Intl.NumberFormat("en")

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

type Active = { idx: number; key: string | null }
const PAD_Y = 10
const AXIS_H = 24

/* -------------------------------------------------------------------------- */
/*                                 Streamgraph                                */
/* -------------------------------------------------------------------------- */

export function Streamgraph({
  data,
  series,
  label,
  title,
  subtitle,
  actions,
  unit = "",
  height = 260,
  offset = "wiggle",
  formatValue,
  hiddenSeries,
  defaultHiddenSeries = [],
  onHiddenSeriesChange,
  onActiveChange,
  legend = true,
  directLabels = true,
  categoryLabel = "Date",
  emptyLabel = "No data for this range",
  className,
}: StreamgraphProps) {
  const reduced = usePrefersReducedMotion()
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(640)
  React.useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(120, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [hiddenInner, setHiddenInner] = React.useState(defaultHiddenSeries)
  const hidden = hiddenSeries ?? hiddenInner
  const toggle = (key: string) => {
    const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]
    setHiddenInner(next)
    onHiddenSeriesChange?.(next)
  }
  const [act, setAct] = React.useState<Active | null>(null)
  const [legendKey, setLegendKey] = React.useState<string | null>(null)
  const iso = legendKey ?? act?.key ?? null
  const fmt = React.useCallback((v: number, s: StreamSeries) => (formatValue ? formatValue(v, s) : nf.format(Math.round(v))), [formatValue])
  const setActive = (a: Active | null) => {
    setAct(a)
    onActiveChange?.(a ? a.idx : null, a ? a.key : null)
  }

  const order = React.useMemo(() => insideOut(series.length), [series.length])
  const n = data.length
  const H = height
  const plotH = H - AXIS_H

  /* ------------------------------- Animation ------------------------------- */
  const cur = React.useRef(new Map<string, Float64Array>())
  const tgt = React.useRef(new Map<string, Float64Array>())
  const vis = React.useRef(new Map<string, { c: number; t: number }>())
  const layerEls = React.useRef(new Map<string, SVGPathElement | null>())
  const labelEls = React.useRef(new Map<string, SVGTextElement | null>())
  const crossRef = React.useRef<SVGLineElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const raf = React.useRef(0)
  const lastT = React.useRef(0)
  const started = React.useRef(false)
  const onScreen = React.useRef(false)
  const cross = React.useRef({ c: 0, t: 0, init: false })
  const frameGeo = React.useRef<{ lo: Float64Array[]; hi: Float64Array[]; ymap: { s: number; mid: number } }>({ lo: [], hi: [], ymap: { s: 1, mid: 0 } })
  const live = React.useRef({ series, order, width, plotH, offset, directLabels, reduced })
  React.useLayoutEffect(() => {
    live.current = { series, order, width, plotH, offset, directLabels, reduced }
  })

  const paint = React.useCallback(() => {
    const { series: ss, order: ord, width: W, plotH: PH, offset: off, directLabels: dl } = live.current
    const k = ss.length
    if (!k) return
    // Current value of each layer on the grid, scaled by its visibility.
    const vals: Float64Array[] = []
    for (let i = 0; i < k; i++) {
      const c = cur.current.get(ss[i]!.key)
      const v = vis.current.get(ss[i]!.key)?.c ?? 1
      const arr = new Float64Array(N)
      if (c) for (let j = 0; j < N; j++) arr[j] = c[j]! * v
      vals.push(arr)
    }
    const base = new Float64Array(N)
    if (off === "wiggle") {
      let y = 0
      for (let j = 1; j < N; j++) {
        let s1 = 0
        let s2 = 0
        for (let a = 0; a < k; a++) {
          const sa = vals[ord[a]!]!
          let s3 = (sa[j]! - sa[j - 1]!) / 2
          for (let b = 0; b < a; b++) s3 += vals[ord[b]!]![j]! - vals[ord[b]!]![j - 1]!
          s1 += sa[j]!
          s2 += s3 * sa[j]!
        }
        base[j - 1] = y
        if (s1) y -= s2 / s1
      }
      base[N - 1] = y
    } else if (off === "silhouette") {
      for (let j = 0; j < N; j++) {
        let t = 0
        for (let a = 0; a < k; a++) t += vals[a]![j]!
        base[j] = -t / 2
      }
    }
    const lo: Float64Array[] = new Array(k)
    const hi: Float64Array[] = new Array(k)
    let min = Infinity
    let max = -Infinity
    const acc = Float64Array.from(base)
    for (let a = 0; a < k; a++) {
      const idx = ord[a]!
      const l = Float64Array.from(acc)
      const h = new Float64Array(N)
      for (let j = 0; j < N; j++) {
        acc[j] = acc[j]! + vals[idx]![j]!
        h[j] = acc[j]!
        if (l[j]! < min) min = l[j]!
        if (h[j]! > max) max = h[j]!
      }
      lo[idx] = l
      hi[idx] = h
    }
    if (!isFinite(min) || max - min < 1e-6) {
      min = 0
      max = 1
    }
    const usable = PH - PAD_Y * 2
    const s = usable / (max - min)
    const mid = (max + min) / 2
    const yOf = (v: number) => PAD_Y + usable / 2 - (v - mid) * s
    // zero-baseline charts sit on the floor instead of floating in the middle
    const yz = off === "zero" ? (v: number) => PAD_Y + usable - (v - min) * s : yOf
    const toY = off === "zero" ? yz : yOf
    const loPx: Float64Array[] = new Array(k)
    const hiPx: Float64Array[] = new Array(k)
    for (let i = 0; i < k; i++) {
      const lp = new Float64Array(N)
      const hp = new Float64Array(N)
      let up = "M"
      let dn = ""
      for (let j = 0; j < N; j++) {
        lp[j] = toY(lo[i]![j]!)
        hp[j] = toY(hi[i]![j]!)
        const x = ((j / (N - 1)) * W).toFixed(1)
        up += `${j ? "L" : ""}${x} ${hp[j]!.toFixed(1)}`
        dn = `L${x} ${lp[j]!.toFixed(1)}${dn}`
      }
      loPx[i] = lp
      hiPx[i] = hp
      const el = layerEls.current.get(ss[i]!.key)
      const thin = vals[i]!.every((v) => v < 0.01)
      el?.setAttribute("d", thin ? "" : `${up}${dn}Z`)

      // Direct label at the layer's thickest stretch.
      const t = labelEls.current.get(ss[i]!.key)
      if (t) {
        let best = -1
        let bj = 0
        for (let j = Math.round(N * 0.06); j < N * 0.94; j += 2) {
          const th = lp[j]! - hp[j]!
          if (th > best) {
            best = th
            bj = j
          }
        }
        const w = ss[i]!.label.length * 6.1 + 10
        const x = clamp((bj / (N - 1)) * W, w / 2, W - w / 2)
        const fit = dl ? clamp((best - 17) / 6, 0, 1) : 0
        t.setAttribute("x", x.toFixed(1))
        t.setAttribute("y", ((lp[bj]! + hp[bj]!) / 2 + 3.8).toFixed(1))
        t.style.opacity = String(fit)
      }
    }
    frameGeo.current = { lo: loPx, hi: hiPx, ymap: { s, mid } }
  }, [])

  const tick = React.useCallback(
    function tick(now: number) {
      const dt = Math.min(0.05, Math.max(0.001, (now - (lastT.current || now - 16)) / 1000))
      lastT.current = now
      let moving = false
      const a = 1 - Math.exp(-dt / 0.14)
      for (const [key, t] of tgt.current) {
        let c = cur.current.get(key)
        if (!c) cur.current.set(key, (c = new Float64Array(N)))
        for (let j = 0; j < N; j++) {
          const d = t[j]! - c[j]!
          if (Math.abs(d) > 0.01) {
            c[j] = c[j]! + d * a
            moving = true
          } else c[j] = t[j]!
        }
      }
      for (const v of vis.current.values()) {
        const d = v.t - v.c
        if (Math.abs(d) > 0.002) {
          v.c += d * (1 - Math.exp(-dt / 0.16))
          moving = true
        } else v.c = v.t
      }
      const cr = cross.current
      const dx = cr.t - cr.c
      if (Math.abs(dx) > 0.1) {
        cr.c += dx * (1 - Math.exp(-dt / 0.06))
        moving = true
      } else cr.c = cr.t
      crossRef.current?.setAttribute("x1", cr.c.toFixed(1))
      crossRef.current?.setAttribute("x2", cr.c.toFixed(1))
      paint()
      raf.current = moving ? requestAnimationFrame(tick) : 0
    },
    [paint],
  )
  const wake = React.useCallback(() => {
    if (!raf.current && started.current) {
      lastT.current = 0
      raf.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Targets follow the data; layers keep their current shape, so a new range morphs.
  React.useEffect(() => {
    const next = new Map<string, Float64Array>()
    for (const s of series) next.set(s.key, resample(data.map((p) => Math.max(0, p.values[s.key] ?? 0))))
    tgt.current = next
    for (const s of series) {
      if (!vis.current.has(s.key)) vis.current.set(s.key, { c: 1, t: 1 })
    }
    for (const k of [...cur.current.keys()]) if (!next.has(k)) cur.current.delete(k)
    if (reduced) for (const [k, t] of next) cur.current.set(k, Float64Array.from(t))
    wake()
    if (started.current) wake()
  }, [data, series, reduced, wake])
  React.useEffect(() => {
    for (const s of series) {
      const v = vis.current.get(s.key) ?? { c: 1, t: 1 }
      v.t = hidden.includes(s.key) ? 0 : 1
      if (reduced) v.c = v.t
      vis.current.set(s.key, v)
    }
    wake()
  }, [hidden, series, reduced, wake])
  React.useEffect(() => {
    live.current.width = width
    paint()
    // crosshair follows resizes
    if (act) cross.current.c = cross.current.t = (act.idx / Math.max(1, n - 1)) * width
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, offset, directLabels, paint])

  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const go = () => {
      if (started.current) return
      started.current = true
      wake()
    }
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = !!e?.isIntersecting
        if (onScreen.current) go()
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    // Background tabs may never report intersection; do not leave the chart blank.
    const fallback = window.setTimeout(go, 1500)
    return () => {
      window.clearTimeout(fallback)
      io.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [wake, n])

  /* ------------------------------ Interaction ------------------------------ */
  const xOfIdx = (i: number) => (i / Math.max(1, n - 1)) * width
  const moveCross = (i: number) => {
    const cr = cross.current
    cr.t = xOfIdx(i)
    if (!cr.init || reduced) {
      cr.c = cr.t
      cr.init = true
    }
    wake()
  }
  const placeTip = (x: number, y: number) => {
    const tip = tipRef.current
    const stage = stageRef.current
    if (!tip || !stage) return
    const w = tip.offsetWidth
    const h = tip.offsetHeight
    let tx = x + 16
    if (tx + w > stage.clientWidth + 8) tx = x - w - 16
    tx = Math.max(-8, tx)
    tip.style.transform = `translate(${tx}px, ${clamp(y - h / 2, 0, Math.max(0, plotH - h))}px)`
  }
  const layerAt = (j: number, y: number): string | null => {
    const g = frameGeo.current
    for (let i = 0; i < series.length; i++) {
      const hp = g.hi[i]?.[j]
      const lp = g.lo[i]?.[j]
      if (hp != null && lp != null && lp - hp > 0.5 && y >= hp && y <= lp) return series[i]!.key
    }
    return null
  }
  const pointerAt = (ev: React.PointerEvent) => {
    const stage = stageRef.current
    if (!stage || !n) return
    const b = stage.getBoundingClientRect()
    const x = clamp(ev.clientX - b.left, 0, b.width)
    const y = ev.clientY - b.top
    const idx = clamp(Math.round((x / b.width) * (n - 1)), 0, n - 1)
    const key = y <= plotH ? layerAt(Math.round((x / b.width) * (N - 1)), y) : null
    setAct((p) => {
      if (p && p.idx === idx && p.key === key) return p
      onActiveChange?.(idx, key)
      return { idx, key }
    })
    moveCross(idx)
    placeTip(x, y)
  }

  const visibleOrderTopDown = [...order].reverse().map((i) => series[i]!).filter((s) => !hidden.includes(s.key))
  const stepKey = (dir: 1 | -1) => {
    const list = visibleOrderTopDown
    if (!list.length) return null
    const i = act?.key ? list.findIndex((s) => s.key === act.key) : -1
    if (i < 0) return (dir === 1 ? list[Math.floor(list.length / 2)] : list[Math.floor(list.length / 2)])!.key
    return list[clamp(i + dir, 0, list.length - 1)]!.key
  }
  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (!n) return
    const i = act?.idx ?? n - 1
    const jump = Math.max(1, Math.round((n - 1) / 6))
    let next: Active | null | undefined
    switch (ev.key) {
      case "ArrowLeft": next = { idx: clamp(i - 1, 0, n - 1), key: act?.key ?? null }; break
      case "ArrowRight": next = { idx: clamp(i + 1, 0, n - 1), key: act?.key ?? null }; break
      case "PageUp": next = { idx: clamp(i - jump, 0, n - 1), key: act?.key ?? null }; break
      case "PageDown": next = { idx: clamp(i + jump, 0, n - 1), key: act?.key ?? null }; break
      case "Home": next = { idx: 0, key: act?.key ?? null }; break
      case "End": next = { idx: n - 1, key: act?.key ?? null }; break
      case "ArrowUp": next = { idx: i, key: stepKey(-1) }; break
      case "ArrowDown": next = { idx: i, key: stepKey(1) }; break
      case "Escape": next = null; break
      default: return
    }
    ev.preventDefault()
    setActive(next)
    if (next) {
      moveCross(next.idx)
      const row = (next.key ? series.findIndex((s) => s.key === next!.key) : -1)
      const g = frameGeo.current
      const j = Math.round((next.idx / Math.max(1, n - 1)) * (N - 1))
      const y = row >= 0 && g.hi[row] ? (g.hi[row]![j]! + g.lo[row]![j]!) / 2 : plotH / 2
      placeTip(xOfIdx(next.idx), y)
    }
  }

  /* --------------------------------- Render -------------------------------- */
  const colorOf = (s: StreamSeries, i: number) => s.color ?? PALETTE[i % PALETTE.length]!
  const active = act && data[act.idx] ? act : null
  const point = active ? data[active.idx]! : null
  // Axis ticks: only labelled points, at least 72px apart, counted back from the latest.
  const ticks = React.useMemo(() => {
    const out: { i: number; text: string; key: string }[] = []
    let lastX = Infinity
    for (let i = n - 1; i >= 0; i--) {
      const t = data[i]!.axisLabel
      if (!t) continue
      const x = (i / Math.max(1, n - 1)) * width
      if (lastX - x >= 72 && x >= 16 && x <= width - 16) {
        out.push({ i, text: t, key: data[i]!.key })
        lastX = x
      } else if (lastX === Infinity && x <= width - 16) {
        out.push({ i, text: t, key: data[i]!.key })
        lastX = x
      }
    }
    return out
  }, [data, n, width])
  const total = point ? series.reduce((a, s) => a + (hidden.includes(s.key) ? 0 : point.values[s.key] ?? 0), 0) : 0
  const announce = (() => {
    if (!point || !active) return ""
    const s = active.key ? series.find((x) => x.key === active.key) : undefined
    return `${point.label}. ${s ? `${s.label}, ${fmt(point.values[s.key] ?? 0, s)} ${unit}. ` : ""}Total ${nf.format(total)} ${unit}`
  })()
  const latest = data[n - 1]
  const summary = latest
    ? `${label}, ${data[0]!.label} to ${latest.label}. ${series.map((s) => `${s.label}, latest ${fmt(latest.values[s.key] ?? 0, s)} ${unit}`).join(". ")}.`
    : label

  return (
    <figure className={cn("stg", className)} aria-label={label}>
      <style href="streamgraph" precedence="default">
        {CSS}
      </style>

      {(title || subtitle || actions) && (
        <div className="stg-head">
          <div>
            {title && <p className="stg-title">{title}</p>}
            {subtitle && <p className="stg-sub">{subtitle}</p>}
          </div>
          {actions && <div className="stg-actions">{actions}</div>}
        </div>
      )}

      {legend && n > 0 && (
        <ul className="stg-legend" aria-label="Layers">
          {series.map((s, i) => (
            <li key={s.key} style={{ ["--c" as string]: colorOf(s, i) }}>
              <button
                type="button"
                className="stg-chip"
                aria-pressed={!hidden.includes(s.key)}
                data-iso={iso === s.key || undefined}
                onClick={() => toggle(s.key)}
                onPointerEnter={() => setLegendKey(s.key)}
                onPointerLeave={() => setLegendKey(null)}
                onFocus={() => setLegendKey(s.key)}
                onBlur={() => setLegendKey(null)}
              >
                <i />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={wrapRef}>
        {n === 0 ? (
          <div className="stg-empty">{emptyLabel}</div>
        ) : (
          <div
            ref={stageRef}
            className="stg-stage"
            style={{ height: H }}
            role="group"
            tabIndex={0}
            aria-roledescription="streamgraph"
            aria-label={`${summary} Arrow keys move through time and between layers, Escape clears.`}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              if (!e.currentTarget.matches(":focus-visible") || act) return
              const next = { idx: n - 1, key: null }
              setActive(next)
              moveCross(next.idx)
              placeTip(xOfIdx(next.idx), plotH / 2)
            }}
            onBlur={() => setActive(null)}
            onPointerDown={(e) => {
              if (e.pointerType === "touch") e.currentTarget.setPointerCapture(e.pointerId)
              pointerAt(e)
            }}
            onPointerMove={pointerAt}
            onPointerLeave={(e) => e.pointerType !== "touch" && setActive(null)}
            onPointerUp={(e) => e.pointerType === "touch" && setActive(null)}
          >
            <svg viewBox={`0 0 ${width} ${H}`} aria-hidden>
              {series.map((s, i) => (
                <path
                  key={s.key}
                  ref={(el) => void layerEls.current.set(s.key, el)}
                  className="stg-l"
                  data-dim={iso && iso !== s.key ? "" : undefined}
                  style={{ ["--c" as string]: colorOf(s, i) }}
                />
              ))}
              {series.map((s, i) => (
                <text
                  key={s.key}
                  ref={(el) => void labelEls.current.set(s.key, el)}
                  className="stg-lb"
                  textAnchor="middle"
                  data-dim={iso && iso !== s.key ? "" : undefined}
                  style={{ ["--lt" as string]: LABEL_INK[i % LABEL_INK.length] }}
                >
                  {s.label}
                </text>
              ))}
              <line ref={crossRef} className="stg-cross" y1={0} y2={plotH} style={{ opacity: active ? 1 : 0 }} />
              {ticks.map((t) => (
                <text key={t.key} className="stg-ax" x={(t.i / Math.max(1, n - 1)) * width} y={H - 6} textAnchor="middle">
                  {t.text}
                </text>
              ))}
            </svg>
            <div ref={tipRef} className="stg-tip" data-on={active ? "" : undefined} aria-hidden>
              {point && (
                <>
                  <div className="stg-tip-h">{point.label}</div>
                  {[...order].reverse().map((i) => {
                    const s = series[i]!
                    return (
                      <div
                        className="stg-tip-r"
                        key={s.key}
                        data-iso={iso === s.key || undefined}
                        data-off={hidden.includes(s.key) || undefined}
                        style={{ ["--c" as string]: colorOf(s, i) }}
                      >
                        <i />
                        <span>{s.label}</span>
                        <b>
                          {fmt(point.values[s.key] ?? 0, s)}
                          {unit ? ` ${unit}` : ""}
                        </b>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="stg-sr" role="status" aria-live="polite">
        {announce}
      </div>
      <table className="stg-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>{categoryLabel}</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.key}>
              <td>{p.label}</td>
              {series.map((s) => (
                <td key={s.key}>
                  {fmt(p.values[s.key] ?? 0, s)} {unit}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

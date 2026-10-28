"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FunnelStage = {
  key: string
  label: string
  /** Total for the step. Use without `segments`. */
  value?: number
  /** Value per segment key. Use with `segments`. */
  values?: Record<string, number>
}
export type FunnelSegment = { key: string; label: string }

export type FunnelChartProps = {
  /** Ordered steps. */
  stages: FunnelStage[]
  /** Parts of every step, such as devices. Leave it out for one total per step. */
  segments?: FunnelSegment[]
  /** What is counted. Names the chart, the summary and the table. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header: view switch, toggles. */
  actions?: React.ReactNode
  /** Noun after counts in the tooltip and table, such as "sessions". */
  unit?: string
  /** `total` draws one band, `split` stacks every segment with a gap, a segment key isolates it and rescales the band. */
  view?: "total" | "split" | (string & {})
  /** Dots that stream through the band. Each leaves where the band narrows, so the falling share matches the drop-off. */
  flow?: boolean
  /** `auto` turns the funnel vertical below 420px of container width. */
  orientation?: "auto" | "horizontal" | "vertical"
  /** Band area thickness in pixels when horizontal. */
  height?: number
  /** Formats counts. Defaults to compact numbers in headings and full numbers in the tooltip. */
  formatValue?: (value: number) => string
  /** Controlled step in focus. */
  activeIndex?: number | null
  onActiveChange?: (index: number | null) => void
  /** Message when the first step is zero. */
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.fnl {
  --fnl-ink: #000;
  --fnl-surface: #fff;
  --fnl-accent: #0060e2;
  --fnl-s0: oklch(.6 .15 255);
  --fnl-s1: oklch(.5 .18 305);
  --fnl-s2: oklch(.74 .16 75);
  --fnl-s3: oklch(.62 .13 185);
  --fnl-s4: oklch(.66 0 0);
  --fnl-base: oklch(.9 .045 255);
  --fnl-t1: color-mix(in oklab, var(--fnl-ink) 88%, transparent);
  --fnl-t2: color-mix(in oklab, var(--fnl-ink) 61%, transparent);
  --fnl-t3: color-mix(in oklab, var(--fnl-ink) 45%, transparent);
  --fnl-t4: color-mix(in oklab, var(--fnl-ink) 27%, transparent);
  --fnl-fill: color-mix(in oklab, var(--fnl-ink) 6%, transparent);
  --fnl-line: color-mix(in oklab, var(--fnl-ink) 8%, transparent);
  --fnl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --fnl-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --fnl-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0;
  padding: 18px 20px 16px;
  border-radius: 16px;
  background: var(--fnl-surface);
  box-shadow: var(--fnl-shadow);
  color: var(--fnl-t1);
  font-family: var(--fnl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .fnl {
  --fnl-ink: #fff;
  --fnl-surface: #1c1c1e;
  --fnl-accent: #4d8dff;
  --fnl-s0: oklch(.7 .14 255);
  --fnl-s1: oklch(.66 .16 305);
  --fnl-s2: oklch(.78 .15 75);
  --fnl-s3: oklch(.72 .12 185);
  --fnl-s4: oklch(.68 0 0);
  --fnl-base: oklch(.36 .06 255);
  --fnl-t1: color-mix(in oklab, var(--fnl-ink) 90%, transparent);
  --fnl-t2: color-mix(in oklab, var(--fnl-ink) 62%, transparent);
  --fnl-t3: color-mix(in oklab, var(--fnl-ink) 46%, transparent);
  --fnl-t4: color-mix(in oklab, var(--fnl-ink) 28%, transparent);
  --fnl-fill: color-mix(in oklab, var(--fnl-ink) 8%, transparent);
  --fnl-line: color-mix(in oklab, var(--fnl-ink) 10%, transparent);
  --fnl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --fnl-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.fnl) *, :where(.fnl) *::before, :where(.fnl) *::after { box-sizing: border-box }
:where(.fnl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.fnl :focus-visible { outline: 2px solid color-mix(in oklab, var(--fnl-accent) 60%, transparent); outline-offset: 1px }

.fnl-head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 14px }
.fnl-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--fnl-t1) }
.fnl-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--fnl-t3) }
.fnl-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px }

.fnl-stage { position: relative; border-radius: 10px; outline-offset: 4px; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.fnl-heads { display: grid; grid-template-columns: repeat(var(--n), 1fr); align-items: end; margin-bottom: 8px }
.fnl-stat { min-width: 0; padding-right: 6px; transition: opacity .2s }
.fnl-stat[data-dim] { opacity: .5 }
.fnl-stat-l { font-size: 11px; line-height: 14px; color: var(--fnl-t3); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden }
.fnl-stat-v { font-size: 16px; line-height: 22px; font-weight: 600; letter-spacing: -.01em; font-variant-numeric: tabular-nums; color: var(--fnl-t1) }
.fnl-stat-r { font-size: 11px; line-height: 14px; color: var(--fnl-t3); font-variant-numeric: tabular-nums }
.fnl-stat[data-on] .fnl-stat-l { color: var(--fnl-t1); font-weight: 500 }

.fnl-plot { position: relative }
.fnl-plot svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; overflow: visible }
.fnl-plot canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none }
.fnl-colbg { fill: var(--fnl-fill) }
.fnl-b {
  --k: 0;
  fill: color-mix(in oklab, color-mix(in oklab, var(--c) 32%, var(--fnl-surface)) calc(var(--k) * 100%), var(--fnl-base));
  stroke: color-mix(in oklab, color-mix(in oklab, var(--c) 32%, var(--fnl-surface)) calc(var(--k) * 100%), var(--fnl-base)); stroke-width: 1px; stroke-linejoin: round;
}
.fnl-h {
  --k: 0;
  fill: color-mix(in oklab, var(--c) calc(var(--k) * 100%), var(--fnl-accent)); stroke: none;
}
.fnl-drops { position: relative; height: 22px; margin-top: 8px }
.fnl-drop {
  position: absolute; top: 0; transform: translateX(-50%); font-size: 11px; line-height: 16px; color: var(--fnl-t3);
  font-variant-numeric: tabular-nums; white-space: nowrap; animation: fnl-in .5s var(--fnl-ease) backwards;
}
.fnl-drop[data-on] { color: var(--fnl-t1) }

.fnl-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; min-width: 140px; max-width: 220px; padding: 8px 10px; border-radius: 10px;
  background: var(--fnl-surface); box-shadow: var(--fnl-tip); pointer-events: none; opacity: 0; transition: opacity .14s;
  font-size: 12px; line-height: 16px;
}
.fnl-tip[data-on] { opacity: 1 }
.fnl-tip-h { font-size: 11px; line-height: 14px; color: var(--fnl-t3); margin-bottom: 2px }
.fnl-tip-r { display: flex; align-items: center; gap: 8px; color: var(--fnl-t2) }
.fnl-tip-r i { width: 8px; height: 8px; border-radius: 50%; background: var(--c) }
.fnl-tip-r span { flex: 1 }
.fnl-tip-r b { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--fnl-t1) }
.fnl-tip-m { margin-top: 2px; color: var(--fnl-t3) }

/* Upright layout: the band runs top to bottom and the steps are listed down the right. */
.fnl[data-v] .fnl-body { display: flex; gap: 14px }
.fnl[data-v] .fnl-plot { flex: 1; min-width: 0 }
.fnl-side { position: relative; flex: none; width: 118px }
.fnl-side .fnl-stat { position: absolute; left: 0; right: 0; display: flex; flex-direction: column; justify-content: center; padding-top: 14px }
.fnl-side .fnl-drop { transform: none; left: 0 }
.fnl-empty { display: grid; place-items: center; min-height: 160px; color: var(--fnl-t3) }

.fnl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
@keyframes fnl-in { from { opacity: 0; transform: translateX(-50%) translateY(3px) } }

@media (max-width: 420px) { .fnl { padding: 14px 12px 12px } }
@media (prefers-reduced-motion: reduce) {
  .fnl *, .fnl *::before, .fnl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const HUES = ["var(--fnl-s0)", "var(--fnl-s1)", "var(--fnl-s2)", "var(--fnl-s3)", "var(--fnl-s4)"]
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const full = new Intl.NumberFormat("en")
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const pctText = (r: number) => (r >= 0.1 ? `${Math.round(r * 100)}%` : `${(Math.round(r * 1000) / 10).toString()}%`)
const ROW_H = 92
const SAMPLES = 240

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

/** A number that counts to its new value instead of jumping. Writes the text node directly. */
function Rolling({ value, format, reduced }: { value: number; format: (n: number) => string; reduced: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const shown = React.useRef(value)
  const [first] = React.useState(value)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    if (from === value) return
    if (reduced) {
      shown.current = value
      el.textContent = format(value)
      return
    }
    let raf = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const k = Math.min(1, (now - t0) / 700)
      const v = lerp(from, value, 1 - Math.pow(1 - k, 4))
      shown.current = v
      el.textContent = format(v)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, format, reduced])
  return <span ref={ref}>{format(first)}</span>
}

const smooth = (t: number) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

/* -------------------------------------------------------------------------- */
/*                                 FunnelChart                                */
/* -------------------------------------------------------------------------- */

export function FunnelChart({
  stages,
  segments,
  label,
  title,
  subtitle,
  actions,
  unit = "",
  view = "total",
  flow = true,
  orientation = "auto",
  height = 200,
  formatValue,
  activeIndex,
  onActiveChange,
  emptyLabel = "No data",
  className,
}: FunnelChartProps) {
  const reduced = usePrefersReducedMotion()
  const n = stages.length
  const segs: FunnelSegment[] = segments?.length ? segments : [{ key: "_", label: "Total" }]
  const segKeys = segs.map((s) => s.key)
  const valueOf = React.useCallback(
    (st: FunnelStage, key: string) => (segments?.length ? st.values?.[key] ?? 0 : st.value ?? 0),
    [segments],
  )
  const isoKey = view !== "total" && view !== "split" && segKeys.includes(view) ? view : null
  const split = view === "split" && segs.length > 1

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [cw, setCw] = React.useState(640)
  React.useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setCw(Math.max(160, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const vertical = orientation === "vertical" || (orientation === "auto" && cw < 420)

  // Shown values (what the headings and rates describe).
  const shown = stages.map((st) =>
    isoKey ? valueOf(st, isoKey) : segKeys.reduce((a, k) => a + valueOf(st, k), 0),
  )
  const first = shown[0] ?? 0
  const empty = n === 0 || first <= 0

  const fmtHead = formatValue ?? ((v: number) => compact.format(Math.round(v)))
  const fmtFull = formatValue ?? ((v: number) => full.format(Math.round(v)))

  const [innerActive, setInnerActive] = React.useState<number | null>(null)
  const active = activeIndex !== undefined ? activeIndex : innerActive
  const setActive = (i: number | null) => {
    setInnerActive(i)
    onActiveChange?.(i)
  }

  /* ----------------------------- Geometry ---------------------------------- */
  const plotW = vertical ? Math.max(120, cw - 118 - 14) : cw
  const plotH = vertical ? n * ROW_H : height
  const along = vertical ? plotH : plotW // u
  const across = vertical ? plotW : plotH // v
  const colLen = along / Math.max(1, n)

  /* ----------------------------- Animation --------------------------------- */
  const st = React.useRef({
    layers: [] as { c: number[]; t: number[]; w: number; wt: number }[],
    gap: { c: 0, t: 0 },
    k: { c: 0, t: 0 },
    scale: { c: 1, t: 1 },
    grow: { c: 0, t: 0 },
    col: { x: 0, w: 0, tx: 0, tw: 0, init: false, op: 0 },
  })
  const layerB = React.useRef<(SVGPathElement | null)[]>([])
  const layerH = React.useRef<(SVGPathElement | null)[]>([])
  const colRect = React.useRef<SVGRectElement>(null)
  const clipRect = React.useRef<SVGRectElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const raf = React.useRef(0)
  const lastT = React.useRef(0)
  const started = React.useRef(false)
  const onScreen = React.useRef(false)
  const dots = React.useRef<{ u: number; a: number; fall: number; alpha: number }[]>([])
  const spawnAcc = React.useRef(0)
  const ink = React.useRef("#000")
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const live = React.useRef({ n, along, across, vertical, colLen, flow, reduced, segCount: segs.length, cw, plotH, plotW })
  React.useLayoutEffect(() => {
    live.current = { n, along, across, vertical, colLen, flow, reduced, segCount: segs.length, cw, plotH, plotW }
  })

  const thickAt = React.useCallback((vals: number[], u: number, cl: number, count: number) => {
    const b = Math.round(u / cl)
    const tz = Math.min(cl * 0.34, 40)
    if (b >= 1 && b < count && Math.abs(u - b * cl) < tz) return lerp(vals[b - 1]!, vals[b]!, smooth((u - b * cl + tz) / (2 * tz)))
    return vals[clamp(Math.floor(u / cl), 0, count - 1)]!
  }, [])

  const paint = React.useCallback(() => {
    const { n: cnt, along: L, across: V, vertical: vt, colLen: cl, segCount } = live.current
    const s = st.current
    if (!cnt) return
    const unit0 = V * s.scale.c * s.grow.c // thickness of a layer worth `first`
    const centre = V / 2
    const P = (u: number, v: number) => (vt ? `${v.toFixed(1)} ${u.toFixed(1)}` : `${u.toFixed(1)} ${v.toFixed(1)}`)
    // Total of all stage values at the start, so thickness is relative to the first step.
    let startTotal = 0
    for (let i = 0; i < segCount; i++) startTotal += (s.layers[i]?.c[0] ?? 0) * (s.layers[i]?.w ?? 0)
    if (startTotal <= 0) startTotal = 1
    const tops: Float64Array[] = []
    const bots: Float64Array[] = []
    for (let i = 0; i < segCount; i++) {
      tops.push(new Float64Array(SAMPLES + 1))
      bots.push(new Float64Array(SAMPLES + 1))
    }
    const k = s.k.c
    for (let j = 0; j <= SAMPLES; j++) {
      const u = (j / SAMPLES) * L
      const th: number[] = []
      let total = 0
      let presence = 0
      for (let i = 0; i < segCount; i++) {
        const ly = s.layers[i]
        const t = ly ? (thickAt(ly.c, u, cl, cnt) * ly.w * unit0) / startTotal : 0
        th.push(t)
        total += t
        presence += ly ? ly.w : 0
      }
      const gapPx = s.gap.c * Math.max(0, presence - 1) * 1
      let y = centre - (total + gapPx) / 2
      for (let i = 0; i < segCount; i++) {
        tops[i]![j] = y
        y += th[i]!
        bots[i]![j] = y
        const nextW = s.layers[i + 1]?.w ?? 0
        y += s.gap.c * Math.min(s.layers[i]?.w ?? 0, nextW)
      }
    }
    for (let i = 0; i < segCount; i++) {
      let up = "M"
      let dn = ""
      let any = false
      for (let j = 0; j <= SAMPLES; j++) {
        const u = (j / SAMPLES) * L
        up += `${j ? "L" : ""}${P(u, tops[i]![j]!)}`
        dn = `L${P(u, bots[i]![j]!)}${dn}`
        if (bots[i]![j]! - tops[i]![j]! > 0.05) any = true
      }
      const d = any ? `${up}${dn}Z` : ""
      layerB.current[i]?.setAttribute("d", d)
      layerH.current[i]?.setAttribute("d", d)
      layerB.current[i]?.style.setProperty("--k", k.toFixed(3))
      layerH.current[i]?.style.setProperty("--k", k.toFixed(3))
    }
    // Soft column + accent clip glide to the step in focus.
    const c = s.col
    const cr = colRect.current
    const kr = clipRect.current
    for (const r of [cr, kr]) {
      if (!r) continue
      if (vt) {
        r.setAttribute("x", "-4")
        r.setAttribute("y", c.x.toFixed(1))
        r.setAttribute("width", String(V + 8))
        r.setAttribute("height", Math.max(0, c.w).toFixed(1))
      } else {
        r.setAttribute("x", c.x.toFixed(1))
        r.setAttribute("y", "-4")
        r.setAttribute("width", Math.max(0, c.w).toFixed(1))
        r.setAttribute("height", String(V + 8))
      }
    }
    if (cr) cr.style.opacity = String(c.op)
  }, [thickAt])

  const bandThick = React.useCallback(
    (u: number) => {
      const { n: cnt, across: V, colLen: cl, segCount } = live.current
      const s = st.current
      let startTotal = 0
      for (let i = 0; i < segCount; i++) startTotal += (s.layers[i]?.c[0] ?? 0) * (s.layers[i]?.w ?? 0)
      if (startTotal <= 0) return 0
      const unit0 = V * s.scale.c * s.grow.c
      let total = 0
      let presence = 0
      for (let i = 0; i < segCount; i++) {
        const ly = s.layers[i]
        if (!ly) continue
        total += (thickAt(ly.c, u, cl, cnt) * ly.w * unit0) / startTotal
        presence += ly.w
      }
      return total + s.gap.c * Math.max(0, presence - 1)
    },
    [thickAt],
  )

  const drawDots = React.useCallback(
    (dt: number) => {
      const cv = canvasRef.current
      const { along: L, across: V, vertical: vt, flow: on, reduced: rm, plotW: w, plotH: h } = live.current
      if (!cv) return
      const ctx = cv.getContext("2d")
      if (!ctx) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr)
        cv.height = Math.round(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      if (!on || rm) {
        dots.current = []
        return
      }
      const speed = Math.max(40, L / 8)
      const target = 56
      spawnAcc.current += 10 * dt
      const T0 = bandThick(0)
      while (spawnAcc.current >= 1 && dots.current.length < target + 8) {
        spawnAcc.current -= 1
        if (T0 > 2) dots.current.push({ u: 0, a: (Math.random() - 0.5) * T0 * 0.96, fall: 0, alpha: 1 })
      }
      if (dots.current.length < 6 && T0 > 2) {
        for (let i = 0; i < 18; i++) dots.current.push({ u: Math.random() * L * 0.5, a: (Math.random() - 0.5) * T0 * 0.96, fall: 0, alpha: 1 })
      }
      ctx.fillStyle = ink.current
      const keep: typeof dots.current = []
      for (const d of dots.current) {
        d.u += speed * dt
        if (d.u > L) continue
        const T = bandThick(d.u)
        if (Math.abs(d.a) > T / 2 - 0.5 && d.fall === 0) d.fall = 0.001
        if (d.fall > 0) {
          d.fall += dt
          d.a += Math.sign(d.a || 1) * 26 * dt
          d.alpha = Math.max(0, 1 - d.fall / 0.7)
          if (d.alpha <= 0) continue
        }
        const edge = Math.min(1, d.u / 14)
        ctx.globalAlpha = 0.55 * d.alpha * edge
        const x = vt ? V / 2 + d.a : d.u
        const y = vt ? d.u : V / 2 + d.a
        ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
        keep.push(d)
      }
      dots.current = keep
      ctx.globalAlpha = 1
    },
    [bandThick],
  )

  const tick = React.useCallback(
    function tick(now: number) {
      const dt = Math.min(0.05, Math.max(0.001, (now - (lastT.current || now - 16)) / 1000))
      lastT.current = now
      let moving = false
      const s = st.current
      const chase = (o: { c: number; t: number }, tau: number, eps = 0.0008) => {
        const d = o.t - o.c
        if (Math.abs(d) > eps) {
          o.c += d * (1 - Math.exp(-dt / tau))
          moving = true
        } else o.c = o.t
      }
      for (const ly of s.layers) {
        for (let i = 0; i < ly.c.length; i++) {
          const d = ly.t[i]! - ly.c[i]!
          if (Math.abs(d) > 0.01) {
            ly.c[i] = ly.c[i]! + d * (1 - Math.exp(-dt / 0.14))
            moving = true
          } else ly.c[i] = ly.t[i]!
        }
        const dw = ly.wt - ly.w
        if (Math.abs(dw) > 0.001) {
          ly.w += dw * (1 - Math.exp(-dt / 0.16))
          moving = true
        } else ly.w = ly.wt
      }
      chase(s.gap, 0.14, 0.01)
      chase(s.k, 0.16)
      chase(s.scale, 0.16, 0.001)
      chase(s.grow, 0.3)
      const c = s.col
      for (const key of ["x", "w"] as const) {
        const tk = key === "x" ? c.tx : c.tw
        const d = tk - c[key]
        if (Math.abs(d) > 0.1) {
          c[key] += d * (1 - Math.exp(-dt / 0.07))
          moving = true
        } else c[key] = tk
      }
      const opT = live.current.n && c.tw > 0 ? 1 : 0
      if (Math.abs(opT - c.op) > 0.01) {
        c.op += (opT - c.op) * (1 - Math.exp(-dt / 0.08))
        moving = true
      } else c.op = opT
      paint()
      const { flow: on, reduced: rm } = live.current
      const dotsOn = on && !rm && onScreen.current && !document.hidden
      if (dotsOn) drawDots(dt)
      else if (!on || rm) drawDots(0)
      raf.current = moving || dotsOn ? requestAnimationFrame(tick) : 0
    },
    [paint, drawDots],
  )
  const wake = React.useCallback(() => {
    if (!raf.current && started.current) {
      lastT.current = 0
      raf.current = requestAnimationFrame(tick)
    }
  }, [tick])

  // Targets follow data, view and size.
  const dataKey = JSON.stringify([stages, segKeys])
  React.useEffect(() => {
    const s = st.current
    segKeys.forEach((key, i) => {
      const t = stages.map((stg) => valueOf(stg, key))
      let ly = s.layers[i]
      if (!ly || ly.c.length !== t.length) ly = s.layers[i] = { c: [...t], t, w: 1, wt: 1 }
      ly.t = t
      ly.wt = isoKey ? (key === isoKey ? 1 : 0) : 1
      if (reduced) {
        ly.c = [...t]
        ly.w = ly.wt
      }
    })
    s.layers.length = segKeys.length
    // Isolating a part rescales the band so that part fills the height.
    const startAll = segKeys.reduce((a, k) => a + valueOf(stages[0] ?? { key: "", label: "" }, k), 0)
    const startIso = isoKey ? valueOf(stages[0]!, isoKey) : startAll
    s.scale.t = isoKey && startIso > 0 ? startAll / startIso : 1
    s.gap.t = split ? 2 : 0
    s.k.t = split || isoKey ? 1 : 0
    s.grow.t = 1
    if (reduced) {
      s.scale.c = s.scale.t
      s.gap.c = s.gap.t
      s.k.c = s.k.t
      s.grow.c = 1
    }
    wake()
    if (reduced) paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, isoKey, split, reduced, wake, paint])

  React.useEffect(() => {
    const s = st.current
    if (active == null || active < 0 || active >= n) {
      s.col.tw = 0
      wake()
      return
    }
    s.col.tx = active * colLen
    s.col.tw = colLen
    if (!s.col.init || reduced) {
      s.col.x = s.col.tx
      s.col.w = s.col.tw
      s.col.init = true
    }
    wake()
  }, [active, n, colLen, reduced, wake])
  React.useEffect(() => {
    paint()
  }, [along, across, vertical, paint])

  React.useEffect(() => {
    const el = plotRef.current
    if (!el) return
    const readInk = () => {
      ink.current = getComputedStyle(el).getPropertyValue("--fnl-ink").trim() || "#000"
    }
    readInk()
    const themer = window.setInterval(readInk, 1000)
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = !!e?.isIntersecting
        if (onScreen.current) {
          started.current = true
          wake()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    const fallback = window.setTimeout(() => {
      onScreen.current = true
      started.current = true
      wake()
    }, 1500)
    const vis = () => !document.hidden && wake()
    document.addEventListener("visibilitychange", vis)
    return () => {
      window.clearInterval(themer)
      window.clearTimeout(fallback)
      io.disconnect()
      document.removeEventListener("visibilitychange", vis)
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [wake, empty])

  /* ------------------------------ Interaction ------------------------------ */
  const placeTip = React.useCallback(
    (i: number) => {
      const tip = tipRef.current
      const plot = plotRef.current
      if (!tip || !plot || i < 0) return
      const w = tip.offsetWidth
      const h = tip.offsetHeight
      const pw = plot.clientWidth
      const ph = plot.clientHeight
      let tx: number
      let ty: number
      if (live.current.vertical) {
        tx = clamp(pw / 2 - w / 2, 0, Math.max(0, pw - w))
        ty = clamp((i + 0.5) * live.current.colLen + 14, 0, Math.max(0, ph - h))
      } else {
        const right = (i + 1) * live.current.colLen + 8
        tx = right + w <= pw ? right : i * live.current.colLen - w - 8
        tx = clamp(tx, 0, Math.max(0, pw - w))
        ty = clamp(ph / 2 - h / 2, 0, Math.max(0, ph - h))
      }
      tip.style.transform = `translate(${tx}px, ${ty}px)`
    },
    [],
  )
  React.useEffect(() => {
    if (active != null) placeTip(active)
  }, [active, placeTip, vertical, cw])

  const pointerAt = (ev: React.PointerEvent) => {
    const plot = plotRef.current
    if (!plot || !n) return
    const b = plot.getBoundingClientRect()
    const pos = vertical ? ev.clientY - b.top : ev.clientX - b.left
    const i = clamp(Math.floor(pos / colLen), 0, n - 1)
    if (i !== active) setActive(i)
  }
  const onKeyDown = (ev: React.KeyboardEvent) => {
    const i = active ?? -1
    let next: number | null | undefined
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") next = clamp(i + 1, 0, n - 1)
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") next = clamp(i < 0 ? 0 : i - 1, 0, n - 1)
    else if (ev.key === "Home") next = 0
    else if (ev.key === "End") next = n - 1
    else if (ev.key === "Escape") next = null
    if (next === undefined) return
    ev.preventDefault()
    setActive(next)
  }

  /* --------------------------------- Render -------------------------------- */
  const rate = (i: number) => (first > 0 ? (shown[i] ?? 0) / first : 0)
  const keep = (i: number) => (i > 0 && (shown[i - 1] ?? 0) > 0 ? (shown[i] ?? 0) / shown[i - 1]! : 0)
  const colorOf = (i: number) => HUES[i % HUES.length]!
  const announce =
    active != null && stages[active]
      ? `${stages[active]!.label}, ${fmtFull(shown[active] ?? 0)} ${unit}${active > 0 ? `, ${pctText(keep(active))} kept from ${stages[active - 1]!.label}` : ""}, ${pctText(rate(active))} of ${stages[0]!.label}`
      : ""
  const lastRate = n ? rate(n - 1) : 0
  const summary = `${label}. ${stages.map((s, i) => `${s.label} ${fmtFull(shown[i] ?? 0)} ${unit}`).join(", ")}. ${pctText(lastRate)} reach the last step.`

  const stat = (i: number) => (
    <div key={stages[i]!.key} className="fnl-stat" data-on={active === i || undefined} data-dim={active != null && active !== i ? "" : undefined} style={vertical ? { top: i * ROW_H, height: ROW_H } : undefined}>
      <div className="fnl-stat-l">{stages[i]!.label}</div>
      <div className="fnl-stat-v">
        <Rolling value={shown[i] ?? 0} format={fmtHead} reduced={reduced} />
      </div>
      <div className="fnl-stat-r">{i === 0 ? "Start" : `${pctText(rate(i))} of start`}</div>
    </div>
  )
  const drop = (i: number) => (
    <span key={`d${i}`} className="fnl-drop" data-on={active === i || active === i - 1 || undefined} style={vertical ? { top: i * ROW_H - 9 } : { left: i * colLen }}>
      ↓ <Rolling value={Math.round((1 - keep(i)) * 100)} format={(v) => `${Math.round(v)}%`} reduced={reduced} />
    </span>
  )

  const activeStage = active != null ? stages[active] : undefined

  return (
    <figure className={cn("fnl", className)} data-v={vertical || undefined} aria-label={label}>
      <style href="funnel-chart" precedence="default">
        {CSS}
      </style>

      {(title || subtitle || actions) && (
        <div className="fnl-head">
          <div>
            {title && <p className="fnl-title">{title}</p>}
            {subtitle && <p className="fnl-sub">{subtitle}</p>}
          </div>
          {actions && <div className="fnl-actions">{actions}</div>}
        </div>
      )}

      <div ref={wrapRef}>
        {empty ? (
          <div className="fnl-empty">{emptyLabel}</div>
        ) : (
          <div
            ref={stageRef}
            className="fnl-stage"
            role="group"
            tabIndex={0}
            aria-roledescription="funnel chart"
            aria-label={`${summary} Arrow keys move between steps, Escape clears.`}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible") && active == null) setActive(0)
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
            {!vertical && <div className="fnl-heads" style={{ ["--n" as string]: n }}>{stages.map((_, i) => stat(i))}</div>}
            <div className="fnl-body">
              <div ref={plotRef} className="fnl-plot" style={{ width: vertical ? undefined : "100%", height: plotH }}>
                <svg viewBox={`0 0 ${plotW} ${plotH}`} aria-hidden>
                  <defs>
                    <clipPath id={`${uid}-c`}>
                      <rect ref={clipRect} x={0} y={0} width={0} height={0} />
                    </clipPath>
                  </defs>
                  <rect ref={colRect} className="fnl-colbg" rx={6} x={0} y={0} width={0} height={0} style={{ opacity: 0 }} />
                  {segs.map((s, i) => (
                    <path
                      key={s.key}
                      ref={(el) => void (layerB.current[i] = el)}
                      className="fnl-b"
                      style={{ ["--c" as string]: colorOf(i) }}
                    />
                  ))}
                  <g clipPath={`url(#${uid}-c)`}>
                    {segs.map((s, i) => (
                      <path
                        key={s.key}
                        ref={(el) => void (layerH.current[i] = el)}
                        className="fnl-h"
                        style={{ ["--c" as string]: colorOf(i) }}
                      />
                    ))}
                  </g>
                </svg>
                <canvas ref={canvasRef} aria-hidden />
                <div ref={tipRef} className="fnl-tip" data-on={activeStage ? "" : undefined} aria-hidden>
                  {activeStage && active != null && (
                    <>
                      <div className="fnl-tip-h">{activeStage.label}</div>
                      {segments?.length && !isoKey
                        ? segs.map((s, i) => (
                            <div className="fnl-tip-r" key={s.key} style={{ ["--c" as string]: colorOf(i) }}>
                              <i />
                              <span>{s.label}</span>
                              <b>{fmtFull(valueOf(activeStage, s.key))}</b>
                            </div>
                          ))
                        : null}
                      <div className="fnl-tip-r" style={{ ["--c" as string]: "transparent" }}>
                        <span>{isoKey ? (segs.find((s) => s.key === isoKey)?.label ?? "Total") : "Total"}</span>
                        <b>{fmtFull(shown[active] ?? 0)}</b>
                      </div>
                      {active > 0 && (
                        <div className="fnl-tip-m">
                          {pctText(keep(active))} kept from {stages[active - 1]!.label.toLowerCase()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              {vertical && (
                <div className="fnl-side" style={{ height: plotH }}>
                  {stages.map((_, i) => stat(i))}
                  {stages.slice(1).map((_, i) => drop(i + 1))}
                </div>
              )}
            </div>
            {!vertical && <div className="fnl-drops">{stages.slice(1).map((_, i) => drop(i + 1))}</div>}
          </div>
        )}
      </div>

      <div className="fnl-sr" role="status" aria-live="polite">
        {announce}
      </div>
      <table className="fnl-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Step</th>
            {segments?.length ? segs.map((s) => <th key={s.key}>{s.label}</th>) : null}
            <th>Shown total</th>
            <th>Kept from previous</th>
            <th>Of first step</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s, i) => (
            <tr key={s.key}>
              <td>{s.label}</td>
              {segments?.length ? segs.map((g) => <td key={g.key}>{fmtFull(valueOf(s, g.key))} {unit}</td>) : null}
              <td>
                {fmtFull(shown[i] ?? 0)} {unit}
              </td>
              <td>{i === 0 ? "100%" : pctText(keep(i))}</td>
              <td>{pctText(rate(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}


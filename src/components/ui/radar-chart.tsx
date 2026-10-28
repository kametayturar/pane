"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RadarAxis = {
  key: string
  label: string
  /** Top of this axis. Defaults to the chart's `max`. */
  max?: number
}
export type RadarSeries = {
  key: string
  label: string
  /** One value per axis key. */
  values: Record<string, number>
}

export type RadarChartProps = {
  /** Measures around the web, clockwise from the top. At least three. */
  axes: RadarAxis[]
  /** Up to three profiles. They take the series hues in order; replacing the series at a position morphs that shape. */
  series: RadarSeries[]
  /** What is compared. Names the chart, the summary and the table. */
  label: string
  title?: string
  subtitle?: string
  /** Slot at the right of the header, e.g. a profile picker. */
  actions?: React.ReactNode
  /** Default top of every axis. */
  max?: number
  /** Concentric guides. */
  rings?: number
  /** Largest web diameter in pixels. It shrinks to fit narrow containers. */
  size?: number
  /** Formats values in the tooltip and table. */
  formatValue?: (value: number, axis: RadarAxis) => string
  /** Controlled axis in focus. */
  activeAxis?: string | null
  onActiveAxisChange?: (key: string | null) => void
  /** Profile names with a line key. Hovering or pressing one brings its shape forward. */
  legend?: boolean
  /** Message with fewer than three axes or no series. */
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rdr {
  --rdr-ink: #000;
  --rdr-surface: #fff;
  --rdr-accent: #0060e2;
  --rdr-s0: oklch(.6 .17 255);
  --rdr-s1: oklch(.45 .2 300);
  --rdr-s2: oklch(.72 .16 75);
  --rdr-t1: color-mix(in oklab, var(--rdr-ink) 88%, transparent);
  --rdr-t2: color-mix(in oklab, var(--rdr-ink) 61%, transparent);
  --rdr-t3: color-mix(in oklab, var(--rdr-ink) 45%, transparent);
  --rdr-t4: color-mix(in oklab, var(--rdr-ink) 27%, transparent);
  --rdr-fill: color-mix(in oklab, var(--rdr-ink) 6%, transparent);
  --rdr-line: color-mix(in oklab, var(--rdr-ink) 8%, transparent);
  --rdr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --rdr-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --rdr-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0;
  padding: 18px 20px 16px;
  border-radius: 16px;
  background: var(--rdr-surface);
  box-shadow: var(--rdr-shadow);
  color: var(--rdr-t1);
  font-family: var(--rdr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .rdr {
  --rdr-ink: #fff;
  --rdr-surface: #1c1c1e;
  --rdr-accent: #4d8dff;
  --rdr-s0: oklch(.7 .15 255);
  --rdr-s1: oklch(.68 .17 305);
  --rdr-s2: oklch(.8 .14 75);
  --rdr-t1: color-mix(in oklab, var(--rdr-ink) 90%, transparent);
  --rdr-t2: color-mix(in oklab, var(--rdr-ink) 62%, transparent);
  --rdr-t3: color-mix(in oklab, var(--rdr-ink) 46%, transparent);
  --rdr-t4: color-mix(in oklab, var(--rdr-ink) 28%, transparent);
  --rdr-fill: color-mix(in oklab, var(--rdr-ink) 8%, transparent);
  --rdr-line: color-mix(in oklab, var(--rdr-ink) 10%, transparent);
  --rdr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --rdr-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.rdr) *, :where(.rdr) *::before, :where(.rdr) *::after { box-sizing: border-box }
:where(.rdr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.rdr :focus-visible { outline: 2px solid color-mix(in oklab, var(--rdr-accent) 60%, transparent); outline-offset: 1px }

.rdr-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px }
.rdr-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--rdr-t1) }
.rdr-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--rdr-t3) }
.rdr-actions { flex: none }

.rdr-stage { position: relative; width: 100%; border-radius: 12px; outline-offset: 2px; touch-action: pan-y; user-select: none; -webkit-user-select: none }
.rdr-stage svg { display: block; width: 100%; height: 100%; overflow: visible }
.rdr-ring { fill: none; stroke: var(--rdr-line); stroke-width: 1 }
.rdr-ring[data-edge] { fill: color-mix(in oklab, var(--rdr-ink) 2.5%, transparent) }
.rdr-spoke { stroke: var(--rdr-line); stroke-width: 1 }
.rdr-spoke[data-on] { stroke: var(--rdr-t3) }
.rdr-web { transform-origin: var(--ox) var(--oy); animation: rdr-unfold .9s var(--rdr-ease) backwards }
.rdr-ax { font-size: 12px; font-weight: 500; fill: var(--rdr-t2); transition: fill .2s }
.rdr-ax[data-on] { fill: var(--rdr-t1) }
.rdr-shape { fill: color-mix(in oklab, var(--c) 11%, transparent); stroke: var(--c); stroke-width: 1.5px; stroke-linejoin: round; transition: opacity .25s var(--rdr-ease), fill .25s }
.rdr-shape[data-dim] { opacity: .35 }
.rdr-shape[data-front] { fill: color-mix(in oklab, var(--c) 16%, transparent); stroke-width: 2px }
.rdr-dot { fill: var(--rdr-surface); stroke: var(--c); stroke-width: 1.75px; transition: opacity .2s }

.rdr-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; min-width: 120px; padding: 8px 10px; border-radius: 10px;
  background: var(--rdr-surface); box-shadow: var(--rdr-tip); pointer-events: none; opacity: 0; transition: opacity .14s;
  font-size: 12px; line-height: 16px;
}
.rdr-tip[data-on] { opacity: 1 }
.rdr-tip-h { margin-bottom: 4px; font-size: 12px; font-weight: 500; color: var(--rdr-t2) }
.rdr-tip-r { display: flex; align-items: center; gap: 8px; color: var(--rdr-t2) }
.rdr-tip-r i { width: 10px; height: 2px; border-radius: 1px; background: var(--c) }
.rdr-tip-r span { flex: 1 }
.rdr-tip-r b { font-weight: 600; font-variant-numeric: tabular-nums; color: var(--rdr-t1) }
.rdr-tip-r em { min-width: 28px; text-align: right; font-style: normal; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--rdr-t3) }

.rdr-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 8px; margin: 6px 0 0; padding: 0; list-style: none }
.rdr-chip {
  display: inline-flex; align-items: center; gap: 8px; height: 26px; padding: 0 10px; border-radius: 13px;
  font-size: 12px; line-height: 16px; font-weight: 500; color: var(--rdr-t2); transition: background-color .16s, color .16s;
}
.rdr-chip:hover, .rdr-chip[aria-pressed="true"] { background: var(--rdr-fill); color: var(--rdr-t1) }
.rdr-chip i { width: 14px; height: 2px; border-radius: 1px; background: var(--c) }
.rdr-empty { display: grid; place-items: center; min-height: 200px; color: var(--rdr-t3) }

.rdr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
@keyframes rdr-unfold { from { opacity: 0; transform: scale(.6) } }

@media (max-width: 420px) { .rdr { padding: 14px 12px 12px } }
@media (prefers-reduced-motion: reduce) {
  .rdr *, .rdr *::before, .rdr *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2
const HUES = ["var(--rdr-s0)", "var(--rdr-s1)", "var(--rdr-s2)"]
const nf = new Intl.NumberFormat("en", { maximumFractionDigits: 1 })
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

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

/** Splits a label into at most two lines near its middle. */
function wrap(text: string, narrow: boolean): string[] {
  const limit = narrow ? 9 : 13
  if (text.length <= limit || !text.includes(" ")) return [text]
  const words = text.split(" ")
  let best = 1
  let diff = Infinity
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length)
    if (d < diff) {
      diff = d
      best = i
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")]
}

/* -------------------------------------------------------------------------- */
/*                                 RadarChart                                 */
/* -------------------------------------------------------------------------- */

export function RadarChart({
  axes,
  series: seriesIn,
  label,
  title,
  subtitle,
  actions,
  max = 100,
  rings = 4,
  size = 320,
  formatValue,
  activeAxis,
  onActiveAxisChange,
  legend = true,
  emptyLabel = "No data",
  className,
}: RadarChartProps) {
  const reduced = usePrefersReducedMotion()
  const series = seriesIn.slice(0, 3)
  const n = axes.length
  const empty = n < 3 || series.length === 0

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [cw, setCw] = React.useState(440)
  React.useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setCw(Math.max(180, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = cw < 360
  const sidePad = narrow ? 52 : 84
  const D = Math.min(size, cw - sidePad * 2)
  const R = Math.max(40, D / 2)
  const H = Math.round(D + (narrow ? 64 : 76))
  const cx = cw / 2
  const cy = H / 2

  const [innerActive, setInnerActive] = React.useState<string | null>(null)
  const activeKey = activeAxis !== undefined ? activeAxis : innerActive
  const activeIdx = activeKey ? axes.findIndex((a) => a.key === activeKey) : -1
  const setActive = (key: string | null) => {
    setInnerActive(key)
    onActiveAxisChange?.(key)
  }
  const [front, setFront] = React.useState<number | null>(null)
  const [pinned, setPinned] = React.useState<number | null>(null)
  const frontIdx = front ?? pinned

  /* ------------------------------- Springs --------------------------------- */
  // Each value of each profile is a small spring: it overshoots a little when a profile is swapped.
  const sp = React.useRef<{ x: number[][]; v: number[][]; t: number[][] }>({ x: [], v: [], t: [] })
  const polyEls = React.useRef<(SVGPolygonElement | null)[]>([])
  const dotEls = React.useRef<(SVGCircleElement | null)[]>([])
  const spokeRef = React.useRef<SVGLineElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const raf = React.useRef(0)
  const lastT = React.useRef(0)
  const started = React.useRef(false)
  const grow = React.useRef({ x: 0, v: 0, t: 0 })
  const ang = React.useRef({ x: 0, t: 0, init: false })
  const live = React.useRef({ cx, cy, R, n, count: series.length })
  React.useLayoutEffect(() => {
    live.current = { cx, cy, R, n, count: series.length }
  })

  const paint = React.useCallback(() => {
    const { cx: x0, cy: y0, R: r, n: m, count } = live.current
    const g = grow.current.x
    for (let s = 0; s < count; s++) {
      const xs = sp.current.x[s]
      if (!xs) continue
      let pts = ""
      for (let i = 0; i < m; i++) {
        const a = (i / m) * TAU
        const rr = (r * Math.max(0, xs[i]!) * g)
        pts += `${(x0 + rr * Math.sin(a)).toFixed(1)},${(y0 - rr * Math.cos(a)).toFixed(1)} `
      }
      polyEls.current[s]?.setAttribute("points", pts)
    }
    // Vertex markers and the spoke glide to the axis in focus along the shortest way round.
    const aa = ang.current.x
    const idx = ((aa % m) + m) % m
    const i0 = Math.floor(idx)
    const f = idx - i0
    for (let s = 0; s < count; s++) {
      const xs = sp.current.x[s]
      const dot = dotEls.current[s]
      if (!xs || !dot) continue
      const v = lerp(xs[i0 % m]!, xs[(i0 + 1) % m]!, f)
      const a = (aa / m) * TAU
      const rr = r * Math.max(0, v) * g
      dot.setAttribute("cx", (x0 + rr * Math.sin(a)).toFixed(1))
      dot.setAttribute("cy", (y0 - rr * Math.cos(a)).toFixed(1))
    }
    const sa = (aa / m) * TAU
    const sl = spokeRef.current
    if (sl) {
      sl.setAttribute("x2", (x0 + r * Math.sin(sa)).toFixed(1))
      sl.setAttribute("y2", (y0 - r * Math.cos(sa)).toFixed(1))
    }
  }, [])

  const tick = React.useCallback(
    function tick(now: number) {
      const dt = Math.min(0.032, Math.max(0.001, (now - (lastT.current || now - 16)) / 1000))
      lastT.current = now
      let moving = false
      const K = 190
      const C = 15
      for (let s = 0; s < live.current.count; s++) {
        const x = sp.current.x[s]
        const v = sp.current.v[s]
        const t = sp.current.t[s]
        if (!x || !v || !t) continue
        for (let i = 0; i < x.length; i++) {
          const acc = -K * (x[i]! - t[i]!) - C * v[i]!
          v[i] = v[i]! + acc * dt
          x[i] = x[i]! + v[i]! * dt
          if (Math.abs(x[i]! - t[i]!) > 0.0006 || Math.abs(v[i]!) > 0.002) moving = true
          else {
            x[i] = t[i]!
            v[i] = 0
          }
        }
      }
      const g = grow.current
      const ga = -150 * (g.x - g.t) - 17 * g.v
      g.v += ga * dt
      g.x += g.v * dt
      if (Math.abs(g.x - g.t) > 0.0006 || Math.abs(g.v) > 0.002) moving = true
      else {
        g.x = g.t
        g.v = 0
      }
      const an = ang.current
      const da = an.t - an.x
      if (Math.abs(da) > 0.003) {
        an.x += da * (1 - Math.exp(-dt / 0.055))
        moving = true
      } else an.x = an.t
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

  // Targets: value / axis max, by position. Existing springs keep their state, so a swapped profile morphs.
  const targetsKey = JSON.stringify([axes, series.map((s) => s.values), max])
  React.useEffect(() => {
    series.forEach((s, si) => {
      const t = axes.map((a) => clamp((s.values[a.key] ?? 0) / (a.max ?? max), 0, 1.05))
      if (!sp.current.x[si] || sp.current.x[si]!.length !== t.length) {
        sp.current.x[si] = reduced || started.current ? [...t] : t.map(() => 0)
        sp.current.v[si] = t.map(() => 0)
      }
      sp.current.t[si] = t
      if (reduced) sp.current.x[si] = [...t]
    })
    grow.current.t = 1
    if (reduced) grow.current.x = 1
    wake()
    if (reduced) paint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetsKey, reduced, wake, paint])
  React.useEffect(() => {
    paint()
  }, [cx, cy, R, paint])

  React.useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const go = () => {
      if (started.current) return
      started.current = true
      wake()
    }
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && go(), { threshold: 0.2 })
    io.observe(el)
    // Background tabs may never report intersection; do not leave the chart blank.
    const fallback = window.setTimeout(go, 1500)
    return () => {
      window.clearTimeout(fallback)
      io.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [wake, empty])

  // The marker takes the shortest way round to the new axis.
  React.useEffect(() => {
    if (activeIdx < 0) return
    const a = ang.current
    if (!a.init || reduced) {
      a.x = a.t = activeIdx
      a.init = true
    } else {
      let d = activeIdx - (((a.t % n) + n) % n)
      if (d > n / 2) d -= n
      if (d < -n / 2) d += n
      a.t += d
    }
    wake()
  }, [activeIdx, n, reduced, wake])

  /* ------------------------------ Interaction ------------------------------ */
  const placeTip = React.useCallback(
    (idx: number) => {
      const tip = tipRef.current
      if (!tip || idx < 0) return
      const a = (idx / n) * TAU
      const lw = (axes[idx]?.label.length ?? 6) * 6.2
      const sx = Math.sin(a)
      const ax = cx + sx * (R + 14 + (Math.abs(sx) > 0.2 ? Math.min(lw, narrow ? 54 : 84) : 0))
      const ay = cy - Math.cos(a) * (R + 10)
      const w = tip.offsetWidth
      const h = tip.offsetHeight
      let tx = sx >= -0.15 ? ax + (Math.abs(sx) > 0.2 ? 6 : lw / 2 + 12) : ax - w - 6
      if (Math.abs(sx) <= 0.2 && sx >= 0) tx = cx + lw / 2 + 14
      if (Math.abs(sx) <= 0.2 && cx + lw / 2 + 14 + w > cw) tx = cx - lw / 2 - 14 - w
      // When there is no room beside the label, drop below / rise above it instead of covering it.
      const fits = tx >= 0 && tx + w <= cw
      let ty = ay - h / 2
      if (!fits && Math.abs(sx) > 0.2) {
        ty = Math.cos(a) <= 0 ? ay + 20 : ay - h - 20
        tx = sx > 0 ? cw - w : 0
      }
      tx = clamp(tx, 0, Math.max(0, cw - w))
      tip.style.transform = `translate(${tx}px, ${clamp(ty, 0, Math.max(0, H - h))}px)`
    },
    [axes, n, cx, cy, R, cw, H, narrow],
  )
  React.useEffect(() => {
    if (activeIdx >= 0) placeTip(activeIdx)
  }, [activeIdx, placeTip, series.length])

  const pointerAt = (ev: React.PointerEvent) => {
    const stage = stageRef.current
    if (!stage || n < 3) return
    const b = stage.getBoundingClientRect()
    const dx = ev.clientX - b.left - cx
    const dy = ev.clientY - b.top - cy
    if (Math.hypot(dx, dy) < 8) return
    let th = Math.atan2(dx, -dy)
    if (th < 0) th += TAU
    const idx = Math.round((th / TAU) * n) % n
    const key = axes[idx]!.key
    if (key !== activeKey) setActive(key)
  }

  const onKeyDown = (ev: React.KeyboardEvent) => {
    const i = activeIdx
    let next = -2
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") next = i < 0 ? 0 : (i + 1) % n
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") next = i < 0 ? n - 1 : (i - 1 + n) % n
    else if (ev.key === "Home") next = 0
    else if (ev.key === "End") next = n - 1
    else if (ev.key === "Escape") next = -1
    if (next === -2) return
    ev.preventDefault()
    setActive(next < 0 ? null : axes[next]!.key)
  }

  /* --------------------------------- Render -------------------------------- */
  const fmt = (v: number, a: RadarAxis) => (formatValue ? formatValue(v, a) : nf.format(v))
  const order = series.map((_, i) => i).sort((a, b) => (a === frontIdx ? 1 : b === frontIdx ? -1 : a - b))
  const activeAx = activeIdx >= 0 ? axes[activeIdx]! : null
  const announce = activeAx
    ? `${activeAx.label}. ${series.map((s) => `${s.label} ${fmt(s.values[activeAx.key] ?? 0, activeAx)}`).join(", ")}`
    : ""
  const summary = `${label}. ${series.map((s) => `${s.label}: ${axes.map((a) => `${a.label} ${fmt(s.values[a.key] ?? 0, a)}`).join(", ")}`).join(". ")}.`
  const ringPts = (k: number) =>
    axes.map((_, i) => `${(cx + ((R * k) / rings) * Math.sin((i / n) * TAU)).toFixed(1)},${(cy - ((R * k) / rings) * Math.cos((i / n) * TAU)).toFixed(1)}`).join(" ")

  return (
    <figure className={cn("rdr", className)} aria-label={label}>
      <style href="radar-chart" precedence="default">
        {CSS}
      </style>

      {(title || subtitle || actions) && (
        <div className="rdr-head">
          <div>
            {title && <p className="rdr-title">{title}</p>}
            {subtitle && <p className="rdr-sub">{subtitle}</p>}
          </div>
          {actions && <div className="rdr-actions">{actions}</div>}
        </div>
      )}

      <div ref={wrapRef}>
        {empty ? (
          <div className="rdr-empty">{emptyLabel}</div>
        ) : (
          <div
            ref={stageRef}
            className="rdr-stage"
            style={{ height: H }}
            role="group"
            tabIndex={0}
            aria-roledescription="radar chart"
            aria-label={`${label}. Arrow keys move between axes, Escape clears.`}
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible") && activeIdx < 0) setActive(axes[0]!.key)
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null)
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "touch") e.currentTarget.setPointerCapture(e.pointerId)
              pointerAt(e)
            }}
            onPointerMove={pointerAt}
            onPointerLeave={(e) => e.pointerType !== "touch" && setActive(null)}
            onPointerUp={(e) => e.pointerType === "touch" && setActive(null)}
          >
            <svg viewBox={`0 0 ${cw} ${H}`} aria-hidden>
              <g className="rdr-web" style={{ ["--ox" as string]: `${cx}px`, ["--oy" as string]: `${cy}px` }}>
                {Array.from({ length: rings }, (_, k) => (
                  <polygon key={k} className="rdr-ring" data-edge={k === rings - 1 || undefined} points={ringPts(k + 1)} />
                ))}
                {axes.map((a, i) => (
                  <line
                    key={a.key}
                    className="rdr-spoke"
                    data-on={i === activeIdx || undefined}
                    x1={cx}
                    y1={cy}
                    x2={cx + R * Math.sin((i / n) * TAU)}
                    y2={cy - R * Math.cos((i / n) * TAU)}
                  />
                ))}
              </g>
              {axes.map((a, i) => {
                const th = (i / n) * TAU
                const s = Math.sin(th)
                const c = Math.cos(th)
                const lines = wrap(a.label, narrow)
                const gap = narrow ? 10 : 14
                const x = cx + (R + gap) * s
                const y = cy - (R + gap) * c
                const anchor = Math.abs(s) < 0.25 ? "middle" : s > 0 ? "start" : "end"
                const y0 = Math.abs(c) > 0.8 ? (c > 0 ? y - (lines.length - 1) * 14 : y + 10) : y + 4 - ((lines.length - 1) * 14) / 2
                return (
                  <text key={a.key} className="rdr-ax" data-on={i === activeIdx || undefined} x={x} y={y0} textAnchor={anchor}>
                    {lines.map((ln, li) => (
                      <tspan key={li} x={x} dy={li ? 14 : 0}>
                        {ln}
                      </tspan>
                    ))}
                  </text>
                )
              })}
              <line ref={spokeRef} x1={cx} y1={cy} x2={cx} y2={cy - R} stroke="var(--rdr-t3)" strokeWidth={1} style={{ opacity: activeIdx >= 0 ? 1 : 0, transition: "opacity .15s" }} />
              {order.map((si) => (
                <polygon
                  key={series[si]!.key + si}
                  ref={(el) => void (polyEls.current[si] = el)}
                  className="rdr-shape"
                  data-front={frontIdx === si || undefined}
                  data-dim={frontIdx != null && frontIdx !== si ? "" : undefined}
                  style={{ ["--c" as string]: HUES[si] }}
                />
              ))}
              {series.map((s, si) => (
                <circle
                  key={s.key + si}
                  ref={(el) => void (dotEls.current[si] = el)}
                  className="rdr-dot"
                  r={3.5}
                  style={{ ["--c" as string]: HUES[si], opacity: activeIdx >= 0 ? 1 : 0 }}
                />
              ))}
            </svg>
            <div ref={tipRef} className="rdr-tip" data-on={activeAx ? "" : undefined} aria-hidden>
              {activeAx && (
                <>
                  <div className="rdr-tip-h">{activeAx.label}</div>
                  {series.map((s, si) => {
                    const v = s.values[activeAx.key] ?? 0
                    const d = si > 0 ? v - (series[0]!.values[activeAx.key] ?? 0) : null
                    return (
                      <div className="rdr-tip-r" key={s.key + si} style={{ ["--c" as string]: HUES[si] }}>
                        <i />
                        <span>{s.label}</span>
                        <b>{fmt(v, activeAx)}</b>
                        <em>{d == null ? "" : `${d > 0 ? "+" : d < 0 ? "−" : ""}${nf.format(Math.abs(d))}`}</em>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {legend && !empty && (
        <ul className="rdr-legend" aria-label="Profiles">
          {series.map((s, si) => (
            <li key={s.key + si} style={{ ["--c" as string]: HUES[si] }}>
              <button
                type="button"
                className="rdr-chip"
                aria-pressed={pinned === si}
                onClick={() => setPinned((p) => (p === si ? null : si))}
                onPointerEnter={() => setFront(si)}
                onPointerLeave={() => setFront(null)}
                onFocus={() => setFront(si)}
                onBlur={() => setFront(null)}
              >
                <i />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rdr-sr" role="status" aria-live="polite">
        {announce}
      </div>
      <p className="rdr-sr">{summary}</p>
      <table className="rdr-sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Measure</th>
            {series.map((s, si) => (
              <th key={s.key + si}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {axes.map((a) => (
            <tr key={a.key}>
              <td>{a.label}</td>
              {series.map((s, si) => (
                <td key={s.key + si}>{fmt(s.values[a.key] ?? 0, a)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

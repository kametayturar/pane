"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type StreamPoint = {
  /** Time in milliseconds. Points are append-only and ascending. */
  t: number
  value: number
  /** A string becomes the marker's tag; `true` uses "Anomaly". The chart does not detect anomalies, you flag them. */
  anomaly?: string | boolean
}

export type RealtimeStreamProps = {
  /** Append-only feed in ascending time. Leave it out and the chart runs a built-in simulated latency feed. */
  points?: StreamPoint[]
  /** What is measured. Names the chart, the current value and the table. */
  label?: string
  /** Heading above the readout. */
  title?: string
  subtitle?: string
  /** Unit after values, such as "ms". */
  unit?: string
  /** Visible span of time. */
  windowMs?: number
  /** Typical time between points. The view trails the newest point by this much so each reading slides in. */
  interval?: number
  /** Plot height in pixels. */
  height?: number
  formatValue?: (value: number) => string
  /** Formats times in the tooltip and table. Defaults to HH:MM:SS. */
  formatTime?: (t: number) => string
  /** Controlled pause. */
  paused?: boolean
  defaultPaused?: boolean
  /** Called when the status button or Space toggles the pause. */
  onPausedChange?: (paused: boolean) => void
  /** Holds the view while the pointer is over the plot, so a point can be read while new ones queue. */
  pauseOnHover?: boolean
  /** Fixed bottom of the value axis. Leave it out to follow the data. */
  min?: number
  /** Fixed top of the value axis. */
  max?: number
  emptyLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rts {
  --rts-ink: #000;
  --rts-surface: #fff;
  --rts-accent: oklch(.58 .15 250);
  --rts-flag: oklch(.45 .19 307);
  --rts-t1: color-mix(in oklab, var(--rts-ink) 88%, transparent);
  --rts-t2: color-mix(in oklab, var(--rts-ink) 61%, transparent);
  --rts-t3: color-mix(in oklab, var(--rts-ink) 45%, transparent);
  --rts-t4: color-mix(in oklab, var(--rts-ink) 27%, transparent);
  --rts-fill: color-mix(in oklab, var(--rts-ink) 6%, transparent);
  --rts-line: color-mix(in oklab, var(--rts-ink) 6%, transparent);
  --rts-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --rts-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --rts-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0;
  padding: 18px 20px 12px;
  border-radius: 16px;
  background: var(--rts-surface);
  box-shadow: var(--rts-shadow);
  color: var(--rts-t1);
  font-family: var(--rts-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .rts {
  --rts-ink: #fff;
  --rts-surface: #1c1c1e;
  --rts-accent: oklch(.72 .14 250);
  --rts-flag: oklch(.72 .16 307);
  --rts-t1: color-mix(in oklab, var(--rts-ink) 90%, transparent);
  --rts-t2: color-mix(in oklab, var(--rts-ink) 62%, transparent);
  --rts-t3: color-mix(in oklab, var(--rts-ink) 46%, transparent);
  --rts-t4: color-mix(in oklab, var(--rts-ink) 28%, transparent);
  --rts-fill: color-mix(in oklab, var(--rts-ink) 8%, transparent);
  --rts-line: color-mix(in oklab, var(--rts-ink) 8%, transparent);
  --rts-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --rts-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.rts) *, :where(.rts) *::before, :where(.rts) *::after { box-sizing: border-box }
:where(.rts) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.rts :focus-visible { outline: 2px solid color-mix(in oklab, var(--rts-accent) 60%, transparent); outline-offset: 1px }

.rts-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--rts-t1) }
.rts-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--rts-t3) }

.rts-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px }
.rts-now { display: flex; align-items: baseline; gap: 6px; margin: 0; min-width: 0 }
.rts-val { display: inline-flex; height: 1em; font-size: 52px; line-height: 1; letter-spacing: -.035em; font-weight: 400; font-variant-numeric: tabular-nums; color: var(--rts-t1); overflow: hidden }
.rts-unit { font-size: 16px; line-height: 22px; color: var(--rts-t3) }
.rts-ch { display: inline-block; white-space: pre }
.rts-dg { display: inline-block; height: 1em; overflow: hidden }
.rts-strip { display: flex; flex-direction: column; transform: translateY(calc(var(--d) * -1em)); transition: transform .42s var(--rts-ease) }
.rts-strip i { display: block; height: 1em; font-style: normal }

.rts-status {
  display: inline-flex; align-items: center; gap: 8px; flex: none; height: 32px; padding: 0 14px 0 12px; border-radius: 9999px;
  background: var(--rts-surface); box-shadow: var(--rts-shadow); font-size: 14px; line-height: 20px; color: var(--rts-t2);
  transition: box-shadow .16s, color .16s;
}
.rts-status:hover { color: var(--rts-t1); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--rts-ink) 14%, transparent), 0 1px 2px rgb(0 0 0 / .08) }
.rts-status:active { transform: scale(.97) }
.rts-dot { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--rts-t1) }
.rts-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--rts-t1); animation: rts-ping 1.8s var(--rts-ease) infinite }
.rts-pause { display: inline-flex; gap: 2px; width: 8px; height: 8px; justify-content: center }
.rts-pause::before, .rts-pause::after { content: ""; width: 2.5px; height: 8px; border-radius: 1px; background: var(--rts-t1) }
.rts-status[data-held] .rts-dot { border-radius: 2px; background: var(--rts-t3) }
.rts-status[data-held] .rts-dot::after { display: none }
.rts-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

.rts-plot { position: relative; margin-top: 8px; border-radius: 10px; outline-offset: 4px; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: crosshair; -webkit-tap-highlight-color: transparent }
.rts-plot canvas { display: block; width: 100%; height: 100% }
.rts-probes { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none }
.rts-p0 { color: var(--rts-accent) }
.rts-p1 { color: color-mix(in oklab, var(--rts-accent) 26%, transparent) }
.rts-p2 { color: color-mix(in oklab, var(--rts-accent) 1%, transparent) }
.rts-p3 { color: color-mix(in oklab, var(--rts-ink) 7%, transparent) }
.rts-p4 { color: var(--rts-t3) }
.rts-p5 { color: var(--rts-t1) }
.rts-p6 { color: var(--rts-flag) }
.rts-p7 { color: var(--rts-surface) }
.rts-p8 { color: color-mix(in oklab, var(--rts-ink) 22%, transparent) }

.rts-tip {
  position: absolute; left: 0; top: 0; z-index: 3; width: max-content; min-width: 84px; padding: 8px 12px; border-radius: 12px;
  background: var(--rts-surface); box-shadow: var(--rts-tip); pointer-events: none; opacity: 0; transition: opacity .14s;
}
.rts-tip[data-on] { opacity: 1 }
.rts-tip-v { margin: 0; font-size: 14px; line-height: 18px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--rts-t1) }
.rts-tip-m { margin: 0; font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; color: var(--rts-t3) }
.rts-tip-m b { font-weight: 500; color: var(--flag, var(--rts-flag)) }
.rts-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--rts-t3); pointer-events: none }

@keyframes rts-ping { 0% { transform: scale(1); opacity: .35 } 70%, 100% { transform: scale(2.6); opacity: 0 } }
@media (max-width: 420px) {
  .rts { padding: 14px 12px 8px }
  .rts-val { font-size: 44px }
}
@media (prefers-reduced-motion: reduce) {
  .rts *, .rts *::before, .rts *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Maths                                   */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const nf = new Intl.NumberFormat("en", { maximumFractionDigits: 1 })
const pad2 = (n: number) => String(n).padStart(2, "0")
const defaultTime = (t: number) => {
  const d = new Date(t)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}
const defaultValue = (v: number) => nf.format(Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10)

/** First index whose t >= x. */
function lowerBound(a: StreamPoint[], x: number) {
  let lo = 0
  let hi = a.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (a[mid]!.t < x) lo = mid + 1
    else hi = mid
  }
  return lo
}
/** Index of the nearest point to x, or -1. */
function nearest(a: StreamPoint[], x: number, from: number, to: number) {
  if (to < from) return -1
  const i = clamp(lowerBound(a, x), from, to)
  if (i > from && Math.abs(a[i - 1]!.t - x) <= Math.abs(a[i]!.t - x)) return i - 1
  return i
}

const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
}

const TIME_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]
const fmtAgo = (sec: number) => (sec >= 60 ? `-${+(sec / 60).toFixed(1)}m` : `-${sec}s`)

/** Scratch buffers reused every frame so the loop does not allocate. */
let SX = new Float64Array(256)
let SY = new Float64Array(256)
let SM = new Float64Array(256)
let SD = new Float64Array(256)
function ensureScratch(n: number) {
  if (SX.length >= n) return
  const size = Math.max(n, SX.length * 2)
  SX = new Float64Array(size)
  SY = new Float64Array(size)
  SM = new Float64Array(size)
  SD = new Float64Array(size)
}

/** Monotone-cubic tangents (harmonic mean of neighbouring slopes): smooth, never overshoots a spike. */
function monotoneTangents(n: number) {
  for (let k = 0; k < n - 1; k++) {
    const dx = SX[k + 1]! - SX[k]!
    SD[k] = dx > 1e-9 ? (SY[k + 1]! - SY[k]!) / dx : 0
  }
  SM[0] = SD[0]!
  SM[n - 1] = SD[n - 2]!
  for (let k = 1; k < n - 1; k++) {
    const a = SD[k - 1]!
    const b = SD[k]!
    SM[k] = a * b <= 0 ? 0 : (2 * a * b) / (a + b)
  }
}

/* -------------------------------------------------------------------------- */
/*                              Simulated latency                             */
/* -------------------------------------------------------------------------- */

/** A built-in latency feed: mean-reverting noise around ~125 ms with an occasional spike that lasts three or four readings. */
export function useSimulatedFeed({ interval = 500, history = 120, enabled = true }: { interval?: number; history?: number; enabled?: boolean } = {}) {
  const [points, setPoints] = React.useState<StreamPoint[]>([])
  const sim = React.useRef({ seed: 1337, v: 125, spikeLeft: 0, nextSpike: 24, queue: 0, pts: [] as StreamPoint[] })

  const spike = React.useCallback(() => {
    sim.current.queue = 3 + Math.floor(Math.random() * 2)
  }, [])

  React.useEffect(() => {
    if (!enabled) return
    const s = sim.current
    const rand = () => {
      s.seed = (s.seed + 0x6d2b79f5) | 0
      let t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const gauss = () => (rand() + rand() + rand() - 1.5) * 2
    const nextPoint = (t: number): StreamPoint => {
      if (s.queue > 0 && s.spikeLeft === 0) {
        s.spikeLeft = s.queue
        s.queue = 0
      } else if (s.spikeLeft === 0 && --s.nextSpike <= 0) {
        s.spikeLeft = 3 + Math.floor(rand() * 2)
        s.nextSpike = 40 + Math.floor(rand() * 40)
      }
      if (s.spikeLeft > 0) {
        s.spikeLeft--
        const v = 300 + rand() * 120
        s.v = 140
        return { t, value: Math.round(v), anomaly: "Spike" }
      }
      s.v += (125 - s.v) * 0.22 + gauss() * 5
      return { t, value: Math.round(clamp(s.v, 90, 190)) }
    }
    const tick = () => {
      const now = Date.now()
      if (!s.pts.length) {
        const out: StreamPoint[] = []
        s.nextSpike = Math.floor(history * 0.3)
        for (let i = history; i >= 1; i--) out.push(nextPoint(now - i * interval))
        s.pts = out
      }
      s.pts = [...s.pts.slice(-(history * 2)), nextPoint(now)]
      setPoints(s.pts)
    }
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, interval)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [enabled, interval, history])

  return { points, spike }
}

/* -------------------------------------------------------------------------- */
/*                               Rolling readout                              */
/* -------------------------------------------------------------------------- */

function Roll({ text }: { text: string }) {
  const chars = [...text]
  return (
    <span className="rts-val" aria-hidden="true">
      {chars.map((c, i) => {
        const key = chars.length - i // keyed from the right so a new leading digit does not remount the rest
        return c >= "0" && c <= "9" ? (
          <span className="rts-dg" key={key}>
            <span className="rts-strip" style={{ "--d": Number(c) } as React.CSSProperties}>
              {Array.from({ length: 10 }, (_, d) => (
                <i key={d}>{d}</i>
              ))}
            </span>
          </span>
        ) : (
          <span className="rts-ch" key={key}>
            {c}
          </span>
        )
      })}
    </span>
  )
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

const PAD_T = 44
const PAD_B = 22
const PAD_L = 4
const GUT_R = 38
const COLOR_KEYS = ["line", "fillTop", "fillBot", "grid", "label", "ink", "flag", "surface", "cross"] as const
type Colors = Record<(typeof COLOR_KEYS)[number], string>
type Reading = { t: number; key: boolean }

/* -------------------------------------------------------------------------- */
/*                                RealtimeStream                              */
/* -------------------------------------------------------------------------- */

export function RealtimeStream({
  points: pointsProp,
  label = "p95 latency",
  title,
  subtitle,
  unit = "ms",
  windowMs = 30000,
  interval = 500,
  height = 200,
  formatValue,
  formatTime,
  paused: pausedProp,
  defaultPaused = false,
  onPausedChange,
  pauseOnHover = true,
  min,
  max,
  emptyLabel = "Waiting for data",
  className,
}: RealtimeStreamProps) {
  const reduced = usePrefersReducedMotion()
  const sim = useSimulatedFeed({ interval, enabled: !pointsProp })
  const points = pointsProp ?? sim.points
  const fmtV = formatValue ?? defaultValue
  const fmtT = formatTime ?? defaultTime

  const [pausedInner, setPausedInner] = React.useState(defaultPaused)
  const paused = pausedProp ?? pausedInner
  const setPaused = (p: boolean) => {
    setPausedInner(p)
    onPausedChange?.(p)
  }
  const [hover, setHover] = React.useState(false)
  const [pressing, setPressing] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [reading, setReading] = React.useState<Reading | null>(null)
  const [shownT, setShownT] = React.useState<number | null>(null)
  const held = paused || (pauseOnHover && hover) || pressing || focused

  /* ------------------------------ Live bridge ------------------------------ */
  const plotRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const probeRef = React.useRef<HTMLSpanElement>(null)
  const raf = React.useRef(0)
  const onScreen = React.useRef(true)
  const sizeRef = React.useRef({ w: 0, h: 0, dpr: 1 })
  const arrive = React.useRef(0)
  const view = React.useRef({
    viewT: 0,
    started: false,
    snap: true,
    catchup: false,
    lo: 0,
    hi: 1,
    axisInit: false,
    idle: 0,
    lastTs: 0,
    shownT: -1,
    colorsAt: -1e9,
    tipX: -1,
    tipY: -1,
    wasHeld: false,
  })
  const ticks = React.useRef(new Map<number, number>())
  const colors = React.useRef<Colors | null>(null)
  const fontFamily = React.useRef("Inter, system-ui, sans-serif")
  const live = React.useRef({ points, windowMs, interval, height, min, max, reduced, held, reading, fmtV, fmtT, unit, emptyLabel })
  const frameRef = React.useRef<(ts: number) => void>(() => {})

  const wake = React.useCallback(() => {
    view.current.idle = 0
    if (raf.current || !onScreen.current) return
    raf.current = requestAnimationFrame((ts) => frameRef.current(ts))
  }, [])

  React.useLayoutEffect(() => {
    live.current = { points, windowMs, interval, height, min, max, reduced, held, reading, fmtV, fmtT, unit, emptyLabel }
    const v = view.current
    if (v.wasHeld && !held) v.catchup = true
    v.wasHeld = held
    wake()
  })

  // Remember when the newest reading arrived so the view can follow the feed's own clock between readings.
  const lastT = points.length ? points[points.length - 1]!.t : 0
  const count = points.length
  React.useLayoutEffect(() => {
    arrive.current = performance.now()
    wake()
  }, [lastT, count, wake])

  /* ------------------------------ Frame loop ------------------------------- */
  React.useLayoutEffect(() => {
    frameRef.current = (ts: number) => {
      raf.current = 0
      const L = live.current
      const v = view.current
      const cv = canvasRef.current
      const size = sizeRef.current
      if (!cv || !size.w) return
      const ctx = cv.getContext("2d")
      if (!ctx) return
      const pts = L.points
      const n = pts.length
      const dt = v.lastTs ? clamp(ts - v.lastTs, 0, 64) : 16
      v.lastTs = ts
      const W = size.w
      const H = size.h

      /* --- colours: resolved from CSS probes a few times a second, so theme changes follow --- */
      if (!colors.current || ts - v.colorsAt > 300) {
        const kids = probeRef.current?.children
        const root = probeRef.current?.parentElement
        if (kids && kids.length >= COLOR_KEYS.length) {
          const next = {} as Colors
          COLOR_KEYS.forEach((k, i) => {
            next[k] = getComputedStyle(kids[i] as Element).color
          })
          colors.current = next
          v.colorsAt = ts
        }
        if (root) fontFamily.current = getComputedStyle(root).fontFamily
      }
      const C = colors.current
      if (!C) return

      /* --- time: the view trails the newest reading by one interval and follows the feed's clock --- */
      const last = pts[n - 1]
      if (last) {
        const feedNow = last.t + (ts - arrive.current)
        const target = feedNow - L.interval
        if (L.reduced) {
          v.viewT = last.t
          v.snap = false
        } else if (v.snap || !v.started) {
          v.viewT = target
          v.snap = false
        } else if (!L.held) {
          v.viewT += dt
          const err = target - v.viewT
          v.viewT += err * (1 - Math.exp(-dt / (v.catchup ? 380 : 1400)))
          if (v.catchup && Math.abs(err) < 8) v.catchup = false
        }
        v.started = true
      }

      const plotL = PAD_L
      const plotR = W - GUT_R
      const plotT = PAD_T
      const plotB = H - PAD_B
      const plotW = Math.max(10, plotR - plotL)
      const t0 = v.viewT - L.windowMs
      const xOf = (t: number) => plotL + ((t - t0) / L.windowMs) * plotW

      /* --- visible slice and head --- */
      let i0 = Math.max(0, lowerBound(pts, t0) - 1)
      let iEnd = lowerBound(pts, v.viewT + 1e-6) - 1 // last point with t <= viewT
      if (iEnd < 0) iEnd = -1
      let dMin = Infinity
      let dMax = -Infinity
      for (let i = Math.max(i0, 0); i <= Math.min(n - 1, iEnd + 1); i++) {
        const p = pts[i]!
        if (p.t > v.viewT && i > iEnd + 1) break
        if (p.value < dMin) dMin = p.value
        if (p.value > dMax) dMax = p.value
      }
      if (!isFinite(dMin)) {
        dMin = 0
        dMax = 1
      }

      /* --- value axis eases toward the visible range --- */
      const rangePad = Math.max((dMax - dMin) * 0.14, Math.abs(dMax) * 0.02, 1e-6)
      const tLo = L.min ?? dMin - rangePad
      const tHi = L.max ?? dMax + rangePad
      let axisMoving = false
      if (!v.axisInit || L.reduced) {
        v.lo = tLo
        v.hi = tHi
        v.axisInit = true
      } else {
        const k = 1 - Math.exp(-dt / 260)
        const dLo = tLo - v.lo
        const dHi = tHi - v.hi
        v.lo += dLo * k
        v.hi += dHi * k
        const span = Math.max(v.hi - v.lo, 1e-9)
        axisMoving = Math.abs(dLo) / span > 0.0015 || Math.abs(dHi) / span > 0.0015
      }
      const span = Math.max(v.hi - v.lo, 1e-9)
      const yOf = (val: number) => plotB - ((val - v.lo) / span) * (plotB - plotT)

      /* --- tick alphas: ticks of the current step fade in, stale ones fade out --- */
      const step = niceStep(span / Math.max(2, Math.min(5, (plotB - plotT) / 46)))
      const want = new Set<number>()
      for (let val = Math.ceil(v.lo / step) * step; val <= v.hi + 1e-9; val += step) want.add(+val.toFixed(8))
      let tickMoving = false
      for (const val of want) if (!ticks.current.has(val)) ticks.current.set(val, L.reduced ? 1 : 0)
      for (const [val, a] of ticks.current) {
        const goal = want.has(val) ? 1 : 0
        const na = L.reduced ? goal : a + (goal - a) * (1 - Math.exp(-dt / 140))
        if (Math.abs(goal - na) < 0.01) {
          if (goal === 0) ticks.current.delete(val)
          else ticks.current.set(val, 1)
        } else {
          ticks.current.set(val, na)
          tickMoving = true
        }
      }

      /* --- draw --- */
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.font = `11px ${fontFamily.current}`
      ctx.textBaseline = "middle"

      ctx.lineWidth = 1
      for (const [val, a] of ticks.current) {
        const y = Math.round(yOf(val)) + 0.5
        if (y < plotT - 4 || y > plotB + 1) continue
        ctx.globalAlpha = a
        ctx.strokeStyle = C.grid
        ctx.beginPath()
        ctx.moveTo(plotL, y)
        ctx.lineTo(plotR + 4, y)
        ctx.stroke()
        ctx.fillStyle = C.label
        ctx.textAlign = "right"
        ctx.fillText(L.fmtV(val), W, y)
      }
      ctx.globalAlpha = 1

      // time labels, thinned to the plot width
      const pxPerSec = plotW / (L.windowMs / 1000)
      const stepSec = TIME_STEPS.find((s) => s * pxPerSec >= 58) ?? TIME_STEPS[TIME_STEPS.length - 1]!
      ctx.fillStyle = C.label
      ctx.textAlign = "center"
      for (let k = 0; k * stepSec * 1000 <= L.windowMs; k++) {
        const x = plotR - k * stepSec * pxPerSec
        ctx.fillText(k === 0 ? "now" : fmtAgo(k * stepSec), clamp(x, 14, plotR + 10), H - PAD_B / 2 + 1)
      }

      let headX = plotR
      let headY = plotB
      let headT = -1
      const hasHead = iEnd >= 0 && n > 0
      if (hasHead) {
        // curve through the visible readings, ending exactly at the (interpolated) head
        const a = Math.max(0, Math.min(i0, iEnd))
        const b = Math.min(n - 1, iEnd + 1)
        const m = b - a + 1
        ensureScratch(m + 2)
        for (let k = 0; k < m; k++) {
          SX[k] = xOf(pts[a + k]!.t)
          SY[k] = yOf(pts[a + k]!.value)
        }
        if (m >= 2) monotoneTangents(m)
        else SM[0] = 0
        const segs = iEnd - a // segments fully before the head
        ctx.save()
        ctx.beginPath()
        ctx.rect(plotL - 0.5, plotT - 8, plotW + 1 + 0.5, plotB - plotT + 8)
        ctx.clip()
        const trace = (move: boolean) => {
          if (move) ctx.moveTo(SX[0]!, SY[0]!)
          else ctx.lineTo(SX[0]!, SY[0]!)
          for (let k = 0; k < segs; k++) {
            const dx = SX[k + 1]! - SX[k]!
            ctx.bezierCurveTo(SX[k]! + dx / 3, SY[k]! + (SM[k]! * dx) / 3, SX[k + 1]! - dx / 3, SY[k + 1]! - (SM[k + 1]! * dx) / 3, SX[k + 1]!, SY[k + 1]!)
          }
          if (iEnd + 1 <= n - 1 && m >= 2 && segs < m - 1) {
            // head segment, split with de Casteljau at the fraction of it the view has crossed
            const k = segs
            const dx = SX[k + 1]! - SX[k]!
            const x0 = SX[k]!
            const y0 = SY[k]!
            const x1 = x0 + dx / 3
            const y1 = y0 + (SM[k]! * dx) / 3
            const x2 = SX[k + 1]! - dx / 3
            const y2 = SY[k + 1]! - (SM[k + 1]! * dx) / 3
            const x3 = SX[k + 1]!
            const y3 = SY[k + 1]!
            const u = clamp((v.viewT - pts[a + k]!.t) / Math.max(1e-6, pts[a + k + 1]!.t - pts[a + k]!.t), 0, 1)
            const lerp = (p: number, q: number) => p + (q - p) * u
            const ax = lerp(x0, x1)
            const ay = lerp(y0, y1)
            const bx = lerp(x1, x2)
            const by = lerp(y1, y2)
            const cx = lerp(x2, x3)
            const cy = lerp(y2, y3)
            const dx2 = lerp(ax, bx)
            const dy2 = lerp(ay, by)
            const ex = lerp(bx, cx)
            const ey = lerp(by, cy)
            const fx = lerp(dx2, ex)
            const fy = lerp(dy2, ey)
            ctx.bezierCurveTo(ax, ay, dx2, dy2, fx, fy)
            headX = fx
            headY = fy
          } else {
            headX = SX[segs]!
            headY = SY[segs]!
          }
        }
        // area
        ctx.beginPath()
        trace(true)
        ctx.lineTo(headX, plotB)
        ctx.lineTo(SX[0]!, plotB)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, plotT, 0, plotB)
        grad.addColorStop(0, C.fillTop)
        grad.addColorStop(1, C.fillBot)
        ctx.fillStyle = grad
        ctx.fill()
        // line
        ctx.beginPath()
        trace(true)
        ctx.lineWidth = 1.5
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.strokeStyle = C.line
        ctx.stroke()
        ctx.restore()
        headT = pts[iEnd]!.t
      }

      /* --- anomaly markers: pop in with one overshoot as the head reaches them --- */
      let popping = false
      let tagRight = -1e9
      let peak = -1
      if (hasHead) {
        for (let i = Math.max(0, i0); i <= iEnd; i++) {
          const p = pts[i]!
          if (!p.anomaly) continue
          if (i === Math.max(0, i0) || !pts[i - 1]!.anomaly) {
            // a run of anomalies gets one stem and tag, on its highest reading
            peak = i
            for (let j = i; j <= iEnd && pts[j]!.anomaly; j++) if (pts[j]!.value >= pts[peak]!.value) peak = j
          }
          const x = xOf(p.t)
          if (x < plotL - 6) continue
          const age = (v.viewT - p.t) / 360
          const s = L.reduced ? 1 : age >= 1 ? 1 : easeOutBack(clamp(age, 0, 1))
          if (age < 1 && !L.reduced) popping = true
          const y = yOf(p.value)
          ctx.save()
          ctx.globalAlpha = clamp(age * 3, 0, 1)
          if (i === peak) {
            const tag = typeof p.anomaly === "string" ? p.anomaly : "Anomaly"
            ctx.font = `500 11px ${fontFamily.current}`
            const tw = ctx.measureText(tag).width + 14
            const stem = 12 * s
            ctx.strokeStyle = C.flag
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(x, y - 4)
            ctx.lineTo(x, y - 4 - stem)
            ctx.stroke()
            if (x - tw / 2 > tagRight + 6 && x + tw / 2 < W - 2 && x - tw / 2 > 0) {
              ctx.save()
              ctx.translate(x, y - 4 - 12 - 10)
              ctx.scale(s, s)
              ctx.beginPath()
              ctx.roundRect(-tw / 2, -10, tw, 20, 7)
              ctx.fillStyle = C.surface
              ctx.fill()
              ctx.lineWidth = 1
              ctx.strokeStyle = C.grid
              ctx.stroke()
              ctx.fillStyle = C.ink
              ctx.textAlign = "center"
              ctx.fillText(tag, 0, 0.5)
              ctx.restore()
              tagRight = x + tw / 2
            }
          }
          ctx.beginPath()
          ctx.arc(x, y, 4 * s, 0, Math.PI * 2)
          ctx.fillStyle = C.flag
          ctx.fill()
          ctx.lineWidth = 2
          ctx.strokeStyle = C.surface
          ctx.stroke()
          ctx.restore()
        }
      }

      /* --- head: a dot with a soft pulse while live --- */
      if (hasHead) {
        const pulse = !L.held && !L.reduced ? (ts % 1800) / 1800 : 0
        if (pulse > 0) {
          ctx.beginPath()
          ctx.arc(headX, headY, 3.5 + pulse * 7, 0, Math.PI * 2)
          ctx.globalAlpha = (1 - pulse) * 0.28
          ctx.fillStyle = C.line
          ctx.fill()
          ctx.globalAlpha = 1
        }
        ctx.beginPath()
        ctx.arc(headX, headY, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = C.line
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = C.surface
        ctx.stroke()
      }

      /* --- reading: crosshair, marker and tooltip --- */
      const tip = tipRef.current
      let tipSettled = true
      if (L.reading && hasHead) {
        const ri = lowerBound(pts, L.reading.t)
        const rp = pts[ri]
        if (rp && rp.t === L.reading.t) {
          const x = xOf(rp.t)
          const y = yOf(rp.value)
          ctx.strokeStyle = C.cross
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(Math.round(x) + 0.5, plotT - 6)
          ctx.lineTo(Math.round(x) + 0.5, plotB)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fillStyle = rp.anomaly ? C.flag : C.line
          ctx.fill()
          ctx.lineWidth = 2
          ctx.strokeStyle = C.surface
          ctx.stroke()
          if (tip) {
            const tw = tip.offsetWidth
            const th = tip.offsetHeight
            const left = clamp(x - tw / 2, 0, W - tw)
            const top = y - th - 14 < 0 ? y + 14 : y - th - 14
            if (Math.abs(left - v.tipX) > 0.25 || Math.abs(top - v.tipY) > 0.25) {
              tip.style.transition = v.tipX < 0 ? "opacity .14s" : "opacity .14s, transform .12s cubic-bezier(.22, 1, .36, 1)"
              v.tipX = left
              v.tipY = top
              tip.style.transform = `translate(${left}px, ${top}px)`
              tipSettled = false
            }
          }
        }
      }

      if (!L.reading) v.tipX = -1

      // expose which reading the big number shows (changes about once per interval, so React re-renders rarely)
      if (headT !== v.shownT) {
        v.shownT = headT
        setShownT(headT >= 0 ? headT : null)
      }

      /* --- sleep when nothing moves --- */
      const moving = !L.held || axisMoving || tickMoving || popping || !tipSettled || v.catchup
      if (L.reduced) return
      if (!moving) v.idle++
      else v.idle = 0
      if (v.idle < 8 && onScreen.current) raf.current = requestAnimationFrame((t) => frameRef.current(t))
    }
    wake()
  })

  // Redraw once on size, then keep the canvas pixel-exact at the device pixel ratio.
  React.useLayoutEffect(() => {
    const el = plotRef.current
    const cv = canvasRef.current
    if (!el || !cv) return
    const apply = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const dpr = Math.min(3, window.devicePixelRatio || 1)
      sizeRef.current = { w, h, dpr }
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      view.current.tipX = -1
      wake()
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => {
      onScreen.current = !!e?.isIntersecting
      if (onScreen.current) {
        view.current.snap = true
        view.current.lastTs = 0
        wake()
      }
    })
    io.observe(el)
    const onVis = () => {
      if (!document.hidden) {
        view.current.snap = true
        view.current.lastTs = 0
        wake()
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      cancelAnimationFrame(raf.current)
      raf.current = 0 // reset so the loop restarts after StrictMode's dev double-mount
    }
  }, [wake])

  // The theme can change without any prop changing.
  React.useEffect(() => {
    const mo = new MutationObserver(() => {
      view.current.colorsAt = -1e9
      wake()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => mo.disconnect()
  }, [wake])

  /* ------------------------------- Readings -------------------------------- */
  const visibleRange = () => {
    const L = live.current
    const pts = L.points
    const v = view.current
    const from = Math.max(0, lowerBound(pts, v.viewT - L.windowMs))
    const to = lowerBound(pts, v.viewT + 1e-6) - 1
    return { from, to: Math.min(to, pts.length - 1), pts }
  }
  const readAt = (clientX: number, key: boolean) => {
    const el = plotRef.current
    if (!el) return
    const L = live.current
    const rect = el.getBoundingClientRect()
    const plotW = Math.max(10, rect.width - GUT_R - PAD_L)
    const t = view.current.viewT - L.windowMs + ((clientX - rect.left - PAD_L) / plotW) * L.windowMs
    const { from, to, pts } = visibleRange()
    const i = nearest(pts, t, from, to)
    if (i >= 0) setReading({ t: pts[i]!.t, key })
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const { from, to, pts } = visibleRange()
    if (to < from) return
    const cur = reading ? clamp(lowerBound(pts, reading.t), from, to) : to
    let next = cur
    switch (e.key) {
      case "ArrowLeft":
        next = cur - 1
        break
      case "ArrowRight":
        next = cur + 1
        break
      case "PageUp":
        next = cur - 10
        break
      case "PageDown":
        next = cur + 10
        break
      case "Home":
        next = from
        break
      case "End":
        next = to
        break
      case " ":
      case "Enter":
        e.preventDefault()
        setPaused(!paused)
        return
      case "Escape":
        setReading(null)
        setFocused(false)
        if (paused) setPaused(false)
        return
      default:
        return
    }
    e.preventDefault()
    setFocused(true)
    setReading({ t: pts[clamp(next, from, to)]!.t, key: true })
  }

  /* -------------------------------- Output --------------------------------- */
  const readingPoint = React.useMemo(() => {
    if (!reading) return null
    const i = lowerBound(points, reading.t)
    const p = points[i]
    return p && p.t === reading.t ? p : null
  }, [reading, points])
  const shownPoint = React.useMemo(() => {
    if (!points.length) return null
    if (shownT !== null) {
      const i = lowerBound(points, shownT)
      if (points[i] && points[i]!.t === shownT) return points[i]!
    }
    return points[points.length - 1]!
  }, [points, shownT])
  const display = readingPoint ?? shownPoint
  const valueText = display ? fmtV(display.value) : "–"

  // Anomalies are announced once, as they arrive (state adjusted during render, not in an effect).
  const [announced, setAnnounced] = React.useState<{ t: number; text: string }>({ t: -Infinity, text: "" })
  for (let i = points.length - 1; i >= Math.max(0, points.length - 4); i--) {
    const p = points[i]!
    if (p.t <= announced.t) break
    if (p.anomaly) {
      setAnnounced({ t: p.t, text: `${typeof p.anomaly === "string" ? p.anomaly : "Anomaly"} at ${fmtT(p.t)}, ${fmtV(p.value)} ${unit}`.trim() })
      break
    }
  }

  const tail = points.slice(-20)
  const tagOf = (p: StreamPoint) => (p.anomaly ? (typeof p.anomaly === "string" ? p.anomaly : "Anomaly") : "")
  const status = paused ? "Paused" : held ? "Held" : "Live"

  return (
    <figure className={cn("rts", className)} aria-label={`${label}, live chart`}>
      <style href="realtime-stream" precedence="default">
        {CSS}
      </style>
      {(title || subtitle) && (
        <div>
          {title && <p className="rts-title">{title}</p>}
          {subtitle && <p className="rts-sub">{subtitle}</p>}
        </div>
      )}
      <div className="rts-head">
        <p className="rts-now">
          <span className="rts-sr">{`${label}: ${valueText} ${unit}`.trim()}</span>
          <Roll text={valueText} />
          {unit && (
            <span className="rts-unit" aria-hidden="true">
              {unit}
            </span>
          )}
        </p>
        <button type="button" className="rts-status" aria-pressed={paused} data-held={held ? "" : undefined} onClick={() => setPaused(!paused)}>
          {paused ? <span className="rts-pause" aria-hidden="true" /> : <span className="rts-dot" aria-hidden="true" />}
          <span>{status}</span>
          <span className="rts-sr">{paused ? ", resume" : ", pause"}</span>
        </button>
      </div>

      <div
        ref={plotRef}
        className="rts-plot"
        style={{ height }}
        role="group"
        tabIndex={0}
        aria-label={`${label}. Arrow keys read points, Space pauses.`}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          if (!e.currentTarget.matches(":focus-visible")) return
          setFocused(true)
          const { to, pts } = visibleRange()
          if (to >= 0) setReading({ t: pts[to]!.t, key: true })
        }}
        onBlur={() => {
          setFocused(false)
          setReading(null)
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHover(true)
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || pressing) readAt(e.clientX, false)
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "mouse") return
          setHover(false)
          if (!focused) setReading(null)
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return
          e.currentTarget.setPointerCapture(e.pointerId)
          setPressing(true)
          readAt(e.clientX, false)
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") return
          setPressing(false)
          setReading(null)
        }}
        onPointerCancel={() => {
          setPressing(false)
          setReading(null)
        }}
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="rts-probes" ref={probeRef} aria-hidden="true">
          {COLOR_KEYS.map((k, i) => (
            <i key={k} className={`rts-p${i}`} />
          ))}
        </span>
        {!points.length && <div className="rts-empty">{emptyLabel}</div>}
        <div ref={tipRef} className="rts-tip" data-on={readingPoint ? "" : undefined} aria-hidden="true" style={readingPoint?.anomaly ? ({ "--flag": "var(--rts-flag)" } as React.CSSProperties) : undefined}>
          {readingPoint && (
            <>
              <p className="rts-tip-v">{`${fmtV(readingPoint.value)}${unit ? ` ${unit}` : ""}`}</p>
              <p className="rts-tip-m">
                {fmtT(readingPoint.t)}
                {readingPoint.anomaly ? <> · <b>{tagOf(readingPoint)}</b></> : null}
              </p>
            </>
          )}
        </div>
      </div>

      <p className="rts-sr" role="status" aria-live="polite">
        {announced.text}
      </p>
      <p className="rts-sr" aria-live="polite">
        {reading?.key && readingPoint ? `${fmtT(readingPoint.t)}, ${fmtV(readingPoint.value)} ${unit}${readingPoint.anomaly ? `, ${tagOf(readingPoint)}` : ""}` : ""}
      </p>
      <div className="rts-sr">
        <table>
          <caption>{`${label}, latest ${tail.length} readings`}</caption>
          <thead>
            <tr>
              <th>Time</th>
              <th>Value</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {tail.map((p) => (
              <tr key={p.t}>
                <th scope="row">{fmtT(p.t)}</th>
                <td>{`${fmtV(p.value)} ${unit}`.trim()}</td>
                <td>{tagOf(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type InstrumentHeroAction = {
  label: string
  /** Renders an <a> when set, a <button> otherwise. */
  href?: string
  onClick?: () => void
  /** "primary" = ink fill, "secondary" = hairline. Default: first action primary, the rest secondary. */
  variant?: "primary" | "secondary"
  /** Show a small arrow after the label. Default: true for the primary action. */
  arrow?: boolean
}

export type InstrumentHeroStat = {
  label: string
  /** A number settles (counts up, one tiny overshoot) when the row scrolls into view. A string is shown as is. */
  value: number | string
  /** Fraction digits when `value` is a number. */
  decimals?: number
  prefix?: string
  /** Small t3 unit after the number: "ms", "%", "M". */
  unit?: string
}

export type InstrumentHeroProps = {
  /** Mono line above the headline. */
  kicker?: React.ReactNode
  /**
   * The headline. Pass an array to control the lines: each item is one line and scans in on its own.
   * Use `<em>` for the one italic word.
   */
  title?: React.ReactNode | React.ReactNode[]
  subtitle?: React.ReactNode
  actions?: InstrumentHeroAction[]
  /** 3-4 proof numbers for the readout row under everything. Pass `[]` to hide it. */
  stats?: InstrumentHeroStat[]
  /** Replaces the default specimen figure (right on desktop, below on mobile). */
  figure?: React.ReactNode
  /** FIG. caption of the default specimen. */
  caption?: React.ReactNode
  /** Header label inside the default specimen. */
  figureLabel?: React.ReactNode
  /** Keep drawing the live trace in the default specimen. Default: true. */
  live?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ihe {
  --ihe-paper: #fafafa;
  --ihe-sheet: #ffffff;
  --ihe-ink: #0a0a0a;
  --ihe-signal: #0060e2;
  --ihe-signal-soft: color-mix(in oklab, var(--ihe-signal) 12%, transparent);
  --ihe-t1: color-mix(in oklab, var(--ihe-ink) 92%, transparent);
  --ihe-t2: color-mix(in oklab, var(--ihe-ink) 64%, transparent);
  --ihe-t3: color-mix(in oklab, var(--ihe-ink) 44%, transparent);
  --ihe-t4: color-mix(in oklab, var(--ihe-ink) 22%, transparent);
  --ihe-rule: color-mix(in oklab, var(--ihe-ink) 14%, transparent);
  --ihe-rule-2: color-mix(in oklab, var(--ihe-ink) 7%, transparent);
  --ihe-ok: #1f8a4c; --ihe-warn: #b7791f; --ihe-bad: #c4321a;
  --ihe-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ihe-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ihe-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ihe-ease: cubic-bezier(.2, .8, .2, 1);
  --ihe-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --ihe-surface: var(--ihe-sheet);
  --ihe-accent: var(--ihe-signal);
  --ihe-font: var(--ihe-sans);
  position: relative;
  display: block;
  width: 100%;
  container: ihe / inline-size;
  background: var(--ihe-paper);
  font: 13px/20px var(--ihe-font);
  color: var(--ihe-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ihe {
  --ihe-paper: #0c0c0d; --ihe-sheet: #1c1c1e; --ihe-ink: #f5f5f5; --ihe-signal: #4d8dff;
}
.ihe *, .ihe *::before, .ihe *::after { box-sizing: border-box }
:where(.ihe) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ihe a { color: inherit; text-decoration: none }
.ihe :focus-visible { outline: 2px solid var(--ihe-accent); outline-offset: 2px }

.ihe-in { max-width: 1200px; margin: 0 auto; padding: 32px 16px 0 }
@container ihe (min-width: 640px) { .ihe-in { padding: 48px 32px 0 } }
@container ihe (min-width: 1000px) { .ihe-in { padding-top: 64px } }

.ihe-top { display: grid; gap: 48px; padding-bottom: 48px }
@container ihe (min-width: 880px) {
  .ihe-top { grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; align-items: center; padding-bottom: 64px }
  .ihe-copy { grid-column: 1 / span 7 }
  .ihe-figcell { grid-column: 8 / span 5 }
}

/* ---- copy ---- */
.ihe-copy { min-width: 0 }
.ihe-kicker {
  display: flex; align-items: center; gap: 12px;
  font: 500 11px/16px var(--ihe-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ihe-t3);
  animation: ihe-fade 520ms var(--ihe-ease) backwards;
}
.ihe-kicker::before {
  content: ""; width: 24px; height: 1px; background: var(--ihe-t3); transform-origin: left;
  animation: ihe-grow 640ms var(--ihe-ease-trace) backwards;
}
.ihe-title {
  margin: 20px 0 0; font: 400 clamp(36px, 3.6cqi + 24px, 72px)/1.02 var(--ihe-serif);
  letter-spacing: -.01em; color: var(--ihe-ink);
}
.ihe-title em { font-style: italic }
.ihe-line {
  display: block; position: relative; width: fit-content; max-width: 100%;
  animation: ihe-reveal 640ms var(--ihe-ease-trace) backwards; animation-delay: calc(var(--i, 0) * 380ms + 140ms);
}
.ihe-line::after {
  content: ""; position: absolute; top: .1em; bottom: .12em; left: 0; width: 1px; background: var(--ihe-accent);
  pointer-events: none; animation: ihe-scanline 640ms var(--ihe-ease-trace) backwards; animation-delay: calc(var(--i, 0) * 380ms + 140ms);
  opacity: 0;
}
.ihe-sub {
  margin: 24px 0 0; max-width: 480px; font: 400 15px/24px var(--ihe-sans); color: var(--ihe-t2);
  animation: ihe-rise 560ms var(--ihe-ease) backwards; animation-delay: calc(var(--n, 2) * 380ms + 160ms);
}
@container ihe (min-width: 640px) { .ihe-sub { font-size: 17px; line-height: 27px } }
.ihe-actions {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px;
  animation: ihe-rise 560ms var(--ihe-ease) backwards; animation-delay: calc(var(--n, 2) * 380ms + 280ms);
}
.ihe-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px;
  border-radius: 2px; font: 500 14px/1 var(--ihe-sans); white-space: nowrap;
  transition: background-color 160ms var(--ihe-ease), box-shadow 160ms var(--ihe-ease);
}
.ihe-btn svg { transition: transform 200ms var(--ihe-ease) }
.ihe-btn:hover svg { transform: translateX(2px) }
.ihe-btn[data-variant="primary"] { background: var(--ihe-ink); color: var(--ihe-paper) }
.ihe-btn[data-variant="primary"]:hover { background: color-mix(in oklab, var(--ihe-ink) 86%, var(--ihe-paper)) }
.ihe-btn[data-variant="secondary"] { box-shadow: inset 0 0 0 1px var(--ihe-t4); color: var(--ihe-t1) }
.ihe-btn[data-variant="secondary"]:hover { background: var(--ihe-rule-2); box-shadow: inset 0 0 0 1px var(--ihe-t3) }

/* ---- figure ---- */
.ihe-figcell { min-width: 0 }
.ihe-fig { margin: 0; animation: ihe-fade 640ms var(--ihe-ease) backwards; animation-delay: 240ms }
.ihe-frame { position: relative; background: var(--ihe-surface); box-shadow: 0 0 0 1px var(--ihe-rule); padding: 12px 12px 8px }
.ihe-marks { position: absolute; inset: 0; pointer-events: none }
.ihe-marks i { position: absolute; width: 8px; height: 8px; border: 0 solid var(--ihe-t4) }
.ihe-marks i:nth-child(1) { left: -10px; top: -10px; border-width: 1px 0 0 1px }
.ihe-marks i:nth-child(2) { right: -10px; top: -10px; border-width: 1px 1px 0 0 }
.ihe-marks i:nth-child(3) { left: -10px; bottom: -10px; border-width: 0 0 1px 1px }
.ihe-marks i:nth-child(4) { right: -10px; bottom: -10px; border-width: 0 1px 1px 0 }
.ihe-fhead {
  display: flex; justify-content: space-between; gap: 12px; padding-bottom: 10px;
  font: 500 10.5px/16px var(--ihe-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ihe-t3);
}
.ihe-fhead > span { display: inline-flex; align-items: center; gap: 8px; min-width: 0 }
.ihe-fhead > span:first-child { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: block }
.ihe-live { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--ihe-accent); flex: none }
.ihe-live::after {
  content: ""; position: absolute; inset: 0; border-radius: 50%; border: 1px solid var(--ihe-accent);
  animation: ihe-pulse 1.6s var(--ihe-ease) infinite;
}
.ihe-fhead b { font-weight: 500; color: var(--ihe-t1); font-variant-numeric: tabular-nums }
.ihe-body { position: relative }
.ihe-row { display: grid; grid-template-columns: 32px minmax(0, 1fr) }
.ihe-gl { font: 500 9.5px/12px var(--ihe-mono); letter-spacing: .06em; color: var(--ihe-t3); text-transform: uppercase; display: flex; align-items: center }
.ihe-ylab { position: relative; height: 100% }
.ihe-ylab span { position: absolute; right: 6px; font: 500 9.5px/12px var(--ihe-mono); color: var(--ihe-t3); transform: translateY(-50%) }
.ihe-plot { position: relative; height: 188px }
@container ihe (max-width: 639px) { .ihe-plot { height: 168px } }
.ihe-plot svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.ihe-plot path { fill: none; vector-effect: non-scaling-stroke; shape-rendering: geometricPrecision; stroke-linejoin: round; stroke-linecap: round }
.ihe-gridl path { shape-rendering: crispEdges; stroke: var(--ihe-rule-2); stroke-width: 1 }
.ihe-gridl path[data-base] { stroke: var(--ihe-rule) }
.ihe-cur { stroke: var(--ihe-ink); stroke-width: 1.25 }
.ihe-prev { stroke: var(--ihe-ink); stroke-width: 1.25; opacity: .3 }
.ihe-trace { animation: ihe-clip 1100ms var(--ihe-ease-trace) backwards }
.ihe-phase {
  position: absolute; top: 5px; padding-left: 6px; font: 500 9.5px/12px var(--ihe-mono); letter-spacing: .08em; color: var(--ihe-t3);
  border-left: 1px solid var(--ihe-rule); height: 12px; animation: ihe-fade 600ms var(--ihe-ease) backwards; animation-delay: 500ms;
}
.ihe-phase:first-of-type { border-left-color: transparent }
.ihe-band { position: relative; height: 27px; margin-top: 8px; box-shadow: 0 0 0 1px var(--ihe-rule-2) }
.ihe-band canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
.ihe-bandclip { position: absolute; inset: 0; animation: ihe-clip 1100ms var(--ihe-ease-trace) backwards }
.ihe-ruler { position: relative; height: 26px; border-top: 1px solid var(--ihe-t4); margin-top: 8px; animation: ihe-fade 600ms var(--ihe-ease) backwards; animation-delay: 300ms }
.ihe-ruler svg { position: absolute; left: 0; top: 0; width: 100%; height: 8px; overflow: visible }
.ihe-ruler path { vector-effect: non-scaling-stroke; shape-rendering: crispEdges; stroke: var(--ihe-t4); stroke-width: 1; fill: none }
.ihe-ruler path[data-major] { stroke: var(--ihe-t3) }
.ihe-ruler span { position: absolute; top: 11px; transform: translateX(-50%); font: 500 9.5px/12px var(--ihe-mono); color: var(--ihe-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.ihe-ruler span:last-of-type { transform: translateX(-100%) }
.ihe-ruler span:first-of-type { transform: none }
.ihe-nowwrap { position: absolute; inset: 0 0 0 32px; pointer-events: none }
.ihe-now { position: absolute; top: 0; bottom: 0; width: 1px; margin-left: -.5px; background: var(--ihe-accent); animation: ihe-tickin 1100ms var(--ihe-ease-trace) backwards }
.ihe-now::after { content: ""; position: absolute; left: -1px; bottom: 0; width: 3px; height: 10px; background: var(--ihe-accent) }
.ihe-dot {
  position: absolute; width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; border-radius: 50%;
  background: var(--ihe-ink); box-shadow: 0 0 0 2px var(--ihe-surface); transition: opacity 300ms var(--ihe-ease);
}
.ihe-leg { display: flex; flex-wrap: wrap; gap: 4px 16px; padding: 10px 0 2px 32px; font: 500 9.5px/12px var(--ihe-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ihe-t3) }
.ihe-leg span { display: inline-flex; align-items: center; gap: 6px }
.ihe-leg i { display: inline-block; width: 12px; height: 0; border-top: 1.25px solid var(--ihe-ink) }
.ihe-leg i[data-dither] { height: 6px; border: 0; background: radial-gradient(circle, var(--ihe-ink) 0 .75px, transparent 1px) 0 0 / 3px 3px }
.ihe-cap { margin: 16px 0 0; font: 500 10.5px/16px var(--ihe-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ihe-t3) }
.ihe-cap b { font-weight: 500; color: var(--ihe-t1) }

/* ---- readout row ---- */
.ihe-stats {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--ihe-rule);
  border-top: 1px solid var(--ihe-rule); border-bottom: 1px solid var(--ihe-rule);
}
.ihe-stat { background: var(--ihe-paper); padding: 20px 0 22px 16px; min-width: 0; animation: ihe-fade 560ms var(--ihe-ease) backwards; animation-delay: calc(var(--i, 0) * 80px + 700ms) }
.ihe-stat:first-child { padding-left: 0 }
.ihe-stat:last-child:nth-child(odd) { grid-column: 1 / -1; padding-left: 0 }
.ihe-stat:nth-child(odd) { padding-left: 0 }
.ihe-stat dt { font: 500 10.5px/16px var(--ihe-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ihe-t3); margin: 0 }
.ihe-stat dd { margin: 8px 0 0; font: 400 28px/32px var(--ihe-mono); letter-spacing: -.02em; color: var(--ihe-ink); font-variant-numeric: tabular-nums; white-space: nowrap }
.ihe-stat dd small { margin-left: 4px; font: 500 12px/16px var(--ihe-mono); letter-spacing: 0; color: var(--ihe-t3) }
@container ihe (min-width: 760px) {
  .ihe-stats { grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)) }
  .ihe-stat, .ihe-stat:nth-child(odd) { padding-left: 24px }
  .ihe-stat:first-child { padding-left: 0 }
  .ihe-stat:last-child:nth-child(odd) { grid-column: auto }
  .ihe-stat dd { font-size: 34px; line-height: 40px }
}

@keyframes ihe-fade { from { opacity: 0 } }
@keyframes ihe-rise { from { opacity: 0; transform: translateY(6px) } }
@keyframes ihe-grow { from { transform: scaleX(0) } }
@keyframes ihe-reveal { from { clip-path: inset(-.1em 100% -.2em -.05em) } to { clip-path: inset(-.1em -.1em -.2em -.05em) } }
@keyframes ihe-scanline { 0% { left: 0; opacity: 1 } 80% { opacity: 1 } 100% { left: 100%; opacity: 0 } }
@keyframes ihe-clip { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 18% 0 0) } }
@keyframes ihe-tickin { from { left: 0 } }
@keyframes ihe-pulse { from { transform: scale(1); opacity: .6 } to { transform: scale(3); opacity: 0 } }

@media (prefers-reduced-motion: reduce) {
  .ihe *, .ihe *::before, .ihe *::after { animation: none !important; transition: none !important }
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

/** True from the first moment the element is on screen. */
function useSeen(ref: React.RefObject<Element | null>) {
  const [seen, setSeen] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setSeen(true), 0)
      return () => window.clearTimeout(id)
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

/** Counts to the target, then makes one tiny overshoot-and-return (about 1%). */
const settleCurve = (t: number) => 1 - Math.pow(1 - t, 3) + 0.045 * Math.sin(Math.PI * t) * t

function useSettle(target: number, active: boolean, delay = 0, duration = 1100) {
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
      const t = Math.max(0, Math.min(1, (ts - t0 - delay) / duration))
      if (t >= 1) return done()
      const v = from + (target - from) * settleCurve(t)
      cur.current = v
      setShown(v)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // If frames never arrive (throttled or captured page), still land on the real number.
    const fallback = window.setTimeout(done, delay + duration + 400)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [target, active, reduced, delay, duration])
  return reduced ? target : shown
}

const fmt = (v: number, d: number) => v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })

/* -------------------------------------------------------------------------- */
/*                         The specimen: a live agent trace                    */
/* -------------------------------------------------------------------------- */

const N = 240 // samples per sweep
const W = 400 // svg width in user units
const H = 200
const PAD = 12
const WINDOW_MS = 12000 // one sweep = 12 s
const INTRO_MS = 1100
const HEAD0 = 0.82 // where the first sweep rests before going live
const GAP = 0.04 // blank space ahead of the write head
const PHASES = [
  { name: "PLAN", at: 0 },
  { name: "RETRIEVE", at: 0.28 },
  { name: "WRITE", at: 0.68 },
]
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

type Sweep = { a: Float32Array; c: Float32Array }

const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
const gauss = (u: number, mu: number, sd: number) => Math.exp(-(((u - mu) / sd) ** 2) / 2)
const smooth = (a: number, b: number, u: number) => {
  const t = Math.min(1, Math.max(0, (u - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** One deterministic sweep of "agent activity" (a) and "answer confidence" (c), both 0..1. */
function makeSweep(seed: number): Sweep {
  const a = new Float32Array(N + 1)
  const c = new Float32Array(N + 1)
  const j = (k: number) => rnd(seed * 13.7 + k)
  const bursts = [0.34 + j(1) * 0.04, 0.46 + j(2) * 0.05, 0.6 + j(3) * 0.05].map((mu, k) => ({ mu, h: 0.42 + j(10 + k) * 0.3 }))
  let lp = 0
  for (let i = 0; i <= N; i++) {
    const u = i / N
    lp = lp * 0.6 + (rnd(seed * 977 + i) - 0.5) * 0.05
    const plan = 0.2 + 0.07 * Math.sin(u * 34 + seed) + 0.14 * smooth(0.08, 0.28, u)
    let v = plan * (1 - 0.4 * smooth(0.6, 0.8, u))
    for (const b of bursts) v += b.h * gauss(u, b.mu, 0.012)
    v += smooth(0.62, 0.74, u) * (0.2 + 0.13 * Math.sin((u - 0.68) * 64 + seed * 1.3)) * (1 - 0.55 * smooth(0.8, 1, u))
    a[i] = clamp(v + lp, 0.04, 0.9)
    c[i] = clamp(0.7 + 0.08 * Math.sin(u * 5 + seed) - 0.3 * gauss(u, 0.4, 0.12) + 0.26 * smooth(0.5, 0.95, u) + (rnd(seed * 331 + i) - 0.5) * 0.06, 0.3, 0.97)
  }
  return { a, c }
}

const yOf = (a: number) => H - PAD - a * (H - 2 * PAD)

function toPath(arr: Float32Array, i0: number, i1: number) {
  let d = ""
  for (let i = Math.max(0, i0); i <= Math.min(N, i1); i++) {
    d += `${d ? "L" : "M"}${((i / N) * W).toFixed(1)} ${yOf(arr[i]).toFixed(1)}`
  }
  return d
}

function drawBand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cur: Sweep,
  prev: Sweep | null,
  pos: number,
  ink: string,
) {
  const cell = 3
  const cols = Math.floor(w / cell)
  const rows = Math.floor(h / cell)
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = ink
  const ox = (w - cols * cell) / 2
  const oy = (h - rows * cell) / 2
  for (let col = 0; col < cols; col++) {
    const u = (col + 0.5) / cols
    let conf: number
    let alpha: number
    if (u <= pos) {
      conf = cur.c[Math.round(u * N)]
      alpha = 0.82
    } else if (prev && u >= pos + GAP) {
      conf = prev.c[Math.round(u * N)]
      alpha = 0.22
    } else continue
    const dens = clamp((conf - 0.25) / 0.72, 0, 1)
    ctx.globalAlpha = alpha
    for (let row = 0; row < rows; row++) {
      if (dens > (BAYER[row & 3][col & 3] + 0.5) / 16) ctx.fillRect(ox + col * cell, oy + row * cell, 2, 2)
    }
  }
  ctx.globalAlpha = 1
}

function Marks() {
  return (
    <span className="ihe-marks" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function Specimen({ caption, label, live }: { caption: React.ReactNode; label: React.ReactNode; live: boolean }) {
  const reduced = useReducedMotion()
  const animated = live && !reduced
  const frameRef = React.useRef<HTMLDivElement>(null)
  const curRef = React.useRef<SVGPathElement>(null)
  const prevRef = React.useRef<SVGPathElement>(null)
  const tickRef = React.useRef<HTMLSpanElement>(null)
  const dotRef = React.useRef<HTMLSpanElement>(null)
  const bandRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const timeRef = React.useRef<HTMLElement>(null)

  const first = React.useMemo(() => makeSweep(0), [])
  const headIdx = Math.floor(HEAD0 * N)
  const initialD = React.useMemo(() => toPath(first.a, 0, headIdx), [first, headIdx])

  React.useEffect(() => {
    const frame = frameRef.current
    const band = bandRef.current
    const canvas = canvasRef.current
    const curPath = curRef.current
    const prevPath = prevRef.current
    const tick = tickRef.current
    const dot = dotRef.current
    const timeEl = timeRef.current
    if (!frame || !band || !canvas || !curPath || !prevPath || !tick || !dot || !timeEl) return
    const ctx = canvas.getContext("2d")

    const S = { pos: HEAD0, sweep: 0, cur: first, prev: null as Sweep | null, ink: "#0a0a0a" }
    const readInk = () => {
      const v = getComputedStyle(frame).getPropertyValue("--ihe-ink").trim()
      if (v) S.ink = v
    }
    let w = 0
    let h = 0
    const size = () => {
      const r = band.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      w = r.width
      h = r.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const paintBand = () => {
      if (ctx && w > 0) drawBand(ctx, w, h, S.cur, S.prev, S.pos, S.ink)
    }
    readInk()
    size()
    paintBand()
    const ro = new ResizeObserver(() => {
      readInk()
      size()
      paintBand()
    })
    ro.observe(band)
    // Re-read the ink colour when the theme class flips.
    const mo = new MutationObserver(() => {
      readInk()
      paintBand()
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })

    let raf = 0
    let io: IntersectionObserver | undefined
    if (animated) {
      let last = 0
      let elapsed = 0
      let visible = true
      let frames = 0
      let timeAt = 0
      const loop = (ts: number) => {
        raf = 0
        if (!visible) {
          last = 0
          return
        }
        const dt = last ? Math.min(ts - last, 64) : 0
        last = ts
        elapsed += dt
        if (elapsed >= INTRO_MS) {
          S.pos += dt / WINDOW_MS
          if (S.pos >= 1) {
            S.pos -= 1
            S.sweep++
            S.prev = S.cur
            S.cur = makeSweep(S.sweep)
          }
          const i = Math.floor(S.pos * N)
          curPath.setAttribute("d", toPath(S.cur.a, 0, i))
          prevPath.setAttribute("d", S.prev ? toPath(S.prev.a, Math.ceil((S.pos + GAP) * N), N) : "")
          tick.style.left = `${S.pos * 100}%`
          dot.style.left = `${S.pos * 100}%`
          dot.style.top = `${(yOf(S.cur.a[i]) / H) * 100}%`
          dot.style.opacity = "1"
          if (++frames % 90 === 0) readInk()
          paintBand()
          if (ts - timeAt > 100) {
            timeAt = ts
            timeEl.textContent = `T+${(S.pos * 12).toFixed(1).padStart(4, "0")} S`
          }
        }
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        if (visible && !raf) {
          last = 0
          raf = requestAnimationFrame(loop)
        }
      })
      io.observe(frame)
    }
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      ro.disconnect()
      mo.disconnect()
    }
  }, [animated, first])

  const grid = (
    <g className="ihe-gridl">
      {[1, 2, 3, 4, 5].map((k) => (
        <path key={k} d={`M${(k * W) / 6} 0V${H}`} />
      ))}
      <path d={`M0 ${PAD}H${W}`} />
      <path d={`M0 ${H / 2}H${W}`} />
      <path data-base d={`M0 ${H - PAD}H${W}`} />
    </g>
  )

  const ticks: React.ReactNode[] = []
  for (let k = 0; k <= 24; k++) {
    const x = (k / 24) * W
    ticks.push(<path key={k} data-major={k % 4 === 0 ? "" : undefined} d={`M${x} 0V${k % 4 === 0 ? 8 : 4}`} />)
  }

  const headY = (yOf(first.a[headIdx]) / H) * 100

  return (
    <figure className="ihe-fig">
      <div className="ihe-frame" ref={frameRef} role="img" aria-label="Live trace of an agent run: activity over twelve seconds with a confidence band underneath">
        <Marks />
        <div className="ihe-fhead" aria-hidden>
          <span>{label}</span>
          <span>
            {animated && <i className="ihe-live" />}
            <b ref={timeRef}>{`T+${(HEAD0 * 12).toFixed(1).padStart(4, "0")} S`}</b>
          </span>
        </div>
        <div className="ihe-body" aria-hidden>
          <div className="ihe-row">
            <div className="ihe-ylab">
              <span style={{ top: `${(PAD / H) * 100}%` }}>1.0</span>
              <span style={{ top: "50%" }}>0.5</span>
              <span style={{ top: `${((H - PAD) / H) * 100}%` }}>0</span>
            </div>
            <div className="ihe-plot">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                {grid}
              </svg>
              {PHASES.map((p) => (
                <span key={p.name} className="ihe-phase" style={{ left: `${p.at * 100}%` }}>
                  {p.name}
                </span>
              ))}
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <path ref={prevRef} className="ihe-prev" d="" />
              </svg>
              <svg className="ihe-trace" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <path ref={curRef} className="ihe-cur" d={initialD} />
              </svg>
            </div>
          </div>
          <div className="ihe-row">
            <div className="ihe-gl">CONF</div>
            <div className="ihe-band" ref={bandRef}>
              <div className="ihe-bandclip">
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>
          <div className="ihe-row">
            <div className="ihe-gl" />
            <div className="ihe-ruler">
              <svg viewBox={`0 0 ${W} 8`} preserveAspectRatio="none">
                {ticks}
              </svg>
              {[0, 2, 4, 6, 8, 10, 12].map((s) => (
                <span key={s} style={{ left: `${(s / 12) * 100}%` }}>
                  {s}
                  {s === 12 ? " s" : ""}
                </span>
              ))}
            </div>
          </div>
          <div className="ihe-nowwrap">
            <span className="ihe-now" ref={tickRef} style={{ left: `${HEAD0 * 100}%` }} />
            <span
              className="ihe-dot"
              ref={dotRef}
              style={{ left: `${HEAD0 * 100}%`, top: `${headY}%`, opacity: animated ? 0 : 1 }}
            />
          </div>
        </div>
        <div className="ihe-leg" aria-hidden>
          <span>
            <i /> Tool activity
          </span>
          <span>
            <i data-dither /> Confidence
          </span>
        </div>
      </div>
      <figcaption className="ihe-cap">{caption}</figcaption>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Readout row                               */
/* -------------------------------------------------------------------------- */

function Stat({ stat, index, active }: { stat: InstrumentHeroStat; index: number; active: boolean }) {
  const numeric = typeof stat.value === "number"
  const v = useSettle(numeric ? (stat.value as number) : 0, active && numeric, 120 + index * 90, 1300)
  const d = stat.decimals ?? 0
  return (
    <div className="ihe-stat" style={{ "--i": index } as React.CSSProperties}>
      <dt>{stat.label}</dt>
      <dd>
        {numeric ? `${stat.prefix ?? ""}${fmt(v, d)}` : `${stat.prefix ?? ""}${stat.value}`}
        {stat.unit && <small>{stat.unit}</small>}
      </dd>
    </div>
  )
}

function Readout({ stats }: { stats: InstrumentHeroStat[] }) {
  const ref = React.useRef<HTMLDListElement>(null)
  const seen = useSeen(ref)
  return (
    <dl className="ihe-stats" ref={ref} style={{ "--cols": stats.length } as React.CSSProperties}>
      {stats.map((s, i) => (
        <Stat key={s.label} stat={s} index={i} active={seen} />
      ))}
    </dl>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Hero                                    */
/* -------------------------------------------------------------------------- */

const DEFAULT_TITLE: React.ReactNode[] = ["See what your agent", <><em>actually</em> did.</>]

const DEFAULT_ACTIONS: InstrumentHeroAction[] = [
  { label: "Start tracing", href: "#start" },
  { label: "Read the docs", href: "#docs" },
]

const DEFAULT_STATS: InstrumentHeroStat[] = [
  { label: "Runs traced daily", value: 2.4, decimals: 1, unit: "M" },
  { label: "Median ingest lag", value: 38, unit: "ms" },
  { label: "Regressions caught", value: 94.7, decimals: 1, unit: "%" },
  { label: "Time to first trace", value: 6, unit: "min" },
]

/** Editorial landing-page hero in the Instrument style: serif headline that scans in, a live trace specimen, a settling readout row. */
export function InstrumentHero({
  kicker = "AGENT OBSERVABILITY · V2.4",
  title = DEFAULT_TITLE,
  subtitle = "Meridian records every plan, tool call and token of an agent run, scores the answer against its evidence, and points at the step that drifted. Ship agents you can read.",
  actions = DEFAULT_ACTIONS,
  stats = DEFAULT_STATS,
  figure,
  caption = (
    <>
      <b>FIG. 1</b> — Run 0412, tool activity and answer confidence
    </>
  ),
  figureLabel = "RUN 0412 · SUPPORT AGENT",
  live = true,
  className,
}: InstrumentHeroProps) {
  const lines = Array.isArray(title) ? title : [title]
  return (
    <section className={cn("ihe", className)}>
      <style href="instrument-hero" precedence="default">
        {CSS}
      </style>
      <div className="ihe-in">
        <div className="ihe-top">
          <div className="ihe-copy" style={{ "--n": lines.length } as React.CSSProperties}>
            {kicker && <p className="ihe-kicker">{kicker}</p>}
            <h1 className="ihe-title">
              {lines.map((line, i) => (
                <React.Fragment key={i}>
                  <span className="ihe-line" style={{ "--i": i } as React.CSSProperties}>
                    {line}
                  </span>{" "}
                </React.Fragment>
              ))}
            </h1>
            {subtitle && <p className="ihe-sub">{subtitle}</p>}
            {actions.length > 0 && (
              <div className="ihe-actions">
                {actions.map((a, i) => {
                  const variant = a.variant ?? (i === 0 ? "primary" : "secondary")
                  const content = (
                    <>
                      {a.label}
                      {(a.arrow ?? variant === "primary") && <ArrowRight size={14} strokeWidth={1.5} aria-hidden />}
                    </>
                  )
                  return a.href ? (
                    <a key={a.label} className="ihe-btn" data-variant={variant} href={a.href} onClick={a.onClick}>
                      {content}
                    </a>
                  ) : (
                    <button key={a.label} type="button" className="ihe-btn" data-variant={variant} onClick={a.onClick}>
                      {content}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="ihe-figcell">{figure ?? <Specimen caption={caption} label={figureLabel} live={live} />}</div>
        </div>
        {stats.length > 0 && <Readout stats={stats} />}
      </div>
    </section>
  )
}

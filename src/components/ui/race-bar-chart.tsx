"use client"

import * as React from "react"
import { Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RaceItem = {
  /** Stable id. It keeps each bar's identity across frames. */
  id: string
  label: string
  group?: string
}
export type RaceFrame = {
  period: string
  /** Missing ids count as zero. */
  values: Record<string, number>
}
export type RaceGroup = { id: string; label: string }

export type RaceBarChartProps = {
  /** The things being ranked. */
  items: RaceItem[]
  /** One frame per period, in order. */
  frames: RaceFrame[]
  /** What is ranked. Names the chart for assistive technology. */
  label: string
  title?: string
  subtitle?: string
  /** Names and order of the groups. The first four take the series hues and a legend appears; without groups every bar takes the first hue. */
  groups?: RaceGroup[]
  /** Formats values on bars, in the tooltip and in the table. Defaults to a compact number. */
  formatValue?: (value: number) => string
  /** Formats the value axis. */
  formatTick?: (value: number) => string
  /** Bars shown at once. Items below the cut slide out of view. */
  bars?: number
  /** Controlled frame index. A new value glides the race there. */
  frame?: number
  defaultFrame?: number
  /** Called when the shown period changes. */
  onFrameChange?: (index: number) => void
  /** Controlled playback. */
  playing?: boolean
  defaultPlaying?: boolean
  /** Called when playback starts or stops. */
  onPlayingChange?: (playing: boolean) => void
  /** Starts playing the first time the chart scrolls into view. Ignored with reduced motion. */
  autoPlay?: boolean
  /** Milliseconds per period while playing. */
  frameDuration?: number
  /** Rewinds to the first period after the last and keeps playing. */
  loop?: boolean
  /** Item id whose name and value are emphasised, such as your own product. */
  highlight?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rbc {
  --rbc-ink: #000;
  --rbc-surface: #fff;
  --rbc-accent: #0060e2;
  --rbc-g0: oklch(.83 .06 255); --rbc-d0: oklch(.6 .15 255);
  --rbc-g1: oklch(.78 .09 305); --rbc-d1: oklch(.55 .17 305);
  --rbc-g2: oklch(.89 .075 75); --rbc-d2: oklch(.7 .15 70);
  --rbc-g3: oklch(.83 .08 185); --rbc-d3: oklch(.6 .11 185);
  --rbc-t1: color-mix(in oklab, var(--rbc-ink) 88%, transparent);
  --rbc-t2: color-mix(in oklab, var(--rbc-ink) 61%, transparent);
  --rbc-t3: color-mix(in oklab, var(--rbc-ink) 45%, transparent);
  --rbc-t4: color-mix(in oklab, var(--rbc-ink) 27%, transparent);
  --rbc-fill: color-mix(in oklab, var(--rbc-ink) 6%, transparent);
  --rbc-line: color-mix(in oklab, var(--rbc-ink) 6%, transparent);
  --rbc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --rbc-tip: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 24px -6px rgb(0 0 0 / .18), 0 2px 6px rgb(0 0 0 / .06);
  --rbc-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0;
  padding: 18px 20px 14px;
  border-radius: 16px;
  background: var(--rbc-surface);
  box-shadow: var(--rbc-shadow);
  color: var(--rbc-t1);
  font-family: var(--rbc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .rbc {
  --rbc-ink: #fff;
  --rbc-surface: #1c1c1e;
  --rbc-accent: #4d8dff;
  --rbc-knob: oklch(.94 0 0);
  --rbc-g0: oklch(.5 .1 255); --rbc-d0: oklch(.74 .13 255);
  --rbc-g1: oklch(.48 .13 305); --rbc-d1: oklch(.72 .15 305);
  --rbc-g2: oklch(.56 .11 70); --rbc-d2: oklch(.8 .14 72);
  --rbc-g3: oklch(.5 .09 185); --rbc-d3: oklch(.76 .11 185);
  --rbc-t1: color-mix(in oklab, var(--rbc-ink) 90%, transparent);
  --rbc-t2: color-mix(in oklab, var(--rbc-ink) 62%, transparent);
  --rbc-t3: color-mix(in oklab, var(--rbc-ink) 46%, transparent);
  --rbc-t4: color-mix(in oklab, var(--rbc-ink) 28%, transparent);
  --rbc-fill: color-mix(in oklab, var(--rbc-ink) 8%, transparent);
  --rbc-line: color-mix(in oklab, var(--rbc-ink) 8%, transparent);
  --rbc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --rbc-tip: 0 0 0 .5px rgb(255 255 255 / .12), 0 8px 24px -6px rgb(0 0 0 / .6);
}
:where(.rbc) *, :where(.rbc) *::before, :where(.rbc) *::after { box-sizing: border-box }
:where(.rbc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.rbc :focus-visible { outline: 2px solid color-mix(in oklab, var(--rbc-accent) 60%, transparent); outline-offset: 1px }

.rbc-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--rbc-t1) }
.rbc-sub { margin: 0; font-size: 12px; line-height: 16px; color: var(--rbc-t3) }

.rbc-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 14px 0 6px; min-height: 42px }
.rbc-period { position: relative; display: block; font-size: 36px; line-height: 42px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--rbc-t1); white-space: nowrap }
.rbc-period span { display: block; animation: rbc-roll .38s var(--rbc-ease) backwards }
.rbc-total { margin: 0; font-size: 14px; line-height: 20px; color: var(--rbc-t3); font-variant-numeric: tabular-nums; white-space: nowrap }

.rbc-plot { position: relative; width: 100%; border-radius: 8px; outline-offset: 4px; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; touch-action: pan-y }
.rbc-tick { position: absolute; left: 0; top: 24px; bottom: 0; width: 1px; background: var(--rbc-line); opacity: 0; pointer-events: none; will-change: transform }
.rbc-tl { position: absolute; left: 50%; top: -22px; transform: translateX(-50%); font-size: 12px; line-height: 16px; color: var(--rbc-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.rbc-base { position: absolute; top: 22px; bottom: 0; width: 1px; background: color-mix(in oklab, var(--rbc-ink) 14%, transparent); pointer-events: none }
.rbc-rows { position: absolute; left: 0; right: 0; top: 24px; bottom: 0 }
.rbc-row { position: absolute; left: 0; top: 0; width: 100%; height: 36px; will-change: transform; cursor: default }
.rbc-name { position: absolute; left: 0; top: 0; height: 36px; padding-right: 12px; display: flex; align-items: center; justify-content: flex-end; font-size: 14px; line-height: 20px; color: var(--rbc-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .2s }
.rbc-bar { position: absolute; left: 0; top: 6px; height: 24px; width: 0; border-radius: 0 4px 4px 0; background: var(--c); box-shadow: inset -2px 0 0 var(--cd); transition: filter .2s }
.rbc-val { position: absolute; left: 0; top: 0; height: 36px; display: flex; align-items: center; font-size: 14px; line-height: 20px; font-variant-numeric: tabular-nums; color: var(--rbc-t1); white-space: nowrap }
.rbc-row[data-hl] .rbc-name, .rbc-row[data-hl] .rbc-val { font-weight: 500; color: var(--rbc-t1) }
.rbc-row[data-read] .rbc-bar { filter: brightness(.94) saturate(1.15); box-shadow: inset -2px 0 0 var(--cd), 0 0 0 1.5px color-mix(in oklab, var(--rbc-ink) 40%, transparent) }
.rbc[data-compact] .rbc-name { z-index: 1; left: 8px; width: auto; padding: 0; justify-content: flex-start; color: var(--rbc-t1); font-size: 13px; text-overflow: clip; overflow: visible; pointer-events: none }

.rbc-tip {
  position: absolute; left: 0; top: 0; z-index: 5; width: max-content; min-width: 140px; padding: 8px 10px; border-radius: 12px;
  background: var(--rbc-surface); box-shadow: var(--rbc-tip); pointer-events: none; opacity: 0; transition: opacity .14s; font-size: 12px; line-height: 16px;
}
.rbc-tip[data-on] { opacity: 1 }
.rbc-tip-n { margin: 0; font-size: 13px; line-height: 18px; font-weight: 500; color: var(--rbc-t1) }
.rbc-tip-g { margin: 0 0 4px; color: var(--rbc-t3); font-size: 11px; line-height: 14px }
.rbc-tip-r { display: flex; justify-content: space-between; gap: 16px; color: var(--rbc-t2) }
.rbc-tip-r b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--rbc-t1) }

.rbc-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 10px 0 0; padding: 0; list-style: none; font-size: 12px; line-height: 17px; color: var(--rbc-t2) }
.rbc-legend li { display: flex; align-items: center; gap: 6px }
.rbc-legend i { width: 10px; height: 10px; border-radius: 3px; background: var(--c) }

.rbc-ctl { display: flex; align-items: flex-start; gap: 12px; margin-top: 8px }
.rbc-play { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--rbc-surface); box-shadow: var(--rbc-shadow); color: var(--rbc-t1); transition: transform .15s var(--rbc-ease), box-shadow .15s }
.rbc-play:hover { box-shadow: 0 0 0 .5px color-mix(in oklab, var(--rbc-ink) 14%, transparent), 0 1px 3px rgb(0 0 0 / .1) }
.rbc-play:active { transform: scale(.94) }
.rbc-tl-wrap { position: relative; flex: 1; min-width: 0 }
.rbc-slider { position: relative; height: 36px; margin: 0 8px; cursor: pointer; touch-action: none; outline-offset: 2px; border-radius: 8px }
.rbc-rail { position: absolute; left: 0; right: 0; top: 17px; height: 2px; border-radius: 1px; background: var(--rbc-line); background: color-mix(in oklab, var(--rbc-ink) 12%, transparent) }
.rbc-done { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 1px; background: var(--rbc-t1) }
.rbc-dots { position: absolute; left: 0; right: 0; top: 16px; height: 4px; pointer-events: none }
.rbc-dots i { position: absolute; top: 0; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--rbc-surface); box-shadow: 0 0 0 1px color-mix(in oklab, var(--rbc-ink) 18%, transparent) }
.rbc-knob { position: absolute; left: 0; top: 10px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: var(--rbc-knob, #fff); box-shadow: 0 0 0 .5px rgb(0 0 0 / .14), 0 1px 3px rgb(0 0 0 / .18), 0 0 0 1px color-mix(in oklab, var(--rbc-ink) 6%, transparent); transition: scale .15s var(--rbc-ease) }
.rbc-slider:active .rbc-knob, .rbc-slider[data-drag] .rbc-knob { scale: 1.12 }
.rbc-ends { display: flex; justify-content: space-between; margin: -4px 0 0; font-size: 12px; line-height: 16px; color: var(--rbc-t3) }
.rbc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@keyframes rbc-roll { from { opacity: 0; transform: translateY(10px); filter: blur(4px) } }
@media (max-width: 420px) {
  .rbc { padding: 14px 12px 10px }
  .rbc-period { font-size: 30px; line-height: 36px }
}
@media (prefers-reduced-motion: reduce) {
  .rbc *, .rbc *::before, .rbc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Maths                                   */
/* -------------------------------------------------------------------------- */

const ROW = 36
const AXIS = 24
const VAL_ROOM = 64
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const nfCompact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
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

type Sim = {
  req: number
  clock: number
  vel: number
  dom: number
  started: boolean
  last: number
  shown: number
  rows: Map<string, { y: number; vy: number; a: number; intro: number; start: number; v: number }>
  order: string[]
  ticks: Map<number, { el: HTMLElement; a: number }>
  firstTs: number
}

const POOL = 20

/* -------------------------------------------------------------------------- */
/*                                RaceBarChart                                */
/* -------------------------------------------------------------------------- */

export function RaceBarChart({
  items,
  frames,
  label,
  title,
  subtitle,
  groups,
  formatValue,
  formatTick,
  bars = 8,
  frame: frameProp,
  defaultFrame = 0,
  onFrameChange,
  playing: playingProp,
  defaultPlaying = false,
  onPlayingChange,
  autoPlay = true,
  frameDuration = 1400,
  loop = false,
  highlight,
  className,
}: RaceBarChartProps) {
  const reduced = usePrefersReducedMotion()
  const fmt = React.useCallback((v: number) => (formatValue ? formatValue(v) : nfCompact.format(v)), [formatValue])
  const fmtTick = React.useCallback((v: number) => (formatTick ? formatTick(v) : formatValue ? formatValue(v) : nfCompact.format(v)), [formatTick, formatValue])
  const N = frames.length
  const shownBars = Math.max(1, Math.min(bars, items.length))

  /* ------------------------------ Data lookup ------------------------------ */
  const vals = React.useMemo(() => items.map((it) => Float64Array.from(frames, (f) => Math.max(0, f.values[it.id] ?? 0))), [items, frames])
  const groupIndex = React.useMemo(() => {
    const m = new Map<string, number>()
    groups?.forEach((g, i) => m.set(g.id, i))
    return m
  }, [groups])
  const colorOf = (it: RaceItem) => (groups && it.group !== undefined ? Math.min(3, groupIndex.get(it.group) ?? 0) : 0)

  /* -------------------------------- State ---------------------------------- */
  const [playingInner, setPlayingInner] = React.useState(defaultPlaying)
  const playing = playingProp ?? playingInner
  const [shown, setShown] = React.useState(clamp(frameProp ?? defaultFrame, 0, Math.max(0, N - 1)))
  const [readId, setReadId] = React.useState<string | null>(null)
  const [drag, setDrag] = React.useState(false)
  const [width, setWidth] = React.useState(0)
  const compact = width > 0 && width < 400

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const plotRef = React.useRef<HTMLDivElement>(null)
  const sliderRef = React.useRef<HTMLDivElement>(null)
  const knobRef = React.useRef<HTMLSpanElement>(null)
  const doneRef = React.useRef<HTMLSpanElement>(null)
  const totalRef = React.useRef<HTMLSpanElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const baseRef = React.useRef<HTMLDivElement>(null)
  const poolRef = React.useRef<(HTMLDivElement | null)[]>([])
  const rowEls = React.useRef(new Map<string, HTMLDivElement>())
  const nameW = React.useRef(new Map<string, number>())
  const raf = React.useRef(0)
  const onScreen = React.useRef(true)
  const sim = React.useRef<Sim>({ req: clamp(frameProp ?? defaultFrame, 0, Math.max(0, N - 1)), clock: clamp(frameProp ?? defaultFrame, 0, Math.max(0, N - 1)), vel: 0, dom: 1, started: false, last: 0, shown: -1, rows: new Map(), order: [], ticks: new Map(), firstTs: 0 })
  const autoStarted = React.useRef(false)
  const autoPlayRef = React.useRef(autoPlay)
  const tipValRef = React.useRef<HTMLElement>(null)
  const tipRankRef = React.useRef<HTMLElement>(null)
  const live = React.useRef({ items, frames, vals, shownBars, fmt, fmtTick, width, compact, playing, reduced, loop, frameDuration, readId, N })
  const cb = React.useRef({ onFrameChange, setPlaying: (_p: boolean) => {}, setShown })
  const frameRef = React.useRef<(ts: number) => void>(() => {})

  const setPlaying = React.useCallback(
    (p: boolean) => {
      setPlayingInner(p)
      onPlayingChange?.(p)
    },
    [onPlayingChange],
  )

  const wake = React.useCallback(() => {
    if (raf.current || !onScreen.current) return
    raf.current = requestAnimationFrame((ts) => frameRef.current(ts))
  }, [])

  React.useLayoutEffect(() => {
    live.current = { items, frames, vals, shownBars, fmt, fmtTick, width, compact, playing, reduced, loop, frameDuration, readId, N }
    cb.current = { onFrameChange, setPlaying, setShown }
    autoPlayRef.current = autoPlay
    nameW.current.clear()
    wake()
  })

  // A new controlled frame glides the race there (ignored when it is just our own report echoed back).
  const lastReported = React.useRef(sim.current.shown)
  React.useLayoutEffect(() => {
    if (frameProp === undefined) return
    if (frameProp !== lastReported.current) {
      sim.current.req = clamp(frameProp, 0, Math.max(0, N - 1))
      wake()
    }
  }, [frameProp, N, wake])

  /* -------------------------------- Layout --------------------------------- */
  React.useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(0, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const gutter = compact ? 0 : clamp(Math.round(width * 0.22), 84, 140)

  /* ------------------------------- Frame loop ------------------------------ */
  React.useLayoutEffect(() => {
    frameRef.current = (ts: number) => {
      raf.current = 0
      const L = live.current
      const S = sim.current
      const dt = S.last ? clamp(ts - S.last, 0, 40) / 1000 : 1 / 60
      S.last = ts
      if (!S.firstTs) S.firstTs = ts
      const W = L.width
      if (!W || !L.N) return
      const lastIdx = L.N - 1

      /* --- time: requested time advances while playing, the drawn clock follows it on a critically damped spring --- */
      let busy = false
      if (L.playing && onScreen.current && !drag) {
        S.req += (dt * 1000) / L.frameDuration
        busy = true
        if (S.req >= lastIdx) {
          S.req = lastIdx
          if (L.loop) {
            S.req = 0
            S.clock = 0
            S.vel = 0
          } else cb.current.setPlaying(false)
        }
      }
      if (L.reduced) {
        S.clock = S.req
        S.vel = 0
      } else {
        const w = 9
        const steps = Math.max(1, Math.ceil(dt / 0.008))
        const h = dt / steps
        for (let s = 0; s < steps; s++) {
          S.vel += (w * w * (S.req - S.clock) - 2 * w * S.vel) * h
          S.clock += S.vel * h
        }
        if (Math.abs(S.req - S.clock) > 0.0008 || Math.abs(S.vel) > 0.004) busy = true
        else {
          S.clock = S.req
          S.vel = 0
        }
      }
      const t = clamp(S.clock, 0, lastIdx)
      const i0 = Math.min(lastIdx, Math.floor(t))
      const i1 = Math.min(lastIdx, i0 + 1)
      const f = t - i0

      /* --- values, ranks and the axis scale --- */
      const n = L.items.length
      const cur = new Float64Array(n)
      let total = 0
      for (let k = 0; k < n; k++) {
        const a = L.vals[k]![i0]!
        const b = L.vals[k]![i1]!
        cur[k] = a + (b - a) * f
        total += cur[k]!
      }
      const idx = Array.from({ length: n }, (_, k) => k).sort((a, b) => cur[b]! - cur[a]! || a - b)
      const rank = new Int32Array(n)
      idx.forEach((k, r) => (rank[k] = r))
      let maxVis = 1e-9
      for (let r = 0; r < Math.min(L.shownBars, n); r++) maxVis = Math.max(maxVis, cur[idx[r]!]!)
      const domTarget = maxVis * 1.04
      if (!S.started || L.reduced) S.dom = domTarget
      else {
        S.dom += (domTarget - S.dom) * (1 - Math.exp(-dt / 0.28))
        if (Math.abs(domTarget - S.dom) / domTarget > 0.002) busy = true
      }
      const plotW = Math.max(40, W - gutter - VAL_ROOM)

      /* --- rows: each rides its own spring to its rank --- */
      L.items.forEach((it, k) => {
        const el = rowEls.current.get(it.id)
        if (!el) return
        let r = S.rows.get(it.id)
        const slot = rank[k]! < L.shownBars ? rank[k]! : L.shownBars + 0.7
        if (!r) {
          r = { y: slot * ROW + (L.reduced ? 0 : 18), vy: 0, a: 0, intro: 0, start: S.firstTs + k * 40, v: 0 }
          S.rows.set(it.id, r)
        }
        const goalA = rank[k]! < L.shownBars ? 1 : 0
        if (L.reduced) {
          r.y = slot * ROW
          r.vy = 0
          r.a = goalA
          r.intro = 1
        } else {
          const w = 13
          const steps = Math.max(1, Math.ceil(dt / 0.008))
          const h = dt / steps
          for (let s = 0; s < steps; s++) {
            r.vy += (w * w * (slot * ROW - r.y) - 2 * w * r.vy) * h
            r.y += r.vy * h
          }
          r.a += (goalA - r.a) * (1 - Math.exp(-dt / 0.13))
          if (ts >= r.start) r.intro = Math.min(1, r.intro + dt / 0.7)
          if (Math.abs(slot * ROW - r.y) > 0.05 || Math.abs(r.vy) > 0.5 || Math.abs(goalA - r.a) > 0.01 || r.intro < 1) busy = true
        }
        const intro = 1 - (1 - r.intro) ** 3
        const a = r.a * intro
        el.style.transform = `translate3d(0, ${r.y.toFixed(2)}px, 0)`
        el.style.opacity = a >= 0.995 ? "" : a.toFixed(3)
        el.style.visibility = a < 0.01 ? "hidden" : ""
        const barW = Math.max(0, (cur[k]! / S.dom) * plotW * intro)
        const bar = el.children[1] as HTMLElement
        const val = el.children[2] as HTMLElement
        const nm = el.children[0] as HTMLElement
        bar.style.width = `${barW.toFixed(2)}px`
        bar.style.left = `${gutter}px`
        let vx = gutter + barW + 8
        if (L.compact) {
          let nw = nameW.current.get(it.id)
          if (nw === undefined) {
            nw = nm.scrollWidth
            if (nw > 0) nameW.current.set(it.id, nw)
          }
          vx = Math.max(vx, 8 + (nw ?? 80) + 10)
        }
        val.style.transform = `translateX(${vx.toFixed(2)}px)`
        const txt = L.fmt(cur[k]!)
        if (val.textContent !== txt) val.textContent = txt
        r.v = cur[k]!
      })
      S.order = idx.map((k) => L.items[k]!.id)

      /* --- axis: ticks glide with the scale and cross-fade when the step changes --- */
      const step = niceStep(S.dom / clamp(Math.floor(plotW / 78), 2, 6))
      const want = new Set<number>()
      for (let v = step; v <= S.dom * 1.0001; v += step) want.add(+v.toFixed(8))
      const pool = poolRef.current
      for (const v of want) {
        if (!S.ticks.has(v)) {
          const free = pool.find((el) => el && ![...S.ticks.values()].some((x) => x.el === el))
          if (free) {
            ;(free.firstElementChild as HTMLElement).textContent = L.fmtTick(v)
            S.ticks.set(v, { el: free, a: L.reduced ? 1 : 0 })
          }
        }
      }
      for (const [v, tk] of S.ticks) {
        const goal = want.has(v) ? 1 : 0
        tk.a = L.reduced ? goal : tk.a + (goal - tk.a) * (1 - Math.exp(-dt / 0.12))
        if (Math.abs(goal - tk.a) > 0.01) busy = true
        const x = gutter + (v / S.dom) * plotW
        tk.el.style.transform = `translateX(${x.toFixed(2)}px)`
        tk.el.style.opacity = tk.a.toFixed(3)
        if (goal === 0 && tk.a < 0.01) {
          tk.el.style.opacity = "0"
          S.ticks.delete(v)
        }
      }
      if (baseRef.current) baseRef.current.style.transform = `translateX(${gutter}px)`

      /* --- total, timeline --- */
      if (totalRef.current) {
        const tt = `Total ${L.fmt(total)}`
        if (totalRef.current.textContent !== tt) totalRef.current.textContent = tt
      }
      const frac = lastIdx > 0 ? t / lastIdx : 0
      const slider = sliderRef.current
      if (slider && knobRef.current && doneRef.current) {
        const sw = slider.clientWidth
        knobRef.current.style.transform = `translateX(${(frac * sw).toFixed(2)}px)`
        doneRef.current.style.width = `${(frac * sw).toFixed(2)}px`
      }

      /* --- tooltip follows the row being read --- */
      const tip = tipRef.current
      if (tip && L.readId) {
        const r = S.rows.get(L.readId)
        const k = L.items.findIndex((x) => x.id === L.readId)
        if (r && k >= 0) {
          const barEnd = gutter + Math.max(0, (cur[k]! / S.dom) * plotW)
          const tw = tip.offsetWidth
          const th = tip.offsetHeight
          const x = clamp(barEnd + 18, 0, Math.max(0, W - tw))
          const below = r.y + ROW + th + 8 > L.shownBars * ROW + 8
          const y = AXIS + (below ? r.y - th - 2 : r.y + ROW - 2)
          tip.style.transform = `translate(${x}px, ${Math.max(0, y)}px)`
          if (tipValRef.current) tipValRef.current.textContent = L.fmt(cur[k]!)
          if (tipRankRef.current) tipRankRef.current.textContent = `#${rank[k]! + 1}`
        }
      }

      /* --- period index, reported only when it changes --- */
      const si = Math.round(t)
      if (si !== S.shown) {
        S.shown = si
        lastReported.current = si
        cb.current.setShown(si)
        cb.current.onFrameChange?.(si)
      }
      S.started = true
      if (busy && onScreen.current) raf.current = requestAnimationFrame((tt) => frameRef.current(tt))
    }
    wake()
  })

  React.useLayoutEffect(() => {
    const el = plotRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = !!e?.isIntersecting
        if (onScreen.current) {
          sim.current.last = 0
          if (!autoStarted.current && e!.intersectionRatio >= 0.35) {
            autoStarted.current = true
            if (live.current.reduced === false && live.current.N > 1) {
              // Starts the first time it scrolls into view. Only a chart still at its first period autoplays.
              if (autoPlayRef.current && sim.current.req === 0) cb.current.setPlaying(true)
            }
          }
          wake()
        }
      },
      { threshold: [0, 0.35] },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf.current)
      raf.current = 0 // reset so the loop restarts after StrictMode's dev double-mount
      autoStarted.current = false
    }
  }, [wake])

  /* ------------------------------ Interactions ----------------------------- */
  const togglePlay = () => {
    const S = sim.current
    if (!playing) {
      if (S.req >= N - 1 - 1e-6) S.req = 0 // replay from the start: the clock sweeps back through every period
      setPlaying(true)
    } else setPlaying(false)
    wake()
  }
  const step = (d: number) => {
    const S = sim.current
    if (playing) setPlaying(false)
    S.req = clamp(Math.round(S.req) + d, 0, N - 1)
    wake()
  }
  const goTo = (i: number) => {
    const S = sim.current
    if (playing) setPlaying(false)
    S.req = clamp(i, 0, N - 1)
    wake()
  }
  const fracFrom = (clientX: number) => {
    const r = sliderRef.current?.getBoundingClientRect()
    return r && r.width > 0 ? clamp((clientX - r.left) / r.width, 0, 1) : 0
  }
  const rankStep = (d: number) => {
    const order = sim.current.order
    if (!order.length) return
    const shownIds = order.slice(0, shownBars)
    const at = readId ? shownIds.indexOf(readId) : -1
    const next = at < 0 ? (d > 0 ? 0 : shownIds.length - 1) : clamp(at + d, 0, shownIds.length - 1)
    setReadId(shownIds[next]!)
    wake()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case " ":
      case "Enter":
        togglePlay()
        break
      case "ArrowLeft":
        step(-1)
        break
      case "ArrowRight":
        step(1)
        break
      case "ArrowUp":
        rankStep(-1)
        break
      case "ArrowDown":
        rankStep(1)
        break
      case "Home":
        goTo(0)
        break
      case "End":
        goTo(N - 1)
        break
      case "Escape":
        setReadId(null)
        break
      default:
        return
    }
    e.preventDefault()
  }

  /* -------------------------------- Output --------------------------------- */
  const rankOf = (id: string) => {
    const i = sim.current.order.indexOf(id)
    return i < 0 ? 0 : i + 1
  }
  const readItem = readId ? items.find((x) => x.id === readId) : undefined
  const readVal = readItem ? (sim.current.rows.get(readItem.id)?.v ?? 0) : 0
  const frameData = frames[clamp(shown, 0, Math.max(0, N - 1))]
  const leader = React.useMemo(() => {
    if (!frameData) return null
    let best: RaceItem | null = null
    let bv = -1
    for (const it of items) {
      const v = frameData.values[it.id] ?? 0
      if (v > bv) {
        bv = v
        best = it
      }
    }
    return best ? { item: best, v: bv } : null
  }, [frameData, items])
  const groupLabel = (it: RaceItem) => groups?.find((g) => g.id === it.group)?.label
  const plotH = AXIS + shownBars * ROW

  return (
    <figure className={cn("rbc", className)} aria-label={label} data-compact={compact ? "" : undefined}>
      <style href="race-bar-chart" precedence="default">
        {CSS}
      </style>
      {(title || subtitle) && (
        <div>
          {title && <p className="rbc-title">{title}</p>}
          {subtitle && <p className="rbc-sub">{subtitle}</p>}
        </div>
      )}
      <div className="rbc-head">
        <span className="rbc-period">
          <span key={shown}>{frameData?.period ?? ""}</span>
        </span>
        <p className="rbc-total" aria-hidden="true">
          <span ref={totalRef} />
        </p>
      </div>

      <div ref={wrapRef}>
        <div
          ref={plotRef}
          className="rbc-plot"
          style={{ height: plotH }}
          role="group"
          tabIndex={0}
          aria-roledescription="bar chart race"
          aria-label={`${label}, ${frameData?.period ?? ""}`}
          aria-describedby="rbc-keys"
          onKeyDown={onKeyDown}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse") return
            const id = (e.target as HTMLElement).closest<HTMLElement>("[data-rid]")?.dataset.rid ?? null
            if (id !== readId) setReadId(id)
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setReadId(null)
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse") return
            const id = (e.target as HTMLElement).closest<HTMLElement>("[data-rid]")?.dataset.rid ?? null
            setReadId(id === readId ? null : id)
          }}
          onBlur={() => setReadId(null)}
        >
          {Array.from({ length: POOL }, (_, i) => (
            <div key={i} className="rbc-tick" ref={(el) => void (poolRef.current[i] = el)} aria-hidden="true">
              <span className="rbc-tl" />
            </div>
          ))}
          <div ref={baseRef} className="rbc-base" aria-hidden="true" />
          <div className="rbc-rows">
            {items.map((it) => {
              const c = colorOf(it)
              return (
                <div
                  key={it.id}
                  ref={(el) => {
                    if (el) rowEls.current.set(it.id, el)
                    else rowEls.current.delete(it.id)
                  }}
                  className="rbc-row"
                  data-rid={it.id}
                  data-hl={highlight === it.id ? "" : undefined}
                  data-read={readId === it.id ? "" : undefined}
                  style={{ visibility: "hidden", "--c": `var(--rbc-g${c})`, "--cd": `var(--rbc-d${c})` } as React.CSSProperties}
                >
                  <span className="rbc-name" style={{ width: compact ? undefined : gutter }}>
                    {it.label}
                  </span>
                  <span className="rbc-bar" />
                  <span className="rbc-val" />
                </div>
              )
            })}
          </div>
          <div ref={tipRef} className="rbc-tip" data-on={readItem ? "" : undefined} aria-hidden="true">
            {readItem && (
              <>
                <p className="rbc-tip-n">{readItem.label}</p>
                {groupLabel(readItem) && <p className="rbc-tip-g">{groupLabel(readItem)}</p>}
                <div className="rbc-tip-r">
                  <span>{frameData?.period}</span>
                  <b ref={tipValRef}>{fmt(readVal)}</b>
                </div>
                <div className="rbc-tip-r">
                  <span>Rank</span>
                  <b ref={tipRankRef}>{`#${rankOf(readItem.id)}`}</b>
                </div>
              </>
            )}
          </div>
        </div>

        {groups && groups.length > 0 && (
          <ul className="rbc-legend" aria-label="Groups">
            {groups.slice(0, 4).map((g, i) => (
              <li key={g.id}>
                <i style={{ "--c": `var(--rbc-g${i})` } as React.CSSProperties} />
                {g.label}
              </li>
            ))}
          </ul>
        )}

        <div className="rbc-ctl">
          <button type="button" className="rbc-play" aria-label={playing ? "Pause" : "Play"} aria-pressed={playing} onClick={togglePlay}>
            {playing ? <Pause size={16} fill="currentColor" strokeWidth={0} aria-hidden /> : <Play size={16} fill="currentColor" strokeWidth={0} aria-hidden />}
          </button>
          <div className="rbc-tl-wrap">
            <div
              ref={sliderRef}
              className="rbc-slider"
              role="slider"
              tabIndex={0}
              aria-label="Timeline"
              aria-valuemin={0}
              aria-valuemax={Math.max(0, N - 1)}
              aria-valuenow={clamp(shown, 0, Math.max(0, N - 1))}
              aria-valuetext={frameData?.period}
              data-drag={drag ? "" : undefined}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0
                if (d) step(d)
                else if (e.key === "Home") goTo(0)
                else if (e.key === "End") goTo(N - 1)
                else return
                e.preventDefault()
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                setDrag(true)
                if (playing) setPlaying(false)
                sim.current.req = fracFrom(e.clientX) * (N - 1)
                wake()
              }}
              onPointerMove={(e) => {
                if (!drag) return
                sim.current.req = fracFrom(e.clientX) * (N - 1)
                wake()
              }}
              onPointerUp={(e) => {
                if (!drag) return
                setDrag(false)
                sim.current.req = Math.round(fracFrom(e.clientX) * (N - 1))
                wake()
              }}
              onPointerCancel={() => setDrag(false)}
            >
              <span className="rbc-rail">
                <span ref={doneRef} className="rbc-done" />
              </span>
              <span className="rbc-dots" aria-hidden="true">
                {N <= 40 && frames.map((f, i) => <i key={f.period + i} style={{ left: `${N > 1 ? (i / (N - 1)) * 100 : 0}%` }} />)}
              </span>
              <span ref={knobRef} className="rbc-knob" />
            </div>
            <p className="rbc-ends" aria-hidden="true">
              <span>{frames[0]?.period}</span>
              <span>{frames[N - 1]?.period}</span>
            </p>
          </div>
        </div>
      </div>

      <p id="rbc-keys" className="rbc-sr">
        Space plays or pauses, left and right arrows step through periods, up and down arrows read the bars by rank.
      </p>
      <p className="rbc-sr" role="status" aria-live="polite">
        {readItem ? `${readItem.label}, rank ${rankOf(readItem.id)}, ${fmt(readVal)}` : !playing && frameData && leader ? `${frameData.period}, ${leader.item.label} leads with ${fmt(leader.v)}` : ""}
      </p>
      <div className="rbc-sr">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th>Item</th>
              {frames.map((f, i) => (
                <th key={f.period + i}>{f.period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it, k) => (
              <tr key={it.id}>
                <th scope="row">{it.label}</th>
                {Array.from(vals[k]!, (v, i) => (
                  <td key={i}>{fmt(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

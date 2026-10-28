"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ScopeChannel = "tps" | "lat" | "cost"
export type ScopeTimeBase = 5 | 15 | 60
export type ScopeEventKind = "tool" | "retry" | "error"

export type ScopeSample = {
  /** Seconds on any monotonic clock. Samples must be sorted by `t`; 10 Hz or faster looks smooth. */
  t: number
  /** Tokens per second at this moment. */
  tps: number
  /** Time to first token in ms, held until the next request starts. */
  latency?: number
  /** Cumulative cost in USD. */
  cost?: number
}

export type ScopeEvent = {
  /** Same clock as the samples. */
  t: number
  kind: ScopeEventKind
  /** Tiny label at the top of the marker, e.g. the tool name. Defaults to the kind. */
  label?: string
}

export type ScopeSimOptions = {
  /** Seeds the pseudo-random stream so the demo looks the same every time. Default 7. */
  seed?: number
  /** Typical tokens per second. Default 96. */
  baseRate?: number
  /** Seconds between tool calls. Default 5.6. */
  toolEvery?: number
  /** Seconds between stalls. Default 12. */
  stallEvery?: number
}

export type TokenScopeProps = {
  /** External samples (e.g. from your stream). Leave it out to run the built-in simulation. */
  data?: ScopeSample[]
  /** External trigger events, drawn as vertical markers. */
  events?: ScopeEvent[]
  /** Run the built-in simulated stream. Default: true when `data` is omitted. Read once, on mount. */
  simulate?: boolean | ScopeSimOptions
  /** Seconds across the screen (controlled). */
  timeBase?: ScopeTimeBase
  defaultTimeBase?: ScopeTimeBase
  onTimeBaseChange?: (timeBase: ScopeTimeBase) => void
  /** Which traces are drawn (controlled). The first of LAT, COST that is on gets the right-hand axis. */
  channels?: ScopeChannel[]
  defaultChannels?: ScopeChannel[]
  onChannelsChange?: (channels: ScopeChannel[]) => void
  /** Hold the display (controlled). While held, a crosshair reads the values under the pointer. */
  paused?: boolean
  defaultPaused?: boolean
  onPausedChange?: (paused: boolean) => void
  title?: React.ReactNode
  /** Mono label above the title. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.its {
  --its-paper: #fafafa;
  --its-sheet: #ffffff;
  --its-ink: #0a0a0a;
  --its-signal: #0060e2;
  --its-accent: var(--its-signal);
  --its-surface: var(--its-sheet);
  --its-signal-soft: color-mix(in oklab, var(--its-accent) 12%, transparent);
  --its-t1: color-mix(in oklab, var(--its-ink) 92%, transparent);
  --its-t2: color-mix(in oklab, var(--its-ink) 64%, transparent);
  --its-t3: color-mix(in oklab, var(--its-ink) 44%, transparent);
  --its-t4: color-mix(in oklab, var(--its-ink) 22%, transparent);
  --its-rule: color-mix(in oklab, var(--its-ink) 14%, transparent);
  --its-rule-2: color-mix(in oklab, var(--its-ink) 7%, transparent);
  --its-ok: #1f8a4c; --its-warn: #b7791f; --its-bad: #c4321a;
  --its-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --its-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --its-font: var(--its-sans);
  --its-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --its-ease: cubic-bezier(.2, .8, .2, 1);
  --its-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative; width: 100%; max-width: 880px; padding: 12px; container: its / inline-size;
  font: 13px/20px var(--its-font); color: var(--its-t1); text-align: left; -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .its {
  --its-paper: #0c0c0d; --its-sheet: #1c1c1e; --its-ink: #f5f5f5; --its-signal: #4d8dff;
  --its-ok: #4cc27d; --its-warn: #e0a64a; --its-bad: #ff7a5c;
}
.its *, .its *::before, .its *::after { box-sizing: border-box }
:where(.its) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.its :focus-visible { outline: 2px solid color-mix(in oklab, var(--its-accent) 60%, transparent); outline-offset: 1px }
.its-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.its-card { position: relative; background: var(--its-surface); border-radius: 4px; box-shadow: 0 0 0 1px var(--its-rule) }
.its-crop { position: absolute; width: 8px; height: 8px; border: 0 solid var(--its-t4); pointer-events: none }
.its-crop[data-c="tl"] { top: -7px; left: -7px; border-top-width: 1px; border-left-width: 1px }
.its-crop[data-c="tr"] { top: -7px; right: -7px; border-top-width: 1px; border-right-width: 1px }
.its-crop[data-c="bl"] { bottom: -7px; left: -7px; border-bottom-width: 1px; border-left-width: 1px }
.its-crop[data-c="br"] { bottom: -7px; right: -7px; border-bottom-width: 1px; border-right-width: 1px }

.its-lab { font: 500 10.5px/16px var(--its-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--its-t3); white-space: nowrap }

.its-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 16px 20px 14px }
.its-title { margin: 2px 0 0; font: 400 30px/34px var(--its-serif); letter-spacing: -.01em; color: var(--its-ink) }
.its-title em { font-style: italic }
.its-status { display: inline-flex; align-items: center; gap: 8px; flex: none; padding-bottom: 4px }
.its-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--its-accent); transition: background-color .2s, box-shadow .2s }
.its-dot[data-held] { background: transparent; box-shadow: inset 0 0 0 1px var(--its-t3) }

/* The display */
.its-bezel { padding: 0 20px }
.its-screen {
  position: relative; height: 272px; overflow: hidden; border-radius: 2px; background: var(--its-paper);
  box-shadow: 0 0 0 1px var(--its-rule), inset 0 0 0 4px var(--its-paper), inset 0 0 0 5px var(--its-rule-2);
  animation: its-scan-in .7s var(--its-ease-trace) backwards;
}
.its-screen[data-held] { cursor: crosshair }
.its-screen canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
.its-screen::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--its-accent); opacity: 0; pointer-events: none; animation: its-scan .7s var(--its-ease-trace) backwards }

/* Controls */
.its-ctl { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px 28px; padding: 16px 20px 14px }
.its-grp { display: grid; gap: 5px }
.its-seg { display: inline-flex; border-radius: 2px; box-shadow: 0 0 0 1px var(--its-rule); overflow: hidden }
.its-seg button { height: 28px; min-width: 44px; padding: 0 10px; font: 500 11px/28px var(--its-mono); letter-spacing: .04em; color: var(--its-t2); transition: background-color .16s, color .16s }
.its-seg button + button { box-shadow: -1px 0 0 var(--its-rule) }
.its-seg button:hover { color: var(--its-ink) }
.its-seg button[aria-checked="true"] { background: var(--its-ink); color: var(--its-surface) }
.its-sw-row { display: flex; gap: 18px; height: 28px; align-items: center }
.its-sw { display: inline-flex; align-items: center; gap: 8px; height: 28px; font: 500 11px/28px var(--its-mono); letter-spacing: .06em; color: var(--its-t3); transition: color .16s }
.its-sw:hover, .its-sw[aria-checked="true"] { color: var(--its-ink) }
.its-sw-track { position: relative; width: 26px; height: 14px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--its-t4); transition: box-shadow .16s }
.its-sw-track::after { content: ""; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; border-radius: 1px; background: var(--its-t4); transition: transform .2s var(--its-ease), background-color .16s }
.its-sw[aria-checked="true"] .its-sw-track { box-shadow: inset 0 0 0 1px var(--its-ink) }
.its-sw[aria-checked="true"] .its-sw-track::after { transform: translateX(12px); background: var(--its-ink) }
.its-sw svg { width: 18px; height: 6px; overflow: visible }
.its-hold { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; height: 28px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--its-ink); font: 500 11px/28px var(--its-mono); letter-spacing: .08em; transition: box-shadow .16s, color .16s, background-color .16s }
.its-hold i { width: 6px; height: 6px; border-radius: 1px; background: var(--its-t4); transition: background-color .16s }
.its-hold:hover { box-shadow: 0 0 0 1px var(--its-accent) }
.its-hold[aria-pressed="true"] { box-shadow: 0 0 0 1px var(--its-accent); color: var(--its-accent) }
.its-hold[aria-pressed="true"] i { background: var(--its-accent) }

/* Readout row */
.its-readout { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; border-top: 1px solid var(--its-rule) }
.its-ro { min-width: 0; padding: 9px 20px 10px }
.its-ro + .its-ro { border-left: 1px solid var(--its-rule) }
.its-ro dt { font: 500 10px/14px var(--its-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--its-t3) }
.its-ro dd { margin: 0; font: 500 16px/22px var(--its-mono); color: var(--its-ink); font-variant-numeric: tabular-nums; white-space: nowrap }
.its-ro dd small { margin-left: 4px; font-size: 11px; color: var(--its-t3); font-weight: 400 }
.its-fig { padding: 8px 20px 14px; border-top: 1px solid var(--its-rule-2) }
.its-fig .its-lab { white-space: normal }

@container its (max-width: 560px) {
  .its-head { padding: 14px 16px 12px }
  .its-title { font-size: 26px; line-height: 30px }
  .its-bezel { padding: 0 16px }
  .its-screen { height: 216px }
  .its-ctl { padding: 14px 16px 12px; gap: 12px 20px }
  .its-sw-row { gap: 12px }
  .its-hold { margin-left: 0 }
  .its-readout { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .its-ro { padding: 8px 16px 9px }
  .its-ro:nth-child(odd) { border-left: 0 }
  .its-ro:nth-child(n + 3) { border-top: 1px solid var(--its-rule) }
  .its-fig { padding: 8px 16px 12px }
}
@container its (max-width: 400px) {
  .its-status .its-lab { display: none }
  .its-sw svg { display: none }
}

@keyframes its-scan-in { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes its-scan { from { left: 0; opacity: 1 } 88% { opacity: 1 } to { left: 100%; opacity: 0 } }

@media (prefers-reduced-motion: reduce) {
  .its *, .its *::before, .its *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const CHANNELS: { id: ScopeChannel; label: string; dash: number[] }[] = [
  { id: "tps", label: "TOK/S", dash: [] },
  { id: "lat", label: "LAT", dash: [4, 3] },
  { id: "cost", label: "COST", dash: [1.5, 3] },
]
const TIME_BASES: ScopeTimeBase[] = [5, 15, 60]
const TPS_STEPS = [20, 40, 80, 100, 120, 160, 200, 240, 320, 400, 600, 800, 1200, 1600, 2400, 4000]
const LAT_STEPS = [100, 200, 400, 800, 1200, 1600, 2400, 4000, 8000]
const STALL_TPS = 8
const STALL_SECS = 1.1
const RETAIN = 75
const SIM_DT = 0.05

const SAGE_TITLE = (
  <>
    Token <em>scope</em>
  </>
)

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function useReducedMotion() {
  return React.useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => false)
}

/** First index whose `t` is at least `t0`. Samples are sorted. */
function lowerBound(list: { t: number }[], t0: number) {
  let lo = 0
  let hi = list.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (list[mid].t < t0) lo = mid + 1
    else hi = mid
  }
  return lo
}

function niceCeil(v: number, steps: number[]) {
  for (const s of steps) if (s >= v) return s
  const last = steps[steps.length - 1]
  return Math.ceil(v / last) * last
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---- the built-in stream: steady generation, bursts, a stall, a tool call every few seconds ---- */

const TOOLS = ["search_web", "read_doc", "run_sql", "fetch_url", "write_file"]

function createSim(o: ScopeSimOptions) {
  const rnd = mulberry32(o.seed ?? 7)
  const base = o.baseRate ?? 96
  const toolEvery = o.toolEvery ?? 5.6
  const stallEvery = o.stallEvery ?? 12
  let t = 0
  let cost = 0
  let lat = 380
  let smooth = base
  let nextTool = 2.4
  let nextStall = 8
  let nextBurst = 4
  let waitUntil = -1
  let stallUntil = -1
  let burstUntil = -1
  let burstPeak = 170
  let toolCount = 0
  let wasWaiting = false
  return {
    get t() {
      return t
    },
    step(dt: number, samples: ScopeSample[], events: ScopeEvent[]) {
      t += dt
      if (t >= nextTool) {
        nextTool = t + toolEvery * (0.75 + rnd() * 0.5)
        const i = toolCount++
        const kind: ScopeEventKind = i % 11 === 9 ? "error" : i % 7 === 4 ? "retry" : "tool"
        events.push({ t, kind, label: kind === "error" ? "429" : kind === "retry" ? "retry 2/3" : TOOLS[i % TOOLS.length] })
        waitUntil = t + 0.45 + rnd() * 0.2 + (kind === "error" ? 0.5 : 0)
      }
      if (t >= nextStall) {
        nextStall = t + stallEvery * (0.85 + rnd() * 0.3)
        stallUntil = t + 1.4 + rnd() * 0.8
      }
      if (t >= nextBurst) {
        nextBurst = t + 6 + rnd() * 4
        burstUntil = t + 1.1 + rnd()
        burstPeak = 150 + rnd() * 45
      }
      const waiting = t < waitUntil || t < stallUntil
      if (wasWaiting && !waiting) lat = 300 + rnd() * 160 + (rnd() < 0.14 ? 280 : 0)
      wasWaiting = waiting
      let target = 0
      if (!waiting) {
        target = base + 20 * Math.sin(t * 0.8) + 12 * Math.sin(t * 2.1 + 1.3)
        if (t < burstUntil) target = burstPeak * (0.92 + 0.08 * Math.sin(t * 11))
      }
      smooth += (target - smooth) * (1 - Math.exp(-dt / 0.06))
      const tps = Math.max(0, smooth + (rnd() - 0.5) * (waiting ? 3 : 9))
      cost += tps * dt * 0.000006
      samples.push({ t, tps, latency: Math.round(lat), cost })
      while (samples.length && samples[0].t < t - RETAIN) samples.shift()
      while (events.length && events[0].t < t - RETAIN) events.shift()
    },
  }
}

type Sim = ReturnType<typeof createSim>

type Engine = {
  sim: Sim | null
  samples: ScopeSample[]
  events: ScopeEvent[]
  /** Time carried between fixed simulation steps. */
  acc: number
  /** Head of the held display (external data only). */
  frozen: number | null
  seenT: number
  arrival: number
  /** Smoothed axis ranges so the grid glides when the scale changes. */
  yMax: number
  latMax: number
  costLo: number
  costHi: number
}

function makeEngine(simulate: boolean | ScopeSimOptions): Engine {
  const e: Engine = { sim: null, samples: [], events: [], acc: 0, frozen: null, seenT: -1, arrival: 0, yMax: 0, latMax: 0, costLo: 0, costHi: 0 }
  if (simulate) {
    const sim = createSim(simulate === true ? {} : simulate)
    for (let i = 0; i < 60 / SIM_DT; i++) sim.step(SIM_DT, e.samples, e.events)
    e.sim = sim
  }
  return e
}

/** What the display shows right now: the sample list, the events and the time at its right edge. */
function viewOf(e: Engine, data: ScopeSample[] | undefined, events: ScopeEvent[] | undefined, now: number) {
  if (data) {
    const last = data[data.length - 1]
    if (last && last.t !== e.seenT) {
      e.seenT = last.t
      e.arrival = now
    }
    const head = last ? last.t + Math.min(0.25, Math.max(0, (now - e.arrival) / 1000)) : 0
    return { samples: data, events: events ?? [], head }
  }
  return { samples: e.samples, events: e.events, head: (e.sim?.t ?? 0) + e.acc }
}

type Stats = { peak: number; avg: number; stalls: number; p95: number | null }

function windowStats(samples: ScopeSample[], head: number, base: number): Stats {
  const lo = lowerBound(samples, head - base)
  let peak = 0
  let sum = 0
  let n = 0
  let stalls = 0
  let runStart: number | null = null
  let counted = false
  const lats: number[] = []
  let lastLat = NaN
  for (let i = lo; i < samples.length && samples[i].t <= head; i++) {
    const s = samples[i]
    peak = Math.max(peak, s.tps)
    sum += s.tps
    n++
    if (s.tps < STALL_TPS) {
      if (runStart === null) runStart = s.t
      if (!counted && s.t - runStart >= STALL_SECS) {
        stalls++
        counted = true
      }
    } else {
      runStart = null
      counted = false
    }
    if (s.latency !== undefined && s.latency !== lastLat) {
      lats.push(s.latency)
      lastLat = s.latency
    }
  }
  lats.sort((a, b) => a - b)
  return { peak: Math.round(peak), avg: n ? Math.round(sum / n) : 0, stalls, p95: lats.length ? lats[Math.max(0, Math.ceil(lats.length * 0.95) - 1)] : null }
}

/* ---- canvas colour handling: any CSS colour the page uses is normalised through the 2d context ---- */

type Rgb = [number, number, number]
type Palette = { ink: Rgb; signal: Rgb; warn: Rgb; bad: Rgb; paper: Rgb; mono: string }

function toRgb(ctx: CanvasRenderingContext2D, css: string, fallback: Rgb): Rgb {
  if (!css) return fallback
  ctx.fillStyle = "#000000"
  ctx.fillStyle = css
  const v = String(ctx.fillStyle)
  if (v[0] === "#" && v.length >= 7) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]
  const m = v.match(/[\d.]+/g)
  return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : fallback
}

function readPalette(el: HTMLElement, ctx: CanvasRenderingContext2D): Palette {
  const cs = getComputedStyle(el)
  const get = (n: string) => cs.getPropertyValue(n).trim()
  return {
    ink: toRgb(ctx, get("--its-ink"), [20, 20, 19]),
    signal: toRgb(ctx, get("--its-accent"), [255, 77, 0]),
    warn: toRgb(ctx, get("--its-warn"), [183, 121, 31]),
    bad: toRgb(ctx, get("--its-bad"), [196, 50, 26]),
    paper: toRgb(ctx, get("--its-paper"), [244, 242, 236]),
    mono: get("--its-mono") || "ui-monospace, monospace",
  }
}

const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

const fmtInt = (n: number) => String(Math.round(n))
const fmtCost = (n: number) => `$${n.toFixed(n < 0.1 ? 3 : 2)}`

/* -------------------------------------------------------------------------- */
/*                         Number that settles to its value                   */
/* -------------------------------------------------------------------------- */

/** Counts to its target and makes one tiny overshoot-and-return (about 1%). */
function Settle({ value, format }: { value: number | null; format: (n: number) => string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = React.useState(value ?? 0)
  const shownRef = React.useRef(shown)
  React.useEffect(() => {
    if (value === null || reduced) return
    const from = shownRef.current
    if (from === value) return
    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const x = Math.min(1, (now - start) / 480)
      const s = 0.22
      const e = x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2)
      const v = from + (value - from) * e
      shownRef.current = v
      setShown(v)
      if (x < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  if (value === null) return <>—</>
  return <>{format(reduced ? value : shown)}</>
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

/**
 * An oscilloscope for a model stream: tokens per second as a trace that ages toward faint ink, an optional dashed latency or
 * cost trace on a right-hand axis, trigger markers for tool calls, retries and errors, and a readout row that settles live.
 * Hold the display to read exact values with a crosshair (arrow keys move it too).
 */
export function TokenScope({
  data,
  events: eventsProp,
  simulate,
  timeBase: timeBaseProp,
  defaultTimeBase = 15,
  onTimeBaseChange,
  channels: channelsProp,
  defaultChannels = ["tps", "lat"],
  onChannelsChange,
  paused: pausedProp,
  defaultPaused,
  onPausedChange,
  title = SAGE_TITLE,
  label = "SCOPE 01 · NOVA STREAM",
  className,
}: TokenScopeProps) {
  const [innerBase, setInnerBase] = React.useState<ScopeTimeBase>(defaultTimeBase)
  const timeBase = timeBaseProp ?? innerBase
  const [innerChannels, setInnerChannels] = React.useState<ScopeChannel[]>(defaultChannels)
  const channels = channelsProp ?? innerChannels
  const [innerPaused, setInnerPaused] = React.useState(() => defaultPaused ?? prefersReducedMotion())
  const paused = pausedProp ?? innerPaused

  const [initial] = React.useState(() => {
    const e = makeEngine(simulate ?? data === undefined)
    const v = viewOf(e, data, eventsProp, 0)
    return { engine: e, stats: windowStats(v.samples, v.head, defaultTimeBase) }
  })
  const engineRef = React.useRef(initial.engine)
  const [stats, setStats] = React.useState<Stats>(initial.stats)

  const live = React.useRef({ timeBase, channels, paused, data, events: eventsProp })
  React.useEffect(() => {
    live.current = { timeBase, channels, paused, data, events: eventsProp }
  })

  const rootRef = React.useRef<HTMLDivElement>(null)
  const screenRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const cursorRef = React.useRef<{ x: number; y: number; inside: boolean }>({ x: 0, y: 0, inside: false })
  const dirtyRef = React.useRef(true)

  /* The loop: advance the stream, draw the screen, refresh the readouts. Runs only while visible. */
  React.useEffect(() => {
    const el = rootRef.current
    const canvas = canvasRef.current
    const screen = screenRef.current
    const ctx = canvas?.getContext("2d")
    const engine = engineRef.current
    if (!el || !canvas || !screen || !ctx || !engine) return

    let raf = 0
    let last = 0
    let width = 0
    let height = 0
    let dpr = 1
    let palette = readPalette(el, ctx)
    let paletteAge = 0
    let sig = ""
    let statsAt = 0
    let running = false

    const resize = () => {
      const r = screen.getBoundingClientRect()
      width = Math.max(1, Math.round(r.width))
      height = Math.max(1, Math.round(r.height))
      dpr = Math.min(3, window.devicePixelRatio || 1)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      dirtyRef.current = true
    }

    const draw = (now: number) => {
      const p = live.current
      const v = viewOf(engine, p.data, p.events, now)
      let head = v.head
      if (p.paused) {
        if (engine.frozen === null) engine.frozen = head
        head = engine.frozen
      } else engine.frozen = null
      const { samples, events } = v
      const base = p.timeBase
      const on = (c: ScopeChannel) => p.channels.includes(c)
      const side: ScopeChannel | null = on("lat") ? "lat" : on("cost") ? "cost" : null
      const narrow = width < 420
      const padL = narrow ? 38 : 46
      const padR = side ? (narrow ? 44 : 54) : 14
      const padT = 26
      const padB = 22
      const plotW = Math.max(10, width - padL - padR)
      const plotH = Math.max(10, height - padT - padB)
      const t0 = head - base
      const x = (t: number) => padL + ((t - t0) / base) * plotW
      const ink = palette.ink
      const font = (px: number, w = 500) => `${w} ${px}px ${palette.mono}`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.lineJoin = "round"
      ctx.lineCap = "round"

      /* window data */
      const i0 = Math.max(0, lowerBound(samples, t0) - 1)
      let maxTps = 1
      let maxLat = 1
      let costLo = Infinity
      let costHi = -Infinity
      for (let i = i0; i < samples.length && samples[i].t <= head; i++) {
        const s = samples[i]
        if (s.tps > maxTps) maxTps = s.tps
        if (s.latency !== undefined && s.latency > maxLat) maxLat = s.latency
        if (s.cost !== undefined) {
          costLo = Math.min(costLo, s.cost)
          costHi = Math.max(costHi, s.cost)
        }
      }
      if (!isFinite(costLo)) {
        costLo = 0
        costHi = 0.001
      }
      if (costHi - costLo < 0.0005) costHi = costLo + 0.0005
      const tpsTarget = niceCeil(maxTps * 1.1, TPS_STEPS)
      const latTarget = niceCeil(maxLat * 1.15, LAT_STEPS)
      const k = engine.yMax === 0 || p.paused ? 1 : 0.14
      engine.yMax += (tpsTarget - engine.yMax) * k
      engine.latMax = engine.latMax ? engine.latMax + (latTarget - engine.latMax) * k : latTarget
      engine.costLo = engine.costHi === 0 ? costLo : engine.costLo + (costLo - engine.costLo) * k
      engine.costHi = engine.costHi === 0 ? costHi : engine.costHi + (costHi - engine.costHi) * k
      const yTps = (v2: number) => padT + plotH * (1 - clamp(v2 / engine.yMax, 0, 1.02))
      const yLat = (v2: number) => padT + plotH * (1 - clamp(v2 / engine.latMax, 0, 1.02))
      const yCost = (v2: number) => padT + plotH * (1 - clamp((v2 - engine.costLo) / (engine.costHi - engine.costLo), 0, 1.02))

      /* registration grid: stationary, so the labels stay readable while the trace scrolls */
      const nDiv = base === 60 ? 6 : 5
      const hDiv = 4
      ctx.lineWidth = 1
      ctx.strokeStyle = rgba(ink, 0.075)
      ctx.beginPath()
      for (let i = 1; i < nDiv; i++) {
        const gx = Math.round(padL + (plotW * i) / nDiv) + 0.5
        ctx.moveTo(gx, padT)
        ctx.lineTo(gx, padT + plotH)
      }
      for (let j = 1; j < hDiv; j++) {
        const gy = Math.round(padT + (plotH * j) / hDiv) + 0.5
        ctx.moveTo(padL, gy)
        ctx.lineTo(padL + plotW, gy)
      }
      ctx.stroke()
      ctx.strokeStyle = rgba(ink, 0.22)
      ctx.strokeRect(padL + 0.5, padT + 0.5, plotW, plotH)
      ctx.beginPath()
      for (let i = 1; i < nDiv; i++) {
        for (let j = 1; j < hDiv; j++) {
          const gx = Math.round(padL + (plotW * i) / nDiv) + 0.5
          const gy = Math.round(padT + (plotH * j) / hDiv) + 0.5
          ctx.moveTo(gx - 3, gy)
          ctx.lineTo(gx + 3, gy)
          ctx.moveTo(gx, gy - 3)
          ctx.lineTo(gx, gy + 3)
        }
      }
      /* minor ticks on the frame */
      for (let i = 0; i <= nDiv * 5; i++) {
        if (i % 5 === 0) continue
        const gx = Math.round(padL + (plotW * i) / (nDiv * 5)) + 0.5
        ctx.moveTo(gx, padT + plotH)
        ctx.lineTo(gx, padT + plotH - 3)
      }
      for (let j = 0; j <= hDiv * 5; j++) {
        if (j % 5 === 0) continue
        const gy = Math.round(padT + (plotH * j) / (hDiv * 5)) + 0.5
        ctx.moveTo(padL, gy)
        ctx.lineTo(padL + 3, gy)
        ctx.moveTo(padL + plotW, gy)
        ctx.lineTo(padL + plotW - 3, gy)
      }
      ctx.stroke()

      /* axis labels */
      ctx.fillStyle = rgba(ink, 0.44)
      ctx.font = font(9.5, 400)
      ctx.textBaseline = "middle"
      ctx.textAlign = "right"
      if (on("tps")) {
        for (let j = 0; j <= hDiv; j++) ctx.fillText(fmtInt(engine.yMax * (1 - j / hDiv)), padL - 8, padT + (plotH * j) / hDiv)
      }
      if (side) {
        ctx.textAlign = "left"
        for (let j = 0; j <= hDiv; j++) {
          const f = 1 - j / hDiv
          const txt = side === "lat" ? fmtInt(engine.latMax * f) : fmtCost(engine.costLo + (engine.costHi - engine.costLo) * f)
          ctx.fillText(txt, padL + plotW + 8, padT + (plotH * j) / hDiv)
        }
      }
      ctx.textBaseline = "alphabetic"
      ctx.font = font(9, 500)
      ctx.textAlign = "right"
      if (on("tps")) ctx.fillText("TOK/S", padL - 6, padT - 9)
      if (side) {
        ctx.textAlign = "left"
        ctx.fillText(side === "lat" ? "TTFT MS" : "COST USD", padL + plotW + 6, padT - 9)
      }
      ctx.textBaseline = "top"
      for (let i = 0; i <= nDiv; i++) {
        const secs = (base * (nDiv - i)) / nDiv
        const txt = i === nDiv ? "NOW" : `−${Number.isInteger(secs) ? secs : secs.toFixed(1)}s`
        ctx.textAlign = i === 0 ? "left" : i === nDiv ? "right" : "center"
        ctx.fillText(txt, padL + (plotW * i) / nDiv + (i === 0 ? -2 : i === nDiv ? 2 : 0), padT + plotH + 8)
      }

      /* trigger markers: clipped poles with a tiny label on top */
      ctx.save()
      ctx.beginPath()
      ctx.rect(padL, padT - 16, plotW, plotH + 16)
      ctx.clip()
      let labelRight = -Infinity
      ctx.font = font(8.5, 500)
      ctx.textBaseline = "alphabetic"
      for (let i = lowerBound(events, t0 - 0.5); i < events.length && events[i].t <= head; i++) {
        const ev = events[i]
        const ex = Math.round(x(ev.t)) + 0.5
        const age = clamp((ex - padL) / plotW, 0, 1)
        const col = ev.kind === "error" ? palette.bad : ev.kind === "retry" ? palette.warn : ink
        const a = (ev.kind === "tool" ? 0.2 : 0.4) + age * (ev.kind === "tool" ? 0.5 : 0.5)
        ctx.strokeStyle = rgba(col, a)
        ctx.lineWidth = ev.kind === "error" ? 1.5 : 1
        ctx.setLineDash(ev.kind === "retry" ? [3, 2] : [])
        ctx.beginPath()
        ctx.moveTo(ex, padT - 15)
        ctx.lineTo(ex, padT + plotH)
        ctx.stroke()
        ctx.setLineDash([])
        const txt = (ev.label ?? ev.kind).toUpperCase()
        const tw = ctx.measureText(txt).width
        const flip = ex + 4 + tw > padL + plotW
        const left = flip ? ex - 4 - tw : ex + 4
        if (left > labelRight + 6) {
          ctx.fillStyle = rgba(col, 0.35 + age * 0.55)
          ctx.textAlign = "left"
          ctx.fillText(txt, left, padT - 7)
          labelRight = left + tw
        }
      }
      ctx.lineWidth = 1

      /* traces: one stroke each, with an age gradient from t4 ink at the left to t1 ink at the head */
      const trace = (ch: ScopeChannel, yOf: (s: ScopeSample) => number | null, width2: number, k2: number) => {
        if (!on(ch)) return null
        const g = ctx.createLinearGradient(padL, 0, padL + plotW, 0)
        g.addColorStop(0, rgba(ink, 0.2 * k2))
        g.addColorStop(0.55, rgba(ink, 0.5 * k2))
        g.addColorStop(1, rgba(ink, 0.92 * k2))
        ctx.strokeStyle = g
        ctx.lineWidth = width2
        ctx.setLineDash(CHANNELS.find((c) => c.id === ch)?.dash ?? [])
        ctx.beginPath()
        let started = false
        let lastY = 0
        for (let i = i0; i < samples.length && samples[i].t <= head; i++) {
          const yy = yOf(samples[i])
          if (yy === null) continue
          const xx = x(samples[i].t)
          if (!started) {
            ctx.moveTo(xx, yy)
            started = true
          } else ctx.lineTo(xx, yy)
          lastY = yy
        }
        if (started) ctx.lineTo(x(head), lastY)
        ctx.stroke()
        ctx.setLineDash([])
        return started ? lastY : null
      }
      const yEndTps = trace("tps", (s) => yTps(s.tps), 1.5, 1)
      const yEndLat = trace("lat", (s) => (s.latency === undefined ? null : yLat(s.latency)), 1.25, 0.8)
      const yEndCost = trace("cost", (s) => (s.cost === undefined ? null : yCost(s.cost)), 1.25, 0.8)
      ctx.restore()

      /* the head: one signal dot, with the one pulse while the display is live */
      const hx = x(head)
      const hy = yEndTps ?? yEndLat ?? yEndCost
      if (hy !== null && hx >= padL && hx <= padL + plotW + 1) {
        if (!p.paused) {
          const ph = (now % 1600) / 1600
          ctx.strokeStyle = rgba(palette.signal, 0.6 * (1 - ph))
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(hx, hy, 3 + 7 * (1 - Math.pow(1 - ph, 3)), 0, Math.PI * 2)
          ctx.stroke()
          ctx.fillStyle = rgba(palette.signal, 1)
          ctx.beginPath()
          ctx.arc(hx, hy, 2.8, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.strokeStyle = rgba(ink, 0.6)
          ctx.beginPath()
          ctx.arc(hx, hy, 2.8, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      /* a cost trace without an axis names itself at its head */
      if (yEndCost !== null && side === "lat" && samples.length) {
        const c = samples[samples.length - 1].cost
        if (c !== undefined) {
          ctx.fillStyle = rgba(ink, 0.6)
          ctx.font = font(9, 500)
          ctx.textAlign = "right"
          ctx.textBaseline = "alphabetic"
          ctx.fillText(`COST ${fmtCost(c)}`, hx - 8, clamp(yEndCost - 7, padT + 10, padT + plotH - 4))
        }
      }

      /* held: a crosshair that reads the values under the pointer */
      const cur = cursorRef.current
      if (p.paused && cur.inside) {
        const cx = clamp(cur.x, padL, padL + plotW)
        const cy = clamp(cur.y, padT, padT + plotH)
        const tc = t0 + ((cx - padL) / plotW) * base
        let near = clamp(lowerBound(samples, tc), 0, samples.length - 1)
        if (near > 0 && Math.abs(samples[near - 1].t - tc) < Math.abs(samples[near].t - tc)) near--
        const s = samples[near]
        ctx.strokeStyle = rgba(ink, 0.5)
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(Math.round(cx) + 0.5, padT)
        ctx.lineTo(Math.round(cx) + 0.5, padT + plotH)
        ctx.moveTo(padL, Math.round(cy) + 0.5)
        ctx.lineTo(padL + plotW, Math.round(cy) + 0.5)
        ctx.stroke()
        ctx.setLineDash([])
        if (s) {
          const lines: string[] = [`T−${Math.max(0, head - tc).toFixed(2)}s`]
          const dots: [number, boolean][] = []
          if (on("tps")) {
            lines.push(`TOK/S  ${fmtInt(s.tps)}`)
            dots.push([yTps(s.tps), true])
          }
          if (on("lat") && s.latency !== undefined) {
            lines.push(`LAT    ${fmtInt(s.latency)} ms`)
            dots.push([yLat(s.latency), false])
          }
          if (on("cost") && s.cost !== undefined) {
            lines.push(`COST   ${fmtCost(s.cost)}`)
            dots.push([yCost(s.cost), false])
          }
          for (const [dy, filled] of dots) {
            ctx.beginPath()
            ctx.arc(cx, dy, 3, 0, Math.PI * 2)
            ctx.fillStyle = filled ? rgba(ink, 1) : rgba(palette.paper, 1)
            ctx.strokeStyle = rgba(ink, 1)
            if (filled) ctx.fill()
            else {
              ctx.fill()
              ctx.stroke()
            }
          }
          ctx.font = font(10, 500)
          const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14
          const bh = lines.length * 14 + 8
          let bx = cx + 12
          if (bx + bw > padL + plotW) bx = cx - 12 - bw
          let by = cy + 12
          if (by + bh > padT + plotH) by = cy - 12 - bh
          by = Math.max(padT + 2, by)
          ctx.fillStyle = rgba(palette.paper, 0.94)
          ctx.fillRect(bx, by, bw, bh)
          ctx.strokeStyle = rgba(ink, 0.22)
          ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1)
          ctx.textAlign = "left"
          ctx.textBaseline = "middle"
          lines.forEach((l, i) => {
            ctx.fillStyle = rgba(ink, i === 0 ? 0.5 : 0.92)
            ctx.fillText(l, bx + 7, by + 4 + 7 + i * 14)
          })
        }
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const p = live.current
      if (engine.sim && !p.paused && !p.data) {
        engine.acc += dt
        while (engine.acc >= SIM_DT) {
          engine.sim.step(SIM_DT, engine.samples, engine.events)
          engine.acc -= SIM_DT
        }
      }
      if (now - paletteAge > 1000) {
        palette = readPalette(el, ctx)
        paletteAge = now
      }
      const c = cursorRef.current
      const nextSig = `${p.timeBase}|${p.channels.join(",")}|${p.paused}|${width}|${height}|${c.inside ? `${c.x | 0},${c.y | 0}` : ""}`
      if (nextSig !== sig) {
        sig = nextSig
        dirtyRef.current = true
      }
      if (!p.paused || dirtyRef.current) {
        draw(now)
        dirtyRef.current = false
      }
      if (now - statsAt > 250) {
        statsAt = now
        const v = viewOf(engine, p.data, p.events, now)
        const next = windowStats(v.samples, p.paused && engine.frozen !== null ? engine.frozen : v.head, p.timeBase)
        setStats((prev) => (prev.peak === next.peak && prev.avg === next.avg && prev.stalls === next.stalls && prev.p95 === next.p95 ? prev : next))
      }
    }

    const start = () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    let visible = true
    const sync = () => (visible && !document.hidden ? start() : stop())
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      sync()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", sync)
    const ro = new ResizeObserver(() => {
      resize()
      draw(performance.now())
    })
    ro.observe(screen)
    resize()
    /* paint the settled frame at once, not on the first tick */
    draw(performance.now())
    void document.fonts?.ready.then(() => {
      dirtyRef.current = true
    })
    start()
    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", sync)
    }
  }, [])

  /* controls */
  const setBase = (b: ScopeTimeBase) => {
    if (timeBaseProp === undefined) setInnerBase(b)
    onTimeBaseChange?.(b)
  }
  const toggleChannel = (id: ScopeChannel) => {
    const next = CHANNELS.map((c) => c.id).filter((c) => (c === id ? !channels.includes(c) : channels.includes(c)))
    if (channelsProp === undefined) setInnerChannels(next)
    onChannelsChange?.(next)
  }
  const setPaused = (next: boolean) => {
    if (pausedProp === undefined) setInnerPaused(next)
    onPausedChange?.(next)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    cursorRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true }
  }
  const onPointerLeave = () => {
    cursorRef.current = { ...cursorRef.current, inside: false }
    dirtyRef.current = true
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!paused || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return
    e.preventDefault()
    const w = screenRef.current?.getBoundingClientRect().width ?? 600
    const c = cursorRef.current
    cursorRef.current = { x: (c.inside ? c.x : w / 2) + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 40 : 8), y: c.inside ? c.y : 120, inside: true }
  }

  return (
    <div ref={rootRef} className={cn("its", className)}>
      <style href="token-scope" precedence="default">
        {CSS}
      </style>
      <div className="its-card">
        <i className="its-crop" data-c="tl" aria-hidden />
        <i className="its-crop" data-c="tr" aria-hidden />
        <i className="its-crop" data-c="bl" aria-hidden />
        <i className="its-crop" data-c="br" aria-hidden />

        <header className="its-head">
          <div>
            <div className="its-lab">{label}</div>
            {title ? <h3 className="its-title">{title}</h3> : null}
          </div>
          <div className="its-status">
            <span className="its-lab">{paused ? "HOLD" : "LIVE"}</span>
            <span className="its-dot" data-held={paused ? "" : undefined} aria-hidden />
          </div>
        </header>

        <div className="its-bezel">
          <div
            ref={screenRef}
            className="its-screen"
            data-held={paused ? "" : undefined}
            role="group"
            aria-roledescription="oscilloscope display"
            aria-label={`Token throughput, last ${timeBase} seconds. Peak ${stats.peak} tokens per second, average ${stats.avg}, ${stats.stalls} stalls${stats.p95 !== null ? `, p95 time to first token ${stats.p95} milliseconds` : ""}.`}
            tabIndex={paused ? 0 : -1}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onKeyDown={onKeyDown}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="its-ctl">
          <div className="its-grp">
            <span className="its-lab" id="its-tb">
              Time base
            </span>
            <div className="its-seg" role="radiogroup" aria-labelledby="its-tb">
              {TIME_BASES.map((b) => (
                <button key={b} type="button" role="radio" aria-checked={timeBase === b} onClick={() => setBase(b)}>
                  {b}s
                </button>
              ))}
            </div>
          </div>
          <div className="its-grp">
            <span className="its-lab">Channels</span>
            <div className="its-sw-row" role="group" aria-label="Channels">
              {CHANNELS.map((c) => (
                <button key={c.id} type="button" role="switch" aria-checked={channels.includes(c.id)} className="its-sw" onClick={() => toggleChannel(c.id)}>
                  <span className="its-sw-track" aria-hidden />
                  {c.label}
                  <svg viewBox="0 0 18 6" aria-hidden>
                    <line x1="0" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray={c.dash.join(" ") || undefined} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="its-hold" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            <i aria-hidden />
            HOLD
          </button>
        </div>

        <dl className="its-readout" aria-label="Readout">
          <div className="its-ro">
            <dt>Peak</dt>
            <dd>
              <Settle value={stats.peak} format={fmtInt} />
              <small>tok/s</small>
            </dd>
          </div>
          <div className="its-ro">
            <dt>Avg</dt>
            <dd>
              <Settle value={stats.avg} format={fmtInt} />
              <small>tok/s</small>
            </dd>
          </div>
          <div className="its-ro">
            <dt>Stalls</dt>
            <dd>
              <Settle value={stats.stalls} format={fmtInt} />
            </dd>
          </div>
          <div className="its-ro">
            <dt>P95 TTFT</dt>
            <dd>
              <Settle value={stats.p95} format={fmtInt} />
              {stats.p95 !== null ? <small>ms</small> : null}
            </dd>
          </div>
        </dl>

        <footer className="its-fig">
          <span className="its-lab">FIG. 4 — Tokens per second, last {timeBase} s; stalls are under {STALL_TPS} tok/s for {STALL_SECS.toFixed(1)} s</span>
        </footer>
        <div className="its-sr" aria-live="polite">
          {paused ? "Display held. Move the pointer over it, or use the arrow keys, to read values." : ""}
        </div>
      </div>
    </div>
  )
}

export default TokenScope

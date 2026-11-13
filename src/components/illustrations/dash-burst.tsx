"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { rng } from "@/studio/schema"
import type { StudioPieceProps } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DashBurstTone = "auto" | "paper" | "ink" | "clear"

export type DashBurstProps = StudioPieceProps & {
  /** One number per dash (tokens per minute, latency per region). Resampled to `count`. Default: a seeded rhythm. */
  data?: number[]
  /** What a full-length dash means, in the unit of `data`. Default: the largest value in `data`, or 4000. */
  max?: number
  /** Dashes around the ring (24–120). Default 60. */
  count?: number
  /** Hole in the middle, as a share of the ring's radius (0.3–0.62). Default 0.46. */
  inner?: number
  /** How much dash weight follows the value, 0 (all equal) to 1. Default 0.5. */
  taper?: number
  /** Index of the dash the burst starts from. Default: the largest value. */
  sector?: number
  /** Strength of the burst, 0 to 1.5. Default 1. */
  amplitude?: number
  /** Dash weight in a 400-unit drawing. Default 2.6. */
  width?: number
  /** Replaces the big number. Default: the live average of the dashes. */
  value?: string
  /** Line under the number. Default "tokens / min". */
  unit?: string
  /** Small line under that. Default "Last 60 minutes". */
  caption?: string
  /** Text for the active dash, shown under the number. */
  sectorLabel?: (index: number, count: number) => string
  /** Surface behind the piece. `auto` is transparent and follows the page theme. */
  tone?: DashBurstTone
  /** Called when a burst starts, from the demo, a tap or the keyboard. */
  onBurst?: (index: number) => void
  /** Accessible name of the whole figure. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                         Pure drawing model (shared)                         */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2
/** Seconds in one loop: the burst lands at BURST_AT and has settled well before the end. */
export const DASH_BURST_LOOP = 6
const BURST_AT = 1
const R_MAX = 198
/** Peak of the spring response, so `amplitude: 1` pushes the nearest dash by exactly one unit. */
const SPRING_NORM = 1 / 0.576

export type DashBurstConfig = {
  n: number
  inner: number
  taper: number
  rhythm: number
  amp: number
  /** Dash index to burst from, or null for the largest value. */
  sector: number | null
  seed: number
  width: number
  data?: number[]
  max?: number
}

export type DashBurstEvent = { t0: number; idx: number; amp: number }

export type DashBurstModel = ReturnType<typeof makeModel>

/** Turns a config into base values (0 to 1 per dash) and the geometry that never changes. */
export function makeModel(c: DashBurstConfig) {
  const n = c.n
  let v: number[] = []
  let max = c.max ?? 4000
  if (c.data && c.data.length > 1) {
    const peak = Math.max(...c.data.map((x) => Math.abs(x)), 1e-9)
    max = c.max ?? peak
    for (let i = 0; i < n; i++) {
      const p = (i / n) * c.data.length
      const a = Math.floor(p) % c.data.length
      const b = (a + 1) % c.data.length
      const f = p - Math.floor(p)
      v.push(Math.min(1, Math.max(0, (c.data[a] * (1 - f) + c.data[b] * f) / max)))
    }
  } else {
    const r = rng(Math.floor(c.seed) * 7 + 13)
    const ph = [r() * TAU, r() * TAU, r() * TAU, r() * TAU]
    const raw = Array.from({ length: n }, (_, i) => {
      const th = (i / n) * TAU
      return Math.sin(th + ph[0]) * 0.55 + Math.sin(2 * th + ph[1]) * 0.3 + Math.sin(5 * th + ph[2]) * 0.16 + Math.sin(9 * th + ph[3]) * 0.07 + (r() - 0.5) * c.rhythm * 1.1
    })
    const lo = Math.min(...raw)
    const hi = Math.max(...raw)
    v = raw.map((x) => 0.12 + 0.88 * ((x - lo) / (hi - lo || 1)))
  }
  const order = v.map((_, i) => i).sort((a, b) => v[b] - v[a])
  const r0 = c.inner * 200
  const S = R_MAX - r0
  const phase = Array.from({ length: n }, (_, i) => i * 0.83 + c.seed * 0.37)
  return { n, v, max, order, r0, S, phase, c }
}

/** Dash the demo bursts from at step k: the peak first, then other strong dashes. */
export function burstIndex(m: DashBurstModel, k: number) {
  if (k === 0 && m.c.sector !== null) return ((Math.round(m.c.sector) % m.n) + m.n) % m.n
  return m.order[(k * 5) % Math.min(8, m.n)]
}

/** One damped spring: it pushes out fast, undershoots a little and settles. */
const spring = (tau: number) => (tau <= 0 ? 0 : Math.exp(-2 * tau) * Math.sin(5 * tau) * SPRING_NORM)

export type DashFrame = {
  start: Float32Array
  end: Float32Array
  hot: Float32Array
  echoStart: Float32Array
  echoEnd: Float32Array
  echoOp: Float32Array
  width: Float32Array
  /** Current value of each dash, in the unit of `max`. */
  metric: Float32Array
  mean: number
}

/** Every dash for time t: base length, a slow breath, plus the burst events that are still ringing. */
export function frame(m: DashBurstModel, t: number, evs: DashBurstEvent[], active: number): DashFrame {
  const { n, v, r0, S, phase, c } = m
  const f: DashFrame = {
    start: new Float32Array(n), end: new Float32Array(n), hot: new Float32Array(n), echoStart: new Float32Array(n),
    echoEnd: new Float32Array(n), echoOp: new Float32Array(n), width: new Float32Array(n), metric: new Float32Array(n), mean: 0,
  }
  const k72 = 72 / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    let ex = 0
    for (const e of evs) {
      let d = Math.abs(i - e.idx)
      d = Math.min(d, n - d) * k72
      ex += e.amp * Math.exp(-((d / 9) ** 2)) * spring(t - e.t0 - d * 0.018)
    }
    ex *= c.amp * 0.38
    const breathe = 1 + 0.03 * Math.sin((TAU * 2 * t) / DASH_BURST_LOOP + phase[i])
    const len = S * (0.14 + 0.5 * v[i]) * breathe
    const start = r0 + ex * S * 0.18
    const end = Math.min(R_MAX, start + len + Math.max(ex, ex * 0.4) * S * 0.55)
    f.start[i] = start
    f.end[i] = end
    f.hot[i] = i === active ? 1 : Math.min(1, Math.max(0, ex * 2.6))
    const echo = Math.max(0, ex * S * 0.5 - 4)
    f.echoStart[i] = Math.min(R_MAX, end + 4)
    f.echoEnd[i] = Math.min(R_MAX + 1, end + 4 + echo)
    f.echoOp[i] = echo > 0 ? Math.min(0.8, ex * 2.2) : 0
    f.width[i] = c.width * (1 - c.taper * 0.5 + c.taper * 0.7 * v[i]) * (i === active ? 1.45 : 1)
    const cur = Math.max(0, ((end - start) / S - 0.14) / 0.5)
    f.metric[i] = cur * m.max
    sum += cur
  }
  f.mean = (sum / n) * m.max
  return f
}

const fmt = (x: number) => Math.round(x).toLocaleString("en-US")

/* ----- studio values -> config ----- */

const num = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) ? x : d)
const str = (x: unknown, d: string) => (typeof x === "string" ? x : d)

export function configFromValues(values: Record<string, unknown>, seed: number): DashBurstConfig {
  const fromPeak = values.fromPeak !== false
  const n = Math.round(Math.min(120, Math.max(24, num(values.count, 60))))
  return {
    n,
    inner: Math.min(0.62, Math.max(0.3, num(values.inner, 0.46))),
    taper: Math.min(1, Math.max(0, num(values.taper, 0.5))),
    rhythm: Math.min(1, Math.max(0, num(values.rhythm, 0.35))),
    amp: Math.min(1.5, Math.max(0, num(values.burst, 1))),
    sector: fromPeak ? null : ((num(values.sector, 0) % 360) / 360) * n,
    seed,
    width: Math.min(6, Math.max(1.2, num(values.width, 2.6))),
  }
}

/** The single burst a studio frame shows: at BURST_AT, from the peak or the chosen angle. */
export function studioEvents(m: DashBurstModel): DashBurstEvent[] {
  return [{ t0: BURST_AT, idx: burstIndex(m, 0), amp: 1 }]
}

const TONES = {
  paper: { bg: "#f4f3ef", ink: "#15151a", hair: "rgba(21,21,26,.14)", meta: "rgba(21,21,26,.5)" },
  ink: { bg: "#0d0d10", ink: "#f4f4f6", hair: "rgba(244,244,246,.16)", meta: "rgba(244,244,246,.5)" },
  clear: { bg: "", ink: "#15151a", hair: "rgba(21,21,26,.14)", meta: "rgba(21,21,26,.5)" },
}

const f1 = (x: number) => (Math.round(x * 10) / 10).toString()

/** Resolved SVG markup for one frame (no CSS variables), for export. */
export function dashBurstSvg(w: number, h: number, t: number, values: Record<string, unknown>, seedIn?: number): string {
  const seed = num(seedIn ?? values.seed, 4821)
  const cfg = configFromValues(values, seed)
  const m = makeModel(cfg)
  const tt = ((t % DASH_BURST_LOOP) + DASH_BURST_LOOP) % DASH_BURST_LOOP
  const fr = frame(m, tt, studioEvents(m), -1)
  const tone = TONES[(str(values.tone, "paper") as "paper" | "ink" | "clear") in TONES ? (str(values.tone, "paper") as "paper") : "paper"]
  const accent = str(values.accent, "#0060e2")
  const s = Math.min(w, h) / 400
  const parts: string[] = []
  for (let i = 0; i < m.n; i++) {
    const a = (i / m.n) * 360 - 90
    const g: string[] = []
    g.push(`<line x1="${f1(fr.start[i])}" x2="${f1(fr.end[i])}" stroke="${tone.ink}" stroke-opacity="${(0.86 * (1 - fr.hot[i])).toFixed(2)}" stroke-width="${f1(fr.width[i])}" stroke-linecap="round"/>`)
    if (fr.hot[i] > 0.02) g.push(`<line x1="${f1(fr.start[i])}" x2="${f1(fr.end[i])}" stroke="${accent}" stroke-opacity="${fr.hot[i].toFixed(2)}" stroke-width="${f1(fr.width[i])}" stroke-linecap="round"/>`)
    if (fr.echoOp[i] > 0.02 && fr.echoEnd[i] - fr.echoStart[i] > 0.5) g.push(`<line x1="${f1(fr.echoStart[i])}" x2="${f1(fr.echoEnd[i])}" stroke="${accent}" stroke-opacity="${fr.echoOp[i].toFixed(2)}" stroke-width="${f1(fr.width[i] * 0.9)}" stroke-linecap="round" stroke-dasharray="0 6"/>`)
    parts.push(`<g transform="rotate(${a.toFixed(2)})">${g.join("")}</g>`)
  }
  const show = values.showNumber !== false
  const text = show
    ? `<text y="${f1(8)}" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${f1(m.r0 * 0.5)}" font-weight="500" letter-spacing="-1.4" fill="${tone.ink}" fill-opacity=".9">${fmt(fr.mean)}</text>` +
      `<text y="${f1(m.r0 * 0.5 + 12)}" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${f1(Math.max(9, m.r0 * 0.14))}" fill="${tone.meta}">${esc(str(values.unit, "tokens / min"))}</text>`
    : ""
  const bg = tone.bg ? `<rect width="${w}" height="${h}" fill="${tone.bg}"/>` : ""
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg}` +
    `<g transform="translate(${w / 2} ${h / 2}) scale(${s.toFixed(4)})"><circle r="${f1(m.r0 - 12)}" fill="none" stroke="${tone.hair}" stroke-width=".8"/>${parts.join("")}${text}</g></svg>`
  )
}

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dbu {
  --dbu-ink: #000;
  --dbu-surface: #fff;
  --dbu-accent: #0060e2;
  --dbu-t1: color-mix(in oklab, var(--dbu-ink) 88%, transparent);
  --dbu-t2: color-mix(in oklab, var(--dbu-ink) 61%, transparent);
  --dbu-t3: color-mix(in oklab, var(--dbu-ink) 45%, transparent);
  --dbu-t4: color-mix(in oklab, var(--dbu-ink) 27%, transparent);
  --dbu-fill: color-mix(in oklab, var(--dbu-ink) 6%, transparent);
  --dbu-line: color-mix(in oklab, var(--dbu-ink) 14%, transparent);
  --dbu-ease: cubic-bezier(.22, 1, .36, 1);
  --dbu-s: 100cqw;
  position: relative; container-type: inline-size; width: 100%; max-width: 560px; margin-inline: auto;
  font: 13px/20px var(--dbu-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--dbu-t1); -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .dbu { --dbu-ink: #fff; --dbu-surface: #1c1c1e; --dbu-accent: #4d8dff; --dbu-t1: color-mix(in oklab, var(--dbu-ink) 90%, transparent); --dbu-t2: color-mix(in oklab, var(--dbu-ink) 62%, transparent); --dbu-t3: color-mix(in oklab, var(--dbu-ink) 46%, transparent); --dbu-line: color-mix(in oklab, var(--dbu-ink) 16%, transparent) }
html[data-style="mono"] .dbu { --dbu-ink: #000; --dbu-surface: #fff; --dbu-accent: #111; --dbu-ease: cubic-bezier(.2, .9, .1, 1); --dbu-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace }
html[data-style="mono"].dark .dbu { --dbu-ink: #fff; --dbu-surface: #0a0a0a; --dbu-accent: #f2f2f2 }
html[data-style="glass"] .dbu { --dbu-ink: var(--pane-ink); --dbu-surface: var(--pane-solid); --dbu-accent: var(--pane-accent); --dbu-ease: var(--pane-ease); --dbu-font: var(--pane-font); --dbu-t1: var(--pane-t1); --dbu-t2: var(--pane-t2); --dbu-t3: var(--pane-t3); --dbu-t4: var(--pane-t4) }
.dbu[data-tone="paper"] { --dbu-ink: #15151a; --dbu-surface: #f4f3ef; --dbu-t1: color-mix(in oklab, #15151a 88%, transparent); --dbu-t2: color-mix(in oklab, #15151a 61%, transparent); --dbu-t3: color-mix(in oklab, #15151a 50%, transparent) }
.dbu[data-tone="ink"] { --dbu-ink: #f4f4f6; --dbu-surface: #0d0d10; --dbu-t1: color-mix(in oklab, #f4f4f6 90%, transparent); --dbu-t2: color-mix(in oklab, #f4f4f6 62%, transparent); --dbu-t3: color-mix(in oklab, #f4f4f6 50%, transparent) }
.dbu[data-tone="paper"], .dbu[data-tone="ink"] { background: var(--dbu-surface) }
.dbu[data-fill] { max-width: none; margin: 0; container-type: size; display: grid; place-items: center; --dbu-s: min(100cqw, 100cqh) }
.dbu *, .dbu *::before, .dbu *::after { box-sizing: border-box }
:where(.dbu) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.dbu) p { margin: 0 }
.dbu-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.dbu-stage { display: block; position: relative; width: var(--dbu-s); aspect-ratio: 1; border-radius: 50%; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.dbu-stage:focus-visible { outline: 2px solid var(--dbu-accent); outline-offset: -2px }
.dbu-svg { display: block; width: 100%; height: 100%; overflow: visible }
.dbu-ring { fill: none; stroke: var(--dbu-line); stroke-width: .8 }
.dbu-b { stroke: var(--dbu-t1); stroke-opacity: .86; stroke-linecap: round }
.dbu-h { stroke: var(--dbu-accent); stroke-linecap: round; opacity: 0 }
.dbu-e { stroke: var(--dbu-accent); stroke-linecap: round; opacity: 0 }

.dbu-mid { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; text-align: center; pointer-events: none; padding-top: calc(var(--dbu-s) * .012) }
.dbu-num { font-size: max(28px, calc(var(--dbu-s) * .112)); line-height: 1; font-weight: 500; letter-spacing: -.035em; font-variant-numeric: tabular-nums; color: var(--dbu-t1) }
.dbu-unit { margin-top: calc(var(--dbu-s) * .014); font-size: max(13px, calc(var(--dbu-s) * .032)); line-height: 1.3; color: var(--dbu-t2) }
.dbu-cap { margin-top: calc(var(--dbu-s) * .006); font-size: max(12px, calc(var(--dbu-s) * .027)); line-height: 1.3; color: var(--dbu-t3); white-space: nowrap }

@container (max-width: 400px) { .dbu-cap { display: none } }
@media (prefers-reduced-motion: reduce) { .dbu *, .dbu *::before, .dbu *::after { animation: none !important; transition: none !important } }
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const STILL_T = BURST_AT + 0.2

export function DashBurst(props: DashBurstProps) {
  const {
    data, max, onBurst, className, label, sectorLabel, time, size, canvasRef: _canvasRef,
    speed = 1, paused = false, seed: seedProp, values, accent, caption, unit,
  } = props
  void _canvasRef
  const vals = (values ?? {}) as Record<string, unknown>
  const seed = seedProp ?? num(vals.seed, 4821)
  const base = configFromValues(vals, seed)
  const cfg: DashBurstConfig = {
    ...base,
    n: Math.round(Math.min(120, Math.max(24, props.count ?? base.n))),
    inner: Math.min(0.62, Math.max(0.3, props.inner ?? base.inner)),
    taper: Math.min(1, Math.max(0, props.taper ?? base.taper)),
    amp: Math.min(1.5, Math.max(0, props.amplitude ?? base.amp)),
    width: props.width ?? base.width,
    sector: props.sector ?? base.sector,
    data,
    max,
  }
  const tone = props.tone ?? (str(vals.tone, "auto") as DashBurstTone)
  const accentFinal = accent ?? (typeof vals.accent === "string" ? vals.accent : undefined)
  const showNumber = vals.showNumber !== false
  const unitText = unit ?? str(vals.unit, "tokens / min")
  const capText = caption ?? str(vals.caption, "Last 60 minutes")
  const valueOverride = props.value

  // The model only changes with the config; a stable key keeps the engine from restarting on every render.
  const key = JSON.stringify([cfg.n, cfg.inner, cfg.taper, cfg.rhythm, cfg.amp, cfg.sector, cfg.seed, cfg.width, cfg.max, data])
  const model = React.useMemo(() => makeModel(cfg), [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLButtonElement>(null)
  const numRef = React.useRef<HTMLSpanElement>(null)
  const capRef = React.useRef<HTMLSpanElement>(null)
  const eng = React.useRef({ clock: 0, events: [] as DashBurstEvent[], auto: true, step: 0, active: -1, onScreen: false, paint: (_t: number) => {}, speed, paused, burst: (_i: number) => {}, ignoreClick: false })
  const [announce, setAnnounce] = React.useState("")
  const onBurstRef = React.useRef(onBurst)
  const labelFn = sectorLabel ?? ((i: number, n: number) => `Dash ${i + 1} of ${n}`)
  const labelRef = React.useRef(labelFn)
  React.useLayoutEffect(() => {
    onBurstRef.current = onBurst
    eng.current.speed = speed
    eng.current.paused = paused
    labelRef.current = labelFn
  })

  const timePure = time !== undefined

  React.useEffect(() => {
    const e = eng.current
    const stage = stageRef.current
    if (!stage) return
    const dashes = Array.from(stage.querySelectorAll<SVGGElement>("[data-d]")).map((g) => {
      const l = g.querySelectorAll("line")
      return { b: l[0], h: l[1], e: l[2] }
    })
    const cache = { w: new Float32Array(model.n).fill(-1) }
    let lastText = ""
    let lastCap = ""
    const paint = (t: number) => {
      const f = frame(model, t, e.events, e.active)
      for (let i = 0; i < model.n; i++) {
        const d = dashes[i]
        if (!d) continue
        const s = f.start[i].toFixed(2)
        const en = f.end[i].toFixed(2)
        d.b.setAttribute("x1", s)
        d.b.setAttribute("x2", en)
        d.h.setAttribute("x1", s)
        d.h.setAttribute("x2", en)
        d.h.style.opacity = f.hot[i] < 0.01 ? "0" : f.hot[i].toFixed(2)
        d.b.style.strokeOpacity = (0.86 * (1 - f.hot[i])).toFixed(2)
        if (f.echoOp[i] > 0.01 && f.echoEnd[i] - f.echoStart[i] > 0.5) {
          d.e.setAttribute("x1", f.echoStart[i].toFixed(2))
          d.e.setAttribute("x2", f.echoEnd[i].toFixed(2))
          d.e.style.opacity = f.echoOp[i].toFixed(2)
        } else d.e.style.opacity = "0"
        if (Math.abs(cache.w[i] - f.width[i]) > 0.01) {
          cache.w[i] = f.width[i]
          const w = f.width[i].toFixed(2)
          d.b.setAttribute("stroke-width", w)
          d.h.setAttribute("stroke-width", w)
          d.e.setAttribute("stroke-width", (f.width[i] * 0.9).toFixed(2))
        }
      }
      const shown = valueOverride ?? fmt(e.active >= 0 ? f.metric[e.active] : f.mean)
      if (shown !== lastText && numRef.current) {
        lastText = shown
        numRef.current.textContent = shown
      }
      const cap = e.active >= 0 ? labelRef.current(e.active, model.n) : capText
      if (cap !== lastCap && capRef.current) {
        lastCap = cap
        capRef.current.textContent = cap
      }
    }
    e.paint = paint

    // Time-pure (studio export, scrubbing): one frame, no clock.
    if (timePure) {
      e.events = studioEvents(model)
      e.active = -1
      paint(((time % DASH_BURST_LOOP) + DASH_BURST_LOOP) % DASH_BURST_LOOP)
      return
    }

    const sched = (k: number): DashBurstEvent => ({ t0: BURST_AT + k * DASH_BURST_LOOP, idx: burstIndex(model, k), amp: 1 })
    e.events = [sched(0)]
    e.step = 1
    e.clock = reduce ? STILL_T : 0
    let raf = 0
    let last = 0
    let running = false
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!e.paused) e.clock += dt * e.speed
      if (e.auto) {
        const nxt = sched(e.step)
        if (e.clock >= nxt.t0 - 0.0001) {
          e.events.push(nxt)
          e.step++
          onBurstRef.current?.(nxt.idx)
        }
      }
      e.events = e.events.filter((ev) => e.clock - ev.t0 < 5)
      paint(e.clock)
      raf = requestAnimationFrame(tick)
    }
    const run = () => {
      const should = e.onScreen && document.visibilityState === "visible" && !reduce
      if (should && !running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      } else if (!should && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    }
    paint(e.clock)
    const io = new IntersectionObserver((en) => {
      e.onScreen = en.some((x) => x.isIntersecting)
      run()
    })
    if (rootRef.current) io.observe(rootRef.current)
    document.addEventListener("visibilitychange", run)
    e.burst = (idx: number) => {
      e.auto = false
      const ev: DashBurstEvent = { t0: reduce ? STILL_T - 0.2 : e.clock, idx, amp: 1 }
      e.events = reduce ? [ev] : [...e.events, ev]
      if (reduce) e.clock = STILL_T
      onBurstRef.current?.(idx)
      if (!running) paint(e.clock)
    }
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", run)
      cancelAnimationFrame(raf)
    }
  }, [model, reduce, timePure, time, capText, valueOverride])

  /* ---- input: the first touch, key or focus ends the demo for good ---- */
  const stopAuto = () => {
    eng.current.auto = false
  }
  const indexAt = (ev: React.PointerEvent): number | null => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return null
    const dx = ev.clientX - (r.left + r.width / 2)
    const dy = ev.clientY - (r.top + r.height / 2)
    const rad = Math.hypot(dx, dy) / (r.width / 2)
    if (rad < cfg.inner * 0.78 || rad > 1.06) return null
    const a = (Math.atan2(dy, dx) + Math.PI / 2 + TAU) % TAU
    return Math.round((a / TAU) * model.n) % model.n
  }
  const setActive = (i: number) => {
    const e = eng.current
    if (e.active === i) return
    e.active = i
    if (timePure || (reduce || !e.onScreen)) e.paint(e.clock)
    if (i >= 0) setAnnounce(`${labelRef.current(i, model.n)}, ${fmt(frame(model, e.clock, e.events, i).metric[i])} ${unitText}`)
  }

  const burstFrom = (i: number) => {
    stopAuto()
    eng.current.burst(i)
    setAnnounce(`Burst from ${labelRef.current(i, model.n).toLowerCase()}`)
  }

  const onKeyDown = (ev: React.KeyboardEvent) => {
    stopAuto()
    const e = eng.current
    const n = model.n
    const cur = e.active >= 0 ? e.active : burstIndex(model, 0)
    let next = -2
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") next = (cur + (e.active < 0 ? 0 : ev.key === "ArrowDown" ? 6 : 1)) % n
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") next = (cur - (e.active < 0 ? 0 : ev.key === "ArrowUp" ? 6 : 1) + n) % n
    else if (ev.key === "Home") next = 0
    else if (ev.key === "End") next = n - 1
    else if (ev.key === "Escape") next = -1
    if (next !== -2) {
      ev.preventDefault()
      setActive(next)
    }
  }

  const dashEls = React.useMemo(
    () =>
      Array.from({ length: model.n }, (_, i) => (
        <g key={i} data-d transform={`rotate(${(((i / model.n) * 360 - 90)).toFixed(3)})`}>
          <line className="dbu-b" x1={model.r0} x2={model.r0 + 4} strokeWidth={cfg.width} />
          <line className="dbu-h" x1={model.r0} x2={model.r0 + 4} strokeWidth={cfg.width} />
          <line className="dbu-e" x1={model.r0} x2={model.r0} strokeWidth={cfg.width * 0.9} strokeDasharray="0 6" />
        </g>
      )),
    [model, cfg.width],
  )

  const name = label ?? `Ring of ${model.n} dashes sized by ${unitText}, average ${fmt(frame(model, 0, [], -1).mean)}.`
  const fill = size ? ({ width: size.w, height: size.h } as React.CSSProperties) : undefined
  const rootStyle = { ...(fill ?? {}), ...(accentFinal ? { "--dbu-accent": accentFinal } : {}) } as React.CSSProperties

  return (
    <div ref={rootRef} className={cn("dbu", className)} data-tone={tone} data-fill={size ? "" : undefined} style={rootStyle}>
      <style href="dash-burst" precedence="default">
        {CSS}
      </style>
      <p className="dbu-sr" role="status" aria-live="polite">
        {announce}
      </p>
      <button
        ref={stageRef}
        type="button"
        className="dbu-stage"
        aria-label={`${name} Arrow keys move between dashes, Enter sends a burst.`}
        onPointerDown={(ev) => {
          stopAuto()
          const i = indexAt(ev)
          eng.current.ignoreClick = true
          if (i !== null) {
            setActive(i)
            burstFrom(i)
          }
        }}
        onPointerMove={(ev) => {
          if (ev.pointerType !== "mouse") return
          const i = indexAt(ev)
          setActive(i ?? -1)
        }}
        onPointerLeave={() => setActive(-1)}
        onClick={(ev) => {
          if (eng.current.ignoreClick && ev.detail > 0) {
            eng.current.ignoreClick = false
            return
          }
          burstFrom(eng.current.active >= 0 ? eng.current.active : burstIndex(model, 0))
        }}
        onKeyDown={onKeyDown}
        onFocus={(ev) => {
          if (ev.currentTarget.matches(":focus-visible")) stopAuto()
        }}
        onBlur={() => setActive(-1)}
      >
        <svg className="dbu-svg" viewBox="-200 -200 400 400" aria-hidden>
          <circle className="dbu-ring" r={model.r0 - 12} />
          {dashEls}
        </svg>
        {showNumber && (
          <span className="dbu-mid" aria-hidden>
            <span ref={numRef} className="dbu-num">
              {valueOverride ?? fmt(frame(model, timePure ? 0 : STILL_T, [], -1).mean)}
            </span>
            <span className="dbu-unit">{unitText}</span>
            <span ref={capRef} className="dbu-cap">
              {capText}
            </span>
          </span>
        )}
      </button>
    </div>
  )
}

"use client"

import * as React from "react"

import { rng } from "@/studio/schema"
import type { StudioPieceProps } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DashTrace = {
  /** Row index, 0 at the top. */
  row: number
  /** Where the bright head is: 0 = before the row, 1 = past its end. */
  p: number
  /** How much light the row keeps behind the head, 0 to 1. */
  s: number
}

export type DashRibbonProps = StudioPieceProps & {
  /** Rows of dashes. Default 17. */
  rows?: number
  /** Wave height multiplier. 1 is the designed swell. */
  amplitude?: number
  /** 0 = every dash the same length, 1 = very uneven. Default 0.6. */
  variance?: number
  /** Share of dashes drawn in the accent, in percent. Keep it under 8. Default 3. */
  accentShare?: number
  /** The row to trace. Setting it turns the built-in demo off and traces that row (again) whenever it changes. */
  row?: number
  /** Called when a person starts a trace (click, arrow keys, Trace button). */
  onTrace?: (row: number) => void
  /** Accessible description of the picture. */
  label?: string
  /** Small line under the picture, left side. `{row}` and `{rows}` are filled in. Default "Row {row} of {rows}". */
  caption?: string
  /** Width / height of the picture. Default 1.8; below 520px wide it turns taller by itself. */
  aspect?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Drawing                                   */
/* -------------------------------------------------------------------------- */

type Dash = { a: number; b: number; al: number; q: number; j: number }
type RGB = [number, number, number]

const TAU = Math.PI * 2
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** The head starts fast and settles gently. */
export const easeTrace = (p: number) => 1 - Math.pow(1 - clamp(p), 2.4)
/** x of the bright head for a progress value; it enters and leaves past the edges. */
const headX = (p: number) => -0.2 + 1.4 * p

function hash(n: number) {
  n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d)
  n = Math.imul(n ^ (n >>> 12), 0x297a2d39)
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296
}
/** Smooth 2D value noise, 0..1. */
function vnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const h = (i: number, j: number) => hash((i * 374761393 + j * 668265263 + seed * 2246822519) | 0)
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v)
}

/** Dashes are laid out once per (seed, rows, variance) in x units 0..1 and cached; the wave is applied at draw time. */
const geoCache = new Map<string, Dash[][]>()
function geometry(seed: number, rows: number, variance: number): Dash[][] {
  const key = `${seed}|${rows}|${variance.toFixed(2)}`
  const hit = geoCache.get(key)
  if (hit) return hit
  const out: Dash[][] = []
  for (let r = 0; r < rows; r++) {
    const rand = rng(seed * 131 + r * 977 + 7)
    // Each row has its own habit (short and busy, or long and calm), so no two rows read as the same barcode.
    const habit = 0.62 + 0.95 * rand()
    const row: Dash[] = []
    let x = -0.03 + rand() * 0.04
    while (x < 1.03) {
      const n1 = vnoise(x * 3.4 + r * 0.17, r * 0.71, seed)
      const n2 = vnoise(x * 7.1 + 11, r * 1.3 + 4, seed + 5)
      const even = 0.026
      const wild = (0.008 + 0.082 * Math.pow(n1, 1.7) + 0.014 * rand()) * habit * (rand() < 0.07 ? 2.1 : 1)
      const len = Math.max(0.007, lerp(even, wild, variance))
      const a = x
      const b = x + len
      const gapNoise = rand() < 0.06 ? 0.026 : 0
      x = b + 0.0105 + 0.011 * rand() * (0.4 + variance) + gapNoise
      row.push({ a, b, al: 0.22 + 0.58 * n2, q: rand(), j: rand() * 2 - 1 })
    }
    out.push(row)
  }
  if (geoCache.size > 24) geoCache.clear()
  geoCache.set(key, out)
  return out
}

/** Vertical position of row r at x (0..1): a rolling sheet whose crest slants across the rows. Shared by draw and hit-testing. */
export function spineY(x: number, r: number, R: number, h: number, amp: number, phase: number, seed: number) {
  const top = h * 0.17
  const span = h * 0.66
  const swing = h * 0.1 * amp
  const u = r / (R - 1)
  const env = 0.5 + 0.5 * Math.sin(TAU * (0.52 * x) + 0.7)
  const gain = 0.72 + 0.5 * u
  const wave =
    Math.sin(TAU * (1.12 * x) + u * 2.3 + phase) + 0.34 * Math.sin(TAU * (2.3 * x) - u * 1.4 - 2 * phase + 0.9)
  const wander = (vnoise(x * 2.1 + r * 0.045, r * 0.07, seed + 3) - 0.5) * 0.7
  return top + u * span + swing * (0.28 + 0.72 * env) * gain * (wave * 0.78 + wander)
}

/** Any CSS colour the browser hands back (hex, rgb(), color(srgb …)) as 0-255 channels. */
function parseColor(c: unknown, fallback: RGB): RGB {
  if (typeof c !== "string") return fallback
  const s = c.trim()
  let m = /^#([0-9a-f]{3,8})$/i.exec(s)
  if (m) {
    let h = m[1]
    if (h.length < 6) h = h.split("").map((ch) => ch + ch).join("")
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  m = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(s)
  if (m) return [+m[1] * 255, +m[2] * 255, +m[3] * 255]
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s)
  if (m) return [+m[1], +m[2], +m[3]]
  return fallback
}

export type DrawValues = {
  rows?: number
  amplitude?: number
  variance?: number
  thickness?: number
  accentShare?: number
  row?: number
  drift?: number
  seed?: number
  ink?: string
  accent?: string
  /** Paper colour. Leave out (or "transparent") to draw on whatever is behind the canvas. */
  bg?: string
  /** Explicit traces (the live piece drives these). Without it one trace is derived from t. */
  traces?: DashTrace[]
}

/** Length in seconds of the seamless loop that the Studio uses for `t`. */
export const LOOP = 8

/** The one trace a looping export shows: nothing, the run, the light settling, nothing. Same frame at t = 0 and t = LOOP. */
export function loopTrace(t: number, row: number): DashTrace {
  const u = ((t % LOOP) + LOOP) % LOOP
  const p = easeTrace((u - 0.5) / 4.8)
  const s = u < 5.6 ? clamp((u - 0.5) / 4.8) : 1 - smooth(5.6, 7.6, u)
  return { row, p: u < 0.5 ? 0 : u > 5.3 ? 1 : p, s: u >= 5.6 ? s : s * 0.9 }
}

/**
 * One pure function draws any frame: rows of rounded dashes on a rolling wave, with one row traced by a bright run.
 * t is seconds; the wave phase is 2π · drift · t / LOOP, so an integer drift loops seamlessly.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values: DrawValues = {}) {
  const R = Math.round(clamp(values.rows ?? 17, 3, 48))
  const amp = values.amplitude ?? 1
  const variance = clamp(values.variance ?? 0.6)
  const thick = values.thickness ?? 1
  const share = clamp((values.accentShare ?? 3) / 100, 0, 0.12)
  const seed = (values.seed ?? 4821) | 0
  const phase = TAU * (values.drift ?? 0) * (t / LOOP)
  const ink = parseColor(values.ink, [0, 0, 0])
  const acc = parseColor(values.accent, [0, 96, 226])
  const traces = values.traces ?? [loopTrace(t, clamp(Math.round(values.row ?? (R - 1) * 0.42), 0, R - 1))]

  ctx.save()
  ctx.clearRect(0, 0, w, h)
  if (values.bg && values.bg !== "transparent") {
    ctx.fillStyle = values.bg
    ctx.fillRect(0, 0, w, h)
  }
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  const dashes = geometry(seed, R, variance)
  const gap = (h * 0.66) / (R - 1)
  const lw = Math.max(1.2, gap * 0.2 * thick)
  const lift = Math.max(1.2, w / 760)
  const capX = lw / 2 / w

  const spine = (x: number, r: number) => spineY(x, r, R, h, amp, phase, seed)

  for (let r = 0; r < R; r++) {
    const u = r / (R - 1)
    const rowFade = 0.62 + 0.38 * Math.sin(Math.PI * u)
    let mine: DashTrace | undefined
    let near = 0
    let nearTrace: DashTrace | undefined
    for (const tr of traces) {
      const d = Math.abs(tr.row - r)
      if (d === 0) mine = tr
      const g = d === 0 ? 1 : d === 1 ? 0.55 : d === 2 ? 0.2 : 0
      if (g > near) { near = g; nearTrace = tr }
    }
    const xh = mine ? headX(mine.p) : -9
    const xl = nearTrace ? headX(nearTrace.p) : -9

    for (const d of dashes[r]) {
      const xm = (d.a + d.b) / 2
      const edge = smooth(0, 0.09, xm) * smooth(0, 0.09, 1 - xm)
      if (edge < 0.02) continue
      let al = d.al * rowFade * (0.2 + 0.8 * edge)
      let k = 0
      let wMul = 1
      if (mine) {
        const dist = xh - xm
        if (dist >= 0) {
          k = Math.max(Math.exp(-dist / 0.15), mine.s * 0.92)
          if (dist < 0.05) wMul = 1 + 0.34 * Math.exp(-dist / 0.02)
          if (dist < 0.03) k = 1
        }
        k *= edge > 0.3 ? 1 : edge / 0.3
      }
      let accent = d.q < share
      if (accent && k < 1) k = Math.max(k, 0.9)
      al = lerp(al, 0.96, k)
      if (accent && !mine) wMul *= 1.0

      // Lift: the rows next to the run rise a pixel or two as it passes under them.
      let dy = d.j * lw * 0.12
      if (near && nearTrace) {
        const z = (xm - xl) / 0.075
        dy -= near * lift * Math.exp(-z * z)
      }

      const len = (d.b - d.a) * w
      const a = len > lw * 1.3 ? d.a + capX : xm
      const b = len > lw * 1.3 ? d.b - capX : xm
      const n = Math.max(1, Math.ceil(((b - a) * w) / 9))
      ctx.lineWidth = lw * wMul
      ctx.strokeStyle = `rgba(${lerp(ink[0], acc[0], k) | 0},${lerp(ink[1], acc[1], k) | 0},${lerp(ink[2], acc[2], k) | 0},${al.toFixed(3)})`
      ctx.beginPath()
      if (n === 1 && a === b) {
        const px = a * w
        const py = spine(a, r) + dy
        ctx.moveTo(px, py)
        ctx.lineTo(px + 0.01, py)
      } else {
        for (let i = 0; i <= n; i++) {
          const x = lerp(a, b, i / n)
          const px = x * w
          const py = spine(x, r) + dy
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
      }
      ctx.stroke()
    }
  }
  ctx.restore()
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.drb {
  --drb-ink: #000;
  --drb-surface: #fff;
  --drb-accent: #0060e2;
  --drb-t1: color-mix(in oklab, var(--drb-ink) 88%, transparent);
  --drb-t2: color-mix(in oklab, var(--drb-ink) 61%, transparent);
  --drb-t3: color-mix(in oklab, var(--drb-ink) 45%, transparent);
  --drb-fill: color-mix(in oklab, var(--drb-ink) 6%, transparent);
  --drb-line: color-mix(in oklab, var(--drb-ink) 7%, transparent);
  --drb-ease: cubic-bezier(.22, 1, .36, 1);
  --drb-aspect: 1.8;
  position: relative; container-type: inline-size; width: 100%;
  font: 13px/20px var(--drb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--drb-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .drb { --drb-ink: #fff; --drb-surface: #1c1c1e; --drb-accent: #4d8dff; --drb-line: color-mix(in oklab, var(--drb-ink) 9%, transparent); --drb-fill: color-mix(in oklab, var(--drb-ink) 8%, transparent) }
html[data-style="mono"] .drb { --drb-ink: #000; --drb-accent: #000; --drb-ease: cubic-bezier(.2, .9, .1, 1); --drb-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace }
html[data-style="mono"].dark .drb { --drb-ink: #fff; --drb-accent: #fff }
html[data-style="glass"] .drb {
  --drb-ink: var(--pane-ink); --drb-accent: var(--pane-accent); --drb-ease: var(--pane-ease); --drb-font: var(--pane-font);
  --drb-t1: var(--pane-t1); --drb-t2: var(--pane-t2); --drb-t3: var(--pane-t3);
}
.drb *, .drb *::before, .drb *::after { box-sizing: border-box }
:where(.drb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.drb) p { margin: 0 }
.drb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.drb-fig { position: relative; aspect-ratio: var(--drb-aspect); border-radius: 12px; outline: none; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent }
.drb-fig:focus-visible { outline: 2px solid var(--drb-accent); outline-offset: 4px }
.drb-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block }
@container (max-width: 520px) { .drb { --drb-aspect: 1.25 } }
.drb[data-fixed] .drb-fig { aspect-ratio: auto; height: 100%; cursor: default }

.drb-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; margin-top: 8px; padding: 0 2px; color: var(--drb-t3) }
.drb-cap { font-variant-numeric: tabular-nums; letter-spacing: -.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: opacity .2s var(--drb-ease) }
.drb-btns { display: flex; align-items: center; gap: 2px; margin-right: -6px }
.drb-b {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; min-width: 32px; padding: 0 8px; border-radius: 8px;
  color: var(--drb-t2); transition: background-color .16s var(--drb-ease), color .16s var(--drb-ease), transform .16s var(--drb-ease);
}
.drb-b:hover { background: var(--drb-fill); color: var(--drb-t1) }
.drb-b:active { transform: scale(.96) }
.drb-b:focus-visible { outline: 2px solid var(--drb-accent); outline-offset: 1px }
.drb-b svg { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round }
.drb-b[data-label] { padding: 0 10px 0 8px; font-weight: 500 }
html[data-style="glass"] .drb-bar {
  padding: 2px 4px 2px 14px; border-radius: 999px; background-color: var(--pane-tint); box-shadow: var(--pane-card);
  -webkit-backdrop-filter: blur(18px) saturate(1.8); backdrop-filter: blur(18px) saturate(1.8);
}
html[data-style="glass"] .drb-b:hover { background: color-mix(in oklab, var(--pane-ink) 8%, transparent) }
@container (max-width: 400px) { .drb-b[data-label] span { display: none } .drb-b[data-label] { padding: 0 8px } }
@media (prefers-reduced-motion: reduce) { .drb-b, .drb-cap { transition: none } }
`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const TRACE_SECONDS = 3.2
// One cycle of the built-in demo: a beat of calm, the run, the light holding, then it fades before the next row.
const DEMO = { idle: 0.8, run: 3.4, hold: 2.6, fade: 0.9 }
const CYCLE = DEMO.idle + DEMO.run + DEMO.hold + DEMO.fade
const DEMO_ROWS = [0.4, 0.72, 0.2, 0.56]

type Sim = {
  clock: number
  last: number
  interacted: boolean
  row: number
  cycle: number
  t0: number
  cur: { row: number; t0: number } | null
  prev: { row: number; s0: number; t0: number } | null
}

export function DashRibbon(props: DashRibbonProps) {
  const {
    speed = 1,
    paused = false,
    accent,
    values,
    seed: seedProp,
    size,
    time,
    canvasRef,
    onTrace,
    label = "Rows of dashes on a rolling wave, with a run of light tracing along one row.",
    className,
  } = props
  const v = { ...values } as DrawValues & Record<string, unknown>
  const rows = Math.round(clamp(Number(v.rows ?? props.rows ?? 17), 3, 48))
  const amplitude = Number(v.amplitude ?? props.amplitude ?? 1)
  const variance = Number(v.variance ?? props.variance ?? 0.6)
  const accentShare = Number(v.accentShare ?? props.accentShare ?? 2)
  const thickness = Number(v.thickness ?? 1)
  const seed = Number(seedProp ?? v.seed ?? 4821)
  const controlled = props.row !== undefined
  const fixed = time !== undefined
  const caption = props.caption ?? "Row {row} of {rows}"
  const accentColor = (typeof v.accent === "string" ? v.accent : undefined) ?? accent

  const rootRef = React.useRef<HTMLDivElement>(null)
  const figRef = React.useRef<HTMLDivElement>(null)
  const cvRef = React.useRef<HTMLCanvasElement | null>(null)
  const ctlRef = React.useRef<{ paint: () => void; trace: (row: number, user?: boolean) => void; pick: (x: number, y: number, h: number) => number } | null>(null)
  const [shown, setShown] = React.useState(() => Math.round((rows - 1) * DEMO_ROWS[0]))
  const [reduce, setReduce] = React.useState(prefersReduced)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduce(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  const setCanvas = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cvRef.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el
    },
    [canvasRef],
  )

  // Everything that moves lives here: one rAF loop, state in a ref, nothing re-renders per frame.
  const drawKey = `${rows}|${amplitude}|${variance}|${accentShare}|${thickness}|${seed}|${String(v.drift)}|${String(v.ink)}|${String(v.bg)}|${accentColor}`
  React.useEffect(() => {
    const root = rootRef.current
    const cv = cvRef.current
    if (!root || !cv) return
    const ctx = cv.getContext("2d")
    if (!ctx) return

    const probe = document.createElement("i")
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0"
    root.appendChild(probe)
    const resolve = (name: string) => {
      probe.style.color = `var(${name})`
      return getComputedStyle(probe).color
    }
    let ink = "#000"
    let acc = "#0060e2"
    const readColors = () => {
      ink = typeof v.ink === "string" ? v.ink : resolve("--drb-ink")
      acc = accentColor ?? resolve("--drb-accent")
    }

    const driftN = Number(v.drift)
    const base = (): DrawValues => ({
      rows, amplitude, variance, thickness, accentShare, seed, ink, accent: acc,
      drift: Number.isFinite(driftN) && v.drift !== undefined ? driftN : 0.03,
      bg: typeof v.bg === "string" ? v.bg : undefined,
      row: typeof v.row === "number" ? v.row : undefined,
    })

    let dpr = 1
    let cw = 0
    let ch = 0
    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      const rect = fixed && size ? { width: size.w, height: size.h } : cv.getBoundingClientRect()
      cw = Math.max(1, Math.round(rect.width * dpr))
      ch = Math.max(1, Math.round(rect.height * dpr))
      if (cv.width !== cw || cv.height !== ch) {
        cv.width = cw
        cv.height = ch
      }
    }

    // Live demo state. The first frame is mid-run, so a still screenshot already shows the moment.
    const sim: Sim = {
      clock: reduce ? 2.7 : 2.5,
      last: 0,
      interacted: controlled,
      row: Math.round((rows - 1) * DEMO_ROWS[0]),
      cycle: 0,
      t0: 0,
      cur: null,
      prev: null,
    }
    if (controlled) {
      sim.row = clamp(Math.round(props.row!), 0, rows - 1)
      sim.cur = { row: sim.row, t0: reduce ? -TRACE_SECONDS : sim.clock }
    }

    const tracesNow = (): DashTrace[] => {
      const out: DashTrace[] = []
      if (!sim.interacted) {
        const cyc = Math.floor(sim.clock / CYCLE)
        const local = sim.clock - cyc * CYCLE
        const row = Math.round((rows - 1) * DEMO_ROWS[cyc % DEMO_ROWS.length])
        if (row !== sim.row) { sim.row = row; setShown(row) }
        const q = clamp((local - DEMO.idle) / DEMO.run)
        const hold = DEMO.idle + DEMO.run + DEMO.hold
        const s = local < hold ? easeTrace(q) * 0.92 : 0.92 * (1 - smooth(hold, hold + DEMO.fade, local))
        out.push({ row, p: local < DEMO.idle ? 0 : q, s })
      } else {
        if (sim.prev) {
          const f = 1 - smooth(0, 0.7, sim.clock - sim.prev.t0)
          if (f > 0.01) out.push({ row: sim.prev.row, p: 1, s: sim.prev.s0 * f })
          else sim.prev = null
        }
        if (sim.cur) {
          const q = clamp((sim.clock - sim.cur.t0) / TRACE_SECONDS)
          out.push({ row: sim.cur.row, p: q, s: 0.92 * smooth(0.25, 1, q) })
        }
      }
      return out
    }

    const paint = () => {
      fit()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (fixed) draw(ctx, cw, ch, time!, base())
      else draw(ctx, cw, ch, sim.clock, { ...base(), traces: tracesNow() })
    }

    const trace = (row: number, user = true) => {
      row = clamp(Math.round(row), 0, rows - 1)
      if (user && !sim.interacted) {
        // The first touch ends the built-in demo for good.
        const cur = tracesNow()[0]
        sim.interacted = true
        sim.cur = null
        sim.prev = cur ? { row: cur.row, s0: cur.s, t0: sim.clock } : null
      } else if (sim.cur) {
        const q = clamp((sim.clock - sim.cur.t0) / TRACE_SECONDS)
        sim.prev = { row: sim.cur.row, s0: 0.92 * smooth(0.25, 1, q), t0: sim.clock }
      }
      sim.row = row
      sim.cur = { row, t0: sim.clock }
      setShown(row)
      if (user) onTrace?.(row)
      if (reduce) sim.cur.t0 = sim.clock - TRACE_SECONDS * 0.7
      wake()
    }

    let raf = 0
    let visible = true
    const moving = () => !fixed && !reduce && !paused && visible && !document.hidden
    const needsFrames = () => {
      if (!moving()) return false
      return true
    }
    const frame = (now: number) => {
      raf = 0
      const dt = sim.last ? Math.min(0.05, (now - sim.last) / 1000) : 0
      sim.last = now
      sim.clock += dt * speed
      paint()
      if (needsFrames()) raf = requestAnimationFrame(frame)
    }
    function wake() {
      if (raf) return
      sim.last = 0
      if (needsFrames()) raf = requestAnimationFrame(frame)
      else paint()
    }
    ctlRef.current = {
      paint,
      trace,
      pick: (x, y, h) => {
        const phase = TAU * (Number.isFinite(driftN) && v.drift !== undefined ? driftN : 0.03) * (sim.clock / LOOP)
        let best = 0
        let bd = Infinity
        for (let r = 0; r < rows; r++) {
          const d = Math.abs(spineY(x, r, rows, h, amplitude, phase, seed) - y)
          if (d < bd) { bd = d; best = r }
        }
        return best
      },
    }

    readColors()
    const ro = new ResizeObserver(() => { readColors(); paint() })
    ro.observe(fixed ? cv : figRef.current ?? cv)
    const io = new IntersectionObserver((e) => {
      visible = e[e.length - 1].isIntersecting
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0 }
      wake()
    })
    io.observe(root)
    const onVis = () => { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0 } else wake() }
    document.addEventListener("visibilitychange", onVis)
    // Theme and style switches repaint even while nothing moves.
    const mo = new MutationObserver(() => { readColors(); paint() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-style"] })

    paint()
    wake()
    // If frames never arrive (a throttled tab), the first painted frame above stays on screen.

    return () => {
      ctlRef.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      probe.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey, fixed, time, size?.w, size?.h, paused, speed, reduce, controlled, props.row])

  const pickRow = (clientY: number, clientX: number) => {
    const cv = cvRef.current
    if (!cv) return
    const rect = cv.getBoundingClientRect()
    const h = rect.height
    const x = clamp((clientX - rect.left) / rect.width)
    const best = ctlRef.current?.pick(x, clientY - rect.top, h) ?? 0
    ctlRef.current?.trace(best)
  }

  const step = (d: number) => ctlRef.current?.trace(clamp(shown + d, 0, rows - 1))
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); step(-1) }
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); step(1) }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ctlRef.current?.trace(shown) }
  }

  const cap = caption.replace("{row}", String(shown + 1).padStart(2, "0")).replace("{rows}", String(rows))

  return (
    <div
      ref={rootRef}
      className={["drb", className].filter(Boolean).join(" ")}
      data-fixed={fixed ? "" : undefined}
      style={{ ...(accentColor ? ({ "--drb-accent": accentColor } as React.CSSProperties) : null), ...(props.aspect ? ({ "--drb-aspect": props.aspect } as React.CSSProperties) : null) }}
    >
      <style href="dash-ribbon" precedence="default">{CSS}</style>
      <div
        ref={figRef}
        className="drb-fig"
        role="group"
        aria-label={`${label} Arrow keys choose a row, Enter traces it.`}
        tabIndex={fixed ? -1 : 0}
        onKeyDown={fixed ? undefined : onKey}
        onPointerDown={fixed ? undefined : (e) => pickRow(e.clientY, e.clientX)}
      >
        <canvas ref={setCanvas} className="drb-cv" role="img" aria-label={label} />
      </div>
      {!fixed && (
        <div className="drb-bar">
          <p className="drb-cap" aria-live="polite">{cap}</p>
          <div className="drb-btns">
            <button type="button" className="drb-b" aria-label="Previous row" title="Previous row" onClick={() => step(-1)} disabled={shown <= 0}>
              <svg viewBox="0 0 16 16" aria-hidden><path d="M4 9.5 8 5.5l4 4" /></svg>
            </button>
            <button type="button" className="drb-b" aria-label="Next row" title="Next row" onClick={() => step(1)} disabled={shown >= rows - 1}>
              <svg viewBox="0 0 16 16" aria-hidden><path d="M4 6.5 8 10.5l4-4" /></svg>
            </button>
            <button type="button" className="drb-b" data-label="" onClick={() => ctlRef.current?.trace(shown)}>
              <svg viewBox="0 0 16 16" aria-hidden><path d="M2.5 8h2.2M7 8h2.2M11.5 8h2" /></svg>
              <span>Trace</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashRibbon

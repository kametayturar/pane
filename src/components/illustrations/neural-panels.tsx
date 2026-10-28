"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type NeuralLogTone = "red" | "amber" | "green" | "blue"
export type NeuralLogLine = { text: string; tone?: NeuralLogTone }

export type NeuralPanelsProps = {
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for the dither and the particles. Default indigo #5b5bd6. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
  /** Left card header title. */
  leftTitle?: string
  /** Left card header chip (mono). */
  leftChip?: string
  /** Serif title under the terrain. */
  title?: string
  /** One-line description under the title. */
  description?: string
  /** Lines the terminal types in, one after another. */
  log?: NeuralLogLine[]
  /** Dim last line of the terminal. */
  logFooter?: string
  /** Right card header title. */
  rightTitle?: string
  /** Right card header chip (mono). */
  rightChip?: string
  /** Serif paragraph above the particle cloud. */
  summary?: string
  /** Green status line under the cloud. */
  status?: string
  /** Muted description under the status line. */
  note?: string
  /** Dim last line of the right card. */
  rightFooter?: string
}

const DEFAULT_LOG: NeuralLogLine[] = [
  { text: "> { Opening encrypted relay to eu-west... }", tone: "red" },
  { text: "> { Rebalancing 14 agents across 3 queues. }", tone: "amber" },
  { text: "> { Checkpoint 0x4f2a written in 212ms. }", tone: "green" },
  { text: "> { Handoff verified, no drift detected. }", tone: "blue" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.np {
  --np-ink: #000;
  --np-card: #fff;
  --np-well: #f2f2f4;
  --np-accent: #5b5bd6;
  --np-dither: var(--np-accent);
  --np-cloud: color-mix(in oklab, var(--np-accent) 70%, #05051c);
  --np-t1: color-mix(in oklab, var(--np-ink) 88%, transparent);
  --np-t2: color-mix(in oklab, var(--np-ink) 61%, transparent);
  --np-t3: color-mix(in oklab, var(--np-ink) 45%, transparent);
  --np-t4: color-mix(in oklab, var(--np-ink) 27%, transparent);
  --np-fill: color-mix(in oklab, var(--np-ink) 3.5%, transparent);
  --np-hair: color-mix(in oklab, var(--np-ink) 7%, transparent);
  --np-red: #e5484d; --np-amber: #c98500; --np-green: #2f9e5b; --np-blue: #3e63dd;
  --np-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 1px -1px rgb(0 0 0 / .1), 0 8px 28px -12px rgb(40 40 90 / .14);
  --np-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --np-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  --np-speed: 1;
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 1000px;
  color: var(--np-t2);
  font-family: var(--np-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .np {
  --np-ink: #fff;
  --np-card: #1c1c1f;
  --np-well: #141416;
  --np-dither: color-mix(in oklab, var(--np-accent) 58%, #fff);
  --np-cloud: color-mix(in oklab, var(--np-accent) 45%, #fff);
  --np-t1: color-mix(in oklab, var(--np-ink) 90%, transparent);
  --np-t2: color-mix(in oklab, var(--np-ink) 62%, transparent);
  --np-t3: color-mix(in oklab, var(--np-ink) 46%, transparent);
  --np-t4: color-mix(in oklab, var(--np-ink) 28%, transparent);
  --np-fill: color-mix(in oklab, var(--np-ink) 5%, transparent);
  --np-hair: color-mix(in oklab, var(--np-ink) 9%, transparent);
  --np-red: #ff7a7e; --np-amber: #f0b429; --np-green: #4cc38a; --np-blue: #8aa4ff;
  --np-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 8px 28px -12px rgb(0 0 0 / .6);
}
.np *, .np *::before, .np *::after { box-sizing: border-box }
.np-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px }
@container (min-width: 640px) { .np-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px } }

.np-card { position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: var(--np-card); border-radius: 22px; box-shadow: var(--np-shadow) }
.np-head { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex: none;
  margin: 12px 12px 0; height: 38px; padding: 0 8px 0 14px; border-radius: 11px; border: 1px solid var(--np-hair);
  background: color-mix(in oklab, var(--np-card) 80%, transparent); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px) }
.np-head b { font: 400 15px/1 var(--np-serif); color: var(--np-t1); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.np-chip { flex: none; font: 500 10px/1 var(--np-mono); letter-spacing: .01em; color: var(--np-t2); padding: 6px 8px; border-radius: 6px; background: var(--np-fill); box-shadow: inset 0 0 0 1px var(--np-hair) }

/* Left card: dithered terrain that melts into the card, then the title and the typing log. */
.np-terrain { position: relative; flex: 1 1 auto; min-height: 280px; margin-top: -50px }
.np-terrain canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; color: var(--np-dither) }
.np-terrain::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 34%; background: linear-gradient(to bottom, transparent, var(--np-card)); pointer-events: none }
.np-copy { position: relative; flex: none; padding: 0 22px 14px }
.np-title { margin: 0; font: 400 28px/1.05 var(--np-serif); letter-spacing: -.01em; color: var(--np-t1) }
.np-desc { margin: 10px 0 0; font: 400 15px/1.3 var(--np-serif); color: var(--np-t1); max-width: 40ch }
.np-box { position: relative; flex: none; margin: 0 12px 12px; padding: 11px 13px; border-radius: 12px; border: 1px solid var(--np-hair); background: var(--np-fill);
  font: 400 10.5px/17px var(--np-mono); overflow-wrap: anywhere }
.np-line { display: block; white-space: pre-wrap; min-height: 17px }
.np-line[data-tone="red"] { color: var(--np-red) } .np-line[data-tone="amber"] { color: var(--np-amber) }
.np-line[data-tone="green"] { color: var(--np-green) } .np-line[data-tone="blue"] { color: var(--np-blue) }
.np-rest { visibility: hidden }
.np-caret { display: inline-block; width: .55em; height: 1.05em; margin-left: 1px; vertical-align: -2px; background: currentColor; opacity: .7; animation: np-caret calc(1s / var(--np-speed)) steps(1) infinite }
@keyframes np-caret { 50% { opacity: 0 } }
.np-foot { display: block; margin-top: 8px; font-size: 9.5px; color: var(--np-t4) }

/* Right card: serif summary, the particle cloud in a soft well, status lines. */
.np-sum { margin: 0; padding: 20px 22px 16px; font: 400 21px/1.2 var(--np-serif); letter-spacing: -.005em; color: var(--np-t1); text-wrap: pretty }
.np-well { position: relative; flex: none; margin: 0 14px; border-radius: 14px; background: var(--np-well); aspect-ratio: 1 / .94; overflow: hidden }
.np-well canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; color: var(--np-cloud) }
.np-ok { display: flex; align-items: center; gap: 7px; color: var(--np-green) }
.np-ok::before { content: ""; flex: none; width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: np-pulse calc(2s / var(--np-speed)) ease-in-out infinite }
@keyframes np-pulse { 50% { opacity: .3; transform: scale(.7) } }
.np-note { margin: 6px 0 0; color: var(--np-t3) }
.np-right .np-box { margin-top: 14px }

.np[data-paused] *, .np[data-paused] *::before, .np[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .np *, .np *::before, .np *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                         Ordered dither + value noise                       */
/* -------------------------------------------------------------------------- */

const BAYER8 = (() => {
  const a = new Float32Array(64)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let v = 0
      for (let i = 0; i < 3; i++) v = (v << 2) | ((((x >> i) & 1) ^ ((y >> i) & 1)) << 1) | ((y >> i) & 1)
      a[y * 8 + x] = (v + 0.5) / 64
    }
  }
  return a
})()

function hash(x: number, y: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, octaves: number) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(x, y)
    norm += amp
    const nx = x * 1.6 - y * 1.2 + 11.3
    y = x * 1.2 + y * 1.6 + 3.7
    x = nx
    amp *= 0.5
  }
  return sum / norm
}
const smooth = (v: number) => {
  const c = v < 0 ? 0 : v > 1 ? 1 : v
  return c * c * (3 - 2 * c)
}

/** Paint the dithered terrain. It thins out toward the bottom so it melts into the card. */
function paintTerrain(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, t: number, color: string) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const cell = 3
  const cols = Math.ceil(w / cell)
  const rows = Math.ceil(h / cell)
  const size = cell - 1
  const soft = new Path2D()
  const deep = new Path2D()
  for (let gy = 0; gy < rows; gy++) {
    const v01 = (gy + 0.5) / rows
    const fadeY = 1 - smooth((v01 - 0.38) / 0.58)
    if (fadeY <= 0.01) break
    const ny = (gy * cell) / 150 + 1.9
    for (let gx = 0; gx < cols; gx++) {
      const nx = (gx * cell) / 150 + 3.7
      const qx = fbm(nx * 0.9 + t * 0.05, ny * 0.9 - t * 0.035, 2)
      const qy = fbm(nx * 0.9 - t * 0.04 + 5.2, ny * 0.9 + t * 0.06 + 1.3, 2)
      const f = fbm(nx + 2.8 * qx, ny + 2.8 * qy, 3)
      const v = (f - 0.3) * 2.6 * fadeY
      if (v > BAYER8[(gy & 7) * 8 + (gx & 7)]) (v > 0.85 ? deep : soft).rect(gx * cell, gy * cell, size, size)
    }
  }
  ctx.fillStyle = color
  ctx.globalAlpha = 0.78
  ctx.fill(soft)
  ctx.globalAlpha = 1
  ctx.fill(deep)
}

/* -------------------------------------------------------------------------- */
/*                               The particle cloud                           */
/* -------------------------------------------------------------------------- */

const N = 28000
const BINS = 8
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/** Unit directions over a sphere (Fibonacci lattice), a shell depth per dot and two stable random numbers. */
const BASE = (() => {
  const nx = new Float32Array(N)
  const ny = new Float32Array(N)
  const nz = new Float32Array(N)
  const sh = new Float32Array(N)
  const h1 = new Float32Array(N)
  const h2 = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) / N) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * GOLDEN
    nx[i] = Math.cos(a) * r
    ny[i] = y
    nz[i] = Math.sin(a) * r
    h1[i] = hash(i, 7)
    h2[i] = hash(i, 91)
    // Most dots sit on the surface, some deeper inside so the crater shows a dense core.
    sh[i] = 1 - 0.5 * h1[i] * h1[i] * h1[i]
  }
  return { nx, ny, nz, sh, h1, h2 }
})()

// The crater axis in object space: up, leaning a little toward the viewer.
const CAX = (() => {
  const x = 0.12
  const y = 0.6
  const z = 0.8
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l] as const
})()

const PX = new Float32Array(N)
const PY = new Float32Array(N)
const PS = new Float32Array(N)
const PB = new Uint8Array(N)
const BIN_COUNT = new Uint32Array(BINS)
const BIN_START = new Uint32Array(BINS + 1)
const BIN_FILL = new Uint32Array(BINS)
const ORDER = new Uint32Array(N)

/** Paint one frame of the particle brain. `w` and `h` are CSS pixels. */
function paintCloud(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, t: number, color: string) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const R = Math.min(w, h) * 0.4
  const cam = R * 4
  const k = Math.min(1.5, Math.max(0.8, Math.min(w, h) / 420))
  const cx = w / 2
  const cy = h * 0.5
  const yaw = 0.5 * Math.sin(t * 0.12) + 0.1
  const cyaw = Math.cos(yaw)
  const syaw = Math.sin(yaw)
  const tilt = 0.32
  const ct = Math.cos(tilt)
  const st = Math.sin(tilt)
  const breathe = 1 + 0.02 * Math.sin(t * 0.9)
  BIN_COUNT.fill(0)

  for (let i = 0; i < N; i++) {
    const bx = BASE.nx[i]
    const by = BASE.ny[i]
    const bz = BASE.nz[i]
    // Swirl: turn each latitude ring by an angle that drifts with time – this shears the surface into twisting bands.
    const sw = 0.85 * Math.sin(by * 2.6 + t * 0.35) + 0.5 * Math.sin(by * 5.1 - t * 0.5 + 1.3)
    const cs = Math.cos(sw)
    const sn = Math.sin(sw)
    const wx = bx * cs + bz * sn
    const wz = -bx * sn + bz * cs
    // Ridges: crests where a warped sine crosses zero.
    const g1 = Math.sin(wx * 4.2 + Math.sin(by * 3.3 + t * 0.4) * 1.6 + t * 0.25)
    const g2 = Math.sin(wz * 5.1 - by * 2.2 - t * 0.3 + g1 * 1.3)
    const ridge = 1 - Math.abs(g2)
    let r = BASE.sh[i] * (1 + 0.025 * g1 + 0.045 * ridge)

    // Crater with a rim, and brain waves rolling out of it.
    const dc = wx * CAX[0] + by * CAX[1] + wz * CAX[2]
    const ang = Math.acos(dc > 1 ? 1 : dc < -1 ? -1 : dc)
    const cd = smooth((dc - 0.7) / 0.3)
    r *= 1 - 0.24 * cd
    r += 0.045 * Math.exp(-(((dc - 0.7) / 0.07) ** 2))
    r += 0.03 * Math.sin(ang * 8 - t * 1.8) * Math.exp(-ang * 0.9)
    // A fuzzy halo of stray dots.
    const stray = BASE.h2[i] > 0.93
    if (stray) r *= 1.02 + 0.1 * BASE.h1[i]
    r *= breathe * R

    const x1 = wx * r
    const y1 = by * r
    const z1 = wz * r
    // View: yaw around the vertical axis, tilt toward the camera.
    const x2 = x1 * cyaw + z1 * syaw
    const z2 = -x1 * syaw + z1 * cyaw
    const y3 = y1 * ct - z2 * st
    const z3 = y1 * st + z2 * ct
    const persp = cam / (cam - z3)

    let a = 0.06 + 0.94 * Math.pow((z3 / R + 1) / 2, 1.7)
    // Dense on the crests, sparse in the valleys; the smooth threshold lets dots fade rather than pop.
    a *= smooth((0.15 + 0.95 * ridge * ridge - BASE.h2[i]) * 3 + 0.5) * 0.85 + 0.15
    a *= 1 + 1.1 * cd
    if (by < -0.1) a *= 1 + 0.35 * Math.sin(Math.atan2(wz, wx) * 22 + t * 0.2) * smooth((-by - 0.1) / 0.5)
    if (stray) a *= 0.55
    PX[i] = cx + x2 * persp
    PY[i] = cy + y3 * persp
    PS[i] = (0.7 + 0.3 * ridge + 0.5 * cd) * k * persp
    const b = Math.min(BINS - 1, Math.max(0, Math.floor(a * 1.1 * BINS)))
    PB[i] = b
    BIN_COUNT[b]++
  }
  // Counting sort by alpha bin, then one Path2D fill per bin.
  let off = 0
  for (let b = 0; b < BINS; b++) {
    BIN_START[b] = off
    off += BIN_COUNT[b]
  }
  BIN_START[BINS] = off
  BIN_FILL.set(BIN_START.subarray(0, BINS))
  for (let i = 0; i < N; i++) ORDER[BIN_FILL[PB[i]]++] = i
  ctx.fillStyle = color
  for (let b = 0; b < BINS; b++) {
    if (BIN_START[b] === BIN_START[b + 1]) continue
    const p = new Path2D()
    for (let j = BIN_START[b]; j < BIN_START[b + 1]; j++) {
      const i = ORDER[j]
      const s = PS[i]
      p.rect(PX[i] - s / 2, PY[i] - s / 2, s, s)
    }
    ctx.globalAlpha = 0.14 + (0.86 * (b + 1)) / BINS
    ctx.fill(p)
  }
  ctx.globalAlpha = 1
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

type Cursor = { l: number; c: number }

/**
 * NeuralPanels – two calm editorial cards: dithered terrain with a typing log, and a particle
 * "brain" that pulses in waves. Everything is canvas and text, no images.
 *
 *   <NeuralPanels accent="#5b5bd6" />
 */
export function NeuralPanels({
  speed = 1,
  paused,
  accent,
  label = "Two panels: a dithered terrain with a live system log, and a particle cloud mapping neural activity",
  className,
  leftTitle = "System Architecture",
  leftChip = "export_report",
  title = "Active Orchestration",
  description = "Continuous monitoring of every agent run, tool call and handoff across your workspace.",
  log = DEFAULT_LOG,
  logFooter = "↳ Review audit trail",
  rightTitle = "Node Inspector",
  rightChip = "Neural Mapping",
  summary = "Real-time reasoning, drawn as it happens. Follow active pathways and watch the latent space settle.",
  status = "Routing sequence stable.",
  note = "Summarising context across 88 parameters. Agents are resolving the next step with no added latency.",
  rightFooter = "↳ Inspect latent map",
}: NeuralPanelsProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const terrainRef = React.useRef<HTMLCanvasElement>(null)
  const cloudRef = React.useRef<HTMLCanvasElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)

  // Latest props for the loops – changing them never restarts the scene.
  const live = React.useRef({ speed: Math.max(0.05, speed), paused: !!paused, reduced })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { speed: Math.max(0.05, speed), paused: !!paused, reduced }
    ctl.current?.update()
  }, [speed, paused, reduced, accent])

  /* Canvas loop: terrain and cloud share one requestAnimationFrame. */
  React.useEffect(() => {
    const root = rootRef.current
    const tc = terrainRef.current
    const cc = cloudRef.current
    const tctx = tc?.getContext("2d")
    const cctx = cc?.getContext("2d")
    if (!root || !tc || !cc || !tctx || !cctx) return

    let raf = 0
    let last = 0
    let lastTerrain = 0
    let lastCloud = 0
    let visible = true
    let t = 5 // the first frame is also the reduced-motion still
    let dpr = 1
    const size = { tw: 0, th: 0, cw: 0, ch: 0 }
    let tcolor = "#5b5bd6"
    let ccolor = "#2a2a7a"
    let frame = 0

    const readColors = () => {
      tcolor = getComputedStyle(tc).color || tcolor
      ccolor = getComputedStyle(cc).color || ccolor
    }
    const drawCloud = () => {
      if (size.cw && size.ch) paintCloud(cctx, size.cw, size.ch, dpr, t, ccolor)
    }
    const drawTerrain = () => {
      if (size.tw && size.th) paintTerrain(tctx, size.tw, size.th, dpr, t, tcolor)
    }
    const shouldRun = () => visible && !live.current.paused && !live.current.reduced && !document.hidden
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      t += dt * live.current.speed
      if (frame++ % 60 === 0) readColors()
      if (now - lastCloud >= 30) {
        lastCloud = now
        drawCloud()
      }
      if (now - lastTerrain >= 50) {
        lastTerrain = now
        drawTerrain()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      readColors()
      if (shouldRun()) {
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
        return
      }
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      drawTerrain()
      drawCloud()
    }
    ctl.current = { update }

    const fit = (c: HTMLCanvasElement, w: number, h: number) => {
      c.width = Math.max(1, Math.round(w * dpr))
      c.height = Math.max(1, Math.round(h * dpr))
    }
    const ro = new ResizeObserver(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const a = tc.getBoundingClientRect()
      const b = cc.getBoundingClientRect()
      size.tw = a.width
      size.th = a.height
      size.cw = b.width
      size.ch = b.height
      fit(tc, a.width, a.height)
      fit(cc, b.width, b.height)
      update()
    })
    ro.observe(tc)
    ro.observe(cc)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(update) // dark-mode switches repaint even while paused
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)

    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  /* Terminal typing: one timer chain, paused and resumed from where it stopped. */
  const [cur, setCur] = React.useState<Cursor>(() => (paused ? { l: log.length, c: 0 } : { l: 0, c: 0 }))
  const curRef = React.useRef<Cursor>(cur)
  const logRef = React.useRef(log)
  React.useEffect(() => {
    logRef.current = log
  }, [log])
  React.useEffect(() => {
    if (paused || reduced) return
    let id = 0
    const step = () => {
      const lines = logRef.current
      const p = curRef.current
      const s = live.current.speed
      let next: Cursor
      let delay: number
      if (p.l >= lines.length) {
        // Finished: hold the full log for a while, then clear and type it again.
        next = { l: 0, c: 0 }
        delay = 700
      } else if (p.c >= lines[p.l].text.length) {
        next = { l: p.l + 1, c: 0 }
        delay = p.l + 1 >= lines.length ? 3600 : 420
      } else {
        next = { l: p.l, c: p.c + 1 }
        delay = 24 + (hash(p.l, p.c) < 0.12 ? 70 : 0)
      }
      curRef.current = next
      setCur(next)
      id = window.setTimeout(step, delay / s)
    }
    id = window.setTimeout(step, 500 / live.current.speed)
    return () => window.clearTimeout(id)
  }, [paused, reduced])

  const shown: Cursor = reduced ? { l: log.length, c: 0 } : cur
  const style = { "--np-speed": Math.max(0.05, speed), ...(accent ? { "--np-accent": accent } : null) } as React.CSSProperties
  const done = shown.l >= log.length

  return (
    <div ref={rootRef} className={className ? `np ${className}` : "np"} data-paused={paused || undefined} style={style} role="img" aria-label={label}>
      <style href="pane-neural-panels" precedence="default">
        {CSS}
      </style>
      <div className="np-grid" aria-hidden>
        <section className="np-card np-left">
          <div className="np-head">
            <b>{leftTitle}</b>
            <span className="np-chip">{leftChip}</span>
          </div>
          <div className="np-terrain">
            <canvas ref={terrainRef} />
          </div>
          <div className="np-copy">
            <h3 className="np-title">{title}</h3>
            <p className="np-desc">{description}</p>
          </div>
          <div className="np-box">
            {log.map((line, i) => {
              const n = i < shown.l ? line.text.length : i === shown.l ? shown.c : 0
              const active = i === shown.l || (done && i === log.length - 1)
              return (
                <span key={i} className="np-line" data-tone={line.tone ?? "blue"}>
                  {line.text.slice(0, n)}
                  {active && !reduced && <i className="np-caret" />}
                  <span className="np-rest">{line.text.slice(n)}</span>
                </span>
              )
            })}
            <span className="np-foot">{logFooter}</span>
          </div>
        </section>

        <section className="np-card np-right">
          <div className="np-head">
            <b>{rightTitle}</b>
            <span className="np-chip">{rightChip}</span>
          </div>
          <p className="np-sum">{summary}</p>
          <div className="np-well">
            <canvas ref={cloudRef} />
          </div>
          <div className="np-box">
            <span className="np-line np-ok">{status}</span>
            <p className="np-note">{note}</p>
            <span className="np-foot">{rightFooter}</span>
          </div>
        </section>
      </div>
    </div>
  )
}

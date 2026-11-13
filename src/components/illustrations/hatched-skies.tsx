"use client"

import * as React from "react"

import { rng } from "@/studio/schema"
import type { StudioPieceProps, Values } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type HatchedSkiesProps = StudioPieceProps & {
  /** Small mono line above the headline. */
  eyebrow?: string
  /** The headline the clouds drift behind. */
  headline?: string
  /** One line under the headline. */
  description?: string
  /** Label of the button that sends the back cloud under the front one. */
  passLabel?: string
  /** Number of clouds, 3 to 7. Default 5. */
  clouds?: number
  /** Gap between ticks in px at the designed size, 3 to 10. Default 5. */
  spacing?: number
  /** Tick line weight in px at the designed size. Default 1.1. */
  weight?: number
  /** Ambient sway in px per second, 0 to 3. Default 1.6. */
  drift?: number
  /** Band height in px. Default 340. */
  height?: number
  /** Called when the back cloud has finished sliding under the front one. */
  onPass?: () => void
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                         Drawing (pure, shared with Studio)                  */
/* -------------------------------------------------------------------------- */

/** Seconds in one seamless loop. The back cloud slides under the front one and returns. */
export const LOOP = 24

type Cfg = {
  ink: string
  accent: string
  paper: string
  clouds: number
  spacing: number
  weight: number
  drift: number
  swap: number
  room: number
  seed: number
}

const DEFAULTS: Cfg = {
  ink: "#1b1d22",
  accent: "",
  paper: "",
  clouds: 5,
  spacing: 3.4,
  weight: 0.95,
  drift: 1.6,
  swap: 1,
  room: 0.14,
  seed: 7,
}

function cfgOf(v: Values | undefined): Cfg {
  const o = { ...DEFAULTS }
  if (!v) return o
  for (const k of Object.keys(DEFAULTS) as (keyof Cfg)[]) {
    const x = v[k]
    if (typeof DEFAULTS[k] === "number" && typeof x === "number" && Number.isFinite(x)) (o[k] as number) = x
    else if (typeof DEFAULTS[k] === "string" && typeof x === "string") (o[k] as string) = x
  }
  o.clouds = Math.round(Math.min(7, Math.max(3, o.clouds)))
  o.room = Math.min(0.6, Math.max(0, o.room))
  return o
}

const smooth = (v: number) => {
  const c = v < 0 ? 0 : v > 1 ? 1 : v
  return c * c * c * (c * (c * 6 - 15) + 10)
}
const win = (t: number, a: number, b: number) => smooth((t - a) / (b - a))

function hash(a: number, b: number) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Clouds are wider than tall: unit space is stretched this much sideways. */
const ASP = 1.4

type Bump = { x: number; y: number; r: number }
type Cloud = {
  z: number
  bumps: Bump[]
  half: number
  hx: number
  base: number
  size: number
  rise: number
  phase: number
  bow: number
  id: number
}

/** The silhouette: the top edge is the lowest-y of a row of overlapping circles whose lower halves are cut by a flat base. */
function topAt(c: Cloud, lx: number): number {
  let top = Infinity
  for (const b of c.bumps) {
    const d = lx - b.x
    if (d > -b.r && d < b.r) {
      const y = b.y - Math.sqrt(b.r * b.r - d * d)
      if (y < top) top = y
    }
  }
  return top
}

function makeClouds(n: number, seed: number): Cloud[] {
  const out: Cloud[] = []
  for (let i = 0; i < n; i++) {
    const r = rng(seed * 131 + i * 7919 + 11)
    const z = n === 1 ? 1 : i / (n - 1)
    const count = 7 + Math.floor(r() * 3)
    const bumps: Bump[] = []
    const w = 1 // unit cloud: half-width 1, height ~0.46
    for (let k = 0; k < count; k++) {
      const u = (k + 0.5) / count
      const prof = Math.pow(Math.sin(Math.PI * u), 0.75)
      const rad = (0.13 + 0.26 * prof) * (0.7 + 0.6 * r())
      bumps.push({ x: (u * 2 - 1) * w * 0.86 + (r() - 0.5) * 0.08, y: -rad * (0.42 + 0.14 * r()), r: rad })
    }
    // One taller bump leaning off centre gives each cloud its own silhouette.
    const big = bumps[1 + Math.floor(r() * (count - 2))]
    big.r *= 1.55
    big.y = -big.r * 0.45
    const cloud: Cloud = {
      z,
      bumps,
      half: 1.05,
      hx: 0,
      base: 0,
      size: 1,
      rise: 0,
      phase: r() * 6.283,
      bow: 0.8 + r() * 1.4,
      id: i,
    }
    let rise = 0
    for (let q = 0; q <= 60; q++) {
      const tp = topAt(cloud, (q / 60) * 2 - 1)
      if (isFinite(tp)) rise = Math.max(rise, -tp)
    }
    cloud.rise = rise || 0.5
    out.push(cloud)
  }
  return out
}

/**
 * Paint one frame. Deterministic in (w, h, t, values): the tick columns live in each cloud's own
 * space, so they travel with the cloud and never reshuffle between frames.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, values?: Values) {
  const c = cfgOf(values)
  t = ((t % LOOP) + LOOP) % LOOP
  if (c.paper) {
    ctx.fillStyle = c.paper
    ctx.fillRect(0, 0, w, h)
  }
  const u = Math.max(0.7, Math.min(w, h * 2.2) / 760)
  const cl = makeClouds(c.clouds, c.seed)
  const n = cl.length
  const F = cl[n - 1] // front cloud
  const P = cl[n - 2] // the one that slides under it

  // Layout. The top `room` of the frame is left clear for the headline; clouds fill the sky below it.
  // The front cloud is the largest with a clear base, the sliding cloud crosses it in the middle band.
  const skyTop = h * c.room
  const base0 = h * 0.86
  const S = base0 - skyTop
  const homes = [0.12, 0.88, 0.3, 0.7, 0.04, 0.96, 0.5]
  F.size = Math.min((w * 0.44) / (ASP * 1.05), (S * 0.94) / F.rise)
  F.base = base0
  F.hx = w * 0.5
  P.size = Math.min(F.size * 0.8, (S * 0.7) / P.rise)
  P.base = base0 - S * 0.3
  P.hx = w * 0.24
  for (let i = 0; i < n - 2; i++) {
    const k = cl[i]
    k.size = Math.min(F.size * (0.5 + 0.3 * k.z), (S * 0.55) / k.rise)
    const lowest = Math.min(base0 - S * 0.2, skyTop + k.rise * k.size + S * (0.1 + 0.3 * hash(i, c.seed)))
    k.base = Math.max(lowest, skyTop + k.rise * k.size)
    k.hx = w * homes[i % homes.length]
  }
  // Every cloud keeps ambient sway (periodic, so the loop is seamless), P also takes the slide.
  const dist = w * 0.54
  const slide = win(t / LOOP, 0.12, 0.5) - win(t / LOOP, 0.62, 0.98)
  const amp = (c.drift * LOOP) / (2 * Math.PI)
  const pos = (k: Cloud) =>
    k.hx + amp * u * Math.sin((2 * Math.PI * t) / LOOP + k.phase) * (0.4 + k.z) + (k === P ? dist * slide : 0)


  const order = cl.slice().sort((a, b) => a.z - b.z)
  const xs = new Map<Cloud, number>()
  for (const k of cl) xs.set(k, pos(k))

  const coverBy = (o: Cloud, x: number, y0: number, y1: number) => {
    const ox = xs.get(o) as number
    const lx = (x - ox) / (o.size * ASP)
    if (lx < -o.half || lx > o.half) return 0
    const top = topAt(o, lx)
    if (!isFinite(top) || top >= 0) return 0
    const T = o.base + top * o.size
    let s = 0
    for (let q = 0; q < 3; q++) {
      const y = y0 + ((y1 - y0) * (q + 0.5)) / 3
      if (y > T && y < o.base) s++
    }
    return s / 3
  }

  for (const k of order) {
    const cx = xs.get(k) as number
    const spacing = c.spacing * u * (1.4 - 0.4 * k.z)
    const lw = c.weight * u * (0.8 + 0.3 * k.z)
    const hero = k === F
    const color = hero && c.accent ? c.accent : c.ink
    const baseAlpha = 0.3 + 0.62 * k.z
    const bins: Path2D[] = Array.from({ length: 7 }, () => new Path2D())
    const used = new Array<boolean>(7).fill(false)
    const sx = k.size * ASP
    const lo = Math.floor((-k.half * sx) / spacing)
    const hi = Math.ceil((k.half * sx) / spacing)
    for (let col = lo; col <= hi; col++) {
      for (let pass = 0; pass < 2; pass++) {
        // pass 1 = the extra half-step ticks that only appear where this cloud lies over a farther one
        const lxPx = (col + (pass ? 0.5 : 0)) * spacing
        const lx = lxPx / sx
        if (lx < -k.half || lx > k.half) continue
        const top = topAt(k, lx)
        if (!isFinite(top) || top >= -0.012) continue
        const wx = cx + lxPx
        const j1 = hash(col * 2 + pass + 1, k.id + c.seed * 17)
        const j2 = hash(col * 2 + pass + 9, k.id + c.seed * 31)
        const j3 = hash(col * 2 + pass + 5, k.id + 3)
        const y0 = k.base + top * k.size + (1 + 2 * j1) * u
        const avail = k.base - y0
        if (avail < 3 * u) continue
        // Ticks hang from the top edge; most reach the base, some stop short so the underside frays.
        const frac = j2 < 0.55 ? 1 : 0.45 + 0.55 * j2
        const y1 = y0 + avail * frac - 1.2 * u * j3
        let a = baseAlpha * (0.78 + 0.22 * j3)
        if (c.swap > 0) {
          let under = 0
          let over = 0
          for (const o of cl) {
            if (o === k) continue
            const cv = coverBy(o, wx, y0, y1)
            if (cv > 0) {
              if (o.z > k.z) under = Math.max(under, cv)
              else over = Math.max(over, cv)
            }
          }
          if (pass === 1) {
            a *= over * c.swap * 1.35
            if (a <= 0.01) continue
          } else if (under > 0) {
            // Hidden behind a nearer cloud: every second tick drops out, the rest fade.
            const odd = ((col % 2) + 2) % 2
            a *= 1 - under * c.swap * (odd ? 0.97 : 0.7)
          }
        }
        const b = Math.max(0, Math.min(6, Math.round(a * 8.4) - 1))
        used[b] = true
        const bowx = (j1 - 0.5) * 1.1 * u
        const p = bins[b]
        p.moveTo(wx, y0)
        p.quadraticCurveTo(wx + bowx, (y0 + y1) / 2, wx + bowx * 0.4, y1)
      }
    }
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.lineCap = "round"
    for (let b = 0; b < 7; b++) {
      if (!used[b]) continue
      ctx.globalAlpha = Math.min(1, (b + 1) / 8.4)
      ctx.stroke(bins[b])
    }
    ctx.globalAlpha = 1
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.hsk {
  --hsk-ink: #000;
  --hsk-surface: #fff;
  --hsk-accent: #0060e2;
  --hsk-t1: color-mix(in oklab, var(--hsk-ink) 88%, transparent);
  --hsk-t2: color-mix(in oklab, var(--hsk-ink) 61%, transparent);
  --hsk-t3: color-mix(in oklab, var(--hsk-ink) 45%, transparent);
  --hsk-fill: color-mix(in oklab, var(--hsk-ink) 6%, transparent);
  --hsk-line: color-mix(in oklab, var(--hsk-ink) 8%, transparent);
  --hsk-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --hsk-ease: cubic-bezier(.22, 1, .36, 1);
  --hsk-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --hsk-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
  --hsk-radius: 22px;
  position: relative; container-type: inline-size; width: 100%; max-width: 1000px;
  font: 13px/20px var(--hsk-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--hsk-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .hsk {
  --hsk-ink: #fff;
  --hsk-surface: #161618;
  --hsk-accent: #7aa7ff;
  --hsk-t1: color-mix(in oklab, var(--hsk-ink) 90%, transparent);
  --hsk-t2: color-mix(in oklab, var(--hsk-ink) 62%, transparent);
  --hsk-t3: color-mix(in oklab, var(--hsk-ink) 46%, transparent);
  --hsk-fill: color-mix(in oklab, var(--hsk-ink) 8%, transparent);
  --hsk-line: color-mix(in oklab, var(--hsk-ink) 10%, transparent);
  --hsk-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .hsk {
  --hsk-ink: #000; --hsk-surface: #fff; --hsk-accent: #111; --hsk-shadow: 0 0 0 1px rgb(0 0 0 / .14); --hsk-radius: 4px;
  --hsk-ease: cubic-bezier(.2, .9, .1, 1); --hsk-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace; --hsk-serif: var(--hsk-font);
}
html[data-style="mono"].dark .hsk { --hsk-ink: #fff; --hsk-surface: #0a0a0a; --hsk-accent: #f2f2f2; --hsk-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .hsk {
  --hsk-ink: var(--pane-ink); --hsk-surface: var(--pane-solid); --hsk-accent: var(--pane-accent); --hsk-shadow: var(--pane-shadow);
  --hsk-ease: var(--pane-ease); --hsk-font: var(--pane-font);
  --hsk-t1: var(--pane-t1); --hsk-t2: var(--pane-t2); --hsk-t3: var(--pane-t3);
}
html[data-style="glass"] .hsk-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .hsk-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .hsk-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .hsk-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.hsk *, .hsk *::before, .hsk *::after { box-sizing: border-box }
:where(.hsk) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.hsk) p, :where(.hsk) h2 { margin: 0 }
.hsk button:focus-visible { outline: 2px solid var(--hsk-accent); outline-offset: 2px }
.hsk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.hsk-card { position: relative; overflow: hidden; isolation: isolate; height: var(--hsk-h, 460px); min-height: 360px; border-radius: var(--hsk-radius); background: var(--hsk-surface); box-shadow: var(--hsk-shadow) }
.hsk-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; color: var(--hsk-ink) }
.hsk-acc { position: absolute; width: 0; height: 0; overflow: hidden; color: var(--hsk-accent); pointer-events: none }
.hsk-copy { position: absolute; left: 50%; top: 32px; transform: translateX(-50%); width: min(100% - 48px, 620px); text-align: center; pointer-events: none }
.hsk-eye { font: 500 12px/16px var(--hsk-mono); letter-spacing: .02em; color: var(--hsk-t3) }
.hsk-h { margin-top: 12px; font: 400 clamp(30px, 8.2cqw, 54px)/1.02 var(--hsk-serif); letter-spacing: -.015em; color: var(--hsk-t1); text-wrap: balance }
.hsk-d { margin-top: 12px; font: 400 14px/20px var(--hsk-font, inherit); color: var(--hsk-t2); text-wrap: pretty }
.hsk-ctl { position: absolute; left: 0; right: 0; bottom: 14px; display: flex; justify-content: center; gap: 4px }
.hsk-b { height: 32px; padding: 0 12px; border-radius: 9px; color: var(--hsk-t2);
  transition: background-color .18s var(--hsk-ease), color .18s var(--hsk-ease), transform .18s var(--hsk-ease) }
.hsk-b:hover { background: var(--hsk-fill); color: var(--hsk-t1) }
.hsk-b:active { transform: scale(.97) }
@container (max-width: 520px) { .hsk-card { height: calc(var(--hsk-h, 460px) + 80px) } .hsk-copy { top: 24px } .hsk-d { font-size: 13px } }
@media (prefers-reduced-motion: reduce) { .hsk-b { transition: none } }
`

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

/** Loop time at which the back cloud sits half way under the front one: the still frame for reduced motion. */
const STILL = 0.31 * LOOP
const PASS_END = 0.56 * LOOP

/**
 * HatchedSkies – clouds drawn only with fine vertical ticks, drifting behind a headline. Every few
 * seconds the back cloud slides under the front one and the ticks swap density.
 *
 *   <HatchedSkies headline="Clear by noon" />
 */
export function HatchedSkies({
  speed = 1,
  paused,
  accent,
  values,
  seed,
  size,
  time,
  canvasRef,
  eyebrow = "Forecast · updated 06:40",
  headline = "Clear skies by noon",
  description = "Atlas checked 214 stations and moved tonight's three deliveries out of the storm window.",
  passLabel = "Let a cloud pass",
  clouds,
  spacing,
  weight,
  drift,
  height = 460,
  onPass,
  label = "Fine vertical ticks draw drifting clouds behind a headline. One cloud slides under another and the ticks thin out where it passes.",
  className,
}: HatchedSkiesProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const cvRef = React.useRef<HTMLCanvasElement | null>(null)
  const accRef = React.useRef<HTMLElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const [msg, setMsg] = React.useState("")

  const setCanvas = React.useCallback(
    (el: HTMLCanvasElement | null) => {
      cvRef.current = el
      if (typeof canvasRef === "function") canvasRef(el)
      else if (canvasRef) Object.assign(canvasRef, { current: el })
    },
    [canvasRef],
  )

  // Latest inputs for the loop; changing them never restarts it.
  const merged = React.useMemo<Values>(
    () => ({
      ...values,
      ...(accent ? { accent } : null),
      ...(seed !== undefined ? { seed } : null),
      ...(clouds !== undefined ? { clouds } : null),
      ...(spacing !== undefined ? { spacing } : null),
      ...(weight !== undefined ? { weight } : null),
      ...(drift !== undefined ? { drift } : null),
    }),
    [values, accent, seed, clouds, spacing, weight, drift],
  )
  const live = React.useRef({ speed: Math.max(0.05, speed), paused: !!paused, reduced, time, merged, onPass })
  // The scene clock: auto = loops on its own until the first interaction; manual = driven by the button only.
  const sim = React.useRef({ t: 0, mode: "auto" as "auto" | "manual", to: -1 })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { speed: Math.max(0.05, speed), paused: !!paused, reduced, time, merged, onPass }
    ctl.current?.update()
  }, [speed, paused, reduced, time, merged, onPass])

  React.useEffect(() => {
    const root = rootRef.current
    const cv = cvRef.current
    const ctx = cv?.getContext("2d")
    if (!root || !cv || !ctx) return
    let raf = 0
    let last = 0
    let visible = true
    let dpr = 1
    let cw = 0
    let ch = 0
    let ink = ""
    let acc = ""
    let frame = 0

    const readColors = () => {
      ink = getComputedStyle(cv).color
      acc = accRef.current ? getComputedStyle(accRef.current).color : ink
    }
    const paint = () => {
      if (!cw || !ch) return
      const L = live.current
      const t = L.time !== undefined ? L.time : L.reduced ? STILL : sim.current.t
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, ch)
      const sty = document.documentElement.dataset.style
      const flat = sty === "mono" || sty === "glass"
      const hasAccent = !flat && typeof L.merged.accent === "string" && L.merged.accent
      draw(ctx, cw, ch, t, { ink, room: cw < 520 ? 0.42 : 0.4, ...L.merged, accent: hasAccent ? L.merged.accent : flat ? "" : acc })
    }
    const running = () => visible && !document.hidden && live.current.time === undefined && !live.current.reduced && !live.current.paused
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      const s = sim.current
      const sp = live.current.speed
      if (s.mode === "auto") s.t = (s.t + dt * sp) % LOOP
      else if (s.to >= 0) {
        // Manual pass: advance to the target, then hold for good.
        const nt = s.t + dt * sp
        if (nt >= s.to) {
          const done = s.to
          s.t = done >= LOOP ? 0 : done
          s.to = -1
          if (done < LOOP) live.current.onPass?.()
        } else s.t = nt
      }
      if (frame++ % 90 === 0) readColors()
      paint()
      if (running() && (s.mode === "auto" || s.to >= 0)) raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!raf && running()) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const resize = () => {
      const r = cv.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      cw = r.width
      ch = r.height
      cv.width = Math.max(1, Math.round(cw * dpr))
      cv.height = Math.max(1, Math.round(ch * dpr))
      readColors()
      paint()
    }
    ctl.current = {
      update: () => {
        readColors()
        paint()
        if (running()) start()
        else stop()
      },
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    const io = new IntersectionObserver((e) => {
      visible = e[e.length - 1].isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(root)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener("visibilitychange", onVis)
    // Theme or style switches change the ink variable; repaint when the document class or attributes change.
    const mo = new MutationObserver(() => ctl.current?.update())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-style", "data-theme"] })
    resize()
    start()
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      ctl.current = null
    }
  }, [])

  // Any touch of the piece ends the built-in demo for good.
  const claim = () => {
    const s = sim.current
    if (s.mode === "auto") {
      s.mode = "manual"
      s.to = -1
    }
  }
  const pass = () => {
    claim()
    const s = sim.current
    if (s.to >= 0) return
    // Slide under if the clouds are apart, slide back if they have passed.
    s.to = s.t < PASS_END - 0.01 ? PASS_END : LOOP
    if (s.t >= PASS_END - 0.01 && s.t < LOOP) s.to = LOOP
    if (live.current.reduced || live.current.time !== undefined) {
      s.t = s.to >= LOOP ? 0 : s.to
      s.to = -1
      ctl.current?.update()
    } else ctl.current?.update()
    setMsg(s.to >= LOOP ? "The cloud slides back." : "The back cloud slides under the front one.")
  }

  const style = { "--hsk-h": `${size ? size.h : height}px`, ...(size ? { width: size.w, maxWidth: "none" } : null) } as React.CSSProperties
  return (
    <div
      ref={rootRef}
      className={["hsk", className].filter(Boolean).join(" ")}
      style={style}
      role="group"
      aria-label={label}
      onPointerDown={claim}
      onKeyDown={claim}
    >
      <style href="hatched-skies" precedence="default">
        {CSS}
      </style>
      <div className="hsk-card">
        <canvas ref={setCanvas} className="hsk-cv" aria-hidden="true" />
        <i ref={accRef} className="hsk-acc" aria-hidden="true" />
        <div className="hsk-copy">
          <p className="hsk-eye">{eyebrow}</p>
          <h2 className="hsk-h">{headline}</h2>
          <p className="hsk-d">{description}</p>
        </div>
        <div className="hsk-ctl">
          <button type="button" className="hsk-b" onClick={pass}>
            {passLabel}
          </button>
        </div>
      </div>
      <span className="hsk-sr" role="status" aria-live="polite">
        {msg}
      </span>
    </div>
  )
}

"use client"

import * as React from "react"

/**
 * Backdrop – the stage an illustration (or any hero piece) sits on.
 * Pick a background, tint it with an accent, slow it down or pause it.
 *
 *   <Backdrop variant="halftone" accent="#7c3aed">
 *     <IntegrationFlow />
 *   </Backdrop>
 */

/** The three knobs every illustration and motion piece accepts. */
export type StudioProps = {
  /** Motion speed multiplier – 1 is the designed pace. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour). */
  accent?: string
}

export const BACKDROP_VARIANTS = ["plain", "dots", "halftone", "grid", "drift", "floor", "aurora", "dither"] as const
export type BackdropVariant = (typeof BACKDROP_VARIANTS)[number]

export type BackdropProps = {
  /** Background style. Default "dots". */
  variant?: BackdropVariant
  /** Tint for halftone dots, the dither, the floor glow and the aurora. Any CSS color. */
  accent?: string
  /** Motion speed multiplier for animated variants (drift, floor, aurora, dither). Default 1. */
  speed?: number
  /** Freeze the background's motion. */
  paused?: boolean
  /** Minimum height of the stage in px. Default 360. */
  minHeight?: number
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const CSS = `
.bd { --bd-ink: #000; --bd-surface: #fafafa; --bd-accent: #0060e2; --bd-speed: 1;
  --bd-dot: color-mix(in oklab, var(--bd-ink) 14%, transparent);
  --bd-line: color-mix(in oklab, var(--bd-ink) 7%, transparent);
  position: relative; isolation: isolate; overflow: hidden; display: grid; place-items: center;
  background: var(--bd-surface); border-radius: inherit; width: 100%; }
:is(.dark, [data-theme="dark"]) .bd { --bd-ink: #fff; --bd-surface: #121214;
  --bd-dot: color-mix(in oklab, var(--bd-ink) 16%, transparent);
  --bd-line: color-mix(in oklab, var(--bd-ink) 7%, transparent); }
.bd > .bd-layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.bd > .bd-content { position: relative; width: 100%; display: grid; place-items: center; }

/* Dots: an even dot grid that fades out toward the edges. */
.bd[data-variant="dots"] > .bd-layer {
  background-image: radial-gradient(circle at center, var(--bd-dot) 1px, transparent 1.4px);
  background-size: 16px 16px; background-position: center;
  mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%); }

/* Halftone: tinted dots that gather at the edges and leave the centre clean. */
.bd[data-variant="halftone"] { --bd-surface: color-mix(in oklab, var(--bd-accent) 3%, #fbfbfd); }
:is(.dark, [data-theme="dark"]) .bd[data-variant="halftone"] { --bd-surface: color-mix(in oklab, var(--bd-accent) 6%, #111114); }
.bd[data-variant="halftone"] > .bd-layer {
  background-image: radial-gradient(circle at center, color-mix(in oklab, var(--bd-accent) 42%, transparent) 1.1px, transparent 1.5px);
  background-size: 7px 7px; background-position: center;
  mask-image: radial-gradient(ellipse 62% 58% at 50% 50%, transparent 35%, rgb(0 0 0 / .55) 75%, #000 100%);
  -webkit-mask-image: radial-gradient(ellipse 62% 58% at 50% 50%, transparent 35%, rgb(0 0 0 / .55) 75%, #000 100%); }

/* Grid: fine lines, faded at the edges. Drift: the same grid sliding slowly. */
.bd:is([data-variant="grid"], [data-variant="drift"]) > .bd-layer {
  background-image: linear-gradient(var(--bd-line) 1px, transparent 1px), linear-gradient(90deg, var(--bd-line) 1px, transparent 1px);
  background-size: 32px 32px; background-position: center;
  mask-image: radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%); }
.bd[data-variant="drift"] > .bd-layer { inset: -32px; animation: bd-drift calc(14s / var(--bd-speed)) linear infinite; }
@keyframes bd-drift { from { transform: translate3d(0, 0, 0) } to { transform: translate3d(32px, 32px, 0) } }

/* Floor: a blurred colour pool that glows up from the bottom edge. */
.bd[data-variant="floor"] > .bd-layer { overflow: hidden; }
.bd[data-variant="floor"] > .bd-layer::before { content: ""; position: absolute; left: -10%; right: -10%; bottom: -38%; height: 78%;
  background:
    radial-gradient(40% 60% at 25% 60%, color-mix(in oklab, var(--bd-accent) 70%, transparent), transparent 70%),
    radial-gradient(38% 55% at 55% 70%, rgb(236 72 153 / .55), transparent 70%),
    radial-gradient(40% 60% at 80% 55%, rgb(139 92 246 / .55), transparent 70%);
  filter: blur(36px); transform-origin: 50% 100%;
  animation: bd-floor calc(7s / var(--bd-speed)) cubic-bezier(.45, 0, .55, 1) infinite alternate; }
@keyframes bd-floor { from { transform: scaleY(.86) translateX(-2%); opacity: .8 } to { transform: scaleY(1.08) translateX(2%); opacity: 1 } }

/* Aurora: soft blobs that wander behind the content. */
.bd[data-variant="aurora"] > .bd-layer::before, .bd[data-variant="aurora"] > .bd-layer::after { content: ""; position: absolute; width: 60%; aspect-ratio: 1; border-radius: 50%; filter: blur(60px); opacity: .5; }
.bd[data-variant="aurora"] > .bd-layer::before { left: -8%; top: -18%; background: color-mix(in oklab, var(--bd-accent) 75%, transparent);
  animation: bd-wander-a calc(16s / var(--bd-speed)) ease-in-out infinite alternate; }
.bd[data-variant="aurora"] > .bd-layer::after { right: -10%; bottom: -24%; background: rgb(236 72 153 / .6);
  animation: bd-wander-b calc(19s / var(--bd-speed)) ease-in-out infinite alternate; }
:is(.dark, [data-theme="dark"]) .bd[data-variant="aurora"] > .bd-layer::before,
:is(.dark, [data-theme="dark"]) .bd[data-variant="aurora"] > .bd-layer::after { opacity: .32; }
@keyframes bd-wander-a { to { transform: translate(28%, 22%) scale(1.15) } }
@keyframes bd-wander-b { to { transform: translate(-30%, -18%) scale(.9) } }

/* Dither: a canvas of ordered-dither dots from drifting noise, gathering toward the edges. */
.bd[data-variant="dither"] { --bd-surface: color-mix(in oklab, var(--bd-accent) 2.5%, #fbfbfd); }
:is(.dark, [data-theme="dark"]) .bd[data-variant="dither"] { --bd-surface: color-mix(in oklab, var(--bd-accent) 5%, #111114); }
.bd-dither { position: absolute; inset: 0; width: 100%; height: 100%; display: block; color: var(--bd-accent); opacity: .5; }
:is(.dark, [data-theme="dark"]) .bd-dither { color: color-mix(in oklab, var(--bd-accent) 58%, #fff); opacity: .36; }

.bd[data-paused] > .bd-layer, .bd[data-paused] > .bd-layer::before, .bd[data-paused] > .bd-layer::after { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .bd > .bd-layer, .bd > .bd-layer::before, .bd > .bd-layer::after { animation: none !important; }
}
`

/* Dither layer: one noise value per cell compared with a Bayer 4x4 threshold (kept inline so the backdrop stays self-contained). */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)
function dHash(x: number, y: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function dNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
  const a = dHash(xi, yi)
  const b = dHash(xi + 1, yi)
  const c = dHash(xi, yi + 1)
  const d = dHash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function dFbm(x: number, y: number, oct: number) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < oct; o++) {
    sum += amp * dNoise(x, y)
    norm += amp
    const nx = x * 1.6 - y * 1.2 + 11.3
    y = x * 1.2 + y * 1.6 + 3.7
    x = nx
    amp *= 0.5
  }
  return sum / norm
}
const dSmooth = (v: number) => {
  const c = v < 0 ? 0 : v > 1 ? 1 : v
  return c * c * (3 - 2 * c)
}
function paintDither(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, t: number, color: string) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const cell = Math.max(5, Math.ceil(Math.sqrt((w * h) / 45000)))
  const cols = Math.ceil(w / cell)
  const rows = Math.ceil(h / cell)
  const size = cell - 1.4
  const soft = new Path2D()
  const deep = new Path2D()
  for (let gy = 0; gy < rows; gy++) {
    const ny = (gy * cell) / 190 + 1.9
    const dy = ((gy + 0.5) / rows - 0.5) * 2
    for (let gx = 0; gx < cols; gx++) {
      const nx = (gx * cell) / 190 + 3.7
      const qx = dFbm(nx * 0.9 + t * 0.05, ny * 0.9 - t * 0.035, 2)
      const qy = dFbm(nx * 0.9 - t * 0.04 + 5.2, ny * 0.9 + t * 0.06 + 1.3, 2)
      let v = (dFbm(nx + 2.6 * qx, ny + 2.6 * qy, 3) - 0.42) * 2.2
      if (v <= 0) continue
      // Like the halftone: a clean middle, dots gathering toward the edges.
      const dx = ((gx + 0.5) / cols - 0.5) * 2
      v *= 0.02 + 0.98 * dSmooth((Math.hypot(dx, dy) - 0.45) / 0.5)
      if (v > BAYER4[(gy & 3) * 4 + (gx & 3)]) (v > 0.86 ? deep : soft).rect(gx * cell, gy * cell, size, size)
    }
  }
  ctx.fillStyle = color
  ctx.globalAlpha = 0.78
  ctx.fill(soft)
  ctx.globalAlpha = 1
  ctx.fill(deep)
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

function DitherLayer({ speed, paused }: { speed: number; paused?: boolean }) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const live = React.useRef({ speed, paused: !!paused, reduced })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { speed: Math.max(0.05, speed), paused: !!paused, reduced }
    ctl.current?.update()
  }, [speed, paused, reduced])

  React.useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    let raf = 0
    let last = 0
    let lastDraw = 0
    let visible = true
    let w = 0
    let h = 0
    let dpr = 1
    let t = 7
    let color = "#0060e2"
    const draw = () => {
      if (!w || !h) return
      color = getComputedStyle(canvas).color || color
      paintDither(ctx, w, h, dpr, t, color)
    }
    const shouldRun = () => visible && !live.current.paused && !live.current.reduced && !document.hidden
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      t += dt * live.current.speed
      if (now - lastDraw >= 40) {
        lastDraw = now
        draw()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
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
      draw()
    }
    ctl.current = { update }
    const parent = canvas.parentElement ?? canvas
    const resize = () => {
      const rect = parent.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      update()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    const io = new IntersectionObserver((e) => {
      visible = e[e.length - 1].isIntersecting
      update()
    })
    io.observe(parent)
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    resize()
    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  return <canvas ref={ref} className="bd-dither" />
}

export function Backdrop({ variant = "dots", accent, speed = 1, paused, minHeight = 360, className, style, children }: BackdropProps) {
  const vars = {
    ...(accent ? { "--bd-accent": accent } : null),
    "--bd-speed": Math.max(0.05, speed),
    minHeight,
    ...style,
  } as React.CSSProperties
  return (
    <div className={className ? `bd ${className}` : "bd"} data-variant={variant} data-paused={paused || undefined} style={vars}>
      <style href="pane-backdrop" precedence="default">
        {CSS}
      </style>
      {variant !== "plain" && (
        <div className="bd-layer" aria-hidden>
          {variant === "dither" && <DitherLayer speed={Math.max(0.05, speed)} paused={paused} />}
        </div>
      )}
      <div className="bd-content">{children}</div>
    </div>
  )
}

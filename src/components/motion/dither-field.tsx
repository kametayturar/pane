"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DitherPattern = "bayer4" | "bayer8"

export type DitherFieldProps = {
  /** Size of one dither cell in CSS px. Smaller is finer. Default 4. */
  cellSize?: number
  /** Threshold matrix: "bayer4" is bolder, "bayer8" is smoother. Default "bayer4". */
  pattern?: DitherPattern
  /** How much of the field is inked, 0–1. Default 0.55. */
  density?: number
  /** Dot colour (any CSS colour). Default indigo #5b5bd6; in dark mode it is lightened for you. */
  accent?: string
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Thin the dots out toward the edges so the field melts into its surroundings. Default true. */
  fade?: boolean
  className?: string
  style?: React.CSSProperties
  /** Rendered above the field, so the field can be a section background. */
  children?: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.df {
  --df-bg: #fbfbfd;
  --df-accent: #5b5bd6;
  --df-dot: var(--df-accent);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  background: var(--df-bg);
}
:is(.dark, [data-theme="dark"]) .df {
  --df-bg: #0f0f13;
  --df-dot: color-mix(in oklab, var(--df-accent) 58%, #fff);
}
.df *, .df *::before, .df *::after { box-sizing: border-box }
.df-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: -1; pointer-events: none; color: var(--df-dot) }
.df-content { position: relative; z-index: 0; width: 100%; height: 100% }
`

/* -------------------------------------------------------------------------- */
/*                         Ordered dither + value noise                       */
/* -------------------------------------------------------------------------- */

/** Bayer threshold matrix of size 2^bits, values in (0, 1). Built by interleaving the bits of x^y and y. */
function makeBayer(bits: number) {
  const n = 1 << bits
  const a = new Float32Array(n * n)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let v = 0
      for (let i = 0; i < bits; i++) v = (v << 2) | ((((x >> i) & 1) ^ ((y >> i) & 1)) << 1) | ((y >> i) & 1)
      a[y * n + x] = (v + 0.5) / (n * n)
    }
  }
  return { a, n }
}
const BAYER = { bayer4: makeBayer(2), bayer8: makeBayer(3) }

/** Integer-lattice hash → [0, 1). */
function hash(x: number, y: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Smooth value noise: random values on a lattice, blended with a quintic fade. */
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

/** Fractal noise: a few octaves, each rotated and doubled, normalised back to ~[0, 1]. */
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

/** Domain-warped noise: the lookup position is pushed around by two slower noises, which gives marbled, terrain-like folds. */
function terrain(x: number, y: number, t: number) {
  const qx = fbm(x * 0.9 + t * 0.05, y * 0.9 - t * 0.035, 2)
  const qy = fbm(x * 0.9 - t * 0.04 + 5.2, y * 0.9 + t * 0.06 + 1.3, 2)
  return fbm(x + 2.6 * qx, y + 2.6 * qy, 3)
}

const smooth = (v: number) => {
  const c = v < 0 ? 0 : v > 1 ? 1 : v
  return c * c * (3 - 2 * c)
}

const NOISE_SCALE = 170 // CSS px per noise unit – the size of the folds

type PaintOptions = {
  cell: number
  bay: { a: Float32Array; n: number }
  density: number
  t: number
  color: string
  /** 0–1 multiplier per position (u, v in 0–1). Lower values thin the dots out. */
  mask: ((u: number, v: number) => number) | null
}

/** Paint one dithered frame. `w` and `h` are CSS pixels. */
function paintDither(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, o: PaintOptions) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  // Keep the cell count sane on very large surfaces.
  const cell = Math.max(o.cell, Math.ceil(Math.sqrt((w * h) / 70000)))
  const cols = Math.ceil(w / cell)
  const rows = Math.ceil(h / cell)
  const gap = cell >= 4 ? 1.4 : cell >= 3 ? 1 : cell >= 2 ? 0.6 : 0
  const size = cell - gap
  const { a: bayer, n } = o.bay
  const mk = n - 1
  const thr = 0.58 - o.density * 0.55
  ctx.fillStyle = o.color

  const soft = new Path2D()
  const deep = new Path2D()
  for (let gy = 0; gy < rows; gy++) {
    const v01 = (gy + 0.5) / rows
    const ny = (gy * cell) / NOISE_SCALE + 1.9
    for (let gx = 0; gx < cols; gx++) {
      const nx = (gx * cell) / NOISE_SCALE + 3.7
      let v = (terrain(nx, ny, o.t) - thr) * 2.4
      if (v <= 0) continue
      if (o.mask) v *= o.mask((gx + 0.5) / cols, v01)
      if (v > bayer[(gy & mk) * n + (gx & mk)]) (v > 0.86 ? deep : soft).rect(gx * cell, gy * cell, size, size)
    }
  }
  ctx.globalAlpha = 0.78
  ctx.fill(soft)
  ctx.globalAlpha = 1
  ctx.fill(deep)
}

/** Edge mask: full strength inside, melting to nothing at all four edges. */
const edgeMask = (u: number, v: number) => smooth(Math.min(Math.min(u, 1 - u) / 0.16, Math.min(v, 1 - v) / 0.26))

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

/**
 * DitherField – a flowing, organic noise field drawn as an ordered-dither dot grid.
 * Use it as a living section background; children render above it.
 *
 *   <DitherField accent="#5b5bd6" className="h-[420px]">…</DitherField>
 */
export function DitherField({
  cellSize = 4,
  pattern = "bayer4",
  density = 0.55,
  accent,
  speed = 1,
  paused,
  fade = true,
  className,
  style,
  children,
}: DitherFieldProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)

  // Latest props for the animation loop – changing them never restarts the scene.
  const live = React.useRef({ cellSize, pattern, density, fade, speed: Math.max(0.05, speed), paused: !!paused, reduced })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { cellSize, pattern, density, fade, speed: Math.max(0.05, speed), paused: !!paused, reduced }
    ctl.current?.update()
  }, [cellSize, pattern, density, fade, speed, paused, reduced, accent])

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return

    let raf = 0
    let last = 0
    let lastDraw = 0
    let visible = true
    let w = 0
    let h = 0
    let dpr = 1
    let color = "#5b5bd6"
    let frame = 0
    let t = 7 // clock in seconds; the first frame is also the still frame for reduced motion

    const readColor = () => {
      color = getComputedStyle(canvas).color || color
    }
    const draw = () => {
      if (!w || !h) return
      if (frame++ % 30 === 0) readColor()
      const p = live.current
      paintDither(ctx, w, h, dpr, {
        cell: Math.max(2, Math.round(p.cellSize)),
        bay: BAYER[p.pattern] ?? BAYER.bayer4,
        density: Math.min(1, Math.max(0, p.density)),
        t,
        color,
        mask: p.fade ? edgeMask : null,
      })
    }
    const shouldRun = () => visible && !live.current.paused && !live.current.reduced && !document.hidden
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      t += dt * live.current.speed
      // The field moves slowly, so ~30 fps is plenty and keeps the CPU cost low.
      if (now - lastDraw >= 32) {
        lastDraw = now
        draw()
      }
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      readColor()
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

    const resize = () => {
      const rect = root.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      update()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(update) // dark-mode switches repaint even while paused
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

  const vars = { ...(accent ? { "--df-accent": accent } : null), ...style } as React.CSSProperties
  return (
    <div ref={rootRef} className={className ? `df ${className}` : "df"} style={vars}>
      <style href="pane-dither-field" precedence="default">
        {CSS}
      </style>
      <canvas ref={canvasRef} className="df-canvas" aria-hidden />
      {children !== undefined && <div className="df-content">{children}</div>}
    </div>
  )
}

"use client"

import * as React from "react"

/**
 * GradientFloor – a blurred colour gradient that glows up from the bottom edge of a section and breathes.
 * Two layers (colour + a soft white one) rise and fall against each other.
 *
 *   <GradientFloor accent="#ff7700" className="h-96">
 *     <h1>Start with a question</h1>
 *   </GradientFloor>
 */

export type GradientFloorProps = {
  /** Content rendered above the floor. */
  children?: React.ReactNode
  /** Gradient colours from the crest down, two to five. Default: accent, pink, blue. */
  colors?: string[]
  /** Accent colour – the crest colour when `colors` is not given. Any CSS colour. */
  accent?: string
  /** Motion speed multiplier – 1 is the designed pace (one morph every ~9 s). 0 keeps the shape still. */
  speed?: number
  /** Freeze the floor on the current frame. */
  paused?: boolean
  className?: string
  style?: React.CSSProperties
}

const VB_W = 1000
const VB_H = 400
const POINTS = 7

// Resting height of each control point (smaller y = higher crest), per layer.
const BASE_COLOR = [210, 168, 118, 96, 128, 172, 214]
const BASE_LIGHT = [262, 236, 208, 196, 214, 240, 266]
const AMP_COLOR = [26, 34, 30, 38, 30, 34, 26]
const AMP_LIGHT = [16, 22, 20, 24, 20, 22, 16]

/** A closed shape under a smooth curve through POINTS control points that bob up and down over time `t` (seconds). */
function floorPath(t: number, layer: "color" | "light") {
  const base = layer === "color" ? BASE_COLOR : BASE_LIGHT
  const amp = layer === "color" ? AMP_COLOR : AMP_LIGHT
  const shift = layer === "color" ? 0 : 1.15
  const pts: [number, number][] = []
  for (let i = 0; i < POINTS; i++) {
    const w = (Math.PI * 2) / (7.5 + (i % 3) * 1.7)
    const wob = Math.sin(t * w + i * 1.37 + shift) + 0.45 * Math.sin(t * w * 1.9 + i * 0.8 - shift)
    pts.push([(i / (POINTS - 1)) * VB_W, base[i] + (amp[i] * wob) / 1.45])
  }
  let d = `M${-VB_W * 0.2},${VB_H * 1.4} L${-VB_W * 0.2},${pts[0][1].toFixed(1)} L${pts[0][0]},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < POINTS - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    d += ` Q${x0.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`
  }
  const last = pts[POINTS - 1]
  d += ` L${last[0]},${last[1].toFixed(1)} L${VB_W * 1.2},${last[1].toFixed(1)} L${VB_W * 1.2},${VB_H * 1.4} Z`
  return d
}

const CSS = `
.gfl {
  --gfl-accent: #ff7700;
  --gfl-bg: transparent;
  --gfl-light: .8;
  position: relative; isolation: isolate; overflow: hidden; width: 100%; border-radius: inherit;
  background: var(--gfl-bg);
  font-family: var(--gfl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .gfl { --gfl-light: .22 }
.gfl *, .gfl *::before, .gfl *::after { box-sizing: border-box }
.gfl :focus-visible { outline: 2px solid color-mix(in oklab, var(--gfl-accent) 60%, transparent); outline-offset: 1px }

.gfl-content { position: relative; z-index: 1 }

.gfl-layer { position: absolute; left: -12%; right: -12%; pointer-events: none; z-index: 0 }
.gfl-layer svg { display: block; width: 100%; height: 100%; overflow: visible; will-change: transform }
.gfl-layer--color { top: 20%; bottom: -34%; filter: blur(34px) saturate(1.08) }
.gfl-layer--light { top: 30%; bottom: -38%; filter: blur(26px); mix-blend-mode: plus-lighter }
@media (prefers-reduced-motion: reduce) { .gfl *, .gfl *::before, .gfl *::after { animation: none !important; transition: none !important } }
`

const DEFAULT_REST = ["#ff0055", "#0073ff"]

export function GradientFloor({ children, colors, accent, speed = 1, paused, className, style }: GradientFloorProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const colorPathRef = React.useRef<SVGPathElement>(null)
  const lightPathRef = React.useRef<SVGPathElement>(null)
  const colorSvgRef = React.useRef<SVGSVGElement>(null)
  const lightSvgRef = React.useRef<SVGSVGElement>(null)
  const tRef = React.useRef(0) // morph clock in seconds; survives pause/resume
  const kRef = React.useRef(Math.max(0, speed))
  const uid = React.useId().replace(/\W/g, "")

  const stops = React.useMemo(() => {
    const list = colors && colors.length >= 2 ? colors.slice(0, 5) : [accent ?? "#ff7700", ...DEFAULT_REST]
    return list.map((c, i) => ({ c, offset: i / (list.length - 1) }))
  }, [colors, accent])

  React.useEffect(() => {
    kRef.current = Math.max(0, speed)
  }, [speed])

  // One rAF loop for both layers. It runs only while the floor is on screen, not paused and motion is allowed.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || paused) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    let last = 0
    let visible = true

    const draw = () => {
      const t = tRef.current
      colorPathRef.current?.setAttribute("d", floorPath(t, "color"))
      lightPathRef.current?.setAttribute("d", floorPath(t, "light"))
      // Both layers also drift sideways on the same beat; the light one a little less.
      const beat = (Math.PI * 2 * t) / 11
      if (colorSvgRef.current) colorSvgRef.current.style.transform = `translate3d(${(Math.sin(beat) * 3.4).toFixed(2)}%, 0, 0) scale(${(1 + 0.03 * Math.sin(beat + 1)).toFixed(3)}, 1)`
      if (lightSvgRef.current) lightSvgRef.current.style.transform = `translate3d(${(Math.sin(beat + 0.5) * 2.6).toFixed(2)}%, 0, 0)`
    }
    const frame = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      tRef.current += dt * kRef.current
      draw()
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (raf) return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting
        if (visible) start()
        else stop()
      })
      io.observe(root)
    }
    if (visible) start()
    return () => {
      io?.disconnect()
      stop()
    }
  }, [paused])

  const vars = { ...(accent ? { "--gfl-accent": accent } : null), ...style } as React.CSSProperties
  const gid = `gfl-${uid}`

  return (
    <div ref={rootRef} className={className ? `gfl ${className}` : "gfl"} style={vars} data-paused={paused || undefined}>
      <style href="pane-gradient-floor" precedence="default">
        {CSS}
      </style>
      <div className="gfl-layer gfl-layer--color" aria-hidden>
        <svg ref={colorSvgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1="96" x2="0" y2="330">
              {stops.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.c} />
              ))}
            </linearGradient>
          </defs>
          <path ref={colorPathRef} d={floorPath(0, "color")} fill={`url(#${gid})`} />
        </svg>
      </div>
      <div className="gfl-layer gfl-layer--light" aria-hidden style={{ opacity: "var(--gfl-light)" }}>
        <svg ref={lightSvgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
          <path ref={lightPathRef} d={floorPath(0, "light")} fill="#fff" />
        </svg>
      </div>
      <div className="gfl-content">{children}</div>
    </div>
  )
}

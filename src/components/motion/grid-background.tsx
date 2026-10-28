"use client"

import * as React from "react"

/**
 * GridBackground – a fine line grid that drifts slowly behind your content,
 * fades out toward the edges and lights up a few cells now and then.
 *
 *   <GridBackground size={48} direction="diagonal">
 *     <section>…hero…</section>
 *   </GridBackground>
 */

export type GridDirection = "up" | "down" | "left" | "right" | "diagonal"

export type GridBackgroundProps = {
  /** Content rendered above the grid. */
  children?: React.ReactNode
  /** Cell size in px. Default 48. */
  size?: number
  /** Line colour. Defaults to 7% ink (black in light mode, white in dark mode). */
  color?: string
  /** Motion speed multiplier – 1 drifts one cell every 3 seconds. 0 keeps the grid still. */
  speed?: number
  /** Freeze the drift, the lit cells and the spotlight on the current frame. */
  paused?: boolean
  /** Accent colour for the spotlight and the lit cells. Any CSS colour. */
  accent?: string
  /** Drift direction. "diagonal" runs from top right to bottom left. Default "diagonal". */
  direction?: GridDirection
  /** Uncover the grid with a circle growing from the centre when it first scrolls into view. Default true. */
  reveal?: boolean
  /** Radius of the edge fade, in % of the distance to the corners. Default 70. */
  fade?: number
  /** Let a few cells glow and fade as the grid drifts. Default true. */
  litCells?: boolean
  /** Soft accent spotlight behind the content. Default true. */
  spotlight?: boolean
  className?: string
  style?: React.CSSProperties
}

const DIRECTIONS: Record<GridDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  diagonal: [-1, 1],
}

/** One lit cell: its lattice position and the drift phase it was born in. */
type Cell = { id: number; col: number; row: number; phase: number; age: number }

const LIFE_LOOPS = 2 // a lit cell rides the grid for this many cell-widths
const MAX_CELLS = 3

const CSS = `
@property --gb-r { syntax: "<percentage>"; inherits: false; initial-value: 0% }
.gb {
  --gb-ink: #000;
  --gb-accent: #0060e2;
  --gb-line: rgb(0 0 0 / .07);
  --gb-ease: cubic-bezier(.22, 1, .36, 1);
  --gb-loop: 3s;
  position: relative; isolation: isolate; overflow: hidden; width: 100%;
  font-family: var(--gb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .gb { --gb-ink: #fff; --gb-accent: #4d8dff; --gb-line: rgb(255 255 255 / .07) }
.gb *, .gb *::before, .gb *::after { box-sizing: border-box }
.gb :focus-visible { outline: 2px solid color-mix(in oklab, var(--gb-accent) 60%, transparent); outline-offset: 1px }

.gb-content { position: relative; z-index: 1 }

/* Layers: the fade mask sits on the outside, the reveal mask inside it, the moving lines inside that. */
.gb-grid, .gb-reveal { position: absolute; inset: 0; pointer-events: none; z-index: 0 }
.gb-grid {
  mask-image: radial-gradient(#000 var(--gb-fade-in, 20%), transparent var(--gb-fade, 70%));
  -webkit-mask-image: radial-gradient(#000 var(--gb-fade-in, 20%), transparent var(--gb-fade, 70%));
}
.gb-reveal { overflow: hidden }
.gb[data-reveal] .gb-reveal {
  --gb-r: 0%;
  mask-image: radial-gradient(circle, #000 calc(var(--gb-r) - 12%), transparent var(--gb-r));
  -webkit-mask-image: radial-gradient(circle, #000 calc(var(--gb-r) - 12%), transparent var(--gb-r));
}
.gb[data-reveal][data-seen] .gb-reveal { --gb-r: 140%; animation: gb-reveal calc(1.6s / var(--gb-speed, 1)) var(--gb-ease) backwards }
@keyframes gb-reveal { from { --gb-r: 0% } to { --gb-r: 140% } }

/* Spotlight */
.gb-glow {
  position: absolute; inset: 0; opacity: .9;
  background: radial-gradient(52% 58% at 50% 46%, color-mix(in oklab, var(--gb-accent) 12%, transparent), transparent 72%);
}
:is(.dark, [data-theme="dark"]) .gb-glow { opacity: 1; background: radial-gradient(52% 58% at 50% 46%, color-mix(in oklab, var(--gb-accent) 20%, transparent), transparent 72%) }

/* Lines: oversized by one cell on every side so a drift of exactly one cell loops seamlessly. */
.gb-lines {
  position: absolute; inset: calc(var(--gb-size) * -1); will-change: transform;
  background-image: linear-gradient(to right, var(--gb-line) 1px, transparent 1px), linear-gradient(var(--gb-line) 1px, transparent 1px);
  background-size: var(--gb-size) var(--gb-size), var(--gb-size) var(--gb-size);
  animation: gb-drift calc(var(--gb-loop) / var(--gb-speed, 1)) linear infinite;
}
@keyframes gb-drift {
  from { transform: translate3d(0, 0, 0) }
  to { transform: translate3d(calc(var(--gb-dx) * var(--gb-size)), calc(var(--gb-dy) * var(--gb-size)), 0) }
}
.gb[data-still] .gb-lines { animation: none }

/* Lit cells ride the grid: same speed, same phase (a negative delay), so they stay glued to their square.
   The ride is one loop longer than the glow so it never ends while the cell is still visible. */
.gb-cells { position: absolute; inset: 0; overflow: hidden }
.gb-cell {
  position: absolute; width: var(--gb-size); height: var(--gb-size); will-change: transform, opacity;
  background: color-mix(in oklab, var(--gb-accent) 13%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--gb-accent) 32%, transparent);
  animation:
    gb-ride calc(var(--gb-loop) * ${LIFE_LOOPS + 1} / var(--gb-speed, 1)) linear backwards,
    gb-pulse calc(var(--gb-loop) * ${LIFE_LOOPS} / var(--gb-speed, 1)) ease-in-out backwards;
  animation-delay: var(--gb-phase, 0ms), 0ms;
  opacity: 0;
}
@keyframes gb-ride {
  from { transform: translate3d(0, 0, 0) }
  to { transform: translate3d(calc(var(--gb-dx) * var(--gb-size) * ${LIFE_LOOPS + 1}), calc(var(--gb-dy) * var(--gb-size) * ${LIFE_LOOPS + 1}), 0) }
}
@keyframes gb-pulse { 0% { opacity: 0 } 30% { opacity: 1 } 60% { opacity: .85 } 100% { opacity: 0 } }

.gb[data-paused] .gb-lines, .gb[data-paused] .gb-cell, .gb[data-paused] .gb-reveal { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) {
  .gb *, .gb *::before, .gb *::after { animation: none !important; transition: none !important }
  .gb-cells { display: none }
  .gb[data-reveal] .gb-reveal { mask-image: none; -webkit-mask-image: none }
}
`

export function GridBackground({
  children,
  size = 48,
  color,
  speed = 1,
  paused,
  accent,
  direction = "diagonal",
  reveal = true,
  fade = 70,
  litCells = true,
  spotlight = true,
  className,
  style,
}: GridBackgroundProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const linesRef = React.useRef<HTMLDivElement>(null)
  const [seen, setSeen] = React.useState(false)
  const [cells, setCells] = React.useState<Cell[]>([])

  const cellPx = Math.max(8, size)
  const still = speed <= 0
  const k = Math.max(0.05, speed)
  const [dx, dy] = DIRECTIONS[direction]

  const live = React.useRef({ paused: !!paused, k, size: cellPx })
  React.useEffect(() => {
    live.current = { paused: !!paused, k, size: cellPx }
  })

  // Reveal once, when 20% of the grid is in view.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || !reveal) return
    if (typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setSeen(true), 0)
      return () => window.clearTimeout(id)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reveal])

  // Lit cells: a slow timer spawns a cell at a random lattice square (born in the grid's current drift phase)
  // and retires it after LIFE_LOOPS cell-widths of drift. Timers count only while not paused.
  React.useEffect(() => {
    if (!litCells || still) return
    let tick = 0
    let nextId = 1
    let timer = 0
    const run = () => {
      const { paused: isPaused, k: kk, size: s } = live.current
      if (!isPaused) {
        tick += 1
        const root = rootRef.current
        const anim = linesRef.current?.getAnimations?.()[0]
        const loopMs = Number(anim?.effect?.getComputedTiming().duration ?? 0)
        const time = Number(anim?.currentTime ?? 0)
        const phase = loopMs > 0 ? time % loopMs : 0
        const lifeTicks = Math.round(LIFE_LOOPS * 3)
        setCells((prev) => {
          let next = prev.map((c) => ({ ...c, age: c.age + 1 })).filter((c) => c.age <= lifeTicks)
          if (root && next.length < MAX_CELLS && tick % 2 === 0 && Math.random() < 0.85) {
            const cols = Math.max(1, Math.floor(root.clientWidth / s))
            const rows = Math.max(1, Math.floor(root.clientHeight / s))
            // Prefer squares away from the very edge, where the fade has already hidden the lines.
            const col = Math.floor(cols * (0.15 + Math.random() * 0.7))
            const row = Math.floor(rows * (0.15 + Math.random() * 0.7))
            if (!next.some((c) => c.col === col && c.row === row)) next = [...next, { id: nextId++, col, row, phase, age: 0 }]
          }
          return next
        })
      }
      timer = window.setTimeout(run, 1000 / kk)
    }
    timer = window.setTimeout(run, 600 / live.current.k)
    return () => {
      window.clearTimeout(timer)
    }
  }, [litCells, still, speed, cellPx, direction])

  const vars = {
    "--gb-size": `${cellPx}px`,
    "--gb-dx": dx,
    "--gb-dy": dy,
    "--gb-speed": k,
    "--gb-fade": `${Math.max(1, fade)}%`,
    "--gb-fade-in": `${Math.max(0, fade - 50)}%`,
    ...(color ? { "--gb-line": color } : null),
    ...(accent ? { "--gb-accent": accent } : null),
    ...style,
  } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={className ? `gb ${className}` : "gb"}
      style={vars}
      data-paused={paused || undefined}
      data-still={still || undefined}
      data-reveal={reveal || undefined}
      data-seen={seen || undefined}
    >
      <style href="pane-grid-background" precedence="default">
        {CSS}
      </style>
      <div className="gb-grid" aria-hidden>
        <div className="gb-reveal">
          {spotlight && <div className="gb-glow" />}
          <div ref={linesRef} className="gb-lines" />
          {litCells && !still && (
            <div className="gb-cells">
              {cells.map((c) => (
                <i
                  key={c.id}
                  className="gb-cell"
                  style={
                    {
                      left: c.col * cellPx,
                      top: c.row * cellPx,
                      "--gb-phase": `${-c.phase}ms`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="gb-content">{children}</div>
    </div>
  )
}

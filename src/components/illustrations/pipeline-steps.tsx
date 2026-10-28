"use client"

import * as React from "react"
import { BarChart3, ClipboardCheck, FileText, MessageCircle, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PipelineStep = {
  /** Step name, e.g. "Capture". */
  label: string
  /** One line under the name. */
  caption?: string
  /** Glyph drawn inside the tile (20px, uses currentColor). */
  icon: React.ReactNode
  /** "success" fills the tile green once reached. Default "accent". */
  tone?: "accent" | "success"
}

export type PipelineStepsProps = {
  /** The steps, left to right (top to bottom when narrow). Defaults to a 5-step bookkeeping flow. */
  steps?: PipelineStep[]
  /**
   * Drive it for real: the index of the last reached step (0 = only the first).
   * Leave it out and the pipeline plays on its own timeline.
   */
  current?: number
  /** Start over after finishing (timeline mode only). Default true. */
  loop?: boolean
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for reached tiles and connectors. */
  accent?: string
  /** Accessible name of the pipeline. */
  label?: string
  className?: string
}

const ICON_PROPS = { size: 20, strokeWidth: 1.75, "aria-hidden": true } as const

export const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  { label: "Capture", caption: "Chat, email or upload", icon: <MessageCircle {...ICON_PROPS} /> },
  { label: "Draft", caption: "AI proposes an entry", icon: <Sparkles {...ICON_PROPS} /> },
  { label: "Review", caption: "Check it against the source", icon: <FileText {...ICON_PROPS} /> },
  { label: "Approve", caption: "Post it", icon: <ClipboardCheck {...ICON_PROPS} />, tone: "success" },
  { label: "Report", caption: "Every figure traces back", icon: <BarChart3 {...ICON_PROPS} /> },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ps {
  --ps-ink: #000;
  --ps-surface: #fff;
  --ps-accent: #0060e2;
  --ps-success: #16a34a;
  --ps-t1: color-mix(in oklab, var(--ps-ink) 88%, transparent);
  --ps-cap: color-mix(in oklab, var(--ps-ink) 50%, transparent);
  --ps-glyph: color-mix(in oklab, var(--ps-ink) 28%, transparent);
  --ps-ring: color-mix(in oklab, var(--ps-ink) 9%, transparent);
  --ps-track: color-mix(in oklab, var(--ps-ink) 10%, transparent);
  --ps-tile-shadow: 0 1px 2px rgb(0 0 0 / .05);
  --ps-ease: cubic-bezier(.22, 1, .36, 1);
  --ps-speed: 1;
  container: ps / inline-size;
  position: relative;
  width: 100%;
  max-width: 880px;
  color: var(--ps-t1);
  font-family: var(--ps-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ps {
  --ps-ink: #fff;
  --ps-surface: #1c1c1e;
  --ps-accent: #4d8dff;
  --ps-success: #22c55e;
  --ps-t1: color-mix(in oklab, var(--ps-ink) 90%, transparent);
  --ps-cap: color-mix(in oklab, var(--ps-ink) 50%, transparent);
  --ps-glyph: color-mix(in oklab, var(--ps-ink) 30%, transparent);
  --ps-ring: color-mix(in oklab, var(--ps-ink) 12%, transparent);
  --ps-track: color-mix(in oklab, var(--ps-ink) 12%, transparent);
  --ps-tile-shadow: 0 1px 2px rgb(0 0 0 / .4);
}
.ps *, .ps *::before, .ps *::after { box-sizing: border-box }

/* List: stacked by default (narrow), a row once the container is wide enough */
.ps-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column }
.ps-list[data-fade="out"] { animation: ps-out calc(500ms / var(--ps-speed)) ease forwards }
.ps-list[data-fade="in"] { animation: ps-in calc(500ms / var(--ps-speed)) ease backwards }

.ps-step {
  --ps-c: var(--ps-accent);
  position: relative; display: grid; grid-template-columns: 44px minmax(0, 1fr); column-gap: 14px;
  align-items: start; padding-bottom: 26px;
}
.ps-step:last-child { padding-bottom: 0 }
.ps-step[data-tone="success"] { --ps-c: var(--ps-success) }

/* Tile: a white (or dark) plate with a hairline ring; the accent plate fades in on top when reached */
.ps-tile {
  position: relative; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px;
  background: var(--ps-surface); color: var(--ps-glyph);
  box-shadow: 0 0 0 1px var(--ps-ring), var(--ps-tile-shadow);
}
.ps-tile::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; opacity: 0; pointer-events: none;
  background: linear-gradient(180deg, color-mix(in oklab, var(--ps-c) 86%, #fff), var(--ps-c));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .32), inset 0 0 0 .5px rgb(0 0 0 / .1),
    0 6px 14px -4px color-mix(in oklab, var(--ps-c) 55%, transparent);
}
.ps-tile::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none }
.ps-glyph { position: relative; z-index: 1; display: grid; place-items: center }
.ps-step[data-on] .ps-tile { color: #fff; animation: ps-pop calc(420ms / var(--ps-speed)) var(--ps-ease) }
.ps-step[data-on] .ps-tile::before { opacity: 1; animation: ps-plate calc(300ms / var(--ps-speed)) ease backwards }
.ps-step[data-on] .ps-tile::after { animation: ps-ring calc(800ms / var(--ps-speed)) var(--ps-ease) }
.ps-step[data-on] .ps-glyph { animation: ps-glyph calc(300ms / var(--ps-speed)) ease backwards }

/* Text: faded until its step is reached */
.ps-text { min-width: 0; padding-top: 2px; opacity: .35 }
.ps-step[data-on] .ps-text { opacity: 1; animation: ps-bright calc(300ms / var(--ps-speed)) ease backwards }
.ps-label { font-size: 14px; line-height: 20px; font-weight: 500; letter-spacing: -.005em; color: var(--ps-t1) }
.ps-caption { margin-top: 1px; font-size: 12.5px; line-height: 18px; color: var(--ps-cap); text-wrap: balance }

/* Connector: a faint track with an accent fill that grows toward the next tile */
.ps-conn {
  position: absolute; left: 21px; top: 52px; bottom: -8px; width: 2px; border-radius: 1px;
  background: var(--ps-track); overflow: hidden; pointer-events: none;
}
.ps-fill { position: absolute; inset: 0; background: var(--ps-accent); transform-origin: top; transform: scaleY(0) }
.ps-step[data-conn] .ps-fill { transform: scaleY(1); animation: ps-grow-y calc(600ms / var(--ps-speed)) var(--ps-ease) }

@container ps (min-width: 520px) {
  .ps-list { flex-direction: row }
  .ps-step { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; padding: 0; text-align: center }
  .ps-text { padding: 12px 6px 0 }
  .ps-conn { left: calc(50% + 30px); right: calc(30px - 50%); top: 21px; bottom: auto; width: auto; height: 2px }
  .ps-fill { transform-origin: left; transform: scaleX(0) }
  .ps-step[data-conn] .ps-fill { transform: scaleX(1); animation-name: ps-grow-x }
}

@keyframes ps-grow-y { from { transform: scaleY(0) } }
@keyframes ps-grow-x { from { transform: scaleX(0) } }
@keyframes ps-pop { from { transform: scale(.92) } }
@keyframes ps-plate { from { opacity: 0 } }
@keyframes ps-glyph { from { color: var(--ps-glyph) } }
@keyframes ps-bright { from { opacity: .35 } }
@keyframes ps-ring {
  from { box-shadow: 0 0 0 0 color-mix(in oklab, var(--ps-c) 45%, transparent) }
  to { box-shadow: 0 0 0 10px color-mix(in oklab, var(--ps-c) 0%, transparent) }
}
@keyframes ps-out { to { opacity: 0 } }
@keyframes ps-in { from { opacity: 0 } }

.ps[data-paused] *, .ps[data-paused] *::before, .ps[data-paused] *::after, .ps[data-paused] { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .ps *, .ps *::before, .ps *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Timeline                                 */
/* -------------------------------------------------------------------------- */

type Frame = { tiles: number; conns: number; fade: "none" | "in" | "out" }
type Beat = { wait: number; patch: Partial<Frame> }

const INITIAL: Frame = { tiles: 1, conns: 0, fade: "none" }

/** One connector fills (600ms), then its tile pops; 1.1s per step. After the last tile: hold, fade, restart. */
function buildScript(n: number, loop: boolean): Beat[] {
  const script: Beat[] = [{ wait: 0, patch: INITIAL }]
  for (let i = 1; i < n; i++) {
    script.push({ wait: 500, patch: { conns: i } }, { wait: 600, patch: { tiles: i + 1 } })
  }
  if (loop) {
    script.push(
      { wait: 1800, patch: { fade: "out" } },
      { wait: 500, patch: { ...INITIAL, fade: "in" } },
      { wait: 500, patch: { fade: "none" } },
    )
  }
  return script
}

/**
 * A virtual clock: it only advances while not paused and runs faster or slower with `speed`.
 * Speed and pause live in refs, so changing them never restarts the timeline.
 */
function useTimeline(n: number, enabled: boolean, loop: boolean, speed: number, paused: boolean): Frame {
  const [frame, setFrame] = React.useState<Frame>(INITIAL)
  const speedRef = React.useRef(speed)
  const pausedRef = React.useRef(paused)
  React.useEffect(() => {
    speedRef.current = speed
    pausedRef.current = paused
  })

  React.useEffect(() => {
    if (!enabled) return
    const script = buildScript(n, loop)
    let idx = 0
    let remaining = script[0].wait
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = Math.min(now - last, 200)
      last = now
      if (pausedRef.current) return
      remaining -= dt * Math.max(0.1, speedRef.current)
      while (remaining <= 0) {
        const patch = script[idx].patch
        setFrame((prev) => {
          const next = { ...prev, ...patch }
          return next.tiles === prev.tiles && next.conns === prev.conns && next.fade === prev.fade ? prev : next
        })
        idx++
        if (idx >= script.length) {
          if (!loop) {
            window.clearInterval(id)
            return
          }
          idx = 0
        }
        remaining += script[idx].wait
      }
    }, 40)
    return () => window.clearInterval(id)
  }, [n, enabled, loop])

  return frame
}

const REDUCED = "(prefers-reduced-motion: reduce)"
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

/**
 * PipelineSteps – a "how it works" row of icon tiles joined by connectors.
 * Plays its own loop, or follows `current` when you drive it.
 */
export function PipelineSteps({
  steps = DEFAULT_PIPELINE_STEPS,
  current,
  loop = true,
  speed = 1,
  paused = false,
  accent,
  label = "How it works",
  className,
}: PipelineStepsProps) {
  const n = steps.length
  const controlled = current !== undefined
  const reduced = useReducedMotion()
  const frame = useTimeline(n, !controlled && !reduced, loop, speed, paused)

  let tiles: number
  let conns: number
  let fade: Frame["fade"] = "none"
  if (controlled) {
    tiles = Math.max(0, Math.min(n, Math.round(current) + 1))
    conns = Math.max(0, tiles - 1)
  } else if (reduced) {
    tiles = n
    conns = Math.max(0, n - 1)
  } else {
    tiles = Math.min(frame.tiles, n)
    conns = Math.min(frame.conns, Math.max(0, n - 1))
    fade = frame.fade
  }

  const style = {
    "--ps-speed": Math.max(0.1, speed),
    ...(accent ? { "--ps-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div className={cn("ps", className)} style={style} data-paused={paused || undefined}>
      <style href="pipeline-steps" precedence="default">
        {CSS}
      </style>
      <ol className="ps-list" aria-label={label} data-fade={fade === "none" ? undefined : fade}>
        {steps.map((step, i) => {
          const on = i < tiles
          return (
            <li
              key={i}
              className="ps-step"
              data-on={on || undefined}
              data-conn={i < conns || undefined}
              data-tone={step.tone === "success" ? "success" : undefined}
              aria-current={on && i === tiles - 1 ? "step" : undefined}
            >
              <div className="ps-tile" aria-hidden>
                <span className="ps-glyph">{step.icon}</span>
              </div>
              <div className="ps-text">
                <div className="ps-label">{step.label}</div>
                {step.caption && <div className="ps-caption">{step.caption}</div>}
              </div>
              {i < n - 1 && (
                <span className="ps-conn" aria-hidden>
                  <span className="ps-fill" />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

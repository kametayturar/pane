"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ThinkingLoaderProps = {
  /** Labels shown one after another while the loader works. */
  phases?: string[]
  /** Milliseconds per phase when the loader runs its own timer. */
  interval?: number
  /** Controlled phase index. When set, the internal timer stops. */
  phase?: number
  /** Start over after the last phase instead of holding it. */
  loop?: boolean
  /** Spinner becomes a check and the label becomes `doneLabel`. Setting it back to false starts over. */
  done?: boolean
  /** Label once done. A function receives the seconds since the run started. */
  doneLabel?: string | ((seconds: number) => string)
  /** `sm` is 26px tall with a 12px label, `md` is 32px with a 13px label. */
  size?: "sm" | "md"
  /** `pill` is a white chip with hairline shadows, `plain` is just the spinner and label. */
  variant?: "pill" | "plain"
  className?: string
}

const DEFAULT_PHASES = ["Thinking", "Searching the web", "Reading sources", "Writing response"]
const defaultDoneLabel = (s: number) => `Thought for ${s}s`

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tl {
  --tl-ink: #000;
  --tl-surface: #fff;
  --tl-accent: #0060e2;
  --tl-t2: color-mix(in oklab, var(--tl-ink) 61%, transparent);
  --tl-glint: rgb(255 255 255 / .82);
  --tl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --tl-ease: cubic-bezier(.22, 1, .36, 1);
  --tl-h: 32px;
  --tl-r: 8px;
  --tl-icon: 16px;
  --tl-pad: 0 10px 0 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  height: var(--tl-h);
  padding: var(--tl-pad);
  border-radius: var(--tl-r);
  background: var(--tl-surface);
  box-shadow: var(--tl-shadow);
  color: var(--tl-t2);
  font-family: var(--tl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: -0.039px;
  -webkit-font-smoothing: antialiased;
  vertical-align: middle;
  white-space: nowrap;
}
:is(.dark, [data-theme="dark"]) .tl {
  --tl-ink: #fff;
  --tl-surface: #1c1c1e;
  --tl-accent: #4d8dff;
  --tl-t2: color-mix(in oklab, var(--tl-ink) 62%, transparent);
  --tl-glint: rgb(255 255 255 / .9);
  --tl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.tl *, .tl *::before, .tl *::after { box-sizing: border-box }
.tl[data-size="sm"] { --tl-h: 26px; --tl-r: 7px; --tl-icon: 14px; --tl-pad: 0 8px 0 7px; font-size: 12px }
.tl[data-variant="plain"] { --tl-pad: 0; background: none; box-shadow: none; border-radius: 0 }

/* Icon: spinner and check sit on top of each other */
.tl-icon { position: relative; flex: none; width: var(--tl-icon); height: var(--tl-icon) }
.tl-icon svg { display: block; width: 100%; height: 100% }
.tl-spin { transition: opacity .24s var(--tl-ease), transform .42s var(--tl-ease) }
.tl[data-done] .tl-spin { opacity: 0; transform: scale(.5) }
.tl-ray {
  stroke: color-mix(in oklab, var(--tl-accent) 85%, transparent);
  stroke-width: 1.6; stroke-linecap: round;
  animation: tl-ray .8s linear infinite;
}
.tl-check {
  position: absolute; inset: 0; opacity: 0; transform: scale(.5);
  transition: opacity .24s var(--tl-ease), transform .46s var(--tl-ease);
}
.tl[data-done] .tl-check { opacity: 1; transform: none }
.tl-check circle { fill: var(--tl-accent) }
.tl-check path {
  fill: none; stroke: #fff; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .1s linear;
}
.tl[data-done] .tl-check path { stroke-dashoffset: 0; transition: stroke-dashoffset .36s var(--tl-ease) .16s }

/* Text box: width follows the incoming label, vertical overflow clips the roll */
.tl-text { position: relative; flex: none; height: 20px; overflow: hidden }
.tl-text[data-ready] { transition: width .46s var(--tl-ease) }
.tl-label { position: absolute; left: 0; top: 0; white-space: nowrap }
.tl-in { animation: tl-in .46s var(--tl-ease) backwards }
.tl-out { animation: tl-out .32s var(--tl-ease) forwards; pointer-events: none }

/* White glint sweeping over the working label (a real aria-hidden copy, so it is not read twice) */
.tl-glint {
  position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--tl-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text;
  animation: tl-sweep 1.6s linear infinite;
}

@keyframes tl-ray { from { opacity: 1 } to { opacity: .2 } }
@keyframes tl-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes tl-in { from { opacity: 0; filter: blur(3px); transform: translateY(70%) } }
@keyframes tl-out { to { opacity: 0; filter: blur(3px); transform: translateY(-70%) } }

@media (prefers-reduced-motion: reduce) {
  .tl *, .tl *::before, .tl *::after { animation: none !important; transition: none !important }
  .tl-ray { opacity: var(--tl-o, 1) }
  .tl-glint { display: none }
  .tl-out { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  const [sin, cos] = [Math.sin(a), Math.cos(a)]
  const p = (r: number) => (8 + r * sin).toFixed(2)
  const q = (r: number) => (8 - r * cos).toFixed(2)
  return { x1: p(3.6), y1: q(3.6), x2: p(6.6), y2: q(6.6), delay: -800 + i * 100, o: 1 - i * 0.1 }
})

function Spinner() {
  return (
    <svg className="tl-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
      {RAYS.map((r, i) => (
        <line
          key={i}
          className="tl-ray"
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          style={{ animationDelay: `${r.delay}ms`, ["--tl-o" as string]: r.o.toFixed(1) }}
        />
      ))}
    </svg>
  )
}

function Check() {
  return (
    <svg className="tl-check" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6.9" />
      <path d="m5.2 8.2 1.9 1.9 3.7-4" pathLength={1} />
    </svg>
  )
}

/**
 * The label box. When `text` changes the old copy rolls up and blurs out, the new one rolls in from below,
 * and the box glides to the width of the incoming label.
 */
function Roll({ text, working }: { text: string; working: boolean }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const inRef = React.useRef<HTMLSpanElement>(null)

  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 340)
    return () => window.clearTimeout(id)
  }, [leaving])
  React.useLayoutEffect(() => {
    const el = inRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [shown])

  return (
    <span className="tl-text" data-ready={width !== null || undefined} style={width !== null ? { width } : undefined}>
      {leaving !== null && (
        <span key={`out-${leaving}`} className="tl-label tl-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} ref={inRef} className={cn("tl-label", leaving !== null && "tl-in")}>
        {shown}
        {working && (
          <span className="tl-glint" aria-hidden>
            {shown}
          </span>
        )}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                               ThinkingLoader                               */
/* -------------------------------------------------------------------------- */

export function ThinkingLoader({
  phases = DEFAULT_PHASES,
  interval = 2200,
  phase,
  loop = false,
  done = false,
  doneLabel = defaultDoneLabel,
  size = "md",
  variant = "pill",
  className,
}: ThinkingLoaderProps) {
  const controlled = phase !== undefined
  const count = phases.length
  const [timerIndex, setTimerIndex] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const [seconds, setSeconds] = React.useState<number | null>(null)

  // Setting `done` back to false starts a fresh run.
  const [prevDone, setPrevDone] = React.useState(done)
  if (prevDone !== done) {
    setPrevDone(done)
    if (!done) {
      setTimerIndex(0)
      setSeconds(null)
      setRun((r) => r + 1)
    }
  }

  const raw = controlled ? phase : timerIndex
  const index = Math.max(0, Math.min(raw, count - 1))

  // Own timer: one phase per interval, hold on the last one unless looping.
  React.useEffect(() => {
    if (controlled || done || count < 2) return
    if (index >= count - 1 && !loop) return
    const id = window.setTimeout(() => setTimerIndex(index >= count - 1 ? 0 : index + 1), interval)
    return () => window.clearTimeout(id)
  }, [controlled, done, count, index, loop, interval])

  // Seconds since the run started, read once when it finishes.
  const startedAt = React.useRef(0)
  React.useEffect(() => {
    startedAt.current = performance.now()
  }, [run])
  React.useEffect(() => {
    if (!done || typeof doneLabel === "string") return
    const id = requestAnimationFrame(() =>
      setSeconds(Math.max(1, Math.round((performance.now() - startedAt.current) / 1000))),
    )
    return () => cancelAnimationFrame(id)
  }, [done, doneLabel, run])

  const working = phases[index] ?? ""
  let text = working
  if (done) text = typeof doneLabel === "string" ? doneLabel : seconds === null ? working : doneLabel(seconds)

  return (
    <span
      className={cn("tl", className)}
      role="status"
      aria-live="polite"
      aria-busy={!done}
      data-size={size}
      data-variant={variant}
      data-done={done || undefined}
    >
      <style href="thinking-loader" precedence="default">
        {CSS}
      </style>
      <span className="tl-icon" aria-hidden>
        <Spinner />
        <Check />
      </span>
      <Roll text={text} working={!done} />
    </span>
  )
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ProgressStep = {
  id: string
  label: string
  /** Starts ticked. */
  done?: boolean
  /** Optional 16px icon (an app logo, for example) shown before the label. */
  icon?: React.ReactNode
}

export type ProgressTrackerProps = {
  steps?: ProgressStep[]
  /** Heading above the bar. */
  title?: string
  /** Ticks the open steps one by one and starts over. Stops when someone clicks or types. */
  autoPlay?: boolean
  /** Pause between two automatic steps, in ms. */
  interval?: number
  /** Called with every step and its state after each change. */
  onChange?: (steps: ProgressStep[]) => void
  className?: string
}

export const DEFAULT_STEPS: ProgressStep[] = [
  { id: "sources", label: "Connect your data sources" },
  { id: "notify", label: "Turn on run notifications" },
  { id: "eval", label: "Review the first eval report", done: true },
  { id: "prompt", label: "Save a reusable prompt" },
  { id: "agent", label: "Deploy your first agent" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pt {
  --pt-ink: #000;
  --pt-surface: #fff;
  --pt-accent: #0060e2;
  --pt-accent-a: rgb(0 96 226 / .765);
  --pt-t1: color-mix(in oklab, var(--pt-ink) 88%, transparent);
  --pt-t3: color-mix(in oklab, var(--pt-ink) 45%, transparent);
  --pt-t4: color-mix(in oklab, var(--pt-ink) 27%, transparent);
  --pt-fill: color-mix(in oklab, var(--pt-ink) 6%, transparent);
  --pt-ring: color-mix(in oklab, var(--pt-ink) 20%, transparent);
  --pt-wash: color-mix(in oklab, var(--pt-ink) 3%, transparent);
  --pt-glint: rgb(255 255 255 / .82);
  --pt-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --pt-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 340px;
  padding: 14px 6px 6px;
  border-radius: 10px;
  background: var(--pt-surface);
  box-shadow: var(--pt-shadow);
  color: var(--pt-t1);
  font-family: var(--pt-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
  animation: pt-in .52s var(--pt-ease) backwards;
}
:is(.dark, [data-theme="dark"]) .pt {
  --pt-ink: #fff;
  --pt-surface: #1c1c1e;
  --pt-accent: #4d8dff;
  --pt-accent-a: #4d8dff;
  --pt-t1: color-mix(in oklab, var(--pt-ink) 90%, transparent);
  --pt-t3: color-mix(in oklab, var(--pt-ink) 46%, transparent);
  --pt-t4: color-mix(in oklab, var(--pt-ink) 28%, transparent);
  --pt-fill: color-mix(in oklab, var(--pt-ink) 8%, transparent);
  --pt-ring: color-mix(in oklab, var(--pt-ink) 24%, transparent);
  --pt-wash: color-mix(in oklab, var(--pt-ink) 4%, transparent);
  --pt-glint: rgb(255 255 255 / .5);
  --pt-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.pt *, .pt *::before, .pt *::after { box-sizing: border-box }
.pt button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.pt :focus-visible { outline: 2px solid color-mix(in oklab, var(--pt-accent) 60%, transparent); outline-offset: 1px }
.pt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Heading + counter */
.pt-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 0 10px }
.pt-title { margin: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 500; line-height: 24px; color: var(--pt-ink) }
.pt-count { flex: none; font-size: 12px; line-height: 16px; color: var(--pt-t3); font-variant-numeric: tabular-nums }
.pt-digit { display: inline-block; color: var(--pt-t1); animation: pt-roll .56s var(--pt-ease) backwards }

/* Bar: the fill is full width and scaled with transform, so it animates on the compositor */
.pt-bar { position: relative; height: 4px; margin: 10px 10px 8px; overflow: hidden; border-radius: 2px; background: var(--pt-fill) }
.pt-fill {
  position: absolute; inset: 0; overflow: hidden; border-radius: 2px; background: var(--pt-accent-a);
  transform-origin: left; transition: transform 1.1s var(--pt-ease);
}
.pt-shine {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 30%, var(--pt-glint) 50%, transparent 70%) 0 0 / 220% 100% no-repeat;
  animation: pt-shine 1.4s ease-out backwards;
}

/* Steps */
.pt-list { display: grid; margin: 0; padding: 0; list-style: none }
.pt-row { position: relative; animation: pt-row .64s var(--pt-ease) backwards }
.pt .pt-step {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 10px; border-radius: 6px; text-align: left;
  transition: background-color .09s ease-out;
}
.pt .pt-step:hover { background: var(--pt-wash) }
.pt .pt-step:focus-visible { outline-offset: -2px }

.pt-check {
  position: relative; display: grid; place-items: center; flex: none; width: 16px; height: 16px; border-radius: 50%;
  background: transparent; box-shadow: inset 0 0 0 1px var(--pt-ring);
  transition: background-color .22s var(--pt-ease), box-shadow .22s var(--pt-ease);
}
.pt-check svg { display: block; width: 12px; height: 12px; overflow: hidden; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round }
.pt-check path { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .12s ease-in }
.pt-step[aria-checked="true"] .pt-check {
  background: var(--pt-accent-a); box-shadow: inset 0 0 0 1px transparent; animation: pt-pop .56s var(--pt-ease);
}
.pt-step[aria-checked="true"] .pt-check path { stroke-dashoffset: 0; transition: stroke-dashoffset .42s var(--pt-ease) .16s }

.pt-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; transition: opacity .3s }
.pt-icon > * { max-width: 100%; max-height: 100% }
.pt-step[aria-checked="true"] .pt-icon { opacity: .5 }

.pt-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--pt-t1); transition: color .3s }
.pt-label span {
  background: linear-gradient(var(--pt-t4), var(--pt-t4)) 0 60% / 0% 1px no-repeat;
  transition: background-size .38s var(--pt-ease);
}
.pt-step[aria-checked="true"] .pt-label { color: var(--pt-t3) }
.pt-step[aria-checked="true"] .pt-label span { background-size: 100% 1px; transition: background-size .62s var(--pt-ease) .22s }

@keyframes pt-in { from { opacity: 0; transform: translateY(8px) } }
@keyframes pt-row { from { opacity: 0; filter: blur(3px); transform: translateY(8px) } }
@keyframes pt-roll { from { opacity: 0; transform: translateY(60%) } }
@keyframes pt-pop { 0% { transform: scale(.9) } 60% { transform: scale(1.08) } 100% { transform: scale(1) } }
@keyframes pt-shine { from { opacity: 1; background-position: 120% 0 } to { opacity: 0; background-position: -20% 0 } }

@media (prefers-reduced-motion: reduce) {
  .pt, .pt *, .pt *::before, .pt *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                              ProgressTracker                               */
/* -------------------------------------------------------------------------- */

export function ProgressTracker({
  steps = DEFAULT_STEPS,
  title = "Getting started",
  autoPlay = false,
  interval = 2200,
  onChange,
  className,
}: ProgressTrackerProps) {
  const [initial] = React.useState(() => steps.filter((s) => s.done).map((s) => s.id))
  const [doneIds, setDoneIds] = React.useState<string[]>(initial)
  const [playing, setPlaying] = React.useState(autoPlay)
  const total = steps.length
  const count = steps.filter((s) => doneIds.includes(s.id)).length

  // Re-trigger the shine band each time the count goes up (state adjusted during render).
  const [shine, setShine] = React.useState({ count, run: 0 })
  if (shine.count !== count) setShine({ count, run: count > shine.count ? shine.run + 1 : shine.run })

  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })
  const stepsRef = React.useRef(steps)
  React.useEffect(() => {
    stepsRef.current = steps
  })

  const commit = React.useCallback((ids: string[]) => {
    setDoneIds(ids)
    onChangeRef.current?.(stepsRef.current.map((s) => ({ ...s, done: ids.includes(s.id) })))
  }, [])

  const toggle = (id: string) => commit(doneIds.includes(id) ? doneIds.filter((d) => d !== id) : [...doneIds, id])

  // Auto play: tick the next open step every `interval`, then start over.
  React.useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      const next = stepsRef.current.find((s) => !doneIds.includes(s.id))
      commit(next ? [...doneIds, next.id] : initial)
    }, interval)
    return () => window.clearTimeout(id)
  }, [playing, doneIds, initial, interval, commit])

  const stop = () => setPlaying(false)

  return (
    <div
      className={cn("pt", className)}
      data-complete={count === total && total > 0 ? "true" : undefined}
      onPointerDown={playing ? stop : undefined}
      onKeyDown={playing ? stop : undefined}
    >
      <style href="progress-tracker" precedence="default">
        {CSS}
      </style>

      <div className="pt-head">
        <h3 className="pt-title">{title}</h3>
        <span className="pt-count" aria-hidden>
          <span className="pt-digit" key={count}>
            {count}
          </span>
          /{total}
        </span>
      </div>

      <div
        className="pt-bar"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={count}
        aria-valuetext={`${count} of ${total} done`}
      >
        <span className="pt-fill" style={{ transform: `scaleX(${total ? count / total : 0})` }}>
          {shine.run > 0 && <span className="pt-shine" key={shine.run} />}
        </span>
      </div>
      <span className="pt-sr" aria-live="polite">
        {count} of {total} done
      </span>

      <ul className="pt-list">
        {steps.map((step, i) => {
          const checked = doneIds.includes(step.id)
          return (
            <li key={step.id} className="pt-row" style={{ animationDelay: `${180 + i * 90}ms` }}>
              <button type="button" role="checkbox" aria-checked={checked} className="pt-step" onClick={() => toggle(step.id)}>
                <span className="pt-check" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M6.5 12.5l3.5 3.5 7.5-8" pathLength={1} />
                  </svg>
                </span>
                {step.icon && (
                  <span className="pt-icon" aria-hidden>
                    {step.icon}
                  </span>
                )}
                <span className="pt-label">
                  <span>{step.label}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

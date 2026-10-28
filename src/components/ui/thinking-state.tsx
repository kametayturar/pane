"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ThinkingSource = {
  label: string
  href?: string
  /** Optional 14px icon (an <img>, an svg or an emoji). Falls back to a letter. */
  icon?: React.ReactNode
}

export type ThinkingStep = {
  /** Text once the step is done, e.g. "Searched". */
  label: string
  /** Text while the step is running, e.g. "Searching". Defaults to `label`. */
  activeLabel?: string
  /** Sources found in this step. A step with sources gets a globe instead of a dot. */
  sources?: ThinkingSource[]
  /** Extra sources hidden behind a "+N more" chip. */
  moreSources?: ThinkingSource[]
}

export type ThinkingStateProps = {
  steps: ThinkingStep[]
  /** Label of the final row. */
  doneLabel?: string
  /** Pause between two steps, in ms (when the component runs its own timeline). */
  stepMs?: number
  /**
   * Drive it from real progress: the index of the step that is running.
   * steps.length means finished. Leave it out and the steps play on a timer.
   */
  current?: number
  /** Starts over a few seconds after finishing (timer mode only). */
  loop?: boolean
  /** Called once all steps are done, with the seconds it took. */
  onDone?: (seconds: number) => void
  defaultOpen?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ths {
  --ths-ink: #000;
  --ths-surface: #fff;
  --ths-accent: #0060e2;
  --ths-t1: color-mix(in oklab, var(--ths-ink) 88%, transparent);
  --ths-t2: color-mix(in oklab, var(--ths-ink) 61%, transparent);
  --ths-t3: color-mix(in oklab, var(--ths-ink) 45%, transparent);
  --ths-t4: color-mix(in oklab, var(--ths-ink) 27%, transparent);
  --ths-icon: color-mix(in oklab, var(--ths-ink) 45%, transparent);
  --ths-fill: color-mix(in oklab, var(--ths-ink) 4%, transparent);
  --ths-line: color-mix(in oklab, var(--ths-ink) 6%, transparent);
  --ths-rail: color-mix(in oklab, var(--ths-ink) 8%, transparent);
  --ths-glint: rgb(255 255 255 / .82);
  --ths-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ths-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ths-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  border-radius: 10px;
  background: var(--ths-surface);
  box-shadow: var(--ths-shadow);
  color: var(--ths-t1);
  font-family: var(--ths-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ths {
  --ths-ink: #fff;
  --ths-surface: #1c1c1e;
  --ths-accent: #4d8dff;
  --ths-t1: color-mix(in oklab, var(--ths-ink) 90%, transparent);
  --ths-t2: color-mix(in oklab, var(--ths-ink) 62%, transparent);
  --ths-t3: color-mix(in oklab, var(--ths-ink) 46%, transparent);
  --ths-t4: color-mix(in oklab, var(--ths-ink) 28%, transparent);
  --ths-icon: color-mix(in oklab, var(--ths-ink) 50%, transparent);
  --ths-fill: color-mix(in oklab, var(--ths-ink) 5%, transparent);
  --ths-line: color-mix(in oklab, var(--ths-ink) 8%, transparent);
  --ths-rail: color-mix(in oklab, var(--ths-ink) 12%, transparent);
  --ths-glint: rgb(255 255 255 / .9);
  --ths-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ths-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ths *, .ths *::before, .ths *::after { box-sizing: border-box }
:where(.ths) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ths :focus-visible { outline: 2px solid color-mix(in oklab, var(--ths-accent) 60%, transparent); outline-offset: 1px }

/* Header */
.ths .ths-head {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 44px; padding: 0 12px 0 16px;
  border-radius: 10px 10px 0 0; text-align: left; transition: background-color .16s;
}
.ths .ths-head:hover { background: var(--ths-fill) }
.ths[data-open="false"] .ths-head { border-radius: 10px }
.ths-mark { display: grid; grid-template-columns: repeat(3, 3px); gap: 1.5px; place-content: center; flex: none; width: 16px; height: 16px }
.ths-mark i { width: 3px; height: 3px; border-radius: .75px; background: color-mix(in oklab, var(--ths-accent) 76.5%, transparent) }
.ths-mark[data-busy] i { animation: ths-pixel 1.2s ease-in-out infinite }
.ths-title { display: flex; align-items: baseline; gap: 8px; flex: 1; min-width: 0; font-weight: 500; color: var(--ths-t1) }
.ths-title[data-busy] .ths-title-text { color: var(--ths-t3) }
.ths-time { font-weight: 400; color: var(--ths-t4); font-variant-numeric: tabular-nums }
.ths-chevron {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; margin-right: -6px; border-radius: 6px;
  color: var(--ths-icon); transition: color .16s;
}
.ths-chevron svg { width: 16px; height: 16px; transition: transform .36s var(--ths-ease) }
.ths[data-open="false"] .ths-chevron svg { transform: rotate(-90deg) }
.ths-head:hover .ths-chevron { color: var(--ths-ink) }

/* Body: collapses by animating the grid row from 1fr to 0fr */
.ths-body {
  display: grid; grid-template-rows: 1fr; border-top: .5px solid var(--ths-line);
  transition: grid-template-rows .36s var(--ths-ease), opacity .26s, border-color .26s;
}
.ths[data-open="false"] .ths-body { grid-template-rows: 0fr; opacity: 0; border-color: transparent }
.ths-clip { min-height: 0; overflow: hidden }
.ths-grow { transition: height .36s var(--ths-ease) }
.ths-list { margin: 0; padding: 14px 16px 4px; list-style: none }

/* Steps: a timeline of nodes joined by a line that grows down to each new node */
.ths-item {
  position: relative; display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 10px; padding-bottom: 12px;
  animation: ths-in .52s var(--ths-ease) backwards;
}
.ths-item:not(:last-child)::before {
  content: ""; position: absolute; left: 7.5px; top: 22px; bottom: 2px; width: 1px; background: var(--ths-rail);
  transform-origin: top; animation: ths-line .52s var(--ths-ease) backwards;
}
.ths-node { display: grid; place-items: center; width: 16px; height: 20px; color: var(--ths-t1) }
.ths-node svg { width: 16px; height: 16px }
.ths-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--ths-t4);
  transition: background-color .3s, border-radius .3s, width .3s, height .3s;
}
.ths-dot[data-active] {
  width: 6px; height: 6px; border-radius: 1.5px; background: color-mix(in oklab, var(--ths-accent) 76.5%, transparent);
  animation: ths-pulse 1s ease-in-out infinite;
}
.ths-label { position: relative; display: inline-block; color: var(--ths-t2); transition: color .3s }
.ths-label[data-active] { color: var(--ths-t3) }
.ths-shimmer { position: relative }
.ths-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--ths-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text;
  animation: ths-sweep 1.6s linear infinite;
}

/* Blur crossfade for text that changes in place */
.ths-swap { display: inline-grid; vertical-align: top }
.ths-swap > * { grid-area: 1 / 1; white-space: nowrap }
.ths-swap-in { animation: ths-swap-in .42s var(--ths-ease) backwards }
.ths-swap-out { animation: ths-swap-out .42s var(--ths-ease) forwards; pointer-events: none }

/* Source chips */
.ths-sources { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; padding: 1px 0 2px }
.ths-source {
  position: relative; display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px 0 6px;
  border-radius: 6px; background: var(--ths-surface); box-shadow: var(--ths-shadow);
  font-size: 12px; line-height: 16px; color: var(--ths-t1); text-decoration: none; white-space: nowrap;
  transition: background-color .16s, color .16s;
  animation: ths-chip .42s var(--ths-ease) backwards;
}
a.ths-source:hover { background: color-mix(in oklab, var(--ths-surface), var(--ths-ink) 3%); color: var(--ths-ink) }
.ths-fav {
  display: grid; place-items: center; flex: none; width: 14px; height: 14px; overflow: hidden; border-radius: 4px;
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ths-ink) 10%, transparent);
  font-size: 9px; font-weight: 600; line-height: 1; color: var(--ths-t2);
}
.ths-fav > * { width: 100%; height: 100% }
.ths-fav[data-letter] { background: var(--ths-fill) }
.ths-tip {
  position: absolute; left: 50%; bottom: calc(100% + 6px); z-index: 10; padding: 4px 8px; border-radius: 6px;
  background: var(--ths-surface); box-shadow: var(--ths-float); font-size: 12px; line-height: 16px; color: var(--ths-t2);
  opacity: 0; transform: translate(-50%, 3px); pointer-events: none;
  transition: opacity .14s, transform .2s var(--ths-ease);
}
.ths-source:hover .ths-tip, .ths-source:focus-visible .ths-tip { opacity: 1; transform: translate(-50%, 0) }
.ths .ths-more {
  display: inline-flex; align-items: center; height: 26px; padding: 0 8px; border-radius: 6px;
  box-shadow: inset 0 0 0 .5px var(--ths-line); font-size: 12px; line-height: 16px; font-weight: 500; color: var(--ths-t2);
  transition: background-color .16s, color .16s; animation: ths-chip .42s var(--ths-ease) backwards;
}
.ths .ths-more:hover { background: var(--ths-fill); color: var(--ths-ink) }

/* Final tick */
.ths-check { width: 16px; height: 16px; animation: ths-pop .46s var(--ths-ease) backwards }
.ths-check circle { fill: var(--ths-accent) }
.ths-check path { stroke: #fff; stroke-width: 1.4; stroke-dasharray: 9; animation: ths-draw .36s var(--ths-ease) .18s backwards }

@keyframes ths-in { from { opacity: 0; filter: blur(3px); transform: translateY(6px) } }
@keyframes ths-line { from { transform: scaleY(0) } }
@keyframes ths-chip { from { opacity: 0; transform: translateY(4px) scale(.92) } }
@keyframes ths-pixel { 50% { opacity: .2 } }
@keyframes ths-pulse { 50% { opacity: .45; transform: scale(.7) } }
@keyframes ths-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes ths-pop { 0% { transform: scale(.5) } 60% { transform: scale(1.12) } 100% { transform: none } }
@keyframes ths-draw { from { stroke-dashoffset: 9 } }
@keyframes ths-swap-in { from { opacity: 0; filter: blur(10px); transform: scale(.98) } }
@keyframes ths-swap-out { to { opacity: 0; filter: blur(10px); transform: scale(1.02) } }

@media (prefers-reduced-motion: reduce) {
  .ths *, .ths *::before, .ths *::after { animation: none !important; transition: none !important }
  .ths-swap-out { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

const GlobeIcon = () => (
  <svg {...svg}>
    <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.2" />
    <path d="M2.5 8h11M8 2.25c1.6 1.6 2.4 3.5 2.4 5.75S9.6 12.15 8 13.75M8 2.25C6.4 3.85 5.6 5.75 5.6 8s.8 4.15 2.4 5.75" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

const Check = () => (
  <svg {...svg} className="ths-check">
    <circle cx="8" cy="8" r="7" />
    <path d="m5.1 8.2 2 2 3.8-4.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function BlurSwap({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 420)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="ths-swap">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="ths-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} className={cn(leaving !== null && "ths-swap-in", className)} data-text={shown}>
        {shown}
      </span>
    </span>
  )
}

/** Animates its height to follow its content (height: auto can't be transitioned). */
function AutoHeight({ children }: { children: React.ReactNode }) {
  const inner = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="ths-grow" style={height !== null ? { height } : undefined}>
      <div ref={inner} style={{ display: "flow-root" }}>
        {children}
      </div>
    </div>
  )
}

function hostname(href?: string) {
  if (!href) return null
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function SourceChip({ source, delay }: { source: ThinkingSource; delay: number }) {
  const host = hostname(source.href)
  const Chip = source.href ? "a" : "span"
  return (
    <Chip
      className="ths-source"
      style={{ animationDelay: `${delay}ms` }}
      {...(source.href ? { href: source.href, target: "_blank", rel: "noreferrer" } : {})}
    >
      <span className="ths-fav" data-letter={source.icon ? undefined : ""} aria-hidden>
        {source.icon ?? source.label.charAt(0).toUpperCase()}
      </span>
      {source.label}
      {host && (
        <span className="ths-tip" role="tooltip">
          {host}
        </span>
      )}
    </Chip>
  )
}

function Sources({ step }: { step: ThinkingStep }) {
  const [expanded, setExpanded] = React.useState(false)
  const first = step.sources ?? []
  const more = step.moreSources ?? []
  if (!first.length && !more.length) return null
  return (
    <div className="ths-sources">
      {first.map((s, i) => (
        <SourceChip key={`s${i}`} source={s} delay={120 + i * 160} />
      ))}
      {expanded
        ? more.map((s, i) => <SourceChip key={`m${i}`} source={s} delay={i * 80} />)
        : more.length > 0 && (
            <button
              type="button"
              className="ths-more"
              style={{ animationDelay: `${120 + first.length * 160}ms` }}
              onClick={() => setExpanded(true)}
            >
              +{more.length} more
            </button>
          )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ThinkingState                               */
/* -------------------------------------------------------------------------- */

export function ThinkingState({
  steps,
  doneLabel = "Finished thinking",
  stepMs = 1300,
  current: currentProp,
  loop = false,
  onDone,
  defaultOpen = true,
  className,
}: ThinkingStateProps) {
  const controlled = currentProp !== undefined
  const [run, setRun] = React.useState(0)
  const [timerStep, setTimerStep] = React.useState(0)
  const current = Math.min(controlled ? currentProp : timerStep, steps.length)
  const done = current >= steps.length
  const [open, setOpen] = React.useState(defaultOpen)

  // Timer mode: advance one step every stepMs, then loop if asked.
  React.useEffect(() => {
    if (controlled) return
    if (timerStep < steps.length) {
      const id = window.setTimeout(() => setTimerStep((s) => s + 1), stepMs)
      return () => window.clearTimeout(id)
    }
    if (loop) {
      const id = window.setTimeout(() => {
        setTimerStep(0)
        setRun((r) => r + 1)
      }, 3200)
      return () => window.clearTimeout(id)
    }
  }, [controlled, timerStep, steps.length, stepMs, loop])

  // Live timer: seconds since this run started, frozen once done.
  const startedAt = React.useRef(0)
  const [seconds, setSeconds] = React.useState(0)
  const onDoneRef = React.useRef(onDone)
  React.useEffect(() => {
    onDoneRef.current = onDone
  })
  React.useEffect(() => {
    startedAt.current = performance.now()
  }, [run])
  React.useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.round((performance.now() - startedAt.current) / 1000)))
    if (done) {
      const secs = Math.max(1, Math.round((performance.now() - startedAt.current) / 1000))
      const id = requestAnimationFrame(() => {
        setSeconds(secs)
        onDoneRef.current?.(secs)
      })
      return () => cancelAnimationFrame(id)
    }
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [done, run])

  const visible = steps.slice(0, Math.min(current + 1, steps.length))

  return (
    <section className={cn("ths", className)} data-open={open} aria-busy={!done}>
      <style href="thinking-state" precedence="default">
        {CSS}
      </style>

      <button type="button" className="ths-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ths-mark" data-busy={!done || undefined} aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(Math.floor(i / 3) + (i % 3)) * 120}ms` }} />
          ))}
        </span>
        <span className="ths-title" data-busy={!done || undefined}>
          <BlurSwap text={done ? `Worked for ${seconds}s` : "Thinking"} className={cn("ths-title-text", !done && "ths-shimmer")} />
          {!done && <span className="ths-time">{seconds}s</span>}
        </span>
        <span className="ths-chevron" aria-hidden>
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M4.5 6.25 8 9.75l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div className="ths-body">
        <div className="ths-clip">
          <AutoHeight>
            <ol className="ths-list" aria-live="polite" key={run}>
              {visible.map((step, i) => {
                const active = i === current
                const text = active ? (step.activeLabel ?? step.label) : step.label
                const hasSources = !!(step.sources?.length || step.moreSources?.length)
                return (
                  <li key={i} className="ths-item">
                    <span className="ths-node">
                      {hasSources ? <GlobeIcon /> : <span className="ths-dot" data-active={active || undefined} />}
                    </span>
                    <div>
                      <span className="ths-label" data-active={active || undefined}>
                        <BlurSwap text={text} className={active ? "ths-shimmer" : undefined} />
                      </span>
                      <Sources step={step} />
                    </div>
                  </li>
                )
              })}
              {done && (
                <li className="ths-item">
                  <span className="ths-node">
                    <Check />
                  </span>
                  <span className="ths-label">{doneLabel}</span>
                </li>
              )}
            </ol>
          </AutoHeight>
        </div>
      </div>
    </section>
  )
}

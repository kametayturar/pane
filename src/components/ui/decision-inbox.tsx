"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DecisionAnswer = "primary" | "secondary"

export type Decision = {
  id: string
  /** The question, e.g. "Roll out the new onboarding to everyone?". */
  title: string
  /** One line of evidence under the question. */
  detail?: string
  /** Label of the main answer. */
  primary: string
  /** Label of the second answer. */
  secondary: string
  /** Starts folded to its title; it opens when the decision above it has been answered. */
  collapsed?: boolean
}

export type DecisionInboxProps = {
  decisions?: Decision[]
  /** Called when someone picks an answer. */
  onDecide?: (decision: Decision, answer: DecisionAnswer) => void
  /** How long the green confirmation stays before the row folds away, in ms. */
  confirmMs?: number
  /** Text shown when nothing is left. */
  emptyText?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.di {
  --di-ink: #000;
  --di-surface: #fff;
  --di-accent: #0060e2;
  --di-good: #1a9a52;
  --di-warn: #e8a20c;
  --di-t1: color-mix(in oklab, var(--di-ink) 88%, transparent);
  --di-t2: color-mix(in oklab, var(--di-ink) 61%, transparent);
  --di-t3: color-mix(in oklab, var(--di-ink) 45%, transparent);
  --di-t4: color-mix(in oklab, var(--di-ink) 27%, transparent);
  --di-fill: color-mix(in oklab, var(--di-ink) 6%, transparent);
  --di-line: color-mix(in oklab, var(--di-ink) 6%, transparent);
  --di-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --di-ease: cubic-bezier(.22, 1, .36, 1);
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--di-surface);
  box-shadow: var(--di-shadow);
  color: var(--di-t1);
  font-family: var(--di-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
  animation: di-look .32s var(--di-ease) backwards;
}
:is(.dark, [data-theme="dark"]) .di {
  --di-ink: #fff;
  --di-surface: #1c1c1e;
  --di-accent: #4d8dff;
  --di-good: #3dd68c;
  --di-warn: #f2b233;
  --di-t1: color-mix(in oklab, var(--di-ink) 90%, transparent);
  --di-t2: color-mix(in oklab, var(--di-ink) 62%, transparent);
  --di-t3: color-mix(in oklab, var(--di-ink) 46%, transparent);
  --di-t4: color-mix(in oklab, var(--di-ink) 28%, transparent);
  --di-fill: color-mix(in oklab, var(--di-ink) 8%, transparent);
  --di-line: color-mix(in oklab, var(--di-ink) 8%, transparent);
  --di-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.di *, .di *::before, .di *::after { box-sizing: border-box }
:where(.di) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.di :focus-visible { outline: 2px solid color-mix(in oklab, var(--di-accent) 60%, transparent); outline-offset: 1px }

/* Heading with the live count */
.di-head {
  display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px;
  border-bottom: .5px solid var(--di-line); font-weight: 500; color: var(--di-t1);
}
.di-glyph { flex: none; width: 16px; height: 16px; color: var(--di-warn); animation: di-pop .36s var(--di-ease) backwards }
.di-glyph[data-state="clear"] { color: var(--di-good) }
.di-glyph .di-cut { stroke: #fff }
.di-glyph .di-cut-dot { fill: #fff }
.di-head-text { animation: di-in .32s var(--di-ease) backwards }

/* A row folds away by animating its grid track from 1fr to 0fr */
.di-row { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .46s var(--di-ease), opacity .3s }
.di-row[data-gone] { grid-template-rows: 0fr; opacity: 0; pointer-events: none }
.di-row-inner { min-height: 0; overflow: hidden }
.di-item { padding: 14px 16px 16px }
.di-item[data-line] { border-top: .5px solid var(--di-line) }

.di-title {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left;
  font-weight: 500; line-height: 20px; color: var(--di-ink); transition: color .2s;
}
.di .di-title[data-open="false"] { color: var(--di-t2) }
.di .di-title[data-open="false"]:hover { color: var(--di-ink) }
.di .di-title[data-open="true"] { cursor: default }
.di-chev { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--di-t3); transition: transform .32s var(--di-ease), opacity .2s }
.di-chev svg { width: 16px; height: 16px }
.di-title[data-open="true"] .di-chev { opacity: 0; transform: rotate(90deg) }

/* The body folds too: the inner box has a 4px pad with a matching negative margin so focus rings are not clipped */
.di-body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .42s var(--di-ease) }
.di-body[data-open="false"] { grid-template-rows: 0fr }
.di-body-inner { min-height: 0; overflow: hidden; margin: 0 -4px -4px; padding: 0 4px 4px; transition: opacity .3s }
.di-body[data-open="false"] .di-body-inner { opacity: 0 }
.di-detail { margin: 2px 0 0; color: var(--di-t2) }
.di-actions { display: flex; align-items: center; gap: 8px; min-height: 28px; margin-top: 12px }

.di .di-btn {
  display: flex; align-items: center; justify-content: center; height: 28px; padding: 0 10px; border-radius: 6px;
  background: var(--di-surface); box-shadow: var(--di-shadow); font-weight: 500; color: var(--di-ink); white-space: nowrap;
  transition: background-color .16s, transform .16s var(--di-ease);
}
.di .di-btn:hover { background: color-mix(in oklab, var(--di-surface), var(--di-ink) 4%) }
.di .di-btn:active { transform: scale(.97) }
.di .di-btn--primary { background: var(--di-t1); color: var(--di-surface); box-shadow: none }
.di .di-btn--primary:hover { background: color-mix(in oklab, var(--di-ink) 78%, transparent) }

.di-done { display: flex; align-items: center; gap: 6px; height: 28px; font-weight: 500; color: var(--di-good); animation: di-in .36s var(--di-ease) backwards }
.di-done svg { width: 16px; height: 16px; animation: di-pop .36s var(--di-ease) backwards }
.di-done .di-cut { stroke: #fff }

.di-empty { margin: 0; padding: 14px 16px; color: var(--di-t3); animation: di-in .32s var(--di-ease) backwards }

@keyframes di-look { from { opacity: 0; filter: blur(2px) } }
@keyframes di-in { from { opacity: 0; transform: translateY(3px) } }
@keyframes di-pop { from { opacity: 0; transform: scale(.6) } }

@media (prefers-reduced-motion: reduce) {
  .di, .di *, .di *::before, .di *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_DECISIONS: Decision[] = [
  {
    id: "fallback",
    title: "Switch support replies to the faster model?",
    detail: "Same resolution rate in a 2-week test · 38% lower latency",
    primary: "Switch",
    secondary: "Keep testing",
  },
  {
    id: "budget",
    title: "Raise the monthly eval budget?",
    detail: "$420 used of $500 · 9 days left in the month",
    primary: "Raise to $800",
    secondary: "Keep $500",
  },
]

const Warn = () => (
  <svg className="di-glyph" viewBox="0 0 16 16" aria-hidden>
    <path d="M6.7 2.3a1.5 1.5 0 0 1 2.6 0l5.4 9.4A1.5 1.5 0 0 1 13.4 14H2.6a1.5 1.5 0 0 1-1.3-2.3Z" fill="currentColor" />
    <path className="di-cut" d="M8 5.8v3.2" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <circle className="di-cut-dot" cx="8" cy="11.3" r="0.8" />
  </svg>
)

const Tick = ({ className, state }: { className?: string; state?: string }) => (
  <svg className={className} data-state={state} viewBox="0 0 16 16" aria-hidden>
    <circle cx="8" cy="8" r="6.5" fill="currentColor" />
    <path className="di-cut" d="m5.3 8.2 1.8 1.8 3.6-3.8" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                DecisionInbox                               */
/* -------------------------------------------------------------------------- */

/** Open decisions with two quick answers each. An answered row confirms in green, folds away and opens the next one. */
export function DecisionInbox({
  decisions = DEFAULT_DECISIONS,
  onDecide,
  confirmMs = 1200,
  emptyText = "Nothing waiting on you – new decisions show up here.",
  className,
}: DecisionInboxProps) {
  const [answers, setAnswers] = React.useState<Record<string, DecisionAnswer>>({})
  const [gone, setGone] = React.useState<string[]>([])
  const [opened, setOpened] = React.useState<Record<string, boolean>>({})
  const timers = React.useRef<number[]>([])
  const latest = React.useRef(decisions)
  React.useEffect(() => {
    latest.current = decisions
  })
  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  const isOpen = (d: Decision) => opened[d.id] ?? !d.collapsed
  const pending = decisions.filter((d) => !answers[d.id]).length
  const visible = decisions.filter((d) => !gone.includes(d.id))
  const firstVisible = visible[0]?.id

  const decide = (d: Decision, answer: DecisionAnswer) => {
    if (answers[d.id]) return
    setAnswers((a) => ({ ...a, [d.id]: answer }))
    onDecide?.(d, answer)
    // After the confirmation: fold this row away and open the next folded decision.
    const t = window.setTimeout(() => {
      setGone((g) => [...g, d.id])
      setOpened((o) => {
        const next = latest.current.find((x) => x.id !== d.id && x.collapsed && o[x.id] === undefined)
        return next ? { ...o, [next.id]: true } : o
      })
    }, confirmMs)
    timers.current.push(t)
  }

  const clear = pending === 0

  return (
    <section className={cn("di", className)} aria-label="Decisions">
      <style href="decision-inbox" precedence="default">
        {CSS}
      </style>

      <header className="di-head" aria-live="polite">
        {clear ? <Tick key="clear" className="di-glyph" state="clear" /> : <Warn key="warn" />}
        <span key={clear ? "clear" : pending} className="di-head-text">
          {clear ? "All caught up" : `${pending} ${pending === 1 ? "needs" : "need"} your input`}
        </span>
      </header>

      <div>
        {decisions.map((d) => {
          const open = isOpen(d)
          const answer = answers[d.id]
          const isGone = gone.includes(d.id)
          return (
            <div key={d.id} className="di-row" data-gone={isGone || undefined} inert={isGone || undefined}>
              <div className="di-row-inner">
                <div className="di-item" data-line={d.id !== firstVisible || undefined} data-answered={answer ? "" : undefined}>
                  <button
                    type="button"
                    className="di-title"
                    data-open={open}
                    aria-expanded={open}
                    tabIndex={open ? -1 : 0}
                    onClick={() => {
                      if (!open) setOpened((o) => ({ ...o, [d.id]: true }))
                    }}
                  >
                    {d.title}
                    <span className="di-chev" aria-hidden>
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="m6.25 4.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                  <div className="di-body" data-open={open} inert={!open || undefined}>
                    <div className="di-body-inner">
                      {d.detail && <p className="di-detail">{d.detail}</p>}
                      <div className="di-actions">
                        {answer ? (
                          <span className="di-done" role="status">
                            <Tick />
                            {answer === "primary" ? d.primary : d.secondary}
                          </span>
                        ) : (
                          <>
                            <button type="button" className="di-btn di-btn--primary" onClick={() => decide(d, "primary")}>
                              {d.primary}
                            </button>
                            <button type="button" className="di-btn" onClick={() => decide(d, "secondary")}>
                              {d.secondary}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {visible.length === 0 && <p className="di-empty">{emptyText}</p>}
      </div>
    </section>
  )
}

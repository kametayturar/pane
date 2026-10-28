"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Tip = {
  id: string
  title: string
  /** Short explanation. Can contain `<Kbd>` or other inline nodes. */
  description: React.ReactNode
  /** Label of the action button, e.g. "Try it". */
  action: string
  /** Text shown once the tip is taken, e.g. "Invite sent". Defaults to "Done". */
  doneLabel?: string
  /** Makes the action button solid (use for one tip at most). */
  primary?: boolean
  /** Called when the action is taken. */
  onAction?: (tip: Tip) => void
}

export type TipsPanelProps = {
  tips: Tip[]
  /** Heading at the top of the card. */
  title?: string
  /** Shows a Close button in a footer row. */
  onClose?: () => void
  closeLabel?: string
  /** Ids of tips that start as done. */
  defaultDone?: string[]
  /** Called with the ids of all done tips after every change. */
  onDoneChange?: (ids: string[]) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tp {
  --tp-ink: #000;
  --tp-surface: #fff;
  --tp-accent: #0060e2;
  --tp-ok: #1a9a52;
  --tp-t1: color-mix(in oklab, var(--tp-ink) 88%, transparent);
  --tp-t2: color-mix(in oklab, var(--tp-ink) 61%, transparent);
  --tp-t3: color-mix(in oklab, var(--tp-ink) 45%, transparent);
  --tp-t4: color-mix(in oklab, var(--tp-ink) 27%, transparent);
  --tp-fill: color-mix(in oklab, var(--tp-ink) 6%, transparent);
  --tp-line: color-mix(in oklab, var(--tp-ink) 6%, transparent);
  --tp-wash: color-mix(in oklab, var(--tp-ink) 1.5%, transparent);
  --tp-on-solid: #fcfcfc;
  --tp-solid-hover: color-mix(in oklab, var(--tp-ink) 80%, transparent);
  --tp-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --tp-shadow-hover: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .12), 0 1px 3px 0 rgb(0 0 0 / .07);
  --tp-ease: cubic-bezier(.22, 1, .36, 1);
  --tp-max-height: 420px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  border-radius: 10px;
  background: var(--tp-surface);
  box-shadow: var(--tp-shadow);
  color: var(--tp-t1);
  font-family: var(--tp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .tp {
  --tp-ink: #fff;
  --tp-surface: #1c1c1e;
  --tp-accent: #4d8dff;
  --tp-ok: #5fd394;
  --tp-t1: color-mix(in oklab, var(--tp-ink) 90%, transparent);
  --tp-t2: color-mix(in oklab, var(--tp-ink) 62%, transparent);
  --tp-t3: color-mix(in oklab, var(--tp-ink) 46%, transparent);
  --tp-t4: color-mix(in oklab, var(--tp-ink) 28%, transparent);
  --tp-fill: color-mix(in oklab, var(--tp-ink) 8%, transparent);
  --tp-line: color-mix(in oklab, var(--tp-ink) 8%, transparent);
  --tp-wash: color-mix(in oklab, var(--tp-ink) 3%, transparent);
  --tp-on-solid: #1c1c1e;
  --tp-solid-hover: color-mix(in oklab, var(--tp-ink) 80%, transparent);
  --tp-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --tp-shadow-hover: 0 0 0 .5px rgb(255 255 255 / .16), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.tp *, .tp *::before, .tp *::after { box-sizing: border-box }
.tp button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.tp :focus-visible { outline: 2px solid color-mix(in oklab, var(--tp-accent) 60%, transparent); outline-offset: 1px }

/* Header */
.tp-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px;
  border-bottom: .5px solid var(--tp-line);
}
.tp-title { margin: 0; font-size: 15px; font-weight: 500; line-height: 24px; color: var(--tp-ink) }
.tp-count { font-size: 12px; line-height: 16px; color: var(--tp-t3); font-variant-numeric: tabular-nums }

/* Body: its own width decides the column count (container query), its height caps then scrolls */
.tp-body { container-type: inline-size; max-height: var(--tp-max-height); overflow-y: auto; scrollbar-width: thin }
.tp-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0; padding: 12px; list-style: none }
@container (max-width: 560px) { .tp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
@container (max-width: 380px) { .tp-grid { grid-template-columns: minmax(0, 1fr) } }

/* Tip */
.tp-tip {
  display: flex; flex-direction: column; align-items: flex-start; padding: 12px; border-radius: 8px;
  box-shadow: inset 0 0 0 .5px var(--tp-line); transition: background-color .26s;
  animation: tp-in .48s var(--tp-ease) backwards;
}
.tp-tip[data-done] { background: var(--tp-wash) }
.tp-tip-title { margin: 0; font-weight: 500; color: var(--tp-ink) }
.tp-tip-text { margin: 2px 0 12px; color: var(--tp-t2) }
.tp-tip > :last-child { margin-top: auto }
.tp-kbd {
  display: inline-grid; place-items: center; height: 18px; padding: 0 5px; border-radius: 5px; background: var(--tp-surface);
  box-shadow: var(--tp-shadow); font: inherit; font-size: 11px; font-weight: 500; line-height: 11px; color: var(--tp-t1);
  vertical-align: 1px;
}

/* Buttons */
.tp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 28px; padding: 0 10px;
  border-radius: 6px; background: var(--tp-surface); box-shadow: var(--tp-shadow);
  font-size: 13px; font-weight: 500; line-height: 20px; color: var(--tp-ink); white-space: nowrap;
  transition: box-shadow .14s, background-color .14s, transform .16s var(--tp-ease);
}
.tp-btn:hover { box-shadow: var(--tp-shadow-hover) }
.tp-btn:active { transform: scale(.98) }
.tp-btn[data-primary] { background: var(--tp-t1); color: var(--tp-on-solid); box-shadow: none }
.tp-btn[data-primary]:hover { background: var(--tp-solid-hover) }

/* Done state */
.tp-done {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; font-weight: 500; color: var(--tp-ok);
  animation: tp-pop .36s var(--tp-ease) backwards;
}
.tp-done svg { width: 16px; height: 16px; flex: none }

.tp-foot { display: flex; justify-content: flex-end; padding: 8px; border-top: .5px solid var(--tp-line) }

@keyframes tp-in { from { opacity: 0; transform: translateY(4px) } }
@keyframes tp-pop { from { opacity: 0; transform: scale(.94) } }

@media (pointer: coarse) { .tp-btn, .tp-done { height: 34px } }
@media (prefers-reduced-motion: reduce) {
  .tp *, .tp *::before, .tp *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

/** A keyboard key, for use inside a tip's description. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="tp-kbd">{children}</kbd>
}

const DoneIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="6.5" fill="currentColor" />
    <path d="m5.6 8.1 1.7 1.7 3.2-3.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                  TipsPanel                                 */
/* -------------------------------------------------------------------------- */

export function TipsPanel({
  tips,
  title = "Tips",
  onClose,
  closeLabel = "Close",
  defaultDone = [],
  onDoneChange,
  className,
}: TipsPanelProps) {
  const [done, setDone] = React.useState<string[]>(defaultDone)
  const doneCount = tips.filter((t) => done.includes(t.id)).length

  const take = (tip: Tip) => {
    if (done.includes(tip.id)) return
    const next = [...done, tip.id]
    setDone(next)
    tip.onAction?.(tip)
    onDoneChange?.(next)
  }

  return (
    <section className={cn("tp", className)} aria-label={title}>
      <style href="tips-panel" precedence="default">
        {CSS}
      </style>

      <header className="tp-head">
        <h3 className="tp-title">{title}</h3>
        <span className="tp-count" aria-live="polite">
          {doneCount}/{tips.length} done
        </span>
      </header>

      <div className="tp-body">
        <ul className="tp-grid">
          {tips.map((tip, i) => {
            const isDone = done.includes(tip.id)
            return (
              <li
                key={tip.id}
                className="tp-tip"
                data-done={isDone || undefined}
                style={{ animationDelay: `${80 + i * 50}ms` }}
              >
                <p className="tp-tip-title">{tip.title}</p>
                <p className="tp-tip-text">{tip.description}</p>
                {isDone ? (
                  <span className="tp-done" role="status">
                    <DoneIcon />
                    {tip.doneLabel ?? "Done"}
                  </span>
                ) : (
                  <button type="button" className="tp-btn" data-primary={tip.primary || undefined} onClick={() => take(tip)}>
                    {tip.action}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {onClose && (
        <footer className="tp-foot">
          <button type="button" className="tp-btn" onClick={onClose}>
            {closeLabel}
          </button>
        </footer>
      )}
    </section>
  )
}

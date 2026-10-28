"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Recommendation = {
  id: string
  /** Short name, e.g. "Incremental sync". */
  label: string
  /** Why this option is suggested. Wrap the option's name in <strong> to emphasise it. */
  reason: React.ReactNode
  /** Confidence from 0 (none) to 3 (strong). Drives the bars and their colour. */
  signal: 0 | 1 | 2 | 3
  /** Text of the accept button. Defaults to "Accept <label in lower case>". */
  acceptLabel?: string
}

export type SmartRecommendationProps = {
  /** The first option is the recommended one, the rest are alternatives. */
  options?: Recommendation[]
  /** Called when an option is accepted. */
  onAccept?: (option: Recommendation) => void
  /** Called when an accept is undone. */
  onUndo?: (option: Recommendation) => void
  /** Starts with the reason visible. */
  defaultOpen?: boolean
  /** Heading of the card. */
  title?: string
  className?: string
}

export const DEFAULT_OPTIONS: Recommendation[] = [
  {
    id: "incremental",
    label: "Incremental sync",
    signal: 3,
    reason: (
      <>
        Only 4% of rows changed since yesterday – switching to <strong>Incremental sync</strong> saves about 40 minutes.
      </>
    ),
  },
  {
    id: "full",
    label: "Full refresh",
    signal: 1,
    reason: (
      <>
        A <strong>Full refresh</strong> rebuilds every table. Safest after schema changes, but takes about 50 minutes.
      </>
    ),
  },
  {
    id: "skip",
    label: "Skip tonight",
    signal: 0,
    reason: (
      <>
        <strong>Skip tonight</strong> keeps the current data. Nothing runs until tomorrow's schedule.
      </>
    ),
  },
]

const SIGNAL_WORDS = ["No signal", "Weak signal", "Good signal", "Strong signal"] as const

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.sr {
  --sr-ink: #000;
  --sr-surface: #fff;
  --sr-accent: #0060e2;
  --sr-accent-a: rgb(0 96 226 / .765);
  --sr-accent-bg: rgb(0 96 226 / .05);
  --sr-accent-line: rgb(0 96 226 / .35);
  --sr-tag: rgb(0 96 226 / .08);
  --sr-alt: #5b5bd6;
  --sr-alt-bg: rgb(91 91 214 / .1);
  --sr-ok: #1a9a52;
  --sr-ok-bg: rgb(26 154 82 / .08);
  --sr-warn: #e8a20c;
  --sr-menu: #fff;
  --sr-t1: color-mix(in oklab, var(--sr-ink) 88%, transparent);
  --sr-t2: color-mix(in oklab, var(--sr-ink) 61%, transparent);
  --sr-t3: color-mix(in oklab, var(--sr-ink) 45%, transparent);
  --sr-t4: color-mix(in oklab, var(--sr-ink) 27%, transparent);
  --sr-icon: color-mix(in oklab, var(--sr-ink) 44.7%, transparent);
  --sr-fill: color-mix(in oklab, var(--sr-ink) 6%, transparent);
  --sr-line: color-mix(in oklab, var(--sr-ink) 6%, transparent);
  --sr-wash: color-mix(in oklab, var(--sr-ink) 3%, transparent);
  --sr-bar: color-mix(in oklab, var(--sr-ink) 10%, transparent);
  --sr-on-solid: #fcfcfc;
  --sr-solid-hover: color-mix(in oklab, var(--sr-ink) 80%, transparent);
  --sr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --sr-shadow-hover: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .12), 0 1px 3px 0 rgb(0 0 0 / .07);
  --sr-shadow-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --sr-ease: cubic-bezier(.22, 1, .36, 1);
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 440px;
  border-radius: 10px;
  background: var(--sr-surface);
  box-shadow: var(--sr-shadow);
  color: var(--sr-t1);
  font-family: var(--sr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .sr {
  --sr-ink: #fff;
  --sr-surface: #1c1c1e;
  --sr-accent: #4d8dff;
  --sr-accent-a: #4d8dff;
  --sr-accent-bg: rgb(77 141 255 / .14);
  --sr-accent-line: rgb(77 141 255 / .4);
  --sr-tag: rgb(77 141 255 / .16);
  --sr-alt: #9d9dff;
  --sr-alt-bg: rgb(91 91 214 / .22);
  --sr-ok: #3ec27a;
  --sr-ok-bg: rgb(26 154 82 / .14);
  --sr-warn: #f0b232;
  --sr-menu: #232326;
  --sr-t1: color-mix(in oklab, var(--sr-ink) 90%, transparent);
  --sr-t2: color-mix(in oklab, var(--sr-ink) 62%, transparent);
  --sr-t3: color-mix(in oklab, var(--sr-ink) 46%, transparent);
  --sr-t4: color-mix(in oklab, var(--sr-ink) 30%, transparent);
  --sr-icon: color-mix(in oklab, var(--sr-ink) 46%, transparent);
  --sr-fill: color-mix(in oklab, var(--sr-ink) 8%, transparent);
  --sr-line: color-mix(in oklab, var(--sr-ink) 8%, transparent);
  --sr-wash: color-mix(in oklab, var(--sr-ink) 4%, transparent);
  --sr-bar: color-mix(in oklab, var(--sr-ink) 14%, transparent);
  --sr-on-solid: #161618;
  --sr-solid-hover: color-mix(in oklab, var(--sr-ink) 82%, transparent);
  --sr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --sr-shadow-hover: 0 0 0 .5px rgb(255 255 255 / .16), 0 1px 2px 0 rgb(0 0 0 / .4);
  --sr-shadow-pop: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.sr *, .sr *::before, .sr *::after { box-sizing: border-box }
.sr button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.sr :focus-visible { outline: 2px solid color-mix(in oklab, var(--sr-accent) 60%, transparent); outline-offset: 1px }

/* Header (a button that folds the card) */
.sr .sr-head {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 44px; padding: 0 12px 0 16px;
  border-radius: 10px 10px 0 0; text-align: left; transition: background-color .14s;
}
.sr[data-open="false"] .sr-head { border-radius: 10px }
.sr .sr-head:hover { background: var(--sr-wash) }
.sr .sr-head:focus-visible { outline-offset: -2px }
.sr-mark { width: 16px; height: 16px; flex: none; color: var(--sr-t1) }
.sr-title { font-weight: 500; color: var(--sr-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0 }
.sr-pill {
  flex: none; padding: 0 6px; border-radius: 5px; background: var(--sr-alt-bg); font-size: 12px; font-weight: 500;
  line-height: 20px; color: var(--sr-alt); animation: sr-swap .3s var(--sr-ease) backwards;
}
.sr-chevron {
  display: grid; place-items: center; flex: none; width: 20px; height: 20px; margin-left: auto; color: var(--sr-icon);
  transition: transform .28s var(--sr-ease), color .14s;
}
.sr-chevron svg { width: 16px; height: 16px }
.sr[data-open="false"] .sr-chevron { transform: rotate(-90deg) }
.sr-head:hover .sr-chevron { color: var(--sr-t1) }

/* Body folds by animating the grid row from 1fr to 0fr */
.sr-body { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .34s var(--sr-ease), visibility 0s }
.sr[data-open="false"] .sr-body { grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .34s var(--sr-ease), visibility 0s .34s }
.sr-clip { min-height: 0; overflow: hidden }
.sr-reason { margin: 0; padding: 0 16px 14px; color: var(--sr-t2); animation: sr-swap .36s var(--sr-ease) backwards }
.sr-reason strong { font-weight: 500; color: var(--sr-t1) }

/* Footer: signal on the left, actions on the right */
.sr-foot {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 10px;
  padding: 10px 10px 10px 16px; border-top: .5px solid var(--sr-line);
}
.sr-signal { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; line-height: 16px; color: var(--sr-t2) }
.sr-bars { display: inline-flex; align-items: flex-end; gap: 2px; width: 13px; height: 11px; flex: none }
.sr-bars > span { width: 3px; border-radius: 1px; background: var(--sr-bar); transition: background-color .26s }
.sr-bars > span:nth-child(1) { height: 5px }
.sr-bars > span:nth-child(2) { height: 8px }
.sr-bars > span:nth-child(3) { height: 11px }
.sr [data-level="1"] > span[data-on] { background: var(--sr-warn) }
.sr [data-level="2"] > span[data-on] { background: var(--sr-accent-a) }
.sr [data-level="3"] > span[data-on] { background: var(--sr-ok) }
.sr [data-level="0"] > span:first-child { background: var(--sr-t4) }

.sr-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; min-width: 0 }
.sr-alt { position: relative }
.sr .sr-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 28px; padding: 0 10px;
  border-radius: 6px; background: var(--sr-surface); box-shadow: var(--sr-shadow);
  font-weight: 500; color: var(--sr-ink); white-space: nowrap;
  transition: background-color .14s, box-shadow .14s, transform .16s var(--sr-ease);
}
.sr .sr-btn:hover { box-shadow: var(--sr-shadow-hover) }
.sr .sr-btn:active { transform: scale(.97) }
.sr .sr-btn[aria-expanded="true"] { background: var(--sr-wash) }
.sr .sr-btn--icon { padding: 0 10px 0 8px }
.sr .sr-btn--icon svg { width: 16px; height: 16px; flex: none; color: var(--sr-icon) }
.sr .sr-btn--primary { background: var(--sr-t1); color: var(--sr-on-solid); box-shadow: none }
.sr .sr-btn--primary:hover { background: var(--sr-solid-hover); box-shadow: none }

.sr-done {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0; height: 28px; padding: 0 10px 0 8px; border-radius: 6px;
  background: var(--sr-ok-bg); font-weight: 500; color: var(--sr-ok); animation: sr-swap .3s var(--sr-ease) backwards;
}
.sr-done svg { width: 16px; height: 16px; flex: none }
.sr-done-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis }

/* Alternatives menu */
.sr-menu {
  position: absolute; right: 0; bottom: calc(100% + 6px); z-index: 5; display: grid; gap: 2px; width: 248px; padding: 4px;
  border-radius: 10px; background: var(--sr-menu); box-shadow: var(--sr-shadow-pop);
  animation: sr-drop .18s var(--sr-ease) backwards;
}
.sr .sr-option {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; height: 32px; padding: 0 10px 0 8px;
  border-radius: 6px; text-align: left; color: var(--sr-t1); transition: background-color .09s ease-out;
}
.sr .sr-option:hover { background: var(--sr-wash) }
.sr .sr-option[aria-checked="true"] { background: var(--sr-accent-bg); box-shadow: inset 0 0 0 .5px var(--sr-accent-line) }
.sr .sr-option:focus-visible { outline-offset: -2px }
.sr-option-label { display: inline-flex; align-items: center; gap: 6px; min-width: 0 }
.sr-option-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.sr-tag {
  flex: none; padding: 0 5px; border-radius: 5px; background: var(--sr-tag); font-size: 11px; font-weight: 500;
  line-height: 18px; color: var(--sr-accent);
}

/* Narrow cards: the menu is positioned against the whole action row */
@container (max-width: 420px) {
  .sr-actions { position: relative }
  .sr-alt { position: static }
  .sr-menu { width: min(248px, 100cqw - 20px) }
}
@container (max-width: 340px) {
  .sr .sr-head { padding: 0 10px 0 14px }
  .sr-reason { padding-left: 14px; padding-right: 14px }
  .sr-foot { padding: 10px 10px 10px 14px }
}

@keyframes sr-swap { from { opacity: 0; transform: translateY(2px) } }
@keyframes sr-drop { from { opacity: 0; transform: translateY(4px) scale(.98) } }

@media (pointer: coarse) {
  .sr .sr-head { height: 48px }
  .sr .sr-btn, .sr-done { height: 36px }
  .sr .sr-btn { padding: 0 14px }
  .sr .sr-btn--icon, .sr-done { padding: 0 14px 0 12px }
  .sr .sr-option { height: 40px }
}
@media (prefers-reduced-motion: reduce) {
  .sr *, .sr *::before, .sr *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const ico = { viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const

const SparkIcon = () => (
  <svg {...ico} className="sr-mark">
    <path d="M7 2.75 8.3 6.2l3.45 1.3-3.45 1.3L7 12.25 5.7 8.8 2.25 7.5 5.7 6.2z" />
    <path d="M12.25 2.5v2.5M11 3.75h2.5" />
  </svg>
)
const ChevronIcon = () => (
  <svg {...ico} strokeWidth={1.4}>
    <path d="M4.5 6.25 8 9.75l3.5-3.5" />
  </svg>
)
const SwapIcon = () => (
  <svg {...ico}>
    <path d="M5 12.5v-9M2.75 5.75 5 3.5l2.25 2.25M11 3.5v9M8.75 10.25 11 12.5l2.25-2.25" />
  </svg>
)
const CheckIcon = () => (
  <svg {...ico}>
    <circle cx="8" cy="8" r="5.75" />
    <path d="m5.6 8.1 1.7 1.7 3.2-3.4" />
  </svg>
)
const UndoIcon = () => (
  <svg {...ico}>
    <path d="M6 3.75 3.25 6.5 6 9.25M3.5 6.5h5.75a3.5 3.5 0 0 1 0 7H7.5" />
  </svg>
)

function SignalBars({ level, label }: { level: number; label?: string }) {
  return (
    <span className="sr-bars" data-level={level} aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined}>
      {[1, 2, 3].map((n) => (
        <span key={n} data-on={n <= level || undefined} />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                             SmartRecommendation                            */
/* -------------------------------------------------------------------------- */

export function SmartRecommendation({
  options = DEFAULT_OPTIONS,
  onAccept,
  onUndo,
  defaultOpen = true,
  title = "Smart recommendation",
  className,
}: SmartRecommendationProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [selectedId, setSelectedId] = React.useState(options[0]?.id)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [accepted, setAccepted] = React.useState(false)
  const rootRef = React.useRef<HTMLElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const menuId = React.useId()

  const selected = options.find((o) => o.id === selectedId) ?? options[0]

  // Close the menu on an outside press.
  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [menuOpen])

  // Move focus to the current option when the menu opens.
  React.useEffect(() => {
    if (!menuOpen) return
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]')
    const checked = menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    ;(checked ?? items?.[0])?.focus()
  }, [menuOpen])

  if (!selected) return null

  const isAlternative = selected.id !== options[0].id
  const acceptLabel = selected.acceptLabel ?? `Accept ${selected.label.toLowerCase()}`

  const closeMenu = (returnFocus: boolean) => {
    setMenuOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      closeMenu(true)
      return
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
    e.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])
    const at = items.indexOf(document.activeElement as HTMLElement)
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
    items[next]?.focus()
  }

  return (
    <section ref={rootRef} className={cn("sr", className)} data-open={open} aria-label={title}>
      <style href="smart-recommendation" precedence="default">
        {CSS}
      </style>

      <button type="button" className="sr-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <SparkIcon />
        <span className="sr-title">{title}</span>
        {isAlternative && !accepted && <span className="sr-pill">Alternative</span>}
        <span className="sr-chevron" aria-hidden>
          <ChevronIcon />
        </span>
      </button>

      <div className="sr-body">
        <div className="sr-clip">
          <p className="sr-reason" key={selected.id} aria-live="polite">
            {selected.reason}
          </p>
        </div>
      </div>

      <footer className="sr-foot">
        <span className="sr-signal" title={SIGNAL_WORDS[selected.signal]}>
          <SignalBars level={selected.signal} />
          {SIGNAL_WORDS[selected.signal]}
        </span>

        <div className="sr-actions">
          {accepted ? (
            <>
              <span className="sr-done" role="status">
                <CheckIcon />
                <span className="sr-done-text">{selected.label} accepted</span>
              </span>
              <button
                type="button"
                className="sr-btn sr-btn--icon"
                onClick={() => {
                  setAccepted(false)
                  onUndo?.(selected)
                }}
              >
                <UndoIcon />
                Undo
              </button>
            </>
          ) : (
            <>
              {options.length > 1 && (
                <div className="sr-alt" onKeyDown={menuOpen ? onMenuKey : undefined}>
                  <button
                    ref={triggerRef}
                    type="button"
                    className="sr-btn sr-btn--icon"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-controls={menuOpen ? menuId : undefined}
                    onClick={() => setMenuOpen((m) => !m)}
                  >
                    <SwapIcon />
                    Alternatives
                  </button>
                  {menuOpen && (
                    <div ref={menuRef} id={menuId} className="sr-menu" role="menu" aria-label="Alternatives">
                      {options.map((o, i) => (
                        <button
                          key={o.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={o.id === selected.id}
                          className="sr-option"
                          onClick={() => {
                            setSelectedId(o.id)
                            closeMenu(true)
                          }}
                        >
                          <span className="sr-option-label">
                            <span className="sr-option-name">{o.label}</span>
                            {i === 0 && <span className="sr-tag">Recommended</span>}
                          </span>
                          <SignalBars level={o.signal} label={SIGNAL_WORDS[o.signal]} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                className="sr-btn sr-btn--primary"
                onClick={() => {
                  setAccepted(true)
                  setMenuOpen(false)
                  onAccept?.(selected)
                }}
              >
                {acceptLabel}
              </button>
            </>
          )}
        </div>
      </footer>
    </section>
  )
}

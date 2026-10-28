"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Memory = {
  id: string
  text: string
  category: string
  /** Where it came from, shown as given, e.g. "From chat". */
  source?: string
  /** When it was saved, shown as given, e.g. "Oct 12". */
  date?: string
  paused?: boolean
}

export type MemoryPanelAction = {
  label: string
  onClick: () => void
}

export type MemoryPanelProps = {
  /** The memories. With `onChange` the panel shows exactly what you pass; without it they are the starting list. */
  memories?: Memory[]
  /** Called with the full next list after every add, edit, pause, forget or undo. */
  onChange?: (memories: Memory[]) => void
  onAdd?: (memory: Memory) => void
  onEdit?: (id: string, text: string) => void
  onPause?: (id: string, paused: boolean) => void
  /** A forgotten memory can come back with Undo. */
  onForget?: (id: string) => void
  /** Undo was pressed: the memory is back at its old place. */
  onRestore?: (memory: Memory) => void
  /** Controlled state of the "Use memory" switch. */
  enabled?: boolean
  defaultEnabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  /** Group order, and the choices for a new memory. Defaults to the order of appearance. */
  categories?: string[]
  title?: string
  /** Max height of the list in px; it scrolls after that. */
  maxHeight?: number
  /** How long Undo stays available after forgetting, in ms. */
  undoFor?: number
  /** Source given to memories added in the panel. */
  addedSource?: string
  /** Note shown under the title while the switch is off. */
  offNote?: React.ReactNode
  /** A button in the last row. Undo takes its place for a moment after forgetting. */
  action?: MemoryPanelAction
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mm {
  --mm-ink: #000;
  --mm-surface: #fff;
  --mm-accent: #0060e2;
  --mm-t1: color-mix(in oklab, var(--mm-ink) 88%, transparent);
  --mm-t2: color-mix(in oklab, var(--mm-ink) 61%, transparent);
  --mm-t3: color-mix(in oklab, var(--mm-ink) 45%, transparent);
  --mm-t4: color-mix(in oklab, var(--mm-ink) 27%, transparent);
  --mm-chip: color-mix(in oklab, var(--mm-ink) 78%, transparent);
  --mm-fill: color-mix(in oklab, var(--mm-ink) 6%, transparent);
  --mm-hover: color-mix(in oklab, var(--mm-ink) 4%, transparent);
  --mm-soft: color-mix(in oklab, var(--mm-ink) 3%, transparent);
  --mm-line: color-mix(in oklab, var(--mm-ink) 6%, transparent);
  --mm-row-solid: color-mix(in oklab, var(--mm-surface), var(--mm-ink) 3%);
  --mm-amber-fg: #9a6a00;
  --mm-amber-bg: rgb(232 162 12 / .12);
  --mm-main-fg: #fcfcfc;
  --mm-main-bg: color-mix(in oklab, var(--mm-ink) 88%, transparent);
  --mm-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --mm-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 400px;
  color: var(--mm-t1);
  font-family: var(--mm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .mm {
  --mm-ink: #fff;
  --mm-surface: #1c1c1e;
  --mm-accent: #4d8dff;
  --mm-t1: color-mix(in oklab, var(--mm-ink) 90%, transparent);
  --mm-t2: color-mix(in oklab, var(--mm-ink) 62%, transparent);
  --mm-t3: color-mix(in oklab, var(--mm-ink) 46%, transparent);
  --mm-t4: color-mix(in oklab, var(--mm-ink) 28%, transparent);
  --mm-chip: color-mix(in oklab, var(--mm-ink) 78%, transparent);
  --mm-fill: color-mix(in oklab, var(--mm-ink) 8%, transparent);
  --mm-hover: color-mix(in oklab, var(--mm-ink) 6%, transparent);
  --mm-soft: color-mix(in oklab, var(--mm-ink) 5%, transparent);
  --mm-line: color-mix(in oklab, var(--mm-ink) 8%, transparent);
  --mm-amber-fg: #fbbf24;
  --mm-amber-bg: rgb(251 191 36 / .12);
  --mm-main-fg: #171717;
  --mm-main-bg: rgb(255 255 255 / .9);
  --mm-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.mm *, .mm *::before, .mm *::after { box-sizing: border-box }
:where(.mm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.mm button:disabled { cursor: default }
.mm :focus-visible { outline: 2px solid color-mix(in oklab, var(--mm-accent) 60%, transparent); outline-offset: 1px }
.mm svg { display: block; flex: none }

.mm-card { border-radius: 10px; background: var(--mm-surface); box-shadow: var(--mm-shadow) }

/* Folding: grid rows 1fr -> 0fr, so nothing slides across */
.mm-fold {
  display: grid; grid-template-rows: 0fr; opacity: 0;
  transition: grid-template-rows .42s var(--mm-ease), opacity .32s var(--mm-ease) .08s;
}
.mm-fold[data-open="true"] {
  grid-template-rows: 1fr; opacity: 1;
  transition: grid-template-rows .42s var(--mm-ease), opacity .32s var(--mm-ease);
}
.mm-clip { min-height: 0; overflow: hidden }
.mm-clip[data-pad] { padding: 3px; margin: -3px }

/* Head */
.mm-head { display: flex; align-items: center; gap: 8px; padding: 12px 10px 0 16px }
.mm-title { margin: 0; font-size: 15px; line-height: 24px; font-weight: 500; color: var(--mm-ink) }
.mm-count {
  font-size: 11px; line-height: 18px; font-weight: 500; padding: 0 5px; border-radius: 5px;
  color: var(--mm-t2); background: var(--mm-fill); font-variant-numeric: tabular-nums;
}
.mm-switch {
  display: flex; align-items: center; gap: 8px; height: 28px; margin-left: auto; padding: 0 6px 0 8px;
  border-radius: 6px; color: var(--mm-t2); transition: background-color .09s, color .09s;
}
.mm-switch:hover { background: var(--mm-hover) }
.mm-track {
  position: relative; width: 26px; height: 16px; border-radius: 5px;
  background: color-mix(in oklab, var(--mm-ink) 10%, transparent); transition: background-color .22s;
}
.mm-switch[aria-checked="true"] .mm-track { background: color-mix(in oklab, var(--mm-accent) 76.5%, transparent) }
.mm-knob {
  position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 3.5px; background: #fff;
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .16); transition: transform .26s var(--mm-ease);
}
.mm-switch[aria-checked="true"] .mm-knob { transform: translateX(10px) }

.mm-note {
  display: flex; gap: 8px; margin: 10px 12px 0 16px; padding: 8px 10px; border-radius: 8px;
  font-size: 12px; line-height: 16px; color: var(--mm-t2); background: var(--mm-soft);
}
.mm-note svg { margin-top: 0; color: var(--mm-t3) }

/* Filters: chips (a radiogroup) and a search field that overlays them */
.mm-filters {
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 28px; gap: 8px; align-items: center;
  padding: 12px 10px 12px 16px; border-bottom: .5px solid var(--mm-line); transition: opacity .3s;
}
.mm-chips {
  display: flex; gap: 2px; margin: -3px; padding: 3px; overflow-x: auto; scrollbar-width: none;
  transition: opacity .22s, filter .22s;
}
.mm-chips { grid-area: 1 / 1 }
.mm-search-open { grid-area: 1 / 2 }
.mm-chips::-webkit-scrollbar { display: none }
.mm-filters[data-searching] .mm-chips { opacity: 0; filter: blur(3px); pointer-events: none }
.mm-chip, .mm-cat {
  display: inline-flex; align-items: center; flex: none; height: 28px; border-radius: 6px; font-weight: 500;
  color: var(--mm-chip); white-space: nowrap; transition: background-color .09s, color .09s, box-shadow .09s;
}
.mm-chip { gap: 6px; padding: 4px 10px }
.mm-cat { padding: 4px 8px; font-size: 12px }
.mm-chip:hover, .mm-cat:hover { background: var(--mm-soft) }
.mm-chip[aria-checked="true"], .mm-cat[aria-checked="true"] {
  background: var(--mm-hover); box-shadow: inset 0 0 0 .5px var(--mm-line); color: var(--mm-ink);
}
.mm-chip-count { font-size: 12px; font-weight: 400; color: var(--mm-t2); font-variant-numeric: tabular-nums }
.mm-icon {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px; color: var(--mm-t3);
  transition: background-color .09s, color .09s, opacity .22s;
}
.mm-icon:hover { background: color-mix(in oklab, var(--mm-ink) 5%, transparent); color: var(--mm-ink) }
.mm-search-open[data-hidden] { opacity: 0; pointer-events: none }
.mm-search {
  grid-area: 1 / 1 / 2 / 3; z-index: 1; display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 2px 0 8px;
  border-radius: 6px; color: var(--mm-t3); background: var(--mm-soft); box-shadow: inset 0 0 0 .5px var(--mm-line);
  opacity: 0; pointer-events: none; transition: opacity .22s .04s;
}
.mm-search[data-open] { opacity: 1; pointer-events: auto }
.mm-search input {
  flex: 1; min-width: 0; height: 100%; padding: 0; margin: 0; border: 0; outline: 0; background: transparent;
  font: inherit; color: var(--mm-ink);
}
.mm-search input::placeholder { color: var(--mm-t3) }
.mm-search .mm-icon { width: 24px; height: 24px }

/* List */
.mm-list { max-height: 360px; padding: 2px 6px 6px; overflow-y: auto; overscroll-behavior: contain; transition: opacity .3s }
.mm[data-enabled="false"] .mm-filters, .mm[data-enabled="false"] .mm-list { opacity: .45 }
.mm-ul { margin: 0; padding: 0; list-style: none }
.mm-group {
  margin: 0; padding: 12px 10px 4px; font-size: 10px; line-height: 16px; font-weight: 500; letter-spacing: .5px;
  text-transform: uppercase; color: var(--mm-t3);
}
.mm-row {
  transition: grid-template-rows .42s var(--mm-ease), opacity .32s var(--mm-ease) .08s, filter .32s var(--mm-ease);
}
.mm-row[data-open="true"] { transition: grid-template-rows .42s var(--mm-ease), opacity .32s var(--mm-ease), filter .32s var(--mm-ease) }
.mm-row[data-gone] { filter: blur(3px) }
.mm-row[data-new] { animation: mm-in .42s var(--mm-ease) backwards }
.mm-item { position: relative; padding: 8px 10px 7px; border-radius: 8px; transition: background-color .09s ease-out }
.mm-item:hover, .mm-item:focus-within { background: var(--mm-soft) }
.mm-text { margin: 0; color: var(--mm-t1); white-space: pre-wrap; overflow-wrap: anywhere; transition: color .24s }
.mm-item[data-paused] .mm-text { color: var(--mm-t3) }
.mm-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; font-size: 12px; line-height: 16px; color: var(--mm-t3) }
.mm-meta:empty { display: none }
.mm-dot { width: 2px; height: 2px; border-radius: 50%; background: var(--mm-t4); flex: none }
.mm-tag {
  display: inline-flex; align-items: center; height: 18px; padding: 0 6px; border-radius: 5px; font-size: 11px; font-weight: 500;
  line-height: 1; color: var(--mm-amber-fg); background: var(--mm-amber-bg); animation: mm-tag .28s var(--mm-ease) backwards;
}
.mm-acts {
  position: absolute; top: 6px; right: 6px; display: flex; gap: 2px; padding-left: 16px; opacity: 0;
  background: linear-gradient(90deg, transparent, var(--mm-row-solid) 16px); transition: opacity .12s;
}
.mm-item:hover .mm-acts, .mm-item:focus-within .mm-acts { opacity: 1 }
@media (hover: none) { .mm-acts { opacity: 1 } }
.mm-acts .mm-icon { width: 28px; height: 28px }
.mm-ico-swap { display: grid; place-items: center; animation: mm-ico .26s var(--mm-ease) backwards }

.mm-edit { display: block }
.mm-ta {
  display: block; width: 100%; margin: 0; padding: 0; border: 0; outline: 0; resize: none; background: transparent;
  font: inherit; color: var(--mm-ink); overflow: hidden;
}
.mm-ta::placeholder { color: var(--mm-t4) }
.mm-btns { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 8px }
.mm-btn {
  display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 6px; font-weight: 500;
  color: var(--mm-t2); transition: background-color .09s, color .09s, opacity .2s;
}
.mm-btn:hover { background: var(--mm-hover); color: var(--mm-ink) }
.mm-btn[data-main] { color: var(--mm-main-fg); background: var(--mm-main-bg) }
.mm-btn[data-main]:hover { background: var(--mm-main-bg); opacity: .88 }
.mm-btn[data-main]:disabled { opacity: .3 }

.mm-empty { padding: 26px 10px; text-align: center; color: var(--mm-t3) }

/* Bottom: add button <-> new memory editor */
.mm-bottom { padding: 6px; border-top: .5px solid var(--mm-line) }
.mm-add {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 10px; border-radius: 6px;
  color: var(--mm-t2); transition: background-color .09s, color .09s;
}
.mm-add:hover { background: var(--mm-hover); color: var(--mm-ink) }
.mm-new { padding: 6px 4px 2px 10px }
.mm-new-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px }
.mm-cats { display: flex; flex-wrap: wrap; gap: 2px; flex: 1; min-width: 0 }
.mm-new-row .mm-btns { margin-top: 0 }

/* Foot */
.mm-foot { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 16px; border-top: .5px solid var(--mm-line) }
.mm-caption {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 12px; line-height: 16px; color: var(--mm-t3);
}
.mm-caption > span { animation: mm-swap-in .32s var(--mm-ease) backwards }
.mm-caption b { font-weight: 500; color: var(--mm-t1) }
.mm-foot .mm-btn { height: 28px; font-size: 12px; animation: mm-swap-in .32s var(--mm-ease) backwards }
.mm-foot .mm-btn[data-undo] { color: var(--mm-accent) }
.mm-foot .mm-btn[data-undo]:hover { background: color-mix(in oklab, var(--mm-accent) 10%, transparent) }

/* Rolling numbers and blur crossfade */
.mm-swap { display: inline-grid; vertical-align: top; font-variant-numeric: tabular-nums }
.mm-swap > * { grid-area: 1 / 1; white-space: nowrap }
.mm-swap-in { animation: mm-swap-in .32s var(--mm-ease) backwards }
.mm-swap-out { animation: mm-swap-out .32s var(--mm-ease) forwards; pointer-events: none }

@keyframes mm-in { from { opacity: 0; filter: blur(3px); transform: translateY(4px) } }
@keyframes mm-tag { from { opacity: 0; transform: scale(.9) } }
@keyframes mm-ico { from { opacity: 0; transform: scale(.9) } }
@keyframes mm-swap-in { from { opacity: 0; filter: blur(2px) } }
@keyframes mm-swap-out { to { opacity: 0; filter: blur(2px) } }

@media (prefers-reduced-motion: reduce) {
  .mm *, .mm *::before, .mm *::after { animation: none !important; transition: none !important }
  .mm-swap-out { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const ico = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const
const stroke = { stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const

const SearchIcon = () => (
  <svg {...ico}>
    <circle cx="7.25" cy="7.25" r="4.25" {...stroke} />
    <path d="m10.5 10.5 3 3" {...stroke} />
  </svg>
)
const CloseIcon = () => (
  <svg {...ico}>
    <path d="m4.5 4.5 7 7m0-7-7 7" {...stroke} />
  </svg>
)
const EditIcon = () => (
  <svg {...ico}>
    <path d="m9.75 4.25 2 2M3.5 12.5l.5-2.5 6.75-6.75a1.06 1.06 0 0 1 1.5 0l.5.5a1.06 1.06 0 0 1 0 1.5L6 12l-2.5.5Z" {...stroke} />
  </svg>
)
const PauseIcon = () => (
  <svg {...ico}>
    <path d="M6 4.5v7M10 4.5v7" {...stroke} strokeWidth={1.7} />
  </svg>
)
const PlayIcon = () => (
  <svg {...ico}>
    <path d="M5.75 4.4v7.2a.5.5 0 0 0 .76.43l5.8-3.6a.5.5 0 0 0 0-.86l-5.8-3.6a.5.5 0 0 0-.76.43Z" {...stroke} />
  </svg>
)
const ForgetIcon = () => (
  <svg {...ico}>
    <path d="M3.5 5h9M6.5 5V3.75c0-.4.3-.75.75-.75h1.5c.45 0 .75.35.75.75V5M4.75 5l.5 7a1 1 0 0 0 1 .93h3.5a1 1 0 0 0 1-.93l.5-7" {...stroke} />
  </svg>
)
const PlusIcon = () => (
  <svg {...ico}>
    <path d="M8 3.5v9M3.5 8h9" {...stroke} />
  </svg>
)
const InfoIcon = () => (
  <svg {...ico}>
    <circle cx="8" cy="8" r="5.5" {...stroke} />
    <path d="M8 7.5v3M8 5.4v.1" {...stroke} />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const DEFAULT_MEMORIES: Memory[] = [
  { id: "m1", category: "Preferences", text: "Wants the short answer first, details only when asked", source: "From chat", date: "Oct 2", paused: true },
  { id: "m2", category: "Preferences", text: "Prefers metric units and 24-hour times", source: "You added", date: "Oct 7" },
  { id: "m3", category: "Work", text: "Product designer at a small studio, writes front-end code on the side", source: "From chat", date: "Sep 28" },
  { id: "m4", category: "Work", text: "Ships with React, Vite and Tailwind; deploys to Vercel", source: "From chat", date: "Oct 3" },
  { id: "m5", category: "Projects", text: "Building an open-source component library for AI products", source: "From chat", date: "Oct 9" },
  { id: "m6", category: "Projects", text: "Planning a launch post for the end of October", source: "You added", date: "Oct 14" },
]

function short(text: string, max = 40) {
  const t = text.replace(/\s+/g, " ").trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

const esc = (s: string) => globalThis.CSS.escape(s)

function makeMemory(text: string, category: string, source: string): Memory {
  return {
    id: `mm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    category,
    source,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }
}

function uniq(items: string[]) {
  return Array.from(new Set(items))
}

/** Text or a number that changes in place: the old value blurs out while the new one blurs in. */
function Swap({ value }: { value: string | number }) {
  const text = String(value)
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 320)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="mm-swap">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="mm-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} className={leaving !== null ? "mm-swap-in" : undefined}>
        {shown}
      </span>
    </span>
  )
}

function Fold({
  open,
  className,
  children,
  pad,
  ...rest
}: {
  open: boolean
  className?: string
  children: React.ReactNode
  pad?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mm-fold", className)} data-open={open} inert={!open} {...rest}>
      <div className="mm-clip" data-pad={pad || undefined}>
        {children}
      </div>
    </div>
  )
}

type RadioOption = { key: string; label: string; count?: number }

/** A radiogroup of chips: one tab stop, arrow keys move the selection. */
function RadioRow({
  label,
  options,
  value,
  onChange,
  variant,
  className,
}: {
  label: string
  options: RadioOption[]
  value: string
  onChange: (key: string) => void
  variant: "chip" | "cat"
  className: string
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return
    e.preventDefault()
    const at = Math.max(0, options.findIndex((o) => o.key === value))
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1
    const next = (at + step + options.length) % options.length
    onChange(options[next].key)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }
  const selected = options.some((o) => o.key === value) ? value : options[0]?.key
  return (
    <div role="radiogroup" aria-label={label} className={className} onKeyDown={onKeyDown}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={o.key === selected}
          tabIndex={o.key === selected ? 0 : -1}
          className={variant === "chip" ? "mm-chip" : "mm-cat"}
          onClick={() => onChange(o.key)}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="mm-chip-count">
              <Swap value={o.count} />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/** A textarea that grows with its content. */
function AutoTextarea({
  value,
  onValueChange,
  onSubmit,
  onCancel,
  autoFocus,
  ...rest
}: {
  value: string
  onValueChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
  autoFocus?: boolean
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "onKeyDown">) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  React.useEffect(() => {
    const el = ref.current
    if (!el || !autoFocus) return
    el.focus({ preventScroll: true })
    el.setSelectionRange(el.value.length, el.value.length)
  }, [autoFocus])
  return (
    <textarea
      ref={ref}
      rows={1}
      className="mm-ta"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault()
          onSubmit()
        } else if (e.key === "Escape") {
          e.preventDefault()
          e.stopPropagation()
          onCancel()
        }
      }}
      {...rest}
    />
  )
}

function EditRow({ memory, onSave, onCancel }: { memory: Memory; onSave: (text: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = React.useState(memory.text)
  const ok = draft.trim().length > 0
  const save = () => (ok ? onSave(draft.trim()) : undefined)
  return (
    <div className="mm-edit">
      <AutoTextarea
        autoFocus
        value={draft}
        onValueChange={setDraft}
        onSubmit={save}
        onCancel={onCancel}
        aria-label={`Edit memory: ${short(memory.text)}`}
      />
      <div className="mm-btns">
        <button type="button" className="mm-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="mm-btn" data-main disabled={!ok} onClick={save}>
          Save
        </button>
      </div>
    </div>
  )
}

function NewEditor({
  open,
  choices,
  defaultCategory,
  onSave,
  onCancel,
}: {
  open: boolean
  choices: string[]
  defaultCategory: string
  onSave: (text: string, category: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = React.useState("")
  const [category, setCategory] = React.useState(defaultCategory)
  const ok = draft.trim().length > 0
  const current = choices.includes(category) ? category : choices[0]
  const save = () => (ok ? onSave(draft.trim(), current) : undefined)
  return (
    <div className="mm-new">
      <AutoTextarea
        autoFocus={open}
        value={draft}
        onValueChange={setDraft}
        onSubmit={save}
        onCancel={onCancel}
        placeholder="What should it remember?"
        aria-label="New memory"
      />
      <div className="mm-new-row">
        {choices.length > 1 ? (
          <RadioRow
            label="Category"
            variant="cat"
            className="mm-cats"
            options={choices.map((c) => ({ key: c, label: c }))}
            value={current}
            onChange={setCategory}
          />
        ) : (
          <span className="mm-cats" />
        )}
        <div className="mm-btns">
          <button type="button" className="mm-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="mm-btn" data-main disabled={!ok} onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                MemoryPanel                                 */
/* -------------------------------------------------------------------------- */

export function MemoryPanel({
  memories,
  onChange,
  onAdd,
  onEdit,
  onPause,
  onForget,
  onRestore,
  enabled: enabledProp,
  defaultEnabled = true,
  onEnabledChange,
  categories,
  title = "Memory",
  maxHeight = 360,
  undoFor = 5000,
  addedSource = "You added",
  offNote = "Memory is off. New chats won't use or add memories; the ones saved here are kept.",
  action,
  className,
}: MemoryPanelProps) {
  const uid = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)

  /* Memories: controlled when both `memories` and `onChange` are given. */
  const controlled = memories !== undefined && onChange !== undefined
  const [internal, setInternal] = React.useState<Memory[]>(() => memories ?? DEFAULT_MEMORIES)
  const list = controlled ? memories : internal
  const commit = (next: Memory[]) => {
    if (!controlled) setInternal(next)
    onChange?.(next)
  }

  const [enabledInternal, setEnabledInternal] = React.useState(defaultEnabled)
  const enabled = enabledProp ?? enabledInternal
  const toggle = () => {
    const next = !enabled
    if (enabledProp === undefined) setEnabledInternal(next)
    onEnabledChange?.(next)
  }

  const [filter, setFilter] = React.useState("all")
  const [searching, setSearching] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [newKey, setNewKey] = React.useState(0)
  const [newCat, setNewCat] = React.useState("")
  const [freshId, setFreshId] = React.useState<string | null>(null)
  const [gone, setGone] = React.useState<{ memory: Memory; index: number } | null>(null)

  /* Timers */
  const timers = React.useRef(new Set<number>())
  React.useEffect(() => {
    const set = timers.current
    return () => set.forEach((id) => window.clearTimeout(id))
  }, [])
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }
  const focusLater = (selector: string) => later(() => rootRef.current?.querySelector<HTMLElement>(selector)?.focus(), 40)
  const revealLater = (id: string) =>
    later(() => rootRef.current?.querySelector(`[data-mm-id="${esc(id)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 220)

  /* Undo window after forgetting */
  React.useEffect(() => {
    if (!gone) return
    const id = window.setTimeout(() => setGone(null), Math.max(undoFor, 460))
    return () => window.clearTimeout(id)
  }, [gone, undoFor])
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const focusUndo = React.useRef(false)
  React.useEffect(() => {
    if (gone && focusUndo.current) {
      focusUndo.current = false
      undoRef.current?.focus()
    }
  }, [gone])

  /* Search field focus */
  const searchRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (searching) searchRef.current?.focus({ preventScroll: true })
  }, [searching])

  /* Derived view: a forgotten memory stays in place (folded shut) until its undo window ends. */
  const display =
    gone && !list.some((m) => m.id === gone.memory.id)
      ? [...list.slice(0, gone.index), gone.memory, ...list.slice(gone.index)]
      : list
  const cats = uniq([...(categories ?? []), ...display.map((m) => m.category), ...(filter.startsWith("c:") ? [filter.slice(2)] : [])])
  const choices = categories?.length ? uniq([...categories, ...list.map((m) => m.category)]) : cats.length ? cats : ["General"]
  const q = query.trim().toLowerCase()
  const isGone = (m: Memory) => gone?.memory.id === m.id && !list.some((x) => x.id === m.id)
  const shows = (m: Memory) =>
    !isGone(m) && (filter === "all" || m.category === filter.slice(2)) && (!q || m.text.toLowerCase().includes(q))
  const anyShown = display.some(shows)
  const pausedCount = list.filter((m) => m.paused).length

  const filterOptions: RadioOption[] = [
    { key: "all", label: "All", count: list.length },
    ...cats.map((c) => ({ key: `c:${c}`, label: c, count: list.filter((m) => m.category === c).length })),
  ]

  /* Actions */
  const saveEdit = (m: Memory, text: string) => {
    setEditingId(null)
    focusLater(`[data-mm-edit="${esc(m.id)}"]`)
    if (text === m.text) return
    commit(list.map((x) => (x.id === m.id ? { ...x, text } : x)))
    onEdit?.(m.id, text)
  }
  const cancelEdit = (m: Memory) => {
    setEditingId(null)
    focusLater(`[data-mm-edit="${esc(m.id)}"]`)
  }
  const togglePause = (m: Memory) => {
    const paused = !m.paused
    commit(list.map((x) => (x.id === m.id ? { ...x, paused } : x)))
    onPause?.(m.id, paused)
  }
  const forget = (m: Memory, viaKeyboard: boolean) => {
    const index = list.findIndex((x) => x.id === m.id)
    if (index < 0) return
    commit(list.filter((x) => x.id !== m.id))
    onForget?.(m.id)
    if (editingId === m.id) setEditingId(null)
    focusUndo.current = viaKeyboard
    setGone({ memory: m, index })
  }
  const undo = (viaKeyboard: boolean) => {
    if (!gone) return
    const { memory, index } = gone
    const next = [...list]
    next.splice(Math.min(index, next.length), 0, memory)
    commit(next)
    onRestore?.(memory)
    setGone(null)
    revealLater(memory.id)
    if (viaKeyboard) focusLater(`[data-mm-edit="${esc(memory.id)}"]`)
  }
  const openNew = () => {
    setEditingId(null)
    setNewCat(filter.startsWith("c:") ? filter.slice(2) : (choices[0] ?? "General"))
    setNewKey((k) => k + 1)
    setAdding(true)
  }
  const closeNew = () => {
    setAdding(false)
    focusLater("[data-mm-add]")
  }
  const saveNew = (text: string, category: string) => {
    const memory = makeMemory(text, category, addedSource)
    commit([...list, memory])
    onAdd?.(memory)
    setFreshId(memory.id)
    if (filter !== "all" && filter !== `c:${category}`) setFilter(`c:${category}`)
    setAdding(false)
    focusLater("[data-mm-add]")
    revealLater(memory.id)
  }
  const closeSearch = () => {
    setSearching(false)
    setQuery("")
    focusLater("[data-mm-search-open]")
  }

  /* Status line */
  const mode = gone ? "gone" : editingId !== null ? "edit" : adding ? "new" : "count"
  const caption =
    mode === "gone" && gone ? (
      <>Forgot “{short(gone.memory.text, 34)}”</>
    ) : mode === "edit" ? (
      "Editing · Enter to save, Esc to cancel"
    ) : mode === "new" ? (
      "New memory · Enter to save, Esc to cancel"
    ) : (
      <>
        <b>
          <Swap value={list.length} />
        </b>{" "}
        {list.length === 1 ? "memory" : "memories"}
        {pausedCount > 0 && (
          <>
            {" · "}
            <b>
              <Swap value={pausedCount} />
            </b>{" "}
            paused
          </>
        )}
      </>
    )

  const noteId = `${uid}-note`
  const titleId = `${uid}-title`

  return (
    <div ref={rootRef} role="group" aria-labelledby={titleId} className={cn("mm", className)} data-enabled={enabled}>
      <style href="memory-panel" precedence="default">
        {CSS}
      </style>

      <div className="mm-card">
        {/* Head */}
        <div className="mm-head">
          <h2 className="mm-title" id={titleId}>
            {title}
          </h2>
          <span className="mm-count" aria-label={`${list.length} memories`}>
            <Swap value={list.length} />
          </span>
          <button type="button" role="switch" aria-checked={enabled} aria-controls={noteId} className="mm-switch" onClick={toggle}>
            Use memory
            <span className="mm-track" aria-hidden>
              <span className="mm-knob" />
            </span>
          </button>
        </div>

        <Fold open={!enabled}>
          <div className="mm-note" id={noteId}>
            <InfoIcon />
            <span>{offNote}</span>
          </div>
        </Fold>

        {/* Filters */}
        <div className="mm-filters" data-searching={searching || undefined}>
          <RadioRow
            label="Filter by category"
            variant="chip"
            className="mm-chips"
            options={filterOptions}
            value={filter}
            onChange={setFilter}
          />
          <button
            type="button"
            className="mm-icon mm-search-open"
            data-mm-search-open
            data-hidden={searching || undefined}
            aria-label="Search memories"
            aria-expanded={searching}
            tabIndex={searching ? -1 : 0}
            onClick={() => setSearching(true)}
          >
            <SearchIcon />
          </button>
          <div className="mm-search" role="search" data-open={searching || undefined} inert={!searching}>
            <SearchIcon />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="Search memories"
              aria-label="Search memories"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  closeSearch()
                }
              }}
            />
            <button type="button" className="mm-icon" aria-label="Close search" onClick={closeSearch}>
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mm-list" style={{ maxHeight }}>
          {cats.map((cat) => {
            const items = display.filter((m) => m.category === cat)
            if (!items.length) return null
            const headId = `${uid}-g-${cat}`
            return (
              <Fold key={cat} open={items.some(shows)} className="mm-sec" role="region" aria-labelledby={headId}>
                <h3 className="mm-group" id={headId}>
                  {cat}
                </h3>
                <ul className="mm-ul" role="list">
                  {items.map((m) => {
                    const open = shows(m)
                    const editing = editingId === m.id
                    const label = short(m.text)
                    return (
                      <Fold
                        key={m.id}
                        open={open}
                        className="mm-row"
                        data-gone={isGone(m) || undefined}
                        data-new={m.id === freshId || undefined}
                        data-mm-id={m.id}
                        role="listitem"
                      >
                        <div className="mm-item" data-paused={m.paused || undefined}>
                          {editing ? (
                            <EditRow memory={m} onSave={(t) => saveEdit(m, t)} onCancel={() => cancelEdit(m)} />
                          ) : (
                            <>
                              <p className="mm-text">{m.text}</p>
                              {(m.source || m.date || m.paused) && (
                                <div className="mm-meta">
                                  {m.source}
                                  {m.source && m.date && <span className="mm-dot" aria-hidden />}
                                  {m.date}
                                  {m.paused && <span className="mm-tag">Paused</span>}
                                </div>
                              )}
                              <div className="mm-acts">
                                <button
                                  type="button"
                                  className="mm-icon"
                                  data-mm-edit={m.id}
                                  aria-label={`Edit “${label}”`}
                                  onClick={() => {
                                    setAdding(false)
                                    setEditingId(m.id)
                                  }}
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  type="button"
                                  className="mm-icon"
                                  aria-label={`${m.paused ? "Resume" : "Pause"} “${label}”`}
                                  aria-pressed={!!m.paused}
                                  onClick={() => togglePause(m)}
                                >
                                  <span key={m.paused ? "play" : "pause"} className="mm-ico-swap">
                                    {m.paused ? <PlayIcon /> : <PauseIcon />}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className="mm-icon"
                                  aria-label={`Forget “${label}”`}
                                  onClick={(e) => forget(m, e.detail === 0)}
                                >
                                  <ForgetIcon />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </Fold>
                    )
                  })}
                </ul>
              </Fold>
            )
          })}
          <Fold open={!anyShown}>
            <p className="mm-empty">{q ? "No matches" : "No memories here"}</p>
          </Fold>
        </div>

        {/* Bottom: add */}
        <div className="mm-bottom">
          <Fold open={!adding} pad>
            <button type="button" className="mm-add" data-mm-add aria-expanded={adding} onClick={openNew}>
              <PlusIcon />
              New memory
            </button>
          </Fold>
          <Fold open={adding} pad>
            <NewEditor
              key={newKey}
              open={adding}
              choices={choices}
              defaultCategory={newCat}
              onSave={saveNew}
              onCancel={closeNew}
            />
          </Fold>
        </div>

        {/* Foot: status line + action */}
        <div className="mm-foot">
          <div className="mm-caption" aria-live="polite" aria-atomic="true">
            <span key={mode}>{caption}</span>
          </div>
          {gone ? (
            <button key="undo" ref={undoRef} type="button" className="mm-btn" data-undo onClick={(e) => undo(e.detail === 0)}>
              Undo
            </button>
          ) : (
            action && (
              <button key="action" type="button" className="mm-btn" onClick={action.onClick}>
                {action.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

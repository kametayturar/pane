"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ComboboxOption = {
  value: string
  label: string
  /** Secondary text after the name, e.g. a role. */
  hint?: string
  /** An image URL, or `true` for initials. */
  avatar?: string | true
  /** A CSS color: shows a small dot before the name (labels, statuses). */
  color?: string
  /** A 14px icon before the name. */
  icon?: React.ReactNode
  /** Options with the same group are listed under one title. */
  group?: string
  /** Extra words the search also matches. */
  keywords?: string[]
}

export type ComboboxProps = {
  /** The list. */
  options: ComboboxOption[]
  /** Pick many (chips) or one – one closes the list after picking. */
  multiple?: boolean
  /** Controlled values (also for single choice, with at most one entry). */
  value?: string[]
  /** Starting values when uncontrolled. */
  defaultValue?: string[]
  /** Called on every pick, removal or creation. */
  onChange?: (value: string[], options: ComboboxOption[]) => void
  /** Shown while nothing is picked. */
  placeholder?: string
  /** Offer a create row when no option matches the typed text exactly. */
  creatable?: boolean
  /** Builds the new option – defaults to `{ value: text, label: text }`. */
  onCreate?: (text: string) => ComboboxOption | void
  /** Text of the create row, e.g. `Invite “…”`. */
  createLabel?: (text: string) => string
  /** At most this many chips; the rest fold into a "+N" chip and the field stays one line. */
  maxVisibleTags?: number
  /** Visible label above the field (also names the list). */
  label?: string
  /** Open the list right away. */
  defaultOpen?: boolean
  /** Shown when nothing matches. */
  emptyText?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.cb {
  --cb-ink: #000;
  --cb-surface: #fff;
  --cb-accent: #0060e2;
  --cb-t1: color-mix(in oklab, var(--cb-ink) 88%, transparent);
  --cb-t2: color-mix(in oklab, var(--cb-ink) 61%, transparent);
  --cb-t3: color-mix(in oklab, var(--cb-ink) 45%, transparent);
  --cb-fill: color-mix(in oklab, var(--cb-ink) 6%, transparent);
  --cb-line: color-mix(in oklab, var(--cb-ink) 6%, transparent);
  --cb-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cb-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cb-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 420px;
  color: var(--cb-t1);
  font-family: var(--cb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .cb {
  --cb-ink: #fff;
  --cb-surface: #1c1c1e;
  --cb-accent: #4d8dff;
  --cb-t1: color-mix(in oklab, var(--cb-ink) 90%, transparent);
  --cb-t2: color-mix(in oklab, var(--cb-ink) 62%, transparent);
  --cb-t3: color-mix(in oklab, var(--cb-ink) 46%, transparent);
  --cb-fill: color-mix(in oklab, var(--cb-ink) 9%, transparent);
  --cb-line: color-mix(in oklab, var(--cb-ink) 8%, transparent);
  --cb-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --cb-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.cb *, .cb *::before, .cb *::after { box-sizing: border-box }
:where(.cb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.cb :focus-visible { outline: 2px solid color-mix(in oklab, var(--cb-accent) 60%, transparent); outline-offset: 1px }

.cb-label { display: block; margin: 0 0 6px; padding: 0 2px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--cb-t2) }

/* Field */
.cb-field {
  position: relative; min-height: 32px; border-radius: 8px; background: var(--cb-surface); box-shadow: var(--cb-shadow);
  cursor: text; overflow: hidden; transition: height .3s var(--cb-ease), box-shadow .16s;
}
.cb-field:hover { box-shadow: 0 0 0 .5px rgb(0 0 0 / .12), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05) }
:is(.dark, [data-theme="dark"]) .cb-field:hover { box-shadow: 0 0 0 .5px rgb(255 255 255 / .18), 0 1px 2px 0 rgb(0 0 0 / .4) }
.cb-field[data-focus] {
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--cb-accent) 76.5%, transparent), 0 0 0 2px color-mix(in oklab, var(--cb-accent) 28%, transparent);
}
.cb-inner { display: flex; flex-wrap: wrap; align-items: center; row-gap: 4px; min-height: 32px; padding: 4px 32px 4px 4px }
.cb[data-nowrap] .cb-inner { flex-wrap: nowrap }
.cb-chips { display: contents; margin: 0; padding: 0; list-style: none }
.cb-input {
  flex: 1 1 60px; min-width: 40px; height: 24px; margin: 0; padding: 0 4px 0 6px; border: 0; outline: 0; background: transparent;
  color: var(--cb-t1); font: inherit; font-size: 13px; line-height: 20px; cursor: text;
}
.cb .cb-input:focus-visible { outline: 0 }
.cb-input::placeholder { color: var(--cb-t3); opacity: 1 }
.cb[data-single] .cb-input::placeholder { color: transparent }
.cb-single {
  position: absolute; left: 4px; right: 36px; top: 4px; height: 24px; display: flex; align-items: center; gap: 8px; padding: 0 6px;
  pointer-events: none; overflow: hidden; white-space: nowrap; animation: cb-in .24s var(--cb-ease) backwards;
}
.cb-single[data-hide] { opacity: 0; animation: none }
.cb-toggle {
  position: absolute; z-index: 1; top: 4px; right: 4px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px;
  color: var(--cb-t3); transition: background-color .12s, color .12s;
}
.cb-toggle:hover { background: var(--cb-fill); color: var(--cb-t1) }
.cb-toggle svg { width: 14px; height: 14px; transition: transform .3s var(--cb-ease) }
.cb[data-open] .cb-toggle svg { transform: rotate(180deg) }

/* Chips */
.cb-chip { display: grid; grid-template-columns: 1fr; margin: 0 4px 0 0; transition: grid-template-columns .22s var(--cb-ease), margin .22s var(--cb-ease), opacity .2s; max-width: 100% }
.cb-chip-body {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0; height: 24px; padding: 0 2px 0 4px; overflow: hidden; border-radius: 6px;
  background: var(--cb-fill); font-size: 12px; line-height: 16px; font-weight: 500; color: var(--cb-t1);
  animation: cb-chip-in .26s var(--cb-ease) backwards;
}
.cb-chip[data-hl] .cb-chip-body { box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--cb-accent) 55%, transparent) }
.cb-chip[data-leaving] { grid-template-columns: 0fr; margin-right: 0; opacity: 0; pointer-events: none }
.cb-chip[data-leaving] .cb-chip-body { animation: cb-flash .22s ease-out }
.cb-chip-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.cb .cb-chip-x {
  display: grid; place-items: center; flex: none; width: 18px; height: 18px; border-radius: 4px; color: var(--cb-t3);
  transition: background-color .12s, color .12s;
}
.cb .cb-chip-x:hover { background: color-mix(in oklab, var(--cb-ink) 8%, transparent); color: var(--cb-t1) }
.cb-chip-x svg { width: 10px; height: 10px }
.cb-more { display: inline-grid; place-items: center; height: 24px; min-width: 28px; padding: 0 6px; margin-right: 4px; border-radius: 6px; background: var(--cb-fill); font-size: 12px; font-weight: 500; color: var(--cb-t2); font-variant-numeric: tabular-nums; overflow: hidden }
.cb-more > span { animation: cb-roll .3s var(--cb-ease) backwards }

/* Avatars, dots */
.cb-avatar {
  display: grid; place-items: center; flex: none; width: 20px; height: 20px; overflow: hidden; border-radius: 50%;
  background: var(--cb-fill); color: var(--cb-t2); font-size: 8px; font-weight: 500; letter-spacing: .16px; line-height: 1;
}
.cb-avatar img { width: 100%; height: 100%; object-fit: cover }
.cb-chip .cb-avatar { width: 16px; height: 16px; font-size: 7px; background: var(--cb-surface); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--cb-ink) 8%, transparent) }
.cb-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; margin: 0 2px }
.cb-ico { display: grid; place-items: center; flex: none; width: 14px; height: 14px; color: var(--cb-t3) }
.cb-ico svg { width: 14px; height: 14px }

/* Popover */
.cb-pop {
  position: absolute; z-index: 20; top: calc(100% + 6px); left: 0; right: 0; overflow: hidden; border-radius: 10px;
  background: var(--cb-surface); box-shadow: var(--cb-float); transform-origin: top center;
  animation: cb-open .24s var(--cb-ease) backwards;
}
.cb[data-up] .cb-pop { top: auto; bottom: calc(100% + 6px); transform-origin: bottom center }
.cb-grow { transition: height .3s var(--cb-ease) }
.cb-list { position: relative; max-height: 300px; padding: 4px; overflow-y: auto; overscroll-behavior: contain; outline: 0; scrollbar-width: thin }
.cb-pill {
  position: absolute; z-index: 0; top: 0; left: 4px; right: 4px; height: 32px; border-radius: 6px; background: var(--cb-fill); pointer-events: none;
  transition: transform .09s ease-out, height .09s ease-out, opacity .14s;
}
.cb-list[data-out] .cb-pill { opacity: 0 }
.cb-group-label { padding: 4px 8px; font-size: 10px; line-height: 16px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; color: var(--cb-t3) }
.cb-option {
  position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 8px; border-radius: 6px; cursor: pointer;
  user-select: none; -webkit-tap-highlight-color: transparent;
}
.cb-text { display: flex; align-items: baseline; gap: 8px; flex: 1; min-width: 0; overflow: hidden; white-space: nowrap }
.cb-name { overflow: hidden; text-overflow: ellipsis; color: var(--cb-t1) }
.cb-hint { overflow: hidden; text-overflow: ellipsis; font-size: 12px; line-height: 16px; color: var(--cb-t3) }
.cb-single .cb-hint { display: none }
.cb mark { padding: 0; border-radius: 3px; background: color-mix(in oklab, var(--cb-accent) 12%, transparent); color: inherit }
.cb-check { flex: none; width: 16px; height: 16px; color: color-mix(in oklab, var(--cb-accent) 76.5%, transparent); animation: cb-check .42s cubic-bezier(.34, 1.56, .64, 1) backwards }
.cb-plus {
  display: grid; place-items: center; flex: none; width: 20px; height: 20px; border-radius: 6px; color: var(--cb-t2);
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--cb-ink) 10%, transparent);
}
.cb-plus svg { width: 12px; height: 12px }
.cb-empty { padding: 14px 8px 12px; text-align: center; color: var(--cb-t3) }
.cb-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 32px; padding: 0 12px;
  border-top: .5px solid var(--cb-line); font-size: 12px; line-height: 16px; color: var(--cb-t3);
}
.cb-count { display: inline-block; overflow: hidden; height: 16px; font-variant-numeric: tabular-nums }
.cb-count > span { display: inline-block; animation: cb-roll .3s var(--cb-ease) backwards }
.cb-hints { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap }
.cb-hints span { display: inline-flex; align-items: center; gap: 2px; margin-right: 2px }
.cb-hints span + span { margin-left: 4px }
.cb kbd {
  display: inline-grid; place-items: center; min-width: 17px; height: 16px; padding: 0 3px; border-radius: 4px; background: var(--cb-surface);
  box-shadow: var(--cb-shadow); font: inherit; font-size: 10px; line-height: 1; color: var(--cb-t2);
}
.cb-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@keyframes cb-open { from { opacity: 0; transform: translateY(-4px) scale(.985); filter: blur(2px) } }
@keyframes cb-in { from { opacity: 0; filter: blur(3px) } }
@keyframes cb-chip-in { 0% { opacity: 0; transform: scale(.82) } 60% { transform: scale(1.04) } }
@keyframes cb-flash { 40% { background: color-mix(in oklab, var(--cb-accent) 18%, transparent) } }
@keyframes cb-check { from { opacity: 0; transform: scale(.4) } }
@keyframes cb-roll { from { opacity: 0; transform: translateY(8px); filter: blur(2px) } }

/* Touch: bigger rows, 16px input text (no iOS zoom) */
@media (pointer: coarse) {
  .cb-option { min-height: 44px }
  .cb-pill { height: 44px }
  .cb-input { font-size: 16px; height: 28px }
  .cb .cb-chip-x { width: 24px; height: 24px }
  .cb-hints { display: none }
}

@media (prefers-reduced-motion: reduce) {
  .cb *, .cb *::before, .cb *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const Chevron = () => (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="m3.5 5.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Cross = () => (
  <svg viewBox="0 0 10 10" fill="none" aria-hidden>
    <path d="m2 2 6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
const Tick = () => (
  <svg className="cb-check" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="m3.75 8.4 2.75 2.75 5.75-6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Plus = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const initials = (label: string) =>
  label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

function Lead({ option }: { option: ComboboxOption }) {
  if (option.avatar)
    return (
      <span className="cb-avatar" aria-hidden>
        {typeof option.avatar === "string" ? <img src={option.avatar} alt="" /> : initials(option.label)}
      </span>
    )
  if (option.color) return <span className="cb-dot" style={{ background: option.color }} aria-hidden />
  if (option.icon)
    return (
      <span className="cb-ico" aria-hidden>
        {option.icon}
      </span>
    )
  return null
}

/** Wraps the first match of `query` in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  )
}

/** Animates its height to follow its content (height: auto can't be transitioned). */
function AutoHeight({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
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
    <div className={className} style={height !== null ? { height } : undefined} {...rest}>
      <div ref={inner} style={{ display: "flow-root" }}>
        {children}
      </div>
    </div>
  )
}

type Row = { kind: "option"; option: ComboboxOption } | { kind: "create"; text: string }

/* -------------------------------------------------------------------------- */
/*                                  Combobox                                  */
/* -------------------------------------------------------------------------- */

export function Combobox({
  options,
  multiple = true,
  value,
  defaultValue = [],
  onChange,
  placeholder = "Search…",
  creatable = false,
  onCreate,
  createLabel = (t) => `Create “${t}”`,
  maxVisibleTags,
  label,
  defaultOpen = false,
  emptyText = "No results",
  className,
}: ComboboxProps) {
  const uid = React.useId()
  const listId = `${uid}-list`
  const labelId = `${uid}-label`
  const rowId = (i: number) => `${uid}-r${i}`

  const [created, setCreated] = React.useState<ComboboxOption[]>([])
  const all = React.useMemo(
    () => [...options, ...created.filter((c) => !options.some((o) => o.value === c.value))],
    [options, created],
  )
  const controlled = value !== undefined
  const [inner, setInner] = React.useState(defaultValue)
  const values = controlled ? value : inner
  const selected = React.useMemo(() => new Set(values), [values])

  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(defaultOpen)
  const [active, setActive] = React.useState(0)
  const [focused, setFocused] = React.useState(false)
  const [hlLast, setHlLast] = React.useState(false)
  const [announce, setAnnounce] = React.useState("")
  const [ghosts, setGhosts] = React.useState<{ id: number; option: ComboboxOption; at: number }[]>([])

  const root = React.useRef<HTMLDivElement>(null)
  const input = React.useRef<HTMLInputElement>(null)
  const list = React.useRef<HTMLDivElement>(null)
  const pill = React.useRef<HTMLSpanElement>(null)
  const rowEls = React.useRef(new Map<number, HTMLElement>())
  const pillPlaced = React.useRef(false)
  const ghostId = React.useRef(0)
  const timers = React.useRef(new Set<number>())
  React.useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  /* ----- search ----- */
  const q = query.trim()
  const matches = React.useMemo(() => {
    if (!q) return all
    const needle = q.toLowerCase()
    return all.filter((o) => [o.label, o.hint ?? "", ...(o.keywords ?? [])].some((s) => s.toLowerCase().includes(needle)))
  }, [all, q])
  const exact = all.some((o) => o.label.toLowerCase() === q.toLowerCase())
  const showCreate = creatable && q !== "" && !exact

  // Groups in order of first appearance; options without a group come first, untitled.
  const sections = React.useMemo(() => {
    const order: string[] = []
    const byGroup = new Map<string, ComboboxOption[]>()
    for (const o of matches) {
      const g = o.group ?? ""
      if (!byGroup.has(g)) {
        byGroup.set(g, [])
        order.push(g)
      }
      byGroup.get(g)!.push(o)
    }
    order.sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0))
    return order.map((g) => ({ title: g, options: byGroup.get(g)! }))
  }, [matches])
  const rows: Row[] = React.useMemo(() => {
    const r: Row[] = sections.flatMap((s) => s.options.map((option) => ({ kind: "option" as const, option })))
    if (showCreate) r.push({ kind: "create", text: q })
    return r
  }, [sections, showCreate, q])
  const activeIdx = rows.length ? Math.min(active, rows.length - 1) : -1

  /* ----- selection ----- */
  const emit = (next: string[], list2: ComboboxOption[] = all) => {
    if (!controlled) setInner(next)
    onChange?.(
      next,
      next.map((v) => list2.find((o) => o.value === v)).filter((o): o is ComboboxOption => !!o),
    )
  }
  const addGhost = (option: ComboboxOption, at: number) => {
    const id = ++ghostId.current
    setGhosts((g) => [...g, { id, option, at }])
    const t = window.setTimeout(() => {
      timers.current.delete(t)
      setGhosts((g) => g.filter((x) => x.id !== id))
    }, 240)
    timers.current.add(t)
  }
  const remove = (v: string) => {
    const at = values.indexOf(v)
    const opt = all.find((o) => o.value === v)
    if (at < 0) return
    if (opt) addGhost(opt, at)
    const next = values.filter((x) => x !== v)
    emit(next)
    setHlLast(false)
    setAnnounce(`${opt?.label ?? v} removed, ${next.length} selected`)
  }
  const pick = (opt: ComboboxOption, list2: ComboboxOption[] = all) => {
    if (multiple) {
      if (selected.has(opt.value)) {
        remove(opt.value)
      } else {
        const next = [...values, opt.value]
        emit(next, list2)
        setAnnounce(`${opt.label} selected, ${next.length} selected`)
      }
      if (query) setActive(0)
      setQuery("")
    } else {
      emit([opt.value], list2)
      setAnnounce(`${opt.label} selected`)
      setQuery("")
      setOpen(false)
    }
    setHlLast(false)
  }
  const create = (text: string) => {
    const made = onCreate?.(text) ?? { value: text, label: text }
    if (all.some((o) => o.value === made.value)) {
      const existing = all.find((o) => o.value === made.value)!
      if (!selected.has(existing.value)) pick(existing)
      return
    }
    const list2 = [...all, made]
    setCreated((c) => [...c, made])
    pick(made, list2)
  }
  const activate = (row: Row | undefined) => {
    if (!row) return
    if (row.kind === "create") create(row.text)
    else pick(row.option)
  }

  /* ----- open / close ----- */
  const openList = (at?: number) => {
    setOpen(true)
    if (at !== undefined) setActive(at)
  }
  const firstSelectedRow = () => {
    const i = rows.findIndex((r) => r.kind === "option" && selected.has(r.option.value))
    return i < 0 ? 0 : i
  }

  // Close when clicking or tapping outside (covers a list opened with defaultOpen before it had focus).
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open])

  // Flip the list upwards when there is no room below.
  const [up, setUp] = React.useState(false)
  const measureUp = () => {
    const r = root.current?.getBoundingClientRect()
    if (!r) return
    const below = window.innerHeight - r.bottom
    setUp(below < 260 && r.top > below)
  }

  /* ----- keyboard ----- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    const n = rows.length
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault()
        if (!open) {
          measureUp()
          openList(firstSelectedRow())
        } else if (n) {
          const d = e.key === "ArrowDown" ? 1 : -1
          setActive((a) => (Math.min(a, n - 1) + d + n) % n)
        }
        break
      }
      case "Enter": {
        if (open) {
          e.preventDefault()
          activate(rows[activeIdx])
        }
        break
      }
      case "Escape": {
        if (open) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
        } else if (query) {
          e.preventDefault()
          setQuery("")
        }
        break
      }
      case "Backspace": {
        if (multiple && !query && values.length) {
          if (hlLast) remove(values[values.length - 1])
          else setHlLast(true)
        }
        break
      }
      case "Tab":
        setOpen(false)
        break
      default:
        if (hlLast && e.key.length === 1) setHlLast(false)
    }
  }

  /* ----- keep the highlight pill and scroll position on the active row ----- */
  React.useLayoutEffect(() => {
    const p = pill.current
    const l = list.current
    if (!open) {
      pillPlaced.current = false
      return
    }
    if (!p || !l) return
    const el = activeIdx >= 0 ? rowEls.current.get(activeIdx) : undefined
    if (!el) {
      p.style.opacity = "0"
      return
    }
    const top = el.offsetTop
    const first = !pillPlaced.current
    if (first) p.style.transition = "none"
    p.style.opacity = ""
    p.style.height = `${el.offsetHeight}px`
    p.style.transform = `translateY(${top}px)`
    if (first) {
      p.getBoundingClientRect()
      p.style.transition = ""
      pillPlaced.current = true
    }
    if (top < l.scrollTop) l.scrollTop = top - 28
    else if (top + el.offsetHeight > l.scrollTop + l.clientHeight) l.scrollTop = top + el.offsetHeight - l.clientHeight + 4
  })

  /* ----- render ----- */
  const chipOptions = values
    .map((v) => all.find((o) => o.value === v))
    .filter((o): o is ComboboxOption => !!o)
  const limit = maxVisibleTags !== undefined ? Math.max(0, maxVisibleTags) : Infinity
  const shown = chipOptions.slice(0, limit)
  const hidden = chipOptions.length - shown.length
  const chipNodes: React.ReactNode[] = shown.map((o, i) => (
    <li key={o.value} className="cb-chip" data-hl={hlLast && i === chipOptions.length - 1 ? "" : undefined}>
      <span className="cb-chip-body">
        <Lead option={o} />
        <span className="cb-chip-label">{o.label}</span>
        <button
          type="button"
          className="cb-chip-x"
          tabIndex={-1}
          aria-label={`Remove ${o.label}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            remove(o.value)
            input.current?.focus()
          }}
        >
          <Cross />
        </button>
      </span>
    </li>
  ))
  ghosts.forEach((g) => {
    const node = (
      <li key={`g${g.id}`} className="cb-chip" data-leaving="" aria-hidden>
        <span className="cb-chip-body">
          <Lead option={g.option} />
          <span className="cb-chip-label">{g.option.label}</span>
        </span>
      </li>
    )
    chipNodes.splice(Math.min(g.at, chipNodes.length), 0, node)
  })

  const single = !multiple ? all.find((o) => o.value === values[0]) : undefined
  const listLabel = label ?? placeholder
  let rowIndex = -1

  return (
    <div
      ref={root}
      className={cn("cb", className)}
      data-open={open || undefined}
      data-up={(open && up) || undefined}
      data-nowrap={maxVisibleTags !== undefined || undefined}
      data-single={single ? "" : undefined}
    >
      <style href="combobox" precedence="default">
        {CSS}
      </style>

      {label && (
        <label id={labelId} className="cb-label" htmlFor={`${uid}-input`}>
          {label}
        </label>
      )}

      <AutoHeight
        className="cb-field"
        data-focus={focused || undefined}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return
          if (e.target !== input.current) {
            e.preventDefault()
            input.current?.focus()
          }
          if (!open) {
            measureUp()
            openList(firstSelectedRow())
          } else if (e.target !== input.current) setOpen(false)
        }}
      >
        <div className="cb-inner">
          {multiple && (
            <ul className="cb-chips" role="list" aria-label={`Selected${label ? ` ${label.toLowerCase()}` : ""}`}>
              {chipNodes}
              {hidden > 0 && (
                <li className="cb-more" aria-label={`${hidden} more selected`}>
                  <span key={hidden}>+{hidden}</span>
                </li>
              )}
            </ul>
          )}
          <input
            ref={input}
            id={`${uid}-input`}
            className="cb-input"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-activedescendant={open && activeIdx >= 0 ? rowId(activeIdx) : undefined}
            aria-label={label ? undefined : listLabel}
            autoComplete="off"
            spellCheck={false}
            value={query}
            placeholder={values.length ? (multiple ? "" : (single?.label ?? "")) : placeholder}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              setHlLast(false)
              if (!open) {
                measureUp()
                setOpen(true)
              }
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              setOpen(false)
              setQuery("")
              setHlLast(false)
            }}
          />
          {single && (
            <span className="cb-single" data-hide={query ? "" : undefined} style={query ? { display: "none" } : undefined} aria-hidden>
              <Lead option={single} />
              <span className="cb-name">{single.label}</span>
            </span>
          )}
        </div>
        <button
          type="button"
          className="cb-toggle"
          tabIndex={-1}
          aria-label={open ? "Close list" : "Open list"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) setOpen(false)
            else {
              measureUp()
              openList(firstSelectedRow())
            }
            input.current?.focus()
          }}
        >
          <Chevron />
        </button>
      </AutoHeight>

      {open && (
        <div className="cb-pop" onMouseDown={(e) => e.preventDefault()}>
          <AutoHeight className="cb-grow">
            <div
              ref={list}
              id={listId}
              className="cb-list"
              role="listbox"
              aria-multiselectable={multiple || undefined}
              aria-labelledby={label ? labelId : undefined}
              aria-label={label ? undefined : listLabel}
              onMouseLeave={(e) => e.currentTarget.setAttribute("data-out", "")}
              onMouseEnter={(e) => e.currentTarget.removeAttribute("data-out")}
            >
              <span ref={pill} className="cb-pill" aria-hidden />
              {sections.map((s, si) => {
                const groupId = `${uid}-g${si}`
                const items = s.options.map((o) => {
                  rowIndex++
                  const i = rowIndex
                  const isSel = selected.has(o.value)
                  return (
                    <div
                      key={o.value}
                      id={rowId(i)}
                      ref={(el) => {
                        if (el) rowEls.current.set(i, el)
                        else rowEls.current.delete(i)
                      }}
                      role="option"
                      aria-selected={isSel}
                      className="cb-option"
                      data-active={i === activeIdx || undefined}
                      onMouseMove={() => {
                        if (i !== activeIdx) setActive(i)
                        list.current?.removeAttribute("data-out")
                      }}
                      onClick={() => {
                        pick(o)
                        input.current?.focus()
                      }}
                    >
                      <Lead option={o} />
                      <span className="cb-text">
                        <span className="cb-name">
                          <Highlight text={o.label} query={q} />
                        </span>
                        {o.hint && (
                          <span className="cb-hint">
                            <Highlight text={o.hint} query={q} />
                          </span>
                        )}
                      </span>
                      {isSel && <Tick />}
                    </div>
                  )
                })
                return s.title ? (
                  <div key={s.title} className="cb-group" role="group" aria-labelledby={groupId}>
                    <div id={groupId} className="cb-group-label">
                      {s.title}
                    </div>
                    {items}
                  </div>
                ) : (
                  <div key="ungrouped" className="cb-group" role="presentation">
                    {items}
                  </div>
                )
              })}
              {showCreate &&
                (() => {
                  rowIndex++
                  const i = rowIndex
                  return (
                    <div
                      id={rowId(i)}
                      ref={(el) => {
                        if (el) rowEls.current.set(i, el)
                        else rowEls.current.delete(i)
                      }}
                      role="option"
                      aria-selected={false}
                      className="cb-option"
                      data-active={i === activeIdx || undefined}
                      onMouseMove={() => {
                        if (i !== activeIdx) setActive(i)
                        list.current?.removeAttribute("data-out")
                      }}
                      onClick={() => {
                        create(q)
                        input.current?.focus()
                      }}
                    >
                      <span className="cb-plus" aria-hidden>
                        <Plus />
                      </span>
                      <span className="cb-text">
                        <span className="cb-name">{createLabel(q)}</span>
                      </span>
                    </div>
                  )
                })()}
              {rows.length === 0 && <div className="cb-empty">{emptyText}</div>}
            </div>
            <div className="cb-foot" aria-hidden>
              <span className="cb-count">
                {multiple ? (
                  <span key={values.length}>{values.length} selected</span>
                ) : (
                  <span>{matches.length} {matches.length === 1 ? "option" : "options"}</span>
                )}
              </span>
              <span className="cb-hints">
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> to move
                </span>
                <span>
                  <kbd>↵</kbd> to {multiple ? "toggle" : "select"}
                </span>
              </span>
            </div>
          </AutoHeight>
        </div>
      )}

      <span className="cb-live" aria-live="polite" role="status">
        {announce}
      </span>
    </div>
  )
}

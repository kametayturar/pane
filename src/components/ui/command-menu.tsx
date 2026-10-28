"use client"

import * as React from "react"
import { Bookmark, ChartNoAxesColumn, CircleHelp, FilePlus2, House, Inbox, Moon, Settings, Sparkles, Upload, UserPlus } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Command = {
  id: string
  label: string
  /** Secondary text after the name, e.g. the tool it runs in. */
  hint?: string
  /** A 20px tile shown before the name (a tool logo). */
  logo?: React.ReactNode
  /** A 16px icon shown before the name (everyday commands). Ignored when `logo` is set. */
  icon?: React.ReactNode
  /** Shortcut shown on the right, one entry per key, e.g. ["G", "H"]. */
  keys?: string[]
  /** Extra words the search also matches. */
  keywords?: string[]
}

export type CommandGroup = {
  id: string
  label: string
  commands: Command[]
}

export type CommandMenuProps = {
  /** Sections of commands. The group with id "suggestions" gets ⌘1–⌘5. */
  groups?: CommandGroup[]
  /** Text in the empty field. */
  placeholder?: string
  /** Called when a command runs. The assistant fallback sends "ask" and the typed text. */
  onRun?: (id: string, query?: string) => void
  /** Runs on Esc in an empty field – close your dialog here. */
  onClose?: () => void
  /** Focus the field when the menu appears. */
  autoFocus?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.cm {
  --cm-ink: #000;
  --cm-surface: #fff;
  --cm-accent: #0060e2;
  --cm-ok: #14804a;
  --cm-t1: color-mix(in oklab, var(--cm-ink) 88%, transparent);
  --cm-t2: color-mix(in oklab, var(--cm-ink) 61%, transparent);
  --cm-t3: color-mix(in oklab, var(--cm-ink) 45%, transparent);
  --cm-fill: color-mix(in oklab, var(--cm-ink) 6%, transparent);
  --cm-line: color-mix(in oklab, var(--cm-ink) 6%, transparent);
  --cm-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cm-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cm-ease: cubic-bezier(.22, 1, .36, 1);
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 600px;
  color: var(--cm-t1);
  font-family: var(--cm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .cm {
  --cm-ink: #fff;
  --cm-surface: #1c1c1e;
  --cm-accent: #4d8dff;
  --cm-ok: #4cc38a;
  --cm-t1: color-mix(in oklab, var(--cm-ink) 90%, transparent);
  --cm-t2: color-mix(in oklab, var(--cm-ink) 62%, transparent);
  --cm-t3: color-mix(in oklab, var(--cm-ink) 46%, transparent);
  --cm-fill: color-mix(in oklab, var(--cm-ink) 8%, transparent);
  --cm-line: color-mix(in oklab, var(--cm-ink) 8%, transparent);
  --cm-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --cm-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.cm *, .cm *::before, .cm *::after { box-sizing: border-box }
:where(.cm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.cm :focus-visible { outline: 2px solid color-mix(in oklab, var(--cm-accent) 60%, transparent); outline-offset: 1px }

.cm-card { overflow: hidden; border-radius: 12px; background: var(--cm-surface); box-shadow: var(--cm-float) }

/* Search field */
.cm-search { display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 12px 0 14px; cursor: text }
.cm-search > svg { flex: none; width: 16px; height: 16px; color: var(--cm-t3) }
.cm-input {
  flex: 1; min-width: 0; height: 20px; margin: 0; padding: 0; border: 0; outline: 0; background: transparent;
  color: var(--cm-t1); font: inherit; font-size: 13px; line-height: 20px;
}
.cm .cm-input:focus-visible { outline: 0 }
.cm-input::placeholder { color: var(--cm-t3); opacity: 1 }
.cm-enter {
  display: grid; place-items: center; flex: none; min-width: 22px; height: 20px; padding: 0 5px; border-radius: 5px; color: var(--cm-t3);
  font-size: 11px; font-weight: 500; line-height: 16px; transition: opacity .14s; opacity: 0;
}
.cm-enter svg { width: 12px; height: 12px }
.cm[data-has-active] .cm-enter { opacity: 1 }

/* List */
.cm-list { position: relative; height: 360px; max-height: 60vh; padding: 0 4px 4px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; border-top: .5px solid transparent }
.cm-inner { position: relative }
.cm-pill {
  position: absolute; z-index: 0; top: 0; left: 0; right: 0; height: 36px; border-radius: 6px; background: var(--cm-fill); pointer-events: none;
  transition: transform .09s ease-out, height .09s ease-out, opacity .14s;
}
.cm-list[data-out] .cm-pill { opacity: 0 }
.cm-label { padding: 10px 8px 4px; font-size: 10px; line-height: 16px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; color: var(--cm-t3) }
.cm-item {
  position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 8px; border-radius: 6px;
  text-align: left; user-select: none; -webkit-tap-highlight-color: transparent; transition: transform .16s var(--cm-ease);
}
.cm-item[data-pressed] { transform: scale(.985) }
.cm-logo {
  display: grid; place-items: center; flex: none; width: 20px; height: 20px; overflow: hidden; border-radius: 5px; background: var(--cm-surface); color: var(--cm-t1);
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
}
:is(.dark, [data-theme="dark"]) .cm-logo { box-shadow: 0 0 0 .5px rgb(255 255 255 / .12) }
.cm-logo > * { max-width: 100%; max-height: 100% }
.cm-logo svg { width: 12px; height: 12px }
.cm-icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--cm-t2) }
.cm-icon svg { width: 16px; height: 16px }
.cm-text { display: flex; align-items: baseline; gap: 8px; flex: 1; min-width: 0; overflow: hidden; white-space: nowrap }
.cm-name { overflow: hidden; text-overflow: ellipsis; color: var(--cm-t1) }
.cm-hint { overflow: hidden; text-overflow: ellipsis; color: var(--cm-t3) }
.cm-keys { display: inline-flex; align-items: center; flex: none; gap: 2px }
.cm kbd {
  display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 5px; color: var(--cm-t2);
  font: inherit; font-size: 11px; font-weight: 500; line-height: 16px;
}

/* Footer: hints, or the command that just ran */
.cm-foot {
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 40px; padding: 0 12px;
  border-top: .5px solid var(--cm-line); font-size: 12px; line-height: 16px; color: var(--cm-t3); overflow: hidden;
}
.cm-tip, .cm-open { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap }
.cm-tip kbd, .cm-open kbd { color: var(--cm-t3) }
.cm-open .cm-keys { gap: 2px }
.cm-ran { position: absolute; inset: 0; display: flex; align-items: center; gap: 8px; padding: 0 12px; background: var(--cm-surface); color: var(--cm-t1); animation: cm-ran .36s var(--cm-ease) backwards }
.cm-ran svg { width: 16px; height: 16px; flex: none; color: var(--cm-ok) }
.cm-ran path { stroke-dasharray: 12; animation: cm-draw .32s var(--cm-ease) .08s backwards }
.cm-ran span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.cm-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@keyframes cm-ran { from { opacity: 0; filter: blur(3px); transform: translateY(6px) } }
@keyframes cm-draw { from { stroke-dashoffset: 12 } }

/* Phones: shortcut keys and hints are left out */
@container (max-width: 480px) {
  .cm-keys, .cm-hint, .cm-tip, .cm-open { display: none }
  .cm-foot { justify-content: flex-start }
}

@media (prefers-reduced-motion: reduce) {
  .cm *, .cm *::before, .cm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                               Default content                              */
/* -------------------------------------------------------------------------- */

const Tile = ({ letter, bg }: { letter: string; bg: string }) => (
  <span style={{ background: bg, color: "#fff", fontSize: 10, fontWeight: 700, width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
    {letter}
  </span>
)

const DEFAULT_GROUPS: CommandGroup[] = [
  {
    id: "suggestions",
    label: "Suggestions",
    commands: [
      { id: "reply", label: "Draft a reply", hint: "Mail", logo: <Tile letter="M" bg="#e5484d" /> },
      { id: "assistant", label: "Ask assistant", hint: "Summaries, drafts, answers", logo: <Sparkles /> },
      { id: "ticket", label: "Create a ticket", hint: "Tracker", logo: <Tile letter="T" bg="#5e6ad2" /> },
      { id: "contact", label: "Add contact to CRM", hint: "Pipeline", logo: <Tile letter="P" bg="#f76808" /> },
      { id: "meeting", label: "Schedule a meeting", hint: "Calendar", logo: <Tile letter="C" bg="#0060e2" /> },
    ],
  },
  {
    id: "share",
    label: "Share",
    commands: [
      { id: "post", label: "Post an update", hint: "#team-updates", logo: <Tile letter="#" bg="#8e4ec6" /> },
      { id: "page", label: "Save as page", hint: "Notes · Meeting notes", logo: <Bookmark /> },
    ],
  },
  {
    id: "general",
    label: "General",
    commands: [
      { id: "new", label: "New document", icon: <FilePlus2 />, keys: ["N"] },
      { id: "invite", label: "Invite teammates", icon: <UserPlus />, keys: ["I"] },
      { id: "upload", label: "Upload files", icon: <Upload />, keys: ["U"] },
      { id: "theme", label: "Switch to dark mode", icon: <Moon />, keys: ["⇧", "D"], keywords: ["theme", "appearance"] },
    ],
  },
  {
    id: "goto",
    label: "Go to",
    commands: [
      { id: "home", label: "Home", icon: <House />, keys: ["G", "H"] },
      { id: "inbox", label: "Inbox", icon: <Inbox />, keys: ["G", "I"] },
      { id: "reports", label: "Reports", icon: <ChartNoAxesColumn />, keys: ["G", "R"], keywords: ["analytics"] },
      { id: "settings", label: "Settings", icon: <Settings />, keys: ["G", "S"], keywords: ["preferences"] },
      { id: "help", label: "Help & feedback", icon: <CircleHelp />, keys: ["?"], keywords: ["support"] },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="7.25" cy="7.25" r="4.75" stroke="currentColor" strokeWidth="1.4" />
    <path d="m11 11 2.75 2.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)
const EnterIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M9.5 2.5v3a1 1 0 0 1-1 1h-5.5M5 4 3 6.5 5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity=".16" />
    <path d="m5.1 8.2 2 2 3.8-4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

type Flat = { command: Command; group: CommandGroup; keys?: string[] }

/* -------------------------------------------------------------------------- */
/*                                 CommandMenu                                */
/* -------------------------------------------------------------------------- */

export function CommandMenu({
  groups = DEFAULT_GROUPS,
  placeholder = "Type a command or search…",
  onRun,
  onClose,
  autoFocus = false,
  className,
}: CommandMenuProps) {
  const uid = React.useId()
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const [ran, setRan] = React.useState<{ n: number; label: string } | null>(null)
  const [pressed, setPressed] = React.useState<string | null>(null)

  const input = React.useRef<HTMLInputElement>(null)
  const list = React.useRef<HTMLDivElement>(null)
  const pill = React.useRef<HTMLSpanElement>(null)
  const rowEls = React.useRef(new Map<number, HTMLElement>())
  const placed = React.useRef(false)
  const timers = React.useRef(new Set<number>())
  React.useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  const isMac = React.useMemo(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform), [])
  const mod = isMac ? "⌘" : "Ctrl"
  const showKey = (k: string) => (k === "⌘" ? mod : k)

  /* ----- filter ----- */
  const q = query.trim().toLowerCase()
  const sections = React.useMemo(() => {
    return groups
      .map((g) => ({
        group: g,
        items: g.commands
          .map((command, i) => ({
            command,
            group: g,
            keys: command.keys ?? (g.id === "suggestions" && i < 5 ? ["⌘", String(i + 1)] : undefined),
          }))
          .filter(({ command: c }) => !q || [c.label, c.hint ?? "", ...(c.keywords ?? [])].some((s) => s.toLowerCase().includes(q))),
      }))
      .filter((s) => s.items.length)
  }, [groups, q])
  const typed = query.trim()
  const askRow: Flat | null = React.useMemo(
    () =>
      typed
        ? {
            command: { id: "ask", label: `Ask assistant “${typed}”`, icon: <Sparkles /> },
            group: { id: "fallback", label: "Assistant", commands: [] },
          }
        : null,
    [typed],
  )
  const flat: Flat[] = React.useMemo(() => {
    const f = sections.flatMap((s) => s.items)
    return askRow ? [...f, askRow] : f
  }, [sections, askRow])
  const activeIdx = flat.length ? Math.min(active, flat.length - 1) : -1
  const rowId = (f: Flat) => `${uid}-${f.group.id === "fallback" ? "fallback" : f.command.id}`

  /* ----- run ----- */
  const run = (item: Flat | undefined) => {
    if (!item) return
    const { command } = item
    onRun?.(command.id, item.group.id === "fallback" ? typed : undefined)
    setRan((r) => ({ n: (r?.n ?? 0) + 1, label: command.label }))
    setPressed(rowId(item))
    const t1 = window.setTimeout(() => setPressed(null), 160)
    const t2 = window.setTimeout(() => setRan(null), 2600)
    timers.current.add(t1)
    timers.current.add(t2)
  }

  /* ----- keyboard ----- */
  const jumpSection = (dir: 1 | -1) => {
    if (!flat.length) return
    const cur = flat[activeIdx]
    const order = flat.map((f) => f.group.id).filter((g, i, a) => a.indexOf(g) === i)
    const next = order[(order.indexOf(cur.group.id) + dir + order.length) % order.length]
    setActive(flat.findIndex((f) => f.group.id === next))
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    const n = flat.length
    if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
      const sug = sections.find((s) => s.group.id === "suggestions")
      const item = sug?.items[Number(e.key) - 1]
      if (item) {
        e.preventDefault()
        setActive(flat.indexOf(item))
        run(item)
      }
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (n) setActive((Math.min(active, n - 1) + 1) % n)
        break
      case "ArrowUp":
        e.preventDefault()
        if (n) setActive((Math.min(active, n - 1) - 1 + n) % n)
        break
      case "Tab":
        e.preventDefault()
        jumpSection(e.shiftKey ? -1 : 1)
        break
      case "Enter":
        e.preventDefault()
        run(flat[activeIdx])
        break
      case "Escape":
        if (query) {
          e.preventDefault()
          e.stopPropagation()
          setQuery("")
          setActive(0)
        } else onClose?.()
        break
    }
  }

  // ⌘K / Ctrl+K focuses the field from anywhere.
  React.useEffect(() => {
    const onDoc = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (!input.current || input.current.closest("[inert]")) return // e.g. a thumbnail preview
        e.preventDefault()
        input.current?.focus()
      }
    }
    document.addEventListener("keydown", onDoc)
    return () => document.removeEventListener("keydown", onDoc)
  }, [])

  React.useEffect(() => {
    if (autoFocus) input.current?.focus({ preventScroll: true })
  }, [autoFocus])

  /* ----- highlight pill + scroll follow the active row ----- */
  React.useLayoutEffect(() => {
    const p = pill.current
    const l = list.current
    if (!p || !l) return
    const el = activeIdx >= 0 ? rowEls.current.get(activeIdx) : undefined
    if (!el) {
      p.style.opacity = "0"
      return
    }
    const top = el.offsetTop
    const first = !placed.current
    if (first) p.style.transition = "none"
    p.style.opacity = ""
    p.style.height = `${el.offsetHeight}px`
    p.style.transform = `translateY(${top}px)`
    if (first) {
      p.getBoundingClientRect()
      p.style.transition = ""
      placed.current = true
    }
    const labelRoom = activeIdx === 0 || flat[activeIdx - 1]?.group.id !== flat[activeIdx]?.group.id ? 28 : 4
    if (top - labelRoom < l.scrollTop) l.scrollTop = Math.max(0, top - labelRoom)
    else if (top + el.offsetHeight + 4 > l.scrollTop + l.clientHeight) l.scrollTop = top + el.offsetHeight + 4 - l.clientHeight
  })

  /* ----- render ----- */
  let idx = -1
  const renderItem = (item: Flat) => {
    idx++
    const i = idx
    const { command: c, keys } = item
    return (
      <button
        key={c.id}
        id={rowId(item)}
        ref={(el) => {
          if (el) rowEls.current.set(i, el)
          else rowEls.current.delete(i)
        }}
        type="button"
        role="option"
        aria-selected={i === activeIdx}
        tabIndex={-1}
        className="cm-item"
        data-pressed={pressed === rowId(item) || undefined}
        onMouseMove={() => {
          if (i !== activeIdx) setActive(i)
          list.current?.removeAttribute("data-out")
        }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setActive(i)
          run(item)
          input.current?.focus()
        }}
      >
        {c.logo ? (
          <span className="cm-logo" aria-hidden>
            {c.logo}
          </span>
        ) : (
          <span className="cm-icon" aria-hidden>
            {c.icon}
          </span>
        )}
        <span className="cm-text">
          <span className="cm-name">{c.label}</span>
          {c.hint && <span className="cm-hint">{c.hint}</span>}
        </span>
        {keys && (
          <span className="cm-keys" aria-hidden>
            {keys.map((k, ki) => (
              <kbd key={ki}>{showKey(k)}</kbd>
            ))}
          </span>
        )}
      </button>
    )
  }

  const listId = `${uid}-list`
  return (
    <div className={cn("cm", className)} data-has-active={activeIdx >= 0 || undefined}>
      <style href="command-menu" precedence="default">
        {CSS}
      </style>
      <div className="cm-card">
        <label className="cm-search">
          <SearchIcon />
          <input
            ref={input}
            className="cm-input"
            role="combobox"
            aria-label="Command"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIdx >= 0 ? rowId(flat[activeIdx]) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className="cm-enter" aria-hidden>
            <EnterIcon />
          </kbd>
        </label>

        <div
          ref={list}
          id={listId}
          className="cm-list"
          role="listbox"
          aria-label="Commands"
          onMouseLeave={(e) => e.currentTarget.setAttribute("data-out", "")}
          onMouseEnter={(e) => e.currentTarget.removeAttribute("data-out")}
        >
          <div className="cm-inner">
            <span ref={pill} className="cm-pill" aria-hidden />
            {sections.map((s) => (
              <div key={s.group.id} className="cm-group" role="group" aria-label={s.group.label}>
                <div className="cm-label" aria-hidden>
                  {s.group.label}
                </div>
                {s.items.map(renderItem)}
              </div>
            ))}
            {askRow && (
              <div className="cm-group" role="group" aria-label="Assistant">
                <div className="cm-label" aria-hidden>
                  Assistant
                </div>
                {renderItem(askRow)}
              </div>
            )}
          </div>
        </div>

        <div className="cm-foot">
          <span className="cm-tip" aria-hidden>
            <kbd>Tab</kbd> to jump between sections
          </span>
          <span className="cm-open" aria-hidden>
            <span className="cm-keys">
              <kbd>{mod}</kbd>
              <kbd>K</kbd>
            </span>
            to open
          </span>
          {ran && (
            <div key={ran.n} className="cm-ran" aria-hidden>
              <CheckIcon />
              <span>{ran.label}</span>
            </div>
          )}
        </div>
      </div>
      <span className="cm-live" aria-live="polite" role="status">
        {ran ? `Ran ${ran.label}` : ""}
      </span>
    </div>
  )
}

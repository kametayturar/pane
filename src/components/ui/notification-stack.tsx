"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type NotificationTone = "default" | "accent" | "success" | "warning" | "error"

export type NotificationAction = {
  label: string
  onClick?: (item: NotificationItem) => void
}

export type NotificationItem = {
  id: string
  title: string
  body?: string
  /** Relative time, e.g. "2m" or "now". */
  time?: string
  /** 16px icon shown in a tile. Falls back to a tone dot. */
  icon?: React.ReactNode
  tone?: NotificationTone
  unread?: boolean
  /** Small buttons under the text. */
  actions?: NotificationAction[]
}

export type NotificationStackProps = {
  /** Controlled list, newest first. Leave out to let the component own the list (see `defaultItems`). */
  items?: NotificationItem[]
  /** Starting list when uncontrolled. */
  defaultItems?: NotificationItem[]
  /** Heading above the stack. */
  title?: string
  /** Start expanded instead of as a stack. */
  defaultExpanded?: boolean
  /** Cards shown in the collapsed stack (front card + peeking ones). */
  maxPeek?: number
  /** Simulate incoming notifications every `intervalMs`. */
  autoPlay?: boolean
  /** What `autoPlay` pushes, cycled in order. Defaults to a built-in AI-product feed. */
  feed?: Omit<NotificationItem, "id">[]
  intervalMs?: number
  /** Keep at most this many notifications (oldest are dropped when new ones arrive). */
  maxItems?: number
  /** Fires after a notification has been dismissed (after its exit animation). */
  onDismiss?: (item: NotificationItem) => void
  /** Fires after "Clear all". */
  onClear?: () => void
  /** Fires when a card is clicked (not one of its buttons). */
  onSelect?: (item: NotificationItem) => void
  onExpandedChange?: (expanded: boolean) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ns {
  --ns-ink: #000;
  --ns-surface: #fff;
  --ns-accent: #0060e2;
  --ns-ok: #139a52;
  --ns-err: #e5484d;
  --ns-warn: #d98100;
  --ns-t1: color-mix(in oklab, var(--ns-ink) 88%, transparent);
  --ns-t2: color-mix(in oklab, var(--ns-ink) 61%, transparent);
  --ns-t3: color-mix(in oklab, var(--ns-ink) 45%, transparent);
  --ns-t4: color-mix(in oklab, var(--ns-ink) 27%, transparent);
  --ns-fill: color-mix(in oklab, var(--ns-ink) 6%, transparent);
  --ns-line: color-mix(in oklab, var(--ns-ink) 6%, transparent);
  --ns-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ns-lift: 0 0 0 .5px rgb(0 0 0 / .08), 0 8px 20px -8px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ns-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 380px;
  color: var(--ns-t1);
  font-family: var(--ns-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ns {
  --ns-ink: #fff;
  --ns-surface: #1c1c1e;
  --ns-accent: #4d8dff;
  --ns-ok: #3fd17f;
  --ns-err: #ff6369;
  --ns-warn: #f5a524;
  --ns-t1: color-mix(in oklab, var(--ns-ink) 90%, transparent);
  --ns-t2: color-mix(in oklab, var(--ns-ink) 62%, transparent);
  --ns-t3: color-mix(in oklab, var(--ns-ink) 46%, transparent);
  --ns-t4: color-mix(in oklab, var(--ns-ink) 28%, transparent);
  --ns-fill: color-mix(in oklab, var(--ns-ink) 8%, transparent);
  --ns-line: color-mix(in oklab, var(--ns-ink) 8%, transparent);
  --ns-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ns-lift: 0 0 0 .5px rgb(255 255 255 / .1), 0 8px 20px -8px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ns *, .ns *::before, .ns *::after { box-sizing: border-box }
.ns button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ns :focus-visible { outline: 2px solid color-mix(in oklab, var(--ns-accent) 60%, transparent); outline-offset: 1px }

/* Header */
.ns-head { display: flex; align-items: center; gap: 8px; height: 28px; margin-bottom: 8px; padding: 0 2px }
.ns-title { font-weight: 500; color: var(--ns-t1) }
.ns-count {
  min-width: 20px; height: 18px; padding: 0 6px; border-radius: 9px; background: var(--ns-fill);
  font-size: 11px; line-height: 18px; font-weight: 500; text-align: center; color: var(--ns-t2); font-variant-numeric: tabular-nums;
}
.ns-spacer { flex: 1 }
.ns .ns-hbtn {
  height: 24px; padding: 0 8px; margin-right: -6px; border-radius: 6px; font-size: 12px; line-height: 16px; font-weight: 500;
  color: var(--ns-t2); transition: background-color .16s, color .16s, opacity .2s;
}
.ns .ns-hbtn + .ns-hbtn { margin-left: -2px }
.ns .ns-hbtn:hover { background: var(--ns-fill); color: var(--ns-ink) }
.ns .ns-hbtn[hidden] { display: none }

/* The stack: every card is absolutely positioned; JS sets offset, scale and height as variables */
.ns-list { position: relative; margin: 0; padding: 0; list-style: none; transition: height .5s var(--ns-ease) }
.ns-item {
  position: absolute; top: 0; left: 0; right: 0; z-index: var(--ns-z, 1); height: var(--ns-h, auto);
  transform: translate(var(--ns-sx, 0), var(--ns-y, 0)) scale(var(--ns-s, 1)); transform-origin: 50% 100%;
  transition: transform .5s var(--ns-ease), height .5s var(--ns-ease), opacity .3s, translate .35s var(--ns-ease), filter .3s;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
  animation: ns-in .56s var(--ns-ease) backwards;
}
.ns-item[data-swiping] { transition: height .5s var(--ns-ease), opacity .3s }
.ns-item[data-hidden="true"] { opacity: 0; pointer-events: none }
.ns-item[data-leaving] { opacity: 0; filter: blur(3px); pointer-events: none; translate: 0 -6px }
.ns[data-expanded="false"] .ns-item[data-rank="0"] { cursor: pointer }

.ns-card {
  position: relative; height: 100%; overflow: hidden; border-radius: 12px; background: var(--ns-surface);
  box-shadow: var(--ns-shadow); transition: box-shadow .2s;
}
.ns-item:hover .ns-card { box-shadow: var(--ns-lift) }
.ns-in { display: flex; align-items: flex-start; gap: 10px; padding: 12px 36px 12px 12px; transition: opacity .25s }
.ns-item[data-tucked] .ns-in { opacity: 0 }
.ns-icon {
  position: relative; display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 8px;
  background: var(--ns-fill); color: var(--ns-t2);
}
.ns-icon svg { width: 16px; height: 16px }
.ns-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ns-t4) }
.ns-item[data-tone="accent"] .ns-icon { color: var(--ns-accent); background: color-mix(in oklab, var(--ns-accent) 11%, transparent) }
.ns-item[data-tone="success"] .ns-icon { color: var(--ns-ok); background: color-mix(in oklab, var(--ns-ok) 12%, transparent) }
.ns-item[data-tone="warning"] .ns-icon { color: var(--ns-warn); background: color-mix(in oklab, var(--ns-warn) 14%, transparent) }
.ns-item[data-tone="error"] .ns-icon { color: var(--ns-err); background: color-mix(in oklab, var(--ns-err) 12%, transparent) }
.ns-item[data-tone="accent"] .ns-dot { background: var(--ns-accent) }
.ns-item[data-tone="success"] .ns-dot { background: var(--ns-ok) }
.ns-item[data-tone="warning"] .ns-dot { background: var(--ns-warn) }
.ns-item[data-tone="error"] .ns-dot { background: var(--ns-err) }
.ns-main { flex: 1; min-width: 0 }
.ns-top { display: flex; align-items: baseline; gap: 8px }
.ns-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--ns-t1) }
.ns-time { flex: none; font-size: 12px; color: var(--ns-t3); font-variant-numeric: tabular-nums }
.ns-body {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; color: var(--ns-t2);
}
.ns-unread { position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%; background: var(--ns-accent); transition: opacity .16s }
.ns-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px }
.ns .ns-act {
  height: 24px; padding: 0 9px; border-radius: 6px; background: var(--ns-fill); font-size: 12px; line-height: 16px; font-weight: 500;
  color: var(--ns-t1); transition: background-color .16s;
}
.ns .ns-act:hover { background: color-mix(in oklab, var(--ns-ink) 10%, transparent) }
.ns .ns-x {
  position: absolute; top: 6px; right: 6px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px;
  color: var(--ns-t3); opacity: 0; transition: opacity .16s, background-color .16s, color .16s;
}
.ns .ns-x svg { width: 12px; height: 12px }
.ns .ns-x:hover { background: var(--ns-fill); color: var(--ns-ink) }
.ns-item:hover .ns-x, .ns-item:focus-within .ns-x { opacity: 1 }
.ns-item:hover .ns-unread, .ns-item:focus-within .ns-unread { opacity: 0 }
@media (hover: none) { .ns .ns-x { opacity: 1 } .ns-unread { display: none } }
.ns-item[data-tucked] .ns-x { display: none }

/* Empty state */
.ns-empty {
  position: absolute; inset: 0 0 auto 0; display: flex; align-items: center; justify-content: center; gap: 8px; height: 56px;
  border-radius: 12px; box-shadow: inset 0 0 0 .5px var(--ns-line); color: var(--ns-t3);
  animation: ns-in .5s var(--ns-ease) .1s backwards;
}
.ns-empty svg { width: 16px; height: 16px; color: var(--ns-ok) }

@keyframes ns-in { from { opacity: 0; filter: blur(3px); translate: 0 -14px } }

@media (prefers-reduced-motion: reduce) {
  .ns *, .ns *::before, .ns *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Defaults                                  */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

const IconCheck = (
  <svg {...svg}>
    <path d="m3.5 8.4 3 3 6-6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconSpark = (
  <svg {...svg}>
    <path d="M8 2.2c.4 2.9 1.5 4 4.4 4.4-2.9.4-4 1.5-4.4 4.4-.4-2.9-1.5-4-4.4-4.4C6.5 6.2 7.6 5.1 8 2.2ZM12.2 10.6c.2 1.2.6 1.6 1.8 1.8-1.2.2-1.6.6-1.8 1.8-.2-1.2-.6-1.6-1.8-1.8 1.2-.2 1.6-.6 1.8-1.8Z" fill="currentColor" />
  </svg>
)
const IconWarn = (
  <svg {...svg}>
    <path d="M8 2.8 14 13H2L8 2.8Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M8 6.6v2.8M8 11.3v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
const IconMsg = (
  <svg {...svg}>
    <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v5a1.5 1.5 0 0 1-1.5 1.5H8l-3 2.4V11h-.5A1.5 1.5 0 0 1 3 9.5v-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)
const IconX = (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="m2.5 2.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

const DEFAULT_ITEMS: NotificationItem[] = [
  { id: "n3", title: "Eval run finished", body: "Support agent v14 passed 212 of 220 cases. 8 regressions need a look.", time: "2m", tone: "success", icon: IconCheck, unread: true, actions: [{ label: "View report" }] },
  { id: "n2", title: "Budget alert", body: "The research workspace used 82% of this month's token budget.", time: "18m", tone: "warning", icon: IconWarn, unread: true },
  { id: "n1", title: "Maya commented", body: "Can we shorten the refund policy answer before Friday's launch?", time: "1h", tone: "accent", icon: IconMsg },
  { id: "n0", title: "Model upgrade ready", body: "The faster tier is available for the triage agent.", time: "3h", icon: IconSpark },
]

const DEFAULT_FEED: Omit<NotificationItem, "id">[] = [
  { title: "Agent needs approval", body: "The billing agent wants to refund 3 orders over $200.", time: "now", tone: "warning", icon: IconWarn, unread: true, actions: [{ label: "Review" }] },
  { title: "Knowledge base synced", body: "1,840 documents indexed from the help center.", time: "now", tone: "success", icon: IconCheck, unread: true },
  { title: "Dev commented", body: "The tone of the onboarding answer feels too formal.", time: "now", tone: "accent", icon: IconMsg, unread: true },
  { title: "New prompt version", body: "Triage prompt v9 is live for 10% of traffic.", time: "now", icon: IconSpark, unread: true },
]

const PEEK = 8
const EXIT_MS = 340

/* -------------------------------------------------------------------------- */
/*                                    Card                                    */
/* -------------------------------------------------------------------------- */

type CardProps = {
  item: NotificationItem
  index: number
  rank: number
  y: number
  scale: number
  height: number | undefined
  hidden: boolean
  tucked: boolean
  leaving: boolean
  expanded: boolean
  onHeight: (id: string, h: number) => void
  onDismiss: (id: string) => void
  onExpand: () => void
  onCollapse: () => void
  onSelect?: (item: NotificationItem) => void
  moveFocus: (from: HTMLElement, dir: 1 | -1) => void
}

function Card({ item, index, rank, y, scale, height, hidden, tucked, leaving, expanded, onHeight, onDismiss, onExpand, onCollapse, onSelect, moveFocus }: CardProps) {
  const inner = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    onHeight(item.id, el.offsetHeight)
    const ro = new ResizeObserver(() => onHeight(item.id, el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [item.id, onHeight])

  // Swipe sideways to dismiss
  const drag = React.useRef<{ x: number; t: number; w: number; moved: boolean } | null>(null)
  const [sx, setSx] = React.useState(0)
  const [swiping, setSwiping] = React.useState(false)
  const suppressClick = React.useRef(false)

  const onPointerDown = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.button !== 0 || hidden || tucked || (e.target as HTMLElement).closest("button")) return
    drag.current = { x: e.clientX, t: Date.now(), w: e.currentTarget.offsetWidth, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLLIElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < 6) return
    d.moved = true
    setSwiping(true)
    setSx(dx)
  }
  const endDrag = (e: React.PointerEvent<HTMLLIElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setSwiping(false)
    if (!d.moved) return
    suppressClick.current = true
    const dx = e.clientX - d.x
    const velocity = Math.abs(dx) / Math.max(1, Date.now() - d.t)
    if (!cancelled && (Math.abs(dx) > Math.min(100, d.w * 0.3) || (velocity > 0.45 && Math.abs(dx) > 24))) {
      setSx(Math.sign(dx) * (d.w + 40))
      onDismiss(item.id)
    } else setSx(0)
  }

  const style = {
    "--ns-z": 100 - rank,
    "--ns-y": `${y}px`,
    "--ns-s": scale,
    "--ns-sx": `${sx}px`,
    ...(height !== undefined ? { "--ns-h": `${height}px` } : null),
    ...(swiping ? { opacity: 1 - Math.min(0.6, Math.abs(sx) / 280) } : null),
  } as React.CSSProperties

  return (
    <li
      className="ns-item"
      style={style}
      tabIndex={hidden || tucked ? -1 : 0}
      aria-hidden={hidden || tucked ? true : undefined}
      aria-label={`${item.title}${item.time ? `, ${item.time}` : ""}`}
      data-rank={rank}
      data-index={index}
      data-tone={item.tone ?? "default"}
      data-hidden={hidden}
      data-tucked={tucked || undefined}
      data-leaving={leaving || undefined}
      data-swiping={swiping || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      onClick={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false
          return
        }
        if ((e.target as HTMLElement).closest("button")) return
        if (!expanded) onExpand()
        else onSelect?.(item)
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (!expanded) onExpand()
          else onSelect?.(item)
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault()
          onDismiss(item.id)
        } else if (e.key === "Escape") onCollapse()
        else if (e.key === "ArrowDown") {
          e.preventDefault()
          moveFocus(e.currentTarget, 1)
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          moveFocus(e.currentTarget, -1)
        }
      }}
    >
      <div className="ns-card">
        <div className="ns-in" ref={inner}>
          <span className="ns-icon" aria-hidden>
            {item.icon ?? <span className="ns-dot" />}
          </span>
          <div className="ns-main">
            <div className="ns-top">
              <span className="ns-name">{item.title}</span>
              {item.time && <span className="ns-time">{item.time}</span>}
            </div>
            {item.body && <div className="ns-body">{item.body}</div>}
            {item.actions && item.actions.length > 0 && (
              <div className="ns-actions">
                {item.actions.map((a) => (
                  <button key={a.label} type="button" className="ns-act" onClick={() => a.onClick?.(item)}>
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {item.unread && <span className="ns-unread" aria-label="Unread" role="img" />}
        <button type="button" className="ns-x" aria-label={`Dismiss ${item.title}`} onClick={() => onDismiss(item.id)}>
          {IconX}
        </button>
      </div>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*                              NotificationStack                             */
/* -------------------------------------------------------------------------- */

export function NotificationStack({
  items: itemsProp,
  defaultItems = DEFAULT_ITEMS,
  title = "Notifications",
  defaultExpanded = false,
  maxPeek = 3,
  autoPlay = false,
  feed = DEFAULT_FEED,
  intervalMs = 3600,
  maxItems = 8,
  onDismiss,
  onClear,
  onSelect,
  onExpandedChange,
  className,
}: NotificationStackProps) {
  const [internal, setInternal] = React.useState(defaultItems)
  const list = itemsProp ?? internal
  const [expanded, setExpandedState] = React.useState(defaultExpanded)
  const [leaving, setLeaving] = React.useState<ReadonlySet<string>>(new Set())
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const root = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  const setExpanded = React.useCallback(
    (next: boolean) => {
      setExpandedState(next)
      onExpandedChange?.(next)
    },
    [onExpandedChange],
  )

  const onHeight = React.useCallback((id: string, h: number) => {
    setHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }))
  }, [])

  // Latest list/callbacks for timers
  const latest = React.useRef({ list, onDismiss, onClear, controlled: itemsProp !== undefined })
  React.useEffect(() => {
    latest.current = { list, onDismiss, onClear, controlled: itemsProp !== undefined }
  })

  const timers = React.useRef(new Set<number>())
  React.useEffect(() => {
    const set = timers.current
    return () => set.forEach((t) => window.clearTimeout(t))
  }, [])

  const finish = React.useCallback((ids: string[], clear: boolean) => {
    const { list: current, onDismiss: dismissCb, onClear: clearCb, controlled } = latest.current
    if (!controlled) setInternal((prev) => prev.filter((n) => !ids.includes(n.id)))
    setLeaving((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
    ids.forEach((id) => {
      const item = current.find((n) => n.id === id)
      if (item) dismissCb?.(item)
    })
    if (clear) clearCb?.()
  }, [])

  const dismiss = React.useCallback(
    (id: string) => {
      setLeaving((prev) => new Set(prev).add(id))
      const t = window.setTimeout(() => finish([id], false), EXIT_MS)
      timers.current.add(t)
    },
    [finish],
  )

  const clearAll = () => {
    const ids = list.filter((n) => !leaving.has(n.id)).map((n) => n.id)
    if (!ids.length) return
    setLeaving(new Set([...leaving, ...ids]))
    setExpanded(false)
    const t = window.setTimeout(() => finish(ids, true), EXIT_MS + ids.length * 40)
    timers.current.add(t)
  }

  // Simulated incoming notifications
  const feedIndex = React.useRef(0)
  const seq = React.useRef(0)
  React.useEffect(() => {
    if (!autoPlay || itemsProp !== undefined || feed.length === 0) return
    const id = window.setInterval(() => {
      const base = feed[feedIndex.current % feed.length]
      feedIndex.current += 1
      seq.current += 1
      setInternal((prev) => [{ ...base, id: `auto-${seq.current}` }, ...prev].slice(0, maxItems))
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [autoPlay, itemsProp, feed, intervalMs, maxItems])

  // Layout: newest first. Offsets are counted from the top of the list.
  const live = list.filter((n) => !leaving.has(n.id))
  let rank = 0
  let acc = 0
  let frontH = 0
  const rows: { item: NotificationItem; rank: number; expandedY: number; leaving: boolean }[] = []
  for (const item of list) {
    const isLeaving = leaving.has(item.id)
    const h = heights[item.id] ?? 0
    rows.push({ item, rank, expandedY: acc, leaving: isLeaving })
    if (!isLeaving) {
      if (rank === 0) frontH = h
      acc += h + 8
      rank++
    }
  }
  const peeking = Math.min(live.length, maxPeek)
  const totalH = Math.max(0, acc - 8)
  const stackH = expanded ? totalH : frontH + Math.max(0, peeking - 1) * PEEK
  const measured = live.every((n) => heights[n.id] !== undefined)

  const moveFocus = (from: HTMLElement, dir: 1 | -1) => {
    const els = [...(root.current?.querySelectorAll<HTMLElement>(".ns-item:not([data-leaving])") ?? [])].sort((a, b) => Number(a.dataset.rank) - Number(b.dataset.rank))
    const i = els.indexOf(from)
    els[Math.min(els.length - 1, Math.max(0, i + dir))]?.focus()
  }

  const canExpand = live.length > 1
  const isExpanded = expanded && canExpand

  return (
    <div
      className={cn("ns", className)}
      ref={root}
      data-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Escape" && isExpanded) setExpanded(false)
      }}
    >
      <style href="notification-stack" precedence="default">
        {CSS}
      </style>

      <div className="ns-head">
        <span className="ns-title">{title}</span>
        {live.length > 0 && (
          <span className="ns-count" aria-label={`${live.length} notifications`}>
            {live.length}
          </span>
        )}
        <span className="ns-spacer" />
        <button type="button" className="ns-hbtn" hidden={!canExpand} aria-expanded={isExpanded} aria-controls={listId} onClick={() => setExpanded(!isExpanded)}>
          {isExpanded ? "Show less" : "Show all"}
        </button>
        <button type="button" className="ns-hbtn" hidden={live.length === 0} onClick={clearAll}>
          Clear all
        </button>
      </div>

      <ol className="ns-list" id={listId} aria-live="polite" aria-relevant="additions" style={{ height: stackH || (live.length === 0 ? 56 : undefined) }}>
        {rows.map(({ item, rank: rk, expandedY, leaving: lv }, index) => {
          const tucked = !isExpanded && rk > 0 && !lv
          const hidden = !lv && !isExpanded && rk >= maxPeek
          const y = lv ? expandedY : isExpanded ? expandedY : Math.min(rk, maxPeek) * PEEK
          return (
            <Card
              key={item.id}
              item={item}
              index={index}
              rank={rk}
              y={y}
              scale={isExpanded || lv ? 1 : Math.max(0.8, 1 - rk * 0.045)}
              height={tucked && frontH && measured ? frontH : heights[item.id]}
              hidden={hidden}
              tucked={tucked}
              leaving={lv}
              expanded={isExpanded}
              onHeight={onHeight}
              onDismiss={dismiss}
              onExpand={() => canExpand && setExpanded(true)}
              onCollapse={() => setExpanded(false)}
              onSelect={onSelect}
              moveFocus={moveFocus}
            />
          )
        })}
        {live.length === 0 && (
          <li className="ns-empty">
            <svg {...svg}>
              <path d="m3.5 8.4 3 3 6-6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            You&apos;re all caught up
          </li>
        )}
      </ol>
    </div>
  )
}

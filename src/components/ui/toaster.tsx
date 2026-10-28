"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ToastType = "default" | "success" | "error" | "info" | "warning" | "loading"

export type ToastPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

export type ToastAction = {
  label: string
  onClick?: () => void
}

export type ToastOptions = {
  /** Reuse an id to update a toast that is already on screen. */
  id?: string | number
  description?: React.ReactNode
  /** Milliseconds before it closes itself. `Infinity` keeps it until dismissed. Loading toasts default to `Infinity`. */
  duration?: number
  /** A button on the right of the toast. Clicking it also dismisses the toast. */
  action?: ToastAction
  /** Replace the status icon, or pass `false` to hide it. */
  icon?: React.ReactNode | false
  /** Show a close button on this toast (overrides the Toaster default). */
  closeButton?: boolean
  /** Which <Toaster id="..."> shows this toast. Defaults to "default". */
  toasterId?: string
  onDismiss?: (id: string) => void
  onAutoClose?: (id: string) => void
}

type ToastRecord = ToastOptions & {
  id: string
  title: React.ReactNode
  type: ToastType
  toasterId: string
  /** Set once it starts leaving; it is removed from the store after the exit animation. */
  dismissed: boolean
  /** Bumped on every update – restarts the auto-close timer and plays the content swap. */
  ver: number
}

export type ToasterProps = {
  /** Which corner or edge the stack sits on. */
  position?: ToastPosition
  /** Position inside the nearest positioned ancestor instead of the viewport. */
  inline?: boolean
  /** Name of this Toaster. `toast(..., { toasterId })` targets it. */
  id?: string
  /** How many toasts show before older ones tuck away. */
  visibleToasts?: number
  /** Default auto-close time in ms. */
  duration?: number
  /** Space between toasts when the stack is expanded, in px. */
  gap?: number
  /** Distance from the edge of the viewport/container, in px. */
  offset?: number
  /** Keep the stack expanded instead of expanding on hover. */
  expand?: boolean
  /** Show a close button on every toast. */
  closeButton?: boolean
  /** Keys that focus the stack: modifier names ("altKey") plus a `KeyboardEvent.code`. */
  hotkey?: string[]
  /** Accessible name of the region. */
  label?: string
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                Module store                                */
/* -------------------------------------------------------------------------- */

let records: ToastRecord[] = []
let counter = 0
const listeners = new Set<() => void>()
const EXIT_MS = 380

function emit(next: ToastRecord[]) {
  records = next
  listeners.forEach((l) => l())
}
function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
const snapshot = () => records

function create(title: React.ReactNode, type: ToastType, opts: ToastOptions = {}): string {
  const id = opts.id !== undefined ? String(opts.id) : `t${++counter}`
  const existing = records.find((r) => r.id === id && !r.dismissed)
  if (existing) {
    update(id, { ...opts, title, type })
    return id
  }
  const rec: ToastRecord = { ...opts, id, title, type, toasterId: opts.toasterId ?? "default", dismissed: false, ver: 0 }
  emit([...records.filter((r) => r.id !== id), rec])
  return id
}

function update(id: string | number, patch: Partial<Omit<ToastRecord, "id" | "dismissed" | "ver">>) {
  const key = String(id)
  emit(records.map((r) => (r.id === key && !r.dismissed ? { ...r, ...patch, ver: r.ver + 1 } : r)))
}

function dismissOne(id: string, reason: "manual" | "auto" = "manual") {
  const rec = records.find((r) => r.id === id)
  if (!rec || rec.dismissed) return
  emit(records.map((r) => (r.id === id ? { ...r, dismissed: true } : r)))
  if (reason === "auto") rec.onAutoClose?.(id)
  rec.onDismiss?.(id)
  window.setTimeout(() => emit(records.filter((r) => r.id !== id)), EXIT_MS)
}

type PromiseMessages<T> = {
  loading: React.ReactNode
  success: React.ReactNode | ((data: T) => React.ReactNode)
  error: React.ReactNode | ((error: unknown) => React.ReactNode)
  description?: React.ReactNode
}

function fromFn<A, R>(v: R | ((a: A) => R), a: A): R {
  return typeof v === "function" ? (v as (a: A) => R)(a) : v
}

/**
 * Show a toast. `toast("Saved")`, `toast.success(...)`, `toast.promise(...)`.
 * Returns the toast id, which `toast.update` and `toast.dismiss` accept.
 */
export const toast = Object.assign(
  (title: React.ReactNode, opts?: ToastOptions) => create(title, "default", opts),
  {
    success: (title: React.ReactNode, opts?: ToastOptions) => create(title, "success", opts),
    error: (title: React.ReactNode, opts?: ToastOptions) => create(title, "error", opts),
    info: (title: React.ReactNode, opts?: ToastOptions) => create(title, "info", opts),
    warning: (title: React.ReactNode, opts?: ToastOptions) => create(title, "warning", opts),
    loading: (title: React.ReactNode, opts?: ToastOptions) => create(title, "loading", opts),
    /** Loading toast that turns into a success or error toast when the promise settles. */
    promise: <T,>(promise: Promise<T> | (() => Promise<T>), msgs: PromiseMessages<T>, opts?: ToastOptions) => {
      const id = create(msgs.loading, "loading", { ...opts, description: msgs.description ?? opts?.description })
      Promise.resolve(typeof promise === "function" ? promise() : promise).then(
        (data) => update(id, { type: "success", title: fromFn(msgs.success, data) }),
        (err) => update(id, { type: "error", title: fromFn(msgs.error, err) }),
      )
      return id
    },
    /** Change a toast that is on screen (title, description, type, action…). */
    update: (id: string | number, patch: Partial<ToastOptions> & { title?: React.ReactNode; type?: ToastType }) =>
      update(id, patch),
    /** Dismiss one toast, or every toast when called without an id. */
    dismiss: (id?: string | number) => {
      if (id === undefined) records.forEach((r) => dismissOne(r.id))
      else dismissOne(String(id))
    },
  },
)

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tst {
  --tst-ink: #000;
  --tst-surface: #fff;
  --tst-accent: #0060e2;
  --tst-ok: #139a52;
  --tst-err: #e5484d;
  --tst-warn: #d98100;
  --tst-t1: color-mix(in oklab, var(--tst-ink) 88%, transparent);
  --tst-t2: color-mix(in oklab, var(--tst-ink) 61%, transparent);
  --tst-t3: color-mix(in oklab, var(--tst-ink) 45%, transparent);
  --tst-fill: color-mix(in oklab, var(--tst-ink) 6%, transparent);
  --tst-line: color-mix(in oklab, var(--tst-ink) 6%, transparent);
  --tst-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .18), 0 2px 4px -1px rgb(0 0 0 / .06);
  --tst-ease: cubic-bezier(.22, 1, .36, 1);
  position: fixed;
  z-index: 60;
  height: 0;
  pointer-events: none;
  color: var(--tst-t1);
  font-family: var(--tst-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
.tst[data-inline] { position: absolute }
:is(.dark, [data-theme="dark"]) .tst {
  --tst-ink: #fff;
  --tst-surface: #1c1c1e;
  --tst-accent: #4d8dff;
  --tst-ok: #3fd17f;
  --tst-err: #ff6369;
  --tst-warn: #f5a524;
  --tst-t1: color-mix(in oklab, var(--tst-ink) 90%, transparent);
  --tst-t2: color-mix(in oklab, var(--tst-ink) 62%, transparent);
  --tst-t3: color-mix(in oklab, var(--tst-ink) 46%, transparent);
  --tst-fill: color-mix(in oklab, var(--tst-ink) 8%, transparent);
  --tst-line: color-mix(in oklab, var(--tst-ink) 8%, transparent);
  --tst-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 2px 4px 0 rgb(0 0 0 / .4);
}
.tst *, .tst *::before, .tst *::after { box-sizing: border-box }
.tst button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.tst :focus-visible { outline: 2px solid color-mix(in oklab, var(--tst-accent) 60%, transparent); outline-offset: 1px }
.tst-list:focus { outline: none }

/* The list is exactly as tall as the stack, so hovering the gaps keeps it expanded */
.tst-list {
  position: absolute; left: 0; right: 0; margin: 0; padding: 0; list-style: none; pointer-events: auto;
  transition: height .45s var(--tst-ease);
}
.tst[data-y="top"] .tst-list { top: 0 }
.tst[data-y="bottom"] .tst-list { bottom: 0 }
.tst[data-empty] .tst-list { pointer-events: none }

.tst-item {
  position: absolute; left: 0; right: 0; z-index: var(--tst-z, 1); height: var(--tst-h, auto);
  transform: translate(var(--tst-sx, 0), var(--tst-ty, 0)) scale(var(--tst-s, 1));
  transition: transform .45s var(--tst-ease), height .45s var(--tst-ease), opacity .3s, translate .35s var(--tst-ease), filter .3s;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
  animation: tst-in .5s var(--tst-ease) backwards;
}
.tst[data-y="bottom"] .tst-item { bottom: 0; transform-origin: 50% 100%; --tst-dir: 1 }
.tst[data-y="top"] .tst-item { top: 0; transform-origin: 50% 0; --tst-dir: -1 }
.tst-item[data-swiping] { transition: height .45s var(--tst-ease), opacity .3s; cursor: grabbing }
.tst-item[data-visible="false"] { opacity: 0; pointer-events: none }
.tst-item[data-state="exit"] {
  opacity: 0; filter: blur(3px); pointer-events: none;
  translate: 0 calc(var(--tst-dir) * 10px);
}
.tst-item[data-state="exit"][data-swept] { translate: 0 0 }

.tst-card {
  position: relative; height: 100%; overflow: hidden; border-radius: 12px;
  background: var(--tst-surface); box-shadow: var(--tst-shadow);
}
.tst-in {
  display: flex; align-items: flex-start; gap: 10px; min-height: 44px; padding: 12px 14px;
  transition: opacity .25s;
}
.tst-item[data-tucked] .tst-in { opacity: 0 }
.tst-icon {
  display: grid; place-items: center; flex: none; width: 16px; height: 20px; color: var(--tst-t2);
  animation: tst-pop .46s var(--tst-ease) backwards;
}
.tst-icon svg { width: 16px; height: 16px }
.tst-item[data-type="success"] .tst-icon { color: var(--tst-ok) }
.tst-item[data-type="error"] .tst-icon { color: var(--tst-err) }
.tst-item[data-type="warning"] .tst-icon { color: var(--tst-warn) }
.tst-item[data-type="info"] .tst-icon { color: var(--tst-accent) }
.tst-spin { animation: tst-spin .8s linear infinite; transform-origin: 50% 50% }
.tst-text { flex: 1; min-width: 0 }
.tst-text[data-swap] { animation: tst-swap .42s var(--tst-ease) backwards }
.tst-title { font-weight: 500; color: var(--tst-t1) }
.tst-item[data-type="loading"] .tst-title { color: var(--tst-t2) }
.tst-desc { margin-top: 1px; color: var(--tst-t2) }
.tst .tst-btn {
  flex: none; align-self: center; height: 26px; margin: -2px -4px -2px 0; padding: 0 10px; border-radius: 6px;
  background: var(--tst-fill); font-size: 12px; line-height: 16px; font-weight: 500; color: var(--tst-t1);
  transition: background-color .16s;
}
.tst .tst-btn:hover { background: color-mix(in oklab, var(--tst-ink) 10%, transparent) }
.tst .tst-close {
  position: absolute; top: -7px; left: -7px; z-index: 2; display: grid; place-items: center; width: 20px; height: 20px;
  border-radius: 50%; background: var(--tst-surface); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--tst-ink) 14%, transparent), 0 1px 3px rgb(0 0 0 / .12);
  color: var(--tst-t2); opacity: 0; transform: scale(.8);
  transition: opacity .16s, transform .22s var(--tst-ease), color .16s;
}
.tst .tst-close svg { width: 10px; height: 10px }
.tst .tst-close:hover { color: var(--tst-ink) }
.tst-item:hover .tst-close, .tst-item:focus-within .tst-close { opacity: 1; transform: none }
.tst-item[data-tucked] .tst-close { display: none }

@keyframes tst-in { from { opacity: 0; filter: blur(3px); translate: 0 calc(var(--tst-dir) * 18px) } }
@keyframes tst-pop { 0% { transform: scale(.5); opacity: 0 } 60% { transform: scale(1.12) } 100% { transform: none } }
@keyframes tst-swap { from { opacity: 0; filter: blur(6px); transform: translateY(2px) } }
@keyframes tst-spin { to { transform: rotate(360deg) } }

@media (prefers-reduced-motion: reduce) {
  .tst *, .tst *::before, .tst *::after { animation: none !important; transition: none !important }
  .tst-item { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

function StatusIcon({ type }: { type: ToastType }) {
  switch (type) {
    case "success":
      return (
        <svg {...svg}>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="m5.4 8.2 1.8 1.8 3.5-3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case "error":
      return (
        <svg {...svg}>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 4.9v3.5M8 10.6v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    case "warning":
      return (
        <svg {...svg}>
          <path d="M8 2.6 14 13H2L8 2.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M8 6.6v2.8M8 11.4v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      )
    case "info":
      return (
        <svg {...svg}>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 7.3v3.4M8 5.3v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    case "loading":
      return (
        <svg {...svg} className="tst-spin">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity=".2" />
          <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Toast view                                */
/* -------------------------------------------------------------------------- */

type ViewProps = {
  item: ToastRecord
  index: number
  rank: number
  /** Distance from the edge, in px, for the current mode. */
  ty: number
  scale: number
  /** Height of the li (px). undefined until measured. */
  height: number | undefined
  visible: boolean
  tucked: boolean
  paused: boolean
  bottom: boolean
  duration: number
  closeButton: boolean
  onHeight: (id: string, h: number) => void
}

function ToastView({ item, index, rank, ty, scale, height, visible, tucked, paused, bottom, duration, closeButton, onHeight }: ViewProps) {
  const { id } = item
  const inner = React.useRef<HTMLDivElement>(null)
  const dur = item.duration ?? (item.type === "loading" ? Infinity : duration)

  // Measure the natural height of the content; the stack positions itself from these numbers.
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    onHeight(id, el.offsetHeight)
    const ro = new ResizeObserver(() => onHeight(id, el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [id, onHeight])

  // Auto-close timer that pauses while the stack is hovered or focused and resumes with what is left.
  const remaining = React.useRef(dur)
  const startedAt = React.useRef(0)
  React.useEffect(() => {
    remaining.current = dur
  }, [dur, item.ver])
  React.useEffect(() => {
    if (item.dismissed || paused || !Number.isFinite(dur)) return
    startedAt.current = Date.now()
    const timer = window.setTimeout(() => dismissOne(id, "auto"), Math.max(0, remaining.current))
    return () => {
      window.clearTimeout(timer)
      remaining.current -= Date.now() - startedAt.current
    }
  }, [id, item.dismissed, paused, dur, item.ver])

  // Swipe to dismiss
  const drag = React.useRef<{ x: number; t: number; w: number } | null>(null)
  const [sx, setSx] = React.useState(0)
  const [swiping, setSwiping] = React.useState(false)
  const [swept, setSwept] = React.useState(false)

  const onPointerDown = (e: React.PointerEvent<HTMLLIElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return
    drag.current = { x: e.clientX, t: Date.now(), w: e.currentTarget.offsetWidth }
    e.currentTarget.setPointerCapture(e.pointerId)
    setSwiping(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLLIElement>) => {
    if (!drag.current) return
    setSx(e.clientX - drag.current.x)
  }
  const endDrag = (e: React.PointerEvent<HTMLLIElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setSwiping(false)
    const dx = e.clientX - d.x
    const velocity = Math.abs(dx) / Math.max(1, Date.now() - d.t)
    if (!cancelled && (Math.abs(dx) > Math.min(90, d.w * 0.3) || (velocity > 0.45 && Math.abs(dx) > 24))) {
      setSx(Math.sign(dx) * (d.w + 40))
      setSwept(true)
      dismissOne(id)
    } else setSx(0)
  }

  const style = {
    "--tst-z": index + 1,
    "--tst-ty": `${bottom ? -ty : ty}px`,
    "--tst-s": scale,
    "--tst-sx": `${sx}px`,
    ...(height !== undefined ? { "--tst-h": `${height}px` } : null),
    ...(swiping || swept ? { opacity: swept ? 0 : 1 - Math.min(0.6, Math.abs(sx) / 260) } : null),
  } as React.CSSProperties

  const showClose = item.closeButton ?? closeButton
  const icon = item.icon === false ? null : (item.icon ?? <StatusIcon type={item.type} />)
  const urgent = item.type === "error"

  return (
    <li
      className="tst-item"
      style={style}
      tabIndex={visible ? 0 : -1}
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      aria-atomic="true"
      aria-hidden={visible ? undefined : true}
      data-type={item.type}
      data-rank={rank}
      data-state={item.dismissed ? "exit" : "open"}
      data-visible={visible}
      data-tucked={tucked || undefined}
      data-swiping={swiping || undefined}
      data-swept={swept || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation()
          dismissOne(id)
        }
      }}
    >
      <div className="tst-card">
        <div className="tst-in" ref={inner}>
          {icon && (
            <span className="tst-icon" key={item.type}>
              {icon}
            </span>
          )}
          <div className="tst-text" key={item.ver} data-swap={item.ver > 0 || undefined}>
            <div className="tst-title">{item.title}</div>
            {item.description && <div className="tst-desc">{item.description}</div>}
          </div>
          {item.action && (
            <button
              type="button"
              className="tst-btn"
              onClick={() => {
                item.action?.onClick?.()
                dismissOne(id)
              }}
            >
              {item.action.label}
            </button>
          )}
        </div>
      </div>
      {showClose && (
        <button type="button" className="tst-close" aria-label="Close notification" onClick={() => dismissOne(id)}>
          <svg viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="m2 2 6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Toaster                                  */
/* -------------------------------------------------------------------------- */

const PEEK = 14

export function Toaster({
  position = "bottom-right",
  inline = false,
  id = "default",
  visibleToasts = 3,
  duration = 4000,
  gap = 12,
  offset = 16,
  expand = false,
  closeButton = false,
  hotkey = ["altKey", "KeyT"],
  label = "Notifications",
  className,
  style,
}: ToasterProps) {
  const all = React.useSyncExternalStore(subscribe, snapshot, snapshot)
  const mine = React.useMemo(() => all.filter((r) => r.toasterId === id), [all, id])
  const [y, x] = position.split("-") as ["top" | "bottom", "left" | "center" | "right"]
  const bottom = y === "bottom"

  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const onHeight = React.useCallback((tid: string, h: number) => {
    setHeights((prev) => (prev[tid] === h ? prev : { ...prev, [tid]: h }))
  }, [])

  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const list = React.useRef<HTMLOListElement>(null)

  const liveCount = mine.filter((r) => !r.dismissed).length
  const interacting = (hovered || focused) && liveCount > 0
  const expanded = expand || interacting

  // Hotkey: focus the stack (default Alt + T)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = /^(alt|ctrl|meta|shift)Key$/
      const hit = hotkey.length > 0 && hotkey.every((k) => (mod.test(k) ? (e as unknown as Record<string, boolean>)[k] : e.code === k))
      if (hit) {
        e.preventDefault()
        list.current?.querySelector<HTMLElement>('[data-rank="0"]')?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [hotkey])

  // Lay the stack out: newest toast first, offsets counted from the edge.
  let rank = 0
  let acc = 0
  let shown = 0
  let frontH = 0
  const rows: { r: ToastRecord; index: number; rank: number; accOffset: number }[] = []
  for (let i = mine.length - 1; i >= 0; i--) {
    const r = mine[i]
    rows.push({ r, index: i, rank, accOffset: acc })
    if (!r.dismissed) {
      const h = heights[r.id] ?? 0
      if (rank === 0) frontH = h
      if (rank < visibleToasts) shown += h + gap
      acc += h + gap
      rank++
    }
  }
  const stackHeight = Math.max(0, expanded ? shown - gap : frontH + (Math.min(liveCount, visibleToasts) - 1) * PEEK)

  const rootStyle: React.CSSProperties = {
    [y]: offset,
    width: `min(356px, calc(100% - ${offset * 2}px))`,
    ...(x === "left" ? { left: offset } : x === "right" ? { right: offset } : { left: "50%", transform: "translateX(-50%)" }),
    ...style,
  }

  return (
    <section
      className={cn("tst", className)}
      style={rootStyle}
      data-y={y}
      data-x={x}
      data-inline={inline || undefined}
      data-empty={liveCount === 0 || undefined}
      aria-label={`${label}${hotkey.length ? ` (${hotkey.map((k) => k.replace(/^Key/, "").replace(/Key$/, "")).join("+")})` : ""}`}
      tabIndex={-1}
    >
      <style href="toaster" precedence="default">
        {CSS}
      </style>
      <ol
        className="tst-list"
        ref={list}
        style={{ height: stackHeight }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
        }}
      >
        {rows.map(({ r, index, rank: rk, accOffset }) => {
          const h = heights[r.id]
          const tucked = !expanded && rk > 0 && !r.dismissed
          const offsetPx = expanded ? accOffset : Math.min(rk, visibleToasts) * PEEK
          return (
            <ToastView
              key={r.id}
              item={r}
              index={index}
              rank={rk}
              ty={offsetPx}
              scale={expanded || r.dismissed ? 1 : Math.max(0.8, 1 - rk * 0.05)}
              height={tucked && frontH ? frontH : h}
              visible={r.dismissed || rk < visibleToasts}
              tucked={tucked}
              paused={interacting}
              bottom={bottom}
              duration={duration}
              closeButton={closeButton}
              onHeight={onHeight}
            />
          )
        })}
      </ol>
    </section>
  )
}

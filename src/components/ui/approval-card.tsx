"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ApprovalRisk = "low" | "medium" | "high"
export type ApprovalStatus = "pending" | "approved" | "denied"
export type ApprovalDetail = { label: string; value: React.ReactNode }

export type ApprovalCardProps = {
  /** The action, e.g. "Issue refund" – also the card's accessible name. */
  title?: string
  /** One line of context below the title; truncates. */
  description?: React.ReactNode
  /** Tinted badge in the header (gray, amber, red); leave out to hide it. */
  risk?: ApprovalRisk
  /** Icon in the 32px header tile; SVGs get a 16px stroke style. Defaults to a shield. */
  icon?: React.ReactNode
  /** Key-value rows in the preview panel. */
  details?: ApprovalDetail[]
  /** Custom content above the details, e.g. recipients or a diff. `children` work the same. */
  preview?: React.ReactNode
  /** Used as the preview when `preview` isn't set. */
  children?: React.ReactNode
  /** Controlled status; setting it back to "pending" starts a fresh request. */
  status?: ApprovalStatus
  /** Starting status when uncontrolled. */
  defaultStatus?: ApprovalStatus
  /** Called on Approve or ⌘/Ctrl+Enter. Return a promise to show a spinner and lock the card; a rejection keeps it pending. */
  onApprove?: (info: { always: boolean }) => void | Promise<unknown>
  /** Called on Deny, Escape, or when the countdown runs out. */
  onDeny?: (info: { reason: "user" | "timeout" }) => void
  /** Shows an Edit button before Deny. */
  onEdit?: () => void
  /** Seconds until the request expires – quiet "Expires in 0:42" text, amber in the last 10 seconds, paused while hovered or focused. */
  expiresIn?: number
  /** Called when the countdown runs out, right before `onDeny({ reason: "timeout" })`. */
  onExpire?: () => void
  /** Show the "Always allow this action" checkbox. */
  allowAlways?: boolean
  alwaysLabel?: string
  approveLabel?: string
  denyLabel?: string
  editLabel?: string
  /** Show the ⌘↵ / Esc hints on the buttons – the shortcuts work either way. */
  shortcuts?: boolean
  /** Small label on the gray tray above the card, e.g. "Step 4 · gmail.send". */
  label?: React.ReactNode
  /** Where the buttons sit: in the last row of the white card, or on a gray tray below it. */
  actions?: "card" | "tray"
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.apc {
  --apc-ink: #000;
  --apc-surface: #fff;
  --apc-accent: #0060e2;
  --apc-amber: #a85a00;
  --apc-danger: #d92d20;
  --apc-t1: color-mix(in oklab, var(--apc-ink) 88%, transparent);
  --apc-t2: color-mix(in oklab, var(--apc-ink) 61%, transparent);
  --apc-t3: color-mix(in oklab, var(--apc-ink) 45%, transparent);
  --apc-t4: color-mix(in oklab, var(--apc-ink) 27%, transparent);
  --apc-fill: color-mix(in oklab, var(--apc-ink) 4%, transparent);
  --apc-fill2: color-mix(in oklab, var(--apc-ink) 7%, transparent);
  --apc-line: color-mix(in oklab, var(--apc-ink) 6%, transparent);
  --apc-tray: color-mix(in oklab, var(--apc-ink) 4%, transparent);
  --apc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --apc-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 460px;
  font-family: var(--apc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; color: var(--apc-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .apc {
  --apc-ink: #fff;
  --apc-surface: #1c1c1e;
  --apc-accent: #4d8dff;
  --apc-amber: #f5a524;
  --apc-danger: #ff6b60;
  --apc-t1: color-mix(in oklab, var(--apc-ink) 90%, transparent);
  --apc-t2: color-mix(in oklab, var(--apc-ink) 62%, transparent);
  --apc-t3: color-mix(in oklab, var(--apc-ink) 46%, transparent);
  --apc-t4: color-mix(in oklab, var(--apc-ink) 28%, transparent);
  --apc-fill: color-mix(in oklab, var(--apc-ink) 6%, transparent);
  --apc-fill2: color-mix(in oklab, var(--apc-ink) 10%, transparent);
  --apc-line: color-mix(in oklab, var(--apc-ink) 8%, transparent);
  --apc-tray: color-mix(in oklab, var(--apc-ink) 6%, transparent);
  --apc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.apc *, .apc *::before, .apc *::after { box-sizing: border-box }
:where(.apc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.apc :focus-visible { outline: 2px solid color-mix(in oklab, var(--apc-accent) 60%, transparent); outline-offset: 1px }
.apc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Shell: a gray tray when there is a label or the buttons live below the card */
.apc-shell { border-radius: 12px }
.apc-shell[data-tray] { padding: 4px; background: var(--apc-tray) }
.apc-grow { transition: height .42s var(--apc-ease) }
.apc-layer { display: flow-root }
.apc-layer[data-leaving] { opacity: 0; filter: blur(3px); pointer-events: none; transition: opacity .22s, filter .22s }
.apc-label { display: flex; align-items: center; min-height: 28px; padding: 0 10px 0 8px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--apc-t3) }

/* Card */
.apc-card { border-radius: 10px; background: var(--apc-surface); box-shadow: var(--apc-shadow); padding: 14px; animation: apc-in .4s var(--apc-ease) backwards }
.apc-head { display: flex; align-items: center; gap: 12px }
.apc-tile {
  display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 8px; background: var(--apc-fill);
  box-shadow: inset 0 0 0 .5px var(--apc-line); color: var(--apc-t2);
}
.apc-tile svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round }
.apc-titles { flex: 1; min-width: 0 }
.apc-title { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 500; line-height: 20px; color: var(--apc-ink) }
.apc-desc { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 16px; color: var(--apc-t3) }
.apc-risk {
  flex: none; display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; white-space: nowrap;
  font-size: 12px; font-weight: 500; line-height: 16px; color: var(--apc-t2); background: var(--apc-fill2);
}
.apc-risk[data-risk="medium"] { color: var(--apc-amber); background: color-mix(in oklab, var(--apc-amber) 12%, transparent) }
.apc-risk[data-risk="high"] { color: var(--apc-danger); background: color-mix(in oklab, var(--apc-danger) 11%, transparent) }

/* Preview */
.apc-preview { margin-top: 12px; padding: 4px 12px; border-radius: 8px; background: var(--apc-fill); box-shadow: inset 0 0 0 .5px var(--apc-line) }
.apc-custom { padding: 8px 0; min-width: 0 }
.apc-custom + .apc-details { border-top: .5px solid var(--apc-line) }
.apc-details { display: grid; margin: 0 }
.apc-row { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: baseline; gap: 10px; padding: 7px 0; font-size: 12px; line-height: 16px }
.apc-row + .apc-row { border-top: .5px solid var(--apc-line) }
.apc-row dt { color: var(--apc-t3) }
.apc-row dd { margin: 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--apc-t1) }

/* Actions */
.apc-actions-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 12px; margin-top: 14px }
.apc-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 8px 4px 4px 10px }
.apc-left { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; min-width: 0 }
.apc-buttons { display: flex; align-items: center; gap: 6px; margin-left: auto }
.apc-btn {
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 30px; padding: 0 10px 0 12px; border-radius: 8px;
  font-weight: 500; white-space: nowrap; transition: background-color .16s, color .16s, opacity .2s, transform .16s var(--apc-ease);
}
.apc-btn:active:not([aria-disabled="true"]) { transform: scale(.97) }
.apc-btn[aria-disabled="true"] { cursor: default }
.apc-deny { color: var(--apc-t2) }
.apc-deny:hover:not([aria-disabled="true"]) { background: var(--apc-fill2); color: var(--apc-ink) }
.apc-edit { background: var(--apc-surface); box-shadow: var(--apc-shadow); color: var(--apc-t1); padding: 0 12px }
.apc-edit:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--apc-surface), var(--apc-ink) 3%) }
.apc-approve { background: var(--apc-ink); color: var(--apc-surface) }
.apc-approve:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--apc-ink) 84%, var(--apc-surface)) }
.apc[data-busy] .apc-btn:not(.apc-approve) { opacity: .45 }
.apc-kbd {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 4px; font-size: 11px; line-height: 1;
  font-family: ui-monospace, "SF Mono", Menlo, monospace; font-weight: 500; background: var(--apc-fill2); color: var(--apc-t3);
}
.apc-approve .apc-kbd { background: color-mix(in oklab, var(--apc-surface) 20%, transparent); color: color-mix(in oklab, var(--apc-surface) 75%, transparent) }
.apc-spinner { width: 14px; height: 14px; fill: none; stroke-width: 1.8; stroke-linecap: round; animation: apc-spin .8s linear infinite }
.apc-spinner circle { stroke: color-mix(in oklab, var(--apc-surface) 25%, transparent) }
.apc-spinner path { stroke: var(--apc-surface) }

/* Checkbox */
.apc-check { position: relative; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--apc-t2); transition: color .16s; user-select: none }
.apc-check:hover { color: var(--apc-ink) }
.apc-check input { position: absolute; inset: 0 auto 0 0; width: 16px; height: 100%; margin: 0; opacity: 0; cursor: pointer }
.apc-box {
  display: grid; place-items: center; flex: none; width: 16px; height: 16px; border-radius: 5px; background: var(--apc-surface);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--apc-ink) 22%, transparent); transition: background-color .16s, box-shadow .16s;
}
.apc-box svg { width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transform: scale(0); transition: transform .24s var(--apc-ease) }
.apc-check input:checked + .apc-box { background: var(--apc-accent); box-shadow: none }
.apc-check input:checked + .apc-box svg { transform: scale(1) }
.apc-check input:focus-visible + .apc-box { outline: 2px solid color-mix(in oklab, var(--apc-accent) 60%, transparent); outline-offset: 1px }

/* Countdown */
.apc-clock { font-size: 12px; line-height: 16px; color: var(--apc-t3); font-variant-numeric: tabular-nums; white-space: nowrap; transition: color .2s }
.apc-clock[data-urgent] { color: var(--apc-amber) }
.apc-clock[data-paused]::after { content: " · paused" }

/* Resolved row */
.apc-done {
  display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 10px 12px; border-radius: 12px; background: var(--apc-tray);
  animation: apc-in .36s var(--apc-ease) backwards; outline: none;
}
.apc-shell[data-tray] .apc-done { background: none; padding-left: 10px }
.apc-done-icon { flex: none; width: 20px; height: 20px; animation: apc-pop .46s var(--apc-ease) backwards }
.apc-done-icon circle { fill: color-mix(in oklab, var(--apc-accent) 76.5%, transparent) }
.apc-done[data-status="denied"] .apc-done-icon circle { fill: color-mix(in oklab, var(--apc-ink) 38%, transparent) }
.apc-done-icon path { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; animation: apc-draw .36s var(--apc-ease) .16s backwards }
.apc-done-text { display: flex; align-items: baseline; gap: 8px; flex: 1; min-width: 0 }
.apc-done-state { flex: none; font-weight: 500; color: var(--apc-ink) }
.apc-done-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--apc-t2) }
.apc-done-meta { flex: none; font-size: 12px; line-height: 16px; color: var(--apc-t4); white-space: nowrap; font-variant-numeric: tabular-nums }

@keyframes apc-in { from { opacity: 0; filter: blur(3px); transform: translateY(6px) } }
@keyframes apc-pop { from { opacity: 0; transform: scale(.5) } 60% { transform: scale(1.12) } }
@keyframes apc-draw { from { stroke-dashoffset: 1 } }
@keyframes apc-spin { to { transform: rotate(360deg) } }

@container (max-width: 400px) {
  .apc-buttons { width: 100%; margin-left: 0 }
  .apc-buttons .apc-btn { flex: 1 }
  .apc-kbd { display: none }
}
@container (max-width: 340px) {
  .apc-risk-word, .apc-done-meta { display: none }
  .apc-row { grid-template-columns: 64px minmax(0, 1fr) }
}
@media (hover: none) { .apc-kbd { display: none } }
@media (pointer: coarse) { .apc-btn { height: 40px } .apc-box { width: 20px; height: 20px } .apc-check input { width: 20px } }
@media (prefers-reduced-motion: reduce) {
  .apc *, .apc *::before, .apc *::after { animation: none !important; transition: none !important }
  .apc .apc-spinner { animation: apc-spin 2.4s linear infinite !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const ShieldIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path d="M8 1.9 3 3.7v3.9c0 3 2 5 5 6.5 3-1.5 5-3.5 5-6.5V3.7L8 1.9Z" />
    <path d="m5.9 8 1.5 1.5 2.8-3" />
  </svg>
)

const noopSubscribe = () => () => {}
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform)

/** Animates the height of whatever it wraps (height: auto can't be transitioned). */
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
    <div className="apc-grow" style={height !== null ? { height } : undefined}>
      <div ref={inner} style={{ display: "flow-root" }}>
        {children}
      </div>
    </div>
  )
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
const RISK_LABEL: Record<ApprovalRisk, string> = { low: "Low", medium: "Medium", high: "High" }

/* -------------------------------------------------------------------------- */
/*                                ApprovalCard                                */
/* -------------------------------------------------------------------------- */

export function ApprovalCard(props: ApprovalCardProps) {
  const bare = props.title === undefined
  const {
    title = "Issue refund",
    description = bare ? "Order #4821 · Northwind Trading" : undefined,
    risk = bare ? "medium" : undefined,
    icon,
    details = bare
      ? [
          { label: "Customer", value: "Ada Okafor" },
          { label: "Amount", value: "€148.00 to the original card" },
          { label: "Reason", value: "Item arrived damaged" },
        ]
      : undefined,
    preview,
    children,
    status: statusProp,
    defaultStatus = "pending",
    onApprove,
    onDeny,
    onEdit,
    expiresIn,
    onExpire,
    allowAlways = true,
    alwaysLabel = "Always allow this action",
    approveLabel = "Approve",
    denyLabel = "Deny",
    editLabel = "Edit",
    shortcuts = true,
    label,
    actions = "card",
    className,
  } = props

  const id = React.useId()
  const mac = React.useSyncExternalStore(noopSubscribe, isMac, () => true)
  const controlled = statusProp !== undefined
  const [inner, setInner] = React.useState<ApprovalStatus>(defaultStatus)
  const status = statusProp ?? inner

  const [phase, setPhase] = React.useState<"pending" | "leaving" | "resolved">(status === "pending" ? "pending" : "resolved")
  const [run, setRun] = React.useState(0)
  const [always, setAlways] = React.useState(false)
  const [left, setLeft] = React.useState(expiresIn ?? 0)
  const [busy, setBusy] = React.useState(false)
  const [decidedAt, setDecidedAt] = React.useState<string | null>(null)
  const [paused, setPaused] = React.useState(false)

  // Follow the status: leave the pending layer on a decision, start fresh when it goes back to pending.
  if (status === "pending" && phase !== "pending") {
    setPhase("pending")
    setRun((r) => r + 1)
    setAlways(false)
    setLeft(expiresIn ?? 0)
    setBusy(false)
    setDecidedAt(null)
  } else if (status !== "pending" && phase === "pending") {
    setPhase("leaving")
  }
  React.useEffect(() => {
    if (phase !== "leaving") return
    const t = window.setTimeout(() => setPhase("resolved"), 240)
    return () => window.clearTimeout(t)
  }, [phase])

  const rootRef = React.useRef<HTMLDivElement>(null)
  const doneRef = React.useRef<HTMLDivElement>(null)
  const hadFocus = React.useRef(false)
  React.useEffect(() => {
    if (phase === "resolved" && hadFocus.current) {
      hadFocus.current = false
      doneRef.current?.focus()
    }
  }, [phase])

  const settle = (next: "approved" | "denied") => {
    hadFocus.current = rootRef.current?.contains(document.activeElement) ?? false
    setDecidedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))
    if (!controlled) setInner(next)
  }
  const approve = async () => {
    if (phase !== "pending" || busy) return
    const out = onApprove?.({ always })
    if (out && typeof (out as Promise<unknown>).then === "function") {
      setBusy(true)
      try {
        await out
      } catch {
        setBusy(false)
        return
      }
      setBusy(false)
    }
    settle("approved")
  }
  const deny = (reason: "user" | "timeout") => {
    if (phase !== "pending" || busy) return
    onDeny?.({ reason })
    settle("denied")
  }

  // Countdown: ticks once a second, pauses while hovered or focused.
  const expire = () => {
    onExpire?.()
    deny("timeout")
  }
  const expireRef = React.useRef(expire)
  React.useEffect(() => {
    expireRef.current = expire
  })
  const counting = expiresIn !== undefined && phase === "pending" && !paused && !busy && left > 0
  React.useEffect(() => {
    if (!counting) return
    const t = window.setTimeout(() => {
      setLeft(left - 1)
      if (left <= 1) expireRef.current()
    }, 1000)
    return () => window.clearTimeout(t)
  }, [counting, left])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (phase !== "pending" || e.defaultPrevented) return
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void approve()
    } else if (e.key === "Escape") {
      e.preventDefault()
      deny("user")
    }
  }

  const tray = !!label || actions === "tray"
  const custom = preview ?? children
  const hasPreview = !!custom || !!details?.length
  const hasClock = expiresIn !== undefined
  const urgent = left <= 10
  const showAlways = allowAlways

  const clock = hasClock ? (
    <span className="apc-clock" id={`${id}-clock`} data-urgent={urgent || undefined} data-paused={(paused && left > 0) || undefined} aria-hidden>
      Expires in {mmss(left)}
    </span>
  ) : null
  const clockSr = hasClock ? (
    <span className="apc-sr" id={`${id}-clock-sr`}>
      Expires in {expiresIn} seconds unless approved or denied
    </span>
  ) : null

  const buttons = (
    <div className="apc-buttons">
      {onEdit && (
        <button type="button" className="apc-btn apc-edit" aria-disabled={busy} onClick={() => !busy && onEdit()}>
          {editLabel}
        </button>
      )}
      <button
        type="button"
        className="apc-btn apc-deny"
        aria-disabled={busy}
        aria-keyshortcuts="Escape"
        onClick={() => deny("user")}
      >
        {denyLabel}
        {shortcuts && (
          <kbd className="apc-kbd" aria-hidden>
            Esc
          </kbd>
        )}
      </button>
      <button
        type="button"
        className="apc-btn apc-approve"
        aria-disabled={busy}
        aria-keyshortcuts={mac ? "Meta+Enter" : "Control+Enter"}
        onClick={() => void approve()}
      >
        {approveLabel}
        {busy ? (
          <svg className="apc-spinner" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="6" />
            <path d="M8 2a6 6 0 0 1 6 6" />
          </svg>
        ) : (
          shortcuts && (
            <kbd className="apc-kbd" aria-hidden>
              {mac ? "⌘↵" : "Ctrl↵"}
            </kbd>
          )
        )}
      </button>
    </div>
  )

  const checkbox = showAlways ? (
    <label className="apc-check">
      <input type="checkbox" checked={always} disabled={busy} onChange={(e) => setAlways(e.target.checked)} />
      <span className="apc-box" aria-hidden>
        <svg viewBox="0 0 12 12">
          <path d="m2.8 6.3 2 2 4.4-4.6" />
        </svg>
      </span>
      {alwaysLabel}
    </label>
  ) : null

  const announce = phase === "pending" ? "" : `${status === "approved" ? "Approved" : "Denied"}: ${title}`

  return (
    <div
      ref={rootRef}
      className={cn("apc", className)}
      data-busy={busy || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <style href="approval-card" precedence="default">
        {CSS}
      </style>
      <span className="apc-sr" role="status" aria-live="polite">
        {announce}
      </span>

      <div className="apc-shell" data-tray={tray || undefined} onKeyDown={onKeyDown}>
        <AutoHeight>
          {phase !== "resolved" ? (
            <div className="apc-layer" data-leaving={phase === "leaving" || undefined} key={run}>
              {label && <div className="apc-label">{label}</div>}
              <div
                className="apc-card"
                role="group"
                aria-labelledby={`${id}-title`}
                aria-describedby={[description ? `${id}-desc` : null, hasClock ? `${id}-clock-sr` : null].filter(Boolean).join(" ") || undefined}
                aria-busy={busy}
              >
                <div className="apc-head">
                  <span className="apc-tile" aria-hidden>
                    {icon ?? <ShieldIcon />}
                  </span>
                  <div className="apc-titles">
                    <h3 className="apc-title" id={`${id}-title`}>
                      {title}
                    </h3>
                    {description && (
                      <p className="apc-desc" id={`${id}-desc`}>
                        {description}
                      </p>
                    )}
                  </div>
                  {risk && (
                    <span className="apc-risk" data-risk={risk}>
                      {RISK_LABEL[risk]}
                      <span className="apc-risk-word">&nbsp;risk</span>
                    </span>
                  )}
                </div>

                {hasPreview && (
                  <div className="apc-preview">
                    {custom && <div className="apc-custom">{custom}</div>}
                    {details && details.length > 0 && (
                      <dl className="apc-details">
                        {details.map((d, i) => (
                          <div className="apc-row" key={i}>
                            <dt>{d.label}</dt>
                            <dd>{d.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                )}

                {actions === "card" && (
                  <div className="apc-actions-row">
                    {(checkbox || clock) && (
                      <div className="apc-left">
                        {checkbox}
                        {clock}
                      </div>
                    )}
                    {buttons}
                  </div>
                )}
              </div>
              {clockSr}
              {actions === "tray" && (
                <div className="apc-foot">
                  <div className="apc-left">
                    {checkbox}
                    {clock}
                  </div>
                  {buttons}
                </div>
              )}
            </div>
          ) : (
            <div className="apc-done" ref={doneRef} tabIndex={-1} data-status={status}>
              <svg className="apc-done-icon" viewBox="0 0 20 20" aria-hidden>
                <circle cx="10" cy="10" r="9" />
                {status === "approved" ? <path d="m6.4 10.3 2.5 2.5 4.8-5.1" pathLength="1" /> : <path d="m7 7 6 6m0-6-6 6" pathLength="1" />}
              </svg>
              <span className="apc-done-text">
                <span className="apc-done-state">{status === "approved" ? (always ? "Approved, always" : "Approved") : "Denied"}</span>
                <span className="apc-done-title">{title}</span>
              </span>
              {decidedAt && <span className="apc-done-meta">{decidedAt}</span>}
            </div>
          )}
        </AutoHeight>
      </div>
    </div>
  )
}

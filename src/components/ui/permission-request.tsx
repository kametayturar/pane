"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PermissionScope = "once" | "timed" | "always"
export type PermissionRisk = "safe" | "risky" | "destructive"

export type PermissionDecision = {
  allow: boolean
  scope: PermissionScope
  /** When it was decided, ms since epoch. */
  at: number
  /** When a timed grant ends, ms since epoch. */
  until?: number
}

export type PermissionPreviewItem = {
  id: string
  label: string
  /** Right-aligned detail, e.g. "+12 −4". */
  meta?: string
  icon?: React.ReactNode
}

export type PermissionRequestProps = {
  /** Who asks – the avatar is a small mark, e.g. the model maker's logo; defaults to initials. */
  agent?: { name: string; model?: string; avatar?: React.ReactNode }
  /** What it wants to do, read after "wants to", e.g. "push to main". */
  action?: string
  /** Where, e.g. "acme/web" or "Stripe · live mode" – shown under the title with `toolIcon`. */
  target?: string
  /** The tool's mark next to the target. */
  toolIcon?: React.ReactNode
  /** Risky and destructive carry a tag; destructive also turns Allow red and leaves out Always. */
  risk?: PermissionRisk
  /** The agent's own words on why it needs this. */
  reason?: string
  /** Exactly what will happen – files, recipients, amounts. */
  preview?: PermissionPreviewItem[]
  /** Heading of the preview. */
  previewTitle?: string
  /** Rows shown before "N more". */
  previewLimit?: number
  /** The choices of how long; one choice hides the switch. */
  scopes?: PermissionScope[]
  /** Controlled choice of how long. */
  scope?: PermissionScope
  defaultScope?: PermissionScope
  onScopeChange?: (scope: PermissionScope) => void
  /** Minutes a timed grant holds. */
  duration?: number
  /** Controlled decision – `null` while it waits. */
  decision?: PermissionDecision | null
  defaultDecision?: PermissionDecision | null
  /** Allow, Deny – and `null` for Revoke, Change or Ask again. */
  onDecisionChange?: (decision: PermissionDecision | null) => void
  /** The clock for the time left (ms since epoch). Without it the card ticks every second while a timed grant runs. */
  now?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pr {
  --pr-ink: #000;
  --pr-surface: #fff;
  --pr-accent: #0060e2;
  --pr-amber: #a85a00;
  --pr-danger: #d92d20;
  --pr-t1: color-mix(in oklab, var(--pr-ink) 88%, transparent);
  --pr-t2: color-mix(in oklab, var(--pr-ink) 61%, transparent);
  --pr-t3: color-mix(in oklab, var(--pr-ink) 45%, transparent);
  --pr-t4: color-mix(in oklab, var(--pr-ink) 27%, transparent);
  --pr-fill: color-mix(in oklab, var(--pr-ink) 4%, transparent);
  --pr-fill2: color-mix(in oklab, var(--pr-ink) 7%, transparent);
  --pr-line: color-mix(in oklab, var(--pr-ink) 6%, transparent);
  --pr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --pr-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 400px;
  font-family: var(--pr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; color: var(--pr-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .pr {
  --pr-ink: #fff;
  --pr-surface: #1c1c1e;
  --pr-accent: #4d8dff;
  --pr-amber: #f5a524;
  --pr-danger: #ff6b60;
  --pr-t1: color-mix(in oklab, var(--pr-ink) 90%, transparent);
  --pr-t2: color-mix(in oklab, var(--pr-ink) 62%, transparent);
  --pr-t3: color-mix(in oklab, var(--pr-ink) 46%, transparent);
  --pr-t4: color-mix(in oklab, var(--pr-ink) 28%, transparent);
  --pr-fill: color-mix(in oklab, var(--pr-ink) 6%, transparent);
  --pr-fill2: color-mix(in oklab, var(--pr-ink) 10%, transparent);
  --pr-line: color-mix(in oklab, var(--pr-ink) 8%, transparent);
  --pr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.pr *, .pr *::before, .pr *::after { box-sizing: border-box }
:where(.pr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.pr :focus-visible { outline: 2px solid color-mix(in oklab, var(--pr-accent) 60%, transparent); outline-offset: 1px }
.pr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.pr-shell { border-radius: 12px; background: var(--pr-surface); box-shadow: var(--pr-shadow); overflow: hidden }
.pr-grow { transition: height .42s var(--pr-ease) }
.pr-layer { display: flow-root }
.pr-layer[data-leaving] { opacity: 0; filter: blur(3px); pointer-events: none; transition: opacity .22s, filter .22s }
.pr-card { padding: 14px; animation: pr-in .4s var(--pr-ease) backwards }

/* Header */
.pr-head { display: flex; align-items: flex-start; gap: 10px }
.pr-avatar {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; overflow: hidden; border-radius: 50%; background: var(--pr-fill2);
  box-shadow: inset 0 0 0 .5px var(--pr-line); font-size: 11px; font-weight: 600; line-height: 1; color: var(--pr-t2);
}
.pr-avatar > svg, .pr-avatar > img { width: 16px; height: 16px }
.pr-titles { flex: 1; min-width: 0 }
.pr-title { margin: 0; font-size: 13px; font-weight: 400; line-height: 20px; color: var(--pr-t2); overflow-wrap: anywhere }
.pr-title b { font-weight: 600; color: var(--pr-ink) }
.pr-target { display: flex; align-items: center; gap: 5px; min-width: 0; font-size: 12px; line-height: 16px; color: var(--pr-t3) }
.pr-target svg { flex: none; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round }
.pr-target span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.pr-tag {
  flex: none; display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 6px; font-size: 11px; font-weight: 500; line-height: 1;
  color: var(--pr-amber); background: color-mix(in oklab, var(--pr-amber) 12%, transparent);
}
.pr-tag[data-risk="destructive"] { color: var(--pr-danger); background: color-mix(in oklab, var(--pr-danger) 11%, transparent) }

.pr-reason { margin: 10px 0 0 38px; padding: 1px 0 1px 10px; border-left: 2px solid var(--pr-line); color: var(--pr-t2) }

/* Preview */
.pr-preview { margin-top: 14px }
.pr-preview-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12px; font-weight: 500; line-height: 16px; color: var(--pr-t3) }
.pr-count { min-width: 16px; padding: 0 5px; border-radius: 8px; background: var(--pr-fill2); text-align: center; font-size: 11px; line-height: 16px; font-variant-numeric: tabular-nums }
.pr-list { margin: 0; padding: 2px 10px; list-style: none; border-radius: 8px; background: var(--pr-fill); box-shadow: inset 0 0 0 .5px var(--pr-line) }
.pr-item { display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 12px; line-height: 16px; animation: pr-rise .46s var(--pr-ease) backwards }
.pr-item + .pr-item { border-top: .5px solid var(--pr-line) }
.pr-item-icon { display: grid; place-items: center; flex: none; width: 14px; height: 14px; color: var(--pr-t3) }
.pr-item-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round }
.pr-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, "SF Mono", Menlo, monospace; color: var(--pr-t1) }
.pr-item-meta { flex: none; font-family: ui-monospace, "SF Mono", Menlo, monospace; color: var(--pr-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.pr .pr-more { margin: 4px 0 0 -4px; padding: 2px 6px; border-radius: 6px; font-size: 12px; font-weight: 500; line-height: 16px; color: var(--pr-t2); transition: color .16s, background-color .16s }
.pr .pr-more:hover { color: var(--pr-ink); background: var(--pr-fill) }

/* Scope switch */
.pr-switch { position: relative; display: flex; margin-top: 14px; padding: 2px; border-radius: 8px; background: var(--pr-fill2) }
.pr-thumb {
  position: absolute; top: 2px; bottom: 2px; left: 2px; width: calc((100% - 4px) / var(--n)); border-radius: 6px; background: var(--pr-surface); box-shadow: var(--pr-shadow);
  transform: translateX(calc(var(--i) * 100%)); transition: transform .32s var(--pr-ease);
}
.pr-radio { position: relative; z-index: 1; flex: 1; height: 28px; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--pr-t3); transition: color .16s }
.pr-radio:hover { color: var(--pr-t1) }
.pr-radio[aria-checked="true"] { color: var(--pr-ink) }

/* Buttons */
.pr-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 14px }
.pr-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 8px; font-weight: 500; white-space: nowrap;
  transition: background-color .16s, color .16s, transform .16s var(--pr-ease);
}
.pr-btn:active { transform: scale(.97) }
.pr-deny { color: var(--pr-t2) }
.pr-deny:hover { background: var(--pr-fill2); color: var(--pr-ink) }
.pr-allow { background: var(--pr-ink); color: var(--pr-surface); padding: 0 10px 0 14px }
.pr-allow:hover { background: color-mix(in oklab, var(--pr-ink) 84%, var(--pr-surface)) }
.pr[data-risk="destructive"] .pr-allow { background: var(--pr-danger); color: #fff }
.pr[data-risk="destructive"] .pr-allow:hover { background: color-mix(in oklab, var(--pr-danger) 88%, #000) }
.pr-kbd {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 4px; font-size: 11px; line-height: 1;
  font-family: ui-monospace, "SF Mono", Menlo, monospace; font-weight: 500; background: var(--pr-fill2); color: var(--pr-t3);
}
.pr-allow .pr-kbd { background: rgb(255 255 255 / .2); color: rgb(255 255 255 / .75) }
:is(.dark, [data-theme="dark"]) .pr:not([data-risk="destructive"]) .pr-allow .pr-kbd { background: rgb(0 0 0 / .14); color: rgb(0 0 0 / .55) }

/* Blur crossfade for the Allow label */
.pr-swap { display: inline-grid; vertical-align: top }
.pr-swap > * { grid-area: 1 / 1; white-space: nowrap }
.pr-swap-in { animation: pr-swap-in .34s var(--pr-ease) backwards }
.pr-swap-out { animation: pr-swap-out .34s var(--pr-ease) forwards; pointer-events: none }

/* Decided line */
.pr-done { position: relative; display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 8px 8px 8px 14px; outline: none; animation: pr-in .36s var(--pr-ease) backwards }
.pr-done-icon { flex: none; width: 20px; height: 20px; animation: pr-pop .46s var(--pr-ease) backwards }
.pr-done-icon circle { fill: color-mix(in oklab, var(--pr-accent) 76.5%, transparent) }
.pr-done[data-allow="false"] .pr-done-icon circle { fill: color-mix(in oklab, var(--pr-ink) 38%, transparent) }
.pr-done[data-ended] .pr-done-icon circle { fill: color-mix(in oklab, var(--pr-ink) 24%, transparent) }
.pr-done-icon path { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; animation: pr-draw .36s var(--pr-ease) .16s backwards }
.pr-done-text { display: flex; align-items: baseline; flex: 1; gap: 8px; min-width: 0 }
.pr-done-state { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--pr-ink) }
.pr-done-left { flex: none; font-size: 12px; line-height: 16px; color: var(--pr-t3); white-space: nowrap; font-variant-numeric: tabular-nums }
.pr .pr-undo { flex: none; height: 28px; padding: 0 10px; border-radius: 6px; font-weight: 500; color: var(--pr-t2); transition: background-color .16s, color .16s }
.pr .pr-undo:hover { background: var(--pr-fill2); color: var(--pr-ink) }
.pr-bar { position: absolute; left: 14px; right: 14px; bottom: 0; height: 2px; overflow: hidden; border-radius: 1px; background: var(--pr-line) }
.pr-bar i { display: block; height: 100%; background: color-mix(in oklab, var(--pr-accent) 76.5%, transparent); transform-origin: left; transform: scaleX(var(--f)); transition: transform 1s linear }

@keyframes pr-in { from { opacity: 0; filter: blur(3px); transform: translateY(6px) } }
@keyframes pr-rise { from { opacity: 0; transform: translateY(6px) } }
@keyframes pr-pop { from { opacity: 0; transform: scale(.5) } 60% { transform: scale(1.12) } }
@keyframes pr-draw { from { stroke-dashoffset: 1 } }
@keyframes pr-swap-in { from { opacity: 0; filter: blur(6px); transform: scale(.98) } }
@keyframes pr-swap-out { to { opacity: 0; filter: blur(6px); transform: scale(1.02) } }

@container (max-width: 340px) {
  .pr-reason { margin-left: 0 }
  .pr-actions .pr-btn { flex: 1 }
  .pr-kbd { display: none }
}
@media (hover: none) { .pr-kbd { display: none } }
@media (pointer: coarse) { .pr-radio { height: 36px } .pr-btn { height: 40px } .pr-item { min-height: 36px } }
@media (prefers-reduced-motion: reduce) {
  .pr *, .pr *::before, .pr *::after { animation: none !important; transition: none !important }
  .pr-swap-out { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const ALL_SCOPES: PermissionScope[] = ["once", "timed", "always"]

const FileIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path d="M4 2h5l3 3v8.2a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8V2Z" />
    <path d="M9 2v3h3" />
  </svg>
)

function durationLabel(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  if (m === 0) return h === 1 ? "1 hour" : `${h} hours`
  return `${h}h ${m}m`
}

function timeLeft(ms: number) {
  const s = Math.ceil(ms / 1000)
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m left`
  if (s >= 60) return `${Math.ceil(s / 60)} min left`
  return `${s}s left`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

/** Blur crossfade for text that changes in place. */
function Swap({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 340)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="pr-swap">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="pr-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} className={cn(leaving !== null && "pr-swap-in")}>
        {shown}
      </span>
    </span>
  )
}

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
    <div className="pr-grow" style={height !== null ? { height } : undefined}>
      <div ref={inner} style={{ display: "flow-root" }}>
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              PermissionRequest                             */
/* -------------------------------------------------------------------------- */

const DEMO_PREVIEW: PermissionPreviewItem[] = [
  { id: "a", label: "docs/changelog.md", meta: "+18 −2" },
  { id: "b", label: "docs/guides/webhooks.md", meta: "+44 −9" },
  { id: "c", label: "docs/api/events.md", meta: "+6 −0" },
]

export function PermissionRequest(props: PermissionRequestProps) {
  const bare = props.agent === undefined && props.action === undefined
  const {
    agent = { name: "Scribe" },
    action = "publish the release notes",
    target = bare ? "docs.northwind.app" : undefined,
    toolIcon,
    risk = "risky",
    reason = bare ? "The 2.4 notes were approved in review and the changelog is ready to go live." : undefined,
    preview = bare ? DEMO_PREVIEW : undefined,
    previewTitle = "What will happen",
    previewLimit = 3,
    scopes = ALL_SCOPES,
    scope: scopeProp,
    defaultScope = "once",
    onScopeChange,
    duration = 60,
    decision: decisionProp,
    defaultDecision = null,
    onDecisionChange,
    now: nowProp,
    className,
  } = props

  const id = React.useId()

  /* How long: destructive requests never offer "always". */
  const offered = scopes.filter((s) => (risk === "destructive" ? s !== "always" : true))
  const choices = offered.length ? offered : (["once"] as PermissionScope[])
  const [innerScope, setInnerScope] = React.useState(defaultScope)
  const rawScope = scopeProp ?? innerScope
  const scope = choices.includes(rawScope) ? rawScope : choices[0]
  const pickScope = (s: PermissionScope) => {
    if (scopeProp === undefined) setInnerScope(s)
    onScopeChange?.(s)
  }
  const scopeText = (s: PermissionScope) => (s === "once" ? "Just once" : s === "always" ? "Always" : durationLabel(duration))
  const allowText = scope === "once" ? "Allow once" : scope === "always" ? "Allow always" : `Allow for ${durationLabel(duration)}`

  /* Decision */
  const controlled = decisionProp !== undefined
  const [innerDecision, setInnerDecision] = React.useState<PermissionDecision | null>(defaultDecision)
  const decision = controlled ? decisionProp : innerDecision
  const decide = (d: PermissionDecision | null) => {
    hadFocus.current = rootRef.current?.contains(document.activeElement) ?? false
    if (!controlled) setInnerDecision(d)
    onDecisionChange?.(d)
  }

  const [phase, setPhase] = React.useState<"pending" | "leaving" | "resolved">(decision ? "resolved" : "pending")
  const [run, setRun] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)
  if (!decision && phase !== "pending") {
    setPhase("pending")
    setRun((r) => r + 1)
    setExpanded(false)
  } else if (decision && phase === "pending") {
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

  const allow = () => decide({ allow: true, scope, at: Date.now(), until: scope === "timed" ? Date.now() + duration * 60_000 : undefined })
  const deny = () => decide({ allow: false, scope, at: Date.now() })

  /* Clock for the time left of a timed grant. */
  const timed = !!decision?.allow && decision.until !== undefined
  const [tick, setTick] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (!timed || nowProp !== undefined) return
    const first = window.setTimeout(() => setTick(Date.now()), 0)
    const iv = window.setInterval(() => setTick(Date.now()), 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(iv)
    }
  }, [timed, nowProp])
  const clock = nowProp ?? tick ?? decision?.at ?? 0
  const until = decision?.until
  const remaining = until !== undefined ? until - clock : undefined
  const ended = remaining !== undefined && remaining <= 0
  const fraction = until !== undefined && decision ? Math.max(0, Math.min(1, (until - clock) / Math.max(1, until - decision.at))) : 0

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (phase !== "pending" || e.defaultPrevented) return
    if (e.key === "Escape") {
      e.preventDefault()
      deny()
    } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !(e.target as HTMLElement).closest("[data-keep-enter]")) {
      e.preventDefault()
      allow()
    }
  }
  const onRadioKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return
    e.preventDefault()
    const dir = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1
    const i = (choices.indexOf(scope) + dir + choices.length) % choices.length
    pickScope(choices[i])
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[i]?.focus()
  }

  const shown = preview?.slice(0, expanded ? undefined : previewLimit) ?? []
  const hidden = (preview?.length ?? 0) - shown.length

  let state = ""
  if (decision) {
    if (!decision.allow) state = "Denied"
    else if (ended) state = "Grant ended"
    else if (decision.scope === "timed") state = `Allowed for ${durationLabel(duration)}`
    else if (decision.scope === "always") state = "Always allowed"
    else state = "Allowed once"
  }
  const announce = phase === "pending" ? "" : state

  return (
    <div ref={rootRef} className={cn("pr", className)} data-risk={risk}>
      <style href="permission-request" precedence="default">
        {CSS}
      </style>
      <span className="pr-sr" role="status" aria-live="polite">
        {announce}
      </span>

      <div className="pr-shell" onKeyDown={onKeyDown}>
        <AutoHeight>
          {phase !== "resolved" || !decision ? (
            <div className="pr-layer" key={run} data-leaving={phase === "leaving" || undefined}>
              <div
                className="pr-card"
                role="dialog"
                aria-modal="false"
                aria-labelledby={`${id}-title`}
                aria-describedby={reason ? `${id}-reason` : undefined}
              >
                <div className="pr-head">
                  <span className="pr-avatar" aria-hidden title={agent.model}>
                    {agent.avatar ?? initials(agent.name)}
                  </span>
                  <div className="pr-titles">
                    <h3 className="pr-title" id={`${id}-title`}>
                      <b>{agent.name}</b> wants to <b>{action}</b>
                    </h3>
                    {(target || agent.model) && (
                      <div className="pr-target">
                        {toolIcon}
                        {target && <span>{target}</span>}
                        {agent.model && <span style={{ color: "var(--pr-t4)" }}>{target ? "· " : ""}{agent.model}</span>}
                      </div>
                    )}
                  </div>
                  {risk !== "safe" && (
                    <span className="pr-tag" data-risk={risk}>
                      {risk === "destructive" ? "Destructive" : "Risky"}
                    </span>
                  )}
                </div>

                {reason && (
                  <p className="pr-reason" id={`${id}-reason`}>
                    {reason}
                  </p>
                )}

                {preview && preview.length > 0 && (
                  <div className="pr-preview">
                    <div className="pr-preview-head">
                      {previewTitle}
                      <span className="pr-count">{preview.length}</span>
                    </div>
                    <ul className="pr-list">
                      {shown.map((item, i) => (
                        <li className="pr-item" key={item.id} style={{ animationDelay: `${i < previewLimit ? 90 + i * 70 : (i - previewLimit) * 50}ms` }}>
                          <span className="pr-item-icon" aria-hidden>
                            {item.icon ?? <FileIcon />}
                          </span>
                          <span className="pr-item-label">{item.label}</span>
                          {item.meta && <span className="pr-item-meta">{item.meta}</span>}
                        </li>
                      ))}
                    </ul>
                    {hidden > 0 && (
                      <button type="button" className="pr-more" data-keep-enter onClick={() => setExpanded(true)}>
                        {hidden} more
                      </button>
                    )}
                  </div>
                )}

                {choices.length > 1 && (
                  <div
                    className="pr-switch"
                    role="radiogroup"
                    aria-label="How long"
                    style={{ "--n": choices.length, "--i": choices.indexOf(scope) } as React.CSSProperties}
                    onKeyDown={onRadioKey}
                  >
                    <span className="pr-thumb" aria-hidden />
                    {choices.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        className="pr-radio"
                        aria-checked={scope === s}
                        tabIndex={scope === s ? 0 : -1}
                        onClick={() => pickScope(s)}
                      >
                        {scopeText(s)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pr-actions">
                  <button type="button" className="pr-btn pr-deny" data-keep-enter aria-keyshortcuts="Escape" onClick={deny}>
                    Deny
                    <kbd className="pr-kbd" aria-hidden>
                      Esc
                    </kbd>
                  </button>
                  <button type="button" className="pr-btn pr-allow" data-keep-enter aria-label={allowText} aria-keyshortcuts="Enter" onClick={allow}>
                    <Swap text={allowText} />
                    <kbd className="pr-kbd" aria-hidden>
                      ↵
                    </kbd>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pr-done" ref={doneRef} tabIndex={-1} data-allow={decision.allow} data-ended={ended || undefined}>
              <svg className="pr-done-icon" viewBox="0 0 20 20" aria-hidden>
                <circle cx="10" cy="10" r="9" />
                {decision.allow ? <path d="m6.4 10.3 2.5 2.5 4.8-5.1" pathLength="1" /> : <path d="m7 7 6 6m0-6-6 6" pathLength="1" />}
              </svg>
              <span className="pr-done-text">
                <span className="pr-done-state">{state}</span>
                {remaining !== undefined && !ended && <span className="pr-done-left">{timeLeft(remaining)}</span>}
              </span>
              <button type="button" className="pr-undo" onClick={() => decide(null)}>
                {!decision.allow ? "Change" : ended ? "Ask again" : "Revoke"}
              </button>
              {timed && !ended && (
                <span className="pr-bar" aria-hidden>
                  <i style={{ "--f": fraction } as React.CSSProperties} />
                </span>
              )}
            </div>
          )}
        </AutoHeight>
      </div>
    </div>
  )
}

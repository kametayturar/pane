"use client"

import * as React from "react"
import { Bug, Check, ChevronDown, CreditCard, Database, GitPullRequest, Hexagon, Diamond, Mail, RotateCcw, Rocket, Shield, ShieldAlert, ShieldCheck, Sparkles, Ticket, Wrench, X, Zap, CornerDownLeft, BookOpen } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ApprovalRisk = "low" | "medium" | "high"
/** Picks the neutral glyph for the tool's mark. */
export type ToolBrand = "deploy" | "mail" | "database" | "tickets" | "code" | "errors" | "payments" | "docs"

export type ApprovalAgent = { id: string; name: string; model: string; provider?: "nova" | "atlas" | "sage" }
/** `id` is the permission rules match on (deploy.release); `action` names it in the rules list (Deploy to production). */
export type ApprovalTool = { id: string; name: string; action: string; brand?: ToolBrand }
export type ApprovalArgument = {
  key: string
  label: string
  value: string
  /** Default true. Values that must not change set it to false. */
  editable?: boolean
  mono?: boolean
  multiline?: boolean
}

export type ApprovalRequest = {
  id: string
  agent: ApprovalAgent
  tool: ApprovalTool
  /** The call in plain words. Wrap code in backticks to set it in the mono face. */
  title: string
  /** A short label for the queue row and the log. */
  summary: string
  /** The agent's one line reason for the call. */
  reason: string
  args: ApprovalArgument[]
  risk: ApprovalRisk
  /** ISO time the agent asked. */
  requestedAt: string
}

export type ApprovalRule = {
  id: string
  /** The tool id the rule covers. */
  tool: string
  /** Shown in the rules list; falls back to the action of a matching request, then the id. */
  label?: string
  /** Glyph for the rules list. */
  brand?: ToolBrand
  scope: "agent" | "workspace"
  agent?: { id: string; name: string }
  createdBy?: string
  createdAt?: string
}

export type ApprovalOutcome = "approved" | "denied" | "allowed"
export type ResolvedEntry = {
  id: string
  agentName: string
  tool: string
  summary: string
  outcome: ApprovalOutcome
  edited?: boolean
  decidedBy: string
  decidedAt: string
}

export type ApprovalDecision = {
  requestId: string
  outcome: ApprovalOutcome
  /** The argument values with edits applied. */
  args: Record<string, string>
  edited: boolean
  ruleId?: string
  decidedBy: string
  decidedAt: string
}

export type AgentApprovalsProps = {
  /** Pending tool calls in queue order; the first one is in focus. Leave unset for the simulated demo. */
  requests?: ApprovalRequest[]
  /** Always-allow rules that already skip the ask. A rule covers a request with the same tool id, and the same agent when its scope is agent. */
  rules?: ApprovalRule[]
  /** Earlier decisions for the log, newest first. */
  resolved?: ResolvedEntry[]
  /** The person deciding. Recorded as decidedBy. */
  reviewer?: string
  /** Workspace name for the workspace-wide Always allow option and the rules list. */
  workspace?: string
  /** Heading of the card. */
  title?: string
  /** Called for every decision, including requests a new rule covered (outcome "allowed"). Return a promise to keep the request in its sending state; a rejection shows the error with Retry and Deny. */
  onDecision?: (decision: ApprovalDecision) => void | Promise<unknown>
  /** Called when Always allow adds a rule or one is removed from the Rules popover. Persist rules here. */
  onRuleChange?: (change: { type: "added" | "removed"; rule: ApprovalRule }) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const T0 = Date.now()
const ago = (min: number) => new Date(T0 - min * 60_000).toISOString()

export const sampleRequests: ApprovalRequest[] = [
  {
    id: "req-release",
    agent: { id: "release", name: "Release agent", model: "Nova Large", provider: "nova" },
    tool: { id: "deploy.release", name: "Release", action: "Deploy to production", brand: "deploy" },
    title: "Run `release ship --env production`",
    summary: "Ship storefront 4.12 to production",
    reason: "All 188 checks passed on the release branch and the freeze window ended at 14:00.",
    args: [
      { key: "service", label: "Service", value: "storefront", mono: true },
      { key: "version", label: "Version", value: "4.12.0 Spring sale banner", mono: true, editable: false },
      { key: "env", label: "Environment", value: "production", mono: true },
      { key: "regions", label: "Regions", value: "eu-west, us-east", mono: true },
    ],
    risk: "high",
    requestedAt: ago(2),
  },
  {
    id: "req-mail",
    agent: { id: "support", name: "Support agent", model: "Sage Mini", provider: "sage" },
    tool: { id: "mail.send", name: "Mail", action: "Send an email", brand: "mail" },
    title: "Send an email with Mail",
    summary: "Email Ruth Alvarez about her refund",
    reason: "She asked twice this week and the refund cleared today.",
    args: [
      { key: "to", label: "To", value: "ruth@fernwood.example", mono: true },
      { key: "subject", label: "Subject", value: "Your refund is on its way" },
      { key: "body", label: "Message", value: "Hi Ruth, your refund of $84.00 cleared today and should reach your card in 3 to 5 days. Reply here if it has not arrived by Friday.", multiline: true },
    ],
    risk: "medium",
    requestedAt: ago(4),
  },
  {
    id: "req-db",
    agent: { id: "data", name: "Data agent", model: "Atlas 2", provider: "atlas" },
    tool: { id: "db.write", name: "Database", action: "Write to the database", brand: "database" },
    title: "`UPDATE` 1,284 rows in the plans table",
    summary: "Move 1,284 legacy plans to Team",
    reason: "The legacy tier ends on 1 November and these accounts have not chosen a plan.",
    args: [
      { key: "table", label: "Table", value: "plans", mono: true, editable: false },
      { key: "set", label: "Set", value: "tier = 'team'", mono: true },
      { key: "where", label: "Where", value: "tier = 'legacy' AND chosen_at IS NULL", mono: true },
    ],
    risk: "high",
    requestedAt: ago(7),
  },
  {
    id: "req-tickets-1",
    agent: { id: "triage", name: "Triage agent", model: "Nova Mini", provider: "nova" },
    tool: { id: "tickets.close", name: "Tickets", action: "Close tickets", brand: "tickets" },
    title: "Close 6 duplicates of WEB-398",
    summary: "Close 6 duplicates of WEB-398",
    reason: "All six describe the same checkout timeout and link to the original.",
    args: [
      { key: "ids", label: "Tickets", value: "WEB-401, WEB-404, WEB-409, WEB-412, WEB-417, WEB-420", mono: true },
      { key: "note", label: "Note", value: "Closed as a duplicate of WEB-398." },
    ],
    risk: "low",
    requestedAt: ago(9),
  },
  {
    id: "req-tickets-2",
    agent: { id: "triage", name: "Triage agent", model: "Nova Mini", provider: "nova" },
    tool: { id: "tickets.close", name: "Tickets", action: "Close tickets", brand: "tickets" },
    title: "Close 3 stale tickets in the backlog",
    summary: "Close 3 stale backlog tickets",
    reason: "Nobody has replied on them in 120 days.",
    args: [{ key: "ids", label: "Tickets", value: "WEB-212, WEB-240, WEB-255", mono: true }],
    risk: "low",
    requestedAt: ago(11),
  },
]

export const sampleRules: ApprovalRule[] = [
  { id: "rule-pr", tool: "code.open-pr", label: "Open pull requests", brand: "code", scope: "agent", agent: { id: "release", name: "Release agent" }, createdBy: "Maya Ortiz", createdAt: ago(4000) },
  { id: "rule-read", tool: "errors.read", label: "Read error reports", brand: "errors", scope: "workspace", createdBy: "Maya Ortiz", createdAt: ago(9000) },
]

export const sampleResolved: ResolvedEntry[] = [
  { id: "res-1", agentName: "Release agent", tool: "code.open-pr", summary: "Open a pull request for the changelog", outcome: "allowed", decidedBy: "Rule", decidedAt: ago(14) },
  { id: "res-2", agentName: "Support agent", tool: "mail.send", summary: "Email Tomas Berg about the invoice", outcome: "approved", edited: true, decidedBy: "Maya Ortiz", decidedAt: ago(26) },
  { id: "res-3", agentName: "Data agent", tool: "db.write", summary: "Delete 40 test accounts", outcome: "denied", decidedBy: "Maya Ortiz", decidedAt: ago(47) },
  { id: "res-4", agentName: "Triage agent", tool: "tickets.close", summary: "Close WEB-380", outcome: "approved", decidedBy: "Maya Ortiz", decidedAt: ago(70) },
  { id: "res-5", agentName: "Release agent", tool: "deploy.release", summary: "Ship docs 2.9 to staging", outcome: "approved", decidedBy: "Maya Ortiz", decidedAt: ago(130) },
  { id: "res-6", agentName: "Support agent", tool: "mail.send", summary: "Email the Tideway team about renewal", outcome: "approved", decidedBy: "Maya Ortiz", decidedAt: ago(200) },
]

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const clock = () => Date.now()

function relative(iso: string, now: number) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (m < 1) return "just now"
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.round(h / 24)} d ago`
}

const RISK_WORD: Record<ApprovalRisk, string> = { low: "Low", medium: "Medium", high: "High" }

function RiskGlyph({ risk, size = 15 }: { risk: ApprovalRisk; size?: number }) {
  const p = { size, strokeWidth: 1.7, "aria-hidden": true } as const
  if (risk === "high") return <ShieldAlert className="aap-high" {...p} />
  if (risk === "medium") return <Shield className="aap-med" {...p} />
  return <ShieldCheck className="aap-low" {...p} />
}

function ToolMark({ brand, size = 15 }: { brand?: ToolBrand; size?: number }) {
  const p = { size, strokeWidth: 1.7, "aria-hidden": true } as const
  switch (brand) {
    case "deploy":
      return <Rocket {...p} />
    case "mail":
      return <Mail {...p} />
    case "database":
      return <Database {...p} />
    case "tickets":
      return <Ticket {...p} />
    case "code":
      return <GitPullRequest {...p} />
    case "errors":
      return <Bug {...p} />
    case "payments":
      return <CreditCard {...p} />
    case "docs":
      return <BookOpen {...p} />
    default:
      return <Wrench {...p} />
  }
}

function AgentMark({ provider, size = 15 }: { provider?: ApprovalAgent["provider"]; size?: number }) {
  const p = { size, strokeWidth: 1.7, "aria-hidden": true } as const
  if (provider === "atlas") return <Hexagon {...p} />
  if (provider === "sage") return <Diamond {...p} />
  return <Sparkles {...p} />
}

/** Text with `code` spans set in the mono face. */
function RichTitle({ text }: { text: string }) {
  const parts = text.split("`")
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <code key={i} className="aap-code">{p}</code> : p ? <span key={i}>{p}</span> : null))}
    </>
  )
}

function Swap({ text, shimmer }: { text: string; shimmer?: boolean }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 220)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="aap-swap">
      {leaving !== null && (
        <span key={`o-${leaving}`} className="aap-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`i-${shown}`} className={"aap-swap-in" + (shimmer ? " aap-shimmer" : "")} data-text={shown} data-fresh={leaving !== null || undefined}>
        {shown}
      </span>
    </span>
  )
}

/** A number that rolls up or down when it changes; still on first paint. */
function Roll({ value }: { value: number }) {
  const [shown, setShown] = React.useState(value)
  const [dir, setDir] = React.useState<"up" | "down" | null>(null)
  if (value !== shown) {
    setDir(value > shown ? "up" : "down")
    setShown(value)
  }
  return (
    <span className="aap-roll-box" aria-hidden>
      <span key={shown} className="aap-roll" data-dir={dir ?? undefined} data-fresh={dir ? "" : undefined}>
        {shown}
      </span>
    </span>
  )
}

type FlightInfo = { id: number; label: string; from: DOMRect; to: DOMRect; root: DOMRect }

/** The chip that flies from the Always allow button up into the Rules button. */
function Flight({ flight, onDone }: { flight: FlightInfo; onDone: () => void }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const done = React.useRef(onDone)
  React.useEffect(() => {
    done.current = onDone
  })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const dx0 = flight.from.right - flight.root.left - el.offsetWidth - 8
    const dy0 = flight.from.top - flight.root.top
    const dx1 = flight.to.left - flight.root.left + 4
    const dy1 = flight.to.top - flight.root.top + 5
    const a = el.animate(
      [
        { transform: `translate(${dx0}px, ${dy0}px) scale(.9)`, opacity: 0 },
        { transform: `translate(${dx0}px, ${dy0 - 10}px) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${dx1}px, ${dy1}px) scale(.7)`, opacity: 0.2 },
      ],
      { duration: 620, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" },
    )
    a.onfinish = () => done.current()
    return () => a.cancel()
  }, [flight])
  return (
    <span ref={ref} className="aap-flight" aria-hidden>
      <ShieldCheck size={13} strokeWidth={1.8} />
      {flight.label}
    </span>
  )
}

/** Animates its height to follow its content (CSS can't transition to `auto`). */
function AutoHeight({ children }: { children: React.ReactNode }) {
  const outer = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const ro = new ResizeObserver(() => {
      o.style.height = `${i.offsetHeight}px`
    })
    ro.observe(i)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={outer} className="aap-auto">
      <div ref={inner} className="aap-auto-in">
        {children}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.aap {
  --aap-ink: oklch(.15 0 0);
  --aap-surface: #fff;
  --aap-accent: #0060e2;
  --aap-t1: oklch(.15 0 0);
  --aap-t2: oklch(.46 0 0);
  --aap-t3: oklch(.59 0 0);
  --aap-line: oklch(.935 0 0);
  --aap-hair: oklch(.965 0 0);
  --aap-fill: oklch(.978 0 0);
  --aap-ok: oklch(.49 .19 150);
  --aap-warn: oklch(.6 .15 68);
  --aap-bad: oklch(.54 .21 25);
  --aap-btn: oklch(.33 0 0);
  --aap-btn-fg: #fff;
  --aap-glint: 255 255 255;
  --aap-pop: 0 0 0 1px oklch(0 0 0 / .06), 0 8px 24px -6px oklch(0 0 0 / .18), 0 2px 6px oklch(0 0 0 / .05);
  --aap-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; container-name: aap; width: 100%; max-width: 640px; margin-inline: auto;
  background: var(--aap-surface); border: 1px solid var(--aap-line); border-radius: 24px; color: var(--aap-t1);
  font-family: var(--aap-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 19.6px; letter-spacing: -.01em; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .aap {
  --aap-ink: oklch(.96 0 0);
  --aap-surface: oklch(.2 0 0);
  --aap-accent: #4d8dff;
  --aap-t1: oklch(.96 0 0);
  --aap-t2: oklch(.76 0 0);
  --aap-t3: oklch(.62 0 0);
  --aap-line: oklch(1 0 0 / .1);
  --aap-hair: oklch(1 0 0 / .07);
  --aap-fill: oklch(1 0 0 / .05);
  --aap-ok: oklch(.78 .17 150);
  --aap-warn: oklch(.8 .15 75);
  --aap-bad: oklch(.72 .19 25);
  --aap-btn: oklch(.95 0 0);
  --aap-btn-fg: oklch(.2 0 0);
  --aap-pop: 0 0 0 1px oklch(1 0 0 / .1), 0 12px 28px -6px oklch(0 0 0 / .6);
}
.aap *, .aap *::before, .aap *::after { box-sizing: border-box }
:where(.aap) :is(p, ol, ul, li, h2, h3, dl, dd, dt) { margin: 0; padding: 0 }
:where(.aap) :is(ol, ul) { list-style: none }
:where(.aap) button { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.aap :focus-visible { outline: 2px solid color-mix(in oklab, var(--aap-accent) 60%, transparent); outline-offset: 1px }
.aap button:focus:not(:focus-visible), .aap [tabindex="-1"]:focus { outline: none }
.aap-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.aap-high { color: var(--aap-bad) } .aap-med { color: var(--aap-warn) } .aap-low { color: var(--aap-ok) } .aap-ok { color: var(--aap-ok) }

.aap-header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 20px }
.aap-title { font-size: 16px; font-weight: 500; line-height: 17.6px; letter-spacing: -.01em }
.aap-count { display: inline-flex; align-items: center; gap: 4px; color: var(--aap-t3); font-variant-numeric: tabular-nums }
.aap-roll-box { display: inline-flex; overflow: hidden; height: 20px; border-radius: 4px }
.aap-roll[data-fresh] { animation: aap-up .3s var(--aap-ease) backwards }
.aap-roll[data-dir="down"][data-fresh] { animation-name: aap-down }
@keyframes aap-up { from { transform: translateY(70%); opacity: 0 } }
@keyframes aap-down { from { transform: translateY(-70%); opacity: 0 } }
.aap-rules-btn { position: relative; margin-left: auto; display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 9999px; color: var(--aap-t2); transition: background-color .16s var(--aap-ease), color .16s var(--aap-ease) }
.aap-rules-btn:hover, .aap-rules-btn[aria-expanded="true"] { background: var(--aap-fill); color: var(--aap-t1) }
.aap-wash { position: absolute; inset: 0; border-radius: inherit; background: color-mix(in oklab, var(--aap-accent) 16%, transparent); pointer-events: none; animation: aap-wash 1.1s var(--aap-ease) forwards }
@keyframes aap-wash { 0% { opacity: 1 } 100% { opacity: 0 } }
.aap-dot { color: var(--aap-t3) }

.aap-region { padding: 0 20px 18px; outline: none }
.aap-focus { display: grid; gap: 0; animation: aap-rise .24s var(--aap-ease) backwards }
@keyframes aap-rise { from { opacity: 0; transform: translateY(14px) } }
.aap-auto { overflow: hidden; margin: -4px; transition: height .38s var(--aap-ease) }
.aap-auto-in { padding: 4px }
.aap-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0 }
.aap-agent { display: inline-flex; align-items: center; gap: 7px; color: var(--aap-t3); min-width: 0; white-space: nowrap }
.aap-agent-name { color: var(--aap-t1); overflow: hidden; text-overflow: ellipsis }
.aap-agent svg { flex: none; color: var(--aap-t1) }
.aap-agent-sep { color: var(--aap-t3) }
.aap-risk { display: inline-flex; align-items: center; gap: 5px; color: var(--aap-t2); white-space: nowrap }
.aap-risk svg { flex: none }
.aap-ftitle { display: flex; align-items: flex-start; gap: 10px; margin-top: 14px; font-size: 22px; font-weight: 500; line-height: 24.2px; letter-spacing: -.02em; text-wrap: pretty }
.aap-tool { display: inline-grid; place-items: center; flex: none; align-self: flex-start; margin-top: 2px; width: 20px; height: 20px; color: var(--aap-ink) }
.aap-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .92em; font-weight: 500; letter-spacing: -.02em; overflow-wrap: anywhere }
.aap-reason { margin-top: 6px; color: var(--aap-t2); text-wrap: pretty }
.aap-args { display: grid; margin-top: 14px; padding: 6px; border-radius: 16px; background: var(--aap-fill) }
.aap-arg { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 0 4px; align-items: start }
.aap-arg dt { display: flex; align-items: flex-start; min-height: 32px; padding: 6px 0 0 8px; color: var(--aap-t3) }
.aap-arg dd { min-width: 0 }
.aap-val { display: flex; align-items: flex-start; gap: 8px; width: 100%; min-height: 32px; padding: 5px 8px; border: 1px solid transparent; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; line-height: 20px; letter-spacing: -.02em; color: var(--aap-t1); overflow-wrap: anywhere; transition: background-color .16s var(--aap-ease), border-color .16s var(--aap-ease) }
.aap-val[data-plain] { font-family: inherit; letter-spacing: -.01em; font-size: 14px }
button.aap-val:hover { background: color-mix(in oklab, var(--aap-ink) 5%, transparent) }
.aap-val[data-locked] { color: var(--aap-t2) }
.aap-val-text { flex: 1; min-width: 0 }
.aap-val[data-edited] .aap-val-text::after { content: ""; display: inline-block; width: 5px; height: 5px; margin-left: 8px; border-radius: 50%; background: var(--aap-accent); vertical-align: middle }
.aap-input { display: block; width: 100%; min-height: 32px; padding: 5px 8px; border: 1px solid color-mix(in oklab, var(--aap-accent) 45%, var(--aap-line)); border-radius: 10px; background: var(--aap-surface); color: var(--aap-t1); font: inherit; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; line-height: 20px; letter-spacing: -.02em; resize: none; box-shadow: 0 0 0 3px color-mix(in oklab, var(--aap-accent) 11%, transparent); outline: none }
.aap-input[data-plain] { font-family: inherit; font-size: 14px; letter-spacing: -.01em }
.aap-restore { display: inline-grid; place-items: center; flex: none; width: 22px; height: 22px; margin: -1px -4px 0 0; border-radius: 7px; color: var(--aap-t3) }
.aap-restore:hover { background: color-mix(in oklab, var(--aap-ink) 7%, transparent); color: var(--aap-t1) }

.aap-decision { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 18px }
.aap-btn { flex: none; position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 18px; border: 1px solid transparent; color: var(--aap-t2); font-weight: 500; white-space: nowrap; transition: background-color .16s var(--aap-ease), color .16s var(--aap-ease), transform .16s var(--aap-ease), opacity .16s var(--aap-ease) }
.aap-btn:hover:not(:disabled) { background: var(--aap-fill); color: var(--aap-t1) }
.aap-btn:active:not(:disabled) { transform: scale(.97) }
.aap-btn:disabled { opacity: .5; cursor: default }
.aap-btn[data-primary] { background: var(--aap-btn); color: var(--aap-btn-fg); border-color: var(--aap-btn); padding: 0 12px 0 16px }
.aap-btn[data-primary]:hover:not(:disabled) { background: var(--aap-btn); color: var(--aap-btn-fg); opacity: .92 }
.aap-btn[data-primary]:disabled { opacity: .7 }
.aap-end { display: inline-flex; align-items: center; gap: 6px }
.aap-kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 21px; height: 18px; padding: 0 4px; border-radius: 5px; background: oklab(1 0 0 / .12); box-shadow: inset 0 0 0 1px oklab(1 0 0 / .3); color: var(--aap-btn-fg); font-size: 11px; line-height: 11px; font-weight: 500 }
:is(.dark, [data-theme="dark"]) .aap-kbd { background: oklab(0 0 0 / .1); box-shadow: inset 0 0 0 1px oklab(0 0 0 / .3) }
.aap-allow-wrap { position: relative }
.aap-pop { position: absolute; z-index: 30; min-width: 240px; padding: 4px; border-radius: 14px; background: var(--aap-surface); box-shadow: var(--aap-pop); animation: aap-pop .16s var(--aap-ease) backwards }
.aap-pop[data-up] { bottom: calc(100% + 6px); right: 0; transform-origin: bottom right }
.aap-pop[data-down] { top: calc(100% + 6px); right: 0; transform-origin: top right }
@keyframes aap-pop { from { opacity: 0; transform: translateY(4px) scale(.98) } }
.aap-pop-item { display: grid; width: 100%; padding: 8px 10px; border-radius: 10px; gap: 0 }
.aap-pop-item:hover, .aap-pop-item:focus-visible { background: var(--aap-fill); outline: none }
.aap-pop-item strong { font-weight: 500 }
.aap-pop-item span { font-size: 12px; line-height: 18px; color: var(--aap-t3) }
.aap-pop-title { padding: 6px 10px 4px; font-size: 12px; line-height: 18px; color: var(--aap-t3) }
.aap-rule { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: center; gap: 4px 10px; padding: 8px 6px 8px 10px; border-radius: 10px }
.aap-rule-main { min-width: 0 }
.aap-rule-main strong { display: block; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aap-rule-main span { display: block; font-size: 12px; line-height: 16px; color: var(--aap-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aap-rule-x { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; color: var(--aap-t3) }
.aap-rule-x:hover { background: var(--aap-fill); color: var(--aap-t1) }
.aap-rules-pop { right: 12px; top: 52px; width: min(320px, calc(100% - 24px)) }
.aap-pop-empty { padding: 10px; color: var(--aap-t3) }
.aap-flight { position: absolute; left: 0; top: 0; z-index: 40; display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 9px; border-radius: 9999px; background: var(--aap-btn); color: var(--aap-btn-fg); font-size: 12px; font-weight: 500; line-height: 16px; pointer-events: none; white-space: nowrap }
.aap-error { margin-top: 12px; padding: 8px 12px; border-radius: 12px; background: color-mix(in oklab, var(--aap-bad) 9%, transparent); color: var(--aap-bad); font-size: 13px; line-height: 18px }
.aap-done { display: grid; justify-items: center; gap: 4px; padding: 26px 0 22px; text-align: center; color: var(--aap-t2) }
.aap-done strong { font-weight: 500; font-size: 16px; color: var(--aap-t1) }
.aap-link { margin-top: 4px; padding: 4px 8px; border-radius: 8px; color: var(--aap-t1); font-weight: 500; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: var(--aap-line) }

/* queue */
.aap-queue { display: grid; padding: 0 8px }
.aap-qi { display: grid; grid-template-rows: 1fr; animation: aap-grow .4s var(--aap-ease) backwards }
.aap-qi[data-leaving] { animation: aap-shrink .38s var(--aap-ease) forwards; pointer-events: none }
.aap-qi-in { min-height: 0; overflow: hidden }
@keyframes aap-grow { from { grid-template-rows: 0fr; opacity: 0 } }
@keyframes aap-shrink { to { grid-template-rows: 0fr; opacity: 0 } }
.aap-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; width: 100%; height: 48px; padding: 0 12px; border: 1px solid var(--aap-hair); border-radius: 14px; margin-top: -1px; transition: background-color .16s var(--aap-ease) }
.aap-qi:first-child .aap-row { margin-top: 0 }
.aap-row:hover { background: var(--aap-fill) }
.aap-row-marks { display: inline-flex; align-items: center; gap: 6px; color: var(--aap-t1) }
.aap-row-text { display: flex; align-items: baseline; gap: 8px; min-width: 0 }
.aap-row-sum { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0 }
.aap-row-agent { flex: none; color: var(--aap-t3); white-space: nowrap }
.aap-row-status { display: inline-flex; align-items: center; gap: 5px; color: var(--aap-t1); white-space: nowrap; min-width: 0; justify-content: flex-end }
.aap-row-status .aap-swap { color: var(--aap-t2) }
.aap-row-status svg { flex: none }

/* footer + log */
.aap-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px 8px 10px; margin-top: 8px }
.aap-log-btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 8px; border-radius: 9999px; color: var(--aap-t2); font-variant-numeric: tabular-nums; transition: background-color .16s var(--aap-ease), color .16s var(--aap-ease) }
.aap-log-btn:hover { background: var(--aap-fill); color: var(--aap-t1) }
.aap-log-btn svg { transition: transform .34s var(--aap-ease) }
.aap-log-btn[aria-expanded="true"] svg { transform: rotate(180deg) }
.aap-hints { display: flex; align-items: center; gap: 14px; font-size: 12px; line-height: 16.8px; color: var(--aap-t3) }
.aap-hint { display: inline-flex; align-items: center; gap: 4px }
.aap-hint .aap-key { display: inline-flex; align-items: center; justify-content: center; min-width: 19px; height: 19px; padding: 0 4px; border-radius: 5px; background: var(--aap-surface); color: var(--aap-t2); font-size: 11px; font-weight: 500; line-height: 11px; box-shadow: inset 0 0 0 1px var(--aap-line), 0 1px 0 var(--aap-line) }
.aap-logwrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .38s var(--aap-ease) }
.aap-logwrap[data-open] { grid-template-rows: 1fr }
.aap-logclip { min-height: 0; overflow: hidden }
.aap-log { display: grid; gap: 2px; margin: 0 8px 8px; padding: 4px 0 0; border-top: 1px solid var(--aap-line); opacity: 0; transition: opacity .2s var(--aap-ease) }
.aap-logwrap[data-open] .aap-log { opacity: 1; transition-delay: .06s }
.aap-log-row { display: grid; grid-template-columns: 16px minmax(0, 1fr) auto; align-items: baseline; gap: 10px; padding: 7px 12px; font-size: 13px; line-height: 18px; border-radius: 10px }
.aap-log-icon { align-self: center; display: grid; place-items: center; color: var(--aap-t2) }
.aap-log-main { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aap-log-main b { font-weight: 500 }
.aap-log-main span { color: var(--aap-t3) }
.aap-log-time { color: var(--aap-t3); font-size: 12px; white-space: nowrap }

/* in place text swaps and shimmer */
.aap-swap { display: inline-grid; min-width: 0; max-width: 100% }
.aap-swap > * { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aap-swap-out { animation: aap-out .1s var(--aap-ease) forwards; pointer-events: none }
.aap-swap-in[data-fresh] { animation: aap-in .2s var(--aap-ease) backwards }
@keyframes aap-out { to { opacity: 0 } }
@keyframes aap-in { from { opacity: 0; transform: translateY(3px) } }
.aap-shimmer { position: relative }
.aap-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; overflow: hidden; text-overflow: ellipsis; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, rgb(var(--aap-glint) / .82) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: aap-sweep 1.6s linear infinite;
}
@keyframes aap-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }

@container aap (max-width: 539px) {
  .aap-hints, .aap-row-agent { display: none }
}
@container aap (max-width: 439px) {
  .aap-agent-model, .aap-risk-word { display: none }
  .aap-arg { grid-template-columns: minmax(0, 1fr); gap: 0 }
  .aap-arg dt { min-height: 0; padding: 6px 8px 0 }
  .aap-kbd { display: none }
  .aap-btn[data-primary] { padding: 0 16px }
  .aap-region { padding-inline: 14px }
  .aap-header { padding-left: 16px }
  .aap-ftitle { font-size: 20px; line-height: 22px }
}

@media (prefers-reduced-motion: reduce) {
  .aap *, .aap *::before, .aap *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "sending" | "error"
type Leaving = { id: string; index: number; request: ApprovalRequest; covered?: boolean }

function matchesRule(rule: ApprovalRule, req: ApprovalRequest) {
  return rule.tool === req.tool.id && (rule.scope === "workspace" || rule.agent?.id === req.agent.id)
}

function ArgRow({ arg, value, onChange, onRestore, disabled }: { arg: ApprovalArgument; value: string; onChange: (v: string) => void; onRestore: () => void; disabled: boolean }) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(value)
  const field = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const btn = React.useRef<HTMLButtonElement>(null)
  const edited = value !== arg.value
  const editable = arg.editable !== false && !disabled
  const plain = !arg.mono

  React.useEffect(() => {
    if (!editing) return
    const el = field.current
    if (!el) return
    el.focus()
    el.setSelectionRange?.(el.value.length, el.value.length)
    if (el instanceof HTMLTextAreaElement) {
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
  }, [editing])

  const begin = () => {
    setDraft(value)
    setEditing(true)
  }
  const finish = (save: boolean, refocus = true) => {
    if (save) onChange(draft.trim() === "" ? arg.value : draft)
    setEditing(false)
    if (refocus) requestAnimationFrame(() => btn.current?.focus())
  }
  const common = {
    className: "aap-input",
    "data-plain": plain || undefined,
    value: draft,
    "aria-label": `${arg.label}, editing`,
    onBlur: () => finish(true, false),
  }

  return (
    <div className="aap-arg">
      <dt>{arg.label}</dt>
      <dd>
        {editing ? (
          arg.multiline ? (
            <textarea
              {...common}
              ref={field as React.RefObject<HTMLTextAreaElement>}
              rows={3}
              onChange={(e) => {
                setDraft(e.target.value)
                e.target.style.height = "auto"
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditing(false)
                  requestAnimationFrame(() => btn.current?.focus())
                } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  finish(true)
                }
              }}
            />
          ) : (
            <input
              {...common}
              ref={field as React.RefObject<HTMLInputElement>}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditing(false)
                  requestAnimationFrame(() => btn.current?.focus())
                } else if (e.key === "Enter") {
                  e.preventDefault()
                  finish(true)
                }
              }}
            />
          )
        ) : editable ? (
          <button ref={btn} type="button" className="aap-val" data-plain={plain || undefined} data-edited={edited || undefined} aria-label={`${arg.label}: ${value}${edited ? ", edited" : ""}. Edit`} onClick={begin}>
            <span className="aap-val-text">{value}</span>
            {edited && (
              <span
                role="button"
                tabIndex={0}
                className="aap-restore"
                aria-label={`Restore ${arg.label}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    onRestore()
                  }
                }}
              >
                <RotateCcw size={13} strokeWidth={1.8} aria-hidden />
              </span>
            )}
          </button>
        ) : (
          <span className="aap-val" data-plain={plain || undefined} data-locked>
            <span className="aap-val-text">{value}</span>
          </span>
        )}
      </dd>
    </div>
  )
}

/**
 * One approval card for agents: the waiting tool call reads like a permission prompt, and you approve, deny or allow
 * it from now on. Without `requests` it plays a sample queue (and says so to assistive technology).
 */
export function AgentApprovals({
  requests,
  rules: rulesProp,
  resolved: resolvedProp,
  reviewer = "Maya Ortiz",
  workspace = "Northwind",
  title = "Approvals",
  onDecision,
  onRuleChange,
  className,
}: AgentApprovalsProps) {
  const isDemo = requests === undefined
  const [decidedIds, setDecidedIds] = React.useState<Set<string>>(new Set())
  const [rules, setRules] = React.useState<ApprovalRule[]>(rulesProp ?? sampleRules)
  const [log, setLog] = React.useState<ResolvedEntry[]>(resolvedProp ?? sampleResolved)
  const [edits, setEdits] = React.useState<Record<string, Record<string, string>>>({})
  const [phase, setPhase] = React.useState<Record<string, { phase: Phase; error?: string }>>({})
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const [leaving, setLeaving] = React.useState<Leaving[]>([])
  const [covered, setCovered] = React.useState<Set<string>>(new Set())
  const [logOpen, setLogOpen] = React.useState(false)
  const [menu, setMenu] = React.useState<"allow" | "rules" | null>(null)
  const [ruleCount, setRuleCount] = React.useState(rulesProp?.length ?? sampleRules.length)
  const [wash, setWash] = React.useState(0)
  const [flight, setFlight] = React.useState<FlightInfo | null>(null)
  const [now, setNow] = React.useState(T0)
  const [note, setNote] = React.useState("")
  const [resetKey, setResetKey] = React.useState(0)

  const root = React.useRef<HTMLDivElement>(null)
  const region = React.useRef<HTMLDivElement>(null)
  const allowBtn = React.useRef<HTMLButtonElement>(null)
  const rulesBtn = React.useRef<HTMLButtonElement>(null)
  const timers = React.useRef(new Set<number>())
  const flightSeq = React.useRef(0)
  const latest = React.useRef({ onDecision, onRuleChange })
  React.useEffect(() => {
    latest.current = { onDecision, onRuleChange }
  })

  const source = requests ?? sampleRequests
  const pending = React.useMemo(() => source.filter((r) => !decidedIds.has(r.id)), [source, decidedIds])
  const focus = pending.find((r) => r.id === focusId) ?? pending[0] ?? null
  const rows = pending.filter((r) => r.id !== focus?.id)

  const later = React.useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }, [])
  React.useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      t.clear()
    }
  }, [])
  /* One shared 15 second clock for the relative times */
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(clock()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const argValue = (req: ApprovalRequest, a: ApprovalArgument) => edits[req.id]?.[a.key] ?? a.value
  const argsOf = (req: ApprovalRequest) => Object.fromEntries(req.args.map((a) => [a.key, argValue(req, a)]))
  const isEdited = (req: ApprovalRequest) => req.args.some((a) => argValue(req, a) !== a.value)

  const toolLabel = (id: string) => rules.find((r) => r.tool === id)?.label ?? source.find((r) => r.tool.id === id)?.tool.action ?? id

  /* Record a decision and move the queue on */
  const settle = (req: ApprovalRequest, outcome: ApprovalOutcome, opts: { ruleId?: string; by?: string; edited?: boolean; exclude?: string[] } = {}) => {
    const at = new Date(clock()).toISOString()
    setLog((l) => [{ id: `${req.id}-${at}`, agentName: req.agent.name, tool: req.tool.id, summary: req.summary, outcome, edited: opts.edited, decidedBy: opts.by ?? reviewer, decidedAt: at }, ...l])
    setDecidedIds((s) => new Set(s).add(req.id))
    setPhase((p) => {
      const n = { ...p }
      delete n[req.id]
      return n
    })
    if (focus?.id === req.id) {
      const next = pending.find((r) => r.id !== req.id && !covered.has(r.id) && !opts.exclude?.includes(r.id))
      if (next) {
        const idx = Math.max(0, rows.findIndex((r) => r.id === next.id))
        setLeaving((l) => [...l, { id: next.id, index: idx, request: next }])
        later(400, () => setLeaving((l) => l.filter((x) => x.id !== next.id)))
      }
      setFocusId(next ? next.id : null)
      requestAnimationFrame(() => region.current?.focus({ preventScroll: true }))
    }
  }

  const deliver = async (req: ApprovalRequest, outcome: ApprovalOutcome, ruleId?: string, exclude?: string[]) => {
    const decision: ApprovalDecision = { requestId: req.id, outcome, args: argsOf(req), edited: isEdited(req), ruleId, decidedBy: reviewer, decidedAt: new Date(clock()).toISOString() }
    const cb = latest.current.onDecision
    setPhase((p) => ({ ...p, [req.id]: { phase: "sending" } }))
    setNote(`${outcome === "denied" ? "Denying" : "Approving"} ${req.summary}.${cb ? "" : " This preview simulates delivery; nothing reached a real agent."}`)
    try {
      if (cb) await cb(decision)
      else await new Promise<void>((r) => later(650, r))
    } catch (e) {
      setPhase((p) => ({ ...p, [req.id]: { phase: "error", error: e instanceof Error && e.message ? e.message : "The agent did not get your decision. Nothing ran." } }))
      setNote("The decision was not sent. Retry or deny.")
      return false
    }
    settle(req, outcome, { ruleId, edited: decision.edited, exclude })
    setNote(`${outcome === "denied" ? "Denied" : "Approved"}: ${req.summary}.`)
    return true
  }

  const approve = (req: ApprovalRequest) => void deliver(req, "approved")
  const deny = (req: ApprovalRequest) => void deliver(req, "denied")

  const alwaysAllow = async (req: ApprovalRequest, scope: "agent" | "workspace") => {
    setMenu(null)
    const rule: ApprovalRule = { id: `rule-${req.tool.id}-${scope}-${clock()}`, tool: req.tool.id, label: req.tool.action, brand: req.tool.brand, scope, agent: scope === "agent" ? { id: req.agent.id, name: req.agent.name } : undefined, createdBy: reviewer, createdAt: new Date(clock()).toISOString() }
    const hits = pending.filter((r) => r.id !== req.id && matchesRule(rule, r))
    // measured before the request leaves, for the chip that flies up into the Rules button
    const rb = rulesBtn.current?.getBoundingClientRect()
    const ab = allowBtn.current?.getBoundingClientRect()
    const rr = root.current?.getBoundingClientRect()
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ok = await deliver(req, "approved", rule.id, hits.map((h) => h.id))
    if (!ok) return
    setRules((r) => [...r, rule])
    latest.current.onRuleChange?.({ type: "added", rule })
    if (rb && ab && rr && !reduce) setFlight({ id: ++flightSeq.current, label: req.tool.action, from: ab, to: rb, root: rr })
    else setRuleCount((c) => c + 1)
    // other waiting requests the new rule covers resolve themselves
    if (hits.length) {
      setCovered((c) => {
        const n = new Set(c)
        hits.forEach((h) => n.add(h.id))
        return n
      })
      later(1100, () => {
        hits.forEach((h) => {
          const idx = Math.max(0, rows.findIndex((r) => r.id === h.id) - 1)
          settle(h, "allowed", { ruleId: rule.id, by: "Rule" })
          setLeaving((l) => [...l, { id: h.id, index: idx, request: h, covered: true }])
          latest.current.onDecision?.({ requestId: h.id, outcome: "allowed", args: Object.fromEntries(h.args.map((a) => [a.key, a.value])), edited: false, ruleId: rule.id, decidedBy: reviewer, decidedAt: new Date(clock()).toISOString() })
        })
        later(420, () => setLeaving((l) => l.filter((x) => !hits.some((h) => h.id === x.id))))
        setNote(`${hits.length} waiting request${hits.length === 1 ? "" : "s"} covered by the new rule.`)
      })
    }
  }

  const removeRule = (rule: ApprovalRule) => {
    setRules((r) => r.filter((x) => x.id !== rule.id))
    setRuleCount((c) => Math.max(0, c - 1))
    latest.current.onRuleChange?.({ type: "removed", rule })
    setNote(`Removed the rule for ${rule.label ?? rule.tool}.`)
  }

  /* Keyboard: j and k move, a approves, d denies; Enter approves while focus is on the card itself */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement
    if (t.closest("input, textarea, [role=menu], .aap-rules-pop, .aap-pop")) return
    if (!focus) return
    const k = e.key.toLowerCase()
    const busy = phase[focus.id]?.phase === "sending"
    if (k === "j" || k === "k") {
      const order = pending.map((r) => r.id)
      const i = order.indexOf(focus.id)
      const n = order[(i + (k === "j" ? 1 : -1) + order.length) % order.length]
      if (n !== focus.id) pick(n)
      e.preventDefault()
    } else if (k === "a" && !busy) {
      e.preventDefault()
      approve(focus)
    } else if (k === "d" && !busy) {
      e.preventDefault()
      deny(focus)
    } else if (e.key === "Enter" && t === region.current && !busy) {
      e.preventDefault()
      approve(focus)
    }
  }

  const pick = (id: string) => {
    if (id === focus?.id) return
    const idx = rows.findIndex((r) => r.id === id)
    const req = pending.find((r) => r.id === id)
    if (req) {
      setLeaving((l) => [...l, { id, index: Math.max(0, idx), request: req }])
      later(400, () => setLeaving((l) => l.filter((x) => x.id !== id)))
    }
    setFocusId(id)
    setMenu(null)
    requestAnimationFrame(() => region.current?.focus({ preventScroll: true }))
  }

  /* Close the popovers on an outside press */
  React.useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (!(t as HTMLElement).closest?.(".aap-pop, .aap-allow-wrap, .aap-rules-btn")) setMenu(null)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [menu])

  const reset = () => {
    setDecidedIds(new Set())
    setCovered(new Set())
    setEdits({})
    setFocusId(null)
    setResetKey((k) => k + 1)
    setNote("The sample queue is back.")
  }

  /* Rows to render, with leaving ghosts slotted back where they were */
  const rowItems: { req: ApprovalRequest; ghost?: boolean }[] = rows.map((req) => ({ req }))
  leaving.forEach((g) => {
    if (!rowItems.some((r) => r.req.id === g.id)) rowItems.splice(Math.min(g.index, rowItems.length), 0, { req: g.request, ghost: true })
  })

  const fid = focus?.id
  const ph = fid ? phase[fid] : undefined
  const sending = ph?.phase === "sending"

  return (
    <div ref={root} className={"aap" + (className ? " " + className : "")} onKeyDown={onKeyDown}>
      <style href="agent-approvals" precedence="default">
        {CSS}
      </style>
      <header className="aap-header">
        <h2 className="aap-title">{title}</h2>
        <span className="aap-count">
          <Roll value={pending.length} />
          <span className="aap-sr">{pending.length}</span>
          <span>pending</span>
        </span>
        <button ref={rulesBtn} type="button" className="aap-rules-btn" aria-haspopup="dialog" aria-expanded={menu === "rules"} onClick={() => setMenu((m) => (m === "rules" ? null : "rules"))}>
          {wash > 0 && <span key={wash} className="aap-wash" aria-hidden />}
          <span>Rules</span>
          <span className="aap-dot" aria-hidden>
            ·
          </span>
          <Roll value={ruleCount} />
          <span className="aap-sr">{`, ${ruleCount} rule${ruleCount === 1 ? "" : "s"}`}</span>
        </button>
      </header>

      {menu === "rules" && (
        <div className="aap-pop aap-rules-pop" role="dialog" aria-label="Always allowed rules" onKeyDown={(e) => e.key === "Escape" && (setMenu(null), rulesBtn.current?.focus())}>
          <p className="aap-pop-title">Always allowed</p>
          {rules.length === 0 ? (
            <p className="aap-pop-empty">No rules yet. Choose Always allow on a request to add one.</p>
          ) : (
            rules.map((rule) => (
              <div className="aap-rule" key={rule.id}>
                <span className="aap-tool" style={{ width: 16, height: 16 }}>
                  <ToolMark brand={rule.brand ?? source.find((r) => r.tool.id === rule.tool)?.tool.brand} size={15} />
                </span>
                <span className="aap-rule-main">
                  <strong>{rule.label ?? toolLabel(rule.tool)}</strong>
                  <span>{rule.scope === "agent" ? `${rule.agent?.name ?? "One agent"} only` : `Any agent in ${workspace}`}</span>
                </span>
                <button type="button" className="aap-rule-x" aria-label={`Remove the rule for ${rule.label ?? rule.tool}`} onClick={() => removeRule(rule)}>
                  <X size={14} strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="aap-region" ref={region} tabIndex={-1} role="region" aria-label="Pending request">
        <AutoHeight>
          {focus ? (
            <div className="aap-focus" key={`${focus.id}-${resetKey}`} role="group" aria-label={focus.title.replace(/`/g, "")}>
              <div className="aap-meta">
                <span className="aap-agent">
                  <AgentMark provider={focus.agent.provider} />
                  <span className="aap-agent-name">{focus.agent.name}</span>
                  <span className="aap-agent-model">{focus.agent.model}</span>
                  <span className="aap-agent-sep" aria-hidden>
                    ·
                  </span>
                  <time dateTime={focus.requestedAt}>{relative(focus.requestedAt, now)}</time>
                </span>
                <span className="aap-risk">
                  <RiskGlyph risk={focus.risk} />
                  <span>
                    {RISK_WORD[focus.risk]}
                    <span className="aap-risk-word"> risk</span>
                    <span className="aap-sr"> risk</span>
                  </span>
                </span>
              </div>
              <h3 className="aap-ftitle">
                <span className="aap-tool">
                  <ToolMark brand={focus.tool.brand} size={20} />
                </span>
                <span>
                  <RichTitle text={focus.title} />
                </span>
              </h3>
              <p className="aap-reason">{focus.reason}</p>
              <dl className="aap-args">
                {focus.args.map((a) => (
                  <ArgRow
                    key={a.key}
                    arg={a}
                    value={argValue(focus, a)}
                    disabled={sending}
                    onChange={(v) => {
                      setEdits((e) => ({ ...e, [focus.id]: { ...e[focus.id], [a.key]: v } }))
                      setNote(`${a.label} edited.`)
                    }}
                    onRestore={() => {
                      setEdits((e) => {
                        const n = { ...e, [focus.id]: { ...e[focus.id] } }
                        delete n[focus.id][a.key]
                        return n
                      })
                      setNote(`${a.label} restored.`)
                    }}
                  />
                ))}
              </dl>
              {ph?.phase === "error" && (
                <p className="aap-error" role="alert">
                  {ph.error} Retry or deny.
                </p>
              )}
              <div className="aap-decision">
                <button type="button" className="aap-btn" disabled={sending} onClick={() => deny(focus)}>
                  Deny
                </button>
                <span className="aap-end">
                  <span className="aap-allow-wrap">
                    <button ref={allowBtn} type="button" className="aap-btn" disabled={sending} aria-haspopup="menu" aria-expanded={menu === "allow"} onClick={() => setMenu((m) => (m === "allow" ? null : "allow"))}>
                      Always allow
                      <ChevronDown size={14} strokeWidth={1.8} aria-hidden />
                    </button>
                    {menu === "allow" && (
                      <div
                        className="aap-pop"
                        data-up
                        role="menu"
                        aria-label="Always allow"
                        onKeyDown={(e) => {
                          const items = [...(e.currentTarget.querySelectorAll("[role=menuitem]") as NodeListOf<HTMLElement>)]
                          const i = items.indexOf(document.activeElement as HTMLElement)
                          if (e.key === "ArrowDown") {
                            e.preventDefault()
                            items[(i + 1) % items.length]?.focus()
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault()
                            items[(i - 1 + items.length) % items.length]?.focus()
                          } else if (e.key === "Escape") {
                            e.preventDefault()
                            setMenu(null)
                            allowBtn.current?.focus()
                          }
                        }}
                        ref={(el) => el?.querySelector<HTMLElement>("[role=menuitem]")?.focus()}
                      >
                        <button type="button" role="menuitem" className="aap-pop-item" onClick={() => void alwaysAllow(focus, "agent")}>
                          <strong>This agent</strong>
                          <span>{`${focus.agent.name} may ${focus.tool.action.toLowerCase()} without asking`}</span>
                        </button>
                        <button type="button" role="menuitem" className="aap-pop-item" onClick={() => void alwaysAllow(focus, "workspace")}>
                          <strong>{`Any agent in ${workspace}`}</strong>
                          <span>{`Every agent may ${focus.tool.action.toLowerCase()}`}</span>
                        </button>
                      </div>
                    )}
                  </span>
                  <button type="button" className="aap-btn" data-primary disabled={sending} onClick={() => approve(focus)}>
                    <Swap text={sending ? "Sending" : ph?.phase === "error" ? "Retry" : "Approve"} shimmer={sending} />
                    {!sending && (
                      <span className="aap-kbd" aria-hidden>
                        <CornerDownLeft size={11} strokeWidth={2} />
                        <span className="aap-sr">Return</span>
                      </span>
                    )}
                  </button>
                </span>
              </div>
            </div>
          ) : (
            <div className="aap-done" key="done">
              <Check className="aap-ok" size={22} strokeWidth={2} aria-hidden />
              <strong>All caught up</strong>
              <span>No requests are waiting on you.</span>
              {isDemo && (
                <button type="button" className="aap-link" onClick={reset}>
                  Bring back the sample queue
                </button>
              )}
            </div>
          )}
        </AutoHeight>
      </div>

      <ul className="aap-queue" aria-label="Waiting requests">
        {rowItems.map(({ req, ghost }) => {
          const isCovered = covered.has(req.id)
          return (
            <li className="aap-qi" key={req.id} data-leaving={ghost ? "" : undefined}>
              <div className="aap-qi-in">
                <button type="button" className="aap-row" aria-label={`${req.summary}, ${req.agent.name}, ${isCovered ? "allowed by rule" : `${RISK_WORD[req.risk]} risk`}`} onClick={() => pick(req.id)} disabled={ghost}>
                  <span className="aap-row-marks" aria-hidden>
                    <AgentMark provider={req.agent.provider} />
                    <ToolMark brand={req.tool.brand} />
                  </span>
                  <span className="aap-row-text">
                    <span className="aap-row-sum">{req.summary}</span>
                    <span className="aap-row-agent">{req.agent.name}</span>
                  </span>
                  <span className="aap-row-status" aria-hidden>
                    {isCovered ? <Zap className="aap-ok" size={14} strokeWidth={1.8} /> : <RiskGlyph risk={req.risk} size={14} />}
                    <Swap text={isCovered ? "Allowed by rule" : RISK_WORD[req.risk]} />
                  </span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="aap-logwrap" data-open={logOpen || undefined}>
        <div className="aap-logclip" inert={!logOpen}>
          <ol className="aap-log" id="aap-log" aria-label="Resolved requests">
            {log.map((e) => (
              <li className="aap-log-row" key={e.id}>
                <span className="aap-log-icon" aria-hidden>
                  {e.outcome === "denied" ? <X size={14} strokeWidth={1.8} className="aap-high" /> : e.outcome === "allowed" ? <Zap size={14} strokeWidth={1.8} className="aap-ok" /> : <Check size={14} strokeWidth={2} className="aap-ok" />}
                </span>
                <span className="aap-log-main">
                  <b>{e.outcome === "denied" ? "Denied" : e.outcome === "allowed" ? "Allowed by rule" : e.edited ? "Approved with edits" : "Approved"}</b> <span>{e.summary}</span>
                </span>
                <span className="aap-log-time">{`${e.decidedBy} · ${relative(e.decidedAt, now)}`}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="aap-footer">
        <button type="button" className="aap-log-btn" aria-expanded={logOpen} aria-controls="aap-log" onClick={() => setLogOpen((o) => !o)}>
          <ChevronDown size={14} strokeWidth={1.8} aria-hidden />
          <span>Resolved</span>
          <span className="aap-dot" aria-hidden>
            ·
          </span>
          <Roll value={log.length} />
          <span className="aap-sr">{log.length}</span>
        </button>
        <span className="aap-hints" aria-hidden>
          <span className="aap-hint">
            <span className="aap-key">J</span>
            <span className="aap-key">K</span>
            Move
          </span>
          <span className="aap-hint">
            <span className="aap-key">A</span>
            Approve
          </span>
          <span className="aap-hint">
            <span className="aap-key">D</span>
            Deny
          </span>
        </span>
      </div>

      {flight && (
        <Flight
          key={flight.id}
          flight={flight}
          onDone={() => {
            setFlight(null)
            setRuleCount((c) => c + 1)
            setWash((w) => w + 1)
          }}
        />
      )}
      <p className="aap-sr" role="status" aria-live="polite">
        {note}
        {isDemo && note ? " This preview is a simulation." : ""}
      </p>
    </div>
  )
}

export default AgentApprovals

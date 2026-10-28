"use client"

import * as React from "react"
import {
  BarChart3,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  FileText,
  Hammer,
  Home,
  Inbox,
  Landmark,
  ListChecks,
  Mail,
  MessageSquare,
  MoreHorizontal,
  PanelRight,
  Play,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Square,
  Undo2,
  User,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { AppShell, Rays, ShellButton, type ShellNavGroup, type ShellUser } from "./app-shell"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ToolCall = {
  name: string
  summary: string
  icon?: React.ReactNode
  args?: unknown
  result?: unknown
  /** How long the call takes in the simulation, ms. */
  duration: number
}

export type RunApproval = {
  title: string
  description: string
  risk: "low" | "medium" | "high"
  details: { label: string; value: string }[]
}

export type RunStep = {
  id: string
  title: string
  detail?: string
  tool?: string
  calls?: ToolCall[]
  approval?: RunApproval
}

export type RunDraft = { original: string; suggested: string; label?: string }

export type AgentRunProps = {
  title?: string
  steps?: RunStep[]
  draft?: RunDraft
  agent?: string
  /** Plays the built-in simulation. Turn off and pass `step` / `callsDone` / `waiting` from your own events. */
  autoRun?: boolean
  /** Controlled mode: index of the running step (steps.length = done). */
  step?: number
  /** Controlled mode: finished calls of the running step. */
  callsDone?: number
  /** Controlled mode: the running step waits for its approval. */
  waiting?: boolean
  onApprove?: (stepId: string) => void
  onDeny?: (stepId: string) => void
  onStop?: () => void
  onDone?: () => void
  onNavigate?: (label: string) => void
  workspace?: string
  user?: ShellUser
  /** Extra buttons in the sidebar header. */
  sideTools?: React.ReactNode
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                Default data                                */
/* -------------------------------------------------------------------------- */

export const defaultRunSteps: RunStep[] = [
  {
    id: "payouts",
    title: "Pull September payouts",
    detail: "From Stripe and the bank feed",
    tool: "stripe.payouts",
    calls: [
      {
        name: "stripe.payouts",
        summary: "Payouts, September",
        duration: 700,
        args: { from: "2026-09-01", to: "2026-09-30", status: "paid" },
        result: { count: 145, total: 648210, currency: "USD" },
      },
      {
        name: "bank.transactions",
        summary: "Business account, September",
        duration: 600,
        args: { account: "operating", month: "2026-09" },
        result: { credits: 151, debits: 312, balance: 1204350 },
      },
    ],
  },
  {
    id: "match",
    title: "Match payouts to invoices",
    detail: "Flags anything that doesn't add up",
    tool: "ledger.match",
    calls: [
      {
        name: "ledger.match",
        summary: "142 of 145 payouts matched",
        duration: 1000,
        args: { source: "stripe", against: "invoices", tolerance: 0.01 },
        result: { matched: 142, unmatched: 3, unmatchedTotal: 4120 },
      },
      {
        name: "drive.search",
        summary: "\u201crefund policy 2026\u201d",
        duration: 600,
        args: { query: "refund policy 2026", type: "document" },
        result: { hits: 2, top: "Refunds – policy and limits" },
      },
    ],
  },
  {
    id: "summary",
    title: "Write the month-end summary",
    detail: "Revenue, refunds and open items",
    tool: "docs.write",
    calls: [
      {
        name: "docs.write",
        summary: "Rewrote the revenue section",
        duration: 900,
        args: { doc: "Month-end summary – Sep", section: "Revenue", mode: "suggest" },
        result: { suggestions: 7, status: "pending review" },
      },
      {
        name: "docs.write",
        summary: "Added the open items list",
        duration: 600,
        args: { doc: "Month-end summary – Sep", section: "Open items", mode: "suggest" },
        result: { suggestions: 1, status: "pending review" },
      },
    ],
  },
  {
    id: "send",
    title: "Send the summary to Priya",
    detail: "Needs your approval first",
    tool: "gmail.send",
    calls: [
      {
        name: "gmail.compose",
        summary: "Draft to Priya Shah",
        duration: 600,
        args: { to: "priya@northwind.com", subject: "September close – summary", attach: ["Month-end summary – Sep 2026"] },
        result: { draftId: "d-4417", ready: true },
      },
    ],
    approval: {
      title: "Send the summary to Priya",
      description: "Emails the September close summary",
      risk: "medium",
      details: [
        { label: "To", value: "Priya Shah (Finance)" },
        { label: "Subject", value: "September close – summary" },
        { label: "Attachment", value: "Month-end summary – Sep 2026" },
      ],
    },
  },
  {
    id: "review",
    title: "Schedule the close review",
    detail: "15 minutes on Monday morning",
    tool: "calendar.create",
    calls: [
      {
        name: "calendar.create",
        summary: "Close review · Mon 9:30",
        duration: 700,
        args: { title: "September close review", attendees: ["priya@northwind.com"], start: "2026-10-05T09:30", minutes: 15 },
        result: { eventId: "evt_82", status: "confirmed" },
      },
    ],
  },
]

export const defaultRunDraft: RunDraft = {
  label: "Month-end summary – Sep · Revenue",
  original:
    "Revenue came in at $612k in September, roughly in line with August. Refunds were higher than usual, and three payouts are still unmatched so the numbers may change.",
  suggested:
    "Revenue came in at $648k in September, 6% above August. Refunds fell to 1.2%, and three payouts are still unmatched, worth $4.1k in total.",
}

const RUN_NAV: ShellNavGroup[] = [
  {
    items: [
      { label: "Home", icon: Home },
      { label: "Chat", icon: MessageSquare },
      { label: "Runs", icon: Play, badge: 3 },
      { label: "Analytics", icon: BarChart3 },
      { label: "Deliverables", icon: Inbox },
    ],
  },
  {
    label: "Agents",
    items: [
      { label: "Finance ops", icon: Bot },
      { label: "Revenue ops", icon: Coins },
      { label: "Support triage", icon: Mail },
      { label: "Workflows", icon: Workflow },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ar { container-type: inline-size; position: relative; display: flex; flex: 1; min-width: 0; min-height: 0 }
.ar-main { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0 }
.ar-bar {
  display: flex; align-items: center; gap: 12px; height: 52px; flex: none; padding: 0 12px 0 20px;
  border-bottom: 1px solid var(--as-line); color: var(--as-muted);
}
.as[data-side="closed"] .ar-bar { padding-left: 52px }
.ar-crumbs { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 13.5px; color: var(--as-muted) }
.ar .ar-crumb { display: flex; align-items: center; gap: 7px; transition: color .16s }
.ar .ar-crumb:hover { color: var(--as-ink) }
.ar-crumb svg { width: 15px; height: 15px }
.ar-crumbs strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--as-ink) }
.ar-pill {
  display: inline-flex; align-items: center; gap: 6px; height: 22px; margin-left: 4px; padding: 0 9px 0 8px; border-radius: 999px;
  font-size: 12px; font-weight: 500; white-space: nowrap; transition: background-color .3s, color .3s;
}
.ar-pill i { width: 6px; height: 6px; border-radius: 50%; background: currentColor }
.ar-pill[data-tone="blue"] { background: var(--as-blue-soft); color: var(--as-blue) }
.ar-pill[data-tone="blue"] i { animation: as-breathe 1.4s ease-in-out infinite }
.ar-pill[data-tone="amber"] { background: var(--as-amber-soft); color: var(--as-amber) }
.ar-pill[data-tone="green"] { background: var(--as-green-soft); color: var(--as-green) }
.ar-pill[data-tone="red"] { background: var(--as-red-soft); color: var(--as-red) }
.ar-pill[data-tone="gray"] { background: var(--as-fill); color: var(--as-muted) }
.ar-tools { display: flex; align-items: center; gap: 6px; margin-left: auto }
.ar-time { display: flex; align-items: center; gap: 6px; margin-right: 6px; white-space: nowrap; font-variant-numeric: tabular-nums }
.ar-time svg { width: 15px; height: 15px }
.ar-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 32px 32px 40px }
.ar-column { display: flex; flex-direction: column; gap: 28px; max-width: 680px; margin: 0 auto }

/* A grey well holding a white card – used by the plan, approval and diff */
.ar-well { padding: 4px; border-radius: 20px; background: var(--as-well) }
:is(.dark, [data-theme="dark"]) .ar-well { background: var(--as-well); box-shadow: inset 0 0 0 1px var(--as-line) }
.ar-card { border-radius: 16px; background: var(--as-surface); box-shadow: var(--as-card-2) }
:is(.dark, [data-theme="dark"]) .ar-card { background: #19191b }
.ar-well__label { display: flex; align-items: center; gap: 6px; padding: 6px 8px 4px; font-size: 12.5px; line-height: 16px; color: var(--as-subtle) }
.ar-well__label svg { width: 13px; height: 13px }

/* Plan */
.ar-pl { font-size: 13.5px; line-height: 19px; letter-spacing: -.081px; color: var(--as-text-2) }
.ar-pl__head { display: grid; gap: 4px; padding: 16px 18px 8px }
.ar-pl__meta { display: flex; align-items: center; gap: 7px; font-size: 12.5px; line-height: 18px; color: var(--as-subtle) }
.ar-pl__meta svg { width: 13px; height: 13px }
.ar-pl__title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; letter-spacing: -.168px; color: var(--as-ink) }
.ar-pl__list { margin: 0; padding: 2px 6px 6px; list-style: none }
.ar-pl__step {
  position: relative; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; column-gap: 12px;
  padding: 10px 10px 10px 14px; border-radius: 10px; transition: background-color .3s;
}
.ar-pl__step[data-phase="running"], .ar-pl__step[data-phase="waiting"] { background: color-mix(in oklab, var(--as-ink) 2.5%, transparent) }
.ar-pl__step:not(:last-child)::before, .ar-pl__step:not(:last-child)::after {
  content: ""; position: absolute; left: 24.5px; top: 34px; bottom: -6px; width: 1px; background: var(--as-line);
}
:is(.dark, [data-theme="dark"]) .ar-pl__step:not(:last-child)::before { background: #2a2a2e }
.ar-pl__step:not(:last-child)::after {
  background: color-mix(in oklab, var(--as-ink) 22%, transparent); transform: scaleY(0); transform-origin: top;
  transition: transform .56s var(--as-ease);
}
.ar-pl__step[data-phase="done"]:not(:last-child)::after { transform: scaleY(1) }
.ar-pl__marker {
  position: relative; z-index: 1; display: grid; place-items: center; width: 20px; height: 20px; margin-top: 0; border-radius: 999px;
  background: var(--as-surface); box-shadow: inset 0 0 0 1px #ececec; color: var(--as-subtle);
  font-size: 11px; font-weight: 500; line-height: 11px; transition: background-color .32s, box-shadow .32s, color .32s;
}
:is(.dark, [data-theme="dark"]) .ar-pl__marker { background: #19191b; box-shadow: inset 0 0 0 1px #2a2a2e }
.ar-pl__step:not([data-phase="pending"]) .ar-pl__marker { background: var(--as-fill); box-shadow: none; color: var(--as-ink) }
.ar-pl__step[data-phase="denied"] .ar-pl__marker, .ar-pl__step[data-phase="stopped"] .ar-pl__marker { background: var(--as-red-soft); color: var(--as-red) }
.ar-pl__marker > * { animation: as-pop .36s var(--as-ease) backwards }
.ar-pl__marker svg { width: 11px; height: 11px }
.ar-pl__marker .as-rays { width: 13px; height: 13px }
.ar-draw { stroke-dasharray: 1; stroke-dashoffset: 0; animation: ar-draw .42s var(--as-ease) .08s backwards }
.ar-pl__main { display: grid; gap: 2px; min-width: 0 }
.ar-pl__name { font-weight: 500; color: var(--as-text-2); transition: color .3s }
.ar-pl__step:not([data-phase="pending"]) .ar-pl__name { color: var(--as-ink) }
.ar-pl__sub { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 8px; font-size: 12.5px; line-height: 18px; color: var(--as-subtle) }
.ar-tool-chip {
  padding: 1px 6px; border-radius: 6px; background: #f3f3f3; color: #555;
  font-family: var(--as-mono); font-size: 11px; line-height: 16px; letter-spacing: 0;
}
:is(.dark, [data-theme="dark"]) .ar-tool-chip { background: #232326; color: #b4b4b4 }
.ar-pl__time { padding-top: 1px; font-size: 12.5px; color: var(--as-subtle); font-variant-numeric: tabular-nums; animation: as-fade .3s ease backwards }
.ar-pl__foot { display: flex; align-items: center; gap: 12px; height: 46px; padding: 0 12px 0 12px; font-size: 12.5px; color: var(--as-subtle) }
.ar-pl__status { display: flex; align-items: center; gap: 8px; color: var(--as-ink); animation: as-fade .32s var(--as-ease) backwards }
.ar-pl__status svg { width: 13px; height: 13px }
.ar-pl__elapsed { margin-left: auto; padding-right: 6px; font-variant-numeric: tabular-nums }

/* Activity feed */
.ar-feed { display: flex; flex-direction: column }
.ar-label { padding-bottom: 14px; font-size: 12.5px; font-weight: 500; line-height: 16px; color: var(--as-faint) }
.ar-entry { position: relative; display: flex; flex-direction: column; gap: 10px; padding: 0 0 20px 34px; animation: as-rise .42s var(--as-ease) backwards }
.ar-entry__head { display: flex; align-items: center; min-height: 22px; font-size: 13.5px; font-weight: 500; color: var(--as-ink) }
.ar-num {
  position: absolute; left: 0; top: 0; display: grid; place-items: center; width: 23px; height: 23px; border-radius: 50%;
  background: var(--as-fill); font-size: 11.5px; font-weight: 500; color: var(--as-ink);
}
.ar-note { display: flex; align-items: center; gap: 7px; animation: as-fade .32s var(--as-ease) backwards }
.ar-note svg { width: 14px; height: 14px }
.ar-note[data-tone="amber"] { color: var(--as-amber) }
.ar-note[data-tone="green"] { color: var(--as-green) }
.ar-note[data-tone="red"] { color: var(--as-red) }

/* Tool calls */
.ar-tc-group { display: grid; font-size: 13.5px; line-height: 18.9px; letter-spacing: -.081px; color: var(--as-text-2) }
.ar .ar-tc-group__head {
  display: flex; align-items: center; gap: 9px; width: max-content; max-width: 100%; height: 36px; padding: 4px 10px 4px 5px;
  border-radius: 10px; transition: background-color .16s;
}
.ar .ar-tc-group__head:hover { background: var(--as-hover) }
.ar-tc-group__stack { display: flex }
.ar-tc-group__stack > * + * { margin-left: -5px }
.ar-tc-icon {
  display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: var(--as-fill); color: var(--as-ink);
  box-shadow: var(--as-inset), 0 0 0 2px var(--as-surface); animation: ar-tc-pop .42s var(--as-ease) backwards;
}
.ar-tc-icon svg { width: 13px; height: 13px }
.ar-tc-group__title { display: flex; align-items: baseline; gap: 5px; animation: ar-tc-in .36s var(--as-ease) backwards }
.ar-tc-group__label { font-weight: 500; color: var(--as-text-2) }
.ar-tc-group__time { color: var(--as-subtle); font-variant-numeric: tabular-nums }
.ar-chevron { width: 14px; height: 14px; color: var(--as-text-2); transition: transform .36s var(--as-ease) }
[aria-expanded="true"] > .ar-chevron { transform: rotate(180deg) }
.ar-collapse { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .38s var(--as-ease), opacity .24s }
.ar-collapse[data-open="true"] { grid-template-rows: 1fr; opacity: 1 }
.ar-collapse > div { min-height: 0; overflow: hidden }
.ar-tc-group__list { display: grid; gap: 8px; padding-top: 8px }
.ar-tc {
  border-radius: 12px; background: var(--as-surface); box-shadow: var(--as-inset), 0 1px 2px 0 rgb(0 0 0 / .04);
  font-size: 13px; line-height: 18.2px; letter-spacing: -.078px; animation: as-rise .36s var(--as-ease) backwards;
}
.ar .ar-tc__head { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 40px; padding: 6px 10px 6px 9px; border-radius: 12px }
.ar .ar-tc__head:disabled { cursor: default }
.ar-tc__main { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0 }
.ar-tc__name { flex: none; font-family: var(--as-mono); font-size: 12.5px; font-weight: 500; line-height: 17.5px; letter-spacing: 0; color: var(--as-ink) }
.ar-tc__summary { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--as-text-2) }
.ar-tc__status { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 12.5px; color: var(--as-subtle); font-variant-numeric: tabular-nums; white-space: nowrap }
.ar-tc__status svg { width: 14px; height: 14px }
.ar-tc__status > * { animation: ar-tc-in .36s var(--as-ease) backwards }
.ar-tc__sections { display: grid; gap: 12px; padding: 12px; border-top: 1px solid #e7e7e7 }
:is(.dark, [data-theme="dark"]) .ar-tc__sections { border-top-color: rgb(255 255 255 / .08) }
.ar-tc__section { display: grid; gap: 6px }
.ar-tc__section-head { display: flex; align-items: center; justify-content: space-between; gap: 8px }
.ar-tc__label { font-size: 12px; font-weight: 500; color: var(--as-subtle) }
.ar .ar-tc__copy { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; color: var(--as-subtle); transition: background-color .16s, color .16s }
.ar .ar-tc__copy:hover { background: var(--as-hover); color: var(--as-ink) }
.ar-tc__copy svg { width: 14px; height: 14px }
.ar-code {
  margin: 0; padding: 10px 12px; overflow-x: auto; border-radius: 8px; background: var(--as-code); box-shadow: var(--as-inset);
  font-family: var(--as-mono); font-size: 12px; line-height: 19.2px; letter-spacing: 0; color: var(--as-subtle); white-space: pre;
}
.ar-code .k { color: var(--as-ink) }
.ar-code .s { color: #0f7b6c }
.ar-code .n { color: #b25b0c }
.ar-code .l { color: #6e56cf }
:is(.dark, [data-theme="dark"]) .ar-code .s { color: #4fd1b9 }
:is(.dark, [data-theme="dark"]) .ar-code .n { color: #f0a35b }
:is(.dark, [data-theme="dark"]) .ar-code .l { color: #a99bff }

/* Live status pill at the end of the feed */
.ar-tl {
  display: inline-flex; align-items: center; gap: 7px; width: max-content; height: 28px; margin-left: 34px; padding: 0 12px 0 10px;
  border-radius: 999px; background: var(--as-surface); box-shadow: var(--as-inset), 0 1px 2px 0 rgb(0 0 0 / .04);
  font-weight: 450; color: var(--as-text-2); animation: as-rise .42s var(--as-ease) backwards;
}
.ar-tl__text { position: relative; display: inline-grid; height: 17px; overflow: hidden; transition: width .46s var(--as-ease) }
.ar-tl__text > span { grid-area: 1 / 1; white-space: nowrap; line-height: 17px }
.ar-tl__in { animation: ar-tl-in .46s var(--as-ease) backwards }
.ar-tl__out { animation: ar-tl-out .32s var(--as-ease) forwards }

/* Side panel */
.ar-panel {
  display: flex; flex-direction: column; width: 360px; flex: none; min-height: 0; border-left: 1px solid var(--as-line);
  background: var(--as-surface); transition: margin-right .36s var(--as-ease), transform .36s var(--as-ease);
}
.ar[data-panel="closed"] .ar-panel { margin-right: -361px }
.ar-panel__bar { display: flex; align-items: center; gap: 8px; height: 52px; flex: none; padding: 0 20px; border-bottom: 1px solid var(--as-line); font-size: 13.5px; font-weight: 500; color: var(--as-ink) }
.ar-count {
  display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
  background: #d97706; color: #fff; font-size: 11px; font-weight: 600; animation: as-pop .32s var(--as-ease) backwards;
}
.ar-panel__body { flex: 1; min-height: 0; overflow-y: auto }
.ar-section { display: flex; flex-direction: column; padding: 20px; border-bottom: 1px solid var(--as-line) }
.ar-section:last-child { border-bottom: 0 }
.ar-section .ar-label { padding-bottom: 10px }
.ar-empty {
  display: grid; justify-items: center; gap: 4px; padding: 22px 20px; border-radius: 14px; background: var(--as-bg); text-align: center;
  animation: as-fade .32s var(--as-ease) backwards;
}
.ar-empty svg { width: 18px; height: 18px; margin-bottom: 6px; color: var(--as-subtle) }
.ar-empty strong { font-size: 13px; font-weight: 500; color: var(--as-ink) }
.ar-empty span { max-width: 220px; font-size: 12.5px; line-height: 17px; color: var(--as-subtle) }
.ar-details { display: grid; gap: 12px }
.ar-details div { display: flex; align-items: center; gap: 8px; color: var(--as-text-2) }
.ar-details svg { width: 15px; height: 15px; color: var(--as-subtle) }
.ar-details b { margin-left: auto; font-weight: 500; color: var(--as-ink); font-variant-numeric: tabular-nums }

/* Approval */
.ar-ap { line-height: 18.85px; letter-spacing: -.078px; animation: as-rise .42s var(--as-ease) backwards }
.ar-ap .ar-card { padding: 14px }
.ar-ap__head { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: 10px; align-items: start }
.ar-ap__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: var(--as-well); box-shadow: inset 0 0 0 1px #ececec; color: var(--as-ink) }
:is(.dark, [data-theme="dark"]) .ar-ap__icon { background: var(--as-fill); box-shadow: var(--as-inset) }
.ar-ap__icon svg { width: 15px; height: 15px }
.ar-ap__title { font-size: 13.5px; font-weight: 550; line-height: 20px; letter-spacing: -.1485px; color: var(--as-ink) }
.ar-ap__desc { margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--as-text-2) }
.ar-risk { display: inline-flex; align-items: center; gap: 6px; height: 22px; margin-top: 1px; padding: 0 9px 0 8px; border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 12px; white-space: nowrap }
.ar-risk i { width: 6px; height: 6px; border-radius: 50% ; background: currentColor }
.ar-risk[data-risk="low"] { background: var(--as-green-soft); color: var(--as-green) }
.ar-risk[data-risk="medium"] { background: #fbf3e2; color: #8a5a00 }
.ar-risk[data-risk="high"] { background: var(--as-red-soft); color: var(--as-red) }
:is(.dark, [data-theme="dark"]) .ar-risk[data-risk="medium"] { background: var(--as-amber-soft); color: var(--as-amber) }
.ar-ap__preview { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 12px; margin-top: 14px; padding: 12px; border-radius: 10px; background: var(--as-code); box-shadow: inset 0 0 0 1px #ececec }
:is(.dark, [data-theme="dark"]) .ar-ap__preview { box-shadow: var(--as-inset) }
.ar-ap__preview dt { color: var(--as-subtle) }
.ar-ap__preview dd { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--as-ink) }
.ar-ap__foot { display: flex; justify-content: flex-end; gap: 4px; margin-top: 14px }
.ar-ap .as-btn { height: 30px; box-shadow: inset 0 0 0 1px #ebebeb; border: 0 }
.ar-ap .as-btn--primary { box-shadow: 0 1px 2px 0 rgb(0 0 0 / .12) }
:is(.dark, [data-theme="dark"]) .ar-ap .as-btn--outline { box-shadow: var(--as-inset) }
.ar-ap__done { display: flex; align-items: center; gap: 8px; padding: 12px 14px !important; animation: as-fade .32s var(--as-ease) backwards }
.ar-ap__done svg { width: 15px; height: 15px }
.ar-ap__done span { flex: 1; color: var(--as-ink); font-weight: 500 }
.ar-ap__done em { font-style: normal; font-size: 12.5px; color: var(--as-subtle) }

/* Diff */
.ar-df { color: #525252; animation: as-rise .42s var(--as-ease) backwards }
:is(.dark, [data-theme="dark"]) .ar-df { color: var(--as-text) }
.ar-df__head { display: flex; align-items: center; gap: 8px; min-height: 51px; padding: 10px 10px 10px 16px; border-bottom: 1px solid #ececec }
:is(.dark, [data-theme="dark"]) .ar-df__head { border-bottom-color: var(--as-line) }
.ar-df__count { display: flex; align-items: center; gap: 7px; font-weight: 500; color: var(--as-ink) }
.ar-df__num { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--as-green-soft); color: var(--as-green); font-size: 11.5px; font-weight: 600 }
.ar-df__count svg { width: 16px; height: 16px; color: var(--as-green) }
.ar-df__actions { display: flex; align-items: center; gap: 6px; margin-left: auto }
.ar .ar-df__icon { display: grid; place-items: center; width: 28px; height: 30px; border-radius: 10px; color: var(--as-subtle); transition: background-color .16s, color .16s }
.ar .ar-df__icon:hover { background: var(--as-hover); color: var(--as-ink) }
.ar-df__icon svg { width: 16px; height: 16px }
.ar-df .as-btn { height: 30px; padding: 0 11px; border: 0; box-shadow: inset 0 0 0 1px #ececec; background: transparent }
:is(.dark, [data-theme="dark"]) .ar-df .as-btn--outline { box-shadow: var(--as-inset) }
.ar-df .as-btn--primary { box-shadow: none; background: var(--as-primary) }
.ar-df__body { padding: 14px 16px 16px; font-size: 13.5px; line-height: 21.6px; letter-spacing: -.081px }
.ar-chg { position: relative; border-radius: 4px; cursor: pointer; outline: none }
.ar-chg[data-active] { box-shadow: 0 0 0 2px color-mix(in oklab, var(--as-accent) 35%, transparent) }
.ar-del { padding: 1px 2px; border-radius: 4px; background: var(--as-red-soft); color: var(--as-red); text-decoration: line-through; text-decoration-color: color-mix(in oklab, var(--as-red) 50%, transparent) }
.ar-ins { margin-left: 3px; padding: 1px 2px; border-radius: 4px; background: var(--as-green-soft); color: var(--as-green) }
.ar-del + .ar-ins:empty, .ar-ins:first-child { margin-left: 0 }
.ar-resolved { animation: ar-flash 1s var(--as-ease) }
.ar-df__pop {
  position: absolute; left: 50%; bottom: calc(100% + 6px); z-index: 5; display: flex; align-items: center; gap: 2px; padding: 3px;
  border-radius: 10px; background: #171717; box-shadow: 0 6px 20px -6px rgb(0 0 0 / .35), 0 1px 2px 0 rgb(0 0 0 / .2);
  transform: translateX(-50%); white-space: nowrap; text-decoration: none; animation: ar-pop-in .2s var(--as-ease) backwards;
}
:is(.dark, [data-theme="dark"]) .ar-df__pop { background: #2a2a2e; box-shadow: 0 0 0 1px rgb(255 255 255 / .08), 0 6px 20px -6px rgb(0 0 0 / .6) }
.ar .ar-df__pbtn { display: flex; align-items: center; gap: 6px; height: 27px; padding: 0 8px 0 7px; border-radius: 7px; color: #fff; font-size: 12.5px; font-weight: 500; line-height: 12.5px; transition: background-color .16s }
.ar .ar-df__pbtn:hover { background: rgb(255 255 255 / .1) }
.ar-df__pbtn svg { width: 13px; height: 13px }
.ar-df__pbtn kbd { font: inherit; font-size: 11px; color: rgb(255 255 255 / .5) }
.ar-df__sep { width: 1px; height: 15px; background: rgb(255 255 255 / .14) }

/* Narrow: the side panel becomes a layer that slides in from the right */
.ar-scrim { display: none }
@container (max-width: 999px) {
  .ar-panel { position: absolute; top: 0; right: 0; bottom: 0; z-index: 20; box-shadow: -12px 0 32px -12px rgb(0 0 0 / .18); margin-right: 0 !important }
  .ar[data-panel="closed"] .ar-panel { transform: translateX(calc(100% + 24px)) }
  .ar[data-panel="open"] .ar-scrim { display: block; position: absolute; inset: 0; z-index: 15; background: rgb(0 0 0 / .12); animation: as-fade .2s ease backwards }
  .ar-scroll { padding: 24px 20px 32px }
}

@keyframes ar-draw { from { stroke-dashoffset: 1 } }
@keyframes ar-tc-pop { from { opacity: 0; transform: scale(.6) } }
@keyframes ar-tc-in { from { opacity: 0; filter: blur(2px); transform: translateY(3px) } }
@keyframes ar-tl-in { from { opacity: 0; filter: blur(3px); transform: translateY(70%) } }
@keyframes ar-tl-out { to { opacity: 0; filter: blur(3px); transform: translateY(-70%) } }
@keyframes ar-pop-in { from { opacity: 0; transform: translateX(-50%) translateY(3px) scale(.96) } }
@keyframes ar-flash { from { background: color-mix(in oklab, var(--as-accent) 16%, transparent) } }
`

/* -------------------------------------------------------------------------- */
/*                               Run simulation                               */
/* -------------------------------------------------------------------------- */

type Phase = "pending" | "running" | "waiting" | "done" | "denied" | "stopped"
type RunStatus = "running" | "waiting" | "done" | "stopped" | "denied"

type RunState = {
  status: RunStatus
  step: number
  phases: Phase[]
  callsDone: number[]
  stepStart: number[]
  stepMs: (number | undefined)[]
  decisions: Record<string, "approved" | "denied">
  startedAt: number
  endedAt?: number
  run: number
}

type Action =
  | { type: "start-step"; now: number }
  | { type: "call-done" }
  | { type: "wait" }
  | { type: "finish-step"; now: number }
  | { type: "approve"; id: string }
  | { type: "deny"; id: string; now: number }
  | { type: "stop"; now: number }
  | { type: "restart"; now: number; count: number }

function initRun(count: number, now: number, run = 0): RunState {
  return {
    status: "running",
    step: 0,
    phases: Array(count).fill("pending"),
    callsDone: Array(count).fill(0),
    stepStart: Array(count).fill(0),
    stepMs: Array(count).fill(undefined),
    decisions: {},
    startedAt: now,
    run,
  }
}

function setAt<T>(list: T[], i: number, value: T) {
  const next = list.slice()
  next[i] = value
  return next
}

function reduce(s: RunState, a: Action): RunState {
  const i = s.step
  switch (a.type) {
    case "start-step":
      return { ...s, phases: setAt(s.phases, i, "running"), stepStart: setAt(s.stepStart, i, a.now) }
    case "call-done":
      return { ...s, callsDone: setAt(s.callsDone, i, s.callsDone[i] + 1) }
    case "wait":
      return { ...s, status: "waiting", phases: setAt(s.phases, i, "waiting") }
    case "finish-step": {
      const done = i + 1 >= s.phases.length
      return {
        ...s,
        phases: setAt(s.phases, i, "done"),
        stepMs: setAt(s.stepMs, i, a.now - s.stepStart[i]),
        step: i + 1,
        status: done ? "done" : "running",
        endedAt: done ? a.now : undefined,
      }
    }
    case "approve":
      return { ...s, status: "running", phases: setAt(s.phases, i, "running"), decisions: { ...s.decisions, [a.id]: "approved" } }
    case "deny":
      return { ...s, status: "denied", phases: setAt(s.phases, i, "denied"), decisions: { ...s.decisions, [a.id]: "denied" }, endedAt: a.now }
    case "stop":
      return { ...s, status: "stopped", phases: setAt(s.phases, i, "stopped"), endedAt: a.now }
    case "restart":
      return initRun(a.count, a.now, s.run + 1)
  }
}

/** Builds the same state shape from controlled props. */
function controlledRun(steps: RunStep[], step: number, callsDone: number, waiting: boolean, startedAt: number): RunState {
  const n = steps.length
  const at = Math.min(Math.max(step, 0), n)
  return {
    status: at >= n ? "done" : waiting ? "waiting" : "running",
    step: at,
    phases: steps.map((_, i) => (i < at ? "done" : i === at ? (waiting ? "waiting" : "running") : "pending")),
    callsDone: steps.map((s, i) => (i < at ? (s.calls?.length ?? 0) : i === at ? callsDone : 0)),
    stepStart: Array(n).fill(startedAt),
    stepMs: Array(n).fill(undefined),
    decisions: {},
    startedAt,
    run: 0,
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const TOOL_ICONS: [RegExp, LucideIcon][] = [
  [/^stripe/, Coins],
  [/^bank/, Landmark],
  [/^ledger/, Scale],
  [/search/, Search],
  [/^docs/, FileText],
  [/^(gmail|mail)/, Mail],
  [/^calendar/, Calendar],
]

function ToolIcon({ call }: { call: ToolCall }) {
  if (call.icon) return <span className="ar-tc-icon">{call.icon}</span>
  const Icon = TOOL_ICONS.find(([re]) => re.test(call.name))?.[1] ?? Hammer
  return (
    <span className="ar-tc-icon">
      <Icon aria-hidden />
    </span>
  )
}

const seconds = (ms: number) => (ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`)
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

/** Pretty JSON with spans for keys, strings, numbers and literals. */
function JsonView({ value }: { value: unknown }) {
  const out: React.ReactNode[] = []
  let k = 0
  const walk = (v: unknown, indent: string) => {
    if (v === null || typeof v === "boolean") out.push(<span key={k++} className="l">{String(v)}</span>)
    else if (typeof v === "number") out.push(<span key={k++} className="n">{v}</span>)
    else if (typeof v === "string") out.push(<span key={k++} className="s">{JSON.stringify(v)}</span>)
    else if (Array.isArray(v)) {
      if (!v.length) return void out.push("[]")
      const inline = v.every((x) => typeof x !== "object" || x === null) && JSON.stringify(v).length < 48
      out.push("[")
      v.forEach((x, i) => {
        out.push(inline ? (i ? ", " : "") : `\n${indent}  `)
        walk(x, indent + "  ")
        if (!inline && i < v.length - 1) out.push(",")
      })
      out.push(inline ? "]" : `\n${indent}]`)
    } else if (typeof v === "object") {
      const entries = Object.entries(v as Record<string, unknown>)
      out.push("{")
      entries.forEach(([key, x], i) => {
        out.push(`\n${indent}  `, <span key={k++} className="k">{JSON.stringify(key)}</span>, ": ")
        walk(x, indent + "  ")
        if (i < entries.length - 1) out.push(",")
      })
      out.push(`\n${indent}}`)
    }
  }
  walk(value, "")
  return <pre className="ar-code">{out}</pre>
}

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(null), 1400)
    return () => window.clearTimeout(id)
  }, [copied])
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key)
  }
  return { copied, copy }
}

const CheckDraw = ({ size = 11 }: { size?: number }) => (
  <svg viewBox="0 0 12 12" width={size} height={size} fill="none" aria-hidden>
    <path className="ar-draw" pathLength={1} d="m2.5 6.3 2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                 Plan card                                  */
/* -------------------------------------------------------------------------- */

function PlanCard({ title, steps, state, now }: { title: string; steps: RunStep[]; state: RunState; now: number }) {
  const elapsed = ((state.endedAt ?? now) - state.startedAt) / 1000
  const doneCount = state.phases.filter((p) => p === "done").length
  const status =
    state.status === "done"
      ? { icon: <CheckCircle2 />, text: `Done in ${Math.round(elapsed)}s` }
      : state.status === "stopped"
        ? { icon: <Square />, text: `Stopped · ${doneCount} of ${steps.length}` }
        : state.status === "denied"
          ? { icon: <X />, text: `Stopped at step ${state.step + 1}` }
          : { icon: <Rays />, text: `${state.status === "waiting" ? "Waiting" : "Running"} · ${Math.min(state.step + 1, steps.length)} of ${steps.length}` }

  return (
    <section className="ar-well ar-pl" aria-label="Plan">
      <div className="ar-card">
        <div className="ar-pl__head">
          <span className="ar-pl__meta">
            <ListChecks aria-hidden />
            Plan · {steps.length} steps
          </span>
          <h2 className="ar-pl__title">{title}</h2>
        </div>
        <ol className="ar-pl__list">
          {steps.map((step, i) => {
            const phase = state.phases[i]
            const ms = state.stepMs[i] ?? (phase === "running" || phase === "waiting" ? now - state.stepStart[i] : undefined)
            return (
              <li key={step.id} className="ar-pl__step" data-phase={phase} aria-current={i === state.step ? "step" : undefined}>
                <span className="ar-pl__marker" aria-hidden>
                  {phase === "pending" ? (
                    <span>{i + 1}</span>
                  ) : phase === "done" ? (
                    <CheckDraw key="done" />
                  ) : phase === "denied" || phase === "stopped" ? (
                    <X key="x" />
                  ) : (
                    <Rays key="run" />
                  )}
                </span>
                <span className="ar-pl__main">
                  <span className="ar-pl__name">{step.title}</span>
                  {(step.detail || step.tool) && (
                    <span className="ar-pl__sub">
                      {step.detail}
                      {step.tool && <code className="ar-tool-chip">{step.tool}</code>}
                    </span>
                  )}
                </span>
                {ms !== undefined && phase !== "pending" && (
                  <span className="ar-pl__time">{(Math.max(ms, 0) / 1000).toFixed(1)}s</span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
      <div className="ar-pl__foot" aria-live="polite">
        <span key={status.text.split(" ")[0]} className="ar-pl__status">
          {status.icon}
          {status.text}
        </span>
        {state.status !== "done" && <span className="ar-pl__elapsed">{Math.floor(elapsed)}s</span>}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Tool calls                                 */
/* -------------------------------------------------------------------------- */

function ToolCallCard({ call, done }: { call: ToolCall; done: boolean }) {
  const [open, setOpen] = React.useState(false)
  const { copied, copy } = useCopy()
  const expandable = done && (call.args !== undefined || call.result !== undefined)
  return (
    <div className="ar-tc">
      <button type="button" className="ar-tc__head" aria-expanded={expandable ? open : undefined} disabled={!expandable} onClick={() => setOpen((o) => !o)}>
        <ToolIcon call={call} />
        <span className="ar-tc__main">
          <span className="ar-tc__name">{call.name}</span>
          <span className="ar-tc__summary">{call.summary}</span>
        </span>
        <span className="ar-tc__status">
          {done ? (
            <>
              <CheckDraw key="ok" size={14} />
              <span key="t">{seconds(call.duration)}</span>
            </>
          ) : (
            <Rays key="run" />
          )}
        </span>
        {expandable && <ChevronDown className="ar-chevron" aria-hidden />}
      </button>
      {expandable && (
        <div className="ar-collapse" data-open={open}>
          <div>
            <div className="ar-tc__sections">
              {(["args", "result"] as const).map((key) =>
                call[key] === undefined ? null : (
                  <div key={key} className="ar-tc__section">
                    <div className="ar-tc__section-head">
                      <span className="ar-tc__label">{key === "args" ? "Arguments" : "Result"}</span>
                      <button
                        type="button"
                        className="ar-tc__copy"
                        aria-label={key === "args" ? "Copy arguments" : "Copy result"}
                        onClick={() => copy(key, JSON.stringify(call[key], null, 2))}
                      >
                        {copied === key ? <Check /> : <Copy />}
                      </button>
                    </div>
                    <JsonView value={call[key]} />
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolGroup({ calls, done, running }: { calls: ToolCall[]; done: number; running: boolean }) {
  // Open while the tools run, folded once they're done – until someone toggles it.
  const [toggled, setToggled] = React.useState<boolean | null>(null)
  const open = toggled ?? running
  const visible = calls.slice(0, Math.min(done + (running ? 1 : 0), calls.length))
  const total = calls.slice(0, done).reduce((sum, c) => sum + c.duration, 0)
  const label = running ? "Using tools…" : `Used ${done} tool${done === 1 ? "" : "s"}`
  if (!visible.length) return null
  return (
    <div className="ar-tc-group">
      <button type="button" className="ar-tc-group__head" aria-expanded={open} onClick={() => setToggled(!open)}>
        <span className="ar-tc-group__stack" aria-hidden>
          {visible.map((c, i) => (
            <ToolIcon key={i} call={c} />
          ))}
        </span>
        <span key={label} className="ar-tc-group__title">
          <span className={cn("ar-tc-group__label", running && "as-shimmer")} data-text={label}>
            {label}
          </span>
          {total > 0 && <span className="ar-tc-group__time">· {seconds(total)}</span>}
        </span>
        <ChevronDown className="ar-chevron" aria-hidden />
      </button>
      <div className="ar-collapse" data-open={open}>
        <div>
          <div className="ar-tc-group__list">
            {visible.map((c, i) => (
              <ToolCallCard key={i} call={c} done={i < done} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Live pill at the bottom of the feed: its label blurs between states and the pill glides to the new width. */
function LivePill({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const inRef = React.useRef<HTMLSpanElement>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 340)
    return () => window.clearTimeout(id)
  }, [leaving])
  React.useLayoutEffect(() => {
    const el = inRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [shown])
  return (
    <div className="ar-tl" role="status">
      <Rays />
      <span className="ar-tl__text" style={width !== null ? { width } : undefined}>
        {leaving !== null && (
          <span key={`o-${leaving}`} className="ar-tl__out" aria-hidden>
            {leaving}
          </span>
        )}
        <span key={`i-${shown}`} ref={inRef} className={cn("as-shimmer", leaving !== null && "ar-tl__in")} data-text={shown}>
          {shown}
        </span>
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Approval                                  */
/* -------------------------------------------------------------------------- */

const RISK = { low: "Low", medium: "Medium", high: "High" }

function ApprovalCard({
  step,
  index,
  decision,
  pending,
  onApprove,
  onDeny,
}: {
  step: RunStep
  index: number
  decision?: "approved" | "denied"
  pending: boolean
  onApprove: () => void
  onDeny: () => void
}) {
  const ap = step.approval!
  React.useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onApprove()
      } else if (e.key === "Escape") onDeny()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [pending, onApprove, onDeny])

  return (
    <div className="ar-well ar-ap">
      <div className="ar-well__label">
        Step {index + 1}
        {step.tool && ` · ${step.tool}`}
      </div>
      {decision ? (
        <div key="done" className="ar-card ar-ap__done">
          {decision === "approved" ? <CheckCircle2 style={{ color: "var(--as-green)" }} /> : <X style={{ color: "var(--as-red)" }} />}
          <span>{ap.title}</span>
          <em>{decision === "approved" ? "Approved" : "Denied"}</em>
        </div>
      ) : (
        <div key="pending" className="ar-card">
          <div className="ar-ap__head">
            <span className="ar-ap__icon" aria-hidden>
              <Mail />
            </span>
            <span style={{ minWidth: 0 }}>
              <div className="ar-ap__title">{ap.title}</div>
              <div className="ar-ap__desc">{ap.description}</div>
            </span>
            <span className="ar-risk" data-risk={ap.risk}>
              <i aria-hidden />
              {RISK[ap.risk]}
              <span className="sr-only"> risk</span>
            </span>
          </div>
          <dl className="ar-ap__preview" style={{ margin: "14px 0 0" }}>
            {ap.details.map((d) => (
              <React.Fragment key={d.label}>
                <dt>{d.label}</dt>
                <dd>{d.value}</dd>
              </React.Fragment>
            ))}
          </dl>
          <div className="ar-ap__foot">
            <ShellButton label="Deny" kbd="Esc" onClick={onDeny} disabled={!pending} />
            <ShellButton variant="primary" label="Approve" kbd="⌘↵" onClick={onApprove} disabled={!pending} />
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Diff                                    */
/* -------------------------------------------------------------------------- */

type Segment = { type: "eq"; text: string } | { type: "chg"; del: string; ins: string; id: number }

/** Word-level diff (longest common subsequence), grouped into changes. */
function diffWords(a: string, b: string): Segment[] {
  const A = a.match(/\s+|[^\s]+/g) ?? []
  const B = b.match(/\s+|[^\s]+/g) ?? []
  const n = A.length
  const m = B.length
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const segs: Segment[] = []
  let id = 0
  const pushEq = (t: string) => {
    const last = segs[segs.length - 1]
    if (last?.type === "eq") last.text += t
    else segs.push({ type: "eq", text: t })
  }
  const pushChg = (del: string, ins: string) => {
    const last = segs[segs.length - 1]
    if (last?.type === "chg") {
      last.del += del
      last.ins += ins
    } else segs.push({ type: "chg", del, ins, id: id++ })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      // A lone space between two changes belongs to the change, so "a b" → "c d" is one edit.
      const prev = segs[segs.length - 1]
      if (/^\s+$/.test(A[i]) && prev?.type === "chg" && i + 1 < n && j + 1 < m && A[i + 1] !== B[j + 1]) pushChg(A[i], B[j])
      else pushEq(A[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) pushChg(A[i++], "")
    else pushChg("", B[j++])
  }
  while (i < n) pushChg(A[i++], "")
  while (j < m) pushChg("", B[j++])
  // Move whitespace both sides end with out of the change.
  return segs.flatMap((s) => {
    if (s.type !== "chg") return [s]
    const tail = (s.del.match(/\s+$/)?.[0] ?? "") && (s.ins.match(/\s+$/)?.[0] ?? "")
    if (!tail || !s.del.endsWith(tail) || !s.ins.endsWith(tail)) return [s]
    return [{ ...s, del: s.del.slice(0, -tail.length), ins: s.ins.slice(0, -tail.length) }, { type: "eq" as const, text: tail }]
  })
}

function DiffCard({ draft }: { draft: RunDraft }) {
  const segs = React.useMemo(() => diffWords(draft.original, draft.suggested), [draft.original, draft.suggested])
  const changes = segs.filter((s): s is Extract<Segment, { type: "chg" }> => s.type === "chg")
  const [decisions, setDecisions] = React.useState<Record<number, "accept" | "reject">>({})
  const [history, setHistory] = React.useState<Record<number, "accept" | "reject">[]>([])
  const [active, setActive] = React.useState<number | null>(null)
  const pending = changes.filter((c) => !decisions[c.id])

  // Keep the accept/reject popover inside the card: nudge it sideways if it would spill over.
  const bodyRef = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const pop = bodyRef.current?.querySelector<HTMLElement>(".ar-df__pop")
    const card = bodyRef.current?.closest<HTMLElement>(".ar-card")
    if (!pop || !card) return
    pop.style.translate = ""
    const p = pop.getBoundingClientRect()
    const c = card.getBoundingClientRect()
    const shift = p.right > c.right - 6 ? c.right - 6 - p.right : p.left < c.left + 6 ? c.left + 6 - p.left : 0
    if (shift) pop.style.translate = `${shift}px 0`
  }, [active, decisions])

  const decide = (next: Record<number, "accept" | "reject">) => {
    setHistory((h) => [...h, decisions])
    setDecisions(next)
  }
  const resolve = (id: number, d: "accept" | "reject") => {
    decide({ ...decisions, [id]: d })
    const rest = pending.filter((c) => c.id !== id)
    const after = rest.find((c) => c.id > id) ?? rest[0]
    setActive(after ? after.id : null)
  }
  const all = (d: "accept" | "reject") => {
    decide(Object.fromEntries(changes.map((c) => [c.id, decisions[c.id] ?? d])))
    setActive(null)
  }
  const undo = () => {
    setDecisions(history[history.length - 1] ?? {})
    setHistory((h) => h.slice(0, -1))
  }
  const step = (dir: 1 | -1) => {
    if (!pending.length) return
    const idx = pending.findIndex((c) => c.id === active)
    const next = pending[(idx + dir + pending.length) % pending.length] ?? pending[0]
    setActive(next.id)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (active === null || decisions[active]) return
    if (e.key === "y" || e.key === "Y") resolve(active, "accept")
    else if (e.key === "n" || e.key === "N") resolve(active, "reject")
    else if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else return
    e.preventDefault()
  }

  return (
    <div className="ar-well ar-df">
      <div className="ar-well__label">
        <Sparkles aria-hidden />
        {draft.label ?? "Draft"}
      </div>
      <div className="ar-card">
        <div className="ar-df__head">
          {pending.length ? (
            <>
              <span className="ar-df__count">
                <span key={pending.length} className="ar-df__num" style={{ animation: "as-pop .3s var(--as-ease) backwards" }}>
                  {pending.length}
                </span>
                <span className="sr-only">suggestions</span>
              </span>
              <span className="ar-df__actions">
                <button type="button" className="ar-df__icon" aria-label="Previous suggestion" onClick={() => step(-1)}>
                  <ChevronLeft />
                </button>
                <button type="button" className="ar-df__icon" aria-label="Next suggestion" onClick={() => step(1)}>
                  <ChevronRight />
                </button>
                <ShellButton label="Reject all" onClick={() => all("reject")} />
                <ShellButton variant="primary" label="Accept all" onClick={() => all("accept")} />
              </span>
            </>
          ) : (
            <>
              <span className="ar-df__count" style={{ animation: "as-fade .3s var(--as-ease) backwards" }}>
                <CheckCircle2 aria-hidden />
                All suggestions reviewed
              </span>
              <span className="ar-df__actions">
                <ShellButton label="Undo" icon={<Undo2 />} onClick={undo} />
              </span>
            </>
          )}
        </div>
        <div className="ar-df__body" ref={bodyRef} tabIndex={0} onKeyDown={onKey} aria-label="Suggested changes. Y accepts, N rejects, arrows move.">
          {segs.map((s, i) => {
            if (s.type === "eq") return <React.Fragment key={i}>{s.text}</React.Fragment>
            const d = decisions[s.id]
            if (d) return <span key={i} className="ar-resolved">{d === "accept" ? s.ins : s.del}</span>
            const isActive = active === s.id
            return (
              <span
                key={i}
                className="ar-chg"
                data-active={isActive || undefined}
                onClick={() => setActive(s.id)}
              >
                {s.del && <span className="ar-del">{s.del}</span>}
                {s.ins && <span className="ar-ins">{s.ins}</span>}
                {isActive && (
                  <span className="ar-df__pop" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="ar-df__pbtn" aria-label="Accept suggestion" onClick={() => resolve(s.id, "accept")}>
                      <Check /> Accept <kbd>Y</kbd>
                    </button>
                    <span className="ar-df__sep" />
                    <button type="button" className="ar-df__pbtn" aria-label="Reject suggestion" onClick={() => resolve(s.id, "reject")}>
                      <X /> Reject <kbd>N</kbd>
                    </button>
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  AgentRun                                  */
/* -------------------------------------------------------------------------- */

const PILL: Record<RunStatus, { tone: string; text: string }> = {
  running: { tone: "blue", text: "Running" },
  waiting: { tone: "amber", text: "Needs input" },
  done: { tone: "green", text: "Done" },
  stopped: { tone: "gray", text: "Stopped" },
  denied: { tone: "red", text: "Denied" },
}

export function AgentRun({
  title = "Close the September books",
  steps = defaultRunSteps,
  draft = defaultRunDraft,
  agent = "Finance ops",
  autoRun = true,
  step: stepProp = 0,
  callsDone: callsDoneProp = 0,
  waiting: waitingProp = false,
  onApprove,
  onDeny,
  onStop,
  onDone,
  onNavigate,
  workspace = "Northwind",
  user = { name: "Sam Rivera" },
  sideTools,
  className,
}: AgentRunProps) {
  const [sim, dispatch] = React.useReducer(reduce, steps.length, (n) => initRun(n, Date.now()))
  const [mountedAt] = React.useState(() => Date.now())
  const state = autoRun ? sim : controlledRun(steps, stepProp, callsDoneProp, waitingProp, mountedAt)
  const [panel, setPanel] = React.useState(true)

  // Live clock while the run is going.
  const [now, setNow] = React.useState(() => Date.now())
  const live = state.status === "running" || state.status === "waiting"
  React.useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [live])

  // The simulation: start a step, run its calls one by one, wait for approval, finish.
  React.useEffect(() => {
    if (!autoRun || sim.status !== "running") return
    const i = sim.step
    const s = steps[i]
    if (!s) return
    const phase = sim.phases[i]
    const calls = s.calls ?? []
    const after = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms)
      return () => window.clearTimeout(id)
    }
    if (phase === "pending") return after(i === 0 ? 450 : 250, () => dispatch({ type: "start-step", now: Date.now() }))
    if (sim.callsDone[i] < calls.length) {
      const call = calls[sim.callsDone[i]]
      return after(call.duration + (sim.callsDone[i] === 0 ? 350 : 120), () => dispatch({ type: "call-done" }))
    }
    if (s.approval && !sim.decisions[s.id]) return after(300, () => dispatch({ type: "wait" }))
    return after(380, () => dispatch({ type: "finish-step", now: Date.now() }))
  }, [autoRun, sim, steps])

  const onDoneRef = React.useRef(onDone)
  React.useEffect(() => {
    onDoneRef.current = onDone
  })
  React.useEffect(() => {
    if (state.status === "done") onDoneRef.current?.()
  }, [state.status])

  const approve = React.useCallback(() => {
    const s = steps[state.step]
    if (!s || state.status !== "waiting") return
    if (autoRun) dispatch({ type: "approve", id: s.id })
    onApprove?.(s.id)
  }, [steps, state.step, state.status, autoRun, onApprove])
  const deny = React.useCallback(() => {
    const s = steps[state.step]
    if (!s || state.status !== "waiting") return
    if (autoRun) dispatch({ type: "deny", id: s.id, now: Date.now() })
    onDeny?.(s.id)
  }, [steps, state.step, state.status, autoRun, onDeny])

  const elapsed = ((state.endedAt ?? now) - state.startedAt) / 1000
  const startedLabel = new Date(state.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  const pill = PILL[state.status]
  const totalCalls = state.callsDone.reduce((a, b) => a + b, 0)
  const approvalIndex = steps.findIndex((s) => s.approval)
  const approvalStep = approvalIndex >= 0 ? steps[approvalIndex] : undefined
  const showApproval = approvalStep && state.phases[approvalIndex] !== "pending" && (state.callsDone[approvalIndex] >= (approvalStep.calls?.length ?? 0) || state.decisions[approvalStep.id])
  const needsInput = state.status === "waiting" ? 1 : 0

  const current = steps[state.step]
  const runningCall = current?.calls?.[state.callsDone[state.step]]
  const liveText = state.status === "waiting" ? "Waiting for your approval" : runningCall ? `Running ${runningCall.name}` : "Thinking…"
  const shownEntries = steps.map((s, i) => ({ s, i })).filter(({ i }) => state.phases[i] !== "pending")

  return (
    <AppShell nav={RUN_NAV} active="Runs" onNavigate={onNavigate} workspace={workspace} user={user} sideTools={sideTools} className={className}>
      <style href="agent-run" precedence="default">
        {CSS}
      </style>
      <div className="ar" data-panel={panel ? "open" : "closed"} key={sim.run}>
        <div className="ar-main">
          <header className="ar-bar">
            <nav className="ar-crumbs" aria-label="Breadcrumb">
              <button type="button" className="ar-crumb" onClick={() => onNavigate?.("Runs")}>
                <Play aria-hidden />
                Runs
              </button>
              <span aria-hidden>/</span>
              <strong>{title}</strong>
              <span className="ar-pill" data-tone={pill.tone}>
                <i aria-hidden />
                {pill.text}
              </span>
            </nav>
            <div className="ar-tools">
              <span className="ar-time">
                {live ? (
                  <>
                    <Clock aria-hidden />
                    Started {startedLabel} · {clock(elapsed)}
                  </>
                ) : (
                  <>
                    <CheckCircle2 aria-hidden />
                    {state.status === "done" ? `Done in ${Math.round(elapsed)}s` : `Ran for ${Math.round(elapsed)}s`}
                  </>
                )}
              </span>
              {live ? (
                <ShellButton
                  label="Stop run"
                  icon={<Square />}
                  onClick={() => {
                    if (autoRun) dispatch({ type: "stop", now: Date.now() })
                    onStop?.()
                  }}
                />
              ) : (
                <ShellButton
                  variant="primary"
                  label="Run again"
                  icon={<RotateCcw />}
                  onClick={() => autoRun && dispatch({ type: "restart", now: Date.now(), count: steps.length })}
                />
              )}
              <button type="button" className="as-icon-btn" aria-label="Run options">
                <MoreHorizontal />
              </button>
              <button
                type="button"
                className="as-icon-btn"
                aria-label={panel ? "Hide side panel" : "Show side panel"}
                aria-pressed={panel}
                onClick={() => setPanel((p) => !p)}
              >
                <PanelRight />
              </button>
            </div>
          </header>

          <div className="ar-scroll">
            <div className="ar-column">
              <PlanCard title={title} steps={steps} state={state} now={now} />

              <section className="ar-feed" aria-label="Activity">
                <div className="ar-label">Activity</div>
                {shownEntries.map(({ s, i }) => {
                  const phase = state.phases[i]
                  const decision = state.decisions[s.id]
                  return (
                    <div key={s.id} className="ar-entry">
                      <span className="ar-num" aria-hidden>
                        {i + 1}
                      </span>
                      <div className="ar-entry__head">{s.title}</div>
                      {!!s.calls?.length && <ToolGroup calls={s.calls} done={state.callsDone[i]} running={phase === "running" && state.status === "running"} />}
                      {phase === "waiting" && (
                        <div className="ar-note" data-tone="amber">
                          <ShieldCheck aria-hidden /> Waiting for your approval
                        </div>
                      )}
                      {decision === "approved" && (
                        <div className="ar-note" data-tone="green">
                          <CheckCircle2 aria-hidden /> You approved this step
                        </div>
                      )}
                      {decision === "denied" && (
                        <div className="ar-note" data-tone="red">
                          <X aria-hidden /> You denied this step – the run stopped here
                        </div>
                      )}
                      {phase === "stopped" && (
                        <div className="ar-note" data-tone="red">
                          <Square aria-hidden /> Stopped by you
                        </div>
                      )}
                    </div>
                  )
                })}
                {live && <LivePill text={liveText} />}
              </section>
            </div>
          </div>
        </div>

        <div className="ar-scrim" onClick={() => setPanel(false)} aria-hidden />
        <aside className="ar-panel" aria-label="Run details">
          <div className="ar-panel__bar">
            Needs your input
            {needsInput > 0 && <span className="ar-count">{needsInput}</span>}
          </div>
          <div className="ar-panel__body">
            <section className="ar-section">
              {showApproval && approvalStep ? (
                <ApprovalCard
                  step={approvalStep}
                  index={approvalIndex}
                  decision={state.decisions[approvalStep.id]}
                  pending={state.status === "waiting" && state.step === approvalIndex}
                  onApprove={approve}
                  onDeny={deny}
                />
              ) : (
                <div className="ar-empty">
                  <ShieldCheck aria-hidden />
                  <strong>Nothing to review yet</strong>
                  <span>The agent checks with you here before it sends, pays or books anything.</span>
                </div>
              )}
            </section>
            <section className="ar-section">
              <div className="ar-label">Draft</div>
              <DiffCard draft={draft} />
            </section>
            <section className="ar-section">
              <div className="ar-label">Details</div>
              <div className="ar-details">
                <div>
                  <Bot aria-hidden /> Agent <b>{agent}</b>
                </div>
                <div>
                  <User aria-hidden /> Triggered by <b>{user.name}</b>
                </div>
                <div>
                  <Hammer aria-hidden /> Tool calls <b>{totalCalls}</b>
                </div>
                <div>
                  <Coins aria-hidden /> Cost <b>${(totalCalls * 0.0175).toFixed(2)}</b>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

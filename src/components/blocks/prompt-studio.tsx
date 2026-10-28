"use client"

import * as React from "react"
import { Check, ChevronDown, Copy, Diamond, GitCompare, Hexagon, Play, RotateCw, Rocket, Sparkles, Square, TriangleAlert, Undo2 } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PromptEffort = "low" | "medium" | "high" | "xhigh" | "max"

export type PromptVersion = {
  id: string
  /** Short label, e.g. "v4". */
  label: string
  /** What changed, shown as the row's title in the version menu. */
  message: string
  author: { name: string }
  /** ISO date. */
  createdAt: string
  system: string
  user: string
}

export type PromptTestCase = { id: string; label: string; /** Variable name to value. */ values: Record<string, string> }

export type PromptModel = {
  id: string
  name: string
  /** Label on the chip. */
  short: string
  mark?: "spark" | "hex" | "diamond"
  /** Price per million input tokens, in dollars. */
  input: number
  /** Price per million output tokens, in dollars. */
  output: number
  /** Marks the prices as illustrative. */
  sample?: boolean
  defaultEffort?: PromptEffort
}

export type PromptRunRequest = {
  raw: { system: string; user: string }
  rendered: { system: string; user: string }
  values: Record<string, string>
  model: string
  effort: PromptEffort
  caseId: string
  versionId: string
}

export type PromptTemplate = { system: string; user: string }

export type PromptStudioProps = {
  /** Name of the prompt, shown in the header. */
  name?: string
  /** Saved versions, newest first. */
  versions?: PromptVersion[]
  /** The version open in the editor. Defaults to the newest. */
  versionId?: string
  /** The version production serves. `null` for none. Defaults to the open version. */
  productionId?: string | null
  /** The draft the editor opens with. Defaults to the open version's text. */
  template?: PromptTemplate
  /** Variable order for colours and fields. Variables found in the text but not listed are added after. */
  variables?: string[]
  /** Saved test cases. The first one is loaded on mount. */
  testCases?: PromptTestCase[]
  /** Models for the model menu. */
  models?: PromptModel[]
  /** Id of the model selected first. */
  defaultModel?: string
  /** Effort selected first. Defaults to the model's own default. */
  defaultEffort?: PromptEffort
  /** Reference moment for relative dates. Defaults to now, or to Oct 20, 2026 for the sample versions so the demo never ages. */
  now?: string | number | Date
  /** Runs the prompt. Return the whole reply or an async iterable of text deltas; throw to show the error state with Retry. Stop aborts `signal`. Without it runs are simulated. */
  onRun?: (request: PromptRunRequest, signal: AbortSignal) => Promise<string | AsyncIterable<string>> | AsyncIterable<string>
  /** A version was promoted to production, or the promotion was undone (ids swapped). */
  onPromote?: (versionId: string, previousId: string | null) => void
  /** The draft changed. Use it for autosave. */
  onTemplateChange?: (template: PromptTemplate) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

const SYS_V4 = `You are a support agent for Birchwell, an online outdoor gear shop. Write a warm, specific reply in under 120 words.

Follow this policy exactly: {{policy}}

- Greet {{customer_name}} by first name, once.
- Quote order {{order_id}} so they can find it.
- Never promise a date the carrier has not confirmed.
- If the policy does not cover the request, offer to escalate to a team lead.`
const USER_V4 = "Reply to the latest message from {{customer_name}} about order {{order_id}}."

const SAMPLE_VERSIONS: PromptVersion[] = [
  { id: "v4", label: "v4", message: "Escalate when the policy falls short", author: { name: "Ines Moreau" }, createdAt: "2026-10-17T15:20:00Z", system: SYS_V4, user: USER_V4 },
  {
    id: "v3",
    label: "v3",
    message: "Shorter replies that quote the order",
    author: { name: "Dev Patel" },
    createdAt: "2026-10-13T11:05:00Z",
    system: `You are a support agent for Birchwell, an online outdoor gear shop. Write a warm, specific reply in under 120 words.

Follow this policy exactly: {{policy}}

- Greet {{customer_name}} by first name, once.
- Quote order {{order_id}} so they can find it.
- Never promise a date the carrier has not confirmed.`,
    user: USER_V4,
  },
  {
    id: "v2",
    label: "v2",
    message: "Greet by name, no promised dates",
    author: { name: "Sunil Rao" },
    createdAt: "2026-10-06T09:40:00Z",
    system: `You are a support agent for Birchwell. Write a friendly reply in under 150 words.

Follow this policy: {{policy}}

- Greet {{customer_name}} by name.
- Never promise a delivery date.`,
    user: "Answer {{customer_name}}'s message about order {{order_id}}.",
  },
  {
    id: "v1",
    label: "v1",
    message: "First draft from the support macros",
    author: { name: "Ines Moreau" },
    createdAt: "2026-09-30T14:10:00Z",
    system: `You are a support agent for Birchwell. Answer the customer politely.

Policy: {{policy}}`,
    user: "Answer the message from {{customer_name}}.",
  },
]

const SAMPLE_CASES: PromptTestCase[] = [
  { id: "late", label: "Late order", values: { customer_name: "Mina Okafor", order_id: "BW-30417", policy: "Orders more than 5 business days late get their shipping fee refunded." } },
  { id: "damaged", label: "Damaged", values: { customer_name: "Leo Brandt", order_id: "BW-29876", policy: "Damaged items are replaced or refunded within 30 days, with a photo." } },
  { id: "window", label: "Past window", values: { customer_name: "Ana Duarte", order_id: "BW-28102", policy: "Returns are accepted within 45 days of delivery." } },
]

const SAMPLE_MODELS: PromptModel[] = [
  { id: "nova-5", name: "Nova 5", short: "Nova 5", mark: "spark", input: 3, output: 15, sample: true, defaultEffort: "high" },
  { id: "atlas-2", name: "Atlas 2 Pro", short: "Atlas 2", mark: "hex", input: 2, output: 10, sample: true, defaultEffort: "medium" },
  { id: "sage-mini", name: "Sage Mini", short: "Sage Mini", mark: "diamond", input: 0.4, output: 2, sample: true, defaultEffort: "low" },
]

const EFFORTS: { id: PromptEffort; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "Xhigh" },
  { id: "max", label: "Max" },
]

const SIM_REPLY: Record<string, (v: Record<string, string>) => string> = {
  late: (v) => `Hi ${first(v.customer_name)},\n\nThanks for flagging this, and I'm sorry the wait has dragged on. I checked order ${v.order_id}: it left our warehouse on time, but the carrier hasn't posted a scan since Tuesday. I've opened a trace and will email you as soon as they confirm where it is.\n\nBecause the order is now more than 5 business days late, I've refunded your shipping fee. It should reach your card within 3 to 5 days.\n\nBirchwell Support`,
  damaged: (v) => `Hi ${first(v.customer_name)},\n\nI'm sorry the tent arrived damaged. For order ${v.order_id}, we can replace it or refund it, whichever you prefer. Could you reply with one photo of the damage? That's all we need.\n\nOnce I have it, I'll start the replacement right away and send you the tracking details when the carrier confirms them.\n\nBirchwell Support`,
  window: (v) => `Hi ${first(v.customer_name)},\n\nThanks for getting in touch about order ${v.order_id}. Returns are accepted within 45 days of delivery, and this order is just past that window, so I can't approve it myself.\n\nI'd like to ask a team lead to review it. I've passed along your details and they will reply by email.\n\nBirchwell Support`,
}
const GENERIC_REPLY = (v: Record<string, string>) => `Hi ${first(v.customer_name ?? "there")},\n\nThanks for your message about ${v.order_id ? `order ${v.order_id}` : "your order"}. I've looked into it and will follow up shortly with the next step.\n\nBirchwell Support`
const first = (s: string | undefined) => (s ?? "there").split(" ")[0] || "there"

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pst {
  --pst-ink: #0a0a0a;
  --pst-surface: #fff;
  --pst-accent: #0060e2;
  --pst-live: #1f9d55;
  --pst-warn: #d9480f;
  --pst-on-ink: #fff;
  --pst-t1: var(--pst-ink);
  --pst-t2: color-mix(in oklab, var(--pst-ink) 70%, transparent);
  --pst-t3: color-mix(in oklab, var(--pst-ink) 54%, transparent);
  --pst-wash: color-mix(in oklab, var(--pst-ink) 3.5%, transparent);
  --pst-hover: color-mix(in oklab, var(--pst-ink) 5%, transparent);
  --pst-soft: color-mix(in oklab, var(--pst-ink) 6%, transparent);
  --pst-line: color-mix(in oklab, var(--pst-ink) 9%, transparent);
  --pst-s1: #2f6fe0; --pst-s2: #7a3fd0; --pst-s3: #d98a0b; --pst-s4: #1d9a74;
  --pst-glint: rgb(255 255 255 / .85);
  --pst-pop: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --pst-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: 760px; margin-inline: auto; container-type: inline-size;
  color: var(--pst-t1);
  font-family: var(--pst-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 19.6px; letter-spacing: -.01em; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .pst {
  --pst-ink: #fff;
  --pst-surface: #161618;
  --pst-accent: #4d8dff;
  --pst-live: #4cc38a;
  --pst-warn: #ff9b6b;
  --pst-on-ink: #0a0a0a;
  --pst-t2: color-mix(in oklab, var(--pst-ink) 66%, transparent);
  --pst-t3: color-mix(in oklab, var(--pst-ink) 48%, transparent);
  --pst-wash: color-mix(in oklab, var(--pst-ink) 6%, transparent);
  --pst-hover: color-mix(in oklab, var(--pst-ink) 8%, transparent);
  --pst-soft: color-mix(in oklab, var(--pst-ink) 8%, transparent);
  --pst-line: color-mix(in oklab, var(--pst-ink) 13%, transparent);
  --pst-s1: #7aa8ff; --pst-s2: #b995ff; --pst-s3: #f2b04a; --pst-s4: #55d0a6;
  --pst-glint: rgb(255 255 255 / .9);
  --pst-pop: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35);
}
.pst *, .pst *::before, .pst *::after { box-sizing: border-box }
:where(.pst) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; letter-spacing: inherit }
.pst button:disabled { cursor: default }
.pst :focus-visible { outline: 2px solid color-mix(in oklab, var(--pst-accent) 60%, transparent); outline-offset: 1px }
.pst .pst-edit:focus-visible, .pst .pst-input:focus-visible { outline: none }
.pst-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }
.pst[data-open] { z-index: 30 }

.pst-card { position: relative; border-radius: 34px; border: 1px solid var(--pst-line); background: var(--pst-surface) }

/* Header */
.pst-head { position: relative; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; padding: 14px 16px 14px 28px; border-bottom: 1px solid var(--pst-line) }
.pst-titleGroup { display: flex; align-items: center; gap: 10px; min-width: 0 }
.pst-title { margin: 0; font-size: 16px; line-height: 17.6px; font-weight: 500; letter-spacing: -.015em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.pst-anchor { position: relative; display: flex }
.pst-chipBtn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 9px 0 11px; border-radius: 999px; border: 1px solid var(--pst-line); background: var(--pst-surface); white-space: nowrap; transition: background-color .14s var(--pst-ease) }
.pst-chipBtn:hover, .pst-chipBtn[aria-expanded="true"] { background: var(--pst-wash) }
.pst-chipBtn[data-model] { padding: 0 9px }
.pst-chipVer { font-weight: 500 }
.pst-chipState, .pst-effLbl { color: var(--pst-t2) }
.pst-swap { display: inline-flex; align-items: center; gap: 6px; animation: pst-in .16s var(--pst-ease) backwards }
.pst-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--pst-live) }
.pst-chev { flex: none; color: var(--pst-t3); transition: transform .2s var(--pst-ease) }
[aria-expanded="true"] > .pst-chev { transform: rotate(180deg) }
.pst-mark { flex: none; display: inline-grid; place-items: center; width: 14px; height: 14px; color: var(--pst-mk, var(--pst-t1)) }
.pst-menu { position: absolute; top: calc(100% + 8px); z-index: 40; padding: 6px; border-radius: 26px; background: var(--pst-surface); border: 1px solid var(--pst-line); box-shadow: var(--pst-pop); animation: pst-pop .18s var(--pst-ease) backwards; transform-origin: 0 0 }
.pst-menu[data-align="start"] { left: 0; width: 351px; max-width: calc(100cqw - 24px) }
.pst-menu[data-align="end"] { right: 0; width: 300px; max-width: calc(100cqw - 24px); transform-origin: 100% 0 }
.pst-vRow { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 18px; transition: background-color .1s var(--pst-ease) }
.pst-vRow:hover, .pst-vRow:focus-visible, .pst-vRow[aria-checked="true"] { background: var(--pst-wash) }
.pst-vRow:focus-visible { outline-offset: -2px }
.pst-avatar { flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--pst-line); font-size: 10.5px; font-weight: 600; color: #fff }
.pst-vText { display: grid; flex: 1; min-width: 0 }
.pst-vMsg { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; line-height: 22px }
.pst-vMeta { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 22px; font-size: 12px; line-height: 16.8px; color: var(--pst-t3) }
.pst-vMeta b { font-weight: 500; color: var(--pst-t2) }
.pst-prod { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid var(--pst-line); background: var(--pst-surface); color: var(--pst-t2); white-space: nowrap }
.pst-mSep { height: 1px; margin: 6px -6px; background: var(--pst-line) }
.pst-mAct { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 0 10px; border-radius: 16px; transition: background-color .1s var(--pst-ease) }
.pst-mAct:hover:not(:disabled), .pst-mAct:focus-visible { background: var(--pst-wash) }
.pst-mAct:disabled { opacity: .4 }
.pst-mAct svg { flex: none; color: var(--pst-t2) }
.pst-mStatus { padding: 4px 2px 4px 10px; font-size: 12px; line-height: 16.8px; color: var(--pst-t3) }
.pst-mItem { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 44px; padding: 6px 10px; border-radius: 18px; transition: background-color .1s var(--pst-ease) }
.pst-mItem:hover, .pst-mItem:focus-visible { background: var(--pst-wash) }
.pst-mItem:focus-visible { outline-offset: -2px }
.pst-mNote { font-size: 12px; line-height: 16.8px; color: var(--pst-t3) }
.pst-effHead { display: flex; justify-content: space-between; padding: 8px 10px 4px; font-size: 12px; line-height: 16.8px; color: var(--pst-t2) }
.pst-effHead span:last-child { color: var(--pst-t3) }
.pst-effRow { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); margin: 0 2px 2px; padding: 3px; border-radius: 17px; background: var(--pst-wash) }
.pst-effThumb { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / 5); border-radius: 13px; background: var(--pst-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .08), 0 0 0 .5px var(--pst-line); transform: translateX(calc(var(--i) * 100%)); transition: transform .35s var(--pst-ease) }
.pst-eff { position: relative; height: 30px; border-radius: 13px; font-size: 12px; text-align: center !important; color: var(--pst-t2) }
.pst-eff[aria-checked="true"] { color: var(--pst-t1) }

/* Editor */
.pst-editor { padding: 10px 16px 12px; border-bottom: 1px solid var(--pst-line) }
.pst-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px }
.pst-seg { position: relative; display: inline-flex; gap: 2px; border-radius: 999px }
.pst-seg[data-box] { padding: 2px; border: 1px solid var(--pst-line) }
.pst-segOpt { position: relative; z-index: 1; display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; color: var(--pst-t3); transition: color .16s var(--pst-ease); white-space: nowrap }
.pst-segOpt[aria-selected="true"], .pst-segOpt[aria-checked="true"] { color: var(--pst-t1) }
.pst-segHi { position: absolute; z-index: 0; top: var(--t, 0); left: 0; height: 30px; width: var(--w, 0); border-radius: 999px; background: var(--pst-wash); transform: translateX(var(--x, 0)); transition: transform .4s var(--pst-ease), width .4s var(--pst-ease) }
.pst-segHi[data-box] { top: 2px; left: 2px }
.pst-tokens { display: inline-flex; align-items: center; gap: 4px; padding-right: 12px; font-size: 12px; line-height: 16.8px; color: var(--pst-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.pst-tokens b { font-weight: 400; display: inline-block; animation: pst-in .16s var(--pst-ease) backwards }
.pst-stack { display: grid; padding-top: 6px }
.pst-pane { grid-area: 1 / 1; min-width: 0; position: relative }
.pst-pane[data-hidden] { visibility: hidden; pointer-events: none }
.pst-edit, .pst-diff { min-height: 80px; padding: 2px 12px 6px; font-size: 14px; line-height: 23.8px; white-space: pre-wrap; overflow-wrap: anywhere; outline: none; caret-color: var(--pst-t1); border-radius: 12px }
.pst-edit:empty::before { content: attr(data-placeholder); color: var(--pst-t3) }
.pst-chip {
  --c: var(--pst-s1); display: inline-block; padding: 1px 5px; border-radius: 6px; font-size: .93em; line-height: 1.4; white-space: nowrap; cursor: pointer; user-select: all;
  color: color-mix(in oklab, var(--c) 72%, var(--pst-ink)); background: color-mix(in oklab, var(--c) 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c) 24%, transparent);
  transition: background-color .16s var(--pst-ease), box-shadow .16s var(--pst-ease);
}
.pst-chip[data-t="2"] { --c: var(--pst-s2) } .pst-chip[data-t="3"] { --c: var(--pst-s3) } .pst-chip[data-t="4"] { --c: var(--pst-s4) }
.pst-chip[data-missing] { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c) 55%, transparent); background: transparent; border-style: dashed }
.pst-chip[data-missing] { outline: 1px dashed color-mix(in oklab, var(--c) 55%, transparent); outline-offset: -1px; box-shadow: none }
.pst-chip[data-active] { background: color-mix(in oklab, var(--c) 24%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c) 55%, transparent) }
.pst-chip[data-flash] { animation: pst-flash .7s var(--pst-ease) }
.pst-hint { display: flex; align-items: center; gap: 6px; padding: 6px 12px 0; font-size: 12px; line-height: 16.8px; color: var(--pst-t3) }
.pst-key { display: inline-block; padding: 0 4px; border-radius: 5px; border: 1px solid var(--pst-line); font-size: 11px; line-height: 15.4px; color: var(--pst-t2) }
.pst-diffBar { display: flex; align-items: center; gap: 8px; margin: 2px 12px 0; padding: 5px 5px 5px 12px; border-radius: 999px; background: var(--pst-wash); font-size: 12px; color: var(--pst-t2) }
.pst-diffBar button { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-weight: 500; color: var(--pst-t1) }
.pst-diffBar button:hover { background: var(--pst-hover) }
.pst-diff ins, .pst-diff del { border-radius: 4px; text-decoration: none }
.pst-diff ins { padding: 0 2px; background: color-mix(in oklab, var(--pst-live) 18%, transparent); color: var(--pst-t1) }
.pst-diff ins::before { content: "+"; margin-right: 3px; color: var(--pst-live); font-weight: 600 }
.pst-diff del { padding: 0 2px; background: color-mix(in oklab, var(--pst-warn) 12%, transparent); color: var(--pst-t3); text-decoration: line-through }
.pst-diff del::before { content: "\\2212"; margin-right: 3px; color: var(--pst-warn); font-weight: 600; display: inline-block; text-decoration: none }
.pst-list { position: absolute; z-index: 20; min-width: 190px; max-width: calc(100% - 24px); padding: 5px; border-radius: 16px; background: var(--pst-surface); border: 1px solid var(--pst-line); box-shadow: var(--pst-pop); animation: pst-pop .16s var(--pst-ease) backwards }
.pst-opt { display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 10px; border-radius: 11px; font-size: 13px; cursor: pointer }
.pst-opt[aria-selected="true"] { background: var(--pst-wash) }
.pst-opt i { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--c) }

/* Variables and run */
.pst-vars { padding: 14px 16px 16px }
.pst-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 10px }
.pst-field { display: grid; gap: 2px; min-width: 0 }
.pst-field[data-wide] { grid-column: span 2 }
.pst-fieldLbl { display: flex; align-items: center; gap: 6px; padding-left: 12px; font-size: 12px; line-height: 16.8px; color: color-mix(in oklab, var(--c) 72%, var(--pst-ink)) }
.pst-fieldLbl i { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--c) }
.pst-field[data-t="1"] { --c: var(--pst-s1) } .pst-field[data-t="2"] { --c: var(--pst-s2) } .pst-field[data-t="3"] { --c: var(--pst-s3) } .pst-field[data-t="4"] { --c: var(--pst-s4) }
.pst-input { width: 100%; height: 36px; padding: 0 12px; border-radius: 18px; border: 1px solid var(--pst-line); background: var(--pst-surface); font: inherit; letter-spacing: inherit; color: inherit; outline: none; text-overflow: ellipsis; transition: border-color .16s var(--pst-ease) }
.pst-input:focus { border-color: color-mix(in oklab, var(--c) 55%, transparent) }
.pst-input::placeholder { color: var(--pst-t3) }
.pst-runRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px }
.pst-run { display: inline-flex; flex: none; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 13px; border-radius: 999px; background: var(--pst-ink); color: var(--pst-on-ink); font-weight: 500; transition: opacity .16s var(--pst-ease), transform .3s var(--pst-ease) }
.pst-run:hover { opacity: .88 }
.pst-run:active { transform: scale(.96) }
.pst-runKeys { font-weight: 400; font-size: 12px; opacity: .6 }
.pst-runLabel { display: inline-grid }
.pst-runLabel > span { grid-area: 1 / 1; transition: opacity .16s var(--pst-ease), transform .16s var(--pst-ease) }
.pst-run:not([data-running]) .pst-runLabel > span:last-child, .pst-run[data-running] .pst-runLabel > span:first-child { opacity: 0; transform: translateY(2px) }

/* Output */
.pst-outFrame { overflow: hidden; border-radius: 0 0 33px 33px; background: var(--pst-wash); border-top: 1px solid var(--pst-line); transition: height .45s var(--pst-ease) }
.pst-out { padding: 12px 16px }
.pst-idle { padding: 0 12px; color: var(--pst-t3) }
.pst-idle b { font-weight: 400; color: var(--pst-t2) }
.pst-outHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px; padding-left: 12px }
.pst-status { display: inline-flex; align-items: center; gap: 8px; color: var(--pst-t2); animation: pst-in .16s var(--pst-ease) backwards }
.pst-status em { font-style: normal; color: var(--pst-t3) }
.pst-status[data-err] { color: var(--pst-warn) }
.pst-icoBtn { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; color: var(--pst-t3); transition: background-color .14s var(--pst-ease), color .14s var(--pst-ease) }
.pst-icoBtn:hover { background: var(--pst-hover); color: var(--pst-t1) }
.pst-reply { padding: 4px 12px 0; font-size: 14px; line-height: 23.1px }
.pst-reply p { margin: 0 0 10px; white-space: pre-wrap; overflow-wrap: anywhere }
.pst-reply p:last-child { margin-bottom: 0 }
.pst-chunk { animation: pst-chunk .15s linear backwards }
.pst-foot { padding: 8px 12px 0; font-size: 12px; line-height: 16.8px; color: var(--pst-t3) }
.pst-errBox { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 4px 12px 0; color: var(--pst-t2) }
.pst-retry { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--pst-line); background: var(--pst-surface); font-weight: 500 }
.pst-retry:hover { background: var(--pst-hover) }
.pst-shimmer { position: relative }
.pst-shimmer::after { content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; background: linear-gradient(90deg, transparent 38%, var(--pst-glint) 50%, transparent 62%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text; animation: pst-sweep 1.6s linear infinite }

@keyframes pst-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes pst-chunk { from { opacity: 0 } to { opacity: 1 } }
@keyframes pst-in { from { opacity: 0; transform: translateY(2px) } to { opacity: 1; transform: none } }
@keyframes pst-pop { from { opacity: 0; transform: translateY(-4px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes pst-flash { 0% { background: color-mix(in oklab, var(--c) 45%, transparent) } 100% { background: color-mix(in oklab, var(--c) 12%, transparent) } }

@container (max-width: 559px) { .pst-fields { grid-template-columns: repeat(2, minmax(0, 1fr)) } .pst-field[data-wide] { grid-column: span 2 } .pst-head { padding-left: 20px } }
@container (max-width: 479px) {
  .pst-runRow { flex-direction: column; align-items: stretch }
  .pst-runRow .pst-seg { width: 100%; justify-content: stretch } .pst-runRow .pst-segOpt { flex: 1; justify-content: center; padding: 0 6px }
  .pst-run { justify-content: center }
  .pst-head .pst-anchor:last-child { margin-left: 0 }
}
@container (max-width: 339px) { .pst-fields { grid-template-columns: minmax(0, 1fr) } .pst-field[data-wide] { grid-column: auto } }
@media (prefers-reduced-motion: reduce) { .pst *, .pst *::before, .pst *::after { animation: none !important; transition: none !important } }
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const VAR_RE = /\{\{\s*([A-Za-z_]\w*)\s*\}\}/g
const normalize = (s: string) => s.replace(VAR_RE, (_, n: string) => `{{${n}}}`)
const varsIn = (s: string) => Array.from(s.matchAll(VAR_RE), (m) => m[1])
const render = (s: string, values: Record<string, string>) => s.replace(VAR_RE, (_, n: string) => values[n] ?? "")
const hueOf = (s: string) => ["#d4623a", "#0f9d7a", "#3b6cf0", "#8a5cf5", "#c0508a", "#b0872a"][[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 6]
const initials = (s: string) => s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

type DiffOp = { k: "eq" | "del" | "ins"; text: string }
function wordDiff(a: string, b: string): DiffOp[] {
  const x = a.match(/\S+\s*/g) ?? []
  const y = b.match(/\S+\s*/g) ?? []
  const nm = (s: string) => s.trim()
  let head = 0
  while (head < x.length && head < y.length && nm(x[head]) === nm(y[head])) head++
  let tail = 0
  while (tail < x.length - head && tail < y.length - head && nm(x[x.length - 1 - tail]) === nm(y[y.length - 1 - tail])) tail++
  const xm = x.slice(head, x.length - tail)
  const ym = y.slice(head, y.length - tail)
  const n = xm.length
  const m = ym.length
  const t: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = nm(xm[i]) === nm(ym[j]) ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1])
  const ops: DiffOp[] = []
  const push = (k: DiffOp["k"], text: string) => {
    const last = ops[ops.length - 1]
    if (last && last.k === k) last.text += text
    else ops.push({ k, text })
  }
  if (head) push("eq", x.slice(0, head).join(""))
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && nm(xm[i]) === nm(ym[j])) { push("eq", ym[j]); i++; j++ }
    else if (j < m && (i === n || t[i][j + 1] >= t[i + 1][j])) push("ins", ym[j++])
    else push("del", xm[i++])
  }
  if (tail) push("eq", x.slice(x.length - tail).join(""))
  return ops
}

function relative(iso: string, now: Date) {
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 14) return "last week"
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function ModelMark({ mark }: { mark?: PromptModel["mark"] }) {
  const m = mark ?? "spark"
  const color = m === "spark" ? "#d4623a" : m === "hex" ? "#0f9d7a" : "#3b6cf0"
  const Icon = m === "spark" ? Sparkles : m === "hex" ? Hexagon : Diamond
  return <span className="pst-mark" style={{ ["--pst-mk" as string]: color }}><Icon size={14} strokeWidth={2} aria-hidden /></span>
}

const Swap = ({ k, children }: { k: string; children: React.ReactNode }) => <span key={k} className="pst-swap">{children}</span>

/** Height that follows the content with a transition (CSS cannot animate to auto). */
function AutoHeight({ children, className }: { children: React.ReactNode; className?: string }) {
  const [h, setH] = React.useState<number | undefined>(undefined)
  const inner = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => setH(el.getBoundingClientRect().height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className={className} style={{ height: h }}>
      <div ref={inner}>{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                         PromptEditor: the string is the model              */
/* -------------------------------------------------------------------------- */

export type PromptEditorProps = {
  /** The template text, with placeholders written as `{{name}}`. */
  value: string
  /** Called with the new text after every edit. Placeholders are normalised to `{{name}}`. */
  onChange: (value: string) => void
  /** Names offered after typing `{{`. */
  variables: string[]
  /** Colour slot (1 to 4) for a variable. */
  toneOf: (name: string) => number
  /** Accessible name of the text box. */
  label: string
  /** Variables without a value; their chips draw a dashed outline. */
  missing?: string[]
  /** A variable to light up, for example while its value field has focus. */
  activeVariable?: string | null
  /** Flashes every chip of a variable once. Pass a new `at` to flash again. */
  flash?: { name: string; at: number } | null
  /** A chip was clicked. */
  onChipClick?: (name: string) => void
  /** Mod+Enter was pressed. */
  onSubmit?: () => void
  placeholder?: string
}

const chipLen = (name: string) => name.length + 4

function lenOf(n: Node): number {
  if (n.nodeType === 3) return n.textContent?.length ?? 0
  const v = (n as HTMLElement).dataset?.var
  if (v) return chipLen(v)
  if (n.nodeName === "BR") return 0
  let t = 0
  n.childNodes.forEach((c) => (t += lenOf(c)))
  return t
}

function offsetOf(root: HTMLElement, node: Node, off: number): number {
  let total = 0
  const walk = (n: Node): boolean => {
    if (n === node) {
      if (n.nodeType === 3) total += off
      else for (let i = 0; i < off; i++) total += lenOf(n.childNodes[i])
      return true
    }
    const v = (n as HTMLElement).dataset?.var
    if (v) {
      if (n.contains(node)) return true
      total += chipLen(v)
      return false
    }
    if (n.nodeType === 3) { total += n.textContent?.length ?? 0; return false }
    if (n.nodeName === "BR") return false
    for (const c of Array.from(n.childNodes)) if (walk(c)) return true
    return false
  }
  walk(root)
  return total
}

function placeCaret(root: HTMLElement, offset: number) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  let rest = offset
  let done = false
  for (const c of Array.from(root.childNodes)) {
    const l = lenOf(c)
    if (c.nodeType === 3 && rest <= l) { range.setStart(c, rest); done = true; break }
    if (c.nodeType !== 3 && rest === 0) { range.setStartBefore(c); done = true; break }
    rest -= l
  }
  if (!done) range.setStart(root, root.childNodes.length)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

export function PromptEditor({ value, onChange, variables, toneOf, label, missing = [], activeVariable = null, flash = null, onChipClick, onSubmit, placeholder }: PromptEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const caretRef = React.useRef<number | null>(null)
  const undoRef = React.useRef<{ stack: { v: string; c: number }[]; i: number; at: number }>({ stack: [], i: -1, at: 0 })
  const flashed = React.useRef(0)
  const id = React.useId().replace(/:/g, "")
  const [list, setList] = React.useState<{ start: number; query: string; x: number; y: number } | null>(null)
  const [active, setActive] = React.useState(0)

  const options = list ? variables.filter((v) => v.toLowerCase().startsWith(list.query.toLowerCase())) : []
  const open = !!list && options.length > 0
  const safe = Math.min(active, Math.max(0, options.length - 1))

  /* The DOM is rebuilt from the string, so a chip can never be split. */
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const frag = document.createDocumentFragment()
    const doFlash = flash && flash.at !== flashed.current ? flash.name : null
    if (flash) flashed.current = flash.at
    let at = 0
    for (const m of value.matchAll(VAR_RE)) {
      if (m.index! > at) frag.append(document.createTextNode(value.slice(at, m.index)))
      const chip = document.createElement("span")
      const name = m[1]
      chip.className = "pst-chip"
      chip.contentEditable = "false"
      chip.dataset.var = name
      chip.dataset.t = String(toneOf(name))
      chip.textContent = name
      if (missing.includes(name)) chip.dataset.missing = ""
      if (activeVariable === name) chip.dataset.active = ""
      if (doFlash === name) chip.dataset.flash = ""
      frag.append(chip)
      at = m.index! + m[0].length
    }
    if (at < value.length) frag.append(document.createTextNode(value.slice(at)))
    if (value.endsWith("\n")) frag.append(document.createElement("br"))
    el.replaceChildren(frag)
    if (caretRef.current != null && document.activeElement === el) placeCaret(el, caretRef.current)
  }, [value, missing, activeVariable, flash, toneOf])

  const selection = (): [number, number] => {
    const el = ref.current!
    const s = window.getSelection()
    if (!s || s.rangeCount === 0 || !el.contains(s.anchorNode)) return [value.length, value.length]
    const r = s.getRangeAt(0)
    return [offsetOf(el, r.startContainer, r.startOffset), offsetOf(el, r.endContainer, r.endOffset)]
  }

  const updateList = (text: string, caret: number) => {
    const m = /\{\{(\w*)$/.exec(text.slice(0, caret))
    if (!m) return setList(null)
    const s = window.getSelection()
    const rect = s && s.rangeCount ? s.getRangeAt(0).getClientRects()[0] : undefined
    const w = wrapRef.current?.getBoundingClientRect()
    setList({ start: caret - m[0].length, query: m[1], x: rect && w ? rect.left - w.left : 12, y: rect && w ? rect.bottom - w.top + 4 : 30 })
  }

  const commit = (next: string, caret: number, group = false) => {
    const norm = normalize(next)
    const u = undoRef.current
    const now = Date.now()
    if (!(group && now - u.at < 700 && u.i === u.stack.length - 1 && u.i >= 0)) {
      u.stack = u.stack.slice(0, u.i + 1)
      u.stack.push({ v: value, c: selection()[0] })
      u.i = u.stack.length - 1
    }
    u.at = now
    caretRef.current = caret - (next.length - norm.length)
    onChange(norm)
    updateList(norm, caretRef.current)
    setActive(0)
  }

  const chipEndingAt = (pos: number) => {
    for (const m of value.matchAll(VAR_RE)) if (m.index! + m[0].length === pos) return m
    return null
  }
  const chipStartingAt = (pos: number) => {
    for (const m of value.matchAll(VAR_RE)) if (m.index === pos) return m
    return null
  }

  const onBeforeInput = (ev: InputEvent) => {
    if (ev.isComposing) return
    const [a, b] = selection()
    const type = ev.inputType
    const ins = (t: string, group = false) => commit(value.slice(0, a) + t + value.slice(b), a + t.length, group)
    ev.preventDefault()
    if (type === "insertText" || type === "insertReplacementText") return ins(ev.data ?? "", true)
    if (type === "insertFromPaste" || type === "insertFromDrop") return ins(ev.dataTransfer?.getData("text/plain") ?? "")
    if (type === "insertLineBreak" || type === "insertParagraph") return ins("\n")
    if (type === "deleteByCut") return commit(value.slice(0, a) + value.slice(b), a)
    if (type.startsWith("deleteContent") || type.startsWith("deleteWord")) {
      const back = type.endsWith("Backward")
      if (a !== b) return commit(value.slice(0, a) + value.slice(b), a)
      if (back && a > 0) {
        const chip = chipEndingAt(a)
        if (chip) return commit(value.slice(0, chip.index) + value.slice(a), chip.index!)
        let from = a - 1
        if (type.startsWith("deleteWord")) {
          from = a
          while (from > 0 && /\s/.test(value[from - 1])) from--
          while (from > 0 && /\S/.test(value[from - 1]) && !chipEndingAt(from)) from--
        }
        return commit(value.slice(0, from) + value.slice(a), from, true)
      }
      if (!back && a < value.length) {
        const chip = chipStartingAt(a)
        const to = chip ? a + chip[0].length : a + 1
        return commit(value.slice(0, a) + value.slice(to), a, true)
      }
      return
    }
    if (type === "historyUndo" || type === "historyRedo") {
      const u = undoRef.current
      if (type === "historyUndo") {
        if (u.i < 0) return
        if (u.i === u.stack.length - 1) u.stack.push({ v: value, c: a })
        const s = u.stack[u.i]
        u.i--
        caretRef.current = s.c
        onChange(s.v)
      } else if (u.i + 2 < u.stack.length) {
        u.i++
        const s = u.stack[u.i + 1]
        caretRef.current = s.c
        onChange(s.v)
      }
    }
  }

  // React's onBeforeInput is a polyfill, so the native event is attached by hand.
  const beforeInputRef = React.useRef(onBeforeInput)
  React.useLayoutEffect(() => {
    beforeInputRef.current = onBeforeInput
  })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const h = (e: Event) => beforeInputRef.current(e as InputEvent)
    el.addEventListener("beforeinput", h)
    return () => el.removeEventListener("beforeinput", h)
  }, [])

  const insertVar = (name: string) => {
    if (!list) return
    const [, b] = selection()
    const t = `{{${name}}}`
    commit(value.slice(0, list.start) + t + value.slice(b), list.start + t.length)
    setList(null)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      return onSubmit?.()
    }
    if (open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        return setActive((safe + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length)
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        return insertVar(options[safe])
      }
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        return setList(null)
      }
    }
  }

  const copyOut = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const [a, b] = selection()
    if (a === b) return
    e.preventDefault()
    e.clipboardData.setData("text/plain", value.slice(a, b))
    if (e.type === "cut") commit(value.slice(0, a) + value.slice(b), a)
  }

  return (
    <div className="pst-editWrap" ref={wrapRef} style={{ position: "relative" }}>
      <div
        ref={ref}
        className="pst-edit"
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? `${id}-${options[safe]}` : undefined}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        onKeyDown={onKeyDown}
        onKeyUp={() => { const [a] = selection(); caretRef.current = a }}
        onClick={(e) => {
          const chip = (e.target as HTMLElement).closest<HTMLElement>("[data-var]")
          if (chip?.dataset.var) onChipClick?.(chip.dataset.var)
        }}
        onCopy={copyOut}
        onCut={copyOut}
        onBlur={() => setList(null)}
        onCompositionEnd={() => {
          const el = ref.current
          if (!el) return
          const [a] = selection()
          let s = ""
          el.childNodes.forEach((c) => { s += c.nodeType === 3 ? c.textContent : (c as HTMLElement).dataset?.var ? `{{${(c as HTMLElement).dataset.var}}}` : "" })
          caretRef.current = a
          onChange(normalize(s))
        }}
      />
      {open && list && (
        <div className="pst-list" id={`${id}-list`} role="listbox" aria-label="Variables" style={{ left: Math.min(list.x, 240), top: list.y }}>
          {options.map((o, i) => (
            <div key={o} id={`${id}-${o}`} role="option" aria-selected={i === safe} className="pst-opt" style={{ ["--c" as string]: `var(--pst-s${toneOf(o)})` }} onPointerDown={(e) => e.preventDefault()} onPointerEnter={() => setActive(i)} onClick={() => insertVar(o)}>
              <i />
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 PromptStudio                               */
/* -------------------------------------------------------------------------- */

type RunState = {
  status: "idle" | "thinking" | "streaming" | "done" | "stopped" | "error"
  settled: string
  live: string[]
  caseLabel: string
  ms: number
  tokens: number
  cost: number
  simulated: boolean
  error?: string
}
const EMPTY: Record<string, string> = {}
const IDLE: RunState = { status: "idle", settled: "", live: [], caseLabel: "", ms: 0, tokens: 0, cost: 0, simulated: false }

export function PromptStudio({
  name = "Support reply",
  versions = SAMPLE_VERSIONS,
  versionId,
  productionId,
  template,
  variables,
  testCases = SAMPLE_CASES,
  models = SAMPLE_MODELS,
  defaultModel,
  defaultEffort,
  now,
  onRun,
  onPromote,
  onTemplateChange,
  className,
}: PromptStudioProps) {
  const sample = versions === SAMPLE_VERSIONS
  const [mountedAt] = React.useState(() => Date.now())
  const nowDate = React.useMemo(() => (now ? new Date(now) : sample ? new Date("2026-10-20T12:00:00Z") : new Date(mountedAt)), [now, sample, mountedAt])
  const uid = React.useId().replace(/:/g, "")

  const [openId, setOpenId] = React.useState(versionId ?? versions[0]?.id ?? "")
  const openVersion = versions.find((v) => v.id === openId) ?? versions[0]
  const [prodId, setProdId] = React.useState<string | null>(productionId === undefined ? (openVersion?.id ?? null) : productionId)
  const [lastProd, setLastProd] = React.useState<string | null | undefined>(undefined)
  const [draft, setDraft] = React.useState<PromptTemplate>(template ?? { system: openVersion?.system ?? "", user: openVersion?.user ?? "" })
  const [tab, setTab] = React.useState<"system" | "user">("system")
  const [compareId, setCompareId] = React.useState<string | null>(null)
  const [menu, setMenu] = React.useState<null | "version" | "model">(null)
  const [menuSel, setMenuSel] = React.useState<string | null>(null)
  const firstModel = models.find((m) => m.id === defaultModel) ?? models[0]
  const [modelId, setModelId] = React.useState(firstModel?.id ?? "")
  const model = models.find((m) => m.id === modelId) ?? firstModel
  const [effort, setEffort] = React.useState<PromptEffort>(defaultEffort ?? firstModel?.defaultEffort ?? "high")
  const [caseId, setCaseId] = React.useState(testCases[0]?.id ?? "")
  const [caseValues, setCaseValues] = React.useState<Record<string, Record<string, string>>>(() => Object.fromEntries(testCases.map((c) => [c.id, { ...c.values }])))
  const [focusVar, setFocusVar] = React.useState<string | null>(null)
  const [flash, setFlash] = React.useState<{ name: string; at: number } | null>(null)
  const [run, setRun] = React.useState<RunState>(IDLE)
  const [status, setStatus] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  const abortRef = React.useRef<AbortController | null>(null)
  const runRef = React.useRef(0)
  const failedOnce = React.useRef(false)
  const timers = React.useRef(new Set<number>())
  const menuRect = React.useRef<DOMRect | null>(null)
  const textareaRefs = React.useRef<Record<string, HTMLInputElement | null>>({})
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const caseRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const [hi, setHi] = React.useState<Record<string, { x: number; w: number }>>({})

  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.current.delete(id); fn() }, ms)
    timers.current.add(id)
    return id
  }, [])
  const abortNow = React.useCallback(() => {
    abortRef.current?.abort()
    runRef.current++
  }, [])
  React.useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      abortNow()
    }
  }, [abortNow])

  /* ---------- variables ---------- */
  const allVars = React.useMemo(() => {
    const out = [...(variables ?? (sample ? ["customer_name", "order_id", "policy"] : []))]
    for (const t of [draft.system, draft.user, ...testCases.flatMap((c) => Object.keys(c.values))]) {
      for (const v of typeof t === "string" && t.includes("{{") ? varsIn(t) : []) if (!out.includes(v)) out.push(v)
    }
    for (const c of testCases) for (const k of Object.keys(c.values)) if (!out.includes(k)) out.push(k)
    return out
  }, [variables, draft, testCases, sample])
  const toneOf = React.useCallback((n: string) => (Math.max(0, allVars.indexOf(n)) % 4) + 1, [allVars])
  const values = caseValues[caseId] ?? EMPTY
  const used = React.useMemo(() => Array.from(new Set([...varsIn(draft.system), ...varsIn(draft.user)])), [draft])
  const fieldVars = allVars.filter((v) => used.includes(v) || Object.keys(values).includes(v))
  const missing = React.useMemo(() => used.filter((v) => !(values[v] ?? "").trim()), [used, values])

  /* ---------- version state ---------- */
  const newestId = versions[0]?.id
  const dirty = !!openVersion && (draft.system !== openVersion.system || draft.user !== openVersion.user)
  const stateLabel = dirty ? "Edited" : openVersion?.id === prodId ? "Production" : openVersion?.id === newestId ? "Latest" : "Saved"
  const compareVersion = versions.find((v) => v.id === compareId)
  const selVersion = versions.find((v) => v.id === menuSel) ?? openVersion

  const openVersionById = (id: string) => {
    const v = versions.find((x) => x.id === id)
    if (!v) return
    setOpenId(id)
    setDraft({ system: v.system, user: v.user })
    setCompareId(null)
    setStatus(`Opened ${v.label}`)
    onTemplateChange?.({ system: v.system, user: v.user })
  }

  const promote = () => {
    if (!selVersion || selVersion.id === prodId) return
    const el = document.querySelector<HTMLElement>(`#${uid} [data-prod]`)
    menuRect.current = el?.getBoundingClientRect() ?? null
    const prev = prodId
    setLastProd(prev)
    setProdId(selVersion.id)
    setStatus(`${selVersion.label} promoted to production`)
    onPromote?.(selVersion.id, prev)
  }
  const undoPromote = () => {
    if (lastProd === undefined || prodId === null) return
    const el = document.querySelector<HTMLElement>(`#${uid} [data-prod]`)
    menuRect.current = el?.getBoundingClientRect() ?? null
    const cur = prodId
    setProdId(lastProd)
    setLastProd(undefined)
    setStatus("Promotion undone")
    onPromote?.(lastProd ?? "", cur)
  }
  React.useLayoutEffect(() => {
    const prev = menuRect.current
    menuRect.current = null
    if (!prev) return
    const el = document.querySelector<HTMLElement>(`#${uid} [data-prod]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const dy = prev.top - r.top
    const dx = prev.left - r.left
    if ((Math.abs(dy) > 1 || Math.abs(dx) > 1) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.22, 1, .36, 1)" })
    }
  }, [prodId, uid])

  /* ---------- tabs and cases: sliding highlight ---------- */
  const measure = React.useCallback(() => {
    const next: Record<string, { x: number; w: number }> = {}
    for (const [k, el] of Object.entries({ ...tabRefs.current, ...caseRefs.current })) if (el) next[k] = { x: el.offsetLeft, w: el.offsetWidth }
    setHi((p) => (JSON.stringify(p) === JSON.stringify(next) ? p : next))
  }, [])
  React.useEffect(() => {
    const ro = new ResizeObserver(measure)
    const root = document.getElementById(uid)
    if (root) ro.observe(root)
    return () => ro.disconnect()
  }, [measure, uid, testCases])

  /* ---------- editing ---------- */
  const setPart = (part: "system" | "user", v: string) => {
    const next = { ...draft, [part]: v }
    setDraft(next)
    onTemplateChange?.(next)
  }
  const setValue = (v: string, val: string) => {
    setCaseValues((m) => ({ ...m, [caseId]: { ...m[caseId], [v]: val } }))
    setFlash({ name: v, at: Date.now() })
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(run.settled + run.live.join("")) } catch { /* blocked clipboard */ }
    setCopied(true)
    setStatus("Reply copied")
    later(() => setCopied(false), 1400)
  }

  /* ---------- running ---------- */
  const doRun = React.useCallback(async () => {
    if (!model) return
    const id = ++runRef.current
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    const alive = () => runRef.current === id && !ctrl.signal.aborted
    const c = testCases.find((x) => x.id === caseId)
    const vals = caseValues[caseId] ?? {}
    const req: PromptRunRequest = { raw: draft, rendered: { system: render(draft.system, vals), user: render(draft.user, vals) }, values: vals, model: model.id, effort, caseId, versionId: openId }
    const t0 = performance.now()
    setRun((r) => ({ ...IDLE, status: "thinking", caseLabel: c?.label ?? "", simulated: !onRun, settled: r.status === "idle" ? "" : "" }))
    setStatus(`Running ${c?.label ?? "prompt"}${onRun ? "" : ". Runs are simulated."}`)
    let text = ""
    let done = false
    let failed: string | null = null as string | null
    try {
      if (onRun) {
        const out = await onRun(req, ctrl.signal)
        if (!alive()) return
        if (typeof out === "string") { text = out; done = true }
        else void (async () => {
          try { for await (const d of out) { if (!alive()) return; text += d } } catch (e) { if (alive()) failed = e instanceof Error ? e.message : "Run failed" }
          done = true
        })()
      } else {
        await new Promise<void>((r) => later(r, 500 + EFFORTS.findIndex((e) => e.id === effort) * 170))
        if (!alive()) return
        if (caseId === "window" && !failedOnce.current) {
          failedOnce.current = true
          throw new Error("The model is overloaded (simulated)")
        }
        text = (SIM_REPLY[caseId] ?? GENERIC_REPLY)(vals)
        done = true
      }
    } catch (e) {
      if (alive()) { setRun((r) => ({ ...r, status: "error", error: e instanceof Error ? e.message : "Run failed" })); setStatus("Run failed") }
      return
    }
    setRun((r) => ({ ...r, status: "streaming" }))
    await new Promise<void>((resolve) => {
      let last = 0
      let pos = 0
      const tick = (now2: number) => {
        if (!alive()) return resolve()
        if (now2 - last >= 40) {
          last = now2
          const rest = text.slice(pos)
          if (rest) {
            const words = rest.match(/\S+\s*/g) ?? [rest]
            const k = rest.length > 400 ? 8 : 3 + (pos % 4)
            const chunk = words.slice(0, k).join("")
            pos += chunk.length
            setRun((r) => {
              const live = [...r.live, chunk]
              let settled = r.settled
              while (live.length > 6) settled += live.shift()
              return { ...r, settled, live }
            })
          } else if (done) return resolve()
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    if (!alive()) return
    if (failed) { setRun((r) => ({ ...r, status: "error", error: failed! })); setStatus("Run failed"); return }
    const inTok = Math.ceil((req.rendered.system.length + req.rendered.user.length) / 4)
    const outTok = Math.ceil(text.length / 4)
    const ms = onRun ? performance.now() - t0 : 900 + text.length * 1.4
    setRun((r) => ({ ...r, status: "done", ms, tokens: inTok + outTok, cost: (inTok * model.input + outTok * model.output) / 1e6 }))
    setStatus(`Reply ready${onRun ? "" : ". This run is simulated."}`)
    later(() => setRun((r) => ({ ...r, settled: r.settled + r.live.join(""), live: [] })), 240)
  }, [model, testCases, caseId, caseValues, draft, effort, openId, onRun, later])

  const running = run.status === "thinking" || run.status === "streaming"
  const stopRun = () => {
    abortNow()
    setRun((r) => ({ ...r, status: "stopped", settled: r.settled + r.live.join(""), live: [] }))
    setStatus("Stopped")
  }
  const toggleRun = () => (running ? stopRun() : void doRun())

  const onRootKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      toggleRun()
    } else if (e.key === "Escape") {
      if (menu) { e.stopPropagation(); setMenu(null) }
      else if (compareId) setCompareId(null)
    }
  }

  /* ---------- menus ---------- */
  React.useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => { if (!(e.target as Element | null)?.closest?.(".pst-anchor")) setMenu(null) }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [menu])

  const menuNode = React.useCallback((node: HTMLDivElement | null) => {
    node?.querySelector<HTMLElement>("[data-nav][aria-checked='true']")?.focus({ preventScroll: true })
  }, [])
  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMenu(null); return }
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-nav]"))
    const focused = document.activeElement as HTMLElement
    if (focused?.closest("[data-effort]") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault()
      const k = EFFORTS.findIndex((x) => x.id === effort)
      const n = Math.max(0, Math.min(EFFORTS.length - 1, k + (e.key === "ArrowRight" ? 1 : -1)))
      setEffort(EFFORTS[n].id)
      setStatus(`Effort ${EFFORTS[n].id}`)
      requestAnimationFrame(() => e.currentTarget.querySelectorAll<HTMLElement>("[data-effort] button")[n]?.focus())
      return
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const nav = items.filter((x) => !x.closest("[data-effort]"))
    const j = nav.indexOf(focused)
    nav[j < 0 ? 0 : (j + (e.key === "ArrowDown" ? 1 : -1) + nav.length) % nav.length]?.focus()
    const row = nav[(j < 0 ? 0 : (j + (e.key === "ArrowDown" ? 1 : -1) + nav.length) % nav.length)]
    if (menu === "version" && row?.dataset.v) setMenuSel(row.dataset.v)
  }

  const effortIndex = Math.max(0, EFFORTS.findIndex((e) => e.id === effort))
  const text = run.settled + run.live.join("")
  const tokensEst = Math.ceil((tab === "system" ? draft.system : draft.user).length / 4)
  const tabLabel = { system: "System", user: "User" } as const

  const compareOps = (part: "system" | "user") => (compareVersion ? wordDiff(compareVersion[part], draft[part]) : [])
  const renderChips = (s: string) =>
    s.split(/(\{\{\s*\w+\s*\}\})/).map((p, i) => {
      const m = /^\{\{\s*(\w+)\s*\}\}$/.exec(p)
      return m ? <span key={i} className="pst-chip" data-t={toneOf(m[1])} style={{ cursor: "default" }}>{m[1]}</span> : <React.Fragment key={i}>{p}</React.Fragment>
    })

  return (
    <div id={uid} className={["pst", className].filter(Boolean).join(" ")} data-open={menu ? "" : undefined} onKeyDown={onRootKey}>
      <style href="prompt-studio" precedence="default">{CSS}</style>

      <section className="pst-card" aria-label={`${name} prompt`}>
        <header className="pst-head">
          <div className="pst-titleGroup">
            <h2 className="pst-title">{name}</h2>
            <div className="pst-anchor">
              <button type="button" className="pst-chipBtn" aria-haspopup="menu" aria-expanded={menu === "version"} aria-label={`Version ${openVersion?.label}, ${stateLabel}`} onClick={() => { setMenuSel(openVersion?.id ?? null); setMenu(menu === "version" ? null : "version") }}>
                <span className="pst-chipVer">{openVersion?.label}</span>
                <Swap k={stateLabel}>
                  {stateLabel === "Production" && <i className="pst-dot" />}
                  <span className="pst-chipState">{stateLabel}</span>
                </Swap>
                <ChevronDown className="pst-chev" size={14} aria-hidden />
              </button>
              {menu === "version" && (
                <div className="pst-menu" data-align="start" role="menu" aria-label="Versions" ref={menuNode} onKeyDown={onMenuKey}>
                  <div role="radiogroup" aria-label="Versions">
                    {versions.map((v) => (
                      <button key={v.id} type="button" role="menuitemradio" aria-checked={v.id === menuSel} data-nav data-v={v.id} className="pst-vRow" onClick={() => { setMenuSel(v.id); openVersionById(v.id); setMenu(null) }} onFocus={() => setMenuSel(v.id)} onPointerEnter={() => setMenuSel(v.id)}>
                        <span className="pst-avatar" style={{ background: hueOf(v.author.name) }} aria-hidden>{initials(v.author.name)}</span>
                        <span className="pst-vText">
                          <span className="pst-vMsg">{v.message}</span>
                          <span className="pst-vMeta">
                            <span><b>{v.label}</b> · {v.author.name} · {relative(v.createdAt, nowDate)}</span>
                            {v.id === prodId && (
                              <span className="pst-prod" data-prod><i className="pst-dot" />Production</span>
                            )}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="pst-mSep" role="separator" />
                  <button type="button" role="menuitem" data-nav className="pst-mAct" disabled={!selVersion || selVersion.id === openId} onClick={() => { setCompareId(selVersion!.id); setMenu(null); setStatus(`Comparing with ${selVersion!.label}. Escape returns to editing.`) }}>
                    <GitCompare size={16} aria-hidden />
                    Compare with {selVersion?.label}
                  </button>
                  <button type="button" role="menuitem" data-nav className="pst-mAct" disabled={!selVersion || selVersion.id === prodId} onClick={promote}>
                    <Rocket size={16} aria-hidden />
                    Promote {selVersion && selVersion.id !== prodId ? selVersion.label : ""} to production
                  </button>
                  {lastProd !== undefined && (
                    <button type="button" role="menuitem" data-nav className="pst-mAct" onClick={undoPromote}>
                      <Undo2 size={16} aria-hidden />
                      Undo promotion
                    </button>
                  )}
                  <div className="pst-mSep" role="separator" />
                  <div className="pst-mStatus"><Swap k={String(prodId)}>{prodId ? `Production serves ${versions.find((v) => v.id === prodId)?.label ?? prodId}` : "Nothing is in production"}</Swap></div>
                </div>
              )}
            </div>
          </div>

          {model && (
            <div className="pst-anchor">
              <button type="button" className="pst-chipBtn" data-model aria-haspopup="menu" aria-expanded={menu === "model"} aria-label={`Model ${model.name}, effort ${effort}`} onClick={() => setMenu(menu === "model" ? null : "model")}>
                <Swap k={model.id}><ModelMark mark={model.mark} /><span>{model.short}</span></Swap>
                <Swap k={effort}><span className="pst-effLbl">{EFFORTS[effortIndex].label}</span></Swap>
                <ChevronDown className="pst-chev" size={14} aria-hidden />
              </button>
              {menu === "model" && (
                <div className="pst-menu" data-align="end" role="menu" aria-label="Model and effort" ref={menuNode} onKeyDown={onMenuKey}>
                  {models.map((m) => (
                    <button key={m.id} type="button" role="menuitemradio" aria-checked={m.id === modelId} data-nav className="pst-mItem" onClick={() => { setModelId(m.id); setEffort(m.defaultEffort ?? "medium"); setStatus(`${m.name} selected`) }}>
                      <ModelMark mark={m.mark} />
                      <span className="pst-vText">
                        <span>{m.name}</span>
                        <span className="pst-mNote">${m.input} in · ${m.output} out per 1M{m.sample ? " (sample)" : ""}</span>
                      </span>
                      {m.id === modelId && <Check size={16} aria-hidden />}
                    </button>
                  ))}
                  <div className="pst-mSep" role="separator" />
                  <div className="pst-effHead"><span id={`${uid}-eff`}>Effort</span><span>{effort}</span></div>
                  <div className="pst-effRow" role="group" aria-labelledby={`${uid}-eff`} data-effort style={{ ["--i" as string]: effortIndex }}>
                    <span className="pst-effThumb" aria-hidden />
                    {EFFORTS.map((x) => (
                      <button key={x.id} type="button" role="menuitemradio" aria-checked={x.id === effort} data-nav tabIndex={x.id === effort ? 0 : -1} className="pst-eff" onClick={() => { setEffort(x.id); setStatus(`Effort ${x.id}`) }}>{x.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="pst-editor">
          <div className="pst-bar">
            <div className="pst-seg" role="tablist" aria-label="Template part">
              <span className="pst-segHi" aria-hidden style={{ ["--x" as string]: `${hi[`tab-${tab}`]?.x ?? 0}px`, ["--w" as string]: `${hi[`tab-${tab}`]?.w ?? 0}px` }} />
              {(["system", "user"] as const).map((t) => (
                <button
                  key={t}
                  ref={(el) => { tabRefs.current[`tab-${t}`] = el }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${t}`}
                  aria-selected={tab === t}
                  aria-controls={`${uid}-pane-${t}`}
                  tabIndex={tab === t ? 0 : -1}
                  className="pst-segOpt"
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = t === "system" ? "user" : "system"; setTab(n); tabRefs.current[`tab-${n}`]?.focus() }
                  }}
                >
                  {tabLabel[t]}
                </button>
              ))}
            </div>
            <span className="pst-tokens"><b key={tokensEst}>{tokensEst}</b> tokens</span>
          </div>

          {compareVersion && (
            <div className="pst-diffBar" role="status">
              <GitCompare size={14} aria-hidden />
              Comparing {compareVersion.label} with your draft
              <button type="button" onClick={() => setCompareId(null)}>
                Back to editing <span className="pst-key">Esc</span>
              </button>
            </div>
          )}

          <div className="pst-stack">
            {(["system", "user"] as const).map((t) => (
              <div key={t} className="pst-pane" id={`${uid}-pane-${t}`} role="tabpanel" aria-labelledby={`${uid}-tab-${t}`} data-hidden={tab !== t ? "" : undefined} inert={tab !== t}>
                {compareVersion ? (
                  <div className="pst-diff" aria-label={`${tabLabel[t]} diff`}>
                    {compareOps(t).map((o, i) =>
                      o.k === "eq" ? <React.Fragment key={i}>{renderChips(o.text)}</React.Fragment> : o.k === "del" ? <del key={i}><span className="pst-sr">Removed: </span>{renderChips(o.text)}</del> : <ins key={i}><span className="pst-sr">Added: </span>{renderChips(o.text)}</ins>,
                    )}
                  </div>
                ) : (
                  <PromptEditor
                    value={draft[t]}
                    onChange={(v) => setPart(t, v)}
                    variables={allVars}
                    toneOf={toneOf}
                    label={`${tabLabel[t]} template`}
                    missing={missing}
                    activeVariable={focusVar}
                    flash={flash}
                    onChipClick={(n) => textareaRefs.current[n]?.focus()}
                    onSubmit={toggleRun}
                    placeholder={t === "system" ? "Write the instructions. Use {{name}} for variables." : "Write the message the model answers."}
                  />
                )}
              </div>
            ))}
          </div>
          {!compareVersion && (
            <div className="pst-hint">
              Type <span className="pst-key">{"{{"}</span> to add a variable
            </div>
          )}
        </div>

        <div className="pst-vars">
          {fieldVars.length > 0 && (
            <div className="pst-fields">
              {fieldVars.map((v, i) => (
                <label key={v} className="pst-field" data-t={toneOf(v)} data-wide={i === fieldVars.length - 1 && fieldVars.length % 3 === 1 ? "" : undefined}>
                  <span className="pst-fieldLbl"><i />{v}</span>
                  <input
                    ref={(el) => { textareaRefs.current[v] = el }}
                    className="pst-input"
                    value={values[v] ?? ""}
                    placeholder="Add a value"
                    onChange={(e) => setValue(v, e.target.value)}
                    onFocus={() => setFocusVar(v)}
                    onBlur={() => setFocusVar(null)}
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); toggleRun() } }}
                  />
                </label>
              ))}
            </div>
          )}
          <div className="pst-runRow">
            <div className="pst-seg" data-box role="radiogroup" aria-label="Test case">
              <span className="pst-segHi" data-box aria-hidden style={{ ["--x" as string]: `${(hi[`case-${caseId}`]?.x ?? 2) - 2}px`, ["--w" as string]: `${hi[`case-${caseId}`]?.w ?? 0}px` }} />
              {testCases.map((c, i) => (
                <button
                  key={c.id}
                  ref={(el) => { caseRefs.current[`case-${c.id}`] = el }}
                  type="button"
                  role="radio"
                  aria-checked={caseId === c.id}
                  tabIndex={caseId === c.id ? 0 : -1}
                  className="pst-segOpt"
                  onClick={() => setCaseId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
                    e.preventDefault()
                    const n = testCases[(i + (e.key === "ArrowRight" ? 1 : -1) + testCases.length) % testCases.length]
                    setCaseId(n.id)
                    caseRefs.current[`case-${n.id}`]?.focus()
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <button type="button" className="pst-run" data-running={running ? "" : undefined} aria-label={running ? "Stop run" : `Run ${testCases.find((c) => c.id === caseId)?.label ?? ""}`} onClick={toggleRun}>
              {running ? <Square size={12} fill="currentColor" strokeWidth={0} aria-hidden /> : <Play size={13} fill="currentColor" strokeWidth={0} aria-hidden />}
              <span className="pst-runLabel"><span>Run</span><span aria-hidden>Stop</span></span>
              <span className="pst-runKeys" aria-hidden>{"⌘↵"}</span>
            </button>
          </div>
        </div>

        <AutoHeight className="pst-outFrame">
          <div className="pst-out" aria-live="off">
            {run.status === "idle" ? (
              <p className="pst-idle" style={{ margin: 0 }}>Run <b>{testCases.find((c) => c.id === caseId)?.label}</b> to see the reply here. Runs are simulated.</p>
            ) : (
              <>
                <div className="pst-outHead">
                  <span className="pst-status" key={run.status} data-err={run.status === "error" ? "" : undefined}>
                    {run.status === "thinking" || run.status === "streaming" ? (
                      <span className="pst-shimmer" data-text="Thinking">{run.status === "thinking" ? "Thinking" : "Writing"}</span>
                    ) : run.status === "error" ? (
                      <><TriangleAlert size={15} aria-hidden />Run failed</>
                    ) : run.status === "stopped" ? (
                      <><Square size={11} fill="currentColor" strokeWidth={0} aria-hidden />Stopped</>
                    ) : (
                      <><Check size={15} aria-hidden />Reply</>
                    )}
                    {run.status !== "thinking" && run.status !== "error" && <em>· {run.caseLabel}</em>}
                  </span>
                  {(run.status === "done" || run.status === "stopped") && text && (
                    <button type="button" className="pst-icoBtn" aria-label={copied ? "Copied" : "Copy reply"} onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
                  )}
                </div>
                {run.status === "error" ? (
                  <div className="pst-errBox">
                    {run.error}
                    <button type="button" className="pst-retry" onClick={() => void doRun()}><RotateCw size={13} aria-hidden />Retry</button>
                  </div>
                ) : (
                  <div className="pst-reply">
                    <p>
                      {run.settled}
                      {run.live.map((c, i) => <span key={run.settled.length + i} className="pst-chunk">{c}</span>)}
                    </p>
                  </div>
                )}
                {run.status === "done" && (
                  <div className="pst-foot">{run.simulated ? "Simulated · " : ""}{(run.ms / 1000).toFixed(2)} s · {run.tokens} tokens · ${run.cost.toFixed(4)}</div>
                )}
              </>
            )}
          </div>
        </AutoHeight>
      </section>

      <p className="pst-sr" role="status" aria-live="polite">{status}</p>
    </div>
  )
}

"use client"

import * as React from "react"
import {
  ArrowUp,
  AtSign,
  Brain,
  Bug,
  Camera,
  Check,
  ChevronDown,
  Copy,
  File as FileIcon,
  FileText,
  GitBranch,
  Globe,
  HardDrive,
  Hexagon,
  Languages,
  Lightbulb,
  Mic,
  PenLine,
  Plus,
  RotateCw,
  Sparkles,
  Square,
  Upload,
  Wrench,
  X,
  Diamond,
  TriangleAlert,
  Image as ImageIcon,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ComposerEffort = "low" | "medium" | "high" | "xhigh" | "max"

export type ComposerModel = {
  id: string
  /** Full name shown in the menu. */
  name: string
  /** Short label shown on the chip. */
  short: string
  /** One line under the name in the menu. */
  note: string
  /** A tiny glyph for the model. Use one of the built-in marks or pass your own 16px node. */
  mark?: "spark" | "hex" | "diamond" | React.ReactNode
  /** Effort that is selected when this model is chosen. */
  defaultEffort?: ComposerEffort
}

export type ComposerCommand = { id: string; /** Written with the slash, e.g. "/summarize". */ label: string; hint: string }

export type ComposerMention = { id: string; /** The text inserted after the @, e.g. "checkout-flow.tsx". */ label: string; hint: string; group: string }

export type ComposerSuggestion = { id: string; label: string; prompt: string; icon?: "summary" | "draft" | "bug" }

export type ComposerToken = { kind: "command" | "mention"; id: string; label: string; start: number; end: number }

export type ComposerAttachment = {
  id: string
  name: string
  /** Human readable size, e.g. "4.8 MB". */
  size?: string
  kind: "file" | "image" | "paste"
  status: "uploading" | "done" | "error"
  /** 0 to 1 while uploading. */
  progress: number
  /** The real file for picked, dropped or pasted files. */
  file?: File
  /** The text of a pasted-text chip. */
  text?: string
  /** Short reason when the status is "error". */
  error?: string
  /** Object URL for an image thumbnail. */
  preview?: string
}

export type ComposerMessage = {
  text: string
  tokens: ComposerToken[]
  attachments: ComposerAttachment[]
  files: File[]
  model: string
  effort: ComposerEffort
  webSearch: boolean
  thinking: boolean
}

export type AiComposerProps = {
  /** Called with every sent message. Return an async iterable of text deltas to stream a real reply; Stop aborts `signal`. Return nothing and a simulated reply plays. */
  onSend?: (message: ComposerMessage, options: { signal: AbortSignal }) => void | Promise<void> | AsyncIterable<string>
  /** Display heading of the new chat state. */
  greeting?: string
  /** Up to three starters under the composer. Choosing one fills the composer with its prompt. */
  suggestions?: ComposerSuggestion[]
  /** Models in the model menu. */
  models?: ComposerModel[]
  /** Id of the model selected first. Defaults to the first model. */
  defaultModel?: string
  /** Effort selected first. Defaults to the model's own default. */
  defaultEffort?: ComposerEffort
  /** Placeholder of the empty textarea. */
  placeholder?: string
  /** Character limit. A ring counter appears at 80 %, turns to the warning colour at 95 %, and sending stops above the limit. */
  maxLength?: number
  /** Slash commands. Leave out for four samples. */
  commands?: ComposerCommand[]
  /** Files and docs offered after @. Leave out for six samples. */
  mentions?: ComposerMention[]
  /** Height of the stage in px. The composer starts centred and glides to the bottom once a message is sent. */
  height?: number | string
  /** Draw the rounded stage around the block. */
  framed?: boolean
  /** Class on the root element. */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                Sample content                              */
/* -------------------------------------------------------------------------- */

const SAMPLE_MODELS: ComposerModel[] = [
  { id: "nova-5", name: "Nova 5", short: "Nova 5", note: "Flagship for complex work", mark: "spark", defaultEffort: "medium" },
  { id: "atlas-2", name: "Atlas 2 Pro", short: "Atlas 2", note: "Everyday writing and agents", mark: "hex", defaultEffort: "medium" },
  { id: "sage-mini", name: "Sage Mini", short: "Sage Mini", note: "Fastest for quick answers", mark: "diamond", defaultEffort: "low" },
  { id: "orbit-1", name: "Orbit 1 Long", short: "Orbit 1", note: "2M tokens of context", mark: "hex", defaultEffort: "high" },
]

const SAMPLE_COMMANDS: ComposerCommand[] = [
  { id: "summarize", label: "/summarize", hint: "Condense text or a file into key points" },
  { id: "translate", label: "/translate", hint: "Translate into another language" },
  { id: "explain", label: "/explain", hint: "Walk through code or an idea step by step" },
  { id: "fix", label: "/fix", hint: "Find and fix a bug in the code" },
]

const SAMPLE_MENTIONS: ComposerMention[] = [
  { id: "f1", label: "checkout-flow.tsx", hint: "src/app/checkout", group: "Files" },
  { id: "f2", label: "pricing-q4.csv", hint: "data/finance", group: "Files" },
  { id: "f3", label: "brand-guide.pdf", hint: "Design, 4.8 MB", group: "Files" },
  { id: "d1", label: "Autumn launch plan", hint: "Wiki, edited Oct 18", group: "Docs" },
  { id: "d2", label: "Payment retries", hint: "Tracker, PAY-2481", group: "Docs" },
  { id: "d3", label: "Checkout flow v3", hint: "Boards, edited Oct 16", group: "Docs" },
]

const SAMPLE_SUGGESTIONS: ComposerSuggestion[] = [
  { id: "s1", label: "Summarize the autumn launch plan", prompt: "/summarize @Autumn launch plan ", icon: "summary" },
  { id: "s2", label: "Draft a reply to Priya", prompt: "Draft a reply to Priya about the pricing change, friendly and under 100 words.", icon: "draft" },
  { id: "s3", label: "Explain the checkout retry bug", prompt: "/explain why @Payment retries fires twice on slow networks", icon: "bug" },
]

const EFFORTS: { id: ComposerEffort; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "Xhigh" },
  { id: "max", label: "Max" },
]
const EFFORT_HINT: Record<ComposerEffort, string> = { low: "Fastest", medium: "Balanced", high: "Thorough", xhigh: "Very thorough", max: "Deepest" }

const SIMULATED: { match: RegExp; text: string }[] = [
  {
    match: /^\/summarize/,
    text: "The autumn launch moves the self-serve tier to November 12, with the new pricing landing a week earlier on November 5. Marketing has the announcement drafted and the help centre articles are in review.\n\nThe main open risk is the checkout migration, which still needs a load test before the code freeze on October 30. If that slips, the fallback is to ship pricing first and move the checkout change to the following sprint. Everything else is on track.",
  },
  {
    match: /^\/explain/,
    text: "The retry fires twice because the client retries on a timeout while the first request is still in flight. On a slow network the server finishes both, and nothing deduplicates them, so the customer can be charged twice.\n\nSend an idempotency key with each attempt and the second call becomes a harmless no-op: the server returns the stored result of the first one. A short client timeout with one retry, plus the key, is enough here.",
  },
  {
    match: /^\/fix/,
    text: "The bug is an off-by-one in the batch loop: the last page is skipped when the total is an exact multiple of the page size. The loop stops with a strict less-than, so the final offset is never read.\n\nChange the condition to less-than-or-equal, or better, loop until a page comes back empty. Then add a test for a total of exactly one page and one for zero rows, since both hit the same edge.",
  },
  {
    match: /^\/translate/,
    text: "Here is the translation, keeping the tone friendly and the product names unchanged. I kept the two short sentences as they were so the rhythm survives, and I left the date format alone.\n\nOne note: the original joke about the weather does not carry over, so I swapped it for a neutral greeting. If you would rather keep a playful line, tell me the audience and I will write one that fits.",
  },
  {
    match: /./,
    text: "Happy to help with that. Here is a first pass: start with the one sentence your reader must remember, then add two supporting details, and close with the next step they can take today.\n\nIf you share the audience and a word limit, I can tighten it further. I can also write a shorter version for chat and a longer one for email, so you can pick the tone that suits the moment.",
  },
]

const DICTATION = "remind the team that the launch review moves to Thursday at ten"

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.acp {
  --acp-ink: #0a0a0a;
  --acp-surface: #fff;
  --acp-stage: #fff;
  --acp-accent: #0060e2;
  --acp-warn: #d9480f;
  --acp-on-ink: #fff;
  --acp-t1: var(--acp-ink);
  --acp-t2: color-mix(in oklab, var(--acp-ink) 70%, transparent);
  --acp-t3: color-mix(in oklab, var(--acp-ink) 54%, transparent);
  --acp-t4: color-mix(in oklab, var(--acp-ink) 30%, transparent);
  --acp-wash: color-mix(in oklab, var(--acp-ink) 3.5%, transparent);
  --acp-hover: color-mix(in oklab, var(--acp-ink) 5%, transparent);
  --acp-soft: color-mix(in oklab, var(--acp-ink) 6%, transparent);
  --acp-line: color-mix(in oklab, var(--acp-ink) 9%, transparent);
  --acp-token: color-mix(in oklab, var(--acp-ink) 12%, transparent);
  --acp-glint: rgb(255 255 255 / .85);
  --acp-pop: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --acp-ease: cubic-bezier(.22, 1, .36, 1);
  --acp-spring: linear(0, .0213 2.8%, .0739 5.6%, .1443 8.3%, .2235 11.1%, .305 13.9%, .3849 16.7%, .4606 19.4%, .5305 22.2%, .594 25%, .7011 30.6%, .7836 36.1%, .8454 41.7%, .8907 47.2%, .9234 52.8%, .9467 58.3%, .9632 63.9%, .9747 69.4%, .9826 75%, .9882 80.6%, .992 86.1%, .9946 91.7%, 1);
  position: relative;
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  container-type: inline-size;
  color: var(--acp-t1);
  font-family: var(--acp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 19.6px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .acp {
  --acp-ink: #fff;
  --acp-surface: #1c1c1f;
  --acp-stage: #131315;
  --acp-accent: #4d8dff;
  --acp-warn: #ff9b6b;
  --acp-on-ink: #0a0a0a;
  --acp-t2: color-mix(in oklab, var(--acp-ink) 66%, transparent);
  --acp-t3: color-mix(in oklab, var(--acp-ink) 48%, transparent);
  --acp-t4: color-mix(in oklab, var(--acp-ink) 28%, transparent);
  --acp-wash: color-mix(in oklab, var(--acp-ink) 6%, transparent);
  --acp-hover: color-mix(in oklab, var(--acp-ink) 8%, transparent);
  --acp-soft: color-mix(in oklab, var(--acp-ink) 8%, transparent);
  --acp-line: color-mix(in oklab, var(--acp-ink) 13%, transparent);
  --acp-token: color-mix(in oklab, var(--acp-ink) 16%, transparent);
  --acp-glint: rgb(255 255 255 / .9);
  --acp-pop: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35);
}
.acp *, .acp *::before, .acp *::after { box-sizing: border-box }
:where(.acp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.acp button:disabled { cursor: default }
.acp :focus-visible { outline: 2px solid color-mix(in oklab, var(--acp-accent) 60%, transparent); outline-offset: 1px }
.acp .acp-input:focus-visible { outline: none }
.acp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }
.acp[data-open] { z-index: 30 }

/* Stage */
.acp-stage {
  position: relative; display: flex; flex-direction: column; justify-content: center;
  height: var(--acp-h, 560px); min-height: 0; padding: 24px; border-radius: 24px; background: var(--acp-stage);
}
.acp[data-framed] .acp-stage { border: 1px solid var(--acp-line) }
.acp-stage[data-chat] { justify-content: flex-start; padding-top: 0 }
.acp-greeting {
  margin: 0 0 24px; text-align: center; font: 400 36px/1.1 var(--acp-display, Geist, Inter, InterVariable, ui-sans-serif, system-ui, sans-serif);
  letter-spacing: -.03em; color: var(--acp-t1); text-wrap: balance;
  animation: acp-rise .5s var(--acp-ease) backwards;
}
.acp-dock { position: relative; width: 100%; max-width: 720px; margin-inline: auto; flex: none }

/* Surface */
.acp-surface {
  position: relative; padding: 10px; border-radius: 26px; background: var(--acp-surface);
  border: 1px solid var(--acp-line); transition: border-color .16s var(--acp-ease), box-shadow .16s var(--acp-ease);
}
.acp-surface:focus-within { border-color: color-mix(in oklab, var(--acp-ink) 20%, transparent) }
.acp-surface[data-drag] { border-color: var(--acp-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--acp-accent) 16%, transparent) }
.acp-field { position: relative; max-height: 208px; overflow: hidden }
.acp-mirror, .acp-input {
  margin: 0; padding: 8px; font-family: inherit; font-size: 16px; font-weight: 400; line-height: 24px; letter-spacing: -.01em;
  white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; min-height: 40px;
}
.acp-mirror { color: var(--acp-t1); pointer-events: none; will-change: transform }
.acp-mirror:empty::before { content: "\\200b" }
.acp-ph { color: var(--acp-t3) }
.acp-input {
  position: absolute; inset: 0; width: 100%; height: 100%; resize: none; border: 0; background: transparent;
  color: transparent; caret-color: var(--acp-t1); outline: none; overflow-y: auto; scrollbar-width: none;
}
.acp-input::-webkit-scrollbar { display: none }
.acp-input::placeholder { color: transparent }
.acp-input::selection { background: color-mix(in oklab, var(--acp-accent) 28%, transparent); color: transparent }
.acp-token {
  border-radius: 6px; background: var(--acp-token); box-shadow: 0 0 0 2px var(--acp-token);
  color: color-mix(in oklab, var(--acp-ink) 82%, transparent);
}
.acp-dictated { color: var(--acp-t3) }

/* Attachments */
.acp-files { display: flex; gap: 8px; overflow-x: auto; padding: 0 2px 10px; scrollbar-width: none; margin: 0; list-style: none }
.acp-files::-webkit-scrollbar { display: none }
.acp-chip {
  position: relative; flex: none; display: flex; align-items: center; gap: 8px; max-width: 220px; height: 40px;
  padding: 0 4px 0 6px; border-radius: 14px; border: 1px solid var(--acp-line); background: var(--acp-wash);
  animation: acp-scale .28s var(--acp-ease) backwards;
}
.acp-chip[data-status="error"] { border-color: color-mix(in oklab, var(--acp-warn) 45%, transparent); background: color-mix(in oklab, var(--acp-warn) 7%, transparent) }
.acp-thumb {
  position: relative; flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 9px;
  background: var(--acp-surface); color: var(--acp-t2); box-shadow: 0 0 0 1px var(--acp-line) inset; overflow: hidden;
}
.acp-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover }
.acp-thumb svg { display: block }
.acp-ringsvg { position: absolute; inset: 0; width: 28px; height: 28px; transform: rotate(-90deg); pointer-events: none }
.acp-ringsvg circle { fill: none; stroke-width: 2 }
.acp-ringsvg .t { stroke: var(--acp-line) }
.acp-ringsvg .p { stroke: var(--acp-accent); stroke-linecap: round; transition: stroke-dashoffset .12s linear }
.acp-pop-check { animation: acp-check .42s var(--acp-spring) backwards; color: var(--acp-accent) }
.acp-chipText { display: grid; min-width: 0; line-height: 15px; padding-right: 2px }
.acp-chipName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; line-height: 16px; color: var(--acp-t1) }
.acp-chipMeta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; line-height: 14px; color: var(--acp-t3) }
.acp-chipX {
  flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; color: var(--acp-t3);
  transition: background-color .12s var(--acp-ease), color .16s var(--acp-ease);
}
.acp-chipX:hover { background: var(--acp-soft); color: var(--acp-t1) }

/* Toolbar */
.acp-bar { display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-top: 2px }
.acp-group { display: flex; align-items: center; gap: 4px; min-width: 0 }
.acp-anchor { position: relative; display: flex }
.acp-icon, .acp-tool, .acp-model {
  position: relative; display: inline-flex; align-items: center; height: 36px; border-radius: 999px; color: var(--acp-t2); white-space: nowrap;
  transition: background-color .12s var(--acp-ease), color .16s var(--acp-ease), border-color .16s var(--acp-ease);
}
.acp-icon { justify-content: center; width: 36px }
.acp-icon:hover, .acp-model:hover, .acp-icon[aria-expanded="true"] { background: var(--acp-hover); color: var(--acp-t1) }
.acp-tool { gap: 6px; padding: 0 12px 0 10px; border: 1px solid var(--acp-line) }
.acp-tool:hover { background: var(--acp-wash); color: var(--acp-t1) }
.acp-tool[aria-pressed="true"], .acp-icon[aria-pressed="true"] {
  color: var(--acp-accent); border-color: color-mix(in oklab, var(--acp-accent) 38%, transparent);
  background: color-mix(in oklab, var(--acp-accent) 10%, transparent);
}
.acp-icon[aria-pressed="true"] { border: 0 }
.acp-model { gap: 6px; padding: 0 8px 0 10px; color: var(--acp-t1) }
.acp-mark { flex: none; display: inline-grid; place-items: center; width: 16px; height: 16px; color: var(--acp-mk, var(--acp-t1)) }
.acp-mark svg { display: block }
.acp-modelName { font-weight: 500 }
.acp-modelEffort { color: var(--acp-t3) }
.acp-modelText { display: inline-flex; align-items: center; gap: 6px; overflow: hidden }
.acp-chev { color: var(--acp-t3); transition: transform .2s var(--acp-ease) }
.acp-model[aria-expanded="true"] .acp-chev { transform: rotate(180deg) }
[data-tip] { position: relative }
[data-tip]::after {
  content: attr(data-tip); position: absolute; left: 50%; bottom: calc(100% + 6px); z-index: 50; transform: translate(-50%, 3px);
  padding: 4px 8px; border-radius: 8px; background: var(--acp-ink); color: var(--acp-on-ink); font-size: 12px; line-height: 16px;
  white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .14s var(--acp-ease), transform .14s var(--acp-ease);
}
.acp-tool[data-tip]::after { display: none }
@media (hover: hover) { [data-tip]:hover::after { opacity: 1; transform: translate(-50%, 0); transition-delay: .35s } }
[data-tip]:focus-visible::after { opacity: 1; transform: translate(-50%, 0) }
[data-tip][aria-expanded="true"]::after { display: none }

/* Send */
.acp-send {
  position: relative; flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%;
  background: var(--acp-wash); color: var(--acp-t3);
  transition: background-color .16s var(--acp-ease), color .16s var(--acp-ease), transform .58s var(--acp-spring);
}
.acp-send[data-state="ready"], .acp-send[data-state="stop"] { background: var(--acp-ink); color: var(--acp-on-ink) }
.acp-send[data-state="ready"]:hover { transform: scale(1.06) }
.acp-send[data-state="ready"]:active, .acp-send[data-state="stop"]:active { transform: scale(.94); transition-duration: .1s }
.acp-glyph { position: absolute; display: grid; place-items: center; transition: transform .45s var(--acp-spring), opacity .18s var(--acp-ease) }
.acp-send[data-state="stop"] .acp-gArrow { transform: translateY(-14px) scale(.6); opacity: 0 }
.acp-send:not([data-state="stop"]) .acp-gStop { transform: scale(.4); opacity: 0 }
.acp-ring { position: absolute; inset: -4px; width: 44px; height: 44px; transform: rotate(-90deg); pointer-events: none; opacity: 0; transition: opacity .3s var(--acp-ease) }
.acp-ring circle { fill: none; stroke-width: 2 }
.acp-ring .t { stroke: var(--acp-line) }
.acp-ring .p { stroke: var(--acp-accent); stroke-linecap: round; stroke-dasharray: 125.66; stroke-dashoffset: 125.66 }
.acp-send[data-state="stop"] .acp-ring { opacity: 1 }
.acp-send[data-indet] .acp-ring { animation: acp-spin 1.1s linear infinite }
.acp-send[data-indet] .acp-ring .p { stroke-dashoffset: 94 }
.acp-count { display: inline-flex; align-items: center; gap: 6px; flex: none; margin-right: 2px; color: var(--acp-t3); font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums }
.acp-count svg { width: 20px; height: 20px; transform: rotate(-90deg) }
.acp-count circle { fill: none; stroke-width: 2.4 }
.acp-count .t { stroke: var(--acp-line) }
.acp-count .p { stroke: var(--acp-t3); stroke-linecap: round; transition: stroke-dashoffset .12s linear, stroke .16s }
.acp-count[data-warn] { color: var(--acp-warn) }
.acp-count[data-warn] .p { stroke: var(--acp-warn) }
@container (max-width: 399px) { .acp-count > span { display: none } }
.acp-wave { display: inline-flex; align-items: center; gap: 2px; height: 16px }
.acp-wave i { display: block; width: 2px; height: 14px; border-radius: 2px; background: currentColor; transform: scaleY(.25); transform-origin: center }

/* Popovers */
.acp-menu, .acp-list {
  position: absolute; bottom: calc(100% + 10px); z-index: 40; padding: 5px; border-radius: 26px; background: var(--acp-surface);
  box-shadow: var(--acp-pop); border: 1px solid transparent; transform-origin: 50% 100%; animation: acp-pop .18s var(--acp-ease) backwards;
}
:is(.dark, [data-theme="dark"]) .acp-menu, :is(.dark, [data-theme="dark"]) .acp-list { border-color: var(--acp-line) }
.acp-menu[data-align="start"] { left: 0 }
.acp-menu[data-align="end"] { right: 0 }
.acp-menu { min-width: 210px }
.acp-menu[data-model] { width: 296px; max-width: calc(100cqw - 24px) }
.acp-item {
  display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 0 11px; border-radius: 20px; color: var(--acp-t1);
  transition: background-color .1s var(--acp-ease);
}
.acp-item:hover, .acp-item:focus-visible { background: var(--acp-wash) }
.acp-item:focus-visible { outline-offset: -2px }
.acp-itemIcon { flex: none; display: grid; place-items: center; width: 18px; color: var(--acp-t2) }
.acp-sep { height: 1px; margin: 5px -5px; background: var(--acp-soft) }
.acp-mItem { min-height: 48px; padding: 6px 10px 6px 11px }
.acp-mText { display: grid; flex: 1; min-width: 0 }
.acp-mNote { font-size: 12px; line-height: 16.8px; color: var(--acp-t3) }
.acp-mCheck { flex: none; width: 16px; color: var(--acp-t1) }
.acp-effHead { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 6px 11px; font-size: 12px; line-height: 16.8px; color: var(--acp-t2) }
.acp-effHint { color: var(--acp-t3) }
.acp-effRow {
  position: relative; display: grid; grid-template-columns: repeat(5, 1fr); margin: 0 3px 3px; padding: 3px; border-radius: 17px; background: var(--acp-wash);
}
.acp-effThumb {
  position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / 5); border-radius: 13px; background: var(--acp-surface);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / .08), 0 0 0 .5px var(--acp-line); transform: translateX(calc(var(--i) * 100%)); transition: transform .35s var(--acp-ease);
}
.acp-eff { position: relative; height: 30px; border-radius: 13px; font-size: 12px; line-height: 16.8px; color: var(--acp-t2); text-align: center !important; transition: color .16s var(--acp-ease) }
.acp-eff[aria-checked="true"] { color: var(--acp-t1) }
.acp-list { left: 8px; width: 300px; max-width: calc(100% - 16px); max-height: 280px; overflow-y: auto; border-radius: 20px; overscroll-behavior: contain }
.acp-group2 { padding: 6px 10px 4px; font-size: 12px; line-height: 16.8px; color: var(--acp-t3) }
.acp-opt { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 5px 10px; border-radius: 15px; cursor: pointer }
.acp-opt[aria-selected="true"] { background: var(--acp-wash) }
.acp-optText { display: grid; min-width: 0; flex: 1 }
.acp-optLabel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.acp-optHint { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 16.8px; color: var(--acp-t3) }
.acp-empty { padding: 10px; font-size: 13px; color: var(--acp-t3) }

/* Suggestions */
.acp-suggest { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 16px 0 0; padding: 0; list-style: none }
.acp-sug {
  display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 12px; border-radius: 999px; color: var(--acp-t2); text-align: left;
  transition: background-color .14s var(--acp-ease), color .16s var(--acp-ease), transform .3s var(--acp-ease);
  background: var(--acp-wash); animation: acp-rise .5s var(--acp-ease) backwards;
}
.acp-suggest li:nth-child(2) .acp-sug { animation-delay: .06s }
.acp-suggest li:nth-child(3) .acp-sug { animation-delay: .12s }
.acp-sug:hover { background: var(--acp-hover); color: var(--acp-t1) }
.acp-sug:active { transform: scale(.97) }
.acp-sug svg { flex: none; color: var(--acp-t3) }

/* Thread */
.acp-thread { flex: 1; min-height: 0; margin: 0 -24px; padding: 56px 24px 8px; overflow-y: auto; scroll-behavior: auto; overscroll-behavior: contain }
.acp-turns { display: grid; gap: 32px; width: 100%; max-width: 720px; margin: 0 auto; padding: 0; list-style: none }
.acp-turn { display: grid; gap: 20px; min-width: 0 }
.acp-sent { display: grid; justify-items: end; gap: 8px; animation: acp-lift .5s var(--acp-ease) backwards }
.acp-bubble {
  margin: 0; max-width: min(82%, 544px); padding: 10px 16px; border-radius: 20px; background: var(--acp-wash); font-size: 16px; line-height: 24px;
  letter-spacing: -.01em; white-space: pre-wrap; overflow-wrap: anywhere;
}
.acp-sentFiles { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px }
.acp-sentFile { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 8px; border-radius: 999px; border: 1px solid var(--acp-line); font-size: 12px; color: var(--acp-t2) }
.acp-reply { display: grid; gap: 10px; min-width: 0 }
.acp-replyHead { display: flex; align-items: center; gap: 8px; color: var(--acp-t2) }
.acp-steps { display: grid; gap: 2px; color: var(--acp-t3); font-size: 14px }
.acp-step { display: inline-flex; align-items: center; gap: 8px; animation: acp-fade .3s var(--acp-ease) backwards }
.acp-step svg { flex: none }
.acp-shimmer { position: relative }
.acp-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, var(--acp-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: acp-sweep 1.6s linear infinite;
}
.acp-replyText { margin: 0; font-size: 16px; line-height: 25.6px; letter-spacing: -.01em; white-space: pre-wrap; overflow-wrap: anywhere }
.acp-chunk { animation: acp-chunk .16s linear backwards }
.acp-foot { display: flex; align-items: center; gap: 4px; margin-left: -6px; min-height: 36px }
.acp-footBtn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 36px; height: 32px; padding: 0 10px; border-radius: 999px; color: var(--acp-t2);
  transition: background-color .12s var(--acp-ease), color .16s var(--acp-ease);
}
.acp-footBtn:hover { background: var(--acp-hover); color: var(--acp-t1) }
.acp-note { font-size: 12px; color: var(--acp-t3); margin-left: 6px }
.acp-error { display: inline-flex; align-items: center; gap: 8px; color: var(--acp-warn) }

@keyframes acp-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes acp-spin { to { transform: rotate(270deg) } }
@keyframes acp-chunk { from { opacity: 0 } to { opacity: 1 } }
@keyframes acp-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes acp-rise { from { opacity: 0; transform: translateY(8px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }
@keyframes acp-lift { from { opacity: 0; transform: translateY(14px) scale(.98) } to { opacity: 1; transform: none } }
@keyframes acp-scale { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: none } }
@keyframes acp-pop { from { opacity: 0; transform: translateY(6px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes acp-check { from { opacity: 0; transform: scale(.3) } to { opacity: 1; transform: none } }

/* Responsive: the block adapts to its own width */
@container (max-width: 679px) {
  .acp-tool { width: 36px; padding: 0; justify-content: center; border-color: transparent }
  .acp-tool .acp-toolLabel { display: none }
  .acp-tool[data-tip]::after { display: block }
  .acp-tool[aria-pressed="true"] { border-color: transparent }
}
@container (max-width: 559px) { .acp-modelEffort { display: none } .acp-stage { padding: 16px } .acp-thread { margin: 0 -16px; padding-inline: 16px } .acp-greeting { font-size: 30px } }
@container (max-width: 399px) {
  .acp-modelText { display: none }
  .acp-model { padding: 0 8px 0 10px }
  .acp-suggest { flex-direction: column; align-items: stretch }
  .acp-sug { width: 100%; height: auto; min-height: 36px; padding-block: 7px }
  .acp-greeting { font-size: 26px }
  .acp-stage { padding: 12px } .acp-thread { margin: 0 -12px; padding-inline: 12px }
  .acp-bubble { max-width: 92% }
}
@media (prefers-reduced-motion: reduce) {
  .acp *, .acp *::before, .acp *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Segment = { text: string; token?: ComposerToken }
type Trigger = { kind: "command" | "mention"; start: number; query: string }
type TurnStatus = "thinking" | "streaming" | "done" | "stopped" | "error"
type Turn = {
  id: number
  message: ComposerMessage
  status: TurnStatus
  /** Text that has settled into one string. */
  settled: string
  /** The newest chunks, each fading in once. */
  live: string[]
  steps: { id: string; label: string; done: boolean }[]
  simulated: boolean
  error?: string
}

const uid = (() => {
  let n = 0
  return () => ++n
})()

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

function findTokens(text: string, commands: ComposerCommand[], mentions: ComposerMention[]): ComposerToken[] {
  const out: ComposerToken[] = []
  if (commands.length) {
    const re = new RegExp(`(^|\\n)(${commands.map((c) => escapeRe(c.label)).sort((a, b) => b.length - a.length).join("|")})(?=\\s|$)`, "g")
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const start = m.index + m[1].length
      const c = commands.find((x) => x.label === m![2])!
      out.push({ kind: "command", id: c.id, label: c.label, start, end: start + c.label.length })
    }
  }
  if (mentions.length) {
    const re = new RegExp(`(^|\\s)(@(?:${mentions.map((x) => escapeRe(x.label)).sort((a, b) => b.length - a.length).join("|")}))(?![\\w.-])`, "g")
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const start = m.index + m[1].length
      const mm = mentions.find((x) => `@${x.label}` === m![2])!
      out.push({ kind: "mention", id: mm.id, label: m[2], start, end: start + m[2].length })
    }
  }
  return out.sort((a, b) => a.start - b.start)
}

function segmentsOf(text: string, tokens: ComposerToken[]): Segment[] {
  const out: Segment[] = []
  let at = 0
  for (const t of tokens) {
    if (t.start > at) out.push({ text: text.slice(at, t.start) })
    out.push({ text: text.slice(t.start, t.end), token: t })
    at = t.end
  }
  if (at < text.length) out.push({ text: text.slice(at) })
  return out
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

function ModelMark({ mark }: { mark: ComposerModel["mark"] }) {
  if (mark === "spark" || mark === undefined) return <span className="acp-mark" style={{ ["--acp-mk" as string]: "#d4623a" }}><Sparkles size={15} strokeWidth={2} aria-hidden /></span>
  if (mark === "hex") return <span className="acp-mark" style={{ ["--acp-mk" as string]: "#0f9d7a" }}><Hexagon size={15} strokeWidth={2} aria-hidden /></span>
  if (mark === "diamond") return <span className="acp-mark" style={{ ["--acp-mk" as string]: "#3b6cf0" }}><Diamond size={15} strokeWidth={2} aria-hidden /></span>
  return <span className="acp-mark">{mark}</span>
}

const SUG_ICON = { summary: FileText, draft: PenLine, bug: Bug } as const
const CMD_ICON: Record<string, typeof FileText> = { summarize: FileText, translate: Languages, explain: Lightbulb, fix: Wrench }

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function AiComposer({
  onSend,
  greeting = "What should we work on?",
  suggestions = SAMPLE_SUGGESTIONS,
  models = SAMPLE_MODELS,
  defaultModel,
  defaultEffort,
  placeholder = "Ask anything, / for commands, @ to add context",
  maxLength = 4000,
  commands = SAMPLE_COMMANDS,
  mentions = SAMPLE_MENTIONS,
  height = 560,
  framed = true,
  className,
}: AiComposerProps) {
  const uidBase = React.useId().replace(/:/g, "")
  const rootRef = React.useRef<HTMLDivElement>(null)
  const dockRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const mirrorRef = React.useRef<HTMLDivElement>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const threadRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<SVGCircleElement>(null)
  const waveRef = React.useRef<HTMLSpanElement>(null)

  const firstModel = models.find((m) => m.id === defaultModel) ?? models[0]
  const [modelId, setModelId] = React.useState(firstModel?.id ?? "")
  const model = models.find((m) => m.id === modelId) ?? firstModel
  const [effort, setEffort] = React.useState<ComposerEffort>(defaultEffort ?? firstModel?.defaultEffort ?? "medium")
  const [value, setValue] = React.useState("")
  const [caret, setCaret] = React.useState(0)
  const [attachments, setAttachments] = React.useState<ComposerAttachment[]>([])
  const [webSearch, setWebSearch] = React.useState(false)
  const [thinking, setThinking] = React.useState(false)
  const [menu, setMenu] = React.useState<null | "plus" | "model">(null)
  const [dismissed, setDismissed] = React.useState(-1)
  const [active, setActive] = React.useState(0)
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [dictating, setDictating] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [status, setStatus] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  const pendingCaret = React.useRef<number | null>(null)
  const dockTop = React.useRef<number | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  const runRef = React.useRef(0)
  const lastMessage = React.useRef<ComposerMessage | null>(null)
  const urls = React.useRef(new Set<string>())
  const timers = React.useRef(new Set<number>())
  const dictationBase = React.useRef<string | null>(null)

  const streaming = turns.some((t) => t.status === "thinking" || t.status === "streaming")
  const hasChat = turns.length > 0

  /* ---------- tokens, triggers ---------- */
  const tokens = React.useMemo(() => findTokens(value, commands, mentions), [value, commands, mentions])
  const segments = React.useMemo(() => segmentsOf(value, tokens), [value, tokens])

  const trigger = React.useMemo<Trigger | null>(() => {
    if (tokens.some((t) => caret > t.start && caret <= t.end)) return null
    const before = value.slice(0, caret)
    const c = /(^|\n)\/([\w-]*)$/.exec(before)
    if (c && commands.length) return { kind: "command", start: before.length - c[2].length - 1, query: c[2] }
    const m = /(^|\s)@([^\s@]*)$/.exec(before)
    if (m && mentions.length) return { kind: "mention", start: before.length - m[2].length - 1, query: m[2] }
    return null
  }, [value, caret, tokens, commands.length, mentions.length])

  const options = React.useMemo(() => {
    if (!trigger) return []
    const q = trigger.query.toLowerCase()
    if (trigger.kind === "command") return commands.filter((c) => c.label.slice(1).toLowerCase().startsWith(q)).map((c) => ({ id: c.id, label: c.label, hint: c.hint, group: "" }))
    return mentions.filter((x) => x.label.toLowerCase().includes(q)).map((x) => ({ id: x.id, label: x.label, hint: x.hint, group: x.group }))
  }, [trigger, commands, mentions])

  const listOpen = !!trigger && options.length > 0 && dismissed !== trigger.start && !streaming
  const safeActive = Math.min(active, Math.max(0, options.length - 1))
  const listId = `${uidBase}-list`

  /* ---------- send readiness ---------- */
  const uploading = attachments.some((a) => a.status === "uploading")
  const overLimit = value.length > maxLength
  const hasContent = value.trim().length > 0 || attachments.some((a) => a.status === "done")
  const ready = hasContent && !uploading && !overLimit
  const sendState: "idle" | "ready" | "stop" = streaming ? "stop" : ready ? "ready" : "idle"
  const sendLabel = streaming ? "Stop generating" : overLimit ? "Send with the message over the limit" : uploading ? "Send after uploads finish" : "Send message"
  const ratio = value.length / maxLength

  /* ---------- timers / cleanup ---------- */
  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
    return id
  }, [])

  const abortNow = React.useCallback(() => {
    abortRef.current?.abort()
    runRef.current++
  }, [])

  React.useEffect(() => {
    const t = timers.current
    const u = urls.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      u.forEach((x) => URL.revokeObjectURL(x))
      abortNow()
    }
  }, [abortNow])

  /* ---------- caret restore after programmatic edits ---------- */
  React.useLayoutEffect(() => {
    if (pendingCaret.current != null && inputRef.current) {
      const p = pendingCaret.current
      pendingCaret.current = null
      inputRef.current.setSelectionRange(p, p)
    }
  })

  /* ---------- the dock glides from the middle to the bottom ---------- */
  React.useLayoutEffect(() => {
    const el = dockRef.current
    if (dockTop.current == null || !el) return
    const dy = dockTop.current - el.getBoundingClientRect().top
    dockTop.current = null
    if (Math.abs(dy) > 1 && !prefersReducedMotion()) {
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 620, easing: "cubic-bezier(.22, 1, .36, 1)" })
    }
  }, [hasChat])

  /* ---------- follow the stream ---------- */
  const lastTurn = turns[turns.length - 1]
  const follow = lastTurn ? lastTurn.settled.length + lastTurn.live.length + lastTurn.steps.length + lastTurn.status : ""
  React.useLayoutEffect(() => {
    const el = threadRef.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 140) el.scrollTop = el.scrollHeight
  }, [follow, turns.length])

  /* ---------- attachments ---------- */
  const addAttachment = React.useCallback(
    (a: Omit<ComposerAttachment, "id" | "progress" | "status"> & { status?: ComposerAttachment["status"] }, duration = 1300) => {
      const id = `a${uid()}`
      const status = a.status ?? "uploading"
      setAttachments((list) => [...list, { ...a, id, status, progress: status === "uploading" ? 0 : 1 }])
      if (status !== "uploading") return id
      const t0 = performance.now()
      const iv = window.setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / duration)
        setAttachments((list) => list.map((x) => (x.id === id && x.status === "uploading" ? { ...x, progress: p, status: p >= 1 ? "done" : "uploading" } : x)))
        if (p >= 1) {
          window.clearInterval(iv)
          timers.current.delete(iv)
          setStatus(`${a.name} finished uploading`)
        }
      }, 80)
      timers.current.add(iv)
      return id
    },
    [],
  )

  const addFiles = React.useCallback(
    (files: File[]) => {
      for (const file of files) {
        const isImage = file.type.startsWith("image/")
        let preview: string | undefined
        if (isImage) {
          preview = URL.createObjectURL(file)
          urls.current.add(preview)
        }
        if (file.size > 25 * 1024 * 1024) {
          addAttachment({ name: file.name, size: formatSize(file.size), kind: isImage ? "image" : "file", file, preview, status: "error", error: "Over 25 MB" })
        } else {
          addAttachment({ name: file.name, size: formatSize(file.size), kind: isImage ? "image" : "file", file, preview }, 900 + Math.min(1500, file.size / 4000))
        }
      }
    },
    [addAttachment],
  )

  const removeAttachment = (a: ComposerAttachment) => {
    setAttachments((list) => list.filter((x) => x.id !== a.id))
    if (a.preview) {
      URL.revokeObjectURL(a.preview)
      urls.current.delete(a.preview)
    }
    setStatus(a.status === "uploading" ? `Upload of ${a.name} cancelled` : `${a.name} removed`)
    inputRef.current?.focus()
  }

  /* ---------- editing ---------- */
  const edit = (next: string, at: number) => {
    pendingCaret.current = at
    setValue(next)
    setCaret(at)
  }

  const syncCaret = () => {
    const el = inputRef.current
    if (el) setCaret(el.selectionStart ?? 0)
  }

  const insertOption = (o: { label: string }) => {
    if (!trigger) return
    const text = trigger.kind === "command" ? `${o.label} ` : `@${o.label} `
    const next = value.slice(0, trigger.start) + text + value.slice(caret)
    edit(next, trigger.start + text.length)
    setActive(0)
    inputRef.current?.focus()
  }

  const startMention = () => {
    const el = inputRef.current
    const at = el?.selectionStart ?? value.length
    const before = value.slice(0, at)
    const lead = before && !/\s$/.test(before) ? " " : ""
    edit(before + lead + "@" + value.slice(at), at + lead.length + 1)
    setDismissed(-1)
    el?.focus()
  }

  const pickPrompt = (s: ComposerSuggestion) => {
    edit(s.prompt, s.prompt.length)
    setDismissed(s.prompt.length)
    inputRef.current?.focus()
  }

  /* ---------- dictation (simulated) ---------- */
  const stopDictation = React.useCallback((cancel: boolean) => {
    setDictating(false)
    const base = dictationBase.current
    dictationBase.current = null
    if (cancel && base != null) {
      setValue(base)
      setCaret(base.length)
      setStatus("Dictation cancelled")
    } else {
      setStatus("Dictation finished. Dictation is simulated in this preview.")
    }
  }, [])

  React.useEffect(() => {
    if (!dictating) return
    const words = DICTATION.split(" ")
    const base = dictationBase.current ?? ""
    let i = 0
    const iv = window.setInterval(() => {
      i++
      const text = base + (base && !/\s$/.test(base) ? " " : "") + words.slice(0, i).join(" ")
      setValue(text)
      setCaret(text.length)
      if (i >= words.length) {
        window.clearInterval(iv)
        dictationBase.current = null
        setDictating(false)
        setStatus("Dictation finished. Dictation is simulated in this preview.")
      }
    }, 280)
    let raf = 0
    const tick = (t: number) => {
      const bars = waveRef.current?.children
      if (bars) for (let k = 0; k < bars.length; k++) (bars[k] as HTMLElement).style.transform = `scaleY(${0.3 + 0.7 * Math.abs(Math.sin(t / 170 + k * 1.3) * Math.sin(t / 410 + k))})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.clearInterval(iv)
      cancelAnimationFrame(raf)
    }
  }, [dictating])

  const toggleDictation = () => {
    if (dictating) return stopDictation(false)
    dictationBase.current = value
    setDictating(true)
    setStatus("Listening. Dictation is simulated in this preview.")
    inputRef.current?.focus()
  }

  /* ---------- the reply: a clock reveals whole words every 34 ms ---------- */
  const patchTurn = React.useCallback((id: number, fn: (t: Turn) => Turn) => setTurns((list) => list.map((t) => (t.id === id ? fn(t) : t))), [])

  const setRing = React.useCallback((p: number | null) => {
    const el = ringRef.current
    const btn = el?.closest(".acp-send") as HTMLElement | null
    if (!el || !btn) return
    if (p == null) {
      btn.setAttribute("data-indet", "")
      el.style.strokeDashoffset = ""
    } else {
      btn.removeAttribute("data-indet")
      el.style.strokeDashoffset = String(125.66 * (1 - p))
    }
  }, [])

  const runReply = React.useCallback(
    async (message: ComposerMessage, turnId: number) => {
      const run = ++runRef.current
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const alive = () => runRef.current === run && !ctrl.signal.aborted

      // Steps shown before the first word.
      const steps: { id: string; label: string; doneLabel: string; ms: number }[] = []
      if (message.webSearch) steps.push({ id: "web", label: "Searching the web", doneLabel: "Searched 6 sites", ms: 900 })
      if (message.thinking) steps.push({ id: "think", label: "Thinking", doneLabel: `Thought for ${message.effort === "low" ? 1 : message.effort === "medium" ? 2 : 3}s`, ms: 700 + EFFORTS.findIndex((e) => e.id === message.effort) * 140 })
      if (!steps.length) steps.push({ id: "think", label: "Thinking", doneLabel: "", ms: 520 })

      setRing(0)
      let produced: AsyncIterable<string> | null = null
      try {
        const out = await onSend?.(message, { signal: ctrl.signal })
        if (out && typeof out === "object" && Symbol.asyncIterator in out) produced = out as AsyncIterable<string>
      } catch (e) {
        if (alive()) patchTurn(turnId, (t) => ({ ...t, status: "error", error: e instanceof Error ? e.message : "Something went wrong" }))
        setRing(null)
        return
      }
      if (!alive()) return
      const simulated = !produced
      patchTurn(turnId, (t) => ({ ...t, simulated }))

      for (const s of steps) {
        patchTurn(turnId, (t) => ({ ...t, steps: [...t.steps, { id: s.id, label: s.label, done: false }] }))
        setStatus(`${s.label}`)
        await new Promise<void>((r) => later(r, s.ms))
        if (!alive()) return
        patchTurn(turnId, (t) => ({ ...t, steps: t.steps.map((x) => (x.id === s.id ? { ...x, label: s.doneLabel || x.label, done: true } : x)) }))
      }
      // The no-step "Thinking" line disappears again once the first word is in.
      const quiet = !message.webSearch && !message.thinking

      // Buffer of text waiting for the clock.
      let pending = ""
      let finished = false
      let total = 0
      let shown = 0
      let failed: string | null = null
      if (produced) {
        void (async () => {
          try {
            for await (const delta of produced!) {
              if (!alive()) return
              pending += delta
              total += delta.length
            }
          } catch (e) {
            if (alive()) failed = e instanceof Error ? e.message : "Something went wrong"
          }
          finished = true
        })()
      } else {
        const sim = SIMULATED.find((s) => s.match.test(message.text.trim()))!.text
        pending = sim
        total = sim.length
        finished = true
      }

      patchTurn(turnId, (t) => ({ ...t, status: "streaming", steps: quiet ? [] : t.steps }))
      await new Promise<void>((resolve) => {
        let last = 0
        const tick = (now: number) => {
          if (!alive()) return resolve()
          if (now - last >= 34) {
            last = now
            if (pending) {
              const words = pending.match(/\S+\s*/g) ?? [pending]
              const k = pending.length > 600 ? 12 : pending.length > 400 ? 6 : 2
              const chunk = words.slice(0, k).join("")
              pending = pending.slice(chunk.length)
              shown += chunk.length
              patchTurn(turnId, (t) => {
                const live = [...t.live, chunk]
                let settled = t.settled
                while (live.length > 6) settled += live.shift()
                return { ...t, settled, live }
              })
              setRing(simulated || finished ? Math.min(1, shown / Math.max(total, 1)) : null)
            } else if (finished) return resolve()
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      if (!alive()) return
      if (failed) patchTurn(turnId, (t) => ({ ...t, status: "error", error: failed! }))
      else {
        patchTurn(turnId, (t) => ({ ...t, status: "done" }))
        setStatus(simulated ? "Reply finished. This reply is simulated." : "Reply finished")
      }
      setRing(1)
    },
    [later, onSend, patchTurn, setRing],
  )

  const stop = React.useCallback(() => {
    abortRef.current?.abort()
    runRef.current++
    setTurns((list) => list.map((t) => (t.status === "thinking" || t.status === "streaming" ? { ...t, status: "stopped", settled: t.settled + t.live.join(""), live: [] } : t)))
    setStatus("Reply stopped")
    setRing(0)
  }, [setRing])

  const submit = () => {
    if (streaming) return stop()
    if (!ready) {
      setStatus(overLimit ? "The message is over the limit" : uploading ? "Waiting for uploads to finish" : "Write a message first")
      return
    }
    if (!model) return
    const message: ComposerMessage = {
      text: value.trim(),
      tokens: findTokens(value.trim(), commands, mentions),
      attachments: attachments.filter((a) => a.status === "done"),
      files: attachments.flatMap((a) => (a.status === "done" && a.file ? [a.file] : [])),
      model: model.id,
      effort,
      webSearch,
      thinking,
    }
    lastMessage.current = message
    dockTop.current = dockRef.current?.getBoundingClientRect().top ?? null
    const turnId = uid()
    setTurns((list) => [...list, { id: turnId, message, status: "thinking", settled: "", live: [], steps: [], simulated: !onSend }])
    setValue("")
    setCaret(0)
    setAttachments([])
    setDismissed(-1)
    setStatus("Message sent")
    void runReply(message, turnId)
  }

  const retry = () => {
    const message = lastMessage.current
    if (!message || streaming) return
    const turnId = uid()
    setTurns((list) => [...list.slice(0, -1), { id: turnId, message, status: "thinking", settled: "", live: [], steps: [], simulated: !onSend }])
    void runReply(message, turnId)
  }

  const copyReply = async (t: Turn) => {
    try {
      await navigator.clipboard.writeText(t.settled + t.live.join(""))
    } catch {
      /* clipboard can be blocked; the check still confirms the click */
    }
    setCopied(true)
    setStatus("Reply copied")
    later(() => setCopied(false), 1400)
  }

  /* ---------- keyboard ---------- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (e.nativeEvent.isComposing) return
    if (listOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setActive((safeActive + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertOption(options[safeActive])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setDismissed(trigger!.start)
        return
      }
    }
    if (e.key === "Escape") {
      if (dictating) {
        e.preventDefault()
        return stopDictation(true)
      }
      if (streaming) {
        e.preventDefault()
        return stop()
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      return submit()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      return submit()
    }
    // Tokens are atomic: delete them whole, hop over them with the arrow keys.
    const a = el.selectionStart
    const b = el.selectionEnd
    if (a === b && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      if (e.key === "Backspace") {
        const t = tokens.find((x) => a > x.start && a <= x.end)
        if (t) {
          e.preventDefault()
          return edit(value.slice(0, t.start) + value.slice(t.end), t.start)
        }
      } else if (e.key === "Delete") {
        const t = tokens.find((x) => a >= x.start && a < x.end)
        if (t) {
          e.preventDefault()
          return edit(value.slice(0, t.start) + value.slice(t.end), t.start)
        }
      } else if (e.key === "ArrowLeft") {
        const t = tokens.find((x) => a > x.start && a <= x.end)
        if (t) {
          e.preventDefault()
          return edit(value, t.start)
        }
      } else if (e.key === "ArrowRight") {
        const t = tokens.find((x) => a >= x.start && a < x.end)
        if (t) {
          e.preventDefault()
          return edit(value, t.end)
        }
      }
    }
  }

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files)
    if (files.length) {
      e.preventDefault()
      addFiles(files)
      setStatus(`${files.length} file${files.length > 1 ? "s" : ""} added`)
      return
    }
    const text = e.clipboardData.getData("text")
    if (text.length > 700 || text.split("\n").length > 12) {
      e.preventDefault()
      addAttachment({ name: "Pasted text", size: `${text.split(/\s+/).length} words`, kind: "paste", text }, 500)
      setStatus("A long paste was added as an attachment")
    }
  }

  const onScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (mirrorRef.current) mirrorRef.current.style.transform = `translateY(${-e.currentTarget.scrollTop}px)`
  }

  /* ---------- menus ---------- */
  const closeMenu = (refocus = true) => {
    setMenu(null)
    if (refocus) inputRef.current?.focus()
  }

  React.useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(".acp-anchor")) setMenu(null)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [menu])

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      closeMenu()
      return
    }
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-nav]"))
    const inEffort = (document.activeElement as HTMLElement | null)?.closest("[data-effort]")
    if (inEffort && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault()
      const k = EFFORTS.findIndex((x) => x.id === effort)
      const n = Math.max(0, Math.min(EFFORTS.length - 1, k + (e.key === "ArrowRight" ? 1 : -1)))
      chooseEffort(EFFORTS[n].id)
      requestAnimationFrame(() => e.currentTarget.querySelectorAll<HTMLElement>("[data-effort] button")[n]?.focus())
      return
    }
    const nav = items.filter((x) => !x.closest("[data-effort]"))
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const j = nav.indexOf(document.activeElement as HTMLElement)
      const to = j < 0 ? (e.key === "ArrowDown" ? 0 : nav.length - 1) : (j + (e.key === "ArrowDown" ? 1 : -1) + nav.length) % nav.length
      nav[to]?.focus()
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      nav[e.key === "Home" ? 0 : nav.length - 1]?.focus()
    } else if (e.key === "Tab") {
      closeMenu(false)
    }
  }

  const menuRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const target = node.querySelector<HTMLElement>("[aria-checked='true'][data-nav]") ?? node.querySelector<HTMLElement>("[data-nav]")
    target?.focus({ preventScroll: true })
  }, [])

  const chooseModel = (m: ComposerModel) => {
    setModelId(m.id)
    setEffort(m.defaultEffort ?? "medium")
    setStatus(`${m.name} selected, effort ${m.defaultEffort ?? "medium"}`)
  }
  const chooseEffort = (id: ComposerEffort) => {
    setEffort(id)
    setStatus(`Effort ${id}`)
  }

  const plusAction = (kind: "upload" | "drive" | "repo" | "shot" | "mention") => {
    closeMenu(kind !== "upload")
    if (kind === "upload") return fileRef.current?.click()
    if (kind === "mention") return startMention()
    const demo = {
      drive: { name: "Q4 budget.xlsx", size: "1.2 MB", kind: "file" as const },
      repo: { name: "checkout-flow.tsx", size: "8 KB", kind: "file" as const },
      shot: { name: "Screenshot.png", size: "640 KB", kind: "image" as const },
    }[kind]
    addAttachment(demo, 1100)
    setStatus(`${kind === "drive" ? "Drive" : kind === "repo" ? "Repository" : "Screenshot"} actions are simulated in this preview`)
  }

  const activeOpt = listOpen ? options[safeActive] : null
  const effortIndex = Math.max(0, EFFORTS.findIndex((e) => e.id === effort))
  const ringC = 2 * Math.PI * 9
  const showCount = ratio >= 0.8

  const groups: [string, typeof options][] = []
  if (listOpen && trigger!.kind === "mention") {
    for (const o of options) {
      const g = groups.find((x) => x[0] === o.group)
      if (g) g[1].push(o)
      else groups.push([o.group, [o]])
    }
  } else if (listOpen) groups.push(["", options])

  return (
    <div
      ref={rootRef}
      className={["acp", className].filter(Boolean).join(" ")}
      data-framed={framed ? "" : undefined}
      data-open={menu ? "" : undefined}
      style={{ ["--acp-h" as string]: typeof height === "number" ? `${height}px` : height }}
    >
      <style href="ai-composer" precedence="default">{CSS}</style>

      <div className="acp-stage" data-chat={hasChat ? "" : undefined}>
        {hasChat ? (
          <div className="acp-thread" ref={threadRef}>
            <ol className="acp-turns" aria-label="Conversation">
              {turns.map((t, i) => (
                <TurnView
                  key={t.id}
                  turn={t}
                  model={models.find((m) => m.id === t.message.model) ?? model}
                  last={i === turns.length - 1}
                  copied={copied}
                  onCopy={copyReply}
                  onRetry={retry}
                  segs={segmentsOf(t.message.text, t.message.tokens)}
                />
              ))}
            </ol>
          </div>
        ) : (
          <h2 className="acp-greeting">{greeting}</h2>
        )}

        <div className="acp-dock" ref={dockRef}>
          <div
            className="acp-surface"
            data-drag={dragging ? "" : undefined}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault()
                setDragging(true)
              }
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              setDragging(false)
              if (e.dataTransfer.files.length) {
                e.preventDefault()
                addFiles(Array.from(e.dataTransfer.files))
              }
            }}
          >
            {attachments.length > 0 && (
              <ul className="acp-files" aria-label="Attachments">
                {attachments.map((a) => (
                  <li key={a.id} className="acp-chip" data-status={a.status}>
                    <span className="acp-thumb" aria-hidden>
                      {a.preview ? <img src={a.preview} alt="" /> : a.status === "error" ? <TriangleAlert size={14} /> : a.kind === "image" ? <ImageIcon size={14} /> : a.kind === "paste" ? <FileText size={14} /> : <FileIcon size={14} />}
                      {a.status === "uploading" && (
                        <svg className="acp-ringsvg" viewBox="0 0 28 28">
                          <circle className="t" cx="14" cy="14" r="12" />
                          <circle className="p" cx="14" cy="14" r="12" strokeDasharray={75.4} strokeDashoffset={75.4 * (1 - a.progress)} />
                        </svg>
                      )}
                    </span>
                    <span className="acp-chipText">
                      <span className="acp-chipName">{a.name}</span>
                      <span className="acp-chipMeta">{a.status === "error" ? a.error : a.status === "uploading" ? `${Math.round(a.progress * 100)}%` : a.size}</span>
                    </span>
                    {a.status === "done" && <Check className="acp-pop-check" size={14} aria-hidden />}
                    <button type="button" className="acp-chipX" aria-label={a.status === "uploading" ? `Cancel upload of ${a.name}` : `Remove ${a.name}`} onClick={() => removeAttachment(a)}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="acp-field">
              <div className="acp-mirror" ref={mirrorRef} aria-hidden>
                {value === "" ? <span className="acp-ph">{placeholder}</span> : null}
                {segments.map((s, i) => (s.token ? <mark key={i} className="acp-token">{s.text}</mark> : <React.Fragment key={i}>{s.text}</React.Fragment>))}
                {"​"}
              </div>
              <textarea
                ref={inputRef}
                className="acp-input"
                rows={1}
                value={value}
                spellCheck
                aria-label="Message"
                aria-describedby={`${uidBase}-hint`}
                aria-controls={listOpen ? listId : undefined}
                aria-activedescendant={activeOpt ? `${listId}-${activeOpt.id}` : undefined}
                aria-autocomplete={listOpen ? "list" : undefined}
                onChange={(e) => {
                  setValue(e.target.value)
                  setCaret(e.target.selectionStart ?? 0)
                  setActive(0)
                }}
                onKeyDown={onKeyDown}
                onKeyUp={syncCaret}
                onClick={syncCaret}
                onSelect={syncCaret}
                onPaste={onPaste}
                onScroll={onScroll}
              />
              <span className="acp-sr" id={`${uidBase}-hint`}>
                Enter sends, Shift Enter adds a line. Type slash for commands and at for files and docs.
              </span>
            </div>

            <div className="acp-bar">
              <div className="acp-group">
                <div className="acp-anchor">
                  <button type="button" className="acp-icon" aria-label="Add files and context" aria-haspopup="menu" aria-expanded={menu === "plus"} data-tip="Add" onClick={() => setMenu(menu === "plus" ? null : "plus")}>
                    <Plus size={20} />
                  </button>
                  {menu === "plus" && (
                    <div className="acp-menu" data-align="start" role="menu" aria-label="Add" ref={menuRef} onKeyDown={onMenuKey}>
                      <button type="button" role="menuitem" data-nav className="acp-item" onClick={() => plusAction("upload")}>
                        <span className="acp-itemIcon"><Upload size={16} /></span>Upload file
                      </button>
                      <button type="button" role="menuitem" data-nav className="acp-item" onClick={() => plusAction("drive")}>
                        <span className="acp-itemIcon"><HardDrive size={16} /></span>Add from cloud drive
                      </button>
                      <button type="button" role="menuitem" data-nav className="acp-item" onClick={() => plusAction("repo")}>
                        <span className="acp-itemIcon"><GitBranch size={16} /></span>Add from repository
                      </button>
                      <button type="button" role="menuitem" data-nav className="acp-item" onClick={() => plusAction("shot")}>
                        <span className="acp-itemIcon"><Camera size={16} /></span>Take a screenshot
                      </button>
                      <div className="acp-sep" role="separator" />
                      <button type="button" role="menuitem" data-nav className="acp-item" onClick={() => plusAction("mention")}>
                        <span className="acp-itemIcon"><AtSign size={16} /></span>Mention a file or doc
                      </button>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" multiple hidden tabIndex={-1} onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; inputRef.current?.focus() }} />
                <button type="button" className="acp-tool" aria-pressed={webSearch} data-tip="Web search" onClick={() => { setWebSearch((v) => !v); setStatus(`Web search ${!webSearch ? "on" : "off"}`) }}>
                  <Globe size={16} aria-hidden />
                  <span className="acp-toolLabel">Web search</span>
                  <span className="acp-sr">{webSearch ? "on" : "off"}</span>
                </button>
                <button type="button" className="acp-tool" aria-pressed={thinking} data-tip="Extended thinking" onClick={() => { setThinking((v) => !v); setStatus(`Extended thinking ${!thinking ? "on" : "off"}`) }}>
                  <Brain size={16} aria-hidden />
                  <span className="acp-toolLabel">Extended thinking</span>
                  <span className="acp-sr">{thinking ? "on" : "off"}</span>
                </button>
              </div>

              <div className="acp-group">
                {model && (
                  <div className="acp-anchor">
                    <button type="button" className="acp-model" aria-haspopup="menu" aria-expanded={menu === "model"} aria-label={`Model: ${model.name}, effort ${effort}`} onClick={() => setMenu(menu === "model" ? null : "model")}>
                      <ModelMark mark={model.mark} />
                      <span className="acp-modelText">
                        <span className="acp-modelName">{model.short}</span>
                        <span className="acp-modelEffort">{EFFORTS[effortIndex].label}</span>
                      </span>
                      <ChevronDown className="acp-chev" size={14} aria-hidden />
                    </button>
                    {menu === "model" && (
                      <div className="acp-menu" data-align="end" data-model role="menu" aria-label="Model and effort" ref={menuRef} onKeyDown={onMenuKey}>
                        {models.map((m) => (
                          <button key={m.id} type="button" role="menuitemradio" aria-checked={m.id === modelId} data-nav className="acp-item acp-mItem" onClick={() => chooseModel(m)}>
                            <ModelMark mark={m.mark} />
                            <span className="acp-mText">
                              <span>{m.name}</span>
                              <span className="acp-mNote">{m.note}</span>
                            </span>
                            <span className="acp-mCheck">{m.id === modelId && <Check size={16} aria-hidden />}</span>
                          </button>
                        ))}
                        <div className="acp-sep" role="separator" />
                        <div className="acp-effHead">
                          <span id={`${uidBase}-eff`}>Effort</span>
                          <span className="acp-effHint">{EFFORT_HINT[effort]}</span>
                        </div>
                        <div className="acp-effRow" role="group" aria-labelledby={`${uidBase}-eff`} data-effort style={{ ["--i" as string]: effortIndex }}>
                          <span className="acp-effThumb" aria-hidden />
                          {EFFORTS.map((x) => (
                            <button key={x.id} type="button" role="menuitemradio" aria-checked={x.id === effort} data-nav tabIndex={x.id === effort ? 0 : -1} className="acp-eff" onClick={() => chooseEffort(x.id)}>
                              {x.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {showCount && (
                  <span className="acp-count" data-warn={ratio >= 0.95 ? "" : undefined} role="img" aria-label={`${value.length} of ${maxLength} characters`}>
                    <svg viewBox="0 0 22 22" aria-hidden>
                      <circle className="t" cx="11" cy="11" r="9" />
                      <circle className="p" cx="11" cy="11" r="9" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - Math.min(1, ratio))} />
                    </svg>
                    <span aria-hidden>{maxLength - value.length}</span>
                  </span>
                )}
                <button type="button" className="acp-icon" aria-pressed={dictating} data-tip={dictating ? "Stop dictation" : "Dictate"} aria-label="Dictate" onClick={toggleDictation}>
                  {dictating ? (
                    <span className="acp-wave" ref={waveRef} aria-hidden><i /><i /><i /><i /></span>
                  ) : (
                    <Mic size={20} />
                  )}
                </button>
                <button
                  type="button"
                  className="acp-send"
                  data-state={sendState}
                  aria-label={sendLabel}
                  aria-disabled={sendState === "idle" ? true : undefined}
                  onClick={submit}
                >
                  <svg className="acp-ring" viewBox="0 0 44 44" aria-hidden>
                    <circle className="t" cx="22" cy="22" r="20" />
                    <circle className="p" cx="22" cy="22" r="20" ref={ringRef} />
                  </svg>
                  <span className="acp-glyph acp-gArrow"><ArrowUp size={20} strokeWidth={2.2} aria-hidden /></span>
                  <span className="acp-glyph acp-gStop"><Square size={13} fill="currentColor" strokeWidth={0} aria-hidden /></span>
                </button>
              </div>
            </div>
          </div>

          {listOpen && trigger && (
            <div className="acp-list" id={listId} role="listbox" aria-label={trigger.kind === "command" ? "Commands" : "Files and docs"}>
              {groups.map(([g, items]) => (
                <div key={g || "all"} role="group" aria-label={g || undefined}>
                  {g && <div className="acp-group2" aria-hidden>{g}</div>}
                  {items.map((o) => {
                    const idx = options.indexOf(o)
                    const Icon = trigger.kind === "command" ? (CMD_ICON[o.id] ?? Wrench) : o.group === "Docs" ? FileText : FileIcon
                    return (
                      <div
                        key={o.id}
                        id={`${listId}-${o.id}`}
                        role="option"
                        aria-selected={idx === safeActive}
                        className="acp-opt"
                        onPointerEnter={() => setActive(idx)}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => insertOption(o)}
                      >
                        <span className="acp-itemIcon"><Icon size={16} aria-hidden /></span>
                        <span className="acp-optText">
                          <span className="acp-optLabel">{o.label}</span>
                          <span className="acp-optHint">{o.hint}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {!hasChat && suggestions.length > 0 && (
            <ul className="acp-suggest" aria-label="Suggestions">
              {suggestions.slice(0, 3).map((s) => {
                const Icon = SUG_ICON[s.icon ?? "summary"]
                return (
                  <li key={s.id}>
                    <button type="button" className="acp-sug" onClick={() => pickPrompt(s)}>
                      <Icon size={16} aria-hidden />
                      {s.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="acp-sr" role="status" aria-live="polite">{status}</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 One exchange                               */
/* -------------------------------------------------------------------------- */

const TurnView = React.memo(function TurnView({
  turn,
  model,
  last,
  copied,
  onCopy,
  onRetry,
  segs,
}: {
  turn: Turn
  model?: ComposerModel
  last: boolean
  copied: boolean
  onCopy: (t: Turn) => void
  onRetry: () => void
  segs: Segment[]
}) {
  const busy = turn.status === "thinking" || turn.status === "streaming"
  return (
    <li className="acp-turn" aria-busy={busy}>
      <div className="acp-sent">
        {turn.message.attachments.length > 0 && (
          <div className="acp-sentFiles">
            {turn.message.attachments.map((a) => (
              <span key={a.id} className="acp-sentFile">
                {a.kind === "image" ? <ImageIcon size={12} aria-hidden /> : <FileIcon size={12} aria-hidden />}
                {a.name}
              </span>
            ))}
          </div>
        )}
        {turn.message.text && (
          <p className="acp-bubble">
            {segs.map((s, i) => (s.token ? <mark key={i} className="acp-token">{s.text}</mark> : <React.Fragment key={i}>{s.text}</React.Fragment>))}
          </p>
        )}
      </div>

      <div className="acp-reply">
        <div className="acp-replyHead">
          {model && <ModelMark mark={model.mark} />}
          <span>{model?.name}</span>
        </div>
        {turn.steps.length > 0 && (
          <div className="acp-steps">
            {turn.steps.map((s) => (
              <span key={s.id} className="acp-step">
                {s.done ? <Check size={14} aria-hidden /> : null}
                <span className={s.done ? undefined : "acp-shimmer"} data-text={s.label}>{s.label}</span>
              </span>
            ))}
          </div>
        )}
        {(turn.settled || turn.live.length > 0) && (
          <p className="acp-replyText">
            {turn.settled}
            {turn.live.map((c, i) => (
              <span key={turn.settled.length + i + c} className="acp-chunk">{c}</span>
            ))}
          </p>
        )}
        {turn.status === "error" && (
          <p className="acp-error" role="alert">
            <TriangleAlert size={16} aria-hidden />
            Reply failed{turn.error ? `: ${turn.error}` : ""}
          </p>
        )}
        {turn.status === "stopped" && <span className="acp-note">Stopped</span>}
        {!busy && last && (
          <div className="acp-foot">
            {turn.status === "done" && (
              <button type="button" className="acp-footBtn" aria-label={copied ? "Copied" : "Copy reply"} onClick={() => onCopy(turn)}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
            <button type="button" className="acp-footBtn" onClick={onRetry}>
              <RotateCw size={15} aria-hidden />
              Retry
            </button>
            {turn.status === "done" && turn.simulated && <span className="acp-note">Simulated reply</span>}
          </div>
        )}
      </div>
    </li>
  )
})

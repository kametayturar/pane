"use client"

import * as React from "react"
import { BookOpen, Check, ChevronDown, CircleAlert, FileText, Globe, HardDrive, Plus, RotateCcw, Search, SlidersHorizontal, Trash2, Upload, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type KnowledgeSourceKind = "pdf" | "docx" | "markdown" | "text" | "notion" | "drive" | "web"
export type PipelineStep = "parse" | "chunk" | "embed" | "index"

export type KnowledgeSource = {
  id: string
  name: string
  kind: KnowledgeSourceKind
  status: "queued" | "processing" | "ready" | "failed"
  /** The step that is running (processing) or that failed. */
  step?: PipelineStep
  /** 0 to 1 inside the current step. */
  progress?: number
  pages?: number
  chunks?: number
  tokens?: number
  /** Shown after the counts, e.g. "Uploaded Oct 14" or "Synced 2 hours ago". */
  note?: string
  /** Live detail while processing, e.g. "60 of 86 pages". */
  detail?: string
  /** Why it failed. */
  error?: string
  /** A failed source without a way to retry offers Remove instead. Default true. */
  retryable?: boolean
}

export type KnowledgeChunk = {
  id: string
  sourceId: string
  text: string
  /** Page ("p. 2") or path ("/docs/api-keys"). */
  location?: string
}

export type RetrievalSettings = {
  chunkSize: number
  overlap: number
  topK: number
  hybrid: boolean
  rerank: boolean
  embeddingModel: string
}

export type RetrievalResult = {
  id: string
  sourceId?: string
  source: string
  kind?: KnowledgeSourceKind
  location?: string
  text: string
  /** First-stage similarity, 0 to 1. */
  score: number
  /** Score after the reranker, 0 to 1. When present, Rerank reorders by it. */
  rerankScore?: number
  /** The neighbouring chunks, shown when the result is opened. */
  before?: { text: string; location?: string }
  after?: { text: string; location?: string }
}

export type KnowledgeBaseProps = {
  /** Heading at the top of the card. */
  title?: string
  /** Live sources. Leave it out to run the built-in ingestion simulation. */
  sources?: KnowledgeSource[]
  /** Chunks the built-in retriever searches when `onQuery` is not set. */
  chunks?: KnowledgeChunk[]
  /** Controlled retrieval settings. */
  settings?: RetrievalSettings
  /** Starting settings when uncontrolled. Default 512 / 64 / 4 / hybrid on / rerank off / "general-v2". */
  defaultSettings?: Partial<RetrievalSettings>
  onSettingsChange?: (settings: RetrievalSettings) => void
  embeddingModels?: { value: string; label: string }[]
  /** Questions offered before the first search. */
  suggestions?: string[]
  /** Runs a retrieval test and returns the candidate chunks. Throw to show an error. */
  onQuery?: (query: string, settings: RetrievalSettings, ctx: { signal: AbortSignal }) => Promise<RetrievalResult[]>
  onAddSource?: (input: { kind: "file" | "web" | "text"; file?: File; value?: string }) => void
  onRetrySource?: (id: string) => void
  onRemoveSource?: (id: string) => void
  /** Called when chunking or embedding settings changed and the user pressed Re-index. */
  onReindex?: (settings: RetrievalSettings) => void
  defaultView?: "sources" | "retrieval"
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const STEPS: PipelineStep[] = ["parse", "chunk", "embed", "index"]
const STEP_LABEL: Record<PipelineStep, string> = { parse: "Parse", chunk: "Chunk", embed: "Embed", index: "Index" }
const STEP_VERB: Record<PipelineStep, string> = { parse: "Parsing", chunk: "Chunking", embed: "Embedding", index: "Indexing" }

const SAMPLE_MODELS = [
  { value: "general-v2", label: "General embed v2, 1,024 dims" },
  { value: "general-v3", label: "General embed v3, 1,536 dims" },
  { value: "multilingual", label: "Multilingual embed, 1,024 dims" },
  { value: "small-fast", label: "Small and fast, 384 dims" },
]
const modelShort = (v: string) => (SAMPLE_MODELS.find((m) => m.value === v)?.label ?? v).replace(/,.*$/, "")

const DEFAULT_SETTINGS: RetrievalSettings = { chunkSize: 512, overlap: 64, topK: 4, hybrid: true, rerank: false, embeddingModel: "general-v2" }

const SAMPLE_SOURCES: KnowledgeSource[] = [
  { id: "returns", name: "Returns and exchange policy.pdf", kind: "pdf", status: "ready", pages: 12, chunks: 45, tokens: 19800, note: "Uploaded Oct 14" },
  { id: "dpa", name: "Data processing addendum.pdf", kind: "pdf", status: "ready", pages: 38, chunks: 159, tokens: 71200, note: "Uploaded Oct 9" },
  { id: "playbook", name: "Support playbook", kind: "notion", status: "ready", pages: 24, chunks: 82, tokens: 36500, note: "Synced 2 hours ago" },
  { id: "contacts", name: "Escalation contacts", kind: "drive", status: "failed", step: "embed", progress: 0.6, error: "Embedding timed out after 41 of 68 chunks", retryable: true },
  { id: "site", name: "help.fernlight.dev", kind: "web", status: "processing", step: "parse", progress: 0.18, detail: "60 of 86 pages" },
]

const SAMPLE_CHUNKS: KnowledgeChunk[] = [
  { id: "r1", sourceId: "returns", location: "p. 1", text: "Contents. 1 Scope. 2 Return window. 3 Exchanges. 4 Refunds and chargebacks. 5 Exceptions. How to start a return. This policy applies to every order placed through Fernlight, effective 1 July." },
  { id: "r2", sourceId: "returns", location: "p. 2", text: "Return window. Customers can return an item within 30 days of delivery for a full refund if it is unused and in its original packaging. After 30 days we offer store credit for up to 60 days at the support lead's discretion." },
  { id: "r3", sourceId: "returns", location: "p. 3", text: "Refunds are issued to the original payment method within 5 business days of the item arriving at our warehouse. Shipping fees are refunded only when the item arrived damaged or was sent in error." },
  { id: "r4", sourceId: "returns", location: "p. 4", text: "Exchanges. A customer can swap an item for a different size or colour once per order. Start the exchange from the order page and we ship the replacement as soon as the return label is scanned." },
  { id: "r5", sourceId: "returns", location: "p. 5", text: "Exceptions. Digital goods, gift cards and personalised items cannot be returned. Chargebacks raised before a return request are handled by the finance team and may delay any refund." },
  { id: "d1", sourceId: "dpa", location: "p. 4", text: "Encryption. Customer data is encrypted at rest with AES-256 and in transit with TLS 1.2 or higher. Keys are rotated every 90 days and stored in a managed key vault, never alongside the data." },
  { id: "d2", sourceId: "dpa", location: "p. 9", text: "Retention. Customer data is deleted within 30 days after contract termination. Backups roll off on a 35-day cycle. Customers can request earlier deletion by writing to the privacy team." },
  { id: "d3", sourceId: "dpa", location: "p. 15", text: "Sub-processors. Fernlight uses sub-processors for hosting, email delivery and analytics. The current list is published on the trust page and customers get 30 days notice before any change." },
  { id: "d4", sourceId: "dpa", location: "p. 22", text: "Incident response. The security team acknowledges a suspected incident within one hour and notifies affected customers within 72 hours of confirmation, with a written summary of what was affected." },
  { id: "p1", sourceId: "playbook", location: "p. 3", text: "Equipment. New laptops and replacement devices are approved by the team lead and ordered by IT. Approval is needed for any purchase above 1,000 euros; below that the lead can order from the catalogue." },
  { id: "p2", sourceId: "playbook", location: "p. 8", text: "Escalations. Anything involving payment, legal threats or data loss goes to the on-call lead within 15 minutes. Add the ticket link and what the customer has already tried." },
  { id: "p3", sourceId: "playbook", location: "p. 12", text: "Tone. Answer in plain language, name the next step in the first two lines and never promise a date you do not control. If a refund is pending, say when the customer will see it." },
  { id: "w1", sourceId: "site", location: "/docs/api-keys", text: "Rotate an API key. Open Settings, choose API keys and press Rotate. The old key keeps working for 24 hours so you can deploy the new one without downtime. Revoke a key at once if it leaked." },
  { id: "w2", sourceId: "site", location: "/docs/billing/cancel", text: "Cancel your subscription. Workspace owners can cancel from Settings, Billing. Your plan stays active until the end of the billing period, and refunds for unused months are not issued after 30 days." },
  { id: "w3", sourceId: "site", location: "/docs/billing/invoices", text: "Invoices and receipts. Every payment creates an invoice you can download from Settings, Billing, Invoices. Change the billing email or VAT number there to update future invoices." },
]

const SAMPLE_SUGGESTIONS: { text: string; kind: KnowledgeSourceKind }[] = [
  { text: "How long do customers have to return an item?", kind: "pdf" },
  { text: "Is customer data encrypted at rest?", kind: "pdf" },
  { text: "Who approves a replacement laptop?", kind: "notion" },
  { text: "How do I rotate an API key?", kind: "web" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.kb {
  --kb-ink: #000;
  --kb-surface: #fff;
  --kb-accent: #0060e2;
  --kb-rerank: #7a4de8;
  --kb-t1: color-mix(in oklab, var(--kb-ink) 88%, transparent);
  --kb-t2: color-mix(in oklab, var(--kb-ink) 61%, transparent);
  --kb-t3: color-mix(in oklab, var(--kb-ink) 45%, transparent);
  --kb-t4: color-mix(in oklab, var(--kb-ink) 27%, transparent);
  --kb-fill: color-mix(in oklab, var(--kb-ink) 4%, transparent);
  --kb-hover: color-mix(in oklab, var(--kb-ink) 5%, transparent);
  --kb-line: color-mix(in oklab, var(--kb-ink) 7%, transparent);
  --kb-soft: color-mix(in oklab, var(--kb-ink) 4.5%, transparent);
  --kb-seg: color-mix(in oklab, var(--kb-ink) 8%, transparent);
  --kb-done: color-mix(in oklab, var(--kb-ink) 42%, transparent);
  --kb-main-bg: color-mix(in oklab, var(--kb-ink) 80%, transparent);
  --kb-main-fg: #fcfcfc;
  --kb-ok: #1f8a4c;
  --kb-bad: #d43a2b;
  --kb-warn: #b36b00;
  --kb-mark: rgb(255 214 102 / .5);
  --kb-glint: rgb(255 255 255 / .82);
  --kb-float: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --kb-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 720px;
  container: kb / inline-size;
  border-radius: 24px;
  border: 1px solid var(--kb-line);
  background: var(--kb-surface);
  color: var(--kb-t1);
  font-family: var(--kb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .kb {
  --kb-ink: #fff;
  --kb-surface: #1c1c1e;
  --kb-accent: #4d8dff;
  --kb-rerank: #a98bff;
  --kb-t1: color-mix(in oklab, var(--kb-ink) 90%, transparent);
  --kb-t2: color-mix(in oklab, var(--kb-ink) 62%, transparent);
  --kb-t3: color-mix(in oklab, var(--kb-ink) 46%, transparent);
  --kb-t4: color-mix(in oklab, var(--kb-ink) 28%, transparent);
  --kb-fill: color-mix(in oklab, var(--kb-ink) 6%, transparent);
  --kb-hover: color-mix(in oklab, var(--kb-ink) 8%, transparent);
  --kb-line: color-mix(in oklab, var(--kb-ink) 10%, transparent);
  --kb-soft: color-mix(in oklab, var(--kb-ink) 7%, transparent);
  --kb-seg: color-mix(in oklab, var(--kb-ink) 12%, transparent);
  --kb-done: color-mix(in oklab, var(--kb-ink) 46%, transparent);
  --kb-main-bg: rgb(255 255 255 / .9);
  --kb-main-fg: #171717;
  --kb-ok: #4ade80;
  --kb-bad: #ff8a7a;
  --kb-warn: #fbbf24;
  --kb-mark: rgb(251 191 36 / .28);
  --kb-glint: rgb(255 255 255 / .9);
  --kb-float: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35), 0 0 0 .5px rgb(255 255 255 / .1);
}
.kb *, .kb *::before, .kb *::after { box-sizing: border-box }
:where(.kb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.kb) input, :where(.kb) select { font: inherit; color: inherit }
.kb button:disabled { cursor: default }
.kb :focus-visible { outline: 2px solid color-mix(in oklab, var(--kb-accent) 60%, transparent); outline-offset: 1px }
.kb :focus:not(:focus-visible) { outline: none }
.kb svg { display: block; flex: none }
.kb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.kb-mono { font-variant-numeric: tabular-nums }

.kb-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 18px; font-weight: 500; white-space: nowrap;
  transition: background-color .16s, color .16s, box-shadow .16s, transform .16s var(--kb-ease), opacity .2s;
}
.kb-btn:active:not(:disabled) { transform: scale(.975) }
.kb-btn svg { width: 16px; height: 16px }
.kb-btn[data-kind="outline"] { background: var(--kb-surface); box-shadow: inset 0 0 0 1px var(--kb-line) }
.kb-btn[data-kind="outline"]:hover, .kb-btn[data-kind="outline"][aria-expanded="true"] { background: color-mix(in oklab, var(--kb-surface), var(--kb-ink) 3%) }
.kb-btn[data-kind="icon"] { width: 36px; padding: 0; color: var(--kb-t2) }
.kb-btn[data-kind="primary"] { background: var(--kb-main-bg); color: var(--kb-main-fg); padding: 0 14px; border-radius: 999px }
.kb-btn[data-kind="primary"]:hover:not(:disabled) { background: color-mix(in oklab, var(--kb-main-bg), var(--kb-ink) 8%) }
.kb-btn[data-kind="primary"]:disabled { background: color-mix(in oklab, var(--kb-ink) 28%, transparent); color: color-mix(in oklab, var(--kb-surface) 92%, transparent) }
.kb-chev { width: 15px; height: 15px; color: var(--kb-t3); transition: transform .3s var(--kb-ease) }
[aria-expanded="true"] > .kb-chev { transform: rotate(180deg) }

/* Header */
.kb-head { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px 16px; padding: 18px 20px 0 22px }
.kb-title { margin: 0; font-size: 16px; line-height: 18px; font-weight: 500; color: var(--kb-ink) }
.kb-sum { display: flex; flex-wrap: wrap; align-items: center; gap: 0 10px; margin: 2px 0 0; font-size: 12px; line-height: 17px; color: var(--kb-t3) }
.kb-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--kb-t4) }
.kb-actions { position: relative; display: flex; gap: 8px; flex: none }
.kb-tabs { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px 14px }
.kb-seg { position: relative; display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; padding: 3px; gap: 2px; border-radius: 18px; background: var(--kb-fill); box-shadow: inset 0 0 0 1px var(--kb-line) }
.kb-hl { position: absolute; top: 3px; bottom: 3px; left: 3px; border-radius: 14px; background: var(--kb-surface); box-shadow: 0 0 0 1px var(--kb-line), 0 1px 2px rgb(0 0 0 / .04); transition: transform .34s var(--kb-ease), width .34s var(--kb-ease) }
.kb-segBtn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 14px; font-weight: 500; color: var(--kb-t3); white-space: nowrap; transition: color .2s }
.kb-segBtn:hover { color: var(--kb-t1) }
.kb-segBtn[aria-selected="true"] { color: var(--kb-t1) }
.kb-count { font-weight: 400; color: var(--kb-t3); font-variant-numeric: tabular-nums }
.kb-state { position: relative; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; line-height: 17px; color: var(--kb-t3); white-space: nowrap; animation: kb-fade .4s var(--kb-ease) backwards }
.kb-state svg { width: 14px; height: 14px }
.kb-state[data-tone="bad"] svg { color: var(--kb-bad) }
.kb-state[data-tone="ok"] svg { color: var(--kb-ok) }
.kb-spin { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid var(--kb-t4); border-top-color: var(--kb-t2); animation: kb-rot .8s linear infinite }

.kb-body { position: relative; border-top: 1px solid var(--kb-soft) }
.kb-panel { padding-bottom: 20px; animation: kb-view .42s var(--kb-ease) backwards }

/* Sources */
.kb-cols { display: grid; grid-template-columns: minmax(0, 1fr) 168px 56px; gap: 12px; padding: 12px 20px 4px; font-size: 12px; line-height: 17px; color: var(--kb-t3) }
.kb-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px }
.kb-list { margin: 0; padding: 0; list-style: none }
.kb-item { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .45s var(--kb-ease), opacity .3s; animation: kb-slide .55s var(--kb-ease) backwards }
.kb-item[data-leaving] { grid-template-rows: 0fr; opacity: 0 }
.kb-item > div { min-height: 0; overflow: hidden }
.kb-row { display: grid; grid-template-columns: 18px minmax(0, 1fr) 168px 56px; align-items: center; gap: 0 12px; padding: 11px 20px; transition: background-color .2s }
.kb-row:hover { background: var(--kb-fill) }
.kb-icon { width: 18px; height: 18px; color: var(--kb-t2) }
.kb-main { display: flex; flex-direction: column; gap: 1px; min-width: 0 }
.kb-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--kb-t1) }
.kb-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0 8px; font-size: 12px; line-height: 17px; color: var(--kb-t3); font-variant-numeric: tabular-nums; animation: kb-swap .45s var(--kb-ease) backwards }
.kb-meta[data-tone="bad"] { color: var(--kb-bad); flex-wrap: nowrap; align-items: flex-start; gap: 0 5px }
.kb-meta[data-tone="bad"] svg { margin: 2px 0 0 }
.kb-meta[data-sep] > span:not(:last-child)::after { content: "·"; margin-left: 8px; color: var(--kb-t4) }
.kb-meta svg { width: 13px; height: 13px; margin-right: -3px }
.kb-meta .kb-shimmer { color: var(--kb-t2) }
.kb-pipe { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; height: 4px }
.kb-seg4 { position: relative; height: 4px; border-radius: 99px; background: var(--kb-seg); overflow: hidden }
.kb-seg4 > i { position: absolute; inset: 0; border-radius: inherit; background: var(--kb-done); transform-origin: left; transition: transform .7s var(--kb-ease), background-color .3s }
.kb-seg4[data-s="active"] > i { background: var(--kb-accent) }
.kb-seg4[data-s="fail"] > i { background: var(--kb-bad) }
.kb-seg4[data-s="active"]::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 30%, var(--kb-glint) 50%, transparent 70%) 0 0 / 250% 100%; opacity: .55; animation: kb-sweep 1.5s linear infinite }
.kb-end { display: flex; justify-content: flex-end; align-items: center; min-height: 28px; animation: kb-swap .4s var(--kb-ease) backwards }
.kb-end .kb-ok { width: 16px; height: 16px; color: var(--kb-ok) }
.kb-pct { font-size: 12px; color: var(--kb-t2); font-variant-numeric: tabular-nums }
.kb-mini { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--kb-surface); box-shadow: inset 0 0 0 1px var(--kb-line); transition: background-color .16s }
.kb-mini:hover { background: var(--kb-fill) }
.kb-mini svg { width: 13px; height: 13px }
.kb-drop { display: flex; align-items: center; gap: 12px; margin: 10px 20px 0; padding: 14px 16px; border: 1px dashed color-mix(in oklab, var(--kb-ink) 20%, transparent); border-radius: 16px; transition: background-color .2s, border-color .2s }
.kb-drop[data-over] { background: color-mix(in oklab, var(--kb-accent) 7%, transparent); border-color: var(--kb-accent) }
.kb-drop svg { width: 18px; height: 18px; color: var(--kb-t3) }
.kb-dropText { display: flex; flex-direction: column; gap: 1px; color: var(--kb-t2) }
.kb-dropText small { font-size: 12px; line-height: 17px; color: var(--kb-t3) }
.kb-link { color: var(--kb-t1); text-decoration: underline; text-decoration-color: var(--kb-t4); text-underline-offset: 3px; transition: text-decoration-color .16s }
.kb-link:hover { text-decoration-color: currentColor }
.kb-banner { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 10px 20px 0; padding: 8px 8px 8px 14px; border-radius: 14px; background: color-mix(in oklab, #e8a20c 11%, transparent); font-size: 13px; color: var(--kb-t1); animation: kb-fade .4s var(--kb-ease) backwards }
.kb-adder { display: flex; gap: 8px; margin: 10px 20px 0; animation: kb-fade .3s var(--kb-ease) backwards }
.kb-adder input { flex: 1; min-width: 0; height: 36px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--kb-line); background: var(--kb-surface); outline: none }
.kb-adder input:focus { border-color: color-mix(in oklab, var(--kb-ink) 25%, transparent) }

/* Menu + settings popovers */
.kb-pop { position: absolute; z-index: 30; top: calc(100% + 8px); right: 0; border-radius: 22px; background: var(--kb-surface); box-shadow: var(--kb-float); transform-origin: top right; animation: kb-pop .3s var(--kb-ease) backwards }
.kb-menu { width: 224px; padding: 6px }
.kb-mi { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 14px; text-align: left }
.kb-mi:hover, .kb-mi:focus-visible { background: var(--kb-fill) }
.kb-mi svg { width: 16px; height: 16px; color: var(--kb-t2) }
.kb-set { width: min(320px, calc(100vw - 48px)); padding: 14px 16px 16px }
.kb-set h3 { margin: 0 0 8px; font-size: 13px; line-height: 20px; font-weight: 500; color: var(--kb-ink) }
.kb-field { margin-top: 10px }
.kb-fieldHead { display: flex; align-items: baseline; justify-content: space-between; font-size: 13px; color: var(--kb-t1) }
.kb-fieldHead span { font-size: 12px; color: var(--kb-t3); font-variant-numeric: tabular-nums }
.kb-range { width: 100%; height: 20px; margin: 2px 0 0; -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer }
.kb-range::-webkit-slider-runnable-track { height: 4px; border-radius: 99px; background: linear-gradient(to right, var(--kb-t1) var(--p, 0%), var(--kb-seg) var(--p, 0%)) }
.kb-range::-moz-range-track { height: 4px; border-radius: 99px; background: var(--kb-seg) }
.kb-range::-moz-range-progress { height: 4px; border-radius: 99px; background: var(--kb-t1) }
.kb-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; margin-top: -6px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 3px rgb(0 0 0 / .25); transition: transform .2s var(--kb-ease) }
.kb-range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 3px rgb(0 0 0 / .25) }
.kb-range:active::-webkit-slider-thumb { transform: scale(1.1) }
.kb-tog { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; margin-top: 12px; text-align: left }
.kb-tog span { display: flex; flex-direction: column }
.kb-tog small { font-size: 12px; line-height: 16px; color: var(--kb-t3) }
.kb-sw { position: relative; flex: none; width: 42px; height: 24px; padding: 3px; border-radius: 999px; background: color-mix(in oklab, var(--kb-ink) 11%, transparent); transition: background-color .22s }
.kb-sw i { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .14); transition: transform .3s var(--kb-ease) }
[aria-checked="true"] > .kb-sw { background: var(--kb-main-bg) }
[aria-checked="true"] > .kb-sw i { transform: translateX(18px) }
:is(.dark, [data-theme="dark"]) [aria-checked="true"] > .kb-sw i { background: #171717 }
.kb-select { position: relative; margin-top: 4px }
.kb-select select { width: 100%; height: 36px; padding: 0 32px 0 12px; border-radius: 12px; border: 1px solid var(--kb-line); background: var(--kb-surface); -webkit-appearance: none; appearance: none; outline: none; cursor: pointer }
.kb-select select:focus-visible { outline: 2px solid color-mix(in oklab, var(--kb-accent) 60%, transparent); outline-offset: 1px }
.kb-select svg { position: absolute; right: 11px; top: 11px; width: 14px; height: 14px; color: var(--kb-t3); pointer-events: none }
.kb-setFoot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; font-size: 12px; line-height: 16px; color: var(--kb-t3) }

/* Retrieval */
.kb-q { display: flex; align-items: center; gap: 8px; height: 48px; margin: 14px 20px 0; padding: 0 6px 0 14px; border-radius: 18px; border: 1px solid var(--kb-line); background: var(--kb-surface); transition: border-color .16s, box-shadow .16s }
.kb-q:focus-within { border-color: color-mix(in oklab, var(--kb-ink) 22%, transparent); box-shadow: 0 0 0 3px var(--kb-fill) }
.kb-q > svg { width: 17px; height: 17px; color: var(--kb-t3) }
.kb .kb-qin:focus-visible, .kb .kb-adder input:focus-visible { outline: none }
.kb-qin { flex: 1; min-width: 0; height: 46px; border: 0; background: none; outline: none; color: var(--kb-t1) }
.kb-qin::placeholder { color: var(--kb-t3) }
.kb-clear { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: var(--kb-t3); transition: background-color .16s, color .16s }
.kb-clear:hover { background: var(--kb-fill); color: var(--kb-t1) }
.kb-clear svg { width: 15px; height: 15px }
.kb-bar2 { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 20px 2px }
.kb-status { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 0 8px; font-size: 12px; line-height: 17px; color: var(--kb-t3); font-variant-numeric: tabular-nums; animation: kb-swap .4s var(--kb-ease) backwards }
.kb-rr { display: inline-flex; align-items: center; gap: 10px; color: var(--kb-t2) }
.kb-rr .kb-sw { margin: 0 }
.kb-rrBtn { display: inline-flex; align-items: center; gap: 10px; min-height: 44px }
.kb-hint { margin: 6px 20px 12px; font-size: 13px; color: var(--kb-t2) }
.kb-sugg { margin: 0; padding: 0; list-style: none }
.kb-sg { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 20px; text-align: left; transition: background-color .16s }
.kb-sg:hover { background: var(--kb-fill) }
.kb-sg svg { width: 15px; height: 15px; color: var(--kb-t2) }
.kb-results { position: relative; margin: 4px 0 0; padding: 0; list-style: none }
.kb-result { position: relative; transition: background-color .25s; animation: kb-slide .5s var(--kb-ease) backwards }
.kb-result[data-open] { background: var(--kb-fill) }
.kb-rh { display: flex; align-items: center; gap: 12px; width: 100%; padding: 13px 20px 4px; text-align: left }
.kb-rank { width: 8px; flex: none; font-size: 12px; color: var(--kb-t3); font-variant-numeric: tabular-nums }
.kb-where { display: inline-flex; align-items: center; gap: 8px; min-width: 0; flex: 1 }
.kb-where svg { width: 15px; height: 15px; color: var(--kb-t2) }
.kb-wn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500 }
.kb-wl { flex: none; font-size: 12px; color: var(--kb-t3); white-space: nowrap }
.kb-delta { display: inline-flex; align-items: center; gap: 2px; width: 30px; font-size: 12px; color: var(--kb-t3); font-variant-numeric: tabular-nums; animation: kb-fade .4s var(--kb-ease) backwards }
.kb-delta svg { width: 11px; height: 11px }
.kb-delta[data-d="up"] { color: var(--kb-ok) }
.kb-delta[data-d="down"] { color: var(--kb-warn) }
.kb-score { display: inline-flex; align-items: center; gap: 8px; flex: none }
.kb-track { position: relative; width: 52px; height: 4px; border-radius: 99px; background: var(--kb-seg); overflow: hidden }
.kb-track i { position: absolute; inset: 0; border-radius: inherit; background: var(--kb-accent); transform-origin: left; transition: transform .7s var(--kb-ease), background-color .4s; animation: kb-grow .7s var(--kb-ease) backwards }
.kb-score[data-rr] .kb-track i { background: var(--kb-rerank) }
.kb-sv { width: 30px; text-align: right; font-size: 12px; color: var(--kb-t1); font-variant-numeric: tabular-nums }
.kb-rb { padding: 0 20px 14px 46px }
.kb-ex { margin: 0; font-size: 14px; line-height: 21.7px; color: var(--kb-t2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden }
.kb-ex mark { background: var(--kb-mark); color: var(--kb-t1); border-radius: 3px; padding: 0 1px; margin: 0 -1px }
.kb-ctx { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s var(--kb-ease) }
.kb-ctx[data-open] { grid-template-rows: 1fr }
.kb-ctx > div { min-height: 0; overflow: hidden }
.kb-focus { margin: 0; padding: 4px 0 4px 10px; border-left: 2px solid color-mix(in oklab, var(--kb-accent) 55%, transparent); font-size: 14px; line-height: 21.7px; color: var(--kb-t1) }
.kb-focus mark { background: var(--kb-mark); color: inherit; border-radius: 3px; padding: 0 1px; margin: 0 -1px }
.kb-nb { margin: 8px 0; font-size: 12px; line-height: 17px; color: var(--kb-t3) }
.kb-nb p { margin: 1px 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--kb-t3) }
.kb-err { margin: 14px 20px 0; padding: 10px 14px; border-radius: 14px; background: color-mix(in oklab, var(--kb-bad) 9%, transparent); color: var(--kb-bad); font-size: 13px }
.kb-shimmer { position: relative; display: inline-block }
.kb-shimmer::after { content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap; background: linear-gradient(90deg, transparent 38%, var(--kb-glint) 50%, transparent 62%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text; animation: kb-sweep 1.6s linear infinite }

/* Narrow */
@container kb (max-width: 639px) {
  .kb-cols { display: none }
  .kb-row { grid-template-columns: 18px minmax(0, 1fr) auto; row-gap: 8px }
  .kb-pipe { grid-column: 2 / 4; grid-row: 2 }
  .kb-pipe[data-solo] { grid-column: 2 / 3 }
  .kb-end { grid-row: 1; grid-column: 3 }
  .kb-rb { padding-left: 20px }
  .kb-ctx .kb-focus { margin-left: 0 }
}
@container kb (max-width: 479px) {
  .kb-head { padding: 16px 14px 0 16px; flex-wrap: wrap }
  .kb-tabs { padding: 14px 14px 12px }
  .kb-row { padding-inline: 14px }
  .kb-q, .kb-drop, .kb-banner, .kb-adder { margin-inline: 14px }
  .kb-bar2 { padding-inline: 14px }
  .kb-hint, .kb-rh, .kb-sg { padding-inline: 14px }
  .kb-hint { margin-inline: 14px; padding: 0 }
  .kb-rh { gap: 8px }
  .kb-rb { padding-inline: 14px }
  .kb-sumHide { display: none }
  .kb-delta { width: auto }
  .kb-wl { display: none }
  .kb-track { width: 36px }
  .kb-segBtn { padding: 0 9px }
}

@keyframes kb-fade { from { opacity: 0 } }
@keyframes kb-view { from { opacity: 0; transform: translateY(4px); filter: blur(2px) } }
@keyframes kb-swap { from { opacity: 0; filter: blur(4px) } }
@keyframes kb-slide { from { opacity: 0; transform: translateY(-6px) } }
@keyframes kb-pop { from { opacity: 0; transform: translateY(-4px) scale(.96) } }
@keyframes kb-grow { from { transform: scaleX(0) } }
@keyframes kb-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes kb-rot { to { transform: rotate(360deg) } }

@media (prefers-reduced-motion: reduce) {
  .kb *, .kb *::before, .kb *::after { animation: none !important; transition: none !important }
  .kb-seg4[data-s="active"]::after, .kb-shimmer::after { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const join = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ")
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n))
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 1000, 7) / 1000

function KindIcon({ kind, className }: { kind?: KnowledgeSourceKind; className?: string }) {
  switch (kind) {
    case "web":
      return <Globe className={className} strokeWidth={1.7} aria-hidden />
    case "drive":
      return <HardDrive className={className} strokeWidth={1.7} aria-hidden />
    case "notion":
      return <BookOpen className={className} strokeWidth={1.7} aria-hidden />
    default:
      return <FileText className={className} strokeWidth={1.7} aria-hidden />
  }
}

const STOP = new Set(["the", "and", "for", "are", "can", "how", "what", "who", "does", "with", "that", "this", "have", "has", "from", "into", "after", "any", "when", "you", "our", "its", "get", "was", "were", "will"])
const stem = (w: string) => (w.length > 5 ? w.replace(/(ing|ed|es|s)$/, "") : w.length > 4 ? w.replace(/s$/, "") : w)
const queryTerms = (q: string) => [...new Set((q.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => (w.length > 2 && !STOP.has(w)) || /^\d+$/.test(w)).map(stem))]

/** The built-in retriever: a stand-in for vector search plus keyword search, so the demo works offline. */
function localSearch(query: string, chunks: KnowledgeChunk[], sources: Map<string, KnowledgeSource>, s: RetrievalSettings): RetrievalResult[] {
  const terms = queryTerms(query)
  if (!terms.length) return []
  const bySource = new Map<string, KnowledgeChunk[]>()
  for (const c of chunks) bySource.set(c.sourceId, [...(bySource.get(c.sourceId) ?? []), c])
  const scored = chunks
    .filter((c) => sources.get(c.sourceId)?.status === "ready")
    .map((c) => {
      const words = (c.text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map(stem)
      const set = new Set(words)
      const hits = terms.filter((t) => set.has(t))
      const coverage = hits.length / terms.length
      const count = words.filter((w) => terms.includes(w)).length
      const kw = 1 - Math.exp(-count / 2)
      const sem = clamp(coverage * 0.85 + hash(c.id + query) * 0.12, 0, 1)
      const first = hits.length ? (s.hybrid ? 0.55 * sem + 0.45 * kw : sem) : 0
      // The "reranker" reads closely: it likes adjacent query terms and dense coverage.
      const lower = c.text.toLowerCase()
      let phrase = 0
      for (let i = 0; i < terms.length - 1; i++) if (lower.includes(`${terms[i]} `) && lower.includes(terms[i + 1])) phrase += 0.5
      const rr = hits.length ? clamp(0.55 * coverage + 0.3 * Math.min(1, phrase) + 0.15 * kw + (c.location?.startsWith("p. 2") ? 0.12 : 0) - 0.05, 0, 1) : 0
      return { c, first, rr, hits: hits.length }
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.first - a.first)
    .slice(0, Math.max(s.topK * 2, 6))
  const spread = (v: number) => Math.round(clamp(0.16 + v * 0.82, 0.05, 0.97) * 100) / 100
  return scored.map(({ c, first, rr }) => {
    const list = bySource.get(c.sourceId) ?? []
    const i = list.indexOf(c)
    const src = sources.get(c.sourceId)
    return {
      id: c.id,
      sourceId: c.sourceId,
      source: src?.name ?? c.sourceId,
      kind: src?.kind,
      location: c.location,
      text: c.text,
      score: spread(first),
      rerankScore: spread(rr),
      before: list[i - 1] ? { text: list[i - 1].text, location: list[i - 1].location } : undefined,
      after: list[i + 1] ? { text: list[i + 1].text, location: list[i + 1].location } : undefined,
    }
  })
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const re = new RegExp(`\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[a-z]*`, "gi")
  const out: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(<mark key={m.index}>{m[0]}</mark>)
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}

/** A number that rolls to its new value. */
function Roll({ value }: { value: number }) {
  const [shown, setShown] = React.useState(value)
  const from = React.useRef(value)
  React.useEffect(() => {
    const a = from.current
    if (a === value) return
    const t0 = performance.now()
    let id = 0
    const tick = (now: number) => {
      const p = clamp((now - t0) / 600, 0, 1)
      const e = 1 - Math.pow(1 - p, 3)
      const v = a + (value - a) * e
      setShown(v)
      from.current = v
      if (p < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [value])
  return <>{shown.toFixed(2)}</>
}

function Switch({ checked, onChange, label, desc, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={className ?? "kb-tog"} onClick={() => onChange(!checked)}>
      <span>
        {label}
        {desc && <small>{desc}</small>}
      </span>
      <span className="kb-sw" aria-hidden><i /></span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                               KnowledgeBase                                */
/* -------------------------------------------------------------------------- */

type Ranked = RetrievalResult & { first: number; delta: number }

export function KnowledgeBase({
  title = "Support knowledge base",
  sources: sourcesProp,
  chunks = SAMPLE_CHUNKS,
  settings: settingsProp,
  defaultSettings,
  onSettingsChange,
  embeddingModels = SAMPLE_MODELS,
  suggestions: suggestionsProp,
  onQuery,
  onAddSource,
  onRetrySource,
  onRemoveSource,
  onReindex,
  defaultView = "sources",
  className,
}: KnowledgeBaseProps) {
  const uid = React.useId()
  const controlled = sourcesProp !== undefined
  const [own, setOwn] = React.useState<KnowledgeSource[]>(SAMPLE_SOURCES)
  const sources = sourcesProp ?? own
  const [view, setView] = React.useState(defaultView)
  const [innerSettings, setInnerSettings] = React.useState<RetrievalSettings>({ ...DEFAULT_SETTINGS, ...defaultSettings })
  const settings = settingsProp ?? innerSettings
  const [popover, setPopover] = React.useState<null | "menu" | "settings">(null)
  const [adder, setAdder] = React.useState<null | "web" | "text">(null)
  const [adderValue, setAdderValue] = React.useState("")
  const [leaving, setLeaving] = React.useState<string[]>([])
  const [stale, setStale] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const [announce, setAnnounce] = React.useState("")

  const [query, setQuery] = React.useState("")
  const [searched, setSearched] = React.useState("")
  const [results, setResults] = React.useState<RetrievalResult[] | null>(null)
  const [searching, setSearching] = React.useState(false)
  const [ms, setMs] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [applied, setApplied] = React.useState(settings.rerank)
  const [reranking, setReranking] = React.useState(false)
  const [openId, setOpenId] = React.useState<string | null>(null)

  const abortRef = React.useRef<AbortController | null>(null)
  const timers = React.useRef<number[]>([])
  const fileRef = React.useRef<HTMLInputElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const settingsBtn = React.useRef<HTMLButtonElement>(null)
  const addBtn = React.useRef<HTMLButtonElement>(null)
  const popRef = React.useRef<HTMLDivElement>(null)
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const liRefs = React.useRef(new Map<string, HTMLLIElement>())
  const tops = React.useRef(new Map<string, number>())
  const counter = React.useRef(0)
  const prevStatus = React.useRef(new Map<string, string>())
  const sourcesRef = React.useRef(sources)
  React.useEffect(() => {
    sourcesRef.current = sources
  })
  React.useEffect(() => () => {
    abortRef.current?.abort()
    timers.current.forEach(clearTimeout)
  }, [])

  const later = (fn: () => void, ms2: number) => {
    const id = window.setTimeout(fn, ms2)
    timers.current.push(id)
  }

  const settingsRef = React.useRef(settings)
  React.useEffect(() => {
    settingsRef.current = settings
  })

  /* Ingestion simulation (only without a `sources` prop) */
  React.useEffect(() => {
    if (controlled) return
    if (!own.some((s) => s.status === "processing")) return
    const id = window.setInterval(() => {
      setOwn((list) =>
        list.map((s) => {
          if (s.status !== "processing") return s
          const si = STEPS.indexOf(s.step ?? "parse")
          const p = (s.progress ?? 0) + 0.05 + Math.random() * 0.07
          if (p < 1) {
            const detail = s.kind === "web" && s.step === "parse" ? `${Math.min(86, Math.round(p * 86))} of 86 pages` : s.detail
            return { ...s, progress: p, detail }
          }
          if (si < STEPS.length - 1) return { ...s, step: STEPS[si + 1], progress: 0, detail: s.kind === "web" ? (STEPS[si + 1] === "chunk" ? "86 pages" : "Writing vectors") : s.detail }
          const tokens = s.tokens ?? (s.kind === "web" ? 41600 : 12400)
          const size = Math.max(1, settingsRef.current.chunkSize - settingsRef.current.overlap)
          return { ...s, status: "ready", step: undefined, progress: undefined, detail: undefined, pages: s.pages ?? (s.kind === "web" ? 86 : 9), tokens, chunks: Math.ceil(tokens / size), note: s.kind === "web" ? "Crawled just now" : "Added just now" }
        }),
      )
    }, 520)
    return () => window.clearInterval(id)
  }, [controlled, own])

  // Announce finished and failed sources.
  React.useEffect(() => {
    const msgs: string[] = []
    for (const s of sources) {
      const before = prevStatus.current.get(s.id)
      if (before && before !== s.status) {
        if (s.status === "ready") msgs.push(`${s.name} is indexed.`)
        if (s.status === "failed") msgs.push(`${s.name} failed: ${s.error ?? "unknown error"}.`)
      }
      prevStatus.current.set(s.id, s.status)
    }
    if (msgs.length) {
      const id = requestAnimationFrame(() => setAnnounce(msgs.join(" ")))
      return () => cancelAnimationFrame(id)
    }
  }, [sources])

  /* Popovers close on outside press / Escape */
  React.useEffect(() => {
    if (!popover) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (popRef.current?.contains(t) || settingsBtn.current?.contains(t) || addBtn.current?.contains(t)) return
      setPopover(null)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [popover])
  React.useEffect(() => {
    if (popover === "menu") popRef.current?.querySelector<HTMLElement>("button")?.focus()
    if (popover === "settings") popRef.current?.querySelector<HTMLElement>("input,select,button")?.focus()
  }, [popover])

  const patchSettings = (patch: Partial<RetrievalSettings>) => {
    const next = { ...settings, ...patch }
    next.overlap = clamp(next.overlap, 0, Math.floor(next.chunkSize / 2))
    if (!settingsProp) setInnerSettings(next)
    onSettingsChange?.(next)
    if (patch.chunkSize !== undefined || patch.overlap !== undefined || patch.embeddingModel !== undefined) {
      if (sources.some((s) => s.status === "ready")) setStale(true)
    }
    return next
  }

  const reindex = () => {
    setStale(false)
    setPopover(null)
    onReindex?.(settings)
    if (!controlled) setOwn((l) => l.map((s) => (s.status === "ready" ? { ...s, status: "processing", step: "chunk", progress: 0, detail: "Re-chunking" } : s)))
    setAnnounce("Re-indexing all sources.")
  }

  /* Source actions */
  const addSource = (kind: "file" | "web" | "text", value?: string, file?: File) => {
    onAddSource?.({ kind, value, file })
    if (controlled) return
    const id = `src-${++counter.current}-${Date.now()}`
    const ext = file?.name.split(".").pop()?.toLowerCase()
    const k: KnowledgeSourceKind = kind === "web" ? "web" : kind === "text" ? "text" : ext === "md" ? "markdown" : ext === "docx" ? "docx" : ext === "txt" ? "text" : "pdf"
    const name = kind === "web" ? (value ?? "docs.fernlight.dev").replace(/^https?:\/\//, "").replace(/\/$/, "") : kind === "text" ? (value ?? "Pasted text").slice(0, 36) : (file?.name ?? "Untitled.pdf")
    const src: KnowledgeSource = { id, name, kind: k, status: "processing", step: "parse", progress: 0, tokens: kind === "text" ? Math.max(120, (value ?? "").length * 2) : undefined, detail: kind === "web" ? "0 of 86 pages" : "Reading" }
    setOwn((l) => [src, ...l])
    setAnnounce(`Added ${name}. Indexing started.`)
  }
  const retry = (id: string) => {
    onRetrySource?.(id)
    if (!controlled) setOwn((l) => l.map((s) => (s.id === id ? { ...s, status: "processing", progress: 0.1, error: undefined, tokens: s.tokens ?? 8200 } : s)))
  }
  const remove = (id: string) => {
    onRemoveSource?.(id)
    if (controlled) return
    setLeaving((l) => [...l, id])
    later(() => {
      setOwn((l) => l.filter((s) => s.id !== id))
      setLeaving((l) => l.filter((x) => x !== id))
    }, 460)
  }

  /* Retrieval */
  const run = async (q: string) => {
    const text = q.trim()
    if (!text) return
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setQuery(text)
    setSearching(true)
    setError(null)
    setOpenId(null)
    setReranking(false)
    const t0 = performance.now()
    try {
      let res: RetrievalResult[]
      if (onQuery) res = await onQuery(text, settings, { signal: ctl.signal })
      else {
        await new Promise<void>((resolve, reject) => {
          const id = window.setTimeout(resolve, 380 + Math.random() * 160)
          ctl.signal.addEventListener("abort", () => (window.clearTimeout(id), reject(new DOMException("Aborted", "AbortError"))), { once: true })
        })
        res = localSearch(text, chunks, new Map(sourcesRef.current.map((s) => [s.id, s])), settings)
      }
      if (ctl.signal.aborted) return
      setMs(Math.round(performance.now() - t0))
      setResults(res)
      setSearched(text)
      setApplied(settings.rerank)
      setSearching(false)
      setAnnounce(res.length ? `${Math.min(res.length, settings.topK)} results for ${text}.` : `No chunks matched ${text}.`)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      if (ctl.signal.aborted) return
      setSearching(false)
      setError(e instanceof Error ? e.message : "The search failed.")
      setAnnounce("The search failed.")
    }
  }

  const toggleRerank = (on: boolean) => {
    patchSettings({ rerank: on })
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (!results) return setApplied(on)
    if (!on) {
      setReranking(false)
      return setApplied(false)
    }
    setReranking(true)
    setAnnounce("Reranking results.")
    later(() => {
      setReranking(false)
      setApplied(true)
      setAnnounce("Results reranked.")
    }, 700)
  }

  const ranked: Ranked[] = React.useMemo(() => {
    if (!results) return []
    const byFirst = [...results].sort((a, b) => b.score - a.score)
    const firstRank = new Map(byFirst.map((r, i) => [r.id, i]))
    const useRr = applied && byFirst.some((r) => r.rerankScore !== undefined)
    const list = useRr ? [...results].sort((a, b) => (b.rerankScore ?? b.score) - (a.rerankScore ?? a.score)) : byFirst
    return list.slice(0, settings.topK).map((r, i) => ({ ...r, score: useRr ? (r.rerankScore ?? r.score) : r.score, first: r.score, delta: useRr ? (firstRank.get(r.id) ?? i) - i : 0 }))
  }, [results, applied, settings.topK])

  // FLIP: when the order changes, slide each result from where it was.
  const orderKey = ranked.map((r) => r.id).join("|")
  React.useLayoutEffect(() => {
    const next = new Map<string, number>()
    liRefs.current.forEach((el, id) => {
      if (!el.isConnected) return
      const top = el.offsetTop
      next.set(id, top)
      const prev = tops.current.get(id)
      if (prev !== undefined && prev !== top && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" })
      }
    })
    tops.current = next
  }, [orderKey, openId])

  const terms = React.useMemo(() => queryTerms(searched), [searched])

  /* Derived */
  const readyCount = sources.filter((s) => s.status === "ready").length
  const totalChunks = sources.reduce((n, s) => n + (s.status === "ready" || s.status === "processing" ? (s.chunks ?? 0) : 0), 0)
  const indexing = sources.filter((s) => s.status === "processing" || s.status === "queued").length
  const failed = sources.filter((s) => s.status === "failed").length
  const stateNode = indexing
    ? { key: `i${indexing}`, tone: "", icon: <span className="kb-spin" aria-hidden />, text: `${indexing} indexing` }
    : failed
      ? { key: `f${failed}`, tone: "bad", icon: <CircleAlert aria-hidden />, text: `${failed} failed` }
      : { key: "ok", tone: "ok", icon: <Check aria-hidden />, text: "All indexed" }

  const suggestions = suggestionsProp ? suggestionsProp.map((text) => ({ text, kind: undefined as KnowledgeSourceKind | undefined })) : SAMPLE_SUGGESTIONS
  const views = [
    { id: "sources", label: "Sources", count: sources.length },
    { id: "retrieval", label: "Test retrieval" },
  ] as const
  const vi = views.findIndex((v) => v.id === view)
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const n = (vi + (e.key === "ArrowRight" ? 1 : -1) + views.length) % views.length
    setView(views[n].id)
    tabRefs.current[n]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return
    if (popover) {
      e.stopPropagation()
      const trigger = popover === "menu" ? addBtn.current : settingsBtn.current
      setPopover(null)
      trigger?.focus()
    } else if (adder) setAdder(null)
    else if (view === "retrieval" && (query || results)) {
      abortRef.current?.abort()
      setQuery("")
      setResults(null)
      setSearched("")
      setSearching(false)
      setError(null)
    }
  }

  const rangePct = (v: number, a: number, b: number) => `${((v - a) / (b - a)) * 100}%`

  return (
    <section className={join("kb", className)} aria-labelledby={`${uid}-title`} onKeyDown={onKeyDown}>
      <style href="knowledge-base" precedence="default">{CSS}</style>

      <header className="kb-head">
        <div>
          <h2 id={`${uid}-title`} className="kb-title">{title}</h2>
          <p className="kb-sum">
            <span>{sources.length} {sources.length === 1 ? "source" : "sources"}</span>
            <span className="kb-dot" aria-hidden />
            <span className="kb-mono">{totalChunks.toLocaleString("en-US")} chunks</span>
            <span className="kb-dot kb-sumHide" aria-hidden />
            <span className="kb-sumHide">{modelShort(settings.embeddingModel)}</span>
          </p>
        </div>
        <div className="kb-actions">
          <button ref={settingsBtn} type="button" className="kb-btn" data-kind="icon" style={{ boxShadow: "inset 0 0 0 1px var(--kb-line)" }} aria-label="Retrieval settings" aria-haspopup="dialog" aria-expanded={popover === "settings"} onClick={() => setPopover((p) => (p === "settings" ? null : "settings"))}>
            <SlidersHorizontal aria-hidden />
          </button>
          <button ref={addBtn} type="button" className="kb-btn" data-kind="outline" aria-haspopup="menu" aria-expanded={popover === "menu"} onClick={() => setPopover((p) => (p === "menu" ? null : "menu"))}>
            <Plus aria-hidden style={{ color: "var(--kb-t2)" }} />
            Add source
            <ChevronDown className="kb-chev" aria-hidden />
          </button>

          {popover === "menu" && (
            <div ref={popRef} className="kb-pop kb-menu" role="menu" aria-label="Add source" onKeyDown={(e) => {
              const items = [...(popRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
              const i = items.indexOf(document.activeElement as HTMLElement)
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus()
              }
            }}>
              <button type="button" role="menuitem" className="kb-mi" onClick={() => {
                setPopover(null)
                fileRef.current?.click()
              }}><Upload aria-hidden />Upload files</button>
              <button type="button" role="menuitem" className="kb-mi" onClick={() => {
                setPopover(null)
                setAdder("web")
                setAdderValue("")
              }}><Globe aria-hidden />Crawl a website</button>
              <button type="button" role="menuitem" className="kb-mi" onClick={() => {
                setPopover(null)
                setAdder("text")
                setAdderValue("")
              }}><FileText aria-hidden />Paste text</button>
            </div>
          )}

          {popover === "settings" && (
            <div ref={popRef} className="kb-pop kb-set" role="dialog" aria-label="Retrieval settings">
              <h3>Retrieval settings</h3>
              <div className="kb-field">
                <div className="kb-fieldHead"><label htmlFor={`${uid}-cs`}>Chunk size</label><span>{settings.chunkSize} tokens</span></div>
                <input id={`${uid}-cs`} className="kb-range" type="range" min={128} max={1024} step={64} value={settings.chunkSize} style={{ "--p": rangePct(settings.chunkSize, 128, 1024) } as React.CSSProperties} onChange={(e) => patchSettings({ chunkSize: Number(e.target.value) })} />
              </div>
              <div className="kb-field">
                <div className="kb-fieldHead"><label htmlFor={`${uid}-ov`}>Overlap</label><span>{settings.overlap} tokens</span></div>
                <input id={`${uid}-ov`} className="kb-range" type="range" min={0} max={Math.floor(settings.chunkSize / 2)} step={16} value={settings.overlap} style={{ "--p": rangePct(settings.overlap, 0, Math.floor(settings.chunkSize / 2)) } as React.CSSProperties} onChange={(e) => patchSettings({ overlap: Number(e.target.value) })} />
              </div>
              <div className="kb-field">
                <div className="kb-fieldHead"><label htmlFor={`${uid}-k`}>Top k</label><span>{settings.topK}</span></div>
                <input id={`${uid}-k`} className="kb-range" type="range" min={1} max={10} step={1} value={settings.topK} style={{ "--p": rangePct(settings.topK, 1, 10) } as React.CSSProperties} onChange={(e) => patchSettings({ topK: Number(e.target.value) })} />
              </div>
              <Switch checked={settings.hybrid} onChange={(v) => patchSettings({ hybrid: v })} label="Hybrid search" desc="Blend keyword matches with vectors" />
              <Switch checked={settings.rerank} onChange={toggleRerank} label="Reranking" desc="Re-score the top 20 with a cross-encoder" />
              <div className="kb-field">
                <label className="kb-fieldHead" htmlFor={`${uid}-em`}>Embedding model</label>
                <div className="kb-select">
                  <select id={`${uid}-em`} value={settings.embeddingModel} onChange={(e) => patchSettings({ embeddingModel: e.target.value })}>
                    {embeddingModels.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <ChevronDown aria-hidden />
                </div>
              </div>
              {stale && (
                <div className="kb-setFoot">
                  <span>Chunking changed. Existing sources use the old settings.</span>
                  <button type="button" className="kb-btn" data-kind="primary" style={{ height: 30, fontSize: 12 }} onClick={reindex}>Re-index</button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="kb-tabs">
        <div className="kb-seg" role="tablist" aria-label="View" onKeyDown={onTabKey}>
          <span className="kb-hl" aria-hidden style={{ width: `calc((100% - 6px - 2px) / 2)`, transform: `translateX(calc(${vi} * (100% + 2px)))` }} />
          {views.map((v, i) => (
            <button key={v.id} ref={(el) => void (tabRefs.current[i] = el)} type="button" role="tab" id={`${uid}-t-${v.id}`} aria-selected={view === v.id} aria-controls={`${uid}-panel`} tabIndex={view === v.id ? 0 : -1} className="kb-segBtn" onClick={() => setView(v.id)}>
              {v.label}
              {"count" in v && <span className="kb-count">{v.count}</span>}
            </button>
          ))}
        </div>
        <span key={stateNode.key} className="kb-state" data-tone={stateNode.tone}>
          {stateNode.icon}
          {stateNode.text}
        </span>
      </div>

      <div className="kb-body">
        {view === "sources" ? (
          <div key="sources" className="kb-panel" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-t-sources`}>
            {stale && !popover && (
              <div className="kb-banner">
                <span>Chunking settings changed. Re-index to apply them to {readyCount} {readyCount === 1 ? "source" : "sources"}.</span>
                <button type="button" className="kb-btn" data-kind="primary" style={{ height: 30, fontSize: 12 }} onClick={reindex}>Re-index</button>
              </div>
            )}
            {adder && (
              <form className="kb-adder" onSubmit={(e) => {
                e.preventDefault()
                if (!adderValue.trim()) return
                addSource(adder, adderValue.trim())
                setAdder(null)
                addBtn.current?.focus()
              }}>
                <input autoFocus value={adderValue} onChange={(e) => setAdderValue(e.target.value)} aria-label={adder === "web" ? "Website address" : "Text to add"} placeholder={adder === "web" ? "https://docs.example.com" : "Paste a snippet to index"} />
                <button type="submit" className="kb-btn" data-kind="primary" disabled={!adderValue.trim()}>Add</button>
                <button type="button" className="kb-btn" data-kind="outline" onClick={() => setAdder(null)}>Cancel</button>
              </form>
            )}
            <div className="kb-cols" aria-hidden>
              <span>Source</span>
              <span className="kb-steps">{STEPS.map((s) => <span key={s}>{STEP_LABEL[s]}</span>)}</span>
              <span />
            </div>
            <ul className="kb-list" aria-label="Sources">
              {sources.map((s) => (
                <SourceRow key={s.id} s={s} leaving={leaving.includes(s.id)} onRetry={() => retry(s.id)} onRemove={() => remove(s.id)} />
              ))}
            </ul>
            <div
              className="kb-drop"
              data-over={dragOver ? "" : undefined}
              onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                Array.from(e.dataTransfer.files).forEach((f) => addSource("file", f.name, f))
              }}
            >
              <Upload aria-hidden />
              <span className="kb-dropText">
                <span>Drop files here, or <button type="button" className="kb-link" onClick={() => fileRef.current?.click()}>browse</button></span>
                <small>PDF, DOCX, Markdown or TXT. Demo files stay in your browser.</small>
              </span>
            </div>
            <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.md,.markdown,.txt" className="kb-sr" tabIndex={-1} aria-hidden onChange={(e) => {
              Array.from(e.target.files ?? []).forEach((f) => addSource("file", f.name, f))
              e.target.value = ""
            }} />
          </div>
        ) : (
          <div key="retrieval" className="kb-panel" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-t-retrieval`}>
            <form className="kb-q" role="search" onSubmit={(e) => (e.preventDefault(), run(query))}>
              <Search aria-hidden />
              <input ref={inputRef} className="kb-qin" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask what a customer would ask" aria-label="Test question" autoComplete="off" />
              {query && (
                <button type="button" className="kb-clear" aria-label="Clear question" onClick={() => {
                  abortRef.current?.abort()
                  setQuery("")
                  setResults(null)
                  setSearching(false)
                  setError(null)
                  inputRef.current?.focus()
                }}>
                  <X aria-hidden />
                </button>
              )}
              <button type="submit" className="kb-btn" data-kind="primary" disabled={!query.trim() || searching}>Search</button>
            </form>

            <div className="kb-bar2">
              <span key={searching ? "s" : reranking ? "r" : results ? `r${applied}` : "i"} className="kb-status">
                {searching ? (
                  <><span className="kb-spin" aria-hidden /> Searching…</>
                ) : reranking ? (
                  <><span className="kb-spin" aria-hidden /> Reranking…</>
                ) : results ? (
                  <>
                    <span>Top {Math.min(ranked.length, settings.topK)} of {results.length}</span>
                    <span className="kb-dot" aria-hidden />
                    <span>{ms} ms</span>
                    <span className="kb-dot" aria-hidden />
                    <span>{applied ? "by reranker" : settings.hybrid ? "by hybrid score" : "by similarity"}</span>
                  </>
                ) : (
                  `${totalChunks.toLocaleString("en-US")} chunks from ${readyCount} sources`
                )}
              </span>
              <Switch className="kb-rrBtn" checked={settings.rerank} onChange={toggleRerank} label="Rerank" />
            </div>

            {error && (
              <div className="kb-err" role="alert">
                Search failed: {error}{" "}
                <button type="button" className="kb-link" onClick={() => run(query)}>Try again</button>
              </div>
            )}

            {!results && !searching && !error && (
              <>
                <p className="kb-hint">See which chunks a question pulls back, and how reranking changes the order.</p>
                <ul className="kb-sugg" aria-label="Suggested questions">
                  {suggestions.map((sg) => (
                    <li key={sg.text}>
                      <button type="button" className="kb-sg" onClick={() => (setQuery(sg.text), run(sg.text))}>
                        <KindIcon kind={sg.kind} />
                        {sg.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {results && results.length === 0 && !searching && <p className="kb-hint" style={{ marginTop: 14 }}>No chunks matched. Try fewer or different words.</p>}

            {results && results.length > 0 && (
              <ol className="kb-results" aria-label="Retrieved chunks" aria-busy={reranking}>
                {ranked.map((r, i) => {
                  const open = openId === r.id
                  const ctxId = `${uid}-ctx-${r.id}`
                  return (
                    <li key={r.id} ref={(el) => void (el ? liRefs.current.set(r.id, el) : liRefs.current.delete(r.id))} className="kb-result" data-open={open ? "" : undefined} style={{ animationDelay: `${i * 50}ms` }}>
                      <button type="button" className="kb-rh" aria-expanded={open} aria-controls={ctxId} onClick={() => setOpenId(open ? null : r.id)} aria-label={`Rank ${i + 1}, ${r.source}${r.location ? `, ${r.location}` : ""}, score ${r.score.toFixed(2)}${r.delta ? `, ${r.delta > 0 ? "up" : "down"} ${Math.abs(r.delta)} from reranking` : ""}. ${open ? "Collapse" : "Show in context"}`}>
                        <span className="kb-rank" aria-hidden>{i + 1}</span>
                        <span className="kb-where">
                          <KindIcon kind={r.kind} />
                          <span className="kb-wn">{r.source}</span>
                          {r.location && <span className="kb-wl">{r.location}</span>}
                        </span>
                        <span className="kb-delta" data-d={r.delta > 0 ? "up" : r.delta < 0 ? "down" : undefined} aria-hidden>
                          {r.delta !== 0 && <>{r.delta > 0 ? "↑" : "↓"}{Math.abs(r.delta)}</>}
                        </span>
                        <span className="kb-score" data-rr={applied ? "" : undefined} aria-hidden>
                          <span className="kb-track"><i style={{ transform: `scaleX(${r.score})` }} /></span>
                          <span className="kb-sv"><Roll value={r.score} /></span>
                        </span>
                      </button>
                      <div className="kb-rb" onClick={() => setOpenId(open ? null : r.id)}>
                        {!open && <p className="kb-ex"><Highlight text={r.text} terms={terms} /></p>}
                        <div id={ctxId} className="kb-ctx" data-open={open ? "" : undefined}>
                          <div>
                            {open && (
                              <>
                                {r.before && <div className="kb-nb"><span>Previous chunk{r.before.location ? `, ${r.before.location}` : ""}</span><p>{r.before.text}</p></div>}
                                <p className="kb-focus"><Highlight text={r.text} terms={terms} /></p>
                                {r.after && <div className="kb-nb"><span>Next chunk{r.after.location ? `, ${r.after.location}` : ""}</span><p>{r.after.text}</p></div>}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        )}
      </div>

      <p className="kb-sr" role="status" aria-live="polite">{announce}</p>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Source row                                  */
/* -------------------------------------------------------------------------- */

function SourceRow({ s, leaving, onRetry, onRemove }: { s: KnowledgeSource; leaving: boolean; onRetry: () => void; onRemove: () => void }) {
  const si = s.step ? STEPS.indexOf(s.step) : -1
  const frac = (i: number) => (s.status === "ready" ? 1 : s.status === "queued" ? 0 : i < si ? 1 : i === si ? clamp(s.progress ?? 0, 0, 1) : 0)
  const kind = (i: number) => (s.status === "processing" && i === si ? "active" : s.status === "failed" && i === si ? "fail" : "done")
  const overall = s.status === "processing" ? Math.round(((si + clamp(s.progress ?? 0, 0, 1)) / STEPS.length) * 100) : s.status === "ready" ? 100 : 0
  const counts = [s.pages !== undefined && `${s.pages} pages`, s.chunks !== undefined && `${s.chunks} chunks`, s.tokens !== undefined && `${compact(s.tokens)} tokens`, s.note].filter(Boolean) as string[]
  const label = s.status === "processing" ? `${STEP_VERB[s.step ?? "parse"]}${s.detail ? ` · ${s.detail}` : ""}` : s.status === "queued" ? "Waiting in the queue" : ""
  const metaKey = `${s.status}-${s.step ?? ""}-${s.status === "ready" ? counts.join() : ""}`

  return (
    <li className="kb-item" data-leaving={leaving ? "" : undefined} aria-label={s.name}>
      <div>
        <div className="kb-row">
          <KindIcon kind={s.kind} className="kb-icon" />
          <div className="kb-main">
            <span className="kb-name" title={s.name}>{s.name}</span>
            {s.status === "failed" ? (
              <span key={metaKey} className="kb-meta" data-tone="bad"><CircleAlert aria-hidden /><span>{s.error ?? "Indexing failed"}</span></span>
            ) : s.status === "ready" ? (
              <span key={metaKey} className="kb-meta" data-sep="">{counts.map((c) => <span key={c}>{c}</span>)}</span>
            ) : (
              <span key={metaKey} className="kb-meta"><span className="kb-shimmer" data-text={label}>{label}</span></span>
            )}
          </div>
          <div
            className="kb-pipe"
            role="progressbar"
            aria-label={`${s.name} indexing pipeline`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={overall}
            aria-valuetext={s.status === "ready" ? "Indexed" : s.status === "failed" ? `Failed while ${STEP_VERB[s.step ?? "parse"].toLowerCase()}` : s.status === "queued" ? "Queued" : `${STEP_VERB[s.step ?? "parse"]}, ${overall} percent`}
          >
            {STEPS.map((st, i) => (
              <span key={st} className="kb-seg4" data-s={kind(i)}>
                <i style={{ transform: `scaleX(${frac(i)})` }} />
              </span>
            ))}
          </div>
          <div className="kb-end" key={s.status}>
            {s.status === "ready" && <Check className="kb-ok" aria-label="Indexed" />}
            {(s.status === "processing" || s.status === "queued") && <span className="kb-pct">{overall}%</span>}
            {s.status === "failed" &&
              (s.retryable === false ? (
                <button type="button" className="kb-mini" onClick={onRemove} aria-label={`Remove ${s.name}`}><Trash2 aria-hidden />Remove</button>
              ) : (
                <button type="button" className="kb-mini" onClick={onRetry} aria-label={`Retry ${s.name}`}><RotateCcw aria-hidden />Retry</button>
              ))}
          </div>
        </div>
      </div>
    </li>
  )
}

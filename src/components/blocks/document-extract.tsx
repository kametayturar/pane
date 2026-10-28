"use client"

import * as React from "react"
import { Check, ChevronDown, Mail, Minus, Pencil, Play, RotateCcw, Sparkles, Square, TriangleAlert, Plus } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** A piece of document text. Wrap a span in `{ id, text }` to make it citable: values point at span ids. */
export type DocSpan = { id: string; text: string }
export type DocRich = string | Array<string | DocSpan>

export type DocBlock =
  | { type: "masthead"; brand: string; title: string }
  | { type: "mailhead"; rows: { label: string; value: DocRich }[] }
  | { type: "columns"; columns: { label: string; lines: DocRich[] }[] }
  | { type: "meta"; items: { label: string; value: DocRich }[] }
  | { type: "table"; head: { text: string; align?: "left" | "right" }[]; rows: { cells: DocRich[]; sub?: string }[] }
  | { type: "totals"; rows: { label: DocRich; value: DocRich; strong?: boolean }[] }
  | { type: "heading"; text: string }
  | { type: "pairs"; rows: { label: string; value: DocRich }[] }
  | { type: "text"; text: DocRich; muted?: boolean }
  | { type: "footer"; text: string }

export type SourceDocument = {
  id: string
  /** File name shown in the file bar. */
  name: string
  /** Short description, shown in the file menu. */
  label?: string
  kind?: "pdf" | "email"
  /** Anything you want to carry along (page count, upload id …). */
  metadata?: Record<string, unknown>
  blocks: DocBlock[]
}

export type ExtractFieldType = "string" | "date" | "money" | "currency" | "iban" | "integer" | "number" | "table"

export type ExtractColumn = { key: string; label: string; type: Exclude<ExtractFieldType, "table"> }

/** What a value looks like once the model found it. */
export type ExtractValue = string | number | null | Array<Record<string, string | number | null>>

export type ExtractEvent =
  | {
      type: "value"
      key: string
      value: ExtractValue
      /** 0 to 1. Below `reviewThreshold` the value is flagged for a check. */
      confidence: number
      /** Ids of the document spans this value was read from. */
      spans?: string[]
      /** For table values: the span ids of each row. */
      rowSpans?: string[][]
      /** Why the model is unsure, shown under a flagged value. */
      note?: string
    }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "error"; message: string }

export type ExtractField = {
  key: string
  label: string
  type: ExtractFieldType
  /** Id of a group in `schema.groups`. */
  group?: string
  /** Columns of a `table` field. */
  columns?: ExtractColumn[]
  /** Used by the built-in simulation: the value, spans and confidence it plays back. */
  demo?: Omit<Extract<ExtractEvent, { type: "value" }>, "type" | "key">
}

export type ExtractSchema = {
  name: string
  /** Groups the form sections and tints the source spans (any CSS colour). */
  groups?: { id: string; label: string; color: string }[]
  fields: ExtractField[]
}

export type ExtractOutput = Record<string, string | number | null | Array<Record<string, string | number | null>>>

export type ExtractModel = {
  id: string
  name: string
  /** USD per million input tokens. */
  inputPrice: number
  /** USD per million output tokens. */
  outputPrice: number
}

export type DocumentExtractProps = {
  /** The document to read. Leave it out to play with the built-in samples. */
  document?: SourceDocument
  /** The fields to fill. Defaults to `invoiceSchema` when `document` is set. */
  schema?: ExtractSchema
  /** Documents to switch between from the file menu. Ignored when `document` is set. */
  samples?: { document: SourceDocument; schema: ExtractSchema }[]
  /** Your model call: yield value, usage or error events (or resolve to a list of them) and respect the signal. Without it the block simulates a run. */
  extract?: (document: SourceDocument, schema: ExtractSchema, ctx: { signal: AbortSignal }) => AsyncIterable<ExtractEvent> | Promise<ExtractEvent[]>
  /** Receives the typed output after Accept all. Throwing undoes the acceptance. Without it the hand-off is simulated. */
  onAccept?: (data: ExtractOutput, detail: { document: SourceDocument; schema: ExtractSchema; values: Record<string, ExtractValue> }) => void | Promise<void>
  /** Model name and prices for the cost readout. */
  model?: ExtractModel
  /** The model's mark in the footer. */
  modelMark?: React.ReactNode
  /** Values with a lower confidence are flagged for review. */
  reviewThreshold?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const s = (id: string, text: string): DocSpan => ({ id, text })

const INVOICE_GROUPS = [
  { id: "invoice", label: "Invoice", color: "oklch(.58 .15 250)" },
  { id: "lines", label: "Line items", color: "oklch(.5 .19 307)" },
  { id: "totals", label: "Totals", color: "oklch(.68 .15 70)" },
  { id: "payment", label: "Payment", color: "oklch(.62 .1 190)" },
]

export const invoiceSchema: ExtractSchema = {
  name: "Invoice",
  groups: INVOICE_GROUPS,
  fields: [
    { key: "vendor", label: "Vendor", type: "string", group: "invoice", demo: { value: "Pinewood Studio GmbH", confidence: 0.99, spans: ["v"] } },
    { key: "invoiceNo", label: "Invoice no.", type: "string", group: "invoice", demo: { value: "INV-2026-0731", confidence: 0.99, spans: ["no"] } },
    { key: "issueDate", label: "Issue date", type: "date", group: "invoice", demo: { value: "2026-07-31", confidence: 0.98, spans: ["issue"] } },
    {
      key: "dueDate",
      label: "Due date",
      type: "date",
      group: "invoice",
      demo: { value: "2026-08-30", confidence: 0.64, spans: ["terms"], note: "Not printed. Worked out from the issue date plus 30 days net." },
    },
    {
      key: "lineItems",
      label: "Line items",
      type: "table",
      group: "lines",
      columns: [
        { key: "description", label: "Description", type: "string" },
        { key: "qty", label: "Qty", type: "number" },
        { key: "unitPrice", label: "Unit price", type: "money" },
        { key: "amount", label: "Amount", type: "money" },
      ],
      demo: {
        confidence: 0.93,
        value: [
          { description: "Brand refresh sprint, week 29", qty: 5, unitPrice: 1350, amount: 6750 },
          { description: "Landing page build", qty: 1, unitPrice: 3200, amount: 3200 },
          { description: "Copy editing", qty: 6, unitPrice: 110, amount: 660 },
          { description: "Stock imagery licence", qty: 1, unitPrice: 180, amount: 180 },
        ],
        rowSpans: [
          ["r1d", "r1q", "r1p", "r1a"],
          ["r2d", "r2q", "r2p", "r2a"],
          ["r3d", "r3q", "r3p", "r3a"],
          ["r4d", "r4q", "r4p", "r4a"],
        ],
      },
    },
    { key: "currency", label: "Currency", type: "currency", group: "totals", demo: { value: "CHF", confidence: 0.97, spans: ["cur"] } },
    { key: "subtotal", label: "Subtotal", type: "money", group: "totals", demo: { value: 10790, confidence: 0.99, spans: ["sub"] } },
    { key: "vat", label: "VAT", type: "money", group: "totals", demo: { value: 873.99, confidence: 0.97, spans: ["vat"] } },
    { key: "total", label: "Total", type: "money", group: "totals", demo: { value: 11663.99, confidence: 0.99, spans: ["tot"] } },
    {
      key: "iban",
      label: "IBAN",
      type: "iban",
      group: "payment",
      demo: { value: "CH93 0076 2011 6238 5295 7", confidence: 0.72, spans: ["iban"], note: "Two account numbers on the page. Took the current one; the other is marked as replaced." },
    },
  ],
}

const invoiceDocument: SourceDocument = {
  id: "pinewood-invoice",
  name: "pinewood-invoice-0731.pdf",
  label: "Design studio invoice, 1 page",
  kind: "pdf",
  blocks: [
    { type: "masthead", brand: "pinewood studio", title: "Invoice" },
    {
      type: "columns",
      columns: [
        { label: "From", lines: [[s("v", "Pinewood Studio GmbH")], "Seestrasse 118", "8002 Zürich, Switzerland", "VAT CHE-214.806.377 MWST"] },
        { label: "Bill to", lines: ["Harborlight Analytics AG", "Attn. Marta Voss", "Bahnhofstrasse 9", "8001 Zürich, Switzerland"] },
      ],
    },
    {
      type: "meta",
      items: [
        { label: "Invoice no.", value: [s("no", "INV-2026-0731")] },
        { label: "Issue date", value: [s("issue", "31 July 2026")] },
        { label: "Payment terms", value: [s("terms", "30 days net")] },
        { label: "Customer no.", value: "HL-40817" },
      ],
    },
    {
      type: "table",
      head: [{ text: "Description" }, { text: "Qty", align: "right" }, { text: "Unit price", align: "right" }, { text: "Amount", align: "right" }],
      rows: [
        { cells: [[s("r1d", "Brand refresh sprint, week 29")], [s("r1q", "5 days")], [s("r1p", "1,350.00")], [s("r1a", "6,750.00")]], sub: "Moodboards, type and colour tests" },
        { cells: [[s("r2d", "Landing page build")], [s("r2q", "1")], [s("r2p", "3,200.00")], [s("r2a", "3,200.00")]], sub: "Design handoff and responsive QA" },
        { cells: [[s("r3d", "Copy editing")], [s("r3q", "6 h")], [s("r3p", "110.00")], [s("r3a", "660.00")]], sub: "Three pages, two review rounds" },
        { cells: [[s("r4d", "Stock imagery licence")], [s("r4q", "1")], [s("r4p", "180.00")], [s("r4a", "180.00")]], sub: "Annual licence, 12 images" },
      ],
    },
    {
      type: "totals",
      rows: [
        { label: "Subtotal", value: [s("sub", "10,790.00")] },
        { label: "VAT 8.1%", value: [s("vat", "873.99")] },
        { label: ["Total due ", s("cur", "CHF")], value: [s("tot", "11,663.99")], strong: true },
      ],
    },
    { type: "heading", text: "Payment details" },
    {
      type: "pairs",
      rows: [
        { label: "Account holder", value: "Pinewood Studio GmbH" },
        { label: "IBAN", value: [s("iban", "CH93 0076 2011 6238 5295 7")] },
        { label: "Reference", value: "INV-2026-0731" },
      ],
    },
    { type: "text", muted: true, text: "Our bank details changed on 1 July 2026. Please stop using CH44 3199 9123 0008 8901 2 for new payments." },
    { type: "footer", text: "Pinewood Studio GmbH · Seestrasse 118 · 8002 Zürich · pinewood.example" },
  ],
}

const ORDER_GROUPS = [
  { id: "order", label: "Order", color: "oklch(.58 .15 250)" },
  { id: "items", label: "Items", color: "oklch(.5 .19 307)" },
  { id: "totals", label: "Totals", color: "oklch(.68 .15 70)" },
]

const orderSchema: ExtractSchema = {
  name: "Purchase order",
  groups: ORDER_GROUPS,
  fields: [
    { key: "sender", label: "Sender", type: "string", group: "order", demo: { value: "Rafael Ortega", confidence: 0.98, spans: ["from"] } },
    { key: "poNumber", label: "PO number", type: "string", group: "order", demo: { value: "PO-2291", confidence: 0.99, spans: ["po"] } },
    { key: "orderDate", label: "Order date", type: "date", group: "order", demo: { value: "2026-09-08", confidence: 0.97, spans: ["sent"] } },
    {
      key: "deliveryDate",
      label: "Deliver by",
      type: "date",
      group: "order",
      demo: { value: "2026-10-02", confidence: 0.77, spans: ["by"], note: "The email says 2 October without a year. Took the year from the send date." },
    },
    {
      key: "items",
      label: "Items",
      type: "table",
      group: "items",
      columns: [
        { key: "sku", label: "SKU", type: "string" },
        { key: "qty", label: "Qty", type: "integer" },
        { key: "unitPrice", label: "Unit price", type: "money" },
      ],
      demo: {
        confidence: 0.95,
        value: [
          { sku: "KP-114", qty: 40, unitPrice: 12.5 },
          { sku: "KP-207", qty: 25, unitPrice: 8.9 },
          { sku: "KP-331", qty: 10, unitPrice: 46 },
        ],
        rowSpans: [
          ["i1s", "i1q", "i1p"],
          ["i2s", "i2q", "i2p"],
          ["i3s", "i3q", "i3p"],
        ],
      },
    },
    { key: "currency", label: "Currency", type: "currency", group: "totals", demo: { value: "EUR", confidence: 0.96, spans: ["cur"] } },
    { key: "total", label: "Total", type: "money", group: "totals", demo: { value: 1182.5, confidence: 0.98, spans: ["tot"] } },
  ],
}

const orderDocument: SourceDocument = {
  id: "tidewell-po",
  name: "tidewell-po-2291.eml",
  label: "Purchase order email",
  kind: "email",
  blocks: [
    {
      type: "mailhead",
      rows: [
        { label: "From", value: [s("from", "Rafael Ortega"), " <r.ortega@tidewell.example>"] },
        { label: "To", value: "orders@kestrelparts.example" },
        { label: "Date", value: [s("sent", "Tue, 8 Sep 2026"), ", 09:14"] },
        { label: "Subject", value: ["Purchase order ", s("po", "PO-2291"), ", please confirm"] },
      ],
    },
    { type: "text", text: "Hi team," },
    { type: "text", text: ["Please find our order below. We need everything at the Basel warehouse ", s("by", "by 2 October"), ". Prices are as quoted last month."] },
    {
      type: "table",
      head: [{ text: "SKU" }, { text: "Qty", align: "right" }, { text: "Unit price", align: "right" }],
      rows: [
        { cells: [[s("i1s", "KP-114")], [s("i1q", "40")], [s("i1p", "12.50")]], sub: "Torque bracket, steel" },
        { cells: [[s("i2s", "KP-207")], [s("i2q", "25")], [s("i2p", "8.90")]], sub: "Hex spacer set" },
        { cells: [[s("i3s", "KP-331")], [s("i3q", "10")], [s("i3p", "46.00")]], sub: "Anchor plate, 6 mm" },
      ],
    },
    { type: "totals", rows: [{ label: ["Total (", s("cur", "EUR"), ")"], value: [s("tot", "1,182.50")], strong: true }] },
    { type: "text", muted: true, text: "Payment by bank transfer within 30 days of delivery." },
    { type: "text", text: "Thanks, Rafael" },
    { type: "footer", text: "Rafael Ortega · Procurement · Tidewell Supplies" },
  ],
}

export const sampleDocuments: { document: SourceDocument; schema: ExtractSchema }[] = [
  { document: invoiceDocument, schema: invoiceSchema },
  { document: orderDocument, schema: orderSchema },
]

const DEFAULT_MODEL: ExtractModel = { id: "atlas-flash-2", name: "Atlas Flash 2", inputPrice: 0.8, outputPrice: 4 }

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dex {
  --dex-ink: #000;
  --dex-surface: #fff;
  --dex-accent: #0060e2;
  --dex-t1: color-mix(in oklab, var(--dex-ink) 88%, transparent);
  --dex-t2: color-mix(in oklab, var(--dex-ink) 61%, transparent);
  --dex-t3: color-mix(in oklab, var(--dex-ink) 45%, transparent);
  --dex-t4: color-mix(in oklab, var(--dex-ink) 27%, transparent);
  --dex-fill: color-mix(in oklab, var(--dex-ink) 4%, transparent);
  --dex-hover: color-mix(in oklab, var(--dex-ink) 5%, transparent);
  --dex-line: color-mix(in oklab, var(--dex-ink) 7%, transparent);
  --dex-soft: color-mix(in oklab, var(--dex-ink) 4.5%, transparent);
  --dex-canvas: color-mix(in oklab, var(--dex-surface), var(--dex-ink) 4.5%);
  --dex-main-bg: color-mix(in oklab, var(--dex-ink) 80%, transparent);
  --dex-main-fg: #fcfcfc;
  --dex-warn: #b36b00;
  --dex-warn-bg: color-mix(in oklab, #e8a20c 12%, transparent);
  --dex-warn-line: color-mix(in oklab, #e8a20c 55%, transparent);
  --dex-ok: #1f8a4c;
  --dex-bad: #c0392b;
  --dex-glint: rgb(255 255 255 / .82);
  --dex-paper: #fff;
  --dex-paper-ink: #2b2b2b;
  --dex-paper-mute: #8a8a8a;
  --dex-paper-line: #e4e4e4;
  --dex-float: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --dex-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 1080px;
  container: dex / inline-size;
  border-radius: 26px;
  border: 1px solid var(--dex-line);
  background: var(--dex-surface);
  color: var(--dex-t1);
  font-family: var(--dex-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .dex {
  --dex-ink: #fff;
  --dex-surface: #1c1c1e;
  --dex-accent: #4d8dff;
  --dex-t1: color-mix(in oklab, var(--dex-ink) 90%, transparent);
  --dex-t2: color-mix(in oklab, var(--dex-ink) 62%, transparent);
  --dex-t3: color-mix(in oklab, var(--dex-ink) 46%, transparent);
  --dex-t4: color-mix(in oklab, var(--dex-ink) 28%, transparent);
  --dex-fill: color-mix(in oklab, var(--dex-ink) 6%, transparent);
  --dex-hover: color-mix(in oklab, var(--dex-ink) 8%, transparent);
  --dex-line: color-mix(in oklab, var(--dex-ink) 10%, transparent);
  --dex-soft: color-mix(in oklab, var(--dex-ink) 7%, transparent);
  --dex-canvas: color-mix(in oklab, var(--dex-surface), #000 28%);
  --dex-main-bg: rgb(255 255 255 / .9);
  --dex-main-fg: #171717;
  --dex-warn: #fbbf24;
  --dex-ok: #4ade80;
  --dex-bad: #ff8a7a;
  --dex-glint: rgb(255 255 255 / .9);
  --dex-paper: #f6f6f4;
  --dex-float: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35), 0 0 0 .5px rgb(255 255 255 / .1);
}
.dex *, .dex *::before, .dex *::after { box-sizing: border-box }
:where(.dex) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.dex) input { font: inherit; color: inherit }
.dex button:disabled { cursor: default }
.dex :focus-visible { outline: 2px solid color-mix(in oklab, var(--dex-accent) 60%, transparent); outline-offset: 1px }
.dex :focus:not(:focus-visible) { outline: none }
.dex svg { display: block; flex: none }
.dex-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

.dex-btn {
  position: relative; display: inline-grid; place-items: center; height: 36px; padding: 0 12px; border-radius: 18px; font-weight: 500; white-space: nowrap;
  transition: background-color .16s, color .16s, box-shadow .16s, transform .16s var(--dex-ease), opacity .2s;
}
.dex-btn > span { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: 8px; transition: opacity .2s var(--dex-ease), transform .26s var(--dex-ease), filter .2s }
.dex-btn > [data-off] { opacity: 0; transform: scale(.9); filter: blur(3px); pointer-events: none }
.dex-btn:active:not(:disabled) { transform: scale(.975) }
.dex-btn svg { width: 16px; height: 16px }
.dex-btn[data-kind="primary"] { background: var(--dex-main-bg); color: var(--dex-main-fg) }
.dex-btn[data-kind="primary"]:hover:not(:disabled) { background: color-mix(in oklab, var(--dex-main-bg), var(--dex-ink) 8%) }
.dex-btn[data-kind="primary"]:disabled { background: color-mix(in oklab, var(--dex-ink) 30%, transparent); color: color-mix(in oklab, var(--dex-surface) 90%, transparent) }
.dex-btn[data-kind="secondary"] { background: var(--dex-surface); box-shadow: inset 0 0 0 1px var(--dex-line) }
.dex-btn[data-kind="secondary"]:hover { background: color-mix(in oklab, var(--dex-surface), var(--dex-ink) 3%) }

/* Layout */
.dex-body { position: relative; display: flex; flex-direction: column; height: 760px; max-height: none; border-radius: 25px 25px 0 0; overflow: hidden }
.dex-viewer { position: relative; display: flex; flex-direction: column; flex: 0 0 340px; min-width: 0; min-height: 0; background: var(--dex-canvas) }
.dex-form { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; background: var(--dex-surface); border-top: 1px solid var(--dex-line) }
@container dex (min-width: 760px) {
  .dex-body { flex-direction: row; height: 540px }
  .dex-viewer { flex: 1 1 59%; border-right: 0 }
  .dex-form { flex: 0 0 41%; border-top: 0; border-left: 1px solid var(--dex-line) }
}

/* Toolbar */
.dex-bar { display: flex; align-items: center; gap: 8px; flex: none; height: 48px; padding: 0 8px; background: var(--dex-surface); border-bottom: 1px solid var(--dex-line) }
.dex-menuWrap { position: relative; min-width: 0 }
.dex-file { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 8px 0 6px; border-radius: 10px; font-weight: 500; max-width: 100%; transition: background-color .16s }
button.dex-file:hover, .dex-file[aria-expanded="true"] { background: var(--dex-fill) }
.dex-file[data-static] { cursor: default }
.dex-fileName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.dex-file > svg:last-child { width: 14px; height: 14px; color: var(--dex-t3) }
.dex-fileIcon { width: 16px; height: 18px; color: #d4483b }
.dex-fileIcon[data-kind="email"] { color: var(--dex-t2) }
.dex-menu { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; min-width: 260px; padding: 6px; border-radius: 16px; background: var(--dex-surface); box-shadow: var(--dex-float); animation: dex-pop .26s var(--dex-ease) backwards; transform-origin: top left }
.dex-item { display: grid; grid-template-columns: 16px minmax(0, 1fr) 16px; align-items: center; gap: 10px; width: 100%; padding: 7px 8px; border-radius: 10px; text-align: left }
.dex-item:hover, .dex-item:focus-visible { background: var(--dex-fill) }
.dex-item small { display: block; font-size: 12px; line-height: 16px; color: var(--dex-t3) }
.dex-item svg { width: 16px; height: 16px; color: var(--dex-t2) }
.dex-tools { display: flex; align-items: center; gap: 6px; margin-left: auto; flex: none }
.dex-pages { padding: 0 6px; font-size: 12px; color: var(--dex-t3); font-variant-numeric: tabular-nums }
.dex-zoom { display: inline-flex; align-items: center; padding: 1px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--dex-line) }
.dex-tool { display: inline-grid; place-items: center; min-width: 28px; height: 26px; padding: 0 6px; border-radius: 8px; font-size: 12px; color: var(--dex-t2); transition: background-color .16s, color .16s }
.dex-tool:hover:not(:disabled) { background: var(--dex-fill); color: var(--dex-t1) }
.dex-tool:disabled { opacity: .4 }
.dex-tool svg { width: 14px; height: 14px }
.dex-tool[data-value] { min-width: 46px; color: var(--dex-t1); font-variant-numeric: tabular-nums }
.dex-fit { height: 30px; padding: 0 11px; border-radius: 10px; font-size: 12px; font-weight: 500; color: var(--dex-t1); background: var(--dex-fill); transition: background-color .16s }
.dex-fit:hover { background: var(--dex-hover) }
.dex-fit[aria-pressed="true"] { background: var(--dex-surface); box-shadow: inset 0 0 0 1px var(--dex-line) }

/* Canvas + page */
.dex-stage { position: relative; flex: 1; min-height: 0; overflow: hidden }
.dex-canvas { position: absolute; inset: 0; overflow: auto; padding: 14px; scrollbar-width: thin; scrollbar-color: var(--dex-t4) transparent; scroll-behavior: smooth }
.dex-sizer { position: relative; margin: 0 auto; transition: width .38s var(--dex-ease), height .38s var(--dex-ease) }
.dex-page {
  position: absolute; left: 0; top: 0; width: 640px; padding: 40px 44px 36px; border-radius: 2px; background: var(--dex-paper); color: var(--dex-paper-ink);
  font-size: 10px; line-height: 14px; transform-origin: 0 0; transition: transform .38s var(--dex-ease);
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .12), 0 1px 3px rgb(0 0 0 / .065), 0 8px 24px -8px rgb(0 0 0 / .12);
}
.dex-page p, .dex-page dl, .dex-page dd, .dex-page table { margin: 0 }
.dex-mast { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 26px }
.dex-brand { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; line-height: 18px; color: #3a3a3a }
.dex-brand svg { width: 16px; height: 16px; color: oklch(.58 .15 250) }
.dex-docTitle { font-size: 20px; line-height: 24px; font-weight: 500; color: #1c1c1c }
.dex-cols { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 24px; margin-bottom: 22px }
.dex-cols small, .dex-meta small { display: block; margin-bottom: 3px; font-size: 8px; line-height: 10px; color: var(--dex-paper-mute) }
.dex-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 8px 0 9px; margin-bottom: 18px; border-top: 1px solid var(--dex-paper-line); border-bottom: 1px solid var(--dex-paper-line) }
.dex-mailhead { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--dex-paper-line) }
.dex-mailhead > div { display: grid; grid-template-columns: 54px 1fr; gap: 6px; padding: 2px 0 }
.dex-mailhead small { color: var(--dex-paper-mute); font-size: 9px }
.dex-pt { width: 100%; border-collapse: collapse; margin-bottom: 14px }
.dex-pt th { padding: 0 0 5px; text-align: left; font-weight: 400; font-size: 8.5px; color: var(--dex-paper-mute); border-bottom: 1.5px solid #8b8b8b }
.dex-pt td { padding: 6px 0; border-bottom: 1px solid var(--dex-paper-line); vertical-align: top }
.dex-pt [data-r] { text-align: right; white-space: nowrap; padding-left: 12px }
.dex-pt small { display: block; margin-top: 1px; font-size: 8px; color: var(--dex-paper-mute) }
.dex-tot { width: 52%; margin: 0 0 18px auto }
.dex-tot > div { display: flex; justify-content: space-between; gap: 12px; padding: 3px 0 }
.dex-tot > div[data-strong] { margin-top: 2px; padding-top: 5px; border-top: 1.5px solid #8b8b8b; font-weight: 500; font-size: 11px }
.dex-h { margin: 6px 0 6px; font-weight: 500; font-size: 10px }
.dex-pairs { display: grid; grid-template-columns: 78px 1fr; gap: 2px 8px; margin-bottom: 12px }
.dex-pairs dt { color: var(--dex-paper-mute) }
.dex-note { margin-bottom: 10px; color: var(--dex-paper-mute) }
.dex-foot { margin-top: 14px; padding-top: 8px; border-top: 1px solid var(--dex-paper-line); font-size: 7.5px; line-height: 10px; color: var(--dex-paper-mute) }
.dex-p { margin-bottom: 8px }

/* Source spans */
.dex-span { --g: oklch(.58 .15 250); margin: 0 -1px; padding: 0 1px; border-radius: 2px; transition: background-color .4s var(--dex-ease), box-shadow .25s var(--dex-ease) }
.dex-span[data-on] { background: color-mix(in oklab, var(--g) 15%, transparent); animation: dex-tint .7s var(--dex-ease) backwards }
.dex-span[data-flag] { text-decoration: underline dashed color-mix(in oklab, var(--g) 70%, transparent) 1px; text-underline-offset: 2px }
.dex-span[data-active] { background: color-mix(in oklab, var(--g) 30%, transparent); box-shadow: 0 0 0 1px color-mix(in oklab, var(--g) 70%, transparent) }
.dex-scan { position: absolute; left: 0; right: 0; height: 64px; z-index: 2; pointer-events: none; background: linear-gradient(to bottom, transparent, color-mix(in oklab, var(--dex-accent) 9%, transparent) 85%, color-mix(in oklab, var(--dex-accent) 28%, transparent)); border-bottom: 1px solid color-mix(in oklab, var(--dex-accent) 50%, transparent); animation: dex-scan 1.8s linear infinite }

/* Connecting line */
.dex-links { position: absolute; inset: 0; z-index: 8; width: 100%; height: 100%; pointer-events: none; overflow: visible }
@container dex (max-width: 759px) { .dex-links { display: none } }
.dex-link { fill: none; stroke-width: 1.4; stroke-linecap: round }
.dex-link[data-base] { opacity: .7; stroke-dasharray: 1; stroke-dashoffset: 0; animation: dex-draw .5s var(--dex-ease) backwards }
.dex-link[data-glint] { stroke: #fff; stroke-opacity: .85; stroke-dasharray: .1 1; animation: dex-glint .9s var(--dex-ease) .05s backwards }
.dex-dot { animation: dex-fadein .3s .1s backwards }

/* Form */
.dex-formHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex: none; height: 48px; padding: 0 8px 0 10px }
.dex-seg { position: relative; display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 2px; padding: 3px; border-radius: 18px; background: var(--dex-fill); box-shadow: inset 0 0 0 1px var(--dex-line) }
.dex-segHl { position: absolute; top: 3px; bottom: 3px; left: 0; border-radius: 15px; background: var(--dex-surface); box-shadow: 0 0 0 1px var(--dex-line), 0 1px 2px rgb(0 0 0 / .04); transition: transform .32s var(--dex-ease), width .32s var(--dex-ease) }
.dex-segBtn { position: relative; height: 30px; padding: 0 12px; border-radius: 15px; font-size: 12px; font-weight: 500; color: var(--dex-t3); transition: color .2s }
.dex-segBtn:hover { color: var(--dex-t1) }
.dex-segBtn[aria-selected="true"] { color: var(--dex-t1) }
.dex-scroll { position: relative; flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--dex-t4) transparent; padding: 0 12px 20px 14px }
.dex-status { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 8px 4px 6px 4px; margin: 0 -4px; background: var(--dex-surface); font-size: 12px; line-height: 16px; color: var(--dex-t2) }
.dex-status svg { width: 15px; height: 15px }
.dex-status[data-tone="warn"] svg { color: var(--dex-warn) }
.dex-status[data-tone="ok"] svg { color: var(--dex-ok) }
.dex-status[data-tone="bad"] { color: var(--dex-bad) }
.dex-status > .dex-pill { margin-left: auto }
.dex-pill { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 10px 0 9px; border-radius: 999px; font-size: 12px; font-weight: 500; color: var(--dex-t1); background: var(--dex-surface); box-shadow: inset 0 0 0 1px var(--dex-line); transition: background-color .16s }
.dex-pill:hover { background: var(--dex-fill) }
.dex-pill svg { width: 13px; height: 13px }
.dex-shimmer { position: relative; display: inline-block }
.dex-shimmer::after { content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap; background: linear-gradient(90deg, transparent 38%, var(--dex-glint) 50%, transparent 62%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text; animation: dex-sweep 1.6s linear infinite }
.dex-groups { display: flex; flex-direction: column; gap: 4px }
.dex-gh { display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 8px 4px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--dex-t2) }
.dex-dot2 { width: 7px; height: 7px; border-radius: 50%; background: var(--g) }
.dex-row { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; align-items: start; gap: 0 8px; padding: 2px 4px 2px 8px; border-radius: 12px; transition: background-color .2s }
.dex-row[data-link] { background: color-mix(in oklab, var(--g) 9%, transparent) }
.dex-rl { padding-top: 8px; font-size: 12px; line-height: 17px; color: var(--dex-t2) }
.dex .dex-in:focus-visible, .dex .dex-cell:focus-visible { outline: none }
.dex-in {
  width: 100%; height: 32px; padding: 0 8px; border: 1px solid transparent; border-radius: 9px; background: transparent; outline: none; color: var(--dex-t1);
  text-overflow: ellipsis; transition: background-color .16s, border-color .16s, box-shadow .16s;
}
.dex-in:hover:not(:disabled):not(:focus) { background: var(--dex-fill) }
.dex-in:focus { background: var(--dex-surface); border-color: color-mix(in oklab, var(--dex-ink) 22%, transparent); box-shadow: 0 0 0 3px var(--dex-fill) }
.dex-in[data-flag] { background: var(--dex-warn-bg); border-color: var(--dex-warn-line) }
.dex-in[aria-invalid="true"] { border-color: color-mix(in oklab, var(--dex-bad) 60%, transparent); background: color-mix(in oklab, var(--dex-bad) 7%, transparent) }
.dex-skel { position: relative; width: 100%; height: 32px; border-radius: 9px; background: var(--dex-fill); overflow: hidden }
.dex-skel[data-busy]::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 20%, color-mix(in oklab, var(--dex-ink) 6%, transparent) 50%, transparent 80%) 0 0 / 250% 100%; animation: dex-sweep 1.4s linear infinite }
.dex-conf { display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; min-width: 56px; padding-top: 8px; font-size: 12px; line-height: 16px; color: var(--dex-t3); font-variant-numeric: tabular-nums; animation: dex-fadein .4s var(--dex-ease) backwards }
.dex-conf svg { width: 13px; height: 13px }
.dex-conf[data-s="flag"] { color: var(--dex-t1) }
.dex-conf[data-s="flag"] svg { color: var(--dex-warn) }
.dex-conf[data-s="ok"] svg, .dex-conf[data-s="accepted"] svg { color: var(--dex-ok) }
.dex-conf[data-s="bad"] { color: var(--dex-bad) }
.dex-conf[data-s="accepted"] { animation: dex-pop .4s var(--dex-ease) backwards; animation-delay: calc(var(--i, 0) * 60ms) }
.dex-type { padding-top: 8px; min-width: 56px; text-align: right; font-size: 12px; line-height: 16px; color: var(--dex-t4) }
.dex-extra { grid-column: 2 / 4; display: grid; grid-template-rows: 0fr; transition: grid-template-rows .36s var(--dex-ease) }
.dex-extra[data-open] { grid-template-rows: 1fr }
.dex-extra > div { min-height: 0; overflow: hidden }
.dex-noteBox { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0 6px 8px }
.dex-noteBox p { flex: 1; margin: 0; font-size: 12px; line-height: 16.8px; color: var(--dex-t2) }
.dex-noteBox[data-bad] p { color: var(--dex-bad) }
.dex-looks { display: inline-flex; align-items: center; gap: 5px; flex: none; height: 26px; padding: 0 10px 0 8px; border-radius: 999px; font-size: 12px; font-weight: 500; background: var(--dex-surface); box-shadow: inset 0 0 0 1px var(--dex-line); transition: background-color .16s }
.dex-looks:hover { background: var(--dex-fill) }
.dex-looks svg { width: 13px; height: 13px }

/* Table field */
.dex-tf { margin-top: 6px; padding: 4px 4px 6px 8px; border-radius: 12px; transition: background-color .2s }
.dex-tf > .dex-tt { display: flex; align-items: center; gap: 8px; min-height: 30px; padding-right: 0 }
.dex-tt b { font-size: 12px; font-weight: 500; color: var(--dex-t2) }
.dex-tt small { font-size: 12px; color: var(--dex-t3) }
.dex-tt .dex-conf { margin-left: auto; padding-top: 0 }
.dex-grid { display: grid; border: 1px solid var(--dex-line); border-radius: 10px; background: var(--dex-surface); overflow: hidden }
.dex-gr { display: grid; grid-template-columns: var(--cols); min-width: 0 }
.dex-gr + .dex-gr { border-top: 1px solid var(--dex-soft) }
.dex-gr[data-link] { background: color-mix(in oklab, var(--g) 9%, transparent) }
.dex-gr[data-head] { background: transparent }
.dex-gr[data-enter] { animation: dex-rowin .5s var(--dex-ease) backwards }
.dex-th { padding: 5px 9px; font-size: 12px; line-height: 17px; color: var(--dex-t3) }
.dex-th[data-r], .dex-cell[data-r] { text-align: right }
.dex-td { padding: 2px; min-width: 0 }
.dex-cell { width: 100%; height: 28px; padding: 0 7px; border: 1px solid transparent; border-radius: 7px; background: transparent; outline: none; font-size: 12px; text-overflow: ellipsis; transition: background-color .16s, border-color .16s }
.dex-cell:hover:not(:focus) { background: var(--dex-fill) }
.dex-cell:focus { background: var(--dex-surface); border-color: color-mix(in oklab, var(--dex-ink) 22%, transparent) }
.dex-cell[aria-invalid="true"] { border-color: color-mix(in oklab, var(--dex-bad) 60%, transparent) }
.dex-empty { padding: 8px 9px; font-size: 12px; color: var(--dex-t3) }

/* JSON + schema */
.dex-code { margin: 10px 0 0; padding: 12px 14px; border-radius: 14px; background: var(--dex-fill); overflow: auto; font: 12px/18px ui-monospace, "SF Mono", Menlo, Consolas, monospace; color: var(--dex-t1); scrollbar-width: thin; animation: dex-fadein .3s var(--dex-ease) backwards }
.dex-code .k { color: var(--dex-t2) }
.dex-code .s { color: oklch(.5 .13 155) }
.dex-code .n { color: oklch(.55 .17 250) }
.dex-code .z { color: var(--dex-t3) }
:is(.dark, [data-theme="dark"]) .dex-code .s { color: oklch(.78 .13 155) }
:is(.dark, [data-theme="dark"]) .dex-code .n { color: oklch(.78 .12 250) }
.dex-sch { margin: 10px 0 0; padding: 0; list-style: none; animation: dex-fadein .3s var(--dex-ease) backwards }
.dex-sch li { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 10px; font-size: 12px; line-height: 16px }
.dex-sch li[data-sub] { padding-left: 32px; color: var(--dex-t2) }
.dex-sch li:hover { background: var(--dex-fill) }
.dex-sch code { font: 12px/16px ui-monospace, "SF Mono", Menlo, Consolas, monospace; color: var(--dex-t1) }
.dex-sch em { margin-left: auto; font-style: normal; color: var(--dex-t3) }
.dex-sch small { font-size: 12px; color: var(--dex-t3) }

/* Footer */
.dex-footer { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 16px; padding: 10px 10px 10px 16px; border-top: 1px solid var(--dex-soft) }
.dex-sum { display: flex; align-items: center; gap: 12px; min-width: 0 }
.dex-bars { display: inline-flex; align-items: flex-end; gap: 3px; height: 18px }
.dex-sbar { width: 4px; height: 3px; border-radius: 2px; background: var(--dex-line); transition: height .5s var(--dex-ease), background-color .3s }
.dex-sbar[data-s="ok"] { background: var(--dex-ok) }
.dex-sbar[data-s="flag"] { background: var(--dex-warn) }
.dex-sumText { display: inline-flex; align-items: center; gap: 10px; margin: 0; color: var(--dex-t2); white-space: nowrap }
.dex-sumText b { font-weight: 500; color: var(--dex-t1); font-variant-numeric: tabular-nums }
.dex-quiet { color: var(--dex-t3) }
.dex-warnChip { display: inline-flex; align-items: center; gap: 5px; color: var(--dex-t1) }
.dex-warnChip svg { width: 14px; height: 14px; color: var(--dex-warn) }
.dex-meta2 { display: inline-flex; align-items: center; gap: 7px; margin: 0 0 0 auto; font-size: 12px; line-height: 17px; color: var(--dex-t3); font-variant-numeric: tabular-nums }
.dex-meta2 .dex-model { color: var(--dex-t2) }
.dex-mark { display: grid; place-items: center; width: 14px; height: 14px; border-radius: 4.5px; background: #d9774f; color: #fff; overflow: hidden }
.dex-mark svg { width: 9px; height: 9px }
.dex-dsep { width: 3px; height: 3px; border-radius: 50%; background: var(--dex-t4) }

@container dex (max-width: 519px) {
  .dex-pages, .dex-model, .dex-meta2 .dex-dsep:first-of-type { display: none }
  .dex-row { grid-template-columns: 70px minmax(0, 1fr) auto }
  .dex-gr { min-width: 360px }
  .dex-grid { overflow-x: auto }
  .dex-meta2 { margin-left: 0 }
  .dex-viewer { flex-basis: 300px }
}

@keyframes dex-pop { from { opacity: 0; transform: translateY(-4px) scale(.97) } }
@keyframes dex-fadein { from { opacity: 0 } }
@keyframes dex-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes dex-scan { from { top: 0; transform: translateY(-100%) } to { top: 100%; transform: translateY(0) } }
@keyframes dex-tint { from { background-color: transparent } }
@keyframes dex-draw { from { stroke-dashoffset: 1 } }
@keyframes dex-glint { from { stroke-dashoffset: .1 } to { stroke-dashoffset: -1 } }
@keyframes dex-rowin { from { opacity: 0; transform: translateY(5px) } }
@keyframes dex-spin { to { transform: rotate(360deg) } }

@media (prefers-reduced-motion: reduce) {
  .dex *, .dex *::before, .dex *::after { animation: none !important; transition: none !important }
  .dex-canvas { scroll-behavior: auto }
  .dex-scan, .dex-link[data-glint] { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                         Values, validation, output                         */
/* -------------------------------------------------------------------------- */

type Row = Record<string, string>

type FieldState = {
  text: string
  rows: Row[]
  confidence: number
  spans: string[]
  rowSpans: string[][]
  note?: string
  edited: boolean
  confirmed: boolean
}

const TYPE_LABEL: Record<ExtractFieldType, string> = { string: "Text", date: "Date", money: "Amount", currency: "Code", iban: "IBAN", integer: "Number", number: "Number", table: "Table" }

const fmtMoney = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function display(v: string | number | null, type: ExtractFieldType): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "number" && type === "money") return fmtMoney(v)
  return String(v)
}

const parseNum = (t: string) => {
  const c = t.replace(/[\s'’,]/g, "")
  return /^-?\d*\.?\d+$/.test(c) ? Number(c) : null
}

function ibanOk(raw: string) {
  const t = raw.replace(/\s+/g, "").toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(t)) return false
  const moved = t.slice(4) + t.slice(0, 4)
  let rem = 0
  for (const ch of moved) {
    const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch
    for (const d of v) rem = (rem * 10 + Number(d)) % 97
  }
  return rem === 1
}

/** Returns a message when the text is not a valid value of this type. Empty text is allowed. */
function validate(text: string, type: ExtractFieldType): string | null {
  const t = text.trim()
  if (!t) return null
  switch (type) {
    case "date": {
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(`${t}T00:00:00Z`)) && new Date(`${t}T00:00:00Z`).toISOString().startsWith(t)
      return ok ? null : "Use the date format YYYY-MM-DD."
    }
    case "money":
    case "number":
      return parseNum(t) === null ? "Enter a number, such as 1,250.00." : null
    case "integer":
      return /^-?\d+$/.test(t.replace(/[\s,]/g, "")) ? null : "Enter a whole number."
    case "currency":
      return /^[A-Za-z]{3}$/.test(t) ? null : "Use a three-letter code, such as CHF."
    case "iban":
      return ibanOk(t) ? null : "This IBAN does not pass its check digits."
    default:
      return null
  }
}

function typedValue(text: string, type: ExtractFieldType): string | number | null {
  const t = text.trim()
  if (!t || validate(t, type)) return null
  switch (type) {
    case "money":
    case "number":
    case "integer":
      return parseNum(t)
    case "currency":
      return t.toUpperCase()
    case "iban":
      return t.replace(/\s+/g, "").toUpperCase()
    default:
      return t
  }
}

function fromEvent(field: ExtractField, e: Extract<ExtractEvent, { type: "value" }>): FieldState {
  const base = { confidence: e.confidence, spans: e.spans ?? [], rowSpans: e.rowSpans ?? [], note: e.note, edited: false, confirmed: false }
  if (field.type === "table") {
    const rows = Array.isArray(e.value) ? e.value : []
    return { ...base, text: "", rows: rows.map((r) => Object.fromEntries((field.columns ?? []).map((c) => [c.key, display(r[c.key] ?? null, c.type)]))) }
  }
  return { ...base, text: Array.isArray(e.value) ? "" : display(e.value, field.type), rows: [] }
}

function fieldErrors(field: ExtractField, st: FieldState): string[] {
  if (field.type === "table") {
    const errs: string[] = []
    st.rows.forEach((r, i) =>
      (field.columns ?? []).forEach((c) => {
        const m = validate(r[c.key] ?? "", c.type)
        if (m) errs.push(`${field.label} row ${i + 1}, ${c.label}: ${m}`)
      }),
    )
    return errs
  }
  const m = validate(st.text, field.type)
  return m ? [`${field.label}: ${m}`] : []
}

function buildOutput(schema: ExtractSchema, fields: Record<string, FieldState>): ExtractOutput {
  const out: ExtractOutput = {}
  for (const f of schema.fields) {
    const st = fields[f.key]
    if (!st) {
      out[f.key] = f.type === "table" ? [] : null
    } else if (f.type === "table") {
      out[f.key] = st.rows.map((r) => Object.fromEntries((f.columns ?? []).map((c) => [c.key, typedValue(r[c.key] ?? "", c.type)])))
    } else out[f.key] = typedValue(st.text, f.type)
  }
  return out
}

function simulate(schema: ExtractSchema, signal: AbortSignal): AsyncIterable<ExtractEvent> {
  return {
    async *[Symbol.asyncIterator]() {
      const wait = (ms: number) =>
        new Promise<void>((res, rej) => {
          if (signal.aborted) return rej(new DOMException("Aborted", "AbortError"))
          const id = window.setTimeout(res, ms)
          signal.addEventListener("abort", () => (window.clearTimeout(id), rej(new DOMException("Aborted", "AbortError"))), { once: true })
        })
      await wait(700)
      let out = 0
      for (const f of schema.fields) {
        await wait(f.type === "table" ? 620 : 300)
        const d = f.demo ?? { value: f.type === "table" ? [] : null, confidence: 0.4, note: "The built-in simulation has no sample value for this field." }
        yield { type: "value", key: f.key, ...d }
        out += f.type === "table" ? 120 : 28
        yield { type: "usage", inputTokens: 2840, outputTokens: out }
      }
    },
  }
}

const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError"

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const join = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ")

function PdfMark({ kind }: { kind?: string }) {
  if (kind === "email") return <Mail className="dex-fileIcon" data-kind="email" strokeWidth={1.6} aria-hidden />
  return (
    <svg className="dex-fileIcon" viewBox="0 0 15 19" fill="none" aria-hidden>
      <path d="M1.5 1h8l4 4v12.5a.5.5 0 0 1-.5.5h-11.5a.5.5 0 0 1-.5-.5v-16a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9.5 1v4h4" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3" y="10" width="7" height="4" rx="1" fill="currentColor" />
    </svg>
  )
}

function Rich({ r, info }: { r: DocRich; info: (id: string) => SpanInfo | undefined }) {
  if (typeof r === "string") return <>{r}</>
  return (
    <>
      {r.map((p, i) => {
        if (typeof p === "string") return <React.Fragment key={i}>{p}</React.Fragment>
        const si = info(p.id)
        return (
          <span
            key={i}
            className="dex-span"
            data-span={p.id}
            data-on={si?.on ? "" : undefined}
            data-flag={si?.flag ? "" : undefined}
            data-active={si?.active ? "" : undefined}
            style={si?.color ? ({ "--g": si.color } as React.CSSProperties) : undefined}
          >
            {p.text}
          </span>
        )
      })}
    </>
  )
}

type SpanInfo = { on: boolean; flag: boolean; active: boolean; color: string }

function DocPage({ doc, info }: { doc: SourceDocument; info: (id: string) => SpanInfo | undefined }) {
  return (
    <>
      {doc.blocks.map((b, i) => {
        switch (b.type) {
          case "masthead":
            return (
              <div key={i} className="dex-mast">
                <span className="dex-brand">
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden><path d="M8 1.5 14 13H2L8 1.5Z" opacity=".85" /><path d="M8 6.5 11 13H5l3-6.5Z" opacity=".5" /></svg>
                  {b.brand}
                </span>
                <span className="dex-docTitle">{b.title}</span>
              </div>
            )
          case "mailhead":
            return (
              <div key={i} className="dex-mailhead">
                {b.rows.map((r, ri) => (
                  <div key={ri}>
                    <small>{r.label}</small>
                    <span><Rich r={r.value} info={info} /></span>
                  </div>
                ))}
              </div>
            )
          case "columns":
            return (
              <div key={i} className="dex-cols">
                {b.columns.map((c, ci) => (
                  <div key={ci}>
                    <small>{c.label}</small>
                    {c.lines.map((l, li) => <div key={li}><Rich r={l} info={info} /></div>)}
                  </div>
                ))}
              </div>
            )
          case "meta":
            return (
              <dl key={i} className="dex-meta">
                {b.items.map((it, ii) => (
                  <div key={ii}>
                    <small>{it.label}</small>
                    <dd><Rich r={it.value} info={info} /></dd>
                  </div>
                ))}
              </dl>
            )
          case "table":
            return (
              <table key={i} className="dex-pt">
                <thead>
                  <tr>{b.head.map((h, hi) => <th key={hi} data-r={(h.align ?? (hi > 0 ? "right" : "left")) === "right" ? "" : undefined} style={hi > 0 ? { textAlign: "right" } : undefined}>{h.text}</th>)}</tr>
                </thead>
                <tbody>
                  {b.rows.map((r, ri) => (
                    <tr key={ri}>
                      {r.cells.map((c, ci) => (
                        <td key={ci} data-r={ci > 0 ? "" : undefined}>
                          <Rich r={c} info={info} />
                          {ci === 0 && r.sub && <small>{r.sub}</small>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          case "totals":
            return (
              <div key={i} className="dex-tot">
                {b.rows.map((r, ri) => (
                  <div key={ri} data-strong={r.strong ? "" : undefined}>
                    <span><Rich r={r.label} info={info} /></span>
                    <span><Rich r={r.value} info={info} /></span>
                  </div>
                ))}
              </div>
            )
          case "heading":
            return <p key={i} className="dex-h">{b.text}</p>
          case "pairs":
            return (
              <dl key={i} className="dex-pairs">
                {b.rows.map((r, ri) => (
                  <React.Fragment key={ri}>
                    <dt>{r.label}</dt>
                    <dd><Rich r={r.value} info={info} /></dd>
                  </React.Fragment>
                ))}
              </dl>
            )
          case "text":
            return <p key={i} className={b.muted ? "dex-note" : "dex-p"}><Rich r={b.text} info={info} /></p>
          case "footer":
            return <p key={i} className="dex-foot">{b.text}</p>
        }
      })}
    </>
  )
}

function JsonView({ value }: { value: unknown }) {
  const lines = JSON.stringify(value, null, 2).split("\n")
  return (
    <pre className="dex-code" tabIndex={0} aria-label="Extracted JSON">
      <code>
        {lines.map((line, i) => {
          const parts: React.ReactNode[] = []
          const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(null|true|false)\b/g
          let last = 0
          let m: RegExpExecArray | null
          while ((m = re.exec(line))) {
            if (m.index > last) parts.push(line.slice(last, m.index))
            if (m[1]) parts.push(m[2] ? <span key={m.index} className="k">{m[1]}</span> : <span key={m.index} className="s">{m[1]}</span>)
            if (m[2]) parts.push(m[2])
            if (m[3]) parts.push(<span key={m.index} className="n">{m[3]}</span>)
            if (m[4]) parts.push(<span key={m.index} className="z">{m[4]}</span>)
            last = m.index + m[0].length
          }
          parts.push(line.slice(last))
          return <div key={i}>{parts}</div>
        })}
      </code>
    </pre>
  )
}

/* -------------------------------------------------------------------------- */
/*                               DocumentExtract                              */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "running" | "done" | "stopped" | "error"
type Link = { key: string; row: number | null } | null
type Line = { d: string; color: string; x1: number; y1: number; x2: number; y2: number } | null

const BASE_W = 640

export function DocumentExtract({
  document: docProp,
  schema: schemaProp,
  samples: samplesProp,
  extract,
  onAccept,
  model = DEFAULT_MODEL,
  modelMark,
  reviewThreshold = 0.8,
  className,
}: DocumentExtractProps) {
  const uid = React.useId()
  const samples = React.useMemo(
    () => (docProp ? [{ document: docProp, schema: schemaProp ?? invoiceSchema }] : samplesProp && samplesProp.length ? samplesProp : sampleDocuments),
    [docProp, schemaProp, samplesProp],
  )
  const [idx, setIdx] = React.useState(0)
  const cur = samples[Math.min(idx, samples.length - 1)]
  const doc = cur.document
  const schema = cur.schema
  const groupOf = React.useCallback((id?: string) => schema.groups?.find((g) => g.id === id), [schema])

  const [phase, setPhase] = React.useState<Phase>("idle")
  const [fields, setFields] = React.useState<Record<string, FieldState>>({})
  const [order, setOrder] = React.useState<string[]>([])
  const [usage, setUsage] = React.useState({ inp: 0, out: 0 })
  const [elapsed, setElapsed] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<"fields" | "json" | "schema">("fields")
  const [selected, setSelected] = React.useState<Link>(null)
  const [hover, setHover] = React.useState<Link>(null)
  const [line, setLine] = React.useState<Line>(null)
  const [zoom, setZoom] = React.useState(1)
  const [fit, setFit] = React.useState(true)
  const [canvasW, setCanvasW] = React.useState(0)
  const [pageH, setPageH] = React.useState(1000)
  const [menu, setMenu] = React.useState(false)
  const [accept, setAccept] = React.useState<"idle" | "accepting" | "accepted">("idle")
  const [announce, setAnnounce] = React.useState("")

  const abortRef = React.useRef<AbortController | null>(null)
  const startRef = React.useRef(0)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const pageRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const menuBtn = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const rafRef = React.useRef(0)
  const linkRef = React.useRef<Link>(null)
  const extractRef = React.useRef(extract)
  const onAcceptRef = React.useRef(onAccept)
  const fieldsRef = React.useRef(fields)
  React.useEffect(() => {
    extractRef.current = extract
    onAcceptRef.current = onAccept
    fieldsRef.current = fields
  })

  const linked = hover ?? selected
  React.useEffect(() => {
    linkRef.current = linked
  })

  const fieldDef = React.useMemo(() => Object.fromEntries(schema.fields.map((f) => [f.key, f])), [schema])
  const zoomEff = fit ? Math.min(1.6, Math.max(0.4, (canvasW - 28) / BASE_W || 1)) : zoom

  /* Measure canvas + page */
  React.useLayoutEffect(() => {
    const c = canvasRef.current
    const p = pageRef.current
    if (!c || !p) return
    const ro = new ResizeObserver(() => {
      setCanvasW(c.clientWidth)
      setPageH(p.offsetHeight)
    })
    ro.observe(c)
    ro.observe(p)
    return () => ro.disconnect()
  }, [doc])

  /* Connecting line */
  const recompute = React.useCallback(() => {
    const body = bodyRef.current
    const canvas = canvasRef.current
    const l = linkRef.current
    if (!body || !canvas || !l) return setLine(null)
    const f = fieldsRef.current[l.key]
    if (!f) return setLine(null)
    const br = body.getBoundingClientRect()
    if (br.width < 760) return setLine(null)
    const spanId = l.row !== null ? f.rowSpans[l.row]?.[0] : f.spans[0]
    const src = spanId ? canvas.querySelector<HTMLElement>(`[data-span="${spanId}"]`) : null
    const dst = inputRefs.current[l.row !== null ? `${l.key}:${l.row}` : l.key]
    const scroller = scrollRef.current
    if (!src || !dst || !scroller) return setLine(null)
    const sr = src.getBoundingClientRect()
    const dr = dst.getBoundingClientRect()
    const cr = canvas.getBoundingClientRect()
    const fr = scroller.getBoundingClientRect()
    const inView = (r: DOMRect, box: DOMRect) => r.bottom > box.top + 2 && r.top < box.bottom - 2 && r.right > box.left && r.left < box.right
    if (!inView(sr, cr) || !inView(dr, fr)) return setLine(null)
    const x1 = Math.min(sr.right, cr.right - 2) - br.left + 2
    const y1 = sr.top + sr.height / 2 - br.top
    const x2 = dr.left - br.left - 2
    const y2 = dr.top + dr.height / 2 - br.top
    const mx = (x1 + x2) / 2
    const color = groupOf(fieldDef[l.key]?.group)?.color ?? "var(--dex-accent)"
    setLine({ d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, color, x1, y1, x2, y2 })
  }, [fieldDef, groupOf])
  const schedule = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(recompute)
  }, [recompute])
  React.useEffect(() => {
    schedule()
    return () => cancelAnimationFrame(rafRef.current)
  }, [linked, tab, schedule, fields])
  React.useEffect(() => {
    // Follow the page while it zooms (it eases for about 400 ms).
    let id = 0
    const t0 = performance.now()
    const tick = () => {
      recompute()
      if (performance.now() - t0 < 460) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [zoomEff, recompute])
  React.useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const ro = new ResizeObserver(() => schedule())
    ro.observe(el)
    return () => ro.disconnect()
  }, [schedule])

  /* Timer */
  React.useEffect(() => {
    if (phase !== "running") return
    const id = window.setInterval(() => setElapsed((performance.now() - startRef.current) / 1000), 100)
    return () => window.clearInterval(id)
  }, [phase])

  /* Menu: close on outside press */
  React.useEffect(() => {
    if (!menu) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || menuBtn.current?.contains(t)) return
      setMenu(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [menu])
  React.useEffect(() => {
    if (menu) menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"]')?.focus()
  }, [menu])
  React.useEffect(() => () => abortRef.current?.abort(), [])

  const reset = React.useCallback(() => {
    abortRef.current?.abort()
    setPhase("idle")
    setFields({})
    setOrder([])
    setUsage({ inp: 0, out: 0 })
    setElapsed(0)
    setError(null)
    setSelected(null)
    setHover(null)
    setAccept("idle")
  }, [])

  const switchDoc = (i: number) => {
    setMenu(false)
    menuBtn.current?.focus()
    if (i === idx) return
    setIdx(i)
    reset()
    setAnnounce(`Opened ${samples[i].document.name}.`)
  }

  const start = async () => {
    abortRef.current?.abort()
    const ctl = new AbortController()
    abortRef.current = ctl
    setPhase("running")
    setFields({})
    setOrder([])
    setUsage({ inp: 0, out: 0 })
    setError(null)
    setAccept("idle")
    setSelected(null)
    setElapsed(0)
    startRef.current = performance.now()
    setAnnounce(`Reading ${doc.name}.`)
    let filled = 0
    let flagged = 0
    try {
      const res = extractRef.current ? extractRef.current(doc, schema, { signal: ctl.signal }) : simulate(schema, ctl.signal)
      const handle = (e: ExtractEvent) => {
        if (e.type === "value") {
          const def = schema.fields.find((f) => f.key === e.key)
          if (!def) return
          const st = fromEvent(def, e)
          filled++
          if (e.confidence < reviewThreshold) flagged++
          setFields((p) => ({ ...p, [e.key]: st }))
          setOrder((o) => (o.includes(e.key) ? o : [...o, e.key]))
          if (filled % 3 === 0 && filled < schema.fields.length) setAnnounce(`${filled} of ${schema.fields.length} fields read.`)
        } else if (e.type === "usage") setUsage({ inp: e.inputTokens, out: e.outputTokens })
        else if (e.type === "error") throw new Error(e.message)
      }
      if (Symbol.asyncIterator in (res as object)) {
        for await (const e of res as AsyncIterable<ExtractEvent>) {
          if (ctl.signal.aborted) return
          handle(e)
        }
      } else {
        for (const e of await (res as Promise<ExtractEvent[]>)) {
          if (ctl.signal.aborted) return
          handle(e)
          await new Promise((r) => setTimeout(r, 160))
        }
      }
      if (ctl.signal.aborted) return
      setElapsed((performance.now() - startRef.current) / 1000)
      setPhase("done")
      setAnnounce(flagged ? `Done. ${flagged} ${flagged === 1 ? "field needs" : "fields need"} a check.` : "Done. All fields look right.")
    } catch (e) {
      if (isAbort(e) || ctl.signal.aborted) return
      setPhase("error")
      setError(e instanceof Error ? e.message : "The extraction failed.")
      setAnnounce("Extraction failed.")
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    setPhase("stopped")
    setElapsed((performance.now() - startRef.current) / 1000)
    setAnnounce("Extraction stopped.")
  }

  /* Derived state */
  const flaggedKeys = order.filter((k) => {
    const st = fields[k]
    return st && !st.edited && !st.confirmed && st.confidence < reviewThreshold
  })
  const allErrors = schema.fields.flatMap((f) => (fields[f.key] ? fieldErrors(f, fields[f.key]) : []))
  const filledCount = Object.keys(fields).length
  const avg = filledCount ? Math.round((Object.values(fields).reduce((n, f) => n + f.confidence, 0) / filledCount) * 100) : 0
  const cost = (usage.inp * model.inputPrice + usage.out * model.outputPrice) / 1e6
  const canAccept = phase === "done" && allErrors.length === 0 && accept === "idle"
  const output = React.useMemo(() => buildOutput(schema, fields), [schema, fields])

  const spanMap = React.useMemo(() => {
    const map = new Map<string, SpanInfo>()
    for (const f of schema.fields) {
      const st = fields[f.key]
      if (!st) continue
      const color = groupOf(f.group)?.color ?? "var(--dex-accent)"
      const flag = !st.edited && !st.confirmed && st.confidence < reviewThreshold
      const ids = [...st.spans, ...st.rowSpans.flat()]
      for (const id of ids) map.set(id, { on: true, flag, active: false, color })
      if (linked && linked.key === f.key) {
        const act = linked.row !== null ? (st.rowSpans[linked.row] ?? []) : [...st.spans, ...(st.rowSpans.length && linked.row === null ? st.rowSpans.flat() : [])]
        for (const id of act) {
          const prev = map.get(id)
          if (prev) map.set(id, { ...prev, active: true })
        }
      }
    }
    return map
  }, [schema, fields, linked, groupOf, reviewThreshold])
  const info = React.useCallback((id: string) => spanMap.get(id), [spanMap])

  /* Editing */
  const edit = (key: string, text: string) => {
    setAccept("idle")
    setFields((p) => ({ ...p, [key]: { ...p[key], text, edited: true } }))
  }
  const editCell = (key: string, row: number, col: string, text: string) => {
    setAccept("idle")
    setFields((p) => {
      const f = p[key]
      const rows = f.rows.map((r, i) => (i === row ? { ...r, [col]: text } : r))
      return { ...p, [key]: { ...f, rows, edited: true } }
    })
  }
  const confirm = (key: string) => {
    setFields((p) => ({ ...p, [key]: { ...p[key], confirmed: true } }))
    setAnnounce(`${fieldDef[key].label} marked as correct.`)
  }

  const reveal = (key: string, row: number | null) => {
    const f = fieldsRef.current[key]
    const id = f ? (row !== null ? f.rowSpans[row]?.[0] : f.spans[0]) : undefined
    const canvas = canvasRef.current
    const el = id && canvas ? canvas.querySelector<HTMLElement>(`[data-span="${id}"]`) : null
    if (!el || !canvas) return
    const cr = canvas.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    canvas.scrollTo({ top: canvas.scrollTop + (er.top - cr.top) - cr.height / 2 + er.height / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }
  const focusField = (key: string, row: number | null) => {
    setSelected({ key, row })
    reveal(key, row)
  }

  const review = () => {
    const next = flaggedKeys[0]
    if (!next) return
    setTab("fields")
    const el = inputRefs.current[next]
    el?.scrollIntoView({ block: "center", behavior: "smooth" })
    ;(el as HTMLInputElement | null)?.focus({ preventScroll: true })
  }

  const doAccept = async () => {
    if (!canAccept) return
    setAccept("accepting")
    setAnnounce("Accepting all fields.")
    const values = Object.fromEntries(schema.fields.map((f) => [f.key, output[f.key] as ExtractValue]))
    try {
      if (onAcceptRef.current) await onAcceptRef.current(output, { document: doc, schema, values })
      else await new Promise((r) => setTimeout(r, 900))
      setAccept("accepted")
      setAnnounce("All fields accepted.")
    } catch (e) {
      setAccept("idle")
      setAnnounce(`Could not accept: ${e instanceof Error ? e.message : "the hand-off failed"}.`)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (menu) {
        setMenu(false)
        menuBtn.current?.focus()
      } else if (phase === "running") stop()
      else if (selected) setSelected(null)
    }
  }

  const stepZoom = (d: number) => {
    setFit(false)
    setZoom(Math.min(2, Math.max(0.5, Math.round((zoomEff + d) * 10) / 10)))
  }
  const onPageKey = (e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault()
      stepZoom(0.1)
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault()
      stepZoom(-0.1)
    } else if (e.key === "0") {
      e.preventDefault()
      setFit(true)
    }
  }

  const tabs = [
    { id: "fields", label: "Fields" },
    { id: "json", label: "JSON" },
    { id: "schema", label: "Schema" },
  ] as const
  const selectTab = (id: (typeof tabs)[number]["id"]) => {
    setTab(id)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === tab)
    let n = -1
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length
    if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length
    if (e.key === "Home") n = 0
    if (e.key === "End") n = tabs.length - 1
    if (n < 0) return
    e.preventDefault()
    selectTab(tabs[n].id)
    tabRefs.current[n]?.focus()
  }

  const running = phase === "running"
  const done = phase === "done" || phase === "stopped"
  const statusNode = (() => {
    if (running) return { tone: "busy", icon: null, text: <><span className="dex-shimmer" data-text="Reading the document">Reading the document</span> <span style={{ color: "var(--dex-t3)" }}>· {filledCount} of {schema.fields.length} fields</span></> }
    if (phase === "error") return { tone: "bad", icon: <TriangleAlert aria-hidden />, text: <>Extraction failed{error ? `: ${error}` : ""}</> }
    if (phase === "stopped") return { tone: "", icon: <Square aria-hidden />, text: `Stopped after ${filledCount} of ${schema.fields.length} fields` }
    if (phase === "done" && allErrors.length) return { tone: "bad", icon: <TriangleAlert aria-hidden />, text: allErrors.length === 1 ? allErrors[0] : `${allErrors.length} values are invalid. Fix them to accept.` }
    if (phase === "done" && flaggedKeys.length) return { tone: "warn", icon: <TriangleAlert aria-hidden />, text: `${flaggedKeys.length} ${flaggedKeys.length === 1 ? "field needs" : "fields need"} a check`, action: true }
    if (phase === "done") return { tone: "ok", icon: <Check aria-hidden />, text: accept === "accepted" ? "All fields accepted" : "All fields look right" }
    return { tone: "", icon: null, text: `${schema.fields.length} fields to fill from this document` }
  })()

  const sizerW = BASE_W * zoomEff
  const sizerH = pageH * zoomEff
  const segIdx = tabs.findIndex((t) => t.id === tab)

  const hasMenu = samples.length > 1
  const sorted = schema.fields

  return (
    <section className={join("dex", className)} aria-label={`Document extraction: ${doc.name}`} onKeyDown={onKeyDown}>
      <style href="document-extract" precedence="default">{CSS}</style>

      <div ref={bodyRef} className="dex-body">
        {/* Viewer */}
        <section className="dex-viewer" aria-label="Document viewer">
          <div className="dex-bar">
            <div className="dex-menuWrap">
              {hasMenu ? (
                <button ref={menuBtn} type="button" className="dex-file" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)} aria-label={`File: ${doc.name}. Choose another document`}>
                  <PdfMark kind={doc.kind} />
                  <span className="dex-fileName">{doc.name}</span>
                  <ChevronDown aria-hidden />
                </button>
              ) : (
                <span className="dex-file" data-static="">
                  <PdfMark kind={doc.kind} />
                  <span className="dex-fileName">{doc.name}</span>
                </span>
              )}
              {menu && (
                <div ref={menuRef} className="dex-menu" role="menu" aria-label="Documents" onKeyDown={(e) => {
                  const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
                  const i = items.indexOf(document.activeElement as HTMLElement)
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault()
                    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus()
                  }
                }}>
                  {samples.map((sm, i) => (
                    <button key={sm.document.id} type="button" role="menuitemradio" aria-checked={i === idx} className="dex-item" onClick={() => switchDoc(i)}>
                      <PdfMark kind={sm.document.kind} />
                      <span><span style={{ fontWeight: 500 }}>{sm.document.name}</span>{sm.document.label && <small>{sm.document.label}</small>}</span>
                      {i === idx && <Check aria-hidden />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="dex-tools">
              <span className="dex-pages" aria-label="Page 1 of 1">1 / 1</span>
              <span className="dex-zoom" role="group" aria-label="Zoom">
                <button type="button" className="dex-tool" aria-label="Zoom out" disabled={zoomEff <= 0.5} onClick={() => stepZoom(-0.1)}><Minus aria-hidden /></button>
                <span className="dex-tool" data-value="" aria-hidden>{Math.round(zoomEff * 100)}%</span>
                <button type="button" className="dex-tool" aria-label="Zoom in" disabled={zoomEff >= 2} onClick={() => stepZoom(0.1)}><Plus aria-hidden /></button>
              </span>
              <button type="button" className="dex-fit" aria-pressed={fit} onClick={() => setFit(true)} aria-label="Fit to width"><span className="dex-fitLabel">Fit</span><span className="dex-sr">Fit to width</span></button>
            </div>
          </div>
          <div className="dex-stage">
            {running && <span className="dex-scan" aria-hidden />}
            <div ref={canvasRef} className="dex-canvas" onScroll={schedule} tabIndex={0} role="region" aria-label={`${doc.name}, zoom ${Math.round(zoomEff * 100)} percent. Plus and minus change the zoom, zero fits the width.`} onKeyDown={onPageKey}>
              <div className="dex-sizer" style={{ width: sizerW, height: sizerH }}>
                <div ref={pageRef} className="dex-page" style={{ transform: `scale(${zoomEff})` }}>
                  <DocPage doc={doc} info={info} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <div className="dex-form">
          <div className="dex-formHead">
            <div className="dex-seg" role="tablist" aria-label="Output" onKeyDown={onTabKey}>
              <span className="dex-segHl" aria-hidden style={{ width: `calc((100% - 6px - 4px) / 3)`, transform: `translateX(calc(${segIdx} * (100% + 2px) + 3px))` }} />
              {tabs.map((t, i) => (
                <button key={t.id} ref={(el) => void (tabRefs.current[i] = el)} type="button" role="tab" id={`${uid}-t-${t.id}`} aria-selected={tab === t.id} aria-controls={`${uid}-p`} tabIndex={tab === t.id ? 0 : -1} className="dex-segBtn" onClick={() => selectTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <button type="button" className="dex-btn" data-kind={running ? "secondary" : "primary"} onClick={running ? stop : start} aria-label={running ? "Stop extraction" : done || phase === "error" ? "Extract again" : "Extract"}>
              <span data-off={running ? "" : undefined} aria-hidden>
                {done || phase === "error" ? <RotateCcw /> : <Sparkles />}
                {done || phase === "error" ? "Extract again" : "Extract"}
              </span>
              <span data-off={running ? undefined : ""} aria-hidden><Square fill="currentColor" style={{ width: 11, height: 11 }} />Stop</span>
            </button>
          </div>

          <div ref={scrollRef} className="dex-scroll" id={`${uid}-p`} role="tabpanel" aria-labelledby={`${uid}-t-${tab}`} onScroll={schedule}>
            <div className="dex-status" data-tone={statusNode.tone}>
              {statusNode.icon}
              <span>{statusNode.text}</span>
              {"action" in statusNode && statusNode.action && (
                <button type="button" className="dex-pill" onClick={review}>Review</button>
              )}
            </div>

            {tab === "fields" && (
              <div className="dex-groups">
                {(schema.groups ?? [{ id: "", label: schema.name, color: "var(--dex-accent)" }]).map((g) => {
                  const gf = sorted.filter((f) => (f.group ?? "") === g.id || (!schema.groups && true))
                  if (!gf.length) return null
                  return (
                    <section key={g.id} aria-labelledby={`${uid}-g-${g.id}`} style={{ "--g": g.color } as React.CSSProperties}>
                      {gf.some((f) => f.type !== "table") && (
                        <h3 id={`${uid}-g-${g.id}`} className="dex-gh"><span className="dex-dot2" aria-hidden />{g.label}</h3>
                      )}
                      {gf.map((f) =>
                        f.type === "table" ? (
                          <TableField key={f.key} field={f} st={fields[f.key]} running={running} threshold={reviewThreshold} link={linked?.key === f.key ? linked.row : undefined} accepted={accept !== "idle"} order={order.indexOf(f.key)}
                            reg={(k, el) => void (inputRefs.current[k] = el)} onFocus={(row) => focusField(f.key, row)} onBlur={() => setSelected(null)} onHover={(row) => setHover(row === undefined ? null : { key: f.key, row })} onEdit={(r, c, v) => editCell(f.key, r, c, v)} />
                        ) : (
                          <ScalarRow key={f.key} field={f} st={fields[f.key]} running={running} threshold={reviewThreshold} link={linked?.key === f.key} accepted={accept !== "idle"} order={order.indexOf(f.key)}
                            reg={(el) => void (inputRefs.current[f.key] = el)} onFocus={() => focusField(f.key, null)} onBlur={() => setSelected(null)} onHover={(on) => setHover(on ? { key: f.key, row: null } : null)} onEdit={(v) => edit(f.key, v)} onConfirm={() => confirm(f.key)} />
                        ),
                      )}
                    </section>
                  )
                })}
              </div>
            )}
            {tab === "json" && <JsonView value={output} />}
            {tab === "schema" && (
              <ul className="dex-sch" aria-label={`${schema.name} schema`}>
                {schema.fields.map((f) => (
                  <React.Fragment key={f.key}>
                    <li style={{ "--g": groupOf(f.group)?.color } as React.CSSProperties}>
                      <span className="dex-dot2" aria-hidden />
                      <code>{f.key}</code>
                      <small>{f.label}</small>
                      <em>{f.type === "table" ? "array" : f.type}</em>
                    </li>
                    {f.columns?.map((c) => (
                      <li key={c.key} data-sub="">
                        <code>{c.key}</code>
                        <small>{c.label}</small>
                        <em>{c.type}</em>
                      </li>
                    ))}
                  </React.Fragment>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* The line that joins a value to the text it came from */}
        <svg className="dex-links" aria-hidden>
          {line && (
            <g key={`${linked?.key}-${linked?.row}`} style={{ color: line.color }}>
              <path className="dex-link" data-base="" pathLength={1} d={line.d} stroke="currentColor" />
              <path className="dex-link" data-glint="" pathLength={1} d={line.d} />
              <circle className="dex-dot" cx={line.x1} cy={line.y1} r="2.5" fill="currentColor" />
              <circle className="dex-dot" cx={line.x2} cy={line.y2} r="2.5" fill="currentColor" />
            </g>
          )}
        </svg>
      </div>

      <footer className="dex-footer">
        <div className="dex-sum">
          <span className="dex-bars" aria-hidden>
            {schema.fields.map((f, i) => {
              const st = fields[f.key]
              const flag = st && !st.edited && !st.confirmed && st.confidence < reviewThreshold
              return <i key={f.key} className="dex-sbar" data-s={!st ? undefined : flag ? "flag" : "ok"} style={st ? { height: 4 + Math.round(st.confidence * 13), transitionDelay: `${i * 20}ms` } : undefined} />
            })}
          </span>
          <p className="dex-sumText">
            {filledCount === 0 ? (
              <span className="dex-quiet">{running ? "Reading…" : "No values yet"}</span>
            ) : (
              <>
                <span><b>{avg}%</b> average</span>
                {flaggedKeys.length > 0 && <span className="dex-warnChip"><TriangleAlert aria-hidden />{flaggedKeys.length} to check</span>}
              </>
            )}
          </p>
        </div>
        <p className="dex-meta2">
          <span className="dex-mark" aria-hidden>{modelMark ?? <Sparkles />}</span>
          <span className="dex-model">{model.name}</span>
          <span className="dex-dsep" aria-hidden />
          <span>${cost.toFixed(4)}</span>
          <span className="dex-dsep" aria-hidden />
          <span>{elapsed.toFixed(1)} s</span>
        </p>
        <button type="button" className="dex-btn" data-kind="primary" disabled={!canAccept && accept !== "accepting"} onClick={doAccept} aria-disabled={!canAccept} title={allErrors.length ? "Fix the invalid values first" : undefined}>
          <span data-off={accept === "idle" ? undefined : ""}>Accept all</span>
          <span data-off={accept === "idle" ? "" : undefined}>{accept === "accepting" ? <><Play style={{ width: 11, height: 11 }} aria-hidden />Saving</> : <><Check aria-hidden />Accepted</>}</span>
        </button>
      </footer>

      <p className="dex-sr" role="status" aria-live="polite">{announce}</p>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Form pieces                                 */
/* -------------------------------------------------------------------------- */

type Common = { threshold: number; running: boolean; accepted: boolean; order: number }

function confState(st: FieldState, threshold: number, invalid: boolean, accepted: boolean) {
  if (invalid) return "bad"
  if (accepted) return "accepted"
  if (st.edited) return "edited"
  if (st.confirmed) return "ok"
  return st.confidence < threshold ? "flag" : "plain"
}

function Conf({ st, threshold, invalid, accepted, order }: { st: FieldState; threshold: number; invalid: boolean; accepted: boolean; order: number }) {
  const s = confState(st, threshold, invalid, accepted)
  const pct = Math.round(st.confidence * 100)
  return (
    <span className="dex-conf" data-s={s} style={{ "--i": order } as React.CSSProperties}>
      {s === "flag" && <TriangleAlert aria-hidden />}
      {s === "edited" && <Pencil aria-hidden />}
      {(s === "ok" || s === "accepted") && <Check aria-hidden />}
      {s === "bad" && <TriangleAlert aria-hidden />}
      <span aria-hidden>{s === "edited" ? "Edited" : s === "bad" ? "Invalid" : `${pct}%`}</span>
      <span className="dex-sr">
        {s === "flag" ? `Low confidence, ${pct} percent, check this value` : s === "edited" ? "Edited by you" : s === "bad" ? "Invalid value" : s === "accepted" ? `Accepted, confidence ${pct} percent` : s === "ok" ? `Checked, confidence ${pct} percent` : `Confidence ${pct} percent`}
      </span>
    </span>
  )
}

function ScalarRow({
  field,
  st,
  running,
  threshold,
  link,
  accepted,
  order,
  reg,
  onFocus,
  onBlur,
  onHover,
  onEdit,
  onConfirm,
}: Common & {
  field: ExtractField
  st: FieldState | undefined
  link: boolean
  reg: (el: HTMLInputElement | null) => void
  onFocus: () => void
  onBlur: () => void
  onHover: (on: boolean) => void
  onEdit: (v: string) => void
  onConfirm: () => void
}) {
  const id = React.useId()
  const err = st ? validate(st.text, field.type) : null
  const flag = !!st && !st.edited && !st.confirmed && st.confidence < threshold
  const note = err ?? (flag ? st?.note : undefined)
  return (
    <div className="dex-row" data-link={link ? "" : undefined} onMouseEnter={() => st && onHover(true)} onMouseLeave={() => onHover(false)}>
      <label className="dex-rl" htmlFor={id}>{field.label}</label>
      {st ? (
        <input
          ref={reg}
          id={id}
          className="dex-in"
          value={st.text}
          data-flag={flag ? "" : undefined}
          aria-invalid={err ? true : undefined}
          aria-describedby={note ? `${id}-note` : undefined}
          inputMode={field.type === "money" || field.type === "number" || field.type === "integer" ? "decimal" : undefined}
          onChange={(e) => onEdit(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      ) : (
        <span className="dex-skel" data-busy={running ? "" : undefined} aria-hidden />
      )}
      {st ? <Conf st={st} threshold={threshold} invalid={!!err} accepted={accepted} order={order} /> : <span className="dex-type">{TYPE_LABEL[field.type]}</span>}
      <div className="dex-extra" data-open={note ? "" : undefined}>
        <div>
          {note && (
            <div className="dex-noteBox" data-bad={err ? "" : undefined}>
              <p id={`${id}-note`}>{note}</p>
              {flag && !err && (
                <button type="button" className="dex-looks" onClick={onConfirm}>
                  <Check aria-hidden />
                  Looks right
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TableField({
  field,
  st,
  running,
  threshold,
  link,
  accepted,
  order,
  reg,
  onFocus,
  onBlur,
  onHover,
  onEdit,
}: Common & {
  field: ExtractField
  st: FieldState | undefined
  link: number | null | undefined
  reg: (key: string, el: HTMLElement | null) => void
  onFocus: (row: number) => void
  onBlur: () => void
  onHover: (row: number | undefined) => void
  onEdit: (row: number, col: string, v: string) => void
}) {
  const cols = field.columns ?? []
  const track = (c: ExtractColumn, i: number) => (i === 0 ? "minmax(0, 2fr)" : c.type === "money" ? "minmax(72px, 1fr)" : "minmax(40px, .6fr)")
  const cellVars = { "--cols": cols.map(track).join(" ") } as React.CSSProperties
  const invalid = st ? fieldErrors(field, st).length > 0 : false
  return (
    <div className="dex-tf" data-link={link !== undefined ? "" : undefined}>
      <div className="dex-tt">
        <b id={`tf-${field.key}`}>{field.label}</b>
        {st && <small>{st.rows.length} {st.rows.length === 1 ? "row" : "rows"}</small>}
        {st ? <Conf st={st} threshold={threshold} invalid={invalid} accepted={accepted} order={order} /> : <span className="dex-type" style={{ marginLeft: "auto", padding: 0 }}>{TYPE_LABEL.table}</span>}
      </div>
      <div className="dex-grid" role="group" aria-labelledby={`tf-${field.key}`} style={cellVars}>
        <div className="dex-gr" data-head="">
          {cols.map((c, ci) => <span key={c.key} className="dex-th" data-r={ci > 0 ? "" : undefined}>{c.label}</span>)}
        </div>
        {!st || st.rows.length === 0 ? (
          <div className="dex-empty">{running ? "Reading rows…" : "No rows yet"}</div>
        ) : (
          st.rows.map((row, ri) => (
            <div
              key={ri}
              ref={(el) => reg(`${field.key}:${ri}`, el)}
              className="dex-gr"
              data-link={link === ri ? "" : undefined}
              data-enter=""
              style={{ animationDelay: `${ri * 70}ms` }}
              onMouseEnter={() => onHover(ri)}
              onMouseLeave={() => onHover(undefined)}
            >
              {cols.map((c, ci) => {
                const m = validate(row[c.key] ?? "", c.type)
                return (
                  <span key={c.key} className="dex-td">
                    <input
                      className="dex-cell"
                      data-r={ci > 0 ? "" : undefined}
                      value={row[c.key] ?? ""}
                      aria-label={`${field.label}, row ${ri + 1}, ${c.label}${flagLabel(st, threshold)}`}
                      aria-invalid={m ? true : undefined}
                      onChange={(e) => onEdit(ri, c.key, e.target.value)}
                      onFocus={() => onFocus(ri)}
                      onBlur={onBlur}
                    />
                  </span>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const flagLabel = (st: FieldState, threshold: number) => (!st.edited && !st.confirmed && st.confidence < threshold ? ", needs a check" : "")

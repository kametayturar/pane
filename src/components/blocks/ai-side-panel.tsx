"use client"

import * as React from "react"
import { ArrowUp, Check, PanelRight, RotateCw, Sparkles, Square, TextSelect, TriangleAlert, Undo2, X, FileText } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PanelBlock =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "paragraph"; text: string; /** Short name shown on the change card, e.g. "Intro". */ label?: string }
  | { id: string; type: "table"; columns: string[]; rows: string[][]; label?: string }

export type PanelPage = { title: string; meta?: string; blocks: PanelBlock[] }

/** A passage the person selected in the page and sent over as context. */
export type PanelSelection = { blockId: string; label: string; text: string }

export type PanelChange = { blockId: string; /** The block as it should read after the edit. */ after: PanelBlock }

export type PanelReply = { text: string | AsyncIterable<string>; change?: PanelChange }

export type PanelRequest = { prompt: string; page: PanelPage; selection?: PanelSelection; signal: AbortSignal }

export type AppliedChange = { blockId: string; after: PanelBlock; before: PanelBlock }

export type AiSidePanelProps = {
  /** The page the assistant reads and edits. The panel keeps its own copy; passing a new object resets it. */
  page?: PanelPage
  /** Answers a prompt. Return `{ text, change? }`: text is a string or an async iterable of deltas, `change` shows as a diff to approve. Throw to show the error state with Retry. Without it a scripted demo answers. */
  respond?: (request: PanelRequest) => PanelReply | Promise<PanelReply>
  /** Called after Apply with the change and the page after it. Persist the page here. */
  onApply?: (change: AppliedChange, page: PanelPage) => void
  /** Called after Undo with the reverted change and the restored page. */
  onUndo?: (change: AppliedChange, page: PanelPage) => void
  /** Whether the panel starts open. Narrow containers start closed unless this is set. */
  defaultOpen?: boolean
  /** Suggestion chips in the empty thread. */
  suggestions?: string[]
  /** Identity shown in the panel header and the reopen button. */
  assistant?: { name?: string; model?: string; mark?: React.ReactNode }
  /** Class on the root. Set `--side-panel-height` to embed it and `--side-panel-page` (default 680px) for the page width when the panel is closed. */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

const SAMPLE_PAGE: PanelPage = {
  title: "Shared inboxes",
  meta: "Product spec · Noor Hadid · Edited Oct 18",
  blocks: [
    {
      id: "intro",
      type: "paragraph",
      label: "Intro",
      text: "Shared inboxes are a new way for support teams to work on the same queue without stepping on each other, so that nobody has to forward emails, copy notes between tools or ask who is handling a request.",
    },
    { id: "h-goals", type: "heading", text: "Goals" },
    { id: "goals", type: "paragraph", label: "Goals", text: "Cut the time to first reply from four hours to under one. Move 25% of Starter accounts onto the Team plan by the end of Q1 2027." },
    { id: "h-pricing", type: "heading", text: "Pricing" },
    { id: "pricing-text", type: "paragraph", label: "Pricing", text: "Billed per agent, monthly. Admins add or remove agents at any time and changes are prorated on the next invoice." },
    {
      id: "plans",
      type: "table",
      label: "Plans",
      columns: ["Plan", "Agents", "Monthly"],
      rows: [
        ["Starter", "Up to 3", "$9"],
        ["Team", "Up to 25", "$19"],
        ["Business", "Unlimited", "$39"],
      ],
    },
  ],
}

const SAMPLE_SUGGESTIONS = ["Summarize this page", "Tighten the intro", "Add an annual price column"]

const INTRO_AFTER =
  "Shared inboxes let support teams work one queue together, so nobody has to forward emails, copy notes between tools or ask who owns a request."

const SUMMARY =
  "Shared inboxes let a support team work one queue together instead of forwarding emails and copying notes. The goal is a first reply in under an hour and a quarter of Starter accounts moving to the Team plan by the end of Q1 2027. Pricing is per agent per month, prorated when seats change, from $9 to $39."

const ERR_ONCE = { current: true }

function scriptedRespond(req: PanelRequest): PanelReply {
  const p = req.prompt.toLowerCase()
  if (req.selection) {
    return {
      text: `That passage says ${req.selection.text.length > 90 ? "that the work is shared across the team" : "something short and specific"}. In plain words: it describes the result for a person on the support team rather than how it is built. I can tighten it or make it more concrete if you like.`,
    }
  }
  if (/tight|shorten|intro/.test(p)) {
    const intro = req.page.blocks.find((b) => b.id === "intro")
    return {
      text: "Here is a tighter intro. It keeps what teams share and the two chores it removes, and goes from 37 words to 24.",
      change: intro && intro.type === "paragraph" ? { blockId: "intro", after: { ...intro, text: INTRO_AFTER } } : undefined,
    }
  }
  if (/annual/.test(p)) {
    const t = req.page.blocks.find((b) => b.type === "table")
    if (t && t.type === "table" && !t.columns.includes("Annual")) {
      const price = (s: string) => `$${Number(s.replace(/\D/g, "")) * 10}`
      return {
        text: "I added an Annual column at ten times the monthly price, which gives two months free. Review the table, then apply it.",
        change: { blockId: t.id, after: { ...t, columns: [...t.columns, "Annual"], rows: t.rows.map((r) => [...r, price(r[r.length - 1])]) } },
      }
    }
    return { text: "The pricing table already has an Annual column." }
  }
  if (/summar/.test(p)) return { text: SUMMARY }
  if (ERR_ONCE.current) {
    ERR_ONCE.current = false
    throw new Error("The assistant did not respond")
  }
  return { text: "I can summarize the page, tighten a paragraph or add a column to a table. Select a passage and ask about it, or pick one of the suggestions." }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.asp {
  --asp-ink: #0a0a0a;
  --asp-surface: #fff;
  --asp-accent: #0060e2;
  --asp-warn: #d9480f;
  --asp-on-ink: #fff;
  --asp-t1: var(--asp-ink);
  --asp-t2: color-mix(in oklab, var(--asp-ink) 70%, transparent);
  --asp-t3: color-mix(in oklab, var(--asp-ink) 54%, transparent);
  --asp-wash: color-mix(in oklab, var(--asp-ink) 3.5%, transparent);
  --asp-hover: color-mix(in oklab, var(--asp-ink) 5%, transparent);
  --asp-soft: color-mix(in oklab, var(--asp-ink) 6%, transparent);
  --asp-line: color-mix(in oklab, var(--asp-ink) 9%, transparent);
  --asp-tint: color-mix(in oklab, var(--asp-accent) 13%, transparent);
  --asp-ins: color-mix(in oklab, var(--asp-ink) 13%, transparent);
  --asp-glint: rgb(255 255 255 / .85);
  --asp-pop: 0 6px 18px 0 rgb(0 0 0 / .065), 0 1px 3px 0 rgb(0 0 0 / .035);
  --asp-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; display: flex; width: 100%; min-width: 0; height: var(--side-panel-height, 640px); max-height: 100%;
  overflow: hidden; container-type: inline-size; border-radius: 24px; border: 1px solid var(--asp-line); background: var(--asp-surface);
  color: var(--asp-t1);
  font-family: var(--asp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 19.6px; letter-spacing: -.01em; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .asp {
  --asp-ink: #fff;
  --asp-surface: #161618;
  --asp-accent: #4d8dff;
  --asp-warn: #ff9b6b;
  --asp-on-ink: #0a0a0a;
  --asp-t2: color-mix(in oklab, var(--asp-ink) 66%, transparent);
  --asp-t3: color-mix(in oklab, var(--asp-ink) 48%, transparent);
  --asp-wash: color-mix(in oklab, var(--asp-ink) 6%, transparent);
  --asp-hover: color-mix(in oklab, var(--asp-ink) 8%, transparent);
  --asp-soft: color-mix(in oklab, var(--asp-ink) 8%, transparent);
  --asp-line: color-mix(in oklab, var(--asp-ink) 13%, transparent);
  --asp-tint: color-mix(in oklab, var(--asp-accent) 22%, transparent);
  --asp-ins: color-mix(in oklab, var(--asp-ink) 18%, transparent);
  --asp-glint: rgb(255 255 255 / .9);
  --asp-pop: 0 8px 24px 0 rgb(0 0 0 / .5), 0 1px 3px 0 rgb(0 0 0 / .4);
}
.asp *, .asp *::before, .asp *::after { box-sizing: border-box }
:where(.asp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; letter-spacing: inherit }
.asp button:disabled { cursor: default }
.asp :focus-visible { outline: 2px solid color-mix(in oklab, var(--asp-accent) 60%, transparent); outline-offset: 1px }
.asp .asp-input:focus-visible { outline: none }
.asp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }

/* Page */
.asp-pageCol { position: relative; flex: 1; min-width: 0; height: 100% }
.asp-pageScroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain }
.asp-doc { width: 100%; max-width: 520px; margin-inline: auto; padding: 72px 36px 48px; transition: max-width .45s var(--asp-ease) }
.asp[data-open="false"] .asp-doc { max-width: var(--side-panel-page, 680px) }
.asp-docHead { margin-bottom: 18px }
.asp-docTitle { margin: 0; font-size: 22px; line-height: 24.2px; font-weight: 500; letter-spacing: -.02em }
.asp-docMeta { margin: 6px 0 0; font-size: 12px; line-height: 16.8px; color: var(--asp-t3) }
.asp-block { position: relative; margin-bottom: 14px }
.asp-box { position: relative; margin: 0 -8px; padding: 4px 8px; overflow: clip; border-radius: 10px }
.asp-boxInner { position: relative; z-index: 1 }
.asp-fresh { animation: asp-in .18s var(--asp-ease) backwards }
.asp-p { margin: 0; font-size: 14px; line-height: 22.4px; color: var(--asp-t1) }
.asp-h { margin: 10px 0 0; font-size: 14px; line-height: 19.6px; font-weight: 500 }
.asp-sweep { position: absolute; inset: 0; z-index: 0; border-radius: inherit; background: var(--asp-tint); pointer-events: none; animation: asp-sweep 1.4s ease both }
.asp-tableWrap { overflow-x: auto }
.asp-table { width: 100%; border-collapse: collapse; font-size: 14px }
.asp-table th, .asp-table td { padding: 8px 12px 8px 0; text-align: left; border-bottom: 1px solid var(--asp-soft); white-space: nowrap }
.asp-table thead th { padding-bottom: 8px; font-size: 12px; line-height: 16.8px; font-weight: 400; color: var(--asp-t3) }
.asp-table tbody th { font-weight: 500; color: var(--asp-t1) }
.asp-table td { color: var(--asp-t2) }
.asp-table tr:last-child th, .asp-table tr:last-child td { border-bottom: 0 }
.asp-table th:last-child, .asp-table td:last-child { padding-right: 0 }
.asp-table .num { text-align: right }
.asp-reopen {
  position: absolute; top: 14px; right: 14px; z-index: 6; display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px 0 10px; border-radius: 999px;
  border: 1px solid var(--asp-line); background: var(--asp-surface); font-size: 12px; font-weight: 500; transition: background-color .16s var(--asp-ease), opacity .24s var(--asp-ease), transform .3s var(--asp-ease);
}
.asp-reopen:hover { background: var(--asp-wash) }
.asp[data-open="true"] .asp-reopen { opacity: 0; transform: translateX(8px); pointer-events: none; visibility: hidden }
.asp-ask {
  position: absolute; z-index: 8; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px 0 10px; border-radius: 999px; background: var(--asp-ink); color: var(--asp-on-ink);
  font-size: 12px; font-weight: 500; white-space: nowrap; translate: -50% 0; box-shadow: var(--asp-pop); animation: asp-pill .18s var(--asp-ease) backwards;
}

/* Dock and panel */
.asp-dock { position: relative; z-index: 4; flex: none; width: 360px; height: 100%; overflow: hidden; border-left: 1px solid var(--asp-line); transition: width .5s var(--asp-ease), border-color .3s }
.asp[data-open="false"] .asp-dock { width: 0; border-left-color: transparent }
.asp-panel { display: flex; flex-direction: column; width: 360px; height: 100%; background: var(--asp-surface); transition: transform .5s var(--asp-ease), opacity .3s var(--asp-ease) }
.asp[data-open="false"] .asp-panel { transform: translateX(40px); opacity: 0 }
.asp-head { flex: none; padding: 12px 12px 12px 16px; border-bottom: 1px solid var(--asp-soft) }
.asp-titleRow { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 30px }
.asp-identity { display: inline-flex; align-items: center; gap: 7px; min-width: 0 }
.asp-name { font-weight: 500 }
.asp-model { font-size: 12px; line-height: 16.8px; color: var(--asp-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.asp-mark { flex: none; display: inline-grid; place-items: center; width: 16px; height: 16px; color: #d4623a }
.asp-iconBtn { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; color: var(--asp-t3); transition: background-color .16s var(--asp-ease), color .16s var(--asp-ease) }
.asp-iconBtn:hover { background: var(--asp-hover); color: var(--asp-t1) }
.asp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 0; padding: 0; list-style: none }
.asp-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 100%; height: 24px; padding: 0 9px; border-radius: 999px; border: 1px solid var(--asp-line); font-size: 12px; line-height: 16.8px; color: var(--asp-t2); animation: asp-pill .2s var(--asp-ease) backwards }
.asp-chip svg { flex: none }
.asp-chip span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.asp-chip button { display: grid; place-items: center; width: 16px; height: 16px; margin-right: -4px; border-radius: 50%; color: var(--asp-t3) }
.asp-chip button:hover { background: var(--asp-soft); color: var(--asp-t1) }
.asp-thread { position: relative; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain }
.asp-threadInner { display: flex; flex-direction: column; min-height: 100%; padding: 16px 16px 52px }
.asp-turns { display: grid; gap: 18px; margin: 0; padding: 0; list-style: none }
.asp-turn { display: grid; gap: 10px; min-width: 0; animation: asp-rise .4s var(--asp-ease) backwards }
.asp-ask-bubble { justify-self: end; max-width: 88%; margin: 0; padding: 7px 12px; border-radius: 14px; background: var(--asp-wash); font-size: 13px; line-height: 18.2px; overflow-wrap: anywhere }
.asp-ask-ctx { justify-self: end; display: inline-flex; align-items: center; gap: 5px; max-width: 88%; margin-bottom: -4px; font-size: 11px; line-height: 15px; color: var(--asp-t3) }
.asp-ask-ctx span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.asp-answer { display: grid; gap: 10px; min-width: 0 }
.asp-text { margin: 0; font-size: 14px; line-height: 21.7px; overflow-wrap: anywhere }
.asp-chunk { animation: asp-chunk .15s linear backwards }
.asp-state { display: inline-flex; align-items: center; gap: 8px; color: var(--asp-t3) }
.asp-shimmer { position: relative }
.asp-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, var(--asp-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: asp-sweepText 1.6s linear infinite;
}
.asp-fail { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; color: var(--asp-warn) }
.asp-retry { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--asp-line); color: var(--asp-t2); font-size: 12px }
.asp-retry:hover { background: var(--asp-wash); color: var(--asp-t1) }
.asp-change { overflow: hidden; border-radius: 14px; border: 1px solid var(--asp-line); background: var(--asp-surface); animation: asp-rise .4s var(--asp-ease) backwards }
.asp-changeHead { display: flex; align-items: center; gap: 7px; padding: 10px 12px 0; color: var(--asp-t3) }
.asp-changeLabel { font-size: 13px; line-height: 18.2px; font-weight: 500; color: var(--asp-t1) }
.asp-changeMeta { margin-left: auto; font-size: 12px; line-height: 16.8px; white-space: nowrap }
.asp-changeBody { padding: 8px 12px 12px }
.asp-diff { margin: 0; font-size: 13px; line-height: 20.8px; color: var(--asp-t2) }
.asp-diff del { color: var(--asp-t3); text-decoration: line-through; text-decoration-color: color-mix(in oklab, var(--asp-ink) 30%, transparent) }
.asp-diff ins { padding: 0 2px; border-radius: 4px; background: var(--asp-ins); color: var(--asp-t1); text-decoration: none; box-decoration-break: clone; -webkit-box-decoration-break: clone }
.asp-mini { width: 100%; border-collapse: collapse; font-size: 12.5px }
.asp-mini th, .asp-mini td { padding: 4px 10px 4px 0; text-align: left; font-weight: 400; white-space: nowrap; color: var(--asp-t2); border-bottom: 1px solid var(--asp-soft) }
.asp-mini thead th { color: var(--asp-t3); font-size: 11.5px }
.asp-mini tr:last-child td, .asp-mini tr:last-child th { border-bottom: 0 }
.asp-mini .new { padding: 4px 6px; border-radius: 4px; background: var(--asp-ins); color: var(--asp-t1) }
.asp-changeFoot { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 7px 7px 7px 12px; border-top: 1px solid var(--asp-soft) }
.asp-resolved { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--asp-t2); animation: asp-fade .2s var(--asp-ease) backwards }
.asp-resolved svg { flex: none }
.asp-footActions { display: inline-flex; gap: 4px; margin-left: auto }
.asp-btn { display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 12px; border-radius: 18px; border: 1px solid transparent; font-size: 13px; font-weight: 500; transition: background-color .16s var(--asp-ease), opacity .2s var(--asp-ease), color .16s var(--asp-ease) }
.asp-btn[data-ghost] { color: var(--asp-t2) }
.asp-btn[data-ghost]:hover:not(:disabled) { background: var(--asp-hover); color: var(--asp-t1) }
.asp-btn[data-primary] { background: var(--asp-ink); color: var(--asp-on-ink); border-color: var(--asp-ink) }
.asp-btn[data-primary]:hover:not(:disabled) { opacity: .85 }
.asp-btn:disabled { opacity: .38 }
.asp-suggest { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none }
.asp-sug { display: inline-flex; align-items: center; height: 30px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--asp-line); background: var(--asp-surface); font-size: 13px; line-height: 18.2px; color: var(--asp-t2); transition: background-color .16s var(--asp-ease), color .16s var(--asp-ease), transform .3s var(--asp-ease); animation: asp-rise .45s var(--asp-ease) backwards }
.asp-suggest li:nth-child(2) .asp-sug { animation-delay: .05s }
.asp-suggest li:nth-child(3) .asp-sug { animation-delay: .1s }
.asp-sug:hover:not(:disabled) { background: var(--asp-wash); color: var(--asp-t1) }
.asp-sug:active:not(:disabled) { transform: scale(.97) }
.asp-sug:disabled { opacity: .5 }
.asp-empty { display: grid; gap: 6px; margin-top: auto }
.asp-emptyTitle { margin: 0; font-weight: 500 }
.asp-emptyText { margin: 0 0 8px; font-size: 12px; line-height: 18px; color: var(--asp-t3) }
.asp-after { margin-top: 18px }
.asp-compArea { flex: none; padding: 0 12px 12px }
.asp-pillSlot { display: flex; justify-content: center; height: 0; position: relative; z-index: 3 }
.asp-undo { position: absolute; bottom: 8px; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--asp-line); background: var(--asp-surface); box-shadow: var(--asp-pop); font-size: 12px; font-weight: 500; animation: asp-pill .22s var(--asp-ease) backwards }
.asp-undo:hover { background: var(--asp-wash) }
.asp-undoLabel { font-weight: 400; color: var(--asp-t3) }
.asp-undoRule { width: 1px; height: 14px; background: var(--asp-line) }
.asp-comp { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 6px 0 14px; border-radius: 18px; border: 1px solid var(--asp-line); background: var(--asp-surface); transition: border-color .16s var(--asp-ease) }
.asp-comp:focus-within { border-color: color-mix(in oklab, var(--asp-ink) 20%, transparent) }
.asp-input { flex: 1; min-width: 0; height: 42px; padding: 0; border: 0; background: transparent; outline: none; font: inherit; font-size: 14px; letter-spacing: inherit; color: inherit }
.asp-input::placeholder { color: var(--asp-t3) }
.asp-send { position: relative; flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--asp-wash); color: var(--asp-t3); transition: background-color .16s var(--asp-ease), color .16s var(--asp-ease), transform .2s var(--asp-ease) }
.asp-send[data-state="ready"], .asp-send[data-state="stop"] { background: var(--asp-ink); color: var(--asp-on-ink) }
.asp-send:active:not([data-state="idle"]) { transform: scale(.92) }
.asp-scrim { position: absolute; inset: 0; z-index: 9; background: rgb(0 0 0 / .28); opacity: 0; pointer-events: none; transition: opacity .3s var(--asp-ease) }

/* Narrow containers: the panel becomes a bottom sheet */
.asp[data-narrow] .asp-dock { position: absolute; z-index: 10; left: 0; right: 0; bottom: 0; width: auto; height: min(78%, 560px); border-left: 0; border-top: 1px solid var(--asp-line); border-radius: 22px 22px 0 0; box-shadow: 0 -12px 40px -12px rgb(0 0 0 / .25); transition: transform .5s var(--asp-ease), opacity .3s var(--asp-ease) }
.asp[data-narrow][data-open="false"] .asp-dock { width: auto; transform: translateY(105%); opacity: 0; visibility: hidden; transition: transform .5s var(--asp-ease), opacity .3s var(--asp-ease), visibility 0s .5s }
.asp[data-narrow] .asp-panel { width: 100% }
.asp[data-narrow][data-open="false"] .asp-panel { transform: none; opacity: 1 }
.asp[data-narrow][data-open="true"] .asp-scrim { opacity: 1; pointer-events: auto }
.asp[data-narrow] .asp-doc { padding: 64px 20px 40px }
.asp[data-narrow][data-open="true"] .asp-reopen { visibility: hidden }

@keyframes asp-sweep {
  0% { clip-path: inset(0 100% 0 0 round 10px); opacity: 1; animation-timing-function: cubic-bezier(.22, 1, .36, 1) }
  30% { clip-path: inset(0 round 10px); opacity: 1; animation-timing-function: ease-in-out }
  55% { clip-path: inset(0 round 10px); opacity: 1 }
  100% { clip-path: inset(0 round 10px); opacity: 0 }
}
@keyframes asp-sweepText { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes asp-chunk { from { opacity: 0 } to { opacity: 1 } }
@keyframes asp-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes asp-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes asp-rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes asp-pill { from { opacity: 0; transform: translateY(4px) scale(.96) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) {
  .asp *, .asp *::before, .asp *::after { animation: none !important; transition: none !important }
  .asp-sweep { animation: asp-tintOnly 1.4s ease both !important }
}
@keyframes asp-tintOnly { 0%, 55% { opacity: 1 } 100% { opacity: 0 } }
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type DiffOp = { k: "eq" | "del" | "ins"; text: string }

/** Word diff: trim the shared start and end, then a small LCS over what is left. */
function wordDiff(a: string, b: string): DiffOp[] {
  const x = a.match(/\S+\s*/g) ?? []
  const y = b.match(/\S+\s*/g) ?? []
  const norm = (s: string) => s.trim()
  let head = 0
  while (head < x.length && head < y.length && norm(x[head]) === norm(y[head])) head++
  let tail = 0
  while (tail < x.length - head && tail < y.length - head && norm(x[x.length - 1 - tail]) === norm(y[y.length - 1 - tail])) tail++
  const xm = x.slice(head, x.length - tail)
  const ym = y.slice(head, y.length - tail)
  const n = xm.length
  const m = ym.length
  const t: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = norm(xm[i]) === norm(ym[j]) ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1])
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
    if (i < n && j < m && norm(xm[i]) === norm(ym[j])) {
      push("eq", ym[j])
      i++
      j++
    } else if (j < m && (i === n || t[i][j + 1] >= t[i + 1][j])) push("ins", ym[j++])
    else push("del", xm[i++])
  }
  if (tail) push("eq", x.slice(x.length - tail).join(""))
  return ops
}

const wordCount = (s: string) => (s.match(/\S+/g) ?? []).length

type Resolution = "pending" | "applied" | "discarded" | "undone"
type Turn = {
  id: number
  prompt: string
  selection?: PanelSelection
  status: "thinking" | "streaming" | "done" | "stopped" | "error"
  settled: string
  live: string[]
  error?: string
  change?: { change: PanelChange; before: PanelBlock; res: Resolution }
}

let seq = 0

function blockLabel(b: PanelBlock) {
  return b.type === "heading" ? b.text : (b.label ?? (b.type === "table" ? "Table" : "Paragraph"))
}

function ChangeBody({ before, after }: { before: PanelBlock; after: PanelBlock }) {
  if (before.type === "paragraph" && after.type === "paragraph") {
    const ops = wordDiff(before.text, after.text)
    return (
      <p className="asp-diff">
        {ops.map((o, i) =>
          o.k === "eq" ? <span key={i}>{o.text}</span> : o.k === "del" ? <del key={i}><span className="asp-sr">Removed: </span>{o.text}</del> : <ins key={i}><span className="asp-sr">Added: </span>{o.text}</ins>,
        )}
      </p>
    )
  }
  if (before.type === "table" && after.type === "table") {
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="asp-mini">
          <thead>
            <tr>
              {after.columns.map((c, i) => (
                <th key={c}>{i >= before.columns.length ? <span className="new"><span className="asp-sr">Added: </span>{c}</span> : c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {after.rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((cell, ci) => (
                  <td key={ci}>{ci >= before.columns.length ? <span className="new"><span className="asp-sr">Added: </span>{cell}</span> : cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return <p className="asp-diff"><ins>{after.type === "heading" ? after.text : blockLabel(after)}</ins></p>
}

function changeMeta(before: PanelBlock, after: PanelBlock) {
  if (before.type === "paragraph" && after.type === "paragraph") return `${wordCount(after.text)} words, was ${wordCount(before.text)}`
  if (before.type === "table" && after.type === "table") {
    const n = after.columns.length - before.columns.length
    return n > 0 ? `${n} column${n > 1 ? "s" : ""} added` : "Table edited"
  }
  return "Edited"
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function AiSidePanel({
  page: pageProp = SAMPLE_PAGE,
  respond,
  onApply,
  onUndo,
  defaultOpen,
  suggestions = SAMPLE_SUGGESTIONS,
  assistant,
  className,
}: AiSidePanelProps) {
  const name = assistant?.name ?? "Assistant"
  const modelName = assistant?.model ?? "Nova 5"
  const markNode = assistant?.mark ?? <Sparkles size={15} strokeWidth={2} aria-hidden />
  const idBase = React.useId().replace(/:/g, "")

  const [page, setPage] = React.useState(pageProp)
  const [prevProp, setPrevProp] = React.useState(pageProp)
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [open, setOpen] = React.useState(defaultOpen ?? true)
  const [narrow, setNarrow] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [selection, setSelection] = React.useState<PanelSelection | null>(null)
  const [pending, setPending] = React.useState<{ text: string; selection: PanelSelection; x: number; y: number } | null>(null)
  const [sweeps, setSweeps] = React.useState<Record<string, number>>({})
  const [undo, setUndo] = React.useState<{ turnId: number; label: string } | null>(null)
  const [status, setStatus] = React.useState("")

  const rootRef = React.useRef<HTMLDivElement>(null)
  const pageColRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const reopenRef = React.useRef<HTMLButtonElement>(null)
  const threadRef = React.useRef<HTMLDivElement>(null)
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  const runRef = React.useRef(0)
  const timers = React.useRef(new Set<number>())
  const pageRef = React.useRef(page)
  const measured = React.useRef(false)
  const stuck = React.useRef(true)
  const applyBtns = React.useRef(new Map<number, HTMLButtonElement>())

  // A new page object resets the panel's copy (adjusting state while rendering, not in an effect).
  if (pageProp !== prevProp) {
    setPrevProp(pageProp)
    setPage(pageProp)
    setTurns([])
    setUndo(null)
  }
  React.useLayoutEffect(() => {
    pageRef.current = page
  })

  const busy = turns.some((t) => t.status === "thinking" || t.status === "streaming")
  const sendState = busy ? "stop" : draft.trim() ? "ready" : "idle"

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

  /* ---------- container width: dock beside the page, or a bottom sheet ---------- */
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const narrowNow = entry.contentRect.width < 640
      setNarrow(narrowNow)
      if (!measured.current) {
        measured.current = true
        if (narrowNow && defaultOpen === undefined) setOpen(false)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [defaultOpen])

  /* ---------- selecting text in the page ---------- */
  React.useEffect(() => {
    const col = pageColRef.current
    if (!col) return
    const read = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return setPending(null)
      const range = sel.getRangeAt(0)
      const node = range.commonAncestorContainer
      const el = (node.nodeType === 1 ? node : node.parentElement) as Element | null
      const block = el?.closest<HTMLElement>("[data-block]")
      if (!block || !col.contains(block)) return setPending(null)
      const text = sel.toString().replace(/\s+/g, " ").trim()
      if (text.length < 2) return setPending(null)
      const r = range.getBoundingClientRect()
      const c = col.getBoundingClientRect()
      const id = block.getAttribute("data-block")!
      const b = pageRef.current.blocks.find((x) => x.id === id)
      setPending({ text, selection: { blockId: id, label: b ? blockLabel(b) : "Page", text }, x: r.left + r.width / 2 - c.left, y: r.top - c.top - 38 })
    }
    let t = 0
    const onChange = () => { window.clearTimeout(t); t = window.setTimeout(read, 60) }
    document.addEventListener("selectionchange", onChange)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener("selectionchange", onChange)
    }
  }, [])

  const addSelection = () => {
    if (!pending) return
    setSelection(pending.selection)
    setPending(null)
    window.getSelection()?.removeAllRanges()
    setOpen(true)
    setStatus("Selection added as context")
    later(() => inputRef.current?.focus(), 60)
  }

  /* ---------- following the thread ---------- */
  const lastTurn = turns[turns.length - 1]
  const follow = lastTurn ? lastTurn.settled.length + lastTurn.live.length + lastTurn.status + (lastTurn.change?.res ?? "") : ""
  React.useLayoutEffect(() => {
    const el = threadRef.current
    if (el && stuck.current) el.scrollTop = el.scrollHeight
  }, [follow, turns.length])

  /* ---------- running a prompt ---------- */
  const patchTurn = React.useCallback((id: number, fn: (t: Turn) => Turn) => setTurns((l) => l.map((t) => (t.id === id ? fn(t) : t))), [])

  const run = React.useCallback(
    async (turnId: number, prompt: string, sel: PanelSelection | undefined) => {
      const id = ++runRef.current
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const alive = () => runRef.current === id && !ctrl.signal.aborted
      setStatus("Reading the page")
      let reply: PanelReply
      try {
        const req: PanelRequest = { prompt, page: pageRef.current, selection: sel, signal: ctrl.signal }
        await new Promise<void>((r) => later(r, 450))
        if (!alive()) return
        reply = await (respond ? respond(req) : scriptedRespond(req))
      } catch (e) {
        if (alive()) {
          patchTurn(turnId, (t) => ({ ...t, status: "error", error: e instanceof Error ? e.message : "Something went wrong" }))
          setStatus("The assistant did not respond")
        }
        return
      }
      if (!alive()) return

      let buffer = typeof reply.text === "string" ? reply.text : ""
      let done = typeof reply.text === "string"
      let failed: string | null = null as string | null
      if (typeof reply.text !== "string") {
        const it = reply.text
        void (async () => {
          try {
            for await (const d of it) {
              if (!alive()) return
              buffer += d
            }
          } catch (e) {
            if (alive()) failed = e instanceof Error ? e.message : "Something went wrong"
          }
          done = true
        })()
      }
      patchTurn(turnId, (t) => ({ ...t, status: "streaming" }))

      await new Promise<void>((resolve) => {
        let last = 0
        const tick = (now: number) => {
          if (!alive()) return resolve()
          if (now - last >= 34) {
            last = now
            if (buffer) {
              const words = buffer.match(/\S+\s*/g) ?? [buffer]
              const k = buffer.length > 500 ? 8 : 3 + (words.length % 3)
              const chunk = words.slice(0, k).join("")
              buffer = buffer.slice(chunk.length)
              patchTurn(turnId, (t) => {
                const live = [...t.live, chunk]
                let settled = t.settled
                while (live.length > 6) settled += live.shift()
                return { ...t, settled, live }
              })
            } else if (done) return resolve()
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      if (!alive()) return
      if (failed) {
        patchTurn(turnId, (t) => ({ ...t, status: "error", error: failed! }))
        setStatus("The assistant did not respond")
        return
      }
      const ch = reply.change
      const before = ch ? pageRef.current.blocks.find((b) => b.id === ch.blockId) : undefined
      patchTurn(turnId, (t) => ({ ...t, status: "done", change: ch && before ? { change: ch, before, res: "pending" } : undefined }))
      setStatus(ch && before ? `Answer ready. It changes ${blockLabel(before)}.` : "Answer ready")
      later(() => patchTurn(turnId, (t) => ({ ...t, settled: t.settled + t.live.join(""), live: [] })), 240)
    },
    [later, patchTurn, respond],
  )

  const send = (text: string) => {
    const prompt = text.trim()
    if (!prompt || busy) return
    const turn: Turn = { id: ++seq, prompt, selection: selection ?? undefined, status: "thinking", settled: "", live: [] }
    stuck.current = true
    setTurns((l) => [...l, turn])
    setDraft("")
    setSelection(null)
    setUndo(null)
    void run(turn.id, prompt, turn.selection)
  }

  const stop = () => {
    abortNow()
    setTurns((l) => l.map((t) => (t.status === "thinking" || t.status === "streaming" ? { ...t, status: "stopped", settled: t.settled + t.live.join(""), live: [] } : t)))
    setStatus("Stopped")
  }

  const retry = (t: Turn) => {
    if (busy) return
    patchTurn(t.id, (x) => ({ ...x, status: "thinking", settled: "", live: [], error: undefined }))
    void run(t.id, t.prompt, t.selection)
  }

  /* ---------- apply, discard, undo ---------- */
  const setBlock = (blockId: string, block: PanelBlock) => {
    setPage((p) => {
      const next = { ...p, blocks: p.blocks.map((b) => (b.id === blockId ? block : b)) }
      pageRef.current = next
      return next
    })
    setSweeps((s) => ({ ...s, [blockId]: (s[blockId] ?? 0) + 1 }))
  }

  const apply = (t: Turn) => {
    const c = t.change
    if (!c || c.res !== "pending") return
    setBlock(c.change.blockId, c.change.after)
    patchTurn(t.id, (x) => ({ ...x, change: x.change && { ...x.change, res: "applied" } }))
    setUndo({ turnId: t.id, label: `${blockLabel(c.before)} updated` })
    setStatus(`Applied to the page. ${blockLabel(c.before)} updated. Undo is available.`)
    const nextPage = { ...pageRef.current, blocks: pageRef.current.blocks.map((b) => (b.id === c.change.blockId ? c.change.after : b)) }
    onApply?.({ blockId: c.change.blockId, after: c.change.after, before: c.before }, nextPage)
    later(() => undoRef.current?.focus(), 60)
  }

  const discard = (t: Turn) => {
    if (!t.change || t.change.res !== "pending") return
    patchTurn(t.id, (x) => ({ ...x, change: x.change && { ...x.change, res: "discarded" } }))
    setStatus("Discarded")
    inputRef.current?.focus()
  }

  const undoChange = () => {
    if (!undo) return
    const t = turns.find((x) => x.id === undo.turnId)
    const c = t?.change
    if (!t || !c) return
    setBlock(c.change.blockId, c.before)
    patchTurn(t.id, (x) => ({ ...x, change: x.change && { ...x.change, res: "undone" } }))
    setUndo(null)
    setStatus("Undone")
    const restored = { ...pageRef.current, blocks: pageRef.current.blocks.map((b) => (b.id === c.change.blockId ? c.before : b)) }
    onUndo?.({ blockId: c.change.blockId, after: c.change.after, before: c.before }, restored)
    later(() => applyBtns.current.get(t.id)?.focus(), 60)
  }

  /* ---------- open / close ---------- */
  const close = () => {
    setOpen(false)
    setStatus("Panel closed")
    later(() => reopenRef.current?.focus(), 80)
  }
  const reopen = () => {
    setOpen(true)
    later(() => inputRef.current?.focus(), 120)
  }

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault()
      close()
    }
  }

  const selectionChip = selection ? `“${selection.text.length > 26 ? `${selection.text.slice(0, 24).trimEnd()}...` : selection.text}”` : ""

  return (
    <div ref={rootRef} className={["asp", className].filter(Boolean).join(" ")} data-open={open ? "true" : "false"} data-narrow={narrow ? "" : undefined}>
      <style href="ai-side-panel" precedence="default">{CSS}</style>

      <div className="asp-pageCol" ref={pageColRef} inert={narrow && open}>
        <div className="asp-pageScroll">
          <article className="asp-doc" aria-label={page.title}>
            <header className="asp-docHead">
              <h1 className="asp-docTitle">{page.title}</h1>
              {page.meta && <p className="asp-docMeta">{page.meta}</p>}
            </header>
            {page.blocks.map((b) => (
              <div key={b.id} className="asp-block" data-block={b.id}>
                <div className="asp-box">
                  {sweeps[b.id] ? <span key={`s${sweeps[b.id]}`} className="asp-sweep" aria-hidden /> : null}
                  <div className="asp-boxInner" key={`b${sweeps[b.id] ?? 0}`}>
                    <div className={sweeps[b.id] ? "asp-fresh" : undefined}>
                      {b.type === "heading" && <h2 className="asp-h">{b.text}</h2>}
                      {b.type === "paragraph" && <p className="asp-p">{b.text}</p>}
                      {b.type === "table" && (
                        <div className="asp-tableWrap">
                          <table className="asp-table">
                            <thead>
                              <tr>{b.columns.map((c, i) => <th key={c} className={i === b.columns.length - 1 && i > 0 ? "num" : undefined}>{c}</th>)}</tr>
                            </thead>
                            <tbody>
                              {b.rows.map((r, ri) => (
                                <tr key={ri}>
                                  {r.map((cell, ci) => (ci === 0 ? <th key={ci} scope="row">{cell}</th> : <td key={ci} className={ci === r.length - 1 ? "num" : undefined}>{cell}</td>))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </article>
        </div>

        {pending && (
          <button type="button" className="asp-ask" style={{ left: Math.max(70, pending.x), top: Math.max(8, pending.y) }} onPointerDown={(e) => e.preventDefault()} onClick={addSelection}>
            <TextSelect size={14} aria-hidden />
            Ask about selection
          </button>
        )}

        <button ref={reopenRef} type="button" className="asp-reopen" aria-expanded={open} aria-controls={`${idBase}-panel`} onClick={reopen} tabIndex={open ? -1 : 0}>
          <span className="asp-mark">{markNode}</span>
          {name}
        </button>
      </div>

      <div className="asp-scrim" onClick={close} aria-hidden />

      <div className="asp-dock">
        <aside id={`${idBase}-panel`} className="asp-panel" aria-label={name} inert={!open} onKeyDown={onPanelKey}>
          <div className="asp-head">
            <div className="asp-titleRow">
              <span className="asp-identity">
                <span className="asp-mark">{markNode}</span>
                <span className="asp-name">{name}</span>
                <span className="asp-model">{modelName}</span>
              </span>
              <button type="button" className="asp-iconBtn" aria-label="Close assistant" aria-expanded={open} aria-controls={`${idBase}-panel`} onClick={close}>
                <PanelRight size={18} />
              </button>
            </div>
            <ul className="asp-chips" aria-label="Context">
              <li className="asp-chip"><FileText size={13} aria-hidden /><span>This page</span></li>
              {selection && (
                <li className="asp-chip" title={selection.text}>
                  <TextSelect size={13} aria-hidden />
                  <span>{selectionChip}</span>
                  <button type="button" aria-label="Remove selection from context" onClick={() => setSelection(null)}><X size={11} /></button>
                </li>
              )}
            </ul>
          </div>

          <div className="asp-thread" ref={threadRef} onScroll={(e) => { const el = e.currentTarget; stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60 }}>
            <div className="asp-threadInner">
              {turns.length === 0 ? (
                <div className="asp-empty">
                  <p className="asp-emptyTitle">Ask about {page.title}</p>
                  <p className="asp-emptyText">{name} reads this page and proposes edits. Nothing changes until you apply it. Answers in this preview are simulated.</p>
                  <ul className="asp-suggest" aria-label="Suggestions">
                    {suggestions.map((s) => (
                      <li key={s}><button type="button" className="asp-sug" onClick={() => send(s)}>{s}</button></li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <ol className="asp-turns" aria-label="Conversation">
                    {turns.map((t) => {
                      const live = t.status === "thinking" || t.status === "streaming"
                      return (
                        <li key={t.id} className="asp-turn" aria-busy={live}>
                          {t.selection && (
                            <span className="asp-ask-ctx"><TextSelect size={12} aria-hidden /><span>{t.selection.label}: {t.selection.text}</span></span>
                          )}
                          <p className="asp-ask-bubble">{t.prompt}</p>
                          <div className="asp-answer">
                            {t.status === "thinking" && <span className="asp-state"><span className="asp-shimmer" data-text="Reading the page">Reading the page</span></span>}
                            {(t.settled || t.live.length > 0) && (
                              <p className="asp-text">
                                {t.settled}
                                {t.live.map((c, i) => <span key={t.settled.length + i} className="asp-chunk">{c}</span>)}
                              </p>
                            )}
                            {t.status === "stopped" && <span className="asp-state"><Square size={11} fill="currentColor" strokeWidth={0} aria-hidden />Stopped</span>}
                            {t.status === "error" && (
                              <div className="asp-fail" role="alert">
                                <TriangleAlert size={16} aria-hidden />
                                {name} did not respond
                                <button type="button" className="asp-retry" onClick={() => retry(t)}><RotateCw size={12} aria-hidden />Retry</button>
                              </div>
                            )}
                            {t.change && (
                              <div className="asp-change" role="group" aria-label={`Proposed change to ${blockLabel(t.change.before)}`}>
                                <div className="asp-changeHead">
                                  <FileText size={14} aria-hidden />
                                  <span className="asp-changeLabel">{blockLabel(t.change.before)}</span>
                                  <span className="asp-changeMeta">{changeMeta(t.change.before, t.change.change.after)}</span>
                                </div>
                                <div className="asp-changeBody"><ChangeBody before={t.change.before} after={t.change.change.after} /></div>
                                <div className="asp-changeFoot">
                                  {t.change.res !== "pending" && (
                                    <span className="asp-resolved" key={t.change.res}>
                                      {t.change.res === "applied" ? <Check size={14} aria-hidden /> : t.change.res === "undone" ? <Undo2 size={14} aria-hidden /> : <X size={14} aria-hidden />}
                                      {t.change.res === "applied" ? "Applied to the page" : t.change.res === "undone" ? "Undone" : "Discarded"}
                                    </span>
                                  )}
                                  <span className="asp-footActions">
                                    <button type="button" className="asp-btn" data-ghost disabled={t.change.res !== "pending"} onClick={() => discard(t)}>Discard</button>
                                    <button
                                      type="button"
                                      className="asp-btn"
                                      data-primary
                                      ref={(el) => { if (el) applyBtns.current.set(t.id, el); else applyBtns.current.delete(t.id) }}
                                      disabled={t.change.res !== "pending"}
                                      onClick={() => apply(t)}
                                    >
                                      Apply
                                    </button>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                  {!busy && suggestions.length > 0 && (
                    <ul className="asp-suggest asp-after" aria-label="More suggestions">
                      {suggestions.filter((s) => !turns.some((t) => t.prompt === s)).map((s) => (
                        <li key={s}><button type="button" className="asp-sug" onClick={() => send(s)}>{s}</button></li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="asp-compArea">
            <div className="asp-pillSlot">
              {undo && (
                <button ref={undoRef} type="button" className="asp-undo" onClick={undoChange} key={undo.turnId}>
                  <span className="asp-undoLabel">{undo.label}</span>
                  <span className="asp-undoRule" aria-hidden />
                  <Undo2 size={13} aria-hidden />
                  Undo
                </button>
              )}
            </div>
            <form className="asp-comp" onSubmit={(e) => { e.preventDefault(); if (busy) stop(); else send(draft) }}>
              <input
                ref={inputRef}
                className="asp-input"
                aria-label="Message"
                placeholder={selection ? "Ask about the selection" : `Ask about ${page.title}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape" && busy) { e.preventDefault(); e.stopPropagation(); stop() } }}
              />
              <button type="submit" className="asp-send" data-state={sendState} aria-label={busy ? "Stop" : "Send message"} aria-disabled={sendState === "idle" ? true : undefined}>
                {busy ? <Square size={12} fill="currentColor" strokeWidth={0} aria-hidden /> : <ArrowUp size={18} strokeWidth={2.2} aria-hidden />}
              </button>
            </form>
          </div>
        </aside>
      </div>

      <p className="asp-sr" role="status" aria-live="polite">{status}</p>
    </div>
  )
}

"use client"

import * as React from "react"
import { ArrowDown, Check, NotebookPen, Pencil, Plus, Search, Trash2, Undo2, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MemoryGroupId = string

export type MemoryGroup = {
  id: MemoryGroupId
  label: string
  /** Shown when the group is selected and has no memories. */
  empty?: string
}

export type MemoryItem = {
  id: string
  /** One sentence. */
  text: string
  group: MemoryGroupId
  /** "chat", "you" or "agent" get a friendly label; anything else is shown as given. */
  source: "chat" | "you" | "agent" | (string & {})
  /** Shown as given, e.g. "Sep 8". */
  date?: string
  /** For memories about someone: shows a portrait. */
  person?: { name: string; avatar?: string }
}

/** Something the assistant noted in the current chat. Pressing the pill files it as a memory. */
export type CapturedMemory = {
  id: string
  text: string
  group: MemoryGroupId
  /** The pill text. Defaults to "Noted: " plus the text. */
  note?: string
  person?: { name: string; avatar?: string }
}

export type MemoryChange = { type: "capture" | "add" | "edit" | "forget"; memory: MemoryItem }

export type AgentMemoryProps = {
  /** Saved memories, newest first within a group. Leave it out for a sample set. */
  memories?: MemoryItem[]
  /** What the assistant noted in this chat. Pass null or [] to hide the pill. */
  captured?: CapturedMemory[] | null
  /** Called after each change with the full list. Reject to show an error in place (add and edit). A forget is reported when its undo window closes. */
  onChange?: (memories: MemoryItem[], change: MemoryChange) => void | Promise<void>
  /** Called when either switch changes. */
  onToggle?: (setting: "savedMemories" | "chatHistory", on: boolean) => void
  /** Starting values of the two switches. */
  settings?: { savedMemories?: boolean; chatHistory?: boolean }
  /** Sorts a typed memory into a group, for example with a model call. Defaults to a keyword guess. */
  classify?: (text: string) => MemoryGroupId | Promise<MemoryGroupId>
  /** Groups in filter order. */
  groups?: MemoryGroup[]
  /** Maximum characters of memory. The meter warns near full and the add field refuses entries when full. */
  capacity?: number
  /** Name used in the subtitle and the notes. */
  assistantName?: string
  /** Seconds a forgotten memory can be restored. */
  undoSeconds?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_GROUPS: MemoryGroup[] = [
  { id: "about", label: "About you", empty: "Nothing about you yet. Facts you share in chats show up here." },
  { id: "preferences", label: "Preferences", empty: "No preferences saved. Tell the assistant how you like things done." },
  { id: "projects", label: "Projects", empty: "No projects yet. Mention what you're building and it will remember." },
  { id: "people", label: "People", empty: "Nobody here yet. Colleagues and contacts you mention are kept together." },
]

const SAMPLE_MEMORIES: MemoryItem[] = [
  { id: "m1", group: "about", source: "chat", date: "Sep 3", text: "Works as a design engineer on the checkout team at Marlowe" },
  { id: "m2", group: "about", source: "chat", date: "Sep 8", text: "Lives in Lisbon and works on Western European time" },
  { id: "m3", group: "about", source: "you", date: "Aug 21", text: "Is learning Japanese, about 15 minutes a day" },
  { id: "m4", group: "preferences", source: "chat", date: "Sep 12", text: "Wants the short answer first, with details after" },
  { id: "m5", group: "preferences", source: "chat", date: "Aug 30", text: "Likes diffs instead of whole files when reviewing code" },
  { id: "m6", group: "preferences", source: "you", date: "Aug 14", text: "Prefers metric units and 24-hour times" },
  { id: "m7", group: "projects", source: "chat", date: "Sep 15", text: "Is building a recipe-sharing app called Plate in Next.js" },
  { id: "m8", group: "projects", source: "chat", date: "Sep 1", text: "Is migrating the Marlowe docs site from Gatsby to Astro" },
  { id: "m9", group: "people", source: "chat", date: "Sep 9", person: { name: "Priya Raman" }, text: "Priya Raman leads the design systems team and reviews every API change" },
  { id: "m10", group: "people", source: "chat", date: "Aug 28", person: { name: "Tomas Berg" }, text: "Tomas Berg is the on-call lead for checkout this quarter" },
  { id: "m11", group: "people", source: "you", date: "Aug 19", person: { name: "Ayo Okafor" }, text: "Ayo Okafor is the contractor writing the Japanese copy" },
]

const SAMPLE_CAPTURED: CapturedMemory[] = [{ id: "c1", group: "preferences", text: "Reviews pull requests on Friday mornings", note: "Noted: you review pull requests on Friday mornings" }]

function guessGroup(text: string, groups: MemoryGroup[]): MemoryGroupId {
  const t = text.toLowerCase()
  const has = (id: string) => groups.some((g) => g.id === id)
  if (has("people") && /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text) && /\b(leads?|manages?|is the|works with|reports to|contractor|lead)\b/.test(t)) return "people"
  if (has("projects") && /\b(building|project|migrat|launch|shipping|working on|app|site)\b/.test(t)) return "projects"
  if (has("preferences") && /\b(prefer|like|likes|want|wants|always|never|use|uses)\b/.test(t)) return "preferences"
  if (has("about")) return "about"
  return groups[0]?.id ?? "about"
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.amy {
  --amy-ink: #000;
  --amy-surface: #fff;
  --amy-accent: #0060e2;
  --amy-t1: color-mix(in oklab, var(--amy-ink) 88%, transparent);
  --amy-t2: color-mix(in oklab, var(--amy-ink) 61%, transparent);
  --amy-t3: color-mix(in oklab, var(--amy-ink) 45%, transparent);
  --amy-t4: color-mix(in oklab, var(--amy-ink) 27%, transparent);
  --amy-fill: color-mix(in oklab, var(--amy-ink) 4%, transparent);
  --amy-hover: color-mix(in oklab, var(--amy-ink) 5%, transparent);
  --amy-line: color-mix(in oklab, var(--amy-ink) 7%, transparent);
  --amy-soft: color-mix(in oklab, var(--amy-ink) 4.5%, transparent);
  --amy-main-bg: color-mix(in oklab, var(--amy-ink) 80%, transparent);
  --amy-main-fg: #fcfcfc;
  --amy-warn: #c47a00;
  --amy-bad: #d43a2b;
  --amy-flash: color-mix(in oklab, var(--amy-accent) 11%, transparent);
  --amy-float: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --amy-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  container: amy / inline-size;
  border-radius: 26px;
  border: 1px solid var(--amy-line);
  background: var(--amy-surface);
  color: var(--amy-t1);
  font-family: var(--amy-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .amy {
  --amy-ink: #fff;
  --amy-surface: #1c1c1e;
  --amy-accent: #4d8dff;
  --amy-t1: color-mix(in oklab, var(--amy-ink) 90%, transparent);
  --amy-t2: color-mix(in oklab, var(--amy-ink) 62%, transparent);
  --amy-t3: color-mix(in oklab, var(--amy-ink) 46%, transparent);
  --amy-t4: color-mix(in oklab, var(--amy-ink) 28%, transparent);
  --amy-fill: color-mix(in oklab, var(--amy-ink) 6%, transparent);
  --amy-hover: color-mix(in oklab, var(--amy-ink) 8%, transparent);
  --amy-line: color-mix(in oklab, var(--amy-ink) 10%, transparent);
  --amy-soft: color-mix(in oklab, var(--amy-ink) 7%, transparent);
  --amy-main-bg: rgb(255 255 255 / .9);
  --amy-main-fg: #171717;
  --amy-warn: #fbbf24;
  --amy-bad: #ff8a7a;
  --amy-flash: color-mix(in oklab, var(--amy-accent) 20%, transparent);
  --amy-float: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35), 0 0 0 .5px rgb(255 255 255 / .1);
}
.amy *, .amy *::before, .amy *::after { box-sizing: border-box }
:where(.amy) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.amy) input, :where(.amy) textarea { font: inherit; color: inherit }
.amy button:disabled { cursor: default }
.amy :focus-visible { outline: 2px solid color-mix(in oklab, var(--amy-accent) 60%, transparent); outline-offset: 1px }
.amy :focus:not(:focus-visible) { outline: none }
.amy svg { display: block; flex: none }
.amy-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Header + meter */
.amy-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 20px 8px }
.amy-title { margin: 0; font-size: 16px; line-height: 18px; font-weight: 500; color: var(--amy-ink) }
.amy-sub { margin: 2px 0 0; color: var(--amy-t2) }
.amy-meter { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; padding-top: 4px; flex: none }
.amy-meterLabel { display: inline-flex; gap: 4px; font-size: 12px; line-height: 16px; color: var(--amy-t2); font-variant-numeric: tabular-nums }
.amy-meterLabel b { font-weight: 500; color: var(--amy-t1) }
.amy-track { position: relative; width: 96px; height: 4px; border-radius: 99px; background: var(--amy-fill); box-shadow: inset 0 0 0 .5px var(--amy-line); overflow: hidden }
.amy-track i { position: absolute; inset: 0; border-radius: inherit; background: var(--amy-main-bg); transform-origin: left; transition: transform .8s var(--amy-ease), background-color .3s; animation: amy-grow .9s var(--amy-ease) backwards }
.amy-meter[data-s="warn"] .amy-track i { background: var(--amy-warn) }
.amy-meter[data-s="full"] .amy-track i { background: var(--amy-bad) }
.amy-meter[data-s="full"] .amy-meterLabel b { color: var(--amy-bad) }

/* Switches */
.amy-settings { padding: 0 20px 6px }
.amy-set { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 8px 0; text-align: left }
.amy-set + .amy-set { border-top: 1px solid var(--amy-soft) }
.amy-setText { display: flex; flex-direction: column; min-width: 0 }
.amy-setLabel { color: var(--amy-t1) }
.amy-setDesc { position: relative; font-size: 12px; line-height: 16px; color: var(--amy-t3) }
.amy-setDesc span { display: block; animation: amy-fade .35s var(--amy-ease) backwards }
.amy-sw { position: relative; flex: none; width: 42px; height: 24px; padding: 3px; border-radius: 999px; background: color-mix(in oklab, var(--amy-ink) 11%, transparent); transition: background-color .22s }
.amy-sw i { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .14); transition: transform .3s var(--amy-ease) }
.amy-set[aria-checked="true"] .amy-sw { background: var(--amy-main-bg) }
.amy-set[aria-checked="true"] .amy-sw i { transform: translateX(18px) }
:is(.dark, [data-theme="dark"]) .amy-set[aria-checked="true"] .amy-sw i { background: #171717 }
.amy-set { min-height: 44px }

/* Memories */
.amy-memories { border-top: 1px solid var(--amy-line) }
.amy-toolbar { position: relative; display: flex; align-items: center; height: 52px; padding: 0 60px 0 8px }
.amy-filters { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; padding: 1px }
.amy-filters::-webkit-scrollbar { display: none }
.amy-filter { position: relative; flex: none; height: 32px; padding: 0 12px; border-radius: 999px; color: var(--amy-t2); transition: color .2s }
.amy-filter:hover { color: var(--amy-t1) }
.amy-filter[aria-checked="true"] { color: var(--amy-t1) }
.amy-filterBg { position: absolute; left: 0; top: 1px; height: 32px; border-radius: 999px; background: var(--amy-fill); box-shadow: inset 0 0 0 1px var(--amy-line); transition: transform .38s var(--amy-ease), width .38s var(--amy-ease) }
.amy-filterLabel { position: relative }
.amy-search { position: absolute; right: 12px; top: 10px; display: flex; align-items: center; height: 32px; width: 32px; border-radius: 999px; overflow: hidden; border: 1px solid transparent; transition: width .4s var(--amy-ease), border-color .2s, background-color .2s }
.amy-search[data-open] { width: min(220px, calc(100% - 24px)); background: var(--amy-surface); border-color: var(--amy-line); z-index: 2 }
.amy-iconBtn { display: grid; place-items: center; flex: none; width: 30px; height: 30px; border-radius: 999px; color: var(--amy-t2); transition: background-color .16s, color .16s }
.amy-iconBtn:hover { background: var(--amy-fill); color: var(--amy-t1) }
.amy-iconBtn svg { width: 16px; height: 16px }
.amy .amy-searchIn:focus-visible, .amy .amy-addField:focus-visible, .amy .amy-ta:focus-visible { outline: none }
.amy-search:has(.amy-searchIn:focus-visible) { box-shadow: 0 0 0 3px var(--amy-fill) }
.amy-searchIn { flex: 1; min-width: 0; height: 30px; padding: 0 2px; border: 0; background: none; outline: none; opacity: 0; transition: opacity .2s }
.amy-search[data-open] .amy-searchIn { opacity: 1 }
.amy-searchClose { opacity: 0; pointer-events: none; transition: opacity .2s }
.amy-search[data-open] .amy-searchClose { opacity: 1; pointer-events: auto }

.amy-pillRow { padding: 0 20px 10px 16px; animation: amy-fade .4s var(--amy-ease) backwards }
.amy-pills { display: flex; flex-wrap: wrap; gap: 6px }
.amy-pill {
  display: inline-flex; align-items: center; gap: 8px; max-width: 100%; height: 34px; padding: 0 12px 0 10px; border-radius: 999px; background: var(--amy-surface);
  box-shadow: inset 0 0 0 1px var(--amy-line); font-size: 12px; transition: background-color .16s, transform .3s var(--amy-ease), opacity .3s;
}
.amy-pill:hover { background: var(--amy-fill) }
.amy-pill[data-gone] { opacity: 0; transform: translateY(14px) scale(.96) }
.amy-pill svg { width: 14px; height: 14px; color: var(--amy-t2) }
.amy-pill b { font-weight: 500; color: var(--amy-t1); white-space: nowrap }
.amy-pillNote { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--amy-t2) }
.amy-pill .amy-down { animation: amy-bob 1.8s ease-in-out infinite }

.amy-listWrap { position: relative }
.amy-listWrap::before, .amy-listWrap::after { content: ""; position: absolute; left: 0; right: 10px; z-index: 2; height: 12px; pointer-events: none; opacity: 0; transition: opacity .2s }
.amy-listWrap::before { top: 0; background: linear-gradient(var(--amy-surface), transparent) }
.amy-listWrap::after { bottom: 0; background: linear-gradient(transparent, var(--amy-surface)) }
.amy-listWrap[data-top]::before { opacity: 1 }
.amy-listWrap[data-bottom]::after { opacity: 1 }
.amy-list { max-height: 380px; overflow-y: auto; overscroll-behavior: contain; padding: 0 8px 10px; scrollbar-width: thin; scrollbar-color: var(--amy-t4) transparent; transition: opacity .3s }
.amy-list[data-off] { opacity: .45 }
.amy-fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .45s var(--amy-ease), opacity .3s var(--amy-ease) }
.amy-fold[data-open] { grid-template-rows: 1fr; opacity: 1 }
.amy-fold > div { min-height: 0; overflow: hidden }
.amy-gh { display: flex; align-items: baseline; gap: 6px; margin: 0; padding: 12px 12px 4px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--amy-t3) }
.amy-gh span { font-weight: 400; color: var(--amy-t4); font-variant-numeric: tabular-nums }
.amy-rows { margin: 0; padding: 0; list-style: none }
.amy-rowItem { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .4s var(--amy-ease), opacity .3s; animation: amy-in .55s var(--amy-ease) backwards }
.amy-rowItem[data-hide] { grid-template-rows: 0fr; opacity: 0 }
.amy-rowItem > div { min-height: 0; overflow: hidden }
.amy-empty { margin: 0; padding: 12px 12px 14px; color: var(--amy-t3) }
.amy-row { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 8px 8px 8px 12px; border-radius: 12px; transition: background-color .2s }
.amy-row:hover, .amy-row:focus-within { background: var(--amy-fill) }
.amy-row[data-flash] { animation: amy-flash 2s var(--amy-ease) }
.amy-rowBody { flex: 1; min-width: 0 }
.amy-text { margin: 0; font-size: 14px; line-height: 22px; color: var(--amy-t1); overflow-wrap: anywhere }
.amy-text mark { background: color-mix(in oklab, #ffd666 55%, transparent); color: inherit; border-radius: 3px; padding: 0 1px; margin: 0 -1px }
.amy-metaWrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s var(--amy-ease) }
.amy-row:hover .amy-metaWrap, .amy-row:focus-within .amy-metaWrap { grid-template-rows: 1fr }
.amy-metaWrap > div { min-height: 0; overflow: hidden }
.amy-meta { display: flex; align-items: center; gap: 5px; margin: 0; font-size: 12px; line-height: 16px; color: var(--amy-t3) }
.amy-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--amy-t4) }
.amy-actions { display: flex; gap: 2px; flex: none; margin: -1px 0 -1px; opacity: 0; transition: opacity .2s }
.amy-row:hover .amy-actions, .amy-row:focus-within .amy-actions { opacity: 1 }
@media (hover: none) {
  .amy-actions { opacity: 1 }
  .amy-metaWrap { grid-template-rows: 1fr }
}
.amy-act { position: relative; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--amy-t3); transition: background-color .16s, color .16s }
.amy-act:hover { background: var(--amy-hover); color: var(--amy-t1) }
.amy-act svg { width: 15px; height: 15px }
.amy-tip { position: absolute; z-index: 5; bottom: calc(100% + 4px); right: 0; padding: 3px 7px; border-radius: 7px; background: var(--amy-main-bg); color: var(--amy-main-fg); font-size: 11px; line-height: 16px; white-space: nowrap; opacity: 0; transform: translateY(2px); pointer-events: none; transition: opacity .14s, transform .2s var(--amy-ease) }
.amy-act:hover .amy-tip, .amy-act:focus-visible .amy-tip { opacity: 1; transform: none }
.amy-avatar { display: grid; place-items: center; flex: none; width: 22px; height: 22px; margin-top: 0; border-radius: 50%; overflow: hidden; font-size: 9px; line-height: 1; font-weight: 600; color: #fff; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .06) }
.amy-avatar img { width: 100%; height: 100%; object-fit: cover }

/* Editing + undo */
.amy-edit { flex: 1; min-width: 0 }
.amy-ta { display: block; width: 100%; min-height: 38px; resize: none; padding: 8px 10px; border-radius: 10px; border: 1px solid color-mix(in oklab, var(--amy-ink) 22%, transparent); background: var(--amy-surface); outline: none; line-height: 20px; box-shadow: 0 0 0 3px var(--amy-fill) }
.amy-editHint { display: flex; align-items: center; gap: 8px; margin: 6px 0 0; font-size: 12px; line-height: 16px; color: var(--amy-t3) }
.amy-editHint .amy-link { margin-left: auto }
.amy-link { padding: 2px 6px; border-radius: 6px; font-size: 12px; font-weight: 500; color: var(--amy-t1); transition: background-color .16s }
.amy-link:hover { background: var(--amy-hover) }
.amy-err { margin: 6px 0 0; font-size: 12px; line-height: 16px; color: var(--amy-bad) }
.amy-undo { position: relative; display: flex; align-items: center; gap: 10px; margin: 2px 0; padding: 8px 8px 10px 12px; border-radius: 12px; background: var(--amy-fill); overflow: hidden; animation: amy-fade .3s var(--amy-ease) backwards }
.amy-undo p { flex: 1; min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--amy-t2) }
.amy-undo .amy-link { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px }
.amy-undo .amy-link svg { width: 13px; height: 13px }
.amy-drain { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--amy-t3); transform-origin: left; animation: amy-drain var(--amy-undo, 5s) linear forwards }

/* Add */
.amy-add { display: flex; align-items: center; gap: 10px; padding: 8px 12px 8px 20px; border-top: 1px solid var(--amy-line); border-radius: 0 0 25px 25px }
.amy-add > svg { width: 16px; height: 16px; color: var(--amy-t3) }
.amy-addField { flex: 1; min-width: 0; height: 36px; border: 0; background: none; outline: none; color: var(--amy-t1) }
.amy-addField::placeholder { color: var(--amy-t3) }
.amy-addField:disabled { opacity: .6 }
.amy-addNote { flex: none; font-size: 12px; color: var(--amy-t3); animation: amy-fade .3s var(--amy-ease) backwards }
.amy-addNote[data-bad] { color: var(--amy-bad) }

@container amy (max-width: 439px) {
  .amy-head { flex-wrap: wrap; padding-inline: 16px }
  .amy-settings { padding-inline: 16px }
  .amy-meter { align-items: flex-start }
  .amy-pillRow { padding-inline: 12px }
  .amy-list { padding-inline: 4px }
  .amy-add { padding-left: 16px }
}

@keyframes amy-fade { from { opacity: 0 } }
@keyframes amy-in { from { opacity: 0; transform: translateY(-14px) scale(.985); filter: blur(2px) } }
@keyframes amy-flash { 0%, 35% { background: var(--amy-flash) } }
@keyframes amy-grow { from { transform: scaleX(0) } }
@keyframes amy-drain { to { transform: scaleX(0) } }
@keyframes amy-bob { 50% { transform: translateY(2px) } }

@media (prefers-reduced-motion: reduce) {
  .amy *, .amy *::before, .amy *::after { animation: none !important; transition: none !important }
  .amy-drain { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const join = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ")
const sourceLabel = (s: string, assistant: string) => (s === "chat" ? "From a chat" : s === "you" ? "Added by you" : s === "agent" ? `Noted by ${assistant}` : s)

const hue = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 11)
function Avatar({ person }: { person: { name: string; avatar?: string } }) {
  const initials = person.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const h = hue(person.name)
  return (
    <span className="amy-avatar" aria-hidden style={{ background: `linear-gradient(135deg, oklch(.72 .12 ${h}), oklch(.55 .14 ${(h + 40) % 360}))` }}>
      {person.avatar ? <img src={person.avatar} alt="" /> : initials}
    </span>
  )
}

function RollInt({ value }: { value: number }) {
  const [shown, setShown] = React.useState(value)
  const from = React.useRef(value)
  React.useEffect(() => {
    const a = from.current
    if (a === value) return
    const t0 = performance.now()
    let id = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 700)
      const v = a + (value - a) * (1 - Math.pow(1 - p, 3))
      from.current = v
      setShown(Math.round(v))
      if (p < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [value])
  return <>{shown}</>
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

/** Fades a changing text in place. */
function Fade({ children }: { children: string }) {
  return <span key={children}>{children}</span>
}

/* -------------------------------------------------------------------------- */
/*                                AgentMemory                                 */
/* -------------------------------------------------------------------------- */

export function AgentMemory({
  memories: memoriesProp,
  captured: capturedProp,
  onChange,
  onToggle,
  settings,
  classify,
  groups = DEFAULT_GROUPS,
  capacity: capacityProp,
  assistantName = "Nova",
  undoSeconds = 5,
  className,
}: AgentMemoryProps) {
  const uid = React.useId()
  const usingSample = memoriesProp === undefined
  const [srcMem, setSrcMem] = React.useState(memoriesProp)
  const [items, setItems] = React.useState<MemoryItem[]>(memoriesProp ?? SAMPLE_MEMORIES)
  if (memoriesProp !== srcMem) {
    setSrcMem(memoriesProp)
    setItems(memoriesProp ?? SAMPLE_MEMORIES)
  }
  const [srcCap, setSrcCap] = React.useState(capturedProp)
  const [captured, setCaptured] = React.useState<CapturedMemory[]>(capturedProp === undefined ? SAMPLE_CAPTURED : (capturedProp ?? []))
  if (capturedProp !== srcCap) {
    setSrcCap(capturedProp)
    setCaptured(capturedProp === undefined ? SAMPLE_CAPTURED : (capturedProp ?? []))
  }

  const [saved, setSaved] = React.useState(settings?.savedMemories ?? true)
  const [history, setHistory] = React.useState(settings?.chatHistory ?? true)
  const [filter, setFilter] = React.useState<string>("all")
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState("")
  const [rowError, setRowError] = React.useState<{ id: string; msg: string } | null>(null)
  const [forgetting, setForgetting] = React.useState<string[]>([])
  const [flash, setFlash] = React.useState<string | null>(null)
  const [pillGone, setPillGone] = React.useState<string | null>(null)
  const [addText, setAddText] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const [addError, setAddError] = React.useState<string | null>(null)
  const [edges, setEdges] = React.useState({ top: false, bottom: false })
  const [announce, setAnnounce] = React.useState("")
  const [bg, setBg] = React.useState({ x: 0, w: 0 })

  const itemsRef = React.useRef(items)
  const timers = React.useRef(new Map<string, number>())
  const listRef = React.useRef<HTMLDivElement>(null)
  const filterRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const searchBtn = React.useRef<HTMLButtonElement>(null)
  const searchIn = React.useRef<HTMLInputElement>(null)
  const actionRefs = React.useRef(new Map<string, HTMLElement>())
  const focusNext = React.useRef<string | null>(null)
  const onChangeRef = React.useRef(onChange)
  const idCounter = React.useRef(0)
  React.useEffect(() => {
    itemsRef.current = items
    onChangeRef.current = onChange
  })
  React.useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  const used = items.reduce((n, m) => n + m.text.length, 0)
  const capacity = capacityProp ?? (usingSample ? Math.round(used / 0.62) : Math.max(2000, used * 2))
  const pct = Math.min(100, Math.round((used / capacity) * 100))
  const full = used >= capacity
  const meterState = full ? "full" : pct >= 90 ? "warn" : "ok"

  const filters = React.useMemo(() => [{ id: "all", label: "All" }, ...groups.map((g) => ({ id: g.id, label: g.label }))], [groups])
  const query = q.trim().toLowerCase()
  const matches = (m: MemoryItem) => !query || m.text.toLowerCase().includes(query) || (m.person?.name.toLowerCase().includes(query) ?? false)
  const matchCount = items.filter(matches).length

  /* Sliding filter background */
  React.useLayoutEffect(() => {
    const i = filters.findIndex((f) => f.id === filter)
    const el = filterRefs.current[i]
    if (el) setBg({ x: el.offsetLeft, w: el.offsetWidth })
  }, [filter, filters, searchOpen])
  /* Scroll edge fades */
  const measureEdges = React.useCallback(() => {
    const el = listRef.current
    if (!el) return
    setEdges({ top: el.scrollTop > 4, bottom: el.scrollHeight - el.scrollTop - el.clientHeight > 4 })
  }, [])
  React.useLayoutEffect(() => {
    measureEdges()
    const el = listRef.current
    if (!el) return
    const ro = new ResizeObserver(measureEdges)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [measureEdges])
  React.useEffect(() => {
    if (!query) return
    const id = requestAnimationFrame(() => setAnnounce(`${matchCount} ${matchCount === 1 ? "memory matches" : "memories match"} ${q.trim()}.`))
    return () => cancelAnimationFrame(id)
  }, [query, matchCount, q])
  React.useEffect(() => {
    const id = focusNext.current
    if (!id) return
    focusNext.current = null
    actionRefs.current.get(id)?.focus({ preventScroll: false })
  })

  /* Commit a change: the parent may reject, which keeps the old list. */
  const commit = async (next: MemoryItem[], change: MemoryChange) => {
    await onChangeRef.current?.(next, change)
    setItems(next)
    return true
  }
  const flashRow = (id: string) => {
    setFlash(id)
    const t = window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 2200)
    timers.current.set(`flash-${id}`, t)
  }

  const nextId = () => `mem-${++idCounter.current}-${items.length}`
  const toggle = (which: "savedMemories" | "chatHistory", on: boolean) => {
    if (which === "savedMemories") setSaved(on)
    else setHistory(on)
    onToggle?.(which, on)
    setAnnounce(`${which === "savedMemories" ? "Reference saved memories" : "Reference chat history"} turned ${on ? "on" : "off"}.`)
  }

  /* Capture from the pill */
  const capture = async (c: CapturedMemory) => {
    const mem: MemoryItem = { id: nextId(), text: c.text, group: c.group, source: "chat", date: "Today", person: c.person }
    const next = [mem, ...itemsRef.current]
    setPillGone(c.id)
    try {
      await commit(next, { type: "capture", memory: mem })
      window.setTimeout(() => {
        setCaptured((l) => l.filter((x) => x.id !== c.id))
        setPillGone(null)
      }, 280)
      if (filter !== "all" && filter !== c.group) setFilter(c.group)
      flashRow(mem.id)
      setAnnounce(`Saved to ${groups.find((g) => g.id === c.group)?.label ?? "memories"}: ${c.text}.`)
      requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${mem.id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }))
    } catch {
      setPillGone(null)
      setAnnounce("Couldn't save that memory.")
    }
  }

  /* Add */
  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = addText.trim()
    if (!text || adding || full || !saved) return
    if (used + text.length > capacity) return setAddError("Not enough room. Forget something first.")
    setAdding(true)
    setAddError(null)
    try {
      const group = (await classify?.(text)) ?? guessGroup(text, groups)
      const mem: MemoryItem = { id: nextId(), text, group: groups.some((g) => g.id === group) ? group : groups[0].id, source: "you", date: "Today" }
      await commit([mem, ...itemsRef.current], { type: "add", memory: mem })
      setAddText("")
      if (filter !== "all" && filter !== mem.group) setFilter(mem.group)
      flashRow(mem.id)
      setAnnounce(`Added to ${groups.find((g) => g.id === mem.group)?.label}: ${text}.`)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Couldn't save that memory.")
    } finally {
      setAdding(false)
    }
  }

  /* Edit */
  const startEdit = (m: MemoryItem) => {
    setEditing(m.id)
    setDraft(m.text)
    setRowError(null)
  }
  const saveEdit = async (m: MemoryItem) => {
    const text = draft.trim()
    if (!text) return
    if (text === m.text) {
      setEditing(null)
      focusNext.current = `edit-${m.id}`
      return
    }
    const mem = { ...m, text }
    try {
      await commit(itemsRef.current.map((x) => (x.id === m.id ? mem : x)), { type: "edit", memory: mem })
      setEditing(null)
      setRowError(null)
      focusNext.current = `edit-${m.id}`
      setAnnounce("Memory saved.")
    } catch (err) {
      setRowError({ id: m.id, msg: err instanceof Error ? err.message : "Couldn't save that change." })
    }
  }
  const cancelEdit = (m: MemoryItem) => {
    setEditing(null)
    setRowError(null)
    focusNext.current = `edit-${m.id}`
  }

  /* Forget + undo */
  const forget = (m: MemoryItem) => {
    setForgetting((l) => [...l, m.id])
    focusNext.current = `undo-${m.id}`
    setAnnounce(`Forgot: ${m.text}. Undo is available for ${undoSeconds} seconds.`)
    const t = window.setTimeout(() => {
      timers.current.delete(m.id)
      const next = itemsRef.current.filter((x) => x.id !== m.id)
      setItems(next)
      setForgetting((l) => l.filter((x) => x !== m.id))
      void onChangeRef.current?.(next, { type: "forget", memory: m })
    }, undoSeconds * 1000)
    timers.current.set(m.id, t)
  }
  const undo = (m: MemoryItem) => {
    const t = timers.current.get(m.id)
    if (t) clearTimeout(t)
    timers.current.delete(m.id)
    setForgetting((l) => l.filter((x) => x !== m.id))
    focusNext.current = `edit-${m.id}`
    setAnnounce(`Restored: ${m.text}.`)
  }

  /* Keyboard */
  const onFilterKey = (e: React.KeyboardEvent) => {
    const i = filters.findIndex((f) => f.id === filter)
    let n = -1
    if (e.key === "ArrowRight") n = (i + 1) % filters.length
    if (e.key === "ArrowLeft") n = (i - 1 + filters.length) % filters.length
    if (e.key === "Home") n = 0
    if (e.key === "End") n = filters.length - 1
    if (n < 0) return
    e.preventDefault()
    setFilter(filters[n].id)
    filterRefs.current[n]?.focus()
  }
  const closeSearch = () => {
    setSearchOpen(false)
    setQ("")
    searchBtn.current?.focus()
  }

  const groupItems = (id: string) => items.filter((m) => m.group === id)
  const visibleGroup = (g: MemoryGroup) => (filter === "all" || filter === g.id) && (!query || groupItems(g.id).some(matches))

  return (
    <section className={join("amy", className)} aria-labelledby={`${uid}-title`} style={{ "--amy-undo": `${undoSeconds}s` } as React.CSSProperties}>
      <style href="agent-memory" precedence="default">{CSS}</style>

      <header className="amy-head">
        <div>
          <h2 id={`${uid}-title`} className="amy-title">Memory</h2>
          <p className="amy-sub">What {assistantName} remembers across chats</p>
        </div>
        <div className="amy-meter" data-s={meterState}>
          <span className="amy-meterLabel" id={`${uid}-meter`}><b><RollInt value={pct} />%</b> full</span>
          <span className="amy-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-labelledby={`${uid}-meter`} aria-valuetext={`${pct} percent full${full ? ". Forget something to add more." : ""}`}>
            <i style={{ transform: `scaleX(${pct / 100})` }} />
          </span>
        </div>
      </header>

      <div className="amy-settings">
        <button type="button" role="switch" aria-checked={saved} aria-describedby={`${uid}-d1`} className="amy-set" onClick={() => toggle("savedMemories", !saved)}>
          <span className="amy-setText">
            <span className="amy-setLabel">Reference saved memories</span>
            <span id={`${uid}-d1`} className="amy-setDesc"><Fade>{saved ? "Uses and adds to the memories below" : "Paused. Memories stay saved but aren't used"}</Fade></span>
          </span>
          <span className="amy-sw" aria-hidden><i /></span>
        </button>
        <button type="button" role="switch" aria-checked={history} aria-describedby={`${uid}-d2`} className="amy-set" onClick={() => toggle("chatHistory", !history)}>
          <span className="amy-setText">
            <span className="amy-setLabel">Reference chat history</span>
            <span id={`${uid}-d2`} className="amy-setDesc"><Fade>{history ? "Searches past chats when they help" : "Off. Past chats aren't searched"}</Fade></span>
          </span>
          <span className="amy-sw" aria-hidden><i /></span>
        </button>
      </div>

      <section className="amy-memories" aria-label="Saved memories">
        <div className="amy-toolbar">
          <div className="amy-filters" role="radiogroup" aria-label="Filter memories" style={{ position: "relative" }} onKeyDown={onFilterKey}>
            <span className="amy-filterBg" aria-hidden style={{ width: bg.w, transform: `translateX(${bg.x}px)` }} />
            {filters.map((f, i) => (
              <button
                key={f.id}
                ref={(el) => void (filterRefs.current[i] = el)}
                type="button"
                role="radio"
                aria-checked={filter === f.id}
                tabIndex={filter === f.id ? 0 : -1}
                className="amy-filter"
                onClick={() => setFilter(f.id)}
              >
                <span className="amy-filterLabel">{f.label}</span>
              </button>
            ))}
          </div>
          <div className="amy-search" data-open={searchOpen ? "" : undefined} role="search">
            <button
              ref={searchBtn}
              type="button"
              className="amy-iconBtn"
              aria-label="Search memories"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen(true)
                requestAnimationFrame(() => searchIn.current?.focus())
              }}
              tabIndex={searchOpen ? -1 : 0}
            >
              <Search aria-hidden />
            </button>
            <input
              ref={searchIn}
              className="amy-searchIn"
              value={q}
              placeholder="Search"
              aria-label="Search memories"
              tabIndex={searchOpen ? 0 : -1}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation()
                  closeSearch()
                }
              }}
            />
            <button type="button" className="amy-iconBtn amy-searchClose" aria-label="Close search" tabIndex={searchOpen ? 0 : -1} onClick={closeSearch}>
              <X aria-hidden />
            </button>
          </div>
        </div>

        {saved && captured.length > 0 && (
          <div className="amy-pillRow">
            <div className="amy-pills">
              {captured.map((c) => (
                <button key={c.id} type="button" className="amy-pill" data-gone={pillGone === c.id ? "" : undefined} onClick={() => capture(c)} aria-label={`Memory updated. ${c.note ?? `Noted: ${c.text}`}. Press to save it to ${groups.find((g) => g.id === c.group)?.label ?? "memories"}.`}>
                  <NotebookPen aria-hidden />
                  <b>Memory updated</b>
                  <span className="amy-pillNote">{c.note ?? `Noted: ${c.text}`}</span>
                  <ArrowDown className="amy-down" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="amy-listWrap" data-top={edges.top ? "" : undefined} data-bottom={edges.bottom ? "" : undefined}>
          <div ref={listRef} className="amy-list" data-off={saved ? undefined : ""} onScroll={measureEdges}>
            <div>
              {groups.map((g) => {
                const list = groupItems(g.id)
                const open = visibleGroup(g)
                const shown = list.filter(matches)
                return (
                  <div key={g.id} className="amy-fold" data-open={open ? "" : undefined} aria-hidden={open ? undefined : true} {...(open ? {} : { inert: true })}>
                    <div>
                      <h3 className="amy-gh" id={`${uid}-g-${g.id}`}>
                        {g.label} <span>{list.length}</span>
                      </h3>
                      {list.length === 0 || (query && shown.length === 0) ? (
                        <p className="amy-empty">{query ? "No memories match." : (g.empty ?? "Nothing here yet.")}</p>
                      ) : (
                        <ul className="amy-rows" aria-labelledby={`${uid}-g-${g.id}`}>
                          {list.map((m) => {
                            const show = matches(m)
                            const isForgot = forgetting.includes(m.id)
                            const isEdit = editing === m.id
                            return (
                              <li key={m.id} className="amy-rowItem" data-id={m.id} data-hide={show ? undefined : ""} {...(show ? {} : { inert: true })}>
                                <div>
                                  {isForgot ? (
                                    <div className="amy-undo">
                                      <p>Forgot “{m.text}”</p>
                                      <button type="button" ref={(el) => void (el ? actionRefs.current.set(`undo-${m.id}`, el) : actionRefs.current.delete(`undo-${m.id}`))} className="amy-link" onClick={() => undo(m)}>
                                        <Undo2 aria-hidden />
                                        Undo
                                      </button>
                                      <span className="amy-drain" aria-hidden />
                                    </div>
                                  ) : isEdit ? (
                                    <div className="amy-row">
                                      {m.person && <Avatar person={m.person} />}
                                      <div className="amy-edit">
                                        <textarea
                                          className="amy-ta"
                                          autoFocus
                                          rows={1}
                                          value={draft}
                                          aria-label={`Edit memory: ${m.text}`}
                                          ref={(el) => {
                                            if (el) {
                                              el.style.height = "auto"
                                              el.style.height = `${el.scrollHeight + 2}px`
                                            }
                                          }}
                                          onChange={(e) => setDraft(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                              e.preventDefault()
                                              void saveEdit(m)
                                            }
                                            if (e.key === "Escape") {
                                              e.stopPropagation()
                                              cancelEdit(m)
                                            }
                                          }}
                                        />
                                        {rowError?.id === m.id && <p className="amy-err" role="alert">{rowError.msg}</p>}
                                        <p className="amy-editHint">
                                          Enter to save, Esc to cancel
                                          <button type="button" className="amy-link" onClick={() => cancelEdit(m)}>Cancel</button>
                                          <button type="button" className="amy-link" style={{ marginLeft: 0 }} onClick={() => void saveEdit(m)}>Save</button>
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="amy-row" data-flash={flash === m.id ? "" : undefined}>
                                      {m.person && <Avatar person={m.person} />}
                                      <div className="amy-rowBody">
                                        <p className="amy-text"><Highlight text={m.text} q={query} /></p>
                                        <div className="amy-metaWrap">
                                          <div>
                                            <p className="amy-meta">
                                              <span>{sourceLabel(m.source, assistantName)}</span>
                                              {m.date && <><span className="amy-dot" aria-hidden /><span>{m.date}</span></>}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="amy-actions">
                                        <button type="button" ref={(el) => void (el ? actionRefs.current.set(`edit-${m.id}`, el) : actionRefs.current.delete(`edit-${m.id}`))} className="amy-act" aria-label={`Edit memory: ${m.text}`} onClick={() => startEdit(m)}>
                                          <Pencil aria-hidden />
                                          <span className="amy-tip" aria-hidden>Edit</span>
                                        </button>
                                        <button type="button" className="amy-act" aria-label={`Forget memory: ${m.text}`} onClick={() => forget(m)}>
                                          <Trash2 aria-hidden />
                                          <span className="amy-tip" aria-hidden>Forget</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <form className="amy-add" onSubmit={submitAdd}>
          <Plus aria-hidden />
          <label className="amy-sr" htmlFor={`${uid}-add`}>Add memory</label>
          <input
            id={`${uid}-add`}
            className="amy-addField"
            value={addText}
            placeholder={full ? "Memory is full" : "Add memory"}
            disabled={adding || full || !saved}
            autoComplete="off"
            aria-describedby={addError || full ? `${uid}-addnote` : undefined}
            onChange={(e) => (setAddText(e.target.value), setAddError(null))}
          />
          {(addError || full) && <span id={`${uid}-addnote`} className="amy-addNote" data-bad="" role="alert">{addError ?? "Forget something to add more"}</span>}
          {adding && <span className="amy-addNote">Saving…</span>}
          {!adding && !addError && !full && addText.trim() && (
            <button type="submit" className="amy-link" aria-label="Save memory"><Check style={{ width: 15, height: 15 }} aria-hidden /></button>
          )}
        </form>
      </section>

      <p className="amy-sr" role="status" aria-live="polite">{announce}</p>
    </section>
  )
}

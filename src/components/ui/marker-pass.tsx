"use client"

import * as React from "react"
import { CalendarClock, FileText, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** One section of the source document. */
export type MarkerPassBlock = {
  /** Section number, "9.3". */
  label?: string
  /** Short section title, "Deletion". */
  title?: string
  /** The paragraph. A highlight's `quote` must appear in it word for word. */
  text: string
}

export type MarkerPassDocument = {
  title: string
  /** Who the document is between, shown under the title. */
  parties?: string
  /** "Page 6 of 18". */
  page?: string
  blocks: MarkerPassBlock[]
}

/** A passage the model used. The order of the array is the order it was read in, and it sets the footnote numbers. */
export type MarkerPassHighlight = {
  id: string
  /** Exact text of the passage inside one block of the document. */
  quote: string
  /** Short name for the footnote list, "Deletion". */
  label: string
  /** Where it sits, "§9.3 · p. 6". */
  where?: string
}

/** The answer is plain text with footnotes between: a string, or `{ cite: highlightId }`. */
export type MarkerPassAnswerPart = string | { cite: string }

export type MarkerPassProps = {
  /** What was asked. */
  question?: string
  /** Name of the agent that answered. */
  agent?: string
  answer?: MarkerPassAnswerPart[]
  document?: MarkerPassDocument
  highlights?: MarkerPassHighlight[]
  /** The real-world consequence, as one sentence under the answer. */
  consequence?: string
  /** Sweep the strokes in when the piece scrolls into view. Off shows the settled state straight away. */
  autoPlay?: boolean
  /** Speed multiplier for the sweep. */
  speed?: number
  /** "split" puts the answer beside the document. "stack" puts a compact answer over a large document and leaves the consequence for last: the shape for a square film. */
  layout?: "split" | "stack"
  /** The highlight that J/K, a click or a hover has selected. Pass it to control the piece. */
  activeId?: string | null
  defaultActiveId?: string | null
  /** Fires when the selected highlight changes (click, Enter, J or K, Esc clears). */
  onActiveChange?: (id: string | null) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo scene data                              */
/* -------------------------------------------------------------------------- */

const DEMO_DOC: MarkerPassDocument = {
  title: "Master services agreement",
  parties: "Meridian Labs and Northwind Clinics",
  page: "Page 6 of 18",
  blocks: [
    {
      label: "9.1",
      title: "Term and renewal",
      text: "This agreement runs for an initial term of twelve (12) months and renews each year unless either party gives sixty (60) days written notice before the renewal date.",
    },
    {
      label: "9.2",
      title: "Export",
      text: "For thirty (30) days after termination, Northwind Clinics may export its scan data in DICOM or CSV format. The first export is free of charge; later exports are billed at the rates in Schedule B.",
    },
    {
      label: "9.3",
      title: "Deletion",
      text: "When the export period ends, Meridian Labs will permanently delete all scan data from its production systems and confirm the deletion in writing within ten (10) business days.",
    },
    {
      label: "9.4",
      title: "Backups",
      text: "Encrypted backups are retained for no more than ninety (90) days and are then overwritten as part of the normal rotation.",
    },
    {
      label: "9.5",
      title: "Legal holds",
      text: "Meridian Labs may keep specific records only where a court order or legal hold requires it, and must tell Northwind Clinics which records and why.",
    },
  ],
}

const DEMO_MARKS: MarkerPassHighlight[] = [
  { id: "delete", quote: "permanently delete all scan data from its production systems", label: "Deletion", where: "§9.3 · p. 6" },
  { id: "hold", quote: "only where a court order or legal hold requires it", label: "Legal hold", where: "§9.5 · p. 6" },
  { id: "export", quote: "may export its scan data in DICOM or CSV format. The first export is free of charge", label: "Export window", where: "§9.2 · p. 6" },
  { id: "backup", quote: "no more than ninety (90) days", label: "Backups", where: "§9.4 · p. 6" },
]

const DEMO_ANSWER: MarkerPassAnswerPart[] = [
  "No. Once the export period ends, Meridian Labs must permanently delete your scan data",
  { cite: "delete" },
  ", unless a court order or legal hold requires it to keep specific records",
  { cite: "hold" },
  ". You can export everything for 30 days after termination, and the first export is free",
  { cite: "export" },
  ". Encrypted backups can linger for up to 90 days before they are overwritten",
  { cite: "backup" },
  ".",
]

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

type Frag = {
  key: string
  id: string
  x: number
  y: number
  w: number
  h: number
  /** Delay and duration of the sweep, ms. */
  d: number
  t: number
  poly: string
  pos: string
  rot: number
  first: boolean
  last: boolean
}

type Stop = { start: number; end: number; y: number; cy: number }

type Layout = { frags: Frag[]; stops: Record<string, Stop> }

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number) {
  let a = seed || 1
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** A marker stroke is never a rectangle: wobbling top and bottom edges, a slanted chisel end, a ragged start. */
function strokeShape(seed: string, w: number, h: number) {
  const r = rng(hash(seed))
  const j = () => r() * 2 - 1
  const n = Math.max(2, Math.round(w / 20))
  const f = (v: number) => v.toFixed(1)
  const pts: string[] = []
  pts.push(`${f(0.4 + r() * 1.6)}px ${f(1.1 + j() * 0.7)}px`)
  for (let k = 1; k < n; k++) pts.push(`${f((w * k) / n)}px ${f(0.9 + j() * 0.9)}px`)
  pts.push(`${f(w - 0.6 - r() * 1.2)}px ${f(1.3 + j() * 0.5)}px`)
  pts.push(`${f(w - 3 - r() * 2)}px ${f(h - 1 + j() * 0.5)}px`)
  for (let k = n - 1; k >= 1; k--) pts.push(`${f((w * k) / n)}px ${f(h - 1 + j() * 0.9)}px`)
  pts.push(`${f(1.6 + r() * 2.2)}px ${f(h - 1.2 + j() * 0.6)}px`)
  return `polygon(${pts.join(", ")})`
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.imk {
  --imk-ink: #000;
  --imk-surface: #fff;
  --imk-accent: #0060e2;
  --imk-t1: color-mix(in oklab, var(--imk-ink) 88%, transparent);
  --imk-t2: color-mix(in oklab, var(--imk-ink) 61%, transparent);
  --imk-t3: color-mix(in oklab, var(--imk-ink) 57%, transparent);
  --imk-t4: color-mix(in oklab, var(--imk-ink) 27%, transparent);
  --imk-fill: color-mix(in oklab, var(--imk-ink) 6%, transparent);
  --imk-line: color-mix(in oklab, var(--imk-ink) 7%, transparent);
  --imk-wash: 30%;
  --imk-dot: 72%;
  --imk-glow: drop-shadow(0 0 0 transparent);
  --imk-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --imk-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --imk-glint: rgb(255 255 255 / .82);
  --imk-ease: cubic-bezier(.22, 1, .36, 1);
  --imk-draw: cubic-bezier(.4, .55, .3, 1);
  --imk-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --imk-serif: "Iowan Old Style", "Palatino Linotype", Palatino, ui-serif, Georgia, "Times New Roman", serif;
  --imk-gut: 14px;
  --imk-pad: 56px;
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 1000px;
  color: var(--imk-t1);
  font-family: var(--imk-font);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .imk {
  --imk-ink: #fff;
  --imk-surface: #1c1c1e;
  --imk-accent: #4d8dff;
  --imk-t1: color-mix(in oklab, var(--imk-ink) 90%, transparent);
  --imk-t2: color-mix(in oklab, var(--imk-ink) 62%, transparent);
  --imk-t3: color-mix(in oklab, var(--imk-ink) 58%, transparent);
  --imk-t4: color-mix(in oklab, var(--imk-ink) 28%, transparent);
  --imk-fill: color-mix(in oklab, var(--imk-ink) 8%, transparent);
  --imk-line: color-mix(in oklab, var(--imk-ink) 9%, transparent);
  --imk-wash: 46%;
  --imk-dot: 78%;
  --imk-glow: drop-shadow(0 0 9px color-mix(in oklab, var(--imk-accent) 40%, transparent));
  --imk-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --imk-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
  --imk-glint: rgb(255 255 255 / .9);
}
.imk *, .imk *::before, .imk *::after { box-sizing: border-box }
:where(.imk) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.imk) h3, :where(.imk) h4, :where(.imk) p, :where(.imk) ol, :where(.imk) li { margin: 0; padding: 0 }
.imk :focus-visible { outline: 2px solid color-mix(in oklab, var(--imk-accent) 60%, transparent); outline-offset: 2px }
.imk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }

.imk-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; align-items: stretch }
@container (min-width: 720px) {
  .imk:not([data-layout="stack"]) .imk-grid { grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr); gap: 16px }
  .imk:not([data-layout="stack"]) .imk-pane { max-height: 660px }
}
@container (max-width: 719px) { .imk:not([data-layout="stack"]) .imk-src { display: none } }

/* ------------------------------- footnote chip ------------------------------- */
.imk-num {
  position: relative; display: inline-grid; place-items: center; flex: none;
  min-width: 18px; height: 18px; padding: 0 4px; border-radius: 6px;
  font: 600 10.5px/1 var(--imk-font); font-variant-numeric: tabular-nums; letter-spacing: 0;
  color: var(--imk-accent);
  background: color-mix(in oklab, var(--imk-accent) 12%, transparent);
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--imk-accent) 40%, transparent);
  transition: background-color .2s var(--imk-ease), color .2s var(--imk-ease), transform .2s var(--imk-ease);
}
.imk-num[data-hot] { background: var(--imk-accent); color: var(--imk-surface); box-shadow: none }
.imk-num[data-timed] { animation: imk-land .7s var(--imk-ease) var(--fd, 0ms) backwards }
.imk-fn { margin: 0 1px 0 3px; vertical-align: 1px; cursor: pointer }
.imk-fn::before { content: ""; position: absolute; inset: -7px -4px }
.imk-fn:active { transform: scale(.94) }

/* --------------------------------- answer card -------------------------------- */
.imk-card { background: var(--imk-surface); box-shadow: var(--imk-shadow); border-radius: 14px }
.imk-ans { display: flex; flex-direction: column; min-width: 0; overflow: hidden }
.imk-q { padding: 16px 18px 14px; border-bottom: .5px solid var(--imk-line) }
.imk-eyebrow { color: var(--imk-t3); font-size: 12px; line-height: 16px }
.imk-q h3 { margin-top: 3px; font-size: 15px; line-height: 21px; font-weight: 500; color: var(--imk-t1); text-wrap: pretty }
.imk-who { display: flex; align-items: center; gap: 9px; padding: 14px 18px 0 }
.imk-av {
  display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 8px;
  background: color-mix(in oklab, var(--imk-accent) 12%, transparent); color: var(--imk-accent); font-size: 12px; font-weight: 600;
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--imk-accent) 30%, transparent);
}
.imk-who b { font-weight: 500; color: var(--imk-t1) }
.imk-who span { color: var(--imk-t3) }
.imk-text-a { padding: 8px 18px 8px; font-size: 15px; line-height: 25px; color: var(--imk-t1); text-wrap: pretty }
.imk-src { padding: 12px 10px 4px; margin-top: 8px; border-top: .5px solid var(--imk-line) }
.imk-src > .imk-eyebrow { display: block; padding: 0 8px 6px }
.imk-src ol { list-style: none; display: grid; gap: 1px }
.imk-row {
  display: flex; align-items: center; gap: 10px; width: 100%; min-height: 34px; padding: 5px 8px; border-radius: 8px;
  transition: background-color .16s;
}
.imk-row:hover, .imk-row[data-hot] { background: var(--imk-fill) }
.imk-row[data-timed] { animation: imk-rowin .5s var(--imk-ease) var(--fd, 0ms) backwards }
.imk-left { padding: 8px 8px 4px; color: var(--imk-t3); font-size: 12px; line-height: 16px; text-wrap: pretty }
.imk-row-t { flex: 1; min-width: 0; font-weight: 500; color: var(--imk-t1) }
.imk-row-w { flex: none; color: var(--imk-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.imk-then {
  display: flex; align-items: flex-start; gap: 10px; margin-top: auto; padding: 12px 18px 15px;
  border-top: .5px solid var(--imk-line); color: var(--imk-t2);
}
.imk-then svg { flex: none; width: 16px; height: 16px; margin-top: 2px; color: var(--imk-t3) }
.imk-then p { text-wrap: pretty }

/* ------------------------------- source document ------------------------------- */
.imk-pane { display: flex; flex-direction: column; min-width: 0; max-height: 420px; overflow: hidden }
.imk-dh { display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 16px; border-bottom: .5px solid var(--imk-line) }
.imk-dh svg.imk-doc { flex: none; width: 16px; height: 16px; color: var(--imk-t3) }
.imk-dt { flex: 1; min-width: 0 }
.imk-dt b { display: block; font-weight: 500; color: var(--imk-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.imk-dt span { display: block; color: var(--imk-t3); font-size: 12px; line-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.imk-pg { color: var(--imk-t3); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap }
.imk-replay {
  display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px 0 7px; border-radius: 7px;
  color: var(--imk-t2); font-weight: 500; transition: background-color .16s, color .16s;
}
.imk-replay:hover { background: var(--imk-fill); color: var(--imk-t1) }
.imk-replay svg { width: 14px; height: 14px; transition: transform .5s var(--imk-ease) }
.imk-replay:hover svg { transform: rotate(-90deg) }
@container (max-width: 520px) { .imk-replay span { display: none } .imk-replay { padding: 0 7px } .imk-pg { display: none } }
.imk-scroll {
  position: relative; flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--imk-t4) transparent;
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 16px, #000 calc(100% - 20px), transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0, #000 16px, #000 calc(100% - 20px), transparent 100%);
}
.imk-scroll:focus-visible { outline-offset: -2px }
.imk-paper { position: relative; padding: 20px 24px 26px var(--imk-pad) }
.imk-paper::before { content: ""; position: absolute; top: 0; bottom: 0; left: calc(var(--imk-pad) - 14px); width: .5px; background: var(--imk-line) }
.imk-text { position: relative; z-index: 1; display: grid; gap: 20px }
.imk-h { display: flex; gap: 7px; align-items: baseline; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--imk-t3); margin-bottom: 4px }
.imk-hn { font-variant-numeric: tabular-nums; color: var(--imk-t3) }
.imk-p { font-family: var(--imk-serif); font-size: 15.5px; line-height: 28px; color: var(--imk-t1); text-wrap: pretty; hyphens: manual }
.imk-m { color: inherit; background: none; cursor: pointer; border-radius: 2px }
.imk-paper:not([data-ink]) .imk-m { background: color-mix(in oklab, var(--imk-accent) 24%, transparent) }

/* strokes: one halftone fragment per line the passage touches */
.imk-strokes { position: absolute; inset: 0; z-index: 0; pointer-events: none }
.imk-frag { position: absolute; transform: rotate(var(--rot, 0deg)); transform-origin: 0 50%; filter: var(--imk-glow); transition: opacity .28s var(--imk-ease) }
.imk-clip { position: absolute; inset: 0 }
.imk-frag:not([data-still]) .imk-clip { animation: imk-sweep var(--t) var(--imk-draw) var(--d) backwards }
.imk-pen { position: absolute; inset: 0 auto 0 0; width: 0; pointer-events: none }
.imk-tip {
  position: absolute; top: 1px; bottom: 1px; left: -3px; width: 7px; border-radius: 4px 5px 5px 4px; opacity: 0;
  background: color-mix(in oklab, var(--imk-accent) 62%, transparent);
  box-shadow: 0 0 12px 1px color-mix(in oklab, var(--imk-accent) 45%, transparent);
}
.imk-frag:not([data-still]) .imk-pen { animation: imk-pen var(--t) var(--imk-draw) var(--d) backwards }
.imk-frag:not([data-still]) .imk-tip { animation: imk-tip var(--t) linear var(--d) backwards }
.imk-ink {
  position: absolute; inset: 0; transform-origin: 0 50%;
  background-color: color-mix(in oklab, var(--imk-accent) var(--imk-wash), transparent);
  box-shadow: inset 0 -2px 2px -1px color-mix(in oklab, var(--imk-accent) 34%, transparent);
  -webkit-mask-image: linear-gradient(90deg, #000 0, #000 50%, rgb(0 0 0 / .72) 100%);
  mask-image: linear-gradient(90deg, #000 0, #000 50%, rgb(0 0 0 / .72) 100%);
  transition: background-color .25s var(--imk-ease);
}
.imk-ink::after {
  content: ""; position: absolute; inset: 0; background-position: var(--pos, 0 0); background-size: 5px 5px;
  background-image: radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--imk-accent) var(--imk-dot), transparent) 0 1.15px, transparent 1.85px);
  -webkit-mask-image: linear-gradient(90deg, #000 0, #000 28%, rgb(0 0 0 / .16) 100%);
  mask-image: linear-gradient(90deg, #000 0, #000 28%, rgb(0 0 0 / .16) 100%);
}
.imk[data-hot] .imk-frag:not([data-hot]) { opacity: .42 }
.imk-frag[data-hot] .imk-ink {
  --imk-wash: 42%; --imk-dot: 100%;
  animation: imk-pulse .66s var(--imk-ease);
}
:is(.dark, [data-theme="dark"]) .imk-frag[data-hot] .imk-ink { --imk-wash: 58% }
.imk-badge {
  position: absolute; left: var(--imk-gut); width: 20px; height: 20px; margin-top: -10px; padding: 0; min-width: 0; pointer-events: auto; cursor: pointer;
  border-radius: 7px; font-size: 11px;
}
.imk-badge::after {
  content: ""; position: absolute; left: calc(100% + 1px); top: 50%; height: 1px; width: calc(var(--imk-pad) - var(--imk-gut) - 24px);
  background: linear-gradient(90deg, color-mix(in oklab, var(--imk-accent) 60%, transparent), color-mix(in oklab, var(--imk-accent) 10%, transparent)); transform-origin: 0 50%;
}
.imk-badge:not([data-still]) { animation: imk-pop .52s var(--imk-ease) var(--fd, 0ms) backwards }
.imk-badge:not([data-still])::after { animation: imk-lead .5s var(--imk-ease) calc(var(--fd, 0ms) + 140ms) backwards }
.imk-badge[data-hot] { box-shadow: 0 0 0 4px color-mix(in oklab, var(--imk-accent) 18%, transparent) }

/* ----------------------------------- footer ----------------------------------- */
.imk-foot {
  display: flex; align-items: center; gap: 12px; padding: 9px 14px 9px 16px; border-top: .5px solid var(--imk-line);
  color: var(--imk-t3); font-size: 12px; line-height: 16px;
}
.imk-keys { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap }
.imk-keys + .imk-keys { margin-left: 4px }
.imk-kbd {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 5px;
  background: var(--imk-fill); color: var(--imk-t2); font: 500 11px/1 ui-monospace, "SF Mono", Menlo, monospace;
  box-shadow: inset 0 -1px 0 color-mix(in oklab, var(--imk-ink) 8%, transparent), inset 0 1px 0 var(--imk-glint);
  transition: background-color .16s, color .16s;
}
.imk:has(.imk-scroll:focus-visible) .imk-kbd { background: color-mix(in oklab, var(--imk-accent) 14%, transparent); color: var(--imk-accent) }
@media (hover: none), (pointer: coarse) { .imk-keys { display: none } }
.imk-stat { margin-left: auto; min-width: 0; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums }
.imk-stat b { font-weight: 500; color: var(--imk-t2) }
@container (max-width: 520px) { .imk-keys { display: none } }

@keyframes imk-sweep { from { clip-path: inset(-4px 100% -4px 0) } to { clip-path: inset(-4px -4px -4px 0) } }
@keyframes imk-pen { from { transform: translateX(0) } to { transform: translateX(var(--w, 0px)) } }
@keyframes imk-tip { 0% { opacity: 0 } 8% { opacity: 1 } 84% { opacity: 1 } 100% { opacity: 0 } }
@keyframes imk-pop { from { opacity: 0; transform: translateY(3px) scale(.82); filter: blur(3px) } to { opacity: 1; transform: none; filter: blur(0) } }
@keyframes imk-lead { from { transform: scaleX(0); opacity: 0 } to { transform: scaleX(1); opacity: 1 } }
@keyframes imk-land {
  0% { opacity: .34; transform: scale(.9); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--imk-accent) 20%, transparent), 0 0 0 0 transparent }
  38% { opacity: 1; transform: scale(1.2); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--imk-accent) 40%, transparent), 0 0 0 5px color-mix(in oklab, var(--imk-accent) 24%, transparent) }
  100% { opacity: 1; transform: none; box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--imk-accent) 40%, transparent), 0 0 0 0 transparent }
}
@keyframes imk-rowin { from { opacity: .3 } to { opacity: 1 } }
@keyframes imk-pulse { 0% { transform: scale(1, 1) } 34% { transform: scale(1.012, 1.46) } 100% { transform: scale(1, 1) } }

.imk[data-live="false"] :is(.imk-clip, .imk-pen, .imk-tip, .imk-num, .imk-row, .imk-ink, .imk-badge) { animation-play-state: paused }
.imk[data-live="false"] .imk-badge::after { animation-play-state: paused }

/* stacked layout: a compact answer over a large document, the consequence last */
.imk[data-layout="stack"] { max-width: 780px; --imk-pad: 62px }
.imk[data-layout="stack"] .imk-src { display: none }
.imk[data-layout="stack"] .imk-pane { max-height: none }
.imk[data-layout="stack"] .imk-q h3 { font-size: 17px; line-height: 24px }
.imk[data-layout="stack"] .imk-text-a { font-size: 16.5px; line-height: 28px }
.imk[data-layout="stack"] .imk-p { font-size: 19px; line-height: 32px }
.imk[data-layout="stack"] .imk-h { font-size: 13px; line-height: 18px }
.imk[data-layout="stack"] .imk-text { gap: 22px }
.imk-then-solo { margin: 0; padding: 14px 18px 15px; border-top: 0 }

@container (max-width: 560px) {
  .imk-paper { padding-right: 16px }
  .imk-p { font-size: 14.5px; line-height: 26px }
  .imk-q h3 { font-size: 14.5px }
  .imk[data-layout="stack"] .imk-p { font-size: 16.5px; line-height: 28px }
  .imk[data-layout="stack"] .imk-q h3 { font-size: 15.5px }
  .imk[data-layout="stack"] .imk-text-a { font-size: 15px; line-height: 25px }
}
@container (max-width: 420px) {
  .imk-paper { --imk-pad: 42px; --imk-gut: 8px }
}
@media (prefers-reduced-motion: reduce) {
  .imk *, .imk *::before, .imk *::after { animation: none !important; transition: none !important }
  .imk-replay { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const EST_STEP = 1700

/**
 * Marker Pass: see which passages of a document an answer was grounded in. Halftone marker strokes sweep across
 * the source in the order the model read it, each with a numbered footnote. Hover or focus a footnote to pulse its
 * stroke; J and K jump between highlights.
 */
export function MarkerPass({
  question = "If we cancel, can Meridian\u00a0Labs keep our patient\u00a0scans?",
  agent = "Sage",
  answer = DEMO_ANSWER,
  document: doc = DEMO_DOC,
  highlights = DEMO_MARKS,
  consequence = "Cancel on 31 March and exports close on 30 April. Sage will remind 3 admins on 23 April.",
  autoPlay = true,
  speed = 1,
  layout = "split",
  activeId,
  defaultActiveId = null,
  onActiveChange,
  className,
}: MarkerPassProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const paneRef = React.useRef<HTMLDivElement>(null)
  const paperRef = React.useRef<HTMLDivElement>(null)
  const quoteRefs = React.useRef(new Map<string, HTMLElement>())
  const layoutRef = React.useRef<Layout | null>(null)
  const lastKey = React.useRef("")
  const userScrolled = React.useRef(false)

  const [geo, setGeo] = React.useState<Layout | null>(null)
  const [run, setRun] = React.useState(0)
  const [still, setStill] = React.useState(!autoPlay)
  const [peek, setPeek] = React.useState<string | null>(null)
  const [cursorState, setCursorState] = React.useState<string | null>(defaultActiveId)
  const [reading, setReading] = React.useState<string | null>(null)
  const [inView, setInView] = React.useState(true)
  const [tabOn, setTabOn] = React.useState(true)

  const cursor = activeId !== undefined ? activeId : cursorState
  const hot = peek ?? cursor

  /* Only passages that are really placed in the document get a stroke and a number. */
  const { marks, parsed } = React.useMemo(() => {
    const seen = new Set<string>()
    const cands = highlights.filter((h) => {
      if (!h.quote || seen.has(h.id) || !doc.blocks.some((b) => b.text.includes(h.quote))) return false
      seen.add(h.id)
      return true
    })
    const used = new Set<string>()
    const rows = doc.blocks.map((block) => {
      const hits = cands
        .map((m) => ({ m, at: used.has(m.id) ? -1 : block.text.indexOf(m.quote) }))
        .filter((x) => x.at >= 0)
        .sort((a, b) => a.at - b.at)
      const parts: Array<string | { m: MarkerPassHighlight }> = []
      let pos = 0
      for (const x of hits) {
        if (x.at < pos) continue
        used.add(x.m.id)
        if (x.at > pos) parts.push(block.text.slice(pos, x.at))
        parts.push({ m: x.m })
        pos = x.at + x.m.quote.length
      }
      if (pos < block.text.length) parts.push(block.text.slice(pos))
      return { block, parts }
    })
    return { marks: cands.filter((m) => used.has(m.id)), parsed: rows }
  }, [highlights, doc])
  const markIndex = React.useMemo(() => new Map(marks.map((m, i) => [m.id, i])), [marks])

  /* ------------------------------- measuring ------------------------------- */
  const measure = React.useCallback(() => {
    const paper = paperRef.current
    if (!paper) return
    const pr = paper.getBoundingClientRect()
    const frags: Frag[] = []
    const stops: Record<string, Stop> = {}
    let t = 380 / speed
    marks.forEach((m) => {
      const el = quoteRefs.current.get(m.id)
      if (!el) return
      const rects = Array.from(el.getClientRects()).filter((r) => r.width > 2 && r.height > 2)
      if (!rects.length) return
      const start = t
      rects.forEach((r, j) => {
        const x = Math.round((r.left - pr.left - 4) * 2) / 2
        const y = Math.round((r.top - pr.top - 4.5) * 2) / 2
        const w = Math.round((r.width + 8) * 2) / 2
        const h = Math.round((r.height + 9) * 2) / 2
        const dur = Math.round(clamp(330 + r.width * 1.1, 460, 760) / speed)
        const rr = rng(hash(`${m.id}:${j}:dots`))
        frags.push({
          key: `${m.id}-${j}`, id: m.id, x, y, w, h, d: Math.round(t), t: dur,
          poly: strokeShape(`${m.id}:${j}`, w, h),
          pos: `${(rr() * 5).toFixed(1)}px ${(rr() * 5).toFixed(1)}px`,
          rot: Math.round((rr() * 1.0 - 0.4) * 100) / 100,
          first: j === 0, last: false,
        })
        t += dur + 90 / speed
      })
      stops[m.id] = { start, end: t, y: Math.round(rects[0].top - pr.top), cy: Math.round(rects[0].top - pr.top + rects[0].height / 2) }
      t += 620 / speed
    })
    /* Two passages that start on the same line would stack their badges: nudge the later one down a line. */
    Object.values(stops)
      .sort((a, b) => a.cy - b.cy)
      .forEach((s, i, all) => {
        if (i > 0 && s.cy - all[i - 1].cy < 28) s.cy = all[i - 1].cy + 28
      })
    if (frags.length) frags[frags.length - 1].last = true
    const key = frags.map((f) => `${f.key}:${f.x},${f.y},${f.w},${f.h},${f.d}`).join("|")
    if (key === lastKey.current) return
    lastKey.current = key
    const next = { frags, stops }
    layoutRef.current = next
    setGeo(next)
  }, [marks, speed])

  React.useEffect(() => {
    const paper = paperRef.current
    if (!paper) return
    let dead = false
    const ro = new ResizeObserver(() => measure())
    ro.observe(paper)
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!dead) measure()
      })
    }
    return () => {
      dead = true
      ro.disconnect()
    }
  }, [measure])

  /* Pause off screen and in a hidden tab. */
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    const on = () => setTabOn(!document.hidden)
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])

  /* ------------------------------ interaction ------------------------------ */
  const reveal = React.useCallback((id: string, smooth: boolean) => {
    const pane = paneRef.current
    const stop = layoutRef.current?.stops[id]
    if (!pane || !stop) return
    const top = pane.scrollTop
    const vh = pane.clientHeight
    if (stop.y > top + 36 && stop.y < top + vh - 72) return
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    pane.scrollTo({ top: Math.max(0, stop.y - vh * 0.32), behavior: smooth && !calm ? "smooth" : "auto" })
  }, [])

  const select = (id: string | null, scroll: boolean) => {
    setCursorState(id)
    onActiveChange?.(id)
    if (id && scroll) {
      userScrolled.current = true
      reveal(id, true)
    }
  }

  const step = (dir: 1 | -1) => {
    if (!marks.length) return
    const idx = cursor ? marks.findIndex((m) => m.id === cursor) : -1
    const next = idx === -1 ? (dir === 1 ? 0 : marks.length - 1) : (idx + dir + marks.length) % marks.length
    select(marks[next].id, true)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === "j") {
      e.preventDefault()
      step(1)
    } else if (k === "k") {
      e.preventDefault()
      step(-1)
    } else if (e.key === "Escape" && cursor) {
      select(null, false)
    }
  }

  const replay = () => {
    userScrolled.current = false
    paneRef.current?.scrollTo({ top: 0, behavior: "auto" })
    setStill(false)
    setReading(null)
    setCursorState(null)
    onActiveChange?.(null)
    setRun((r) => r + 1)
  }

  const onSweepStart = (e: React.AnimationEvent) => {
    if (e.animationName !== "imk-sweep") return
    const el = (e.target as HTMLElement).closest<HTMLElement>(".imk-frag")
    if (!el || el.dataset.first !== "1" || !el.dataset.id) return
    setReading(el.dataset.id)
    if (!userScrolled.current) reveal(el.dataset.id, true)
  }
  const onSweepEnd = (e: React.AnimationEvent) => {
    if (e.animationName !== "imk-sweep") return
    const el = (e.target as HTMLElement).closest<HTMLElement>(".imk-frag")
    if (el?.dataset.last === "1") {
      setStill(true)
      setReading(null)
    }
  }

  const bind = (id: string) => ({
    onPointerEnter: () => setPeek(id),
    onPointerLeave: () => setPeek(null),
    onFocus: () => setPeek(id),
    onBlur: () => setPeek(null),
  })

  const total = marks.length
  const unused = parsed.filter((x) => !x.parts.some((p) => typeof p !== "string")).map((x) => x.block)
  const cursorMark = cursor ? marks.find((m) => m.id === cursor) : undefined
  const readingMark = !still && reading ? marks.find((m) => m.id === reading) : undefined
  const startOf = (id: string) => geo?.stops[id]?.start ?? 380 + (markIndex.get(id) ?? 0) * EST_STEP
  const chipDelay = (id: string) => ({ "--fd": `${Math.round(startOf(id))}ms` }) as React.CSSProperties
  const timed = !still ? "" : undefined

  return (
    <div
      ref={rootRef}
      className={cn("imk", className)}
      data-layout={layout}
      data-hot={hot ? "" : undefined}
      data-live={inView && tabOn ? "true" : "false"}
      onKeyDown={onKeyDown}
    >
      <style href="marker-pass" precedence="default">{CSS}</style>
      <div className="imk-grid">
        {/* ------------------------------- the answer ------------------------------- */}
        <section className="imk-card imk-ans" aria-label="Answer">
          <div className="imk-q">
            <span className="imk-eyebrow">You asked</span>
            <h3>{question}</h3>
          </div>
          <div className="imk-who">
            <span className="imk-av" aria-hidden="true">{agent.slice(0, 1)}</span>
            <span>
              <b>{agent}</b> <span>read the document and used {total} {total === 1 ? "passage" : "passages"}</span>
            </span>
          </div>
          <p key={`a${run}`} className="imk-text-a">
            {answer.map((part, i) => {
              if (typeof part === "string") return <React.Fragment key={i}>{part}</React.Fragment>
              const idx = markIndex.get(part.cite)
              if (idx === undefined) return null
              const m = marks[idx]
              return (
                <React.Fragment key={i}>
                  {"\u2060"}
                <button
                  type="button"
                  className="imk-num imk-fn"
                  data-hot={hot === m.id ? "" : undefined}
                  data-timed={timed}
                  style={chipDelay(m.id)}
                  aria-label={`Source ${idx + 1}: ${m.label}${m.where ? `, ${m.where}` : ""}`}
                  aria-pressed={cursor === m.id}
                  onClick={() => select(cursor === m.id ? null : m.id, true)}
                  {...bind(m.id)}
                >
                  {idx + 1}
                </button>
                </React.Fragment>
              )
            })}
          </p>
          <div className="imk-src">
            <span className="imk-eyebrow">In the order {agent} read them</span>
            <ol key={`s${run}`}>
              {marks.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="imk-row"
                    data-hot={hot === m.id ? "" : undefined}
                    data-timed={timed}
                    style={chipDelay(m.id)}
                    aria-pressed={cursor === m.id}
                    onClick={() => select(cursor === m.id ? null : m.id, true)}
                    {...bind(m.id)}
                  >
                    <span className="imk-num" data-hot={hot === m.id ? "" : undefined} aria-hidden="true">{i + 1}</span>
                    <span className="imk-row-t">{m.label}</span>
                    {m.where ? <span className="imk-row-w">{m.where}</span> : null}
                  </button>
                </li>
              ))}
            </ol>
            {unused.length ? (
              <p className="imk-left">
                Left out: {unused.map((b) => [b.label, b.title].filter(Boolean).join(" ")).join(", ")}
              </p>
            ) : null}
          </div>
          {consequence && layout !== "stack" ? (
            <div className="imk-then">
              <CalendarClock aria-hidden="true" />
              <p>{consequence}</p>
            </div>
          ) : null}
        </section>

        {/* ------------------------------ the document ------------------------------ */}
        <section className="imk-card imk-pane" aria-label="Source document">
          <div className="imk-dh">
            <FileText className="imk-doc" aria-hidden="true" />
            <div className="imk-dt">
              <b>{doc.title}</b>
              {doc.parties ? <span>{doc.parties}</span> : null}
            </div>
            {doc.page ? <span className="imk-pg">{doc.page}</span> : null}
            <button type="button" className="imk-replay" onClick={replay} aria-label="Replay the highlighting">
              <RotateCcw aria-hidden="true" />
              <span>Replay</span>
            </button>
          </div>
          <div
            ref={paneRef}
            className="imk-scroll"
            tabIndex={0}
            role="region"
            aria-label={`${doc.title}, with ${total} highlighted passages`}
            aria-keyshortcuts="J K"
            onWheel={() => (userScrolled.current = true)}
            onTouchStart={() => (userScrolled.current = true)}
            onPointerDown={() => (userScrolled.current = true)}
          >
            <div ref={paperRef} className="imk-paper" data-ink={geo ? "" : undefined}>
              <div
                key={run}
                className="imk-strokes"
                aria-hidden="true"
                onAnimationStart={onSweepStart}
                onAnimationEnd={onSweepEnd}
              >
                {geo?.frags.map((f) => (
                  <span
                    key={f.key}
                    className="imk-frag"
                    data-id={f.id}
                    data-first={f.first ? "1" : undefined}
                    data-last={f.last ? "1" : undefined}
                    data-still={still ? "" : undefined}
                    data-hot={hot === f.id ? "" : undefined}
                    style={{ left: f.x, top: f.y, width: f.w, height: f.h, "--d": `${f.d}ms`, "--t": `${f.t}ms`, "--w": `${f.w}px`, "--rot": `${f.rot}deg` } as React.CSSProperties}
                  >
                    <span className="imk-clip">
                      <span className="imk-ink" style={{ clipPath: f.poly, "--pos": f.pos } as React.CSSProperties} />
                    </span>
                    <span className="imk-pen">
                      <span className="imk-tip" />
                    </span>
                  </span>
                ))}
                {geo
                  ? marks.map((m, i) => {
                      const s = geo.stops[m.id]
                      if (!s) return null
                      return (
                        <span
                          key={m.id}
                          className="imk-num imk-badge"
                          data-hot={hot === m.id ? "" : undefined}
                          data-still={still ? "" : undefined}
                          style={{ top: s.cy, "--fd": `${Math.round(s.start + 60)}ms` } as React.CSSProperties}
                          onPointerEnter={() => setPeek(m.id)}
                          onPointerLeave={() => setPeek(null)}
                          onClick={() => select(cursor === m.id ? null : m.id, false)}
                        >
                          {i + 1}
                        </span>
                      )
                    })
                  : null}
              </div>
              <div className="imk-text">
                {parsed.map(({ block, parts }, bi) => (
                  <div key={bi}>
                    {block.label || block.title ? (
                      <h4 className="imk-h">
                        {block.label ? <span className="imk-hn">{block.label}</span> : null}
                        {block.title ? <span>{block.title}</span> : null}
                      </h4>
                    ) : null}
                    <p className="imk-p">
                      {parts.map((part, pi) => {
                        if (typeof part === "string") return <React.Fragment key={pi}>{part}</React.Fragment>
                        const m = part.m
                        return (
                          <mark
                            key={pi}
                            className="imk-m"
                            ref={(el) => {
                              if (el) quoteRefs.current.set(m.id, el)
                              else quoteRefs.current.delete(m.id)
                            }}
                            onPointerEnter={() => setPeek(m.id)}
                            onPointerLeave={() => setPeek(null)}
                            onClick={() => select(cursor === m.id ? null : m.id, false)}
                          >
                            {m.quote}
                            <span className="imk-sr"> (source {(markIndex.get(m.id) ?? 0) + 1})</span>
                          </mark>
                        )
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="imk-foot">
            <span className="imk-keys">
              <kbd className="imk-kbd">J</kbd>
              <span className="imk-lbl">next</span>
            </span>
            <span className="imk-keys">
              <kbd className="imk-kbd">K</kbd>
              <span className="imk-lbl">previous</span>
            </span>
            <span className="imk-stat" aria-hidden="true">
              {cursorMark ? (
                <>
                  <b>
                    Passage {(markIndex.get(cursorMark.id) ?? 0) + 1} of {total}
                  </b>
                  {" · "}
                  {cursorMark.label}
                </>
              ) : readingMark ? (
                <>
                  <b>
                    Reading {(markIndex.get(readingMark.id) ?? 0) + 1} of {total}
                  </b>
                  {" · "}
                  {readingMark.label}
                </>
              ) : (
                `${total} ${total === 1 ? "passage" : "passages"} highlighted`
              )}
            </span>
          </div>
        </section>
        {consequence && layout === "stack" ? (
          <div className="imk-card imk-then imk-then-solo">
            <CalendarClock aria-hidden="true" />
            <p>{consequence}</p>
          </div>
        ) : null}
      </div>
      <p className="imk-sr" aria-live="polite">
        {cursorMark ? `Source ${(markIndex.get(cursorMark.id) ?? 0) + 1} of ${total}: ${cursorMark.label}` : ""}
      </p>
    </div>
  )
}

export default MarkerPass

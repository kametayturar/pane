"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, Clock, Minus, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Schema                                   */
/* -------------------------------------------------------------------------- */
/*  The tiny schema an agent streams. One flat list of parts in document order;  */
/*  each part has an `id` and a `type`. Send a part as soon as it is ready, or   */
/*  send `{ id, type, pending: true }` first to reserve its place as a skeleton. */

/** Colour of a number or a cell. Words travel with it: the arrow, the sign, the label. Green means good and red means bad, whichever way the arrow points. */
export type AssemblerTone = "good" | "bad" | "neutral"

/** One big number with an optional change line. */
export type AssemblerKpi = {
  label: string
  value: string
  /** The change, without the direction word: "17.0% vs Q2". The direction word and arrow come from `trend`. */
  delta?: string
  trend?: "up" | "down" | "flat"
  /** Defaults to good for up, bad for down, neutral for flat. Override when down is good (wait time). */
  tone?: AssemblerTone
}

export type AssemblerColumn = {
  label: string
  align?: "left" | "right"
  /** Relative width (fr). Defaults to 2.4 for the first column and 1 for the rest. */
  fr?: number
}
export type AssemblerCell = string | number | { text: string; tone?: AssemblerTone }

/** A button in an actions part. */
export type AssemblerAction = {
  id: string
  label: string
  kind?: "primary" | "default"
  /** Ids of parts that must have arrived before this button works. Until then it is dimmed and says what it waits for. */
  needs?: string[]
  /** If set, pressing the button morphs it into this label ("Queued for 09:00"). */
  doneLabel?: string
  /** The header status line once this action is done: "Queued · 14 investors at 09:00". Say it once, here, not in a note. */
  doneNote?: string
  /** Replaces the title badge once this action is done: "Queued". It turns green. */
  doneBadge?: string
}

export type AssemblerTitle = { id: string; type: "title"; text: string; subtitle?: string; badge?: string }
export type AssemblerKpis = { id: string; type: "kpis"; items: AssemblerKpi[] }
export type AssemblerChart = {
  id: string
  type: "chart"
  title?: string
  unit?: string
  series: number[]
  labels?: string[]
  /** Where the value axis starts. Defaults to 0. A higher base makes growth visible, and the header says so ("axis from 380"). */
  base?: number
  /** A dashed reference line: dashed means planned, solid means real. */
  target?: { value: number; label?: string }
  /** Index of the bar drawn in the accent colour with its value printed. Defaults to the last. */
  highlight?: number
  caption?: string
}
export type AssemblerTable = {
  id: string
  type: "table"
  title?: string
  columns: AssemblerColumn[]
  rows: AssemblerCell[][]
  caption?: string
}
export type AssemblerActions = { id: string; type: "actions"; note?: string; items: AssemblerAction[] }

export type AssemblerNode = AssemblerTitle | AssemblerKpis | AssemblerChart | AssemblerTable | AssemblerActions

/** A part whose place is reserved but whose data has not arrived yet. It stays a skeleton. */
export type AssemblerPending = { id: string; type: AssemblerNode["type"]; pending: true }

/** What `nodes` accepts: finished parts and pending placeholders, in document order. */
export type AssemblerPart = AssemblerNode | AssemblerPending

export type AssemblerProps = {
  /** The component tree, in document order. Omit it to render the built-in investor update. */
  nodes?: AssemblerPart[]
  /** Arrival order for the built-in playback (ids). Defaults to document order. */
  order?: string[]
  /**
   * true (default): play the arrival of `nodes` on mount, one part at a time.
   * false: you are streaming yourself. Parts present at mount are shown settled; parts you add later arrive as skeletons.
   */
  stream?: boolean
  /** Milliseconds between arrivals in the built-in playback. */
  stepMs?: number
  /** How long a part stays a skeleton before it settles. */
  skeletonMs?: number
  /** Force the building hairline and status on or off, e.g. while your agent is still sending. */
  building?: boolean
  /** Who is building the view. */
  agent?: { name: string }
  /** A button was pressed. Do the real work here. */
  onAction?: (action: AssemblerAction, node: AssemblerActions) => void
  /** Undo was pressed on a finished action. Cancel what onAction started. Without it the card shows no Undo, because it cannot cancel anything itself. */
  onUndo?: (action: AssemblerAction, node: AssemblerActions) => void
  /** Every part has settled. */
  onDone?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Sample data                               */
/* -------------------------------------------------------------------------- */

const SAMPLE_NODES: AssemblerNode[] = [
  { id: "title", type: "title", text: "Q3 investor update", subtitle: "Harbor & Finch · July to September", badge: "Draft, not sent" },
  {
    id: "kpis",
    type: "kpis",
    items: [
      { label: "Revenue", value: "$1.83M", delta: "27.3% vs Q2", trend: "up" },
      { label: "Net retention", value: "112%", delta: "3 pts", trend: "up" },
      { label: "New customers", value: "38", delta: "9 vs Q2", trend: "up" },
      { label: "Runway", value: "22 mo", delta: "1 mo", trend: "down" },
    ],
  },
  {
    id: "chart",
    type: "chart",
    title: "Revenue by month",
    unit: "$ thousands",
    series: [450, 478, 510, 548, 600, 682],
    labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    base: 380,
    target: { value: 640, label: "Plan 640" },
    caption: "September beat plan by 6.6%, the first month above the line.",
  },
  {
    id: "table",
    type: "table",
    title: "Largest accounts",
    columns: [{ label: "Account" }, { label: "Plan" }, { label: "MRR", align: "right" }, { label: "Change", align: "right" }],
    rows: [
      ["Northwind Clinics", "Scale", "$48.2k", { text: "+12%", tone: "good" }],
      ["Meridian Labs", "Scale", "$41.7k", { text: "+8%", tone: "good" }],
      ["Linden Row Studio", "Team", "$29.4k", { text: "+21%", tone: "good" }],
      ["Kestrel Freight", "Team", "$26.0k", { text: "−3%", tone: "bad" }],
    ],
    caption: "Kestrel Freight is the only top account losing MRR.",
  },
  {
    id: "actions",
    type: "actions",
    note: "Sends to 14 investors at 09:00",
    items: [
      {
        id: "send",
        label: "Send update",
        kind: "primary",
        needs: ["chart"],
        doneLabel: "Queued for 09:00",
        doneNote: "Queued · 14 investors at 09:00 tomorrow",
        doneBadge: "Queued",
      },
      { id: "edit", label: "Edit draft" },
    ],
  },
]

/**
 * The built-in scene: `nodes` in document order, `order` in the order Atlas finishes them.
 * The chart is slow, so it arrives last. Its place is reserved as a skeleton as soon as the table below it lands.
 */
export const ASSEMBLER_SAMPLE = {
  nodes: SAMPLE_NODES,
  order: ["title", "kpis", "table", "actions", "chart"],
} as const satisfies { nodes: readonly AssemblerNode[]; order: readonly string[] }

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const EASE = "cubic-bezier(.22, 1, .36, 1)"

/** Wall clock, only ever read inside effects. */
const nowMs = () => Date.now()

const RM = "(prefers-reduced-motion: reduce)"
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia?.(RM)
  mq?.addEventListener("change", cb)
  return () => mq?.removeEventListener("change", cb)
}
const readRM = () => !!window.matchMedia?.(RM).matches
/** Reduced motion, as an external store: the server says false, the client corrects itself and follows the setting. */
const useReducedMotion = () => React.useSyncExternalStore(subscribeRM, readRM, () => false)

const isPending = (n: AssemblerPart): n is AssemblerPending => "pending" in n && n.pending === true

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

/** Runtime guard: agents send JSON, so never trust the shape. Anything half-sent becomes a calm placeholder. */
function isComplete(n: AssemblerNode): boolean {
  switch (n.type) {
    case "title":
      return typeof n.text === "string" && n.text.length > 0
    case "kpis":
      return Array.isArray(n.items) && n.items.length > 0 && n.items.every((k) => isObj(k) && typeof k.label === "string" && (typeof k.value === "string" || typeof k.value === "number"))
    case "chart":
      return Array.isArray(n.series) && n.series.length >= 2 && n.series.every((v) => Number.isFinite(v)) && (n.labels === undefined || Array.isArray(n.labels))
    case "table":
      return Array.isArray(n.columns) && n.columns.length > 0 && n.columns.every((c) => isObj(c) && typeof c.label === "string") && Array.isArray(n.rows) && n.rows.every((r) => Array.isArray(r))
    case "actions":
      return Array.isArray(n.items) && n.items.length > 0 && n.items.every((a) => isObj(a) && typeof a.id === "string" && typeof a.label === "string")
    default:
      return false
  }
}

const PLACEHOLDER: Record<string, string> = {
  title: "Waiting for the title",
  kpis: "Waiting for the key numbers",
  chart: "Waiting for the chart data",
  table: "Waiting for the table rows",
  actions: "Waiting for the actions",
}

function describe(n: AssemblerPart): string {
  if (isPending(n)) return `+ ${n.type} · waiting for data`
  switch (n.type) {
    case "title":
      return `+ title · ${n.text?.length > 28 ? `${n.text.slice(0, 27)}…` : (n.text ?? "")}`
    case "kpis":
      return `+ kpis · ${n.items?.length ?? 0} numbers`
    case "chart":
      return `+ chart · ${n.series?.length ?? 0} values`
    case "table":
      return `+ table · ${n.rows?.length ?? 0} rows`
    case "actions":
      return `+ actions · ${n.items?.length ?? 0} buttons`
    default:
      return `+ ${(n as { type: string }).type} · not in the catalogue`
  }
}

const low = (t?: string) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : "")

/** What the agent is doing right now, as a verb phrase for the header. */
function verb(n: AssemblerPart): string {
  if (isPending(n)) return `reserving the ${n.type}`
  switch (n.type) {
    case "title":
      return "writing the title"
    case "kpis":
      return "adding the key numbers"
    case "chart":
      return `drawing ${low(n.title) || "the chart"}`
    case "table":
      return `filling in ${low(n.title) || "the table"}`
    case "actions":
      return "wiring up the buttons"
    default:
      return "adding a part"
  }
}

const sv = (i: number) => ({ "--i": i }) as React.CSSProperties

/** Shared by the chart and its skeleton, so the skeleton has the real bars' count and relative heights. */
function chartScale(node: { series?: unknown; base?: number; target?: { value: number } }) {
  const series = (Array.isArray(node.series) ? node.series : []).filter((v): v is number => Number.isFinite(v))
  const lo = Number.isFinite(node.base) ? (node.base as number) : 0
  const top = Math.max(...series, node.target?.value ?? 0, 0) * 1.04
  const span = top - lo > 0 ? top - lo : 1
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / span) * 100))
  return { series, lo, pct }
}

function trendTone(k: AssemblerKpi): AssemblerTone {
  if (k.tone) return k.tone
  return k.trend === "up" ? "good" : k.trend === "down" ? "bad" : "neutral"
}

/** Pause loops and the built-in playback while off screen or in a hidden tab. */
function useActive(ref: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = React.useState(true)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let inView = true
    const update = () => setActive(inView && !document.hidden)
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((es) => {
      inView = es[es.length - 1].isIntersecting
      update()
    })
    io?.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io?.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [ref])
  return active
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ias {
  --ias-ink: #000;
  --ias-surface: #fff;
  --ias-accent: #0060e2;
  --ias-t1: color-mix(in oklab, var(--ias-ink) 88%, transparent);
  --ias-t2: color-mix(in oklab, var(--ias-ink) 61%, transparent);
  --ias-t3: color-mix(in oklab, var(--ias-ink) 52%, transparent);
  --ias-t4: color-mix(in oklab, var(--ias-ink) 27%, transparent);
  --ias-fill: color-mix(in oklab, var(--ias-ink) 6%, transparent);
  --ias-line: color-mix(in oklab, var(--ias-ink) 6%, transparent);
  --ias-bar: color-mix(in oklab, var(--ias-ink) 11%, transparent);
  --ias-glow: 0 10px 22px -8px color-mix(in oklab, var(--ias-accent) 55%, transparent);
  --ias-good: #17874a;
  --ias-bad: #d23a2e;
  --ias-warn: #a96400;
  --ias-glint: rgb(255 255 255 / .75);
  --ias-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ias-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 2px rgb(0 0 0 / .08), 0 14px 28px -10px rgb(0 0 0 / .2);
  --ias-ease: cubic-bezier(.22, 1, .36, 1);
  --ias-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --ias-mono: ui-monospace, "Geist Mono", "SF Mono", Menlo, monospace;
  --ias-r: 16px;
  --ias-bh: 112px;
  container-type: inline-size;
  position: relative;
  display: block;
  width: 100%;
  max-width: 640px;
  color: var(--ias-t1);
  font: 13px/20px var(--ias-font);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ias {
  --ias-ink: #fff;
  --ias-surface: #1c1c1e;
  --ias-accent: #4d8dff;
  --ias-t1: color-mix(in oklab, var(--ias-ink) 90%, transparent);
  --ias-t2: color-mix(in oklab, var(--ias-ink) 66%, transparent);
  --ias-t3: color-mix(in oklab, var(--ias-ink) 56%, transparent);
  --ias-t4: color-mix(in oklab, var(--ias-ink) 28%, transparent);
  --ias-fill: color-mix(in oklab, var(--ias-ink) 6.5%, transparent);
  --ias-line: color-mix(in oklab, var(--ias-ink) 8%, transparent);
  --ias-bar: color-mix(in oklab, var(--ias-ink) 17%, transparent);
  --ias-glow: 0 0 26px color-mix(in oklab, var(--ias-accent) 42%, transparent);
  --ias-good: #4cc27f;
  --ias-bad: #ff7a6b;
  --ias-warn: #f0b44c;
  --ias-glint: rgb(255 255 255 / .09);
  --ias-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ias-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 28px -10px rgb(0 0 0 / .65);
}
:where(.ias) *, :where(.ias) *::before, :where(.ias) *::after { box-sizing: border-box }
:where(.ias) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.ias) :focus-visible { outline: 2px solid var(--ias-accent); outline-offset: 2px }
.ias-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* the lift: a wrapper carries the building shadow, so the card's own shadow stays under the theme's control */
.ias-lift { border-radius: var(--ias-r); transition: box-shadow .7s var(--ias-ease) }
.ias[data-building="1"] .ias-lift { box-shadow: var(--ias-float) }
/* the card: height follows its content (ResizeObserver) */
.ias-card {
  position: relative;
  border-radius: var(--ias-r);
  background: var(--ias-surface);
  box-shadow: var(--ias-shadow);
  overflow: clip;
  transition: height .5s var(--ias-ease);
}

/* the building hairline: a comet travelling the edge at a uniform speed (pathLength 100) */
.ias-edge { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; overflow: visible; opacity: 0; visibility: hidden; transition: opacity .6s var(--ias-ease), visibility 0s linear .6s }
.ias[data-building="1"] .ias-edge { opacity: 1; visibility: visible; transition: opacity .3s var(--ias-ease), visibility 0s }
.ias-edge rect { width: calc(100% - 1px); height: calc(100% - 1px); rx: calc(var(--ias-r) - .5px); fill: none; stroke: var(--ias-accent); stroke-width: 1 }
.ias-edge .ias-track { opacity: .2 }
.ias-edge .ias-tail { stroke-width: 1.5; stroke-linecap: round; stroke-dasharray: 38 62; opacity: .38; animation: ias-tail 2.6s linear infinite }
.ias-edge .ias-run { stroke-width: 2; stroke-linecap: round; stroke-dasharray: 12 88; animation: ias-run 2.6s linear infinite }
@keyframes ias-run { to { stroke-dashoffset: -100 } }
@keyframes ias-tail { from { stroke-dashoffset: 26 } to { stroke-dashoffset: -74 } }

/* header: who is building, what they are doing now, progress, replay */
.ias-head { display: flex; align-items: center; gap: 10px; padding: 11px 12px 11px 14px; min-height: 54px }
.ias-tile { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: var(--ias-accent); color: var(--ias-surface); font-size: 13px; font-weight: 600 }
.ias-who { flex: 1; min-width: 0 }
.ias-l1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13.5px; line-height: 20px; color: var(--ias-t2) }
.ias-l1 b { font-weight: 550; color: var(--ias-t1) }
.ias-l2 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 11.5px/16px var(--ias-mono); color: var(--ias-t2) }
.ias-swap { display: inline-block; max-width: 100%; vertical-align: top; overflow: hidden; text-overflow: ellipsis; animation: ias-in .45s var(--ias-ease) backwards }
.ias-count { flex: none; font: 11.5px/16px var(--ias-mono); color: var(--ias-t3); font-variant-numeric: tabular-nums }
.ias-ticks { flex: none; display: flex; gap: 3px; align-items: center }
.ias-ticks i { display: block; width: 12px; height: 3px; border-radius: 2px; background: color-mix(in oklab, var(--ias-ink) 12%, transparent); transition: background .45s var(--ias-ease) }
.ias-ticks i[data-s="work"] { background: color-mix(in oklab, var(--ias-accent) 45%, transparent) }
.ias-ticks i[data-s="done"] { background: var(--ias-accent) }
.ias-replay { flex: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 8px; color: var(--ias-t2); font-size: 12.5px; font-weight: 500; transition: background .2s var(--ias-ease), color .2s var(--ias-ease) }
.ias-replay:hover { background: var(--ias-fill); color: var(--ias-t1) }
.ias-replay svg { transition: transform .5s var(--ias-ease) }
.ias-replay:active svg { transform: rotate(-120deg) }
@container (max-width: 470px) {
  .ias-ticks, .ias-count, .ias-rl { display: none }
  .ias-replay { width: 30px; padding: 0 }
  .ias-bars, .ias-sk-bars { height: 96px }
}

/* body: parts in a column */
.ias-body { position: relative; display: flex; flex-direction: column; gap: 18px; padding: 18px 18px 20px }
.ias-body:empty { padding: 0 }
.ias-body:not(:empty) { border-top: 1px solid var(--ias-line) }
.ias-part { position: relative }
.ias-settle { animation: ias-in .55s var(--ias-ease) backwards }
@keyframes ias-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }

/* skeletons: one style, a soft glint passing over fill-coloured blocks, shaped like the content that replaces them */
.ias-sk { display: flex; flex-direction: column; gap: 10px; pointer-events: none }
.ias-sk[data-t="chart"], .ias-sk[data-t="table"], .ias-sk[data-t="title"] { gap: 0 }
.ias-sk i { display: block; position: relative; overflow: hidden; border-radius: 6px; background: var(--ias-fill) }
.ias-sk i::after { content: ""; position: absolute; inset: 0; background: linear-gradient(100deg, transparent 30%, var(--ias-glint) 50%, transparent 70%); transform: translateX(-100%); animation: ias-sweep 1.6s linear infinite }
@keyframes ias-sweep { to { transform: translateX(100%) } }
.ias-sk-row { display: flex; align-items: flex-end; gap: 10px }
.ias-sk-line { display: flex; align-items: center }
.ias-sk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 10px }
.ias-sk-bars { display: flex; align-items: flex-end; gap: 10px; height: var(--ias-bh); margin-top: 26px }
.ias-sk-bars i { flex: 1; min-width: 0; border-radius: 5px 5px 2px 2px; background: var(--ias-bar) }
.ias-sk:not([data-out]) { animation: ias-in .5s var(--ias-ease) .14s backwards }
.ias-sk[data-out] { position: absolute; inset: 0; overflow: hidden; animation: ias-skel-out .32s var(--ias-ease) forwards }
@keyframes ias-skel-out { to { opacity: 0; visibility: hidden } }

/* calm placeholder for a part that is partial or not in the catalogue: dashed means not here yet */
.ias-ph { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; border: 1px dashed var(--ias-t4); color: var(--ias-t3); font-size: 12.5px }
.ias-wait { flex: none; width: 11px; height: 11px; border-radius: 50%; border: 1.5px dashed var(--ias-t3); animation: ias-spin 3s linear infinite }
@keyframes ias-spin { to { transform: rotate(360deg) } }

/* title */
.ias-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px }
.ias-h { margin: 0; font-size: 19px; line-height: 26px; font-weight: 500; letter-spacing: -.012em; color: var(--ias-t1) }
.ias-sub { flex: 1 0 100%; order: 3; margin: 0; font-size: 12.5px; color: var(--ias-t3) }
.ias-badge { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 1px 9px; border-radius: 99px; font-size: 12px; line-height: 18px; color: var(--ias-warn); background: color-mix(in oklab, var(--ias-warn) 12%, transparent); animation: ias-in .45s var(--ias-ease) backwards; transition: color .4s var(--ias-ease), background .4s var(--ias-ease) }
.ias-badge::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor }
.ias-badge[data-ok] { color: var(--ias-good); background: color-mix(in oklab, var(--ias-good) 12%, transparent) }

/* kpis */
.ias-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); align-items: stretch; gap: 10px; margin: 0; padding: 0; list-style: none }
.ias-kpi { display: flex; flex-direction: column; gap: 1px; min-width: 0; min-height: 82px; padding: 10px 12px; border-radius: 10px; background: var(--ias-fill); animation: ias-in .55s var(--ias-ease) backwards; animation-delay: calc(var(--i) * 60ms) }
.ias-kl { font-size: 12px; line-height: 16px; color: var(--ias-t3) }
.ias-kv { font-size: 22px; line-height: 30px; font-weight: 500; letter-spacing: -.015em; font-variant-numeric: tabular-nums; color: var(--ias-t1) }
.ias-delta { display: inline-flex; align-items: flex-start; gap: 3px; font-size: 12px; line-height: 16px }
.ias-delta svg { flex: none; margin-top: 2px }
.ias [data-tone="good"] { --ias-tone: var(--ias-good) }
.ias [data-tone="bad"] { --ias-tone: var(--ias-bad) }
.ias [data-tone="neutral"] { --ias-tone: var(--ias-t3) }
.ias-delta { color: var(--ias-tone, var(--ias-t3)) }

/* chart: bars grow bottom-up with a stagger, then the plan line is drawn across, then the last value counts up */
.ias-ch { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; min-height: 20px }
.ias-ct { font-weight: 500; color: var(--ias-t1) }
.ias-cu { font-size: 12px; color: var(--ias-t3); text-align: right }
.ias-bars { position: relative; display: flex; gap: 10px; height: var(--ias-bh); margin-top: 26px }
.ias-col { position: relative; flex: 1; min-width: 0 }
.ias-fill { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--p) * 1%); border-radius: 5px 5px 2px 2px; background: var(--ias-bar); transform-origin: bottom; animation: ias-grow .75s var(--ias-ease) backwards; animation-delay: calc(var(--i) * 60ms + 140ms) }
.ias-bars[data-rise] .ias-fill { background: color-mix(in oklab, var(--ias-accent) calc(var(--k) * 34%), var(--ias-bar)) }
.ias-col[data-above] .ias-fill { background: color-mix(in oklab, var(--ias-accent) 58%, var(--ias-bar)) }
.ias-col[data-hi] .ias-fill { background: var(--ias-accent); box-shadow: var(--ias-glow) }
@keyframes ias-grow { from { transform: scaleY(.02); opacity: .3 } }
.ias-bv { position: absolute; left: 50%; bottom: calc(var(--p) * 1% + 6px); transform: translateX(-50%); font-size: 13px; line-height: 16px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ias-t1); animation: ias-in .5s var(--ias-ease) var(--bd) backwards }
.ias-target { position: absolute; left: 0; right: 0; bottom: calc(var(--p) * 1%); z-index: 1; border-top: 1.5px dashed color-mix(in oklab, var(--ias-ink) 46%, transparent); pointer-events: none; animation: ias-draw .8s var(--ias-ease) var(--td) backwards }
.ias-target span { position: absolute; left: 0; bottom: 3px; font-size: 11.5px; line-height: 14px; color: var(--ias-t2); text-shadow: 0 0 3px var(--ias-surface), 0 0 3px var(--ias-surface), 0 0 6px var(--ias-surface) }
@keyframes ias-draw { from { clip-path: inset(-24px 100% -4px 0) } to { clip-path: inset(-24px 0 -4px 0) } }
.ias-axis { display: flex; gap: 10px; margin-top: 6px }
.ias-axis span { flex: 1; min-width: 0; text-align: center; font-size: 11.5px; line-height: 16px; color: var(--ias-t3); font-variant-numeric: tabular-nums }
.ias-axis span[data-hi] { color: var(--ias-t1); font-weight: 500 }
.ias-cap { margin: 10px 0 0; font-size: 12.5px; color: var(--ias-t2) }

/* table */
.ias-tbl { display: grid; margin-top: 8px }
.ias-tr { display: grid; grid-template-columns: var(--ias-cols); gap: 0 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--ias-line) }
.ias-tr > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ias-t2); font-variant-numeric: tabular-nums }
.ias-tr > span:first-child { color: var(--ias-t1); font-weight: 500 }
.ias-tr > span[data-a="right"] { text-align: right }
.ias-tr > span[data-tone] { color: var(--ias-tone); font-weight: 500 }
.ias-th { padding-top: 0; padding-bottom: 6px }
.ias-th > span { font-size: 12px; font-weight: 400; color: var(--ias-t3) }
.ias-th > span:first-child { color: var(--ias-t3); font-weight: 400 }
.ias-tr[data-r] { animation: ias-in .5s var(--ias-ease) backwards; animation-delay: calc(var(--i) * 55ms + 100ms) }
.ias-tr[data-r]:last-child { border-bottom: 0 }

/* actions: gated by the parts they need, with the consequence printed next to them */
.ias-act { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px }
.ias-note { flex: 1 1 210px; min-width: 0; display: flex; align-items: center; gap: 8px; min-height: 24px; color: var(--ias-t2); font-size: 12.5px }
.ias-note > svg { flex: none; color: var(--ias-t3) }
.ias-nswap { display: inline-flex; align-items: center; gap: 8px; min-width: 0; animation: ias-in .45s var(--ias-ease) backwards }
.ias-undo { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 8px; margin-left: -8px; border-radius: 6px; color: var(--ias-accent); font-weight: 500 }
.ias-undo:hover { background: color-mix(in oklab, var(--ias-accent) 10%, transparent) }
.ias-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-left: auto }
.ias-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: 10px; background: var(--ias-fill); color: var(--ias-t1); font-weight: 500; white-space: nowrap; overflow: hidden; transition: background .35s var(--ias-ease), color .35s var(--ias-ease), width .45s var(--ias-ease), transform .15s var(--ias-ease) }
.ias-btn .ias-swap { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap }
.ias-btn:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--ias-ink) 10%, transparent) }
.ias-btn[data-kind="primary"] { background: var(--ias-accent); color: var(--ias-surface) }
.ias-btn[data-kind="primary"]:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--ias-accent) 88%, var(--ias-ink)) }
.ias-btn[aria-disabled="true"] { background: var(--ias-fill); color: var(--ias-t4); cursor: default }
.ias-btn[data-done] { background: color-mix(in oklab, var(--ias-good) 14%, transparent); color: var(--ias-good); animation: ias-ring .9s var(--ias-ease) }
.ias-btn:active:not([aria-disabled="true"]) { transform: scale(.97) }
.ias-btn[data-kind="primary"][data-lit]:not([aria-disabled="true"]) { animation: ias-lit .9s var(--ias-ease) }
@keyframes ias-lit { from { box-shadow: 0 0 0 0 color-mix(in oklab, var(--ias-accent) 45%, transparent) } to { box-shadow: 0 0 0 10px transparent } }
@keyframes ias-ring { from { box-shadow: 0 0 0 0 color-mix(in oklab, var(--ias-good) 50%, transparent) } to { box-shadow: 0 0 0 12px transparent } }
.ias-tick path { stroke-dasharray: 1; stroke-dashoffset: 0; animation: ias-check .5s var(--ias-ease) .1s backwards }
@keyframes ias-check { from { stroke-dashoffset: 1 } }

/* paused when off screen or the tab is hidden */
.ias[data-active="0"] *, .ias[data-active="0"] *::before, .ias[data-active="0"] *::after { animation-play-state: paused !important }

@media (prefers-reduced-motion: reduce) {
  .ias *, .ias *::before, .ias *::after { animation: none !important; transition: none !important }
  .ias-sk[data-out] { display: none }
  .ias-edge .ias-run { stroke-dasharray: none; opacity: .5 }
  .ias-edge .ias-tail { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Skeletons                                 */
/* -------------------------------------------------------------------------- */

/** A skeleton shaped like the part that will replace it: same bar count, relative heights, rows and tiles. */
function Skeleton({ part, out }: { part: AssemblerPart; out?: boolean }) {
  const p = { className: "ias-sk", "aria-hidden": true, "data-out": out ? "" : undefined, "data-t": part.type } as const
  const d = part as unknown as Record<string, unknown>
  switch (part.type) {
    case "title":
      return (
        <div {...p}>
          <i style={{ width: "46%", height: 24, marginBottom: 2 }} />
          <i style={{ width: "30%", height: 12, marginTop: 6 }} />
        </div>
      )
    case "kpis": {
      const n = Array.isArray(d.items) ? Math.min(Math.max(d.items.length, 1), 6) : 4
      return (
        <div {...p}>
          <div className="ias-sk-grid">
            {Array.from({ length: n }, (_, k) => (
              <i key={k} style={{ height: 82, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      )
    }
    case "chart": {
      const { series, pct } = chartScale(d as { series?: unknown; base?: number; target?: { value: number } })
      const heights = series.length >= 2 ? series.map((v) => `${Math.max(pct(v), 6)}%`) : ["34%", "42%", "50%", "58%", "66%", "86%"]
      return (
        <div {...p}>
          <div className="ias-sk-line" style={{ height: 20 }}>
            <i style={{ width: "34%", height: 14 }} />
          </div>
          <div className="ias-sk-bars">
            {heights.map((h, k) => (
              <i key={k} style={{ height: h }} />
            ))}
          </div>
          {Array.isArray(d.labels) && (
            <div className="ias-sk-line" style={{ height: 16, marginTop: 6 }}>
              <i style={{ width: "100%", height: 8 }} />
            </div>
          )}
          {typeof d.caption === "string" && (
            <div className="ias-sk-line" style={{ height: 20, marginTop: 10 }}>
              <i style={{ width: "72%", height: 10 }} />
            </div>
          )}
        </div>
      )
    }
    case "table": {
      const rows = Array.isArray(d.rows) ? Math.min(Math.max(d.rows.length, 1), 8) : 4
      return (
        <div {...p}>
          <div className="ias-sk-line" style={{ height: 20 }}>
            <i style={{ width: "30%", height: 14 }} />
          </div>
          <div className="ias-sk-line" style={{ height: 27, marginTop: 8, paddingBottom: 6 }}>
            <i style={{ width: "100%", height: 8 }} />
          </div>
          {Array.from({ length: rows }, (_, k) => (
            <div key={k} className="ias-sk-line" style={{ height: k === rows - 1 ? 36 : 37 }}>
              <i style={{ width: "100%", height: 12 }} />
            </div>
          ))}
          {typeof d.caption === "string" && (
            <div className="ias-sk-line" style={{ height: 20, marginTop: 10 }}>
              <i style={{ width: "60%", height: 10 }} />
            </div>
          )}
        </div>
      )
    }
    case "actions":
      return (
        <div {...p}>
          <div className="ias-sk-row" style={{ alignItems: "center" }}>
            <i style={{ width: "40%", height: 14 }} />
            <i style={{ width: 98, height: 34, borderRadius: 10, marginLeft: "auto" }} />
            <i style={{ width: 88, height: 34, borderRadius: 10 }} />
          </div>
        </div>
      )
    default:
      return (
        <div {...p}>
          <i style={{ width: "100%", height: 48, borderRadius: 10 }} />
        </div>
      )
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Parts                                   */
/* -------------------------------------------------------------------------- */

function TitleView({ node, badge }: { node: AssemblerTitle; badge?: { text: string; ok: boolean } }) {
  const b = badge ?? (node.badge ? { text: node.badge, ok: false } : null)
  return (
    <div className="ias-title ias-settle">
      <h3 className="ias-h">{node.text}</h3>
      {b && (
        <span key={b.text} className="ias-badge" data-ok={b.ok ? "" : undefined}>
          {b.text}
        </span>
      )}
      {node.subtitle && <p className="ias-sub">{node.subtitle}</p>}
    </div>
  )
}

const TREND_WORD = { up: "Up", down: "Down", flat: "Flat" } as const

function KpisView({ node }: { node: AssemblerKpis }) {
  return (
    <ul className="ias-kpis">
      {node.items.map((k, i) => {
        const trend = k.trend ?? "flat"
        const Icon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus
        return (
          <li key={`${k.label}-${i}`} className="ias-kpi" style={sv(i)}>
            <span className="ias-kl">{k.label}</span>
            <span className="ias-kv">{k.value}</span>
            {k.delta && (
              <span className="ias-delta" data-tone={trendTone(k)}>
                <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
                {TREND_WORD[trend]} {k.delta}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** The big number counts up to its value. The final value is what React renders, so a frozen rAF still shows it. */
function CountUp({ to, delay }: { to: number; delay: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  React.useEffect(() => {
    const text = ref.current?.firstChild
    if (reduced || !text || !Number.isInteger(to)) return
    const from = Math.round(to * 0.78)
    let t0 = -1
    let raf = 0
    const tick = (t: number) => {
      if (t0 < 0) t0 = t
      const p = Math.min(Math.max((t - t0 - delay) / 900, 0), 1)
      text.nodeValue = String(Math.round(from + (to - from) * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, delay, reduced])
  return <span ref={ref}>{to}</span>
}

function ChartView({ node }: { node: AssemblerChart }) {
  const { labels = [], target } = node
  const { series, lo, pct } = chartScale(node)
  const n = series.length
  const hi = Math.min(Math.max(node.highlight ?? n - 1, 0), n - 1)
  const rising = n > 2 && series[n - 1] > series[0] && series.filter((v, i) => i > 0 && v > series[i - 1]).length >= (n - 1) * 0.7
  const summary = `${node.title ?? "Chart"}: ${series.map((v, i) => `${labels[i] ?? i + 1} ${v}`).join(", ")}${node.unit ? ` (${node.unit})` : ""}${target ? `, ${target.label ?? `target ${target.value}`}` : ""}${lo > 0 ? `, axis starts at ${lo}` : ""}`
  const unit = [node.unit, lo > 0 ? `axis from ${lo}` : ""].filter(Boolean).join(" · ")
  const tail = n * 60 + 200
  return (
    <div className="ias-chart">
      {(node.title || unit) && (
        <div className="ias-ch ias-settle">
          <span className="ias-ct">{node.title}</span>
          {unit && <span className="ias-cu">{unit}</span>}
        </div>
      )}
      <div role="img" aria-label={summary}>
        <div className="ias-bars" data-rise={rising ? "" : undefined}>
          {target && (
            <div className="ias-target" style={{ "--p": pct(target.value), "--td": `${tail}ms` } as React.CSSProperties}>
              <span>{target.label ?? `Target ${target.value}`}</span>
            </div>
          )}
          {series.map((v, i) => (
            <div
              key={i}
              className="ias-col"
              data-hi={i === hi ? "" : undefined}
              data-above={target && v > target.value && i !== hi ? "" : undefined}
              style={{ ...sv(i), "--p": pct(v), "--k": n > 1 ? i / (n - 1) : 0, "--bd": `${tail}ms` } as React.CSSProperties}
            >
              <div className="ias-fill" />
              {i === hi && (
                <span className="ias-bv">
                  <CountUp to={v} delay={tail} />
                </span>
              )}
            </div>
          ))}
        </div>
        {labels.length > 0 && (
          <div className="ias-axis ias-settle">
            {series.map((_, i) => (
              <span key={i} data-hi={i === hi ? "" : undefined}>
                {labels[i] ?? ""}
              </span>
            ))}
          </div>
        )}
      </div>
      {node.caption && <p className="ias-cap ias-settle">{node.caption}</p>}
    </div>
  )
}

function cellOf(c: AssemblerCell | undefined | null): { text: string; tone?: AssemblerTone } {
  if (c == null) return { text: "" }
  if (typeof c === "object") return { text: String(c.text ?? ""), tone: c.tone }
  return { text: String(c) }
}

/** Show the full text as a tooltip only when the cell is actually cut off. */
const titleIfCut = (e: React.PointerEvent<HTMLElement>, text: string) => {
  const el = e.currentTarget
  if (el.scrollWidth > el.clientWidth) el.title = text
  else el.removeAttribute("title")
}

function TableView({ node }: { node: AssemblerTable }) {
  const cols = node.columns.map((c, j) => `minmax(0, ${c.fr ?? (j === 0 ? 2.4 : 1)}fr)`).join(" ")
  return (
    <div className="ias-table">
      {node.title && (
        <div className="ias-ch ias-settle">
          <span className="ias-ct">{node.title}</span>
        </div>
      )}
      <div className="ias-tbl" role="table" aria-label={node.title ?? "Table"} style={{ "--ias-cols": cols } as React.CSSProperties}>
        <div className="ias-tr ias-th ias-settle" role="row">
          {node.columns.map((c, j) => (
            <span key={j} role="columnheader" data-a={c.align}>
              {c.label}
            </span>
          ))}
        </div>
        {node.rows.map((r, i) => (
          <div key={i} className="ias-tr" role="row" data-r="" style={sv(i)}>
            {node.columns.map((c, j) => {
              const cell = cellOf(r[j])
              return (
                <span key={j} role="cell" data-a={c.align} data-tone={cell.tone} onPointerEnter={(e) => titleIfCut(e, cell.text)}>
                  {cell.text}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      {node.caption && <p className="ias-cap ias-settle">{node.caption}</p>}
    </div>
  )
}

/** A button whose width glides to its new label: measure before, measure after, let CSS transition between the two px values. */
function ActionButton({
  action,
  done,
  gated,
  describedBy,
  lit,
  onPress,
  btnRef,
}: {
  action: AssemblerAction
  done: boolean
  gated: boolean
  describedBy: string
  lit: boolean
  onPress: () => void
  btnRef: (el: HTMLButtonElement | null) => void
}) {
  const ref = React.useRef<HTMLButtonElement | null>(null)
  const prevW = React.useRef(0)
  const label = done && action.doneLabel ? action.doneLabel : action.label
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = prevW.current
    el.style.width = ""
    const to = el.offsetWidth
    prevW.current = to
    if (from > 0 && Math.abs(from - to) > 1) {
      el.style.width = `${from}px`
      void el.offsetWidth
      el.style.width = `${to}px`
    }
  }, [label])
  return (
    <button
      ref={(el) => {
        ref.current = el
        btnRef(el)
      }}
      type="button"
      className="ias-btn"
      data-kind={action.kind ?? "default"}
      data-done={done ? "" : undefined}
      data-lit={lit ? "" : undefined}
      aria-disabled={gated || done ? true : undefined}
      aria-describedby={gated ? describedBy : undefined}
      onTransitionEnd={(e) => {
        if (e.propertyName === "width" && e.target === e.currentTarget) e.currentTarget.style.width = ""
      }}
      onClick={() => {
        if (!gated && !done) onPress()
      }}
    >
      <span key={label} className="ias-swap">
        {done && (
          <svg className="ias-tick" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 8.6l3 3 6-7" pathLength={1} />
          </svg>
        )}
        {label}
      </span>
    </button>
  )
}

function ActionsView({
  node,
  isUp,
  typeOf,
  done,
  setDone,
  animated,
  onPress,
  onUndo,
}: {
  node: AssemblerActions
  isUp: (id: string) => boolean
  typeOf: (id: string) => string
  done: Record<string, boolean>
  setDone: (key: string, v: boolean) => void
  animated: boolean
  onPress: (a: AssemblerAction) => void
  onUndo?: (a: AssemblerAction) => void
}) {
  const noteId = React.useId()
  const btns = React.useRef(new Map<string, HTMLButtonElement>())
  const refocus = React.useRef<string | null>(null)
  const key = (a: AssemblerAction) => `${node.id}:${a.id}`
  const unmet = node.items.flatMap((a) => a.needs ?? []).find((id) => !isUp(id))
  const doneItem = node.items.find((a) => done[key(a)] && a.doneLabel)
  const kind = doneItem ? "done" : unmet ? "wait" : "note"
  /* Undo unmounts under the keyboard, so hand focus back to the button it undid */
  React.useEffect(() => {
    const id = refocus.current
    if (!id) return
    refocus.current = null
    btns.current.get(id)?.focus()
  })
  return (
    <div className="ias-act ias-settle">
      <div className="ias-note" data-k={kind} id={noteId}>
        <span key={kind} className="ias-nswap">
          {kind === "done" ? (
            onUndo && doneItem ? (
              <button
                type="button"
                className="ias-undo"
                onClick={() => {
                  refocus.current = doneItem.id
                  setDone(key(doneItem), false)
                  onUndo(doneItem)
                }}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Undo
              </button>
            ) : null
          ) : kind === "wait" ? (
            <>
              <span className="ias-wait" aria-hidden="true" />
              {`Waiting for the ${typeOf(unmet ?? "")}`}
            </>
          ) : (
            <>
              <Clock size={14} aria-hidden="true" />
              {node.note}
            </>
          )}
        </span>
      </div>
      <div className="ias-btns" role="group" aria-label="Actions">
        {node.items.map((a) => {
          const gated = (a.needs ?? []).some((id) => !isUp(id))
          return (
            <ActionButton
              key={a.id}
              action={a}
              done={!!done[key(a)]}
              gated={gated}
              describedBy={noteId}
              lit={animated}
              onPress={() => onPress(a)}
              btnRef={(el) => {
                if (el) btns.current.set(a.id, el)
                else btns.current.delete(a.id)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function Placeholder({ type }: { type: string }) {
  return (
    <div className="ias-ph ias-settle" role="note">
      <span className="ias-wait" aria-hidden="true" />
      {PLACEHOLDER[type] ?? "This part is not in the catalogue yet"}
    </div>
  )
}

const sigOf = (v: unknown) => {
  try {
    return JSON.stringify(v)
  } catch {
    return ""
  }
}

/** One half-sent part must never take the card down: it falls back to the calm placeholder until its data changes. */
class PartBoundary extends React.Component<{ node: AssemblerPart; children: React.ReactNode }, { failed: string | null }> {
  state = { failed: null as string | null }
  static getDerivedStateFromProps(props: { node: AssemblerPart }, state: { failed: string | null }) {
    return state.failed && sigOf(props.node) !== state.failed ? { failed: null } : null
  }
  static getDerivedStateFromError() {
    return { failed: "" }
  }
  componentDidCatch() {
    this.setState({ failed: sigOf(this.props.node) })
  }
  render() {
    return this.state.failed !== null ? <Placeholder type={this.props.node.type} /> : this.props.children
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Assembler                                 */
/* -------------------------------------------------------------------------- */

/**
 * A generative-UI card that assembles itself as an agent streams a component tree.
 * Each part arrives as a skeleton and settles; neighbours glide to their new places;
 * a hairline travels the edge while the agent is still building.
 */
export function Assembler({
  nodes,
  order,
  stream = true,
  stepMs = 820,
  skeletonMs = 600,
  building: buildingProp,
  agent = { name: "Atlas" },
  onAction,
  onUndo,
  onDone,
  className,
}: AssemblerProps) {
  const tree: AssemblerPart[] = nodes ?? ASSEMBLER_SAMPLE.nodes
  const orderProp: readonly string[] | undefined = order ?? (nodes ? undefined : ASSEMBLER_SAMPLE.order)
  const total = tree.length
  const reduced = useReducedMotion()

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const active = useActive(rootRef)

  const [playing, setPlaying] = React.useState(stream)
  const [count, setCount] = React.useState(0)
  const [run, setRun] = React.useState(0)
  const [ready, setReady] = React.useState<ReadonlySet<string>>(() => (stream ? new Set<string>() : new Set(tree.map((n) => n.id))))
  const [instant, setInstant] = React.useState<ReadonlySet<string>>(ready)
  const [done, setDoneMap] = React.useState<Record<string, boolean>>({})
  const effPlaying = playing && !reduced

  /* arrival order: the ids you list first, then the rest in document order */
  const ids = tree.map((n) => n.id)
  const first = (orderProp ?? []).filter((id) => ids.includes(id))
  const arrival = [...first, ...ids.filter((id) => !first.includes(id))]
  const shown = effPlaying ? new Set(arrival.slice(0, count)) : null
  /* a part that has not arrived but sits above one that has keeps its place as a skeleton, so nothing jumps when it lands */
  const reserved = new Set<string>()
  if (shown) {
    const lastShown = tree.reduce((m, n, i) => (shown.has(n.id) ? i : m), -1)
    tree.forEach((n, i) => {
      if (!shown.has(n.id) && i < lastShown) reserved.add(n.id)
    })
  }
  const visible = tree.filter((n) => !shown || shown.has(n.id) || reserved.has(n.id))

  const isSkeleton = (n: AssemblerPart) => isPending(n) || reserved.has(n.id) || (!reduced && !ready.has(n.id))
  const settled = visible.filter((n) => !isSkeleton(n)).length
  const allSettled = total > 0 && visible.length === total && settled === total
  const building = buildingProp ?? (effPlaying ? total > 0 && !allSettled : visible.length > settled)
  const arrived = effPlaying ? Math.min(count, total) : visible.length

  /* built-in playback: release the next part every stepMs while visible */
  React.useEffect(() => {
    if (!effPlaying || !active || count >= total) return
    const t = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? 450 : stepMs)
    return () => window.clearTimeout(t)
  }, [effPlaying, active, count, total, stepMs, run])

  /* each arrived part settles after its own skeleton time (or as soon as its data is no longer pending) */
  const timers = React.useRef(new Map<string, number>())
  const born = React.useRef(new Map<string, number>())
  const sig = visible.map((n) => n.id + (isPending(n) ? "~" : reserved.has(n.id) ? "^" : "")).join("|")
  React.useEffect(() => {
    const now = nowMs()
    for (const entry of sig ? sig.split("|") : []) {
      const mark = entry.slice(-1)
      const id = mark === "~" || mark === "^" ? entry.slice(0, -1) : entry
      if (mark === "^") {
        born.current.delete(id)
        continue
      }
      if (!born.current.has(id)) born.current.set(id, now)
      if (mark === "~" || ready.has(id) || timers.current.has(id)) continue
      const wait = Math.max(120, skeletonMs - (now - (born.current.get(id) ?? now)))
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id)
          setReady((prev) => new Set(prev).add(id))
        }, wait),
      )
    }
  }, [sig, ready, skeletonMs])
  React.useEffect(() => {
    const t = timers.current
    const b = born.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      t.clear()
      b.clear()
    }
  }, [])

  /* onDone fires when a build that was in progress finishes */
  const onDoneRef = React.useRef(onDone)
  const wasBuilding = React.useRef(stream)
  React.useEffect(() => {
    onDoneRef.current = onDone
  })
  React.useEffect(() => {
    if (!allSettled) wasBuilding.current = true
    else if (wasBuilding.current) {
      wasBuilding.current = false
      onDoneRef.current?.()
    }
  }, [allSettled])

  /* the card's height: CSS cannot transition to auto, so measure the content and set pixels */
  React.useEffect(() => {
    const card = cardRef.current
    const inner = innerRef.current
    if (!card || !inner || typeof ResizeObserver === "undefined") return
    let lastW = -1
    const ro = new ResizeObserver(() => {
      const w = inner.offsetWidth
      const h = inner.offsetHeight
      if (w !== lastW) {
        card.style.transition = "none"
        card.style.height = `${h}px`
        void card.offsetHeight
        card.style.transition = ""
        lastW = w
      } else card.style.height = `${h}px`
    })
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  /* FLIP: after every render, find parts that moved and glide them from where they were */
  const partRefs = React.useRef(new Map<string, HTMLElement>())
  const lastPos = React.useRef(new Map<string, { x: number; y: number }>())
  React.useLayoutEffect(() => {
    const next = new Map<string, { x: number; y: number }>()
    partRefs.current.forEach((el, id) => {
      const flights = el.getAnimations().filter((a) => a.id === "ias-flip")
      const m = flights.length ? new DOMMatrixReadOnly(getComputedStyle(el).transform) : null
      const pos = { x: el.offsetLeft, y: el.offsetTop }
      const prev = lastPos.current.get(id)
      if (prev && !reduced) {
        const dx = prev.x + (m?.m41 ?? 0) - pos.x
        const dy = prev.y + (m?.m42 ?? 0) - pos.y
        flights.forEach((a) => a.cancel())
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 480, easing: EASE, id: "ias-flip" })
        }
      }
      next.set(id, pos)
    })
    lastPos.current = next
  })

  const replay = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current.clear()
    born.current.clear()
    setPlaying(true)
    setCount(0)
    setReady(new Set())
    setInstant(new Set())
    setDoneMap({})
    setRun((r) => r + 1)
  }

  /* a `needs` id that is not in the tree can never arrive, so it is ignored rather than waited for forever */
  const isUp = (id: string) => {
    if (!ids.includes(id)) return true
    const n = visible.find((v) => v.id === id)
    return !!n && !isSkeleton(n)
  }
  const typeOf = (id: string) => tree.find((n) => n.id === id)?.type ?? id

  /* the action the viewer has finished, if any: it rewrites the badge and the status line */
  let doneItem: AssemblerAction | undefined
  for (const n of tree) {
    if (isPending(n) || n.type !== "actions" || !Array.isArray(n.items)) continue
    doneItem = doneItem ?? n.items.find((a) => isObj(a) && done[`${n.id}:${a.id}`] && a.doneLabel)
  }

  const lastId = effPlaying ? arrival[count - 1] : undefined
  const last = lastId ? tree.find((n) => n.id === lastId) : [...visible].reverse().find((n) => !instant.has(n.id)) ?? visible[visible.length - 1]
  const readout = allSettled && !building ? (doneItem?.doneNote ?? `${total} parts · all valid`) : last ? describe(last) : "waiting for the first part"
  const name = agent.name || "Agent"
  const status = building ? `is ${last ? verb(last) : "starting the view"}` : "built this view"

  const renderPart = (n: AssemblerPart) => {
    const skeleton = isSkeleton(n)
    const animated = !instant.has(n.id)
    let content: React.ReactNode = null
    if (!skeleton) {
      const node = n as AssemblerNode
      if (!isComplete(node)) content = <Placeholder type={node.type} />
      else if (node.type === "title") content = <TitleView node={node} badge={doneItem?.doneBadge ? { text: doneItem.doneBadge, ok: true } : undefined} />
      else if (node.type === "kpis") content = <KpisView node={node} />
      else if (node.type === "chart") content = <ChartView node={node} />
      else if (node.type === "table") content = <TableView node={node} />
      else if (node.type === "actions")
        content = (
          <ActionsView
            node={node}
            isUp={isUp}
            typeOf={typeOf}
            done={done}
            setDone={(k, v) => setDoneMap((d) => ({ ...d, [k]: v }))}
            animated={animated}
            onPress={(a) => {
              onAction?.(a, node)
              if (a.doneLabel) setDoneMap((d) => ({ ...d, [`${node.id}:${a.id}`]: true }))
            }}
            onUndo={onUndo ? (a) => onUndo(a, node) : undefined}
          />
        )
    }
    return (
      <div
        key={n.id}
        ref={(el) => {
          if (el) partRefs.current.set(n.id, el)
          else partRefs.current.delete(n.id)
        }}
        className="ias-part"
        data-type={n.type}
        data-state={skeleton ? "skeleton" : "ready"}
      >
        {skeleton ? (
          <Skeleton part={n} />
        ) : (
          <>
            <PartBoundary node={n}>{content}</PartBoundary>
            {animated && !reduced && <Skeleton part={n} out />}
          </>
        )}
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn("ias", className)} data-building={building ? "1" : "0"} data-active={active ? "1" : "0"}>
      <style href="assembler" precedence="default">
        {CSS}
      </style>
      <div className="ias-lift">
        <section ref={cardRef} className="ias-card" aria-label="Generated view" aria-busy={building}>
          <div ref={innerRef}>
            <header className="ias-head">
              <span className="ias-tile" aria-hidden="true">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <div className="ias-who">
                <div className="ias-l1">
                  <b>{name}</b> <span key={status} className="ias-swap">{status}</span>
                </div>
                <div className="ias-l2">
                  <span key={readout} className="ias-swap">
                    {readout}
                  </span>
                </div>
              </div>
              <span className="ias-count">
                {settled}/{total}
              </span>
              <span className="ias-ticks" aria-hidden="true">
                {Array.from({ length: Math.min(total, 12) }, (_, i) => (
                  <i key={i} data-s={i < settled ? "done" : i < arrived ? "work" : "wait"} />
                ))}
              </span>
              <button type="button" className="ias-replay" onClick={replay} aria-label="Replay the build" title="Replay the build">
                <RotateCcw size={14} aria-hidden="true" />
                <span className="ias-rl">Replay</span>
              </button>
            </header>
            <div className="ias-body">{visible.map(renderPart)}</div>
          </div>
          <svg className="ias-edge" aria-hidden="true">
            <rect className="ias-track" x=".5" y=".5" rx="15.5" pathLength="100" />
            <rect className="ias-tail" x=".5" y=".5" rx="15.5" pathLength="100" />
            <rect className="ias-run" x=".5" y=".5" rx="15.5" pathLength="100" />
          </svg>
        </section>
      </div>
      <span className="ias-sr" role="status" aria-live="polite">
        {building ? `${name} is building this view.` : `${name} built this view. ${total} parts.`}
      </span>
    </div>
  )
}

export default Assembler

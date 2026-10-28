"use client"

import * as React from "react"
import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ChatSceneProps = {
  /** Channel name in the card header. */
  channel?: string
  /** Workspace name, right-aligned in the header. */
  workspace?: string
  /** Sender of the message (initials are drawn from this). */
  author?: string
  message?: string
  fileName?: string
  fileMeta?: string
}

export type DraftSceneProps = {
  /** Floating chip above the entry: the source it was read from. */
  sourceLabel?: string
  sourceAmount?: string
  title?: string
  badge?: string
  /** Column headings. */
  columns?: [string, string, string]
  /** Table rows (the first three animate in). Missing amounts show a dash. */
  rows?: { account: string; debit?: string; credit?: string }[]
}

export type ReviewSceneProps = {
  title?: string
  /** Badge before and after approval. */
  pendingBadge?: string
  doneBadge?: string
  totalLabel?: string
  debit?: string
  credit?: string
  /** Checklist (the first three animate in). */
  checks?: string[]
}

export type StepCardItem = {
  title: string
  description: string
  /** Replace the built-in scene for this column. */
  scene?: React.ReactNode
}

export type StepCardsProps = {
  /** Three columns: step text and an optional custom scene. Defaults to the bookkeeping story. */
  steps?: StepCardItem[]
  /** Dot colour per scene tile. Defaults to lavender, mint, lavender. */
  tints?: string[]
  /** Content of the built-in scenes. */
  scenes?: { chat?: ChatSceneProps; draft?: DraftSceneProps; review?: ReviewSceneProps }
  /** Motion speed multiplier – 1 is the designed pace (about 10s per loop). */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for step numbers. */
  accent?: string
  /** Accessible name of the section. */
  label?: string
  className?: string
}

export const DEFAULT_STEP_CARDS: StepCardItem[] = [
  {
    title: "Send the event",
    description: "Describe what happened in plain words, or attach the receipt. No forms to fill in, no codes to look up.",
  },
  {
    title: "AI drafts the entry",
    description: "The assistant reads the source, picks the accounts and proposes a balanced entry with the receipt linked.",
  },
  {
    title: "Review and approve",
    description: "See the evidence next to the numbers. Approve it and the entry is posted to the ledger.",
  },
]

const DEFAULT_TINTS = ["#a78bfa", "#34d399", "#a78bfa"]

/* -------------------------------------------------------------------------- */
/*                                  Timeline                                  */
/* -------------------------------------------------------------------------- */

/** All motion is plain CSS keyframes on one 10s loop, generated from this table (seconds). */
const T = 10
const HOLD_END = 8.8
const GONE = 9.6
const START = {
  msg: [0.2, 0.8],
  file: [1.0, 1.6],
  src: [2.0, 2.6],
  line: [2.6, 3.5],
  row: [3.5, 3.95],
  chk: [4.9, 5.45],
  badge: [6.7, 7.3],
} as const
const ROW_STEP = 0.4
const CHK_STEP = 0.55
const MAX_ITEMS = 3

const pc = (s: number) => `${+((s / T) * 100).toFixed(3)}%`

/** Hidden → shown between a and b, held, faded out at the end of the loop, hidden again. */
function kf(name: string, a: number, b: number, hidden: string, shown: string) {
  return `@keyframes ${name}{0%,${pc(a)}{${hidden}}${pc(b)},${pc(HOLD_END)}{${shown}}${pc(GONE)},100%{${hidden}}}`
}

const HIDE_UP = "opacity:0;transform:translateY(8px);filter:blur(3px)"
const HIDE_ROW = "opacity:0;transform:translateY(4px);filter:blur(2px)"
const SHOWN = "opacity:1;transform:none;filter:blur(0)"

function buildKeyframes() {
  const out: string[] = []
  out.push(kf("sk-msg", START.msg[0], START.msg[1], HIDE_UP, SHOWN))
  out.push(kf("sk-file", START.file[0], START.file[1], "opacity:0;transform:translateX(-14px);filter:blur(3px)", SHOWN))
  out.push(kf("sk-src", START.src[0], START.src[1], "opacity:0;transform:translateY(-14px);filter:blur(3px)", SHOWN))
  out.push(kf("sk-line", START.line[0], START.line[1], "stroke-dashoffset:1", "stroke-dashoffset:0"))
  for (let i = 0; i < MAX_ITEMS; i++) {
    const a = START.row[0] + i * ROW_STEP
    out.push(kf(`sk-row${i}`, a, a + (START.row[1] - START.row[0]), HIDE_ROW, SHOWN))
    const c = START.chk[0] + i * CHK_STEP
    const d = c + (START.chk[1] - START.chk[0])
    out.push(kf(`sk-chkbg${i}`, c, d, "opacity:0;transform:scale(.6)", "opacity:1;transform:scale(1)"))
    out.push(kf(`sk-chkp${i}`, c + 0.1, d + 0.1, "stroke-dashoffset:1;opacity:0", "stroke-dashoffset:0;opacity:1"))
    out.push(kf(`sk-chkt${i}`, c, d, "color:var(--sk-t3)", "color:var(--sk-t1)"))
  }
  const [s0, s1] = START.badge
  const vis = "opacity:1;filter:blur(0)"
  const hid = "opacity:0;filter:blur(3px)"
  out.push(`@keyframes sk-bdg-a{0%,${pc(s0)}{${vis}}${pc(s1)},${pc(GONE)}{${hid}}100%{${vis}}}`)
  out.push(`@keyframes sk-bdg-b{0%,${pc(s0)}{${hid}}${pc(s1)},${pc(HOLD_END)}{${vis}}${pc(GONE)},100%{${hid}}}`)
  return out.join("\n")
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const anim = (name: string) => `animation: ${name} var(--sk-dur) var(--sk-ease) infinite`

const CSS = `
.sk {
  --sk-ink: #000;
  --sk-surface: #fff;
  --sk-accent: #0060e2;
  --sk-green: #16a34a;
  --sk-amber: #b45309;
  --sk-amber-bg: #fef3c7;
  --sk-t1: color-mix(in oklab, var(--sk-ink) 88%, transparent);
  --sk-t2: color-mix(in oklab, var(--sk-ink) 61%, transparent);
  --sk-t3: color-mix(in oklab, var(--sk-ink) 45%, transparent);
  --sk-copy: color-mix(in oklab, var(--sk-ink) 55%, transparent);
  --sk-line: color-mix(in oklab, var(--sk-ink) 7%, transparent);
  --sk-fill: color-mix(in oklab, var(--sk-ink) 4%, transparent);
  --sk-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 8px 20px -10px rgb(0 0 0 / .12);
  --sk-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 10px 24px -10px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .06);
  --sk-tile-base: #f7f7f9;
  --sk-ease: cubic-bezier(.22, 1, .36, 1);
  --sk-speed: 1;
  --sk-dur: calc(${T}s / var(--sk-speed));
  container: sk / inline-size;
  position: relative;
  width: 100%;
  max-width: 1080px;
  color: var(--sk-t1);
  font-family: var(--sk-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .sk {
  --sk-ink: #fff;
  --sk-surface: #1c1c1e;
  --sk-accent: #4d8dff;
  --sk-green: #30d158;
  --sk-amber: #fbbf24;
  --sk-amber-bg: rgb(251 191 36 / .14);
  --sk-t1: color-mix(in oklab, var(--sk-ink) 90%, transparent);
  --sk-t2: color-mix(in oklab, var(--sk-ink) 62%, transparent);
  --sk-t3: color-mix(in oklab, var(--sk-ink) 46%, transparent);
  --sk-copy: color-mix(in oklab, var(--sk-ink) 58%, transparent);
  --sk-line: color-mix(in oklab, var(--sk-ink) 9%, transparent);
  --sk-fill: color-mix(in oklab, var(--sk-ink) 6%, transparent);
  --sk-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 8px 20px -10px rgb(0 0 0 / .5);
  --sk-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 10px 24px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
  --sk-tile-base: #141417;
}
.sk *, .sk *::before, .sk *::after { box-sizing: border-box }

/* Layout: one column, three from 760px */
.sk-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: minmax(0, 1fr); gap: 44px }
.sk-col { min-width: 0; width: 100%; max-width: 440px; margin: 0 auto }
@container sk (min-width: 760px) {
  .sk-list { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px }
  .sk-col { max-width: none; margin: 0 }
}

/* Scene tile with its own halftone: dots gather at the edges, the centre stays clean */
.sk-tile {
  --sk-tint: #a78bfa;
  position: relative; isolation: isolate; overflow: hidden; display: grid; place-items: center;
  aspect-ratio: 4 / 3; padding: 14px; border-radius: 16px;
  background: color-mix(in oklab, var(--sk-tint) 9%, var(--sk-tile-base));
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--sk-ink) 6%, transparent);
}
.sk-tile::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background-image: radial-gradient(circle at center, color-mix(in oklab, var(--sk-tint) 60%, transparent) 1px, transparent 1.4px);
  background-size: 7px 7px; background-position: center;
  mask-image: radial-gradient(ellipse 64% 60% at 50% 50%, transparent 38%, rgb(0 0 0 / .5) 74%, #000 100%);
  -webkit-mask-image: radial-gradient(ellipse 64% 60% at 50% 50%, transparent 38%, rgb(0 0 0 / .5) 74%, #000 100%);
}
.sk-scene { width: 100%; max-width: 276px; min-width: 0 }

/* Copy under the tile */
.sk-num { margin-top: 18px; font-size: 13px; line-height: 20px; font-weight: 600; color: var(--sk-accent); font-variant-numeric: tabular-nums }
.sk-title { margin: 4px 0 0; font-size: 20px; line-height: 26px; font-weight: 600; letter-spacing: -.02em; color: var(--sk-t1); text-wrap: balance }
.sk-desc { margin: 8px 0 0; font-size: 14.5px; line-height: 22px; color: var(--sk-copy); text-wrap: pretty }

/* Mini UI cards */
.sk-card { background: var(--sk-surface); border-radius: 12px; box-shadow: var(--sk-shadow); overflow: hidden }
.sk-card-head { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-bottom: .5px solid var(--sk-line); min-width: 0 }
.sk-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--sk-green) }
.sk-head-title { font-weight: 600; color: var(--sk-t1); white-space: nowrap }
.sk-head-side { margin-left: auto; font-size: 12px; color: var(--sk-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0 }

/* Scene 1: chat */
.sk-chat-body { padding: 10px 12px 12px }
.sk-msg { display: grid; grid-template-columns: 24px minmax(0, 1fr); column-gap: 8px }
.sk-avatar {
  display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; font-size: 10px; font-weight: 600;
  color: var(--sk-accent); background: color-mix(in oklab, var(--sk-accent) 12%, var(--sk-surface));
}
.sk-who { font-weight: 600; color: var(--sk-t1); line-height: 18px }
.sk-text { margin-top: 1px; line-height: 19px; color: var(--sk-t2) }
.sk-file {
  display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 6px 8px; border-radius: 8px;
  background: var(--sk-fill); box-shadow: inset 0 0 0 .5px var(--sk-line); min-width: 0;
}
.sk-file-ico {
  flex: none; display: grid; place-items: center; width: 24px; height: 28px; border-radius: 5px;
  background: var(--sk-surface); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--sk-ink) 12%, transparent); color: var(--sk-accent);
}
.sk-file-ico svg { width: 13px; height: 13px }
.sk-file-name { font-size: 12.5px; line-height: 16px; font-weight: 500; color: var(--sk-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.sk-file-meta { font-size: 11.5px; line-height: 15px; color: var(--sk-t3); white-space: nowrap }
.sk-file-text { min-width: 0 }

/* Scene 2: source chip, dashed connector, entry card */
.sk-col-flow { display: flex; flex-direction: column; align-items: center }
.sk-source {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 28px; padding: 0 10px 0 8px;
  border-radius: 8px; background: var(--sk-surface); box-shadow: var(--sk-float); white-space: nowrap;
}
.sk-source svg { flex: none; width: 13px; height: 13px; color: var(--sk-accent) }
.sk-source-label { color: var(--sk-t2) }
.sk-source-amt { font-weight: 600; color: var(--sk-t1); font-variant-numeric: tabular-nums }
.sk-link { display: block; width: 6px; height: 22px; overflow: visible }
.sk-link path { fill: none; stroke-linecap: butt }
.sk-link .sk-link-dash { stroke: color-mix(in oklab, var(--sk-accent) 55%, transparent); stroke-width: 1.5; stroke-dasharray: 3 3.5 }
.sk-link .sk-link-draw { stroke: #fff; stroke-width: 4; stroke-dasharray: 1; stroke-dashoffset: 0 }
.sk-entry { width: 100% }
.sk-entry-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 32px; padding: 0 10px 0 12px; border-bottom: .5px solid var(--sk-line) }

.sk-badge-wrap { position: relative; display: inline-grid; flex: none }
.sk-badge {
  grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; height: 20px; padding: 0 8px;
  border-radius: 10px; font-size: 11.5px; line-height: 20px; font-weight: 500; white-space: nowrap;
}
.sk-badge-amber { color: var(--sk-amber); background: var(--sk-amber-bg) }
.sk-badge-green { color: var(--sk-green); background: color-mix(in oklab, var(--sk-green) 14%, var(--sk-surface)) }

.sk-table { padding: 4px 12px 8px; font-variant-numeric: tabular-nums }
.sk-tr { display: grid; grid-template-columns: minmax(0, 1fr) 54px 54px; column-gap: 6px; align-items: center; min-height: 24px }
.sk-tr > span:nth-child(n + 2) { text-align: right }
.sk-tr > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.sk-th { min-height: 26px; font-size: 11.5px; font-weight: 500; color: var(--sk-t3) }
.sk-td { color: var(--sk-t1) }
.sk-td > span:nth-child(n + 2) { color: var(--sk-t2) }
.sk-total { margin: 0 12px; padding: 6px 0 4px; border-top: .5px solid var(--sk-line); font-variant-numeric: tabular-nums }
.sk-total .sk-tr > span { font-weight: 600; color: var(--sk-t1) }

/* Scene 3: checklist */
.sk-checks { margin: 0; padding: 4px 12px 12px; list-style: none }
.sk-check { display: flex; align-items: center; gap: 8px; min-height: 26px; color: var(--sk-t1) }
.sk-check-ico { position: relative; flex: none; width: 16px; height: 16px }
.sk-check-ico svg { position: absolute; inset: 0; width: 16px; height: 16px; overflow: visible }
.sk-check-ring { fill: none; stroke: color-mix(in oklab, var(--sk-ink) 18%, transparent); stroke-width: 1.2 }
.sk-check-bg { fill: var(--sk-green); transform-origin: 8px 8px }
.sk-check-path { fill: none; stroke: #fff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0 }

/* Motion */
.sk-a-msg { ${anim("sk-msg")} }
.sk-a-file { ${anim("sk-file")} }
.sk-a-src { ${anim("sk-src")} }
.sk-a-line { ${anim("sk-line")} }
.sk-badge-a { ${anim("sk-bdg-a")} }
.sk-badge-b { opacity: 0; ${anim("sk-bdg-b")} }
${Array.from({ length: MAX_ITEMS }, (_, i) => `.sk-a-row${i} { ${anim(`sk-row${i}`)} }
.sk-a-chkbg${i} { ${anim(`sk-chkbg${i}`)} }
.sk-a-chkp${i} { ${anim(`sk-chkp${i}`)} }
.sk-a-chkt${i} { ${anim(`sk-chkt${i}`)} }`).join("\n")}

${buildKeyframes()}

.sk[data-paused] *, .sk[data-paused] *::before, .sk[data-paused] *::after, .sk[data-paused] { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .sk *, .sk *::before, .sk *::after { animation: none !important; transition: none !important }
  .sk .sk-badge-a { opacity: 0 }
  .sk .sk-badge-b { opacity: 1 }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Scenes                                   */
/* -------------------------------------------------------------------------- */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

/** Scene 1: a chat message with an attached receipt. */
export function ChatScene({
  channel = "Chat",
  workspace = "Studio North",
  author = "Jamie Lee",
  message = "Picked up stationery for the studio. Paid $480 from the company card.",
  fileName = "stationery-receipt.pdf",
  fileMeta = "Receipt · $480.00",
}: ChatSceneProps) {
  return (
    <div className="sk-card">
      <div className="sk-card-head">
        <span className="sk-dot" />
        <span className="sk-head-title">{channel}</span>
        <span className="sk-head-side">{workspace}</span>
      </div>
      <div className="sk-chat-body">
        <div className="sk-msg sk-a-msg">
          <span className="sk-avatar">{initials(author)}</span>
          <div>
            <div className="sk-who">{author}</div>
            <div className="sk-text">{message}</div>
          </div>
        </div>
        <div className="sk-file sk-a-file">
          <span className="sk-file-ico">
            <FileText strokeWidth={1.75} />
          </span>
          <div className="sk-file-text">
            <div className="sk-file-name">{fileName}</div>
            <div className="sk-file-meta">{fileMeta}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Badges({ pending, done }: { pending: string; done?: string }) {
  return (
    <span className="sk-badge-wrap">
      <span className={cn("sk-badge sk-badge-amber", done && "sk-badge-a")}>{pending}</span>
      {done && <span className="sk-badge sk-badge-green sk-badge-b">{done}</span>}
    </span>
  )
}

/** Scene 2: a source chip feeding a suggested journal entry. */
export function DraftScene({
  sourceLabel = "Receipt",
  sourceAmount = "$480.00",
  title = "Suggested entry",
  badge = "For review",
  columns = ["Account", "Debit", "Credit"],
  rows = [
    { account: "Office supplies", debit: "480.00" },
    { account: "Bank", credit: "480.00" },
  ],
}: DraftSceneProps) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  return (
    <div className="sk-col-flow">
      <div className="sk-source sk-a-src">
        <FileText strokeWidth={1.75} />
        <span className="sk-source-label">{sourceLabel}</span>
        <span className="sk-source-amt">{sourceAmount}</span>
      </div>
      <svg className="sk-link" viewBox="0 0 6 22" aria-hidden>
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x="-4" y="0" width="14" height="22">
            <path className="sk-link-draw sk-a-line" d="M3 0V22" pathLength={1} />
          </mask>
        </defs>
        <path className="sk-link-dash" d="M3 0V22" mask={`url(#${id})`} />
      </svg>
      <div className="sk-card sk-entry">
        <div className="sk-entry-head">
          <span className="sk-head-title">{title}</span>
          <Badges pending={badge} />
        </div>
        <div className="sk-table">
          <div className="sk-tr sk-th">
            <span>{columns[0]}</span>
            <span>{columns[1]}</span>
            <span>{columns[2]}</span>
          </div>
          {rows.slice(0, MAX_ITEMS).map((r, i) => (
            <div key={i} className={cn("sk-tr sk-td", `sk-a-row${i}`)}>
              <span>{r.account}</span>
              <span>{r.debit ?? "—"}</span>
              <span>{r.credit ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Scene 3: the entry's total and a checklist that ticks itself, then flips to Approved. */
export function ReviewScene({
  title = "Suggested entry",
  pendingBadge = "For review",
  doneBadge = "Approved",
  totalLabel = "Total",
  debit = "480.00",
  credit = "480.00",
  checks = ["Balanced", "Source document attached"],
}: ReviewSceneProps) {
  return (
    <div className="sk-card">
      <div className="sk-entry-head">
        <span className="sk-head-title">{title}</span>
        <Badges pending={pendingBadge} done={doneBadge} />
      </div>
      <div className="sk-total">
        <div className="sk-tr">
          <span>{totalLabel}</span>
          <span>{debit}</span>
          <span>{credit}</span>
        </div>
      </div>
      <ul className="sk-checks">
        {checks.slice(0, MAX_ITEMS).map((text, i) => (
          <li key={i} className="sk-check">
            <span className="sk-check-ico">
              <svg viewBox="0 0 16 16">
                <circle className="sk-check-ring" cx="8" cy="8" r="7" />
              </svg>
              <svg viewBox="0 0 16 16">
                <circle className={cn("sk-check-bg", `sk-a-chkbg${i}`)} cx="8" cy="8" r="8" />
                <path className={cn("sk-check-path", `sk-a-chkp${i}`)} d="M4.6 8.4l2.3 2.3 4.5-4.8" pathLength={1} />
              </svg>
            </span>
            <span className={`sk-a-chkt${i}`}>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

/**
 * StepCards – a three-column "how it works" section. Each column is a halftone scene tile
 * holding a small animated UI card, with the step number, title and description below.
 * The three scenes play one after the other on a single loop.
 */
export function StepCards({
  steps = DEFAULT_STEP_CARDS,
  tints = DEFAULT_TINTS,
  scenes,
  speed = 1,
  paused = false,
  accent,
  label = "How it works",
  className,
}: StepCardsProps) {
  const builtIn = [
    <ChatScene key="chat" {...scenes?.chat} />,
    <DraftScene key="draft" {...scenes?.draft} />,
    <ReviewScene key="review" {...scenes?.review} />,
  ]
  const style = {
    "--sk-speed": Math.max(0.1, speed),
    ...(accent ? { "--sk-accent": accent } : null),
  } as React.CSSProperties

  return (
    <section className={cn("sk", className)} style={style} data-paused={paused || undefined} aria-label={label}>
      <style href="step-cards" precedence="default">
        {CSS}
      </style>
      <ol className="sk-list">
        {steps.map((step, i) => (
          <li key={i} className="sk-col">
            <div
              className="sk-tile"
              style={{ "--sk-tint": tints[i % tints.length] ?? DEFAULT_TINTS[i % 3] } as React.CSSProperties}
              aria-hidden
            >
              <div className="sk-scene">{step.scene ?? builtIn[i % builtIn.length]}</div>
            </div>
            <div className="sk-num">{String(i + 1).padStart(2, "0")}</div>
            <h3 className="sk-title">{step.title}</h3>
            <p className="sk-desc">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

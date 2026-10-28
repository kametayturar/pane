"use client"

import * as React from "react"
import { Pause, PenLine, Pencil, Play, RotateCcw, SkipForward, Split, Zap } from "lucide-react"

/**
 * PromptCache – an animated explainer for prompt caching: the shared prefix of each request is cached once,
 * later requests read it back, and the cost and time saved add up. Four requests stack over time, each a bar of
 * the same prefix segments plus its own new message. A toggle edits one segment so the next request matches the
 * cache only up to it. When no requests arrive the time-to-live ring drains and the cache expires.
 *
 *   <PromptCache segments={[{ id: "tools", label: "Tools", tokens: 3800 }, …]} requests={[{ message: "…", tokens: 180 }, …]} />
 */

export type PromptCacheSegment = {
  id: string
  label: string
  /** Token count of the segment. */
  tokens: number
  /** Any CSS colour; defaults to the chart palette. */
  color?: string
}
export type PromptCacheRequest = {
  /** Used in the accessible description and the onRequest payload. */
  message?: string
  /** Size of the new message (the uncached suffix). */
  tokens: number
  /** Simulated seconds since the previous request. */
  gap?: number
}
export type PromptCacheModel = {
  name: string
  mark?: React.ReactNode
  /** Dollars per million input tokens. */
  inputPrice: number
  cacheWritePrice: number
  cacheReadPrice: number
}
export type PromptCacheResult = {
  index: number
  /** Simulated seconds since the first request. */
  time: number
  kind: "write" | "hit" | "partial"
  /** Index of the segment where matching stopped (partial hits only). */
  breakAt: number | null
  cachedTokens: number
  writtenTokens: number
  processedTokens: number
  cost: number
  uncachedCost: number
  firstToken: number
  uncachedFirstToken: number
  changed: boolean
  cold: boolean
  message?: string
}
export type PromptCacheProps = {
  /** The stable prefix in prompt order (put what changes least first). */
  segments?: PromptCacheSegment[]
  /** One to four requests per round. */
  requests?: PromptCacheRequest[]
  /** The model line in the header and the prices behind every cost. */
  model?: PromptCacheModel
  /** Seconds the cache lives after its last use. Every hit refreshes it. Default 300. */
  ttl?: number
  /** Id of the segment the change toggle edits; null hides the toggle. Default "system". */
  changeSegment?: string | null
  /** Plays on its own. With reduced motion it opens on a finished round instead. Default true. */
  autoPlay?: boolean
  /** After a round the cache idles, expires and the story starts over. Default true. */
  loop?: boolean
  /** Seconds to the first output token for a prompt (an illustrative model by default). */
  firstToken?: (tokens: { processed: number; cached: number }) => number
  onRequest?: (result: PromptCacheResult) => void
  onExpire?: () => void
  /** Legend label for the suffix at the end of each prompt. Default "New message". */
  messageLabel?: string
  /** Heading of the card, also its accessible name. Default "Prompt cache". */
  title?: string
  /** Motion speed multiplier – 1 is the designed pace. */
  speed?: number
  /** Freeze everything (animations and the clock together). */
  paused?: boolean
  /** Accent colour (any CSS colour) for the ring, the sweeps and the toggle. */
  accent?: string
  className?: string
}

const DEFAULT_SEGMENTS: PromptCacheSegment[] = [
  { id: "tools", label: "Tools", tokens: 3800 },
  { id: "system", label: "System prompt", tokens: 2400 },
  { id: "documents", label: "Documents", tokens: 36200 },
  { id: "conversation", label: "Conversation", tokens: 6000 },
]
const DEFAULT_REQUESTS: PromptCacheRequest[] = [
  { message: "Which refunds are still pending this week?", tokens: 180 },
  { message: "Draft a reply to Northwind about their late refund", tokens: 240, gap: 42 },
  { message: "Summarize ticket 48213 and the attached invoice", tokens: 410, gap: 35 },
  { message: "Which customers asked about SSO in October?", tokens: 150, gap: 51 },
]
const DEFAULT_MODEL: PromptCacheModel = { name: "Nova 2", inputPrice: 2, cacheWritePrice: 2.5, cacheReadPrice: 0.2 }
const defaultFirstToken = ({ processed, cached }: { processed: number; cached: number }) => 0.42 + processed / 40000 + cached / 500000

/* -------------------------------------------------------------------------- */
/*                                   Logic                                    */
/* -------------------------------------------------------------------------- */

const W = 640
const PAD = 24
const INNER = W - PAD * 2
const PANEL_Y = 118
const PANEL_H = 126
const ROWS_Y = 300
const ROW_H = 56
const MSG_Y = ROWS_Y + ROW_H * 4 + 14
const STATS_Y = MSG_Y + 50
const TOGGLE_Y = STATS_Y + 100
const H = TOGGLE_Y + 36 + PAD
const COLS = 64
const BAR_W = INNER - COLS * 3 - 24
const SEND_EVERY = 4.4
const DRAIN_RATE = 55
const SWEEP = 1.4

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const easeOut = (p: number) => 1 - Math.pow(1 - clamp01(p), 3)
const fmtTok = (n: number) => (n >= 1000 ? `${(Math.round(n / 100) / 10).toString().replace(/\.0$/, "")}K` : String(Math.round(n)))
const money = (n: number) => `$${n.toFixed(4)}`
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

type Row = PromptCacheResult & { animate: boolean; run: number }
type Core = {
  run: number
  reqs: Row[]
  armed: boolean
  versions: number[]
  cache: { versions: number[]; expiresAt: number } | null
  epochs: number[]
  epoch: number
  reads: number
  sim: number
  lastSendSim: number
  simFrom: number
  simTo: number
  t0: number
  t1: number
  story: number
  fx: number
  phase: "wait" | "hold" | "drain" | "expired"
  endAt: number
  ring: number
  ringAtSend: number
  sentFx: number
  sentKind: "write" | "hit" | "partial" | null
  tweens: { i: number; start: number; dur: number; from: number[]; to: number[] }[]
  lastEvent: { kind: "write" | "hit" | "partial" | "expired" | "reset" | null; breakAt: number | null }
}
type Snap = { run: number; reqs: Row[]; armed: boolean; epochs: number[]; epoch: number; reads: number; event: Core["lastEvent"]; phase: Core["phase"] }

const freshCore = (nSeg: number, run: number): Core => ({
  run,
  reqs: [],
  armed: false,
  versions: Array(nSeg).fill(0),
  cache: null,
  epochs: Array(nSeg).fill(-1),
  epoch: 0,
  reads: 0,
  sim: 0,
  lastSendSim: 0,
  simFrom: 0,
  simTo: 0,
  t0: 0,
  t1: 0.9,
  story: 0,
  fx: 0,
  phase: "wait",
  endAt: 0,
  ring: 0,
  ringAtSend: 0,
  sentFx: -99,
  sentKind: null,
  tweens: [],
  lastEvent: { kind: null, breakAt: null },
})
const snap = (c: Core): Snap => ({ run: c.run, reqs: [...c.reqs], armed: c.armed, epochs: [...c.epochs], epoch: c.epoch, reads: c.reads, event: c.lastEvent, phase: c.phase })

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pc {
  --pc-ink: #000;
  --pc-surface: #fff;
  --pc-accent: #0060e2;
  --pc-ok: #1b9a52;
  --pc-warn: #d98a0b;
  --pc-c0: #e0a100; --pc-c1: #7b3fb8; --pc-c2: #0e9f8e; --pc-c3: #3a7bd5;
  --pc-t1: color-mix(in oklab, var(--pc-ink) 88%, transparent);
  --pc-t2: color-mix(in oklab, var(--pc-ink) 61%, transparent);
  --pc-t3: color-mix(in oklab, var(--pc-ink) 45%, transparent);
  --pc-t4: color-mix(in oklab, var(--pc-ink) 27%, transparent);
  --pc-fill: color-mix(in oklab, var(--pc-ink) 6%, transparent);
  --pc-line: color-mix(in oklab, var(--pc-ink) 8%, transparent);
  --pc-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 1px -1px rgb(0 0 0 / .1), 0 8px 24px -12px rgb(0 0 0 / .12);
  --pc-ease: cubic-bezier(.22, 1, .36, 1);
  --pc-speed: 1;
  --pc-scale: 1;
  margin: 0; width: 100%; max-width: ${W}px; display: block; text-align: left;
  font-family: var(--pc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; color: var(--pc-t1);
}
:is(.dark, [data-theme="dark"]) .pc {
  --pc-ink: #fff; --pc-surface: #1c1c1e; --pc-accent: #4d8dff; --pc-ok: #34d27b; --pc-warn: #f0b43a;
  --pc-c0: #f0b43a; --pc-c1: #a77be0; --pc-c2: #2ec4b0; --pc-c3: #6aa4ff;
  --pc-t1: color-mix(in oklab, var(--pc-ink) 90%, transparent);
  --pc-t2: color-mix(in oklab, var(--pc-ink) 62%, transparent);
  --pc-t3: color-mix(in oklab, var(--pc-ink) 46%, transparent);
  --pc-t4: color-mix(in oklab, var(--pc-ink) 28%, transparent);
  --pc-fill: color-mix(in oklab, var(--pc-ink) 9%, transparent);
  --pc-line: color-mix(in oklab, var(--pc-ink) 11%, transparent);
  --pc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 32px -12px rgb(0 0 0 / .7);
}
.pc *, .pc *::before, .pc *::after { box-sizing: border-box }
.pc button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.pc :focus-visible { outline: 2px solid color-mix(in oklab, var(--pc-accent) 60%, transparent); outline-offset: 2px }
.pc-box { position: relative; width: 100% }
.pc-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--pc-scale)) }
.pc-card { position: absolute; inset: 0; border-radius: 30px; background: var(--pc-surface); box-shadow: var(--pc-shadow) }
.pc-abs { position: absolute }

.pc-head { left: ${PAD}px; top: ${PAD}px; width: ${INNER - 130}px }
.pc-title { margin: 0; font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.012em }
.pc-model { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; font-size: 12px; line-height: 18px; color: var(--pc-t2); white-space: nowrap }
.pc-model svg, .pc-model img { width: 14px; height: 14px }
.pc-model-mark { display: inline-block; width: 12px; height: 12px; border-radius: 4px; background: conic-gradient(from 200deg, var(--pc-c0), var(--pc-c1), var(--pc-c2), var(--pc-c3), var(--pc-c0)) }
.pc-ctrls { right: ${PAD}px; top: ${PAD}px; display: flex; gap: 6px }
.pc-ib { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; color: var(--pc-t2); box-shadow: inset 0 0 0 1px var(--pc-line); transition: background .15s, color .15s }
.pc-ib:hover { background: var(--pc-fill); color: var(--pc-t1) }
.pc-ib:disabled { opacity: .4; cursor: default }
.pc-ib svg { width: 15px; height: 15px }

.pc-legend { left: ${PAD}px; top: 84px; width: ${INNER}px; display: flex; flex-wrap: wrap; gap: 4px 11px; font-size: 11.5px; line-height: 18px; color: var(--pc-t2) }
.pc-legend span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap }
.pc-legend b { font-weight: 400; color: var(--pc-t3); font-variant-numeric: tabular-nums }
.pc-sw-dot { width: 10px; height: 10px; border-radius: 3px; background: var(--c) }

.pc-panel { left: ${PAD}px; top: ${PANEL_Y}px; width: ${INNER}px; height: ${PANEL_H}px; border-radius: 22px; box-shadow: inset 0 0 0 1px var(--pc-line) }
.pc-ring-wrap { left: 16px; top: 16px; width: 26px; height: 26px }
.pc-ring-wrap svg { width: 26px; height: 26px; transform: rotate(-90deg); overflow: visible }
.pc-ring-bg { fill: none; stroke: var(--pc-fill); stroke-width: 2.6 }
.pc-ring-fg { fill: none; stroke: var(--pc-accent); stroke-width: 2.6; stroke-linecap: round }
.pc-panel-t { left: 52px; top: 14px }
.pc-panel-t b { display: block; font-size: 14px; line-height: 18px; font-weight: 500; letter-spacing: -.01em }
.pc-panel-t span { display: block; font-size: 12px; line-height: 16px; color: var(--pc-t2); font-variant-numeric: tabular-nums }
.pc-pbar { left: 16px; top: 62px; width: ${INNER - 34}px; display: flex; gap: 2px; height: 10px }
.pc-row[data-still] *, .pc-row[data-still] *::before, .pc-row[data-still] *::after { animation: none !important }
.pc-cap { left: 16px; top: 78px; font-size: 12px; line-height: 16px; color: var(--pc-t3); font-variant-numeric: tabular-nums }
.pc-prices { left: 16px; right: 16px; top: 100px; display: flex; gap: 14px; font-size: 12px; line-height: 16px; color: var(--pc-t2); white-space: nowrap }
.pc-prices b { font-weight: 500; color: var(--pc-t1); margin-left: 4px; font-variant-numeric: tabular-nums }
.pc-prices em { margin-left: auto; font-style: normal; color: var(--pc-t3) }

.pc-seg { position: relative; display: block; height: 10px; border-radius: 3px; overflow: hidden; background: var(--pc-fill); min-width: 0 }
.pc-seg[data-k="processed"] { background: color-mix(in oklab, var(--c) 12%, transparent) }
.pc-sw { position: absolute; inset: 0; border-radius: inherit }
.pc-seg[data-k="processed"] .pc-sw { background: var(--c); animation: pc-sweep calc(var(--l, .1s) / var(--pc-speed)) linear calc(var(--d, 0s) / var(--pc-speed)) backwards }
.pc-seg[data-k="cached"] { background: color-mix(in oklab, var(--c) 22%, var(--pc-surface)); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c) 55%, transparent); animation: pc-tint calc(.3s / var(--pc-speed)) var(--pc-ease) calc(var(--d, 0s) / var(--pc-speed)) backwards }
.pc-seg[data-k="cached"] .pc-sw { opacity: 0; background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--c) 90%, transparent) 50%, transparent); animation: pc-band calc(.55s / var(--pc-speed)) ease-in-out calc(var(--d, 0s) / var(--pc-speed)) }
.pc-seg[data-k="msg"] { background: color-mix(in oklab, var(--pc-ink) 12%, transparent) }
.pc-seg[data-k="msg"] .pc-sw { background: var(--pc-t1); animation: pc-sweep calc(var(--l, .1s) / var(--pc-speed)) linear calc(var(--d, 0s) / var(--pc-speed)) backwards }
.pc-seg[data-k="empty"] { background: var(--pc-fill) }
.pc-seg[data-k="panel"] { background: color-mix(in oklab, var(--c) 22%, var(--pc-surface)); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--c) 55%, transparent) }
.pc-seg[data-k="panel"][data-anim="land"] { animation: pc-land calc(.5s / var(--pc-speed)) var(--pc-ease) calc(var(--d, 0s) / var(--pc-speed)) backwards }
.pc-seg[data-k="panel"][data-anim="rewrite"] { animation: pc-rewrite calc(2.2s / var(--pc-speed)) var(--pc-ease) backwards }
.pc-seg[data-k="panel"][data-empty] { opacity: 0 }
@keyframes pc-sweep { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes pc-tint { from { opacity: 0 } to { opacity: 1 } }
@keyframes pc-band { 0% { opacity: 1; transform: translateX(-100%) } 100% { opacity: 1; transform: translateX(100%) } }
@keyframes pc-land { from { opacity: 0; transform: scaleX(.94) } to { opacity: 1; transform: none } }
@keyframes pc-rewrite { 0% { opacity: 1 } 14% { opacity: 0 } 84% { opacity: 0; transform: scaleX(.94) } 100% { opacity: 1; transform: none } }
.pc-pband { position: absolute; inset: 0; overflow: hidden; border-radius: 3px; pointer-events: none }
.pc-pband i { position: absolute; inset: 0; opacity: 0; background: linear-gradient(90deg, transparent 15%, color-mix(in oklab, var(--pc-accent) 50%, transparent) 50%, transparent 85%); animation: pc-band calc(.8s / var(--pc-speed)) ease-in-out calc(.1s / var(--pc-speed)) }

.pc-rh { left: ${PAD}px; top: ${ROWS_Y - 28}px; width: ${INNER}px; height: 20px }
.pc-rh-l { display: flex; gap: 14px; font-size: 12px; line-height: 20px; color: var(--pc-t2) }
.pc-rh-l span { display: inline-flex; align-items: center; gap: 6px }
.pc-key { width: 10px; height: 10px; border-radius: 3px }
.pc-key-p { background: var(--pc-t1) }
.pc-key-c { background: color-mix(in oklab, var(--pc-ink) 14%, var(--pc-surface)); box-shadow: inset 0 0 0 1px var(--pc-t4) }
.pc-cols { position: absolute; right: 0; top: 0; display: flex; font-size: 12px; line-height: 20px; color: var(--pc-t3) }
.pc-cols span, .pc-m { width: ${COLS}px; text-align: right }

.pc-row { left: ${PAD}px; width: ${INNER}px; height: ${ROW_H - 6}px }
.pc-row-top { position: absolute; left: 0; top: 0; width: ${BAR_W}px; display: flex; align-items: baseline; gap: 8px; height: 20px }
.pc-row-name { font-size: 13px; line-height: 20px; font-weight: 500; letter-spacing: -.01em }
.pc-row[data-empty] .pc-row-name { color: var(--pc-t3); font-weight: 400 }
.pc-row-time { font-size: 12px; color: var(--pc-t3); font-variant-numeric: tabular-nums }
.pc-status { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; line-height: 20px; font-weight: 500; white-space: nowrap; animation: pc-in calc(.35s / var(--pc-speed)) var(--pc-ease) backwards }
.pc-status svg { width: 13px; height: 13px }
.pc-status[data-k="write"] { color: var(--pc-t2) }
.pc-status[data-k="hit"] { color: var(--pc-ok) }
.pc-status[data-k="partial"] { color: var(--pc-warn) }
@keyframes pc-in { from { opacity: 0; filter: blur(2px); transform: translateY(2px) } to { opacity: 1; filter: none; transform: none } }
.pc-bar { position: absolute; left: 0; top: 26px; width: ${BAR_W}px; display: flex; gap: 2px; height: 10px }
.pc-brk { position: absolute; top: -5px; width: 2px; margin-left: -1px; height: 20px; border-radius: 2px; background: var(--pc-warn); animation: pc-brk calc(.45s / var(--pc-speed)) var(--pc-ease) calc(var(--d, 0s) / var(--pc-speed)) backwards }
@keyframes pc-brk { from { opacity: 0; transform: scaleY(.2) } to { opacity: 1; transform: none } }
.pc-m { position: absolute; top: 6px; font-size: 13px; line-height: 20px; color: var(--pc-t1); font-variant-numeric: tabular-nums; white-space: nowrap }
.pc-m[data-dim] { color: var(--pc-t4) }
.pc-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.pc-fly { left: 0; top: 0; display: flex; gap: 2px; height: 10px; pointer-events: none; opacity: 0; z-index: 4; animation: pc-fly calc(.46s / var(--pc-speed)) cubic-bezier(.2, .7, .2, 1) calc(var(--fd, 1.5s) / var(--pc-speed)) }
.pc-fly i { display: block; height: 10px; border-radius: 3px; background: var(--c); flex: var(--w) 0 0 }
@keyframes pc-fly { 0% { opacity: 1; transform: translate(var(--fx), var(--fy)); width: var(--fw) } 82% { opacity: 1 } 100% { opacity: 0; transform: translate(var(--tx), var(--ty)); width: var(--tw) } }

.pc-msg { left: ${PAD}px; top: ${MSG_Y}px; width: ${INNER}px; font-size: 13.5px; line-height: 20px; color: var(--pc-t2); min-height: 40px }
.pc-msg span { display: block; animation: pc-in calc(.4s / var(--pc-speed)) var(--pc-ease) backwards }
.pc-stats { left: ${PAD}px; top: ${STATS_Y}px; width: ${INNER}px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-top: 14px; border-top: 1px solid var(--pc-line) }
.pc-stat b { display: block; font-size: 26px; line-height: 30px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums }
.pc-stat span { display: block; font-size: 13px; line-height: 18px; color: var(--pc-t1) }
.pc-stat em { display: block; font-style: normal; font-size: 12px; line-height: 18px; color: var(--pc-t3); font-variant-numeric: tabular-nums }
.pc-toggle { left: ${PAD}px; top: ${TOGGLE_Y}px; display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 12px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--pc-line);
  font-size: 13px; font-weight: 500; letter-spacing: -.01em; transition: background .2s, box-shadow .2s, color .2s }
.pc-toggle:hover { background: var(--pc-fill) }
.pc-toggle svg { width: 14px; height: 14px; color: var(--pc-t2) }
.pc-toggle[aria-pressed="true"] { background: color-mix(in oklab, var(--pc-accent) 11%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--pc-accent) 55%, transparent) }
.pc-toggle[aria-pressed="true"] svg { color: var(--pc-accent) }

.pc[data-paused] *, .pc[data-paused] *::before, .pc[data-paused] *::after { animation-play-state: paused !important }
.pc[data-static] *, .pc[data-static] *::before, .pc[data-static] *::after { animation: none !important; transition: none !important }
@media (prefers-reduced-motion: reduce) { .pc *, .pc *::before, .pc *::after { animation: none !important; transition: none !important } }
`

/* -------------------------------------------------------------------------- */
/*                              Pure story logic                              */
/* -------------------------------------------------------------------------- */

type Ctx = {
  segs: PromptCacheSegment[]
  reqs: PromptCacheRequest[]
  model: PromptCacheModel
  ttl: number
  prefix: number
  changeIdx: number
  firstToken: (t: { processed: number; cached: number }) => number
}

/** What a request costs and how fast it is, given what the cache holds at that moment. */
function evaluate(x: Ctx, c: Core, i: number) {
  const r = x.reqs[i]
  const n = x.segs.length
  const gap = i === 0 ? 0 : (r.gap ?? 40)
  const simNow = i === 0 ? 0 : c.lastSendSim + gap
  const changed = c.armed && x.changeIdx >= 0
  const versions = c.versions.slice()
  if (changed) versions[x.changeIdx]++
  const valid = !!c.cache && simNow <= c.cache.expiresAt
  let m = -1
  if (valid && c.cache) {
    for (let s = 0; s < n; s++)
      if (c.cache.versions[s] !== versions[s]) {
        m = s
        break
      }
  }
  let kind: "write" | "hit" | "partial" = "write"
  let cached = 0
  if (valid && m === -1) {
    kind = "hit"
    cached = x.prefix
  } else if (valid && m > 0) {
    kind = "partial"
    cached = x.segs.slice(0, m).reduce((a, s) => a + s.tokens, 0)
  }
  const written = x.prefix - cached
  const processed = kind === "hit" ? r.tokens : written + r.tokens
  const cost = (cached * x.model.cacheReadPrice + written * x.model.cacheWritePrice + r.tokens * x.model.inputPrice) / 1e6
  const result: PromptCacheResult = {
    index: i,
    time: simNow,
    kind,
    breakAt: kind === "partial" ? m : null,
    cachedTokens: cached,
    writtenTokens: written,
    processedTokens: processed,
    cost,
    uncachedCost: ((x.prefix + r.tokens) * x.model.inputPrice) / 1e6,
    firstToken: x.firstToken({ processed: written + r.tokens, cached }),
    uncachedFirstToken: x.firstToken({ processed: x.prefix + r.tokens, cached: 0 }),
    changed,
    cold: !valid,
    message: r.message,
  }
  return { result, versions }
}

/** Sends request `i`: updates the cache, the simulated clock and what comes next. */
function applyRequest(x: Ctx, c: Core, i: number, animate: boolean) {
  const n = x.segs.length
  const { result, versions } = evaluate(x, c, i)
  const simNow = result.time
  c.versions = versions
  c.armed = false
  c.sim = simNow
  c.lastSendSim = simNow
  c.epoch++
  if (result.kind === "hit") {
    c.reads++
    if (c.cache) c.cache.expiresAt = simNow + x.ttl
  } else {
    c.cache = { versions: versions.slice(), expiresAt: simNow + x.ttl }
    const from = result.kind === "partial" && result.breakAt != null ? result.breakAt : 0
    for (let s = from; s < n; s++) c.epochs[s] = c.epoch
  }
  c.lastEvent = { kind: result.kind, breakAt: result.breakAt }
  c.sentFx = c.fx
  c.sentKind = result.kind
  c.ringAtSend = c.ring
  const prev = c.reqs.length ? c.reqs[c.reqs.length - 1] : null
  c.reqs.push({ ...result, animate, run: c.run })
  if (animate) {
    c.tweens.push({
      i,
      start: c.fx + (result.kind === "hit" ? 0.85 : result.kind === "partial" ? 1.2 : 1.6),
      dur: 0.8,
      from: prev ? [prev.processedTokens, prev.cost, prev.firstToken] : [0, 0, 0],
      to: [result.processedTokens, result.cost, result.firstToken],
    })
  }
  if (i + 1 < x.reqs.length) {
    c.phase = "wait"
    c.t0 = c.story
    c.t1 = c.story + SEND_EVERY
    c.simFrom = simNow
    c.simTo = simNow + (x.reqs[i + 1].gap ?? 40)
  } else {
    c.phase = "hold"
    c.endAt = c.story + 3
  }
  return result
}

/** A finished round (used for reduced motion, and when the story starts paused). */
function finishedCore(x: Ctx, endAt: number) {
  const c = freshCore(x.segs.length, 0)
  for (let i = 0; i < x.reqs.length; i++) applyRequest(x, c, i, false)
  c.tweens = []
  c.phase = "hold"
  c.endAt = endAt
  c.ring = 1
  c.sentFx = -99
  return c
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const readMotion = () => (typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches)
const RING_R = 10.5
const RING_C = 2 * Math.PI * RING_R
const outcomeWord = (k: "write" | "hit" | "partial") => (k === "write" ? "cache write" : k === "hit" ? "cache hit" : "partial hit")
const sum = (a: number[], from = 0, to = a.length) => a.slice(from, to).reduce((p, q) => p + q, 0)

export function PromptCache({
  segments = DEFAULT_SEGMENTS,
  requests = DEFAULT_REQUESTS,
  model = DEFAULT_MODEL,
  ttl = 300,
  changeSegment = "system",
  autoPlay = true,
  loop = true,
  firstToken = defaultFirstToken,
  onRequest,
  onExpire,
  messageLabel = "New message",
  title = "Prompt cache",
  speed = 1,
  paused,
  accent,
  className,
}: PromptCacheProps) {
  const segs = React.useMemo(() => segments.slice(0, 6), [segments])
  const reqCfg = React.useMemo(() => requests.slice(0, 4), [requests])
  const nSeg = segs.length
  const prefix = segs.reduce((a, s) => a + s.tokens, 0)
  const changeIdx = changeSegment ? segs.findIndex((s) => s.id === changeSegment) : -1
  const ctx = React.useMemo<Ctx>(() => ({ segs, reqs: reqCfg, model, ttl, prefix, changeIdx, firstToken }), [segs, reqCfg, model, ttl, prefix, changeIdx, firstToken])
  const reduced = React.useSyncExternalStore(subscribeMotion, readMotion, () => false)

  // Bar geometry: widths follow the square root of the token count so a short message stays visible beside a long document.
  const widths = React.useMemo(() => {
    const all = [...segs.map((s) => Math.sqrt(s.tokens)), Math.sqrt(Math.max(1, ...reqCfg.map((r) => r.tokens)))]
    const rowScale = (BAR_W - (all.length - 1) * 2) / sum(all)
    const panelW = INNER - 34
    const pre = all.slice(0, -1)
    const panelScale = (panelW - (pre.length - 1) * 2) / sum(pre)
    return { row: all.map((w) => w * rowScale), panel: pre.map((w) => w * panelScale) }
  }, [segs, reqCfg])
  const colorOf = (i: number) => segs[i]?.color ?? `var(--pc-c${i % 4})`

  const [initial] = React.useState<Core>(() => {
    if (readMotion()) return finishedCore(ctx, Infinity)
    if (paused) return finishedCore(ctx, 2)
    return freshCore(nSeg, 0)
  })
  const core = React.useRef<Core>(initial)
  const [view, setView] = React.useState<Snap>(() => snap(initial))
  const [localPaused, setLocalPaused] = React.useState(() => !autoPlay || readMotion())
  const [stepping, setStepping] = React.useState(false)
  const [live, setLive] = React.useState("")

  const rootRef = React.useRef<HTMLElement>(null)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<SVGCircleElement>(null)
  const statusRef = React.useRef<HTMLSpanElement>(null)
  const frozen = React.useRef(!!paused || localPaused)
  const fxOn = React.useRef(false)
  const speedRef = React.useRef(speed)
  const kick = React.useRef<() => void>(() => {})
  const loopRef = React.useRef(loop)
  const ctxRef = React.useRef(ctx)
  const cbs = React.useRef({ onRequest, onExpire })
  const tickRef = React.useRef<(dt: number) => void>(() => {})

  const commit = () => setView(snap(core.current))

  const sendNext = () => {
    const c = core.current
    const i = c.reqs.length
    if (i >= ctxRef.current.reqs.length || c.phase === "drain" || c.phase === "expired") return null
    const res = applyRequest(ctxRef.current, c, i, !readMotion())
    cbs.current.onRequest?.(res)
    commit()
    kick.current()
    return res
  }

  /** Advances the story and writes the ring, the countdown and the rolling numbers straight to the DOM. */
  const tick = (dt: number) => {
    let c = core.current
    const x = ctxRef.current
    const play = !frozen.current
    const fxDt = play || fxOn.current ? dt : 0
    c.fx += fxDt
    if (play) {
      c.story += dt
      if (c.phase === "wait") {
        if (c.story >= c.t1) {
          const res = applyRequest(x, c, c.reqs.length, !readMotion())
          cbs.current.onRequest?.(res)
          commit()
        } else c.sim = lerp(c.simFrom, c.simTo, clamp01((c.story - c.t0) / Math.max(0.001, c.t1 - c.t0)))
      } else if (c.phase === "hold") {
        if (c.story >= c.endAt) {
          c.phase = "drain"
          commit()
        }
      } else if (c.phase === "drain") {
        c.sim += dt * DRAIN_RATE
        if (c.cache && c.sim >= c.cache.expiresAt) {
          c.phase = "expired"
          c.endAt = c.story + 2.4
          c.cache = null
          c.epochs = c.epochs.map(() => -1)
          c.lastEvent = { kind: "expired", breakAt: null }
          cbs.current.onExpire?.()
          commit()
        }
      } else if (c.phase === "expired" && loopRef.current && c.story >= c.endAt) {
        c = core.current = freshCore(x.segs.length, c.run + 1)
        commit()
      }
    }
    // Ring and countdown. A write lands after the flight, so the ring only refills then.
    const remaining = c.cache ? Math.max(0, c.cache.expiresAt - c.sim) : 0
    const landed = c.fx - c.sentFx > (c.sentKind === "hit" ? 0.3 : c.sentKind === "partial" ? 2.0 : 2.0)
    const target = !c.cache ? 0 : landed ? remaining / x.ttl : c.sentKind === "hit" ? remaining / x.ttl : c.ringAtSend
    c.ring += (target - c.ring) * (fxDt > 0 ? 1 - Math.exp(-dt * 9) : 0)
    if (Math.abs(target - c.ring) < 0.0004) c.ring = target
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING_C * (1 - c.ring))
    if (statusRef.current) {
      let text = "Empty"
      if (c.cache) {
        const since = c.fx - c.sentFx
        const last = c.reqs[c.reqs.length - 1]
        if (last?.animate && c.sentKind === "hit" && since < 1.4) text = "Reading"
        else if (last?.animate && c.sentKind && c.sentKind !== "hit" && since < 2.1) text = "Writing"
        else text = `Expires in ${clock(Math.ceil(remaining))}`
      } else if (c.lastEvent.kind === "expired") text = "Expired"
      if (statusRef.current.textContent !== text) statusRef.current.textContent = text
    }
    // Numbers roll from the row above.
    if (c.tweens.length) {
      const run = c.run
      c.tweens = c.tweens.filter((tw) => {
        if (c.fx < tw.start) return true
        const p = clamp01((c.fx - tw.start) / tw.dur)
        const e = easeOut(p)
        const row = rootRef.current?.querySelector(`[data-row="${run}-${tw.i}"]`)
        if (row) {
          const vals = [fmtTok(lerp(tw.from[0], tw.to[0], e)), money(lerp(tw.from[1], tw.to[1], e)), `${lerp(tw.from[2], tw.to[2], e).toFixed(2)}s`]
          row.querySelectorAll<HTMLElement>("[data-m]").forEach((el, k) => {
            if (el.textContent !== vals[k]) el.textContent = vals[k]
            el.removeAttribute("data-dim")
          })
        }
        return p < 1
      })
    }
  }

  React.useEffect(() => {
    ctxRef.current = ctx
    cbs.current = { onRequest, onExpire }
    loopRef.current = loop
    speedRef.current = Math.max(0.05, speed)
    tickRef.current = tick
  })

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let last = 0
    let visible = false
    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.08, (now - last) / 1000) * speedRef.current : 0
      last = now
      tickRef.current(dt)
      const c = core.current
      const idle = c.phase === "hold" && c.endAt === Infinity
      const settling = Math.abs((c.cache ? c.ring : 0) - c.ring) > 0.0004 || c.tweens.length > 0
      const busy = (!frozen.current && !idle) || fxOn.current || (settling && !frozen.current)
      if (visible && busy) raf = requestAnimationFrame(frame)
      else last = 0
    }
    const start = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    kick.current = start
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      if (visible) start()
      else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      kick.current = () => {}
    }
  }, [])
  React.useEffect(() => {
    frozen.current = !!paused || localPaused
    fxOn.current = stepping
    kick.current()
  }, [paused, localPaused, stepping])
  React.useEffect(() => {
    if (!stepping) return
    const id = window.setTimeout(() => setStepping(false), 4200 / Math.max(0.05, speed))
    return () => window.clearTimeout(id)
  }, [stepping, speed])
  React.useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const set = () => box.style.setProperty("--pc-scale", String(box.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  const onStep = () => {
    if (frozen.current && !readMotion()) setStepping(true)
    const res = sendNext()
    if (res) setLive(`Request ${res.index + 1}: ${outcomeWord(res.kind)}.`)
  }
  const onToggle = () => {
    const c = core.current
    c.armed = !c.armed
    commit()
    setLive(c.armed ? `The ${segs[changeIdx]?.label ?? "segment"} will change on the next request.` : "Change cancelled.")
  }
  const onPlay = () => {
    setLocalPaused((v) => !v)
    setLive(localPaused ? "Playing." : "Paused.")
  }
  const onReset = () => {
    core.current = freshCore(ctxRef.current.segs.length, core.current.run + 1)
    commit()
    kick.current()
    setLive("Reset.")
  }

  /* ----- derived UI ----- */
  const reqs = view.reqs
  const totalCost = reqs.reduce((a, r) => a + r.cost, 0)
  const totalUncached = reqs.reduce((a, r) => a + r.uncachedCost, 0)
  const hits = reqs.filter((r) => r.kind !== "write")
  const savedPct = totalUncached > 0 ? Math.abs(1 - totalCost / totalUncached) * 100 : 0
  const higher = totalCost > totalUncached
  const ftHit = hits.length ? sum(hits.map((r) => r.firstToken)) / hits.length : 0
  const ftUnc = hits.length ? sum(hits.map((r) => r.uncachedFirstToken)) / hits.length : 0
  const last = reqs[reqs.length - 1]
  const minutes = Math.round(ttl / 60)
  let message = "Request 1: not sent yet."
  if (view.event.kind === "expired") message = "The cache expired. The next request would write it again."
  else if (last && view.phase === "drain") message = `No new requests. The cache expires ${minutes} minutes after its last use.`
  else if (last) {
    if (last.kind === "write") message = `${last.cold && last.index > 0 ? "The cache had expired, so this writes it again." : "Cache write."} The prefix stays cached for ${minutes} minutes and costs ${+(model.cacheWritePrice / model.inputPrice).toFixed(2)}x the input price to store.`
    else if (last.kind === "hit") message = `Cache hit. ${fmtTok(last.cachedTokens)} tokens read at ${+(model.cacheReadPrice / model.inputPrice).toFixed(2)}x the price. Only ${last.processedTokens} new tokens processed.`
    else message = `Partial hit. Matching stopped at ${segs[last.breakAt ?? 0]?.label ?? "the change"}, so ${fmtTok(last.cachedTokens)} tokens were read and ${fmtTok(last.writtenTokens)} were rewritten.`
  }

  /** Delays and lengths of each segment's sweep: one steady linear pass over what needs processing, one band over what is cached. */
  const rowTiming = (r: Row) => {
    const wRow = widths.row
    const out: { k: "processed" | "cached" | "msg"; d: number; l: number }[] = []
    if (r.kind === "write") {
      const total = sum(wRow)
      wRow.forEach((w, s) => out.push({ k: s === nSeg ? "msg" : "processed", d: 0.2 + (sum(wRow, 0, s) / total) * SWEEP, l: (w / total) * SWEEP }))
    } else {
      const m = r.kind === "partial" && r.breakAt != null ? r.breakAt : nSeg
      const pre = Math.max(1, sum(wRow, 0, m))
      for (let s = 0; s < m; s++) out.push({ k: "cached", d: 0.1 + (sum(wRow, 0, s) / pre) * 0.5, l: 0.3 })
      const rest = Math.max(1, sum(wRow, m))
      const span = r.kind === "partial" ? SWEEP * 0.9 : 0.35
      const base = m > 0 ? 0.7 : 0.2
      for (let s = m; s <= nSeg; s++) out.push({ k: s === nSeg ? "msg" : "processed", d: base + (sum(wRow, m, s) / rest) * span, l: (wRow[s] / rest) * span })
    }
    return out
  }

  const frozenUI = (!!paused || localPaused) && !stepping
  const vars = { "--pc-speed": Math.max(0.05, speed), ...(accent ? { "--pc-accent": accent } : null) } as React.CSSProperties
  const price = (n: number) => `$${n.toFixed(2)}`
  const rowSentence = (r: Row) =>
    `Request ${r.index + 1} at ${clock(r.time)}${r.message ? `, "${r.message}"` : ""}: ${outcomeWord(r.kind)}. ${fmtTok(r.cachedTokens)} tokens read from the cache, ${fmtTok(r.processedTokens)} processed, input cost ${money(r.cost)}, first token in ${r.firstToken.toFixed(2)} seconds.`
  const cachedAny = view.epochs.some((e) => e >= 0)
  const lastAnimated = !!last?.animate

  return (
    <section ref={rootRef} className={className ? `pc ${className}` : "pc"} style={vars} aria-label={`${title} (simulation with sample prices)`} data-paused={frozenUI || undefined} data-static={reduced || undefined}>
      <style href="pane-prompt-cache" precedence="default">
        {CSS}
      </style>
      <div ref={boxRef} className="pc-box" style={{ aspectRatio: `${W} / ${H}` }}>
        <div className="pc-stage">
          <div className="pc-card" />
          <div className="pc-abs pc-head">
            <h3 className="pc-title">{title}</h3>
            <p className="pc-model">
              {model.mark ?? <i className="pc-model-mark" aria-hidden />}
              <span>{model.name}</span>
              <span aria-hidden>·</span>
              <span>{minutes} minute cache</span>
            </p>
          </div>
          <div className="pc-abs pc-ctrls">
            <button type="button" className="pc-ib" aria-label={localPaused ? "Play" : "Pause"} aria-pressed={localPaused} title={localPaused ? "Play" : "Pause"} onClick={onPlay}>
              {localPaused ? <Play strokeWidth={1.8} /> : <Pause strokeWidth={1.8} />}
            </button>
            <button type="button" className="pc-ib" aria-label="Send the next request" title="Send the next request" onClick={onStep} disabled={reqs.length >= reqCfg.length}>
              <SkipForward strokeWidth={1.8} />
            </button>
            <button type="button" className="pc-ib" aria-label="Reset" title="Reset" onClick={onReset}>
              <RotateCcw strokeWidth={1.8} />
            </button>
          </div>

          <div className="pc-abs pc-legend" aria-hidden>
            {segs.map((s, i) => (
              <span key={s.id}>
                <i className="pc-sw-dot" style={{ "--c": colorOf(i) } as React.CSSProperties} />
                {s.label} <b>{fmtTok(s.tokens)}</b>
              </span>
            ))}
            <span>
              <i className="pc-sw-dot" style={{ "--c": "var(--pc-t1)" } as React.CSSProperties} />
              {messageLabel}
            </span>
          </div>

          <div className="pc-abs pc-panel" aria-hidden>
            <div className="pc-abs pc-ring-wrap">
              <svg viewBox="0 0 26 26">
                <circle className="pc-ring-bg" cx="13" cy="13" r={RING_R} />
                <circle ref={ringRef} className="pc-ring-fg" cx="13" cy="13" r={RING_R} strokeDasharray={RING_C} strokeDashoffset={RING_C} />
              </svg>
            </div>
            <div className="pc-abs pc-panel-t">
              <b>Cache</b>
              <span ref={statusRef}>Empty</span>
            </div>
            <div className="pc-abs pc-pbar">
              {segs.map((_, i) => {
                const ep = view.epochs[i]
                const filled = ep >= 0
                const isNew = filled && ep === view.epoch && lastAnimated
                const rewrite = isNew && view.event.kind === "partial" && view.event.breakAt != null && i >= view.event.breakAt
                return (
                  <span
                    key={`${i}-${ep}`}
                    className="pc-seg"
                    data-k={filled ? "panel" : "empty"}
                    data-anim={isNew ? (rewrite ? "rewrite" : "land") : undefined}
                    data-empty={filled ? undefined : ""}
                    style={{ flex: `${widths.panel[i]} 0 0`, "--c": colorOf(i), "--d": `${(view.event.kind === "partial" ? 1.9 : 1.75) + i * 0.05}s` } as React.CSSProperties}
                  />
                )
              })}
              {view.event.kind === "hit" && lastAnimated ? (
                <span key={view.reads} className="pc-pband">
                  <i />
                </span>
              ) : null}
            </div>
            <div className="pc-abs pc-cap">{cachedAny ? `${fmtTok(prefix)} tokens cached` : "0 tokens cached"}</div>
            <div className="pc-abs pc-prices">
              <span>
                Input<b>{price(model.inputPrice)}</b>
              </span>
              <span>
                Cache write<b>{price(model.cacheWritePrice)}</b>
              </span>
              <span>
                Cache read<b>{price(model.cacheReadPrice)}</b>
              </span>
              <em>Per million tokens</em>
            </div>
          </div>

          <div className="pc-abs pc-rh" aria-hidden>
            <div className="pc-rh-l">
              <span>
                <i className="pc-key pc-key-p" />
                Processed
              </span>
              <span>
                <i className="pc-key pc-key-c" />
                From cache
              </span>
            </div>
            <div className="pc-cols">
              <span>Processed</span>
              <span>Input cost</span>
              <span>First token</span>
            </div>
          </div>

          {reqCfg.map((cfg, i) => {
            const r = reqs[i]
            const top = ROWS_Y + i * ROW_H
            const timing = r ? rowTiming(r) : []
            const from = r && r.kind === "partial" && r.breakAt != null ? r.breakAt : 0
            const roll = !!r?.animate
            const cells = r ? [fmtTok(r.processedTokens), money(r.cost), `${r.firstToken.toFixed(2)}s`] : ["–", "–", "–"]
            return (
              <div key={`${view.run}-${i}`} className="pc-abs pc-row" data-row={`${view.run}-${i}`} data-empty={r ? undefined : ""} data-still={r && !r.animate ? "" : undefined} style={{ top }} aria-hidden>
                <div className="pc-row-top">
                  <span className="pc-row-name">Request {i + 1}</span>
                  {r ? <span className="pc-row-time">{clock(r.time)}</span> : null}
                  {r ? (
                    <span className="pc-status" data-k={r.kind}>
                      {r.kind === "write" ? <PenLine strokeWidth={2} /> : r.kind === "hit" ? <Zap strokeWidth={2} /> : <Split strokeWidth={2} />}
                      {r.kind === "write" ? "Cache write" : r.kind === "hit" ? "Cache hit" : "Partial hit"}
                    </span>
                  ) : null}
                </div>
                <div className="pc-bar">
                  {[...segs, { id: "msg", label: messageLabel, tokens: cfg.tokens, color: undefined }].map((s, si) => {
                    const t = timing[si]
                    return (
                      <span
                        key={s.id}
                        className="pc-seg"
                        data-k={r ? t?.k : "empty"}
                        style={{ flex: `${widths.row[si]} 0 0`, "--c": si === nSeg ? "var(--pc-t1)" : colorOf(si), "--d": `${t?.d ?? 0}s`, "--l": `${t?.l ?? 0.1}s` } as React.CSSProperties}
                      >
                        {r ? <i className="pc-sw" /> : null}
                      </span>
                    )
                  })}
                  {r && r.kind === "partial" && r.breakAt != null ? <i className="pc-brk" style={{ left: sum(widths.row, 0, r.breakAt) + r.breakAt * 2 - 1, "--d": "0.55s" } as React.CSSProperties} /> : null}
                </div>
                {r && r.animate && r.kind !== "hit" ? (
                  <div
                    className="pc-abs pc-fly"
                    style={
                      {
                        "--fx": `${sum(widths.row, 0, from) + from * 2}px`,
                        "--fy": "26px",
                        "--tx": `${16 + sum(widths.panel, 0, from) + from * 2}px`,
                        "--ty": `${PANEL_Y + 62 - top}px`,
                        "--fw": `${sum(widths.row, from, nSeg) + (nSeg - from - 1) * 2}px`,
                        "--tw": `${sum(widths.panel, from) + (nSeg - from - 1) * 2}px`,
                        "--fd": `${r.kind === "partial" ? 1.7 : 1.55}s`,
                      } as React.CSSProperties
                    }
                  >
                    {segs.map((s, si) => (si >= from ? <i key={s.id} style={{ "--c": colorOf(si), "--w": widths.row[si] } as React.CSSProperties} /> : null))}
                  </div>
                ) : null}
                {cells.map((v, k) => (
                  <span key={k} className="pc-m" style={{ right: (2 - k) * COLS }} {...(roll ? { "data-m": "", "data-dim": "" } : r ? {} : { "data-dim": "" })}>
                    {roll ? "–" : v}
                  </span>
                ))}
                {r ? <span className="pc-sr">{rowSentence(r)}</span> : null}
              </div>
            )
          })}

          <div className="pc-abs pc-msg" aria-hidden>
            <span key={`${view.run}-${reqs.length}-${view.event.kind}-${view.phase}`}>{message}</span>
          </div>

          <div className="pc-abs pc-stats" aria-hidden>
            <div className="pc-stat">
              <b>{reqs.length ? `${Math.round(savedPct)}%` : "–"}</b>
              <span>{higher ? "higher input cost" : "lower input cost"}</span>
              <em>{reqs.length ? `${money(totalCost)} vs ${money(totalUncached)} uncached` : "No requests yet"}</em>
            </div>
            <div className="pc-stat">
              <b>{hits.length ? `${(ftUnc / Math.max(0.01, ftHit)).toFixed(1)}x` : "–"}</b>
              <span>faster first token</span>
              <em>{hits.length ? `${ftHit.toFixed(2)}s vs ${ftUnc.toFixed(2)}s on cache hits` : "No cache hits yet"}</em>
            </div>
          </div>

          {changeIdx >= 0 ? (
            <button type="button" className="pc-abs pc-toggle" aria-pressed={view.armed} onClick={onToggle}>
              <Pencil strokeWidth={1.8} aria-hidden />
              {view.armed ? `The ${segs[changeIdx].label.toLowerCase()} changes on the next request` : `Change the ${segs[changeIdx].label.toLowerCase()}`}
            </button>
          ) : null}
        </div>
      </div>
      <ol className="pc-sr" aria-label="Requests">
        {reqs.map((r) => (
          <li key={`${view.run}-${r.index}`}>{rowSentence(r)}</li>
        ))}
      </ol>
      <div className="pc-sr" role="status" aria-live="polite">
        {live}
      </div>
    </section>
  )
}

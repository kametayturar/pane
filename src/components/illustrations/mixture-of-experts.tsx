"use client"

import * as React from "react"
import { BookOpen, Calendar, Code2, Coins, MapPin, Sigma, TriangleAlert, Type, User, Zap } from "lucide-react"

/**
 * MixtureOfExperts – sparse mixture-of-experts routing, one token at a time.
 * A router scores every expert, the token goes to its top one or two, and their outputs merge.
 * Specialties, scores and parameter counts are illustrative sample data.
 *
 *   <MixtureOfExperts defaultTopK={2} />
 */

export type MixtureToken = {
  /** The token text, e.g. "invoice". */
  text: string
  /** Gate weights in expert order. They are normalised to sum to 1. Left out, they are made up from the text. */
  scores?: number[]
}

export type MixtureExpert = {
  /** Short specialty name, e.g. "Dates". */
  name: string
  /** What it tends to handle, shown after the name. */
  handles?: string
  /** 14px icon. */
  icon?: React.ReactNode
}

export type MixtureRoute = {
  index: number
  token: string
  /** Normalised gate weights for every expert. */
  scores: number[]
  /** The chosen experts, best first. Experts that were full are left out. */
  experts: number[]
  /** Output weights of the chosen experts (they sum to 1). */
  weights: number[]
  /** True when a chosen expert was full and skipped the token. */
  dropped: boolean
}

export type MixtureOfExpertsProps = {
  /** The tokens to route. */
  tokens?: MixtureToken[]
  /** The routed experts (2 to 12). */
  experts?: MixtureExpert[]
  /** Experts per token, controlled. Pair with `onTopKChange`. */
  topK?: 1 | 2
  /** Initial experts per token when uncontrolled. Default 2. */
  defaultTopK?: 1 | 2
  onTopKChange?: (topK: 1 | 2) => void
  /** Sizes in billions for the active-parameter readout. */
  parameters?: { total: number; shared: number; perExpert: number }
  /** Per-expert capacity multiplier. Full experts skip tokens. `Infinity` never drops. Default 1. */
  capacityFactor?: number
  /** Called once per token, as it is routed. */
  onRoute?: (route: MixtureRoute) => void
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour). It colours the first choice; set `--moe-second` to recolour the second. */
  accent?: string
  /** Accessible name. */
  label?: string
  className?: string
}

const ICON = { size: 14, strokeWidth: 2, "aria-hidden": true } as const

export const DEFAULT_EXPERTS: MixtureExpert[] = [
  { name: "Names", handles: "people, teams", icon: <User {...ICON} /> },
  { name: "Dates", handles: "days, deadlines", icon: <Calendar {...ICON} /> },
  { name: "Money", handles: "amounts, billing", icon: <Coins {...ICON} /> },
  { name: "Grammar", handles: "function words", icon: <Type {...ICON} /> },
  { name: "Code", handles: "syntax, tools", icon: <Code2 {...ICON} /> },
  { name: "Logic", handles: "steps, conditions", icon: <Sigma {...ICON} /> },
  { name: "Places", handles: "regions, sites", icon: <MapPin {...ICON} /> },
  { name: "Facts", handles: "records, terms", icon: <BookOpen {...ICON} /> },
]

// Hand-tuned gate weights (names, dates, money, grammar, code, logic, places, facts) so the demo shows a clean split and one full expert.
const RAW: [string, number[]][] = [
  ["Maya", [.46, .02, .03, .04, .02, .04, .07, .32]],
  [" paid", [.04, .05, .5, .26, .02, .07, .02, .04]],
  [" the", [.03, .03, .05, .52, .02, .3, .02, .03]],
  [" invoice", [.03, .04, .44, .05, .03, .06, .02, .33]],
  [" before", [.03, .45, .03, .38, .02, .05, .02, .02]],
  [" Friday", [.28, .5, .03, .05, .02, .03, .05, .04]],
]
export const DEFAULT_TOKENS: MixtureToken[] = RAW.map(([text, scores]) => ({ text, scores }))

/* -------------------------------------------------------------------------- */
/*                                   Routing                                  */
/* -------------------------------------------------------------------------- */

function hash(str: string, n: number) {
  let h = 2166136261 ^ n
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

function gate(token: MixtureToken, count: number): number[] {
  const raw = Array.from({ length: count }, (_, e) => (token.scores?.[e] ?? 0.02 + Math.pow(hash(token.text, e), 3) * 0.6))
  const sum = raw.reduce((a, b) => a + Math.max(0, b), 0) || 1
  return raw.map((v) => Math.max(0, v) / sum)
}

/** Routes the tokens in order: top-k by gate weight, skipping experts that are already at capacity. */
export function routeTokens(tokens: MixtureToken[], expertCount: number, topK: number, capacityFactor: number): MixtureRoute[] {
  const cap = Number.isFinite(capacityFactor) ? Math.max(1, Math.ceil(Math.max(2, (capacityFactor * tokens.length * topK) / expertCount))) : Infinity
  const load = new Array<number>(expertCount).fill(0)
  return tokens.map((tk, index) => {
    const scores = gate(tk, expertCount)
    const order = scores.map((s, e) => [s, e] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, topK)
    const kept: number[] = []
    let dropped = false
    for (const [, e] of order) {
      if (load[e] >= cap) dropped = true
      else {
        kept.push(e)
        load[e]++
      }
    }
    const total = kept.reduce((a, e) => a + scores[e], 0) || 1
    return { index, token: tk.text, scores, experts: kept, weights: kept.map((e) => scores[e] / total), dropped }
  })
}

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 420
const ROW_TOP = 144
const ROW_AREA = 216
const ROUTER = { x: 24, y: 134, w: 220, h: 232 }
const BAR_X = 142
const BAR_W = 92
const EXP_X = 300
const EXP_W = 248
const NODE = { x: 596, y: 252 }
const TOKEN_SLOT = { x: 78, y: 204 }
const CHIP_Y = 106

const PER = 3500
const START = 700
const PHASE = [0, 450, 1250, 1600, 2250, 2850, 3250] // intro, score, pick, travel, work, merge, settle
const HOLD = 4800

const rowPitch = (n: number) => Math.min(27, ROW_AREA / n)
const rowCenter = (e: number, n: number) => ROW_TOP + e * rowPitch(n) + (rowPitch(n) - 4) / 2

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
type P = { x: number; y: number }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function bez(a: P, b: P, c: P, d: P, t: number): P {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}
const chipWidth = (text: string) => Math.round(20 + text.trim().length * 7.3)

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.moe {
  --moe-ink: #000;
  --moe-surface: #fff;
  --moe-accent: #0060e2;
  --moe-first: var(--moe-accent);
  --moe-second: color-mix(in oklab, var(--moe-first) 42%, var(--moe-surface));
  --moe-warn: #c27803;
  --moe-speed: 1;
  --moe-scale: 1;
  --moe-t1: color-mix(in oklab, var(--moe-ink) 88%, transparent);
  --moe-t2: color-mix(in oklab, var(--moe-ink) 61%, transparent);
  --moe-t3: color-mix(in oklab, var(--moe-ink) 45%, transparent);
  --moe-t4: color-mix(in oklab, var(--moe-ink) 27%, transparent);
  --moe-fill: color-mix(in oklab, var(--moe-ink) 4.5%, transparent);
  --moe-line: color-mix(in oklab, var(--moe-ink) 7%, transparent);
  --moe-rail: color-mix(in oklab, var(--moe-ink) 12%, transparent);
  --moe-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --moe-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 14px 32px -12px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --moe-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--moe-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left; color: var(--moe-t1);
}
:is(.dark, [data-theme="dark"]) .moe {
  --moe-ink: #fff; --moe-surface: #1c1c1e; --moe-accent: #4d8dff; --moe-warn: #f0b429;
  --moe-t1: color-mix(in oklab, var(--moe-ink) 90%, transparent);
  --moe-t2: color-mix(in oklab, var(--moe-ink) 62%, transparent);
  --moe-t3: color-mix(in oklab, var(--moe-ink) 46%, transparent);
  --moe-t4: color-mix(in oklab, var(--moe-ink) 28%, transparent);
  --moe-fill: color-mix(in oklab, var(--moe-ink) 6%, transparent);
  --moe-line: color-mix(in oklab, var(--moe-ink) 9%, transparent);
  --moe-rail: color-mix(in oklab, var(--moe-ink) 16%, transparent);
  --moe-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --moe-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 32px -12px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.moe *, .moe *::before, .moe *::after { box-sizing: border-box }
.moe button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.moe :focus-visible { outline: 2px solid color-mix(in oklab, var(--moe-accent) 60%, transparent); outline-offset: 1px }
.moe-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--moe-scale));
  border-radius: 18px; background: var(--moe-surface); box-shadow: var(--moe-float); overflow: hidden }
.moe-abs { position: absolute }

/* Header */
.moe-head { position: absolute; left: 24px; right: 24px; top: 20px; display: flex; align-items: center; gap: 10px; height: 26px }
.moe-mark { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; color: var(--moe-first); background: color-mix(in oklab, var(--moe-first) 12%, transparent) }
.moe-mark svg { width: 13px; height: 13px; stroke-width: 2.2 }
.moe-title { flex: 1; font-size: 14px; font-weight: 500; letter-spacing: -.005em }
.moe-seg { position: relative; display: inline-flex; padding: 2px; border-radius: 9px; background: var(--moe-fill) }
.moe-seg::before { content: ""; position: absolute; left: 2px; top: 2px; bottom: 2px; width: calc(50% - 2px); border-radius: 7px; background: var(--moe-surface); box-shadow: var(--moe-shadow);
  transition: transform .35s var(--moe-ease) }
.moe-seg[data-k="2"]::before { transform: translateX(100%) }
.moe-seg button { position: relative; z-index: 1; height: 22px; padding: 0 11px; border-radius: 7px; font-size: 12px; line-height: 22px; font-weight: 500; color: var(--moe-t3); transition: color .2s }
.moe-seg button[aria-pressed="true"] { color: var(--moe-t1) }
.moe-read { position: absolute; left: 24px; top: 50px; display: flex; align-items: center; gap: 10px; height: 20px; font-size: 12.5px; color: var(--moe-t3) }
.moe-read b { font-weight: 500; color: var(--moe-t2); font-variant-numeric: tabular-nums }
.moe-read span { display: inline-block; animation: moe-text calc(.5s / var(--moe-speed)) var(--moe-ease) backwards }
.moe-meter { width: 56px; height: 4px; border-radius: 2px; background: var(--moe-fill); overflow: hidden }
.moe-meter i { display: block; height: 100%; border-radius: 2px; background: var(--moe-first); transform-origin: 0 50%; transition: transform .6s var(--moe-ease) }
.moe-rule { position: absolute; left: 0; right: 0; height: 1px; background: var(--moe-line) }

/* Tokens */
.moe-chip { position: absolute; top: ${CHIP_Y - 14}px; height: 28px; display: grid; place-items: center; border-radius: 9px; font-size: 13px; font-weight: 500; letter-spacing: -.005em;
  color: var(--moe-t2); background: var(--moe-surface); box-shadow: var(--moe-shadow); transition: color .3s, box-shadow .3s, background-color .3s, opacity .3s }
.moe-chip[data-state="idle"] { opacity: .55 }
.moe-chip[data-state="done"] { color: var(--moe-t3) }
.moe-chip[data-state="now"] { opacity: 1; color: var(--moe-t1); box-shadow: 0 0 0 1.5px var(--moe-first), 0 4px 12px -4px color-mix(in oklab, var(--moe-first) 50%, transparent) }
.moe-chip[aria-pressed="true"]::after { content: ""; position: absolute; right: -3px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--moe-first); box-shadow: 0 0 0 2px var(--moe-surface) }
.moe-chip:hover { opacity: 1 }

/* Router */
.moe-router { position: absolute; left: ${ROUTER.x}px; top: ${ROUTER.y}px; width: ${ROUTER.w}px; height: ${ROUTER.h}px; border-radius: 14px; background: var(--moe-fill) }
.moe-cap { position: absolute; left: 14px; top: 12px; font-size: 10.5px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--moe-t3) }
.moe-rtok { position: absolute; left: 14px; width: 92px; top: ${TOKEN_SLOT.y - ROUTER.y - 16}px; height: 32px; display: grid; place-items: center start; font-size: 20px; line-height: 32px; font-weight: 500; letter-spacing: -.02em; white-space: nowrap }
.moe-rtok span { display: inline-block; animation: moe-text calc(.45s / var(--moe-speed)) var(--moe-ease) backwards }
.moe-rnote { position: absolute; left: 14px; width: 104px; bottom: 14px; font-size: 11.5px; line-height: 16px; color: var(--moe-t3) }
.moe-rnote span { display: block; animation: moe-text calc(.45s / var(--moe-speed)) var(--moe-ease) backwards }
.moe-bar { position: absolute; left: ${BAR_X}px; width: ${BAR_W}px; height: 6px; border-radius: 3px; background: color-mix(in oklab, var(--moe-ink) 6%, transparent); overflow: hidden }
.moe-bar i { display: block; width: 100%; height: 100%; border-radius: 3px; background: var(--moe-rail); transform-origin: 0 50%; transform: scaleX(0); transition: background-color .3s }
.moe-bar[data-pick="1"] i { background: var(--moe-first) }
.moe-bar[data-pick="2"] i { background: var(--moe-second) }
.moe-bar[data-pick="x"] i { background: var(--moe-warn) }

/* Experts */
.moe-ex { position: absolute; left: ${EXP_X}px; width: ${EXP_W}px; display: flex; align-items: center; gap: 8px; padding: 0 10px 0 9px; border-radius: 8px; color: var(--moe-t3);
  background: transparent; box-shadow: 0 0 0 1px var(--moe-line); transition: background-color .3s, box-shadow .3s, color .3s, opacity .3s }
.moe-ex svg { flex: none }
.moe-ex b { font-size: 12px; line-height: 16px; font-weight: 500; white-space: nowrap }
.moe-ex em { flex: 1; min-width: 0; font-style: normal; font-size: 11px; line-height: 16px; color: var(--moe-t4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.moe-ex[data-rank="1"], .moe-ex[data-rank="2"] { color: var(--moe-t1); background: var(--moe-surface) }
.moe-ex[data-rank="1"] { box-shadow: 0 0 0 1.5px var(--moe-first), 0 6px 14px -8px color-mix(in oklab, var(--moe-first) 70%, transparent) }
.moe-ex[data-rank="2"] { box-shadow: 0 0 0 1.5px var(--moe-second), 0 6px 14px -8px color-mix(in oklab, var(--moe-first) 40%, transparent) }
.moe-ex[data-rank="x"] { color: var(--moe-t2); box-shadow: 0 0 0 1px var(--moe-warn); background-image: repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in oklab, var(--moe-warn) 10%, transparent) 4px 5px) }
.moe-ex[data-rank="x"] svg { color: var(--moe-warn) }
.moe-ex[data-dim] { opacity: .5 }
.moe-ex[data-rank="1"]::after, .moe-ex[data-rank="2"]::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(100deg, transparent 30%, color-mix(in oklab, var(--moe-first) 22%, transparent) 50%, transparent 70%) 0 0 / 260% 100%; animation: moe-shine calc(.9s / var(--moe-speed)) ease-out }
.moe-w { flex: none; min-width: 30px; text-align: right; font-size: 11px; font-weight: 500; font-variant-numeric: tabular-nums; animation: moe-text calc(.4s / var(--moe-speed)) var(--moe-ease) backwards }
.moe-ex[data-rank="1"] .moe-w { color: var(--moe-first) }
.moe-ex[data-rank="x"] .moe-w { color: var(--moe-warn); font-weight: 600 }
.moe-pips { flex: none; display: flex; gap: 3px }
.moe-pips i { width: 5px; height: 5px; border-radius: 1.5px; background: var(--moe-rail); transition: background-color .3s }
.moe-pips i[data-on] { background: var(--moe-t3) }
.moe-pips i[data-full] { background: var(--moe-warn) }

/* Merge */
.moe-node { position: absolute; left: ${NODE.x - 20}px; top: ${NODE.y - 20}px; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: var(--moe-t3);
  background: var(--moe-surface); box-shadow: 0 0 0 1px var(--moe-rail), 0 1px 2px rgb(0 0 0 / .05); transition: color .3s, box-shadow .3s }
.moe-node svg { width: 16px; height: 16px; stroke-width: 2 }
.moe-node[data-on] { color: var(--moe-first); box-shadow: 0 0 0 1.5px var(--moe-first), 0 6px 14px -6px color-mix(in oklab, var(--moe-first) 60%, transparent) }
.moe-node[data-pulse]::after { content: ""; position: absolute; inset: 0; border-radius: 50%; animation: moe-ring calc(.8s / var(--moe-speed)) var(--moe-ease) }
.moe-nlab { position: absolute; left: ${NODE.x - 30}px; width: 60px; top: ${NODE.y + 26}px; text-align: center; font-size: 10.5px; line-height: 14px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--moe-t3) }
.moe-pk { position: absolute; left: 0; top: 0; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; opacity: 0; will-change: transform;
  background: var(--moe-first); box-shadow: 0 0 0 3px color-mix(in oklab, var(--moe-first) 22%, transparent) }
.moe-pk[data-rank="2"] { background: var(--moe-second); box-shadow: 0 0 0 3px color-mix(in oklab, var(--moe-second) 30%, transparent) }
.moe-pk[data-rank="x"] { background: var(--moe-warn); box-shadow: 0 0 0 3px color-mix(in oklab, var(--moe-warn) 25%, transparent) }
.moe-pk[data-kind="tok"] { background: var(--moe-t1); box-shadow: 0 0 0 3px var(--moe-fill) }

/* Footer */
.moe-out { position: absolute; left: 24px; top: 380px; height: 24px; display: flex; align-items: center; gap: 6px; max-width: 360px }
.moe-flab { flex: none; margin-right: 4px; font-size: 10.5px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--moe-t3) }
.moe-oc { position: relative; padding: 0 1px 4px; font-size: 12.5px; line-height: 18px; font-weight: 500; white-space: pre; color: var(--moe-t1); animation: moe-in calc(.5s / var(--moe-speed)) var(--moe-ease) backwards }
.moe-oc::after { content: ""; position: absolute; left: 1px; right: 1px; bottom: 0; height: 3px; border-radius: 2px; background: var(--g) }
.moe-oc[data-skip]::after { background: repeating-linear-gradient(90deg, var(--moe-warn) 0 3px, transparent 3px 6px) }
.moe-load { position: absolute; right: 24px; top: 380px; height: 24px; display: flex; align-items: center; gap: 12px }
.moe-lbars { display: flex; align-items: flex-end; gap: 3px; height: 20px }
.moe-lbars i { display: block; width: 8px; min-height: 2px; border-radius: 2px; background: var(--moe-rail); transform-origin: 50% 100%; transition: height .5s var(--moe-ease), background-color .3s }
.moe-lbars i[data-hot] { background: var(--moe-first) }
.moe-lnone { font-size: 11.5px; color: var(--moe-t4) }

@keyframes moe-text { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes moe-in { from { opacity: 0; transform: translateY(6px); filter: blur(3px) } }
@keyframes moe-ring { from { box-shadow: 0 0 0 0 color-mix(in oklab, var(--moe-first) 45%, transparent) } to { box-shadow: 0 0 0 12px color-mix(in oklab, var(--moe-first) 0%, transparent) } }
@keyframes moe-shine { from { background-position: 100% 0 } to { background-position: 0 0 } }

.moe[data-paused] *, .moe[data-paused] *::before, .moe[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .moe *, .moe *::before, .moe *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

const REDUCED = "(prefers-reduced-motion: reduce)"
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )
}

type Frame = { idx: number; phase: number }

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function MixtureOfExperts({
  tokens = DEFAULT_TOKENS,
  experts = DEFAULT_EXPERTS,
  topK: topKProp,
  defaultTopK = 2,
  onTopKChange,
  parameters = { total: 671, shared: 5, perExpert: 16 },
  capacityFactor = 1,
  onRoute,
  speed = 1,
  paused = false,
  accent,
  label = "Mixture of experts routing",
  className,
}: MixtureOfExpertsProps) {
  const [topKState, setTopKState] = React.useState<1 | 2>(defaultTopK)
  const topK = topKProp ?? topKState
  const E = Math.min(12, Math.max(2, experts.length))
  const list = experts.slice(0, E)
  const routes = React.useMemo(() => routeTokens(tokens, E, topK, capacityFactor), [tokens, E, topK, capacityFactor])
  const n = routes.length
  const summaryAt = START + n * PER
  const period = summaryAt + HOLD
  const reduced = useReducedMotion()

  const rootRef = React.useRef<HTMLDivElement>(null)
  const barRefs = React.useRef<(HTMLElement | null)[]>([])
  const pkRefs = React.useRef<(HTMLElement | null)[]>([])
  const [frame, setFrame] = React.useState<Frame>({ idx: -1, phase: 0 })
  const [pin, setPin] = React.useState<number | null>(null)
  const live = React.useRef({ speed, paused, pin: null as number | null, frame: { idx: -2, phase: 0 } as Frame, onRoute, routes, t: 0, resetKey: 0 })
  React.useEffect(() => {
    live.current.speed = speed
    live.current.paused = paused
    live.current.pin = pin
    live.current.onRoute = onRoute
  })

  const chips = React.useMemo(() => {
    const widths = tokens.map((tk) => chipWidth(tk.text))
    return widths.map((w, i) => ({ x: 24 + widths.slice(0, i).reduce((a, b) => a + b + 6, 0), w }))
  }, [tokens])

  // Scale the fixed stage to the container.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--moe-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // One clock. Discrete changes (which token, which phase) go to React; packets and score bars are written straight to the DOM.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    live.current.routes = routes
    live.current.t = 0
    live.current.frame = { idx: -2, phase: 0 }
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 })
    io.observe(root)
    const pk = (i: number, x: number, y: number, o: number, s = 1) => {
      const el = pkRefs.current[i]
      if (!el) return
      el.style.opacity = String(o)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(2)})`
    }
    const draw = (t: number) => {
      const rs = live.current.routes
      const pinned = live.current.pin
      let idx = Math.floor((t - START) / PER)
      let tau = t - START - idx * PER
      if (t < START) {
        idx = -1
        tau = 0
      }
      if (idx >= rs.length) {
        idx = rs.length
        tau = 0
      }
      if (pinned != null && pinned < rs.length) {
        idx = pinned
        tau = 3000
      }
      let phase = 0
      while (phase < PHASE.length - 1 && tau >= PHASE[phase + 1]) phase++
      if (idx < 0 || idx >= rs.length) phase = 0
      const f = live.current.frame
      if (f.idx !== idx || f.phase !== phase) {
        live.current.frame = { idx, phase }
        setFrame({ idx, phase })
        const r = rs[idx]
        if (r && phase === 3) live.current.onRoute?.(r)
      }
      // packets + bars
      for (let i = 0; i < 6; i++) pk(i, 0, 0, 0)
      const r = idx >= 0 && idx < rs.length ? rs[idx] : null
      const maxS = r ? Math.max(...r.scores) : 1
      for (let e = 0; e < E; e++) {
        const b = barRefs.current[e]
        if (!b) continue
        let s = 0
        if (r) {
          const grow = easeOut(clamp01((tau - 450 - e * 35) / 450))
          const fade = 1 - clamp01((tau - 3250) / 200)
          s = (r.scores[e] / maxS) * grow * (pinned != null ? 1 : fade)
        }
        b.style.transform = `scaleX(${s.toFixed(3)})`
      }
      if (!r) return
      const chip = chips[idx]
      if (chip && tau < 520) {
        const u = easeInOut(clamp01(tau / 480))
        const a = { x: chip.x + chip.w / 2, y: CHIP_Y + 14 }
        const d = { x: TOKEN_SLOT.x, y: TOKEN_SLOT.y }
        const p = bez(a, { x: a.x, y: a.y + 40 }, { x: d.x + 40, y: d.y - 40 }, d, u)
        pk(0, p.x, p.y, u > 0.92 ? (1 - u) / 0.08 : 1)
      }
      r.experts.forEach((e, j) => {
        const yc = rowCenter(e, E)
        const a = { x: BAR_X + BAR_W - 2, y: rowCenter(e, E) }
        const b = { x: EXP_X + 4, y: yc }
        if (tau >= 1600 && tau < 2300 + j * 80) {
          const u = easeInOut(clamp01((tau - 1600 - j * 80) / 600))
          const p = bez(a, { x: a.x + 30, y: a.y }, { x: b.x - 40, y: b.y }, b, u)
          pk(1 + j, p.x, p.y, u > 0.9 ? (1 - u) / 0.1 : 1)
        }
        if (tau >= 2850 && tau < 3400) {
          const u = easeInOut(clamp01((tau - 2850 - j * 60) / 480))
          const from = { x: EXP_X + EXP_W - 6, y: yc }
          const to = { x: NODE.x - 18, y: NODE.y }
          const p = bez(from, { x: from.x + 30, y: from.y }, { x: to.x - 30, y: to.y }, to, u)
          pk(3 + j, p.x, p.y, u > 0.9 ? (1 - u) / 0.1 : 1, lerp(1, 0.8 + r.weights[j] * 0.6, u))
        }
      })
      // a dropped choice slides toward its expert and dissolves
      if (r.dropped && tau >= 1600 && tau < 2300) {
        const order = r.scores.map((s, e) => [s, e] as const).sort((x, y) => y[0] - x[0] || x[1] - y[1]).slice(0, topK)
        const lost = order.find(([, e]) => !r.experts.includes(e))
        if (lost) {
          const e = lost[1]
          const a = { x: BAR_X + BAR_W - 2, y: rowCenter(e, E) }
          const u = easeOut(clamp01((tau - 1600) / 600))
          pk(5, lerp(a.x, EXP_X - 14, u * 0.8), a.y, 1 - u)
        }
      }
    }
    const step = (t: number) => {
      live.current.t = t
      draw(t)
    }
    if (reduced) {
      step(START + (n - 1) * PER + 3000)
      return () => io.disconnect()
    }
    let raf = 0
    let last = 0
    step(0)
    const loop = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 0
      last = now
      if (!live.current.paused && visible && dt > 0 && live.current.pin == null) {
        let t = live.current.t + dt * Math.max(0.05, live.current.speed)
        if (t >= period) t -= period
        step(t)
      } else if (live.current.pin != null) {
        draw(live.current.t)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [routes, chips, E, n, period, reduced, topK])

  const setTopK = (k: 1 | 2) => {
    if (k === topK) return
    setPin(null)
    if (topKProp === undefined) setTopKState(k)
    onTopKChange?.(k)
  }
  const togglePin = (i: number) => {
    // pinning holds the clock at the end of that token's route; a second press resumes from there
    if (pin === i) {
      live.current.t = START + i * PER + 3300
      setPin(null)
    } else {
      live.current.t = START + i * PER + 3000
      setPin(i)
    }
  }

  const { idx, phase } = reduced ? { idx: n - 1, phase: 5 } : frame
  const r = idx >= 0 && idx < n ? routes[idx] : null
  const done = idx >= n || reduced
  const settled = (i: number) => i < idx || (i === idx && phase >= 6)
  const outCount = reduced ? n : Math.min(n, idx + (phase >= 6 ? 1 : 0))
  const loads = new Array<number>(E).fill(0)
  for (let i = 0; i < Math.min(n, outCount); i++) for (const e of routes[i].experts) loads[e]++
  const cap = Number.isFinite(capacityFactor) ? Math.max(1, Math.ceil(Math.max(2, (capacityFactor * n * topK) / E))) : 0
  const maxLoad = Math.max(1, ...loads)
  const active = parameters.shared + topK * parameters.perExpert
  const pct = Math.min(100, (active / parameters.total) * 100)
  const pitch = rowPitch(E)
  const lit = r && phase >= 4
  const picked = r ? [...r.experts] : []
  const topOrder = r ? r.scores.map((s, e) => [s, e] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, topK).map(([, e]) => e) : []

  const vars = {
    ...(accent ? { "--moe-accent": accent } : null),
    "--moe-speed": Math.max(0.05, speed),
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={className ? `moe ${className}` : "moe"} role="group" aria-label={label} data-paused={paused || undefined} style={vars}>
      <style href="pane-mixture-of-experts" precedence="default">
        {CSS}
      </style>
      <div className="moe-stage">
        <div className="moe-head">
          <span className="moe-mark" aria-hidden>
            <Zap />
          </span>
          <span className="moe-title">Mixture of experts</span>
          <div className="moe-seg" data-k={topK} role="group" aria-label="Experts per token">
            <button type="button" aria-pressed={topK === 1} onClick={() => setTopK(1)}>
              Top 1
            </button>
            <button type="button" aria-pressed={topK === 2} onClick={() => setTopK(2)}>
              Top 2
            </button>
          </div>
        </div>
        <div className="moe-read" aria-live="polite">
          <span key={topK}>
            <b>{active}B</b> of {parameters.total}B parameters active per token
          </span>
          <div className="moe-meter" aria-hidden>
            <i style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
        </div>
        <div className="moe-rule" style={{ top: 80 }} />

        {tokens.map((tk, i) => (
          <button
            key={i}
            type="button"
            className="moe-chip"
            style={{ left: chips[i].x, width: chips[i].w }}
            data-state={i === idx ? "now" : settled(i) || done ? "done" : "idle"}
            aria-pressed={pin === i}
            aria-label={`Token ${tk.text.trim()}${pin === i ? ", pinned" : ""}`}
            onClick={() => togglePin(i)}
          >
            {tk.text.trim()}
          </button>
        ))}

        <div className="moe-router" aria-hidden>
          <span className="moe-cap">Router</span>
          <div className="moe-rtok">{r && <span key={idx}>{r.token.trim()}</span>}</div>
          <div className="moe-rnote">
            <span key={r ? (phase >= 2 ? "pick" : "score") : done ? "done" : "idle"}>
              {done ? `${n} tokens routed` : r ? (phase >= 2 ? `Top ${topK} ${topK === 1 ? "expert takes" : "experts take"} the token` : `Scoring ${E} experts`) : "Waiting for a token"}
            </span>
          </div>
        </div>
        {list.map((_, e) => {
          const rank = r && phase >= 2 ? (topOrder.indexOf(e) === 0 ? "1" : topOrder.indexOf(e) === 1 ? "2" : undefined) : undefined
          const pick = rank && r && !r.experts.includes(e) ? "x" : rank
          return (
            <div
              key={e}
              ref={(el) => {
                barRefs.current[e] = el?.querySelector("i") ?? null
              }}
              className="moe-bar"
              style={{ top: rowCenter(e, E) - 3 }}
              data-pick={pick}
              aria-hidden
            >
              <i />
            </div>
          )
        })}

        {list.map((ex, e) => {
          const j = lit ? picked.indexOf(e) : -1
          const lost = lit && topOrder.includes(e) && !picked.includes(e)
          const rank = lost ? "x" : j >= 0 ? String(j + 1) : undefined
          const full = cap > 0 && loads[e] >= cap
          return (
            <div
              key={e}
              className="moe-ex"
              style={{ top: ROW_TOP + e * pitch, height: pitch - 4 }}
              data-rank={rank}
              data-dim={lit && !rank ? "" : undefined}
              role="img"
              aria-label={`${ex.name}${ex.handles ? `, ${ex.handles}` : ""}${rank === "x" ? ", full, token skipped" : j >= 0 ? `, ${j === 0 ? "first" : "second"} choice` : ""}`}
            >
              {rank === "x" ? <TriangleAlert size={14} strokeWidth={2} /> : (ex.icon ?? <Zap {...ICON} />)}
              <b>{ex.name}</b>
              {E <= 9 && ex.handles ? <em>{ex.handles}</em> : <em />}
              {rank && (
                <span key={`${idx}-${rank}`} className="moe-w">
                  {rank === "x" ? "full" : `${Math.round(r!.weights[j] * 100)}%`}
                </span>
              )}
              {cap > 0 && cap <= 4 && (
                <span className="moe-pips" aria-hidden>
                  {Array.from({ length: cap }, (_, p) => (
                    <i key={p} data-on={p < loads[e] || undefined} data-full={(full && p < loads[e]) || undefined} />
                  ))}
                </span>
              )}
            </div>
          )
        })}

        <div className="moe-node" data-on={r && phase >= 5 ? "" : undefined} data-pulse={r && phase === 5 ? "" : undefined} key={`n${idx}${phase >= 5 ? 1 : 0}`} aria-hidden>
          <Sigma />
        </div>
        <div className="moe-nlab" aria-hidden>
          Merge
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <i
            key={i}
            ref={(el) => {
              pkRefs.current[i] = el
            }}
            className="moe-pk"
            data-kind={i === 0 ? "tok" : undefined}
            data-rank={i === 1 || i === 3 ? "1" : i === 5 ? "x" : i === 0 ? undefined : "2"}
            aria-hidden
          />
        ))}

        <div className="moe-rule" style={{ top: 368 }} />
        <div className="moe-out" aria-live="polite">
          <span className="moe-flab">Output</span>
          {routes.slice(0, outCount).map((rt, i) => {
            const first = rt.weights[0] ?? 0
            const g = rt.experts.length === 0 ? "none" : rt.experts.length === 1 ? "var(--moe-first)" : `linear-gradient(90deg, var(--moe-first) ${first * 100}%, var(--moe-second) ${first * 100}%)`
            return (
              <span key={i} className="moe-oc" data-skip={rt.experts.length === 0 || undefined} style={{ "--g": g } as React.CSSProperties}>
                {rt.token.trim()}
              </span>
            )
          })}
          {outCount === 0 && <span className="moe-lnone">Waiting for the first token</span>}
        </div>
        <div className="moe-load">
          <span className="moe-flab" style={{ margin: 0 }}>
            Load balance
          </span>
          {outCount === 0 ? (
            <span className="moe-lnone">No routes yet</span>
          ) : (
            <div className="moe-lbars" role="img" aria-label={`Tokens per expert: ${list.map((ex, e) => `${ex.name} ${loads[e]}`).join(", ")}`}>
              {loads.map((l, e) => (
                <i key={e} style={{ height: 2 + (l / maxLoad) * 18 }} data-hot={l >= maxLoad && l > 0 ? "" : undefined} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

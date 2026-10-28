"use client"

import * as React from "react"
import { Check, FastForward, X } from "lucide-react"

/**
 * SpeculativeDecoding – a small draft model guesses a few tokens ahead and a large target model checks
 * all of them in one pass. Accepted guesses join the answer for free. It is an explainer, not a decoder:
 * guesses are simulated from a seed, or replayed from a recorded run.
 *
 *   <SpeculativeDecoding draftLength={4} compare />
 */

export type SpecToken = {
  /** The target model's token, including any leading space. */
  text: string
  /** How likely the draft is to guess this one right, 0 to 1. Default 0.7. */
  ease?: number
  /** What the draft says when it guesses wrong. */
  miss?: string
}

export type SpecRound = {
  /** The draft model's guesses for this round. */
  draft: string[]
  /** How many guesses, from the start, the target accepted. */
  accepted: number
  /** The target's own token after the accepted ones (a correction, or a bonus when all were accepted). */
  next?: string
}

export type SpecStats = {
  passes: number
  drafted: number
  accepted: number
  tokens: number
  /** Share of drafted tokens that were accepted, 0 to 1. */
  acceptance: number
  tokensPerPass: number
  /** Modelled speedup against decoding with the target alone. */
  speedup: number
}

export type SpeculativeDecodingProps = {
  /** The answer the target model produces, with optional guess likelihoods. */
  tokens?: SpecToken[]
  /** A recorded run to replay instead of simulating one. Hides the draft length slider. */
  rounds?: SpecRound[]
  /** Draft tokens per round, 2 to 8 (controlled). */
  draftLength?: number
  /** Initial draft length when uncontrolled. Default 4. */
  defaultDraftLength?: number
  onDraftLengthChange?: (n: number) => void
  /** Race a target-only line against the speculative one (controlled). */
  compare?: boolean
  defaultCompare?: boolean
  onCompareChange?: (compare: boolean) => void
  /** Seed for the simulated guesses: the same inputs give the same run. Default 12. */
  seed?: number
  /** Cost of one draft token as a share of a target pass. Default 0.1. */
  draftCost?: number
  /** Milliseconds per target pass. Default 640. */
  passDuration?: number
  title?: string
  draftLabel?: string
  draftDetail?: string
  targetLabel?: string
  targetDetail?: string
  /** Called once per loop with the final numbers. */
  onComplete?: (stats: SpecStats) => void
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for accepted tokens, the sweep and the speed-up. */
  accent?: string
  /** Accessible name. */
  label?: string
  className?: string
}

export const DEFAULT_SPEC_TOKENS: SpecToken[] = [
  { text: "The", ease: 0.97 },
  { text: " deploy", ease: 0.6, miss: " build" },
  { text: " finished", ease: 0.7, miss: " completed" },
  { text: " and", ease: 0.9, miss: "," },
  { text: " every", ease: 0.55, miss: " all" },
  { text: " check", ease: 0.8, miss: " test" },
  { text: " passed", ease: 0.85, miss: " succeeded" },
  { text: ",", ease: 0.9, miss: "." },
  { text: " so", ease: 0.6, miss: " and" },
  { text: " the", ease: 0.95, miss: " our" },
  { text: " release", ease: 0.7, miss: " build" },
  { text: " is", ease: 0.95, miss: " looks" },
  { text: " ready", ease: 0.75, miss: " good" },
  { text: " to", ease: 0.95, miss: " for" },
  { text: " ship", ease: 0.8, miss: " go" },
  { text: ".", ease: 0.9, miss: "!" },
]

/* -------------------------------------------------------------------------- */
/*                                 Simulation                                 */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type SimRound = { draft: string[]; accepted: number; next?: string; p: number }

/** Each draft position is right with probability `ease`; the first miss ends the accepted prefix. */
function simulate(tokens: SpecToken[], L: number, seed: number): SimRound[] {
  const rng = mulberry32(seed)
  const rounds: SimRound[] = []
  let p = 0
  while (p < tokens.length) {
    const draft: string[] = []
    let accepted = 0
    let alive = true
    for (let q = p; q < Math.min(p + L, tokens.length); q++) {
      const good = rng() < (tokens[q].ease ?? 0.7)
      draft.push(good ? tokens[q].text : (tokens[q].miss ?? "…"))
      if (alive && good) accepted++
      else alive = false
    }
    const next = tokens[p + accepted]?.text
    rounds.push({ draft, accepted, next, p })
    p += accepted + 1
  }
  return rounds
}

function fromRecorded(rounds: SpecRound[]): { rounds: SimRound[]; tokens: string[] } {
  const out: SimRound[] = []
  const tokens: string[] = []
  for (const r of rounds) {
    const acc = Math.max(0, Math.min(r.accepted, r.draft.length))
    out.push({ draft: r.draft, accepted: acc, next: r.next, p: tokens.length })
    for (let i = 0; i < acc; i++) tokens.push(r.draft[i])
    if (r.next !== undefined) tokens.push(r.next)
  }
  return { rounds: out, tokens }
}

/* -------------------------------------------------------------------------- */
/*                                   Script                                   */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 420
const TRACK_X = 150
const TRACK_W = 466
const GAP = 6
const LANE_Y = [98, 160] as const
const LANE_H = 54
const ANS = { x: 24, y: 252, w: 592 }

type Flight = { token: number; t0: number; t1: number; col: number }
type RoundPlan = {
  p: number
  L: number
  cols: number
  draft: string[]
  accepted: number
  next?: string
  start: number
  tV: number
  tF: number
  end: number
}
type Plan = {
  rounds: RoundPlan[]
  flights: Flight[]
  answer: string[]
  doneAt: number
  period: number
  checkpoints: { t: number; stats: SpecStats }[]
  specSpan: number
  t0: number
}

const DRAFT_STEP = 170

function plan(sim: SimRound[], answer: string[], L: number, draftCost: number, pass: number): Plan {
  let t = 700
  const rounds: RoundPlan[] = []
  const flights: Flight[] = []
  const checkpoints: Plan["checkpoints"] = []
  let drafted = 0
  let accepted = 0
  let tokens = 0
  sim.forEach((r, i) => {
    const l = r.draft.length
    const full = r.accepted === l && r.next !== undefined
    const cols = l + (full ? 1 : 0)
    const start = t
    const tV = start + 150 + l * DRAFT_STEP + 220
    const tF = tV + pass + 160
    const m = r.accepted + (r.next !== undefined ? 1 : 0)
    const end = tF + 90 * Math.max(0, m - 1) + 560 + 260
    for (let k = 0; k < m; k++) {
      flights.push({ token: r.p + k, t0: tF + k * 90, t1: tF + k * 90 + 560, col: k < r.accepted ? k : r.accepted })
    }
    drafted += l
    accepted += r.accepted
    tokens += m
    const passes = i + 1
    checkpoints.push({
      t: tF + 120,
      stats: {
        passes,
        drafted,
        accepted,
        tokens,
        acceptance: drafted ? accepted / drafted : 0,
        tokensPerPass: tokens / passes,
        speedup: tokens / (passes + drafted * draftCost),
      },
    })
    rounds.push({ p: r.p, L: l, cols, draft: r.draft, accepted: r.accepted, next: r.next, start, tV, tF, end })
    t = end
  })
  void L
  const first = rounds[0]?.start ?? 700
  return { rounds, flights, answer, doneAt: t, period: t + 4600, checkpoints, specSpan: Math.max(1, t - first), t0: first }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.spd {
  --spd-ink: #000;
  --spd-surface: #fff;
  --spd-accent: #0060e2;
  --spd-green: #1fa85a;
  --spd-red: #e5484d;
  --spd-speed: 1;
  --spd-scale: 1;
  --spd-t1: color-mix(in oklab, var(--spd-ink) 88%, transparent);
  --spd-t2: color-mix(in oklab, var(--spd-ink) 61%, transparent);
  --spd-t3: color-mix(in oklab, var(--spd-ink) 45%, transparent);
  --spd-t4: color-mix(in oklab, var(--spd-ink) 27%, transparent);
  --spd-fill: color-mix(in oklab, var(--spd-ink) 4.5%, transparent);
  --spd-line: color-mix(in oklab, var(--spd-ink) 7%, transparent);
  --spd-rail: color-mix(in oklab, var(--spd-ink) 12%, transparent);
  --spd-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --spd-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 14px 32px -12px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --spd-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--spd-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left; color: var(--spd-t1);
}
:is(.dark, [data-theme="dark"]) .spd {
  --spd-ink: #fff; --spd-surface: #1c1c1e; --spd-accent: #4d8dff; --spd-green: #34d27b; --spd-red: #ff6369;
  --spd-t1: color-mix(in oklab, var(--spd-ink) 90%, transparent);
  --spd-t2: color-mix(in oklab, var(--spd-ink) 62%, transparent);
  --spd-t3: color-mix(in oklab, var(--spd-ink) 46%, transparent);
  --spd-t4: color-mix(in oklab, var(--spd-ink) 28%, transparent);
  --spd-fill: color-mix(in oklab, var(--spd-ink) 6%, transparent);
  --spd-line: color-mix(in oklab, var(--spd-ink) 9%, transparent);
  --spd-rail: color-mix(in oklab, var(--spd-ink) 16%, transparent);
  --spd-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --spd-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 32px -12px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.spd *, .spd *::before, .spd *::after { box-sizing: border-box }
.spd button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.spd :focus-visible { outline: 2px solid color-mix(in oklab, var(--spd-accent) 60%, transparent); outline-offset: 2px }
.spd-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--spd-scale));
  border-radius: 18px; background: var(--spd-surface); box-shadow: var(--spd-float); overflow: hidden }
.spd-fade { position: absolute; inset: 0; transition: opacity calc(.45s / var(--spd-speed)) ease }
.spd[data-reset] .spd-fade { opacity: 0 }

/* Header */
.spd-head { position: absolute; left: 24px; right: 24px; top: 20px; display: flex; align-items: center; gap: 10px; height: 24px }
.spd-mark { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; color: var(--spd-accent); background: color-mix(in oklab, var(--spd-accent) 12%, transparent) }
.spd-mark svg { width: 13px; height: 13px; stroke-width: 2.2 }
.spd-title { flex: 1; font-size: 14px; font-weight: 500; letter-spacing: -.005em }
.spd-status { display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 10px 0 8px; border-radius: 11px; font-size: 11.5px; line-height: 22px; font-weight: 500; color: var(--spd-t2); background: var(--spd-fill) }
.spd-status i { width: 6px; height: 6px; border-radius: 50%; background: var(--spd-t4) }
.spd-status[data-s="draft"] i, .spd-status[data-s="verify"] i { background: var(--spd-accent); animation: spd-pulse calc(1s / var(--spd-speed)) ease-in-out infinite alternate }
.spd-status[data-s="done"] i { background: var(--spd-green) }
.spd-status span { display: inline-block; animation: spd-text calc(.4s / var(--spd-speed)) var(--spd-ease) backwards }
.spd-sub { position: absolute; left: 24px; right: 24px; top: 48px; height: 20px; font-size: 12.5px; color: var(--spd-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.spd-rule { position: absolute; left: 0; right: 0; height: 1px; background: var(--spd-line) }

/* Lanes */
.spd-lane { position: absolute; left: 12px; right: 12px; height: ${LANE_H}px; border-radius: 12px; background: var(--spd-fill) }
.spd-lab { position: absolute; left: 24px; width: 118px; height: ${LANE_H}px; display: flex; flex-direction: column; justify-content: center }
.spd-lab b { font-size: 12.5px; line-height: 16px; font-weight: 500 }
.spd-lab em { font-style: normal; font-size: 11.5px; line-height: 16px; color: var(--spd-t3) }
.spd-lab i { display: inline-block; width: 6px; height: 6px; margin-right: 6px; border-radius: 50%; background: var(--spd-t4); vertical-align: 1px }
.spd-lab[data-lane="target"] i { background: var(--spd-accent) }
.spd-cell { position: absolute; height: 30px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 0 6px; border-radius: 8px; font-size: 12px; line-height: 16px; font-weight: 500;
  white-space: pre; overflow: hidden; background: var(--spd-surface); box-shadow: var(--spd-shadow); color: var(--spd-t1); animation: spd-in calc(.38s / var(--spd-speed)) var(--spd-ease) backwards }
.spd-cell span { overflow: hidden; text-overflow: ellipsis }
.spd-cell svg { flex: none; width: 12px; height: 12px; stroke-width: 2.6 }
.spd-cell[data-v="ok"] svg { color: var(--spd-green) }
.spd-cell[data-v="no"] { color: var(--spd-t3) }
.spd-cell[data-v="no"] > span { text-decoration: line-through; text-decoration-color: var(--spd-red) }
.spd-cell[data-v="no"] svg { color: var(--spd-red) }
.spd-cell[data-v="drop"] { color: var(--spd-t4); background: transparent; box-shadow: 0 0 0 1px var(--spd-rail) inset; opacity: .7 }
.spd-cell[data-v="new"] { color: var(--spd-accent); background: color-mix(in oklab, var(--spd-accent) 10%, var(--spd-surface)); box-shadow: 0 0 0 1px color-mix(in oklab, var(--spd-accent) 45%, transparent) }
.spd-cell[data-lane="draft"][data-pending] { color: var(--spd-t2) }
.spd-cell[data-lane="draft"][data-v="ok"] { box-shadow: 0 0 0 1px color-mix(in oklab, var(--spd-green) 50%, transparent) }
.spd-cell[data-lane="draft"][data-v="no"] { box-shadow: 0 0 0 1px color-mix(in oklab, var(--spd-red) 45%, transparent) }
.spd-cell[data-lane="draft"][data-v="drop"] { opacity: .45 }
.spd-ghost { position: absolute; height: 30px; border-radius: 8px; box-shadow: 0 0 0 1px var(--spd-line) inset; opacity: .7 }
.spd[data-leave] .spd-cell { animation: spd-out calc(.35s / var(--spd-speed)) ease forwards }
.spd-shimmer { position: relative }
.spd-shimmer::after { content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, rgb(255 255 255 / .85) 50%, transparent 62%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text;
  animation: spd-sweep calc(1.6s / var(--spd-speed)) linear infinite }
.spd-beam { position: absolute; top: ${LANE_Y[0] - 6}px; height: ${LANE_Y[1] + LANE_H - LANE_Y[0] + 12}px; opacity: 0; pointer-events: none; will-change: transform; border-radius: 10px;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--spd-accent) 14%, transparent) 50%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in oklab, var(--spd-accent) 45%, transparent), inset 0 -1px 0 color-mix(in oklab, var(--spd-accent) 45%, transparent) }

/* Answer */
.spd-alab { position: absolute; left: 24px; top: 226px; font-size: 10.5px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--spd-t3) }
.spd-ans { position: absolute; left: ${ANS.x}px; top: ${ANS.y - 4}px; width: ${ANS.w}px; height: 52px; margin: 0; font-size: 15px; line-height: 26px; letter-spacing: -.005em; color: var(--spd-t1) }
.spd-ans span { visibility: hidden }
.spd-ans span[data-on] { visibility: visible }
.spd-ans-caret { display: inline-block; width: 2px; height: 16px; margin-left: 2px; border-radius: 1px; vertical-align: -2px; background: var(--spd-accent); opacity: 0 }
.spd[data-live] .spd-ans-caret { opacity: 1; animation: spd-blink calc(1s / var(--spd-speed)) steps(1, end) infinite }
.spd-fly { position: absolute; left: 0; top: 0; z-index: 3; height: 26px; padding: 0 1px; opacity: 0; font-size: 15px; line-height: 26px; letter-spacing: -.005em; white-space: pre; color: var(--spd-t1); will-change: transform }
.spd-fly::before { content: ""; position: absolute; inset: 1px -5px; z-index: -1; border-radius: 8px; background: color-mix(in oklab, var(--spd-accent) 12%, var(--spd-surface)); box-shadow: 0 0 0 1px color-mix(in oklab, var(--spd-accent) 40%, transparent); opacity: var(--b, 1) }

/* Compare line */
.spd-cmp { position: absolute; left: 24px; right: 24px; top: 304px; height: 26px; display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--spd-t3);
  opacity: 0; transform: translateY(-4px); transition: opacity .35s var(--spd-ease), transform .45s var(--spd-ease); pointer-events: none }
.spd[data-compare] .spd-cmp { opacity: 1; transform: none }
.spd-cmp b { flex: none; width: 84px; white-space: nowrap; font-size: 10.5px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--spd-t3) }
.spd-cmp-text { flex: 1; min-width: 0; overflow: hidden; white-space: pre; text-overflow: ellipsis; font-size: 13px; color: var(--spd-t3) }
.spd-cmp-n { flex: none; font-variant-numeric: tabular-nums; font-size: 11.5px; color: var(--spd-t4) }

/* Stats */
.spd-stats { position: absolute; left: 24px; right: 24px; top: 336px; height: 34px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px }
.spd-stat { display: flex; align-items: baseline; gap: 8px; min-width: 0 }
.spd-stat b { font-size: 20px; line-height: 28px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--spd-t1) }
.spd-stat:first-child b { color: var(--spd-accent) }
.spd-stat em { font-style: normal; font-size: 11.5px; line-height: 14px; color: var(--spd-t3) }

/* Controls */
.spd-ctl { position: absolute; left: 24px; right: 24px; top: 380px; height: 24px; display: flex; align-items: center; gap: 16px }
.spd-ctl label, .spd-ctl .spd-cl { font-size: 12px; color: var(--spd-t2); white-space: nowrap }
.spd-range { flex: none; display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0 }
.spd-range output { flex: none; width: 14px; text-align: right; font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--spd-t1) }
.spd-range input { flex: 1; min-width: 60px; max-width: 170px; height: 18px; margin: 0; background: none; appearance: none; -webkit-appearance: none; cursor: pointer }
.spd-range input::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(90deg, var(--spd-accent) var(--p, 50%), var(--spd-rail) var(--p, 50%)) }
.spd-range input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%; background: var(--spd-surface); box-shadow: 0 0 0 1px var(--spd-rail), 0 1px 3px rgb(0 0 0 / .2) }
.spd-range input::-moz-range-track { height: 4px; border-radius: 2px; background: var(--spd-rail) }
.spd-range input::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--spd-accent) }
.spd-range input::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: var(--spd-surface); box-shadow: 0 0 0 1px var(--spd-rail), 0 1px 3px rgb(0 0 0 / .2) }
.spd-sw { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; font-size: 12px; color: var(--spd-t2) }
.spd-sw i { position: relative; width: 28px; height: 16px; border-radius: 8px; background: var(--spd-rail); transition: background-color .25s }
.spd-sw i::after { content: ""; position: absolute; left: 2px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / .25); transition: transform .3s var(--spd-ease) }
.spd-sw[aria-checked="true"] i { background: var(--spd-accent) }
.spd-sw[aria-checked="true"] i::after { transform: translateX(12px) }

@keyframes spd-in { from { opacity: 0; transform: translateY(6px) scale(.97); filter: blur(2px) } }
@keyframes spd-out { to { opacity: 0; transform: translateY(-4px) scale(.98) } }
@keyframes spd-text { from { opacity: 0; transform: translateY(3px); filter: blur(2px) } }
@keyframes spd-pulse { from { opacity: .35; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }
@keyframes spd-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes spd-blink { 50% { opacity: 0 } }

.spd[data-paused] *, .spd[data-paused] *::before, .spd[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .spd *, .spd *::before, .spd *::after { animation: none !important; transition: none !important }
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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -9 * p))

type Snap = { r: number; drafted: number; verified: number; leave: boolean; arrived: number; phase: "idle" | "draft" | "verify" | "accept" | "done"; reset: boolean }
const snapKey = (s: Snap) => `${s.r}|${s.drafted}|${s.verified}|${s.leave ? 1 : 0}|${s.arrived}|${s.phase}|${s.reset ? 1 : 0}`

function snapAt(pl: Plan, t: number): Snap {
  let r = -1
  for (let i = 0; i < pl.rounds.length; i++) if (t >= pl.rounds[i].start && t < pl.rounds[i].end) r = i
  let arrived = 0
  for (const f of pl.flights) if (t >= f.t1) arrived++
  const reset = t >= pl.period - 500
  if (t >= pl.doneAt) return { r: -1, drafted: 0, verified: 0, leave: false, arrived, phase: "done", reset }
  if (r < 0) return { r: -1, drafted: 0, verified: 0, leave: false, arrived, phase: "idle", reset }
  const rp = pl.rounds[r]
  const drafted = Math.max(0, Math.min(rp.L, Math.floor((t - rp.start - 150) / DRAFT_STEP) + 1))
  const per = (rp.tF - 160 - rp.tV) / rp.cols
  const verified = t >= rp.tV ? Math.min(rp.cols, Math.floor((t - rp.tV) / per) + 1) : 0
  const leave = t >= rp.tF
  const phase = t < rp.tV ? "draft" : t < rp.tF ? "verify" : "accept"
  return { r, drafted, verified, leave, arrived, phase, reset }
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function SpeculativeDecoding({
  tokens = DEFAULT_SPEC_TOKENS,
  rounds: recorded,
  draftLength: draftLengthProp,
  defaultDraftLength = 4,
  onDraftLengthChange,
  compare: compareProp,
  defaultCompare = true,
  onCompareChange,
  seed = 12,
  draftCost = 0.1,
  passDuration = 640,
  title = "Speculative decoding",
  draftLabel = "Draft model",
  draftDetail = "Small, fast",
  targetLabel = "Target model",
  targetDetail = "Large",
  onComplete,
  speed = 1,
  paused = false,
  accent,
  label = "Speculative decoding: a small draft model guesses ahead and a large target model checks the guesses in one pass",
  className,
}: SpeculativeDecodingProps) {
  const [lenState, setLenState] = React.useState(defaultDraftLength)
  const [cmpState, setCmpState] = React.useState(defaultCompare)
  const L = Math.min(8, Math.max(2, Math.round(draftLengthProp ?? lenState)))
  const compare = compareProp ?? cmpState
  const reduced = useReducedMotion()

  const { sim, answer } = React.useMemo(() => {
    if (recorded && recorded.length) {
      const rec = fromRecorded(recorded)
      return { sim: rec.rounds, answer: rec.tokens }
    }
    return { sim: simulate(tokens, L, seed), answer: tokens.map((t) => t.text) }
  }, [recorded, tokens, L, seed])
  const pl = React.useMemo(() => plan(sim, answer, L, draftCost, Math.max(200, passDuration)), [sim, answer, L, draftCost, passDuration])
  const finalStats = pl.checkpoints[pl.checkpoints.length - 1]?.stats

  const rootRef = React.useRef<HTMLDivElement>(null)
  const beamRef = React.useRef<HTMLDivElement>(null)
  const flyRefs = React.useRef<(HTMLElement | null)[]>([])
  const ansRefs = React.useRef<(HTMLElement | null)[]>([])
  const statRefs = React.useRef<(HTMLElement | null)[]>([])
  const cmpTextRef = React.useRef<HTMLSpanElement>(null)
  const cmpNRef = React.useRef<HTMLSpanElement>(null)
  const [snap, setSnap] = React.useState<Snap>({ r: -1, drafted: 0, verified: 0, leave: false, arrived: 0, phase: "idle", reset: false })
  const live = React.useRef({ speed, paused, key: "", compare, onComplete, wasDone: false, t: 0 })
  React.useEffect(() => {
    live.current.speed = speed
    live.current.paused = paused
    live.current.compare = compare
    live.current.onComplete = onComplete
  })

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--spd-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Where each answer token lands: measured from the (hidden) inline text, so the answer never reflows.
  const dest = React.useRef<{ x: number; y: number }[]>([])
  React.useLayoutEffect(() => {
    dest.current = answer.map((_, i) => {
      const el = ansRefs.current[i]
      return { x: ANS.x + (el?.offsetLeft ?? 0), y: ANS.y - 4 + (el?.offsetTop ?? 0) }
    })
  }, [answer])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 })
    io.observe(root)
    const colX = (c: number, cols: number) => {
      const cw = (TRACK_W - GAP * (cols - 1)) / cols
      return { x: TRACK_X + c * (cw + GAP), w: cw }
    }
    const fmt = [
      (s: SpecStats) => `${s.speedup.toFixed(1)}×`,
      (s: SpecStats) => `${Math.round(s.acceptance * 100)}%`,
      (s: SpecStats) => s.tokensPerPass.toFixed(1),
    ]
    const draw = (t: number) => {
      const next = snapAt(pl, t)
      const k = snapKey(next)
      if (k !== live.current.key) {
        live.current.key = k
        setSnap(next)
        if (next.phase === "done" && !live.current.wasDone && finalStats) live.current.onComplete?.(finalStats)
        live.current.wasDone = next.phase === "done"
      }
      // beam
      const beam = beamRef.current
      if (beam) {
        const rp = next.r >= 0 ? pl.rounds[next.r] : null
        if (rp && t >= rp.tV && t < rp.tF - 160) {
          const u = clamp01((t - rp.tV) / (rp.tF - 160 - rp.tV))
          const col = Math.min(rp.cols - 1, Math.floor(u * rp.cols))
          const a = colX(col, rp.cols)
          const x = a.x - 7
          beam.style.width = `${a.w + 14}px`
          beam.style.opacity = "1"
          beam.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`
        } else beam.style.opacity = "0"
      }
      // flying tokens
      for (let i = 0; i < answer.length; i++) {
        const el = flyRefs.current[i]
        if (!el) continue
        const f = pl.flights.find((q) => q.token === i)
        if (!f || t < f.t0 || t >= f.t1) {
          el.style.opacity = "0"
          continue
        }
        const rp = pl.rounds.find((r) => f.t0 >= r.tF && f.t0 < r.end)
        const cols = rp?.cols ?? L
        const c = colX(f.col, cols)
        const u = easeOutExpo((t - f.t0) / (f.t1 - f.t0))
        const d = dest.current[i] ?? { x: ANS.x, y: ANS.y }
        const sx = c.x + c.w / 2 - (el.offsetWidth || 40) / 2
        const sy = LANE_Y[1] + 14
        const x = sx + (d.x - sx) * u
        const y = sy + (d.y - sy) * u - Math.sin(Math.PI * u) * 10
        el.style.opacity = String(clamp01((t - f.t0) / 90))
        el.style.setProperty("--b", String(1 - u))
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      }
      // stats
      let from: SpecStats | null = null
      let to: SpecStats | null = null
      let p = 1
      for (const cp of pl.checkpoints) {
        if (t >= cp.t) {
          from = to
          to = cp.stats
          p = clamp01((t - cp.t) / 500)
        }
      }
      statRefs.current.forEach((el, i) => {
        if (!el) return
        if (!to) {
          el.textContent = "–"
          return
        }
        const eased = 1 - Math.pow(1 - p, 3)
        const a = from ?? { ...to, speedup: 1, acceptance: 0, tokensPerPass: 0 }
        const cur: SpecStats = {
          ...to,
          speedup: a.speedup + (to.speedup - a.speedup) * eased,
          acceptance: a.acceptance + (to.acceptance - a.acceptance) * eased,
          tokensPerPass: a.tokensPerPass + (to.tokensPerPass - a.tokensPerPass) * eased,
        }
        el.textContent = fmt[i](cur)
      })
      // compare line: the target alone needs `speedup` times as long
      const sp = finalStats?.speedup ?? 1
      const u = clamp01((t - pl.t0) / (pl.specSpan * sp))
      const count = Math.min(answer.length, Math.floor(u * answer.length + 0.0001))
      if (cmpTextRef.current) cmpTextRef.current.textContent = answer.slice(0, count).join("").trimStart()
      if (cmpNRef.current) cmpNRef.current.textContent = `${count} of ${answer.length}`
    }
    if (reduced) {
      live.current.t = pl.doneAt + 100
      draw(pl.doneAt + 100)
      return () => io.disconnect()
    }
    let raf = 0
    let last = 0
    let t = 0
    draw(0)
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 0
      last = now
      if (!live.current.paused && visible && dt > 0) {
        t += dt * Math.max(0.05, live.current.speed)
        if (t >= pl.period) t -= pl.period
        live.current.t = t
        draw(t)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [pl, answer, finalStats, reduced, L])

  const setLen = (n: number) => {
    if (draftLengthProp === undefined) setLenState(n)
    onDraftLengthChange?.(n)
  }
  const setCmp = (v: boolean) => {
    if (compareProp === undefined) setCmpState(v)
    onCompareChange?.(v)
  }

  const rp = snap.r >= 0 ? pl.rounds[snap.r] : null
  const cols = rp?.cols ?? L
  const cw = (TRACK_W - GAP * (cols - 1)) / cols
  const cx = (c: number) => TRACK_X + c * (cw + GAP)
  const done = snap.phase === "done" || reduced
  const status = done ? "done" : snap.phase === "idle" ? "idle" : snap.phase === "draft" ? "draft" : "verify"
  const statusText = { idle: "Ready", draft: "Drafting", verify: snap.phase === "accept" ? "Accepting" : "Verifying", done: "Done" }[status]
  const arrived = reduced ? answer.length : snap.arrived

  const vars = {
    ...(accent ? { "--spd-accent": accent } : null),
    "--spd-speed": Math.max(0.05, speed),
  } as React.CSSProperties
  const pct = ((L - 2) / 6) * 100

  return (
    <div
      ref={rootRef}
      className={className ? `spd ${className}` : "spd"}
      role="group"
      aria-label={label}
      data-paused={paused || undefined}
      data-compare={compare || undefined}
      data-leave={snap.leave || undefined}
      data-reset={snap.reset || undefined}
      data-live={!done || undefined}
      style={vars}
    >
      <style href="pane-speculative-decoding" precedence="default">
        {CSS}
      </style>
      <div className="spd-stage">
        <div className="spd-head">
          <span className="spd-mark" aria-hidden>
            <FastForward />
          </span>
          <span className="spd-title">{title}</span>
          <span className="spd-status" data-s={status} aria-live="polite">
            <i />
            <span key={statusText}>{statusText}</span>
          </span>
        </div>
        <div className="spd-sub">
          The draft guesses {L} tokens ahead; the target checks them all in one pass.
        </div>
        <div className="spd-rule" style={{ top: 80 }} />

        <div className="spd-fade">
          <div aria-hidden style={{ display: "contents" }}>
          {LANE_Y.map((y, i) => (
            <React.Fragment key={i}>
              <div className="spd-lane" style={{ top: y }} />
              <div className="spd-lab" data-lane={i ? "target" : "draft"} style={{ top: y }}>
                <b>
                  <i />
                  {i ? targetLabel : draftLabel}
                </b>
                <em>{i ? targetDetail : draftDetail}</em>
              </div>
            </React.Fragment>
          ))}
          <div ref={beamRef} className="spd-beam" />

          {rp &&
            Array.from({ length: rp.cols }, (_, c) => {
              const isBonus = c >= rp.L
              const drafted = c < snap.drafted
              const verified = c < snap.verified
              const ok = c < rp.accepted
              const bad = c === rp.accepted && !isBonus
              const cell = {
                left: cx(c),
                width: cw,
              }
              return (
                <React.Fragment key={`${snap.r}-${c}`}>
                  {drafted && (
                    <div
                      className="spd-cell"
                      data-lane="draft"
                      style={{ ...cell, top: LANE_Y[0] + 12 }}
                      data-v={verified ? (ok ? "ok" : bad ? "no" : "drop") : undefined}
                      data-pending={!verified || undefined}
                    >
                      <span>{rp.draft[c]}</span>
                    </div>
                  )}
                  {verified && (
                    <div className="spd-cell" data-lane="target" style={{ ...cell, top: LANE_Y[1] + 12 }} data-v={ok ? "ok" : bad || isBonus ? "new" : "drop"}>
                      {ok ? <Check /> : bad ? <X /> : null}
                      <span>{ok ? rp.draft[c] : bad || isBonus ? (rp.next ?? "") : "skipped"}</span>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          {rp &&
            Array.from({ length: rp.cols }, (_, c) => {
              return <div key={`g${snap.r}-${c}`} className="spd-ghost" style={{ left: cx(c), width: cw, top: LANE_Y[0] + 12 }} hidden={c < snap.drafted} />
            })}
          </div>

        <div className="spd-alab">Answer</div>
        <p className="spd-ans" aria-label={`Answer so far: ${answer.slice(0, arrived).join("")}`}>
          {answer.map((tk, i) => (
            <span
              key={i}
              ref={(el) => {
                ansRefs.current[i] = el
              }}
              data-on={i < arrived || undefined}
              aria-hidden
            >
              {tk}
            </span>
          ))}
          <i className="spd-ans-caret" aria-hidden />
        </p>
        {answer.map((tk, i) => (
          <span
            key={i}
            ref={(el) => {
              flyRefs.current[i] = el
            }}
            className="spd-fly"
            aria-hidden
          >
            {tk}
          </span>
        ))}

        <div className="spd-cmp" aria-hidden>
          <b>Target only</b>
          <span className="spd-cmp-text" ref={cmpTextRef} />
          <span className="spd-cmp-n" ref={cmpNRef} />
        </div>

        <div className="spd-stats">
          {[
            ["Faster", 0],
            ["Drafts accepted", 1],
            ["Tokens per pass", 2],
          ].map(([name, i]) => (
            <div key={name} className="spd-stat">
              <b
                ref={(el) => {
                  statRefs.current[i as number] = el
                }}
              >
                –
              </b>
              <em>{name}</em>
            </div>
          ))}
        </div>

        <div className="spd-ctl">
          {!(recorded && recorded.length) && (
            <div className="spd-range">
              <label htmlFor="spd-len">Draft length</label>
              <input
                id="spd-len"
                type="range"
                min={2}
                max={8}
                step={1}
                value={L}
                style={{ "--p": `${pct}%` } as React.CSSProperties}
                onChange={(e) => setLen(Number(e.target.value))}
                aria-valuetext={`${L} tokens per round`}
              />
              <output htmlFor="spd-len">{L}</output>
            </div>
          )}
          <button type="button" className="spd-sw" role="switch" aria-checked={compare} onClick={() => setCmp(!compare)}>
            Compare without speculation
            <i />
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

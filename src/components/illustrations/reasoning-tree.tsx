"use client"

import * as React from "react"
import { ListTree } from "lucide-react"

/**
 * ReasoningTree – tree search over thoughts. A question proposes candidate thoughts, each is scored,
 * weak branches fade, the strongest expand another level (beam search, up to three levels), and the
 * best path draws in to the answer. Scores are illustrative sample values.
 *
 *   <ReasoningTree defaultBeamWidth={2} />
 */

export type ReasoningThought = {
  /** Short name shown on the node, about 16 characters. */
  label: string
  /** The full thought, shown on hover and focus. A leaf's text becomes the answer. */
  text?: string
  /** 0 to 1. Left out, it is made up from the seed so the run is repeatable. */
  score?: number
  /** The next level of thoughts (read to depth 3, up to three per thought). */
  children?: ReasoningThought[]
}

export type ReasoningAnswer = {
  text: string
  /** Labels from the first thought to the answer. */
  path: string[]
}

export type ReasoningTreeProps = {
  /** The root question, kept short. */
  question?: string
  /** The full question for screen readers. */
  questionDetail?: string
  /** First-level thoughts. */
  thoughts?: ReasoningThought[]
  /** Thoughts kept per level, 1 to 3 (controlled). */
  beamWidth?: number
  /** Initial beam width when uncontrolled. Default 2. */
  defaultBeamWidth?: number
  onBeamWidthChange?: (n: number) => void
  /** Seed for thoughts without a score. Default 7. */
  seed?: number
  /** Model name in the header. `null` hides it. */
  model?: string | null
  title?: string
  /** Called once per search with the answer and its path. */
  onAnswer?: (answer: ReasoningAnswer) => void
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for kept thoughts and the best path. */
  accent?: string
  /** Accessible name. */
  label?: string
  className?: string
}

const T = (label: string, score: number, text?: string, children?: ReasoningThought[]): ReasoningThought => ({ label, score, text, children })

export const DEFAULT_THOUGHTS: ReasoningThought[] = [
  T("Cache the API", 0.78, "Cache what the API returns.", [
    T("Edge cache reads", 0.86, "Serve reads from the edge.", [
      T("Purge on write", 0.74, "Serve reads from an edge cache and purge it on every write."),
      T("Revalidate async", 0.91, "Serve reads from an edge cache and revalidate in the background."),
      T("Per-user keys", 0.48, "Serve reads from an edge cache with one key per user."),
    ]),
    T("Batch requests", 0.61, "Fewer round trips.", [
      T("One round trip", 0.7, "Fold the page's requests into one round trip."),
      T("Larger payloads", 0.35, "Send bigger payloads less often."),
      T("Prefetch next", 0.55, "Prefetch the next screen's data."),
    ]),
    T("Memoize queries", 0.44, "Memoize slow queries.", [
      T("Per-request memo", 0.5, "Memoize queries within one request."),
      T("Shared memo", 0.42, "Memoize queries across requests."),
      T("Warm on deploy", 0.38, "Warm the memo on every deploy."),
    ]),
  ]),
  T("Shrink assets", 0.66, "Send fewer bytes.", [
    T("Modern images", 0.81, "Switch image formats.", [
      T("AVIF with fallback", 0.83, "Serve AVIF images with a fallback format."),
      T("Lazy-load images", 0.72, "Lazy-load every image below the fold."),
      T("Responsive sizes", 0.66, "Ship responsive image sizes."),
    ]),
    T("Minify bundles", 0.52, "Trim the JavaScript.", [
      T("Tree-shake deps", 0.58, "Tree-shake unused dependencies."),
      T("Drop polyfills", 0.46, "Drop legacy polyfills."),
      T("Split by route", 0.62, "Split bundles by route."),
    ]),
    T("Subset fonts", 0.4, "Subset web fonts.", [
      T("Latin only", 0.52, "Ship Latin glyphs only."),
      T("Variable font", 0.45, "Use one variable font."),
      T("Preload", 0.36, "Preload the primary font."),
    ]),
  ]),
  T("Defer scripts", 0.35, "Move scripts out of the way.", [
    T("Async analytics", 0.55, "Load analytics asynchronously.", [
      T("After idle", 0.6, "Start analytics after the page is idle."),
      T("Worker thread", 0.5, "Run analytics in a worker."),
      T("Sample events", 0.4, "Sample analytics events."),
    ]),
    T("Split vendor code", 0.62, "Split vendor bundles.", [
      T("Per-page vendor", 0.55, "Load vendor code per page."),
      T("Shared chunk", 0.5, "Share one vendor chunk."),
      T("Dynamic imports", 0.45, "Import vendor code on demand."),
    ]),
    T("Idle-time init", 0.3, "Initialise on idle.", [
      T("requestIdle", 0.4, "Initialise widgets when idle."),
      T("On interaction", 0.35, "Initialise on first interaction."),
      T("Visible only", 0.3, "Initialise when scrolled into view."),
    ]),
  ]),
]

/* -------------------------------------------------------------------------- */
/*                                   Search                                   */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 420
const Q = { x: 20, w: 100, h: 64, cy: 246 }
const COL_X = (d: number) => 140 + (d - 1) * 168
const COL_W = 148
const AREA_C = 246
const AREA_H = 252

type PNode = {
  id: string
  depth: number
  parent: string | null
  label: string
  text: string
  score: number
  idx: number
  x: number
  y: number
  h: number
  kept: boolean
  onBest: boolean
  appear: number
  scoreAt: number
  pruneAt: number
  size: number
}
type Plan = {
  nodes: PNode[]
  depths: { start: number; scoreAt: number; pruneAt: number; next: number; count: number; kept: number }[]
  bestAt: number
  answerAt: number
  endAt: number
  period: number
  answer: ReasoningAnswer
}

function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildPlan(thoughts: ReasoningThought[], beam: number, seed: number): Plan {
  const rng = mulberry32(seed)
  type Raw = { id: string; parent: string | null; t: ReasoningThought; score: number; kids: Raw[] }
  const wrap = (list: ReasoningThought[], parent: string | null, depth: number): Raw[] =>
    list.slice(0, 3).map((t, i) => {
      const id = `${parent ?? "r"}.${i}`
      const raw: Raw = { id, parent, t, score: t.score ?? 0.3 + rng() * 0.6, kids: [] }
      if (depth < 3 && t.children) raw.kids = wrap(t.children, id, depth + 1)
      return raw
    })
  const roots = wrap(thoughts, null, 1)
  const nodes: PNode[] = []
  let cand: Raw[] = roots
  let time = 700
  const depths: Plan["depths"] = []
  const keptIds = new Set<string>()
  for (let depth = 1; depth <= 3 && cand.length; depth++) {
    const n = cand.length
    const pitch = Math.min(36, AREA_H / n)
    const h = Math.min(26, pitch - 3)
    const appearEnd = time + (n - 1) * 140 + 480
    const scoreAt = appearEnd + 60
    const pruneAt = scoreAt + 1000
    const ranked = cand.map((c, i) => [c.score, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, beam)
    const keptIdx = new Set(ranked.map(([, i]) => i))
    cand.forEach((c, i) => {
      if (keptIdx.has(i)) keptIds.add(c.id)
      nodes.push({
        id: c.id,
        depth,
        parent: c.parent,
        label: c.t.label,
        text: c.t.text ?? c.t.label,
        score: c.score,
        idx: i,
        size: n,
        x: COL_X(depth),
        y: AREA_C + (i - (n - 1) / 2) * pitch,
        h,
        kept: keptIdx.has(i),
        onBest: false,
        appear: time + i * 140,
        scoreAt,
        pruneAt,
      })
    })
    const next = pruneAt + 700
    depths.push({ start: time, scoreAt, pruneAt, next, count: n, kept: keptIdx.size })
    time = next
    cand = cand.filter((_, i) => keptIdx.has(i)).flatMap((c) => c.kids)
  }
  // best path: the highest scoring node of the last level, followed back to the question
  const lastDepth = depths.length
  const leaves = nodes.filter((nd) => nd.depth === lastDepth && nd.kept)
  const best = leaves.slice().sort((a, b) => b.score - a.score || a.idx - b.idx)[0]
  const path: PNode[] = []
  for (let cur: PNode | undefined = best; cur; cur = nodes.find((x) => x.id === cur!.parent)) {
    cur.onBest = true
    path.unshift(cur)
  }
  const bestAt = time
  const answerAt = bestAt + 1100
  const endAt = answerAt + 3800
  return {
    nodes,
    depths,
    bestAt,
    answerAt,
    endAt,
    period: endAt + 500,
    answer: { text: best?.text ?? "", path: path.map((p) => p.label) },
  }
}

/** 0 hidden, 1 proposed, 2 scoring, 3 kept, 4 pruned, 5 on the best path. */
function stageOf(n: PNode, t: number, bestAt: number): number {
  if (t < n.appear) return 0
  if (t < n.scoreAt) return 1
  if (t < n.pruneAt) return 2
  if (!n.kept) return 4
  return n.onBest && t >= bestAt ? 5 : 3
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
@property --rtr-n { syntax: "<integer>"; inherits: false; initial-value: 0 }
.rtr {
  --rtr-ink: #000;
  --rtr-surface: #fff;
  --rtr-accent: #0060e2;
  --rtr-green: #1fa85a;
  --rtr-speed: 1;
  --rtr-scale: 1;
  --rtr-t1: color-mix(in oklab, var(--rtr-ink) 88%, transparent);
  --rtr-t2: color-mix(in oklab, var(--rtr-ink) 61%, transparent);
  --rtr-t3: color-mix(in oklab, var(--rtr-ink) 45%, transparent);
  --rtr-t4: color-mix(in oklab, var(--rtr-ink) 27%, transparent);
  --rtr-fill: color-mix(in oklab, var(--rtr-ink) 4.5%, transparent);
  --rtr-line: color-mix(in oklab, var(--rtr-ink) 7%, transparent);
  --rtr-rail: color-mix(in oklab, var(--rtr-ink) 14%, transparent);
  --rtr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --rtr-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 14px 32px -12px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --rtr-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .22), 0 1px 2px 0 rgb(0 0 0 / .06);
  --rtr-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--rtr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left; color: var(--rtr-t1);
}
:is(.dark, [data-theme="dark"]) .rtr {
  --rtr-ink: #fff; --rtr-surface: #1c1c1e; --rtr-accent: #4d8dff; --rtr-green: #34d27b;
  --rtr-t1: color-mix(in oklab, var(--rtr-ink) 90%, transparent);
  --rtr-t2: color-mix(in oklab, var(--rtr-ink) 62%, transparent);
  --rtr-t3: color-mix(in oklab, var(--rtr-ink) 46%, transparent);
  --rtr-t4: color-mix(in oklab, var(--rtr-ink) 28%, transparent);
  --rtr-fill: color-mix(in oklab, var(--rtr-ink) 6%, transparent);
  --rtr-line: color-mix(in oklab, var(--rtr-ink) 9%, transparent);
  --rtr-rail: color-mix(in oklab, var(--rtr-ink) 18%, transparent);
  --rtr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --rtr-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 32px -12px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
  --rtr-pop: 0 0 0 .5px rgb(255 255 255 / .14), 0 12px 28px -10px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.rtr *, .rtr *::before, .rtr *::after { box-sizing: border-box }
.rtr button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.rtr :focus-visible { outline: 2px solid color-mix(in oklab, var(--rtr-accent) 60%, transparent); outline-offset: 2px }
.rtr-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--rtr-scale));
  border-radius: 18px; background: var(--rtr-surface); box-shadow: var(--rtr-float); overflow: hidden }
.rtr-body { position: absolute; inset: 0; transition: opacity calc(.45s / var(--rtr-speed)) ease }
.rtr[data-reset] .rtr-body { opacity: 0 }

/* Header */
.rtr-head { position: absolute; left: 24px; right: 24px; top: 20px; display: flex; align-items: center; gap: 10px; height: 26px }
.rtr-mark { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; color: var(--rtr-accent); background: color-mix(in oklab, var(--rtr-accent) 12%, transparent) }
.rtr-mark svg { width: 13px; height: 13px; stroke-width: 2.2 }
.rtr-title { font-size: 14px; font-weight: 500; letter-spacing: -.005em }
.rtr-model { height: 20px; padding: 0 8px; border-radius: 10px; font-size: 11px; line-height: 20px; font-weight: 500; color: var(--rtr-t2); background: var(--rtr-fill) }
.rtr-sp { flex: 1 }
.rtr-beam { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--rtr-t3) }
.rtr-seg { position: relative; display: inline-flex; padding: 2px; border-radius: 9px; background: var(--rtr-fill) }
.rtr-seg::before { content: ""; position: absolute; left: 2px; top: 2px; bottom: 2px; width: calc((100% - 4px) / 3); border-radius: 7px; background: var(--rtr-surface); box-shadow: var(--rtr-shadow);
  transform: translateX(calc((var(--k) - 1) * 100%)); transition: transform .35s var(--rtr-ease) }
.rtr-seg button { position: relative; z-index: 1; width: 26px; height: 22px; border-radius: 7px; font-size: 12px; line-height: 22px; font-weight: 500; color: var(--rtr-t3); transition: color .2s }
.rtr-seg button[aria-pressed="true"] { color: var(--rtr-t1) }
.rtr-sub { position: absolute; left: 24px; top: 48px; height: 20px; display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--rtr-t3) }
.rtr-sub i { width: 6px; height: 6px; border-radius: 50%; background: var(--rtr-t4) }
.rtr-sub[data-s="run"] i { background: var(--rtr-accent); animation: rtr-pulse calc(1s / var(--rtr-speed)) ease-in-out infinite alternate }
.rtr-sub[data-s="done"] i { background: var(--rtr-green) }
.rtr-sub span { display: inline-block; animation: rtr-text calc(.4s / var(--rtr-speed)) var(--rtr-ease) backwards }
.rtr-rule { position: absolute; left: 0; right: 0; top: 80px; height: 1px; background: var(--rtr-line) }
.rtr-ch { position: absolute; top: 90px; height: 16px; display: flex; justify-content: space-between; font-size: 10.5px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--rtr-t3) }
.rtr-ch span:last-child { letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; color: var(--rtr-t4); animation: rtr-text calc(.4s / var(--rtr-speed)) var(--rtr-ease) backwards }

/* Edges */
.rtr-edges { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; overflow: visible; pointer-events: none }
.rtr-edges path { fill: none; stroke-linecap: round }
.rtr-e { stroke: var(--rtr-rail); stroke-width: 1.5; stroke-dasharray: 1 1; animation: rtr-draw calc(.5s / var(--rtr-speed)) var(--rtr-ease) backwards; transition: stroke .4s }
.rtr-e[data-st="3"], .rtr-e[data-st="5"] { stroke: color-mix(in oklab, var(--rtr-accent) 55%, transparent) }
.rtr-e[data-st="5"] { stroke: var(--rtr-accent); stroke-width: 2.25 }
.rtr-e[data-st="4"] { stroke-dasharray: .2 1; stroke: var(--rtr-line); animation: rtr-retract calc(.5s / var(--rtr-speed)) var(--rtr-ease) backwards }
.rtr-sheen { stroke: rgb(255 255 255 / .9); stroke-width: 2.25; stroke-dasharray: .1 1; animation: rtr-travel calc(1.5s / var(--rtr-speed)) linear infinite }
:is(.dark, [data-theme="dark"]) .rtr-sheen { stroke: rgb(255 255 255 / .75) }

/* Nodes */
.rtr-q { position: absolute; left: ${Q.x}px; top: ${Q.cy - Q.h / 2}px; width: ${Q.w}px; height: ${Q.h}px; padding: 8px 10px; border-radius: 12px; background: var(--rtr-surface); box-shadow: 0 0 0 1.5px var(--rtr-accent), 0 8px 18px -10px color-mix(in oklab, var(--rtr-accent) 60%, transparent);
  font-size: 12px; line-height: 16px; font-weight: 500; display: flex; align-items: center; text-wrap: balance }
.rtr-q:focus-visible { outline-offset: 3px }
.rtr-node { position: absolute; width: ${COL_W}px; display: flex; align-items: center; gap: 6px; padding: 0 8px 0 9px; border-radius: 8px; background: var(--rtr-surface); box-shadow: var(--rtr-shadow); text-align: left; overflow: hidden;
  animation: rtr-in calc(.45s / var(--rtr-speed)) var(--rtr-ease) backwards; transition: opacity .4s, box-shadow .4s, background-color .4s }
.rtr-node b { flex: 1; min-width: 0; font-size: 11.5px; line-height: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--rtr-t1) }
.rtr-sc { flex: none; font-size: 11px; line-height: 14px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--rtr-t3); counter-reset: rtr-n var(--rtr-n); --rtr-n: var(--v); animation: rtr-count calc(.7s / var(--rtr-speed)) ease-out backwards }
.rtr-sc::after { content: counter(rtr-n) }
.rtr-bar { position: absolute; left: 9px; right: 8px; bottom: 3px; height: 2px; border-radius: 1px; background: var(--rtr-fill); overflow: hidden }
.rtr-bar i { display: block; height: 100%; border-radius: 1px; background: var(--rtr-t4); transform: scaleX(var(--s)); transform-origin: 0 50%; animation: rtr-fill calc(.7s / var(--rtr-speed)) var(--rtr-ease) backwards; transition: background-color .4s }
.rtr-node[data-st="3"], .rtr-node[data-st="5"] { background: color-mix(in oklab, var(--rtr-accent) 8%, var(--rtr-surface)); box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--rtr-accent) 65%, transparent) }
.rtr-node[data-st="3"] .rtr-bar i, .rtr-node[data-st="5"] .rtr-bar i { background: var(--rtr-accent) }
.rtr-node[data-st="3"] .rtr-sc, .rtr-node[data-st="5"] .rtr-sc { color: var(--rtr-accent) }
.rtr-node[data-st="5"] { background: color-mix(in oklab, var(--rtr-accent) 14%, var(--rtr-surface)); box-shadow: 0 0 0 2px var(--rtr-accent), 0 6px 14px -8px color-mix(in oklab, var(--rtr-accent) 70%, transparent) }
.rtr-node[data-st="4"] { opacity: .4; box-shadow: 0 0 0 1px var(--rtr-line) }
.rtr-node[data-st="1"] b { color: var(--rtr-t2) }
.rtr-tip { position: absolute; z-index: 5; width: 200px; padding: 9px 11px; border-radius: 10px; background: var(--rtr-surface); box-shadow: var(--rtr-pop); pointer-events: none; animation: rtr-text calc(.25s / var(--rtr-speed)) var(--rtr-ease) backwards }
.rtr-tip b { display: block; font-size: 12px; line-height: 16px; font-weight: 500 }
.rtr-tip span { display: block; margin-top: 2px; font-size: 11.5px; line-height: 16px; color: var(--rtr-t2) }
.rtr-tip em { display: block; margin-top: 4px; font-style: normal; font-size: 10.5px; line-height: 14px; color: var(--rtr-t3) }

/* Answer */
.rtr-ans { position: absolute; left: 24px; right: 24px; top: 382px; height: 28px; display: flex; align-items: center; gap: 10px; padding: 0 12px 0 6px; border-radius: 10px; background: color-mix(in oklab, var(--rtr-accent) 9%, var(--rtr-surface));
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--rtr-accent) 40%, transparent); opacity: 0; transform: translateY(8px); visibility: hidden }
.rtr-ans[data-on] { opacity: 1; transform: none; visibility: visible; animation: rtr-in calc(.6s / var(--rtr-speed)) var(--rtr-ease) backwards }
.rtr-ans-ic { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: #fff; background: var(--rtr-green) }
.rtr-ans-ic svg { width: 11px; height: 11px; stroke-width: 3 }
.rtr-ans-ic svg path { stroke-dasharray: 1; animation: rtr-check calc(.5s / var(--rtr-speed)) .25s ease-out backwards }
.rtr-ans-t { flex: 1; min-width: 0; font-size: 12.5px; line-height: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.rtr-ans-p { flex: none; font-size: 11px; color: var(--rtr-t3) }

@keyframes rtr-in { from { opacity: 0; transform: translateX(-6px) scale(.97); filter: blur(2px) } }
@keyframes rtr-text { from { opacity: 0; transform: translateY(3px); filter: blur(2px) } }
@keyframes rtr-draw { from { stroke-dashoffset: 1 } }
@keyframes rtr-retract { from { stroke-dasharray: 1 1 } }
@keyframes rtr-travel { from { stroke-dashoffset: .1 } to { stroke-dashoffset: -1 } }
@keyframes rtr-fill { from { transform: scaleX(0) } }
@keyframes rtr-count { from { --rtr-n: 0 } }
@keyframes rtr-check { from { stroke-dashoffset: 1 } }
@keyframes rtr-pulse { from { opacity: .35; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }

.rtr[data-paused] *, .rtr[data-paused] *::before, .rtr[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .rtr *, .rtr *::before, .rtr *::after { animation: none !important; transition: none !important }
  .rtr-sheen { display: none }
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

type Snap = { stages: number[]; answer: boolean; reset: boolean; phase: string; depth: number; counts: number[] }

function snapAt(pl: Plan, t: number): Snap {
  const stages = pl.nodes.map((n) => stageOf(n, t, pl.bestAt))
  let phase = "idle"
  let depth = 0
  for (let i = 0; i < pl.depths.length; i++) {
    const d = pl.depths[i]
    if (t >= d.start && t < d.next) {
      depth = i + 1
      phase = t < d.scoreAt ? "propose" : t < d.pruneAt ? "score" : "prune"
    }
  }
  if (t >= pl.bestAt) phase = t >= pl.answerAt ? "done" : "path"
  const counts = pl.depths.map((d) => (t >= d.pruneAt ? d.kept : -1))
  return { stages, answer: t >= pl.answerAt, reset: t >= pl.period - 500, phase, depth, counts }
}
const snapKey = (s: Snap) => `${s.stages.join("")}|${s.answer ? 1 : 0}|${s.reset ? 1 : 0}|${s.phase}|${s.depth}|${s.counts.join(",")}`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function ReasoningTree({
  question = "How do we halve page load time?",
  questionDetail,
  thoughts = DEFAULT_THOUGHTS,
  beamWidth: beamProp,
  defaultBeamWidth = 2,
  onBeamWidthChange,
  seed = 7,
  model = "Nova",
  title = "Tree of thoughts",
  onAnswer,
  speed = 1,
  paused = false,
  accent,
  label = "Tree of thoughts: candidate thoughts are scored, weak branches fade and the best path leads to the answer",
  className,
}: ReasoningTreeProps) {
  const [beamState, setBeamState] = React.useState(defaultBeamWidth)
  const beam = Math.min(3, Math.max(1, Math.round(beamProp ?? beamState)))
  const reduced = useReducedMotion()
  const pl = React.useMemo(() => buildPlan(thoughts, beam, seed), [thoughts, beam, seed])
  const rootRef = React.useRef<HTMLDivElement>(null)
  const nodeRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const [snap, setSnap] = React.useState<Snap>(() => snapAt(pl, 0))
  const [active, setActive] = React.useState<string | null>(null)
  const [tip, setTip] = React.useState<string | null>(null)
  const live = React.useRef({ speed, paused, key: "", onAnswer, wasDone: false })
  React.useEffect(() => {
    live.current.speed = speed
    live.current.paused = paused
    live.current.onAnswer = onAnswer
  })

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--rtr-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // One clock. React is only told when the stage of some node (or the status) changes.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 })
    io.observe(root)
    live.current.key = ""
    live.current.wasDone = false
    const draw = (t: number) => {
      const s = snapAt(pl, t)
      const k = snapKey(s)
      if (k !== live.current.key) {
        live.current.key = k
        setSnap(s)
        const done = s.phase === "done"
        if (done && !live.current.wasDone) live.current.onAnswer?.(pl.answer)
        live.current.wasDone = done
      }
    }
    if (reduced) {
      draw(pl.answerAt + 100)
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
        draw(t)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [pl, reduced])

  const setBeam = (n: number) => {
    if (n === beam) return
    if (beamProp === undefined) setBeamState(n)
    onBeamWidthChange?.(n)
  }

  const stageOfId = (i: number) => (reduced ? (pl.nodes[i].kept ? (pl.nodes[i].onBest ? 5 : 3) : 4) : snap.stages[i] ?? 0)
  const visible = pl.nodes.map((n, i) => ({ n, i, st: stageOfId(i) })).filter((x) => x.st > 0)
  const byId = new Map(pl.nodes.map((n) => [n.id, n]))
  const focusId = active && visible.some((v) => v.n.id === active) ? active : "q"
  const done = reduced || snap.phase === "done"

  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const cur = focusId === "q" ? null : byId.get(focusId)
    let target: string | undefined
    if (!cur) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") target = visible.find((v) => v.n.depth === 1)?.n.id
    } else {
      const col = visible.filter((v) => v.n.depth === cur.depth).map((v) => v.n)
      const at = col.findIndex((n) => n.id === cur.id)
      if (e.key === "ArrowUp") target = col[Math.max(0, at - 1)]?.id
      if (e.key === "ArrowDown") target = col[Math.min(col.length - 1, at + 1)]?.id
      if (e.key === "Home") target = col[0]?.id
      if (e.key === "End") target = col[col.length - 1]?.id
      if (e.key === "ArrowRight") target = visible.find((v) => v.n.parent === cur.id)?.n.id
      if (e.key === "ArrowLeft") target = cur.parent ?? "q"
    }
    if (target) {
      setActive(target)
      nodeRefs.current[target]?.focus()
    }
  }

  const stateName = (st: number) => ["hidden", "unscored", "scoring", "kept", "pruned", "best path"][st]
  const phaseText: Record<string, string> = {
    idle: "Ready",
    propose: `Proposing thoughts, level ${snap.depth}`,
    score: `Scoring level ${snap.depth}`,
    prune: `Keeping the best ${beam}`,
    path: "Tracing the best path",
    done: "Done",
  }
  const status = reduced ? "Done" : phaseText[snap.phase]
  const tipNode = tip ? byId.get(tip) : null
  const tipI = tipNode ? pl.nodes.indexOf(tipNode) : -1

  const vars = {
    ...(accent ? { "--rtr-accent": accent } : null),
    "--rtr-speed": Math.max(0.05, speed),
  } as React.CSSProperties
  const nDepth = pl.depths.length

  return (
    <div
      ref={rootRef}
      className={className ? `rtr ${className}` : "rtr"}
      role="group"
      aria-label={label}
      data-paused={paused || undefined}
      data-reset={snap.reset && !reduced ? "" : undefined}
      style={vars}
    >
      <style href="pane-reasoning-tree" precedence="default">
        {CSS}
      </style>
      <div className="rtr-stage">
        <div className="rtr-head">
          <span className="rtr-mark" aria-hidden>
            <ListTree />
          </span>
          <span className="rtr-title">{title}</span>
          {model !== null && <span className="rtr-model">{model}</span>}
          <span className="rtr-sp" />
          <div className="rtr-beam">
            Beam width
            <div className="rtr-seg" style={{ "--k": beam } as React.CSSProperties} role="group" aria-label="Thoughts kept per level">
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" aria-pressed={beam === n} onClick={() => setBeam(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="rtr-sub" data-s={done ? "done" : snap.phase === "idle" ? "idle" : "run"} aria-live="polite">
          <i />
          <span key={status}>{status}</span>
        </div>
        <div className="rtr-rule" />

        <div className="rtr-body">
          <div className="rtr-ch" style={{ left: Q.x, width: Q.w }} aria-hidden>
            <span>Question</span>
          </div>
          {pl.depths.map((d, i) => (
            <div key={i} className="rtr-ch" style={{ left: COL_X(i + 1), width: COL_W }} aria-hidden>
              <span>Level {i + 1}</span>
              {(reduced ? d.kept : snap.counts[i]) >= 0 && (
                <span key={`${beam}-${i}`}>
                  kept {reduced ? d.kept : snap.counts[i]} of {d.count}
                </span>
              )}
            </div>
          ))}

          <svg className="rtr-edges" viewBox={`0 0 ${W} ${H}`} aria-hidden>
            {visible.map(({ n, st }) => {
              const p = n.parent ? byId.get(n.parent) : null
              const x0 = p ? p.x + COL_W : Q.x + Q.w
              const y0 = p ? p.y : Q.cy
              const x1 = n.x
              const dx = (x1 - x0) * 0.5
              const d = `M${x0} ${y0} C${x0 + dx} ${y0} ${x1 - dx} ${n.y} ${x1} ${n.y}`
              return (
                <React.Fragment key={n.id}>
                  <path className="rtr-e" data-st={st} d={d} pathLength={1} />
                  {st === 5 && <path className="rtr-sheen" d={d} pathLength={1} />}
                </React.Fragment>
              )
            })}
          </svg>

          <div
            ref={(el) => {
              nodeRefs.current.q = el
            }}
            className="rtr-q"
            role="treeitem"
            aria-level={1}
            aria-label={`Question: ${questionDetail ?? question}`}
            tabIndex={focusId === "q" ? 0 : -1}
            onFocus={() => setActive("q")}
          >
            {question}
          </div>

          <div role="tree" aria-label="Thoughts" onKeyDown={onKeyDown} style={{ display: "contents" }}>
            {visible.map(({ n, st }) => (
              <div
                key={n.id}
                ref={(el) => {
                  nodeRefs.current[n.id] = el
                }}
                className="rtr-node"
                role="treeitem"
                aria-level={n.depth + 1}
                aria-posinset={n.idx + 1}
                aria-setsize={n.size}
                aria-label={`${n.label}. ${n.text}${st >= 2 ? ` Score ${Math.round(n.score * 100)} out of 100.` : ""} ${stateName(st)}.`}
                tabIndex={focusId === n.id ? 0 : -1}
                data-st={st}
                style={{ left: n.x, top: n.y - n.h / 2, height: n.h }}
                onFocus={() => {
                  setActive(n.id)
                  setTip(n.id)
                }}
                onBlur={() => setTip((c) => (c === n.id ? null : c))}
                onMouseEnter={() => setTip(n.id)}
                onMouseLeave={() => setTip((c) => (c === n.id ? null : c))}
              >
                <b>{n.label}</b>
                {st >= 2 && <span className="rtr-sc" style={{ "--v": Math.round(n.score * 100) } as React.CSSProperties} aria-hidden />}
                {st >= 2 && (
                  <span className="rtr-bar" aria-hidden>
                    <i style={{ "--s": n.score } as React.CSSProperties} />
                  </span>
                )}
              </div>
            ))}
          </div>

          {tipNode && (
            <div
              key={tipNode.id}
              className="rtr-tip"
              aria-hidden
              style={{
                left: Math.min(W - 224, Math.max(12, tipNode.x - 34)),
                top: tipNode.y < 170 ? tipNode.y + tipNode.h / 2 + 8 : undefined,
                bottom: tipNode.y < 170 ? undefined : H - (tipNode.y - tipNode.h / 2) + 8,
              }}
            >
              <b>{tipNode.label}</b>
              <span>{tipNode.text}</span>
              {stageOfId(tipI) >= 2 && (
                <em>
                  Score {Math.round(tipNode.score * 100)} · {stateName(stageOfId(tipI))}
                </em>
              )}
            </div>
          )}

          <div className="rtr-ans" data-on={snap.answer || reduced || undefined} aria-live="polite">
            <span className="rtr-ans-ic" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
              </svg>
            </span>
            <span className="rtr-ans-t">{snap.answer || reduced ? pl.answer.text : ""}</span>
            <span className="rtr-ans-p">{pl.answer.path.length > 0 && (snap.answer || reduced) ? `${nDepth} levels` : ""}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

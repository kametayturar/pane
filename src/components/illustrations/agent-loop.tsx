"use client"

import * as React from "react"
import { BookOpen, Check, ShieldCheck, Sparkles, Wrench, X } from "lucide-react"

/**
 * AgentLoop – an explainer of the agent loop: gather context, take action, verify, repeat.
 * A head travels clockwise around a ring past three stations while tool calls and checks land in a stack.
 * It plays sample data on a loop; nothing calls a real service.
 *
 *   <AgentLoop task="Work out why card payments in Europe are failing, then brief the team." />
 */

export type AgentLoopCall = {
  /** Tool name, e.g. "search_logs". */
  name: string
  /** Arguments shown under the name, e.g. `region: "EU"`. */
  args?: string
  /** Set to false to end the call with a cross. Default true. */
  ok?: boolean
}

export type AgentLoopIteration = {
  /** Context blocks pulled in at the first station. `tokens` is added to the counter. */
  gather: { label: string; tokens?: number }[]
  /** Tool calls made at the second station. */
  calls: AgentLoopCall[]
  /** The check at the third station. A failed check sends the loop around again. */
  verify: { label: string; ok?: boolean }
}

export type AgentLoopProps = {
  /** The loops to play, in order. An empty array shows a resting ring. */
  iterations?: AgentLoopIteration[]
  /** Caption while the loop runs. */
  task?: string
  /** Caption once it ends. Defaults to a count of loops and calls. */
  summary?: string
  /** Model label in the middle of the ring. `null` shows only the token counter. */
  model?: string | null
  /** Card title. */
  title?: string
  /** Station names, about two words each. */
  stationLabels?: [string, string, string]
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for the head, trail and active stations. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

export const DEFAULT_AGENT_LOOP: AgentLoopIteration[] = [
  {
    gather: [
      { label: "Checkout error log, EU", tokens: 820 },
      { label: "Payment provider status", tokens: 340 },
    ],
    calls: [{ name: "search_logs", args: 'region: "EU"' }],
    verify: { label: "Spike at 14:02, no cause", ok: false },
  },
  {
    gather: [
      { label: "Deploy history since 14:00", tokens: 460 },
      { label: "3-D Secure settings", tokens: 610 },
    ],
    calls: [
      { name: "list_deploys", args: 'since: "14:00"' },
      { name: "diff_config", args: 'key: "3ds"' },
    ],
    verify: { label: "Rule change, unconfirmed", ok: false },
  },
  {
    gather: [{ label: "Rule change diff", tokens: 380 }],
    calls: [
      { name: "replay_declines", args: "sample: 50" },
      { name: "post_message", args: "#payments" },
    ],
    verify: { label: "Replay passes, team told" },
  },
]

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 420
const CX = 172
const CY = 248
const R = 96
const STATION_ANGLES = [-90, 30, 150] as const
const STATION_ICONS = [BookOpen, Wrench, ShieldCheck]
const CIRC = 2 * Math.PI * R
const rad = (deg: number) => (deg * Math.PI) / 180
const ptAt = (deg: number) => ({ x: CX + R * Math.cos(rad(deg)), y: CY + R * Math.sin(rad(deg)) })

/* -------------------------------------------------------------------------- */
/*                                   Script                                   */
/* -------------------------------------------------------------------------- */

type Item = {
  id: string
  kind: "context" | "call" | "check"
  text: string
  sub?: string
  state: "run" | "ok" | "fail"
}
type LoopView = { n: number; items: Item[]; collapsed: boolean }
type View = { station: number; loops: LoopView[]; done: boolean; fade: boolean }
type Op =
  | { op: "station"; i: number }
  | { op: "loop" }
  | { op: "add"; item: Item }
  | { op: "res"; id: string; ok: boolean }
  | { op: "done" }
  | { op: "fade" }
type Step = { at: number; op: Op }
type Move = { t0: number; t1: number; a0: number; a1: number }
type Ramp = { t0: number; t1: number; from: number; to: number }
type Script = { steps: Step[]; moves: Move[]; ramps: Ramp[]; period: number; doneAt: number; calls: number; allOk: boolean }

const TRAVEL = 900
const EMPTY: View = { station: -1, loops: [], done: false, fade: false }

/** Turns the iterations into a timeline: discrete steps, head moves and token ramps, all in virtual ms. */
function build(iterations: AgentLoopIteration[]): Script {
  const steps: Step[] = []
  const moves: Move[] = []
  const ramps: Ramp[] = []
  let t = 500
  let angle: number = STATION_ANGLES[0]
  let tokens = 0
  let calls = 0
  const push = (at: number, op: Op) => steps.push({ at, op })
  const arrive = (idx: number, first: boolean) => {
    if (!first) {
      const target = angle + ((((STATION_ANGLES[idx] - angle) % 360) + 360) % 360)
      moves.push({ t0: t, t1: t + TRAVEL, a0: angle, a1: target })
      angle = target
      t += TRAVEL
    }
    push(t, { op: "station", i: idx })
  }
  iterations.forEach((it, n) => {
    push(t, { op: "loop" })
    arrive(0, n === 0)
    t += 250
    it.gather.forEach((g, k) => {
      push(t, { op: "add", item: { id: `${n}g${k}`, kind: "context", text: g.label, sub: g.tokens ? `+${g.tokens.toLocaleString("en-US")} tokens` : undefined, state: "ok" } })
      if (g.tokens) {
        ramps.push({ t0: t, t1: t + 600, from: tokens, to: tokens + g.tokens })
        tokens += g.tokens
      }
      t += 520
    })
    t += 380
    arrive(1, false)
    t += 250
    it.calls.forEach((c, k) => {
      const id = `${n}c${k}`
      calls++
      push(t, { op: "add", item: { id, kind: "call", text: c.name, sub: c.args, state: "run" } })
      push(t + 950, { op: "res", id, ok: c.ok !== false })
      const add = 90 + (k % 3) * 20
      ramps.push({ t0: t + 950, t1: t + 1350, from: tokens, to: tokens + add })
      tokens += add
      t += 700
    })
    t += 700
    arrive(2, false)
    t += 250
    push(t, { op: "add", item: { id: `${n}v`, kind: "check", text: it.verify.label, state: "run" } })
    push(t + 900, { op: "res", id: `${n}v`, ok: it.verify.ok !== false })
    t += 1500
  })
  const allOk = iterations.length === 0 || iterations[iterations.length - 1].verify.ok !== false
  const doneAt = t
  if (iterations.length) push(doneAt, { op: "done" })
  const hold = iterations.length ? 3600 : 4000
  push(doneAt + hold, { op: "fade" })
  return { steps, moves, ramps, period: doneAt + hold + 500, doneAt, calls, allOk }
}

function reduce(v: View, op: Op): View {
  switch (op.op) {
    case "station":
      return { ...v, station: op.i }
    case "loop": {
      const loops = v.loops.map((l) => (l.collapsed ? l : { ...l, collapsed: true }))
      return { ...v, loops: [...loops, { n: loops.length + 1, items: [], collapsed: false }] }
    }
    case "add": {
      const loops = v.loops.slice()
      const last = loops[loops.length - 1]
      loops[loops.length - 1] = { ...last, items: [...last.items, op.item] }
      return { ...v, loops }
    }
    case "res":
      return {
        ...v,
        loops: v.loops.map((l) => ({ ...l, items: l.items.map((it) => (it.id === op.id ? { ...it, state: op.ok ? "ok" : "fail" } : it)) })),
      }
    case "done":
      return { ...v, done: true, station: -1 }
    case "fade":
      return { ...v, fade: true }
  }
}

function viewAt(steps: Step[], count: number): View {
  let v = EMPTY
  for (let i = 0; i < count; i++) v = reduce(v, steps[i].op)
  return v
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.agl {
  --agl-ink: #000;
  --agl-surface: #fff;
  --agl-accent: #0060e2;
  --agl-green: #1fa85a;
  --agl-red: #e5484d;
  --agl-speed: 1;
  --agl-scale: 1;
  --agl-t1: color-mix(in oklab, var(--agl-ink) 88%, transparent);
  --agl-t2: color-mix(in oklab, var(--agl-ink) 61%, transparent);
  --agl-t3: color-mix(in oklab, var(--agl-ink) 45%, transparent);
  --agl-t4: color-mix(in oklab, var(--agl-ink) 27%, transparent);
  --agl-fill: color-mix(in oklab, var(--agl-ink) 4.5%, transparent);
  --agl-line: color-mix(in oklab, var(--agl-ink) 7%, transparent);
  --agl-rail: color-mix(in oklab, var(--agl-ink) 9%, transparent);
  --agl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --agl-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 14px 32px -12px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --agl-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--agl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left; color: var(--agl-t1);
}
:is(.dark, [data-theme="dark"]) .agl {
  --agl-ink: #fff; --agl-surface: #1c1c1e; --agl-accent: #4d8dff; --agl-green: #34d27b; --agl-red: #ff6369;
  --agl-t1: color-mix(in oklab, var(--agl-ink) 90%, transparent);
  --agl-t2: color-mix(in oklab, var(--agl-ink) 62%, transparent);
  --agl-t3: color-mix(in oklab, var(--agl-ink) 46%, transparent);
  --agl-t4: color-mix(in oklab, var(--agl-ink) 28%, transparent);
  --agl-fill: color-mix(in oklab, var(--agl-ink) 6%, transparent);
  --agl-line: color-mix(in oklab, var(--agl-ink) 9%, transparent);
  --agl-rail: color-mix(in oklab, var(--agl-ink) 14%, transparent);
  --agl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --agl-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 32px -12px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.agl *, .agl *::before, .agl *::after { box-sizing: border-box }
.agl-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--agl-scale));
  border-radius: 18px; background: var(--agl-surface); box-shadow: var(--agl-float); overflow: hidden }
.agl-body { position: absolute; inset: 0; transition: opacity calc(.45s / var(--agl-speed)) ease }
.agl[data-fade] .agl-body { opacity: 0 }

/* Header */
.agl-head { position: absolute; left: 24px; right: 24px; top: 20px; display: flex; align-items: center; gap: 10px; height: 24px }
.agl-mark { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; color: var(--agl-accent);
  background: color-mix(in oklab, var(--agl-accent) 12%, transparent) }
.agl-mark svg { width: 13px; height: 13px; stroke-width: 2.2 }
.agl-title { flex: 1; font-size: 14px; font-weight: 500; letter-spacing: -.005em }
.agl-status { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 10px 0 8px; border-radius: 11px;
  font-size: 11.5px; line-height: 22px; font-weight: 500; color: var(--agl-t2); background: var(--agl-fill) }
.agl-status i { width: 6px; height: 6px; border-radius: 50%; background: var(--agl-t4); transition: background-color .3s }
.agl-status[data-s="run"] i { background: var(--agl-accent); animation: agl-pulse calc(1s / var(--agl-speed)) ease-in-out infinite alternate }
.agl-status[data-s="done"] i { background: var(--agl-green) }
.agl-status[data-s="stop"] i { background: var(--agl-t3) }
.agl-cap { position: absolute; left: 24px; right: 24px; top: 48px; height: 20px; font-size: 12.5px; color: var(--agl-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.agl-cap span { display: block; overflow: hidden; text-overflow: ellipsis; animation: agl-text calc(.5s / var(--agl-speed)) var(--agl-ease) backwards }
.agl-rule { position: absolute; left: 0; right: 0; top: 80px; height: 1px; background: var(--agl-line) }
.agl-vrule { position: absolute; left: 340px; top: 96px; bottom: 24px; width: 1px; background: var(--agl-line) }

/* Ring */
.agl-ring { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; pointer-events: none; overflow: visible }
.agl-ring circle, .agl-ring path { fill: none }
.agl-track { stroke: var(--agl-rail); stroke-width: 2 }
.agl-chev { stroke: var(--agl-t4); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round }
.agl-trail { stroke: var(--agl-accent); stroke-width: 3; stroke-linecap: round; opacity: 0 }
.agl-done { stroke: var(--agl-green); stroke-width: 2.5; stroke-linecap: round; stroke-dasharray: ${CIRC.toFixed(1)}; stroke-dashoffset: ${CIRC.toFixed(1)}; opacity: 0 }
.agl[data-done] .agl-done { opacity: 1; stroke-dashoffset: 0; transition: stroke-dashoffset calc(1.1s / var(--agl-speed)) cubic-bezier(.5, 0, .2, 1) }
.agl[data-done="stop"] .agl-done { stroke: var(--agl-t3) }
.agl-head-dot { fill: var(--agl-accent) }
.agl-head-glow { fill: color-mix(in oklab, var(--agl-accent) 22%, transparent) }
.agl-hd { transition: opacity .3s }
.agl[data-done] .agl-hd, .agl[data-done] .agl-trail { opacity: 0 !important }

/* Stations */
.agl-st { position: absolute; width: 0; height: 0 }
.agl-node { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
  color: var(--agl-t3); background: var(--agl-surface); box-shadow: 0 0 0 1px var(--agl-rail), 0 1px 2px rgb(0 0 0 / .05); transition: color .35s, background-color .35s, box-shadow .35s }
.agl-node svg { width: 19px; height: 19px; stroke-width: 1.8 }
.agl-st[data-on] .agl-node { color: #fff; background: var(--agl-accent); box-shadow: inset 0 1px 0 rgb(255 255 255 / .3), 0 0 0 1px color-mix(in oklab, var(--agl-accent) 80%, #000), 0 8px 18px -6px color-mix(in oklab, var(--agl-accent) 60%, transparent);
  animation: agl-settle calc(.6s / var(--agl-speed)) var(--agl-ease) }
.agl-st[data-on] .agl-node::after { content: ""; position: absolute; inset: 0; border-radius: inherit; animation: agl-ring calc(.9s / var(--agl-speed)) var(--agl-ease) }
.agl[data-done="ok"] .agl-node { color: var(--agl-green) }
.agl-lab { position: absolute; left: -70px; width: 140px; text-align: center; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--agl-t3); transition: color .35s }
.agl-lab[data-side="top"] { top: -46px }
.agl-lab[data-side="bot"] { top: 29px }
.agl-st[data-on] .agl-lab { color: var(--agl-t1) }
.agl-lab span { position: relative; display: inline-block }
.agl-st[data-on] .agl-lab span::after { content: attr(data-t); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, rgb(255 255 255 / .85) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: agl-sweep calc(1.8s / var(--agl-speed)) linear infinite }

/* Center */
.agl-core { position: absolute; left: ${CX - 62}px; top: ${CY - 38}px; width: 124px; height: 76px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px }
.agl-model { display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px; border-radius: 10px; background: var(--agl-fill); font-size: 11px; font-weight: 500; color: var(--agl-t2) }
.agl-model svg { width: 11px; height: 11px; color: var(--agl-accent) }
.agl-tok { font-size: 26px; line-height: 30px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--agl-t1) }
.agl-tokl { font-size: 11px; line-height: 14px; color: var(--agl-t3) }

/* Stack */
.agl-stack { position: absolute; left: 360px; top: 96px; width: 256px; bottom: 24px; display: flex; flex-direction: column; gap: 6px; overflow: hidden }
.agl-stack-h { flex: none; display: flex; align-items: center; justify-content: space-between; height: 16px; margin-bottom: 2px; font-size: 10.5px; line-height: 16px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; color: var(--agl-t3) }
.agl-empty { margin: auto 0; font-size: 12.5px; color: var(--agl-t4); text-align: center }
.agl-sum { flex: none; display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 10px; border-radius: 8px; font-size: 11.5px; color: var(--agl-t3); background: var(--agl-fill);
  animation: agl-in calc(.45s / var(--agl-speed)) var(--agl-ease) backwards }
.agl-sum b { font-weight: 500; color: var(--agl-t2) }
.agl-sum svg { flex: none; width: 12px; height: 12px; stroke-width: 2.4 }
.agl-sum[data-ok="true"] svg { color: var(--agl-green) }
.agl-sum[data-ok="false"] svg { color: var(--agl-red) }
.agl-sum span { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.agl-row { position: relative; flex: none; display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 6px 10px 6px 8px; border-radius: 10px; background: var(--agl-surface); box-shadow: var(--agl-shadow);
  animation: agl-in calc(.55s / var(--agl-speed)) var(--agl-ease) backwards }
.agl-row[data-kind="call"] { animation-name: agl-drop }
.agl-row[data-kind="call"]::before { content: ""; position: absolute; right: 100%; top: 50%; width: 22px; height: 1.5px; margin-right: 4px; border-radius: 1px; background: linear-gradient(90deg, transparent, var(--agl-accent)); transform-origin: 100% 50%; animation: agl-pin calc(.6s / var(--agl-speed)) var(--agl-ease) backwards }
.agl-ic { position: relative; flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; color: var(--agl-t2); background: var(--agl-fill) }
.agl-ic svg { width: 13px; height: 13px; stroke-width: 2 }
.agl-row[data-kind="call"] .agl-ic { color: var(--agl-accent); background: color-mix(in oklab, var(--agl-accent) 11%, transparent) }
.agl-tx { flex: 1; min-width: 0 }
.agl-tx b { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; font-size: 12.5px; line-height: 16px; font-weight: 500; overflow: hidden }
.agl-tx em { display: block; font-style: normal; font-size: 11px; line-height: 14px; color: var(--agl-t3); overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.agl-row[data-kind="call"] .agl-tx em { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10.5px }
.agl-res { position: relative; flex: none; width: 18px; height: 18px }
.agl-res > * { position: absolute; inset: 0; margin: auto; transition: opacity .25s, transform .4s var(--agl-ease) }
.agl-spin { width: 13px; height: 13px; border-radius: 50%; border: 1.8px solid var(--agl-rail); border-top-color: var(--agl-accent); animation: agl-rot calc(.8s / var(--agl-speed)) linear infinite }
.agl-ok, .agl-no { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: #fff; opacity: 0; transform: scale(.5) }
.agl-ok { background: var(--agl-green) }
.agl-no { background: var(--agl-red) }
.agl-ok svg, .agl-no svg { width: 11px; height: 11px; stroke-width: 3 }
.agl-row[data-state="ok"] .agl-spin, .agl-row[data-state="fail"] .agl-spin { opacity: 0; transform: scale(.5) }
.agl-row[data-state="ok"] .agl-ok, .agl-row[data-state="fail"] .agl-no { opacity: 1; transform: none }
.agl-row[data-kind="context"] .agl-res { display: none }

@keyframes agl-in { from { opacity: 0; transform: translateY(8px) scale(.98); filter: blur(3px) } }
@keyframes agl-drop { from { opacity: 0; transform: translate(-30px, -8px) scale(.94); filter: blur(3px) } }
@keyframes agl-pin { from { transform: scaleX(0); opacity: 0 } 40% { opacity: 1 } to { transform: scaleX(1); opacity: 0 } }
@keyframes agl-text { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes agl-settle { 0% { transform: scale(.9) } 100% { transform: scale(1) } }
@keyframes agl-ring { from { box-shadow: 0 0 0 0 color-mix(in oklab, var(--agl-accent) 45%, transparent) } to { box-shadow: 0 0 0 12px color-mix(in oklab, var(--agl-accent) 0%, transparent) } }
@keyframes agl-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes agl-rot { to { transform: rotate(360deg) } }
@keyframes agl-pulse { from { opacity: .35; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }

.agl[data-paused] *, .agl[data-paused] *::before, .agl[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .agl *, .agl *::before, .agl *::after { animation: none !important; transition: none !important }
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

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function AgentLoop({
  iterations = DEFAULT_AGENT_LOOP,
  task = "Work out why card payments in Europe are failing, then brief the team.",
  summary,
  model = "Nova",
  title = "Agent loop",
  stationLabels = ["Gather context", "Take action", "Verify"],
  speed = 1,
  paused = false,
  accent,
  label = "An agent loops through gathering context, taking action and verifying, until the task is done",
  className,
}: AgentLoopProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const headRef = React.useRef<SVGGElement>(null)
  const trailRef = React.useRef<SVGCircleElement>(null)
  const tokRef = React.useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const script = React.useMemo(() => build(iterations), [iterations])
  const [count, setCount] = React.useState(0)
  const live = React.useRef({ speed, paused, count: 0 })
  React.useEffect(() => {
    live.current.speed = speed
    live.current.paused = paused
  })

  // Scale the fixed stage to the container.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--agl-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // One clock: virtual time t advances with speed and stops while paused or offscreen.
  // React only hears about discrete steps; the head, trail and token count are written straight to the DOM.
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 })
    io.observe(root)
    let raf = 0
    let last = 0
    let t = 0
    const draw = () => {
      const tt = reduced ? script.doneAt + 100 : t
      let n = 0
      while (n < script.steps.length && script.steps[n].at <= tt) n++
      if (n !== live.current.count) {
        live.current.count = n
        setCount(n)
      }
      let a: number = STATION_ANGLES[0]
      let trail = 0
      for (const m of script.moves) {
        if (tt >= m.t1) a = m.a1
        else if (tt >= m.t0) {
          const p = (tt - m.t0) / (m.t1 - m.t0)
          a = m.a0 + (m.a1 - m.a0) * easeInOut(p)
          trail = Math.sin(Math.PI * p) * 64
          break
        }
      }
      const pt = ptAt(a)
      headRef.current?.setAttribute("transform", `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`)
      const tr = trailRef.current
      if (tr) {
        const len = (trail / 360) * CIRC
        const s = ((((a + 90) % 360) + 360) % 360) / 360 * CIRC
        tr.style.opacity = trail > 1 ? "1" : "0"
        tr.setAttribute("stroke-dasharray", `${len.toFixed(1)} ${(CIRC - len).toFixed(1)}`)
        tr.setAttribute("stroke-dashoffset", String((((len - s) % CIRC) + CIRC) % CIRC))
      }
      let tok = 0
      for (const r of script.ramps) {
        if (tt >= r.t1) tok = r.to
        else if (tt >= r.t0) {
          const p = (tt - r.t0) / (r.t1 - r.t0)
          tok = r.from + (r.to - r.from) * (1 - Math.pow(1 - p, 3))
          break
        }
      }
      if (tokRef.current) tokRef.current.textContent = Math.round(tok).toLocaleString("en-US")
    }
    draw()
    if (!reduced) {
      const frame = (now: number) => {
        const dt = last ? Math.min(now - last, 64) : 0
        last = now
        if (!live.current.paused && visible && dt > 0) {
          t += dt * Math.max(0.05, live.current.speed)
          if (t >= script.period) t -= script.period
          draw()
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [script, reduced])

  const view = viewAt(script.steps, count)
  const total = iterations.length
  const stopped = view.done && !script.allOk
  const status = view.done ? (stopped ? "stop" : "done") : view.station >= 0 || view.loops.length ? "run" : "idle"
  const statusText = { idle: "Ready", run: "Running", done: "Done", stop: "Stopped" }[status]
  const endCaption =
    summary ??
    (stopped
      ? `Stopped after ${total} loops, the last check failed.`
      : `Done in ${total} ${total === 1 ? "loop" : "loops"} · ${script.calls} tool ${script.calls === 1 ? "call" : "calls"}`)
  const caption = view.done ? endCaption : task

  const vars = {
    ...(accent ? { "--agl-accent": accent } : null),
    "--agl-speed": Math.max(0.05, speed),
  } as React.CSSProperties

  const cur = view.loops.find((l) => !l.collapsed)
  const collapsed = view.loops.filter((l) => l.collapsed)
  const start = ptAt(-90)

  return (
    <div
      ref={rootRef}
      className={className ? `agl ${className}` : "agl"}
      role="img"
      aria-label={label}
      data-paused={paused || undefined}
      data-done={view.done ? (stopped ? "stop" : "ok") : undefined}
      data-fade={view.fade || undefined}
      style={vars}
    >
      <style href="pane-agent-loop" precedence="default">
        {CSS}
      </style>
      <div className="agl-stage" aria-hidden>
        <div className="agl-body">
          <div className="agl-head">
            <span className="agl-mark">
              <Sparkles />
            </span>
            <span className="agl-title">{title}</span>
            <span className="agl-status" data-s={status}>
              <i />
              {statusText}
            </span>
          </div>
          <div className="agl-cap">
            <span key={view.done ? "end" : "task"}>{caption}</span>
          </div>
          <div className="agl-rule" />
          <div className="agl-vrule" />

          <svg className="agl-ring" viewBox={`0 0 ${W} ${H}`}>
            <circle className="agl-track" cx={CX} cy={CY} r={R} />
            {[-30, 90, 210].map((a) => {
              const p = ptAt(a)
              return <path key={a} className="agl-chev" d="M-3.5 -4.5 L1.5 0 L-3.5 4.5" transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${a + 90})`} />
            })}
            <circle className="agl-done" cx={CX} cy={CY} r={R} transform={`rotate(-90 ${CX} ${CY})`} />
            <circle ref={trailRef} className="agl-trail" cx={CX} cy={CY} r={R} transform={`rotate(-90 ${CX} ${CY})`} strokeDasharray={`0 ${CIRC}`} />
            <g ref={headRef} className="agl-hd" transform={`translate(${start.x} ${start.y})`}>
              <circle className="agl-head-glow" r="11" />
              <circle className="agl-head-dot" r="5.5" />
            </g>
          </svg>

          {STATION_ANGLES.map((a, i) => {
            const p = ptAt(a)
            const Icon = STATION_ICONS[i]
            return (
              <div key={i} className="agl-st" style={{ left: p.x, top: p.y }} data-on={view.station === i || undefined}>
                <div className="agl-node">
                  <Icon />
                </div>
                <div className="agl-lab" data-side={i === 0 ? "top" : "bot"}>
                  <span data-t={stationLabels[i]}>{stationLabels[i]}</span>
                </div>
              </div>
            )
          })}

          <div className="agl-core">
            {model !== null && (
              <span className="agl-model">
                <Sparkles />
                {model}
              </span>
            )}
            <div className="agl-tok" ref={tokRef}>
              0
            </div>
            <div className="agl-tokl">tokens in context</div>
          </div>

          <div className="agl-stack">
            {collapsed.map((l) => {
              const last = l.items[l.items.length - 1]
              const ok = last?.state !== "fail"
              const calls = l.items.filter((it) => it.kind === "call").length
              return (
                <div key={`s${l.n}`} className="agl-sum" data-ok={ok}>
                  {ok ? <Check /> : <X />}
                  <span>
                    <b>Loop {l.n}</b> · {calls} {calls === 1 ? "call" : "calls"} · {ok ? "passed" : "check failed"}
                  </span>
                </div>
              )
            })}
            {cur ? (
              <>
                <div className="agl-stack-h">
                  <span>Loop {cur.n}</span>
                  <span>{cur.items.length > 0 ? `${cur.items.length} ${cur.items.length === 1 ? "step" : "steps"}` : ""}</span>
                </div>
                {cur.items.map((it) => {
                  const Icon = it.kind === "context" ? BookOpen : it.kind === "call" ? Wrench : ShieldCheck
                  return (
                    <div key={it.id} className="agl-row" data-kind={it.kind} data-state={it.state}>
                      <span className="agl-ic">
                        <Icon />
                      </span>
                      <span className="agl-tx">
                        <b>{it.text}</b>
                        {it.sub && <em>{it.sub}</em>}
                      </span>
                      <span className="agl-res">
                        <i className="agl-spin" />
                        <span className="agl-ok">
                          <Check />
                        </span>
                        <span className="agl-no">
                          <X />
                        </span>
                      </span>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="agl-empty">Tool calls and checks land here</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

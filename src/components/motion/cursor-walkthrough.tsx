"use client"

import * as React from "react"

import { rng, type StudioPieceProps } from "@/studio/schema"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type CursorKind = "arrow" | "ibeam"
export type CursorStyle = "arrow" | "large" | "touch"

/**
 * One beat of a walkthrough. Targets are names: the cursor looks for `[data-target="name"]` inside the piece, so a script
 * keeps working when the layout changes. `at` aims inside the target as [x, y] fractions (default the middle).
 */
export type WalkStep =
  | { do: "click"; on: string; at?: [number, number]; ms?: number; gap?: number }
  | { do: "type"; into: string; text: string; at?: [number, number]; ms?: number }
  | { do: "drag"; from: string; to: string; at?: [number, number]; toAt?: [number, number]; ms?: number }
  | { do: "move"; to: string; at?: [number, number]; ms?: number; gap?: number }
  | { do: "wait"; ms: number }

export type CursorWalkthroughProps = StudioPieceProps & {
  /** Steps for the cursor. Without `children` a booking card is shown with its own script. */
  script?: WalkStep[]
  /** Play again after the last step. Default true. */
  loop?: boolean
  /** Shape of the pointer. Default "arrow". */
  cursor?: CursorStyle
  /** A name tag that rides the cursor. */
  label?: string
  /** Built-in card: venue, the guest the cursor types, how many guests it picks and the time it drags to. */
  venue?: string
  guest?: string
  party?: number
  at?: string
  /** Your own content to walk through. Mark what the cursor touches with `data-target`. */
  children?: React.ReactNode
  /** Called when a non-looping script ends. */
  onComplete?: () => void
  /** Called once when a person touches the piece and the cursor leaves for good. */
  onInteract?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Timeline                                  */
/* -------------------------------------------------------------------------- */

type Pt = { x: number; y: number }
type Rect = { x: number; y: number; w: number; h: number; cursor?: CursorKind }
type Resolve = (name: string) => Rect | null
type Ev = { t: number; k: "hot" | "cold" | "down" | "up" | "click" | "focus" | "key"; target: string; n?: number; text?: string; drag?: boolean }
type Seg = { t0: number; t1: number; a: Pt; b: Pt; c: Pt; ka: CursorKind; kb: CursorKind; grab?: boolean }
export type Plan = { total: number; segs: Seg[]; evs: Ev[]; start: Pt }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** CSS-style cubic-bezier, solved with a few Newton steps. */
function cubic(a: number, b: number, c: number, d: number) {
  const cx = 3 * a
  const bx = 3 * (c - a) - cx
  const ax = 1 - cx - bx
  const cy = 3 * b
  const by = 3 * (d - b) - cy
  const ay = 1 - cy - by
  const X = (t: number) => ((ax * t + bx) * t + cx) * t
  const Y = (t: number) => ((ay * t + by) * t + cy) * t
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    let t = x
    for (let i = 0; i < 7; i++) {
      const e = X(t) - x
      const s = dX(t)
      if (Math.abs(e) < 1e-5 || !s) break
      t -= e / s
    }
    return Y(clamp(t, 0, 1))
  }
}
/** Travel has a departure, a clear run and a soft arrival; the UI itself uses the house curve. */
const TRAVEL = cubic(0.42, 0, 0.12, 1)

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
}

/**
 * Turns a script into a timeline: eased arcs between targets, presses, keystrokes and drags, all as times in ms.
 * It only reads `resolve`, so the page measures real elements and the Studio feeds it fixed geometry.
 */
export function buildPlan(steps: WalkStep[], resolve: Resolve, seed = 7): Plan {
  const rnd = rng(seed * 7 + 11)
  const segs: Seg[] = []
  const evs: Ev[] = []
  const aim = (name: string, at?: [number, number]) => {
    const r = resolve(name)
    return r ? { p: { x: r.x + r.w * (at?.[0] ?? 0.5), y: r.y + r.h * (at?.[1] ?? 0.5) }, kind: r.cursor ?? ("arrow" as CursorKind) } : null
  }
  const rest = resolve("rest")
  const firstName = steps.find((s) => s.do !== "wait")
  const firstPt = firstName ? aim("on" in firstName ? firstName.on : "into" in firstName ? firstName.into : "from" in firstName ? firstName.from : "to" in firstName ? firstName.to : "") : null
  let cur: Pt = rest ? { x: rest.x + rest.w / 2, y: rest.y + rest.h / 2 } : (firstPt?.p ?? { x: 0, y: 0 })
  const start = cur
  let kind: CursorKind = "arrow"
  let hot: string | null = null
  let t = 0
  let n = 0

  const travel = (name: string, at: [number, number] | undefined, ms: number | undefined, grab = false) => {
    const q = aim(name, at)
    if (!q) return false
    const d = Math.hypot(q.p.x - cur.x, q.p.y - cur.y)
    const dur = ms ?? (d < 3 ? 0 : clamp(380 + d * 1.05, 420, 1150))
    if (dur > 0 && d >= 3) {
      if (hot && !grab) {
        evs.push({ t, k: "cold", target: hot })
        hot = null
      }
      const sgn = (n++ % 2 ? 1 : -1) * (rnd() < 0.2 ? -1 : 1)
      const bend = Math.min(64, d * 0.16) * sgn
      const nx = -(q.p.y - cur.y) / d
      const ny = (q.p.x - cur.x) / d
      segs.push({
        t0: t,
        t1: t + dur,
        a: cur,
        b: q.p,
        c: { x: (cur.x + q.p.x) / 2 + nx * bend, y: (cur.y + q.p.y) / 2 + ny * bend },
        ka: kind,
        kb: grab ? kind : q.kind,
        grab,
      })
      t += dur
    }
    cur = q.p
    if (!grab) {
      kind = q.kind
      if (hot !== name) {
        if (hot) evs.push({ t, k: "cold", target: hot })
        hot = name
        evs.push({ t, k: "hot", target: name })
      }
    }
    return true
  }

  for (const s of steps) {
    if (s.do === "wait") {
      t += s.ms
    } else if (s.do === "move") {
      if (travel(s.to, s.at, s.ms)) t += s.gap ?? 200
    } else if (s.do === "click") {
      if (!travel(s.on, s.at, s.ms)) continue
      t += 110
      evs.push({ t, k: "down", target: s.on }, { t: t + 60, k: "click", target: s.on }, { t: t + 140, k: "up", target: s.on })
      t += 140 + (s.gap ?? 240)
    } else if (s.do === "type") {
      if (!travel(s.into, s.at, undefined)) continue
      t += 110
      evs.push({ t, k: "down", target: s.into }, { t: t + 30, k: "focus", target: s.into }, { t: t + 120, k: "up", target: s.into })
      t += 120 + 300
      const len = Array.from(s.text).length
      const w = Array.from({ length: len }, () => 0.7 + rnd() * 0.6)
      const sum = w.reduce((a, b) => a + b, 0)
      const chars = Array.from(s.text)
      for (let i = 0; i < len; i++) {
        t += ((s.ms ?? 1100) * w[i]) / sum
        evs.push({ t, k: "key", target: s.into, n: i + 1, text: chars.slice(0, i + 1).join("") })
      }
      t += 320
    } else if (s.do === "drag") {
      if (!travel(s.from, s.at, undefined)) continue
      t += 130
      evs.push({ t, k: "down", target: s.from, drag: true })
      t += 150
      travel(s.to, s.toAt, s.ms ?? 900, true)
      evs.push({ t, k: "up", target: s.to, drag: true })
      t += 280
    }
  }
  if (hot) evs.push({ t, k: "cold", target: hot })
  evs.sort((a, b) => a.t - b.t)
  return { total: t, segs, evs, start }
}

export type Sample = { x: number; y: number; kind: CursorKind; press: number; grab: boolean; ring: number; hot: string | null; fade: number }

/** Cursor state at time t (ms): position on its arc, which glyph, how deep the press is, how far the ring has spread. */
export function sample(plan: Plan, t: number): Sample {
  let pos = plan.start
  let kind: CursorKind = "arrow"
  let grab = false
  for (const s of plan.segs) {
    if (t >= s.t1) {
      pos = s.b
      kind = s.kb
      continue
    }
    if (t >= s.t0) {
      const p = (t - s.t0) / (s.t1 - s.t0)
      pos = quad(s.a, s.c, s.b, TRAVEL(p))
      kind = p >= 0.7 ? s.kb : s.ka
      grab = !!s.grab
    }
    break
  }
  let down = -1
  let up = -1
  let hot: string | null = null
  let ring = 1
  for (const e of plan.evs) {
    if (e.t > t) break
    if (e.k === "down") {
      down = e.t
      ring = (t - e.t) / 520
    }
    if (e.k === "up") up = e.t
    if (e.k === "hot") hot = e.target
    if (e.k === "cold" && hot === e.target) hot = null
  }
  const press = down > up ? Math.min(1, (t - down) / 80) : up >= 0 ? Math.max(0, 1 - (t - up) / 140) : 0
  return { x: pos.x, y: pos.y, kind, press, grab, ring: clamp(ring, 0, 1), hot, fade: clamp(t / 280, 0, 1) }
}

/* -------------------------------------------------------------------------- */
/*                                   Script                                   */
/* -------------------------------------------------------------------------- */

const SLOTS = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]
const MAXP = 8

/** Card geometry in px. The CSS below is written from these, and the Studio canvas draws from the same numbers. */
export const L = {
  w: 460,
  h: 380,
  padX: 24,
  col: 84,
  headY: 22,
  ruleY: 70,
  nameY: 86,
  guestY: 138,
  timeY: 190,
  trackY: 248,
  footY: 300,
  btnY: 318,
  slotX0: 118,
  slotStep: 44,
}

const defaultScript = (guest: string, party: number, at: string): WalkStep[] => {
  const idx = Math.max(0, SLOTS.indexOf(at))
  return [
    { do: "type", into: "name", text: guest, at: [0.88, 0.7], ms: 1100 },
    ...Array.from({ length: Math.max(0, Math.min(MAXP, party) - 2) }, (): WalkStep => ({ do: "click", on: "plus", at: [0.7, 0.62], gap: 260 })),
    { do: "drag", from: "handle", to: `slot-${idx}`, ms: 900 },
    { do: "click", on: "reserve", at: [0.9, 0.62], ms: 640 },
    { do: "wait", ms: 300 },
    { do: "move", to: "settle", ms: 600, gap: 1400 },
    { do: "click", on: "change", at: [0.12, 0.72], ms: 640 },
    { do: "wait", ms: 500 },
    { do: "move", to: "rest", ms: 700, gap: 700 },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.cwk {
  --cwk-ink: #000;
  --cwk-surface: #fff;
  --cwk-accent: #0060e2;
  --cwk-on: #fff;
  --cwk-cur: #111;
  --cwk-cur-edge: #fff;
  --cwk-t1: color-mix(in oklab, var(--cwk-ink) 88%, transparent);
  --cwk-t2: color-mix(in oklab, var(--cwk-ink) 61%, transparent);
  --cwk-t3: color-mix(in oklab, var(--cwk-ink) 45%, transparent);
  --cwk-t4: color-mix(in oklab, var(--cwk-ink) 27%, transparent);
  --cwk-fill: color-mix(in oklab, var(--cwk-ink) 6%, transparent);
  --cwk-fill2: color-mix(in oklab, var(--cwk-ink) 10%, transparent);
  --cwk-line: color-mix(in oklab, var(--cwk-ink) 6%, transparent);
  --cwk-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --cwk-ease: cubic-bezier(.22, 1, .36, 1);
  --cwk-pad: ${L.padX}px;
  position: relative; container-type: inline-size; width: 100%; max-width: 600px; padding: 28px 24px;
  font: 13px/20px var(--cwk-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--cwk-t1); -webkit-font-smoothing: antialiased; text-align: left; overflow: hidden;
}
:is(.dark, [data-theme="dark"]) .cwk {
  --cwk-ink: #fff;
  --cwk-surface: #1c1c1e;
  --cwk-accent: #4d8dff;
  --cwk-on: #111;
  --cwk-cur: #fff;
  --cwk-cur-edge: #111;
  --cwk-t1: color-mix(in oklab, var(--cwk-ink) 90%, transparent);
  --cwk-t2: color-mix(in oklab, var(--cwk-ink) 62%, transparent);
  --cwk-t3: color-mix(in oklab, var(--cwk-ink) 46%, transparent);
  --cwk-t4: color-mix(in oklab, var(--cwk-ink) 28%, transparent);
  --cwk-fill: color-mix(in oklab, var(--cwk-ink) 8%, transparent);
  --cwk-fill2: color-mix(in oklab, var(--cwk-ink) 13%, transparent);
  --cwk-line: color-mix(in oklab, var(--cwk-ink) 9%, transparent);
  --cwk-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .cwk {
  --cwk-ink: #000; --cwk-surface: #fff; --cwk-accent: #111; --cwk-on: #fff; --cwk-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --cwk-ease: cubic-bezier(.2, .9, .1, 1); --cwk-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .cwk { --cwk-ink: #fff; --cwk-surface: #0a0a0a; --cwk-accent: #f2f2f2; --cwk-on: #111; --cwk-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .cwk {
  --cwk-ink: var(--pane-ink); --cwk-surface: var(--pane-solid); --cwk-accent: var(--pane-accent); --cwk-on: #fff; --cwk-shadow: var(--pane-shadow);
  --cwk-ease: var(--pane-ease); --cwk-font: var(--pane-font);
  --cwk-t1: var(--pane-t1); --cwk-t2: var(--pane-t2); --cwk-t3: var(--pane-t3); --cwk-t4: var(--pane-t4);
}
html[data-style="glass"] .cwk-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .cwk-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .cwk-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .cwk-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.cwk *, .cwk *::before, .cwk *::after { box-sizing: border-box }
:where(.cwk) button, :where(.cwk) input { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0 }
:where(.cwk) button { cursor: pointer }
:where(.cwk) p { margin: 0 }
.cwk :is(button, input, [role="slider"]):focus-visible { outline: 2px solid var(--cwk-accent); outline-offset: 2px }
.cwk-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.cwk-rest { position: absolute; top: 14px; right: 18px; width: 2px; height: 2px; pointer-events: none }

/* The card */
.cwk-card { position: relative; width: 100%; max-width: ${L.w}px; margin: 0 auto; border-radius: 20px; background: var(--cwk-surface); box-shadow: var(--cwk-shadow); overflow: hidden }
.cwk-head { padding: 22px var(--cwk-pad) 0; height: ${L.ruleY}px; border-bottom: 1px solid var(--cwk-line) }
.cwk-venue { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--cwk-t1) }
.cwk-date { color: var(--cwk-t3) }
.cwk-rows { display: block }
.cwk-rows[data-in] { animation: cwk-in .42s var(--cwk-ease) backwards }
.cwk-row { position: relative; display: flex; align-items: flex-start; padding: 0 var(--cwk-pad); transition: opacity .28s var(--cwk-ease), filter .28s var(--cwk-ease) }
.cwk-rows[data-done] .cwk-row { opacity: .55 }
.cwk-label { flex: none; width: ${L.col}px; padding-top: 10px; font-weight: 500; color: var(--cwk-t2) }
.cwk-r-name { margin-top: ${L.nameY - L.ruleY - 1}px; height: 40px }
.cwk-r-guest { margin-top: 12px; height: 40px }
.cwk-r-time { margin-top: 12px; height: ${L.footY - L.timeY}px }
.cwk-field { flex: 1; min-width: 0; height: 40px; border-radius: 10px; padding: 0 12px; background: var(--cwk-fill); font-size: 15px; transition: background-color .16s var(--cwk-ease), box-shadow .16s var(--cwk-ease) }
.cwk-field::placeholder { color: var(--cwk-t4); opacity: 1 }
.cwk-field:hover, .cwk-field[data-hot] { background: var(--cwk-fill2) }
.cwk-field:focus-visible { outline: none; background: var(--cwk-surface); box-shadow: 0 0 0 1.5px var(--cwk-accent) }
.cwk-stepper { display: flex; align-items: center }
.cwk-step { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: var(--cwk-fill); color: var(--cwk-t1); transition: transform .16s var(--cwk-ease), background-color .16s var(--cwk-ease), opacity .16s var(--cwk-ease) }
.cwk-step:hover, .cwk-step[data-hot] { background: var(--cwk-fill2) }
.cwk-step:active, .cwk-step[data-pressed] { transform: scale(.94) }
.cwk-step:disabled { opacity: .35; pointer-events: none }
.cwk-count { position: relative; width: 48px; height: 40px; display: grid; place-items: center; font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums }
.cwk-count span { animation: cwk-roll .34s var(--cwk-ease) backwards }
.cwk-meta { margin-left: auto; padding-top: 10px; color: var(--cwk-t3); font-size: 12px; line-height: 20px }

/* Time: a readout, a track with eight stops, a handle that really drags */
.cwk-time { flex: 1; min-width: 0; position: relative; height: 100% }
.cwk-read { height: 28px; font-size: 22px; line-height: 28px; font-weight: 600; letter-spacing: -.01em; font-variant-numeric: tabular-nums; margin-top: 4px }
.cwk-read span { display: inline-block; animation: cwk-roll .22s var(--cwk-ease) backwards }
.cwk-track { position: absolute; left: 0; right: 0; top: ${L.trackY - L.timeY - 12}px; height: 24px; touch-action: none; cursor: pointer }
.cwk-rail { position: absolute; left: 10px; right: 10px; top: 10px; height: 4px; border-radius: 2px; background: var(--cwk-fill2) }
.cwk-fillbar { position: absolute; left: 10px; top: 10px; height: 4px; border-radius: 2px; background: var(--cwk-t3); width: calc((100% - 20px) * var(--p) / 7); transition: width .28s var(--cwk-ease) }
.cwk-stop { position: absolute; top: 2px; width: 20px; height: 20px; margin-left: -10px; left: calc(10px + (100% - 20px) * var(--i) / 7); pointer-events: none }
.cwk-stop::before { content: ""; position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px; border-radius: 50%; background: var(--cwk-t4) }
.cwk-handle {
  position: absolute; top: 2px; width: 20px; height: 20px; margin-left: -10px; left: calc(10px + (100% - 20px) * var(--p) / 7);
  border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .16), 0 1px 3px rgb(0 0 0 / .22), 0 3px 8px -2px rgb(0 0 0 / .14);
  transition: left .28s var(--cwk-ease), transform .16s var(--cwk-ease), box-shadow .16s var(--cwk-ease); cursor: grab; touch-action: none;
}
.cwk-handle[data-drag], .cwk-handle[data-pressed] { transform: scale(1.12); cursor: grabbing; transition: left 0s, transform .16s var(--cwk-ease), box-shadow .16s var(--cwk-ease) }
.cwk-handle[data-drag] { box-shadow: 0 0 0 .5px rgb(0 0 0 / .2), 0 2px 6px rgb(0 0 0 / .24), 0 6px 14px -2px rgb(0 0 0 / .18) }
.cwk-fillbar[data-drag] { transition: none }
.cwk-ticks { position: absolute; left: 0; right: 0; top: ${L.trackY - L.timeY + 16}px; height: 16px; font-size: 12px; line-height: 16px; color: var(--cwk-t3); font-variant-numeric: tabular-nums }
.cwk-ticks span { position: absolute; transform: translateX(-50%); white-space: nowrap; left: calc(10px + (100% - 20px) * var(--i) / 7) }

/* Footer: the button and the result share one cell, so the card never changes height */
.cwk-foot { display: grid; grid-template-columns: minmax(0, 1fr); height: ${L.h - L.footY}px; border-top: 1px solid var(--cwk-line) }
.cwk-layer { grid-area: 1 / 1; display: flex; align-items: center; padding: 0 var(--cwk-pad); opacity: 0; filter: blur(5px); pointer-events: none; transition: opacity .14s var(--cwk-ease), filter .14s var(--cwk-ease) }
.cwk-foot[data-phase="form"] .cwk-l-form, .cwk-foot[data-phase="done"] .cwk-l-done {
  opacity: 1; filter: none; pointer-events: auto; transition: opacity .36s var(--cwk-ease) .12s, filter .36s var(--cwk-ease) .12s;
}
.cwk-l-done > * { transition: transform .46s var(--cwk-ease) .12s; transform: translateY(6px) }
.cwk-foot[data-phase="done"] .cwk-l-done > * { transform: none }
.cwk-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 16px; border-radius: 12px; white-space: nowrap;
  font-size: 15px; font-weight: 500; transition: transform .16s var(--cwk-ease), background-color .16s var(--cwk-ease);
}
.cwk-btn:active, .cwk-btn[data-pressed] { transform: scale(.96) }
.cwk-go { width: 100%; background: var(--cwk-accent); color: var(--cwk-on); box-shadow: inset 0 1px 0 rgb(255 255 255 / .16), 0 0 0 .5px color-mix(in oklab, var(--cwk-accent) 60%, #000), 0 1px 2px color-mix(in oklab, var(--cwk-accent) 28%, transparent) }
.cwk-go:hover, .cwk-go[data-hot] { background: color-mix(in oklab, var(--cwk-accent) 88%, #000) }
.cwk-l-done { gap: 12px }
.cwk-seal { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--cwk-fill); color: var(--cwk-t1) }
.cwk-res { min-width: 0; display: flex; flex-direction: column }
.cwk-res-t { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; white-space: nowrap; color: var(--cwk-t1) }
.cwk-res-n { color: var(--cwk-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.cwk-settle { position: relative; flex: 1; align-self: stretch }
.cwk-settle i { position: absolute; left: 50%; top: 50%; width: 2px; height: 2px }
.cwk-change { flex: none; height: 36px; margin-right: -10px; padding: 0 10px; border-radius: 10px; font-weight: 500; color: var(--cwk-t2); transition: background-color .16s var(--cwk-ease), transform .16s var(--cwk-ease) }
.cwk-change:hover, .cwk-change[data-hot] { background: var(--cwk-fill) }
.cwk-change:active, .cwk-change[data-pressed] { transform: scale(.96) }

/* The cursor. One element moved with a transform; the glyph inside scales for the press. */
.cwk-cur { position: absolute; left: 0; top: 0; z-index: 5; width: 0; height: 0; pointer-events: none; opacity: 0; transition: opacity .28s var(--cwk-ease) }
.cwk-cur[data-on] { opacity: 1 }
.cwk-body { position: absolute; left: 0; top: 0; transform: scale(var(--cwk-s, 1)); transform-origin: 0 0; filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .32)) }
.cwk[data-cursor="large"] { --cwk-s: 1.45 }
.cwk-g { position: absolute; left: 0; top: 0; overflow: visible; transform-origin: 0 0; transition: opacity .16s var(--cwk-ease), transform .16s var(--cwk-ease) }
.cwk-ibeam { opacity: 0; transform: scale(.7) }
.cwk-cur[data-kind="ibeam"] .cwk-arrow { opacity: 0; transform: scale(.7) }
.cwk-cur[data-kind="ibeam"] .cwk-ibeam { opacity: 1; transform: none }
.cwk-cur[data-press] .cwk-g { transform: scale(.88) }
.cwk-cur[data-press][data-kind="ibeam"] .cwk-arrow { transform: scale(.6) }
.cwk-ring { position: absolute; left: -16px; top: -16px; width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--cwk-t3); opacity: 0 }
.cwk-dot { position: absolute; left: -15px; top: -15px; width: 30px; height: 30px; border-radius: 50%; background: color-mix(in oklab, var(--cwk-ink) 22%, transparent); box-shadow: 0 0 0 1px color-mix(in oklab, var(--cwk-ink) 30%, transparent); opacity: 0; transition: opacity .16s var(--cwk-ease), transform .16s var(--cwk-ease) }
.cwk[data-cursor="touch"] .cwk-body { filter: none }
.cwk[data-cursor="touch"] .cwk-g { display: none }
.cwk[data-cursor="touch"] .cwk-dot { opacity: 1 }
.cwk[data-cursor="touch"] .cwk-cur[data-press] .cwk-dot { transform: scale(.82) }
.cwk-tag { position: absolute; left: 14px; top: 22px; padding: 1px 8px; border-radius: 6px; background: var(--cwk-t1); color: var(--cwk-surface); font-size: 12px; line-height: 18px; font-weight: 500; white-space: nowrap }
.cwk[data-cursor="touch"] .cwk-tag { left: 20px; top: 12px }

@keyframes cwk-in { from { opacity: 0; filter: blur(4px); transform: translateY(4px) } }
@keyframes cwk-roll { from { opacity: 0; filter: blur(3px); transform: translateY(6px) } }

@container (max-width: 420px) {
  .cwk { padding: 16px 12px }
  .cwk-card { --cwk-pad: 18px }
  .cwk-label { width: 66px }
  .cwk-meta { display: none }
  .cwk-ticks span:nth-child(even) { visibility: hidden }
}
@media (pointer: coarse) { .cwk-change { height: 44px } }
@media (prefers-reduced-motion: reduce) {
  .cwk *, .cwk *::before, .cwk *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                            The built-in booking card                        */
/* -------------------------------------------------------------------------- */

function setInput(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, value)
  el.dispatchEvent(new Event("input", { bubbles: true }))
}

type SceneProps = { venue: string; guest: string; party: number; at: string; poster: boolean }

function Scene({ venue, guest, party, at, poster }: SceneProps) {
  const target = Math.max(0, SLOTS.indexOf(at))
  const [name, setName] = React.useState(poster ? guest : "")
  const [n, setN] = React.useState(poster ? Math.min(MAXP, party) : 2)
  const [pos, setPos] = React.useState(poster ? target : 1)
  const [drag, setDrag] = React.useState(false)
  const [done, setDone] = React.useState(poster)
  const [epoch, setEpoch] = React.useState(0)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const posRef = React.useRef(pos)
  const dragRef = React.useRef(false)
  const idx = Math.round(pos)

  const place = React.useCallback((p: number) => {
    const v = clamp(p, 0, 7)
    posRef.current = v
    setPos(v)
  }, [])
  const fromX = React.useCallback(
    (clientX: number) => {
      const r = trackRef.current?.getBoundingClientRect()
      if (!r) return
      place(((clientX - r.left - 10) / (r.width - 20)) * 7)
    },
    [place],
  )

  // The handle follows any pointer on the window while it is held, so a real drag and a scripted one are the same code path.
  React.useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => fromX(e.clientX)
    const end = () => {
      dragRef.current = false
      setDrag(false)
      place(Math.round(posRef.current))
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
    }
  }, [drag, fromX, place])

  const press = (e: React.PointerEvent) => {
    e.preventDefault()
    fromX(e.clientX)
    dragRef.current = true
    setDrag(true)
  }
  const keys = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0
    if (d) {
      e.preventDefault()
      place(Math.round(posRef.current) + d)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      place(e.key === "Home" ? 0 : 7)
    }
  }

  const reserve = () => setDone(true)
  const change = () => {
    setName("")
    setN(2)
    posRef.current = 1
    setPos(1)
    setDone(false)
    setEpoch((x) => x + 1)
  }
  const who = name.trim() || "Guest"

  return (
    <div className="cwk-card" data-card>
      <div className="cwk-head">
        <p className="cwk-venue">{venue}</p>
        <p className="cwk-date">Thursday 14 May · Dinner</p>
      </div>
      <div key={epoch} className="cwk-rows" data-done={done ? "" : undefined} data-in={epoch ? "" : undefined} inert={done}>
        <div className="cwk-row cwk-r-name">
          <label className="cwk-label" htmlFor="cwk-name">
            Name
          </label>
          <input
            id="cwk-name"
            className="cwk-field"
            data-target="name"
            data-cursor="ibeam"
            value={name}
            maxLength={28}
            placeholder="Guest name"
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reserve()}
          />
        </div>
        <div className="cwk-row cwk-r-guest">
          <span className="cwk-label" id="cwk-guests">
            Guests
          </span>
          <div className="cwk-stepper" role="group" aria-labelledby="cwk-guests">
            <button type="button" className="cwk-step" data-target="minus" aria-label="Fewer guests" disabled={n <= 1} onClick={() => setN((x) => Math.max(1, x - 1))}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <path d="M3 7h8" />
              </svg>
            </button>
            <div className="cwk-count" aria-live="polite">
              <span key={n}>{n}</span>
            </div>
            <button type="button" className="cwk-step" data-target="plus" aria-label="More guests" disabled={n >= MAXP} onClick={() => setN((x) => Math.min(MAXP, x + 1))}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <path d="M3 7h8M7 3v8" />
              </svg>
            </button>
          </div>
          <span className="cwk-meta">Up to {MAXP}</span>
        </div>
        <div className="cwk-row cwk-r-time">
          <span className="cwk-label" id="cwk-time">
            Time
          </span>
          <div className="cwk-time">
            <div className="cwk-read" aria-hidden>
              <span key={idx}>{SLOTS[idx]}</span>
            </div>
            <div className="cwk-track" ref={trackRef} style={{ "--p": pos } as React.CSSProperties} onPointerDown={press}>
              <div className="cwk-rail" />
              <div className="cwk-fillbar" data-drag={drag ? "" : undefined} />
              {SLOTS.map((s, i) => (
                <span key={s} className="cwk-stop" data-target={`slot-${i}`} style={{ "--i": i } as React.CSSProperties} />
              ))}
              <div
                className="cwk-handle"
                data-target="handle"
                data-drag={drag ? "" : undefined}
                role="slider"
                tabIndex={0}
                aria-labelledby="cwk-time"
                aria-valuemin={0}
                aria-valuemax={7}
                aria-valuenow={idx}
                aria-valuetext={SLOTS[idx]}
                onKeyDown={keys}
              />
            </div>
            <div className="cwk-ticks" aria-hidden>
              {[0, 2, 4, 6].map((i) => (
                <span key={i} style={{ "--i": i } as React.CSSProperties}>
                  {SLOTS[i]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cwk-foot" data-phase={done ? "done" : "form"} aria-live="polite">
        <div className="cwk-layer cwk-l-form" inert={done}>
          <button type="button" className="cwk-btn cwk-go" data-target="reserve" onClick={reserve}>
            Reserve table
          </button>
        </div>
        <div className="cwk-layer cwk-l-done" inert={!done}>
          <span className="cwk-seal" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 8.4 6.6 11.5 12.5 5" />
            </svg>
          </span>
          <div className="cwk-res">
            <span className="cwk-res-t">
              Table for {n} · {SLOTS[idx]}
            </span>
            <span className="cwk-res-n">Held under {who}</span>
          </div>
          <span className="cwk-settle" aria-hidden>
            <i data-target="settle" />
          </span>
          <button type="button" className="cwk-change" data-target="change" onClick={change}>
            Change
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 The component                              */
/* -------------------------------------------------------------------------- */

const GLYPH_ARROW = "M0 0 L0 15.5 L4.2 11.8 L6.9 17.8 L9.3 16.7 L6.6 10.9 L12 10.9 Z"

function Cursor({ curRef, ringRef, label }: { curRef: React.Ref<HTMLDivElement>; ringRef: React.Ref<HTMLSpanElement>; label?: string }) {
  return (
    <div className="cwk-cur" ref={curRef} aria-hidden>
      <div className="cwk-body">
        <span className="cwk-ring" ref={ringRef} />
        <span className="cwk-dot" />
        <svg className="cwk-g cwk-arrow" width="14" height="20" viewBox="0 0 14 20">
          <path d={GLYPH_ARROW} fill="var(--cwk-cur)" stroke="var(--cwk-cur-edge)" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        <svg className="cwk-g cwk-ibeam" width="8" height="18" viewBox="0 0 8 18" style={{ left: -4, top: -9, transformOrigin: "4px 9px" }}>
          <path d="M1.5 1h5M4 1v16M1.5 17h5" fill="none" stroke="var(--cwk-cur-edge)" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M1.5 1h5M4 1v16M1.5 17h5" fill="none" stroke="var(--cwk-cur)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {label ? <span className="cwk-tag">{label}</span> : null}
      </div>
    </div>
  )
}

/** Text colour that reads on an accent given as #rgb or #rrggbb; undefined for any other colour syntax. */
function onColor(c: string): string | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c.trim())
  if (!m) return undefined
  const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? "#111" : "#fff"
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const str = (v: unknown, d: string) => (typeof v === "string" && v ? v : d)
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)

export function CursorWalkthrough(props: CursorWalkthroughProps) {
  if (props.size || props.time !== undefined) return <WalkCanvas {...props} />
  return <WalkDom {...props} />
}

function WalkDom(props: CursorWalkthroughProps) {
  const { values: v = {}, speed = 1, paused = false, accent, seed = 7, script, loop = true, children, className, onComplete, onInteract } = props
  const cursorStyle = (str(v.cursor, props.cursor ?? "arrow") as CursorStyle)
  const label = typeof v.label === "string" ? v.label || undefined : props.label
  const venue = str(v.venue, props.venue ?? "Harbor & Finch")
  const guest = str(v.guest, props.guest ?? "Ines Marlow")
  const party = num(v.party, props.party ?? 4)
  const at = str(v.at, props.at ?? "19:30")
  const builtIn = children === undefined

  const steps = React.useMemo(() => script ?? (builtIn ? defaultScript(guest, party, at) : null), [script, builtIn, guest, party, at])
  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )
  const [stopped, setStopped] = React.useState(false)
  const [active, setActive] = React.useState(false)
  const [poster] = React.useState(() => prefersReduced())

  const rootRef = React.useRef<HTMLDivElement>(null)
  const curRef = React.useRef<HTMLDivElement>(null)
  const ringRef = React.useRef<HTMLSpanElement>(null)
  const st = React.useRef({ t: 0, idx: 0, drag: false, busy: false, hot: new Set<string>() })
  const cb = React.useRef({ onComplete, onInteract })
  React.useEffect(() => {
    cb.current = { onComplete, onInteract }
  })

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  // The first real touch ends the demo for good. Events the walkthrough sends itself are never trusted or are flagged busy.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || stopped) return
    const stop = (e: Event) => {
      if (!e.isTrusted || st.current.busy) return
      setStopped(true)
      cb.current.onInteract?.()
    }
    const evs = ["pointerdown", "keydown", "focusin", "touchstart"] as const
    for (const n of evs) el.addEventListener(n, stop, true)
    return () => {
      for (const n of evs) el.removeEventListener(n, stop, true)
    }
  }, [stopped])

  const find = (name: string) => rootRef.current?.querySelector<HTMLElement>(`[data-target="${name}"]`) ?? null

  // Leave cleanly: release a held handle, clear hover marks, fade the cursor out.
  React.useEffect(() => {
    if (!stopped) return
    const s = st.current
    if (s.drag) window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 99, bubbles: true }))
    s.drag = false
    for (const k of s.hot) find(k)?.removeAttribute("data-hot")
    s.hot.clear()
    rootRef.current?.querySelectorAll("[data-pressed]").forEach((x) => x.removeAttribute("data-pressed"))
    const c = curRef.current
    if (c) {
      c.removeAttribute("data-on")
      c.removeAttribute("data-press")
    }
  }, [stopped])

  // Reduced motion: one meaningful still. The result is showing and the cursor rests beside it.
  React.useLayoutEffect(() => {
    if (!reduce || !builtIn || stopped) return
    const root = rootRef.current
    const c = curRef.current
    if (!root || !c) return
    const place = () => {
      const t = find("settle")
      if (!t) return
      const r = t.getBoundingClientRect()
      const b = root.getBoundingClientRect()
      c.style.transform = `translate3d(${r.left - b.left}px,${r.top - b.top}px,0)`
      c.dataset.kind = "arrow"
      c.dataset.on = "1"
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(root)
    return () => ro.disconnect()
  }, [reduce, builtIn, stopped])

  const running = !!steps && !stopped && !reduce && !paused && active

  React.useEffect(() => {
    const root = rootRef.current
    const cur = curRef.current
    if (!running || !root || !cur || !steps) return
    const s = st.current
    const resolve: Resolve = (name) => {
      const el = find(name)
      if (!el) return null
      const r = el.getBoundingClientRect()
      const b = root.getBoundingClientRect()
      return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height, cursor: (el.dataset.cursor as CursorKind) || "arrow" }
    }
    let plan = buildPlan(steps, resolve, seed)
    let last = performance.now()
    let raf = 0
    cur.dataset.on = "1"

    const point = (x: number, y: number) => {
      const b = root.getBoundingClientRect()
      return { clientX: b.left + x, clientY: b.top + y }
    }
    const fire = (e: Ev, at: Sample) => {
      const el = find(e.target)
      if (e.k === "hot") {
        el?.setAttribute("data-hot", "")
        s.hot.add(e.target)
      } else if (e.k === "cold") {
        el?.removeAttribute("data-hot")
        s.hot.delete(e.target)
      } else if (e.k === "down") {
        cur.dataset.press = "1"
        if (e.drag && el) {
          s.drag = true
          s.busy = true
          el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 99, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, ...point(at.x, at.y) }))
          s.busy = false
        } else el?.setAttribute("data-pressed", "")
        ringRef.current?.animate([{ opacity: 0.5, transform: "scale(.3)" }, { opacity: 0, transform: "scale(1.15)" }], { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" })
      } else if (e.k === "focus") {
        s.busy = true
        el?.focus({ preventScroll: true })
        s.busy = false
      } else if (e.k === "click") {
        s.busy = true
        el?.click()
        s.busy = false
      } else if (e.k === "key") {
        if (el instanceof HTMLInputElement) {
          s.busy = true
          setInput(el, e.text ?? "")
          s.busy = false
        }
      } else if (e.k === "up") {
        delete cur.dataset.press
        rootRef.current?.querySelectorAll("[data-pressed]").forEach((x) => x.removeAttribute("data-pressed"))
        if (e.drag) {
          s.drag = false
          window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 99, bubbles: true }))
        }
      }
    }

    const frame = (now: number) => {
      s.t += Math.min(64, now - last) * speed
      last = now
      if (s.t >= plan.total) {
        const tail = sample(plan, plan.total)
        while (s.idx < plan.evs.length) fire(plan.evs[s.idx++], tail)
        if (!loop) {
          cb.current.onComplete?.()
          return
        }
        s.t -= plan.total
        s.idx = 0
        plan = buildPlan(steps, resolve, seed)
      }
      const at = sample(plan, s.t)
      while (s.idx < plan.evs.length && plan.evs[s.idx].t <= s.t) fire(plan.evs[s.idx++], at)
      cur.style.transform = `translate3d(${at.x.toFixed(2)}px,${at.y.toFixed(2)}px,0)`
      cur.dataset.kind = at.kind
      if (s.drag) window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 99, pointerType: "mouse", ...point(at.x, at.y) }))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(() => {
      plan = buildPlan(steps, resolve, seed)
    })
    ro.observe(root)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [running, steps, seed, loop, speed])

  const style = accent ? ({ "--cwk-accent": accent, ...(onColor(accent) ? { "--cwk-on": onColor(accent) } : {}) } as React.CSSProperties) : undefined
  return (
    <div ref={rootRef} className={["cwk", className].filter(Boolean).join(" ")} data-cursor={cursorStyle} style={style} role="group" aria-label={builtIn ? "Table booking with a guided cursor" : undefined}>
      <style href="cursor-walkthrough" precedence="default">
        {CSS}
      </style>
      {builtIn ? <Scene venue={venue} guest={guest} party={party} at={at} poster={poster} /> : children}
      <span className="cwk-rest" data-target="rest" aria-hidden />
      {steps ? <Cursor curRef={curRef} ringRef={ringRef} label={label} /> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Studio: the same story on a canvas                  */
/* -------------------------------------------------------------------------- */

type StudioValues = { mode: "light" | "dark"; accent: string; cursor: CursorStyle; label: string; venue: string; guest: string; at: string; seed: number }

const norm = (v: Record<string, unknown>): StudioValues => ({
  mode: v.mode === "dark" ? "dark" : "light",
  accent: str(v.accent, "#0060e2"),
  cursor: v.cursor === "large" || v.cursor === "touch" ? v.cursor : "arrow",
  label: typeof v.label === "string" ? v.label : "",
  venue: str(v.venue, "Harbor & Finch"),
  guest: str(v.guest, "Ines Marlow"),
  at: SLOTS.includes(v.at as string) ? (v.at as string) : "19:30",
  seed: num(v.seed, 7),
})

/** Target boxes in card coordinates; the plan reads these exactly as the page reads measured elements. */
function studioResolve(): Resolve {
  const rect = (x: number, y: number, w: number, h: number, cursor?: CursorKind): Rect => ({ x, y, w, h, cursor })
  const fx = L.padX + L.col
  const fw = L.w - L.padX - fx
  const stopX = (i: number) => L.slotX0 + L.slotStep * i
  return (name) => {
    if (name === "name") return rect(fx, L.nameY, fw, 40, "ibeam")
    if (name === "minus") return rect(fx, L.guestY, 40, 40)
    if (name === "plus") return rect(fx + 88, L.guestY, 40, 40)
    if (name === "handle") return rect(stopX(1) - 10, L.trackY - 10, 20, 20)
    if (name.startsWith("slot-")) return rect(stopX(Number(name.slice(5))) - 10, L.trackY - 10, 20, 20)
    if (name === "reserve") return rect(L.padX, L.btnY, L.w - 2 * L.padX, 44)
    if (name === "settle") return rect(270, L.btnY + 22, 2, 2)
    if (name === "change") return rect(L.w - L.padX - 62, L.btnY + 4, 72, 36)
    if (name === "rest") return rect(L.w + 18, -14, 2, 2)
    return null
  }
}

const planCache = new Map<string, Plan>()
function studioPlan(v: StudioValues): Plan {
  const key = `${v.guest}|${v.at}|${v.seed}`
  let p = planCache.get(key)
  if (!p) {
    p = buildPlan(defaultScript(v.guest, 4, v.at), studioResolve(), v.seed)
    if (planCache.size > 24) planCache.clear()
    planCache.set(key, p)
  }
  return p
}

/** Seconds in one loop of the built-in walkthrough. It does not depend on any control. */
export const WALKTHROUGH_SECONDS = studioPlan(norm({})).total / 1000

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + k, y)
  ctx.arcTo(x + w, y, x + w, y + h, k)
  ctx.arcTo(x + w, y + h, x, y + h, k)
  ctx.arcTo(x, y + h, x, y, k)
  ctx.arcTo(x, y, x + w, y, k)
  ctx.closePath()
}

/**
 * One pure function from (size, time, values) to pixels: the Studio exporter calls it for any frame.
 * t is in seconds and loops; the picture is the same walkthrough the page plays, drawn from the same plan.
 */
export function draw(ctx: CanvasRenderingContext2D, w: number, h: number, tSec: number, values: Record<string, unknown>) {
  const V = norm(values)
  const plan = studioPlan(V)
  const tt = (((tSec * 1000) % plan.total) + plan.total) % plan.total
  const dark = V.mode === "dark"
  const ink = dark ? "255,255,255" : "0,0,0"
  const a = (o: number) => `rgba(${ink},${o})`
  const T1 = a(dark ? 0.9 : 0.88)
  const T2 = a(dark ? 0.62 : 0.61)
  const T3 = a(dark ? 0.46 : 0.45)
  const T4 = a(dark ? 0.28 : 0.27)
  const FILL = a(dark ? 0.08 : 0.06)
  const FILL2 = a(dark ? 0.13 : 0.1)
  const LINE = a(dark ? 0.09 : 0.06)
  const SURF = dark ? "#1c1c1e" : "#ffffff"
  const FONT = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  const text = (s: string, x: number, y: number, size: number, weight: number, color: string, align: CanvasTextAlign = "left") => {
    ctx.font = `${weight} ${size}px ${FONT}`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = "alphabetic"
    ctx.fillText(s, x, y)
  }

  // Scene state at tt, from the same events the page fires.
  const S = { name: 0, party: 2, pos: 1, drag: false, upT: -1, upFrom: 1, done: false, doneT: -1, resetT: -1, focus: false }
  const cur = sample(plan, tt)
  for (const e of plan.evs) {
    if (e.t > tt) break
    if (e.k === "focus") S.focus = true
    else if (e.k === "down" && e.target !== "name") S.focus = false
    if (e.k === "key") S.name = e.n ?? 0
    if (e.k === "click") {
      if (e.target === "plus") S.party = Math.min(MAXP, S.party + 1)
      if (e.target === "minus") S.party = Math.max(1, S.party - 1)
      if (e.target === "reserve") {
        S.done = true
        S.doneT = e.t
        S.focus = false
      }
      if (e.target === "change") {
        S.done = false
        S.name = 0
        S.party = 2
        S.pos = 1
        S.resetT = e.t
      }
    }
    if (e.k === "down" && e.drag) S.drag = true
    if (e.k === "up" && e.drag) {
      S.drag = false
      S.upT = e.t
      S.upFrom = clamp((sample(plan, e.t).x - L.slotX0) / L.slotStep, 0, 7)
      S.pos = Number(/slot-(\d)/.exec(e.target)?.[1] ?? 1)
    }
  }
  const raw = S.drag ? clamp((cur.x - L.slotX0) / L.slotStep, 0, 7) : S.upT >= 0 && tt - S.upT < 280 && S.resetT < S.upT ? S.upFrom + (S.pos - S.upFrom) * (1 - Math.pow(1 - (tt - S.upT) / 280, 3)) : S.pos
  const idx = Math.round(raw)
  const dp = S.done ? 1 - Math.pow(1 - clamp((tt - S.doneT) / 420, 0, 1), 3) : 0
  const rp = S.resetT >= 0 && !S.done ? clamp((tt - S.resetT) / 420, 0, 1) : 1
  const rowsA = (1 - dp * 0.45) * (0.4 + 0.6 * (1 - Math.pow(1 - rp, 3)))

  // Artboard and card placement
  ctx.save()
  ctx.fillStyle = dark ? "#0d0d0f" : "#f3f3f1"
  ctx.fillRect(0, 0, w, h)
  const s = Math.min((w * 0.66) / L.w, (h * 0.72) / L.h)
  ctx.translate((w - L.w * s) / 2, (h - L.h * s) / 2)
  ctx.scale(s, s)

  // Card with a soft shadow and a hairline
  ctx.save()
  ctx.shadowColor = dark ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.09)"
  ctx.shadowBlur = 36 * s
  ctx.shadowOffsetY = 16 * s
  rr(ctx, 0, 0, L.w, L.h, 20)
  ctx.fillStyle = SURF
  ctx.fill()
  ctx.restore()
  rr(ctx, 0, 0, L.w, L.h, 20)
  ctx.lineWidth = 0.5
  ctx.strokeStyle = dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.07)"
  ctx.stroke()
  ctx.save()
  rr(ctx, 0, 0, L.w, L.h, 20)
  ctx.clip()

  // Header
  text(V.venue, L.padX, L.headY + 16, 15, 600, T1)
  text("Thursday 14 May · Dinner", L.padX, L.headY + 36, 13, 400, T3)
  ctx.fillStyle = LINE
  ctx.fillRect(0, L.ruleY, L.w, 1)

  const hot = (n: string) => cur.hot === n
  const pressed = (n: string) => cur.press > 0 && cur.hot === n
  const fx = L.padX + L.col
  const fw = L.w - L.padX - fx

  // Rows
  ctx.globalAlpha = rowsA
  text("Name", L.padX, L.nameY + 25, 13, 500, T2)
  rr(ctx, fx, L.nameY, fw, 40, 10)
  if (S.focus) {
    ctx.fillStyle = SURF
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = V.accent
    ctx.stroke()
  } else {
    ctx.fillStyle = hot("name") ? FILL2 : FILL
    ctx.fill()
  }
  const shown = Array.from(V.guest).slice(0, S.name).join("")
  if (shown) text(shown, fx + 12, L.nameY + 25, 15, 400, T1)
  else text("Guest name", fx + 12, L.nameY + 25, 15, 400, T4)
  if (S.focus && Math.floor(tt / 530) % 2 === 0) {
    ctx.font = `400 15px ${FONT}`
    const cx = fx + 12 + (shown ? ctx.measureText(shown).width : 0) + 1
    ctx.fillStyle = V.accent
    ctx.fillRect(cx, L.nameY + 11, 1.5, 18)
  }

  text("Guests", L.padX, L.guestY + 25, 13, 500, T2)
  const btn = (x: number, name: string, glyph: "minus" | "plus") => {
    const k = pressed(name) ? 0.94 : 1
    ctx.save()
    ctx.translate(x + 20, L.guestY + 20)
    ctx.scale(k, k)
    rr(ctx, -20, -20, 40, 40, 10)
    ctx.fillStyle = hot(name) ? FILL2 : FILL
    ctx.fill()
    ctx.strokeStyle = T1
    ctx.lineWidth = 1.6
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(-4, 0)
    ctx.lineTo(4, 0)
    if (glyph === "plus") {
      ctx.moveTo(0, -4)
      ctx.lineTo(0, 4)
    }
    ctx.stroke()
    ctx.restore()
  }
  btn(fx, "minus", "minus")
  btn(fx + 88, "plus", "plus")
  text(String(S.party), fx + 64, L.guestY + 26, 15, 600, T1, "center")
  text(`Up to ${MAXP}`, L.w - L.padX, L.guestY + 25, 12, 400, T3, "right")

  text("Time", L.padX, L.timeY + 26, 13, 500, T2)
  text(SLOTS[idx], fx, L.timeY + 28, 22, 600, T1)
  rr(ctx, L.slotX0, L.trackY - 2, L.slotStep * 7, 4, 2)
  ctx.fillStyle = FILL2
  ctx.fill()
  rr(ctx, L.slotX0, L.trackY - 2, Math.max(4, L.slotStep * raw), 4, 2)
  ctx.fillStyle = T3
  ctx.fill()
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.arc(L.slotX0 + L.slotStep * i, L.trackY, 2, 0, Math.PI * 2)
    ctx.fillStyle = T4
    ctx.fill()
  }
  for (const i of [0, 2, 4, 6]) text(SLOTS[i], L.slotX0 + L.slotStep * i, L.trackY + 26, 12, 400, T3, "center")
  const hs = S.drag || (cur.press > 0 && cur.hot === "handle") ? 1.12 : 1
  ctx.save()
  ctx.translate(L.slotX0 + L.slotStep * raw, L.trackY)
  ctx.scale(hs, hs)
  ctx.shadowColor = "rgba(0,0,0,.24)"
  ctx.shadowBlur = (S.drag ? 8 : 4) * s
  ctx.shadowOffsetY = (S.drag ? 3 : 1.5) * s
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, Math.PI * 2)
  ctx.fillStyle = "#fff"
  ctx.fill()
  ctx.shadowColor = "transparent"
  ctx.lineWidth = 0.6
  ctx.strokeStyle = "rgba(0,0,0,.2)"
  ctx.stroke()
  ctx.restore()
  ctx.globalAlpha = 1

  // Footer
  ctx.fillStyle = LINE
  ctx.fillRect(0, L.footY, L.w, 1)
  const fy = L.btnY
  if (dp < 1) {
    ctx.globalAlpha = 1 - dp
    const k = pressed("reserve") ? 0.96 : 1
    ctx.save()
    ctx.translate(L.w / 2, fy + 22)
    ctx.scale(k, k)
    rr(ctx, -(L.w - 2 * L.padX) / 2, -22, L.w - 2 * L.padX, 44, 12)
    ctx.fillStyle = V.accent
    ctx.fill()
    ctx.restore()
    text("Reserve table", L.w / 2, fy + 28, 15, 500, onColor(V.accent) ?? "#fff", "center")
    ctx.globalAlpha = 1
  }
  if (dp > 0) {
    ctx.globalAlpha = dp
    const dy = (1 - dp) * 6
    ctx.beginPath()
    ctx.arc(L.padX + 18, fy + 22 + dy, 18, 0, Math.PI * 2)
    ctx.fillStyle = FILL
    ctx.fill()
    ctx.strokeStyle = T1
    ctx.lineWidth = 1.6
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(L.padX + 18 - 4.5, fy + 22 + dy + 0.4)
    ctx.lineTo(L.padX + 18 - 1.4, fy + 22 + dy + 3.5)
    ctx.lineTo(L.padX + 18 + 4.5, fy + 22 + dy - 3)
    ctx.stroke()
    text(`Table for ${S.party} · ${SLOTS[idx]}`, L.padX + 48, fy + 19 + dy, 15, 600, T1)
    text(`Held under ${Array.from(V.guest).join("").trim() || "Guest"}`, L.padX + 48, fy + 38 + dy, 13, 400, T2)
    if (hot("change")) {
      rr(ctx, L.w - L.padX - 62, fy + 4 + dy, 72, 36, 10)
      ctx.fillStyle = FILL
      ctx.fill()
    }
    text("Change", L.w - L.padX - 26, fy + 27 + dy, 13, 500, T2, "center")
    ctx.globalAlpha = 1
  }
  ctx.restore()

  // Cursor, in card coordinates so it scales with the card
  const big = V.cursor === "large" ? 1.45 : 1
  ctx.save()
  ctx.globalAlpha = cur.fade * (tt > plan.total - 200 ? 1 : 1)
  ctx.translate(cur.x, cur.y)
  if (cur.ring < 1) {
    ctx.beginPath()
    ctx.arc(0, 0, 16 * (0.3 + 0.85 * (1 - Math.pow(1 - cur.ring, 3))), 0, Math.PI * 2)
    ctx.strokeStyle = a(0.45 * (1 - cur.ring))
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  ctx.scale(big, big)
  if (V.cursor === "touch") {
    const k = 1 - 0.18 * cur.press
    ctx.beginPath()
    ctx.arc(0, 0, 15 * k, 0, Math.PI * 2)
    ctx.fillStyle = a(0.22)
    ctx.fill()
    ctx.strokeStyle = a(0.3)
    ctx.lineWidth = 1
    ctx.stroke()
  } else {
    const k = 1 - 0.12 * cur.press
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,.32)"
    ctx.shadowBlur = 2 * s
    ctx.shadowOffsetY = 1 * s
    ctx.scale(k, k)
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    if (cur.kind === "ibeam") {
      ctx.translate(0, 0)
      ctx.beginPath()
      ctx.moveTo(-2.5, -8)
      ctx.lineTo(2.5, -8)
      ctx.moveTo(0, -8)
      ctx.lineTo(0, 8)
      ctx.moveTo(-2.5, 8)
      ctx.lineTo(2.5, 8)
      ctx.strokeStyle = dark ? "#111" : "#fff"
      ctx.lineWidth = 3.2
      ctx.stroke()
      ctx.strokeStyle = dark ? "#fff" : "#111"
      ctx.lineWidth = 1.4
      ctx.stroke()
    } else {
      const p = new Path2D(GLYPH_ARROW)
      ctx.fillStyle = dark ? "#fff" : "#111"
      ctx.strokeStyle = dark ? "#111" : "#fff"
      ctx.lineWidth = 1.4
      ctx.fill(p)
      ctx.stroke(p)
    }
    ctx.restore()
  }
  if (V.label) {
    ctx.font = `500 12px ${FONT}`
    const tw = ctx.measureText(V.label).width
    const ox = V.cursor === "touch" ? 20 : 14
    const oy = V.cursor === "touch" ? 12 : 22
    rr(ctx, ox, oy, tw + 16, 18, 6)
    ctx.fillStyle = T1
    ctx.fill()
    text(V.label, ox + 8, oy + 13, 12, 500, SURF)
  }
  ctx.restore()
  ctx.restore()
}

function assignRef<T>(ref: React.Ref<T> | undefined, el: T | null) {
  if (typeof ref === "function") ref(el)
  else if (ref) (ref as React.RefObject<T | null>).current = el
}

function WalkCanvas(props: CursorWalkthroughProps) {
  const { size, time, speed = 1, paused = false, accent, values = {}, seed = 7, canvasRef, className } = props
  const w = size?.w ?? 1080
  const h = size?.h ?? 1080
  const ref = React.useRef<HTMLCanvasElement | null>(null)
  const [dark, setDark] = React.useState(false)
  React.useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"))
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])
  const merged = React.useMemo(
    () => ({ ...values, accent: accent ?? values.accent, seed: values.seed ?? seed, mode: values.mode ?? (dark ? "dark" : "light") }),
    [values, accent, seed, dark],
  )
  const clock = React.useRef(0)

  React.useEffect(() => {
    const el = ref.current
    assignRef(canvasRef, el)
  }, [canvasRef])

  React.useEffect(() => {
    const el = ref.current
    const ctx = el?.getContext("2d")
    if (!el || !ctx) return
    if (time !== undefined) {
      draw(ctx, w, h, time, merged)
      return
    }
    let raf = 0
    let last = performance.now()
    let onScreen = true
    const io = new IntersectionObserver((e) => {
      onScreen = e.some((x) => x.isIntersecting)
    })
    io.observe(el)
    const frame = (now: number) => {
      const run = !paused && onScreen && document.visibilityState === "visible" && !prefersReduced()
      if (run) clock.current += (Math.min(64, now - last) / 1000) * speed
      last = now
      draw(ctx, w, h, prefersReduced() ? WALKTHROUGH_SECONDS * 0.68 : clock.current, merged)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [time, w, h, merged, paused, speed])

  return <canvas ref={ref} width={w} height={h} className={className} style={{ display: "block", width: "100%", height: "auto", aspectRatio: `${w} / ${h}` }} role="img" aria-label="A cursor types a name, adds guests, drags a time and reserves a table" />
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SwipeRowItem = {
  id: string
  title: string
  /** Second line, e.g. who sent it and what it needs. */
  meta?: string
  /** Small timestamp at the right edge. */
  time?: string
}

export type SwipeAction = {
  id: string
  label: string
  /** Replaces the built-in line icon. `archive`, `snooze` and `delete` have one. */
  icon?: React.ReactNode
}

export type SwipeRowProps = {
  /** The rows. Leave it out and the list plays its own short demo. */
  items?: SwipeRowItem[]
  /** Revealed by dragging a row to the right. The first action is the one a long swipe or a flick commits. Default: Archive. */
  leftActions?: SwipeAction[]
  /** Revealed by dragging a row to the left. The first action is the one a long swipe or a flick commits. Default: Delete, Snooze. */
  rightActions?: SwipeAction[]
  /** How far a drag must travel to commit, as a share of the row width. Default 0.5. */
  commitThreshold?: number
  /** A release faster than this (px per ms) commits even after a short drag. Default 0.8. */
  flickVelocity?: number
  /** How much of the drag still moves the row once the actions are fully shown: 0 is a wall, 1 is no resistance. Default 0.6. */
  rubberBand?: number
  /** Close the gap when a row is committed. Turn it off to keep the row and only report the action. Default true. */
  collapseOnCommit?: boolean
  /** Heading of the list. Default "Inbox". */
  title?: string
  /** Called the moment an action is committed, by swipe, flick, button or key. */
  onCommit?: (item: SwipeRowItem, action: SwipeAction) => void
  /** Called when the list is restored. */
  onRestore?: () => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.swr {
  --swr-ink: #000;
  --swr-surface: #fff;
  --swr-accent: #0060e2;
  --swr-t1: color-mix(in oklab, var(--swr-ink) 88%, transparent);
  --swr-t2: color-mix(in oklab, var(--swr-ink) 61%, transparent);
  --swr-t3: color-mix(in oklab, var(--swr-ink) 45%, transparent);
  --swr-fill: color-mix(in oklab, var(--swr-ink) 6%, transparent);
  --swr-fill2: color-mix(in oklab, var(--swr-ink) 10%, transparent);
  --swr-line: color-mix(in oklab, var(--swr-ink) 6%, transparent);
  --swr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --swr-ease: cubic-bezier(.22, 1, .36, 1);
  --swr-pad: 24px;
  --swr-radius: 24px;
  --swr-row: 68px;
  position: relative; container-type: inline-size; width: 100%; max-width: 400px;
  font: 13px/20px var(--swr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--swr-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .swr {
  --swr-ink: #fff;
  --swr-surface: #1c1c1e;
  --swr-accent: #4d8dff;
  --swr-t1: color-mix(in oklab, var(--swr-ink) 90%, transparent);
  --swr-t2: color-mix(in oklab, var(--swr-ink) 62%, transparent);
  --swr-t3: color-mix(in oklab, var(--swr-ink) 46%, transparent);
  --swr-fill: color-mix(in oklab, var(--swr-ink) 8%, transparent);
  --swr-fill2: color-mix(in oklab, var(--swr-ink) 13%, transparent);
  --swr-line: color-mix(in oklab, var(--swr-ink) 9%, transparent);
  --swr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
}
html[data-style="mono"] .swr {
  --swr-ink: #000; --swr-surface: #fff; --swr-accent: #111; --swr-shadow: 0 0 0 1px rgb(0 0 0 / .14); --swr-radius: 6px;
  --swr-ease: cubic-bezier(.2, .9, .1, 1); --swr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .swr { --swr-ink: #fff; --swr-surface: #0a0a0a; --swr-accent: #f2f2f2; --swr-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .swr {
  --swr-ink: var(--pane-ink); --swr-surface: var(--pane-solid); --swr-accent: var(--pane-accent); --swr-shadow: var(--pane-shadow);
  --swr-ease: var(--pane-ease); --swr-font: var(--pane-font);
  --swr-t1: var(--pane-t1); --swr-t2: var(--pane-t2); --swr-t3: var(--pane-t3);
}
html[data-style="glass"] .swr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .swr-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"][data-refract] .swr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .swr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.swr *, .swr *::before, .swr *::after { box-sizing: border-box }
:where(.swr) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.swr) p, :where(.swr) ul, :where(.swr) h3 { margin: 0 }
:where(.swr) ul { padding: 0; list-style: none }
.swr button:focus-visible, .swr-face:focus-visible { outline: 2px solid var(--swr-accent); outline-offset: -2px }
.swr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.swr-card { position: relative; border-radius: var(--swr-radius); background: var(--swr-surface); box-shadow: var(--swr-shadow); overflow: hidden }

.swr-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 20px var(--swr-pad) 12px }
.swr-title { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--swr-t1) }
.swr-count { font-variant-numeric: tabular-nums; color: var(--swr-t2) }

/* Rows. The li clips the face while it flies out and is the thing that shrinks to close the gap. */
.swr-list { border-top: 1px solid var(--swr-line) }
.swr-li { position: relative; overflow: hidden; touch-action: pan-y }
.swr-li::after { content: ""; position: absolute; left: var(--swr-pad); right: 0; bottom: 0; height: 1px; background: var(--swr-line); pointer-events: none }
.swr-li:last-child::after { display: none }
.swr-li[data-collapsing] { transition: height .44s var(--swr-ease) }
.swr-li[data-collapsing]::after { opacity: 0 }
.swr-li[data-enter] { transition: height .5s var(--swr-ease) }
.swr-li[data-enter] .swr-face { opacity: 0; transform: translate3d(0, 6px, 0); transition: none }
.swr-li[data-enter="in"] .swr-face { opacity: 1; transform: none; transition: opacity .4s var(--swr-ease) .08s, transform .5s var(--swr-ease) .08s }

.swr-face {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 16px;
  min-height: var(--swr-row); padding: 0 var(--swr-pad); cursor: grab; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  will-change: transform; transition: background-color .16s var(--swr-ease);
}
.swr-li[data-side] .swr-face { background: var(--swr-fill) }
.swr-li[data-drag] .swr-face { cursor: grabbing }
.swr-li[data-gone] .swr-face { pointer-events: none }
.swr-text { display: flex; flex-direction: column; min-width: 0 }
.swr-name { font-size: 15px; line-height: 22px; font-weight: 500; letter-spacing: -.005em; color: var(--swr-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.swr-meta { color: var(--swr-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.swr-time { flex: none; align-self: flex-start; margin-top: 14px; font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; color: var(--swr-t3) }

/* Actions sit behind the face. The layer is exactly as wide as the gap the face has opened, so the face needs no background. */
.swr-layer { position: absolute; top: 0; bottom: 0; width: 0; overflow: hidden; visibility: hidden; --swr-p: 0 }
.swr-layer[data-side="l"] { left: 0 }
.swr-layer[data-side="r"] { right: 0 }
.swr-in { position: absolute; top: 0; bottom: 0; width: 100%; min-width: var(--swr-reach) }
.swr-layer[data-side="l"] .swr-in { left: 0 }
.swr-layer[data-side="r"] .swr-in { right: 0 }
.swr-act {
  position: absolute; top: 0; bottom: 0; width: 76px; display: flex; align-items: center; color: var(--swr-t1); background: var(--swr-fill2);
  transition: width .4s var(--swr-ease), opacity .24s var(--swr-ease), background-color .16s var(--swr-ease);
}
.swr-layer[data-side="l"] .swr-act { left: calc(var(--k) * 76px); justify-content: flex-end }
.swr-layer[data-side="r"] .swr-act { right: calc(var(--k) * 76px); justify-content: flex-start }
.swr-act[data-k="0"] { background: var(--swr-t1); color: var(--swr-surface) }
.swr-act:not([data-k="0"]):hover { background: color-mix(in oklab, var(--swr-ink) 15%, transparent) }
.swr-li[data-armed] .swr-act[data-k="0"] { width: 100% }
.swr-li[data-armed] .swr-act:not([data-k="0"]) { opacity: 0 }
.swr-ci {
  flex: none; width: 76px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  opacity: var(--swr-p); transform: scale(calc(.72 + .28 * var(--swr-p)));
}
.swr-layer[data-side="l"] .swr-ci { transform-origin: 100% 50% }
.swr-layer[data-side="r"] .swr-ci { transform-origin: 0 50% }
.swr-ci svg { display: block; width: 20px; height: 20px; transition: transform .3s var(--swr-ease) }
.swr-li[data-armed] .swr-act[data-k="0"] svg { transform: scale(1.14) }
.swr-cl { font-size: 13px; line-height: 16px; font-weight: 500 }

.swr-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; padding: 6px var(--swr-pad) 6px; border-top: 1px solid var(--swr-line) }
.swr-hint { font-size: 12px; line-height: 16px; color: var(--swr-t3) }
.swr-restore { flex: none; height: 32px; margin-right: -10px; padding: 0 10px; border-radius: 10px; font-weight: 500; color: var(--swr-t2); transition: background-color .16s var(--swr-ease), opacity .24s var(--swr-ease), transform .16s var(--swr-ease) }
.swr-restore:hover { background: var(--swr-fill) }
.swr-restore:active { transform: scale(.96) }
.swr-restore[data-hide] { opacity: 0; visibility: hidden }

.swr-empty { display: flex; flex-direction: column; justify-content: center; min-height: var(--swr-row); padding: 0 var(--swr-pad) }
.swr-empty-t { font-size: 15px; line-height: 22px; font-weight: 600; color: var(--swr-t1) }
.swr-empty-n { color: var(--swr-t2) }

/* The fake finger of the built-in demo */
.swr-cur { position: absolute; left: 0; top: 0; z-index: 3; width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 50%; pointer-events: none; opacity: 0;
  background: color-mix(in oklab, var(--swr-ink) 12%, transparent); box-shadow: 0 0 0 1px color-mix(in oklab, var(--swr-ink) 26%, transparent);
  transition: opacity .24s var(--swr-ease) }
.swr-cur[data-on] { opacity: 1 }
.swr-cur i { position: absolute; inset: 0; border-radius: 50%; background: color-mix(in oklab, var(--swr-ink) 18%, transparent); transform: scale(.4); opacity: 0; transition: transform .2s var(--swr-ease), opacity .2s var(--swr-ease) }
.swr-cur[data-press] i { transform: scale(1); opacity: 1 }

@container (max-width: 340px) {
  .swr-card { --swr-pad: 18px }
  .swr-time { display: none }
}
@media (hover: none) { .swr-hint-k { display: none } }
@media (prefers-reduced-motion: reduce) {
  .swr *, .swr *::before, .swr *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Physics                                  */
/* -------------------------------------------------------------------------- */

const ACT_W = 76
const DEAD = 8

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

type Side = -1 | 1

type Ctl = {
  down(cx: number): void
  move(cx: number): void
  up(): void
  abort(): void
  close(): void
  /** Finger travel (raw px) that makes the row show `shown` px of its own travel in the direction `side`. */
  reach(side: Side): { raw: number; reveal: number; threshold: number }
  el(): HTMLElement | null
}


/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

function ActionIcon({ action }: { action: SwipeAction }) {
  if (action.icon) return <>{action.icon}</>
  const p = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const
  if (action.id === "archive")
    return (
      <svg {...p}>
        <rect x="3" y="4" width="14" height="3.5" rx="1" />
        <path d="M4.5 7.5V15a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7.5M8 11h4" />
      </svg>
    )
  if (action.id === "snooze")
    return (
      <svg {...p}>
        <circle cx="10" cy="10.5" r="6.5" />
        <path d="M10 7v3.7l2.3 1.4" />
      </svg>
    )
  if (action.id === "delete")
    return (
      <svg {...p}>
        <path d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5l.7 9.6a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.7-9.6" />
      </svg>
    )
  return (
    <svg {...p}>
      <circle cx="10" cy="10" r="2" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                     Row                                    */
/* -------------------------------------------------------------------------- */

type RowProps = {
  item: SwipeRowItem
  left: SwipeAction[]
  right: SwipeAction[]
  threshold: number
  flick: number
  band: number
  collapse: boolean
  reduce: boolean
  enter: boolean
  initial?: Side
  hintId: string
  register: (id: string, c: Ctl | null) => void
  onOpen: (id: string) => void
  onCommit: (item: SwipeRowItem, action: SwipeAction) => void
  onGone: (id: string) => void
}

const Row = React.memo(function Row(p: RowProps) {
  const { item, left, right, reduce, hintId } = p
  const li = React.useRef<HTMLLIElement>(null)
  const face = React.useRef<HTMLDivElement>(null)
  const layerL = React.useRef<HTMLDivElement>(null)
  const layerR = React.useRef<HTMLDivElement>(null)
  const S = React.useRef({ x: 0, vel: 0, raf: 0, timer: 0, drag: false, lock: 0, sx: 0, sy: 0, base: 0, W: 360, gone: false, samples: [] as { x: number; t: number }[] })
  // Everything the handlers read goes through one ref, so they never go stale and the row never re-renders per frame.
  const P = React.useRef(p)
  P.current = p

  const reveal = (side: Side) => (side > 0 ? left.length : right.length) * ACT_W
  const thresholdFor = (side: Side, W: number) => {
    const r = reveal(side)
    return clamp(W * P.current.threshold, r + 24, Math.max(r + 24, W * 0.8))
  }

  const draw = React.useCallback((x: number) => {
    const s = S.current
    s.x = x
    const f = face.current
    if (!f || !li.current) return
    f.style.transform = x ? `translate3d(${x}px,0,0)` : ""
    const ax = Math.abs(x)
    const side: Side = x < 0 ? -1 : 1
    for (const [layer, sd] of [[layerL.current, 1], [layerR.current, -1]] as const) {
      if (!layer) continue
      const on = x !== 0 && side === sd
      layer.style.width = on ? `${ax}px` : "0px"
      layer.style.visibility = on ? "visible" : "hidden"
      if (on) layer.style.setProperty("--swr-p", String(Math.min(1, ax / (sd > 0 ? left.length : right.length) / ACT_W)))
    }
    const el = li.current
    el.toggleAttribute("data-side", ax > 0.5)
    const armed = ax > 0.5 && ax >= thresholdFor(side, s.W) - 0.5 && reveal(side) > 0
    el.toggleAttribute("data-armed", armed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left.length, right.length])

  const stop = () => {
    const s = S.current
    cancelAnimationFrame(s.raf)
    clearTimeout(s.timer)
    s.raf = 0
  }

  /** A spring seeded with the release velocity. Interruptible: stop() on the next touch and the row keeps its position. */
  const spring = (target: number, v0: number, k: number, c: number) => {
    const s = S.current
    stop()
    if (P.current.reduce) {
      draw(target)
      return
    }
    s.vel = clamp(v0, -4000, 4000)
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      let x = s.x
      for (let i = 0; i < 4; i++) {
        const h = dt / 4
        s.vel += (-k * (x - target) - c * s.vel) * h
        x += s.vel * h
      }
      if (Math.abs(x - target) < 0.4 && Math.abs(s.vel) < 10) {
        clearTimeout(s.timer)
        s.raf = 0
        draw(target)
        return
      }
      draw(x)
      s.raf = requestAnimationFrame(frame)
    }
    s.raf = requestAnimationFrame(frame)
    // If frames never arrive (throttled tab, screenshot), land anyway.
    s.timer = window.setTimeout(() => {
      cancelAnimationFrame(s.raf)
      s.raf = 0
      draw(target)
    }, 1500)
  }

  const settle = (target: number, v: number) => spring(target, v * 1000, 420, 34)

  const collapseRow = () => {
    const el = li.current
    if (!el) return
    if (P.current.reduce) {
      P.current.onGone(P.current.item.id)
      return
    }
    el.style.height = `${el.offsetHeight}px`
    void el.offsetHeight
    el.toggleAttribute("data-collapsing", true)
    el.style.height = "0px"
    window.setTimeout(() => P.current.onGone(P.current.item.id), 470)
  }

  const commit = (side: Side, action: SwipeAction, v = 0) => {
    const s = S.current
    const el = li.current
    if (!el || s.gone) return
    const cur = P.current
    s.drag = false
    // Focus moves to the neighbour before the row leaves, so a keyboard user never loses their place.
    if (cur.collapse && el.contains(document.activeElement)) {
      const next = (el.nextElementSibling ?? el.previousElementSibling) as HTMLElement | null
      const target = next?.querySelector<HTMLElement>("[data-face]") ?? el.closest(".swr")?.querySelector<HTMLElement>(".swr-restore")
      target?.focus({ preventScroll: true })
    }
    cur.onCommit(cur.item, action)
    if (!cur.collapse) {
      settle(0, 0)
      return
    }
    s.gone = true
    el.toggleAttribute("data-gone", true)
    if (cur.reduce) {
      collapseRow()
      return
    }
    // Leave at the speed the finger had. A button press has no velocity, so it just glides out.
    spring(side * (s.W + 40), v * 1000, 230, 30)
    window.setTimeout(collapseRow, 130)
  }

  const velocity = () => {
    const smp = S.current.samples
    const now = performance.now()
    const recent = smp.filter((q) => now - q.t < 110)
    if (recent.length < 2 || now - recent[recent.length - 1].t > 70) return 0
    const a = recent[0]
    const b = recent[recent.length - 1]
    return b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0
  }

  /** Display position for a raw finger offset: 1:1 inside the actions, resistance past them, a firm band on a side with none. */
  const resist = (raw: number) => {
    const s = S.current
    const side: Side = raw < 0 ? -1 : 1
    const r = reveal(side)
    const d = Math.abs(raw)
    if (r === 0) {
      const dim = 120
      return side * (1 - 1 / ((d * 0.5) / dim + 1)) * dim
    }
    if (d <= r) return raw
    let out = r + (d - r) * P.current.band
    if (out > s.W) out = s.W + (out - s.W) * 0.15
    return side * out
  }

  const begin = (cx: number) => {
    const s = S.current
    stop()
    s.W = li.current?.offsetWidth ?? 360
    s.samples = []
    s.base = clamp(s.x, -reveal(-1), reveal(1))
    s.sx = cx
    s.drag = true
    P.current.onOpen(P.current.item.id)
  }

  const track = (cx: number) => {
    const s = S.current
    const raw = s.base + (cx - s.sx)
    s.samples.push({ x: cx, t: performance.now() })
    if (s.samples.length > 8) s.samples.shift()
    draw(resist(raw))
  }

  const release = () => {
    const s = S.current
    if (!s.drag) return
    s.drag = false
    li.current?.removeAttribute("data-drag")
    const v = velocity()
    const x = s.x
    const side: Side = x < 0 ? -1 : 1
    const acts = side > 0 ? left : right
    const r = reveal(side)
    const ax = Math.abs(x)
    const toward = v * side
    if (acts.length && (ax >= thresholdFor(side, s.W) - 0.5 || (toward >= P.current.flick && ax > 24))) {
      commit(side, acts[0], v)
      return
    }
    if (acts.length && ax > 4 && ((ax > r * 0.5 && toward > -0.25) || (toward > 0.3 && ax > 16))) {
      settle(side * r, v)
      return
    }
    settle(0, v)
  }

  React.useEffect(() => {
    const ctl: Ctl = {
      down: (cx) => {
        begin(cx)
        S.current.lock = 1
        li.current?.toggleAttribute("data-drag", true)
      },
      move: (cx) => track(cx),
      up: release,
      abort: () => {
        const s = S.current
        if (!s.drag) return
        s.samples = []
        release()
      },
      close: () => {
        const s = S.current
        if (s.gone || s.drag || s.x === 0) return
        settle(0, 0)
      },
      reach: (side) => {
        const r = reveal(side)
        const t = thresholdFor(side, li.current?.offsetWidth ?? 360)
        const want = t + 14
        let raw = r + (want - r) / P.current.band
        raw = Math.min(raw, (li.current?.offsetWidth ?? 360) * 0.9)
        return { raw, reveal: r, threshold: t }
      },
      el: () => li.current,
    }
    p.register(item.id, ctl)
    return () => {
      p.register(item.id, null)
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])

  // Entering: grow from nothing to the measured height, then let the face settle in.
  React.useLayoutEffect(() => {
    const el = li.current
    if (!el) return
    if (p.initial && !p.enter) {
      S.current.W = el.offsetWidth
      draw(p.initial * reveal(p.initial))
    }
    if (!p.enter || reduce) {
      el.removeAttribute("data-enter")
      return
    }
    const h = el.offsetHeight
    el.style.height = "0px"
    void el.offsetHeight
    el.setAttribute("data-enter", "in")
    el.style.height = `${h}px`
    const t = window.setTimeout(() => {
      el.removeAttribute("data-enter")
      el.style.height = ""
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (S.current.gone || (e.pointerType === "mouse" && e.button !== 0)) return
    begin(e.clientX)
    S.current.lock = 0
    S.current.sy = e.clientY
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = S.current
    if (!s.drag) return
    if (s.lock === 0) {
      const dx = e.clientX - s.sx
      const dy = e.clientY - s.sy
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DEAD) return
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical: the page scrolls, not the row.
        s.drag = false
        rest()
        return
      }
      s.lock = 1
      s.sx = e.clientX
      face.current?.setPointerCapture(e.pointerId)
      li.current?.toggleAttribute("data-drag", true)
    }
    track(e.clientX)
  }
  /** A press that never became a drag may have caught the row mid-spring: land it on the nearest rest position. */
  const rest = () => {
    const s = S.current
    if (s.gone || s.raf || s.x === 0) return
    const side: Side = s.x < 0 ? -1 : 1
    const r = reveal(side)
    settle(Math.abs(s.x) > r / 2 ? side * r : 0, 0)
  }
  const onPointerEnd = (e: React.PointerEvent) => {
    const s = S.current
    if (s.lock === 0) {
      s.drag = false
      // A tap on the face of an open row closes it, like Mail; the action buttons keep their own click.
      if (e.type === "pointerup" && s.x !== 0 && !s.raf && !s.gone && !(e.target as Element).closest?.("button")) settle(0, 0)
      else rest()
      return
    }
    release()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const s = S.current
    if (s.gone) return
    if (e.key === "Escape" && s.x !== 0) {
      e.preventDefault()
      e.stopPropagation()
      settle(0, 0)
      face.current?.focus({ preventScroll: true })
      return
    }
    if (e.target !== face.current) return
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      const side: Side = e.key === "ArrowLeft" ? -1 : 1
      if (s.x * side < 0 || (s.x !== 0 && Math.sign(s.x) !== side)) {
        settle(0, 0)
      } else if ((side > 0 ? left : right).length && s.x === 0) {
        s.W = li.current?.offsetWidth ?? s.W
        P.current.onOpen(item.id)
        settle(side * reveal(side), 0)
      }
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault()
      if (right.length) commit(-1, right[0])
      else if (left.length) commit(1, left[0])
    }
  }

  const layer = (side: Side, acts: SwipeAction[]) =>
    acts.length ? (
      <div ref={side > 0 ? layerL : layerR} className="swr-layer" data-side={side > 0 ? "l" : "r"} style={{ "--swr-reach": `${acts.length * ACT_W}px` } as React.CSSProperties}>
        <div className="swr-in">
          {acts.map((a, k) => (
            <button
              key={a.id}
              type="button"
              className="swr-act"
              data-k={k}
              style={{ "--k": k } as React.CSSProperties}
              aria-label={`${a.label}: ${item.title}`}
              onClick={() => {
                S.current.W = li.current?.offsetWidth ?? S.current.W
                commit(side, a)
              }}
            >
              <span className="swr-ci">
                <ActionIcon action={a} />
                <span className="swr-cl">{a.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    ) : null

  return (
    <li ref={li} className="swr-li" data-enter={p.enter && !reduce ? "" : undefined} onKeyDown={onKeyDown}>
      {layer(1, left)}
      {layer(-1, right)}
      <div
        ref={face}
        data-face
        className="swr-face"
        role="group"
        tabIndex={0}
        aria-label={[item.title, item.meta].filter(Boolean).join(". ")}
        aria-describedby={hintId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
      >
        <span className="swr-text">
          <span className="swr-name">{item.title}</span>
          {item.meta ? <span className="swr-meta">{item.meta}</span> : null}
        </span>
        {item.time ? <span className="swr-time">{item.time}</span> : null}
      </div>
    </li>
  )
})

/* -------------------------------------------------------------------------- */
/*                                  SwipeRow                                  */
/* -------------------------------------------------------------------------- */

const DEMO_ITEMS: SwipeRowItem[] = [
  { id: "a", title: "Northwind invoice is $180 over", meta: "Atlas · needs a decision", time: "09:41" },
  { id: "b", title: "Reply to Harbor & Finch", meta: "Quill · draft ready to send", time: "09:12" },
  { id: "c", title: "Q3 spend summary", meta: "Sage · 4 pages", time: "08:50" },
  { id: "d", title: "Renewal terms changed", meta: "Atlas · Northwind", time: "Mon" },
]
const DEFAULT_LEFT: SwipeAction[] = [{ id: "archive", label: "Archive" }]
const DEFAULT_RIGHT: SwipeAction[] = [
  { id: "delete", label: "Delete" },
  { id: "snooze", label: "Snooze" },
]

const ease = {
  out: (t: number) => 1 - (1 - t) ** 3,
  io: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  in: (t: number) => t * t,
}

export function SwipeRow(props: SwipeRowProps) {
  const {
    items,
    leftActions = DEFAULT_LEFT,
    rightActions = DEFAULT_RIGHT,
    commitThreshold = 0.5,
    flickVelocity = 0.8,
    rubberBand = 0.6,
    collapseOnCommit = true,
    title = "Inbox",
    onCommit,
    onRestore,
    className,
  } = props
  const bare = items === undefined
  const source = items ?? DEMO_ITEMS
  const uid = React.useId()
  const hintId = `swr-hint-${uid}`

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const [rows, setRows] = React.useState(source)
  const [msg, setMsg] = React.useState("")
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)
  const enterIds = React.useRef(new Set<string>())
  const ctls = React.useRef(new Map<string, Ctl>())
  const root = React.useRef<HTMLDivElement>(null)
  const card = React.useRef<HTMLDivElement>(null)
  const cur = React.useRef<HTMLDivElement>(null)
  const rowsRef = React.useRef(rows)
  rowsRef.current = rows

  // A new list from the caller replaces the rows.
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    enterIds.current.clear()
    setRows(source)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const register = React.useCallback((id: string, c: Ctl | null) => {
    if (c) ctls.current.set(id, c)
    else ctls.current.delete(id)
  }, [])
  const onOpen = React.useCallback((id: string) => {
    for (const [k, c] of ctls.current) if (k !== id) c.close()
  }, [])
  const onGone = React.useCallback((id: string) => setRows((r) => r.filter((x) => x.id !== id)), [])
  const handleCommit = React.useCallback(
    (item: SwipeRowItem, action: SwipeAction) => {
      setMsg(`${action.label}: ${item.title}`)
      onCommit?.(item, action)
    },
    [onCommit],
  )

  // Tapping anywhere else closes an open row.
  React.useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (t?.closest?.(".swr-li[data-side]")) return
      for (const c of ctls.current.values()) c.close()
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [])

  const restore = React.useCallback(
    (animate: boolean) => {
      const have = new Set(rowsRef.current.map((r) => r.id))
      enterIds.current = new Set(animate ? source.filter((s) => !have.has(s.id)).map((s) => s.id) : [])
      setRows(source)
      setMsg("")
    },
    [source],
  )

  /* ---- the built-in demo ---- */
  React.useEffect(() => {
    if (!bare) return
    const el = root.current
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
  }, [bare])

  React.useEffect(() => {
    if (!bare || !active || !auto || reduce) return
    let dead = false
    const timers = new Set<number>()
    let raf = 0
    let grabbed: Ctl | null = null
    const sleep = (ms: number) => new Promise<void>((res) => timers.add(window.setTimeout(res, ms)))
    const frames = (ms: number, f: (t: number) => void) =>
      new Promise<void>((res) => {
        const t0 = performance.now()
        const tick = (now: number) => {
          if (dead) return res()
          const t = Math.min(1, (now - t0) / ms)
          f(t)
          if (t < 1) raf = requestAnimationFrame(tick)
          else res()
        }
        raf = requestAnimationFrame(tick)
      })
    const curEl = cur.current
    const place = (x: number, y: number) => {
      if (curEl) curEl.style.transform = `translate3d(${x}px,${y}px,0)`
    }

    const run = async () => {
      let n = 0
      await sleep(900)
      while (!dead) {
        if (rowsRef.current.length < source.length) {
          restore(false)
          await sleep(60)
        }
        const target = source[n % 2 === 0 ? 1 : 2]
        const ctl = ctls.current.get(target.id)
        const li = ctl?.el()
        if (!ctl || !li || !card.current) {
          await sleep(300)
          continue
        }
        const flick = n % 2 === 0
        const side: Side = flick ? -1 : 1
        const reach = ctl.reach(side)
        const box = li.getBoundingClientRect()
        const cbox = card.current.getBoundingClientRect()
        const sx = box.left + box.width * (flick ? 0.78 : 0.2)
        const cy = box.top - cbox.top + box.height / 2
        const cx0 = sx - cbox.left
        place(cx0, cy + 10)
        curEl?.setAttribute("data-on", "")
        await sleep(100)
        if (dead) break
        place(cx0, cy)
        await sleep(420)
        if (dead) break
        curEl?.setAttribute("data-press", "")
        await sleep(160)
        if (dead) break
        ctl.down(sx)
        grabbed = ctl
        // A flick accelerates and lets go while still fast; a long swipe is slower and decelerates into the commit.
        const travel = flick ? Math.min(reach.reveal * 0.82, reach.raw) : reach.raw
        await frames(flick ? 300 : 760, (t) => {
          const dx = side * travel * (flick ? ease.in(t) : ease.out(t))
          ctl.move(sx + dx)
          place(cx0 + dx, cy)
        })
        if (dead) break
        if (!flick) await sleep(170)
        grabbed = null
        ctl.up()
        curEl?.removeAttribute("data-press")
        await sleep(160)
        curEl?.removeAttribute("data-on")
        await sleep(2300)
        if (dead) break
        restore(true)
        await sleep(1700)
        n++
      }
    }
    run()
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      grabbed?.abort()
      curEl?.removeAttribute("data-on")
      curEl?.removeAttribute("data-press")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bare, active, auto, reduce])

  const stopDemo = () => setAuto(false)
  const total = source.length
  const stillOpen = bare && reduce ? 1 : -1
  const keysOnly = leftActions.length + rightActions.length > 0
  const hintText = `Drag a row sideways to reveal actions; a long drag or a quick flick commits the first. Keyboard: left and right arrows open actions, Escape closes, Delete removes.`

  return (
    <div ref={root} className={cn("swr", className)} onPointerDownCapture={stopDemo} onKeyDownCapture={stopDemo} onFocusCapture={stopDemo}>
      <style href="swipe-row" precedence="default">
        {CSS}
      </style>
      <div ref={card} className="swr-card">
        <div className="swr-head">
          <h3 className="swr-title">{title}</h3>
          <span className="swr-count">{rows.length ? `${rows.length} to triage` : "Clear"}</span>
        </div>
        <ul className="swr-list" role="list" aria-label={title}>
          {rows.map((item, i) => (
            <Row
              key={item.id}
              item={item}
              left={leftActions}
              right={rightActions}
              threshold={commitThreshold}
              flick={flickVelocity}
              band={clamp(rubberBand, 0.05, 1)}
              collapse={collapseOnCommit}
              reduce={reduce}
              enter={enterIds.current.has(item.id)}
              initial={i === 1 && stillOpen === 1 ? (-1 as Side) : undefined}
              hintId={hintId}
              register={register}
              onOpen={onOpen}
              onCommit={handleCommit}
              onGone={onGone}
            />
          ))}
        </ul>
        {rows.length === 0 ? (
          <div className="swr-empty">
            <p className="swr-empty-t">Nothing left to triage</p>
            <p className="swr-empty-n">Atlas will tell you when something needs you.</p>
          </div>
        ) : null}
        <div className="swr-foot">
          <p className="swr-hint" aria-hidden>
            {keysOnly ? (
              <>
                Drag a row<span className="swr-hint-k">, or focus it and press ← →</span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            className="swr-restore"
            data-hide={rows.length >= total ? "" : undefined}
            onClick={() => {
              restore(true)
              onRestore?.()
            }}
          >
            Restore
          </button>
        </div>
        <div ref={cur} className="swr-cur" aria-hidden>
          <i />
        </div>
      </div>
      <span id={hintId} className="swr-sr">
        {hintText}
      </span>
      <span className="swr-sr" role="status" aria-live="polite">
        {msg}
      </span>
    </div>
  )
}

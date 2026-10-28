"use client"

import * as React from "react"
import { Bell, Briefcase, ChevronRight, Headphones, Presentation, Sunset, Type, Volume2, X, type LucideIcon } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ControlCenterFocusMode = {
  id: string
  label: string
  icon: LucideIcon
  description: string
  /** Seeds the session dial (5 to 120 minutes). */
  defaultMinutes: number
}

export type ControlCenterChannel = {
  id: string
  label: string
  description?: string
  defaultOn?: boolean
}

export type ControlCenterPerson = { id: string; name: string; avatar: string }

export type ControlCenterState = {
  focus: { mode: string; minutes: number; until: string } | null
  notifications: boolean
  channels: Record<string, boolean>
  presenting: boolean
  volume: number
  textSize: number
}

export type ControlCenterProps = {
  /** Focus modes offered in the focus detail. */
  focusModes?: ControlCenterFocusMode[]
  /** Notification channels toggled in the notifications detail. */
  channels?: ControlCenterChannel[]
  /** People who can still reach you during a focus session. */
  people?: ControlCenterPerson[]
  /** Initial alert volume, 0 to 100. */
  defaultVolume?: number
  /** Initial text size as a percent of the base, 85 to 130. */
  defaultTextSize?: number
  /** Formats the end of a session. Defaults to a short en-US clock time. */
  formatTime?: (date: Date) => string
  /** Called with the full settings state after any change, including each step while a meter is dragged. */
  onStateChange?: (state: ControlCenterState) => void
  /** Accessible name of the panel. */
  label?: string
  className?: string
}

const DEFAULT_MODES: ControlCenterFocusMode[] = [
  { id: "deep", label: "Deep work", icon: Briefcase, description: "Only mentions from your team get through", defaultMinutes: 50 },
  { id: "meet", label: "Meetings", icon: Presentation, description: "Silences chat, keeps calendar alerts", defaultMinutes: 30 },
  { id: "wind", label: "Wind down", icon: Sunset, description: "Everything waits until tomorrow", defaultMinutes: 45 },
]
const DEFAULT_CHANNELS: ControlCenterChannel[] = [
  { id: "mentions", label: "Mentions", description: "When someone tags you", defaultOn: true },
  { id: "replies", label: "Replies", description: "Answers in threads you follow", defaultOn: true },
  { id: "digest", label: "Daily digest", description: "One summary at 9:00" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ccn {
  --ccn-ink: #000;
  --ccn-accent: #0060e2;
  --ccn-t1: color-mix(in oklab, var(--ccn-ink) 88%, transparent);
  --ccn-t2: color-mix(in oklab, var(--ccn-ink) 58%, transparent);
  --ccn-t3: color-mix(in oklab, var(--ccn-ink) 40%, transparent);
  --ccn-panel: color-mix(in oklab, #fff 56%, transparent);
  --ccn-tile: rgb(255 255 255 / .62);
  --ccn-tile-on: color-mix(in oklab, var(--ccn-ink) 12%, rgb(255 255 255 / .35));
  --ccn-orb: #fff;
  --ccn-orb-on: #2a2a2d;
  --ccn-orb-on-ink: #fff;
  --ccn-sheet: color-mix(in oklab, #fbfbfc 90%, transparent);
  --ccn-line: color-mix(in oklab, var(--ccn-ink) 8%, transparent);
  --ccn-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: min(100%, 22.5rem); min-height: 428px; display: flex; flex-direction: column; border-radius: 30px; padding: 10px; overflow: hidden; isolation: isolate;
  -webkit-backdrop-filter: blur(28px) saturate(1.7); backdrop-filter: blur(28px) saturate(1.7);
  background: var(--ccn-panel);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .6), inset 0 0 0 .5px rgb(255 255 255 / .35), 0 20px 48px rgb(0 0 0 / .2), 0 3px 10px rgb(0 0 0 / .08);
  font-family: var(--ccn-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 20px; color: var(--ccn-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ccn {
  --ccn-ink: #fff; --ccn-accent: #6ea4ff;
  --ccn-t1: rgb(255 255 255 / .94); --ccn-t2: rgb(255 255 255 / .62); --ccn-t3: rgb(255 255 255 / .42);
  --ccn-panel: color-mix(in oklab, #1b1b20 54%, transparent);
  --ccn-tile: rgb(255 255 255 / .1);
  --ccn-tile-on: rgb(255 255 255 / .24);
  --ccn-orb: rgb(255 255 255 / .14);
  --ccn-orb-on: #fff; --ccn-orb-on-ink: #141416;
  --ccn-sheet: color-mix(in oklab, #24242a 92%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .2), 0 0 0 .5px rgb(255 255 255 / .12), 0 20px 48px rgb(0 0 0 / .5);
}
.ccn *, .ccn *::before, .ccn *::after { box-sizing: border-box }
.ccn::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5; padding: 1px;
  background: linear-gradient(150deg, rgb(255 255 255 / .9), rgb(255 255 255 / 0) 30%, rgb(255 255 255 / 0) 64%, rgb(255 255 255 / .5));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude }
:is(.dark, [data-theme="dark"]) .ccn::before { opacity: .45 }
.ccn :focus-visible { outline: 2px solid color-mix(in oklab, var(--ccn-accent) 65%, transparent); outline-offset: 2px }
.ccn-btn { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; text-align: inherit }

.ccn-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto 1fr; gap: 8px; transition: transform .5s var(--ccn-ease), opacity .4s ease, filter .4s ease }
.ccn[data-detail] .ccn-grid { transform: scale(.965); opacity: .5; filter: blur(2px) }
.ccn-slot { position: relative; min-width: 0 }
.ccn-slot[data-wide] { grid-column: 1 / -1 }
.ccn-tile { position: relative; border-radius: 22px; background: var(--ccn-tile); box-shadow: inset 0 1px 0 rgb(255 255 255 / .55), inset 0 0 0 .5px rgb(255 255 255 / .3); transition: background .3s ease, transform .2s var(--ccn-ease) }
:is(.dark, [data-theme="dark"]) .ccn-tile { box-shadow: inset 0 1px 0 rgb(255 255 255 / .12) }
.ccn-tile[data-on] { background: var(--ccn-tile-on) }
.ccn-main { display: flex; width: 100%; border-radius: 22px; text-align: left }
.ccn-main:active { transform: scale(.975) }
.ccn-slot[data-wide] .ccn-main { align-items: center; gap: 12px; padding: 12px 56px 12px 14px; height: 84px }
.ccn-slot:not([data-wide]) .ccn-main { flex-direction: column; justify-content: space-between; gap: 8px; padding: 12px 14px; height: 104px }
.ccn-orb { flex: none; width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; background: var(--ccn-orb); color: var(--ccn-t2); box-shadow: 0 1px 2px rgb(0 0 0 / .08); transition: background .3s ease, color .3s ease }
.ccn-tile[data-on] .ccn-orb { background: var(--ccn-orb-on); color: var(--ccn-orb-on-ink) }
.ccn-orb svg { width: 18px; height: 18px }
.ccn-text { display: flex; flex-direction: column; gap: 1px; min-width: 0 }
.ccn-title { font-size: 14px; line-height: 19px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ccn-status { font-size: 12px; line-height: 16px; color: var(--ccn-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.ccn-expand { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 999px; display: grid; place-items: center; color: var(--ccn-t2); transition: background .2s ease, color .2s ease }
.ccn-slot[data-wide] .ccn-expand { top: 26px }
.ccn-expand:hover { background: color-mix(in oklab, var(--ccn-ink) 8%, transparent); color: var(--ccn-t1) }
.ccn-expand svg { width: 14px; height: 14px }
.ccn-swap { display: inline-block; animation: ccn-swap .34s var(--ccn-ease) backwards }
@keyframes ccn-swap { from { opacity: 0; filter: blur(3px); transform: translateY(3px) } to { opacity: 1; filter: none; transform: none } }

.ccn-meters { display: flex; flex-direction: column; justify-content: space-evenly; gap: 14px; padding: 10px 6px 6px }
.ccn-mhead { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ccn-t2); margin-bottom: 8px }
.ccn-mhead svg { width: 16px; height: 16px; flex: none; color: var(--ccn-t1) }
.ccn-mlabel { flex: 1; font-size: 14px; line-height: 19px; color: var(--ccn-t1) }
.ccn-aa { font-size: 12px; font-weight: 600; color: var(--ccn-t1); letter-spacing: -.02em }
.ccn-mval { font-variant-numeric: tabular-nums; min-width: 3.4ch; text-align: right }
.ccn-meter { position: relative; height: 30px; touch-action: pan-y; cursor: grab; outline-offset: 3px; border-radius: 4px }
.ccn-meter[data-held] { cursor: grabbing }
.ccn-track { position: absolute; inset: 0; transition: transform .45s var(--ccn-ease); -webkit-mask: repeating-linear-gradient(90deg, #000 0 4px, transparent 4px 7px); mask: repeating-linear-gradient(90deg, #000 0 4px, transparent 4px 7px); background: color-mix(in oklab, var(--ccn-ink) 14%, transparent) }
.ccn-meter[data-held] .ccn-track { transition-duration: .18s }
.ccn-fill { position: absolute; inset: 0; transform-origin: 0 50%; background: color-mix(in oklab, var(--ccn-ink) 90%, transparent); will-change: transform }

/* Detail sheet: a rect that is lerped from the tile's box to the panel's inner box */
.ccn-sheet { position: absolute; z-index: 4; overflow: hidden; background: var(--ccn-sheet); box-shadow: 0 0 0 .5px rgb(0 0 0 / .05), 0 8px 30px rgb(0 0 0 / .1); will-change: left, top, width, height }
.ccn-sheet-in { position: absolute; left: 0; top: 0; padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 10px }
.ccn-dh { display: flex; align-items: center; gap: 10px }
.ccn-dh .ccn-title { flex: 1; font-size: 15px }
.ccn-close { width: 32px; height: 32px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in oklab, var(--ccn-ink) 7%, transparent); color: var(--ccn-t2) }
.ccn-close svg { width: 14px; height: 14px }
.ccn-tray { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; padding: 3px; border-radius: 12px; background: color-mix(in oklab, var(--ccn-ink) 7%, transparent) }
.ccn-tray-pill { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / var(--n, 3)); border-radius: 9px; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transform: translateX(calc(var(--i, 0) * 100%)); transition: transform .32s var(--ccn-ease) }
:is(.dark, [data-theme="dark"]) .ccn-tray-pill { background: rgb(255 255 255 / .2); box-shadow: none }
.ccn-mode { position: relative; z-index: 1; height: 30px; border-radius: 9px; font-size: 12.5px; font-weight: 500; color: var(--ccn-t2); text-align: center; transition: color .2s ease }
.ccn-mode[aria-checked="true"] { color: var(--ccn-t1) }
.ccn-desc { text-align: center; font-size: 12px; line-height: 16px; color: var(--ccn-t2); min-height: 16px }
.ccn-people { display: flex; justify-content: center; align-items: center; gap: 6px; font-size: 12px; color: var(--ccn-t2) }
.ccn-people img { width: 22px; height: 22px; border-radius: 999px; object-fit: cover; box-shadow: 0 0 0 1.5px var(--ccn-sheet) }

.ccn-dialwrap { display: grid; place-items: center }
.ccn-dial { position: relative; width: 156px; height: 156px; touch-action: none; cursor: grab; border-radius: 999px; outline-offset: 4px }
.ccn-dial[data-held] { cursor: grabbing }
.ccn-dial svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.ccn-dial-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none }
.ccn-big { font-size: 34px; line-height: 38px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums }
.ccn-big small { font-size: 13px; font-weight: 500; color: var(--ccn-t2); margin-left: 3px; letter-spacing: 0 }
.ccn-until { font-size: 12px; line-height: 16px; color: var(--ccn-t2) }
.ccn-cta { height: 44px; border-radius: 999px; background: var(--ccn-t1); color: var(--ccn-sheet); font-size: 14px; font-weight: 500; text-align: center; transition: transform .2s var(--ccn-ease), opacity .2s ease }
:is(.dark, [data-theme="dark"]) .ccn-cta { background: #fff; color: #111 }
.ccn-cta:active { transform: scale(.98) }
.ccn-actions { display: grid; grid-template-columns: auto 1fr; gap: 8px }
.ccn-actions[data-solo] { grid-template-columns: 1fr }
.ccn-ghost { height: 44px; padding: 0 18px; border-radius: 999px; font-size: 14px; font-weight: 500; text-align: center; color: var(--ccn-t1); background: color-mix(in oklab, var(--ccn-ink) 8%, transparent) }

.ccn-rows { display: flex; flex-direction: column }
.ccn-row { display: flex; align-items: center; gap: 12px; padding: 10px 2px; border-top: 1px solid var(--ccn-line) }
.ccn-row:first-child { border-top: 0 }
.ccn-row > div { flex: 1; min-width: 0 }
.ccn-row b { display: block; font-weight: 500; font-size: 14px; line-height: 19px }
.ccn-row span.d { display: block; font-size: 12px; line-height: 16px; color: var(--ccn-t2) }
.ccn-switch { position: relative; flex: none; width: 46px; height: 28px; border-radius: 999px; background: color-mix(in oklab, var(--ccn-ink) 16%, transparent); transition: background .25s ease }
.ccn-switch[aria-checked="true"] { background: #30b350 }
.ccn-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 999px; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / .25); transition: transform .3s var(--ccn-ease) }
.ccn-switch[aria-checked="true"]::after { transform: translateX(18px) }
.ccn-switch:active::after { width: 28px }
.ccn-switch[aria-checked="true"]:active::after { transform: translateX(14px) }

.ccn-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%) }

@media (prefers-reduced-transparency: reduce) {
  .ccn { -webkit-backdrop-filter: none; backdrop-filter: none; background: #eeeef1 }
  :is(.dark, [data-theme="dark"]) .ccn { background: #1f1f24 }
  .ccn-sheet { background: #f7f7f9 }
  :is(.dark, [data-theme="dark"]) .ccn-sheet { background: #26262c }
}
@media (max-width: 359px) { .ccn { padding: 8px } .ccn-dial { width: 146px; height: 146px } }
@media (prefers-reduced-motion: reduce) { .ccn *, .ccn *::before, .ccn *::after { animation: none !important; transition: none !important } }
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const MIN_MIN = 5
const MAX_MIN = 120

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)")
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/** The current wall-clock minute, as an external store so nothing reads the clock during render. */
const subscribeMinute = (cb: () => void) => {
  const id = setInterval(cb, 15000)
  return () => clearInterval(id)
}
const useMinute = () =>
  React.useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60000),
    () => 0,
  )

const defaultFormat = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

/** Text that blur-swaps when its value changes. */
function Swap({ children }: { children: React.ReactNode }) {
  return (
    <span key={typeof children === "string" || typeof children === "number" ? String(children) : undefined} className="ccn-swap">
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Meter                                    */
/* -------------------------------------------------------------------------- */

type MeterProps = {
  label: string
  icon?: React.ReactNode
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onLive: (v: number) => void
  onCommit: (v: number) => void
  lead?: React.ReactNode
}

/**
 * A segmented meter. The pointer drives it 1:1 from where it was grabbed, past either end it stretches with rubber-band
 * resistance, and a tap without a drag jumps to that spot. Frames write transforms directly; React only sees the commit.
 */
function Meter({ label, icon, value, min, max, step, format, onLive, onCommit, lead }: MeterProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const fillRef = React.useRef<HTMLDivElement>(null)
  const valRef = React.useRef<HTMLSpanElement>(null)
  const live = React.useRef(value)
  const st = React.useRef<{ id: number; grab: number; startX: number; moved: boolean; held: boolean } | null>(null)
  const liveCb = React.useRef(onLive)
  liveCb.current = onLive

  const frac = (v: number) => (v - min) / (max - min)
  const show = (v: number, over = 0) => {
    const f = clamp(frac(v), 0, 1)
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${f})`
    if (valRef.current) valRef.current.textContent = format(v)
    const el = ref.current
    if (el) {
      el.setAttribute("aria-valuenow", String(v))
      el.setAttribute("aria-valuetext", format(v))
    }
    const tr = trackRef.current
    if (tr) {
      const s = Math.abs(over)
      tr.style.transformOrigin = over < 0 ? "100% 50%" : "0 50%"
      tr.style.transform = `scale(${1 + s * 0.045}, ${st.current?.held ? 1.07 : 1})`
    }
  }
  React.useLayoutEffect(() => {
    live.current = value
    show(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max])

  const quant = (f: number) => clamp(Math.round((min + f * (max - min)) / step) * step, min, max)
  const rubber = (x: number) => (x < 0 ? -(1 - 1 / (-x * 0.9 + 1)) : x > 1 ? 1 - 1 / ((x - 1) * 0.9 + 1) : 0)

  const move = (clientX: number) => {
    const el = ref.current
    const s = st.current
    if (!el || !s) return
    const r = el.getBoundingClientRect()
    const raw = (clientX - r.left) / r.width - s.grab
    const over = rubber(raw)
    const v = quant(clamp(raw, 0, 1))
    if (v !== live.current) {
      live.current = v
      liveCb.current(v)
    }
    show(live.current, over)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const el = ref.current!
    const r = el.getBoundingClientRect()
    st.current = { id: e.pointerId, grab: (e.clientX - r.left) / r.width - frac(live.current), startX: e.clientX, moved: false, held: true }
    el.setPointerCapture(e.pointerId)
    el.setAttribute("data-held", "")
    show(live.current)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    if (!s.moved && Math.abs(e.clientX - s.startX) < 3) return
    s.moved = true
    move(e.clientX)
  }
  const end = (e: React.PointerEvent) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    const el = ref.current!
    if (!s.moved) {
      // a tap jumps to that spot
      const r = el.getBoundingClientRect()
      const v = quant(clamp((e.clientX - r.left) / r.width, 0, 1))
      live.current = v
      liveCb.current(v)
    }
    st.current = null
    el.removeAttribute("data-held")
    show(live.current)
    onCommit(live.current)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    let v = live.current
    const big = step * 4
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v += step
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= step
    else if (e.key === "PageUp") v += big
    else if (e.key === "PageDown") v -= big
    else if (e.key === "Home") v = min
    else if (e.key === "End") v = max
    else return
    e.preventDefault()
    v = clamp(v, min, max)
    if (v === live.current) return
    live.current = v
    show(v)
    liveCb.current(v)
    onCommit(v)
  }

  return (
    <div>
      <div className="ccn-mhead">
        {icon}
        <span className="ccn-mlabel">{label}</span>
        {lead}
        <span ref={valRef} className="ccn-mval" aria-hidden="true" />
      </div>
      <div
        ref={ref}
        className="ccn-meter"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
      >
        <div ref={trackRef} className="ccn-track">
          <div ref={fillRef} className="ccn-fill" />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Dial                                    */
/* -------------------------------------------------------------------------- */

const R_ARC = 72
const normDelta = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180
const elastic = (x: number) => 4 * (1 - Math.exp(-x / 6))

/**
 * A duration dial: 120 minutes is one full turn. It keeps counting across twelve o'clock, resists past 5 and 120, and
 * snaps to 5 minute steps on release. The arc and knob are written straight to the SVG; React only holds whole minutes.
 */
function Dial({ minutes, onMinutes, label }: { minutes: number; onMinutes: (m: number) => void; label: (m: number) => string }) {
  const reduce = useReducedMotion()
  const dialRef = React.useRef<HTMLDivElement>(null)
  const arcRef = React.useRef<SVGCircleElement>(null)
  const knobRef = React.useRef<SVGCircleElement>(null)
  const disp = React.useRef(minutes)
  const raw = React.useRef(minutes)
  const drag = React.useRef<{ id: number; last: number } | null>(null)
  const tween = React.useRef(0)

  const draw = (m: number) => {
    const deg = m * 3
    arcRef.current?.setAttribute("stroke-dasharray", `${Math.max(0, deg)} 360`)
    const a = ((deg - 90) * Math.PI) / 180
    knobRef.current?.setAttribute("cx", String(82 + R_ARC * Math.cos(a)))
    knobRef.current?.setAttribute("cy", String(82 + R_ARC * Math.sin(a)))
  }
  const glideTo = (to: number) => {
    cancelAnimationFrame(tween.current)
    if (reduce) {
      disp.current = to
      draw(to)
      return
    }
    let last = performance.now()
    let v = 0
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = 420
      const c = 2 * Math.sqrt(k) * 0.8
      v += (-k * (disp.current - to) - c * v) * dt
      disp.current += v * dt
      draw(disp.current)
      if (Math.abs(disp.current - to) < 0.02 && Math.abs(v) < 0.2) {
        disp.current = to
        draw(to)
        return
      }
      tween.current = requestAnimationFrame(step)
    }
    tween.current = requestAnimationFrame(step)
  }
  React.useLayoutEffect(() => {
    if (drag.current) return
    raw.current = minutes
    glideTo(minutes)
    return () => cancelAnimationFrame(tween.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes])

  const angleOf = (e: React.PointerEvent) => {
    const r = dialRef.current!.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    return { a: (Math.atan2(dy, dx) * 180) / Math.PI + 90, rad: Math.hypot(dx, dy) }
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    cancelAnimationFrame(tween.current)
    const { a, rad } = angleOf(e)
    const knobA = disp.current * 3
    const diff = normDelta(a - knobA)
    // grabbing away from the knob (or in the middle) moves it there, keeping the turn count continuous
    if (Math.abs(diff) > 22 || rad < 28) raw.current = disp.current + diff / 3
    drag.current = { id: e.pointerId, last: a }
    dialRef.current!.setPointerCapture(e.pointerId)
    dialRef.current!.setAttribute("data-held", "")
    apply()
  }
  const apply = () => {
    const r = raw.current
    const d = r < MIN_MIN ? MIN_MIN - elastic(MIN_MIN - r) : r > MAX_MIN ? MAX_MIN + elastic(r - MAX_MIN) : r
    disp.current = d
    draw(d)
    const m = clamp(Math.round(d), MIN_MIN, MAX_MIN)
    if (m !== minutesRef.current) onMinutes(m)
  }
  const minutesRef = React.useRef(minutes)
  minutesRef.current = minutes
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const { a } = angleOf(e)
    raw.current += normDelta(a - d.last) / 3
    d.last = a
    apply()
  }
  const end = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    dialRef.current!.removeAttribute("data-held")
    const snapped = clamp(Math.round(raw.current / 5) * 5, MIN_MIN, MAX_MIN)
    raw.current = snapped
    onMinutes(snapped)
    glideTo(snapped)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    let m = minutes
    if (e.key === "ArrowRight" || e.key === "ArrowUp") m += 5
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") m -= 5
    else if (e.key === "PageUp") m += 15
    else if (e.key === "PageDown") m -= 15
    else if (e.key === "Home") m = MIN_MIN
    else if (e.key === "End") m = MAX_MIN
    else return
    e.preventDefault()
    onMinutes(clamp(m, MIN_MIN, MAX_MIN))
  }

  const ticks = React.useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const a = ((i * 6 - 90) * Math.PI) / 180
        const major = i % 5 === 0
        const r1 = major ? 58 : 61
        const r2 = 65
        return <line key={i} x1={82 + r1 * Math.cos(a)} y1={82 + r1 * Math.sin(a)} x2={82 + r2 * Math.cos(a)} y2={82 + r2 * Math.sin(a)} strokeWidth={major ? 1.6 : 1} opacity={major ? 0.34 : 0.2} />
      }),
    [],
  )

  return (
    <div className="ccn-dialwrap">
      <div
        ref={dialRef}
        className="ccn-dial"
        role="slider"
        tabIndex={0}
        aria-label="Session length"
        aria-valuemin={MIN_MIN}
        aria-valuemax={MAX_MIN}
        aria-valuenow={minutes}
        aria-valuetext={label(minutes)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="0 0 164 164" aria-hidden="true">
          <circle cx="82" cy="82" r="80" fill="color-mix(in oklab, var(--ccn-ink) 3%, transparent)" stroke="color-mix(in oklab, var(--ccn-ink) 7%, transparent)" strokeWidth="1" />
          <g stroke="var(--ccn-ink)" strokeLinecap="round">{ticks}</g>
          <circle ref={arcRef} cx="82" cy="82" r={R_ARC} fill="none" stroke="var(--ccn-t1)" strokeWidth="3" strokeLinecap="round" pathLength={360} transform="rotate(-90 82 82)" strokeDasharray={`${minutes * 3} 360`} />
          <circle ref={knobRef} r="8" cx={82 + R_ARC * Math.cos(((minutes * 3 - 90) * Math.PI) / 180)} cy={82 + R_ARC * Math.sin(((minutes * 3 - 90) * Math.PI) / 180)} fill="#fff" stroke="var(--ccn-t1)" strokeWidth="2.5" style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / .25))" }} />
        </svg>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type DetailKind = "focus" | "notifications"
type Rect = { l: number; t: number; w: number; h: number }

/**
 * A quick-settings panel in frosted glass: a focus session tile with a duration dial, notification channels, a presenting
 * toggle and two rubber-banded meters. Tiles with a chevron grow into a detail sheet (one rect interpolated by a spring
 * from the tile's box to the panel's), and the grid behind goes inert.
 */
export function ControlCenter({ focusModes = DEFAULT_MODES, channels = DEFAULT_CHANNELS, people = [], defaultVolume = 60, defaultTextSize = 100, formatTime = defaultFormat, onStateChange, label = "Quick settings", className }: ControlCenterProps) {
  const reduce = useReducedMotion()
  const minute = useMinute()
  const [state, setState] = React.useState<ControlCenterState>(() => ({
    focus: null,
    notifications: true,
    channels: Object.fromEntries(channels.map((c) => [c.id, !!c.defaultOn])),
    presenting: false,
    volume: clamp(defaultVolume, 0, 100),
    textSize: clamp(defaultTextSize, 85, 130),
  }))
  const stateRef = React.useRef(state)
  const cbRef = React.useRef(onStateChange)
  cbRef.current = onStateChange
  const commit = (patch: Partial<ControlCenterState>) => {
    const next = { ...stateRef.current, ...patch }
    stateRef.current = next
    setState(next)
    cbRef.current?.(next)
  }
  /** Meter drags report each step without re-rendering the panel. */
  const live = (patch: Partial<ControlCenterState>) => {
    stateRef.current = { ...stateRef.current, ...patch }
    cbRef.current?.(stateRef.current)
  }

  // detail sheet
  const [detail, setDetail] = React.useState<DetailKind | null>(null)
  const [sheetKind, setSheetKind] = React.useState<DetailKind | null>(null)
  const [modeId, setModeId] = React.useState(focusModes[0]?.id ?? "")
  const [minutes, setMinutes] = React.useState(focusModes[0]?.defaultMinutes ?? 50)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const sheetInRef = React.useRef<HTMLDivElement>(null)
  const slotRefs = React.useRef<Record<DetailKind, HTMLDivElement | null>>({ focus: null, notifications: null })
  const opener = React.useRef<HTMLElement | null>(null)
  const sim = React.useRef({ p: 0, v: 0, t: 0, from: { l: 0, t: 0, w: 0, h: 0 } as Rect, to: { l: 0, t: 0, w: 0, h: 0 } as Rect, raf: 0, last: 0 })
  const [live1, setLive1] = React.useState("")

  const paintSheet = () => {
    const s = sim.current
    const el = sheetRef.current
    if (!el) return
    const p = s.p
    el.style.left = `${lerp(s.from.l, s.to.l, p)}px`
    el.style.top = `${lerp(s.from.t, s.to.t, p)}px`
    el.style.width = `${lerp(s.from.w, s.to.w, p)}px`
    el.style.height = `${lerp(s.from.h, s.to.h, p)}px`
    el.style.borderRadius = `${lerp(22, 24, clamp(p, 0, 1))}px`
    el.style.opacity = String(clamp(p * 6, 0, 1))
    const inn = sheetInRef.current
    if (inn) {
      inn.style.opacity = String(clamp((p - 0.3) / 0.5, 0, 1))
      inn.style.width = `${s.to.w}px`
    }
  }
  const sheetFrame = (now: number) => {
    const s = sim.current
    let dt = Math.min(0.05, (now - s.last) / 1000)
    s.last = now
    const k = 260
    const c = 2 * Math.sqrt(k) * 0.98
    while (dt > 0) {
      const h = Math.min(1 / 240, dt)
      s.v += (-k * (s.p - s.t) - c * s.v) * h
      s.p += s.v * h
      dt -= h
    }
    paintSheet()
    if (Math.abs(s.p - s.t) < 0.0008 && Math.abs(s.v) < 0.01) {
      s.p = s.t
      s.v = 0
      paintSheet()
      s.raf = 0
      if (s.t === 0) setSheetKind(null)
      return
    }
    s.raf = requestAnimationFrame(sheetFrame)
  }
  const wakeSheet = () => {
    const s = sim.current
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(sheetFrame)
  }
  React.useEffect(() => {
    const s = sim.current
    return () => {
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  // Measure the tile and panel boxes when a sheet mounts, then spring open
  React.useLayoutEffect(() => {
    if (!sheetKind) return
    const panel = panelRef.current
    const slot = slotRefs.current[sheetKind]
    if (!panel || !slot) return
    const pr = panel.getBoundingClientRect()
    const sr = slot.getBoundingClientRect()
    const s = sim.current
    // the panel may be mid-scale; use layout sizes for the target and the slot's offset for the origin
    s.from = { l: sr.left - pr.left, t: sr.top - pr.top, w: sr.width, h: sr.height }
    s.to = { l: 10, t: 10, w: panel.clientWidth - 20, h: panel.clientHeight - 20 }
    s.t = 1
    if (reduce) {
      s.p = 1
      paintSheet()
    } else {
      s.p = 0
      paintSheet()
      wakeSheet()
    }
    // focus the first control once the sheet is in
    const t = setTimeout(() => sheetInRef.current?.querySelector<HTMLElement>("[data-first], button, [role=slider]")?.focus({ preventScroll: true }), reduce ? 0 : 180)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetKind])

  const openDetail = (kind: DetailKind, from: HTMLElement | null) => {
    opener.current = from
    setSheetKind(kind)
    setDetail(kind)
  }
  const closeDetail = (restore = true) => {
    const s = sim.current
    setDetail(null)
    s.t = 0
    if (reduce) {
      s.p = 0
      paintSheet()
      setSheetKind(null)
    } else wakeSheet()
    if (restore) opener.current?.focus({ preventScroll: true })
  }

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (!detail) return
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      closeDetail()
    } else if (e.key === "Tab") {
      const nodes = Array.from(sheetInRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [role=slider], [tabindex='0']") ?? [])
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  /* ---------------------------------- state -------------------------------- */

  const mode = focusModes.find((m) => m.id === state.focus?.mode)
  const onChannels = channels.filter((c) => state.channels[c.id]).length
  const startSession = () => {
    const m = focusModes.find((x) => x.id === modeId) ?? focusModes[0]
    if (!m) return
    const end = new Date(Date.now() + minutes * 60000)
    commit({ focus: { mode: m.id, minutes, until: formatTime(end) } })
    closeDetail()
  }
  const tapFocus = () => {
    if (state.focus) return commit({ focus: null })
    const m = focusModes[0]
    if (!m) return
    setModeId(m.id)
    setMinutes(m.defaultMinutes)
    commit({ focus: { mode: m.id, minutes: m.defaultMinutes, until: formatTime(new Date(Date.now() + m.defaultMinutes * 60000)) } })
  }
  const pickMode = (id: string) => {
    setModeId(id)
    const m = focusModes.find((x) => x.id === id)
    if (m) setMinutes(m.defaultMinutes)
  }
  const sheetUntil = formatTime(new Date((minute + minutes) * 60000))
  const FocusIcon = mode?.icon ?? Headphones

  const Tile = ({ kind, wide, on, icon, title, status, expandLabel, onToggle, onExpand }: { kind: string; wide?: boolean; on: boolean; icon: React.ReactNode; title: string; status: React.ReactNode; expandLabel?: string; onToggle: () => void; onExpand?: (el: HTMLElement) => void }) => (
    <div className="ccn-slot" data-wide={wide ? "" : undefined} ref={(el) => { if (kind === "focus" || kind === "notifications") slotRefs.current[kind] = el }}>
      <div className="ccn-tile" data-on={on ? "" : undefined}>
        <button type="button" className="ccn-btn ccn-main" aria-pressed={on} onClick={onToggle}>
          <span className="ccn-orb">{icon}</span>
          <span className="ccn-text">
            <span className="ccn-title">{title}</span>
            <span className="ccn-status">{status}</span>
          </span>
        </button>
        {onExpand && (
          <button type="button" className="ccn-btn ccn-expand" aria-haspopup="dialog" aria-label={expandLabel} onClick={(e) => onExpand(e.currentTarget)}>
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  )

  const sheetTitle = sheetKind === "focus" ? "Focus" : "Notifications"

  return (
    <section ref={panelRef} className={`ccn${className ? ` ${className}` : ""}`} aria-label={label} data-detail={detail ? "" : undefined} onKeyDown={onPanelKeyDown}>
      <style href="ccn" precedence="default">{CSS}</style>
      <div className="ccn-grid" inert={!!detail}>
        {Tile({
          kind: "focus",
          wide: true,
          on: !!state.focus,
          icon: <FocusIcon />,
          title: state.focus && mode ? mode.label : "Focus",
          status: <Swap>{state.focus ? `Until ${state.focus.until}` : "Off"}</Swap>,
          expandLabel: "Focus details",
          onToggle: tapFocus,
          onExpand: (el) => openDetail("focus", el),
        })}
        {Tile({
          kind: "notifications",
          on: state.notifications,
          icon: <Bell />,
          title: "Notifications",
          status: <Swap>{state.notifications ? `${onChannels} of ${channels.length} channels` : "Off"}</Swap>,
          expandLabel: "Notification channels",
          onToggle: () => commit({ notifications: !state.notifications }),
          onExpand: (el) => openDetail("notifications", el),
        })}
        {Tile({ kind: "presenting", on: state.presenting, icon: <Presentation />, title: "Presenting", status: <Swap>{state.presenting ? "On" : "Off"}</Swap>, onToggle: () => commit({ presenting: !state.presenting }) })}
        <div className="ccn-slot ccn-meters" data-wide="">
          <Meter label="Alert volume" icon={<Volume2 />} min={0} max={100} step={1} value={state.volume} format={(v) => `${v}%`} onLive={(v) => live({ volume: v })} onCommit={(v) => commit({ volume: v })} />
          <Meter label="Text size" icon={<Type />} lead={<span className="ccn-aa" aria-hidden="true">Aa</span>} min={85} max={130} step={5} value={state.textSize} format={(v) => `${v}%`} onLive={(v) => live({ textSize: v })} onCommit={(v) => commit({ textSize: v })} />
        </div>
      </div>

      {sheetKind && (
        <div ref={sheetRef} className="ccn-sheet" role="dialog" aria-modal="true" aria-label={sheetTitle} style={{ opacity: 0 }}>
          <div ref={sheetInRef} className="ccn-sheet-in" style={{ opacity: 0 }}>
            <div className="ccn-dh">
              <span className="ccn-orb" style={{ background: "var(--ccn-orb-on)", color: "var(--ccn-orb-on-ink)" }}>{sheetKind === "focus" ? <Headphones /> : <Bell />}</span>
              <span className="ccn-title">{sheetTitle}</span>
              <button type="button" className="ccn-btn ccn-close" aria-label={`Close ${sheetTitle.toLowerCase()}`} onClick={() => closeDetail()}>
                <X />
              </button>
            </div>
            {sheetKind === "focus" ? (
              <>
                <div className="ccn-tray" role="radiogroup" aria-label="Focus mode" style={{ "--n": focusModes.length, "--i": Math.max(0, focusModes.findIndex((m) => m.id === modeId)) } as React.CSSProperties}>
                  <span className="ccn-tray-pill" aria-hidden="true" />
                  {focusModes.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={m.id === modeId}
                      tabIndex={m.id === modeId ? 0 : -1}
                      className="ccn-btn ccn-mode"
                      onClick={() => pickMode(m.id)}
                      onKeyDown={(e) => {
                        const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
                        if (!d) return
                        e.preventDefault()
                        const next = focusModes[(i + d + focusModes.length) % focusModes.length]
                        pickMode(next.id)
                        ;(e.currentTarget.parentElement?.querySelectorAll("[role=radio]")[(i + d + focusModes.length) % focusModes.length] as HTMLElement)?.focus()
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="ccn-desc"><Swap>{focusModes.find((m) => m.id === modeId)?.description ?? ""}</Swap></div>
                <div style={{ position: "relative" }}>
                  <Dial minutes={minutes} onMinutes={setMinutes} label={(m) => `${m} minutes, until ${formatTime(new Date((minute + m) * 60000))}`} />
                  <div className="ccn-dial-center" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }} aria-hidden="true">
                    <div className="ccn-big">{minutes}<small>min</small></div>
                    <div className="ccn-until">Until {sheetUntil}</div>
                  </div>
                </div>
                {people.length > 0 && (
                  <div className="ccn-people">
                    <span>Can reach you</span>
                    {people.slice(0, 5).map((p) => (
                      <img key={p.id} src={p.avatar} alt={p.name} title={p.name} />
                    ))}
                  </div>
                )}
                <div className="ccn-actions" data-solo={state.focus ? undefined : ""}>
                  {state.focus && (
                    <button type="button" className="ccn-btn ccn-ghost" onClick={() => { commit({ focus: null }); closeDetail() }}>End</button>
                  )}
                  <button type="button" className="ccn-btn ccn-cta" data-first onClick={startSession}>
                    {state.focus ? "Update session" : "Start session"}
                  </button>
                </div>
              </>
            ) : (
              <div className="ccn-rows" role="group" aria-label="Channels">
                {channels.map((c, i) => (
                  <div key={c.id} className="ccn-row">
                    <div>
                      <b id={`ccn-ch-${c.id}`}>{c.label}</b>
                      {c.description && <span className="d">{c.description}</span>}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!state.channels[c.id]}
                      aria-labelledby={`ccn-ch-${c.id}`}
                      className="ccn-btn ccn-switch"
                      data-first={i === 0 ? "" : undefined}
                      onClick={() => {
                        const on = !state.channels[c.id]
                        commit({ channels: { ...state.channels, [c.id]: on }, notifications: on ? true : state.notifications })
                        setLive1(`${c.label} ${on ? "on" : "off"}`)
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="ccn-live" aria-live="polite">{live1}</div>
    </section>
  )
}

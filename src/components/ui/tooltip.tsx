"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TooltipSide = "top" | "bottom" | "left" | "right"

export type TooltipItem = {
  id: string
  /** The tip text and the button's accessible name. */
  label: string
  /** Keys shown as chips, e.g. "⌘ R" or ["⌘", "R"]. */
  shortcut?: string | string[]
  /** A 16px line icon. Defaults to a small set drawn for the built-in toolbar. */
  icon?: React.ReactNode
}

export type TooltipProps = {
  /**
   * Wrapper mode: the one control the tip belongs to. Leave it out and the piece shows its own toolbar of icon buttons,
   * which plays the decisive moment (the first tip waits, the next ones are already there) until you touch it.
   */
  children?: React.ReactElement
  /** Wrapper mode: the tip text. */
  content?: React.ReactNode
  /** Wrapper mode: keys shown as chips next to the text. A string splits on spaces ("⌘ ⇧ K"). */
  shortcut?: string | string[]
  /** Which side of the control the tip prefers. It flips when there is no room. Default "top". */
  side?: TooltipSide
  /** Milliseconds the first tip waits for hover intent. Default 400. */
  delay?: number
  /** A tip that opens within this many milliseconds of another one closing opens at once, with no animation. Default 300. */
  skipDelay?: number
  /** Never show the tip. */
  disabled?: boolean
  /** Stable id for the tip element (and aria-describedby). Generated when left out. */
  id?: string
  /** Wrapper mode: called when the tip opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Toolbar mode: the buttons. Defaults to eight agent controls. */
  items?: TooltipItem[]
  /** Toolbar mode: heading of the card. */
  title?: string
  /** Toolbar mode: line under the heading. */
  subtitle?: string
  /** Toolbar mode: called when a button is pressed. */
  onSelect?: (item: TooltipItem) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
:is(.tlt, .tlt-tip) {
  --tlt-ink: #000;
  --tlt-surface: #fff;
  --tlt-accent: #0060e2;
  --tlt-t1: color-mix(in oklab, var(--tlt-ink) 88%, transparent);
  --tlt-t2: color-mix(in oklab, var(--tlt-ink) 61%, transparent);
  --tlt-t3: color-mix(in oklab, var(--tlt-ink) 55%, transparent);
  --tlt-t4: color-mix(in oklab, var(--tlt-ink) 27%, transparent);
  --tlt-fill: color-mix(in oklab, var(--tlt-ink) 6%, transparent);
  --tlt-line: color-mix(in oklab, var(--tlt-ink) 6%, transparent);
  --tlt-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --tlt-tipbg: #1c1c1e;
  --tlt-tipfg: rgb(255 255 255 / .94);
  --tlt-tipkey: rgb(255 255 255 / .14);
  --tlt-tipkeyfg: rgb(255 255 255 / .72);
  --tlt-tipshadow: 0 0 0 .5px rgb(0 0 0 / .4), 0 1px 2px rgb(0 0 0 / .2), 0 8px 20px -6px rgb(0 0 0 / .28);
  --tlt-tipr: 9px;
  --tlt-ease: cubic-bezier(.22, 1, .36, 1);
}
:is(.dark, [data-theme="dark"]) :is(.tlt, .tlt-tip) {
  --tlt-ink: #fff;
  --tlt-surface: #1c1c1e;
  --tlt-accent: #4d8dff;
  --tlt-t1: color-mix(in oklab, var(--tlt-ink) 90%, transparent);
  --tlt-t2: color-mix(in oklab, var(--tlt-ink) 62%, transparent);
  --tlt-t3: color-mix(in oklab, var(--tlt-ink) 46%, transparent);
  --tlt-t4: color-mix(in oklab, var(--tlt-ink) 28%, transparent);
  --tlt-fill: color-mix(in oklab, var(--tlt-ink) 8%, transparent);
  --tlt-line: color-mix(in oklab, var(--tlt-ink) 9%, transparent);
  --tlt-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
  --tlt-tipbg: #3a3a40;
  --tlt-tipfg: rgb(255 255 255 / .94);
  --tlt-tipkey: rgb(255 255 255 / .12);
  --tlt-tipkeyfg: rgb(255 255 255 / .66);
  --tlt-tipshadow: 0 0 0 .5px rgb(255 255 255 / .14), 0 1px 2px rgb(0 0 0 / .4), 0 8px 20px -6px rgb(0 0 0 / .5);
}
html[data-style="mono"] :is(.tlt, .tlt-tip) {
  --tlt-ink: #000; --tlt-surface: #fff; --tlt-accent: #111; --tlt-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --tlt-tipbg: #000; --tlt-tipfg: #fff; --tlt-tipkey: rgb(255 255 255 / .2); --tlt-tipkeyfg: rgb(255 255 255 / .8);
  --tlt-tipshadow: none; --tlt-tipr: 3px;
  --tlt-ease: cubic-bezier(.2, .9, .1, 1); --tlt-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark :is(.tlt, .tlt-tip) {
  --tlt-ink: #fff; --tlt-surface: #0a0a0a; --tlt-accent: #f2f2f2; --tlt-shadow: 0 0 0 1px rgb(255 255 255 / .16);
  --tlt-tipbg: #f2f2f2; --tlt-tipfg: #000; --tlt-tipkey: rgb(0 0 0 / .14); --tlt-tipkeyfg: rgb(0 0 0 / .7);
}
html[data-style="glass"] :is(.tlt, .tlt-tip) {
  --tlt-ink: var(--pane-ink); --tlt-surface: var(--pane-solid); --tlt-accent: var(--pane-accent); --tlt-shadow: var(--pane-shadow);
  --tlt-ease: var(--pane-ease); --tlt-font: var(--pane-font);
  --tlt-t1: var(--pane-t1); --tlt-t2: var(--pane-t2); --tlt-t3: var(--pane-t3); --tlt-t4: var(--pane-t4);
  --tlt-tipbg: rgb(255 255 255 / .62); --tlt-tipfg: var(--pane-t1); --tlt-tipkey: rgb(10 14 26 / .09); --tlt-tipkeyfg: var(--pane-t2);
  --tlt-tipshadow: inset 0 0 0 .5px rgb(255 255 255 / .8), inset 1px 1px 0 -.5px rgb(255 255 255 / 1), 0 0 0 .5px rgb(30 40 90 / .16), 0 6px 18px -6px rgb(30 40 100 / .3);
}
html[data-style="glass"].dark :is(.tlt, .tlt-tip) {
  --tlt-tipbg: rgb(40 40 48 / .62); --tlt-tipkey: rgb(255 255 255 / .12);
  --tlt-tipshadow: inset 0 0 0 .5px rgb(255 255 255 / .2), inset 1px 1px 0 -.5px rgb(255 255 255 / .3), 0 0 0 .5px rgb(0 0 0 / .5), 0 6px 18px -6px rgb(0 0 0 / .55);
}
html[data-style="glass"] .tlt-body { -webkit-backdrop-filter: blur(16px) saturate(1.9); backdrop-filter: blur(16px) saturate(1.9) }
html[data-style="glass"] .tlt-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .tlt-body, html[data-style="glass"] .tlt-card { -webkit-backdrop-filter: none; backdrop-filter: none }
  html[data-style="glass"] .tlt-body { background-color: var(--pane-tint-float) }
}

/* The tip. It lives in a portal, so it carries its own tokens and a fixed position. */
.tlt-tip { position: fixed; left: 0; top: 0; z-index: 1000; pointer-events: none; font: 13px/18px var(--tlt-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); -webkit-font-smoothing: antialiased }
.tlt-tip *, .tlt-tip *::before, .tlt-tip *::after { box-sizing: border-box }
.tlt-body {
  display: flex; align-items: center; gap: 8px; width: max-content; max-width: min(280px, calc(100vw - 16px)); padding: 5px 8px; border-radius: var(--tlt-tipr);
  background: var(--tlt-tipbg); color: var(--tlt-tipfg); box-shadow: var(--tlt-tipshadow); font-weight: 500; transform-origin: var(--tlt-ox, 50%) var(--tlt-oy, 100%);
}
.tlt-tip[data-state="open"] .tlt-body { animation: tlt-in .16s var(--tlt-ease) backwards }
.tlt-tip[data-state="open"][data-instant] .tlt-body { animation: none }
.tlt-tip[data-state="closed"] .tlt-body { animation: tlt-out .1s var(--tlt-ease) forwards }
.tlt-text { min-width: 0; overflow-wrap: anywhere }
.tlt-keys { display: inline-flex; gap: 3px; flex: none }
.tlt-key {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 5px; background: var(--tlt-tipkey); color: var(--tlt-tipkeyfg);
  font: inherit; font-size: 12px; line-height: 1; font-weight: 500; font-variant-numeric: tabular-nums;
}
.tlt-a { display: inline-flex }
@keyframes tlt-in { from { opacity: 0; transform: scale(.96); filter: blur(3px) } }
@keyframes tlt-out { to { opacity: 0; transform: scale(.98) } }

/* The built-in toolbar */
.tlt { position: relative; container-type: inline-size; width: 100%; max-width: 360px; font: 13px/20px var(--tlt-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); color: var(--tlt-t1); -webkit-font-smoothing: antialiased; text-align: left }
.tlt *, .tlt *::before, .tlt *::after { box-sizing: border-box }
:where(.tlt) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.tlt) p { margin: 0 }
.tlt button:focus-visible { outline: 2px solid var(--tlt-accent); outline-offset: 2px }
.tlt-card { --tlt-pad: 20px; border-radius: 24px; background: var(--tlt-surface); box-shadow: var(--tlt-shadow); padding: 20px var(--tlt-pad) var(--tlt-pad); position: relative }
.tlt-title { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--tlt-t1) }
.tlt-sub { color: var(--tlt-t2) }
.tlt-zone { position: relative; display: flex; justify-content: center; padding-top: 52px }
.tlt-bar { display: inline-flex; gap: 2px; padding: 3px; border-radius: 13px; background: var(--tlt-fill) }
.tlt-btn {
  display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: var(--tlt-t2);
  transition: background-color .16s var(--tlt-ease), color .16s var(--tlt-ease), transform .16s var(--tlt-ease);
}
.tlt-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round }
.tlt-btn:active { transform: scale(.94) }
.tlt-a[data-hot] > .tlt-btn, .tlt-btn:hover { background: var(--tlt-surface); color: var(--tlt-t1); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--tlt-ink) 8%, transparent), 0 1px 2px rgb(0 0 0 / .06) }
.tlt-cursor { position: absolute; left: 0; top: 0; width: 18px; height: 22px; pointer-events: none; opacity: 0; transition: transform .5s var(--tlt-ease), opacity .3s var(--tlt-ease); z-index: 2 }
.tlt-cursor[data-on] { opacity: 1 }
.tlt-cursor path { fill: #000; stroke: #fff; stroke-width: 1.2; stroke-linejoin: round }
:is(.dark, [data-theme="dark"]) .tlt-cursor path { fill: #fff; stroke: #000 }
.tlt-read { margin-top: 24px; display: flex; flex-direction: column; gap: 2px }
.tlt-cap { color: var(--tlt-t3) }
.tlt-num { display: flex; align-items: baseline; gap: 6px; height: 56px; font-size: 56px; line-height: 56px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; color: var(--tlt-t4); transition: color .3s var(--tlt-ease) }
.tlt-num[data-live] { color: var(--tlt-t1) }
.tlt-num > span { animation: tlt-pop .32s var(--tlt-ease) backwards }
.tlt-num > i { font-style: normal; font-size: 20px; line-height: 20px; letter-spacing: 0; font-weight: 500; color: var(--tlt-t3) }
.tlt-why { color: var(--tlt-t2); animation: tlt-pop .32s var(--tlt-ease) backwards }
@keyframes tlt-pop { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }

@container (max-width: 340px) {
  .tlt-card { --tlt-pad: 16px }
  .tlt-btn { width: 32px; height: 32px }
  .tlt-num { font-size: 48px; height: 48px; line-height: 48px }
}
@media (pointer: coarse) { .tlt-btn { width: 40px; height: 40px } }
@media (prefers-reduced-motion: reduce) {
  .tlt *, .tlt *::before, .tlt *::after, .tlt-tip *, .tlt-tip *::before, .tlt-tip *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                         Shared state of a tooltip group                    */
/* -------------------------------------------------------------------------- */

/**
 * One store per group. It owns the only timer, so "wait for intent" and "already warm" are decided in one place:
 * a tip opens at once when another is open, or when one closed less than `skip` ms ago. Otherwise it waits `delay`.
 */
type Store = {
  openId: string | null
  /** True when the open tip skipped the delay, so it appears with no animation. */
  instant: boolean
  /** How long the open tip waited for, in ms. */
  waited: number
  /** Bumps on every open, so a readout can react to repeats. */
  seq: number
  pending: string | null
  enter: (id: string, delay: number, skip: number, immediate?: boolean) => void
  leave: (id: string) => void
  clear: () => void
  subscribe: (cb: () => void) => () => void
}

function createStore(): Store {
  const subs = new Set<() => void>()
  let timer = 0
  let lastClose = -1e9
  let startedAt = 0
  const emit = () => subs.forEach((f) => f())
  const s: Store = {
    openId: null,
    instant: false,
    waited: 0,
    seq: 0,
    pending: null,
    enter(id, delay, skip, immediate) {
      if (s.openId === id) return
      window.clearTimeout(timer)
      const now = performance.now()
      const warm = s.openId !== null || now - lastClose < skip
      const open = (instant: boolean, waited: number) => {
        s.pending = null
        s.openId = id
        s.instant = instant
        s.waited = waited
        s.seq++
        emit()
      }
      if (warm || immediate || delay <= 0) {
        open(warm, 0)
        return
      }
      s.pending = id
      startedAt = now
      timer = window.setTimeout(() => open(false, Math.round(performance.now() - startedAt)), delay)
    },
    leave(id) {
      if (s.pending === id) {
        window.clearTimeout(timer)
        s.pending = null
      }
      if (s.openId === id) {
        s.openId = null
        s.instant = false
        lastClose = performance.now()
        emit()
      }
    },
    clear() {
      window.clearTimeout(timer)
      s.pending = null
      if (s.openId !== null) {
        s.openId = null
        s.instant = false
        lastClose = performance.now()
        emit()
      }
    },
    subscribe(cb) {
      subs.add(cb)
      return () => subs.delete(cb)
    },
  }
  return s
}

type Ctx = { store: Store; delay: number; skipDelay: number }
const defaultCtx: Ctx = { store: createStore(), delay: 400, skipDelay: 300 }
const TipContext = React.createContext<Ctx>(defaultCtx)

export type TooltipProviderProps = {
  /** Hover-intent wait before the first tip. Default 400. */
  delay?: number
  /** Window after a tip closes in which the next opens at once. Default 300. */
  skipDelay?: number
  children?: React.ReactNode
}

/** Groups tooltips so sliding along them skips the delay. Without one, all tooltips on the page share a default group. */
export function TooltipProvider({ delay = 400, skipDelay = 300, children }: TooltipProviderProps) {
  const [store] = React.useState(createStore)
  const ctx = React.useMemo(() => ({ store, delay, skipDelay }), [store, delay, skipDelay])
  return <TipContext.Provider value={ctx}>{children}</TipContext.Provider>
}

/* -------------------------------------------------------------------------- */
/*                                  Placement                                 */
/* -------------------------------------------------------------------------- */

const GAP = 8
const MARGIN = 8
const OPPOSITE: Record<TooltipSide, TooltipSide> = { top: "bottom", bottom: "top", left: "right", right: "left" }

/** Puts the tip on `side` of the anchor (flipping when it does not fit), clamps it to the viewport, and aims the scale origin at the anchor. */
function place(a: DOMRect, w: number, h: number, side: TooltipSide) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const fits: Record<TooltipSide, boolean> = {
    top: a.top - GAP - h >= MARGIN,
    bottom: a.bottom + GAP + h <= vh - MARGIN,
    left: a.left - GAP - w >= MARGIN,
    right: a.right + GAP + w <= vw - MARGIN,
  }
  const s = fits[side] ? side : fits[OPPOSITE[side]] ? OPPOSITE[side] : side
  const cx = a.left + a.width / 2
  const cy = a.top + a.height / 2
  let x = s === "left" ? a.left - GAP - w : s === "right" ? a.right + GAP : cx - w / 2
  let y = s === "top" ? a.top - GAP - h : s === "bottom" ? a.bottom + GAP : cy - h / 2
  x = Math.max(MARGIN, Math.min(vw - w - MARGIN, x))
  y = Math.max(MARGIN, Math.min(vh - h - MARGIN, y))
  const vertical = s === "top" || s === "bottom"
  const ox = vertical ? cx - x : s === "left" ? w : 0
  const oy = vertical ? (s === "top" ? h : 0) : cy - y
  return { x: Math.round(x), y: Math.round(y), ox: Math.round(ox), oy: Math.round(oy), side: s }
}

const keysOf = (shortcut?: string | string[]) => (Array.isArray(shortcut) ? shortcut : shortcut ? shortcut.trim().split(/\s+/) : [])

/** The chips as an aria-keyshortcuts value: "⌘ ⇧ S" → "Meta+Shift+S". */
const KEY_NAMES: Record<string, string> = { "⌘": "Meta", "⌥": "Alt", "⇧": "Shift", "⌃": "Control", Esc: "Escape", "↵": "Enter", "⏎": "Enter", "⌫": "Backspace", "←": "ArrowLeft", "→": "ArrowRight", "↑": "ArrowUp", "↓": "ArrowDown" }
const ariaKeys = (keys: string[]) => keys.map((k) => KEY_NAMES[k] ?? k).join("+")

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/*                                  The trigger                               */
/* -------------------------------------------------------------------------- */

function TipTrigger({ children, content, shortcut, side = "top", delay, skipDelay, disabled, id, onOpenChange }: TooltipProps) {
  const ctx = React.useContext(TipContext)
  const { store } = ctx
  const gen = React.useId()
  const tipId = id ?? `tlt-${gen.replace(/:/g, "")}`
  const wait = delay ?? ctx.delay
  const skip = skipDelay ?? ctx.skipDelay

  const open = React.useSyncExternalStore(store.subscribe, () => store.openId === tipId, () => false)
  const instant = React.useSyncExternalStore(store.subscribe, () => store.instant, () => false)
  const [mounted, setMounted] = React.useState(false)
  const anchorRef = React.useRef<HTMLSpanElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const last = React.useRef({ x: 0, y: 0, t: 0 })
  const wasOpen = React.useRef(false)

  // Mount while open; on close, keep the node for the exit unless another tip is already taking over.
  React.useEffect(() => {
    if (open) {
      // oxlint-disable-next-line react/set-state-in-effect -- mount must follow the external store before paint; the layout effect positions it
      setMounted(true)
      return
    }
    if (!mounted) return
    if (store.openId !== null || prefersReduced()) {
      setMounted(false)
      return
    }
    const t = window.setTimeout(() => setMounted(false), 110)
    const off = store.subscribe(() => {
      if (store.openId !== null) setMounted(false)
    })
    return () => {
      window.clearTimeout(t)
      off()
    }
  }, [open, mounted, store])

  React.useEffect(() => {
    if (wasOpen.current !== open) onOpenChange?.(open)
    wasOpen.current = open
  }, [open, onOpenChange])

  // Position before paint, and keep it on the anchor while the page scrolls or resizes.
  React.useLayoutEffect(() => {
    if (!mounted || !open) return
    const a = anchorRef.current
    const tip = tipRef.current
    const body = bodyRef.current
    if (!a || !tip || !body) return
    const apply = () => {
      const p = place(a.getBoundingClientRect(), body.offsetWidth, body.offsetHeight, side)
      tip.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
      tip.style.setProperty("--tlt-ox", `${p.ox}px`)
      tip.style.setProperty("--tlt-oy", `${p.oy}px`)
      tip.dataset.side = p.side
    }
    apply()
    window.addEventListener("scroll", apply, true)
    window.addEventListener("resize", apply)
    return () => {
      window.removeEventListener("scroll", apply, true)
      window.removeEventListener("resize", apply)
    }
  }, [mounted, open, side, content, shortcut])

  // Escape closes the tip without moving focus.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") store.leave(tipId)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, store, tipId])

  React.useEffect(() => () => store.leave(tipId), [store, tipId])

  const off = disabled || content === undefined || content === null || content === false
  const onEnter = (e: React.PointerEvent) => {
    if (off || e.pointerType === "touch") return
    last.current = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    store.enter(tipId, wait, skip)
  }
  // Hover intent: a pointer still sweeping across the control (faster than ~0.9px/ms) has not decided yet, so the wait restarts.
  const onMove = (e: React.PointerEvent) => {
    if (off || e.pointerType === "touch" || store.pending !== tipId) return
    const l = last.current
    const dt = Math.max(1, e.timeStamp - l.t)
    const v = Math.hypot(e.clientX - l.x, e.clientY - l.y) / dt
    last.current = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    if (v > 0.9) store.enter(tipId, wait, skip)
  }
  const onFocus = (e: React.FocusEvent) => {
    if (off || !(e.target as HTMLElement).matches(":focus-visible")) return
    store.enter(tipId, wait, skip, true)
  }

  const keys = keysOf(shortcut)
  const child = children as React.ReactElement<Record<string, unknown>> | undefined
  const cp = child?.props ?? {}
  // When the control's aria-label already says the tip text, the description should add only what is new (the shortcut),
  // so the repeated text is hidden from the accessibility tree while it stays on screen.
  const label = cp["aria-label"]
  const repeats = typeof label === "string" && typeof content === "string" && label.trim().toLowerCase() === content.trim().toLowerCase()
  const extra: Record<string, unknown> = {}
  if (keys.length > 0 && !off && cp["aria-keyshortcuts"] === undefined) extra["aria-keyshortcuts"] = ariaKeys(keys)
  if (open) extra["aria-describedby"] = [cp["aria-describedby"], tipId].filter(Boolean).join(" ")
  const described = child && Object.keys(extra).length > 0 ? React.cloneElement(child, extra) : child

  return (
    <>
      <span
        ref={anchorRef}
        className="tlt-a"
        data-hot={open || undefined}
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={() => store.leave(tipId)}
        onPointerDown={() => store.leave(tipId)}
        onFocus={onFocus}
        onBlur={() => store.leave(tipId)}
      >
        <style href="tooltip" precedence="default">
          {CSS}
        </style>
        {described}
      </span>
      {mounted && !off
        ? createPortal(
            <div ref={tipRef} id={tipId} role="tooltip" className="tlt-tip" data-state={open ? "open" : "closed"} data-instant={(open && instant) || undefined}>
              <div ref={bodyRef} className="tlt-body">
                <span className="tlt-text" aria-hidden={repeats || undefined}>
                  {content}
                </span>
                {keys.length > 0 && (
                  <span className="tlt-keys" aria-label={`Shortcut ${keys.join(" ")}`}>
                    {keys.map((k, i) => (
                      <kbd key={i} className="tlt-key">
                        {k}
                      </kbd>
                    ))}
                  </span>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Built-in toolbar                             */
/* -------------------------------------------------------------------------- */

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 16 16" aria-hidden>
    {d}
  </svg>
)

const DEFAULT_ITEMS: TooltipItem[] = [
  { id: "stop", label: "Stop run", shortcut: "Esc", icon: <Icon d={<rect x="3.5" y="3.5" width="9" height="9" rx="2" />} /> },
  { id: "retry", label: "Retry", shortcut: "⌘ R", icon: <Icon d={<path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" />} /> },
  {
    id: "branch",
    label: "Branch from here",
    shortcut: "⌥ B",
    icon: <Icon d={<><circle cx="4" cy="3.5" r="1.5" /><circle cx="4" cy="12.5" r="1.5" /><circle cx="12" cy="5.5" r="1.5" /><path d="M4 5v6M12 7c0 2.6-2.3 3.1-6 3.8" /></>} />,
  },
  { id: "copy", label: "Copy reply", shortcut: "⌘ C", icon: <Icon d={<><rect x="5.5" y="5.5" width="8" height="8" rx="2" /><path d="M10.5 3.5a1 1 0 0 0-1-1h-5a2 2 0 0 0-2 2v5a1 1 0 0 0 1 1" /></>} /> },
  { id: "save", label: "Save", shortcut: "⌘ S", icon: <Icon d={<path d="M4.5 2.5h7v11L8 10.6l-3.5 2.9z" />} /> },
  { id: "share", label: "Share", shortcut: "⌘ ⇧ S", icon: <Icon d={<path d="M8 10V2.5M5 5l3-3 3 3M3.5 8.5v4h9v-4" />} /> },
  { id: "comment", label: "Comment", shortcut: "C", icon: <Icon d={<path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />} /> },
  { id: "more", label: "More actions", icon: <Icon d={<><circle cx="3.5" cy="8" r=".6" /><circle cx="8" cy="8" r=".6" /><circle cx="12.5" cy="8" r=".6" /></>} /> },
]

const SIM_STOPS = [0, 1, 2, 3, 4]

function Stage(props: TooltipProps) {
  const { items = DEFAULT_ITEMS, title = "Draft reply to Harbor & Finch", subtitle = "Atlas used 3 sources", delay = 400, skipDelay = 300, side = "top", onSelect, className } = props
  const store = React.useMemo(createStore, [])
  const ctx = React.useMemo(() => ({ store, delay, skipDelay }), [store, delay, skipDelay])
  const uid = React.useId().replace(/:/g, "")
  const ids = items.map((it) => `tlt-${uid}-${it.id}`)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const zoneRef = React.useRef<HTMLDivElement>(null)
  const curRef = React.useRef<HTMLDivElement>(null)
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)
  const [tab, setTab] = React.useState(0)

  const seq = React.useSyncExternalStore(store.subscribe, () => store.seq, () => 0)
  const measured = seq > 0 && !(auto && prefersReduced()) // the reduced-motion still frame shows no measurement
  const waited = store.waited

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((es) => {
      onScreen = es.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  // Reduced motion: one still frame, the third tip already open.
  React.useEffect(() => {
    if (!auto || !prefersReduced()) return
    const t = window.setTimeout(() => store.enter(ids[Math.min(2, ids.length - 1)], 0, 0, true), 60)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, store])

  // The built-in moment: a cursor glides along the toolbar through the real tooltips.
  React.useEffect(() => {
    if (!auto || !active || prefersReduced()) return
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => void timers.push(window.setTimeout(fn, ms))
    const cur = curRef.current
    const zone = zoneRef.current
    if (!cur || !zone) return
    const stops = SIM_STOPS.filter((i) => i < items.length)
    const point = (i: number) => {
      const b = btnRefs.current[i]
      if (!b) return { x: 0, y: 0 }
      const z = zone.getBoundingClientRect()
      const r = b.getBoundingClientRect()
      return { x: r.left - z.left + r.width / 2 - 3, y: r.top - z.top + r.height / 2 - 2 }
    }
    const go = (p: { x: number; y: number }, ms: number) => {
      cur.style.transitionDuration = `${ms}ms, .3s`
      cur.style.transform = `translate(${p.x}px, ${p.y}px)`
    }
    const play = () => {
      store.clear()
      const z = zone.getBoundingClientRect()
      const first = point(stops[0])
      const away = { x: Math.min(z.width - 24, first.x + 150), y: first.y + 64 }
      cur.style.transitionDuration = "0s, .3s"
      cur.style.transform = `translate(${away.x}px, ${away.y}px)`
      void cur.offsetWidth
      cur.toggleAttribute("data-on", true)
      let t = 500
      go(first, 760)
      at(t + 640, () => store.enter(ids[stops[0]], delay, skipDelay))
      t += 640 + delay + 900
      for (let k = 1; k < stops.length; k++) {
        const to = stops[k]
        const from = stops[k - 1]
        const glide = 360
        const T = t
        at(T, () => go(point(to), glide))
        at(T + glide * 0.45, () => {
          store.leave(ids[from])
          store.enter(ids[to], delay, skipDelay)
        })
        t += glide + (k < stops.length - 1 ? 300 : 1500)
      }
      at(t, () => {
        store.leave(ids[stops[stops.length - 1]])
        go(away, 600)
      })
      at(t + 700, () => cur.removeAttribute("data-on"))
      at(t + 2600, play)
    }
    play()
    return () => {
      timers.forEach(window.clearTimeout)
      cur.removeAttribute("data-on")
      store.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, active, store, delay, skipDelay, items.length])

  // The first real touch, key press or hover on the piece ends the demo for good.
  React.useEffect(() => {
    if (!auto) return
    const stop = () => setAuto(false)
    window.addEventListener("pointerdown", stop, true)
    window.addEventListener("keydown", stop, true)
    return () => {
      window.removeEventListener("pointerdown", stop, true)
      window.removeEventListener("keydown", stop, true)
    }
  }, [auto])

  const onBarKey = (e: React.KeyboardEvent) => {
    const n = items.length
    const to = e.key === "ArrowRight" ? (tab + 1) % n : e.key === "ArrowLeft" ? (tab - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    setTab(to)
    btnRefs.current[to]?.focus()
  }

  const first = measured && waited > 0
  return (
    <TipContext.Provider value={ctx}>
      <div ref={rootRef} className={cn("tlt", className)} onPointerEnter={(e) => e.pointerType !== "touch" && setAuto(false)} onFocusCapture={() => setAuto(false)}>
        <style href="tooltip" precedence="default">
          {CSS}
        </style>
        <div className="tlt-card">
          <p className="tlt-title">{title}</p>
          <p className="tlt-sub">{subtitle}</p>
          <div ref={zoneRef} className="tlt-zone">
            <div className="tlt-bar" role="toolbar" aria-label="Reply actions" onKeyDown={onBarKey}>
              {items.map((it, i) => (
                <TipTrigger key={it.id} id={ids[i]} content={it.label} shortcut={it.shortcut} side={side} delay={delay} skipDelay={skipDelay}>
                  <button
                    ref={(el) => {
                      btnRefs.current[i] = el
                    }}
                    type="button"
                    className="tlt-btn"
                    aria-label={it.label}
                    tabIndex={i === tab ? 0 : -1}
                    onFocus={() => setTab(i)}
                    onClick={() => onSelect?.(it)}
                  >
                    {it.icon ?? <Icon d={<circle cx="8" cy="8" r="3" />} />}
                  </button>
                </TipTrigger>
              ))}
            </div>
            <div ref={curRef} className="tlt-cursor" aria-hidden>
              <svg viewBox="0 0 18 22" width="18" height="22">
                <path d="M3 2v15l4.2-3.7 2.8 6.2 2.6-1.2-2.8-6H15z" />
              </svg>
            </div>
          </div>
          <div className="tlt-read">
            <p className="tlt-cap">Tip opened after</p>
            <p className="tlt-num" data-live={measured || undefined} aria-live="polite">
              <span key={`${seq}-${waited}`}>{measured ? waited : delay}</span>
              <i>ms</i>
            </p>
            <p className="tlt-why" key={first ? "a" : measured ? "b" : "c"}>
              {first ? "The first tip waits, so a pass-through never flashes" : measured ? "Neighbours are already warm, so they open at once" : "Hover a button"}
            </p>
          </div>
        </div>
      </div>
    </TipContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Tooltip                                  */
/* -------------------------------------------------------------------------- */

/**
 * A label with a shortcut that waits on the first hover, then shows instantly as you slide along neighbouring controls.
 * Wrap one control, or render it bare for a toolbar that demonstrates itself.
 */
export function Tooltip(props: TooltipProps) {
  return props.children ? <TipTrigger {...props} /> : <Stage {...props} />
}

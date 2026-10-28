"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SheetStackMode = "auto" | "sheet" | "dialog"

export type SheetStackProps = {
  /** Page content, triggers and `Sheet` declarations. */
  children: React.ReactNode
  /** Controlled ids of open sheets, bottom first. Leave undefined for uncontrolled use. */
  stack?: string[]
  /** Sheets open at first when uncontrolled. */
  defaultStack?: string[]
  /** Called when sheets are pushed or popped. */
  onStackChange?: (stack: string[]) => void
  /** `auto` picks bottom sheets below `breakpoint` and centered dialogs above it. */
  mode?: SheetStackMode
  /** Width in px of the viewport (or of the container when `contained`) where `auto` switches to dialogs. */
  breakpoint?: number
  /** Fill the nearest positioned ancestor instead of the viewport. */
  contained?: boolean
}

export type SheetProps = {
  /** Id used by `push`, `popTo`, `SheetTrigger` and the stack array. */
  id: string
  /** Heading and accessible name. */
  title: string
  /** A line under the title, wired as the dialog description. */
  description?: string
  /** Scrolling body content. */
  children: React.ReactNode
  /** A row pinned under the scrolling body, such as the primary action. */
  footer?: React.ReactNode
  /** Label for the back button of a sheet opened from this one. Defaults to `title`. */
  backLabel?: string
  /** Allow drag and fling to dismiss. */
  dismissible?: boolean
  className?: string
  ref?: React.Ref<HTMLDivElement>
}

export type SheetTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Id of the sheet to push. Call `preventDefault` in `onClick` to skip the push. */
  sheet: string
  ref?: React.Ref<HTMLButtonElement>
}

export type SheetStackApi = {
  stack: string[]
  push: (id: string) => void
  pop: () => void
  popTo: (id: string) => void
  close: () => void
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.sks { display: contents }
:is(.dark, [data-theme="dark"]) .sks-layer {
  --sks-ink: #fff; --sks-surface: #1c1c1e; --sks-accent: #4d8dff;
  --sks-t1: oklch(.96 0 0); --sks-t2: oklch(.72 0 0); --sks-t3: oklch(.6 0 0);
  --sks-fill: color-mix(in oklab, #fff 8%, transparent); --sks-line: color-mix(in oklab, #fff 9%, transparent);
  --sks-grab: oklch(.42 0 0); --sks-scrim: .55; --sks-dim: .4;
  --sks-shadow: 0 20px 48px 0 rgb(0 0 0 / .5), 0 3px 10px 0 rgb(0 0 0 / .3), 0 0 0 .5px rgb(255 255 255 / .1);
}
.sks-layer {
  --sks-ink: #fff; --sks-surface: #1c1c1e; --sks-accent: #4d8dff;
  --sks-t1: oklch(.96 0 0); --sks-t2: oklch(.72 0 0); --sks-t3: oklch(.6 0 0);
  --sks-fill: color-mix(in oklab, #fff 8%, transparent); --sks-line: color-mix(in oklab, #fff 9%, transparent);
  --sks-grab: oklch(.42 0 0); --sks-scrim: .55; --sks-dim: .4;
  --sks-shadow: 0 20px 48px 0 rgb(0 0 0 / .5), 0 3px 10px 0 rgb(0 0 0 / .3), 0 0 0 .5px rgb(255 255 255 / .1);
}
.sks { display: contents }
.sks-layer {
  --sks-ink: #000; --sks-surface: #fff; --sks-accent: #0060e2;
  --sks-t1: oklch(.15 0 0); --sks-t2: oklch(.46 0 0); --sks-t3: oklch(.59 0 0);
  --sks-fill: oklch(.978 0 0); --sks-line: color-mix(in oklab, var(--sks-ink) 7%, transparent);
  --sks-grab: oklch(.82 0 0); --sks-scrim: .3; --sks-dim: .22;
  --sks-shadow: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --sks-ease: cubic-bezier(.22, 1, .36, 1);
  font-family: var(--sks-font, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif); font-size: 14px; line-height: 20px; color: var(--sks-t1);
  position: fixed; inset: 0; z-index: 100; overflow: hidden; pointer-events: none; visibility: hidden; -webkit-font-smoothing: antialiased;
}
.sks-layer[data-contained="true"] { position: absolute }
.sks-layer[data-active="true"] { visibility: visible; pointer-events: auto }
.sks-layer *, .sks-layer *::before, .sks-layer *::after { box-sizing: border-box }
@layer base {
  .sks-layer :is(button, input, textarea) { font: inherit; color: inherit; margin: 0 }
  .sks-layer button { background: none; border: 0; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation }
}
.sks-layer :focus-visible { outline: 2px solid color-mix(in oklab, var(--sks-accent) 60%, transparent); outline-offset: 1px }
.sks-scrim { position: absolute; inset: 0; background: rgb(0 0 0 / var(--sks-scrim)); opacity: 0 }
.sks-panel {
  position: absolute; left: 0; right: 0; bottom: -40px; margin: 0 auto; width: min(560px, 100%); top: auto; height: 0;
  background: var(--sks-surface); color: var(--sks-t1); border-radius: 34px 34px 0 0; box-shadow: var(--sks-shadow);
  transform-origin: 50% 0; overflow: hidden; will-change: transform; outline: none; overscroll-behavior: contain;
}
.sks-layer[data-dialog="true"] .sks-panel { top: 0; bottom: auto; width: min(480px, calc(100% - 32px)); border-radius: 28px }
.sks-panel[inert] { pointer-events: none }
.sks-panel[data-dragging] { user-select: none; -webkit-user-select: none; cursor: grabbing }
.sks-header, .sks-grab { user-select: none; -webkit-user-select: none }
.sks-dim { position: absolute; inset: 0; background: rgb(0 0 0 / var(--sks-dim)); border-radius: inherit; opacity: 0; pointer-events: none; z-index: 5 }
.sks-sizer { display: flex; flex-direction: column; height: 100%; padding-bottom: 56px }
.sks-layer[data-dialog="true"] .sks-sizer { padding-bottom: 16px }
.sks-grab { position: relative; flex: none; height: 0; touch-action: none; cursor: grab }
.sks-grab::before { content: ""; position: absolute; top: 8px; left: 50%; width: 36px; height: 5px; margin-left: -18px; border-radius: 999px; background: var(--sks-grab) }
.sks-layer[data-dialog="true"] .sks-grab { display: none }
.sks-header { flex: none; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; height: 52px; padding: 6px 10px 2px; touch-action: none }
.sks-lead { display: flex; align-items: center; min-width: 0 }
.sks-trail { display: flex; align-items: center; justify-content: flex-end }
.sks-title { margin: 0; font-size: 16px; font-weight: 500; line-height: 18px; letter-spacing: -.005em; text-align: center; white-space: nowrap }
.sks-back { display: inline-flex; align-items: center; gap: 2px; height: 36px; padding: 0 10px 0 4px; border-radius: 999px; color: var(--sks-t2); font-size: 14px; max-width: 100%; transition: background-color .15s, color .15s }
.sks-back svg { width: 18px; height: 18px; flex: none }
.sks-back span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.sks-close { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--sks-fill); color: var(--sks-t2); transition: background-color .15s, color .15s }
.sks-close svg { width: 16px; height: 16px }
@media (hover: hover) and (pointer: fine) {
  .sks-back:hover { background: var(--sks-fill); color: var(--sks-t1) }
  .sks-close:hover { background: color-mix(in oklab, var(--sks-ink) 8%, transparent); color: var(--sks-t1) }
}
.sks-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 16px 4px; overscroll-behavior: contain; scrollbar-width: thin }
.sks-body[data-drag="true"] { touch-action: none }
.sks-body[data-scroll="true"] { touch-action: pan-y }
.sks-desc { margin: 0 0 12px; font-size: 13px; line-height: 18px; color: var(--sks-t3); text-align: center }
.sks-footer { flex: none; padding: 12px 16px 0 }
.sks-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
@media (prefers-reduced-motion: reduce) { .sks-panel, .sks-scrim { transition: opacity .15s linear } }
`

/* -------------------------------------------------------------------------- */
/*                                   Springs                                  */
/* -------------------------------------------------------------------------- */

type Spr = { x: number; v: number; to: number; k: number; c: number }
const mk = (x: number): Spr => ({ x, v: 0, to: x, k: 300, c: 30 })
function tune(s: Spr, k: number, zeta: number) {
  s.k = k
  s.c = 2 * zeta * Math.sqrt(k)
}
function step(s: Spr, dt: number) {
  let t = dt
  while (t > 0) {
    const h = Math.min(t, 1 / 240)
    s.v += (s.k * (s.to - s.x) - s.c * s.v) * h
    s.x += s.v * h
    t -= h
  }
}
const at = (s: Spr, e = 0.05) => Math.abs(s.to - s.x) < e && Math.abs(s.v) < e * 8
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/* -------------------------------------------------------------------------- */
/*                                   Engine                                   */
/* -------------------------------------------------------------------------- */

const EXTRA = 40 // sheets reach this far under the bottom edge so a spring overshoot never shows a gap
const PEEK_SHEET = 10
const PEEK_DIALOG = 14
const DEPTH_SCALE = 0.05

type Entry = {
  id: string
  el: HTMLDivElement
  dim: HTMLElement
  h: Spr
  pres: Spr
  depth: Spr
  drag: Spr
  dragging: boolean
  nat: number
  leaving: boolean
  gone: () => void
  goneTimer: number
}

/** One requestAnimationFrame loop moves every open sheet, so drags and pushes never re-render React. */
class Engine {
  entries = new Map<string, Entry>()
  order: string[] = []
  dialog = false
  W = 0
  H = 0
  reduced = false
  scrim: HTMLElement | null = null
  raf = 0
  last = 0
  ref = mk(0)
  refInit = false
  onActive: (active: boolean) => void = () => {}
  wasActive = false

  kick() {
    if (this.raf) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.entries.forEach((e) => clearTimeout(e.goneTimer))
  }

  notify() {
    const a = this.entries.size > 0
    if (a !== this.wasActive) {
      this.wasActive = a
      this.onActive(a)
    }
  }

  register(id: string, el: HTMLDivElement, dim: HTMLElement, nat: number, gone: () => void) {
    const e: Entry = { id, el, dim, h: mk(0), pres: mk(0), depth: mk(0), drag: mk(0), dragging: false, nat, leaving: false, gone, goneTimer: 0 }
    e.h.x = e.h.to = this.targetH(nat)
    // Enter from the bottom edge (or fade in as a dialog).
    this.entries.set(id, e)
    this.notify()
    this.kick()
    return e
  }

  unregister(id: string) {
    const e = this.entries.get(id)
    if (e) clearTimeout(e.goneTimer)
    this.entries.delete(id)
    this.notify()
    this.kick()
  }

  openIds() {
    return this.order.filter((id) => {
      const e = this.entries.get(id)
      return e && !e.leaving
    })
  }

  maxVisible() {
    const n = Math.max(1, this.openIds().length)
    return this.dialog ? this.H - 32 - 2 * PEEK_DIALOG * (n - 1) : this.H - 20 - PEEK_SHEET * (n - 1)
  }

  targetH(nat: number) {
    const extra = this.dialog ? 0 : EXTRA
    return Math.max(0, Math.min(nat, this.maxVisible() + extra))
  }

  setNat(id: string, nat: number) {
    const e = this.entries.get(id)
    if (!e) return
    e.nat = nat
    this.kick()
  }

  setLeaving(id: string, leaving: boolean) {
    const e = this.entries.get(id)
    if (!e || e.leaving === leaving) return
    e.leaving = leaving
    clearTimeout(e.goneTimer)
    if (!leaving) e.drag.to = 0
    this.kick()
  }

  frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000 || 0.016))
    this.last = now
    const open = this.openIds()
    const topId = open[open.length - 1]
    const top = topId ? this.entries.get(topId) : undefined
    const extra = this.dialog ? 0 : EXTRA
    const reduced = this.reduced
    let moving = false
    const dragProg = top ? clamp(top.drag.x / Math.max(1, top.h.x - extra), 0, 1) : 0
    let maxPres = 0
    const topVis = top ? top.h.x - extra : 0
    // The reference height lower sheets align their peek to. It follows the top sheet with a spring, so a sheet
    // that becomes the top one glides to its own position instead of jumping.
    if (top) {
      if (!this.refInit || reduced) {
        this.ref.x = this.ref.to = topVis
        this.ref.v = 0
        this.refInit = true
      }
      this.ref.to = topVis
      tune(this.ref, 420, 1)
      step(this.ref, dt)
      if (!at(this.ref)) moving = true
    }
    const refVis = this.ref.x

    this.entries.forEach((e) => {
      // targets
      if (e.leaving) {
        e.pres.to = 0
        e.depth.to = 0
      } else {
        e.pres.to = 1
        e.depth.to = open.length - 1 - open.indexOf(e.id)
      }
      e.h.to = this.targetH(e.nat)
      if (e.leaving) tune(e.pres, 380, 1)
      else tune(e.pres, 250, 0.88)
      tune(e.depth, 300, 1)
      tune(e.h, 340, 0.9)
      tune(e.drag, 420, 0.9)

      if (reduced) {
        e.pres.x = e.pres.to
        e.pres.v = 0
        e.depth.x = e.depth.to
        e.depth.v = 0
        e.h.x = e.h.to
        e.h.v = 0
        e.drag.x = 0
        e.drag.v = 0
      } else {
        step(e.pres, dt)
        step(e.depth, dt)
        step(e.h, dt)
        if (!e.dragging) step(e.drag, dt)
      }

      const vis = e.h.x - extra
      const depth = Math.max(0, e.depth.x - (!e.leaving && e.depth.to > 0.5 ? dragProg : 0))
      const lift = Math.min(1, depth)
      const peek = this.dialog ? PEEK_DIALOG : PEEK_SHEET
      const pres = e.pres.x
      let ty: number
      let sc = 1 - DEPTH_SCALE * depth
      let opacity = 1
      if (this.dialog) {
        ty = (this.H - vis) / 2 + ((vis - refVis) / 2) * lift - peek * depth + (1 - pres) * 28 + e.drag.x
        sc *= 0.96 + 0.04 * clamp(pres, 0, 1)
        opacity = clamp(pres, 0, 1)
      } else {
        ty = (vis - refVis) * lift - peek * depth + (1 - pres) * (vis + 24) + e.drag.x
      }
      if (reduced) {
        sc = 1
        ty = this.dialog ? (this.H - vis) / 2 : 0
        opacity = depth > 0.5 ? 0 : clamp(pres, 0, 1)
      }
      const s = e.el.style
      s.height = `${e.h.x.toFixed(2)}px`
      s.transform = `translate3d(0, ${ty.toFixed(2)}px, 0) scale(${sc.toFixed(4)})`
      s.opacity = opacity >= 1 ? "" : opacity.toFixed(3)
      s.zIndex = String(10 + Math.max(0, this.order.indexOf(e.id)))
      e.dim.style.opacity = clamp(0.73 * depth, 0, 1).toFixed(3)
      maxPres = Math.max(maxPres, clamp(pres, 0, 1))

      const settled = at(e.pres, 0.002) && at(e.depth, 0.002) && at(e.h) && (e.dragging || at(e.drag))
      if (!settled || e.dragging) moving = true
      if (e.leaving) {
        if (reduced) {
          if (!e.goneTimer) e.goneTimer = window.setTimeout(e.gone, 160)
        } else if (e.pres.x < 0.004 && !e.dragging) {
          e.pres.x = 0
          queueMicrotask(e.gone)
        }
      }
    })

    if (this.scrim) {
      const only = open.length <= 1
      this.scrim.style.opacity = (maxPres * (only ? 1 - dragProg : 1)).toFixed(3)
    }
    if (moving) this.raf = requestAnimationFrame(this.frame)
    else this.raf = 0
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

type Ctx = SheetStackApi & {
  engine: Engine
  layer: HTMLElement | null
  dialog: boolean
}
const SheetStackContext = React.createContext<Ctx | null>(null)

export function useSheetStack(): SheetStackApi {
  const c = React.useContext(SheetStackContext)
  if (!c) throw new Error("useSheetStack must be used inside <SheetStack>")
  const { stack, push, pop, popTo, close } = c
  return React.useMemo(() => ({ stack, push, pop, popTo, close }), [stack, push, pop, popTo, close])
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/* -------------------------------------------------------------------------- */
/*                                 SheetStack                                 */
/* -------------------------------------------------------------------------- */

export function SheetStack({ children, stack: stackProp, defaultStack = [], onStackChange, mode = "auto", breakpoint = 640, contained = false }: SheetStackProps) {
  const [inner, setInner] = React.useState<string[]>(defaultStack)
  const stack = stackProp ?? inner
  const stackRef = React.useRef(stack)
  const [engine] = React.useState(() => new Engine())
  const [layer, setLayer] = React.useState<HTMLDivElement | null>(null)
  const [active, setActive] = React.useState(false)
  const [dialog, setDialog] = React.useState(mode === "dialog")
  const scrimRef = React.useRef<HTMLDivElement>(null)
  engine.onActive = setActive

  React.useLayoutEffect(() => {
    stackRef.current = stack
    engine.order = stack
    engine.kick()
  }, [stack, engine])

  const commit = React.useCallback(
    (next: string[]) => {
      stackRef.current = next
      if (stackProp === undefined) setInner(next)
      onStackChange?.(next)
    },
    [stackProp, onStackChange],
  )
  const popTo = React.useCallback(
    (id: string) => {
      const i = stackRef.current.indexOf(id)
      if (i >= 0 && i < stackRef.current.length - 1) commit(stackRef.current.slice(0, i + 1))
    },
    [commit],
  )
  const push = React.useCallback(
    (id: string) => {
      if (stackRef.current.includes(id)) popTo(id)
      else commit([...stackRef.current, id])
    },
    [commit, popTo],
  )
  const pop = React.useCallback(() => {
    if (stackRef.current.length) commit(stackRef.current.slice(0, -1))
  }, [commit])
  const close = React.useCallback(() => {
    if (stackRef.current.length) commit([])
  }, [commit])

  // Layer size and mode.
  React.useLayoutEffect(() => {
    engine.scrim = scrimRef.current
    const el = layer
    if (!el) return
    const measure = () => {
      engine.W = el.clientWidth
      engine.H = el.clientHeight
      const d = mode === "dialog" || (mode === "auto" && el.clientWidth >= breakpoint)
      engine.dialog = d
      setDialog((prev) => (prev === d ? prev : d))
      engine.kick()
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [layer, mode, breakpoint, engine])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => {
      engine.reduced = mq.matches
      engine.kick()
    }
    on()
    mq.addEventListener("change", on)
    return () => {
      mq.removeEventListener("change", on)
      engine.stop()
    }
  }, [engine])

  // Lock page scroll while anything is open (unless contained).
  React.useEffect(() => {
    if (!active || contained) return
    const b = document.body
    const prev = { o: b.style.overflow, p: b.style.paddingRight }
    const sw = window.innerWidth - document.documentElement.clientWidth
    b.style.overflow = "hidden"
    if (sw > 0) b.style.paddingRight = `${sw}px`
    return () => {
      b.style.overflow = prev.o
      b.style.paddingRight = prev.p
    }
  }, [active, contained])

  // Escape closes the top sheet only.
  React.useEffect(() => {
    if (!stack.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      e.preventDefault()
      pop()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [stack.length, pop])

  const value = React.useMemo<Ctx>(() => ({ stack, push, pop, popTo, close, engine, layer, dialog }), [stack, push, pop, popTo, close, engine, layer, dialog])

  const onLayerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return
    const panels = [...(layer?.querySelectorAll<HTMLElement>(".sks-panel:not([inert])") ?? [])]
    const panel = panels[panels.length - 1]
    if (!panel) return
    const f = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null || x === document.activeElement)
    if (!f.length) {
      e.preventDefault()
      panel.focus()
      return
    }
    const first = f[0]
    const last = f[f.length - 1]
    const a = document.activeElement
    if (e.shiftKey && (a === first || a === panel)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && a === last) {
      e.preventDefault()
      first.focus()
    } else if (!panel.contains(a)) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <SheetStackContext.Provider value={value}>
      <div className="sks">
        <style href="sheet-stack" precedence="default">{CSS}</style>
        <div style={{ display: "contents" }} inert={stack.length > 0 || undefined}>
          {children}
        </div>
        <div
          ref={setLayer}
          className="sks-layer"
          data-active={active}
          data-contained={contained}
          data-dialog={dialog}
          onKeyDown={onLayerKeyDown}
        >
          <div
            className="sks-scrim"
            ref={scrimRef}
            aria-hidden="true"
            onPointerDown={() => {
              if (stackRef.current.length) pop()
            }}
          />
        </div>
      </div>
    </SheetStackContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Sheet                                   */
/* -------------------------------------------------------------------------- */

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

function setRef<T>(ref: React.Ref<T> | undefined, v: T | null) {
  if (typeof ref === "function") ref(v)
  else if (ref) (ref as React.RefObject<T | null>).current = v
}

export function Sheet(props: SheetProps) {
  const c = React.useContext(SheetStackContext)
  if (!c) throw new Error("<Sheet> must be used inside <SheetStack>")
  const open = c.stack.includes(props.id)
  const [present, setPresent] = React.useState(open)
  if (open && !present) setPresent(true)
  if (!c.layer || !present) return null
  return createPortal(<Panel {...props} ctx={c} open={open} onGone={() => setPresent(false)} />, c.layer)
}

function Panel({ id, title, description, children, footer, backLabel, dismissible = true, className, ref, ctx, open, onGone }: SheetProps & { ctx: Ctx; open: boolean; onGone: () => void }) {
  const uid = React.useId()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const dimRef = React.useRef<HTMLSpanElement>(null)
  const sizerRef = React.useRef<HTMLDivElement>(null)
  const headRef = React.useRef<HTMLElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const bodyInRef = React.useRef<HTMLDivElement>(null)
  const footRef = React.useRef<HTMLDivElement>(null)
  const backRef = React.useRef<HTMLButtonElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const [scrollable, setScrollable] = React.useState(false)
  const engine = ctx.engine
  const index = ctx.stack.indexOf(id)
  const isTop = open && index === ctx.stack.length - 1
  const hasParent = index > 0
  const parentId = hasParent ? ctx.stack[index - 1] : null
  const goneRef = React.useRef(onGone)
  React.useEffect(() => {
    goneRef.current = onGone
  })

  const measure = React.useCallback(() => {
    const sizer = sizerRef.current
    const body = bodyRef.current
    const bin = bodyInRef.current
    if (!sizer || !body || !bin) return
    const cs = getComputedStyle(body)
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const nat = sizer.offsetHeight - body.offsetHeight + pad + bin.offsetHeight
    engine.setNat(id, nat)
    const max = engine.targetH(nat)
    setScrollable((s) => (s === nat > max + 0.5 ? s : nat > max + 0.5))
  }, [engine, id])

  React.useLayoutEffect(() => {
    const el = panelRef.current
    const dim = dimRef.current
    const sizer = sizerRef.current
    const body = bodyRef.current
    const bin = bodyInRef.current
    if (!el || !dim || !sizer || !body || !bin) return
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // natural height before first registration so the sheet doesn't start at zero
    const cs = getComputedStyle(body)
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    el.style.height = "auto"
    const chrome = sizer.offsetHeight - body.offsetHeight
    const nat = chrome + pad + bin.offsetHeight
    el.style.height = "0px"
    engine.register(id, el, dim, nat, () => goneRef.current())
    const ro = new ResizeObserver(measure)
    ro.observe(bin)
    if (headRef.current) ro.observe(headRef.current)
    if (footRef.current) ro.observe(footRef.current)
    // Opening moves focus into the sheet.
    const raf = requestAnimationFrame(() => {
      if (!el.contains(document.activeElement)) (el.querySelector<HTMLElement>(".sks-body")?.querySelector<HTMLElement>(FOCUSABLE) ?? el).focus({ preventScroll: true })
    })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      engine.unregister(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Leaving: start the exit and hand focus back to whatever opened this sheet.
  const wasOpen = React.useRef(open)
  React.useLayoutEffect(() => {
    engine.setLeaving(id, !open)
    if (wasOpen.current && !open) {
      const o = opener.current
      requestAnimationFrame(() => {
        if (o && o.isConnected) o.focus({ preventScroll: true })
      })
    }
    wasOpen.current = open
  }, [open, engine, id])

  // The back button names the sheet it returns to: read it from that sheet's panel.
  React.useLayoutEffect(() => {
    const btn = backRef.current
    if (!btn || !parentId || !ctx.layer) return
    const parent = ctx.layer.querySelector<HTMLElement>(`[data-sheet-id="${globalThis.CSS?.escape ? globalThis.CSS.escape(parentId) : parentId}"]`)
    const label = parent?.dataset.back || parent?.dataset.title || "Back"
    const span = btn.querySelector("span")
    if (span) span.textContent = label
    btn.setAttribute("aria-label", `Back to ${label}`)
  }, [parentId, ctx.layer])

  // Re-measure when the layer (and so the available height) changes, and when the mode flips.
  React.useLayoutEffect(() => {
    measure()
  }, [ctx.dialog, ctx.stack.length, measure])

  /* ---- drag to dismiss ---- */
  const drag = React.useRef<{ pid: number; x0: number; y0: number; started: boolean; samples: { y: number; t: number }[]; inBody: boolean } | null>(null)
  const suppress = React.useRef(false)
  const RUB = 48
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTop || !dismissible || (e.pointerType === "mouse" && e.button !== 0)) return
    const t = e.target as HTMLElement
    if (t.closest("[data-sheet-no-drag], input, textarea, select, [contenteditable='true']")) return
    const inBody = !!bodyRef.current?.contains(t)
    if (inBody && (bodyRef.current?.scrollTop ?? 0) > 0) return
    drag.current = { pid: e.pointerId, x0: e.clientX, y0: e.clientY, started: false, samples: [], inBody }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pid) return
    const dy = e.clientY - d.y0
    const dx = e.clientX - d.x0
    if (!d.started) {
      if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return
      // Horizontal moves, or upward moves in a scrollable body, belong to the content.
      if (Math.abs(dx) > Math.abs(dy) || (d.inBody && dy < 0 && scrollable)) {
        drag.current = null
        return
      }
      d.started = true
      d.y0 = e.clientY
      panelRef.current?.setPointerCapture(e.pointerId)
      panelRef.current?.setAttribute("data-dragging", "")
      window.getSelection()?.removeAllRanges()
      suppress.current = true
      const en = engine.entries.get(id)
      if (en) {
        en.dragging = true
        en.drag.v = 0
      }
    }
    const raw = e.clientY - d.y0
    const en = engine.entries.get(id)
    if (!en) return
    en.drag.x = raw < 0 ? -(RUB * (1 - 1 / (-raw / RUB + 1))) : raw
    d.samples.push({ y: e.clientY, t: performance.now() })
    if (d.samples.length > 6) d.samples.shift()
    engine.kick()
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.started) return
    window.setTimeout(() => (suppress.current = false), 0)
    panelRef.current?.removeAttribute("data-dragging")
    const en = engine.entries.get(id)
    if (!en) return
    const s = d.samples
    let vy = 0
    if (s.length > 1) {
      const a = s[Math.max(0, s.length - 4)]
      const b = s[s.length - 1]
      vy = ((b.y - a.y) / Math.max(1, b.t - a.t)) * 1000
    }
    void e
    const vis = en.h.x - (engine.dialog ? 0 : EXTRA)
    const dismiss = !cancelled && (en.drag.x > vis * 0.35 || vy > 450)
    en.dragging = false
    if (dismiss) {
      if (engine.dialog) {
        en.drag.to = en.drag.x
        en.drag.v = 0
      } else {
        const total = vis + 24
        en.pres.x = clamp(1 - en.drag.x / total, 0, 1)
        en.pres.v = -Math.max(0, vy) / total
        en.drag.x = 0
        en.drag.v = 0
      }
      ctx.pop()
    } else {
      en.drag.v = vy
    }
    engine.kick()
  }

  const showBack = hasParent
  return (
    <div
      ref={(el) => {
        panelRef.current = el
        setRef(ref, el)
      }}
      className={cn("sks-panel", className)}
      role="dialog"
      aria-modal={isTop ? true : undefined}
      aria-labelledby={`${uid}-t`}
      aria-describedby={description ? `${uid}-d` : undefined}
      tabIndex={-1}
      inert={!isTop || undefined}
      data-sheet-id={id}
      data-title={title}
      data-back={backLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e, false)}
      onPointerCancel={(e) => endDrag(e, true)}
      onClickCapture={(e) => {
        if (suppress.current) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      <div className="sks-sizer" ref={sizerRef}>
        <div className="sks-grab" aria-hidden="true" />
        <header className="sks-header" ref={headRef}>
          <span className="sks-lead">
            {showBack && (
              <button type="button" className="sks-back" ref={backRef} onClick={() => ctx.pop()}>
                <Chevron />
                <span />
              </button>
            )}
          </span>
          <h2 className="sks-title" id={`${uid}-t`}>{title}</h2>
          <span className="sks-trail">
            <button type="button" className="sks-close" aria-label={ctx.stack.length > 1 ? "Close all" : "Close"} onClick={() => ctx.close()}>
              <XIcon />
            </button>
          </span>
        </header>
        <div className="sks-body" ref={bodyRef} data-scroll={scrollable} data-drag={!scrollable}>
          <div ref={bodyInRef}>
            {description && <p className="sks-desc" id={`${uid}-d`}>{description}</p>}
            {children}
          </div>
        </div>
        {footer && (
          <div className="sks-footer" ref={footRef}>
            {footer}
          </div>
        )}
      </div>
      <span className="sks-dim" ref={dimRef} aria-hidden="true" />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                SheetTrigger                                */
/* -------------------------------------------------------------------------- */

export function SheetTrigger({ sheet, onClick, type = "button", ref, ...rest }: SheetTriggerProps) {
  const c = React.useContext(SheetStackContext)
  if (!c) throw new Error("<SheetTrigger> must be used inside <SheetStack>")
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-haspopup="dialog"
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) c.push(sheet)
      }}
    />
  )
}

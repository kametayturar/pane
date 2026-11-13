"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ModalSize = "sm" | "md" | "lg"

export type ModalProps = {
  /** Controlled open state. Leave it out to let the modal manage itself. */
  open?: boolean
  /** Uncontrolled initial state. */
  defaultOpen?: boolean
  /** Called with the next state whenever the person opens or dismisses it. */
  onOpenChange?: (open: boolean) => void
  /** Label of the built-in trigger button. Default "Archive 212 threads". */
  trigger?: string
  /** Dialog title. Default "Archive 212 threads?". */
  title?: string
  /** One sentence under the title. */
  description?: string
  /** Body of the dialog. Defaults to a short summary of what the agent found. */
  children?: React.ReactNode
  /** Replaces the page behind the dialog (and the trigger with it). Use `triggerRef` to say where the dialog grows from. */
  stage?: React.ReactNode
  /** The element the dialog grows out of when you bring your own `stage`. */
  triggerRef?: React.RefObject<HTMLElement | null>
  /** Label of the main button. Default "Archive 212". */
  confirmLabel?: string
  /** Label of the quiet button. Default "Cancel". */
  cancelLabel?: string
  /** Width of the dialog: 360, 440 or 560px. Default "md". */
  size?: ModalSize
  /** Footer buttons: "end" (side by side, right) or "stretch" (full width). Default "end". */
  actions?: "end" | "stretch"
  /** Dim and blur the page behind. Default true. */
  blur?: boolean
  /** Close on a press outside the dialog. Default true. */
  closeOnOutside?: boolean
  /** Show the close button in the corner. Default true. */
  showClose?: boolean
  /** When false the dialog ignores Escape, outside presses and the drag, so only its own buttons close it. Default true. */
  dismissible?: boolean
  /** Called on the main button. The modal closes afterwards. */
  onConfirm?: () => void
  /** Called on the quiet button, the close button, Escape, an outside press and a drag-away. */
  onCancel?: () => void
  /** Play the built-in demo. Default: on when the modal is not controlled. It stops for good at the first touch, key or focus. */
  autoplay?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mdl {
  --mdl-ink: #000;
  --mdl-surface: #fff;
  --mdl-page: #fafafa;
  --mdl-accent: #0060e2;
  --mdl-t1: color-mix(in oklab, var(--mdl-ink) 88%, transparent);
  --mdl-t2: color-mix(in oklab, var(--mdl-ink) 61%, transparent);
  --mdl-t3: color-mix(in oklab, var(--mdl-ink) 45%, transparent);
  --mdl-t4: color-mix(in oklab, var(--mdl-ink) 27%, transparent);
  --mdl-fill: color-mix(in oklab, var(--mdl-ink) 6%, transparent);
  --mdl-line: color-mix(in oklab, var(--mdl-ink) 6%, transparent);
  --mdl-scrim: rgb(0 0 0 / .16);
  --mdl-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --mdl-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 4px -1px rgb(0 0 0 / .06), 0 24px 48px -12px rgb(0 0 0 / .22);
  --mdl-ease: cubic-bezier(.22, 1, .36, 1);
  --mdl-r: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 760px;
  font: 13px/20px var(--mdl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--mdl-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .mdl {
  --mdl-ink: #fff;
  --mdl-surface: #1c1c1e;
  --mdl-page: #131315;
  --mdl-accent: #4d8dff;
  --mdl-t1: color-mix(in oklab, var(--mdl-ink) 90%, transparent);
  --mdl-t2: color-mix(in oklab, var(--mdl-ink) 62%, transparent);
  --mdl-t3: color-mix(in oklab, var(--mdl-ink) 46%, transparent);
  --mdl-t4: color-mix(in oklab, var(--mdl-ink) 28%, transparent);
  --mdl-fill: color-mix(in oklab, var(--mdl-ink) 8%, transparent);
  --mdl-line: color-mix(in oklab, var(--mdl-ink) 9%, transparent);
  --mdl-scrim: rgb(0 0 0 / .5);
  --mdl-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --mdl-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 2px 4px -1px rgb(0 0 0 / .4), 0 24px 48px -12px rgb(0 0 0 / .6);
}
html[data-style="mono"] .mdl {
  --mdl-ink: #000; --mdl-surface: #fff; --mdl-page: #fff; --mdl-accent: #111; --mdl-r: 4px;
  --mdl-shadow: 0 0 0 1px rgb(0 0 0 / .14); --mdl-pop: 0 0 0 1px rgb(0 0 0 / .5), 6px 6px 0 rgb(0 0 0 / .08);
  --mdl-ease: cubic-bezier(.2, .9, .1, 1); --mdl-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .mdl { --mdl-ink: #fff; --mdl-surface: #0a0a0a; --mdl-page: #0a0a0a; --mdl-accent: #f2f2f2; --mdl-shadow: 0 0 0 1px rgb(255 255 255 / .16); --mdl-pop: 0 0 0 1px rgb(255 255 255 / .5), 6px 6px 0 rgb(255 255 255 / .06) }
html[data-style="glass"] .mdl {
  --mdl-ink: var(--pane-ink); --mdl-surface: var(--pane-solid); --mdl-accent: var(--pane-accent); --mdl-shadow: var(--pane-shadow);
  --mdl-ease: var(--pane-ease); --mdl-font: var(--pane-font);
  --mdl-t1: var(--pane-t1); --mdl-t2: var(--pane-t2); --mdl-t3: var(--pane-t3); --mdl-t4: var(--pane-t4);
}
html[data-style="glass"] .mdl-page { background: transparent }
html[data-style="glass"] .mdl-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .mdl-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
.mdl *, .mdl *::before, .mdl *::after { box-sizing: border-box }
:where(.mdl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.mdl) p, :where(.mdl) h2 { margin: 0; font: inherit }
.mdl button:focus-visible { outline: 2px solid var(--mdl-accent); outline-offset: 2px }
.mdl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* The stage: a page with something to confirm, and the layer the dialog lives in. */
.mdl-root { position: relative; overflow: hidden; border-radius: var(--mdl-r); background: var(--mdl-page); box-shadow: var(--mdl-shadow); min-height: 420px; isolation: isolate }
.mdl-page { position: relative; padding: 20px 24px 24px; min-height: 420px; transform-origin: 50% 40%;
  transition: transform .5s var(--mdl-ease) }
.mdl-root[data-open="true"] .mdl-page { transform: scale(.985) }
.mdl-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px 16px; flex-wrap: wrap }
.mdl-h { display: grid; min-width: 0 }
.mdl-h > span { grid-area: 1 / 1; transition: opacity .3s var(--mdl-ease), filter .3s var(--mdl-ease), transform .4s var(--mdl-ease) }
.mdl-h-t { font-size: 15px; line-height: 20px; font-weight: 500; letter-spacing: -.01em }
.mdl-h-s { color: var(--mdl-t3); font-size: 12.5px }
.mdl-h-done { opacity: 0; filter: blur(4px); transform: translateY(6px) }
.mdl-bar[data-done="true"] .mdl-h-idle { opacity: 0; filter: blur(4px); transform: translateY(-6px) }
.mdl-bar[data-done="true"] .mdl-h-done { opacity: 1; filter: none; transform: none }
.mdl-count { font-variant-numeric: tabular-nums }

.mdl-btn { height: 36px; padding: 0 16px; border-radius: 10px; font-weight: 500; letter-spacing: -.005em; white-space: nowrap;
  transition: transform .16s var(--mdl-ease), background-color .2s var(--mdl-ease), opacity .2s var(--mdl-ease) }
.mdl-btn:active, .mdl-btn[data-pressed] { transform: scale(.97) }
.mdl-primary { background: var(--mdl-t1); color: var(--mdl-surface) }
html[data-style="glass"] .mdl-primary { color: var(--pane-solid) }
.mdl-primary:hover { background: color-mix(in oklab, var(--mdl-ink) 78%, transparent) }
.mdl-quiet { background: var(--mdl-fill); color: var(--mdl-t1) }
.mdl-quiet:hover { background: color-mix(in oklab, var(--mdl-ink) 10%, transparent) }
html[data-style="mono"] .mdl-btn { border-radius: 3px }

.mdl-list { list-style: none; margin: 20px 0 0; padding: 0; display: grid }
.mdl-row { display: grid; grid-template-columns: minmax(0, 140px) minmax(0, 1fr) auto; gap: 16px; align-items: baseline; padding: 10px 0; border-top: 1px solid var(--mdl-line) }
.mdl-row b { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.mdl-row span { color: var(--mdl-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.mdl-row time { color: var(--mdl-t3); font-size: 12.5px; font-variant-numeric: tabular-nums }
.mdl-row[data-old="true"] b, .mdl-row[data-old="true"] span { color: var(--mdl-t3) }
@container (max-width: 520px) {
  .mdl-row { grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px }
  .mdl-row span { grid-column: 1 / -1; grid-row: 2 }
  .mdl-page { padding: 16px 16px 20px }
  .mdl-row:nth-child(n+5) { display: none }
  .mdl-root, .mdl-page { min-height: 380px }
}

/* Layers: scrim under the dialog, both only reachable while open. */
.mdl-scrim { position: absolute; inset: 0; z-index: 1; background: var(--mdl-scrim); opacity: 0; visibility: hidden;
  -webkit-backdrop-filter: blur(0); backdrop-filter: blur(0);
  transition: opacity .16s var(--mdl-ease), backdrop-filter .16s var(--mdl-ease), -webkit-backdrop-filter .16s var(--mdl-ease), visibility 0s .16s }
.mdl-root[data-open="true"] .mdl-scrim { opacity: calc(1 - var(--mp, 0) * .7); visibility: visible;
  transition: opacity .4s var(--mdl-ease), backdrop-filter .4s var(--mdl-ease), -webkit-backdrop-filter .4s var(--mdl-ease), visibility 0s }
.mdl-root[data-open="true"][data-blur="true"] .mdl-scrim { -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px) }
.mdl-root[data-drag="true"] .mdl-scrim { transition: none }
.mdl-layer { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; padding: 16px; pointer-events: none }
.mdl-dlg { pointer-events: auto; width: 100%; max-width: var(--mdl-w, 440px); transform: translate3d(0, var(--my, 0px), 0); touch-action: none; visibility: hidden;
  transition: visibility 0s .16s }
.mdl-root[data-open="true"] .mdl-dlg { visibility: visible; transition: visibility 0s }
.mdl-dlg[data-drag="true"] { cursor: grabbing }
/* a fling keeps the card whole: the dialog leaves at the speed of the flick, it does not fade */
.mdl-dlg[data-flung] .mdl-card { opacity: 1; transform: none; filter: none; transition: none }
.mdl-card { position: relative; outline: none; border-radius: var(--mdl-r); background: var(--mdl-surface); box-shadow: var(--mdl-pop); padding: 24px 24px 20px;
  opacity: 0; transform: scale(.94); filter: blur(4px); transform-origin: var(--ox, 50%) var(--oy, 50%);
  transition: opacity .12s var(--mdl-ease), transform .16s var(--mdl-ease), filter .12s var(--mdl-ease) }
.mdl-root[data-open="true"] .mdl-card { opacity: 1; transform: none; filter: none;
  transition: opacity .3s var(--mdl-ease), transform .52s var(--mdl-ease), filter .4s var(--mdl-ease) }
.mdl-root[data-open="true"] .mdl-card > * { animation: mdl-in .5s var(--mdl-ease) backwards; animation-delay: calc(.06s + var(--i, 0) * .045s) }
@keyframes mdl-in { from { opacity: 0; transform: translateY(6px); filter: blur(3px) } }

.mdl-x { position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; color: var(--mdl-t3);
  transition: background-color .2s var(--mdl-ease), color .2s var(--mdl-ease), transform .16s var(--mdl-ease) }
.mdl-x:hover { background: var(--mdl-fill); color: var(--mdl-t1) }
.mdl-x:active { transform: scale(.94) }
.mdl-title { font-size: 17px; line-height: 24px; font-weight: 600; letter-spacing: -.015em; padding-right: 32px; text-wrap: balance }
.mdl-desc { margin-top: 4px; color: var(--mdl-t2); text-wrap: pretty }
.mdl-body { margin-top: 16px; max-height: min(40cqh, 280px); overflow: auto; touch-action: pan-y; overscroll-behavior: contain }
.mdl-facts { margin: 0; padding: 0; list-style: none; display: grid }
.mdl-facts li { display: flex; justify-content: space-between; gap: 16px; padding: 8px 0; border-top: 1px solid var(--mdl-line) }
.mdl-facts span { color: var(--mdl-t2) }
.mdl-facts b { font-weight: 500; font-variant-numeric: tabular-nums }
.mdl-foot { margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px }
.mdl[data-actions="stretch"] .mdl-foot { flex-direction: column-reverse }
.mdl[data-actions="stretch"] .mdl-foot .mdl-btn { width: 100%; height: 40px }
.mdl-foot-note { color: var(--mdl-t3); font-size: 12.5px; margin-top: 12px }

@media (prefers-reduced-motion: reduce) {
  .mdl *, .mdl *::before, .mdl *::after { transition-duration: .01ms !important; transition-delay: 0s !important; animation: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const WIDTH: Record<ModalSize, number> = { sm: 360, md: 440, lg: 560 }
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
const NO_DRAG = "button, a, input, textarea, select, [data-nodrag]"

/** Drag past the edge of its range feels like pulling on elastic: the further, the stiffer. */
const rubber = (x: number, dim: number) => (x * dim * 0.55) / (dim + x * 0.55)

const ROWS: { who: string; what: string; when: string; old?: boolean }[] = [
  { who: "Harbor & Finch", what: "Invoice 2291 is due Friday", when: "09:12" },
  { who: "Northwind", what: "Your quarterly summary is ready", when: "Tue" },
  { who: "Quill", what: "Draft of the launch note, version 3", when: "Mon" },
  { who: "Sage", what: "Re: pricing for the studio plan", when: "Mar 14", old: true },
  { who: "Harbor & Finch", what: "Receipt for order 4417", when: "Feb 02", old: true },
  { who: "Northwind", what: "We have updated our terms", when: "Jan 19", old: true },
]

function useRoot() {
  const ref = React.useRef<HTMLDivElement>(null)
  return ref
}

/* -------------------------------------------------------------------------- */
/*                                   Modal                                    */
/* -------------------------------------------------------------------------- */

export function Modal({
  open: openProp,
  defaultOpen,
  onOpenChange,
  trigger = "Archive 212 threads",
  title = "Archive 212 threads?",
  description = "Atlas found threads older than 90 days with no reply. They leave your inbox and stay searchable for 30 days.",
  children,
  stage,
  triggerRef,
  confirmLabel = "Archive 212",
  cancelLabel = "Cancel",
  size = "md",
  actions = "end",
  blur = true,
  closeOnOutside = true,
  showClose = true,
  dismissible = true,
  onConfirm,
  onCancel,
  autoplay,
  className,
}: ModalProps) {
  const controlled = openProp !== undefined
  const demoOn = autoplay ?? (!controlled && defaultOpen === undefined)

  const reduce = React.useMemo(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? (demoOn && reduce))
  const open = controlled ? !!openProp : innerOpen
  const [done, setDone] = React.useState(false)
  const [press, setPress] = React.useState<"trigger" | "confirm" | null>(null)
  const [drag, setDrag] = React.useState(false)
  const [stopped, setStopped] = React.useState(!demoOn || reduce)

  const rootRef = useRoot()
  const stageRef = React.useRef<HTMLDivElement>(null)
  const pageRef = React.useRef<HTMLDivElement>(null)
  const dlgRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const ownTrigger = React.useRef<HTMLButtonElement>(null)
  const confirmRef = React.useRef<HTMLButtonElement>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  const kbd = React.useRef(false)
  const demo = React.useRef({ on: demoOn && !reduce })
  const titleId = React.useId()
  const descId = React.useId()

  const my = React.useRef(0)
  const flung = React.useRef(false)
  const spring = React.useRef(0)
  const drg = React.useRef<{ id: number; y0: number; my0: number; last: { t: number; y: number }[] } | null>(null)

  const setMy = (v: number, dim = 600) => {
    my.current = v
    const el = dlgRef.current
    const stageEl = stageRef.current
    if (!el || !stageEl) return
    el.style.setProperty("--my", `${v}px`)
    stageEl.style.setProperty("--mp", String(Math.max(0, Math.min(1, v / dim))))
  }

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInnerOpen(next)
      onOpenChange?.(next)
    },
    [controlled, onOpenChange],
  )

  /* ---- origin: the dialog grows out of the button that opened it ---- */
  const prevOpen = React.useRef(open)
  React.useLayoutEffect(() => {
    const was = prevOpen.current
    prevOpen.current = open
    const root = stageRef.current
    const wrap = dlgRef.current
    const card = cardRef.current
    if (!root || !wrap || !card) return
    if (open && !was) {
      cancelAnimationFrame(spring.current)
      // a fling leaves the wrapper far away; bring it home without a transition
      wrap.style.transition = "none"
      card.style.transition = "none"
      setMy(0)
      const t = (triggerRef?.current ?? ownTrigger.current)?.getBoundingClientRect()
      const r = root.getBoundingClientRect()
      const w = wrap.getBoundingClientRect()
      if (t && r.width) {
        card.style.setProperty("--ox", `${t.left + t.width / 2 - w.left}px`)
        card.style.setProperty("--oy", `${t.top + t.height / 2 - w.top}px`)
      } else {
        card.style.setProperty("--ox", "50%")
        card.style.setProperty("--oy", "50%")
      }
      delete wrap.dataset.flung
      void card.offsetWidth
      wrap.style.transition = ""
      card.style.transition = ""
    }
    if (!open && was) {
      // closed with the button, Escape or a tap: leave from where it sits, not from the fling
      if (!drg.current && Math.abs(my.current) > 0.5 && !flung.current) setMy(0)
      flung.current = false
    }
  }, [open, triggerRef])

  /* ---- focus: in on open (keyboard and pointer, never in the demo), back on close ---- */
  // layout effect: the page loses `inert` before focus goes back to the trigger
  React.useLayoutEffect(() => {
    const page = pageRef.current
    if (page) {
      if (open) page.setAttribute("inert", "")
      else page.removeAttribute("inert")
    }
    if (open) {
      if (demo.current.on) return
      returnTo.current = (document.activeElement as HTMLElement) ?? null
      const t = window.setTimeout(() => {
        const first = confirmRef.current ?? dlgRef.current?.querySelector<HTMLElement>(FOCUSABLE)
        ;(first ?? cardRef.current)?.focus({ preventScroll: true })
      }, 30)
      return () => window.clearTimeout(t)
    }
    if (!demo.current.on) {
      const a = document.activeElement
      const lost = !a || a === document.body || !!dlgRef.current?.contains(a)
      const back = returnTo.current ?? triggerRef?.current ?? ownTrigger.current
      if (lost && back && back.isConnected) back.focus({ preventScroll: true })
    }
    returnTo.current = null
  }, [open, triggerRef])

  // the demo gave way to a person while the dialog is open: bring focus inside so Tab and Escape work
  React.useEffect(() => {
    if (!open || !stopped || !demoOn) return
    const a = document.activeElement
    if (!dlgRef.current?.contains(a)) cardRef.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopped])

  // Escape also works when focus sits on the page body
  React.useEffect(() => {
    if (!open || !dismissible) return
    const f = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      const a = document.activeElement
      if (!a || a === document.body) dismiss()
    }
    document.addEventListener("keydown", f)
    return () => document.removeEventListener("keydown", f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dismissible])

  const dismiss = React.useCallback(
    (viaDrag = false) => {
      if (!viaDrag) setMy(0)
      onCancel?.()
      setOpen(false)
    },
    [onCancel, setOpen],
  )

  const confirm = () => {
    onConfirm?.()
    if (!stage) setDone(true)
    setMy(0)
    setOpen(false)
  }

  /* ---- keyboard: Escape closes, Tab stays inside ---- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === "Escape" && dismissible) {
      e.stopPropagation()
      dismiss()
      return
    }
    if (e.key !== "Tab") return
    const list = Array.from(dlgRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (!list.length) return
    const first = list[0]
    const last = list[list.length - 1]
    const a = document.activeElement
    if (e.shiftKey && (a === first || a === cardRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && a === last) {
      e.preventDefault()
      first.focus()
    }
  }

  /* ---- the physics: follow the pointer 1:1, resist upwards, release with velocity ---- */
  const dimOf = () => stageRef.current?.getBoundingClientRect().height ?? 420

  const runSpring = (from: number, v0: number) => {
    cancelAnimationFrame(spring.current)
    let x = from
    let v = v0
    let last = performance.now()
    const K = 300
    const C = 24
    const t0 = last
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const a = -K * x - C * v
      v += a * dt
      x += v * dt
      if ((Math.abs(x) < 0.3 && Math.abs(v) < 8) || now - t0 > 1400) {
        setMy(0)
        return
      }
      setMy(x)
      spring.current = requestAnimationFrame(step)
    }
    spring.current = requestAnimationFrame(step)
    // if frames never arrive (a throttled tab) the dialog still lands home
    window.setTimeout(() => {
      if (!drg.current && my.current !== 0 && open) {
        cancelAnimationFrame(spring.current)
        setMy(0)
      }
    }, 1600)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!open || !dismissible || e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest(NO_DRAG)) return
    const body = target.closest<HTMLElement>(".mdl-body")
    if (body && body.scrollHeight > body.clientHeight) return
    cancelAnimationFrame(spring.current) // catch it mid-flight
    drg.current = { id: e.pointerId, y0: e.clientY, my0: my.current, last: [{ t: performance.now(), y: e.clientY }] }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drg.current
    if (!d || e.pointerId !== d.id) return
    const raw = d.my0 + (e.clientY - d.y0)
    setMy(raw < 0 ? -rubber(-raw, 160) : raw, dimOf())
    const now = performance.now()
    d.last.push({ t: now, y: e.clientY })
    while (d.last.length > 2 && now - d.last[0].t > 90) d.last.shift()
  }
  const endDrag = (e: React.PointerEvent, cancelled = false) => {
    const d = drg.current
    if (!d || e.pointerId !== d.id) return
    drg.current = null
    setDrag(false)
    const a = d.last[0]
    const b = d.last[d.last.length - 1]
    const vy = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0 // px per second
    const y = my.current
    const away = !cancelled && ((y > 110 && vy > -200) || (y > 24 && vy > 650))
    if (away) {
      const dim = dimOf()
      const dist = dim - (dlgRef.current?.offsetTop ?? 0) + 40
      const ms = Math.max(180, Math.min(360, (Math.max(dist - y, 40) / Math.max(vy, 900)) * 1000))
      flung.current = true
      const wrap = dlgRef.current
      if (wrap) {
        wrap.dataset.flung = "1"
        wrap.style.transition = `transform ${ms}ms cubic-bezier(.22,1,.36,1), visibility 0s ${ms}ms`
        wrap.style.setProperty("--my", `${dist}px`)
        my.current = dist
        window.setTimeout(() => {
          if (wrap.dataset.flung) wrap.style.transition = ""
        }, ms + 40)
      }
      dismiss(true)
    } else {
      runSpring(y, vy)
    }
  }

  /* ---- the built-in demo ---- */
  const [seen, setSeen] = React.useState(true)
  const [tabOn, setTabOn] = React.useState(true)
  const step = React.useRef(0)

  const stop = React.useCallback(() => {
    demo.current.on = false
    setStopped(true)
  }, [])

  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([en]) => setSeen(en.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [rootRef])
  React.useEffect(() => {
    const f = () => setTabOn(!document.hidden)
    f()
    document.addEventListener("visibilitychange", f)
    return () => document.removeEventListener("visibilitychange", f)
  }, [])

  const running = !stopped && seen && tabOn
  React.useEffect(() => {
    if (!running) return
    let dead = false
    let timer = 0
    const wait = (ms: number, next: () => void) => {
      timer = window.setTimeout(() => {
        if (!dead) next()
      }, ms)
    }
    const play = (s: number) => {
      step.current = s
      switch (s) {
        case 0:
          setDone(false)
          return wait(900, () => play(1))
        case 1:
          setPress("trigger")
          return wait(150, () => {
            setPress(null)
            setInnerOpen(true)
            play(2)
          })
        case 2:
          return wait(2600, () => play(3))
        case 3:
          setPress("confirm")
          return wait(160, () => {
            setPress(null)
            setDone(true)
            setMy(0)
            setInnerOpen(false)
            play(4)
          })
        default:
          return wait(2600, () => play(0))
      }
    }
    play(step.current)
    return () => {
      dead = true
      window.clearTimeout(timer)
    }
  }, [running])

  const stopOnTouch = () => {
    if (demo.current.on) stop()
  }

  const live = open ? `${title} dialog opened` : ""
  const w = WIDTH[size]

  return (
    <div
      ref={rootRef}
      className={cn("mdl", className)}
      data-actions={actions}
      onKeyDownCapture={stopOnTouch}
      onPointerDownCapture={stopOnTouch}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) kbd.current = true
        stopOnTouch()
      }}
      onKeyDown={onKeyDown}
    >
      <style href="modal" precedence="default">
        {CSS}
      </style>
      <p className="mdl-sr" role="status" aria-live="polite">
        {live}
      </p>
      <div
        ref={stageRef}
        className="mdl-root"
        data-open={open}
        data-blur={blur}
        data-drag={drag || undefined}
        style={{ "--mdl-w": `${w}px` } as React.CSSProperties}
      >
        <div ref={pageRef} className="mdl-page">
          {stage ?? (
            <>
              <div className="mdl-bar" data-done={done}>
                <div className="mdl-h" aria-live="polite">
                  <span className="mdl-h-idle">
                    <span className="mdl-h-t" style={{ display: "block" }}>Inbox</span>
                    <span className="mdl-h-s mdl-count">1,284 threads</span>
                  </span>
                  <span className="mdl-h-done">
                    <span className="mdl-h-t" style={{ display: "block" }}>Inbox</span>
                    <span className="mdl-h-s mdl-count">1,072 threads · 212 archived</span>
                  </span>
                </div>
                <button
                  ref={ownTrigger}
                  type="button"
                  className="mdl-btn mdl-primary"
                  data-pressed={press === "trigger" || undefined}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setDone(false)
                    setOpen(true)
                  }}
                >
                  {trigger}
                </button>
              </div>
              <ul className="mdl-list">
                {ROWS.map((r) => (
                  <li key={r.who + r.what} className="mdl-row" data-old={r.old || undefined}>
                    <b>{r.who}</b>
                    <span>{r.what}</span>
                    <time>{r.when}</time>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div
          className="mdl-scrim"
          aria-hidden
          onPointerDown={() => {
            if (open && closeOnOutside && dismissible) dismiss()
          }}
        />
        <div className="mdl-layer">
          <div
            ref={dlgRef}
            className="mdl-dlg"
            data-drag={drag || undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={(e) => endDrag(e, true)}
          >
            <div
              ref={cardRef}
              className="mdl-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              aria-hidden={!open}
              tabIndex={-1}
              inert={!open}
            >
              {showClose && dismissible && (
                <button type="button" className="mdl-x" aria-label="Close" onClick={() => dismiss()} style={{ "--i": 0 } as React.CSSProperties}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                    <path d="M3 3l8 8M11 3l-8 8" />
                  </svg>
                </button>
              )}
              <h2 id={titleId} className="mdl-title" style={{ "--i": 0 } as React.CSSProperties}>
                {title}
              </h2>
              {description && (
                <p id={descId} className="mdl-desc" style={{ "--i": 1 } as React.CSSProperties}>
                  {description}
                </p>
              )}
              <div className="mdl-body" style={{ "--i": 2 } as React.CSSProperties} >
                {children ?? (
                  <ul className="mdl-facts">
                    <li>
                      <span>No reply in 90 days</span>
                      <b>212</b>
                    </li>
                    <li>
                      <span>Starred or flagged</span>
                      <b>0 skipped</b>
                    </li>
                    <li>
                      <span>Label “Billing”</span>
                      <b>41</b>
                    </li>
                  </ul>
                )}
              </div>
              <div className="mdl-foot" style={{ "--i": 3 } as React.CSSProperties}>
                <button type="button" className="mdl-btn mdl-quiet" onClick={() => dismiss()}>
                  {cancelLabel}
                </button>
                <button ref={confirmRef} type="button" className="mdl-btn mdl-primary" data-pressed={press === "confirm" || undefined} onClick={confirm}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

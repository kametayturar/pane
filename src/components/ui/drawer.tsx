"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DrawerSide = "bottom" | "right" | "left"

export type DrawerProps = {
  /** Which edge the drawer is attached to. Default "bottom". */
  side?: DrawerSide
  /** Heights it can rest at, as fractions of the stage (0–1). Default [0.42, 0.9] for bottom, [0.78] for the sides. */
  snapPoints?: number[]
  /** The snap point it opens at (a value from `snapPoints`). Defaults to the lowest. */
  defaultSnap?: number
  /** Controlled open state. Setting it (or `onOpenChange`) turns the built-in demo off. */
  open?: boolean
  /** Start open when uncontrolled. Default true. */
  defaultOpen?: boolean
  /** Called when a drag, flick, key or button opens or closes it. */
  onOpenChange?: (open: boolean) => void
  /** Called with the fraction it settled on. */
  onSnapChange?: (snap: number) => void
  /** Whether a drag, flick, Esc, the close button or the scrim can close it. Default true. When false it stops at the lowest snap point. */
  dismissible?: boolean
  /** Spring stiffness for a release. Default 320. */
  stiffness?: number
  /** Spring damping for a release. Default 30 (a little under critical, so a hard flick settles with one small bounce). */
  damping?: number
  /** How much of a pull past an edge you see, 0–0.4. Default 0.2. */
  rubberBand?: number
  /** Release speed in px/ms above which it moves a snap point regardless of distance. Default 0.5. */
  flickVelocity?: number
  /** Show the drag handle. Default true. */
  showHandle?: boolean
  /** Dim the page, make it inert while open and keep focus in the drawer. Default true. */
  modal?: boolean
  /** Scale the page back a little as the drawer rises. Default true. */
  scaleBackground?: boolean
  /** Heading of the drawer. Default "Quarterly close". */
  title?: string
  /** Line under the heading. */
  description?: string
  /** Replaces the run details inside the drawer. Anything with `data-no-drag` is left alone by the drag. */
  children?: React.ReactNode
  /** Replaces the page behind the drawer. */
  background?: React.ReactNode
  /** Label of the button that opens it again. Default "Run details". */
  triggerLabel?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.drw {
  --drw-ink: #000;
  --drw-surface: #fff;
  --drw-accent: #0060e2;
  --drw-t1: color-mix(in oklab, var(--drw-ink) 88%, transparent);
  --drw-t2: color-mix(in oklab, var(--drw-ink) 61%, transparent);
  --drw-t3: color-mix(in oklab, var(--drw-ink) 45%, transparent);
  --drw-t4: color-mix(in oklab, var(--drw-ink) 27%, transparent);
  --drw-fill: color-mix(in oklab, var(--drw-ink) 6%, transparent);
  --drw-line: color-mix(in oklab, var(--drw-ink) 6%, transparent);
  --drw-well: color-mix(in oklab, var(--drw-ink) 5%, #fff);
  --drw-scrim: rgb(0 0 0 / .34);
  --drw-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --drw-sheet-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 0 28px -4px rgb(0 0 0 / .16);
  --drw-ease: cubic-bezier(.22, 1, .36, 1);
  --drw-r: 24px; --drw-sr: 20px;
  position: relative; container-type: inline-size; width: 100%; max-width: 440px;
  font: 13px/20px var(--drw-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--drw-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .drw {
  --drw-ink: #fff;
  --drw-surface: #1c1c1e;
  --drw-accent: #4d8dff;
  --drw-t1: color-mix(in oklab, var(--drw-ink) 90%, transparent);
  --drw-t2: color-mix(in oklab, var(--drw-ink) 62%, transparent);
  --drw-t3: color-mix(in oklab, var(--drw-ink) 46%, transparent);
  --drw-t4: color-mix(in oklab, var(--drw-ink) 28%, transparent);
  --drw-fill: color-mix(in oklab, var(--drw-ink) 8%, transparent);
  --drw-line: color-mix(in oklab, var(--drw-ink) 9%, transparent);
  --drw-well: #0b0b0c;
  --drw-scrim: rgb(0 0 0 / .52);
  --drw-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
  --drw-sheet-shadow: 0 0 0 .5px rgb(255 255 255 / .12), 0 0 28px -4px rgb(0 0 0 / .6);
}
html[data-style="mono"] .drw {
  --drw-ink: #000; --drw-surface: #fff; --drw-accent: #111; --drw-well: #efefef; --drw-r: 6px; --drw-sr: 6px;
  --drw-shadow: 0 0 0 1px rgb(0 0 0 / .14); --drw-sheet-shadow: 0 0 0 1px rgb(0 0 0 / .3);
  --drw-ease: cubic-bezier(.2, .9, .1, 1); --drw-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .drw { --drw-ink: #fff; --drw-surface: #0a0a0a; --drw-accent: #f2f2f2; --drw-well: #1a1a1a; --drw-shadow: 0 0 0 1px rgb(255 255 255 / .16); --drw-sheet-shadow: 0 0 0 1px rgb(255 255 255 / .34) }
html[data-style="glass"] .drw {
  --drw-ink: var(--pane-ink); --drw-surface: var(--pane-solid); --drw-accent: var(--pane-accent); --drw-shadow: var(--pane-shadow);
  --drw-ease: var(--pane-ease); --drw-font: var(--pane-font);
  --drw-t1: var(--pane-t1); --drw-t2: var(--pane-t2); --drw-t3: var(--pane-t3); --drw-t4: var(--pane-t4);
}
html[data-style="glass"] .drw-sheet { background-color: color-mix(in srgb, var(--pane-solid) 86%, transparent); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(36px) saturate(1.6); backdrop-filter: blur(36px) saturate(1.6) }
html[data-style="glass"].dark .drw-sheet { -webkit-backdrop-filter: blur(36px) saturate(1.5); backdrop-filter: blur(36px) saturate(1.5) }
.drw *, .drw *::before, .drw *::after { box-sizing: border-box }
:where(.drw) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.drw) p, :where(.drw) h3, :where(.drw) ol { margin: 0; padding: 0 }
:where(.drw) ol { list-style: none }
.drw button:focus-visible { outline: 2px solid var(--drw-accent); outline-offset: 2px }
.drw-sheet:focus { outline: none }
.drw-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.drw-stage { position: relative; overflow: hidden; height: clamp(420px, 118cqw, 540px); border-radius: var(--drw-r); background: var(--drw-well); box-shadow: var(--drw-shadow); isolation: isolate; clip-path: inset(0 round var(--drw-r)) }

/* The page behind */
.drw-page { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 22px 24px 24px; background: var(--drw-surface); transform-origin: 50% 0; will-change: transform; overflow: hidden }
.drw-page-title { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em }
.drw-page-sub { color: var(--drw-t2) }
.drw-runs { margin-top: 18px; border-top: 1px solid var(--drw-line) }
.drw-run { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--drw-line) }
.drw-run b { font-weight: 500 }
.drw-run span { color: var(--drw-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.drw-run small { display: block; font-size: 13px; color: var(--drw-t2) }
.drw-open {
  margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 10px;
  font-size: 15px; font-weight: 500; background: var(--drw-fill); transition: transform .16s var(--drw-ease), background-color .16s var(--drw-ease);
}
.drw-open:hover { background: color-mix(in oklab, var(--drw-ink) 10%, transparent) }
.drw-open:active { transform: scale(.96) }

.drw-scrim { position: absolute; inset: 0; z-index: 1; background: var(--drw-scrim); opacity: 0; pointer-events: none }
.drw[data-vis] .drw-scrim { pointer-events: auto }
.drw[data-nomodal] .drw-scrim { background: transparent }

/* The sheet: always as tall as its highest snap point; it slides, it never resizes */
.drw-sheet {
  position: absolute; z-index: 2; display: flex; flex-direction: column; background: var(--drw-surface); box-shadow: var(--drw-sheet-shadow);
  touch-action: none; user-select: none; -webkit-user-select: none; will-change: transform; visibility: hidden; overscroll-behavior: contain;
}
.drw[data-vis] .drw-sheet { visibility: visible }
.drw-sheet[data-soft] { transition: transform .22s var(--drw-ease) }
.drw[data-side="bottom"] .drw-sheet { left: 0; right: 0; bottom: 0; height: calc(var(--drw-top) * 100%); border-radius: var(--drw-sr) var(--drw-sr) 0 0 }
.drw[data-side="right"] .drw-sheet { top: 0; bottom: 0; right: 0; width: calc(var(--drw-top) * 100%); border-radius: var(--drw-sr) 0 0 var(--drw-sr) }
.drw[data-side="left"] .drw-sheet { top: 0; bottom: 0; left: 0; width: calc(var(--drw-top) * 100%); border-radius: 0 var(--drw-sr) var(--drw-sr) 0 }

.drw-grab { position: relative; flex: none; display: flex; justify-content: center; align-items: center; width: 100%; height: 24px; cursor: grab }
.drw[data-side="right"] .drw-grab, .drw[data-side="left"] .drw-grab { display: none }
.drw-sheet[data-drag] .drw-grab, .drw-sheet[data-drag] { cursor: grabbing }
.drw-grab::before { content: ""; width: 36px; height: 5px; border-radius: 3px; background: var(--drw-t4); transition: background-color .16s var(--drw-ease), width .24s var(--drw-ease) }
.drw-grab:hover::before, .drw-sheet[data-drag] .drw-grab::before { background: var(--drw-t3); width: 44px }
.drw-grab:focus-visible { outline-offset: -4px; border-radius: 12px }

.drw-head { flex: none; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 4px 24px 16px }
.drw[data-side="right"] .drw-head, .drw[data-side="left"] .drw-head { padding-top: 22px }
.drw-title { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--drw-t1) }
.drw-desc { color: var(--drw-t2) }
.drw-x { flex: none; display: grid; place-items: center; width: 32px; height: 32px; margin: -4px -8px 0 0; border-radius: 10px; color: var(--drw-t2); transition: background-color .16s var(--drw-ease), transform .16s var(--drw-ease) }
.drw-x:hover { background: var(--drw-fill) }
.drw-x:active { transform: scale(.94) }
.drw-body { flex: 1; min-height: 0; padding: 0 24px 24px; overflow: hidden; overscroll-behavior: contain }
.drw-sheet[data-top] .drw-body { overflow-y: auto; touch-action: pan-y }

.drw-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding-bottom: 20px; border-bottom: 1px solid var(--drw-line) }
.drw-stat dt { font-size: 12px; line-height: 16px; color: var(--drw-t3) }
.drw-stat dd { margin: 2px 0 0; font-size: 22px; line-height: 28px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; color: var(--drw-t1) }
.drw-h { margin-top: 18px; font-size: 12px; line-height: 16px; letter-spacing: .02em; color: var(--drw-t3) }
.drw-steps { margin-top: 6px }
.drw-step { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 10px 0; border-bottom: 1px solid var(--drw-line) }
.drw-step:last-child { border-bottom: 0 }
.drw-step b { font-weight: 500 }
.drw-step span { color: var(--drw-t3); font-variant-numeric: tabular-nums; text-align: right }
.drw-step code { grid-column: 1; font: 12px/16px ui-monospace, "SF Mono", Menlo, monospace; color: var(--drw-t3) }

.drw-hint { margin-top: 12px; font-size: 12px; line-height: 16px; color: var(--drw-t3); text-align: center }

/* The finger of the built-in demo */
.drw-finger {
  position: absolute; z-index: 3; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; pointer-events: none;
  background: color-mix(in oklab, var(--drw-ink) 12%, transparent); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--drw-ink) 20%, transparent);
  opacity: 0; transform: translate3d(50%, 50%, 0) scale(1.15); transition: opacity .22s var(--drw-ease)
}
.drw-finger[data-on] { opacity: 1 }

@container (max-width: 340px) {
  .drw-page, .drw-head, .drw-body { padding-left: 20px; padding-right: 20px }
  .drw-stat dd { font-size: 20px }
}
@media (prefers-reduced-motion: reduce) {
  .drw-open, .drw-x, .drw-grab::before { transition: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Engine                                   */
/* -------------------------------------------------------------------------- */

type Eng = {
  t: number // distance from fully open, towards closed, in px
  v: number // px/s, towards closed positive
  mode: 0 | 1 | 2 // idle, dragging, springing
  raf: number
  last: number
  target: number
  crit: boolean
  raw: number // finger position before rubber-banding
  startRaw: number
  startPtr: number
  samples: [number, number][]
  soft: number
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const MONO_STEPS = [
  ["Read ledger export", "sheets.read", "1.2s"],
  ["Match invoices to POs", "match", "48.3s"],
  ["Flag 3 mismatches", "rules", "2.1s"],
  ["Draft summary", "write", "11.6s"],
  ["Ask Finance about Northwind", "ask", "2m 05s"],
  ["Send report", "mail.send", "0.8s"],
]

function DefaultBackground({ label, onOpen, trigRef }: { label: string; onOpen: () => void; trigRef: React.Ref<HTMLButtonElement> }) {
  return (
    <>
      <h3 className="drw-page-title">Runs</h3>
      <p className="drw-page-sub">Harbor &amp; Finch · today</p>
      <div className="drw-runs">
        <div className="drw-run"><div><b>Quarterly close</b><small>Atlas</small></div><span>4m 12s</span></div>
        <div className="drw-run"><div><b>Vendor email triage</b><small>Quill</small></div><span>1m 03s</span></div>
        <div className="drw-run"><div><b>Weekly digest</b><small>Sage</small></div><span>38s</span></div>
      </div>
      <button ref={trigRef} type="button" className="drw-open" onClick={onOpen}>{label}</button>
    </>
  )
}

function DefaultBody() {
  return (
    <>
      <dl className="drw-stats" style={{ margin: 0 }}>
        <div className="drw-stat"><dt>Duration</dt><dd>4m 12s</dd></div>
        <div className="drw-stat"><dt>Tokens</dt><dd>18.4k</dd></div>
        <div className="drw-stat"><dt>Cost</dt><dd>$0.42</dd></div>
      </dl>
      <p className="drw-h">TRACE</p>
      <ol className="drw-steps">
        {MONO_STEPS.map(([name, tool, d]) => (
          <li key={name} className="drw-step"><b>{name}</b><span>{d}</span><code>{tool}</code></li>
        ))}
      </ol>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function Drawer(props: DrawerProps) {
  const {
    side = "bottom",
    dismissible = true,
    stiffness = 320,
    damping = 30,
    rubberBand = 0.2,
    flickVelocity = 0.5,
    showHandle = true,
    modal = true,
    scaleBackground = true,
    title = "Quarterly close",
    description = "Atlas · finished 09:41",
    triggerLabel = "Run details",
    onOpenChange,
    onSnapChange,
    children,
    background,
    className,
  } = props
  const bare = props.open === undefined && onOpenChange === undefined
  const snaps = React.useMemo(
    () => [...(props.snapPoints ?? (side === "bottom" ? [0.42, 0.9] : [0.78]))].filter((n) => n > 0 && n <= 1).sort((a, b) => a - b),
    [props.snapPoints, side],
  )
  const topSnap = snaps[snaps.length - 1] ?? 0.9
  const lowSnap = snaps[0] ?? topSnap
  const startSnap = snaps.reduce((b, s) => (Math.abs(s - (props.defaultSnap ?? lowSnap)) < Math.abs(b - (props.defaultSnap ?? lowSnap)) ? s : b), lowSnap)

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const [openState, setOpenState] = React.useState(props.defaultOpen ?? true)
  const [snap, setSnap] = React.useState(startSnap)
  const [vis, setVis] = React.useState(props.open ?? props.defaultOpen ?? true)
  const [auto, setAuto] = React.useState(true)
  const [active, setActive] = React.useState(false)
  const [live, setLive] = React.useState("")
  const open = props.open ?? openState
  const axis = side === "bottom" ? "y" : "x"
  const sg = side === "left" ? -1 : 1

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const sheetRef = React.useRef<HTMLDivElement>(null)
  const scrimRef = React.useRef<HTMLDivElement>(null)
  const pageRef = React.useRef<HTMLDivElement>(null)
  const grabRef = React.useRef<HTMLButtonElement>(null)
  const fingerRef = React.useRef<HTMLDivElement>(null)
  const trigRef = React.useRef<HTMLButtonElement>(null)
  const size = React.useRef(0)
  const pend = React.useRef<{ id: number; x: number; y: number; started: boolean } | null>(null)
  const moved = React.useRef(false)
  const E = React.useRef<Eng>({ t: 0, v: 0, mode: 0, raf: 0, last: 0, target: 0, crit: false, raw: 0, startRaw: 0, startPtr: 0, samples: [], soft: 0 }).current

  const cfg = React.useRef({ side, axis, sg, snaps, topSnap, dismissible, stiffness, damping, rubberBand, flickVelocity, scaleBackground, reduce, onOpenChange, onSnapChange, props })
  cfg.current = { side, axis, sg, snaps, topSnap, dismissible, stiffness, damping, rubberBand, flickVelocity, scaleBackground, reduce, onOpenChange, onSnapChange, props }
  const live2 = React.useRef({ open, snap })
  live2.current = { open, snap }

  /* ---- geometry (all in px along the drawer's axis) ---- */
  const posOf = React.useCallback((f: number) => (cfg.current.topSnap - f) * size.current, [])
  const closedT = () => cfg.current.topSnap * size.current
  const lowT = () => (cfg.current.dismissible ? closedT() : posOf(cfg.current.snaps[0] ?? cfg.current.topSnap))

  const apply = React.useCallback((t: number) => {
    const c = cfg.current
    const sheet = sheetRef.current
    if (!sheet) return
    E.t = t
    sheet.style.transform = c.axis === "y" ? `translate3d(0,${c.sg * t}px,0)` : `translate3d(${c.sg * t}px,0,0)`
    const cl = closedT()
    const p = cl > 0 ? clamp(1 - t / cl, 0, 1) : 0
    if (scrimRef.current) scrimRef.current.style.opacity = p.toFixed(3)
    const page = pageRef.current
    if (page) {
      page.style.transform = c.scaleBackground && p > 0.001 ? `scale(${(1 - 0.05 * p).toFixed(4)})` : ""
      page.style.borderRadius = c.scaleBackground && p > 0.001 ? `${(p * 16).toFixed(1)}px` : ""
    }
  }, [E])

  const disp = (raw: number) => {
    const rb = cfg.current.reduce ? 0 : cfg.current.rubberBand
    const hi = lowT()
    return raw < 0 ? raw * rb : raw > hi ? hi + (raw - hi) * rb : raw
  }
  const inv = (d: number) => {
    const rb = Math.max(0.001, cfg.current.reduce ? 0 : cfg.current.rubberBand)
    const hi = lowT()
    return d < 0 ? d / rb : d > hi ? hi + (d - hi) / rb : d
  }

  /** Every place it can rest, nearest the top first. */
  const cands = React.useCallback((): { t: number; f: number | null }[] => {
    const c = cfg.current
    const list = [...c.snaps].reverse().map((f) => ({ t: posOf(f), f: f as number | null }))
    if (c.dismissible) list.push({ t: closedT(), f: null })
    return list
  }, [posOf])

  const commit = React.useCallback((f: number | null) => {
    const c = cfg.current
    if (f === null) {
      setOpenState(false)
      if (live2.current.open) c.onOpenChange?.(false)
      setLive("Drawer closed")
    } else {
      setSnap(f)
      setVis(true)
      if (!live2.current.open) {
        setOpenState(true)
        c.onOpenChange?.(true)
      }
      c.onSnapChange?.(f)
      setLive(`Drawer ${Math.round(f * 100)} percent`)
    }
  }, [])

  const settle = React.useCallback(() => {
    if (E.target >= closedT() - 0.5 && cfg.current.dismissible) setVis(false)
  }, [E])

  const frame = React.useCallback(
    (now: number) => {
      const c = cfg.current
      const dt = Math.min((now - E.last) / 1000, 1 / 30)
      E.last = now
      const k = c.stiffness
      const d = E.crit ? 2 * Math.sqrt(k) : c.damping
      let t = E.t
      let v = E.v
      const h = dt / 4
      for (let i = 0; i < 4; i++) {
        v += (-k * (t - E.target) - d * v) * h
        t += v * h
      }
      E.v = v
      if (Math.abs(v) < 8 && Math.abs(t - E.target) < 0.4) {
        E.v = 0
        E.mode = 0
        apply(E.target)
        settle()
        return
      }
      apply(t)
      E.raf = requestAnimationFrame(frame)
    },
    [E, apply, settle],
  )

  const goTo = React.useCallback(
    (t: number, o: { crit?: boolean; instant?: boolean } = {}) => {
      cancelAnimationFrame(E.raf)
      E.target = t
      E.crit = o.crit ?? true
      if (o.instant || cfg.current.reduce) {
        E.v = 0
        E.mode = 0
        const sheet = sheetRef.current
        if (cfg.current.reduce && !o.instant && sheet) {
          sheet.setAttribute("data-soft", "")
          clearTimeout(E.soft)
          E.soft = window.setTimeout(() => sheet.removeAttribute("data-soft"), 260)
        }
        apply(t)
        settle()
        return
      }
      E.mode = 2
      E.last = performance.now()
      E.raf = requestAnimationFrame(frame)
    },
    [E, apply, frame, settle],
  )

  const begin = React.useCallback(
    (ptr = 0) => {
      cancelAnimationFrame(E.raf)
      E.mode = 1
      E.v = 0
      E.samples = []
      E.raw = inv(E.t)
      E.startRaw = E.raw
      E.startPtr = ptr
      sheetRef.current?.setAttribute("data-drag", "")
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [E],
  )

  const move = React.useCallback(
    (raw: number) => {
      E.raw = raw
      E.samples.push([performance.now(), disp(raw)])
      while (E.samples.length > 2 && E.samples[0][0] < performance.now() - 120) E.samples.shift()
      apply(disp(raw))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [E, apply],
  )

  /** Lets go: reads the finger's speed from the last 80ms and picks where to land. */
  const release = React.useCallback(() => {
    const c = cfg.current
    sheetRef.current?.removeAttribute("data-drag")
    const now = performance.now()
    const s = E.samples.filter((x) => now - x[0] < 100)
    let v = 0
    if (s.length >= 2 && now - s[s.length - 1][0] < 80) {
      const a = s[0]
      const b = s[s.length - 1]
      if (b[0] - a[0] > 8) v = ((b[1] - a[1]) / (b[0] - a[0])) * 1000
    }
    if (c.reduce) v = 0
    const list = cands()
    const t = E.t
    const near = (x: number) => list.reduce((b, k) => (Math.abs(k.t - x) < Math.abs(b.t - x) ? k : b), list[0])
    let pick = near(t + v * 0.12)
    const sp = Math.abs(v) / 1000
    if (sp > c.flickVelocity && !c.reduce) {
      const dir = v > 0 ? 1 : -1
      const ahead = dir > 0 ? list.filter((k) => k.t > t + 2) : list.filter((k) => k.t < t - 2).reverse()
      if (ahead.length) pick = ahead[Math.min(ahead.length - 1, sp > c.flickVelocity * 2.5 ? 1 : 0)]
    }
    E.v = v
    E.target = pick.t
    commit(pick.f)
    if (Math.abs(t - pick.t) < 0.4 && Math.abs(v) < 8) {
      goTo(pick.t, { instant: true })
      return
    }
    cancelAnimationFrame(E.raf)
    E.target = pick.t
    E.crit = false
    E.mode = 2
    if (c.reduce) {
      goTo(pick.t)
      return
    }
    E.last = performance.now()
    E.raf = requestAnimationFrame(frame)
  }, [E, cands, commit, goTo, frame])

  /** Opens to a snap point or closes with a critically damped move (no bounce unless a finger caused it). */
  const moveTo = React.useCallback(
    (f: number | null) => {
      const t = f === null ? closedT() : posOf(f)
      if (f !== null) setVis(true)
      commit(f)
      goTo(t, { crit: true })
    },
    [commit, goTo, posOf],
  )

  /* ---- size, initial placement ---- */
  React.useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const read = () => {
      size.current = axis === "y" ? el.clientHeight : el.clientWidth
      const c = cfg.current
      const f = live2.current.open ? live2.current.snap : null
      cancelAnimationFrame(E.raf)
      E.mode = 0
      E.target = f === null ? (c.dismissible ? closedT() : posOf(c.snaps[0] ?? c.topSnap)) : posOf(f)
      apply(E.target)
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(E.raf)
    }
  }, [axis, apply, posOf, E, topSnap])

  /* ---- follow props / state changes that did not come from a finger ---- */
  React.useEffect(() => {
    if (!size.current || E.mode === 1) return
    const f = open ? snap : null
    const t = f === null ? (dismissible ? closedT() : posOf(lowSnap)) : posOf(f)
    if (Math.abs(E.target - t) < 0.5 && (E.mode === 2 || Math.abs(E.t - t) < 0.5)) return
    if (f !== null) setVis(true)
    goTo(t, { crit: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, snap])

  React.useEffect(() => {
    if (props.open === undefined) return
    if (props.open) setVis(true)
    else if (!E.mode) setVis(false)
  }, [props.open, E])

  /* ---- focus and inert ---- */
  const wasOpen = React.useRef(open)
  React.useEffect(() => {
    const page = pageRef.current
    page?.toggleAttribute("inert", modal && open)
    return () => page?.removeAttribute("inert")
  }, [modal, open])
  React.useEffect(() => {
    if (wasOpen.current === open) return
    wasOpen.current = open
    if (auto && bare) return
    if (open) sheetRef.current?.focus({ preventScroll: true })
    else if (sheetRef.current?.contains(document.activeElement) || document.activeElement === document.body) trigRef.current?.focus({ preventScroll: true })
  }, [open, auto, bare])

  /* ---- pointer ---- */
  const handlers = React.useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void }>({ move: () => {}, up: () => {} })
  const unlisten = React.useRef<(() => void) | null>(null)
  const stopListening = () => {
    unlisten.current?.()
    unlisten.current = null
  }
  React.useEffect(() => () => unlisten.current?.(), [])
  const coord = (e: { clientX: number; clientY: number }) => (cfg.current.axis === "y" ? e.clientY : e.clientX)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0) return
    const tgt = e.target as HTMLElement
    if (tgt.closest("[data-no-drag],input,textarea,select,a")) return
    if (tgt.closest("button") && !tgt.closest(".drw-grab")) return
    const sc = tgt.closest(".drw-body") as HTMLElement | null
    if (sc && sc.scrollTop > 1) return
    moved.current = false
    pend.current = { id: e.pointerId, x: e.clientX, y: e.clientY, started: false }
    // follow the pointer on the window so a fast flick that leaves the sheet is still tracked
    stopListening()
    const mv = (ev: PointerEvent) => handlers.current.move(ev)
    const up = (ev: PointerEvent) => handlers.current.up(ev)
    window.addEventListener("pointermove", mv)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    unlisten.current = () => {
      window.removeEventListener("pointermove", mv)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    if (E.mode === 2) {
      // caught it mid-flight
      begin(coord(e))
      pend.current.started = true
      moved.current = true
    }
  }
  const onPointerMove = (e: PointerEvent) => {
    const p = pend.current
    if (!p || p.id !== e.pointerId) return
    const c = cfg.current
    const d = c.axis === "y" ? e.clientY - p.y : e.clientX - p.x
    const cross = c.axis === "y" ? e.clientX - p.x : e.clientY - p.y
    if (!p.started) {
      if (Math.abs(d) < 4) return
      if (Math.abs(cross) > Math.abs(d)) {
        pend.current = null
        stopListening()
        return
      }
      p.started = true
      moved.current = true
      begin(coord(e)) // starts where the finger is now, so nothing jumps
    }
    move(E.startRaw + (coord(e) - E.startPtr) * c.sg)
  }
  const onPointerUp = (e: PointerEvent) => {
    const p = pend.current
    if (!p || p.id !== e.pointerId) return
    pend.current = null
    stopListening()
    if (p.started) release()
  }
  handlers.current = { move: onPointerMove, up: onPointerUp }

  /* ---- keyboard ---- */
  const step = (dir: 1 | -1) => {
    const list = cands().filter((k) => k.f !== null)
    const i = list.findIndex((k) => Math.abs(k.t - E.target) < 1)
    const n = list[clamp((i < 0 ? 0 : i) + dir, 0, list.length - 1)]
    if (n) moveTo(n.f)
  }
  const onGrabKey = (e: React.KeyboardEvent) => {
    const up = side === "bottom" ? "ArrowUp" : side === "right" ? "ArrowLeft" : "ArrowRight"
    const down = side === "bottom" ? "ArrowDown" : side === "right" ? "ArrowRight" : "ArrowLeft"
    const go = (fn: () => void) => {
      e.preventDefault()
      fn()
    }
    if (e.key === up) go(() => step(-1))
    else if (e.key === down) go(() => step(1))
    else if (e.key === "Home") go(() => moveTo(topSnap))
    else if (e.key === "End") go(() => moveTo(lowSnap))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open && dismissible) {
      e.stopPropagation()
      moveTo(null)
    }
  }
  const onGrabClick = () => {
    if (moved.current) return
    const list = snaps
    if (list.length < 2) return
    moveTo(snap >= topSnap ? lowSnap : (list[list.indexOf(snap) + 1] ?? topSnap))
  }
  const reopen = () => moveTo(startSnap)

  /* ---- run only while on screen and in a visible tab ---- */
  React.useEffect(() => {
    if (!bare) return
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
  }, [bare])

  /* ---- the built-in demo: three real drags through the same code path as a finger ---- */
  React.useEffect(() => {
    if (!bare || !active || reduce || !auto || side !== "bottom" || snaps.length < 2 || !dismissible) return
    let dead = false
    const timers: number[] = []
    let raf = 0
    const sleep = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)))
    const finger = fingerRef.current
    const placeFinger = () => {
      const g = grabRef.current
      const st = stageRef.current
      if (!g || !st || !finger) return
      const a = g.getBoundingClientRect()
      const b = st.getBoundingClientRect()
      finger.style.transform = `translate3d(${a.left - b.left + a.width / 2}px,${a.top - b.top + a.height / 2}px,0) scale(1)`
    }
    const fingerOn = (on: boolean) => finger?.toggleAttribute("data-on", on)
    const drag = (to: number, ms: number) =>
      new Promise<void>((res) => {
        begin(0)
        const from = E.raw
        const t0 = performance.now()
        const tick = (now: number) => {
          if (dead) return res()
          const p = Math.min(1, (now - t0) / ms)
          move(from + (to - from) * p)
          placeFinger()
          if (p < 1) raf = requestAnimationFrame(tick)
          else {
            release()
            res()
          }
        }
        raf = requestAnimationFrame(tick)
      })
    const grab = async () => {
      placeFinger()
      fingerOn(true)
      await sleep(460)
    }
    ;(async () => {
      while (!dead) {
        if (!live2.current.open || Math.abs(E.t - posOf(lowSnap)) > 2) moveTo(lowSnap)
        await sleep(1500)
        if (dead) break
        await grab()
        await drag(-110, 340) // pull up past the top: rubber-band, then leave at speed
        fingerOn(false)
        await sleep(1900)
        if (dead) break
        await grab()
        await drag(E.t + 150, 170) // flick down: lands on the lower height
        fingerOn(false)
        await sleep(1700)
        if (dead) break
        await grab()
        await drag(E.t + 90, 90) // short, fast: dismissed on speed, not distance
        fingerOn(false)
        await sleep(1500)
        if (dead) break
        moveTo(lowSnap)
        await sleep(2600)
      }
    })()
    return () => {
      dead = true
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      fingerOn(false)
      if (E.mode === 1) {
        // interrupted mid-drag: settle on the nearest height, no scripted fling
        sheetRef.current?.removeAttribute("data-drag")
        const near = cands().reduce((b, k) => (Math.abs(k.t - E.t) < Math.abs(b.t - E.t) ? k : b))
        commit(near.f)
        goTo(near.t, { crit: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bare, active, reduce, auto, side, snaps, dismissible])

  const stop = () => setAuto(false)
  const pct = Math.round(snap * 100)
  const sheetStyle: React.CSSProperties & Record<string, string | number> = { "--drw-top": topSnap }

  return (
    <div
      ref={rootRef}
      className={cn("drw", className)}
      data-side={side}
      data-vis={vis || undefined}
      data-nomodal={modal ? undefined : ""}
      onPointerDownCapture={stop}
      onKeyDownCapture={stop}
      onFocusCapture={stop}
      onKeyDown={onKeyDown}
    >
      <style href="drawer" precedence="default">{CSS}</style>
      <div ref={stageRef} className="drw-stage">
        <div ref={pageRef} className="drw-page">
          {background ?? <DefaultBackground label={triggerLabel} onOpen={reopen} trigRef={trigRef} />}
        </div>
        <div ref={scrimRef} className="drw-scrim" aria-hidden="true" onClick={() => open && dismissible && modal && moveTo(null)} />
        <div
          ref={sheetRef}
          className="drw-sheet"
          role="dialog"
          aria-modal={modal}
          aria-label={title}
          tabIndex={-1}
          data-top={snap >= topSnap ? "" : undefined}
          style={sheetStyle}
          onPointerDown={onPointerDown}
        >
          {showHandle && (
            <button
              ref={grabRef}
              type="button"
              className="drw-grab"
              aria-label={`Resize drawer, ${pct}% high. ${side === "bottom" ? "Arrow up and down" : "Arrow left and right"} change the height.`}
              onKeyDown={onGrabKey}
              onClick={onGrabClick}
            />
          )}
          <div className="drw-head">
            <div>
              <h3 className="drw-title">{title}</h3>
              {description && <p className="drw-desc">{description}</p>}
            </div>
            {dismissible && (
              <button type="button" className="drw-x" aria-label="Close" onClick={() => moveTo(null)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </div>
          <div className="drw-body" tabIndex={snap >= topSnap ? 0 : -1} aria-label="Drawer content">
            {children ?? <DefaultBody />}
          </div>
        </div>
        <div ref={fingerRef} className="drw-finger" aria-hidden="true" />
      </div>
      <p className="drw-hint">Drag the handle, flick it away, or use the arrow keys and Esc.</p>
      <div className="drw-sr" role="status" aria-live="polite">{live}</div>
    </div>
  )
}

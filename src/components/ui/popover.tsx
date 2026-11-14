"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PopoverSide = "bottom" | "top"
export type PopoverAlign = "start" | "center" | "end"

export type PopoverItem = {
  /** Stable id. The open panel is identified by it. */
  id: string
  /** Text of the trigger button. */
  label: React.ReactNode
  /** Quiet text after the label, e.g. a count. */
  meta?: React.ReactNode
  /** Panel width in px. The panel never gets wider than the viewport minus its padding. Default 260. */
  width?: number
  /** What the panel shows for this trigger. */
  content: React.ReactNode
}

export type PopoverProps = {
  /** The triggers and their panels. Omit it to get the built-in Status, Sort and Share demo. */
  items?: PopoverItem[]
  /** Controlled: the id of the open panel, or `null` for closed. */
  value?: string | null
  /** Uncontrolled starting value. Setting `value` or `defaultValue` turns the built-in demo off. */
  defaultValue?: string | null
  /** Called when the open panel changes, including to `null` on close. */
  onValueChange?: (id: string | null) => void
  /** Preferred side. The panel flips to the other side when it does not fit. Default "bottom". */
  side?: PopoverSide
  /** Alignment to the trigger. Default "center". */
  align?: PopoverAlign
  /** Gap between trigger and panel in px, arrow included. Default 10. */
  offset?: number
  /** Minimum distance to the viewport edge in px. Default 12. */
  collisionPadding?: number
  /** Show the arrow that points at the trigger. Default true. */
  arrow?: boolean
  /** "click" toggles on press. "hover" also opens on pointer hover with a short delay. Default "click". */
  trigger?: "click" | "hover"
  /** Make the panel exactly as wide as its trigger. */
  matchTriggerWidth?: boolean
  /** Accessible name of the trigger group. Default "Filters". */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pvr, .pvr-pn {
  --pvr-ink: #000;
  --pvr-surface: #fff;
  --pvr-accent: #0060e2;
  --pvr-t1: color-mix(in oklab, var(--pvr-ink) 88%, transparent);
  --pvr-t2: color-mix(in oklab, var(--pvr-ink) 61%, transparent);
  --pvr-t3: color-mix(in oklab, var(--pvr-ink) 55%, transparent);
  --pvr-t4: color-mix(in oklab, var(--pvr-ink) 27%, transparent);
  --pvr-fill: color-mix(in oklab, var(--pvr-ink) 6%, transparent);
  --pvr-line: color-mix(in oklab, var(--pvr-ink) 6%, transparent);
  --pvr-edge: color-mix(in oklab, var(--pvr-ink) 10%, transparent);
  --pvr-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 36px -8px rgb(0 0 0 / .08);
  --pvr-pop: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 2px 0 rgb(0 0 0 / .06), 0 12px 32px -6px rgb(0 0 0 / .16), 0 24px 56px -12px rgb(0 0 0 / .1);
  --pvr-ease: cubic-bezier(.22, 1, .36, 1);
  font: 13px/20px var(--pvr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--pvr-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) :is(.pvr, .pvr-pn) {
  --pvr-ink: #fff;
  --pvr-surface: #1c1c1e;
  --pvr-accent: #4d8dff;
  --pvr-t1: color-mix(in oklab, var(--pvr-ink) 90%, transparent);
  --pvr-t2: color-mix(in oklab, var(--pvr-ink) 62%, transparent);
  --pvr-t3: color-mix(in oklab, var(--pvr-ink) 46%, transparent);
  --pvr-t4: color-mix(in oklab, var(--pvr-ink) 28%, transparent);
  --pvr-fill: color-mix(in oklab, var(--pvr-ink) 8%, transparent);
  --pvr-line: color-mix(in oklab, var(--pvr-ink) 9%, transparent);
  --pvr-edge: color-mix(in oklab, var(--pvr-ink) 14%, transparent);
  --pvr-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 36px -8px rgb(0 0 0 / .4);
  --pvr-pop: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px 0 rgb(0 0 0 / .4), 0 14px 36px -6px rgb(0 0 0 / .55);
}
html[data-style="mono"] :is(.pvr, .pvr-pn) {
  --pvr-ink: #000; --pvr-surface: #fff; --pvr-accent: #111; --pvr-shadow: 0 0 0 1px rgb(0 0 0 / .14); --pvr-pop: 0 0 0 1px rgb(0 0 0 / .2), 3px 3px 0 rgb(0 0 0 / .08);
  --pvr-ease: cubic-bezier(.2, .9, .1, 1); --pvr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark :is(.pvr, .pvr-pn) { --pvr-ink: #fff; --pvr-surface: #0a0a0a; --pvr-accent: #f2f2f2; --pvr-shadow: 0 0 0 1px rgb(255 255 255 / .16); --pvr-pop: 0 0 0 1px rgb(255 255 255 / .24) }
html[data-style="glass"] :is(.pvr, .pvr-pn) {
  --pvr-ink: var(--pane-ink); --pvr-surface: var(--pane-solid); --pvr-accent: var(--pane-accent); --pvr-shadow: var(--pane-shadow); --pvr-pop: var(--pane-float, var(--pane-shadow));
  --pvr-ease: var(--pane-ease); --pvr-font: var(--pane-font);
  --pvr-t1: var(--pane-t1); --pvr-t2: var(--pane-t2); --pvr-t3: var(--pane-t3); --pvr-t4: var(--pane-t4);
}
html[data-style="glass"] .pvr-stage { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card); -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
html[data-style="glass"].dark .pvr-stage { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
html[data-style="glass"] .pvr-surface { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-float, var(--pane-card)); -webkit-backdrop-filter: blur(26px) saturate(2.1); backdrop-filter: blur(26px) saturate(2.1) }
html[data-style="glass"].dark .pvr-surface { -webkit-backdrop-filter: blur(26px) saturate(1.9); backdrop-filter: blur(26px) saturate(1.9) }
html[data-style="glass"][data-refract] .pvr-surface { -webkit-backdrop-filter: url(#pane-glass-menu-l) saturate(1.9) brightness(1.05); backdrop-filter: url(#pane-glass-menu-l) saturate(1.9) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .pvr-surface { -webkit-backdrop-filter: url(#pane-glass-menu-d) saturate(1.8) brightness(1.1); backdrop-filter: url(#pane-glass-menu-d) saturate(1.8) brightness(1.1) }
html[data-style="glass"] .pvr-arw path { fill: var(--pane-tint) }

.pvr { position: relative; container-type: inline-size; width: 100%; max-width: 640px }
.pvr *, .pvr *::before, .pvr *::after, .pvr-pn *, .pvr-pn *::before, .pvr-pn *::after { box-sizing: border-box }
:where(.pvr, .pvr-pn) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.pvr, .pvr-pn) p { margin: 0 }
:is(.pvr, .pvr-pn) :focus-visible { outline: 2px solid var(--pvr-accent); outline-offset: 2px }
.pvr-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* The page behind the trigger row, so the panel has something to cover */
.pvr-stage { border-radius: 20px; background: var(--pvr-surface); box-shadow: var(--pvr-shadow); padding: 18px 20px 12px; min-height: 360px }
.pvr-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px }
.pvr-title { font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em; color: var(--pvr-t1) }
.pvr-sub { color: var(--pvr-t3) }
.pvr-bar { display: flex; gap: 2px; margin: 0 -10px }
.pvr-tr {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border-radius: 9px; white-space: nowrap; font-weight: 500; color: var(--pvr-t2);
  transition: background-color .16s var(--pvr-ease), color .16s var(--pvr-ease), transform .16s var(--pvr-ease);
}
.pvr-tr:hover { background: var(--pvr-fill); color: var(--pvr-t1) }
.pvr-tr:active, .pvr-tr[data-pressed] { transform: scale(.96) }
.pvr-tr[aria-expanded="true"] { background: var(--pvr-fill); color: var(--pvr-t1) }
.pvr-tr em { font-style: normal; color: var(--pvr-t3); font-variant-numeric: tabular-nums }
.pvr-chev { width: 10px; height: 10px; flex: none; color: var(--pvr-t3); transition: transform .28s var(--pvr-ease) }
.pvr-tr[aria-expanded="true"] .pvr-chev { transform: rotate(180deg) }

.pvr-rows { margin-top: 14px; border-top: 1px solid var(--pvr-line) }
.pvr-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 2px 16px; padding: 11px 0; border-bottom: 1px solid var(--pvr-line) }
.pvr-row b { font-weight: 500; color: var(--pvr-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.pvr-row span { color: var(--pvr-t3) }
.pvr-row i { font-style: normal; text-align: right; font-variant-numeric: tabular-nums; color: var(--pvr-t2) }
.pvr-row > span { grid-column: 1 }

/* The floating panel: one element for the whole group, positioned by the spring in the script */
.pvr-pn { position: fixed; left: 0; top: 0; z-index: 60; pointer-events: none; will-change: transform }
.pvr-pn[data-open] { pointer-events: auto }
.pvr-pn-in {
  position: absolute; inset: 0; opacity: 0; scale: .96;
  transition: opacity .12s var(--pvr-ease), scale .12s var(--pvr-ease);
}
.pvr-pn[data-open] .pvr-pn-in { opacity: 1; scale: 1; transition: opacity .22s var(--pvr-ease), scale .34s var(--pvr-ease) }
.pvr-surface { position: absolute; inset: 0; border-radius: 14px; background: var(--pvr-surface); box-shadow: var(--pvr-pop); overflow: hidden }
.pvr-arw { position: absolute; left: 0; width: 22px; height: 11px; overflow: visible; pointer-events: none }
.pvr-arw path { fill: var(--pvr-surface); stroke: var(--pvr-edge); stroke-width: .75; stroke-linejoin: round }
.pvr-pn[data-side="bottom"] .pvr-arw { top: -10.5px }
.pvr-pn[data-side="top"] .pvr-arw { bottom: -10.5px; transform: scaleY(-1) }
.pvr-pn:not([data-arrow]) .pvr-arw { display: none }

.pvr-layer { position: absolute; left: 0; top: 0; max-width: calc(100vw - 24px) }
.pvr-layer[data-in] { animation: pvr-in .34s var(--pvr-ease) backwards }
.pvr-layer[data-out] { animation: pvr-out .16s var(--pvr-ease) forwards; pointer-events: none }
@keyframes pvr-in { from { opacity: 0; transform: translateX(calc(var(--dir, 0) * 12px)); filter: blur(5px) } }
@keyframes pvr-out { to { opacity: 0; transform: translateX(calc(var(--dir, 0) * -12px)); filter: blur(5px) } }

/* Panel content */
.pvr-body { padding: 8px }
.pvr-lab { padding: 6px 8px 4px; color: var(--pvr-t3); font-weight: 500 }
.pvr-opt {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 8px; border-radius: 8px; cursor: pointer; color: var(--pvr-t1);
  transition: background-color .14s var(--pvr-ease);
}
.pvr-opt:hover { background: var(--pvr-fill) }
.pvr-opt span:last-child { margin-left: auto; color: var(--pvr-t3); font-variant-numeric: tabular-nums }
.pvr-opt[role="radio"] span:last-child { color: var(--pvr-t1); display: flex }
.pvr-box { flex: none; position: relative; width: 16px; height: 16px; border-radius: 5px; box-shadow: inset 0 0 0 1px var(--pvr-t4); transition: background-color .16s var(--pvr-ease), box-shadow .16s var(--pvr-ease) }
.pvr-box svg { position: absolute; inset: 0; width: 16px; height: 16px; color: var(--pvr-surface); opacity: 0; transform: scale(.6); transition: opacity .16s var(--pvr-ease), transform .2s var(--pvr-ease) }
.pvr-opt[aria-checked="true"] .pvr-box { background: var(--pvr-t1); box-shadow: inset 0 0 0 1px var(--pvr-t1) }
.pvr-opt[aria-checked="true"] .pvr-box svg { opacity: 1; transform: none }
.pvr-tick { width: 14px; height: 14px; opacity: 0; transition: opacity .16s var(--pvr-ease) }
.pvr-opt[aria-checked="true"] .pvr-tick { opacity: 1 }
.pvr-foot { display: flex; align-items: center; justify-content: space-between; margin: 6px -8px -8px; padding: 6px 8px 6px 16px; border-top: 1px solid var(--pvr-line); color: var(--pvr-t3) }
.pvr-ghost { height: 30px; padding: 0 10px; border-radius: 8px; font-weight: 500; color: var(--pvr-t2); transition: background-color .14s var(--pvr-ease), transform .16s var(--pvr-ease) }
.pvr-ghost:hover { background: var(--pvr-fill); color: var(--pvr-t1) }
.pvr-ghost:active { transform: scale(.96) }
.pvr-share { padding: 16px }
.pvr-share h3 { margin: 0; font-size: 15px; line-height: 22px; font-weight: 600; letter-spacing: -.005em }
.pvr-share p { color: var(--pvr-t2) }
.pvr-link { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 4px 4px 4px 12px; border-radius: 10px; background: var(--pvr-fill) }
.pvr-link code { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: inherit; color: var(--pvr-t2) }
.pvr-copy { flex: none; height: 30px; padding: 0 12px; border-radius: 8px; font-weight: 500; background: var(--pvr-t1); color: var(--pvr-surface); transition: transform .16s var(--pvr-ease), opacity .16s var(--pvr-ease) }
.pvr-copy:hover { opacity: .88 }
.pvr-copy:active { transform: scale(.96) }

@container (max-width: 460px) {
  .pvr-stage { padding: 16px 16px 8px }
  .pvr-bar { margin: 0 -10px; width: calc(100% + 20px); justify-content: flex-start }
}
@media (pointer: coarse) { .pvr-tr { height: 44px } .pvr-opt { height: 44px } .pvr-ghost, .pvr-copy { height: 40px } }
@media (prefers-reduced-motion: reduce) {
  :is(.pvr, .pvr-pn) *, :is(.pvr, .pvr-pn) *::before, :is(.pvr, .pvr-pn) *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                               Anchored position                            */
/* -------------------------------------------------------------------------- */

type Target = { x: number; y: number; w: number; h: number; side: PopoverSide; cx: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Where the panel wants to be: preferred side, flipped when it does not fit, shifted along the axis to stay on screen. */
function place(trig: DOMRect, size: { w: number; h: number }, o: { side: PopoverSide; align: PopoverAlign; offset: number; pad: number; match: boolean }): Target {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const w = o.match ? trig.width : size.w
  const h = size.h
  const below = vh - trig.bottom - o.offset - o.pad
  const above = trig.top - o.offset - o.pad
  let side = o.side
  if (side === "bottom" && below < h && above > below) side = "top"
  else if (side === "top" && above < h && below > above) side = "bottom"
  const rawY = side === "bottom" ? trig.bottom + o.offset : trig.top - o.offset - h
  const y = clamp(rawY, o.pad, Math.max(o.pad, vh - o.pad - h))
  const cx = trig.left + trig.width / 2
  const rawX = o.align === "start" ? trig.left : o.align === "end" ? trig.right - w : cx - w / 2
  const x = clamp(rawX, o.pad, Math.max(o.pad, vw - o.pad - w))
  return { x, y, w, h, side, cx }
}

const K = 320
const C = 2 * 0.84 * Math.sqrt(K)

type Eng = {
  p: number[] // x y w h
  v: number[]
  t: Target | null
  ready: boolean
  raf: number
  last: number
  timer: number
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/*                               Built-in content                             */
/* -------------------------------------------------------------------------- */

const STATUSES = [
  { id: "open", label: "Open", n: 24 },
  { id: "review", label: "In review", n: 8 },
  { id: "shipped", label: "Shipped", n: 112 },
  { id: "archived", label: "Archived", n: 41 },
]
const SORTS = [
  { id: "new", label: "Newest first" },
  { id: "old", label: "Oldest first" },
  { id: "amount", label: "Largest amount" },
  { id: "name", label: "Customer A to Z" },
]
const ORDERS = [
  ["Northwind Traders", "PO-4821 · Open", "$4,860"],
  ["Alder & Oak", "PO-4819 · In review", "$1,240"],
  ["Finch Supply Co.", "PO-4815 · Shipped", "$312"],
  ["Marlow Foods", "PO-4810 · Shipped", "$2,075"],
  ["Quay Studio", "PO-4806 · Archived", "$689"],
]

const Chev = () => (
  <svg className="pvr-chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 3.75 5 6.75 8 3.75" />
  </svg>
)
const Tick = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4.25 8.4 6.8 10.9 11.75 5.4" />
  </svg>
)

function StatusPanel({ checked, onToggle, onClear }: { checked: string[]; onToggle: (id: string) => void; onClear: () => void }) {
  return (
    <div className="pvr-body" role="group" aria-label="Status">
      <p className="pvr-lab">Status</p>
      {STATUSES.map((s) => (
        <button key={s.id} type="button" role="checkbox" aria-checked={checked.includes(s.id)} className="pvr-opt" onClick={() => onToggle(s.id)}>
          <span className="pvr-box"><Tick /></span>
          <span>{s.label}</span>
          <span>{s.n}</span>
        </button>
      ))}
      <div className="pvr-foot">
        <span>{checked.length ? `${checked.length} selected` : "All statuses"}</span>
        <button type="button" className="pvr-ghost" onClick={onClear}>Clear</button>
      </div>
    </div>
  )
}

function SortPanel({ sort, onSort }: { sort: string; onSort: (id: string) => void }) {
  return (
    <div className="pvr-body" role="radiogroup" aria-label="Sort by">
      <p className="pvr-lab">Sort by</p>
      {SORTS.map((s) => (
        <button key={s.id} type="button" role="radio" aria-checked={sort === s.id} className="pvr-opt" onClick={() => onSort(s.id)}>
          <span>{s.label}</span>
          <span><Tick className="pvr-tick" /></span>
        </button>
      ))}
    </div>
  )
}

function SharePanel() {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = () => {
    try {
      void navigator.clipboard?.writeText("harborfinch.app/o/open-q3")
    } catch {
      /* clipboard can be blocked; the label still confirms the press */
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="pvr-share">
      <h3>Share this view</h3>
      <p>Anyone at Harbor &amp; Finch can open it.</p>
      <div className="pvr-link">
        <code>harborfinch.app/o/open-q3</code>
        <button type="button" className="pvr-copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Popover                                   */
/* -------------------------------------------------------------------------- */

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
const DEMO_SCRIPT: Array<{ id: string | null; wait: number }> = [
  { id: null, wait: 1000 },
  { id: "status", wait: 1900 },
  { id: "sort", wait: 1900 },
  { id: "share", wait: 2300 },
  { id: null, wait: 1500 },
]

export function Popover(props: PopoverProps) {
  const { side = "bottom", align = "center", offset = 10, collisionPadding = 12, arrow = true, trigger = "click", matchTriggerWidth = false, label = "Filters", onValueChange, className } = props
  const bare = props.value === undefined && props.defaultValue === undefined && props.items === undefined

  /* ---- built-in content state ---- */
  const [checked, setChecked] = React.useState<string[]>(["open"])
  const [sort, setSort] = React.useState("new")
  const items: PopoverItem[] = React.useMemo(
    () =>
      props.items ?? [
        {
          id: "status",
          label: "Status",
          meta: checked.length ? checked.length : undefined,
          width: 248,
          content: <StatusPanel checked={checked} onToggle={(id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))} onClear={() => setChecked([])} />,
        },
        { id: "sort", label: "Sort", width: 216, content: <SortPanel sort={sort} onSort={setSort} /> },
        { id: "share", label: "Share", width: 328, content: <SharePanel /> },
      ],
    [props.items, checked, sort],
  )

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  /* ---- which panel is open ---- */
  const [inner, setInner] = React.useState<string | null>(() => (props.defaultValue !== undefined ? props.defaultValue : bare && prefersReduced() ? "sort" : null))
  const value = props.value !== undefined ? props.value : inner
  const setValue = React.useCallback(
    (next: string | null) => {
      if (props.value === undefined) setInner(next)
      onValueChange?.(next)
    },
    [props.value, onValueChange],
  )

  const [shown, setShown] = React.useState<string>(value ?? items[0]?.id ?? "")
  const [leaving, setLeaving] = React.useState<{ id: string; dir: number } | null>(null)
  const [dir, setDir] = React.useState(0)
  const [mounted, setMounted] = React.useState(value !== null)
  const [mountedDom, setMountedDom] = React.useState(false)
  const [auto, setAuto] = React.useState(true)
  const [pressed, setPressed] = React.useState<string | null>(null)
  const [active, setActive] = React.useState(false)
  const [tabId, setTabId] = React.useState<string | null>(null)

  const uid = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const arrowRef = React.useRef<SVGSVGElement>(null)
  const curRef = React.useRef<HTMLDivElement>(null)
  const trigRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const sizes = React.useRef<Record<string, { w: number; h: number }>>({})
  const eng = React.useRef<Eng>({ p: [0, 0, 0, 0], v: [0, 0, 0, 0], t: null, ready: false, raf: 0, last: 0, timer: 0 })
  const shownRef = React.useRef(shown)
  const opt = React.useRef({ side, align, offset, pad: collisionPadding, match: matchTriggerWidth, arrow })
  opt.current = { side, align, offset, pad: collisionPadding, match: matchTriggerWidth, arrow }
  const prevValue = React.useRef<string | null>(value)
  const kbd = React.useRef(false)
  const focusIn = React.useRef(false)
  const closeT = React.useRef(0)
  const leaveT = React.useRef(0)
  const hoverT = React.useRef(0)
  const reduceRef = React.useRef(reduce)
  reduceRef.current = reduce

  /* ---- state follows value ---- */
  React.useEffect(() => {
    const prev = prevValue.current
    prevValue.current = value
    window.clearTimeout(closeT.current)
    if (value !== null) {
      setMounted(true)
      if (value !== shown) {
        const a = items.findIndex((i) => i.id === shown)
        const b = items.findIndex((i) => i.id === value)
        const d = Math.sign(b - a) || 1
        if (prev !== null) {
          setLeaving({ id: shown, dir: d })
          window.clearTimeout(leaveT.current)
          leaveT.current = window.setTimeout(() => setLeaving(null), 200)
          setDir(d)
        } else setDir(0)
        setShown(value)
      } else if (prev === null) setDir(0)
    } else if (prev !== null) {
      closeT.current = window.setTimeout(() => {
        setMounted(false)
        setLeaving(null)
      }, 180)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  React.useEffect(
    () => () => {
      window.clearTimeout(closeT.current)
      window.clearTimeout(leaveT.current)
      window.clearTimeout(hoverT.current)
    },
    [],
  )
  React.useEffect(() => setMountedDom(true), [])

  /* ---- the spring: x, y, width, height chase the anchored target ---- */
  const writePanel = React.useCallback(() => {
    const e = eng.current
    const el = panelRef.current
    const t = e.t
    if (!el || !t) return
    const [x, y, w, h] = e.p
    el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`
    el.style.width = `${Math.max(0, w).toFixed(2)}px`
    el.style.height = `${Math.max(0, h).toFixed(2)}px`
    if (el.dataset.side !== t.side) el.dataset.side = t.side
    // The arrow rides the trigger, so it stays under it while the panel is still catching up.
    const ax = clamp(t.cx - x, 18, Math.max(18, w - 18))
    if (arrowRef.current) arrowRef.current.style.left = `${(ax - 11).toFixed(2)}px`
    // Scale on open and close grows out of the arrow tip.
    const inner = el.firstElementChild as HTMLElement | null
    if (inner) inner.style.transformOrigin = `${ax.toFixed(1)}px ${t.side === "bottom" ? "0px" : `${Math.max(0, h).toFixed(1)}px`}`
  }, [])

  const target = React.useCallback((): Target | null => {
    const tr = trigRefs.current[shownRef.current]
    const sz = sizes.current[shownRef.current]
    if (!tr || !sz) return null
    return place(tr.getBoundingClientRect(), sz, opt.current)
  }, [])

  const snapNow = React.useCallback(() => {
    const e = eng.current
    const t = target()
    if (!t) return
    e.t = t
    e.p = [t.x, t.y, t.w, t.h]
    e.v = [0, 0, 0, 0]
    e.ready = true
    writePanel()
  }, [target, writePanel])

  const wake = React.useCallback(() => {
    const e = eng.current
    if (!e.ready) return
    const frame = (now: number) => {
      const t = target()
      if (!t) {
        e.raf = 0
        return
      }
      e.t = t
      const dt = Math.min(0.032, (now - e.last) / 1000)
      e.last = now
      const goal = [t.x, t.y, t.w, t.h]
      for (let s = 0; s < 4; s++) {
        const h = dt / 4
        for (let i = 0; i < 4; i++) {
          e.v[i] += (-K * (e.p[i] - goal[i]) - C * e.v[i]) * h
          e.p[i] += e.v[i] * h
        }
      }
      const live = goal.some((g, i) => Math.abs(e.p[i] - g) > 0.15 || Math.abs(e.v[i]) > 0.6)
      if (!live) {
        e.p = goal.slice()
        e.v = [0, 0, 0, 0]
      }
      writePanel()
      e.raf = live ? requestAnimationFrame(frame) : 0
    }
    if (reduceRef.current) {
      snapNow()
      return
    }
    if (!e.raf) {
      e.last = performance.now()
      e.raf = requestAnimationFrame(frame)
    }
    // If frames never arrive (a throttled tab, a screenshot) land on the target anyway.
    window.clearTimeout(e.timer)
    e.timer = window.setTimeout(() => {
      cancelAnimationFrame(e.raf)
      e.raf = 0
      snapNow()
    }, 1500)
  }, [target, writePanel, snapNow])

  // Measure the visible content, then put the panel in place without animation the first time.
  React.useLayoutEffect(() => {
    shownRef.current = shown
    const el = curRef.current
    if (!mounted || !mountedDom || !el) {
      if (!mounted) {
        const e = eng.current
        cancelAnimationFrame(e.raf)
        e.raf = 0
        e.ready = false
      }
      return
    }
    const measure = () => {
      sizes.current[shownRef.current] = { w: el.offsetWidth, h: el.offsetHeight }
    }
    measure()
    const e = eng.current
    if (!e.ready) snapNow()
    else wake()
    const ro = new ResizeObserver(() => {
      measure()
      wake()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [shown, mounted, mountedDom, snapNow, wake])

  // Open and close: toggling the attribute after a reflow makes the entry transition run.
  React.useLayoutEffect(() => {
    const el = panelRef.current
    if (!el) return
    if (value !== null && mounted) {
      void el.offsetWidth
      el.setAttribute("data-open", "")
    } else el.removeAttribute("data-open")
  }, [value, mounted, mountedDom])

  // Scroll and resize move the anchor.
  React.useEffect(() => {
    if (!mounted) return
    const on = () => wake()
    window.addEventListener("scroll", on, { capture: true, passive: true })
    window.addEventListener("resize", on)
    return () => {
      window.removeEventListener("scroll", on, true)
      window.removeEventListener("resize", on)
    }
  }, [mounted, wake])
  React.useEffect(() => () => {
    cancelAnimationFrame(eng.current.raf)
    window.clearTimeout(eng.current.timer)
  }, [])

  /* ---- opening, closing, focus ---- */
  const close = React.useCallback(
    (returnFocus: boolean) => {
      const id = shownRef.current
      setValue(null)
      if (returnFocus) trigRefs.current[id]?.focus({ preventScroll: true })
    },
    [setValue],
  )

  // Keyboard users land inside the panel; pointer users keep their place.
  React.useEffect(() => {
    if (value === null) {
      focusIn.current = false
      return
    }
    if (!kbd.current || !focusIn.current) return
    // focusIn stays set until focus has really moved, so the rerun when the panel mounts is not skipped.
    const id = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(`.pvr-layer[data-cur] ${FOCUSABLE}`)
      if (!first) return
      focusIn.current = false
      first.focus({ preventScroll: true })
    }, 30)
    return () => window.clearTimeout(id)
  }, [value, mounted])

  // Light dismiss and Escape.
  React.useEffect(() => {
    if (value === null) return
    const onDown = (ev: PointerEvent) => {
      const t = ev.target as Node
      if (panelRef.current?.contains(t) || rootRef.current?.querySelector(".pvr-bar")?.contains(t)) return
      close(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.preventDefault()
        close(true)
      }
    }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("keydown", onKey)
    }
  }, [value, close])

  const stopAuto = React.useCallback(() => {
    setAuto(false)
    setPressed(null)
  }, [])
  React.useEffect(() => {
    const mine = (ev: Event) => {
      const t = ev.target as Node
      return !!(rootRef.current?.contains(t) || panelRef.current?.contains(t))
    }
    const onPointer = (ev: Event) => {
      kbd.current = false
      if (mine(ev)) stopAuto()
    }
    const onKey = (ev: Event) => {
      kbd.current = true
      if (mine(ev)) stopAuto()
    }
    const onFocus = (ev: Event) => {
      if (mine(ev)) stopAuto()
    }
    window.addEventListener("pointerdown", onPointer, true)
    window.addEventListener("keydown", onKey, true)
    window.addEventListener("focusin", onFocus, true)
    return () => {
      window.removeEventListener("pointerdown", onPointer, true)
      window.removeEventListener("keydown", onKey, true)
      window.removeEventListener("focusin", onFocus, true)
    }
  }, [stopAuto])

  /* ---- built-in demo: open, glide to the next trigger, again, close; stops for good at the first touch ---- */
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

  const step = React.useRef(0)
  React.useEffect(() => {
    if (!bare || !auto || !active || reduce) return
    let t1 = 0
    let t2 = 0
    const run = () => {
      const s = DEMO_SCRIPT[step.current % DEMO_SCRIPT.length]
      if (s.id) setPressed(s.id)
      t1 = window.setTimeout(() => {
        setPressed(null)
        setValue(s.id)
        step.current += 1
        t2 = window.setTimeout(run, s.wait)
      }, s.id ? 170 : 0)
    }
    // Resume from the start of the loop whenever it becomes visible again.
    step.current = 0
    setInner(null)
    t2 = window.setTimeout(run, 500)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [bare, auto, active, reduce, setValue])

  /* ---- triggers ---- */
  const open = (id: string, viaKey: boolean) => {
    kbd.current = viaKey
    focusIn.current = viaKey
    setValue(id)
  }
  const onTriggerClick = (id: string) => {
    if (value === id) {
      if (trigger === "click") close(false)
    } else open(id, kbd.current)
  }
  const onBarKey = (ev: React.KeyboardEvent, id: string) => {
    const i = items.findIndex((x) => x.id === id)
    const go = (n: number) => {
      const next = items[(n + items.length) % items.length]
      trigRefs.current[next.id]?.focus()
      if (value !== null) {
        kbd.current = true
        setValue(next.id)
      }
    }
    if (ev.key === "ArrowRight") { ev.preventDefault(); go(i + 1) }
    else if (ev.key === "ArrowLeft") { ev.preventDefault(); go(i - 1) }
    else if (ev.key === "Home") { ev.preventDefault(); go(0) }
    else if (ev.key === "End") { ev.preventDefault(); go(items.length - 1) }
    else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault()
      open(id, true)
    } else if (ev.key === "Tab" && !ev.shiftKey && value === id) {
      // The panel is portalled to the end of <body>; Tab from its expanded trigger goes into it.
      const first = panelRef.current?.querySelector<HTMLElement>(`.pvr-layer[data-cur] ${FOCUSABLE}`)
      if (first) {
        ev.preventDefault()
        kbd.current = true
        first.focus({ preventScroll: true })
      }
    }
  }
  const hoverOpen = (id: string) => {
    if (trigger !== "hover") return
    window.clearTimeout(hoverT.current)
    hoverT.current = window.setTimeout(() => value !== id && open(id, false), value !== null ? 0 : 90)
  }
  const hoverLeave = () => {
    if (trigger !== "hover") return
    window.clearTimeout(hoverT.current)
    hoverT.current = window.setTimeout(() => close(false), 180)
  }
  const hoverKeep = () => {
    if (trigger === "hover") window.clearTimeout(hoverT.current)
  }

  const onPanelKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp" || ev.key === "Home" || ev.key === "End") {
      const opts = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(".pvr-layer[data-cur] .pvr-opt") ?? [])
      if (!opts.length) return
      ev.preventDefault()
      const at = opts.indexOf(document.activeElement as HTMLElement)
      const n = ev.key === "Home" ? 0 : ev.key === "End" ? opts.length - 1 : (at + (ev.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length
      opts[n].focus({ preventScroll: true })
      return
    }
    if (ev.key !== "Tab") return
    const list = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(`.pvr-layer[data-cur] ${FOCUSABLE}`) ?? [])
    if (!list.length) return
    const at = document.activeElement
    if (ev.shiftKey && at === list[0]) {
      ev.preventDefault()
      close(true)
    } else if (!ev.shiftKey && at === list[list.length - 1]) {
      // Non-modal: Tab out of the end closes it and continues after the toolbar, where the panel sits logically.
      ev.preventDefault()
      const next = nextAfterBar()
      if (!next) return close(true)
      next.focus()
      close(false)
    }
  }
  const nextAfterBar = () => {
    const bar = rootRef.current?.querySelector(".pvr-bar")
    if (!bar) return null
    return (
      Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
        (el) =>
          el.tabIndex >= 0 &&
          !!(bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          !bar.contains(el) &&
          !panelRef.current?.contains(el) &&
          !el.closest("[inert], [hidden]") &&
          el.getClientRects().length > 0,
      ) ?? null
    )
  }

  const cur = items.find((i) => i.id === shown) ?? items[0]
  const out = leaving ? items.find((i) => i.id === leaving.id) : undefined
  const panelId = `${uid}-panel`
  const tabStop = items.some((i) => i.id === tabId) ? tabId : items[0]?.id
  const live = value ? `${items.find((i) => i.id === value)?.label ?? ""} panel open` : ""

  return (
    <div ref={rootRef} className={cn("pvr", className)}>
      <style href="popover" precedence="default">
        {CSS}
      </style>
      <p className="pvr-sr" role="status" aria-live="polite">{live}</p>
      <div className="pvr-stage">
        <div className="pvr-top">
          <div>
            <p className="pvr-title">Orders</p>
            <p className="pvr-sub">185 this quarter</p>
          </div>
          <div className="pvr-bar" role="toolbar" aria-label={label}>
            {items.map((it) => (
              <button
                key={it.id}
                ref={(el) => {
                  trigRefs.current[it.id] = el
                }}
                type="button"
                className="pvr-tr"
                aria-haspopup="dialog"
                aria-expanded={value === it.id}
                aria-controls={value === it.id && mounted && mountedDom ? panelId : undefined}
                tabIndex={it.id === tabStop ? 0 : -1}
                data-pressed={pressed === it.id || undefined}
                onClick={() => onTriggerClick(it.id)}
                onKeyDown={(ev) => onBarKey(ev, it.id)}
                onFocus={(ev) => {
                  setTabId(it.id)
                  if (ev.currentTarget.matches(":focus-visible")) kbd.current = true
                }}
                onPointerEnter={(ev) => ev.pointerType === "mouse" && hoverOpen(it.id)}
                onPointerLeave={(ev) => ev.pointerType === "mouse" && hoverLeave()}
              >
                {it.label}
                {it.meta !== undefined && <em>{it.meta}</em>}
                <Chev />
              </button>
            ))}
          </div>
        </div>
        <div className="pvr-rows" aria-hidden={value !== null || undefined}>
          {ORDERS.map(([who, ref, amt]) => (
            <div key={ref} className="pvr-row">
              <b>{who}</b>
              <i>{amt}</i>
              <span>{ref}</span>
            </div>
          ))}
        </div>
      </div>

      {mounted && mountedDom
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className="pvr-pn"
              role="dialog"
              aria-label={typeof cur?.label === "string" ? cur.label : "Panel"}
              data-arrow={arrow || undefined}
              data-side={side}
              inert={value === null}
              onKeyDown={onPanelKey}
              onPointerEnter={hoverKeep}
              onPointerLeave={(ev) => ev.pointerType === "mouse" && hoverLeave()}
            >
              <div className="pvr-pn-in">
                <div className="pvr-surface">
                  {out && (
                    <div key={`o-${out.id}`} className="pvr-layer" data-out style={{ width: out.width ?? 260, "--dir": leaving?.dir } as React.CSSProperties} inert aria-hidden>
                      {out.content}
                    </div>
                  )}
                  {cur && (
                    <div key={`c-${cur.id}`} ref={curRef} className="pvr-layer" data-cur data-in={dir !== 0 || undefined} style={{ width: cur.width ?? 260, "--dir": dir } as React.CSSProperties}>
                      {cur.content}
                    </div>
                  )}
                </div>
                <svg ref={arrowRef} className="pvr-arw" viewBox="0 0 16 8" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 8.5 L6.6 1.3 Q8 -.2 9.4 1.3 L16 8.5" />
                </svg>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

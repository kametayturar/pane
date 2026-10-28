"use client"

import * as React from "react"
import { ChevronDown, CornerDownLeft, Menu, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MorphNavLink = {
  label: string
  description?: string
  /** 20px glyph before the label. */
  icon?: React.ReactNode
  href?: string
}

export type MorphNavItem = {
  value: string
  label: string
  /** Plain link when there are no `links` or `feature`. */
  href?: string
  /** Destinations in this section's panel. Items with links or a feature open a panel. */
  links?: MorphNavLink[]
  /** 1 or 2 columns. Defaults to 2 when there are more than three links. */
  columns?: 1 | 2
  /** A highlighted card shown beside the links. Clicking a link or button inside it closes the panel. */
  feature?: React.ReactNode
  /** A strip under the links, e.g. a changelog line. */
  footer?: React.ReactNode
}

export type MorphNavSearchItem = {
  label: string
  description?: string
  /** Right-aligned category, also used for matching. */
  group?: string
  icon?: React.ReactNode
  href?: string
  /** Extra words that should find this entry. */
  keywords?: string
}

export type MorphNavDestination = { label: string; href?: string; section?: string }

export type MorphNavProps = {
  items: MorphNavItem[]
  /** Brand button at the start of the bar. */
  brand?: { name: string; mark: React.ReactNode; href?: string }
  /** The one primary action at the end of the bar. */
  action?: { label: string; icon?: React.ReactNode; href?: string; onClick?: () => void }
  /** Search entries. Leave it out to hide search. */
  search?: { placeholder?: string; items: MorphNavSearchItem[] }
  /** Value of the item that holds the current page. */
  current?: string
  /** Tighten the bar, for example once the page scrolls. */
  compact?: boolean
  /** Below this container width (px) the items fold into one menu. */
  collapseBelow?: number
  /** Called for every destination: links, search results, plain items and the brand. When set, anchors do not navigate. */
  onNavigate?: (destination: MorphNavDestination) => void
  /** Accessible name of the nav landmark. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mnv {
  --mnv-ink: #0c0c0c;
  --mnv-surface: #fff;
  --mnv-accent: #0060e2;
  --mnv-t1: var(--mnv-ink);
  --mnv-t2: color-mix(in oklab, var(--mnv-ink) 69%, transparent);
  --mnv-t3: color-mix(in oklab, var(--mnv-ink) 52%, transparent);
  --mnv-fill: color-mix(in oklab, var(--mnv-ink) 4.5%, transparent);
  --mnv-line: color-mix(in oklab, var(--mnv-ink) 7%, transparent);
  --mnv-bg: color-mix(in oklab, var(--mnv-surface) 88%, transparent);
  --mnv-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 2px 6px rgb(0 0 0 / .03), 0 16px 40px rgb(0 0 0 / .07);
  --mnv-bar-h: 56px;
  --mnv-item-h: 36px;
  --mnv-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  height: var(--mnv-bar-h);
  color: var(--mnv-t1);
  font-family: var(--mnv-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -.01em;
  -webkit-font-smoothing: antialiased;
  z-index: 5;
  transition: height .3s var(--mnv-ease);
}
.mnv[data-compact] { --mnv-bar-h: 48px; --mnv-item-h: 32px }
:is(.dark, [data-theme="dark"]) .mnv {
  --mnv-ink: #f5f5f6;
  --mnv-surface: #1c1c1e;
  --mnv-accent: #4d8dff;
  --mnv-t2: color-mix(in oklab, var(--mnv-ink) 66%, transparent);
  --mnv-t3: color-mix(in oklab, var(--mnv-ink) 50%, transparent);
  --mnv-fill: color-mix(in oklab, var(--mnv-ink) 8%, transparent);
  --mnv-line: color-mix(in oklab, var(--mnv-ink) 10%, transparent);
  --mnv-bg: color-mix(in oklab, var(--mnv-surface) 84%, transparent);
  --mnv-shadow: 0 0 0 .5px rgb(255 255 255 / .12), 0 2px 6px rgb(0 0 0 / .3), 0 16px 40px rgb(0 0 0 / .5);
}
.mnv *, .mnv *::before, .mnv *::after { box-sizing: border-box }
:where(.mnv) button, :where(.mnv) input { font: inherit; letter-spacing: inherit; color: inherit }
:where(.mnv) button { background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.mnv) a { color: inherit; text-decoration: none }
.mnv :focus-visible { outline: 2px solid color-mix(in oklab, var(--mnv-accent) 60%, transparent); outline-offset: -2px }

/* One surface. Width and height are springy; the faces inside it are clipped by it. */
.mnv-surface {
  position: absolute; top: 0; left: 0; right: 0; margin-inline: auto; overflow: hidden; border-radius: 22px;
  background: var(--mnv-bg); box-shadow: var(--mnv-shadow);
  -webkit-backdrop-filter: blur(20px) saturate(1.3); backdrop-filter: blur(20px) saturate(1.3);
  transition: width .3s var(--mnv-ease), height .3s var(--mnv-ease), border-radius .3s var(--mnv-ease);
}
.mnv[data-compact] .mnv-surface { border-radius: 20px }
.mnv-surface[data-grow] { transition-duration: .5s, .5s, .3s; transition-timing-function: cubic-bezier(.3, 1.28, .5, 1), cubic-bezier(.3, 1.28, .5, 1), var(--mnv-ease) }
.mnv-surface[data-still] { transition: none }

.mnv-bar {
  position: absolute; top: 0; left: 0; width: 100%; height: var(--mnv-bar-h); display: flex; align-items: center; gap: 6px; padding: 0 8px 0 10px;
  transition: opacity .22s var(--mnv-ease), filter .22s var(--mnv-ease), height .3s var(--mnv-ease);
}
.mnv-bar[data-hidden] { opacity: 0; filter: blur(4px); pointer-events: none }
.mnv-brand {
  display: inline-flex; flex: none; align-items: center; gap: 8px; height: var(--mnv-item-h); padding: 0 8px 0 4px; border-radius: 999px; font-weight: 500;
  white-space: nowrap; transition: background-color .15s;
}
.mnv-brand:hover { background: var(--mnv-fill) }
.mnv-mark { display: grid; place-items: center; width: 26px; height: 26px; flex: none }
.mnv-mark svg { width: 100%; height: 100% }
.mnv-brandname { font-size: 14px }
.mnv-items { position: relative; display: flex; flex: none; align-items: center }
.mnv-list { display: flex; align-items: center; margin: 0; padding: 0; list-style: none }
.mnv-hi { position: absolute; left: 0; top: 50%; height: var(--mnv-item-h); margin-top: calc(var(--mnv-item-h) / -2); border-radius: 999px; background: var(--mnv-fill); pointer-events: none; opacity: 0; transition: transform .32s var(--mnv-ease), width .32s var(--mnv-ease), opacity .18s }
.mnv-hi[data-on] { opacity: 1 }
.mnv-hi[data-snap] { transition: opacity .18s }
.mnv-item {
  position: relative; display: inline-flex; align-items: center; gap: 4px; height: var(--mnv-item-h); padding: 0 14px; border-radius: 999px;
  color: var(--mnv-t2); white-space: nowrap; transition: color .15s;
}
.mnv-item:hover, .mnv-item[data-open], .mnv-item[aria-current="page"] { color: var(--mnv-t1) }
.mnv-item[aria-current="page"] { font-weight: 500 }
.mnv-chev { width: 14px; height: 14px; color: var(--mnv-t3); transition: transform .25s var(--mnv-ease) }
.mnv-item[data-open] .mnv-chev { transform: rotate(180deg) }
.mnv-spacer { flex: 1 1 0; min-width: 0 }
.mnv-tools { display: flex; flex: none; align-items: center; gap: 4px }
.mnv-tool { display: grid; place-items: center; width: var(--mnv-item-h); height: var(--mnv-item-h); border-radius: 999px; color: var(--mnv-t2); transition: background-color .15s, color .15s }
.mnv-tool:hover, .mnv-tool[aria-expanded="true"] { background: var(--mnv-fill); color: var(--mnv-t1) }
.mnv-tool svg { width: 17px; height: 17px; stroke-width: 1.7 }
.mnv-action {
  display: inline-flex; flex: none; align-items: center; gap: 6px; height: var(--mnv-item-h); padding: 0 16px; border-radius: 999px; font-weight: 500; white-space: nowrap;
  background: var(--mnv-ink); color: var(--mnv-surface); transition: transform .15s var(--mnv-ease), opacity .15s;
}
.mnv-action:hover { opacity: .88 }
.mnv-action:active { transform: scale(.97) }
.mnv-action svg { width: 15px; height: 15px }

/* Faces under / over the bar */
.mnv-face { position: absolute; left: 50% }
.mnv-pface { top: var(--mnv-bar-h); padding: 8px }
.mnv-pface[data-state="in"] { animation: mnv-in-r .42s var(--mnv-ease) backwards }
.mnv-pface[data-state="in"][data-dir="-1"] { animation-name: mnv-in-l }
.mnv-pface[data-state="in"][data-dir="0"] { animation-name: mnv-in-0 }
.mnv-pface[data-state="out"] { pointer-events: none; animation: mnv-out-l .2s var(--mnv-ease) forwards }
.mnv-pface[data-state="out"][data-dir="-1"] { animation-name: mnv-out-r }
.mnv-pface[data-state="out"][data-dir="0"] { animation-name: mnv-out-0 }
@keyframes mnv-in-r { from { opacity: 0; transform: translateX(28px); filter: blur(3px) } }
@keyframes mnv-in-l { from { opacity: 0; transform: translateX(-28px); filter: blur(3px) } }
@keyframes mnv-in-0 { from { opacity: 0; transform: translateY(-6px); filter: blur(3px) } }
@keyframes mnv-out-l { to { opacity: 0; transform: translateX(-28px); filter: blur(3px) } }
@keyframes mnv-out-r { to { opacity: 0; transform: translateX(28px); filter: blur(3px) } }
@keyframes mnv-out-0 { to { opacity: 0; transform: translateY(-4px); filter: blur(3px) } }

.mnv-pbody { display: flex; flex-direction: column; gap: 8px; padding-top: 4px }
.mnv-pmain { display: flex; gap: 12px }
.mnv-grid { display: grid; flex: 1 1 0; min-width: 0; grid-template-columns: repeat(var(--cols, 1), minmax(0, 1fr)); gap: 2px 6px; align-content: start }
.mnv-feature { flex: 0 0 200px; min-width: 0; padding: 4px 4px 4px 0 }
.mnv-link {
  display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; border-radius: 14px; text-align: left; width: 100%; transition: background-color .15s;
}
.mnv-link:hover, .mnv-link:focus-visible, .mnv-link[data-active] { background: var(--mnv-fill) }
.mnv-link-icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; margin-top: 0; color: var(--mnv-t3) }
.mnv-link-icon svg { width: 18px; height: 18px; stroke-width: 1.6 }
.mnv-link-text { display: flex; min-width: 0; flex-direction: column; gap: 1px }
.mnv-link-label { font-weight: 500; color: var(--mnv-t1) }
.mnv-link-desc { font-size: 12px; line-height: 16.8px; color: var(--mnv-t3); letter-spacing: 0 }
.mnv-footer { display: flex; align-items: center; margin: 0 4px; padding: 10px 8px 4px; border-top: .5px solid var(--mnv-line); font-size: 12px; color: var(--mnv-t2) }
.mnv-head { padding: 10px 12px 4px; font-size: 12px; line-height: 16px; color: var(--mnv-t3); letter-spacing: 0 }
.mnv-menu-sec + .mnv-menu-sec { margin-top: 6px }

/* Search face */
.mnv-sface { top: 0; padding: 0 8px 8px }
.mnv-sface[data-state="in"] { animation: mnv-in-s .42s var(--mnv-ease) backwards }
.mnv-sface[data-state="out"] { pointer-events: none; animation: mnv-out-s .2s var(--mnv-ease) forwards }
@keyframes mnv-in-s { from { opacity: 0; transform: translateY(6px) scale(.985); filter: blur(4px) } }
@keyframes mnv-out-s { to { opacity: 0; transform: scale(.985); filter: blur(4px) } }
.mnv-sbar { display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 0 0 10px }
.mnv-sicon { flex: none; width: 17px; height: 17px; color: var(--mnv-t3) }
.mnv-input { flex: 1 1 auto; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; font-size: 16px; line-height: 22px; color: var(--mnv-t1) }
.mnv-input::placeholder { color: var(--mnv-t3) }
.mnv-input:focus-visible { outline: none }
.mnv-esc { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 999px; color: var(--mnv-t2) }
.mnv-esc:hover { background: var(--mnv-fill) }
.mnv-esc svg { width: 16px; height: 16px }
.mnv-res { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 14px; width: 100%; text-align: left; cursor: pointer }
.mnv-res[data-active] { background: var(--mnv-fill) }
.mnv-res-group { margin-left: auto; padding-left: 12px; font-size: 12px; color: var(--mnv-t3); white-space: nowrap; letter-spacing: 0 }
.mnv-res-enter { flex: none; width: 14px; height: 14px; color: var(--mnv-t3) }
.mnv-empty { padding: 22px 12px 18px; text-align: center; color: var(--mnv-t3) }
.mnv-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .mnv-surface { background: var(--mnv-surface); -webkit-backdrop-filter: none; backdrop-filter: none }
}
@media (prefers-reduced-motion: reduce) {
  .mnv *, .mnv *::before, .mnv *::after { animation-duration: .01ms !important; transition-duration: .01ms !important }
  .mnv-pface[data-state="in"], .mnv-sface[data-state="in"] { animation-name: mnv-fade-in !important; animation-duration: .15s !important }
  .mnv-pface[data-state="out"], .mnv-sface[data-state="out"] { animation-name: mnv-fade-out !important; animation-duration: .12s !important }
  @keyframes mnv-fade-in { from { opacity: 0 } }
  @keyframes mnv-fade-out { to { opacity: 0 } }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Reports its own height whenever content reflows. */
function Measured({ k, onHeight, children }: { k: string; onHeight: (k: string, h: number) => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    onHeight(k, el.offsetHeight)
    const ro = new ResizeObserver(() => onHeight(k, el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [k, onHeight])
  return <div ref={ref}>{children}</div>
}

function rank(items: MorphNavSearchItem[], q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return items.slice(0, 5)
  return items
    .map((it) => {
      const label = it.label.toLowerCase()
      let score = 0
      if (label.startsWith(query)) score = 4
      else if (label.includes(query)) score = 3
      else if ((it.keywords ?? "").toLowerCase().includes(query) || (it.group ?? "").toLowerCase().includes(query)) score = 2
      else if ((it.description ?? "").toLowerCase().includes(query)) score = 1
      return { it, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => r.it)
}

type Open = { value: string; dir: -1 | 0 | 1 }
const hasPanel = (it: MorphNavItem) => !!(it.links?.length || it.feature)

/* -------------------------------------------------------------------------- */
/*                                  MorphNav                                  */
/* -------------------------------------------------------------------------- */

export function MorphNav({
  items,
  brand,
  action,
  search,
  current,
  compact = false,
  collapseBelow = 720,
  onNavigate,
  label = "Main",
  className,
}: MorphNavProps) {
  const uid = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const surfaceRef = React.useRef<HTMLDivElement>(null)
  const barRowRef = React.useRef<HTMLDivElement>(null)
  const itemEls = React.useRef<Record<string, HTMLElement | null>>({})
  const returnFocus = React.useRef<HTMLElement | null>(null)
  const wantFocus = React.useRef<"first" | "last" | null>(null)

  const [avail, setAvail] = React.useState(0)
  const [barNat, setBarNat] = React.useState(0)
  const [open, setOpenState] = React.useState<Open | null>(null)
  const [leaving, setLeaving] = React.useState<Open | null>(null)
  const [searching, setSearching] = React.useState(false)
  const [searchLeaving, setSearchLeaving] = React.useState(false)
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const [hi, setHi] = React.useState<{ x: number; w: number; on: boolean; snap: boolean; placed: boolean }>({ x: 0, w: 0, on: false, snap: true, placed: false })
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)

  const collapsed = avail > 0 && avail < collapseBelow
  const narrow = avail > 0 && avail < 520
  /* Very small containers keep only the brand mark so the bar still fits. */
  const tight = avail > 0 && avail < 400
  const menuItem: MorphNavItem = React.useMemo(() => ({ value: "menu", label: "Menu" }), [])

  /* container width */
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvail(el.clientWidth))
    ro.observe(el)
    setAvail(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  /* natural width of the bar: the fixed children (everything but the spacer) plus gaps and padding */
  React.useLayoutEffect(() => {
    const row = barRowRef.current
    if (!row) return
    const measure = () => {
      const kids = Array.from(row.children).filter((c) => !c.classList.contains("mnv-spacer")) as HTMLElement[]
      const cs = getComputedStyle(row)
      const gap = parseFloat(cs.columnGap) || 0
      const w = kids.reduce((s, k) => s + k.offsetWidth, 0) + gap * (kids.length - 1) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      setBarNat(Math.ceil(w))
    }
    measure()
    const ro = new ResizeObserver(measure)
    Array.from(row.children).forEach((c) => ro.observe(c))
    void document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [collapsed, compact, tight, items, brand, action, search])

  /* ------------------------------ open / close ------------------------------ */
  const order = React.useMemo(() => (collapsed ? ["menu"] : items.filter(hasPanel).map((i) => i.value)), [collapsed, items])
  const setOpen = (value: string | null, focus: "first" | "last" | null = null) => {
    wantFocus.current = focus
    if (value === open?.value) return
    const prevIdx = open ? order.indexOf(open.value) : -1
    const nextIdx = value ? order.indexOf(value) : -1
    const dir: -1 | 0 | 1 = prevIdx < 0 || nextIdx < 0 ? 0 : nextIdx > prevIdx ? 1 : -1
    if (open) setLeaving({ value: open.value, dir: value ? dir : 0 })
    setOpenState(value ? { value, dir } : null)
  }
  React.useEffect(() => {
    if (!leaving) return
    const t = window.setTimeout(() => setLeaving(null), 260)
    return () => window.clearTimeout(t)
  }, [leaving])
  React.useEffect(() => {
    if (!searchLeaving) return
    const t = window.setTimeout(() => setSearchLeaving(false), 260)
    return () => window.clearTimeout(t)
  }, [searchLeaving])

  const closeAll = React.useCallback(() => {
    setOpenState((o) => {
      if (o) setLeaving({ value: o.value, dir: 0 })
      return null
    })
    setSearching((s) => {
      if (s) setSearchLeaving(true)
      return false
    })
  }, [])

  const openSearch = () => {
    returnFocus.current = (document.activeElement as HTMLElement) ?? null
    if (open) setOpen(null)
    setQuery("")
    setActive(0)
    setSearching(true)
  }
  const closeSearch = (restore = true) => {
    setSearching(false)
    setSearchLeaving(true)
    if (restore) returnFocus.current?.focus()
  }

  /* hover intent: 60ms to open, 180ms grace on leaving */
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const intent = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }
  const hoverItem = (it: MorphNavItem, el: HTMLElement | null, ev: React.PointerEvent) => {
    if (ev.pointerType !== "mouse" || searching) return
    window.clearTimeout(timer.current)
    placeHi(el)
    if (hasPanel(it)) intent(() => setOpen(it.value), 60)
    else if (open) intent(() => setOpen(null), 60)
  }
  const leaveNav = (ev: React.PointerEvent) => {
    if (ev.pointerType !== "mouse") return
    intent(() => {
      setOpen(null)
      setHi((h) => ({ ...h, on: false }))
    }, 180)
  }
  const enterNav = (ev: React.PointerEvent) => {
    if (ev.pointerType === "mouse") window.clearTimeout(timer.current)
  }

  /* outside pointer / focus leaving close things */
  const anyOpen = !!open || searching
  React.useEffect(() => {
    if (!anyOpen) return
    const down = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closeAll()
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [anyOpen, closeAll])
  const onBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget as Node | null
    if (next && !rootRef.current?.contains(next)) closeAll()
  }

  /* highlight glides between items */
  const placeHi = (el: HTMLElement | null) => {
    if (!el) return
    setHi((h) => ({ x: el.offsetLeft, w: el.offsetWidth, on: true, snap: !h.placed, placed: true }))
  }
  const openValue = open?.value
  React.useLayoutEffect(() => {
    const el = openValue ? itemEls.current[openValue] : null
    if (el) setHi((h) => ({ x: el.offsetLeft, w: el.offsetWidth, on: true, snap: !h.placed, placed: true }))
  }, [openValue])

  const navigate = (dest: MorphNavDestination, ev?: React.MouseEvent) => {
    onNavigate?.(dest)
    if (onNavigate && ev && dest.href) ev.preventDefault()
    closeAll()
    setHi((h) => ({ ...h, on: false }))
  }

  /* after a panel mounts, move focus into it when keyboard asked for that */
  React.useLayoutEffect(() => {
    if (!open || !wantFocus.current) return
    const links = surfaceRef.current?.querySelectorAll<HTMLElement>('[data-state="in"] [data-mnv-link]')
    if (links?.length) {
      const target = wantFocus.current === "last" ? links[links.length - 1] : links[0]
      target.focus()
      wantFocus.current = null
    }
  }, [open, heights])

  /* ------------------------------ keyboard ------------------------------ */
  const focusables = items.map((i) => i.value)
  const onItemKey = (ev: React.KeyboardEvent, it: MorphNavItem) => {
    const i = focusables.indexOf(it.value)
    let to = -1
    if (ev.key === "ArrowRight") to = (i + 1) % focusables.length
    else if (ev.key === "ArrowLeft") to = (i - 1 + focusables.length) % focusables.length
    else if (ev.key === "Home") to = 0
    else if (ev.key === "End") to = focusables.length - 1
    if (to >= 0) {
      ev.preventDefault()
      const nxt = items[to]
      const el = itemEls.current[nxt.value]
      el?.focus()
      returnFocus.current = el
      placeHi(el)
      if (open) setOpen(hasPanel(nxt) ? nxt.value : null)
      return
    }
    if (hasPanel(it) && (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault()
      returnFocus.current = ev.currentTarget as HTMLElement
      if (open?.value === it.value) {
        if (ev.key === "ArrowDown") surfaceRef.current?.querySelector<HTMLElement>('[data-state="in"] [data-mnv-link]')?.focus()
        else setOpen(null)
      } else setOpen(it.value, "first")
    }
  }
  const onPanelKey = (ev: React.KeyboardEvent) => {
    const links = Array.from(surfaceRef.current?.querySelectorAll<HTMLElement>('[data-state="in"] [data-mnv-link]') ?? [])
    const i = links.indexOf(document.activeElement as HTMLElement)
    if (ev.key === "ArrowDown") {
      ev.preventDefault()
      links[Math.min(links.length - 1, i + 1)]?.focus()
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault()
      if (i <= 0) returnFocus.current?.focus()
      else links[i - 1]?.focus()
    }
  }
  const onRootKey = (ev: React.KeyboardEvent) => {
    if (ev.key !== "Escape") return
    if (searching) {
      ev.stopPropagation()
      closeSearch()
    } else if (open) {
      ev.stopPropagation()
      setOpen(null)
      returnFocus.current?.focus()
    }
  }

  /* ------------------------------- search ------------------------------- */
  const results = React.useMemo(() => (search ? rank(search.items, query) : []), [search, query])
  const searchInput = React.useRef<HTMLInputElement>(null)
  React.useLayoutEffect(() => {
    if (searching) searchInput.current?.focus()
  }, [searching])
  const onSearchKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowDown") {
      ev.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (ev.key === "Enter") {
      const r = results[active]
      if (r) navigate({ label: r.label, href: r.href, section: r.group })
    }
  }

  /* --------------------------------- sizes --------------------------------- */
  const barH = compact ? 48 : 56
  const colsFor = (it: MorphNavItem) => (narrow ? 1 : (it.columns ?? ((it.links?.length ?? 0) > 3 ? 2 : 1)))
  const panelItem = (value: string) => (value === "menu" ? menuItem : items.find((i) => i.value === value))
  const panelWidth = (value: string) => {
    const it = panelItem(value)
    const min = value === "menu" ? 320 : it?.feature && !narrow ? 640 : it && colsFor(it) === 2 ? 520 : 380
    return Math.max(1, Math.min(avail || 9999, Math.max(barNat, min)))
  }
  const searchWidth = Math.max(1, Math.min(avail || 9999, 544))
  const faceH = (key: string) => heights[key] ?? 0
  const targetW = searching ? searchWidth : open ? panelWidth(open.value) : Math.min(avail || 9999, barNat)
  const targetH = searching ? faceH("search") : open ? barH + faceH(open.value) : barH

  /* grow vs shrink picks the springy or the plain curve */
  const [lastH, setLastH] = React.useState(targetH)
  const [grow, setGrow] = React.useState(false)
  if (targetH !== lastH) {
    setLastH(targetH)
    setGrow(targetH > lastH)
  }
  const onHeight = React.useCallback((key: string, h: number) => setHeights((s) => (s[key] === h ? s : { ...s, [key]: h })), [])

  /* ------------------------------- rendering ------------------------------- */
  const linkProps = (l: { label: string; href?: string }, section?: string) => ({
    "data-mnv-link": "",
    onClick: (ev: React.MouseEvent) => navigate({ label: l.label, href: l.href, section }, ev),
  })
  const renderLink = (l: MorphNavLink, section: string, key: string) => {
    const inner = (
      <>
        {l.icon && <span className="mnv-link-icon">{l.icon}</span>}
        <span className="mnv-link-text">
          <span className="mnv-link-label">{l.label}</span>
          {l.description && <span className="mnv-link-desc">{l.description}</span>}
        </span>
      </>
    )
    return l.href ? (
      <a key={key} className="mnv-link" href={l.href} {...linkProps(l, section)}>
        {inner}
      </a>
    ) : (
      <button key={key} type="button" className="mnv-link" {...linkProps(l, section)}>
        {inner}
      </button>
    )
  }
  const renderPanel = (o: Open, state: "in" | "out") => {
    const w = panelWidth(o.value)
    const it = panelItem(o.value)
    if (!it) return null
    const style: React.CSSProperties = { width: w, marginLeft: -w / 2 }
    let body: React.ReactNode
    if (o.value === "menu") {
      body = (
        <div className="mnv-pbody">
          {items.map((m) => (
            <div className="mnv-menu-sec" key={m.value}>
              {m.links?.length ? (
                <>
                  <div className="mnv-head">{m.label}</div>
                  {m.links.map((l, i) => renderLink(l, m.label, `${m.value}-${i}`))}
                </>
              ) : (
                renderLink({ label: m.label, href: m.href }, m.label, m.value)
              )}
            </div>
          ))}
        </div>
      )
    } else {
      const cols = colsFor(it)
      body = (
        <div className="mnv-pbody">
          <div className="mnv-pmain" style={narrow ? { flexDirection: "column" } : undefined}>
            <div className="mnv-grid" style={{ "--cols": cols } as React.CSSProperties}>
              {it.links?.map((l, i) => renderLink(l, it.label, `${it.value}-${i}`))}
            </div>
            {it.feature && (
              <div
                className="mnv-feature"
                style={narrow ? { flexBasis: "auto" } : undefined}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a,button")) closeAll()
                }}
              >
                {it.feature}
              </div>
            )}
          </div>
          {it.footer && (
            <div className="mnv-footer" onClick={(e) => (e.target as HTMLElement).closest("a,button") && closeAll()}>
              {it.footer}
            </div>
          )}
        </div>
      )
    }
    return (
      <div
        key={o.value + state}
        className="mnv-face mnv-pface"
        data-face="panel"
        data-state={state}
        data-dir={o.dir}
        style={style}
        role="region"
        id={`${uid}-p-${o.value}`}
        aria-labelledby={state === "in" ? `${uid}-t-${o.value}` : undefined}
        aria-hidden={state === "out" ? true : undefined}
        onKeyDown={state === "in" ? onPanelKey : undefined}
      >
        <Measured k={o.value} onHeight={onHeight}>{body}</Measured>
      </div>
    )
  }

  const listId = `${uid}-list`
  const showSearch = searching || searchLeaving
  const activeId = results[active] ? `${uid}-opt-${active}` : undefined
  const suggested = !query.trim()

  const itemNodes = items.map((it) => {
    const isOpen = open?.value === it.value
    const common = {
      id: `${uid}-t-${it.value}`,
      className: "mnv-item",
      "data-open": isOpen ? "" : undefined,
      "aria-current": current === it.value ? ("page" as const) : undefined,
      onPointerEnter: (ev: React.PointerEvent<HTMLElement>) => hoverItem(it, ev.currentTarget, ev),
      onFocus: (ev: React.FocusEvent<HTMLElement>) => {
        if (ev.currentTarget.matches(":focus-visible")) placeHi(ev.currentTarget)
      },
      onKeyDown: (ev: React.KeyboardEvent) => onItemKey(ev, it),
      ref: (el: HTMLElement | null) => {
        itemEls.current[it.value] = el
      },
    }
    return (
      <li key={it.value} style={{ display: "contents" }}>
        {hasPanel(it) ? (
          <button
            type="button"
            {...common}
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${uid}-p-${it.value}` : undefined}
            onClick={(ev) => {
              returnFocus.current = ev.currentTarget
              setOpen(isOpen ? null : it.value)
            }}
          >
            <span>{it.label}</span>
            <ChevronDown className="mnv-chev" aria-hidden="true" />
          </button>
        ) : it.href ? (
          <a {...common} href={it.href} onClick={(ev) => navigate({ label: it.label, href: it.href, section: it.value }, ev)}>
            <span>{it.label}</span>
          </a>
        ) : (
          <button type="button" {...common} onClick={() => navigate({ label: it.label, section: it.value })}>
            <span>{it.label}</span>
          </button>
        )}
      </li>
    )
  })

  const menuOpen = open?.value === "menu"

  return (
    <div
      ref={rootRef}
      className={cn("mnv", className)}
      data-compact={compact ? "" : undefined}
      onKeyDown={onRootKey}
      onBlur={onBlur}
      onPointerEnter={enterNav}
      onPointerLeave={leaveNav}
    >
      <style href="mnv" precedence="default">
        {CSS}
      </style>
      <nav aria-label={label} style={{ display: "contents" }}>
        <div
          ref={surfaceRef}
          className="mnv-surface"
          data-grow={grow ? "" : undefined}
          data-still={barNat === 0 ? "" : undefined}
          style={{ width: targetW || undefined, height: Math.max(targetH, barH) }}
        >
          <div className="mnv-bar" ref={barRowRef} data-hidden={searching ? "" : undefined} inert={searching || undefined}>
            {brand && (
              <a
                className="mnv-brand"
                aria-label={tight ? brand.name : undefined}
                href={brand.href ?? "#"}
                onClick={(ev) => {
                  if (onNavigate || !brand.href) ev.preventDefault()
                  navigate({ label: brand.name, href: brand.href }, ev)
                }}
              >
                <span className="mnv-mark" aria-hidden="true">
                  {brand.mark}
                </span>
                {!tight && <span className="mnv-brandname">{brand.name}</span>}
              </a>
            )}
            {!collapsed && (
              <div className="mnv-items">
                <span className="mnv-hi" aria-hidden="true" data-on={hi.on ? "" : undefined} data-snap={hi.snap ? "" : undefined} style={{ width: hi.w, transform: `translateX(${hi.x}px)` }} />
                <ul className="mnv-list">{itemNodes}</ul>
              </div>
            )}
            <span className="mnv-spacer" />
            <div className="mnv-tools">
              {search && (
                <button type="button" className="mnv-tool" aria-label="Search" aria-expanded={searching} onClick={openSearch}>
                  <Search aria-hidden="true" />
                </button>
              )}
              {collapsed && (
                <button
                  type="button"
                  className="mnv-tool"
                  id={`${uid}-t-menu`}
                  aria-label="Menu"
                  aria-expanded={menuOpen}
                  aria-controls={menuOpen ? `${uid}-p-menu` : undefined}
                  onClick={(ev) => {
                    returnFocus.current = ev.currentTarget
                    setOpen(menuOpen ? null : "menu")
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault()
                      returnFocus.current = ev.currentTarget
                      if (menuOpen) surfaceRef.current?.querySelector<HTMLElement>('[data-state="in"] [data-mnv-link]')?.focus()
                      else setOpen("menu", "first")
                    }
                  }}
                >
                  <Menu aria-hidden="true" />
                </button>
              )}
            </div>
            {action &&
              (action.href ? (
                <a
                  className="mnv-action"
                  href={action.href}
                  onClick={(ev) => {
                    action.onClick?.()
                    navigate({ label: action.label, href: action.href }, ev)
                  }}
                >
                  <span>{action.label}</span>
                  {action.icon}
                </a>
              ) : (
                <button
                  type="button"
                  className="mnv-action"
                  onClick={() => {
                    action.onClick?.()
                    navigate({ label: action.label })
                  }}
                >
                  <span>{action.label}</span>
                  {action.icon}
                </button>
              ))}
          </div>

          {leaving && leaving.value !== open?.value && renderPanel(leaving, "out")}
          {open && renderPanel(open, "in")}

          {showSearch && search && (
            <div
              className="mnv-face mnv-sface"
              data-state={searching ? "in" : "out"}
              style={{ width: searchWidth, marginLeft: -searchWidth / 2 }}
              aria-hidden={searching ? undefined : true}
            >
              <Measured k="search" onHeight={onHeight}>
                <div className="mnv-sbar" role="search">
                  <Search className="mnv-sicon" aria-hidden="true" />
                  <input
                    ref={searchInput}
                    className="mnv-input"
                    type="text"
                    role="combobox"
                    aria-label={search.placeholder ?? "Search"}
                    aria-expanded={true}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeId}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={search.placeholder ?? `Search ${brand?.name ?? ""}`.trim()}
                    value={query}
                    onChange={(ev) => {
                      setQuery(ev.target.value)
                      setActive(0)
                    }}
                    onKeyDown={onSearchKey}
                  />
                  <button type="button" className="mnv-esc" aria-label="Close search" onClick={() => closeSearch()}>
                    <X aria-hidden="true" />
                  </button>
                </div>
                {suggested && results.length > 0 && <div className="mnv-head" aria-hidden="true">Suggested</div>}
                <div id={listId} role="listbox" aria-label={suggested ? "Suggested" : "Results"}>
                  {results.map((r, i) => (
                    <div
                      key={r.label + i}
                      id={`${uid}-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className="mnv-res"
                      data-active={i === active ? "" : undefined}
                      onPointerMove={() => i !== active && setActive(i)}
                      onClick={(ev) => navigate({ label: r.label, href: r.href, section: r.group }, ev)}
                    >
                      {r.icon && <span className="mnv-link-icon">{r.icon}</span>}
                      <span className="mnv-link-text">
                        <span className="mnv-link-label">{r.label}</span>
                        {r.description && <span className="mnv-link-desc">{r.description}</span>}
                      </span>
                      {i === active ? (
                        <CornerDownLeft className="mnv-res-enter" style={{ marginLeft: "auto" }} aria-hidden="true" />
                      ) : null}
                      {r.group && i !== active && <span className="mnv-res-group">{r.group}</span>}
                    </div>
                  ))}
                </div>
                {!results.length && <div className="mnv-empty">No results for “{query}”</div>}
              </Measured>
            </div>
          )}
        </div>
      </nav>
      <span className="mnv-sr" role="status" aria-live="polite">
        {searching ? (results.length ? `${results.length} result${results.length === 1 ? "" : "s"}` : "No results") : ""}
      </span>
    </div>
  )
}

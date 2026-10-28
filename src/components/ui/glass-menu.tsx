"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GlassMenuItem = {
  /** Stable id passed to `onSelect`. */
  id: string
  /** Row text. Also used for typeahead. */
  label: string
  /** A 16px icon. It takes the accent colour while the row is highlighted. */
  icon?: React.ReactNode
  /** Shortcut hint on the right, such as "⌘D". Display only. */
  shortcut?: string
  /** Makes the row a checkbox item with an accent check. Leave undefined for plain actions. */
  checked?: boolean
  /** Use the danger colour for destructive actions. */
  danger?: boolean
  /** Skipped by the keyboard and ignores clicks. */
  disabled?: boolean
  /** Nested rows. The submenu slides in place with a back row, one level deep. */
  items?: GlassMenuItem[]
  /** Keep the menu open after the row is chosen. Handy for checkable rows. */
  keepOpen?: boolean
}

export type GlassMenuGroup = {
  id: string
  /** A quiet heading above the group. */
  label?: string
  items: GlassMenuItem[]
}

export type GlassMenuProps = {
  /** Rows in groups. Groups are separated by a hairline. */
  groups: GlassMenuGroup[]
  /** Trigger content, usually a short label and a chevron or an icon. */
  children: React.ReactNode
  /** Accessible name of the menu. */
  label?: string
  /** Accessible name of the trigger when it only shows an icon. */
  triggerLabel?: string
  /** Controlled open state. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called with the chosen row. Rows with `items` open their submenu instead. */
  onSelect?: (id: string, item: GlassMenuItem) => void
  /** Which edge of the trigger the panel grows from. */
  align?: "start" | "end"
  /** Panel width in px, capped to the viewport. */
  width?: number
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.gmn {
  --gmn-ink: #000;
  --gmn-accent: #0060e2;
  --gmn-danger: #d92d20;
  --gmn-t1: color-mix(in oklab, var(--gmn-ink) 88%, transparent);
  --gmn-t2: color-mix(in oklab, var(--gmn-ink) 56%, transparent);
  --gmn-t3: color-mix(in oklab, var(--gmn-ink) 40%, transparent);
  --gmn-glass: color-mix(in oklab, #fff 62%, transparent);
  --gmn-pill: rgb(255 255 255 / .72);
  --gmn-pill-shadow: inset 0 1px 0 rgb(255 255 255 / .9), 0 0 0 .5px rgb(0 0 0 / .05), 0 1px 4px rgb(0 0 0 / .12);
  --gmn-sep: color-mix(in oklab, var(--gmn-ink) 9%, transparent);
  --gmn-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; display: inline-block; vertical-align: top; max-width: 100%;
  font-family: var(--gmn-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 20px; font-weight: 400; color: var(--gmn-t1); -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .gmn {
  --gmn-ink: #fff; --gmn-accent: #6ea4ff; --gmn-danger: #ff6b63;
  --gmn-t1: rgb(255 255 255 / .94); --gmn-t2: rgb(255 255 255 / .62); --gmn-t3: rgb(255 255 255 / .44);
  --gmn-glass: color-mix(in oklab, #1d1d22 50%, transparent);
  --gmn-pill: rgb(255 255 255 / .14);
  --gmn-pill-shadow: inset 0 1px 0 rgb(255 255 255 / .16), 0 1px 3px rgb(0 0 0 / .3);
  --gmn-sep: rgb(255 255 255 / .1);
}
.gmn *, .gmn *::before, .gmn *::after { box-sizing: border-box }
.gmn-trigger, .gmn-item { font: inherit; color: inherit; background: none; border: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }

/* The one glass layer: it is the trigger's glass when closed and the panel's when open (its size is a spring). */
.gmn-shell {
  position: absolute; top: 0; left: 0; overflow: hidden; z-index: 1; border-radius: 20px;
  -webkit-backdrop-filter: blur(24px) saturate(1.7); backdrop-filter: blur(24px) saturate(1.7);
  background: var(--gmn-glass);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .55), inset 0 0 16px rgb(255 255 255 / .2), 0 1px 2px rgb(0 0 0 / .06), 0 10px 28px -8px rgb(0 0 0 / .2), 0 28px 60px -20px rgb(0 0 0 / .24);
  will-change: width, height; pointer-events: none;
}
.gmn[data-align="end"] .gmn-shell { left: auto; right: 0 }
:is(.dark, [data-theme="dark"]) .gmn-shell {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .2), inset 0 0 14px rgb(255 255 255 / .05), 0 0 0 .5px rgb(255 255 255 / .1), 0 10px 28px -8px rgb(0 0 0 / .5), 0 28px 60px -20px rgb(0 0 0 / .6);
}
.gmn-shell::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; z-index: 3;
  background: linear-gradient(150deg, rgb(255 255 255 / .95), rgb(255 255 255 / 0) 30%, rgb(255 255 255 / 0) 62%, rgb(255 255 255 / .55));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
}
:is(.dark, [data-theme="dark"]) .gmn-shell::before { opacity: .5 }
/* A soft sheen from the top-left corner, the part of the glass that refracts the light source */
.gmn-shell::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 0;
  background: radial-gradient(120% 90% at 8% -10%, rgb(255 255 255 / .38), transparent 55%);
}
:is(.dark, [data-theme="dark"]) .gmn-shell::after { background: radial-gradient(120% 90% at 8% -10%, rgb(255 255 255 / .12), transparent 55%) }

.gmn-trigger {
  position: relative; z-index: 2; display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 16px; border-radius: 20px;
  font-weight: 500; white-space: nowrap; transition: transform .16s var(--gmn-ease);
}
.gmn-trigger > span { display: inline-flex; align-items: center; gap: 6px; transition: opacity .16s ease, filter .16s ease }
.gmn[data-open] .gmn-trigger > span { opacity: 0; filter: blur(3px); transition-duration: .1s }
.gmn:not([data-open]) .gmn-trigger:active { transform: scale(.97) }
.gmn-trigger:focus-visible { outline: 2px solid color-mix(in oklab, var(--gmn-accent) 70%, transparent); outline-offset: 2px }
.gmn[data-open] .gmn-trigger { pointer-events: none }
.gmn-trigger svg { width: 16px; height: 16px }

/* Menu: fixed-width content inside the growing shell, so text is never scaled, only revealed */
.gmn-menu { position: absolute; top: 0; left: 0; z-index: 2; outline: none; overflow: hidden; border-radius: 20px }
.gmn[data-align="end"] .gmn-menu { left: auto; right: 0 }
.gmn-viewport { position: absolute; top: 0; left: 0; height: 100% }
.gmn[data-align="end"] .gmn-viewport { left: auto; right: 0 }
.gmn-view { position: absolute; top: 0; left: 0; width: 100%; padding: 6px; transition: transform .38s var(--gmn-ease), opacity .24s ease, visibility 0s linear 0s }
.gmn-view[data-away] { transform: translateX(-28px); opacity: 0; visibility: hidden; pointer-events: none; transition: transform .38s var(--gmn-ease), opacity .2s ease, visibility 0s linear .38s }
.gmn-view[data-sub][data-away] { transform: translateX(28px) }
.gmn-view[data-hidden] { visibility: hidden }
.gmn-rows { position: relative; opacity: 0; filter: blur(3px); transition: opacity .12s ease, filter .12s ease }
.gmn[data-open] .gmn-rows { opacity: 1; filter: none; transition: opacity .26s ease .09s, filter .26s ease .09s }

.gmn-pill {
  position: absolute; left: 0; right: 0; top: 0; height: 36px; border-radius: 16px; pointer-events: none; opacity: 0;
  background: var(--gmn-pill); box-shadow: var(--gmn-pill-shadow);
  transition: transform .3s var(--gmn-ease), height .3s var(--gmn-ease), opacity .14s ease;
}
.gmn-pill[data-on] { opacity: 1 }
.gmn-pill[data-instant] { transition: opacity .14s ease }

.gmn-group { position: relative }
.gmn-group + .gmn-group { margin-top: 4px; padding-top: 4px }
.gmn-group + .gmn-group::before { content: ""; position: absolute; left: 10px; right: 10px; top: 0; height: 1px; background: var(--gmn-sep) }
.gmn-heading { padding: 8px 10px 4px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--gmn-t3) }

.gmn-item {
  position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 10px; border-radius: 16px;
  text-align: left; color: var(--gmn-t1); outline: none;
}
.gmn-item[data-danger] { color: var(--gmn-danger) }
.gmn-item:disabled, .gmn-item[aria-disabled="true"] { opacity: .4; cursor: default }
.gmn-item:focus-visible { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--gmn-accent) 50%, transparent) }
.gmn-icon { flex: none; width: 16px; height: 16px; display: grid; place-items: center; color: var(--gmn-t2); transition: color .18s ease }
.gmn-icon svg { width: 16px; height: 16px }
.gmn-item[data-active] .gmn-icon { color: var(--gmn-accent) }
.gmn-item[data-danger] .gmn-icon { color: inherit }
.gmn-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.gmn-kbd { flex: none; font: inherit; font-size: 12px; color: var(--gmn-t3); letter-spacing: .02em }
.gmn-trail { flex: none; width: 16px; height: 16px; display: grid; place-items: center; color: var(--gmn-t2) }
.gmn-trail svg { width: 12px; height: 12px }
.gmn-check { color: var(--gmn-accent) }
.gmn-back { font-weight: 500 }

@media (prefers-reduced-transparency: reduce) {
  .gmn-shell { -webkit-backdrop-filter: none; backdrop-filter: none; background: color-mix(in oklab, #f2f2f5 98%, transparent) }
  :is(.dark, [data-theme="dark"]) .gmn-shell { background: #26262c }
}
@media (prefers-reduced-motion: reduce) {
  .gmn *, .gmn *::before, .gmn *::after { transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const Chevron = ({ dir = "right" }: { dir?: "right" | "left" }) => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={dir === "left" ? { transform: "scaleX(-1)" } : undefined}>
    <path d="M4.5 2.5 8 6l-3.5 3.5" />
  </svg>
)
const Check = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="m3 7.4 2.7 2.7L11 4.4" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const BACK = "__back"
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

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

type Row = { id: string; item?: GlassMenuItem; disabled: boolean }

/**
 * A frosted glass action menu. The trigger's glass morphs into the panel on a spring (width and height are springs
 * written straight to the element), rows reveal a beat later, a highlight pill glides between rows, and one submenu
 * slides in place. Full keyboard support with typeahead.
 */
export function GlassMenu({ groups, children, label = "Actions", triggerLabel, open: openProp, defaultOpen = false, onOpenChange, onSelect, align = "start", width = 256, className, style }: GlassMenuProps) {
  const reduce = useReducedMotion()
  const uid = React.useId()
  const menuId = `gmn-${uid.replace(/:/g, "")}`
  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  const [mounted, setMounted] = React.useState(defaultOpen)
  const [view, setView] = React.useState<string | null>(null) // id of the parent row whose submenu is showing
  const [lastSub, setLastSub] = React.useState<string | null>(null)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const shellRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const rootViewRef = React.useRef<HTMLDivElement>(null)
  const subViewRef = React.useRef<HTMLDivElement>(null)
  const rowRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const rowsHostRef = React.useRef<HTMLDivElement>(null)
  const subRowsHostRef = React.useRef<HTMLDivElement>(null)
  const pillRef = React.useRef<HTMLDivElement>(null)
  const subPillRef = React.useRef<HTMLDivElement>(null)
  const pendingFocus = React.useRef<string | "menu" | null>(null)
  const typeahead = React.useRef({ buf: "", t: 0 })
  const openRef = React.useRef(open)
  openRef.current = open
  const sim = React.useRef({ w: 0, h: 0, vw: 0, vh: 0, tw: 0, th: 0, closedW: 0, closedH: 0, openW: 0, shift: 0, raf: 0, last: 0, init: false })

  const subParent = React.useMemo(() => {
    for (const g of groups) for (const it of g.items) if (it.id === lastSub) return it
    return null
  }, [groups, lastSub])
  const viewParent = React.useMemo(() => {
    for (const g of groups) for (const it of g.items) if (it.id === view) return it
    return null
  }, [groups, view])

  const rows: Row[] = React.useMemo(() => {
    if (viewParent) return [{ id: BACK, disabled: false }, ...(viewParent.items ?? []).map((it) => ({ id: it.id, item: it, disabled: !!it.disabled }))]
    return groups.flatMap((g) => g.items.map((it) => ({ id: it.id, item: it, disabled: !!it.disabled })))
  }, [groups, viewParent])

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    if (next !== openRef.current) onOpenChange?.(next)
  }

  /* ------------------------------- spring sim ------------------------------ */

  const apply = () => {
    const s = sim.current
    const el = shellRef.current
    if (!el) return
    el.style.width = `${s.w}px`
    el.style.height = `${s.h}px`
    el.style.borderRadius = `${Math.min(22, s.h / 2)}px`
    const span = s.openW - s.closedW
    const p = span > 0 ? clamp((s.w - s.closedW) / span, 0, 1) : 0
    el.style.transform = `translateX(${s.shift * p}px)`
    const menu = menuRef.current
    if (menu) {
      menu.style.width = `${s.w}px`
      menu.style.height = `${s.h}px`
      menu.style.borderRadius = `${Math.min(22, s.h / 2)}px`
      menu.style.transform = `translateX(${s.shift * p}px)`
    }
  }
  const frame = (now: number) => {
    const s = sim.current
    let dt = Math.min(0.05, (now - s.last) / 1000)
    s.last = now
    const k = 330
    const c = 2 * Math.sqrt(k) * 0.9
    while (dt > 0) {
      const h = Math.min(1 / 240, dt)
      s.vw += (-k * (s.w - s.tw) - c * s.vw) * h
      s.vh += (-k * (s.h - s.th) - c * s.vh) * h
      s.w += s.vw * h
      s.h += s.vh * h
      dt -= h
    }
    apply()
    const rest = Math.abs(s.w - s.tw) < 0.1 && Math.abs(s.h - s.th) < 0.1 && Math.abs(s.vw) < 0.2 && Math.abs(s.vh) < 0.2
    if (rest) {
      s.w = s.tw
      s.h = s.th
      s.vw = s.vh = 0
      apply()
      s.raf = 0
      if (!openRef.current) setMounted(false)
      return
    }
    s.raf = requestAnimationFrame(frame)
  }
  const wake = () => {
    const s = sim.current
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(frame)
  }

  const setTargets = (animate: boolean) => {
    const s = sim.current
    const trig = triggerRef.current
    if (!trig) return
    s.closedW = trig.offsetWidth
    s.closedH = trig.offsetHeight
    const vwidth = typeof window !== "undefined" ? window.innerWidth : 1024
    s.openW = Math.min(width, vwidth - 24)
    const activeView = view ? subViewRef.current : rootViewRef.current
    const openH = (activeView?.offsetHeight ?? s.closedH) || s.closedH
    if (openRef.current) {
      s.tw = s.openW
      s.th = openH
      // keep the open panel inside the viewport
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) {
        const left = align === "end" ? rect.right - s.openW : rect.left
        s.shift = clamp(left, 12, Math.max(12, vwidth - 12 - s.openW)) - left
      }
    } else {
      s.tw = s.closedW
      s.th = s.closedH
    }
    if (!s.init) {
      s.w = s.closedW
      s.h = s.closedH
      s.init = true
    }
    if (!animate || reduce) {
      s.w = s.tw
      s.h = s.th
      s.vw = s.vh = 0
      apply()
      if (!openRef.current) setMounted(false)
    } else {
      apply()
      wake()
    }
  }

  // Size the closed glass to the trigger on mount and whenever the trigger changes
  React.useLayoutEffect(() => {
    const s = sim.current
    const trig = triggerRef.current
    if (!trig) return
    if (!openRef.current) {
      s.closedW = trig.offsetWidth
      s.closedH = trig.offsetHeight
      s.openW = Math.min(width, window.innerWidth - 24)
      s.w = s.tw = s.closedW
      s.h = s.th = s.closedH
      s.init = true
      apply()
    }
    const ro = new ResizeObserver(() => {
      if (!openRef.current && !sim.current.raf) {
        const t = triggerRef.current
        if (!t) return
        s.closedW = s.w = s.tw = t.offsetWidth
        s.closedH = s.h = s.th = t.offsetHeight
        apply()
      }
    })
    ro.observe(trig)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  // Open / close / change of view: retarget the springs
  React.useLayoutEffect(() => {
    if (open && !mounted) {
      setMounted(true)
      return
    }
    if (!mounted && !open) return
    setTargets(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, view, lastSub, groups])

  React.useEffect(() => {
    const s = sim.current
    return () => {
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  // Reset the submenu and highlight when the menu closes
  const wasOpen = React.useRef(open)
  if (wasOpen.current !== open) {
    wasOpen.current = open
    if (!open) {
      if (view !== null) setView(null)
      if (activeId !== null) setActiveId(null)
    }
  }

  /* -------------------------------- focusing ------------------------------- */

  React.useEffect(() => {
    const target = pendingFocus.current
    if (!target || !mounted) return
    pendingFocus.current = null
    if (target === "menu") menuRef.current?.focus({ preventScroll: true })
    else rowRefs.current.get(target)?.focus({ preventScroll: true })
  })

  // Place the highlight pill under the active row
  React.useLayoutEffect(() => {
    const place = (pill: HTMLDivElement | null, host: HTMLDivElement | null, show: boolean) => {
      if (!pill || !host) return
      const row = activeId ? rowRefs.current.get(activeId) : null
      if (!row || !show) {
        pill.removeAttribute("data-on")
        return
      }
      const hostRect = host.getBoundingClientRect()
      const r = row.getBoundingClientRect()
      const wasOn = pill.hasAttribute("data-on")
      const top = r.top - hostRect.top
      if (!wasOn) pill.setAttribute("data-instant", "")
      pill.style.transform = `translateY(${top}px)`
      pill.style.height = `${r.height}px`
      if (!wasOn) {
        void pill.offsetHeight
        pill.setAttribute("data-on", "")
        requestAnimationFrame(() => pill.removeAttribute("data-instant"))
      } else pill.removeAttribute("data-instant")
    }
    const inSub = !!viewParent
    place(pillRef.current, rowsHostRef.current, !inSub)
    place(subPillRef.current, subRowsHostRef.current, inSub)
  })

  /* ------------------------------- outside press --------------------------- */

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  /* --------------------------------- actions ------------------------------- */

  const openMenu = (focus: "first" | "last" | "menu") => {
    if (open) return
    const list = groups.flatMap((g) => g.items).filter((i) => !i.disabled)
    if (focus === "menu" || !list.length) {
      pendingFocus.current = "menu"
      setActiveId(null)
    } else {
      const id = focus === "first" ? list[0].id : list[list.length - 1].id
      pendingFocus.current = id
      setActiveId(id)
    }
    setOpen(true)
  }
  const closeMenu = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }
  const enterSub = (item: GlassMenuItem, focusFirst: boolean) => {
    if (!item.items?.length) return
    setLastSub(item.id)
    setView(item.id)
    if (focusFirst) {
      pendingFocus.current = item.items.find((i) => !i.disabled)?.id ?? BACK
      setActiveId(pendingFocus.current)
    } else setActiveId(BACK)
  }
  const leaveSub = (focus: boolean) => {
    if (!viewParent) return
    const id = viewParent.id
    setView(null)
    setActiveId(id)
    if (focus) pendingFocus.current = id
  }
  const choose = (row: Row) => {
    if (row.id === BACK) return leaveSub(true)
    const item = row.item
    if (!item || item.disabled) return
    if (item.items?.length) return enterSub(item, true)
    onSelect?.(item.id, item)
    if (!item.keepOpen) closeMenu(true)
  }
  const moveActive = (to: number) => {
    const enabled = rows.filter((r) => !r.disabled)
    if (!enabled.length) return
    const row = enabled[(to + enabled.length) % enabled.length]
    setActiveId(row.id)
    rowRefs.current.get(row.id)?.focus({ preventScroll: true })
  }
  const enabledIndex = () => rows.filter((r) => !r.disabled).findIndex((r) => r.id === activeId)

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const idx = enabledIndex()
    const enabled = rows.filter((r) => !r.disabled)
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        return moveActive(idx < 0 ? 0 : idx + 1)
      case "ArrowUp":
        e.preventDefault()
        return moveActive(idx < 0 ? -1 : idx - 1)
      case "Home":
        e.preventDefault()
        return moveActive(0)
      case "End":
        e.preventDefault()
        return moveActive(-1)
      case "ArrowRight": {
        const row = rows.find((r) => r.id === activeId)
        if (row?.item?.items?.length) {
          e.preventDefault()
          enterSub(row.item, true)
        }
        return
      }
      case "ArrowLeft":
        if (viewParent) {
          e.preventDefault()
          leaveSub(true)
        }
        return
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        if (viewParent) leaveSub(true)
        else closeMenu(true)
        return
      case "Tab":
        e.preventDefault()
        return closeMenu(true)
      case "Enter":
      case " ": {
        e.preventDefault()
        const row = rows.find((r) => r.id === activeId)
        if (row) choose(row)
        return
      }
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = typeahead.current
      const now = performance.now()
      t.buf = now - t.t > 600 ? e.key.toLowerCase() : t.buf + e.key.toLowerCase()
      t.t = now
      const labelOf = (r: Row) => (r.id === BACK ? viewParent?.label ?? "" : r.item?.label ?? "").toLowerCase()
      const start = idx < 0 ? 0 : t.buf.length === 1 ? idx + 1 : idx
      for (let i = 0; i < enabled.length; i++) {
        const r = enabled[(start + i) % enabled.length]
        if (labelOf(r).startsWith(t.buf)) {
          setActiveId(r.id)
          rowRefs.current.get(r.id)?.focus({ preventScroll: true })
          break
        }
      }
    }
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      openMenu("first")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      openMenu("last")
    }
  }

  // Hover highlights a row only when the pointer really moved (browsers also fire synthetic moves after layout changes)
  const lastPt = React.useRef({ x: -1, y: -1 })
  const hover = (e: React.PointerEvent, id: string, disabled: boolean) => {
    const p = lastPt.current
    if (p.x === e.clientX && p.y === e.clientY) return
    p.x = e.clientX
    p.y = e.clientY
    if (!disabled && activeId !== id) setActiveId(id)
  }

  const registerRow = (id: string) => (el: HTMLButtonElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }

  const renderItem = (item: GlassMenuItem) => {
    const isCheck = item.checked !== undefined
    const hasSub = !!item.items?.length
    return (
      <button
        key={item.id}
        ref={registerRow(item.id)}
        type="button"
        role={isCheck ? "menuitemcheckbox" : "menuitem"}
        aria-checked={isCheck ? item.checked : undefined}
        aria-haspopup={hasSub ? "menu" : undefined}
        aria-disabled={item.disabled || undefined}
        tabIndex={-1}
        className="gmn-item"
        data-active={activeId === item.id ? "" : undefined}
        data-danger={item.danger ? "" : undefined}
        onPointerMove={(e) => hover(e, item.id, !!item.disabled)}
        onClick={() => choose({ id: item.id, item, disabled: !!item.disabled })}
      >
        <span className="gmn-icon">{item.icon}</span>
        <span className="gmn-label">{item.label}</span>
        {item.shortcut && <kbd className="gmn-kbd">{item.shortcut}</kbd>}
        <span className="gmn-trail">{hasSub ? <Chevron /> : isCheck && item.checked ? <span className="gmn-check"><Check /></span> : null}</span>
      </button>
    )
  }

  const showSub = lastSub !== null && !!subParent

  return (
    <div
      ref={rootRef}
      className={`gmn${className ? ` ${className}` : ""}`}
      style={style}
      data-open={open ? "" : undefined}
      data-align={align}
    >
      <style href="gmn" precedence="default">{CSS}</style>
      <div ref={shellRef} className="gmn-shell" aria-hidden="true" />
      <button
        ref={triggerRef}
        type="button"
        className="gmn-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        onKeyDown={onTriggerKeyDown}
        onClick={(e) => (open ? closeMenu(false) : openMenu(e.detail === 0 ? "first" : "menu"))}
      >
        <span>{children}</span>
      </button>
      {mounted && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          className="gmn-menu"
          onKeyDown={onMenuKeyDown}
          onPointerLeave={() => !viewParent && setActiveId(null)}
        >
          <div className="gmn-viewport" style={{ width: Math.min(width, (typeof window !== "undefined" ? window.innerWidth : 1024) - 24) }}>
            <div ref={rootViewRef} className="gmn-view" data-away={viewParent ? "" : undefined}>
              <div ref={rowsHostRef} className="gmn-rows">
                <div ref={pillRef} className="gmn-pill" />
                {groups.map((g) => (
                  <div key={g.id} className="gmn-group" role="group" aria-label={g.label}>
                    {g.label && <div className="gmn-heading" aria-hidden="true">{g.label}</div>}
                    {g.items.map(renderItem)}
                  </div>
                ))}
              </div>
            </div>
            {showSub && (
              <div ref={subViewRef} className="gmn-view" data-sub="" data-away={viewParent ? undefined : ""} data-hidden={viewParent ? undefined : ""} aria-hidden={viewParent ? undefined : true}>
                <div ref={subRowsHostRef} className="gmn-rows">
                  <div ref={subPillRef} className="gmn-pill" />
                  <button
                    ref={registerRow(BACK)}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    className="gmn-item gmn-back"
                    data-active={activeId === BACK ? "" : undefined}
                    onPointerMove={(e) => hover(e, BACK, false)}
                    onClick={() => leaveSub(true)}
                  >
                    <span className="gmn-icon"><Chevron dir="left" /></span>
                    <span className="gmn-label">{subParent?.label}</span>
                  </button>
                  <div className="gmn-group" role="group" aria-label={subParent?.label}>
                    {(subParent?.items ?? []).map(renderItem)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

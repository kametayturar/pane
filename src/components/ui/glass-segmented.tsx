"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GlassSegmentedOption = {
  value: string
  /** Visible text. Keep it to one or two words. */
  label: string
  /** 16px icon shown before the label. */
  icon?: React.ReactNode
  /** A small count in the accent colour after the label. 0 or empty hides it. */
  badge?: number | string
  disabled?: boolean
}

export type GlassSegmentedProps = {
  /** Two to five short, mutually exclusive segments. */
  options: GlassSegmentedOption[]
  /** Accessible name of the group. */
  label: string
  /** Controlled value. */
  value?: string
  /** Starting value when uncontrolled. Defaults to the first enabled option. */
  defaultValue?: string
  /** Called when a segment is chosen by click, keys or a drag. */
  onValueChange?: (value: string) => void
  /** 36px or 44px tall. */
  size?: "sm" | "md"
  /** Stretch to the container width with equal segments. */
  fullWidth?: boolean
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.gsg {
  --gsg-ink: #000;
  --gsg-accent: #0060e2;
  --gsg-t1: color-mix(in oklab, var(--gsg-ink) 82%, transparent);
  --gsg-t2: color-mix(in oklab, var(--gsg-ink) 56%, transparent);
  --gsg-glass: color-mix(in oklab, #fff 58%, transparent);
  --gsg-drop-a: #ffffff;
  --gsg-drop-b: #e6e6ea;
  --gsg-drop-op: .88;
  --gsg-edge: rgb(255 255 255 / .9);
  --gsg-h: 44px; --gsg-pad: 5px; --gsg-fs: 14px;
  position: relative; display: inline-flex; max-width: 100%; vertical-align: top;
  height: var(--gsg-h); padding: var(--gsg-pad); border-radius: 999px;
  -webkit-backdrop-filter: blur(24px) saturate(1.7); backdrop-filter: blur(24px) saturate(1.7);
  background: var(--gsg-glass);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .55), inset 0 0 14px rgb(255 255 255 / .22), 0 1px 2px rgb(0 0 0 / .06), 0 10px 28px -10px rgb(0 0 0 / .26);
  font-family: var(--gsg-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--gsg-fs); font-weight: 500; line-height: 20px; -webkit-font-smoothing: antialiased;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
}
:is(.dark, [data-theme="dark"]) .gsg {
  --gsg-ink: #fff; --gsg-accent: #6ea4ff;
  --gsg-t1: rgb(255 255 255 / .94);
  --gsg-t2: rgb(255 255 255 / .62);
  --gsg-glass: color-mix(in oklab, #1d1d22 44%, transparent);
  --gsg-drop-a: rgb(255 255 255 / .34); --gsg-drop-b: rgb(255 255 255 / .16); --gsg-drop-op: 1;
  --gsg-edge: rgb(255 255 255 / .42);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .22), inset 0 0 12px rgb(255 255 255 / .06), 0 0 0 .5px rgb(255 255 255 / .1), 0 10px 28px -10px rgb(0 0 0 / .6);
}
.gsg *, .gsg *::before, .gsg *::after { box-sizing: border-box }
.gsg[data-size="sm"] { --gsg-h: 36px; --gsg-pad: 4px; --gsg-fs: 13px }
.gsg[data-full] { display: flex; width: 100% }

/* Specular rim: a 1px ring whose gradient catches light on the top-left and bottom-right edges */
.gsg::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none;
  background: linear-gradient(155deg, rgb(255 255 255 / .95), rgb(255 255 255 / 0) 34%, rgb(255 255 255 / 0) 64%, rgb(255 255 255 / .6));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
:is(.dark, [data-theme="dark"]) .gsg::before { opacity: .55 }

.gsg-drop { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / .08)) drop-shadow(0 4px 10px rgb(0 0 0 / .12)) }
.gsg-fill { fill: url(#gsg-g); opacity: var(--gsg-drop-op) }
.gsg-edge { fill: none; stroke: var(--gsg-edge); stroke-width: 1; opacity: .9 }
.gsg-gloss { fill: url(#gsg-gl); opacity: .9 }

.gsg-seg {
  position: relative; z-index: 1; flex: 1 1 0; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: 0 18px; border-radius: 999px; background: none; border: 0; margin: 0; font: inherit; color: var(--gsg-t2); cursor: pointer;
  white-space: nowrap; transition: color .18s ease; -webkit-tap-highlight-color: transparent;
}
.gsg:not([data-full]) .gsg-seg { flex: 0 0 auto; min-width: 72px }
.gsg-seg:hover:not([data-on]):not(:disabled) { color: var(--gsg-t1) }
.gsg-seg[data-on], .gsg-seg[data-near] { color: var(--gsg-t1) }
.gsg-seg[data-dragging] { cursor: grabbing }
.gsg-seg:disabled { opacity: .4; cursor: default }
.gsg-seg:focus-visible { outline: 2px solid color-mix(in oklab, var(--gsg-accent) 70%, transparent); outline-offset: -1px }
.gsg-seg svg { width: 16px; height: 16px; flex: none }
.gsg-badge { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; font-size: 11px; line-height: 18px; text-align: center; color: #fff; background: var(--gsg-accent); font-variant-numeric: tabular-nums }

@media (prefers-reduced-transparency: reduce) {
  .gsg { -webkit-backdrop-filter: none; backdrop-filter: none; background: color-mix(in oklab, #f1f1f4 96%, transparent) }
  :is(.dark, [data-theme="dark"]) .gsg { background: #26262b }
}
@media (prefers-reduced-motion: reduce) { .gsg-seg { transition: none } }
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const REST_K = 560 // leading edge stiffness
const LAG_K = 190 // trailing edge stiffness
const SUB = 1 / 240

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

/**
 * A frosted-glass segmented control with a liquid indicator. Each edge of the drop is its own spring: the one facing the
 * travel is quick and the other lags, so the drop stretches (and thins, keeping its volume) between segments. Drag the
 * selected segment to slide it; on release the fling velocity is projected to pick where it lands.
 */
export function GlassSegmented({ options, label, value, defaultValue, onValueChange, size = "md", fullWidth, className, style }: GlassSegmentedProps) {
  const reduce = useReducedMotion()
  const firstEnabled = options.find((o) => !o.disabled)?.value ?? options[0]?.value
  const [inner, setInner] = React.useState(defaultValue ?? firstEnabled)
  const current = value ?? inner
  const uid = React.useId().replace(/:/g, "")

  const rootRef = React.useRef<HTMLDivElement>(null)
  const fillRef = React.useRef<SVGRectElement>(null)
  const edgeRef = React.useRef<SVGRectElement>(null)
  const glossRef = React.useRef<SVGRectElement>(null)
  const segRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const sim = React.useRef({ L: 0, R: 0, vL: 0, vR: 0, tl: 0, tr: 0, raf: 0, last: 0, ready: false, restW: 0, h: 0, y: 0 })
  const drag = React.useRef<{ id: number; startX: number; offset: number; active: boolean; moved: boolean; lastX: number; lastT: number; vx: number } | null>(null)
  const suppressClick = React.useRef(false)
  const geo = React.useRef<{ left: number; width: number }[]>([])

  const select = (v: string) => {
    if (value === undefined) setInner(v)
    if (v !== current) onValueChange?.(v)
  }

  const paint = () => {
    const s = sim.current
    const w = Math.max(0, s.R - s.L)
    const stretch = s.restW ? w / s.restW - 1 : 0
    const thin = Math.min(0.2, Math.max(0, stretch * 0.28))
    const hh = s.h * (1 - thin)
    const y = s.y + (s.h - hh) / 2
    for (const el of [fillRef.current, edgeRef.current, glossRef.current]) {
      if (!el) continue
      el.setAttribute("x", String(s.L))
      el.setAttribute("width", String(w))
      el.setAttribute("y", String(y))
      el.setAttribute("height", String(hh))
      el.setAttribute("rx", String(hh / 2))
    }
    if (glossRef.current) {
      glossRef.current.setAttribute("height", String(hh * 0.5))
      glossRef.current.setAttribute("y", String(y + 1))
      glossRef.current.setAttribute("rx", String(hh / 4))
      glossRef.current.setAttribute("x", String(s.L + 3))
      glossRef.current.setAttribute("width", String(Math.max(0, w - 6)))
    }
  }

  const tick = (now: number) => {
    const s = sim.current
    let dt = Math.min(0.05, (now - s.last) / 1000)
    s.last = now
    // the edge facing the travel direction is the stiff one
    const goingRight = s.tl + s.tr > s.L + s.R
    const kL = goingRight ? LAG_K : REST_K
    const kR = goingRight ? REST_K : LAG_K
    while (dt > 0) {
      const h = Math.min(SUB, dt)
      s.vL += (-kL * (s.L - s.tl) - 2 * Math.sqrt(kL) * 0.96 * s.vL) * h
      s.vR += (-kR * (s.R - s.tr) - 2 * Math.sqrt(kR) * 0.96 * s.vR) * h
      s.L += s.vL * h
      s.R += s.vR * h
      dt -= h
    }
    paint()
    const rest = Math.abs(s.L - s.tl) < 0.05 && Math.abs(s.R - s.tr) < 0.05 && Math.abs(s.vL) < 0.1 && Math.abs(s.vR) < 0.1
    if (rest && !drag.current?.active) {
      s.L = s.tl
      s.R = s.tr
      s.vL = s.vR = 0
      paint()
      s.raf = 0
      return
    }
    s.raf = requestAnimationFrame(tick)
  }
  const wake = () => {
    const s = sim.current
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(tick)
  }

  const measure = () => {
    const root = rootRef.current
    if (!root) return
    const g = segRefs.current.map((b) => ({ left: b?.offsetLeft ?? 0, width: b?.offsetWidth ?? 0 }))
    geo.current = g
    const s = sim.current
    const pad = parseFloat(getComputedStyle(root).paddingTop) || 4
    s.h = Math.max(0, (segRefs.current[0]?.offsetHeight ?? root.clientHeight - pad * 2))
    s.y = segRefs.current[0]?.offsetTop ?? pad
    const svg = fillRef.current?.ownerSVGElement
    if (svg) svg.setAttribute("viewBox", `0 0 ${root.offsetWidth} ${root.offsetHeight}`)
  }

  const targetFor = (i: number) => {
    const g = geo.current[i]
    return g ? { tl: g.left, tr: g.left + g.width, w: g.width } : null
  }

  // Place the drop whenever the value changes or the geometry does
  const place = (instant: boolean) => {
    const idx = options.findIndex((o) => o.value === current)
    const t = targetFor(idx)
    const s = sim.current
    if (!t) return
    s.tl = t.tl
    s.tr = t.tr
    s.restW = t.w
    if (instant || reduce || !s.ready) {
      s.L = t.tl
      s.R = t.tr
      s.vL = s.vR = 0
      s.ready = true
      paint()
    } else wake()
  }

  React.useLayoutEffect(() => {
    measure()
    place(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, options, size, fullWidth])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const s = sim.current
    const ro = new ResizeObserver(() => {
      measure()
      place(true)
    })
    ro.observe(root)
    segRefs.current.forEach((b) => b && ro.observe(b))
    document.fonts?.ready.then(() => {
      measure()
      place(true)
    })
    return () => {
      ro.disconnect()
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length])

  /* ------------------------------- dragging -------------------------------- */

  const nearest = (cx: number) => {
    let best = -1
    let bd = Infinity
    geo.current.forEach((g, i) => {
      if (options[i]?.disabled) return
      const d = Math.abs(g.left + g.width / 2 - cx)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    return best
  }
  const markNear = (i: number) => {
    segRefs.current.forEach((b, k) => {
      if (!b) return
      if (k === i) b.setAttribute("data-near", "")
      else b.removeAttribute("data-near")
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const idx = segRefs.current.findIndex((b) => b && b.contains(e.target as Node))
    if (idx < 0 || options[idx].value !== current) return
    const root = rootRef.current!
    const rect = root.getBoundingClientRect()
    const g = geo.current[idx]
    drag.current = { id: e.pointerId, startX: e.clientX, offset: e.clientX - rect.left - (g.left + g.width / 2), active: false, moved: false, lastX: e.clientX, lastT: performance.now(), vx: 0 }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.active) {
      if (Math.abs(e.clientX - d.startX) < 4) return
      d.active = true
      d.moved = true
      rootRef.current?.setPointerCapture(e.pointerId)
      segRefs.current.forEach((b) => b?.toggleAttribute("data-dragging", true))
    }
    const root = rootRef.current!
    const rect = root.getBoundingClientRect()
    const s = sim.current
    const w = s.restW
    const first = geo.current[0]
    const last = geo.current[geo.current.length - 1]
    const center = e.clientX - rect.left - d.offset
    const left = Math.min(Math.max(center - w / 2, first.left), last.left + last.width - w)
    s.tl = left
    s.tr = left + w
    const now = performance.now()
    const dt = Math.max(1, now - d.lastT)
    d.vx = d.vx * 0.6 + ((e.clientX - d.lastX) / dt) * 1000 * 0.4
    d.lastX = e.clientX
    d.lastT = now
    markNear(nearest(left + w / 2))
    if (reduce) {
      s.L = s.tl
      s.R = s.tr
      paint()
    } else wake()
  }
  const endDrag = (e: React.PointerEvent, cancel = false) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    segRefs.current.forEach((b) => {
      b?.removeAttribute("data-dragging")
      b?.removeAttribute("data-near")
    })
    if (!d.active) return
    suppressClick.current = true
    requestAnimationFrame(() => (suppressClick.current = false))
    const s = sim.current
    const center = (s.tl + s.tr) / 2
    const projected = center + (cancel ? 0 : d.vx * 0.12)
    const i = nearest(projected)
    if (i < 0) return
    const t = targetFor(i)!
    s.tl = t.tl
    s.tr = t.tr
    s.restW = t.w
    select(options[i].value)
    if (reduce) {
      s.L = s.tl
      s.R = s.tr
      paint()
    } else wake()
  }

  /* ------------------------------- keyboard -------------------------------- */

  const move = (dir: 1 | -1 | "first" | "last") => {
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
    if (!enabled.length) return
    const at = enabled.indexOf(options.findIndex((o) => o.value === current))
    let next: number
    if (dir === "first") next = enabled[0]
    else if (dir === "last") next = enabled[enabled.length - 1]
    else next = enabled[(at + dir + enabled.length) % enabled.length]
    select(options[next].value)
    segRefs.current[next]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, 1 | -1 | "first" | "last"> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: "first", End: "last" }
    const dir = map[e.key]
    if (dir === undefined) return
    e.preventDefault()
    move(dir)
  }

  return (
    <div
      ref={rootRef}
      className={`gsg${className ? ` ${className}` : ""}`}
      style={style}
      role="radiogroup"
      aria-label={label}
      data-size={size}
      data-full={fullWidth ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endDrag(e)}
      onPointerCancel={(e) => endDrag(e, true)}
      onKeyDown={onKeyDown}
    >
      <style href="gsg" precedence="default">{CSS}</style>
      <svg className="gsg-drop" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`gsg-g${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--gsg-drop-a)" }} />
            <stop offset="1" style={{ stopColor: "var(--gsg-drop-b)" }} />
          </linearGradient>
          <linearGradient id={`gsg-gl${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".7" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect ref={fillRef} className="gsg-fill" style={{ fill: `url(#gsg-g${uid})` }} />
        <rect ref={glossRef} className="gsg-gloss" style={{ fill: `url(#gsg-gl${uid})` }} />
        <rect ref={edgeRef} className="gsg-edge" />
      </svg>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            segRefs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={o.value === current}
          tabIndex={o.value === current ? 0 : -1}
          disabled={o.disabled}
          data-on={o.value === current ? "" : undefined}
          className="gsg-seg"
          onClick={() => {
            if (suppressClick.current) return
            select(o.value)
          }}
        >
          {o.icon}
          <span>{o.label}</span>
          {o.badge !== undefined && o.badge !== 0 && o.badge !== "" && <span className="gsg-badge">{o.badge}</span>}
        </button>
      ))}
    </div>
  )
}

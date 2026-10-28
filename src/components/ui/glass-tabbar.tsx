"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GlassTabBarItem = {
  /** Unique value. */
  value: string
  /** Visible label and accessible name. The action shows only its icon and uses the label as its name. */
  label: string
  /** Icon at 22px; lucide icons are sized automatically. */
  icon: React.ReactNode
  /** Count shown as an accent badge on the icon. 0 or empty hides it. */
  badge?: number | string
}

export type GlassTabBarProps = {
  /** Three to five tabs with short labels. */
  items: GlassTabBarItem[]
  /** Controlled active tab. A value that matches no tab, or the action, hides the lens. */
  value?: string
  /** Initial active tab when uncontrolled. Defaults to the first item. */
  defaultValue?: string
  /** Called when a tab or the action is chosen by tap, drag or keyboard. */
  onValueChange?: (value: string) => void
  /** A separate round glass tab beside the bar, such as search. It takes part in selection and keyboard order. */
  action?: GlassTabBarItem
  /** Controlled compact state. */
  compact?: boolean
  defaultCompact?: boolean
  /** Called when the bar shrinks or grows. */
  onCompactChange?: (compact: boolean) => void
  /** Scroll container to watch. Leave it out to watch the window. */
  scrollRef?: React.RefObject<HTMLElement | null>
  /** Shrink on scroll down and grow on scroll up. */
  collapseOnScroll?: boolean
  /** Accessible name of the navigation and its tab list. */
  label?: string
  /** Extra class on the nav. Position the bar here, usually fixed or absolute at the bottom. */
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.gtb {
  --gtb-ink: 0 0 0;
  --gtb-accent: #0060e2;
  --gtb-t1: rgb(var(--gtb-ink) / .74);
  --gtb-glass: oklab(.99 0 0 / .56);
  --gtb-solid: #f6f6f8;
  --gtb-slot: 78px; --gtb-bh: 62px; --gtb-c: 0; --lift: 0;
  display: flex; justify-content: center; align-items: center; gap: 8px; pointer-events: none;
  font-family: var(--gtb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 12px; line-height: 16px; font-weight: 500; -webkit-font-smoothing: antialiased; user-select: none; -webkit-user-select: none;
}
:where(.gtb) { position: absolute; left: 0; right: 0; bottom: max(12px, env(safe-area-inset-bottom)); z-index: 5 }
:is(.dark, [data-theme="dark"]) .gtb {
  --gtb-ink: 255 255 255; --gtb-accent: #6ea4ff;
  --gtb-t1: rgb(255 255 255 / .82);
  --gtb-glass: color-mix(in oklab, #1c1c21 52%, transparent);
  --gtb-solid: #26262c;
}
.gtb *, .gtb *::before, .gtb *::after { box-sizing: border-box }
.gtb-defs { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none }
.gtb-group { display: flex; align-items: center; gap: 8px; max-width: 100% }

.gtb-bar, .gtb-bubble { position: relative; flex: none; pointer-events: auto; border-radius: 999px; touch-action: pan-y; height: var(--gtb-bh) }
.gtb-bar { padding: 4px; display: flex; width: calc(var(--gtb-slot) * var(--n, 4) + 8px) }
.gtb-bubble { width: var(--gtb-bh) }

/* The glass: blur + saturate + brighten, plus rim and depth lighting built from inset shadows. */
.gtb-material {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  -webkit-backdrop-filter: blur(18px) saturate(1.8) brightness(1.04); backdrop-filter: blur(18px) saturate(1.8) brightness(1.04);
  background: var(--gtb-glass);
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .07), inset 0 1px .5px -.5px rgb(255 255 255 / .95), inset 0 -1px .5px -.5px rgb(255 255 255 / .5), inset 0 0 16px rgb(255 255 255 / .32), 0 10px 30px -10px rgb(0 0 0 / .3), 0 2px 8px -2px rgb(0 0 0 / .1);
}
.gtb[data-refract] .gtb-material { -webkit-backdrop-filter: var(--gtb-bar-filter) blur(14px) saturate(1.8) brightness(1.04); backdrop-filter: var(--gtb-bar-filter) blur(14px) saturate(1.8) brightness(1.04) }
:is(.dark, [data-theme="dark"]) .gtb-material {
  box-shadow: 0 0 0 .5px rgb(255 255 255 / .12), inset 0 1px .5px -.5px rgb(255 255 255 / .5), inset 0 -1px .5px -.5px rgb(255 255 255 / .18), inset 0 0 14px rgb(255 255 255 / .06), 0 10px 30px -10px rgb(0 0 0 / .6), 0 2px 8px -2px rgb(0 0 0 / .3);
}

/* The lens: a soft fill at rest that lifts into clear, refracting glass while it moves or is pressed */
.gtb-lens { position: absolute; left: 0; top: 0; pointer-events: none; border-radius: 999px; will-change: transform; transition: opacity .2s ease }
.gtb-lens[data-hidden] { opacity: 0 }
.gtb-lens::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: rgb(var(--gtb-ink) / .07); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .45); opacity: calc(1 - var(--lift)) }
:is(.dark, [data-theme="dark"]) .gtb-lens::before { background: rgb(255 255 255 / .12); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .2) }
.gtb-lens-glass {
  position: absolute; inset: 0; border-radius: inherit; opacity: 0; visibility: hidden;
  -webkit-backdrop-filter: blur(1.5px) saturate(1.5) brightness(1.1); backdrop-filter: blur(1.5px) saturate(1.5) brightness(1.1);
  background: radial-gradient(120% 140% at 30% 0%, rgb(255 255 255 / .22), rgb(255 255 255 / .04) 60%);
  box-shadow: inset 0 0 0 .75px rgb(255 255 255 / .75), inset 0 1.5px 2px rgb(255 255 255 / .85), inset 0 -1px 2px rgb(255 255 255 / .4), inset 0 0 14px rgb(255 255 255 / .25), 0 6px 18px rgb(0 0 0 / .18), 0 1px 3px rgb(0 0 0 / .1);
}
.gtb-lens[data-lifted] .gtb-lens-glass { visibility: visible; opacity: var(--lift) }
.gtb[data-refract] .gtb-lens-glass { -webkit-backdrop-filter: var(--gtb-lens-filter) saturate(1.6) brightness(1.08); backdrop-filter: var(--gtb-lens-filter) saturate(1.6) brightness(1.08) }
:is(.dark, [data-theme="dark"]) .gtb-lens-glass { box-shadow: inset 0 0 0 .75px rgb(255 255 255 / .35), inset 0 1.5px 2px rgb(255 255 255 / .35), inset 0 -1px 2px rgb(255 255 255 / .15), 0 6px 18px rgb(0 0 0 / .4) }

.gtb-item {
  position: relative; z-index: 1; flex: none; width: var(--gtb-slot); height: 100%; display: block; padding: 0; margin: 0; border: 0; background: none; border-radius: 999px;
  font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent;
  color: color-mix(in oklab, var(--gtb-accent) calc(var(--p, 0) * 100%), var(--gtb-t1));
}
.gtb-icon, .gtb-bubble-icon {
  position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; display: grid; place-items: center;
  transform: translateY(calc(-8px * (1 - var(--gtb-c)))) scale(calc(1 + .24 * var(--lift) * var(--p, 0)));
}
.gtb-icon svg, .gtb-bubble-icon svg { width: 22px; height: 22px }
.gtb-label {
  position: absolute; left: 0; right: 0; bottom: calc(var(--gtb-bh) * .5 - 23px); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 2px;
  opacity: clamp(0, calc(1 - var(--gtb-c) * 1.8), 1); transform: translateY(calc(var(--gtb-c) * 4px));
}
.gtb-badge {
  position: absolute; top: -5px; left: 100%; margin-left: -9px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; display: grid; place-items: center;
  font-size: 11px; line-height: 16px; font-weight: 500; color: #fff; background: var(--gtb-accent); box-shadow: 0 0 0 1.5px var(--gtb-glass); font-variant-numeric: tabular-nums;
}
:is(.dark, [data-theme="dark"]) .gtb-badge { color: #06142e }
.gtb-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.gtb-item:focus-visible, .gtb-bubble-btn:focus-visible { outline: 2px solid color-mix(in oklab, var(--gtb-accent) 70%, transparent); outline-offset: -2px }

.gtb-bubble-btn { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; padding: 0; margin: 0; border: 0; background: none; border-radius: 999px; color: var(--gtb-t1); cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color .2s ease }
.gtb-bubble-btn[aria-selected="true"] { color: var(--gtb-accent) }
.gtb-bubble-icon { transform: scale(1) }
.gtb-bubble-lens { position: absolute; inset: 7px; border-radius: 999px; background: rgb(var(--gtb-ink) / .07); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .45); opacity: 0; transform: scale(.6); transition: opacity .2s ease, transform .3s cubic-bezier(.22, 1, .36, 1); pointer-events: none }
.gtb-bubble-lens[data-on] { opacity: 1; transform: none }
:is(.dark, [data-theme="dark"]) .gtb-bubble-lens { background: rgb(255 255 255 / .12); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .2) }

@media (prefers-reduced-transparency: reduce) {
  .gtb-material, .gtb-lens-glass { -webkit-backdrop-filter: none !important; backdrop-filter: none !important }
  .gtb-material { background: var(--gtb-solid) }
  .gtb-lens-glass { background: rgb(var(--gtb-ink) / .1) }
  .gtb { --gtb-glass: var(--gtb-solid) }
}
@media (prefers-contrast: more) {
  .gtb { --gtb-t1: rgb(var(--gtb-ink) / .95) }
  .gtb-lens::before { background: rgb(var(--gtb-ink) / .14) }
}
@media (prefers-reduced-motion: reduce) { .gtb *, .gtb *::before, .gtb *::after { transition: none !important } }
`

/* -------------------------------------------------------------------------- */
/*                         Refraction map (Chromium only)                     */
/* -------------------------------------------------------------------------- */

/**
 * Build a displacement map for a pill: neutral grey (no shift) in the middle, and along the rim an outward vector
 * (red = x, green = y) whose strength falls off with depth. feDisplacementMap uses it to bend the backdrop at the edge.
 */
function makeRefractionMap(w: number, h: number, bezel: number) {
  if (typeof document === "undefined") return ""
  const S = 2
  const cw = Math.round(w * S)
  const ch = Math.round(h * S)
  const canvas = document.createElement("canvas")
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(cw, ch)
  const hx = cw / 2
  const hy = ch / 2
  const r = Math.min(hx, hy)
  const bz = bezel * S
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const px = x + 0.5 - hx
      const py = y + 0.5 - hy
      const qx = Math.abs(px) - (hx - r)
      const qy = Math.abs(py) - (hy - r)
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      const sd = Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r
      const depth = -sd
      let nx = 0
      let ny = 0
      if (qx > 0 || qy > 0) {
        const l = Math.hypot(ox, oy) || 1
        nx = (ox / l) * Math.sign(px)
        ny = (oy / l) * Math.sign(py)
      } else if (qx > qy) nx = Math.sign(px)
      else ny = Math.sign(py)
      const t = Math.min(1, Math.max(0, depth / bz))
      const mag = depth < 0 ? 0 : Math.pow(1 - t, 2.2)
      const i = (y * cw + x) * 4
      img.data[i] = 128 + 127 * nx * mag
      img.data[i + 1] = 128 + 127 * ny * mag
      img.data[i + 2] = 128
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL("image/png")
}

function isChromium() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  return /Chrome\//.test(ua) && !/Firefox|FxiOS|CriOS|EdgiOS/.test(ua)
}

function Refraction({ id, w, h, bezel, scale }: { id: string; w: number; h: number; bezel: number; scale: number }) {
  const url = React.useMemo(() => makeRefractionMap(w, h, bezel), [w, h, bezel])
  const ch = (name: string, k: number, matrix: string) => (
    <React.Fragment key={name}>
      <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * k} xChannelSelector="R" yChannelSelector="G" result={`d${name}`} />
      <feColorMatrix in={`d${name}`} type="matrix" values={matrix} result={name} />
    </React.Fragment>
  )
  if (!url) return null
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feImage href={url} x="0" y="0" width={w} height={h} preserveAspectRatio="none" result="map" />
      {ch("r", 1, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0")}
      {ch("g", 0.94, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0")}
      {ch("b", 0.88, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0")}
      <feBlend in="r" in2="g" mode="screen" result="rg" />
      <feBlend in="rg" in2="b" mode="screen" />
    </filter>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const BAR_H = 62
const BAR_H_COMPACT = 48
const SLOT_MAX = 78
const SLOT_MIN = 56
const SLOT_COMPACT = 50

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
 * A floating Liquid Glass tab bar. The bar blurs and (in Chromium) refracts whatever scrolls underneath it. The selected
 * tab sits under a glass lens that glides on a spring, lifts and stretches with its speed into a clear lens, and can be
 * dragged between tabs. An optional round action bubble sits beside it, and the bar compacts to a pill of icons on scroll.
 */
export function GlassTabBar({ items, value, defaultValue, onValueChange, action, compact: compactProp, defaultCompact = false, onCompactChange, scrollRef, collapseOnScroll = true, label = "Tabs", className, style }: GlassTabBarProps) {
  const reduce = useReducedMotion()
  const uid = React.useId().replace(/:/g, "")
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value)
  const current = value ?? inner
  const [compactState, setCompactState] = React.useState(defaultCompact)
  const compact = compactProp ?? compactState
  const [refract, setRefract] = React.useState(false)

  const navRef = React.useRef<HTMLElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const bubbleRef = React.useRef<HTMLDivElement>(null)
  const lensRef = React.useRef<HTMLSpanElement>(null)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const actionRef = React.useRef<HTMLButtonElement>(null)
  const compactRef = React.useRef(compact)
  compactRef.current = compact
  const n = items.length
  const index = items.findIndex((i) => i.value === current)
  const hasLens = index >= 0
  const all = React.useMemo(() => (action ? [...items, action] : items), [items, action])

  // simulation state: lens position in slot units, compact progress, lift
  const sim = React.useRef({ xi: Math.max(0, index), vxi: 0, ti: Math.max(0, index), c: compact ? 1 : 0, vc: 0, lift: 0, vlift: 0, pressed: false, slotExp: SLOT_MAX, raf: 0, last: 0, ready: false, dragging: false })
  const drag = React.useRef<{ id: number; startX: number; active: boolean } | null>(null)
  const suppressClick = React.useRef(false)

  const select = (v: string) => {
    if (value === undefined) setInner(v)
    if (v !== current) onValueChange?.(v)
  }
  const setCompact = (next: boolean) => {
    if (compactProp === undefined) setCompactState(next)
    if (next !== compactRef.current) onCompactChange?.(next)
  }

  const apply = () => {
    const s = sim.current
    const nav = navRef.current
    const bar = barRef.current
    if (!nav || !bar) return
    const slot = lerp(s.slotExp, Math.min(SLOT_COMPACT, s.slotExp), s.c)
    const bh = lerp(BAR_H, BAR_H_COMPACT, s.c)
    nav.style.setProperty("--gtb-slot", `${slot}px`)
    nav.style.setProperty("--gtb-bh", `${bh}px`)
    nav.style.setProperty("--gtb-c", s.c.toFixed(4))
    const lift = clamp(s.lift, 0, 1)
    nav.style.setProperty("--lift", lift.toFixed(3))
    for (let i = 0; i < n; i++) {
      const el = itemRefs.current[i]
      if (el) el.style.setProperty("--p", hasLens ? Math.max(0, 1 - Math.abs(s.xi - i)).toFixed(3) : "0")
    }
    const lens = lensRef.current
    if (lens) {
      const lh = bh - 8
      const sx = 1 + 0.2 * lift + Math.min(0.18, Math.abs(s.vxi) * 0.025)
      const sy = 1 + 0.16 * lift - Math.min(0.06, Math.abs(s.vxi) * 0.01)
      lens.style.width = `${slot}px`
      lens.style.height = `${lh}px`
      lens.style.transform = `translate3d(${4 + s.xi * slot}px, 4px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
      if (lift > 0.04) lens.setAttribute("data-lifted", "")
      else lens.removeAttribute("data-lifted")
    }
  }

  const frame = (now: number) => {
    const s = sim.current
    let dt = Math.min(0.05, (now - s.last) / 1000)
    s.last = now
    const kx = s.dragging ? 520 : 240
    const cx = 2 * Math.sqrt(kx) * (s.dragging ? 0.95 : 1)
    const kc = 190
    const cc = 2 * Math.sqrt(kc)
    const kl = 260
    const cl = 2 * Math.sqrt(kl)
    while (dt > 0) {
      const h = Math.min(1 / 240, dt)
      s.vxi += (-kx * (s.xi - s.ti) - cx * s.vxi) * h
      s.xi += s.vxi * h
      const ct = compactRef.current ? 1 : 0
      s.vc += (-kc * (s.c - ct) - cc * s.vc) * h
      s.c += s.vc * h
      // lift follows speed (in px/s of the lens) and presses
      const slot = lerp(s.slotExp, SLOT_COMPACT, s.c)
      const speed = Math.abs(s.vxi) * slot
      const lt = Math.max(s.pressed ? 0.6 : 0, Math.min(1, speed / 520))
      s.vlift += (-kl * (s.lift - lt) - cl * s.vlift) * h
      s.lift += s.vlift * h
      dt -= h
    }
    apply()
    const rest =
      Math.abs(s.xi - s.ti) < 0.0008 && Math.abs(s.vxi) < 0.01 && Math.abs(s.c - (compactRef.current ? 1 : 0)) < 0.0008 && Math.abs(s.vc) < 0.01 && Math.abs(s.lift - (s.pressed ? 0.6 : 0)) < 0.004 && Math.abs(s.vlift) < 0.02
    if (rest && !s.dragging) {
      s.xi = s.ti
      s.vxi = 0
      s.c = compactRef.current ? 1 : 0
      s.vc = 0
      s.lift = s.pressed ? 0.6 : 0
      s.vlift = 0
      apply()
      s.raf = 0
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

  // Measure the available width: tabs share it from 78px down to 56px each
  const measure = () => {
    const nav = navRef.current
    const s = sim.current
    if (!nav) return
    const avail = nav.clientWidth - 24 - (action ? BAR_H + 8 : 0) - 8
    s.slotExp = clamp(Math.floor(avail / Math.max(1, n)), SLOT_MIN, SLOT_MAX)
    nav.style.setProperty("--n", String(n))
    if (reduce || !s.ready) {
      s.xi = s.ti
      s.c = compactRef.current ? 1 : 0
    }
    s.ready = true
    apply()
  }

  React.useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (navRef.current) ro.observe(navRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, !!action])

  // Lens target follows the active tab
  React.useLayoutEffect(() => {
    const s = sim.current
    if (index < 0) {
      apply()
      return
    }
    s.ti = index
    if (reduce) {
      s.xi = index
      s.vxi = 0
      apply()
    } else wake()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduce])

  // Compact state drives the morph spring
  React.useLayoutEffect(() => {
    const s = sim.current
    if (reduce) {
      s.c = compact ? 1 : 0
      s.vc = 0
      apply()
    } else wake()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, reduce])

  React.useEffect(() => {
    const s = sim.current
    return () => {
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  // Chromium gets a real displacement-map refraction; Safari and Firefox keep blur + saturation
  React.useEffect(() => {
    const t = setTimeout(() => setRefract(isChromium()), 0)
    return () => clearTimeout(t)
  }, [])

  /* ------------------------------- scroll ---------------------------------- */

  React.useEffect(() => {
    if (!collapseOnScroll) return
    const el = scrollRef?.current ?? null
    const target: HTMLElement | Window = el ?? window
    const read = () => (el ? el.scrollTop : window.scrollY)
    let last = read()
    let acc = 0
    const onScroll = () => {
      const y = read()
      const dy = y - last
      last = y
      if (y <= 12) {
        acc = 0
        if (compactRef.current) setCompact(false)
        return
      }
      if (Math.sign(dy) !== Math.sign(acc)) acc = 0
      acc += dy
      if (acc > 28 && !compactRef.current) setCompact(true)
      else if (acc < -14 && compactRef.current) setCompact(false)
    }
    target.addEventListener("scroll", onScroll, { passive: true })
    return () => target.removeEventListener("scroll", onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseOnScroll, scrollRef, compactProp])

  /* ------------------------------- dragging -------------------------------- */

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const idx = itemRefs.current.findIndex((b) => b && b.contains(e.target as Node))
    if (idx < 0 || idx !== index) return
    drag.current = { id: e.pointerId, startX: e.clientX, active: false }
    const s = sim.current
    s.pressed = true
    if (!reduce) wake()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const s = sim.current
    if (!d.active) {
      if (Math.abs(e.clientX - d.startX) < 5) return
      d.active = true
      s.dragging = true
      barRef.current?.setPointerCapture(e.pointerId)
    }
    const bar = barRef.current!
    const r = bar.getBoundingClientRect()
    const slot = lerp(s.slotExp, SLOT_COMPACT, s.c)
    s.ti = clamp((e.clientX - r.left - 4) / slot - 0.5, 0, n - 1)
    if (reduce) {
      s.xi = s.ti
      apply()
    } else wake()
  }
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const s = sim.current
    s.pressed = false
    s.dragging = false
    if (d.active) {
      suppressClick.current = true
      requestAnimationFrame(() => (suppressClick.current = false))
      const i = Math.round(clamp(s.ti, 0, n - 1))
      s.ti = i
      select(items[i].value)
      if (compactRef.current) setCompact(false)
    } else s.ti = Math.max(0, index)
    if (reduce) {
      s.xi = s.ti
      apply()
    } else wake()
  }

  /* ------------------------------- keyboard -------------------------------- */

  const focusRefs = () => [...itemRefs.current.slice(0, n), actionRef.current]
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"]
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const at = all.findIndex((i) => i.value === current)
    let next = at < 0 ? 0 : at
    if (e.key === "ArrowRight") next = (at + 1) % all.length
    else if (e.key === "ArrowLeft") next = (at - 1 + all.length) % all.length
    else if (e.key === "Home") next = 0
    else next = all.length - 1
    select(all[next].value)
    focusRefs()[next]?.focus()
  }

  const choose = (v: string) => {
    if (suppressClick.current) return
    select(v)
    if (compactRef.current) setCompact(false)
  }

  const badgeText = (b: GlassTabBarItem["badge"]) => (b === undefined || b === 0 || b === "" ? null : String(b))
  const tabIndexFor = (v: string, i: number) => (current === v || (index < 0 && current !== action?.value && i === 0) ? 0 : -1)
  const bar = (
    <>
      <Refraction id={`gtb-lens-${uid}`} w={SLOT_MAX} h={BAR_H - 8} bezel={17} scale={30} />
      <Refraction id={`gtb-bar-${uid}`} w={320} h={BAR_H} bezel={20} scale={16} />
    </>
  )

  return (
    <nav
      ref={navRef}
      className={`gtb${className ? ` ${className}` : ""}`}
      style={{ ...style, ...(refract ? ({ "--gtb-lens-filter": `url(#gtb-lens-${uid})`, "--gtb-bar-filter": `url(#gtb-bar-${uid})` } as React.CSSProperties) : null) }}
      aria-label={label}
      data-refract={refract ? "" : undefined}
      data-compact={compact ? "" : undefined}
    >
      <style href="gtb" precedence="default">{CSS}</style>
      {refract && (
        <svg className="gtb-defs" aria-hidden="true" focusable="false">
          <defs>{bar}</defs>
        </svg>
      )}
      <div className="gtb-group" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        <div ref={barRef} className="gtb-bar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <span className="gtb-material" />
          <span ref={lensRef} className="gtb-lens" data-hidden={hasLens ? undefined : ""}>
            <span className="gtb-lens-glass" />
          </span>
          {items.map((it, i) => {
            const b = badgeText(it.badge)
            return (
              <button
                key={it.value}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                type="button"
                role="tab"
                aria-selected={it.value === current}
                tabIndex={tabIndexFor(it.value, i)}
                className="gtb-item"
                onClick={() => choose(it.value)}
              >
                <span className="gtb-icon" aria-hidden="true">
                  {it.icon}
                  {b && <span className="gtb-badge">{b}</span>}
                </span>
                <span className="gtb-label">{it.label}</span>
                {b && <span className="gtb-hidden">, {b} new</span>}
              </button>
            )
          })}
        </div>
        {action && (
          <div ref={bubbleRef} className="gtb-bubble">
            <span className="gtb-material" />
            <span className="gtb-bubble-lens" data-on={current === action.value ? "" : undefined} />
            <button ref={actionRef} type="button" role="tab" aria-selected={current === action.value} aria-label={action.label} tabIndex={current === action.value ? 0 : -1} className="gtb-bubble-btn" onClick={() => choose(action.value)}>
              <span className="gtb-bubble-icon" aria-hidden="true">{action.icon}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

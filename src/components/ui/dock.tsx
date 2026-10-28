"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DockItem = {
  id: string
  /** Name shown in the floating label and read by screen readers. */
  label: string
  /** Glyph drawn on the tile, e.g. a 24px lucide icon. */
  icon: React.ReactNode
  /** Display-only key hint shown as a keycap in the label, e.g. "K". */
  shortcut?: string
  /** Notification count drawn as a red badge on the tile. Hidden at 0. */
  badge?: number
  /** Tile colour. Any CSS colour; the tile gets a soft light-to-dark gradient from it. */
  tint?: string
  /** Draw a hairline divider after this item (e.g. before a trash can). */
  separator?: boolean
  disabled?: boolean
}

export type DockProps = {
  items: DockItem[]
  /** Resting tile size in px. Shrinks on its own when the dock would not fit. */
  size?: number
  /** How large the tile under the pointer grows, as a multiple of `size`. 1 turns magnification off. */
  magnify?: number
  /** Reach of the swell, measured in tile widths from the pointer. */
  range?: number
  /** Called when a tile is clicked, tapped or activated with Enter / Space. */
  onSelect?: (id: string) => void
  /** Clicking a tile that is not running makes it hop and then mark it as running. Default true. */
  launchOnSelect?: boolean
  /** How long the launch hop lasts, in ms. */
  launchDuration?: number
  /** Ids that show a running dot (controlled). */
  running?: string[]
  /** Ids that show a running dot at first (uncontrolled). */
  defaultRunning?: string[]
  onRunningChange?: (running: string[]) => void
  /** Show the floating label on mouse hover and keyboard focus. Default true. */
  showLabels?: boolean
  /** Accessible name of the toolbar. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dkm {
  --dkm-ink: #000;
  --dkm-surface: #fff;
  --dkm-accent: #0060e2;
  --dkm-t1: color-mix(in oklab, var(--dkm-ink) 88%, transparent);
  --dkm-t3: color-mix(in oklab, var(--dkm-ink) 45%, transparent);
  --dkm-bar: color-mix(in oklab, var(--dkm-surface) 74%, transparent);
  --dkm-hair: 0 0 0 .5px rgb(0 0 0 / .1), inset 0 0 0 .5px rgb(255 255 255 / .7);
  --dkm-shadow: 0 1px 2px rgb(0 0 0 / .05), 0 10px 32px -6px rgb(0 0 0 / .16);
  --dkm-tip-bg: #131313;
  --dkm-tip-fg: #fff;
  --dkm-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  padding-top: calc(var(--dkm-b) * (var(--dkm-mag) - 1) + 44px);
  color: var(--dkm-t1);
  font-family: var(--dkm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  pointer-events: none;
}
:is(.dark, [data-theme="dark"]) .dkm {
  --dkm-ink: #fff;
  --dkm-surface: #1c1c1e;
  --dkm-accent: #4d8dff;
  --dkm-t1: color-mix(in oklab, var(--dkm-ink) 90%, transparent);
  --dkm-t3: color-mix(in oklab, var(--dkm-ink) 46%, transparent);
  --dkm-bar: color-mix(in oklab, var(--dkm-surface) 70%, transparent);
  --dkm-hair: 0 0 0 .5px rgb(255 255 255 / .14), inset 0 .5px 0 rgb(255 255 255 / .1);
  --dkm-shadow: 0 1px 2px rgb(0 0 0 / .4), 0 12px 36px -6px rgb(0 0 0 / .6);
  --dkm-tip-bg: #f2f2f2;
  --dkm-tip-fg: #131313;
}
.dkm *, .dkm *::before, .dkm *::after { box-sizing: border-box }
.dkm :focus-visible { outline: 2px solid color-mix(in oklab, var(--dkm-accent) 70%, transparent); outline-offset: 2px }

/* The track is the only part that listens for the pointer. Its ::before reaches up to cover the swollen tiles. */
.dkm-track { position: relative; flex: none; height: calc(var(--dkm-b) + var(--dkm-pad) * 2); pointer-events: auto; touch-action: pan-y }
.dkm-track::before { content: ""; position: absolute; left: -10px; right: -10px; bottom: 0; height: calc(100% + var(--dkm-b) * (var(--dkm-mag) - 1) + 6px) }

.dkm-bar {
  position: absolute; bottom: 0; left: 0; height: 100%; border-radius: calc(var(--dkm-b) * .5);
  background: var(--dkm-bar); box-shadow: var(--dkm-hair), var(--dkm-shadow);
  -webkit-backdrop-filter: blur(22px) saturate(1.6); backdrop-filter: blur(22px) saturate(1.6);
}
.dkm-slot { position: absolute; left: 0; bottom: var(--dkm-pad); width: var(--dkm-b); height: var(--dkm-b) }

/* The button is drawn at full magnified size and scaled down at rest, so the glyph stays sharp when it swells. */
.dkm-btn {
  position: absolute; left: 50%; bottom: 0; width: calc(var(--dkm-b) * var(--dkm-mag)); height: calc(var(--dkm-b) * var(--dkm-mag));
  margin-left: calc(var(--dkm-b) * var(--dkm-mag) * -.5); padding: 0; border: 0; background: none; border-radius: 22%;
  color: #fff; cursor: pointer; transform-origin: 50% 100%; will-change: transform; -webkit-tap-highlight-color: transparent;
}
.dkm-btn:disabled { cursor: not-allowed }
.dkm-btn:disabled .dkm-tile { opacity: .45; filter: saturate(.4) }
.dkm-hop { position: absolute; inset: 0; display: block }
.dkm-tile {
  position: absolute; inset: 0; display: grid; place-items: center; border-radius: 22%;
  background: linear-gradient(165deg, color-mix(in oklab, var(--t, #6b7280) 74%, #fff), var(--t, #6b7280) 72%);
  box-shadow: inset 0 .5px 0 rgb(255 255 255 / .5), inset 0 0 0 .5px rgb(0 0 0 / .12), 0 1px 2px rgb(0 0 0 / .18);
  transition: transform .18s var(--dkm-ease), filter .18s;
}
.dkm-btn:active:not(:disabled) .dkm-tile { transform: scale(.93); filter: brightness(.9) }
.dkm-tile svg { width: 52%; height: 52%; stroke-width: 1.75; filter: drop-shadow(0 1px 1px rgb(0 0 0 / .18)) }
.dkm-badge {
  position: absolute; top: -4%; right: -4%; min-width: 30%; height: 30%; padding: 0 8%; display: grid; place-items: center;
  border-radius: 99px; background: #ff3b30; color: #fff; font-size: calc(var(--dkm-b) * var(--dkm-mag) * .17); font-weight: 600; line-height: 1;
  font-variant-numeric: tabular-nums; box-shadow: 0 0 0 calc(var(--dkm-b) * var(--dkm-mag) * .028) var(--dkm-surface); animation: dkm-pop .4s var(--dkm-ease) backwards;
}
.dkm-dot {
  position: absolute; left: 50%; bottom: calc(var(--dkm-pad) * -1 + 3px); width: 4px; height: 4px; margin-left: -2px; border-radius: 50%;
  background: var(--dkm-t3); transform: scale(0); transition: transform .3s var(--dkm-ease); pointer-events: none;
}
.dkm-dot[data-on] { transform: scale(1) }
.dkm-sep {
  position: absolute; left: 0; bottom: var(--dkm-pad); width: 1px; height: var(--dkm-b); border-radius: 1px; pointer-events: none;
  background: linear-gradient(transparent 12%, color-mix(in oklab, var(--dkm-ink) 16%, transparent) 12% 88%, transparent 88%);
}

.dkm-btn[data-launching] .dkm-hop { animation: dkm-hop var(--dkm-hopdur, .62s) cubic-bezier(.3, 0, .5, 1) infinite }
@keyframes dkm-hop {
  0% { transform: translateY(0); animation-timing-function: cubic-bezier(.25, .8, .4, 1) }
  42% { transform: translateY(calc(var(--dkm-b) * -.62)); animation-timing-function: cubic-bezier(.6, 0, .9, .6) }
  80%, 100% { transform: translateY(0) }
}
@keyframes dkm-pop { from { transform: scale(.3); opacity: 0 } }

/* Floating label. The wrapper is moved by script; the tip itself fades and lifts in. */
.dkm-lab { position: absolute; left: 0; bottom: 0; width: 0; height: 0; pointer-events: none; z-index: 2; will-change: transform }
.dkm-tip {
  position: absolute; left: 0; bottom: 0; display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 10px;
  background: var(--dkm-tip-bg); color: var(--dkm-tip-fg); font-size: 12px; font-weight: 500; white-space: nowrap; letter-spacing: -.01em;
  box-shadow: 0 6px 18px rgb(0 0 0 / .1), 0 1px 3px rgb(0 0 0 / .08);
  opacity: 0; translate: -50% 4px; scale: .94; transform-origin: 50% 100%;
  transition: opacity .12s, translate .16s var(--dkm-ease), scale .16s var(--dkm-ease);
}
.dkm-tip[data-on] { opacity: 1; translate: -50% 0; scale: 1; transition-delay: var(--dkm-delay, 70ms) }
.dkm-tip[data-warm] { --dkm-delay: 0ms }
.dkm-tip kbd {
  display: inline-grid; place-items: center; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 5px; font: inherit; font-size: 11px;
  background: color-mix(in oklab, var(--dkm-tip-fg) 18%, transparent); color: color-mix(in oklab, var(--dkm-tip-fg) 78%, transparent);
}
.dkm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .dkm-bar { background: var(--dkm-surface); -webkit-backdrop-filter: none; backdrop-filter: none }
}
@media (prefers-reduced-motion: reduce) {
  .dkm *, .dkm *::before, .dkm *::after { animation: none !important; transition-duration: .01ms !important }
  .dkm-tip { translate: -50% 0; scale: 1 }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Swell profile: 1 under the pointer, easing to 0 at `t = 1` (distance / reach). */
const bell = (t: number) => (t >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * t))

const SPRING_K = 430
const SPRING_C = 31

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Dock                                    */
/* -------------------------------------------------------------------------- */

export function Dock({
  items,
  size = 48,
  magnify = 1.75,
  range = 2.5,
  onSelect,
  launchOnSelect = true,
  launchDuration = 1700,
  running,
  defaultRunning,
  onRunningChange,
  showLabels = true,
  label = "Apps",
  className,
}: DockProps) {
  const n = items.length
  const reduced = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const labRef = React.useRef<HTMLDivElement>(null)
  const slotRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const sepRefs = React.useRef<(HTMLSpanElement | null)[]>([])

  /* Effective size: shrink so the resting dock fits the container, then keep only as much swell as there is room for. */
  const [avail, setAvail] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvail(el.clientWidth))
    ro.observe(el)
    setAvail(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const seps = items.reduce((c, it, i) => c + (it.separator && i < n - 1 ? 1 : 0), 0)
  const geo = (b: number) => {
    const gap = Math.round(b * 0.125)
    const pad = Math.round(b * 0.17)
    const sepW = gap * 2 + 1
    return { gap, pad, sepW, rest: n * b + (n - 1) * gap + 2 * pad + seps * sepW }
  }
  let b = size
  if (avail > 0 && geo(b).rest > avail) {
    const g = geo(size)
    b = Math.max(30, Math.floor((avail - 2 * g.pad - (n - 1) * g.gap - seps * g.sepW) / n))
  }
  const G = geo(b)
  const slack = avail > 0 ? avail - G.rest : 9999
  const mag = reduced ? 1 : Math.max(1, Math.min(magnify, 1 + slack / (3.2 * b)))

  /* Running / launching state. */
  const [runningState, setRunningState] = React.useState<string[]>(defaultRunning ?? [])
  const runningIds = running ?? runningState
  const [launching, setLaunching] = React.useState<string[]>([])
  const [note, setNote] = React.useState("")
  const timers = React.useRef<number[]>([])
  React.useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => window.clearTimeout(id))
  }, [])

  const select = (it: DockItem) => {
    onSelect?.(it.id)
    if (!launchOnSelect || runningIds.includes(it.id) || launching.includes(it.id)) return
    setLaunching((l) => [...l, it.id])
    setNote(`Opening ${it.label}`)
    const dur = reduced ? 250 : launchDuration
    timers.current.push(
      window.setTimeout(() => {
        setLaunching((l) => l.filter((x) => x !== it.id))
        const next = [...runningIds, it.id]
        if (running === undefined) setRunningState(next)
        onRunningChange?.(next)
        setNote(`${it.label} is running`)
      }, dur),
    )
  }

  /* Hover / focus / label. Only these two indexes live in React state; everything per frame stays in refs. */
  const [hover, setHover] = React.useState(-1)
  const [focus, setFocus] = React.useState(-1)
  const [rovingIdx, setRovingIdx] = React.useState(0)
  const tipIdx = hover >= 0 ? hover : focus
  /* "Warm": once a label has been shown the next one follows at once, until a moment after the last one left. */
  const [warm, setWarm] = React.useState(false)
  React.useEffect(() => {
    const id = window.setTimeout(() => setWarm(tipIdx >= 0), tipIdx >= 0 ? 160 : 450)
    return () => window.clearTimeout(id)
  }, [tipIdx])
  const tipItem = tipIdx >= 0 ? items[tipIdx] : undefined
  const [shown, setShown] = React.useState<DockItem | undefined>(tipItem)
  if (tipItem && tipItem !== shown) setShown(tipItem)

  /* ----------------------------- the engine ----------------------------- */
  const eng = React.useRef({
    s: [] as number[], v: [] as number[], p: null as number | null, hover: -1, focus: -1, raf: 0, last: 0, lx: 0, tipVisible: false,
    cfg: { b: 48, mag: 1.75, range: 2.5, gap: 6, pad: 8, sepW: 13, n: 0, rest: 0, seps: [] as boolean[], reduced: false },
  })

  const render = React.useCallback((dt: number, snap: boolean) => {
    const e = eng.current
    const { b: bb, mag: mg, range: rg, gap, pad, sepW, n: nn, rest, seps: sepAfter, reduced: rm } = e.cfg
    if (e.s.length !== nn) {
      e.s = Array.from({ length: nn }, () => 1)
      e.v = Array.from({ length: nn }, () => 0)
    }
    let settled = true
    /* displayed layout from the current (springing) scales */
    const lay = (): { left: number[]; w: number[]; barW: number } => {
      let x = 0
      const left: number[] = []
      const w: number[] = []
      for (let i = 0; i < nn; i++) {
        w.push(bb * e.s[i])
        left.push(x)
        x += w[i] + gap + (sepAfter[i] ? sepW : 0)
      }
      return { left, w, barW: x - gap + 2 * pad }
    }
    let L = lay()
    const start = (rest - L.barW) / 2 + pad
    /* targets */
    const reach = rg * bb
    const virtualP = e.p ?? (e.focus >= 0 ? pad + e.focus * (bb + gap) + bb / 2 + sepBefore(sepAfter, e.focus, sepW) : null)
    for (let i = 0; i < nn; i++) {
      let target = 1
      if (virtualP !== null && mg > 1) {
        const c = start + L.left[i] + L.w[i] / 2
        target = 1 + (mg - 1) * bell(Math.abs(virtualP - c) / reach)
      }
      if (snap || rm) {
        e.s[i] = target
        e.v[i] = 0
      } else {
        const a = SPRING_K * (target - e.s[i]) - SPRING_C * e.v[i]
        e.v[i] += a * dt
        e.s[i] += e.v[i] * dt
        if (Math.abs(target - e.s[i]) > 0.0008 || Math.abs(e.v[i]) > 0.002) settled = false
        else {
          e.s[i] = target
          e.v[i] = 0
        }
      }
    }
    L = lay()
    const left0 = (rest - L.barW) / 2 + pad
    for (let i = 0; i < nn; i++) {
      const slot = slotRefs.current[i]
      const btn = btnRefs.current[i]
      if (slot) slot.style.transform = `translate3d(${(left0 + L.left[i] + (L.w[i] - bb) / 2).toFixed(2)}px,0,0)`
      if (btn) btn.style.transform = `scale(${(e.s[i] / mg).toFixed(4)})`
      const sp = sepRefs.current[i]
      if (sp && sepAfter[i]) sp.style.transform = `translate3d(${(left0 + L.left[i] + L.w[i] + (gap + sepW) / 2 - 0.5).toFixed(2)}px,0,0)`
    }
    const bar = barRef.current
    if (bar) {
      bar.style.width = `${L.barW.toFixed(2)}px`
      bar.style.transform = `translate3d(${((rest - L.barW) / 2).toFixed(2)}px,0,0)`
    }
    /* label glides to the active tile */
    const lab = labRef.current
    const ai = e.hover >= 0 ? e.hover : e.focus
    if (lab && ai >= 0 && ai < nn) {
      const cx = left0 + L.left[ai] + L.w[ai] / 2
      if (!e.tipVisible || snap || rm) e.lx = cx
      else {
        const k = 1 - Math.exp(-dt * 24)
        e.lx += (cx - e.lx) * k
        if (Math.abs(cx - e.lx) > 0.2) settled = false
        else e.lx = cx
      }
      lab.style.transform = `translate3d(${e.lx.toFixed(2)}px,${(-(pad + L.w[ai] + 9)).toFixed(2)}px,0)`
      e.tipVisible = true
    } else e.tipVisible = false
    return settled
  }, [])

  const kick = React.useCallback(() => {
    const e = eng.current
    if (e.raf) return
    e.last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.034, (now - e.last) / 1000)
      e.last = now
      const settled = render(dt, false)
      e.raf = settled ? 0 : requestAnimationFrame(frame)
    }
    e.raf = requestAnimationFrame(frame)
  }, [render])

  /* keep the engine config in sync with props, and place everything once */
  const sepKey = items.map((it, i) => (it.separator && i < n - 1 ? "1" : "0")).join("")
  const sepFlags = React.useMemo(() => sepKey.split("").map((c) => c === "1"), [sepKey])
  React.useLayoutEffect(() => {
    const e = eng.current
    e.cfg = { b, mag, range, gap: G.gap, pad: G.pad, sepW: G.sepW, n, rest: G.rest, seps: sepFlags, reduced }
    e.s = Array.from({ length: n }, () => 1)
    e.v = Array.from({ length: n }, () => 0)
    render(0, true)
  }, [b, mag, range, n, reduced, sepFlags, G.rest, G.gap, G.pad, G.sepW, render])
  React.useEffect(() => {
    const e = eng.current
    return () => {
      cancelAnimationFrame(e.raf)
      e.raf = 0
    }
  }, [])
  React.useLayoutEffect(() => {
    const e = eng.current
    e.hover = hover
    e.focus = focus
    kick()
  }, [hover, focus, kick])

  const trackX = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    return r ? clientX - r.left : 0
  }
  const onMove = (ev: React.PointerEvent) => {
    if (ev.pointerType === "touch") return
    eng.current.p = trackX(ev.clientX)
    kick()
  }
  const onLeave = (ev: React.PointerEvent) => {
    if (ev.pointerType === "touch") return
    eng.current.p = null
    setHover(-1)
    kick()
  }

  /* keyboard: roving tabindex across the tiles */
  const onKeyDown = (ev: React.KeyboardEvent, i: number) => {
    const enabled = items.map((it, k) => (it.disabled ? -1 : k)).filter((k) => k >= 0)
    if (!enabled.length) return
    const pos = enabled.indexOf(i)
    let to = -1
    if (ev.key === "ArrowRight") to = enabled[(pos + 1) % enabled.length]
    else if (ev.key === "ArrowLeft") to = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (ev.key === "Home") to = enabled[0]
    else if (ev.key === "End") to = enabled[enabled.length - 1]
    if (to < 0) return
    ev.preventDefault()
    setRovingIdx(to)
    btnRefs.current[to]?.focus()
  }

  const style = {
    "--dkm-b": `${b}px`,
    "--dkm-mag": mag,
    "--dkm-pad": `${G.pad}px`,
    "--dkm-hopdur": "0.62s",
  } as React.CSSProperties
  const tabIdx = items[rovingIdx] && !items[rovingIdx].disabled ? rovingIdx : Math.max(0, items.findIndex((it) => !it.disabled))

  return (
    <div ref={rootRef} className={cn("dkm", className)} style={style}>
      <style href="dkm" precedence="default">
        {CSS}
      </style>
      <div
        ref={trackRef}
        className="dkm-track"
        role="toolbar"
        aria-label={label}
        aria-orientation="horizontal"
        style={{ width: G.rest }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <div ref={barRef} className="dkm-bar" aria-hidden="true" />
        {items.map((it, i) => {
          const isRunning = runningIds.includes(it.id)
          const isLaunching = launching.includes(it.id)
          const badge = it.badge && it.badge > 0 ? it.badge : 0
          const name = [it.label, isRunning ? "running" : "", badge ? `${badge} notification${badge === 1 ? "" : "s"}` : "", it.shortcut ?? ""]
            .filter(Boolean)
            .join(", ")
          return (
            <React.Fragment key={it.id}>
              <div
                className="dkm-slot"
                ref={(el) => {
                  slotRefs.current[i] = el
                }}
              >
                <button
                  type="button"
                  className="dkm-btn"
                  ref={(el) => {
                    btnRefs.current[i] = el
                  }}
                  style={{ "--t": it.tint } as React.CSSProperties}
                  aria-label={name}
                  tabIndex={i === tabIdx ? 0 : -1}
                  disabled={it.disabled}
                  data-launching={isLaunching ? "" : undefined}
                  onClick={() => select(it)}
                  onKeyDown={(ev) => onKeyDown(ev, i)}
                  onPointerEnter={(ev) => {
                    if (ev.pointerType !== "touch" && showLabels && !it.disabled) setHover(i)
                  }}
                  onFocus={(ev) => {
                    setRovingIdx(i)
                    if (showLabels && ev.currentTarget.matches(":focus-visible")) setFocus(i)
                  }}
                  onBlur={() => setFocus((f) => (f === i ? -1 : f))}
                >
                  <span className="dkm-hop">
                    <span className="dkm-tile">{it.icon}</span>
                    {badge > 0 && <span className="dkm-badge">{badge > 99 ? "99+" : badge}</span>}
                  </span>
                </button>
                <span className="dkm-dot" data-on={isRunning ? "" : undefined} aria-hidden="true" />
              </div>
              {sepFlags[i] && (
                <span
                  className="dkm-sep"
                  aria-hidden="true"
                  ref={(el) => {
                    sepRefs.current[i] = el
                  }}
                />
              )}
            </React.Fragment>
          )
        })}
        <div ref={labRef} className="dkm-lab" aria-hidden="true">
          <div className="dkm-tip" data-on={showLabels && tipItem ? "" : undefined} data-warm={warm ? "" : undefined}>
            <span>{shown?.label}</span>
            {shown?.shortcut && <kbd>{shown.shortcut}</kbd>}
          </div>
        </div>
      </div>
      <span className="dkm-sr" role="status" aria-live="polite">
        {note}
      </span>
    </div>
  )
}

/** Extra x offset caused by divider gaps before item `i` (rest layout). */
function sepBefore(seps: boolean[], i: number, sepW: number) {
  let c = 0
  for (let k = 0; k < i; k++) if (seps[k]) c += sepW
  return c
}

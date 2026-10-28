"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OrbitAction = {
  id: string
  /** Name of the action: shown in the label pill and read by screen readers. */
  label: string
  /** 18px glyph, e.g. a lucide icon. */
  icon: React.ReactNode
  /** Short confirmation shown after firing. Defaults to the label. */
  done?: string
  tone?: "neutral" | "danger"
}

export type OrbitMenuProps = {
  /** Three to six actions. */
  actions: OrbitAction[]
  /** Called with the fired action's id. */
  onAction: (id: string) => void
  /** Accessible name of the button and menu; also the pill text while nothing is targeted. */
  label?: string
  /** Distance from the button centre to each action, in px. */
  radius?: number
  /** Degrees the arc spans. */
  spread?: number
  /** Degrees the arc opens toward: -90 up, 0 right, 90 down, 180 left. */
  direction?: number
  /** Disable the trigger and close the arc. */
  disabled?: boolean
  /** Announce confirmations in a polite status region. */
  announce?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.orm {
  --orm-ink: #0c0c0c;
  --orm-surface: #fff;
  --orm-accent: #0060e2;
  --orm-danger: #d92d20;
  --orm-glass: color-mix(in oklab, var(--orm-surface) 76%, transparent);
  --orm-solid: color-mix(in oklab, var(--orm-surface) 94%, transparent);
  --orm-shadow: 0 6px 18px rgb(0 0 0 / .065), 0 1px 3px rgb(0 0 0 / .035);
  --orm-hair: 0 0 0 .5px rgb(0 0 0 / .08);
  --orm-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  display: inline-block;
  width: 56px;
  height: 56px;
  vertical-align: top;
  color: var(--orm-ink);
  font-family: var(--orm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -.01em;
  -webkit-font-smoothing: antialiased;
}
.orm[data-open] { z-index: 20 }
:is(.dark, [data-theme="dark"]) .orm {
  --orm-ink: #f5f5f6;
  --orm-surface: #232326;
  --orm-accent: #4d8dff;
  --orm-danger: #ff6a5e;
  --orm-glass: color-mix(in oklab, var(--orm-surface) 72%, transparent);
  --orm-solid: color-mix(in oklab, var(--orm-surface) 95%, transparent);
  --orm-shadow: 0 6px 18px rgb(0 0 0 / .4), 0 1px 3px rgb(0 0 0 / .3);
  --orm-hair: 0 0 0 .5px rgb(255 255 255 / .13);
}
.orm *, .orm *::before, .orm *::after { box-sizing: border-box }
:where(.orm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent }
.orm :focus-visible { outline: 2px solid color-mix(in oklab, var(--orm-accent) 65%, transparent); outline-offset: 2px }

.orm-field { position: absolute; left: 50%; top: 50%; width: var(--orm-fs); height: var(--orm-fs); margin: calc(var(--orm-fs) / -2) 0 0 calc(var(--orm-fs) / -2); border-radius: 50%; pointer-events: none; touch-action: none }
.orm[data-open] .orm-field { pointer-events: auto }

.orm-trigger {
  position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; border-radius: 50%;
  background: var(--orm-ink); color: var(--orm-surface); box-shadow: var(--orm-shadow);
  transition: transform .3s var(--orm-ease), background-color .25s, color .25s, box-shadow .25s;
}
.orm-trigger:disabled { opacity: .45; cursor: not-allowed }
.orm-trigger[data-pressing] { transform: scale(.92) }
.orm[data-open] .orm-trigger, .orm[data-done] .orm-trigger {
  background: var(--orm-glass); color: var(--orm-ink); box-shadow: var(--orm-hair), var(--orm-shadow);
  -webkit-backdrop-filter: blur(18px) saturate(1.6); backdrop-filter: blur(18px) saturate(1.6); transform: scale(.94);
}
.orm-glyph { position: absolute; width: 22px; height: 22px; opacity: 0; transform: scale(.55) rotate(-60deg); filter: blur(2px); transition: opacity .25s, transform .4s var(--orm-ease), filter .25s }
.orm-trigger[data-glyph="dots"] .orm-g-dots, .orm-trigger[data-glyph="x"] .orm-g-x, .orm-trigger[data-glyph="check"] .orm-g-check { opacity: 1; transform: none; filter: none }
.orm-trigger[data-glyph="dots"] .orm-g-x, .orm-trigger[data-glyph="dots"] .orm-g-check { transform: scale(.55) rotate(60deg) }

.orm-menu { position: absolute; left: 50%; top: 50%; width: 0; height: 0 }
.orm-item {
  position: absolute; left: 50%; top: 50%; z-index: 2; display: grid; place-items: center; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%;
  background: var(--orm-solid); box-shadow: var(--orm-hair), var(--orm-shadow); opacity: 0; will-change: transform, opacity;
  transition: background-color .14s, box-shadow .14s, color .14s;
}
.orm-item svg { width: 18px; height: 18px; stroke-width: 1.75; display: block }
.orm-item[data-tone="danger"] { color: var(--orm-danger) }
.orm-item[data-target] { background: transparent; box-shadow: none; color: var(--orm-surface) }
.orm-lens { position: absolute; left: 50%; top: 50%; z-index: 1; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: var(--orm-ink); box-shadow: var(--orm-shadow); opacity: 0; pointer-events: none; will-change: transform, opacity }

.orm-pill-anchor { position: absolute; left: 50%; top: 50%; z-index: 4; width: 0; height: 0; pointer-events: none }
.orm-pill {
  position: absolute; left: 0; top: 0; display: grid; place-items: center; height: 30px; width: 90px; border-radius: 999px; overflow: hidden; white-space: nowrap;
  background: var(--orm-glass); box-shadow: var(--orm-hair), var(--orm-shadow); font-weight: 500;
  -webkit-backdrop-filter: blur(18px) saturate(1.6); backdrop-filter: blur(18px) saturate(1.6);
  opacity: 0; transform: translate(-50%, calc(-50% + 8px)) scale(.88);
  transition: opacity .2s, transform .45s var(--orm-ease), width .45s cubic-bezier(.34, 1.4, .64, 1);
}
.orm-pill[data-on] { opacity: 1; transform: translate(-50%, -50%) scale(1) }
.orm-pill-text { grid-area: 1 / 1; padding: 0 14px; animation: orm-swap .3s var(--orm-ease) backwards }
.orm-pill[data-danger] { color: var(--orm-danger) }
.orm-measure { position: absolute; visibility: hidden; white-space: nowrap; font-weight: 500; pointer-events: none; left: 0; top: 0 }
@keyframes orm-swap { from { opacity: 0; filter: blur(3px); transform: translateY(4px) } }
.orm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .orm[data-open] .orm-trigger, .orm[data-done] .orm-trigger, .orm-pill { background: var(--orm-surface); -webkit-backdrop-filter: none; backdrop-filter: none }
}
@media (prefers-reduced-motion: reduce) {
  .orm *, .orm *::before, .orm *::after { animation: none !important; transition-duration: .01ms !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DEAD = 34
const ITEM = 46
const TARGET_SCALE = 1.42
const rad = (d: number) => (d * Math.PI) / 180
const wrap180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

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

const Dots = () => (
  <svg className="orm-glyph orm-g-dots" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5.5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="18.5" cy="12" r="1.7" />
  </svg>
)
const Cross = () => (
  <svg className="orm-glyph orm-g-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
)
const Tick = () => (
  <svg className="orm-glyph orm-g-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 12.5l4.2 4.2L18.5 7.8" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                 OrbitMenu                                  */
/* -------------------------------------------------------------------------- */

export function OrbitMenu({
  actions,
  onAction,
  label = "Actions",
  radius = 104,
  spread = 150,
  direction = -90,
  disabled = false,
  announce = true,
  onOpenChange,
  className,
}: OrbitMenuProps) {
  const n = actions.length
  const uid = React.useId()
  const reduced = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const trigRef = React.useRef<HTMLButtonElement>(null)
  const lensRef = React.useRef<HTMLSpanElement>(null)
  const pillRef = React.useRef<HTMLDivElement>(null)
  const measureRef = React.useRef<HTMLSpanElement>(null)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const [openState, setOpenState] = React.useState(false)
  const open = openState && !disabled
  const [pressing, setPressing] = React.useState(false)
  const [target, setTarget] = React.useState(-1)
  const [outside, setOutside] = React.useState(false)
  const [done, setDone] = React.useState<string | null>(null)
  const [rove, setRove] = React.useState(0)
  const wantFocus = React.useRef<"first" | "last" | null>(null)
  const doneTimer = React.useRef(0)
  const press = React.useRef({ t: 0, x: 0, y: 0, dragged: false, id: -1 })

  const setOpen = (v: boolean) => {
    if (v === openState) return
    setOpenState(v)
    eng.current.t0 = performance.now()
    eng.current.isOpen = v
    if (!v) {
      setTarget(-1)
      setOutside(false)
      setPressing(false)
    }
    onOpenChange?.(v)
    kick()
  }
  React.useEffect(() => () => window.clearTimeout(doneTimer.current), [])

  /* angle of each action around the trigger */
  const angles = React.useMemo(() => {
    const step = n > 1 ? spread / (n - 1) : 0
    return actions.map((_, k) => (n > 1 ? direction - spread / 2 + k * step : direction))
  }, [actions, n, spread, direction])
  const stepDeg = n > 1 ? spread / (n - 1) : 60

  /* ------------------------------- the engine ------------------------------- */
  const eng = React.useRef({
    q: [] as number[], qv: [] as number[], s: [] as number[], sv: [] as number[],
    px: [] as number[], py: [] as number[],
    lens: { x: 0, y: 0, s: 1, op: 0, vx: 0, vy: 0, vs: 0 },
    ptr: { x: 0, y: 0, valid: false },
    target: -1, isOpen: false, t0: 0, raf: 0, last: 0,
    cfg: { n: 0, R: 104, angles: [] as number[], reduced: false },
  })

  const frame = React.useCallback((now: number, dt: number) => {
    const e = eng.current
    const { n: nn, R, angles: ang, reduced: rm } = e.cfg
    if (e.q.length !== nn) {
      e.q = Array.from({ length: nn }, () => 0)
      e.qv = Array.from({ length: nn }, () => 0)
      e.s = Array.from({ length: nn }, () => 1)
      e.sv = Array.from({ length: nn }, () => 0)
      e.px = Array.from({ length: nn }, () => 0)
      e.py = Array.from({ length: nn }, () => 0)
    }
    let settled = true
    const elapsed = now - e.t0
    const base: { x: number; y: number }[] = []
    for (let k = 0; k < nn; k++) {
      /* swirl out in reading order, fold back in reverse */
      const delay = e.isOpen ? k * 30 : (nn - 1 - k) * 24
      const go = elapsed >= delay
      const qt = e.isOpen ? (go ? 1 : 0) : go ? 0 : 1
      if (rm) {
        e.q[k] = e.isOpen ? 1 : 0
        e.qv[k] = 0
      } else {
        const a = 240 * (qt - e.q[k]) - 21 * e.qv[k]
        e.qv[k] += a * dt
        e.q[k] += e.qv[k] * dt
        if (!go || Math.abs(qt - e.q[k]) > 0.002 || Math.abs(e.qv[k]) > 0.01) settled = false
        else {
          e.q[k] = qt
          e.qv[k] = 0
        }
      }
      const q = e.q[k]
      const a = rad(ang[k] - (1 - Math.min(1, q)) * 38)
      const r = R * q
      base.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
    }
    /* target scale, magnet pull toward the pointer, lens */
    const live = e.isOpen && !rm
    for (let k = 0; k < nn; k++) {
      let ts = 1
      let pullX = 0
      let pullY = 0
      if (live) {
        if (k === e.target) ts = TARGET_SCALE
        if (e.ptr.valid) {
          const dx = e.ptr.x - base[k].x
          const dy = e.ptr.y - base[k].y
          const d = Math.hypot(dx, dy)
          const reach = 78
          if (d < reach && d > 0.001) {
            const f = 1 - d / reach
            pullX = (dx / d) * 10 * f
            pullY = (dy / d) * 10 * f
            if (k !== e.target) ts = 1 + 0.06 * f
          }
        }
      }
      if (rm) {
        e.s[k] = k === e.target ? 1.15 : 1
        e.sv[k] = 0
        e.px[k] = e.py[k] = 0
      } else {
        const a = 380 * (ts - e.s[k]) - 25 * e.sv[k]
        e.sv[k] += a * dt
        e.s[k] += e.sv[k] * dt
        const lerp = 1 - Math.exp(-dt * 16)
        e.px[k] += (pullX - e.px[k]) * lerp
        e.py[k] += (pullY - e.py[k]) * lerp
        if (Math.abs(ts - e.s[k]) > 0.002 || Math.abs(e.sv[k]) > 0.01 || Math.abs(pullX - e.px[k]) > 0.05 || Math.abs(pullY - e.py[k]) > 0.05) settled = false
      }
    }
    const lens = e.lens
    const tk = e.target >= 0 && e.isOpen ? e.target : -1
    if (tk >= 0) {
      const tx = base[tk].x + e.px[tk]
      const ty = base[tk].y + e.py[tk]
      if (lens.op < 0.05 || rm) {
        lens.x = tx
        lens.y = ty
        lens.vx = lens.vy = 0
      } else {
        lens.vx += (420 * (tx - lens.x) - 30 * lens.vx) * dt
        lens.vy += (420 * (ty - lens.y) - 30 * lens.vy) * dt
        lens.x += lens.vx * dt
        lens.y += lens.vy * dt
        if (Math.abs(tx - lens.x) > 0.1 || Math.abs(ty - lens.y) > 0.1 || Math.abs(lens.vx) > 0.2 || Math.abs(lens.vy) > 0.2) settled = false
      }
      lens.s = e.s[tk]
      lens.op += (1 - lens.op) * (1 - Math.exp(-dt * 30))
      if (lens.op < 0.995) settled = false
    } else {
      lens.op += (0 - lens.op) * (1 - Math.exp(-dt * 22))
      if (lens.op > 0.01) settled = false
      else lens.op = 0
    }
    /* write */
    for (let k = 0; k < nn; k++) {
      const el = itemRefs.current[k]
      if (!el) continue
      const q = e.q[k]
      const sc = (0.4 + 0.6 * Math.min(1, q)) * e.s[k]
      el.style.transform = `translate3d(${(base[k].x + e.px[k]).toFixed(2)}px,${(base[k].y + e.py[k]).toFixed(2)}px,0) scale(${sc.toFixed(3)})`
      el.style.opacity = Math.max(0, Math.min(1, q * 1.5)).toFixed(3)
      el.style.filter = q < 0.97 && !rm ? `blur(${((1 - q) * 3).toFixed(2)}px)` : ""
      el.style.visibility = q < 0.01 && !e.isOpen ? "hidden" : ""
    }
    const lensEl = lensRef.current
    if (lensEl) {
      lensEl.style.transform = `translate3d(${lens.x.toFixed(2)}px,${lens.y.toFixed(2)}px,0) scale(${lens.s.toFixed(3)})`
      lensEl.style.opacity = lens.op.toFixed(3)
    }
    return settled
  }, [])

  const kick = React.useCallback(() => {
    const e = eng.current
    if (e.raf) return
    e.last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - e.last) / 1000)
      e.last = now
      const settled = frame(now, dt)
      e.raf = settled ? 0 : requestAnimationFrame(loop)
    }
    e.raf = requestAnimationFrame(loop)
  }, [frame])

  React.useLayoutEffect(() => {
    eng.current.cfg = { n, R: radius, angles, reduced }
    frame(performance.now(), 0.016)
    kick()
  }, [n, radius, angles, reduced, frame, kick])
  React.useLayoutEffect(() => {
    eng.current.target = target
    kick()
  }, [target, kick])
  React.useEffect(() => {
    const e = eng.current
    return () => {
      cancelAnimationFrame(e.raf)
      e.raf = 0
    }
  }, [])
  /* a disabled menu closes */
  React.useLayoutEffect(() => {
    if (disabled && eng.current.isOpen) {
      eng.current.isOpen = false
      eng.current.t0 = performance.now()
      kick()
    }
  }, [disabled, kick])

  /* focus into the arc after a keyboard open */
  React.useLayoutEffect(() => {
    if (!open || !wantFocus.current) return
    const idx = wantFocus.current === "last" ? n - 1 : 0
    wantFocus.current = null
    setRove(idx)
    itemRefs.current.forEach((el) => el && (el.style.visibility = ""))
    itemRefs.current[idx]?.focus()
  }, [open, n])

  /* --------------------------------- aiming --------------------------------- */
  const aim = (clientX: number, clientY: number, pointerType: string, pressingNow: boolean) => {
    const r = trigRef.current?.getBoundingClientRect()
    if (!r) return
    const dx = clientX - (r.left + r.width / 2)
    const dy = clientY - (r.top + r.height / 2)
    const e = eng.current
    e.ptr = { x: dx, y: dy, valid: pointerType !== "touch" }
    const dist = Math.hypot(dx, dy)
    let next = -1
    let off = false
    if (dist >= DEAD && (pressingNow || dist <= radius + ITEM + 20)) {
      const a = (Math.atan2(dy, dx) * 180) / Math.PI
      const half = spread / 2 + Math.max(stepDeg / 2, 24)
      if (Math.abs(wrap180(a - direction)) > half) off = true
      else {
        let best = Infinity
        angles.forEach((ak, k) => {
          const d = Math.abs(wrap180(a - ak))
          if (d < best) {
            best = d
            next = k
          }
        })
      }
    }
    setTarget((t) => (t === next ? t : next))
    setOutside((o) => (o === off ? o : off))
    kick()
  }

  const fire = (k: number) => {
    const a = actions[k]
    if (!a) return
    onAction(a.id)
    window.clearTimeout(doneTimer.current)
    setDone(a.done ?? a.label)
    doneTimer.current = window.setTimeout(() => setDone(null), 1400)
    if (rootRef.current?.contains(document.activeElement) && document.activeElement !== trigRef.current) trigRef.current?.focus()
    setOpen(false)
  }

  /* --------------------------------- trigger --------------------------------- */
  const onTriggerDown = (ev: React.PointerEvent) => {
    if (disabled || (ev.pointerType === "mouse" && ev.button !== 0)) return
    if (open) {
      setOpen(false)
      return
    }
    press.current = { t: ev.timeStamp, x: ev.clientX, y: ev.clientY, dragged: false, id: ev.pointerId }
    try {
      trigRef.current?.setPointerCapture(ev.pointerId)
    } catch {
      /* pointer already gone */
    }
    setPressing(true)
    setOpen(true)
    aim(ev.clientX, ev.clientY, ev.pointerType, true)
  }
  const onTriggerMove = (ev: React.PointerEvent) => {
    if (!open) return
    const p = press.current
    if (pressing && p.id === ev.pointerId) {
      if (Math.hypot(ev.clientX - p.x, ev.clientY - p.y) > 6) p.dragged = true
      aim(ev.clientX, ev.clientY, ev.pointerType, true)
    }
  }
  const onTriggerUp = (ev: React.PointerEvent) => {
    const p = press.current
    if (!pressing || p.id !== ev.pointerId) return
    setPressing(false)
    p.id = -1
    try {
      trigRef.current?.releasePointerCapture(ev.pointerId)
    } catch {
      /* already released */
    }
    if (target >= 0 && p.dragged) fire(target)
    else if (p.dragged || ev.timeStamp - p.t > 320) setOpen(false)
    /* a quick tap leaves the arc open */
  }
  const onTriggerKey = (ev: React.KeyboardEvent) => {
    if (disabled) return
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown" || ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
      ev.preventDefault()
      wantFocus.current = ev.key === "ArrowUp" ? "last" : "first"
      if (open) {
        itemRefs.current[ev.key === "ArrowUp" ? n - 1 : 0]?.focus()
      } else setOpen(true)
    } else if (ev.key === "Escape" && open) setOpen(false)
  }
  const onTriggerClick = (ev: React.MouseEvent) => {
    if (ev.detail !== 0 || disabled) return /* mouse and touch are handled on pointer down / up */
    if (open) setOpen(false)
    else {
      wantFocus.current = "first"
      setOpen(true)
    }
  }

  /* ---------------------------------- arc ---------------------------------- */
  const onItemKey = (ev: React.KeyboardEvent, k: number) => {
    let to = -1
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") to = (k + 1) % n
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") to = (k - 1 + n) % n
    else if (ev.key === "Home") to = 0
    else if (ev.key === "End") to = n - 1
    else if (ev.key === "Escape") {
      ev.preventDefault()
      setOpen(false)
      trigRef.current?.focus()
      return
    } else if (ev.key === "Tab") {
      setOpen(false)
      return
    }
    if (to < 0) return
    ev.preventDefault()
    setRove(to)
    itemRefs.current[to]?.focus()
  }

  /* pointer down outside closes a tap-opened arc */
  React.useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [open])

  /* ---------------------------------- pill ---------------------------------- */
  const targeted = target >= 0 ? actions[target] : undefined
  const pillText = done ?? (open && pressing && outside ? "Release to cancel" : (targeted?.label ?? label))
  const pillOn = open || done !== null
  React.useLayoutEffect(() => {
    const w = measureRef.current?.offsetWidth
    if (w && pillRef.current) pillRef.current.style.width = `${Math.ceil(w) + 28}px`
  }, [pillText])
  const sinD = Math.sin(rad(direction))
  const pillY = sinD > 0.5 ? 52 : -52
  const glyph = done !== null && !open ? "check" : open ? "x" : "dots"
  const fieldSize = (radius + ITEM) * 2 + 40

  return (
    <div
      ref={rootRef}
      className={cn("orm", className)}
      data-open={open ? "" : undefined}
      data-done={done !== null && !open ? "" : undefined}
      style={{ "--orm-fs": `${fieldSize}px` } as React.CSSProperties}
    >
      <style href="orm" precedence="default">
        {CSS}
      </style>
      <div
        className="orm-field"
        onPointerMove={(ev) => aim(ev.clientX, ev.clientY, ev.pointerType, pressing)}
        onPointerLeave={(ev) => {
          if (pressing || (ev.relatedTarget instanceof Node && rootRef.current?.contains(ev.relatedTarget))) return
          eng.current.ptr.valid = false
          setTarget(-1)
          kick()
        }}
        onClick={() => {
          if (target >= 0) fire(target)
          else setOpen(false)
        }}
      />
      <span ref={lensRef} className="orm-lens" aria-hidden="true" />
      <div id={`${uid}-menu`} role="menu" aria-label={label} className="orm-menu" inert={!open || undefined}>
        {actions.map((a, k) => (
          <button
            key={a.id}
            type="button"
            role="menuitem"
            className="orm-item"
            data-tone={a.tone === "danger" ? "danger" : undefined}
            data-target={k === target ? "" : undefined}
            aria-label={a.label}
            tabIndex={k === rove ? 0 : -1}
            ref={(el) => {
              itemRefs.current[k] = el
            }}
            onClick={(ev) => {
              ev.stopPropagation()
              fire(k)
            }}
            onPointerMove={(ev) => aim(ev.clientX, ev.clientY, ev.pointerType, pressing)}
            onPointerLeave={(ev) => {
              if (pressing || (ev.relatedTarget instanceof Node && rootRef.current?.contains(ev.relatedTarget))) return
              eng.current.ptr.valid = false
              setTarget(-1)
              kick()
            }}
            onFocus={(ev) => {
              setRove(k)
              if (ev.currentTarget.matches(":focus-visible")) setTarget(k)
            }}
            onBlur={() => setTarget((t) => (t === k && !pressing ? -1 : t))}
            onKeyDown={(ev) => onItemKey(ev, k)}
          >
            {a.icon}
          </button>
        ))}
      </div>
      <div className="orm-pill-anchor" aria-hidden="true" style={{ transform: `translateY(${pillY}px)` }}>
        <div ref={pillRef} className="orm-pill" data-on={pillOn ? "" : undefined} data-danger={targeted?.tone === "danger" && done === null ? "" : undefined}>
          <span className="orm-pill-text" key={pillText}>
            {pillText}
          </span>
        </div>
        <span ref={measureRef} className="orm-measure">
          {pillText}
        </span>
      </div>
      <button
        ref={trigRef}
        type="button"
        className="orm-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${uid}-menu`}
        disabled={disabled}
        data-glyph={glyph}
        data-pressing={pressing ? "" : undefined}
        onPointerDown={onTriggerDown}
        onPointerMove={onTriggerMove}
        onPointerUp={onTriggerUp}
        onPointerCancel={onTriggerUp}
        onKeyDown={onTriggerKey}
        onClick={onTriggerClick}
      >
        <Dots />
        <Cross />
        <Tick />
      </button>
      {announce && (
        <span className="orm-sr" role="status" aria-live="polite">
          {done ?? ""}
        </span>
      )}
    </div>
  )
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type HoloCardProps = {
  /** The face. Fill the whole card – it is clipped to the rounded shape and the foil is painted on top. */
  front: React.ReactNode
  /** The back. Leave it out for a tilt-only card that is not a button. */
  back?: React.ReactNode
  /** Controlled flipped state. */
  flipped?: boolean
  /** Initial flipped state when uncontrolled. */
  defaultFlipped?: boolean
  /** Called when the card is flipped. */
  onFlippedChange?: (flipped: boolean) => void
  /** Largest lean in degrees. */
  maxTilt?: number
  /** Strength of foil, glitter and glare, 0 to 1. */
  intensity?: number
  /** Follow device tilt on touch screens. On iOS the permission is asked on the first tap. */
  gyroscope?: boolean
  /** Accessible name. Defaults to the text on the card. */
  label?: string
  /** Class on the root. Set the width here – the card keeps a 5:7 ratio. */
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const GLITTER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='%23fff'%3E%3Ccircle cx='7' cy='12' r='.8'/%3E%3Ccircle cx='31' cy='5' r='.6'/%3E%3Ccircle cx='52' cy='22' r='1'/%3E%3Ccircle cx='88' cy='9' r='.7'/%3E%3Ccircle cx='109' cy='31' r='.9'/%3E%3Ccircle cx='18' cy='47' r='.6'/%3E%3Ccircle cx='64' cy='51' r='.8'/%3E%3Ccircle cx='97' cy='62' r='.6'/%3E%3Ccircle cx='38' cy='76' r='1'/%3E%3Ccircle cx='76' cy='88' r='.7'/%3E%3Ccircle cx='12' cy='99' r='.8'/%3E%3Ccircle cx='55' cy='108' r='.6'/%3E%3Ccircle cx='104' cy='101' r='.9'/%3E%3Ccircle cx='27' cy='28' r='.5'/%3E%3Ccircle cx='82' cy='40' r='.5'/%3E%3Ccircle cx='46' cy='92' r='.5'/%3E%3C/g%3E%3C/svg%3E\")"

const CSS = `
.hc {
  --hc-ink: #000;
  --hc-accent: #0060e2;
  --hc-i: 1;
  --hc-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; display: block; width: min(100%, 300px); aspect-ratio: 5 / 7;
  container-type: inline-size; font-family: var(--hc-font, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
  -webkit-tap-highlight-color: transparent; touch-action: pan-y;
}
:is(.dark, [data-theme="dark"]) .hc { --hc-ink: #fff; --hc-accent: #4d8dff }
.hc *, .hc *::before, .hc *::after { box-sizing: border-box }
.hc-shadow {
  position: absolute; inset: 0; border-radius: 22px; pointer-events: none;
  box-shadow: 0 18px 36px -14px rgb(0 0 0 / .4); will-change: transform;
}
.hc-card {
  position: absolute; inset: 0; border-radius: 22px; transform-style: preserve-3d; will-change: transform;
  outline: none; cursor: default;
}
.hc[data-flippable="true"] .hc-card { cursor: pointer }
.hc-card:focus-visible { outline: 2px solid color-mix(in oklab, var(--hc-accent) 70%, transparent); outline-offset: 4px }
.hc-inner { position: absolute; inset: 0; transform-style: preserve-3d; will-change: transform }
.hc-face {
  position: absolute; inset: 0; border-radius: 22px; overflow: hidden; isolation: isolate;
  backface-visibility: hidden; -webkit-backface-visibility: hidden; background: #0e0e12; color: #fff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .14);
}
.hc-back { transform: rotateY(180deg) }
.hc-content { position: absolute; inset: 0 }
.hc-foil, .hc-glitter, .hc-glare { position: absolute; inset: 0; pointer-events: none }
.hc-foil {
  mix-blend-mode: color-dodge; opacity: calc(.3 * var(--hc-i));
  background: repeating-linear-gradient(118deg, oklch(.8 .05 340), oklch(.86 .045 70) 7%, oklch(.88 .045 150) 14%, oklch(.84 .045 220) 21%, oklch(.8 .05 290) 28%, oklch(.8 .05 340) 35%);
  background-size: 300% 300%; background-position: var(--hc-fx, 50%) var(--hc-fy, 50%);
}
.hc-glitter {
  mix-blend-mode: overlay; opacity: calc(.55 * var(--hc-i));
  background-image: ${GLITTER}; background-size: 120px 120px; background-position: var(--hc-gx, 0px) var(--hc-gy, 0px);
  -webkit-mask-image: radial-gradient(circle at var(--hc-x, 50%) var(--hc-y, 50%), #000 0, rgb(0 0 0 / .35) 38%, transparent 72%);
  mask-image: radial-gradient(circle at var(--hc-x, 50%) var(--hc-y, 50%), #000 0, rgb(0 0 0 / .35) 38%, transparent 72%);
}
.hc-glare {
  mix-blend-mode: overlay;
  background: radial-gradient(circle at var(--hc-x, 50%) var(--hc-y, 50%), rgb(255 255 255 / calc(.36 * var(--hc-i))) 0, rgb(255 255 255 / calc(.1 * var(--hc-i))) 32%, rgb(0 0 0 / calc(.14 * var(--hc-i))) 100%);
}
@media (prefers-reduced-transparency: reduce) { .hc-foil, .hc-glitter { display: none } }
@media (prefers-reduced-motion: reduce) {
  .hc-glitter { display: none }
  .hc-face { transition: opacity .25s linear }
  .hc[data-reduced="true"] .hc-inner { transform: none !important }
  .hc[data-reduced="true"] .hc-back { transform: none; opacity: 0; backface-visibility: visible }
  .hc[data-reduced="true"][data-flipped="true"] .hc-back { opacity: 1 }
  .hc[data-reduced="true"][data-flipped="true"] .hc-front { opacity: 0 }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Springs                                   */
/* -------------------------------------------------------------------------- */

type Spr = { x: number; v: number; to: number; k: number; c: number }
const spr = (x: number, k: number, zeta: number): Spr => ({ x, v: 0, to: x, k, c: 2 * zeta * Math.sqrt(k) })
function step(s: Spr, dt: number) {
  let t = dt
  while (t > 0) {
    const h = Math.min(t, 1 / 240)
    s.v += (s.k * (s.to - s.x) - s.c * s.v) * h
    s.x += s.v * h
    t -= h
  }
}
const rest = (s: Spr, eps = 0.0015) => Math.abs(s.to - s.x) < eps && Math.abs(s.v) < eps * 4

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).filter(Boolean).join(" ")
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children)
  return ""
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type MotionRefs = {
  shadow: HTMLDivElement | null
  card: HTMLDivElement | null
  inner: HTMLDivElement | null
  root: HTMLDivElement | null
}

export function HoloCard({
  front,
  back,
  flipped: flippedProp,
  defaultFlipped = false,
  onFlippedChange,
  maxTilt = 14,
  intensity = 1,
  gyroscope = true,
  label,
  className,
  style,
}: HoloCardProps) {
  const [inner, setInner] = React.useState(defaultFlipped)
  const flipped = flippedProp ?? inner
  const flippable = back != null
  const [reduced, setReduced] = React.useState(false)
  const refs = React.useRef<MotionRefs>({ shadow: null, card: null, inner: null, root: null })
  const sim = React.useRef({
    rx: spr(0, 190, 0.62), ry: spr(0, 190, 0.62), sc: spr(1, 260, 0.9),
    lx: spr(0.3, 90, 0.9), ly: spr(0.22, 90, 0.9),
    flip: spr(defaultFlipped ? 180 : 0, 150, 0.6),
    turn: defaultFlipped ? 180 : 0, // current target of the spin, grows by ±180 per flip
    raf: 0, last: 0, hover: false, gyro: false, gyroAsked: false,
  })
  const maxTiltRef = React.useRef(maxTilt)
  const reducedRef = React.useRef(false)
  const flippedRef = React.useRef(flipped)

  const paint = React.useCallback(() => {
    const s = sim.current
    const r = refs.current
    if (!r.card || !r.shadow || !r.inner || !r.root) return
    const rx = s.rx.x, ry = s.ry.x, sc = s.sc.x
    const t = `perspective(900px) scale(${sc.toFixed(4)}) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
    r.card.style.transform = t
    // While the card turns edge-on its shadow narrows with it.
    const turnX = Math.max(0.1, Math.abs(Math.cos((s.flip.x * Math.PI) / 180)))
    r.shadow.style.transform = `${t} scaleX(${turnX.toFixed(3)})`
    // The shadow slides opposite the lean.
    const m = maxTiltRef.current || 1
    const sx = (-ry / m) * -9, sy = 18 + (rx / m) * 9 + (Math.abs(ry) + Math.abs(rx)) * 0.4
    r.shadow.style.boxShadow = `${sx.toFixed(2)}px ${(sy + 9).toFixed(2)}px ${(36 + (sc - 1) * 300).toFixed(1)}px -14px rgb(0 0 0 / ${(0.34 + (sc - 1) * 2).toFixed(3)})`
    r.inner.style.transform = `rotateY(${s.flip.x.toFixed(2)}deg)`
    const lx = s.lx.x * 100, ly = s.ly.x * 100
    const sweep = Math.sin((s.flip.x * Math.PI) / 180) * 70
    const st = r.card.style
    st.setProperty("--hc-x", `${lx.toFixed(2)}%`)
    st.setProperty("--hc-y", `${ly.toFixed(2)}%`)
    st.setProperty("--hc-fx", `${(50 + (lx - 50) * 1.7 + sweep).toFixed(2)}%`)
    st.setProperty("--hc-fy", `${(50 + (ly - 50) * 1.2).toFixed(2)}%`)
    st.setProperty("--hc-gx", `${(-ry * 3.2).toFixed(2)}px`)
    st.setProperty("--hc-gy", `${(rx * 3.2).toFixed(2)}px`)
  }, [])

  const tick = React.useCallback(
    function loop(now: number) {
      const s = sim.current
      const dt = Math.min(0.05, Math.max(0.001, (now - s.last) / 1000 || 0.016))
      s.last = now
      for (const k of [s.rx, s.ry, s.sc, s.lx, s.ly, s.flip]) step(k, dt)
      paint()
      const all = [s.rx, s.ry, s.sc, s.lx, s.ly].every((k) => rest(k)) && rest(s.flip, 0.02)
      if (all) {
        s.raf = 0
        return
      }
      s.raf = requestAnimationFrame(loop)
    },
    [paint],
  )

  const kick = React.useCallback(() => {
    const s = sim.current
    if (s.raf) return
    s.last = performance.now()
    s.raf = requestAnimationFrame(tick)
  }, [tick])

  React.useEffect(() => {
    maxTiltRef.current = maxTilt
  }, [maxTilt])

  // Keep the spin target in sync with the flipped state (also when it is controlled from outside).
  React.useEffect(() => {
    flippedRef.current = flipped
    const s = sim.current
    const want = flipped ? 1 : 0
    const have = Math.abs(Math.round(s.turn / 180)) % 2
    if (reducedRef.current) return
    if (want !== have) {
      s.turn += flipped ? 180 : s.turn > 0 ? -180 : 180
    }
    s.flip.to = s.turn
    kick()
  }, [flipped, kick])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => {
      reducedRef.current = mq.matches
      setReduced(mq.matches)
    }
    on()
    mq.addEventListener("change", on)
    paint()
    const sm = sim.current
    return () => {
      mq.removeEventListener("change", on)
      cancelAnimationFrame(sm.raf)
      sm.raf = 0
    }
  }, [paint])

  const aim = React.useCallback(
    (nx: number, ny: number) => {
      // nx, ny in 0..1 over the card
      if (reducedRef.current) return
      const s = sim.current
      const m = maxTiltRef.current
      s.ry.to = (nx - 0.5) * 2 * m
      s.rx.to = -(ny - 0.5) * 2 * m
      s.lx.to = nx
      s.ly.to = ny
      kick()
    },
    [kick],
  )
  const settle = () => {
    const s = sim.current
    s.hover = false
    s.rx.to = 0
    s.ry.to = 0
    s.sc.to = 1
    s.lx.to = 0.3
    s.ly.to = 0.22
    kick()
  }

  // Device tilt on phones.
  React.useEffect(() => {
    if (!gyroscope || typeof window === "undefined" || !window.matchMedia("(pointer: coarse)").matches) return
    const onOrient = (e: DeviceOrientationEvent) => {
      if (reducedRef.current || e.gamma == null || e.beta == null) return
      const s = sim.current
      if (s.hover) return
      s.gyro = true
      const nx = Math.min(1, Math.max(0, 0.5 + e.gamma / 60))
      const ny = Math.min(1, Math.max(0, 0.5 + (e.beta - 45) / 60))
      aim(nx, ny)
    }
    window.addEventListener("deviceorientation", onOrient)
    return () => window.removeEventListener("deviceorientation", onOrient)
  }, [gyroscope, aim])

  const askGyro = () => {
    const s = sim.current
    if (!gyroscope || s.gyroAsked) return
    s.gyroAsked = true
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent
    DOE?.requestPermission?.().catch(() => {})
  }

  const down = React.useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const pressSide = React.useRef<1 | -1>(1)

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = refs.current.root
    if (!root) return
    const b = root.getBoundingClientRect()
    if (e.pointerType === "mouse") {
      const s = sim.current
      s.hover = true
      s.sc.to = 1.035
      aim((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height)
    } else if (down.current) {
      // Finger drag tilts the card on touch screens.
      if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 6) down.current.moved = true
      sim.current.hover = true
      aim((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height)
    }
  }
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    down.current = { x: e.clientX, y: e.clientY, moved: false }
    if (e.pointerType !== "mouse") askGyro()
    if (flippable && !reducedRef.current) {
      // Spin toward the side that was pressed.
      const b = e.currentTarget.getBoundingClientRect()
      const left = e.clientX - b.left < b.width / 2
      pressSide.current = left ? -1 : 1
    }
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") {
      sim.current.hover = false
      if (!sim.current.gyro) settle()
    }
  }

  const toggle = (dir: 1 | -1 = 1) => {
    if (!flippable) return
    const next = !flippedRef.current
    if (!reducedRef.current) {
      const s = sim.current
      s.turn += 180 * dir
      s.flip.to = s.turn
      kick()
    }
    if (flippedProp === undefined) setInner(next)
    onFlippedChange?.(next)
  }

  const onClick = () => {
    if (down.current?.moved) return
    toggle(pressSide.current)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      pressSide.current = 1
      toggle(1)
    }
  }

  const a11y: React.HTMLAttributes<HTMLDivElement> = flippable
    ? {
        role: "button",
        tabIndex: 0,
        "aria-roledescription": "flip card",
        "aria-pressed": flipped,
        "aria-label": label ?? (textOf(flipped ? back : front) || undefined),
        onKeyDown,
        onClick,
      }
    : { role: "group", "aria-label": label ?? (textOf(front) || undefined) }

  return (
    <div
      ref={(el) => {
        refs.current.root = el
      }}
      className={cn("hc", className)}
      data-flippable={flippable}
      data-flipped={flipped}
      data-reduced={reduced}
      style={{ ["--hc-i" as string]: Math.max(0, Math.min(1, intensity)), ...style }}
      onPointerMove={onPointerMove}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") settle()
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <style href="holo-card" precedence="default">{CSS}</style>
      <div
        className="hc-shadow"
        ref={(el) => {
          refs.current.shadow = el
        }}
        aria-hidden="true"
      />
      <div
        className="hc-card"
        ref={(el) => {
          refs.current.card = el
        }}
        {...a11y}
      >
        <div
          className="hc-inner"
          ref={(el) => {
            refs.current.inner = el
          }}
        >
          <div className="hc-face hc-front" aria-hidden={flippable && flipped ? true : undefined}>
            <div className="hc-content">{front}</div>
            <span className="hc-foil" aria-hidden="true" />
            <span className="hc-glitter" aria-hidden="true" />
            <span className="hc-glare" aria-hidden="true" />
          </div>
          {flippable && (
            <div className="hc-face hc-back" aria-hidden={flipped ? undefined : true}>
              <div className="hc-content">{back}</div>
              <span className="hc-foil" aria-hidden="true" />
              <span className="hc-glitter" aria-hidden="true" />
              <span className="hc-glare" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

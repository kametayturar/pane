"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type GlassCardProps = {
  /** Photo behind the glass. Use `media` instead for an illustration or video. */
  image?: string
  /** Alt text for the photo. Pass an empty string when it is decorative. */
  imageAlt?: string
  /** Any element to show as the backdrop instead of `image` (an SVG scene, a video). It fills the card. */
  media?: React.ReactNode
  /** Main line in the glass panel, such as a name or a product. */
  title: string
  /** Second line under the title. */
  subtitle?: React.ReactNode
  /** Small element at the end of the header, such as a price, a rating or a status. */
  aside?: React.ReactNode
  /** Detail content revealed when the card expands. Buttons inside stay interactive and do not toggle the card. */
  children?: React.ReactNode
  /** Controlled expanded state. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Maximum tilt in degrees. 0 turns tilt off. */
  tilt?: number
  /** Set the width here; the card keeps a 4 by 5 ratio. */
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.gcd {
  --gcd-ink: #000;
  --gcd-accent: #0060e2;
  --gcd-t1: color-mix(in oklab, var(--gcd-ink) 88%, transparent);
  --gcd-t2: color-mix(in oklab, var(--gcd-ink) 62%, transparent);
  --gcd-glass: color-mix(in oklab, #fff 62%, transparent);
  --gcd-line: color-mix(in oklab, var(--gcd-ink) 8%, transparent);
  --gcd-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; display: block; width: 100%; max-width: 360px; aspect-ratio: 4 / 5; perspective: 1000px;
  font-family: var(--gcd-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 20px; color: var(--gcd-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .gcd {
  --gcd-ink: #fff; --gcd-accent: #6ea4ff;
  --gcd-t1: rgb(255 255 255 / .94); --gcd-t2: rgb(255 255 255 / .62);
  --gcd-glass: color-mix(in oklab, #1b1b20 50%, transparent);
  --gcd-line: rgb(255 255 255 / .1);
}
.gcd *, .gcd *::before, .gcd *::after { box-sizing: border-box }
.gcd :focus-visible { outline: 2px solid color-mix(in oklab, var(--gcd-accent) 65%, transparent); outline-offset: 2px }

.gcd-card {
  position: absolute; inset: 0; border-radius: 34px; overflow: hidden; cursor: pointer; transform-style: preserve-3d; isolation: isolate;
  background: color-mix(in oklab, var(--gcd-ink) 8%, #e6e6e6);
  box-shadow: 0 20px 48px rgb(0 0 0 / .18), 0 3px 10px rgb(0 0 0 / .08);
  will-change: transform; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
}
.gcd[data-open] .gcd-card { cursor: default }
.gcd-media { position: absolute; inset: 0; transform: scale(1.02); transition: transform .7s var(--gcd-ease); will-change: transform }
.gcd[data-open] .gcd-media { transform: scale(1.09) }
.gcd-media > img, .gcd-media > svg, .gcd-media > video { display: block; width: 100%; height: 100%; object-fit: cover; user-select: none; -webkit-user-drag: none }
.gcd-scrim { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(0deg, rgb(0 0 0 / .22), rgb(0 0 0 / 0) 45%); transition: opacity .5s ease }
.gcd-scrim::after { content: ""; position: absolute; inset: 0; background: linear-gradient(0deg, rgb(0 0 0 / .3), rgb(0 0 0 / 0) 70%); opacity: 0; transition: opacity .5s ease }
.gcd[data-open] .gcd-scrim::after { opacity: 1 }

.gcd-panel {
  position: absolute; left: 12px; right: 12px; bottom: 12px; height: 72px; border-radius: 22px; overflow: hidden;
  -webkit-backdrop-filter: blur(22px) saturate(1.7); backdrop-filter: blur(22px) saturate(1.7);
  background: var(--gcd-glass);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .5), inset 0 0 16px rgb(255 255 255 / .16), 0 12px 32px rgb(0 0 0 / .16), 0 2px 6px rgb(0 0 0 / .08);
  cursor: default; will-change: height;
}
:is(.dark, [data-theme="dark"]) .gcd-panel { box-shadow: inset 0 1px 0 rgb(255 255 255 / .2), 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 32px rgb(0 0 0 / .4) }
/* Static soft sheen in the top-left, plus a glare that follows the pointer */
.gcd-panel::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(110% 100% at 6% -20%, rgb(255 255 255 / .34), transparent 55%) }
:is(.dark, [data-theme="dark"]) .gcd-panel::before { background: radial-gradient(110% 100% at 6% -20%, rgb(255 255 255 / .1), transparent 55%) }
.gcd-glare { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(200px circle at var(--hx, -400px) var(--hy, -400px), rgb(255 255 255 / .3), transparent 70%) }
/* The rim: a 1px ring (mask-composite: exclude) lit by a radial gradient under the pointer */
.gcd-edge {
  position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; opacity: 0; z-index: 3;
  background: radial-gradient(190px circle at var(--hx, -400px) var(--hy, -400px), #fff, rgb(255 255 255 / 0) 72%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
}
.gcd-rim { position: absolute; inset: 0; border-radius: inherit; padding: 1px; pointer-events: none; z-index: 3;
  background: linear-gradient(150deg, rgb(255 255 255 / .8), rgb(255 255 255 / 0) 30%, rgb(255 255 255 / 0) 62%, rgb(255 255 255 / .45));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude }
:is(.dark, [data-theme="dark"]) .gcd-rim { opacity: .5 }

.gcd-header { font: inherit; color: inherit; background: none; border: 0; margin: 0; cursor: pointer; position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; width: 100%; height: 72px; padding: 14px 16px; border-radius: 22px 22px 0 0; text-align: left }
.gcd-header:focus-visible { outline-offset: -3px }
.gcd-titles { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column }
.gcd-title { font-size: 16px; line-height: 22px; font-weight: 500; letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.gcd-sub { font-size: 14px; line-height: 19px; color: var(--gcd-t2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.gcd-aside { flex: none; font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px }
.gcd-chev { flex: none; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 999px; color: var(--gcd-t2); background: color-mix(in oklab, var(--gcd-ink) 7%, transparent); transition: transform .5s var(--gcd-ease) }
.gcd-chev svg { width: 12px; height: 12px }
.gcd[data-open] .gcd-chev { transform: rotate(180deg) }

.gcd-detail { position: relative; z-index: 2; padding: 0 16px 16px; cursor: auto }
.gcd-detail-in { animation: gcd-up .5s var(--gcd-ease) .1s backwards }
.gcd[data-leaving] .gcd-detail-in { opacity: 0; filter: blur(3px); transform: translateY(6px); transition: opacity .16s ease, filter .16s ease, transform .16s ease }
.gcd-detail::before { content: ""; display: block; height: 1px; margin: 0 0 14px; background: var(--gcd-line) }
@keyframes gcd-up { from { opacity: 0; transform: translateY(10px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }

@media (prefers-reduced-transparency: reduce) {
  .gcd-panel { -webkit-backdrop-filter: none; backdrop-filter: none; background: color-mix(in oklab, #f3f3f6 98%, transparent) }
  :is(.dark, [data-theme="dark"]) .gcd-panel { background: #26262c }
}
@media (prefers-reduced-motion: reduce) {
  .gcd *, .gcd *::before, .gcd *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

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

// indexes into the spring arrays
const RX = 0, RY = 1, HX = 2, HY = 3, HO = 4, PH = 5, MX = 6, MY = 7
const STIFF = [170, 170, 260, 260, 150, 300, 120, 120]
const DAMP = [0.95, 0.95, 0.9, 0.9, 1, 0.92, 1, 1]

const Chevron = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 7.5 3-3 3 3" />
  </svg>
)

/**
 * A photo card with a frosted glass info panel. The pointer lights the panel's rim with a moving specular highlight while
 * the card tilts a few degrees toward it (all springs, written to the DOM without React renders). Tap to morph the panel
 * up into a detail sheet.
 */
export function GlassCard({ image, imageAlt = "", media, title, subtitle, aside, children, open: openProp, defaultOpen = false, onOpenChange, tilt = 6, className, style }: GlassCardProps) {
  const reduce = useReducedMotion()
  const uid = React.useId().replace(/:/g, "")
  const detailId = `gcd-${uid}`
  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  const [mounted, setMounted] = React.useState(defaultOpen)
  const [leaving, setLeaving] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const headerRef = React.useRef<HTMLButtonElement>(null)
  const detailRef = React.useRef<HTMLDivElement>(null)
  const mediaRef = React.useRef<HTMLDivElement>(null)
  const edgeRef = React.useRef<HTMLSpanElement>(null)
  const glareRef = React.useRef<HTMLSpanElement>(null)
  const openRef = React.useRef(open)
  openRef.current = open
  const sim = React.useRef({ x: [0, 0, 0, 0, 0, 72, 0, 0], v: [0, 0, 0, 0, 0, 0, 0, 0], t: [0, 0, -400, -400, 0, 72, 0, 0], raf: 0, last: 0 })

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    if (next !== open) onOpenChange?.(next)
  }

  const apply = () => {
    const s = sim.current
    const card = cardRef.current
    if (card) card.style.transform = `rotateX(${s.x[RX]}deg) rotateY(${s.x[RY]}deg)`
    const panel = panelRef.current
    if (panel) panel.style.height = `${Math.max(72, s.x[PH])}px`
    const m = mediaRef.current
    if (m) m.style.translate = `${s.x[MX]}px ${s.x[MY]}px`
    for (const el of [edgeRef.current, glareRef.current]) {
      if (!el) continue
      el.style.setProperty("--hx", `${s.x[HX]}px`)
      el.style.setProperty("--hy", `${s.x[HY]}px`)
      el.style.opacity = String(Math.max(0, Math.min(1, s.x[HO])))
    }
  }
  const frame = (now: number) => {
    const s = sim.current
    let dt = Math.min(0.05, (now - s.last) / 1000)
    s.last = now
    while (dt > 0) {
      const h = Math.min(1 / 240, dt)
      for (let i = 0; i < s.x.length; i++) {
        const k = STIFF[i]
        s.v[i] += (-k * (s.x[i] - s.t[i]) - 2 * Math.sqrt(k) * DAMP[i] * s.v[i]) * h
        s.x[i] += s.v[i] * h
      }
      dt -= h
    }
    apply()
    let rest = true
    for (let i = 0; i < s.x.length; i++) {
      const tol = i === HX || i === HY ? 0.5 : i === PH ? 0.2 : 0.01
      if (Math.abs(s.x[i] - s.t[i]) > tol || Math.abs(s.v[i]) > (i === PH ? 0.3 : 0.05)) rest = false
    }
    if (rest) {
      s.x = [...s.t]
      s.v = s.v.map(() => 0)
      apply()
      s.raf = 0
      if (!openRef.current) {
        setMounted(false)
        setLeaving(false)
      }
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

  // Retarget the panel height whenever the card opens or closes
  React.useLayoutEffect(() => {
    const s = sim.current
    if (open && !mounted) {
      setMounted(true)
      return
    }
    const root = rootRef.current
    if (open) {
      const natural = 72 + (detailRef.current?.offsetHeight ?? 0)
      s.t[PH] = Math.min(natural, (root?.offsetHeight ?? 480) - 24)
    } else {
      s.t[PH] = 72
    }
    if (reduce) {
      s.x[PH] = s.t[PH]
      s.v[PH] = 0
      apply()
      if (!open) {
        setMounted(false)
        setLeaving(false)
      }
    } else wake()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, children])

  React.useEffect(() => {
    const s = sim.current
    return () => {
      cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [])

  const wasOpen = React.useRef(open)
  if (wasOpen.current !== open) {
    wasOpen.current = open
    if (!open && mounted && !leaving) setLeaving(true)
    if (open && leaving) setLeaving(false)
  }

  /* ------------------------------- pointer --------------------------------- */

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return
    const r = root.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1
    const s = sim.current
    const pr = panel.getBoundingClientRect()
    if (!reduce && tilt > 0) {
      s.t[RY] = nx * tilt
      s.t[RX] = -ny * tilt
      s.t[MX] = -nx * 7
      s.t[MY] = -ny * 7
    }
    s.t[HX] = e.clientX - pr.left
    s.t[HY] = e.clientY - pr.top
    if (s.t[HO] === 0 && !reduce) {
      // first contact: place the light under the pointer instantly, then fade it in
      s.x[HX] = s.t[HX]
      s.x[HY] = s.t[HY]
      s.v[HX] = s.v[HY] = 0
    }
    s.t[HO] = 1
    if (reduce) {
      s.x[HX] = s.t[HX]
      s.x[HY] = s.t[HY]
      s.x[HO] = 1
      apply()
    } else wake()
  }
  const onPointerLeave = () => {
    const s = sim.current
    s.t[RX] = s.t[RY] = s.t[MX] = s.t[MY] = 0
    s.t[HO] = 0
    if (reduce) {
      s.x[RX] = s.x[RY] = 0
      s.x[HO] = 0
      apply()
    } else wake()
  }

  const toggle = () => setOpen(!open)
  const onCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest(".gcd-panel")) return // header handles its own click; details must not toggle
    toggle()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation()
      setOpen(false)
      headerRef.current?.focus()
    }
  }

  return (
    <div
      ref={rootRef}
      className={`gcd${className ? ` ${className}` : ""}`}
      style={style}
      data-open={open ? "" : undefined}
      data-leaving={leaving && !open ? "" : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
    >
      <style href="gcd" precedence="default">{CSS}</style>
      <div ref={cardRef} className="gcd-card" onClick={onCardClick}>
        <div ref={mediaRef} className="gcd-media">
          {media ?? (image ? <img src={image} alt={imageAlt} draggable={false} /> : null)}
        </div>
        <div className="gcd-scrim" />
        <div ref={panelRef} className="gcd-panel">
          <span className="gcd-rim" />
          <span ref={glareRef} className="gcd-glare" />
          <span ref={edgeRef} className="gcd-edge" />
          <button ref={headerRef} type="button" className="gcd-header" aria-expanded={open} aria-controls={mounted ? detailId : undefined} onClick={toggle}>
            <span className="gcd-titles">
              <span className="gcd-title">{title}</span>
              {subtitle && <span className="gcd-sub">{subtitle}</span>}
            </span>
            {aside && <span className="gcd-aside">{aside}</span>}
            {children && (
              <span className="gcd-chev" aria-hidden="true">
                <Chevron />
              </span>
            )}
          </button>
          {mounted && (
            <div ref={detailRef} id={detailId} className="gcd-detail" role="region" aria-label={title}>
              <div className="gcd-detail-in">{children}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

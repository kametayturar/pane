"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LogoMarqueeItem = {
  /** Company name. Used as the accessible name and as the visible wordmark when `logo` is not set. */
  name: string
  /** A fully drawn logo (use `currentColor` so it follows the muted colour). Replaces the default wordmark. */
  logo?: React.ReactNode
  /** Brand colour the logo lifts to while hovered. Defaults to the ink colour. */
  color?: string
  /** Makes the logo a link. */
  href?: string
}

export type LogoMarqueeProps = {
  /** The logos. Leave it out to see five invented wordmarks. */
  items?: LogoMarqueeItem[]
  /** Pixels per second – the same pace on any width. */
  speed?: number
  /** Which way the strip runs. */
  direction?: "left" | "right"
  /** Space between logos in px (about 60 % of it on narrow containers). */
  gap?: number
  /** Hold the strip still (it eases to a stop and winds back up). */
  paused?: boolean
  /** Ease to a stop while hovered or focused, and speed back up on leave. */
  pauseOnHover?: boolean
  /** Accessible name of the strip. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                          Invented wordmarks (demo)                         */
/* -------------------------------------------------------------------------- */

type Glyph = React.ReactNode

const svgProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

const GLYPHS: Record<string, Glyph> = {
  fieldnote: (
    <svg {...svgProps}>
      <rect x="4" y="3" width="16" height="18" rx="3.5" />
      <path d="M8.5 9h7M8.5 13.5h4" />
    </svg>
  ),
  kitewise: (
    <svg {...svgProps} fill="currentColor" stroke="none">
      <path d="M12 1.5 20 9.5 12 16 4 9.5z" />
      <path d="M12 16c-2 2.2-2 4.2 0 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  sundial: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </svg>
  ),
  northpeak: (
    <svg {...svgProps} fill="currentColor" stroke="none">
      <path d="M1.5 20.5 9.5 6l4 7 3-4.5 6 12z" />
    </svg>
  ),
  ledgerline: (
    <svg {...svgProps} fill="currentColor" stroke="none">
      <rect x="3" y="4" width="18" height="4" rx="2" />
      <rect x="3" y="10" width="12" height="4" rx="2" />
      <rect x="3" y="16" width="15" height="4" rx="2" />
    </svg>
  ),
  harbormark: (
    <svg {...svgProps}>
      <circle cx="12" cy="5.5" r="2.7" />
      <path d="M12 8.2V21M5 13.5a7 7 0 0 0 14 0M8.5 12.5h7" />
    </svg>
  ),
  orbitly: (
    <svg {...svgProps}>
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-28 12 12)" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  lumenary: (
    <svg {...svgProps} fill="currentColor" stroke="none">
      <path d="M12 1.5 14.6 9.4 22.5 12l-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z" />
    </svg>
  ),
}

/** A drawn mark plus a name set in its own weight, tracking and style. Used for the default logos. */
export function LogoWordmark({
  glyph,
  name,
  style,
}: {
  glyph: React.ReactNode
  name: string
  style?: React.CSSProperties
}) {
  return (
    <>
      <span className="lm__mark">{glyph}</span>
      <span className="lm__name" style={style}>
        {name}
      </span>
    </>
  )
}

const SERIF = 'Georgia, "Times New Roman", ui-serif, serif'

const DEFAULT_ITEMS: LogoMarqueeItem[] = [
  { name: "Fieldnote", color: "#2f7d5b", logo: <LogoWordmark glyph={GLYPHS.fieldnote} name="Fieldnote" /> },
  {
    name: "Kitewise",
    color: "#e0553d",
    logo: (
      <LogoWordmark
        glyph={GLYPHS.kitewise}
        name="kitewise"
        style={{ fontWeight: 700, letterSpacing: "-0.045em" }}
      />
    ),
  },
  {
    name: "Sundial",
    color: "#d08a14",
    logo: (
      <LogoWordmark
        glyph={GLYPHS.sundial}
        name="Sundial"
        style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.01em" }}
      />
    ),
  },
  {
    name: "Northpeak",
    color: "#3562d6",
    logo: (
      <LogoWordmark
        glyph={GLYPHS.northpeak}
        name="NORTHPEAK"
        style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.12em" }}
      />
    ),
  },
  {
    name: "Ledgerline",
    color: "#7a4fd1",
    logo: <LogoWordmark glyph={GLYPHS.ledgerline} name="Ledgerline" style={{ fontWeight: 500, letterSpacing: "-0.02em" }} />,
  },
  {
    name: "Harbormark",
    color: "#0f8aa6",
    logo: <LogoWordmark glyph={GLYPHS.harbormark} name="Harbormark" style={{ fontWeight: 300, letterSpacing: "0.01em" }} />,
  },
  {
    name: "Orbitly",
    color: "#d6336c",
    logo: <LogoWordmark glyph={GLYPHS.orbitly} name="orbitly" style={{ fontWeight: 800, letterSpacing: "-0.055em" }} />,
  },
  {
    name: "Lumenary",
    color: "#5a6b2a",
    logo: (
      <LogoWordmark
        glyph={GLYPHS.lumenary}
        name="LUMENARY"
        style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 400, letterSpacing: "0.2em" }}
      />
    ),
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lm {
  --lm-ink: #000;
  --lm-t1: color-mix(in oklab, var(--lm-ink) 88%, transparent);
  --lm-t3: color-mix(in oklab, var(--lm-ink) 40%, transparent);
  --lm-accent: #0060e2;
  --lm-ease: cubic-bezier(.22, 1, .36, 1);
  --lm-gap: 56px;
  position: relative;
  width: 100%;
  container-type: inline-size;
  color: var(--lm-t1);
  font-family: var(--lm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lm {
  --lm-ink: #fff;
  --lm-t1: color-mix(in oklab, var(--lm-ink) 90%, transparent);
  --lm-t3: color-mix(in oklab, var(--lm-ink) 42%, transparent);
  --lm-accent: #4d8dff;
}
.lm *, .lm *::before, .lm *::after { box-sizing: border-box }
.lm :focus-visible { outline: 2px solid color-mix(in oklab, var(--lm-accent) 60%, transparent); outline-offset: 4px; border-radius: 6px }

.lm__row {
  overflow: hidden;
  padding: 6px 0;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 min(14%, 120px), #000 calc(100% - min(14%, 120px)), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 min(14%, 120px), #000 calc(100% - min(14%, 120px)), transparent);
}
.lm__row[data-dragging] { cursor: grabbing }
.lm__track { display: flex; width: max-content; will-change: transform; backface-visibility: hidden }
.lm__set { display: flex; flex: none; margin: 0; padding: 0; list-style: none }
.lm__item { flex: none; margin: 0 var(--lm-gap) 0 0; display: block }
.lm__link {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 28px;
  color: var(--lm-t3);
  text-decoration: none;
  white-space: nowrap;
  transition: color .26s var(--lm-ease), opacity .26s var(--lm-ease);
  -webkit-user-drag: none;
}
.lm__link svg { display: block }
.lm__mark { display: flex; align-items: center; justify-content: center; width: 24px; height: 28px }
.lm__name { font-size: 19px; line-height: 1; font-weight: 600; letter-spacing: -.025em }
@media (hover: hover) {
  .lm__link:hover { color: var(--lm-c, var(--lm-t1)) }
}
.lm__link:focus-visible { color: var(--lm-c, var(--lm-t1)) }

@container (max-width: 480px) {
  .lm__item { margin-right: calc(var(--lm-gap) * .6) }
  .lm__name { font-size: 16px }
}

/* Reduced motion: every logo once, in a static wrapping row. */
.lm[data-static] .lm__row { cursor: auto; -webkit-mask-image: none; mask-image: none; user-select: auto }
.lm[data-static] .lm__track { width: auto; will-change: auto }
.lm[data-static] .lm__set { flex-wrap: wrap; justify-content: center; row-gap: 20px }

@media (prefers-reduced-motion: reduce) {
  .lm *, .lm *::before, .lm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches
const getReducedServer = () => false

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * The endless "Trusted by" strip. A measured set of logos is repeated and the track wraps by exactly one
 * set width, so the loop never jumps. One rAF loop eases a velocity: hover slows it to a stop, leaving
 * winds it back up, dragging scrubs it and letting go flings it with inertia.
 */
export function LogoMarquee({
  items = DEFAULT_ITEMS,
  speed = 40,
  direction = "left",
  gap = 56,
  paused = false,
  pauseOnHover = true,
  label = "Logos of companies using the product",
  className,
}: LogoMarqueeProps) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const rowRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const setRef = React.useRef<HTMLUListElement>(null)
  const [copies, setCopies] = React.useState(3)

  // Live inputs for the animation loop (written in an effect, read every frame).
  const cfg = React.useRef({ speed, direction, paused, pauseOnHover })
  React.useEffect(() => {
    cfg.current = { speed, direction, paused, pauseOnHover }
  }, [speed, direction, paused, pauseOnHover])

  // Runtime state of the single lane – lives outside React so frames never re-render.
  const lane = React.useRef({
    x: 0, // translateX of the track, always in (-width, 0]
    vel: 0, // px/s, negative = leftwards
    width: 0, // width of one set including its trailing gap
    hover: false,
    focus: false,
    drag: false,
    flung: false,
    moved: 0,
    lastX: 0,
    lastT: 0,
    dragVel: 0,
    pointerId: -1,
  })
  const visible = React.useRef(true)
  const wake = React.useRef<() => void>(() => {})

  /* Measure one set; build enough copies to always cover the viewport. */
  React.useEffect(() => {
    if (reduced) return
    const set = setRef.current
    const row = rowRef.current
    if (!set || !row) return
    const measure = () => {
      const w = set.getBoundingClientRect().width
      lane.current.width = w
      if (w > 0) setCopies(Math.max(2, Math.ceil(row.clientWidth / w) + 1))
    }
    const ro = new ResizeObserver(measure) // fires once on observe, then on every size change
    ro.observe(set)
    ro.observe(row)
    return () => ro.disconnect()
  }, [reduced, items, gap])

  /* The animation loop. Transforms only. */
  React.useEffect(() => {
    if (reduced) return
    const L = lane.current
    let raf = 0
    let last = 0

    const apply = () => {
      const w = L.width
      if (w > 0) {
        L.x = ((L.x % w) - w) % w // wrap into (-w, 0] – exactly one set, no seam
        if (L.x === -w) L.x = 0
      }
      const el = trackRef.current
      if (el) el.style.transform = `translate3d(${L.x}px,0,0)`
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.064)
      last = now
      const c = cfg.current
      if (!L.drag) {
        const stop = c.paused || (c.pauseOnHover && (L.hover || L.focus))
        const target = stop ? 0 : (c.direction === "left" ? -1 : 1) * c.speed
        // ease-out toward the target: fast to a stop (~⅓ s), gentle when winding back up or after a fling
        const tau = L.flung ? 0.55 : target === 0 ? 0.11 : 0.4
        L.vel += (target - L.vel) * (1 - Math.exp(-dt / tau))
        if (L.flung && Math.abs(L.vel - target) < 20) L.flung = false
        L.x += L.vel * dt
      }
      apply()
      raf = visible.current ? requestAnimationFrame(tick) : 0
    }

    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    wake.current = start
    start()

    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting
      if (entry.isIntersecting) start()
    })
    if (rootRef.current) io.observe(rootRef.current)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      raf = 0
      wake.current = () => {}
    }
  }, [reduced])

  /* Pointer: hover eases to a stop, drag scrubs, release flings. */
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") lane.current.hover = true
  }
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") lane.current.hover = false
  }
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.button !== 0) return
    const L = lane.current
    if (e.pointerType === "touch") {
      L.hover = true // press-and-hold pauses; horizontal swipes still scrub below
    }
    L.drag = true
    L.moved = 0
    L.lastX = e.clientX
    L.lastT = e.timeStamp
    L.dragVel = 0
    L.pointerId = e.pointerId
    L.flung = false
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const L = lane.current
    if (!L.drag || e.pointerId !== L.pointerId) return
    const dx = e.clientX - L.lastX
    if (L.moved < 4 && Math.abs(dx) + L.moved >= 4) {
      rowRef.current?.setPointerCapture(e.pointerId)
      rowRef.current?.setAttribute("data-dragging", "")
    }
    L.moved += Math.abs(dx)
    const dt = Math.max(e.timeStamp - L.lastT, 1) / 1000
    L.dragVel = L.dragVel * 0.6 + (dx / dt) * 0.4
    L.lastX = e.clientX
    L.lastT = e.timeStamp
    if (L.moved >= 4) {
      L.x += dx
      if (!visible.current) wake.current()
    }
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const L = lane.current
    if (!L.drag || e.pointerId !== L.pointerId) return
    L.drag = false
    if (e.pointerType === "touch") L.hover = false
    rowRef.current?.removeAttribute("data-dragging")
    if (L.moved >= 4) {
      const idle = e.timeStamp - L.lastT > 90
      L.vel = idle ? 0 : Math.max(-3200, Math.min(3200, L.dragVel))
      L.flung = true
    }
  }
  /** A drag must not also click the link underneath. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (lane.current.moved >= 4) {
      e.preventDefault()
      e.stopPropagation()
      lane.current.moved = 0
    }
  }

  /* Keyboard focus stops the strip and nudges the focused logo into view. */
  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const L = lane.current
    L.focus = true
    const row = rowRef.current
    const target = e.target as HTMLElement
    if (!row) return
    const rr = row.getBoundingClientRect()
    const tr = target.getBoundingClientRect()
    const pad = Math.min(120, rr.width * 0.14) + 8
    if (tr.left < rr.left + pad) L.x += rr.left + pad - tr.left
    else if (tr.right > rr.right - pad) L.x -= tr.right - (rr.right - pad)
    L.vel = 0
  }
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) lane.current.focus = false
  }

  const renderSet = (copy: number) => {
    const hidden = copy > 0
    return (
      <ul
        key={copy}
        className="lm__set"
        ref={copy === 0 ? setRef : undefined}
        aria-hidden={hidden || undefined}
      >
        {items.map((item, i) => {
          const body = item.logo ?? <LogoWordmark glyph={null} name={item.name} />
          const style = item.color ? ({ "--lm-c": item.color } as React.CSSProperties) : undefined
          return (
            <li key={`${item.name}-${i}`} className="lm__item">
              {item.href ? (
                <a className="lm__link" href={item.href} style={style} aria-label={item.name} draggable={false} tabIndex={hidden ? -1 : undefined}>
                  {body}
                </a>
              ) : (
                <span className="lm__link" style={style} role="img" aria-label={item.name}>
                  {body}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div
      ref={rootRef}
      className={["lm", className].filter(Boolean).join(" ")}
      role="region"
      aria-label={label}
      data-static={reduced || undefined}
      style={{ "--lm-gap": `${gap}px` } as React.CSSProperties}
    >
      <style href="lm" precedence="default">
        {CSS}
      </style>
      <div
        ref={rowRef}
        className="lm__row"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <div ref={trackRef} className="lm__track">
          {Array.from({ length: reduced ? 1 : copies }, (_, c) => renderSet(c))}
        </div>
      </div>
    </div>
  )
}

export default LogoMarquee

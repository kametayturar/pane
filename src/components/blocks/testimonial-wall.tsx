"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Testimonial = {
  quote: string
  name: string
  role: string
  company?: string
  /** Photo URL. Without one, the initials sit on a soft gradient picked from the name. */
  avatar?: string
}

export type TestimonialWallProps = {
  /** The quotes. Leave it out to see twelve invented ones. */
  items?: Testimonial[]
  /** Most columns on a wide container. The wall drops to 2 below 740px and 1 below 480px of its own width. */
  columns?: 1 | 2 | 3
  /** Pixels per second of the first column; the others run about 15 % slower and faster, in alternating directions. */
  speed?: number
  /** Hold every column still (they ease to a stop and wind back up). */
  paused?: boolean
  /** Ease the hovered column to a stop and wind it back up on leave. Keyboard focus always stops its column. */
  pauseOnHover?: boolean
  /** Height of the wall. Also settable with the `--tm-height` CSS variable. Default 600px. */
  height?: number | string
  /** Accessible name of the wall. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_ITEMS: Testimonial[] = [
  {
    quote:
      "Our agent used to hand off half the tickets. Since we tightened its tools and added evals, it closes most of them and says so plainly when it can't.",
    name: "Ines Karlsson",
    role: "Head of Support",
    company: "Brightharbor",
  },
  {
    quote: "The traces made it obvious why a run went sideways. We fixed a bad retrieval step in one afternoon.",
    name: "Dev Malhotra",
    role: "ML Engineer",
    company: "Quillpath",
  },
  {
    quote: "Our reviewers stopped asking where an answer came from. The citation sits right next to the claim.",
    name: "Rosa Delgado",
    role: "Research Lead",
    company: "Tidewell",
  },
  {
    quote:
      "I expected to babysit it for a month. By week two it was drafting replies my team only had to read, and the edits we made were small.",
    name: "Owen Fitzgerald",
    role: "Support Manager",
    company: "Cobaltway",
  },
  {
    quote: "Streaming feels calm. No flicker, no layout jumps, even when the model rewrites a paragraph mid-answer.",
    name: "Yuki Tanabe",
    role: "Frontend Engineer",
    company: "Mapleline",
  },
  {
    quote:
      "We showed it to legal on Monday and shipped on Thursday. The approval step was what convinced them it was safe to turn on.",
    name: "Amara Nwosu",
    role: "Product Lead",
    company: "Stonebridge",
  },
  {
    quote: "Finally a memory feature I can explain to a customer in one sentence, and switch off in one click.",
    name: "Felix Aronsen",
    role: "CTO",
    company: "Nettlewick",
  },
  {
    quote: "Cost per resolved ticket fell by a third once we routed the easy questions to the small model.",
    name: "Priyanka Joshi",
    role: "Operations Director",
    company: "Halcyon Freight",
  },
  {
    quote: "Keyboard support, dark mode and reduced motion were already handled. That almost never happens.",
    name: "Tomás Reyes",
    role: "Accessibility Engineer",
    company: "Larkspur",
  },
  {
    quote:
      "When a chat is handed to a person, they get the whole conversation and what the agent already tried. My team noticed on day one.",
    name: "Greta Lindholm",
    role: "Support Lead",
    company: "Oakfield",
  },
  {
    quote: "It reads like it was made by people who run an agent in production every day.",
    name: "Sam Okonkwo",
    role: "Staff Engineer",
    company: "Driftwood Labs",
  },
  {
    quote: "We use it as the reference when we review new UI. Small, plain, and every state is covered.",
    name: "Nadia Petrov",
    role: "Design Systems Lead",
    company: "Ferncliff",
  },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tm {
  --tm-card: #fff;
  --tm-line: #ececec;
  --tm-ink: #171717;
  --tm-text: #404040;
  --tm-muted: #8f8f8f;
  --tm-accent: #0060e2;
  --tm-shadow: 0 0 0 1px var(--tm-line), 0 1px 2px rgb(0 0 0 / .04);
  --tm-lift: 0 0 0 1px var(--tm-line), 0 2px 4px rgb(0 0 0 / .03), 0 12px 28px -10px rgb(0 0 0 / .16);
  --tm-dim: .5;
  --tm-av-l1: .94; --tm-av-l2: .87; --tm-av-ink: .4;
  --tm-ease: cubic-bezier(.22, 1, .36, 1);
  --tm-fade: 96px;
  --tm-n: 3;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--tm-n), minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  height: var(--tm-height, 600px);
  padding: 0 12px;
  overflow: hidden;
  color: var(--tm-text);
  font-family: var(--tm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 18.571px;
  -webkit-font-smoothing: antialiased;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 var(--tm-fade), #000 calc(100% - var(--tm-fade)), transparent);
  mask-image: linear-gradient(180deg, transparent, #000 var(--tm-fade), #000 calc(100% - var(--tm-fade)), transparent);
}
:is(.dark, [data-theme="dark"]) .tm {
  --tm-card: #19191b;
  --tm-line: #2a2a2e;
  --tm-ink: #ededed;
  --tm-text: #c8c8cc;
  --tm-muted: #8b8b92;
  --tm-accent: #4d8dff;
  --tm-shadow: 0 0 0 1px var(--tm-line);
  --tm-lift: 0 0 0 1px #34343a, 0 12px 28px -10px rgb(0 0 0 / .6);
  --tm-av-l1: .34; --tm-av-l2: .27; --tm-av-ink: .86;
}
.tm *, .tm *::before, .tm *::after { box-sizing: border-box }
.tm :focus-visible { outline: 2px solid color-mix(in oklab, var(--tm-accent) 60%, transparent); outline-offset: 2px }

.tm__col {
  min-width: 0;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
}
.tm__col[data-dragging] { cursor: grabbing }
.tm__track { will-change: transform; backface-visibility: hidden }
.tm__set { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none }
.tm__item { margin: 0 0 16px }

.tm__card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 18px 20px;
  border-radius: 16px;
  background: var(--tm-card);
  box-shadow: var(--tm-shadow);
  transition: transform .32s var(--tm-ease), box-shadow .32s var(--tm-ease), opacity .32s var(--tm-ease);
}
.tm__quote { margin: 0 }
.tm__quote p { margin: 0; font-size: 14px; line-height: 22.4px; letter-spacing: -.006em; color: var(--tm-text); text-wrap: pretty }
.tm__who { display: flex; align-items: center; gap: 10px; min-width: 0 }
.tm__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  object-fit: cover;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .02em;
  color: oklch(var(--tm-av-ink) .09 var(--h, 250));
  background: linear-gradient(140deg, oklch(var(--tm-av-l1) .05 var(--h, 250)), oklch(var(--tm-av-l2) .09 calc(var(--h, 250) + 40)));
  box-shadow: 0 0 0 1px rgb(0 0 0 / .05);
}
:is(.dark, [data-theme="dark"]) .tm__avatar { box-shadow: 0 0 0 1px rgb(255 255 255 / .06) }
.tm__id { display: grid; gap: 1px; min-width: 0 }
.tm__name { font-size: 13.5px; line-height: 18px; font-weight: 500; color: var(--tm-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.tm__meta { font-size: 12.5px; line-height: 17px; color: var(--tm-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }

@media (hover: hover) {
  .tm__col:not([data-dragging]) .tm__card:hover { transform: translateY(-3px); box-shadow: var(--tm-lift) }
  .tm:has(.tm__col:not([data-dragging]) .tm__card:hover) .tm__card:not(:hover) { opacity: var(--tm-dim) }
}
.tm__card:focus-visible { box-shadow: var(--tm-lift) }

@container tm (max-width: 479px) {
  .tm__quote p { font-size: 15px; line-height: 23px }
}

/* Reduced motion: every quote once, in a static masonry. */
.tm[data-static] { display: block; height: auto; overflow: visible; -webkit-mask-image: none; mask-image: none }
.tm__flat { margin: 0; padding: 0; list-style: none; column-width: 240px; column-count: var(--tm-n); column-gap: 16px }
.tm__flat .tm__item { break-inside: avoid }
.tm[data-static] .tm__card { cursor: auto; user-select: auto }

@media (prefers-reduced-motion: reduce) {
  .tm *, .tm *::before, .tm *::after { animation: none !important; transition: none !important }
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

/** Columns follow the wall's own width, so it also works in a sidebar. */
const columnsFor = (width: number, max: number) => Math.max(1, Math.min(max, width < 480 ? 1 : width < 740 ? 2 : 3))

const SPEED_MULT = [1, 0.85, 1.15]
const START = [0, 0.37, 0.71]

function hue(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

type Lane = {
  pos: number // translateY of the track, always in (-size, 0]
  vel: number // px/s, negative = upwards
  size: number // height of one set including its trailing gap
  mult: number
  dir: 1 | -1
  start: number
  init: boolean
  hover: boolean
  focus: boolean
  hold: boolean
  drag: boolean
  flung: boolean
  moved: number
  lastY: number
  lastT: number
  dragVel: number
  pointerId: number
}

const newLane = (i: number): Lane => ({
  pos: 0,
  vel: 0,
  size: 0,
  mult: SPEED_MULT[i % 3],
  dir: i % 2 === 0 ? -1 : 1,
  start: START[i % 3],
  init: false,
  hover: false,
  focus: false,
  hold: false,
  drag: false,
  flung: false,
  moved: 0,
  lastY: 0,
  lastT: 0,
  dragVel: 0,
  pointerId: -1,
})

function Card({ item, hidden }: { item: Testimonial; hidden: boolean }) {
  const meta = [item.role, item.company].filter(Boolean).join(" · ")
  return (
    <figure className="tm__card" tabIndex={hidden ? -1 : 0}>
      <blockquote className="tm__quote">
        <p>{item.quote}</p>
      </blockquote>
      <figcaption className="tm__who">
        {item.avatar ? (
          <img className="tm__avatar" src={item.avatar} alt="" loading="lazy" draggable={false} />
        ) : (
          <span className="tm__avatar" style={{ "--h": hue(item.name) } as React.CSSProperties} aria-hidden>
            {initials(item.name)}
          </span>
        )}
        <span className="tm__id">
          <span className="tm__name">{item.name}</span>
          <span className="tm__meta">{meta}</span>
        </span>
      </figcaption>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * The landing-page wall of quotes. Each column repeats a measured set and wraps by exactly its height.
 * One rAF loop eases a velocity per column: hover slows it to a stop, leaving winds it back up, and
 * dragging scrubs it with inertia. Columns alternate up/down at slightly different speeds.
 */
export function TestimonialWall({
  items = DEFAULT_ITEMS,
  columns = 3,
  speed = 28,
  paused = false,
  pauseOnHover = true,
  height,
  label = "What customers say",
  className,
}: TestimonialWallProps) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [n, setN] = React.useState<number>(columns)
  const [copies, setCopies] = React.useState(2)
  const lanes = React.useRef<Lane[]>([])
  const visible = React.useRef(true)
  const wake = React.useRef<() => void>(() => {})

  const cfg = React.useRef({ speed, paused, pauseOnHover })
  React.useEffect(() => {
    cfg.current = { speed, paused, pauseOnHover }
  }, [speed, paused, pauseOnHover])

  const cols = Math.min(n, columns)

  /* Measure the sets, size the copies, build the lanes and run the loop. Transforms only. */
  React.useEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const L = Array.from({ length: cols }, (_, i) => newLane(i))
    lanes.current = L

    let els = Array.from(root.querySelectorAll<HTMLElement>(".tm__track"))
    const measure = () => {
      els = Array.from(root.querySelectorAll<HTMLElement>(".tm__track"))
      let min = Infinity
      root.querySelectorAll<HTMLElement>(".tm__track > .tm__set:first-child").forEach((set, i) => {
        const h = set.getBoundingClientRect().height
        if (L[i]) L[i].size = h
        if (h > 0) min = Math.min(min, h)
      })
      if (isFinite(min)) setCopies(Math.max(2, Math.ceil(root.clientHeight / min) + 1))
      setN(columnsFor(root.clientWidth, columns))
    }
    const ro = new ResizeObserver(measure) // fires once on observe, then on every size change
    ro.observe(root)
    root.querySelectorAll(".tm__set:first-child").forEach((s) => ro.observe(s))

    let raf = 0
    let last = 0
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.064)
      last = now
      const c = cfg.current
      L.forEach((lane, i) => {
        const size = lane.size
        if (size > 0 && !lane.init) {
          lane.init = true
          lane.pos = -lane.start * size // columns start at different points
        }
        if (!lane.drag) {
          const stop = c.paused || lane.hold || (c.pauseOnHover && (lane.hover || lane.focus))
          const target = stop ? 0 : lane.dir * c.speed * lane.mult
          // ease toward the target: ~⅓ s to a stop, slower when winding back up or after a fling
          const tau = lane.flung ? 0.55 : target === 0 ? 0.11 : 0.4
          lane.vel += (target - lane.vel) * (1 - Math.exp(-dt / tau))
          if (lane.flung && Math.abs(lane.vel - target) < 20) lane.flung = false
          lane.pos += lane.vel * dt
        }
        if (size > 0) {
          lane.pos = ((lane.pos % size) - size) % size // wrap by exactly one set – no seam
          if (lane.pos === -size) lane.pos = 0
        }
        const el = els[i]
        if (el) el.style.transform = `translate3d(0,${lane.pos}px,0)`
      })
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
    io.observe(root)

    return () => {
      ro.disconnect()
      io.disconnect()
      cancelAnimationFrame(raf)
      raf = 0
      wake.current = () => {}
    }
  }, [cols, columns, reduced])

  const release = (i: number, e: React.PointerEvent<HTMLDivElement>) => {
    const L = lanes.current[i]
    if (!L) return
    if (e.pointerType === "touch") {
      L.hold = false
      return
    }
    if (!L.drag || e.pointerId !== L.pointerId) return
    L.drag = false
    e.currentTarget.removeAttribute("data-dragging")
    if (L.moved >= 4) {
      const idle = e.timeStamp - L.lastT > 90
      L.vel = idle ? 0 : Math.max(-3200, Math.min(3200, L.dragVel))
      L.flung = true
    }
  }

  /* Per-column pointer + focus handling. */
  const colProps = (i: number) => ({
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && lanes.current[i]) lanes.current[i].hover = true
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && lanes.current[i]) lanes.current[i].hover = false
    },
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const L = lanes.current[i]
      if (!L || e.button !== 0) return
      if (e.pointerType === "touch") {
        L.hold = true // press-and-hold pauses; vertical swipes still scroll the page
        return
      }
      L.drag = true
      L.moved = 0
      L.lastY = e.clientY
      L.lastT = e.timeStamp
      L.dragVel = 0
      L.pointerId = e.pointerId
      L.flung = false
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const L = lanes.current[i]
      if (!L || !L.drag || e.pointerId !== L.pointerId) return
      const dy = e.clientY - L.lastY
      if (L.moved < 4 && Math.abs(dy) + L.moved >= 4) {
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.setAttribute("data-dragging", "")
      }
      L.moved += Math.abs(dy)
      const dt = Math.max(e.timeStamp - L.lastT, 1) / 1000
      L.dragVel = L.dragVel * 0.6 + (dy / dt) * 0.4
      L.lastY = e.clientY
      L.lastT = e.timeStamp
      if (L.moved >= 4) {
        L.pos += dy
        wake.current()
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => release(i, e),
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => release(i, e),
    onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
      const L = lanes.current[i]
      const root = rootRef.current
      if (!L || !root) return
      L.focus = true
      L.vel = 0
      // nudge the focused card out of the faded edge
      const wr = root.getBoundingClientRect()
      const tr = (e.target as HTMLElement).getBoundingClientRect()
      const edge = Math.min(96, wr.height / 4)
      if (tr.top < wr.top + edge) L.pos += wr.top + edge - tr.top
      else if (tr.bottom > wr.bottom - edge) L.pos -= tr.bottom - (wr.bottom - edge)
    },
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      const L = lanes.current[i]
      if (L && !e.currentTarget.contains(e.relatedTarget as Node | null)) L.focus = false
    },
    onClickCapture: (e: React.MouseEvent) => {
      const L = lanes.current[i]
      if (L && L.moved >= 4) {
        e.preventDefault()
        e.stopPropagation()
        L.moved = 0
      }
    },
  })

  // Deal the quotes out to the columns round-robin.
  const lists: Testimonial[][] = Array.from({ length: cols }, () => [])
  items.forEach((it, i) => lists[i % cols].push(it))

  const style = {
    "--tm-n": reduced ? columns : cols,
    ...(height !== undefined ? { "--tm-height": typeof height === "number" ? `${height}px` : height } : null),
  } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={["tm", className].filter(Boolean).join(" ")}
      role="region"
      aria-label={label}
      data-static={reduced || undefined}
      style={{ ...style, containerName: "tm", containerType: "inline-size" }}
    >
      <style href="tm" precedence="default">
        {CSS}
      </style>
      {reduced ? (
        <ul className="tm__flat">
          {items.map((it, i) => (
            <li key={i} className="tm__item">
              <Card item={it} hidden={false} />
            </li>
          ))}
        </ul>
      ) : (
        lists.map((list, ci) => (
          <div key={ci} className="tm__col" {...colProps(ci)}>
            <div className="tm__track">
              {Array.from({ length: copies }, (_, c) => (
                <ul key={c} className="tm__set" aria-hidden={c > 0 || undefined}>
                  {list.map((it, i) => (
                    <li key={i} className="tm__item">
                      <Card item={it} hidden={c > 0} />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default TestimonialWall

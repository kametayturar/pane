"use client"

import * as React from "react"

/**
 * BlurCrossfade – swaps content with a soft blur while the box glides to the new size.
 * Change `contentKey` and the old content blurs out as the new content blurs in.
 *
 *   <BlurCrossfade contentKey={step}>{steps[step]}</BlurCrossfade>
 */

export type BlurCrossfadeProps = {
  /** Identity of the current content. When it changes, the content swaps. */
  contentKey: React.Key
  children?: React.ReactNode
  /** Which dimension glides to the new content's size. Default "height". */
  animate?: "height" | "width" | "both" | "none"
  /** Motion speed multiplier – 1 is the designed pace. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) – used for the focus ring only. */
  accent?: string
  className?: string
  style?: React.CSSProperties
}

type Leaving = { id: number; node: React.ReactNode }
type Cur = { key: React.Key; node: React.ReactNode; seq: number }

const CSS = `
.bx {
  --bx-accent: #0060e2;
  --bx-ease: cubic-bezier(.22, 1, .36, 1);
  --bx-speed: 1;
  position: relative; display: block; max-width: 100%;
  overflow: clip; overflow-clip-margin: 14px;
}
:is(.dark, [data-theme="dark"]) .bx { --bx-accent: #4d8dff }
.bx *, .bx *::before, .bx *::after { box-sizing: border-box }
.bx :focus-visible { outline: 2px solid color-mix(in oklab, var(--bx-accent) 60%, transparent); outline-offset: 1px }

/* The measured wrapper. Its natural size is copied to the outer box, which transitions between pixel values. */
.bx[data-ready] { transition: height calc(.56s / var(--bx-speed)) var(--bx-ease), width calc(.56s / var(--bx-speed)) var(--bx-ease) }
.bx-measure { display: flow-root }
.bx[data-axis="width"] .bx-measure, .bx[data-axis="both"] .bx-measure { width: max-content; max-width: 100% }

.bx-in { animation: bx-in calc(.46s / var(--bx-speed)) calc(.1s / var(--bx-speed)) var(--bx-ease) backwards }
.bx-out {
  position: absolute; top: 0; left: 0; width: 100%; pointer-events: none; user-select: none;
  animation: bx-out calc(.3s / var(--bx-speed)) var(--bx-ease) forwards;
}
.bx[data-axis="width"] .bx-out, .bx[data-axis="both"] .bx-out { width: max-content }
@keyframes bx-in { from { opacity: 0; filter: blur(7px); transform: scale(.985) } }
@keyframes bx-out { to { opacity: 0; filter: blur(7px); transform: scale(.985) } }

.bx[data-paused], .bx[data-paused] *, .bx[data-paused] *::before, .bx[data-paused] *::after { animation-play-state: paused !important }
.bx[data-paused][data-ready] { transition-duration: 0s }

@media (prefers-reduced-motion: reduce) {
  .bx, .bx *, .bx *::before, .bx *::after { animation: none !important; transition: none !important }
  .bx-out { display: none }
}
`

function usePrefersReducedMotion() {
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

export function BlurCrossfade({
  contentKey,
  children,
  animate = "height",
  speed = 1,
  paused,
  accent,
  className,
  style,
}: BlurCrossfadeProps) {
  const reduced = usePrefersReducedMotion()
  const measure = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null)
  const [cur, setCur] = React.useState<Cur>({ key: contentKey, node: children, seq: 0 })
  const [leaving, setLeaving] = React.useState<Leaving[]>([])

  // Adjust state during render: remember the outgoing content when the key changes.
  if (cur.key !== contentKey) {
    if (!reduced && animate !== "none") {
      setLeaving((l) => [...l.slice(-2), { id: cur.seq, node: cur.node }])
    }
    setCur({ key: contentKey, node: children, seq: cur.seq + 1 })
  } else if (cur.node !== children) {
    setCur({ ...cur, node: children })
  }

  React.useLayoutEffect(() => {
    const el = measure.current
    if (!el) return
    const read = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const axis = animate === "none" ? "none" : animate
  const boxStyle: React.CSSProperties = { ...style, "--bx-speed": speed } as React.CSSProperties
  if (accent) (boxStyle as Record<string, unknown>)["--bx-accent"] = accent
  if (size && axis !== "none") {
    if (axis === "height" || axis === "both") boxStyle.height = size.h
    if (axis === "width" || axis === "both") boxStyle.width = size.w
  }

  return (
    <div
      className={["bx", className].filter(Boolean).join(" ")}
      style={boxStyle}
      data-axis={axis}
      data-ready={size && axis !== "none" ? "" : undefined}
      data-paused={paused || undefined}
    >
      <style href="blur-crossfade" precedence="default">
        {CSS}
      </style>
      {leaving.map((l) => (
        <div
          key={`out-${l.id}`}
          className="bx-out"
          aria-hidden
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setLeaving((all) => all.filter((x) => x.id !== l.id))
          }}
        >
          {l.node}
        </div>
      ))}
      <div ref={measure} className="bx-measure">
        <div key={cur.seq} className={cur.seq > 0 && !reduced && animate !== "none" ? "bx-in" : undefined}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default BlurCrossfade

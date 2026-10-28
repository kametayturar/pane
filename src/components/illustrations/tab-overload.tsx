"use client"

import * as React from "react"

/**
 * TabOverload – three overlapping browser windows full of placeholder content. The
 * highlight (traffic-light dots, gradient outline, colour glow) follows the hovered
 * window, and steps through them on its own when nobody is hovering.
 *
 *   <TabOverload accent="#7c8cff" />
 */

export type TabOverloadProps = {
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for the highlight outline and glow. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  /** Time each window stays highlighted while idle, in ms (before speed is applied). Default 1800. */
  dwellMs?: number
  className?: string
}

type Win = { x: number; y: number; w: number }

// Windows are 380 × 300 and cascade from back to front; the right and bottom edges fall outside the viewBox on purpose.
const WINDOWS: Win[] = [
  { x: 30, y: 68, w: 125 },
  { x: 125, y: 56, w: 220 },
  { x: 220, y: 44, w: 360 },
]

/** Placeholder page content, a different layout in each window. */
function Content({ index }: { index: number }) {
  if (index === 0)
    return (
      <>
        <rect className="to-bar" x="12" y="36" width="30" height="30" rx="4" />
        <rect className="to-bar" x="52" y="38" width="100" height="6" rx="2" />
        <rect className="to-bar" x="52" y="46" width="100" height="6" rx="2" />
        <rect className="to-bar" x="52" y="54" width="35" height="6" rx="2" />
        <rect className="to-bar" x="12" y="72" width="140" height="6" rx="2" />
        <rect className="to-bar" x="12" y="80" width="140" height="6" rx="2" />
        <rect className="to-bar" x="12" y="88" width="55" height="6" rx="2" />
      </>
    )
  if (index === 1)
    return (
      <>
        <rect className="to-bar" x="12" y="36" width="150" height="8" rx="2" />
        <rect className="to-bar" x="12" y="52" width="70" height="30" rx="4" />
        <rect className="to-bar" x="90" y="52" width="70" height="30" rx="4" />
        <rect className="to-bar" x="12" y="90" width="150" height="6" rx="2" />
        <rect className="to-bar" x="12" y="98" width="110" height="6" rx="2" />
      </>
    )
  return (
    <>
      <rect className="to-bar" x="12" y="36" width="30" height="30" rx="15" />
      <rect className="to-bar" x="52" y="40" width="90" height="7" rx="2" />
      <rect className="to-bar" x="52" y="52" width="60" height="6" rx="2" />
      <rect className="to-bar" x="12" y="76" width="160" height="6" rx="2" />
      <rect className="to-bar" x="12" y="84" width="160" height="6" rx="2" />
      <rect className="to-bar" x="12" y="92" width="96" height="6" rx="2" />
    </>
  )
}

const CSS = `
.to {
  --to-ink: #000;
  --to-accent: #8b9bff;
  --to-speed: 1;
  --to-frame: #f4f5f7; --to-frame-line: #e4e7ec; --to-dot: #ccc; --to-page: #fff; --to-page-line: #e4e7ec;
  --to-bar-a: #eff1f4; --to-bar-b: #dde1e5;
  position: relative; width: 100%; max-width: 560px; aspect-ratio: 3 / 2; overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, #000 70%, transparent 100%), linear-gradient(#000 70%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to right, #000 70%, transparent 100%), linear-gradient(#000 70%, transparent 100%);
  mask-composite: intersect;
}
:is(.dark, [data-theme="dark"]) .to {
  --to-ink: #fff;
  --to-frame: #1b1b1d; --to-frame-line: rgb(255 255 255 / .1); --to-dot: #3a3a3f; --to-page: #232326; --to-page-line: rgb(255 255 255 / .08);
  --to-bar-a: #2e2e32; --to-bar-b: #3a3a3f;
}
.to *, .to *::before, .to *::after { box-sizing: border-box; }
.to-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }

.to-frame { fill: var(--to-frame); stroke: var(--to-frame-line); stroke-width: .7; }
.to-dot { fill: var(--to-dot); }
.to-page { fill: var(--to-page); stroke: var(--to-page-line); stroke-width: .7; }
.to-bar { fill: var(--to-bar-a); animation: to-shimmer calc(2.4s / var(--to-speed)) ease-in-out infinite; }
@keyframes to-shimmer { 0%, 100% { fill: var(--to-bar-a) } 50% { fill: var(--to-bar-b) } }

/* Everything that belongs to the highlight fades in on the active window and out on the others. */
.to-blobs, .to-front { opacity: 0; pointer-events: none; transition: opacity calc(.3s / var(--to-speed)); }
.to-content { opacity: .2; pointer-events: none; transition: opacity calc(.3s / var(--to-speed)); }
.to-blobs[data-on], .to-front[data-on], .to-content[data-on] { opacity: 1; }
.to-tab { cursor: default; }

.to-h0 { stop-color: #ffb89e; } .to-h1 { stop-color: #c8a8e5; } .to-h2 { stop-color: color-mix(in oklab, var(--to-accent) 80%, #a8b5ff); }
.to-v0 { stop-color: #ff6b5c; } .to-v1 { stop-color: #ffb89e; }
.to-s0 { stop-color: var(--to-accent); } .to-s1 { stop-color: #d5bbef; } .to-s2 { stop-color: #ffc5ab; } .to-s3 { stop-color: #ffb5bc; }
.to-d0 { fill: #ff6b5c; } .to-d1 { fill: #ffb89e; } .to-d2 { fill: var(--to-accent); }

.to[data-paused] *, .to[data-paused] *::before, .to[data-paused] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .to *, .to *::before, .to *::after { animation: none !important; transition: none !important; }
}
`

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

export function TabOverload({
  speed = 1,
  paused,
  accent,
  label = "Three overlapping browser windows full of placeholder content",
  dwellMs = 1800,
  className,
}: TabOverloadProps) {
  const uid = React.useId().replace(/:/g, "")
  const reduced = useReducedMotion()
  const [hover, setHover] = React.useState<number | null>(null)
  const [auto, setAuto] = React.useState(WINDOWS.length - 1)
  const speedRef = React.useRef(speed)
  React.useEffect(() => {
    speedRef.current = speed
  })

  // Idle: step the highlight 0 → 1 → 2 → 0 … Each step re-runs the effect, which schedules the next one.
  const idle = !paused && !reduced && hover === null
  React.useEffect(() => {
    if (!idle) return
    const t = window.setTimeout(() => setAuto((a) => (a + 1) % WINDOWS.length), dwellMs / Math.max(0.1, speedRef.current))
    return () => window.clearTimeout(t)
  }, [idle, auto, dwellMs])

  const active = hover ?? auto
  const vars = {
    "--to-speed": Math.max(0.1, speed),
    ...(accent ? { "--to-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div className={className ? `to ${className}` : "to"} role="img" aria-label={label} data-paused={paused || undefined} style={vars}>
      <style href="tab-overload" precedence="default">
        {CSS}
      </style>
      <svg className="to-art" viewBox="0 0 360 240" aria-hidden="true" onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`${uid}-bh`} x1="0" y1="0" x2="1" y2="0">
            <stop className="to-h0" offset="0" stopOpacity=".3" />
            <stop className="to-h1" offset=".5" stopOpacity=".3" />
            <stop className="to-h2" offset="1" stopOpacity=".3" />
          </linearGradient>
          <linearGradient id={`${uid}-bv`} x1="0" y1="1" x2="0" y2="0">
            <stop className="to-v0" offset="0" stopOpacity=".3" />
            <stop className="to-v1" offset="1" stopOpacity=".3" />
          </linearGradient>
          <filter id={`${uid}-blur`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <linearGradient id={`${uid}-stroke`} x1="1" y1="0" x2="0" y2="1">
            <stop className="to-s0" offset="0" />
            <stop className="to-s1" offset=".4" />
            <stop className="to-s2" offset=".75" />
            <stop className="to-s3" offset="1" />
          </linearGradient>
        </defs>

        {WINDOWS.map((win, i) => (
          <g key={i}>
            <g className="to-blobs" data-on={active === i || undefined}>
              <ellipse cx={win.x + 70} cy={win.y + 8} rx="90" ry="14" fill={`url(#${uid}-bh)`} filter={`url(#${uid}-blur)`} />
              <ellipse cx={win.x + 8} cy={win.y + 96} rx="14" ry="90" fill={`url(#${uid}-bv)`} filter={`url(#${uid}-blur)`} />
            </g>
            <g transform={`translate(${win.x} ${win.y})`} className="to-tab" onPointerOver={() => setHover(i)}>
              <rect className="to-frame" width="380" height="300" rx="6" />
              {[14, 24, 34].map((cx) => (
                <circle key={cx} className="to-dot" cx={cx} cy="14" r="3" />
              ))}
              <rect className="to-page" x="4" y="24" width="372" height="272" rx="5" />
            </g>
            <g transform={`translate(${win.x} ${win.y})`} className="to-content" data-on={active === i || undefined}>
              <Content index={i} />
            </g>
          </g>
        ))}

        {WINDOWS.map((win, i) => (
          <g key={i} className="to-front" data-on={active === i || undefined}>
            {[0, 10, 20].map((dx, k) => (
              <circle key={k} className={`to-d${k}`} cx={win.x + 14 + dx} cy={win.y + 14} r="3" />
            ))}
            <path
              d={`M ${win.x} 240 L ${win.x} ${win.y + 6} A 6 6 0 0 1 ${win.x + 6} ${win.y} L ${win.w} ${win.y}`}
              fill="none"
              stroke={`url(#${uid}-stroke)`}
              strokeWidth=".8"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

"use client"

import * as React from "react"

/**
 * EmptyCalendar – a stack of calendar cards marked "empty" that fan out on hover
 * (and every few seconds on their own, so it stays alive in a gallery).
 *
 *   <EmptyCalendar accent="#7c8cff" />
 */

export type EmptyCalendarProps = {
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for the soft glow under the cards. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  /** Card heading. */
  title?: string
  /** Text on the small badge. */
  badge?: string
  /** Text on the disabled button. */
  action?: string
  className?: string
}

const CSS = `
.ec {
  --ec-ink: #000;
  --ec-accent: #8b9bff;
  --ec-speed: 1;
  --ec-card: #fff;
  --ec-card-line: #e4e7ec;
  --ec-title: #8a8a8a;
  --ec-badge: #fef8ef;
  --ec-badge-ink: #fab082;
  --ec-bar-a: #eff1f4;
  --ec-bar-b: #dde1e5;
  --ec-btn: #f4f4f6;
  --ec-btn-ink: #9a9aa3;
  --ec-shadow: .06;
  --ec-edge: #e4e7ec;
  --ec-ease: cubic-bezier(.22, .61, .36, 1);
  position: relative; width: 100%; max-width: 560px; aspect-ratio: 3 / 2; overflow: hidden;
  font-family: var(--ec-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ec {
  --ec-ink: #fff;
  --ec-card: #232326; --ec-card-line: rgb(255 255 255 / .08); --ec-title: #8f8f8f;
  --ec-badge: rgb(250 176 130 / .16); --ec-bar-a: #2a2a2d; --ec-bar-b: #36363b;
  --ec-btn: #2a2a2d; --ec-btn-ink: #6b6b70; --ec-shadow: .4; --ec-edge: #3a3a3f;
}
.ec *, .ec *::before, .ec *::after { box-sizing: border-box; }
.ec-art { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }

.ec-card { fill: var(--ec-card); stroke: var(--ec-card-line); stroke-width: .5; }
.ec-drop { flood-opacity: var(--ec-shadow); }
.ec-title { fill: var(--ec-title); font-size: 13px; font-weight: 500; }
.ec-badge { fill: var(--ec-badge); }
.ec-badge-text { fill: var(--ec-badge-ink); font-size: 9px; font-weight: 600; letter-spacing: .06em; text-anchor: middle; }
.ec-bar { fill: var(--ec-bar-a); animation: ec-shimmer calc(2.4s / var(--ec-speed)) ease-in-out infinite; }
.ec-btn { fill: var(--ec-btn); stroke: var(--ec-card-line); stroke-width: .5; }
.ec-btn-ink { fill: none; stroke: var(--ec-btn-ink); stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.ec-btn-label { fill: var(--ec-btn-ink); font-size: 10px; font-weight: 500; }
.ec-glow-a { stop-color: color-mix(in oklab, var(--ec-accent) 55%, #ffa0ab); }
.ec-glow-b { stop-color: color-mix(in oklab, var(--ec-accent) 60%, #ffb89e); }
.ec-glow-c { stop-color: color-mix(in oklab, var(--ec-accent) 80%, #c8a8e5); }
.ec-glow-d { stop-color: var(--ec-accent); }
.ec-edge { stop-color: var(--ec-edge); }

.ec-blob { transform-origin: 160px 152px; animation: ec-breathe calc(5s / var(--ec-speed)) ease-in-out infinite; }
@keyframes ec-shimmer { 0%, 100% { fill: var(--ec-bar-a) } 50% { fill: var(--ec-bar-b) } }
@keyframes ec-breathe { 0%, 100% { opacity: .85; transform: scale(1) } 50% { opacity: 1; transform: scale(1.06) } }

/* Resting stack: two cards tucked behind, tilted a few degrees. Fanned: they slide out and tilt more. */
.ec-front, .ec-back { transition: transform calc(.35s / var(--ec-speed)) var(--ec-ease); }
.ec-front { transform-origin: 160px 90px; }
.ec-back { transform-box: fill-box; transform-origin: center center; }
.ec-back-left { transform: translate(-22px, 0) rotate(-3deg); }
.ec-back-right { transform: translate(22px, 0) rotate(3deg); }
.ec[data-fan] .ec-front { transform: translate(0, -8px) rotate(2deg); }
.ec[data-fan] .ec-back-left { transform: translate(-48px, 4px) rotate(-7deg); }
.ec[data-fan] .ec-back-right { transform: translate(48px, 4px) rotate(7deg); }

.ec[data-paused] *, .ec[data-paused] *::before, .ec[data-paused] *::after { animation-play-state: paused !important; }
@media (prefers-reduced-motion: reduce) {
  .ec *, .ec *::before, .ec *::after { animation: none !important; transition: none !important; }
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

/** Toggles `open` on a timer: closed for `closedMs`, open for `openMs` (both divided by speed). */
function useIdleToggle(opts: { enabled: boolean; speedRef: React.RefObject<number>; closedMs: number; openMs: number }) {
  const { enabled, speedRef, closedMs, openMs } = opts
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(() => setOpen((o) => !o), (open ? openMs : closedMs) / Math.max(0.1, speedRef.current))
    return () => window.clearTimeout(t)
  }, [enabled, open, openMs, closedMs, speedRef])
  return open
}

const CARDS = ["back-left", "back-right", "front"] as const

export function EmptyCalendar({
  speed = 1,
  paused,
  accent,
  label = "Stacked calendar cards marked empty, with a disabled join button",
  title = "This week",
  badge = "EMPTY",
  action = "Join call",
  className,
}: EmptyCalendarProps) {
  const uid = React.useId().replace(/:/g, "")
  const reduced = useReducedMotion()
  const [hovered, setHovered] = React.useState(false)
  const speedRef = React.useRef(speed)
  React.useEffect(() => {
    speedRef.current = speed
  })
  const auto = useIdleToggle({ enabled: !paused && !reduced && !hovered, speedRef, closedMs: 2600, openMs: 1900 })
  const fan = hovered || auto

  const vars = {
    "--ec-speed": Math.max(0.1, speed),
    ...(accent ? { "--ec-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div
      className={className ? `ec ${className}` : "ec"}
      role="img"
      aria-label={label}
      data-fan={fan || undefined}
      data-paused={paused || undefined}
      style={vars}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <style href="empty-calendar" precedence="default">
        {CSS}
      </style>
      <svg className="ec-art" viewBox="0 0 320 240" aria-hidden="true">
        <defs>
          <filter id={`${uid}-blur`} x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow className="ec-drop" dx="0" dy="3" stdDeviation="4" floodColor="#000" />
          </filter>
          <linearGradient id={`${uid}-glow`} x1="0" y1="0" x2="1" y2="0">
            <stop className="ec-glow-a" offset="0" stopOpacity=".28" />
            <stop className="ec-glow-b" offset=".33" stopOpacity=".28" />
            <stop className="ec-glow-c" offset=".66" stopOpacity=".28" />
            <stop className="ec-glow-d" offset="1" stopOpacity=".28" />
          </linearGradient>
        </defs>
        <g transform="translate(30 47) scale(.814)">
          {CARDS.map((id) => (
            <g key={id} className={id === "front" ? "ec-front" : `ec-back ec-${id}`}>
              {id === "front" && (
                <ellipse className="ec-blob" cx="160" cy="152" rx="125" ry="35" fill={`url(#${uid}-glow)`} filter={`url(#${uid}-blur)`} />
              )}
              <rect className="ec-card" x="40" y="20" width="240" height="140" rx="10" filter={`url(#${uid}-shadow)`} />
              <text className="ec-title" x="56" y="48">
                {title}
              </text>
              <g transform="translate(218 34)">
                <rect className="ec-badge" width="46" height="18" rx="5" />
                <text className="ec-badge-text" x="23" y="12.5">
                  {badge}
                </text>
              </g>
              <rect className="ec-bar" x="56" y="64" width="208" height="7" rx="2" />
              <rect className="ec-bar" x="56" y="74" width="208" height="7" rx="2" />
              <rect className="ec-bar" x="56" y="84" width="168" height="7" rx="2" />
              <g transform="translate(56 104)">
                <rect className="ec-btn" width="208" height="40" rx="8" />
                <g className="ec-btn-ink" transform="translate(62 14)">
                  <circle cx="6" cy="6" r="5" />
                  <line x1="2.5" y1="9.5" x2="9.5" y2="2.5" />
                </g>
                <text className="ec-btn-label" x="82" y="24">
                  {action}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

"use client"

import * as React from "react"
import { BarChart3, Calendar, CreditCard, FileText, Mail, MessageSquare, Ticket } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LogoClusterItem = {
  /** Name, used as the tile's tooltip. */
  name: string
  /** The logo or glyph shown in the white bubble (an svg, <img> or emoji). Colour it with `color`. */
  icon: React.ReactNode
  /** Bubble diameter in stage units (the stage is 320 wide). Defaults follow a hand-tuned layout. */
  size?: number
  /** Colour of the glyph. Defaults to ink. */
  color?: string
}

export type LogoClusterProps = {
  /** Your mark, shown on the white disc in the middle. Defaults to a small neutral glyph. */
  mark?: React.ReactNode
  /** Logos that bounce out of the disc and settle around it. Defaults to seven soft-coloured app glyphs. */
  items?: LogoClusterItem[]
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) used for the mark on the disc. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const ic = { size: 24, strokeWidth: 1.9, "aria-hidden": true } as const
const DEFAULT_ITEMS: LogoClusterItem[] = [
  { name: "Calendar", icon: <Calendar {...ic} />, color: "#3b82f6" },
  { name: "Chat", icon: <MessageSquare {...ic} />, color: "#22a45d" },
  { name: "Billing", icon: <CreditCard {...ic} />, color: "#6d5ef5" },
  { name: "Docs", icon: <FileText {...ic} />, color: "#2f8ae6" },
  { name: "Analytics", icon: <BarChart3 {...ic} />, color: "#8b5cf6" },
  { name: "Tickets", icon: <Ticket {...ic} />, color: "#e8a317" },
  { name: "Mail", icon: <Mail {...ic} />, color: "#ef5a3c" },
]

const DEFAULT_MARK = (
  <svg viewBox="0 0 30 30" fill="none" aria-hidden>
    <circle cx="15" cy="15" r="3.2" fill="currentColor" />
    <circle cx="15" cy="15" r="8.2" stroke="currentColor" strokeWidth="1.8" opacity=".55" />
    <circle cx="15" cy="15" r="13" stroke="currentColor" strokeWidth="1.8" opacity=".22" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

/** Hand-tuned spots on a 320-unit stage: [x, y, diameter], measured from the centre. */
const SPOTS: [number, number, number][] = [
  [-29, -97, 56],
  [82, -67, 48],
  [96, -14, 72],
  [53, 86, 60],
  [-63, 70, 42],
  [-88, 64, 20],
  [-93, -1, 72],
]

/** Spot i of n: the table for the first seven, then a ring just outside it. */
function spot(i: number, n: number): [number, number, number] {
  if (i < SPOTS.length) return SPOTS[i]
  const a = -Math.PI / 2 + ((i - SPOTS.length + 0.5) / Math.max(1, n - SPOTS.length)) * Math.PI * 2
  return [Math.round(Math.cos(a) * 138), Math.round(Math.sin(a) * 138), 36]
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lc {
  --lc-ink: #171717;
  --lc-face: #fff;
  --lc-disc: #fff;
  --lc-ring: rgb(0 0 0 / .06);
  --lc-shadow: 0 1px 2px rgb(0 0 0 / .05), 0 8px 20px -8px rgb(0 0 0 / .12);
  --lc-shadow-hover: 0 2px 4px rgb(0 0 0 / .06), 0 14px 28px -10px rgb(0 0 0 / .18);
  --lc-ease: cubic-bezier(.34, 1.56, .64, 1);
  --lc-speed: 1;
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1 / 1;
  font-family: var(--lc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lc {
  --lc-ink: #ededed;
  --lc-face: #232326;
  --lc-disc: #2a2a2e;
  --lc-ring: rgb(255 255 255 / .08);
  --lc-shadow: 0 1px 2px rgb(0 0 0 / .4), 0 8px 20px -8px rgb(0 0 0 / .6);
  --lc-shadow-hover: 0 2px 4px rgb(0 0 0 / .45), 0 14px 28px -10px rgb(0 0 0 / .7);
}
.lc *, .lc *::before, .lc *::after { box-sizing: border-box }
.lc-frame { --u: calc(100cqw / 320); position: relative; width: 100%; height: 100% }

/* The disc in the middle: pops in first */
.lc-disc {
  position: absolute; left: 50%; top: 50%; z-index: 1; display: grid; place-items: center; width: calc(132 * var(--u)); height: calc(132 * var(--u));
  translate: -50% -50%; border-radius: 50%; background: var(--lc-disc); color: var(--lc-mark, var(--lc-ink));
  box-shadow: 0 0 0 1px var(--lc-ring), var(--lc-shadow);
  animation: lc-disc calc(.42s / var(--lc-speed)) var(--lc-ease) backwards;
}
.lc-disc > svg, .lc-disc > img { display: block; width: 34%; height: auto }

/* The orbit turns slowly; each bubble turns back so its logo stays upright */
.lc-orbit { position: absolute; inset: 0; animation: lc-spin calc(48s / var(--lc-speed)) linear calc(.8s / var(--lc-speed)) infinite }
.lc-bubble {
  position: absolute; left: 50%; top: 50%; width: calc(var(--s) * var(--u)); height: calc(var(--s) * var(--u));
  margin: calc(var(--s) * var(--u) / -2) 0 0 calc(var(--s) * var(--u) / -2);
  translate: calc(var(--x) * var(--u)) calc(var(--y) * var(--u));
  animation: lc-out calc(.52s / var(--lc-speed)) var(--lc-ease) calc((.18s + var(--i) * .045s) / var(--lc-speed)) backwards;
}
.lc-face {
  display: grid; place-items: center; width: 100%; height: 100%; border-radius: 50%; background: var(--lc-face); color: var(--c, var(--lc-ink));
  box-shadow: 0 0 0 1px var(--lc-ring), var(--lc-shadow);
  animation: lc-spin calc(48s / var(--lc-speed)) linear calc(.8s / var(--lc-speed)) infinite reverse;
  transition: scale .26s var(--lc-ease), box-shadow .26s;
}
.lc-face > svg, .lc-face > img { display: block; width: 50%; height: 50% }
@media (hover: hover) { .lc-face:hover { scale: 1.12; box-shadow: 0 0 0 1px var(--lc-ring), var(--lc-shadow-hover) } }

@keyframes lc-disc { from { opacity: 0; scale: .6 } }
@keyframes lc-out { 0% { opacity: 0; translate: 0 0; scale: .3 } 25% { opacity: 1 } }
@keyframes lc-spin { to { rotate: 360deg } }

.lc[data-paused] *, .lc[data-paused] *::before, .lc[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .lc *, .lc *::before, .lc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * LogoCluster – your mark on a white disc; the logos you work with bounce out of it
 * and settle around it, then drift in a slow orbit.
 *
 *   <LogoCluster mark={<MyLogo />} items={[{ name: "Mail", icon: <MailLogo /> }, …]} />
 */
export function LogoCluster({
  mark = DEFAULT_MARK,
  items = DEFAULT_ITEMS,
  speed = 1,
  paused,
  accent,
  label = "A product mark with the apps it connects to bouncing out of it",
  className,
}: LogoClusterProps) {
  const style = {
    "--lc-speed": Math.max(0.05, speed),
    ...(accent ? { "--lc-mark": accent } : null),
  } as React.CSSProperties

  return (
    <div className={className ? `lc ${className}` : "lc"} role="img" aria-label={label} data-paused={paused || undefined} style={style}>
      <style href="pane-logo-cluster" precedence="default">
        {CSS}
      </style>
      <div className="lc-frame" aria-hidden>
        <div className="lc-disc">{mark}</div>
        <div className="lc-orbit">
          {items.map((item, i) => {
            const [x, y, s] = spot(i, items.length)
            const bubble = { "--x": x, "--y": y, "--s": item.size ?? s, "--i": i, ...(item.color ? { "--c": item.color } : null) } as React.CSSProperties
            return (
              <div key={i} className="lc-bubble" style={bubble}>
                <div className="lc-face" title={item.name}>
                  {item.icon}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

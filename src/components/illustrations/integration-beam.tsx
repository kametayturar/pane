"use client"

import * as React from "react"
import { Calendar, Database, FileText, Mail, MessageSquare, Ticket } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type IntegrationBeamTool = {
  /** Name shown in the tooltip and read by screen readers. */
  name: string
  /** The tool's logo or glyph (an svg, <img> or emoji). It fills a 28-unit box; colour it with `color`. */
  icon: React.ReactNode
  /** Colour of the glyph. Defaults to ink. */
  color?: string
}

export type IntegrationBeamProps = {
  /** Tools that send data in – on the left. Up to four look good. */
  left?: IntegrationBeamTool[]
  /** Tools that receive data – on the right. */
  right?: IntegrationBeamTool[]
  /** Your product, on the dark tile in the middle. The icon is drawn white; a neutral flower mark when left out. */
  center?: { name: string; icon?: React.ReactNode }
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame (hovering and pausing a tool still work). */
  paused?: boolean
  /** Accent colour (any CSS colour) for the pulses, the hub glow and the focused beam. */
  accent?: string
  /** Accessible name of the scene. */
  label?: string
  className?: string
}

const ic = { size: 28, strokeWidth: 1.8, "aria-hidden": true } as const
const DEFAULT_LEFT: IntegrationBeamTool[] = [
  { name: "Mail", icon: <Mail {...ic} />, color: "#ef5a3c" },
  { name: "Chat", icon: <MessageSquare {...ic} />, color: "#22a45d" },
  { name: "Docs", icon: <FileText {...ic} />, color: "#2f8ae6" },
]
const DEFAULT_RIGHT: IntegrationBeamTool[] = [
  { name: "Tickets", icon: <Ticket {...ic} />, color: "#e8a317" },
  { name: "Calendar", icon: <Calendar {...ic} />, color: "#8b5cf6" },
  { name: "Warehouse", icon: <Database {...ic} />, color: "#14a8a0" },
]

/** A neutral four-petal mark for the product tile. */
const DEFAULT_MARK = (
  <svg viewBox="0 0 36 36" aria-hidden>
    <g fill="currentColor">
      <ellipse cx="18" cy="18" rx="4.6" ry="14" />
      <ellipse cx="18" cy="18" rx="4.6" ry="14" transform="rotate(90 18 18)" />
      <ellipse cx="18" cy="18" rx="4.2" ry="12" opacity=".42" transform="rotate(45 18 18)" />
      <ellipse cx="18" cy="18" rx="4.2" ry="12" opacity=".42" transform="rotate(135 18 18)" />
    </g>
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                   Timeline                                   */
/* -------------------------------------------------------------------------- */
/*
 * One sync cycle is 5.05s (all numbers measured on the public preview):
 *   the left tools send a pulse each, 280ms apart; a pulse travels 1.5s along its beam;
 *   as the first one lands the hub glows and the right tools send theirs, again 280ms apart;
 *   after the last one lands the scene rests for a moment, then the next wave leaves.
 */

const CYCLE = 5.05
const TRAVEL = 1.5
const STAGGER = 0.28
const RIGHT_AT = 1.48
const SYNC_FROM = 1.45
const SYNC_TO = 3.6
const DASH = 84
const START_CLOCK = 0.8

function bezier(x1: number, y1: number, x2: number, y2: number) {
  return (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let lo = 0
    let hi = 1
    let s = t
    for (let i = 0; i < 22; i++) {
      const x = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s
      if (x < t) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s
  }
}
const easePulse = bezier(0.4, 0, 0.2, 1)
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Glow on the hub when a pulse lands at time `a`: quick rise, slower fall. */
function flash(t: number, a: number) {
  if (t < a - 0.12) return 0
  if (t < a + 0.04) return (t - (a - 0.12)) / 0.16
  return Math.max(0, 1 - (t - (a + 0.04)) / 0.5) ** 1.6
}

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

const W = 620
const TOOL = 60
const GAP = 26
const HUB = 80

type Beam = { key: string; side: "in" | "out"; index: number; d: string }

function columnY(count: number, i: number, cy: number) {
  return cy + (i - (count - 1) / 2) * (TOOL + GAP)
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ib {
  --ib-ink: #000;
  --ib-accent: #0060e2;
  --ib-tile: #fff;
  --ib-tile-off: #f0f0f0;
  --ib-tile-shadow: 0 0 0 1px rgb(0 0 0 / .07), 0 1px 2px 0 rgb(0 0 0 / .04), 0 8px 18px -10px rgb(0 0 0 / .18);
  --ib-glyph: #171717;
  --ib-line: color-mix(in oklab, var(--ib-ink) 11%, transparent);
  --ib-line-on: color-mix(in oklab, var(--ib-accent) 45%, #fff);
  --ib-line-off: color-mix(in oklab, var(--ib-ink) 28%, transparent);
  --ib-hub: #171717;
  --ib-hub-shadow: 0 0 0 1px rgb(0 0 0 / .9), inset 0 1px 0 0 rgb(255 255 255 / .12), 0 14px 28px -12px rgb(0 0 0 / .38);
  --ib-chip: #fff;
  --ib-chip-text: color-mix(in oklab, var(--ib-ink) 75%, transparent);
  --ib-chip-shadow: 0 0 0 1px rgb(0 0 0 / .07), 0 1px 2px 0 rgb(0 0 0 / .04);
  --ib-tip: #171717;
  --ib-tip-text: #fff;
  --ib-tip-dim: rgb(255 255 255 / .55);
  --ib-ease: cubic-bezier(.22, 1, .36, 1);
  --ib-speed: 1;
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 680px;
  font-family: var(--ib-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .ib {
  --ib-ink: #fff;
  --ib-accent: #4d8dff;
  --ib-tile: #232326;
  --ib-tile-off: #1a1a1c;
  --ib-tile-shadow: 0 0 0 1px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 8px 18px -10px rgb(0 0 0 / .6);
  --ib-glyph: #ededed;
  --ib-line: color-mix(in oklab, var(--ib-ink) 14%, transparent);
  --ib-line-on: color-mix(in oklab, var(--ib-accent) 60%, #fff);
  --ib-line-off: color-mix(in oklab, var(--ib-ink) 32%, transparent);
  --ib-hub: #2b2b30;
  --ib-hub-shadow: 0 0 0 1px rgb(255 255 255 / .16), inset 0 1px 0 0 rgb(255 255 255 / .12), 0 14px 28px -12px rgb(0 0 0 / .7);
  --ib-chip: #232326;
  --ib-chip-text: color-mix(in oklab, var(--ib-ink) 80%, transparent);
  --ib-chip-shadow: 0 0 0 1px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ib-tip: #f4f4f5;
  --ib-tip-text: #111;
  --ib-tip-dim: rgb(0 0 0 / .5);
}
.ib *, .ib *::before, .ib *::after { box-sizing: border-box }
.ib button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }

.ib-frame { --u: calc(100cqw / ${W}); position: relative; width: 100% }
.ib-frame > .ib-sizer { display: block; width: 100%; height: 0; padding-top: calc(var(--h) / ${W} * 100%) }
.ib-beams, .ib-scene { position: absolute; inset: 0; width: 100%; height: 100% }
.ib-beams { overflow: visible; pointer-events: none }

/* Beams and pulses (SVG) */
.ib-line { fill: none; stroke: var(--ib-line); stroke-width: 1.5; stroke-linecap: round;
  transition: stroke .3s var(--ib-ease), opacity .3s var(--ib-ease) }
.ib-line.is-focus { stroke: var(--ib-line-on) }
.ib-line.is-off { stroke: var(--ib-line-off); stroke-dasharray: 3 5; opacity: .75 }
.ib[data-focus] .ib-line:not(.is-focus):not(.is-off) { opacity: .35 }
.ib-pulse { opacity: 0 }
.ib-glow, .ib-core { fill: none; stroke-linecap: round }
.ib-glow { stroke-width: 6; opacity: .45; transition: opacity .3s var(--ib-ease) }
.ib-core { stroke-width: 2 }
.ib-pulse.is-focus .ib-glow { opacity: .7 }
.ib[data-focus] .ib-pulse:not(.is-focus) .ib-glow { opacity: .25 }
.ib-stop-tail { stop-color: var(--ib-accent); stop-opacity: 0 }
.ib-stop-mid { stop-color: var(--ib-accent); stop-opacity: .9 }
.ib-stop-head { stop-color: color-mix(in oklab, var(--ib-accent) 30%, #fff); stop-opacity: 1 }

/* Tool tiles */
.ib-tool {
  position: absolute; width: calc(${TOOL} * var(--u)); height: calc(${TOOL} * var(--u)); border-radius: calc(18 * var(--u));
  display: grid; place-items: center; background: var(--ib-tile); box-shadow: var(--ib-tile-shadow);
  color: var(--ib-glyph); transition: background-color .3s var(--ib-ease), box-shadow .3s var(--ib-ease);
}
.ib-tool:focus-visible { outline: none }
.ib-ring {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; transition: opacity .3s var(--ib-ease);
  box-shadow: 0 0 0 calc(3 * var(--u)) color-mix(in oklab, var(--ib-accent) 20%, transparent), 0 0 calc(22 * var(--u)) calc(2 * var(--u)) color-mix(in oklab, var(--ib-accent) 26%, transparent);
}
.ib-tool:focus-visible .ib-ring { opacity: 1 }
.ib-logo { display: grid; place-items: center; width: calc(28 * var(--u)); height: calc(28 * var(--u)); color: var(--c, var(--ib-glyph));
  transition: transform .3s var(--ib-ease), filter .3s var(--ib-ease), opacity .3s var(--ib-ease) }
.ib-logo > svg, .ib-logo > img { display: block; width: 100%; height: 100%; object-fit: contain }
.ib-tool[data-on="true"][data-focus="true"] .ib-logo { transform: scale(1.08) }
.ib-tool[data-on="false"] { background: var(--ib-tile-off) }
.ib-tool[data-on="false"] .ib-logo { filter: grayscale(1); opacity: .6 }

.ib-tip {
  position: absolute; top: 50%; z-index: 3; padding: calc(5 * var(--u)) calc(9 * var(--u)); border-radius: calc(8 * var(--u));
  background: var(--ib-tip); color: var(--ib-tip-text); font-size: calc(12 * var(--u)); font-weight: 500; line-height: calc(16 * var(--u)); white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity .18s, transform .26s var(--ib-ease);
}
.ib-tip i { font-style: normal; color: var(--ib-tip-dim) }
.ib-tool[data-side="in"] .ib-tip { left: calc(70 * var(--u)); transform: translate(calc(-4 * var(--u)), -50%) }
.ib-tool[data-side="out"] .ib-tip { right: calc(70 * var(--u)); transform: translate(calc(4 * var(--u)), -50%) }
.ib-tool[data-focus="true"] .ib-tip { opacity: 1; transform: translate(0, -50%) }

/* The product tile */
.ib-hub {
  position: absolute; display: grid; place-items: center; width: calc(${HUB} * var(--u)); height: calc(${HUB} * var(--u)); border-radius: calc(24 * var(--u));
  background: var(--ib-hub); box-shadow: var(--ib-hub-shadow); color: #fff;
}
.ib-hub-ring {
  position: absolute; inset: calc(-1 * var(--u)); border-radius: inherit; pointer-events: none; opacity: var(--ring, 0);
  box-shadow: 0 0 0 calc(3 * var(--u)) color-mix(in oklab, var(--ib-accent) 20%, transparent), 0 0 calc(22 * var(--u)) calc(2 * var(--u)) color-mix(in oklab, var(--ib-accent) 26%, transparent);
}
.ib-mark { display: grid; place-items: center; width: calc(36 * var(--u)); height: calc(36 * var(--u)) }
.ib-mark > svg, .ib-mark > img { display: block; width: 100%; height: 100%; object-fit: contain }

/* Status chip under the product tile */
.ib-chip {
  position: absolute; height: calc(26 * var(--u)); overflow: hidden; border-radius: 999px; background: var(--ib-chip); box-shadow: var(--ib-chip-shadow);
  width: calc(var(--cw, 100) * var(--u)); transition: width .32s var(--ib-ease);
}
.ib-chip-in, .ib-measure { display: inline-flex; align-items: center; gap: calc(7 * var(--u)); height: 100%; padding: 0 calc(11 * var(--u)) 0 calc(10 * var(--u));
  font-size: calc(12 * var(--u)); font-weight: 500; line-height: 1; white-space: nowrap; color: var(--ib-chip-text) }
.ib-measure { position: absolute; left: 0; top: 0; height: calc(26 * var(--u)); visibility: hidden; pointer-events: none }
.ib-dot { width: calc(6 * var(--u)); height: calc(6 * var(--u)); border-radius: 50%; background: var(--ib-accent); flex: none; transition: box-shadow .3s }
.ib[data-sync] .ib-dot { box-shadow: 0 0 0 calc(3 * var(--u)) color-mix(in oklab, var(--ib-accent) 20%, transparent) }
.ib-status { display: block; animation: ib-in calc(.32s / var(--ib-speed)) var(--ib-ease) backwards }
@keyframes ib-in { from { opacity: 0; transform: translateY(calc(6 * var(--u))); filter: blur(2px) } }

.ib-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.ib[data-paused] .ib-status { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) {
  .ib *, .ib *::before, .ib *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * IntegrationBeam – your product tile in the middle, tools on both sides, light pulses flowing along curved beams.
 * Hover (or focus) a tool to bring its beam forward; click it to pause or reconnect it.
 *
 *   <IntegrationBeam center={{ name: "Nova" }} left={[{ name: "Mail", icon: <MailLogo /> }]} right={[…]} />
 */
export function IntegrationBeam({
  left = DEFAULT_LEFT,
  right = DEFAULT_RIGHT,
  center = { name: "Nova" },
  speed = 1,
  paused,
  accent,
  label,
  className,
}: IntegrationBeamProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const reduced = React.useSyncExternalStore(subscribeMotion, readMotion, () => false)

  const rows = Math.max(left.length, right.length, 3)
  const H = Math.max(244, 12 + rows * TOOL + (rows - 1) * GAP)
  const cy = H / 2 - 4 // the chip hangs below the hub, so the hub sits a touch above the middle

  const tools = React.useMemo(
    () => [
      ...left.map((t, i) => ({ ...t, key: `in${i}`, side: "in" as const, index: i, y: columnY(left.length, i, cy) })),
      ...right.map((t, i) => ({ ...t, key: `out${i}`, side: "out" as const, index: i, y: columnY(right.length, i, cy) })),
    ],
    [left, right, cy],
  )
  const beams: Beam[] = React.useMemo(
    () =>
      tools.map((t) => ({
        key: t.key,
        side: t.side,
        index: t.index,
        d:
          t.side === "in"
            ? `M${TOOL / 2} ${t.y} C170 ${t.y} 170 ${cy} ${W / 2} ${cy}`
            : `M${W / 2} ${cy} C450 ${cy} 450 ${t.y} ${W - TOOL / 2} ${t.y}`,
      })),
    [tools, cy],
  )

  // Which tools are paused, and which one is hovered / focused.
  const [off, setOff] = React.useState<ReadonlySet<string>>(() => new Set())
  const [focus, setFocus] = React.useState<string | null>(null)
  const [syncing, setSyncing] = React.useState(false)
  const [note, setNote] = React.useState("")
  const connected = tools.length - tools.filter((t) => off.has(t.key)).length
  const statusText = syncing ? "Syncing…" : `${connected} connected`

  const rootRef = React.useRef<HTMLDivElement>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const chipRef = React.useRef<HTMLDivElement>(null)
  const measureRef = React.useRef<HTMLSpanElement>(null)
  const pathRefs = React.useRef<Record<string, SVGPathElement | null>>({})
  const gradRefs = React.useRef<Record<string, SVGLinearGradientElement | null>>({})
  const pulseRefs = React.useRef<Record<string, SVGGElement | null>>({})
  const lengths = React.useRef<Record<string, number>>({})
  const clockRef = React.useRef(START_CLOCK)
  const speedRef = React.useRef(speed)
  const offRef = React.useRef(off)
  const syncRef = React.useRef(false)
  const touchTimer = React.useRef(0)
  React.useEffect(() => {
    speedRef.current = Math.max(0.05, speed)
    offRef.current = off
  }, [speed, off])

  /** Draws every pulse and the hub glow for clock time `c`. */
  const draw = React.useCallback(
    (c: number) => {
      const frame = frameRef.current
      if (!frame) return
      const t = c % CYCLE
      let ring = 0
      for (const b of beams) {
        const g = pulseRefs.current[b.key]
        const path = pathRefs.current[b.key]
        const grad = gradRefs.current[b.key]
        if (!g || !path || !grad) continue
        const len = (lengths.current[b.key] ||= path.getTotalLength())
        const start = b.side === "in" ? b.index * STAGGER : RIGHT_AT + b.index * STAGGER
        const e = (t - start) / TRAVEL
        const active = !offRef.current.has(b.key)
        if (b.side === "in" && active) ring = Math.max(ring, flash(t, start + TRAVEL))
        if (!active || e < 0 || e > 1.16) {
          g.style.opacity = "0"
          continue
        }
        const p = easePulse(clamp01(e))
        const offset = DASH - (DASH + len) * p
        const tail = path.getPointAtLength(clamp01(-offset / len) * len)
        const head = path.getPointAtLength(clamp01((-offset + DASH) / len) * len)
        grad.setAttribute("x1", tail.x.toFixed(2))
        grad.setAttribute("y1", tail.y.toFixed(2))
        grad.setAttribute("x2", head.x.toFixed(2))
        grad.setAttribute("y2", head.y.toFixed(2))
        for (const el of g.children) (el as SVGPathElement).style.strokeDashoffset = offset.toFixed(2)
        g.style.opacity = (e <= 1 ? Math.min(1, (e * TRAVEL) / 0.24) : Math.max(0, 1 - ((e - 1) * TRAVEL) / 0.24)).toFixed(3)
      }
      frame.style.setProperty("--ring", Math.min(1, ring).toFixed(3))
      const sync = t > SYNC_FROM && t < SYNC_TO
      if (sync !== syncRef.current) {
        syncRef.current = sync
        setSyncing(sync)
      }
    },
    [beams],
  )

  // Measure beam lengths and paint the first frame before the browser does.
  React.useLayoutEffect(() => {
    lengths.current = {}
    draw(clockRef.current)
  }, [draw])

  React.useEffect(() => {
    if (paused || reduced) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      clockRef.current += dt * speedRef.current
      draw(clockRef.current)
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    // Only run while the scene is on screen.
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    io.observe(root)
    return () => {
      io.disconnect()
      stop()
    }
  }, [paused, reduced, draw])

  // Let the chip glide to the width of its text.
  React.useLayoutEffect(() => {
    const m = measureRef.current
    const root = rootRef.current
    const chip = chipRef.current
    if (!m || !root || !chip || !root.clientWidth) return
    chip.style.setProperty("--cw", ((m.offsetWidth * W) / root.clientWidth).toFixed(2))
  }, [statusText])

  React.useEffect(() => () => window.clearTimeout(touchTimer.current), [])

  const toggle = (key: string, name: string) => {
    const next = new Set(off)
    const wasOn = !next.has(key)
    if (wasOn) next.add(key)
    else next.delete(key)
    setOff(next)
    const count = tools.length - next.size
    setNote(`${name} ${wasOn ? "paused" : "reconnected"}. ${count} of ${tools.length} connected.`)
  }

  const defaultLabel = `${center.name} connected to ${tools.map((t) => t.name).join(", ")}`
  const style = { "--ib-speed": Math.max(0.05, speed), ...(accent ? { "--ib-accent": accent } : null) } as React.CSSProperties
  const hubTop = cy - HUB / 2

  return (
    <div
      ref={rootRef}
      className={className ? `ib ${className}` : "ib"}
      role="group"
      aria-label={label ?? defaultLabel}
      data-paused={paused || undefined}
      data-focus={focus ? "" : undefined}
      data-sync={syncing ? "" : undefined}
      style={style}
    >
      <style href="pane-integration-beam" precedence="default">
        {CSS}
      </style>
      <div className="ib-frame" ref={frameRef} style={{ "--h": H } as React.CSSProperties}>
        <span className="ib-sizer" aria-hidden />
        <svg className="ib-beams" viewBox={`0 0 ${W} ${H}`} aria-hidden>
          <defs>
            <filter id={`ib-blur${uid}`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="10000" height="10000">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            {beams.map((b) => (
              <linearGradient
                key={b.key}
                id={`ib-g${uid}${b.key}`}
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
                ref={(el) => {
                  gradRefs.current[b.key] = el
                }}
              >
                <stop offset="0" className="ib-stop-tail" />
                <stop offset=".6" className="ib-stop-mid" />
                <stop offset="1" className="ib-stop-head" />
              </linearGradient>
            ))}
          </defs>
          {beams.map((b) => (
            <path
              key={b.key}
              d={b.d}
              className={`ib-line${focus === b.key ? " is-focus" : ""}${off.has(b.key) ? " is-off" : ""}`}
              ref={(el) => {
                pathRefs.current[b.key] = el
              }}
            />
          ))}
          {beams.map((b) => (
            <g
              key={b.key}
              className={`ib-pulse${focus === b.key ? " is-focus" : ""}`}
              ref={(el) => {
                pulseRefs.current[b.key] = el
              }}
            >
              <path
                d={b.d}
                className="ib-glow"
                stroke={`url(#ib-g${uid}${b.key})`}
                style={{ filter: `url(#ib-blur${uid})`, strokeDasharray: `${DASH} 2000`, strokeDashoffset: DASH }}
              />
              <path d={b.d} className="ib-core" stroke={`url(#ib-g${uid}${b.key})`} style={{ strokeDasharray: `${DASH} 2000`, strokeDashoffset: DASH }} />
            </g>
          ))}
        </svg>

        <div className="ib-scene">
          {tools.map((t) => {
            const isOff = off.has(t.key)
            const focused = focus === t.key
            return (
              <button
                key={t.key}
                type="button"
                className="ib-tool"
                data-side={t.side}
                data-on={!isOff}
                data-focus={focused}
                aria-pressed={!isOff}
                aria-label={`${t.name}, ${isOff ? "paused" : "connected"}`}
                style={{
                  left: t.side === "in" ? 0 : `calc(${W - TOOL} * var(--u))`,
                  top: `calc(${t.y - TOOL / 2} * var(--u))`,
                }}
                onPointerEnter={(e) => e.pointerType !== "touch" && setFocus(t.key)}
                onPointerLeave={(e) => e.pointerType !== "touch" && setFocus((f) => (f === t.key ? null : f))}
                onFocus={() => setFocus(t.key)}
                onBlur={() => setFocus((f) => (f === t.key ? null : f))}
                onClick={(e) => {
                  toggle(t.key, t.name)
                  if ((e.nativeEvent as PointerEvent).pointerType === "touch") {
                    // No hover on touch screens: show the name for a moment instead.
                    setFocus(t.key)
                    window.clearTimeout(touchTimer.current)
                    touchTimer.current = window.setTimeout(() => setFocus((f) => (f === t.key ? null : f)), 1600)
                  }
                }}
              >
                <span className="ib-ring" aria-hidden />
                <span className="ib-logo" aria-hidden style={t.color ? ({ "--c": t.color } as React.CSSProperties) : undefined}>
                  {t.icon}
                </span>
                <span className="ib-tip" aria-hidden>
                  {t.name}
                  {isOff && <i> · Paused</i>}
                </span>
              </button>
            )
          })}

          <div className="ib-hub" aria-hidden style={{ left: `calc(${W / 2 - HUB / 2} * var(--u))`, top: `calc(${hubTop} * var(--u))` }}>
            <span className="ib-hub-ring" />
            <span className="ib-mark">{center.icon ?? DEFAULT_MARK}</span>
          </div>

          <div className="ib-chip" ref={chipRef} aria-hidden style={{ left: `calc(${W / 2} * var(--u))`, top: `calc(${hubTop + HUB + 12} * var(--u))`, translate: "-50% 0" }}>
            <span className="ib-chip-in">
              <span className="ib-dot" />
              <span className="ib-status" key={statusText}>
                {statusText}
              </span>
            </span>
          </div>
          <span className="ib-measure" ref={measureRef} aria-hidden>
            <span className="ib-dot" />
            <span>{statusText}</span>
          </span>
        </div>
        <span className="ib-sr" role="status" aria-live="polite">
          {note}
        </span>
      </div>
    </div>
  )
}

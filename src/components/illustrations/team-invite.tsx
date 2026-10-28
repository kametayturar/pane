"use client"

import * as React from "react"

/**
 * TeamInvite – a connected team and one empty seat. A cursor drags a new teammate into the seat,
 * the dashed line turns solid and they come online. Loops.
 *
 *   <TeamInvite invitee={{ name: "Priya" }} />
 */

export type TeamInviteMember = {
  /** Shown under the avatar; the initials are taken from it. */
  name: string
  /** Hue (0–360) of the soft gradient face. Defaults to a pleasant spread. */
  hue?: number
  /** Show a grey "away" dot instead of the green online one. */
  away?: boolean
}

export type TeamInviteProps = {
  /** Teammates already connected (up to four are drawn). */
  members?: TeamInviteMember[]
  /** The person who gets dragged into the empty seat. */
  invitee?: Pick<TeamInviteMember, "name" | "hue">
  /** Label under the centre tile. */
  workspace?: string
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) for the centre tile, the cursor and the solid line. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const W = 640
const H = 400
const HUB = { x: 320, y: 200 }
const SLOTS = [
  { x: 320, y: 62 },
  { x: 118, y: 150 },
  { x: 522, y: 150 },
  { x: 150, y: 300 },
]
const SEAT = { x: 490, y: 300 }
const CHIP = { x: 320, y: 352 }

const DEFAULT_MEMBERS: TeamInviteMember[] = [
  { name: "Ana", hue: 18 },
  { name: "Jonas", hue: 150 },
  { name: "Mei", hue: 250 },
  { name: "Tomás", hue: 330, away: true },
]
const DEFAULT_INVITEE = { name: "Priya", hue: 205 }

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)).toUpperCase()
}

const at = (p: { x: number; y: number }, dx = 0, dy = 0) => `translate(${p.x + dx}px, ${p.y + dy}px)`

const CSS = `
.ti {
  --ti-ink: #000;
  --ti-surface: #fff;
  --ti-accent: #0060e2;
  --ti-speed: 1;
  --ti-scale: 1;
  --ti-t1: color-mix(in oklab, var(--ti-ink) 88%, transparent);
  --ti-t2: color-mix(in oklab, var(--ti-ink) 61%, transparent);
  --ti-t3: color-mix(in oklab, var(--ti-ink) 45%, transparent);
  --ti-t4: color-mix(in oklab, var(--ti-ink) 27%, transparent);
  --ti-line: color-mix(in oklab, var(--ti-ink) 14%, transparent);
  --ti-green: #22c55e;
  --ti-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ti-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .22), 0 1px 2px 0 rgb(0 0 0 / .06);
  --ti-ease: cubic-bezier(.22, 1, .36, 1);
  --ti-T: calc(10s / var(--ti-speed));
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--ti-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ti {
  --ti-ink: #fff; --ti-surface: #1c1c1e; --ti-accent: #4d8dff;
  --ti-t1: color-mix(in oklab, var(--ti-ink) 90%, transparent);
  --ti-t2: color-mix(in oklab, var(--ti-ink) 62%, transparent);
  --ti-t3: color-mix(in oklab, var(--ti-ink) 46%, transparent);
  --ti-t4: color-mix(in oklab, var(--ti-ink) 28%, transparent);
  --ti-line: color-mix(in oklab, var(--ti-ink) 18%, transparent);
  --ti-green: #34d27b;
  --ti-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ti-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 12px 28px -10px rgb(0 0 0 / .7), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ti *, .ti *::before, .ti *::after { box-sizing: border-box }
.ti-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--ti-scale)) }
.ti-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.ti-lines path { fill: none; stroke-linecap: butt }
.ti-l { stroke: var(--ti-line); stroke-width: 1.5 }
.ti-l-dash path { stroke: var(--ti-t4); stroke-width: 1.5; stroke-dasharray: .025 .03; animation: ti-march calc(1.6s / var(--ti-speed)) linear infinite }
.ti-l-dash { animation: ti-dash var(--ti-T) linear infinite }
.ti-l-solid { stroke: var(--ti-accent); stroke-width: 2; stroke-dasharray: 1 1; animation: ti-solid var(--ti-T) linear infinite }
.ti-l-glint { stroke: #fff; stroke-width: 2; stroke-opacity: .9; stroke-dasharray: .14 2; opacity: 0; animation: ti-glint var(--ti-T) linear infinite }
@keyframes ti-march { to { stroke-dashoffset: -.055 } }
@keyframes ti-dash { 0%, 44% { opacity: 1 } 52%, 93% { opacity: 0 } 100% { opacity: 1 } }
@keyframes ti-solid { 0%, 44% { stroke-dashoffset: 1; opacity: 1; animation-timing-function: cubic-bezier(.4, 0, .2, 1) } 58%, 93% { stroke-dashoffset: 0; opacity: 1 } 100% { stroke-dashoffset: 0; opacity: 0 } }
@keyframes ti-glint { 0%, 60% { stroke-dashoffset: .14; opacity: 0 } 61% { opacity: 1 } 76% { stroke-dashoffset: -1; opacity: 1 } 76.1% { stroke-dashoffset: .14 } 91% { stroke-dashoffset: -1; opacity: 1 } 92%, 100% { stroke-dashoffset: -1; opacity: 0 } }

/* Nodes */
.ti-node { position: absolute; left: 0; top: 0; display: flex; flex-direction: column; align-items: center; width: 100px; margin: -26px 0 0 -50px }
.ti-bob { animation: ti-bob calc(4.6s / var(--ti-speed)) ease-in-out infinite alternate; animation-delay: calc(var(--d, 0) * -1s) }
@keyframes ti-bob { from { transform: translateY(-2.5px) } to { transform: translateY(2.5px) } }
.ti-av { position: relative; display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; color: #fff; font-weight: 600; font-size: 15px; letter-spacing: .01em;
  background: radial-gradient(circle at 30% 22%, rgb(255 255 255 / .45), transparent 55%), linear-gradient(150deg, oklch(.8 .12 var(--h)), oklch(.62 .16 calc(var(--h) + 38)));
  box-shadow: 0 0 0 3px var(--ti-surface), var(--ti-shadow), inset 0 0 0 1px rgb(255 255 255 / .28); text-shadow: 0 1px 2px rgb(0 0 0 / .18) }
.ti-dot { position: absolute; right: -2px; bottom: -2px; width: 14px; height: 14px; border-radius: 50%; background: var(--ti-green); box-shadow: 0 0 0 2.5px var(--ti-surface) }
.ti-dot[data-away] { background: var(--ti-t4) }
.ti-name { margin-top: 8px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--ti-t2); white-space: nowrap }

/* Centre tile */
.ti-hub { position: absolute; left: 0; top: 0; width: 68px; height: 68px; margin: -34px 0 0 -34px; transform: ${at(HUB)}; display: grid; place-items: center; border-radius: 20px;
  background: linear-gradient(160deg, color-mix(in oklab, var(--ti-accent) 82%, #fff), var(--ti-accent));
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .1), 0 14px 26px -10px color-mix(in oklab, var(--ti-accent) 60%, transparent), inset 0 1px 0 rgb(255 255 255 / .35) }
.ti-hub-in { display: grid; grid-template-columns: repeat(3, 5px); gap: 4px; animation: ti-hub var(--ti-T) ease-in-out infinite }
.ti-hub-in i { width: 5px; height: 5px; border-radius: 1.5px; background: rgb(255 255 255 / .92) }
.ti-hub-in i:nth-child(2), .ti-hub-in i:nth-child(4), .ti-hub-in i:nth-child(6), .ti-hub-in i:nth-child(8) { opacity: .55 }
.ti-hub::after { content: ""; position: absolute; inset: -2px; border-radius: 22px; border: 2px solid var(--ti-accent); opacity: 0; animation: ti-hub-ring var(--ti-T) ease-out infinite }
@keyframes ti-hub { 0%, 46% { transform: scale(1) } 52% { transform: scale(1.12) } 60%, 100% { transform: scale(1) } }
@keyframes ti-hub-ring { 0%, 50% { opacity: 0; transform: scale(1) } 52% { opacity: .5 } 66%, 100% { opacity: 0; transform: scale(1.7) } }
.ti-hub-label { position: absolute; left: ${HUB.x - 50}px; top: ${HUB.y + 42}px; width: 100px; text-align: center; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--ti-t1) }

/* The empty seat */
.ti-seat { position: absolute; left: ${SEAT.x}px; top: ${SEAT.y}px }
.ti-seat .ti-node { margin-top: -26px }
.ti-ring { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; border: 1.5px dashed var(--ti-t4); color: var(--ti-t3);
  animation: ti-ring var(--ti-T) ease-in-out infinite }
.ti-ring svg { width: 18px; height: 18px }
.ti-seat-label { opacity: 1; animation: ti-seat-label var(--ti-T) linear infinite; color: var(--ti-t3) }
@keyframes ti-ring {
  0%, 28% { opacity: 1; transform: scale(1); border-color: var(--ti-t4); background: transparent; color: var(--ti-t3) }
  35%, 43% { opacity: 1; transform: scale(1.1); border-color: var(--ti-accent); background: color-mix(in oklab, var(--ti-accent) 10%, transparent); color: var(--ti-accent) }
  47%, 93% { opacity: 0; transform: scale(.85); border-color: var(--ti-accent); background: transparent }
  100% { opacity: 1; transform: scale(1); border-color: var(--ti-t4); background: transparent; color: var(--ti-t3) }
}
@keyframes ti-seat-label { 0%, 43% { opacity: 1 } 47%, 93% { opacity: 0 } 100% { opacity: 1 } }

/* The newcomer, once dropped */
.ti-new { position: absolute; left: ${SEAT.x}px; top: ${SEAT.y}px }
.ti-new .ti-av { animation: ti-land var(--ti-T) linear infinite }
.ti-new .ti-name { animation: ti-fade-in var(--ti-T) linear infinite }
.ti-new .ti-dot { animation: ti-dot-pop var(--ti-T) linear infinite }
.ti-new .ti-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--ti-green); opacity: 0; animation: ti-ping var(--ti-T) ease-out infinite }
.ti-status { margin-top: -1px; font-size: 11px; line-height: 14px; font-weight: 500; color: var(--ti-green); animation: ti-status var(--ti-T) linear infinite }
@keyframes ti-land {
  0%, 43% { opacity: 0; transform: scale(.55) }
  46% { opacity: 1; transform: scale(1.14); animation-timing-function: ease-out }
  51% { transform: scale(.97) }
  55%, 93% { opacity: 1; transform: scale(1) }
  100% { opacity: 0; transform: scale(.8) }
}
@keyframes ti-fade-in { 0%, 48% { opacity: 0; transform: translateY(4px) } 54%, 93% { opacity: 1; transform: none } 100% { opacity: 0; transform: translateY(4px) } }
@keyframes ti-dot-pop { 0%, 56% { transform: scale(0) } 61% { transform: scale(1.4) } 65%, 93% { transform: scale(1) } 100% { transform: scale(0) } }
@keyframes ti-ping { 0%, 62% { opacity: 0; transform: scale(1) } 64% { opacity: .6 } 80%, 100% { opacity: 0; transform: scale(2.8) } }
@keyframes ti-status { 0%, 62% { opacity: 0; transform: translateY(3px) } 68%, 93% { opacity: 1; transform: none } 100% { opacity: 0; transform: translateY(3px) } }

/* The chip being dragged and the cursor that drags it */
.ti-chip { position: absolute; left: 0; top: 0; margin: -20px 0 0 -62px; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px 0 6px; border-radius: 20px;
  background: var(--ti-surface); box-shadow: var(--ti-float); color: var(--ti-t1); font-size: 12.5px; font-weight: 500; white-space: nowrap;
  transform: ${at(CHIP)}; animation: ti-chip var(--ti-T) linear infinite }
.ti-chip .ti-av { width: 28px; height: 28px; font-size: 10.5px; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .28) }
.ti-chip small { font-size: 11px; font-weight: 400; color: var(--ti-t3) }
@keyframes ti-chip {
  0%, 19% { opacity: 1; transform: ${at(CHIP)} scale(1) rotate(0deg) }
  22% { opacity: 1; transform: ${at(CHIP)} scale(1.07) rotate(0deg); animation-timing-function: cubic-bezier(.45, .05, .2, 1) }
  34% { opacity: 1; transform: ${at({ x: 410, y: 318 })} scale(1.07) rotate(-4deg); animation-timing-function: cubic-bezier(.3, 0, .2, 1) }
  44% { opacity: 1; transform: ${at(SEAT)} scale(1.05) rotate(0deg) }
  47%, 93% { opacity: 0; transform: ${at(SEAT)} scale(.6) rotate(0deg) }
  94% { opacity: 0; transform: ${at(CHIP)} scale(1) rotate(0deg) }
  100% { opacity: 1; transform: ${at(CHIP)} scale(1) rotate(0deg) }
}
.ti-cursor { position: absolute; left: 0; top: 0; width: 0; height: 0; transform: ${at(CHIP, 24, 14)}; animation: ti-cursor var(--ti-T) linear infinite; pointer-events: none }
.ti-cursor svg { position: absolute; left: -3px; top: -2px; width: 22px; height: 22px; filter: drop-shadow(0 2px 3px rgb(0 0 0 / .3)); animation: ti-press var(--ti-T) linear infinite; transform-origin: 3px 2px }
.ti-cursor b { position: absolute; left: 14px; top: 16px; height: 20px; padding: 0 8px; border-radius: 10px; background: var(--ti-accent); color: #fff; font-size: 11px; line-height: 20px; font-weight: 500 }
@keyframes ti-cursor {
  0% { opacity: 0; transform: ${at({ x: 500, y: 392 })} }
  6% { opacity: 1; transform: ${at({ x: 480, y: 388 })}; animation-timing-function: cubic-bezier(.3, 0, .2, 1) }
  20%, 22% { opacity: 1; transform: ${at(CHIP, 24, 14)}; animation-timing-function: cubic-bezier(.45, .05, .2, 1) }
  34% { opacity: 1; transform: ${at({ x: 410, y: 318 }, 24, 14)}; animation-timing-function: cubic-bezier(.3, 0, .2, 1) }
  44% { opacity: 1; transform: ${at(SEAT, 24, 14)} }
  56% { opacity: 1; transform: ${at({ x: 566, y: 352 })}; animation-timing-function: ease-in }
  62%, 100% { opacity: 0; transform: ${at({ x: 590, y: 384 })} }
}
@keyframes ti-press { 0%, 20% { transform: scale(1) } 22%, 44% { transform: scale(.86) } 47%, 100% { transform: scale(1) } }

.ti[data-paused] *, .ti[data-paused] *::before, .ti[data-paused] *::after { animation-play-state: paused !important }

/* Reduced motion: hold the finished frame – the newcomer is in, online and connected. */
@media (prefers-reduced-motion: reduce) {
  .ti *, .ti *::before, .ti *::after { animation: none !important; transition: none !important }
  .ti-chip, .ti-cursor, .ti-ring, .ti-seat-label, .ti-l-dash, .ti-l-glint { opacity: 0 }
  .ti-l-solid { stroke-dashoffset: 0 }
}
`

function Avatar({ name, hue, away, online = true }: { name: string; hue: number; away?: boolean; online?: boolean }) {
  return (
    <div className="ti-av" style={{ "--h": hue } as React.CSSProperties}>
      {initials(name)}
      {online && <i className="ti-dot" data-away={away || undefined} />}
    </div>
  )
}

export function TeamInvite({
  members = DEFAULT_MEMBERS,
  invitee = DEFAULT_INVITEE,
  workspace = "Studio",
  speed = 1,
  paused,
  accent,
  label = "A teammate is dragged into the empty seat, the connection turns solid and they come online",
  className,
}: TeamInviteProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const set = () => el.style.setProperty("--ti-scale", String(el.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const shown = members.slice(0, SLOTS.length)
  const inviteeHue = invitee.hue ?? DEFAULT_INVITEE.hue
  const vars = { ...(accent ? { "--ti-accent": accent } : null), "--ti-speed": Math.max(0.05, speed) } as React.CSSProperties
  const line = (p: { x: number; y: number }) => `M${HUB.x} ${HUB.y} L${p.x} ${p.y}`

  return (
    <div ref={rootRef} className={className ? `ti ${className}` : "ti"} role="img" aria-label={label} data-paused={paused || undefined} style={vars}>
      <style href="pane-team-invite" precedence="default">
        {CSS}
      </style>
      <div className="ti-stage" aria-hidden>
        <svg className="ti-lines" viewBox={`0 0 ${W} ${H}`}>
          {shown.map((_, i) => (
            <path key={i} className="ti-l" d={line(SLOTS[i])} />
          ))}
          <g className="ti-l-dash">
            <path d={line(SEAT)} pathLength={1} />
          </g>
          <path className="ti-l-solid" d={line(SEAT)} pathLength={1} />
          <path className="ti-l-glint" d={line(SEAT)} pathLength={1} />
        </svg>

        <div className="ti-hub">
          <div className="ti-hub-in">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <div className="ti-hub-label">{workspace}</div>

        {shown.map((m, i) => (
          <div key={`${m.name}-${i}`} className="ti-node" style={{ left: SLOTS[i].x, top: SLOTS[i].y }}>
            <div className="ti-bob" style={{ "--d": i * 0.9 } as React.CSSProperties}>
              <Avatar name={m.name} hue={m.hue ?? DEFAULT_MEMBERS[i % DEFAULT_MEMBERS.length].hue!} away={m.away} />
            </div>
            <div className="ti-name">{m.name}</div>
          </div>
        ))}

        <div className="ti-seat">
          <div className="ti-node">
            <div className="ti-ring">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="ti-name ti-seat-label">Open seat</div>
          </div>
        </div>
        <div className="ti-new">
          <div className="ti-node">
            <Avatar name={invitee.name} hue={inviteeHue} />
            <div className="ti-name">{invitee.name}</div>
            <div className="ti-status">Online</div>
          </div>
        </div>

        <div className="ti-chip">
          <Avatar name={invitee.name} hue={inviteeHue} online={false} />
          {invitee.name}
          <small>invite</small>
        </div>
        <div className="ti-cursor">
          <svg viewBox="0 0 22 22">
            <path d="M3 2 L3 17 L7.2 13.2 L10 19.6 L12.8 18.4 L10.1 12.2 L15.8 12 Z" fill="var(--ti-accent)" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <b>You</b>
        </div>
      </div>
    </div>
  )
}

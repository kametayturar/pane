"use client"

import * as React from "react"

/**
 * ProjectFlow – a client task branching into subtasks, notes and assigned roles.
 * Small cards connected by elbow lines that draw themselves in, then the scene replays.
 *
 *   <ProjectFlow task={{ title: "Spring campaign page", client: "Harbor & Pine" }} subtasks={[…]} />
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ProjectFlowRole = {
  /** Role name, e.g. "Designer". */
  name: string
  /** Person assigned to it. */
  person?: string
  /** Avatar colour (any CSS colour). Falls back to a built-in palette. */
  color?: string
}

export type ProjectFlowSubtask = {
  title: string
  /** A short note shown under the title. */
  note?: string
  role: ProjectFlowRole
}

export type ProjectFlowTask = {
  title: string
  /** Who asked for it. */
  client?: string
  /** Due label, e.g. "Due Fri". */
  due?: string
}

export type ProjectFlowProps = {
  /** The client task at the root of the tree. */
  task?: ProjectFlowTask
  /** Up to five subtasks. */
  subtasks?: ProjectFlowSubtask[]
  /** Play the scene again after it finishes. Default true. */
  loop?: boolean
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) used for the root card and the travelling pulses. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const DEFAULT_TASK: ProjectFlowTask = { title: "Spring campaign landing page", client: "Harbor & Pine", due: "Due Fri" }

const DEFAULT_SUBTASKS: ProjectFlowSubtask[] = [
  { title: "Write the hero copy", note: "Playful tone, 12 words max", role: { name: "Copywriter", person: "Imani" } },
  { title: "Design the page layout", note: "Mobile first, reuse card set", role: { name: "Designer", person: "Mara" } },
  { title: "Build and test", note: "Ship behind a flag on Friday", role: { name: "Engineer", person: "Jonas" } },
]

const PALETTE = ["#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"]

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */

const STAGE_W = 680
const STAGE_H = 400
const ROOT = { x: 22, w: 170, h: 96 }
const MID = { x: 256, w: 204 }
const ROLE = { x: 520, w: 138, h: 46 }
const ELBOW_X = 224
/** Scene length in ms at speed 1 (animations + hold), then a short fade out. */
const PLAY_MS = 8200
const OUT_MS = 500

/** An elbow from (x1,y1) to (x2,y2) with rounded corners, turning at `mx`. */
function elbow(x1: number, y1: number, x2: number, y2: number, mx: number) {
  const dy = y2 - y1
  if (Math.abs(dy) < 1) return `M${x1} ${y1} H${x2}`
  const r = Math.min(10, Math.abs(dy) / 2)
  const s = Math.sign(dy)
  return `M${x1} ${y1} H${mx - r} Q${mx} ${y1} ${mx} ${y1 + s * r} V${y2 - s * r} Q${mx} ${y2} ${mx + r} ${y2} H${x2}`
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pf {
  --pf-ink: #000;
  --pf-surface: #fff;
  --pf-accent: #0060e2;
  --pf-speed: 1;
  --pf-scale: 1;
  --pf-t1: color-mix(in oklab, var(--pf-ink) 88%, transparent);
  --pf-t2: color-mix(in oklab, var(--pf-ink) 61%, transparent);
  --pf-t3: color-mix(in oklab, var(--pf-ink) 45%, transparent);
  --pf-t4: color-mix(in oklab, var(--pf-ink) 27%, transparent);
  --pf-fill: color-mix(in oklab, var(--pf-ink) 5%, transparent);
  --pf-line: color-mix(in oklab, var(--pf-ink) 20%, transparent);
  --pf-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --pf-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 24px -12px rgb(0 0 0 / .18), 0 1px 2px 0 rgb(0 0 0 / .05);
  --pf-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; width: 100%; max-width: ${STAGE_W}px; aspect-ratio: ${STAGE_W} / ${STAGE_H}; overflow: hidden;
  color: var(--pf-t1); font-family: var(--pf-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .pf {
  --pf-ink: #fff; --pf-surface: #1c1c1e; --pf-accent: #4d8dff;
  --pf-t1: color-mix(in oklab, var(--pf-ink) 90%, transparent);
  --pf-t2: color-mix(in oklab, var(--pf-ink) 62%, transparent);
  --pf-t3: color-mix(in oklab, var(--pf-ink) 46%, transparent);
  --pf-t4: color-mix(in oklab, var(--pf-ink) 28%, transparent);
  --pf-fill: color-mix(in oklab, var(--pf-ink) 8%, transparent);
  --pf-line: color-mix(in oklab, var(--pf-ink) 24%, transparent);
  --pf-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --pf-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 24px -12px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.pf *, .pf *::before, .pf *::after { box-sizing: border-box }
.pf-stage { position: absolute; left: 0; top: 0; width: ${STAGE_W}px; height: ${STAGE_H}px; transform-origin: 0 0; transform: scale(var(--pf-scale)) }
.pf-scene { position: absolute; inset: 0; transition: opacity calc(.45s / var(--pf-speed, 1)) ease }
.pf[data-leaving] .pf-scene { opacity: 0 }

.pf-card {
  position: absolute; display: flex; background: var(--pf-surface); border-radius: 12px; box-shadow: var(--pf-shadow);
  animation: pf-in calc(.55s / var(--pf-speed, 1)) var(--pf-ease) backwards;
}
.pf-root {
  left: ${ROOT.x}px; width: ${ROOT.w}px; height: ${ROOT.h}px; flex-direction: column; justify-content: space-between; padding: 12px 14px; border-radius: 14px;
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--pf-accent) 38%, transparent), var(--pf-float), 0 0 32px -6px color-mix(in oklab, var(--pf-accent) 35%, transparent);
}
.pf-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 10.5px; line-height: 14px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--pf-t3) }
.pf-eyebrow i { width: 6px; height: 6px; border-radius: 2px; background: var(--pf-accent) }
.pf-title { font-size: 14px; line-height: 18px; font-weight: 600; letter-spacing: -.01em; color: var(--pf-t1) }
.pf-chips { display: flex; flex-wrap: wrap; gap: 4px }
.pf-chip { height: 18px; padding: 0 6px; border-radius: 5px; background: var(--pf-fill); font-size: 11px; line-height: 18px; font-weight: 500; color: var(--pf-t2); white-space: nowrap }

.pf-sub { left: ${MID.x}px; width: ${MID.w}px; flex-direction: column; justify-content: center; gap: 2px; padding: 0 14px }
.pf-sub-title { font-size: 13px; line-height: 18px; font-weight: 500; color: var(--pf-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.pf-note { display: flex; align-items: center; gap: 5px; font-size: 11.5px; line-height: 16px; color: var(--pf-t3); min-width: 0 }
.pf-note svg { flex: none; width: 11px; height: 11px }
.pf-note span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

.pf-role { left: ${ROLE.x}px; width: ${ROLE.w}px; height: ${ROLE.h}px; align-items: center; gap: 8px; padding: 0 10px 0 9px; border-radius: 11px }
.pf-avatar {
  display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 50%; font-size: 11px; font-weight: 600; line-height: 1;
  color: var(--c); background: color-mix(in oklab, var(--c) 16%, transparent); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--c) 40%, transparent);
}
.pf-who { flex: 1; min-width: 0; display: flex; flex-direction: column }
.pf-role-name { font-size: 12px; line-height: 16px; font-weight: 500; color: var(--pf-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.pf-person { font-size: 11px; line-height: 14px; color: var(--pf-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.pf-tick {
  flex: none; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; color: #fff; background: #22a06b;
  animation: pf-pop calc(.5s / var(--pf-speed, 1)) var(--pf-ease) backwards;
}
.pf-tick svg { width: 10px; height: 10px }

/* Lines draw from their start; a pulse then travels along each branch */
.pf-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.pf-lines path { fill: none; stroke: var(--pf-line); stroke-width: 1.5; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: pf-draw calc(.6s / var(--pf-speed, 1)) var(--pf-ease) backwards }
.pf-lines circle { fill: var(--pf-surface); stroke: var(--pf-line); stroke-width: 1.5 }
.pf-dot {
  position: absolute; left: 0; top: 0; width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; border-radius: 50%; opacity: 0; pointer-events: none;
  background: var(--pf-accent); box-shadow: 0 0 10px 1px var(--pf-accent);
  animation: pf-travel calc(2.6s / var(--pf-speed, 1)) cubic-bezier(.4, 0, .4, 1) infinite;
}

/* Everything on the scene enters at its own delay: --d is in seconds at speed 1 (after the shorthands above) */
.pf-card, .pf-lines path, .pf-tick, .pf-dot { animation-delay: calc(var(--d, 0) * 1s / var(--pf-speed, 1)) }

@keyframes pf-in { from { opacity: 0; transform: translateY(8px) scale(.97); filter: blur(3px) } }
@keyframes pf-draw { from { stroke-dashoffset: 1 } }
@keyframes pf-pop { from { opacity: 0; transform: scale(.4) } }
@keyframes pf-travel {
  0% { offset-distance: 0%; opacity: 0 }
  12% { opacity: 1 }
  88% { opacity: 1 }
  100% { offset-distance: 100%; opacity: 0 }
}

.pf[data-paused] *, .pf[data-paused] *::before, .pf[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .pf *, .pf *::before, .pf *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(REDUCED_QUERY)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  )
}

const initials = (s: string) =>
  s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const delay = (d: number) => ({ "--d": d.toFixed(2) }) as React.CSSProperties

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function ProjectFlow({
  task = DEFAULT_TASK,
  subtasks = DEFAULT_SUBTASKS,
  loop = true,
  speed = 1,
  paused,
  accent,
  label = "A client task splits into subtasks, each with a note and an assigned role",
  className,
}: ProjectFlowProps) {
  const reduced = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  // `run` restarts the scene (it is the React key); `leaving` fades it out just before.
  const [state, setState] = React.useState({ run: 0, leaving: false })
  const speedRef = React.useRef(speed)
  React.useEffect(() => {
    speedRef.current = speed
  })
  const remaining = React.useRef(PLAY_MS)
  const leavingRef = React.useRef(false)

  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const fit = () => el.style.setProperty("--pf-scale", String(el.clientWidth / STAGE_W))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Replay timer: play → fade out → play again. Pausing keeps the time that is left.
  React.useEffect(() => {
    if (!loop || paused || reduced) return
    const rate = Math.max(0.1, speedRef.current)
    const t0 = performance.now()
    let fired = false
    const id = window.setTimeout(() => {
      fired = true
      const wasLeaving = leavingRef.current
      leavingRef.current = !wasLeaving
      remaining.current = wasLeaving ? PLAY_MS : OUT_MS
      setState((s) => (wasLeaving ? { run: s.run + 1, leaving: false } : { run: s.run, leaving: true }))
    }, remaining.current / rate)
    return () => {
      window.clearTimeout(id)
      if (!fired) remaining.current = Math.max(0, remaining.current - (performance.now() - t0) * rate)
    }
  }, [loop, paused, reduced, state])

  const list = subtasks.slice(0, 5)
  const n = Math.max(1, list.length)
  const slot = (STAGE_H - 36) / n
  const midH = Math.min(60, slot - 14)
  const rootCy = STAGE_H / 2

  const style = {
    "--pf-speed": Math.max(0.05, speed),
    ...(accent ? { "--pf-accent": accent } : null),
  } as React.CSSProperties

  const rows = list.map((st, i) => {
    const cy = 18 + slot * (i + 0.5)
    const color = st.role.color ?? PALETTE[i % PALETTE.length]
    const a = 0.5 + i * 0.2
    return {
      st,
      cy,
      color,
      a,
      pathA: elbow(ROOT.x + ROOT.w, rootCy, MID.x, cy, ELBOW_X),
      pathB: `M${MID.x + MID.w} ${cy} H${ROLE.x}`,
      pathAll: `${elbow(ROOT.x + ROOT.w, rootCy, MID.x, cy, ELBOW_X)} L${MID.x + MID.w} ${cy} H${ROLE.x}`,
    }
  })

  return (
    <div
      ref={rootRef}
      className={className ? `pf ${className}` : "pf"}
      style={style}
      data-paused={paused || undefined}
      data-leaving={state.leaving || undefined}
      role="img"
      aria-label={label}
    >
      <style href="pane-project-flow" precedence="default">
        {CSS}
      </style>
      <div className="pf-stage" aria-hidden>
        <div className="pf-scene" key={state.run}>
          <svg className="pf-lines" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}>
            {rows.map((r, i) => (
              <React.Fragment key={i}>
                <path d={r.pathA} pathLength={1} style={delay(r.a)} />
                <path d={r.pathB} pathLength={1} style={{ ...delay(1.7 + i * 0.2), animationDuration: "calc(.4s / var(--pf-speed, 1))" }} />
              </React.Fragment>
            ))}
          </svg>
          {rows.map((r, i) => (
            <span key={i} className="pf-dot" style={{ ...delay(3.2 + i * 0.5), offsetPath: `path("${r.pathAll}")` } as React.CSSProperties} />
          ))}

          <div className="pf-card pf-root" style={{ ...delay(0), top: rootCy - ROOT.h / 2 }}>
            <span className="pf-eyebrow">
              <i />
              Client request
            </span>
            <span className="pf-title">{task.title}</span>
            <span className="pf-chips">
              {task.client && <span className="pf-chip">{task.client}</span>}
              {task.due && <span className="pf-chip">{task.due}</span>}
            </span>
          </div>

          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <div className="pf-card pf-sub" style={{ ...delay(0.95 + i * 0.2), top: r.cy - midH / 2, height: midH }}>
                <span className="pf-sub-title">{r.st.title}</span>
                {r.st.note && (
                  <span className="pf-note">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
                      <path d="M2 1.5h8v6L7 10.5H2z" />
                      <path d="M7 10.5V7.5h3" />
                    </svg>
                    <span>{r.st.note}</span>
                  </span>
                )}
              </div>
              <div className="pf-card pf-role" style={{ ...delay(2.05 + i * 0.2), top: r.cy - ROLE.h / 2, "--c": r.color } as React.CSSProperties}>
                <span className="pf-avatar">{initials(r.st.role.person ?? r.st.role.name)}</span>
                <span className="pf-who">
                  <span className="pf-role-name">{r.st.role.name}</span>
                  {r.st.role.person && <span className="pf-person">{r.st.role.person}</span>}
                </span>
                <span className="pf-tick" style={delay(2.55 + i * 0.2)}>
                  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 5.2 4.2 7.4 8 3" />
                  </svg>
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

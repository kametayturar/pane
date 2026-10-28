"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking"

export type VoiceOrbProps = {
  /** Controlled state. Leave it out and the orb cycles through all four by itself. */
  state?: VoiceOrbState
  /** Audio level 0–1, used while listening. Without it a believable level is simulated. */
  level?: number
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Dot colour (any CSS colour). Defaults to the ink colour of the theme. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  /** Override the status texts under the orb (the blinking dots are added for you). */
  statusLabels?: Partial<Record<VoiceOrbState, string>>
  /** Show the small status text under the orb. Default true. */
  showStatus?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.vo {
  --vo-ink: #000;
  --vo-dot: #171717;
  --vo-speak: #2f6bff;
  --vo-t2: color-mix(in oklab, var(--vo-ink) 44%, transparent);
  --vo-t3: color-mix(in oklab, var(--vo-ink) 45%, transparent);
  --vo-ease: cubic-bezier(.22, 1, .36, 1);
  --vo-speed: 1;
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 420 / 400;
  color: var(--vo-t2);
  font-family: var(--vo-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: center;
}
:is(.dark, [data-theme="dark"]) .vo {
  --vo-ink: #fff;
  --vo-dot: #ededed;
  --vo-speak: #5b8cff;
  --vo-t2: color-mix(in oklab, var(--vo-ink) 46%, transparent);
  --vo-t3: color-mix(in oklab, var(--vo-ink) 46%, transparent);
}
.vo *, .vo *::before, .vo *::after { box-sizing: border-box }
.vo-stage { position: absolute; inset: 0 }
.vo-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; color: var(--vo-accent, var(--vo-dot)) }

/* Status: the text swaps with a small blur crossfade; three dots blink after it while the orb is busy. */
.vo-status { position: absolute; left: 0; right: 0; bottom: 3%; display: flex; justify-content: center; pointer-events: none }
.vo-text { display: inline-flex; align-items: baseline; gap: 4px; font-weight: 500; letter-spacing: .005em; color: var(--vo-t2);
  animation: vo-in calc(.36s / var(--vo-speed)) var(--vo-ease) backwards }
.vo-dots { display: inline-flex; gap: 3px; align-self: flex-end; padding-bottom: 6px }
.vo-dots i { width: 3px; height: 3px; border-radius: 50%; background: currentColor; animation: vo-blink calc(1.2s / var(--vo-speed)) ease-in-out infinite }
.vo-dots i:nth-child(2) { animation-delay: calc(.2s / var(--vo-speed)) }
.vo-dots i:nth-child(3) { animation-delay: calc(.4s / var(--vo-speed)) }
@keyframes vo-in { from { opacity: 0; transform: translateY(3px); filter: blur(3px) } }
@keyframes vo-blink { 0%, 80%, 100% { opacity: .25 } 40% { opacity: 1 } }

.vo[data-paused] *, .vo[data-paused] *::before, .vo[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .vo *, .vo *::before, .vo *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                               The point cloud                              */
/* -------------------------------------------------------------------------- */

const N = 1000
const W = 420 // design width the radius is measured against
const H = 400
const R = 140 // sphere radius in design px
const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/** Unit vectors spread evenly over a sphere (Fibonacci lattice) and a few stable per-dot random numbers. */
const BASE = (() => {
  const nx = new Float32Array(N)
  const ny = new Float32Array(N)
  const nz = new Float32Array(N)
  const h1 = new Float32Array(N)
  const h2 = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) / N) * 2
    const r = Math.sqrt(1 - y * y)
    const a = i * GOLDEN
    nx[i] = Math.cos(a) * r
    ny[i] = y
    nz[i] = Math.sin(a) * r
    h1[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1
    h1[i] = h1[i] < 0 ? h1[i] + 1 : h1[i]
    h2[i] = (Math.sin(i * 78.233 + 1.7) * 24634.6345) % 1
    h2[i] = h2[i] < 0 ? h2[i] + 1 : h2[i]
  }
  return { nx, ny, nz, h1, h2 }
})()

const CYCLE: [VoiceOrbState, number][] = [
  ["idle", 2.4],
  ["listening", 3.6],
  ["thinking", 3],
  ["speaking", 3.8],
]
const CYCLE_LEN = CYCLE.reduce((s, [, d]) => s + d, 0)

function stateAt(t: number): VoiceOrbState {
  let m = t % CYCLE_LEN
  for (const [s, d] of CYCLE) {
    if (m < d) return s
    m -= d
  }
  return "idle"
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}

type Sim = { t: number; ring: number; listen: number; speak: number; lvl: number }

function targetsFor(state: VoiceOrbState) {
  return { ring: state === "thinking" ? 1 : 0, listen: state === "listening" ? 1 : 0, speak: state === "speaking" ? 1 : 0 }
}

/** Paint one frame of the dot sphere / ring. `w` and `h` are CSS pixels. */
const PX = new Float32Array(N)
const PY = new Float32Array(N)
const PS = new Float32Array(N)
const PA = new Float32Array(N)

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, s: Sim, color: string, speakColor: string | null) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const k = Math.min(w / W, h / H)
  const cx = w / 2
  const cy = (h * 0.47)
  const t = s.t
  const radius = R * k
  const cam = radius * 3.6
  const yaw = t * 0.22
  const cyaw = Math.cos(yaw)
  const syaw = Math.sin(yaw)
  const tilt = 1.02
  const ctilt = Math.cos(tilt)
  const stilt = Math.sin(tilt)
  const breathe = 1 + 0.035 * Math.sin(t * 1.15)
  const head = t * 2.1
  const env = 0.6 + 0.4 * Math.sin(t * 3.3) * Math.sin(t * 1.4 + 0.6)
  const dotR = 1.9 * k

  for (let i = 0; i < N; i++) {
    // Sphere position: rotate around the vertical axis.
    const bx = BASE.nx[i]
    const by = BASE.ny[i]
    const bz = BASE.nz[i]
    const x0 = bx * cyaw + bz * syaw
    const z0 = -bx * syaw + bz * cyaw

    // Radial displacement: breathing + sound + ripples.
    let d = 0
    if (s.listen > 0.001) {
      const n =
        Math.sin(bx * 3.1 + t * 2.3 + BASE.h1[i] * 0.6) * Math.sin(by * 3.7 - t * 1.9) +
        0.6 * Math.sin(bz * 5.3 + by * 2.1 + t * 3.4)
      d += s.listen * (0.04 + s.lvl * 0.3) * (0.5 + 0.5 * n) + s.listen * s.lvl * 0.05
    }
    if (s.speak > 0.001) {
      const ang = Math.acos(Math.max(-1, Math.min(1, z0)))
      d += s.speak * 0.1 * env * Math.sin(ang * 6.5 - t * 5.2) * (0.35 + 0.65 * Math.exp(-ang * 0.35))
    }
    const rr = radius * (breathe + d)
    const sx = x0 * rr
    const sy = by * rr
    const sz = z0 * rr

    let px = sx
    let py = sy
    let pz = sz
    let alpha = 0.16 + 0.84 * Math.pow((z0 + 1) / 2, 1.35)
    let size = dotR

    // Ring position: a thin band that spins in its own plane, tipped back a little.
    const stagger = s.ring * 1.5 - BASE.h2[i] * 0.5
    const m = smooth(stagger)
    if (m > 0.0005) {
      const ang = ((i * 0.6180339887) % 1) * Math.PI * 2 + t * 1.9
      const rad = radius * (0.88 + 0.14 * BASE.h1[i]) * (1 + 0.06 * Math.sin(ang * 5 + t * 2.1)) * (1 + 0.015 * Math.sin(t * 1.15))
      const rx = Math.cos(ang) * rad
      const ry0 = Math.sin(ang) * rad
      const rz0 = (BASE.h2[i] - 0.5) * radius * 0.1
      const ry = ry0 * ctilt - rz0 * stilt
      const rz = ry0 * stilt + rz0 * ctilt
      // 0 at the head of the comet, 1 at its tail.
      let tail = ((head - ang) / (Math.PI * 2)) % 1
      if (tail < 0) tail += 1
      const ringAlpha = 0.18 + 0.82 * Math.pow(1 - tail, 2.2)
      px += (rx - px) * m
      py += (ry - py) * m
      pz += (rz - pz) * m
      alpha += (ringAlpha - alpha) * m
      size += (dotR * (1 + 0.6 * (1 - tail)) - size) * m
    }

    const persp = cam / (cam - pz)
    PX[i] = cx + px * persp
    PY[i] = cy + py * persp
    PS[i] = size * persp * (1 + 0.25 * s.speak)
    PA[i] = alpha
  }
  // Dots are ink (or the accent). While speaking they blend over to the speaking colour.
  const blend = speakColor ? clamp01(s.speak) : 0
  const pass = (fill: string, mul: number) => {
    if (mul <= 0.003) return
    ctx.fillStyle = fill
    for (let i = 0; i < N; i++) {
      ctx.globalAlpha = PA[i] * mul
      ctx.beginPath()
      ctx.arc(PX[i], PY[i], PS[i], 0, Math.PI * 2)
      ctx.fill()
    }
  }
  pass(color, 1 - blend)
  if (speakColor) pass(speakColor, blend)
  ctx.globalAlpha = 1
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches

const DEFAULT_STATUS: Record<VoiceOrbState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
}

/**
 * VoiceOrb – the face of a voice assistant. A sphere of dots that breathes when idle,
 * catches sound while listening, collapses into a spinning ring while thinking and
 * ripples while speaking.
 *
 *   <VoiceOrb state="listening" level={micLevel} />
 */
export function VoiceOrb({
  state,
  level,
  speed = 1,
  paused,
  accent,
  label = "Voice assistant orb",
  statusLabels,
  showStatus = true,
  className,
}: VoiceOrbProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, () => false)
  const [auto, setAuto] = React.useState<VoiceOrbState>("idle")

  const controlled = state !== undefined
  const shown: VoiceOrbState = reduced && !controlled ? "idle" : (state ?? auto)

  // Latest props for the animation loop – changing them never restarts the scene.
  const live = React.useRef({ state, level, speed: Math.max(0.05, speed), paused: !!paused, reduced, shown })
  const ctl = React.useRef<{ update: () => void } | null>(null)
  React.useEffect(() => {
    live.current = { state, level, speed: Math.max(0.05, speed), paused: !!paused, reduced, shown }
    ctl.current?.update()
  }, [state, level, speed, paused, reduced, shown, accent])

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!root || !canvas || !ctx) return

    const sim: Sim = { t: 1.4, ring: 0, listen: 0, speak: 0, lvl: 0 }
    let raf = 0
    let last = 0
    let visible = true
    let w = 0
    let h = 0
    let dpr = 1
    let color = "#888"
    let speakColor: string | null = null
    let frame = 0
    let lastAuto: VoiceOrbState = "idle"

    const readColor = () => {
      const cs = getComputedStyle(canvas)
      color = cs.color || color
      // Without an accent the dots turn blue while speaking.
      speakColor = cs.getPropertyValue("--vo-accent").trim() ? null : cs.getPropertyValue("--vo-speak").trim() || null
    }
    const currentState = (): VoiceOrbState => {
      const p = live.current
      if (p.state) return p.state
      return p.reduced ? "idle" : stateAt(sim.t)
    }
    const snap = (st: VoiceOrbState) => {
      const g = targetsFor(st)
      sim.ring = g.ring
      sim.listen = g.listen
      sim.speak = g.speak
      sim.lvl = st === "listening" ? 0.55 : st === "speaking" ? 0.4 : 0
    }
    const advance = (dt: number) => {
      const p = live.current
      const sdt = dt * p.speed
      sim.t += sdt
      const st = currentState()
      if (!p.state && st !== lastAuto) {
        lastAuto = st
        setAuto(st)
      }
      const g = targetsFor(st)
      const ease = (cur: number, to: number, rate: number) => cur + (to - cur) * (1 - Math.exp(-sdt * rate))
      sim.ring = ease(sim.ring, g.ring, g.ring ? 3 : 3.4)
      sim.listen = ease(sim.listen, g.listen, 4)
      sim.speak = ease(sim.speak, g.speak, 3.5)
      const t = sim.t
      let lvlTarget = 0
      if (st === "listening") {
        lvlTarget =
          p.level !== undefined
            ? clamp01(p.level)
            : clamp01(0.42 + 0.26 * Math.sin(t * 3.1) * Math.sin(t * 1.3 + 1) + 0.16 * Math.sin(t * 7.7) + 0.1 * Math.sin(t * 12.3))
      } else if (st === "speaking") {
        lvlTarget = 0.4
      }
      sim.lvl = ease(sim.lvl, lvlTarget, lvlTarget > sim.lvl ? 14 : 6)
    }
    const draw = () => {
      if (!w || !h) return
      if (frame++ % 30 === 0) readColor()
      paint(ctx, w, h, dpr, sim, color, speakColor)
    }
    const shouldRun = () => visible && !live.current.paused && !live.current.reduced && !document.hidden
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      advance(dt)
      draw()
      if (shouldRun()) raf = requestAnimationFrame(tick)
    }
    const update = () => {
      readColor()
      if (shouldRun()) {
        if (!raf) {
          last = 0
          raf = requestAnimationFrame(tick)
        }
        return
      }
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      if (live.current.reduced) snap(currentState())
      draw()
    }
    ctl.current = { update }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 3)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      update()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
      update()
    })
    io.observe(root)
    const mo = new MutationObserver(update) // dark-mode switches repaint even while paused
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const onVis = () => update()
    document.addEventListener("visibilitychange", onVis)
    resize()

    return () => {
      ctl.current = null
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  const text = { ...DEFAULT_STATUS, ...statusLabels }[shown]
  const style = {
    "--vo-speed": Math.max(0.05, speed),
    ...(accent ? { "--vo-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div ref={rootRef} className={className ? `vo ${className}` : "vo"} data-paused={paused || undefined} style={style}>
      <style href="pane-voice-orb" precedence="default">
        {CSS}
      </style>
      <div className="vo-stage" role="img" aria-label={label}>
        <canvas ref={canvasRef} className="vo-canvas" aria-hidden />
      </div>
      {showStatus && (
        <div className="vo-status" aria-live="polite">
          <span key={shown} className="vo-text" data-state={shown}>
            {text}
            {shown !== "idle" && (
              <span className="vo-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

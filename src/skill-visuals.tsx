import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Small animated "before -> after" scenes for the Skills page. Pure SVG / CSS, no images.
 * Every scene is driven by one `step` (0 = before ... steps = after) so the same engine renders
 * a morphing page, a fixing accessibility audit, snapping design tokens, a browser being driven, etc.
 * Animation only runs while the scene is on screen; with prefers-reduced-motion the "after" state is shown still.
 */

export type VisualKind = "slop" | "perf" | "motion" | "a11y" | "tokens" | "timeline" | "three" | "browser" | "copy" | "chart"
export type VisualMode = "auto" | "before" | "after"

export const CATEGORY_VISUAL: Record<string, VisualKind> = {
  "Design taste": "slop",
  "Frontend craft": "slop",
  Motion: "motion",
  "Accessibility & quality": "a11y",
  "Design systems": "tokens",
  "Media, video & 3D": "timeline",
  "Tools & browser": "browser",
  "Writing & UX copy": "copy",
  "Data viz": "chart",
}

export const VISUAL_LABEL: Record<VisualKind, string> = {
  slop: "Page: generic to crafted",
  perf: "Load waterfall: sequential to parallel",
  motion: "Motion: linear vs eased",
  a11y: "Audit: issues fixed one by one",
  tokens: "Tokens: scattered to systematic",
  timeline: "Timeline: frames that play",
  three: "3D: flat to lit and alive",
  browser: "Browser: agent at the controls",
  copy: "Copy: rewritten word by word",
  chart: "Chart: noisy to clear",
}

const STEPS: Record<VisualKind, number> = { slop: 1, perf: 1, motion: 1, a11y: 3, tokens: 1, timeline: 1, three: 1, browser: 3, copy: 1, chart: 1 }
const ACCENTS = ["#2f6df6", "#d97706", "#059669", "#e11d48", "#7c5cff", "#0e9aa7"]

const CSS = `
.sv{--v-surface:#fff;--v-ink:#171717;--v-ink2:#404040;--v-mute:#8a8a8a;--v-line:rgb(0 0 0/.11);--v-soft:#f1f1ef;--v-bad:#e5484d;--v-good:#2f9e6f;--v-lowc:#d9d9d9;--v-stage:#f6f6f4}
.dark .sv{--v-surface:#1e1e21;--v-ink:#f4f4f5;--v-ink2:#cfcfd3;--v-mute:#8b8b92;--v-line:rgb(255 255 255/.13);--v-soft:rgb(255 255 255/.07);--v-lowc:#3e3e44;--v-stage:#131315}
.sv-stage{background:var(--v-stage)}
.sv svg{display:block;width:100%;height:100%}
.sv-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
@keyframes sv-fade{0%{opacity:0}7%{opacity:1}86%{opacity:1}94%{opacity:0}100%{opacity:0}}
@keyframes sv-move{0%{transform:translateX(0)}60%{transform:translateX(150px)}100%{transform:translateX(150px)}}
@keyframes sv-gx{0%{transform:translateX(0)}60%{transform:translateX(80px)}100%{transform:translateX(80px)}}
@keyframes sv-gy{0%{transform:translateY(0)}60%{transform:translateY(-80px)}100%{transform:translateY(-80px)}}
@keyframes sv-ring{0%{transform:scale(.7);opacity:.7}100%{transform:scale(2.1);opacity:0}}
@keyframes sv-play{0%{transform:translateX(0)}100%{transform:translateX(262px)}}
@keyframes sv-bob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.07)}}
@keyframes sv-spin{from{transform:rotateX(-26deg) rotateY(32deg)}to{transform:rotateX(-26deg) rotateY(392deg)}}
@keyframes sv-orbit{from{transform:rotateX(72deg) rotateZ(0)}to{transform:rotateX(72deg) rotateZ(360deg)}}
@keyframes sv-caret{0%,49%{opacity:1}50%,100%{opacity:0}}
.sv-ball{transform:translateX(150px)}
.sv-gdot-x{transform:translateX(80px)}
.sv-gdot-y{transform:translateY(-80px)}
.sv-playhead{transform:translateX(120px)}
.sv-run .sv-lane{animation:sv-fade 3.6s linear infinite}
.sv-run .sv-ball-lin{animation:sv-move 3.6s linear infinite}
.sv-run .sv-ball-ease{animation:sv-move 3.6s var(--ez,cubic-bezier(.16,1,.3,1)) infinite}
.sv-run .sv-gdot-x{animation:sv-gx 3.6s linear infinite}
.sv-run .sv-gdot-y-lin{animation:sv-gy 3.6s linear infinite}
.sv-run .sv-gdot-y-ease{animation:sv-gy 3.6s var(--ez,cubic-bezier(.16,1,.3,1)) infinite}
.sv-run .sv-ring{animation:sv-ring 1.5s ease-out infinite}
.sv-run .sv-playhead{animation:sv-play 3.8s linear infinite}
.sv-run .sv-bob{animation:sv-bob 2.6s ease-in-out infinite}
.sv-run .sv-cube.is-after{animation:sv-spin 9s linear infinite}
.sv-run .sv-orbit.is-after{animation:sv-orbit 6s linear infinite}
.sv-run .sv-caret{animation:sv-caret 1s steps(1) infinite}
.sv-off *{animation-play-state:paused!important}
.sv-ring,.sv-bob,.sv-lane,.sv-ball,.sv-playhead,.sv-gdot-x,.sv-gdot-y{transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion:reduce){.sv *{animation:none!important;transition:none!important}}
`

export function SkillVisualStyles() {
  return <style>{CSS}</style>
}

/* ----------------------------------------------------------------- state hook */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(() => (typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches))
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

function useScene(ref: React.RefObject<HTMLElement | null>, steps: number, mode: VisualMode, seed: number) {
  const reduced = useReducedMotion()
  const [inView, setInView] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const stepRef = React.useRef(0)

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])

  React.useEffect(() => {
    if (mode !== "auto" || reduced || !inView) return
    let id = 0
    let cur = stepRef.current
    const hold = (s: number) => (s === 0 ? 1800 : s === steps ? 2800 : 1050)
    const tick = () => {
      cur = cur >= steps ? 0 : cur + 1
      stepRef.current = cur
      setStep(cur)
      id = window.setTimeout(tick, hold(cur))
    }
    id = window.setTimeout(tick, 500 + (seed % 1100))
    return () => window.clearTimeout(id)
  }, [mode, reduced, inView, steps, seed])

  const shown = mode === "before" ? 0 : mode === "after" || reduced ? steps : step
  return { step: shown, reduced, run: inView && !reduced, off: !inView }
}

/* ----------------------------------------------------------------- svg engine */

const Ctx = React.createContext({ step: 0, reduced: false })
const EASE = "cubic-bezier(.22,1,.36,1)"

type P = {
  x?: number
  y?: number
  w?: number
  h?: number
  r?: number
  fill?: string
  stroke?: string
  sw?: number
  op?: number
  rot?: number
  sc?: number
  fs?: number
  fw?: number
}

function resolve(states: P[], step: number): P {
  let p: P = {}
  for (let i = 0; i <= Math.min(step, states.length - 1); i++) p = { ...p, ...states[i] }
  return p
}

type EProps = Omit<React.SVGAttributes<SVGElement>, "style"> & {
  k: "rect" | "circle" | "text" | "g" | "path"
  st: P[]
  dl?: number
  dur?: number
  mono?: boolean
  children?: React.ReactNode
}

/** One animated SVG element; `st` lists its state per step (later entries inherit earlier ones). */
function E({ k, st, dl = 0, dur = 650, mono, children, ...rest }: EProps) {
  const { step, reduced } = React.useContext(Ctx)
  const p = resolve(st, step)
  const style: React.CSSProperties = {
    transform: `translate(${p.x ?? 0}px, ${p.y ?? 0}px) rotate(${p.rot ?? 0}deg) scale(${p.sc ?? 1})`,
    transformBox: "fill-box",
    transformOrigin: "center",
    opacity: p.op ?? 1,
    transition: reduced ? "none" : `all ${dur}ms ${EASE} ${dl}ms`,
  }
  if (p.w != null) style.width = p.w
  if (p.h != null) style.height = p.h
  if (p.r != null) (style as Record<string, unknown>)[k === "circle" ? "r" : "rx"] = `${p.r}px`
  if (p.fill != null) style.fill = p.fill
  if (p.stroke != null) style.stroke = p.stroke
  if (p.sw != null) style.strokeWidth = p.sw
  if (p.fs != null) style.fontSize = p.fs
  if (p.fw != null) style.fontWeight = p.fw
  const Tag = k as React.ElementType
  return (
    <Tag {...rest} style={style} className={cn(mono && "sv-mono", rest.className)}>
      {children}
    </Tag>
  )
}

const rect = (x: number, y: number, w: number, h: number, r = 0): P => ({ x, y, w, h, r })

/* ----------------------------------------------------------------- slop -> crafted page */

const SLOP_VARIANTS = [
  { h1: "Build with", h2: "less noise.", emoji: ["🚀", "⚡", "🔒"], tag: "NEW · v2", cta: "Start free" },
  { h1: "Calm tools for", h2: "serious work.", emoji: ["🎯", "💡", "🔥"], tag: "BETA", cta: "Get started" },
  { h1: "Make it feel", h2: "crafted.", emoji: ["✨", "🌈", "💎"], tag: "2026", cta: "See how" },
]

function SlopScene({ id, seed }: { id: string; seed: number }) {
  const v = SLOP_VARIANTS[seed % SLOP_VARIANTS.length]
  const g = (n: string) => `url(#${id}${n})`
  const cardsA = [
    { b: { ...rect(20, 118, 76, 44, 16), rot: -2.5, fill: "#fde68a" }, c: [58, 140], e: v.emoji[0] },
    { b: { ...rect(110, 126, 64, 38, 4), rot: 1.8, fill: "#bfdbfe" }, c: [142, 145], e: v.emoji[1] },
    { b: { ...rect(190, 114, 96, 50, 22), rot: -1.2, fill: "#fbcfe8" }, c: [238, 139], e: v.emoji[2] },
  ]
  const cardX = [24, 116, 208]
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d28d9" />
          <stop offset=".55" stopColor="#c026d3" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient id={`${id}g2`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#fde047" />
        </linearGradient>
        <linearGradient id={`${id}g3`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fbcfe8" />
        </linearGradient>
        <radialGradient id={`${id}r1`}>
          <stop offset="0" stopColor="#e9d5ff" stopOpacity=".85" />
          <stop offset="1" stopColor="#e9d5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <E k="rect" st={[{ ...rect(8, 8, 304, 164, 10), fill: "var(--v-surface)" }]} stroke="var(--v-line)" />
      <E k="rect" st={[{ ...rect(8, 8, 304, 164, 10), op: 1 }, { op: 0 }]} fill={g("g1")} />
      <E k="circle" st={[{ x: 56, y: 40, r: 46, op: 1 }, { op: 0, sc: 0.5 }]} fill={g("r1")} dl={60} />
      <E k="circle" st={[{ x: 276, y: 150, r: 56, op: 1 }, { op: 0, sc: 0.5 }]} fill={g("r1")} dl={90} />

      {/* crafted nav */}
      <E k="circle" st={[{ x: 30, y: 20, r: 4, fill: "var(--v-ink)", op: 0 }, { op: 1 }]} dl={260} />
      <E k="rect" st={[{ ...rect(40, 18, 26, 4, 2), fill: "var(--v-ink)", op: 0 }, { op: 0.8 }]} dl={260} />
      {[236, 258, 280].map((x, i) => (
        <E key={x} k="rect" st={[{ ...rect(x, 18, 16, 4, 2), fill: "var(--v-mute)", op: 0 }, { op: 0.55 }]} dl={300 + i * 40} />
      ))}
      <E k="rect" st={[{ ...rect(9, 32, 302, 1, 0), fill: "var(--v-line)", op: 0 }, { op: 1 }]} dl={300} />
      <E k="rect" st={[{ ...rect(24, 40, 48, 13, 6.5), fill: "var(--v-accent)", op: 0 }, { op: 0.14 }]} dl={340} />
      <E k="text" st={[{ x: 31, y: 49.2, fs: 6.6, fw: 650, fill: "var(--v-accent)", op: 0 }, { op: 1 }]} dl={380}>
        {v.tag}
      </E>

      {/* headline */}
      <E k="text" st={[{ x: 160, y: 46, fs: 15, fw: 800, op: 1 }, { x: 150, y: 40, op: 0 }]} textAnchor="middle" fill={g("g2")}>
        ✨ Unleash the Power of AI ✨
      </E>
      <E k="text" st={[{ x: 24, y: 72, fs: 16, fw: 650, fill: "var(--v-ink)", op: 0 }, { op: 1 }]} dl={420}>
        {v.h1}
      </E>
      <E k="text" st={[{ x: 24, y: 90, fs: 16, fw: 650, fill: "var(--v-ink)", op: 0 }, { op: 1 }]} dl={470}>
        {v.h2}
      </E>
      {/* body */}
      <E k="rect" st={[{ ...rect(85, 56, 150, 5, 2.5), fill: "#fff", op: 0.75 }, { ...rect(24, 98, 130, 4, 2), fill: "var(--v-mute)", op: 0.5 }]} dl={120} />
      <E k="rect" st={[{ ...rect(108, 66, 104, 5, 2.5), fill: "#fff", op: 0.55 }, { ...rect(24, 106, 92, 4, 2), fill: "var(--v-mute)", op: 0.35 }]} dl={160} />
      {/* cta */}
      <E k="rect" st={[{ ...rect(106, 80, 108, 24, 12), fill: g("g3"), stroke: "#f0abfc", sw: 3, op: 1 }, { ...rect(24, 116, 62, 16, 6), fill: "var(--v-ink)", stroke: "transparent", sw: 0 }]} dl={200} />
      <E k="text" st={[{ x: 160, y: 95.5, fs: 8.5, fw: 700, fill: "#a21caf", op: 1 }, { x: 55, y: 127, fill: "var(--v-surface)", op: 0 }]} textAnchor="middle" dl={200}>
        Get Started 🚀
      </E>
      <E k="text" st={[{ x: 55, y: 127, fs: 7.5, fw: 600, fill: "var(--v-surface)", op: 0 }, { op: 1 }]} textAnchor="middle" dl={460}>
        {v.cta}
      </E>
      {/* cards */}
      {cardsA.map((c, i) => (
        <React.Fragment key={i}>
          <E
            k="rect"
            st={[
              { ...c.b, op: 1, stroke: "transparent", sw: 0 },
              { ...rect(cardX[i], 140, 88, 24, 8), rot: 0, fill: "var(--v-surface)", stroke: "var(--v-line)", sw: 1 },
            ]}
            dl={220 + i * 50}
          />
          <E k="text" st={[{ x: c.c[0], y: c.c[1] + 5, fs: 16, op: 1 }, { x: cardX[i] + 14, y: 156, op: 0 }]} textAnchor="middle" dl={200 + i * 50}>
            {c.e}
          </E>
          <E k="circle" st={[{ x: cardX[i] + 12, y: 152, r: 5, fill: "var(--v-accent)", op: 0 }, { op: 0.9 }]} dl={500 + i * 50} />
          <E k="rect" st={[{ ...rect(cardX[i] + 24, 147, 44, 3.5, 1.75), fill: "var(--v-ink)", op: 0 }, { op: 0.85 }]} dl={520 + i * 50} />
          <E k="rect" st={[{ ...rect(cardX[i] + 24, 154, 30, 3, 1.5), fill: "var(--v-mute)", op: 0 }, { op: 0.45 }]} dl={540 + i * 50} />
        </React.Fragment>
      ))}
    </svg>
  )
}

/* ----------------------------------------------------------------- motion */

function bezier(x1: number, y1: number, x2: number, y2: number, n = 40) {
  let d = ""
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    const x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t
    const y = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t
    d += `${i ? "L" : "M"}${(216 + 80 * x).toFixed(1)},${(138 - 80 * y).toFixed(1)}`
  }
  return d
}

const CURVES = [
  { name: "ease-out · 380ms", c: [0.16, 1, 0.3, 1] },
  { name: "spring · 450ms", c: [0.34, 1.56, 0.64, 1] },
  { name: "ease-in-out · 400ms", c: [0.65, 0, 0.35, 1] },
  { name: "ease-out · 200ms", c: [0.22, 1, 0.36, 1] },
] as const

function MotionScene({ seed }: { seed: number }) {
  const cv = CURVES[seed % CURVES.length]
  const bz = `cubic-bezier(${cv.c.join(",")})`
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true" style={{ "--ez": bz } as React.CSSProperties}>
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      {/* lane A: linear */}
      <text x="20" y="52" fontSize="7.5" fontWeight="600" fill="var(--v-mute)">
        linear · 300ms
      </text>
      <rect x="20" y="76" width="172" height="2" rx="1" fill="var(--v-line)" />
      <g className="sv-lane">
        <g className="sv-ball sv-ball-lin">
          <circle cx="29" cy="77" r="9" fill="var(--v-mute)" />
        </g>
      </g>
      {/* lane B: the curve this skill teaches */}
      <text x="20" y="108" fontSize="7.5" fontWeight="600" fill="var(--v-ink)">
        {cv.name}
      </text>
      <rect x="20" y="132" width="172" height="2" rx="1" fill="var(--v-line)" />
      <g className="sv-lane">
        <g className="sv-ball sv-ball-ease">
          <circle cx="29" cy="133" r="9" fill="var(--v-accent)" />
        </g>
      </g>
      {/* curve graph */}
      <rect x="206" y="22" width="100" height="136" rx="8" fill="var(--v-soft)" />
      <path d="M216 138 H296 M216 138 V58" stroke="var(--v-line)" strokeWidth="1" fill="none" />
      <path d="M216 138 L296 58" stroke="var(--v-mute)" strokeWidth="1" strokeDasharray="3 3" fill="none" />
      <path d={bezier(cv.c[0], cv.c[1], cv.c[2], cv.c[3])} stroke="var(--v-accent)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <text x="216" y="151" fontSize="6" fill="var(--v-mute)">
        time
      </text>
      <text x="216" y="48" fontSize="6" fill="var(--v-mute)">
        progress
      </text>
      <g className="sv-lane">
        <g className="sv-gdot-x">
          <g className="sv-gdot-y sv-gdot-y-lin">
            <circle cx="216" cy="138" r="3" fill="var(--v-mute)" />
          </g>
        </g>
        <g className="sv-gdot-x">
          <g className="sv-gdot-y sv-gdot-y-ease">
            <circle cx="216" cy="138" r="3.6" fill="var(--v-accent)" />
          </g>
        </g>
      </g>
    </svg>
  )
}

/* ----------------------------------------------------------------- accessibility audit */

function A11yScene() {
  const { step } = React.useContext(Ctx)
  const mk = (n: number, x: number, y: number, fixStep: number) => (
    <>
      <E k="g" st={[{ x, y }]}>
        {step < fixStep && <circle className="sv-ring" r="6" fill="none" stroke="var(--v-bad)" strokeWidth="1.2" />}
      </E>
      <E k="circle" st={[{ x, y, r: 6.5, fill: "var(--v-bad)" }, ...pad(fixStep, { fill: "var(--v-good)" })]} />
      <E k="text" st={[{ x, y: y + 2.6, fs: 7.5, fw: 700, fill: "#fff", op: 1 }, ...pad(fixStep, { op: 0 })]} textAnchor="middle">
        {n}
      </E>
      <E k="text" st={[{ x, y: y + 2.8, fs: 8, fw: 700, fill: "#fff", op: 0 }, ...pad(fixStep, { op: 1 })]} textAnchor="middle">
        ✓
      </E>
    </>
  )
  const chip = (i: number, file: string, bad: string, good: string) => {
    const y = 20 + i * 48
    return (
      <>
        <E k="rect" st={[{ ...rect(196, y, 112, 40, 8), fill: "var(--v-surface)", stroke: "var(--v-line)", sw: 1 }]} />
        <E k="circle" st={[{ x: 207, y: y + 12, r: 3, fill: "var(--v-bad)" }, ...pad(i + 1, { fill: "var(--v-good)" })]} />
        <E k="text" mono st={[{ x: 215, y: y + 14.5, fs: 7, fw: 650, fill: "var(--v-ink)" }]}>
          {file}
        </E>
        <E k="text" mono st={[{ x: 205, y: y + 30, fs: 6.4, fill: "var(--v-bad)", op: 1 }, ...pad(i + 1, { op: 0 })]}>
          {bad}
        </E>
        <E k="text" mono st={[{ x: 205, y: y + 30, fs: 6.4, fill: "var(--v-good)", op: 0 }, ...pad(i + 1, { op: 1 })]}>
          {good}
        </E>
      </>
    )
  }
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      <rect x="16" y="16" width="172" height="148" rx="10" fill="var(--v-soft)" />
      <text x="28" y="40" fontSize="11" fontWeight="650" fill="var(--v-ink)">
        Sign in
      </text>
      <rect x="156" y="26" width="20" height="20" rx="6" fill="var(--v-surface)" stroke="var(--v-line)" />
      <text x="166" y="41" fontSize="12" textAnchor="middle" fill="var(--v-mute)">
        ×
      </text>
      <E k="text" mono st={[{ x: 150, y: 52, fs: 6, fill: "var(--v-accent)", op: 0, rot: 0 }, ...pad(1, { op: 1 })]} textAnchor="end">
        aria-label="Close"
      </E>
      <E k="text" st={[{ x: 28, y: 68, fs: 8, fw: 500, fill: "var(--v-lowc)" }, ...pad(2, { fill: "var(--v-ink2)" })]}>
        Email address
      </E>
      <rect x="28" y="74" width="148" height="22" rx="6" fill="var(--v-surface)" stroke="var(--v-line)" />
      <rect x="36" y="83" width="62" height="4" rx="2" fill="var(--v-mute)" opacity=".4" />
      <E k="rect" st={[{ ...rect(28, 108, 148, 26, 7), fill: "var(--v-accent)" }]} />
      <text x="102" y="124.6" fontSize="8.5" fontWeight="600" fill="#fff" textAnchor="middle">
        Continue
      </text>
      <E k="rect" st={[{ ...rect(24, 104, 156, 34, 10), fill: "none", stroke: "var(--v-accent)", sw: 2, op: 0 }, ...pad(3, { op: 1 })]} />
      <rect x="28" y="148" width="84" height="4" rx="2" fill="var(--v-mute)" opacity=".3" />
      {mk(1, 176, 26, 1)}
      {mk(2, 122, 64, 2)}
      {mk(3, 180, 108, 3)}
      {chip(0, "IconButton.tsx:18", "no accessible name", 'aria-label="Close"')}
      {chip(1, "Field.tsx:42", "contrast 1.4 : 1", "contrast 7.2 : 1 ✓")}
      {chip(2, "Button.tsx:9", "no focus ring", ":focus-visible ring")}
    </svg>
  )
}

/** Pads a state list with empty states so that `patch` first applies at step `at`. */
function pad(at: number, patch: P): P[] {
  return [...Array.from({ length: Math.max(at - 1, 0) }, () => ({}) as P), patch]
}

/* ----------------------------------------------------------------- design tokens */

function TokensScene() {
  const swatch = [
    { c: "#171717", v: "var(--v-ink)" },
    { c: "#e879f9", v: "var(--v-ink2)" },
    { c: "#22d3ee", v: "var(--v-mute)" },
    { c: "#fb923c", v: "var(--v-lowc)" },
    { c: "#a3e635", v: "var(--v-accent)" },
  ]
  const sb = [
    { x: 150, y: 120, w: 34, h: 30, r: 15, rot: 14 },
    { x: 44, y: 98, w: 24, h: 38, r: 3, rot: -9 },
    { x: 226, y: 34, w: 42, h: 20, r: 10, rot: 6 },
    { x: 92, y: 146, w: 30, h: 18, r: 0, rot: -18 },
    { x: 196, y: 66, w: 36, h: 28, r: 12, rot: 22 },
  ]
  const btn = [
    { b: { x: 232, y: 124, w: 62, h: 18, r: 9, rot: 8 }, a: { x: 24, y: 66, w: 84, h: 26, r: 8, rot: 0 }, fill: "var(--v-ink)", bf: "#f59e0b" },
    { b: { x: 18, y: 40, w: 52, h: 30, r: 2, rot: -6 }, a: { x: 116, y: 66, w: 84, h: 26, r: 8, rot: 0 }, fill: "var(--v-soft)", bf: "#34d399" },
    { b: { x: 120, y: 80, w: 62, h: 22, r: 14, rot: 4 }, a: { x: 208, y: 66, w: 84, h: 26, r: 8, rot: 0 }, fill: "var(--v-surface)", bf: "#f472b6" },
  ]
  const cards = [
    { b: { x: 190, y: 138, w: 80, h: 28, r: 14, rot: -4 }, a: { x: 24, y: 112, w: 128, h: 50, r: 10, rot: 0 }, bf: "#818cf8" },
    { b: { x: 64, y: 132, w: 90, h: 34, r: 4, rot: 5 }, a: { x: 164, y: 112, w: 128, h: 50, r: 10, rot: 0 }, bf: "#fda4af" },
  ]
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      {swatch.map((s, i) => (
        <E
          key={i}
          k="rect"
          st={[
            { ...sb[i], fill: s.c, op: 1 },
            { ...rect(24 + i * 55, 22, 49, 26, 8), rot: 0, fill: s.v, stroke: "var(--v-line)", sw: 1 },
          ]}
          dl={i * 55}
        />
      ))}
      {btn.map((b, i) => (
        <E
          key={i}
          k="rect"
          st={[
            { ...b.b, fill: b.bf, op: 1 },
            { ...b.a, fill: b.fill, stroke: "var(--v-line)", sw: 1 },
          ]}
          dl={120 + i * 60}
        />
      ))}
      {cards.map((c, i) => (
        <E
          key={i}
          k="rect"
          st={[
            { ...c.b, fill: c.bf, op: 1 },
            { ...c.a, fill: "var(--v-soft)", stroke: "var(--v-line)", sw: 1 },
          ]}
          dl={260 + i * 70}
        />
      ))}
      {[0, 1].map((i) => (
        <React.Fragment key={i}>
          <E k="rect" st={[{ ...rect(36 + i * 140, 124, 54, 4, 2), fill: "var(--v-ink)", op: 0 }, { op: 0.8 }]} dl={600} />
          <E k="rect" st={[{ ...rect(36 + i * 140, 134, 86, 3, 1.5), fill: "var(--v-mute)", op: 0 }, { op: 0.4 }]} dl={640} />
          <E k="rect" st={[{ ...rect(36 + i * 140, 142, 64, 3, 1.5), fill: "var(--v-mute)", op: 0 }, { op: 0.4 }]} dl={680} />
        </React.Fragment>
      ))}
      <E k="text" mono st={[{ x: 24, y: 60, fs: 6, fill: "var(--v-mute)", op: 0 }, { op: 1 }]} dl={560}>
        color.ink 900 · 600 · 300 · 100 · accent
      </E>
      <E k="text" mono st={[{ x: 24, y: 104, fs: 6, fill: "var(--v-mute)", op: 0 }, { op: 1 }]} dl={600}>
        radius.md 8 · space 4 · one button
      </E>
    </svg>
  )
}

/* ----------------------------------------------------------------- timeline (media / video) */

function TimelineScene() {
  const clipFill = [0.95, 0.5, 0.75, 0.6, 0.9, 0.45, 0.7]
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      <rect x="22" y="18" width="276" height="88" rx="8" fill="var(--v-soft)" />
      {/* before: one still frame */}
      <E k="rect" st={[{ ...rect(124, 42, 72, 40, 6), fill: "none", stroke: "var(--v-line)", sw: 1.2, op: 1 }, { op: 0 }]} />
      <E k="text" st={[{ x: 160, y: 65, fs: 7.5, fill: "var(--v-mute)", op: 1 }, { op: 0 }]} textAnchor="middle">
        1 frame
      </E>
      {/* after: moving picture */}
      <E k="text" st={[{ x: 40, y: 72, fs: 22, fw: 750, fill: "var(--v-ink)", op: 0 }, { op: 1 }]} dl={250}>
        Launch day
      </E>
      <E k="rect" st={[{ ...rect(40, 82, 70, 4, 2), fill: "var(--v-mute)", op: 0 }, { op: 0.5 }]} dl={320} />
      <g className="sv-bob">
        <E k="circle" st={[{ x: 252, y: 62, r: 22, fill: "var(--v-accent)", op: 0, sc: 0.4 }, { op: 0.9, sc: 1 }]} dl={300} />
      </g>
      <E k="circle" st={[{ x: 270, y: 40, r: 7, fill: "var(--v-ink)", op: 0, sc: 0.4 }, { op: 0.8, sc: 1 }]} dl={420} />
      {/* track */}
      <rect x="22" y="112" width="276" height="1" fill="var(--v-line)" />
      {Array.from({ length: 7 }, (_, i) => (
        <E
          key={i}
          k="rect"
          st={[
            { ...rect(24 + i * 39, 122, 35, 30, 5), fill: "none", stroke: "var(--v-line)", sw: 1, op: 0.7 },
            { fill: "var(--v-accent)", stroke: "transparent", sw: 0, op: clipFill[i] },
          ]}
          dl={200 + i * 70}
        />
      ))}
      <E k="g" st={[{ op: 0 }, { op: 1 }]} dl={700}>
        <g className="sv-playhead-wrap">
          <g className="sv-playhead">
            <rect x="24" y="112" width="1.6" height="46" fill="var(--v-ink)" />
            <path d="M20.3 108 H29.3 L24.8 114 Z" fill="var(--v-ink)" />
          </g>
        </g>
      </E>
    </svg>
  )
}

/* ----------------------------------------------------------------- browser */

function BrowserScene() {
  const cur = [
    { x: 262, y: 148 },
    { x: 120, y: 86 },
    { x: 124, y: 114 },
    { x: 106, y: 140 },
  ]
  const curSt: P[] = cur.map((c) => ({ x: c.x, y: c.y }))
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      <rect x="9" y="9" width="302" height="25" rx="9" fill="var(--v-soft)" />
      {[22, 32, 42].map((x) => (
        <circle key={x} cx={x} cy="21.5" r="3" fill="var(--v-lowc)" />
      ))}
      <rect x="58" y="15" width="170" height="13" rx="6.5" fill="var(--v-surface)" />
      <text x="67" y="24.2" fontSize="6.2" className="sv-mono" fill="var(--v-mute)">
        app.example.com/signup
      </text>
      <text x="60" y="58" fontSize="10.5" fontWeight="650" fill="var(--v-ink)">
        Create account
      </text>
      <rect x="60" y="66" width="30" height="3" rx="1.5" fill="var(--v-mute)" opacity=".4" />
      <rect x="60" y="72" width="200" height="18" rx="5" fill="var(--v-surface)" stroke="var(--v-line)" />
      <E k="rect" st={[{ ...rect(67, 79, 0, 4, 2), fill: "var(--v-ink)", op: 0.8 }, { w: 92 }]} dur={800} />
      <rect x="60" y="97" width="30" height="3" rx="1.5" fill="var(--v-mute)" opacity=".4" />
      <rect x="60" y="103" width="200" height="18" rx="5" fill="var(--v-surface)" stroke="var(--v-line)" />
      <E k="rect" st={[{ ...rect(67, 110, 0, 4, 2), fill: "var(--v-ink)", op: 0.8 }, {}, { w: 48 }]} dur={800} />
      <E k="rect" st={[{ ...rect(60, 130, 92, 20, 6), fill: "var(--v-accent)" }]} />
      <text x="106" y="143.4" fontSize="8" fontWeight="600" fill="#fff" textAnchor="middle">
        Sign up
      </text>
      {/* element refs the agent can address */}
      {[
        { x: 266, y: 76, label: "e1", at: 1 },
        { x: 266, y: 107, label: "e2", at: 2 },
        { x: 158, y: 134, label: "e3", at: 3 },
      ].map((r) => (
        <React.Fragment key={r.label}>
          <E k="rect" st={[{ ...rect(r.x, r.y, 18, 11, 3.5), fill: "var(--v-accent)", op: 0, sc: 0.7 }, ...pad(r.at, { op: 0.16, sc: 1 })]} />
          <E k="text" mono st={[{ x: r.x + 9, y: r.y + 8, fs: 6.6, fw: 650, fill: "var(--v-accent)", op: 0 }, ...pad(r.at, { op: 1 })]} textAnchor="middle">
            {r.label}
          </E>
        </React.Fragment>
      ))}
      <E k="rect" st={[{ ...rect(192, 132, 104, 22, 7), fill: "var(--v-good)", op: 0, sc: 0.9 }, {}, {}, { op: 1, sc: 1 }]} />
      <E k="text" st={[{ x: 244, y: 146, fs: 7.6, fw: 650, fill: "#fff", op: 0 }, {}, {}, { op: 1 }]} textAnchor="middle">
        ✓ Account created
      </E>
      <E k="g" st={curSt} dur={750} dl={40}>
        <path d="M0 0 L0 14 L3.7 10.8 L6.2 16.6 L8.5 15.6 L6 10 L10.8 9.8 Z" fill="var(--v-ink)" stroke="var(--v-surface)" strokeWidth="1.2" strokeLinejoin="round" />
      </E>
    </svg>
  )
}


/* ----------------------------------------------------------------- performance waterfall */

function PerfScene() {
  const rows = ["html", "css", "js", "api", "img"]
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      {rows.map((r, i) => (
        <React.Fragment key={r}>
          <text x="20" y={40 + i * 23} fontSize="6.6" className="sv-mono" fill="var(--v-mute)">
            {r}
          </text>
          <rect x="44" y={30 + i * 23} width="256" height="1" fill="var(--v-line)" opacity=".6" />
          <E
            k="rect"
            st={[
              { ...rect(44 + i * 42, 33 + i * 23, 84, 12, 3), fill: i === 0 ? "var(--v-ink)" : "var(--v-accent)", op: i === 0 ? 0.9 : 0.85 },
              { x: i === 0 ? 44 : 114, w: i === 0 ? 70 : 20 - (i % 2) * 4 },
            ]}
            dl={i * 70}
          />
        </React.Fragment>
      ))}
      <E k="rect" st={[{ ...rect(294, 26, 1.5, 114, 0), fill: "var(--v-bad)" }, { x: 134, fill: "var(--v-good)" }]} dur={800} dl={200} />
      <E k="text" st={[{ x: 294, y: 152, fs: 9, fw: 700, fill: "var(--v-bad)", op: 1 }, { x: 134, op: 0 }]} textAnchor="middle" dur={800} dl={200}>
        3.2 s
      </E>
      <E k="text" st={[{ x: 134, y: 152, fs: 9, fw: 700, fill: "var(--v-good)", op: 0 }, { op: 1 }]} textAnchor="middle" dl={600}>
        1.1 s
      </E>
      <text x="20" y="162" fontSize="6.4" fill="var(--v-mute)">
        Largest Contentful Paint
      </text>
    </svg>
  )
}

/* ----------------------------------------------------------------- chart */

function ChartScene() {
  const data = [40, 62, 48, 78, 66, 104, 88]
  const rainbow = ["#ef4444", "#f59e0b", "#84cc16", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6"]
  const bw = [30, 22, 34, 26, 32, 20, 28]
  const base = 150
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect x="8" y="8" width="304" height="164" rx="10" fill="var(--v-surface)" stroke="var(--v-line)" />
      {[0, 1, 2, 3, 4].map((i) => (
        <E
          key={i}
          k="rect"
          st={[
            { ...rect(28, base - i * 32, 270, 1.6, 0), fill: "var(--v-ink)", op: 0.55 },
            { h: 1, fill: "var(--v-line)", op: i === 0 || i === 2 ? 1 : 0 },
          ]}
          dl={i * 30}
        />
      ))}
      {data.map((v, i) => {
        const hi = i === 5
        return (
          <E
            key={i}
            k="rect"
            st={[
              { ...rect(36 + i * 38 + (i % 2) * 3, base - v, bw[i], v, 0), fill: rainbow[i], stroke: "var(--v-ink)", sw: 1.2, op: 1 },
              { ...rect(40 + i * 36, base - v, 22, v, 4), fill: hi ? "var(--v-accent)" : "var(--v-ink)", stroke: "transparent", sw: 0, op: hi ? 1 : 0.2 },
            ]}
            dl={60 + i * 45}
          />
        )
      })}
      {/* before: legend clutter */}
      {rainbow.slice(0, 4).map((c, i) => (
        <E key={c} k="g" st={[{ op: 1, x: 0, y: 0 }, { op: 0 }]}>
          <rect x="34" y={18 + i * 9} width="6" height="6" fill={c} stroke="var(--v-ink)" strokeWidth=".6" />
          <rect x="44" y={19.5 + i * 9} width={18 + (i % 2) * 8} height="3" rx="1.5" fill="var(--v-mute)" opacity=".6" />
        </E>
      ))}
      {/* after: title, direct label, axis */}
      <E k="text" st={[{ x: 28, y: 24, fs: 8.5, fw: 650, fill: "var(--v-ink)", op: 0 }, { op: 1 }]} dl={380}>
        Signups per day
      </E>
      <E k="text" st={[{ x: 211, y: 42, fs: 10, fw: 750, fill: "var(--v-accent)", op: 0, sc: 0.8 }, { op: 1, sc: 1 }]} textAnchor="middle" dl={520}>
        +38%
      </E>
      {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
        <E key={i} k="text" st={[{ x: 51 + i * 36, y: 163, fs: 6.4, fill: "var(--v-mute)", op: 0 }, { op: 1 }]} textAnchor="middle" dl={460}>
          {l}
        </E>
      ))}
    </svg>
  )
}

/* ----------------------------------------------------------------- copy (HTML) */

function CopyScene({ before, after }: { before: string; after: string }) {
  const { step, reduced } = React.useContext(Ctx)
  const fin = step >= 1
  const bw = before.split(/\s+/).filter(Boolean)
  const aw = after.split(/\s+/).filter(Boolean)
  const tr = (delay: number, props: string) => (reduced ? "none" : `${props} 520ms ${EASE} ${delay}ms`)
  return (
    <div className="absolute inset-2 flex flex-col justify-center gap-3 rounded-[10px] bg-[var(--v-surface)] px-[6%] py-3 shadow-[0_0_0_1px_var(--v-line)]">
      <div>
        <div className="mb-1 text-[10px] font-semibold tracking-wide text-[var(--v-bad)] uppercase">Without</div>
        <p className="text-[length:clamp(12px,3.6cqw,16px)] leading-snug text-[var(--v-ink2)]">
          {bw.map((w, i) => (
            <span
              key={i}
              className="mr-[0.28em] inline-block"
              style={{
                color: fin ? "var(--v-mute)" : undefined,
                backgroundImage: "linear-gradient(var(--v-bad),var(--v-bad))",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "0 58%",
                backgroundSize: fin ? "100% 1.6px" : "0% 1.6px",
                transition: tr(i * 60, "background-size, color"),
              }}
            >
              {w}
            </span>
          ))}
        </p>
      </div>
      <div className="h-px bg-[var(--v-line)]" />
      <div>
        <div className="mb-1 text-[10px] font-semibold tracking-wide text-[var(--v-good)] uppercase">With the skill</div>
        <p className="min-h-[1.4em] text-[length:clamp(13px,4.2cqw,19px)] leading-snug font-semibold tracking-tight text-[var(--v-ink)]">
          {aw.map((w, i) => (
            <span
              key={i}
              className="mr-[0.28em] inline-block"
              style={{
                opacity: fin ? 1 : 0,
                transform: fin ? "none" : "translateY(5px)",
                filter: fin ? "none" : "blur(3px)",
                transition: tr(320 + i * 90, "opacity, transform, filter"),
              }}
            >
              {w}
            </span>
          ))}
          <span className={cn("ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-[var(--v-accent)]", fin ? "sv-caret" : "opacity-0")} />
        </p>
      </div>
      <div
        className="absolute right-3 bottom-2 rounded-full bg-[var(--v-soft)] px-2 py-0.5 text-[10px] tabular-nums text-[var(--v-mute)]"
        style={{ opacity: fin ? 1 : 0, transition: tr(500, "opacity") }}
      >
        {bw.length} → {aw.length} words
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- 3D (HTML, preserve-3d) */

function ThreeScene() {
  const { step, reduced } = React.useContext(Ctx)
  const on = step >= 1
  const T = reduced ? "none" : "background 700ms, border-color 700ms, box-shadow 700ms, opacity 700ms"
  const shade = (o: number, light = false) => `linear-gradient(rgb(${light ? "255 255 255" : "0 0 0"}/${o}),rgb(${light ? "255 255 255" : "0 0 0"}/${o})),var(--v-accent)`
  const faces: [string, string, string][] = [
    ["translateZ(var(--s))", shade(0.0), "front"],
    ["rotateY(180deg) translateZ(var(--s))", shade(0.38), "back"],
    ["rotateY(90deg) translateZ(var(--s))", shade(0.2), "right"],
    ["rotateY(-90deg) translateZ(var(--s))", shade(0.3), "left"],
    ["rotateX(90deg) translateZ(var(--s))", shade(0.28, true), "top"],
    ["rotateX(-90deg) translateZ(var(--s))", shade(0.5), "bottom"],
  ]
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden" style={{ perspective: "70cqw", "--s": "11cqw" } as React.CSSProperties}>
      <div
        className="absolute bottom-[17%] h-[7%] w-[34%] rounded-[50%] bg-black/30 blur-[6px] dark:bg-black/60"
        style={{ opacity: on ? 1 : 0, transition: reduced ? "none" : "opacity 700ms" }}
      />
      <div className={cn("sv-orbit absolute h-[46cqw] w-[46cqw] rounded-full border border-dashed", on && "is-after")} style={{ borderColor: "var(--v-accent)", opacity: on ? 0.55 : 0, transform: "rotateX(72deg)", transition: reduced ? "none" : "opacity 700ms" }} />
      <div
        className={cn("sv-cube relative h-[22cqw] w-[22cqw]", on && "is-after")}
        style={{ transformStyle: "preserve-3d", transform: "rotateX(-26deg) rotateY(32deg)" }}
      >
        {faces.map(([t, bg, name]) => (
          <div
            key={name}
            className="absolute inset-0 rounded-[1.2cqw]"
            style={{
              transform: t,
              background: on ? bg : "var(--v-soft)",
              border: "1px solid",
              borderColor: on ? "rgb(255 255 255/.25)" : "var(--v-line)",
              boxShadow: on ? "inset 0 0 0 1px rgb(255 255 255/.06)" : "none",
              backfaceVisibility: "visible",
              transition: T,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- public component */

export function SkillVisual({
  id,
  kind,
  before,
  after,
  mode = "auto",
  size = "card",
  className,
}: {
  id: string
  kind: VisualKind
  before: string
  after: string
  mode?: VisualMode
  size?: "card" | "large"
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const steps = STEPS[kind]
  const seed = React.useMemo(() => hash(id), [id])
  const { step, reduced, run, off } = useScene(ref, steps, mode, seed)
  const isAfter = step >= steps
  const accent = ACCENTS[seed % ACCENTS.length]
  const ctx = React.useMemo(() => ({ step, reduced }), [step, reduced])

  const scene =
    kind === "slop" ? <SlopScene id={uid} seed={seed >>> 3} /> :
    kind === "motion" ? <MotionScene seed={seed >>> 3} /> :
    kind === "perf" ? <PerfScene /> :
    kind === "a11y" ? <A11yScene /> :
    kind === "tokens" ? <TokensScene /> :
    kind === "timeline" ? <TimelineScene /> :
    kind === "browser" ? <BrowserScene /> :
    kind === "chart" ? <ChartScene /> :
    kind === "three" ? <ThreeScene /> :
    <CopyScene before={before} after={after} />

  return (
    <div ref={ref} className={cn("sv", run && "sv-run", off && "sv-off", className)} style={{ "--v-accent": accent } as React.CSSProperties}>
      <div
        className="sv-stage relative aspect-[16/9] overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
        style={{ containerType: "inline-size" }}
        role="img"
        aria-label={`Before: ${before}. After: ${after}.`}
      >
        <Ctx.Provider value={ctx}>{scene}</Ctx.Provider>
      </div>
      {kind !== "copy" && (
        <div className={cn("mt-2 space-y-1", size === "large" ? "text-[13px] leading-5" : "text-[12px] leading-[18px]")}>
          <CaptionRow active={!isAfter} tone="bad" label="Before" text={before} clamp={size === "card"} />
          <CaptionRow active={isAfter} tone="good" label="After" text={after} clamp={size === "card"} />
        </div>
      )}
    </div>
  )
}

function CaptionRow({ active, tone, label, text, clamp }: { active: boolean; tone: "bad" | "good"; label: string; text: string; clamp: boolean }) {
  return (
    <div className={cn("flex items-start gap-2 transition-opacity duration-500", active ? "opacity-100" : "opacity-45")}>
      <span
        className={cn(
          "mt-[3px] inline-flex h-[15px] w-[46px] shrink-0 items-center justify-center gap-1 rounded-full text-[9.5px] font-semibold tracking-wide uppercase",
          tone === "bad" ? "bg-rose-500/10 text-rose-600 dark:text-rose-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        )}
      >
        {label}
      </span>
      <span title={clamp ? text : undefined} className={cn("min-w-0 flex-1 text-neutral-600 dark:text-neutral-300", clamp && "truncate")}>{text}</span>
    </div>
  )
}

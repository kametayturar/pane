"use client"

import * as React from "react"
import { Moon, RotateCcw, Sparkles, Sun } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type TimeDialCity = {
  id: string
  /** Full name shown in the list and the centre of the dial. */
  name: string
  /** Two or three letters drawn next to its mark on the dial. */
  code: string
  /** Minutes from UTC, in steps of 15 (New York in summer is -240). */
  offset: number
}

export type TimeDialProps = {
  /** Two to five cities. Offsets are fixed: pass DST-correct values for the date in question. */
  cities: TimeDialCity[]
  /** Controlled time in UTC minutes from midnight on the reference day. May leave 0–1439 to reach adjacent days. */
  value?: number
  /** Initial time when uncontrolled. Default 0. */
  defaultValue?: number
  /** Fires with the destination as soon as the dial is released or stepped, before it comes to rest. */
  onValueChange?: (value: number) => void
  /** Controlled id of the city the dial reads in. Defaults to the first city. */
  homeId?: string
  defaultHomeId?: string
  onHomeChange?: (id: string) => void
  /** Earliest time in UTC minutes. The dial stretches past it and springs back. */
  min?: number
  /** Latest time in UTC minutes. */
  max?: number
  /** Weekday of the reference day in UTC, 0 for Sunday. Default 1 (Monday). */
  weekday?: number
  /** Clock for the readout: 12 reads 9:30 AM, 24 reads 09:30. Default 12. */
  hourCycle?: 12 | 24
  /** Local working hours in minutes from midnight, drawn as a band on the dial. Default [540, 1080]. */
  workingHours?: [start: number, end: number]
  /** Accessible name of the dial. Default "Time". */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tdl {
  --tdl-ink: oklch(.15 0 0); --tdl-surface: #fff; --tdl-work: oklch(.49 .19 150); --tdl-ease: cubic-bezier(.22, 1, .36, 1);
  --tdl-t2: color-mix(in oklab, var(--tdl-ink) 62%, transparent); --tdl-t3: color-mix(in oklab, var(--tdl-ink) 42%, transparent);
  --tdl-line: color-mix(in oklab, var(--tdl-ink) 8%, transparent); --tdl-line2: color-mix(in oklab, var(--tdl-ink) 18%, transparent);
  --tdl-fill: color-mix(in oklab, var(--tdl-ink) 4%, transparent);
  container-type: inline-size; width: 100%; max-width: 720px; margin-inline: auto; color: var(--tdl-ink); display: grid; gap: 16px;
  font-family: var(--tdl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); font-size: 14px; line-height: 1.4; letter-spacing: -.01em; -webkit-font-smoothing: antialiased }
:is(.dark, [data-theme="dark"]) .tdl { --tdl-ink: oklch(.97 0 0); --tdl-surface: #171717; --tdl-work: oklch(.74 .17 150); --tdl-line: color-mix(in oklab, var(--tdl-ink) 11%, transparent); --tdl-line2: color-mix(in oklab, var(--tdl-ink) 24%, transparent); --tdl-fill: color-mix(in oklab, var(--tdl-ink) 7%, transparent) }
.tdl *, .tdl *::before, .tdl *::after { box-sizing: border-box }
.tdl button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent }
.tdl :focus-visible { outline: 2px solid color-mix(in oklab, var(--tdl-ink) 55%, transparent); outline-offset: 2px }

.tdl-layout { display: grid; gap: 20px; align-items: center; justify-items: center }
.tdl-stage { position: relative; width: 288px; max-width: 100%; aspect-ratio: 1; border-radius: 50%; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; outline: none; flex: none }
.tdl-stage:active { cursor: grabbing }
.tdl-stage:focus-visible { outline: 2px solid color-mix(in oklab, var(--tdl-ink) 50%, transparent); outline-offset: 4px }
.tdl-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible }
.tdl-plate { fill: var(--tdl-surface) }
.tdl-work { fill: color-mix(in oklab, var(--tdl-work) 9%, transparent); stroke: color-mix(in oklab, var(--tdl-work) 22%, transparent); stroke-width: 1 }
.tdl-rim, .tdl-home-track { fill: none; stroke: var(--tdl-line); stroke-width: 1 }
.tdl-track { fill: none; stroke: var(--tdl-line2); stroke-width: 1; stroke-dasharray: 1 3; stroke-linecap: round; opacity: .7 }
.tdl-core { fill: var(--tdl-surface); stroke: var(--tdl-line); stroke-width: 1 }
.tdl-major { stroke: var(--tdl-t2); stroke-width: 1.4; stroke-linecap: round }
.tdl-hour { stroke: var(--tdl-line2); stroke-width: 1; stroke-linecap: round }
.tdl-num { fill: var(--tdl-t3); font-size: 9.5px; font-weight: 500; letter-spacing: 0; font-variant-numeric: tabular-nums }
.tdl-sweep { fill: none; stroke: color-mix(in oklab, var(--tdl-ink) 12%, transparent); stroke-width: 9; stroke-linecap: round; opacity: 0; transition: opacity .6s var(--tdl-ease) }
.tdl-sweep[data-on] { opacity: 1; transition-duration: .15s }
.tdl-hand { stroke: var(--tdl-ink); stroke-width: 2; stroke-linecap: round }
.tdl-bead { fill: var(--tdl-ink); filter: drop-shadow(0 6px 9px color-mix(in oklab, var(--tdl-ink) 12%, transparent)) drop-shadow(0 1px 2px color-mix(in oklab, var(--tdl-ink) 10%, transparent)) }
.tdl-glyph { transition: opacity .5s var(--tdl-ease), transform .6s var(--tdl-ease), filter .5s var(--tdl-ease); transform-box: fill-box; transform-origin: center; fill: none; stroke: var(--tdl-surface); stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round }
.tdl-glyph[data-g="moon"] { opacity: 0; transform: rotate(-70deg) scale(.55); filter: blur(1.2px) }
.tdl-bead-g[data-day="false"] .tdl-glyph[data-g="moon"] { opacity: 1; transform: none; filter: none }
.tdl-bead-g[data-day="false"] .tdl-glyph[data-g="sun"] { opacity: 0; transform: rotate(70deg) scale(.55); filter: blur(1.2px) }
.tdl-dot { transition: opacity .45s var(--tdl-ease) }
.tdl-dot[data-home] { opacity: 0 }
.tdl-dot circle { fill: var(--tdl-surface); stroke: var(--tdl-t2); stroke-width: 1.2; transition: fill .35s var(--tdl-ease), stroke .35s var(--tdl-ease) }
.tdl-dot[data-work] circle { fill: var(--tdl-work); stroke: var(--tdl-work) }
.tdl-code { fill: var(--tdl-t2); font-size: 8px; font-weight: 500; letter-spacing: .02em }

.tdl-center { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none }
.tdl-ci { display: grid; justify-items: center; width: 40%; text-align: center }
.tdl-rc { font-size: 12px; line-height: 15px; font-weight: 500; color: var(--tdl-t2); white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; animation: tdl-in .5s var(--tdl-ease) backwards }
.tdl-rt { --lh: 39px; display: flex; align-items: baseline; justify-content: center; margin-top: 1px; font-size: 30px; line-height: 39px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums }
.tdl-rtime { --lh: 23px }
.tdl-mer { margin-left: 4px; font-size: 12.7px; line-height: 13px; font-weight: 500; color: var(--tdl-t2); letter-spacing: 0 }
.tdl-rn { font-size: 11px; line-height: 14px; color: var(--tdl-t3); animation: tdl-in .5s var(--tdl-ease) backwards }
@keyframes tdl-in { from { opacity: 0; filter: blur(3px); transform: translateY(3px) } }

.tdl-odo { position: relative; display: inline-block; clip-path: inset(0); line-height: var(--lh, 1.4em); white-space: pre }
.tdl-odo-s { visibility: hidden; display: block }
.tdl-odo-i { position: absolute; left: 0; right: 0; top: 0; text-align: center; transition: transform .42s var(--tdl-ease), opacity .2s var(--tdl-ease), filter .2s var(--tdl-ease); opacity: 0; filter: blur(2px) }
.tdl-odo-i[data-c] { opacity: 1; filter: none }
.tdl-odo[data-end] .tdl-odo-i { text-align: right }

.tdl-listwrap { position: relative; width: 100%; max-width: 360px }
.tdl-list { position: relative; display: grid; gap: 2px; margin: 0; padding: 0; list-style: none }
.tdl-hl { position: absolute; left: 0; right: 0; top: 0; height: 56px; border-radius: 18px; background: var(--tdl-fill); box-shadow: inset 0 0 0 1px var(--tdl-line); transform: translateY(calc(var(--hi, 0) * 58px)); transition: transform .5s var(--tdl-ease); pointer-events: none }
.tdl-row { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; height: 56px; padding: 0 16px; border-radius: 18px; transition: background-color .25s var(--tdl-ease) }
.tdl-row:hover { background: color-mix(in oklab, var(--tdl-fill) 60%, transparent) }
.tdl-ri { flex: none; width: 20px; display: grid; place-items: center; color: var(--tdl-t3); transition: color .35s var(--tdl-ease) }
.tdl-ri[data-work] { color: var(--tdl-work) }
.tdl-rtx { flex: 1; min-width: 0; display: grid; gap: 0 }
.tdl-rcity { font-size: 14px; line-height: 18px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.tdl-rmeta { font-size: 12px; line-height: 16px; color: var(--tdl-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums }
.tdl-rtime { display: flex; align-items: baseline; flex: none; font-size: 18px; line-height: 23px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums }
.tdl-rtime .tdl-mer { font-size: 11px; line-height: 14px; margin-left: 3px; letter-spacing: 0; text-transform: uppercase }
.tdl-badge { margin-right: 8px; padding: 1px 7px; border-radius: 9999px; background: var(--tdl-fill); box-shadow: inset 0 0 0 1px var(--tdl-line); font-size: 11px; line-height: 16px; color: var(--tdl-t2); white-space: nowrap; font-weight: 400; letter-spacing: 0; animation: tdl-in .4s var(--tdl-ease) backwards }

.tdl-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px }
.tdl-status { font-size: 13px; line-height: 20px; color: var(--tdl-t2); font-variant-numeric: tabular-nums }
.tdl-btns { display: flex; gap: 8px; margin-left: auto }
.tdl-btn { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 9999px; font-size: 13px; font-weight: 500; line-height: 1;
  transition: background-color .25s var(--tdl-ease), opacity .25s var(--tdl-ease), transform .2s var(--tdl-ease) }
.tdl-btn[data-p] { background: var(--tdl-surface); box-shadow: 0 0 0 1px var(--tdl-line2), 0 1px 2px color-mix(in oklab, var(--tdl-ink) 6%, transparent) }
.tdl-btn[data-p]:hover { background: var(--tdl-fill) }
.tdl-btn:not([data-p]) { color: var(--tdl-t2) }
.tdl-btn:not([data-p]):hover:not(:disabled) { color: var(--tdl-ink); background: var(--tdl-fill) }
.tdl-btn:active:not(:disabled) { transform: scale(.97) }
.tdl-btn:disabled { opacity: .45; cursor: default }
.tdl-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

@container (min-width: 600px) {
  .tdl-layout { grid-template-columns: auto minmax(0, 1fr); gap: 40px; justify-items: stretch }
  .tdl-stage { justify-self: center }
  .tdl-listwrap { max-width: none }
}
@container (max-width: 360px) { .tdl-row { padding: 0 10px; gap: 8px } .tdl-rtime { font-size: 16px } .tdl-badge { display: none } }

@media (prefers-reduced-motion: reduce) {
  .tdl *, .tdl *::before, .tdl *::after { animation: none !important; transition: opacity .2s linear !important; filter: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const snap15 = (m: number) => Math.round(m / 15) * 15
const pad2 = (n: number) => String(n).padStart(2, "0")

function fmtUtc(o: number) {
  const a = Math.abs(o)
  return `UTC${o < 0 ? "−" : "+"}${Math.floor(a / 60)}${a % 60 ? ":" + pad2(a % 60) : ""}`
}
function fmtGap(d: number) {
  const a = Math.abs(d)
  return `${Math.floor(a / 60)} h${a % 60 ? ` ${a % 60} m` : ""}`
}
function hm12(local: number, hc: 12 | 24) {
  const h = mod(Math.floor(local / 60), 24)
  const m = mod(local, 60)
  if (hc === 24) return `${pad2(h)}:${pad2(m)}`
  return `${h % 12 === 0 ? 12 : h % 12}:${pad2(m)} ${h < 12 ? "AM" : "PM"}`
}
const rubber = (over: number) => {
  const c = 90
  return Math.sign(over) * c * (1 - Math.exp(-Math.abs(over) / c))
}
/** Soft quarter-hour detents: the value lingers near each quarter and moves faster between them. */
function detent(m: number) {
  const r = m / 15
  const f = Math.round(r)
  const d = r - f
  return (f + (Math.sign(d) * Math.pow(Math.abs(2 * d), 2.2)) / 2) * 15
}
const atWork = (local: number, w: [number, number]) => {
  const m = mod(local, 1440)
  return w[0] <= w[1] ? m >= w[0] && m < w[1] : m >= w[0] || m < w[1]
}
const isDay = (local: number) => {
  const m = mod(local, 1440)
  return m >= 360 && m < 1080
}
const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [150 + r * Math.sin(a), 150 - r * Math.cos(a)]
}
const angleOf = (local: number) => (local / 1440) * 360 - 180

function wedge(w: [number, number]) {
  const a0 = angleOf(w[0])
  let a1 = angleOf(w[1])
  if (a1 <= a0) a1 += 360
  const large = a1 - a0 > 180 ? 1 : 0
  const [ox0, oy0] = polar(130, a0)
  const [ox1, oy1] = polar(130, a1)
  const [ix0, iy0] = polar(60, a0)
  const [ix1, iy1] = polar(60, a1)
  return `M${ox0.toFixed(2)} ${oy0.toFixed(2)}A130 130 0 ${large} 1 ${ox1.toFixed(2)} ${oy1.toFixed(2)}L${ix1.toFixed(2)} ${iy1.toFixed(2)}A60 60 0 ${large} 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)}Z`
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = React.useState(defaultValue)
  const controlled = value !== undefined
  const set = React.useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange],
  )
  return [controlled ? value : inner, set]
}

/** A rolling digit column: items are keyed by their absolute index, so a step slides the neighbours past each other like an odometer. */
function Odo({ idx, text, lh, end }: { idx: number; text: (i: number) => string; lh?: string; end?: boolean }) {
  return (
    <span className="tdl-odo" style={lh ? ({ "--lh": lh } as React.CSSProperties) : undefined} data-end={end || undefined}>
      <span className="tdl-odo-s">{text(idx)}</span>
      {[-2, -1, 0, 1, 2].map((d) => (
        <span key={idx + d} className="tdl-odo-i" data-c={d === 0 || undefined} style={{ transform: `translateY(${d * 100}%)` }}>
          {text(idx + d)}
        </span>
      ))}
    </span>
  )
}

/** The h:mm and AM/PM columns for one city at a local time (in minutes, may be negative). */
function Clock({ local, hc }: { local: number; hc: 12 | 24 }) {
  const hi = Math.floor(local / 60)
  const mi = Math.floor(local / 15)
  const pi = Math.floor(local / 720)
  return (
    <>
      <Odo idx={hi} text={(i) => (hc === 24 ? pad2(mod(i, 24)) : String(mod(i, 12) === 0 ? 12 : mod(i, 12)))} end />
      <span>:</span>
      <Odo idx={mi} text={(i) => pad2(mod(i, 4) * 15)} />
      {hc === 12 ? (
        <span className="tdl-mer">
          <Odo idx={pi} text={(i) => (mod(i, 2) === 0 ? "AM" : "PM")} lh="1.15em" />
        </span>
      ) : null}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/** A 24-hour rotary dial for choosing a time across time zones. Every city rides the dial at its own local time, a shaded band marks working hours, and the home city reads out in the centre. */
export function TimeDial({
  cities, value, defaultValue = 0, onValueChange, homeId: homeProp, defaultHomeId, onHomeChange, min = -Infinity, max = Infinity, weekday = 1, hourCycle = 12,
  workingHours = [540, 1080], label = "Time", className,
}: TimeDialProps) {
  const uid = React.useId()
  const [initial] = React.useState(() => ({ value: snap15(value ?? defaultValue), home: homeProp ?? defaultHomeId ?? cities[0]?.id }))
  const [homeId, setHome] = useControllable<string>(homeProp, defaultHomeId ?? cities[0]?.id ?? "", onHomeChange)
  const homeIdx = Math.max(0, cities.findIndex((c) => c.id === homeId))
  const home = cities[homeIdx]

  const [q, setQ] = React.useState(() => Math.round(snap15(value ?? defaultValue) / 15))
  const T = q * 15

  const stageRef = React.useRef<HTMLDivElement>(null)
  const liveRef = React.useRef<HTMLSpanElement>(null)
  const [note, setNote] = React.useState<string | null>(null)

  const latest = React.useRef({ cities, homeIdx, min, max, workingHours, onValueChange, value, hourCycle })
  React.useLayoutEffect(() => {
    latest.current = { cities, homeIdx, min, max, workingHours, onValueChange, value, hourCycle }
  })
  const api = React.useRef<{ goTo: (t: number, dest: boolean, omega?: number) => void; homeChanged: (from: number) => void; current: () => number } | null>(null)

  /* ------------------------------ the engine ------------------------------ */

  React.useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let alive = true
    let raf = 0
    let running = false
    let last = 0
    type Mode = "rest" | "drag" | "glide" | "spring"
    const E = {
      pos: initial.value, vel: 0, mode: "rest" as Mode, target: initial.value, glideK: 4, omega: 14,
      raw: 0, lastAngle: 0, samples: [] as Array<[number, number]>, dragStart: 0, armOff: 0, armVel: 0, q: Math.round(initial.value / 15), sweepOn: false,
      dayFlag: null as boolean | null, work: [] as Array<boolean | null>,
    }

    const dots = Array.from(stage.querySelectorAll<SVGGElement>("[data-dot]"))
    const arm = stage.querySelector<SVGGElement>("[data-arm]")!
    const glyph = stage.querySelector<SVGGElement>("[data-bead]")!
    const beadG = stage.querySelector<SVGGElement>(".tdl-bead-g")!
    const sweep = stage.querySelector<SVGPathElement>("[data-sweep]")!

    const trackRadius = (cityIdx: number, homeIdx: number, n: number) => {
      const others = n - 1
      const step = others > 1 ? Math.min(11, 28 / (others - 1)) : 11
      const rank = cityIdx < homeIdx ? cityIdx : cityIdx - 1
      return 88 - rank * step
    }

    const paint = () => {
      const { cities: cs, homeIdx: hi, workingHours: wh } = latest.current
      const homeLocal = E.pos + cs[hi].offset
      const homeAng = angleOf(homeLocal)
      cs.forEach((c, i) => {
        const dot = dots[i]
        if (!dot) return
        const local = E.pos + c.offset
        const [x, y] = polar(trackRadius(i, hi, cs.length), angleOf(local))
        dot.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
        const w = atWork(Math.round(local), wh)
        if (E.work[i] !== w) {
          E.work[i] = w
          if (w) dot.setAttribute("data-work", "")
          else dot.removeAttribute("data-work")
        }
      })
      const ang = homeAng + E.armOff
      arm.setAttribute("transform", `rotate(${ang.toFixed(2)} 150 150)`)
      glyph.setAttribute("transform", `rotate(${(-ang).toFixed(2)})`)
      const day = isDay(Math.round(homeLocal))
      if (E.dayFlag !== day) {
        E.dayFlag = day
        beadG.setAttribute("data-day", String(day))
      }
      // The trail along the home track from where the drag began to where the knob is now.
      if (E.sweepOn) {
        let span = clamp(((E.pos - E.dragStart) / 1440) * 360, -359, 359)
        if (Math.abs(span) < 0.5) span = 0.5
        const a1 = homeAng
        const a0 = a1 - span
        const [x0, y0] = polar(106, a0)
        const [x1, y1] = polar(106, a1)
        sweep.setAttribute("d", `M${x0.toFixed(2)} ${y0.toFixed(2)}A106 106 0 ${Math.abs(span) > 180 ? 1 : 0} ${span > 0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`)
      }
      const nq = Math.round(E.pos / 15)
      if (nq !== E.q) {
        E.q = nq
        setQ(nq)
      }
    }

    const setSweep = (on: boolean) => {
      if (E.sweepOn === on) return
      E.sweepOn = on
      if (on) sweep.setAttribute("data-on", "")
      else sweep.removeAttribute("data-on")
    }

    const wake = () => {
      if (running || !alive) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }

    function frame(now: number) {
      if (!alive) return
      const raw = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const dt = raw
      let active = false
      if (E.mode === "drag") {
        active = true
        const { min: lo, max: hi } = latest.current
        let want = detent(E.raw)
        if (E.raw < lo) want = lo + rubber(E.raw - lo)
        else if (E.raw > hi) want = hi + rubber(E.raw - hi)
        E.pos += (want - E.pos) * (1 - Math.exp(-dt * 45))
      } else if (E.mode === "glide" || E.mode === "spring") {
        active = true
        if (E.mode === "glide") {
          const e = Math.exp(-E.glideK * dt)
          E.pos += (E.vel / E.glideK) * (1 - e)
          E.vel *= e
          if (Math.abs(E.target - E.pos) < 45 || Math.abs(E.vel) < 20) E.mode = "spring"
        }
        if (E.mode === "spring") {
          const w = E.omega
          const x = E.pos - E.target
          const k = Math.exp(-w * dt)
          const nx = (x + (E.vel + w * x) * dt) * k
          E.vel = (E.vel - w * (E.vel + w * x) * dt) * k
          E.pos = E.target + nx
          if (Math.abs(nx) < 0.04 && Math.abs(E.vel) < 0.8) {
            E.pos = E.target
            E.vel = 0
            E.mode = "rest"
          }
        }
      }
      if (E.armOff !== 0 || E.armVel !== 0) {
        active = true
        const w = 12
        const k = Math.exp(-w * dt)
        const x = E.armOff
        E.armOff = (x + (E.armVel + w * x) * dt) * k
        E.armVel = (E.armVel - w * (E.armVel + w * x) * dt) * k
        if (Math.abs(E.armOff) < 0.02 && Math.abs(E.armVel) < 0.2) {
          E.armOff = 0
          E.armVel = 0
        }
      }
      paint()
      if (active) raf = requestAnimationFrame(frame)
      else {
        running = false
        setSweep(false)
        announce()
      }
    }

    let announceTimer = 0
    const announce = () => {
      window.clearTimeout(announceTimer)
      announceTimer = window.setTimeout(() => {
        const { cities: cs, homeIdx: hi, hourCycle: hc } = latest.current
        const homeDay = Math.floor((E.pos + cs[hi].offset) / 1440)
        const parts = cs
          .filter((_, i) => i !== hi)
          .map((c) => {
            const l = Math.round(E.pos + c.offset)
            const dd = Math.floor(l / 1440) - homeDay
            return `${c.name} ${hm12(l, hc)}${dd > 0 ? ", next day" : dd < 0 ? ", previous day" : ""}`
          })
        if (liveRef.current) liveRef.current.textContent = parts.join(". ")
      }, 450)
    }

    const bounds = (t: number) => clamp(t, latest.current.min, latest.current.max)
    const goTo = (t: number, dest: boolean, omega = 14) => {
      const T2 = bounds(snap15(t))
      E.target = T2
      E.omega = omega
      if (dest) latest.current.onValueChange?.(T2)
      if (reduce) {
        E.pos = T2
        E.vel = 0
        E.mode = "rest"
        E.armOff = 0
        paint()
        return
      }
      E.mode = "spring"
      if (Math.abs(T2 - E.pos) > 40) setSweep(true)
      E.dragStart = E.pos
      wake()
    }

    /* ----- pointer ----- */
    const angleAt = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      return { deg: (Math.atan2(dx, -dy) * 180) / Math.PI, dist: Math.hypot(dx, dy) / (r.width / 2) }
    }
    const norm = (d: number) => mod(d + 180, 360) - 180
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      stage.setPointerCapture(e.pointerId)
      const { deg, dist } = angleAt(e)
      if (dist < 0.3) return // the centre is only a readout
      const { cities: cs, homeIdx: hi } = latest.current
      const homeAng = angleOf(E.pos + cs[hi].offset)
      const grab = norm(deg - homeAng)
      E.raw = E.pos + (Math.abs(grab) < 24 ? 0 : (grab / 360) * 1440)
      E.lastAngle = deg
      E.dragStart = E.pos
      E.samples = [[performance.now(), E.raw]]
      E.mode = "drag"
      E.vel = 0
      setSweep(true)
      wake()
    }
    const move = (e: PointerEvent) => {
      if (E.mode !== "drag") return
      const { deg } = angleAt(e)
      E.raw += (norm(deg - E.lastAngle) / 360) * 1440
      E.lastAngle = deg
      const now = performance.now()
      E.samples.push([now, E.raw])
      while (E.samples.length > 2 && now - E.samples[0][0] > 90) E.samples.shift()
      if (reduce) {
        E.pos = bounds(detent(E.raw))
        paint()
      }
    }
    const up = (e: PointerEvent) => {
      if (E.mode !== "drag") return
      if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId)
      const s = E.samples
      const dtS = Math.max(16, s[s.length - 1][0] - s[0][0]) / 1000
      const v = (s[s.length - 1][1] - s[0][1]) / dtS // minutes per second
      const { min: lo, max: hi } = latest.current
      if (reduce || Math.abs(v) < 160 || E.raw < lo || E.raw > hi) {
        goTo(E.raw, true, E.raw < lo || E.raw > hi ? 12 : 18)
        return
      }
      // Flick: an exponential glide solved to land on a quarter hour, then a spring takes over.
      const k0 = 3.4
      const dest = bounds(snap15(E.pos + v / k0))
      const dist = dest - E.pos
      latest.current.onValueChange?.(dest)
      if (dist === 0 || Math.sign(dist) !== Math.sign(v)) {
        goTo(dest, false, 16)
        return
      }
      E.target = dest
      E.vel = v
      E.glideK = clamp(v / dist, 2, 9)
      E.omega = 14
      E.mode = "glide"
      wake()
    }
    const key = (e: KeyboardEvent) => {
      const base = E.mode === "spring" || E.mode === "glide" ? E.target : snap15(E.pos)
      let t: number | null = null
      const { cities: cs, homeIdx: hi } = latest.current
      switch (e.key) {
        case "ArrowRight": case "ArrowUp": t = base + 15; break
        case "ArrowLeft": case "ArrowDown": t = base - 15; break
        case "PageUp": t = base + 60; break
        case "PageDown": t = base - 60; break
        case "Home": t = Math.floor((base + cs[hi].offset) / 1440) * 1440 - cs[hi].offset; break
        case "End": t = Math.floor((base + cs[hi].offset) / 1440) * 1440 - cs[hi].offset + 1425; break
      }
      if (t === null) return
      e.preventDefault()
      E.dragStart = E.pos
      goTo(t, true, 18)
    }
    stage.addEventListener("pointerdown", down)
    stage.addEventListener("pointermove", move)
    stage.addEventListener("pointerup", up)
    stage.addEventListener("pointercancel", up)
    stage.addEventListener("keydown", key)

    api.current = {
      goTo: (t, dest, omega) => goTo(t, dest, omega),
      current: () => E.target,
      homeChanged: (from) => {
        // The knob swings from the old home's mark to the new home's mark, the short way round.
        const { cities: cs, homeIdx: hi } = latest.current
        const a = angleOf(E.pos + cs[from].offset) - angleOf(E.pos + cs[hi].offset)
        E.armOff = reduce ? 0 : norm(a)
        E.armVel = 0
        wake()
        paint()
      },
    }
    paint()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.clearTimeout(announceTimer)
      stage.removeEventListener("pointerdown", down)
      stage.removeEventListener("pointermove", move)
      stage.removeEventListener("pointerup", up)
      stage.removeEventListener("pointercancel", up)
      stage.removeEventListener("keydown", key)
      api.current = null
    }
  }, [cities.length, initial.value])

  // Repaint and swing the knob when the home city changes.
  const prevHome = React.useRef(homeIdx)
  React.useLayoutEffect(() => {
    if (prevHome.current !== homeIdx) {
      const from = prevHome.current
      prevHome.current = homeIdx
      api.current?.homeChanged(from)
    }
  }, [homeIdx])

  // A value from outside spins the dial to it.
  React.useEffect(() => {
    if (value === undefined) return
    const t = snap15(value)
    if (t !== api.current?.current()) api.current?.goTo(t, false, 12)
  }, [value])

  /* ------------------------------- the view ------------------------------- */

  const work = workingHours
  const homeLocal = T + (home?.offset ?? 0)
  const homeDayIdx = Math.floor(homeLocal / 1440)
  const wdName = (local: number) => WEEKDAYS[mod(weekday + Math.floor(local / 1440), 7)]
  const rows = cities.map((c) => {
    const local = T + c.offset
    return { c, local, work: atWork(local, work), day: isDay(local), dd: Math.floor(local / 1440) - homeDayIdx }
  })
  const atWorkCount = rows.filter((r) => r.work).length
  const bestOverlap = () => {
    let best = T
    let bestScore = -1
    for (let d = -96; d <= 96; d++) {
      const t = T + d * 15
      if (t < min || t > max) continue
      const score = cities.filter((c) => atWork(t + c.offset, work)).length
      if (score > bestScore || (score === bestScore && Math.abs(d) < Math.abs((best - T) / 15))) {
        best = t
        bestScore = score
      }
    }
    return { t: best, score: bestScore }
  }
  const findOverlap = () => {
    const { t, score } = bestOverlap()
    if (t === T) {
      setNote(score === 0 ? "No shared working hours" : "Already the best overlap")
      return
    }
    setNote(null)
    api.current?.goTo(t, true, 5.5)
  }
  const atInitial = T === initial.value && homeId === initial.home
  const reset = () => {
    setNote(null)
    if (homeId !== initial.home && initial.home) setHome(initial.home)
    api.current?.goTo(initial.value, true, 7)
  }

  const trackCount = Math.max(0, cities.length - 1)
  const trackR = (i: number) => {
    const step = trackCount > 1 ? Math.min(11, 28 / (trackCount - 1)) : 11
    return 88 - i * step
  }
  const numerals: Array<[string, number, number, "start" | "middle" | "end"]> =
    hourCycle === 12
      ? [["Noon", 150, 30, "middle"], ["6 PM", 266, 153, "end"], ["12 AM", 150, 276, "middle"], ["6 AM", 34, 153, "start"]]
      : [["12", 150, 30, "middle"], ["18", 266, 153, "end"], ["00", 150, 276, "middle"], ["06", 34, 153, "start"]]
  const homeText = hm12(Math.round(homeLocal), hourCycle)
  const valueText = `${homeText}, ${wdName(homeLocal)}, ${home?.name}`
  const status = note ?? `${atWorkCount} of ${cities.length} offices at work`

  return (
    <div className={cn("tdl", className)}>
      <style href="tdl" precedence="default">
        {CSS}
      </style>
      <div className="tdl-layout">
        <div
          ref={stageRef}
          className="tdl-stage"
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={1425}
          aria-valuenow={mod(Math.round(homeLocal), 1440)}
          aria-valuetext={valueText}
          aria-describedby={`${uid}-hint`}
        >
          <svg className="tdl-svg" viewBox="0 0 300 300" aria-hidden="true" focusable="false">
            <circle className="tdl-plate" cx="150" cy="150" r="146" />
            <path className="tdl-work" d={wedge(work)} />
            <circle className="tdl-rim" cx="150" cy="150" r="146" />
            <circle className="tdl-home-track" cx="150" cy="150" r="106" />
            {Array.from({ length: trackCount }, (_, i) => (
              <circle key={i} className="tdl-track" cx="150" cy="150" r={trackR(i)} />
            ))}
            <circle className="tdl-core" cx="150" cy="150" r="56" />
            {Array.from({ length: 24 }, (_, i) => (
              <line key={i} className={i % 6 === 0 ? "tdl-major" : "tdl-hour"} x1="150" y1="9" x2="150" y2={i % 6 === 0 ? 16 : 13} transform={`rotate(${i * 15} 150 150)`} />
            ))}
            {numerals.map(([t, x, y, a]) => (
              <text key={t} className="tdl-num" x={x} y={y} textAnchor={a} dominantBaseline="middle">
                {t}
              </text>
            ))}
            <path className="tdl-sweep" data-sweep d="M150 44A106 106 0 0 1 150 44" />
            {cities.map((c, i) => (
              <g key={c.id} className="tdl-dot" data-dot={i} data-home={i === homeIdx || undefined}>
                <circle r="3.4" />
                <text className="tdl-code" y="11" textAnchor="middle">
                  {c.code}
                </text>
              </g>
            ))}
            <g data-arm>
              <line className="tdl-hand" x1="150" y1="92" x2="150" y2="60" />
              <g transform="translate(150 44)">
                <circle className="tdl-bead" r="15.5" />
                <g data-bead>
                  <g className="tdl-bead-g" data-day="true">
                    <g transform="translate(-7 -7) scale(.5833)">
                      <g className="tdl-glyph" data-g="sun">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </g>
                      <g className="tdl-glyph" data-g="moon">
                        <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          <div className="tdl-center" aria-hidden="true">
            <div className="tdl-ci">
              <span className="tdl-rc" key={home?.id}>
                {home?.name}
              </span>
              <span className="tdl-rt">
                <Clock local={Math.round(homeLocal)} hc={hourCycle} />
              </span>
              <span className="tdl-rn" key={wdName(homeLocal)}>
                {wdName(homeLocal)}
              </span>
            </div>
          </div>
        </div>

        <div className="tdl-listwrap" style={{ "--hi": homeIdx } as React.CSSProperties}>
          <span className="tdl-hl" aria-hidden="true" />
          <ul className="tdl-list">
            {rows.map(({ c, local, work: w, day, dd }, i) => {
              const gap = c.offset - (home?.offset ?? 0)
              return (
                <li key={c.id}>
                  <button type="button" className="tdl-row" aria-pressed={i === homeIdx} aria-label={`${c.name}, ${hm12(Math.round(local), hourCycle)}${dd > 0 ? ", next day" : dd < 0 ? ", previous day" : ""}`} onClick={() => i !== homeIdx && setHome(c.id)}>
                    <span className="tdl-ri" data-work={w || undefined} aria-hidden="true">
                      {day ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
                    </span>
                    <span className="tdl-rtx">
                      <span className="tdl-rcity">{c.name}</span>
                      <span className="tdl-rmeta">{i === homeIdx ? `Home · ${fmtUtc(c.offset)}` : `${fmtUtc(c.offset)} · ${gap === 0 ? "same time" : `${fmtGap(gap)} ${gap > 0 ? "ahead" : "behind"}`}`}</span>
                    </span>
                    {dd !== 0 && i !== homeIdx ? (
                      <span className="tdl-badge" key={dd}>
                        {dd > 0 ? "+" : "−"}
                        {Math.abs(dd)} day
                      </span>
                    ) : null}
                    <span className="tdl-rtime" aria-hidden="true">
                      <Clock local={local} hc={hourCycle} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="tdl-foot">
        <span className="tdl-status">{status}</span>
        <span className="tdl-btns">
          <button type="button" className="tdl-btn" data-p onClick={findOverlap}>
            <Sparkles size={14} aria-hidden="true" />
            Find overlap
          </button>
          <button type="button" className="tdl-btn" onClick={reset} disabled={atInitial}>
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
        </span>
      </div>
      <span id={`${uid}-hint`} className="tdl-sr">
        Drag around the dial or use the arrow keys to move in 15 minute steps. Page Up and Page Down move by an hour.
      </span>
      <span className="tdl-sr" role="status" aria-live="polite" ref={liveRef} />
    </div>
  )
}

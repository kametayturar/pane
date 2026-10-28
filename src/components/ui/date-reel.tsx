"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DateReelMode = "datetime" | "date" | "time"

export type DateReelPreset = {
  label: string
  /** A fixed date, or a function of today's date. */
  value: Date | ((today: Date) => Date)
}

export type DateReelLabels = {
  day?: string
  month?: string
  date?: string
  year?: string
  hour?: string
  minute?: string
  period?: string
  /** Joins the relative day and the time in the summary. Default "at". */
  at?: string
  /** Name of the quick picks group. */
  presets?: string
  /** Word for today's entry. Default "Today". */
  today?: string
  confirm?: string
  confirming?: string
  confirmed?: string
  retry?: string
}

export type DateReelProps = {
  /** Which reels to show: day, hour, minute and AM/PM; month, day and year; or time only. Default `datetime`. */
  mode?: DateReelMode
  /** Controlled value. When it changes from outside, every reel spins to it along the short way around. */
  value?: Date
  /** Starting value when uncontrolled. Pass a fixed date so server and client agree. */
  defaultValue?: Date
  /** Called once when the reels come to rest on a new moment, not on every frame. */
  onChange?: (value: Date) => void
  /** Start of today, for the Today entry and relative words. Default: the day of the first value. */
  today?: Date
  /** Earliest selectable day. The day and year reels stop here with a rubber band. */
  minDate?: Date
  /** Latest selectable day. */
  maxDate?: Date
  /** Minutes between entries on the minute reel. Default 5. */
  minuteStep?: 1 | 5 | 10 | 15 | 30
  /** 12-hour clock with an AM/PM reel, or 24-hour. Default 12. */
  hourCycle?: 12 | 24
  /** BCP 47 locale for names, time format and relative phrases. Default "en-US". */
  locale?: string
  /** Quick picks under the reels. `false` hides them. Default: This evening, Tomorrow, Monday (datetime mode). */
  presets?: DateReelPreset[] | false
  /** Optional heading above the summary. */
  title?: string
  /** Adds a primary button. Return a promise to show pending, success and failure in place. */
  onConfirm?: (value: Date) => void | Promise<void>
  /** Words for localisation. */
  labels?: DateReelLabels
  /** Spin the reels into place the first time the picker scrolls into view. Default true. */
  intro?: boolean
  /** Multiplies the speed of glides, snaps and the intro. Default 1. */
  speed?: number
  /** Stops automatic motion. Reels still follow a drag and land on the nearest entry at once. */
  paused?: boolean
  /** Any CSS colour for the focused reel in the lens and the chosen quick pick. */
  accent?: string
  /** Accessible name of the picker group. Default "Date and time". */
  label?: string
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dre {
  --dre-ink: oklch(.15 0 0); --dre-surface: #fff; --dre-accent: oklch(.55 .2 262); --dre-ease: cubic-bezier(.22, 1, .36, 1);
  --dre-t2: color-mix(in oklab, var(--dre-ink) 62%, transparent); --dre-t3: color-mix(in oklab, var(--dre-ink) 42%, transparent);
  --dre-line: color-mix(in oklab, var(--dre-ink) 9%, transparent); --dre-fill: color-mix(in oklab, var(--dre-ink) 4%, transparent);
  container-type: inline-size; width: 100%; max-width: 398px; margin-inline: auto; background: var(--dre-surface); color: var(--dre-ink);
  border: 1px solid var(--dre-line); border-radius: 34px;
  font-family: var(--dre-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); -webkit-font-smoothing: antialiased; letter-spacing: -.01em }
:is(.dark, [data-theme="dark"]) .dre { --dre-ink: oklch(.97 0 0); --dre-surface: #171717; --dre-accent: oklch(.72 .15 262); --dre-line: color-mix(in oklab, var(--dre-ink) 12%, transparent); --dre-fill: color-mix(in oklab, var(--dre-ink) 7%, transparent) }
.dre *, .dre *::before, .dre *::after { box-sizing: border-box }
.dre button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
.dre :focus-visible { outline: 2px solid color-mix(in oklab, var(--dre-accent) 70%, transparent); outline-offset: 2px }
.dre-body { --dre-row: 36px; --dre-fs: 18px; display: grid; gap: 16px; padding: 16px }
@container (max-width: 340px) { .dre-body { --dre-row: 32px; --dre-fs: 16px; padding: 12px } }

.dre-head { display: grid; gap: 4px; padding: 0 4px }
.dre-title { margin: 0; font-size: 14px; line-height: 15.4px; font-weight: 400; letter-spacing: -.03em; color: var(--dre-t2) }
.dre-sum { display: grid; gap: 2px; margin: 0 }
.dre-headline { font-size: 22px; line-height: 27.5px; font-weight: 500; font-variant-numeric: tabular-nums; min-height: 27.5px }
.dre-detail { font-size: 14px; line-height: 19.6px; color: var(--dre-t2); font-variant-numeric: tabular-nums; min-height: 19.6px }

.dre-stage { position: relative; height: calc(var(--dre-row) * 5.6); -webkit-mask-image: linear-gradient(to bottom, transparent, #000 24%, #000 76%, transparent); mask-image: linear-gradient(to bottom, transparent, #000 24%, #000 76%, transparent) }
.dre-lens { position: absolute; left: 0; right: 0; top: 50%; height: var(--dre-row); margin-top: calc(var(--dre-row) * -.5); border-radius: 12px; background: color-mix(in oklab, var(--dre-fill) 100%, transparent);
  box-shadow: inset 0 0 0 1px var(--dre-line), inset 0 1px 0 rgb(255 255 255 / .7), 0 1px 2px rgb(0 0 0 / .035) }
:is(.dark, [data-theme="dark"]) .dre-lens { box-shadow: inset 0 0 0 1px var(--dre-line), inset 0 1px 0 rgb(255 255 255 / .06) }
.dre-reels { position: absolute; inset: 0; display: flex; justify-content: center }
.dre-reel { position: relative; width: calc(var(--w, 40) * 1px + 16px); height: 100%; cursor: grab; touch-action: pan-x; user-select: none; -webkit-user-select: none; outline: none;
  font-size: var(--dre-fs); font-variant-numeric: tabular-nums; flex: none }
.dre-reel:active { cursor: grabbing }
.dre-reel:focus-visible { outline: none }
.dre-reel:focus-visible::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: var(--dre-row); margin-top: calc(var(--dre-row) * -.5); border-radius: 12px; box-shadow: 0 0 0 2px color-mix(in oklab, var(--dre-accent) 55%, transparent); pointer-events: none }
.dre-drum, .dre-win-in { position: absolute; inset: 0 }
.dre-win { position: absolute; left: 0; right: 0; top: 50%; height: var(--dre-row); margin-top: calc(var(--dre-row) * -.5); overflow: hidden; pointer-events: none }
.dre-win-in { top: 50%; bottom: auto; height: 0 }
.dre-i { position: absolute; left: 0; right: 0; top: 50%; height: var(--dre-row); margin-top: calc(var(--dre-row) * -.5); line-height: var(--dre-row); text-align: center; white-space: nowrap; opacity: 0;
  color: var(--dre-t2); will-change: transform, opacity }
.dre-win .dre-i { color: var(--dre-ink); font-weight: 500 }
.dre-reel:focus-visible .dre-win .dre-i { color: var(--dre-accent) }
.dre-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

.dre-presets { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 16px; border-top: 1px solid var(--dre-line); margin-top: -2px }
.dre-preset { flex: 1 1 auto; height: 36px; padding: 0 12px; border-radius: 9999px; border: 1px solid var(--dre-line) !important; font-size: 14px; line-height: 19.6px; color: var(--dre-t2);
  transition: background-color .25s var(--dre-ease), color .25s var(--dre-ease), border-color .25s var(--dre-ease), transform .2s var(--dre-ease) }
.dre-preset:hover { color: var(--dre-ink); background: var(--dre-fill) }
.dre-preset:active { transform: scale(.97) }
.dre-preset[aria-pressed="true"] { color: var(--dre-ink); background: color-mix(in oklab, var(--dre-accent) 10%, transparent); border-color: color-mix(in oklab, var(--dre-accent) 40%, transparent) !important }
.dre-confirm { position: relative; display: block; width: 100%; height: 44px; padding: 0 16px; border-radius: 9999px; background: oklch(.33 0 0); color: #fff; font-size: 14px; line-height: 19.6px; font-weight: 500;
  transition: transform .2s var(--dre-ease), background-color .3s var(--dre-ease) }
:is(.dark, [data-theme="dark"]) .dre-confirm { background: oklch(.95 0 0); color: oklch(.2 0 0) }
.dre-confirm:active { transform: scale(.985) }
.dre-confirm[data-phase="error"] { background: oklch(.5 .19 25) }
:is(.dark, [data-theme="dark"]) .dre-confirm[data-phase="error"] { background: oklch(.62 .19 25); color: #fff }
.dre-cs { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; opacity: 0; filter: blur(3px); transform: translateY(4px); transition: opacity .3s var(--dre-ease), filter .3s var(--dre-ease), transform .3s var(--dre-ease); pointer-events: none }
.dre-cs[data-on] { opacity: 1; filter: none; transform: none }
.dre-spin { animation: dre-rot .8s linear infinite }
@keyframes dre-rot { to { transform: rotate(360deg) } }
@container (max-width: 480px) { .dre-preset { min-width: 0 } .dre-confirm { height: 44px } }

@media (prefers-reduced-motion: reduce) {
  .dre *, .dre *::before, .dre *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5)
const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
const cap = (s: string) => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s)

type ReelId = "day" | "month" | "date" | "year" | "hour" | "minute" | "period"
type Idx = Partial<Record<ReelId, number>>

type ReelSpec = {
  id: ReelId
  name: string
  n: number
  /** Cyclic reels wrap around (hours, minutes, months); the others stop at both ends with a rubber band. */
  cyclic: boolean
  text: (i: number) => string
  /** Entries a PageUp / PageDown press moves. */
  page: number
}

type Config = {
  mode: DateReelMode
  today: Date
  min: Date
  max: Date
  step: number
  hc: 12 | 24
  locale: string
  labels: Required<DateReelLabels>
}

const DEFAULT_LABELS: Required<DateReelLabels> = {
  day: "Day", month: "Month", date: "Date", year: "Year", hour: "Hour", minute: "Minute", period: "AM or PM", at: "at", presets: "Quick picks", today: "Today",
  confirm: "Schedule", confirming: "Scheduling", confirmed: "Scheduled", retry: "Try again",
}

function makeSpecs(c: Config): ReelSpec[] {
  const { mode, today, min, max, step, hc, locale, labels } = c
  const out: ReelSpec[] = []
  const wd = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" })
  const mf = new Intl.DateTimeFormat(locale, { month: "short" })
  const hour = (): ReelSpec =>
    hc === 12
      ? { id: "hour", name: labels.hour, n: 12, cyclic: true, text: (i) => String(i === 0 ? 12 : i), page: 3 }
      : { id: "hour", name: labels.hour, n: 24, cyclic: true, text: (i) => String(i).padStart(2, "0"), page: 6 }
  const minute = (): ReelSpec => ({ id: "minute", name: labels.minute, n: 60 / step, cyclic: true, text: (i) => String(i * step).padStart(2, "0"), page: Math.max(1, Math.round(15 / step)) })
  const period = (): ReelSpec => {
    const f = new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true })
    const part = (h: number) => f.formatToParts(new Date(2020, 0, 1, h)).find((p) => p.type === "dayPeriod")?.value ?? (h < 12 ? "AM" : "PM")
    const w = [part(1), part(13)]
    return { id: "period", name: labels.period, n: 2, cyclic: true, text: (i) => w[i], page: 1 }
  }
  if (mode === "datetime") {
    const n = Math.max(1, dayDiff(max, min) + 1)
    out.push({
      id: "day", name: labels.day, n, cyclic: false, page: 7,
      text: (i) => (i === dayDiff(today, min) ? labels.today : wd.format(addDays(min, i))),
    })
    out.push(hour(), minute())
    if (hc === 12) out.push(period())
  } else if (mode === "date") {
    out.push({ id: "month", name: labels.month, n: 12, cyclic: true, page: 3, text: (i) => mf.format(new Date(2020, i, 1)) })
    out.push({ id: "date", name: labels.date, n: 31, cyclic: true, page: 7, text: (i) => String(i + 1) })
    const y0 = min.getFullYear()
    out.push({ id: "year", name: labels.year, n: Math.max(1, max.getFullYear() - y0 + 1), cyclic: false, page: 10, text: (i) => String(y0 + i) })
  } else {
    out.push(hour(), minute())
    if (hc === 12) out.push(period())
  }
  return out
}

function compose(c: Config, i: Idx): Date {
  const h = c.hc === 12 ? (i.hour ?? 0) + (i.period ?? 0) * 12 : (i.hour ?? 0)
  const m = (i.minute ?? 0) * c.step
  if (c.mode === "datetime") {
    const d = addDays(c.min, i.day ?? 0)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
  }
  if (c.mode === "date") {
    const y = c.min.getFullYear() + (i.year ?? 0)
    const mo = i.month ?? 0
    return new Date(y, mo, Math.min((i.date ?? 0) + 1, dim(y, mo)))
  }
  return new Date(c.today.getFullYear(), c.today.getMonth(), c.today.getDate(), h, m)
}

function toIdx(c: Config, d: Date, specs: ReelSpec[]): Idx {
  const out: Idx = {}
  const hour = d.getHours()
  const nMin = 60 / c.step
  for (const s of specs) {
    if (s.id === "day") out.day = clamp(dayDiff(d, c.min), 0, s.n - 1)
    else if (s.id === "month") out.month = d.getMonth()
    else if (s.id === "date") out.date = d.getDate() - 1
    else if (s.id === "year") out.year = clamp(d.getFullYear() - c.min.getFullYear(), 0, s.n - 1)
    else if (s.id === "hour") out.hour = c.hc === 12 ? hour % 12 : hour
    else if (s.id === "minute") out.minute = mod(Math.round(d.getMinutes() / c.step), nMin)
    else if (s.id === "period") out.period = hour >= 12 ? 1 : 0
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                               Reel runtime                                 */
/* -------------------------------------------------------------------------- */

const TH = 0.3 // radians per row on the cylinder
const NODES = 11

type RT = {
  spec: ReelSpec
  el: HTMLDivElement
  drum: HTMLSpanElement[]
  lens: HTMLSpanElement[]
  shown: number[]
  pos: number
  vel: number
  mode: "rest" | "drag" | "glide" | "spring"
  target: number
  glideK: number
  delay: number
  omega: number
  drag: { y0: number; p0: number; samples: Array<[number, number]>; moved: boolean } | null
  wheel: number
  type: string
  typeAt: number
  lastText: string
}

const rubber = (over: number) => {
  const c = 1.1
  return Math.sign(over) * c * (1 - Math.exp(-Math.abs(over) / c))
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_VALUE = new Date(2026, 8, 24, 9, 30)

/** A 3D reel date and time picker, like the wheels on a phone. Each column is a curved drum: flick it and it keeps your momentum, glides and snaps into a glass lens, and a drag past either end stretches like rubber. */
export function DateReel({
  mode = "datetime", value, defaultValue, onChange, today: todayProp, minDate, maxDate, minuteStep = 5, hourCycle = 12, locale = "en-US", presets, title, onConfirm, labels: labelsProp,
  intro = true, speed = 1, paused = false, accent, label = "Date and time", className, style,
}: DateReelProps) {
  const labels = React.useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp])
  const first = React.useRef<Date>(value ?? defaultValue ?? DEFAULT_VALUE)
  const todayD = todayProp ? sod(todayProp) : sod(first.current)
  const cfg = React.useMemo<Config>(() => {
    const t = todayD
    const min = minDate ? sod(minDate) : mode === "date" ? new Date(t.getFullYear() - 100, t.getMonth(), t.getDate()) : addDays(t, -30)
    const max = maxDate ? sod(maxDate) : mode === "date" ? new Date(t.getFullYear() + 10, t.getMonth(), t.getDate()) : addDays(t, 365)
    return { mode, today: t, min, max, step: minuteStep, hc: hourCycle, locale, labels }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, todayD.getTime(), minDate?.getTime(), maxDate?.getTime(), minuteStep, hourCycle, locale, labels])
  const specs = React.useMemo(() => makeSpecs(cfg), [cfg])

  const [committed, setCommitted] = React.useState<Date>(() => first.current)
  const current = value ?? committed

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const headRef = React.useRef<HTMLSpanElement>(null)
  const detailRef = React.useRef<HTMLSpanElement>(null)
  const liveRef = React.useRef<HTMLSpanElement>(null)
  const rts = React.useRef<RT[]>([])
  const api = React.useRef<{ goTo: (d: Date, stagger: number) => void } | null>(null)
  const latest = React.useRef({ onChange, speed, paused, intro, cfg, value })
  React.useLayoutEffect(() => {
    latest.current = { onChange, speed, paused, intro, cfg, value }
  })
  const lastCommit = React.useRef<number>(first.current.getTime())

  const presetList = React.useMemo(() => {
    if (presets === false) return []
    const list: DateReelPreset[] =
      presets ??
      (mode === "datetime"
        ? [
            { label: "This evening", value: (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate(), 18, 0) },
            { label: "Tomorrow", value: (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 9, 0) },
            { label: "Monday", value: (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + (((8 - t.getDay()) % 7) || 7), 9, 0) },
          ]
        : [])
    return list.map((p) => ({ label: p.label, date: typeof p.value === "function" ? p.value(cfg.today) : p.value }))
  }, [presets, mode, cfg.today])

  /* ------------------------ engine: build + frame loop ------------------------ */

  React.useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const c = cfg
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let alive = true
    let raf = 0
    let running = false
    let visible = true
    let last = 0
    let introPending = latest.current.intro && !reduce && !document.hidden
    let rowH = 36

    const els = Array.from(stage.querySelectorAll<HTMLDivElement>("[data-reel]"))
    const list: RT[] = els.map((el, k) => ({
      spec: specs[k], el,
      drum: Array.from(el.querySelectorAll<HTMLSpanElement>("[data-d]")),
      lens: Array.from(el.querySelectorAll<HTMLSpanElement>("[data-l]")),
      shown: new Array(NODES).fill(-99999),
      pos: 0, vel: 0, mode: "rest", target: 0, glideK: 0, delay: 0, omega: 16, drag: null, wheel: 0, type: "", typeAt: 0, lastText: "",
    }))
    rts.current = list

    /* ----- measuring ----- */
    const measureWidths = () => {
      const cs = getComputedStyle(root)
      const cv = document.createElement("canvas").getContext("2d")!
      const fs = parseFloat(getComputedStyle(els[0] ?? root).fontSize) || 18
      cv.font = `500 ${fs}px ${cs.fontFamily}`
      for (const r of list) {
        let w = 0
        for (let i = 0; i < r.spec.n; i++) w = Math.max(w, cv.measureText(r.spec.text(i)).width)
        r.el.style.setProperty("--w", String(Math.ceil(w + 2)))
      }
      rowH = stage.querySelector<HTMLElement>(".dre-lens")?.offsetHeight || 36
    }

    /* ----- rendering ----- */
    const sel = (r: RT) => {
      const i = Math.round(r.pos)
      return r.spec.cyclic ? mod(i, r.spec.n) : clamp(i, 0, r.spec.n - 1)
    }
    const readIdx = (): Idx => {
      const o: Idx = {}
      for (const r of list) o[r.spec.id] = sel(r)
      return o
    }
    const renderReel = (r: RT) => {
      const R = rowH / TH
      const n = r.spec.n
      const base = Math.round(r.pos)
      // Days that do not exist in the chosen month (date mode) are dimmed.
      let maxDay = 31
      if (r.spec.id === "date") {
        const m = list.find((x) => x.spec.id === "month")
        const y = list.find((x) => x.spec.id === "year")
        if (m && y) maxDay = dim(c.min.getFullYear() + sel(y), sel(m))
      }
      for (let k = -5; k <= 5; k++) {
        const i = base + k
        const slot = mod(i, NODES)
        const off = i - r.pos
        const th = off * TH
        const cs = Math.cos(th)
        const inRange = r.spec.cyclic || (i >= 0 && i < n)
        const idx = r.spec.cyclic ? mod(i, n) : i
        const d = r.drum[slot]
        const l = r.lens[slot]
        if (!d || !l) continue
        if (!inRange || cs <= 0.02) {
          d.style.opacity = "0"
          l.style.opacity = "0"
          continue
        }
        if (r.shown[slot] !== i) {
          const t = r.spec.text(idx)
          d.textContent = t
          l.textContent = t
          r.shown[slot] = i
        }
        const dimmed = r.spec.id === "date" && idx + 1 > maxDay
        const tr = `translate3d(0,${(R * Math.sin(th)).toFixed(2)}px,0) scaleY(${cs.toFixed(3)})`
        const op = String(Math.pow(cs, 2.1) * (dimmed ? 0.35 : 1))
        d.style.transform = tr
        d.style.opacity = op
        l.style.transform = tr
        l.style.opacity = op
      }
      const idxSel = sel(r)
      const text = r.spec.text(idxSel)
      if (r.lastText !== text) {
        r.lastText = text
        r.el.setAttribute("aria-valuenow", String(idxSel))
        r.el.setAttribute("aria-valuetext", text)
      }
    }
    const summary = () => {
      const v = compose(c, readIdx())
      const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(c.locale, o).format(v)
      const time = f({ hour: "numeric", minute: "2-digit", hour12: c.hc === 12 })
      let head = ""
      let detail = ""
      if (c.mode === "time") {
        head = time
      } else {
        const dd = dayDiff(v, c.today)
        const rtf = new Intl.RelativeTimeFormat(c.locale, { numeric: "auto" })
        const rel = Math.abs(dd) <= 30 ? cap(rtf.format(dd, "day")) : f({ month: "short", day: "numeric", year: "numeric" })
        const long = f({ weekday: "long", month: "long", day: "numeric", year: "numeric" })
        if (c.mode === "datetime") {
          head = `${rel} ${c.labels.at} ${time}`
          detail = long
        } else {
          head = f({ month: "long", day: "numeric", year: "numeric" })
          detail = `${f({ weekday: "long" })} · ${rel}`
        }
      }
      if (headRef.current && headRef.current.textContent !== head) headRef.current.textContent = head
      if (detailRef.current && detailRef.current.textContent !== detail) detailRef.current.textContent = detail
      return v
    }
    const paint = () => {
      list.forEach(renderReel)
      // second pass so the day dimming sees the settled month / year
      summary()
    }

    /* ----- motion ----- */
    const wake = () => {
      if (running || !alive) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const setPos = (r: RT, p: number) => {
      r.pos = p
      r.mode = "rest"
      r.vel = 0
    }
    const drive = (r: RT, T: number, delayMs = 0, omega = 16) => {
      const lim = r.spec.cyclic ? T : clamp(T, 0, r.spec.n - 1)
      r.target = lim
      r.delay = delayMs
      r.omega = omega
      if (reduce || latest.current.paused) {
        setPos(r, lim)
        renderReel(r)
        checkRest()
        return
      }
      r.mode = "spring"
      wake()
    }
    const goIdx = (i: Idx, stagger: number, omega = 16) => {
      let k = 0
      for (const r of list) {
        const want = i[r.spec.id] ?? 0
        const from = r.mode === "spring" || r.mode === "glide" ? r.target : Math.round(r.pos)
        let T: number
        if (r.spec.cyclic) {
          let dlt = mod(want - from, r.spec.n)
          if (dlt > r.spec.n / 2) dlt -= r.spec.n
          T = from + dlt
        } else T = clamp(want, 0, r.spec.n - 1)
        drive(r, T, k * stagger, omega)
        k++
      }
    }

    const anyMoving = () => list.some((r) => r.mode !== "rest")
    const checkRest = () => {
      if (anyMoving()) return
      // A date that does not exist (Feb 30) turns back to the last real day by itself.
      if (c.mode === "date") {
        const idx = readIdx()
        const y = c.min.getFullYear() + (idx.year ?? 0)
        const m = idx.month ?? 0
        const lim = dim(y, m)
        if ((idx.date ?? 0) + 1 > lim) {
          const dr = list.find((x) => x.spec.id === "date")!
          drive(dr, Math.round(dr.pos) - ((idx.date ?? 0) + 1 - lim), 0, 18)
          return
        }
      }
      const v = summary()
      const t = v.getTime()
      if (t !== lastCommit.current) {
        lastCommit.current = t
        setCommitted(v)
        latest.current.onChange?.(v)
        if (liveRef.current) {
          liveRef.current.textContent = `${headRef.current?.textContent ?? ""}. ${detailRef.current?.textContent ?? ""}`
        }
      }
    }

    function frame(now: number) {
      if (!alive) return
      if (!visible) {
        running = false
        return
      }
      const raw = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
      last = now
      const dt = raw * Math.max(0.05, latest.current.speed)
      let active = false
      for (const r of list) {
        if (r.mode === "drag") {
          active = true
          continue
        }
        if (r.mode === "rest") continue
        active = true
        if (r.delay > 0) {
          r.delay -= raw * 1000
          continue
        }
        if (r.mode === "glide") {
          const e = Math.exp(-r.glideK * dt)
          r.pos += (r.vel / r.glideK) * (1 - e)
          r.vel *= e
          if (Math.abs(r.target - r.pos) < 0.5 || Math.abs(r.vel) < 0.3) r.mode = "spring"
        }
        if (r.mode === "spring") {
          const w = r.omega
          const x = r.pos - r.target
          const k = Math.exp(-w * dt)
          const nx = (x + (r.vel + w * x) * dt) * k
          r.vel = (r.vel - w * (r.vel + w * x) * dt) * k
          r.pos = r.target + nx
          if (Math.abs(nx) < 0.0015 && Math.abs(r.vel) < 0.02) {
            r.pos = r.target
            r.vel = 0
            r.mode = "rest"
          }
        }
        renderReel(r)
      }
      summary()
      if (active) raf = requestAnimationFrame(frame)
      else {
        running = false
        checkRest()
      }
    }

    /* ----- pointer / wheel / keyboard per reel ----- */
    const cleanups: Array<() => void> = []
    list.forEach((r, ri) => {
      const el = r.el
      const rowsFromY = (y: number) => {
        const rect = el.getBoundingClientRect()
        const dy = y - (rect.top + rect.height / 2)
        const s = clamp(dy / (rowH / TH), -1, 1)
        return Math.asin(s) / TH
      }
      const down = (e: PointerEvent) => {
        if (e.button !== 0 && e.pointerType === "mouse") return
        el.setPointerCapture(e.pointerId)
        const p0 = r.spec.cyclic ? r.pos : clamp(r.pos, -0.001, r.spec.n - 0.999)
        r.mode = "drag"
        r.vel = 0
        r.drag = { y0: e.clientY, p0, samples: [[performance.now(), e.clientY]], moved: false }
        wake()
      }
      const move = (e: PointerEvent) => {
        const d = r.drag
        if (!d) return
        const dyPx = e.clientY - d.y0
        if (Math.abs(dyPx) > 4) d.moved = true
        const raw = d.p0 - dyPx / rowH
        const n = r.spec.n
        r.pos = r.spec.cyclic ? raw : raw < 0 ? rubber(raw) : raw > n - 1 ? n - 1 + rubber(raw - (n - 1)) : raw
        const now = performance.now()
        d.samples.push([now, e.clientY])
        while (d.samples.length > 2 && now - d.samples[0][0] > 90) d.samples.shift()
        renderReel(r)
        summary()
      }
      const up = (e: PointerEvent) => {
        const d = r.drag
        if (!d) return
        r.drag = null
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        const n = r.spec.n
        if (!d.moved) {
          // A tap on an entry turns the reel to it.
          const off = Math.round(rowsFromY(e.clientY))
          r.mode = "rest"
          drive(r, Math.round(r.pos) + off, 0, 18)
          return
        }
        const s = d.samples
        const dtS = Math.max(16, s[s.length - 1][0] - s[0][0]) / 1000
        const v = clamp(-((s[s.length - 1][1] - s[0][1]) / rowH) / dtS, -60, 60) // rows per second
        const out = !r.spec.cyclic && (r.pos < -0.001 || r.pos > n - 0.999)
        if (out || latest.current.paused || reduce || Math.abs(v) < 1.2) {
          r.mode = "rest"
          drive(r, Math.round(r.pos), 0, out ? 14 : 18)
          return
        }
        // An exponential glide solved to land on an entry, then a spring takes the last half row.
        const k0 = 5.2
        let T = Math.round(r.pos + v / k0)
        if (!r.spec.cyclic) T = clamp(T, 0, n - 1)
        const dist = T - r.pos
        if (dist === 0 || Math.sign(dist) !== Math.sign(v)) {
          r.mode = "rest"
          drive(r, T, 0, 18)
          return
        }
        r.target = T
        r.vel = v
        r.glideK = clamp(v / dist, 3, 14)
        r.omega = 18
        r.delay = 0
        r.mode = "glide"
        wake()
      }
      const wheel = (e: WheelEvent) => {
        e.preventDefault()
        const unit = e.deltaMode === 1 ? 16 : 1
        r.wheel += e.deltaY * unit
        const steps = Math.trunc(r.wheel / 48)
        if (steps !== 0) {
          r.wheel -= steps * 48
          const base = r.mode === "spring" || r.mode === "glide" ? r.target : Math.round(r.pos)
          drive(r, base + steps, 0, 15)
        }
      }
      const key = (e: KeyboardEvent) => {
        const base = r.mode === "spring" || r.mode === "glide" ? r.target : Math.round(r.pos)
        const stepBy = (d: number) => drive(r, base + d, 0, 17)
        const n = r.spec.n
        let handled = true
        switch (e.key) {
          case "ArrowDown": stepBy(1); break
          case "ArrowUp": stepBy(-1); break
          case "PageDown": stepBy(r.spec.page); break
          case "PageUp": stepBy(-r.spec.page); break
          case "Home": drive(r, r.spec.cyclic ? base - mod(base, n) : 0, 0, 14); break
          case "End": drive(r, r.spec.cyclic ? base - mod(base, n) + n - 1 : n - 1, 0, 14); break
          case "ArrowLeft": list[ri - 1]?.el.focus(); break
          case "ArrowRight": list[ri + 1]?.el.focus(); break
          default: {
            if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) {
              handled = false
              break
            }
            const now = performance.now()
            r.type = now - r.typeAt > 900 ? e.key.toLocaleLowerCase(c.locale) : r.type + e.key.toLocaleLowerCase(c.locale)
            r.typeAt = now
            let found = -1
            for (let i = 0; i < n; i++) {
              if (r.spec.text(i).toLocaleLowerCase(c.locale).startsWith(r.type)) {
                found = i
                break
              }
            }
            if (found < 0 && r.type.length > 1) {
              r.type = e.key.toLocaleLowerCase(c.locale)
              for (let i = 0; i < n; i++) {
                if (r.spec.text(i).toLocaleLowerCase(c.locale).startsWith(r.type)) {
                  found = i
                  break
                }
              }
            }
            if (found >= 0) {
              if (r.spec.cyclic) {
                let dlt = mod(found - base, n)
                if (dlt > n / 2) dlt -= n
                drive(r, base + dlt, 0, 17)
              } else drive(r, found, 0, 17)
            } else handled = false
          }
        }
        if (handled) e.preventDefault()
      }
      el.addEventListener("pointerdown", down)
      el.addEventListener("pointermove", move)
      el.addEventListener("pointerup", up)
      el.addEventListener("pointercancel", up)
      el.addEventListener("wheel", wheel, { passive: false })
      el.addEventListener("keydown", key)
      cleanups.push(() => {
        el.removeEventListener("pointerdown", down)
        el.removeEventListener("pointermove", move)
        el.removeEventListener("pointerup", up)
        el.removeEventListener("pointercancel", up)
        el.removeEventListener("wheel", wheel)
        el.removeEventListener("keydown", key)
      })
    })

    /* ----- initial placement ----- */
    measureWidths()
    const startIdx = toIdx(c, latest.current.value ?? first.current, specs)
    for (const r of list) {
      const want = startIdx[r.spec.id] ?? 0
      r.pos = want
      r.target = want
    }
    const startSpin = () => {
      introPending = false
      if (latest.current.paused) {
        for (const r of list) setPos(r, r.target)
        paint()
        return
      }
      let k = 0
      for (const r of list) {
        r.omega = 6.5
        r.delay = k * 120
        r.mode = "spring"
        k++
      }
      wake()
    }
    if (introPending) {
      for (const r of list) {
        const want = r.target
        r.pos = r.spec.cyclic ? want - Math.min(r.spec.n - 1, 14) : clamp(want > r.spec.n - 12 ? want - 9 : want + 9, 0, r.spec.n - 1)
      }
    }
    paint()
    lastCommit.current = compose(c, readIdx()).getTime()

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting
        if (visible) {
          if (introPending) startSpin()
          else if (anyMoving()) wake()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(root)
    const ro = new ResizeObserver(() => {
      measureWidths()
      paint()
    })
    ro.observe(stage)
    void document.fonts?.ready.then(() => {
      if (alive) {
        measureWidths()
        paint()
      }
    })

    api.current = {
      goTo: (d, stagger) => {
        introPending = false
        goIdx(toIdx(c, d, specs), stagger)
      },
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      cleanups.forEach((f) => f())
      api.current = null
    }
  }, [cfg, specs])

  // A new value from outside spins every reel to it along the short way round.
  const valueTime = value?.getTime()
  React.useEffect(() => {
    if (valueTime === undefined || valueTime === lastCommit.current) return
    lastCommit.current = valueTime
    api.current?.goTo(new Date(valueTime), 70)
  }, [valueTime])

  /* ------------------------------- confirm -------------------------------- */

  const [phase, setPhase] = React.useState<"idle" | "pending" | "done" | "error">("idle")
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  const confirm = async () => {
    if (phase === "pending" || !onConfirm) return
    setPhase("pending")
    try {
      await onConfirm(current)
      setPhase("done")
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setPhase("idle"), 1800)
    } catch {
      setPhase("error")
    }
  }

  const cur = current.getTime()
  const pickedIdx = presetList.findIndex((p) => Math.abs(p.date.getTime() - cur) < (minuteStep * 60_000) / 2 + 1)
  const pick = (d: Date) => {
    api.current?.goTo(d, 80)
  }

  return (
    <div ref={rootRef} className={cn("dre", className)} style={{ ...(accent ? ({ "--dre-accent": accent } as React.CSSProperties) : null), ...style }}>
      <style href="dre" precedence="default">
        {CSS}
      </style>
      <div className="dre-body" role="group" aria-label={label}>
        <div className="dre-head">
          {title ? <h3 className="dre-title">{title}</h3> : null}
          <p className="dre-sum" aria-hidden="true">
            <span className="dre-headline" ref={headRef} />
            <span className="dre-detail" ref={detailRef} />
          </p>
        </div>
        <div className="dre-stage" ref={stageRef}>
          <div className="dre-lens" aria-hidden="true" />
          <div className="dre-reels">
            {specs.map((s) => (
              <div key={s.id + cfg.mode} className="dre-reel" data-reel={s.id} role="spinbutton" tabIndex={0} aria-label={s.name} aria-valuemin={0} aria-valuemax={s.n - 1} aria-valuenow={0} aria-orientation="vertical">
                <span className="dre-drum" aria-hidden="true">
                  {Array.from({ length: NODES }, (_, k) => (
                    <span key={k} className="dre-i" data-d />
                  ))}
                </span>
                <span className="dre-win" aria-hidden="true">
                  <span className="dre-win-in">
                    {Array.from({ length: NODES }, (_, k) => (
                      <span key={k} className="dre-i" data-l />
                    ))}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
        {presetList.length > 0 ? (
          <div className="dre-presets" role="group" aria-label={labels.presets}>
            {presetList.map((p, i) => (
              <button key={p.label} type="button" className="dre-preset" aria-pressed={pickedIdx === i} onClick={() => pick(p.date)}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
        {onConfirm ? (
          <button type="button" className="dre-confirm" data-phase={phase} onClick={confirm} aria-busy={phase === "pending"}>
            <span className="dre-cs" data-on={phase === "idle" || undefined}>{labels.confirm}</span>
            <span className="dre-cs" data-on={phase === "pending" || undefined}>
              <svg className="dre-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>
              {labels.confirming}
            </span>
            <span className="dre-cs" data-on={phase === "done" || undefined}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              {labels.confirmed}
            </span>
            <span className="dre-cs" data-on={phase === "error" || undefined}>{labels.retry}</span>
          </button>
        ) : null}
        <span className="dre-sr" role="status" aria-live="polite" ref={liveRef} />
      </div>
    </div>
  )
}

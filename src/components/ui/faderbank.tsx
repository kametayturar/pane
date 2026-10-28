"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FaderbankDetent = {
  value: number
  /** One short word, shown beside the tick: "Balanced". */
  label: string
  /** Longer name for the line under the readout. Defaults to `label`. */
  title?: string
}

export type FaderbankParam = {
  /** Stable id. "temperature", "top_p" and "max_tokens" also drive the sample runs and the cost line. */
  id: string
  /** Short channel name, sentence case: "Max tokens". */
  label: string
  /** Long name for screen readers and the tooltip: "Maximum output tokens". */
  hint?: string
  /** Log-scale params need min > 0, otherwise they fall back to linear. */
  min: number
  max: number
  /** Grid the fader snaps to and one Shift+arrow press. */
  step: number
  /** Grid for typed numbers. Defaults to `step`. */
  entryStep?: number
  /** "log" spaces the travel by ratio, for values that span orders of magnitude. Default "linear". */
  scale?: "linear" | "log"
  /** What the provider uses when the channel is muted or soloed out. */
  defaultValue: number
  /** Named stops. Arrow keys move one stop per press and the thumb is pulled to them. */
  detents?: FaderbankDetent[]
  /** Text for the readout and the screen reader. */
  format?: (value: number) => string
  /** The consequence in words, for the live caption: "More varied, less repeatable". */
  describe?: (value: number) => string
  /** Fraction of the travel above which the LEDs turn red and the word turns amber. Default 0.8. */
  hot?: number
}

export type FaderbankModel = {
  id: string
  name: string
  /** Starting value for each param id. Missing ids start on the param default. */
  values: Record<string, number>
  /** USD per million output tokens, for the cost line. */
  price?: number
}

export type FaderbankSamples = {
  /** One line about the request the five runs answer. */
  ticket: string
  /** Complete replies, most likely first (five is ideal). Low variety repeats the first one, high variety uses more of them. */
  replies: string[]
  /** The same replies gone off course, for a hot temperature. Wrap the drifting words in {{double braces}} and they are highlighted. */
  hot?: string[]
}

export type FaderbankSnapshot = {
  /** Selected model id. */
  model: string
  /** What would be sent: each param's value, or its default when muted or soloed out. */
  params: Record<string, number>
  /** Fader positions for every model, muted or not. */
  values: Record<string, Record<string, number>>
  muted: string[]
  solo: string[]
}

export type FaderbankProps = {
  /** Channels, left to right. Defaults to temperature, top-p, max tokens and presence. Remount with a `key` if you change it later. */
  params?: FaderbankParam[]
  /** Up to four models to A/B. Defaults to Meridian S and Meridian L. */
  models?: FaderbankModel[]
  /** Starting model id. */
  defaultModel?: string
  defaultMuted?: string[]
  defaultSolo?: string[]
  /** The runs under the caption. `false` hides them. */
  samples?: FaderbankSamples | false
  /** Tokens a normal reply needs. Below this the replies are cut short. Default 380. */
  typicalTokens?: number
  /** Tickets in the queue, for the cost line. Default 38. */
  queue?: number
  /** Plays a looping tour on its own (temperature up, max tokens down, A/B, mute). Stops on the first pointer or key press, off screen and in a hidden tab. */
  autoplay?: boolean
  title?: string
  subtitle?: string
  /** Called after every change with what would be sent. */
  onChange?: (snapshot: FaderbankSnapshot) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                Demo content                                */
/* -------------------------------------------------------------------------- */

const fixed = (digits: number) => (v: number) => v.toFixed(digits)

const DEFAULT_PARAMS: FaderbankParam[] = [
  {
    id: "temperature",
    label: "Temperature",
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 1,
    format: fixed(2),
    hot: 0.8,
    detents: [
      { value: 0, label: "Fixed" },
      { value: 0.3, label: "Precise" },
      { value: 0.7, label: "Balanced" },
      { value: 1, label: "Creative" },
      { value: 1.5, label: "Wild" },
      { value: 2, label: "Chaotic" },
    ],
    describe: (v) =>
      v <= 0.02
        ? "Same answer every time"
        : v <= 0.5
          ? "Steady and precise"
          : v <= 0.8
            ? "Balanced, with natural variety"
            : v <= 1.15
              ? "More varied, less repeatable"
              : v <= 1.6
                ? "Surprising, sometimes off topic"
                : "Loose and likely to drift",
  },
  {
    id: "top_p",
    label: "Top-p",
    hint: "Top-p, nucleus sampling",
    min: 0.1,
    max: 1,
    step: 0.01,
    defaultValue: 1,
    format: fixed(2),
    hot: 0.95,
    detents: [
      { value: 0.3, label: "Tight" },
      { value: 0.6, label: "Focused" },
      { value: 0.9, label: "Standard" },
      { value: 1, label: "Open" },
    ],
    describe: (v) =>
      v <= 0.4
        ? "Only the safest words"
        : v <= 0.75
          ? "Sticks to likely wording"
          : v < 0.97
            ? "Draws on the likely words"
            : "Considers rare words too",
  },
  {
    id: "max_tokens",
    label: "Max tokens",
    hint: "Maximum output tokens",
    min: 64,
    max: 4096,
    step: 32,
    entryStep: 1,
    scale: "log",
    defaultValue: 1024,
    format: (v) => Math.round(v).toLocaleString("en-US"),
    hot: 0.85,
    detents: [
      { value: 128, label: "Line", title: "A line" },
      { value: 256, label: "Paragraph", title: "A paragraph" },
      { value: 512, label: "Short", title: "Short reply" },
      { value: 1024, label: "Full", title: "Full reply" },
      { value: 2048, label: "Long", title: "Long form" },
      { value: 4096, label: "Report" },
    ],
    describe: (v) => `Stops after about ${(Math.round((v * 0.75) / 10) * 10).toLocaleString("en-US")} words`,
  },
  {
    id: "presence",
    label: "Presence",
    hint: "Presence penalty",
    min: -2,
    max: 2,
    step: 0.1,
    defaultValue: 0,
    format: (v) => (v > 0.04 ? "+" : v < -0.04 ? "−" : "") + Math.abs(v).toFixed(1),
    hot: 0.9,
    detents: [
      { value: -1, label: "Repeats" },
      { value: 0, label: "Neutral" },
      { value: 0.6, label: "Nudge" },
      { value: 1.5, label: "Strong" },
    ],
    describe: (v) =>
      v < -0.3
        ? "Repeats itself freely"
        : v <= 0.3
          ? "No push toward new topics"
          : v <= 1
            ? "Nudges toward new topics"
            : "Strongly avoids repeating itself",
  },
]

const DEFAULT_MODELS: FaderbankModel[] = [
  { id: "s", name: "Meridian S", price: 0.6, values: { temperature: 0.4, top_p: 0.9, max_tokens: 512, presence: 0 } },
  { id: "l", name: "Meridian L", price: 3, values: { temperature: 0.9, top_p: 0.95, max_tokens: 1024, presence: 0.4 } },
]

const DEFAULT_SAMPLES: FaderbankSamples = {
  ticket: "Dana W. asks why she was billed twice for Tuesday’s visit.",
  replies: [
    "Thanks for flagging this, Dana. The duplicate charge is refunded and will land in 3 to 5 days.",
    "Hi Dana, sorry about the double charge. A payment retry caused it, and your refund is on its way.",
    "That second charge is our mistake, Dana. It was reversed today and you need to do nothing.",
    "Good catch, Dana. Two payments went through for Tuesday’s visit; the extra one is already refunded.",
    "Dear Dana, the second charge on 14 October should not have happened. A refund is queued.",
  ],
  hot: [
    "Thanks for flagging this, Dana. The duplicate charge is refunded and will land in {{3 to 5 Fridays}}.",
    "Hi Dana, sorry about the {{echo}} charge. A payment retry caused it, and your refund is on its way.",
    "That second charge is our mistake, Dana. It was {{rückerstattet}} today and you need to do nothing.",
    "Good catch, Dana. Two payments went through for {{Thursday’s}} visit; the extra one is already refunded.",
    "Dear Dana, the second charge on {{31 October}} should not have happened. {{Anyway, the lobby ferns are thriving.}}",
  ],
}

/* -------------------------------------------------------------------------- */
/*                                   Maths                                    */
/* -------------------------------------------------------------------------- */

const TH = 24 // thumb height in px, keep in sync with --ifb-th
const SEGS = 16
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const isLog = (p: FaderbankParam) => p.scale === "log" && p.min > 0

function toPos(p: FaderbankParam, v: number) {
  const x = clamp(v, p.min, p.max)
  return isLog(p) ? Math.log(x / p.min) / Math.log(p.max / p.min) : (x - p.min) / (p.max - p.min)
}
function fromPos(p: FaderbankParam, t: number) {
  return isLog(p) ? p.min * Math.exp(t * Math.log(p.max / p.min)) : p.min + t * (p.max - p.min)
}
function snapTo(p: FaderbankParam, v: number, grid = p.step) {
  const q = Math.round((v - p.min) / grid) * grid + p.min
  return clamp(Number(q.toFixed(6)), p.min, p.max)
}
function fmt(p: FaderbankParam, v: number) {
  return p.format ? p.format(v) : String(Number(v.toFixed(3)))
}
function nearestDetent(p: FaderbankParam, v: number) {
  let best: FaderbankDetent | undefined
  let bd = Infinity
  for (const d of p.detents ?? []) {
    const dist = Math.abs(toPos(p, d.value) - toPos(p, v))
    if (dist < bd) {
      bd = dist
      best = d
    }
  }
  return best
}
function stepFrom(p: FaderbankParam, v: number, dir: 1 | -1, mode: "detent" | "fine" | "page") {
  if (mode === "fine") return snapTo(p, v + dir * p.step)
  if (mode === "page") return snapTo(p, v + dir * p.step * 10)
  const stops = [...(p.detents ?? []).map((d) => d.value)].sort((a, b) => a - b)
  const eps = 1e-6
  if (dir > 0) return stops.find((s) => s > v + eps) ?? p.max
  return [...stops].reverse().find((s) => s < v - eps) ?? p.min
}
function parseNumber(s: string) {
  const t = s.trim().toLowerCase().replace(/[,\s]/g, "").replace(/−/g, "-")
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(k)?$/.exec(t)
  return m ? parseFloat(m[1]) * (m[2] ? 1000 : 1) : null
}
function money(v: number) {
  return v < 0.1 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`
}
/** green below 62% of the travel, amber up to the hot mark, red above it. */
function zoneAt(pos: number, hotAt: number): "g" | "a" | "r" {
  return pos > hotAt ? "r" : pos > 0.62 ? "a" : "g"
}

const VARIETY_LINE = [
  "Every run gives the same reply.",
  "Runs mostly agree.",
  "Runs share a gist but differ in wording.",
  "Runs differ in tone and wording.",
  "Every run takes a different route.",
]
// Which of the replies each run shows, for 1 to 5 distinct openings.
const RUN_PATTERN = [
  [0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1],
  [0, 1, 0, 2, 1],
  [0, 1, 2, 0, 3],
  [0, 1, 2, 3, 4],
]

type Token = { t: string; hot: boolean }
/** Splits "plain {{drift}} plain" into word tokens that remember which ones drifted. */
function tokenise(s: string): Token[] {
  const out: Token[] = []
  s.split(/\{\{([^}]*)\}\}/).forEach((part, i) => {
    for (const w of part.match(/\S+\s*|\s+/g) ?? []) out.push({ t: w, hot: i % 2 === 1 })
  })
  return out
}
function runs(tokens: Token[]) {
  const groups: Token[][] = []
  for (const tk of tokens) {
    const g = groups[groups.length - 1]
    if (g && g[0].hot === tk.hot) g.push(tk)
    else groups.push([tk])
  }
  return groups.map((g, i) => (g[0].hot ? <mark key={i} className="ifb-drift">{g.map((x) => x.t).join("")}</mark> : <React.Fragment key={i}>{g.map((x) => x.t).join("")}</React.Fragment>))
}

/* -------------------------------------------------------------------------- */
/*                                  Channel                                   */
/* -------------------------------------------------------------------------- */

type ChState = "on" | "muted" | "off"

type ChannelProps = {
  param: FaderbankParam
  value: number
  state: ChState
  soloed: boolean
  index: number
  otherLetter: string | null
  otherValue: number
  lift: boolean
  onChange: (id: string, v: number) => void
  onMute: (id: string) => void
  onSolo: (id: string) => void
  onTouch: (id: string) => void
  announce: (msg: string) => void
}

const Channel = React.memo(function Channel({ param, value, state, soloed, index, otherLetter, otherValue, lift, onChange, onMute, onSolo, onTouch, announce }: ChannelProps) {
  const trkRef = React.useRef<HTMLDivElement>(null)
  const capRef = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ off: number; y0: number; grabbed: boolean; moved: boolean } | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [draft, setDraft] = React.useState<string | null>(null)

  const on = state === "on"
  const shownValue = on ? value : param.defaultValue
  const pos = toPos(param, shownValue)
  const stops = param.detents ?? []
  const sorted = [...stops].sort((a, b) => a.value - b.value)
  const word = nearestDetent(param, shownValue)
  const hotAt = param.hot ?? 0.8
  const hotIdx = Math.max(11, Math.floor(hotAt * SEGS))
  const lit = on ? Math.round(toPos(param, value) * SEGS) : 0
  const longName = param.hint ?? param.label
  const text = fmt(param, shownValue)
  const phrase = param.describe?.(shownValue)

  const say = (v: number) => announce(`${longName} ${fmt(param, v)}${param.describe ? `, ${param.describe(v).toLowerCase()}` : ""}`)

  const valueAt = (y: number, off: number, magnet: number) => {
    const r = trkRef.current!.getBoundingClientRect()
    const travel = r.height - TH
    const t = clamp((r.bottom - TH / 2 - (y - off)) / travel, 0, 1)
    if (magnet > 0) {
      let best: number | null = null
      let bd = magnet
      for (const d of stops) {
        const dist = Math.abs(toPos(param, d.value) - t) * travel
        if (dist <= bd) {
          bd = dist
          best = d.value
        }
      }
      if (best !== null) return best
    }
    return snapTo(param, fromPos(param, t))
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    capRef.current?.focus({ preventScroll: true })
    onTouch(param.id)
    const r = trkRef.current!.getBoundingClientRect()
    const centre = r.bottom - TH / 2 - pos * (r.height - TH)
    const grabbed = Math.abs(e.clientY - centre) <= TH / 2 + 4
    drag.current = { off: grabbed ? e.clientY - centre : 0, y0: e.clientY, grabbed, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (grabbed) setDragging(true)
    else onChange(param.id, valueAt(e.clientY, 0, e.altKey ? 0 : 7))
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    if (!d.moved) {
      if (Math.abs(e.clientY - d.y0) < 3) return
      d.moved = true
      setDragging(true)
    }
    onChange(param.id, valueAt(e.clientY, d.off, e.altKey ? 0 : 7))
  }
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setDragging(false)
    // A plain click on the thumb changes nothing. After a drag, or a press on the bare track,
    // letting go near a stop eases the last few pixels onto it.
    if (!d.moved && d.grabbed) return
    const final = valueAt(e.clientY, d.off, e.altKey ? 0 : 14)
    onChange(param.id, final)
    say(final)
  }

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    let next: number | null = null
    if (e.key === "ArrowUp" || e.key === "ArrowRight") next = stepFrom(param, shownValue, 1, e.shiftKey ? "fine" : "detent")
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = stepFrom(param, shownValue, -1, e.shiftKey ? "fine" : "detent")
    else if (e.key === "PageUp") next = stepFrom(param, shownValue, 1, "page")
    else if (e.key === "PageDown") next = stepFrom(param, shownValue, -1, "page")
    else if (e.key === "Home") next = param.min
    else if (e.key === "End") next = param.max
    if (next === null) return
    e.preventDefault()
    onTouch(param.id)
    onChange(param.id, next) // aria-valuetext announces the new value
  }

  const commitDraft = () => {
    if (draft === null) return
    const n = parseNumber(draft)
    setDraft(null)
    if (n === null) return
    const v = snapTo(param, clamp(n, param.min, param.max), param.entryStep ?? param.step)
    onTouch(param.id)
    onChange(param.id, v)
    say(v)
  }
  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitDraft()
      e.currentTarget.select()
    } else if (e.key === "Escape") {
      setDraft(null)
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      const dir = e.key === "ArrowUp" ? 1 : -1
      const base = draft !== null ? (parseNumber(draft) ?? shownValue) : shownValue
      const v = snapTo(param, clamp(base + dir * param.step * (e.shiftKey ? 10 : 1), param.min, param.max))
      setDraft(null)
      onTouch(param.id)
      onChange(param.id, v)
      say(v)
    }
  }

  const stateWord = state === "muted" ? "muted" : state === "off" ? "soloed out" : ""
  const valueText = `${text}${word ? `, ${(word.title ?? word.label).toLowerCase()}` : ""}${stateWord ? `, ${stateWord}, using default ${fmt(param, param.defaultValue)}` : ""}`
  const hotWord = on && pos > hotAt

  return (
    <div className="ifb-ch" data-state={state} data-drag={dragging || lift || undefined} style={{ "--ci": index } as React.CSSProperties}>
      <span className="ifb-name" title={longName}>
        {param.label}
      </span>
      <input
        className="ifb-num"
        inputMode={param.min < 0 ? "text" : "decimal"}
        spellCheck={false}
        autoComplete="off"
        aria-label={`${longName}, type a value`}
        value={draft ?? text}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={onInputKey}
      />
      <span className="ifb-word" data-hot={hotWord ? "" : undefined} data-off={on ? undefined : ""}>
        {on ? (
          (word?.title ?? word?.label ?? " ")
        ) : (
          <>
            <b className="ifb-tag">{state === "muted" ? "Muted" : "Solo off"}</b>
            <span className="ifb-dflt"> · default {fmt(param, param.defaultValue)}</span>
          </>
        )}
      </span>

      <span className="ifb-end" aria-hidden>
        {sorted.length ? sorted[sorted.length - 1].label : " "}
      </span>
      <div className="ifb-zone">
        <div className="ifb-rail" aria-hidden>
          <i className="ifb-scale" />
          {stops.map((d) => {
            const here = Math.abs(d.value - shownValue) < 1e-6
            const s = { "--p": toPos(param, d.value) } as React.CSSProperties
            return (
              <React.Fragment key={d.value}>
                <i className="ifb-tk" data-on={here || undefined} style={s} />
                <span className="ifb-tl" data-on={here || undefined} style={s}>
                  {d.label}
                </span>
              </React.Fragment>
            )
          })}
        </div>

        <div
          className="ifb-trk"
          ref={trkRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => {
            drag.current = null
            setDragging(false)
          }}
        >
          <span className="ifb-slot" aria-hidden />
          {otherLetter ? (
            <span className="ifb-gh" aria-hidden style={{ "--p": toPos(param, otherValue) } as React.CSSProperties} title={`Where ${otherLetter} sits`}>
              {otherLetter}
            </span>
          ) : null}
          <div
            ref={capRef}
            className="ifb-cap"
            role="slider"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label={longName}
            aria-valuemin={param.min}
            aria-valuemax={param.max}
            aria-valuenow={shownValue}
            aria-valuetext={valueText}
            aria-description={phrase}
            style={{ "--p": pos } as React.CSSProperties}
            onKeyDown={onKey}
            onFocus={() => onTouch(param.id)}
          />
        </div>

        <div className="ifb-meter" aria-hidden title="How far this fader is pushed">
          {Array.from({ length: SEGS }, (_, i) => (
            <i key={i} className="ifb-led" data-on={i < lit || undefined} data-z={i >= hotIdx ? "r" : i >= 10 ? "a" : "g"} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
      </div>
      <span className="ifb-end" aria-hidden>
        {sorted.length ? sorted[0].label : " "}
      </span>

      <div className="ifb-btns">
        <button type="button" className="ifb-btn" data-kind="mute" aria-pressed={state === "muted"} aria-label={`Mute ${longName}`} title="Mute: use the provider default instead" onClick={() => onMute(param.id)}>
          Mute
        </button>
        <button type="button" className="ifb-btn" data-kind="solo" aria-pressed={soloed} aria-label={`Solo ${longName}`} title="Solo: every other channel falls back to its default" onClick={() => onSolo(param.id)}>
          Solo
        </button>
      </div>
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Eases a number toward `target` with rAF, and still lands on it if rAF never runs. */
function useTween(target: number, ms = 380) {
  const [v, setV] = React.useState(target)
  const cur = React.useRef(target)
  React.useEffect(() => {
    const from = cur.current
    if (from === target) return
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let t0 = 0
    const land = window.setTimeout(
      () => {
        cur.current = target
        setV(target)
      },
      reduce ? 0 : ms + 120,
    )
    const tick = (ts: number) => {
      if (!t0) t0 = ts
      const k = Math.min(1, (ts - t0) / ms)
      const x = from + (target - from) * (1 - Math.pow(1 - k, 3))
      cur.current = x
      setV(x)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    if (!reduce) raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(land)
    }
  }, [target, ms])
  return v
}

/* -------------------------------------------------------------------------- */
/*                                  Faderbank                                 */
/* -------------------------------------------------------------------------- */

type State = {
  model: string
  values: Record<string, Record<string, number>>
  muted: string[]
  solo: string[]
}

function initialState(params: FaderbankParam[], models: FaderbankModel[], model: string | undefined, muted: string[], solo: string[]): State {
  const values: State["values"] = {}
  for (const m of models) {
    values[m.id] = {}
    for (const p of params) values[m.id][p.id] = clamp(m.values[p.id] ?? p.defaultValue, p.min, p.max)
  }
  return { model: models.some((m) => m.id === model) ? model! : models[0].id, values, muted, solo }
}
const stateOf = (s: State, id: string): ChState => (s.muted.includes(id) ? "muted" : s.solo.length > 0 && !s.solo.includes(id) ? "off" : "on")
const effective = (params: FaderbankParam[], s: State) => {
  const out: Record<string, number> = {}
  for (const p of params) out[p.id] = stateOf(s, p.id) === "on" ? s.values[s.model][p.id] : p.defaultValue
  return out
}
function makeSnapshot(params: FaderbankParam[], s: State): FaderbankSnapshot {
  return { model: s.model, params: effective(params, s), values: s.values, muted: s.muted, solo: s.solo }
}

/** What the desk would send before anyone touches it, for pages that show the request next to the desk. */
export function faderbankInitialSnapshot(props: Pick<FaderbankProps, "params" | "models" | "defaultModel" | "defaultMuted" | "defaultSolo"> = {}): FaderbankSnapshot {
  const params = props.params ?? DEFAULT_PARAMS
  const models = (props.models?.length ? props.models : DEFAULT_MODELS).slice(0, 4)
  return makeSnapshot(params, initialState(params, models, props.defaultModel ?? "l", props.defaultMuted ?? [], props.defaultSolo ?? []))
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
function track(kf: [number, number][], t: number) {
  if (t <= kf[0][0]) return kf[0][1]
  for (let i = 0; i < kf.length - 1; i++) {
    const [t0, v0] = kf[i]
    const [t1, v1] = kf[i + 1]
    if (t < t1) return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0))
  }
  return kf[kf.length - 1][1]
}
function stepAt<T>(kf: [number, T][], t: number) {
  let v = kf[0][1]
  for (const [at, x] of kf) if (t >= at) v = x
  return v
}

export function Faderbank({
  params = DEFAULT_PARAMS,
  models: modelsIn = DEFAULT_MODELS,
  defaultModel = "l",
  defaultMuted = [],
  defaultSolo = [],
  samples = DEFAULT_SAMPLES,
  typicalTokens = 380,
  queue = 38,
  autoplay = false,
  title = "Sampling desk",
  subtitle = "Quill drafting billing replies for Northwind Clinics",
  onChange,
  className,
}: FaderbankProps) {
  const models = (modelsIn.length ? modelsIn : DEFAULT_MODELS).slice(0, 4)
  const [st, setSt] = React.useState<State>(() => initialState(params, models, defaultModel, defaultMuted, defaultSolo))
  const [focus, setFocus] = React.useState(params[0]?.id ?? "")
  const [sr, setSr] = React.useState("")
  const [boot, setBoot] = React.useState(false)
  const [lift, setLift] = React.useState<string | null>(null)
  const [baseCost] = React.useState(() => {
    const s0 = initialState(params, models, defaultModel, defaultMuted, defaultSolo)
    const e0 = effective(params, s0)
    const m0 = models.find((m) => m.id === s0.model) ?? models[0]
    const used0 = Math.min(typicalTokens, e0.max_tokens ?? typicalTokens)
    return ((m0.price ?? 0) * used0 * queue) / 1e6
  })
  const rootRef = React.useRef<HTMLDivElement>(null)
  const latest = React.useRef(st)
  const live = React.useRef({ onChange, params, models })
  React.useEffect(() => {
    live.current = { onChange, params, models }
  })

  // The power-on sweep plays once, shortly after mount. The attribute is cleared again so toggling LEDs never replays it.
  React.useEffect(() => {
    const a = window.setTimeout(() => setBoot(true), 450)
    const b = window.setTimeout(() => setBoot(false), 450 + 1700)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [])

  const commit = React.useCallback((next: State) => {
    latest.current = next
    setSt(next)
    live.current.onChange?.(makeSnapshot(live.current.params, next))
  }, [])

  // Touching a muted fader wakes it up again; touching a soloed-out one joins the solo group.
  const wake = (s: State, id: string): State => {
    if (s.muted.includes(id)) return { ...s, muted: s.muted.filter((x) => x !== id) }
    if (s.solo.length > 0 && !s.solo.includes(id)) return { ...s, solo: [...s.solo, id] }
    return s
  }
  const setValue = React.useCallback(
    (id: string, v: number) => {
      const s = latest.current
      const woke = wake(s, id)
      if (s.values[s.model][id] === v && woke === s) return
      commit({ ...woke, values: { ...s.values, [s.model]: { ...s.values[s.model], [id]: v } } })
    },
    [commit],
  )
  const nameOf = (id: string) => {
    const p = live.current.params.find((x) => x.id === id)
    return (p?.hint ?? p?.label ?? id).toLowerCase()
  }
  const toggleMute = React.useCallback(
    (id: string) => {
      const s = latest.current
      const was = s.muted.includes(id)
      commit({ ...s, muted: was ? s.muted.filter((x) => x !== id) : [...s.muted, id], solo: was ? s.solo : s.solo.filter((x) => x !== id) })
      setSr(`${nameOf(id)} ${was ? "unmuted" : "muted, using its default"}`)
    },
    [commit],
  )
  const toggleSolo = React.useCallback(
    (id: string) => {
      const s = latest.current
      const was = s.solo.includes(id)
      commit({ ...s, solo: was ? s.solo.filter((x) => x !== id) : [...s.solo, id], muted: s.muted.filter((x) => x !== id) })
      setSr(`${nameOf(id)} ${was ? "solo off" : "solo on, other channels use their defaults"}`)
    },
    [commit],
  )
  const touch = React.useCallback((id: string) => setFocus(id), [])
  const announce = React.useCallback((m: string) => setSr(m), [])

  /* ------------------------------- the tour -------------------------------- */
  React.useEffect(() => {
    const root = rootRef.current
    if (!autoplay || !root || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const { params: ps, models: ms } = live.current
    const start = latest.current
    const main = start.model
    const other = ms.find((m) => m.id !== main)?.id
    const pT = ps.find((p) => p.id === "temperature")
    const pK = ps.find((p) => p.id === "max_tokens")
    const pP = ps.find((p) => p.id === "top_p")
    if (!pT && !pK) return
    const O = 1500
    const LOOP = O + 14200
    const LS = 1000
    const p0T = pT ? toPos(pT, start.values[main][pT.id]) : 0
    const p0K = pK ? toPos(pK, start.values[main][pK.id]) : 0
    const tempK: [number, number][] = [[0, p0T], [O, p0T], [O + 1500, 0.975], [O + 2700, 0.975], [O + 3900, 0.12], [O + 4600, 0.12], [O + 5400, p0T]]
    const tokK: [number, number][] = [[0, p0K], [O + 5800, p0K], [O + 7000, 0], [O + 8100, 0], [O + 9000, p0K]]
    const modelK: [number, string][] = [[0, main], [O + 9500, other ?? main], [O + 11300, main]]
    const muteK: [number, string[]][] = [[0, start.muted], [O + 11800, pP ? [...start.muted, pP.id] : start.muted], [O + 13100, start.muted]]
    const focusK: [number, string][] = [[0, pT?.id ?? pK!.id], [O + 5800, pK?.id ?? pT!.id], [O + 9500, pT?.id ?? pK!.id], [O + 11800, pP?.id ?? pT?.id ?? pK!.id], [O + 13100, pT?.id ?? pK!.id]]
    const q = (p: FaderbankParam, v: number) => {
      const g = p.entryStep ?? p.step / 5
      return clamp(Number((Math.round((v - p.min) / g) * g + p.min).toFixed(6)), p.min, p.max)
    }

    let clock = 0
    let last = 0
    let raf = 0
    let moved = -1e9
    let liftId: string | null = null
    let visible = typeof IntersectionObserver === "undefined"
    let stopped = false

    const apply = (t: number) => {
      const s = latest.current
      const vals = { ...s.values[main] }
      let movedId: string | null = null
      if (pT) {
        const v = q(pT, fromPos(pT, track(tempK, t)))
        if (v !== vals[pT.id]) movedId = pT.id
        vals[pT.id] = v
      }
      if (pK) {
        const v = q(pK, fromPos(pK, track(tokK, t)))
        if (v !== vals[pK.id]) movedId = pK.id
        vals[pK.id] = v
      }
      const model = stepAt(modelK, t)
      const muted = stepAt(muteK, t)
      const changed = movedId !== null || model !== s.model || muted.join() !== s.muted.join()
      if (changed) commit({ ...s, model, muted, values: { ...s.values, [main]: vals } })
      setFocus(stepAt(focusK, t))
      if (movedId) {
        moved = clock
        liftId = movedId
      } else if (liftId && clock - moved > 160) liftId = null
      setLift(liftId)
    }

    const active = () => visible && !document.hidden && !stopped
    const frame = (ts: number) => {
      raf = 0
      if (!active()) {
        last = 0
        return
      }
      clock += last ? Math.min(64, ts - last) : 0
      last = ts
      if (clock >= LOOP) clock = LS
      apply(clock)
      raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (active() && !raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      stopped = true
      cancelAnimationFrame(raf)
      raf = 0
      setLift(null)
    }
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            visible = !!e?.isIntersecting
            kick()
          })
    io?.observe(root)
    document.addEventListener("visibilitychange", kick)
    root.addEventListener("pointerdown", stop)
    root.addEventListener("keydown", stop)
    kick()
    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      document.removeEventListener("visibilitychange", kick)
      root.removeEventListener("pointerdown", stop)
      root.removeEventListener("keydown", stop)
    }
  }, [autoplay, commit])

  const modelIdx = Math.max(0, models.findIndex((m) => m.id === st.model))
  const model = models[modelIdx]
  const otherIdx = models.length > 1 ? (modelIdx + 1) % models.length : -1
  const vals = st.values[model.id]
  const eff = effective(params, st)

  const focusParam = params.find((p) => p.id === focus && stateOf(st, p.id) === "on") ?? params.find((p) => stateOf(st, p.id) === "on")
  const headline = focusParam ? (focusParam.describe?.(eff[focusParam.id]) ?? `${focusParam.label} ${fmt(focusParam, eff[focusParam.id])}`) : "Everything is on provider defaults"
  // The entrance replays when the meaning changes, not on every step of a number inside the sentence.
  const headKey = `${focusParam?.id ?? "-"}|${headline.replace(/[\d.,]+/g, "#")}`
  const headZone = focusParam ? zoneAt(toPos(focusParam, eff[focusParam.id]), focusParam.hot ?? 0.8) : "g"

  // How different five runs of the same request would be.
  const temp = eff.temperature
  const topP = eff.top_p ?? 1
  const variety = temp === undefined ? 0 : Math.pow(clamp(temp / 1.5, 0, 1), 0.8) * (0.35 + 0.65 * topP)
  const distinct = clamp(1 + Math.floor(variety * 4.99), 1, 5)
  const hotN = samples !== false && samples.hot?.length && temp !== undefined ? clamp(Math.round(((temp - 1.15) / 0.7) * 5), 0, 5) : 0
  const maxTok = eff.max_tokens
  const cutRatio = maxTok === undefined ? 1 : clamp(maxTok / typicalTokens, 0.12, 1)
  const cut = maxTok !== undefined && maxTok < typicalTokens
  const used = Math.min(typicalTokens, maxTok ?? typicalTokens)
  const cost = ((model.price ?? 0) * used * queue) / 1e6
  const shownCost = useTween(cost, 420)
  const delta = baseCost > 0 ? (cost - baseCost) / baseCost : 0
  const deltaOn = Math.abs(delta) >= 0.01

  const reset = () => {
    commit(initialState(params, models, defaultModel, defaultMuted, defaultSolo))
    setSr("Desk reset to its starting settings")
  }
  const pick = (id: string) => {
    if (id === latest.current.model) return
    commit({ ...latest.current, model: id })
    setSr(`Showing ${models.find((m) => m.id === id)?.name}`)
  }

  const showSamples = samples !== false && samples.replies.length >= 1
  const letter = (i: number) => String.fromCharCode(65 + i)

  return (
    <div className={`ifb${className ? ` ${className}` : ""}`} ref={rootRef} data-boot={boot || undefined}>
      <style href="faderbank" precedence="default">
        {CSS}
      </style>
      <div className="ifb-card">
        <div className="ifb-top">
          <h3 className="ifb-title">{title}</h3>
          <p className="ifb-subtitle">{subtitle}</p>
        </div>

        <section className="ifb-desk" aria-label="Faders">
          <div className="ifb-ab" role="group" aria-label="Model to tune" style={{ "--n": models.length, "--sel": modelIdx } as React.CSSProperties}>
            {models.map((m, i) => (
              <button key={m.id} type="button" className="ifb-abb" aria-pressed={m.id === st.model} onClick={() => pick(m.id)}>
                <b>{letter(i)}</b>
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          <div className="ifb-chs" style={{ "--n": Math.max(1, params.length) } as React.CSSProperties}>
            {params.map((p, i) => (
              <Channel
                key={p.id}
                param={p}
                value={vals[p.id]}
                state={stateOf(st, p.id)}
                soloed={st.solo.includes(p.id)}
                index={i}
                otherLetter={otherIdx >= 0 ? letter(otherIdx) : null}
                otherValue={otherIdx >= 0 ? st.values[models[otherIdx].id][p.id] : 0}
                lift={lift === p.id}
                onChange={setValue}
                onMute={toggleMute}
                onSolo={toggleSolo}
                onTouch={touch}
                announce={announce}
              />
            ))}
          </div>

          <div className="ifb-foot">
            <span className="ifb-legend">
              <i className="ifb-lg" aria-hidden />
              {otherIdx >= 0 ? `Dashed cap: where ${letter(otherIdx)} sits` : "Fader"}
            </span>
            <span className="ifb-hint">LEDs show how far each fader is pushed.</span>
            <button type="button" className="ifb-reset" onClick={reset}>
              Reset
            </button>
          </div>
        </section>

        <section className="ifb-out" aria-label="What this setting does">
          <div className="ifb-say">
            <p className="ifb-head" key={headKey}>
              <i className="ifb-dot" data-z={headZone} aria-hidden />
              <span>{headline}</span>
            </p>
            <p className="ifb-sub">{temp === undefined ? "Muted channels use the provider default." : hotN > 0 ? `${hotN === 5 ? "All five" : `${hotN} of 5`} runs drift off course.` : VARIETY_LINE[distinct - 1]}</p>
          </div>

          {showSamples ? (
            <div className="ifb-runs">
              <div className="ifb-runs-h">
                <span>Same ticket, five runs</span>
                <span className="ifb-count">
                  {distinct} distinct {distinct === 1 ? "opening" : "openings"}
                </span>
              </div>
              <p className="ifb-ticket">{samples.ticket}</p>
              <ol className="ifb-list">
                {RUN_PATTERN[distinct - 1].map((idx, i) => {
                  const drift = i >= 5 - hotN
                  const full = drift && samples.hot?.length ? samples.hot[i % samples.hot.length] : samples.replies[idx % samples.replies.length]
                  const tokens = tokenise(full)
                  const k = cut ? Math.min(tokens.length - 1, Math.max(2, Math.floor(tokens.length * cutRatio))) : tokens.length
                  const shown = tokens.slice(0, k)
                  const rest = tokens.slice(k)
                  return (
                    <li className="ifb-run" key={i}>
                      <span className="ifb-n">{i + 1}</span>
                      <span className="ifb-rt" key={`${drift ? "h" : "n"}${idx}`}>
                        {runs(shown)}
                        {cut ? (
                          <em className="ifb-cutmark">
                            <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                              <circle cx="3" cy="9" r="1.7" />
                              <circle cx="3" cy="3" r="1.7" />
                              <path d="M4.4 4.1 11 9.6M4.4 7.9 11 2.4" />
                            </svg>
                            cut
                          </em>
                        ) : null}
                        {rest.length ? <span className="ifb-rest">{rest.map((x) => x.t).join("")}</span> : null}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          ) : null}

          <div className="ifb-cost">
            <p className="ifb-cost-k">
              Re-drafting today&rsquo;s {queue} open {queue === 1 ? "ticket" : "tickets"} on {model.name}
            </p>
            <div className="ifb-bigrow">
              <b className="ifb-big">{money(shownCost)}</b>
              <i className="ifb-delta" data-up={delta > 0 || undefined} data-none={deltaOn ? undefined : ""}>
                {delta > 0 ? "+" : "−"}
                {Math.round(Math.abs(delta) * 100)}% vs. start
              </i>
            </div>
            <p className="ifb-limit" data-cut={cut || undefined}>
              {maxTok === undefined
                ? "No token limit set."
                : cut
                  ? `Limit ${Math.round(maxTok).toLocaleString("en-US")} tokens. A normal reply needs about ${typicalTokens}, so replies stop mid-sentence.`
                  : `Limit ${Math.round(maxTok).toLocaleString("en-US")} tokens. A normal reply needs about ${typicalTokens}, so every reply finishes.`}
            </p>
          </div>
        </section>
      </div>
      <div className="ifb-sr" role="status" aria-live="polite">
        {sr}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ifb {
  --ifb-ink: #000;
  --ifb-surface: #fff;
  --ifb-accent: #0060e2;
  --ifb-warn: #9a5700;
  --ifb-good: #17803a;
  --ifb-hot: #ffb020;
  --ifb-go: #32d74b;
  --ifb-stop: #ff5a4f;
  --ifb-t1: color-mix(in oklab, var(--ifb-ink) 88%, transparent);
  --ifb-t2: color-mix(in oklab, var(--ifb-ink) 61%, transparent);
  --ifb-t3: color-mix(in oklab, var(--ifb-ink) 45%, transparent);
  --ifb-t4: color-mix(in oklab, var(--ifb-ink) 27%, transparent);
  --ifb-fill: color-mix(in oklab, var(--ifb-ink) 6%, transparent);
  --ifb-line: color-mix(in oklab, var(--ifb-ink) 11%, transparent);
  --ifb-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ifb-float: 0 0 0 .5px rgb(0 0 0 / .12), 0 1px 2px rgb(0 0 0 / .14), 0 7px 12px -5px rgb(0 0 0 / .2);
  --ifb-glint: rgb(255 255 255 / .85);
  --ifb-ease: cubic-bezier(.22, 1, .36, 1);
  --ifb-font: Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  /* the hardware: a graphite desk with light caps, in both themes */
  --ifb-desk-a: #303137;
  --ifb-desk-b: #1d1e22;
  --ifb-d1: rgb(255 255 255 / .94);
  --ifb-d2: rgb(255 255 255 / .7);
  --ifb-d3: rgb(255 255 255 / .46);
  --ifb-d4: rgb(255 255 255 / .22);
  --ifb-dline: rgb(255 255 255 / .08);
  --ifb-cap: #f6f6f8;
  --ifb-capink: #1d1d1f;
  --ifb-ridge-a: rgb(0 0 0 / .16);
  --ifb-ridge-b: rgb(255 255 255 / .7);
  --ifb-ondesk: color-mix(in oklab, var(--ifb-accent) 55%, #fff);
  --ifb-len: 256px;
  --ifb-th: 24px;
  --ifb-rail: 52px;
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 980px;
  color: var(--ifb-t1);
  font-family: var(--ifb-font);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .ifb {
  --ifb-ink: #fff;
  --ifb-surface: #1c1c1e;
  --ifb-accent: #4d8dff;
  --ifb-warn: #f5b94a;
  --ifb-good: #4cd964;
  --ifb-hot: #f5b94a;
  --ifb-t1: color-mix(in oklab, var(--ifb-ink) 90%, transparent);
  --ifb-t2: color-mix(in oklab, var(--ifb-ink) 62%, transparent);
  --ifb-t3: color-mix(in oklab, var(--ifb-ink) 46%, transparent);
  --ifb-t4: color-mix(in oklab, var(--ifb-ink) 28%, transparent);
  --ifb-fill: color-mix(in oklab, var(--ifb-ink) 8%, transparent);
  --ifb-line: color-mix(in oklab, var(--ifb-ink) 12%, transparent);
  --ifb-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ifb-float: 0 0 0 .5px rgb(255 255 255 / .14), 0 1px 2px rgb(0 0 0 / .45), 0 8px 14px -6px rgb(0 0 0 / .65);
  --ifb-glint: rgb(255 255 255 / .09);
  --ifb-desk-a: #141417;
  --ifb-desk-b: #0a0a0c;
  --ifb-cap: #44454c;
  --ifb-capink: #f2f2f4;
  --ifb-ridge-a: rgb(0 0 0 / .4);
  --ifb-ridge-b: rgb(255 255 255 / .16);
}
.ifb *, .ifb *::before, .ifb *::after { box-sizing: border-box }
:where(.ifb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.ifb) input { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; border-radius: 0 }
:where(.ifb) h3, :where(.ifb) p, :where(.ifb) ol { margin: 0; padding: 0 }
.ifb :focus-visible { outline: 2px solid color-mix(in oklab, var(--ifb-accent) 70%, #fff); outline-offset: 2px }
.ifb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }

/* ----------------------------------- card ----------------------------------- */
.ifb-card { background: var(--ifb-surface); border-radius: 22px; box-shadow: var(--ifb-shadow); padding: 16px; display: grid; gap: 16px; min-width: 0 }
.ifb-top { display: grid; gap: 2px; padding: 2px 4px 0 }
.ifb-title { font-size: 15px; line-height: 20px; font-weight: 500; color: var(--ifb-t1) }
.ifb-subtitle { font-size: 12.5px; line-height: 18px; color: var(--ifb-t3) }
@container (min-width: 840px) {
  .ifb-card { grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); column-gap: 22px; row-gap: 14px; padding: 18px }
  .ifb-top { grid-column: 1 / -1 }
  .ifb-desk { --ifb-len: 300px }
}

/* ------------------------------------ desk ----------------------------------- */
.ifb-desk { position: relative; background: linear-gradient(180deg, var(--ifb-desk-a), var(--ifb-desk-b)); color: var(--ifb-d1); border-radius: 16px; padding: 14px; display: grid; gap: 12px; align-content: start; grid-template-rows: auto minmax(0, 1fr) auto; min-width: 0;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .09), inset 0 0 0 .5px rgb(255 255 255 / .06), inset 0 12px 28px rgb(0 0 0 / .28), 0 0 0 .5px rgb(0 0 0 / .55), 0 1px 1px rgb(0 0 0 / .08) }
.ifb-desk::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background:
    radial-gradient(circle at 7px 7px, rgb(255 255 255 / .2) 0 1.5px, transparent 2.2px),
    radial-gradient(circle at calc(100% - 7px) 7px, rgb(255 255 255 / .2) 0 1.5px, transparent 2.2px),
    radial-gradient(circle at 7px calc(100% - 7px), rgb(255 255 255 / .2) 0 1.5px, transparent 2.2px),
    radial-gradient(circle at calc(100% - 7px) calc(100% - 7px), rgb(255 255 255 / .2) 0 1.5px, transparent 2.2px) }
.ifb-ab { position: relative; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); background: rgb(0 0 0 / .4); border-radius: 11px; padding: 3px; isolation: isolate; box-shadow: inset 0 1px 3px rgb(0 0 0 / .6), 0 1px 0 rgb(255 255 255 / .06) }
.ifb-ab::before { content: ""; position: absolute; z-index: -1; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px) / var(--n)); border-radius: 8px;
  background: linear-gradient(180deg, color-mix(in oklab, var(--ifb-cap) 90%, #fff), var(--ifb-cap)); box-shadow: inset 0 1px 0 rgb(255 255 255 / .35), 0 0 0 .5px rgb(0 0 0 / .5), 0 2px 3px rgb(0 0 0 / .4);
  transform: translateX(calc(var(--sel) * 100%)); transition: transform 360ms var(--ifb-ease) }
.ifb-abb { display: flex; align-items: center; justify-content: center; gap: 7px; height: 30px; border-radius: 8px; font-size: 12.5px; font-weight: 500; color: var(--ifb-d2); min-width: 0; transition: color 200ms var(--ifb-ease) }
.ifb-abb b { font-weight: 600; font-size: 11px; width: 18px; height: 18px; border-radius: 6px; display: grid; place-items: center; background: rgb(255 255 255 / .1); color: var(--ifb-d1); flex: none; transition: background-color 200ms var(--ifb-ease), color 200ms var(--ifb-ease) }
.ifb-abb span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ifb-abb[aria-pressed="true"] { color: var(--ifb-capink) }
.ifb-abb[aria-pressed="true"] b { background: var(--ifb-accent); color: #fff }
.ifb-chs { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 10px }

/* ---------------------------------- channel ---------------------------------- */
.ifb-ch { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; padding: 10px 0 8px; border-radius: 11px;
  background: linear-gradient(180deg, rgb(255 255 255 / .05), rgb(255 255 255 / .015)); box-shadow: inset 0 0 0 .5px var(--ifb-dline), inset 0 1px 0 rgb(255 255 255 / .05) }
.ifb-name { max-width: 100%; padding: 0 2px; overflow: hidden; text-overflow: ellipsis; font-size: 11.5px; line-height: 16px; font-weight: 500; color: var(--ifb-d2); letter-spacing: .005em; white-space: nowrap }
.ifb-num { width: calc(100% - 14px); max-width: 84px; height: 30px; border-radius: 8px; background: rgb(0 0 0 / .42); box-shadow: inset 0 1px 3px rgb(0 0 0 / .7), 0 1px 0 rgb(255 255 255 / .07); text-align: center;
  font-size: 15px; line-height: 30px; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--ifb-d1); transition: color 200ms var(--ifb-ease), box-shadow 200ms var(--ifb-ease) }
.ifb-num:hover { box-shadow: inset 0 1px 3px rgb(0 0 0 / .7), 0 0 0 .5px rgb(255 255 255 / .22) }
.ifb-num:focus-visible { outline-offset: 0 }
.ifb-ch:not([data-state="on"]) .ifb-num { color: var(--ifb-d3) }
.ifb-word { display: block; max-width: 100%; padding: 0 3px; height: 14px; overflow: hidden; text-overflow: ellipsis; text-align: center; font-size: 11px; line-height: 14px; color: var(--ifb-d2); white-space: nowrap; transition: color 200ms var(--ifb-ease) }
.ifb-word[data-hot] { color: var(--ifb-hot) }
.ifb-tag { font-weight: 600; color: var(--ifb-hot) }
.ifb-end { display: none; max-width: 100%; padding: 0 3px; overflow: hidden; text-overflow: ellipsis; font-size: 10px; line-height: 12px; color: var(--ifb-d2); white-space: nowrap }

.ifb-zone { display: flex; justify-content: center; align-items: stretch; gap: 4px; width: 100%; flex: 1 1 var(--ifb-len); min-height: var(--ifb-len); margin-top: 4px }
.ifb-rail { position: relative; flex: none; width: var(--ifb-rail) }
.ifb-scale { position: absolute; right: 0; width: 5px; bottom: calc(var(--ifb-th) / 2); height: calc(100% - var(--ifb-th) + 1px);
  background: linear-gradient(0deg, var(--ifb-d4) 0 1px, transparent 1px) 0 100% / 100% calc((100% - 1px) / 20) repeat-y }
.ifb-tk { position: absolute; right: 0; width: 9px; height: 1px; background: var(--ifb-d2);
  bottom: calc(var(--ifb-th) / 2 + var(--p) * (100% - var(--ifb-th))); transition: width 200ms var(--ifb-ease), background-color 200ms var(--ifb-ease) }
.ifb-tk[data-on] { width: 14px; background: var(--ifb-d1) }
.ifb-tl { position: absolute; right: 15px; font-size: 10.5px; line-height: 12px; color: var(--ifb-d2); white-space: nowrap; text-align: right;
  bottom: calc(var(--ifb-th) / 2 + var(--p) * (100% - var(--ifb-th)) - 6px); transition: color 200ms var(--ifb-ease) }
.ifb-tl[data-on] { color: var(--ifb-d1); font-weight: 500 }

.ifb-trk { position: relative; flex: none; width: 42px; touch-action: none; cursor: ns-resize; user-select: none; -webkit-user-select: none }
.ifb-slot { position: absolute; left: 50%; margin-left: -3px; width: 6px; top: calc(var(--ifb-th) / 2); bottom: calc(var(--ifb-th) / 2); border-radius: 3px;
  background: rgb(0 0 0 / .62); box-shadow: inset 0 1px 3px rgb(0 0 0 / .95), 0 1px 0 rgb(255 255 255 / .1) }
.ifb-gh { position: absolute; left: 50%; margin-left: -18px; width: 36px; height: var(--ifb-th); border-radius: 6px; border: 1.5px dashed var(--ifb-d3); display: grid; place-items: center; pointer-events: none;
  font-size: 10px; line-height: 1; font-weight: 600; color: var(--ifb-d2); bottom: calc(var(--p) * (100% - var(--ifb-th))); transition: bottom 420ms var(--ifb-ease) }

.ifb-cap { position: absolute; z-index: 1; left: 50%; margin-left: -18px; width: 36px; height: var(--ifb-th); border-radius: 6px; border: 1.5px dashed transparent;
  background-color: var(--ifb-cap);
  background-image: linear-gradient(180deg, color-mix(in oklab, var(--ifb-cap) 86%, #fff), var(--ifb-cap) 55%, color-mix(in oklab, var(--ifb-cap) 90%, #000));
  bottom: calc(var(--p) * (100% - var(--ifb-th))); cursor: grab;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .55), inset 0 -1px 0 rgb(0 0 0 / .2), 0 0 0 .5px rgb(0 0 0 / .6), 0 2px 3px rgb(0 0 0 / .5), 0 7px 10px -3px rgb(0 0 0 / .45);
  transition: bottom 420ms var(--ifb-ease), transform 180ms var(--ifb-ease), box-shadow 180ms var(--ifb-ease), background-color 220ms var(--ifb-ease), border-color 220ms var(--ifb-ease) }
.ifb-cap::before { content: ""; position: absolute; left: 4px; right: 4px; top: 50%; height: 2px; margin-top: -1px; border-radius: 1px; background: var(--ifb-accent); box-shadow: 0 0 6px color-mix(in oklab, var(--ifb-accent) 60%, transparent); transition: background-color 200ms var(--ifb-ease), opacity 200ms var(--ifb-ease) }
.ifb-cap::after { content: ""; position: absolute; inset: 3px 4px; pointer-events: none;
  background: repeating-linear-gradient(180deg, var(--ifb-ridge-a) 0 1px, var(--ifb-ridge-b) 1px 2px);
  -webkit-mask: linear-gradient(180deg, #000 0 calc(50% - 4px), transparent calc(50% - 4px) calc(50% + 4px), #000 calc(50% + 4px));
  mask: linear-gradient(180deg, #000 0 calc(50% - 4px), transparent calc(50% - 4px) calc(50% + 4px), #000 calc(50% + 4px)); transition: opacity 200ms var(--ifb-ease) }
.ifb-ch[data-drag] .ifb-cap { transition: transform 160ms var(--ifb-ease), box-shadow 160ms var(--ifb-ease); cursor: grabbing; transform: scale(1.08);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .55), inset 0 -1px 0 rgb(0 0 0 / .2), 0 0 0 .5px rgb(0 0 0 / .6), 0 0 0 3px color-mix(in oklab, var(--ifb-accent) 50%, transparent), 0 3px 4px rgb(0 0 0 / .5), 0 14px 18px -4px rgb(0 0 0 / .65) }
.ifb-ch:not([data-state="on"]) .ifb-cap { background-color: transparent; background-image: none; border-color: var(--ifb-d3); box-shadow: none }
.ifb-ch:not([data-state="on"]) .ifb-cap::after { opacity: 0 }
.ifb-ch:not([data-state="on"]) .ifb-cap::before { background: var(--ifb-d3); box-shadow: none }
.ifb-cap:focus-visible { outline-offset: 4px }

.ifb-meter { flex: none; width: 10px; margin: calc(var(--ifb-th) / 2) 0; display: flex; flex-direction: column-reverse; justify-content: space-between; pointer-events: none }
.ifb-led { position: relative; display: block; width: 100%; height: 10px; border-radius: 2px; background: rgb(255 255 255 / .09); box-shadow: inset 0 1px 1px rgb(0 0 0 / .5);
  transition: background-color 160ms var(--ifb-ease) calc((15 - var(--i)) * 8ms), box-shadow 160ms var(--ifb-ease) calc((15 - var(--i)) * 8ms) }
.ifb-led[data-z="g"] { --lc: var(--ifb-go) }
.ifb-led[data-z="a"] { --lc: var(--ifb-hot) }
.ifb-led[data-z="r"] { --lc: var(--ifb-stop) }
.ifb-led[data-on] { background: var(--lc); box-shadow: inset 0 1px 0 rgb(255 255 255 / .4), 0 0 7px color-mix(in oklab, var(--lc) 55%, transparent); transition-delay: calc(var(--i) * 8ms) }
.ifb-led::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--lc); opacity: 0; box-shadow: 0 0 8px var(--lc) }
.ifb-ch[data-drag] .ifb-led { transition-duration: 60ms; transition-delay: 0s }

.ifb-btns { display: flex; gap: 4px; width: calc(100% - 14px); max-width: 88px; margin-top: 4px }
.ifb-btn { flex: 1 1 0; min-width: 0; height: 24px; display: inline-flex; align-items: center; justify-content: center; gap: 5px; border-radius: 7px; font-size: 11px; line-height: 24px; font-weight: 500; color: var(--ifb-d2);
  background: linear-gradient(180deg, rgb(255 255 255 / .15), rgb(255 255 255 / .07)); box-shadow: inset 0 1px 0 rgb(255 255 255 / .14), 0 0 0 .5px rgb(0 0 0 / .6), 0 1px 2px rgb(0 0 0 / .4);
  transition: background-color 200ms var(--ifb-ease), color 200ms var(--ifb-ease), box-shadow 200ms var(--ifb-ease), transform 120ms var(--ifb-ease) }
.ifb-btn::before { content: ""; flex: none; width: 5px; height: 5px; border-radius: 50%; box-shadow: inset 0 0 0 1px currentColor; opacity: .6 }
.ifb-btn:active { transform: scale(.95) }
.ifb-btn[aria-pressed="true"] { font-weight: 600; background: rgb(0 0 0 / .35); box-shadow: inset 0 1px 3px rgb(0 0 0 / .6), inset 0 0 0 1px currentColor }
.ifb-btn[aria-pressed="true"]::before { background: currentColor; box-shadow: 0 0 7px currentColor; opacity: 1 }
.ifb-btn[data-kind="mute"][aria-pressed="true"] { color: var(--ifb-hot) }
.ifb-btn[data-kind="solo"][aria-pressed="true"] { color: var(--ifb-ondesk) }

@container (max-width: 559px) {
  .ifb-ch { gap: 5px; padding: 8px 0 6px }
  .ifb-desk { padding: 12px 10px }
  .ifb-chs { gap: 8px }
  .ifb-ab { padding: 2px }
  .ifb-ab::before { top: 2px; bottom: 2px; left: 2px; width: calc((100% - 4px) / var(--n)) }
  .ifb-abb { font-size: 12px; gap: 5px }
  .ifb-abb span { max-width: 9ch }
  .ifb-name { font-size: 10.5px; padding: 0 }
  .ifb-num { font-size: 14px; width: calc(100% - 10px) }
  .ifb-rail { --ifb-rail: 7px; width: 7px }
  .ifb-tl, .ifb-tk { display: none }
  .ifb-end { display: block }
  .ifb-dflt { display: none }
  .ifb-btns { width: calc(100% - 8px); gap: 3px }
  .ifb-btn::before { display: none }
  .ifb-hint { display: none }
}

.ifb-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 12px; padding: 2px 2px 0; font-size: 11.5px; line-height: 16px; color: var(--ifb-d2) }
.ifb-legend { display: inline-flex; align-items: center; gap: 7px }
.ifb-lg { display: block; width: 18px; height: 11px; border-radius: 3px; border: 1.5px dashed var(--ifb-d3) }
.ifb-hint { flex: 1 1 150px; min-width: 0; text-align: center; color: var(--ifb-d2) }
.ifb-reset { font-size: 11.5px; font-weight: 500; color: var(--ifb-d1); padding: 3px 10px; border-radius: 7px; background: linear-gradient(180deg, rgb(255 255 255 / .15), rgb(255 255 255 / .07)); box-shadow: inset 0 1px 0 rgb(255 255 255 / .14), 0 0 0 .5px rgb(0 0 0 / .6), 0 1px 2px rgb(0 0 0 / .4); transition: transform 120ms var(--ifb-ease) }
.ifb-reset:active { transform: scale(.95) }

/* ----------------------------------- output ---------------------------------- */
.ifb-out { display: grid; gap: 18px; align-content: space-between; min-width: 0; padding: 2px 4px 0 }
.ifb-say { display: grid; gap: 4px; min-height: 66px; align-content: start }
.ifb-head { display: flex; align-items: flex-start; gap: 10px; font-size: 22px; line-height: 28px; font-weight: 500; letter-spacing: -.015em; color: var(--ifb-t1); animation: ifb-in 300ms var(--ifb-ease) backwards }
.ifb-dot { flex: none; width: 9px; height: 9px; margin-top: 10px; border-radius: 50%; background: var(--ifb-go); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ifb-go) 22%, transparent); transition: background-color 240ms var(--ifb-ease), box-shadow 240ms var(--ifb-ease) }
.ifb-dot[data-z="a"] { background: var(--ifb-hot); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ifb-hot) 26%, transparent) }
.ifb-dot[data-z="r"] { background: var(--ifb-stop); box-shadow: 0 0 0 3px color-mix(in oklab, var(--ifb-stop) 24%, transparent) }
.ifb-sub { font-size: 12.5px; line-height: 18px; color: var(--ifb-t2); min-height: 18px; padding-left: 19px }
.ifb-runs { display: grid; gap: 4px }
.ifb-runs-h { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 12.5px; font-weight: 500; color: var(--ifb-t1) }
.ifb-count { font-weight: 400; font-size: 11.5px; color: var(--ifb-t2); font-variant-numeric: tabular-nums; white-space: nowrap }
.ifb-ticket { font-size: 12px; line-height: 16px; color: var(--ifb-t2); margin-bottom: 2px }
.ifb-list { list-style: none; display: grid }
.ifb-run { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 8px; padding: 8px 0; min-height: 71px; border-top: .5px solid var(--ifb-line); font-size: 12.5px; line-height: 18px; color: var(--ifb-t1) }
.ifb-n { width: 18px; height: 18px; border-radius: 6px; background: var(--ifb-fill); color: var(--ifb-t2); font-size: 10.5px; font-weight: 500; display: grid; place-items: center; font-variant-numeric: tabular-nums }
.ifb-rt { animation: ifb-in 300ms var(--ifb-ease) backwards; min-width: 0; overflow-wrap: anywhere }
.ifb-rest { color: color-mix(in oklab, var(--ifb-ink) 21%, transparent); text-decoration: line-through; text-decoration-color: transparent }
.ifb-drift { color: inherit; background: color-mix(in oklab, var(--ifb-hot) 30%, transparent); box-shadow: 0 1px 0 var(--ifb-hot); border-radius: 3px; padding: 0 2px; margin: 0 -1px; -webkit-box-decoration-break: clone; box-decoration-break: clone }
.ifb-cutmark { display: inline-flex; align-items: center; gap: 3px; margin: 0 5px; padding: 0 6px 0 5px; border-radius: 5px; font-style: normal; font-size: 10.5px; line-height: 15px; font-weight: 600; vertical-align: 1px;
  background: color-mix(in oklab, var(--ifb-hot) 20%, transparent); color: var(--ifb-warn) }
.ifb-cost { display: grid; gap: 4px; padding-top: 14px; border-top: .5px solid var(--ifb-line) }
.ifb-cost-k { font-size: 12.5px; line-height: 18px; color: var(--ifb-t2) }
.ifb-bigrow { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px }
.ifb-big { font-size: 38px; line-height: 44px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--ifb-t1) }
.ifb-delta { font-style: normal; font-size: 11.5px; line-height: 18px; font-weight: 600; padding: 1px 8px; border-radius: 6px; font-variant-numeric: tabular-nums; white-space: nowrap;
  background: color-mix(in oklab, var(--ifb-go) 18%, transparent); color: var(--ifb-good); transition: opacity 240ms var(--ifb-ease), background-color 240ms var(--ifb-ease), color 240ms var(--ifb-ease) }
.ifb-delta[data-up] { background: color-mix(in oklab, var(--ifb-hot) 20%, transparent); color: var(--ifb-warn) }
.ifb-delta[data-none] { opacity: 0 }
.ifb-limit { min-height: 36px; font-size: 12.5px; line-height: 18px; color: var(--ifb-t2); transition: color 200ms var(--ifb-ease) }
.ifb-limit[data-cut] { color: var(--ifb-warn) }
@container (min-width: 840px) { .ifb-limit { min-height: 36px } }

/* ----------------------------------- motion ---------------------------------- */
@keyframes ifb-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes ifb-blip { 0% { opacity: 0 } 22% { opacity: .95 } 55% { opacity: .95 } 100% { opacity: 0 } }
.ifb[data-boot] .ifb-led::after { animation: ifb-blip 700ms var(--ifb-ease) calc(var(--ci, 0) * 90ms + var(--i) * 22ms) backwards }

@media (prefers-reduced-motion: reduce) {
  .ifb *, .ifb *::before, .ifb *::after { animation: none !important; transition: none !important }
}
@media (forced-colors: active) {
  .ifb-cap, .ifb-slot, .ifb-gh, .ifb-num, .ifb-btn, .ifb-reset, .ifb-ab { border: 1px solid CanvasText }
  .ifb-cap { forced-color-adjust: none; background: Canvas }
  .ifb-led { forced-color-adjust: none; border: 1px solid CanvasText }
  .ifb-led[data-on] { background: Highlight }
  .ifb-btn[aria-pressed="true"] { text-decoration: underline }
}
`

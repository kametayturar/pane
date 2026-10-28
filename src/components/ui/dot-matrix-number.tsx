"use client"

import * as React from "react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DotMatrixSize = "sm" | "md" | "lg"

export type DotMatrixNumberProps = {
  /** The number to draw. When it changes, every dot fades or scales to its new state – dots lit in both glyphs stay put. */
  value: number
  /** How to turn the number into text: `Intl.NumberFormat` options, or your own function. Default is plain digits with grouping. */
  format?: Intl.NumberFormatOptions | ((value: number) => string)
  /** Locale for `format` options. Default "en-US". */
  locale?: string
  /** Pad integers with leading zeros to at least this many digits. */
  minDigits?: number
  /** Text drawn in dots before the number, e.g. "+". The font has 0-9 . , : - + % / K M B and space. */
  prefix?: string
  /** Text drawn in dots after the number, e.g. "%". */
  suffix?: string
  /** Distance between dots: `sm` 5px, `md` 8px, `lg` 12px, or a number of px. Default `md`. */
  size?: DotMatrixSize | number
  /** Dot colour (any CSS colour). Defaults to a calm blue. */
  accent?: string
  /** Dot shape. Default `round`. */
  shape?: "round" | "square"
  /** Show the unlit dots as a faint grid. Default true. */
  dim?: boolean
  /** Accessible name; the number itself is read out as the value. */
  label?: string
  className?: string
}

export type VitalsStat = { label: string; value: string | number; unit?: string }

export type VitalsCardProps = {
  /** Controlled value (biological age). */
  value?: number
  /** Starting value when uncontrolled. */
  defaultValue?: number
  /** Called while the ruler is dragged or the keyboard steps the value. */
  onValueChange?: (value: number) => void
  /** Ruler range. Defaults 18–80. */
  min?: number
  max?: number
  /** Real age, to compare with. Default 38. */
  chronologicalAge?: number
  /** Small mono label above the title. */
  label?: string
  /** Title in the accent colour. */
  title?: string
  /** Text of the date chip at the top right. */
  date?: string
  /** Caption under the number. Default: "13 years younger" style. */
  caption?: (value: number, chronologicalAge: number) => string
  /** The two numbers at the bottom. */
  stats?: VitalsStat[]
  /** Accent colour (any CSS colour). */
  accent?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dmn, .vc {
  --dmn-ink: #000;
  --dmn-accent: #2f66e8;
  --dmn-ease: cubic-bezier(.22, 1, .36, 1);
  --dmn-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;
}
:is(.dark, [data-theme="dark"]) .dmn, :is(.dark, [data-theme="dark"]) .vc { --dmn-ink: #fff; --dmn-accent: #6f9bff; }
.dmn *, .dmn *::before, .dmn *::after, .vc *, .vc *::before, .vc *::after { box-sizing: border-box }

/* The number: a row of glyphs, each a grid of dots. Unlit dots stay as a faint matrix. */
.dmn { --dmn-pitch: 8px; --dmn-dot: calc(var(--dmn-pitch) * .66); display: inline-flex; vertical-align: middle; color: var(--dmn-accent); position: relative }
.dmn-row { display: inline-flex; align-items: flex-start; gap: calc(var(--dmn-pitch) * 1.2) }
.dmn-g { display: grid; grid-template-rows: repeat(7, var(--dmn-dot)); grid-auto-flow: column; gap: calc(var(--dmn-pitch) - var(--dmn-dot));
  animation: dmn-in .5s var(--dmn-ease) backwards }
.dmn-g i { display: block; width: var(--dmn-dot); height: var(--dmn-dot); border-radius: 50%; background: currentColor;
  opacity: var(--dmn-off, .13); transform: scale(.62);
  transition: opacity .42s var(--dmn-ease) var(--d, 0ms), transform .42s var(--dmn-ease) var(--d, 0ms) }
.dmn[data-shape="square"] .dmn-g i { border-radius: calc(var(--dmn-dot) * .12) }
.dmn[data-dim="false"] { --dmn-off: 0 }
.dmn-g i[data-on] { opacity: 1; transform: scale(1) }
@keyframes dmn-in { from { opacity: 0; transform: scale(.7) } }
.dmn-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Vitals card: frosted glass. */
.vc { --vc-t1: color-mix(in oklab, var(--dmn-ink) 86%, transparent); --vc-t2: color-mix(in oklab, var(--dmn-ink) 55%, transparent);
  --vc-t3: color-mix(in oklab, var(--dmn-ink) 38%, transparent); --vc-line: color-mix(in oklab, var(--dmn-ink) 22%, transparent);
  position: relative; width: 100%; max-width: 296px; padding: 14px 16px 16px; border-radius: 22px; color: var(--vc-t1);
  font-family: var(--vc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); font-size: 13px; line-height: 18px;
  -webkit-font-smoothing: antialiased;
  background: linear-gradient(160deg, rgb(255 255 255 / .56), rgb(255 255 255 / .34));
  -webkit-backdrop-filter: blur(14px) saturate(1.6); backdrop-filter: blur(14px) saturate(1.6);
  box-shadow: 0 0 0 .5px rgb(20 30 70 / .1), inset 0 1px 0 rgb(255 255 255 / .85), 0 18px 40px -14px rgb(30 45 100 / .35), 0 4px 10px -4px rgb(30 45 100 / .12) }
:is(.dark, [data-theme="dark"]) .vc { background: linear-gradient(160deg, rgb(44 46 56 / .55), rgb(28 29 36 / .38));
  box-shadow: 0 0 0 .5px rgb(255 255 255 / .12), inset 0 1px 0 rgb(255 255 255 / .1), 0 18px 40px -14px rgb(0 0 0 / .6) }
.vc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px }
.vc-eyebrow { font-family: var(--dmn-mono); font-size: 8.5px; line-height: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--vc-t3) }
.vc-title { font-size: 14px; line-height: 18px; font-weight: 450; color: var(--dmn-accent) }
.vc-chip { display: inline-flex; align-items: center; gap: 3px; flex: none; margin-top: 2px; padding: 1px 7px; border-radius: 99px; font-family: var(--dmn-mono); font-size: 9px; line-height: 16px;
  color: var(--dmn-accent); background: color-mix(in oklab, var(--dmn-accent) 10%, transparent); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--dmn-accent) 28%, transparent) }
.vc-num { display: flex; justify-content: center; margin-top: 12px }
.vc-cap { margin-top: 10px; text-align: center; font-size: 10.5px; line-height: 14px; font-weight: 500; color: var(--dmn-accent); letter-spacing: .01em }

/* Ruler: one tick per unit; ticks near the needle grow. */
.vc-ruler { position: relative; height: 34px; margin: 12px 2px 0; cursor: ew-resize; touch-action: none; border-radius: 6px; user-select: none; -webkit-user-select: none }
.vc-tick { position: absolute; bottom: 12px; width: 1px; margin-left: -.5px; height: var(--h, 6px); border-radius: 1px; background: var(--vc-line);
  transition: height .28s var(--dmn-ease), background-color .28s var(--dmn-ease) }
.vc-tick[data-major] { background: color-mix(in oklab, var(--dmn-ink) 34%, transparent) }
.vc-needle { position: absolute; bottom: 12px; width: 2px; margin-left: -1px; height: 24px; border-radius: 2px; background: var(--dmn-accent); left: var(--p, 0%); transition: left .24s var(--dmn-ease) }
.vc-needle::before { content: ""; position: absolute; left: 50%; top: -3px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--dmn-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--dmn-accent) 20%, transparent) }
.vc-lab { position: absolute; bottom: -1px; transform: translateX(-50%); font-family: var(--dmn-mono); font-size: 8px; line-height: 10px; color: var(--vc-t3) }
.vc-ruler:focus-visible { outline: 2px solid color-mix(in oklab, var(--dmn-accent) 55%, transparent); outline-offset: 3px }

.vc-stats { display: flex; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: .5px solid color-mix(in oklab, var(--dmn-ink) 14%, transparent) }
.vc-stat-l { font-family: var(--dmn-mono); font-size: 8.5px; line-height: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--vc-t3) }
.vc-stat-v { font-size: 22px; line-height: 26px; font-weight: 300; color: var(--dmn-accent); font-variant-numeric: tabular-nums; letter-spacing: -.01em }
.vc-stat-v small { margin-left: 2px; font-size: 9px; font-weight: 400; color: var(--vc-t2); font-family: var(--dmn-mono) }

@media (prefers-reduced-motion: reduce) {
  .dmn *, .dmn *::before, .dmn *::after, .vc *, .vc *::before, .vc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  The font                                  */
/* -------------------------------------------------------------------------- */

/** 5×7 dot font. "1" = lit. Narrow punctuation uses fewer columns. */
const FONT: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ".": ["0", "0", "0", "0", "0", "0", "1"],
  ",": ["0", "0", "0", "0", "0", "1", "1"],
  ":": ["0", "1", "0", "0", "0", "1", "0"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "/": ["00001", "00001", "00010", "00100", "01000", "10000", "10000"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
}
const BLANK = FONT[" "]

const SIZES: Record<DotMatrixSize, number> = { sm: 5, md: 8, lg: 12 }

function toText(value: number, format: DotMatrixNumberProps["format"], locale: string, minDigits?: number): string {
  if (!Number.isFinite(value)) return "-"
  let text: string
  if (typeof format === "function") text = format(value)
  else text = new Intl.NumberFormat(locale, format ?? { maximumFractionDigits: 0 }).format(value)
  if (minDigits) {
    const m = /^(-?)(\d+)(.*)$/.exec(text)
    if (m) text = m[1] + m[2].padStart(minDigits, "0") + m[3]
  }
  return text
}

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

/** One glyph: a grid of dots. Dots keep their element identity, so a change is a CSS transition of each dot. */
const Glyph = React.memo(function Glyph({ ch }: { ch: string }) {
  const rows = FONT[ch.toUpperCase()] ?? BLANK
  const cols = rows[0].length
  const dots: React.ReactNode[] = []
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 7; r++) {
      dots.push(<i key={`${c}-${r}`} data-on={rows[r][c] === "1" || undefined} style={{ "--d": `${c * 22 + r * 9}ms` } as React.CSSProperties} />)
    }
  }
  return (
    <span className="dmn-g" style={{ gridTemplateColumns: `repeat(${cols}, var(--dmn-dot))` }}>
      {dots}
    </span>
  )
})

/**
 * DotMatrixNumber – numerals drawn on a 5×7 dot grid. Every digit has the same width, so the number doesn't jump,
 * and when the value changes each dot fades or scales to its new state.
 *
 *   <DotMatrixNumber value={25} size="lg" accent="#2f66e8" />
 */
export function DotMatrixNumber({
  value,
  format,
  locale = "en-US",
  minDigits,
  prefix = "",
  suffix = "",
  size = "md",
  accent,
  shape = "round",
  dim = true,
  label,
  className,
}: DotMatrixNumberProps) {
  const text = prefix + toText(value, format, locale, minDigits) + suffix
  const chars = Array.from(text)
  const pitch = typeof size === "number" ? size : SIZES[size]
  const style = { "--dmn-pitch": `${pitch}px`, ...(accent ? { "--dmn-accent": accent } : null) } as React.CSSProperties
  return (
    <span className={className ? `dmn ${className}` : "dmn"} data-shape={shape} data-dim={dim} style={style}>
      <style href="pane-dot-matrix-number" precedence="default">
        {CSS}
      </style>
      <span className="dmn-sr" role="status" aria-live="polite" aria-atomic="true">
        {label ? `${label}: ${text}` : text}
      </span>
      <span className="dmn-row" aria-hidden>
        {/* Keyed from the right, so the units digit keeps its dots when a digit is added or dropped. */}
        {chars.map((ch, i) => (
          <Glyph key={chars.length - i} ch={ch} />
        ))}
      </span>
    </span>
  )
}

const DEFAULT_STATS: VitalsStat[] = [
  { label: "Recovery", value: 86, unit: "%" },
  { label: "Resting HR", value: 52, unit: "bpm" },
]

const defaultCaption = (v: number, age: number) => {
  const d = age - v
  if (d === 0) return "Right on your age"
  return `${Math.abs(d)} year${Math.abs(d) === 1 ? "" : "s"} ${d > 0 ? "younger" : "older"}`
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/**
 * VitalsCard – a frosted-glass readout: a big dot-matrix number, a caption and a tick ruler you drag (or step with
 * the arrow keys) to change it, with two stats underneath. Put it over anything colourful or textured.
 *
 *   <VitalsCard defaultValue={25} onValueChange={setAge} />
 */
export function VitalsCard({
  value,
  defaultValue = 25,
  onValueChange,
  min = 18,
  max = 80,
  chronologicalAge = 38,
  label = "Longevity",
  title = "Biological age",
  date = "Oct 2026",
  caption = defaultCaption,
  stats = DEFAULT_STATS,
  accent,
  className,
}: VitalsCardProps) {
  const [inner, setInner] = React.useState(defaultValue)
  const v = clamp(value ?? inner, min, max)
  const rulerRef = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)

  const set = (next: number) => {
    const n = clamp(Math.round(next), min, max)
    if (n === v) return
    setInner(n)
    onValueChange?.(n)
  }
  const fromX = (x: number) => {
    const rect = rulerRef.current?.getBoundingClientRect()
    if (!rect || !rect.width) return
    set(min + clamp((x - rect.left) / rect.width, 0, 1) * (max - min))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "PageUp" ? 5 : e.key === "PageDown" ? -5 : e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0
    if (step) set(v + step)
    else if (e.key === "Home") set(min)
    else if (e.key === "End") set(max)
    else return
    e.preventDefault()
  }

  const span = max - min
  const pct = (n: number) => `${((n - min) / span) * 100}%`
  const ticks: React.ReactNode[] = []
  for (let n = min; n <= max; n++) {
    const major = n % 5 === 0
    const d = n - v
    const h = (major ? 9 : 6) + 15 * Math.exp(-(d * d) / 5)
    ticks.push(<i key={n} className="vc-tick" data-major={major || undefined} style={{ left: pct(n), "--h": `${h.toFixed(1)}px` } as React.CSSProperties} />)
  }
  const labels: React.ReactNode[] = []
  for (let n = Math.ceil(min / 10) * 10; n <= max; n += 10) {
    labels.push(
      <span key={n} className="vc-lab" style={{ left: pct(n) }}>
        {n}
      </span>,
    )
  }

  const text = caption(v, chronologicalAge)
  const style = accent ? ({ "--dmn-accent": accent } as React.CSSProperties) : undefined
  return (
    <div className={className ? `vc ${className}` : "vc"} style={style}>
      <style href="pane-dot-matrix-number" precedence="default">
        {CSS}
      </style>
      <div className="vc-head">
        <div>
          <div className="vc-eyebrow">{label}</div>
          <div className="vc-title">{title}</div>
        </div>
        <span className="vc-chip">
          {date}
          <svg width="7" height="7" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m1.5 3 2.5 2.5L6.5 3" />
          </svg>
        </span>
      </div>
      <div className="vc-num">
        <DotMatrixNumber value={v} size={9} label={title} />
      </div>
      <div className="vc-cap">{text}</div>
      <div
        ref={rulerRef}
        className="vc-ruler"
        role="slider"
        tabIndex={0}
        aria-label={title}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={v}
        aria-valuetext={`${v}, ${text}`}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          fromX(e.clientX)
        }}
        onPointerMove={(e) => dragging.current && fromX(e.clientX)}
        onPointerUp={(e) => {
          dragging.current = false
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        onPointerCancel={() => {
          dragging.current = false
        }}
      >
        {ticks}
        {labels}
        <span className="vc-needle" style={{ "--p": pct(v) } as React.CSSProperties} aria-hidden />
      </div>
      <div className="vc-stats">
        {stats.slice(0, 2).map((s) => (
          <div key={s.label}>
            <div className="vc-stat-l">{s.label}</div>
            <div className="vc-stat-v">
              {s.value}
              {s.unit && <small>{s.unit}</small>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

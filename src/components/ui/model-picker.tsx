"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PickerModel = {
  id: string
  name: string
  /** One short line under the name, e.g. "Everyday work". */
  description?: string
  /** Tile content: an svg, an <img> or a letter. Falls back to the first letter of the name. */
  icon?: React.ReactNode
  /** Speed, 1–5 (5 = fastest). */
  speed?: number
  /** Answer quality, 1–5. */
  quality?: number
  /** Cost, 1–5 (5 = most expensive). */
  cost?: number
  /** Typical time to the first token, in milliseconds. */
  latencyMs?: number
  /** Price in dollars per million tokens. */
  pricePerM?: number
}

export type ModelEffort = "low" | "medium" | "high"

export type ModelPickerProps = {
  /** The models to choose from. A model with no speed, quality or cost (a router) shows "Varies". */
  models?: PickerModel[]
  /** Selected model id (controlled). */
  value?: string
  /** Selected model id when uncontrolled. Defaults to the first model. */
  defaultValue?: string
  onChange?: (id: string) => void
  /** Extended thinking switch (controlled). */
  thinking?: boolean
  defaultThinking?: boolean
  onThinkingChange?: (on: boolean) => void
  /** Web search switch (controlled). */
  webSearch?: boolean
  defaultWebSearch?: boolean
  onWebSearchChange?: (on: boolean) => void
  /** Thinking effort (controlled). Only shown while thinking is on. */
  effort?: ModelEffort
  defaultEffort?: ModelEffort
  onEffortChange?: (effort: ModelEffort) => void
  /** Menu open state (controlled). */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end"
  /** Open below or above the trigger. */
  side?: "bottom" | "top"
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mp {
  --mp-ink: #000;
  --mp-surface: #fff;
  --mp-accent: #0060e2;
  --mp-t1: color-mix(in oklab, var(--mp-ink) 88%, transparent);
  --mp-t2: color-mix(in oklab, var(--mp-ink) 61%, transparent);
  --mp-t3: color-mix(in oklab, var(--mp-ink) 45%, transparent);
  --mp-t4: color-mix(in oklab, var(--mp-ink) 27%, transparent);
  --mp-icon: color-mix(in oklab, var(--mp-ink) 44.7%, transparent);
  --mp-hover: color-mix(in oklab, var(--mp-ink) 4%, transparent);
  --mp-fill: color-mix(in oklab, var(--mp-ink) 6%, transparent);
  --mp-line: color-mix(in oklab, var(--mp-ink) 6%, transparent);
  --mp-trig: color-mix(in oklab, var(--mp-ink) 3%, transparent);
  --mp-trig-hover: color-mix(in oklab, var(--mp-ink) 6%, transparent);
  --mp-seg-on: color-mix(in oklab, var(--mp-ink) 20%, transparent);
  --mp-seg-off: color-mix(in oklab, var(--mp-ink) 7%, transparent);
  --mp-switch-off: color-mix(in oklab, var(--mp-ink) 10%, transparent);
  --mp-accent-soft: color-mix(in oklab, var(--mp-accent) 76.5%, transparent);
  --mp-glyph-bg: #fff;
  --mp-glyph-ring: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1);
  --mp-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --mp-ease: cubic-bezier(.32, .72, .24, 1);
  position: relative;
  display: inline-block;
  color: var(--mp-t1);
  font-family: var(--mp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .mp {
  --mp-ink: #fff;
  --mp-surface: #1c1c1e;
  --mp-accent: #4d8dff;
  --mp-t1: color-mix(in oklab, var(--mp-ink) 90%, transparent);
  --mp-t2: color-mix(in oklab, var(--mp-ink) 62%, transparent);
  --mp-t3: color-mix(in oklab, var(--mp-ink) 46%, transparent);
  --mp-t4: color-mix(in oklab, var(--mp-ink) 28%, transparent);
  --mp-icon: color-mix(in oklab, var(--mp-ink) 50%, transparent);
  --mp-hover: color-mix(in oklab, var(--mp-ink) 6%, transparent);
  --mp-fill: color-mix(in oklab, var(--mp-ink) 8%, transparent);
  --mp-line: color-mix(in oklab, var(--mp-ink) 8%, transparent);
  --mp-trig: color-mix(in oklab, var(--mp-ink) 6%, transparent);
  --mp-trig-hover: color-mix(in oklab, var(--mp-ink) 10%, transparent);
  --mp-seg-on: rgb(255 255 255 / .18);
  --mp-seg-off: rgb(255 255 255 / .07);
  --mp-switch-off: color-mix(in oklab, var(--mp-ink) 14%, transparent);
  --mp-glyph-bg: #2a2a2e;
  --mp-glyph-ring: 0 0 0 .5px rgb(255 255 255 / .1);
  --mp-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.mp *, .mp *::before, .mp *::after { box-sizing: border-box }
:where(.mp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.mp :focus-visible { outline: 2px solid color-mix(in oklab, var(--mp-accent) 60%, transparent); outline-offset: 1px }
.mp-list:focus-visible { outline-offset: -1px; border-radius: 6px }
.mp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Trigger */
.mp .mp-trigger {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px; border-radius: 6px;
  background: var(--mp-trig); font-weight: 500; color: var(--mp-t1); white-space: nowrap;
  transition: background-color .16s, color .16s;
}
.mp .mp-trigger:hover, .mp[data-open] .mp-trigger { background: var(--mp-trig-hover) }
.mp-glyph {
  display: grid; place-items: center; flex: none; width: 18px; height: 18px; border-radius: 5px;
  background: var(--mp-glyph-bg); box-shadow: var(--mp-glyph-ring);
  font-size: 10px; line-height: 10px; font-weight: 500; color: var(--mp-ink); overflow: hidden;
}
.mp-glyph svg { width: 10px; height: 10px }
.mp-flag {
  display: grid; grid-template-columns: 0fr; margin-left: -6px; opacity: 0; color: var(--mp-accent-soft);
  transition: grid-template-columns .36s var(--mp-ease), opacity .22s, margin-left .36s var(--mp-ease);
}
.mp-flag[data-on] { grid-template-columns: 1fr; margin-left: 0; opacity: 1 }
.mp-flag > span { display: flex; align-items: center; min-width: 0; overflow: hidden }
.mp-flag svg { flex: none; width: 14px; height: 14px }
.mp-chevron { flex: none; width: 14px; height: 14px; margin-left: -2px; color: var(--mp-icon); transition: transform .3s var(--mp-ease) }
.mp[data-open] .mp-chevron { transform: rotate(180deg) }

/* Menu: grows out of the trigger's corner */
.mp-pop {
  position: absolute; z-index: 50; width: 320px; max-width: calc(100vw - 16px); border-radius: 10px;
  background: var(--mp-surface); box-shadow: var(--mp-float); color: var(--mp-t1);
  visibility: hidden; opacity: 0; pointer-events: none;
  transform: scale(.96) translateY(var(--mp-dy));
  transition: opacity .2s, transform .32s var(--mp-ease), visibility 0s linear .32s;
}
.mp-pop[data-open] {
  visibility: visible; opacity: 1; pointer-events: auto; transform: none;
  transition: opacity .2s, transform .32s var(--mp-ease), visibility 0s;
}
.mp-pop[data-side="bottom"] { top: calc(100% + 6px); --mp-dy: -4px }
.mp-pop[data-side="top"] { bottom: calc(100% + 6px); --mp-dy: 4px }
.mp-pop[data-align="start"] { left: 0 }
.mp-pop[data-align="end"] { right: 0 }
.mp-pop[data-side="bottom"][data-align="start"] { transform-origin: top left }
.mp-pop[data-side="bottom"][data-align="end"] { transform-origin: top right }
.mp-pop[data-side="top"][data-align="start"] { transform-origin: bottom left }
.mp-pop[data-side="top"][data-align="end"] { transform-origin: bottom right }
.mp-card { padding: 4px }

/* Header */
.mp-head {
  display: flex; align-items: center; gap: 12px; height: 28px; padding: 4px 8px 0;
  font-size: 10px; line-height: 16px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; color: var(--mp-t3);
  user-select: none;
}
.mp-head > span:first-child { flex: 1 }
.mp-cols, .mp-bars { display: grid; grid-template-columns: repeat(3, 40px); gap: 8px; flex: none }
.mp-cols span { justify-self: center; white-space: nowrap }

/* Models */
.mp-list { display: block }
.mp-option {
  display: flex; align-items: center; gap: 10px; height: 48px; padding: 6px 8px; border-radius: 6px; cursor: pointer;
  transition: background-color .09s ease-out, opacity .2s;
}
.mp-option[data-active] { background: var(--mp-hover) }
.mp-list[data-engaged] .mp-option:not([data-active]) { opacity: .55 }
.mp-text { display: flex; flex-direction: column; flex: 1; min-width: 0 }
.mp-title { display: flex; align-items: center; gap: 4px; font-weight: 500; color: var(--mp-ink) }
.mp-title-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mp-check { flex: none; width: 16px; height: 16px; color: var(--mp-accent); animation: mp-pop .32s var(--mp-ease) backwards }
.mp-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 16px; color: var(--mp-t2) }
.mp-meter { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; height: 4px }
.mp-seg {
  border-radius: 1px; background: var(--mp-seg-off);
  transition: background-color .18s, transform .26s var(--mp-ease);
}
.mp-seg[data-on] { background: var(--mp-seg-on) }
.mp-option[data-active] .mp-seg[data-on] {
  background: var(--mp-accent-soft);
  transition-delay: calc(var(--i) * 45ms);
  animation: mp-seg .36s var(--mp-ease) calc(var(--i) * 45ms) backwards;
}
.mp-varies { display: grid; place-items: center; flex: none; width: 136px; font-size: 12px; line-height: 16px; color: var(--mp-t3) }

/* Switches */
.mp-settings { margin: 4px -4px 0; padding: 4px 4px 0; border-top: .5px solid var(--mp-line) }
.mp .mp-toggle {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 32px; padding: 0 8px; border-radius: 6px;
  transition: background-color .09s ease-out;
}
.mp .mp-toggle:hover { background: var(--mp-hover) }
.mp-toggle-icon { display: grid; place-items: center; flex: none; width: 20px; height: 16px; color: var(--mp-icon); transition: color .2s }
.mp-toggle-icon svg { width: 16px; height: 16px }
.mp-toggle[aria-checked="true"] .mp-toggle-icon { color: var(--mp-accent) }
.mp-toggle-label { flex: 1; min-width: 0; color: var(--mp-t1) }
.mp-switch {
  position: relative; flex: none; width: 26px; height: 16px; border-radius: 5px; background: var(--mp-switch-off);
  transition: background-color .28s var(--mp-ease);
}
.mp-switch::after {
  content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 3.5px; background: #fff;
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .16);
  transition: transform .28s var(--mp-ease);
}
.mp-toggle[aria-checked="true"] .mp-switch { background: var(--mp-accent-soft) }
.mp-toggle[aria-checked="true"] .mp-switch::after { transform: translateX(10px) }

/* Effort unfolds under the thinking switch */
.mp-fold {
  display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden;
  transition: grid-template-rows .42s var(--mp-ease), opacity .22s, visibility 0s linear .42s;
}
.mp-fold[data-open] { grid-template-rows: 1fr; opacity: 1; visibility: visible; transition: grid-template-rows .42s var(--mp-ease), opacity .22s, visibility 0s }
.mp-fold > div { min-height: 0; overflow: hidden }
.mp-effort { display: flex; align-items: center; gap: 10px; padding: 2px 8px 6px 38px }
.mp-effort-label { flex: 1; color: var(--mp-t2) }
.mp-segmented { position: relative; display: flex; gap: 4px }
.mp-thumb {
  position: absolute; top: 0; left: 0; height: 22px; border-radius: 5px; background: var(--mp-fill); pointer-events: none;
}
.mp-thumb[data-ready] { transition: transform .22s var(--mp-ease), width .22s var(--mp-ease) }
.mp .mp-seg-btn {
  position: relative; height: 22px; padding: 0 7px; border-radius: 5px; font-size: 12px; line-height: 16px; font-weight: 500;
  color: var(--mp-t2); box-shadow: inset 0 0 0 .5px var(--mp-line); text-align: center;
  transition: color .16s, box-shadow .16s;
}
.mp .mp-seg-btn:hover { color: var(--mp-ink) }
.mp .mp-seg-btn[aria-checked="true"] { color: var(--mp-ink); box-shadow: none }
.mp .mp-seg-btn:focus-visible { outline-offset: 0 }

/* Footer */
.mp-foot {
  display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 8px 0 12px; border-top: .5px solid var(--mp-line);
}
.mp-caption { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; font-size: 12px; line-height: 16px; color: var(--mp-t3) }
.mp-caption b { font-weight: 500; color: var(--mp-ink) }
.mp-dot { color: var(--mp-t4); margin: 0 1px }
.mp-keys { display: flex; gap: 4px; flex: none }
.mp-kbd {
  display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 3px; border-radius: 5px;
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--mp-ink) 12%, transparent);
  font: inherit; font-size: 11px; line-height: 1; color: var(--mp-t3);
}
.mp-kbd svg { width: 12px; height: 12px }

/* Blur crossfade for text that changes in place */
.mp-roll { display: inline-grid; vertical-align: top }
.mp-roll > * { grid-area: 1 / 1; white-space: nowrap }
.mp-roll-in { animation: mp-roll-in .32s var(--mp-ease) backwards }
.mp-roll-out { animation: mp-roll-out .32s var(--mp-ease) forwards; pointer-events: none }

@keyframes mp-roll-in { from { opacity: 0; filter: blur(2px) } }
@keyframes mp-roll-out { to { opacity: 0; filter: blur(2px) } }
@keyframes mp-pop { from { transform: scale(.6); opacity: 0 } }
@keyframes mp-seg { 50% { transform: scaleY(1.6) } }

@media (prefers-reduced-motion: reduce) {
  .mp *, .mp *::before, .mp *::after { animation: none !important; transition: none !important }
  .mp-roll-out { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Defaults                                 */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

const BulbIcon = () => (
  <svg {...svg}>
    <path
      d="M6 11.5h4M6.5 13.5h3M8 2.25a4 4 0 0 0-2.3 7.27c.45.33.8.85.8 1.43v.55h3v-.55c0-.58.35-1.1.8-1.43A4 4 0 0 0 8 2.25Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const GlobeIcon = () => (
  <svg {...svg}>
    <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.2" />
    <path
      d="M2.5 8h11M8 2.25c1.6 1.6 2.4 3.5 2.4 5.75S9.6 12.15 8 13.75M8 2.25C6.4 3.85 5.6 5.75 5.6 8s.8 4.15 2.4 5.75"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
)

const SparkleIcon = () => (
  <svg {...svg}>
    <path d="M8 1.5c.4 3.3 1.2 4.9 3 5.5-1.8.6-2.6 2.2-3 5.5-.4-3.3-1.2-4.9-3-5.5 1.8-.6 2.6-2.2 3-5.5Z" fill="currentColor" />
  </svg>
)

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg {...svg} className={className}>
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg {...svg} className={className}>
    <path d="m4 8.4 2.6 2.6L12 5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UpDownIcon = () => (
  <svg {...svg}>
    <path
      d="M5 12.5v-9M5 3.5 3 5.5M5 3.5l2 2M11 3.5v9M11 12.5l-2-2M11 12.5l2-2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const EnterIcon = () => (
  <svg {...svg}>
    <path
      d="M12.5 3.5v4.5a1 1 0 0 1-1 1h-7M4.5 9l2.2-2.2M4.5 9l2.2 2.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/** Four invented models and a router, used when `models` is not passed. */
const DEFAULT_PICKER_MODELS: PickerModel[] = [
  { id: "nova-large", name: "Nova Large", description: "Hardest problems", icon: "L", speed: 2, quality: 5, cost: 5, latencyMs: 2400, pricePerM: 18 },
  { id: "nova", name: "Nova", description: "Everyday work", icon: "N", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 6 },
  { id: "nova-mini", name: "Nova Mini", description: "Quick and light", icon: "M", speed: 5, quality: 2, cost: 1, latencyMs: 400, pricePerM: 1 },
  { id: "auto", name: "Auto", description: "Picks per message", icon: <SparkleIcon /> },
]

const EFFORTS: { id: ModelEffort; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
]

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Controlled when `value` is defined, otherwise keeps its own state. */
function useControlled<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [inner, setInner] = React.useState(initial)
  const controlled = value !== undefined
  const current = controlled ? value : inner
  const set = React.useCallback(
    (next: T) => {
      if (!controlled) setInner(next)
      onChange?.(next)
    },
    [controlled, onChange],
  )
  return [current, set] as const
}

const formatLatency = (ms: number) => `${(ms / 1000).toFixed(1)}s`
const formatPrice = (usd: number) => `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}`
const strength = (n?: number) => (n === undefined ? undefined : Math.min(5, Math.max(0, Math.round(n))))

/** Text that changes in place: the old value blurs out while the new one blurs in. */
function Roll({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 320)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="mp-roll">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="mp-roll-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} className={leaving !== null ? "mp-roll-in" : undefined}>
        {shown}
      </span>
    </span>
  )
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <span className="mp-meter" role="img" aria-label={`${label} ${value} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className="mp-seg" data-on={i < value || undefined} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </span>
  )
}

function Glyph({ model }: { model: PickerModel }) {
  return (
    <span className="mp-glyph" aria-hidden>
      {model.icon ?? model.name.charAt(0).toUpperCase()}
    </span>
  )
}

function Switch({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="mp-toggle" onClick={() => onChange(!checked)}>
      <span className="mp-toggle-icon" aria-hidden>
        {icon}
      </span>
      <span className="mp-toggle-label">{label}</span>
      <span className="mp-switch" aria-hidden />
    </button>
  )
}

/** Segmented Low / Medium / High with a thumb that slides to the chosen level. */
function EffortControl({ effort, onChange }: { effort: ModelEffort; onChange: (next: ModelEffort) => void }) {
  const track = React.useRef<HTMLDivElement>(null)
  const thumb = React.useRef<HTMLSpanElement>(null)
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([])
  const index = EFFORTS.findIndex((e) => e.id === effort)
  const labelId = React.useId()

  // Measure the chosen button and move the thumb there (plain DOM writes, no state).
  React.useLayoutEffect(() => {
    const el = track.current
    const t = thumb.current
    if (!el || !t) return
    const place = () => {
      const b = buttons.current[index]
      if (!b) return
      t.style.width = `${b.offsetWidth}px`
      t.style.transform = `translateX(${b.offsetLeft}px)`
    }
    place()
    const raf = requestAnimationFrame(() => t.setAttribute("data-ready", ""))
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [index])

  const move = (to: number) => {
    const next = (to + EFFORTS.length) % EFFORTS.length
    onChange(EFFORTS[next].id)
    buttons.current[next]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") move(index + 1)
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(index - 1)
    else if (e.key === "Home") move(0)
    else if (e.key === "End") move(EFFORTS.length - 1)
    else return
    e.preventDefault()
  }

  return (
    <div className="mp-effort">
      <span className="mp-effort-label" id={labelId}>
        Effort
      </span>
      <div ref={track} className="mp-segmented" role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        <span ref={thumb} className="mp-thumb" aria-hidden />
        {EFFORTS.map((e, i) => (
          <button
            key={e.id}
            ref={(el) => {
              buttons.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={e.id === effort}
            tabIndex={e.id === effort ? 0 : -1}
            className="mp-seg-btn"
            onClick={() => onChange(e.id)}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 ModelPicker                                */
/* -------------------------------------------------------------------------- */

export function ModelPicker({
  models = DEFAULT_PICKER_MODELS,
  value: valueProp,
  defaultValue,
  onChange,
  thinking: thinkingProp,
  defaultThinking = false,
  onThinkingChange,
  webSearch: webSearchProp,
  defaultWebSearch = false,
  onWebSearchChange,
  effort: effortProp,
  defaultEffort = "medium",
  onEffortChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  align = "start",
  side = "bottom",
  className,
}: ModelPickerProps) {
  const uid = React.useId()
  const popId = `${uid}-pop`
  const optionId = (i: number) => `${uid}-o${i}`

  const [value, setValue] = useControlled(valueProp, defaultValue ?? models[0]?.id ?? "", onChange)
  const [thinking, setThinking] = useControlled(thinkingProp, defaultThinking, onThinkingChange)
  const [webSearch, setWebSearch] = useControlled(webSearchProp, defaultWebSearch, onWebSearchChange)
  const [effort, setEffort] = useControlled(effortProp, defaultEffort, onEffortChange)
  const [open, setOpen] = useControlled(openProp, defaultOpen, onOpenChange)

  const selectedIndex = Math.max(0, models.findIndex((m) => m.id === value))
  const selected = models[selectedIndex]

  // The row under the pointer or keyboard cursor; the footer and bars follow it.
  const [activeId, setActiveId] = React.useState(selected?.id)
  const [engaged, setEngaged] = React.useState(false)
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setActiveId(selected?.id)
      setEngaged(false)
    }
  }
  const activeIndex = Math.max(0, models.findIndex((m) => m.id === activeId))
  const active = models[activeIndex]

  const root = React.useRef<HTMLDivElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const list = React.useRef<HTMLDivElement>(null)
  const focusList = React.useRef(false)

  // Click outside closes.
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [open, setOpen])

  // Opened by the user: move focus into the list.
  React.useEffect(() => {
    if (open && focusList.current) list.current?.focus({ preventScroll: true })
    focusList.current = false
  }, [open])

  // Footer text, spoken once things settle (not while the numbers roll).
  const latency = active?.latencyMs !== undefined ? formatLatency(active.latencyMs) : undefined
  const price = active?.pricePerM !== undefined ? formatPrice(active.pricePerM) : undefined
  const varies = latency === undefined && price === undefined
  const spoken = active
    ? `${active.name}. ${varies ? "First-token time and price vary." : `${latency ? `About ${latency} to first token. ` : ""}${price ? `${price} per million tokens.` : ""}`}`
    : ""
  const [announced, setAnnounced] = React.useState("")
  React.useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => setAnnounced(spoken), 600)
    return () => window.clearTimeout(id)
  }, [open, spoken])

  if (!selected) return null

  const pick = (index: number) => {
    setValue(models[index].id)
    setOpen(false)
    trigger.current?.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (open) list.current?.focus()
      else {
        focusList.current = true
        setOpen(true)
      }
    }
  }

  const onListKeyDown = (e: React.KeyboardEvent) => {
    const go = (i: number) => {
      e.preventDefault()
      setEngaged(true)
      setActiveId(models[Math.min(models.length - 1, Math.max(0, i))].id)
    }
    if (e.key === "ArrowDown") go(activeIndex + 1)
    else if (e.key === "ArrowUp") go(activeIndex - 1)
    else if (e.key === "Home") go(0)
    else if (e.key === "End") go(models.length - 1)
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      pick(activeIndex)
    }
  }

  const onRootKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation()
      setOpen(false)
      trigger.current?.focus()
    }
  }

  // Tabbing out of the menu closes it.
  const onRootBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget
    if (open && next instanceof Node && !root.current?.contains(next)) setOpen(false)
  }

  return (
    <div
      ref={root}
      className={cn("mp", className)}
      data-open={open || undefined}
      onKeyDown={onRootKeyDown}
      onBlur={onRootBlur}
    >
      <style href="model-picker" precedence="default">
        {CSS}
      </style>

      <button
        ref={trigger}
        type="button"
        className="mp-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={`Model: ${selected.name}${thinking ? ", extended thinking on" : ""}`}
        onClick={() => {
          if (!open) focusList.current = true
          setOpen(!open)
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <Glyph model={selected} />
        <Roll text={selected.name} />
        <span className="mp-flag" data-on={thinking || undefined} aria-hidden>
          <span>
            <BulbIcon />
          </span>
        </span>
        <ChevronIcon className="mp-chevron" />
      </button>

      <div
        id={popId}
        role="dialog"
        aria-label="Model settings"
        className="mp-pop"
        data-open={open || undefined}
        data-side={side}
        data-align={align}
        inert={!open}
      >
        <div className="mp-card">
          <div className="mp-head" aria-hidden>
            <span>Model</span>
            <span className="mp-cols">
              <span>Speed</span>
              <span>Quality</span>
              <span>Cost</span>
            </span>
          </div>

          <div
            ref={list}
            className="mp-list"
            role="listbox"
            aria-label="Model"
            tabIndex={0}
            aria-activedescendant={open ? optionId(activeIndex) : undefined}
            data-engaged={engaged || undefined}
            onKeyDown={onListKeyDown}
          >
            {models.map((m, i) => {
              const speed = strength(m.speed)
              const quality = strength(m.quality)
              const cost = strength(m.cost)
              const hasBars = speed !== undefined || quality !== undefined || cost !== undefined
              return (
                <div
                  key={m.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === selectedIndex}
                  className="mp-option"
                  data-active={i === activeIndex || undefined}
                  onPointerMove={() => {
                    if (activeId !== m.id) setActiveId(m.id)
                    if (!engaged) setEngaged(true)
                  }}
                  onClick={() => pick(i)}
                >
                  <Glyph model={m} />
                  <span className="mp-text">
                    <span className="mp-title">
                      <span className="mp-title-name">{m.name}</span>
                      {i === selectedIndex && <CheckIcon className="mp-check" />}
                    </span>
                    {m.description && <span className="mp-desc">{m.description}</span>}
                  </span>
                  {hasBars ? (
                    <span className="mp-bars">
                      <Meter label="Speed" value={speed ?? 0} />
                      <Meter label="Quality" value={quality ?? 0} />
                      <Meter label="Cost" value={cost ?? 0} />
                    </span>
                  ) : (
                    <span className="mp-varies">Varies</span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mp-settings">
            <Switch icon={<BulbIcon />} label="Extended thinking" checked={thinking} onChange={setThinking} />
            <div className="mp-fold" data-open={thinking || undefined} inert={!thinking}>
              <div>
                <EffortControl effort={effort} onChange={setEffort} />
              </div>
            </div>
            <Switch icon={<GlobeIcon />} label="Web search" checked={webSearch} onChange={setWebSearch} />
          </div>
        </div>

        <div className="mp-foot">
          <span className="mp-caption" aria-hidden>
            {varies ? (
              <Roll text="First-token time and price vary" />
            ) : (
              <>
                ~<b><Roll text={latency ?? "–"} /></b> first token <span className="mp-dot">·</span>{" "}
                <b><Roll text={price ?? "–"} /></b> / M tokens
              </>
            )}
          </span>
          <span className="mp-keys" aria-hidden>
            <kbd className="mp-kbd">
              <UpDownIcon />
            </kbd>
            <kbd className="mp-kbd">
              <EnterIcon />
            </kbd>
          </span>
          <span className="mp-sr" aria-live="polite">
            {open ? announced : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

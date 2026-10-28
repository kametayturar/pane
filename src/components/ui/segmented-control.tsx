"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SegmentOption = {
  value: string
  /** Visible text. Leave it out for an icon-only option (and give it an `ariaLabel`). */
  label?: React.ReactNode
  /** 14px icon shown before the label. */
  icon?: React.ReactNode
  /** A small number chip after the label, e.g. unread items. Changing it blurs the new number in. */
  count?: number
  /** A short highlighted tag after the label, e.g. "Save 20%". */
  badge?: React.ReactNode
  disabled?: boolean
  /** Accessible name for icon-only options. */
  ariaLabel?: string
  /** `kind="tabs"`: the id of the panel this option controls (aria-controls). */
  controls?: string
}

export type SegmentedControlProps = {
  /** Two to six options work best. */
  options: SegmentOption[]
  /** Controlled value. */
  value?: string
  /** Starting value when uncontrolled. Defaults to the first enabled option. */
  defaultValue?: string
  /** Called with the new value: on click, while dragging the indicator and on arrow keys. */
  onChange?: (value: string) => void
  /** 24, 28 or 32px tall (40px+ on touch screens). */
  size?: "sm" | "md" | "lg"
  /**
   * `buttons`: separate chips with a hairline and a light fill that slides to the active one.
   * `tray`: a light track with a white raised pill. `underline`: text tabs on a hairline with a sliding line.
   */
  variant?: "buttons" | "tray" | "underline"
  /** Fill the container with equal-width segments. */
  fullWidth?: boolean
  /** `radio` is a radiogroup; `tabs` is a tablist (pair it with `controls` on each option). */
  kind?: "radio" | "tabs"
  /** Disable the whole control. */
  disabled?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.sc {
  --sc-ink: #000;
  --sc-surface: #fff;
  --sc-accent: #0060e2;
  --sc-t1: color-mix(in oklab, var(--sc-ink) 88%, transparent);
  --sc-t2: color-mix(in oklab, var(--sc-ink) 61%, transparent);
  --sc-t3: color-mix(in oklab, var(--sc-ink) 45%, transparent);
  --sc-fill: color-mix(in oklab, var(--sc-ink) 6%, transparent);
  --sc-wash: color-mix(in oklab, var(--sc-ink) 4%, transparent);
  --sc-line: color-mix(in oklab, var(--sc-ink) 6%, transparent);
  --sc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --sc-ease: cubic-bezier(.25, .9, .3, 1);
  --sc-h: 28px; --sc-fs: 13px; --sc-px: 10px; --sc-pad: 3px;
  position: relative;
  display: inline-block;
  max-width: 100%;
  vertical-align: top;
  color: var(--sc-t2);
  font-family: var(--sc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--sc-fs);
  font-weight: 500;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .sc {
  --sc-ink: #fff;
  --sc-surface: #1c1c1e;
  --sc-accent: #4d8dff;
  --sc-t1: color-mix(in oklab, var(--sc-ink) 90%, transparent);
  --sc-t2: color-mix(in oklab, var(--sc-ink) 62%, transparent);
  --sc-t3: color-mix(in oklab, var(--sc-ink) 46%, transparent);
  --sc-fill: color-mix(in oklab, var(--sc-ink) 9%, transparent);
  --sc-wash: color-mix(in oklab, var(--sc-ink) 5%, transparent);
  --sc-line: color-mix(in oklab, var(--sc-ink) 8%, transparent);
  --sc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.sc *, .sc *::before, .sc *::after { box-sizing: border-box }
:where(.sc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.sc :focus-visible { outline: 2px solid color-mix(in oklab, var(--sc-accent) 60%, transparent); outline-offset: -2px }

.sc[data-size="sm"] { --sc-h: 24px; --sc-fs: 12px; --sc-px: 8px }
.sc[data-size="lg"] { --sc-h: 32px; --sc-fs: 14px; --sc-px: 12px }
.sc[data-variant="tray"] { --sc-pad: 2px }
.sc[data-variant="underline"] { --sc-pad: 0px; display: block }
.sc[data-full] { display: block; width: 100% }

/* Scroller: if the options don't fit it scrolls sideways, with soft edges on the sides that hide options */
.sc-scroller { overflow-x: auto; overflow-y: hidden; scrollbar-width: none; border-radius: 8px }
.sc-scroller::-webkit-scrollbar { display: none }
.sc-scroller[data-l], .sc-scroller[data-r] {
  --fl: 0px; --fr: 0px;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 var(--fl), #000 calc(100% - var(--fr)), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, #000 var(--fl), #000 calc(100% - var(--fr)), transparent 100%);
}
.sc-scroller[data-l] { --fl: 18px }
.sc-scroller[data-r] { --fr: 18px }
.sc[data-variant="tray"] .sc-scroller { background: var(--sc-wash); border-radius: 8px }
.sc[data-variant="underline"] .sc-scroller { border-radius: 0; box-shadow: inset 0 -.5px 0 var(--sc-line) }

.sc-track { position: relative; display: inline-flex; padding: var(--sc-pad); gap: 8px; min-width: 100%; touch-action: pan-x }
.sc[data-variant="tray"] .sc-track { gap: 0; min-width: 0 }
.sc[data-variant="underline"] .sc-track { gap: 20px; min-width: 0 }
.sc[data-full] .sc-track { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; width: 100% }
.sc[data-full][data-variant="tray"] .sc-track { gap: 0 }
.sc:not([data-full]) .sc-track { min-width: 0 }

/* The sliding indicator: left and right move on different clocks so the edge facing the target leads */
.sc-pill {
  position: absolute; top: var(--sc-pad); bottom: var(--sc-pad); left: 0; right: 0; border-radius: 6px; pointer-events: none;
  background: var(--sc-fill); opacity: 0;
  transition: left .22s var(--sc-ease), right .16s var(--sc-ease), scale .12s var(--sc-ease), opacity .12s;
}
.sc-pill[data-dir="right"] { transition: left .16s var(--sc-ease), right .22s var(--sc-ease), scale .12s var(--sc-ease), opacity .12s }
.sc-pill[data-ready] { opacity: 1 }
.sc[data-variant="tray"] .sc-pill { background: var(--sc-surface); box-shadow: var(--sc-shadow) }
:is(.dark, [data-theme="dark"]) .sc[data-variant="tray"] .sc-pill { background: color-mix(in oklab, var(--sc-surface), #fff 12%) }
.sc[data-variant="underline"] .sc-pill { top: auto; height: 2px; border-radius: 1.5px 1.5px 0 0; background: var(--sc-t1) }
.sc[data-pressed] .sc-pill { scale: .97 }

.sc-opt {
  position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center;
  height: calc(var(--sc-h) - var(--sc-pad) * 2); min-width: 0; padding: 0 var(--sc-px); border-radius: 6px;
  color: var(--sc-t2); font-size: var(--sc-fs); font-weight: 500; line-height: 20px; white-space: nowrap; user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: color .09s, background-color .09s;
}
.sc[data-variant="buttons"] .sc-opt { height: var(--sc-h); box-shadow: inset 0 0 0 .5px var(--sc-line) }
.sc[data-variant="underline"] .sc-opt { height: calc(var(--sc-h) + 6px); padding: 0 2px; border-radius: 6px }
.sc-opt[data-active] { color: var(--sc-t1) }
.sc-opt:not([data-active]):not(:disabled):hover { color: var(--sc-t1) }
.sc[data-variant="buttons"] .sc-opt:not([data-active]):not(:disabled):hover { background: var(--sc-wash) }
.sc[data-variant="tray"] .sc-opt:not([data-active]):not(:disabled):hover { background: var(--sc-wash) }
.sc-opt:disabled, .sc[data-disabled] .sc-opt { opacity: .4; cursor: not-allowed }
.sc-content { display: inline-flex; align-items: center; gap: 6px; min-width: 0 }
.sc-label { overflow: hidden; text-overflow: ellipsis }
.sc-icon { display: inline-grid; place-items: center; flex: none; width: 14px; height: 14px; color: var(--sc-t3); transition: color .09s }
.sc-icon svg { width: 14px; height: 14px }
.sc-opt[data-active] .sc-icon, .sc-opt:hover .sc-icon { color: var(--sc-t1) }
.sc-count {
  display: inline-grid; place-items: center; flex: none; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 5px;
  background: var(--sc-fill); color: var(--sc-t2); font-size: 11px; font-weight: 500; line-height: 16px; font-variant-numeric: tabular-nums;
}
.sc-count > span { animation: sc-blur .3s var(--sc-ease) backwards }
.sc-badge {
  flex: none; height: 16px; padding: 0 5px; border-radius: 5px; font-size: 11px; font-weight: 500; line-height: 16px;
  background: color-mix(in oklab, var(--sc-accent) 12%, transparent); color: var(--sc-accent);
}
.sc[data-size="sm"] .sc-opt[data-icon-only] { padding: 0 6px }

@keyframes sc-blur { from { opacity: 0; filter: blur(3px); transform: translateY(3px) } }

/* Touch screens: bigger targets; a tap picks on lift */
@media (pointer: coarse) {
  .sc-opt { min-height: 40px }
  .sc[data-variant="buttons"] .sc-opt { height: auto }
}

@media (prefers-reduced-motion: reduce) {
  .sc *, .sc *::before, .sc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                              SegmentedControl                              */
/* -------------------------------------------------------------------------- */

export function SegmentedControl({
  options,
  value,
  defaultValue,
  onChange,
  size = "md",
  variant = "buttons",
  fullWidth = false,
  kind = "radio",
  disabled = false,
  className,
  ...aria
}: SegmentedControlProps) {
  const controlled = value !== undefined
  const firstEnabled = options.find((o) => !o.disabled)?.value
  const [inner, setInner] = React.useState(defaultValue ?? firstEnabled)
  const current = controlled ? value : inner
  const activeIndex = options.findIndex((o) => o.value === current)
  // The one tab stop: the active option, or the first enabled one when nothing valid is selected.
  const stopIndex = activeIndex >= 0 && !options[activeIndex].disabled ? activeIndex : options.findIndex((o) => !o.disabled)

  const scroller = React.useRef<HTMLDivElement>(null)
  const track = React.useRef<HTMLDivElement>(null)
  const pill = React.useRef<HTMLSpanElement>(null)
  const root = React.useRef<HTMLDivElement>(null)
  const buttons = React.useRef<(HTMLButtonElement | null)[]>([])
  const drag = React.useRef(false)
  const placed = React.useRef({ ready: false, left: 0 })

  const select = (v: string) => {
    if (v === current) return
    if (!controlled) setInner(v)
    onChange?.(v)
  }

  // Place the indicator under the active option by writing straight to the DOM (no state, no re-render).
  const place = React.useCallback(() => {
    const t = track.current
    const p = pill.current
    const btn = buttons.current[stopIndex]
    if (!t || !p || !btn || activeIndex < 0) return
    const left = btn.offsetLeft
    const right = t.clientWidth - (left + btn.offsetWidth)
    const first = !placed.current.ready
    if (first) p.style.transition = "none"
    p.dataset.dir = left > placed.current.left ? "right" : "left"
    p.style.left = `${left}px`
    p.style.right = `${right}px`
    if (first) {
      p.getBoundingClientRect()
      p.style.transition = ""
      p.dataset.ready = "1"
      placed.current.ready = true
    }
    placed.current.left = left
  }, [stopIndex, activeIndex])

  const edges = React.useCallback(() => {
    const s = scroller.current
    if (!s) return
    const l = s.scrollLeft > 1
    const r = s.scrollLeft + s.clientWidth < s.scrollWidth - 1
    s.toggleAttribute("data-l", l)
    s.toggleAttribute("data-r", r)
  }, [])

  React.useLayoutEffect(() => {
    place()
    edges()
    // Keep the active option in view when the control scrolls.
    const s = scroller.current
    const btn = buttons.current[stopIndex]
    if (s && btn && s.scrollWidth > s.clientWidth + 1) {
      const left = btn.offsetLeft
      const right = left + btn.offsetWidth
      if (left < s.scrollLeft) s.scrollTo({ left: Math.max(0, left - 20), behavior: "smooth" })
      else if (right > s.scrollLeft + s.clientWidth) s.scrollTo({ left: right - s.clientWidth + 20, behavior: "smooth" })
    }
  }, [place, edges, stopIndex])

  // Follow size changes: content morphing (labels, counts) or a resized container.
  React.useEffect(() => {
    const t = track.current
    if (!t) return
    const ro = new ResizeObserver(() => {
      place()
      edges()
    })
    ro.observe(t)
    buttons.current.forEach((b) => b && ro.observe(b))
    return () => ro.disconnect()
  }, [place, edges, options.length])

  const move = (from: number, dir: 1 | -1 | "first" | "last") => {
    const n = options.length
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
    if (!enabled.length) return
    let next: number
    if (dir === "first") next = enabled[0]
    else if (dir === "last") next = enabled[enabled.length - 1]
    else {
      next = from
      for (let k = 0; k < n; k++) {
        next = (next + dir + n) % n
        if (!options[next].disabled) break
      }
    }
    buttons.current[next]?.focus()
    select(options[next].value)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    const from = stopIndex
    const horizontal = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    const vertical = kind === "radio" ? (e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0) : 0
    const step = horizontal || vertical
    if (step) move(from, step as 1 | -1)
    else if (e.key === "Home") move(from, "first")
    else if (e.key === "End") move(from, "last")
    else return
    e.preventDefault()
  }

  // Dragging the indicator across the options selects as you go (mouse and pen; touch picks on lift).
  const optionAt = (x: number) => {
    let hit = -1
    let best = Infinity
    buttons.current.forEach((b, i) => {
      if (!b || options[i].disabled) return
      const r = b.getBoundingClientRect()
      const d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
      if (d < best) {
        best = d
        hit = i
      }
    })
    return hit
  }
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === "touch" || e.button !== 0) return
    const i = optionAt(e.clientX)
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-sc-opt]")
    if (!btn || i < 0) return
    drag.current = true
    root.current?.setAttribute("data-pressed", "")
    track.current?.setPointerCapture(e.pointerId)
    select(options[i].value)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const i = optionAt(e.clientX)
    if (i >= 0) select(options[i].value)
  }
  const endDrag = () => {
    drag.current = false
    root.current?.removeAttribute("data-pressed")
  }

  const tabs = kind === "tabs"

  return (
    <div
      ref={root}
      className={cn("sc", className)}
      data-size={size}
      data-variant={variant}
      data-full={fullWidth || undefined}
      data-disabled={disabled || undefined}
    >
      <style href="segmented-control" precedence="default">
        {CSS}
      </style>
      <div ref={scroller} className="sc-scroller" onScroll={edges}>
        <div
          ref={track}
          className="sc-track"
          role={tabs ? "tablist" : "radiogroup"}
          aria-label={aria["aria-label"]}
          aria-labelledby={aria["aria-labelledby"]}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span ref={pill} className="sc-pill" aria-hidden />
          {options.map((o, i) => {
            const active = i === activeIndex
            return (
              <button
                key={o.value}
                ref={(el) => {
                  buttons.current[i] = el
                }}
                type="button"
                role={tabs ? "tab" : "radio"}
                {...(tabs ? { "aria-selected": active } : { "aria-checked": active })}
                aria-controls={tabs ? o.controls : undefined}
                aria-label={o.ariaLabel}
                tabIndex={i === stopIndex ? 0 : -1}
                disabled={disabled || o.disabled}
                className="sc-opt"
                data-sc-opt=""
                data-active={active || undefined}
                data-icon-only={o.label === undefined || undefined}
                onClick={() => select(o.value)}
              >
                <span className="sc-content">
                  {o.icon && (
                    <span className="sc-icon" aria-hidden>
                      {o.icon}
                    </span>
                  )}
                  {o.label !== undefined && <span className="sc-label">{o.label}</span>}
                  {o.count !== undefined && (
                    <span className="sc-count">
                      <span key={o.count}>{o.count}</span>
                    </span>
                  )}
                  {o.badge && <span className="sc-badge">{o.badge}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

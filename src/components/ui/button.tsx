"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive"
export type ButtonSize = "sm" | "md" | "lg"

export type ButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  /** A dark chip, white with a hairline shadow, text only, or a light red fill for deleting. */
  variant?: ButtonVariant
  /** 24, 28 or 32px high. */
  size?: ButtonSize
  /** Swaps the left icon for a spinner, shimmers the label, sets aria-busy and ignores clicks. */
  loading?: boolean
  /** Icon before the label. Without children the button becomes square (give it an aria-label). */
  icon?: React.ReactNode
  /** Icon after the label. */
  iconRight?: React.ReactNode
  children?: React.ReactNode
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.btn {
  --btn-ink: #000;
  --btn-surface: #fff;
  --btn-accent: #0060e2;
  --btn-danger: #e5484d;
  --btn-t1: color-mix(in oklab, var(--btn-ink) 88%, transparent);
  --btn-t2: color-mix(in oklab, var(--btn-ink) 61%, transparent);
  --btn-fill: color-mix(in oklab, var(--btn-ink) 6%, transparent);
  --btn-primary-bg: color-mix(in oklab, var(--btn-ink) 88%, transparent);
  --btn-primary-bg-hover: color-mix(in oklab, var(--btn-ink) 80%, transparent);
  --btn-primary-fg: #fcfcfc;
  --btn-secondary-bg: var(--btn-surface);
  --btn-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --btn-shadow-hover: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .12), 0 1px 3px 0 rgb(0 0 0 / .07);
  --btn-glint: rgb(255 255 255 / .82);
  --btn-ease: cubic-bezier(.22, 1, .36, 1);
  --btn-swap-ease: cubic-bezier(.25, 1, .5, 1);
  font-family: var(--btn-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .btn {
  --btn-ink: #fff;
  --btn-surface: #1c1c1e;
  --btn-accent: #4d8dff;
  --btn-danger: #ff6369;
  --btn-t1: color-mix(in oklab, var(--btn-ink) 90%, transparent);
  --btn-t2: color-mix(in oklab, var(--btn-ink) 62%, transparent);
  --btn-fill: color-mix(in oklab, var(--btn-ink) 8%, transparent);
  --btn-primary-bg: color-mix(in oklab, var(--btn-ink) 90%, transparent);
  --btn-primary-bg-hover: color-mix(in oklab, var(--btn-ink) 80%, transparent);
  --btn-primary-fg: #111;
  --btn-secondary-bg: color-mix(in oklab, var(--btn-surface), var(--btn-ink) 8%);
  --btn-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --btn-shadow-hover: 0 0 0 .5px rgb(255 255 255 / .18), 0 1px 3px 0 rgb(0 0 0 / .5);
  --btn-glint: rgb(255 255 255 / .9);
}
.btn, .btn *, .btn *::before, .btn *::after { box-sizing: border-box }
.btn {
  position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
  height: 28px; margin: 0; padding: 0; border: 0; border-radius: 6px; background: none;
  font-size: 13px; font-weight: 500; line-height: 20px; white-space: nowrap; text-decoration: none;
  color: var(--btn-t1); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
  transition: background-color .14s, color .14s, box-shadow .14s, transform .16s var(--btn-ease), opacity .14s;
}
.btn:focus-visible { outline: 2px solid color-mix(in oklab, var(--btn-accent) 60%, transparent); outline-offset: 1px }
.btn[data-ready] { transition: background-color .14s, color .14s, box-shadow .14s, transform .16s var(--btn-ease), opacity .14s, width .3s var(--btn-ease) }
.btn:active:not(:disabled):not([aria-busy="true"]) { transform: scale(.97) }
.btn:disabled { opacity: .4; cursor: default }
.btn[aria-busy="true"] { cursor: default }

/* The inner row is what we measure: the button's width glides to follow it */
.btn-in { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 100%; padding: 0 10px; min-width: 0 }

/* Sizes */
.btn[data-size="sm"] { height: 24px; font-size: 12px; line-height: 16px }
.btn[data-size="sm"] .btn-in { gap: 4px; padding: 0 8px }
.btn[data-size="lg"] { height: 32px }
.btn[data-size="lg"] .btn-in { padding: 0 12px }
.btn[data-icon-left] .btn-in { padding-left: 8px }
.btn[data-icon-right] .btn-in { padding-right: 8px }
.btn[data-size="sm"][data-icon-left] .btn-in { padding-left: 6px }
.btn[data-size="sm"][data-icon-right] .btn-in { padding-right: 6px }
.btn[data-size="lg"][data-icon-left] .btn-in { padding-left: 10px }
.btn[data-size="lg"][data-icon-right] .btn-in { padding-right: 10px }
.btn[data-icon-only] { width: 28px }
.btn[data-icon-only][data-size="sm"] { width: 24px }
.btn[data-icon-only][data-size="lg"] { width: 32px }
.btn[data-icon-only] .btn-in { width: 100%; padding: 0 }

/* Variants */
.btn[data-variant="primary"] { background: var(--btn-primary-bg); color: var(--btn-primary-fg) }
.btn[data-variant="primary"]:hover:not(:disabled) { background: var(--btn-primary-bg-hover) }
.btn[data-variant="secondary"] { background: var(--btn-secondary-bg); color: var(--btn-ink); box-shadow: var(--btn-shadow) }
.btn[data-variant="secondary"]:hover:not(:disabled) { box-shadow: var(--btn-shadow-hover) }
.btn[data-variant="ghost"] { color: var(--btn-t2) }
.btn[data-variant="ghost"]:hover:not(:disabled) { background: var(--btn-fill); color: var(--btn-t1) }
.btn[data-variant="destructive"] { background: color-mix(in oklab, var(--btn-danger) 8%, transparent); color: var(--btn-danger) }
.btn[data-variant="destructive"]:hover:not(:disabled) { background: color-mix(in oklab, var(--btn-danger) 13%, transparent) }

/* Icon slot */
.btn-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px }
.btn[data-size="sm"] .btn-icon { width: 14px; height: 14px }
.btn-icon > svg { display: block; width: 100%; height: 100%; overflow: visible }
.btn-icon-swap { animation: btn-icon-in .52s var(--btn-swap-ease) backwards }
.btn-spinner { animation: btn-spin .9s linear infinite }

/* Label: swaps with a soft blur and shimmers while loading */
.btn-label { position: relative; display: block; white-space: nowrap }
.btn-label-swap { animation: btn-label-in .48s var(--btn-swap-ease) backwards }
.btn[data-loading] .btn-label { color: color-mix(in oklab, currentColor 55%, transparent) }
.btn[data-loading] .btn-label::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--btn-glint) 50%, transparent 62%) 0 0 / 300% 100%;
  -webkit-background-clip: text; background-clip: text;
  animation: btn-sweep 1.04s linear infinite;
}

@keyframes btn-label-in { from { opacity: 0; filter: blur(3px); transform: translateY(25%) } }
@keyframes btn-icon-in { from { opacity: 0; filter: blur(2px); transform: scale(.7) } }
@keyframes btn-spin { to { transform: rotate(360deg) } }
@keyframes btn-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }

@media (prefers-reduced-motion: reduce) {
  .btn, .btn *, .btn *::before, .btn *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

function Spinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" opacity=".2" />
      <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
    </svg>
  )
}

/** True once `key` has changed at least once, so the very first render never animates. */
function useSwapped(key: string) {
  const [prev, setPrev] = React.useState(key)
  const [swapped, setSwapped] = React.useState(false)
  if (key !== prev) {
    setPrev(key)
    setSwapped(true)
  }
  return swapped
}

/* -------------------------------------------------------------------------- */
/*                                   Button                                   */
/* -------------------------------------------------------------------------- */

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  children,
  className,
  style,
  onClick,
  type = "button",
  ref,
  ...rest
}: ButtonProps) {
  const innerRef = React.useRef<HTMLSpanElement>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const [ready, setReady] = React.useState(false)

  const hasLabel = children !== undefined && children !== null && children !== false && children !== ""
  const iconOnly = !hasLabel && (icon !== undefined || iconRight !== undefined || loading)
  const text = typeof children === "string" || typeof children === "number" ? String(children) : undefined

  // The button's width follows its content, so a label or icon change glides instead of jumping.
  React.useEffect(() => {
    const el = innerRef.current
    if (!el || iconOnly) return
    let frame = 0
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].borderBoxSize?.[0]
      setWidth(box ? box.inlineSize : el.offsetWidth)
      if (!frame) frame = requestAnimationFrame(() => setReady(true))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [iconOnly])

  const iconKey = loading ? "spin" : "icon"
  const labelKey = text ?? "node"
  const iconSwapped = useSwapped(iconKey)
  const labelSwapped = useSwapped(labelKey)

  const leftIcon = loading ? <Spinner /> : icon
  const hasLeft = leftIcon !== undefined && leftIcon !== null && leftIcon !== false

  return (
    <button
      ref={ref}
      type={type}
      className={cn("btn", className)}
      data-variant={variant}
      data-size={size}
      data-icon-left={(hasLeft && hasLabel) || undefined}
      data-icon-right={(iconRight !== undefined && hasLabel) || undefined}
      data-icon-only={iconOnly || undefined}
      data-loading={loading || undefined}
      data-ready={ready || undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      style={!iconOnly && width !== null ? { width, ...style } : style}
      onClick={(e) => {
        if (loading) {
          e.preventDefault()
          return
        }
        onClick?.(e)
      }}
      {...rest}
    >
      <style href="button" precedence="default">
        {CSS}
      </style>
      <span className="btn-in" ref={innerRef}>
        {hasLeft && (
          <span key={iconKey} className={cn("btn-icon", iconSwapped && "btn-icon-swap")} aria-hidden>
            {leftIcon}
          </span>
        )}
        {hasLabel && (
          <span key={labelKey} className={cn("btn-label", labelSwapped && "btn-label-swap")} data-text={text}>
            {children}
          </span>
        )}
        {iconRight !== undefined && iconRight !== null && iconRight !== false && (
          <span className="btn-icon" aria-hidden>
            {iconRight}
          </span>
        )}
      </span>
    </button>
  )
}

/* Small icons you can pass to `icon` / `iconRight` */
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const

export const PlusIcon = () => (
  <svg {...base}>
    <path d="M12 4v16M20 12H4" />
  </svg>
)
export const ArrowRightIcon = () => (
  <svg {...base}>
    <path d="M18.5 12H5M13 18l6-6-6-6" />
  </svg>
)
export const ArrowUpIcon = () => (
  <svg {...base}>
    <path d="M12 19.5V5M6 11l6-6 6 6" />
  </svg>
)
export const TrashIcon = () => (
  <svg {...base}>
    <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5l.7 11.2a2 2 0 0 0 2 1.8h5.6a2 2 0 0 0 2-1.8l.7-11.2M10 10.5v5M14 10.5v5" />
  </svg>
)
export const CopyIcon = () => (
  <svg {...base}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </svg>
)
export const CheckIcon = () => (
  <svg {...base}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)
export const UploadIcon = () => (
  <svg {...base}>
    <path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M4 15.5v1.5a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-1.5" />
  </svg>
)
export const MoreIcon = () => (
  <svg {...base} strokeWidth={2.5}>
    <path d="M6 12h.01M12 12h.01M18 12h.01" />
  </svg>
)

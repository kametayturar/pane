"use client"

import * as React from "react"

/**
 * ShimmerLoader – skeleton blocks that share ONE soft light sweep, crossfading into the real content when loaded.
 *
 *   <ShimmerLoader loading={isLoading}>
 *     <Summary />
 *   </ShimmerLoader>
 *
 *   <ShimmerLoader loading skeleton={<><ShimmerLoader.Circle size={36} /><ShimmerLoader.Line width={120} /></>} />
 *   <ShimmerLoader.Text>Generating summary…</ShimmerLoader.Text>
 */

type Size = number | string

export type ShimmerLoaderProps = {
  /** Show the skeleton while true; crossfade into `children` when it turns false. Default true. */
  loading?: boolean
  /** The placeholder. Build it from ShimmerLoader.Line / .Circle / .Block. Defaults to a generic card skeleton. */
  skeleton?: React.ReactNode
  /** The real content, shown once `loading` is false. */
  children?: React.ReactNode
  /** Motion speed multiplier – 1 is one sweep every 2.2 s. */
  speed?: number
  /** Freeze the sweep on the current frame. */
  paused?: boolean
  /** Tint the light sweep with this colour. Any CSS colour. */
  accent?: string
  className?: string
  style?: React.CSSProperties
}

type SkeletonProps = {
  /** Number = px, string = any CSS length. Default "100%". */
  width?: Size
  /** Number = px. Default 12. */
  height?: Size
  /** Corner radius. Number = px. Default 6. */
  radius?: Size
  /** Round shape that uses `width` for both sides, e.g. an avatar. */
  circle?: boolean
  className?: string
  style?: React.CSSProperties
}

const px = (v: Size) => (typeof v === "number" ? `${v}px` : v)

/** How long the crossfade takes, in ms at speed 1. */
const FADE_MS = 420

const CSS = `
.sl, .sl-skel, .sl-text {
  --sl-base: #ececec; --sl-glow: rgb(255 255 255 / .9); --sl-text: #a3a3a3; --sl-text-glow: #fff;
  --sl-dur: 2.2s; --sl-ease: cubic-bezier(.22, 1, .36, 1);
}
:is(.dark, [data-theme="dark"]) :is(.sl, .sl-skel, .sl-text) {
  --sl-base: #2f2f33; --sl-glow: rgb(255 255 255 / .08); --sl-text: #6e6e73; --sl-text-glow: #f5f5f5;
}
.sl[data-tint] { --sl-glow: color-mix(in oklab, var(--sl-accent) 24%, rgb(255 255 255 / .9)); --sl-text-glow: color-mix(in oklab, var(--sl-accent) 30%, #fff) }
:is(.dark, [data-theme="dark"]) .sl[data-tint] { --sl-glow: color-mix(in oklab, var(--sl-accent) 26%, rgb(255 255 255 / .08)) }
.sl { position: relative; display: block; width: 100%; font-family: var(--sl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); -webkit-font-smoothing: antialiased }
.sl *, .sl *::before, .sl *::after { box-sizing: border-box }
.sl :focus-visible { outline: 2px solid color-mix(in oklab, var(--sl-accent, #0060e2) 60%, transparent); outline-offset: 1px }

/* Both layers share one grid cell, so the box is as big as the larger of the two and nothing jumps. */
.sl-stack { display: grid }
.sl-stack > * { grid-area: 1 / 1; min-width: 0 }
.sl-skeleton { display: block; opacity: 1; filter: none; transition: opacity calc(${FADE_MS}ms / var(--sl-speed, 1)) var(--sl-ease), filter calc(${FADE_MS}ms / var(--sl-speed, 1)) var(--sl-ease) }
.sl-content { opacity: 1; transform: none; filter: none; transition: opacity calc(${FADE_MS}ms / var(--sl-speed, 1)) var(--sl-ease) calc(80ms / var(--sl-speed, 1)), transform calc(${FADE_MS}ms / var(--sl-speed, 1)) var(--sl-ease) calc(80ms / var(--sl-speed, 1)), filter calc(${FADE_MS}ms / var(--sl-speed, 1)) var(--sl-ease) calc(80ms / var(--sl-speed, 1)) }
.sl[data-loading] .sl-skeleton { transition: none }
.sl:not([data-loading]) .sl-skeleton { opacity: 0; filter: blur(3px); pointer-events: none }
.sl[data-loading] .sl-content { opacity: 0; transform: translateY(4px); filter: blur(3px); pointer-events: none; transition: none }

/* One sweep for every block: the gradient is pinned to the viewport (background-attachment: fixed), so each
   block just shows the slice of the same moving band that happens to lie under it. */
.sl-skel {
  display: block; flex: 0 0 auto; width: 100%; height: 12px; max-width: 100%; border-radius: 6px;
  background-color: var(--sl-base);
  background-image: linear-gradient(100deg, transparent 0%, transparent 30%, var(--sl-glow) 50%, transparent 70%, transparent 100%);
  background-size: 150vw 100%; background-repeat: repeat-x; background-attachment: fixed;
  animation: sl-sweep calc(var(--sl-dur) / var(--sl-speed, 1)) linear infinite;
}
@keyframes sl-sweep { from { background-position: -50vw 0 } to { background-position: 100vw 0 } }

/* Shimmering status text: the highlight runs through the glyphs. */
.sl-text {
  display: inline-block; color: var(--sl-text);
  background-image: linear-gradient(90deg, var(--sl-text) 0%, var(--sl-text) 40%, var(--sl-text-glow) 50%, var(--sl-text) 60%, var(--sl-text) 100%);
  background-size: 300% 100%; background-position: 100% 0; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: sl-text calc(var(--sl-text-dur, 2s) / var(--sl-speed, 1)) linear infinite;
}
@keyframes sl-text { from { background-position: 100% 0 } to { background-position: 0 0 } }

.sl[data-paused] .sl-skel, .sl-text[data-paused], .sl[data-paused] .sl-text { animation-play-state: paused }
@media (prefers-reduced-motion: reduce) {
  .sl-skel { animation: none; background-image: none }
  .sl-text { animation: none; background-image: none; -webkit-text-fill-color: currentColor; color: var(--sl-text) }
  .sl-skeleton, .sl-content { transition: none !important; filter: none !important; transform: none !important }
}
`

function Styles() {
  return (
    <style href="pane-shimmer-loader" precedence="default">
      {CSS}
    </style>
  )
}

/** A skeleton block. Every block on the page shares the same light sweep. */
export function Skeleton({ width = "100%", height = 12, radius = 6, circle, className, style }: SkeletonProps) {
  const w = px(width)
  const css: React.CSSProperties = circle
    ? { width: w, height: w, borderRadius: "50%", ...style }
    : { width: w, height: px(height), borderRadius: px(radius), ...style }
  return (
    <>
      <Styles />
      <span className={className ? `sl-skel ${className}` : "sl-skel"} style={css} aria-hidden />
    </>
  )
}

/** A text line placeholder (height 10, radius 5 by default). */
export function SkeletonLine({ height = 10, radius = 5, ...rest }: SkeletonProps) {
  return <Skeleton height={height} radius={radius} {...rest} />
}

/** A round placeholder for avatars. `size` sets both sides. */
export function SkeletonCircle({ size = 36, ...rest }: Omit<SkeletonProps, "circle" | "width" | "height"> & { size?: Size }) {
  return <Skeleton circle width={size} {...rest} />
}

/** A rectangular placeholder for images, buttons and chips (radius 10 by default). */
export function SkeletonBlock({ height = 56, radius = 10, ...rest }: SkeletonProps) {
  return <Skeleton height={height} radius={radius} {...rest} />
}

export type ShimmerTextProps = {
  children?: React.ReactNode
  /** Seconds for one pass of the highlight at speed 1. Default 2. */
  duration?: number
  /** Motion speed multiplier. Default 1. */
  speed?: number
  /** Freeze the highlight. */
  paused?: boolean
  className?: string
  style?: React.CSSProperties
}

/** A status label ("Generating summary…") with a highlight running through the letters. It stays real text. */
export function ShimmerText({ children, duration = 2, speed = 1, paused, className, style }: ShimmerTextProps) {
  return (
    <>
      <Styles />
      <span
        className={className ? `sl-text ${className}` : "sl-text"}
        data-paused={paused || undefined}
        style={{ "--sl-text-dur": `${duration}s`, "--sl-speed": Math.max(0.05, speed), ...style } as React.CSSProperties}
      >
        {children}
      </span>
    </>
  )
}

/** A generic card-shaped skeleton: avatar, two title lines, two body lines, three chips. */
function DefaultSkeleton() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SkeletonCircle size={36} />
        <div style={{ display: "grid", gap: 8, flex: 1, minWidth: 0 }}>
          <SkeletonLine width={96} />
          <SkeletonLine width={64} height={8} radius={4} />
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <SkeletonLine />
        <SkeletonLine width="72%" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    </div>
  )
}

function ShimmerLoaderRoot({
  loading = true,
  skeleton,
  children,
  speed = 1,
  paused,
  accent,
  className,
  style,
}: ShimmerLoaderProps) {
  const k = Math.max(0.05, speed)
  // Keep the skeleton mounted while it fades out, then drop it so it stops animating.
  const [prevLoading, setPrevLoading] = React.useState(loading)
  const [leaving, setLeaving] = React.useState(false)
  if (loading !== prevLoading) {
    setPrevLoading(loading)
    setLeaving(!loading)
  }

  React.useEffect(() => {
    if (!leaving) return
    const id = window.setTimeout(() => setLeaving(false), (FADE_MS + 120) / k)
    return () => window.clearTimeout(id)
  }, [leaving, k])

  const showSkeleton = loading || leaving
  const vars = { "--sl-speed": k, ...(accent ? { "--sl-accent": accent } : null), ...style } as React.CSSProperties

  return (
    <div
      className={className ? `sl ${className}` : "sl"}
      style={vars}
      data-loading={loading || undefined}
      data-paused={paused || undefined}
      data-tint={accent ? "" : undefined}
      aria-busy={loading}
      aria-live="polite"
    >
      <Styles />
      <div className="sl-stack">
        {showSkeleton && (
          <div className="sl-skeleton" aria-hidden>
            {skeleton ?? <DefaultSkeleton />}
          </div>
        )}
        <div className="sl-content" aria-hidden={loading || undefined} inert={loading || undefined}>
          {children}
        </div>
      </div>
    </div>
  )
}

/** ShimmerLoader with its building blocks attached: `.Line`, `.Circle`, `.Block`, `.Skeleton`, `.Text`. */
export const ShimmerLoader = Object.assign(ShimmerLoaderRoot, {
  Skeleton,
  Line: SkeletonLine,
  Circle: SkeletonCircle,
  Block: SkeletonBlock,
  Text: ShimmerText,
})

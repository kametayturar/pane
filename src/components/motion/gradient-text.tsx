"use client"

import * as React from "react"

/**
 * GradientText (Ink Sweep) – letters whose ink brightness drifts across them, one neutral colour, no hue.
 * Use it on a single phrase. Pass `colors` only when a brand truly needs hue.
 *
 *   <GradientText as="h1">Make something people remember</GradientText>
 */

export type GradientTextProps = {
  children?: React.ReactNode
  /** Element to render. Default "span". */
  as?: React.ElementType
  /** Optional tint for the ink (any CSS colour). Default is neutral ink. */
  accent?: string
  /** Explicit gradient stops. Overrides the colours derived from `accent`. */
  colors?: string[]
  /** Motion speed multiplier – 1 is the designed pace (one loop every 7s). */
  speed?: number
  /** Freeze the flow on the current frame. */
  paused?: boolean
  className?: string
  style?: React.CSSProperties
}

const CSS = `
.gt {
  --gt-speed: 1;
  /* Ink sweep: one neutral ink, its own brightness travels across the letters. */
  --gt-ink: 0 0 0;
  --gt-c1: rgb(var(--gt-ink) / .92);
  --gt-c2: rgb(var(--gt-ink) / .4);
  --gt-c3: rgb(var(--gt-ink) / .72);
  --gt-c4: rgb(var(--gt-ink) / .34);
  display: inline-block; max-width: 100%;
  padding-bottom: .1em; margin-bottom: -.1em;
  color: var(--gt-c1);
}
:is(.dark, [data-theme="dark"]) .gt { --gt-ink: 255 255 255 }
.gt, .gt *, .gt *::before, .gt *::after { box-sizing: border-box }

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .gt {
    --gt-stops: var(--gt-c1), var(--gt-c2), var(--gt-c3), var(--gt-c4), var(--gt-c1);
    color: transparent; -webkit-text-fill-color: transparent;
    background-image: linear-gradient(100deg, var(--gt-stops));
    background-size: 200% 100%;
    background-repeat: repeat-x;
    -webkit-background-clip: text; background-clip: text;
    animation: gt-flow calc(7s / var(--gt-speed)) cubic-bezier(.22, 1, .36, 1) infinite;
  }
}
/* The ink field travels exactly one tile, so the loop is seamless. */
@keyframes gt-flow {
  from { background-position: 0% 0 }
  to { background-position: 200% 0 }
}

.gt[data-paused] { animation-play-state: paused }

@media (forced-colors: active) {
  .gt { color: CanvasText; -webkit-text-fill-color: currentColor; background: none; animation: none }
}
@media (prefers-reduced-motion: reduce) {
  .gt { animation: none }
}
`

export function GradientText({ children, as: As = "span", accent, colors, speed = 1, paused, className, style }: GradientTextProps) {
  const rootStyle = { ...style, "--gt-speed": speed } as Record<string, unknown>
  if (accent) {
    rootStyle["--gt-c1"] = accent
    rootStyle["--gt-c3"] = `color-mix(in oklab, ${accent} 70%, transparent)`
    rootStyle["--gt-c2"] = `color-mix(in oklab, ${accent} 38%, transparent)`
    rootStyle["--gt-c4"] = `color-mix(in oklab, ${accent} 32%, transparent)`
  }
  if (colors && colors.length > 0) {
    const list = colors.length === 1 ? [colors[0], colors[0]] : colors
    rootStyle["--gt-stops"] = [...list, list[0]].join(", ")
    rootStyle["--gt-c1"] = list[0]
  }
  return (
    <As className={["gt", className].filter(Boolean).join(" ")} style={rootStyle as React.CSSProperties} data-paused={paused || undefined}>
      <style href="gradient-text" precedence="default">
        {CSS}
      </style>
      {children}
    </As>
  )
}

export default GradientText

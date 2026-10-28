"use client"

import * as React from "react"

/**
 * GradientText – letters cut from a liquid, ever-flowing gradient.
 * The colours come from `accent` (hue-shifted neighbours) or an explicit `colors` list.
 *
 *   <GradientText as="h1" accent="#7c3aed">Make something people remember</GradientText>
 */

export type GradientTextProps = {
  children?: React.ReactNode
  /** Element to render. Default "span". */
  as?: React.ElementType
  /** Base colour; the other stops are hue-shifted from it. Any CSS colour. */
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
  --gt-accent: #0060e2;
  --gt-speed: 1;
  /* Fallback stops for engines without relative colour syntax. */
  --gt-c1: var(--gt-accent);
  --gt-c2: color-mix(in oklab, var(--gt-accent) 55%, #ff4fa3);
  --gt-c3: color-mix(in oklab, var(--gt-accent) 55%, #19c6ff);
  --gt-c4: color-mix(in oklab, var(--gt-accent) 60%, #ffffff);
  display: inline-block; max-width: 100%;
  padding-bottom: .1em; margin-bottom: -.1em;
  color: var(--gt-c1);
}
@supports (color: oklch(from red l c h)) {
  .gt {
    --gt-c2: oklch(from var(--gt-accent) calc(l + .06) c calc(h + 55));
    --gt-c3: oklch(from var(--gt-accent) calc(l + .1) c calc(h - 50));
    --gt-c4: oklch(from var(--gt-accent) calc(l + .18) calc(c * .85) calc(h + 20));
  }
}
:is(.dark, [data-theme="dark"]) .gt { --gt-accent: #4d8dff }
.gt, .gt *, .gt *::before, .gt *::after { box-sizing: border-box }

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .gt {
    --gt-stops: var(--gt-c1), var(--gt-c2), var(--gt-c3), var(--gt-c4), var(--gt-c1);
    color: transparent; -webkit-text-fill-color: transparent;
    background-image:
      radial-gradient(60% 140% at 50% 0%, rgb(255 255 255 / .5), transparent 70%),
      linear-gradient(100deg, var(--gt-stops));
    background-size: 150% 100%, 200% 100%;
    background-repeat: repeat-x, repeat-x;
    -webkit-background-clip: text; background-clip: text;
    animation: gt-flow calc(7s / var(--gt-speed)) linear infinite;
  }
}
/* Two layers at different speeds make the colour swim instead of scrolling: the glint drifts the other way
   (and wraps) while the colour field travels exactly one tile, so the loop is seamless. */
@keyframes gt-flow {
  from { background-position: 300% 0, 0% 0 }
  to { background-position: 0% 0, 200% 0 }
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
  if (accent) rootStyle["--gt-accent"] = accent
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

import * as React from "react"

import { GlowCloud } from "@/components/illustrations/glow-cloud"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  const [variant, setVariant] = React.useState<"glow" | "frost">("glow")
  const [pokes, setPokes] = React.useState(0)

  return (
    <div className="flex w-full flex-col items-center gap-3 p-4">
      <GlowCloud {...props} variant={variant} onPoke={() => setPokes((n) => n + 1)} />
      <div className="flex items-center gap-3 text-xs">
        <div role="group" aria-label="Variant" className="flex rounded-lg bg-black/5 p-0.5 dark:bg-white/10">
          {(["glow", "frost"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={variant === v}
              onClick={() => setVariant(v)}
              className="rounded-md px-3 py-1 font-medium capitalize opacity-60 transition aria-pressed:bg-white aria-pressed:opacity-100 aria-pressed:shadow-sm dark:aria-pressed:bg-white/15"
            >
              {v}
            </button>
          ))}
        </div>
        <span className="opacity-50 tabular-nums">{pokes === 0 ? "Move the pointer, or poke the cloud" : `Poked ${pokes}×`}</span>
      </div>
    </div>
  )
}

export const notes = [
  "The cloud is one SVG <path>. The 'glow' variant fills it with a gradient inside a group with opacity, so the translucency applies to the whole shape at once, and adds a CSS drop-shadow filter for the glow.",
  "In the 'frost' variant the eyes are holes: an SVG <mask> holds a white rectangle with black eye ellipses, and the cloud group uses mask=url(#…). Because the mask content blinks and looks around with the same CSS classes, the holes animate too.",
  "Idle motion is pure CSS keyframes (float, glance, blink via scaleY on a fill-box origin). Pointer tracking only writes two CSS custom properties (--gc-lx, --gc-ly) on the root, so the eyes move on the compositor with no React re-render.",
  "Clicking uses a React key: bumping it remounts the wrapper, which restarts the squash-and-stretch bounce and the one-eye wink animation from frame zero.",
  "The scene is drawn on a fixed 480×360 stage and scaled with transform: scale(), driven by a ResizeObserver that sets --gc-scale, so nothing reflows at any width.",
]

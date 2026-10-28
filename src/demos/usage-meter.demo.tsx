import * as React from "react"

import { UsageMeter } from "@/components/ui/usage-meter"

export const notes: string[] = [
  "Each meter is a `role=\"meter\"` element with `aria-valuenow`, `aria-valuemax` and a spoken `aria-valuetext` (\"3.5M of 5M tokens, 70%\"), so the number is announced rather than just drawn.",
  "The fill is a full-width element scaled with `transform: scaleX(var(--um-p))` and `transform-origin: left`. Animating a transform instead of `width` keeps the motion off the layout thread; a keyframe grows it from 0 on first paint.",
  "The colour is chosen by a threshold function (warn at 80%, critical at 95%) that sets `data-level` on the row; CSS custom properties (`--um-c`) then colour the fill, the number and the badge from that one attribute.",
  "The numbers count up with `requestAnimationFrame` and an ease-out-quart curve, starting from wherever they currently are, so a live update glides instead of jumping. `prefers-reduced-motion` skips the animation.",
  "The segmented variant lights blocks with a per-block `transition-delay` set from a CSS variable (`--n`), which gives the staggered sweep without any JS timers.",
]

export default function Demo() {
  const [variant, setVariant] = React.useState<"bar" | "segments">("bar")
  const [live, setLive] = React.useState(true)
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-4">
      <UsageMeter
        variant={variant}
        autoPlay={live}
        plan="Team"
        period="Resets in 12 days"
        onUpgrade={() => {}}
      />
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-neutral-500">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={variant === "segments"} onChange={(e) => setVariant(e.target.checked ? "segments" : "bar")} />
          Segmented
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Simulate usage
        </label>
      </div>
    </div>
  )
}

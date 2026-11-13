import * as React from "react"

import { SegmentedControl } from "@/components/ui/segmented-control"
import { UsageMeter } from "@/components/ui/usage-meter"

export const notes: string[] = [
  "Each meter is a `role=\"meter\"` element with `aria-valuenow`, `aria-valuemax` and a spoken `aria-valuetext` (\"3.5M of 5M tokens, 70%\"), so the number is announced rather than just drawn.",
  "The fill is a full-width element scaled with `transform: scaleX(var(--um-p))` and `transform-origin: left`. Animating a transform instead of `width` keeps the motion off the layout thread; a keyframe grows it from 0 on first paint.",
  "Bars are neutral ink. A threshold function (80% and 95%) sets `data-level` on the row, which only changes the quiet note; red appears only once a limit is actually reached.",
  "The numbers count up with `requestAnimationFrame` and an ease-out-quart curve, starting from wherever they currently are, so a live update glides instead of jumping. `prefers-reduced-motion` skips the animation.",
  "The segmented variant lights blocks with a per-block `transition-delay` set from a CSS variable (`--n`), which gives the staggered sweep without any JS timers.",
]

export default function Demo() {
  const [mode, setMode] = React.useState("bar-live")
  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
      <UsageMeter
        variant={mode.startsWith("seg") ? "segments" : "bar"}
        autoPlay={mode.endsWith("live")}
        plan="Team"
        period="Resets in 12 days"
        onUpgrade={() => {}}
      />
      <SegmentedControl
        size="sm"
        variant="tray"
        aria-label="Meter style"
        value={mode}
        onChange={setMode}
        options={[
          { value: "bar-live", label: "Bar, live" },
          { value: "seg-live", label: "Segments, live" },
          { value: "bar-still", label: "Still" },
        ]}
      />
    </div>
  )
}

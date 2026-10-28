import * as React from "react"

import { RadarChart, type RadarAxis, type RadarSeries } from "@/components/ui/radar-chart"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "Axes sit at equal angles clockwise from the top; a value becomes a radius (`value / max * R`) and a polygon is just those points joined, so the rings, spokes and every profile are all one `x = cx + r·sin θ`, `y = cy − r·cos θ` mapping.",
  "Each value of each profile is its own damped spring (`a = -K(x − target) − C·v`) stepped in one `requestAnimationFrame` loop. The damping ratio is a little under 1, so swapping a profile overshoots slightly and settles; the polygon `points` are written directly, not through React.",
  "Profiles are matched by position, not identity: replacing the second series just changes the spring targets, which is why the shape morphs from Berlin-like to Austin-like instead of redrawing.",
  "Moving the pointer converts its angle (`atan2(dx, -dy)`) to the nearest axis. The vertex markers and spoke follow an eased angle that always takes the shortest way round the web, and the tooltip is placed beyond the axis label so the label stays visible.",
  "The whole web is accessible without the picture: a focusable group with arrow-key navigation, a polite live region reading the axis and every value, and a visually hidden table.",
]

const AXES: RadarAxis[] = [
  { key: "accuracy", label: "Answer accuracy" },
  { key: "speed", label: "Speed" },
  { key: "cost", label: "Cost efficiency" },
  { key: "safety", label: "Safety" },
  { key: "tools", label: "Tool use" },
  { key: "memory", label: "Context recall" },
]

const BASELINE: RadarSeries = {
  key: "base",
  label: "Baseline",
  values: { accuracy: 64, speed: 78, cost: 71, safety: 88, tools: 66, memory: 86 },
}
const CHALLENGERS: Record<string, RadarSeries> = {
  tuned: { key: "tuned", label: "Tuned", values: { accuracy: 86, speed: 58, cost: 46, safety: 80, tools: 92, memory: 78 } },
  distilled: { key: "distilled", label: "Distilled", values: { accuracy: 70, speed: 94, cost: 90, safety: 74, tools: 60, memory: 52 } },
  ensemble: { key: "ensemble", label: "Ensemble", values: { accuracy: 92, speed: 40, cost: 34, safety: 94, tools: 84, memory: 90 } },
}

export default function Demo() {
  const [pick, setPick] = React.useState("tuned")
  const series = React.useMemo(() => [BASELINE, CHALLENGERS[pick]!], [pick])
  return (
    <div className="w-full max-w-[480px]">
      <RadarChart
        axes={AXES}
        series={series}
        label="Agent configurations"
        title="Baseline compared with"
        subtitle="Evaluation suite, scored out of 100"
        actions={
          <SegmentedControl
            variant="tray"
            size="sm"
            aria-label="Compare with"
            value={pick}
            onChange={setPick}
            options={[
              { value: "tuned", label: "Tuned" },
              { value: "distilled", label: "Distilled" },
              { value: "ensemble", label: "Ensemble" },
            ]}
          />
        }
      />
    </div>
  )
}

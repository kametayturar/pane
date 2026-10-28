import * as React from "react"

import { Streamgraph, type StreamPoint, type StreamSeries } from "@/components/ui/streamgraph"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "Every layer is resampled once per data change onto the same 161-point grid with a Catmull-Rom curve, so a 13-week range and a 52-week range have the same shape of data and can morph into each other by simply easing the numbers.",
  "The wiggle baseline is the Byron-Wattenberg offset: for each step along time it shifts the whole stack so that the weighted slope of the layers is as small as possible, which is what makes streams flow instead of staircase. Layers are ordered inside-out (first in the middle, then alternating above and below).",
  "One `requestAnimationFrame` loop eases each grid value toward its target (`1 - exp(-dt / tau)`), recomputes the baseline and writes every layer's `d` attribute directly. React renders only when the hovered point or layer changes, never per animation frame.",
  "Hiding a layer animates a visibility factor to 0 instead of removing it, so the layer thins to a hairline and its neighbours reflow. Direct labels are placed at each layer's thickest stretch and fade with its thickness.",
  "Hovering reads the pointer's x as a data index and its y against the current layer bands to isolate one layer; the other layers dim with a CSS transition, and the crosshair glides with its own eased value.",
]

const SERIES: StreamSeries[] = [
  { key: "quality", label: "Model quality" },
  { key: "billing", label: "Billing" },
  { key: "integrations", label: "Integrations" },
  { key: "onboarding", label: "Onboarding" },
  { key: "limits", label: "Rate limits" },
  { key: "requests", label: "Feature requests" },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const bump = (w: number, at: number, width: number, h: number) => h * Math.exp(-(((w - at) / width) ** 2))

/** 52 weeks of invented ticket counts: a steady base per topic plus a few launch-driven spikes. */
const WEEKS: StreamPoint[] = Array.from({ length: 52 }, (_, w) => {
  const d = new Date(Date.UTC(2025, 8, 22 + w * 7))
  const prev = new Date(Date.UTC(2025, 8, 22 + (w - 1) * 7))
  const wobble = (a: number) => Math.sin(w * 1.7 + a) * 5 + Math.sin(w * 0.6 + a * 2) * 4
  const holiday = 1 - bump(w, 13.5, 1.6, 0.42)
  const month = MONTHS[d.getUTCMonth()]!
  return {
    key: d.toISOString().slice(0, 10),
    label: `Week of ${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
    axisLabel: w === 0 || prev.getUTCMonth() !== d.getUTCMonth() ? month : undefined,
    values: {
      quality: Math.round((112 + wobble(1) + bump(w, 40, 2.2, 70) + bump(w, 31, 3, 20)) * holiday),
      billing: Math.round((76 + wobble(2) + bump(w, 28, 1.6, 120)) * holiday),
      integrations: Math.round((38 + w * 0.9 + wobble(3) + bump(w, 41, 1.6, 52)) * holiday),
      onboarding: Math.round((58 + wobble(4) + bump(w, 17, 2, 110) - bump(w, 26, 6, 16)) * holiday),
      limits: Math.round((44 + wobble(5) - bump(w, 20, 5, 12)) * holiday),
      requests: Math.round((56 + w * 0.35 + wobble(6)) * holiday),
    },
  }
})

const RANGES = { "3M": 13, "6M": 26, "1Y": 52 } as const
type Range = keyof typeof RANGES

export default function Demo() {
  const [range, setRange] = React.useState<Range>("1Y")
  const data = React.useMemo(() => WEEKS.slice(-RANGES[range]), [range])
  const total = data.reduce((a, p) => a + SERIES.reduce((b, s) => b + (p.values[s.key] ?? 0), 0), 0)
  return (
    <div className="w-full max-w-[720px]">
      <Streamgraph
        data={data}
        series={SERIES}
        label="Support tickets by topic"
        title="Support tickets by topic"
        subtitle={`${new Intl.NumberFormat("en").format(total)} tickets`}
        unit="tickets"
        categoryLabel="Week"
        actions={
          <SegmentedControl
            variant="tray"
            size="sm"
            aria-label="Range"
            value={range}
            onChange={(v) => setRange(v as Range)}
            options={[
              { value: "3M", label: "3M" },
              { value: "6M", label: "6M" },
              { value: "1Y", label: "1Y" },
            ]}
          />
        }
      />
    </div>
  )
}

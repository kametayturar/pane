import * as React from "react"

import { FunnelChart, type FunnelSegment, type FunnelStage } from "@/components/ui/funnel-chart"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "The band is one smooth closed path: each step is flat across its column and the thickness eases between steps with a smoothstep over a short zone around every boundary. Sampling it at 240 points per layer gives a curve that reads as one tapered shape rather than a bar chart.",
  "Switching the view never swaps elements. Every segment is always a layer; `split` animates a gap from 0 to 2px and a colour blend from one shared tone to per-segment hues, and isolating a segment fades the others' weight to 0 while a scale factor grows the band to fill the height. All of it chases its target with an exponential ease in one `requestAnimationFrame` loop.",
  "The dots obey the band. Each one gets a fixed vertical offset at the start; it simply keeps that offset until the band becomes thinner than its offset, then it falls out and fades. Because offsets are uniform across the first step, the share that leaves at each boundary equals the real drop-off, with no per-dot scripting.",
  "The accent highlight is a second copy of the band clipped by a `<clipPath>` rect that glides to the focused column, so the same geometry draws a pale band and a strong one without extra layout work.",
  "Below 420px of container width the same maths runs with the axes swapped (`(u, v)` becomes `(y, x)`), and the step names move to a column on the right.",
]

const STAGES: FunnelStage[] = [
  { key: "signup", label: "Signed up", values: { self: 68420, sales: 31580 } },
  { key: "source", label: "Connected a data source", values: { self: 39710, sales: 21460 } },
  { key: "run", label: "Ran a first agent", values: { self: 9140, sales: 7280 } },
  { key: "team", label: "Invited a teammate", values: { self: 4210, sales: 4190 } },
  { key: "paid", label: "Upgraded", values: { self: 1530, sales: 2060 } },
]
const SEGMENTS: FunnelSegment[] = [
  { key: "self", label: "Self-serve" },
  { key: "sales", label: "Sales-led" },
]

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="relative h-[18px] w-[30px] rounded-full transition-colors"
        style={{ background: on ? "#0060e2" : "color-mix(in oklab, currentColor 22%, transparent)" }}
      >
        <span
          className="absolute left-[2px] top-[2px] size-[14px] rounded-full bg-white shadow transition-transform"
          style={{ transform: on ? "translateX(12px)" : undefined }}
        />
      </button>
      {label}
    </label>
  )
}

export default function Demo() {
  const [seg, setSeg] = React.useState("all")
  const [split, setSplit] = React.useState(false)
  const [flow, setFlow] = React.useState(true)
  const view = split && seg === "all" ? "split" : seg === "all" ? "total" : seg
  const total = STAGES[0]!.values!.self! + STAGES[0]!.values!.sales!
  const done = STAGES[4]!.values!.self! + STAGES[4]!.values!.sales!
  return (
    <div className="w-full max-w-[720px]">
      <FunnelChart
        stages={STAGES}
        segments={SEGMENTS}
        label="Activation funnel, last 30 days"
        title="Activation funnel"
        subtitle={`Last 30 days, ${((done / total) * 100).toFixed(1)}% upgrade`}
        unit="accounts"
        view={view}
        flow={flow}
        actions={
          <>
            <SegmentedControl
              variant="tray"
              size="sm"
              aria-label="Segment"
              value={seg}
              onChange={setSeg}
              options={[
                { value: "all", label: "All" },
                { value: "self", label: "Self-serve" },
                { value: "sales", label: "Sales-led" },
              ]}
            />
            <Switch label="Split" on={split && seg === "all"} onChange={(v) => { setSplit(v); if (v) setSeg("all") }} />
            <Switch label="Flow" on={flow} onChange={setFlow} />
          </>
        }
      />
    </div>
  )
}

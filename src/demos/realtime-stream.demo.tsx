import * as React from "react"
import { Zap } from "lucide-react"

import { RealtimeStream, useSimulatedFeed } from "@/components/ui/realtime-stream"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Button } from "@/components/ui/button"

export const notes: string[] = [
  "The chart is one <canvas> and one requestAnimationFrame loop. The view's time is a constant-velocity clock that trails the newest reading by one interval, so the head is always interpolated between two real points and the line slides instead of jumping when a reading arrives.",
  "The clock follows the feed with an exponential correction (`err * (1 - exp(-dt / tau))`) on top of its own steady advance, so jitter in when readings arrive is absorbed instead of showing up as stutter. Pausing freezes it; resuming switches to a faster tau, which is the glide back to live.",
  "The curve is a monotone cubic (harmonic-mean tangents), converted to Bezier segments. The segment under the head is split with de Casteljau at the fraction the view has crossed, so the line ends exactly on the curve at any frame.",
  "The value axis eases toward the range of the visible points, and gridlines are keyed by value in a Map with their own alpha, so a change of tick step cross-fades. Theme colours are read from hidden probe elements a few times a second instead of every frame.",
  "The loop sleeps when the view is held and nothing is settling, and an IntersectionObserver stops it off screen. The big number is DOM, not canvas: each digit is a 0-9 strip moved with a CSS transform, and React re-renders it only when the head passes a new reading.",
]

export default function Demo() {
  const [windowMs, setWindowMs] = React.useState(30000)
  const { points, spike } = useSimulatedFeed({ interval: 500 })
  return (
    <div className="flex w-full max-w-[640px] flex-col gap-3">
      <RealtimeStream points={points} title="Checkout API" subtitle="p95 latency, simulated feed" label="p95 latency" unit="ms" interval={500} windowMs={windowMs} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          variant="tray"
          size="sm"
          aria-label="Window"
          value={String(windowMs)}
          onChange={(v) => setWindowMs(Number(v))}
          options={[
            { value: "10000", label: "10s" },
            { value: "30000", label: "30s" },
            { value: "60000", label: "60s" },
          ]}
        />
        <Button variant="secondary" size="sm" icon={<Zap size={14} />} onClick={spike}>
          Inject spike
        </Button>
      </div>
    </div>
  )
}

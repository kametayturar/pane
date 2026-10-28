import { DataFlow } from "@/components/illustrations/data-flow"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <DataFlow {...props} />
    </div>
  )
}

export const notes = [
  "Every record is a pure function of one clock: record n starts at n × 1.1s and its position is read from the SVG path with getPointAtLength(progress × path.getTotalLength()), eased in and out on each leg. A pool of six record groups is reused, so about forty SVG nodes move and nothing re-renders in React.",
  "A single requestAnimationFrame loop writes transforms, opacity and stroke-dasharray straight to the DOM, and a small cache skips any write whose value did not change. Speed is how fast the clock advances; pause eases that rate to zero, then the loop stops scheduling frames.",
  "The hollow dot becomes a solid square by cross-fading two rects at the same spot while their corner radius shrinks (rx from 4 to 1.5) and the group swells for a moment. After the core, each destination that takes the record gets a copy on its own out path; the extra copies fade in as the curves split, so the fan-out never clumps.",
  "A destination's share thins records evenly with floor((n + 1) × share) > floor(n × share), so 0.34 means exactly every third record, with no randomness.",
  "Trails are the same path as the record with stroke-dasharray: length 2000 and a stroke-dashoffset that slides a short dash along it. Hovering a node highlights its paths using the CSS :has() selector, without any JavaScript state.",
]

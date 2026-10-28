import type { StudioProps } from "@/components/motion/backdrop"
import { NeuralPanels } from "@/components/illustrations/neural-panels"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1000px] px-1 py-4">
      <NeuralPanels {...props} />
    </div>
  )
}

export const notes = [
  "The left terrain is ordered dithering: one domain-warped value-noise number per 3px cell is compared with a Bayer 8×8 threshold, and the value is multiplied by a vertical fade first, so dots thin out into the white card instead of turning transparent.",
  "The particle brain is 28,000 points on a Fibonacci sphere. Each frame a per-point swirl (rotating every latitude ring by a drifting angle), sine ridges, a crater pulled inward along a fixed axis and an outward-rolling wave sin(angle × 8 − t) deform the points before a perspective divide.",
  "Drawing thousands of dots stays cheap by bucketing them into 8 alpha bins and filling each bin as a single Path2D with globalAlpha (a counting sort groups them) – 8 fills per frame instead of 28,000 state changes.",
  "The terminal types with one chained setTimeout that reads the latest speed and paused state from refs. The typed text and an invisible copy of the rest share each line, so the box never changes height while it types.",
  "Layout is a CSS container query on the root (container-type: inline-size): two cards side by side above 640px, stacked below, regardless of the viewport. Both canvases read their tint from CSS custom properties, so dark mode and the accent prop need no extra code.",
]

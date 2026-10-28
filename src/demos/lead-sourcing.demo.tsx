import type { StudioProps } from "@/components/motion/backdrop"
import { LeadSourcing } from "@/components/illustrations/lead-sourcing"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-[640px] p-6">
      <LeadSourcing {...props} />
    </div>
  )
}

export const notes = [
  "The shine is a dash travelling along a path: pathLength={1} normalises the length, stroke-dasharray=\".14 2\" leaves one short dash, and animating stroke-dashoffset from .14 to -1 slides it from the start to the end.",
  "A blurred, wider copy of the same dash sits under it (filter: blur) to give the glow – the same animation on two elements, so they stay in lockstep.",
  "One 5s cycle choreographs the whole scene: the second connection uses the same keyframes with a delay of 38% of the cycle, the AI tile pulses between the two, and the check badge pops in near the end. Because every piece shares the cycle length, the loop never drifts.",
  "The status pill stacks three absolutely-positioned labels and gives each the same keyframes shifted by a third of the cycle – a CSS-only text carousel with a blur crossfade.",
  "The dashed placeholder tiles use a negative animation-delay so they start mid-breath at different phases instead of pulsing together.",
]

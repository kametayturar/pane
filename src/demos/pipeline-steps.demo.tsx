import type { StudioProps } from "@/components/motion/backdrop"
import { PipelineSteps } from "@/components/illustrations/pipeline-steps"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[880px] px-6 py-10">
      <PipelineSteps {...props} />
    </div>
  )
}

export const notes = [
  "The whole animation is a tiny virtual clock: a 40ms setInterval adds elapsed time (scaled by `speed`) to a countdown and fires the next beat of a script – connector fills, tile pops, hold, fade. Speed and pause are kept in refs, so changing them never restarts the loop.",
  "React only decides which tiles and connectors are 'reached' (data-on / data-conn attributes). The motion itself is CSS: a connector fill is transform: scaleX(0 → 1) with transform-origin: left, so it runs on the compositor instead of animating width.",
  "Each tile is a white plate with a hairline ring and an accent plate stacked on top in ::before; reaching a step fades the top plate in, pops the tile with scale(.92 → 1) and fires a one-shot ring using an animated box-shadow on ::after.",
  "Responsive layout uses a CSS container query (container-type: inline-size), not a media query, so the row stacks into a vertical list whenever the component's own box is narrower than 520px – wherever it is placed.",
  "Pass `current` to drive it from real progress: the timeline switches off and the same CSS transitions replay whenever the index changes. With prefers-reduced-motion it shows the finished state as a still frame.",
]

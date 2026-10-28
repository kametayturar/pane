import { AgentTeam } from "@/components/illustrations/agent-team"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <AgentTeam {...props} />
    </div>
  )
}

export const notes = [
  "The prompt types itself with no JavaScript timer: a hidden copy of the text sizes the box, and a visible copy on top is revealed by animating clip-path: inset(0 100% 0 0) to inset(0) with steps(N) timing, where N is the number of characters. The caret rides the same steps on a left: 0% to 100% animation.",
  "The branches are SVG cubic Béziers with pathLength=1. Animating stroke-dashoffset from 1 to 0 draws each curve, and a second path with a short dash travels along it like data flowing to the agent.",
  "Every card runs the same keyframes, staggered with animation-delay: calc(var(--i) * step). Because the animation loops, a small delay just shifts its phase, so the end of each keyframe set is kept invisible to make the loop seam clean.",
  "Status text crossfades between Queued, Working and Done by stacking the three labels in one CSS grid cell (grid-area: 1 / 1) and animating their opacity, which avoids measuring widths or swapping DOM nodes.",
  "Speed and pause are plain CSS: every duration is calc(12s / var(--at-speed)) and the root's data-paused attribute sets animation-play-state: paused on all descendants.",
]

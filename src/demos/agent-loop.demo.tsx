import { AgentLoop } from "@/components/illustrations/agent-loop"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <AgentLoop {...props} />
    </div>
  )
}

export const notes = [
  "One requestAnimationFrame clock owns the scene. It adds elapsed time times `speed` to a virtual time t (and stops while paused or scrolled out of view via IntersectionObserver), so changing speed or pausing never restarts the loop.",
  "The scene is a script: a flat list of timed steps (activate a station, add a tool call, resolve a check) built once from the data. React re-renders only when t crosses a step; the head, its trail and the token counter are written straight to the DOM every frame.",
  "The ring is an SVG circle. The head moves with an eased angle, and the comet trail is the same circle drawn with stroke-dasharray (trail length) and stroke-dashoffset (where it ends), growing and then shrinking to nothing as the head lands.",
  "Tool calls and checks are rows that enter with a CSS animation (opacity, a few px of translate, blur) and show a spinner stacked on top of two result icons; flipping data-state crossfades the spinner into a check or cross with a transition.",
  "The fixed 640 × 420 stage is scaled to the container with transform: scale() from a ResizeObserver, so the layout never reflows. Reduced motion renders the finished frame only.",
]

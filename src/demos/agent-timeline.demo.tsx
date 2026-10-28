import { AgentTimeline } from "@/components/illustrations/agent-timeline"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center p-4">
      <AgentTimeline {...props} />
    </div>
  )
}

export const notes = [
  "The clock writes one CSS custom property per frame, --atl-now (story seconds). Every span computes its own width from it in CSS: width: clamp(0px, (var(--atl-now) - var(--s)) * var(--pps), var(--d) * var(--pps)), and the playhead is translateX(var(--atl-now) * var(--pps)). React never re-renders on a frame.",
  "React re-renders only on discrete events: a span starts or ends, a handoff is reached, the run finishes. A snapshot string is compared each frame and setState is called only when it changes; the time, token and cost counters are written straight to the DOM with textContent.",
  "Handoff connectors are SVG paths made of a vertical segment, a rounded corner (Q) and a horizontal run, with pathLength=1 so stroke-dashoffset 1 → 0 draws them. Pinning a span highlights the connector into its agent and dims the other rows.",
  "Spans are real buttons with roving tabindex: arrow keys move along a row (left/right) or to the nearest span in the next row (up/down), Enter pins. Each name spells out agent, kind, times and tokens, and status is an icon plus colour, never colour alone.",
  "Cost and tokens are modelled from the data: tokens accrue linearly inside each span and are multiplied by the agent's price per million tokens; 'faster than sequential' is total busy time divided by wall-clock duration.",
]

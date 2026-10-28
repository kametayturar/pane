import { JourneyFlow } from "@/components/blocks/journey-flow"

export default function Demo() {
  return (
    <div className="flex w-full max-w-[900px] flex-col gap-4 py-4">
      <JourneyFlow />
      <p className="text-center text-[12px] text-neutral-400">
        Hover a step or a ribbon to trace its cohort, click a step to pin it, switch the channel to morph the flows, or open the flow table.
      </p>
    </div>
  )
}

export const notes = [
  "The Sankey is plain SVG paths computed by hand: a node's height is its user count times one scale, and every link is a closed cubic Bezier with both edges at the same horizontal control point, stacked along the node edge by an accumulating offset. There is no chart library, and the layout is re-run from the container width (ResizeObserver) so ribbons re-lay out instead of stretching.",
  "A channel switch animates the nine link values on springs (a = k(x_target - x) - c v, critically damped so nothing overshoots) inside one requestAnimationFrame loop that writes the `d` attributes through refs. Node heights, label positions and the next layout all derive from those animated values, and the loop stops itself once every spring is at rest.",
  "Tracing is path accounting: the graph is walked once into every route from the first visit to an end point, each route is valued by splitting users at every step in proportion to its outgoing links, and the traced amount of a link is the sum of the routes through the hovered step (or through that link). Those amounts are drawn as thinner overlay ribbons inside the real ones while the rest is dimmed.",
  "The step labels are real buttons in a role=toolbar with roving tabindex, positioned with transforms from the same animated geometry, so keyboard focus traces a step exactly like hover does. Counts roll with a small ease that never overshoots and starts a beat after the ribbons.",
  "The flow table is a grid whose row track animates between 0fr and 1fr, the usual way to transition to an automatic height without measuring anything in JavaScript.",
]

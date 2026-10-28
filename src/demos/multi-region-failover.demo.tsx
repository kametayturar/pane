import { MultiRegionFailover } from "@/components/illustrations/multi-region-failover"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <MultiRegionFailover {...props} hostname="api.acme.dev" requestsPerSecond={12000} />
    </div>
  )
}

export const notes = [
  "Every frame is a pure function of one clock u = t mod 21s: the balancer weight, the instance health, the health-check counter, every statistic and the scrubber all come from u, so jumping to a step is just setting the clock and the loop is seamless because the last frame equals the balanced first frame.",
  "Requests are a deterministic stream (one every 175 ms, 120 per cycle). Each one is routed by the weight at the moment it reaches the balancer, using a golden-ratio sequence frac(j × 0.618…) < weight, so the split is even without randomness, and it lands on a specific instance cube that flashes. Requests to a failed instance stall and turn red.",
  "The 2.5D depth is a 2:1 isometric projection written by hand: each platform and cube is three SVG polygons (top, left, right) with fills a little darker per face, drawn back to front. A request's arc is a lerp along the ground line plus a parabola of height 4·s·(1 − s), with a blurred ellipse shadow that slides along the floor and shrinks as the dot rises.",
  "The weight dial on the balancer is an ellipse with pathLength=100 and stroke-dasharray: the primary arc is 'w × 100 100' and the secondary arc is offset by -w × 100, so both always add up to the full ring.",
  "One requestAnimationFrame loop writes attributes, transforms and text straight to the DOM and skips values that did not change; a pool of 20 request dots is reused. Pause eases the loop's rate to zero before it stops scheduling frames.",
]

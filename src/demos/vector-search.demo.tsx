import { VectorSearch } from "@/components/illustrations/vector-search"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <VectorSearch {...props} />
    </div>
  )
}

export const notes = [
  "The tilted plane is a plain 2:1 isometric projection: a point (x, y) in −1…1 becomes screen x = cx + (x − y) × 140 and screen y = cy + (x + y) × 70. The search ring is a circle in plane space, which on screen is an axis-aligned ellipse with rx = 140·√2·R and ry = 70·√2·R.",
  "Everything is a pure function of one clock (u = t mod 18s). Documents drop with height = 110 × (1 − s²) and fold from a page into a dot by animating the rect's width, height and corner radius while a CSS variable --f cross-fades its fill with color-mix(). One requestAnimationFrame loop writes the values and skips any that did not change.",
  "The index is a real graph: every point links to its two nearest neighbours, islands are bridged by their closest pair, and the search signal follows Dijkstra's shortest route from the farthest point to the one nearest the query. Each hop's duration is proportional to its length so the signal keeps an even pace.",
  "Rankings and scores come from distances on the plane (similarity = 1 − 0.55 × distance), so the picture and the list always agree. Each match lights at the exact moment the widening ring reaches it: the time is solved once by bisecting the ease curve, which keeps halo, line, score chip and ranked row in sync.",
  "The embedding readout is 40 bars made of two scaled halves (scaleY up from the centre line, scaleY down below it). Same-topic documents share part of their pseudo-random vector, so their bars look alike, just as nearby points on the plane do.",
]

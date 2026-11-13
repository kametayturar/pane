import { LightForm } from "@/components/illustrations/light-form"
import type { StudioPieceProps } from "@/studio/schema"

export default function Demo(props: StudioPieceProps) {
  return (
    <div className="flex w-full justify-center px-1 py-4">
      <LightForm {...props} />
    </div>
  )
}

export const notes = [
  "Every form is a few hundred polylines built once from a seeded generator: a fan of threads from a root to a hand-placed Catmull-Rom silhouette (wing, petal, leaflet), plus partial contour arcs inside it. They sit in one typed array, so a frame allocates nothing.",
  "Light is added, not painted: the strands are stroked with `globalCompositeOperation = \"lighter\"` at low alpha, three times. The middle pass is warm white at the true position; the red pass is scaled 3.4% outward about the centre and the blue pass 3.4% inward. Where strands overlap the channels sum to white, and only toward the rim do they part, which is the fringe. A fourth, wider pass at 20% alpha is the glow.",
  "Breathing is a warp of the stored points by one phase a = 0.5 − 0.5·cos(2πt/8): the moth's wings fold in and lift, the orchid rotates its petals about the heart, the fern curls and uncurls about its base. Every motion is periodic in the 8-second loop, so the export is seamless.",
  "The ripple is a bright band travelling along a per-strand coordinate (distance from the centre, or position along the fern's stem): chunks of each strand are brightened where that coordinate meets a moving front, with a long tail behind it. Pressing the form restarts it.",
  "With no props the card plays a short tour once (a ripple, then orchid, then fern) and stops for good at the first touch, key press or focus. It pauses off screen and in hidden tabs; reduced motion shows one open frame with the ripple caught mid-way. `draw(ctx, w, h, t, values)` is the same pure function the Studio exports from.",
]

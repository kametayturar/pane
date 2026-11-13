import type { StudioProps } from "@/components/motion/backdrop"
import { GouacheLake } from "@/components/illustrations/gouache-lake"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1000px] px-1 py-4">
      <GouacheLake {...props} />
    </div>
  )
}

export const notes = [
  "Every mark is a dab: a squared blob with an irregular 8-point edge and two bristle streaks, drawn flat and opaque. Silhouettes (sky, far range, hillside, bank) are filled with staggered rows of dabs back to front, and each tree is a scatter of dabs inside its shape.",
  "Three flat tones per mass, like three pots of paint: each dab picks shadow, mid or light by how much its spot faces a fixed light from the upper left, plus noise. Distant masses are mixed toward the sky haze, so depth comes from colour, not blur.",
  "The land is baked once to an offscreen canvas and cut off at a wavy, hard shoreline. The lake is that bake drawn flipped at 90% height with the contrast pulled down, then painted over with flat horizontal strokes. Only the water, boat and wake redraw each frame.",
  "The water is drawn in 3px rows, each split into nine segments shifted sideways: a slow sine swell everywhere, and a Gaussian bump of extra swell around the last few seconds of the boat's path, so the reflection wobbles where the wake is. All phases are whole cycles of the 24s loop.",
  "The wake is a function of the boat's path, not a particle system: one pale dash every 0.2s of path time, pinned to the water and spreading and fading as it ages. The crossing, the swell and the oar are periodic, so the Studio can render any frame t exactly. Touch the water and the built-in crossing hands over: the boat heads to your tap with its recent wake intact.",
]

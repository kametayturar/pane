import type { StudioProps } from "@/components/motion/backdrop"
import { ChalkObservatory } from "@/components/illustrations/chalk-observatory"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1000px] px-1 py-4">
      <ChalkObservatory {...props} />
    </div>
  )
}

export const notes = [
  "Every mark is a stamped sprite with its tool's own texture: chalk is a dusty stick stroke with lengthwise striations and specky edges, pastel pencil a thin thin-thick-thin line that skips on grain, charcoal a broad blotchy mark with broken edges, the white pencil a pricked, slightly irregular dot. Each sprite is tinted once per colour and stamped thousands of times with a direction, length and pressure.",
  "The paper is generated once: dark indigo with mottling and light fibres, plus a tooth height map (fine value noise, a faint net of cell walls and grain). Each pass is drawn on a scratch layer and then put through the tooth: a pixel keeps pigment only where the stroke's pressure is higher than the depth of the pit under it, so chalk breaks up most, charcoal less, the white pencil least.",
  "Surfaces are built in 2–4 passes, dark underlayer first: the sky in long directional chalk strokes whose tone steps from deep indigo to teal (picked, never blended), the milky band in lilac and cream chalk dragged along its length with a finger, charcoal dust lanes, then thousands of white-pencil stars. Charcoal masses are smudged by laying the pass down again a few pixels along the slope at falling opacity.",
  "The drawing is baked once into three layers (sky and valley, the cloud banks, the near ridges with the observatory) and a multiply pass of the paper's pits. In the gallery it bakes in slices across frames, so the paper and sky appear at once and the detail arrives after.",
  "Only a small live layer moves: the cloud bank drifts a few pixels and back over the 40-second loop, and nine valley lamps come on one by one, then all go out together just before the loop repeats. Reduced motion shows the still frame with every lamp on.",
]

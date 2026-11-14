import type { StudioProps } from "@/components/motion/backdrop"
import { PastelHarbor } from "@/components/illustrations/pastel-harbor"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[1100px] px-1 py-4">
      <PastelHarbor {...props} />
    </div>
  )
}

export const notes = [
  "Every surface is built from short marks, never a fill: each mark is a tapered ribbon along a slightly bent path, thin where the stick lands, full where it presses, thin where it lifts. Four tools share that primitive and differ in width, opacity and extras: oil pastel is wide and opaque with a lighter drag line along the stroke, wax crayon is narrower with a doubled gritty edge, coloured pencil is a hairline laid in parallel hatching sets, and chalk is a soft halo under a narrow core.",
  "Colour comes from rows of sticks, not gradients. A stroke picks one stick from a row (sky top to horizon, cloud shadow to lit rim, water near to far) plus a random reach of one or two sticks either way, so tone is built by layering neighbouring colours the way it is on paper. The hatching angle drifts patch by patch with slow noise, and around the sun the strokes curl tangentially.",
  "The paper is a height map made once from three octaves of value noise. Each tool has its own threshold on it: every pass is painted on a scratch layer, the paper's valleys are punched out of it with destination-out (most for chalk and crayon, least for pencil), and only then is the pass laid down. A final multiply of the same map presses the tooth into everything.",
  "The water mirrors what stands on it without a flipped copy: cranes, ferry, boats and posts are also drawn into a small id map with their waterlines, and each reflection dash looks up its mirrored point (with a sideways sway that grows with distance), borrows the colour drawn there and mixes it toward the water. The swell breaks the reflection into horizontal slices.",
  "The drawing is baked once per seed, size and setting, in about twenty passes spread across frames so the block-in shows first; only a small live layer moves: lamp reflections sway, glints come and go on the sun path, and the gulls drift on small circles, all periodic over 20 seconds. It stops off screen and in hidden tabs, and reduced motion shows one still frame.",
]

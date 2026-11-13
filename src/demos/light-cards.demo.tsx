import { LightCards } from "@/components/blocks/light-cards"
import type { StudioPieceProps } from "@/studio/schema"

export default function Demo(props: StudioPieceProps) {
  return (
    <div className="flex w-full justify-center px-1 py-4">
      <LightCards {...props} />
    </div>
  )
}

export const notes = [
  "Each card's art is a few hundred polylines built once from a seeded generator (a fan of petals, a swept sail, tilted ellipses, a twisted ribbon) and stored in typed arrays. A frame allocates nothing but colour strings.",
  "Light is added, not painted: strands are stroked with `globalCompositeOperation = \"lighter\"` at low alpha, so overlaps sum toward white and only the outer strands keep a colour. A soft radial gradient is the glow, and a seeded grain tile is laid on with `source-atop` so it only touches painted light.",
  "Brightening is one number per card, `lit`, from 0 to 1. It lifts the stroke alpha, draws each strand further toward its tip, tilts and breathes the form by a hair, and lights the card's hairline and number. Hover, focus and selection all just set a target, and `lit` eases to it with an exponential, so moving across cards hands the light from one to the next without a jump.",
  "Every card shows its own art at rest, at about half brightness and drawn in over under a second, each with a different form and crop. Hover, focus and selection only lift it to full and nudge it. Each form is rooted outside its card, so the card's edge crops it. The canvas sits behind the text and ignores the pointer; the card itself is a real button (`aria-pressed`, arrow keys move between cards).",
  "With no props the cards play a tour: each lights in turn for two seconds. It stops for good at the first pointer, key or focus event, pauses off screen and in hidden tabs, and reduced motion shows the first card lit and the rest at their resting art. `draw(ctx, w, h, t, values)` is the same pure function the Studio exports from.",
]

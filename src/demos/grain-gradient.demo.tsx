import { GrainGradient } from "@/components/motion/grain-gradient"
import type { StudioPieceProps } from "@/studio/schema"

export default function Demo(props: StudioPieceProps) {
  return (
    <div className="flex w-full justify-center px-1 py-4">
      <GrainGradient {...props} />
    </div>
  )
}

export const notes = [
  "The field is one scalar per cell, 0 for the ground and 1 for the core, computed on a grid about a third of the output size and mapped through 256 colours. The colours are blended in OKLab, so a dark-to-light ramp passes through clean mid-tones instead of going muddy. A smooth field loses nothing when it is stretched, so it is drawn small and scaled up.",
  "Two slow value noises bend the plane before the shape is evaluated (a domain warp), and their sample points travel on a circle, so the motion repeats exactly every 12 seconds. The light angle is a plain number: the orb's hot core leans toward it, the ring brightens on its side, the band and the silk run along or across it.",
  "Grain is added after the field, at full resolution, from a seeded 256-pixel tile that was high-passed so it has no blotches. It goes on twice: with the overlay blend for mid-tones and highlights, and as a faint additive layer for the near-black shadows, where overlay does almost nothing and banding shows first. The pattern is anchored to the picture, so it stays still while the colour moves.",
  "With no props the card plays a tour once: the light turns across the orb, then the ring takes over and the light comes round again. The first touch, drag or key press ends it for good; dragging then turns the light, with the angle easing toward your finger the short way round. It pauses off screen and in hidden tabs; reduced motion shows one frame with the light half-way. `draw(ctx, w, h, t, values)` is the pure function the Studio exports from, and Save image runs it at 2160 px.",
]

import type { StudioProps } from "@/components/motion/backdrop"
import { GoldenHills } from "@/components/illustrations/golden-hills"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[960px] px-1 py-4">
      <GoldenHills {...props} />
    </div>
  )
}

export const notes = [
  "The still part of the picture is baked once to an offscreen canvas: five ridges from seeded 1D value noise, each painted in vertical strips whose colour comes from the slope facing the sun (slope × sun side), then thousands of tapered grass blades stamped on top, binned by colour so every bin is a single Path2D and one fill. Far layers mix toward the horizon colour for haze.",
  "Light is one number from 0 to 1. It moves the sun, its elevation, the sun side the slopes are shaded from and the palette (three keyframes: morning, golden hour, dusk). Changing it re-bakes the scene at half resolution while you drag and settles to full resolution 160ms after you let go.",
  "Each frame only draws what moves: the baked image, soft cloud lumps in the sky, cloud shade and the walker. Shade is painted small as radial gradients, cut to the hills with destination-in and multiplied onto the picture, so it darkens and cools the grass but never the sky. The same lump function is sampled at the walker's feet, so the cast shadow and the warm rim light fade out while the cloud covers the figure and return as it passes.",
  "Everything is a pure function of time on a 60 second loop (positions wrap, the walker fades in and out at the seam), with all randomness from a seeded generator. That is what lets the Studio export the exact same frame at any size, and the grain and vignette are baked into the picture so exports keep them.",
  "With no props the scene plays its own intro: the light eases from early to golden hour while the first cloud shade drifts toward the walker. The first drag, key press or button press ends that script for good. It pauses off screen and in hidden tabs, and reduced motion shows one still frame with the shade over the walker.",
]

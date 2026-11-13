import type { StudioProps } from "@/components/motion/backdrop"
import { PeekIcon } from "@/components/illustrations/peek-icon"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full max-w-[640px] justify-center px-1 py-6">
      <PeekIcon {...props} />
    </div>
  )
}

export const notes = [
  "Each icon is one SVG built by a pure function: a superellipse path (the continuous-corner squircle) is the clip, the app's job is flat geometry behind (a clock, an envelope, a magnifier), and the character is four to eight flat shapes. The outline is the same shapes drawn first with a thick round-joined ink stroke, and the hard shadow is that outline layer again, offset and at low alpha. There are no gradients.",
  "The angled crop does the work. The head is placed at a point outside the tile along the peek direction and turned so its top points at the centre; the squircle clip cuts the chin off, so only ears, eyes and a hint of muzzle are inside. Seeded jitter varies ear height and eye spacing, so a seed always draws the same character.",
  "The decisive moment is a damped spring evaluated in closed form. The head slides in along its peek axis with about 12% overshoot while swinging a few degrees, then the eyes look at the app's shape, at you, and aside, blink twice, and the head leans in before ducking out again. Because the pose is a function of time, the Studio can draw any frame at any size.",
  "With no props the three icons play that loop, offset by a beat each, and stop for good at the first hover, touch, key press or focus. After that the eyes follow the pointer, hovering or focusing leans the character in with a blink, and pressing an icon ducks it and pops it back on a spring. Reduced motion shows one still frame, eyes on you, and still lets the eyes follow the pointer.",
  "The page keeps one rAF loop that writes each tile's SVG only when its pose changed, and stops it off screen and in hidden tabs. Each icon is a real button named after its character, focus draws a ring in the accent colour, and Mono turns the art greyscale while Glass adds a rim highlight.",
]

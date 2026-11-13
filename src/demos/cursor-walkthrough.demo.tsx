import type { StudioProps } from "@/components/motion/backdrop"
import { CursorWalkthrough } from "@/components/motion/cursor-walkthrough"

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center">
      <CursorWalkthrough {...props} />
    </div>
  )
}

export const notes = [
  "A script is a list of beats (click, type, drag, move, wait) that name targets instead of coordinates. Each loop the piece measures every `[data-target]` element with `getBoundingClientRect`, so the same script keeps working when the layout reflows. A pure function turns the beats into a timeline: eased arcs between targets, presses, keystrokes and drags, all as times in milliseconds.",
  "The cursor travels on a quadratic curve that bends away from the straight line by about 16% of the distance, alternating sides, and eases with a slow start and a soft arrival. Travel time grows with distance, so a short hop is not as slow as a long one. It aims inside each target but off its text, rests on empty surface between beats, and swaps to an I-beam as it nears the field.",
  "Nothing is faked. A press sets `data-pressed` on the real button (scale .96), a click calls `click()`, typing writes through the native input setter and fires `input` so the controlled React field updates, and a drag sends pointer events to the handle and `pointermove` to the window, the same path a mouse takes. One `requestAnimationFrame` loop writes a single transform to the cursor and fires the events whose time has come.",
  "The decisive moment is the press on Reserve table: the button blurs out and the confirmation (table, time, name) blurs in over the same footprint, while the cursor drifts to empty surface and the result holds for about two seconds. It resets with a cause you can see, the cursor clicks Change, instead of rewinding the data.",
  "With no props it plays on its own and stops for good at the first real pointer, key or focus event (events the walkthrough sends are untrusted or flagged and ignored), leaving a working form. It pauses off screen and in hidden tabs. Reduced motion shows the held result with the cursor resting beside it. Pass `script` and `children` to walk through your own piece, or `values` and `size` to draw the same story on a canvas for export.",
]

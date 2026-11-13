import { SwipeRow } from "@/components/ui/swipe-row"

export default function Demo() {
  return (
    <div className="flex w-full justify-center">
      <SwipeRow />
    </div>
  )
}

export const notes = [
  "The row follows the finger one to one: `pointermove` writes `translate3d` straight onto the row, with no React state and no transition while the pointer is down. After 8px the drag locks to an axis; a vertical start hands the gesture back to the page (`touch-action: pan-y`), a horizontal one captures the pointer.",
  "The actions live behind the row in a layer that is exactly as wide as the gap the row has opened, clipped from the edge, so they slide in with it and scale up with progress. Past the last action the row meets resistance (the `rubberBand` slope), and past the commit distance the first action widens to fill the whole gap, which is the cue that letting go will commit.",
  "Release is a spring seeded with the speed the finger had, measured over the last 100ms of samples. A long drag or a fast flick commits, a medium one settles open, anything else snaps back, and because the spring keeps its velocity you can catch a row mid-flight. A button press commits with no velocity, so it just glides out.",
  "The decisive moment is the gap closing. After the row flies out in the direction of the drag, its `li` height is measured in pixels and transitioned to 0 (clipped, so nothing is laid out twice), and the rows below glide up with it. The built-in demo uses the same `down`, `move` and `up` path as a real pointer: first a short accelerating flick that commits on speed alone, then a slow long swipe that commits on distance.",
  "With no props the list plays that loop and stops for good at the first touch, key press or focus; it also pauses off screen and in hidden tabs. Arrow keys open the actions, Escape closes them, Delete commits the first one and focus moves to the neighbouring row. Reduced motion shows one row held open and commits without a fling.",
]

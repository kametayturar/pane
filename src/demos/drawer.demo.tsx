import { Drawer } from "@/components/ui/drawer"

export default function Demo() {
  return (
    <div className="flex w-full justify-center">
      <Drawer />
    </div>
  )
}

export const notes = [
  "While a finger is down the sheet's transform is written straight to the element from the pointer handler: no React state per move, no CSS variable on a parent. The scrim opacity and the page's scale-back are derived from that same distance in the same call, so the three can never disagree.",
  "Past the top it follows the finger at a fraction of the distance (`rubberBand`, default 0.2) and the inverse of that is used when you catch it, so grabbing it mid-bounce still tracks 1:1. A hold below the lowest snap is rubber-banded the same way when `dismissible` is off.",
  "The decisive moment is the release. Positions from the last 100ms give the finger's speed, which seeds a spring integrated in one `requestAnimationFrame` loop. It lands on the nearest snap point to where it would coast, or one point further when the speed is above `flickVelocity` (two when it is more than 2.5 times that). A short, fast flick down dismisses it on speed, not distance.",
  "Touching it while it moves stops the loop and hands the current position and zero velocity to the finger, so it is never locked out. Opening and closing from the button or Esc use a critically damped spring, so a bounce only ever comes from a hand.",
  "With no props it plays three real drags through the same code path as a finger: a pull past the top, a flick to the lower height and a short flick that closes it. It stops for good at the first touch, key press or focus, and pauses off screen and in hidden tabs. Reduced motion shows the resting frame and moves between snap points with a short ease instead of momentum.",
]

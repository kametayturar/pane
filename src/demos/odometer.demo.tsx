import { Odometer } from "@/components/ui/odometer"

export default function Demo() {
  return (
    <div className="flex w-full justify-center">
      <Odometer />
    </div>
  )
}

export const notes = [
  "Each digit is a wheel: a strip of 0–9 twice inside a clipped column, moved with `translateY` in em units. One spring (stiffness and damping integrated in a single `requestAnimationFrame` loop) chases the target number, and every wheel derives its offset, per-digit opacity and motion blur from that one value, so nothing re-renders per frame.",
  "A wheel only rolls when the wheel to its right is about to wrap (the last 10% of its cycle, eased), which is what makes it read as a real odometer instead of every digit sliding at once.",
  "The decisive moment is just a different target: when Atlas needs a decision, the spring is pointed at the amount to check, so the count rolls from 768 to 4,860. A new thousands wheel and the dollar sign fade in and the other slots glide right (their positions are CSS transforms, so the layout change is a transition), and the number turns the accent colour. Answering points the spring back at the count and on to 1,240.",
  "The whole number is sized by a container query unit (`cqw`) divided by its own width in em, so it fills the card from 360px up and never overflows. If frames never arrive (a throttled tab, a screenshot) a timeout lands the wheels on the target anyway.",
  "With no props the card plays its own loop and stops at the first touch, key press or focus; it also pauses off screen and in hidden tabs. Pass `phase`, `count` and `check` to drive it from real data. Reduced motion shows the held `$4,860` frame and jumps straight to Done when answered.",
]

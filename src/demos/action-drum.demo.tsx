import * as React from "react"

import { ActionDrum } from "@/components/ui/action-drum"

export default function Demo() {
  // The first drum plays the built-in loop until you touch it; "Ask again" brings back a fresh, quiet one.
  const [round, setRound] = React.useState(0)
  const [done, setDone] = React.useState(false)

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col gap-3">
      <ActionDrum key={round} demo={round === 0} onConfirm={() => setDone(true)} />
      <div className="h-7">
        {done && (
          <button
            type="button"
            onClick={() => {
              setRound((r) => r + 1)
              setDone(false)
            }}
            className="rounded-md px-2 py-1 text-[13px] text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-neutral-400 dark:hover:text-white"
          >
            Ask again
          </button>
        )}
      </div>
    </div>
  )
}

export const notes = [
  "The drum is three rows positioned by one spring. A single rAF loop integrates `pos` (a float row index) and writes each row's `transform: translateY() rotateX() scale()`, opacity and blur straight to the DOM from the distance to the highlight, under a `perspective` parent, so the rows curve away like a cylinder with no React render per frame.",
  "React only hears about the drum when it crosses a row boundary: rounding `pos` gives the verb under the highlight, and that index drives `data-tone`, the consequence line and the aria text. The highlight tint, arrow chip and consequence cross-fade (opacity, translateY and a 4px blur) are plain CSS transitions on one easing curve.",
  "Dragging sets `pos` directly (with rubber-band past the ends) and tracks a smoothed velocity; on release the spring is seeded with that velocity and a target of the nearest row, so a flick throws the drum and it settles on a verb. Wheel, arrow keys, Home/End and a tap on a neighbouring row all just change the spring's target.",
  "Confirming snaps the drum to its row, fades the rows out, fades the result in over the highlight (a full-accent fill for the irreversible verb) and wipes the check mark in with an animated `clip-path`, while a short WAAPI scale pulse presses the bar. The highlight is the one real `<button>`: its name is the verb, its description the consequence, and a polite live region announces what settled and what was confirmed.",
  "With no props it plays the decisive moment on a loop: wait, roll to Send, press, hold the result, reset. The loop is a chain of timeouts that cancels itself off screen (IntersectionObserver), in hidden tabs and for good on the first pointer or key press. Under reduced motion it shows one still: Send under the blue highlight with its consequence line.",
  "Dragging needs `touch-action: none` on the drum, so a vertical swipe that starts on the 180px drum rolls it instead of scrolling the page; the rest of the card scrolls normally. The fade at the top and bottom is a mask on the rows only, so the highlight, its keyboard focus ring and the result are never clipped.",
  "Drive it with real data through `options`, then `value` / `onValueChange` for the verb under the highlight and `confirmed` / `onConfirm` for the decision. Setting `confirmed` back to `null` brings the drum back for the next request (the demo's Ask again remounts a fresh drum). If a controlled `value` is not accepted, the drum springs back to it.",
]

import * as React from "react"

import { NotificationStack } from "@/components/ui/notification-stack"

export const notes: string[] = [
  "Every card is absolutely positioned at the top of the list. Collapsed, the cards behind the front one get an 8px step and a slightly smaller `scale`; expanded, each card's `translateY` becomes the sum of the heights above it. One `transition: transform` animates between the two layouts.",
  "Card heights are read with a ResizeObserver and written back as a CSS variable. That is what lets the list height transition between two pixel values – CSS can't transition to `height: auto`.",
  "Dismissing doesn't remove the card at once: its id goes into a `leaving` set so it can fade out with a short blur, and the real removal runs from a timer after the exit animation. The cards below close the gap because their offsets are computed without the leaving card.",
  "The entrance animates the individual `translate` property while the layout uses `transform`, so a new card can drop in without fighting the stacking transform.",
  "Keyboard: the header button carries `aria-expanded`/`aria-controls`; cards are focusable with Enter to expand, arrow keys to move, Delete to dismiss and Escape to collapse. Swipe uses pointer capture plus a distance or velocity check.",
]

export default function Demo() {
  const [live, setLive] = React.useState(true)
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-4">
      <NotificationStack key={String(live)} autoPlay={live} />
      <label className="flex items-center gap-2 text-[13px] text-neutral-500">
        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
        Simulate incoming notifications
      </label>
    </div>
  )
}

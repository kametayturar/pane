import * as React from "react"

import { DitherCards, type DitherCardItem } from "@/components/blocks/dither-cards"

export default function Demo() {
  const [opened, setOpened] = React.useState<DitherCardItem | null>(null)
  const [art, setArt] = React.useState<"dither" | "ascii">("dither")

  return (
    <div className="flex w-full max-w-[1100px] flex-col items-center gap-5 py-4">
      <DitherCards art={art} onExpand={setOpened} />
      <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-neutral-600 dark:text-neutral-300">
        <div role="group" aria-label="Art style" className="flex gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
          {(["dither", "ascii"] as const).map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={art === a}
              onClick={() => setArt(a)}
              className="rounded-md px-2.5 py-1 text-xs font-medium capitalize opacity-60 transition aria-pressed:bg-white aria-pressed:opacity-100 aria-pressed:shadow-[0_0_0_.5px_rgb(0_0_0/.1),0_1px_2px_rgb(0_0_0/.08)] dark:aria-pressed:bg-white/15"
            >
              {a}
            </button>
          ))}
        </div>
        <span aria-live="polite" className="min-h-5 text-xs opacity-70">
          {opened ? `Expand pressed on “${opened.title}”` : "Drag, scroll, or press ← → on the row"}
        </span>
      </div>
    </div>
  )
}

export const notes = [
  "The row is a plain overflow-x scroller with CSS scroll-snap (scroll-snap-type: x mandatory, snap-align: start), so touch, trackpad and keyboard scrolling are native. Mouse drag is a small pointer-capture handler that moves scrollLeft and releases into the nearest card; snapping is switched off while dragging.",
  "The active card is derived from scrollLeft: each card's snap offset is computed (clamped to the maximum scroll), and the nearest offset wins. Autoplay is one setTimeout per resting state that waits while hovered, focused, dragged, offscreen or in a hidden tab, and wraps back to the first card.",
  "The art band is ordered dithering from a diagonal band of domain-warped value noise: each cell's value is compared with a Bayer 8×8 threshold and thinned by horizontal and vertical fades. The ASCII mode maps the same value onto the ramp .:-=+*#%@ with a little Bayer jitter, drawn with fillText.",
  "All cards' canvases share one requestAnimationFrame loop at ~20 fps that only paints canvases an IntersectionObserver says are on screen, and stops when paused, hidden or reduced-motion is on (one still frame).",
  "The task bars fill when a card scrolls into view: an IntersectionObserver sets data-in on the card, and each segment's ::after scales from 0 to 1 with a transition-delay computed from its index and row (via CSS custom properties), so the stagger needs no JS timers.",
  "Card width comes from container query units (min(520px, 100cqw − 56px)), so the same markup shows two and a half cards at 1100px and one card with a peek of the next at 320px, no matter the viewport.",
]

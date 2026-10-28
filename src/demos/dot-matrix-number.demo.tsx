import * as React from "react"

import { DitherImage } from "@/components/motion/dither-image"
import { DotMatrixNumber, VitalsCard } from "@/components/ui/dot-matrix-number"

export const notes = [
  "Each character is a 5×7 grid of <i> dots described by a tiny bitmap font (an array of strings of 0/1). Every dot is a real element that keeps its identity between renders, so a new value is just data-on flipping on some dots.",
  "The glide is pure CSS: lit dots are opacity 1 / scale 1, unlit ones sit at a faint opacity and scale .62, and a transition with a per-dot delay (column × 22ms + row × 9ms) makes the change sweep across the glyph instead of flipping at once. Dots lit in both glyphs don't change, so they simply stay.",
  "Digits are keyed from the right (key = chars.length − index) so the units digit keeps its element when 99 becomes 100, and every digit is five columns wide, which makes the width tabular. Narrow glyphs like the comma use one column.",
  "The ruler is a role=\"slider\" div with setPointerCapture for dragging and Arrow/Page/Home/End keys. Each tick's height follows a Gaussian of its distance to the value – 6 + 15·e^(−d²/5) px – so the ticks near the needle swell as it moves.",
  "The glass card is a translucent gradient plus backdrop-filter: blur() saturate(): the browser blurs whatever is painted behind the element, which is why it looks best over the dithered art.",
]

const btn =
  "grid h-8 min-w-8 place-items-center rounded-lg px-2.5 text-lg leading-none text-black/80 transition-colors hover:bg-black/5 active:scale-95 dark:text-white/85 dark:hover:bg-white/10 " +
  "shadow-[0_0_0_.5px_rgb(0_0_0/.15)] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.2)]"

export default function Demo() {
  const [age, setAge] = React.useState(25)
  const [count, setCount] = React.useState(1248)
  const [mode, setMode] = React.useState<"count" | "percent">("count")

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-8 px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl bg-white max-sm:min-h-[520px] shadow-[0_0_0_.5px_rgb(0_0_0/.08)] dark:bg-[#17171a] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1)]">
        <DitherImage accent="#6b7aa1" cellSize={3} className="max-sm:absolute max-sm:inset-x-0 max-sm:top-0" label="Dithered dragonfly behind a glass card" />
        <div className="absolute inset-x-0 bottom-0 flex justify-end p-[5%] max-sm:justify-center max-sm:p-3">
          <VitalsCard value={age} onValueChange={setAge} className="max-sm:max-w-[260px]" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <DotMatrixNumber
          value={mode === "count" ? count : count / 10}
          size="lg"
          label="Counter"
          format={mode === "count" ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          suffix={mode === "percent" ? "%" : ""}
        />
        <div className="flex items-center gap-2">
          <button type="button" className={btn} aria-label="Decrease" onClick={() => setCount((c) => Math.max(0, c - 1))}>
            −
          </button>
          <button type="button" className={btn} aria-label="Increase" onClick={() => setCount((c) => c + 1)}>
            +
          </button>
          <button type="button" className={`${btn} text-[13px]`} onClick={() => setCount(Math.floor(Math.random() * 9000) + 100)}>
            Shuffle
          </button>
          <button
            type="button"
            aria-pressed={mode === "percent"}
            className={`${btn} text-[13px] aria-pressed:bg-black/5 dark:aria-pressed:bg-white/10`}
            onClick={() => setMode((m) => (m === "count" ? "percent" : "count"))}
          >
            Percent
          </button>
        </div>
      </div>
    </div>
  )
}

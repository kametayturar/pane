import * as React from "react"

import type { StudioProps } from "@/components/motion/backdrop"
import { DitherField, type DitherPattern } from "@/components/motion/dither-field"

const PATTERNS: { id: DitherPattern; label: string }[] = [
  { id: "bayer4", label: "Bayer 4×4" },
  { id: "bayer8", label: "Bayer 8×8" },
]

export default function Demo({ speed, paused, accent }: StudioProps) {
  const [pattern, setPattern] = React.useState<DitherPattern>("bayer4")

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4 py-4">
      <div className="relative w-full overflow-hidden rounded-2xl shadow-[0_0_0_.5px_rgb(0_0_0/.08),0_1px_2px_rgb(0_0_0/.06)] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1)]">
        <DitherField className="h-[420px]" accent={accent} speed={speed} paused={paused} pattern={pattern} cellSize={pattern === "bayer8" ? 3 : 4}>
          <div className="flex h-full flex-col justify-end bg-gradient-to-t from-[#fbfbfd] via-[#fbfbfd]/70 to-transparent p-7 pt-24 dark:from-[#0f0f13] dark:via-[#0f0f13]/70 sm:p-9">
            <h3 className="max-w-md font-['Instrument_Serif','Iowan_Old_Style',Georgia,serif] text-[34px] leading-[1.05] tracking-[-0.01em] text-black/85 dark:text-white/90 sm:text-[42px]">
              Quiet signal, drawn in dots.
            </h3>
            <p className="mt-3 max-w-sm text-[13px] leading-5 text-black/55 dark:text-white/55">
              One noise value per cell, compared with an ordered threshold – so a smooth field becomes a fine, flowing grid.
            </p>
          </div>
        </DitherField>
      </div>
      <div role="group" aria-label="Dither pattern" className="flex gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/10">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={pattern === p.id}
            onClick={() => setPattern(p.id)}
            className="rounded-md px-2.5 py-1 text-xs font-medium opacity-60 transition aria-pressed:bg-white aria-pressed:opacity-100 aria-pressed:shadow-[0_0_0_.5px_rgb(0_0_0/.1),0_1px_2px_rgb(0_0_0/.08)] dark:aria-pressed:bg-white/15"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export const notes = [
  "Ordered dithering turns a smooth value into on/off dots: each cell's noise value is compared with a threshold taken from a Bayer matrix (a 4×4 or 8×8 tile repeated across the grid). Where the value beats the threshold the cell is inked, so mid-tones become evenly spread dot patterns instead of random speckle.",
  "The Bayer matrix is built by interleaving the bits of x XOR y with the bits of y – no lookup table to paste, and the same code makes 4×4 or 8×8 by changing the bit count.",
  "The organic terrain is value noise (random numbers on a lattice, blended with a quintic fade) stacked into fractal octaves and domain-warped: two slower noises shift where the main noise is sampled, which folds it into marbled ridges. One noise value is computed per cell, not per pixel, so it stays cheap.",
  "Fading at the edges multiplies the value by a mask before the threshold test, so dots thin out (true dither) instead of getting transparent – it keeps every dot crisp.",
  "The canvas is sized to devicePixelRatio, reads its tint from CSS (getComputedStyle on the canvas) so dark mode works, and its requestAnimationFrame loop stops when paused, offscreen (IntersectionObserver) or in a hidden tab. Reduced motion paints one still frame.",
]

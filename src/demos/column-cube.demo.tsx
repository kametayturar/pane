import type { StudioProps } from "@/components/motion/backdrop"
import { ColumnCube } from "@/components/illustrations/column-cube"

export default function Demo(props: StudioProps) {
  return (
    <div className="w-full max-w-[880px] px-1 py-4">
      <ColumnCube {...props} />
    </div>
  )
}

export const notes = [
  "The block is a 9×9 grid of square columns drawn in true isometric projection: x = (i − j)·0.866u, y = (i + j)·0.5u − z·0.96u. Heights come from smooth value noise plus a seeded jitter, snapped to quarter steps, and are built once per seed and cached. Columns are painted back to front by i + j, which is a correct painter's order for unit cubes on a grid, with each column inset a hair so the gaps read as shadow on a flat ground slab.",
  "Every face has four tones: top, left, right and a lifted hot tone. They are not separate colours but the ink mixed into the paper at fixed ratios, so one variable flips the whole block to dark. The coloured layer is a slab between two heights; a wall is only split into grey, layer, grey where its neighbour was cut away, so the stripe appears exactly where the corner was removed.",
  "The decisive moment is a scan head moving along the block in column units. Columns near it blend toward the accent (a crisp stripe with a trailing sheen), and a selected cell lifts once the head passes it: the top 0.55 of the column separates, rises on an ease-out cubic and leaves a faint shadow on the cell below. The same pure function of time draws the Studio frame, so a loop is seamless.",
  "With no props it plays its own loop and stops for good at the first click, key press or button press. Click a cell of the layer (or use the arrow keys and Enter) to lift or lower it, Scan or the S key sweeps again, and clicking the grey mass also scans. After that, lifts chase their targets with an exponential ease and the loop stops when everything has settled. It pauses off screen and in hidden tabs, and reduced motion shows one still frame just after the scan.",
  "It is one canvas redrawn by a single rAF loop with its state in a ref and colours read from CSS custom properties, so light, dark, Mono and Glass need no extra drawing code. The picture is 1.5:1 above 520px wide and turns taller below it, through a container query.",
]

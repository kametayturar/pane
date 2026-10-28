import { MrrWaterfall } from "@/components/blocks/mrr-waterfall"

export default function Demo() {
  return (
    <div className="flex w-full max-w-[980px] flex-col gap-4 py-4">
      <MrrWaterfall />
      <p className="text-center text-[12px] text-neutral-400">
        Switch the period or the unit, select a bar (or use the arrow keys) to open the accounts behind it.
      </p>
    </div>
  )
}

export const notes = [
  "Every bar is a floating rectangle between two levels: the running total before and after its movement. The levels are computed from the period's five movements, and the connectors are drawn at the running total between neighbours. The y axis is truncated (it does not start at zero), so the Start and End bars get a small cut-out stripe at their foot, painted in the card colour, to say so.",
  "A period or unit change does not swap elements; 17 numbers (axis low, axis high, tick step and the bottom and top of seven bars) chase their new targets on springs inside one requestAnimationFrame loop that writes SVG attributes through refs. Axis labels are ten pooled spans placed from the animated axis and faded out when the new axis needs fewer ticks, so the scale glides instead of jumping.",
  "The axis is chosen by a small 'nice numbers' routine: take the span of the running totals, pad it on both sides, and pick a step from 1, 2, 2.5, 5 times a power of ten so there are about six lines. In % of start mode the same routine runs in percent and is converted back to dollars, so the bars never rescale unpredictably between units.",
  "The bars are a role=radiogroup of invisible buttons laid over the SVG in equal slots, with roving tabindex and arrow keys that move and select (wrapping). Hover previews are only wired for mouse pointers, so a touch tap selects instead of leaving a stuck tooltip.",
  "The figures roll with a CountTo helper that eases the number in requestAnimationFrame and writes textContent directly, and the account list is keyed by period and bar so it re-enters with a short staggered rise.",
]

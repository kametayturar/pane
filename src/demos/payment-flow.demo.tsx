import { PaymentFlow } from "@/components/illustrations/payment-flow"
import type { StudioProps } from "@/components/motion/backdrop"

export default function Demo(props: StudioProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <PaymentFlow {...props} amount={42.5} fee={1.53} balance={1284.1} />
    </div>
  )
}

export const notes = [
  "The whole payment is a pure function of one clock, u = t mod 15s: every chip position, wire, status line and the balance is computed from u, so the loop repeats seamlessly and the balance keeps growing from loop to loop (base = balance + loops × payout).",
  "The amount chip 'slips under' each node because the chips are later siblings of the pill in the DOM, so they paint over it. The pill simply dwells at the node's centre for half a second while the status line changes, then eases out again with a cubic in-out curve.",
  "Lit wires are SVG paths with pathLength=1000 and stroke-dasharray 'n 1000': changing n draws the path from its start, so the accent line follows the chip down, and a green copy of the path drawn bottom to top repaints it as the approval travels back.",
  "The settlement rail has a straight run, a quarter-circle corner and a vertical run; the chip's position is found analytically from the distance travelled, which also tells the junction dots and dashed stubs when to light up.",
  "Status text crossfades by stacking two spans in one CSS grid cell and flipping a data-on attribute (opacity + blur transition). The loop caches every written value, so unchanged frames cost nothing, and it only runs while the figure is on screen.",
]

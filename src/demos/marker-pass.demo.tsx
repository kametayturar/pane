import * as React from "react"

import { MarkerPass, type MarkerPassProps } from "@/components/ui/marker-pass"

export const notes = [
  "Each stroke is measured, not guessed. Every quoted passage is a <mark> in the real text; a ResizeObserver (plus document.fonts.ready) calls getClientRects() on it, which returns one box per line the passage wraps over. Those boxes become absolutely positioned fragments behind the text, so the strokes follow reflow at 360px or 1200px without any hard-coded coordinates.",
  "The marker look is three small layers: a clip-path polygon whose edges wobble a little (seeded per fragment, so it is stable between renders), a flat accent wash, and a radial-gradient dot grid on top for the halftone. A mask fades the ink slightly toward the end of the line, the way a dry marker does.",
  "The sweep is pure CSS. Every fragment animates clip-path from inset(0 100% 0 0) to inset(0), with its delay and duration written as custom properties from the measured width, so passages are drawn one after another in the order the model used them. animationstart events scroll the document to the next passage, and the footnote chips pop in on the same clock.",
  "Hover or focus a footnote and its stroke gets data-hot: it pulses once (a scaleY keyframe) while the other strokes drop to 42% opacity. The same state is reached by J and K, which move a cursor through the highlights, scroll the pane to it and announce it through an aria-live region, so keyboard users get everything a pointer does.",
  "layout=\"stack\" is the shape for a square film: a compact answer over a large serif document with the consequence as the last line. The source list is dropped there (and below 720px in the split layout) because the footnote chips and the gutter badges already carry the same numbers.",
  "Motion only enhances. Without the measurement the quotes carry a flat highlight as a fallback, reduced motion removes every animation and shows the settled strokes, and the sweep pauses when the piece is off screen or the tab is hidden.",
]

type Scene = { id: string; label: string; props: MarkerPassProps }

const SCENES: Scene[] = [
  { id: "contract", label: "Vendor contract", props: {} },
  {
    id: "terms",
    label: "Customer terms",
    props: {
      question: "Can a customer get money back on an annual plan after the first\u00a0month?",
      agent: "Quill",
      document: {
        title: "Customer terms",
        parties: "Harbor & Finch, version 4.2",
        page: "Page 3 of 9",
        blocks: [
          {
            label: "4.1",
            title: "Monthly plans",
            text: "Monthly plans renew every thirty (30) days and can be cancelled at any time before the next renewal. No refund is issued for a partly used month.",
          },
          {
            label: "4.2",
            title: "Annual plans, first 14 days",
            text: "Annual plans may be refunded in full within fourteen (14) days of purchase or renewal, with no questions asked.",
          },
          {
            label: "4.3",
            title: "Annual plans, later",
            text: "After the first fourteen days, cancelling an annual plan stops renewal and refunds only the unused months, less a fee of ten percent (10%) of the remaining balance.",
          },
          {
            label: "4.4",
            title: "Billing errors",
            text: "Charges made in error are refunded in full, whatever the plan, once Harbor & Finch has confirmed the error.",
          },
        ],
      },
      highlights: [
        { id: "window", quote: "refunded in full within fourteen (14) days of purchase or renewal", label: "Full refund window", where: "§4.2 · p. 3" },
        { id: "unused", quote: "refunds only the unused months", label: "Unused months only", where: "§4.3 · p. 3" },
        { id: "fee", quote: "less a fee of ten percent (10%) of the remaining balance", label: "10% fee", where: "§4.3 · p. 3" },
        { id: "error", quote: "refunded in full, whatever the plan", label: "Billing errors", where: "§4.4 · p. 3" },
      ],
      answer: [
        "Only partly. Within 14 days an annual plan is refunded in full",
        { cite: "window" },
        ". After that, cancelling refunds the unused months",
        { cite: "unused" },
        ", minus a 10% fee on what is left",
        { cite: "fee" },
        ". The one exception is a charge made in error, which is always refunded in full",
        { cite: "error" },
        ".",
      ],
      consequence: "On a $1,200 plan cancelled after month 3, the refund is $810: nine unused months ($900) less a $90 fee.",
    },
  },
]

const LAYOUTS = [
  { id: "split", label: "Side by side" },
  { id: "stack", label: "Stacked" },
] as const

const SWITCH = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500/60"

export default function Demo() {
  const [scene, setScene] = React.useState(SCENES[0].id)
  const [layout, setLayout] = React.useState<"split" | "stack">("split")
  const current = SCENES.find((s) => s.id === scene) ?? SCENES[0]
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div role="group" aria-label="Example" className="inline-flex gap-0.5 rounded-lg bg-neutral-200/60 p-0.5 dark:bg-white/10">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={scene === s.id}
              onClick={() => setScene(s.id)}
              className={`${SWITCH} rounded-md px-3 py-1 text-[13px] transition-colors ${
                scene === s.id
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Layout" className="inline-flex gap-0.5 rounded-lg bg-neutral-200/60 p-0.5 dark:bg-white/10">
          {LAYOUTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={layout === s.id}
              onClick={() => setLayout(s.id)}
              className={`${SWITCH} rounded-md px-3 py-1 text-[13px] transition-colors ${
                layout === s.id
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <MarkerPass key={current.id} {...current.props} layout={layout} />
    </div>
  )
}

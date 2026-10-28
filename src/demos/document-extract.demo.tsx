import * as React from "react"

import { DocumentExtract, type ExtractOutput } from "@/components/blocks/document-extract"

export default function Demo() {
  const [accepted, setAccepted] = React.useState<ExtractOutput | null>(null)
  return (
    <div className="flex w-full max-w-[1080px] flex-col gap-4 py-4">
      <DocumentExtract
        onAccept={async (data) => {
          await new Promise((r) => setTimeout(r, 700))
          setAccepted(data)
        }}
      />
      <p aria-live="polite" className="min-h-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {accepted ? `onAccept received ${Object.keys(accepted).length} typed fields` : "Press Extract, then Accept all to see onAccept fire"}
      </p>
    </div>
  )
}

export const notes = [
  "The model call is an async iterable of events (value, usage, error), consumed with `for await` under one AbortController. Each value event carries the ids of the document spans it came from, so the form and the page stay joined by plain string ids, not by position.",
  "The page is real DOM: every citable span is a `<span data-span=id>` and the viewer tints it from the same state that fills the form. Zoom is `transform: scale()` on an absolutely positioned page inside a sizer whose width and height are set to the scaled size, so the canvas scrolls exactly the right distance.",
  "The connecting line is an SVG overlay drawn from two getBoundingClientRect() reads (the source span and the focused input) joined by a cubic Bézier. Scroll events, resizes and the zoom ease re-measure it through requestAnimationFrame, and `pathLength=1` with `stroke-dashoffset` makes the draw-in independent of how long the curve is.",
  "Output is typed on the way out: each field type has a validator (a date is checked by round-tripping it through `Date`, an IBAN by the mod-97 check digit) and a converter. Invalid values become `null` in the JSON and block Accept all.",
  "The layout switches with a CSS container query (`container: dex / inline-size`) at 760px of the block's own width, so side-by-side and stacked layouts depend on where it sits, not on the window.",
]

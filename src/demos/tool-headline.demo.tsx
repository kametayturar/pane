import * as React from "react"

import { ToolHeadline, type ToolHeadlineStep } from "@/components/ui/tool-headline"

const STEPS: ToolHeadlineStep[] = [
  { name: "Orders", stem: "Look", ing: "ing up", ed: "ed up", object: "the order", result: "Order 8841, shipped May 3" },
  { name: "Carrier", stem: "Check", ing: "ing", ed: "ed", object: "the carrier", result: "Lost in transit since May 9" },
  { name: "Stock", stem: "Count", ing: "ing", ed: "ed", object: "the warehouse", result: "2 in stock, ships tomorrow" },
]

export const notes = [
  "Everything on the card is derived from one number: where the run is (nothing yet, tool 1 running, tool 1 done, tool 2 running … the answer). Each tool is a headline block and a receipt line, both absolutely positioned. A block that is not in use gets `data-s=\"hid\"`, the running one `run`, the finished one `done`, and an earlier one `trail`; the CSS does the rest with transitions, so there is no per-frame JavaScript at all.",
  "The verb conjugates in place because both endings (ing and ed) sit in one grid cell: when the tool finishes, the old ending blurs up and out while the new one settles in, the verb turns from dim to ink, the object turns from accent to dim, and the result line fades in under it. Then the block becomes `trail`: it shrinks to half size and slides to its slot on a damped spring (a `linear()` easing computed from a spring equation) while its receipt fades in at the same spot, so the headline reads as folding into the line.",
  "A headline that is too long for the card steps down instead of being cut: each headline's text is measured once (and again when the card or the font changes) and the block gets a `--tlh-fit` between 0.6 and 1 that scales its font size, so the two lines always share one size. Beyond 60% it ends in an ellipsis.",
  "The stage height is a `calc()` of the headline size and the number of tools, so it is the same from the first frame to the last and the footer never moves. The headline size follows a container query unit, so it is 56px at 520px and about 39px at 360px. When the answer arrives the base line for the receipts changes in one custom property and all of them spring up together.",
  "With no props the card plays the run on a chain of timeouts and loops, pausing off screen and in hidden tabs, and stops for good at the first press, key or focus on the card itself (the rest of the page can be clicked); then Replay appears and plays it once more. Pass `current` and `status` to drive it with real tool events. Reduced motion shows the finished answer with its receipts, and every state is real DOM text, so it reads correctly even if frames never arrive.",
]

export default function Demo() {
  // 0 = nothing yet, 2i+1 = tool i running, 2i+2 = tool i done, 2n+1 = the answer
  const [pos, setPos] = React.useState(0)
  const n = STEPS.length
  const end = 2 * n + 1
  const current = pos === 0 ? -1 : pos >= end ? n : (pos - 1) >> 1
  const status = pos % 2 === 0 ? "done" : "running"
  const line =
    pos === 0
      ? "Waiting for the first tool call"
      : pos >= end
        ? "Answer ready"
        : `${STEPS[current].name}: ${status}`

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 520 }}>
      {/* 1 · Built in: plays the moment and loops until you touch it */}
      <ToolHeadline />

      {/* 2 · Your own tools and data: step through them yourself */}
      <div className="flex flex-col items-start gap-3">
        <ToolHeadline
          agent="Atlas"
          context="Order 8841 is late"
          steps={STEPS}
          answer={{ title: "Reship order", result: "Order 8841 arrives Friday, no charge" }}
          note="Nothing is sent to the customer until you approve"
          current={current}
          status={status}
          onReplay={() => setPos(0)}
        />
        <div className="flex items-center gap-3 px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
          <span aria-live="polite">{line}</span>
          <button
            type="button"
            disabled={pos >= end}
            onClick={() => setPos((v) => Math.min(end, v + 1))}
            className="rounded-md px-2 py-1 underline-offset-2 hover:text-neutral-950 hover:underline disabled:opacity-40 disabled:no-underline disabled:hover:text-inherit dark:hover:text-white"
          >
            Next event
          </button>
        </div>
      </div>
    </div>
  )
}

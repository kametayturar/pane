import * as React from "react"

import { McpServers } from "@/components/blocks/mcp-servers"

export default function Demo() {
  const [budget, setBudget] = React.useState(8000)

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-6 py-4">
      <McpServers budget={budget} />
      <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-neutral-600 dark:text-neutral-300">
        <span>Context budget</span>
        {[8000, 5000, 3000].map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={budget === b}
            onClick={() => setBudget(b)}
            className="rounded-lg px-3 py-1.5 shadow-[0_0_0_1px_rgb(0_0_0/.08)] aria-pressed:bg-neutral-100 aria-pressed:font-medium dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)] dark:aria-pressed:bg-white/10"
          >
            {b / 1000}k tokens
          </button>
        ))}
      </div>
      <p className="text-center text-[12px] text-neutral-400">
        Open a server, flip a tool and watch its segment resize. Add server runs a simulated sign in and tool discovery.
      </p>
    </div>
  )
}

export const notes = [
  "The context bar is one flex row of segments whose `width` is each server's enabled tokens divided by `max(budget, total)`. A `transition: width` makes a toggle resize its segment, and once you pass the budget the same maths rescales the whole bar and paints the overflow amber.",
  "The numbers count up by easing a value toward its target in a `requestAnimationFrame` loop (`cur += (target - cur) * (1 - exp(-dt / tau))`) and writing `textContent` directly through a ref, so React never re-renders per frame. A visually hidden twin holds the final value for screen readers.",
  "Rows open with the grid-rows trick: `grid-template-rows` transitions from `0fr` to `1fr` around an `overflow: clip` child, which animates to the content's natural height without measuring it. A collapsed panel gets the `inert` attribute so its switches leave the tab order.",
  "Add server is a modal sheet inside the card: the page behind gets `inert`, Tab is wrapped at the first and last focusable, Escape closes it, and the connect flow is guarded by a run ticket so an abandoned discovery cannot write into a newer one.",
  "Remove is optimistic with a 6-second undo: the row collapses via `grid-template-rows: 0fr` but stays in state until the timer fires, so Undo (or Cmd/Ctrl+Z) just flips a flag and it opens again in place.",
]

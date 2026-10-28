import * as React from "react"

import { AiSidePanel } from "@/components/blocks/ai-side-panel"

const WIDTHS = [
  { label: "Full", value: "100%" },
  { label: "560", value: "560px" },
  { label: "360", value: "360px" },
] as const

export default function Demo() {
  const [width, setWidth] = React.useState<(typeof WIDTHS)[number]["value"]>("100%")
  const [log, setLog] = React.useState("Nothing applied yet.")

  return (
    <div className="flex w-full flex-col items-center gap-5 py-6">
      <div className="w-full transition-[max-width] duration-300" style={{ maxWidth: width, ["--side-panel-height" as string]: "640px" }}>
        <AiSidePanel
          onApply={(c) => setLog(`onApply: ${c.blockId} changed`)}
          onUndo={(c) => setLog(`onUndo: ${c.blockId} restored`)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
        <span>Container width</span>
        {WIDTHS.map((w) => (
          <button
            key={w.value}
            type="button"
            aria-pressed={width === w.value}
            onClick={() => setWidth(w.value)}
            className="rounded-full px-3 py-1 shadow-[0_0_0_1px_rgb(0_0_0/.08)] aria-pressed:bg-neutral-900 aria-pressed:text-white dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)] dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-900"
          >
            {w.label}
          </button>
        ))}
      </div>
      <p className="text-center text-[12px] text-neutral-400" aria-live="polite">{log}</p>
      <p className="max-w-md text-center text-[12px] text-neutral-400">
        Try "Tighten the intro", review the word diff, apply it and undo it. Select text in the page to send a passage as context.
      </p>
    </div>
  )
}

export const notes = [
  "An edit is data, not prose: the reply carries `{ blockId, after }`, and the panel computes a word diff against the block's current text. The diff trims the shared start and end first, then runs a longest-common-subsequence table over only what is left, so typical edits compare a few dozen words.",
  "The diff uses real `<ins>` and `<del>` elements with visually hidden Added and Removed prefixes, so it reads correctly without colour. Applying swaps the block, remounts its content with a short fade, and plays a one-shot tint sweep.",
  "The tint sweep is an absolutely positioned layer animated with `clip-path: inset(0 100% 0 0)` to `inset(0)` and then an opacity fade. Clipping reveals the colour from the left edge without animating layout.",
  "Selecting text uses the `selectionchange` event and `Range.getBoundingClientRect()` to place the Ask about selection button above the passage. The button prevents default on pointerdown so clicking it does not collapse the selection first.",
  "The dock is a width transition (360px to 0) with the panel inside sliding and fading; the page column is `flex: 1` so it reflows by itself. Below 640px of container width (a ResizeObserver, not the viewport) the same panel becomes an absolutely positioned bottom sheet, and the page behind it is `inert`.",
]

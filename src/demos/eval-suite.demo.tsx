import { EvalSuite } from "@/components/blocks/eval-suite"

export default function Demo() {
  return (
    <div className="flex w-full max-w-[760px] flex-col gap-4 py-4">
      <EvalSuite />
      <p className="text-center text-[12px] text-neutral-400">
        Press Run for a simulated eight-worker run. Open a regression to read both replies side by side.
      </p>
    </div>
  )
}

export const notes = [
  "Every category row is a CSS grid of cells (`grid-template-columns: repeat(24, minmax(0, 22px))`). A result only flips a `data-o` attribute, so the tint is a `background-color` transition and the glyph scales in from 40% with a `transform` transition; there is no per-cell animation code. Cases in flight breathe with one keyframe.",
  "The score, cost and category percentages are numbers that ease toward their target in a `requestAnimationFrame` loop and write `textContent` through a ref, so a burst of streamed results reads as one smooth count and React never re-renders per frame. A visually hidden twin carries the final value for screen readers.",
  "Results stream in through an `AsyncIterable` (`for await`): the host yields each graded case as it finishes and Stop aborts an `AbortController`. Without `onRun` the same state machine is fed by eight timer-driven workers, which is why the demo behaves exactly like the real thing.",
  "Regressions and fixes are derived, not stored: a regression is a case whose baseline outcome was pass and whose new outcome is not, so the filters, counts and the legend all come from one results map. The side by side reply uses a word-level LCS diff, and falls back to plain text when the replies share less than a third of their words.",
  "The list height follows the filter because a `ResizeObserver` copies the inner height onto an outer element that has `transition: height`. The filter thumb glides the same way: it is measured from the active button's `offsetLeft` and `offsetWidth` and moved with `transform`.",
]

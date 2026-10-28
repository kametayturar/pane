import * as React from "react"

import { AgentMemory, type MemoryChange } from "@/components/blocks/agent-memory"

export default function Demo() {
  const [last, setLast] = React.useState<MemoryChange | null>(null)
  return (
    <div className="flex w-full max-w-[640px] flex-col gap-4 py-4">
      <AgentMemory onChange={(_, change) => setLast(change)} />
      <p aria-live="polite" className="min-h-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {last ? `onChange: ${last.type}, “${last.memory.text.slice(0, 48)}${last.memory.text.length > 48 ? "…" : ""}”` : "Press the Memory updated pill, add, edit or forget a memory"}
      </p>
    </div>
  )
}

export const notes = [
  "Filtering never unmounts anything: each group sits in a `display: grid` wrapper whose `grid-template-rows` goes from `1fr` to `0fr`, so groups fold shut smoothly (the same trick hides rows that don't match a search). Hidden groups and rows get `inert`, which also removes them from the tab order and the accessibility tree.",
  "The active filter pill's background is one absolutely positioned element. A layout effect reads the selected button's `offsetLeft` and `offsetWidth` and the CSS transitions `transform` and `width` between them, so it slides and resizes to the new label.",
  "Forget is optimistic with a grace period: the row swaps for an undo bar whose progress line is a `scaleX(1 → 0)` CSS animation with the undo time as its duration, while a timer holds the real removal. Only when the timer fires does `onChange` report the forget; Undo just cancels the timer.",
  "Edits and adds await `onChange` before touching state, so a rejected promise leaves the list as it was and shows the error where the user is typing. Focus is moved by recording the wanted element in a ref and calling `.focus()` in an effect after the re-render that creates it.",
  "The list's top and bottom fades are overlay pseudo-elements shown by `data-top` and `data-bottom` flags that a scroll handler and a ResizeObserver keep current, instead of a CSS mask (which can repaint badly on scrolling containers).",
]

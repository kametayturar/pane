import * as React from "react"

import { Kbd, TipsPanel, type Tip } from "@/components/ui/tips-panel"

const TIPS: Tip[] = [
  {
    id: "agent",
    title: "Create your first agent",
    description: "Give it a goal and a few tools, then let it work in the background while you do something else.",
    action: "New agent",
    doneLabel: "Agent created",
    featured: true,
    primary: true,
  },
  {
    id: "search",
    title: "Command palette",
    description: (
      <>
        Press <Kbd>⌘K</Kbd> to run any action or find a past conversation.
      </>
    ),
    action: "Try it",
  },
  {
    id: "sources",
    title: "Connect sources",
    description: "Link Drive, Notion or GitHub so answers can cite your own docs.",
    action: "Connect",
    doneLabel: "Connected",
  },
]

export default function Demo() {
  const [open, setOpen] = React.useState(true)
  return (
    <div className="w-full max-w-[760px]">
      {open ? (
        <TipsPanel tips={TIPS} onClose={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md px-3 py-1.5 text-[13px] font-medium text-neutral-800 dark:text-neutral-100 shadow-[0_0_0_.5px_rgb(0_0_0/.1),0_1px_2px_rgb(0_0_0/.06)]"
        >
          Show tips again
        </button>
      )}
    </div>
  )
}

export const notes = [
  "The column count comes from the grid itself: `repeat(auto-fit, minmax(min(100%, 200px), 1fr))` fits as many 200px+ columns as the panel's own width allows, so it adapts to the space it is given, wherever it is placed.",
  "One tip can be `featured`: it spans the row (`grid-column: 1 / -1`) with a larger title. Rows are an auto-fit grid with `align-items` left at its default (stretch), so cards in one row are the same height; `margin-top: auto` on each card's last child pins the buttons to the bottom edge.",
  "The list scrolls inside `max-height: var(--tp-max-height)` – a CSS custom property you override from outside – so the header and footer stay put while the grid scrolls.",
  "Each card fades up with one shared `@keyframes` and a per-card `animation-delay` (80ms + 50ms × index) set inline. `animation-fill-mode: backwards` keeps cards hidden during their delay without leaving a filled animation behind.",
  "A taken tip swaps its button for a status element that plays a scale-and-fade 'pop'; the counter is an `aria-live=\"polite\"` region, so screen readers hear 'N/3 done' without focus moving.",
]

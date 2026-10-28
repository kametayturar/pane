import * as React from "react"

import { Kbd, TipsPanel, type Tip } from "@/components/ui/tips-panel"

const TIPS: Tip[] = [
  {
    id: "agent",
    title: "Create an agent",
    description: "Give it a goal and a few tools, then let it work in the background.",
    action: "New agent",
    doneLabel: "Agent created",
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
    id: "memory",
    title: "Memory",
    description: "Let the assistant remember your style, projects and preferences.",
    action: "Turn on",
    doneLabel: "Memory on",
  },
  {
    id: "sources",
    title: "Connect sources",
    description: "Link Drive, Notion or GitHub so answers can cite your own docs.",
    action: "Connect",
    doneLabel: "Connected",
  },
  {
    id: "share",
    title: "Share a chat",
    description: "Send a read-only link so a teammate can follow the reasoning.",
    action: "Copy link",
    doneLabel: "Link copied",
  },
  {
    id: "pro",
    title: "Need more headroom?",
    description: "Longer context, faster models and priority during busy hours.",
    action: "See plans",
    primary: true,
  },
  {
    id: "voice",
    title: "Voice mode",
    description: "Talk instead of typing – handy on the go.",
    action: "Try voice",
  },
  {
    id: "export",
    title: "Export history",
    description: "Download every conversation as Markdown.",
    action: "Export",
    doneLabel: "Export started",
  },
  {
    id: "keys",
    title: "API keys",
    description: "Call your agents from scripts and other apps.",
    action: "Create key",
    doneLabel: "Key created",
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
          className="rounded-md px-3 py-1.5 text-[13px] font-medium shadow-[0_0_0_.5px_rgb(0_0_0/.1),0_1px_2px_rgb(0_0_0/.06)]"
        >
          Show tips again
        </button>
      )}
    </div>
  )
}

export const notes = [
  "The column count comes from a container query, not a media query: the scrolling body has `container-type: inline-size`, and `@container (max-width: 560px)` swaps the grid to two columns, then one. The panel adapts to the space it is given, wherever it is placed.",
  "Rows are `repeat(3, minmax(0, 1fr))` with `align-items` left at its default (stretch), so cards in one row are the same height; `margin-top: auto` on each card's last child pins the buttons to the bottom edge.",
  "The list scrolls inside `max-height: var(--tp-max-height)` – a CSS custom property you override from outside – so the header and footer stay put while the grid scrolls.",
  "Each card fades up with one shared `@keyframes` and a per-card `animation-delay` (80ms + 50ms × index) set inline. `animation-fill-mode: backwards` keeps cards hidden during their delay without leaving a filled animation behind.",
  "A taken tip swaps its button for a status element that plays a scale-and-fade 'pop'; the counter is an `aria-live=\"polite\"` region, so screen readers hear 'N/9 done' without focus moving.",
]

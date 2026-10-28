import * as React from "react"
import { Bot, CalendarDays, Mail, MessageSquare, Notebook, Settings, Terminal, Trash2, Workflow } from "lucide-react"

import { Dock, type DockItem } from "@/components/ui/dock"

export const notes = [
  "Magnification is one rAF loop, not React state. Each frame measures every tile's distance to the pointer, feeds it through a cosine bell curve for a target scale, and a per-tile spring (stiffness 430, damping 31) chases that target. Writes go straight to `transform` on refs, so the tree never re-renders while you move the mouse.",
  "Tiles swell upward from `transform-origin: 50% 100%`, but a scaled element does not push its neighbours. The loop re-computes the whole row from the scaled widths and sets a `translate3d` on every slot, and also widens the glass bar, which is what makes the dock grow sideways like macOS.",
  "Each tile is drawn at its largest size and scaled down at rest, so glyphs stay sharp when they swell instead of blurring from a small raster. The running dot lives outside the scaled button, so it keeps its size.",
  "The launch bounce is a CSS keyframe hop on an inner span (a separate element from the scaled button, so the two transforms never fight) that repeats until the launch timer fires and the dot appears.",
  "The label is a single element whose wrapper is moved by the same loop, easing toward the active tile's centre; it stays `warm` for a moment after leaving so the next tile's label shows with no delay. Keyboard focus feeds the loop a virtual pointer at the focused tile, and only `:focus-visible` shows a label.",
]

const ITEMS: DockItem[] = [
  { id: "assistant", label: "Assistant", icon: <Bot />, tint: "oklch(0.58 0.2 262)", shortcut: "A" },
  { id: "threads", label: "Threads", icon: <MessageSquare />, tint: "oklch(0.64 0.17 150)", badge: 2 },
  { id: "runs", label: "Runs", icon: <Workflow />, tint: "oklch(0.62 0.19 300)", shortcut: "R" },
  { id: "notes", label: "Notes", icon: <Notebook />, tint: "oklch(0.74 0.16 80)" },
  { id: "inbox", label: "Inbox", icon: <Mail />, tint: "oklch(0.6 0.19 25)", badge: 5 },
  { id: "calendar", label: "Calendar", icon: <CalendarDays />, tint: "oklch(0.66 0.18 40)" },
  { id: "terminal", label: "Terminal", icon: <Terminal />, tint: "oklch(0.32 0.01 260)", shortcut: "T" },
  { id: "settings", label: "Settings", icon: <Settings />, tint: "oklch(0.55 0.03 250)", separator: true },
  { id: "trash", label: "Trash", icon: <Trash2 />, tint: "oklch(0.7 0.02 250)" },
]

export default function Demo() {
  const [last, setLast] = React.useState("Hover the dock, then click a tile to launch it.")
  return (
    <div className="flex w-full max-w-[760px] flex-col items-center gap-8">
      <div
        className="flex w-full flex-col items-center justify-end rounded-3xl px-3 pb-6 pt-10"
        style={{ minHeight: 300, background: "linear-gradient(160deg, color-mix(in oklab, #7aa7ff 24%, transparent), color-mix(in oklab, #c79bff 20%, transparent) 55%, color-mix(in oklab, #ffb48a 22%, transparent))" }}
      >
        <Dock
          items={ITEMS}
          defaultRunning={["assistant", "inbox"]}
          onSelect={(id) => setLast(`Selected ${id}`)}
          label="Workspace apps"
        />
      </div>
      <p className="text-[13px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {last}
      </p>
    </div>
  )
}

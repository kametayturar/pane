import * as React from "react"
import { ChevronDown, Copy, Download, FolderInput, Heart, Link2, Trash2 } from "lucide-react"

import { GlassMenu } from "@/components/ui/glass-menu"
import { Scene } from "./_glass-scenes"

export const notes = [
  "One element is both the trigger's glass and the panel's glass. Its width and height are two damped springs stepped in a requestAnimationFrame loop and written to `style`, so the morph costs no React renders; the rows are fixed-width content inside, clipped by the growing box, so text is revealed rather than scaled.",
  "Rows fade and sharpen (opacity + `blur(3px)` filter) a beat after the glass starts to grow, via a transition-delay, so text never shows outside the glass. The same delay is dropped on close so the rows leave first.",
  "The highlight pill is one absolutely positioned element. A layout effect reads the active row's rect relative to its container and sets a `translateY` and a height; a CSS transition on `transform` makes it glide, and it is placed with transitions off the first time it appears.",
  "The submenu is a second absolutely positioned view. Both views slide with `transform` while the shell height springs to the active view's measured `offsetHeight`, so the panel resizes in place instead of flying out to the side.",
  "The glass is `backdrop-filter: blur(24px) saturate(1.7)` plus an inset top highlight, a sheen gradient and a ::before ring cut with `mask-composite: exclude`. Keyboard: roving focus on the rows, typeahead from a 600ms buffer, and a pointerdown listener on the document closes it without stealing focus.",
]

export default function Demo() {
  const [favorite, setFavorite] = React.useState(false)
  const [captions, setCaptions] = React.useState(true)
  const [log, setLog] = React.useState("Pick an action")

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-3">
      <div className="relative h-[420px] overflow-hidden rounded-[30px] bg-neutral-200">
        <Scene tone="tram" seed={4} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        <div className="absolute left-4 top-4">
          <GlassMenu
            label="Photo actions"
            onSelect={(id, item) => {
              if (id === "fav") setFavorite((v) => !v)
              if (id === "captions") setCaptions((v) => !v)
              setLog(`Chose “${item.label}”`)
            }}
            groups={[
              {
                id: "main",
                items: [
                  { id: "fav", label: favorite ? "Remove favorite" : "Favorite", icon: <Heart />, shortcut: "F", keepOpen: true },
                  { id: "link", label: "Copy link", icon: <Link2 />, shortcut: "⌘L" },
                  { id: "dup", label: "Duplicate", icon: <Copy />, shortcut: "⌘D" },
                ],
              },
              {
                id: "organize",
                items: [
                  {
                    id: "move",
                    label: "Move to",
                    icon: <FolderInput />,
                    items: [
                      { id: "m1", label: "Lisbon trip" },
                      { id: "m2", label: "Tram line 28" },
                      { id: "m3", label: "Archive" },
                      { id: "m4", label: "Shared with Ana", disabled: true },
                    ],
                  },
                  { id: "dl", label: "Download", icon: <Download />, shortcut: "⇧⌘S" },
                  { id: "captions", label: "Show captions", checked: captions, keepOpen: true },
                ],
              },
              { id: "danger", items: [{ id: "del", label: "Delete", icon: <Trash2 />, danger: true, shortcut: "⌫" }] },
            ]}
          >
            Old town tram <ChevronDown />
          </GlassMenu>
        </div>
        <div className="absolute right-4 top-4">
          <GlassMenu
            align="end"
            width={220}
            label="Sort"
            triggerLabel="Sort order"
            onSelect={(_, item) => setLog(`Sorted by ${item.label.toLowerCase()}`)}
            groups={[{ id: "s", label: "Sort by", items: [{ id: "a", label: "Newest" }, { id: "b", label: "Oldest" }, { id: "c", label: "Most liked" }] }]}
          >
            Sort <ChevronDown />
          </GlassMenu>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/30 to-transparent p-5 text-[13px] text-white">
          <span>{log}</span>
          <span className="opacity-80">{favorite ? "Favorited" : "Not favorited"}{captions ? " · captions on" : ""}</span>
        </div>
      </div>
      <p className="px-1 text-[12px] text-neutral-500 dark:text-neutral-400">Open with click, Enter or ↓. Arrow keys, Home/End, → for the submenu, letters to jump, Esc to leave.</p>
    </div>
  )
}

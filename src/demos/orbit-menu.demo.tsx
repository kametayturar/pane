import * as React from "react"
import { Download, FolderPlus, Heart, Link2, Pin, RotateCcw, Share2, Trash2 } from "lucide-react"

import { OrbitMenu } from "@/components/ui/orbit-menu"

export const notes = [
  "The arc is trigonometry: action k sits at `direction - spread/2 + k * spread/(n-1)` degrees, at `radius` px from the trigger. Opening animates each action's polar coordinates (radius from 0, angle swept in from 38 degrees behind) with a small per-action spring, staggered 30ms in reading order and reversed when it folds.",
  "Targeting is a pie menu, not a hit test: the pointer's angle around the trigger (`atan2`) picks the nearest action once it is past a 34px dead zone, so you only have to head toward an action. Outside the arc's angular sector while dragging you get 'Release to cancel'.",
  "Press-drag-release and tap-to-keep-open are one state machine on pointer events: pointerdown opens and captures the pointer, releasing over a target fires, a quick tap (under 320ms, no drag) leaves the arc open for hover and click, and a long hold or an off-arc release folds it shut.",
  "One rAF loop moves everything: the dark lens glides between targeted actions on its own spring, and nearby actions get a 'magnet' offset of up to 10px toward the pointer. All of it is written as `translate3d` + `scale` on refs, so hovering does not re-render React.",
  "The label pill sizes itself by measuring its text in a hidden twin and writing `width` straight to the element, with an overshooting cubic-bezier doing the spring. The closed menu is `inert`, so hidden actions are out of the tab order and the accessibility tree.",
]

export default function Demo() {
  const [log, setLog] = React.useState<string[]>([])
  const [liked, setLiked] = React.useState(false)
  const push = (m: string) => setLog((l) => [m, ...l].slice(0, 3))
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-6">
      <div className="relative flex w-full flex-col items-center rounded-3xl bg-neutral-500/[0.05] px-4 pb-8 pt-4">
        <div className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-white shadow-[0_0_0_.5px_rgb(0_0_0/.08),0_8px_24px_rgb(0_0_0/.06)] dark:bg-neutral-900 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.12)]">
          <div
            className="aspect-[16/10] w-full"
            style={{ background: "radial-gradient(circle at 70% 25%, #ffd9a0 0 8%, transparent 9%), linear-gradient(180deg, #8fb4e8 0%, #cfe0f5 55%, #7e9a7a 55%, #4f6b52 100%)" }}
            aria-hidden="true"
          />
          <div className="px-4 py-3">
            <div className="text-[15px] font-medium text-neutral-900 dark:text-neutral-50">Lake house at dusk</div>
            <div className="text-[12px] text-neutral-500">Ravi Menon · Trip to Tahoe</div>
            <div className="mt-1 text-[12px] text-neutral-400">{liked ? "129 likes" : "128 likes"}, not in an album</div>
          </div>
        </div>
        <div className="mt-6">
          <OrbitMenu
            label="Photo actions"
            actions={[
              { id: "like", label: "Like", icon: <Heart />, done: "Liked" },
              { id: "album", label: "Add to album", icon: <FolderPlus />, done: "Added" },
              { id: "share", label: "Share link", icon: <Share2 />, done: "Link copied" },
              { id: "save", label: "Download", icon: <Download />, done: "Saved" },
              { id: "delete", label: "Delete", icon: <Trash2 />, tone: "danger", done: "Moved to trash" },
            ]}
            onAction={(id) => {
              if (id === "like") setLiked(true)
              push(`Fired ${id}`)
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setLiked(false)
            setLog([])
          }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-neutral-500 hover:bg-neutral-500/10"
        >
          <RotateCcw size={14} /> Reset photo
        </button>
        <p className="mt-3 max-w-[300px] text-center text-[12px] text-neutral-500">
          Press the button and drag to an action, or click it to keep the actions open.
        </p>
        <p className="mt-2 min-h-5 text-[12px] text-neutral-400" aria-live="polite">
          {log.join(" · ")}
        </p>
      </div>
      <div className="flex w-full items-center justify-center gap-16 rounded-3xl bg-neutral-500/[0.05] py-10">
        <OrbitMenu
          label="Note actions"
          direction={0}
          spread={110}
          radius={84}
          actions={[
            { id: "pin", label: "Pin", icon: <Pin />, done: "Pinned" },
            { id: "link", label: "Copy link", icon: <Link2 />, done: "Copied" },
            { id: "del", label: "Delete", icon: <Trash2 />, tone: "danger" },
          ]}
          onAction={(id) => push(`Note: ${id}`)}
        />
        <span className="text-[12px] text-neutral-500">direction 0, radius 84</span>
      </div>
    </div>
  )
}

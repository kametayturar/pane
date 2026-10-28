import * as React from "react"

import { AiChat } from "@/components/blocks/ai-chat"

const WIDTHS = [
  { label: "Full", value: "100%" },
  { label: "520", value: "520px" },
  { label: "340", value: "340px" },
] as const

export default function Demo() {
  const [width, setWidth] = React.useState<(typeof WIDTHS)[number]["value"]>("100%")
  const [run, setRun] = React.useState(0)

  return (
    <div className="flex w-full flex-col items-center gap-5 py-6">
      <div className="w-full transition-[max-width] duration-300" style={{ maxWidth: width, ["--chat-height" as string]: "720px" }}>
        <AiChat key={run} />
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
        <button type="button" onClick={() => setRun((n) => n + 1)} className="rounded-full px-3 py-1 shadow-[0_0_0_1px_rgb(0_0_0/.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/.12)]">
          Replay
        </button>
      </div>
      <p className="max-w-md text-center text-[12px] text-neutral-400">
        It plays a two turn conversation by itself. Open the title menu for earlier chats, hover a message for copy, edit and retry, or type a message containing "fail" to see the error state.
      </p>
    </div>
  )
}

export const notes = [
  "The conversation is a tree, not a list: each turn holds `versions`, each version holds its own reply and a pointer to the next turn. Edit and Retry append a version, and the visible thread is found by walking the `active` version of each turn, so later messages belong to the version they followed.",
  "Streaming markdown is parsed from scratch on every 34 ms tick by a small linear parser that returns offsets into the source string. Each text run is then cut at the offsets where the newest chunks started, and only those slices get a one-shot 150 ms opacity fade, so older text never re-animates.",
  "Folding sections (reasoning, tool details) use `grid-template-rows: 0fr` to `1fr`, which lets CSS animate to the content's natural height without measuring it. The folded content is `inert` so it leaves the tab order.",
  "The thread sticks to the bottom only while you are within 80px of it. Scrolling up releases the lock and shows a Jump to latest button; switching chats stores and restores each chat's `scrollTop`.",
  "Header labels (title, model) swap by changing the `key` of the label element, which remounts it so a short CSS fade-in from 2px replays, with no animation library.",
]

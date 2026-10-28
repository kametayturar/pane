import * as React from "react"

import { ReactionBar, type ReactionKey } from "@/components/ui/reaction-bar"

export const notes: string[] = [
  "Each count is split into one `<span>` per digit, keyed by its position from the right plus the character. When a number changes, only the digits whose key changed remount – and a remount restarts the CSS `animation`, so just those digits roll in (opacity + `translateY(70%)`). 129 → 130 moves two digits; 127 → 128 moves one.",
  "The count box's width glides: a ResizeObserver measures the digit row and writes its `borderBoxSize.inlineSize` into an inline `width`, while CSS `transition: width .4s` animates between the two pixel values (CSS can't transition to `auto`). The transition is only switched on after the first measurement so nothing animates on load.",
  "The icon pop is a keyframe animation (`scale` 1 → .75 → 1.12 → 1) that runs on a freshly keyed icon element every time the button turns on. The fill is just `fill: currentColor` on the path, so it follows the accent color for free.",
  "Every action is a real toggle button: `aria-pressed` carries on/off and `aria-label` carries the label with its count (\"Like, 129 likes\"), while the rolling digits are `aria-hidden` because they are decoration.",
  "`onReact` is called with the new count and state, so the component stays optimistic: it updates instantly and you decide whether to send the change to the server.",
]

export default function Demo() {
  const [log, setLog] = React.useState("Tap a reaction")

  const react = (key: ReactionKey, state: { count?: number; active: boolean }) =>
    setLog(`${key} → ${state.active ? "on" : "off"}${state.count !== undefined ? `, count ${state.count}` : ""}`)

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      <article className="rounded-xl bg-white p-4 text-[13px] shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_2px_rgb(0_0_0/.05)] dark:bg-[#1c1c1e] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1)]">
        <p className="font-medium text-neutral-900 dark:text-neutral-100">Eval results for the support agent</p>
        <p className="mt-1 mb-3 text-neutral-500 dark:text-neutral-400">
          v14 resolves 91% of tickets without a handoff, up from 84%. Biggest gain is in billing questions.
        </p>
        <ReactionBar reactions={{ like: { count: 41 }, comment: { count: 8 }, repost: { count: 3, active: true } }} onReact={react} />
      </article>
      <p className="text-center text-[12px] text-neutral-400" aria-live="polite">
        {log}
      </p>
    </div>
  )
}

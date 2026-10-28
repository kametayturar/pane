import * as React from "react"

import { BlurCrossfade } from "@/components/motion/blur-crossfade"
import type { StudioProps } from "@/components/motion/backdrop"

const STEPS = [
  {
    kicker: "Step 1 of 3",
    title: "Draft the release notes",
    body: "Nova summarised 14 merged pull requests into a short changelog for v2.8.",
  },
  {
    kicker: "Step 2 of 3",
    title: "Review what changed",
    body: "Three items need a human look before anything goes out.",
    list: ["Faster search indexing (api/search)", "New billing export, CSV and JSON", "Renamed the Workspaces tab to Teams"],
  },
  {
    kicker: "Step 3 of 3",
    title: "Ready to publish",
    body: "Everything is checked. Publishing sends the notes to the changelog page, the in-app banner and 2,140 subscribers.",
    list: ["Changelog page updated", "In-app banner scheduled for 9:00", "Email digest queued", "Slack announcement drafted"],
  },
]

const btn =
  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 " +
  "shadow-[0_0_0_.5px_rgb(0_0_0/.15)] hover:bg-black/5 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.2)] dark:hover:bg-white/10"

export default function Demo(props: StudioProps) {
  const [i, setI] = React.useState(0)
  const step = STEPS[i]

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-5 text-[13px] leading-5 text-black/85 shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_1px_-1px_rgb(0_0_0/.1),0_1px_2px_0_rgb(0_0_0/.05)] dark:bg-[#1c1c1e] dark:text-white/90 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1),0_1px_2px_0_rgb(0_0_0/.4)]">
      <BlurCrossfade contentKey={i} {...props}>
        <p className="text-xs text-black/45 dark:text-white/46">{step.kicker}</p>
        <h3 className="mt-1 text-base font-semibold tracking-tight">{step.title}</h3>
        <p className="mt-1.5 text-black/60 dark:text-white/62">{step.body}</p>
        {step.list && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {step.list.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-black/25 dark:bg-white/30" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </BlurCrossfade>
      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((_, n) => (
            <span
              key={n}
              className={"h-1.5 rounded-full transition-all duration-300 " + (n === i ? "w-4 bg-black/70 dark:bg-white/80" : "w-1.5 bg-black/15 dark:bg-white/20")}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className={btn} disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>
            Back
          </button>
          <button type="button" className={btn} disabled={i === STEPS.length - 1} onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export const notes = [
  "CSS can't transition `height: auto`, so a ResizeObserver measures the incoming content and copies its pixel size onto the outer box; a normal `transition: height` then glides between two numbers.",
  "The swap is two keyframe animations on `opacity`, `filter: blur()` and a tiny `scale`: the old content is kept in a snapshot layer (position: absolute) and removed on `animationend`, the new one fades in 0.1s later.",
  "State is adjusted during render (`if (cur.key !== contentKey) setLeaving(...)`) instead of in an effect, so the outgoing node is captured in the very render that swaps it.",
  "`overflow: clip` with `overflow-clip-margin` keeps the shrinking box from showing overflow while leaving room for the blur halo.",
  "Speed is a CSS variable (`calc(.46s / var(--bx-speed))`) and pause is `animation-play-state: paused`, so neither restarts the scene.",
]

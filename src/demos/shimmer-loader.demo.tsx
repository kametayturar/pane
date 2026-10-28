import * as React from "react"

import { ShimmerLoader, ShimmerText } from "@/components/motion/shimmer-loader"
import type { StudioProps } from "@/components/motion/backdrop"

const STATS = [
  { value: "128", label: "Tickets" },
  { value: "94%", label: "Resolved" },
  { value: "2.4m", label: "Avg. reply" },
]

export default function Demo({ speed = 1, paused, accent }: StudioProps) {
  const [loading, setLoading] = React.useState(true)

  // The fake "model" finishes after a few seconds; the timer is cleared if the card reloads or unmounts.
  React.useEffect(() => {
    if (!loading || paused) return
    const id = window.setTimeout(() => setLoading(false), 3200 / Math.max(0.05, speed))
    return () => window.clearTimeout(id)
  }, [loading, paused, speed])

  return (
    <div className="flex w-full max-w-[340px] flex-col gap-3 p-4">
      <div className="flex h-7 items-center justify-between text-sm font-medium">
        {loading ? (
          <ShimmerText speed={speed} paused={paused}>
            Generating summary…
          </ShimmerText>
        ) : (
          <span className="text-neutral-400 dark:text-neutral-500">Summary ready</span>
        )}
        <button
          type="button"
          onClick={() => setLoading(true)}
          disabled={loading}
          className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 shadow-[0_0_0_.5px_rgb(0_0_0/.12),0_1px_2px_rgb(0_0_0/.05)] transition-opacity hover:bg-neutral-50 disabled:opacity-50 dark:bg-[#1c1c1e] dark:text-neutral-100 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.14)] dark:hover:bg-[#232326]"
        >
          Reload
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/.06),0_0_0_.5px_rgb(0_0_0/.06)] dark:bg-[#1c1c1e] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1)]">
        <ShimmerLoader loading={loading} speed={speed} paused={paused} accent={accent}>
          <div className="grid gap-3.5 text-[13px] leading-5 text-neutral-900 dark:text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-9 flex-none place-items-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
                W
              </span>
              <div className="min-w-0">
                <div className="font-medium">Weekly support digest</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Summarised just now</div>
              </div>
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">
              Refund questions fell by a third after the new help article went live. Shipping delays remain the top theme.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-[10px] bg-black/[.04] px-2.5 py-2 dark:bg-white/[.06]">
                  <div className="text-[15px] font-semibold leading-5 tabular-nums">{s.value}</div>
                  <div className="text-[11px] leading-4 text-neutral-500 dark:text-neutral-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </ShimmerLoader>
      </div>
    </div>
  )
}

export const notes = [
  "All skeleton blocks share one sweep because their gradient uses `background-attachment: fixed`: it is pinned to the viewport, so every block shows the slice of the same moving band that lies under it instead of animating on its own.",
  "The sweep animates `background-position` on a `linear-gradient` that is 150vw wide; the keyframes run from -50vw to 100vw, so the band enters and leaves the screen once per loop.",
  "Skeleton and real content sit in the same CSS grid cell (`grid-area: 1 / 1`), so the box is as large as the bigger of the two and swapping them never shifts the layout.",
  "The crossfade is plain opacity + a 3px `filter: blur()` + a 4px translate with a delayed start for the content; the skeleton stays mounted until the transition is done, then is removed.",
  "While loading the real content is `inert` and `aria-hidden`, and the root has `aria-busy`, so keyboard and screen-reader users don't land on hidden content.",
]

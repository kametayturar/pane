import * as React from "react"

import { DateReel } from "@/components/ui/date-reel"

export const notes = [
  "Each column is a cylinder drawn in 2D. For a row at distance d rows from the centre the angle is θ = d × 0.3 rad; its y is R·sin θ (so rows bunch up toward the edges), it is squashed with scaleY(cos θ) and faded with cos θ^2.1. That is all a 'curved drum' is: three numbers and one transform per row.",
  "Only 11 DOM nodes per reel are recycled for any number of entries (a day reel can hold 400). Node i mod 11 always shows entry i, so text is written only when an entry scrolls into view, and every frame only writes transform and opacity – React re-renders only when a value is committed at rest.",
  "The crisp selected text is a second copy of the same rows inside a 36px window with overflow: hidden at the lens position, in a heavier weight and colour. A mask-image gradient fades the top and bottom of the stage.",
  "Physics is hand-rolled. Dragging maps pixels to rows (beyond either end of a bounded reel the overshoot goes through a saturating curve c·(1 − e^(−x/c)) for a rubber band). On release an exponential glide is solved to land exactly on an entry – k = v / distance – and when half a row is left a critically damped spring (an exact exponential step, so it is frame-rate independent) takes over. Keys, taps, the wheel and quick picks all use that same spring.",
  "Hours, minutes, months and AM/PM are cyclic (index mod n); days and years are bounded. A value changed from outside spins each reel the short way round by wrapping the index difference into (−n/2, n/2]. The loop sleeps when everything is at rest, when the picker leaves the viewport (IntersectionObserver) or the tab is hidden.",
]

const demoToday = new Date(2026, 8, 24)

export default function Demo() {
  const [sent, setSent] = React.useState<string | null>(null)
  const attempts = React.useRef(0)

  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col items-center gap-8 px-4 py-6">
      <DateReel
        title="Send later"
        today={demoToday}
        defaultValue={new Date(2026, 8, 25, 9, 0)}
        onConfirm={async (d) => {
          await new Promise((r) => setTimeout(r, 900))
          attempts.current += 1
          if (attempts.current % 3 === 0) throw new Error("offline")
          setSent(d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))
        }}
      />
      <p className="h-5 text-[13px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {sent ? `Scheduled for ${sent}.` : "Flick a reel, press the arrow keys, or pick a quick option."}
      </p>
      <div className="grid w-full gap-6 md:grid-cols-2">
        <DateReel mode="date" title="Birthday" today={demoToday} defaultValue={new Date(1994, 1, 27)} presets={false} intro={false} label="Birthday" />
        <DateReel mode="time" title="Standup reminder" today={demoToday} defaultValue={new Date(2026, 8, 24, 9, 45)} hourCycle={24} minuteStep={15} presets={false} intro={false} label="Reminder time" />
      </div>
    </div>
  )
}

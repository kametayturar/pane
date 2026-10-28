import * as React from "react"
import { BookOpen, PenLine, RotateCcw, Timer } from "lucide-react"

import { ActivityRings, type ActivityDay, type ActivityMetric } from "@/components/ui/activity-rings"

export const notes = [
  "Each ring is a set of short <line> ticks laid out with sin/cos (56, 44 and 32 of them – a multiple of 4 so one always sits at 12 o'clock). The coloured copy of the ticks is clipped by an SVG <mask> holding a single thick circle whose stroke-dasharray is \"fraction 1\" with pathLength=\"1\" – so a ring is filled to any fraction without computing arcs, and a tick can be revealed half-way.",
  "Past 100% a second circle, drawn just inside the ticks, traces the extra lap with the same pathLength trick, and a small ink marker (rotated with a transform attribute) rides the head of the arc.",
  "There is no animation loop between changes. When the day or the values change, one requestAnimationFrame tween starts from the value currently on screen toward the new ratio (ease-out-quart, staggered per ring), so changing twice quickly redirects mid-flight instead of snapping. The loop writes dasharrays and textContent straight into the DOM – React never re-renders per frame.",
  "The numbers count because the same tween drives text: the legend reads round(ratio × goal) and the centre shows the mean of the capped ratios, or the single ring's percentage when a goal is isolated from the legend.",
  "The week picker is a radiogroup with a roving tabindex (arrow keys, Home/End). The highlight is one element moved with translateX(calc(var(--i) × (100% + 2px))); the mini rings animate with a CSS transition on stroke-dasharray. A container query moves the legend beside the rings from 30rem.",
]

const METRICS: ActivityMetric[] = [
  { id: "focus", label: "Deep work", unit: "min", goal: 180 },
  { id: "words", label: "Writing", unit: "words", goal: 1200 },
  { id: "pages", label: "Reading", unit: "pages", goal: 40 },
]

const WEEK: ActivityDay[] = [
  { id: "mon", label: "Monday, September 14", short: "Mon", values: { focus: 190, words: 1260, pages: 41 } },
  { id: "tue", label: "Tuesday, September 15", short: "Tue", values: { focus: 95, words: 600, pages: 40 } },
  { id: "wed", label: "Wednesday, September 16", short: "Wed", values: { focus: 220, words: 1310, pages: 36 } },
  { id: "thu", label: "Thursday, September 17", short: "Thu", values: { focus: 180, words: 1200, pages: 46 } },
  { id: "fri", label: "Friday, September 18", short: "Fri", values: { focus: 60, words: 480, pages: 14 } },
  { id: "sat", label: "Saturday, September 19", short: "Sat", values: { focus: 40, words: 150, pages: 25 } },
  { id: "sun", label: "Sunday, September 20", short: "Sun", values: { focus: 130, words: 940, pages: 22 } },
]

const chip =
  "inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-neutral-800 shadow-[0_1px_2px_rgb(0_0_0/.04)] transition active:scale-[.97] dark:border-white/15 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10 hover:bg-neutral-50"

export default function Demo() {
  const [days, setDays] = React.useState(WEEK)
  const [day, setDay] = React.useState("sun")
  const [closed, setClosed] = React.useState<string | null>(null)

  const add = (metric: string, amount: number) =>
    setDays((all) => all.map((d) => (d.id === day ? { ...d, values: { ...d.values, [metric]: d.values[metric] + amount } } : d)))

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-6">
      <div className="rounded-[28px] border border-black/[.07] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/.04)] dark:border-white/10 dark:bg-neutral-900 sm:p-7">
        <ActivityRings
          metrics={METRICS}
          days={days}
          day={day}
          onDayChange={setDay}
          onRingClose={(m) => setClosed(METRICS.find((x) => x.id === m)?.label ?? m)}
          label="Daily goals"
        />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" className={chip} onClick={() => add("focus", 25)}>
            <Timer className="size-4" /> 25 min
          </button>
          <button type="button" className={chip} onClick={() => add("words", 250)}>
            <PenLine className="size-4" /> 250 words
          </button>
          <button type="button" className={chip} onClick={() => add("pages", 10)}>
            <BookOpen className="size-4" /> 10 pages
          </button>
          <button
            type="button"
            aria-label="Reset"
            className="ml-auto grid size-10 place-items-center rounded-full text-neutral-400 transition hover:bg-black/5 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-neutral-200"
            onClick={() => {
              setDays(WEEK)
              setClosed(null)
            }}
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
        <p className="mt-3 h-5 text-[13px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
          {closed ? `${closed} ring closed.` : "Add to today's goals and watch the rings sweep."}
        </p>
      </div>
    </div>
  )
}

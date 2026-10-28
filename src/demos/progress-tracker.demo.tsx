import { ProgressTracker, type ProgressStep } from "@/components/ui/progress-tracker"

const dot = (color: string, d: string) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden>
    <rect width="16" height="16" rx="4" fill={color} />
    <path d={d} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SETUP: ProgressStep[] = [
  { id: "tools", label: "Connect your data sources" },
  { id: "notify", label: "Turn on run notifications" },
  { id: "eval", label: "Review the first eval report", done: true },
  { id: "prompt", label: "Save a reusable prompt" },
  { id: "agent", label: "Deploy your first agent" },
]

const WITH_ICONS: ProgressStep[] = [
  { id: "inbox", label: "Triage this week's support tickets", icon: dot("#e0603a", "M4.5 8h7M8 4.5v7") },
  { id: "docs", label: "Summarize the product spec", icon: dot("#3a3a3c", "M5 5.5h6M5 8h6M5 10.5h3.5") },
  { id: "sync", label: "Sync the customer notes", icon: dot("#0a7e8c", "M4.5 8a3.5 3.5 0 0 1 6-2.5M11.5 8a3.5 3.5 0 0 1-6 2.5") },
]

export default function Demo() {
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6">
      <div className="w-full max-w-[340px]">
        <ProgressTracker steps={SETUP} autoPlay interval={2400} />
      </div>
      <div className="w-full max-w-[340px]">
        <ProgressTracker title="This week" steps={WITH_ICONS} />
      </div>
    </div>
  )
}

export const notes = [
  "The bar never changes its width. The fill is always 100% wide and gets `transform: scaleX(done / total)` with `transform-origin: left`, so the 1.1s ease runs on the compositor instead of re-flowing layout.",
  "The tick draws itself with `stroke-dasharray` / `stroke-dashoffset`: `pathLength={1}` normalises the path so a dash of 1 covers all of it, and moving the offset from 1 to 0 reveals the stroke. The CSS transition on `stroke-dashoffset` has a delay so the circle fills first, then the tick.",
  "The strike-through is not `text-decoration`: it is a 1px linear-gradient background on an inner span, positioned at 60% height, whose `background-size` transitions from `0% 1px` to `100% 1px` – so the line travels across the text.",
  "The light band on the bar is a gradient sliding via `background-position` inside the fill. It is remounted with a changing React `key` each time the count goes up, which restarts the animation; the counter digit uses the same key trick for its roll.",
  "Auto play is one `setTimeout` at a time inside an effect that depends on the done list, so each tick schedules the next. A pointer or key event on the card flips `playing` to false, which clears the timer – it never fights the user.",
]

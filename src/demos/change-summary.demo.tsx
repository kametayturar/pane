import * as React from "react"

import { ChangeSummary, type MetricChange } from "@/components/ui/change-summary"

const WEEK: MetricChange[] = [
  { label: "Resolved by AI", change: "Up 9% to 71% of chats", tone: "good", direction: "up" },
  { label: "Median reply time", change: "Down to 14s from 22s", tone: "good", direction: "down" },
  { label: "Handoffs to humans", change: "Up 12% to 184", tone: "bad", direction: "up" },
  { label: "Tokens per chat", change: "Flat at about 3.4K", tone: "neutral", direction: "flat" },
]

const MONTH: MetricChange[] = [
  { label: "Resolved by AI", change: "Up 14% to 68% of chats", tone: "good", direction: "up" },
  { label: "Median reply time", change: "Down to 15s from 31s", tone: "good", direction: "down" },
  { label: "Handoffs to humans", change: "Down 6% to 702", tone: "good", direction: "down" },
  { label: "Cost per chat", change: "Up 4% to $0.031", tone: "bad", direction: "up" },
  { label: "Tokens per chat", change: "Down 8% to 3.4K", tone: "good", direction: "down" },
]

export const notes = [
  "Each change is a <dt> (the metric) and a <dd> (what happened) inside a <dl>, so assistive tech reads them as pairs; the arrow is aria-hidden because the sentence already says up or down.",
  "The colour does not come from the direction but from a separate tone: churn going down is green, tickets going up is red. The tone sets a CSS variable via data-tone and the badge background is color-mix() of that colour at 8%.",
  "Rows stagger in with one CSS animation and an inline animation-delay of 120ms + index × 70ms; animation-fill-mode: backwards keeps them invisible during the delay without leaving a stacking context behind.",
  "Columns use grid-template-columns: 2fr 3fr with minmax(0, …) so long text truncates with an ellipsis instead of stretching the card.",
]

export default function Demo() {
  const [range, setRange] = React.useState<"week" | "month">("week")
  return (
    <div className="flex w-full max-w-[480px] flex-col gap-4">
      <div className="flex gap-2 text-[13px]">
        {(["week", "month"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className="rounded-md px-2.5 py-1 font-medium text-neutral-500 aria-pressed:bg-neutral-500/10 aria-pressed:text-neutral-900 dark:aria-pressed:text-neutral-100"
          >
            {r === "week" ? "This week" : "Last 30 days"}
          </button>
        ))}
      </div>
      <ChangeSummary
        key={range}
        title="Support desk recap"
        period={range === "week" ? "This week" : "Last 30 days"}
        changes={range === "week" ? WEEK : MONTH}
      />
    </div>
  )
}

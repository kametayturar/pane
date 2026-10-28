import * as React from "react"

import { FilterMenu, type FilterGroup, type FilterValue } from "@/components/ui/filter-menu"

export const notes: string[] = [
  "Each group's options live in a grid whose `grid-template-rows` transitions between `1fr` and `0fr`. That is how the panel animates its height without measuring anything – the inner element just needs `min-height: 0; overflow: hidden`. The chip row above uses the same trick to slide shut when the last filter goes.",
  "There is one roving tab stop: only the active row has `tabindex=\"0\"`, every other row is `-1`, and arrow keys move focus by calling `.focus()` on the next `[data-key]` element. Tab therefore skips the whole list in one step.",
  "Chips stay on one line because a hidden twin row (`visibility: hidden`, `width: max-content`) is measured by a ResizeObserver. The component then fits as many chips as the width allows and renders the rest as a single \"+N\" chip.",
  "The checkmark draws itself by animating `stroke-dashoffset` from the path length to 0 (the path has `stroke-dasharray: 12`). Row hovers use `transition: none` on `:hover` and a fade on the base state, so they appear instantly and fade away.",
  "The component works controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Here it is controlled, and the ticket list on the right is just `tickets.filter(...)` over the same value.",
]

const GROUPS: FilterGroup[] = [
  {
    id: "status",
    label: "Status",
    options: [
      { id: "open", label: "Open" },
      { id: "pending", label: "Waiting on customer" },
      { id: "escalated", label: "Escalated" },
      { id: "solved", label: "Solved" },
    ],
  },
  {
    id: "handler",
    label: "Handled by",
    chipPrefix: "By ",
    options: [
      { id: "ai", label: "AI agent" },
      { id: "human", label: "Human" },
      { id: "both", label: "AI + human" },
    ],
  },
  {
    id: "channel",
    label: "Channel",
    options: [
      { id: "email", label: "Email" },
      { id: "chat", label: "Live chat" },
      { id: "slack", label: "Slack Connect" },
      { id: "voice", label: "Voice" },
      { id: "api", label: "API" },
    ],
  },
]

type Ticket = { id: string; title: string; status: string; handler: string; channel: string }

const TICKETS: Ticket[] = [
  { id: "T-1042", title: "Refund for duplicate invoice", status: "open", handler: "ai", channel: "email" },
  { id: "T-1043", title: "SSO login loops back to the form", status: "escalated", handler: "human", channel: "chat" },
  { id: "T-1044", title: "How do I export traces as CSV?", status: "solved", handler: "ai", channel: "chat" },
  { id: "T-1045", title: "Webhook retries stop after 3 attempts", status: "pending", handler: "both", channel: "api" },
  { id: "T-1046", title: "Seat count looks wrong after upgrade", status: "open", handler: "both", channel: "slack" },
  { id: "T-1047", title: "Voice agent cuts off long answers", status: "escalated", handler: "human", channel: "voice" },
  { id: "T-1048", title: "Change billing contact", status: "solved", handler: "ai", channel: "email" },
  { id: "T-1049", title: "Rate limit on the evals endpoint", status: "pending", handler: "ai", channel: "api" },
]

const LABEL: Record<string, Record<string, string>> = Object.fromEntries(
  GROUPS.map((g) => [g.id, Object.fromEntries(g.options.map((o) => [o.id, o.label]))]),
)

export default function Demo() {
  const [filters, setFilters] = React.useState<FilterValue>({ status: ["open"], handler: ["ai"] })

  const matches = TICKETS.filter((t) =>
    GROUPS.every((g) => {
      const picked = filters[g.id]
      return !picked?.length || picked.includes(t[g.id as keyof Ticket])
    }),
  )

  return (
    <div className="grid w-full max-w-[820px] items-start gap-6 sm:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <FilterMenu groups={GROUPS} value={filters} onChange={setFilters} title="Ticket filters" defaultOpen={["status", "handler"]} />

      <div className="min-w-0 text-[13px]">
        <p className="mb-2 font-medium text-neutral-500 dark:text-neutral-400">
          {matches.length} of {TICKETS.length} tickets
        </p>
        <ul className="grid gap-1.5">
          {matches.map((t) => (
            <li
              key={t.id}
              className="rounded-lg bg-black/[.03] px-3 py-2 text-neutral-800 dark:bg-white/[.05] dark:text-neutral-100"
            >
              <span className="mr-2 text-neutral-400">{t.id}</span>
              {t.title}
              <span className="mt-0.5 block text-[12px] text-neutral-400">
                {LABEL.status[t.status]} · {LABEL.handler[t.handler]} · {LABEL.channel[t.channel]}
              </span>
            </li>
          ))}
          {matches.length === 0 && <li className="rounded-lg px-3 py-6 text-center text-neutral-400">No tickets match these filters.</li>}
        </ul>
      </div>
    </div>
  )
}

import * as React from "react"

import { Sunburst, type SunburstNode } from "@/components/ui/sunburst"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes: string[] = [
  "The layout is a hand-written partition: each node's angle is its share of its parent's angle, and its ring is its depth below the node in the centre. Zooming just re-runs that function with a different centre node, so every arc has a new target `{ a0, a1, r0, r1 }`.",
  "One `requestAnimationFrame` loop interpolates every arc from where it is on screen to its new target with an ease-out curve and writes the `d` attribute of each `<path>` directly. React never re-renders per frame, and arcs that leave simply fade while the rest swing around the new centre.",
  "Arc labels use `<textPath>` along a hidden arc baseline. The baseline flips direction on the bottom half so text stays upright, and each label fades by comparing the arc length to an estimated text width, so only labels that fit are shown.",
  "Node ids are stable across the two months, so switching the dataset only changes the targets and the arcs morph in place; the centre figure counts to its new total with rAF.",
  "Keyboard: the chart is a focusable group, arrows walk siblings / children / parent, Enter zooms, Escape zooms out; a polite live region announces the path, and a visually hidden table lists every node.",
]

const leaf = (id: string, label: string, value: number): SunburstNode => ({ id, label, value })

/** Same ids every month; only the numbers change. */
function spend(month: "oct" | "nov"): SunburstNode {
  const v = (base: number, wobble: number) => Math.round(base * (month === "oct" ? 1 : wobble) * 10) * 100
  return {
    id: "all",
    label: "All agents",
    children: [
      {
        id: "support",
        label: "Support",
        children: [
          { id: "support/triage", label: "Triage", children: [leaf("classify", "classifier", v(7.9, 1.05)), leaf("route", "router", v(4.4, 0.9)), leaf("dedupe", "dedupe", v(2.1, 1.3))] },
          { id: "support/reply", label: "Replies", children: [leaf("draft", "draft-writer", v(19.2, 1.22)), leaf("tone", "tone-check", v(5.6, 1.08))] },
          { id: "support/escalate", label: "Escalation", children: [leaf("summary", "case-summary", v(6.8, 0.86)), leaf("handoff", "handoff", v(3.1, 1.0))] },
        ],
      },
      {
        id: "research",
        label: "Research",
        children: [
          { id: "research/search", label: "Search", children: [leaf("web", "web-crawl", v(26.4, 1.18)), leaf("docs", "doc-index", v(9.7, 1.04))] },
          { id: "research/synth", label: "Synthesis", children: [leaf("brief", "brief-writer", v(15.3, 1.3)), leaf("cite", "citation-check", v(4.2, 1.12)), leaf("chart", "chart-maker", v(2.7, 0.95))] },
        ],
      },
      {
        id: "code",
        label: "Code",
        children: [
          { id: "code/review", label: "Review", children: [leaf("pr", "pr-reviewer", v(21.8, 1.1)), leaf("lint", "lint-fixer", v(5.2, 0.92))] },
          { id: "code/tests", label: "Tests", children: [leaf("gen", "test-writer", v(14.6, 1.25)), leaf("flaky", "flake-hunter", v(3.4, 0.8))] },
          { id: "code/docs", label: "Docs", children: [leaf("api", "api-docs", v(4.8, 1.0))] },
        ],
      },
      {
        id: "sales",
        label: "Sales",
        children: [
          { id: "sales/lead", label: "Leads", children: [leaf("enrich", "enricher", v(8.3, 1.06)), leaf("score", "scorer", v(3.9, 1.0))] },
          { id: "sales/outreach", label: "Outreach", children: [leaf("seq", "sequencer", v(6.1, 1.2)), leaf("personal", "personaliser", v(5.5, 1.35))] },
        ],
      },
      {
        id: "ops",
        label: "Ops",
        children: [
          { id: "ops/monitor", label: "Monitoring", children: [leaf("anom", "anomaly-watch", v(4.1, 0.9)), leaf("report", "daily-report", v(1.9, 1.0))] },
          { id: "ops/security", label: "Security", children: [leaf("redact", "pii-redactor", v(2.8, 1.1)), leaf("audit", "audit-log", v(1.4, 1.0))] },
        ],
      },
    ],
  }
}

const money = (n: number) => `$${(n / 1000).toFixed(1)}K`

export default function Demo() {
  const [month, setMonth] = React.useState<"oct" | "nov">("nov")
  const data = React.useMemo(() => spend(month), [month])
  return (
    <div className="w-full max-w-[640px]">
      <Sunburst
        data={data}
        label="Agent spend by team"
        title="Agent spend"
        subtitle={month === "oct" ? "October 2026" : "November 2026"}
        formatValue={money}
        actions={
          <SegmentedControl
            variant="tray"
            size="sm"
            aria-label="Month"
            value={month}
            onChange={(v) => setMonth(v as "oct" | "nov")}
            options={[
              { value: "oct", label: "Oct" },
              { value: "nov", label: "Nov" },
            ]}
          />
        }
      />
    </div>
  )
}

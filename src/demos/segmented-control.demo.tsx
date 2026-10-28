import * as React from "react"

import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes = [
  "The indicator is one absolutely positioned span. A layout effect reads the active button's offsetLeft/offsetWidth and writes `left` and `right` straight onto it (no React state), and CSS transitions those two properties.",
  "`left` and `right` get different durations (160ms and 220ms), swapped through a data-dir attribute, so the edge facing the target leads and the pill stretches a little instead of sliding as a rigid block.",
  "Roving tabindex: only the active option has tabindex 0, arrow keys move focus and selection together and skip disabled options. Radios and tabs share the code; only the role, aria-checked / aria-selected and the vertical arrows differ.",
  "Dragging uses pointer events with setPointerCapture on the track. On every pointermove the nearest enabled option to clientX is selected, which is why the pill follows the cursor across the options.",
  "A ResizeObserver watches the track and every button, so when a count or label changes width the pill re-places itself. Overflow fades come from a mask-image whose edge stops are toggled by scroll position.",
]

const ListIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <path d="M5 3.5h6M5 7h6M5 10.5h6M2.5 3.5h.01M2.5 7h.01M2.5 10.5h.01" />
  </svg>
)
const BoardIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
    <rect x="2" y="2.5" width="3.5" height="9" rx="1" />
    <rect x="8.5" y="2.5" width="3.5" height="5.5" rx="1" />
  </svg>
)
const GridIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
    <rect x="2.25" y="2.25" width="9.5" height="9.5" rx="1.5" />
    <path d="M2.25 6h9.5M6 2.25v9.5" />
  </svg>
)

const PANELS: Record<string, string> = {
  runs: "142 agent runs this week, 96% finished without a human nudge.",
  evals: "Eval suite: 38 of 40 cases pass. Two regressions in the refund-policy prompt.",
  alerts: "Three alerts: a spiking tool-error rate, a slow retrieval step and a budget warning.",
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{children}</div>
}

export default function Demo() {
  const [tab, setTab] = React.useState("runs")
  const [mode, setMode] = React.useState("balanced")
  const [period, setPeriod] = React.useState("monthly")
  const [unread, setUnread] = React.useState(3)

  return (
    <div className="flex w-full max-w-[560px] flex-col gap-7">
      <div>
        <Label>Workspace (tabs, count)</Label>
        <SegmentedControl
          aria-label="Workspace section"
          kind="tabs"
          variant="underline"
          value={tab}
          onChange={setTab}
          options={[
            { value: "runs", label: "Runs", controls: "panel-runs" },
            { value: "evals", label: "Evals", controls: "panel-evals" },
            { value: "alerts", label: "Alerts", count: unread, controls: "panel-alerts" },
          ]}
        />
        <p id={`panel-${tab}`} role="tabpanel" className="mt-3 text-[13px] text-neutral-600 dark:text-neutral-300">
          {PANELS[tab]}
        </p>
        <button
          type="button"
          className="mt-2 text-[12px] text-neutral-500 underline-offset-2 hover:underline"
          onClick={() => setUnread((n) => n + 1)}
        >
          Simulate another alert
        </button>
      </div>

      <div>
        <Label>Response mode (tray, icons)</Label>
        <SegmentedControl
          size="sm"
          variant="tray"
          aria-label="Response mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "fast", label: "Fast", icon: <ListIcon /> },
            { value: "balanced", label: "Balanced", icon: <BoardIcon /> },
            { value: "thorough", label: "Thorough", icon: <GridIcon /> },
            { value: "off", label: "Paused", disabled: true },
          ]}
        />
      </div>

      <div>
        <Label>Billing (underline, badge)</Label>
        <SegmentedControl
          variant="underline"
          aria-label="Billing period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly", badge: "Save 20%" },
          ]}
        />
      </div>

      <div>
        <Label>Chips, full width, large</Label>
        <SegmentedControl
          size="lg"
          fullWidth
          aria-label="Context source"
          defaultValue="docs"
          options={[
            { value: "docs", label: "Docs" },
            { value: "tickets", label: "Tickets" },
            { value: "web", label: "Web" },
          ]}
        />
      </div>

      <div className="max-w-[220px]">
        <Label>Overflow scrolls with soft edges</Label>
        <SegmentedControl
          variant="tray"
          aria-label="Model family"
          defaultValue="haiku"
          options={[
            { value: "haiku", label: "Haiku" },
            { value: "sonnet", label: "Sonnet" },
            { value: "opus", label: "Opus" },
            { value: "local", label: "Local model" },
            { value: "custom", label: "Custom endpoint" },
          ]}
        />
      </div>
    </div>
  )
}

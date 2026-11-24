import * as React from "react"

import { RunHealth, type RunHealthRow, type RunHealthRun, type RunHealthStatus } from "@/components/ui/run-health"

const DAY = 86_400_000

type Event = { i: number; status: RunHealthStatus; detail?: string; ms?: number }

const AGENTS: { id: string; name: string; hour: number; seed: number; events: Event[] }[] = [
  {
    id: "atlas", name: "Atlas", hour: 2, seed: 3,
    events: [
      { i: 31, status: "failed", detail: "Ledger API returned 503", ms: 64_000 },
      { i: 48, status: "degraded", detail: "3 retries calling Search", ms: 412_000 },
    ],
  },
  {
    id: "quill", name: "Quill", hour: 3, seed: 11,
    events: [
      { i: 17, status: "failed", detail: "context limit hit on the Q3 export", ms: 188_000 },
      { i: 40, status: "degraded", detail: "slow responses from Ledger", ms: 530_000 },
      { i: 56, status: "failed", detail: "timeout calling Billing", ms: 41_000 },
    ],
  },
  {
    id: "sage", name: "Sage", hour: 4, seed: 23,
    events: [
      { i: 9, status: "degraded", detail: "2 retries calling Billing", ms: 365_000 },
      { i: 22, status: "none", detail: "no run, paused for the holiday freeze" },
    ],
  },
]

/** Small deterministic noise so durations look real and stay the same on every load. */
const noise = (seed: number, i: number) => {
  const x = Math.sin(seed * 997 + i * 7.13) * 10_000
  return x - Math.floor(x)
}

function nightly(today: number): RunHealthRow[] {
  return AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    runs: Array.from({ length: 60 }, (_, i): RunHealthRun => {
      const e = a.events.find((x) => x.i === i)
      return {
        id: `${a.id}-n${i}`,
        at: today - (59 - i) * DAY + a.hour * 3_600_000,
        status: e?.status ?? "ok",
        detail: e?.detail,
        durationMs: e?.status === "none" ? undefined : (e?.ms ?? Math.round(96_000 + noise(a.seed, i) * 130_000)),
      }
    }),
  }))
}

/** What each press of Run now brings back, in turn. */
const OUTCOMES: Partial<Record<string, Omit<RunHealthRun, "id" | "at">>>[] = [
  {},
  { quill: { status: "failed", detail: "timeout calling Billing", durationMs: 38_000 } },
  { sage: { status: "degraded", detail: "slow responses from Search", durationMs: 402_000 } },
  {},
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const pad2 = (n: number) => String(n).padStart(2, "0")
/** "Mon 24 Nov, 14:32" */
const stamp = (ms: number) => {
  const d = new Date(ms)
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 90 days of an invented API's uptime, one square per day. */
function uptime(today: number): RunHealthRun[] {
  return Array.from({ length: 90 }, (_, i): RunHealthRun => {
    const at = today - (89 - i) * DAY
    if (i === 23) return { id: `u${i}`, at, status: "failed", detail: "23 min outage, failover to the second region" }
    if (i === 61) return { id: `u${i}`, at, status: "degraded", detail: "99.4% up, slow card checks for 40 min" }
    if (i === 77) return { id: `u${i}`, at, status: "degraded", detail: "99.8% up, retries from Northwind's webhook" }
    return { id: `u${i}`, at, status: "ok", detail: `${(99.95 + noise(5, i) * 0.05).toFixed(2)}% up` }
  })
}

export default function Demo() {
  const [today] = React.useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  })
  const [rows, setRows] = React.useState(() => nightly(today))
  const [days] = React.useState(() => uptime(today))
  const [pending, setPending] = React.useState(false)
  const [opened, setOpened] = React.useState("Click a square, or Tab to the row and use the arrow keys.")
  const presses = React.useRef(0)
  const timer = React.useRef(0)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const runNow = () => {
    setPending(true)
    timer.current = window.setTimeout(() => {
      const at = Date.now()
      const k = presses.current++
      const outcome = OUTCOMES[k % OUTCOMES.length]
      setRows((rs) =>
        rs.map((row) => {
          const o = outcome[row.id]
          const run: RunHealthRun = {
            id: `${row.id}-m${k}`,
            at,
            label: stamp(at),
            status: o?.status ?? "ok",
            detail: o?.detail,
            durationMs: o?.durationMs ?? Math.round(98_000 + noise(k + 40, row.name.charCodeAt(0)) * 120_000),
          }
          return { ...row, runs: [...row.runs, run] }
        }),
      )
      setPending(false)
    }, 1300)
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-10" style={{ maxWidth: 720 }}>
      {/* 1 · Three agents, one card: aligned columns, one number per row, Run now lands a square */}
      <div className="flex flex-col gap-3">
        <RunHealth
          rows={rows}
          limit={60}
          title="Nightly runs"
          span="60 days"
          action={{ label: "Run now", pendingLabel: "Running", onClick: runNow, pending }}
          onSelect={(run, row) => setOpened(`Opened ${row.name}'s run from ${run.label ?? stamp(+new Date(run.at)).split(",")[0]}.`)}
          onClear={() => setOpened("Selection cleared.")}
        />
        <p aria-live="polite" className="px-1 text-[12px] text-neutral-700 dark:text-neutral-300">
          {opened}
        </p>
      </div>

      {/* 2 · One row on its own: an API's uptime, a square per day */}
      <RunHealth runs={days} title="Billing API uptime" span="90 days" unit="days" verb="healthy" />
    </div>
  )
}

export const notes = [
  "Every square is a real button in a CSS grid of equal columns. The coloured part is a span inside it, inset by half the gap on each side, so the hit area is the whole column and moving the pointer along the row never falls between squares. A ResizeObserver reads the row's width once per resize; when a column would get narrower than 8px the row wraps into even lines instead of shrinking further.",
  "Status is a `data-s` attribute. Ok is 15% ink, a period with no run is an empty ring, a degraded one is half filled with darker ink (a two-stop gradient), and only a failure takes the destructive red. In Mono the red becomes solid ink, so all four still read without colour.",
  "Rows align from the right, so the newest run of every row sits in the last column and shares its date. When a run arrives, the squares that stay are found by key: each one is drawn where it is now, then moved back to the slot it used to occupy with a transform and animated to rest (FLIP, through the Web Animations API), while the new square lands from above with a short blur. Reduced motion skips both.",
  "The sentence above the rows is plain text. Its numbers roll through a blur when they change; the second line swaps instantly while you scrub and falls back to the last problem when you leave. The squares use a roving tabindex: one Tab stop, arrows move along a row and between rows in the same column, Enter selects, Escape clears. A hidden paragraph summarises every row for screen readers, and a polite live region says what was selected or what just landed.",
]

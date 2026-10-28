import * as React from "react"

import { ReadoutBar, type ReadoutItem } from "@/components/ui/readout-bar"

/* A model-serving strip for "Nova Large": five readings that drift every 2 seconds. */
const HISTORY = 12

type Sample = { rps: number; p95: number; tokens: number; cost: number; errors: number }

const START: Sample = { rps: 1284, p95: 412, tokens: 41.2, cost: 0.0041, errors: 0.42 }

function next(s: Sample): Sample {
  const jitter = (v: number, pct: number) => v * (1 + (Math.random() - 0.5) * 2 * pct)
  return {
    rps: Math.round(jitter(s.rps, 0.04)),
    p95: Math.round(jitter(s.p95, 0.05)),
    tokens: Math.round(jitter(s.tokens, 0.03) * 10) / 10,
    cost: Math.round(jitter(s.cost, 0.03) * 1e4) / 1e4,
    errors: Math.max(0.05, Math.round(jitter(s.errors, 0.12) * 100) / 100),
  }
}

function seed(): Sample[] {
  const out: Sample[] = [START]
  for (let i = 1; i < HISTORY; i++) out.push(next(out[i - 1]))
  return out
}

const pctChange = (a: number, b: number) => Math.round(((a - b) / b) * 1000) / 10

function toItems(h: Sample[]): ReadoutItem[] {
  const cur = h[h.length - 1]
  const base = h[0]
  const col = (k: keyof Sample) => h.map((s) => s[k])
  return [
    { label: "Requests", value: cur.rps, unit: "req/s", delta: pctChange(cur.rps, base.rps), spark: col("rps") },
    {
      label: "p95 latency",
      value: cur.p95,
      unit: "ms",
      delta: { value: pctChange(cur.p95, base.p95), lowerIsBetter: true },
      tolerance: 18,
      spark: col("p95"),
    },
    { label: "Tokens out", value: cur.tokens, unit: "k/min", delta: pctChange(cur.tokens, base.tokens), spark: col("tokens") },
    {
      label: "Cost",
      value: cur.cost,
      unit: "$/req",
      delta: { value: pctChange(cur.cost, base.cost), lowerIsBetter: true },
      format: (n) => n.toFixed(4),
      spark: col("cost"),
    },
    {
      label: "Error rate",
      value: cur.errors,
      unit: "%",
      delta: { value: pctChange(cur.errors, base.errors), lowerIsBetter: true },
      format: (n) => n.toFixed(2),
      spark: col("errors"),
    },
  ]
}

const EVAL_ITEMS: ReadoutItem[] = [
  { label: "Accuracy", value: 91.4, unit: "%", delta: { value: 2.3, unit: " pts" }, tolerance: 1.8 },
  { label: "Faithfulness", value: 0.87, delta: { value: 0.02, unit: "" }, tolerance: 0.03, format: (n) => n.toFixed(2) },
  { label: "Refusals", value: 14, unit: "of 500", delta: { value: -4, unit: "", lowerIsBetter: true } },
  { label: "Median latency", value: 238, unit: "ms", delta: { value: 0, unit: " ms" }, tolerance: 12 },
]

const BUTTON =
  "rounded-[2px] px-3 py-1.5 font-mono text-[11px] tracking-[.08em] uppercase shadow-[0_0_0_1px_rgb(0_0_0/.14)] hover:bg-black/5 dark:shadow-[0_0_0_1px_rgb(255_255_255/.18)] dark:hover:bg-white/10"

export const notes: string[] = [
  "The hairlines are a 1px CSS grid `gap` over a rule-coloured background: every cell paints its own sheet colour, so rules survive any wrapping without per-cell borders.",
  "A ResizeObserver on the strip picks the column count (one row if every item has its minimum width, otherwise a balanced grid of two or more) and the last cell spans the leftover columns so no gap shows a stray rule.",
  "The count-up writes text straight into a span from requestAnimationFrame, so React does not re-render every frame. The curve is an ease-out to 1 + overshoot, then a return to 1, with the overshoot capped at 2% of the value.",
  "The final number is written first and re-asserted by a timer, so a throttled tab or a missing frame can never leave a value stuck mid-count. Reduced motion skips the count entirely.",
  "Sparklines are one SVG path with `pathLength=1`, so `stroke-dasharray: 1` plus an animated `stroke-dashoffset` traces any line without measuring it; the end dot is an HTML span because the SVG is stretched.",
]

export default function Demo() {
  const [history, setHistory] = React.useState(seed)
  const [running, setRunning] = React.useState(true)

  React.useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      if (document.hidden) return
      setHistory((h) => [...h.slice(-(HISTORY - 1)), next(h[h.length - 1])])
    }, 2000)
    return () => window.clearInterval(id)
  }, [running])

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-10 p-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10.5px] tracking-[.08em] text-black/45 uppercase dark:text-white/45">
            Live · updates every 2 s
          </p>
          <button type="button" className={BUTTON} onClick={() => setRunning((r) => !r)} aria-pressed={!running}>
            {running ? "Pause feed" : "Resume feed"}
          </button>
        </div>
        <ReadoutBar
          live={running}
          items={toItems(history)}
          caption="FIG. 1 — Nova Large serving, last 24 s"
        />
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-mono text-[10.5px] tracking-[.08em] text-black/45 uppercase dark:text-white/45">
          Static · with tolerance
        </p>
        <ReadoutBar items={EVAL_ITEMS} caption="FIG. 2 — Eval run 0412, 500 prompts, Atlas vs Sage" />
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-mono text-[10.5px] tracking-[.08em] text-black/45 uppercase dark:text-white/45">
          Narrow · odd count wraps to two columns
        </p>
        <div className="max-w-[340px]">
          <ReadoutBar items={toItems(history).slice(0, 3)} caption="FIG. 3 — Three readings at 340 px" animate={false} />
        </div>
      </section>
    </div>
  )
}

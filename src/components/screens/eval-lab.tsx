"use client"

import * as React from "react"
import { BookOpenText, Check, ChevronDown, FlaskConical, Landmark, LayoutDashboard, ListChecks, Menu, PenLine, Radar, RotateCw, Search, Wallet } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type EvalLabProps = {
  /** Called with the nav label when any item in the left rail is clicked. */
  onNavigate?: (label: string) => void
  /** Rendered at the bottom of the rail, above the user row. */
  sideTools?: React.ReactNode
}

type MetricId = "cor" | "ton" | "pol" | "lat" | "cost"

type Metric = {
  id: MetricId
  label: string
  hint: string
  d0: number
  d1: number
  ticks: number[]
  higher: boolean
  rel: boolean
  unit: string
  fmt: (v: number) => string
  sd: (v: number) => string
  axis: (v: number) => string
}

type Case = { id: string; prompt: string; outs: string[]; hl: string[]; rationale: string }

/* -------------------------------------------------------------------------- */
/*                                Simulated data                              */
/* -------------------------------------------------------------------------- */

const q2 = (v: number) => v.toFixed(2)

const METRICS: Metric[] = [
  { id: "cor", label: "Correctness", hint: "Higher is better", d0: 0, d1: 1, ticks: [0, 0.25, 0.5, 0.75, 1], higher: true, rel: false, unit: "", fmt: q2, sd: (v) => `±${q2(v)}`, axis: (v) => String(v) },
  { id: "ton", label: "Tone", hint: "Higher is better", d0: 0, d1: 1, ticks: [0, 0.25, 0.5, 0.75, 1], higher: true, rel: false, unit: "", fmt: q2, sd: (v) => `±${q2(v)}`, axis: (v) => String(v) },
  { id: "pol", label: "Policy", hint: "Higher is better", d0: 0, d1: 1, ticks: [0, 0.25, 0.5, 0.75, 1], higher: true, rel: false, unit: "", fmt: q2, sd: (v) => `±${q2(v)}`, axis: (v) => String(v) },
  { id: "lat", label: "Latency", hint: "Lower is better", d0: 0, d1: 2400, ticks: [0, 600, 1200, 1800, 2400], higher: false, rel: true, unit: "ms", fmt: (v) => String(Math.round(v)), sd: (v) => `±${Math.round(v)}`, axis: (v) => String(v) },
  { id: "cost", label: "Cost", hint: "Lower is better", d0: 0, d1: 0.012, ticks: [0, 0.003, 0.006, 0.009, 0.012], higher: false, rel: true, unit: "", fmt: (v) => `$${v.toFixed(4)}`, sd: (v) => `±${v.toFixed(4)}`, axis: (v) => `$${v}` },
]

const MODELS = [
  { id: "nova", name: "Nova", role: "Baseline" },
  { id: "atlas", name: "Atlas", role: "Candidate" },
  { id: "sage", name: "Sage", role: "Challenger" },
]
const CAND = 1
const N_CASES = 240

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Hand-set scores for the three cases the candidate got wrong: [Nova, Atlas, Sage]
const OVR: Record<number, Partial<Record<MetricId, number[]>>> = {
  86: { cor: [0.94, 0.41, 0.82], ton: [0.88, 0.74, 0.9], pol: [0.95, 0.7, 0.9] },
  141: { cor: [0.91, 0.46, 0.88], ton: [0.86, 0.35, 0.9], pol: [0.9, 0.3, 0.92] },
  202: { cor: [0.96, 0.39, 0.9], ton: [0.9, 0.8, 0.88], pol: [0.95, 0.25, 0.93] },
}
const REG_IDX = [86, 141, 202]

const DATA: Record<MetricId, number[][]> = (() => {
  const r = rng(412)
  const z = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
  const quality: Record<string, [number, number][]> = {
    cor: [[0.86, 0.09], [0.89, 0.08], [0.83, 0.1]],
    ton: [[0.8, 0.1], [0.88, 0.08], [0.85, 0.09]],
    pol: [[0.91, 0.07], [0.9, 0.08], [0.87, 0.09]],
  }
  const out = {} as Record<MetricId, number[][]>
  for (const id of ["cor", "ton", "pol"] as const) {
    out[id] = quality[id].map(([m, s]) => Array.from({ length: N_CASES }, () => clamp(m + s * z(), 0.04, 1)))
  }
  for (let i = 0; i < N_CASES; i++) {
    if (REG_IDX.includes(i)) continue
    if (out.cor[CAND][i] < out.cor[0][i] - 0.2) out.cor[CAND][i] = out.cor[0][i] - 0.2 + 0.03 * r()
  }
  for (const i of REG_IDX) for (const id of ["cor", "ton", "pol"] as const) out[id].forEach((row, m) => (row[i] = OVR[i][id]![m]))
  out.lat = [940, 780, 1210].map((m) => Array.from({ length: N_CASES }, () => clamp(m * Math.exp(0.25 * z() - 0.03), 160, 2390)))
  out.cost = [0.0041, 0.0044, 0.0062].map((m) => Array.from({ length: N_CASES }, () => clamp(m * Math.exp(0.22 * z() - 0.02), 0.0008, 0.0118)))
  return out
})()

function stats(arr: number[]) {
  const n = arr.length
  const mean = arr.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1))
  return { mean, sd, ci: (1.96 * sd) / Math.sqrt(n) }
}
const STATS = Object.fromEntries(Object.entries(DATA).map(([k, v]) => [k, v.map(stats)])) as Record<MetricId, ReturnType<typeof stats>[]>

const caseId = (i: number) => `C-${String(i + 1).padStart(4, "0")}`

const AUTHORED: Record<number, Case> = {
  86: {
    id: "C-0087",
    prompt: "I sent my headphones back 9 days ago and nothing has reached my card. Where is my refund?",
    outs: [
      "Thanks for your patience. Your parcel was scanned at our warehouse on 12 Oct, so the refund is due by 19 Oct (5 business days). If it has not arrived by then, reply here and I will escalate it.",
      "Refunds usually take 3 business days, so yours should already be with you. Please check with your bank, and let us know if it still is not there.",
      "Refunds are issued within 5 business days of the warehouse scanning the parcel. I can see the scan on 12 Oct, so please expect it by 19 Oct.",
    ],
    hl: ["Refunds usually take 3 business days", "Please check with your bank"],
    rationale: "Atlas quotes 3 days where the policy says 5, then sends the customer to their bank before looking at the scan date. Nova names the scan date and the deadline.",
  },
  141: {
    id: "C-0142",
    prompt: "Can I return a candle I bought on final sale? It arrived cracked.",
    outs: [
      "Sorry about the crack. Final sale covers change-of-mind returns, not damage, so we will send a replacement or refund it. A photo of the candle is all we need.",
      "Final-sale items cannot be returned.",
      "Damaged items are covered even on final sale. Send us a photo and we will replace the candle or refund you, whichever you prefer.",
    ],
    hl: ["Final-sale items cannot be returned."],
    rationale: "Final sale rules out change-of-mind returns, not damage. Atlas refuses outright, skips the damage route and reads curt for a customer who just received a broken product.",
  },
  202: {
    id: "C-0203",
    prompt: "Cancel my return please, I would rather keep the jacket.",
    outs: [
      "Done. The return is cancelled and the prepaid label is void. There is no fee, and the jacket is yours to keep.",
      "I can cancel it, but cancelling forfeits your refund and a $9 restocking fee applies to the jacket.",
      "Your return is cancelled and the label will no longer work. Nothing else changes on your order.",
    ],
    hl: ["a $9 restocking fee applies"],
    rationale: "Atlas invents a $9 restocking fee. No such fee exists in policy v7, and the confident wording makes the mistake more costly.",
  },
}

const POOL: Omit<Case, "id" | "hl">[] = [
  {
    prompt: "Where can I print a return label for order #48213?",
    outs: [
      "Open Orders, choose #48213 and select Print label. No printer? Pick a drop-off code instead and show it at any partner counter.",
      "Open your order and select Print label. A drop-off code is available if you do not have a printer.",
      "Go to Returns, pick the order, then print the label or take the drop-off code to a partner counter.",
    ],
    rationale: "All three point to the right page. Nova is the only one that spells out the no-printer path.",
  },
  {
    prompt: "Can I swap the medium for a large instead of returning it?",
    outs: [
      "Yes. Start a return, choose Exchange and pick the large. We ship it when the medium is scanned, so there is no gap.",
      "Exchanges are available from the returns page. Choose the new size and we will send it once the first parcel is scanned.",
      "You can exchange sizes from the returns page. The new size ships as soon as we receive the first item.",
    ],
    rationale: "Same facts in each. Nova adds the detail that matters most to the customer: there is no gap in shipping.",
  },
  {
    prompt: "I paid with a gift card. Where does the refund go?",
    outs: [
      "Back to the gift card, within 5 business days of the scan. If the card has expired we issue store credit for the same amount.",
      "The refund returns to your gift card within 5 business days. Expired cards are reissued as store credit.",
      "Your gift card is credited within 5 business days. We switch to store credit if the card has expired.",
    ],
    rationale: "Correct and complete from all three. Differences are in phrasing only.",
  },
  {
    prompt: "Why was my refund $4 less than what I paid?",
    outs: [
      "Delivery fees are refunded only on faulty items. Your $4 was the standard delivery charge, so it stays with the order. I can review it if the item was faulty.",
      "The $4 difference is the delivery fee, which is not refundable on standard returns.",
      "That $4 is the original delivery charge, which we keep unless the item was faulty. Tell me if it was and I will take another look.",
    ],
    rationale: "Atlas states the rule but leaves out the faulty-item exception that Nova and Sage mention.",
  },
]

function caseAt(i: number): Case {
  if (AUTHORED[i]) return AUTHORED[i]
  const p = POOL[i % POOL.length]
  return { id: caseId(i), hl: [], ...p }
}

const REGRESSIONS = REG_IDX.map((i) => ({ i, id: caseId(i), delta: DATA.cor[CAND][i] - DATA.cor[0][i], title: AUTHORED[i].prompt }))

function delta(m: Metric, v: number, b: number): { text: string; tone: "ok" | "bad" | "flat" } {
  const d = m.rel ? ((v - b) / b) * 100 : v - b
  if (m.rel ? Math.abs(d) < 1 : Math.abs(d) < 0.005) return { text: "= flat", tone: "flat" }
  const txt = m.rel ? `${Math.abs(d).toFixed(0)}%` : Math.abs(d).toFixed(2)
  return { text: `${d > 0 ? "▲ +" : "▼ −"}${txt}`, tone: (m.higher ? d > 0 : d < 0) ? "ok" : "bad" }
}

/* -------------------------------------------------------------------------- */
/*                                   Hooks                                    */
/* -------------------------------------------------------------------------- */

function useMatch(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Counts to `value` with one tiny overshoot-and-return. Starts at the final value, so it never hides content. */
function useSettle(value: number, reduced: boolean) {
  const [shown, setShown] = React.useState(value)
  const from = React.useRef(0)
  React.useEffect(() => {
    if (reduced) return
    const f = from.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900)
      const c = 1 - Math.pow(1 - t, 3)
      const os = 0.02 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.55) / 0.45)))
      const v = t >= 1 ? value : f + (value - f) * (c + os)
      from.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  return reduced ? value : shown
}

function Num({ value, fmt = (n: number) => String(Math.round(n)), reduced }: { value: number; fmt?: (n: number) => string; reduced: boolean }) {
  const v = useSettle(value, reduced)
  return <span>{fmt(v)}</span>
}

/* -------------------------------------------------------------------------- */
/*                                Small helpers                               */
/* -------------------------------------------------------------------------- */

function Crops() {
  return (
    <>
      <i className="iel-crop tl" />
      <i className="iel-crop tr" />
      <i className="iel-crop bl" />
      <i className="iel-crop br" />
    </>
  )
}

/** Ink marks tell the models apart: filled square, hollow square, cross. */
function Mark({ k }: { k: number }) {
  return <i className={`iel-mk k${k}`} aria-hidden="true" />
}

function Hl({ text, hl }: { text: string; hl: string[] }) {
  if (!hl.length) return <>{text}</>
  const re = new RegExp(`(${hl.map((h) => h.replace(/[.*+?^${}()|[\]\\$]/g, "\\$&")).join("|")})`)
  return (
    <>
      {text.split(re).map((part, i) =>
        hl.includes(part) ? (
          <mark key={i} className="iel-hl">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  )
}

const Dots = React.memo(function Dots({ model, metric, lo, hi, sel }: { model: number; metric: Metric; lo: number | null; hi: number | null; sel: number }) {
  const vals = DATA[metric.id][model]
  return (
    <>
      {vals.map((v, i) => {
        const x = ((v - metric.d0) / (metric.d1 - metric.d0)) * 100
        const out = lo !== null && hi !== null && (v < lo || v > hi)
        return <i key={i} className={`iel-pt k${model}${out ? " dim" : ""}${i === sel ? " sel" : ""}`} style={{ left: `${x}%`, top: 5 + ((i * 7) % 6) * 7 }} />
      })}
    </>
  )
})

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.iel {
  --iel-paper: #fafafa;
  --iel-sheet: #ffffff;
  --iel-ink: #0a0a0a;
  --iel-signal: #0060e2;
  --iel-accent: var(--iel-signal);
  --iel-surface: var(--iel-sheet);
  --iel-signal-soft: color-mix(in oklab, var(--iel-signal) 12%, transparent);
  --iel-t1: color-mix(in oklab, var(--iel-ink) 92%, transparent);
  --iel-t2: color-mix(in oklab, var(--iel-ink) 64%, transparent);
  --iel-t3: color-mix(in oklab, var(--iel-ink) 44%, transparent);
  --iel-t4: color-mix(in oklab, var(--iel-ink) 22%, transparent);
  --iel-rule: color-mix(in oklab, var(--iel-ink) 14%, transparent);
  --iel-rule-2: color-mix(in oklab, var(--iel-ink) 7%, transparent);
  --iel-ok: #1f8a4c; --iel-warn: #b7791f; --iel-bad: #c4321a;
  --iel-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --iel-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --iel-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --iel-font: var(--iel-sans);
  --iel-ease: cubic-bezier(.2, .8, .2, 1);
  --iel-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --iel-on-signal: #ffffff;
  font: 13px/20px var(--iel-font); color: var(--iel-t1);
  position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden;
  background: var(--iel-paper);
}
:is(.dark, [data-theme="dark"]) .iel {
  --iel-paper: #0c0c0d; --iel-sheet: #1c1c1e; --iel-ink: #f5f5f5; --iel-signal: #4d8dff;
}
.iel *, .iel *::before, .iel *::after { box-sizing: border-box }
:where(.iel) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.iel) input { font: inherit; color: inherit }
.iel :focus-visible { outline: 2px solid color-mix(in oklab, var(--iel-accent) 70%, transparent); outline-offset: 1px }
.iel-mono { font-family: var(--iel-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--iel-t3) }

/* ---- rail ---- */
.iel-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--iel-sheet); border-right: 1px solid var(--iel-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.iel-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--iel-serif); letter-spacing: -.01em; color: var(--iel-ink) }
.iel-brand svg { flex: none }
.iel-group { padding: 0 12px; margin-top: 12px }
.iel-group > .iel-mono { padding: 0 6px; margin-bottom: 6px; display: block }
.iel-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule); background: var(--iel-paper); color: var(--iel-t1); transition: box-shadow .2s var(--iel-ease) }
.iel-ws:hover { box-shadow: 0 0 0 1px var(--iel-t4) }
.iel-ws svg { color: var(--iel-t3) }
.iel-nav { position: relative; margin: 0 0 0 8px; padding: 0 }
.iel-nav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--iel-rule) }
.iel-item { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--iel-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--iel-ease), background-color .2s var(--iel-ease) }
.iel-item:hover { color: var(--iel-t1); background: var(--iel-rule-2) }
.iel-item svg { flex: none; stroke-width: 1.5 }
.iel-item.is-active { color: var(--iel-ink) }
.iel-item.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--iel-accent); transform-origin: top; animation: iel-tick .5s var(--iel-ease) backwards }
.iel-agent { padding-left: 16px }
.iel-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--iel-t4); position: relative }
.iel-dot.ok { background: var(--iel-ok) }
.iel-dot.live { background: var(--iel-accent) }
.iel-dot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--iel-accent); animation: iel-pulse 1.6s var(--iel-ease) infinite }
.iel-agent .iel-mono { margin-left: auto; font-size: 9.5px }
.iel-spacer { flex: 1; min-height: 12px }
.iel-user { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--iel-rule) }
.iel-av { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--iel-ink); color: var(--iel-paper); font: 600 10px/1 var(--iel-mono); letter-spacing: .04em }
.iel-user b { font-weight: 500; color: var(--iel-t1); display: block; line-height: 16px }
.iel-user div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--iel-t3) }
.iel-sidetools { padding: 8px 12px }
.iel-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--iel-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--iel-ease) }

/* ---- main + top bar ---- */
.iel-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column }
.iel-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--iel-rule); background: var(--iel-paper) }
.iel-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule); background: var(--iel-sheet) }
.iel-title { min-width: 0 }
.iel-title .iel-mono { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.iel-title h1 { margin: 0; font: 400 22px/24px var(--iel-serif); letter-spacing: -.01em; color: var(--iel-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iel-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.iel-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule); background: var(--iel-sheet); color: var(--iel-t3); transition: box-shadow .2s var(--iel-ease) }
.iel-search:hover { box-shadow: 0 0 0 1px var(--iel-t4) }
.iel-search span { flex: 1 }
.iel-search kbd { font: 500 10px/14px var(--iel-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule); color: var(--iel-t3) }
.iel-btn { height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule); background: var(--iel-sheet); color: var(--iel-t1); font-weight: 500; transition: box-shadow .2s var(--iel-ease), opacity .2s }
.iel-btn:hover { box-shadow: 0 0 0 1px var(--iel-t3) }
.iel-btn.ink { background: var(--iel-ink); color: var(--iel-paper); box-shadow: none }
.iel-btn.ink:hover { opacity: .88 }
.iel-presence { display: flex; gap: 4px }
.iel-presence .iel-av { position: relative }
.iel-presence .q { background: var(--iel-sheet); color: var(--iel-ink); box-shadow: 0 0 0 1px var(--iel-rule); }
.iel-presence .q::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--iel-accent) }

/* ---- eval lab ---- */
.iel-body { flex: 1; min-height: 0; overflow-y: auto }
.iel-wrap { max-width: 1180px; margin: 0 auto; padding: 22px 24px 48px; display: flex; flex-direction: column; gap: 30px }
.iel-head { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px }
.iel-head h2 { margin: 0; font: 400 26px/30px var(--iel-serif); letter-spacing: -.01em; color: var(--iel-ink) }
.iel-head h2 em { font-style: italic }
.iel-head p { margin: 0; color: var(--iel-t2); font-size: 13px; line-height: 19px }
.iel-panel { position: relative; background: var(--iel-sheet); box-shadow: 0 0 0 1px var(--iel-rule) }
.iel-crop { position: absolute; width: 8px; height: 8px; pointer-events: none; border: 0 solid var(--iel-t4) }
.iel-crop.tl { left: -10px; top: -10px; border-right-width: 1px; border-bottom-width: 1px }
.iel-crop.tr { right: -10px; top: -10px; border-left-width: 1px; border-bottom-width: 1px }
.iel-crop.bl { left: -10px; bottom: -10px; border-right-width: 1px; border-top-width: 1px }
.iel-crop.br { right: -10px; bottom: -10px; border-left-width: 1px; border-top-width: 1px }
.iel-fig { margin: 10px 0 0; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap }
.iel-count { color: var(--iel-t2) }
.iel-count b { color: var(--iel-ink); font-weight: 600 }
.iel-btn:disabled { opacity: .35; cursor: not-allowed }
.iel-btn:disabled:hover { box-shadow: none }
.iel-btn.ghost:disabled:hover { box-shadow: 0 0 0 1px var(--iel-rule) }
.iel-btn { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap }
.iel-btn svg { flex: none }
.iel-btn.spin svg { animation: iel-spin 1s linear infinite }

.iel-readout { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); background: var(--iel-sheet); box-shadow: 0 0 0 1px var(--iel-rule); margin: 0 }
.iel-readout > div { padding: 10px 16px 11px; border-left: 1px solid var(--iel-rule); min-width: 0 }
.iel-readout > div:first-child { border-left: 0 }
.iel-readout dt { font: 10px/14px var(--iel-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iel-t3) }
.iel-readout dd { margin: 0; font: 500 16px/24px var(--iel-mono); font-variant-numeric: tabular-nums; color: var(--iel-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iel-readout dd small { font-size: 10.5px; color: var(--iel-t3); margin-left: 6px; letter-spacing: .08em }
.iel-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 22px; margin-top: 12px }
.iel-lg { position: relative; display: inline-flex; align-items: center; gap: 8px; padding-bottom: 5px; font-weight: 500; color: var(--iel-ink) }
.iel-lg .iel-mono { font-size: 9.5px }
.iel-lg.cand::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--iel-accent) }
.iel-lg.cand .iel-mono { color: var(--iel-accent) }
.iel-mk { display: inline-block; width: 9px; height: 9px; flex: none; position: relative }
.iel-mk.k0 { background: var(--iel-ink) }
.iel-mk.k1 { box-shadow: inset 0 0 0 1.5px var(--iel-ink) }
.iel-mk.k2::before, .iel-mk.k2::after { content: ""; position: absolute; left: -1px; right: -1px; top: 50%; height: 1.5px; margin-top: -.75px; background: var(--iel-ink); transform: rotate(45deg) }
.iel-mk.k2::after { transform: rotate(-45deg) }

/* matrix */
.iel-matrix { display: grid; grid-template-columns: 168px repeat(3, minmax(0, 1fr)) }
.iel-ch { position: relative; display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-left: 1px solid var(--iel-rule-2); font-weight: 500; color: var(--iel-ink) }
.iel-ch .iel-mono { margin-left: auto; font-size: 9.5px }
.iel-ch.cand::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--iel-accent) }
.iel-ch.cand .iel-mono { color: var(--iel-accent) }
.iel-rl { position: relative; display: block; width: 100%; text-align: left; padding: 12px 14px 12px 18px; border-top: 1px solid var(--iel-rule); transition: background-color .2s var(--iel-ease) }
.iel-rl:hover { background: var(--iel-rule-2) }
.iel-rl b { display: block; font-weight: 500; color: var(--iel-ink); font-size: 13.5px; line-height: 18px }
.iel-rl .iel-mono { display: block; font-size: 9.5px; margin-top: 2px }
.iel-rl.sel { background: var(--iel-rule-2) }
.iel-rl.sel::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--iel-accent); animation: iel-tick .5s var(--iel-ease) backwards }
.iel-cell { padding: 11px 14px 10px; border-top: 1px solid var(--iel-rule); border-left: 1px solid var(--iel-rule-2); min-width: 0; transition: background-color .2s var(--iel-ease) }
.iel-cell.sel { background: var(--iel-rule-2) }
.iel-cell .v { display: flex; align-items: baseline; gap: 6px; white-space: nowrap }
.iel-cell .v b { font: 500 17px/22px var(--iel-mono); color: var(--iel-ink); font-variant-numeric: tabular-nums }
.iel-cell .v small { font: 10.5px/14px var(--iel-mono); color: var(--iel-t3) }
.iel-cell .v .pm { margin-left: auto; font: 11px/14px var(--iel-mono); color: var(--iel-t3) }
.iel-bar { position: relative; height: 8px; margin: 7px 0 6px; background: var(--iel-rule-2); box-shadow: inset 0 -1px 0 var(--iel-rule) }
.iel-bar .s { position: absolute; left: 0; top: 0; bottom: 0; background: var(--iel-ink); transform-origin: left; animation: iel-grow .9s var(--iel-ease) backwards }
.iel-bar .b { position: absolute; top: 0; bottom: 0; background: conic-gradient(var(--iel-ink) 25%, transparent 0 50%, var(--iel-ink) 0 75%, transparent 0) 0 0 / 2px 2px; animation: iel-fade .9s var(--iel-ease) backwards }
.iel-bar .t { position: absolute; top: -3px; bottom: -3px; width: 1.5px; margin-left: -.75px; background: var(--iel-ink); animation: iel-fade .9s var(--iel-ease) backwards }
.iel-bar.cand .t { background: var(--iel-accent) }
.iel-d { font: 500 11px/14px var(--iel-mono); font-variant-numeric: tabular-nums; color: var(--iel-t3); white-space: nowrap }
.iel-d.ok { color: var(--iel-ok) }
.iel-d.bad { color: var(--iel-bad) }
.iel-mtx.busy { opacity: .4; transition: opacity .2s }
.iel-scan { position: relative }
.iel-scan-in { animation: iel-unmask .8s var(--iel-ease) backwards }
.iel-scan::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--iel-accent); opacity: 0; animation: iel-sweep .8s var(--iel-ease) backwards; pointer-events: none }
.iel-scan.x .iel-scan-in { animation-name: iel-unmask-x }
.iel-scan.x::after { left: 0; right: auto; top: 0; bottom: 0; width: 1px; height: auto; animation-name: iel-sweep-x }

/* two columns */
.iel-two { display: grid; grid-template-columns: minmax(0, 1fr); gap: 30px }
.iel-dist { padding: 16px 18px 14px }
.iel-axis { position: relative; height: 26px; margin-bottom: 2px }
.iel-axis .tk { position: absolute; left: 0; right: 0; bottom: 0; height: 7px; background:
    repeating-linear-gradient(90deg, var(--iel-t4) 0 1px, transparent 1px 5%) 0 100% / calc(100% + 1px) 4px no-repeat,
    linear-gradient(90deg, var(--iel-t3) 1px, transparent 1px) 0 100% / 25% 7px repeat-x }
.iel-axis .tk::after { content: ""; position: absolute; right: 0; bottom: 0; width: 1px; height: 7px; background: var(--iel-t3) }
.iel-axis span { position: absolute; bottom: 10px; transform: translateX(-50%); font: 10px/12px var(--iel-mono); letter-spacing: .04em; color: var(--iel-t3) }
.iel-axis span:first-child { transform: none }
.iel-axis span:last-child { transform: translateX(-100%) }
.iel-strip { margin-top: 12px }
.iel-sh { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-weight: 500; color: var(--iel-ink) }
.iel-sh .iel-mono { margin-left: auto; font-size: 10px; text-align: right }
.iel-sh .iel-mono b { color: var(--iel-ink); font-weight: 500 }
.iel-plot { position: relative; height: 52px; cursor: crosshair; touch-action: pan-y; user-select: none; background: linear-gradient(90deg, var(--iel-rule-2) 1px, transparent 1px) 0 0 / 25% 100% repeat-x; box-shadow: inset -1px 0 0 var(--iel-rule-2), inset 0 -1px 0 var(--iel-rule) }
.iel-ci { position: absolute; top: 0; bottom: 0; min-width: 3px; background: color-mix(in oklab, var(--iel-ink) 9%, transparent); box-shadow: inset 1px 0 0 var(--iel-t4), inset -1px 0 0 var(--iel-t4) }
.iel-mean { position: absolute; top: -4px; bottom: -4px; width: 1.5px; margin-left: -.75px; background: var(--iel-ink); transition: left .5s var(--iel-ease) }
.iel-mean.cand { background: var(--iel-accent) }
.iel-pt { position: absolute; width: 5px; height: 5px; margin: 0 0 0 -2.5px; opacity: .62; transition: opacity .2s }
.iel-pt.k0 { background: var(--iel-ink) }
.iel-pt.k1 { box-shadow: inset 0 0 0 1px var(--iel-ink) }
.iel-pt.k2 { background: linear-gradient(var(--iel-ink), var(--iel-ink)) 50% 0 / 1px 100% no-repeat, linear-gradient(var(--iel-ink), var(--iel-ink)) 0 50% / 100% 1px no-repeat }
.iel-pt.dim { opacity: .16 }
.iel-pt.sel { opacity: 1; z-index: 2; box-shadow: 0 0 0 2px var(--iel-sheet), 0 0 0 3.5px var(--iel-accent) }
.iel-pt.k1.sel { box-shadow: inset 0 0 0 1px var(--iel-ink), 0 0 0 2px var(--iel-sheet), 0 0 0 3.5px var(--iel-accent) }
.iel-brush { position: absolute; top: 0; bottom: 0; background: color-mix(in oklab, var(--iel-accent) 6%, transparent); box-shadow: inset 1px 0 0 var(--iel-accent), inset -1px 0 0 var(--iel-accent); pointer-events: none }
.iel-brushbar { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--iel-rule); min-height: 36px; flex-wrap: wrap }
.iel-brushbar .iel-mono b { color: var(--iel-ink); font-weight: 500 }
.iel-link { font: 500 10.5px/14px var(--iel-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iel-t2); padding: 3px 7px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule); background: var(--iel-sheet); transition: box-shadow .2s var(--iel-ease) }
.iel-link:hover { box-shadow: 0 0 0 1px var(--iel-t3); color: var(--iel-ink) }

/* regressions */
.iel-regs { padding: 0 }
.iel-reg { position: relative; display: grid; grid-template-columns: 16px 62px minmax(0, 1fr) auto; align-items: center; gap: 8px; width: 100%; padding: 11px 16px 11px 18px; border-top: 1px solid var(--iel-rule); text-align: left; transition: background-color .2s var(--iel-ease) }
.iel-reg:first-of-type { border-top: 0 }
.iel-reg:hover { background: var(--iel-rule-2) }
.iel-reg.sel { background: var(--iel-rule-2) }
.iel-reg.sel::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--iel-accent); animation: iel-tick .5s var(--iel-ease) backwards }
.iel-reg .st { width: 12px; height: 12px; display: grid; place-items: center; color: var(--iel-ok) }
.iel-reg .st.open { width: 6px; height: 6px; margin: 3px; border-radius: 50%; background: var(--iel-warn) }
.iel-reg .id { font: 500 11.5px/16px var(--iel-mono); color: var(--iel-ink); letter-spacing: .02em }
.iel-reg .tt { color: var(--iel-t2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iel-reg .dl { font: 500 11.5px/16px var(--iel-mono); color: var(--iel-bad); font-variant-numeric: tabular-nums }
.iel-regfoot { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px 10px 18px; border-top: 1px solid var(--iel-rule); gap: 8px; flex-wrap: wrap }
.iel-regfoot .iel-mono b { color: var(--iel-ink); font-weight: 600 }

/* inspector */
.iel-insp { display: flex; flex-direction: column; gap: 22px }
.iel-prompt { padding: 14px 18px 16px }
.iel-prompt p { margin: 4px 0 0; font: 400 15px/24px var(--iel-sans); color: var(--iel-ink); text-wrap: pretty }
.iel-outs { display: grid; grid-template-columns: minmax(0, 1fr); gap: 22px }
.iel-out { padding: 14px 16px 14px; display: flex; flex-direction: column; gap: 10px; animation: iel-settle .35s var(--iel-ease) backwards }
.iel-out header { display: flex; align-items: center; gap: 8px; font-weight: 500; color: var(--iel-ink) }
.iel-out header .iel-mono { margin-left: auto; font-size: 9.5px }
.iel-out.cand { }
.iel-out.cand header .iel-mono { color: var(--iel-accent) }
.iel-out p { margin: 0; font-size: 14px; line-height: 22px; color: var(--iel-t1); text-wrap: pretty; flex: 1 }
.iel-hl { background: none; color: inherit; text-decoration: underline wavy var(--iel-bad); text-decoration-thickness: 1px; text-underline-offset: 3px }
.iel-chips { display: flex; gap: 6px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--iel-rule) }
.iel-chips span { font: 10.5px/14px var(--iel-mono); letter-spacing: .04em; color: var(--iel-t3); padding: 1px 5px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iel-rule-2); font-variant-numeric: tabular-nums }
.iel-chips span b { font-weight: 500; color: var(--iel-ink) }
.iel-chips span.low b { color: var(--iel-bad) }
.iel-judge { position: relative; max-width: 620px; margin-left: 16px; padding: 2px 0 0 16px; border-left: 1px solid var(--iel-t4) }
.iel-judge::before { content: ""; position: absolute; left: -1px; top: -22px; width: 1px; height: 22px; background: var(--iel-t4) }
.iel-judge q { display: block; quotes: none; font: italic 400 19px/25px var(--iel-serif); color: var(--iel-t1); margin-top: 4px }
.iel-judge .acts { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap }
.iel-judge .iel-btn { height: 28px }

@keyframes iel-pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes iel-tick { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes iel-settle { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes iel-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes iel-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes iel-spin { to { transform: rotate(360deg) } }
@keyframes iel-unmask { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes iel-unmask-x { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes iel-sweep { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: 100%; opacity: 0 } }
@keyframes iel-sweep-x { 0% { left: 0; opacity: 1 } 85% { opacity: 1 } 100% { left: 100%; opacity: 0 } }

@media (min-width: 1100px) {
  .iel-two { grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); align-items: start }
  .iel-outs { grid-template-columns: repeat(3, minmax(0, 1fr)) }
  .iel-judge { margin-left: calc((100% - 44px) / 3 + 46px) }
}
@media (max-width: 1099px) {
  .iel-count { display: none }
}
@media (max-width: 1023px) {
  .iel-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--iel-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--iel-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .iel.is-open .iel-rail { transform: none; visibility: visible; transition: transform .32s var(--iel-ease), visibility 0s }
  .iel.is-open .iel-scrim { opacity: 1; pointer-events: auto }
  .iel-menu { display: grid }
}
@media (max-width: 1099px) { .iel-search { display: none } }
@media (max-width: 767px) {
  .iel-top { padding: 0 12px; gap: 10px }
  .iel-title .iel-mono { display: none }
  .iel-title h1 { font-size: 21px }
  .iel-presence, .iel-share { display: none }
  .iel-wrap { padding: 16px 16px 36px; gap: 26px }
  .iel-readout { grid-template-columns: repeat(2, minmax(0, 1fr)) }
  .iel-readout > div { border-left: 0; border-top: 1px solid var(--iel-rule) }
  .iel-readout > div:nth-child(even) { border-left: 1px solid var(--iel-rule) }
  .iel-readout > div:nth-child(-n+2) { border-top: 0 }
  .iel-readout > div:last-child { grid-column: 1 / -1; border-left: 0 }
  .iel-matrix { grid-template-columns: 92px repeat(3, minmax(0, 1fr)) }
  .iel-ch { padding: 10px 8px; gap: 5px; font-size: 12px }
  .iel-ch .iel-mono { display: none }
  .iel-rl { padding: 10px 6px 10px 12px }
  .iel-rl b { font-size: 12.5px }
  .iel-rl .iel-mono { display: none }
  .iel-cell { padding: 10px 8px 9px }
  .iel-cell .v b { font-size: 13px }
  .iel-cell .v small, .iel-cell .v .pm { display: none }
  .iel-d { font-size: 10px }
  .iel-dist { padding: 14px 12px 12px }
  .iel-brushbar { margin-top: 12px }
  .iel-btn .lbl { display: none }
  .iel-btn.rerun { gap: 0 }
  .iel-btn.rerun { padding: 0 9px }
}
@media (prefers-reduced-motion: reduce) {
  .iel *, .iel *::before, .iel *::after { animation: none !important; transition: none !important }
}
.iel-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px }
.iel-link.on { background: var(--iel-ink); color: var(--iel-paper); box-shadow: none }
`

/* -------------------------------------------------------------------------- */
/*                                    Shell                                   */
/* -------------------------------------------------------------------------- */

const NAV = [
  { label: "Mission control", icon: Radar },
  { label: "Research desk", icon: BookOpenText },
  { label: "Workbench", icon: PenLine },
  { label: "Evals", icon: FlaskConical },
]

const OPS = [
  { label: "Tasks", icon: ListChecks },
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Accounting", icon: Landmark },
  { label: "Finance", icon: Wallet },
]

const AGENTS: { name: string; state: "live" | "ok" | "off"; note: string }[] = [
  { name: "Atlas", state: "live", note: "Judging" },
  { name: "Sage", state: "ok", note: "Idle" },
  { name: "Quill", state: "off", note: "Paused" },
]

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--iel-accent)" strokeWidth="1.5" />
    </svg>
  )
}

function Shell({
  active,
  crumb,
  title,
  actions,
  onNavigate,
  sideTools,
  ask,
  children,
}: {
  active: string
  crumb: string
  title: string
  actions: React.ReactNode
  onNavigate?: (label: string) => void
  sideTools?: React.ReactNode
  ask?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const narrow = useMatch("(max-width: 1023px)")
  const hidden = narrow && !open
  return (
    <div
      className={`iel${open ? " is-open" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) setOpen(false)
      }}
    >
      <style href="eval-lab" precedence="default">
        {CSS}
      </style>
      <div className="iel-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="iel-rail" aria-label="Meridian navigation" inert={hidden}>
        <div className="iel-brand">
          <Glyph />
          Meridian
        </div>
        <div className="iel-group" style={{ marginTop: 4 }}>
          <span className="iel-mono">Workspace</span>
          <button type="button" className="iel-ws" aria-label="Switch workspace">
            Harbor &amp; Finch
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="iel-group" aria-label="Console">
          <span className="iel-mono">Console</span>
          <div className="iel-nav">
            {NAV.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className={`iel-item${label === active ? " is-active" : ""}`}
                aria-current={label === active ? "page" : undefined}
                onClick={() => {
                  setOpen(false)
                  onNavigate?.(label)
                }}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="iel-group" aria-label="Operations">
          <span className="iel-mono">Operations</span>
          <div className="iel-nav">
            {OPS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="iel-item"
                onClick={() => {
                  setOpen(false)
                  onNavigate?.(label)
                }}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="iel-group" aria-label="Agents">
          <span className="iel-mono">Agents</span>
          <div className="iel-nav">
            {AGENTS.map((a) => (
              <button
                key={a.name}
                type="button"
                className="iel-item iel-agent"
                onClick={() => {
                  setOpen(false)
                  onNavigate?.(a.name)
                }}
              >
                <span className={`iel-dot ${a.state}`} aria-hidden="true" />
                {a.name}
                <span className="iel-mono">{a.note}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="iel-spacer" />
        {sideTools ? <div className="iel-sidetools">{sideTools}</div> : null}
        <div className="iel-user">
          <span className="iel-av" aria-hidden="true">
            AO
          </span>
          <div>
            <b>Ada Okafor</b>
            <span>Product lead</span>
          </div>
        </div>
      </aside>
      <div className="iel-main">
        <header className="iel-top">
          <button type="button" className="iel-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={16} strokeWidth={1.5} />
          </button>
          <div className="iel-title">
            <span className="iel-mono">{crumb}</span>
            <h1>{title}</h1>
          </div>
          <div className="iel-actions">
            <button type="button" className="iel-search" aria-label="Search, command K">
              <Search size={14} strokeWidth={1.5} />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            {actions}
          </div>
        </header>
        {children}
        {ask}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Eval Lab                                  */
/* -------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function Head({ label, title, em, line }: { label: string; title: string; em: string; line: string }) {
  return (
    <div className="iel-head">
      <span className="iel-mono">{label}</span>
      <h2>
        {title} <em>{em}</em>
      </h2>
      <p>{line}</p>
    </div>
  )
}

export function EvalLab({ onNavigate, sideTools }: EvalLabProps) {
  const reduced = useMatch("(prefers-reduced-motion: reduce)")
  const [mi, setMi] = React.useState(0)
  const [sel, setSel] = React.useState(86)
  const [brush, setBrush] = React.useState<[number, number] | null>(null)
  const [reviewed, setReviewed] = React.useState<string[]>(["C-0087", "C-0142"])
  const [run, setRun] = React.useState(412)
  const [progress, setProgress] = React.useState<number | null>(null)
  const [shipped, setShipped] = React.useState(false)
  const drag = React.useRef<{ f0: number; moved: boolean; model: number } | null>(null)
  const tick = React.useRef({ n: 0, id: 0 as unknown as ReturnType<typeof setInterval> })

  const metric = METRICS[mi]
  const running = progress !== null
  const nRev = REGRESSIONS.filter((r) => reviewed.includes(r.id)).length
  const allReviewed = nRev === REGRESSIONS.length
  const c = caseAt(sel)
  const isReg = REG_IDX.includes(sel)
  const isRev = reviewed.includes(c.id)

  React.useEffect(() => {
    const t = tick.current
    return () => clearInterval(t.id)
  }, [])

  const rerun = () => {
    if (running) return
    const t = tick.current
    t.n = 0
    setProgress(0)
    t.id = setInterval(() => {
      t.n += 7
      if (t.n >= 100) {
        clearInterval(t.id)
        setRun((r) => r + 1)
        setProgress(null)
      } else setProgress(t.n)
    }, 90)
  }

  const lo = brush ? metric.d0 + brush[0] * (metric.d1 - metric.d0) : null
  const hi = brush ? metric.d0 + brush[1] * (metric.d1 - metric.d0) : null
  const frac = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { f: clamp01((e.clientX - r.left) / r.width), w: r.width }
  }
  const plotDown = (model: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { f0: frac(e).f, moved: false, model }
  }
  const plotMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const { f, w } = frac(e)
    if (!d.moved && Math.abs(f - d.f0) * w < 4) return
    d.moved = true
    setBrush([Math.min(f, d.f0), Math.max(f, d.f0)])
  }
  const plotUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.moved) return
    const target = metric.d0 + frac(e).f * (metric.d1 - metric.d0)
    let best = -1
    let bd = Infinity
    DATA[metric.id][d.model].forEach((v, i) => {
      const dd = Math.abs(v - target)
      if (dd < bd) {
        bd = dd
        best = i
      }
    })
    if (best >= 0 && bd <= 0.02 * (metric.d1 - metric.d0)) setSel(best)
    else setBrush(null)
  }

  const fmtLim = (v: number) => (metric.id === "lat" ? `${Math.round(v)}` : metric.id === "cost" ? `$${v.toFixed(4)}` : v.toFixed(2))
  const counts = MODELS.map((_, m) => (lo === null || hi === null ? 0 : DATA[metric.id][m].filter((v) => v >= lo && v <= hi).length))

  const actions = (
    <>
      <span className="iel-mono iel-count" aria-live="polite">
        <b>{nRev}</b> of {REGRESSIONS.length} reviewed
      </span>
      <button type="button" className={`iel-btn rerun${running ? " spin" : ""}`} onClick={rerun} disabled={running} aria-label="Re-run suite">
        <RotateCw size={14} strokeWidth={1.5} />
        <span className="lbl">{running ? "Running" : "Re-run"}</span>
      </button>
      <button
        type="button"
        className="iel-btn ink"
        disabled={!allReviewed || shipped || running}
        title={allReviewed ? "Ship the candidate prompt" : "Review every regression to enable shipping"}
        onClick={() => setShipped(true)}
      >
        {shipped ? "Shipped" : "Ship candidate"}
      </button>
    </>
  )

  return (
    <Shell active="Evals" crumb="CONSOLE / EVALS" title="Eval Lab" actions={actions} onNavigate={onNavigate} sideTools={sideTools}>
      <div className="iel-body">
        <div className="iel-wrap">
          {/* run readout + legend */}
          <section aria-label="Run summary">
            <dl className="iel-readout">
              <div>
                <dt>Suite</dt>
                <dd>support-replies-v7</dd>
              </div>
              <div>
                <dt>Cases</dt>
                <dd>
                  <Num value={N_CASES} reduced={reduced} />
                </dd>
              </div>
              <div>
                <dt>Models</dt>
                <dd>
                  <Num value={MODELS.length} reduced={reduced} />
                </dd>
              </div>
              <div>
                <dt>Judge</dt>
                <dd>Atlas-judge</dd>
              </div>
              <div>
                <dt>Run</dt>
                <dd>
                  {String(run).padStart(4, "0")}
                  {running ? <small>{progress}%</small> : shipped ? <small>SHIPPED</small> : null}
                </dd>
              </div>
            </dl>
            <div className="iel-legend" role="list" aria-label="Models">
              {MODELS.map((m, i) => (
                <span key={m.id} role="listitem" className={`iel-lg${i === CAND ? " cand" : ""}`}>
                  <Mark k={i} />
                  {m.name}
                  <span className="iel-mono">{m.role}</span>
                </span>
              ))}
              <span className="iel-mono" style={{ marginLeft: "auto" }}>
                FIG. 1 — Marks used in every figure
              </span>
            </div>
          </section>

          {/* matrix */}
          <section aria-label="Score matrix">
            <Head label="Score matrix" title="How each model" em="scored" line="Mean per metric over 240 cases. Pick a row to see every case behind it." />
            <div className="iel-panel">
              <Crops />
              <div className="iel-scan" key={run}>
                <div className="iel-scan-in">
                  <div className={`iel-matrix iel-mtx${running ? " busy" : ""}`} role="table" aria-label="Scores by metric and model">
                    <div style={{ display: "contents" }} role="row">
                      <div className="iel-ch" role="columnheader">
                        <span className="iel-mono">Metric</span>
                      </div>
                      {MODELS.map((m, i) => (
                        <div key={m.id} className={`iel-ch${i === CAND ? " cand" : ""}`} role="columnheader">
                          <Mark k={i} />
                          {m.name}
                          <span className="iel-mono">{m.role}</span>
                        </div>
                      ))}
                    </div>
                    {METRICS.map((m, r) => {
                      const base = STATS[m.id][0]
                      const span = m.d1 - m.d0
                      return (
                        <div key={m.id} style={{ display: "contents" }} role="row">
                          <div role="rowheader" style={{ display: "contents" }}>
                            <button type="button" className={`iel-rl${r === mi ? " sel" : ""}`} aria-pressed={r === mi} onClick={() => setMi(r)}>
                              <b>{m.label}</b>
                              <span className="iel-mono">{m.hint}</span>
                            </button>
                          </div>
                          {MODELS.map((mo, i) => {
                            const s = STATS[m.id][i]
                            const left = clamp01((s.mean - s.sd - m.d0) / span) * 100
                            const right = clamp01((s.mean + s.sd - m.d0) / span) * 100
                            const d = i === 0 ? null : delta(m, s.mean, base.mean)
                            return (
                              <div key={mo.id} role="cell" className={`iel-cell${r === mi ? " sel" : ""}`}>
                                <div className="v">
                                  <b>
                                    <Num value={s.mean} fmt={m.fmt} reduced={reduced} />
                                  </b>
                                  <small>{m.unit}</small>
                                  <span className="pm">{m.sd(s.sd)}</span>
                                </div>
                                <div className={`iel-bar${i === CAND ? " cand" : ""}`} aria-hidden="true">
                                  <i className="s" style={{ width: `${left}%` }} />
                                  <i className="b" style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }} />
                                  <i className="t" style={{ left: `${clamp01((s.mean - m.d0) / span) * 100}%` }} />
                                </div>
                                {d ? <span className={`iel-d ${d.tone}`}>{d.text}</span> : <span className="iel-d">BASELINE</span>}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <p className="iel-fig iel-mono">
              <span>FIG. 2 — Solid = mean − 1 sd · dither = ±1 sd · tick = mean</span>
              <span>▲ ▼ change vs Nova · green better, red worse</span>
            </p>
          </section>

          {/* distribution + regressions */}
          <div className="iel-two">
            <section aria-label="Distribution">
              <Head label="Distribution" title="Every case, one" em="dot" line="Drag across a strip to brush a range. Click a dot to open that case." />
              <div className="iel-panel iel-dist">
                <Crops />
                <div className="iel-tabs" role="group" aria-label="Metric">
                  {METRICS.map((m, i) => (
                    <button key={m.id} type="button" className={`iel-link${i === mi ? " on" : ""}`} aria-pressed={i === mi} onClick={() => setMi(i)}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="iel-axis" aria-hidden="true">
                  <div className="tk" />
                  {metric.ticks.map((t) => (
                    <span key={t} style={{ left: `${((t - metric.d0) / (metric.d1 - metric.d0)) * 100}%` }}>
                      {metric.axis(t)}
                    </span>
                  ))}
                </div>
                <div className="iel-scan x" key={`${metric.id}-${run}`}>
                  <div className="iel-scan-in">
                    {MODELS.map((mo, m) => {
                      const s = STATS[metric.id][m]
                      const span = metric.d1 - metric.d0
                      return (
                        <div className="iel-strip" key={mo.id}>
                          <div className="iel-sh">
                            <Mark k={m} />
                            {mo.name}
                            <span className="iel-mono">
                              Mean <b>{fmtLim(s.mean)}</b> · 95% CI {fmtLim(s.mean - s.ci)}–{fmtLim(s.mean + s.ci)}
                            </span>
                          </div>
                          <div className="iel-plot" onPointerDown={plotDown(m)} onPointerMove={plotMove} onPointerUp={plotUp} onPointerCancel={() => (drag.current = null)}>
                            <div className="iel-ci" style={{ left: `${clamp01((s.mean - s.ci - metric.d0) / span) * 100}%`, width: `${(2 * s.ci * 100) / span}%` }} />
                            <Dots model={m} metric={metric} lo={lo} hi={hi} sel={sel} />
                            <div className={`iel-mean${m === CAND ? " cand" : ""}`} style={{ left: `${clamp01((s.mean - metric.d0) / span) * 100}%` }} />
                            {brush ? <div className="iel-brush" style={{ left: `${brush[0] * 100}%`, width: `${(brush[1] - brush[0]) * 100}%` }} /> : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="iel-brushbar" aria-live="polite">
                  {brush && lo !== null && hi !== null ? (
                    <>
                      <span className="iel-mono">
                        Brush <b>{fmtLim(lo)}–{fmtLim(hi)}</b> ·{" "}
                        {MODELS.map((mo, m) => (
                          <span key={mo.id}>
                            {m ? " · " : ""}
                            {mo.name} <b>{counts[m]}</b>
                          </span>
                        ))}
                      </span>
                      <button type="button" className="iel-link" style={{ marginLeft: "auto" }} onClick={() => setBrush(null)}>
                        Clear
                      </button>
                    </>
                  ) : (
                    <span className="iel-mono">Selected {c.id} · ring marks the same case in every strip</span>
                  )}
                </div>
              </div>
              <p className="iel-fig iel-mono">
                <span>FIG. 3 — {metric.label}, {N_CASES} cases per model</span>
                <span>Band = 95% CI of the mean</span>
              </p>
            </section>

            <section aria-label="Regressions">
              <Head label="Regressions" title="Where the candidate" em="slipped" line="Cases where Atlas scored 0.25 or more below Nova on correctness." />
              <div className="iel-panel iel-regs">
                <Crops />
                {REGRESSIONS.map((r) => (
                  <button key={r.id} type="button" className={`iel-reg${r.i === sel ? " sel" : ""}`} aria-pressed={r.i === sel} onClick={() => setSel(r.i)}>
                    <span className={`st${reviewed.includes(r.id) ? "" : " open"}`} aria-label={reviewed.includes(r.id) ? "Reviewed" : "Not reviewed"}>
                      {reviewed.includes(r.id) ? <Check size={12} strokeWidth={1.5} /> : null}
                    </span>
                    <span className="id">{r.id}</span>
                    <span className="tt">{r.title}</span>
                    <span className="dl">▼ −{Math.abs(r.delta).toFixed(2)}</span>
                  </button>
                ))}
                <div className="iel-regfoot">
                  <span className="iel-mono">
                    <b>{nRev}</b> of {REGRESSIONS.length} reviewed
                  </span>
                  <span className="iel-mono">{allReviewed ? (shipped ? "Candidate shipped" : "Ready to ship") : "Review all to ship"}</span>
                </div>
              </div>
              <p className="iel-fig iel-mono">
                <span>FIG. 4 — Correctness delta, Atlas vs Nova</span>
              </p>
            </section>
          </div>

          {/* inspector */}
          <section aria-label="Sample inspector" className="iel-insp">
            <Head label={`Sample inspector · ${c.id}`} title="Same prompt, three" em="answers" line="What each model replied, with the judge’s reasoning in the margin." />
            <div className="iel-panel iel-prompt">
              <Crops />
              <span className="iel-mono">Prompt · customer message</span>
              <p>{c.prompt}</p>
            </div>
            <div className="iel-outs" key={c.id}>
              {MODELS.map((mo, m) => (
                <article key={mo.id} className={`iel-panel iel-out${m === CAND ? " cand" : ""}`} style={{ animationDelay: `${m * 70}ms` }}>
                  <Crops />
                  <header>
                    <Mark k={m} />
                    {mo.name}
                    <span className="iel-mono">{mo.role}</span>
                  </header>
                  <p>
                    <Hl text={c.outs[m]} hl={m === CAND ? c.hl : []} />
                  </p>
                  <div className="iel-chips">
                    {(["cor", "ton", "pol"] as const).map((id, j) => {
                      const v = DATA[id][m][sel]
                      return (
                        <span key={id} className={v < 0.6 ? "low" : ""}>
                          {["COR", "TON", "POL"][j]} <b>{v.toFixed(2)}</b>
                        </span>
                      )
                    })}
                  </div>
                </article>
              ))}
            </div>
            <div className="iel-judge">
              <span className="iel-mono">Judge · Atlas-judge</span>
              <q>{c.rationale}</q>
              <div className="acts">
                {isReg ? (
                  <button type="button" className={`iel-btn${isRev ? "" : " ink"}`} disabled={isRev} onClick={() => setReviewed((r) => (r.includes(c.id) ? r : [...r, c.id]))}>
                    {isRev ? "Reviewed" : "Mark reviewed"}
                  </button>
                ) : (
                  <span className="iel-mono">Not a regression · no review needed</span>
                )}
                <span className="iel-mono">FIG. 5 — {c.id}, scored by Atlas-judge</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Shell>
  )
}

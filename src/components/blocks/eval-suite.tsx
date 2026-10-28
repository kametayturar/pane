"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bug,
  Check,
  ChevronDown,
  CircleAlert,
  Cpu,
  Link2,
  LoaderCircle,
  Play,
  RotateCcw,
  Square,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type EvalOutcome = "pass" | "fail" | "error"

export type EvalModel = {
  name: string
  /** A small mark (13px) drawn before the name. Defaults to a neutral chip glyph. */
  mark?: React.ReactNode
}

export type EvalCase = {
  id: string
  category: string
  title: string
  /** What this case scored on the baseline version. */
  baseline: EvalOutcome
  /** Add `input`, `expected`, `baselineOutput` and `baselineScores` to give the case a side by side drilldown. */
  input?: string
  expected?: string
  baselineOutput?: string
  /** One score (1 to 5) per rubric criterion. */
  baselineScores?: number[]
}

export type EvalSuiteData = {
  name: string
  candidate: { version: string; model: EvalModel }
  baseline: { version: string; model: EvalModel }
  judge: EvalModel
  /** Row order of the grid. Defaults to the order categories first appear in `cases`. */
  categories?: string[]
  /** Criteria the judge scores from 1 to 5. */
  rubric?: string[]
  cases: EvalCase[]
  /** Shown before the first run. */
  estimate?: { costUsd: number; seconds: number }
}

export type EvalRunRecord = {
  id: string
  label: string
  /** Pass rate in percent. */
  score: number
  date?: string
}

export type EvalCaseResult = {
  caseId: string
  outcome: EvalOutcome
  /** The candidate's reply, shown beside the baseline's. */
  output?: string
  /** One score (1 to 5) per rubric criterion. */
  scores?: number[]
  rationale?: string
  error?: string
  costUsd?: number
}

export type EvalRunContext = {
  signal: AbortSignal
  /** Call it when a case goes in flight so its cell breathes. */
  started: (caseId: string) => void
}

export type EvalFilter = "all" | "failed" | "regressions" | "improved"

export type EvalSuiteProps = {
  /** The suite. Leave it out for a sample support-agent suite that runs a simulated eight-worker run. */
  suite?: EvalSuiteData
  /** Earlier runs, oldest first. The sparkline shows the last seven plus the current run and rings the last one as the baseline. */
  runs?: EvalRunRecord[]
  /**
   * Runs the suite. Yield each result as it is scored to fill the grid live (any order), or resolve them all at once.
   * Stop aborts the signal. Throw to show the failed state with Try again. Without it the run is simulated.
   */
  onRun?: (suite: EvalSuiteData, context: EvalRunContext) => AsyncIterable<EvalCaseResult> | Promise<EvalCaseResult[]>
  /** Called by Mark as expected and Open issue. Return an issue key such as "SUP-2481"; reject to restore the buttons. Without it triage is simulated. */
  onTriage?: (caseId: string, action: "expected" | "issue") => void | string | Promise<void | string>
  /** The filter the case list opens with. */
  defaultFilter?: EvalFilter
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

const CATS = [
  { name: "Refunds", slug: "refunds", fails: [5, 17] as number[] },
  { name: "Shipping", slug: "shipping", fails: [3, 12, 20] as number[] },
  { name: "Tone", slug: "tone", fails: [4, 9, 15, 22] as number[] },
  { name: "Escalation", slug: "escalation", fails: [2, 8, 13, 19, 23] as number[] },
  { name: "Tool use", slug: "tools", fails: [1, 6, 10, 14, 18, 21] as number[] },
]
const POOLS: Record<string, string[]> = {
  refunds: ["Refund within the return window", "Refund after the window closes", "Refund to a different card", "Duplicate charge", "Refund for a gift order", "Refund with store credit", "Refund after a price drop", "Chargeback warning", "Refund for a digital item", "Refund on a final-sale item", "Return label request", "Refund status check"],
  shipping: ["Where is my order", "Delivery date change", "Carrier says delivered", "Damaged on arrival", "Address change before dispatch", "International customs fee", "Pickup point instead of home", "Split shipment", "Backorder timing", "Express upgrade", "Signature required", "Package left outside"],
  tone: ["Frustrated first message", "Very short question", "Customer writes in capitals", "Thank you only", "Compliment and a complaint", "Sarcastic reply", "Formal business tone", "Casual tone with emoji", "Apology after a delay", "Declining politely", "Sensitive health mention", "Non-native English"],
  escalation: ["Asks for a manager", "Repeated contact, same issue", "Threatens to cancel", "Mentions a press contact", "Safety concern", "Billing dispute over limit", "Account locked out", "Fraud suspicion", "VIP customer flag", "Out-of-policy exception", "Asks for a call back", "Complaint about an agent"],
  tools: ["Look up an order first", "Check stock before promising", "Create a ticket with fields", "Ask before cancelling", "Use the right refund tool", "Retry after a tool error", "No tools for small talk", "Stop after two failed calls", "Pass the right order id", "Summarise tool output", "Respect the refund limit", "Hand off with context"],
}
const CONTEXTS = ["on mobile", "in Spanish", "with two items", "after a delay", "with a typo in the id", "from a business account", "for a returning customer", "asked twice", "with a screenshot", "outside office hours", "during a sale", "with an old order"]
const RUBRIC = ["Correctness", "Policy", "Tone", "Completeness"]

type Detail = {
  title: string
  input: string
  expected: string
  baselineOutput: string
  output: string
  baselineScores: number[]
  scores: number[]
  rationale: string
}

const DETAILS: Record<string, Detail> = {
  "refunds-02": {
    title: "Refund for a missing mug",
    input: "Order #20817 arrived with one of the two mugs missing. Can I just get the missing one refunded?",
    expected: "Refund only the missing mug at its listed price and say the other mug stays with the customer.",
    baselineOutput: "Sorry about the missing mug. I've refunded $18.00 for it to your original card, and it should show up in 5 to 7 business days. Please keep the one that arrived.",
    output: "Sorry about the missing mug. I've refunded $64.00 for order #20817 to your original card, and it should show up in 5 to 7 business days.",
    baselineScores: [5, 5, 4, 5],
    scores: [1, 1, 4, 3],
    rationale: "v12 refunds the whole order total instead of the one missing mug, which breaks the partial shipment policy, and it never says the other mug stays with the customer.",
  },
  "refunds-07": {
    title: "Refund to an expired card",
    input: "My card on file expired last month. Where does the refund for order #20955 go?",
    expected: "Explain that the refund still reaches the account behind the old card, or offer store credit, and set a 10 day expectation.",
    baselineOutput: "Your bank will still receive the refund even though the card has expired. It usually lands within 10 days, or I can issue store credit today if you prefer.",
    output: "I can't refund to an expired card. Please send me your new card number and I'll process the refund.",
    baselineScores: [5, 5, 5, 4],
    scores: [2, 1, 3, 2],
    rationale: "v12 asks the customer to type a card number into the chat, which the policy forbids, and misses that the refund can still reach the old account.",
  },
  "refunds-11": {
    title: "Partial refund on a bundle",
    input: "I only want to return the lamp from the Desk Set bundle. What do I get back?",
    expected: "Prorate the bundle discount: the lamp's share of the bundle price, not its list price.",
    baselineOutput: "The lamp's share of the Desk Set price is $41.20, so that's what I'll refund. The discount stays with the items you keep.",
    output: "I've refunded the lamp's list price of $59.00 to your card.",
    baselineScores: [5, 5, 4, 5],
    scores: [2, 3, 4, 3],
    rationale: "v12 uses the list price and ignores the bundle discount, so the customer is refunded more than they paid.",
  },
  "refunds-15": {
    title: "Subscription refund mid cycle",
    input: "I cancelled on the 9th but was billed on the 1st. Can I get the unused days back?",
    expected: "Prorate the unused days of the current period and confirm the plan ends at period close.",
    baselineOutput: "You used 8 of 30 days, so I've refunded $23.20 for the unused 22 days. Your plan ends today.",
    output: "Subscriptions aren't refundable once the period has started, so I'm unable to refund this charge.",
    baselineScores: [5, 5, 4, 5],
    scores: [2, 1, 4, 2],
    rationale: "v12 applies the no-refund rule for annual plans to a monthly plan and refuses a refund the policy allows.",
  },
  "escalation-10": {
    title: "Legal threat over a refund",
    input: "If this refund isn't back by Friday my lawyer will be in touch.",
    expected: "Stay calm, do not admit liability, and hand off to a human with the refund history attached.",
    baselineOutput: "I'm sorry this has dragged on. I'm passing your case to a specialist now, with the full refund history, so you don't have to repeat yourself.",
    output: "Please don't involve a lawyer. We'll definitely have the refund to you by Friday, and I accept this delay was our fault.",
    baselineScores: [5, 5, 5, 5],
    scores: [2, 1, 3, 3],
    rationale: "v12 promises a date it cannot guarantee, admits fault, and never hands the case to a human.",
  },
  "tools-12": {
    title: "Confirm before a destructive call",
    input: "Cancel my subscription and delete my saved cards.",
    expected: "Ask the customer to confirm before calling cancel_subscription or delete_payment_methods.",
    baselineOutput: "Just to be sure: cancelling ends your plan today and deleting cards can't be undone. Shall I go ahead with both?",
    output: "Done. Your subscription is cancelled and your saved cards are deleted.",
    baselineScores: [5, 5, 4, 5],
    scores: [1, 1, 4, 3],
    rationale: "v12 calls both destructive tools without asking for confirmation.",
  },
  "shipping-03": {
    title: "Lost parcel after 14 days",
    input: "Tracking has said 'in transit' for 14 days. Is my parcel lost?",
    expected: "Offer a reship or a refund and open a carrier trace.",
    baselineOutput: "Tracking can be slow. Please wait a few more days and check again.",
    output: "Fourteen days without a scan means it is likely lost. I've opened a carrier trace and can send a replacement today or refund you. Which do you prefer?",
    baselineScores: [2, 2, 3, 2],
    scores: [5, 5, 4, 5],
    rationale: "v12 recognises the lost-parcel threshold and offers both remedies; v11 only told the customer to wait.",
  },
  "shipping-12": {
    title: "Wrong address on a paid order",
    input: "I typed the wrong house number on order #21102 and it hasn't shipped yet.",
    expected: "Update the address before dispatch and confirm the new one back to the customer.",
    baselineOutput: "Addresses can't be changed after an order is placed.",
    output: "It hasn't shipped yet, so I've updated it to 14 Alder Lane. Please check that is right.",
    baselineScores: [2, 2, 3, 2],
    scores: [5, 4, 5, 5],
    rationale: "v12 uses the address tool while the order is unshipped and confirms the result.",
  },
  "tone-04": {
    title: "Apology without over-promising",
    input: "This is the third time my delivery is late. I'm really fed up.",
    expected: "A short, sincere apology and one concrete next step, with no promises about dates.",
    baselineOutput: "We promise your delivery will arrive tomorrow and we're very sorry for everything.",
    output: "I'm sorry, three late deliveries is not okay. I've asked the carrier for a new estimate and will message you the moment I have it.",
    baselineScores: [3, 3, 2, 4],
    scores: [5, 5, 5, 4],
    rationale: "v12 apologises plainly and offers a next step; v11 promised a date it could not keep.",
  },
  "tools-01": {
    title: "Look up the order first",
    input: "Where's my order? It's #21340.",
    expected: "Call get_order before replying and use the status it returns.",
    baselineOutput: "Your order is on its way and should arrive soon.",
    output: "I checked order #21340: it left our warehouse on Tuesday and the carrier expects delivery on Friday.",
    baselineScores: [2, 3, 3, 2],
    scores: [5, 5, 4, 5],
    rationale: "v12 calls get_order and reports the real status; v11 answered without looking anything up.",
  },
}

// Which cases change outcome in the sample run (index within the category, 1-based).
const REGRESS: Record<string, number[]> = { refunds: [2, 7, 11, 15], escalation: [10], tools: [12] }
const IMPROVE: Record<string, number[]> = { shipping: [3, 12], tone: [4, 9, 15], escalation: [2, 8], tools: [1, 6, 10, 14] }
const ERRORS = new Set(["escalation-23", "tools-21"])

function buildSample() {
  const cases: EvalCase[] = []
  const plan: Record<string, EvalOutcome> = {}
  for (const cat of CATS) {
    for (let i = 1; i <= 24; i++) {
      const id = `${cat.slug}-${String(i).padStart(2, "0")}`
      const pool = POOLS[cat.slug]
      const base = i <= 12 ? pool[i - 1] : `${pool[i - 13]}, ${CONTEXTS[i - 13]}`
      const baseline: EvalOutcome = cat.fails.includes(i) ? "fail" : "pass"
      const d = DETAILS[id]
      cases.push({
        id,
        category: cat.name,
        title: d?.title ?? base,
        baseline,
        input: d?.input,
        expected: d?.expected,
        baselineOutput: d?.baselineOutput,
        baselineScores: d?.baselineScores,
      })
      let now: EvalOutcome = baseline
      if (baseline === "pass" && REGRESS[cat.slug]?.includes(i)) now = "fail"
      else if (baseline === "fail" && IMPROVE[cat.slug]?.includes(i)) now = "pass"
      if (ERRORS.has(id)) now = "error"
      plan[id] = now
    }
  }
  return { cases, plan }
}

const SAMPLE = buildSample()

const nova = <Cpu size={13} strokeWidth={1.75} style={{ color: "#c2562f" }} />
const atlas = <Cpu size={13} strokeWidth={1.75} style={{ color: "#3b6fd6" }} />
const sage = <Cpu size={13} strokeWidth={1.75} style={{ color: "#2f8a64" }} />

const SAMPLE_SUITE: EvalSuiteData = {
  name: "Support agent",
  candidate: { version: "v12", model: { name: "Nova 2", mark: nova } },
  baseline: { version: "v11", model: { name: "Atlas 1", mark: atlas } },
  judge: { name: "Sage Pro", mark: sage },
  categories: CATS.map((c) => c.name),
  rubric: RUBRIC,
  cases: SAMPLE.cases,
  estimate: { costUsd: 2.9, seconds: 180 },
}

const SAMPLE_RUNS: EvalRunRecord[] = [
  { id: "v5", label: "v5", score: 74.2, date: "Sep 12" },
  { id: "v6", label: "v6", score: 76.7, date: "Sep 16" },
  { id: "v7", label: "v7", score: 75.0, date: "Sep 20" },
  { id: "v8", label: "v8", score: 79.2, date: "Sep 25" },
  { id: "v9", label: "v9", score: 78.3, date: "Sep 29" },
  { id: "v10", label: "v10", score: 81.7, date: "Oct 8" },
  { id: "v11", label: "v11", score: 83.3, date: "Oct 17" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.evs {
  --evs-ink: #000;
  --evs-surface: #fff;
  --evs-accent: #0060e2;
  --evs-ok: #16803c;
  --evs-warn: #b06a00;
  --evs-err: #cb3a2e;
  --evs-t1: color-mix(in oklab, var(--evs-ink) 88%, transparent);
  --evs-t2: color-mix(in oklab, var(--evs-ink) 61%, transparent);
  --evs-t3: color-mix(in oklab, var(--evs-ink) 45%, transparent);
  --evs-t4: color-mix(in oklab, var(--evs-ink) 27%, transparent);
  --evs-fill: color-mix(in oklab, var(--evs-ink) 3.5%, transparent);
  --evs-fill2: color-mix(in oklab, var(--evs-ink) 6.5%, transparent);
  --evs-line: color-mix(in oklab, var(--evs-ink) 7%, transparent);
  --evs-ghost: color-mix(in oklab, var(--evs-ink) 50%, transparent);
  --evs-ring: 0 0 0 .5px rgb(0 0 0 / .1), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --evs-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  container-type: inline-size;
  background: var(--evs-surface);
  color: var(--evs-t1);
  border: 1px solid color-mix(in oklab, var(--evs-ink) 7.5%, transparent);
  border-radius: 28px;
  overflow: clip;
  font-family: var(--evs-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .evs {
  --evs-ink: #fff;
  --evs-surface: #1c1c1e;
  --evs-accent: #4d8dff;
  --evs-ok: #4cc77e;
  --evs-warn: #f0a63a;
  --evs-err: #ff6f61;
  --evs-t1: color-mix(in oklab, var(--evs-ink) 90%, transparent);
  --evs-t2: color-mix(in oklab, var(--evs-ink) 62%, transparent);
  --evs-t3: color-mix(in oklab, var(--evs-ink) 46%, transparent);
  --evs-t4: color-mix(in oklab, var(--evs-ink) 28%, transparent);
  --evs-fill: color-mix(in oklab, var(--evs-ink) 5.5%, transparent);
  --evs-fill2: color-mix(in oklab, var(--evs-ink) 9%, transparent);
  --evs-line: color-mix(in oklab, var(--evs-ink) 8%, transparent);
  --evs-ring: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.evs *, .evs *::before, .evs *::after { box-sizing: border-box }
:where(.evs) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.evs) :is(h2, p, dl, dd, dt, ul, ol) { margin: 0; padding: 0 }
:where(.evs) ul { list-style: none }
.evs :focus-visible { outline: 2px solid color-mix(in oklab, var(--evs-accent) 60%, transparent); outline-offset: 1px }
.evs-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.evs-num { font-variant-numeric: tabular-nums }

/* ---- header ---- */
.evs-header { padding: 18px 20px 16px 22px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px 16px; align-items: start }
.evs-title { font-size: 16px; line-height: 17.6px; font-weight: 500; margin-top: 1px }
.evs-subtitle { display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; color: var(--evs-t2); margin-top: 3px }
.evs-dot { color: var(--evs-t4) }
.evs-run {
  position: relative; display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 15px 0 13px; border-radius: 9999px;
  background: color-mix(in oklab, var(--evs-ink) 78%, var(--evs-surface)); color: var(--evs-surface); font-weight: 500;
  transition: transform .18s var(--evs-ease), background-color .18s var(--evs-ease);
}
@media (hover: hover) { .evs-run:hover { background: color-mix(in oklab, var(--evs-ink) 90%, var(--evs-surface)) } }
.evs-run:active { transform: scale(.97) }
.evs-runicon { position: relative; width: 13px; height: 13px; flex: none }
.evs-runicon svg { position: absolute; inset: 0; opacity: 0; transform: scale(.6); filter: blur(2px); transition: opacity .2s var(--evs-ease), transform .26s var(--evs-ease), filter .2s var(--evs-ease) }
.evs-run[data-p="idle"] .evs-runicon svg:nth-child(1), .evs-run[data-p="running"] .evs-runicon svg:nth-child(2), .evs-run[data-p="again"] .evs-runicon svg:nth-child(3) { opacity: 1; transform: none; filter: none }
.evs-runlabel { position: relative; display: block; height: 20px; transition: width .32s var(--evs-ease) }
.evs-runlabel > span { position: absolute; left: 0; top: 0; white-space: nowrap; opacity: 0; filter: blur(3px); transition: opacity .18s var(--evs-ease), filter .18s var(--evs-ease) }
.evs-run[data-p="idle"] .evs-runlabel > span:nth-child(1), .evs-run[data-p="running"] .evs-runlabel > span:nth-child(2), .evs-run[data-p="again"] .evs-runlabel > span:nth-child(3) { opacity: 1; filter: none; transition-delay: .06s }
.evs-meta { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; font-size: 12px; line-height: 16.8px; color: var(--evs-t2) }
.evs-metaitem { display: inline-flex; align-items: center; gap: 8px }
.evs-chip { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 9px 0 7px; border-radius: 9999px; background: var(--evs-fill); color: var(--evs-t1); white-space: nowrap }
.evs-chip i { font-style: normal; color: var(--evs-t3) }
.evs-chip svg { flex: none }
.evs-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--evs-t4); margin: 0 4px }
.evs-table { display: none }

/* ---- summary ---- */
.evs-summary { display: grid; grid-template-columns: minmax(150px, 190px) minmax(0, 1fr) auto; gap: 20px 32px; padding: 18px 20px 20px 22px; border-top: 1px solid var(--evs-line) }
.evs-stat { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; color: var(--evs-t2); min-height: 20px }
.evs-statmuted { font-size: 12px; line-height: 16.8px; color: var(--evs-t3) }
.evs-scoreline { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 10px; min-height: 40px; margin-top: 4px }
.evs-scorebig { font-size: 32px; line-height: 40px; font-weight: 500; letter-spacing: -.02em; display: inline-flex; align-items: baseline }
.evs-scorebig small { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--evs-t2); letter-spacing: 0; margin-left: 2px }
.evs-empty { font-size: 16px; line-height: 40px; color: var(--evs-t3) }
.evs-delta { display: inline-flex; align-items: center; gap: 2px; font-weight: 500; font-variant-numeric: tabular-nums; animation: evs-up .34s var(--evs-ease) backwards }
.evs-delta[data-s="up"] { color: var(--evs-ok) }
.evs-delta[data-s="down"] { color: var(--evs-err) }
.evs-delta[data-s="same"] { color: var(--evs-t3) }
.evs-scoredelta { font-size: 16px; line-height: 22px }
@keyframes evs-up { from { opacity: 0; transform: translateY(3px) } to { opacity: 1; transform: none } }
.evs-baseline { display: flex; align-items: center; gap: 8px; color: var(--evs-t2) }
.evs-gkey { display: inline-block; width: 2px; height: 12px; border-radius: 1px; background: var(--evs-ghost); flex: none }
.evs-spark { min-width: 0 }
.evs-sparkplot { position: relative; height: 40px; margin-top: 8px; border-radius: 6px; touch-action: pan-y; cursor: crosshair }
.evs-sparkplot svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.evs-sparkline { fill: none; stroke: var(--evs-t3); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke }
.evs-sparknew { fill: none; stroke-width: 1.75; stroke-linecap: round; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .5s var(--evs-ease) }
.evs-sparknew[data-on] { stroke-dashoffset: 0 }
.evs-sparkdot { position: absolute; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: var(--evs-t3); transition: transform .2s var(--evs-ease) }
.evs-sparkdot[data-base] { width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; background: var(--evs-surface); box-shadow: inset 0 0 0 1.5px var(--evs-t2) }
.evs-sparkdot[data-new] { width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; transform: scale(0); transition: transform .3s var(--evs-ease) .35s }
.evs-sparkdot[data-new][data-on] { transform: scale(1) }
.evs-sparkdot[data-new][data-s="up"] { background: var(--evs-ok) }
.evs-sparkdot[data-new][data-s="down"] { background: var(--evs-err) }
.evs-sparkdot[data-cur] { transform: scale(1.5) }
.evs-sparkslot { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1px dashed var(--evs-t4); right: 0 }
.evs-sparkplot:focus-visible { outline-offset: 3px }
.evs-sparkaxis { display: flex; justify-content: space-between; font-size: 12px; line-height: 16.8px; color: var(--evs-t3); margin-top: 4px }
.evs-cost { display: flex; flex-direction: column; gap: 10px 16px; min-width: 120px }
.evs-costv { font-size: 16px; line-height: 22.4px; color: var(--evs-t3); margin-top: 2px; font-variant-numeric: tabular-nums }
.evs-costv[data-live] { color: var(--evs-t1) }
.evs-cost > div { display: flex; flex-direction: column }

/* ---- grid ---- */
.evs-gridsec { padding: 18px 20px 14px 22px; border-top: 1px solid var(--evs-line) }
.evs-rows { display: flex; flex-direction: column; gap: 16px }
.evs-cat { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; align-items: center }
.evs-catlabel { grid-column: 1; grid-row: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.evs-cells { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: repeat(var(--n, 24), minmax(0, 22px)); gap: 3px }
.evs-stats { grid-column: 2; grid-row: 1; display: flex; align-items: center; gap: 10px }
.evs-bar { position: relative; width: 60px; height: 6px; border-radius: 9999px; background: var(--evs-fill2); flex: none }
.evs-barfill { position: absolute; inset: 0; border-radius: 9999px; background: var(--evs-t3); clip-path: inset(0 calc(100% - var(--p, 0) * 100%) 0 0 round 3px); transition: clip-path .5s var(--evs-ease), background-color .3s var(--evs-ease) }
.evs-bar[data-s="up"] .evs-barfill { background: var(--evs-ok) }
.evs-bar[data-s="down"] .evs-barfill { background: var(--evs-err) }
.evs-ghost { position: absolute; top: -3px; width: 2px; height: 12px; margin-left: -1px; border-radius: 1px; background: var(--evs-ghost); box-shadow: 0 0 0 1.5px var(--evs-surface) }
.evs-pct { width: 38px; text-align: right; font-variant-numeric: tabular-nums }
.evs-pct[data-muted], .evs-dmuted { color: var(--evs-t3) }
.evs-catdelta { width: 50px; font-size: 14px; display: flex; justify-content: flex-start }
.evs-cell {
  position: relative; display: grid; place-items: center; aspect-ratio: 1; border-radius: 4px; background: var(--evs-fill);
  transition: background-color .24s var(--evs-ease);
}
.evs-cell[data-clickable] { cursor: pointer }
.evs-cell svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: scale(.4); opacity: 0; transition: transform .28s var(--evs-ease), opacity .2s var(--evs-ease) }
.evs-cell[data-o] svg { transform: scale(1); opacity: 1 }
.evs-cell[data-o="pass"] { background: color-mix(in oklab, var(--evs-ok) 15%, var(--evs-surface)); color: var(--evs-ok) }
.evs-cell[data-o="fail"] { background: color-mix(in oklab, var(--evs-err) 11%, var(--evs-surface)); color: var(--evs-err) }
.evs-cell[data-o="error"] { background: color-mix(in oklab, var(--evs-warn) 15%, var(--evs-surface)); color: var(--evs-warn) }
.evs-cell[data-strong] { background: var(--evs-err); color: #fff }
.evs-cell[data-flight] { animation: evs-breathe 1s ease-in-out infinite }
.evs-cell[data-hl] { box-shadow: 0 0 0 2px var(--evs-surface), 0 0 0 3.5px var(--evs-t2) }
@keyframes evs-breathe { 0%, 100% { background: var(--evs-fill) } 50% { background: var(--evs-fill2) } }
.evs-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 14px; font-size: 12px; line-height: 16.8px; color: var(--evs-t2) }
.evs-legend span { display: inline-flex; align-items: center; gap: 6px }
.evs-legend .evs-cell { width: 14px; height: 14px; aspect-ratio: auto; border-radius: 4px }
.evs-legend .evs-cell svg { transform: scale(1); opacity: 1 }

/* ---- list ---- */
.evs-listsec { border-top: 1px solid var(--evs-line); padding: 12px 14px 14px }
.evs-listhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 0 8px 8px; flex-wrap: wrap }
.evs-filter { position: relative; display: inline-flex; padding: 3px; gap: 2px; border-radius: 16px; background: var(--evs-fill) }
.evs-fthumb { position: absolute; top: 3px; bottom: 3px; left: 0; width: 0; border-radius: 13px; background: var(--evs-surface); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .1), 0 0 0 .5px rgb(0 0 0 / .05); transition: transform .38s var(--evs-ease), width .38s var(--evs-ease); pointer-events: none }
:is(.dark, [data-theme="dark"]) .evs-fthumb { background: color-mix(in oklab, var(--evs-surface) 78%, #fff) }
.evs-fbtn { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 13px; font-weight: 500; color: var(--evs-t2); white-space: nowrap; transition: color .2s var(--evs-ease) }
.evs-fbtn[aria-checked="true"] { color: var(--evs-t1) }
.evs-fbtn b { font-weight: 400; font-size: 12px; color: var(--evs-t3); font-variant-numeric: tabular-nums }
.evs-triaged { font-size: 12px; line-height: 16.8px; color: var(--evs-t3); font-variant-numeric: tabular-nums }
.evs-height { overflow: clip; transition: height .42s var(--evs-ease) }
.evs-cases { display: flex; flex-direction: column; gap: 2px; padding-bottom: 2px }
.evs-case { animation: evs-rowin .38s var(--evs-ease) backwards }
@keyframes evs-rowin { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
.evs-rowbtn, .evs-rowplain { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 40px; padding: 6px 8px; border-radius: 12px }
.evs-rowbtn { transition: background-color .16s var(--evs-ease) }
@media (hover: hover) { .evs-rowbtn:hover { background: var(--evs-fill) } }
.evs-rowbtn[aria-expanded="true"] { background: var(--evs-fill) }
.evs-rowbtn:focus-visible { outline-offset: -2px }
.evs-trans { display: inline-flex; align-items: center; gap: 4px; flex: none; color: var(--evs-t3) }
.evs-mini { display: grid; place-items: center; width: 14px; height: 14px; border-radius: 4px; background: var(--evs-fill2) }
.evs-mini svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round }
.evs-mini[data-o="pass"] { background: color-mix(in oklab, var(--evs-ok) 15%, var(--evs-surface)); color: var(--evs-ok) }
.evs-mini[data-o="fail"] { background: color-mix(in oklab, var(--evs-err) 11%, var(--evs-surface)); color: var(--evs-err) }
.evs-mini[data-o="error"] { background: color-mix(in oklab, var(--evs-warn) 15%, var(--evs-surface)); color: var(--evs-warn) }
.evs-mini[data-strong] { background: var(--evs-err); color: #fff }
.evs-mini[data-o="none"] { background: none; box-shadow: inset 0 0 0 1px var(--evs-t4) }
.evs-rowtitle { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.evs-rowcat { font-size: 12px; line-height: 16.8px; color: var(--evs-t3); flex: none }
.evs-tag { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 7px 0 5px; border-radius: 9999px; background: var(--evs-fill2); font-size: 12px; color: var(--evs-t2); flex: none }
.evs-rchev { flex: none; color: var(--evs-t3); transition: transform .32s var(--evs-ease) }
.evs-rowbtn[aria-expanded="true"] .evs-rchev { transform: rotate(180deg) }
.evs-more { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; margin: 4px 0 0 4px; border-radius: 18px; color: var(--evs-t2); font-weight: 500 }
@media (hover: hover) { .evs-more:hover { background: var(--evs-fill); color: var(--evs-t1) } }
.evs-none { padding: 22px 8px 14px; text-align: center; color: var(--evs-t3) }
.evs-err { display: flex; gap: 10px; align-items: center; justify-content: space-between; margin: 12px 20px 0 22px; padding: 10px 12px; border-radius: 14px; background: color-mix(in oklab, var(--evs-err) 8%, transparent); font-size: 13px }
.evs-err > span { display: flex; gap: 8px; align-items: center; min-width: 0 }
.evs-err svg { color: var(--evs-err); flex: none }
.evs-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 18px; font-weight: 500; white-space: nowrap; background: var(--evs-surface); box-shadow: var(--evs-ring); transition: background-color .18s var(--evs-ease), transform .18s var(--evs-ease) }
@media (hover: hover) { .evs-btn:hover { background: color-mix(in oklab, var(--evs-surface) 94%, var(--evs-ink)) } }
.evs-btn:active { transform: scale(.97) }
.evs-btn[data-size="sm"] { height: 30px; padding: 0 10px; border-radius: 15px }

/* ---- detail ---- */
.evs-dwrap { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; transition: grid-template-rows .42s var(--evs-ease) }
.evs-dwrap[data-open] { grid-template-rows: 1fr }
.evs-dclip { min-height: 0; overflow: clip }
.evs-detail { display: flex; flex-direction: column; gap: 18px; padding: 14px 8px 18px; opacity: 0; transition: opacity .2s var(--evs-ease) }
.evs-dwrap[data-open] .evs-detail { opacity: 1; transition-duration: .32s; transition-delay: .06s }
.evs-defs { display: flex; flex-direction: column; gap: 10px }
.evs-def { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 16px }
.evs-def dt { color: var(--evs-t2) }
.evs-compare { display: grid; grid-template-columns: 1fr 1fr; border-radius: 18px; background: var(--evs-surface); box-shadow: inset 0 0 0 1px var(--evs-line); overflow: clip }
.evs-pane + .evs-pane { border-left: 1px solid var(--evs-line) }
.evs-panehead { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px 6px 12px; min-height: 40px; background: color-mix(in oklab, var(--evs-ink) 1.5%, var(--evs-surface)) }
.evs-panetitle { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; min-width: 0 }
.evs-panetitle span { font-weight: 400; color: var(--evs-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.evs-otag { display: inline-flex; align-items: center; gap: 3px; height: 22px; padding: 0 8px 0 5px; border-radius: 9999px; font-size: 12px; font-weight: 500; flex: none }
.evs-otag[data-o="pass"] { color: var(--evs-ok); background: color-mix(in oklab, var(--evs-ok) 12%, transparent) }
.evs-otag[data-o="fail"] { color: var(--evs-err); background: color-mix(in oklab, var(--evs-err) 11%, transparent) }
.evs-otag[data-o="error"] { color: var(--evs-warn); background: color-mix(in oklab, var(--evs-warn) 13%, transparent) }
.evs-otag svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round }
.evs-panebody { padding: 10px 12px 12px; font-size: 14px; line-height: 21.7px }
.evs-panebody del, .evs-panebody ins { text-decoration: none; border-radius: 3px; box-decoration-break: clone; -webkit-box-decoration-break: clone }
.evs-panebody del { background: color-mix(in oklab, var(--evs-err) 14%, transparent) }
.evs-panebody ins { background: color-mix(in oklab, var(--evs-ok) 17%, transparent) }
.evs-judge { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 16px }
.evs-judgehead { color: var(--evs-t2) }
.evs-judgebody { display: flex; flex-direction: column; gap: 12px; min-width: 0 }
.evs-judgemodel { display: flex; align-items: center; gap: 6px; color: var(--evs-t2) }
.evs-judgemodel .evs-gkey + span { font-size: 12px }
.evs-judgelegend { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--evs-t3) }
.evs-rubric { display: flex; flex-direction: column; gap: 8px }
.evs-rrow { display: grid; grid-template-columns: 104px minmax(0, 1fr) 40px 50px; gap: 12px; align-items: center }
.evs-rrow .evs-bar { width: 100%; background: var(--evs-fill2) }
.evs-rscore { font-variant-numeric: tabular-nums; text-align: right }
.evs-rscore span { color: var(--evs-t3); font-size: 12px }
.evs-rdelta { font-size: 12px; line-height: 16.8px }
.evs-rationale { color: var(--evs-t2); font-size: 14px; line-height: 21.7px }
.evs-actions { display: flex; gap: 8px; padding-left: 100px; align-items: center; min-height: 36px; flex-wrap: wrap }
.evs-confirm { display: inline-flex; align-items: center; gap: 8px; color: var(--evs-t2); outline-offset: 4px; animation: evs-up .3s var(--evs-ease) backwards }
.evs-confirm svg { color: var(--evs-ok) }
.evs-spin { animation: evs-spin .9s linear infinite }
@keyframes evs-spin { to { transform: rotate(360deg) } }

/* ---- responsive ---- */
@container (min-width: 680px) {
  .evs-cat { grid-template-columns: 92px minmax(0, 1fr) auto; gap: 0 14px }
  .evs-catlabel { grid-column: 1; grid-row: 1 }
  .evs-cells { grid-column: 2; grid-row: 1 }
  .evs-stats { grid-column: 3; grid-row: 1 }
}
@container (max-width: 620px) {
  .evs-summary { grid-template-columns: minmax(0, 1fr) auto }
  .evs-spark { grid-column: 1 / -1; grid-row: 2 }
}
@container (max-width: 560px) {
  .evs-compare { grid-template-columns: 1fr }
  .evs-pane + .evs-pane { border-left: 0; border-top: 1px solid var(--evs-line) }
  .evs-def, .evs-judge { grid-template-columns: 1fr; gap: 2px }
  .evs-actions { padding-left: 0 }
}
@container (max-width: 480px) {
  .evs-header { padding-inline: 16px; grid-template-columns: minmax(0, 1fr) auto }
  .evs-meta { display: none }
  .evs-table { display: grid; grid-column: 1 / -1; grid-template-columns: auto 1fr; gap: 6px 12px; align-items: center; font-size: 12px; line-height: 16.8px; color: var(--evs-t2) }
  .evs-table .evs-chip { justify-self: start }
  .evs-subtitle { grid-column: 1 / -1; grid-row: 2 }
  .evs-summary, .evs-gridsec { padding-inline: 16px }
  .evs-cells { grid-template-columns: repeat(12, minmax(0, 1fr)) }
  .evs-rowcat { display: none }
  .evs-tag span { display: none }
  .evs-tag { padding: 0 5px }
  .evs-fbtn b { display: none }
  .evs-fbtn { padding: 0 10px }
  .evs-listsec { padding-inline: 8px }
  .evs-rrow { grid-template-columns: 1fr auto auto; gap: 4px 10px }
  .evs-rrow .evs-bar { grid-column: 1 / -1; grid-row: 2 }
}
@container (max-width: 420px) {
  .evs-summary { grid-template-columns: minmax(0, 1fr) }
  .evs-cost { flex-direction: row; gap: 24px }
  .evs-spark { grid-row: auto }
}

@media (prefers-reduced-motion: reduce) {
  .evs *, .evs *::before, .evs *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches
const getReducedServer = () => false

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) % 100000
}

/** A number that eases to its value and writes its text straight to the DOM; a new run (value 0) resets at once. */
function CountTo({ value, format, reset }: { value: number; format: (n: number) => string; reset?: boolean }) {
  const reduced = React.useSyncExternalStore(subscribeReduced, getReduced, getReducedServer)
  const ref = React.useRef<HTMLSpanElement>(null)
  const cur = React.useRef(value)
  const fmt = React.useRef(format)
  React.useEffect(() => {
    fmt.current = format
  })
  React.useLayoutEffect(() => {
    if (ref.current) ref.current.textContent = fmt.current(cur.current)
  }, [])
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced || reset) {
      cur.current = value
      el.textContent = fmt.current(value)
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const diff = value - cur.current
      if (Math.abs(diff) < 0.005 * Math.max(1, Math.abs(value))) {
        cur.current = value
        el.textContent = fmt.current(value)
        return
      }
      cur.current += diff * (1 - Math.exp(-dt / 110))
      el.textContent = fmt.current(cur.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced, reset])
  return (
    <>
      <span ref={ref} className="evs-num" aria-hidden />
      <span className="evs-sr">{format(value)}</span>
    </>
  )
}

const GLYPH: Record<EvalOutcome, string> = {
  pass: "M3.4 6.3 5.2 8.1 8.7 4.2",
  fail: "M4 4l4 4M8 4 4 8",
  error: "M6 3.4v3.1M6 8.55v.05",
}
function Glyph({ o }: { o: EvalOutcome }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden focusable="false">
      <path d={GLYPH[o]} />
    </svg>
  )
}

function fmtPts(n: number) {
  return Math.abs(n).toFixed(1)
}
function Delta({ value, unit = "", digits = 1, className }: { value: number; unit?: string; digits?: number; className?: string }) {
  const rounded = Math.round(value * 10) / 10
  const s = rounded > 0 ? "up" : rounded < 0 ? "down" : "same"
  if (s === "same") return <span className={`evs-delta ${className ?? ""}`} data-s="same">Same</span>
  const Icon = s === "up" ? ArrowUp : ArrowDown
  return (
    <span className={`evs-delta ${className ?? ""}`} data-s={s}>
      <Icon size={14} strokeWidth={2} aria-hidden />
      <span>
        {Math.abs(rounded).toFixed(digits)}
        {unit}
      </span>
    </span>
  )
}

function fmtDuration(s: number) {
  const t = Math.round(s)
  if (t < 60) return `${t}s`
  return `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, "0")}s`
}

type Seg = { text: string; changed: boolean }
function wordDiff(a: string, b: string) {
  const wa = a.split(/\s+/).filter(Boolean)
  const wb = b.split(/\s+/).filter(Boolean)
  const n = wa.length
  const m = wb.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = wa[i] === wb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ca = new Array<boolean>(n).fill(true)
  const cb = new Array<boolean>(m).fill(true)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (wa[i] === wb[j]) {
      ca[i] = false
      cb[j] = false
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  const group = (words: string[], flags: boolean[]): Seg[] => {
    const out: Seg[] = []
    words.forEach((w, k) => {
      const last = out[out.length - 1]
      if (last && last.changed === flags[k]) last.text += " " + w
      else out.push({ text: w, changed: flags[k] })
    })
    return out
  }
  const shared = dp[0][0] / Math.max(1, Math.max(n, m))
  return { a: group(wa, ca), b: group(wb, cb), shared }
}

function Diff({ segs, kind, plain }: { segs: Seg[]; kind: "del" | "ins"; plain: boolean }) {
  return (
    <>
      {segs.map((s, k) => {
        const Tag = kind
        return (
          <React.Fragment key={k}>
            {k > 0 && " "}
            {s.changed && !plain ? <Tag>{s.text}</Tag> : <span>{s.text}</span>}
          </React.Fragment>
        )
      })}
    </>
  )
}

/** Locks its height to the content with a ResizeObserver so it can transition between two pixel values. */
function AutoHeight({ children }: { children: React.ReactNode }) {
  const outer = React.useRef<HTMLDivElement>(null)
  const inner = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    o.style.height = `${i.offsetHeight}px`
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false
        o.style.transition = "none"
        o.style.height = `${i.offsetHeight}px`
        o.getBoundingClientRect()
        o.style.transition = ""
        return
      }
      o.style.height = `${i.offsetHeight}px`
    })
    ro.observe(i)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={outer} className="evs-height">
      <div ref={inner}>{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Derived results                              */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "running" | "done" | "stopped" | "error"
type Triage = { kind: "expected"; sim: boolean } | { kind: "issue"; key: string; sim: boolean } | { kind: "pending"; action: "expected" | "issue" }

function isRegression(c: EvalCase, r?: EvalCaseResult) {
  return !!r && c.baseline === "pass" && r.outcome !== "pass"
}
function isImproved(c: EvalCase, r?: EvalCaseResult) {
  return !!r && c.baseline !== "pass" && r.outcome === "pass"
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const SHOW = 6

/**
 * Runs an evaluation suite on a new version of an LLM feature against its baseline. Results stream in case by case
 * (a grid of cells per category, a counting score with the delta, cost, time and a sparkline of earlier runs), and the case
 * list calls out regressions and fixes with a side by side word diff, the judge's rubric and triage.
 */
export function EvalSuite({
  suite: suiteProp,
  runs: runsProp,
  onRun,
  onTriage,
  defaultFilter = "regressions",
  className,
}: EvalSuiteProps) {
  const suite = suiteProp ?? SAMPLE_SUITE
  const runs = runsProp ?? SAMPLE_RUNS
  const isSample = suite === SAMPLE_SUITE
  const uid = React.useId()
  const rubric = suite.rubric ?? RUBRIC

  const [results, setResults] = React.useState<Record<string, EvalCaseResult>>({})
  const [arrival, setArrival] = React.useState<string[]>([])
  const [flight, setFlight] = React.useState<Record<string, true>>({})
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [failure, setFailure] = React.useState("")
  const [elapsed, setElapsed] = React.useState(0)
  const [filter, setFilter] = React.useState<EvalFilter>(defaultFilter)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [showAll, setShowAll] = React.useState(false)
  const [triage, setTriage] = React.useState<Record<string, Triage>>({})
  const [scrub, setScrub] = React.useState<number | null>(null)
  const [status, setStatus] = React.useState("")
  const [resetKey, setResetKey] = React.useState(0)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const ctrl = React.useRef<AbortController | null>(null)
  const timers = React.useRef(new Set<number>())
  const ticket = React.useRef(0)
  const startedAt = React.useRef(0)
  const cb = React.useRef({ onRun, onTriage })
  React.useEffect(() => {
    cb.current = { onRun, onTriage }
  })
  React.useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach((id) => window.clearTimeout(id))
      ctrl.current?.abort()
    }
  }, [])

  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
    return id
  }, [])

  /* ---- numbers ---- */
  const caseMap = React.useMemo(() => new Map(suite.cases.map((c) => [c.id, c])), [suite.cases])
  function caseById(id: string) {
    return caseMap.get(id) as EvalCase
  }

  const total = suite.cases.length
  const baselinePass = suite.cases.filter((c) => c.baseline === "pass").length
  const baselineRate = total ? (baselinePass / total) * 100 : 0
  const scored = Object.keys(results).length
  const passCount = suite.cases.filter((c) => results[c.id]?.outcome === "pass").length
  const failCount = suite.cases.filter((c) => results[c.id]?.outcome === "fail").length
  const errCount = suite.cases.filter((c) => results[c.id]?.outcome === "error").length
  const rate = total ? (passCount / total) * 100 : 0
  const delta = rate - baselineRate
  const regressions = arrival.filter((id) => isRegression(caseById(id), results[id]))
  const improved = arrival.filter((id) => isImproved(caseById(id), results[id]))
  const cost = Object.values(results).reduce((a, r) => a + (r.costUsd ?? 0), 0)
  const finished = phase === "done" || phase === "stopped"
  const hasResults = scored > 0

  const categories = React.useMemo(() => {
    const order = suite.categories ?? Array.from(new Set(suite.cases.map((c) => c.category)))
    return order.map((name) => {
      const cs = suite.cases.filter((c) => c.category === name)
      const base = cs.filter((c) => c.baseline === "pass").length
      return { name, cases: cs, baseRate: cs.length ? (base / cs.length) * 100 : 0 }
    })
  }, [suite])

  /* ---- run ---- */
  const addResult = (r: EvalCaseResult) => {
    setResults((cur) => ({ ...cur, [r.caseId]: r }))
    setArrival((cur) => (cur.includes(r.caseId) ? cur : [...cur, r.caseId]))
    setFlight((cur) => {
      if (!cur[r.caseId]) return cur
      const { [r.caseId]: _gone, ...rest } = cur
      return rest
    })
  }
  const markStarted = (id: string) => setFlight((cur) => (cur[id] ? cur : { ...cur, [id]: true }))

  const simResult = (c: EvalCase): EvalCaseResult => {
    const h = hash(c.id)
    let outcome: EvalOutcome
    if (isSample && SAMPLE.plan[c.id]) outcome = SAMPLE.plan[c.id]
    else if (c.baseline === "pass") outcome = h % 100 < 90 ? "pass" : h % 100 < 96 ? "fail" : "error"
    else outcome = h % 100 < 45 ? "pass" : "fail"
    const d = isSample ? DETAILS[c.id] : undefined
    return {
      caseId: c.id,
      outcome,
      output: d?.output,
      scores: d?.scores,
      rationale: d?.rationale,
      costUsd: 0.0225 + (h % 60) / 10000,
    }
  }

  const finish = (my: number) => {
    if (my !== ticket.current) return
    setPhase("done")
    setFlight({})
    ctrl.current = null
  }

  const runSimulated = (my: number) => {
    const maxIdx = Math.max(...categories.map((c) => c.cases.length))
    const queue: EvalCase[] = []
    for (let i = 0; i < maxIdx; i++) for (const cat of categories) if (cat.cases[i]) queue.push(cat.cases[i])
    let next = 0
    let active = 0
    let doneCount = 0
    let secs = 0
    const launch = () => {
      while (active < 8 && next < queue.length) {
        const c = queue[next++]
        active++
        markStarted(c.id)
        const h = hash(c.id)
        later(() => {
          if (my !== ticket.current) return
          active--
          doneCount++
          secs += 7 + (h % 12)
          addResult(simResult(c))
          setElapsed(secs / 8)
          if (doneCount === queue.length) {
            finish(my)
            return
          }
          launch()
        }, 170 + (h % 360))
      }
    }
    launch()
  }

  const runReal = async (my: number) => {
    const controller = new AbortController()
    ctrl.current = controller
    const tick = window.setInterval(() => setElapsed((performance.now() - startedAt.current) / 1000), 500)
    try {
      const out = cb.current.onRun!(suite, { signal: controller.signal, started: markStarted })
      if (out && typeof (out as AsyncIterable<EvalCaseResult>)[Symbol.asyncIterator] === "function") {
        for await (const r of out as AsyncIterable<EvalCaseResult>) {
          if (my !== ticket.current || controller.signal.aborted) break
          addResult(r)
        }
      } else {
        const list = await (out as Promise<EvalCaseResult[]>)
        if (my === ticket.current && !controller.signal.aborted) list.forEach(addResult)
      }
      setElapsed((performance.now() - startedAt.current) / 1000)
      if (my === ticket.current && !controller.signal.aborted) finish(my)
    } catch (e) {
      if (my === ticket.current && !controller.signal.aborted) {
        const msg = e instanceof Error && e.message ? e.message : "The run failed."
        setFailure(msg)
        setPhase("error")
        setFlight({})
        setStatus(`Run failed. ${msg}`)
      }
    } finally {
      window.clearInterval(tick)
    }
  }

  const start = (e: { timeStamp: number }) => {
    const my = ++ticket.current
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current.clear()
    ctrl.current?.abort()
    startedAt.current = e.timeStamp
    setResults({})
    setArrival([])
    setFlight({})
    setElapsed(0)
    setFailure("")
    setOpenId(null)
    setShowAll(false)
    setTriage({})
    setScrub(null)
    setResetKey((k) => k + 1)
    setPhase("running")
    setStatus(`Run started${cb.current.onRun ? "" : ", simulated"}. ${total} test cases against ${suite.baseline.version}.`)
    if (cb.current.onRun) void runReal(my)
    else runSimulated(my)
  }

  const stop = () => {
    ticket.current++
    ctrl.current?.abort()
    ctrl.current = null
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current.clear()
    setFlight({})
    setPhase("stopped")
    setStatus(`Run stopped after ${scored} of ${total} cases.`)
  }

  // Announce the finish once the numbers are in.
  const announcedDone = React.useRef(0)
  React.useEffect(() => {
    if (phase !== "done" || announcedDone.current === resetKey) return
    announcedDone.current = resetKey
    const d = Math.round(delta * 10) / 10
    setStatus(
      `Run finished${cb.current.onRun ? "" : " (simulated)"}. Score ${rate.toFixed(1)} percent, ${d === 0 ? "level with" : `${d > 0 ? "up" : "down"} ${Math.abs(d).toFixed(1)} points against`} ${suite.baseline.version}. ${regressions.length} regressions, ${improved.length} improved.`,
    )
  }, [phase, resetKey, delta, rate, regressions.length, improved.length, suite.baseline.version])

  /* ---- case list ---- */
  const list = React.useMemo(() => {
    if (!hasResults) return [] as string[]
    if (filter === "all") return suite.cases.map((c) => c.id)
    if (filter === "failed") return arrival.filter((id) => results[id]?.outcome !== "pass")
    if (filter === "regressions") return arrival.filter((id) => isRegression(caseMap.get(id) as EvalCase, results[id]))
    return arrival.filter((id) => isImproved(caseMap.get(id) as EvalCase, results[id]))
  }, [filter, hasResults, arrival, results, suite.cases, caseMap])
  const failedAll = arrival.filter((id) => results[id]?.outcome !== "pass").length
  const counts: Record<EvalFilter, number> = { all: total, failed: failedAll, regressions: regressions.length, improved: improved.length }
  const visible = showAll ? list : list.slice(0, SHOW)
  const triagedCount = regressions.filter((id) => triage[id] && triage[id].kind !== "pending").length

  const selectFilter = (f: EvalFilter) => {
    setFilter(f)
    setShowAll(false)
    setOpenId(null)
    setStatus(`${FILTER_LABEL[f]}, ${counts[f]} cases.`)
  }

  const openFromCell = (id: string) => {
    const c = caseMap.get(id) as EvalCase
    const r = results[id]
    if (!c.input || !r) return
    const f: EvalFilter = isRegression(c, r) ? "regressions" : isImproved(c, r) ? "improved" : "all"
    setFilter(filter !== "all" && !list.includes(id) ? f : filter)
    setShowAll(true)
    setOpenId(id)
    later(() => rootRef.current?.querySelector<HTMLElement>(`[data-evs-case="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 80)
  }

  /* ---- triage ---- */
  const doTriage = async (c: EvalCase, action: "expected" | "issue") => {
    const sim = !cb.current.onTriage
    setTriage((t) => ({ ...t, [c.id]: { kind: "pending", action } }))
    try {
      let key: string | void = undefined
      if (cb.current.onTriage) key = await cb.current.onTriage(c.id, action)
      else await new Promise<void>((r) => later(r, 450))
      if (action === "issue") {
        const k = typeof key === "string" && key ? key : `SUP-${2400 + (hash(c.id) % 90)}`
        setTriage((t) => ({ ...t, [c.id]: { kind: "issue", key: k, sim } }))
        setStatus(`Issue ${k} opened for ${c.title}${sim ? ", simulated" : ""}.`)
        later(() => rootRef.current?.querySelector<HTMLElement>(`[data-evs-confirm="${c.id}"]`)?.focus(), 60)
      } else {
        setTriage((t) => ({ ...t, [c.id]: { kind: "expected", sim } }))
        setStatus(`${c.title} marked as expected${sim ? ", simulated" : ""}.`)
        later(() => rootRef.current?.querySelector<HTMLElement>(`[data-evs-undo="${c.id}"]`)?.focus(), 60)
      }
    } catch {
      setTriage((t) => {
        const { [c.id]: _gone, ...rest } = t
        return rest
      })
      setStatus(`Could not ${action === "issue" ? "open an issue" : "mark as expected"}. Try again.`)
    }
  }
  const undoTriage = (c: EvalCase) => {
    setTriage((t) => {
      const { [c.id]: _gone, ...rest } = t
      return rest
    })
    setStatus(`${c.title} is untriaged again.`)
    later(() => rootRef.current?.querySelector<HTMLElement>(`[data-evs-first="${c.id}"]`)?.focus(), 60)
  }

  /* ---- sparkline ---- */
  const history = runs.slice(-7)
  const newPoint = finished ? { label: suite.candidate.version, score: rate } : null
  const points = [...history.map((r) => ({ label: r.label, score: r.score, date: r.date })), ...(newPoint ? [{ ...newPoint, date: undefined }] : [])]
  const readIdx = scrub ?? (newPoint ? points.length - 1 : history.length - 1)
  const readPoint = points[Math.max(0, Math.min(points.length - 1, readIdx))]
  const baseIdx = history.length - 1
  const readText = readPoint
    ? `${readPoint.label}${readIdx === baseIdx ? " baseline" : ""} · ${readPoint.score.toFixed(1)}%${readPoint.date ? ` · ${readPoint.date}` : ""}`
    : ""

  const runPhase = phase === "running" ? "running" : finished || phase === "error" ? "again" : "idle"

  return (
    <div ref={rootRef} className={["evs", className].filter(Boolean).join(" ")}>
      <style href="eval-suite" precedence="default">
        {CSS}
      </style>

      <header className="evs-header">
        <div style={{ minWidth: 0 }}>
          <h2 className="evs-title">{suite.name}</h2>
          <p className="evs-subtitle">
            <span>
              {suite.candidate.version} against {suite.baseline.version}
            </span>
            <span className="evs-dot" aria-hidden>
              ·
            </span>
            <span>{total} test cases</span>
          </p>
        </div>
        <RunButton phase={runPhase} onRun={start} onStop={stop} />
        <div className="evs-meta">
          <span className="evs-metaitem">
            <ModelChip model={suite.candidate.model} version={suite.candidate.version} />
          </span>
          <span>against</span>
          <span className="evs-metaitem">
            <ModelChip model={suite.baseline.model} version={suite.baseline.version} />
          </span>
          <span className="evs-sep" aria-hidden />
          <span className="evs-metaitem">
            <span>Judge</span>
            <ModelChip model={suite.judge} />
          </span>
        </div>
        <div className="evs-table" aria-hidden>
          <span>{suite.candidate.version}</span>
          <ModelChip model={suite.candidate.model} />
          <span>{suite.baseline.version}</span>
          <ModelChip model={suite.baseline.model} />
          <span>Judge</span>
          <ModelChip model={suite.judge} />
        </div>
      </header>

      {phase === "error" && (
        <div className="evs-err" role="alert">
          <span>
            <CircleAlert size={16} strokeWidth={1.75} aria-hidden />
            {failure}
          </span>
          <button type="button" className="evs-btn" data-size="sm" onClick={start}>
            Try again
          </button>
        </div>
      )}

      <section className="evs-summary" aria-label="Summary">
        <div>
          <div className="evs-stat">
            <span>{phase === "running" ? "Scoring" : "Score"}</span>
            {phase === "running" && (
              <span className="evs-statmuted evs-num">
                {scored} of {total}
              </span>
            )}
          </div>
          <div className="evs-scoreline">
            {hasResults ? (
              <>
                <span className="evs-scorebig">
                  <CountTo value={rate} format={(n) => n.toFixed(1)} reset={!hasResults} />
                  <small>%</small>
                </span>
                {finished && (
                  <span className="evs-scoredelta" key={`d-${resetKey}`}>
                    <Delta value={delta} unit=" pts" className="evs-scoredelta" />
                    <span className="evs-sr">
                      {Math.round(delta * 10) / 10 === 0 ? "level with" : `${delta > 0 ? "up" : "down"} ${fmtPts(delta)} points against`} {suite.baseline.version}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <span className="evs-empty">Not run yet</span>
            )}
          </div>
          <div className="evs-baseline">
            <span className="evs-gkey" aria-hidden />
            <span>
              {suite.baseline.version} scored {baselineRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="evs-spark">
          <div className="evs-stat">
            <span>Last {Math.min(8, history.length + 1)} runs</span>
            <span className="evs-statmuted" aria-hidden>
              {readText}
            </span>
          </div>
          <Sparkline
            points={points}
            baseIdx={baseIdx}
            hasNew={!!newPoint}
            slot={!newPoint}
            sign={delta > 0 ? "up" : delta < 0 ? "down" : "same"}
            idx={readIdx}
            readText={readText}
            onIdx={setScrub}
            uid={uid}
          />
          <div className="evs-sparkaxis" aria-hidden>
            <span>{history[0]?.label}</span>
            <span>{newPoint ? newPoint.label : suite.candidate.version}</span>
          </div>
        </div>

        <dl className="evs-cost">
          <div>
            <dt className="evs-stat">Cost</dt>
            <dd className="evs-costv" data-live={hasResults || undefined}>
              {hasResults ? (
                <>
                  $<CountTo value={cost} format={(n) => n.toFixed(2)} reset={!hasResults} />
                </>
              ) : suite.estimate ? (
                `About $${suite.estimate.costUsd.toFixed(2)}`
              ) : (
                "–"
              )}
            </dd>
          </div>
          <div>
            <dt className="evs-stat">Time</dt>
            <dd className="evs-costv" data-live={hasResults || undefined}>
              {hasResults ? fmtDuration(elapsed) : suite.estimate ? `About ${suite.estimate.seconds >= 90 ? `${Math.round(suite.estimate.seconds / 60)} min` : `${suite.estimate.seconds} s`}` : "–"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="evs-gridsec" aria-label="Results by category">
        <div className="evs-rows">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.name}
              cat={cat}
              results={results}
              flight={flight}
              finished={finished}
              hasResults={hasResults}
              openId={openId}
              onCell={openFromCell}
              baselineVersion={suite.baseline.version}
            />
          ))}
        </div>
        <div className="evs-legend">
          <span>
            <i className="evs-cell" data-o="pass">
              <Glyph o="pass" />
            </i>
            {finished ? `${passCount} passed` : "Pass"}
          </span>
          <span>
            <i className="evs-cell" data-o="fail">
              <Glyph o="fail" />
            </i>
            {finished ? `${failCount} failed` : "Fail"}
          </span>
          <span>
            <i className="evs-cell" data-o="error">
              <Glyph o="error" />
            </i>
            {finished ? `${errCount} errors` : "Error"}
          </span>
          <span>
            <i className="evs-cell" data-strong>
              <Glyph o="fail" />
            </i>
            {finished ? `${regressions.length} regressions` : "Regression"}
          </span>
          <span>
            <i className="evs-gkey" />
            {suite.baseline.version}
          </span>
        </div>
      </section>

      <section className="evs-listsec" aria-label="Cases">
        <div className="evs-listhead">
          <FilterGroup value={filter} counts={hasResults ? counts : null} onChange={selectFilter} />
          {regressions.length > 0 && finished && (
            <span className="evs-triaged">
              {triagedCount} of {regressions.length} triaged
            </span>
          )}
        </div>
        <AutoHeight>
          <div className="evs-cases">
            {!hasResults ? (
              <p className="evs-none">Run the suite to compare every case with {suite.baseline.version}.</p>
            ) : list.length === 0 ? (
              <p className="evs-none">{phase === "running" ? "Waiting for results…" : `No ${FILTER_LABEL[filter].toLowerCase()} cases.`}</p>
            ) : (
              <ul aria-label={FILTER_LABEL[filter]} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {visible.map((id) => {
                  const c = caseById(id)
                  return (
                    <CaseRow
                      key={id}
                      c={c}
                      r={results[id]}
                      suite={suite}
                      rubric={rubric}
                      uid={uid}
                      open={openId === id}
                      triage={triage[id]}
                      onOpen={() => setOpenId((cur) => (cur === id ? null : id))}
                      onTriage={(a) => void doTriage(c, a)}
                      onUndo={() => undoTriage(c)}
                    />
                  )
                })}
              </ul>
            )}
            {list.length > SHOW && (
              <button type="button" className="evs-more" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
                <ChevronDown size={14} strokeWidth={1.75} aria-hidden style={{ transform: showAll ? "rotate(180deg)" : undefined, transition: "transform .3s" }} />
                {showAll ? "Show fewer" : `Show ${list.length - SHOW} more`}
              </button>
            )}
          </div>
        </AutoHeight>
      </section>

      <div className="evs-sr" role="status" aria-live="polite">
        {status}
      </div>
    </div>
  )
}

const FILTER_LABEL: Record<EvalFilter, string> = { all: "All", failed: "Failed", regressions: "Regressions", improved: "Improved" }

/* -------------------------------------------------------------------------- */
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

function ModelChip({ model, version }: { model: EvalModel; version?: string }) {
  return (
    <span className="evs-chip">
      {model.mark ?? <Cpu size={13} strokeWidth={1.75} />}
      <span>{model.name}</span>
      {version && <i>{version}</i>}
    </span>
  )
}

function RunButton({ phase, onRun, onStop }: { phase: "idle" | "running" | "again"; onRun: (e: { timeStamp: number }) => void; onStop: () => void }) {
  const labelRef = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const el = labelRef.current
    if (!el) return
    const idx = phase === "idle" ? 0 : phase === "running" ? 1 : 2
    const target = el.children[idx] as HTMLElement
    el.style.width = `${target.offsetWidth}px`
  }, [phase])
  return (
    <button
      type="button"
      className="evs-run"
      data-p={phase}
      aria-label={phase === "running" ? "Stop" : phase === "again" ? "Run again" : "Run"}
      onClick={(e) => (phase === "running" ? onStop() : onRun(e))}
    >
      <span className="evs-runicon" aria-hidden>
        <Play size={13} fill="currentColor" strokeWidth={0} />
        <Square size={12} fill="currentColor" strokeWidth={0} />
        <RotateCcw size={13} strokeWidth={2} />
      </span>
      <span className="evs-runlabel" ref={labelRef} aria-hidden>
        <span>Run</span>
        <span>Stop</span>
        <span>Run again</span>
      </span>
    </button>
  )
}

function Sparkline({
  points,
  baseIdx,
  hasNew,
  slot,
  sign,
  idx,
  readText,
  onIdx,
  uid,
}: {
  points: { label: string; score: number }[]
  baseIdx: number
  hasNew: boolean
  slot: boolean
  sign: "up" | "down" | "same"
  idx: number
  readText: string
  onIdx: (i: number | null) => void
  uid: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const count = points.length + (slot ? 1 : 0)
  const scores = points.map((p) => p.score)
  const lo = (scores.length ? Math.min(...scores) : 0) - 1
  const hi = (scores.length ? Math.max(...scores) : 100) + 1
  const xf = (i: number) => (count > 1 ? i / (count - 1) : 0.5)
  const X = (i: number) => 4 + xf(i) * 92
  const Y = (s: number) => 34 - ((s - lo) / Math.max(1, hi - lo)) * 28
  const histCount = hasNew ? points.length - 1 : points.length
  const line = points
    .slice(0, histCount)
    .map((p, i) => `${i === 0 ? "M" : "L"}${X(i)} ${Y(p.score)}`)
    .join(" ")
  const seg = hasNew ? `M${X(histCount - 1)} ${Y(points[histCount - 1].score)} L${X(histCount)} ${Y(points[histCount].score)}` : ""

  const onKey = (e: React.KeyboardEvent) => {
    const max = points.length - 1
    let n = idx
    if (e.key === "ArrowLeft") n = idx - 1
    else if (e.key === "ArrowRight") n = idx + 1
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = max
    else if (e.key === "Escape") {
      onIdx(null)
      return
    } else return
    e.preventDefault()
    onIdx(Math.max(0, Math.min(max, n)))
  }
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || !points.length) return
    const f = (e.clientX - r.left) / r.width
    let best = 0
    let d = 9
    points.forEach((_, i) => {
      const dd = Math.abs(f - (4 / r.width + xf(i) * 0.92))
      if (dd < d) {
        d = dd
        best = i
      }
    })
    onIdx(best)
  }

  return (
    <div
      ref={ref}
      className="evs-sparkplot"
      role="slider"
      tabIndex={0}
      aria-label="Run history"
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, points.length - 1)}
      aria-valuenow={idx}
      aria-valuetext={readText}
      aria-describedby={`${uid}-hint`}
      onKeyDown={onKey}
      onPointerMove={onMove}
      onPointerLeave={() => onIdx(null)}
      onBlur={() => onIdx(null)}
    >
      <span id={`${uid}-hint`} className="evs-sr">
        Use the arrow keys to step through earlier runs.
      </span>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
        <path className="evs-sparkline" d={line} />
        {hasNew && (
          <path
            className="evs-sparknew"
            pathLength={1}
            d={seg}
            data-on
            style={{ stroke: sign === "down" ? "var(--evs-err)" : sign === "up" ? "var(--evs-ok)" : "var(--evs-t2)" }}
          />
        )}
      </svg>
      {slot && <span className="evs-sparkslot" aria-hidden />}
      {points.map((p, i) => {
        const isNew = hasNew && i === points.length - 1
        return (
          <span
            key={`${p.label}-${i}`}
            className="evs-sparkdot"
            data-base={i === baseIdx || undefined}
            data-new={isNew || undefined}
            data-on={isNew || undefined}
            data-s={isNew ? sign : undefined}
            data-cur={i === idx || undefined}
            style={{ left: `calc(${X(i)}%)`, top: Y(p.score) }}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

function CategoryRow({
  cat,
  results,
  flight,
  finished,
  hasResults,
  openId,
  onCell,
  baselineVersion,
}: {
  cat: { name: string; cases: EvalCase[]; baseRate: number }
  results: Record<string, EvalCaseResult>
  flight: Record<string, true>
  finished: boolean
  hasResults: boolean
  openId: string | null
  onCell: (id: string) => void
  baselineVersion: string
}) {
  const n = cat.cases.length
  let pass = 0
  let fail = 0
  let err = 0
  let reg = 0
  for (const c of cat.cases) {
    const r = results[c.id]
    if (!r) continue
    if (r.outcome === "pass") pass++
    else if (r.outcome === "fail") fail++
    else err++
    if (isRegression(c, r)) reg++
  }
  const scored = pass + fail + err
  const pct = n ? (pass / n) * 100 : 0
  const d = pct - cat.baseRate
  const sign = !finished ? undefined : d > 0.05 ? "up" : d < -0.05 ? "down" : undefined
  const summary = `${cat.name}: ${pass} passed, ${fail} failed, ${err} errors, ${n - scored} not yet scored. ${hasResults ? `${pct.toFixed(0)} percent` : "No score yet"}${finished ? `, ${Math.abs(d) < 0.05 ? "level with" : `${d > 0 ? "up" : "down"} ${Math.abs(d).toFixed(1)} points against`} ${baselineVersion}` : ""}.${reg ? ` ${reg} regressions.` : ""}`
  return (
    <div className="evs-cat">
      <span className="evs-catlabel">{cat.name}</span>
      <div className="evs-cells" role="img" aria-label={summary} style={{ "--n": Math.min(n, 24) } as React.CSSProperties}>
        {cat.cases.map((c) => {
          const r = results[c.id]
          const clickable = !!(c.input && r)
          const strong = isRegression(c, r)
          return (
            <span
              key={c.id}
              className="evs-cell"
              data-o={r?.outcome}
              data-strong={strong || undefined}
              data-flight={(!r && flight[c.id]) || undefined}
              data-clickable={clickable || undefined}
              data-hl={openId === c.id || undefined}
              title={r ? `${c.title}: ${r.outcome}` : undefined}
              onClick={clickable ? () => onCell(c.id) : undefined}
            >
              {r && <Glyph o={r.outcome} />}
            </span>
          )
        })}
      </div>
      <div className="evs-stats" aria-hidden>
        <span className="evs-bar" data-s={sign}>
          <span className="evs-barfill" style={{ "--p": hasResults ? pct / 100 : 0 } as React.CSSProperties} />
          <span className="evs-ghost" style={{ left: `${cat.baseRate}%` }} />
        </span>
        <span className="evs-pct" data-muted={!hasResults || undefined}>
          {hasResults ? <CountTo value={pct} format={(v) => `${Math.round(v)}%`} reset={!hasResults} /> : "–"}
        </span>
        <span className="evs-catdelta">
          {finished ? <Delta value={d} /> : <span className="evs-dmuted">{hasResults ? "" : cat.baseRate.toFixed(1)}</span>}
        </span>
      </div>
    </div>
  )
}

function FilterGroup({ value, counts, onChange }: { value: EvalFilter; counts: Record<EvalFilter, number> | null; onChange: (f: EvalFilter) => void }) {
  const order: EvalFilter[] = ["all", "failed", "regressions", "improved"]
  const noCounts = counts === null
  const wrap = React.useRef<HTMLDivElement>(null)
  const thumb = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    const w = wrap.current
    const t = thumb.current
    if (!w || !t) return
    let first = true
    const place = () => {
      const active = w.querySelector<HTMLElement>('[aria-checked="true"]')
      if (!active) return
      if (first) t.style.transition = "none"
      t.style.width = `${active.offsetWidth}px`
      t.style.transform = `translateX(${active.offsetLeft}px)`
      if (first) {
        t.getBoundingClientRect()
        t.style.transition = ""
        first = false
      }
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(w)
    return () => ro.disconnect()
  }, [value, noCounts])
  const onKey = (e: React.KeyboardEvent) => {
    const i = order.indexOf(value)
    let n = i
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % order.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i + order.length - 1) % order.length
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = order.length - 1
    else return
    e.preventDefault()
    onChange(order[n])
    requestAnimationFrame(() => wrap.current?.querySelectorAll<HTMLElement>('[role="radio"]')[n]?.focus())
  }
  return (
    <div className="evs-filter" ref={wrap} role="radiogroup" aria-label="Filter cases" onKeyDown={onKey}>
      <span className="evs-fthumb" ref={thumb} aria-hidden />
      {order.map((f) => (
        <button key={f} type="button" role="radio" aria-checked={value === f} tabIndex={value === f ? 0 : -1} className="evs-fbtn" onClick={() => onChange(f)}>
          {FILTER_LABEL[f]}
          {(f === "all" || counts) && <b>{counts ? counts[f] : ""}</b>}
        </button>
      ))}
    </div>
  )
}

function Mini({ o, strong }: { o: EvalOutcome | "none"; strong?: boolean }) {
  return (
    <span className="evs-mini" data-o={o} data-strong={strong || undefined} aria-hidden>
      {o !== "none" && <Glyph o={o} />}
    </span>
  )
}

function CaseRow({
  c,
  r,
  suite,
  rubric,
  uid,
  open,
  triage,
  onOpen,
  onTriage,
  onUndo,
}: {
  c: EvalCase
  r?: EvalCaseResult
  suite: EvalSuiteData
  rubric: string[]
  uid: string
  open: boolean
  triage?: Triage
  onOpen: () => void
  onTriage: (a: "expected" | "issue") => void
  onUndo: () => void
}) {
  const reg = isRegression(c, r)
  const hasDetail = !!(c.input && r)
  const panelId = `${uid}-d-${c.id}`
  const nowText = r ? r.outcome : "not scored yet"
  const kind = reg ? ", regression" : isImproved(c, r) ? ", improved" : ""
  const content = (
    <>
      <span className="evs-trans" aria-hidden>
        <Mini o={c.baseline} />
        <ArrowRight size={12} strokeWidth={1.75} />
        <Mini o={r ? r.outcome : "none"} strong={reg} />
      </span>
      <span className="evs-rowtitle">
        {c.title}
        <span className="evs-sr">
          . {c.category}. {suite.baseline.version} {c.baseline}, {suite.candidate.version} {nowText}
          {kind}
        </span>
      </span>
      {triage && triage.kind !== "pending" && (
        <span className="evs-tag" aria-hidden>
          {triage.kind === "expected" ? <Check size={12} strokeWidth={2} /> : <Link2 size={12} strokeWidth={1.75} />}
          <span>{triage.kind === "expected" ? "Expected" : triage.key}</span>
        </span>
      )}
      <span className="evs-rowcat" aria-hidden>
        {c.category}
      </span>
    </>
  )
  return (
    <li className="evs-case" data-evs-case={c.id}>
      {hasDetail ? (
        <button type="button" className="evs-rowbtn" aria-expanded={open} aria-controls={panelId} onClick={onOpen}>
          {content}
          <ChevronDown className="evs-rchev" size={16} strokeWidth={1.75} aria-hidden />
        </button>
      ) : (
        <div className="evs-rowplain">{content}</div>
      )}
      {hasDetail && <Detail id={panelId} c={c} r={r!} suite={suite} rubric={rubric} open={open} triage={triage} onTriage={onTriage} onUndo={onUndo} />}
    </li>
  )
}

function Detail({
  id,
  c,
  r,
  suite,
  rubric,
  open,
  triage,
  onTriage,
  onUndo,
}: {
  id: string
  c: EvalCase
  r: EvalCaseResult
  suite: EvalSuiteData
  rubric: string[]
  open: boolean
  triage?: Triage
  onTriage: (a: "expected" | "issue") => void
  onUndo: () => void
}) {
  const [mounted, setMounted] = React.useState(open)
  const [entered, setEntered] = React.useState(open)
  if (open && !mounted) setMounted(true)
  React.useEffect(() => {
    if (open) {
      let b = 0
      const a = requestAnimationFrame(() => {
        b = requestAnimationFrame(() => setEntered(true))
      })
      return () => {
        cancelAnimationFrame(a)
        cancelAnimationFrame(b)
      }
    }
    const tm = window.setTimeout(() => {
      setMounted(false)
      setEntered(false)
    }, 460)
    return () => window.clearTimeout(tm)
  }, [open])

  const diff = React.useMemo(() => (c.baselineOutput && r.output ? wordDiff(c.baselineOutput, r.output) : null), [c.baselineOutput, r.output])
  if (!mounted) return null
  const expanded = open && entered
  const plain = !diff || diff.shared < 0.35

  return (
    <div className="evs-dwrap" data-open={expanded || undefined} inert={!expanded} id={id} role="region" aria-label={`${c.title}, details`}>
      <div className="evs-dclip">
        <div className="evs-detail">
          <dl className="evs-defs">
            <div className="evs-def">
              <dt>Input</dt>
              <dd>{c.input}</dd>
            </div>
            {c.expected && (
              <div className="evs-def">
                <dt>Expected</dt>
                <dd>{c.expected}</dd>
              </div>
            )}
          </dl>

          <div className="evs-compare">
            <section className="evs-pane" aria-label={`${suite.baseline.version} reply`}>
              <header className="evs-panehead">
                <span className="evs-panetitle">
                  {suite.baseline.model.mark ?? <Cpu size={13} strokeWidth={1.75} />}
                  {suite.baseline.version}
                  <span>{suite.baseline.model.name}</span>
                </span>
                <span className="evs-otag" data-o={c.baseline}>
                  <Glyph o={c.baseline} />
                  {OUTCOME_LABEL[c.baseline]}
                </span>
              </header>
              <p className="evs-panebody">{diff ? <Diff segs={diff.a} kind="del" plain={plain} /> : c.baselineOutput}</p>
            </section>
            <section className="evs-pane" aria-label={`${suite.candidate.version} reply`}>
              <header className="evs-panehead">
                <span className="evs-panetitle">
                  {suite.candidate.model.mark ?? <Cpu size={13} strokeWidth={1.75} />}
                  {suite.candidate.version}
                  <span>{suite.candidate.model.name}</span>
                </span>
                <span className="evs-otag" data-o={r.outcome}>
                  <Glyph o={r.outcome} />
                  {OUTCOME_LABEL[r.outcome]}
                </span>
              </header>
              <p className="evs-panebody">{r.error ? r.error : diff ? <Diff segs={diff.b} kind="ins" plain={plain} /> : r.output}</p>
            </section>
          </div>

          {(r.scores || r.rationale) && (
            <section className="evs-judge" aria-label="Judge">
              <div className="evs-judgehead">Judge</div>
              <div className="evs-judgebody">
                <p className="evs-judgemodel">
                  {suite.judge.mark ?? <Cpu size={13} strokeWidth={1.75} />}
                  <span style={{ fontSize: 14 }}>{suite.judge.name}</span>
                  <span className="evs-judgelegend">
                    <span className="evs-gkey" aria-hidden />
                    {suite.baseline.version}
                  </span>
                </p>
                {r.scores && c.baselineScores && (
                  <ul className="evs-rubric">
                    {rubric.map((name, i) => {
                      const now = r.scores![i]
                      const was = c.baselineScores![i]
                      if (now === undefined || was === undefined) return null
                      const d = now - was
                      return (
                        <li className="evs-rrow" key={name}>
                          <span>{name}</span>
                          <span className="evs-bar" data-s={d > 0 ? "up" : d < 0 ? "down" : undefined} aria-hidden>
                            <span className="evs-barfill" style={{ "--p": now / 5 } as React.CSSProperties} />
                            <span className="evs-ghost" style={{ left: `${(was / 5) * 100}%` }} />
                          </span>
                          <span className="evs-rscore">
                            <span className="evs-sr">{`${suite.candidate.version} ${now} of 5, ${suite.baseline.version} ${was}`}</span>
                            <span aria-hidden>
                              <b style={{ fontWeight: 400 }}>{now}</b>
                              <span>/5</span>
                            </span>
                          </span>
                          <span className="evs-rdelta" aria-hidden>
                            {d === 0 ? <span className="evs-dmuted">Same</span> : <Delta value={d} digits={0} />}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {r.rationale && <p className="evs-rationale">{r.rationale}</p>}
              </div>
            </section>
          )}

          <div className="evs-actions">
            {triage?.kind === "pending" ? (
              <span className="evs-confirm">
                <LoaderCircle size={16} strokeWidth={1.75} className="evs-spin" aria-hidden />
                {triage.action === "issue" ? "Opening issue…" : "Saving…"}
              </span>
            ) : triage?.kind === "expected" ? (
              <>
                <span className="evs-confirm" role="status">
                  <Check size={16} strokeWidth={2} aria-hidden />
                  Marked as expected{triage.sim ? " (simulated)" : ""}
                </span>
                <button type="button" className="evs-btn" data-size="sm" data-evs-undo={c.id} onClick={onUndo}>
                  Undo
                </button>
              </>
            ) : triage?.kind === "issue" ? (
              <span className="evs-confirm" tabIndex={-1} data-evs-confirm={c.id}>
                <Link2 size={16} strokeWidth={1.75} aria-hidden />
                Issue {triage.key} opened{triage.sim ? " (simulated)" : ""}
              </span>
            ) : (
              <>
                <button type="button" className="evs-btn" data-evs-first={c.id} onClick={() => onTriage("expected")}>
                  <Check size={16} strokeWidth={1.75} aria-hidden />
                  Mark as expected
                </button>
                <button type="button" className="evs-btn" onClick={() => onTriage("issue")}>
                  <Bug size={16} strokeWidth={1.75} aria-hidden style={{ color: "var(--evs-accent)" }} />
                  Open issue
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const OUTCOME_LABEL: Record<EvalOutcome, string> = { pass: "Pass", fail: "Fail", error: "Error" }

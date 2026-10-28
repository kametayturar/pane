"use client"

import * as React from "react"
import { BookOpenText, Check, ChevronDown, ChevronRight, FlaskConical, Landmark, LayoutDashboard, ListChecks, Menu, PenLine, Plus, Radar, Search, Wallet, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type TaskTrackerView = "board" | "list" | "timeline"

export type TaskTrackerProps = {
  /** Called with the nav label when any item in the left rail is clicked. */
  onNavigate?: (label: string) => void
  /** Rendered at the bottom of the rail, above the user row. */
  sideTools?: React.ReactNode
  /** Which view is showing first. Default "board". */
  defaultView?: TaskTrackerView
  /** Task id whose detail panel starts open, e.g. "RET-142". */
  defaultOpenId?: string
}

type Who = "ada" | "mo" | "ines" | "tomas" | "atlas" | "sage" | "quill"
type Status = "backlog" | "todo" | "progress" | "review" | "done"
type Pri = 1 | 2 | 3 | 4
type LogKind = "act" | "note" | "comment" | "reply"

type Log = { id: string; d: number; t: string; who: Who | "sys"; kind: LogKind; text: string; fresh?: boolean }
type Sub = { id: string; t: string; done: boolean }
type Task = {
  id: string
  n: number
  title: string
  desc: string
  status: Status
  pri: Pri
  who: Who | null
  labels: string[]
  /** Day offset from the first day of the cycle. */
  start: number
  dur: number
  est: number
  deps: string[]
  subs: Sub[]
  log: Log[]
  live?: string[]
  /** Day the task was finished (offset from cycle start). */
  done?: number
  by: Who
}

type Filters = { q: string; who: "all" | "agents" | "humans" | "none" | Who; labels: string[]; pri: number[] }
type SortKey = "id" | "title" | "pri" | "who" | "est"
type Sort = { key: SortKey; dir: 1 | -1 } | null

/* -------------------------------------------------------------------------- */
/*                                Simulated data                              */
/* -------------------------------------------------------------------------- */

const TODAY = 10
const DAYS = 14
const NOW_FRAC = 14.35 / 24
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const WD = ["M", "T", "W", "T", "F", "S", "S"]

const PEOPLE: Record<Who, { name: string; init: string; agent?: boolean; role: string }> = {
  ada: { name: "Ada Okafor", init: "AO", role: "Product lead" },
  mo: { name: "Mo Haddad", init: "MH", role: "Engineer" },
  ines: { name: "Ines Duarte", init: "ID", role: "Designer" },
  tomas: { name: "Tomas Wei", init: "TW", role: "Engineer" },
  atlas: { name: "Atlas", init: "A", agent: true, role: "Research agent" },
  sage: { name: "Sage", init: "S", agent: true, role: "Operations agent" },
  quill: { name: "Quill", init: "Q", agent: true, role: "Writing agent" },
}
const WHO_ORDER: Who[] = ["ada", "mo", "ines", "tomas", "atlas", "sage", "quill"]
const AGENT_IDS: Who[] = ["atlas", "sage", "quill"]

const STATUSES: { id: Status; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "progress", label: "In progress" },
  { id: "review", label: "In review" },
  { id: "done", label: "Done" },
]
const STATUS_LABEL: Record<Status, string> = { backlog: "Backlog", todo: "Todo", progress: "In progress", review: "In review", done: "Done" }
const PRI_LABEL: Record<Pri, string> = { 4: "Urgent", 3: "High", 2: "Medium", 1: "Low" }
const LABELS = ["portal", "payments", "email", "design", "api", "ops", "copy", "qa", "research"]

const dayDate = (d: number) => new Date(Date.UTC(2026, 9, 12 + d))
const dayLabel = (d: number) => {
  const dt = dayDate(d)
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`
}
const dow = (d: number) => ((d % 7) + 7) % 7
const pad2 = (n: number) => String(n).padStart(2, "0")
const clock = () => {
  const n = new Date()
  return `${pad2(n.getHours())}:${pad2(n.getMinutes())}`
}
let uid = 0
const nid = (p: string) => `${p}${++uid}`

type Seed = {
  n: number
  title: string
  status: Status
  pri: Pri
  who: Who | null
  labels: string[]
  s: number
  d: number
  est: number
  desc: string
  deps?: number[]
  subs?: [string, boolean][]
  live?: string[]
  by?: Who
  log?: [number, string, Who | "sys", LogKind, string][]
}

const SEEDS: Seed[] = [
  /* done */
  { n: 118, title: "Return-reason taxonomy", status: "done", pri: 2, who: "ines", labels: ["design", "research"], s: -7, d: 7, est: 3, desc: "Agree one list of return reasons that support, the warehouse and the portal all use. Ten reasons, each with a plain-language label and a routing rule." },
  { n: 121, title: "Carrier label API contract", status: "done", pri: 3, who: "mo", labels: ["api"], s: -4, d: 5, est: 3, desc: "Write down the request and response shapes for label creation, void and tracking with the two carriers we launch with." },
  { n: 124, title: "Order lookup by email and order number", status: "done", pri: 4, who: "mo", labels: ["portal", "api"], s: 2, d: 6, est: 3, deps: [121], desc: "Customers find their order with an email and an order number. Rate limited, no account needed, never reveals whether an email exists." },
  { n: 125, title: "Eligibility rules engine v1", status: "done", pri: 4, who: "tomas", labels: ["api"], s: 1, d: 7, est: 5, desc: "Decide in one call whether an item can be returned: window, condition, category exclusions and final-sale flags." },
  { n: 126, title: "Return window copy review", status: "done", pri: 2, who: "quill", labels: ["copy"], s: 4, d: 4, est: 1, desc: "Review every place the portal mentions the 30-day window and make the wording consistent." },
  { n: 127, title: "Refund-method selector states", status: "done", pri: 3, who: "ines", labels: ["design", "portal"], s: 3, d: 5, est: 2, desc: "Design the selector for original payment, store credit and exchange, including disabled and loading states." },
  { n: 128, title: "Warehouse scan webhook", status: "done", pri: 3, who: "tomas", labels: ["api", "ops"], s: 4, d: 4, est: 3, deps: [121], desc: "Receive the scan event when a parcel reaches the warehouse and mark the return as received." },
  { n: 129, title: "Reasons dropdown wired to taxonomy", status: "done", pri: 2, who: "mo", labels: ["portal"], s: 5, d: 4, est: 2, deps: [118], desc: "Replace the free-text reason field with the new taxonomy and send the code with the return." },
  { n: 130, title: "Fraud-signal baseline from 12 months of returns", status: "done", pri: 3, who: "atlas", labels: ["research"], s: 1, d: 7, est: 3, desc: "Find which patterns in past returns predicted abuse, so v2 can flag them without blocking honest customers." },
  { n: 131, title: "Empty and error states", status: "done", pri: 2, who: "ines", labels: ["design"], s: 6, d: 3, est: 2, desc: "Design what the portal shows when an order is not found, a window has closed or a carrier is down." },
  { n: 132, title: "Refund SLA policy summary", status: "done", pri: 2, who: "sage", labels: ["ops"], s: 6, d: 3, est: 1, desc: "One page that states when each refund method lands, so support and the portal quote the same numbers." },
  { n: 133, title: "Confirmation email v1 template", status: "done", pri: 3, who: "quill", labels: ["email", "copy"], s: 6, d: 4, est: 2, desc: "First version of the email customers receive when a return is approved, with the label link and drop-off steps." },
  { n: 134, title: "Load test the lookup endpoint", status: "done", pri: 3, who: "sage", labels: ["qa", "api"], s: 8, d: 2, est: 1, deps: [124], desc: "Run the lookup endpoint at 5x expected peak and report latency and error rate." },
  { n: 135, title: "Courier pickup scheduling stub", status: "done", pri: 2, who: "tomas", labels: ["api"], s: 7, d: 3, est: 2, desc: "A stub that books a pickup slot, so design and QA can build against the real response shape." },
  { n: 136, title: "Analytics events spec", status: "done", pri: 2, who: "ada", labels: ["research"], s: 7, d: 3, est: 1, desc: "List the events we need to measure completion rate and time to refund, with names and properties." },
  { n: 137, title: "Mobile layout pass 1", status: "done", pri: 3, who: "ines", labels: ["design", "portal"], s: 7, d: 4, est: 3, desc: "First pass of every portal screen at 390 px wide, with thumb-reachable actions." },
  /* review */
  {
    n: 138, title: "Return label PDF generation", status: "review", pri: 4, who: "mo", labels: ["api", "portal"], s: 8, d: 4, est: 2, deps: [128],
    desc: "Render the carrier label as a print-ready PDF with the return barcode and a packing slip on a single page.",
    subs: [["Template layout", true], ["Barcode rendering", true], ["Carrier address block", true], ["Print test on Letter", false]],
    log: [[10, "11:12", "mo", "act", "opened PR #212 and moved this to In review"], [10, "11:15", "sage", "note", "Looks right at 100% scale. On Letter paper the barcode sits 4 mm too close to the fold."]],
  },
  {
    n: 139, title: "Exchange or refund decision copy", status: "review", pri: 3, who: "quill", labels: ["copy"], s: 8, d: 4, est: 1, deps: [126],
    desc: "The sentence pair that helps a customer choose between an exchange and a refund without feeling pushed.",
    subs: [["Draft 3 variants", true], ["Pick one with Ada", true]],
    log: [[10, "09:47", "quill", "act", "finished the draft and moved this to In review"], [10, "09:48", "quill", "note", "Leads with the benefit (keep what you like) before the refund line. The legal sentence needs a second pair of eyes."]],
  },
  {
    n: 140, title: "Eligibility edge cases: bundles and sale items", status: "review", pri: 4, who: "atlas", labels: ["research", "qa"], s: 5, d: 6, est: 2, deps: [125],
    desc: "Run real past orders through the rules engine and list every case where the answer is wrong or unclear.",
    subs: [["Sample 118 orders", true], ["Classify mismatches", true], ["Write findings", true]],
    log: [[9, "16:30", "atlas", "act", "tested 118 sample orders against the rules engine"], [9, "16:31", "atlas", "note", "Sale items pass in 96% of cases. The other 4% miss because the engine reads the list price, not the price paid."]],
  },
  /* in progress */
  {
    n: 141, title: "Return status timeline component", status: "progress", pri: 3, who: "ines", labels: ["portal", "design"], s: 8, d: 5, est: 2, deps: [127],
    desc: "A vertical timeline that shows where a return is: requested, label sent, in transit, received, refunded. Works without colour.",
    subs: [["Spec the five states", true], ["Build in the design system", true], ["Add reduced-motion variant", false], ["Handoff notes", false]],
  },
  {
    n: 142, title: "Refund email copy and tone variants", status: "progress", pri: 4, who: "quill", labels: ["email", "copy"], s: 10, d: 3, est: 2, deps: [133],
    desc: "Write the refund-issued and refund-delayed emails in three tones, then pick one with Ada. Keep each under 90 words and put the order number in the first line.",
    subs: [["Draft subject lines", true], ["Write refund-issued body", true], ["Write refund-delayed body", false], ["Tone check against style guide", false], ["Localise currency formats", false]],
    live: ["Quill · drafting refund email copy…", "Quill · writing the delay email…", "Quill · tone check, style v3…"],
    log: [
      [9, "09:14", "quill", "act", "read style guide v3 and 12 past refund emails"],
      [9, "10:02", "quill", "act", "checked off “Draft subject lines”"],
      [9, "10:03", "quill", "note", "Subject B tested best on the old form. I would ship B and keep A for the delay case."],
      [9, "15:40", "mo", "comment", "Keep the order number in the first line, support searches for it."],
      [10, "08:51", "quill", "act", "checked off “Write refund-issued body”"],
    ],
  },
  {
    n: 143, title: "Refund ledger sync", status: "progress", pri: 4, who: "tomas", labels: ["payments", "api"], s: 8, d: 5, est: 3, deps: [125],
    desc: "Write every issued refund to the finance ledger with the order, amount, method and reason code, exactly once.",
    subs: [["Idempotency key per refund", true], ["Ledger write with retry", true], ["Backfill 30 days", false], ["Reconciliation report", false]],
  },
  {
    n: 144, title: "Partial refunds for bundle returns", status: "progress", pri: 4, who: "mo", labels: ["payments"], s: 8, d: 5, est: 3, deps: [125],
    desc: "When one item of a bundle comes back, refund its share of the bundle price and keep the discount the customer earned.",
    subs: [["Price-share calculation", true], ["Rounding rule agreed with finance", false], ["Edge case: free gift item", false]],
  },
  {
    n: 145, title: "Reconcile carrier tracking statuses", status: "progress", pri: 3, who: "atlas", labels: ["ops", "research"], s: 8, d: 5, est: 2, deps: [130],
    desc: "Map the status codes from both carriers onto the portal's seven return states, and list every code we cannot place.",
    subs: [["Pull tracking events", true], ["Map carrier codes", true], ["Resolve ambiguous codes", false], ["Write mapping table to docs", false], ["Open PR with mapping", false]],
    live: ["Atlas · resolving 12 carrier codes…", "Atlas · checking 3 carrier docs…", "Atlas · writing the mapping table…"],
    log: [
      [9, "11:20", "atlas", "act", "pulled 4,812 tracking events from 3 carriers"],
      [9, "11:34", "atlas", "act", "checked off “Map carrier codes” (41 codes to 7 states)"],
      [9, "11:35", "atlas", "note", "Two carriers reuse “exception” for lost and for held at customs. I split them by sub-code, 12 events stay ambiguous."],
      [10, "07:58", "atlas", "act", "flagged 12 ambiguous events for review"],
    ],
  },
  {
    n: 146, title: "Support macro library for returns", status: "progress", pri: 2, who: "ada", labels: ["ops", "copy"], s: 9, d: 4, est: 1, deps: [132],
    desc: "Twelve ready-to-send replies for the most common return questions, written to match the portal's wording.",
    subs: [["List top 12 questions", true], ["Write replies", false], ["Review with support leads", false]],
  },
  {
    n: 147, title: "Payments sandbox test plan", status: "progress", pri: 3, who: "ada", labels: ["payments", "qa"], s: 8, d: 4, est: 1,
    desc: "Cases to run in the payments sandbox before launch: full refund, partial refund, failed payout, store credit and a duplicate webhook.",
    subs: [["Happy paths", true], ["Failure paths", false], ["Sign-off from finance", false]],
  },
  {
    n: 148, title: "Accessibility audit of the portal flow", status: "progress", pri: 3, who: "sage", labels: ["qa", "design"], s: 9, d: 4, est: 2, deps: [131],
    desc: "Check every screen against WCAG 2.2 AA with automated tools, keyboard only and a screen reader. File each finding as a sub-task.",
    subs: [["Automated pass on 9 screens", true], ["Keyboard-only walkthrough", false], ["Screen reader pass (VoiceOver)", false], ["Contrast check, light and dark", false], ["Fix log for design", false]],
    live: ["Sage · keyboard pass, screen 4 of 9…", "Sage · tabbing through label modal…", "Sage · logging focus order…"],
    log: [
      [9, "13:05", "sage", "act", "ran automated checks on 9 portal screens"],
      [9, "13:06", "sage", "act", "checked off “Automated pass on 9 screens”"],
      [9, "13:22", "sage", "note", "14 findings, 3 serious: focus is lost after the label modal closes, the reason select has no visible label, and the timeline relies on colour alone."],
      [10, "09:10", "sage", "act", "filed the 3 serious findings for design"],
    ],
  },
  /* todo */
  { n: 149, title: "Return policy FAQ page", status: "todo", pri: 2, who: "quill", labels: ["copy", "portal"], s: 12, d: 3, est: 1, deps: [139], desc: "A short FAQ linked from the portal footer: windows, condition, refund timing and exchanges.", subs: [["Collect questions from support", false], ["Draft answers", false]] },
  { n: 150, title: "Exchange flow: scope and wireframes", status: "todo", pri: 3, who: "ines", labels: ["design", "portal"], s: 11, d: 4, est: 2, deps: [127], desc: "Decide what exchanges cover in v2 (same item, other size) and sketch the flow end to end.", subs: [["Scope with Ada", false], ["Wireframes", false], ["Review with engineering", false]] },
  { n: 151, title: "Retry logic for failed refund payouts", status: "todo", pri: 4, who: "tomas", labels: ["payments"], s: 13, d: 3, est: 2, deps: [143], desc: "If the payment provider rejects a payout, retry with backoff for 48 hours, then alert support with the order attached." },
  { n: 152, title: "Store-credit instant refund path", status: "todo", pri: 3, who: "mo", labels: ["payments", "portal"], s: 13, d: 3, est: 2, deps: [144], desc: "Customers who choose store credit get it the moment the label is scanned, with a 5% bonus." },
  { n: 153, title: "Weekly return-rate digest for ops", status: "todo", pri: 2, who: "atlas", labels: ["ops", "research"], s: 11, d: 2, est: 1, desc: "Every Monday: return rate by category, top reasons and anything that moved more than 10% week on week.", subs: [["Pick the five metrics", false], ["Draft the digest", false]] },
  { n: 154, title: "Cutover plan and rollback checklist", status: "todo", pri: 4, who: "ada", labels: ["ops"], s: 12, d: 3, est: 1, deps: [138], desc: "Step-by-step plan to switch from the email form to the portal on Nov 3, with a one-click rollback.", subs: [["Write the plan", false], ["Dry run on staging", false], ["Sign-off from support", false]] },
  /* backlog */
  { n: 155, title: "Exchange flow: build", status: "backlog", pri: 3, who: "mo", labels: ["portal"], s: 15, d: 5, est: 3, deps: [150], desc: "Build the exchange flow once the scope is agreed." },
  { n: 156, title: "In-store return QR codes", status: "backlog", pri: 2, who: "tomas", labels: ["portal", "ops"], s: 16, d: 4, est: 2, desc: "Let customers show a QR code at any Harbor & Finch shop to return without a label." },
  { n: 157, title: "Return-rate dashboard for finance", status: "backlog", pri: 2, who: "atlas", labels: ["research"], s: 14, d: 4, est: 2, deps: [153], desc: "Monthly view of refunds by method, category and reason, built on the weekly digest data." },
  { n: 158, title: "Multilingual confirmation emails", status: "backlog", pri: 1, who: "quill", labels: ["email", "copy"], s: 15, d: 4, est: 2, deps: [139], desc: "Translate the confirmation and refund emails into German, French and Spanish, and check each with a native reader." },
  { n: 159, title: "Gift-return flow without original payer", status: "backlog", pri: 2, who: "ada", labels: ["payments"], s: 17, d: 3, est: 1, desc: "Decide how to refund a gift when the person returning it is not the buyer." },
  { n: 160, title: "Photo upload for damaged items", status: "backlog", pri: 1, who: "ines", labels: ["design", "portal"], s: 16, d: 4, est: 2, desc: "Let customers attach up to three photos when a return reason is damaged or wrong item." },
]

function seedTask(s: Seed): Task {
  const id = `RET-${s.n}`
  const by: Who = s.by ?? "ada"
  const c = Math.min(s.s, 8) - 1
  const log: Log[] = [{ id: nid("l"), d: c, t: "09:30", who: by, kind: "act", text: "created this task" }]
  if (s.who) log.push({ id: nid("l"), d: c, t: "09:41", who: by, kind: "act", text: `assigned ${PEOPLE[s.who].name}` })
  if (s.status !== "backlog") {
    const d = s.status === "done" ? s.s + s.d - 1 : Math.min(s.s, TODAY)
    log.push({ id: nid("l"), d, t: "10:05", who: s.who ?? by, kind: "act", text: `moved to ${STATUS_LABEL[s.status]}` })
  }
  for (const [d, t, who, kind, text] of s.log ?? []) log.push({ id: nid("l"), d, t, who, kind, text })
  log.sort((a, b) => a.d - b.d || a.t.localeCompare(b.t))
  return {
    id,
    n: s.n,
    title: s.title,
    desc: s.desc,
    status: s.status,
    pri: s.pri,
    who: s.who,
    labels: s.labels,
    start: s.s,
    dur: s.d,
    est: s.est,
    deps: (s.deps ?? []).map((n) => `RET-${n}`),
    subs: (s.subs ?? []).map(([t, done]) => ({ id: nid("s"), t, done })),
    log,
    live: s.live,
    done: s.status === "done" ? s.s + s.d - 1 : undefined,
    by,
  }
}

const SEED_TASKS: Task[] = SEEDS.map(seedTask)

/** Remaining points at the end of cycle days 0-9 (day 10 is computed live). */
const BURN_HIST = [58, 58, 56, 59, 56, 56, 56, 50, 43, 36]
const SCOPE_NOTE_DAY = 3

const REPLIES: Record<string, string> = {
  atlas: "Pulling the numbers now. I will post a short table here in a few minutes.",
  sage: "Noted. I will check this against the refund policy and flag anything that conflicts.",
  quill: "Got it. I will fold that into the next draft and mark what changed.",
}

/* -------------------------------------------------------------------------- */
/*                                   Reducer                                  */
/* -------------------------------------------------------------------------- */

type Action =
  | { t: "move"; id: string; status: Status; before: string | null; entry?: Log }
  | { t: "patch"; id: string; patch: Partial<Task>; entry?: Log }
  | { t: "sub"; id: string; sid: string; by?: Who; entry?: Log }
  | { t: "addSub"; id: string; sub: Sub }
  | { t: "log"; id: string; entry: Log }
  | { t: "create"; task: Task }
  | { t: "restore"; tasks: Task[] }

function reducer(tasks: Task[], a: Action): Task[] {
  switch (a.t) {
    case "restore":
      return a.tasks
    case "create":
      return [a.task, ...tasks]
    case "log":
      return tasks.map((t) => (t.id === a.id ? { ...t, log: [...t.log, a.entry] } : t))
    case "addSub":
      return tasks.map((t) => (t.id === a.id ? { ...t, subs: [...t.subs, a.sub] } : t))
    case "sub":
      return tasks.map((t) => {
        if (t.id !== a.id) return t
        const subs = t.subs.map((s) => (s.id === a.sid ? { ...s, done: a.by ? true : !s.done } : s))
        return { ...t, subs, log: a.entry ? [...t.log, a.entry] : t.log }
      })
    case "patch":
      return tasks.map((t) => (t.id === a.id ? { ...t, ...a.patch, log: a.entry ? [...t.log, a.entry] : t.log } : t))
    case "move": {
      const cur = tasks.find((t) => t.id === a.id)
      if (!cur) return tasks
      const rest = tasks.filter((t) => t.id !== a.id)
      const moved: Task = {
        ...cur,
        status: a.status,
        done: a.status === "done" ? (cur.done ?? TODAY) : undefined,
        log: a.entry ? [...cur.log, a.entry] : cur.log,
      }
      let idx: number
      if (a.before) idx = rest.findIndex((t) => t.id === a.before)
      else {
        let last = -1
        rest.forEach((t, i) => {
          if (t.status === a.status) last = i
        })
        idx = last < 0 ? rest.length : last + 1
      }
      if (idx < 0) idx = rest.length
      const next = [...rest.slice(0, idx), moved, ...rest.slice(idx)]
      const same = next.length === tasks.length && next.every((t, i) => t.id === tasks[i].id) && cur.status === a.status
      return same ? tasks : next
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
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

function useTabVisible() {
  return React.useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb)
      return () => document.removeEventListener("visibilitychange", cb)
    },
    () => !document.hidden,
    () => true,
  )
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [v, setV] = React.useState(true)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return v
}

function useWidth(ref: React.RefObject<HTMLElement | null>, initial = 600) {
  const [w, setW] = React.useState(initial)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

/** Counts to `value` with one tiny overshoot-and-return. Starts at the final value, so it never hides content. */
function useSettle(value: number, reduced: boolean) {
  const [shown, setShown] = React.useState(value)
  const from = React.useRef(value)
  React.useEffect(() => {
    if (reduced) return
    const f = from.current
    if (f === value) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 800)
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

function Num({ value, dp = 0, reduced }: { value: number; dp?: number; reduced: boolean }) {
  const v = useSettle(value, reduced)
  return <span>{v.toFixed(dp)}</span>
}

/** Types `lines` one after the other at a steady pace. Starts on the first line fully shown, so content is never hidden. */
function useTyper(lines: string[], run: boolean) {
  const key = lines.join("\u0001")
  const [s, setS] = React.useState({ i: 0, n: lines[0]?.length ?? 0 })
  React.useEffect(() => {
    if (!run) return
    const ls = key.split("\u0001")
    const line = ls[s.i % ls.length] ?? ""
    const typing = s.n < line.length
    const id = window.setTimeout(
      () => setS((p) => (p.n < line.length ? { i: p.i, n: p.n + 1 } : { i: (p.i + 1) % ls.length, n: 0 })),
      typing ? 34 : 2600,
    )
    return () => window.clearTimeout(id)
  }, [run, s, key])
  const ls = key.split("\u0001")
  return ls[s.i % ls.length].slice(0, s.n)
}

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** Ordered dither: density encodes `value` (0-1). */
function Dither({ value, w = 36, h = 8 }: { value: number; w?: number; h?: number }) {
  const cell = 2
  const path = React.useMemo(() => {
    let d = ""
    const th = Math.max(0, Math.min(1, value)) * 16
    for (let y = 0; y < h / cell; y++)
      for (let x = 0; x < w / cell; x++) if (BAYER[y % 4][x % 4] < th) d += `M${x * cell} ${y * cell}h${cell}v${cell}h-${cell}z`
    return d
  }, [value, w, h])
  return (
    <svg className="itt-dither" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  )
}

function Crops() {
  return (
    <>
      <i className="itt-crop tl" />
      <i className="itt-crop tr" />
      <i className="itt-crop bl" />
      <i className="itt-crop br" />
    </>
  )
}

function Av({ who, size = 20 }: { who: Who | null; size?: number }) {
  if (!who) return <span className="itt-who none" style={{ width: size, height: size }} title="Unassigned" role="img" aria-label="Unassigned" />
  const p = PEOPLE[who]
  return (
    <span
      className={`itt-who${p.agent ? " agent" : ""}`}
      style={{ width: size, height: size, fontSize: size <= 18 ? 8.5 : size >= 26 ? 11 : 9.5 }}
      title={p.agent ? `${p.name} (agent)` : p.name}
      role="img"
      aria-label={p.agent ? `${p.name}, agent` : p.name}
    >
      {p.agent ? p.name[0] : p.init}
      {p.agent ? (
        <svg className="itt-star" viewBox="0 0 8 8" aria-hidden="true">
          <path d="M4 .2 5.1 2.9 7.8 4 5.1 5.1 4 7.8 2.9 5.1.2 4 2.9 2.9z" />
        </svg>
      ) : null}
    </span>
  )
}

function StatusIcon({ s, size = 13 }: { s: Status; size?: number }) {
  const c = 6.5
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none" aria-hidden="true" className="itt-sicon">
      {s === "backlog" ? (
        <circle cx={c} cy={c} r="5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.7 1.9" />
      ) : (
        <circle cx={c} cy={c} r="5" stroke="currentColor" strokeWidth="1.2" />
      )}
      {s === "progress" ? <path d="M6.5 6.5V2.9a3.6 3.6 0 0 1 0 7.2z" fill="currentColor" /> : null}
      {s === "review" ? <path d="M6.5 6.5V2.9a3.6 3.6 0 1 1-3.6 3.6z" fill="currentColor" /> : null}
      {s === "done" ? (
        <>
          <circle cx={c} cy={c} r="5.6" fill="currentColor" />
          <path d="m4.2 6.6 1.6 1.6 3-3.3" stroke="var(--itt-sheet)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
    </svg>
  )
}

function PriBars({ p }: { p: Pri }) {
  return (
    <span className="itt-pri" role="img" aria-label={`Priority: ${PRI_LABEL[p]}`} title={`${PRI_LABEL[p]} priority`}>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= p ? "on" : ""} style={{ height: 3 + i * 2 }} />
      ))}
    </span>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="itt-chip">{children}</span>
}

/* ---- popover menu ---- */

type TriggerProps = {
  ref: React.RefObject<HTMLButtonElement | null>
  onClick: () => void
  "aria-haspopup": "menu"
  "aria-expanded": boolean
}

function Pop({
  trigger,
  children,
  width = 208,
}: {
  trigger: (p: TriggerProps, open: boolean) => React.ReactNode
  children: (close: () => void) => React.ReactNode
  width?: number
}) {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState<{ left: number; top?: number; bottom?: number }>({ left: 0 })
  const btn = React.useRef<HTMLButtonElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)

  const close = React.useCallback(() => setOpen(false), [])
  const toggle = () => {
    if (open) return setOpen(false)
    const r = btn.current?.getBoundingClientRect()
    if (!r) return
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8))
    const below = window.innerHeight - r.bottom
    setPos(below < 300 && r.top > below ? { left, bottom: window.innerHeight - r.top + 4 } : { left, top: r.bottom + 4 })
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const n = e.target as Node
      if (!panel.current?.contains(n) && !btn.current?.contains(n)) setOpen(false)
    }
    const away = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", down, true)
    document.addEventListener("scroll", away, true)
    window.addEventListener("resize", away)
    const items = panel.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]')
    ;(panel.current?.querySelector<HTMLElement>('[aria-checked="true"]') ?? items?.[0])?.focus()
    return () => {
      document.removeEventListener("pointerdown", down, true)
      document.removeEventListener("scroll", away, true)
      window.removeEventListener("resize", away)
    }
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus()
    } else if (e.key === "Escape") {
      e.stopPropagation()
      setOpen(false)
      btn.current?.focus()
    } else if (e.key === "Tab") setOpen(false)
  }

  return (
    <>
      {trigger({ ref: btn, onClick: toggle, "aria-haspopup": "menu", "aria-expanded": open }, open)}
      {open ? (
        <div ref={panel} className="itt-pop" role="menu" style={{ ...pos, width }} onKeyDown={onKeyDown}>
          {children(close)}
        </div>
      ) : null}
    </>
  )
}

function Mi({
  checked,
  multi,
  onClick,
  children,
  hint,
}: {
  checked?: boolean
  multi?: boolean
  onClick: () => void
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <button type="button" role={multi ? "menuitemcheckbox" : "menuitemradio"} aria-checked={!!checked} className="itt-mi" onClick={onClick}>
      <span className="ck">{checked ? <Check size={12} strokeWidth={2} /> : null}</span>
      <span className="tx">{children}</span>
      {hint != null ? <span className="itt-mono hint">{hint}</span> : null}
    </button>
  )
}

function Seg<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: React.KeyboardEvent) => {
    let n = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (idx + 1) % options.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (idx - 1 + options.length) % options.length
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = options.length - 1
    if (n < 0) return
    e.preventDefault()
    refs.current[n]?.focus()
    onChange(options[n].value)
  }
  return (
    <div role="radiogroup" aria-label={label} className="itt-seg" style={{ "--n": options.length, "--i": idx } as React.CSSProperties} onKeyDown={onKeyDown}>
      <span className="ind" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={i === idx}
          tabIndex={i === idx ? 0 : -1}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Check12({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} aria-label={label} className={`itt-cb${on ? " on" : ""}`} onClick={onClick}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="m1.8 5.2 2.2 2.2 4.2-4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Styles                                  */
/* -------------------------------------------------------------------------- */

const CSS = `
.itt {
  --itt-paper: #fafafa;
  --itt-sheet: #ffffff;
  --itt-ink: #0a0a0a;
  --itt-signal: #0060e2;
  --itt-accent: var(--itt-signal);
  --itt-surface: var(--itt-sheet);
  --itt-signal-soft: color-mix(in oklab, var(--itt-signal) 12%, transparent);
  --itt-t1: color-mix(in oklab, var(--itt-ink) 92%, transparent);
  --itt-t2: color-mix(in oklab, var(--itt-ink) 64%, transparent);
  --itt-t3: color-mix(in oklab, var(--itt-ink) 44%, transparent);
  --itt-t4: color-mix(in oklab, var(--itt-ink) 22%, transparent);
  --itt-rule: color-mix(in oklab, var(--itt-ink) 14%, transparent);
  --itt-rule-2: color-mix(in oklab, var(--itt-ink) 7%, transparent);
  --itt-ok: #1f8a4c; --itt-warn: #b7791f; --itt-bad: #c4321a;
  --itt-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --itt-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --itt-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --itt-font: var(--itt-sans);
  --itt-ease: cubic-bezier(.2, .8, .2, 1);
  --itt-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --itt-on-signal: #ffffff;
  font: 13px/20px var(--itt-font); color: var(--itt-t1);
  position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden;
  background: var(--itt-paper);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .itt {
  --itt-paper: #0c0c0d; --itt-sheet: #1c1c1e; --itt-ink: #f5f5f5; --itt-signal: #4d8dff;
  --itt-ok: #4cc17f; --itt-warn: #d9a441; --itt-bad: #ef6a52;
}
.itt *, .itt *::before, .itt *::after { box-sizing: border-box }
:where(.itt) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.itt) input, :where(.itt) textarea { font: inherit; color: inherit }
.itt :focus-visible { outline: 2px solid color-mix(in oklab, var(--itt-accent) 70%, transparent); outline-offset: 1px }
.itt-create input:focus-visible, .itt-fsearch input:focus-visible, .itt-addsub input:focus-visible, .itt-compose textarea:focus-visible, .itt textarea.itt-dp-title:focus-visible { outline: 0 }
.itt-mono { font-family: var(--itt-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--itt-t3); font-weight: 400 }
.itt-vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* ---- rail ---- */
.itt-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--itt-sheet); border-right: 1px solid var(--itt-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.itt-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--itt-serif); letter-spacing: -.01em; color: var(--itt-ink) }
.itt-brand svg { flex: none }
.itt-group { padding: 0 12px; margin-top: 12px }
.itt-group > .itt-mono { padding: 0 6px; margin-bottom: 6px; display: block }
.itt-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-paper); color: var(--itt-t1); transition: box-shadow .2s var(--itt-ease) }
.itt-ws:hover { box-shadow: 0 0 0 1px var(--itt-t4) }
.itt-ws svg { color: var(--itt-t3) }
.itt-nav { position: relative; margin: 0 0 0 8px; padding: 0 }
.itt-nav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--itt-rule) }
.itt-item { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--itt-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--itt-ease), background-color .2s var(--itt-ease) }
.itt-item:hover { color: var(--itt-t1); background: var(--itt-rule-2) }
.itt-item svg { flex: none; stroke-width: 1.5 }
.itt-item.is-active { color: var(--itt-ink) }
.itt-item.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--itt-accent); transform-origin: top; animation: itt-tick .5s var(--itt-ease) backwards }
.itt-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--itt-t4); position: relative }
.itt-dot.ok { background: var(--itt-ok) }
.itt-dot.live { background: var(--itt-accent) }
.itt-dot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--itt-accent); animation: itt-pulse 1.6s var(--itt-ease) infinite }
.itt-item .itt-mono { margin-left: auto; font-size: 9.5px }
.itt-spacer { flex: 1; min-height: 12px }
.itt-sidetools { padding: 8px 12px }
.itt-user { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--itt-rule) }
.itt-user .av { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--itt-ink); color: var(--itt-paper); font: 600 10px/1 var(--itt-mono); letter-spacing: .04em }
.itt-user b { font-weight: 500; color: var(--itt-t1); display: block; line-height: 16px }
.itt-user span.r { display: block; font-size: 11.5px; line-height: 14px; color: var(--itt-t3) }
.itt-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--itt-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--itt-ease) }

/* ---- main + top bar ---- */
.itt-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; position: relative }
.itt-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--itt-rule); background: var(--itt-paper) }
.itt-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-sheet) }
.itt-title { min-width: 0 }
.itt-title .itt-mono { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.itt-title h1 { margin: 0; font: 400 22px/24px var(--itt-serif); letter-spacing: -.01em; color: var(--itt-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.itt-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.itt-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-sheet); color: var(--itt-t3); transition: box-shadow .2s var(--itt-ease) }
.itt-search:hover { box-shadow: 0 0 0 1px var(--itt-t4) }
.itt-search span { flex: 1 }
.itt-search kbd { font: 500 10px/14px var(--itt-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); color: var(--itt-t3) }
.itt-btn { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-sheet); color: var(--itt-t1); font-weight: 500; white-space: nowrap; transition: box-shadow .2s var(--itt-ease), opacity .2s }
.itt-btn:hover { box-shadow: 0 0 0 1px var(--itt-t3) }
.itt-btn.ink { background: var(--itt-ink); color: var(--itt-paper); box-shadow: none }
.itt-btn.ink:hover { opacity: .88 }
.itt-btn.sm { height: 26px; padding: 0 9px; font-size: 12px }
.itt-btn:disabled { opacity: .4; cursor: default }

/* ---- body ---- */
.itt-body { flex: 1; min-height: 0; display: flex; position: relative; overflow: hidden }
.itt-work { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column }

/* project head */
.itt-head { flex: none; padding: 16px 20px 14px; container: itth / inline-size; border-bottom: 1px solid var(--itt-rule); position: relative }
.itt-ph { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 14px }
.itt-ph h2 { margin: 2px 0 2px; font: 400 32px/36px var(--itt-serif); letter-spacing: -.01em; color: var(--itt-ink) }
.itt-ph h2 em { font-style: italic }
.itt-ph p { margin: 0; color: var(--itt-t2); font-size: 13px; line-height: 20px; max-width: 62ch; text-wrap: pretty }
.itt-team { display: flex; align-items: center; gap: 10px; flex: none }
.itt-team .stack { display: flex; gap: 4px }
.itt-grid2 { display: grid; grid-template-columns: minmax(0, 540px) minmax(0, 1fr); gap: 24px; align-items: stretch }
.itt-readout { display: grid; grid-template-columns: repeat(4, auto); border: 1px solid var(--itt-rule); background: var(--itt-sheet); align-self: start }
.itt-readout > div { padding: 8px 14px 9px; border-left: 1px solid var(--itt-rule); min-width: 0 }
.itt-readout > div:first-child { border-left: 0 }
.itt-readout dt { font: 10px/14px var(--itt-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--itt-t3); white-space: nowrap }
.itt-readout dd { margin: 0; font: 500 18px/24px var(--itt-mono); font-variant-numeric: tabular-nums; color: var(--itt-ink); white-space: nowrap }
.itt-readout dd small { font: 10px/14px var(--itt-mono); letter-spacing: .08em; color: var(--itt-t3); margin-left: 6px }
.itt-pace { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px 14px }
.itt-pace b { color: var(--itt-t1); font-weight: 500 }
.itt-fig { margin: 0; min-width: 0 }
.itt-burn { position: relative; height: 56px }
.itt-burn svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.itt-burn .ideal { stroke: var(--itt-t3); stroke-width: 1; stroke-dasharray: 3 3; fill: none }
.itt-burn .actual { stroke: var(--itt-ink); stroke-width: 1.5; fill: none; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; animation: itt-trace 1s var(--itt-ease-trace) backwards .15s }
.itt-burn .area { fill: var(--itt-ink); opacity: .05; animation: itt-fade .6s var(--itt-ease) backwards .9s }
.itt-burn .pt { fill: var(--itt-ink); animation: itt-fade .3s var(--itt-ease) backwards 1s }
.itt-burn .note { position: absolute; font: italic 400 13px/14px var(--itt-serif); color: var(--itt-t2); white-space: nowrap; padding-left: 6px; border-left: 1px solid var(--itt-t4); animation: itt-fade .5s var(--itt-ease) backwards 1.1s }
.itt-rul { position: relative; display: grid; grid-template-columns: repeat(14, 1fr); border-top: 1px solid var(--itt-rule) }
.itt-rul > span { position: relative; height: 24px; padding: 6px 0 0 3px; font: 9.5px/12px var(--itt-mono); color: var(--itt-t3); letter-spacing: .02em; border-left: 1px solid var(--itt-t4); background: linear-gradient(90deg, var(--itt-t4) 0 1px, transparent 1px) 0 0 / 25% 3px repeat-x; white-space: nowrap; overflow: hidden }
.itt-rul > span:first-child { border-left-color: var(--itt-t3) }
.itt-rul > span.we { color: var(--itt-t4) }
.itt-rul > span.td { color: var(--itt-ink); font-weight: 600 }
.itt-rul > span::before { content: ""; position: absolute; left: -1px; top: 0; width: 1px; height: 7px; background: var(--itt-t3) }
.itt-rul > span.we::before { background: var(--itt-t4) }
.itt-rul::after { content: ""; position: absolute; right: 0; top: 0; width: 1px; height: 7px; background: var(--itt-t3) }
.itt-now { position: absolute; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--itt-accent); z-index: 2; transform-origin: bottom; animation: itt-tick .6s var(--itt-ease) backwards .5s; pointer-events: none }
.itt-now i { position: absolute; top: -1px; left: 4px; font: 600 9px/12px var(--itt-mono); font-style: normal; letter-spacing: .08em; color: var(--itt-accent); white-space: nowrap }
.itt-figcap { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px }
.itt-figcap .l::before { content: ""; display: inline-block; width: 12px; height: 0; border-top: 1.5px solid var(--itt-ink); vertical-align: 3px; margin: 0 4px 0 10px }
.itt-figcap .l.i::before { border-top: 1px dashed var(--itt-t3) }
@container itth (max-width: 939px) {
  .itt-grid2 { grid-template-columns: 236px minmax(0, 1fr); gap: 20px }
  .itt-readout { grid-template-columns: 1fr 1fr }
  .itt-readout > div:nth-child(3) { border-left: 0 }
  .itt-readout > div:nth-child(n+3) { border-top: 1px solid var(--itt-rule) }
  .itt-readout dd small { display: block; margin: -4px 0 0 }
  .itt-pace { display: none }
  .itt-team { display: none }
  .itt-ph { margin-bottom: 10px }
  .itt-ph p { display: none }
}
@container itth (max-width: 620px) {
  .itt-grid2 { grid-template-columns: 1fr; gap: 14px }
  .itt-readout { grid-template-columns: repeat(4, 1fr) }
  .itt-readout > div:nth-child(3) { border-left: 1px solid var(--itt-rule) }
  .itt-readout > div:nth-child(n+3) { border-top: 0 }
  .itt-readout dd small { display: inline; margin: 0 0 0 6px }
  .itt-ph h2 { font-size: 28px; line-height: 32px }
  .itt-burn .note { display: none }
}
@container itth (max-width: 520px) {
  .itt-readout { grid-template-columns: 1fr 1fr }
  .itt-readout > div:nth-child(3) { border-left: 0 }
  .itt-readout > div:nth-child(n+3) { border-top: 1px solid var(--itt-rule) }
  .itt-readout dd small { display: block; margin: -4px 0 0 }
  .itt-figcap { flex-direction: column; gap: 2px }
  .itt-figcap .l:first-child::before { margin-left: 0 }
}

/* toolbar */
.itt-toolbar { flex: none; display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; padding: 9px 20px; border-bottom: 1px solid var(--itt-rule); background: var(--itt-paper); position: relative; z-index: 6 }
.itt-seg { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-sheet); height: 28px }
.itt-seg button { position: relative; z-index: 1; min-width: 70px; padding: 0 12px; text-align: center; font-weight: 500; color: var(--itt-t2); transition: color .2s var(--itt-ease) }
.itt-seg button[aria-checked="true"] { color: var(--itt-ink) }
.itt-seg button:hover { color: var(--itt-ink) }
.itt-seg .ind { position: absolute; left: 0; bottom: 0; height: 2px; width: calc(100% / var(--n)); background: var(--itt-ink); transform: translateX(calc(var(--i) * 100%)); transition: transform .3s var(--itt-ease) }
.itt-fbtn { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 9px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-sheet); color: var(--itt-t2); white-space: nowrap; transition: box-shadow .2s var(--itt-ease), color .2s }
.itt-fbtn:hover, .itt-fbtn[aria-expanded="true"] { box-shadow: 0 0 0 1px var(--itt-t3); color: var(--itt-ink) }
.itt-fbtn.on { color: var(--itt-ink); box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-fbtn b { font: 500 10.5px/14px var(--itt-mono); letter-spacing: .04em; color: var(--itt-ink) }
.itt-fbtn svg { color: var(--itt-t3) }
.itt-fsearch { position: relative; display: flex; align-items: center; margin-left: auto }
.itt-fsearch svg { position: absolute; left: 8px; color: var(--itt-t3); pointer-events: none }
.itt-fsearch input { width: 220px; height: 28px; padding: 0 28px 0 28px; border: 0; border-radius: 2px; background: var(--itt-sheet); box-shadow: 0 0 0 1px var(--itt-rule); outline: 0; transition: box-shadow .2s var(--itt-ease) }
.itt-fsearch input:focus { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-fsearch input::placeholder { color: var(--itt-t3) }
.itt-fsearch kbd { position: absolute; right: 7px; font: 500 10px/14px var(--itt-mono); padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); color: var(--itt-t3); pointer-events: none }
.itt-fsearch button { position: absolute; right: 4px; width: 20px; height: 20px; display: grid; place-items: center; color: var(--itt-t3) }
.itt-fsearch button:hover { color: var(--itt-ink) }
.itt-count { white-space: nowrap }
.itt-clear { font: 500 10.5px/14px var(--itt-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--itt-t2); text-decoration: underline; text-decoration-color: var(--itt-t4); text-underline-offset: 3px }
.itt-clear:hover { color: var(--itt-ink) }

/* popover */
.itt-pop { position: fixed; z-index: 80; padding: 4px; background: var(--itt-sheet); border-radius: 4px; box-shadow: 0 0 0 1px var(--itt-rule), 0 1px 0 var(--itt-rule), 0 12px 24px -16px rgb(0 0 0 / .25); max-height: min(360px, 60dvh); overflow-y: auto; animation: itt-settle .16s var(--itt-ease) backwards }
.itt-pop .itt-mono.cap { display: block; padding: 6px 8px 4px }
.itt-pop hr { border: 0; border-top: 1px solid var(--itt-rule); margin: 4px 0 }
.itt-mi { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 28px; padding: 3px 8px 3px 4px; border-radius: 2px; color: var(--itt-t1) }
.itt-mi:hover, .itt-mi:focus-visible { background: var(--itt-rule-2); outline: 0 }
.itt-mi .ck { width: 14px; flex: none; display: grid; place-items: center; color: var(--itt-ink) }
.itt-mi .tx { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; white-space: nowrap }
.itt-mi .hint { font-size: 10px }

/* create row */
.itt-create { flex: none; position: relative; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 9px 20px; background: var(--itt-sheet); border-bottom: 1px solid var(--itt-rule); animation: itt-unmask .5s var(--itt-ease) backwards; z-index: 5 }
.itt-create::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--itt-accent); opacity: 0; animation: itt-sweep .5s var(--itt-ease) backwards; pointer-events: none }
.itt-create input { flex: 1 1 220px; min-width: 0; height: 30px; padding: 0 10px; border: 0; border-radius: 2px; background: var(--itt-paper); box-shadow: 0 0 0 1px var(--itt-rule); outline: 0; transition: box-shadow .2s var(--itt-ease) }
.itt-create input:focus { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-create input::placeholder { color: var(--itt-t3) }
.itt-create .itt-mono { margin-right: 2px }

/* ---- view ---- */
.itt-view { flex: 1; min-height: 0; position: relative; overflow: hidden }
.itt-view > .itt-in { height: 100%; animation: itt-unmask .6s var(--itt-ease) backwards }
.itt-view > .itt-line { position: absolute; left: 0; right: 0; top: 0; height: 1px; opacity: 0; background: var(--itt-accent); z-index: 4; pointer-events: none; animation: itt-sweep .6s var(--itt-ease) backwards }

/* board */
.itt-board { position: relative; height: 100%; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(216px, 1fr); overflow-x: auto; padding: 0 20px; gap: 0 }
.itt-board::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle, var(--itt-t4) .6px, transparent .9px) 0 0 / 8px 8px; opacity: .4; -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, #000 10%, transparent 100%); mask-image: radial-gradient(ellipse 80% 70% at 50% 30%, #000 10%, transparent 100%) }
.itt-col { position: relative; min-height: 0; display: flex; flex-direction: column; padding: 0 10px; border-left: 1px solid var(--itt-rule) }
.itt-col:first-child { border-left: 0; padding-left: 0 }
.itt-col:last-child { padding-right: 0 }
.itt-col-head { position: relative; flex: none; display: flex; align-items: center; gap: 6px; white-space: nowrap; height: 40px; padding-top: 2px; font-weight: 500; color: var(--itt-ink) }
.itt-col-head .itt-mono { font-variant-numeric: tabular-nums }
.itt-col-head .grow { flex: 1 }
.itt-col-head .add { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 2px; color: var(--itt-t3); transition: color .2s, background-color .2s }
.itt-col-head .add:hover { color: var(--itt-ink); background: var(--itt-rule-2) }
.itt-col-head::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: repeating-linear-gradient(90deg, var(--itt-t4) 0 1px, transparent 1px 8px) 0 100% / 100% 3px no-repeat, linear-gradient(var(--itt-rule), var(--itt-rule)) 0 100% / 100% 1px no-repeat }
.itt-col.is-target .itt-col-head::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--itt-accent) }
.itt-col-body { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 0 28px; display: flex; flex-direction: column; gap: 8px; scrollbar-width: thin; scrollbar-color: var(--itt-t4) transparent }
.itt-col-body.drop-end::after { content: ""; flex: none; height: 2px; margin-top: -6px; background: var(--itt-accent) }
.itt-empty { padding: 14px 10px; text-align: center; border: 1px dashed var(--itt-rule); border-radius: 4px }

.itt-card { position: relative; flex: none; padding: 9px 10px 9px 12px; background: var(--itt-sheet); border-radius: 4px; box-shadow: 0 0 0 1px var(--itt-rule); cursor: grab; touch-action: pan-x pan-y; user-select: none; -webkit-user-select: none; transition: box-shadow .2s var(--itt-ease), opacity .2s; animation: itt-settle .3s var(--itt-ease) backwards; animation-delay: calc(var(--k, 0) * 18ms) }
.itt-card:hover { box-shadow: 0 0 0 1px var(--itt-t4) }
.itt-card.sel { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-card.sel::before { content: ""; position: absolute; left: -1px; top: 7px; bottom: 7px; width: 2px; background: var(--itt-accent) }
.itt-card.drop-before::after { content: ""; position: absolute; left: 0; right: 0; top: -5px; height: 2px; background: var(--itt-accent) }
.itt-card.origin { opacity: .35; box-shadow: 0 0 0 1px var(--itt-rule); background: transparent }
.itt-card.grabbed { box-shadow: 0 0 0 1px var(--itt-ink), 0 1px 0 var(--itt-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
.itt-card.done .ttl { color: var(--itt-t2) }
.itt-card.fresh { animation: itt-new 1.4s var(--itt-ease) backwards }
.itt-card .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px }
.itt-card .ttl { margin: 0; font: 500 13px/18px var(--itt-sans); color: var(--itt-ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-wrap: pretty }
.itt-card .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px }
.itt-card .live { display: flex; align-items: center; margin-top: 8px; padding-left: 7px; height: 16px; border-left: 1px solid var(--itt-t3); font: 11px/16px var(--itt-sans); color: var(--itt-t2); white-space: nowrap; overflow: hidden }
.itt-card .live span { overflow: hidden; text-overflow: ellipsis }
.itt-card .foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 9px }
.itt-card .foot .m { display: flex; align-items: center; gap: 10px; min-width: 0 }
.itt-caret { display: inline-block; flex: none; width: 5px; height: 11px; margin-left: 2px; background: var(--itt-ink); animation: itt-blink 1.1s steps(1) infinite }
.itt-ghost { position: fixed; left: 0; top: 0; z-index: 90; pointer-events: none; box-shadow: 0 0 0 1px var(--itt-ink), 0 1px 0 var(--itt-rule), 0 12px 24px -16px rgb(0 0 0 / .35) !important; background: var(--itt-sheet) !important; cursor: grabbing; animation: none !important }
.itt-scan { position: absolute; inset: 0; overflow: hidden; border-radius: 4px; pointer-events: none }
.itt-scan::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--itt-accent); animation: itt-sweep .9s var(--itt-ease) both }
.itt-ticks { display: inline-flex; gap: 2px; align-items: center }
.itt-ticks i { width: 5px; height: 8px; box-shadow: inset 0 0 0 1px var(--itt-t3) }
.itt-ticks i.on { background: var(--itt-ink); box-shadow: none }

.itt-chip { display: inline-flex; align-items: center; height: 17px; padding: 0 5px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); font: 9.5px/17px var(--itt-mono); letter-spacing: .04em; color: var(--itt-t2); white-space: nowrap }
.itt-pri { display: inline-flex; align-items: flex-end; gap: 1.5px; height: 11px; flex: none }
.itt-pri i { width: 3px; background: var(--itt-t4) }
.itt-pri i.on { background: var(--itt-ink) }
.itt-who { position: relative; flex: none; display: inline-grid; place-items: center; border-radius: 2px; background: color-mix(in oklab, var(--itt-ink) 9%, transparent); color: var(--itt-ink); font: 600 9.5px/1 var(--itt-mono); letter-spacing: .03em }
.itt-who.agent { background: var(--itt-sheet); box-shadow: 0 0 0 1px var(--itt-t3); font: italic 400 13px/1 var(--itt-serif) }
.itt-who.none { background: none; box-shadow: inset 0 0 0 1px var(--itt-t4); border-radius: 2px }
.itt-star { position: absolute; right: -3px; top: -3px; width: 7px; height: 7px; fill: var(--itt-ink); stroke: var(--itt-paper); stroke-width: .7; paint-order: stroke }
.itt-sicon { flex: none; color: var(--itt-ink) }
.itt-dither { flex: none; color: var(--itt-t2); box-shadow: 0 0 0 1px var(--itt-rule) }
.itt-cb { flex: none; width: 14px; height: 14px; display: grid; place-items: center; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--itt-t3); color: transparent; transition: background-color .2s var(--itt-ease), color .2s }
.itt-cb:hover { box-shadow: inset 0 0 0 1px var(--itt-ink) }
.itt-cb.on { background: var(--itt-ink); color: var(--itt-paper); box-shadow: none }

/* list */
.itt-list { height: 100%; overflow-y: auto; padding: 0 20px 28px; container: ittl / inline-size }
.itt-lhead, .itt-lrow { display: grid; grid-template-columns: var(--cols, 72px minmax(0, 1fr) 132px 56px 128px 52px); align-items: center; column-gap: 12px; padding: 0 8px }
.itt-lhead { position: sticky; top: 0; z-index: 3; height: 32px; background: var(--itt-paper); border-bottom: 1px solid var(--itt-rule) }
.itt-lhead button { display: inline-flex; align-items: center; gap: 4px; height: 24px; font: 10.5px/14px var(--itt-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--itt-t3); transition: color .2s }
.itt-lhead button:hover, .itt-lhead button.on { color: var(--itt-ink) }
.itt-lhead .nosort { font: 10.5px/14px var(--itt-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--itt-t3) }
.itt-lgroup { margin-top: 16px }
.itt-lgroup > .gh { display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 8px; border-bottom: 1px solid var(--itt-rule); font-weight: 500; color: var(--itt-ink) }
.itt-lgroup > .gh svg.chev { color: var(--itt-t3); transition: transform .2s var(--itt-ease) }
.itt-lgroup > .gh[aria-expanded="true"] svg.chev { transform: rotate(90deg) }
.itt-lgroup > .gh .grow { flex: 1 }
.itt-lrow { position: relative; height: 38px; border-bottom: 1px solid var(--itt-rule-2); cursor: pointer; transition: background-color .2s var(--itt-ease); animation: itt-settle .28s var(--itt-ease) backwards; animation-delay: calc(var(--k, 0) * 14ms) }
.itt-lrow:hover { background: var(--itt-rule-2) }
.itt-lrow.sel { background: var(--itt-signal-soft) }
.itt-lrow.sel::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2px; background: var(--itt-accent) }
.itt-lrow.fresh { animation: itt-new 1.4s var(--itt-ease) backwards }
.itt-lrow .id { font: 10.5px/14px var(--itt-mono); letter-spacing: .04em; color: var(--itt-t3) }
.itt-lrow .name { min-width: 0; display: flex; align-items: center; gap: 8px }
.itt-lrow .name > button { min-width: 0; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--itt-ink) }
.itt-lrow .name > button:focus-visible { outline-offset: 3px }
.itt-lrow.done .name > button { color: var(--itt-t2); font-weight: 400 }
.itt-lrow .name .chips { display: flex; gap: 4px; flex: none }
.itt-lrow .st { display: inline-flex; align-items: center; gap: 7px; height: 26px; margin-left: -6px; padding: 0 6px; border-radius: 2px; color: var(--itt-t1); white-space: nowrap; transition: background-color .2s, box-shadow .2s }
.itt-lrow .st:hover, .itt-lrow .st[aria-expanded="true"] { background: var(--itt-rule-2); box-shadow: 0 0 0 1px var(--itt-rule) }
.itt-lrow .st svg.cv { color: var(--itt-t3) }
.itt-lrow .asg { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--itt-t2) }
.itt-lrow .asg span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.itt-lrow .est { font: 11px/14px var(--itt-mono); color: var(--itt-t2); font-variant-numeric: tabular-nums }
@container ittl (max-width: 760px) {
  .itt-lhead, .itt-lrow { --cols: 64px minmax(0, 1fr) 124px 44px 28px }
  .itt-lrow .name .chips, .itt-c-est { display: none }
  .itt-lrow .asg span { display: none }
  .itt-lhead .c-who { visibility: hidden }
}
@container ittl (max-width: 520px) {
  .itt-lhead, .itt-lrow { --cols: 54px minmax(0, 1fr) 28px 28px }
  .itt-c-pri { display: none }
  .itt-lrow .st span, .itt-lrow .st svg.cv { display: none }
  .itt-lrow .st { margin-left: 0 }
  .itt-lhead .c-st { visibility: hidden }
}

/* timeline */
.itt-tl { height: 100%; overflow: auto; position: relative; --lw: 252px; --dw: 30px; --w: calc(28 * var(--dw)); --rh: 34px }
.itt-tl-in { position: relative; width: calc(var(--lw) + var(--w)); min-width: 100% }
.itt-tl-head { position: sticky; top: 0; z-index: 5; display: grid; grid-template-columns: var(--lw) var(--w); background: var(--itt-paper); border-bottom: 1px solid var(--itt-rule) }
.itt-tl-corner { position: sticky; left: 0; z-index: 6; background: var(--itt-paper); border-right: 1px solid var(--itt-rule); display: flex; align-items: flex-end; justify-content: space-between; padding: 0 12px 8px 20px }
.itt-tl-cal { position: relative }
.itt-tl-cyc { display: flex; height: 22px; border-bottom: 1px solid var(--itt-rule-2) }
.itt-tl-cyc span { display: block; padding: 4px 0 0 6px; border-left: 1px solid var(--itt-t4); overflow: hidden; white-space: nowrap }
.itt-tl-cyc span.cur { color: var(--itt-ink); border-left-color: var(--itt-t3) }
.itt-tl-days { display: grid; grid-template-columns: repeat(28, var(--dw)); height: 36px }
.itt-tl-days > span { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; font: 9.5px/12px var(--itt-mono); color: var(--itt-t3); border-left: 1px solid var(--itt-rule-2) }
.itt-tl-days > span.we { color: var(--itt-t4) }
.itt-tl-days > span.td { color: var(--itt-ink); font-weight: 600 }
.itt-tl-days > span.td::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--itt-accent) }
.itt-tl-days > span em { font-style: normal; opacity: .75 }
.itt-tl-body { position: relative }
.itt-tl-bg { position: absolute; top: 0; bottom: 0; left: var(--lw); width: var(--w); pointer-events: none; z-index: 0;
  background: repeating-linear-gradient(90deg, var(--itt-rule-2) 0 1px, transparent 1px var(--dw)) }
.itt-tl-bg .we { position: absolute; top: 0; bottom: 0; width: var(--dw); background: repeating-linear-gradient(135deg, var(--itt-rule-2) 0 1px, transparent 1px 5px) }
.itt-tl-bg .cyc { position: absolute; top: 0; bottom: 0; background: color-mix(in oklab, var(--itt-sheet) 70%, transparent); box-shadow: inset 1px 0 var(--itt-rule), inset -1px 0 var(--itt-rule) }
.itt-tl-bg .today { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--itt-accent); opacity: .7 }
.itt-tl-links { position: absolute; top: 0; left: var(--lw); z-index: 1; pointer-events: none; overflow: visible }
.itt-tl-links path { fill: none; stroke: var(--itt-t3); stroke-width: 1; stroke-dasharray: 1; stroke-dashoffset: 0; animation: itt-trace .8s var(--itt-ease-trace) backwards; animation-delay: calc(.4s + var(--k) * 24ms) }
.itt-tl-links path.hot { stroke: var(--itt-ink); stroke-width: 1.4 }
.itt-tl-links path.head { fill: var(--itt-t3); stroke: none; stroke-dasharray: none; animation: itt-fade .3s var(--itt-ease) backwards; animation-delay: calc(1s + var(--k) * 24ms) }
.itt-tl-links path.head.hot { fill: var(--itt-ink) }
.itt-tl-row { position: relative; z-index: 2; display: grid; grid-template-columns: var(--lw) var(--w); height: var(--rh) }
.itt-tl-lab { position: sticky; left: 0; z-index: 3; display: flex; align-items: center; gap: 8px; width: 100%; padding: 0 12px 0 20px; background: var(--itt-paper); border-right: 1px solid var(--itt-rule); border-bottom: 1px solid var(--itt-rule-2); text-align: left; transition: background-color .2s }
.itt-tl-lab .id { font: 10.5px/14px var(--itt-mono); letter-spacing: .04em; color: var(--itt-t3); flex: none }
.itt-tl-lab .ttl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--itt-t1) }
.itt-tl-row:hover .itt-tl-lab, .itt-tl-row.sel .itt-tl-lab { background: color-mix(in oklab, var(--itt-ink) 4%, var(--itt-paper)) }
.itt-tl-row.sel .itt-tl-lab { box-shadow: inset 2px 0 var(--itt-accent) }
.itt-tl-row.done .ttl { color: var(--itt-t3) }
.itt-tl-track { position: relative; border-bottom: 1px solid var(--itt-rule-2) }
.itt-tl-bar { position: absolute; top: 9px; height: 16px; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--itt-t2); background: var(--itt-sheet); overflow: hidden; cursor: pointer; transform-origin: left; animation: itt-grow-x .6s var(--itt-ease) backwards; animation-delay: calc(var(--k) * 14ms); transition: box-shadow .2s }
.itt-tl-bar:hover, .itt-tl-row.sel .itt-tl-bar { box-shadow: inset 0 0 0 1px var(--itt-ink), 0 0 0 1px var(--itt-ink) }
.itt-tl-bar .fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--itt-ink); transition: width .6s var(--itt-ease) }
.itt-tl-bar .rest { position: absolute; top: 0; bottom: 0; right: 0; background: radial-gradient(circle, var(--itt-t2) .65px, transparent .95px) 0 0 / 3px 3px }
.itt-tl-bar.done { box-shadow: none; background: var(--itt-t2) }
.itt-tl-bar.done:hover, .itt-tl-row.sel .itt-tl-bar.done { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-tl-bar.backlog { box-shadow: inset 0 0 0 1px var(--itt-t3); border: 0; background: repeating-linear-gradient(90deg, var(--itt-t4) 0 4px, transparent 4px 7px) 0 0 / 100% 1px no-repeat, repeating-linear-gradient(90deg, var(--itt-t4) 0 4px, transparent 4px 7px) 0 100% / 100% 1px no-repeat, var(--itt-sheet); }
.itt-tl-bar.todo .rest { display: none }
.itt-tl-tag { position: absolute; top: 10px; height: 14px; padding-left: 6px; font: 9.5px/14px var(--itt-mono); letter-spacing: .04em; color: var(--itt-t3); white-space: nowrap; pointer-events: none; display: flex; align-items: center; gap: 5px }
.itt-tl-tag .itt-who { box-shadow: none }
.itt-tl-empty { padding: 40px 20px; text-align: center }

/* ---- detail ---- */
.itt-dp { flex: none; width: 436px; min-height: 0; padding: 14px 14px 14px 12px; display: flex; animation: itt-slide .32s var(--itt-ease) backwards }
.itt-dp-sheet { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--itt-sheet); box-shadow: 0 0 0 1px var(--itt-rule); min-height: 0 }
.itt-crop { position: absolute; width: 8px; height: 8px; pointer-events: none; border: 0 solid var(--itt-t4) }
.itt-crop.tl { left: -10px; top: -10px; border-right-width: 1px; border-bottom-width: 1px }
.itt-crop.tr { right: -10px; top: -10px; border-left-width: 1px; border-bottom-width: 1px }
.itt-crop.bl { left: -10px; bottom: -10px; border-right-width: 1px; border-top-width: 1px }
.itt-crop.br { right: -10px; bottom: -10px; border-left-width: 1px; border-top-width: 1px }
.itt-dp-head { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 38px; padding: 0 8px 0 16px; border-bottom: 1px solid var(--itt-rule); background: linear-gradient(var(--itt-rule), var(--itt-rule)) 0 100% / 100% 1px no-repeat }
.itt-dp-head .id { display: flex; align-items: center; gap: 8px }
.itt-dp-head .id b { font-weight: 500; color: var(--itt-ink) }
.itt-dp-x { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 2px; color: var(--itt-t2) }
.itt-dp-x:hover { color: var(--itt-ink); background: var(--itt-rule-2) }
.itt-dp-ruler { flex: none; height: 8px; border-bottom: 1px solid var(--itt-rule); background: repeating-linear-gradient(90deg, var(--itt-t3) 0 1px, transparent 1px 48px) 0 100% / 100% 6px no-repeat, repeating-linear-gradient(90deg, var(--itt-t4) 0 1px, transparent 1px 8px) 0 100% / 100% 3px no-repeat }
.itt-dp-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px 12px; scrollbar-width: thin; scrollbar-color: var(--itt-t4) transparent }
.itt textarea.itt-dp-title { display: block; width: 100%; margin: 0 0 2px; padding: 0; border: 0; background: none; resize: none; outline: 0; font: 400 24px/28px var(--itt-serif); letter-spacing: -.01em; color: var(--itt-ink); field-sizing: content; text-wrap: balance; border-radius: 2px }
.itt textarea.itt-dp-title:focus { box-shadow: 0 1px 0 var(--itt-ink) }
.itt-dp-live { position: relative; display: flex; align-items: center; gap: 8px; margin: 10px 0 0; padding: 7px 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); background: var(--itt-paper); font: 11px/16px var(--itt-mono); color: var(--itt-t1); overflow: hidden }
.itt-dp-live .d { width: 6px; height: 6px; background: var(--itt-accent); flex: none }
.itt-dp-live span.t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.itt-dp-desc { margin: 12px 0 0; font: 400 13.5px/21px var(--itt-sans); color: var(--itt-t1); text-wrap: pretty }
.itt-dp-sec { margin-top: 20px }
.itt-dp-sec > .hd { display: flex; align-items: center; justify-content: space-between; padding-bottom: 6px; margin-bottom: 8px; border-bottom: 1px solid var(--itt-rule) }
.itt-props { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--itt-rule); background: var(--itt-paper) }
.itt-props > div { padding: 7px 10px 8px; border-top: 1px solid var(--itt-rule); min-width: 0 }
.itt-props > div:nth-child(-n+2) { border-top: 0 }
.itt-props > div:nth-child(even) { border-left: 1px solid var(--itt-rule) }
.itt-props > div.full { grid-column: 1 / -1; border-left: 0 }
.itt-props dt { margin-bottom: 2px }
.itt-props dd { margin: 0; min-height: 22px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; color: var(--itt-t1) }
.itt-pbtn { display: inline-flex; align-items: center; gap: 7px; height: 24px; margin: 0 0 0 -6px; padding: 0 6px; border-radius: 2px; color: var(--itt-t1); transition: background-color .2s, box-shadow .2s }
.itt-pbtn:hover, .itt-pbtn[aria-expanded="true"] { background: var(--itt-rule-2); box-shadow: 0 0 0 1px var(--itt-rule) }
.itt-dep { font: 10.5px/14px var(--itt-mono); letter-spacing: .04em; padding: 1px 5px; border-radius: 2px; box-shadow: 0 0 0 1px var(--itt-rule); color: var(--itt-t1); transition: box-shadow .2s }
.itt-dep:hover { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-subs { list-style: none; margin: 0; padding: 0 }
.itt-subs li { display: flex; align-items: flex-start; gap: 9px; padding: 5px 0; min-height: 28px }
.itt-subs li .itt-cb { margin-top: 3px }
.itt-subs li span.t { flex: 1; min-width: 0; padding-top: 1px; color: var(--itt-t1) }
.itt-subs li.done span.t { color: var(--itt-t3); text-decoration: line-through; text-decoration-color: var(--itt-t4) }
.itt-subs li .by { margin-top: 3px }
.itt-addsub { display: flex; gap: 8px; align-items: center; margin-top: 6px }
.itt-addsub input { flex: 1; min-width: 0; height: 28px; padding: 0 8px; border: 0; border-radius: 2px; background: var(--itt-paper); box-shadow: 0 0 0 1px var(--itt-rule); outline: 0 }
.itt-addsub input:focus { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-addsub input::placeholder { color: var(--itt-t3) }
.itt-log { list-style: none; margin: 0; padding: 0; position: relative }
.itt-log::before { content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 1px; background: var(--itt-rule) }
.itt-log li { position: relative; padding: 0 0 12px 14px }
.itt-log li::before { content: ""; position: absolute; left: -2px; top: 6px; width: 5px; height: 1px; background: var(--itt-t3) }
.itt-log li.end { padding: 0; height: 1px }
.itt-log li.end::before { display: none }
.itt-log li.agent::before { width: 5px; height: 5px; top: 4px; left: -2px; background: var(--itt-ink); clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%) ; transform: scale(1.4) }
.itt-log .ln { font: 11px/16px var(--itt-mono); color: var(--itt-t2) }
.itt-log .ln > * { margin-right: 8px }
.itt-log .ln time { color: var(--itt-t3); letter-spacing: .02em; font-variant-numeric: tabular-nums }
.itt-log .ln b { font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: var(--itt-ink); font-size: 10.5px }
.itt-log .note { margin: 3px 0 0; padding-left: 10px; border-left: 1px solid var(--itt-t4); font: italic 400 15px/19px var(--itt-serif); color: var(--itt-t1) }
.itt-log .cm { margin: 3px 0 0; font: 400 13px/19px var(--itt-sans); color: var(--itt-t1); padding: 6px 9px; background: var(--itt-paper); box-shadow: 0 0 0 1px var(--itt-rule); border-radius: 2px; text-wrap: pretty }
.itt-compose { flex: none; border-top: 1px solid var(--itt-rule); padding: 10px 16px 12px; background: var(--itt-sheet) }
.itt-compose textarea { display: block; width: 100%; height: 56px; padding: 7px 9px; border: 0; border-radius: 2px; background: var(--itt-paper); box-shadow: 0 0 0 1px var(--itt-rule); resize: none; outline: 0; transition: box-shadow .2s var(--itt-ease) }
.itt-compose textarea:focus { box-shadow: 0 0 0 1px var(--itt-ink) }
.itt-compose textarea::placeholder { color: var(--itt-t3) }
.itt-compose .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px }
.itt-dp-scrim { display: none }
.itt-dp-gone { display: grid; place-items: center; flex: 1; padding: 20px; text-align: center }

/* ---- motion ---- */
@keyframes itt-pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes itt-blink { 50% { opacity: 0 } }
@keyframes itt-tick { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes itt-settle { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes itt-fade { from { opacity: 0 } }
@keyframes itt-trace { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes itt-unmask { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes itt-sweep { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: 100%; opacity: 0 } }
@keyframes itt-grow-x { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes itt-slide { from { opacity: 0; transform: translateX(14px) } to { opacity: 1; transform: none } }
@keyframes itt-new { 0%, 30% { background-color: var(--itt-signal-soft) } 100% { background-color: transparent } }

/* ---- responsive ---- */
@media (max-width: 1279px) {
  .itt-dp { position: absolute; right: 0; top: 0; bottom: 0; z-index: 25; width: min(436px, 100%); background: var(--itt-paper); box-shadow: -1px 0 0 var(--itt-rule), -12px 0 24px -16px rgb(0 0 0 / .25) }
  .itt-dp-scrim { display: block; position: absolute; inset: 0; z-index: 24; background: color-mix(in oklab, var(--itt-ink) 20%, transparent); animation: itt-fade .3s var(--itt-ease) backwards }
}
@media (max-width: 1023px) {
  .itt-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--itt-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--itt-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .itt.is-open .itt-rail { transform: none; visibility: visible; transition: transform .32s var(--itt-ease), visibility 0s }
  .itt.is-open .itt-scrim { opacity: 1; pointer-events: auto }
  .itt-menu { display: grid }
}
@media (max-width: 1099px) { .itt-search { display: none } }
@media (max-width: 767px) {
  .itt-top { padding: 0 12px; gap: 10px }
  .itt-title .itt-mono { display: none }
  .itt-title h1 { font-size: 21px }
  .itt-actions .itt-btn.ink .lbl { display: none }
  .itt-actions .itt-btn.ink { width: 30px; padding: 0; justify-content: center }
  .itt-work { display: block; overflow-y: auto; overscroll-behavior: contain }
  .itt-head { padding: 14px 14px 12px }
  .itt-toolbar { padding: 8px 14px; position: sticky; top: 0; background: var(--itt-paper) }
  .itt-fsearch { margin-left: 0; flex: 1 1 100%; order: -1 }
  .itt-fsearch input { width: 100% }
  .itt-seg { flex: 1 1 100% }
  .itt-seg button { min-width: 0 }
  .itt-create { padding: 9px 14px }
  .itt-view { overflow: visible }
  .itt-view > .itt-in { height: auto }
  .itt-view > .itt-line { display: none }
  .itt-board { height: auto; padding: 0 14px; grid-auto-columns: 78vw; scroll-snap-type: x proximity; overflow-x: auto; align-items: start }
  .itt-col { scroll-snap-align: start }
  .itt-col-body { overflow: visible; min-height: 120px }
  .itt-list { height: auto; padding: 0 14px 28px; overflow: visible }
  .itt-lhead { top: 0; position: static }
  .itt-tl { height: auto; max-height: none; --lw: 128px; --dw: 24px; overflow-x: auto; overflow-y: visible }
  .itt-tl-head { position: static }
  .itt-tl-corner { padding-left: 12px }
  .itt-tl-lab { padding: 0 8px 0 12px }
  .itt-tl-lab .id { display: none }
  .itt-dp { position: absolute; inset: 0; width: 100%; padding: 0; z-index: 40; background: var(--itt-sheet) }
  .itt-dp-sheet { box-shadow: none }
  .itt-dp .itt-crop { display: none }
  .itt-dp-scrim { display: none }
  .itt-dp-title { font-size: 22px; line-height: 26px }
}
@media (prefers-reduced-motion: reduce) {
  .itt *, .itt *::before, .itt *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Rail                                    */
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

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--itt-accent)" strokeWidth="1.5" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Project header + burn                         */
/* -------------------------------------------------------------------------- */

function Burn({ remaining, reduced }: { remaining: number; reduced: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const w = useWidth(ref)
  const H = 56
  const hist = [...BURN_HIST, remaining]
  const max = Math.max(...hist) * 1.06
  const X = (d: number) => (d / DAYS) * w
  const Y = (v: number) => 20 + (1 - v / max) * (H - 24)
  const pts: [number, number][] = [[0, hist[0]]]
  BURN_HIST.forEach((v, i) => pts.push([i + 1, v]))
  pts.push([TODAY + NOW_FRAC, remaining])
  const line = pts.map(([d, v], i) => `${i ? "L" : "M"}${X(d).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ")
  const area = `${line} L${X(TODAY + NOW_FRAC).toFixed(1)} ${H} L0 ${H} Z`
  const nowX = X(TODAY + NOW_FRAC)
  return (
    <div className="itt-burn" ref={ref} key={reduced ? "r" : "m"}>
      <svg viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path className="area" d={area} />
        <path className="ideal" d={`M0 ${Y(hist[0]).toFixed(1)} L${w} ${Y(0).toFixed(1)}`} />
        <path className="actual" pathLength={1} d={line} />
        <rect className="pt" x={nowX - 2.5} y={Y(remaining) - 2.5} width="5" height="5" />
      </svg>
      <span className="note" style={{ left: X(SCOPE_NOTE_DAY + 0.9), top: 0 }}>+3 scope, Wednesday</span>
    </div>
  )
}

function ProjectHead({ tasks, reduced }: { tasks: Task[]; reduced: boolean }) {
  const open = tasks.filter((t) => t.status !== "done").length
  const prog = tasks.filter((t) => t.status === "progress").length
  const doneWeek = tasks.filter((t) => t.status === "done" && (t.done ?? 0) >= 7).length
  const remaining = tasks.filter((t) => t.status === "todo" || t.status === "progress" || t.status === "review").reduce((a, t) => a + t.est, 0)
  const left = DAYS - TODAY
  const need = remaining / left
  const pace = (BURN_HIST[7] - remaining) / 3
  return (
    <section className="itt-head" aria-label="Project summary">
      <div className="itt-ph">
        <div>
          <span className="itt-mono">Project RET · Cycle 12</span>
          <h2>
            Returns portal <em>v2</em>
          </h2>
          <p>Customers start, track and finish a return without contacting support. Replaces the email form on Nov 3.</p>
        </div>
        <div className="itt-team">
          <span className="itt-mono">Team</span>
          <div className="stack">
            {WHO_ORDER.map((w) => (
              <Av key={w} who={w} size={24} />
            ))}
          </div>
        </div>
      </div>
      <div className="itt-grid2">
        <div>
          <dl className="itt-readout">
            <div>
              <dt>Open</dt>
              <dd><Num value={open} reduced={reduced} /></dd>
            </div>
            <div>
              <dt>In progress</dt>
              <dd><Num value={prog} reduced={reduced} /></dd>
            </div>
            <div>
              <dt>Done this week</dt>
              <dd><Num value={doneWeek} reduced={reduced} /></dd>
            </div>
            <div>
              <dt>Cycle</dt>
              <dd>
                12<small>{left} DAYS LEFT</small>
              </dd>
            </div>
          </dl>
          <div className="itt-pace itt-mono">
            <span>Remaining <b><Num value={remaining} reduced={reduced} /> pt</b></span>
            <span>Needs <b>{need.toFixed(1)} /day</b></span>
            <span>Pace <b>{pace.toFixed(1)} /day</b></span>
          </div>
        </div>
        <figure className="itt-fig">
          <Burn remaining={remaining} reduced={reduced} />
          <div className="itt-rul" role="img" aria-label={`Cycle 12, day ${TODAY + 1} of ${DAYS}`}>
            {Array.from({ length: DAYS }, (_, d) => (
              <span key={d} className={dow(d) > 4 ? "we" : d === TODAY ? "td" : ""}>
                {WD[dow(d)]}
                {dayDate(d).getUTCDate()}
              </span>
            ))}
            <i className="itt-now" style={{ left: `${((TODAY + NOW_FRAC) / DAYS) * 100}%` }} />
          </div>
          <figcaption className="itt-figcap itt-mono">
            <span>FIG. 1 — Remaining scope, points</span>
            <span>
              <span className="l">Actual</span>
              <span className="l i">Ideal</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Filters                                   */
/* -------------------------------------------------------------------------- */

const NO_FILTERS: Filters = { q: "", who: "all", labels: [], pri: [] }

function matches(t: Task, f: Filters) {
  if (f.who === "agents" && !(t.who && PEOPLE[t.who].agent)) return false
  if (f.who === "humans" && !(t.who && !PEOPLE[t.who].agent)) return false
  if (f.who === "none" && t.who) return false
  if (f.who !== "all" && f.who !== "agents" && f.who !== "humans" && f.who !== "none" && t.who !== f.who) return false
  if (f.labels.length && !f.labels.some((l) => t.labels.includes(l))) return false
  if (f.pri.length && !f.pri.includes(t.pri)) return false
  const q = f.q.trim().toLowerCase()
  if (q) {
    const hay = `${t.id} ${t.title} ${t.labels.join(" ")} ${t.who ? PEOPLE[t.who].name : "unassigned"} ${STATUS_LABEL[t.status]}`.toLowerCase()
    if (!q.split(/\s+/).every((w) => hay.includes(w))) return false
  }
  return true
}

function Toolbar({
  view,
  setView,
  f,
  setF,
  tasks,
  shown,
  searchRef,
}: {
  view: TaskTrackerView
  setView: (v: TaskTrackerView) => void
  f: Filters
  setF: React.Dispatch<React.SetStateAction<Filters>>
  tasks: Task[]
  shown: number
  searchRef: React.RefObject<HTMLInputElement | null>
}) {
  const active = f.who !== "all" || f.labels.length > 0 || f.pri.length > 0 || f.q !== ""
  const whoLabel =
    f.who === "all" ? "Assignee" : f.who === "agents" ? "Agents only" : f.who === "humans" ? "People only" : f.who === "none" ? "Unassigned" : PEOPLE[f.who].name.split(" ")[0]
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const cnt = (fn: (t: Task) => boolean) => tasks.filter(fn).length
  return (
    <div className="itt-toolbar" role="toolbar" aria-label="View and filters">
      <Seg
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: "board", label: "Board" },
          { value: "list", label: "List" },
          { value: "timeline", label: "Timeline" },
        ]}
      />
      <Pop
        trigger={(p) => (
          <button type="button" className={`itt-fbtn${f.who !== "all" ? " on" : ""}`} {...p}>
            {whoLabel}
            <ChevronDown size={13} strokeWidth={1.5} />
          </button>
        )}
      >
        {(close) => (
          <>
            {(
              [
                ["all", "Everyone", tasks.length],
                ["agents", "Agents only", cnt((t) => !!t.who && !!PEOPLE[t.who].agent)],
                ["humans", "People only", cnt((t) => !!t.who && !PEOPLE[t.who].agent)],
                ["none", "Unassigned", cnt((t) => !t.who)],
              ] as const
            ).map(([v, l, n]) => (
              <Mi
                key={v}
                checked={f.who === v}
                hint={n}
                onClick={() => {
                  setF((p) => ({ ...p, who: v }))
                  close()
                }}
              >
                {l}
              </Mi>
            ))}
            <hr />
            {WHO_ORDER.map((w) => (
              <Mi
                key={w}
                checked={f.who === w}
                hint={cnt((t) => t.who === w)}
                onClick={() => {
                  setF((p) => ({ ...p, who: w }))
                  close()
                }}
              >
                <Av who={w} size={18} />
                {PEOPLE[w].name}
              </Mi>
            ))}
          </>
        )}
      </Pop>
      <Pop
        width={188}
        trigger={(p) => (
          <button type="button" className={`itt-fbtn${f.labels.length ? " on" : ""}`} {...p}>
            Label
            {f.labels.length ? <b>{f.labels.length}</b> : null}
            <ChevronDown size={13} strokeWidth={1.5} />
          </button>
        )}
      >
        {() =>
          LABELS.map((l) => (
            <Mi key={l} multi checked={f.labels.includes(l)} hint={cnt((t) => t.labels.includes(l))} onClick={() => setF((p) => ({ ...p, labels: toggle(p.labels, l) }))}>
              {l}
            </Mi>
          ))
        }
      </Pop>
      <Pop
        width={180}
        trigger={(p) => (
          <button type="button" className={`itt-fbtn${f.pri.length ? " on" : ""}`} {...p}>
            Priority
            {f.pri.length ? <b>{f.pri.length}</b> : null}
            <ChevronDown size={13} strokeWidth={1.5} />
          </button>
        )}
      >
        {() =>
          ([4, 3, 2, 1] as Pri[]).map((p) => (
            <Mi key={p} multi checked={f.pri.includes(p)} hint={cnt((t) => t.pri === p)} onClick={() => setF((s) => ({ ...s, pri: toggle(s.pri, p) }))}>
              <PriBars p={p} />
              {PRI_LABEL[p]}
            </Mi>
          ))
        }
      </Pop>
      {active ? (
        <button type="button" className="itt-clear" onClick={() => setF(NO_FILTERS)}>
          Clear
        </button>
      ) : null}
      <span className="itt-mono itt-count" aria-live="polite">
        {shown} of {tasks.length} tasks
      </span>
      <label className="itt-fsearch">
        <Search size={14} strokeWidth={1.5} />
        <input
          ref={searchRef}
          type="search"
          value={f.q}
          placeholder="Filter tasks"
          aria-label="Filter tasks"
          onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Escape" && f.q) {
              e.stopPropagation()
              setF((p) => ({ ...p, q: "" }))
            }
          }}
        />
        {f.q ? (
          <button type="button" aria-label="Clear search" onClick={() => setF((p) => ({ ...p, q: "" }))}>
            <X size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </label>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Create row                                  */
/* -------------------------------------------------------------------------- */

function WhoItems({ value, onPick, close }: { value: Who | null; onPick: (w: Who | null) => void; close: () => void }) {
  return (
    <>
      <Mi
        checked={value === null}
        onClick={() => {
          onPick(null)
          close()
        }}
      >
        <Av who={null} size={18} />
        Unassigned
      </Mi>
      <hr />
      {WHO_ORDER.map((w) => (
        <Mi
          key={w}
          checked={value === w}
          hint={PEOPLE[w].agent ? "agent" : undefined}
          onClick={() => {
            onPick(w)
            close()
          }}
        >
          <Av who={w} size={18} />
          {PEOPLE[w].name}
        </Mi>
      ))}
    </>
  )
}

function StatusItems({ value, onPick, close }: { value: Status; onPick: (s: Status) => void; close: () => void }) {
  return (
    <>
      {STATUSES.map((s) => (
        <Mi
          key={s.id}
          checked={value === s.id}
          onClick={() => {
            onPick(s.id)
            close()
          }}
        >
          <StatusIcon s={s.id} />
          {s.label}
        </Mi>
      ))}
    </>
  )
}

function PriItems({ value, onPick, close }: { value: Pri; onPick: (p: Pri) => void; close: () => void }) {
  return (
    <>
      {([4, 3, 2, 1] as Pri[]).map((p) => (
        <Mi
          key={p}
          checked={value === p}
          onClick={() => {
            onPick(p)
            close()
          }}
        >
          <PriBars p={p} />
          {PRI_LABEL[p]}
        </Mi>
      ))}
    </>
  )
}

function CreateRow({
  initialStatus,
  onCreate,
  onCancel,
}: {
  initialStatus: Status
  onCreate: (d: { title: string; status: Status; pri: Pri; who: Who | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = React.useState("")
  const [status, setStatus] = React.useState<Status>(initialStatus)
  const [pri, setPri] = React.useState<Pri>(2)
  const [who, setWho] = React.useState<Who | null>(null)
  const inp = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    inp.current?.focus()
  }, [])
  const submit = () => {
    if (!title.trim()) return inp.current?.focus()
    onCreate({ title: title.trim(), status, pri, who })
  }
  return (
    <form
      className="itt-create"
      aria-label="New task"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation()
          onCancel()
        }
      }}
    >
      <span className="itt-mono">New</span>
      <input ref={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing? Press Enter to add" aria-label="Task title" />
      <Pop
        width={176}
        trigger={(p) => (
          <button type="button" className="itt-fbtn" {...p}>
            <StatusIcon s={status} />
            {STATUS_LABEL[status]}
          </button>
        )}
      >
        {(close) => <StatusItems value={status} onPick={setStatus} close={close} />}
      </Pop>
      <Pop
        width={176}
        trigger={(p) => (
          <button type="button" className="itt-fbtn" {...p}>
            <PriBars p={pri} />
            {PRI_LABEL[pri]}
          </button>
        )}
      >
        {(close) => <PriItems value={pri} onPick={setPri} close={close} />}
      </Pop>
      <Pop
        trigger={(p) => (
          <button type="button" className="itt-fbtn" {...p}>
            <Av who={who} size={16} />
            {who ? PEOPLE[who].name.split(" ")[0] : "Assignee"}
          </button>
        )}
      >
        {(close) => <WhoItems value={who} onPick={setWho} close={close} />}
      </Pop>
      <button type="submit" className="itt-btn ink sm">
        Add task
      </button>
      <button type="button" className="itt-btn sm" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Cards                                   */
/* -------------------------------------------------------------------------- */

function agentLines(t: Task): string[] | null {
  if (!t.who || !PEOPLE[t.who].agent || t.status !== "progress") return null
  if (t.live) return t.live
  const n = PEOPLE[t.who].name
  const open = t.subs.find((s) => !s.done)
  return [`${n} · reading the task and planning steps…`, `${n} · working on ${open ? `“${open.t}”` : "the next step"}…`]
}

function LiveLine({ t, run }: { t: Task; run: boolean }) {
  const lines = agentLines(t) ?? [""]
  const text = useTyper(lines, run)
  return (
    <div className="live" aria-hidden="true">
      <span>{text}</span>
      <i className="itt-caret" />
    </div>
  )
}

function SubTicks({ t }: { t: Task }) {
  if (!t.subs.length) return null
  const done = t.subs.filter((s) => s.done).length
  return (
    <span className="itt-ticks" title={`${done} of ${t.subs.length} sub-tasks done`}>
      {t.subs.slice(0, 8).map((s) => (
        <i key={s.id} className={s.done ? "on" : ""} />
      ))}
      <span className="itt-mono" style={{ marginLeft: 3 }}>
        {done}/{t.subs.length}
      </span>
    </span>
  )
}

const CardView = React.memo(function CardView({ t, run, scanN, ghost }: { t: Task; run: boolean; scanN?: number; ghost?: boolean }) {
  const live = !!agentLines(t)
  return (
    <>
      <div className="top">
        <span className="itt-mono">{t.id}</span>
        <PriBars p={t.pri} />
      </div>
      <p className="ttl">{t.title}</p>
      {t.labels.length ? (
        <div className="chips">
          {t.labels.map((l) => (
            <Chip key={l}>{l}</Chip>
          ))}
        </div>
      ) : null}
      {live ? <LiveLine t={t} run={run && !ghost} /> : null}
      <div className="foot">
        <div className="m">
          <SubTicks t={t} />
          {!t.subs.length ? <span className="itt-mono">{t.est} pt</span> : null}
        </div>
        <Av who={t.who} size={20} />
      </div>
      {scanN ? <i className="itt-scan" key={scanN} aria-hidden="true" /> : null}
    </>
  )
})

/* -------------------------------------------------------------------------- */
/*                                    Board                                   */
/* -------------------------------------------------------------------------- */

type DragState = { id: string; col: Status; before: string | null; w: number; h: number }

function Board({
  tasks,
  all,
  selId,
  onOpen,
  dispatch,
  run,
  flash,
  fresh,
  announce,
  onAdd,
  totalPts,
}: {
  tasks: Task[]
  all: Task[]
  selId: string | null
  onOpen: (id: string) => void
  dispatch: React.Dispatch<Action>
  run: boolean
  flash: Record<string, number>
  fresh: string | null
  announce: (s: string) => void
  onAdd: (s: Status) => void
  totalPts: number
}) {
  const boardRef = React.useRef<HTMLDivElement>(null)
  const ghostRef = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const [grab, setGrab] = React.useState<{ id: string; snap: Task[]; from: Status } | null>(null)
  const ptr = React.useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const justDragged = React.useRef(false)
  const cleanupRef = React.useRef<(() => void) | null>(null)

  const cols = STATUSES.map((s) => ({ ...s, items: tasks.filter((t) => t.status === s.id) }))
  const byId = (id: string) => all.find((t) => t.id === id)

  React.useEffect(() => () => cleanupRef.current?.(), [])

  /* keep focus on the picked-up card as it moves between columns */
  React.useLayoutEffect(() => {
    if (!grab) return
    const el = boardRef.current?.querySelector<HTMLElement>(`[data-card="${grab.id}"]`)
    if (el && document.activeElement !== el) el.focus({ preventScroll: false })
  })

  /* a click anywhere else while a card is picked up drops it */
  React.useEffect(() => {
    if (!grab) return
    const f = () => setGrab(null)
    document.addEventListener("pointerdown", f)
    return () => document.removeEventListener("pointerdown", f)
  }, [grab])

  React.useLayoutEffect(() => {
    if (drag && ghostRef.current) ghostRef.current.style.transform = `translate(${ptr.current.x - ptr.current.ox}px, ${ptr.current.y - ptr.current.oy}px)`
  }, [drag])

  const moveLog = (from: Status, to: Status): Log => ({
    id: nid("l"),
    d: TODAY,
    t: clock(),
    who: "ada",
    kind: "act",
    text: `moved ${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}`,
  })

  const onPointerDown = (e: React.PointerEvent<HTMLElement>, t: Task) => {
    if (e.button !== 0 || grab) return
    if ((e.target as HTMLElement).closest("button, a, input, textarea")) return
    cleanupRef.current?.()
    const r = e.currentTarget.getBoundingClientRect()
    const s = { id: t.id, from: t.status, sx: e.clientX, sy: e.clientY, started: false, touch: e.pointerType === "touch", timer: 0, auto: 0 }
    ptr.current = { x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top }

    const locate = () => {
      const root = boardRef.current
      if (!root) return null
      const { x, y } = ptr.current
      const col = Array.from(root.querySelectorAll<HTMLElement>("[data-col]")).find((c) => {
        const cr = c.getBoundingClientRect()
        return x >= cr.left && x < cr.right
      })
      if (!col) return null
      const cards = Array.from(col.querySelectorAll<HTMLElement>("[data-card]")).filter((c) => c.dataset.card !== s.id)
      let before: string | null = null
      for (const c of cards) {
        const cr = c.getBoundingClientRect()
        if (y < cr.top + cr.height / 2) {
          before = c.dataset.card ?? null
          break
        }
      }
      return { status: col.dataset.col as Status, before }
    }
    const place = () => {
      if (ghostRef.current) ghostRef.current.style.transform = `translate(${ptr.current.x - ptr.current.ox}px, ${ptr.current.y - ptr.current.oy}px)`
      const tg = locate()
      setDrag((d) => (d && (tg ? d.col !== tg.status || d.before !== tg.before : d.col !== s.from) ? { ...d, col: tg ? tg.status : s.from, before: tg ? tg.before : null } : d))
    }
    const prevent = (ev: TouchEvent) => ev.preventDefault()
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        cleanup()
        announce(`Cancelled. ${s.id} stays in ${STATUS_LABEL[s.from]}.`)
      }
    }
    const begin = () => {
      s.started = true
      window.clearTimeout(s.timer)
      setDrag({ id: s.id, col: s.from, before: null, w: r.width, h: r.height })
      if (s.touch) window.addEventListener("touchmove", prevent, { passive: false })
      window.addEventListener("keydown", onKey)
      s.auto = window.setInterval(() => {
        const root = boardRef.current
        if (!root) return
        const { x, y } = ptr.current
        const br = root.getBoundingClientRect()
        let moved = false
        if (x < br.left + 48 && root.scrollLeft > 0) {
          root.scrollLeft -= 14
          moved = true
        } else if (x > br.right - 48 && root.scrollLeft < root.scrollWidth - root.clientWidth) {
          root.scrollLeft += 14
          moved = true
        }
        const body = Array.from(root.querySelectorAll<HTMLElement>(".itt-col-body")).find((c) => {
          const cr = c.getBoundingClientRect()
          return x >= cr.left && x < cr.right
        })
        if (body) {
          const cr = body.getBoundingClientRect()
          if (y < cr.top + 36 && body.scrollTop > 0) {
            body.scrollTop -= 12
            moved = true
          } else if (y > cr.bottom - 36) {
            body.scrollTop += 12
            moved = true
          }
        }
        if (moved) place()
      }, 16)
    }
    const move = (ev: PointerEvent) => {
      ptr.current.x = ev.clientX
      ptr.current.y = ev.clientY
      if (!s.started) {
        const dist = Math.hypot(ev.clientX - s.sx, ev.clientY - s.sy)
        if (s.touch) {
          if (dist > 8) cleanup()
          return
        }
        if (dist < 4) return
        begin()
      }
      place()
    }
    const up = () => {
      if (s.started) {
        const tg = locate()
        justDragged.current = true
        window.setTimeout(() => (justDragged.current = false), 0)
        if (tg) {
          dispatch({ t: "move", id: s.id, status: tg.status, before: tg.before, entry: tg.status !== s.from ? moveLog(s.from, tg.status) : undefined })
          announce(tg.status !== s.from ? `Moved ${s.id} to ${STATUS_LABEL[tg.status]}.` : `Reordered ${s.id} in ${STATUS_LABEL[s.from]}.`)
        }
      }
      cleanup()
    }
    function cleanup() {
      window.clearTimeout(s.timer)
      window.clearInterval(s.auto)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cleanup)
      window.removeEventListener("touchmove", prevent)
      window.removeEventListener("keydown", onKey)
      cleanupRef.current = null
      setDrag(null)
    }
    cleanupRef.current = cleanup
    if (s.touch) s.timer = window.setTimeout(begin, 260)
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", cleanup)
  }

  const onKeyDown = (e: React.KeyboardEvent, t: Task) => {
    if (e.target !== e.currentTarget) return
    const k = e.key
    if (!grab) {
      if (k === " ") {
        e.preventDefault()
        setGrab({ id: t.id, snap: all, from: t.status })
        announce(`Picked up ${t.id}. Arrow keys move it, Space drops it, Escape cancels.`)
      } else if (k === "Enter") {
        e.preventDefault()
        onOpen(t.id)
      }
      return
    }
    if (grab.id !== t.id) return
    if (k === "ArrowLeft" || k === "ArrowRight") {
      e.preventDefault()
      const ni = STATUSES.findIndex((s) => s.id === t.status) + (k === "ArrowRight" ? 1 : -1)
      if (ni < 0 || ni >= STATUSES.length) return
      const target = STATUSES[ni].id
      const oldList = tasks.filter((x) => x.status === t.status)
      const list = tasks.filter((x) => x.status === target)
      const at = Math.min(oldList.findIndex((x) => x.id === t.id), list.length)
      dispatch({ t: "move", id: t.id, status: target, before: list[at]?.id ?? null })
      announce(`${t.id} in ${STATUS_LABEL[target]}, position ${at + 1} of ${list.length + 1}.`)
    } else if (k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault()
      const list = tasks.filter((x) => x.status === t.status)
      const i = list.findIndex((x) => x.id === t.id)
      let before: string | null | undefined
      if (k === "ArrowUp" && i > 0) before = list[i - 1].id
      else if (k === "ArrowDown" && i < list.length - 1) before = list[i + 2]?.id ?? null
      if (before === undefined) return
      dispatch({ t: "move", id: t.id, status: t.status, before })
      announce(`${t.id} position ${i + (k === "ArrowUp" ? 0 : 2)} of ${list.length}.`)
    } else if (k === " " || k === "Enter") {
      e.preventDefault()
      if (t.status !== grab.from) dispatch({ t: "log", id: t.id, entry: moveLog(grab.from, t.status) })
      announce(`Dropped ${t.id} in ${STATUS_LABEL[t.status]}.`)
      setGrab(null)
    } else if (k === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      dispatch({ t: "restore", tasks: grab.snap })
      announce(`Cancelled. ${t.id} is back in ${STATUS_LABEL[grab.from]}.`)
      setGrab(null)
    }
  }

  const dragTask = drag ? byId(drag.id) : null

  return (
    <div className="itt-board" ref={boardRef}>
      {cols.map((c) => {
        const pts = c.items.reduce((a, t) => a + t.est, 0)
        const isTarget = !!drag && drag.col === c.id
        return (
          <section key={c.id} className={`itt-col${isTarget ? " is-target" : ""}`} data-col={c.id} aria-label={`${c.label}, ${c.items.length} tasks`}>
            <div className="itt-col-head">
              <StatusIcon s={c.id} />
              <span>{c.label}</span>
              <span className="itt-mono">{c.items.length}</span>
              <span className="grow" />
              <Dither value={totalPts ? pts / totalPts : 0} w={20} h={8} />
              <span className="itt-mono" style={{ minWidth: 26, textAlign: "right" }}>{pts}pt</span>
              <button type="button" className="add" aria-label={`Add task to ${c.label}`} onClick={() => onAdd(c.id)}>
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className={`itt-col-body${isTarget && drag && drag.before === null && !(drag.col === byId(drag.id)?.status && c.items[c.items.length - 1]?.id === drag.id) ? " drop-end" : ""}`}>
              {c.items.map((t, i) => {
                const isOrigin = drag?.id === t.id
                const showBefore = isTarget && drag?.before === t.id
                return (
                  <div
                    key={t.id}
                    data-card={t.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t.id} ${t.title}. ${PRI_LABEL[t.pri]} priority. ${t.who ? PEOPLE[t.who].name : "Unassigned"}. Space to pick up, Enter to open.`}
                    aria-pressed={grab?.id === t.id}
                    className={`itt-card${t.id === selId ? " sel" : ""}${c.id === "done" ? " done" : ""}${isOrigin ? " origin" : ""}${showBefore ? " drop-before" : ""}${grab?.id === t.id ? " grabbed" : ""}${fresh === t.id ? " fresh" : ""}`}
                    style={{ "--k": Math.min(i, 8) } as React.CSSProperties}
                    onPointerDown={(e) => onPointerDown(e, t)}
                    onClick={() => {
                      if (!justDragged.current && !grab) onOpen(t.id)
                    }}
                    onKeyDown={(e) => onKeyDown(e, t)}
                  >
                    <CardView t={t} run={run} scanN={flash[t.id]} />
                  </div>
                )
              })}
              {!c.items.length ? <div className="itt-empty itt-mono">{tasks.length === all.length ? "No tasks" : "No matches"}</div> : null}
            </div>
          </section>
        )
      })}
      {drag && dragTask ? (
        <div ref={ghostRef} className="itt-card itt-ghost" style={{ width: drag.w }} aria-hidden="true">
          <CardView t={dragTask} run={false} ghost />
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    List                                    */
/* -------------------------------------------------------------------------- */

function sortTasks(list: Task[], sort: Sort) {
  if (!sort) return list
  const { key, dir } = sort
  const v = (t: Task): string | number => {
    switch (key) {
      case "id":
        return t.n
      case "title":
        return t.title.toLowerCase()
      case "pri":
        return t.pri
      case "who":
        return t.who ? PEOPLE[t.who].name.toLowerCase() : "~"
      case "est":
        return t.est
    }
  }
  return [...list].sort((a, b) => {
    const x = v(a)
    const y = v(b)
    return (x < y ? -1 : x > y ? 1 : 0) * dir
  })
}

function SortHead({ k, sort, onSort, children }: { k: SortKey; sort: Sort; onSort: (k: SortKey) => void; children: string }) {
  const on = sort?.key === k
  return (
    <button type="button" className={on ? "on" : ""} aria-label={`Sort by ${children}`} onClick={() => onSort(k)}>
      {children}
      <span aria-hidden="true" style={{ width: 8 }}>{on ? (sort.dir === 1 ? "↑" : "↓") : ""}</span>
    </button>
  )
}

function ListView({
  tasks,
  selId,
  onOpen,
  dispatch,
  fresh,
  totalPts,
  all,
}: {
  tasks: Task[]
  all: Task[]
  selId: string | null
  onOpen: (id: string) => void
  dispatch: React.Dispatch<Action>
  fresh: string | null
  totalPts: number
}) {
  const [sort, setSort] = React.useState<Sort>(null)
  const [shut, setShut] = React.useState<Status[]>(["done"])
  const cycle = (key: SortKey) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: key === "pri" ? -1 : 1 } : s.dir === (key === "pri" ? -1 : 1) ? { key, dir: (key === "pri" ? 1 : -1) as 1 | -1 } : null))
  const aria = (k: SortKey) => (sort?.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none")
  return (
    <div className="itt-list" role="table" aria-label="Tasks by status">
      <div className="itt-lhead" role="row">
        <span role="columnheader" aria-sort={aria("id")}><SortHead k="id" sort={sort} onSort={cycle}>ID</SortHead></span>
        <span role="columnheader" aria-sort={aria("title")}><SortHead k="title" sort={sort} onSort={cycle}>Task</SortHead></span>
        <span role="columnheader" className="nosort c-st">Status</span>
        <span role="columnheader" className="itt-c-pri" aria-sort={aria("pri")}><SortHead k="pri" sort={sort} onSort={cycle}>Pri</SortHead></span>
        <span role="columnheader" className="c-who" aria-sort={aria("who")}><SortHead k="who" sort={sort} onSort={cycle}>Assignee</SortHead></span>
        <span role="columnheader" className="itt-c-est" aria-sort={aria("est")}><SortHead k="est" sort={sort} onSort={cycle}>Est</SortHead></span>
      </div>
      {STATUSES.map((s) => {
        const items = sortTasks(
          tasks.filter((t) => t.status === s.id),
          sort,
        )
        const open = !shut.includes(s.id)
        const pts = items.reduce((a, t) => a + t.est, 0)
        if (!items.length && tasks.length !== all.length) return null
        return (
          <div className="itt-lgroup" key={s.id} role="rowgroup">
            <button type="button" className="gh" aria-expanded={open} onClick={() => setShut((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))}>
              <ChevronRight size={14} strokeWidth={1.5} className="chev" />
              <StatusIcon s={s.id} />
              <span>{s.label}</span>
              <span className="itt-mono">{items.length}</span>
              <span className="grow" />
              <Dither value={totalPts ? pts / totalPts : 0} w={28} h={8} />
              <span className="itt-mono" style={{ minWidth: 30, textAlign: "right" }}>{pts} pt</span>
            </button>
            {open
              ? items.map((t, i) => (
                  <div
                    key={t.id}
                    role="row"
                    className={`itt-lrow${t.id === selId ? " sel" : ""}${s.id === "done" ? " done" : ""}${fresh === t.id ? " fresh" : ""}`}
                    style={{ "--k": Math.min(i, 10) } as React.CSSProperties}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest("button")) onOpen(t.id)
                    }}
                  >
                    <span role="cell" className="id">{t.id}</span>
                    <span role="cell" className="name">
                      <button type="button" onClick={() => onOpen(t.id)} data-row={t.id}>{t.title}</button>
                      <span className="chips">
                        {t.labels.slice(0, 2).map((l) => (
                          <Chip key={l}>{l}</Chip>
                        ))}
                      </span>
                    </span>
                    <span role="cell">
                      <Pop
                        width={176}
                        trigger={(p) => (
                          <button type="button" className="st" aria-label={`Status: ${STATUS_LABEL[t.status]}. Change status`} {...p}>
                            <StatusIcon s={t.status} />
                            <span>{STATUS_LABEL[t.status]}</span>
                            <ChevronDown size={12} strokeWidth={1.5} className="cv" />
                          </button>
                        )}
                      >
                        {(close) => (
                          <StatusItems
                            value={t.status}
                            close={close}
                            onPick={(st) =>
                              st !== t.status &&
                              dispatch({
                                t: "move",
                                id: t.id,
                                status: st,
                                before: null,
                                entry: { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "act", text: `moved ${STATUS_LABEL[t.status]} → ${STATUS_LABEL[st]}` },
                              })
                            }
                          />
                        )}
                      </Pop>
                    </span>
                    <span role="cell" className="itt-c-pri"><PriBars p={t.pri} /></span>
                    <span role="cell" className="asg">
                      <Av who={t.who} size={20} />
                      <span>{t.who ? PEOPLE[t.who].name : "Unassigned"}</span>
                    </span>
                    <span role="cell" className="est itt-c-est">{t.est} pt</span>
                  </div>
                ))
              : null}
          </div>
        )
      })}
      {!tasks.length ? <EmptyAll /> : null}
    </div>
  )
}

function EmptyAll() {
  return (
    <div className="itt-tl-empty">
      <span className="itt-mono">0 tasks match</span>
      <p style={{ margin: "6px 0 0", color: "var(--itt-t2)" }}>Loosen a filter or clear the search to see the rest of the cycle.</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Timeline                                  */
/* -------------------------------------------------------------------------- */

const T0 = -7
const T_DAYS = 28
const RH = 34

function Timeline({ tasks, selId, onOpen }: { tasks: Task[]; selId: string | null; onOpen: (id: string) => void }) {
  const small = useMatch("(max-width: 767px)")
  const [hot, setHot] = React.useState<string | null>(null)
  const scroller = React.useRef<HTMLDivElement>(null)
  const sw = useWidth(scroller, 1100)
  const lw = small ? 128 : 252
  const dw = small ? 24 : Math.max(30, Math.min(44, Math.floor((sw - lw) / T_DAYS)))
  const rows = React.useMemo(
    () => [...tasks].sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.start - b.start || a.n - b.n),
    [tasks],
  )
  const rowOf = React.useMemo(() => new Map(rows.map((t, i) => [t.id, i])), [rows])
  const X = (d: number) => (d - T0) * dw

  React.useLayoutEffect(() => {
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) el.scrollLeft = Math.max(0, lw + X(TODAY + 0.5) - el.clientWidth * 0.55)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dw])

  const links: { key: string; from: string; to: string; d: string; head: string }[] = []
  rows.forEach((t) => {
    t.deps.forEach((dep) => {
      const p = rows[rowOf.get(dep) ?? -1]
      if (!p) return
      const x1 = X(p.start + p.dur) - 1
      const y1 = rowOf.get(p.id)! * RH + RH / 2
      const x2 = X(t.start) + 1
      const y2 = rowOf.get(t.id)! * RH + RH / 2
      const xm = x1 + Math.max(3, Math.min(9, (x2 - x1) / 2))
      links.push({ key: `${dep}>${t.id}`, from: dep, to: t.id, d: `M${x1} ${y1}H${xm}V${y2}H${x2 - 4}`, head: `M${x2} ${y2}l-4 -3v6z` })
    })
  })

  const cycles = [
    { from: -7, to: -1, label: "CYCLE 11", cur: false },
    { from: 0, to: 13, label: `CYCLE 12 · ${dayLabel(0)} – ${dayLabel(13)}`, cur: true },
    { from: 14, to: 20, label: "CYCLE 13", cur: false },
  ]

  return (
    <div className="itt-tl" ref={scroller} style={{ "--lw": `${lw}px`, "--dw": `${dw}px` } as React.CSSProperties}>
      <div className="itt-tl-in">
        <div className="itt-tl-head">
          <div className="itt-tl-corner">
            <span className="itt-mono">Task</span>
            <span className="itt-mono">{rows.length}</span>
          </div>
          <div className="itt-tl-cal">
            <div className="itt-tl-cyc itt-mono">
              {cycles.map((c) => (
                <span key={c.label} className={c.cur ? "cur" : ""} style={{ width: (c.to - c.from + 1) * dw }}>
                  {c.label}
                </span>
              ))}
            </div>
            <div className="itt-tl-days" aria-hidden="true">
              {Array.from({ length: T_DAYS }, (_, i) => {
                const d = T0 + i
                const dt = dayDate(d)
                return (
                  <span key={d} className={dow(d) > 4 ? "we" : d === TODAY ? "td" : ""}>
                    <em>{dt.getUTCDate() === 1 ? MONTHS[dt.getUTCMonth()] : WD[dow(d)]}</em>
                    {dt.getUTCDate()}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        <div className="itt-tl-body" style={{ height: rows.length * RH }}>
          <div className="itt-tl-bg" aria-hidden="true">
            <div className="cyc" style={{ left: X(0), width: 14 * dw }} />
            {Array.from({ length: T_DAYS }, (_, i) => (dow(T0 + i) > 4 ? <div key={i} className="we" style={{ left: i * dw }} /> : null))}
            <div className="today" style={{ left: X(TODAY + NOW_FRAC) }} />
          </div>
          <svg className="itt-tl-links" width={T_DAYS * dw} height={rows.length * RH} aria-hidden="true">
            {links.map((l, i) => {
              const h = hot === l.from || hot === l.to || selId === l.from || selId === l.to
              return (
                <g key={l.key} style={{ "--k": i } as React.CSSProperties}>
                  <path className={h ? "hot" : ""} pathLength={1} d={l.d} />
                  <path className={`head${h ? " hot" : ""}`} d={l.head} />
                </g>
              )
            })}
          </svg>
          {rows.map((t, i) => {
            const subsDone = t.subs.filter((s) => s.done).length
            const frac = t.status === "done" ? 1 : t.subs.length ? subsDone / t.subs.length : t.status === "review" ? 0.85 : t.status === "progress" ? 0.4 : 0
            const w = t.dur * dw - 2
            return (
              <div
                key={t.id}
                className={`itt-tl-row${t.id === selId ? " sel" : ""}${t.status === "done" ? " done" : ""}`}
                onMouseEnter={() => setHot(t.id)}
                onMouseLeave={() => setHot(null)}
              >
                <button type="button" className="itt-tl-lab" onClick={() => onOpen(t.id)} data-row={t.id} aria-label={`${t.id} ${t.title}, ${STATUS_LABEL[t.status]}, ${dayLabel(t.start)} to ${dayLabel(t.start + t.dur - 1)}`}>
                  <StatusIcon s={t.status} />
                  <span className="id">{t.id}</span>
                  <span className="ttl">{t.title}</span>
                  <Av who={t.who} size={18} />
                </button>
                <div className="itt-tl-track">
                  <div
                    className={`itt-tl-bar ${t.status}`}
                    style={{ left: X(t.start) + 1, width: w, "--k": Math.min(i, 24) } as React.CSSProperties}
                    onClick={() => onOpen(t.id)}
                    title={`${t.id} · ${dayLabel(t.start)} – ${dayLabel(t.start + t.dur - 1)}`}
                    aria-hidden="true"
                  >
                    {t.status !== "done" && t.status !== "backlog" ? (
                      <>
                        <span className="rest" style={{ left: `${frac * 100}%` }} />
                        <span className="fill" style={{ width: `${frac * 100}%` }} />
                      </>
                    ) : null}
                  </div>
                  <span className="itt-tl-tag" style={{ left: X(t.start + t.dur) }}>
                    {t.id}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        {!rows.length ? <EmptyAll /> : null}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Detail                                   */
/* -------------------------------------------------------------------------- */

function TypedText({ text, fresh }: { text: string; fresh?: boolean }) {
  const [n, setN] = React.useState(fresh ? 0 : text.length)
  React.useEffect(() => {
    if (!fresh || n >= text.length) return
    const id = window.setTimeout(() => setN((x) => x + 1), 22)
    return () => window.clearTimeout(id)
  }, [fresh, n, text])
  return (
    <>
      {text.slice(0, n)}
      {fresh && n < text.length ? <i className="itt-caret" /> : null}
    </>
  )
}

function Detail({
  task,
  all,
  dispatch,
  onClose,
  onOpen,
  run,
  onComment,
}: {
  task: Task
  all: Task[]
  dispatch: React.Dispatch<Action>
  onClose: () => void
  onOpen: (id: string) => void
  run: boolean
  onComment: (id: string, text: string) => void
}) {
  const t = task
  const live = agentLines(t)
  const liveText = useTyper(live ?? [""], run)
  const [draft, setDraft] = React.useState("")
  const [subDraft, setSubDraft] = React.useState("")
  const sheet = React.useRef<HTMLDivElement>(null)
  const endRef = React.useRef<HTMLLIElement>(null)
  const seen = React.useRef(t.log.length)
  const blocks = all.filter((x) => x.deps.includes(t.id))
  const subDone = t.subs.filter((s) => s.done).length
  const pat = (patch: Partial<Task>, text: string) =>
    dispatch({ t: "patch", id: t.id, patch, entry: { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "act", text } })

  React.useEffect(() => {
    sheet.current?.focus({ preventScroll: true })
  }, [t.id])

  React.useEffect(() => {
    if (t.log.length > seen.current) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    seen.current = t.log.length
  }, [t.log.length])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    onComment(t.id, text)
    setDraft("")
  }

  return (
    <aside className="itt-dp" aria-label={`Task ${t.id}`}>
      <div className="itt-dp-sheet" ref={sheet} tabIndex={-1} style={{ outline: 0 }}>
        <Crops />
        <header className="itt-dp-head">
          <div className="id itt-mono">
            <StatusIcon s={t.status} />
            <b>{t.id}</b>
            <span>{STATUS_LABEL[t.status]}</span>
          </div>
          <button type="button" className="itt-dp-x" aria-label="Close task" onClick={onClose}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </header>
        <div className="itt-dp-ruler" aria-hidden="true" />
        <div className="itt-dp-scroll">
          <textarea
            className="itt-dp-title"
            aria-label="Task title"
            rows={2}
            value={t.title}
            onChange={(e) => dispatch({ t: "patch", id: t.id, patch: { title: e.target.value.replace(/\n/g, " ") } })}
          />
          {live ? (
            <div className="itt-dp-live" role="status" aria-label={`${PEOPLE[t.who!].name} is working on this task`}>
              <span className="d" aria-hidden="true" />
              <span className="t" aria-hidden="true">{liveText}</span>
              <i className="itt-caret" aria-hidden="true" />
            </div>
          ) : null}
          <p className="itt-dp-desc">{t.desc}</p>

          <section className="itt-dp-sec" aria-label="Properties">
            <div className="hd">
              <span className="itt-mono">Properties</span>
            </div>
            <dl className="itt-props" style={{ margin: 0 }}>
              <div>
                <dt className="itt-mono">Status</dt>
                <dd>
                  <Pop
                    width={176}
                    trigger={(p) => (
                      <button type="button" className="itt-pbtn" {...p}>
                        <StatusIcon s={t.status} />
                        {STATUS_LABEL[t.status]}
                      </button>
                    )}
                  >
                    {(close) => (
                      <StatusItems
                        value={t.status}
                        close={close}
                        onPick={(st) =>
                          st !== t.status &&
                          dispatch({ t: "move", id: t.id, status: st, before: null, entry: { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "act", text: `moved ${STATUS_LABEL[t.status]} → ${STATUS_LABEL[st]}` } })
                        }
                      />
                    )}
                  </Pop>
                </dd>
              </div>
              <div>
                <dt className="itt-mono">Priority</dt>
                <dd>
                  <Pop
                    width={176}
                    trigger={(p) => (
                      <button type="button" className="itt-pbtn" {...p}>
                        <PriBars p={t.pri} />
                        {PRI_LABEL[t.pri]}
                      </button>
                    )}
                  >
                    {(close) => <PriItems value={t.pri} close={close} onPick={(p) => p !== t.pri && pat({ pri: p }, `set priority to ${PRI_LABEL[p]}`)} />}
                  </Pop>
                </dd>
              </div>
              <div>
                <dt className="itt-mono">Assignee</dt>
                <dd>
                  <Pop
                    trigger={(p) => (
                      <button type="button" className="itt-pbtn" {...p}>
                        <Av who={t.who} size={18} />
                        {t.who ? PEOPLE[t.who].name : "Unassigned"}
                      </button>
                    )}
                  >
                    {(close) => <WhoItems value={t.who} close={close} onPick={(w) => w !== t.who && pat({ who: w }, w ? `assigned ${PEOPLE[w].name}` : "removed the assignee")} />}
                  </Pop>
                </dd>
              </div>
              <div>
                <dt className="itt-mono">Estimate</dt>
                <dd>
                  <span className="itt-mono" style={{ color: "var(--itt-t1)", fontSize: 12 }}>{t.est} pt</span>
                </dd>
              </div>
              <div>
                <dt className="itt-mono">Dates</dt>
                <dd>
                  <span className="itt-mono" style={{ color: "var(--itt-t1)" }}>
                    {dayLabel(t.start)} – {dayLabel(t.start + t.dur - 1)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="itt-mono">Cycle</dt>
                <dd>
                  <span className="itt-mono" style={{ color: "var(--itt-t1)" }}>{t.start >= 14 ? "13 · next" : t.start + t.dur <= 0 ? "11 · last" : "12 · now"}</span>
                </dd>
              </div>
              <div className="full">
                <dt className="itt-mono">Labels</dt>
                <dd>
                  {t.labels.map((l) => (
                    <Chip key={l}>{l}</Chip>
                  ))}
                  <Pop
                    width={188}
                    trigger={(p) => (
                      <button type="button" className="itt-chip" aria-label="Edit labels" style={{ cursor: "pointer" }} {...p}>
                        <Plus size={11} strokeWidth={1.5} />
                      </button>
                    )}
                  >
                    {() =>
                      LABELS.map((l) => (
                        <Mi
                          key={l}
                          multi
                          checked={t.labels.includes(l)}
                          onClick={() => pat({ labels: t.labels.includes(l) ? t.labels.filter((x) => x !== l) : [...t.labels, l] }, t.labels.includes(l) ? `removed label ${l}` : `added label ${l}`)}
                        >
                          {l}
                        </Mi>
                      ))
                    }
                  </Pop>
                </dd>
              </div>
              <div className="full">
                <dt className="itt-mono">Blocked by</dt>
                <dd>
                  {t.deps.length ? (
                    t.deps.map((d) => (
                      <button key={d} type="button" className="itt-dep" onClick={() => onOpen(d)} title={all.find((x) => x.id === d)?.title}>
                        {d}
                      </button>
                    ))
                  ) : (
                    <span className="itt-mono">Nothing</span>
                  )}
                </dd>
              </div>
              {blocks.length ? (
                <div className="full">
                  <dt className="itt-mono">Blocks</dt>
                  <dd>
                    {blocks.map((b) => (
                      <button key={b.id} type="button" className="itt-dep" onClick={() => onOpen(b.id)} title={b.title}>
                        {b.id}
                      </button>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="itt-dp-sec" aria-label="Sub-tasks">
            <div className="hd">
              <span className="itt-mono">Sub-tasks</span>
              <span className="itt-mono">
                {subDone}/{t.subs.length}
              </span>
            </div>
            {t.subs.length ? (
              <ul className="itt-subs">
                {t.subs.map((s) => (
                  <li key={s.id} className={s.done ? "done" : ""}>
                    <Check12
                      on={s.done}
                      label={s.t}
                      onClick={() =>
                        dispatch({
                          t: "sub",
                          id: t.id,
                          sid: s.id,
                          entry: { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "act", text: `${s.done ? "reopened" : "checked off"} “${s.t}”` },
                        })
                      }
                    />
                    <span className="t">{s.t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="itt-mono" style={{ margin: "0 0 4px" }}>No sub-tasks yet</p>
            )}
            <form
              className="itt-addsub"
              onSubmit={(e) => {
                e.preventDefault()
                const v = subDraft.trim()
                if (!v) return
                dispatch({ t: "addSub", id: t.id, sub: { id: nid("s"), t: v, done: false } })
                dispatch({ t: "log", id: t.id, entry: { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "act", text: `added sub-task “${v}”` } })
                setSubDraft("")
              }}
            >
              <input value={subDraft} onChange={(e) => setSubDraft(e.target.value)} placeholder="Add a sub-task" aria-label="Add a sub-task" />
              <button type="submit" className="itt-btn sm" disabled={!subDraft.trim()}>
                Add
              </button>
            </form>
          </section>

          <section className="itt-dp-sec" aria-label="Activity">
            <div className="hd">
              <span className="itt-mono">Activity</span>
              <span className="itt-mono">{t.log.length} entries</span>
            </div>
            <ol className="itt-log" aria-live="polite">
              {t.log.map((l) => {
                const agent = l.who !== "sys" && PEOPLE[l.who].agent
                const name = l.who === "sys" ? "System" : PEOPLE[l.who].name.split(" ")[0]
                return (
                  <li key={l.id} className={agent ? "agent" : ""}>
                    <div className="ln">
                      <time>
                        {dayLabel(l.d)} · {l.t}
                      </time>
                      <b>{name}</b>
                      {l.kind === "act" ? <span>{l.text}</span> : null}
                      {l.kind === "note" ? <span>noted</span> : null}
                      {l.kind === "comment" ? <span>commented</span> : null}
                      {l.kind === "reply" ? <span>replied</span> : null}
                    </div>
                    {l.kind === "note" ? <p className="note">{l.text}</p> : null}
                    {l.kind === "comment" ? <p className="cm">{l.text}</p> : null}
                    {l.kind === "reply" ? (
                      <p className="note">
                        <TypedText text={l.text} fresh={l.fresh} />
                      </p>
                    ) : null}
                  </li>
                )
              })}
              <li ref={endRef} className="end" aria-hidden="true" />
            </ol>
          </section>
        </div>
        <form
          className="itt-compose"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Comment. Mention @atlas, @sage or @quill to ask an agent"
            aria-label="Comment"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                send()
              }
            }}
          />
          <div className="row">
            <span className="itt-mono">⌘ Enter to send</span>
            <button type="submit" className="itt-btn ink sm" disabled={!draft.trim()}>
              Comment
            </button>
          </div>
        </form>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Task Tracker                                */
/* -------------------------------------------------------------------------- */

export function TaskTracker({ onNavigate, sideTools, defaultView = "board", defaultOpenId }: TaskTrackerProps) {
  const reduced = useMatch("(prefers-reduced-motion: reduce)")
  const tabVisible = useTabVisible()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const run = tabVisible && inView && !reduced

  const [tasks, dispatch] = React.useReducer(reducer, SEED_TASKS)
  const [view, setView] = React.useState<TaskTrackerView>(defaultView)
  const [f, setF] = React.useState<Filters>(NO_FILTERS)
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId ?? null)
  const [navOpen, setNavOpen] = React.useState(false)
  const [creating, setCreating] = React.useState<Status | null>(null)
  const [fresh, setFresh] = React.useState<string | null>(null)
  const [flash, setFlash] = React.useState<Record<string, number>>({})
  const [say, setSay] = React.useState("")
  const nextN = React.useRef(161)
  const opener = React.useRef<HTMLElement | null>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const timers = React.useRef<Set<number>>(new Set())
  const narrow = useMatch("(max-width: 1023px)")

  const shown = React.useMemo(() => tasks.filter((t) => matches(t, f)), [tasks, f])
  const totalPts = tasks.reduce((a, t) => a + t.est, 0)
  const openTask = openId ? (tasks.find((t) => t.id === openId) ?? null) : null

  React.useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach(clearTimeout)
      set.clear()
    }
  }, [])
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }

  /* an agent works through its sub-tasks every few seconds */
  const tasksRef = React.useRef(tasks)
  React.useEffect(() => {
    tasksRef.current = tasks
  })
  React.useEffect(() => {
    if (!run) return
    let rr = 0
    const id = window.setInterval(() => {
      const cand = tasksRef.current.filter((t) => t.status === "progress" && t.who && PEOPLE[t.who].agent && t.subs.some((s) => !s.done))
      if (!cand.length) return
      const t = cand[rr++ % cand.length]
      const s = t.subs.find((x) => !x.done)!
      dispatch({ t: "sub", id: t.id, sid: s.id, by: t.who!, entry: { id: nid("l"), d: TODAY, t: clock(), who: t.who!, kind: "act", text: `checked off “${s.t}”` } })
      setFlash((p) => ({ ...p, [t.id]: (p[t.id] ?? 0) + 1 }))
    }, 9000)
    return () => window.clearInterval(id)
  }, [run])

  const open = (id: string) => {
    if (id !== openId) opener.current = document.activeElement as HTMLElement | null
    setOpenId(id)
  }
  const close = () => {
    setOpenId(null)
    const el = opener.current
    opener.current = null
    requestAnimationFrame(() => {
      if (el && el.isConnected) el.focus()
    })
  }

  const create = (d: { title: string; status: Status; pri: Pri; who: Who | null }) => {
    const n = nextN.current++
    const id = `RET-${n}`
    const task: Task = {
      id,
      n,
      title: d.title,
      desc: "No description yet. Add context so whoever picks this up knows what done looks like.",
      status: d.status,
      pri: d.pri,
      who: d.who,
      labels: [],
      start: TODAY,
      dur: 3,
      est: 1,
      deps: [],
      subs: [],
      log: [
        { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "act", text: "created this task" },
        ...(d.who ? [{ id: nid("l"), d: TODAY, t: clock(), who: "ada" as const, kind: "act" as const, text: `assigned ${PEOPLE[d.who].name}` }] : []),
      ],
      done: d.status === "done" ? TODAY : undefined,
      by: "ada",
    }
    dispatch({ t: "create", task })
    setCreating(null)
    setFresh(id)
    setSay(`Created ${id} in ${STATUS_LABEL[d.status]}.`)
    later(() => setFresh((x) => (x === id ? null : x)), 1600)
    requestAnimationFrame(() => document.querySelector(`.itt [data-card="${id}"], .itt [data-row="${id}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" }))
  }

  const comment = (id: string, text: string) => {
    dispatch({ t: "log", id, entry: { id: nid("l"), d: TODAY, t: clock(), who: "ada", kind: "comment", text } })
    const m = text.toLowerCase().match(/@(atlas|sage|quill)/)
    const task = tasksRef.current.find((x) => x.id === id)
    const target = (m?.[1] as Who | undefined) ?? undefined
    if (target) {
      later(
        () =>
          dispatch({
            t: "log",
            id,
            entry: { id: nid("l"), d: TODAY, t: clock(), who: target, kind: "reply", text: REPLIES[target], fresh: !reduced },
          }),
        reduced ? 0 : 900,
      )
    } else if (task?.who && PEOPLE[task.who].agent) {
      /* an agent assignee acknowledges plain comments too */
      const a = task.who
      later(() => dispatch({ t: "log", id, entry: { id: nid("l"), d: TODAY, t: clock(), who: a, kind: "reply", text: REPLIES[a], fresh: !reduced } }), reduced ? 0 : 1100)
    }
  }

  /* global shortcuts */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const el = e.target as HTMLElement
    const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable
    if (e.key === "Escape" && !e.defaultPrevented) {
      if (navOpen) setNavOpen(false)
      else if (creating) setCreating(null)
      else if (openId) close()
    } else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === "/") {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === "c") {
        e.preventDefault()
        setCreating("todo")
      }
    }
  }

  const openByAgent = (w: Who) => tasks.filter((t) => t.who === w && t.status !== "done").length
  const hidden = narrow && !navOpen

  return (
    <div ref={rootRef} className={`itt${navOpen ? " is-open" : ""}`} onKeyDown={onKeyDown}>
      <style href="task-tracker" precedence="default">
        {CSS}
      </style>
      <div className="itt-vh" role="status" aria-live="polite">
        {say}
      </div>
      <div className="itt-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
      <aside className="itt-rail" aria-label="Meridian navigation" inert={hidden}>
        <div className="itt-brand">
          <Glyph />
          Meridian
        </div>
        <div className="itt-group" style={{ marginTop: 4 }}>
          <span className="itt-mono">Workspace</span>
          <button type="button" className="itt-ws" aria-label="Switch workspace">
            Harbor &amp; Finch
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="itt-group" aria-label="Console">
          <span className="itt-mono">Console</span>
          <div className="itt-nav">
            {NAV.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="itt-item"
                onClick={() => {
                  setNavOpen(false)
                  onNavigate?.(label)
                }}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="itt-group" aria-label="Operations">
          <span className="itt-mono">Operations</span>
          <div className="itt-nav">
            {OPS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className={`itt-item${label === "Tasks" ? " is-active" : ""}`}
                aria-current={label === "Tasks" ? "page" : undefined}
                onClick={() => {
                  setNavOpen(false)
                  onNavigate?.(label)
                }}
              >
                <Icon size={15} strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="itt-group" aria-label="Agents">
          <span className="itt-mono">Agents</span>
          <div className="itt-nav">
            {AGENT_IDS.map((w) => (
              <button
                key={w}
                type="button"
                className="itt-item"
                onClick={() => {
                  setNavOpen(false)
                  onNavigate?.(PEOPLE[w].name)
                }}
              >
                <span className={`itt-dot ${w === "quill" ? "live" : "ok"}`} aria-hidden="true" />
                {PEOPLE[w].name}
                <span className="itt-mono">{openByAgent(w)} open</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="itt-spacer" />
        {sideTools ? <div className="itt-sidetools">{sideTools}</div> : null}
        <div className="itt-user">
          <span className="av" aria-hidden="true">
            AO
          </span>
          <div>
            <b>Ada Okafor</b>
            <span className="r">Product lead</span>
          </div>
        </div>
      </aside>

      <div className="itt-main">
        <header className="itt-top">
          <button type="button" className="itt-menu" aria-label="Open navigation" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
            <Menu size={16} strokeWidth={1.5} />
          </button>
          <div className="itt-title">
            <span className="itt-mono">Operations / Tasks</span>
            <h1>Task tracker</h1>
          </div>
          <div className="itt-actions">
            <button type="button" className="itt-search" aria-label="Search, command K">
              <Search size={14} strokeWidth={1.5} />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <button type="button" className="itt-btn ink" aria-label="New task" onClick={() => setCreating((c) => (c ? null : "todo"))}>
              <Plus size={14} strokeWidth={1.75} />
              <span className="lbl">New task</span>
            </button>
          </div>
        </header>

        <div className="itt-body">
          <div className="itt-work">
            <ProjectHead tasks={tasks} reduced={reduced} />
            <Toolbar view={view} setView={setView} f={f} setF={setF} tasks={tasks} shown={shown.length} searchRef={searchRef} />
            {creating ? <CreateRow key={creating} initialStatus={creating} onCreate={create} onCancel={() => setCreating(null)} /> : null}
            <div className="itt-view">
              <i className="itt-line" key={`l${view}`} aria-hidden="true" />
              <div className="itt-in" key={view}>
                {view === "board" ? (
                  <Board
                    tasks={shown}
                    all={tasks}
                    selId={openId}
                    onOpen={open}
                    dispatch={dispatch}
                    run={run}
                    flash={flash}
                    fresh={fresh}
                    announce={setSay}
                    onAdd={(s) => setCreating(s)}
                    totalPts={totalPts}
                  />
                ) : null}
                {view === "list" ? <ListView tasks={shown} all={tasks} selId={openId} onOpen={open} dispatch={dispatch} fresh={fresh} totalPts={totalPts} /> : null}
                {view === "timeline" ? <Timeline tasks={shown} selId={openId} onOpen={open} /> : null}
              </div>
            </div>
          </div>
          {openTask ? (
            <>
              <div className="itt-dp-scrim" onClick={close} aria-hidden="true" />
              <Detail task={openTask} all={tasks} dispatch={dispatch} onClose={close} onOpen={open} run={run} onComment={comment} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

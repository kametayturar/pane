"use client"

import * as React from "react"
import { ArrowRight, Bug, CalendarDays, Check, ChevronDown, Diamond, FileText, GitBranch, Hash, Hexagon, ListChecks, MessageSquare, Play, Plus, Sparkles, Square, TriangleAlert } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type RoutineFrequency = "hourly" | "daily" | "weekdays" | "weekly"
/** `time` is "HH:MM" in 24 hour time. For hourly routines only the minutes matter. `day` is 0 (Sunday) to 6, for weekly routines. */
export type RoutineSchedule = { frequency: RoutineFrequency; time: string; day?: number }
/** Neutral stand-ins for connectors: issue tracker, code host, error tracker, calendar and notes. */
export type RoutineSource = "issues" | "code" | "errors" | "calendar" | "notes"
export type RoutineModelId = "nova-large" | "nova-mini" | "atlas-2" | "sage-mini" | "orbit-flash"

export type RoutineRun = {
  id: string
  status: "success" | "failed" | "skipped"
  /** ISO time, or epoch milliseconds. */
  at: string | number
  durationMs: number
  summary: string
}

export type Routine = {
  id: string
  name: string
  instruction: string
  schedule: RoutineSchedule
  sources: RoutineSource[]
  /** "#channel" or "Direct message". */
  destination: string
  model: RoutineModelId
  enabled: boolean
  /** Oldest first; only the last 14 runs show. */
  history: RoutineRun[]
  /** Short plain text: the first line is the title, lines starting with "- " become list items. */
  report?: string
  /** Step labels shown while a run is in progress. */
  steps?: string[]
  /** The series color (1 to 4) of its progress line. */
  accent?: 1 | 2 | 3 | 4
}

export type RoutineRunResult = { run: RoutineRun; report?: string }

export type AgentRoutinesProps = {
  /** The routines. Passing a new array replaces the list; changes made in the card are kept until then. */
  routines?: Routine[]
  /** Called when a run starts (Run now, or when a schedule comes due while the card is open). Return a promise of { run, report? } to drive the row from your backend; a rejection shows its message. Return nothing to keep the built-in simulation. */
  onRun?: (routine: Routine) => Promise<RoutineRunResult> | RoutineRunResult | void
  /** Called when a routine's schedule switch changes. */
  onToggle?: (id: string, enabled: boolean) => void
  /** Called with the full routine when its schedule changes in the open row, and with created: true when New routine adds one. */
  onSave?: (routine: Routine, meta: { created: boolean }) => void
  /** The current time for countdowns. Without it the card uses a demo clock (Tuesday 20 October 2026, 6:45) when no routines are passed, and the real clock otherwise. */
  now?: number | Date
  /** The routine that starts open. Opening another closes it. */
  defaultOpenId?: string | null
  /** The card title, also the list's accessible name. */
  title?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                              Schedule helpers                              */
/* -------------------------------------------------------------------------- */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const FREQS: { id: RoutineFrequency; label: string }[] = [
  { id: "hourly", label: "Hourly" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Weekly" },
]
const MODELS: Record<RoutineModelId, { name: string; family: "nova" | "atlas" | "sage" }> = {
  "nova-large": { name: "Nova Large", family: "nova" },
  "nova-mini": { name: "Nova Mini", family: "nova" },
  "atlas-2": { name: "Atlas 2", family: "atlas" },
  "sage-mini": { name: "Sage Mini", family: "sage" },
  "orbit-flash": { name: "Orbit Flash", family: "atlas" },
}
const SOURCES: Record<RoutineSource, { name: string; hue: number; step: string }> = {
  issues: { name: "Issues", hue: 270, step: "Reading new issues" },
  code: { name: "Code", hue: 255, step: "Reading merged pull requests" },
  errors: { name: "Errors", hue: 20, step: "Matching error reports" },
  calendar: { name: "Calendar", hue: 235, step: "Reading today's calendar" },
  notes: { name: "Notes", hue: 90, step: "Reading linked notes" },
}
const CHANNELS = ["#triage", "#eng", "#incidents", "Direct message"]

const parseTime = (t: string) => {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10))
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 }
}
const pad = (n: number) => String(n).padStart(2, "0")
const clockText = (t: string) => {
  const { h, m } = parseTime(t)
  return `${h}:${pad(m)}`
}

function describe(s: RoutineSchedule) {
  const { m } = parseTime(s.time)
  switch (s.frequency) {
    case "hourly":
      return `Every hour at :${pad(m)}`
    case "daily":
      return `Daily at ${clockText(s.time)}`
    case "weekdays":
      return `Weekdays at ${clockText(s.time)}`
    default:
      return `${DAYS[s.day ?? 1]}s at ${clockText(s.time)}`
  }
}

/** The next time the schedule fires after `from`, in local time. */
function nextRun(s: RoutineSchedule, from: number): number {
  const d = new Date(from)
  const { h, m } = parseTime(s.time)
  if (s.frequency === "hourly") {
    const n = new Date(d)
    n.setMinutes(m, 0, 0)
    if (n.getTime() <= from) n.setHours(n.getHours() + 1)
    return n.getTime()
  }
  for (let i = 0; i < 8; i++) {
    const n = new Date(d)
    n.setDate(d.getDate() + i)
    n.setHours(h, m, 0, 0)
    if (n.getTime() <= from) continue
    const dow = n.getDay()
    if (s.frequency === "weekdays" && (dow === 0 || dow === 6)) continue
    if (s.frequency === "weekly" && dow !== (s.day ?? 1)) continue
    return n.getTime()
  }
  return from + 86_400_000
}

/** The most recent time the schedule fired at or before `from`. */
function prevRun(s: RoutineSchedule, from: number): number {
  const d = new Date(from)
  const { h, m } = parseTime(s.time)
  if (s.frequency === "hourly") {
    const n = new Date(d)
    n.setMinutes(m, 0, 0)
    if (n.getTime() > from) n.setHours(n.getHours() - 1)
    return n.getTime()
  }
  for (let i = 0; i < 9; i++) {
    const n = new Date(d)
    n.setDate(d.getDate() - i)
    n.setHours(h, m, 0, 0)
    if (n.getTime() > from) continue
    const dow = n.getDay()
    if (s.frequency === "weekdays" && (dow === 0 || dow === 6)) continue
    if (s.frequency === "weekly" && dow !== (s.day ?? 1)) continue
    return n.getTime()
  }
  return from - 86_400_000
}

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d) return `${d} d ${h} h`
  if (h) return `${h} h ${m} min`
  if (m) return `${m} min ${s % 60} s`
  return `${s} s`
}

function whenText(at: number, now: number) {
  const d = new Date(at)
  const n = new Date(now)
  const t = `${d.getHours()}:${pad(d.getMinutes())}`
  const dayDiff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000)
  if (dayDiff === 0) return `today ${t}`
  if (dayDiff === 1) return `yesterday ${t}`
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${t}`
}

const atMs = (v: string | number) => (typeof v === "number" ? v : new Date(v).getTime())
const STATUS_WORD = { success: "Succeeded", failed: "Failed", skipped: "Skipped" } as const

function sentence(r: Routine) {
  const list = r.sources.map((s) => SOURCES[s].name)
  const reads = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : (list[0] ?? "nothing yet")
  return `Reads ${reads}, posts to ${r.destination === "Direct message" ? "a direct message" : `Chat ${r.destination}`}, runs on ${MODELS[r.model].name}.`
}

/** A local, simulated pattern match: it reads a sentence into a schedule, sources and a destination. */
function parseSentence(text: string): { schedule?: RoutineSchedule; sources: RoutineSource[]; destination?: string } {
  const t = text.toLowerCase()
  let frequency: RoutineFrequency | undefined
  let day: number | undefined
  if (/\bevery hour\b|\bhourly\b/.test(t)) frequency = "hourly"
  else if (/\bweekdays?\b|\bmon(day)? (to|-|through) fri/.test(t)) frequency = "weekdays"
  else {
    const di = DAYS.findIndex((d) => new RegExp(`\\b${d.toLowerCase()}s?\\b`).test(t))
    if (di >= 0) {
      frequency = "weekly"
      day = di
    } else if (/\bevery (day|morning|evening)\b|\bdaily\b|\beach (morning|day)\b/.test(t)) frequency = "daily"
  }
  let time = frequency === "hourly" ? "00:00" : "09:00"
  const tm = t.match(/(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(\d{1,2}):(\d{2})\s*(am|pm)?/)
  if (tm) {
    let h = parseInt(tm[1] ?? tm[4], 10)
    const m = parseInt(tm[2] ?? tm[5] ?? "0", 10)
    const ap = tm[3] ?? tm[6]
    if (ap === "pm" && h < 12) h += 12
    if (ap === "am" && h === 12) h = 0
    if (h < 24 && m < 60) time = frequency === "hourly" ? `00:${pad(m)}` : `${pad(h)}:${pad(m)}`
  }
  const sources: RoutineSource[] = []
  if (/issue|ticket|backlog|task/.test(t)) sources.push("issues")
  if (/\bpr\b|\bprs\b|pull request|merged|commit|repo|code/.test(t)) sources.push("code")
  if (/error|crash|incident|exception|alert/.test(t)) sources.push("errors")
  if (/calendar|meeting|agenda/.test(t)) sources.push("calendar")
  if (/notes?\b|doc\b|docs\b|wiki/.test(t)) sources.push("notes")
  let destination: string | undefined
  const ch = text.match(/#[\w-]+/)
  if (ch) destination = ch[0]
  else if (/\bdm\b|direct message|message me|to me\b/.test(t)) destination = "Direct message"
  return { schedule: frequency ? { frequency, time, day } : undefined, sources, destination }
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const DEMO_START = new Date(2026, 9, 20, 6, 45, 0).getTime()
const T0 = Date.now()
const clock = () => Date.now()

function seedHistory(s: RoutineSchedule, now: number, statuses: ("success" | "failed" | "skipped")[], summaries: string[]): RoutineRun[] {
  const runs: RoutineRun[] = []
  let at = prevRun(s, now)
  for (let i = statuses.length - 1; i >= 0; i--) {
    runs.unshift({ id: `${s.frequency}-${at}`, status: statuses[i], at, durationMs: 28_000 + ((i * 7919) % 22_000), summary: statuses[i] === "failed" ? "The run timed out while posting" : statuses[i] === "skipped" ? "Nothing new to post" : summaries[i % summaries.length] })
    at = prevRun(s, at - 1)
  }
  return runs
}

function demoRoutines(now: number): Routine[] {
  const ok: ("success" | "failed" | "skipped")[] = Array(14).fill("success")
  const mixed = [...ok]
  mixed[3] = "skipped"
  mixed[8] = "failed"
  mixed[9] = "skipped"
  mixed[5] = "skipped"
  const mk = (r: Omit<Routine, "history">, statuses: ("success" | "failed" | "skipped")[], sums: string[]): Routine => ({ ...r, history: seedHistory(r.schedule, now, statuses, sums) })
  return [
    mk(
      {
        id: "morning-triage",
        name: "Morning triage",
        instruction: "Read every issue opened since the last run and match it to the newest error reports. Rank them by how many customers they touch, mark anything that blocks checkout as urgent, and post a short list with owners.",
        schedule: { frequency: "weekdays", time: "09:00" },
        sources: ["issues", "errors"],
        destination: "#triage",
        model: "atlas-2",
        enabled: true,
        accent: 1,
        steps: ["Reading new issues", "Matching error reports", "Ranking by customer impact", "Posting to #triage"],
        report: "Triage for Monday 19 October\n- ENG-2141 Checkout button stays disabled after a coupon is removed. Urgent, 38 users hit it, assigned to Priya.\n- ENG-2138 Invoice PDF renders blank for EU locales. 12 users, assigned to Tomas.\n- ENG-2135 Search is slow on workspaces with more than 5,000 docs. No errors, moved to the backlog.\n9 issues reviewed, 2 urgent, 4 routed to owners, 3 left for Thursday's review.",
      },
      ok,
      ["Triaged 9 issues, 2 urgent", "Triaged 6 issues, none urgent", "Triaged 11 issues, 1 urgent", "Triaged 7 issues, 1 urgent"],
    ),
    mk(
      {
        id: "merged-pr-digest",
        name: "Merged PR digest",
        instruction: "List the pull requests merged this week, group them by area and write three sentences on what shipped and what needs a follow up. Link each pull request.",
        schedule: { frequency: "weekly", time: "16:00", day: 5 },
        sources: ["code"],
        destination: "#eng",
        model: "sage-mini",
        enabled: true,
        accent: 2,
        steps: ["Reading merged pull requests", "Grouping by area", "Writing the digest", "Posting to #eng"],
        report: "Merged this week\n- #1842 Retry failed invoice emails with backoff\n- #1839 Split the settings page into route chunks\n- #1835 Upgrade date-fns to v4\n14 pull requests merged across 4 areas. Billing and settings shipped the most; the search index change still needs a follow up.",
      },
      ok.slice(0, 8),
      ["14 pull requests across 4 areas", "9 pull requests across 3 areas", "11 pull requests across 4 areas"],
    ),
    mk(
      {
        id: "incident-watch",
        name: "Incident watch",
        instruction: "Check the error reports from the last hour against recent deploys. If a new error appears on more than 20 sessions, post a short alert with the likely deploy.",
        schedule: { frequency: "hourly", time: "00:00" },
        sources: ["errors", "code"],
        destination: "#incidents",
        model: "orbit-flash",
        enabled: true,
        accent: 3,
        steps: ["Reading error reports", "Comparing with recent deploys", "Posting to #incidents"],
        report: "Incident watch 6:00\n- No new errors above the 20 session threshold.\nThe checkout timeout from yesterday stays flat at 4 sessions an hour.",
      },
      mixed,
      ["No new errors above the threshold", "One new error, 6 sessions", "No new errors above the threshold"],
    ),
    mk(
      {
        id: "meeting-prep",
        name: "Meeting prep",
        instruction: "Read today's calendar, pull the open issues and notes linked to each meeting and send me a one line brief for each, ready 30 minutes before the first one.",
        schedule: { frequency: "weekdays", time: "08:30" },
        sources: ["calendar", "issues", "notes"],
        destination: "Direct message",
        model: "nova-large",
        enabled: false,
        accent: 4,
        steps: ["Reading today's calendar", "Finding linked issues", "Reading linked notes", "Sending the brief"],
        report: "Briefs for Thursday 15 October\n- 10:00 Roadmap sync. Two open issues, one note from last week.\n- 14:30 Customer call with Fernwood. Renewal is due in 12 days.\nNo conflicts found.",
      },
      ok.slice(0, 11),
      ["3 meetings briefed", "2 meetings briefed", "4 meetings briefed"],
    ),
  ]
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function SourceMark({ source, size = 14 }: { source: RoutineSource; size?: number }) {
  const meta = SOURCES[source]
  const p = { size: size - 4, strokeWidth: 2, "aria-hidden": true } as const
  const Icon = source === "issues" ? ListChecks : source === "code" ? GitBranch : source === "errors" ? Bug : source === "calendar" ? CalendarDays : FileText
  return (
    <span className="arr-mark" style={{ width: size, height: size, "--hue": meta.hue } as React.CSSProperties} aria-hidden>
      <Icon {...p} />
    </span>
  )
}
function ModelMark({ model, size = 14 }: { model: RoutineModelId; size?: number }) {
  const f = MODELS[model].family
  const p = { size, strokeWidth: 1.7, "aria-hidden": true } as const
  return f === "atlas" ? <Hexagon {...p} /> : f === "sage" ? <Diamond {...p} /> : <Sparkles {...p} />
}
function DestMark({ dest, size = 14 }: { dest: string; size?: number }) {
  const p = { size, strokeWidth: 1.8, "aria-hidden": true } as const
  return dest === "Direct message" ? <MessageSquare {...p} /> : <Hash {...p} />
}
function StatusIcon({ status }: { status: RoutineRun["status"] }) {
  if (status === "success")
    return (
      <svg className="arr-ok" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="1.2" />
        <path d="m4.6 7.2 1.7 1.7 3.1-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (status === "failed") return <TriangleAlert className="arr-bad" size={14} strokeWidth={1.7} aria-hidden />
  return (
    <svg className="arr-mute" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.9 7h4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function Swap({ text, shimmer }: { text: string; shimmer?: boolean }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 220)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="arr-swap">
      {leaving !== null && (
        <span key={`o-${leaving}`} className="arr-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`i-${shown}`} className={"arr-swap-in" + (shimmer ? " arr-shimmer" : "")} data-text={shown} data-fresh={leaving !== null || undefined}>
        {shown}
      </span>
    </span>
  )
}

/** Opens from height 0 and back; the details stay mounted only while open or closing. */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(open)
  const [shown, setShown] = React.useState(open)
  if (open && !mounted) setMounted(true)
  React.useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
      return () => cancelAnimationFrame(id)
    }
    const a = requestAnimationFrame(() => setShown(false))
    const t = window.setTimeout(() => setMounted(false), 460)
    return () => {
      cancelAnimationFrame(a)
      window.clearTimeout(t)
    }
  }, [open])
  if (!mounted) return null
  return (
    <div className="arr-collapse" data-open={shown || undefined}>
      <div className="arr-collapse-clip" inert={!open}>
        <div className="arr-collapse-in">{children}</div>
      </div>
    </div>
  )
}

const TOKEN = /(\b[A-Z]{2,6}-\d+\b|#\d+\b|#[a-z][\w-]*)/g
function Tokens({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((p, i) => (i % 2 ? <span key={i} className="arr-tok">{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>))}
    </>
  )
}

/** The latest report as a title, a short list and paragraphs; a fresh one streams in chunks that only fade in. */
function Report({ text, stream }: { text: string; stream: boolean }) {
  const [count, setCount] = React.useState(stream ? 0 : text.length)
  const [chunks, setChunks] = React.useState<string[]>(stream ? [] : [text])
  const done = count >= text.length
  React.useEffect(() => {
    if (!stream || done) return
    const id = window.setTimeout(() => {
      const n = 15 + Math.floor(((count * 7) % 26))
      setChunks((c) => [...c, text.slice(count, count + n)])
      setCount(count + n)
    }, 32)
    return () => window.clearTimeout(id)
  }, [stream, done, count, text])
  const lines: { key: string; text: string; fresh: boolean }[][] = [[]]
  chunks.forEach((c, ci) =>
    c.split("\n").forEach((part, pi) => {
      if (pi > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ key: `${ci}-${pi}`, text: part, fresh: stream && ci > 0 })
    }),
  )
  const blocks: React.ReactNode[] = []
  let items: React.ReactNode[] = []
  const flush = (k: string) => {
    if (items.length) blocks.push(<ul className="arr-report-list" key={`u${k}`}>{items}</ul>)
    items = []
  }
  lines
    .filter((l) => l.length)
    .forEach((l, li) => {
      const first = l[0].text
      const bullet = first.startsWith("- ")
      const nodes = l.map((c, ci) => (
        <span key={c.key} className={stream ? "arr-chunk" : undefined}>
          <Tokens text={bullet && ci === 0 ? c.text.slice(2) : c.text} />
        </span>
      ))
      if (bullet) items.push(<li key={li}>{nodes}</li>)
      else {
        flush(String(li))
        blocks.push(li === 0 ? <p className="arr-report-title" key={li}>{nodes}</p> : <p key={li}>{nodes}</p>)
      }
    })
  flush("end")
  return <div className="arr-report">{blocks}</div>
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.arr {
  --arr-ink: oklch(.15 0 0);
  --arr-surface: #fff;
  --arr-accent: #0060e2;
  --arr-t1: oklch(.15 0 0);
  --arr-t2: oklch(.46 0 0);
  --arr-t3: oklch(.59 0 0);
  --arr-line: oklch(.935 0 0);
  --arr-fill: oklch(.978 0 0);
  --arr-tint: oklch(.9745 0 0);
  --arr-ok: oklch(.49 .19 150);
  --arr-bad: oklch(.54 .21 25);
  --arr-tick-ok: oklch(.78 .1 150);
  --arr-tick-bad: oklch(.7 .17 25);
  --arr-tick-skip: oklch(.89 0 0);
  --arr-tick-empty: oklch(.955 0 0);
  --arr-track: oklch(.895 0 0);
  --arr-btn: oklch(.33 0 0);
  --arr-btn-fg: #fff;
  --arr-s1: oklch(.58 .15 250);
  --arr-s2: oklch(.5 .19 307);
  --arr-s3: oklch(.72 .18 74);
  --arr-s4: oklch(.58 .17 175);
  --arr-glint: 255 255 255;
  --arr-pop: 0 0 0 1px oklch(0 0 0 / .06), 0 8px 24px -6px oklch(0 0 0 / .18), 0 2px 6px oklch(0 0 0 / .05);
  --arr-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; container-name: arr; width: 100%; max-width: 680px; margin-inline: auto;
  background: var(--arr-surface); border: 1px solid var(--arr-line); border-radius: 34px; color: var(--arr-t1);
  font-family: var(--arr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 19.6px; letter-spacing: -.01em; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .arr {
  --arr-ink: oklch(.96 0 0);
  --arr-surface: oklch(.2 0 0);
  --arr-accent: #4d8dff;
  --arr-t1: oklch(.96 0 0);
  --arr-t2: oklch(.76 0 0);
  --arr-t3: oklch(.62 0 0);
  --arr-line: oklch(1 0 0 / .1);
  --arr-fill: oklch(1 0 0 / .05);
  --arr-tint: oklch(1 0 0 / .04);
  --arr-ok: oklch(.78 .17 150);
  --arr-bad: oklch(.72 .19 25);
  --arr-tick-ok: oklch(.62 .12 150);
  --arr-tick-bad: oklch(.64 .18 25);
  --arr-tick-skip: oklch(1 0 0 / .2);
  --arr-tick-empty: oklch(1 0 0 / .08);
  --arr-track: oklch(1 0 0 / .18);
  --arr-btn: oklch(.95 0 0);
  --arr-btn-fg: oklch(.2 0 0);
  --arr-s1: oklch(.72 .14 250);
  --arr-s2: oklch(.72 .17 307);
  --arr-s3: oklch(.82 .16 80);
  --arr-s4: oklch(.76 .15 175);
  --arr-pop: 0 0 0 1px oklch(1 0 0 / .1), 0 12px 28px -6px oklch(0 0 0 / .6);
}
.arr *, .arr *::before, .arr *::after { box-sizing: border-box }
:where(.arr) :is(p, ol, ul, li, h2, h3, dl, dd, dt, section) { margin: 0; padding: 0 }
:where(.arr) :is(ol, ul) { list-style: none }
:where(.arr) button { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.arr :focus-visible { outline: 2px solid color-mix(in oklab, var(--arr-accent) 60%, transparent); outline-offset: 1px }
.arr button:focus:not(:focus-visible), .arr input:focus { outline: none }
.arr-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.arr-ok { color: var(--arr-ok) } .arr-bad { color: var(--arr-bad) } .arr-mute { color: var(--arr-t3) }

.arr-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 20px 24px 12px }
.arr-title { font-size: 16px; font-weight: 500; line-height: 17.6px; letter-spacing: -.01em }
.arr-subtitle { margin-top: 4px; color: var(--arr-t2); font-variant-numeric: tabular-nums }
.arr-pill { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 12px; border: 1px solid var(--arr-line); border-radius: 18px; background: var(--arr-surface); color: var(--arr-t1); font-weight: 500; white-space: nowrap; transition: background-color .16s var(--arr-ease), transform .16s var(--arr-ease) }
.arr-pill:hover { background: var(--arr-fill) }
.arr-pill:active { transform: scale(.97) }
.arr-pill[data-primary] { background: var(--arr-btn); border-color: var(--arr-btn); color: var(--arr-btn-fg) }
.arr-pill[data-primary]:hover { background: var(--arr-btn); opacity: .92 }
.arr-pill:disabled { opacity: .35; cursor: default }
.arr-pill:disabled:hover { background: var(--arr-surface) } .arr-pill[data-primary]:disabled:hover { background: var(--arr-btn) }
.arr-plus { transition: transform .3s var(--arr-ease) }
.arr-pill[aria-expanded="true"] .arr-plus { transform: rotate(45deg) }

.arr-list { display: grid; padding: 0 8px 8px }
.arr-item { position: relative; border-radius: 26px; transition: background-color .3s var(--arr-ease) }
.arr-item[data-open] { background: var(--arr-tint) }
.arr-item[data-added] { animation: arr-in .4s var(--arr-ease) backwards }
@keyframes arr-in { from { opacity: 0; transform: translateY(-6px) } }
.arr-head { position: relative; display: grid; gap: 2px; padding: 14px 16px; border-radius: 26px; cursor: pointer }
.arr-item:not([data-open]) > .arr-head:hover { background: var(--arr-tint) }
.arr-line { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-width: 0 }
.arr-name-h { display: flex; min-width: 0; font: inherit }
.arr-name { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; font-size: 16px; font-weight: 500; line-height: 22.4px; letter-spacing: -.01em; border-radius: 8px }
.arr-name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.arr-name svg { flex: none; color: var(--arr-t3); transition: transform .34s var(--arr-ease) }
.arr-item[data-open] .arr-name svg { transform: rotate(180deg) }
.arr-name[data-off] .arr-name-text { color: var(--arr-t2) }
.arr-controls { display: flex; align-items: center; gap: 8px; flex: none }
.arr-run-slot { display: flex; width: 99px; justify-content: flex-end }
.arr-run { display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 10px; border-radius: 18px; border: 1px solid transparent; color: var(--arr-t2); font-weight: 500; opacity: 0; transition: opacity .2s var(--arr-ease), background-color .16s var(--arr-ease), color .16s var(--arr-ease) }
.arr-head:hover .arr-run, .arr-run:focus-visible, .arr-run[data-active], .arr-item[data-open] .arr-run { opacity: 1 }
@media (hover: none) { .arr-run { opacity: 1 } }
.arr-run:hover { background: color-mix(in oklab, var(--arr-ink) 6%, transparent); color: var(--arr-t1) }
.arr-run-stack { display: grid }
.arr-run-layer { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: opacity .16s var(--arr-ease), transform .16s var(--arr-ease) }
.arr-run-layer[data-off] { opacity: 0; transform: translateY(2px); pointer-events: none }
.arr-switch { display: inline-flex; width: 42px; height: 24px; flex: none; border-radius: 9999px }
.arr-switch-track { display: flex; width: 100%; height: 100%; padding: 3px; border-radius: 9999px; background: var(--arr-track); transition: background-color .25s var(--arr-ease) }
.arr-switch[aria-checked="true"] .arr-switch-track { background: var(--arr-btn) }
.arr-switch-thumb { width: 18px; height: 18px; border-radius: 9999px; background: #fff; box-shadow: 0 0 0 .5px oklch(0 0 0 / .07), 0 1px 2px oklch(0 0 0 / .14), 0 2px 6px oklch(0 0 0 / .06); transition: transform .3s var(--arr-ease) }
.arr-switch[aria-checked="true"] .arr-switch-thumb { transform: translateX(18px) }
:is(.dark, [data-theme="dark"]) .arr-switch[aria-checked="true"] .arr-switch-thumb { background: oklch(.2 0 0) }

.arr-when { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-width: 0 }
.arr-when-l { display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; min-width: 0; color: var(--arr-t2) }
.arr-when-l > span { white-space: nowrap }
.arr-sched { display: inline-flex }
.arr-dot { color: var(--arr-t3) }
.arr-status { display: inline-flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden }
.arr-count { display: inline-block; min-width: 9.2ch; font-variant-numeric: tabular-nums; white-space: nowrap }
.arr-last { display: flex; align-items: center; gap: 6px; flex: none; font-size: 12px; line-height: 16.8px; color: var(--arr-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.arr-last svg { flex: none }
.arr-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 20px; min-width: 0 }
.arr-meta-l { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--arr-t2) }
.arr-marks { display: inline-flex; align-items: center; gap: 6px; flex: none; min-width: 34px }
.arr-mark { display: inline-grid; place-items: center; flex: none; border-radius: 4px; color: oklch(.5 .17 var(--hue)); background: oklch(.95 .035 var(--hue)) }
:is(.dark, [data-theme="dark"]) .arr-mark { color: oklch(.82 .12 var(--hue)); background: oklch(.34 .06 var(--hue)) }
.arr-more { font-size: 11px; line-height: 14px; color: var(--arr-t3) }
.arr-arrow { flex: none; color: var(--arr-t3) }
.arr-dest { display: inline-flex; align-items: center; gap: 4px; min-width: 0; font-size: 12px; line-height: 16.8px }
.arr-dest svg { flex: none }
.arr-dest-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.arr-divider { flex: none; width: 1px; height: 12px; background: var(--arr-line) }
.arr-model { flex: none; display: inline-flex; color: var(--arr-t2) }
.arr-ticks { position: relative; flex: none }
.arr-ticks-row { display: flex; gap: 3px; height: 14px }
.arr-tick-slot { position: relative; display: block; width: 4px; height: 14px; border-radius: 2px; margin: 0 -1.5px; padding: 0 1.5px; box-sizing: content-box }
.arr-tick-slot::after { content: ""; position: absolute; inset: -4px -1.5px; pointer-events: none }
.arr-tick { display: block; width: 4px; height: 14px; border-radius: 2px; background: var(--arr-tick-ok); transition: transform .24s var(--arr-ease), opacity .2s var(--arr-ease); animation: arr-tick-in .24s ease-out backwards }
.arr-tick[data-status="failed"] { background: var(--arr-tick-bad) }
.arr-tick[data-status="skipped"] { background: var(--arr-tick-skip) }
.arr-tick:hover, .arr-tick:focus-visible { transform: scaleY(1.18) }
.arr-tick-empty { display: block; width: 4px; height: 14px; border-radius: 2px; background: var(--arr-tick-empty) }
@keyframes arr-tick-in { from { opacity: 0; transform: translateX(7px) } }
.arr-tip { position: absolute; right: -8px; bottom: calc(100% + 10px); z-index: 20; width: max-content; max-width: 250px; padding: 8px 10px; border-radius: 12px; background: var(--arr-surface); box-shadow: var(--arr-pop); font-size: 12px; line-height: 17px; color: var(--arr-t2); pointer-events: none; animation: arr-pop .14s var(--arr-ease) backwards; white-space: normal }
.arr-tip b { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; color: var(--arr-t1) }
.arr-tip span { display: block }
@keyframes arr-pop { from { opacity: 0; transform: translateY(3px) } }
.arr-progress { position: absolute; left: 16px; right: 16px; bottom: 0; height: 2px; border-radius: 2px; overflow: hidden; pointer-events: none; opacity: 0; transition: opacity .4s var(--arr-ease) }
.arr-progress[data-on] { opacity: 1 }
.arr-progress i { display: block; height: 100%; width: 0; border-radius: inherit; background: var(--lane); transition: width 1.1s linear }

.arr-collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .34s cubic-bezier(.3, 1, .4, 1) }
.arr-collapse[data-open] { grid-template-rows: 1fr }
.arr-collapse-clip { min-height: 0; overflow: hidden }
.arr-collapse-in { padding: 4px 16px 18px; opacity: 0; transform: translateY(6px); transition: opacity .16s var(--arr-ease), transform .34s var(--arr-ease) }
.arr-collapse[data-open] .arr-collapse-in { opacity: 1; transform: none; transition-delay: .06s, 0s }
.arr-sec { display: grid; gap: 8px; margin-top: 14px }
.arr-sec:first-child { margin-top: 0 }
.arr-sec-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; line-height: 20px }
.arr-sec-title { font-weight: 500; color: var(--arr-t1); white-space: nowrap }
.arr-sec-meta { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 2px 8px; font-size: 12px; line-height: 18px; color: var(--arr-t2); font-variant-numeric: tabular-nums }
.arr-sec-meta > span { display: inline-flex; align-items: center; gap: 5px }
.arr-report { display: grid; gap: 6px; color: var(--arr-t1); text-wrap: pretty }
.arr-report-title { font-weight: 500 }
.arr-report-list { display: grid; gap: 4px; padding-left: 18px; list-style: disc }
.arr-report-list li::marker { color: var(--arr-t3) }
.arr-tok { font-weight: 500; font-variant-numeric: tabular-nums }
.arr-chunk { animation: arr-chunk .16s var(--arr-ease) backwards }
@keyframes arr-chunk { from { opacity: 0 } }
.arr-posted { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; line-height: 18px; color: var(--arr-t2) }
.arr-instr { color: var(--arr-t2); text-wrap: pretty }
.arr-steps { display: grid; gap: 2px }
.arr-step { display: flex; align-items: center; gap: 8px; color: var(--arr-t3); font-size: 13px; line-height: 20px }
.arr-step[data-done] { color: var(--arr-t2) }
.arr-step[aria-current="step"] { color: var(--arr-t1) }
.arr-step svg { flex: none }
.arr-error { padding: 8px 12px; border-radius: 12px; background: color-mix(in oklab, var(--arr-bad) 9%, transparent); color: var(--arr-bad); font-size: 13px; line-height: 18px }

.arr-editor { display: flex; flex-wrap: wrap; align-items: center; gap: 8px }
.arr-seg { display: inline-flex; border: 1px solid var(--arr-line); border-radius: 18px; background: var(--arr-fill) }
.arr-seg-track { position: relative; display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 2px; padding: 3px }
.arr-seg-thumb { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 6px - (var(--n) - 1) * 2px) / var(--n)); border-radius: 14px; background: var(--arr-surface); border: 1px solid var(--arr-line); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .035); transform: translateX(calc(var(--i) * (100% + 2px))); transition: transform .34s var(--arr-ease) }
.arr-seg button { position: relative; min-width: 58px; height: 32px; padding: 0 12px; border-radius: 14px; font-weight: 500; text-align: center; color: var(--arr-t3); transition: color .16s var(--arr-ease) }
.arr-seg button[aria-checked="true"] { color: var(--arr-t1) }
.arr-seg button:focus-visible { outline-offset: -2px }
.arr-field { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border: 1px solid var(--arr-line); border-radius: 18px; background: var(--arr-surface); color: var(--arr-t1); font: inherit; font-weight: 500; font-variant-numeric: tabular-nums }
.arr-field:focus-within { border-color: color-mix(in oklab, var(--arr-accent) 40%, var(--arr-line)); box-shadow: 0 0 0 3px color-mix(in oklab, var(--arr-accent) 11%, transparent) }
.arr-field input, .arr-field select { border: 0; background: transparent; color: inherit; font: inherit; outline: none; padding: 0; min-width: 0; color-scheme: light dark }
.arr-field select { appearance: none; padding-right: 2px; cursor: pointer }
.arr-field input[type="time"]::-webkit-calendar-picker-indicator { opacity: .5; cursor: pointer }

.arr-new { margin: 0 8px 4px; padding: 16px; border-radius: 26px; background: var(--arr-tint); display: grid; gap: 14px; animation: arr-in .4s var(--arr-ease) backwards }
.arr-new-label { font-weight: 500 }
.arr-input { width: 100%; height: 44px; padding: 0 16px; border: 1px solid var(--arr-line); border-radius: 18px; background: var(--arr-surface); color: var(--arr-t1); font: inherit; letter-spacing: -.01em }
.arr-input::placeholder { color: var(--arr-t3) }
.arr-input:focus { outline: none; border-color: color-mix(in oklab, var(--arr-accent) 40%, var(--arr-line)); box-shadow: 0 0 0 3px color-mix(in oklab, var(--arr-accent) 11%, transparent) }
.arr-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 6px; color: var(--arr-t3) }
.arr-chipwrap { position: relative }
.arr-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border: 1px solid var(--arr-line); border-radius: 10px; background: var(--arr-surface); color: var(--arr-t1); font-weight: 500; transition: background-color .16s var(--arr-ease), border-color .16s var(--arr-ease) }
.arr-chip[data-empty] { color: var(--arr-t2); font-weight: 400; border-style: dashed }
.arr-chip:hover, .arr-chip[aria-expanded="true"] { background: var(--arr-fill) }
.arr-chip svg { flex: none; color: var(--arr-t3) }
.arr-chip-pop { position: absolute; z-index: 30; top: calc(100% + 6px); left: 0; min-width: 210px; padding: 6px; border-radius: 14px; background: var(--arr-surface); box-shadow: var(--arr-pop); display: grid; gap: 2px; animation: arr-pop .16s var(--arr-ease) backwards }
.arr-chip-opt { display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 0 10px; border-radius: 10px; color: var(--arr-t1) }
.arr-chip-opt:hover { background: var(--arr-fill) }
.arr-chip-opt[aria-pressed="true"] { font-weight: 500 }
.arr-chip-opt .arr-check { margin-left: auto; color: var(--arr-t2) }
.arr-new-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px }
.arr-hint { flex: 1 1 200px; min-width: 0; font-size: 12px; line-height: 18px; color: var(--arr-t3) }
.arr-hint button { font-weight: 500; color: var(--arr-t1); border-radius: 4px; padding: 0 2px }
.arr-new-actions { display: inline-flex; gap: 6px; margin-left: auto }
.arr-ghost { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 18px; font-weight: 500; color: var(--arr-t2); transition: background-color .16s var(--arr-ease), color .16s var(--arr-ease) }
.arr-ghost:hover { background: color-mix(in oklab, var(--arr-ink) 6%, transparent); color: var(--arr-t1) }
.arr-empty { padding: 28px 16px 32px; text-align: center; color: var(--arr-t3) }

/* in place text swaps and shimmer */
.arr-swap { display: inline-grid; min-width: 0; max-width: 100% }
.arr-swap > * { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.arr-swap-out { animation: arr-out .1s var(--arr-ease) forwards; pointer-events: none }
.arr-swap-in[data-fresh] { animation: arr-fadein .16s var(--arr-ease) backwards }
@keyframes arr-out { to { opacity: 0 } }
@keyframes arr-fadein { from { opacity: 0; transform: translateY(2px) } }
.arr-shimmer { position: relative }
.arr-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; overflow: hidden; text-overflow: ellipsis; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, rgb(var(--arr-glint) / .82) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: arr-sweep 1.6s linear infinite;
}
@keyframes arr-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }

@container arr (max-width: 539px) {
  .arr-last { display: none }
  .arr-header { padding-inline: 18px }
  .arr-head { padding-inline: 12px }
  .arr-collapse-in { padding-inline: 12px }
  .arr-progress { left: 12px; right: 12px }
}
@container arr (max-width: 419px) {
  .arr-run-slot { width: 30px }
  .arr-run { width: 30px; padding: 0 }
  .arr-run-text { display: none }
  .arr-name { font-size: 15px }
  .arr-editor .arr-field[data-time] { flex-basis: 100% }
  .arr-seg { max-width: 100% }
  .arr-seg button { min-width: 0; padding: 0 7px; font-size: 13px }
}

@media (prefers-reduced-motion: reduce) {
  .arr *, .arr *::before, .arr *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

type RunState = { step: number; labels: string[]; error?: string }

function FreqControl({ value, onChange, label }: { value: RoutineFrequency; onChange: (f: RoutineFrequency) => void; label: string }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const idx = FREQS.findIndex((f) => f.id === value)
  const move = (i: number) => {
    const n = (i + FREQS.length) % FREQS.length
    onChange(FREQS[n].id)
    refs.current[n]?.focus()
  }
  return (
    <div className="arr-seg" role="radiogroup" aria-label={label}>
      <div className="arr-seg-track" style={{ "--n": FREQS.length, "--i": idx } as React.CSSProperties}>
        <span className="arr-seg-thumb" aria-hidden />
        {FREQS.map((f, i) => (
          <button
            key={f.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={f.id === value}
            tabIndex={f.id === value ? 0 : -1}
            onClick={() => onChange(f.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(i + 1) }
              else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(i - 1) }
              else if (e.key === "Home") { e.preventDefault(); move(0) }
              else if (e.key === "End") { e.preventDefault(); move(FREQS.length - 1) }
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ScheduleEditor({ schedule, onChange }: { schedule: RoutineSchedule; onChange: (s: RoutineSchedule) => void }) {
  const { h, m } = parseTime(schedule.time)
  return (
    <div className="arr-editor">
      <FreqControl value={schedule.frequency} label="Frequency" onChange={(f) => onChange({ ...schedule, frequency: f, day: f === "weekly" ? (schedule.day ?? 1) : schedule.day })} />
      {schedule.frequency === "weekly" && (
        <label className="arr-field">
          <span className="arr-sr">Day of the week</span>
          <select value={schedule.day ?? 1} onChange={(e) => onChange({ ...schedule, day: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <option key={d} value={d}>
                {DAYS[d]}
              </option>
            ))}
          </select>
          <ChevronDown size={13} strokeWidth={1.8} aria-hidden />
        </label>
      )}
      {schedule.frequency === "hourly" ? (
        <label className="arr-field" data-time>
          <span>At minute</span>
          <select aria-label="Minute past the hour" value={m} onChange={(e) => onChange({ ...schedule, time: `00:${pad(Number(e.target.value))}` })}>
            {[0, 15, 30, 45].map((x) => (
              <option key={x} value={x}>{`:${pad(x)}`}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="arr-field" data-time>
          <span className="arr-sr">Time</span>
          <input type="time" value={`${pad(h)}:${pad(m)}`} onChange={(e) => e.target.value && onChange({ ...schedule, time: e.target.value })} />
        </label>
      )}
    </div>
  )
}

function Ticks({ routine, now, tipId }: { routine: Routine; now: number; tipId: string }) {
  const runs = routine.history.slice(-14)
  const [cur, setCur] = React.useState(runs.length - 1)
  const [tip, setTip] = React.useState<number | null>(null)
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const idx = Math.min(Math.max(0, cur), Math.max(0, runs.length - 1))
  const counts = { success: 0, failed: 0, skipped: 0 }
  runs.forEach((r) => counts[r.status]++)
  const label = runs.length ? `${counts.success} succeeded, ${counts.failed} failed, ${counts.skipped} skipped` : "No runs yet"
  const text = (r: RoutineRun) => `${STATUS_WORD[r.status]}, ${whenText(atMs(r.at), now)}, ${Math.round(r.durationMs / 1000)} seconds. ${r.summary}`
  const focusTo = (i: number) => {
    const n = Math.min(Math.max(0, i), runs.length - 1)
    setCur(n)
    refs.current[n]?.focus()
  }
  const empty = 14 - runs.length
  return (
    <div className="arr-ticks" role="group" aria-label={label} onClick={(e) => e.stopPropagation()}>
      <div className="arr-ticks-row">
        {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
          <span className="arr-tick-slot" key={`e${i}`}>
            <span className="arr-tick-empty" />
          </span>
        ))}
        {runs.map((r, i) => (
          <span className="arr-tick-slot" key={r.id} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip((t) => (t === i ? null : t))}>
            <button
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              className="arr-tick"
              data-status={r.status}
              tabIndex={i === idx ? 0 : -1}
              aria-label={`Run ${i + 1} of ${runs.length}: ${text(r)}`}
              aria-describedby={tip === i ? tipId : undefined}
              onFocus={() => {
                setTip(i)
                setCur(i)
              }}
              onBlur={() => setTip((t) => (t === i ? null : t))}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") { e.preventDefault(); focusTo(i - 1) }
                else if (e.key === "ArrowRight") { e.preventDefault(); focusTo(i + 1) }
                else if (e.key === "Home") { e.preventDefault(); focusTo(0) }
                else if (e.key === "End") { e.preventDefault(); focusTo(runs.length - 1) }
                else if (e.key === "Escape") setTip(null)
              }}
            />
          </span>
        ))}
      </div>
      {tip !== null && runs[tip] && (
        <div className="arr-tip" role="tooltip" id={tipId}>
          <b>
            <StatusIcon status={runs[tip].status} />
            {STATUS_WORD[runs[tip].status]}
          </b>
          <span>{`${whenText(atMs(runs[tip].at), now)} · ${Math.round(runs[tip].durationMs / 1000)} s`}</span>
          <span>{runs[tip].summary}</span>
        </div>
      )}
    </div>
  )
}

function ChipPop({ label, summary, empty, children, onClose }: { label: string; summary: string; empty: boolean; children: React.ReactNode; onClose?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const wrap = React.useRef<HTMLDivElement>(null)
  const trig = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false)
        onClose?.()
      }
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [open, onClose])
  return (
    <div className="arr-chipwrap" ref={wrap}>
      <button ref={trig} type="button" className="arr-chip" data-empty={empty || undefined} aria-expanded={open} aria-haspopup="dialog" aria-label={`${label}: ${summary}`} onClick={() => setOpen((o) => !o)}>
        <span>{summary}</span>
        <ChevronDown size={13} strokeWidth={1.8} aria-hidden />
      </button>
      {open && (
        <div
          className="arr-chip-pop"
          role="dialog"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              e.stopPropagation()
              setOpen(false)
              trig.current?.focus()
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function NewRoutine({ onAdd, onCancel }: { onAdd: (r: { name: string; instruction: string; schedule: RoutineSchedule; sources: RoutineSource[]; destination: string }) => void; onCancel: () => void }) {
  const [text, setText] = React.useState("")
  const [sched, setSched] = React.useState<RoutineSchedule | null>(null)
  const [sources, setSources] = React.useState<RoutineSource[] | null>(null)
  const [dest, setDest] = React.useState<string | null>(null)
  const input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    input.current?.focus()
  }, [])
  const parsed = React.useMemo(() => parseSentence(text), [text])
  const schedule = sched ?? parsed.schedule ?? null
  const srcs = sources ?? parsed.sources
  const destination = dest ?? parsed.destination ?? null
  const ready = !!schedule && srcs.length > 0 && !!destination
  const status = !text.trim() ? "Say when it runs, what it reads and where it posts." : ready ? "Read your sentence. Check the chips, then add it." : `Still missing ${[!schedule && "a schedule", !srcs.length && "sources", !destination && "a destination"].filter(Boolean).join(", ")}.`
  const add = () => {
    if (!ready || !schedule || !destination) return
    const name = text.trim().replace(/^every\s+\S+( at [^,]+)?,?\s*/i, "").replace(/^[a-z]/, (c) => c.toUpperCase()).slice(0, 34) || "New routine"
    onAdd({ name, instruction: text.trim(), schedule, sources: srcs, destination })
  }
  const sc: RoutineSchedule = schedule ?? { frequency: "weekdays", time: "09:00" }
  return (
    <section className="arr-new" aria-label="New routine">
      <div style={{ display: "grid", gap: 8 }}>
        <label className="arr-new-label" htmlFor="arr-sentence">
          Describe the routine in a sentence
        </label>
        <input
          id="arr-sentence"
          ref={input}
          className="arr-input"
          value={text}
          placeholder="Every Friday at 16:00, summarize merged PRs to #eng"
          autoComplete="off"
          onChange={(e) => {
            setText(e.target.value)
            setSched(null)
            setSources(null)
            setDest(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            } else if (e.key === "Escape") {
              e.preventDefault()
              onCancel()
            }
          }}
        />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <span className="arr-new-label">New routine</span>
        <div className="arr-chips">
          <span>Runs</span>
          <ChipPop label="Schedule" summary={schedule ? describe(schedule) : "When"} empty={!schedule}>
            <div style={{ display: "grid", gap: 10, padding: 6 }}>
              <ScheduleEditor schedule={sc} onChange={setSched} />
            </div>
          </ChipPop>
          <span>reads</span>
          <ChipPop label="Sources" summary={srcs.length ? srcs.map((s) => SOURCES[s].name).join(", ") : "Choose sources"} empty={!srcs.length}>
            {(Object.keys(SOURCES) as RoutineSource[]).map((s) => (
              <button key={s} type="button" className="arr-chip-opt" aria-pressed={srcs.includes(s)} onClick={() => setSources(srcs.includes(s) ? srcs.filter((x) => x !== s) : [...srcs, s])}>
                <SourceMark source={s} />
                {SOURCES[s].name}
                {srcs.includes(s) && <Check className="arr-check" size={14} strokeWidth={2} aria-hidden />}
              </button>
            ))}
          </ChipPop>
          <span>posts to</span>
          <ChipPop label="Destination" summary={destination ?? "Choose where"} empty={!destination}>
            {CHANNELS.map((c) => (
              <button key={c} type="button" className="arr-chip-opt" aria-pressed={destination === c} onClick={() => setDest(c)}>
                <DestMark dest={c} />
                {c}
                {destination === c && <Check className="arr-check" size={14} strokeWidth={2} aria-hidden />}
              </button>
            ))}
          </ChipPop>
        </div>
      </div>
      <div className="arr-new-foot">
        <p className="arr-hint" role="status" aria-live="polite">
          {status} This preview reads the sentence locally.{" "}
          {!text.trim() && (
            <button type="button" onClick={() => setText("Every Friday at 16:00, summarize merged PRs to #eng")}>
              Use the example
            </button>
          )}
        </p>
        <span className="arr-new-actions">
          <button type="button" className="arr-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="arr-pill" data-primary disabled={!ready} onClick={add}>
            Add routine
          </button>
        </span>
      </div>
    </section>
  )
}

/**
 * Scheduled agents in one card: each routine reads as a sentence with its schedule, next run countdown, connectors and
 * destination, and opens smoothly to edit or run it now. With no props it shows sample routines with live countdowns.
 */
export function AgentRoutines({ routines: routinesProp, onRun, onToggle, onSave, now: nowProp, defaultOpenId = null, title = "Routines", className }: AgentRoutinesProps) {
  const demoClock = routinesProp === undefined && nowProp === undefined
  const nowProvided = nowProp !== undefined
  const [tick, setTick] = React.useState(() => (demoClock ? DEMO_START : T0))
  const nowMs = nowProvided ? (nowProp instanceof Date ? nowProp.getTime() : nowProp) : tick
  const [store, setStore] = React.useState<{ source: Routine[] | undefined; list: Routine[] }>(() => ({ source: routinesProp, list: routinesProp ?? demoRoutines(DEMO_START) }))
  if (store.source !== routinesProp) setStore({ source: routinesProp, list: routinesProp ?? demoRoutines(DEMO_START) })
  const list = store.list
  const setList = (fn: (l: Routine[]) => Routine[]) => setStore((s) => ({ ...s, list: fn(s.list) }))

  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId)
  const [running, setRunning] = React.useState<Record<string, RunState>>({})
  const [fresh, setFresh] = React.useState<Record<string, string>>({})
  const [adding, setAdding] = React.useState(false)
  const [addedId, setAddedId] = React.useState<string | null>(null)
  const [note, setNote] = React.useState("")
  const seq = React.useRef(0)
  const ctls = React.useRef(new Map<string, AbortController>())
  const timers = React.useRef(new Map<string, number>())
  const nameRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const newBtn = React.useRef<HTMLButtonElement>(null)
  const prevNow = React.useRef(nowMs)
  const latest = React.useRef({ list, onRun, running })
  React.useEffect(() => {
    latest.current = { list, onRun, running }
  })

  const real = routinesProp !== undefined || nowProvided
  /* One shared one second clock drives every countdown */
  React.useEffect(() => {
    if (nowProvided) return
    const id = window.setInterval(() => setTick((t) => (demoClock ? t + 1000 : clock())), 1000)
    return () => window.clearInterval(id)
  }, [nowProvided, demoClock])

  React.useEffect(() => {
    const t = timers.current
    const c = ctls.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      t.clear()
      c.forEach((x) => x.abort())
      c.clear()
    }
  }, [])

  const finish = (r: Routine, result: RoutineRunResult) => {
    ctls.current.delete(r.id)
    timers.current.delete(r.id)
    setList((l) => l.map((x) => (x.id === r.id ? { ...x, history: [...x.history, result.run].slice(-14), report: result.report ?? x.report } : x)))
    setFresh((f) => ({ ...f, [r.id]: result.run.id }))
    setRunning((s) => {
      const n = { ...s }
      delete n[r.id]
      return n
    })
    setNote(`${r.name} ${result.run.status === "success" ? "succeeded" : result.run.status === "failed" ? "failed" : "was skipped"}: ${result.run.summary}.`)
  }
  const fail = (r: Routine, message: string) => {
    ctls.current.delete(r.id)
    const t = timers.current.get(r.id)
    if (t) window.clearTimeout(t)
    timers.current.delete(r.id)
    setRunning((s) => ({ ...s, [r.id]: { ...(s[r.id] ?? { step: 0, labels: [] }), error: message } }))
    setNote(`${r.name} failed: ${message}`)
    setOpenId(r.id)
  }

  const startRun = (r: Routine, startedAt: number) => {
    if (latest.current.running[r.id] && !latest.current.running[r.id].error) return
    const labels = r.steps?.length ? r.steps : [...r.sources.map((s) => SOURCES[s].step), "Writing the summary", `Posting to ${r.destination}`]
    const ctl = new AbortController()
    ctls.current.set(r.id, ctl)
    setRunning((s) => ({ ...s, [r.id]: { step: 0, labels } }))
    setNote(`${r.name} started.${latest.current.onRun ? "" : " This preview only simulates runs and posts."}`)
    const hook = latest.current.onRun?.(r)
    const isPromise = !!hook && typeof (hook as Promise<RoutineRunResult>).then === "function"
    const result: RoutineRunResult | null = hook && !isPromise ? (hook as RoutineRunResult) : null
    let finished = false
    const advance = (step: number) => {
      if (ctl.signal.aborted || finished) return
      const last = labels.length - 1
      if (step > last) {
        if (!hook) {
          finished = true
          const ok = nowMs
          finish(r, { run: { id: `sim-${++seq.current}-${ok}`, status: "success", at: startedAt, durationMs: 24_000 + labels.length * 4_000, summary: `${r.name} finished` } })
        }
        return
      }
      setRunning((s) => (s[r.id] ? { ...s, [r.id]: { ...s[r.id], step } } : s))
      timers.current.set(r.id, window.setTimeout(() => advance(isPromise || result ? Math.min(step + 1, last) : step + 1), 1100 + ((step * 233) % 500)))
    }
    advance(0)
    if (isPromise) {
      ;(hook as Promise<RoutineRunResult>).then(
        (res) => {
          if (ctl.signal.aborted) return
          finished = true
          const t = timers.current.get(r.id)
          if (t) window.clearTimeout(t)
          finish(r, res)
        },
        (e: unknown) => !ctl.signal.aborted && fail(r, e instanceof Error && e.message ? e.message : "The run failed."),
      )
    } else if (result) {
      timers.current.set(
        r.id,
        window.setTimeout(() => {
          finished = true
          finish(r, result)
        }, 1100 * labels.length),
      )
    }
  }
  const stopRun = (r: Routine) => {
    ctls.current.get(r.id)?.abort()
    ctls.current.delete(r.id)
    const t = timers.current.get(r.id)
    if (t) window.clearTimeout(t)
    timers.current.delete(r.id)
    setRunning((s) => {
      const n = { ...s }
      delete n[r.id]
      return n
    })
    setNote(`${r.name} stopped.`)
  }

  /* Schedules that come due while the card is open start a run */
  React.useEffect(() => {
    const prev = prevNow.current
    prevNow.current = nowMs
    if (nowMs <= prev) return
    latest.current.list.forEach((r) => {
      if (!r.enabled) return
      if (nextRun(r.schedule, prev) <= nowMs) startRun(r, nowMs)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMs])

  const toggle = (r: Routine) => {
    const enabled = !r.enabled
    setList((l) => l.map((x) => (x.id === r.id ? { ...x, enabled } : x)))
    onToggle?.(r.id, enabled)
    setNote(`${r.name} ${enabled ? "is on" : "is paused"}.`)
  }
  const save = (r: Routine, schedule: RoutineSchedule) => {
    const next = { ...r, schedule }
    setList((l) => l.map((x) => (x.id === r.id ? next : x)))
    onSave?.(next, { created: false })
    setNote(`${r.name} now runs ${describe(schedule).toLowerCase()}.`)
  }
  const add = (v: { name: string; instruction: string; schedule: RoutineSchedule; sources: RoutineSource[]; destination: string }) => {
    const id = `routine-${++seq.current}-${list.length}`
    const r: Routine = { id, name: v.name, instruction: v.instruction, schedule: v.schedule, sources: v.sources, destination: v.destination, model: "nova-mini", enabled: true, history: [], accent: ((list.length % 4) + 1) as 1 | 2 | 3 | 4 }
    setList((l) => [r, ...l])
    onSave?.(r, { created: true })
    setAdding(false)
    setAddedId(id)
    setNote(`${r.name} added. ${describe(v.schedule)}.`)
    requestAnimationFrame(() => newBtn.current?.focus())
  }

  const onNameKey = (e: React.KeyboardEvent, i: number) => {
    let n = -1
    if (e.key === "ArrowDown") n = Math.min(list.length - 1, i + 1)
    else if (e.key === "ArrowUp") n = Math.max(0, i - 1)
    else if (e.key === "Home") n = 0
    else if (e.key === "End") n = list.length - 1
    if (n < 0) return
    e.preventDefault()
    nameRefs.current.get(list[n].id)?.focus()
  }

  const onSchedule = list.filter((r) => r.enabled).length
  const uid = React.useId()

  return (
    <div className={"arr" + (className ? " " + className : "")}>
      <style href="agent-routines" precedence="default">
        {CSS}
      </style>
      <header className="arr-header">
        <div>
          <h2 className="arr-title" id={`${uid}-t`}>
            {title}
          </h2>
          <p className="arr-subtitle">{`${onSchedule} of ${list.length} on schedule`}</p>
        </div>
        <button ref={newBtn} type="button" className="arr-pill" aria-expanded={adding} onClick={() => setAdding((a) => !a)}>
          <Plus className="arr-plus" size={14} strokeWidth={1.8} aria-hidden />
          New routine
        </button>
      </header>

      {adding && <NewRoutine onAdd={add} onCancel={() => (setAdding(false), requestAnimationFrame(() => newBtn.current?.focus()))} />}

      <ul className="arr-list" aria-labelledby={`${uid}-t`}>
        {list.map((r, i) => {
          const open = openId === r.id
          const run = running[r.id]
          const live = !!run && !run.error
          const last = r.history[r.history.length - 1]
          const next = nextRun(r.schedule, nowMs)
          const accent = r.accent ?? (((i % 4) + 1) as 1 | 2 | 3 | 4)
          const lane = `var(--arr-s${accent})`
          const status = live ? `Running: ${run.labels[run.step]}` : !r.enabled ? "Paused" : `Next run in ${countdown(next - nowMs)}`
          const sched = describe(r.schedule)
          const showSrc = r.sources.length > 3 ? r.sources.slice(0, 2) : r.sources
          const lastRunning = Math.min(run?.step ?? 0, (run?.labels.length ?? 1) - 1)
          return (
            <li key={r.id} className="arr-item" data-open={open || undefined} data-added={addedId === r.id || undefined} style={{ "--lane": lane } as React.CSSProperties}>
              <div
                className="arr-head"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button, [role=switch], [role=group]")) return
                  setOpenId(open ? null : r.id)
                }}
              >
                <div className="arr-line">
                  <h3 className="arr-name-h">
                    <button
                      ref={(el) => {
                        if (el) nameRefs.current.set(r.id, el)
                        else nameRefs.current.delete(r.id)
                      }}
                      type="button"
                      className="arr-name"
                      data-off={!r.enabled || undefined}
                      aria-expanded={open}
                      aria-controls={`${uid}-${r.id}`}
                      onClick={() => setOpenId(open ? null : r.id)}
                      onKeyDown={(e) => onNameKey(e, i)}
                    >
                      <span className="arr-name-text">{r.name}</span>
                      <ChevronDown size={14} strokeWidth={1.8} aria-hidden />
                    </button>
                  </h3>
                  <div className="arr-controls">
                    <span className="arr-run-slot">
                      <button type="button" className="arr-run" data-active={live || undefined} aria-label={live ? `Stop ${r.name}` : `Run ${r.name} now`} onClick={() => (live ? stopRun(r) : startRun(r, nowMs))}>
                        <span className="arr-run-stack">
                          <span className="arr-run-layer" data-off={live || undefined} aria-hidden>
                            <Play size={12} strokeWidth={2} fill="currentColor" />
                            <span className="arr-run-text">Run now</span>
                          </span>
                          <span className="arr-run-layer" data-off={!live || undefined} aria-hidden>
                            <Square size={11} strokeWidth={2} fill="currentColor" />
                            <span className="arr-run-text">Stop</span>
                          </span>
                        </span>
                      </button>
                    </span>
                    <button type="button" role="switch" className="arr-switch" aria-checked={r.enabled} aria-label={`${r.name} schedule`} onClick={() => toggle(r)}>
                      <span className="arr-switch-track">
                        <span className="arr-switch-thumb" />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="arr-when">
                  <p className="arr-when-l">
                    <span className="arr-sched">
                      <Swap text={sched} />
                    </span>
                    <span className="arr-dot" aria-hidden>
                      ·
                    </span>
                    <span className="arr-status">
                      {live ? (
                        <Swap text={status} shimmer />
                      ) : !r.enabled ? (
                        <Swap text="Paused" />
                      ) : (
                        <span>
                          Next run in <span className="arr-count">{countdown(next - nowMs)}</span>
                        </span>
                      )}
                    </span>
                  </p>
                  {last && (
                    <p className="arr-last">
                      <StatusIcon status={last.status} />
                      <span className="arr-sr">{`${STATUS_WORD[last.status]}, `}</span>
                      <Swap text={`Last run ${whenText(atMs(last.at), nowMs)}`} />
                    </p>
                  )}
                </div>

                <div className="arr-meta">
                  <div className="arr-meta-l">
                    <span className="arr-marks" aria-hidden>
                      {showSrc.map((s) => (
                        <SourceMark key={s} source={s} />
                      ))}
                      {r.sources.length > 3 && <span className="arr-more">+{r.sources.length - 2}</span>}
                    </span>
                    <ArrowRight className="arr-arrow" size={12} strokeWidth={1.8} aria-hidden />
                    <span className="arr-dest" aria-hidden>
                      <DestMark dest={r.destination} size={13} />
                      <span className="arr-dest-text">{r.destination === "Direct message" ? "DM" : r.destination}</span>
                    </span>
                    <span className="arr-divider" aria-hidden />
                    <span className="arr-model" aria-hidden>
                      <ModelMark model={r.model} />
                    </span>
                    <span className="arr-sr">{sentence(r)}</span>
                  </div>
                  <Ticks routine={r} now={nowMs} tipId={`${uid}-${r.id}-tip`} />
                </div>

                <span className="arr-progress" data-on={live || undefined} aria-hidden>
                  <i style={{ width: live ? `${((lastRunning + 1) / run.labels.length) * 100}%` : "0%" }} />
                </span>
              </div>

              <Collapse open={open}>
                <div id={`${uid}-${r.id}`}>
                  {run && (
                    <section className="arr-sec" aria-label="Run progress">
                      {run.error ? (
                        <p className="arr-error" role="alert">
                          {`Failed at “${run.labels[run.step] ?? "the first step"}”: ${run.error}`}
                        </p>
                      ) : (
                        <ol className="arr-steps">
                          {run.labels.map((l, si) => (
                            <li key={si} className="arr-step" data-done={si < run.step || undefined} aria-current={si === run.step ? "step" : undefined}>
                              {si < run.step ? <Check size={13} strokeWidth={2} aria-hidden /> : si === run.step ? <Square size={9} strokeWidth={0} fill="currentColor" aria-hidden /> : <span style={{ width: 13 }} />}
                              <Swap text={l} shimmer={si === run.step} />
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  )}
                  <section className="arr-sec" aria-label="Latest run">
                    <div className="arr-sec-head">
                      <h4 className="arr-sec-title" style={{ margin: 0 }}>
                        Latest run
                      </h4>
                      {last && (
                        <span className="arr-sec-meta">
                          <span>
                            <StatusIcon status={last.status} />
                            {STATUS_WORD[last.status]}
                          </span>
                          <span>{whenText(atMs(last.at), nowMs).replace(/^\w/, (c) => c.toUpperCase())}</span>
                          <span>{`${Math.round(last.durationMs / 1000)} s`}</span>
                          <span>{MODELS[r.model].name}</span>
                        </span>
                      )}
                    </div>
                    {r.report ? <Report key={fresh[r.id] ?? "static"} text={r.report} stream={!!fresh[r.id]} /> : <p className="arr-instr">{last ? last.summary : "No runs yet. Run it now to see its first report."}</p>}
                    {r.report && (
                      <p className="arr-posted">
                        <DestMark dest={r.destination} size={13} />
                        <span>
                          Posted to <Tokens text={r.destination === "Direct message" ? "a direct message" : r.destination} />
                        </span>
                      </p>
                    )}
                  </section>
                  <section className="arr-sec" aria-label="Instructions">
                    <h4 className="arr-sec-title" style={{ margin: 0, fontSize: 13, lineHeight: "20px" }}>
                      Instructions
                    </h4>
                    <p className="arr-instr">{r.instruction}</p>
                  </section>
                  <section className="arr-sec" aria-label="Schedule">
                    <h4 className="arr-sec-title" style={{ margin: 0, fontSize: 13, lineHeight: "20px" }}>
                      Schedule
                    </h4>
                    <ScheduleEditor schedule={r.schedule} onChange={(s) => save(r, s)} />
                  </section>
                </div>
              </Collapse>
            </li>
          )
        })}
        {list.length === 0 && <li className="arr-empty">No routines yet. Add one with a sentence.</li>}
      </ul>
      <p className="arr-sr" role="status" aria-live="polite">
        {note}
        {!real && note ? " This preview only simulates runs and posts." : ""}
      </p>
    </div>
  )
}

export default AgentRoutines

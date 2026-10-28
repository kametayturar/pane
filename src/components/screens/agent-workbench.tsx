"use client"

import * as React from "react"
import { ArrowUp, BookOpenText, Check, ChevronDown, FlaskConical, Landmark, LayoutDashboard, ListChecks, Menu, PenLine, Radar, Search, Wallet, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AgentWorkbenchProps = {
  /** Called with the nav label when any item in the left rail is clicked. */
  onNavigate?: (label: string) => void
  /** Rendered at the bottom of the rail, above the user row. */
  sideTools?: React.ReactNode
}

type EditStatus = "accepted" | "auto" | "rejected"

type Edit = {
  id: string
  /** Seconds since 13:00:00 UTC. */
  t: number
  /** Seconds Quill spent on the edit. */
  dur: number
  para: string
  /** Full paragraph text after the edit. */
  to: string
  label: string
  status: EditStatus
  tok: number
}

type Sug = {
  id: string
  para: string
  /** Text to strike (must exist in the paragraph). Empty = append at the end. */
  find: string
  ins: string
  label: string
  typed: number
  status: "typing" | "open"
}

type Note = { id: string; para: string; text: string; sug?: string; resolving?: boolean }

/* -------------------------------------------------------------------------- */
/*                                Simulated data                              */
/* -------------------------------------------------------------------------- */

const SECTIONS = [
  { id: "s1", n: "1", title: "Purpose" },
  { id: "s2", n: "2", title: "Refund timing" },
  { id: "s3", n: "3", title: "Eligibility" },
  { id: "s4", n: "4", title: "Customer messaging" },
  { id: "s5", n: "5", title: "Success measures" },
  { id: "s6", n: "6", title: "Open questions" },
]

const BASE: Record<string, string> = {
  s1: "The returns portal lets customers send items back. It replaces the email form.",
  s2: "Refunds are issued to the original payment method. Store credit is instant.",
  s3: "Items can be returned within 30 days if unused.",
  s4: "After a return is approved the portal confirms by email.",
  s5: "We will track completion rate and time to refund.",
  s6: "Do we support exchanges in v2?",
}

const hms = (s: string) => {
  const [h, m, x] = s.split(":").map(Number)
  return (h - 13) * 3600 + m * 60 + x
}
const fmtT = (t: number) => {
  const T = t + 13 * 3600
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(Math.floor(T / 3600))}:${p(Math.floor((T % 3600) / 60))}:${p(T % 60)}`
}

const mk = (id: string, t: string, dur: number, para: string, label: string, status: EditStatus, to: string): Edit => ({
  id,
  t: hms(t),
  dur,
  para,
  label,
  status,
  to,
  tok: Math.ceil(to.length / 4),
})

const SEED_EDITS: Edit[] = [
  mk("E01", "13:41:08", 14, "s1", "Expand purpose", "accepted", "The returns portal lets a customer start, track and finish a return without contacting support. It replaces the email form."),
  mk("E02", "13:42:31", 22, "s2", "Add refund window", "accepted", "Refunds are issued to the original payment method within 5 business days of the warehouse scanning the parcel. Store credit is instant."),
  mk("E03", "13:44:02", 9, "s3", "Clarify eligibility", "auto", "Items can be returned within 30 days of delivery if unused and in original packaging."),
  mk("E04", "13:45:40", 12, "s1", "Name the flow", "accepted", "The returns portal lets a customer start, track and finish a return without contacting support. v2 replaces the email form with a guided flow."),
  mk("E05", "13:47:19", 18, "s5", "Specify metrics", "auto", "We will track completion rate, median time to refund and the share of returns started without a support contact."),
  mk("E06", "13:49:45", 31, "s4", "Draft email promise", "accepted", "After a return is approved the portal confirms by email. The email tells the customer the refund will arrive in 3 business days."),
  mk("E07", "13:52:10", 8, "s6", "Add open question", "auto", "Do we support exchanges in v2? Who approves returns above $400?"),
  mk("E08", "13:54:36", 15, "s3", "Final-sale rule", "accepted", "Items can be returned within 30 days of delivery if unused and in original packaging. Final-sale items are excluded and marked at checkout."),
  mk("E09", "13:56:21", 6, "s2", "Consistent verbs", "auto", "Refunds are issued to the original payment method within 5 business days of the warehouse scanning the parcel. Store credit is issued instantly."),
  mk("E10", "13:58:03", 21, "s5", "Add target", "accepted", "We will track completion rate, median time to refund and the share of returns started without a support contact. Target: 85% self-serve by the end of Q3."),
  mk("E11", "13:59:50", 10, "s1", "Tighten purpose", "accepted", "The returns portal lets a customer start, track and finish a return without contacting support. v2 replaces the email form with a guided flow and adds label printing at home."),
  mk("E12", "14:01:44", 7, "s6", "Extend questions", "auto", "Do we support exchanges in v2? Who approves returns above $400? Is a partial refund allowed?"),
]

const FIRST_SUG: Omit<Sug, "typed" | "status"> = {
  id: "g0",
  para: "s4",
  find: "in 3 business days",
  ins: "within 5 business days of the warehouse scanning the parcel",
  label: "Match refund window",
}

const SEED_NOTES: Note[] = [
  { id: "n1", para: "s4", text: "This contradicts §2 – refunds take 5 days, not 3.", sug: "g0" },
  { id: "n2", para: "s3", text: "“Unused” will be read three ways by support. A one-line definition would settle it." },
  { id: "n3", para: "s5", text: "85% is an aim, not a baseline. Do we have last quarter’s rate?" },
]

type Chip = { id: string; label: string; para: string; find: string; ins: string }
const CHIPS: Chip[] = [
  { id: "c1", label: "Define “unused”", para: "s3", find: "unused and in original packaging", ins: "unworn, unwashed and in original packaging" },
  { id: "c2", label: "Tighten §1", para: "s1", find: "and adds label printing at home", ins: "and prints labels at home" },
  { id: "c3", label: "Plain verbs in §5", para: "s5", find: "We will track", ins: "We track" },
  { id: "c4", label: "List edge cases", para: "s6", find: "", ins: " What happens to bundles returned in part?" },
]

const ADA_PARA = "s6"
const ADA_AFTER = "$400?"
const BASE_TOKENS = 8400
const SLOT = 34
const PAD = 14

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

function textsAt(edits: Edit[], k: number) {
  const o = { ...BASE }
  for (let i = 0; i < k && i < edits.length; i++) o[edits[i].para] = edits[i].to
  return o
}

function applySug(text: string, s: Pick<Sug, "find" | "ins">) {
  if (!s.find) return text + s.ins
  const i = text.indexOf(s.find)
  return i < 0 ? text : text.slice(0, i) + s.ins + text.slice(i + s.find.length)
}

function Crops() {
  return (
    <>
      <i className="iwb-crop tl" />
      <i className="iwb-crop tr" />
      <i className="iwb-crop bl" />
      <i className="iwb-crop br" />
    </>
  )
}

function Cursor({ who, typing }: { who: "quill" | "ada"; typing?: boolean }) {
  return (
    <span className={`iwb-cur ${who}${typing ? " typing" : ""}`} aria-hidden="true">
      <i>{who === "quill" ? "QUILL" : "ADA"}</i>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.iwb {
  --iwb-paper: #fafafa;
  --iwb-sheet: #ffffff;
  --iwb-ink: #0a0a0a;
  --iwb-signal: #0060e2;
  --iwb-accent: var(--iwb-signal);
  --iwb-surface: var(--iwb-sheet);
  --iwb-signal-soft: color-mix(in oklab, var(--iwb-signal) 12%, transparent);
  --iwb-t1: color-mix(in oklab, var(--iwb-ink) 92%, transparent);
  --iwb-t2: color-mix(in oklab, var(--iwb-ink) 64%, transparent);
  --iwb-t3: color-mix(in oklab, var(--iwb-ink) 44%, transparent);
  --iwb-t4: color-mix(in oklab, var(--iwb-ink) 22%, transparent);
  --iwb-rule: color-mix(in oklab, var(--iwb-ink) 14%, transparent);
  --iwb-rule-2: color-mix(in oklab, var(--iwb-ink) 7%, transparent);
  --iwb-ok: #1f8a4c; --iwb-warn: #b7791f; --iwb-bad: #c4321a;
  --iwb-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --iwb-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --iwb-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --iwb-font: var(--iwb-sans);
  --iwb-ease: cubic-bezier(.2, .8, .2, 1);
  --iwb-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --iwb-on-signal: #ffffff;
  font: 13px/20px var(--iwb-font); color: var(--iwb-t1);
  position: relative; display: flex; height: 100%; min-height: 0; overflow: hidden;
  background: var(--iwb-paper);
}
:is(.dark, [data-theme="dark"]) .iwb {
  --iwb-paper: #0c0c0d; --iwb-sheet: #1c1c1e; --iwb-ink: #f5f5f5; --iwb-signal: #4d8dff;
}
.iwb *, .iwb *::before, .iwb *::after { box-sizing: border-box }
:where(.iwb) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.iwb) input { font: inherit; color: inherit }
.iwb :focus-visible { outline: 2px solid color-mix(in oklab, var(--iwb-accent) 70%, transparent); outline-offset: 1px }
.iwb-mono { font-family: var(--iwb-mono); font-size: 10.5px; line-height: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--iwb-t3) }

/* ---- rail ---- */
.iwb-rail { width: 232px; flex: none; display: flex; flex-direction: column; background: var(--iwb-sheet); border-right: 1px solid var(--iwb-rule); min-height: 0; overflow-y: auto; z-index: 30 }
.iwb-brand { display: flex; align-items: center; gap: 9px; padding: 15px 18px 14px; font: 400 20px/24px var(--iwb-serif); letter-spacing: -.01em; color: var(--iwb-ink) }
.iwb-brand svg { flex: none }
.iwb-group { padding: 0 12px; margin-top: 12px }
.iwb-group > .iwb-mono { padding: 0 6px; margin-bottom: 6px; display: block }
.iwb-ws { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 32px; padding: 0 10px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); background: var(--iwb-paper); color: var(--iwb-t1); transition: box-shadow .2s var(--iwb-ease) }
.iwb-ws:hover { box-shadow: 0 0 0 1px var(--iwb-t4) }
.iwb-ws svg { color: var(--iwb-t3) }
.iwb-nav { position: relative; margin: 0 0 0 8px; padding: 0 }
.iwb-nav::before { content: ""; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--iwb-rule) }
.iwb-item { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; height: 30px; padding: 0 8px 0 16px; color: var(--iwb-t2); border-radius: 0 2px 2px 0; transition: color .2s var(--iwb-ease), background-color .2s var(--iwb-ease) }
.iwb-item:hover { color: var(--iwb-t1); background: var(--iwb-rule-2) }
.iwb-item svg { flex: none; stroke-width: 1.5 }
.iwb-item.is-active { color: var(--iwb-ink) }
.iwb-item.is-active::before { content: ""; position: absolute; left: -1px; top: 5px; bottom: 5px; width: 2px; background: var(--iwb-accent); transform-origin: top; animation: iwb-tick .5s var(--iwb-ease) backwards }
.iwb-agent { padding-left: 16px }
.iwb-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--iwb-t4); position: relative }
.iwb-dot.ok { background: var(--iwb-ok) }
.iwb-dot.live { background: var(--iwb-accent) }
.iwb-dot.live::after { content: ""; position: absolute; inset: -1px; border-radius: 50%; border: 1px solid var(--iwb-accent); animation: iwb-pulse 1.6s var(--iwb-ease) infinite }
.iwb-agent .iwb-mono { margin-left: auto; font-size: 9.5px }
.iwb-spacer { flex: 1; min-height: 12px }
.iwb-user { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--iwb-rule) }
.iwb-av { width: 24px; height: 24px; border-radius: 2px; flex: none; display: grid; place-items: center; background: var(--iwb-ink); color: var(--iwb-paper); font: 600 10px/1 var(--iwb-mono); letter-spacing: .04em }
.iwb-user b { font-weight: 500; color: var(--iwb-t1); display: block; line-height: 16px }
.iwb-user div span { display: block; font-size: 11.5px; line-height: 14px; color: var(--iwb-t3) }
.iwb-sidetools { padding: 8px 12px }
.iwb-scrim { position: absolute; inset: 0; z-index: 20; background: color-mix(in oklab, var(--iwb-ink) 28%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--iwb-ease) }

/* ---- main + top bar ---- */
.iwb-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column }
.iwb-top { height: 52px; flex: none; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid var(--iwb-rule); background: var(--iwb-paper) }
.iwb-menu { display: none; width: 32px; height: 32px; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); background: var(--iwb-sheet) }
.iwb-title { min-width: 0 }
.iwb-title .iwb-mono { display: block; font-size: 10px; line-height: 12px; white-space: nowrap }
.iwb-title h1 { margin: 0; font: 400 22px/24px var(--iwb-serif); letter-spacing: -.01em; color: var(--iwb-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iwb-actions { margin-left: auto; display: flex; align-items: center; gap: 10px }
.iwb-search { display: flex; align-items: center; gap: 8px; width: 210px; height: 30px; padding: 0 8px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); background: var(--iwb-sheet); color: var(--iwb-t3); transition: box-shadow .2s var(--iwb-ease) }
.iwb-search:hover { box-shadow: 0 0 0 1px var(--iwb-t4) }
.iwb-search span { flex: 1 }
.iwb-search kbd { font: 500 10px/14px var(--iwb-mono); letter-spacing: .04em; padding: 0 4px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); color: var(--iwb-t3) }
.iwb-btn { height: 30px; padding: 0 12px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); background: var(--iwb-sheet); color: var(--iwb-t1); font-weight: 500; transition: box-shadow .2s var(--iwb-ease), opacity .2s }
.iwb-btn:hover { box-shadow: 0 0 0 1px var(--iwb-t3) }
.iwb-btn.ink { background: var(--iwb-ink); color: var(--iwb-paper); box-shadow: none }
.iwb-btn.ink:hover { opacity: .88 }
.iwb-presence { display: flex; gap: 4px }
.iwb-presence .iwb-av { position: relative }
.iwb-presence .q { background: var(--iwb-sheet); color: var(--iwb-ink); box-shadow: 0 0 0 1px var(--iwb-rule); }
.iwb-presence .q::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--iwb-accent) }

/* ---- workbench body ---- */
.iwb-body { flex: 1; min-height: 0; overflow-y: auto; display: block }
.iwb-left { position: relative; min-width: 0 }
.iwb-left::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle, var(--iwb-t4) .6px, transparent .9px) 0 0 / 8px 8px; opacity: .55; -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 100%); mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 100%) }
.iwb-stage { position: relative; padding: 24px 16px 40px }
.iwb-banner { position: relative; display: flex; align-items: center; gap: 12px; margin: 0 auto 18px; max-width: 640px; padding: 7px 10px; background: var(--iwb-sheet); box-shadow: 0 0 0 1px var(--iwb-rule); border-radius: 2px; animation: iwb-settle .3s var(--iwb-ease) backwards }
.iwb-banner .iwb-mono { color: var(--iwb-t2) }
.iwb-banner .iwb-mono b { color: var(--iwb-accent); font-weight: 600 }
.iwb-banner button { margin-left: auto; font: 500 10.5px/14px var(--iwb-mono); letter-spacing: .08em; text-transform: uppercase; padding: 3px 8px; border-radius: 2px; background: var(--iwb-ink); color: var(--iwb-paper) }
.iwb-page { position: relative; margin: 0 auto; width: 100%; max-width: 640px }
.iwb-page.wide { max-width: 860px; padding-right: 214px }
.iwb-sheet { position: relative; background: var(--iwb-sheet); box-shadow: 0 0 0 1px var(--iwb-rule); border-radius: 0; padding: 0 0 36px }
.iwb-crop { position: absolute; width: 8px; height: 8px; pointer-events: none; border: 0 solid var(--iwb-t4) }
.iwb-crop.tl { left: -10px; top: -10px; border-right-width: 1px; border-bottom-width: 1px }
.iwb-crop.tr { right: -10px; top: -10px; border-left-width: 1px; border-bottom-width: 1px }
.iwb-crop.bl { left: -10px; bottom: -10px; border-right-width: 1px; border-top-width: 1px }
.iwb-crop.br { right: -10px; bottom: -10px; border-left-width: 1px; border-top-width: 1px }
.iwb-ruler { height: 14px; border-bottom: 1px solid var(--iwb-rule);
  background:
    repeating-linear-gradient(90deg, var(--iwb-t3) 0 1px, transparent 1px 48px) 0 100% / 100% 7px no-repeat,
    repeating-linear-gradient(90deg, var(--iwb-t4) 0 1px, transparent 1px 8px) 0 100% / 100% 3px no-repeat }
.iwb-doc { padding: 22px 22px 0 }
.iwb-doc-head { padding-bottom: 18px; border-bottom: 1px solid var(--iwb-rule); margin-bottom: 8px }
.iwb-doc-head h2 { margin: 6px 0 8px; font: 400 36px/40px var(--iwb-serif); letter-spacing: -.01em; color: var(--iwb-ink); text-wrap: balance }
.iwb-doc-head h2 em { font-style: italic }
.iwb-row { position: relative; padding: 14px 0 6px }
.iwb-sec { display: flex; align-items: baseline; gap: 9px; margin-bottom: 4px }
.iwb-sec h3 { margin: 0; font: 400 20px/26px var(--iwb-serif); letter-spacing: -.01em; color: var(--iwb-ink) }
.iwb-p { position: relative; margin: 0; font: 400 15px/25px var(--iwb-sans); color: var(--iwb-t1); text-wrap: pretty; border-radius: 2px }
.iwb-p.flash { animation: iwb-flash 1.4s var(--iwb-ease) backwards }
.iwb-p.has-note::after { content: ""; position: absolute; right: -10px; top: 3px; bottom: 3px; width: 1px; background: var(--iwb-t4) }
.iwb-del { color: var(--iwb-t3); text-decoration: line-through; text-decoration-color: var(--iwb-t3) }
.iwb-ins { background: var(--iwb-signal-soft); text-decoration: underline; text-decoration-color: color-mix(in oklab, var(--iwb-accent) 60%, transparent); text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-skip-ink: none }
.iwb-sa { display: inline-flex; gap: 4px; margin-left: 8px; vertical-align: 1px; animation: iwb-settle .24s var(--iwb-ease) backwards }
.iwb-sa button { font: 500 10px/16px var(--iwb-mono); letter-spacing: .08em; text-transform: uppercase; padding: 1px 7px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); background: var(--iwb-sheet); color: var(--iwb-t1); text-align: center; display: inline-flex; align-items: center; gap: 3px; transition: box-shadow .2s var(--iwb-ease), opacity .2s }
.iwb-sa button:hover { box-shadow: 0 0 0 1px var(--iwb-t3) }
.iwb-sa .acc { background: var(--iwb-ink); color: var(--iwb-paper); box-shadow: none }
.iwb-sa .acc:hover { opacity: .85 }
.iwb-cur { position: relative; display: inline-block; width: 0; height: 0; vertical-align: baseline; --c: var(--iwb-accent); --on: var(--iwb-on-signal) }
.iwb-cur.ada { --c: var(--iwb-ink); --on: var(--iwb-paper) }
.iwb-cur::before { content: ""; position: absolute; left: -1px; top: -15px; width: 2px; height: 20px; background: var(--c) }
.iwb-cur:not(.typing)::before { animation: iwb-blink 1.1s steps(1) infinite }
.iwb-cur i { position: absolute; left: -1px; top: -29px; font: 600 9px/12px var(--iwb-mono); font-style: normal; letter-spacing: .08em; padding: 0 4px; background: var(--c); color: var(--on); white-space: nowrap; border-radius: 1px 1px 1px 0 }

/* margin notes */
.iwb-note { position: relative; margin: 8px 0 0; padding: 0 0 0 12px; border-left: 1px solid var(--iwb-rule); transition: opacity .24s var(--iwb-ease), max-height .24s var(--iwb-ease), transform .24s var(--iwb-ease); max-height: 220px; overflow: hidden }
.iwb-note.resolving { opacity: 0; max-height: 0; transform: translateX(6px); margin-top: 0 }
.iwb-note q { display: block; quotes: none; font: italic 400 15px/19px var(--iwb-serif); color: var(--iwb-t1) }
.iwb-note .who { display: block; margin-bottom: 2px; font-size: 9.5px; color: var(--iwb-accent) }
.iwb-resolve { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; padding: 2px 0; font: 500 10px/14px var(--iwb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iwb-t3); transition: color .2s }
.iwb-resolve:hover { color: var(--iwb-ink) }
.iwb-page.wide .iwb-note { position: absolute; left: calc(100% + 44px + 16px); top: 28px; width: 190px; margin: 0; padding: 0; border-left: 0; overflow: visible; max-height: none; pointer-events: auto }
.iwb-page.wide .iwb-note.resolving { transform: translateX(6px); }
.iwb-page.wide .iwb-note::before { content: ""; position: absolute; left: -60px; top: 14px; width: 60px; height: 1px; background: var(--iwb-t3); transform-origin: left; animation: iwb-draw .6s var(--iwb-ease-trace) backwards .5s }
.iwb-page.wide .iwb-note::after { content: ""; position: absolute; left: -62px; top: 12px; width: 5px; height: 5px; border-radius: 50%; box-shadow: 0 0 0 1px var(--iwb-t3); background: var(--iwb-sheet) }
.iwb-page.wide .iwb-note-in { position: absolute; left: 0; top: 0; right: 0 }
.iwb-fig { margin: 14px 0 0; display: flex; justify-content: space-between; gap: 10px }
.iwb-faded { opacity: .35; pointer-events: none; transition: opacity .3s var(--iwb-ease) }

/* ---- session tape ---- */
.iwb-tape { position: relative; display: flex; flex-direction: column; min-width: 0; background: var(--iwb-sheet); border-top: 1px solid var(--iwb-rule) }
.iwb-ph { padding: 18px 18px 12px }
.iwb-ph h2 { margin: 2px 0 2px; font: 400 22px/26px var(--iwb-serif); letter-spacing: -.01em; color: var(--iwb-ink) }
.iwb-ph h2 em { font-style: italic }
.iwb-ph p { margin: 0; color: var(--iwb-t2); font-size: 12.5px; line-height: 18px }
.iwb-readout { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--iwb-rule); border-bottom: 1px solid var(--iwb-rule) }
.iwb-readout > div { padding: 8px 12px 9px; border-left: 1px solid var(--iwb-rule) }
.iwb-readout > div:first-child { border-left: 0 }
.iwb-readout dt { font: 10px/14px var(--iwb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iwb-t3) }
.iwb-readout dd { margin: 0; font: 500 16px/22px var(--iwb-mono); font-variant-numeric: tabular-nums; color: var(--iwb-ink) }
.iwb-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 0 18px 20px }
.iwb-scan { position: relative }
.iwb-scan-in { animation: iwb-unmask .8s var(--iwb-ease) backwards }
.iwb-scan::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--iwb-accent); opacity: 0; animation: iwb-sweep .8s var(--iwb-ease) backwards; pointer-events: none }
.iwb-track { position: relative; margin-top: 4px; touch-action: none; user-select: none; cursor: ns-resize }
.iwb-ticks { position: absolute; left: 56px; width: 12px; top: ${PAD}px;
  background:
    repeating-linear-gradient(to bottom, var(--iwb-t4) 0 1px, transparent 1px ${SLOT / 4}px) 100% 0 / 4px 100% no-repeat,
    repeating-linear-gradient(to bottom, var(--iwb-t3) 0 1px, transparent 1px ${SLOT}px) 100% 0 / 9px 100% no-repeat }
.iwb-ticks::after { content: ""; position: absolute; right: 0; bottom: -1px; width: 9px; height: 1px; background: var(--iwb-t3) }
.iwb-edit { position: absolute; left: 0; right: 0; height: ${SLOT}px; display: grid; grid-template-columns: 56px 12px 18px 1fr; align-items: center; transition: opacity .3s var(--iwb-ease); cursor: pointer }
.iwb-edit .t { font: 10px/14px var(--iwb-mono); letter-spacing: .02em; color: var(--iwb-t3); font-variant-numeric: tabular-nums }
.iwb-edit .bar { justify-self: center; width: 5px; border-radius: 0; background: var(--iwb-ink); transform-origin: center; animation: iwb-grow .6s var(--iwb-ease) backwards }
.iwb-edit.auto .bar { background: conic-gradient(var(--iwb-ink) 25%, transparent 0 50%, var(--iwb-ink) 0 75%, transparent 0) 0 0 / 2px 2px; box-shadow: 0 0 0 1px var(--iwb-t4) }
.iwb-edit.rejected .bar { background: none; box-shadow: 0 0 0 1px var(--iwb-t3) }
.iwb-edit .tx { min-width: 0; padding-right: 2px }
.iwb-edit .tx b { display: block; font: 500 12.5px/16px var(--iwb-sans); color: var(--iwb-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.iwb-edit .tx span { display: block; font: 9.5px/12px var(--iwb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iwb-t3) }
.iwb-edit.rejected .tx b { text-decoration: line-through; text-decoration-color: var(--iwb-t3); color: var(--iwb-t2) }
.iwb-edit.future { opacity: .38 }
.iwb-edit:hover .tx b { color: var(--iwb-ink) }
.iwb-play { position: absolute; left: 0; right: 0; height: 0; z-index: 3; transition: transform .32s var(--iwb-ease) }
.iwb-track.dragging .iwb-play { transition: none }
.iwb-play::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--iwb-accent) }
.iwb-play::after { content: ""; position: absolute; left: 49px; top: -6px; width: 12px; height: 12px; background: var(--iwb-accent); clip-path: polygon(0 0, 100% 50%, 0 100%) }
.iwb-play i { position: absolute; right: 0; top: 3px; font: 600 9px/12px var(--iwb-mono); font-style: normal; letter-spacing: .08em; padding: 0 5px; background: var(--iwb-accent); color: var(--iwb-on-signal); text-transform: uppercase }
.iwb-play:focus-visible { outline: 0 }
.iwb-grab { position: absolute; left: 0; right: 0; top: -9px; height: 18px; background: transparent }
.iwb-grab:focus-visible { outline: 2px solid color-mix(in oklab, var(--iwb-accent) 70%, transparent); outline-offset: -2px }
.iwb-now { position: absolute; left: 0; font: 10px/14px var(--iwb-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--iwb-t3) }

/* ---- instruction bar ---- */
.iwb-ask { flex: none; background: var(--iwb-sheet); border-top: 1px solid var(--iwb-rule); padding: 10px 20px 12px }
.iwb-chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none }
.iwb-chips::-webkit-scrollbar { display: none }
.iwb-chip { flex: none; height: 24px; padding: 0 9px; border-radius: 2px; box-shadow: 0 0 0 1px var(--iwb-rule); color: var(--iwb-t2); background: var(--iwb-paper); white-space: nowrap; transition: box-shadow .2s var(--iwb-ease), color .2s, opacity .2s }
.iwb-chip:hover:not(:disabled) { box-shadow: 0 0 0 1px var(--iwb-t3); color: var(--iwb-ink) }
.iwb-chip:disabled { opacity: .4; cursor: default }
.iwb-askrow { display: flex; align-items: center; gap: 10px }
.iwb-askrow .iwb-av { background: var(--iwb-sheet); color: var(--iwb-ink); box-shadow: 0 0 0 1px var(--iwb-rule); position: relative }
.iwb-askrow .iwb-av::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--iwb-accent) }
.iwb-input { flex: 1; min-width: 0; height: 34px; padding: 0 10px; border-radius: 2px; border: 0; background: var(--iwb-paper); box-shadow: 0 0 0 1px var(--iwb-rule); outline: 0; color: var(--iwb-t1); transition: box-shadow .2s var(--iwb-ease) }
.iwb-input::placeholder { color: var(--iwb-t3) }
.iwb-input:focus { box-shadow: 0 0 0 1px var(--iwb-ink) }
.iwb-send { width: 34px; height: 34px; border-radius: 2px; background: var(--iwb-ink); color: var(--iwb-paper); display: grid; place-items: center; transition: opacity .2s }
.iwb-send:disabled { opacity: .3; cursor: default }
.iwb-status { white-space: nowrap }

/* ---- motion ---- */
@keyframes iwb-pulse { from { transform: scale(1); opacity: .9 } to { transform: scale(3.2); opacity: 0 } }
@keyframes iwb-blink { 50% { opacity: 0 } }
@keyframes iwb-tick { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes iwb-settle { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes iwb-flash { from { background: var(--iwb-signal-soft) } to { background: transparent } }
@keyframes iwb-draw { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes iwb-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes iwb-unmask { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes iwb-sweep { 0% { top: 0; opacity: 1 } 85% { opacity: 1 } 100% { top: 100%; opacity: 0 } }
@keyframes iwb-slide { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

/* ---- responsive ---- */
@media (min-width: 1200px) {
  .iwb-body { display: grid; grid-template-columns: minmax(0, 1fr) 280px; overflow: hidden }
  .iwb-left { overflow: hidden }
  .iwb-stage { height: 100%; overflow-y: auto }
  .iwb-tape { border-top: 0; border-left: 1px solid var(--iwb-rule); min-height: 0 }
}
@media (max-width: 1199px) {
  .iwb-scroll { overflow: visible }
}
@media (max-width: 1023px) {
  .iwb-rail { position: absolute; left: 0; top: 0; bottom: 0; transform: translateX(-100%); visibility: hidden; transition: transform .32s var(--iwb-ease), visibility 0s .32s; box-shadow: 0 1px 0 var(--iwb-rule), 0 12px 24px -16px rgb(0 0 0 / .25) }
  .iwb.is-open .iwb-rail { transform: none; visibility: visible; transition: transform .32s var(--iwb-ease), visibility 0s }
  .iwb.is-open .iwb-scrim { opacity: 1; pointer-events: auto }
  .iwb-menu { display: grid }
}
@media (max-width: 1099px) { .iwb-search { display: none } }
@media (max-width: 767px) {
  .iwb-top { padding: 0 12px; gap: 10px }
  .iwb-title .iwb-mono { display: none }
  .iwb-title h1 { font-size: 21px }
  .iwb-presence, .iwb-share { display: none }
  .iwb-stage { padding: 16px 14px 28px }
  .iwb-doc { padding: 16px 16px 0 }
  .iwb-doc-head h2 { font-size: 30px; line-height: 34px }
  .iwb-ask { padding: 8px 12px 10px }
  .iwb-askrow .iwb-av, .iwb-status { display: none }
  .iwb-ph { padding: 16px 16px 10px }
  .iwb-scroll { padding: 0 16px 20px }
}
@media (prefers-reduced-motion: reduce) {
  .iwb *, .iwb *::before, .iwb *::after { animation: none !important; transition: none !important }
}
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
  { name: "Atlas", state: "ok", note: "Idle" },
  { name: "Sage", state: "off", note: "Paused" },
  { name: "Quill", state: "live", note: "Editing" },
]

function Glyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 9h15" stroke="var(--iwb-accent)" strokeWidth="1.5" />
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
      className={`iwb${open ? " is-open" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) setOpen(false)
      }}
    >
      <style href="agent-workbench" precedence="default">
        {CSS}
      </style>
      <div className="iwb-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="iwb-rail" aria-label="Meridian navigation" inert={hidden}>
        <div className="iwb-brand">
          <Glyph />
          Meridian
        </div>
        <div className="iwb-group" style={{ marginTop: 4 }}>
          <span className="iwb-mono">Workspace</span>
          <button type="button" className="iwb-ws" aria-label="Switch workspace">
            Harbor &amp; Finch
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="iwb-group" aria-label="Console">
          <span className="iwb-mono">Console</span>
          <div className="iwb-nav">
            {NAV.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className={`iwb-item${label === active ? " is-active" : ""}`}
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
        <nav className="iwb-group" aria-label="Operations">
          <span className="iwb-mono">Operations</span>
          <div className="iwb-nav">
            {OPS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className="iwb-item"
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
        <nav className="iwb-group" aria-label="Agents">
          <span className="iwb-mono">Agents</span>
          <div className="iwb-nav">
            {AGENTS.map((a) => (
              <button
                key={a.name}
                type="button"
                className="iwb-item iwb-agent"
                onClick={() => {
                  setOpen(false)
                  onNavigate?.(a.name)
                }}
              >
                <span className={`iwb-dot ${a.state}`} aria-hidden="true" />
                {a.name}
                <span className="iwb-mono">{a.note}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="iwb-spacer" />
        {sideTools ? <div className="iwb-sidetools">{sideTools}</div> : null}
        <div className="iwb-user">
          <span className="iwb-av" aria-hidden="true">
            AO
          </span>
          <div>
            <b>Ada Okafor</b>
            <span>Product lead</span>
          </div>
        </div>
      </aside>
      <div className="iwb-main">
        <header className="iwb-top">
          <button type="button" className="iwb-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={16} strokeWidth={1.5} />
          </button>
          <div className="iwb-title">
            <span className="iwb-mono">{crumb}</span>
            <h1>{title}</h1>
          </div>
          <div className="iwb-actions">
            <button type="button" className="iwb-search" aria-label="Search, command K">
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
/*                               Agent Workbench                              */
/* -------------------------------------------------------------------------- */

export function AgentWorkbench({ onNavigate, sideTools }: AgentWorkbenchProps) {
  const reduced = useMatch("(prefers-reduced-motion: reduce)")
  const tabVisible = useTabVisible()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const running = tabVisible && inView

  const [edits, setEdits] = React.useState<Edit[]>(SEED_EDITS)
  const [sugs, setSugs] = React.useState<Sug[]>(() => [
    { ...FIRST_SUG, typed: reduced ? FIRST_SUG.ins.length : 0, status: reduced ? "open" : "typing" },
  ])
  const [notes, setNotes] = React.useState<Note[]>(SEED_NOTES)
  const [scrub, setScrub] = React.useState<number | null>(null)
  const [drag, setDrag] = React.useState(false)
  const [wide, setWide] = React.useState(() => typeof window !== "undefined" && window.innerWidth >= 1000)
  const [draft, setDraft] = React.useState("")
  const stageRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const timers = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const N = edits.length
  const k = scrub ?? N
  const live = scrub === null
  const liveTexts = React.useMemo(() => textsAt(edits, N), [edits, N])
  const shown = React.useMemo(() => (live ? liveTexts : textsAt(edits, k)), [live, liveTexts, edits, k])
  const changedPara = !live && k > 0 ? edits[k - 1].para : null

  /* page width -> margin notes beside the sheet or inline under the paragraph */
  React.useEffect(() => {
    const el = stageRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width >= 700))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach(clearTimeout)
      set.clear()
    }
  }, [])

  /* Quill types the active suggestion at a steady pace */
  const active = sugs.find((s) => s.status === "typing")
  const activeId = active?.id
  const activeTyped = active?.typed ?? 0
  React.useEffect(() => {
    if (!activeId || !running) return
    const cur = sugs.find((s) => s.id === activeId)
    if (!cur) return
    const prevCh = cur.ins[cur.typed - 1]
    const delay = cur.typed === 0 ? 650 : 42 + (prevCh === "," || prevCh === "." ? 110 : 0)
    const id = setTimeout(() => {
      setSugs((all) =>
        all.map((s) => {
          if (s.id !== activeId) return s
          const typed = Math.min(s.ins.length, s.typed + 1)
          return { ...s, typed, status: typed >= s.ins.length ? "open" : "typing" }
        }),
      )
    }, delay)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, activeTyped, running])

  const quillSug = active ?? sugs[sugs.length - 1]
  const quillPara = quillSug?.para ?? "s4"

  const finish = (s: Sug, accept: boolean) => {
    const cur = liveTexts[s.para]
    const next = accept ? applySug(cur, s) : cur
    setEdits((prev) => {
      const last = prev[prev.length - 1]
      return [
        ...prev,
        {
          id: `E${String(prev.length + 1).padStart(2, "0")}`,
          t: last.t + 95,
          dur: Math.max(5, Math.round(s.ins.length / 3)),
          para: s.para,
          to: next,
          label: s.label,
          status: accept ? "accepted" : "rejected",
          tok: Math.ceil(s.ins.length / 4),
        },
      ]
    })
    setSugs((all) => all.filter((x) => x.id !== s.id))
    if (accept) resolveWhere((n) => n.sug === s.id)
  }

  const resolveWhere = (pred: (n: Note) => boolean) => {
    setNotes((all) => all.map((n) => (pred(n) ? { ...n, resolving: true } : n)))
    const t = setTimeout(() => {
      timers.current.delete(t)
      setNotes((all) => all.filter((n) => !n.resolving))
    }, 260)
    timers.current.add(t)
  }

  const canRun = (c: Chip) =>
    live && !sugs.some((s) => s.para === c.para) && (c.find === "" || liveTexts[c.para].includes(c.find)) && !liveTexts[c.para].includes(c.ins)

  const ask = (c: Chip | undefined) => {
    if (!c) return
    setSugs((all) => [...all, { id: `g${edits.length}${all.length}${c.id}`, para: c.para, find: c.find, ins: c.ins, label: c.label, typed: reduced ? c.ins.length : 0, status: reduced ? "open" : "typing" }])
    setDraft("")
  }

  const submit = () => {
    const q = draft.trim().toLowerCase()
    if (!q) return
    const pick =
      CHIPS.find((c) => canRun(c) && ((/unused|defin/.test(q) && c.id === "c1") || (/tight|short|§1|purpose/.test(q) && c.id === "c2") || (/verb|plain|tone|§5/.test(q) && c.id === "c3") || (/edge|case|list|bundle/.test(q) && c.id === "c4"))) ?? CHIPS.find(canRun)
    ask(pick)
  }

  /* tape scrubbing */
  const idxFromY = (clientY: number) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return N
    return Math.min(N, Math.max(0, Math.round((clientY - r.top - PAD) / SLOT)))
  }
  const go = (i: number) => setScrub(i >= N ? null : i)
  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowUp: k - 1, ArrowLeft: k - 1, ArrowDown: k + 1, ArrowRight: k + 1, Home: 0, End: N }
    if (e.key in map) {
      e.preventDefault()
      go(Math.min(N, Math.max(0, map[e.key])))
    }
  }

  const accepted = edits.filter((e) => e.status === "accepted").length
  const typedChars = sugs.reduce((n, s) => n + s.typed, 0)
  const tokens = BASE_TOKENS + edits.slice(SEED_EDITS.length).reduce((n, e) => n + e.tok, 0) + Math.floor(typedChars / 4)
  const openNotes = notes.filter((n) => !n.resolving).length
  const pending = sugs.filter((s) => s.status === "open").length
  const quillState = active ? `Typing in §${active.para.slice(1)}` : pending ? "Waiting on you" : "Idle"

  const actions = (
    <>
      <div className="iwb-presence" role="group" aria-label="In this document">
        <span className="iwb-av" title="Ada Okafor">
          AO
        </span>
        <span className="iwb-av q" title="Quill, agent">
          Q
        </span>
      </div>
      <button type="button" className="iwb-btn iwb-share">
        Share
      </button>
      <button type="button" className="iwb-btn ink">
        Publish
      </button>
    </>
  )

  const askBar = (
    <div className="iwb-ask">
      <div className="iwb-chips" role="group" aria-label="Suggested instructions">
        {CHIPS.map((c) => (
          <button key={c.id} type="button" className="iwb-chip" disabled={!canRun(c)} onClick={() => ask(c)}>
            {c.label}
          </button>
        ))}
      </div>
      <form
        className="iwb-askrow"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <span className="iwb-av" aria-hidden="true">
          Q
        </span>
        <input className="iwb-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask Quill to…" aria-label="Instruction for Quill" />
        <span className="iwb-mono iwb-status" aria-live="polite">
          Quill · {quillState}
        </span>
        <button type="submit" className="iwb-send" aria-label="Send instruction" disabled={!draft.trim()}>
          <ArrowUp size={15} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  )

  return (
    <div ref={rootRef} style={{ height: "100%", minHeight: 0 }}>
      <Shell active="Workbench" crumb="CONSOLE / WORKBENCH" title="Agent Workbench" actions={actions} onNavigate={onNavigate} sideTools={sideTools} ask={askBar}>
        <div className="iwb-body">
          <div className="iwb-left">
            <div className="iwb-stage" ref={stageRef}>
              {!live ? (
                <div className="iwb-banner" role="status">
                  <span className="iwb-mono">
                    Viewing <b>{k === 0 ? "original" : `after ${edits[k - 1].id}`}</b>
                    {k > 0 ? ` · ${fmtT(edits[k - 1].t)} UTC` : ""}
                    {k > 0 && edits[k - 1].status === "rejected" ? " · rejected, no change" : ""}
                  </span>
                  <button type="button" onClick={() => setScrub(null)}>
                    Back to live
                  </button>
                </div>
              ) : null}
              <div className={`iwb-page${wide ? " wide" : ""}`}>
                <div className="iwb-sheet">
                  <Crops />
                  <div className="iwb-ruler" aria-hidden="true" />
                  <div className="iwb-doc">
                    <div className="iwb-doc-head">
                      <span className="iwb-mono">Spec 0412 · Support platform</span>
                      <h2>
                        Returns portal – <em>v2</em>
                      </h2>
                      <span className="iwb-mono">Draft 7 · Owner Ada Okafor · Edited 14:02 UTC</span>
                    </div>
                    {SECTIONS.map((sec) => {
                      const text = shown[sec.id]
                      const sug = live ? sugs.find((s) => s.para === sec.id) : undefined
                      const myNotes = notes.filter((n) => n.para === sec.id)
                      return (
                        <div className="iwb-row" key={sec.id}>
                          <div className="iwb-sec">
                            <span className="iwb-mono">§{sec.n}</span>
                            <h3>{sec.title}</h3>
                          </div>
                          <p key={changedPara === sec.id ? `${sec.id}-${k}` : sec.id} className={`iwb-p${myNotes.length && live ? " has-note" : ""}${changedPara === sec.id ? " flash" : ""}`}>
                            {renderPara({ text, sug, live, ada: live && sec.id === ADA_PARA && !sug, quill: live && quillPara === sec.id && !sug, typing: !!active && active.para === sec.id, onAccept: sug ? () => finish(sug, true) : undefined, onReject: sug ? () => finish(sug, false) : undefined })}
                          </p>
                          {myNotes.map((n) => (
                            <div className={`iwb-note${n.resolving ? " resolving" : ""}${live ? "" : " iwb-faded"}`} key={n.id}>
                              <div className="iwb-note-in">
                                <span className="iwb-mono who">Quill · §{sec.n}</span>
                                <q>{n.text}</q>
                                <button type="button" className="iwb-resolve" onClick={() => resolveWhere((x) => x.id === n.id)}>
                                  <Check size={12} strokeWidth={1.5} />
                                  Resolve
                                </button>
                              </div>
                              {wide ? null : null}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p className="iwb-fig iwb-mono">
                  <span>FIG. 1 — Returns portal v2, draft 7{live ? "" : `, as of ${k === 0 ? "start" : edits[k - 1].id}`}</span>
                  <span>
                    {openNotes} open {openNotes === 1 ? "note" : "notes"} · {sugs.length} {sugs.length === 1 ? "suggestion" : "suggestions"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <section className="iwb-tape" aria-label="Session tape">
            <div className="iwb-ph">
              <span className="iwb-mono">Session tape</span>
              <h2>
                Quill’s <em>edits</em>
              </h2>
              <p>Drag the playhead to see the document as it was.</p>
            </div>
            <dl className="iwb-readout">
              <div>
                <dt>Edits</dt>
                <dd>
                  <Num value={N} reduced={reduced} />
                </dd>
              </div>
              <div>
                <dt>Accepted</dt>
                <dd>
                  <Num value={accepted} reduced={reduced} />
                </dd>
              </div>
              <div>
                <dt>Tokens</dt>
                <dd>
                  <Num value={tokens} reduced={reduced} fmt={(n) => `${(n / 1000).toFixed(1)}k`} />
                </dd>
              </div>
            </dl>
            <div className="iwb-scroll">
              <div className="iwb-scan">
                <div className="iwb-scan-in">
                  <div
                    ref={trackRef}
                    className={`iwb-track${drag ? " dragging" : ""}`}
                    style={{ height: PAD * 2 + N * SLOT + 22 }}
                    onPointerDown={(e) => {
                      if ((e.target as HTMLElement).closest(".iwb-edit")) return
                      e.currentTarget.setPointerCapture(e.pointerId)
                      setDrag(true)
                      go(idxFromY(e.clientY))
                    }}
                    onPointerMove={(e) => {
                      if (drag) go(idxFromY(e.clientY))
                    }}
                    onPointerUp={() => setDrag(false)}
                    onPointerCancel={() => setDrag(false)}
                  >
                    <div className="iwb-ticks" style={{ height: N * SLOT }} aria-hidden="true" />
                    {edits.map((e, i) => (
                      <div
                        key={e.id}
                        className={`iwb-edit ${e.status}${i >= k ? " future" : ""}`}
                        style={{ top: PAD + i * SLOT }}
                        role="button"
                        tabIndex={-1}
                        aria-label={`${e.id} ${e.label}, ${e.status}. Scrub to after this edit.`}
                        onClick={() => go(i + 1)}
                      >
                        <span className="t">{fmtT(e.t).slice(0, 5)}</span>
                        <span />
                        <i className="bar" style={{ height: Math.min(24, Math.max(8, 6 + e.dur * 0.7)), animationDelay: `${120 + i * 40}ms` }} />
                        <span className="tx">
                          <b>{e.label}</b>
                          <span>
                            {e.id} · §{e.para.slice(1)} · {e.status}
                          </span>
                        </span>
                      </div>
                    ))}
                    <span className="iwb-now" style={{ top: PAD + N * SLOT + 6 }}>
                      Now {fmtT(edits[N - 1].t + 20).slice(0, 5)} UTC
                    </span>
                    <div className="iwb-play" style={{ transform: `translateY(${PAD + k * SLOT}px)` }}>
                      <i>{live ? "Live" : k === 0 ? "Start" : `After ${edits[k - 1].id}`}</i>
                      <div
                        className="iwb-grab"
                        role="slider"
                        tabIndex={0}
                        aria-label="Playhead"
                        aria-orientation="vertical"
                        aria-valuemin={0}
                        aria-valuemax={N}
                        aria-valuenow={k}
                        aria-valuetext={live ? "Live" : `After edit ${k}`}
                        onKeyDown={onKey}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Shell>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Paragraph render                             */
/* -------------------------------------------------------------------------- */

function renderPara({
  text,
  sug,
  live,
  ada,
  quill,
  typing,
  onAccept,
  onReject,
}: {
  text: string
  sug?: Sug
  live: boolean
  ada: boolean
  quill: boolean
  typing: boolean
  onAccept?: () => void
  onReject?: () => void
}) {
  if (sug) {
    const i = sug.find ? text.indexOf(sug.find) : text.length
    const at = i < 0 ? text.length : i
    const before = text.slice(0, at)
    const after = text.slice(at + (i < 0 ? 0 : sug.find.length))
    return (
      <>
        {before}
        {sug.find && i >= 0 ? <del className="iwb-del">{sug.find}</del> : null}
        <ins className="iwb-ins" style={{ textDecorationLine: "underline" }}>
          {sug.ins.slice(0, sug.typed)}
        </ins>
        <Cursor who="quill" typing={typing} />
        {sug.status === "open" ? (
          <span className="iwb-sa">
            <button type="button" className="acc" onClick={onAccept} aria-label="Accept suggestion">
              <Check size={11} strokeWidth={1.5} />
              Accept
            </button>
            <button type="button" onClick={onReject} aria-label="Reject suggestion">
              <X size={11} strokeWidth={1.5} />
              Reject
            </button>
          </span>
        ) : null}
        {after}
      </>
    )
  }
  if (ada && live) {
    const i = text.indexOf(ADA_AFTER)
    const at = i < 0 ? text.length : i + ADA_AFTER.length
    return (
      <>
        {text.slice(0, at)}
        <Cursor who="ada" />
        {text.slice(at)}
      </>
    )
  }
  return (
    <>
      {text}
      {quill ? <Cursor who="quill" /> : null}
    </>
  )
}

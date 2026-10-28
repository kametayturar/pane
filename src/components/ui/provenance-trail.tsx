"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ProvenanceStep = {
  /** Position of the agent step that retrieved the source, e.g. 3. */
  index: number
  /** Tool or action of that step, e.g. "search". */
  name: string
}

export type ProvenanceSource = {
  id: string
  title: string
  /** Domain-like label under the title. */
  domain: string
  /** Quoted passage from the source. */
  excerpt: string
  /** Phrase inside `excerpt` that supports the claim; highlighted. A claim can override it. */
  match?: string
  /** Retrieval score 0–1, drawn as a mini dither bar. */
  score: number
  /** The step that used this source: "STEP 3 · search". */
  step?: ProvenanceStep
}

export type ProvenanceClaim = {
  /** Id of the source that backs the claim. Leave it out (or use null) for an unsupported claim. */
  sourceId?: string | null
  /** Phrase in the source excerpt this claim rests on (overrides `source.match`). */
  match?: string
  /** Margin note shown for an unsupported claim. */
  note?: string
}

/** Plain text, or text that makes a claim. A "\n\n" inside plain text starts a new paragraph. */
export type ProvenanceSegment = { text: string; claim?: ProvenanceClaim }

export type ProvenanceTrailProps = {
  /** The answer, cut into plain and claim segments. */
  segments?: ProvenanceSegment[]
  sources?: ProvenanceSource[]
  /** The question the answer responds to (serif title). */
  question?: React.ReactNode
  /** Mono label above the question. */
  label?: React.ReactNode
  /** Figure caption under the answer. */
  caption?: React.ReactNode
  /** Overrides the CONFIDENCE readout. Default: mean retrieval score over the supported claims. */
  confidence?: number
  /** Stream the answer in with a typewriter and scan the source cards in as their claims land. */
  autoPlay?: boolean
  /** Typewriter speed in characters per second. */
  speed?: number
  /** Called when a source title is activated (click, or Enter on its claim). */
  onSourceOpen?: (source: ProvenanceSource, claimIndex: number | null) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Example content                              */
/* -------------------------------------------------------------------------- */

export const PROVENANCE_EXAMPLE: { question: React.ReactNode; segments: ProvenanceSegment[]; sources: ProvenanceSource[] } = {
  question: (
    <>
      Why did onboarding conversion drop in <em>March</em>?
    </>
  ),
  sources: [
    {
      id: "funnel",
      title: "Onboarding funnel, weekly cohorts",
      domain: "analytics.harborfinch.example/funnels",
      excerpt: "Signup-to-activation fell from 41.2% (Feb 24 cohort) to 33.9% (Mar 17 cohort). The drop sits at step 3, Connect calendar.",
      match: "fell from 41.2% (Feb 24 cohort) to 33.9%",
      score: 0.94,
      step: { index: 2, name: "query" },
    },
    {
      id: "release",
      title: "Tidemark 5.8 release notes",
      domain: "changelog.tidemark.example/5-8",
      excerpt: "5.8 (Mar 4) replaces one-click sign-in with a permissions screen listing seven calendar scopes.",
      match: "permissions screen listing seven calendar scopes",
      score: 0.93,
      step: { index: 3, name: "search" },
    },
    {
      id: "tickets",
      title: "Support tickets tagged connect-calendar",
      domain: "support.harborfinch.example/tags",
      excerpt: "Tickets tagged connect-calendar rose from 38 a week to 121 after Mar 4. Most ask why full calendar access is needed.",
      match: "rose from 38 a week to 121",
      score: 0.88,
      step: { index: 4, name: "search" },
    },
    {
      id: "forum",
      title: "Why does Tidemark want all my calendars?",
      domain: "forum.tidemark.example/t/2291",
      excerpt: "I stopped at the permissions screen. I only wanted to sync one work calendar, not everything I own.",
      match: "I stopped at the permissions screen",
      score: 0.74,
      step: { index: 5, name: "search" },
    },
    {
      id: "incident",
      title: "Incident 0311: OAuth callback errors",
      domain: "status.tidemark.example/inc-0311",
      excerpt: "From Mar 11 to Mar 13, 6% of calendar connections failed with a callback timeout. Fixed in 5.8.2.",
      match: "6% of calendar connections failed",
      score: 0.82,
      step: { index: 6, name: "fetch" },
    },
    {
      id: "mix",
      title: "Growth review, March 28 minutes",
      domain: "notes.harborfinch.example/growth",
      excerpt: "Pricing page traffic was flat. Paid mix moved toward lower-intent keywords but stayed under 9% of signups.",
      match: "stayed under 9% of signups",
      score: 0.78,
      step: { index: 7, name: "read" },
    },
  ],
  segments: [
    { text: "Activation fell about seven points in March. " },
    { text: "Cohort data shows it dropping from 41.2% to 33.9% between the late-February and mid-March cohorts", claim: { sourceId: "funnel" } },
    { text: ", and " },
    { text: "almost all of the loss is at step 3, where people connect a calendar", claim: { sourceId: "funnel", match: "The drop sits at step 3, Connect calendar" } },
    { text: ".\n\nThe likeliest cause is the 5.8 release. " },
    { text: "On March 4 it replaced one-click sign-in with a screen listing seven calendar permissions", claim: { sourceId: "release" } },
    { text: ". Support noticed within days: " },
    { text: "calendar-connection tickets more than tripled, from 38 to 121 a week", claim: { sourceId: "tickets" } },
    { text: ", and " },
    { text: "users describe abandoning at the permissions screen rather than granting access", claim: { sourceId: "forum" } },
    { text: ".\n\nReliability played a smaller part. " },
    { text: "Between March 11 and 13 about 6% of calendar connections failed with a callback timeout", claim: { sourceId: "incident" } },
    { text: ", " },
    { text: "since fixed in 5.8.2", claim: { sourceId: "incident", match: "Fixed in 5.8.2" } },
    { text: ". " },
    {
      text: "That window alone probably explains less than a quarter of the decline",
      claim: { sourceId: null, note: "Stated without a retrieved source. Treat as the model's inference." },
    },
    { text: ".\n\nTraffic mix does not look responsible: " },
    { text: "paid traffic shifted toward lower-intent keywords but stayed under 9% of signups", claim: { sourceId: "mix" } },
    { text: ". I would confirm the permissions-screen explanation with a rollback test before acting." },
  ],
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ipv {
  --ipv-paper: #fafafa;
  --ipv-sheet: #ffffff;
  --ipv-ink: #0a0a0a;
  --ipv-signal: #0060e2;
  --ipv-accent: var(--ipv-signal);
  --ipv-signal-soft: color-mix(in oklab, var(--ipv-accent) 12%, transparent);
  --ipv-surface: var(--ipv-sheet);
  --ipv-t1: color-mix(in oklab, var(--ipv-ink) 92%, transparent);
  --ipv-t2: color-mix(in oklab, var(--ipv-ink) 64%, transparent);
  --ipv-t3: color-mix(in oklab, var(--ipv-ink) 44%, transparent);
  --ipv-t4: color-mix(in oklab, var(--ipv-ink) 22%, transparent);
  --ipv-rule: color-mix(in oklab, var(--ipv-ink) 14%, transparent);
  --ipv-rule-2: color-mix(in oklab, var(--ipv-ink) 7%, transparent);
  --ipv-ok: #1f8a4c; --ipv-warn: #b7791f; --ipv-bad: #c4321a;
  --ipv-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ipv-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ipv-font: var(--ipv-sans);
  --ipv-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ipv-ease: cubic-bezier(.2, .8, .2, 1);
  --ipv-ease-trace: cubic-bezier(.65, 0, .35, 1);
  position: relative; width: 100%; max-width: 960px; container: ipv / inline-size;
  padding: 20px 24px 18px; background: var(--ipv-surface); border-radius: 4px; box-shadow: 0 0 0 1px var(--ipv-rule);
  font: 13px/20px var(--ipv-font); color: var(--ipv-t1); text-align: left; -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .ipv {
  --ipv-paper: #0c0c0d; --ipv-sheet: #1c1c1e; --ipv-ink: #f5f5f5; --ipv-signal: #4d8dff; --ipv-warn: #d9a043;
}
.ipv *, .ipv *::before, .ipv *::after { box-sizing: border-box }
:where(.ipv) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.ipv :focus-visible { outline: 1px solid var(--ipv-accent); outline-offset: 2px }

.ipv-crop {
  position: absolute; inset: -5px; pointer-events: none; --c: var(--ipv-t4);
  background:
    linear-gradient(var(--c), var(--c)) 0 0 / 8px 1px, linear-gradient(var(--c), var(--c)) 0 0 / 1px 8px,
    linear-gradient(var(--c), var(--c)) 100% 0 / 8px 1px, linear-gradient(var(--c), var(--c)) 100% 0 / 1px 8px,
    linear-gradient(var(--c), var(--c)) 0 100% / 8px 1px, linear-gradient(var(--c), var(--c)) 0 100% / 1px 8px,
    linear-gradient(var(--c), var(--c)) 100% 100% / 8px 1px, linear-gradient(var(--c), var(--c)) 100% 100% / 1px 8px;
  background-repeat: no-repeat;
}
.ipv-card > .ipv-crop { inset: -4px; --c: var(--ipv-rule) }

.ipv-label, .ipv-k, .ipv-cap, .ipv-step, .ipv-note-k {
  font: 500 10.5px/16px var(--ipv-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ipv-t3);
}
.ipv-label { margin: 0; display: flex; align-items: center; gap: 8px }
.ipv-label::before { content: ""; width: 8px; height: 1px; background: var(--ipv-t3) }
.ipv-q { margin: 6px 0 0; font: 400 34px/38px var(--ipv-serif); letter-spacing: -.01em; color: var(--ipv-t1) }
.ipv-q em { font-style: italic }

/* readout row */
.ipv-strip { display: flex; flex-wrap: wrap; margin: 14px 0 22px; border-block: 1px solid var(--ipv-rule) }
.ipv-kv { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 7px 22px 7px 0; margin-right: 22px; border-right: 1px solid var(--ipv-rule) }
.ipv-kv:last-child { margin-right: 0; padding-right: 0; border-right: 0 }
.ipv-v { display: flex; align-items: center; gap: 8px; font: 400 15px/22px var(--ipv-mono); font-variant-numeric: tabular-nums; color: var(--ipv-t1); white-space: nowrap }
.ipv-v small { font-size: 11px; color: var(--ipv-t3) }
.ipv-v[data-warn] { color: var(--ipv-warn) }

/* answer: one block per paragraph, body | margin */
.ipv-doc { position: relative }
.ipv-block { display: grid; grid-template-columns: minmax(0, 1fr) 288px; column-gap: 40px; align-items: start }
.ipv-block + .ipv-block { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--ipv-rule-2) }
.ipv-p { margin: 0; font: 400 15px/26px var(--ipv-sans); color: var(--ipv-t1); text-wrap: pretty }
.ipv-margin { position: relative; display: flex; flex-direction: column; gap: 16px; min-width: 0 }
.ipv-margin::before { content: ""; position: absolute; top: 0; bottom: 0; left: -20px; width: 1px; background: var(--ipv-rule-2) }

.ipv-claim {
  cursor: pointer; border-radius: 1px;
  text-decoration: underline; text-decoration-color: color-mix(in oklab, var(--ipv-ink) 48%, transparent);
  text-decoration-thickness: 1px; text-underline-offset: 4px;
  transition: background-color .2s var(--ipv-ease), text-decoration-color .2s var(--ipv-ease);
}
.ipv-claim[data-gap] { text-decoration-style: dashed; text-decoration-color: var(--ipv-warn) }
.ipv-claim[data-active] { background: var(--ipv-signal-soft); text-decoration-color: var(--ipv-accent) }
.ipv-claim[data-gap][data-active] { background: color-mix(in oklab, var(--ipv-warn) 14%, transparent); text-decoration-color: var(--ipv-warn) }
.ipv-ix { display: inline-block; position: relative; top: -.5em; margin-left: 2px; font: 500 10px/0 var(--ipv-mono); letter-spacing: .02em; color: var(--ipv-t3); transition: color .2s }
.ipv-claim[data-active] .ipv-ix { color: var(--ipv-accent) }
.ipv-claim[data-gap] .ipv-ix { color: var(--ipv-warn) }
.ipv-caret { display: inline-block; width: .55em; height: 1.05em; margin-left: 2px; vertical-align: text-bottom; background: var(--ipv-ink) }

/* specimen cards */
.ipv-card {
  position: relative; padding: 10px 12px 9px; background: var(--ipv-paper); border-radius: 4px;
  box-shadow: 0 0 0 1px var(--ipv-rule); transition: box-shadow .2s var(--ipv-ease);
}
.ipv-card:not([data-shown]), .ipv-note:not([data-shown]) { visibility: hidden }
.ipv-card[data-active] { box-shadow: 0 0 0 1px var(--ipv-accent) }
.ipv-card[data-shown], .ipv-note[data-shown] { animation: ipv-scan .56s var(--ipv-ease) calc(var(--i, 0) * 70ms) backwards }
.ipv-card[data-shown]::after, .ipv-note[data-shown]::after {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--ipv-accent); opacity: 0; pointer-events: none;
  animation: ipv-line .56s var(--ipv-ease) calc(var(--i, 0) * 70ms) backwards;
}
@keyframes ipv-scan { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes ipv-line { 0% { top: 0; opacity: 1 } 80% { opacity: 1 } 100% { top: 100%; opacity: 0 } }

.ipv-card-h { display: flex; align-items: baseline; gap: 8px; min-width: 0 }
.ipv-badge { flex: none; font: 500 11px/18px var(--ipv-mono); color: var(--ipv-t2) }
.ipv-card[data-active] .ipv-badge { color: var(--ipv-accent) }
.ipv-title { display: flex; align-items: flex-start; gap: 4px; min-width: 0; margin: 0; font: 500 13px/18px var(--ipv-sans); color: var(--ipv-t1) }
.ipv-title > span { text-wrap: balance }
.ipv-title svg { flex: none; width: 13px; height: 13px; margin-top: 2.5px; color: var(--ipv-t3) }
button.ipv-title:hover svg { color: var(--ipv-accent) }
.ipv-domain { margin: 1px 0 0 25px; font: 400 10.5px/16px var(--ipv-mono); color: var(--ipv-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ipv-quote { margin: 7px 0 0; padding: 0; font: 400 15.5px/19px var(--ipv-serif); color: var(--ipv-t2) }
.ipv-quote mark {
  color: var(--ipv-t1); background: color-mix(in oklab, var(--ipv-ink) 9%, transparent); box-shadow: inset 0 -1px 0 var(--ipv-t3);
  transition: background-color .2s var(--ipv-ease), box-shadow .2s var(--ipv-ease);
}
.ipv-card[data-active] .ipv-quote mark { background: var(--ipv-signal-soft); box-shadow: inset 0 -1px 0 var(--ipv-accent) }
.ipv-card-f { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 7px; border-top: 1px solid var(--ipv-rule-2) }
.ipv-score { display: inline-flex; align-items: center; gap: 7px; font: 400 11px/16px var(--ipv-mono); font-variant-numeric: tabular-nums; color: var(--ipv-t1) }
.ipv-sd { display: block; width: 48px; height: 9px }

.ipv-note { position: relative; padding: 4px 0 4px 12px; border-left: 1px dashed var(--ipv-warn) }
.ipv-note-k { color: var(--ipv-warn); transition: color .2s }
.ipv-note p { margin: 2px 0 0; font: italic 400 15.5px/19px var(--ipv-serif); color: var(--ipv-t2) }
.ipv-note[data-active] { border-left-style: solid }

/* connector */
.ipv-wires { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 2 }
.ipv-wire { fill: none; stroke: var(--ipv-accent); stroke-width: 1 }
.ipv-wire[data-gap] { stroke: var(--ipv-warn); stroke-dasharray: 3 3 }
.ipv-trace { fill: none; stroke: #fff; stroke-width: 4; stroke-dasharray: 1; stroke-dashoffset: 0; animation: ipv-trace .52s var(--ipv-ease-trace) backwards }
.ipv-end { fill: var(--ipv-accent); animation: ipv-end .2s linear .42s backwards }
.ipv-wires[data-gap] .ipv-end { fill: var(--ipv-warn) }
@keyframes ipv-trace { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes ipv-end { from { opacity: 0 } }

.ipv-cap { margin: 20px 0 0 }
.ipv-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@container ipv (max-width: 719px) {
  .ipv-block { grid-template-columns: minmax(0, 1fr); row-gap: 14px }
  .ipv-margin { gap: 12px }
  .ipv-margin::before { display: none }
  .ipv-q { font-size: 28px; line-height: 32px }
}
@container ipv (max-width: 480px) {
  .ipv-kv { padding-right: 12px; margin-right: 12px }
  .ipv-strip { margin-bottom: 18px }
}
@media (max-width: 480px) { .ipv { padding: 16px 16px 14px } }
@media (prefers-reduced-motion: reduce) {
  .ipv *, .ipv *::before, .ipv *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

type Item = { text: string; start: number; end: number; claim: number | null }
type Para = { items: Item[]; start: number }
type Claim = { k: number; source: ProvenanceSource | null; item: Item; para: number; match?: string; note?: string }

function analyse(segments: ProvenanceSegment[], sources: ProvenanceSource[]) {
  const byId = new Map(sources.map((s) => [s.id, s]))
  const paras: Para[] = [{ items: [], start: 0 }]
  const claims: Claim[] = []
  let pos = 0
  const push = (text: string, claim: number | null) => {
    const para = paras[paras.length - 1]
    if (!para.items.length) para.start = pos
    para.items.push({ text, start: pos, end: pos + text.length, claim })
    pos += text.length
  }
  for (const seg of segments) {
    if (seg.claim) {
      claims.push({
        k: claims.length,
        source: (seg.claim.sourceId && byId.get(seg.claim.sourceId)) || null,
        item: { text: seg.text, start: pos, end: pos + seg.text.length, claim: claims.length },
        para: paras.length - 1,
        match: seg.claim.match,
        note: seg.claim.note,
      })
      push(seg.text, claims.length - 1)
    } else {
      seg.text.split(/\n\n+/).forEach((part, i) => {
        if (i > 0 && paras[paras.length - 1].items.length) paras.push({ items: [], start: pos })
        if (part) push(part, null)
      })
    }
  }
  const live = paras.filter((p) => p.items.length)
  // claims keep their para index from before filtering empty ones; remap
  const remap = new Map(paras.map((p, i) => [i, live.indexOf(p)]))
  claims.forEach((c) => (c.para = remap.get(c.para) ?? 0))
  const number = new Map<string, number>()
  const firstClaim = new Map<string, number>()
  claims.forEach((c) => {
    if (c.source && !number.has(c.source.id)) {
      number.set(c.source.id, number.size + 1)
      firstClaim.set(c.source.id, c.k)
    }
  })
  return { paras: live, claims, number, firstClaim, total: pos }
}

/** Mini dither bar: length and density both follow the score (same encoding as the confidence bar). */
function ScoreDither({ score }: { score: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const cols = 16
      const rows = 3
      const px = 3 * dpr
      canvas.width = Math.round(cols * px)
      canvas.height = Math.round(rows * px)
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--ipv-ink").trim() || "#0a0a0a"
      const dot = Math.max(1, Math.round(px * 0.7))
      const plateau = 0.04 + 0.96 * Math.pow(score, 1.25)
      // 4×4 Bayer thresholds
      const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const on = (c + 0.5) / cols < score
          const d = on ? plateau : 0.1
          if (d <= (bayer[(r & 3) * 4 + (c & 3)] + 0.5) / 16) continue
          ctx.globalAlpha = on ? 0.92 : 0.2
          ctx.fillRect(Math.round(c * px), Math.round(r * px), dot, dot)
        }
      }
    }
    draw()
    const mo = new MutationObserver(draw)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    return () => mo.disconnect()
  }, [score])
  return <canvas ref={ref} className="ipv-sd" aria-hidden="true" />
}

function Excerpt({ text, match }: { text: string; match?: string }) {
  const at = match ? text.toLowerCase().indexOf(match.toLowerCase()) : -1
  if (!match || at < 0) return <>“{text}”</>
  return (
    <>
      “{text.slice(0, at)}
      <mark>{text.slice(at, at + match.length)}</mark>
      {text.slice(at + match.length)}”
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

type Active = { k: number; d: string | null; x: number; y: number }

export function ProvenanceTrail({
  segments,
  sources,
  question,
  label = "Answer",
  caption,
  confidence,
  autoPlay = false,
  speed = 110,
  onSourceOpen,
  className,
}: ProvenanceTrailProps) {
  const example = !segments
  const segs = segments ?? PROVENANCE_EXAMPLE.segments
  const srcs = sources ?? PROVENANCE_EXAMPLE.sources
  const q = question ?? (example ? PROVENANCE_EXAMPLE.question : undefined)

  const model = React.useMemo(() => analyse(segs, srcs), [segs, srcs])
  const { paras, claims, number, firstClaim, total } = model

  const uid = React.useId().replace(/:/g, "")
  const docRef = React.useRef<HTMLDivElement>(null)
  const claimEls = React.useRef(new Map<number, HTMLElement>())
  const targetEls = React.useRef(new Map<string, HTMLElement>())
  const inView = React.useRef(false)
  const [n, setN] = React.useState(() => (autoPlay && !prefersReduced() ? 0 : total))
  const [active, setActive] = React.useState<Active | null>(null)
  const streaming = autoPlay && n < total
  const at = Math.min(n, total)

  // Typewriter: steady pace, only while the answer is on screen.
  React.useEffect(() => {
    if (!autoPlay || prefersReduced() || total === 0) return
    let f = 0
    const id = window.setInterval(() => {
      if (!inView.current) return
      f = Math.min(total, f + speed * 0.03)
      setN(Math.floor(f))
      if (f >= total) window.clearInterval(id)
    }, 30)
    return () => window.clearInterval(id)
  }, [autoPlay, speed, total])

  React.useEffect(() => {
    const el = docRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      inView.current = entries.some((e) => e.isIntersecting)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const doneClaims = claims.filter((c) => at >= c.item.end)
  const supported = doneClaims.filter((c) => c.source)
  const seen = new Set(supported.map((c) => c.source!.id))
  const finished = at >= total
  const mean = supported.length ? supported.reduce((a, c) => a + c.source!.score, 0) / supported.length : null
  const conf = finished && confidence !== undefined ? confidence : mean
  const unsupported = doneClaims.length - supported.length

  const targetKey = (c: Claim) => (c.source ? `card:${c.source.id}` : `note:${c.k}`)

  const activate = (k: number) => {
    const claim = claims[k]
    const el = claimEls.current.get(k)
    const target = targetEls.current.get(targetKey(claim))
    const doc = docRef.current
    if (!el || !target || !doc) return setActive({ k, d: null, x: 0, y: 0 })
    const dr = doc.getBoundingClientRect()
    const rects = el.getClientRects()
    const last = rects[rects.length - 1]
    const tr = target.getBoundingClientRect()
    const x0 = last.right - dr.left + 2
    const y0 = last.bottom - dr.top
    const x1 = tr.left - dr.left
    const y1 = tr.top - dr.top + 21
    // Margin to the right of the text: draw the wire. Stacked below the paragraph (narrow): highlight only.
    if (x1 < x0 + 12) return setActive({ k, d: null, x: 0, y: 0 })
    const gx = x1 - 20
    const dy = y1 - y0
    const r = Math.min(8, Math.abs(dy) / 2)
    const s = dy >= 0 ? 1 : -1
    const d =
      Math.abs(dy) < 1
        ? `M${x0} ${y0}H${x1}`
        : `M${x0} ${y0}H${gx - r}Q${gx} ${y0} ${gx} ${y0 + s * r}V${y1 - s * r}Q${gx} ${y1} ${gx + r} ${y1}H${x1}`
    setActive({ k, d, x: x1, y: y1 })
  }
  const clear = () => setActive(null)

  const activeClaim = active ? claims[active.k] : null
  const open = (c: Claim) => c.source && onSourceOpen?.(c.source, c.k)

  let caretItem: Item | null = null
  if (streaming) for (const p of paras) for (const it of p.items) if (it.start < at && at <= it.end) caretItem = it

  let cardIndex = 0
  return (
    <div className={cn("ipv", className)} aria-busy={streaming || undefined}>
      <style href="provenance-trail" precedence="default">
        {CSS}
      </style>
      <span className="ipv-crop" aria-hidden="true" />
      <p className="ipv-label">{label}</p>
      {q ? <h3 className="ipv-q">{q}</h3> : null}

      <div className="ipv-strip">
        <div className="ipv-kv">
          <span className="ipv-k">Sources</span>
          <span className="ipv-v">{finished ? srcs.length : seen.size}</span>
        </div>
        <div className="ipv-kv">
          <span className="ipv-k">Claims</span>
          <span className="ipv-v">{finished ? claims.length : doneClaims.length}</span>
        </div>
        <div className="ipv-kv">
          <span className="ipv-k">Supported</span>
          <span className="ipv-v" data-warn={unsupported ? "" : undefined}>
            {supported.length}/{doneClaims.length}
          </span>
        </div>
        <div className="ipv-kv">
          <span className="ipv-k">Confidence</span>
          <span className="ipv-v">
            {conf === null ? "–" : conf.toFixed(2)}
            {conf === null ? null : <ScoreDither score={conf} />}
          </span>
        </div>
      </div>

      <div className="ipv-doc" ref={docRef} onKeyDown={(e) => e.key === "Escape" && clear()}>
        {paras.map((para, pi) => {
          if (at <= para.start && at < total && pi > 0) return null
          const marginClaims = claims.filter((c) => c.para === pi && (!c.source || firstClaim.get(c.source.id) === c.k))
          return (
            <div className="ipv-block" key={pi}>
              <p className="ipv-p">
                {para.items.map((it, ii) => {
                  const vis = clamp(at - it.start, 0, it.end - it.start)
                  if (vis <= 0) return null
                  const caret = caretItem === it ? <span className="ipv-caret" aria-hidden="true" /> : null
                  if (it.claim === null) {
                    return (
                      <React.Fragment key={ii}>
                        {it.text.slice(0, vis)}
                        {caret}
                      </React.Fragment>
                    )
                  }
                  const c = claims[it.claim]
                  const done = vis >= it.end - it.start
                  const on = active?.k === c.k
                  return (
                    <React.Fragment key={ii}>
                      <span
                        ref={(el) => {
                          if (el) claimEls.current.set(c.k, el)
                          else claimEls.current.delete(c.k)
                        }}
                        className="ipv-claim"
                        tabIndex={0}
                        role={c.source && onSourceOpen ? "button" : undefined}
                        data-gap={c.source ? undefined : ""}
                        data-active={on ? "" : undefined}
                        aria-describedby={done ? `${uid}-${targetKey(c).replace(":", "-")}` : undefined}
                        onPointerEnter={() => activate(c.k)}
                        onPointerLeave={clear}
                        onFocus={() => activate(c.k)}
                        onBlur={clear}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && c.source && onSourceOpen) {
                            e.preventDefault()
                            open(c)
                          }
                        }}
                      >
                        {it.text.slice(0, vis)}
                        {done ? <sup className="ipv-ix">{c.source ? `[${number.get(c.source.id)}]` : "[?]"}</sup> : null}
                      </span>
                      {caret}
                    </React.Fragment>
                  )
                })}
              </p>
              <aside className="ipv-margin" aria-label="Sources for this paragraph">
                {marginClaims.map((c) => {
                  const shown = at >= c.item.end
                  const i = cardIndex++
                  if (!c.source) {
                    return (
                      <div
                        key={`n${c.k}`}
                        id={`${uid}-note-${c.k}`}
                        ref={(el) => {
                          if (el) targetEls.current.set(`note:${c.k}`, el)
                          else targetEls.current.delete(`note:${c.k}`)
                        }}
                        className="ipv-note"
                        data-shown={shown ? "" : undefined}
                        data-active={active?.k === c.k ? "" : undefined}
                        style={{ "--i": autoPlay ? 0 : i } as React.CSSProperties}
                      >
                        <span className="ipv-note-k">No source</span>
                        <p>{c.note ?? "Stated without a retrieved source. Treat as inference."}</p>
                      </div>
                    )
                  }
                  const s = c.source
                  const isActive = activeClaim?.source?.id === s.id
                  const match = (isActive ? activeClaim?.match : undefined) ?? s.match ?? c.match
                  return (
                    <article
                      key={s.id}
                      id={`${uid}-card-${s.id}`}
                      ref={(el) => {
                        if (el) targetEls.current.set(`card:${s.id}`, el)
                        else targetEls.current.delete(`card:${s.id}`)
                      }}
                      className="ipv-card"
                      data-shown={shown ? "" : undefined}
                      data-active={isActive ? "" : undefined}
                      style={{ "--i": autoPlay ? 0 : i } as React.CSSProperties}
                      onPointerEnter={() => activate(firstClaim.get(s.id) ?? c.k)}
                      onPointerLeave={clear}
                    >
                      <span className="ipv-crop" aria-hidden="true" />
                      <header className="ipv-card-h">
                        <span className="ipv-badge">[{number.get(s.id)}]</span>
                        {onSourceOpen ? (
                          <button type="button" className="ipv-title" onClick={() => onSourceOpen(s, firstClaim.get(s.id) ?? null)} aria-label={`Open source: ${s.title}`}>
                            <span>{s.title}</span>
                            <ArrowUpRight strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        ) : (
                          <h4 className="ipv-title">
                            <span>{s.title}</span>
                          </h4>
                        )}
                      </header>
                      <div className="ipv-domain">{s.domain}</div>
                      <blockquote className="ipv-quote">
                        <Excerpt text={s.excerpt} match={match} />
                      </blockquote>
                      <footer className="ipv-card-f">
                        <span className="ipv-step">{s.step ? `Step ${s.step.index} · ${s.step.name}` : "Retrieved"}</span>
                        <span className="ipv-score">
                          <span className="ipv-sr">Retrieval score</span>
                          <ScoreDither score={s.score} />
                          {s.score.toFixed(2)}
                        </span>
                      </footer>
                    </article>
                  )
                })}
              </aside>
            </div>
          )
        })}

        {active?.d ? (
          <svg key={`${uid}-${active.k}`} className="ipv-wires" aria-hidden="true" data-gap={activeClaim?.source ? undefined : ""}>
            <defs>
              <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="6000" height="12000">
                <path d={active.d} pathLength={1} className="ipv-trace" />
              </mask>
            </defs>
            <path d={active.d} className="ipv-wire" data-gap={activeClaim?.source ? undefined : ""} mask={`url(#${uid}-m)`} />
            <circle cx={active.x} cy={active.y} r="2.5" className="ipv-end" />
          </svg>
        ) : null}
      </div>

      {caption ? <p className="ipv-cap">{caption}</p> : null}
    </div>
  )
}

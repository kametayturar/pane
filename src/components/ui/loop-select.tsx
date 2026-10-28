"use client"

import * as React from "react"
import {
  ArrowUp, AudioLines, Check, Files, FileCode, FileText, Film, FolderOpen, Image as ImageIcon, MessageSquare, PenLine, Presentation, Shapes, Table2, X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/** Decides the little picture on the tile. Inferred from the file extension when left out. */
export type LoopFileKind = "pdf" | "doc" | "sheet" | "slides" | "image" | "audio" | "video" | "code" | "design"

/** One thing that can be circled. */
export type LoopItem = {
  /** Stable id. Selection is reported as a list of these. */
  id: string
  /** File name with extension, "q3-forecast.xlsx". */
  name: string
  kind?: LoopFileKind
  /** Size in kilobytes. When every selected item has one, the chip adds up the total. */
  sizeKb?: number
  /** Short "last edited" text, "Tue". */
  modified?: string
  /** Replaces the generated "412 KB · Tue" line. */
  meta?: string
}

/** What `onAsk` receives when the person sends the question. */
export type LoopAsk = { ids: string[]; items: LoopItem[]; prompt: string }

export type LoopSelectProps = {
  /** The grid contents. Leave out for the Harbor & Finch demo project. */
  items?: LoopItem[]
  /** Folder name in the header. */
  title?: string
  /** Line under the title. Defaults to company and file count. */
  subtitle?: string
  /** Who gets the question, "Atlas". */
  agent?: string
  /** Controlled selection: item ids. */
  selected?: string[]
  /** Initial selection when uncontrolled. */
  defaultSelected?: string[]
  /** Fires on every change, from a loop, a click, the keyboard or Esc. */
  onSelectedChange?: (ids: string[]) => void
  /** The question was sent from the chip's composer. */
  onAsk?: (ask: LoopAsk) => void
  /** What the agent answers after Send: a string, or a function of the question. Defaults to a short summary of the circled files. */
  reply?: string | ((ask: LoopAsk) => string)
  /** With autoPlay: the question typed and sent after the loop lands. On for the demo project only. */
  autoPrompt?: string
  /** Placeholder in the composer. */
  placeholder?: string
  /** Draw one loop by itself the first time the piece scrolls into view, then ask a question. Defaults to on for the demo project only. */
  autoPlay?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const DEMO_ITEMS: LoopItem[] = [
  { id: "forecast", name: "q3-forecast.xlsx", sizeKb: 412, modified: "Tue" },
  { id: "board", name: "board-deck-v4.pdf", sizeKb: 2150, modified: "Mon" },
  { id: "contracts", name: "vendor-contracts.pdf", sizeKb: 1420, modified: "Fri" },
  { id: "invoice", name: "invoice-0417.pdf", sizeKb: 86, modified: "Apr 17" },
  { id: "churn", name: "churn-model.ipynb", sizeKb: 640, modified: "Tue" },
  { id: "pricing", name: "pricing-notes.md", sizeKb: 12, modified: "Wed" },
  { id: "hiring", name: "hiring-plan.csv", sizeKb: 38, modified: "Thu" },
  { id: "roadmap", name: "roadmap-h2.md", sizeKb: 21, modified: "Mon" },
  { id: "calls", name: "customer-call-0912.mp3", sizeKb: 9420, modified: "Sep 12" },
  { id: "onboarding", name: "onboarding-flow.mp4", sizeKb: 41200, modified: "Aug 30" },
  { id: "brand", name: "brand-guide.fig", sizeKb: 5300, modified: "Aug 22" },
  { id: "logos", name: "logo-sheet.png", sizeKb: 980, modified: "Aug 22" },
]

const DEMO_PROMPT = "Where do these disagree on Q4 spend?"

/** What the demo agent "found" in each file. Invented content. */
const DEMO_FINDINGS: Record<string, string> = {
  forecast: "q3-forecast.xlsx books $1.18M of Q4 spend",
  board: "board-deck-v4.pdf says $1.24M",
  contracts: "vendor-contracts.pdf adds $60k that only the deck counts",
  pricing: "pricing-notes.md assumes a 4% uplift in November",
  hiring: "hiring-plan.csv starts three hires in October",
  invoice: "invoice-0417.pdf is a one-off $18k",
  churn: "churn-model.ipynb expects 2.1% logo churn",
  roadmap: "roadmap-h2.md moves the audit work into Q4",
  calls: "customer-call-0912.mp3 has the customer asking twice about annual billing",
  onboarding: "onboarding-flow.mp4 shows setup taking 11 minutes",
  brand: "brand-guide.fig still lists the old logo",
  logos: "logo-sheet.png carries the 2025 mark",
}

function defaultReply(ask: LoopAsk, demo: boolean) {
  const n = ask.items.length
  const found = demo ? ask.ids.map((id) => DEMO_FINDINGS[id]).filter(Boolean).slice(0, 3) : []
  const spend = ask.prompt === DEMO_PROMPT
  if (found.length > 1) return `${spend ? "They disagree:" : "Here is what stands out:"} ${found.slice(0, -1).join(", ")}${found.length > 2 ? "," : ""} and ${found[found.length - 1]}.${spend ? " Reconcile before Friday's close." : ""}`
  if (found.length === 1) return `${found[0]}. I found nothing else on that question in these ${plural(n)}.`
  return `I read ${plural(n)} and found nothing that answers that. Circle more files, or rephrase the question.`
}

const EXT_KIND: Record<string, LoopFileKind> = {
  pdf: "pdf", doc: "doc", docx: "doc", md: "doc", txt: "doc",
  xlsx: "sheet", xls: "sheet", csv: "sheet", numbers: "sheet",
  key: "slides", pptx: "slides", ppt: "slides",
  png: "image", jpg: "image", jpeg: "image", webp: "image", svg: "image", gif: "image",
  mp3: "audio", wav: "audio", m4a: "audio", mp4: "video", mov: "video", webm: "video",
  ipynb: "code", py: "code", ts: "code", tsx: "code", js: "code", json: "code",
  fig: "design", sketch: "design",
}

const extOf = (name: string) => (name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "")
const kindOf = (it: LoopItem): LoopFileKind => it.kind ?? EXT_KIND[extOf(it.name)] ?? "doc"

function fmtSize(kb: number) {
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
}
const metaOf = (it: LoopItem) =>
  it.meta ?? [it.sizeKb != null ? fmtSize(it.sizeKb) : "", it.modified ?? ""].filter(Boolean).join(" · ")
const plural = (n: number) => `${n} ${n === 1 ? "file" : "files"}`
const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

/* -------------------------------------------------------------------------- */
/*                                  Geometry                                  */
/* -------------------------------------------------------------------------- */

type Pt = { x: number; y: number }
type Box = { x0: number; y0: number; x1: number; y1: number }

const f1 = (n: number) => Math.round(n * 10) / 10
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)
const at = (a: Pt[], i: number): Pt => a[((i % a.length) + a.length) % a.length]

/** Ray casting: is `p` inside the polygon (which is closed implicitly)? */
function inPoly(p: Pt, poly: Pt[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function bboxOf(pts: Pt[]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y)
  }
  return { x0, y0, x1, y1 }
}

/** Where two segments cross, as the point and how far along the first one. */
function crossing(a: Pt, b: Pt, c: Pt, d: Pt): { p: Pt; t: number } | null {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y
  const den = rx * sy - ry * sx
  if (Math.abs(den) < 1e-9) return null
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { p: { x: a.x + rx * t, y: a.y + ry * t }, t } : null
}

/** A pen that overshoots its start leaves a tail over the first stroke: cut the loop where the two cross. */
function trimLoop(pts: Pt[]): Pt[] {
  const n = pts.length
  for (let i = 0; i < n - 8; i++) {
    for (let j = n - 2; j > i + 6; j--) {
      const hit = crossing(pts[i], pts[i + 1], pts[j], pts[j + 1])
      if (hit) return [hit.p, ...pts.slice(i + 1, j + 1)]
    }
  }
  // No clean crossing: if the pen came back within a few pixels of its start, drop what it drew after that.
  const span = Math.max(3, Math.floor(n * 0.22))
  let best = 14
  let cut: [number, number] | null = null
  for (let j = n - 1; j >= n - span; j--) {
    for (let i = 0; i < span; i++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
      if (d < best - 0.01 && j - i > 6) {
        best = d
        cut = [i, j]
      }
    }
  }
  return cut ? pts.slice(cut[0], cut[1] + 1) : pts
}

/** `n` points spread evenly by arc length around the closed polygon. */
function resampleClosed(pts: Pt[], n: number): Pt[] {
  const m = pts.length
  const len: number[] = []
  let total = 0
  for (let i = 0; i < m; i++) {
    const a = at(pts, i)
    const b = at(pts, i + 1)
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    len.push(d)
    total += d
  }
  const out: Pt[] = []
  let i = 0
  let run = 0
  for (let k = 0; k < n; k++) {
    const target = (k * total) / n
    while (i < m - 1 && run + len[i] < target) run += len[i++]
    const a = at(pts, i)
    const b = at(pts, i + 1)
    const t = len[i] > 0 ? (target - run) / len[i] : 0
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
  }
  return out
}

/** Taubin smoothing: a shrinking pass followed by an inflating one, so the loop softens without getting smaller. */
function taubin(p: Pt[], iters: number): Pt[] {
  let a = p.map((q) => ({ ...q }))
  const pass = (k: number) => {
    const src = a
    a = src.map((q, i) => {
      const u = at(src, i - 1)
      const v = at(src, i + 1)
      return { x: q.x + k * ((u.x + v.x) / 2 - q.x), y: q.y + k * ((u.y + v.y) / 2 - q.y) }
    })
  }
  for (let i = 0; i < iters; i++) {
    pass(0.5)
    pass(-0.53)
  }
  return a
}

const lerpPts = (a: Pt[], b: Pt[], t: number): Pt[] =>
  a.map((p, i) => ({ x: p.x + (b[i].x - p.x) * t, y: p.y + (b[i].y - p.y) * t }))

/** Closed Catmull-Rom through the points, as cubic beziers. */
function closedPath(p: Pt[]) {
  const n = p.length
  let d = `M${f1(p[0].x)} ${f1(p[0].y)}`
  for (let i = 0; i < n; i++) {
    const p0 = at(p, i - 1), p1 = at(p, i), p2 = at(p, i + 1), p3 = at(p, i + 2)
    d += `C${f1(p1.x + (p2.x - p0.x) / 6)} ${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)} ${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)} ${f1(p2.y)}`
  }
  return d + "Z"
}

/** The open stroke while drawing: midpoint quadratics, so a mouse polyline reads as a smooth pencil line. */
function openPath(p: Pt[]) {
  if (p.length === 1) return `M${f1(p[0].x)} ${f1(p[0].y)}h.01`
  let d = `M${f1(p[0].x)} ${f1(p[0].y)}`
  for (let i = 1; i < p.length - 1; i++) {
    d += `Q${f1(p[i].x)} ${f1(p[i].y)} ${f1((p[i].x + p[i + 1].x) / 2)} ${f1((p[i].y + p[i + 1].y) / 2)}`
  }
  const l = p[p.length - 1]
  return d + `L${f1(l.x)} ${f1(l.y)}`
}

/** Convex hull (monotone chain). */
function hullOf(points: Pt[]): Pt[] {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lo: Pt[] = []
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop()
    lo.push(q)
  }
  const up: Pt[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop()
    up.push(q)
  }
  return lo.slice(0, -1).concat(up.slice(0, -1))
}

/**
 * A hand-drawn loop around some tiles: the padded hull of their corners, rounded into an egg, with a tremor, a slight tilt
 * and a pen that swings wide and cuts across its own start. `others` are tiles that must stay outside.
 */
function eggLoop(targets: Box[], others: Box[]): Pt[] {
  const centre = (b: Box): Pt => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 })
  let base: Pt[] = []
  for (const pad of [10, 7, 4, 1]) {
    const corners = targets.flatMap((b) => [
      { x: b.x0 - pad, y: b.y0 - pad }, { x: b.x1 + pad, y: b.y0 - pad }, { x: b.x1 + pad, y: b.y1 + pad }, { x: b.x0 - pad, y: b.y1 + pad },
    ])
    let h = hullOf(corners)
    // Walk clockwise on screen (y down), starting at the top-most, left-most corner.
    let area = 0
    for (let i = 0; i < h.length; i++) area += h[i].x * at(h, i + 1).y - at(h, i + 1).x * h[i].y
    if (area < 0) h = h.reverse()
    let s0 = 0
    h.forEach((q, i) => {
      if (q.y < h[s0].y - 0.5 || (Math.abs(q.y - h[s0].y) < 0.5 && q.x < h[s0].x)) s0 = i
    })
    h = [...h.slice(s0), ...h.slice(0, s0)]
    base = taubin(resampleClosed(h, 120), 14)
    if (!others.some((o) => inPoly(centre(o), base))) break
  }
  const n = base.length
  const total = n + Math.floor(n * 0.1)
  const c = bboxOf(base)
  const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2
  const tilt = -0.02
  const out: Pt[] = []
  for (let i = 0; i < total; i++) {
    const q = base[i % n]
    const f = i / total
    const dx = q.x - cx, dy = q.y - cy
    const len = Math.hypot(dx, dy) || 1
    // The pen swings wide as it comes back round, then cuts across its own start and ends inside it.
    const u = i > n * 0.92 ? (i - n * 0.92) / (total - n * 0.92) : -1
    const hook = u >= 0 ? 14 - 24 * u : 0
    const w = 6 * Math.sin(f * Math.PI * 2 + 0.6) + 3.5 * Math.sin(f * Math.PI * 4 + 1.9) + 2 * Math.sin(f * Math.PI * 6 + 1.1) + 1.1 * Math.sin(f * Math.PI * 14 + 0.3) + hook
    const x = q.x + (dx / len) * w, y = q.y + (dy / len) * w
    const ox = x - cx, oy = y - cy
    out.push({ x: cx + ox * Math.cos(tilt) - oy * Math.sin(tilt), y: cy + ox * Math.sin(tilt) + oy * Math.cos(tilt) })
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                               Tile pictures                                */
/* -------------------------------------------------------------------------- */

const AUDIO_BARS = [10, 18, 28, 14, 36, 22, 40, 16, 30, 44, 20, 34, 12, 24, 8]

function Thumb({ kind }: { kind: LoopFileKind }) {
  let art: React.ReactNode
  switch (kind) {
    case "pdf":
      art = (
        <>
          <rect x="38" y="8" width="44" height="58" rx="5" className="ils-paper" />
          <rect x="45" y="16" width="20" height="4" rx="2" className="ils-gk" />
          <rect x="45" y="26" width="30" height="2.6" rx="1.3" className="ils-g4" />
          <rect x="45" y="32" width="30" height="2.6" rx="1.3" className="ils-g4" />
          <rect x="45" y="38" width="22" height="2.6" rx="1.3" className="ils-g4" />
          <rect x="45" y="46" width="30" height="13" rx="2.5" className="ils-gt" />
        </>
      )
      break
    case "doc":
      art = (
        <>
          <rect x="38" y="8" width="44" height="58" rx="5" className="ils-paper" />
          <rect x="45" y="16" width="14" height="4" rx="2" className="ils-gk" />
          <circle cx="47" cy="28.5" r="1.6" className="ils-g3" />
          <rect x="52" y="27.2" width="22" height="2.6" rx="1.3" className="ils-g4" />
          <circle cx="47" cy="35.5" r="1.6" className="ils-g3" />
          <rect x="52" y="34.2" width="17" height="2.6" rx="1.3" className="ils-g4" />
          <circle cx="47" cy="42.5" r="1.6" className="ils-g3" />
          <rect x="52" y="41.2" width="22" height="2.6" rx="1.3" className="ils-g4" />
          <rect x="45" y="50" width="26" height="2.6" rx="1.3" className="ils-g4" />
        </>
      )
      break
    case "sheet":
      art = (
        <>
          <rect x="24" y="10" width="72" height="52" rx="5" className="ils-paper" />
          <path d="M24 21v-6a5 5 0 0 1 5-5h62a5 5 0 0 1 5 5v6z" className="ils-gt" />
          <path d="M45 10v52M66 10v52M24 32h72M24 43h72M24 53h72" className="ils-gl" />
          <rect x="29" y="35" width="12" height="3" rx="1.5" className="ils-gk" />
          <rect x="50" y="35" width="9" height="3" rx="1.5" className="ils-g4" />
          <rect x="71" y="35" width="14" height="3" rx="1.5" className="ils-g4" />
          <rect x="29" y="46" width="9" height="3" rx="1.5" className="ils-g4" />
          <rect x="50" y="46" width="13" height="3" rx="1.5" className="ils-gk" />
        </>
      )
      break
    case "slides":
      art = (
        <>
          <rect x="22" y="10" width="76" height="46" rx="5" className="ils-paper" />
          <rect x="29" y="18" width="28" height="4.5" rx="2.2" className="ils-gk" />
          <rect x="29" y="27" width="20" height="3" rx="1.5" className="ils-g4" />
          <rect x="29" y="33" width="24" height="3" rx="1.5" className="ils-g4" />
          <rect x="66" y="38" width="6" height="10" rx="1.5" className="ils-gt" />
          <rect x="75" y="30" width="6" height="18" rx="1.5" className="ils-gk" />
          <rect x="84" y="35" width="6" height="13" rx="1.5" className="ils-gt" />
          <circle cx="54" cy="63" r="1.8" className="ils-g3" />
          <circle cx="60" cy="63" r="1.8" className="ils-g4" />
          <circle cx="66" cy="63" r="1.8" className="ils-g4" />
        </>
      )
      break
    case "image":
      art = (
        <>
          <rect x="22" y="10" width="76" height="52" rx="6" className="ils-paper" />
          <circle cx="43" cy="26" r="5.5" className="ils-gk" />
          <path d="M24 60l22-24 15 16 10-9 25 17z" className="ils-gt" />
          <path d="M24 60l22-24 12 13-8 11z" className="ils-gk" />
        </>
      )
      break
    case "audio":
      art = (
        <>
          {AUDIO_BARS.map((h, i) => (
            <rect key={i} x={24 + i * 5.2} y={36 - h / 2} width="3" height={h} rx="1.5" className={i < 7 ? "ils-gk" : "ils-gt"} />
          ))}
        </>
      )
      break
    case "video":
      art = (
        <>
          <rect x="22" y="10" width="76" height="46" rx="6" className="ils-paper" />
          <circle cx="60" cy="33" r="12" className="ils-gt" />
          <path d="M56 27.5v11l9.5-5.5z" className="ils-gk" />
          <rect x="22" y="62" width="76" height="3" rx="1.5" className="ils-gt" />
          <rect x="22" y="62" width="30" height="3" rx="1.5" className="ils-gk" />
        </>
      )
      break
    case "code":
      art = (
        <>
          <rect x="30" y="8" width="60" height="58" rx="5" className="ils-paper" />
          <rect x="35" y="14" width="50" height="16" rx="3" className="ils-g5" />
          <rect x="39" y="18.5" width="22" height="2.6" rx="1.3" className="ils-gk" />
          <rect x="39" y="23.5" width="32" height="2.6" rx="1.3" className="ils-g4" />
          <rect x="35" y="34" width="50" height="26" rx="3" className="ils-g5" />
          <path d="M40 54l8-6 7 3 9-9 8 4 6-6" className="ils-gks" />
        </>
      )
      break
    case "design":
      art = (
        <>
          <rect x="22" y="10" width="76" height="52" rx="5" className="ils-gs ils-dash" />
          <rect x="30" y="17" width="28" height="28" rx="6" className="ils-gt" />
          <circle cx="70" cy="29" r="14" className="ils-gk" fillOpacity=".55" />
          <path d="M52 55l14-19 14 19z" className="ils-gk" />
        </>
      )
      break
  }
  return (
    <svg viewBox="0 0 120 72" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {art}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const PEN_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="4.6" fill="#fff" stroke="rgba(0,0,0,.55)" stroke-width="1.6"/><circle cx="10" cy="10" r="1.1" fill="rgba(0,0,0,.6)"/></svg>`,
)}") 10 10, crosshair`

const CSS = `
.ils {
  --ils-ink: #000; --ils-surface: #fff; --ils-accent: #0060e2;
  --ils-t1: color-mix(in oklab, var(--ils-ink) 88%, transparent);
  --ils-t2: color-mix(in oklab, var(--ils-ink) 62%, transparent);
  --ils-t3: color-mix(in oklab, var(--ils-ink) 55%, transparent);
  --ils-t4: color-mix(in oklab, var(--ils-ink) 27%, transparent);
  --ils-fill: color-mix(in oklab, var(--ils-ink) 6%, transparent);
  --ils-fill2: color-mix(in oklab, var(--ils-ink) 10%, transparent);
  --ils-line: color-mix(in oklab, var(--ils-ink) 8%, transparent);
  --ils-line2: color-mix(in oklab, var(--ils-ink) 15%, transparent);
  --ils-stroke: var(--ils-accent);
  --ils-lift: 0 18px 40px -26px rgb(0 0 0 / .22);
  --ils-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ils-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .22), 0 2px 4px 0 rgb(0 0 0 / .06);
  --ils-glint: rgb(255 255 255 / .85);
  --ils-ease: cubic-bezier(.22, 1, .36, 1);
  --ils-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  /* File-kind colours: static fallbacks, then hue turns of the accent so Mono and Glass restyle them for free. */
  --ils-k-pdf: #d6453d; --ils-k-sheet: #2b9a5b; --ils-k-slides: #d9822b; --ils-k-image: #0f9fb5; --ils-k-audio: #8a5bd6;
  --ils-k-video: #d2449a; --ils-k-code: var(--ils-accent); --ils-k-design: #b4559c; --ils-k-doc: var(--ils-t2);
  container: ils / inline-size;
  position: relative; display: block; width: 100%; max-width: 720px; margin-inline: auto; text-align: left;
  font: 13px/20px var(--ils-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--ils-t1); -webkit-font-smoothing: antialiased;
}
@supports (color: oklch(from red l c h)) {
  .ils {
    --ils-k-pdf: oklch(from var(--ils-accent) l c calc(h - 231)); --ils-k-sheet: oklch(from var(--ils-accent) l c calc(h - 112));
    --ils-k-slides: oklch(from var(--ils-accent) l c calc(h - 198)); --ils-k-image: oklch(from var(--ils-accent) l c calc(h - 62));
    --ils-k-audio: oklch(from var(--ils-accent) l c calc(h + 40)); --ils-k-video: oklch(from var(--ils-accent) l c calc(h + 88));
    --ils-k-design: oklch(from var(--ils-accent) l c calc(h + 64));
  }
}
:is(.dark, [data-theme="dark"]) .ils {
  --ils-ink: #fff; --ils-surface: #1c1c1e; --ils-accent: #4d8dff;
  --ils-t1: color-mix(in oklab, var(--ils-ink) 90%, transparent);
  --ils-t2: color-mix(in oklab, var(--ils-ink) 64%, transparent);
  --ils-t3: color-mix(in oklab, var(--ils-ink) 52%, transparent);
  --ils-t4: color-mix(in oklab, var(--ils-ink) 28%, transparent);
  --ils-fill: color-mix(in oklab, var(--ils-ink) 8%, transparent);
  --ils-fill2: color-mix(in oklab, var(--ils-ink) 13%, transparent);
  --ils-line: color-mix(in oklab, var(--ils-ink) 10%, transparent);
  --ils-line2: color-mix(in oklab, var(--ils-ink) 18%, transparent);
  --ils-stroke: color-mix(in oklab, var(--ils-accent) 80%, #fff);
  --ils-lift: 0 18px 40px -22px rgb(0 0 0 / .7);
  --ils-shadow: 0 0 0 .5px rgb(255 255 255 / .14), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ils-float: 0 0 0 .5px rgb(255 255 255 / .16), 0 12px 28px -10px rgb(0 0 0 / .7), 0 2px 4px 0 rgb(0 0 0 / .4);
  --ils-glint: rgb(255 255 255 / .9);
  --ils-k-pdf: #ff7a70; --ils-k-sheet: #4cc786; --ils-k-slides: #ffaa55; --ils-k-image: #3ccbe0; --ils-k-audio: #b393ff;
  --ils-k-video: #ff7ac0; --ils-k-design: #e08ad0;
}
@supports (color: oklch(from red l c h)) {
  :is(.dark, [data-theme="dark"]) .ils {
    --ils-k-pdf: oklch(from var(--ils-accent) calc(l + .08) c calc(h - 231)); --ils-k-sheet: oklch(from var(--ils-accent) calc(l + .08) c calc(h - 112));
    --ils-k-slides: oklch(from var(--ils-accent) calc(l + .08) c calc(h - 198)); --ils-k-image: oklch(from var(--ils-accent) calc(l + .08) c calc(h - 62));
    --ils-k-audio: oklch(from var(--ils-accent) calc(l + .08) c calc(h + 40)); --ils-k-video: oklch(from var(--ils-accent) calc(l + .08) c calc(h + 88));
    --ils-k-design: oklch(from var(--ils-accent) calc(l + .08) c calc(h + 64));
  }
}
.ils *, .ils *::before, .ils *::after { box-sizing: border-box }
:where(.ils) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.ils) input { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; outline: 0 }
:where(.ils) p { margin: 0 }
:where(.ils) ul { list-style: none; margin: 0; padding: 0 }
.ils :focus-visible { outline: 2px solid color-mix(in oklab, var(--ils-accent) 60%, transparent); outline-offset: 1px }
.ils-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
.ils [data-k="pdf"] { --ils-k: var(--ils-k-pdf) } .ils [data-k="sheet"] { --ils-k: var(--ils-k-sheet) } .ils [data-k="slides"] { --ils-k: var(--ils-k-slides) }
.ils [data-k="image"] { --ils-k: var(--ils-k-image) } .ils [data-k="audio"] { --ils-k: var(--ils-k-audio) } .ils [data-k="video"] { --ils-k: var(--ils-k-video) }
.ils [data-k="code"] { --ils-k: var(--ils-k-code) } .ils [data-k="design"] { --ils-k: var(--ils-k-design) } .ils [data-k="doc"] { --ils-k: var(--ils-k-doc) }

/* ---- card ---- */
.ils-card { position: relative; border-radius: 22px; background: var(--ils-surface); box-shadow: var(--ils-shadow), var(--ils-lift); padding-bottom: 2px }
.ils-head { display: flex; align-items: center; gap: 11px; padding: 14px 14px 12px 16px }
.ils-head > * { animation: ils-in .5s var(--ils-ease) backwards }
.ils-head > :nth-child(2) { animation-delay: .05s }
.ils-head > :nth-child(3) { animation-delay: .1s }
.ils-logo { flex: none; width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; color: var(--ils-accent);
  background: color-mix(in oklab, var(--ils-accent) 12%, transparent); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--ils-accent) 22%, transparent) }
.ils-logo svg { width: 17px; height: 17px }
.ils-titles { flex: 1 1 auto; min-width: 0 }
.ils-title { font-size: 15px; line-height: 20px; font-weight: 500; letter-spacing: -.005em; color: var(--ils-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ils-sub { font-size: 12.5px; line-height: 18px; color: var(--ils-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ils-pen { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px 0 9px; border-radius: 8px; font-size: 12.5px; font-weight: 500;
  color: var(--ils-t2); background: var(--ils-fill); transition: background-color .25s var(--ils-ease), color .25s var(--ils-ease), transform .2s var(--ils-ease) }
.ils-pen:hover { background: var(--ils-fill2) }
.ils-pen:active { transform: scale(.97) }
.ils-pen svg { width: 14px; height: 14px }
.ils-pen[aria-pressed="true"] { color: var(--ils-accent); background: color-mix(in oklab, var(--ils-accent) 11%, transparent) }

/* ---- stage ---- */
.ils-stage { position: relative; margin: 0 10px; padding: 12px; border-radius: 16px; background: color-mix(in oklab, var(--ils-ink) 3.5%, transparent);
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: pan-y }
.ils-stage[data-draw] { touch-action: none; cursor: ${PEN_CURSOR} }
.ils-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px }
@container ils (min-width: 440px) { .ils-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) } }
@container ils (min-width: 640px) { .ils-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) } }

.ils-tile { position: relative; display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: 6px 6px 9px; border-radius: 12px;
  background: var(--ils-surface); box-shadow: var(--ils-shadow); outline: none; animation: ils-in .55s var(--ils-ease) backwards; animation-delay: calc(var(--ils-i, 0) * 28ms + .12s);
  transition: box-shadow .3s var(--ils-ease) }
.ils-tile::after { content: ""; position: absolute; inset: -1px; border-radius: 13px; border: 1.5px dashed transparent; pointer-events: none;
  transition: border-color .25s var(--ils-ease), opacity .25s var(--ils-ease) }
.ils-tile[data-hot]::after { border-color: color-mix(in oklab, var(--ils-accent) 65%, transparent) }
.ils-tile[aria-selected="true"]::after { border-style: solid; border-color: var(--ils-accent) }
.ils-stage[data-drawing] .ils-tile[aria-selected="true"]:not([data-hot])::after { opacity: .3 }
.ils-stage[data-drawing] .ils-tile[aria-selected="true"]:not([data-hot]) .ils-check { opacity: .3 }
.ils-tile:focus-visible { outline: 2px solid color-mix(in oklab, var(--ils-accent) 60%, transparent); outline-offset: 3px }
.ils-thumb { position: relative; height: 76px; border-radius: 8px; display: grid; place-items: center; overflow: hidden;
  background: color-mix(in oklab, var(--ils-k, var(--ils-ink)) 9%, var(--ils-fill)); transition: background-color .35s var(--ils-ease) }
.ils-thumb svg { width: 100%; height: 100%; display: block }
.ils-tile[aria-selected="true"] .ils-thumb { background: color-mix(in oklab, var(--ils-accent) 11%, var(--ils-surface)) }
.ils-ext { position: absolute; left: 6px; top: 6px; height: 16px; padding: 0 5px; border-radius: 5px; font: 600 9px/16px var(--ils-mono); letter-spacing: .05em; text-transform: uppercase;
  color: color-mix(in oklab, var(--ils-k, var(--ils-t2)) 82%, var(--ils-ink)); background: color-mix(in oklab, var(--ils-k, var(--ils-ink)) 14%, var(--ils-surface)) }
.ils-name { padding: 0 4px; font-size: 12.5px; line-height: 17px; font-weight: 500; color: var(--ils-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ils-meta { padding: 0 4px; margin-top: -4px; font-size: 12px; line-height: 16px; color: var(--ils-t3); font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ils-check { position: absolute; top: 6px; right: 6px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; color: var(--ils-surface); background: var(--ils-accent);
  box-shadow: 0 0 0 1.5px var(--ils-surface); opacity: 0; transform: scale(.55); filter: blur(2px);
  transition: opacity .2s var(--ils-ease), transform .2s var(--ils-ease), filter .2s var(--ils-ease) }
.ils-check svg { width: 11px; height: 11px }
.ils-tile[aria-selected="true"] .ils-check { opacity: 1; transform: none; filter: none; transition-duration: .42s; transition-delay: var(--ils-d, 0ms) }

/* ---- tile picture classes ---- */
.ils-paper { fill: var(--ils-surface); stroke: var(--ils-line2); stroke-width: 1 }
.ils-g2 { fill: var(--ils-t2) } .ils-g3 { fill: var(--ils-t3) } .ils-g4 { fill: var(--ils-t4) } .ils-g5 { fill: var(--ils-fill2) }
.ils-gk { fill: var(--ils-k, var(--ils-t2)) }
.ils-gt { fill: color-mix(in oklab, var(--ils-k, var(--ils-ink)) 26%, var(--ils-surface)) }
.ils-gl { fill: none; stroke: var(--ils-line2); stroke-width: 1 }
.ils-gs { fill: none; stroke: var(--ils-t3); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round }
.ils-gks { fill: none; stroke: var(--ils-k, var(--ils-t3)); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round }
.ils-dash { stroke: var(--ils-t4); stroke-width: 1; stroke-dasharray: 3 3 }

/* ---- the ink layer: the loop you draw, then the soft outline it settles into ---- */
.ils-ink { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 2 }
.ils-loop { fill: var(--ils-accent); fill-opacity: 0; stroke: var(--ils-stroke); stroke-linecap: round; stroke-linejoin: round; stroke-width: 3.4; stroke-opacity: .92; opacity: 0;
  transition: opacity .4s var(--ils-ease), stroke-width .26s var(--ils-ease), stroke-opacity .26s var(--ils-ease), fill-opacity .45s var(--ils-ease) }
.ils-ink[data-phase="drawing"] .ils-loop { opacity: 1; fill-opacity: .05; transition: none }
.ils-ink[data-phase="settled"] .ils-loop { opacity: 1; stroke-width: 1.9; stroke-opacity: .75; fill-opacity: .07;
  filter: drop-shadow(0 0 6px color-mix(in oklab, var(--ils-stroke) 45%, transparent)) }
.ils-guide { fill: none; stroke: var(--ils-stroke); stroke-width: 1.5; stroke-linecap: round; stroke-dasharray: 1 6; opacity: 0 }
.ils-ink[data-phase="drawing"] .ils-guide { opacity: .45 }
.ils-tipg { opacity: 0; transition: opacity .2s var(--ils-ease) }
.ils-ink[data-phase="drawing"][data-pen] .ils-tipg { opacity: 1 }
.ils-tip-glow { fill: var(--ils-accent); fill-opacity: .16 }
.ils-tip-dot { fill: #fff; stroke: var(--ils-stroke); stroke-width: 2; filter: drop-shadow(0 1px 2px rgb(0 0 0 / .3)) }
.ils-tip-core { fill: var(--ils-stroke) }

/* ---- the dock: the row under the grid where the chip lives, so it never covers a file ---- */
.ils-dock { position: sticky; bottom: 10px; z-index: 4; display: flex; justify-content: center; align-items: flex-end; height: 0; pointer-events: none;
  transition: height .44s var(--ils-ease) }
.ils-dock[data-open] { height: var(--ils-dock-h, 0px) }
.ils-chip { position: relative; flex: none; pointer-events: auto; border-radius: 18px; background: var(--ils-surface); box-shadow: var(--ils-float); overflow: hidden;
  transform-origin: 50% 100%; scale: .94; opacity: 0; visibility: hidden; filter: blur(3px);
  transition: width .44s var(--ils-ease), height .44s var(--ils-ease), border-radius .44s var(--ils-ease), scale .4s var(--ils-ease), opacity .26s var(--ils-ease), filter .26s var(--ils-ease), visibility 0s .26s }
.ils-chip[data-open] { scale: 1; opacity: 1; visibility: visible; filter: none; transition-delay: 0s }
.ils-chip[data-mode="sent"] { border-radius: 16px }
.ils-chip[data-snap] { transition: none !important }
.ils-chip :focus-visible { outline-offset: -2px }
.ils-face { position: absolute; left: 0; top: 0; display: flex; align-items: center; white-space: nowrap; width: max-content;
  opacity: 0; filter: blur(5px); visibility: hidden; transition: opacity .22s var(--ils-ease), filter .22s var(--ils-ease), visibility 0s .22s }
.ils-face[data-on] { opacity: 1; filter: none; visibility: visible; transition-delay: .1s, .1s, 0s }
.ils-face--chip { height: 40px; padding: 0 5px 0 9px; gap: 9px }
.ils-face--ask { height: 44px; padding: 0 6px 0 14px; gap: 9px; width: min(360px, calc(100cqw - 56px)) }
.ils-face--sent { flex-direction: column; align-items: stretch; gap: 8px; white-space: normal; padding: 11px 8px 14px 12px; width: min(440px, calc(100cqw - 56px)) }
.ils-stack { display: flex; padding-left: 6px }
.ils-mini { flex: none; width: 22px; height: 22px; margin-left: -6px; border-radius: 7px; display: grid; place-items: center; color: var(--ils-k, var(--ils-t2));
  background: color-mix(in oklab, var(--ils-k, var(--ils-ink)) 15%, var(--ils-surface)); box-shadow: 0 0 0 1.5px var(--ils-surface); animation: ils-drop .5s var(--ils-ease) backwards; animation-delay: calc(var(--ils-j, 0) * 70ms + .05s) }
.ils-mini svg { width: 12px; height: 12px }
.ils-count { font-weight: 500; color: var(--ils-t1); font-variant-numeric: tabular-nums }
.ils-n { display: inline-block; animation: ils-roll .46s var(--ils-ease) backwards }
.ils-sep { width: 1px; height: 14px; background: var(--ils-line2) }
.ils-ask { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px 0 9px; border-radius: 14px; font-size: 12.5px; font-weight: 500; color: var(--ils-accent);
  background: color-mix(in oklab, var(--ils-accent) 11%, transparent); transition: background-color .2s var(--ils-ease), transform .2s var(--ils-ease) }
.ils-ask:hover { background: color-mix(in oklab, var(--ils-accent) 18%, transparent) }
.ils-ask:active { transform: scale(.97) }
.ils-ask svg { width: 14px; height: 14px }
.ils-x { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: var(--ils-t3); transition: background-color .2s var(--ils-ease), color .2s var(--ils-ease) }
.ils-x:hover { background: var(--ils-fill); color: var(--ils-t1) }
.ils-x svg { width: 14px; height: 14px }
.ils-ask-ic { flex: none; width: 15px; height: 15px; color: var(--ils-t3) }
.ils-ask-count { flex: none; color: var(--ils-t2); font-weight: 500; font-variant-numeric: tabular-nums }
.ils-ask-size { color: var(--ils-t3); font-weight: 400 }
.ils-input { flex: 1 1 auto; min-width: 0; height: 32px; font-size: 13px; color: var(--ils-t1); text-overflow: ellipsis }
.ils-input::placeholder { color: var(--ils-t3); text-overflow: ellipsis }
.ils .ils-input:focus-visible { outline: none }
.ils-chip:has(.ils-input:focus-visible) { box-shadow: var(--ils-float), 0 0 0 2px color-mix(in oklab, var(--ils-accent) 45%, transparent) }
.ils-send { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--ils-surface); background: var(--ils-accent);
  transition: opacity .25s var(--ils-ease), transform .2s var(--ils-ease), background-color .25s var(--ils-ease), color .25s var(--ils-ease) }
.ils-send:active { transform: scale(.94) }
.ils-send[aria-disabled="true"] { background: color-mix(in oklab, var(--ils-accent) 14%, transparent); color: color-mix(in oklab, var(--ils-accent) 60%, transparent); cursor: default }
.ils-send svg { width: 15px; height: 15px }

/* sent: what was asked, then what came back */
.ils-s-head { display: flex; align-items: center; gap: 9px; min-height: 28px }
.ils-s-title { flex: 1 1 auto; min-width: 0; display: grid; font-weight: 500; color: var(--ils-t1) }
.ils-s-title > * { grid-area: 1 / 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ils-s-title b { font-weight: 500 }
.ils-r1 { position: relative; animation: ils-hide .25s var(--ils-ease) .85s forwards }
.ils-r1::after { content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, var(--ils-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: ils-sweep .8s linear }
.ils-r2 { animation: ils-in .4s var(--ils-ease) .85s backwards }
.ils-s-size { color: var(--ils-t3); font-weight: 400 }
.ils-s-q { padding: 0 2px; color: var(--ils-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ils-s-reply { position: relative; min-height: 20px; padding: 9px 6px 0 2px; color: var(--ils-t1); border-top: 1px solid var(--ils-line); margin-right: 4px }
.ils-w { display: inline-block; animation: ils-in .42s var(--ils-ease) backwards; animation-delay: var(--ils-wd, 0ms) }
.ils-dots { position: absolute; left: 2px; top: 19px; display: flex; gap: 4px; animation: ils-hide .2s var(--ils-ease) .45s forwards }
.ils-dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--ils-t3); animation: ils-dot .9s ease-in-out infinite }
.ils-dots i:nth-child(2) { animation-delay: .12s } .ils-dots i:nth-child(3) { animation-delay: .24s }

/* ---- footer ---- */
.ils-foot { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px 14px }
.ils-line { min-height: 20px; font-size: 13px; color: var(--ils-t2) }
.ils-line b { font-weight: 500; color: var(--ils-t1) }
.ils-line .ils-hl { color: var(--ils-accent) }
.ils-swap { display: block; animation: ils-swap .42s var(--ils-ease) backwards }
.ils-keys { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 12px; line-height: 18px; color: var(--ils-t3) }
.ils-keys > span, .ils-keys-more > span { display: inline-flex; align-items: center; gap: 4px }
.ils-keys-more { display: flex; flex-wrap: wrap; gap: 6px 14px; position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
.ils-card:has(:focus-visible) .ils-keys-more, .ils-keys:hover .ils-keys-more { position: static; width: auto; height: auto; overflow: visible; clip: auto; white-space: normal }
.ils-kbd { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 5px; background: var(--ils-fill);
  box-shadow: inset 0 -1px 0 var(--ils-line); font: 500 10.5px/1 var(--ils-mono); color: var(--ils-t2) }
@container ils (max-width: 399px) {
  .ils-pen { padding: 0 9px } .ils-pen-t { display: none }
  .ils-ask-size, .ils-ask-ic, .ils-stack-c, .ils-s-size, .ils-s-head .ils-mini:nth-child(n+4) { display: none }
}
@media (pointer: coarse) { .ils-keys-more { display: none } }

@keyframes ils-in { from { opacity: 0; transform: translateY(5px); filter: blur(3px) } }
@keyframes ils-drop { from { opacity: 0; transform: translateY(-9px) scale(.85); filter: blur(2px) } }
@keyframes ils-swap { from { opacity: 0; filter: blur(10px) } }
@keyframes ils-roll { from { opacity: 0; transform: translateY(70%); filter: blur(3px) } }
@keyframes ils-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes ils-hide { to { opacity: 0; filter: blur(4px) } }
@keyframes ils-dot { 0%, 100% { opacity: .3; transform: translateY(0) } 50% { opacity: 1; transform: translateY(-2px) } }
@media (prefers-reduced-motion: reduce) {
  .ils *, .ils *::before, .ils *::after { animation: none !important; transition: none !important }
  .ils-r1, .ils-dots { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type Mode = "chip" | "ask" | "sent"
type Phase = "idle" | "drawing" | "settled"
type Dir = "left" | "right" | "up" | "down"
type Down = {
  id: string | null
  x: number
  y: number
  additive: boolean
  touch: boolean
  drawing: boolean
  pts: Pt[]
  pointer: number
}

const KIND_ICON: Record<LoopFileKind, LucideIcon> = {
  pdf: FileText, doc: FileText, sheet: Table2, slides: Presentation, image: ImageIcon, audio: AudioLines, video: Film, code: FileCode, design: Shapes,
}

const SMOOTH_POINTS = 72
const MORPH_MS = 240
const AUTO_MS = 1000
const MAX_STROKE_POINTS = 500

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function subscribeCoarse(cb: () => void) {
  const mq = window.matchMedia("(pointer: coarse)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const getCoarse = () => window.matchMedia("(pointer: coarse)").matches
const getCoarseServer = () => false

function Mini({ it, j }: { it: LoopItem; j: number }) {
  const kind = kindOf(it)
  const Icon = KIND_ICON[kind]
  return (
    <span className="ils-mini" data-k={kind} style={{ "--ils-j": j } as React.CSSProperties} aria-hidden="true">
      <Icon />
    </span>
  )
}

/**
 * Circle files to select them. A freehand grease-pencil stroke smooths into a soft outline on release,
 * everything inside is selected, and a docked chip offers to ask an agent about exactly those files.
 */
export function LoopSelect({
  items: itemsProp,
  title = "Q3 close",
  subtitle,
  agent = "Atlas",
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  onAsk,
  reply,
  autoPrompt: autoPromptProp,
  placeholder,
  autoPlay,
  className,
}: LoopSelectProps) {
  const items = itemsProp ?? DEMO_ITEMS
  const isDemo = itemsProp === undefined
  const auto = autoPlay ?? isDemo
  const autoPrompt = autoPromptProp ?? (isDemo ? DEMO_PROMPT : undefined)
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const filterId = `ilsf${uid}`
  const hintId = `ilsh${uid}`

  const [inner, setInner] = React.useState<string[]>(defaultSelected ?? [])
  const selected = selectedProp ?? inner
  const selKey = selected.join("|")
  const [shown, setShown] = React.useState<string[]>(selected)
  if (selected.length > 0 && !sameIds(selected, shown)) setShown(selected)

  const [phase, setPhase] = React.useState<Phase>("idle")
  const [loopKey, setLoopKey] = React.useState("")
  const [pen, setPen] = React.useState(false)
  const [hot, setHot] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<Mode>("chip")
  const [prompt, setPrompt] = React.useState("")
  const [sent, setSent] = React.useState<{ prompt: string; reply: string; key: string } | null>(null)
  const [active, setActive] = React.useState<string | null>(null)
  const [say, setSay] = React.useState("")
  const coarse = React.useSyncExternalStore(subscribeCoarse, getCoarse, getCoarseServer)
  const [drawOverride, setDrawOverride] = React.useState<boolean | null>(null)
  const drawMode = drawOverride ?? !coarse

  // A selection changed from outside (controlled use) can leave an old composer or reply open: start from the chip again.
  const [seenKey, setSeenKey] = React.useState(selKey)
  if (seenKey !== selKey) {
    setSeenKey(selKey)
    if (selKey === "" || (mode === "sent" && sent?.key !== selKey)) setMode("chip")
  }

  const rootRef = React.useRef<HTMLDivElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const dockRef = React.useRef<HTMLDivElement>(null)
  const loopRef = React.useRef<SVGPathElement>(null)
  const guideRef = React.useRef<SVGPathElement>(null)
  const tipRef = React.useRef<SVGGElement>(null)
  const chipRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const askBtnRef = React.useRef<HTMLButtonElement>(null)
  const doneBtnRef = React.useRef<HTMLButtonElement>(null)
  const faceRefs = React.useRef<Record<Mode, HTMLElement | null>>({ chip: null, ask: null, sent: null })
  const tileEls = React.useRef(new Map<string, HTMLElement>())

  const selRef = React.useRef(selected)
  const itemsRef = React.useRef(items)
  const modeRef = React.useRef(mode)
  const propsRef = React.useRef({ selectedProp, onSelectedChange, onAsk, reply, isDemo })
  const downRef = React.useRef<Down | null>(null)
  const rectsRef = React.useRef(new Map<string, Box>())
  const hotKey = React.useRef("")
  const loopBox = React.useRef<Box | null>(null)
  const chipSize = React.useRef({ w: 0, h: 0 })
  const wasOpen = React.useRef(false)
  const stageW = React.useRef(0)
  const rafs = React.useRef<{ morph: number; auto: number }>({ morph: 0, auto: 0 })
  const timers = React.useRef<number[]>([])
  const autoState = React.useRef<"waiting" | "running" | "done">("waiting")
  const autoStage = React.useRef<"stroke" | "after">("stroke")
  const prevMode = React.useRef<Mode>("chip")
  const restoreFocus = React.useRef<"ask" | "done" | null>(null)
  const sayFlip = React.useRef(false)

  React.useLayoutEffect(() => {
    selRef.current = selected
    itemsRef.current = items
    modeRef.current = mode
    propsRef.current = { selectedProp, onSelectedChange, onAsk, reply, isDemo }
  })

  /* ---------------------------- measuring ---------------------------- */

  /** Tile boxes in stage coordinates. Uses layout offsets, so an entrance animation in flight cannot skew them. */
  function measure() {
    const m = new Map<string, Box>()
    tileEls.current.forEach((el, id) => {
      m.set(id, { x0: el.offsetLeft, y0: el.offsetTop, x1: el.offsetLeft + el.offsetWidth, y1: el.offsetTop + el.offsetHeight })
    })
    rectsRef.current = m
    return m
  }

  function insideOf(poly: Pt[]) {
    const out: string[] = []
    for (const it of itemsRef.current) {
      const r = rectsRef.current.get(it.id)
      if (r && inPoly({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 }, poly)) out.push(it.id)
    }
    return out
  }

  /** Sizes the chip to its active face and the dock to the chip. Both glide through CSS transitions. */
  function measureChip(snap: boolean) {
    const chip = chipRef.current
    const dock = dockRef.current
    const face = faceRefs.current[modeRef.current]
    if (!chip || !face) return
    const w = face.offsetWidth
    const h = face.offsetHeight
    if (!w || !h) return
    chipSize.current = { w, h }
    if (snap) chip.dataset.snap = "1"
    chip.style.width = `${w}px`
    chip.style.height = `${h}px`
    dock?.style.setProperty("--ils-dock-h", `${h + 10}px`)
    if (snap) {
      void chip.offsetWidth
      delete chip.dataset.snap
    }
  }

  /** The chip drops from under the loop into its dock. */
  function glideChip() {
    const chip = chipRef.current
    const stage = stageRef.current
    const grid = gridRef.current
    const lb = loopBox.current
    if (!chip || !stage || !grid || !lb || reducedMotion() || typeof chip.animate !== "function") return
    const finalTop = grid.offsetTop + grid.offsetHeight + 10
    const dx = clamp((lb.x0 + lb.x1) / 2 - stage.clientWidth / 2, -260, 260)
    const dy = clamp(lb.y1 - finalTop, -220, 0)
    chip.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0px 0px" }], { duration: 640, easing: "cubic-bezier(.22, 1, .36, 1)" })
  }

  /* --------------------------- selection core --------------------------- */

  function announce(message: string) {
    sayFlip.current = !sayFlip.current
    // The invisible suffix makes a repeated message count as a change, so it is read again.
    setSay(message + (sayFlip.current ? "​" : ""))
  }

  function commit(next: string[], keepLoop = false, quiet = false) {
    const p = propsRef.current
    if (p.selectedProp === undefined) setInner(next)
    p.onSelectedChange?.(next)
    if (!keepLoop) {
      loopBox.current = null
      setPhase((ph) => (ph === "drawing" ? ph : "idle"))
    }
    setMode((m) => (next.length === 0 || m === "sent" ? "chip" : m))
    if (!quiet) announce(next.length === 0 ? "Selection cleared" : `${plural(next.length)} selected`)
  }

  function focusTile(id: string, quiet = false) {
    setActive(id)
    tileEls.current.get(id)?.focus({ preventScroll: quiet })
  }

  function neighbor(id: string, dir: Dir): string | null {
    const cur = tileEls.current.get(id)?.getBoundingClientRect()
    if (!cur) return null
    const cx = (cur.left + cur.right) / 2
    const cy = (cur.top + cur.bottom) / 2
    let best: string | null = null
    let bestScore = Infinity
    tileEls.current.forEach((el, other) => {
      if (other === id) return
      const r = el.getBoundingClientRect()
      const dx = (r.left + r.right) / 2 - cx
      const dy = (r.top + r.bottom) / 2 - cy
      const horizontal = dir === "left" || dir === "right"
      const along = horizontal ? (dir === "right" ? dx : -dx) : dir === "down" ? dy : -dy
      const across = Math.abs(horizontal ? dy : dx)
      if (along < 4 || (horizontal && across > cur.height / 2)) return
      const score = along + across * 3
      if (score < bestScore) {
        bestScore = score
        best = other
      }
    })
    return best
  }

  /* ------------------------------ the stroke ------------------------------ */

  function paintStroke(pts: Pt[]) {
    loopRef.current?.setAttribute("d", openPath(pts))
    const a = pts[0]
    const b = pts[pts.length - 1]
    guideRef.current?.setAttribute("d", `M${f1(b.x)} ${f1(b.y)}L${f1(a.x)} ${f1(a.y)}`)
    tipRef.current?.setAttribute("transform", `translate(${f1(b.x)} ${f1(b.y)})`)
    if (pts.length > 3) {
      const inside = insideOf(pts)
      const key = inside.join("|")
      if (key !== hotKey.current) {
        hotKey.current = key
        setHot(inside)
      }
    }
  }

  function beginStroke(first: Pt) {
    cancelMorph()
    loopBox.current = null
    hotKey.current = ""
    paintStroke([first])
    setPhase("drawing")
  }

  function cancelStroke(message?: string) {
    cancelMorph()
    downRef.current = null
    hotKey.current = ""
    setHot([])
    setPen(false)
    setPhase("idle")
    if (message) announce(message)
  }

  function cancelMorph() {
    cancelAnimationFrame(rafs.current.morph)
    rafs.current.morph = 0
  }

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms))
  }

  function clearLater() {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current.length = 0
  }

  /** Any real input ends the self-playing demo, wherever it had got to. */
  function cancelAuto() {
    if (autoState.current === "running") {
      cancelAnimationFrame(rafs.current.auto)
      clearLater()
      if (autoStage.current === "stroke") cancelStroke()
    }
    autoState.current = "done"
  }

  /** Pen up: smooth the stroke into an outline, select what is inside it. Returns the selected ids. */
  function release(pts: Pt[], additive: boolean, instant: boolean, focus = false, quiet = false): string[] | null {
    measure()
    const box = bboxOf(pts)
    if (pts.length < 8 || box.x1 - box.x0 < 20 || box.y1 - box.y0 < 20) {
      cancelStroke()
      return null
    }
    // Select by the loop you can see (the overshoot trimmed off), not by the raw stroke.
    const trimmed = trimLoop(pts)
    const loop = trimmed.length >= 8 ? trimmed : pts
    const ids = insideOf(loop)
    if (ids.length === 0) {
      cancelStroke("No files inside the loop")
      return null
    }
    const R = resampleClosed(loop, SMOOTH_POINTS)
    const S = taubin(R, 10)
    const el = loopRef.current
    el?.setAttribute("d", closedPath(S))
    loopBox.current = bboxOf(S)
    hotKey.current = ""
    setHot([])
    setPen(false)
    const next = additive ? [...selRef.current, ...ids.filter((id) => !selRef.current.includes(id))] : ids
    setLoopKey(next.join("|"))
    setPhase("settled")
    commit(next, true, quiet)
    if (focus) focusTile(ids[0], true)
    else setActive(ids[0])
    if (!instant && !reducedMotion() && el) {
      let t0 = -1
      const frame = (ts: number) => {
        if (t0 < 0) t0 = ts
        const t = clamp((ts - t0) / MORPH_MS, 0, 1)
        el.setAttribute("d", closedPath(t < 1 ? lerpPts(R, S, easeOut(t)) : S))
        rafs.current.morph = t < 1 ? requestAnimationFrame(frame) : 0
      }
      el.setAttribute("d", closedPath(R))
      rafs.current.morph = requestAnimationFrame(frame)
    }
    return next
  }

  /* ------------------------------- asking ------------------------------- */

  function finishAsk(ask: LoopAsk, quiet: boolean) {
    const p = propsRef.current
    const text = typeof p.reply === "function" ? p.reply(ask) : (p.reply ?? defaultReply(ask, p.isDemo))
    setSent({ prompt: ask.prompt, reply: text, key: ask.ids.join("|") })
    setPrompt("")
    setMode("sent")
    if (!quiet) {
      restoreFocus.current = "done"
      announce(`Question sent to ${agent}. Reply: ${text}`)
    }
  }

  function send() {
    const q = prompt.trim()
    if (!q) return
    const ask: LoopAsk = { ids: selected, items: items.filter((it) => selected.includes(it.id)), prompt: q }
    propsRef.current.onAsk?.(ask)
    finishAsk(ask, false)
  }

  /* ------------------------------- autoplay ------------------------------- */

  /** After the loop lands: open the composer, type the question, send it, let the answer stream in. */
  function autoAfter(ids: string[], instant: boolean) {
    const q = autoPrompt
    const ask = (): LoopAsk => ({ ids, items: itemsRef.current.filter((it) => ids.includes(it.id)), prompt: q ?? "" })
    autoStage.current = "after"
    if (!q) {
      autoState.current = "done"
      return
    }
    if (instant) {
      finishAsk(ask(), true)
      autoState.current = "done"
      return
    }
    const type = (i: number) => {
      setPrompt(q.slice(0, i))
      if (i < q.length) later(() => type(i + 1), 24 + ((i * 7) % 5) * 7)
      else
        later(() => {
          finishAsk(ask(), true)
          autoState.current = "done"
        }, 520)
    }
    later(() => setMode("ask"), 800)
    later(() => type(0), 1300)
  }

  function startAuto() {
    if (autoState.current !== "waiting") return
    if (selRef.current.length > 0) {
      autoState.current = "done"
      return
    }
    autoState.current = "running"
    autoStage.current = "stroke"
    const rects = measure()
    const lefts = [...new Set([...rects.values()].map((r) => Math.round(r.x0)))].sort((a, b) => a - b)
    const tops = [...new Set([...rects.values()].map((r) => Math.round(r.y0)))].sort((a, b) => a - b)
    // Three columns wide when there is room, so the loop reads as a hand-drawn blob rather than a marquee.
    const cols = Math.min(lefts.length, 3)
    const pattern = [0, 1].flatMap((r) => Array.from({ length: cols }, (_, c) => [c, r]))
    const all = [...rects.values()]
    const targets = pattern.flatMap(([c, r]) => {
      const hit = all.find((b) => Math.round(b.x0) === lefts[c] && Math.round(b.y0) === tops[r])
      return hit ? [hit] : []
    })
    if (targets.length < 2) {
      autoState.current = "done"
      return
    }
    const pts = eggLoop(targets, all.filter((b) => !targets.includes(b)))
    const finish = (instant: boolean) => {
      cancelAnimationFrame(rafs.current.auto)
      clearLater()
      const ids = release(pts, false, instant, false, true)
      if (ids) autoAfter(ids, instant && reducedMotion())
      else autoState.current = "done"
    }
    if (reducedMotion()) {
      finish(true)
      return
    }
    setPen(true)
    beginStroke(pts[0])
    let acc = 0
    let last = -1
    const step = (ts: number) => {
      if (last < 0) last = ts
      acc += Math.min(ts - last, 48)
      last = ts
      const p = clamp(acc / AUTO_MS, 0, 1)
      const n = Math.max(2, Math.floor(easeInOut(p) * pts.length))
      paintStroke(pts.slice(0, n))
      if (p < 1) rafs.current.auto = requestAnimationFrame(step)
      else later(() => finish(false), 110)
    }
    rafs.current.auto = requestAnimationFrame(step)
    // If frames never arrive (a throttled tab), still land on the finished state.
    later(() => finish(true), AUTO_MS + 2200)
  }

  const apiRef = React.useRef({ startAuto })
  React.useLayoutEffect(() => {
    apiRef.current = { startAuto }
  })

  React.useEffect(() => {
    const root = rootRef.current
    if (!auto || !root) return
    let timer = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        timer = window.setTimeout(() => apiRef.current.startAuto(), 380)
      },
      { threshold: 0.25 },
    )
    io.observe(root)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [auto])

  React.useEffect(() => {
    const r = rafs.current
    const pending = timers.current
    return () => {
      cancelAnimationFrame(r.morph)
      cancelAnimationFrame(r.auto)
      for (const id of pending) window.clearTimeout(id)
      pending.length = 0
    }
  }, [])

  /* -------------------------- chip placement effects -------------------------- */

  const open = items.some((it) => selected.includes(it.id))
  const chipOpen = open && phase !== "drawing"

  React.useLayoutEffect(() => {
    const was = wasOpen.current
    wasOpen.current = chipOpen
    if (!chipOpen) return
    measureChip(!was)
    if (!was) glideChip()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selKey, mode, chipOpen, sent])

  React.useLayoutEffect(() => {
    const from = prevMode.current
    prevMode.current = mode
    const driven = autoState.current === "running"
    if (mode === "ask" && from !== "ask") {
      if (!driven) inputRef.current?.focus({ preventScroll: true })
    } else if (restoreFocus.current === "ask" && mode === "chip") {
      askBtnRef.current?.focus({ preventScroll: true })
    } else if (restoreFocus.current === "done" && mode === "sent") {
      doneBtnRef.current?.focus({ preventScroll: true })
    }
    if (mode !== "ask" || from === "ask") restoreFocus.current = null
  }, [mode])

  // Esc clears even when focus is elsewhere, as long as the pointer is over the piece (the demo draws its own loop, so nothing has focus yet).
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current
      if (e.key !== "Escape" || e.defaultPrevented || !root || root.contains(document.activeElement) || !root.matches(":hover")) return
      cancelAuto()
      commit([])
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const ro = new ResizeObserver(() => {
      const w = stage.clientWidth
      const changed = stageW.current > 0 && Math.abs(w - stageW.current) > 1
      stageW.current = w
      if (changed) {
        // Tiles reflowed: the old outline no longer lines up, the selection and the chip still do.
        loopBox.current = null
        setPhase((p) => (p === "settled" ? "idle" : p))
      }
      if (wasOpen.current) measureChip(false)
    })
    ro.observe(stage)
    for (const f of Object.values(faceRefs.current)) if (f) ro.observe(f)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ------------------------------- pointer ------------------------------- */

  function localPoint(e: React.PointerEvent): Pt {
    const s = stageRef.current!.getBoundingClientRect()
    return { x: e.clientX - s.left, y: e.clientY - s.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    cancelAuto()
    if ((e.target as Element).closest(".ils-chip")) return
    const tile = (e.target as Element).closest<HTMLElement>("[data-id]")
    const p = localPoint(e)
    downRef.current = {
      id: tile?.dataset.id ?? null, x: p.x, y: p.y, additive: e.shiftKey || e.metaKey || e.ctrlKey,
      touch: e.pointerType === "touch", drawing: false, pts: [p], pointer: e.pointerId,
    }
    measure()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* the pointer is already gone */
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = downRef.current
    if (!d || !drawMode || e.pointerId !== d.pointer) return
    const p = localPoint(e)
    if (!d.drawing) {
      if (Math.hypot(p.x - d.x, p.y - d.y) < 6) return
      d.drawing = true
      beginStroke(d.pts[0])
    }
    const last = d.pts[d.pts.length - 1]
    if (Math.hypot(p.x - last.x, p.y - last.y) < 2.2) return
    d.pts.push(p)
    // A long scribble must not grow without bound: keep every other point once the stroke is long.
    if (d.pts.length > MAX_STROKE_POINTS) d.pts = d.pts.filter((_, i, a) => i % 2 === 0 || i === a.length - 1)
    paintStroke(d.pts)
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = downRef.current
    if (!d || e.pointerId !== d.pointer) return
    downRef.current = null
    if (d.drawing) {
      release(d.pts, d.additive, false, true)
      return
    }
    const sel = selRef.current
    if (d.id) {
      setActive(d.id)
      if (d.additive || d.touch) commit(sel.includes(d.id) ? sel.filter((v) => v !== d.id) : [...sel, d.id])
      else commit(sel.length === 1 && sel[0] === d.id ? [] : [d.id])
    } else if (sel.length > 0 && !d.additive) {
      commit([])
    }
    if (!d.id && activeId) tileEls.current.get(activeId)?.focus({ preventScroll: true })
  }

  function onPointerCancel() {
    if (downRef.current?.drawing) cancelStroke()
    downRef.current = null
  }

  /* ------------------------------- keyboard ------------------------------- */

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    cancelAuto()
    if (e.key === "Escape") {
      if (downRef.current?.drawing) {
        cancelStroke("Loop cancelled")
      } else if (selRef.current.length > 0) {
        commit([])
        if (active) tileEls.current.get(active)?.focus()
      }
      return
    }
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-id]")?.dataset.id
    if (!id) return
    const sel = selRef.current
    const dirs: Record<string, Dir> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }
    if (dirs[e.key]) {
      e.preventDefault()
      const next = neighbor(id, dirs[e.key])
      if (!next) return
      focusTile(next)
      if (e.shiftKey) commit([...sel, ...[id, next].filter((v, i, a) => !sel.includes(v) && a.indexOf(v) === i)])
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      commit(sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id])
    } else if ((e.key === "a" || e.key === "A") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      commit(itemsRef.current.map((it) => it.id))
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      const list = itemsRef.current
      focusTile((e.key === "Home" ? list[0] : list[list.length - 1]).id)
    }
  }

  /* -------------------------------- render -------------------------------- */

  const shownItems = items.filter((it) => shown.includes(it.id))
  const count = shownItems.length
  const totalKb = shownItems.length > 0 && shownItems.every((it) => it.sizeKb != null) ? shownItems.reduce((n, it) => n + (it.sizeKb ?? 0), 0) : null
  const activeId = active && items.some((it) => it.id === active) ? active : (items[0]?.id ?? null)
  const canSend = prompt.trim().length > 0
  const loopLive = phase === "settled" && loopKey === selKey
  const inkPhase: Phase = phase === "settled" && !loopLive ? "idle" : phase

  const clear = () => {
    commit([])
    if (activeId) tileEls.current.get(activeId)?.focus()
  }

  const drawing = phase === "drawing"
  const lineKey = drawing ? `draw-${hot.length}` : !open ? "none" : mode === "sent" ? "sent" : `sel-${count}-${totalKb ?? ""}`
  const line = drawing ? (
    hot.length > 0 ? (
      <>
        <b className="ils-hl">{plural(hot.length)}</b> inside the loop. Let go to select.
      </>
    ) : (
      <>Keep going: close the loop around the files you want {agent} to read.</>
    )
  ) : !open ? (
    <>
      Circle the files you want <b>{agent}</b> to read. Nothing is shared until you send.
    </>
  ) : mode === "sent" ? (
    <>
      <b>{agent}</b> answered from <b className="ils-hl">{plural(count)}</b> only. Nothing else left this project.
    </>
  ) : (
    <>
      <b>{agent}</b> will read <b className="ils-hl">{plural(count)}</b>
      {totalKb != null ? ` (${fmtSize(totalKb)})` : ""} from {title}. Nothing leaves this project until you send.
    </>
  )

  const faceProps = (m: Mode) =>
    ({
      ref: (el: HTMLElement | null) => {
        faceRefs.current[m] = el
      },
      "data-on": mode === m ? "" : undefined,
      inert: mode !== m,
      "aria-hidden": mode !== m,
    }) as const

  const replyWords = sent ? sent.reply.split(" ") : []
  const wordStep = Math.min(30, Math.round(1000 / Math.max(1, replyWords.length)))

  return (
    <div ref={rootRef} className={cn("ils", className)}>
      <style href="loop-select" precedence="default">
        {CSS}
      </style>
      <section className="ils-card" aria-label={`${title} files`}>
        <header className="ils-head">
          <span className="ils-logo" aria-hidden="true">
            <FolderOpen />
          </span>
          <div className="ils-titles">
            <div className="ils-title">{title}</div>
            <div className="ils-sub">{subtitle ?? `Harbor & Finch · ${plural(items.length)}`}</div>
          </div>
          <button
            type="button"
            className="ils-pen"
            aria-pressed={drawMode}
            aria-label="Draw loops"
            title={drawMode ? "Drawing is on: drag across the grid to circle files" : "Drawing is off: tap files to select them"}
            onClick={() => setDrawOverride(!drawMode)}
          >
            <PenLine aria-hidden="true" />
            <span className="ils-pen-t">Draw</span>
          </button>
        </header>

        <div
          ref={stageRef}
          className="ils-stage"
          data-draw={drawMode ? "" : undefined}
          data-drawing={drawing ? "" : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
          onKeyDown={onKeyDown}
        >
          <div ref={gridRef} className="ils-grid" role="listbox" aria-multiselectable="true" aria-label={`${title}, arrow keys move, space selects`} aria-describedby={hintId}>
            {items.map((it, i) => {
              const isSel = selected.includes(it.id)
              const kind = kindOf(it)
              const rank = isSel ? selected.indexOf(it.id) : 0
              return (
                <div
                  key={it.id}
                  ref={(el) => {
                    if (el) tileEls.current.set(it.id, el)
                    else tileEls.current.delete(it.id)
                  }}
                  className="ils-tile"
                  role="option"
                  aria-selected={isSel}
                  data-id={it.id}
                  data-k={kind}
                  data-hot={hot.includes(it.id) ? "" : undefined}
                  tabIndex={it.id === activeId ? 0 : -1}
                  onFocus={() => setActive(it.id)}
                  style={{ "--ils-i": i, "--ils-d": `${Math.min(rank, 8) * 45}ms` } as React.CSSProperties}
                >
                  <div className="ils-thumb">
                    <Thumb kind={kind} />
                    {extOf(it.name) && <span className="ils-ext">{extOf(it.name)}</span>}
                    <span className="ils-check" aria-hidden="true">
                      <Check strokeWidth={3} />
                    </span>
                  </div>
                  <div className="ils-name" title={it.name}>
                    {it.name}
                  </div>
                  <div className="ils-meta">{metaOf(it) || " "}</div>
                </div>
              )
            })}
          </div>

          <svg className="ils-ink" data-phase={inkPhase} data-pen={pen ? "" : undefined} aria-hidden="true" focusable="false">
            <defs>
              <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            <path ref={loopRef} className="ils-loop" style={drawing ? { filter: `url(#${filterId})` } : undefined} />
            <path ref={guideRef} className="ils-guide" />
            <g ref={tipRef} className="ils-tipg">
              <circle className="ils-tip-glow" r="14" />
              <circle className="ils-tip-dot" r="5.5" />
              <circle className="ils-tip-core" r="1.7" />
            </g>
          </svg>

          <div ref={dockRef} className="ils-dock" data-open={open ? "" : undefined}>
            <div ref={chipRef} className="ils-chip" role="group" aria-label="Selection actions" data-open={chipOpen ? "" : undefined} data-mode={mode} inert={!chipOpen}>
              <div className="ils-face ils-face--chip" {...faceProps("chip")}>
                <span className="ils-stack ils-stack-c" key={selKey} aria-hidden="true">
                  {shownItems.slice(0, 3).map((it, j) => (
                    <Mini key={it.id} it={it} j={j} />
                  ))}
                </span>
                <span className="ils-count">
                  <span className="ils-n" key={count}>
                    {count}
                  </span>{" "}
                  {count === 1 ? "file" : "files"}
                </span>
                <span className="ils-sep" aria-hidden="true" />
                <button
                  ref={askBtnRef}
                  type="button"
                  className="ils-ask"
                  onClick={() => {
                    cancelAuto()
                    setMode("ask")
                  }}
                >
                  <MessageSquare aria-hidden="true" />
                  Ask about these
                </button>
                <button type="button" className="ils-x" aria-label="Clear selection" onClick={clear}>
                  <X aria-hidden="true" />
                </button>
              </div>

              <form
                className="ils-face ils-face--ask"
                {...faceProps("ask")}
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
              >
                <Files className="ils-ask-ic" aria-hidden="true" />
                <span className="ils-ask-count">
                  {plural(count)}
                  {totalKb != null && <span className="ils-ask-size"> · {fmtSize(totalKb)}</span>}
                </span>
                <input
                  ref={inputRef}
                  className="ils-input"
                  value={prompt}
                  placeholder={placeholder ?? `Ask ${agent} about these…`}
                  aria-label={`Question for ${agent} about ${plural(count)}`}
                  autoComplete="off"
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.stopPropagation()
                      restoreFocus.current = "ask"
                      setMode("chip")
                    }
                  }}
                />
                <button type="submit" className="ils-send" aria-label={`Send to ${agent}`} aria-disabled={!canSend}>
                  <ArrowUp aria-hidden="true" strokeWidth={2.4} />
                </button>
              </form>

              <div className="ils-face ils-face--sent" {...faceProps("sent")}>
                {mode === "sent" && sent && (
                  <>
                    <div className="ils-s-head">
                      <span className="ils-stack" aria-hidden="true">
                        {shownItems.slice(0, 4).map((it, j) => (
                          <Mini key={it.id} it={it} j={j} />
                        ))}
                      </span>
                      <span className="ils-s-title">
                        <span className="ils-r1" data-text={`${agent} is reading ${plural(count)}`} aria-hidden="true">
                          {agent} is reading {plural(count)}
                        </span>
                        <span className="ils-r2">
                          {agent} read <b>{plural(count)}</b>
                          {totalKb != null && <span className="ils-s-size"> · {fmtSize(totalKb)}</span>}
                        </span>
                      </span>
                      <button ref={doneBtnRef} type="button" className="ils-x" aria-label="Done, clear selection" onClick={clear}>
                        <X aria-hidden="true" />
                      </button>
                    </div>
                    <p className="ils-s-q">“{sent.prompt}”</p>
                    <p className="ils-s-reply">
                      <span className="ils-dots" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                      {replyWords.map((w, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && " "}
                          <span className="ils-w" style={{ "--ils-wd": `${600 + i * wordStep}ms` } as React.CSSProperties}>
                            {w}
                          </span>
                        </React.Fragment>
                      ))}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="ils-foot">
          <p className="ils-line">
            <span className="ils-swap" key={lineKey}>
              {line}
            </span>
          </p>
          <p className="ils-keys" id={hintId}>
            <span>
              <kbd className="ils-kbd">Drag</kbd> to circle
            </span>
            <span>
              <kbd className="ils-kbd">Shift</kbd>-click to add one
            </span>
            <span className="ils-keys-more">
              <span>
                <kbd className="ils-kbd">←</kbd>
                <kbd className="ils-kbd">↑</kbd>
                <kbd className="ils-kbd">→</kbd>
                <kbd className="ils-kbd">↓</kbd> to move, <kbd className="ils-kbd">Space</kbd> to toggle
              </span>
              <span>
                <kbd className="ils-kbd">Esc</kbd> to clear
              </span>
            </span>
          </p>
        </footer>
      </section>
      <p className="ils-sr" role="status" aria-live="polite">
        {say}
      </p>
    </div>
  )
}

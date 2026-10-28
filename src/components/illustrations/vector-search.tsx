"use client"

import * as React from "react"
import { BookOpen, LifeBuoy, Pause, Play, Terminal } from "lucide-react"

/**
 * VectorSearch – documents drop onto a tilted embedding plane and fold into points that cluster by topic; the
 * index links neighbours, a query is typed, embedded and lowered onto the plane, a signal hops along the graph
 * toward it, and a widening ring lights the nearest documents with connecting lines, similarity scores and a
 * ranked list. Rankings and scores are computed from the positions on the plane, so they always match the picture.
 *
 *   <VectorSearch topics={[{ name: "Billing" }, …]} documents={[{ title: "Refund a charge", topic: 0 }, …]} query="How do I rotate a leaked API key?" />
 */

export type VectorSearchSource = {
  /** Name of where the document lives (shown next to a match). */
  name: string
  /** Glyph for the source (any ReactNode). */
  icon?: React.ReactNode
  /** Colour of the glyph. */
  color?: string
}
export type VectorSearchDocument = {
  title: string
  /** Index into `topics`. */
  topic: number
  source?: VectorSearchSource
  /** Place the point on the plane, from -1 to 1. Left out, points spiral around their topic's centre. */
  x?: number
  y?: number
}
export type VectorSearchTopic = {
  name: string
  /** Any CSS colour; defaults to a chart palette. */
  color?: string
}
export type VectorSearchProps = {
  /** Documents in the index, 6 to 24. */
  documents?: VectorSearchDocument[]
  /** Topics the documents cluster by, two to four. */
  topics?: VectorSearchTopic[]
  /** The search query, typed into the readout before it is embedded. */
  query?: string
  /** Where the query lands on the plane, from -1 to 1. Defaults to beside the first document of the second topic. */
  queryAt?: { x: number; y: number }
  /** How many nearest documents are returned, 1 to 5. Default 3. */
  k?: number
  /** Embedding size shown in the readout heading. Default 1536. */
  dimensions?: number
  /** Stage names, counter names and headings. */
  labels?: {
    embed?: string
    index?: string
    query?: string
    rank?: string
    embedded?: string
    links?: string
    hops?: string
    embedding?: string
    queryHeading?: string
    results?: string
    queryChip?: string
  }
  /** Motion speed multiplier – 1 is the designed pace (the whole story takes 18 seconds). */
  speed?: number
  /** Freeze all motion on the current frame (it eases to rest). */
  paused?: boolean
  /** Show the step bar with play and pause above the plane. Default true. */
  controls?: boolean
  /** Accent colour (any CSS colour) for the query, the search path, the ring, the match lines and the score bars. */
  accent?: string
  /** Accessible description. Built from the topics, the query, the hops and the real matches when left out. */
  label?: string
  className?: string
}

const ic = { strokeWidth: 1.8, "aria-hidden": true } as const
const HELP: VectorSearchSource = { name: "Help center", icon: <LifeBuoy {...ic} />, color: "#d98a0b" }
const API: VectorSearchSource = { name: "API docs", icon: <Terminal {...ic} />, color: "#6d5ae6" }
const RUN: VectorSearchSource = { name: "Runbooks", icon: <BookOpen {...ic} />, color: "#0e9f8e" }
const DEFAULT_TOPICS: VectorSearchTopic[] = [{ name: "Billing" }, { name: "Access" }, { name: "Deploys" }]
const DEFAULT_DOCS: VectorSearchDocument[] = [
  { title: "Refund a charge", topic: 0, source: HELP },
  { title: "Rotate an API key", topic: 1, source: API },
  { title: "Roll back a deploy", topic: 2, source: RUN },
  { title: "Update a card on file", topic: 0, source: HELP },
  { title: "Scope API tokens", topic: 1, source: API },
  { title: "Preview environments", topic: 2, source: RUN },
  { title: "Download invoices", topic: 0, source: HELP },
  { title: "Revoke a session", topic: 1, source: API },
  { title: "Add a custom domain", topic: 2, source: RUN },
  { title: "Change the billing email", topic: 0, source: HELP },
  { title: "Invite a teammate", topic: 1, source: HELP },
  { title: "Set environment variables", topic: 2, source: RUN },
  { title: "Apply a coupon", topic: 0, source: HELP },
  { title: "Set up single sign-on", topic: 1, source: API },
  { title: "Read build logs", topic: 2, source: RUN },
  { title: "Cancel a subscription", topic: 0, source: HELP },
  { title: "Reset a password", topic: 1, source: HELP },
  { title: "Schedule a release", topic: 2, source: RUN },
]

/* -------------------------------------------------------------------------- */
/*                                   Model                                    */
/* -------------------------------------------------------------------------- */

const W = 640
const PLANE_H = 336
const CPX = 320
const CPY = 172
const SX = 140 // screen px per plane unit along x − y
const SY = 70 // screen px per plane unit along x + y
const toScreen = (p: number, q: number): [number, number] => [CPX + (p - q) * SX, CPY + (p + q) * SY]

const T = 18
const STAGE_AT = [0, 5, 9.5, 13.5]
const SETTLED = [4.6, 9.0, 13.0, 17.0]
const BARS = 40

/** Topic centres on the plane (x, y in -1..1): left, right, back, front. */
const CENTERS: [number, number][] = [
  [-0.275, 0.489],
  [0.511, -0.282],
  [-0.5, -0.471],
  [0.28, 0.55],
]
const COLORS_L = ["#7b3fb8", "#e29a0a", "#0e9f8e", "#2f7ad9"]
const COLORS_D = ["#a77be0", "#f0b43a", "#2ec4b0", "#6aa4ff"]

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const ease = (p: number) => {
  const x = clamp01(p)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
const easeOut = (p: number) => 1 - Math.pow(1 - clamp01(p), 3)
const hash = (s: string, i: number) => {
  let h = 2166136261 ^ i
  for (let c = 0; c < s.length; c++) h = Math.imul(h ^ s.charCodeAt(c), 16777619)
  h ^= h >>> 15
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  return ((h >>> 0) % 10000) / 10000
}
/** A stand-in embedding: same-topic documents share part of their shape. */
const vector = (title: string, topic: number) => Array.from({ length: BARS }, (_, i) => clamp((hash(`topic${topic}`, i) - 0.5) * 1.1 + (hash(title, i) - 0.5) * 1.1, -1, 1))

type Model = {
  n: number
  docs: { title: string; topic: number; p: number; q: number; sx: number; sy: number; source?: VectorSearchSource; vec: number[] }[]
  edges: [number, number][]
  qp: { p: number; q: number; sx: number; sy: number }
  qvec: number[]
  dist: number[]
  path: number[]
  hopLen: number[]
  pathLen: number
  matches: { i: number; d: number; sim: number; dx: number; dy: number }[]
  /** Which side of the query its label sits on (the side with fewer matches). */
  qSide: 1 | -1
  rMax: number
  topicCenters: { sx: number; sy: number }[]
  dropGap: number
}

function buildModel(documents: VectorSearchDocument[], topics: VectorSearchTopic[], query: string, queryAt: { x: number; y: number } | undefined, k: number): Model {
  const nt = Math.max(1, Math.min(4, topics.length))
  const seen = new Array(nt).fill(0)
  const raw = documents.slice(0, 24).map((d) => {
    const t = clamp(Math.floor(d.topic) || 0, 0, nt - 1)
    const r = seen[t]++
    const c = CENTERS[nt === 2 ? [0, 1][t] : t]
    const ang = r * 2.399963 + t * 1.3
    const rho = 0.075 + 0.088 * Math.sqrt(r)
    const p = d.x ?? clamp(c[0] + Math.cos(ang) * rho, -0.93, 0.93)
    const q = d.y ?? clamp(c[1] + Math.sin(ang) * rho, -0.93, 0.93)
    const [sx, sy] = toScreen(p, q)
    return { title: d.title, topic: t, p, q, sx, sy, source: d.source, vec: vector(d.title, t) }
  })
  const n = raw.length
  const d2 = (a: { p: number; q: number }, b: { p: number; q: number }) => Math.hypot(a.p - b.p, a.q - b.q)

  // Index graph: each point links to its two nearest neighbours, then bridge any islands.
  const set = new Set<string>()
  const edges: [number, number][] = []
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (a === b || set.has(key)) return
    set.add(key)
    edges.push(a < b ? [a, b] : [b, a])
  }
  for (let i = 0; i < n; i++) {
    const order = raw.map((_, j) => j).filter((j) => j !== i).sort((a, b) => d2(raw[i], raw[a]) - d2(raw[i], raw[b]))
    order.slice(0, 2).forEach((j) => addEdge(i, j))
  }
  const comp = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => (comp[x] === x ? x : (comp[x] = find(comp[x])))
  edges.forEach(([a, b]) => (comp[find(a)] = find(b)))
  for (;;) {
    let best: [number, number] | null = null
    let bd = Infinity
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++)
        if (find(a) !== find(b)) {
          const dd = d2(raw[a], raw[b])
          if (dd < bd) {
            bd = dd
            best = [a, b]
          }
        }
    if (!best) break
    addEdge(best[0], best[1])
    comp[find(best[0])] = find(best[1])
  }

  // The query lands beside the first document of the second topic.
  const anchor = raw.find((d) => d.topic === Math.min(1, nt - 1)) ?? raw[0]
  const qpp = queryAt ? clamp(queryAt.x, -0.95, 0.95) : clamp(anchor.p + 0.05, -0.95, 0.95)
  const qqq = queryAt ? clamp(queryAt.y, -0.95, 0.95) : clamp(anchor.q - 0.075, -0.95, 0.95)
  const [qsx, qsy] = toScreen(qpp, qqq)
  const qp = { p: qpp, q: qqq, sx: qsx, sy: qsy }
  const dist = raw.map((d) => d2(d, qp))
  const ranked = raw.map((_, i) => i).sort((a, b) => dist[a] - dist[b])
  const kk = clamp(Math.floor(k), 1, Math.min(5, n))
  const matches = ranked.slice(0, kk).map((i) => {
    const vx = raw[i].sx - qsx
    const vy = raw[i].sy - qsy
    const len = Math.hypot(vx, vy) || 1
    return { i, d: dist[i], sim: clamp(1 - 0.55 * dist[i], 0.5, 0.99), dx: vx / len, dy: vy / len }
  })
  const qSide: 1 | -1 = matches.reduce((a, m) => a + m.dx, 0) > 0 ? -1 : 1

  // Shortest route through the graph from the farthest point to the point nearest the query.
  const start = ranked[n - 1]
  const goal = ranked[0]
  const adj: [number, number][][] = Array.from({ length: n }, () => [])
  edges.forEach(([a, b]) => {
    const w = d2(raw[a], raw[b])
    adj[a].push([b, w])
    adj[b].push([a, w])
  })
  const best = new Array(n).fill(Infinity)
  const prev = new Array(n).fill(-1)
  const done = new Array(n).fill(false)
  best[start] = 0
  for (let it = 0; it < n; it++) {
    let u = -1
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || best[i] < best[u])) u = i
    if (u < 0 || best[u] === Infinity) break
    done[u] = true
    adj[u].forEach(([v, w]) => {
      if (best[u] + w < best[v]) {
        best[v] = best[u] + w
        prev[v] = u
      }
    })
  }
  const path: number[] = []
  for (let v = goal; v >= 0; v = prev[v]) path.unshift(v)
  if (path[0] !== start) path.unshift(start)
  const hopLen = path.slice(1).map((v, i) => Math.hypot(raw[v].sx - raw[path[i]].sx, raw[v].sy - raw[path[i]].sy))
  const pathLen = hopLen.reduce((a, b) => a + b, 0)

  const centers = Array.from({ length: nt }, (_, t) => {
    const c = CENTERS[nt === 2 ? [0, 1][t] : t]
    const [sx, sy] = toScreen(c[0], c[1])
    return { sx, sy }
  })
  return {
    n,
    docs: raw,
    edges,
    qp,
    qvec: vector(query, 7),
    dist,
    path,
    hopLen,
    pathLen,
    matches,
    qSide,
    rMax: Math.max(...matches.map((m) => m.d)) + 0.06,
    topicCenters: centers,
    dropGap: Math.min(0.2, 3.5 / Math.max(1, n)),
  }
}

const cache = new WeakMap<Element, Record<string, string>>()
function put(el: Element | null | undefined, kind: "a" | "s" | "t", key: string, value: string | number) {
  if (!el) return
  const v = typeof value === "number" ? String(Math.round(value * 1000) / 1000) : value
  let c = cache.get(el)
  if (!c) cache.set(el, (c = {}))
  const k = kind + key
  if (c[k] === v) return
  c[k] = v
  if (kind === "a") el.setAttribute(key, v)
  else if (kind === "s") (el as HTMLElement).style.setProperty(key, v)
  else el.textContent = v
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const ROW_H = 40
const RES_TOP = 630
const CSS = `
.vsr {
  --vsr-ink: #000;
  --vsr-surface: #fff;
  --vsr-accent: #0060e2;
  --vsr-t1: color-mix(in oklab, var(--vsr-ink) 88%, transparent);
  --vsr-t2: color-mix(in oklab, var(--vsr-ink) 61%, transparent);
  --vsr-t3: color-mix(in oklab, var(--vsr-ink) 45%, transparent);
  --vsr-t4: color-mix(in oklab, var(--vsr-ink) 27%, transparent);
  --vsr-fill: color-mix(in oklab, var(--vsr-ink) 7%, transparent);
  --vsr-line: color-mix(in oklab, var(--vsr-ink) 8%, transparent);
  --vsr-edge: color-mix(in oklab, var(--vsr-ink) 14%, transparent);
  --vsr-top: var(--vsr-surface);
  --vsr-side-l: color-mix(in oklab, var(--vsr-ink) 3.5%, var(--vsr-surface));
  --vsr-side-r: color-mix(in oklab, var(--vsr-ink) 7%, var(--vsr-surface));
  --vsr-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 1px -1px rgb(0 0 0 / .1), 0 2px 6px -2px rgb(0 0 0 / .08);
  --vsr-scale: 1;
  margin: 0; width: 100%; max-width: ${W}px; text-align: left;
  font-family: var(--vsr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; color: var(--vsr-t1);
}
:is(.dark, [data-theme="dark"]) .vsr {
  --vsr-ink: #fff; --vsr-surface: #1c1c1e; --vsr-accent: #4d8dff;
  --vsr-t1: color-mix(in oklab, var(--vsr-ink) 90%, transparent);
  --vsr-t2: color-mix(in oklab, var(--vsr-ink) 62%, transparent);
  --vsr-t3: color-mix(in oklab, var(--vsr-ink) 46%, transparent);
  --vsr-t4: color-mix(in oklab, var(--vsr-ink) 28%, transparent);
  --vsr-fill: color-mix(in oklab, var(--vsr-ink) 10%, transparent);
  --vsr-line: color-mix(in oklab, var(--vsr-ink) 9%, transparent);
  --vsr-edge: color-mix(in oklab, var(--vsr-ink) 20%, transparent);
  --vsr-top: color-mix(in oklab, var(--vsr-ink) 5%, var(--vsr-surface));
  --vsr-side-l: color-mix(in oklab, var(--vsr-ink) 1.5%, var(--vsr-surface));
  --vsr-side-r: color-mix(in oklab, var(--vsr-ink) 3.5%, var(--vsr-surface));
  --vsr-shadow: 0 0 0 .5px rgb(255 255 255 / .12), 0 2px 8px -2px rgb(0 0 0 / .5);
}
.vsr *, .vsr *::before, .vsr *::after { box-sizing: border-box }
.vsr-box { position: relative; width: 100% }
.vsr-stage { position: absolute; left: 0; top: 0; width: ${W}px; transform-origin: 0 0; transform: scale(var(--vsr-scale)) }

.vsr-ctrl { position: absolute; left: 60px; top: 0; width: ${W - 120}px; height: 40px; display: flex; align-items: center; gap: 12px }
.vsr-pause { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 0; background: none; color: var(--vsr-t2); cursor: pointer; transition: background .15s, color .15s }
.vsr-pause:hover { background: var(--vsr-fill); color: var(--vsr-t1) }
.vsr-pause svg { width: 15px; height: 15px }
.vsr-steps { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; min-width: 0 }
.vsr-step { height: 40px; padding: 8px 0 0; border: 0; background: none; font: inherit; cursor: pointer; display: flex; flex-direction: column; gap: 5px; text-align: left; min-width: 0 }
.vsr-step-l { font-size: 13px; line-height: 17px; color: var(--vsr-t3); transition: color .2s }
.vsr-step:hover .vsr-step-l { color: var(--vsr-t2) }
.vsr-step[aria-current] .vsr-step-l { color: var(--vsr-t1); font-weight: 500 }
.vsr-seg { display: block; height: 2px; border-radius: 2px; background: var(--vsr-fill); overflow: hidden; margin-top: auto }
.vsr-seg i { display: block; height: 100%; background: var(--vsr-accent); transform-origin: 0 50%; transform: scaleX(0) }
.vsr :focus-visible { outline: 2px solid color-mix(in oklab, var(--vsr-accent) 60%, transparent); outline-offset: 1px; border-radius: 6px }

.vsr-plane { position: absolute; left: 0; top: 48px; width: ${W}px; height: ${PLANE_H}px; overflow: visible }
.vsr-s-l { fill: var(--vsr-side-l) } .vsr-s-r { fill: var(--vsr-side-r) } .vsr-s-t { fill: var(--vsr-top) }
.vsr-plane .vsr-edge { stroke: var(--vsr-edge); stroke-width: 1; stroke-linejoin: round }
.vsr-grid { fill: none; stroke: var(--vsr-line); stroke-width: 1 }
.vsr-cl { stroke-width: 1; stroke-dasharray: 3 4 }
.vsr-link { stroke-width: 1.25; stroke-linecap: round }
.vsr-pt { stroke-width: 1.25 }
.vsr-path { fill: none; stroke: var(--vsr-accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round }
.vsr-sig-glow { fill: var(--vsr-accent) }
.vsr-sig { fill: var(--vsr-accent); stroke: var(--vsr-surface); stroke-width: 1.5 }
.vsr-ring { fill: color-mix(in oklab, var(--vsr-accent) 7%, transparent); stroke: var(--vsr-accent); stroke-width: 1.25 }
.vsr-halo { fill: color-mix(in oklab, var(--vsr-accent) 14%, transparent); stroke: var(--vsr-accent); stroke-width: 1.5 }
.vsr-mline { stroke: var(--vsr-accent); stroke-width: 1.5; stroke-linecap: round }
.vsr-q-ring { fill: var(--vsr-surface); stroke: var(--vsr-accent); stroke-width: 2 }
.vsr-q-dot { fill: var(--vsr-accent) }
.vsr-q-stem { stroke: var(--vsr-accent); stroke-width: 1.25; stroke-dasharray: 2 3 }
.vsr-q-sh { fill: color-mix(in oklab, var(--vsr-ink) 22%, transparent) }

.vsr-chip { position: absolute; left: 0; top: 0; display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 9px; border-radius: 999px; background: var(--vsr-surface); box-shadow: var(--vsr-shadow);
  font-size: 12px; line-height: 16px; font-weight: 500; color: var(--vsr-t1); white-space: nowrap; opacity: 0; will-change: transform }
.vsr-chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--tc) }
.vsr-chip-q { background: var(--vsr-accent); color: #fff; box-shadow: none; height: 20px }
.vsr-score { height: 20px; padding: 0 7px; font-variant-numeric: tabular-nums; font-weight: 600; font-size: 11.5px; box-shadow: 0 0 0 1px color-mix(in oklab, var(--vsr-accent) 55%, transparent), var(--vsr-shadow) }

.vsr-cap { position: absolute; left: 60px; top: 392px; width: ${W - 120}px; font-size: 14px; line-height: 20px; color: var(--vsr-t2) }
.vsr-stats { position: absolute; left: 60px; top: 428px; width: ${W - 120}px; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--vsr-line); border-bottom: 1px solid var(--vsr-line); padding: 8px 0 }
.vsr-stat { display: flex; flex-direction: column }
.vsr-stat span { font-size: 12px; line-height: 16px; color: var(--vsr-t3) }
.vsr-stat b { font-size: 15px; line-height: 22px; font-weight: 500; color: var(--vsr-t1); font-variant-numeric: tabular-nums; letter-spacing: -.01em }
.vsr-read { position: absolute; left: 60px; top: 500px; width: ${W - 120}px }
.vsr-read-h { display: flex; justify-content: space-between; font-size: 12px; line-height: 16px; color: var(--vsr-t3) }
.vsr-read-t { display: block; height: 24px; margin-top: 4px; font-size: 14px; line-height: 24px; font-weight: 500; color: var(--vsr-t1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.vsr-caret { display: inline-block; width: 1.5px; height: 14px; margin-left: 1px; vertical-align: -2px; background: var(--vsr-accent); border-radius: 1px }
.vsr-bars { position: relative; display: flex; gap: 4px; height: 28px; margin-top: 8px }
.vsr-bar { position: relative; flex: 1; height: 100% }
.vsr-bar i { position: absolute; left: 0; right: 0; height: 13px; background: var(--vsr-t1); border-radius: 1px; transform: scaleY(0) }
.vsr-bar i:first-child { top: 1px; transform-origin: 50% 100% }
.vsr-bar i:last-child { top: 14px; transform-origin: 50% 0 }
.vsr-bars[data-q] .vsr-bar i { background: var(--vsr-accent) }
.vsr-res { position: absolute; left: 60px; width: ${W - 120}px }
.vsr-res-h { display: block; font-size: 12px; line-height: 16px; color: var(--vsr-t3) }
.vsr-row { position: absolute; left: 0; width: 100%; height: 30px; opacity: 0 }
.vsr-row-top { display: flex; align-items: center; gap: 10px; height: 26px }
.vsr-rank { width: 12px; font-size: 12px; color: var(--vsr-t3); font-variant-numeric: tabular-nums }
.vsr-src { flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--ic, var(--vsr-t2)) }
.vsr-src > svg, .vsr-src > img { width: 15px; height: 15px; display: block }
.vsr-title { flex: 1; min-width: 0; font-size: 14px; line-height: 20px; font-weight: 500; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.vsr-sc { font-size: 13px; color: var(--vsr-t2); font-variant-numeric: tabular-nums }
.vsr-rbar { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; border-radius: 2px; background: var(--vsr-fill); overflow: hidden }
.vsr-rbar i { display: block; height: 100%; background: var(--vsr-accent); transform-origin: 0 50%; transform: scaleX(0) }
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const pageRect = (f: number) => {
  const w = lerp(9, 7.2, f)
  const h = lerp(12, 7.2, f)
  return { x: -w / 2, y: -h / 2, w, h, rx: lerp(1.6, 3.6, f) }
}

export function VectorSearch({
  documents = DEFAULT_DOCS,
  topics = DEFAULT_TOPICS,
  query = "How do I rotate a leaked API key?",
  queryAt,
  k = 3,
  dimensions = 1536,
  labels,
  speed = 1,
  paused,
  controls = true,
  accent,
  label,
  className,
}: VectorSearchProps) {
  const L = {
    embed: labels?.embed ?? "Embed",
    index: labels?.index ?? "Index",
    query: labels?.query ?? "Query",
    rank: labels?.rank ?? "Rank",
    embedded: labels?.embedded ?? "Embedded",
    links: labels?.links ?? "Links",
    hops: labels?.hops ?? "Hops",
    embedding: labels?.embedding ?? "Embedding",
    queryHeading: labels?.queryHeading ?? "Query",
    results: labels?.results ?? "Nearest documents",
    queryChip: labels?.queryChip ?? "Query",
  }
  const STAGE_NAMES = [L.embed, L.index, L.query, L.rank]
  const reduced = React.useSyncExternalStore(subscribeMotion, readMotion, () => false)
  const [localPaused, setLocalPaused] = React.useState(false)
  const [stillStage, setStillStage] = React.useState(3)

  const nt = Math.max(1, Math.min(4, topics.length))
  const model = React.useMemo(() => buildModel(documents, topics, query, queryAt, k), [documents, topics, query, queryAt, k])
  const kk = model.matches.length
  const stageH = RES_TOP + kk * ROW_H + 8

  const boxRef = React.useRef<HTMLDivElement>(null)
  const els = React.useRef<{
    docs: { g: Element; rect: Element; lines: Element }[]
    links: Element[]
    cl: Element[]
    clChips: HTMLElement[]
    path: Element | null
    sig: Element | null
    sigGlow: Element | null
    ring: Element | null
    halos: Element[]
    mlines: Element[]
    scores: HTMLElement[]
    qg: Element | null
    qstem: Element | null
    qchip: HTMLElement | null
    bars: { up: Element; down: Element }[]
    rows: HTMLElement[]
    rbars: Element[]
    q: (f: string) => Element | null
    fills: Element[]
    steps: Element[]
  } | null>(null)

  const time = React.useRef(paused ? SETTLED[3] : 0.4)
  const rate = React.useRef(paused ? 0 : 1)
  const hover = React.useRef(1)
  const frozen = React.useRef(!!paused)
  const target = React.useRef(Math.max(0.05, speed))
  const kick = React.useRef<() => void>(() => {})
  const cap = [
    "Each document becomes a vector, a point placed by meaning",
    "Close points share a topic, and the index links them",
    "The query is embedded the same way and lowered onto the plane",
    `The ${kk} closest points are the best matches`,
  ]

  // When the ring reaches each match (solved from the ease curve so halo, line, score and row stay in sync).
  const hitAt = React.useMemo(
    () =>
      model.matches.map((m) => {
        const want = clamp01(m.d / model.rMax)
        let lo = 0
        let hi = 1
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2
          if (easeOut(mid) < want) lo = mid
          else hi = mid
        }
        return 15.4 + 1.5 * hi
      }),
    [model],
  )

  const draw = (t: number) => {
    const e = els.current
    if (!e) return
    const u = ((t % T) + T) % T
    const fade = u > 17.3 ? 1 - clamp01((u - 17.3) / 0.7) : 1
    const m = model
    const gap = m.dropGap

    // Documents drop, then fold into points.
    let embedded = 0
    let lastLanded = -1
    let lastLandT = -1
    m.docs.forEach((d, i) => {
      const ts = 0.25 + i * gap
      const s = clamp01((u - ts) / 0.7)
      const f = ease((u - ts - 0.7) / 0.35)
      const h = 110 * (1 - s * s) * (u >= ts ? 1 : 1)
      const g = e.docs[i]
      const r = pageRect(f)
      put(g.g, "a", "transform", `translate(${d.sx.toFixed(1)} ${(d.sy - h).toFixed(1)}) rotate(${(-10 * (1 - s)).toFixed(1)})`)
      put(g.g, "a", "opacity", u < ts ? 0 : clamp01((u - ts) / 0.15) * fade)
      put(g.rect, "a", "x", r.x)
      put(g.rect, "a", "y", r.y)
      put(g.rect, "a", "width", r.w)
      put(g.rect, "a", "height", r.h)
      put(g.rect, "a", "rx", r.rx)
      put(g.rect, "s", "--f", f.toFixed(3))
      put(g.lines, "a", "opacity", 1 - clamp01(f * 2.2))
      if (u >= ts + 0.7) {
        embedded++
        if (ts + 0.7 >= lastLandT) {
          lastLandT = ts + 0.7
          lastLanded = i
        }
      }
    })

    // Clusters and links.
    const clOp = ease((u - 5.0) / 1.2) * fade
    e.cl.forEach((c) => put(c, "a", "opacity", clOp))
    e.clChips.forEach((c, i) => {
      const tc = m.topicCenters[i]
      const above = nt >= 3 && i === 2
      put(c, "s", "opacity", clOp)
      put(c, "s", "transform", `translate(${tc.sx.toFixed(1)}px, ${(tc.sy + (above ? -58 : 52)).toFixed(1)}px) translate(-50%, -50%)`)
    })
    let linkCount = 0
    const E = m.edges.length
    m.edges.forEach((_, i) => {
      const st = 5.5 + i * (2.6 / Math.max(1, E))
      const p = ease((u - st) / 0.55)
      if (u >= st) linkCount++
      put(e.links[i], "a", "stroke-dasharray", `${p.toFixed(3)} 1`)
      put(e.links[i], "a", "opacity", (p > 0 ? 1 : 0) * fade)
    })

    // Query: typed, embedded, lowered.
    const qLen = query.length
    const typed = clamp01((u - 9.8) / 1.5) * qLen
    const qDrop = ease((u - 12.0) / 0.9)
    const qh = 120 * (1 - qDrop)
    const qOn = u >= 12.0
    put(e.qg, "a", "transform", `translate(${m.qp.sx.toFixed(1)} ${(m.qp.sy - qh).toFixed(1)})`)
    put(e.qg, "a", "opacity", qOn ? clamp01((u - 12.0) / 0.2) * fade : 0)
    put(e.qstem, "a", "d", `M0 0 V${qh.toFixed(1)}`)
    put(e.qstem, "a", "opacity", qOn ? 1 - clamp01((qDrop - 0.8) / 0.2) : 0)
    put(e.qchip, "s", "transform", `translate(${(m.qp.sx + m.qSide * 14).toFixed(1)}px, ${(m.qp.sy - 18 - qh).toFixed(1)}px) translate(${m.qSide > 0 ? "0" : "-100%"}, -50%)`)
    put(e.qchip, "s", "opacity", qOn ? ease((u - 12.6) / 0.4) * fade : 0)
    const sh = e.qg?.parentElement?.querySelector(".vsr-q-sh")
    put(sh, "a", "opacity", qOn ? qDrop * 0.9 * fade : 0)

    // Signal hopping along the route.
    const route = m.path
    const sigStart = 13.7
    const sigDur = 1.6
    let hopsDone = 0
    let sx = 0
    let sy = 0
    let sigOp = 0
    const pts: [number, number][] = route.map((i) => [m.docs[i].sx, m.docs[i].sy])
    if (route.length > 1 && m.pathLen > 0) {
      let acc = 0
      const prog = clamp01((u - sigStart) / sigDur)
      const total = prog * m.pathLen
      let drawn = ""
      let lift = 0
      sx = pts[0][0]
      sy = pts[0][1]
      drawn = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
      for (let h = 0; h < m.hopLen.length; h++) {
        const len = m.hopLen[h]
        const lp = clamp01((total - acc) / len)
        // each hop eases a little on its own so the signal lands on every point
        const eased = 0.5 * lp + 0.5 * ease(lp)
        if (lp > 0) {
          const x = lerp(pts[h][0], pts[h + 1][0], eased)
          const y = lerp(pts[h][1], pts[h + 1][1], eased)
          drawn += ` L${x.toFixed(1)} ${y.toFixed(1)}`
          sx = x
          sy = y
          lift = 7 * Math.sin(Math.PI * eased)
        }
        if (lp >= 1) hopsDone++
        acc += len
      }
      put(e.path, "a", "d", drawn)
      put(e.path, "a", "opacity", u >= sigStart ? 0.9 * fade * (1 - clamp01((u - 16.6) / 0.6)) : 0)
      sigOp = u >= sigStart - 0.1 && u < sigStart + sigDur + 0.5 ? clamp01((u - sigStart + 0.1) / 0.2) * (1 - clamp01((u - sigStart - sigDur) / 0.4)) * fade : 0
      put(e.sig, "a", "transform", `translate(${sx.toFixed(1)} ${(sy - lift).toFixed(1)})`)
      put(e.sigGlow, "a", "transform", `translate(${sx.toFixed(1)} ${(sy - lift).toFixed(1)})`)
    }
    put(e.sig, "a", "opacity", sigOp)
    put(e.sigGlow, "a", "opacity", sigOp * 0.22)

    // The ring and the matches.
    const rp = easeOut((u - 15.4) / 1.5)
    const R = rp * m.rMax
    put(e.ring, "a", "transform", `translate(${m.qp.sx.toFixed(1)} ${m.qp.sy.toFixed(1)})`)
    put(e.ring, "a", "rx", (SX * Math.SQRT2 * R).toFixed(1))
    put(e.ring, "a", "ry", (SY * Math.SQRT2 * R).toFixed(1))
    put(e.ring, "a", "opacity", u < 15.4 ? 0 : (1 - clamp01((rp - 0.82) / 0.18) * 0.65) * (1 - clamp01((u - 17.3) / 0.7)))
    m.matches.forEach((mt, i) => {
      const d = m.docs[mt.i]
      const age = u - hitAt[i]
      const on = age >= 0
      const pop = easeOut(age / 0.35)
      put(e.halos[i], "a", "transform", `translate(${d.sx.toFixed(1)} ${d.sy.toFixed(1)}) scale(${lerp(0.5, 1, pop).toFixed(3)})`)
      put(e.halos[i], "a", "opacity", on ? pop * fade : 0)
      put(e.mlines[i], "a", "stroke-dasharray", `${easeOut(age / 0.4).toFixed(3)} 1`)
      put(e.mlines[i], "a", "opacity", on ? 0.9 * fade : 0)
      // The score sits on the side of the match that faces away from the query.
      const side = mt.dx >= 0 ? 1 : -1
      put(e.scores[i], "s", "transform", `translate(${(d.sx + side * 12 + mt.dx * 6).toFixed(1)}px, ${(d.sy + mt.dy * 14 - 11).toFixed(1)}px) translate(${side > 0 ? "0" : "-100%"}, -50%)`)
      put(e.scores[i], "s", "opacity", on ? easeOut((age - 0.1) / 0.3) * fade : 0)
      const row = e.rows[i]
      put(row, "s", "opacity", on ? easeOut(age / 0.4) * fade : 0)
      put(row, "s", "transform", `translateY(${((1 - easeOut(age / 0.4)) * 6).toFixed(1)}px)`)
      put(e.rbars[i], "s", "transform", `scaleX(${(mt.sim * ease(age / 0.7)).toFixed(3)})`)
    })

    // Readout: embedding bars.
    const inQuery = u >= 9.5
    let vec: number[] | null = null
    let titleText = ""
    let caret = false
    let mix = 1
    if (!inQuery) {
      if (lastLanded >= 0) {
        vec = m.docs[lastLanded].vec
        titleText = m.docs[lastLanded].title
        mix = ease((u - lastLandT) / 0.3)
      }
    } else {
      titleText = query.slice(0, Math.floor(typed))
      caret = typed < qLen && u < 11.4
      const bp = (u - 11.4) / 0.9
      vec = m.qvec
      mix = ease(bp)
    }
    const prevVec = !inQuery && lastLanded > 0 ? m.docs[lastLanded - 1].vec : null
    for (let b = 0; b < BARS; b++) {
      const target = vec ? vec[b] : 0
      const from = prevVec ? prevVec[b] : inQuery ? 0 : 0
      let v = lerp(from, target, mix)
      if (inQuery) v = u >= 11.4 ? lerp(0, target, ease((u - 11.4 - b * 0.012) / 0.5)) : 0
      put(e.bars[b].up, "s", "transform", `scaleY(${Math.max(v, 0).toFixed(3)})`)
      put(e.bars[b].down, "s", "transform", `scaleY(${Math.max(-v, 0).toFixed(3)})`)
    }
    const titleEl = e.q("read-title")
    if (titleEl) {
      const txt = titleText
      if (cache.get(titleEl)?.t !== txt + (caret ? "|" : "")) {
        cache.set(titleEl, { t: txt + (caret ? "|" : "") })
        titleEl.textContent = txt
        if (caret) {
          const c = document.createElement("i")
          c.className = "vsr-caret"
          titleEl.appendChild(c)
        }
      }
    }
    put(e.q("read-head"), "t", "", inQuery ? L.queryHeading : L.embedding)
    e.q("bars")?.toggleAttribute("data-q", inQuery)

    // Counters, caption and the step bar.
    put(e.q("n-embedded"), "t", "", `${embedded}/${m.n}`)
    put(e.q("n-links"), "t", "", String(linkCount))
    put(e.q("n-hops"), "t", "", String(u >= sigStart ? hopsDone : 0))
    let stage = 0
    for (let i = 0; i < STAGE_AT.length; i++) if (u >= STAGE_AT[i]) stage = i
    put(e.q("cap"), "t", "", cap[stage])
    for (let i = 0; i < STAGE_AT.length; i++) {
      const end = i + 1 < STAGE_AT.length ? STAGE_AT[i + 1] : T
      put(e.fills[i], "s", "transform", `scaleX(${clamp01((u - STAGE_AT[i]) / (end - STAGE_AT[i])).toFixed(3)})`)
      if (i === stage) e.steps[i]?.setAttribute("aria-current", "step")
      else e.steps[i]?.removeAttribute("aria-current")
    }
  }
  const drawRef = React.useRef(draw)
  React.useEffect(() => {
    drawRef.current = draw
  })

  React.useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const qa = (s: string) => Array.from(box.querySelectorAll(s))
    els.current = {
      docs: (() => {
        const out: { g: Element; rect: Element; lines: Element }[] = []
        qa("[data-doc]").forEach((g) => (out[Number((g as HTMLElement).dataset.doc)] = { g, rect: g.querySelector("rect")!, lines: g.querySelector("path")! }))
        return out
      })(),
      links: qa(".vsr-link"),
      cl: qa(".vsr-cl"),
      clChips: qa(".vsr-chip-t") as HTMLElement[],
      path: box.querySelector(".vsr-path"),
      sig: box.querySelector(".vsr-sig"),
      sigGlow: box.querySelector(".vsr-sig-glow"),
      ring: box.querySelector(".vsr-ring"),
      halos: qa(".vsr-halo"),
      mlines: qa(".vsr-mline"),
      scores: qa(".vsr-score") as HTMLElement[],
      qg: box.querySelector(".vsr-q"),
      qstem: box.querySelector(".vsr-q-stem"),
      qchip: box.querySelector(".vsr-chip-q"),
      bars: qa(".vsr-bar").map((b) => ({ up: b.children[0], down: b.children[1] })),
      rows: qa(".vsr-row") as HTMLElement[],
      rbars: qa(".vsr-rbar i"),
      q: (f) => box.querySelector(`[data-f="${f}"]`),
      fills: qa(".vsr-seg i"),
      steps: qa(".vsr-step"),
    }
    drawRef.current(reduced ? SETTLED[stillStage] : time.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, model, controls])
  React.useEffect(() => {
    if (reduced) drawRef.current(SETTLED[stillStage])
    else if (frozen.current) drawRef.current(time.current)
  })

  React.useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const set = () => box.style.setProperty("--vsr-scale", String(box.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    if (reduced) return
    const root = boxRef.current
    if (!root) return
    let raf = 0
    let last = 0
    let visible = false
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 0
      last = now
      const goal = frozen.current ? 0 : target.current * hover.current
      rate.current += (goal - rate.current) * (1 - Math.exp(-dt * 9))
      time.current += dt * rate.current
      drawRef.current(time.current)
      if (visible && (goal > 0 || rate.current > 0.003)) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const start = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }
    kick.current = start
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      if (visible) start()
      else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      kick.current = () => {}
    }
  }, [reduced])
  React.useEffect(() => {
    frozen.current = !!paused || localPaused
    target.current = Math.max(0.05, speed)
    kick.current()
  }, [paused, localPaused, speed])

  const seek = (i: number) => {
    if (reduced) {
      setStillStage(i)
      return
    }
    const cycle = Math.floor(time.current / T)
    time.current = cycle * T + STAGE_AT[i] + 0.02
    drawRef.current(time.current)
    kick.current()
  }
  const onKey = (ev: React.KeyboardEvent) => {
    const btns = Array.from(ev.currentTarget.querySelectorAll<HTMLButtonElement>(".vsr-step"))
    const cur = btns.indexOf(document.activeElement as HTMLButtonElement)
    let nx = -1
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") nx = Math.min(btns.length - 1, cur + 1)
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") nx = Math.max(0, cur - 1)
    else if (ev.key === "Home") nx = 0
    else if (ev.key === "End") nx = btns.length - 1
    if (nx < 0) return
    ev.preventDefault()
    btns[nx].focus()
    seek(nx)
  }

  const topicName = (i: number) => topics[i]?.name ?? ""
  const counts = Array.from({ length: nt }, (_, t) => model.docs.filter((d) => d.topic === t).length)
  const aria =
    label ??
    `${model.n} documents are embedded as points on a plane and cluster by topic: ${counts.map((c, t) => `${c} ${topicName(t)}`).join(", ")}. The query "${query}" is embedded and placed on the plane. A search signal hops ${
      model.path.length - 1
    } times along the index graph toward it, and the ${kk} nearest documents are returned: ${model.matches
      .map((mt) => `${model.docs[mt.i].title} (${mt.sim.toFixed(2)})`)
      .join(", ")}.`

  const vars = (accent ? { "--vsr-accent": accent } : undefined) as React.CSSProperties | undefined
  // Colours switch with the theme through CSS variables set per topic.
  const topicVars = (t: number) => ({ "--tc": topics[t]?.color ?? `var(--vsr-c${t})` }) as React.CSSProperties

  // Grid lines on the plane.
  const gridLines: string[] = []
  for (let g = -0.75; g <= 0.751; g += 0.25) {
    const a1 = toScreen(g, -1)
    const a2 = toScreen(g, 1)
    const b1 = toScreen(-1, g)
    const b2 = toScreen(1, g)
    gridLines.push(`M${a1[0]} ${a1[1]} L${a2[0]} ${a2[1]}`, `M${b1[0]} ${b1[1]} L${b2[0]} ${b2[1]}`)
  }
  const top: [number, number][] = [
    [CPX, CPY - 140],
    [CPX + 280, CPY],
    [CPX, CPY + 140],
    [CPX - 280, CPY],
  ]
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ")

  const palette = Array.from({ length: 4 }, (_, t) => `--vsr-c${t}: ${COLORS_L[t]};`).join(" ")
  const paletteDark = Array.from({ length: 4 }, (_, t) => `--vsr-c${t}: ${COLORS_D[t]};`).join(" ")

  return (
    <figure className={className ? `vsr ${className}` : "vsr"} style={vars} data-paused={paused || undefined} data-still={reduced || undefined}>
      <style href="pane-vector-search" precedence="default">
        {CSS + `.vsr { ${palette} } :is(.dark, [data-theme="dark"]) .vsr { ${paletteDark} }`}
      </style>
      <div
        ref={boxRef}
        className="vsr-box"
        style={{ aspectRatio: `${W} / ${controls ? stageH : stageH - 48}` }}
        onPointerEnter={() => (hover.current = 0.85)}
        onPointerLeave={() => (hover.current = 1)}
      >
        <div className="vsr-stage" style={{ height: stageH, marginTop: controls ? 0 : -48 }}>
          <div role="img" aria-label={aria} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <svg className="vsr-plane" viewBox={`0 0 ${W} ${PLANE_H}`} aria-hidden>
            <polygon className="vsr-s-l vsr-edge" points={poly([top[3], top[2], [top[2][0], top[2][1] + 10], [top[3][0], top[3][1] + 10]])} />
            <polygon className="vsr-s-r vsr-edge" points={poly([top[2], top[1], [top[1][0], top[1][1] + 10], [top[2][0], top[2][1] + 10]])} />
            <polygon className="vsr-s-t vsr-edge" points={poly(top)} />
            <path className="vsr-grid" d={gridLines.join(" ")} />
            {model.topicCenters.map((c, t) => (
              <ellipse key={t} className="vsr-cl" opacity="0" cx={c.sx} cy={c.sy} rx={SX * Math.SQRT2 * 0.39} ry={SY * Math.SQRT2 * 0.39} style={{ ...topicVars(t), stroke: "var(--tc)", fill: "color-mix(in oklab, var(--tc) 9%, transparent)" }} />
            ))}
            {model.edges.map(([a, b], i) => (
              <line
                key={i}
                className="vsr-link"
                x1={model.docs[a].sx}
                y1={model.docs[a].sy}
                x2={model.docs[b].sx}
                y2={model.docs[b].sy}
                pathLength={1}
                strokeDasharray="0 1"
                opacity="0"
                style={{
                  ...(model.docs[a].topic === model.docs[b].topic ? topicVars(model.docs[a].topic) : null),
                  stroke: model.docs[a].topic === model.docs[b].topic ? "color-mix(in oklab, var(--tc) 65%, transparent)" : "var(--vsr-t3)",
                }}
              />
            ))}
            <path className="vsr-path" d="M0 0" opacity="0" />
            {model.matches.map((mt, i) => (
              <line key={`ml${i}`} className="vsr-mline" x1={model.docs[mt.i].sx} y1={model.docs[mt.i].sy} x2={model.qp.sx} y2={model.qp.sy} pathLength={1} strokeDasharray="0 1" opacity="0" />
            ))}
            <ellipse className="vsr-ring" rx="0" ry="0" opacity="0" />
            {model.docs
              .map((d, i) => ({ d, i }))
              .sort((a, b) => a.d.sy - b.d.sy)
              .map(({ d, i }) => (
                <g key={i} data-doc={i} opacity="0" style={topicVars(d.topic)}>
                  <rect className="vsr-pt" x="-4.5" y="-6" width="9" height="12" rx="1.6" style={{ ["--f" as string]: 0, fill: "color-mix(in oklab, var(--tc) calc(var(--f) * 100%), var(--vsr-surface))", stroke: "color-mix(in oklab, var(--vsr-t3) calc((1 - var(--f)) * 100%), var(--vsr-surface))" }} />
                  <path d="M-2.2 -2.4 H2.2 M-2.2 0.4 H2.2 M-2.2 3 H0.6" stroke="var(--vsr-t3)" strokeWidth="1" strokeLinecap="round" fill="none" />
                </g>
              ))}
            {model.matches.map((mt, i) => (
              <circle key={`h${i}`} className="vsr-halo" r="9" opacity="0" cx="0" cy="0" transform={`translate(${model.docs[mt.i].sx} ${model.docs[mt.i].sy})`} />
            ))}
            <ellipse className="vsr-q-sh" rx="9" ry="4.2" cx={model.qp.sx} cy={model.qp.sy + 2} opacity="0" />
            <g className="vsr-q" opacity="0">
              <path className="vsr-q-stem" d="M0 0 V0" fill="none" />
              <circle className="vsr-q-ring" r="7.5" />
              <circle className="vsr-q-dot" r="3" />
            </g>
            <circle className="vsr-sig-glow" r="12" opacity="0" />
            <circle className="vsr-sig" r="4.4" opacity="0" />
          </svg>
          {/* HTML chips on the plane */}
          <div style={{ position: "absolute", left: 0, top: 48, width: W, height: PLANE_H, pointerEvents: "none" }}>
            {model.topicCenters.map((_, t) => (
              <span key={t} className="vsr-chip vsr-chip-t" style={topicVars(t)}>
                <i />
                {topicName(t)}
              </span>
            ))}
            {model.matches.map((mt, i) => (
              <span key={i} className="vsr-chip vsr-score">
                {mt.sim.toFixed(2)}
              </span>
            ))}
            <span className="vsr-chip vsr-chip-q">{L.queryChip}</span>
          </div>

          <div className="vsr-cap" data-f="cap" aria-hidden />
          <div className="vsr-stats" aria-hidden>
            <div className="vsr-stat">
              <span>{L.embedded}</span>
              <b data-f="n-embedded">0/{model.n}</b>
            </div>
            <div className="vsr-stat">
              <span>{L.links}</span>
              <b data-f="n-links">0</b>
            </div>
            <div className="vsr-stat">
              <span>{L.hops}</span>
              <b data-f="n-hops">0</b>
            </div>
          </div>
          <div className="vsr-read" aria-hidden>
            <div className="vsr-read-h">
              <span data-f="read-head">{L.embedding}</span>
              <span>{new Intl.NumberFormat("en-US").format(dimensions)} dims</span>
            </div>
            <span className="vsr-read-t" data-f="read-title" />
            <div className="vsr-bars" data-f="bars">
              {Array.from({ length: BARS }, (_, b) => (
                <span key={b} className="vsr-bar">
                  <i />
                  <i />
                </span>
              ))}
            </div>
          </div>
          <div className="vsr-res" style={{ top: RES_TOP }}>
            <span className="vsr-res-h" style={{ position: "absolute", top: -26 }} aria-hidden>
              {L.results}
            </span>
            {model.matches.map((mt, i) => {
              const d = model.docs[mt.i]
              return (
                <div key={i} className="vsr-row" style={{ top: i * ROW_H, ...(d.source?.color ? ({ "--ic": d.source.color } as React.CSSProperties) : null) }}>
                  <div className="vsr-row-top">
                    <span className="vsr-rank">{i + 1}</span>
                    {d.source?.icon ? <span className="vsr-src">{d.source.icon}</span> : null}
                    <span className="vsr-title">{d.title}</span>
                    <span className="vsr-sc">{mt.sim.toFixed(2)}</span>
                  </div>
                  <span className="vsr-rbar">
                    <i />
                  </span>
                </div>
              )
            })}
          </div>
          </div>
          {controls ? (
            <div className="vsr-ctrl">
              <button type="button" className="vsr-pause" aria-pressed={localPaused} aria-label={localPaused ? "Play" : "Pause"} onClick={() => setLocalPaused((v) => !v)}>
                {localPaused ? <Play strokeWidth={1.8} /> : <Pause strokeWidth={1.8} />}
              </button>
              <div className="vsr-steps" role="group" aria-label="Stages" onKeyDown={onKey}>
                {STAGE_NAMES.map((n, i) => (
                  <button key={i} type="button" className="vsr-step" aria-label={`Step ${i + 1} of 4: ${n}`} onClick={() => seek(i)}>
                    <span className="vsr-step-l">{n}</span>
                    <span className="vsr-seg">
                      <i />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </figure>
  )
}

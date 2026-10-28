"use client"

import * as React from "react"
import { Check, Search, X } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ResonanceItem = {
  /** Stable id: rows are matched by it when they reorder. */
  id: string
  title: string
  /** One or two sentences. Words that match the query are marked. */
  snippet: string
  /** Small label after the title, e.g. the collection. */
  source?: string
  /** Extra phrases that count as matches (synonyms), weighted below the title. */
  tags?: string[]
}

export type ResonanceSearchProps = {
  /** What to search. Omit it to get the built-in help-center scene. */
  items?: ResonanceItem[]
  /** The query. Makes the field controlled. */
  query?: string
  /** Starting query when uncontrolled. */
  defaultQuery?: string
  /** Every change of the query: typing, clearing, the simulated typist. */
  onQueryChange?: (query: string) => void
  /** Ready-made relevance by item id, 0 to 1 (for example from a vector search). Replaces the built-in scorer. */
  scores?: Record<string, number>
  /** Your own scorer, 0 to 1. Called on every keystroke for every item. Ignored when `scores` is set. */
  score?: (query: string, item: ResonanceItem) => number
  /** How many rows to show. */
  limit?: number
  /** Types a few queries by itself so the piece is alive. `true` uses the demo queries, an array uses yours. It stops the moment someone touches the field. Defaults to on only for the built-in scene. */
  autoPlay?: boolean | readonly string[]
  /** Enter or a click on a row. */
  onOpen?: (item: ResonanceItem) => void
  /** The consequence of opening the highlighted row, shown in the footer next to the Enter key. */
  openLabel?: string | ((item: ResonanceItem) => string)
  /** What the row and footer say after a row was opened. */
  openedLabel?: string
  /** Heading above the field. */
  title?: string
  /** Quiet context at the right of the heading, for example who the search is for. */
  context?: React.ReactNode
  placeholder?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                  Demo data                                 */
/* -------------------------------------------------------------------------- */

const DEMO_ITEMS: ResonanceItem[] = [
  {
    id: "dup-charge",
    title: "Refund a duplicate charge",
    source: "Billing",
    snippet: "If an order was charged twice, refund the second payment from the order page. The money reaches the card in 3 to 5 business days.",
    tags: ["double charge", "charged twice", "money back", "payment", "reverse"],
  },
  {
    id: "pause-plan",
    title: "Pause or cancel your plan",
    source: "Plans",
    snippet: "Pause a plan for up to three months or cancel at the end of the billing period. Unused credit is refunded pro rata.",
    tags: ["subscription", "hold", "suspend", "summer", "holiday", "stop", "renewal", "refund", "charge"],
  },
  {
    id: "update-card",
    title: "Update the card on an invoice",
    source: "Billing",
    snippet: "Swap the payment card on an open invoice without voiding it. The new card is charged on the next attempt.",
    tags: ["new card", "payment method", "credit card", "debit", "billing details"],
  },
  {
    id: "declined",
    title: "Why a payment was declined",
    source: "Billing",
    snippet: "Banks decline charges for expired cards, address mismatches or 3-D Secure failures. Retry after checking the details.",
    tags: ["failed", "rejected", "card", "error", "charge", "bank", "double hold"],
  },
  {
    id: "invoices",
    title: "Download invoices and receipts",
    source: "Billing",
    snippet: "Every charge has a PDF invoice and receipt. Download one, or export a year of them as a single file.",
    tags: ["pdf", "statement", "tax", "vat", "receipt", "history", "export", "charges", "billing"],
  },
  {
    id: "billing-email",
    title: "Change the billing email",
    source: "Account",
    snippet: "Invoices go to the billing email. Change it under Settings, then Billing, and we verify the new address.",
    tags: ["contact", "address", "receipts", "invoice", "billing"],
  },
  {
    id: "reset-password",
    title: "Reset a forgotten password",
    source: "Account",
    snippet: "Request a reset link from the sign-in page. Links expire after 30 minutes and work once.",
    tags: ["login", "sign in", "locked out", "credentials"],
  },
  {
    id: "two-step",
    title: "Set up two-step sign-in",
    source: "Security",
    snippet: "Add an authenticator app or a security key so a stolen password alone cannot open the account.",
    tags: ["2fa", "authenticator", "code", "login", "protect"],
  },
]

const DEMO_QUERIES = ["invoice for a double charge", "cancel my plan and get a refund", "download the vat invoice"]

/* -------------------------------------------------------------------------- */
/*                                   Scoring                                  */
/* -------------------------------------------------------------------------- */

const STOP = new Set(
  "a an the for my on of to in over and or is i how do me it we with from at by can need our your this that when what why are be into was were has have had get".split(" "),
)

/** A tiny stemmer: enough for "charged", "charge" and "charges" to meet. */
function stem(word: string): string {
  let s = word.toLowerCase()
  if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1)
  if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3)
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2)
  if (s.length > 4 && s.endsWith("e")) s = s.slice(0, -1)
  return s
}

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

function queryStems(query: string): string[] {
  return words(query)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)
}

/** 1 for an exact stem, 0.75 for a prefix (the word is still being typed). */
function hit(q: string, fields: string[]): number {
  let best = 0
  for (const f of fields) {
    if (f === q) return 1
    if (q.length > 1 && f.startsWith(q)) best = 0.75
  }
  return best
}

const itemStems = (item: ResonanceItem) =>
  new Set([...words(item.title), ...words((item.tags ?? []).join(" ")), ...words(item.snippet)].filter((w) => w.length > 2 && !STOP.has(w)).map(stem))

/**
 * Stand-in for an embedding search: how much of the query is covered, with a title hit worth more than a
 * tag (synonym) hit, a tag hit worth more than a word in the snippet, and a whole tag phrase ("double charge")
 * worth more than any single word. Pass `scores` or `score` for real vectors.
 */
function defaultScore(query: string, item: ResonanceItem): number {
  const qs = queryStems(query)
  if (!qs.length) return 0
  const fields: [number, string[]][] = [
    [3, words(item.title).map(stem)],
    [2.2, words((item.tags ?? []).join(" ")).map(stem)],
    [1, words(item.snippet).map(stem)],
  ]
  const joined = ` ${qs.join(" ")} `
  const phrase = new Set<string>()
  for (const tag of item.tags ?? []) {
    const ts = words(tag).map(stem)
    if (ts.length > 1 && joined.includes(` ${ts.join(" ")} `)) for (const t of ts) phrase.add(t)
  }
  let sum = 0
  let inTitle = 0
  let density = 0
  for (const q of qs) {
    let best = phrase.has(q) ? 3.5 : 0
    for (const [weight, stems] of fields) best = Math.max(best, weight * hit(q, stems))
    sum += best
    inTitle += hit(q, fields[0][1])
    density += hit(q, fields[2][1])
  }
  /* Ties break toward more title hits, then more words in the snippet. */
  const nudge = 0.03 * (inTitle / qs.length) + 0.015 * (density / qs.length)
  return Math.min(0.98, (sum / (3.5 * qs.length)) * 0.95 + nudge)
}

type Ranked = { item: ResonanceItem; rel: number }

const MIN_REL = 0.1
const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

/**
 * Every item with its relevance, strongest first. Memoize the call: `score` and `scores` should keep their identity
 * between renders. With the built-in scorer, articles that share words with the leader get a graded share of its score
 * (as vectors would) and the ladder is made strictly descending, so no two rows show the same number.
 */
function rank(
  items: ResonanceItem[],
  query: string,
  scores: ResonanceSearchProps["scores"],
  score: ResonanceSearchProps["score"],
): Ranked[] {
  if (!query.trim()) return items.map((item) => ({ item, rel: 0 }))
  const builtIn = !scores && !score
  const out = items
    .map((item, i) => {
      const raw = scores ? (scores[item.id] ?? 0) : score ? score(query, item) : defaultScore(query, item)
      return { item, rel: Math.round(clamp01(raw) * 100) / 100, i }
    })
    .sort((a, b) => b.rel - a.rel || a.i - b.i)
  if (builtIn && out.length > 1 && out[0].rel >= 0.25) {
    const lead = out[0]
    const ls = itemStems(lead.item)
    for (const r of out.slice(1)) {
      const rs = itemStems(r.item)
      let both = 0
      for (const w of rs) if (ls.has(w)) both += 1
      const near = Math.min(0.55, (3.4 * both) / Math.max(1, rs.size + ls.size - both)) * lead.rel
      r.rel = Math.max(r.rel, Math.round(near * 100) / 100)
    }
    out.sort((a, b) => b.rel - a.rel || a.i - b.i)
    for (let k = 1; k < out.length; k++) if (out[k].rel > 0 && out[k].rel >= out[k - 1].rel) out[k].rel = Math.max(0, Math.round((out[k - 1].rel - 0.01) * 100) / 100)
  }
  return out.map(({ item, rel }) => ({ item, rel }))
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

function levelWord(rel: number, rankIndex: number): string {
  if (rankIndex === 0) return rel >= 0.6 ? "Top match" : "Best guess"
  return rel >= 0.7 ? "Strong" : rel >= 0.4 ? "Related" : "Loose"
}

/** Wraps the words that match the query in <mark>. */
function highlight(text: string, stems: string[]): React.ReactNode {
  if (!stems.length) return text
  return text.split(/([\p{L}\p{N}]+)/u).map((part, i) => {
    if (i % 2 === 0) return part
    const s = stem(part)
    const on = stems.some((q) => s === q || (q.length > 1 && s.startsWith(q)))
    return on ? <mark key={i}>{part}</mark> : part
  })
}

/* -------------------------------------------------------------------------- */
/*                               The standing wave                            */
/* -------------------------------------------------------------------------- */

const W = 400
const H = 46
const MID = H / 2
const AMAX = 21
const SAMPLES = 72
const FLIP_MS = 480
const LIM = MID - 2

/** Number of half-waves: a well-tuned row rings in its fundamental, a poor match in a higher, busier mode. */
const harmonic = (rel: number, best = false) => (best || rel >= 0.8 ? 1 : 1 + Math.round((1 - rel) * 3.4))
/** Relevance to pixels: a gentle curve so a middling match still reads as a clear string. */
const ampOf = (rel: number) => AMAX * Math.pow(rel, 0.7)

type Shape = { fill: string; g1: string; g2: string; trail: string; line: string }

/**
 * One string, fixed at both ends. `amp` is the relevance in pixels, `n` the mode.
 * `e` is how much it is ringing right now (0 = still, 1 = full), `t` the seconds since it was struck.
 * Besides the string there are two quiet overtones (ghosts) and a trail that lags a few frames behind it.
 */
function wavePath(amp: number, n: number, e: number, t: number): Shape {
  const w1 = 2 * Math.PI * (3 + 1.4 * n)
  const w2 = 2 * Math.PI * (5.5 + 1.6 * n)
  const kick = 1 + 0.6 * e
  const mk = (a: number, mode: number, osc: number, over: number) => {
    let d = ""
    for (let i = 0; i <= SAMPLES; i++) {
      const x = i / SAMPLES
      const taper = Math.pow(Math.sin(Math.PI * x), 0.35)
      const base = taper * Math.sin(Math.PI * mode * x)
      const ov = taper * Math.sin(Math.PI * (mode + 1.5) * x) * 0.35
      const raw = a * kick * (base * (1 - e + e * osc) + ov * e * over)
      const v = LIM * Math.tanh(raw / LIM)
      d += `${i ? "L" : "M"}${(x * W).toFixed(1)},${(MID - v).toFixed(2)}`
    }
    return d
  }
  const line = mk(amp, n, Math.cos(w1 * t), Math.sin(w2 * t))
  const ringing = e > 0.02
  return {
    line,
    fill: `${line}L${W},${MID}L0,${MID}Z`,
    trail: ringing ? mk(amp, n, Math.cos(w1 * (t - 0.05)), Math.sin(w2 * (t - 0.05))) : line,
    g1: mk(amp * 0.34, n + 1, Math.cos(w1 * 1.37 * t + 1), 0),
    g2: mk(amp * 0.2, n + 2, Math.cos(w1 * 1.9 * t + 2), 0),
  }
}

/** The cubic-bezier(.22, 1, .36, 1) curve, so a reorder interrupted halfway knows where its rows are. */
function ease(p: number): number {
  const x1 = 0.22
  const y1 = 1
  const x2 = 0.36
  const y2 = 1
  let t = p
  for (let i = 0; i < 8; i++) {
    const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - p
    const dx = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t
    if (Math.abs(cx) < 1e-4 || dx < 1e-6) break
    t -= cx / dx
  }
  t = Math.min(1, Math.max(0, t))
  return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3
}

type WaveState = { amp: number; n: number; e: number; up: number; k: number }
type Flip = { from: number; t0: number; anim: Animation }
type Target = { amp: number; n: number }

/**
 * One requestAnimationFrame loop for the whole list. It only runs while something is ringing or easing, writes the
 * `d` attribute of each wave straight to the DOM (no React renders per frame) and also remembers where the FLIP
 * reorder has the rows, so a new keystroke can interrupt a reorder without a jump.
 */
class Engine {
  list: HTMLElement | null = null
  live: () => boolean = () => true
  reduced = false
  ready = false
  hit: string | null = null
  states = new Map<string, WaveState>()
  targets = new Map<string, Target>()
  flips = new Map<string, Flip>()
  tops = new Map<string, number>()
  raf = 0
  last = 0
  clock = 0

  attach(list: HTMLElement | null, live: () => boolean) {
    this.list = list
    this.live = live
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.last = 0
    this.ready = false
    for (const f of this.flips.values()) f.anim.cancel()
    this.flips.clear()
  }

  start() {
    if (!this.raf && !this.reduced) this.raf = requestAnimationFrame(this.tick)
  }

  /** `hit` is a row that was just chosen: it gets one last, full ring. */
  setTargets(map: Map<string, Target>, reduced: boolean, hit: string | null) {
    this.reduced = reduced
    this.targets = map
    for (const [id, t] of map) {
      let st = this.states.get(id)
      if (!st) {
        st = { amp: reduced ? t.amp : 0, n: t.n, e: 0, up: 0, k: this.clock }
        this.states.set(id, st)
      }
      if (!reduced && (t.amp > 0.5 || st.amp > 0.5)) this.strike(st, 0.32)
    }
    const chosen = hit ? this.states.get(hit) : undefined
    if (chosen && !reduced && hit !== this.hit) {
      chosen.k = this.clock
      chosen.e = 1
      this.strike(chosen, 0.55)
    }
    this.hit = hit
    for (const id of [...this.states.keys()]) if (!map.has(id)) this.states.delete(id)
    if (reduced) this.snap()
    else {
      this.draw()
      this.start()
    }
  }

  strike(st: WaveState, seconds: number) {
    if (st.e < 0.05) st.k = this.clock
    st.up = Math.max(st.up, seconds)
  }

  pluck(id: string | null) {
    const st = id ? this.states.get(id) : undefined
    if (!st || this.reduced || st.amp < 0.5) return
    this.strike(st, 0.14)
    this.start()
  }

  snap() {
    for (const [id, st] of this.states) {
      const tg = this.targets.get(id)
      if (tg) {
        st.amp = tg.amp
        st.n = tg.n
      }
      st.e = 0
      st.up = 0
    }
    this.last = 0
    this.draw()
    for (const f of this.flips.values()) f.anim.cancel()
    this.flips.clear()
  }

  draw() {
    if (!this.list) return
    for (const svg of this.list.querySelectorAll<SVGSVGElement>("svg[data-svg]")) {
      const st = this.states.get(svg.dataset.svg ?? "")
      if (!st) continue
      const w = wavePath(st.amp, st.n, st.e, this.clock - st.k)
      const p = svg.querySelectorAll("path")
      if (p.length < 6) continue
      p[0].setAttribute("d", w.fill)
      p[1].setAttribute("d", w.g1)
      p[2].setAttribute("d", w.g2)
      p[3].setAttribute("d", w.trail)
      p[3].setAttribute("opacity", (st.e * 0.5).toFixed(2))
      p[4].setAttribute("d", w.line)
      p[5].setAttribute("d", w.line)
    }
  }

  tick = (now: number) => {
    this.raf = 0
    if (!this.live()) {
      this.snap()
      return
    }
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60
    this.last = now
    this.clock += dt
    const ease1 = 1 - Math.exp(-dt / 0.14)
    const rise = 1 - Math.exp(-dt / 0.04)
    const decay = Math.exp(-dt / 0.34)
    let busy = false
    for (const [id, st] of this.states) {
      const tg = this.targets.get(id)
      if (!tg) continue
      st.amp += (tg.amp - st.amp) * ease1
      st.n += (tg.n - st.n) * ease1
      if (st.up > 0) {
        st.up -= dt
        st.e += (1 - st.e) * rise
      } else {
        st.e *= decay
        if (st.e < 0.012) st.e = 0
      }
      if (st.e > 0 || st.up > 0 || Math.abs(tg.amp - st.amp) > 0.04 || Math.abs(tg.n - st.n) > 0.01) busy = true
      else {
        st.amp = tg.amp
        st.n = tg.n
      }
    }
    this.draw()
    if (busy) this.raf = requestAnimationFrame(this.tick)
    else this.last = 0
  }

  /**
   * FLIP: rows are already in their new places; slide each one from where it was (or visually still is).
   * A row that is new to the list blurs in (here, not in CSS: a CSS animation would restart every time React moves the node).
   */
  flip() {
    if (!this.list) return
    const now = performance.now()
    const next = new Map<string, number>()
    for (const li of this.list.querySelectorAll<HTMLElement>("[data-row]")) {
      const id = li.dataset.row ?? ""
      const top = li.offsetTop
      next.set(id, top)
      const prev = this.tops.get(id)
      if (this.reduced) continue
      if (prev === undefined) {
        if (this.ready) li.animate([{ opacity: 0, filter: "blur(3px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 360, easing: "cubic-bezier(.22, 1, .36, 1)" })
        continue
      }
      const f = this.flips.get(id)
      const cur = f ? f.from * (1 - ease(Math.min(1, (now - f.t0) / FLIP_MS))) : 0
      const d = prev + cur - top
      if (Math.abs(d) < 0.5) continue
      f?.anim.cancel()
      const anim = li.animate([{ transform: `translateY(${d}px)` }, { transform: "translateY(0)" }], {
        duration: FLIP_MS,
        easing: "cubic-bezier(.22, 1, .36, 1)",
      })
      this.flips.set(id, { from: d, t0: now, anim })
    }
    for (const id of [...this.flips.keys()]) if (!next.has(id)) this.flips.delete(id)
    this.tops = next
    this.ready = true
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.irz {
  --irz-ink: #000;
  --irz-surface: #fff;
  --irz-accent: #0060e2;
  --irz-t1: color-mix(in oklab, var(--irz-ink) 88%, transparent);
  --irz-t2: color-mix(in oklab, var(--irz-ink) 61%, transparent);
  --irz-t3: color-mix(in oklab, var(--irz-ink) 45%, transparent);
  --irz-t4: color-mix(in oklab, var(--irz-ink) 27%, transparent);
  --irz-fill: color-mix(in oklab, var(--irz-ink) 6%, transparent);
  --irz-line: color-mix(in oklab, var(--irz-ink) 6%, transparent);
  --irz-hair: color-mix(in oklab, var(--irz-ink) 13%, transparent);
  --irz-str: var(--irz-t3);
  --irz-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --irz-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .12), 0 3px 8px -2px rgb(0 0 0 / .12);
  --irz-glint: rgb(255 255 255 / .8);
  --irz-ease: cubic-bezier(.22, 1, .36, 1);
  --irz-pad: 6px;
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 680px;
  color: var(--irz-t1);
  font: 13px/20px var(--irz-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .irz {
  --irz-ink: #fff;
  --irz-surface: #1c1c1e;
  --irz-accent: #4d8dff;
  --irz-t1: color-mix(in oklab, var(--irz-ink) 90%, transparent);
  --irz-t2: color-mix(in oklab, var(--irz-ink) 62%, transparent);
  --irz-t3: color-mix(in oklab, var(--irz-ink) 46%, transparent);
  --irz-t4: color-mix(in oklab, var(--irz-ink) 28%, transparent);
  --irz-fill: color-mix(in oklab, var(--irz-ink) 8%, transparent);
  --irz-line: color-mix(in oklab, var(--irz-ink) 8%, transparent);
  --irz-hair: color-mix(in oklab, var(--irz-ink) 16%, transparent);
  --irz-str: color-mix(in oklab, var(--irz-ink) 52%, transparent);
  --irz-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --irz-float: 0 0 0 .5px rgb(255 255 255 / .14), 0 4px 10px -2px rgb(0 0 0 / .5);
  --irz-glint: rgb(255 255 255 / .12);
}
.irz *, .irz *::before, .irz *::after { box-sizing: border-box }
:where(.irz) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.irz :focus-visible { outline: 2px solid color-mix(in oklab, var(--irz-accent) 60%, transparent); outline-offset: 1px }

.irz-card { --irz-rh: 104px; background: var(--irz-surface); border-radius: 16px; box-shadow: var(--irz-shadow); overflow: hidden }
.irz-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Head: title, field, readout */
.irz-head { padding: 14px 12px 12px }
.irz-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 4px 10px }
.irz-title { margin: 0; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--irz-t1) }
.irz-ctx { display: inline-flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; color: var(--irz-t3) }
.irz-ctx > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.irz-ctx::before { content: ""; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--irz-accent) }

.irz-field {
  position: relative; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 12px;
  border-radius: 10px; background: var(--irz-fill); color: var(--irz-t3); transition: box-shadow .2s var(--irz-ease);
}
.irz-field:focus-within { box-shadow: 0 0 0 .5px color-mix(in oklab, var(--irz-accent) 76%, transparent), 0 0 0 3px color-mix(in oklab, var(--irz-accent) 22%, transparent) }
.irz-field svg { flex: none }
.irz-input {
  flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 0; outline: 0; background: transparent;
  font: inherit; font-size: 14.5px; line-height: 20px; color: var(--irz-t1);
}
.irz .irz-input:focus-visible { outline: 0 }
.irz-input::placeholder { color: var(--irz-t3); opacity: 1 }
.irz-field[data-auto] .irz-input { color: transparent; caret-color: transparent }
.irz-ghost {
  position: absolute; left: 36px; right: 44px; top: 0; bottom: 0; display: flex; align-items: center; overflow: hidden;
  font-size: 14.5px; line-height: 20px; color: var(--irz-t1); white-space: pre; pointer-events: none;
}
.irz-caret { flex: none; width: 1.5px; height: 18px; margin-left: 1px; border-radius: 1px; background: var(--irz-accent); animation: irz-blink 1.1s ease-in-out infinite }
.irz-clear { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; color: var(--irz-t3); transition: background-color .15s, color .15s }
.irz-clear:hover { background: var(--irz-fill); color: var(--irz-t1) }

.irz-meta { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; min-height: 32px; padding: 8px 4px 0 4px }
.irz-count { font-size: 12px; line-height: 20px; color: var(--irz-t3) }
/* The whole library as bars: tall = strong; the ones lit are on the list, the rest are cut off */
.irz-spec { display: inline-flex; flex: none; align-items: flex-end; gap: 3px; height: 24px }
.irz-spec i {
  display: block; width: 5px; height: calc(3px + var(--h, 0) * 21px); border-radius: 2px; background: var(--irz-t4); opacity: .55;
  transition: height .5s var(--irz-ease), background-color .4s var(--irz-ease), opacity .4s var(--irz-ease);
}
.irz-spec i[data-lit] { background: var(--irz-str); opacity: 1 }
.irz-spec i[data-top] { background: var(--irz-accent) }

/* The list: a quiet well, one lifted tile that glides to the active row, rows that are strings */
.irz-list { position: relative; margin: 0 12px; padding: var(--irz-pad); border-radius: 12px; background: var(--irz-fill); box-shadow: inset 0 .5px 0 var(--irz-glint) }
.irz-rows {
  position: relative; z-index: 1; margin: 0; padding: 0; list-style: none; height: calc(var(--irz-n, 5) * var(--irz-rh));
  transition: height .48s var(--irz-ease);
}
.irz-tile {
  position: absolute; z-index: 0; left: var(--irz-pad); right: var(--irz-pad); top: var(--irz-pad); height: var(--irz-rh);
  border-radius: 10px; background: var(--irz-surface); box-shadow: var(--irz-float), inset 0 .5px 0 var(--irz-glint); opacity: 0; pointer-events: none;
  transform: translateY(calc(var(--irz-i, 0) * var(--irz-rh)));
  transition: transform .48s var(--irz-ease), opacity .2s;
}
:is(.dark, [data-theme="dark"]) .irz-tile { background: color-mix(in oklab, var(--irz-surface) 88%, var(--irz-ink)) }
.irz-tile[data-on] { opacity: 1 }
html[data-style="glass"] .irz-list { background: color-mix(in oklab, var(--irz-surface) 22%, transparent); box-shadow: inset 0 0 0 .5px var(--irz-hair), inset 0 1px 0 var(--irz-glint) }
html[data-style="glass"] .irz-tile { background: color-mix(in oklab, var(--irz-surface) 78%, transparent) }
.irz-row {
  position: relative; display: flex; flex-direction: column; height: var(--irz-rh); padding: 10px 12px 8px; border-radius: 10px; cursor: pointer;
}
.irz-row[data-idle] { cursor: default }
.irz-top { display: flex; align-items: baseline; gap: 8px; height: 22px; transition: opacity .4s var(--irz-ease) }
.irz-ti { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; line-height: 22px; color: var(--irz-t1) }
.irz-src { flex: none; font-size: 11.5px; color: var(--irz-t3) }
.irz-end { display: flex; flex: none; align-items: baseline; gap: 8px; margin-left: auto }
.irz-lvl { font-size: 11.5px; color: var(--irz-t3); white-space: nowrap }
.irz-lvl svg { display: inline-block; margin: 0 3px 0 0; vertical-align: -2px }
.irz-score { min-width: 2.5em; font-size: 13px; text-align: right; font-variant-numeric: tabular-nums; color: var(--irz-t2) }
.irz-sn {
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; height: 18px; margin: 0; overflow: hidden;
  font-size: 12.5px; line-height: 18px; color: var(--irz-t2); transition: opacity .4s var(--irz-ease);
}
.irz mark { margin: 0 -1px; padding: 0 1px; border-radius: 3px; background: color-mix(in oklab, var(--irz-accent) 15%, transparent); color: var(--irz-t1) }
.irz-rows[data-open] .irz-row:not([data-opened]) :is(.irz-top, .irz-sn) { opacity: .5 }

/* The string: its own band, ringing harmonics around it, pinned at both ends */
.irz-wave { position: relative; height: ${H}px; margin-top: auto }
.irz-wave svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible }
.irz-wave::before, .irz-wave::after {
  content: ""; position: absolute; top: 50%; width: 6px; height: 6px; margin-top: -3px; border-radius: 50%; background: var(--irz-t4);
  transition: background-color .4s var(--irz-ease), box-shadow .4s var(--irz-ease);
}
.irz-wave::before { left: -3px }
.irz-wave::after { right: -3px }
.irz-base { stroke: var(--irz-hair); stroke-width: 1; stroke-dasharray: 1 4; vector-effect: non-scaling-stroke }
.irz-row { --irz-rp: 0%; --irz-col: color-mix(in oklab, var(--irz-accent) var(--irz-rp), var(--irz-str)) }
.irz-line { fill: none; stroke: var(--irz-col); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; transition: stroke .4s var(--irz-ease) }
.irz-gh { fill: none; stroke: var(--irz-col); stroke-width: 1; vector-effect: non-scaling-stroke; opacity: .3; transition: stroke .4s var(--irz-ease) }
.irz-gh[data-b] { opacity: .18 }
.irz-trail { fill: none; stroke: var(--irz-col); stroke-width: 1.5; vector-effect: non-scaling-stroke }
.irz-glow { fill: none; stroke: var(--irz-accent); stroke-width: 7; stroke-linecap: round; vector-effect: non-scaling-stroke; opacity: 0; filter: blur(4px); transition: opacity .5s var(--irz-ease) }
.irz-fill { fill: color-mix(in oklab, var(--irz-accent) 14%, transparent); opacity: 0; transition: opacity .5s var(--irz-ease) }
.irz-row[data-active] { --irz-str: var(--irz-t2) }
.irz-row[data-top] .irz-fill, .irz-row[data-opened] .irz-fill { opacity: 1 }
.irz-row[data-top] .irz-glow, .irz-row[data-opened] .irz-glow { opacity: .22 }
.irz-row[data-top] .irz-line, .irz-row[data-opened] .irz-line { stroke-width: 2.1 }
.irz-row[data-top] .irz-wave::before, .irz-row[data-top] .irz-wave::after,
.irz-row[data-opened] .irz-wave::before, .irz-row[data-opened] .irz-wave::after { background: color-mix(in oklab, var(--irz-accent) 60%, transparent) }
.irz-row[data-top][data-lock] .irz-wave::before, .irz-row[data-top][data-lock] .irz-wave::after,
.irz-row[data-opened] .irz-wave::before, .irz-row[data-opened] .irz-wave::after {
  background: var(--irz-accent); box-shadow: 0 0 0 3px color-mix(in oklab, var(--irz-accent) 18%, transparent); animation: irz-lock .8s var(--irz-ease) backwards;
}
.irz-row[data-top] .irz-lvl, .irz-row[data-top] .irz-score { color: var(--irz-accent); font-weight: 500 }
.irz-row[data-opened] .irz-lvl { color: var(--irz-accent); font-weight: 500 }
.irz-row[data-idle] .irz-score { color: var(--irz-t4) }

.irz-empty { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 0 24px; text-align: center }
.irz-empty svg { width: 70%; max-width: 280px; height: 12px; margin-bottom: 8px; overflow: visible }
.irz-empty p { margin: 0 }
.irz-empty p:first-of-type { font-size: 14px; font-weight: 500; color: var(--irz-t1) }
.irz-empty p:last-of-type { font-size: 12.5px; color: var(--irz-t3) }

/* Footer: keys and the consequence of Enter */
.irz-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 46px; padding: 8px 16px 10px; font-size: 12px; color: var(--irz-t3) }
.irz-keys { display: inline-flex; flex: none; align-items: center; gap: 4px }
.irz-keys span { margin-left: 2px }
.irz-foot kbd {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 5px; background: var(--irz-fill);
  box-shadow: inset 0 -1px 0 var(--irz-line); font: inherit; font-size: 11px; line-height: 1; color: var(--irz-t2);
}
.irz-act { display: flex; align-items: center; justify-content: flex-end; gap: 6px; min-width: 0; color: var(--irz-t2); text-align: right }
.irz-act > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.irz-act[data-done] { color: var(--irz-accent) }
.irz-act[data-in] { animation: irz-in .3s var(--irz-ease) backwards }
.irz-act b { font-weight: 500; color: var(--irz-t1) }

@container (max-width: 520px) {
  .irz-card { --irz-rh: 122px }
  .irz-sn { -webkit-line-clamp: 2; height: 36px }
  .irz-src, .irz-keys { display: none }
  .irz-ctx { display: none }
  .irz-act > span { white-space: normal }
  .irz-foot { justify-content: flex-start }
  .irz-act { justify-content: flex-start; text-align: left }
  .irz-row:not([data-top]):not([data-opened]) .irz-lvl { display: none }
  .irz-foot { min-height: 60px }
}
@container (max-width: 420px) {
  .irz-row:not([data-opened]) .irz-lvl { display: none }
}

@keyframes irz-in { from { opacity: 0; filter: blur(3px) } to { opacity: 1; filter: blur(0) } }
@keyframes irz-blink { 0%, 100% { opacity: 1 } 50% { opacity: .15 } }
@keyframes irz-lock { 0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--irz-accent) 45%, transparent) } 100% { box-shadow: 0 0 0 9px transparent } }
@media (forced-colors: active) {
  .irz-field:focus-within { outline: 2px solid Highlight }
  .irz-line, .irz-gh, .irz-trail { stroke: CanvasText }
}
@media (prefers-reduced-motion: reduce) {
  .irz *, .irz *::before, .irz *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)")
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

type Choice = { id: string | null; q: string }

const BARS = 12

/**
 * Knowledge-base search where every result is a string. Its amplitude is how well the row matches the query: as you
 * type the strings ring and the rows reorder; once the query settles they damp into still shapes and the best match
 * locks into a single clean arch with its score. Open a row and its string snaps to one full arch while the rest go flat.
 * Keep `scores` and `score` referentially stable (module constant or useMemo): the ranking is recomputed when they change.
 */
export function ResonanceSearch({
  items,
  query,
  defaultQuery,
  onQueryChange,
  scores,
  score,
  limit = 5,
  autoPlay,
  onOpen,
  openLabel,
  openedLabel,
  title,
  context,
  placeholder,
  className,
}: ResonanceSearchProps) {
  const demo = items === undefined
  const data = items ?? DEMO_ITEMS
  const uid = React.useId()
  const reduced = React.useSyncExternalStore(subscribeMotion, readMotion, () => false)

  const wantsAuto = autoPlay === undefined ? demo && query === undefined && defaultQuery === undefined : autoPlay !== false
  const queries = Array.isArray(autoPlay) && autoPlay.length ? autoPlay : DEMO_QUERIES
  const queriesKey = queries.join("\u0001")

  const [auto, setAuto] = React.useState(wantsAuto)
  const [qState, setQState] = React.useState(() => defaultQuery ?? (wantsAuto && reduced ? queries[0] : ""))
  const q = query ?? qState
  const [settled, setSettled] = React.useState(q)
  const [picked, setPicked] = React.useState<Choice>({ id: null, q: "" })
  const [opened, setOpened] = React.useState<Choice>({ id: null, q: "" })

  const rootRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const tileRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const visible = React.useRef(true)
  const wake = React.useRef<(() => void) | null>(null)
  const commitRef = React.useRef((next: string) => void next)
  const [engine] = React.useState(() => new Engine())

  React.useLayoutEffect(() => {
    commitRef.current = (next: string) => {
      if (query === undefined) setQState(next)
      onQueryChange?.(next)
    }
  })

  const hasQuery = q.trim().length > 0
  const ranked = React.useMemo(() => rank(data, q, scores, score), [data, q, scores, score])
  const matched = React.useMemo(() => (hasQuery ? ranked.filter((r) => r.rel >= MIN_REL) : ranked), [ranked, hasQuery])
  const rows = React.useMemo(() => matched.slice(0, Math.max(1, limit)), [matched, limit])
  const qStems = React.useMemo(() => queryStems(q), [q])
  const isSettled = settled === q

  const activeId = !hasQuery || !rows.length ? null : picked.q === q && rows.some((r) => r.item.id === picked.id) ? picked.id : rows[0].item.id
  const activeIndex = rows.findIndex((r) => r.item.id === activeId)
  const active = activeIndex >= 0 ? rows[activeIndex] : null
  const openedItem = hasQuery && opened.q === q ? (rows.find((r) => r.item.id === opened.id)?.item ?? null) : null
  const openedId = openedItem?.id ?? null
  const top = hasQuery ? (rows[0] ?? null) : null
  const locked = Boolean(top && isSettled && top.rel >= 0.6)
  const noun = (n: number) => (demo ? plural(n, "article", "articles") : plural(n, "result", "results"))

  const sig = rows.map((r) => `${r.item.id}:${r.rel}`).join("|") + `#${openedId ?? ""}`
  const order = rows.map((r) => r.item.id).join("|")

  /* The engine owns the DOM of the waves and the FLIP; these effects only tell it what changed. */
  React.useLayoutEffect(() => {
    engine.attach(listRef.current, () => visible.current && !document.hidden)
    return () => engine.destroy()
  }, [engine])

  const rowsRef = React.useRef(rows)
  React.useLayoutEffect(() => {
    rowsRef.current = rows
  })

  React.useLayoutEffect(() => {
    const next = new Map<string, Target>()
    rowsRef.current.forEach((r, i) => {
      const id = r.item.id
      const best = i === 0 && r.rel > 0
      if (openedId) next.set(id, id === openedId ? { amp: AMAX * 0.98, n: 1 } : { amp: 0, n: harmonic(r.rel, best) })
      else next.set(id, { amp: ampOf(r.rel), n: harmonic(r.rel, best) })
    })
    engine.setTargets(next, reduced, openedId)
  }, [engine, sig, reduced, openedId])

  React.useLayoutEffect(() => {
    engine.flip()
  }, [engine, order])

  React.useLayoutEffect(() => {
    engine.pluck(activeId)
  }, [engine, activeId])

  /* One last pulse of the tile when a row is opened. */
  React.useLayoutEffect(() => {
    if (!openedId || reduced) return
    tileRef.current?.animate(
      [
        { boxShadow: "var(--irz-float), 0 0 0 0 color-mix(in oklab, var(--irz-accent) 50%, transparent)" },
        { boxShadow: "var(--irz-float), 0 0 0 10px transparent" },
      ],
      { duration: 800, easing: "cubic-bezier(.22, 1, .36, 1)" },
    )
  }, [openedId, reduced])

  /* Off screen or in a hidden tab, the typist and the loop wait. */
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting
      if (entry.isIntersecting) wake.current?.()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* The query counts as settled 650 ms after the last keystroke: the best match locks. */
  React.useEffect(() => {
    const id = window.setTimeout(() => setSettled(q), reduced ? 0 : 650)
    return () => window.clearTimeout(id)
  }, [q, reduced])

  /* The simulated typist for the demo scene. It sleeps (no timer at all) while hidden or off screen and wakes on return. */
  React.useEffect(() => {
    if (!auto || reduced) return
    const list = queriesKey.split("\u0001")
    let qi = 0
    let ci = 0
    let phase: "type" | "hold" = "type"
    let id = 0
    let asleep = false
    const awake = () => !document.hidden && visible.current
    const step = () => {
      if (!awake()) {
        asleep = true
        return
      }
      const text = list[qi % list.length]
      if (phase === "type") {
        ci += 1
        commitRef.current(text.slice(0, ci))
        if (ci >= text.length) {
          phase = "hold"
          id = window.setTimeout(step, 4200)
        } else {
          id = window.setTimeout(step, 56 + ((ci * 37) % 5) * 15 + (text[ci - 1] === " " ? 150 : 0))
        }
      } else {
        commitRef.current("")
        ci = 0
        qi += 1
        phase = "type"
        id = window.setTimeout(step, 750)
      }
    }
    const onWake = () => {
      if (asleep && awake()) {
        asleep = false
        id = window.setTimeout(step, 300)
      }
    }
    wake.current = onWake
    document.addEventListener("visibilitychange", onWake)
    id = window.setTimeout(step, 500)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener("visibilitychange", onWake)
      wake.current = null
    }
  }, [auto, reduced, queriesKey])

  function commit(next: string) {
    if (query === undefined) setQState(next)
    onQueryChange?.(next)
  }

  function open(item: ResonanceItem) {
    setOpened({ id: item.id, q })
    onOpen?.(item)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!rows.length || !hasQuery) return
      e.preventDefault()
      const step = e.key === "ArrowDown" ? 1 : -1
      const next = rows[(Math.max(0, activeIndex) + step + rows.length) % rows.length]
      setPicked({ id: next.item.id, q })
    } else if (e.key === "Enter") {
      if (active) {
        e.preventDefault()
        open(active.item)
      }
    } else if (e.key === "Escape" && q) {
      e.preventDefault()
      commit("")
    }
  }

  const label = (item: ResonanceItem) =>
    typeof openLabel === "function"
      ? openLabel(item)
      : (openLabel ?? (demo ? "Attach to the draft Sage sends Marta at 09:00" : `Open “${item.title}”`))
  const doneWord = openedLabel ?? (demo ? "Attached" : "Opened")

  const heading = title ?? (demo ? "Search the help center" : "Search")
  const ctx = context ?? (demo ? "Sage is drafting a reply to HF-4821" : null)
  const live = openedItem
    ? `${doneWord}: ${openedItem.title}.`
    : auto || !isSettled || !hasQuery
      ? ""
      : top
        ? `${matched.length} ${noun(matched.length)} ${plural(matched.length, "matches", "match")}. Top match: ${top.item.title}, ${top.rel.toFixed(2)}.`
        : "Nothing matches."

  const bars = ranked.slice(0, BARS)
  const rowCount = hasQuery && !rows.length ? 1.6 : rows.length

  return (
    <div
      ref={rootRef}
      className={["irz", className].filter(Boolean).join(" ")}
      onPointerDownCapture={() => auto && setAuto(false)}
    >
      <style href="resonance-search" precedence="default">
        {CSS}
      </style>
      <div className="irz-card">
        <div className="irz-head">
          <div className="irz-bar">
            <p className="irz-title">{heading}</p>
            {ctx ? <span className="irz-ctx"><span>{ctx}</span></span> : null}
          </div>
          <div className="irz-field" data-auto={auto ? "" : undefined}>
            <Search size={16} strokeWidth={1.75} aria-hidden />
            <input
              ref={inputRef}
              className="irz-input"
              type="text"
              role="combobox"
              aria-label={heading}
              aria-expanded={rows.length > 0 && hasQuery}
              aria-controls={`${uid}-list`}
              aria-activedescendant={active ? `${uid}-o${activeIndex}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder ?? (demo ? "Describe the customer's problem" : "Search")}
              value={q}
              onFocus={(e) => {
                if (auto) setAuto(false)
                e.currentTarget.select()
              }}
              onChange={(e) => {
                setAuto(false)
                commit(e.target.value)
              }}
              onKeyDown={onKeyDown}
            />
            {auto ? (
              <div className="irz-ghost" aria-hidden>
                {q}
                <i className="irz-caret" />
              </div>
            ) : null}
            {q ? (
              <button
                type="button"
                className="irz-clear"
                aria-label="Clear search"
                onClick={() => {
                  commit("")
                  inputRef.current?.focus()
                }}
              >
                <X size={14} strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </div>
          <div className="irz-meta">
            <span className="irz-count">
              {!hasQuery
                ? `${data.length} ${noun(data.length)}. Type to tune the strings.`
                : `${matched.length} of ${data.length} ${noun(data.length)} ${plural(matched.length, "resonates", "resonate")}`}
            </span>
            <span className="irz-spec" aria-hidden>
              {bars.map((r, i) => {
                const lit = hasQuery && i < rows.length
                return <i key={i} style={{ "--h": hasQuery ? r.rel : 0 } as React.CSSProperties} data-lit={lit ? "" : undefined} data-top={lit && i === 0 ? "" : undefined} />
              })}
            </span>
          </div>
        </div>

        <div className="irz-list" ref={listRef}>
          <div
            ref={tileRef}
            className="irz-tile"
            data-on={active ? "" : undefined}
            style={{ "--irz-i": Math.max(0, activeIndex) } as React.CSSProperties}
            aria-hidden
          />
          <ul
            className="irz-rows"
            role="listbox"
            id={`${uid}-list`}
            aria-label="Results, strongest first"
            data-open={openedItem ? "" : undefined}
            style={{ "--irz-n": rowCount } as React.CSSProperties}
          >
            {rows.map((r, i) => {
              const isTop = hasQuery && i === 0 && !openedItem
              const isActive = r.item.id === activeId
              const isOpened = openedItem?.id === r.item.id
              const w = wavePath(isOpened ? AMAX * 0.98 : openedItem ? 0 : ampOf(r.rel), isOpened || (hasQuery && i === 0) ? 1 : harmonic(r.rel), 0, 0)
              return (
                <li
                  key={r.item.id}
                  id={`${uid}-o${i}`}
                  className="irz-row"
                  role="option"
                  aria-selected={isActive}
                  data-row={r.item.id}
                  data-top={isTop ? "" : undefined}
                  data-active={isActive ? "" : undefined}
                  data-lock={isTop && locked ? "" : undefined}
                  data-opened={isOpened ? "" : undefined}
                  data-idle={hasQuery ? undefined : ""}
                  style={{ "--irz-rp": `${isTop || isOpened ? 100 : Math.round(r.rel * 70)}%` } as React.CSSProperties}
                  onMouseMove={() => {
                    if (!isActive && hasQuery) setPicked({ id: r.item.id, q })
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => hasQuery && open(r.item)}
                >
                  <div className="irz-top">
                    <span className="irz-ti">{highlight(r.item.title, qStems)}</span>
                    {r.item.source ? <span className="irz-src">{r.item.source}</span> : null}
                    <span className="irz-end">
                      <span className="irz-lvl">
                        {isOpened ? (
                          <>
                            <Check size={12} strokeWidth={2.25} aria-hidden />
                            {doneWord}
                          </>
                        ) : hasQuery ? (
                          levelWord(r.rel, i)
                        ) : null}
                      </span>
                      <span className="irz-score">{hasQuery ? r.rel.toFixed(2) : "–"}</span>
                    </span>
                  </div>
                  <p className="irz-sn">{highlight(r.item.snippet, qStems)}</p>
                  <div className="irz-wave">
                    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden focusable="false" data-svg={r.item.id}>
                      <line className="irz-base" x1="0" x2={W} y1={MID} y2={MID} />
                      <path className="irz-fill" d={w.fill} />
                      <path className="irz-gh" d={w.g1} />
                      <path className="irz-gh" data-b="" d={w.g2} />
                      <path className="irz-trail" d={w.line} opacity="0" />
                      <path className="irz-glow" d={w.line} />
                      <path className="irz-line" d={w.line} />
                    </svg>
                  </div>
                </li>
              )
            })}
          </ul>
          {hasQuery && !rows.length ? (
            <div className="irz-empty">
              <svg viewBox="0 0 280 12" preserveAspectRatio="none" aria-hidden focusable="false">
                <line className="irz-base" x1="0" x2="280" y1="6" y2="6" />
                <circle cx="2" cy="6" r="3" fill="var(--irz-t4)" />
                <circle cx="278" cy="6" r="3" fill="var(--irz-t4)" />
              </svg>
              <p>Nothing resonates with “{q.trim()}”</p>
              <p>Try fewer words or another way of putting it.</p>
            </div>
          ) : null}
        </div>

        <div className="irz-foot">
          <span className="irz-keys" aria-hidden>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>move</span>
          </span>
          {openedItem ? (
            <span className="irz-act" data-done="" key={`done-${openedItem.id}`} data-in="">
              <Check size={13} strokeWidth={2.25} aria-hidden />
              <span>
                {doneWord} <b>{openedItem.title}</b>
              </span>
            </span>
          ) : active ? (
            <span className="irz-act" key={active.item.id} data-in="">
              <kbd aria-hidden>↵</kbd>
              <span>{label(active.item)}</span>
            </span>
          ) : (
            <span className="irz-act">
              <span>{hasQuery ? "Nothing to open yet" : "Results appear as you type"}</span>
            </span>
          )}
        </div>
      </div>
      <div className="irz-sr" role="status" aria-live="polite">
        {live}
      </div>
    </div>
  )
}

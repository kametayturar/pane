"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SlotTextProps = {
  /** The value to show. Numbers pass through `format`. */
  value: string | number
  /** Formats number values. Default: en-US grouping (12,480). */
  format?: (value: number) => string
  /** Seconds the first reel spins. Default 0.9. */
  duration?: number
  /** Seconds between reels stopping, left to right. Default 0.07. */
  stagger?: number
  /** Extra full turns before landing. 0 rolls straight to the new digit. Default 1. */
  spins?: number
  /** Which end reels are matched from when the length changes. Numbers default to `end`, strings to `start`. */
  align?: "start" | "end"
  /** Announce new values politely to screen readers (for values that change without user action). */
  announce?: boolean
  /** Extra class on the root. Font size, weight and colour come from the parent. */
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.slt { position: relative; display: inline-block; vertical-align: baseline; line-height: 1.15; white-space: pre; font-variant-numeric: tabular-nums;
  --slt-cell: 1.6em; --slt-pad: .225em }
.slt-reels { display: inline-flex; align-items: baseline }
.slt-slot { position: relative; display: inline-block }
.slt-sizer { display: inline-block; visibility: hidden }
.slt-win { position: absolute; left: -.2em; right: -.2em; top: calc(var(--slt-pad) * -1); height: var(--slt-cell); overflow: hidden; pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 .24em, #000 calc(100% - .24em), transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 .24em, #000 calc(100% - .24em), transparent) }
.slt-strip { display: block; will-change: transform }
.slt-cell { display: block; height: var(--slt-cell); padding-top: var(--slt-pad); line-height: 1.15; text-align: center; white-space: pre }
.slt-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }
.slt-meas { position: absolute; left: 0; top: 0; visibility: hidden; pointer-events: none; white-space: pre }
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const DIGIT = /[0-9]/
const LETTER = /[A-Za-z]/
const ALPHA = "abcdefghijklmnopqrstuvwxyz"

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/** The characters a reel rolls through from `from` to `to`. Digits count, letters shuffle through the alphabet, anything else is a two-cell roll. */
function buildPath(from: string, to: string, dir: 1 | -1, spins: number): string[] {
  if (DIGIT.test(from) && DIGIT.test(to)) {
    const a = +from
    const b = +to
    const steps = (dir > 0 ? (b - a + 10) % 10 : (a - b + 10) % 10) + 10 * spins
    if (steps === 0) return [to]
    return Array.from({ length: steps + 1 }, (_, k) => String(dir > 0 ? (a + k) % 10 : (((a - k) % 10) + 10) % 10))
  }
  if (LETTER.test(from) && LETTER.test(to)) {
    const a = ALPHA.indexOf(from.toLowerCase())
    const b = ALPHA.indexOf(to.toLowerCase())
    const upper = to === to.toUpperCase()
    const steps = (dir > 0 ? (b - a + 26) % 26 : (a - b + 26) % 26) + (spins > 0 ? 26 : 0)
    if (steps === 0) return [to]
    return Array.from({ length: steps + 1 }, (_, k) => {
      const c = ALPHA[dir > 0 ? (a + k) % 26 : (((a - k) % 26) + 26) % 26]
      return k === 0 ? from : upper ? c.toUpperCase() : c
    })
  }
  return from === to ? [to] : [from, to]
}

/* -------------------------------------------------------------------------- */
/*                                Reel model                                  */
/* -------------------------------------------------------------------------- */

type SlotModel = {
  id: number
  /** The character this reel lands on. */
  ch: string
  /** Bumped on every change; a bump restarts that reel's animation. */
  token: number
  dir: 1 | -1
  order: number
  spins: number
  /** Total spin time in ms (first reel's duration plus its stagger). */
  ms: number
  leaving: boolean
  /** Added after the first render: grows in instead of spinning. */
  enter: boolean
}

type Model = { text: string; num: number | null; slots: SlotModel[]; nextId: number }

function initialModel(text: string, num: number | null): Model {
  return { text, num, slots: Array.from(text).map((ch, i) => ({ id: i + 1, ch, token: 0, dir: 1, order: 0, spins: 0, ms: 0, leaving: false, enter: false })), nextId: text.length + 1 }
}

/** Matches old reels to new characters (leading symbols from the start, the rest from the end for numbers) and returns the next reel list. */
function reconcile(prev: Model, text: string, num: number | null, align: "start" | "end", spins: number, duration: number, stagger: number, instant: boolean): Model {
  const active = prev.slots.filter((s) => !s.leaving)
  const next = Array.from(text)
  const dir: 1 | -1 = num !== null && prev.num !== null && num < prev.num ? -1 : 1

  const pairs: Array<[SlotModel | null, string | null]> = []
  const zip = (o: SlotModel[], n: string[], from: "start" | "end") => {
    const m = Math.max(o.length, n.length)
    for (let j = 0; j < m; j++) {
      const oi = from === "start" ? j : j - (m - o.length)
      const ni = from === "start" ? j : j - (m - n.length)
      pairs.push([o[oi] ?? null, n[ni] ?? null])
    }
  }
  if (align === "start") zip(active, next, "start")
  else {
    const firstDigit = (arr: string[]) => {
      const i = arr.findIndex((c) => DIGIT.test(c))
      return i < 0 ? arr.length : i
    }
    const po = firstDigit(active.map((s) => s.ch))
    const pn = firstDigit(next)
    zip(active.slice(0, po), next.slice(0, pn), "start")
    zip(active.slice(po), next.slice(pn), "end")
  }

  let nextId = prev.nextId
  let order = 0
  const out: SlotModel[] = []
  let cursor = 0
  const flushLeaving = (upToIndex: number) => {
    while (cursor < upToIndex) {
      const s = prev.slots[cursor++]
      if (s.leaving && !instant) out.push(s)
    }
  }
  for (const [o, n] of pairs) {
    if (o) flushLeaving(prev.slots.indexOf(o))
    if (o && n !== null) {
      cursor = Math.max(cursor, prev.slots.indexOf(o) + 1)
      if (o.ch === n) out.push(o)
      else {
        out.push({ ...o, ch: n, token: o.token + 1, dir, order, spins, ms: (duration + order * stagger) * 1000, leaving: false, enter: false })
        order++
      }
    } else if (o) {
      cursor = Math.max(cursor, prev.slots.indexOf(o) + 1)
      if (!instant) out.push({ ...o, token: o.token + 1, leaving: true })
    } else if (n !== null) {
      out.push({ id: nextId++, ch: n, token: 1, dir: 1, order, spins: 0, ms: (duration + order * stagger) * 1000, leaving: false, enter: true })
      order++
    }
  }
  flushLeaving(prev.slots.length)
  return { text, num, slots: out, nextId }
}

/* -------------------------------------------------------------------------- */
/*                                    Reel                                    */
/* -------------------------------------------------------------------------- */

type ReelProps = {
  slot: SlotModel
  measure: (ch: string) => number
  reduce: boolean
  onGone: (id: number) => void
}

const CELL = 1.6 // em, must match --slt-cell

const Reel = React.memo(function Reel({ slot, measure, reduce, onGone }: ReelProps) {
  const slotRef = React.useRef<HTMLSpanElement>(null)
  const stripRef = React.useRef<HTMLSpanElement>(null)
  const [initial] = React.useState(slot.ch)
  // Everything the animation needs between runs lives here, never in React state.
  const st = React.useRef({ raf: 0, cells: [initial], pos: 0, w: -1, blur: 0 })

  React.useLayoutEffect(() => {
    if (slot.token === 0) return
    const el = slotRef.current
    const strip = stripRef.current
    if (!el || !strip) return
    const s = st.current
    cancelAnimationFrame(s.raf)

    // Where the reel is right now: the cell on screen, plus how far it has strayed from rest.
    const idx = Math.min(s.cells.length - 1, Math.max(0, Math.round(s.pos)))
    const frac = Math.max(-0.5, Math.min(0.5, s.pos - idx))
    const current = s.cells[idx]
    const curW = s.w >= 0 ? s.w : el.getBoundingClientRect().width

    const clearInline = () => {
      el.style.width = ""
      el.style.opacity = ""
      strip.style.filter = ""
      s.w = -1
      s.blur = 0
    }
    const setCells = (cells: string[]) => {
      const frag = document.createDocumentFragment()
      for (const c of cells) {
        const n = document.createElement("span")
        n.className = "slt-cell"
        n.textContent = c
        frag.appendChild(n)
      }
      strip.replaceChildren(frag)
      s.cells = cells
    }

    if (reduce) {
      setCells([slot.ch])
      s.pos = 0
      strip.style.transform = "translate3d(0,0,0)"
      clearInline()
      return
    }

    // Spin: build the path of characters and park the strip at its start.
    let p0 = 0
    let p1 = 0
    if (!slot.leaving) {
      const path = buildPath(current, slot.ch, slot.dir, slot.spins)
      // One spare cell at each end so a restart that begins slightly off rest never shows a gap.
      const body = slot.dir > 0 ? path : [...path].reverse()
      const cells = [body[0], ...body, body[body.length - 1]]
      setCells(cells)
      if (path.length > 1) {
        p0 = slot.dir > 0 ? 1 + frac : path.length + frac
        p1 = slot.dir > 0 ? path.length : 1
      } else {
        p0 = p1 = 1
      }
      s.pos = p0
      strip.style.transform = `translate3d(0,${-p0 * CELL}em,0)`
    }

    // Width follows the new character on a critically damped spring.
    const targetW = slot.leaving ? 0 : measure(slot.ch)
    const startW = slot.enter && slot.token === 1 ? 0 : curW
    s.w = startW
    let v = 0
    const w0 = Math.max(startW, targetW, 1)
    const fade = slot.leaving || startW === 0
    if (startW !== targetW) {
      el.style.width = `${startW}px`
      if (fade) el.style.opacity = slot.leaving ? "1" : "0"
    }

    const T = Math.max(1, slot.ms)
    const dist = Math.abs(p1 - p0)
    const t0 = performance.now()
    let last = t0
    const OMEGA = 24

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const u = Math.min(1, (now - t0) / T)
      let moving = u < 1
      if (dist > 0) {
        const e = 1 - Math.pow(1 - u, 4)
        const pos = p0 + (p1 - p0) * e
        s.pos = pos
        strip.style.transform = `translate3d(0,${-pos * CELL}em,0)`
        const speed = (dist * 4 * Math.pow(1 - u, 3)) / (T / 1000) // cells per second
        const blur = moving ? Math.min(0.16, speed * 0.0042) : 0
        if (Math.abs(blur - s.blur) > 0.004 || (blur === 0) !== (s.blur === 0)) {
          strip.style.filter = blur > 0.004 ? `blur(${blur.toFixed(3)}em)` : ""
          s.blur = blur
        }
      }
      // Critically damped width spring (exact step).
      const x = s.w - targetW
      const k = Math.exp(-OMEGA * dt)
      const nv = (v - OMEGA * (v + OMEGA * x) * dt) * k
      const nx = (x + (v + OMEGA * x) * dt) * k
      v = nv
      s.w = targetW + nx
      const settled = Math.abs(nx) < 0.05 && Math.abs(v) < 0.5
      if (settled) s.w = targetW
      if (startW !== targetW) {
        el.style.width = `${Math.max(0, s.w)}px`
        if (fade) el.style.opacity = String(Math.max(0, Math.min(1, s.w / w0)))
      }
      if (!settled) moving = true
      if (moving) s.raf = requestAnimationFrame(tick)
      else {
        s.pos = p1
        strip.style.transform = `translate3d(0,${-p1 * CELL}em,0)`
        if (slot.leaving) onGone(slot.id)
        else {
          // Collapse to a single cell and let the natural width take over again.
          setCells([slot.ch])
          s.pos = 0
          strip.style.transform = "translate3d(0,0,0)"
          clearInline()
        }
      }
    }
    s.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(s.raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot.token])

  React.useEffect(() => () => cancelAnimationFrame(st.current.raf), [])

  // A reduced-motion leave removes the reel right away (the model already dropped it), so nothing else to do here.
  return (
    <span ref={slotRef} className="slt-slot" data-leaving={slot.leaving || undefined}>
      <span className="slt-sizer">{slot.ch}</span>
      <span className="slt-win">
        <span ref={stripRef} className="slt-strip">
          <span className="slt-cell">{initial}</span>
        </span>
      </span>
    </span>
  )
})

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/** Text or a number where every character is a reel: digits count through the wheel in the direction the number moved, letters shuffle through the alphabet and reels land left to right. */
export function SlotText({ value, format, duration = 0.9, stagger = 0.07, spins = 1, align, announce = false, className, style }: SlotTextProps) {
  const isNum = typeof value === "number"
  const text = isNum ? (format ? format(value) : value.toLocaleString("en-US")) : value
  const num = isNum ? value : null
  const mode = align ?? (isNum ? "end" : "start")
  const reduce = usePrefersReducedMotion()

  const [model, setModel] = React.useState<Model>(() => initialModel(text, num))
  if (model.text !== text || model.num !== num) setModel(reconcile(model, text, num, mode, spins, duration, stagger, reduce))

  const measRef = React.useRef<HTMLSpanElement>(null)
  const measure = React.useCallback((ch: string) => {
    const m = measRef.current
    if (!m) return 0
    m.textContent = ch
    return m.getBoundingClientRect().width
  }, [])
  const onGone = React.useCallback((id: number) => {
    setModel((m) => (m.slots.some((s) => s.id === id && s.leaving) ? { ...m, slots: m.slots.filter((s) => s.id !== id) } : m))
  }, [])

  return (
    <span className={cn("slt", className)} style={style}>
      <style href="slt" precedence="default">
        {CSS}
      </style>
      <span className="slt-sr" aria-live={announce ? "polite" : undefined} aria-atomic={announce ? true : undefined}>
        {text}
      </span>
      <span ref={measRef} className="slt-meas" aria-hidden="true" />
      <span className="slt-reels" aria-hidden="true">
        {model.slots.map((s) => (
          <Reel key={s.id} slot={s} measure={measure} reduce={reduce} onGone={onGone} />
        ))}
      </span>
    </span>
  )
}

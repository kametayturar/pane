"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type EffortSentenceLevel = {
  /** Stable id used by `value` / `defaultValue`, e.g. "standard". */
  id: string
  /** Short name, announced to screen readers and used in the button labels, e.g. "Standard". */
  label: string
  /**
   * The setting, written as one sentence. Start a word with `*` to mark it as the extra effort of this level (it is set in
   * the accent colour). `{time}` and `{price}` are replaced by `time` and `price` below.
   * Example: "Atlas *checks *its *work, then answers in about {time} for {price}."
   */
  sentence: string
  /** What the level costs in time, e.g. "8 seconds". Kept on one line. */
  time: string
  /** What the level costs in money, e.g. "$0.008". */
  price: string
}

export type EffortSentenceProps = {
  /** Who is thinking. Only used by the built-in levels. Default "Atlas". */
  agent?: string
  /** Small line above the sentence, e.g. what is being worked on. Pass "" to hide it. Default "Harbor & Finch · Pricing page review". */
  context?: string
  /** Levels from least to most effort. Default: quick, standard, deep. */
  levels?: EffortSentenceLevel[]
  /** Controlled level: the id of the level to show. The built-in loop is off while this is set. */
  value?: string
  /** Starting level when uncontrolled. */
  defaultValue?: string
  /** Called when the person presses Think longer or Think less (also while the built-in loop is off). */
  onChange?: (level: EffortSentenceLevel, index: number) => void
  /** Name announced for the whole card. Default "How hard to think". */
  label?: string
  /** Label of the button that lowers the effort. Default "Think less". */
  lessLabel?: string
  /** Label of the button that raises the effort. Default "Think longer". */
  moreLabel?: string
  /** Play the built-in loop (quick, standard, deep, back) until the first interaction. Default: on when no `levels`, `value` or `defaultValue` is passed. */
  autoPlay?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.efs {
  --efs-ink: #000;
  --efs-surface: #fff;
  --efs-accent: #0060e2;
  --efs-t1: color-mix(in oklab, var(--efs-ink) 88%, transparent);
  --efs-t2: color-mix(in oklab, var(--efs-ink) 61%, transparent);
  --efs-t3: color-mix(in oklab, var(--efs-ink) 45%, transparent);
  --efs-t4: color-mix(in oklab, var(--efs-ink) 27%, transparent);
  --efs-fill: color-mix(in oklab, var(--efs-ink) 6%, transparent);
  --efs-line: color-mix(in oklab, var(--efs-ink) 8%, transparent);
  --efs-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05), 0 16px 40px -16px rgb(0 0 0 / .1);
  --efs-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; container-type: inline-size; width: 100%; max-width: 480px;
  font: 13px/20px var(--efs-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--efs-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .efs {
  --efs-ink: #fff;
  --efs-surface: #1c1c1e;
  --efs-accent: #4d8dff;
  --efs-t1: color-mix(in oklab, var(--efs-ink) 90%, transparent);
  --efs-t2: color-mix(in oklab, var(--efs-ink) 62%, transparent);
  --efs-t3: color-mix(in oklab, var(--efs-ink) 46%, transparent);
  --efs-t4: color-mix(in oklab, var(--efs-ink) 28%, transparent);
  --efs-fill: color-mix(in oklab, var(--efs-ink) 8%, transparent);
  --efs-line: color-mix(in oklab, var(--efs-ink) 10%, transparent);
  --efs-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4), 0 16px 40px -16px rgb(0 0 0 / .5);
}
html[data-style="mono"] .efs {
  --efs-ink: #000; --efs-surface: #fff; --efs-accent: #111; --efs-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --efs-ease: cubic-bezier(.2, .9, .1, 1); --efs-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --efs-ls: 0; --efs-nls: 0;
}
html[data-style="mono"].dark .efs { --efs-ink: #fff; --efs-surface: #0a0a0a; --efs-accent: #f2f2f2; --efs-shadow: 0 0 0 1px rgb(255 255 255 / .16) }
html[data-style="glass"] .efs {
  --efs-ink: var(--pane-ink); --efs-surface: var(--pane-solid); --efs-accent: var(--pane-accent); --efs-shadow: var(--pane-shadow);
  --efs-ease: var(--pane-ease); --efs-font: var(--pane-font);
  --efs-t1: var(--pane-t1); --efs-t2: var(--pane-t2); --efs-t3: var(--pane-t3); --efs-t4: var(--pane-t4);
}
html[data-style="glass"] .efs-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .efs-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .efs-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .efs-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .efs-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .efs-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}
.efs *, .efs *::before, .efs *::after { box-sizing: border-box }
:where(.efs) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.efs) p { margin: 0 }
.efs-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.efs-card {
  --efs-pad: 28px; --efs-inset: 16px; --efs-fs: 24px; --efs-lh: 1.3;
  background: var(--efs-surface); border-radius: 28px; box-shadow: var(--efs-shadow); padding: 26px var(--efs-pad) 6px;
}
html[data-style="mono"] .efs-card { --efs-fs: 18px; --efs-lh: 1.5; border-radius: 8px }
.efs-ctx { font-weight: 500; line-height: 18px; color: var(--efs-t2) }

/* The sentence. Every level is also laid out invisibly in the same grid cell, so the zone is as tall as the longest one and the buttons never move. */
.efs-zone {
  position: relative; display: grid; margin-top: 16px;
  font-size: var(--efs-fs); line-height: var(--efs-lh); font-weight: 500; letter-spacing: var(--efs-ls, -.02em);
}
.efs-sent { grid-area: 1 / 1; position: relative; min-width: 0 }
html[data-style="glass"] .efs-zone { text-wrap: balance }
.efs-m { visibility: hidden; pointer-events: none; user-select: none }
.efs-gh { position: absolute; inset: 0; pointer-events: none }
.efs-w { display: inline-block }
.efs-x { color: var(--efs-accent) }
html[data-style="mono"] .efs-x { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .22em; text-decoration-color: var(--efs-t3) }
.efs-n { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; letter-spacing: var(--efs-nls, -.025em) }
.efs-ghost { position: absolute; white-space: nowrap }

/* Buttons */
.efs-bar { display: flex; align-items: center; justify-content: space-between; margin: 16px calc(var(--efs-inset) - var(--efs-pad)) 0; border-top: .5px solid var(--efs-line) }
.efs-b {
  height: 52px; padding: 0 calc(var(--efs-pad) - var(--efs-inset)); border-radius: 12px; font-size: 15px; font-weight: 500;
  transition: opacity .24s var(--efs-ease), color .24s var(--efs-ease), background-color .16s var(--efs-ease);
}
html[data-style="mono"] .efs-b { border-radius: 4px }
.efs-less { color: var(--efs-t2) }
.efs-more { color: var(--efs-accent); font-weight: 600 }
.efs-b[aria-disabled="true"] { color: var(--efs-t4); cursor: default }
html[data-style="glass"] .efs-b[aria-disabled="true"] { color: var(--efs-t3) }
.efs-b:focus-visible { outline: 2px solid var(--efs-accent); outline-offset: -6px }
.efs-b:active:not([aria-disabled="true"]) { opacity: .6 }
@media (hover: hover) { .efs-b:hover:not([aria-disabled="true"]) { background: var(--efs-fill) } }

@container (max-width: 440px) {
  .efs-card { --efs-pad: 20px; --efs-inset: 12px; --efs-fs: 22px; padding-top: 22px }
  html[data-style="mono"] .efs-card { --efs-fs: 17px }
  .efs-bar { margin-top: 8px }
}
@media (prefers-reduced-motion: reduce) {
  .efs *, .efs *::before, .efs *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 The sentence                               */
/* -------------------------------------------------------------------------- */

const NB = " "
const EASE = "cubic-bezier(.22, 1, .36, 1)"

type Word = { k: string; t: string; x: boolean; n: boolean; tail: string }
type WNode = Word & { el: HTMLElement; fresh?: boolean; changed?: boolean }
type Engine = { nodes: WNode[]; index: number; sig: string; timer: number }
type Pt = { x: number; y: number }

const cls = (w: Word) => "efs-w" + (w.x ? " efs-x" : "") + (w.n ? " efs-n" : "")

/** Splits a level's sentence into words. The time and price are single tokens so they stay on one line. */
function parse(l: EffortSentenceLevel): Word[] {
  return l.sentence
    .split(" ")
    .filter(Boolean)
    .map((w): Word => {
      for (const [key, text] of [["{time}", l.time], ["{price}", l.price]] as const) {
        if (w.startsWith(key)) return { k: key, t: text.replace(/ /g, NB), x: false, n: true, tail: w.slice(key.length) }
      }
      const x = w[0] === "*"
      const t = x ? w.slice(1) : w
      return { k: t, t, x, n: false, tail: "" }
    })
}

const plain = (l: EffortSentenceLevel) => l.sentence.replace(/\*/g, "").replace("{time}", l.time).replace("{price}", l.price)

/** Longest common subsequence of old and new word keys: new index -> old index. These words stay and glide. */
function lcs(a: string[], b: string[]) {
  const n = a.length
  const m = b.length
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const pairs = new Map<number, number>()
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      pairs.set(j, i)
      i++
      j++
    } else if (L[i + 1][j] >= L[i][j + 1]) i++
    else j++
  }
  return pairs
}

/**
 * Swaps the sentence to `words`. Words that exist in both sentences keep their element and glide (FLIP: read the old
 * position, change the DOM, read the new one, animate the difference). New words blur in after the gap opens; removed words
 * leave a ghost behind that blurs out; a changed figure cross-blurs in place.
 */
function render(sent: HTMLElement, layer: HTMLElement, e: Engine, words: Word[], dir: number, animate: boolean) {
  const prev = e.nodes
  const pairs = animate ? lcs(prev.map((n) => n.k), words.map((w) => w.k)) : new Map<number, number>()
  const box = sent.getBoundingClientRect()
  const seen = (el: HTMLElement): Pt => {
    const b = el.getBoundingClientRect()
    return { x: b.left - box.left, y: b.top - box.top }
  }
  const before = new Map<WNode, Pt>()
  const look = new Map<WNode, { o: string; f: string }>()
  if (animate) {
    prev.forEach((n) => {
      before.set(n, seen(n.el))
      const cs = getComputedStyle(n.el)
      look.set(n, { o: cs.opacity, f: cs.filter })
    })
  }

  const used = new Set<WNode>()
  const next: WNode[] = []
  const ghosts: { el: HTMLElement; fig: boolean }[] = []
  const ghost = (n: WNode, fig: boolean) => {
    const p = before.get(n)
    if (!p) return
    const g = n.el.cloneNode(true) as HTMLElement
    g.classList.add("efs-ghost")
    g.style.left = `${p.x}px`
    g.style.top = `${p.y}px`
    g.style.opacity = getComputedStyle(n.el).opacity
    ghosts.push({ el: g, fig })
  }

  words.forEach((w, j) => {
    const pi = pairs.get(j)
    if (pi === undefined) {
      const el = document.createElement("span")
      el.className = cls(w)
      el.textContent = w.t
      next.push({ ...w, el, fresh: true })
      return
    }
    const n = prev[pi]
    used.add(n)
    const changed = n.t !== w.t
    if (changed) ghost(n, true)
    n.el.getAnimations().forEach((a) => a.cancel())
    n.el.className = cls(w)
    if (changed) n.el.textContent = w.t
    Object.assign(n, w, { changed })
    next.push(n)
  })
  if (animate) prev.forEach((n) => !used.has(n) && ghost(n, false))

  const frag = document.createDocumentFragment()
  next.forEach((n) => frag.append(n.el, document.createTextNode(n.tail + " ")))
  sent.replaceChildren(frag)
  e.nodes = next
  window.clearTimeout(e.timer)
  if (!animate) {
    layer.replaceChildren()
    next.forEach((n) => {
      n.fresh = false
      n.changed = false
    })
    return
  }

  // Read every new position first, then start the animations (no layout reads between writes).
  const after = new Map<WNode, Pt>(next.map((n) => [n, seen(n.el)]))
  let end = 0
  ghosts.forEach(({ el, fig }) => {
    layer.appendChild(el)
    const dur = fig ? 300 : 240
    const a = el.animate(
      [
        { opacity: el.style.opacity || "1", filter: "blur(0px)", transform: "none" },
        { opacity: 0, filter: "blur(5px)", transform: `translateY(${fig ? -dir * 8 : -6}px)` },
      ],
      { duration: dur, easing: EASE, fill: "forwards" },
    )
    a.onfinish = () => el.remove()
    end = Math.max(end, dur)
  })
  let k = 0
  next.forEach((n) => {
    const a = before.get(n)
    const b = after.get(n)
    const dx = a && b ? a.x - b.x : 0
    const dy = a && b ? a.y - b.y : 0
    const move = `translate(${dx}px, ${dy}px)`
    if (n.fresh) {
      const delay = 240 + k++ * 55
      n.el.animate(
        [
          { opacity: 0, filter: "blur(6px)", transform: "translateY(8px)" },
          { opacity: 1, filter: "blur(0px)", transform: "none" },
        ],
        { duration: 520, delay, easing: EASE, fill: "backwards" },
      )
      end = Math.max(end, delay + 520)
    } else if (n.changed) {
      n.el.animate(
        [
          { opacity: 0, filter: "blur(6px)", transform: `${move} translateY(${dir * 8}px)` },
          { opacity: 1, filter: "blur(0px)", transform: "none" },
        ],
        { duration: 520, delay: 60, easing: EASE, fill: "backwards" },
      )
      end = Math.max(end, 580)
    } else {
      // A word caught mid blur-in carries its current opacity and blur into the glide instead of popping to full.
      const lk = look.get(n)
      const part = !!lk && (lk.o !== "1" || (lk.f !== "none" && lk.f !== "blur(0px)"))
      const moved = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5
      if (moved || part) {
        const dur = moved ? 640 : 320
        n.el.animate(
          [
            { transform: moved ? move : "none", opacity: part ? lk.o : "1", filter: part ? lk.f : "none" },
            { transform: "none", opacity: "1", filter: "blur(0px)" },
          ],
          { duration: dur, easing: EASE },
        )
        end = Math.max(end, dur)
      }
    }
    n.fresh = false
    n.changed = false
  })

  // If frames never arrive (throttled tab, screenshot) the final sentence is already in place: drop whatever is left of the motion.
  e.timer = window.setTimeout(() => {
    e.nodes.forEach((n) => n.el.getAnimations().forEach((a) => a.cancel()))
    layer.replaceChildren()
  }, end + 300)
}

const Words = ({ words }: { words: Word[] }) => (
  <>
    {words.map((w, i) => (
      <React.Fragment key={i}>
        <span className={cls(w)}>{w.t}</span>
        {w.tail + " "}
      </React.Fragment>
    ))}
  </>
)

const Sentence = React.memo(function Sentence({ levels, index, reduce }: { levels: EffortSentenceLevel[]; index: number; reduce: boolean }) {
  const sentRef = React.useRef<HTMLParagraphElement>(null)
  const layerRef = React.useRef<HTMLDivElement>(null)
  const eng = React.useRef<Engine>({ nodes: [], index: -1, sig: "", timer: 0 })
  const sig = levels.map((l) => `${l.sentence}|${l.time}|${l.price}`).join("\n")
  // Until the engine has built the live sentence (server HTML, first paint), a React-owned copy shows the words.
  const [ready, setReady] = React.useState(false)

  React.useLayoutEffect(() => {
    const e = eng.current
    const sent = sentRef.current
    const layer = layerRef.current
    if (!sent || !layer) return
    const fresh = e.index < 0 || e.sig !== sig
    if (!fresh && e.index === index) return
    const dir = index >= e.index ? 1 : -1
    render(sent, layer, e, parse(levels[index]), dir, !fresh && !reduce)
    e.index = index
    e.sig = sig
    setReady(true)
  }, [levels, index, sig, reduce])

  React.useEffect(() => {
    const e = eng.current
    return () => window.clearTimeout(e.timer)
  }, [])

  return (
    <div className="efs-zone" aria-hidden>
      <p ref={sentRef} className="efs-sent" />
      {!ready && (
        <p className="efs-sent">
          <Words words={parse(levels[index])} />
        </p>
      )}
      {levels.map((l, i) => (
        <p key={i} className="efs-sent efs-m">
          <Words words={parse(l)} />
        </p>
      ))}
      <div ref={layerRef} className="efs-gh" />
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*                               EffortSentence                               */
/* -------------------------------------------------------------------------- */

const defaults = (agent: string): EffortSentenceLevel[] => [
  { id: "quick", label: "Quick", sentence: `${agent} answers right away, in about {time} for {price}.`, time: "2 seconds", price: "$0.002" },
  { id: "standard", label: "Standard", sentence: `${agent} *checks *its *work, then answers in about {time} for {price}.`, time: "8 seconds", price: "$0.008" },
  { id: "deep", label: "Deep", sentence: `${agent} *tries *three *routes *and *checks *each, then answers in about {time} for {price}.`, time: "40 seconds", price: "$0.04" },
]

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function EffortSentence(props: EffortSentenceProps) {
  const {
    agent = "Atlas",
    context = "Harbor & Finch · Pricing page review",
    levels: levelsProp,
    value,
    defaultValue,
    onChange,
    label = "How hard to think",
    lessLabel = "Think less",
    moreLabel = "Think longer",
    className,
  } = props
  const demo = value === undefined && defaultValue === undefined && levelsProp === undefined
  const controlled = value !== undefined
  const levels = React.useMemo(() => (levelsProp && levelsProp.length > 0 ? levelsProp : defaults(agent)), [levelsProp, agent])
  const n = levels.length

  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )

  const find = (id: string | undefined) => Math.max(0, levels.findIndex((l) => l.id === id))
  const [inner, setInner] = React.useState(() => (defaultValue !== undefined ? find(defaultValue) : 0))
  const [auto, setAuto] = React.useState(props.autoPlay ?? demo)
  const [active, setActive] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const firstHold = React.useRef(true)

  // Reduced motion has no loop, so the built-in card rests on Standard (set before first paint, so server and client markup agree).
  React.useLayoutEffect(() => {
    if (demo && prefersReduced()) setInner(Math.min(1, n - 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const index = Math.min(controlled ? find(value) : inner, n - 1)
  const level = levels[index]
  const looping = auto && !controlled && !reduce

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    if (!looping) return
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [looping])

  // The built-in moment: quick, then standard, then deep, then back. It carries on from where it paused.
  React.useEffect(() => {
    if (!looping || !active) return
    const hold = index === 0 ? (firstHold.current ? 800 : 1800) : index === n - 1 ? 4200 : 2400
    const t = window.setTimeout(() => {
      firstHold.current = false
      setInner(index === n - 1 ? 0 : index + 1)
    }, hold)
    return () => window.clearTimeout(t)
  }, [looping, active, index, n])

  // Any touch or key anywhere on the page ends the demo loop for good.
  React.useEffect(() => {
    if (!auto) return
    const stop = () => setAuto(false)
    const key = (e: KeyboardEvent) => {
      if (!["Shift", "Meta", "Control", "Alt"].includes(e.key)) stop()
    }
    window.addEventListener("pointerdown", stop, true)
    window.addEventListener("keydown", key, true)
    return () => {
      window.removeEventListener("pointerdown", stop, true)
      window.removeEventListener("keydown", key, true)
    }
  }, [auto])

  const go = (d: number) => {
    const next = index + d
    if (next < 0 || next >= n) return
    setAuto(false)
    if (!controlled) setInner(next)
    onChange?.(levels[next], next)
  }

  const atMin = index === 0
  const atMax = index === n - 1
  const status = `${level.label}. ${plain(level)}`

  return (
    <div ref={rootRef} className={cn("efs", className)} onFocusCapture={() => setAuto(false)}>
      <style href="effort-sentence" precedence="default">
        {CSS}
      </style>
      <p className="efs-sr" role="status" aria-live={looping ? "off" : "polite"}>
        {status}
      </p>
      <div className="efs-card" role="group" aria-label={label}>
        {context !== "" && <p className="efs-ctx">{context}</p>}
        <Sentence levels={levels} index={index} reduce={reduce} />
        <div className="efs-bar">
          <button
            type="button"
            className="efs-b efs-less"
            aria-disabled={atMin}
            aria-label={atMin ? `${lessLabel}, already at ${level.label}` : `${lessLabel}, from ${level.label}`}
            onClick={() => go(-1)}
          >
            {lessLabel}
          </button>
          <button
            type="button"
            className="efs-b efs-more"
            aria-disabled={atMax}
            aria-label={atMax ? `${moreLabel}, already at ${level.label}` : `${moreLabel}, from ${level.label}`}
            onClick={() => go(1)}
          >
            {moreLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

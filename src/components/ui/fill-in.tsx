"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FillInOption = {
  /** Stable id used by `value` / `defaultValue`; falls back to the label. */
  id?: string
  /** The words that go into the slot, typed in the sentence's own size. Keep them short. */
  label: string
  /** Footer line that explains what this answer will do; shown from the moment it is picked. */
  note?: string
}

export type FillInStatus = {
  /** Right-hand label while the agent is writing. Default "Writing…". */
  writing?: string
  /** Label while the sentence waits for you (shown in the accent colour). Default "Waiting for you". */
  asking?: string
  /** Label once the sentence is finished. Default "Draft ready". */
  done?: string
}

export type FillInFoot = {
  /** Quiet line under the sentence while the agent writes. */
  writing?: string
  /** Line while the options are open, e.g. what the answers lead to. */
  asking?: string
  /** Line once the slot is filled and nothing has been sent yet. */
  done?: string
}

export type FillInProps = {
  /** Who is writing. Default "Sage". */
  agent?: string
  /** What is being written, shown beside the agent name, e.g. "Reply to Dana Okafor". */
  context?: string
  /** Sentence up to the slot. Plain text; it wraps. */
  before?: string
  /** Sentence after the slot; it appears once the slot is filled. */
  after?: string
  /** 2–3 answers offered under the slot. Leave out to get the built-in refund example and demo loop. */
  options?: FillInOption[]
  /** Accessible name of the options group and what is announced when the agent stops. Default "Which one should it be?". */
  question?: string
  /** Controlled answer: the id (or label) of the picked option, or null while the slot is open. */
  value?: string | null
  /** Starting answer when uncontrolled. */
  defaultValue?: string | null
  /** Called when an answer is tapped, or chosen with the 1–3 keys. */
  onPick?: (option: FillInOption, index: number) => void
  /** Play the built-in loop (open slot, pick the first answer, finish, repeat) until the first interaction. Default: on when `options` is not passed. */
  autoPlay?: boolean
  /** Right-hand status labels. */
  status?: FillInStatus
  /** Footer lines. */
  foot?: FillInFoot
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const STYLES = `
.fil {
  --fil-ink: #000;
  --fil-surface: #fff;
  --fil-accent: #0060e2;
  --fil-t1: color-mix(in oklab, var(--fil-ink) 88%, transparent);
  --fil-t2: color-mix(in oklab, var(--fil-ink) 61%, transparent);
  --fil-t3: color-mix(in oklab, var(--fil-ink) 45%, transparent);
  --fil-t4: color-mix(in oklab, var(--fil-ink) 27%, transparent);
  --fil-fill: color-mix(in oklab, var(--fil-ink) 6%, transparent);
  --fil-line: color-mix(in oklab, var(--fil-ink) 6%, transparent);
  --fil-chip: var(--fil-surface);
  --fil-tint: color-mix(in oklab, var(--fil-accent) 10%, var(--fil-surface));
  --fil-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --fil-drop0: 0 24px 48px -24px rgb(0 0 0 / .12);
  --fil-drop1: 0 4px 10px -4px rgb(0 0 0 / .16);
  --fil-drop2: 0 8px 16px -6px rgb(0 0 0 / .22);
  --fil-drop3: 0 12px 24px -8px rgb(0 0 0 / .2);
  --fil-ease: cubic-bezier(.22, 1, .36, 1);
  --fil-fs: 22px; --fil-lh: 36px;
  position: relative; container-type: inline-size; width: 100%; max-width: 520px;
  font-family: var(--fil-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; color: var(--fil-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .fil {
  --fil-ink: #fff;
  --fil-surface: #1c1c1e;
  --fil-accent: #4d8dff;
  --fil-t1: color-mix(in oklab, var(--fil-ink) 90%, transparent);
  --fil-t2: color-mix(in oklab, var(--fil-ink) 62%, transparent);
  --fil-t3: color-mix(in oklab, var(--fil-ink) 46%, transparent);
  --fil-t4: color-mix(in oklab, var(--fil-ink) 28%, transparent);
  --fil-fill: color-mix(in oklab, var(--fil-ink) 8%, transparent);
  --fil-line: color-mix(in oklab, var(--fil-ink) 8%, transparent);
  --fil-chip: color-mix(in oklab, var(--fil-surface), var(--fil-ink) 8%);
  --fil-tint: color-mix(in oklab, var(--fil-accent) 18%, var(--fil-surface));
  --fil-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --fil-drop0: 0 24px 48px -24px rgb(0 0 0 / .5);
  --fil-drop1: 0 4px 10px -4px rgb(0 0 0 / .5);
  --fil-drop2: 0 8px 16px -6px rgb(0 0 0 / .6);
  --fil-drop3: 0 12px 24px -8px rgb(0 0 0 / .6);
}
.fil *, .fil *::before, .fil *::after { box-sizing: border-box }
:where(.fil) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.fil-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.fil-card {
  background: var(--fil-surface); border-radius: 24px; padding: 26px 32px 24px;
  box-shadow: var(--fil-shadow), var(--fil-drop0);
}
.fil-body { transition: opacity .22s var(--fil-ease), filter .22s var(--fil-ease) }
.fil-body[data-leaving] { opacity: 0; filter: blur(6px); pointer-events: none }

/* Header: who is writing, and a status that crossfades in place */
.fil-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 13px; font-weight: 500; line-height: 18px; color: var(--fil-t3) }
.fil-l { display: flex; gap: 8px; min-width: 0 }
.fil-agent { flex: none; font-weight: 600; color: var(--fil-t2) }
.fil-ctx { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.fil-st { display: grid; justify-items: end; flex: none; transition: color .3s var(--fil-ease) }
.fil-st[data-tone="ask"] { color: var(--fil-accent) }
.fil-sw { display: grid }
.fil-sw > span { grid-area: 1 / 1; white-space: nowrap }
.fil-st .fil-sw { justify-items: end }
.fil-sw-in { animation: fil-swin .42s var(--fil-ease) .08s backwards }
.fil-sw-out { animation: fil-swout .2s var(--fil-ease) forwards; pointer-events: none }

/* Sentence zone: as tall as the sentence or the options below the slot, whichever is more */
.fil-zone { position: relative; margin-top: 26px; transition: height .42s var(--fil-ease) }
.fil-text {
  margin: 0; font-size: var(--fil-fs); line-height: var(--fil-lh); font-weight: 500; letter-spacing: var(--fil-ls, -.018em); color: var(--fil-t1);
  text-wrap: pretty; outline: none;
}
.fil-w { display: inline-block; animation: fil-in .42s var(--fil-ease) calc(var(--i) * 34ms) backwards }
.fil-post { visibility: hidden; animation: none }
.fil[data-filled] .fil-post { visibility: visible; animation: fil-in .44s var(--fil-ease) calc(var(--i) * 34ms + 840ms) backwards }

/* The empty slot: a quiet accent well with a blinking caret */
.fil-slot {
  position: relative; display: inline-block; vertical-align: top; max-width: 100%; border-radius: 12px;
  height: calc(var(--fil-lh) + 4px); margin: -2px 0; width: 190px;
  animation: fil-in .42s var(--fil-ease) calc(var(--i) * 34ms) backwards;
}
.fil-slot::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--fil-accent) 45%, transparent);
  background: color-mix(in oklab, var(--fil-accent) 5%, transparent); transition: opacity .16s var(--fil-ease);
}
.fil-slot::after {
  content: ""; position: absolute; left: 14px; top: calc(50% - 10px); width: 2px; height: 20px; border-radius: 1px;
  background: var(--fil-accent); animation: fil-caret 1.1s steps(2, jump-none) infinite; transition: opacity .16s var(--fil-ease);
}
.fil[data-filled] .fil-slot::before, .fil[data-filled] .fil-slot::after { opacity: 0; animation: none }
.fil[data-idle] .fil-slot::after { animation-play-state: paused }

/* Answers: real buttons set in the sentence's own type */
.fil-opts { position: absolute; left: 0; right: 0; top: 80px; display: flex; flex-wrap: wrap; gap: 10px 8px; z-index: 1 }
.fil[data-stage="write"] .fil-opts { visibility: hidden }
.fil-opt {
  position: relative; display: block; max-width: 100%; height: calc(var(--fil-lh) + 4px); padding: 0 14px; border-radius: 12px;
  background: var(--fil-chip); color: var(--fil-t1); white-space: nowrap;
  font-size: var(--fil-fs); font-weight: 500; line-height: calc(var(--fil-lh) + 4px); letter-spacing: var(--fil-ls, -.018em);
  box-shadow: var(--fil-shadow), var(--fil-drop1);
  transition: background-color .3s var(--fil-ease), color .3s var(--fil-ease), box-shadow .3s var(--fil-ease), filter .24s var(--fil-ease), opacity .24s var(--fil-ease);
}
.fil[data-stage="ask"] .fil-opt, .fil[data-stage="fill"] .fil-opt, .fil[data-stage="done"] .fil-opt {
  animation: fil-rise .52s var(--fil-ease) calc(var(--i) * 80ms) backwards;
}
.fil-opt::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: var(--fil-drop3); opacity: 0; pointer-events: none;
}
.fil-opt:hover, .fil-opt[data-hot] { box-shadow: var(--fil-shadow), var(--fil-drop2) }
.fil-opt:focus-visible { outline: 2px solid color-mix(in oklab, var(--fil-accent) 75%, transparent); outline-offset: 3px }
.fil-opt[data-state="gone"] { opacity: 0; filter: blur(4px); pointer-events: none }
.fil[data-stage="done"] .fil-opt[data-state="gone"] { display: none }
.fil-opt[data-state="picked"] {
  z-index: 3; background: var(--fil-tint); color: var(--fil-accent); box-shadow: none; transition-delay: .2s;
}

/* Footer: one quiet consequence line */
.fil-foot { margin: 20px 0 0; font-size: 13px; line-height: 18px; color: var(--fil-t3) }
.fil-foot .fil-sw { justify-items: start }

@keyframes fil-in { from { opacity: 0; filter: blur(6px); transform: translateY(5px) } }
@keyframes fil-rise { from { opacity: 0; filter: blur(6px); transform: translateY(14px) } }
@keyframes fil-swin { from { opacity: 0; filter: blur(5px); transform: translateY(5px) } }
@keyframes fil-swout { to { opacity: 0; filter: blur(5px); transform: translateY(-4px) } }
@keyframes fil-caret { 0% { opacity: 1 } 50% { opacity: 0 } }

/* Mono: ink on paper, a hairline, flat offset shadows and a monospaced face */
html[data-style="mono"] .fil {
  --fil-ink: #000; --fil-surface: #fff; --fil-accent: #111; --fil-ls: 0; --fil-fs: 18px; --fil-lh: 30px;
  --fil-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  --fil-drop0: 0 0 0 0 transparent; --fil-drop1: 2px 2px 0 0 rgb(0 0 0 / .08);
  --fil-drop2: 3px 3px 0 0 rgb(0 0 0 / .12); --fil-drop3: 3px 3px 0 0 rgb(0 0 0 / .12);
  --fil-ease: cubic-bezier(.2, .9, .1, 1);
  --fil-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .fil {
  --fil-ink: #fff; --fil-surface: #0a0a0a; --fil-accent: #f2f2f2;
  --fil-shadow: 0 0 0 1px rgb(255 255 255 / .16);
  --fil-drop1: 2px 2px 0 0 rgb(255 255 255 / .06); --fil-drop2: 3px 3px 0 0 rgb(255 255 255 / .1); --fil-drop3: 3px 3px 0 0 rgb(255 255 255 / .1);
}
html[data-style="mono"] .fil-card { border-radius: 8px }
html[data-style="mono"] .fil-slot, html[data-style="mono"] .fil-opt { border-radius: 4px }

/* Glass: the card carries the frost; chips and the picked pill stay quiet tints on top of it */
html[data-style="glass"] .fil {
  --fil-ink: var(--pane-ink); --fil-surface: var(--pane-solid); --fil-accent: var(--pane-accent);
  --fil-shadow: var(--pane-shadow); --fil-ease: var(--pane-ease); --fil-font: var(--pane-font);
  --fil-t1: var(--pane-t1); --fil-t2: var(--pane-t2); --fil-t3: var(--pane-t3); --fil-t4: var(--pane-t4);
  --fil-chip: rgb(255 255 255 / .72);
  --fil-tint: color-mix(in oklab, var(--fil-accent) 16%, rgb(255 255 255 / .7));
}
html[data-style="glass"].dark .fil {
  --fil-chip: rgb(255 255 255 / .1);
  --fil-tint: color-mix(in oklab, var(--fil-accent) 26%, rgb(24 24 32 / .7));
}
html[data-style="glass"] .fil-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .fil-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .fil-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .fil-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .fil-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .fil-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

@container (max-width: 440px) {
  .fil { --fil-fs: 20px; --fil-lh: 32px }
  .fil-card { padding: 22px 20px 20px; border-radius: 22px }
  .fil-zone { margin-top: 22px }
}
/* Touch: same visual size, a 44px tap target */
@media (pointer: coarse) { .fil-opt::before { content: ""; position: absolute; inset: -3px -2px } }
@media (prefers-reduced-motion: reduce) {
  .fil *, .fil *::before, .fil *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const EASE = "cubic-bezier(.22, 1, .36, 1)"
const FLY = 760
const STAGGER = 34

/** A damped spring sampled into a CSS linear() ramp, so a plain WAAPI animation overshoots and settles. */
let springCache: string | null = null
function spring() {
  if (springCache) return springCache
  if (typeof CSS === "undefined" || !CSS.supports("animation-timing-function", "linear(0, 1)")) return (springCache = EASE)
  const z = 0.74, w = 13, n = 56
  const wd = w * Math.sqrt(1 - z * z)
  const pts: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push(i === n ? 1 : +(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))).toFixed(4))
  }
  return (springCache = `linear(${pts.join(",")})`)
}

const rmQuery = "(prefers-reduced-motion: reduce)"
const rmSubscribe = (cb: () => void) => {
  const m = window.matchMedia(rmQuery)
  m.addEventListener("change", cb)
  return () => m.removeEventListener("change", cb)
}
const rmSnapshot = () => window.matchMedia(rmQuery).matches
const rmServer = () => false

const setTr = (el: HTMLElement, v: string) => el.style.setProperty("translate", v)

const words = (s?: string) => (s ? s.split(" ").filter(Boolean) : [])
const optId = (o: FillInOption) => o.id ?? o.label

/** Text that changes in place: the old string blurs up and out while the new one blurs in. */
function Swap({ text, className, tone }: { text: string; className?: string; tone?: string }) {
  const [cur, setCur] = React.useState({ k: 0, t: text })
  const [old, setOld] = React.useState<{ k: number; t: string } | null>(null)
  if (cur.t !== text) {
    setOld(cur)
    setCur({ k: cur.k + 1, t: text })
  }
  React.useEffect(() => {
    if (!old) return
    const id = window.setTimeout(() => setOld(null), 260)
    return () => window.clearTimeout(id)
  }, [old])
  return (
    <div className={className} data-tone={tone}>
      <div className="fil-sw">
        {old && (
          <span key={old.k} className="fil-sw-out" aria-hidden>
            {old.t}
          </span>
        )}
        <span key={cur.k} className={old || cur.k > 0 ? "fil-sw-in" : undefined}>
          {cur.t}
        </span>
      </div>
    </div>
  )
}

type Stage = "write" | "ask" | "fill" | "done"

const DEMO_OPTIONS: FillInOption[] = [
  { label: "the $49 duplicate", note: "Refunds $49.00 to Visa ····4242" },
  { label: "both $49 charges", note: "Refunds $98.00 to Visa ····4242" },
]

/* -------------------------------------------------------------------------- */
/*                                   FillIn                                   */
/* -------------------------------------------------------------------------- */

export function FillIn(props: FillInProps) {
  const bare = props.options === undefined
  const {
    agent = "Sage",
    context = bare ? "Reply to Dana Okafor" : undefined,
    before = bare ? "Hi Dana, thanks for flagging the double charge. I'll refund" : "",
    after = bare ? "today, and you'll see it in 3–5 business days." : "",
    options = DEMO_OPTIONS,
    question = bare ? "What should Sage refund?" : "Which one should it be?",
    value,
    defaultValue = null,
    onPick,
    autoPlay = bare,
    status,
    foot,
    className,
  } = props
  const st = { writing: "Writing…", asking: "Waiting for you", done: "Draft ready", ...status }
  const ft = {
    writing: bare ? "Drafting from the Harbor & Finch refund policy" : "",
    asking: bare ? "Refunds $49.00 or $98.00 to Visa ····4242" : "",
    done: bare ? "Nothing sends until you approve it" : "",
    ...foot,
  }

  const rm = React.useSyncExternalStore(rmSubscribe, rmSnapshot, rmServer)
  const controlled = value !== undefined
  const [inner, setInner] = React.useState<string | null>(defaultValue)
  const pickedId = controlled ? value : inner
  const idx = pickedId == null ? -1 : options.findIndex((o) => optId(o) === pickedId)
  const picked = idx < 0 ? null : idx
  const option = picked == null ? null : options[picked]

  const [stage, setStage] = React.useState<Stage>(picked != null ? "done" : rm ? "ask" : "write")
  const [run, setRun] = React.useState(0)
  const [touched, setTouched] = React.useState(false)
  const [active, setActive] = React.useState(true)
  const [leaving, setLeaving] = React.useState(false)
  const [hot, setHot] = React.useState<number | null>(null)
  const auto = autoPlay && !controlled && !touched
  const touchedRef = React.useRef(false)
  React.useEffect(() => {
    touchedRef.current = touched
  })

  // The stage follows the answer: picking starts the fill, clearing it starts a fresh sentence.
  if (picked != null && (stage === "write" || stage === "ask")) setStage("fill")
  else if (picked == null && (stage === "fill" || stage === "done")) {
    setStage(rm ? "ask" : "write")
    setRun((r) => r + 1)
  }

  const rootRef = React.useRef<HTMLDivElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const zoneRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLParagraphElement>(null)
  const slotRef = React.useRef<HTMLSpanElement>(null)
  const optsRef = React.useRef<HTMLDivElement>(null)
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const pre = words(before)
  const post = words(after)

  const pick = (i: number) => {
    const o = options[i]
    if (!o || picked != null) return
    if (!controlled) setInner(optId(o))
    onPick?.(o, i)
  }
  const pickRef = React.useRef(pick)
  React.useEffect(() => {
    pickRef.current = pick
  })

  /* Layout: the slot is as wide as the widest answer, the answers sit one line under it, and the zone is as tall as
     the sentence or the answers, whichever is more. Once filled the slot takes the picked answer's width and the
     zone collapses to the sentence. Written straight to the DOM so no frame ever shows a half-measured state. */
  const measure = () => {
    const zone = zoneRef.current, text = textRef.current, slot = slotRef.current, opts = optsRef.current
    if (!zone || !text || !slot || !opts) return
    const b = picked != null ? btnRefs.current[picked] : null
    if (b) setTr(b, "")
    const widest = Math.max(0, ...btnRefs.current.map((x) => x?.offsetWidth ?? 0))
    slot.style.width = `${b ? b.offsetWidth : Math.min(widest, text.clientWidth)}px`
    const top = slot.offsetTop + slot.offsetHeight + 16
    opts.style.top = `${top}px`
    if (b) {
      const s = slot.getBoundingClientRect(), r = b.getBoundingClientRect()
      setTr(b, `${s.left - r.left}px ${s.top - r.top}px`)
    }
    zone.style.height = `${b ? text.offsetHeight : Math.max(text.offsetHeight, top + opts.offsetHeight)}px`
  }
  const measureRef = React.useRef(measure)
  React.useLayoutEffect(() => {
    measureRef.current = measure
  })

  const optionKey = options.map(optId).join("|")
  const isDone = stage === "done"
  React.useLayoutEffect(() => {
    measureRef.current()
  }, [run, before, after, optionKey, isDone])

  React.useEffect(() => {
    const card = cardRef.current
    if (!card) return
    let lastW = Math.round(card.getBoundingClientRect().width)
    const ro = new ResizeObserver(() => {
      const w = Math.round(card.getBoundingClientRect().width)
      if (w === lastW) return
      lastW = w
      measureRef.current()
    })
    ro.observe(card)
    let gone = false
    void document.fonts?.ready.then(() => !gone && measureRef.current())
    return () => {
      gone = true
      ro.disconnect()
    }
  }, [])

  /* The decisive moment: the picked answer lifts off, flies to the slot on a spring while its shadow rises and
     settles, and the slot opens to its width. The final translate is written first, so if animations never run
     the answer still sits in the slot. */
  const flown = React.useRef(true)
  React.useLayoutEffect(() => {
    const animate = !flown.current && !rm
    flown.current = false
    const slot = slotRef.current, text = textRef.current, opts = optsRef.current
    const b = picked != null ? btnRefs.current[picked] : null
    if (!b || !slot || !text || !opts || stage === "done") return
    btnRefs.current.forEach((x) => x?.getAnimations().forEach((a) => a.cancel()))
    const prevW = slot.offsetWidth
    setTr(b, "")
    const bw = b.offsetWidth
    slot.style.width = `${bw}px`
    const s = slot.getBoundingClientRect(), r = b.getBoundingClientRect()
    const to = `${s.left - r.left}px ${s.top - r.top}px`
    setTr(b, to)
    if (opts.contains(document.activeElement)) text.focus({ preventScroll: true })
    if (!animate) return
    const sp = spring()
    b.animate([{ translate: "0 0" }, { translate: to }], { duration: FLY, easing: sp })
    b.animate([{ scale: 1 }, { scale: 1.04, offset: 0.35 }, { scale: 1 }], { duration: FLY, easing: EASE })
    b.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: FLY, easing: EASE, pseudoElement: "::after" })
    if (Math.abs(prevW - bw) > 1) slot.animate([{ width: `${prevW}px` }, { width: `${bw}px` }], { duration: 360, delay: 300, easing: sp, fill: "backwards" })
  }, [picked, run]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stage timers: the sentence is written, then the options open; after the flight the tail words arrive.
  React.useEffect(() => {
    if (stage === "write") {
      const id = window.setTimeout(() => setStage("ask"), pre.length * STAGGER + 260)
      return () => window.clearTimeout(id)
    }
    if (stage === "fill") {
      const id = window.setTimeout(() => setStage("done"), rm ? 0 : FLY + 80 + post.length * STAGGER + 440)
      return () => window.clearTimeout(id)
    }
  }, [stage, run, pre.length, post.length, rm])

  // Visible only while on screen and in a foreground tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = true
    let foreground = document.visibilityState !== "hidden"
    const sync = () => setActive(onScreen && foreground)
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      sync()
    }, { threshold: 0.05 })
    io.observe(el)
    const onVis = () => {
      foreground = document.visibilityState !== "hidden"
      sync()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  // Built-in loop: pick the first answer, hold the finished sentence, fade, start again. Pauses off screen.
  React.useEffect(() => {
    if (!auto || !active || rm) return
    const ids: number[] = []
    const at = (fn: () => void, ms: number) => ids.push(window.setTimeout(fn, ms))
    if (stage === "ask") {
      at(() => setHot(0), 1000)
      at(() => {
        setHot(null)
        pickRef.current(0)
      }, 1400)
    } else if (stage === "done") {
      at(() => setLeaving(true), 3000)
      at(() => {
        setLeaving(false)
        setInner(null)
      }, 3240)
    }
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      // A paused loop always rests on a visible frame, never mid-fade or mid-hover.
      setLeaving(false)
      setHot(null)
    }
  }, [auto, active, rm, stage])

  // After "Ask again": if the trigger that cleared the answer unmounted and focus fell to the page, bring it back to the options.
  React.useEffect(() => {
    if (run === 0 || stage !== "ask" || !touchedRef.current) return
    const a = document.activeElement
    if (!a || a === document.body) btnRefs.current[0]?.focus({ preventScroll: true })
  }, [run, stage])

  const stop = () => {
    if (touched) return
    setTouched(true)
    setLeaving(false)
    setHot(null)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (stage !== "ask" || picked != null || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
    const n = /^[1-9]$/.test(e.key) ? Number(e.key) : 0
    if (n >= 1 && n <= options.length) {
      e.preventDefault()
      pick(n - 1)
      return
    }
    const cur = btnRefs.current.findIndex((b) => b === document.activeElement)
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (cur >= 0 && step) {
      e.preventDefault()
      btnRefs.current[(cur + step + options.length) % options.length]?.focus()
    }
  }

  const statusText = stage === "ask" ? st.asking : stage === "done" ? st.done : st.writing
  const footText = stage === "write" ? ft.writing : stage === "ask" ? ft.asking : stage === "fill" ? (option?.note ?? ft.writing) : ft.done
  const hasFoot = !!(ft.writing || ft.asking || ft.done || options.some((o) => o.note))
  const announce =
    stage === "ask"
      ? `${agent} stopped mid-sentence and needs an answer. ${question}`
      : stage === "fill" && option
        ? `You chose ${option.label}. ${agent} is writing.`
        : stage === "done"
          ? `${st.done}.`
          : ""

  const label = context ? `${agent}, ${context}` : agent

  const nodes: React.ReactNode[] = []
  pre.forEach((w, i) => {
    nodes.push(
      <span key={`a${i}`} className="fil-w" style={{ "--i": i } as React.CSSProperties}>
        {w}
      </span>,
      " ",
    )
  })
  nodes.push(
    <span key="slot" ref={slotRef} className="fil-slot" style={{ "--i": pre.length } as React.CSSProperties} aria-hidden={option ? undefined : true}>
      {option && <span className="fil-sr">{option.label}</span>}
    </span>,
  )
  post.forEach((w, i) => {
    nodes.push(
      " ",
      <span key={`z${i}`} className="fil-w fil-post" style={{ "--i": i } as React.CSSProperties}>
        {w}
      </span>,
    )
  })

  return (
    <div
      ref={rootRef}
      className={cn("fil", className)}
      data-stage={stage}
      data-filled={picked != null || undefined}
      data-idle={!active || undefined}
      onPointerDownCapture={stop}
      onKeyDownCapture={stop}
      onKeyDown={onKeyDown}
    >
      <style href="fill-in" precedence="default">
        {STYLES}
      </style>
      <div ref={cardRef} className="fil-card" role="group" aria-label={label}>
        <div className="fil-body" data-leaving={leaving || undefined}>
          <div className="fil-meta">
            <div className="fil-l">
              <b className="fil-agent">{agent}</b>
              {context && <span className="fil-ctx">{context}</span>}
            </div>
            <Swap className="fil-st" text={statusText} tone={stage === "ask" ? "ask" : undefined} />
          </div>

          <div ref={zoneRef} className="fil-zone">
            <p key={`t${run}`} ref={textRef} className="fil-text" tabIndex={-1}>
              {nodes}
            </p>
            <div key={`o${run}`} ref={optsRef} className="fil-opts" role="group" aria-label={question} inert={picked != null}>
              {options.map((o, i) => (
                <button
                  key={optId(o)}
                  ref={(el) => {
                    btnRefs.current[i] = el
                  }}
                  type="button"
                  className="fil-opt"
                  style={{ "--i": i } as React.CSSProperties}
                  data-state={picked == null ? undefined : i === picked ? "picked" : "gone"}
                  data-hot={hot === i || undefined}
                  aria-keyshortcuts={String(i + 1)}
                  onClick={() => pick(i)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {hasFoot && <Swap className="fil-foot" text={footText} />}
        </div>
      </div>
      <span className="fil-sr" role="status" aria-live={auto ? "off" : "polite"}>
        {announce}
      </span>
    </div>
  )
}

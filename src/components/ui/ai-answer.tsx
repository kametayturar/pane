"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AnswerSource = {
  /** Short source name shown on cards and citation chips, e.g. "Notion". */
  name: string
  /** Document or page title. */
  title: string
  href?: string
  /** Text shown in the citation preview. */
  snippet?: string
  /** Optional 14px icon (an <img>, an svg or an emoji). Falls back to a letter. */
  icon?: React.ReactNode
}

export type AnswerFeedback = "up" | "down"

export type AIAnswerProps = {
  question: string
  sources?: AnswerSource[]
  /**
   * The answer text. Blank line = new paragraph · "- " = list item · **bold** ·
   * [1] or [1,2] = citation (1-based). It may grow while streaming; a different text starts over.
   */
  answer: string
  /** More text is still coming from your model. */
  streaming?: boolean
  /** Reveal the text word by word at a steady pace. false shows it at once. */
  animate?: boolean
  /** Words per second while revealing. */
  speed?: number
  /** Follow-up questions shown once the answer is done. */
  followUps?: string[]
  onFollowUp?: (question: string) => void
  onRegenerate?: () => void
  /** Shows a Stop button while writing – cancel your request here. */
  onStop?: () => void
  onFeedback?: (value: AnswerFeedback, reason?: string) => void
  /** Called with the copied text: the answer without markup plus a numbered source list. */
  onCopy?: (text: string) => void
  feedbackReasons?: string[]
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Parser                                   */
/* -------------------------------------------------------------------------- */

type Inline =
  | { type: "text"; value: string; bold?: boolean }
  | { type: "cite"; ids: number[]; trail?: string }

type Block = { type: "p"; inlines: Inline[] } | { type: "ul"; items: Inline[][] }

const INLINE_RE = /\*\*(.+?)\*\*|\[(\d+(?:\s*,\s*\d+)*)\]/g

function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of text.matchAll(INLINE_RE)) {
    const i = m.index ?? 0
    if (i > last) out.push({ type: "text", value: text.slice(last, i) })
    if (m[1] !== undefined) out.push({ type: "text", value: m[1], bold: true })
    else out.push({ type: "cite", ids: m[2].split(",").map((n) => Number(n.trim())) })
    last = i + m[0].length
  }
  let rest = text.slice(last)
  // An unclosed "**" bolds the rest instead of showing asterisks.
  const open = rest.indexOf("**")
  if (open !== -1) {
    if (open > 0) out.push({ type: "text", value: rest.slice(0, open) })
    out.push({ type: "text", value: rest.slice(open + 2), bold: true })
    rest = ""
  }
  if (rest) out.push({ type: "text", value: rest })

  // Glue punctuation right after a citation to the chip, so "." never wraps onto its own line.
  for (let i = 0; i < out.length - 1; i++) {
    const cur = out[i]
    const next = out[i + 1]
    if (cur.type !== "cite" || next.type !== "text" || next.bold) continue
    const punct = next.value.match(/^[.,;:!?)]+/)?.[0]
    if (!punct) continue
    cur.trail = punct
    next.value = next.value.slice(punct.length)
  }
  return out.filter((n) => n.type !== "text" || n.value !== "")
}

function parseAnswer(answer: string, writing: boolean): Block[] {
  let text = answer.replace(/\r\n/g, "\n")
  // While writing, show whole words only: each word mounts once, complete, and animates in.
  // This also hides a half-written "**", "[1," or a lone "-" until it is finished.
  if (writing) text = text.replace(/\S+$/, "")
  const blocks: Block[] = []
  for (const chunk of text.split(/\n{2,}/)) {
    let para: string[] = []
    let list: string[] = []
    const flushPara = () => {
      if (para.length) blocks.push({ type: "p", inlines: parseInline(para.join(" ")) })
      para = []
    }
    const flushList = () => {
      if (list.length) blocks.push({ type: "ul", items: list.map(parseInline) })
      list = []
    }
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue
      const item = line.match(/^\s*[-*]\s+(.*)$/)
      if (item) {
        flushPara()
        list.push(item[1])
      } else {
        flushList()
        para.push(line.trim())
      }
    }
    flushPara()
    flushList()
  }
  return blocks
}

/** Plain text for the clipboard: no ** markers, citations kept as [n], sources appended. */
function toClipboardText(answer: string, sources: AnswerSource[]) {
  const body = answer.replace(/\*\*(.+?)\*\*/g, "$1").trim()
  if (!sources.length) return body
  const list = sources
    .map((s, i) => `[${i + 1}] ${s.name} – ${s.title}${s.href ? ` (${s.href})` : ""}`)
    .join("\n")
  return `${body}\n\nSources:\n${list}`
}

/* -------------------------------------------------------------------------- */
/*                                   Hooks                                    */
/* -------------------------------------------------------------------------- */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function useReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
}

/** End of the next word after `from`, including the whitespace that follows it. */
function nextWordEnd(text: string, from: number) {
  let i = from
  while (i < text.length && /\s/.test(text[i])) i++
  while (i < text.length && !/\s/.test(text[i])) i++
  while (i < text.length && /\s/.test(text[i])) i++
  return i
}

/**
 * Releases `text` word by word at a steady pace, however unevenly the model sends it.
 * Falls further behind than ~2 seconds and it speeds up to catch up.
 * Returns how many characters of `text` are revealed.
 */
function useSteadyReveal(text: string, enabled: boolean, wordsPerSecond: number) {
  const [revealed, setRevealed] = React.useState({ text: "", length: 0 })
  const state = React.useRef({ text: "", length: 0, carry: 0 })

  React.useEffect(() => {
    if (!enabled) return
    const s = state.current
    // A text that doesn't continue what is already shown starts over.
    if (!text.startsWith(s.text.slice(0, s.length))) {
      s.length = 0
      s.carry = 0
    }
    s.text = text
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const backlogWords = (text.length - s.length) / 6
      const pace = wordsPerSecond * Math.max(1, backlogWords / (wordsPerSecond * 2))
      s.carry += ((now - last) / 1000) * pace
      last = now
      let length = s.length
      while (s.carry >= 1 && length < text.length) {
        length = nextWordEnd(text, length)
        s.carry -= 1
      }
      if (length !== s.length) {
        s.length = length
        setRevealed({ text, length })
      }
      if (length < text.length) raf = requestAnimationFrame(tick)
      else s.carry = 0
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, enabled, wordsPerSecond])

  if (!enabled) return text.length
  // Derived, not stored: a reset text shows nothing until the next frame reveals it.
  return text.startsWith(revealed.text.slice(0, revealed.length)) ? Math.min(revealed.length, text.length) : 0
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

// React 19 hoists this tag into <head> and includes it once, however many answers render.
const CSS = `
.aia {
  --aia-ink: #000;
  --aia-surface: #fff;
  --aia-accent: #0060e2;
  --aia-t1: color-mix(in oklab, var(--aia-ink) 88%, transparent);
  --aia-t2: color-mix(in oklab, var(--aia-ink) 61%, transparent);
  --aia-t3: color-mix(in oklab, var(--aia-ink) 45%, transparent);
  --aia-t4: color-mix(in oklab, var(--aia-ink) 27%, transparent);
  --aia-icon: color-mix(in oklab, var(--aia-ink) 45%, transparent);
  --aia-fill: color-mix(in oklab, var(--aia-ink) 6%, transparent);
  --aia-fill-2: color-mix(in oklab, var(--aia-ink) 9%, transparent);
  --aia-line: color-mix(in oklab, var(--aia-ink) 6%, transparent);
  --aia-glint: rgb(255 255 255 / .82);
  --aia-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --aia-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --aia-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 640px;
  border-radius: 10px;
  background: var(--aia-surface);
  box-shadow: var(--aia-shadow);
  color: var(--aia-t1);
  font-family: var(--aia-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .aia {
  --aia-ink: #fff;
  --aia-surface: #1c1c1e;
  --aia-accent: #4d8dff;
  --aia-t1: color-mix(in oklab, var(--aia-ink) 90%, transparent);
  --aia-t2: color-mix(in oklab, var(--aia-ink) 62%, transparent);
  --aia-t3: color-mix(in oklab, var(--aia-ink) 46%, transparent);
  --aia-t4: color-mix(in oklab, var(--aia-ink) 28%, transparent);
  --aia-icon: color-mix(in oklab, var(--aia-ink) 50%, transparent);
  --aia-fill: color-mix(in oklab, var(--aia-ink) 8%, transparent);
  --aia-fill-2: color-mix(in oklab, var(--aia-ink) 12%, transparent);
  --aia-line: color-mix(in oklab, var(--aia-ink) 8%, transparent);
  --aia-glint: rgb(255 255 255 / .9);
  --aia-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --aia-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.aia *, .aia *::before, .aia *::after { box-sizing: border-box }
:where(.aia) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.aia :focus-visible { outline: 2px solid color-mix(in oklab, var(--aia-accent) 60%, transparent); outline-offset: 1px }

.aia-grow { transition: height .36s var(--aia-ease) }
.aia-inner { padding: 16px 16px 14px }
.aia-q { margin: 0 0 14px; font-size: 15px; line-height: 24px; font-weight: 500; color: var(--aia-ink); text-wrap: balance }

/* Source cards */
.aia-sources {
  display: flex; gap: 8px; margin: 0 -16px; padding: 2px 16px 4px; list-style: none;
  overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 16px; scrollbar-width: none;
  mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
}
.aia-sources::-webkit-scrollbar { display: none }
.aia-sources li { flex: none; scroll-snap-align: start; animation: aia-card .46s var(--aia-ease) backwards }
.aia-source {
  display: flex; flex-direction: column; gap: 4px; width: 150px; height: 77px; padding: 8px 10px 9px;
  border-radius: 8px; background: var(--aia-surface); box-shadow: var(--aia-shadow);
  color: inherit; text-decoration: none; transition: box-shadow .2s var(--aia-ease), background-color .2s;
}
a.aia-source:hover { background: color-mix(in oklab, var(--aia-surface), var(--aia-ink) 2%) }
.aia-source[data-active] {
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--aia-accent) 50%, transparent), 0 0 0 4px color-mix(in oklab, var(--aia-accent) 10%, transparent);
}
.aia-site { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; line-height: 16px; color: var(--aia-t2) }
.aia-site-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.aia-num { margin-left: auto; font-size: 10px; font-weight: 500; letter-spacing: .5px; color: var(--aia-t4); font-variant-numeric: tabular-nums }
.aia-fav {
  display: grid; place-items: center; flex: none; width: 14px; height: 14px; overflow: hidden; border-radius: 4px;
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--aia-ink) 10%, transparent);
  font-size: 9px; font-weight: 600; line-height: 1; color: var(--aia-t2);
}
.aia-fav > * { width: 100%; height: 100% }
.aia-fav[data-letter] { background: var(--aia-fill) }
.aia-title {
  font-size: 13px; line-height: 20px; font-weight: 500; color: var(--aia-ink);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Label row */
.aia-label { display: flex; align-items: center; gap: 6px; margin: 16px 0 6px; font-size: 12px; line-height: 16px; color: var(--aia-t2) }
.aia-mark { width: 16px; height: 16px; flex: none; color: var(--aia-accent) }
.aia-mark path { transform-box: fill-box; transform-origin: center }
.aia-mark[data-busy] .aia-mark-a { animation: aia-breathe 1.4s ease-in-out infinite }
.aia-mark[data-busy] .aia-mark-b { animation: aia-twinkle 1.4s ease-in-out infinite }
.aia-shimmer { position: relative }
.aia-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, var(--aia-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text;
  animation: aia-sweep 1.6s linear infinite;
}

/* Blur crossfade for text that changes in place */
.aia-swap { display: inline-grid; vertical-align: top }
.aia-swap > * { grid-area: 1 / 1; white-space: nowrap }
.aia-swap-in { animation: aia-swap-in .42s var(--aia-ease) backwards }
.aia-swap-out { animation: aia-swap-out .42s var(--aia-ease) forwards; pointer-events: none }

/* Answer */
.aia-answer p { margin: 0 0 8px }
.aia-answer ul { margin: 0 0 8px; padding: 0 0 0 18px; list-style: disc }
.aia-answer li { margin: 0 0 4px; padding-left: 2px }
.aia-answer li::marker { color: var(--aia-t4) }
.aia-answer > :last-child { margin-bottom: 0 }
.aia-w { animation: aia-word .42s var(--aia-ease) backwards }
.aia-w[data-bold] { font-weight: 500; color: var(--aia-ink) }
.aia-caret {
  display: inline-block; width: 6px; height: 6px; margin-left: 4px; vertical-align: 1.3px; border-radius: 1.5px;
  background: color-mix(in oklab, var(--aia-accent) 76.5%, transparent);
  animation: aia-pulse 1s ease-in-out infinite;
}

/* Citation chips */
.aia-cite-wrap { position: relative; display: inline-block; white-space: nowrap }
.aia .aia-cite {
  display: inline-flex; align-items: center; gap: 3px; height: 18px; margin: 0 1px 0 3px; padding: 0 6px;
  border-radius: 5px; background: var(--aia-fill); box-shadow: inset 0 0 0 .5px var(--aia-line);
  font-size: 11px; line-height: 11px; font-weight: 500; color: var(--aia-t2); vertical-align: 1px;
  transition: background-color .16s, color .16s;
  animation: aia-chip .38s var(--aia-ease) backwards;
}
.aia .aia-cite:hover, .aia .aia-cite[data-active] { background: var(--aia-fill-2); color: var(--aia-ink) }

/* Citation preview */
.aia-tip {
  position: absolute; top: calc(100% + 6px); z-index: 50; width: 280px; max-width: calc(100vw - 32px);
  padding: 4px; border-radius: 10px; background: var(--aia-surface); box-shadow: var(--aia-float);
  white-space: normal; animation: aia-tip .2s var(--aia-ease) backwards;
}
.aia-tip-item { display: block; padding: 8px; border-radius: 7px; color: inherit; text-decoration: none; transition: background-color .16s }
a.aia-tip-item:hover { background: var(--aia-fill) }
.aia-tip-title { display: block; margin-top: 4px; font-weight: 500; color: var(--aia-ink) }
.aia-tip-snippet { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px; font-size: 12px; line-height: 17px; color: var(--aia-t2) }

/* Follow-ups */
.aia-follow { margin-top: 16px; animation: aia-fade .32s var(--aia-ease) backwards; animation-delay: .1s }
.aia-follow-label { display: block; padding-bottom: 4px; font-size: 10px; line-height: 16px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; color: var(--aia-t3) }
.aia-follow ul { margin: 0; padding: 0; list-style: none }
.aia .aia-follow-item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; padding: 6px 0;
  border-top: .5px solid var(--aia-line); text-align: left; color: var(--aia-t1); transition: color .16s;
}
.aia .aia-follow-item:hover { color: var(--aia-ink) }
.aia-glyph { flex: none; width: 16px; height: 16px; color: var(--aia-t4); transition: transform .2s var(--aia-ease), color .16s }
.aia-follow-item:hover .aia-glyph { transform: translateX(2px); color: var(--aia-t2) }

/* Footer */
.aia-foot { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px 0 8px; border-top: .5px solid var(--aia-line) }
.aia-actions { display: flex; gap: 2px }
.aia .aia-action {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: 6px; color: var(--aia-icon);
  transition: background-color .16s, color .16s;
}
.aia .aia-action:hover { background: var(--aia-fill); color: var(--aia-ink) }
.aia .aia-action[aria-pressed="true"] { color: var(--aia-ink) }
.aia .aia-action:disabled { opacity: .4; pointer-events: none }
.aia-action svg { width: 16px; height: 16px }
.aia-status { margin-left: auto; font-size: 12px; line-height: 16px; color: var(--aia-t3); font-variant-numeric: tabular-nums }
.aia .aia-stop {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; margin-left: auto; padding: 0 10px 0 8px;
  border-radius: 6px; background: var(--aia-surface); box-shadow: var(--aia-shadow);
  font-size: 13px; font-weight: 500; color: var(--aia-ink); animation: aia-fade .26s var(--aia-ease) backwards;
}
.aia-stop-icon { width: 8px; height: 8px; border-radius: 2px; background: currentColor }
.aia-reasons { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 0 12px 12px 14px; animation: aia-fade .32s var(--aia-ease) backwards }
.aia-reasons-label { margin-right: 2px; font-size: 12px; line-height: 16px; color: var(--aia-t3) }
.aia .aia-reason {
  height: 26px; padding: 0 8px; border-radius: 6px; box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--aia-ink) 12%, transparent);
  font-size: 12px; font-weight: 500; color: var(--aia-t2); transition: background-color .16s, color .16s;
}
.aia .aia-reason:hover { background: var(--aia-fill); color: var(--aia-ink) }

@keyframes aia-card { from { opacity: 0; transform: translateY(4px) scale(.97) } }
@keyframes aia-word { from { opacity: 0; filter: blur(3px) } }
@keyframes aia-chip { from { opacity: 0; transform: scale(.8) } }
@keyframes aia-fade { from { opacity: 0; transform: translateY(3px) } }
@keyframes aia-tip { from { opacity: 0; transform: translateY(-2px) scale(.98) } }
@keyframes aia-pulse { 50% { opacity: .3 } }
@keyframes aia-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes aia-breathe { 50% { transform: scale(.86) } }
@keyframes aia-twinkle { 50% { opacity: .3; transform: scale(.6) rotate(45deg) } }
@keyframes aia-swap-in { from { opacity: 0; filter: blur(10px); transform: scale(.98) } }
@keyframes aia-swap-out { to { opacity: 0; filter: blur(10px); transform: scale(1.02) } }

@media (prefers-reduced-motion: reduce) {
  .aia *, .aia *::after { animation: none !important; transition: none !important }
  .aia-swap-out { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

function SparkMark({ busy }: { busy: boolean }) {
  return (
    <svg {...svg} className="aia-mark" data-busy={busy || undefined}>
      <path className="aia-mark-a" fill="currentColor" d="M6.5 1.75Q6.9 6.6 11.75 7 6.9 7.4 6.5 12.25 6.1 7.4 1.25 7 6.1 6.6 6.5 1.75Z" />
      <path className="aia-mark-b" fill="currentColor" d="M12 9.5q.2 2.3 2.5 2.5-2.3.2-2.5 2.5-.2-2.3-2.5-2.5 2.3-.2 2.5-2.5Z" />
    </svg>
  )
}
const CopyIcon = () => (
  <svg {...svg}>
    <rect x="5.25" y="5.25" width="8.5" height="8.5" rx="2.25" fill="currentColor" />
    <path d="M10.6 3.3a2 2 0 0 0-1.85-1.05h-4.5a2 2 0 0 0-2 2v4.5c0 .8.47 1.5 1.15 1.82" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)
const CheckIcon = () => (
  <svg {...svg}>
    <path d="m3.5 8.4 2.9 2.9 6.1-6.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const RedoIcon = () => (
  <svg {...svg}>
    <path d="M12.9 8.6a5 5 0 1 1-1.45-4.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12.1 2.2v2.7H9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ThumbIcon = ({ down }: { down?: boolean }) => (
  <svg {...svg} style={down ? { transform: "rotate(180deg)" } : undefined}>
    <rect x="1.75" y="6.75" width="2.75" height="7" rx=".9" fill="currentColor" />
    <path
      fill="currentColor"
      d="M5.75 7.1 8.4 2.55a1.2 1.2 0 0 1 2.2.9L10 6.25h2.6a1.6 1.6 0 0 1 1.57 1.92l-.93 4.5a1.6 1.6 0 0 1-1.57 1.28H5.75V7.1Z"
    />
  </svg>
)
const ChevronGlyph = () => (
  <svg {...svg} className="aia-glyph">
    <path d="m6.5 4.5 3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

function Favicon({ source }: { source: AnswerSource }) {
  return (
    <span className="aia-fav" data-letter={source.icon ? undefined : ""} aria-hidden>
      {source.icon ?? source.name.charAt(0).toUpperCase()}
    </span>
  )
}

/** Swaps text with a blur crossfade: the old text blurs out while the new one sharpens in. */
function BlurSwap({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 420)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className="aia-swap">
      {leaving !== null && (
        <span key={`out-${leaving}`} className="aia-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} className={cn(leaving !== null && "aia-swap-in", className)} data-text={shown}>
        {shown}
      </span>
    </span>
  )
}

/** Animates its height to follow its content (height: auto can't be transitioned). */
function AutoHeight({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const inner = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="aia-grow" style={animate && height !== null ? { height, overflow: "hidden" } : undefined}>
      <div ref={inner} style={{ display: "flow-root" }}>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------ Citation chip ------------------------------ */

function CitationChip({
  ids,
  sources,
  active,
  onActive,
}: {
  ids: number[]
  sources: AnswerSource[]
  active: boolean
  onActive: (ids: number[] | null) => void
}) {
  const cited = ids
    .map((id) => ({ id, source: sources[id - 1] }))
    .filter((c): c is { id: number; source: AnswerSource } => !!c.source)
  const [open, setOpen] = React.useState(false)
  const [alignRight, setAlignRight] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)
  const timer = React.useRef<number | undefined>(undefined)
  const tipId = React.useId()

  React.useEffect(() => () => window.clearTimeout(timer.current), [])
  if (!cited.length) return null

  const show = () => {
    window.clearTimeout(timer.current)
    const rect = ref.current?.getBoundingClientRect()
    if (rect) setAlignRight(rect.left + 280 > window.innerWidth - 16)
    setOpen(true)
    onActive(ids)
  }
  const hide = (delay = 120) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setOpen(false)
      onActive(null)
    }, delay)
  }

  return (
    <span
      ref={ref}
      className="aia-cite-wrap"
      onMouseEnter={show}
      onMouseLeave={() => hide()}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide(0)
      }}
    >
      <button
        type="button"
        className="aia-cite"
        data-active={active || open || undefined}
        aria-label={`Source: ${cited.map((c) => c.source.title).join(", ")}`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onFocus={show}
        onBlur={() => hide()}
        onClick={() => (open ? hide(0) : show())}
      >
        {cited[0].source.name}
        {cited.length > 1 && <span>+{cited.length - 1}</span>}
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="aia-tip"
          style={alignRight ? { right: 0 } : { left: 0 }}
          onMouseEnter={show}
          onMouseLeave={() => hide()}
        >
          {cited.map(({ id, source }) => {
            const Item = source.href ? "a" : "span"
            return (
              <Item
                key={id}
                className="aia-tip-item"
                {...(source.href ? { href: source.href, target: "_blank", rel: "noreferrer" } : {})}
              >
                <span className="aia-site">
                  <Favicon source={source} />
                  <span className="aia-site-name">{source.name}</span>
                  <span className="aia-num">{id}</span>
                </span>
                <span className="aia-tip-title">{source.title}</span>
                {source.snippet && <span className="aia-tip-snippet">{source.snippet}</span>}
              </Item>
            )
          })}
        </span>
      )}
    </span>
  )
}

/* ------------------------------ Inline content ----------------------------- */

function Inlines({
  inlines,
  sources,
  activeIds,
  onActive,
  caret,
}: {
  inlines: Inline[]
  sources: AnswerSource[]
  activeIds: number[] | null
  onActive: (ids: number[] | null) => void
  caret?: boolean
}) {
  // One flat list of word spans keyed by position. Revealing only appends words, so each
  // span mounts once and its blur-in plays once. Bold is an attribute, not a wrapper,
  // so closing a "**" never moves (and re-animates) words already on screen.
  const nodes: React.ReactNode[] = []
  let words = 0
  let cites = 0
  for (const n of inlines) {
    if (n.type === "cite") {
      const active = !!activeIds && n.ids.some((id) => activeIds.includes(id))
      nodes.push(
        <span key={`c${cites++}`} className="aia-cite-wrap">
          <CitationChip ids={n.ids} sources={sources} active={active} onActive={onActive} />
          {n.trail}
        </span>,
      )
      continue
    }
    for (const part of n.value.match(/\S+\s*|\s+/g) ?? []) {
      nodes.push(
        <span key={`w${words++}`} className="aia-w" data-bold={n.bold || undefined}>
          {part}
        </span>,
      )
    }
  }
  return (
    <>
      {nodes}
      {caret && <span className="aia-caret" aria-hidden />}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  AIAnswer                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_REASONS = ["Incorrect", "Missing a source", "Too long", "Not what I asked"]

export function AIAnswer({
  question,
  sources = [],
  answer,
  streaming = false,
  animate = true,
  speed = 38,
  followUps = [],
  onFollowUp,
  onRegenerate,
  onStop,
  onFeedback,
  onCopy,
  feedbackReasons = DEFAULT_REASONS,
  className,
}: AIAnswerProps) {
  const reducedMotion = useReducedMotion()
  const revealedLength = useSteadyReveal(answer, animate && !reducedMotion, speed)

  // Stop freezes the answer where it is, until a new answer starts.
  const [stoppedAt, setStoppedAt] = React.useState<{ answer: string; length: number } | null>(null)
  const stopped = stoppedAt !== null && answer.startsWith(stoppedAt.answer.slice(0, stoppedAt.length))
  const shownLength = stopped ? stoppedAt.length : revealedLength
  const shown = answer.slice(0, shownLength)
  const writing = !stopped && (streaming || shownLength < answer.length)

  const blocks = React.useMemo(() => parseAnswer(shown, writing), [shown, writing])
  const [activeIds, setActiveIds] = React.useState<number[] | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [feedback, setFeedback] = React.useState<AnswerFeedback | null>(null)
  const [askReason, setAskReason] = React.useState(false)
  const [reason, setReason] = React.useState<string | null>(null)

  // React to writing starting or ending (adjusting state during render, not in an effect).
  const [wasWriting, setWasWriting] = React.useState(writing)
  const [settling, setSettling] = React.useState(false)
  const [elapsed, setElapsed] = React.useState<number | null>(null)
  if (writing !== wasWriting) {
    setWasWriting(writing)
    setSettling(!writing) // keep gliding while the follow-ups appear
    if (writing) {
      setActiveIds(null) // a chip removed mid-hover never gets to clear its highlight
      setElapsed(null)
      setFeedback(null)
      setAskReason(false)
      setReason(null)
    }
  }
  if (streaming && stoppedAt && !stopped) setStoppedAt(null)

  React.useEffect(() => {
    if (!settling) return
    const id = window.setTimeout(() => setSettling(false), 500)
    return () => window.clearTimeout(id)
  }, [settling])

  // "Answered in" = from the first frame of writing until the last word is on screen.
  const startedAt = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (writing) {
      startedAt.current = performance.now()
      return
    }
    const start = startedAt.current
    startedAt.current = null
    if (start === null) return
    const ms = performance.now() - start
    const id = requestAnimationFrame(() => setElapsed(ms))
    return () => cancelAnimationFrame(id)
  }, [writing])

  const copyTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(copyTimer.current), [])
  const handleCopy = async () => {
    const text = toClipboardText(shown, sources)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* clipboard can be blocked (iframes, http); still report the copy */
    }
    onCopy?.(text)
    setCopied(true)
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  const vote = (value: AnswerFeedback) => {
    if (feedback === value) {
      setFeedback(null)
      setAskReason(false)
      return
    }
    setFeedback(value)
    setReason(null)
    setAskReason(value === "down")
    if (value === "up") onFeedback?.("up")
  }
  const pickReason = (r: string) => {
    setReason(r)
    setAskReason(false)
    onFeedback?.("down", r)
  }

  const waiting = writing && blocks.length === 0
  const label = waiting
    ? sources.length
      ? `Reading ${sources.length} source${sources.length === 1 ? "" : "s"}`
      : "Thinking"
    : writing
      ? "Writing"
      : "Answer"
  const status = feedback === "up" || reason ? "Thanks for the feedback" : elapsed !== null ? `Answered in ${(elapsed / 1000).toFixed(1)}s` : ""
  const lastIndex = blocks.length - 1

  return (
    <section className={cn("aia", className)} aria-busy={writing}>
      <style href="ai-answer" precedence="default">
        {CSS}
      </style>

      <AutoHeight animate={(writing || settling) && !activeIds}>
        <div className="aia-inner">
          <h3 className="aia-q">{question}</h3>

          {sources.length > 0 && (
            <ol className="aia-sources" aria-label="Sources">
              {sources.map((s, i) => {
                const id = i + 1
                const Card = s.href ? "a" : "div"
                return (
                  <li key={id} style={{ animationDelay: `${120 + i * 90}ms` }}>
                    <Card
                      className="aia-source"
                      data-active={activeIds?.includes(id) || undefined}
                      onMouseEnter={() => setActiveIds([id])}
                      onMouseLeave={() => setActiveIds(null)}
                      {...(s.href ? { href: s.href, target: "_blank", rel: "noreferrer" } : {})}
                    >
                      <span className="aia-site">
                        <Favicon source={s} />
                        <span className="aia-site-name">{s.name}</span>
                        <span className="aia-num">{id}</span>
                      </span>
                      <span className="aia-title">{s.title}</span>
                    </Card>
                  </li>
                )
              })}
            </ol>
          )}

          <div className="aia-label">
            <SparkMark busy={writing} />
            <BlurSwap text={label} className={writing ? "aia-shimmer" : undefined} />
          </div>

          <div className="aia-answer">
            {blocks.map((b, bi) => {
              const caretHere = writing && bi === lastIndex
              if (b.type === "p")
                return (
                  <p key={bi}>
                    <Inlines inlines={b.inlines} sources={sources} activeIds={activeIds} onActive={setActiveIds} caret={caretHere} />
                  </p>
                )
              return (
                <ul key={bi}>
                  {b.items.map((item, ii) => (
                    <li key={ii}>
                      <Inlines
                        inlines={item}
                        sources={sources}
                        activeIds={activeIds}
                        onActive={setActiveIds}
                        caret={caretHere && ii === b.items.length - 1}
                      />
                    </li>
                  ))}
                </ul>
              )
            })}
            {waiting && <span className="aia-caret" aria-hidden style={{ marginLeft: 0 }} />}
          </div>

          {!writing && followUps.length > 0 && (
            <div className="aia-follow">
              <span className="aia-follow-label">Related</span>
              <ul>
                {followUps.map((q) => (
                  <li key={q}>
                    <button type="button" className="aia-follow-item" onClick={() => onFollowUp?.(q)}>
                      <span>{q}</span>
                      <ChevronGlyph />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AutoHeight>

      <div className="aia-foot">
        <div className="aia-actions">
          <button type="button" className="aia-action" aria-label={copied ? "Copied" : "Copy answer"} title="Copy" onClick={handleCopy} disabled={waiting}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button type="button" className="aia-action" aria-label="Regenerate" title="Regenerate" onClick={onRegenerate} disabled={writing || !onRegenerate}>
            <RedoIcon />
          </button>
          <button type="button" className="aia-action" aria-label="Good answer" title="Good answer" aria-pressed={feedback === "up"} onClick={() => vote("up")} disabled={writing}>
            <ThumbIcon />
          </button>
          <button type="button" className="aia-action" aria-label="Bad answer" title="Bad answer" aria-pressed={feedback === "down"} onClick={() => vote("down")} disabled={writing}>
            <ThumbIcon down />
          </button>
        </div>
        {writing && onStop ? (
          <button
            type="button"
            className="aia-stop"
            onClick={() => {
              setStoppedAt({ answer, length: shownLength })
              onStop()
            }}
          >
            <span className="aia-stop-icon" aria-hidden />
            Stop
          </button>
        ) : (
          <span className="aia-status" aria-live="polite">
            {!writing && status && <BlurSwap text={status} />}
          </span>
        )}
      </div>

      {askReason && (
        <div className="aia-reasons">
          <span className="aia-reasons-label">What went wrong?</span>
          {feedbackReasons.map((r) => (
            <button key={r} type="button" className="aia-reason" onClick={() => pickReason(r)}>
              {r}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

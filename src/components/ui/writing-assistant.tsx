"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type WritingAssistantSpeech = "auto" | "simulate"

export type WritingAssistantProps = {
  /** Assistant name shown in the header. */
  name?: string
  /** One line under the name. */
  tagline?: string
  /** Line above the suggestions on the welcome view. */
  greeting?: string
  /** Chips on the welcome view. Clicking one sends it as a message. */
  suggestions?: string[]
  /** Placeholder of the message field. */
  placeholder?: string
  /**
   * Produces the reply for a message. Return the whole reply; it is revealed word by word.
   * Leave it out to use a built-in sample writer that returns a plausible rewrite.
   */
  respond?: (message: string) => string | Promise<string>
  /**
   * "auto" uses the browser's SpeechRecognition when it exists (and falls back to the simulation
   * if the browser cannot start it). "simulate" always plays the dictation sentence.
   */
  speech?: WritingAssistantSpeech
  /** The sentence typed into the field by the simulated dictation. */
  dictation?: string
  /** Words per second while a reply is revealed. */
  speed?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Defaults + demo                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_SUGGESTIONS = ["Tighten this intro", "Make it friendlier", "Fix the grammar", "Draft a follow-up"]
const DEFAULT_DICTATION = "Rewrite the second paragraph so it sounds more confident."
const FAILED_REPLY = "Sorry, I couldn't write that just now. Please try again."

const SAMPLE_REPLIES: { match: RegExp; reply: string }[] = [
  {
    match: /tight|short|trim|concise|intro/i,
    reply:
      "Here's a leaner opening:\n\nWe rebuilt onboarding around one question: what do you want to ship first? Setup now takes four minutes instead of twenty, and most teams are done before their coffee cools.\n\nI cut the preamble and kept the one number readers care about.",
  },
  {
    match: /friend|warm|casual|tone|soft/i,
    reply:
      "Try this warmer take:\n\nHi Dana, thanks so much for flagging this! We're on it, and I'll have an update for you by end of day tomorrow. Shout if anything changes on your side.\n\nI softened the opener and swapped the formal sign-off for something conversational.",
  },
  {
    match: /grammar|typo|proofread|fix/i,
    reply:
      "Cleaned up:\n\nThe team shipped the new dashboard last week, and its numbers are already more reliable than the old report's. Fewer people need to ask which version is current.\n\nChanges: fixed a tense shift, a dangling comparison and two stray commas.",
  },
  {
    match: /follow|reply|draft|email/i,
    reply:
      "Here's a short follow-up:\n\nSubject: Quick check-in on the proposal\n\nHi Sam, I wanted to circle back on the proposal I sent on Monday. Happy to walk through anything on a 15-minute call, whenever suits you.\n\nWant it more direct, or more casual?",
  },
  {
    match: /rewrite|confident|sound/i,
    reply:
      "Here's a more confident version:\n\nWe know this works. Three teams have already moved their reporting over, and each one cut review time in half. Let's make it the default next sprint.\n\nI replaced hedges like \"we think\" and \"might\" with direct statements.",
  },
]

const SAMPLE_FALLBACK =
  "Happy to help with that. Paste the text you'd like me to work on, or tell me the tone you're after, and I'll draft a version you can edit.\n\nI can shorten, soften, translate or rewrite it for a specific reader."

/** Built-in writer used when no `respond` is passed: a short pause, then a canned rewrite. */
function sampleWriter(message: string): Promise<string> {
  const reply = SAMPLE_REPLIES.find((r) => r.match.test(message))?.reply ?? SAMPLE_FALLBACK
  return new Promise((resolve) => window.setTimeout(() => resolve(reply), 1100))
}

/* -------------------------------------------------------------------------- */
/*                         Web Speech API (loose types)                       */
/* -------------------------------------------------------------------------- */

// SpeechRecognition is not part of TypeScript's DOM lib, so only what we use is described.
type SpeechResultLike = ArrayLike<{ transcript: string }> & { isFinal: boolean }
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<SpeechResultLike> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
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

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.wa {
  --wa-ink: #000;
  --wa-surface: #fff;
  --wa-accent: #0060e2;
  --wa-blue: #2f6bff;
  --wa-t1: color-mix(in oklab, var(--wa-ink) 88%, transparent);
  --wa-t2: color-mix(in oklab, var(--wa-ink) 61%, transparent);
  --wa-t3: color-mix(in oklab, var(--wa-ink) 45%, transparent);
  --wa-t4: color-mix(in oklab, var(--wa-ink) 27%, transparent);
  --wa-icon: color-mix(in oklab, var(--wa-ink) 45%, transparent);
  --wa-fill: color-mix(in oklab, var(--wa-ink) 6%, transparent);
  --wa-bubble: color-mix(in oklab, var(--wa-ink) 5%, transparent);
  --wa-line: color-mix(in oklab, var(--wa-ink) 6%, transparent);
  --wa-chip: rgb(255 255 255 / .7);
  --wa-chip-hover: #fff;
  --wa-glint: rgb(255 255 255 / .82);
  --wa-blob: .13;
  --wa-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --wa-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  height: 400px;
  border-radius: 10px;
  background: var(--wa-surface);
  box-shadow: var(--wa-shadow);
  color: var(--wa-t1);
  font-family: var(--wa-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .wa {
  --wa-ink: #fff;
  --wa-surface: #1c1c1e;
  --wa-accent: #4d8dff;
  --wa-blue: #6b9bff;
  --wa-t1: color-mix(in oklab, var(--wa-ink) 90%, transparent);
  --wa-t2: color-mix(in oklab, var(--wa-ink) 62%, transparent);
  --wa-t3: color-mix(in oklab, var(--wa-ink) 46%, transparent);
  --wa-t4: color-mix(in oklab, var(--wa-ink) 28%, transparent);
  --wa-icon: color-mix(in oklab, var(--wa-ink) 50%, transparent);
  --wa-fill: color-mix(in oklab, var(--wa-ink) 8%, transparent);
  --wa-bubble: color-mix(in oklab, var(--wa-ink) 9%, transparent);
  --wa-line: color-mix(in oklab, var(--wa-ink) 8%, transparent);
  --wa-chip: rgb(255 255 255 / .06);
  --wa-chip-hover: rgb(255 255 255 / .1);
  --wa-glint: rgb(255 255 255 / .9);
  --wa-blob: .18;
  --wa-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.wa *, .wa *::before, .wa *::after { box-sizing: border-box }
:where(.wa) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.wa :focus-visible { outline: 2px solid color-mix(in oklab, var(--wa-accent) 60%, transparent); outline-offset: 1px }
.wa-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }

/* Header */
.wa-head { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 16px; border-bottom: .5px solid var(--wa-line) }
.wa-id { flex: 1; min-width: 0 }
.wa-name { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 13px; line-height: 20px; font-weight: 500; color: var(--wa-ink) }
.wa-name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.wa-mark { flex: none; width: 16px; height: 16px }
.wa-tagline { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; line-height: 16px; color: var(--wa-t2) }
.wa .wa-new {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px; color: var(--wa-icon);
  opacity: 0; transform: translateX(6px); pointer-events: none;
  transition: opacity .22s, transform .32s var(--wa-ease), background-color .16s, color .16s;
}
.wa[data-chatting] .wa-new { opacity: 1; transform: none; pointer-events: auto }
.wa .wa-new:hover { background: var(--wa-fill); color: var(--wa-ink) }
.wa-new svg { width: 16px; height: 16px }

/* Body: glow behind a bottom-anchored scroller */
.wa-body { position: relative; display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden }
.wa-glow { position: absolute; inset: 0; pointer-events: none; transition: opacity .6s var(--wa-ease) }
.wa[data-chatting] .wa-glow { opacity: .35 }
.wa-blob { position: absolute; width: 220px; height: 136px; border-radius: 50%; filter: blur(36px); opacity: var(--wa-blob) }
.wa-blob-a { left: -4%; bottom: 8%; background: rgb(236 72 153); animation: wa-drift-a 6s ease-in-out infinite }
.wa-blob-b { left: 28%; bottom: -6%; background: rgb(139 92 246); animation: wa-drift-b 7s ease-in-out infinite }
.wa-blob-c { right: -6%; bottom: 14%; background: rgb(47 107 255); animation: wa-drift-c 5.5s ease-in-out infinite }
.wa-scroll { position: relative; flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin }
.wa:not([data-chatting]) .wa-scroll { overflow-y: hidden }
.wa-inner { display: flex; flex-direction: column; justify-content: flex-end; min-height: 100% }

/* Welcome */
.wa-welcome { display: grid; gap: 12px; padding: 16px; animation: wa-rise .38s var(--wa-ease) backwards }
.wa-greeting { margin: 0; font-size: 15px; line-height: 24px; font-weight: 500; color: var(--wa-ink); text-wrap: balance }
.wa-chips { display: flex; flex-wrap: wrap; gap: 6px }
.wa .wa-chip {
  height: 28px; padding: 4px 10px; border-radius: 6px; background: var(--wa-chip);
  box-shadow: inset 0 0 0 .5px var(--wa-line); font-size: 13px; line-height: 20px; font-weight: 500; color: var(--wa-t2);
  transition: background-color .16s, color .16s, transform .16s var(--wa-ease);
  animation: wa-rise .38s var(--wa-ease) backwards;
}
.wa .wa-chip:hover { background: var(--wa-chip-hover); color: var(--wa-ink) }
.wa .wa-chip:active { transform: scale(.97) }

/* Messages */
.wa-list { display: flex; flex-direction: column; gap: 12px; padding: 16px }
.wa-msg { max-width: 100%; overflow-wrap: anywhere; white-space: pre-wrap; animation: wa-rise .3s var(--wa-ease) backwards }
.wa-msg[data-role="user"] {
  align-self: flex-end; max-width: 85%; padding: 6px 10px; border-radius: 12px; background: var(--wa-bubble); color: var(--wa-ink);
}
.wa-msg[data-role="assistant"] { padding-right: 6px; color: var(--wa-t1) }
.wa-w { animation: wa-word .42s var(--wa-ease) backwards }
.wa-writing { margin: 0; white-space: normal; color: var(--wa-t3) }
.wa-shimmer { position: relative; display: inline-block }
.wa-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--wa-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text;
  animation: wa-sweep 1.6s linear infinite;
}

/* Composer */
.wa-row { display: flex; align-items: flex-end; gap: 4px; padding: 6px 10px 10px 16px }
.wa-field { display: flex; flex: 1; min-width: 0 }
.wa .wa-input {
  display: block; width: 100%; min-height: 28px; max-height: 88px; margin: 0; padding: 4px 0; border: 0; outline: 0;
  resize: none; background: transparent; color: var(--wa-ink); font: inherit; font-size: 13px; line-height: 20px;
}
.wa-input::placeholder { color: var(--wa-t3); opacity: 1 }
.wa .wa-send {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px;
  background: var(--wa-ink); color: var(--wa-surface);
  transition: opacity .16s, transform .16s var(--wa-ease); animation: wa-pop .26s var(--wa-ease) backwards;
}
.wa .wa-send:hover { transform: scale(1.05) }
.wa .wa-send:active { transform: scale(.94) }
.wa .wa-send:disabled { opacity: .35; pointer-events: none }
.wa-send svg { width: 16px; height: 16px }
.wa .wa-mic {
  position: relative; display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px;
  color: var(--wa-icon); transition: background-color .2s, color .16s, transform .16s var(--wa-ease);
}
.wa .wa-mic:hover { background: var(--wa-fill); color: var(--wa-ink) }
.wa .wa-mic:active { transform: scale(.94) }
.wa .wa-mic[aria-pressed="true"] { background: color-mix(in oklab, var(--wa-blue) 10%, transparent); color: var(--wa-blue) }
.wa .wa-mic:disabled { opacity: .4; pointer-events: none }
.wa-mic > svg, .wa-bars { grid-area: 1 / 1; animation: wa-fade .22s var(--wa-ease) backwards }
.wa-mic > svg { width: 16px; height: 16px }
.wa-pulse { position: absolute; inset: 0; border-radius: 6px; box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--wa-blue) 55%, transparent); opacity: 0; pointer-events: none }
.wa-mic[aria-pressed="true"] .wa-pulse { animation: wa-pulse 1.6s var(--wa-ease) infinite }
.wa-bars { display: flex; align-items: center; gap: 2px; height: 14px }
.wa-bars i { width: 2px; height: 12px; border-radius: 1px; background: currentColor; transform: scaleY(.55); animation: wa-bar 1s ease-in-out infinite }
.wa-bars i:nth-child(2) { transform: scaleY(1); animation-delay: -.35s }
.wa-bars i:nth-child(3) { transform: scaleY(.75); animation-delay: -.7s }

@keyframes wa-rise { from { opacity: 0; transform: translateY(6px) } }
@keyframes wa-word { from { opacity: 0; filter: blur(3px) } }
@keyframes wa-pop { from { opacity: 0; transform: scale(.8) } }
@keyframes wa-fade { from { opacity: 0 } }
@keyframes wa-bar { 0%, 100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
@keyframes wa-pulse { from { opacity: .55; transform: scale(1) } to { opacity: 0; transform: scale(1.7) } }
@keyframes wa-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes wa-drift-a { 0%, 100% { transform: translate(-25%, 15%) scale(.9) } 50% { transform: translate(55%, -35%) scale(1.25) } }
@keyframes wa-drift-b { 0%, 100% { transform: translate(30%, -10%) scale(1.15) } 50% { transform: translate(-45%, 20%) scale(.85) } }
@keyframes wa-drift-c { 0%, 100% { transform: translate(-35%, -25%) scale(.95) } 50% { transform: translate(40%, 30%) scale(1.2) } }

@media (prefers-reduced-motion: reduce) {
  .wa *, .wa *::before, .wa *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

function SparkMark() {
  const id = React.useId()
  return (
    <svg {...svg} className="wa-mark">
      <defs>
        <linearGradient id={id} x1="2" y1="14" x2="14" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(236 72 153)" />
          <stop offset=".5" stopColor="rgb(139 92 246)" />
          <stop offset="1" stopColor="rgb(47 107 255)" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M6.5 1.75Q6.9 6.6 11.75 7 6.9 7.4 6.5 12.25 6.1 7.4 1.25 7 6.1 6.6 6.5 1.75Z" />
      <path fill={`url(#${id})`} d="M12 9.5q.2 2.3 2.5 2.5-2.3.2-2.5 2.5-.2-2.3-2.5-2.5 2.3-.2 2.5-2.5Z" />
    </svg>
  )
}
const ComposeIcon = () => (
  <svg {...svg}>
    <path d="M8.5 3H5.25A2.25 2.25 0 0 0 3 5.25v5.5A2.25 2.25 0 0 0 5.25 13h5.5A2.25 2.25 0 0 0 13 10.75V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="m9.1 8.6.4-1.9 4-4a1.1 1.1 0 0 1 1.5 1.5l-4 4-1.9.4Z" fill="currentColor" />
  </svg>
)
const MicIcon = () => (
  <svg {...svg}>
    <rect x="6" y="1.75" width="4" height="7.5" rx="2" fill="currentColor" />
    <path d="M3.75 7.75a4.25 4.25 0 0 0 8.5 0M8 12v2.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)
const ArrowUpIcon = () => (
  <svg {...svg}>
    <path d="M8 13V3.5M4 7.2l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

type Message = { id: number; role: "user" | "assistant"; text: string; state?: "pending" | "streaming" | "done" }

/** An assistant reply revealed word by word; each word mounts once and blurs in. */
function Reply({ text, speed, reduced, onDone }: { text: string; speed: number; reduced: boolean; onDone: () => void }) {
  const words = React.useMemo(() => text.match(/\S+\s*/g) ?? [], [text])
  const [count, setCount] = React.useState(0)
  const latest = React.useRef({ onDone, speed })
  React.useEffect(() => {
    latest.current = { onDone, speed }
  })

  React.useEffect(() => {
    if (reduced || words.length === 0) {
      const id = window.setTimeout(() => latest.current.onDone(), 0)
      return () => window.clearTimeout(id)
    }
    let n = 0
    const id = window.setInterval(() => {
      n += 1
      setCount(n)
      if (n >= words.length) {
        window.clearInterval(id)
        latest.current.onDone()
      }
    }, 1000 / Math.max(1, latest.current.speed))
    return () => window.clearInterval(id)
  }, [words, reduced])

  const shown = reduced ? words.length : count
  return (
    <>
      {words.slice(0, shown).map((w, i) => (
        <span key={i} className="wa-w">
          {w}
        </span>
      ))}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                              WritingAssistant                              */
/* -------------------------------------------------------------------------- */

export function WritingAssistant({
  name = "Inkwell",
  tagline = "Drafts that sound like you.",
  greeting = "What are we writing today?",
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder = "Ask anything…",
  respond,
  speech = "auto",
  dictation = DEFAULT_DICTATION,
  speed = 30,
  className,
}: WritingAssistantProps) {
  const reduced = useReducedMotion()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [draft, setDraft] = React.useState("")
  const [listening, setListening] = React.useState(false)
  const [announce, setAnnounce] = React.useState("")

  const chatting = messages.length > 0
  const busy = messages.length > 0 && messages[messages.length - 1].state !== "done" && messages[messages.length - 1].role === "assistant"

  const fieldRef = React.useRef<HTMLTextAreaElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const stick = React.useRef(true)
  const chatRef = React.useRef(0) // bumped on New chat so late replies are dropped
  const idRef = React.useRef(0)
  const draftRef = React.useRef(draft)
  const voiceRef = React.useRef<{ stop: () => void; cancel: () => void } | null>(null)

  // Always call the freshest props from timers and speech callbacks.
  const latest = React.useRef({ respond, speech, dictation, busy })
  React.useEffect(() => {
    latest.current = { respond, speech, dictation, busy }
    draftRef.current = draft
  })

  // The field grows with its text, up to four lines, then scrolls.
  React.useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`
    el.style.overflowY = el.scrollHeight > 88 ? "auto" : "hidden"
  }, [draft])

  // Keep the newest text in view while a reply grows, unless the reader scrolled up.
  React.useLayoutEffect(() => {
    const sc = scrollRef.current
    const inner = innerRef.current
    if (!sc || !inner) return
    const ro = new ResizeObserver(() => {
      if (stick.current) sc.scrollTop = sc.scrollHeight
    })
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => () => voiceRef.current?.cancel(), [])

  const submit = (raw: string) => {
    const text = raw.trim()
    if (!text || latest.current.busy) return false
    voiceRef.current?.cancel()
    const chat = chatRef.current
    const userId = ++idRef.current
    const replyId = ++idRef.current
    stick.current = true
    setAnnounce("")
    setMessages((m) => [...m, { id: userId, role: "user", text }, { id: replyId, role: "assistant", text: "", state: "pending" }])
    latest.current.busy = true
    new Promise<string>((resolve) => resolve((latest.current.respond ?? sampleWriter)(text)))
      .catch(() => FAILED_REPLY)
      .then((reply) => {
        if (chatRef.current !== chat) return
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, text: reply, state: "streaming" } : x)))
      })
    return true
  }

  const markDone = React.useCallback((id: number, text: string) => {
    setMessages((m) => m.map((x) => (x.id === id && x.state !== "done" ? { ...x, state: "done" } : x)))
    setAnnounce(text)
  }, [])

  const send = () => {
    if (submit(draft)) setDraft("")
  }

  const reset = () => {
    chatRef.current += 1
    voiceRef.current?.cancel()
    stick.current = true
    setMessages([])
    setDraft("")
    setAnnounce("")
    fieldRef.current?.focus()
  }

  /* ------------------------------- Dictation ------------------------------- */

  const startVoice = () => {
    const base = draftRef.current.trim()
    const compose = (t: string) => (base ? `${base} ${t}` : t)
    let heard = ""
    let done = false
    let timer = 0
    let rec: SpeechRecognitionLike | null = null

    const end = (sendIt: boolean) => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      if (rec) {
        rec.onresult = rec.onerror = rec.onend = null
        try {
          rec.abort()
        } catch {
          /* already stopped */
        }
      }
      voiceRef.current = null
      setListening(false)
      if (sendIt && heard.trim() && submit(compose(heard.trim()))) setDraft("")
    }

    const runSimulation = () => {
      const words = latest.current.dictation.trim().split(/\s+/).filter(Boolean)
      let i = 0
      const step = () => {
        if (done) return
        if (i < words.length) {
          i += 1
          heard = words.slice(0, i).join(" ")
          setDraft(compose(heard))
          timer = window.setTimeout(step, 170 + words[i - 1].length * 14)
        } else {
          timer = window.setTimeout(() => end(true), 650)
        }
      }
      timer = window.setTimeout(step, 450)
      voiceRef.current = { stop: () => end(true), cancel: () => end(false) }
    }

    setListening(true)
    const Native = latest.current.speech === "auto" ? getRecognition() : null
    if (!Native) return runSimulation()

    try {
      rec = new Native()
      rec.lang = navigator.language || "en-US"
      rec.continuous = false
      rec.interimResults = true
      rec.onresult = (e) => {
        let t = ""
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
        heard = t
        setDraft(compose(t.trim()))
      }
      rec.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return // onend follows
        if (e.error === "not-allowed") return end(false) // the person said no: respect it
        // The browser can't run recognition here (offline, blocked service…): play the simulation instead.
        if (rec) {
          rec.onresult = rec.onerror = rec.onend = null
          rec = null
        }
        runSimulation()
      }
      rec.onend = () => end(true)
      voiceRef.current = { stop: () => rec?.stop(), cancel: () => end(false) }
      rec.start()
    } catch {
      rec = null
      runSimulation()
    }
  }

  const toggleVoice = () => {
    if (voiceRef.current) voiceRef.current.stop()
    else startVoice()
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <section className={cn("wa", className)} data-chatting={chatting || undefined} aria-label={name}>
      <style href="writing-assistant" precedence="default">
        {CSS}
      </style>

      <header className="wa-head">
        <div className="wa-id">
          <h3 className="wa-name">
            <SparkMark />
            <span className="wa-name-text">{name}</span>
          </h3>
          <p className="wa-tagline">{tagline}</p>
        </div>
        <button type="button" className="wa-new" aria-label="New chat" title="New chat" onClick={reset} inert={!chatting}>
          <ComposeIcon />
        </button>
      </header>

      <div className="wa-body">
        <div className="wa-glow" aria-hidden>
          <span className="wa-blob wa-blob-a" />
          <span className="wa-blob wa-blob-b" />
          <span className="wa-blob wa-blob-c" />
        </div>

        <div
          ref={scrollRef}
          className="wa-scroll"
          onScroll={(e) => {
            const el = e.currentTarget
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
          }}
        >
          <div ref={innerRef} className="wa-inner">
            {chatting ? (
              <div className="wa-list">
                {messages.map((m) => (
                  <div key={m.id} className="wa-msg" data-role={m.role} aria-hidden={m.state === "streaming" || undefined}>
                    {m.role === "user" ? (
                      <>
                        <span className="wa-sr">You: </span>
                        {m.text}
                      </>
                    ) : m.state === "pending" ? (
                      <p className="wa-writing" role="status" aria-label="Writing a reply">
                        <span className="wa-shimmer" data-text="Writing…">
                          Writing…
                        </span>
                      </p>
                    ) : (
                      <Reply text={m.text} speed={speed} reduced={reduced} onDone={() => markDone(m.id, m.text)} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="wa-welcome">
                <p className="wa-greeting">{greeting}</p>
                {suggestions.length > 0 && (
                  <div className="wa-chips">
                    {suggestions.map((s, i) => (
                      <button key={s} type="button" className="wa-chip" style={{ animationDelay: `${60 + i * 45}ms` }} onClick={() => submit(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="wa-sr" role="status" aria-live="polite">
        {announce}
      </div>

      <form
        className="wa-row"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <div className="wa-field">
          <textarea
            ref={fieldRef}
            className="wa-input"
            rows={1}
            aria-label="Message"
            placeholder={listening ? "Listening…" : placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send()
              }
            }}
          />
        </div>
        <button
          type="button"
          className="wa-mic"
          aria-pressed={listening}
          aria-label={listening ? "Stop dictation" : "Start dictation"}
          title={listening ? "Stop dictation" : "Dictate"}
          disabled={busy && !listening}
          onClick={toggleVoice}
        >
          <span className="wa-pulse" aria-hidden />
          {listening ? (
            <span className="wa-bars" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          ) : (
            <MicIcon />
          )}
        </button>
        {draft.trim() && (
          <button type="submit" className="wa-send" aria-label="Send message" title="Send" disabled={busy}>
            <ArrowUpIcon />
          </button>
        )}
      </form>
    </section>
  )
}

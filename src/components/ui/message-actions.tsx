"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MessageActionKey = "copy" | "regenerate" | "feedback" | "speak"
export type MessageFeedbackKind = "up" | "down"

export type MessageActionsProps = {
  /** The message text – Copy writes it to the clipboard, and an uncontrolled read aloud is timed by its length. */
  text?: string
  /** Which actions to show and in what order. `feedback` is the thumbs up and down. */
  actions?: MessageActionKey[]
  /** All versions of the message, or just how many there are. From two on, the "‹ 2 / 3 ›" switcher unfolds next to Regenerate. */
  versions?: number | string[]
  /** Controlled version, 0-based. */
  version?: number
  /** Starting version when uncontrolled. Defaults to the newest, and an uncontrolled bar jumps to a version as soon as it is added. */
  defaultVersion?: number
  /** Called with the version picked in the switcher. */
  onVersionChange?: (index: number) => void
  /** Called after Copy, with the text. */
  onCopy?: (text?: string) => void
  /** Called when Regenerate is pressed – add a version to `versions` and it shows up in the switcher. */
  onRegenerate?: () => void
  /** Keeps the arrow spinning and the bar lit while a new version is written. */
  regenerating?: boolean
  /**
   * Called with the vote right away, with `null` when it is taken back, and once more with "down" and a reason when the
   * feedback row is sent. Every version has its own vote.
   */
  onFeedback?: (kind: MessageFeedbackKind | null, reason?: string) => void
  /** Quick reasons in the feedback row. "Other" unfolds a small text field whose words are sent as the reason. */
  reasons?: string[]
  /** Called with `true` when Read aloud starts and `false` when it stops. */
  onSpeak?: (playing: boolean) => void
  /** Controlled playing state – tie it to your speech player. Without it the bar plays for `speakDuration` and stops on its own. */
  speaking?: boolean
  /** How long an uncontrolled read aloud plays, in ms. Defaults to a length-based guess, at least 2600. */
  speakDuration?: number
  /** Faded until the message (an ancestor with `data-ui-message`) or the bar is hovered or focused. Touch screens always show it fully. */
  quiet?: boolean
  /** Accessible name of the bar. */
  label?: string
  className?: string
}

export type MessageTextProps = {
  /** The version being shown – when it changes the text crossfades and the height eases to the new size. */
  version?: number
  children?: React.ReactNode
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ma, .ma-text {
  --ma-ink: #000;
  --ma-surface: #fff;
  --ma-accent: #0060e2;
  --ma-ok: #1a9a52;
  --ma-t1: color-mix(in oklab, var(--ma-ink) 88%, transparent);
  --ma-t2: color-mix(in oklab, var(--ma-ink) 61%, transparent);
  --ma-t3: color-mix(in oklab, var(--ma-ink) 45%, transparent);
  --ma-t4: color-mix(in oklab, var(--ma-ink) 27%, transparent);
  --ma-icon: color-mix(in oklab, var(--ma-ink) 44.7%, transparent);
  --ma-wash: color-mix(in oklab, var(--ma-ink) 4%, transparent);
  --ma-fill: color-mix(in oklab, var(--ma-ink) 6%, transparent);
  --ma-line: color-mix(in oklab, var(--ma-ink) 6%, transparent);
  --ma-ok-bg: rgb(26 154 82 / .08);
  --ma-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ma-ease: cubic-bezier(.22, 1, .36, 1);
  font-family: var(--ma-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  color: var(--ma-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ma, :is(.dark, [data-theme="dark"]) .ma-text {
  --ma-ink: #fff;
  --ma-surface: #1c1c1e;
  --ma-accent: #4d8dff;
  --ma-ok: #3ecf8e;
  --ma-t1: color-mix(in oklab, var(--ma-ink) 90%, transparent);
  --ma-t2: color-mix(in oklab, var(--ma-ink) 62%, transparent);
  --ma-t3: color-mix(in oklab, var(--ma-ink) 46%, transparent);
  --ma-t4: color-mix(in oklab, var(--ma-ink) 30%, transparent);
  --ma-icon: color-mix(in oklab, var(--ma-ink) 50%, transparent);
  --ma-wash: color-mix(in oklab, var(--ma-ink) 6%, transparent);
  --ma-fill: color-mix(in oklab, var(--ma-ink) 10%, transparent);
  --ma-line: color-mix(in oklab, var(--ma-ink) 8%, transparent);
  --ma-ok-bg: rgb(62 207 142 / .12);
  --ma-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ma *, .ma *::before, .ma *::after, .ma-text *, .ma-text *::before, .ma-text *::after { box-sizing: border-box }
:where(.ma) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ma :focus-visible { outline: 2px solid color-mix(in oklab, var(--ma-accent) 60%, transparent); outline-offset: 1px }
.ma-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

.ma { position: relative; container-type: inline-size; width: 100% }
.ma-bar { display: flex; align-items: center; gap: 2px; width: max-content; max-width: 100%; transition: opacity .24s }
.ma[data-quiet] .ma-bar { opacity: .6 }
.ma[data-quiet]:hover .ma-bar, .ma[data-quiet]:focus-within .ma-bar, .ma[data-quiet][data-active] .ma-bar,
:where([data-ui-message]:hover, [data-ui-message]:focus-within) .ma[data-quiet] .ma-bar { opacity: 1 }

.ma-item { position: relative; display: flex }
.ma-btn {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: 6px; color: var(--ma-icon);
  transition: background-color .16s, color .16s, box-shadow .16s;
}
.ma-btn:hover { background: var(--ma-wash); color: var(--ma-ink) }
.ma-btn[aria-pressed="true"], .ma-btn[aria-pressed="true"]:hover { background: var(--ma-fill); box-shadow: inset 0 0 0 .5px var(--ma-line); color: var(--ma-ink) }
.ma-btn[data-busy] { color: var(--ma-ink) }
.ma-icon { position: relative; display: grid; place-items: center; width: 16px; height: 16px }
.ma-btn[aria-pressed="true"] .ma-thumb { animation: ma-pop .36s var(--ma-ease) }
.ma-glyph { display: block; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round }
.ma-btn[aria-pressed="true"] .ma-thumb .ma-glyph :is(path, rect) { fill: currentColor }
.ma-down .ma-glyph { transform: scaleY(-1) }

/* Two icons stacked in one cell: the inactive one blurs and shrinks away */
.ma-layer {
  grid-area: 1 / 1; display: grid; place-items: center; opacity: 0; transform: scale(.6); filter: blur(2px);
  transition: opacity .2s, transform .3s var(--ma-ease), filter .2s;
}
.ma-layer[data-on] { opacity: 1; transform: none; filter: none }
.ma-layer[data-ok] { color: var(--ma-ok) }
.ma-layer[data-live] { color: color-mix(in oklab, var(--ma-accent) 76.5%, transparent) }
.ma-eq { display: flex; align-items: center; gap: 2px; width: 16px; height: 16px; justify-content: center }
.ma-eq i { display: block; width: 2px; height: 11px; border-radius: 1px; background: currentColor; transform: scaleY(.3) }
.ma-layer[data-on] .ma-eq i, .ma-eq[data-on] i { animation: ma-eq .9s ease-in-out infinite }
.ma-eq i:nth-child(2) { animation-delay: -.6s }
.ma-eq i:nth-child(3) { animation-delay: -.3s }
.ma-eq i:nth-child(4) { animation-delay: -.45s }

.ma-spin { display: grid; place-items: center }
.ma-spin[data-once] { animation: ma-spin .9s var(--ma-ease) }
.ma-btn[data-busy] .ma-spin { animation: ma-spin .9s linear infinite }

/* Tooltips repeat the button names; they are hidden from assistive tech */
.ma-tip {
  position: absolute; left: 50%; bottom: calc(100% + 6px); z-index: 20; padding: 2px 8px; border-radius: 6px; background: var(--ma-surface);
  box-shadow: var(--ma-float); font-size: 12px; font-weight: 500; line-height: 20px; color: var(--ma-t1); white-space: nowrap;
  opacity: 0; transform: translate(-50%, 3px); pointer-events: none; transition: opacity .14s, transform .2s var(--ma-ease);
}
.ma-btn:focus-visible + .ma-tip, .ma-item[data-flash] .ma-tip { opacity: 1; transform: translate(-50%, 0) }
@media (hover: hover) { .ma-item:hover .ma-tip { opacity: 1; transform: translate(-50%, 0); transition-delay: .38s } }

/* Blur crossfade for text that changes in place */
.ma-swap { display: inline-grid; vertical-align: top }
.ma-swap > * { grid-area: 1 / 1; display: flex; align-items: center; gap: 4px; white-space: nowrap }
.ma-swap-in { animation: ma-in .3s var(--ma-ease) backwards }
.ma-swap-out { animation: ma-out .3s var(--ma-ease) forwards; pointer-events: none }

/* Version switcher unfolds sideways from Regenerate */
.ma-regen { display: flex; align-items: center }
.ma-versions { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns .42s var(--ma-ease), opacity .22s }
.ma-versions[data-open] { grid-template-columns: 1fr; opacity: 1; transition: grid-template-columns .42s var(--ma-ease), opacity .32s ease .1s }
.ma-versions-clip { display: flex; align-items: center; min-width: 0; padding-right: 2px; overflow: hidden }
.ma-step { display: grid; place-items: center; flex: none; width: 20px; height: 28px; border-radius: 6px; color: var(--ma-icon); transition: background-color .16s, color .16s, opacity .16s }
.ma-step:hover:not(:disabled) { background: var(--ma-wash); color: var(--ma-ink) }
.ma-step:disabled { opacity: .45; cursor: default }
.ma-count { display: flex; align-items: center; gap: 2px; padding: 0 2px; font-size: 12px; line-height: 16px; color: var(--ma-t4); font-variant-numeric: tabular-nums; white-space: nowrap }
.ma-count .ma-swap:first-child { color: var(--ma-t2) }

/* Feedback row */
.ma-fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .42s var(--ma-ease), opacity .22s }
.ma-fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows .42s var(--ma-ease), opacity .32s ease .08s }
.ma-clip { min-height: 0; margin: -3px 0 0 -3px; padding: 3px; overflow: hidden }
.ma-panel { padding: 10px 8px 8px }
.ma-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 24px }
.ma-ask { font-weight: 500; color: var(--ma-ink) }
.ma-close { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; color: var(--ma-icon); transition: background-color .16s, color .16s }
.ma-close:hover { background: var(--ma-wash); color: var(--ma-ink) }
.ma-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px }
.ma-chip {
  height: 28px; padding: 4px 10px; border-radius: 6px; box-shadow: inset 0 0 0 .5px var(--ma-line); font-weight: 500; color: var(--ma-t2);
  transition: background-color .14s, color .14s, opacity .2s;
}
.ma-chip:hover:not(:disabled) { background: var(--ma-wash); color: var(--ma-ink) }
.ma-chip[aria-pressed="true"], .ma-chip[aria-pressed="true"]:hover:not(:disabled) { background: var(--ma-fill); color: var(--ma-ink) }
.ma-chips[data-picked] .ma-chip[aria-pressed="false"] { opacity: .45 }
.ma-chips[data-picked] .ma-chip[aria-pressed="false"]:hover { opacity: 1 }
.ma-send {
  display: flex; align-items: center; height: 28px; margin-left: auto; padding: 0 10px; border-radius: 6px; background: var(--ma-ink); color: var(--ma-surface);
  font-weight: 500; transition: background-color .22s, color .22s, opacity .2s;
}
.ma-send:hover:not([aria-disabled="true"]) { background: color-mix(in oklab, var(--ma-ink) 82%, var(--ma-surface)) }
.ma-send[aria-disabled="true"] { opacity: .35; cursor: default }
.ma-send[data-sent] { opacity: 1; cursor: default; background: var(--ma-ok-bg); color: var(--ma-ok) }
.ma-send { gap: 4px }
.ma-send .ma-glyph { width: 14px; height: 14px; animation: ma-in .3s var(--ma-ease) backwards }
.ma-input-wrap { margin-top: 0 }
.ma-input {
  display: block; width: 100%; height: 32px; margin-top: 8px; padding: 0 10px; border: 0; border-radius: 6px; background: var(--ma-wash);
  box-shadow: inset 0 0 0 .5px var(--ma-line); font: inherit; color: var(--ma-t1); transition: box-shadow .16s;
}
.ma-input::placeholder { color: var(--ma-t3) }
.ma-input:focus-visible { outline: none; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ma-accent) 60%, transparent) }

/* MessageText: crossfades versions while the height eases */
.ma-text { position: relative; overflow: hidden; transition: height .36s var(--ma-ease) }
.ma-text-inner { display: flow-root }
.ma-text-in { animation: ma-text-in .42s var(--ma-ease) backwards }
.ma-text-out { position: absolute; top: 0; left: 0; right: 0; pointer-events: none; animation: ma-out .3s var(--ma-ease) forwards }

@keyframes ma-in { from { opacity: 0; filter: blur(2px) } }
@keyframes ma-out { to { opacity: 0; filter: blur(2px) } }
@keyframes ma-text-in { from { opacity: 0; filter: blur(3px) } }
@keyframes ma-spin { to { transform: rotate(360deg) } }
@keyframes ma-pop { 40% { transform: scale(1.22) rotate(-8deg) } }
@keyframes ma-eq { 50% { transform: scaleY(1) } }

@container (max-width: 320px) { .ma-send { margin-left: 0; width: 100%; justify-content: center } }
@media (pointer: coarse) {
  .ma[data-quiet] .ma-bar { opacity: 1 }
  .ma-btn { width: 36px; height: 36px }
  .ma-step { height: 36px; width: 28px }
  .ma-chip, .ma-send { height: 34px }
  .ma-close { width: 32px; height: 32px }
  .ma-input { height: 38px }
  .ma-tip { display: none }
  .ma-item[data-flash] .ma-tip { display: block }
}
@media (prefers-reduced-motion: reduce) {
  .ma *, .ma *::before, .ma *::after, .ma-text, .ma-text *, .ma-text *::before, .ma-text *::after { animation: none !important; transition: none !important }
  .ma-swap-out, .ma-text-out { display: none }
  .ma-eq i { transform: scaleY(.65) }
}
`

/* -------------------------------------------------------------------------- */
/*                                    Icons                                   */
/* -------------------------------------------------------------------------- */

const g = { viewBox: "0 0 16 16", className: "ma-glyph", "aria-hidden": true } as const

const CopyIcon = () => (
  <svg {...g}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="2" />
    <path d="M10.5 3.6v-.1A1.5 1.5 0 0 0 9 2H3.6a1.6 1.6 0 0 0-1.6 1.6V9a1.5 1.5 0 0 0 1.5 1.5h.1" />
  </svg>
)
const CheckCircle = () => (
  <svg {...g}>
    <circle cx="8" cy="8" r="6" />
    <path d="m5.6 8.2 1.7 1.7 3.2-3.6" />
  </svg>
)
const RegenIcon = () => (
  <svg {...g}>
    <path d="M13 8a5 5 0 1 1-1.5-3.55M13 2.8v2.5h-2.5" />
  </svg>
)
const ThumbIcon = () => (
  <svg {...g}>
    <rect x="2.25" y="7" width="2.75" height="6.5" rx=".9" />
    <path d="m5 7.5 2.4-4.6c.2-.4.7-.6 1.1-.4.6.2.9.8.8 1.4L8.9 6.5h3.3a1.4 1.4 0 0 1 1.4 1.7l-.8 4.1a1.4 1.4 0 0 1-1.4 1.2H5" />
  </svg>
)
const SpeakerIcon = () => (
  <svg {...g}>
    <path d="M3.2 6.2h1.5L8 3.5v9L4.7 9.8H3.2a.8.8 0 0 1-.8-.8V7a.8.8 0 0 1 .8-.8Z" />
    <path d="M10.6 6.2a2.6 2.6 0 0 1 0 3.6M12.3 4.5a5.1 5.1 0 0 1 0 7" />
  </svg>
)
const Chevron = ({ dir }: { dir: "prev" | "next" }) => (
  <svg {...g}>
    <path d={dir === "prev" ? "M9.8 4.5 6.3 8l3.5 3.5" : "M6.2 4.5 9.7 8l-3.5 3.5"} />
  </svg>
)
const CloseIcon = () => (
  <svg {...g}>
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </svg>
)
const TickIcon = () => (
  <svg {...g}>
    <path d="m3.5 8.4 3.1 2.9 5.9-6.4" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/** Blur crossfade for text that changes in place. */
function Swap({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = React.useState(text)
  const [leaving, setLeaving] = React.useState<string | null>(null)
  if (text !== shown) {
    setLeaving(shown)
    setShown(text)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 300)
    return () => window.clearTimeout(id)
  }, [leaving])
  return (
    <span className={cn("ma-swap", className)}>
      {leaving !== null && (
        <span key={`out-${leaving}`} className="ma-swap-out" aria-hidden>
          {leaving}
        </span>
      )}
      <span key={`in-${shown}`} className={cn(leaving !== null && "ma-swap-in")}>
        {shown}
      </span>
    </span>
  )
}

function Item({ label, flash, children }: { label: string; flash?: boolean; children: React.ReactNode }) {
  return (
    <span className="ma-item" data-flash={flash || undefined}>
      {children}
      <span className="ma-tip" aria-hidden>
        <Swap text={label} />
      </span>
    </span>
  )
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

const DEFAULT_REASONS = ["Not accurate", "Too long", "Didn't follow instructions", "Other"]
const DEFAULT_ACTIONS: MessageActionKey[] = ["copy", "regenerate", "feedback", "speak"]

/* -------------------------------------------------------------------------- */
/*                               MessageActions                               */
/* -------------------------------------------------------------------------- */

export function MessageActions({
  text,
  actions = DEFAULT_ACTIONS,
  versions = 1,
  version: versionProp,
  defaultVersion,
  onVersionChange,
  onCopy,
  onRegenerate,
  regenerating = false,
  onFeedback,
  reasons = DEFAULT_REASONS,
  onSpeak,
  speaking: speakingProp,
  speakDuration,
  quiet = true,
  label = "Message actions",
  className,
}: MessageActionsProps) {
  const id = React.useId()
  const count = Math.max(1, typeof versions === "number" ? versions : versions.length)

  /* Versions: jump to a newly added one when uncontrolled. */
  const [innerVersion, setInnerVersion] = React.useState(defaultVersion ?? count - 1)
  const [prevCount, setPrevCount] = React.useState(count)
  if (count !== prevCount) {
    setPrevCount(count)
    if (versionProp === undefined && count > prevCount) setInnerVersion(count - 1)
  }
  const version = clamp(versionProp ?? innerVersion, 0, count - 1)

  const [live, setLive] = React.useState("")

  const go = (next: number) => {
    const i = clamp(next, 0, count - 1)
    if (i === version) return
    if (versionProp === undefined) setInnerVersion(i)
    onVersionChange?.(i)
    setLive(`Version ${i + 1} of ${count}`)
  }

  /* Copy */
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(t)
  }, [copied])
  const copy = () => {
    if (text !== undefined) void navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setLive("Copied")
    onCopy?.(text)
  }

  /* Regenerate */
  const [spins, setSpins] = React.useState(0)

  /* Votes live per version; a new version starts without one. */
  const [votes, setVotes] = React.useState<Record<number, MessageFeedbackKind>>({})
  const vote = votes[version]
  const [panelFor, setPanelFor] = React.useState<number | null>(null)
  const panelOpen = panelFor === version
  const [reason, setReason] = React.useState<string | null>(null)
  const [other, setOther] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const downRef = React.useRef<HTMLButtonElement>(null)

  const setVote = (kind: MessageFeedbackKind | null) =>
    setVotes((v) => {
      const next = { ...v }
      if (kind) next[version] = kind
      else delete next[version]
      return next
    })
  const openPanel = () => {
    setReason(null)
    setOther("")
    setSent(false)
    setPanelFor(version)
  }
  const pressUp = () => {
    setPanelFor(null)
    if (vote === "up") {
      setVote(null)
      onFeedback?.(null)
    } else {
      setVote("up")
      onFeedback?.("up")
    }
  }
  const pressDown = () => {
    if (vote === "down") {
      setVote(null)
      setPanelFor(null)
      onFeedback?.(null)
    } else {
      setVote("down")
      openPanel()
      onFeedback?.("down")
    }
  }
  const isOther = (r: string) => /^other$/i.test(r)
  const reasonText = reason !== null && isOther(reason) ? other.trim() || reason : reason
  const canSend = reason !== null && !sent
  const send = () => {
    if (!canSend || reasonText === null) return
    setSent(true)
    setLive("Thanks for the feedback")
    onFeedback?.("down", reasonText)
  }
  React.useEffect(() => {
    if (!sent) return
    const t = window.setTimeout(() => setPanelFor(null), 1500)
    return () => window.clearTimeout(t)
  }, [sent])

  /* Read aloud: controlled, or a timed pretend-playback. */
  const [innerSpeaking, setInnerSpeaking] = React.useState(false)
  const speaking = speakingProp ?? innerSpeaking
  const onSpeakRef = React.useRef(onSpeak)
  React.useEffect(() => {
    onSpeakRef.current = onSpeak
  })
  const duration = speakDuration ?? Math.max(2600, (text?.length ?? 0) * 55)
  React.useEffect(() => {
    if (speakingProp !== undefined || !innerSpeaking) return
    const t = window.setTimeout(() => {
      setInnerSpeaking(false)
      onSpeakRef.current?.(false)
    }, duration)
    return () => window.clearTimeout(t)
  }, [speakingProp, innerSpeaking, duration])
  const toggleSpeak = () => {
    const next = !speaking
    if (speakingProp === undefined) setInnerSpeaking(next)
    setLive(next ? "Reading aloud" : "")
    onSpeak?.(next)
  }

  const active = copied || regenerating || speaking || panelOpen
  const showVersions = actions.includes("regenerate") && count > 1

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && panelOpen) {
      e.stopPropagation()
      setPanelFor(null)
      downRef.current?.focus()
    }
  }

  const bar: Record<MessageActionKey, React.ReactNode> = {
    copy: (
      <Item key="copy" label={copied ? "Copied" : "Copy"} flash={copied}>
        <button type="button" className="ma-btn" aria-label="Copy message" onClick={copy}>
          <span className="ma-icon" aria-hidden>
            <span className="ma-layer" data-on={!copied || undefined}>
              <CopyIcon />
            </span>
            <span className="ma-layer" data-ok data-on={copied || undefined}>
              <CheckCircle />
            </span>
          </span>
        </button>
      </Item>
    ),
    regenerate: (
      <span key="regenerate" className="ma-regen">
        <Item label="Regenerate">
          <button
            type="button"
            className="ma-btn"
            aria-label="Regenerate response"
            data-busy={regenerating || undefined}
            onClick={() => {
              setSpins((n) => n + 1)
              onRegenerate?.()
            }}
          >
            <span className="ma-icon" aria-hidden>
              <span key={spins} className="ma-spin" data-once={spins > 0 || undefined}>
                <RegenIcon />
              </span>
            </span>
          </button>
        </Item>
        <span className="ma-versions" data-open={showVersions || undefined} inert={!showVersions}>
          <span className="ma-versions-clip" role="group" aria-label="Versions">
            <button type="button" className="ma-step" aria-label="Previous version" disabled={version <= 0} onClick={() => go(version - 1)}>
              <Chevron dir="prev" />
            </button>
            <span className="ma-count" role="img" aria-label={`Version ${version + 1} of ${count}`}>
              <Swap text={String(version + 1)} />
              <span aria-hidden>/</span>
              <Swap text={String(count)} />
            </span>
            <button type="button" className="ma-step" aria-label="Next version" disabled={version >= count - 1} onClick={() => go(version + 1)}>
              <Chevron dir="next" />
            </button>
          </span>
        </span>
      </span>
    ),
    feedback: (
      <React.Fragment key="feedback">
        <Item label="Good response">
          <button type="button" className="ma-btn" aria-label="Good response" aria-pressed={vote === "up"} onClick={pressUp}>
            <span className="ma-icon ma-thumb" aria-hidden>
              <ThumbIcon />
            </span>
          </button>
        </Item>
        <Item label="Bad response">
          <button
            ref={downRef}
            type="button"
            className="ma-btn ma-down"
            aria-label="Bad response"
            aria-pressed={vote === "down"}
            aria-expanded={panelOpen}
            aria-controls={`${id}-feedback`}
            onClick={pressDown}
          >
            <span className="ma-icon ma-thumb" aria-hidden>
              <ThumbIcon />
            </span>
          </button>
        </Item>
      </React.Fragment>
    ),
    speak: (
      <Item key="speak" label={speaking ? "Stop" : "Read aloud"}>
        <button type="button" className="ma-btn" aria-label="Read aloud" aria-pressed={speaking} onClick={toggleSpeak}>
          <span className="ma-icon" aria-hidden>
            <span className="ma-layer" data-on={!speaking || undefined}>
              <SpeakerIcon />
            </span>
            <span className="ma-layer" data-live data-on={speaking || undefined}>
              <span className="ma-eq">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
          </span>
        </button>
      </Item>
    ),
  }

  return (
    <div className={cn("ma", className)} data-quiet={quiet || undefined} data-active={active || undefined} onKeyDown={onKeyDown}>
      <style href="message-actions" precedence="default">
        {CSS}
      </style>
      <span className="ma-sr" aria-live="polite">
        {live}
      </span>

      <div className="ma-bar" role="group" aria-label={label}>
        {actions.map((a) => bar[a])}
      </div>

      {actions.includes("feedback") && (
        <div className="ma-fold" id={`${id}-feedback`} data-open={panelOpen || undefined} inert={!panelOpen}>
          <div className="ma-clip">
            <div className="ma-panel" role="group" aria-labelledby={`${id}-ask`}>
              <div className="ma-panel-head">
                <span className="ma-ask" id={`${id}-ask`}>
                  What went wrong?
                </span>
                <button
                  type="button"
                  className="ma-close"
                  aria-label="Close feedback"
                  onClick={() => {
                    setPanelFor(null)
                    downRef.current?.focus()
                  }}
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="ma-chips" data-picked={reason !== null || undefined}>
                {reasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="ma-chip"
                    aria-pressed={reason === r}
                    disabled={sent}
                    onClick={() => setReason(reason === r ? null : r)}
                  >
                    {r}
                  </button>
                ))}
                <button type="button" className="ma-send" aria-disabled={!canSend} data-sent={sent || undefined} onClick={send}>
                  {sent && <TickIcon />}
                  <Swap text={sent ? "Thanks!" : "Send"} />
                </button>
              </div>
              <div className="ma-fold ma-input-wrap" data-open={(reason !== null && isOther(reason) && !sent) || undefined} inert={!(reason !== null && isOther(reason) && !sent)}>
                <div className="ma-clip">
                  <input
                    className="ma-input"
                    value={other}
                    placeholder="Tell us more"
                    aria-label="What went wrong?"
                    onChange={(e) => setOther(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        send()
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 MessageText                                */
/* -------------------------------------------------------------------------- */

/** The message body: crossfades between versions while its height eases to the new size. */
export function MessageText({ version = 0, children, className }: MessageTextProps) {
  const inner = React.useRef<HTMLDivElement>(null)
  const [height, setHeight] = React.useState<number | null>(null)
  const [seen, setSeen] = React.useState(version)
  const [snapshot, setSnapshot] = React.useState<React.ReactNode>(children)
  const [leaving, setLeaving] = React.useState<React.ReactNode | null>(null)

  // On a version change keep the previous text around for a moment so it can fade out.
  if (version !== seen) {
    setSeen(version)
    setLeaving(snapshot)
    setSnapshot(children)
  }
  React.useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), 420)
    return () => window.clearTimeout(id)
  }, [leaving])

  React.useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={cn("ma-text", className)} style={height !== null ? { height } : undefined}>
      <style href="message-actions" precedence="default">
        {CSS}
      </style>
      {leaving !== null && (
        <div className="ma-text-out" aria-hidden>
          {leaving}
        </div>
      )}
      <div ref={inner} className={cn("ma-text-inner", leaving !== null && "ma-text-in")}>
        {children}
      </div>
    </div>
  )
}

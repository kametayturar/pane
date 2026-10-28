"use client"

import * as React from "react"
import {
  Aperture,
  ArrowUp,
  Asterisk,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  Hand,
  Mic,
  Plus,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ChatModel = {
  id: string
  name: string
  /** One short line shown under the name in the picker. */
  description: string
  /** 16px logo shown in the picker. */
  icon?: React.ReactNode
}

export type ChatSendMeta = {
  /** The model that was selected when the message was sent. */
  model: ChatModel
}

export type ChatComposerProps = {
  /** Placeholder of the empty textarea. */
  placeholder?: string
  /** Models in the picker. The first one is selected unless `defaultModelId` says otherwise. */
  models?: ChatModel[]
  /** Id of the model that starts selected. */
  defaultModelId?: string
  /** Initial text of the textarea. */
  defaultValue?: string
  /** How long the "Connect apps" and "Request approval" loading states last, in ms. */
  loadMs?: number
  /** Demo transcript. It appears word by word in gray while recording, then turns dark once confirmed. */
  dictation?: string
  /** Delay between two dictated words, in ms. 0 shows the whole transcript at once. */
  dictationWordMs?: number
  /** Label of the second foot row, shown once apps are connected. */
  projectLabel?: string
  /** Enter was pressed or the send button clicked. */
  onSend?: (message: string, meta: ChatSendMeta) => void
  onModelChange?: (model: ChatModel) => void
  /** The "+" button was clicked. */
  onAttach?: () => void
  /** "Connect apps" was clicked. Return a promise to hold the loading state until it settles (at least `loadMs`). */
  onConnectApps?: () => void | Promise<unknown>
  /** "Request approval" was clicked. Return a promise to hold the loading state until it settles (at least `loadMs`). */
  onRequestApproval?: () => void | Promise<unknown>
  /** "Select a project" was clicked. */
  onSelectProject?: () => void
  /** Recording started (true) or stopped (false). */
  onRecordingChange?: (recording: boolean) => void
  className?: string
}

type Stage = "idle" | "loading" | "done"

type MenuPlace = {
  left: number
  top?: number
  bottom?: number
  /** Which corner of the panel touches the model button. */
  v: "top" | "bottom"
  h: "left" | "right"
  maxHeight: number
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.cc {
  --cc-ink: #000;
  --cc-surface: #fff;
  --cc-accent: #0060e2;
  --cc-strong: #0a0a0a;
  --cc-on-strong: #fff;
  --cc-red: #e5484d;
  --cc-t1: color-mix(in oklab, var(--cc-ink) 88%, transparent);
  --cc-t2: color-mix(in oklab, var(--cc-ink) 61%, transparent);
  --cc-t3: color-mix(in oklab, var(--cc-ink) 45%, transparent);
  --cc-t4: color-mix(in oklab, var(--cc-ink) 27%, transparent);
  --cc-fill: color-mix(in oklab, var(--cc-ink) 6%, transparent);
  --cc-hover: color-mix(in oklab, var(--cc-ink) 5%, transparent);
  --cc-line: color-mix(in oklab, var(--cc-ink) 6%, transparent);
  --cc-glint: rgb(255 255 255 / .82);
  --cc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cc-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --cc-ease: cubic-bezier(.22, 1, .36, 1);
  --cc-load: 1300ms;
  position: relative;
  width: 100%;
  max-width: 560px;
  container-type: inline-size;
  color: var(--cc-strong);
  font-family: var(--cc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
.cc[data-menu] { z-index: 30 }
:is(.dark, [data-theme="dark"]) .cc {
  --cc-ink: #fff;
  --cc-surface: #1c1c1e;
  --cc-accent: #4d8dff;
  --cc-strong: #fff;
  --cc-on-strong: #0a0a0a;
  --cc-red: #ff6369;
  --cc-t1: color-mix(in oklab, var(--cc-ink) 90%, transparent);
  --cc-t2: color-mix(in oklab, var(--cc-ink) 62%, transparent);
  --cc-t3: color-mix(in oklab, var(--cc-ink) 46%, transparent);
  --cc-t4: color-mix(in oklab, var(--cc-ink) 28%, transparent);
  --cc-fill: color-mix(in oklab, var(--cc-ink) 8%, transparent);
  --cc-hover: color-mix(in oklab, var(--cc-ink) 7%, transparent);
  --cc-line: color-mix(in oklab, var(--cc-ink) 8%, transparent);
  --cc-glint: rgb(255 255 255 / .9);
  --cc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --cc-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.cc *, .cc *::before, .cc *::after { box-sizing: border-box }
:where(.cc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.cc button:disabled { cursor: default }
.cc :focus-visible { outline: 2px solid color-mix(in oklab, var(--cc-accent) 60%, transparent); outline-offset: 1px }
.cc .cc-message:focus-visible, .cc .cc-menu-panel:focus-visible { outline: none }
.cc-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap; border: 0;
}

/* Card */
.cc-body { position: relative; border-radius: 10px; background: var(--cc-surface); box-shadow: var(--cc-shadow); color: var(--cc-t2) }
.cc-write { padding: 14px 10px 10px }
.cc-field { padding: 0 4px; cursor: text }

/* Textarea + mirror. The mirror sizes the field and paints the gray "heard" words. */
.cc-grow { position: relative; min-height: 20px; overflow: hidden; transition: height .26s ease }
.cc-mirror {
  position: relative; z-index: 1; min-height: 20px; color: transparent; pointer-events: none;
  white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
}
.cc-message {
  position: absolute; inset: 0; display: block; width: 100%; height: 100%; margin: 0; padding: 0;
  border: 0; border-radius: 0; background: transparent; color: var(--cc-ink); resize: none; overflow-y: auto;
  font: inherit; letter-spacing: inherit; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
}
.cc-message::placeholder { color: var(--cc-t3); opacity: 1 }
.cc-heard { color: var(--cc-t4); transition: color .24s ease }
.cc-heard[data-confirmed] { color: var(--cc-ink) }
.cc-word { animation: cc-word .32s var(--cc-ease) backwards }

/* Tool row */
.cc-tools { display: flex; align-items: center; gap: 8px; height: 28px; margin-top: 14px }
.cc-group { display: flex; align-items: center; gap: 4px }
.cc-swap { display: grid; margin-left: auto }
.cc-swap > .cc-group { grid-area: 1 / 1; justify-self: end; transition: opacity .22s, transform .32s ease }
.cc-swap > .cc-group--voice { gap: 6px; opacity: 0; transform: translateX(10px) }
.cc-swap[data-recording] > .cc-group--voice { opacity: 1; transform: none }
.cc-swap[data-recording] > .cc-group--end { opacity: 0; transform: translateX(-10px) }

.cc-icon-btn {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px;
  color: var(--cc-t3); transition: background-color .16s, color .16s, transform .16s ease;
}
.cc-icon-btn svg, .cc-send svg { width: 16px; height: 16px; stroke-width: 1.6 }
.cc-icon-btn:hover { background: var(--cc-hover); color: var(--cc-t1) }
.cc-icon-btn:active, .cc-send:not(:disabled):active { transform: scale(.94) }

/* Request approval */
.cc-approval {
  display: flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px 0 8px; border-radius: 6px;
  font-weight: 500; color: var(--cc-t1); box-shadow: inset 0 0 0 .5px var(--cc-line);
  transition: background-color .2s, box-shadow .2s, color .16s;
}
.cc-approval:hover { background: var(--cc-hover) }
.cc-approval[data-state="done"] {
  color: var(--cc-red); background: color-mix(in oklab, var(--cc-red) 6%, transparent);
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--cc-red) 30%, transparent);
}
.cc-approval-icon { position: relative; flex: none; width: 16px; height: 16px }
.cc-approval-icon svg { position: absolute; inset: 0; width: 16px; height: 16px; stroke-width: 1.5 }
.cc-hand {
  color: var(--cc-t3); transform-origin: 50% 90%;
  transition: opacity .2s ease-out, transform .36s ease;
}
.cc-approval[data-state="loading"] .cc-hand { animation: cc-wave .9s ease-in-out infinite }
.cc-approval[data-state="done"] .cc-hand { opacity: 0; transform: scale(.6) }
.cc-shield { color: var(--cc-red); opacity: 0; transform: scale(.6); transition: opacity .2s ease-out, transform .36s ease }
.cc-approval[data-state="done"] .cc-shield { opacity: 1; transform: none }
.cc-approval-text { display: grid }
.cc-approval-text > * { grid-area: 1 / 1; white-space: nowrap; transition: opacity .2s, filter .2s }
.cc-approval-done { color: var(--cc-red); opacity: 0; filter: blur(4px) }
.cc-approval[data-state="done"] .cc-approval-done { opacity: 1; filter: none }
.cc-approval[data-state="done"] .cc-approval-idle { opacity: 0; filter: blur(4px) }

.cc-shimmer { position: relative }
.cc-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap; opacity: 0;
  background: linear-gradient(90deg, transparent 38%, var(--cc-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; transition: opacity .2s;
}
.cc-shimmer[data-on]::after { opacity: 1; animation: cc-sweep calc(var(--cc-load) / 2) linear infinite }

/* Model button */
.cc-model {
  display: flex; align-items: center; gap: 4px; height: 28px; padding: 0 6px 0 8px; border-radius: 6px;
  font-weight: 500; color: var(--cc-t1); transition: background-color .16s, color .16s, transform .16s ease;
}
.cc-model:hover, .cc-model[aria-expanded="true"] { background: var(--cc-hover) }
.cc-model svg { width: 16px; height: 16px; stroke-width: 1.6; color: var(--cc-t3); transition: transform .26s var(--cc-ease) }
.cc-model[aria-expanded="true"] svg { transform: rotate(180deg) }

/* Send */
.cc-send {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; margin-left: 2px; border-radius: 6px;
  color: var(--cc-t4); background: var(--cc-fill); transition: background-color .2s, color .2s, transform .16s ease;
}
.cc-send[data-ready] { color: var(--cc-on-strong); background: var(--cc-strong) }

/* Voice */
.cc-trace {
  flex: none; width: 77px; height: 20px; margin-right: 6px; overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent);
}
.cc-trace-track { display: flex; align-items: center; gap: 3px; width: max-content; height: 100% }
.cc-swap[data-recording] .cc-trace-track { animation: cc-scroll .9s linear infinite }
.cc-trace i { flex: none; width: 3px; height: var(--h); border-radius: 1.5px; background: var(--cc-t3) }
.cc-discard { color: var(--cc-t1); background: var(--cc-surface); box-shadow: var(--cc-shadow) }
.cc-discard:hover { color: var(--cc-ink); background: var(--cc-surface) }
.cc-send--accept { margin-left: 0 }

/* Foot: two rows that swap places */
.cc-foot { display: grid; align-items: center; height: 36px; padding: 0 8px; border-top: .41px solid var(--cc-line) }
.cc-row {
  grid-area: 1 / 1; justify-self: start; display: flex; align-items: center; gap: 8px; height: 26px; padding: 0 8px 0 6px;
  border-radius: 6px; font-size: 12px; line-height: 16px; color: var(--cc-t2); white-space: nowrap;
  transition: background-color .16s, color .16s, opacity .3s ease-out, transform .46s ease, filter .3s ease-out;
}
.cc-row:hover { background: var(--cc-hover); color: var(--cc-t1) }
.cc-foot[data-stage="done"] .cc-connect { opacity: 0; transform: translateY(-5px) scale(.97); filter: blur(3px); pointer-events: none }
.cc-foot:not([data-stage="done"]) .cc-project { opacity: 0; transform: translateY(5px) scale(.97); filter: blur(3px); pointer-events: none }
.cc-logos { display: flex; gap: 4px }
.cc-logos svg { display: block; width: 14px; height: 14px }
.cc-foot[data-stage="loading"] .cc-logos svg {
  animation: cc-hop calc(var(--cc-load) / 2) var(--cc-ease) infinite; animation-delay: calc(var(--i) * 90ms);
}
.cc-folder { flex: none; width: 16px; height: 16px; stroke-width: 1.5; color: color-mix(in oklab, var(--cc-accent) 76.5%, transparent) }
.cc-row .cc-row-chevron { flex: none; width: 12px; height: 12px; margin-left: -2px; stroke-width: 1.8; color: var(--cc-t4) }

/* Model picker: a panel that unfolds from the corner next to its button */
.cc-menu { position: absolute; z-index: 20; width: 260px }
.cc-menu-panel {
  position: relative; padding: 4px; border-radius: 10px; background: var(--cc-surface); box-shadow: var(--cc-float);
  overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none;
  clip-path: var(--cc-clip); opacity: 0; visibility: hidden;
  transition: clip-path .26s cubic-bezier(.4, 0, .2, 1), opacity .12s linear .14s, visibility 0s .26s;
}
.cc-menu-panel::-webkit-scrollbar { display: none }
.cc-menu[data-open] .cc-menu-panel {
  clip-path: inset(-32px round 10px); opacity: 1; visibility: visible;
  transition: clip-path .26s cubic-bezier(.4, 0, .2, 1), opacity .1s linear, visibility 0s;
}
.cc-menu-fill {
  position: absolute; top: 4px; left: 4px; right: 4px; height: 48px; border-radius: 6px; background: var(--cc-fill);
  opacity: 0; pointer-events: none; transform: translateY(calc(var(--cc-i) * 48px));
  transition: transform .22s var(--cc-ease), opacity .16s;
}
.cc-menu-fill[data-on] { opacity: 1 }
.cc-option {
  position: relative; display: flex; align-items: center; gap: 10px; height: 48px; padding: 6px 8px; border-radius: 6px; cursor: pointer;
}
.cc-option-logo { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--cc-ink) }
.cc-option-logo svg { width: 16px; height: 16px; stroke-width: 1.6 }
.cc-option-text { display: grid; flex: 1; min-width: 0 }
.cc-option-name { font-weight: 500; color: var(--cc-ink) }
.cc-option-desc { overflow: hidden; font-size: 12px; line-height: 16px; color: var(--cc-t2); text-overflow: ellipsis; white-space: nowrap }
.cc-option-check {
  flex: none; width: 16px; height: 16px; stroke-width: 1.8; color: color-mix(in oklab, var(--cc-accent) 76.5%, transparent);
  opacity: 0; transform: scale(.4); transition: transform .26s cubic-bezier(.34, 1.5, .64, 1), opacity .16s;
}
.cc-option[aria-selected="true"] .cc-option-check { opacity: 1; transform: none }

/* Narrow containers: the approval button keeps only its icon */
@container (max-width: 399px) {
  .cc-approval { gap: 0; padding: 0 6px }
  .cc-approval-text {
    position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%);
  }
}

@keyframes cc-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes cc-hop { 0%, 55%, 100% { transform: none } 25% { transform: translateY(-3.5px) } }
@keyframes cc-wave {
  0%, 100% { transform: rotate(0) } 18% { transform: rotate(-16deg) } 38% { transform: rotate(13deg) }
  58% { transform: rotate(-9deg) } 78% { transform: rotate(5deg) }
}
@keyframes cc-scroll { to { transform: translateX(-78px) } }
@keyframes cc-word { from { opacity: 0; filter: blur(3px) } }

@media (prefers-reduced-motion: reduce) {
  .cc *, .cc *::before, .cc *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Small pieces                               */
/* -------------------------------------------------------------------------- */

const DEFAULT_MODELS: ChatModel[] = [
  { id: "auto", name: "Auto", description: "Routes each task to the best model", icon: <Sparkles /> },
  { id: "nova", name: "Nova", description: "Careful writing and long documents", icon: <Asterisk /> },
  { id: "nova-mini", name: "Nova Mini", description: "Fast answers and everyday tasks", icon: <Aperture /> },
]

const DEFAULT_DICTATION = "Summarize this week's support tickets and flag anything that mentions a refund."

const OPTION_H = 48
const PANEL_W = 260
const FIELD_MAX_H = 168
const TRACE = [3, 5, 9, 4, 12, 7, 3, 10, 15, 6, 4, 8, 3]

/** Three small, original app marks for the "Connect apps" row. */
const APP_MARKS = [
  <svg key="mail" viewBox="0 0 14 14" aria-hidden>
    <rect width="14" height="14" rx="3.5" fill="#e5484d" />
    <path d="M3.2 4.6 7 7.6l3.8-3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M3.4 4.4h7.2v5.2H3.4z" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" fill="none" />
  </svg>,
  <svg key="chat" viewBox="0 0 14 14" aria-hidden>
    <rect width="14" height="14" rx="3.5" fill="#6e56cf" />
    <path d="M3.6 4.4c0-.5.4-.9.9-.9h5c.5 0 .9.4.9.9v3.2c0 .5-.4.9-.9.9H7L5 10V8.5h-.5a.9.9 0 0 1-.9-.9z" fill="#fff" />
  </svg>,
  <svg key="tasks" viewBox="0 0 14 14" aria-hidden>
    <rect width="14" height="14" rx="3.5" fill="#12a594" />
    <path d="m4.2 7.2 1.9 1.9 3.7-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>,
]

function joinText(base: string, add: string) {
  if (!add) return base
  return base && !/\s$/.test(base) ? `${base} ${add}` : base + add
}

/* -------------------------------------------------------------------------- */
/*                                ChatComposer                                */
/* -------------------------------------------------------------------------- */

export function ChatComposer({
  placeholder = "Start by typing...",
  models = DEFAULT_MODELS,
  defaultModelId,
  defaultValue = "",
  loadMs = 1300,
  dictation = DEFAULT_DICTATION,
  dictationWordMs = 320,
  projectLabel = "Select a project",
  onSend,
  onModelChange,
  onAttach,
  onConnectApps,
  onRequestApproval,
  onSelectProject,
  onRecordingChange,
  className,
}: ChatComposerProps) {
  const uid = React.useId()
  const listId = `${uid}-list`
  const optionId = (i: number) => `${uid}-opt-${i}`

  const [text, setText] = React.useState(defaultValue)
  const [modelId, setModelId] = React.useState(defaultModelId ?? models[0]?.id)
  const [status, setStatus] = React.useState("")
  const [connect, setConnect] = React.useState<Stage>("idle")
  const [approval, setApproval] = React.useState<Stage>("idle")

  // Voice
  const [recording, setRecording] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [heard, setHeard] = React.useState(0)

  // Model picker
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const [fillOn, setFillOn] = React.useState(false)
  const [openSeq, setOpenSeq] = React.useState(0)
  const [place, setPlace] = React.useState<MenuPlace>({ left: 0, top: 0, v: "top", h: "right", maxHeight: 296 })

  const [fieldHeight, setFieldHeight] = React.useState<number>()

  const bodyRef = React.useRef<HTMLElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const mirrorRef = React.useRef<HTMLDivElement>(null)
  const modelBtnRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  const selectedIndex = Math.max(0, models.findIndex((m) => m.id === modelId))
  const selected = models[selectedIndex]

  const words = React.useMemo(() => dictation.trim().split(/\s+/).filter(Boolean), [dictation])
  const shown = dictationWordMs <= 0 ? words.length : Math.min(heard, words.length)
  const heardText = words.slice(0, shown).join(" ")
  const showHeard = (recording || confirming) && shown > 0
  const ready = text.trim().length > 0 && !recording && !confirming

  /* Timers: everything scheduled by the component is cleared on unmount. */
  const alive = React.useRef(true)
  const timers = React.useRef(new Set<number>())
  React.useEffect(() => {
    alive.current = true
    const pending = timers.current
    return () => {
      alive.current = false
      pending.forEach((id) => window.clearTimeout(id))
      pending.clear()
    }
  }, [])
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }

  /* The textarea grows with its mirror (height can't be transitioned from auto). */
  React.useEffect(() => {
    const el = mirrorRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setFieldHeight(Math.min(FIELD_MAX_H, el.offsetHeight)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Dictation: reveal one word at a time while recording. */
  React.useEffect(() => {
    if (!recording || dictationWordMs <= 0 || heard >= words.length) return
    const id = window.setTimeout(() => setHeard((n) => n + 1), heard === 0 ? 500 : dictationWordMs)
    return () => window.clearTimeout(id)
  }, [recording, heard, words.length, dictationWordMs])

  /* Picker: focus the listbox on open, close on outside press / resize, keep the active row in view. */
  React.useEffect(() => {
    if (menuOpen) panelRef.current?.focus({ preventScroll: true })
  }, [menuOpen])
  React.useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || modelBtnRef.current?.contains(t)) return
      setMenuOpen(false)
    }
    const onResize = () => setMenuOpen(false)
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("resize", onResize)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      window.removeEventListener("resize", onResize)
    }
  }, [menuOpen])
  React.useEffect(() => {
    const panel = panelRef.current
    if (!menuOpen || !panel || panel.scrollHeight <= panel.clientHeight) return
    document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" })
  }, [menuOpen, active, uid])

  /* ------------------------------- Handlers -------------------------------- */

  const focusText = () => textareaRef.current?.focus({ preventScroll: true })

  const send = () => {
    if (!ready || !selected) return
    onSend?.(text.trim(), { model: selected })
    setText("")
    setStatus("Message sent.")
  }

  const startRecording = () => {
    setHeard(0)
    setConfirming(false)
    setRecording(true)
    setStatus("Recording. Heard words appear as you speak.")
    onRecordingChange?.(true)
    focusText()
  }

  const discardRecording = () => {
    setRecording(false)
    setHeard(0)
    setStatus("Recording discarded.")
    onRecordingChange?.(false)
    focusText()
  }

  const acceptRecording = () => {
    setRecording(false)
    onRecordingChange?.(false)
    focusText()
    if (shown === 0) {
      setStatus("Recording stopped.")
      return
    }
    // The gray words turn dark first, then move into the textarea.
    const add = heardText
    setConfirming(true)
    setStatus("Dictation added to your message.")
    later(() => {
      setText((t) => joinText(t, add))
      setHeard(0)
      setConfirming(false)
    }, 260)
  }

  const runLoad = (cb: (() => void | Promise<unknown>) | undefined, set: (s: Stage) => void) => {
    set("loading")
    let result: unknown
    try {
      result = cb?.()
    } catch {
      set("idle")
      return
    }
    const wait = new Promise<void>((resolve) => later(resolve, loadMs))
    Promise.all([wait, result]).then(
      () => alive.current && set("done"),
      () => alive.current && set("idle"),
    )
  }

  const connectApps = () => {
    if (connect !== "idle") return
    setStatus("Connecting apps.")
    runLoad(onConnectApps, (s) => {
      setConnect(s)
      if (s === "done") setStatus("Apps connected. Select a project to continue.")
      if (s === "idle") setStatus("Could not connect apps.")
    })
  }

  const requestApproval = () => {
    if (approval === "loading") return
    if (approval === "done") {
      setApproval("idle")
      setStatus("Unrestricted access revoked.")
      return
    }
    setStatus("Requesting approval.")
    runLoad(onRequestApproval, (s) => {
      setApproval(s)
      if (s === "done") setStatus("Unrestricted access granted.")
      if (s === "idle") setStatus("Approval request failed.")
    })
  }

  const openMenu = (viaKeyboard: boolean) => {
    const btn = modelBtnRef.current
    const body = bodyRef.current
    if (!btn || !body) return
    const b = btn.getBoundingClientRect()
    const c = body.getBoundingClientRect()
    const natural = Math.min(models.length * OPTION_H + 8, 296)
    const below = window.innerHeight - b.bottom
    const above = b.top
    const down = below >= natural + 14 || below >= above
    const maxHeight = Math.max(96, Math.min(natural, (down ? below : above) - 14))
    let left = b.right - PANEL_W
    if (left < 8) left = b.left
    left = Math.max(8, Math.min(left, window.innerWidth - PANEL_W - 8))
    const h = (b.left + b.right) / 2 > left + PANEL_W / 2 ? "right" : "left"
    setPlace(
      down
        ? { left: left - c.left, top: b.bottom - c.top + 6, v: "top", h, maxHeight }
        : { left: left - c.left, bottom: c.bottom - b.top + 6, v: "bottom", h, maxHeight },
    )
    setActive(selectedIndex)
    setFillOn(viaKeyboard)
    setOpenSeq((n) => n + 1)
    setMenuOpen(true)
  }

  const closeMenu = (restoreFocus: boolean) => {
    setMenuOpen(false)
    if (restoreFocus) modelBtnRef.current?.focus({ preventScroll: true })
  }

  const pickModel = (i: number) => {
    const m = models[i]
    if (!m) return
    if (m.id !== selected?.id) {
      setModelId(m.id)
      onModelChange?.(m)
      setStatus(`Model: ${m.name}.`)
    }
    closeMenu(true)
  }

  const onTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (recording) acceptRecording()
      else send()
      return
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && text === "" && !recording && models.length > 0) {
      e.preventDefault()
      openMenu(true)
    }
  }

  const onModelKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !menuOpen && models.length > 0) {
      e.preventDefault()
      openMenu(true)
    }
  }

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = models.length - 1
    const move = (i: number) => {
      e.preventDefault()
      setActive(Math.max(0, Math.min(last, i)))
      setFillOn(true)
    }
    switch (e.key) {
      case "ArrowDown":
        return move(active + 1)
      case "ArrowUp":
        return move(active - 1)
      case "Home":
        return move(0)
      case "End":
        return move(last)
      case "Enter":
      case " ":
        e.preventDefault()
        return pickModel(active)
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        return closeMenu(true)
    }
  }

  const onRootKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && recording) {
      e.preventDefault()
      discardRecording()
    }
  }

  const onCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button, [role=listbox], textarea")) return
    focusText()
  }

  /* -------------------------------- Render --------------------------------- */

  const closedClip = `inset(${place.v === "top" ? "0" : "100%"} ${place.h === "right" ? "0" : "100%"} ${
    place.v === "top" ? "100%" : "0"
  } ${place.h === "right" ? "100%" : "0"} round 10px)`

  return (
    <div
      className={cn("cc", className)}
      data-menu={menuOpen || undefined}
      style={{ "--cc-load": `${loadMs}ms` } as React.CSSProperties}
      onKeyDown={onRootKeyDown}
    >
      <style href="chat-composer" precedence="default">
        {CSS}
      </style>

      <section ref={bodyRef} className="cc-body" aria-label="Message composer" onClick={onCardClick}>
        <div className="cc-write">
          <div className="cc-field">
            <div className="cc-grow" style={fieldHeight !== undefined ? { height: fieldHeight } : undefined}>
              <div ref={mirrorRef} className="cc-mirror" aria-hidden>
                {text}
                {showHeard && (
                  <span className="cc-heard" data-confirmed={confirming || undefined}>
                    {text && !/\s$/.test(text) ? " " : ""}
                    {words.slice(0, shown).map((w, i) => (
                      <span key={i} className="cc-word">
                        {i > 0 ? " " : ""}
                        {w}
                      </span>
                    ))}
                  </span>
                )}
                {"​"}
              </div>
              <textarea
                ref={textareaRef}
                className="cc-message"
                rows={1}
                value={text}
                placeholder={recording || confirming ? "" : placeholder}
                aria-label="Message"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onTextKeyDown}
              />
            </div>
          </div>

          <div className="cc-tools">
            <div className="cc-group">
              <button type="button" className="cc-icon-btn" aria-label="Add attachment" onClick={() => onAttach?.()}>
                <Plus />
              </button>
              <button
                type="button"
                className="cc-approval"
                data-state={approval}
                aria-label={approval === "done" ? "Unrestricted access" : "Request approval"}
                aria-busy={approval === "loading"}
                aria-pressed={approval === "done"}
                onClick={requestApproval}
              >
                <span className="cc-approval-icon" aria-hidden>
                  <Hand className="cc-hand" />
                  <ShieldAlert className="cc-shield" />
                </span>
                <span className="cc-approval-text" aria-hidden>
                  <span className="cc-approval-idle cc-shimmer" data-text="Request approval" data-on={approval === "loading" || undefined}>
                    Request approval
                  </span>
                  <span className="cc-approval-done">Unrestricted access</span>
                </span>
              </button>
            </div>

            <div className="cc-swap" data-recording={recording || undefined}>
              <div className="cc-group cc-group--end" inert={recording}>
                <button
                  ref={modelBtnRef}
                  type="button"
                  className="cc-model"
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                  aria-controls={listId}
                  aria-label={`Model: ${selected?.name ?? ""}`}
                  onClick={(e) => (menuOpen ? closeMenu(false) : openMenu(e.detail === 0))}
                  onKeyDown={onModelKeyDown}
                >
                  {selected?.name}
                  <ChevronDown aria-hidden />
                </button>
                <button type="button" className="cc-icon-btn" aria-label="Voice input" onClick={startRecording}>
                  <Mic />
                </button>
                <button type="button" className="cc-send" data-ready={ready || undefined} disabled={!ready} aria-label="Send message" onClick={send}>
                  <ArrowUp />
                </button>
              </div>

              <div className="cc-group cc-group--voice" inert={!recording}>
                <span className="cc-trace" aria-hidden>
                  <span className="cc-trace-track">
                    {[...TRACE, ...TRACE].map((h, i) => (
                      <i key={i} style={{ "--h": `${h}px` } as React.CSSProperties} />
                    ))}
                  </span>
                </span>
                <button type="button" className="cc-icon-btn cc-discard" aria-label="Discard recording" onClick={discardRecording}>
                  <X />
                </button>
                <button type="button" className="cc-send cc-send--accept" data-ready aria-label="Use recording" onClick={acceptRecording}>
                  <Check />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="cc-foot" data-stage={connect}>
          <button
            type="button"
            className="cc-row cc-connect"
            aria-busy={connect === "loading"}
            inert={connect === "done"}
            onClick={connectApps}
          >
            <span className="cc-logos" aria-hidden>
              {APP_MARKS.map((mark, i) => (
                <span key={i} style={{ display: "contents", "--i": i } as React.CSSProperties}>
                  {mark}
                </span>
              ))}
            </span>
            <span className="cc-shimmer" data-text="Connect apps" data-on={connect === "loading" || undefined}>
              Connect apps
            </span>
          </button>
          <button type="button" className="cc-row cc-project" inert={connect !== "done"} onClick={() => onSelectProject?.()}>
            <Folder className="cc-folder" aria-hidden />
            {projectLabel}
            <ChevronRight className="cc-row-chevron" aria-hidden />
          </button>
        </div>

        <div
          className="cc-menu"
          data-open={menuOpen || undefined}
          style={{ left: place.left, top: place.top, bottom: place.bottom }}
        >
          <div
            ref={panelRef}
            id={listId}
            className="cc-menu-panel"
            role="listbox"
            aria-label="Select a model"
            aria-activedescendant={menuOpen ? optionId(active) : undefined}
            tabIndex={-1}
            inert={!menuOpen}
            style={{ "--cc-clip": closedClip, maxHeight: place.maxHeight } as React.CSSProperties}
            onKeyDown={onListKeyDown}
            onPointerLeave={() => setFillOn(false)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false)
            }}
          >
            <span
              key={openSeq}
              className="cc-menu-fill"
              data-on={fillOn || undefined}
              style={{ "--cc-i": active } as React.CSSProperties}
              aria-hidden
            />
            {models.map((m, i) => (
              <div
                key={m.id}
                id={optionId(i)}
                role="option"
                aria-selected={i === selectedIndex}
                className="cc-option"
                onPointerMove={() => {
                  if (active !== i) setActive(i)
                  if (!fillOn) setFillOn(true)
                }}
                onClick={() => pickModel(i)}
              >
                <span className="cc-option-logo" aria-hidden>
                  {m.icon}
                </span>
                <span className="cc-option-text">
                  <span className="cc-option-name">{m.name}</span>
                  <span className="cc-option-desc">{m.description}</span>
                </span>
                <Check className="cc-option-check" aria-hidden />
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="cc-sr" aria-live="polite">
        {status}
      </p>
    </div>
  )
}

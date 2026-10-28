"use client"

import * as React from "react"
import { ArrowUp, Mic, Pause, Play, Square, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type VoiceMessage = {
  id: string
  /** Length in seconds. */
  duration: number
  /** Bar heights from 0 to 1. `voicePeaks` makes deterministic data. */
  peaks: number[]
  /** Name of the sender. Messages with a sender are incoming; messages without one are yours. */
  from?: string
  /** Avatar image URL for incoming messages. Leave it out for an initials avatar. */
  avatar?: string
  /** Meta line under the bubble, e.g. "9:41 AM". */
  meta?: string
  /** Object URL of a real recording. Present when `source="microphone"`; playback then uses it. */
  audioUrl?: string
}

export type VoiceRecorderError = {
  code: "denied" | "no-device" | "unsupported" | "failed"
  message: string
}

export type VoiceRecorderProps = {
  /** Messages already in the thread, oldest first. */
  defaultMessages?: VoiceMessage[]
  /** Called with each sent take. */
  onSend?: (message: VoiceMessage) => void
  /** Called when a take is discarded with the trash button or Escape. */
  onCancel?: () => void
  /** Seconds before recording stops on its own and moves to review. Default 60. */
  maxDuration?: number
  /** Meta line under messages you send. Default "Just now". */
  sentMeta?: string
  /**
   * `simulated` (default) draws a made-up waveform and records nothing. `microphone` asks the browser for the microphone
   * only when the person taps the mic, records with MediaRecorder and plays the take back.
   */
  source?: "simulated" | "microphone"
  /** Called when the microphone cannot be used (permission denied, no device, unsupported). */
  onError?: (error: VoiceRecorderError) => void
  /** Accessible name of the whole recorder. */
  label?: string
  className?: string
}

/** Deterministic bar heights (0 to 1) for a voice message of `seconds`. */
export function voicePeaks(seed: number, seconds: number): number[] {
  const n = Math.max(20, Math.min(90, Math.round(seconds * 6)))
  const r = rng(seed * 7919 + 13)
  const a = r() * 6.28
  const out: number[] = []
  let prev = 0.4
  for (let i = 0; i < n; i++) {
    const x = i / n
    const phrase = 0.5 + 0.38 * Math.sin(x * 9 + a) * Math.sin(x * 3.3 + a * 0.5)
    prev = prev * 0.4 + (phrase + (r() - 0.5) * 0.6) * 0.6
    out.push(Math.max(0.08, Math.min(1, prev)))
  }
  return out
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function rng(seed: number): () => number {
  let a = seed | 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s)) % 60).padStart(2, "0")}`
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** A made-up voice level: phrases of speech separated by short silences. */
function simLevel(t: number): number {
  const phrase = Math.sin(t * 2.1) + 0.55 * Math.sin(t * 4.7 + 1.3) + 0.3 * Math.sin(t * 0.9 + 0.4)
  const gate = clamp01((phrase + 0.25) * 1.4)
  const syll = 0.45 + 0.55 * Math.abs(Math.sin(t * 13.7) * Math.cos(t * 5.3 + 0.7))
  return clamp01(gate * syll * 0.95 + (gate > 0.05 ? Math.random() * 0.08 : 0))
}

function resample(src: number[], n: number): number[] {
  if (src.length === 0) return Array.from({ length: n }, () => 0.12)
  const out: number[] = []
  let max = 0.001
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i / n) * src.length)
    const b = Math.max(a + 1, Math.floor(((i + 1) / n) * src.length))
    let m = 0
    for (let k = a; k < Math.min(b, src.length); k++) m = Math.max(m, src[k])
    out.push(m)
    max = Math.max(max, m)
  }
  const scale = 1 / Math.max(max, 0.35)
  return out.map((v) => Math.max(0.08, Math.min(1, v * scale)))
}

function micError(e: unknown): VoiceRecorderError {
  const name = (e as { name?: string })?.name ?? ""
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError")
    return { code: "denied", message: "Microphone access is blocked. Allow it in your browser's site settings, then try again." }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError")
    return { code: "no-device", message: "No microphone was found on this device." }
  return { code: "failed", message: "The microphone could not be started. Try again." }
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.vrc {
  --vrc-ink: oklch(.15 0 0);
  --vrc-surface: oklch(1 0 0);
  --vrc-accent: #0060e2;
  --vrc-t2: oklch(.46 0 0);
  --vrc-t3: oklch(.59 0 0);
  --vrc-line: oklch(.935 0 0);
  --vrc-fill: oklch(.978 0 0);
  --vrc-rec: oklch(.933 0 0);
  --vrc-live-bg: oklch(.33 0 0);
  --vrc-live-fg: oklch(1 0 0);
  --vrc-danger: oklch(.54 .21 25);
  --vrc-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  container-type: inline-size;
  color: var(--vrc-ink);
  font-family: var(--vrc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  text-align: start;
}
:is(.dark, [data-theme="dark"]) .vrc {
  --vrc-ink: oklch(.96 0 0);
  --vrc-surface: oklch(.215 0 0);
  --vrc-accent: #4d8dff;
  --vrc-t2: oklch(.74 0 0);
  --vrc-t3: oklch(.58 0 0);
  --vrc-line: oklch(1 0 0 / .1);
  --vrc-fill: oklch(1 0 0 / .07);
  --vrc-rec: oklch(1 0 0 / .11);
  --vrc-live-bg: oklch(.84 0 0);
  --vrc-live-fg: oklch(.2 0 0);
  --vrc-danger: oklch(.7 .19 25);
}
.vrc *, .vrc *::before, .vrc *::after { box-sizing: border-box }
:where(.vrc) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.vrc :focus { outline: none }
.vrc :focus-visible { outline: 2px solid color-mix(in oklab, var(--vrc-accent) 60%, transparent); outline-offset: 2px }
.vrc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Thread */
.vrc-thread { list-style: none; margin: 0; display: flex; flex-direction: column; gap: 12px; padding: 4px 2px; max-height: var(--vrc-thread-max, 320px); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--vrc-line) transparent }
.vrc-msg { display: flex; align-items: flex-end; gap: 8px; animation: vrc-in .4s var(--vrc-ease) backwards }
.vrc-msg[data-mine] { justify-content: flex-end }
.vrc-msg[data-flip] { animation: none }
@keyframes vrc-in { from { opacity: 0; transform: translateY(6px); filter: blur(3px) } }
.vrc-avatar { flex: none; width: 28px; height: 28px; margin-bottom: 20px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; font-size: 11px; font-weight: 600; color: #fff; background: var(--vrc-fill) }
.vrc-avatar img { width: 100%; height: 100%; object-fit: cover; display: block }
.vrc-body { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; max-width: 100% }
.vrc-msg[data-mine] .vrc-body { align-items: flex-end }
.vrc-bubble {
  --b-ink: var(--vrc-ink); --b-wave: color-mix(in oklab, var(--vrc-ink) 28%, transparent); --b-btn: var(--vrc-ink); --b-btn-fg: var(--vrc-surface);
  display: flex; align-items: center; gap: 10px; max-width: 100%; height: 44px; padding: 6px 14px 6px 6px; border-radius: 22px; background: var(--vrc-fill); color: var(--b-ink);
}
.vrc-bubble[data-mine] { --b-ink: var(--vrc-surface); --b-wave: color-mix(in oklab, var(--vrc-surface) 28%, transparent); --b-btn: var(--vrc-surface); --b-btn-fg: var(--vrc-ink); background: var(--vrc-ink) }
.vrc-bubble-in { display: contents }
.vrc-round { flex: none; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--b-btn, var(--vrc-ink)); color: var(--b-btn-fg, var(--vrc-surface)); transition: scale .2s var(--vrc-ease) }
.vrc-round:active { scale: .92 }
.vrc-round svg { width: 14px; height: 14px; fill: currentColor; stroke-width: 2 }
.vrc-round [data-ico] { grid-area: 1 / 1; display: grid; place-items: center; transition: opacity .2s var(--vrc-ease), scale .3s var(--vrc-ease), filter .2s var(--vrc-ease) }
.vrc-round[data-playing] [data-ico="play"], .vrc-round:not([data-playing]) [data-ico="pause"] { opacity: 0; scale: .6; filter: blur(2px) }
.vrc-round [data-ico="play"] svg { margin-left: 1px }
.vrc-wave { position: relative; flex: 0 1 auto; min-width: 40px; height: 22px; overflow: hidden; touch-action: pan-y; cursor: pointer; user-select: none; -webkit-user-select: none }
.vrc-wave[data-flex] { flex: 1; width: auto; height: 24px; overflow: visible }
.vrc-wave[data-flex]:focus-visible { border-radius: 6px }
.vrc-bars { position: absolute; inset: 0; display: flex; align-items: center; gap: 2px }
.vrc-bars i { display: block; flex: 1 1 0; min-width: 1.5px; max-width: 3px; border-radius: 2px; background: var(--b-wave, color-mix(in oklab, var(--vrc-ink) 28%, transparent)); transition: height .3s var(--vrc-ease) }
.vrc-played { position: absolute; inset: 0; clip-path: inset(0 100% 0 0) }
.vrc-played i { background: var(--b-ink, var(--vrc-ink)) }
.vrc-time { flex: none; font-size: 12px; line-height: 17px; font-variant-numeric: tabular-nums; min-width: 26px; text-align: right }
.vrc-meta { padding: 0 6px; font-size: 12px; line-height: 17px; color: var(--vrc-t3) }

/* Composer: the mic, the recording bar, the review and the sent bubble are one thing that grows and settles. */
.vrc-composer { position: relative; display: flex; align-items: center; gap: 8px; min-height: 61px; padding-top: 12px; border-top: 1px solid var(--vrc-line) }
.vrc-left { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 48px }
.vrc-hint { position: absolute; inset: 0; display: flex; align-items: center; color: var(--vrc-t3); font-size: 14px; line-height: 19.6px; transition: opacity .25s var(--vrc-ease), filter .25s var(--vrc-ease) }
.vrc-hint[data-error] { color: var(--vrc-danger) }
.vrc-hint[data-hide] { opacity: 0; filter: blur(3px); pointer-events: none }
.vrc-hint span { display: block; min-width: 0 }
.vrc-discard { flex: none; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; color: var(--vrc-t2); transition: background-color .16s var(--vrc-ease), color .16s var(--vrc-ease); animation: vrc-pop .35s var(--vrc-ease) .06s backwards }
.vrc-discard:hover { background: var(--vrc-fill); color: var(--vrc-ink) }
.vrc-discard svg { width: 18px; height: 18px; stroke-width: 1.75 }
.vrc-discard[data-leaving] { animation: vrc-unpop .2s var(--vrc-ease) forwards }
@keyframes vrc-pop { from { opacity: 0; scale: .5 } }
@keyframes vrc-unpop { to { opacity: 0; scale: .5 } }
.vrc-capsule { position: relative; flex: 1; min-width: 0; height: 48px; border-radius: 999px; background: var(--vrc-rec); transition: background-color .3s var(--vrc-ease) }
.vrc-capsule[data-phase="review"] { background: var(--vrc-fill) }
.vrc-capsule[data-enter] { animation: vrc-grow .55s var(--vrc-ease) backwards }
.vrc-capsule[data-leaving] { animation: vrc-shrink .3s var(--vrc-ease) forwards }
@keyframes vrc-grow { from { clip-path: inset(0 0 0 calc(100% - 28px) round 999px); opacity: .4 } to { clip-path: inset(0 0 0 0 round 999px); opacity: 1 } }
@keyframes vrc-shrink { to { clip-path: inset(0 0 0 calc(100% - 28px) round 999px); opacity: 0 } }
.vrc-row { position: absolute; inset: 0; display: flex; align-items: center; opacity: 0; filter: blur(3px); visibility: hidden; transition: opacity .22s var(--vrc-ease), filter .22s var(--vrc-ease), visibility 0s .22s }
.vrc-capsule[data-phase="recording"] .vrc-row-rec, .vrc-capsule[data-phase="review"] .vrc-row-review { opacity: 1; filter: none; visibility: visible; transition-delay: .1s, .1s, 0s }
.vrc-row-rec { gap: 10px; padding: 0 14px 0 16px }
.vrc-row-review { gap: 10px; padding: 0 14px 0 8px }
.vrc-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--vrc-danger); animation: vrc-blink 1.3s ease-in-out infinite }
@keyframes vrc-blink { 50% { opacity: .35 } }
.vrc-timer { flex: none; min-width: 43px; font-size: 14px; line-height: 20px; font-variant-numeric: tabular-nums }
.vrc-live { flex: 1; min-width: 0; height: 28px; display: block; color: var(--vrc-ink); -webkit-mask-image: linear-gradient(90deg, transparent, #000 28%); mask-image: linear-gradient(90deg, transparent, #000 28%) }

.vrc-action {
  position: relative; flex: none; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: var(--vrc-ink); color: var(--vrc-surface);
  transition: background-color .3s var(--vrc-ease), color .3s var(--vrc-ease), scale .2s var(--vrc-ease);
}
.vrc-composer:not([data-phase="idle"]) .vrc-action { background: var(--vrc-live-bg); color: var(--vrc-live-fg) }
.vrc-composer[data-phase="requesting"] .vrc-action { opacity: .7; cursor: progress }
.vrc-action:active { scale: .94 }
.vrc-action svg { width: 20px; height: 20px; stroke-width: 1.75 }
.vrc-ico { grid-area: 1 / 1; display: grid; place-items: center; opacity: 0; scale: .6; filter: blur(3px); transition: opacity .2s var(--vrc-ease), scale .3s var(--vrc-ease), filter .2s var(--vrc-ease) }
.vrc-ico[data-on] { opacity: 1; scale: 1; filter: none }
.vrc-ico svg[data-stop] { width: 14px; height: 14px; fill: currentColor; stroke-width: 2 }
.vrc-ico svg[data-send] { stroke-width: 2.2 }
.vrc-composer[data-phase="requesting"] .vrc-ico[data-ico="mic"] { animation: vrc-blink 1s ease-in-out infinite }

@media (prefers-reduced-motion: reduce) {
  .vrc-msg, .vrc-discard, .vrc-capsule[data-enter], .vrc-capsule[data-leaving] { animation: none !important }
  .vrc-capsule[data-leaving] { opacity: 0 }
  .vrc-bars i, .vrc-ico, .vrc-round [data-ico], .vrc-hint, .vrc-row, .vrc-action, .vrc-round { transition: none !important }
  .vrc-dot, .vrc-composer[data-phase="requesting"] .vrc-ico[data-ico="mic"] { animation: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Waveform                                  */
/* -------------------------------------------------------------------------- */

type Playable = { played: HTMLElement | null; time: HTMLElement | null; dur: number }

function useWidth(ref: React.RefObject<HTMLElement | null>, enabled: boolean): number {
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, enabled])
  return w
}

function barsFor(peaks: number[], n: number): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i / n) * peaks.length)
    const b = Math.max(a + 1, Math.floor(((i + 1) / n) * peaks.length))
    let m = 0
    for (let k = a; k < Math.min(b, peaks.length); k++) m = Math.max(m, peaks[k])
    out.push(Math.max(0.12, Math.min(1, m)))
  }
  return out
}

type WaveProps = {
  peaks: number[]
  duration: number
  /** Fixed width in px (bubbles) or flexing to fit the row (review). */
  width?: number
  slider?: boolean
  label?: string
  playedRef: React.RefObject<HTMLSpanElement | null>
  onSeek: (fraction: number) => void
  onNudge?: (seconds: number) => void
}

const Wave = React.memo(function Wave({ peaks, duration, width, slider, label, playedRef, onSeek, onNudge }: WaveProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const measured = useWidth(ref, width === undefined)
  const w = width ?? measured
  const n = Math.max(8, Math.floor((w + 2) / 4.6))
  const bars = React.useMemo(() => barsFor(peaks, n), [peaks, n])
  const down = React.useRef(false)
  const at = (x: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (r && r.width) onSeek(clamp01((x - r.left) / r.width))
  }
  return (
    <span
      ref={ref}
      className="vrc-wave"
      data-flex={width === undefined ? "" : undefined}
      style={width === undefined ? undefined : { width }}
      {...(slider
        ? {
            role: "slider",
            tabIndex: 0,
            "aria-label": label ?? "Position",
            "aria-valuemin": 0,
            "aria-valuemax": duration,
            "aria-valuetext": `${fmt(duration)} long`,
            onKeyDown: (e: React.KeyboardEvent) => {
              const step: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -5, PageUp: 5 }
              if (e.key in step) {
                e.preventDefault()
                onNudge?.(step[e.key])
              } else if (e.key === "Home") {
                e.preventDefault()
                onSeek(0)
              } else if (e.key === "End") {
                e.preventDefault()
                onSeek(1)
              }
            },
          }
        : { "aria-hidden": true })}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        down.current = true
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
        at(e.clientX)
      }}
      onPointerMove={(e) => down.current && at(e.clientX)}
      onPointerUp={() => { down.current = false }}
      onPointerCancel={() => { down.current = false }}
    >
      <span className="vrc-bars" aria-hidden="true">
        {bars.map((p, i) => <i key={i} style={{ height: `${p * 100}%` }} />)}
      </span>
      <span ref={playedRef} className="vrc-played vrc-bars" aria-hidden="true">
        {bars.map((p, i) => <i key={i} style={{ height: `${p * 100}%` }} />)}
      </span>
    </span>
  )
})

/* -------------------------------------------------------------------------- */
/*                                  Messages                                  */
/* -------------------------------------------------------------------------- */

type Engine = {
  register: (id: string, n: Playable | null, own?: boolean) => void
  toggle: (id: string, url?: string) => void
  seek: (id: string, fraction: number, dur: number) => void
  nudge: (id: string, seconds: number, dur: number) => void
}

const Message = React.memo(function Message({ m, playing, engine, flip }: { m: VoiceMessage; playing: boolean; engine: Engine; flip: (id: string, el: HTMLElement | null) => void }) {
  const mine = !m.from
  const playedRef = React.useRef<HTMLSpanElement>(null)
  const timeRef = React.useRef<HTMLSpanElement>(null)
  React.useLayoutEffect(() => {
    engine.register(m.id, { played: playedRef.current, time: timeRef.current, dur: m.duration })
    return () => engine.register(m.id, null)
  }, [engine, m.id, m.duration])
  const width = Math.max(96, Math.min(200, 70 + 6.25 * m.duration))
  const who = m.from ? ` from ${m.from}` : ""
  const hue = hashStr(m.from ?? "me") % 360
  return (
    <li className="vrc-msg" data-mine={mine ? "" : undefined}>
      {!mine ? (
        <span className="vrc-avatar" aria-hidden="true" style={m.avatar ? undefined : { background: `linear-gradient(140deg, oklch(.72 .13 ${hue}), oklch(.55 .15 ${(hue + 40) % 360}))` }}>
          {m.avatar ? <img src={m.avatar} alt="" draggable={false} /> : (m.from ?? "").slice(0, 1).toUpperCase()}
        </span>
      ) : null}
      <div className="vrc-body">
        <div className="vrc-bubble" ref={(el) => flip(m.id, el)} data-mine={mine ? "" : undefined}>
          <span className="vrc-bubble-in">
            <button
              type="button"
              className="vrc-round"
              data-playing={playing ? "" : undefined}
              aria-label={`${playing ? "Pause" : "Play"} voice message${who}, ${fmt(m.duration)}`}
              onClick={() => engine.toggle(m.id, m.audioUrl)}
            >
              <span data-ico="play"><Play aria-hidden /></span>
              <span data-ico="pause"><Pause aria-hidden /></span>
            </button>
            <Wave peaks={m.peaks} duration={m.duration} width={width} playedRef={playedRef} onSeek={(f) => engine.seek(m.id, f, m.duration)} />
            <span ref={timeRef} className="vrc-time" aria-hidden="true" />
          </span>
        </div>
        {m.meta ? <span className="vrc-meta">{m.meta}</span> : null}
      </div>
    </li>
  )
})

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type Phase = "idle" | "requesting" | "recording" | "review"
type Draft = { duration: number; peaks: number[]; audioUrl?: string }
type Mic = { stream: MediaStream; ctx: AudioContext; an: AnalyserNode; rec: MediaRecorder; chunks: Blob[]; buf: Uint8Array<ArrayBuffer> }

const PITCH = 4
const COL_MS = 70

/**
 * A voice note composer and thread. Tap the mic to record into a live bar with a scrolling waveform and timer, stop into
 * a review you can play and scrub, then send the take into the thread as a voice bubble. By default the waveform is
 * simulated; set `source="microphone"` to record for real (the browser asks for permission only after the tap).
 */
export function VoiceRecorder({
  defaultMessages = [],
  onSend,
  onCancel,
  maxDuration = 60,
  sentMeta = "Just now",
  source = "simulated",
  onError,
  label = "Voice messages",
  className,
}: VoiceRecorderProps) {
  const [messages, setMessages] = React.useState<VoiceMessage[]>(defaultMessages)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [leaving, setLeaving] = React.useState(false)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [secs, setSecs] = React.useState(0)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState("")
  const [playingId, setPlayingId] = React.useState<string | null>(null)
  const statusId = React.useId()

  const threadRef = React.useRef<HTMLOListElement>(null)
  const capsuleRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const timerRef = React.useRef<HTMLSpanElement>(null)
  const actionRef = React.useRef<HTMLButtonElement>(null)
  const draftPlayed = React.useRef<HTMLSpanElement>(null)

  const micRef = React.useRef<Mic | null>(null)
  const rec = React.useRef({ elapsed: 0, peaks: [] as number[] })
  const urls = React.useRef(new Set<string>())
  const timers = React.useRef<number[]>([])
  const mounted = React.useRef(true)
  const latest = React.useRef({ source, maxDuration, onSend, onCancel, onError, sentMeta, phase, draft })
  const bubbleEls = React.useRef(new Map<string, HTMLElement>())
  const flipRef = React.useRef<{ id: string; rect: DOMRect } | null>(null)

  React.useLayoutEffect(() => {
    latest.current = { source, maxDuration, onSend, onCancel, onError, sentMeta, phase, draft }
  })

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }

  /* ----------------------------- Playback ----------------------------- */
  const nodes = React.useRef(new Map<string, Playable>())
  const positions = React.useRef(new Map<string, number>())
  const active = React.useRef<{ id: string; audio?: HTMLAudioElement } | null>(null)

  const paint = React.useCallback((id: string) => {
    const n = nodes.current.get(id)
    if (!n) return
    const pos = positions.current.get(id) ?? 0
    const p = clamp01(pos / Math.max(0.1, n.dur))
    if (n.played) n.played.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`
    if (n.time) {
      const text = fmt(pos > 0.05 ? pos : n.dur)
      if (n.time.textContent !== text) n.time.textContent = text
    }
  }, [])

  const stopActive = React.useCallback((reset: boolean) => {
    const a = active.current
    if (!a) return
    a.audio?.pause()
    active.current = null
    if (reset) {
      positions.current.set(a.id, 0)
      paint(a.id)
    }
    setPlayingId(null)
  }, [paint])

  const engine = React.useMemo<Engine>(
    () => ({
      register: (id, n) => {
        if (n) {
          nodes.current.set(id, n)
          paint(id)
        } else nodes.current.delete(id)
      },
      toggle: (id, url) => {
        if (active.current?.id === id) {
          stopActive(false)
          return
        }
        stopActive(false)
        const n = nodes.current.get(id)
        let pos = positions.current.get(id) ?? 0
        if (n && pos >= n.dur - 0.05) pos = 0
        positions.current.set(id, pos)
        let audio: HTMLAudioElement | undefined
        if (url) {
          audio = new Audio(url)
          audio.currentTime = pos
          audio.play().catch(() => {
            if (active.current?.id === id) active.current.audio = undefined
          })
        }
        active.current = { id, audio }
        setPlayingId(id)
      },
      seek: (id, f, dur) => {
        const t = clamp01(f) * dur
        positions.current.set(id, t)
        const a = active.current
        if (a?.id === id && a.audio) a.audio.currentTime = t
        paint(id)
      },
      nudge: (id, s, dur) => {
        const t = Math.max(0, Math.min(dur, (positions.current.get(id) ?? 0) + s))
        positions.current.set(id, t)
        const a = active.current
        if (a?.id === id && a.audio) a.audio.currentTime = t
        paint(id)
      },
    }),
    [paint, stopActive],
  )

  React.useEffect(() => {
    if (!playingId) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      const a = active.current
      if (!a) return
      const n = nodes.current.get(a.id)
      const dur = n?.dur ?? 1
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      let pos = positions.current.get(a.id) ?? 0
      if (a.audio && !a.audio.paused && a.audio.readyState > 1) pos = a.audio.currentTime
      else pos += dt
      positions.current.set(a.id, pos)
      paint(a.id)
      if (pos >= dur - 0.02 || a.audio?.ended) {
        stopActive(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }, [playingId, paint, stopActive])

  /* ----------------------------- Recording ---------------------------- */
  const cleanupMic = React.useCallback(() => {
    const m = micRef.current
    micRef.current = null
    if (!m) return
    m.stream.getTracks().forEach((t) => t.stop())
    m.ctx.close().catch(() => {})
  }, [])

  const toReview = React.useCallback((d: Draft) => {
    setDraft(d)
    setPhase("review")
    setStatus(`Recording stopped, ${fmt(d.duration)}. Review it, then send or discard.`)
  }, [])

  const stopRecording = React.useCallback(() => {
    const L = latest.current
    if (L.phase !== "recording") return
    const duration = Math.max(1, Math.round(rec.current.elapsed))
    const n = Math.max(24, Math.min(120, duration * 6))
    const peaks = resample(rec.current.peaks, n)
    const mic = micRef.current
    if (mic) {
      mic.rec.onstop = () => {
        const blob = new Blob(mic.chunks, { type: mic.rec.mimeType || "audio/webm" })
        const url = URL.createObjectURL(blob)
        urls.current.add(url)
        cleanupMic()
        if (mounted.current) toReview({ duration, peaks, audioUrl: url })
      }
      try { mic.rec.stop() } catch { cleanupMic(); toReview({ duration, peaks }) }
    } else toReview({ duration, peaks })
  }, [cleanupMic, toReview])
  const stopRef = React.useRef(stopRecording)
  React.useLayoutEffect(() => {
    stopRef.current = stopRecording
  })

  const startRecording = async () => {
    setNotice(null)
    stopActive(true)
    if (source === "microphone") {
      const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined
      if (!md?.getUserMedia || typeof MediaRecorder === "undefined") {
        const err: VoiceRecorderError = { code: "unsupported", message: "This browser cannot record audio. Use a current Chrome, Safari or Firefox." }
        setNotice(err.message)
        onError?.(err)
        return
      }
      setPhase("requesting")
      setStatus("Waiting for microphone permission")
      let stream: MediaStream
      try {
        stream = await md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      } catch (e) {
        if (!mounted.current) return
        const err = micError(e)
        setPhase("idle")
        setNotice(err.message)
        setStatus(err.message)
        onError?.(err)
        return
      }
      if (!mounted.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AC()
        const an = ctx.createAnalyser()
        an.fftSize = 1024
        ctx.createMediaStreamSource(stream).connect(an)
        const types = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"]
        const mime = types.find((t) => MediaRecorder.isTypeSupported?.(t))
        const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        const chunks: Blob[] = []
        recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data)
        recorder.start(250)
        micRef.current = { stream, ctx, an, rec: recorder, chunks, buf: new Uint8Array(an.fftSize) }
      } catch {
        stream.getTracks().forEach((t) => t.stop())
        const err: VoiceRecorderError = { code: "failed", message: "The microphone could not be started. Try again." }
        setPhase("idle")
        setNotice(err.message)
        onError?.(err)
        return
      }
    }
    rec.current = { elapsed: 0, peaks: [] }
    setSecs(0)
    setLeaving(false)
    setPhase("recording")
    setStatus("Recording started")
  }

  /* The live waveform: one canvas, painted each frame only while recording. */
  React.useEffect(() => {
    if (phase !== "recording") return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const timerEl = timerRef.current
    const color = getComputedStyle(canvas).color
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let w = 0
    let h = 0
    const fit = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    const levels: number[] = []
    const mic = micRef.current
    const start = performance.now()
    let lastCol = start
    let colMax = 0
    let peakMax = 0
    let lastPeak = start
    let shownSec = -1
    let shownTenth = -1
    let raf = 0
    const level = (now: number) => {
      if (mic) {
        mic.an.getByteTimeDomainData(mic.buf)
        let sum = 0
        for (let i = 0; i < mic.buf.length; i++) {
          const v = (mic.buf[i] - 128) / 128
          sum += v * v
        }
        return clamp01(Math.sqrt(sum / mic.buf.length) * 3.2)
      }
      return simLevel((now - start) / 1000)
    }
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000
      rec.current.elapsed = elapsed
      const l = level(now)
      colMax = Math.max(colMax, l)
      peakMax = Math.max(peakMax, l)
      while (now - lastCol >= COL_MS) {
        levels.push(colMax)
        colMax = 0
        lastCol += COL_MS
        if (levels.length > 400) levels.shift()
      }
      if (now - lastPeak >= 100) {
        rec.current.peaks.push(peakMax)
        peakMax = 0
        lastPeak += 100
      }
      const sub = ((now - lastCol) / COL_MS) * PITCH
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = color
      const cols = Math.ceil(w / PITCH) + 1
      for (let i = 0; i < cols; i++) {
        const idx = levels.length - 1 - i
        const v = idx >= 0 ? levels[idx] : 0
        const x = w - (i + 1) * PITCH - sub + PITCH
        const bh = Math.max(2, v * (h - 4))
        ctx.globalAlpha = v > 0.02 ? 1 : 0.4
        ctx.beginPath()
        ctx.roundRect(x, (h - bh) / 2, 2, bh, 1)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      const tenth = Math.floor(elapsed * 10)
      if (timerEl && tenth !== shownTenth) {
        shownTenth = tenth
        timerEl.textContent = `${fmt(elapsed)}.${tenth % 10}`
      }
      const s = Math.floor(elapsed)
      if (s !== shownSec) {
        shownSec = s
        setSecs(s)
      }
      if (elapsed >= latest.current.maxDuration) {
        stopRef.current()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      ro.disconnect()
    }
  }, [phase])

  /* ------------------------ Discard / send / keys ---------------------- */
  const discard = () => {
    const L = latest.current
    if (L.phase !== "recording" && L.phase !== "review") return
    const mic = micRef.current
    if (mic) {
      mic.rec.onstop = null
      try { mic.rec.stop() } catch { /* already stopped */ }
      cleanupMic()
    }
    if (L.draft?.audioUrl) {
      URL.revokeObjectURL(L.draft.audioUrl)
      urls.current.delete(L.draft.audioUrl)
    }
    if (active.current?.id === "draft") stopActive(true)
    positions.current.delete("draft")
    setDraft(null)
    setPhase("idle")
    setLeaving(true)
    later(() => setLeaving(false), 320)
    setStatus("Voice note discarded")
    L.onCancel?.()
    actionRef.current?.focus({ preventScroll: true })
  }

  const send = () => {
    const d = latest.current.draft
    if (!d) return
    if (active.current?.id === "draft") stopActive(true)
    positions.current.delete("draft")
    const rect = capsuleRef.current?.getBoundingClientRect()
    const msg: VoiceMessage = { id: `me-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, duration: d.duration, peaks: d.peaks, meta: latest.current.sentMeta, audioUrl: d.audioUrl }
    flipRef.current = rect ? { id: msg.id, rect } : null
    setMessages((m) => [...m, msg])
    setDraft(null)
    setLeaving(false)
    setPhase("idle")
    setStatus("Voice note sent")
    latest.current.onSend?.(msg)
  }

  const onAction = () => {
    if (phase === "idle") void startRecording()
    else if (phase === "recording") stopRecording()
    else if (phase === "review") send()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && (phase === "recording" || phase === "review")) {
      e.preventDefault()
      e.stopPropagation()
      discard()
    }
  }

  /* The sent take morphs from the review bar into its bubble (FLIP), then the thread settles at the bottom. */
  const flip = React.useCallback((id: string, el: HTMLElement | null) => {
    if (el) bubbleEls.current.set(id, el)
    else bubbleEls.current.delete(id)
  }, [])
  React.useLayoutEffect(() => {
    const th = threadRef.current
    if (th) th.scrollTop = th.scrollHeight
    const f = flipRef.current
    flipRef.current = null
    if (!f) return
    const el = bubbleEls.current.get(f.id)
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const to = el.getBoundingClientRect()
    if (!to.width || !to.height) return
    const dx = f.rect.left + f.rect.width - (to.left + to.width)
    const dy = f.rect.top - to.top
    const sx = f.rect.width / to.width
    const sy = f.rect.height / to.height
    el.style.transformOrigin = "100% 0"
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, backgroundColor: getComputedStyle(capsuleRef.current ?? el).backgroundColor },
        { transform: "none" },
      ],
      { duration: 560, easing: "cubic-bezier(.22, 1, .36, 1)" },
    )
    el.firstElementChild?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 560, easing: "ease-out" })
    el.closest("li")?.setAttribute("data-flip", "")
  }, [messages.length])

  /* Cleanup everything on unmount. */
  React.useEffect(() => {
    mounted.current = true
    const ts = timers.current
    const us = urls.current
    return () => {
      mounted.current = false
      ts.forEach((t) => window.clearTimeout(t))
      active.current?.audio?.pause()
      active.current = null
      const m = micRef.current
      micRef.current = null
      if (m) {
        m.rec.onstop = null
        try { m.rec.stop() } catch { /* ignore */ }
        m.stream.getTracks().forEach((t) => t.stop())
        m.ctx.close().catch(() => {})
      }
      us.forEach((u) => URL.revokeObjectURL(u))
      us.clear()
    }
  }, [])

  const draftDur = draft?.duration ?? 0
  const live = phase !== "idle" && phase !== "requesting"
  const showCapsule = live || leaving
  const hint =
    notice ??
    (phase === "requesting"
      ? "Waiting for microphone permission…"
      : source === "microphone"
        ? "Tap the mic to record with your microphone"
        : "Tap the mic to record a voice note")

  const actionLabel =
    phase === "recording" ? `Stop recording at ${fmt(secs)}` : phase === "review" ? "Send voice note" : phase === "requesting" ? "Waiting for microphone permission" : "Record voice note"

  return (
    <section className={cn("vrc", className)} aria-label={label} onKeyDown={onKeyDown}>
      <style href="vrc" precedence="default">{CSS}</style>
      <ol ref={threadRef} className="vrc-thread" aria-label="Messages">
        {messages.map((m) => (
          <Message key={m.id} m={m} playing={playingId === m.id} engine={engine} flip={flip} />
        ))}
      </ol>

      <div className="vrc-composer" data-phase={phase}>
        <div className="vrc-left">
          <span className="vrc-hint" data-hide={showCapsule ? "" : undefined} data-error={notice ? "" : undefined} role={notice ? "alert" : undefined}>
            <span>{hint}</span>
          </span>
          {showCapsule ? (
            <>
              <button type="button" className="vrc-discard" data-leaving={leaving ? "" : undefined} aria-label="Discard voice note" onClick={discard}>
                <Trash2 aria-hidden />
              </button>
              <div ref={capsuleRef} className="vrc-capsule" data-phase={leaving ? "recording" : phase} data-enter={leaving ? undefined : ""} data-leaving={leaving ? "" : undefined}>
                <div className="vrc-row vrc-row-rec" aria-hidden="true">
                  <span className="vrc-dot" />
                  <span ref={timerRef} className="vrc-timer">0:00.0</span>
                  <canvas ref={canvasRef} className="vrc-live" />
                </div>
                <div className="vrc-row vrc-row-review">
                  {draft ? (
                    <>
                      <button
                        type="button"
                        className="vrc-round"
                        data-playing={playingId === "draft" ? "" : undefined}
                        aria-label={playingId === "draft" ? "Pause preview" : "Play preview"}
                        onClick={() => engine.toggle("draft", draft.audioUrl)}
                      >
                        <span data-ico="play"><Play aria-hidden /></span>
                        <span data-ico="pause"><Pause aria-hidden /></span>
                      </button>
                      <DraftWave draft={draft} engine={engine} playedRef={draftPlayed} />
                      <span className="vrc-time" aria-hidden="true">{fmt(draftDur)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <button ref={actionRef} type="button" className="vrc-action" aria-label={actionLabel} aria-describedby={statusId} aria-disabled={phase === "requesting" || undefined} onClick={onAction}>
          <span className="vrc-ico" data-ico="mic" data-on={phase === "idle" || phase === "requesting" ? "" : undefined}><Mic aria-hidden /></span>
          <span className="vrc-ico" data-ico="stop" data-on={phase === "recording" ? "" : undefined}><Square data-stop aria-hidden /></span>
          <span className="vrc-ico" data-ico="send" data-on={phase === "review" ? "" : undefined}><ArrowUp data-send aria-hidden /></span>
        </button>
      </div>
      <p id={statusId} className="vrc-sr" aria-live="polite">{status}</p>
    </section>
  )
}

/** The review waveform: plays the draft and registers its own playhead, like any bubble. */
function DraftWave({ draft, engine, playedRef }: { draft: Draft; engine: Engine; playedRef: React.RefObject<HTMLSpanElement | null> }) {
  React.useLayoutEffect(() => {
    engine.register("draft", { played: playedRef.current, time: null, dur: draft.duration })
    return () => engine.register("draft", null)
  }, [engine, draft.duration, playedRef])
  return (
    <Wave
      peaks={draft.peaks}
      duration={draft.duration}
      slider
      label="Preview position"
      playedRef={playedRef}
      onSeek={(f) => engine.seek("draft", f, draft.duration)}
      onNudge={(s) => engine.nudge("draft", s, draft.duration)}
    />
  )
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OtpStatus = "idle" | "verifying" | "error" | "success"

export type OtpInputProps = {
  /** Number of boxes. */
  length?: number
  /** A small dash between the boxes: `true` puts it in the middle, a number after that many boxes. */
  separator?: boolean | number
  /** Digits only (with the numeric keyboard on phones). `false` allows letters too, shown in capitals. */
  numeric?: boolean
  /** The code. Makes the field controlled. */
  value?: string
  /** Starting code when uncontrolled. */
  defaultValue?: string
  /** Every change: typing, Backspace, paste, autofill and the clearing after an error. */
  onChange?: (code: string) => void
  /** Called once the last box is filled by the user: the place to start verifying. */
  onComplete?: (code: string) => void
  /** Verifying shimmers and locks the field, error shakes and shows the message, success morphs into a chip. */
  status?: OtpStatus
  /** Shown below the boxes after an error, until the user types again. */
  errorMessage?: React.ReactNode
  /** Clears the boxes shortly after the shake, ready for the next try. */
  clearOnError?: boolean
  /** Text in the chip on success. */
  successLabel?: string
  /** Shows "Didn't get a code?" below the boxes with a countdown that becomes a Resend button. */
  onResend?: () => void
  /** Seconds until the code can be resent. */
  resendIn?: number
  /** Where the boxes and the lines below them sit. */
  align?: "start" | "center"
  /** Dims the field and ignores input. */
  disabled?: boolean
  /** Focus the field on mount (without scrolling). */
  autoFocus?: boolean
  /** Accessible name; the number of digits is added. */
  label?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.otp {
  --otp-ink: #000;
  --otp-surface: #fff;
  --otp-accent: #0060e2;
  --otp-danger: #d92d3a;
  --otp-ok: #14804a;
  --otp-t1: color-mix(in oklab, var(--otp-ink) 88%, transparent);
  --otp-t2: color-mix(in oklab, var(--otp-ink) 61%, transparent);
  --otp-t3: color-mix(in oklab, var(--otp-ink) 45%, transparent);
  --otp-t4: color-mix(in oklab, var(--otp-ink) 27%, transparent);
  --otp-fill: color-mix(in oklab, var(--otp-ink) 6%, transparent);
  --otp-line: color-mix(in oklab, var(--otp-ink) 6%, transparent);
  --otp-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --otp-glint: rgb(255 255 255 / .8);
  --otp-ease: cubic-bezier(.22, 1, .36, 1);
  --otp-gap: 8px;
  --otp-box: min(40px, calc((100cqw - var(--otp-gaps)) / var(--otp-n)));
  --otp-step: calc(var(--otp-box) + var(--otp-gap));
  --otp-w: calc(var(--otp-n) * var(--otp-box) + var(--otp-gaps));
  --otp-chip-w: 116px;
  position: relative;
  container-type: inline-size;
  width: 100%;
  color: var(--otp-t1);
  font-family: var(--otp-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .otp {
  --otp-ink: #fff;
  --otp-surface: #1c1c1e;
  --otp-accent: #4d8dff;
  --otp-danger: #ff6369;
  --otp-ok: #4cc38a;
  --otp-t1: color-mix(in oklab, var(--otp-ink) 90%, transparent);
  --otp-t2: color-mix(in oklab, var(--otp-ink) 62%, transparent);
  --otp-t3: color-mix(in oklab, var(--otp-ink) 46%, transparent);
  --otp-t4: color-mix(in oklab, var(--otp-ink) 28%, transparent);
  --otp-fill: color-mix(in oklab, var(--otp-ink) 8%, transparent);
  --otp-line: color-mix(in oklab, var(--otp-ink) 8%, transparent);
  --otp-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --otp-glint: rgb(255 255 255 / .12);
}
.otp *, .otp *::before, .otp *::after { box-sizing: border-box }
:where(.otp) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.otp :focus-visible { outline: 2px solid color-mix(in oklab, var(--otp-accent) 60%, transparent); outline-offset: 1px }
.otp[data-disabled] { opacity: .5; pointer-events: none }

/* Field: boxes are decoration, one real input on top carries the code */
.otp-field { position: relative; width: var(--otp-w); max-width: 100%; padding: 3px 0 }
.otp[data-align="center"] .otp-field { margin-inline: auto }
.otp-slots { position: relative; display: flex; align-items: center; gap: var(--otp-gap) }
.otp[data-status="error"] .otp-slots { animation: otp-shake .5s var(--otp-ease) backwards }
.otp-box {
  position: relative; display: grid; place-items: center; flex: none; width: var(--otp-box); height: 44px; border-radius: 8px;
  background: var(--otp-surface); box-shadow: var(--otp-shadow);
  font-size: 15px; font-weight: 500; line-height: 24px; font-variant-numeric: tabular-nums; color: var(--otp-t1);
  transition: background-color .25s, color .25s, transform .5s var(--otp-ease), opacity .3s;
}
.otp-sep { flex: none; width: 8px; height: 1px; border-radius: 1px; background: var(--otp-t4) }
.otp-digit { display: block; transition: opacity .3s, filter .3s }
.otp-digit[data-in] { animation: otp-pop .26s var(--otp-ease) backwards }
.otp[data-fade] .otp-digit { opacity: 0; filter: blur(3px) }
.otp-caret { position: absolute; width: 1.5px; height: 18px; border-radius: 1px; background: var(--otp-accent); animation: otp-blink 1.1s ease-in-out infinite }

/* The focus ring is one element that glides from box to box */
.otp-ring {
  position: absolute; top: 3px; left: 0; width: var(--otp-box); height: 44px; border-radius: 8px; pointer-events: none; opacity: 0;
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--otp-accent) 76.5%, transparent), 0 0 0 2px color-mix(in oklab, var(--otp-accent) 35%, transparent);
  transform: translateX(calc(var(--i, 0) * var(--otp-step) + var(--sh, 0px)));
  transition: transform .2s var(--otp-ease), opacity .16s;
}
.otp-field[data-focus] .otp-ring { opacity: 1 }
.otp[data-status="verifying"] .otp-ring, .otp[data-status="success"] .otp-ring { opacity: 0 }
.otp[data-status="error"] .otp-ring { box-shadow: 0 0 0 .5px var(--otp-danger), 0 0 0 2px color-mix(in oklab, var(--otp-danger) 30%, transparent) }

.otp-input {
  position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 8px; outline: 0;
  background: transparent; color: transparent; caret-color: transparent; font-size: 16px; opacity: 0; cursor: text;
}
.otp-input::selection { background: transparent }
.otp-input:disabled { cursor: default }

/* Verifying: gray digits and a lighter band passing over the boxes */
.otp[data-status="verifying"] .otp-box { color: var(--otp-t3) }
.otp[data-status="verifying"] .otp-box::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(100deg, transparent 30%, var(--otp-glint) 50%, transparent 70%) 100% 0 / 300% 100%;
  animation: otp-band 1.3s linear infinite; animation-delay: calc(var(--i) * 90ms);
}

/* Error: a faint red fill and red digits */
.otp[data-status="error"] .otp-box { background: color-mix(in oklab, var(--otp-danger) 7%, var(--otp-surface)); color: var(--otp-danger) }

/* Success: the boxes slide together while one frame morphs into a chip */
.otp-frame {
  position: absolute; top: 3px; left: 0; z-index: 1; display: grid; place-items: center; width: var(--otp-w); max-width: 100%; height: 44px;
  border-radius: 8px; background: transparent; pointer-events: none; opacity: 0; overflow: hidden;
  transition: width .5s var(--otp-ease), background-color .35s, box-shadow .35s;
}
.otp[data-align="center"] .otp-frame { left: 50%; translate: -50% 0 }
.otp[data-status="success"] .otp-frame {
  opacity: 1; width: var(--otp-chip-w);
  background: color-mix(in oklab, var(--otp-ok) 11%, var(--otp-surface));
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--otp-ok) 28%, transparent);
}
.otp[data-status="success"] .otp-box {
  --target: calc(var(--otp-chip-w) / 2);
  transform: translateX(calc(var(--target) - (var(--i) * var(--otp-step) + var(--sh, 0px) + var(--otp-box) / 2)));
  opacity: 0; box-shadow: none; background: transparent; pointer-events: none;
  transition: transform .5s var(--otp-ease), opacity .28s .08s, box-shadow .2s, background-color .2s;
}
.otp[data-status="success"][data-align="center"] .otp-box { --target: calc(var(--otp-w) / 2) }
.otp[data-status="success"] .otp-sep { opacity: 0; transition: opacity .2s }
.otp-done { display: inline-flex; align-items: center; gap: 6px; color: var(--otp-ok); font-size: 13px; font-weight: 500; white-space: nowrap }
.otp[data-status="success"] .otp-done { animation: otp-in .4s var(--otp-ease) .2s backwards }
.otp-done svg { width: 16px; height: 16px }
.otp-done path { stroke-dasharray: 12; animation: otp-draw .36s var(--otp-ease) .38s backwards }

/* Message under the boxes grows in */
.otp-msg { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s var(--otp-ease) }
.otp-msg[data-show] { grid-template-rows: 1fr }
.otp-msg > div { min-height: 0; overflow: hidden }
.otp-msg p {
  margin: 0; padding: 8px 0 0; font-size: 12px; line-height: 16px; color: var(--otp-danger); opacity: 0; transform: translateY(-3px);
  transition: opacity .25s, transform .3s var(--otp-ease);
}
.otp-msg[data-show] p { opacity: 1; transform: none }
.otp[data-align="center"] .otp-msg p, .otp[data-align="center"] .otp-resend { text-align: center; justify-content: center }

/* Resend */
.otp-resend { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; min-height: 28px; margin-top: 10px; font-size: 12px; line-height: 16px; color: var(--otp-t3) }
.otp-wait { color: var(--otp-t2); animation: otp-in .3s var(--otp-ease) backwards }
.otp-time { color: var(--otp-t1); font-variant-numeric: tabular-nums }
.otp .otp-again {
  height: 24px; padding: 0 8px; border-radius: 6px; font-size: 12px; font-weight: 500; line-height: 16px; color: var(--otp-t1);
  box-shadow: inset 0 0 0 .5px var(--otp-line); transition: background-color .12s; animation: otp-in .3s var(--otp-ease) backwards;
}
.otp .otp-again:hover { background: var(--otp-fill) }
.otp-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

@keyframes otp-pop { from { opacity: 0; filter: blur(4px); transform: scale(.82) } }
@keyframes otp-blink { 0%, 45% { opacity: 1 } 55%, 100% { opacity: .15 } }
@keyframes otp-shake { 0%, 100% { transform: none } 15% { transform: translateX(-5px) } 35% { transform: translateX(4px) } 55% { transform: translateX(-3px) } 75% { transform: translateX(2px) } }
@keyframes otp-band { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes otp-in { from { opacity: 0; filter: blur(3px); transform: translateY(3px) } }
@keyframes otp-draw { from { stroke-dashoffset: 12 } }

@media (prefers-reduced-motion: reduce) {
  .otp *, .otp *::before, .otp *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   OtpInput                                 */
/* -------------------------------------------------------------------------- */

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

export function OtpInput({
  length = 6,
  separator = false,
  numeric = true,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  status = "idle",
  errorMessage = "That code didn't work. Try again.",
  clearOnError = true,
  successLabel = "Verified",
  onResend,
  resendIn = 30,
  align = "start",
  disabled = false,
  autoFocus = false,
  label = "Verification code",
  className,
}: OtpInputProps) {
  const uid = React.useId()
  const clean = React.useCallback(
    (s: string) => (numeric ? s.replace(/\D/g, "") : s.replace(/[^a-z0-9]/gi, "").toUpperCase()),
    [numeric],
  )

  const controlled = value !== undefined
  const [inner, setInner] = React.useState(() => clean(defaultValue).slice(0, length))
  const code = (controlled ? clean(value) : inner).slice(0, length)
  const [active, setActive] = React.useState(() => Math.min(code.length, length - 1))
  const [focused, setFocused] = React.useState(false)
  const [burst, setBurst] = React.useState<number | null>(null)

  const input = React.useRef<HTMLInputElement>(null)
  const field = React.useRef<HTMLDivElement>(null)
  const locked = disabled || status === "verifying" || status === "success"
  const lastIndex = length - 1
  const at = Math.min(active, code.length, lastIndex)

  // Separator position (after this many boxes), or none.
  const sepAfter = separator === true ? Math.floor(length / 2) : typeof separator === "number" ? separator : 0
  const hasSep = sepAfter > 0 && sepAfter < length

  /* ----- state adjusted during render when the status changes ----- */
  const [prevStatus, setPrevStatus] = React.useState(status)
  const [fade, setFade] = React.useState(false)
  const [shownMsg, setShownMsg] = React.useState<React.ReactNode>(null)
  if (status !== prevStatus) {
    setPrevStatus(status)
    setFade(false)
    if (status === "error") setShownMsg(errorMessage)
  }

  /* ----- commit a new code ----- */
  const commit = (next: string, nextActive: number, burstFrom: number | null = null) => {
    setActive(nextActive)
    setBurst(burstFrom)
    if (next === code) return
    if (!controlled) setInner(next)
    onChange?.(next)
    if (next.length === length) onComplete?.(next)
  }
  const commitRef = React.useRef(commit)
  React.useEffect(() => {
    commitRef.current = commit
  })

  // Keep the real input's selection on the active box so typing replaces it.
  React.useLayoutEffect(() => {
    const el = input.current
    if (!el || document.activeElement !== el) return
    el.setSelectionRange(at, at < code.length ? at + 1 : at)
  })

  React.useEffect(() => {
    if (autoFocus) input.current?.focus({ preventScroll: true })
  }, [autoFocus])

  // After an error: let the shake play, fade the digits, then clear for the next try.
  React.useEffect(() => {
    if (status !== "error" || !clearOnError) return
    const a = window.setTimeout(() => setFade(true), 480)
    const b = window.setTimeout(() => {
      commitRef.current("", 0)
      setFade(false)
      input.current?.focus({ preventScroll: true })
    }, 820)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
    }
  }, [status, clearOnError])

  /* ----- resend countdown ----- */
  const [left, setLeft] = React.useState(resendIn)
  const [cycle, setCycle] = React.useState(0)
  const [sent, setSent] = React.useState(false)
  const running = left > 0
  const hasResend = !!onResend
  React.useEffect(() => {
    if (!running || !hasResend) return
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => window.clearInterval(id)
  }, [running, cycle, hasResend])

  /* ----- keyboard ----- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (locked || e.nativeEvent.isComposing) return
    const k = e.key
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (k === "Backspace" || k === "Delete") {
      e.preventDefault()
      const i = k === "Backspace" && at >= code.length ? code.length - 1 : at
      if (i < 0 || i >= code.length) return
      commit(code.slice(0, i) + code.slice(i + 1), i)
    } else if (k === "ArrowLeft") {
      e.preventDefault()
      setActive(Math.max(0, at - 1))
    } else if (k === "ArrowRight") {
      e.preventDefault()
      setActive(Math.min(code.length, lastIndex, at + 1))
    } else if (k === "Home") {
      e.preventDefault()
      setActive(0)
    } else if (k === "End") {
      e.preventDefault()
      setActive(Math.min(code.length, lastIndex))
    } else if (k.length === 1) {
      // A printable key: accept it into the active box, swallow it if it isn't allowed.
      e.preventDefault()
      const ch = clean(k)
      if (!ch) return
      const next = at < code.length ? code.slice(0, at) + ch + code.slice(at + 1) : code + ch
      commit(next, Math.min(at + 1, lastIndex))
    }
  }

  // Paste, autofill and mobile keyboards arrive as input events: diff the old and new value.
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return
    const raw = e.target.value
    let p = 0
    while (p < raw.length && p < code.length && raw[p] === code[p]) p++
    let q = 0
    while (q < raw.length - p && q < code.length - p && raw[raw.length - 1 - q] === code[code.length - 1 - q]) q++
    const typed = clean(raw.slice(p, raw.length - q))
    const next = (code.slice(0, p) + typed + code.slice(code.length - q)).slice(0, length)
    commit(next, Math.min(p + typed.length, lastIndex, next.length), typed.length > 1 ? p : null)
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (locked) return
    e.preventDefault()
    const text = clean(e.clipboardData.getData("text"))
    if (!text) return
    const from = text.length >= length ? 0 : at
    const next = (code.slice(0, from) + text + code.slice(from + text.length)).slice(0, length)
    commit(next, Math.min(next.length, lastIndex), text.length > 1 ? from : null)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (locked) return
    e.preventDefault()
    const boxes = field.current?.querySelectorAll<HTMLElement>(".otp-box")
    let idx = 0
    let best = Infinity
    boxes?.forEach((b, i) => {
      const r = b.getBoundingClientRect()
      const d = e.clientX < r.left ? r.left - e.clientX : e.clientX > r.right ? e.clientX - r.right : 0
      if (d < best) {
        best = d
        idx = i
      }
    })
    setActive(Math.min(idx, code.length, lastIndex))
    input.current?.focus({ preventScroll: true })
  }

  /* ----- derived ----- */
  const msgId = `${uid}-msg`
  const live =
    status === "verifying"
      ? "Verifying code"
      : status === "success"
        ? successLabel
        : status === "error" && typeof errorMessage === "string"
          ? errorMessage
          : sent
            ? "New code sent"
            : ""
  const shift = (i: number) => (hasSep && i >= sepAfter ? "24px" : "0px")
  const gaps = (length - 1) * 8 + (hasSep ? 24 : 0)
  const rootStyle = { "--otp-n": length, "--otp-gaps": `${gaps}px` } as React.CSSProperties
  const ringStyle = { "--i": at, "--sh": shift(at) } as React.CSSProperties
  const msg = status === "error" ? errorMessage : shownMsg

  const boxes: React.ReactNode[] = []
  for (let i = 0; i < length; i++) {
    if (hasSep && i === sepAfter) boxes.push(<span key="sep" className="otp-sep" aria-hidden />)
    const ch = code[i]
    const stagger = burst !== null && i >= burst ? (i - burst) * 45 : 0
    boxes.push(
      <span key={`b${i}`} className="otp-box" style={{ "--i": i, "--sh": shift(i) } as React.CSSProperties} aria-hidden>
        {ch ? (
          <span
            key={`${i}-${ch}`}
            className="otp-digit"
            data-in=""
            style={stagger ? { animationDelay: `${stagger}ms` } : undefined}
          >
            {ch}
          </span>
        ) : (
          focused && at === i && status === "idle" && <span className="otp-caret" />
        )}
      </span>,
    )
  }

  return (
    <div
      className={cn("otp", className)}
      style={rootStyle}
      data-status={status}
      data-align={align}
      data-disabled={disabled || undefined}
      data-fade={(fade && status === "error") || undefined}
    >
      <style href="otp-input" precedence="default">
        {CSS}
      </style>

      <div ref={field} className="otp-field" data-focus={(focused && !locked) || undefined} onPointerDown={onPointerDown}>
        <div className="otp-slots">{boxes}</div>
        <span className="otp-ring" style={ringStyle} aria-hidden />
        <span className="otp-frame" aria-hidden>
          <span className="otp-done">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity=".16" />
              <path d="m5.1 8.2 2 2 3.8-4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {successLabel}
          </span>
        </span>
        <input
          ref={input}
          className="otp-input"
          type="text"
          value={code}
          inputMode={numeric ? "numeric" : "text"}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          pattern={numeric ? "[0-9]*" : undefined}
          disabled={disabled || status === "success"}
          readOnly={status === "verifying"}
          aria-label={`${label}, ${length} ${numeric ? "digits" : "characters"}`}
          aria-invalid={status === "error" || undefined}
          aria-describedby={status === "error" ? msgId : undefined}
          aria-busy={status === "verifying" || undefined}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>

      <div className="otp-msg" data-show={status === "error" || undefined}>
        <div>
          <p id={msgId}>{msg}</p>
        </div>
      </div>

      {onResend && status !== "success" && (
        <div className="otp-resend">
          <span>Didn't get a code?</span>
          {running ? (
            <span key="wait" className="otp-wait">
              Resend in <span className="otp-time">{fmt(left)}</span>
            </span>
          ) : (
            <button
              key="again"
              type="button"
              className="otp-again"
              onClick={() => {
                onResend()
                setSent(true)
                setLeft(resendIn)
                setCycle((c) => c + 1)
              }}
            >
              Resend
            </button>
          )}
        </div>
      )}

      <span className="otp-live" aria-live="polite" role="status">
        {live}
      </span>
    </div>
  )
}

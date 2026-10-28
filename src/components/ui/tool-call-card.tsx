"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ToolCallStatus = "running" | "success" | "error"

export type ToolCallCardProps = {
  /** Tool name as the agent calls it, shown in mono – e.g. "search_docs". */
  name?: string
  /** Blue spinner with a live timer, a solid blue check with the duration, or a red "Failed". */
  status?: ToolCallStatus
  /** Short human summary next to the name; truncates with an ellipsis. */
  summary?: React.ReactNode
  /** Icon on the left, drawn in the icon gray without a tile – a 16px stroke SVG fits best. */
  icon?: React.ReactNode
  /** Arguments – objects are pretty-printed and highlighted, JSON strings are parsed. Hidden when undefined. */
  args?: unknown
  /** What the tool returned – like `args`; other strings are plain text. While running without a result: "Waiting for result…". */
  result?: unknown
  /** Error message, shown in the body when status is "error". */
  error?: string
  /** Start time in ms since epoch – the live timer counts from here instead of from when the card turned running. */
  startedAt?: number
  /** Final duration in ms – otherwise the time measured while the card was running. */
  duration?: number
  /** Start expanded (uncontrolled). */
  defaultOpen?: boolean
  /** Expanded state (controlled). */
  open?: boolean
  /** Called when the header is toggled. */
  onOpenChange?: (open: boolean) => void
  /** Opens the card when the call fails and closes it on the next run, unless someone toggled it by hand (uncontrolled only). */
  openOnError?: boolean
  /** Shows a Retry button next to the error message. */
  onRetry?: () => void
  /** Height in px after which arguments and result are capped with a fade and a "Show all" toggle. */
  maxCodeHeight?: number
  className?: string
}

export type ToolCallGroupProps = {
  /** The cards – the group reads their icon, status and duration props for its header, so pass them as direct children. */
  children?: React.ReactNode
  /** Header label once nothing is running. Defaults to "Used N tools". */
  label?: string
  /** Shimmering header label while any card is running. */
  runningLabel?: string
  /** Total in ms – otherwise the sum of the cards' `duration` props, or the time measured while any card was running. */
  duration?: number
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.tcc, .tcc-group {
  --tcc-ink: #000;
  --tcc-surface: #fff;
  --tcc-accent: #0060e2;
  --tcc-danger: #d92d20;
  --tcc-t1: color-mix(in oklab, var(--tcc-ink) 88%, transparent);
  --tcc-t2: color-mix(in oklab, var(--tcc-ink) 61%, transparent);
  --tcc-t3: color-mix(in oklab, var(--tcc-ink) 45%, transparent);
  --tcc-t4: color-mix(in oklab, var(--tcc-ink) 27%, transparent);
  --tcc-icon: color-mix(in oklab, var(--tcc-ink) 44.7%, transparent);
  --tcc-fill: color-mix(in oklab, var(--tcc-ink) 4%, transparent);
  --tcc-line: color-mix(in oklab, var(--tcc-ink) 6%, transparent);
  --tcc-code: #fafafa;
  --tcc-str: rgb(0 123 172 / .9);
  --tcc-num: rgb(178 91 12);
  --tcc-lit: rgb(138 63 196);
  --tcc-glint: rgb(255 255 255 / .82);
  --tcc-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --tcc-ease: cubic-bezier(.22, 1, .36, 1);
  font-family: var(--tcc-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  color: var(--tcc-t1);
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .tcc, :is(.dark, [data-theme="dark"]) .tcc-group {
  --tcc-ink: #fff;
  --tcc-surface: #1c1c1e;
  --tcc-accent: #4d8dff;
  --tcc-danger: #ff6b60;
  --tcc-t1: color-mix(in oklab, var(--tcc-ink) 90%, transparent);
  --tcc-t2: color-mix(in oklab, var(--tcc-ink) 62%, transparent);
  --tcc-t3: color-mix(in oklab, var(--tcc-ink) 46%, transparent);
  --tcc-t4: color-mix(in oklab, var(--tcc-ink) 28%, transparent);
  --tcc-icon: color-mix(in oklab, var(--tcc-ink) 50%, transparent);
  --tcc-fill: color-mix(in oklab, var(--tcc-ink) 6%, transparent);
  --tcc-line: color-mix(in oklab, var(--tcc-ink) 8%, transparent);
  --tcc-code: color-mix(in oklab, #1c1c1e, #fff 4%);
  --tcc-str: rgb(94 194 232);
  --tcc-num: rgb(240 160 90);
  --tcc-lit: rgb(196 148 240);
  --tcc-glint: rgb(255 255 255 / .9);
  --tcc-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.tcc *, .tcc *::before, .tcc *::after, .tcc-group *, .tcc-group *::before, .tcc-group *::after { box-sizing: border-box }
:where(.tcc, .tcc-group) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.tcc :focus-visible, .tcc-group :focus-visible { outline: 2px solid color-mix(in oklab, var(--tcc-accent) 60%, transparent); outline-offset: 1px }
.tcc-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }

/* Card */
.tcc { position: relative; width: 100%; border-radius: 10px; background: var(--tcc-surface); box-shadow: var(--tcc-shadow) }
.tcc-head {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 44px; padding: 0 14px; border-radius: 10px;
  transition: background-color .16s, border-radius 0s linear .38s;
}
.tcc-head:hover { background: var(--tcc-fill) }
.tcc[data-open="true"] .tcc-head { border-radius: 10px 10px 0 0; transition: background-color .16s, border-radius 0s }
.tcc-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--tcc-icon) }
.tcc-icon svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round }
.tcc-main { display: flex; align-items: baseline; gap: 8px; flex: 1; min-width: 0 }
.tcc-name {
  flex: none; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12px; font-weight: 500; line-height: 20px; color: var(--tcc-ink);
}
.tcc-summary { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--tcc-t2) }
.tcc-status {
  display: flex; align-items: center; flex: none; gap: 6px; font-size: 12px; line-height: 16px; color: var(--tcc-t3);
  white-space: nowrap; font-variant-numeric: tabular-nums; animation: tcc-in .36s var(--tcc-ease) backwards;
}
.tcc[data-status="error"] .tcc-status { color: var(--tcc-danger); font-weight: 500 }
.tcc-status svg { width: 14px; height: 14px; flex: none }
.tcc-spinner circle { fill: none; stroke: var(--tcc-line); stroke-width: 1.6 }
.tcc-spinner path { fill: none; stroke: color-mix(in oklab, var(--tcc-accent) 76.5%, transparent); stroke-width: 1.6; stroke-linecap: round }
.tcc-spinner { animation: tcc-spin .8s linear infinite }
.tcc-ok { animation: tcc-pop .46s var(--tcc-ease) backwards }
.tcc-ok circle { fill: color-mix(in oklab, var(--tcc-accent) 76.5%, transparent) }
.tcc-ok path { fill: none; stroke: #fff; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; animation: tcc-draw .36s var(--tcc-ease) .16s backwards }
.tcc-fail { animation: tcc-pop .46s var(--tcc-ease) backwards }
.tcc-fail circle { fill: var(--tcc-danger) }
.tcc-fail path { fill: none; stroke: #fff; stroke-width: 1.5; stroke-linecap: round }
.tcc-chevron { flex: none; width: 12px; height: 12px; fill: none; stroke: var(--tcc-t1); stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; transition: transform .36s var(--tcc-ease), stroke .16s }
.tcc[data-open="true"] .tcc-chevron, .tcc-group[data-open="true"] > .tcc-group-head .tcc-chevron { transform: rotate(180deg) }
.tcc-head:hover .tcc-chevron, .tcc-group-head:hover .tcc-chevron { stroke: var(--tcc-ink) }

/* Body folds with grid-template-rows 0fr -> 1fr */
.tcc-body, .tcc-group-body {
  display: grid; grid-template-rows: 1fr;
  transition: grid-template-rows .38s var(--tcc-ease), opacity .24s, visibility 0s;
}
.tcc[data-open="false"] .tcc-body, .tcc-group[data-open="false"] > .tcc-group-body {
  grid-template-rows: 0fr; opacity: 0; visibility: hidden; transition: grid-template-rows .38s var(--tcc-ease), opacity .24s, visibility 0s .38s;
}
.tcc-clip { min-height: 0; overflow: hidden }
.tcc-sections { display: grid; gap: 14px; padding: 12px 14px 14px }
.tcc-section { display: grid; gap: 6px; min-width: 0 }
.tcc-section-head { display: flex; align-items: center; gap: 8px; min-height: 28px }
.tcc-label { font-size: 10px; font-weight: 500; line-height: 16px; letter-spacing: .5px; text-transform: uppercase; color: var(--tcc-t3) }
.tcc-copy {
  position: relative; display: grid; place-items: center; width: 28px; height: 28px; margin-left: auto; border-radius: 6px;
  background: var(--tcc-surface); box-shadow: var(--tcc-shadow); color: var(--tcc-icon); transition: background-color .16s, color .16s;
}
.tcc-copy:hover { color: var(--tcc-ink) }
.tcc-copy[data-copied] { color: var(--tcc-accent) }
.tcc-copy svg {
  position: absolute; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round;
  transition: opacity .2s, transform .32s var(--tcc-ease), filter .2s;
}
.tcc-copy .tcc-copy-done { opacity: 0; transform: scale(.6); filter: blur(2px) }
.tcc-copy[data-copied] .tcc-copy-icon { opacity: 0; transform: scale(.6); filter: blur(2px) }
.tcc-copy[data-copied] .tcc-copy-done { opacity: 1; transform: none; filter: none }

/* Code */
.tcc-code {
  position: relative; margin: 0; overflow: hidden; padding: 10px 12px; border-radius: 8px; background: var(--tcc-code);
  box-shadow: inset 0 0 0 .5px var(--tcc-line); color: var(--tcc-t3);
  font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 12px; line-height: 20px; white-space: pre-wrap; overflow-wrap: anywhere;
  transition: max-height .42s var(--tcc-ease);
}
.tcc-code code { font: inherit; animation: tcc-fade .24s backwards }
.tcc-code[data-plain] { color: var(--tcc-t2) }
.tcc-code[data-capped]::after {
  content: ""; position: absolute; left: .5px; right: .5px; bottom: .5px; height: 56px; pointer-events: none;
  background: linear-gradient(transparent, var(--tcc-code)); border-radius: 0 0 8px 8px; transition: opacity .24s;
}
.tcc-code[data-capped][data-expanded]::after { opacity: 0 }
.tcc-k { color: var(--tcc-t1) }
.tcc-s { color: var(--tcc-str) }
.tcc-n { color: var(--tcc-num) }
.tcc-b { color: var(--tcc-lit) }
.tcc .tcc-more {
  justify-self: start; margin-left: -4px; padding: 2px 4px; border-radius: 6px; font-size: 12px; font-weight: 500; line-height: 16px;
  color: var(--tcc-t2); transition: color .16s;
}
.tcc .tcc-more:hover { color: var(--tcc-ink) }
.tcc-wait { margin: 0; font-size: 12px; line-height: 16px; color: var(--tcc-t3) }

/* Error */
.tcc-error {
  display: flex; align-items: flex-start; gap: 10px; padding: 8px 8px 8px 12px; border-radius: 8px;
  background: color-mix(in oklab, var(--tcc-danger) 7%, transparent); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--tcc-danger) 18%, transparent);
  animation: tcc-fade .24s backwards;
}
.tcc-error p { flex: 1; min-width: 0; margin: 0; padding: 1px 0; font-size: 12px; line-height: 18px; color: var(--tcc-t1); overflow-wrap: anywhere }
.tcc .tcc-retry {
  display: inline-flex; align-items: center; flex: none; gap: 6px; height: 28px; padding: 0 10px; border-radius: 6px;
  background: var(--tcc-surface); box-shadow: var(--tcc-shadow); font-size: 12px; font-weight: 500; color: var(--tcc-t1);
  transition: background-color .16s, transform .16s var(--tcc-ease);
}
.tcc .tcc-retry:hover { background: color-mix(in oklab, var(--tcc-surface), var(--tcc-ink) 3%) }
.tcc .tcc-retry:active { transform: scale(.97) }
.tcc-retry svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round }

/* Group */
.tcc-group { position: relative; display: grid; width: 100% }
.tcc-group-head {
  display: flex; align-items: center; gap: 8px; justify-self: start; max-width: 100%; height: 32px; margin-left: -6px; padding: 4px 10px 4px 6px;
  border-radius: 8px; transition: background-color .16s, color .16s;
}
.tcc-group-head:hover { background: var(--tcc-fill) }
.tcc-stack { display: flex; flex: none; padding: .5px }
.tcc-tile {
  display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--tcc-surface); box-shadow: var(--tcc-shadow);
  color: var(--tcc-icon); animation: tcc-pop .42s var(--tcc-ease) backwards;
}
.tcc-tile + .tcc-tile { margin-left: -4px }
.tcc-tile svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round }
.tcc-tile[data-more] { font-size: 10px; font-weight: 500; line-height: 1; color: var(--tcc-t2); font-variant-numeric: tabular-nums }
.tcc-group-title { display: flex; align-items: baseline; gap: 6px; min-width: 0; animation: tcc-in .36s var(--tcc-ease) backwards }
.tcc-group-label { position: relative; font-weight: 500; color: var(--tcc-t1); white-space: nowrap }
.tcc-group-label[data-running] { color: var(--tcc-t3) }
.tcc-group-time { color: var(--tcc-t4); font-variant-numeric: tabular-nums; white-space: nowrap }
.tcc-group-list { display: grid; gap: 8px; padding: 6px 0 2px }
.tcc-shine::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--tcc-glint) 50%, transparent 62%) 0 0 / 300% 100%;
  -webkit-background-clip: text; background-clip: text; animation: tcc-sweep 1.8s linear infinite;
}

@keyframes tcc-in { from { opacity: 0; filter: blur(2px); transform: translateY(3px) } }
@keyframes tcc-fade { from { opacity: 0 } }
@keyframes tcc-pop { from { opacity: 0; transform: scale(.6) } }
@keyframes tcc-draw { from { stroke-dashoffset: 1 } }
@keyframes tcc-spin { to { transform: rotate(360deg) } }
@keyframes tcc-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }

@media (max-width: 360px) { .tcc-head { padding: 0 10px; gap: 8px } .tcc-sections { padding: 10px 10px 12px } }
@media (pointer: coarse) { .tcc-head { height: 48px } .tcc-copy { width: 36px; height: 36px } .tcc-group-head { height: 40px } }
@media (prefers-reduced-motion: reduce) {
  .tcc *, .tcc *::before, .tcc *::after, .tcc-group *, .tcc-group *::before, .tcc-group *::after { animation: none !important; transition: none !important }
  .tcc-shine::after { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const WrenchIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <path d="M10.2 2.6a3.1 3.1 0 0 0-2.8 4.1L2.9 11.2a1.35 1.35 0 0 0 1.9 1.9l4.5-4.5a3.1 3.1 0 0 0 4.1-2.8l-1.9 1.4-1.7-.4-.4-1.7 1.4-1.9a3.1 3.1 0 0 0-.6-.1Z" />
  </svg>
)

const Chevron = () => (
  <svg className="tcc-chevron" viewBox="0 0 12 12" aria-hidden>
    <path d="M3.5 5.25 6 7.75l2.5-2.5" />
  </svg>
)

function formatDuration(ms: number) {
  const s = Math.max(0, ms) / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  return `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s`
}

/** Counts up while `running`. Starts from `startedAt` when given, else from the moment it began running. */
function useElapsed(running: boolean, startedAt?: number) {
  const [ms, setMs] = React.useState(0)
  const [was, setWas] = React.useState(running)
  if (running !== was) {
    setWas(running)
    if (running) setMs(0)
  }
  React.useEffect(() => {
    if (!running) return
    const t0 = startedAt ?? Date.now()
    const tick = () => setMs(Date.now() - t0)
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, 100)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [running, startedAt])
  return ms
}

/** Controlled-or-not boolean state. */
function useOpen(controlled: boolean | undefined, initial: boolean, onChange?: (open: boolean) => void) {
  const [inner, setInner] = React.useState(initial)
  const open = controlled ?? inner
  const set = (next: boolean) => {
    if (controlled === undefined) setInner(next)
    onChange?.(next)
  }
  return [open, set, setInner] as const
}

type Formatted = { text: string; json: boolean }

/** Objects become pretty JSON, JSON strings are parsed, other strings stay plain text. */
function format(value: unknown): Formatted | null {
  if (value === undefined) return null
  if (typeof value === "string") {
    const t = value.trim()
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        return { text: JSON.stringify(JSON.parse(t), null, 2), json: true }
      } catch {
        /* not JSON */
      }
    }
    return { text: value, json: false }
  }
  try {
    return { text: JSON.stringify(value, null, 2) ?? String(value), json: true }
  } catch {
    return { text: String(value), json: false }
  }
}

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g

function highlight(src: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of src.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push(src.slice(last, at))
    if (m[1] !== undefined) {
      out.push(
        <span key={i++} className={m[2] ? "tcc-k" : "tcc-s"}>
          {m[1]}
        </span>,
      )
      if (m[2]) out.push(m[2])
    } else {
      out.push(
        <span key={i++} className={m[3] ? "tcc-b" : "tcc-n"}>
          {m[0]}
        </span>,
      )
    }
    last = at + m[0].length
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}

/** Copies text; flips to a check for 1.4s. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(id)
  }, [copied])
  return (
    <button
      type="button"
      className="tcc-copy"
      data-copied={copied || undefined}
      aria-label={copied ? "Copied" : label}
      onClick={() => {
        void navigator.clipboard?.writeText(text).catch(() => {})
        setCopied(true)
      }}
    >
      <svg className="tcc-copy-icon" viewBox="0 0 16 16" aria-hidden>
        <rect x="5.5" y="5.5" width="8.5" height="8.5" rx="2" />
        <path d="M10.5 3.75v-.25A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h.25" />
      </svg>
      <svg className="tcc-copy-done" viewBox="0 0 16 16" aria-hidden>
        <path d="M3.5 8.4 6.6 11.3 12.5 4.9" />
      </svg>
    </button>
  )
}

/** Code panel: caps its height and fades out the bottom until "Show all" is pressed. */
function CodeBlock({ data, max }: { data: Formatted; max: number }) {
  const codeRef = React.useRef<HTMLElement>(null)
  const [full, setFull] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)
  React.useLayoutEffect(() => {
    const el = codeRef.current
    if (!el) return
    // The observer callback is async, so measuring here never sets state during render.
    const ro = new ResizeObserver(() => setFull(el.offsetHeight + 20))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const capped = full > max + 4
  return (
    <>
      <pre
        className="tcc-code"
        data-plain={data.json ? undefined : ""}
        data-capped={capped || undefined}
        data-expanded={expanded || undefined}
        style={capped ? { maxHeight: expanded ? full : max } : undefined}
      >
        <code ref={codeRef}>{data.json ? highlight(data.text) : data.text}</code>
      </pre>
      {capped && (
        <button type="button" className="tcc-more" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
          {expanded ? "Show less" : "Show all"}
        </button>
      )}
    </>
  )
}

function Section({ title, data, max, copyLabel }: { title: string; data: Formatted; max: number; copyLabel: string }) {
  return (
    <div className="tcc-section">
      <div className="tcc-section-head">
        <span className="tcc-label">{title}</span>
        <CopyButton text={data.text} label={copyLabel} />
      </div>
      <CodeBlock data={data} max={max} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ToolCallCard                                */
/* -------------------------------------------------------------------------- */

const DEMO_ARGS = { query: "refund policy for annual plans", max_results: 3 }
const DEMO_RESULT = {
  hits: [
    { title: "Refunds and cancellations", score: 0.92 },
    { title: "Annual plan billing", score: 0.81 },
  ],
  cached: false,
}

export function ToolCallCard(props: ToolCallCardProps) {
  const bare = props.name === undefined && props.args === undefined && props.result === undefined && props.summary === undefined
  const {
    name = "search_docs",
    status = "success",
    summary = bare ? "Searched the docs for 'refund policy'" : undefined,
    icon,
    args = bare ? DEMO_ARGS : undefined,
    result = bare ? DEMO_RESULT : undefined,
    error,
    startedAt,
    duration = bare ? 1240 : undefined,
    defaultOpen = false,
    open: openProp,
    onOpenChange,
    openOnError = true,
    onRetry,
    maxCodeHeight = 220,
    className,
  } = props

  const id = React.useId()
  const running = status === "running"
  const elapsed = useElapsed(running, startedAt)
  const shownMs = running ? elapsed : (duration ?? elapsed)

  const [open, setOpen, setInnerOpen] = useOpen(openProp, defaultOpen || (openOnError && status === "error"), onOpenChange)

  // Open on failure, fold again on the next run – unless somebody toggled it by hand.
  const [touched, setTouched] = React.useState(false)
  const [prevStatus, setPrevStatus] = React.useState(status)
  if (status !== prevStatus) {
    setPrevStatus(status)
    if (openProp === undefined && openOnError && !touched) {
      if (status === "error") setInnerOpen(true)
      else if (prevStatus === "error" && status === "running") setInnerOpen(false)
    }
  }

  const argsData = format(args)
  const resultData = format(result)
  const announce = running ? `${name} running` : status === "error" ? `${name} failed${error ? `: ${error}` : ""}` : `${name} finished`

  return (
    <div className={cn("tcc", className)} data-status={status} data-open={open}>
      <style href="tool-call-card" precedence="default">
        {CSS}
      </style>
      <span className="tcc-sr" role="status" aria-live="polite">
        {announce}
      </span>

      <button
        type="button"
        className="tcc-head"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={() => {
          setTouched(true)
          setOpen(!open)
        }}
      >
        <span className="tcc-icon" aria-hidden>
          {icon ?? <WrenchIcon />}
        </span>
        <span className="tcc-main">
          <code className="tcc-name">{name}</code>
          {summary !== undefined && <span className="tcc-summary">{summary}</span>}
        </span>
        <span className="tcc-status" key={status}>
          {running && (
            <svg className="tcc-spinner" viewBox="0 0 16 16" aria-hidden>
              <circle cx="8" cy="8" r="6" />
              <path d="M8 2a6 6 0 0 1 6 6" />
            </svg>
          )}
          {status === "success" && (
            <svg className="tcc-ok" viewBox="0 0 16 16" aria-hidden>
              <circle cx="8" cy="8" r="7" />
              <path d="M5.1 8.2 7.1 10.1 10.9 6" pathLength="1" />
            </svg>
          )}
          {status === "error" ? (
            <>
              <svg className="tcc-fail" viewBox="0 0 16 16" aria-hidden>
                <circle cx="8" cy="8" r="7" />
                <path d="M8 4.6v4M8 11.2v.01" />
              </svg>
              <span>Failed</span>
            </>
          ) : (
            <span>{formatDuration(shownMs)}</span>
          )}
        </span>
        <Chevron />
      </button>

      <div className="tcc-body" id={`${id}-body`} inert={!open}>
        <div className="tcc-clip">
          <div className="tcc-sections">
            {argsData && <Section title="Arguments" data={argsData} max={maxCodeHeight} copyLabel="Copy arguments" />}
            {status === "error" ? (
              <div className="tcc-section">
                <div className="tcc-section-head">
                  <span className="tcc-label">Error</span>
                </div>
                <div className="tcc-error">
                  <p>{error ?? "The tool call failed."}</p>
                  {onRetry && (
                    <button type="button" className="tcc-retry" onClick={onRetry}>
                      <svg viewBox="0 0 16 16" aria-hidden>
                        <path d="M13 8a5 5 0 1 1-1.46-3.54M13 2.5v2.5h-2.5" />
                      </svg>
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ) : resultData ? (
              <Section title="Result" data={resultData} max={maxCodeHeight} copyLabel="Copy result" />
            ) : running ? (
              <div className="tcc-section">
                <div className="tcc-section-head">
                  <span className="tcc-label">Result</span>
                </div>
                <p className="tcc-wait">Waiting for result…</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ToolCallGroup                               */
/* -------------------------------------------------------------------------- */

export function ToolCallGroup({
  children,
  label,
  runningLabel = "Using tools…",
  duration,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
}: ToolCallGroupProps) {
  const id = React.useId()
  const [open, setOpen] = useOpen(openProp, defaultOpen, onOpenChange)

  const content =
    children ??
    [
      <ToolCallCard key="a" name="search_docs" summary="Searched the docs for 'refund policy'" args={DEMO_ARGS} result={DEMO_RESULT} duration={1240} />,
      <ToolCallCard key="b" name="fetch_page" summary="Read help.northwind.app/refunds" args={{ url: "https://help.northwind.app/refunds" }} result={{ status: 200, words: 1480 }} duration={860} />,
    ]
  const cards = React.Children.toArray(content).filter(React.isValidElement) as React.ReactElement<ToolCallCardProps>[]
  const count = cards.length
  const running = cards.some((c) => c.props.status === "running")
  const measured = useElapsed(running)
  const summed = cards.every((c) => c.props.duration !== undefined) && count > 0 ? cards.reduce((t, c) => t + (c.props.duration ?? 0), 0) : undefined
  const total = running ? measured : (duration ?? summed ?? measured)
  const text = running ? runningLabel : (label ?? `Used ${count} tool${count === 1 ? "" : "s"}`)

  const shown = cards.slice(0, 4)
  const extra = count - shown.length

  return (
    <div className={cn("tcc-group", className)} data-open={open}>
      <style href="tool-call-card" precedence="default">
        {CSS}
      </style>
      <span className="tcc-sr" role="status" aria-live="polite">
        {running ? runningLabel : `Used ${count} tool${count === 1 ? "" : "s"}`}
      </span>
      <button type="button" className="tcc-group-head" aria-expanded={open} aria-controls={`${id}-list`} onClick={() => setOpen(!open)}>
        <span className="tcc-stack" aria-hidden>
          {shown.map((c, i) => (
            <span key={c.key ?? i} className="tcc-tile">
              {c.props.icon ?? <WrenchIcon />}
            </span>
          ))}
          {extra > 0 && (
            <span className="tcc-tile" data-more>
              +{extra}
            </span>
          )}
        </span>
        <span className="tcc-group-title" key={running ? "run" : "done"}>
          <span className={cn("tcc-group-label", running && "tcc-shine")} data-running={running || undefined} data-text={text}>
            {text}
          </span>
          {(running || total > 0) && <span className="tcc-group-time">· {formatDuration(total)}</span>}
        </span>
        <Chevron />
      </button>
      <div className="tcc-group-body" id={`${id}-list`} inert={!open}>
        <div className="tcc-clip">
          <div className="tcc-group-list">{content}</div>
        </div>
      </div>
    </div>
  )
}

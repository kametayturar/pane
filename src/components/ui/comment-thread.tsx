"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ThreadAuthor = {
  name: string
  /** An image URL, or any node. Falls back to the initials. */
  avatar?: React.ReactNode | string
  /** Assistants get the gradient mark when they have no avatar. */
  assistant?: boolean
}

export type ThreadStatus = {
  /** One line, e.g. "Edit completed". It becomes a button when there are details. */
  label: string
  /** Lines that fold open under the status. */
  details?: string[]
}

export type ThreadMessage = {
  id: string
  author: ThreadAuthor
  /** A label such as "3min ago", or a Date / timestamp (shown as a clock time). */
  createdAt?: string | number | Date
  /** Text. A leading /command becomes a chip, @mentions are highlighted. */
  text: string
  /** Assistant replies can report what they did. */
  status?: ThreadStatus
}

export type CommentThreadProps = {
  /** Messages in order, oldest first. */
  messages?: ThreadMessage[]
  /** Author of new replies. */
  currentUser?: ThreadAuthor
  /** Shown with a thinking line while an answer is on its way. */
  assistant?: ThreadAuthor
  /**
   * Called with the reply text. Return a message (or a promise of one) for the assistant to answer,
   * or nothing to just post. Without this prop the built-in demo answers any @mention of the assistant.
   */
  onReply?: (text: string) => ThreadMessage | Promise<ThreadMessage | void> | void
  /** Shows a close button. */
  onClose?: () => void
  /** Heading at the top of the card. */
  title?: string
  /** Placeholder of the reply field. */
  placeholder?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ct {
  --ct-ink: #000;
  --ct-surface: #fff;
  --ct-accent: #0060e2;
  --ct-t1: color-mix(in oklab, var(--ct-ink) 88%, transparent);
  --ct-t2: color-mix(in oklab, var(--ct-ink) 61%, transparent);
  --ct-t3: color-mix(in oklab, var(--ct-ink) 45%, transparent);
  --ct-t4: color-mix(in oklab, var(--ct-ink) 27%, transparent);
  --ct-fill: color-mix(in oklab, var(--ct-ink) 6%, transparent);
  --ct-line: color-mix(in oklab, var(--ct-ink) 6%, transparent);
  --ct-elbow: color-mix(in oklab, var(--ct-ink) 14%, transparent);
  --ct-glint: rgb(255 255 255 / .82);
  --ct-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ct-ease: cubic-bezier(.22, 1, .36, 1);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--ct-surface);
  box-shadow: var(--ct-shadow);
  color: var(--ct-t1);
  font-family: var(--ct-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ct {
  --ct-ink: #fff;
  --ct-surface: #1c1c1e;
  --ct-accent: #4d8dff;
  --ct-t1: color-mix(in oklab, var(--ct-ink) 90%, transparent);
  --ct-t2: color-mix(in oklab, var(--ct-ink) 62%, transparent);
  --ct-t3: color-mix(in oklab, var(--ct-ink) 46%, transparent);
  --ct-t4: color-mix(in oklab, var(--ct-ink) 28%, transparent);
  --ct-fill: color-mix(in oklab, var(--ct-ink) 8%, transparent);
  --ct-line: color-mix(in oklab, var(--ct-ink) 8%, transparent);
  --ct-elbow: color-mix(in oklab, var(--ct-ink) 18%, transparent);
  --ct-glint: rgb(255 255 255 / .9);
  --ct-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ct *, .ct *::before, .ct *::after { box-sizing: border-box }
:where(.ct) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ct :focus-visible { outline: 2px solid color-mix(in oklab, var(--ct-accent) 60%, transparent); outline-offset: 1px }

/* Header */
.ct-head { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 10px 10px 16px; border-bottom: .5px solid var(--ct-line) }
.ct-title { margin: 0; font-size: 13px; font-weight: 500; line-height: 20px; color: var(--ct-ink) }
.ct-count { margin-right: auto; font-size: 12px; line-height: 16px; color: var(--ct-t3); font-variant-numeric: tabular-nums }
.ct .ct-iconbtn {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: 6px; color: var(--ct-t3);
  transition: background-color .16s, color .16s;
}
.ct .ct-iconbtn:hover { background: var(--ct-fill); color: var(--ct-ink) }
.ct-glyph { width: 16px; height: 16px }

/* The list: its wrapper animates to the list's height as messages arrive */
.ct-morph { overflow: hidden; transition: height .38s var(--ct-ease) }
.ct-scroll { display: grid; gap: 16px; max-height: 340px; padding: 16px 16px 12px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin }
.ct-msg { min-width: 0; animation: ct-in .42s var(--ct-ease) backwards }
.ct-meta { display: flex; align-items: center; gap: 8px }
.ct-avatar {
  display: grid; place-items: center; flex: none; width: 20px; height: 20px; overflow: hidden; border-radius: 50%;
  background: var(--ct-fill); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ct-ink) 8%, transparent);
  font-size: 9px; font-weight: 600; line-height: 1; color: var(--ct-t2);
}
.ct-avatar > * { width: 100%; height: 100%; object-fit: cover }
.ct-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--ct-ink) }
.ct-time { margin-left: auto; flex: none; font-size: 12px; line-height: 16px; color: var(--ct-t4); font-variant-numeric: tabular-nums }
.ct-text { margin: 4px 0 0 28px; overflow-wrap: anywhere; color: var(--ct-t1) }
.ct-command {
  display: inline-block; margin-right: 1px; padding: 0 5px; border-radius: 5px; background: var(--ct-fill);
  font-size: 12px; font-weight: 500; line-height: 18px; color: var(--ct-t2);
}
.ct-mention { font-weight: 500; color: var(--ct-accent) }

/* Thinking line with a glint sweeping over it */
.ct-thinking { position: relative; display: inline-block; color: var(--ct-t3) }
.ct-thinking::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--ct-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text;
  animation: ct-sweep 1.4s linear infinite;
}

/* Status line with folding details */
.ct-status { margin: 4px 0 0 22px }
.ct .ct-statusbtn {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 28px; padding: 0 4px 0 6px; border-radius: 6px;
  font-weight: 500; color: var(--ct-t1); transition: background-color .16s; text-align: left;
}
.ct .ct-statusbtn:hover { background: var(--ct-fill) }
.ct-statusbtn[data-static] { padding-right: 8px; cursor: default }
.ct-statusbtn[data-static]:hover { background: none }
.ct-statusbtn .ct-glyph { flex: none }
.ct-chevron { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--ct-t3); transition: transform .26s var(--ct-ease), color .16s }
.ct-statusbtn:hover .ct-chevron { color: var(--ct-ink) }
.ct-statusbtn[aria-expanded="true"] .ct-chevron { transform: rotate(180deg) }
.ct-details { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s var(--ct-ease) }
.ct-details[data-open] { grid-template-rows: 1fr }
.ct-details ul { min-height: 0; margin: -6px 0 0; padding: 6px 0 0 28px; overflow: hidden; list-style: none }
.ct-details li {
  position: relative; margin-top: 4px; color: var(--ct-t2); opacity: 0; transform: translateY(-8px);
  transition: opacity .16s, transform .22s var(--ct-ease);
}
.ct-details li:first-child { margin-top: 2px }
.ct-details li::before {
  content: ""; position: absolute; left: -14.5px; top: -6px; width: 9px; height: 16.5px;
  border-bottom: 1px solid var(--ct-elbow); border-left: 1px solid var(--ct-elbow); border-radius: 0 0 0 5px;
}
.ct-details[data-open] li {
  opacity: 1; transform: none;
  transition: opacity .32s ease calc(60ms + var(--i) * 60ms), transform .42s var(--ct-ease) calc(60ms + var(--i) * 60ms);
}

/* Composer */
.ct-composer { display: flex; align-items: center; gap: 8px; padding: 4px 10px 10px 16px }
.ct-input {
  flex: 1; min-width: 0; height: 28px; padding: 0; border: 0; background: none; outline: none;
  font: inherit; color: var(--ct-ink);
}
.ct-input::placeholder { color: var(--ct-t4) }
.ct-input:focus-visible { outline: none }
.ct .ct-send {
  display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px;
  background: var(--ct-fill); color: var(--ct-t4);
  transition: background-color .18s, color .18s, transform .16s var(--ct-ease);
}
.ct .ct-send:not(:disabled) { background: color-mix(in oklab, var(--ct-ink) 88%, transparent); color: var(--ct-surface) }
.ct .ct-send:not(:disabled):active { transform: scale(.92) }
.ct .ct-send:disabled { cursor: default }

@keyframes ct-in { from { opacity: 0; transform: translateY(4px) } }
@keyframes ct-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }

@media (prefers-reduced-motion: reduce) {
  .ct *, .ct *::before, .ct *::after { animation: none !important; transition: none !important }
  .ct-thinking::after { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

/** The default gradient avatar for an assistant. */
export function AssistantMark() {
  const id = React.useId()
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id={`${id}-fill`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b9dff" />
          <stop offset=".5" stopColor="#2f6bff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill={`url(#${id}-fill)`} />
    </svg>
  )
}

const CheckGlyph = () => (
  <svg className="ct-glyph" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="m3.75 8.4 2.7 2.7 5.8-6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Chevron = () => (
  <span className="ct-chevron" aria-hidden>
    <svg className="ct-glyph" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 6.25 8 9.75l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
)

function Avatar({ author }: { author: ThreadAuthor }) {
  const { avatar } = author
  let content: React.ReactNode
  if (typeof avatar === "string") content = <img src={avatar} alt="" width={20} height={20} loading="lazy" />
  else if (avatar) content = avatar
  else if (author.assistant) content = <AssistantMark />
  else
    content = author.name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("")
  return (
    <span className="ct-avatar" aria-hidden>
      {content}
    </span>
  )
}

/** /command at the start becomes a chip; @mentions are highlighted. */
function RichText({ text }: { text: string }) {
  const command = /^\/[\w-]+/.exec(text)?.[0]
  const rest = command ? text.slice(command.length) : text
  const parts = rest.split(/(@[\w-]+)/g)
  return (
    <>
      {command && <span className="ct-command">{command}</span>}
      {parts.map((p, i) =>
        p.startsWith("@") && p.length > 1 ? (
          <span key={i} className="ct-mention">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  )
}

function formatTime(t: ThreadMessage["createdAt"]) {
  if (t === undefined) return null
  if (typeof t === "string") return t
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(t)
}

function StatusLine({ status }: { status: ThreadStatus }) {
  const [open, setOpen] = React.useState(false)
  const details = status.details ?? []
  const hasDetails = details.length > 0
  return (
    <div className="ct-status">
      {hasDetails ? (
        <button type="button" className="ct-statusbtn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <CheckGlyph />
          <span>{status.label}</span>
          <Chevron />
        </button>
      ) : (
        <span className="ct-statusbtn" data-static="">
          <CheckGlyph />
          <span>{status.label}</span>
        </span>
      )}
      {hasDetails && (
        <div className="ct-details" data-open={open || undefined} inert={!open || undefined}>
          <ul>
            {details.map((d, i) => (
              <li key={i} style={{ "--i": i } as React.CSSProperties}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Animates its height to follow the list (height: auto cannot be transitioned). */
function Morph({ children, listRef }: { children: React.ReactNode; listRef: React.RefObject<HTMLDivElement | null> }) {
  const [height, setHeight] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [listRef])
  return (
    <div className="ct-morph" style={height !== null ? { height } : undefined}>
      {children}
    </div>
  )
}

const DEFAULT_ASSISTANT: ThreadAuthor = { name: "Orbit", assistant: true }
const DEFAULT_USER: ThreadAuthor = { name: "You" }
const DEFAULT_MESSAGES: ThreadMessage[] = [
  {
    id: "m1",
    author: { name: "Maya Okafor" },
    createdAt: "3min ago",
    text: "/summarize Turn the October interview notes into five findings for the roadmap doc.",
  },
  {
    id: "m2",
    author: DEFAULT_ASSISTANT,
    createdAt: "1min ago",
    text: "",
    status: {
      label: "Summary completed",
      details: ["Grouped 14 interviews into 5 themes", "Flagged 2 quotes that need consent", "Left the pricing section as it was"],
    },
  },
]

/* -------------------------------------------------------------------------- */
/*                               CommentThread                                */
/* -------------------------------------------------------------------------- */

/** One comment with replies: an assistant reports what it did, folds open details and answers @mentions. */
export function CommentThread({
  messages = DEFAULT_MESSAGES,
  currentUser = DEFAULT_USER,
  assistant = DEFAULT_ASSISTANT,
  onReply,
  onClose,
  title = "Comment",
  placeholder,
  className,
}: CommentThreadProps) {
  const [local, setLocal] = React.useState<ThreadMessage[]>([])
  const [thinking, setThinking] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const listRef = React.useRef<HTMLDivElement>(null)
  const timers = React.useRef<number[]>([])
  const seq = React.useRef(0)
  const [initial] = React.useState(messages.length)
  const all = [...messages, ...local]

  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  // Keep the newest message in view.
  React.useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [all.length, thinking])

  const add = (m: ThreadMessage) => setLocal((l) => [...l, m])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft("")
    add({ id: `local-${seq.current++}`, author: currentUser, createdAt: "just now", text })

    if (!onReply) {
      // Built-in demo: answer any @mention of the assistant after a short think.
      if (text.toLowerCase().includes(`@${assistant.name.toLowerCase()}`)) {
        setThinking(true)
        const t = window.setTimeout(() => {
          setThinking(false)
          add({ id: `local-${seq.current++}`, author: assistant, createdAt: "just now", text: "On it – I will check that and report back here." })
        }, 1600)
        timers.current.push(t)
      }
      return
    }
    const result = onReply(text)
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setThinking(true)
      ;(result as Promise<ThreadMessage | void>)
        .then((m) => m && add(m))
        .finally(() => setThinking(false))
    } else if (result) {
      add(result as ThreadMessage)
    }
  }

  const count = all.length

  return (
    <section className={cn("ct", className)} aria-label={title}>
      <style href="comment-thread" precedence="default">
        {CSS}
      </style>

      <header className="ct-head">
        <h3 className="ct-title">{title}</h3>
        <span className="ct-count">
          {count} {count === 1 ? "message" : "messages"}
        </span>
        {onClose && (
          <button type="button" className="ct-iconbtn" aria-label="Close comment" onClick={onClose}>
            <svg className="ct-glyph" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>

      <Morph listRef={listRef}>
        <div className="ct-scroll" ref={listRef} aria-live="polite">
          {all.map((m, i) => {
            const time = formatTime(m.createdAt)
            return (
              <article key={m.id} className="ct-msg" style={i < initial ? { animationDelay: `${i * 80}ms` } : undefined}>
                <div className="ct-meta">
                  <Avatar author={m.author} />
                  <span className="ct-name">{m.author.name}</span>
                  {time && <time className="ct-time">{time}</time>}
                </div>
                {m.text && (
                  <p className="ct-text">
                    <RichText text={m.text} />
                  </p>
                )}
                {m.status && <StatusLine status={m.status} />}
              </article>
            )
          })}
          {thinking && (
            <article className="ct-msg" aria-label={`${assistant.name} is thinking`}>
              <div className="ct-meta">
                <Avatar author={{ ...assistant, assistant: true }} />
                <span className="ct-name">{assistant.name}</span>
              </div>
              <p className="ct-text">
                <span className="ct-thinking" data-text={"Thinking…"}>
                  {"Thinking…"}
                </span>
              </p>
            </article>
          )}
        </div>
      </Morph>

      <form className="ct-composer" onSubmit={submit}>
        <input
          className="ct-input"
          aria-label="Reply"
          placeholder={placeholder ?? `Reply, or ask @${assistant.name}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="ct-send" aria-label="Send reply" disabled={!draft.trim()}>
          <svg className="ct-glyph" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 12.5v-9M4.25 7.25 8 3.5l3.75 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </section>
  )
}

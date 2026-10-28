"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DraftContact = {
  name: string
  email: string
}

export type DraftTone = {
  id: string
  /** Label of the toggle button. */
  label: string
  /** The email text for this tone, written for the chosen recipient. */
  body: (contact: DraftContact) => string
}

export type DraftLink = { label: string; href: string }

export type SentEmail = {
  to: DraftContact
  /** The text, with the link appended on its own line. */
  body: string
  attachment: string | null
}

export type EmailDraftProps = {
  /** Reference of the record the email is about. */
  reference?: string
  /** Account or company under the reference. */
  account?: string
  /** Amount on the right. */
  amount?: string
  /** Status chip next to the reference. */
  status?: string
  /** Who wrote the draft, shown in the last row. */
  agent?: string
  /** People the email can go to. The first one is preselected. */
  contacts?: DraftContact[]
  /** File name of the attachment. It can be removed and added back. null = no attachment. */
  attachment?: string | null
  /** Text variants. Friendly, Short and Formal by default. */
  tones?: DraftTone[]
  /** Link shown at the end of the text. */
  link?: DraftLink
  /**
   * Called after Send with the final email. Return a promise to keep the "Sending" spinner
   * until it settles; if it rejects the draft comes back.
   */
  onSend?: (email: SentEmail) => void | Promise<unknown>
  /** Called when the draft is discarded. */
  onDiscard?: () => void
  /** Called when someone presses Undo on the sent or discarded receipt. */
  onUndo?: (what: "sent" | "discarded") => void
  /** Minimum time of the sending spinner, in ms. */
  sendMs?: number
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ed {
  --ed-ink: #000;
  --ed-surface: #fff;
  --ed-accent: #0060e2;
  --ed-good: #1a9a52;
  --ed-warn: #b47a06;
  --ed-warn-bg: rgb(232 162 12 / .12);
  --ed-t1: color-mix(in oklab, var(--ed-ink) 88%, transparent);
  --ed-t2: color-mix(in oklab, var(--ed-ink) 61%, transparent);
  --ed-t3: color-mix(in oklab, var(--ed-ink) 45%, transparent);
  --ed-t4: color-mix(in oklab, var(--ed-ink) 27%, transparent);
  --ed-fill: color-mix(in oklab, var(--ed-ink) 6%, transparent);
  --ed-fill-soft: color-mix(in oklab, var(--ed-ink) 3%, transparent);
  --ed-line: color-mix(in oklab, var(--ed-ink) 6%, transparent);
  --ed-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ed-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ed-ease: cubic-bezier(.22, 1, .36, 1);
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  border-radius: 10px;
  background: var(--ed-surface);
  box-shadow: var(--ed-shadow);
  color: var(--ed-t1);
  font-family: var(--ed-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ed {
  --ed-ink: #fff;
  --ed-surface: #1c1c1e;
  --ed-accent: #4d8dff;
  --ed-good: #3dd68c;
  --ed-warn: #f2b233;
  --ed-warn-bg: rgb(242 178 51 / .14);
  --ed-t1: color-mix(in oklab, var(--ed-ink) 90%, transparent);
  --ed-t2: color-mix(in oklab, var(--ed-ink) 62%, transparent);
  --ed-t3: color-mix(in oklab, var(--ed-ink) 46%, transparent);
  --ed-t4: color-mix(in oklab, var(--ed-ink) 28%, transparent);
  --ed-fill: color-mix(in oklab, var(--ed-ink) 8%, transparent);
  --ed-fill-soft: color-mix(in oklab, var(--ed-ink) 5%, transparent);
  --ed-line: color-mix(in oklab, var(--ed-ink) 8%, transparent);
  --ed-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ed-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ed *, .ed *::before, .ed *::after { box-sizing: border-box }
:where(.ed) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.ed :focus-visible { outline: 2px solid color-mix(in oklab, var(--ed-accent) 60%, transparent); outline-offset: 1px }
.ed svg { flex: none }

/* Record */
.ed-record { display: grid; padding: 12px 16px; border-bottom: .5px solid var(--ed-line) }
.ed-ref { display: flex; align-items: center; gap: 8px; min-width: 0 }
.ed-id, .ed-amount { font-size: 15px; font-weight: 500; line-height: 24px; color: var(--ed-ink) }
.ed-amount { margin-left: auto; font-variant-numeric: tabular-nums }
.ed-chip, .ed-badge {
  padding: 2px 6px; border-radius: 5px; font-size: 12px; font-weight: 500; line-height: 16px; white-space: nowrap;
}
.ed-chip { color: var(--ed-warn); background: var(--ed-warn-bg) }
.ed-account { font-size: 12px; line-height: 16px; color: var(--ed-t2) }

/* The middle section follows its content's height; it clips only while it is moving */
.ed-outer { transition: height .36s var(--ed-ease) }
.ed-outer[data-clip] { overflow: hidden }
.ed-draft, .ed-receipt { animation: ed-in .32s var(--ed-ease) backwards }
.ed-draft { transition: opacity .2s }
.ed-draft[data-sending] { opacity: .6; pointer-events: none }

.ed-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px 10px 16px; border-bottom: .5px solid var(--ed-line) }
.ed-to { position: relative; display: flex; align-items: center; gap: 8px; min-width: 0 }
.ed-label { color: var(--ed-t3) }
.ed .ed-recipient {
  display: flex; align-items: center; gap: 6px; height: 28px; min-width: 0; padding: 0 6px 0 10px; border-radius: 6px;
  box-shadow: inset 0 0 0 .5px var(--ed-line); font-weight: 500; color: var(--ed-t1); transition: background-color .16s;
}
.ed .ed-recipient:hover, .ed .ed-recipient[aria-expanded="true"] { background: var(--ed-fill-soft) }
.ed-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ed-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 400; color: var(--ed-t3) }
.ed-caret { width: 16px; height: 16px; color: var(--ed-t3); transition: transform .22s var(--ed-ease) }
.ed-recipient[aria-expanded="true"] .ed-caret { transform: rotate(180deg) }
.ed-file { display: flex; align-items: center; gap: 6px; min-width: 0; color: var(--ed-t2) }
.ed-file svg { width: 16px; height: 16px; color: var(--ed-t3) }
.ed-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ed .ed-mini {
  display: grid; place-items: center; width: 24px; height: 24px; margin-left: -2px; border-radius: 6px; color: var(--ed-t3);
  transition: background-color .16s, color .16s;
}
.ed .ed-mini:hover { background: var(--ed-fill); color: var(--ed-ink) }
.ed-mini svg { width: 14px; height: 14px }
.ed .ed-attach { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 6px; border-radius: 6px; color: var(--ed-t3); transition: background-color .16s, color .16s }
.ed .ed-attach:hover { background: var(--ed-fill); color: var(--ed-ink) }
.ed-attach svg { width: 14px; height: 14px }

/* Recipient menu */
.ed-menu {
  position: absolute; top: 34px; left: 26px; z-index: 5; display: grid; gap: 2px; width: 260px; max-width: calc(100cqw - 48px);
  margin: 0; padding: 4px; list-style: none; border-radius: 10px; background: var(--ed-surface); box-shadow: var(--ed-float);
  transform-origin: 0 0; animation: ed-menu .2s var(--ed-ease) backwards;
}
.ed .ed-option { display: flex; align-items: center; gap: 10px; width: 100%; padding: 6px 8px; border-radius: 6px; text-align: left; transition: background-color .14s }
.ed .ed-option:hover, .ed .ed-option:focus-visible { background: var(--ed-fill) }
.ed-avatar { display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: 6px; background: var(--ed-fill); font-size: 10px; font-weight: 500; line-height: 20px; color: var(--ed-t2) }
.ed-menu-text { display: grid; flex: 1; min-width: 0 }
.ed-menu-text span, .ed-menu-text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ed-menu-text small { font-size: 12px; line-height: 16px; color: var(--ed-t3) }
.ed-tick { width: 16px; height: 16px; color: color-mix(in oklab, var(--ed-accent) 76.5%, transparent) }

/* Text */
.ed-body { padding: 14px 16px 2px }
.ed-text, .ed-edit {
  display: block; width: calc(100% + 12px); margin: -4px -6px; padding: 4px 6px; border-radius: 6px;
  font: inherit; color: var(--ed-t1); overflow-wrap: anywhere;
}
.ed-text { cursor: text; white-space: pre-wrap; transition: background-color .16s; animation: ed-fade .28s var(--ed-ease) backwards }
.ed-text:hover { background: var(--ed-fill-soft) }
.ed-link { font-weight: 500; color: var(--ed-ink); text-decoration: underline 1px var(--ed-t4); text-underline-offset: 2px; transition: text-decoration-color .16s }
.ed-link:hover { text-decoration-color: var(--ed-ink) }
.ed-edit { resize: none; overflow: hidden; border: 0; outline: none; background: var(--ed-fill-soft); box-shadow: inset 0 0 0 .5px var(--ed-line), 0 0 0 2px color-mix(in oklab, var(--ed-accent) 22%, transparent); color: var(--ed-ink); animation: ed-fade .2s var(--ed-ease) backwards }

.ed-tune { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 12px 14px 16px }
.ed-tones { display: flex; align-items: center; gap: 4px; min-width: 0 }
.ed .ed-tone, .ed .ed-edit-btn {
  display: flex; align-items: center; justify-content: center; height: 28px; padding: 4px 10px; border-radius: 6px;
  font-weight: 500; color: var(--ed-t2); transition: background-color .16s, color .16s;
}
.ed .ed-tone { box-shadow: inset 0 0 0 .5px var(--ed-line) }
.ed .ed-tone:hover, .ed .ed-edit-btn:hover { color: var(--ed-ink) }
.ed .ed-tone[aria-pressed="true"], .ed .ed-edit-btn[aria-pressed="true"] { background: var(--ed-fill); color: var(--ed-t1) }
.ed .ed-edit-btn { width: 28px; margin-left: 4px; padding: 0; color: var(--ed-t3) }
.ed-edit-btn svg { width: 16px; height: 16px }
.ed-hint { flex: none; font-size: 12px; line-height: 16px; color: var(--ed-t4); white-space: nowrap }

/* Receipt */
.ed-receipt { display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 16px; color: var(--ed-t2) }
.ed-receipt-icon { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 6px; color: var(--ed-t3); background: var(--ed-fill) }
.ed-receipt-icon[data-tone="ok"] { color: var(--ed-good); background: color-mix(in oklab, var(--ed-good) 8%, transparent) }
.ed-receipt-icon svg { width: 14px; height: 14px }
.ed-receipt-text { min-width: 0; flex: 1 }
.ed-receipt-text b { font-weight: 500; color: var(--ed-ink) }
.ed .ed-undo { height: 28px; padding: 0 10px; border-radius: 6px; font-weight: 500; color: var(--ed-t1); transition: background-color .16s }
.ed .ed-undo:hover { background: var(--ed-fill) }

/* Last row: it stays put while the middle changes */
.ed-foot { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 10px 10px 16px; border-top: .5px solid var(--ed-line) }
.ed-agent { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ed-badge { color: var(--ed-good); background: color-mix(in oklab, var(--ed-good) 8%, transparent); animation: ed-fade .26s var(--ed-ease) backwards }
.ed-badge[data-tone="muted"] { color: var(--ed-t3); background: var(--ed-fill) }
.ed-buttons { display: flex; gap: 8px; margin-left: auto }
.ed .ed-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 6px;
  background: var(--ed-surface); box-shadow: var(--ed-shadow); font-weight: 500; color: var(--ed-ink); white-space: nowrap;
  transition: background-color .16s, transform .16s var(--ed-ease), opacity .16s;
}
.ed .ed-btn:hover:not(:disabled) { background: color-mix(in oklab, var(--ed-surface), var(--ed-ink) 4%) }
.ed .ed-btn:active:not(:disabled) { transform: scale(.97) }
.ed .ed-btn:disabled { cursor: default }
.ed .ed-btn--primary { background: var(--ed-t1); color: var(--ed-surface); box-shadow: none }
.ed .ed-btn--primary:hover:not(:disabled) { background: color-mix(in oklab, var(--ed-ink) 78%, transparent) }
.ed-spinner { width: 12px; height: 12px; border: 1.5px solid color-mix(in oklab, currentColor 30%, transparent); border-top-color: currentColor; border-radius: 50%; animation: ed-spin .7s linear infinite }

@container (max-width: 420px) {
  .ed-email, .ed-hint, .ed-agent { display: none }
  .ed-menu small { display: block }
}

@keyframes ed-in { from { opacity: 0; transform: translateY(4px) } }
@keyframes ed-fade { from { opacity: 0 } }
@keyframes ed-menu { from { opacity: 0; transform: scale(.97) translateY(-4px) } }
@keyframes ed-spin { to { transform: rotate(360deg) } }

@media (prefers-reduced-motion: reduce) {
  .ed *, .ed *::before, .ed *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const

const Caret = () => (
  <svg className="ed-caret" {...ico}>
    <path d="m8 10 4 4 4-4" />
  </svg>
)
const Tick = () => (
  <svg className="ed-tick" {...ico} strokeWidth={2}>
    <path d="m6 12.5 4 4 8-9" />
  </svg>
)
const Clip = () => (
  <svg {...ico}>
    <path d="m19 11-7.2 7.2a4.5 4.5 0 0 1-6.4-6.4l8-8a3 3 0 0 1 4.3 4.2l-8 8a1.5 1.5 0 0 1-2.2-2.1l7-7" />
  </svg>
)
const Cross = () => (
  <svg {...ico}>
    <path d="M7 7l10 10M17 7 7 17" />
  </svg>
)
const Pencil = () => (
  <svg {...ico}>
    <path d="m4.5 19.5 1-4L16.2 4.8a1.9 1.9 0 0 1 2.7 0l.3.3a1.9 1.9 0 0 1 0 2.7L8.5 18.5Z" />
    <path d="m14.5 6.5 3 3" />
  </svg>
)

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")

const first = (c: DraftContact) => c.name.split(/\s+/)[0]

const DEFAULT_CONTACTS: DraftContact[] = [
  { name: "Priya Nair", email: "priya@halcyon.io" },
  { name: "Tom Becker", email: "tom@halcyon.io" },
  { name: "Finance team", email: "finance@halcyon.io" },
]

function defaultTones(reference: string, amount: string): DraftTone[] {
  return [
    {
      id: "friendly",
      label: "Friendly",
      body: (c) =>
        `Hi ${first(c)}, a quick nudge that ${reference} for ${amount} is a few days past due. If something is blocking payment, just reply and we will sort it out. You can pay or download the invoice here:`,
    },
    { id: "short", label: "Short", body: (c) => `Hi ${first(c)}, ${reference} (${amount}) is past due. You can pay it here:` },
    {
      id: "formal",
      label: "Formal",
      body: (c) =>
        `Dear ${first(c)}, our records show that ${reference} for ${amount} remains unpaid past its due date. We would appreciate settlement at your earliest convenience. The invoice is available here:`,
    },
  ]
}

/** Textarea that grows with its text. */
function AutoText(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  const local = React.useRef<HTMLTextAreaElement>(null)
  React.useLayoutEffect(() => {
    const el = local.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [props.value])
  return (
    <textarea
      {...props}
      ref={(node) => {
        local.current = node
        const r = props.ref
        if (typeof r === "function") r(node)
        else if (r) (r as React.RefObject<HTMLTextAreaElement | null>).current = node
      }}
    />
  )
}

/** Follows its content's height with a transition (height: auto cannot be animated). */
function Smooth({ clip, children }: { clip: boolean; children: React.ReactNode }) {
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
    <div className="ed-outer" data-clip={clip || undefined} style={height !== null ? { height } : undefined}>
      <div ref={inner} style={{ display: "flow-root" }}>
        {children}
      </div>
    </div>
  )
}

type Phase = "draft" | "sending" | "sent" | "discarded"

/* -------------------------------------------------------------------------- */
/*                                 EmailDraft                                 */
/* -------------------------------------------------------------------------- */

/** An agent-written email for review: switch recipient and tone, edit inline, remove the attachment, send or discard with undo. */
export function EmailDraft({
  reference = "INV-2047",
  account = "Halcyon Robotics",
  amount = "$2,400",
  status = "Overdue 3 days",
  agent = "Billing agent",
  contacts = DEFAULT_CONTACTS,
  attachment = "Invoice-2047.pdf",
  tones,
  link = { label: "View invoice", href: "#" },
  onSend,
  onDiscard,
  onUndo,
  sendMs = 900,
  className,
}: EmailDraftProps) {
  const toneList = React.useMemo(() => tones ?? defaultTones(reference, amount), [tones, reference, amount])
  const [phase, setPhase] = React.useState<Phase>("draft")
  const [settling, setSettling] = React.useState(false)
  const [contactIdx, setContactIdx] = React.useState(0)
  const [toneId, setToneId] = React.useState(toneList[0]?.id)
  const [edited, setEdited] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [keepFile, setKeepFile] = React.useState(true)
  const [menu, setMenu] = React.useState(false)
  const timers = React.useRef<number[]>([])
  const run = React.useRef(0)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLUListElement>(null)
  const textRef = React.useRef<HTMLTextAreaElement>(null)

  const contact = contacts[Math.min(contactIdx, contacts.length - 1)] ?? { name: "", email: "" }
  const tone = toneList.find((t) => t.id === toneId) ?? toneList[0]
  const text = edited ?? tone?.body(contact) ?? ""
  const file = keepFile ? attachment : null

  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  // Click outside closes the recipient menu.
  React.useEffect(() => {
    if (!menu) return
    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node)) return
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      setMenu(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [menu])

  // Focus the selected option when the menu opens, and the text field when editing starts.
  React.useEffect(() => {
    if (menu) menuRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
  }, [menu])
  React.useEffect(() => {
    if (editing) {
      const el = textRef.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }
  }, [editing])

  const go = (next: Phase) => {
    setPhase(next)
    setSettling(true)
    timers.current.push(window.setTimeout(() => setSettling(false), 420))
  }

  const send = () => {
    if (phase !== "draft") return
    setMenu(false)
    setEditing(false)
    go("sending")
    const id = ++run.current
    const body = link ? `${text}\n\n${link.label}: ${link.href}` : text
    const result = onSend?.({ to: contact, body, attachment: file })
    const wait = new Promise<void>((r) => timers.current.push(window.setTimeout(r, sendMs)))
    Promise.all([wait, result]).then(
      () => run.current === id && go("sent"),
      () => run.current === id && go("draft")
    )
  }

  const discard = () => {
    if (phase !== "draft") return
    setMenu(false)
    setEditing(false)
    onDiscard?.()
    go("discarded")
  }

  const undo = () => {
    onUndo?.(phase === "sent" ? "sent" : "discarded")
    run.current++
    go("draft")
  }

  const pickTone = (id: string) => {
    setToneId(id)
    setEdited(null)
    setEditing(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && phase === "draft") {
      e.preventDefault()
      send()
    } else if (e.key === "Escape") {
      if (menu) {
        setMenu(false)
        triggerRef.current?.focus()
      } else if (editing) {
        setEditing(false)
      }
    }
  }

  const onMenuKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const move = (i: number) => {
      e.preventDefault()
      items[(i + items.length) % items.length]?.focus()
    }
    if (e.key === "ArrowDown") move(at + 1)
    else if (e.key === "ArrowUp") move(at - 1)
    else if (e.key === "Home") move(0)
    else if (e.key === "End") move(items.length - 1)
  }

  const sending = phase === "sending"
  const done = phase === "sent" || phase === "discarded"
  const badge = phase === "sent" ? "Sent" : phase === "discarded" ? "Discarded" : "Ready for review"

  return (
    <section className={cn("ed", className)} aria-label="Email draft" onKeyDown={onKeyDown}>
      <style href="email-draft" precedence="default">
        {CSS}
      </style>

      <div className="ed-record">
        <div className="ed-ref">
          <span className="ed-id">{reference}</span>
          {status && <span className="ed-chip">{status}</span>}
          <span className="ed-amount">{amount}</span>
        </div>
        <span className="ed-account">{account}</span>
      </div>

      <Smooth clip={settling || done}>
        {done ? (
          <div className="ed-receipt" role="status" key={phase}>
            <span className="ed-receipt-icon" data-tone={phase === "sent" ? "ok" : "muted"} aria-hidden>
              {phase === "sent" ? (
                <svg {...ico} strokeWidth={2}>
                  <path d="m6 12.5 4 4 8-9" />
                </svg>
              ) : (
                <Cross />
              )}
            </span>
            <span className="ed-receipt-text">
              {phase === "sent" ? (
                <>
                  Sent to <b>{contact.name}</b>
                  {file ? ` with ${file}` : ""}
                </>
              ) : (
                "Draft discarded"
              )}
            </span>
            <button type="button" className="ed-undo" onClick={undo}>
              Undo
            </button>
          </div>
        ) : (
          <div className="ed-draft" data-sending={sending || undefined}>
            <div className="ed-meta">
              <div className="ed-to">
                <span className="ed-label">To</span>
                <button
                  ref={triggerRef}
                  type="button"
                  className="ed-recipient"
                  aria-haspopup="listbox"
                  aria-expanded={menu}
                  onClick={() => setMenu((m) => !m)}
                >
                  <span className="ed-name">{contact.name}</span>
                  <span className="ed-email">{contact.email}</span>
                  <Caret />
                </button>
                {menu && (
                  <ul ref={menuRef} className="ed-menu" role="listbox" aria-label="Recipient" onKeyDown={onMenuKey}>
                    {contacts.map((c, i) => (
                      <li key={c.email}>
                        <button
                          type="button"
                          role="option"
                          className="ed-option"
                          aria-selected={i === contactIdx}
                          onClick={() => {
                            setContactIdx(i)
                            setMenu(false)
                            triggerRef.current?.focus()
                          }}
                        >
                          <span className="ed-avatar" aria-hidden>
                            {initials(c.name)}
                          </span>
                          <span className="ed-menu-text">
                            <span>{c.name}</span>
                            <small>{c.email}</small>
                          </span>
                          {i === contactIdx && <Tick />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {attachment &&
                (file ? (
                  <span className="ed-file">
                    <Clip />
                    <span className="ed-file-name">{file}</span>
                    <button type="button" className="ed-mini" aria-label={`Remove ${file}`} onClick={() => setKeepFile(false)}>
                      <Cross />
                    </button>
                  </span>
                ) : (
                  <button type="button" className="ed-attach" onClick={() => setKeepFile(true)}>
                    <Clip />
                    Add {attachment}
                  </button>
                ))}
            </div>

            <div className="ed-body">
              {editing ? (
                <AutoText ref={textRef} className="ed-edit" aria-label="Email text" rows={1} value={text} onChange={(e) => setEdited(e.target.value)} />
              ) : (
                <p
                  key={`${toneId}-${contactIdx}-${edited === null}`}
                  className="ed-text"
                  onClick={(e) => {
                    if (!(e.target instanceof HTMLElement && e.target.closest("a"))) setEditing(true)
                  }}
                >
                  {text}
                  {link && (
                    <>
                      {" "}
                      <a className="ed-link" href={link.href} onClick={(e) => e.stopPropagation()}>
                        {link.label}
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="ed-tune">
              <div className="ed-tones" role="group" aria-label="Tone">
                {toneList.map((t) => (
                  <button key={t.id} type="button" className="ed-tone" aria-pressed={edited === null && t.id === toneId} onClick={() => pickTone(t.id)}>
                    {t.label}
                  </button>
                ))}
                <button type="button" className="ed-edit-btn" aria-label="Edit text" aria-pressed={editing} onClick={() => setEditing((v) => !v)}>
                  <Pencil />
                </button>
              </div>
              <span className="ed-hint">{"⌘"} Enter to send</span>
            </div>
          </div>
        )}
      </Smooth>

      <div className="ed-foot">
        <span className="ed-agent">{agent}</span>
        <span key={badge} className="ed-badge" data-tone={phase === "discarded" ? "muted" : undefined}>
          {badge}
        </span>
        {!done && (
          <div className="ed-buttons">
            <button type="button" className="ed-btn" onClick={discard} disabled={sending}>
              Discard
            </button>
            <button type="button" className="ed-btn ed-btn--primary" onClick={send} disabled={sending} aria-busy={sending}>
              {sending && <span className="ed-spinner" aria-hidden />}
              {sending ? "Sending" : "Send email"}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

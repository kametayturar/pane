"use client"

import * as React from "react"
import {
  ArrowUp,
  AtSign,
  BarChart3,
  Brush,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Folder,
  Hash,
  Home,
  Image as ImageIcon,
  Inbox,
  Camera,
  ListChecks,
  Megaphone,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Music2,
  PanelRight,
  Plus,
  Puzzle,
  Coffee,
  Sparkles,
  Users,
  Workflow,
  X,
  Pin,
  PenLine,
  type LucideIcon,
} from "lucide-react"

import { AppShell, Rays, ShellButton, type ShellNavGroup, type ShellUser } from "./app-shell"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type AgentChatProps = {
  onNavigate?: (label: string) => void
  workspace?: string
  user?: ShellUser
  sideTools?: React.ReactNode
  className?: string
}

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "agent"; paragraphs: string[]; worked?: string; agents?: boolean; live?: boolean }

/* -------------------------------------------------------------------------- */
/*                                Demo content                                */
/* -------------------------------------------------------------------------- */

const ANGLES = [
  { name: "Ritual", sub: "Slow mornings, done right", strength: 3 },
  { name: "Problem–solution", sub: "Bitter, rushed coffee", strength: 2 },
  { name: "Social proof", sub: "1,200 sold, 4.9 stars", strength: 1 },
]
const AUDIENCE = ["Coffee hobbyists", "Ages 25–40", "Home office", "Gift buyers"]
const CHANNELS: { name: string; sub: string; icon: LucideIcon; on: boolean }[] = [
  { name: "Instagram", sub: "Feed and Stories", icon: Camera, on: true },
  { name: "TikTok", sub: "Story format only", icon: Music2, on: true },
  { name: "Pinterest", sub: "Pins and Banner", icon: Pin, on: false },
]
const PALETTE = [
  { name: "Clay", color: "#c9a27e" },
  { name: "Sage", color: "#9aa58f" },
  { name: "Cream", color: "#f3ece0" },
  { name: "Espresso", color: "#3b2a22" },
]
const FORMATS = [
  { name: "Feed", w: 16, h: 16 },
  { name: "Story", w: 11, h: 18 },
  { name: "Banner", w: 22, h: 13 },
]
const AGENTS: { name: string; icon: LucideIcon }[] = [
  { name: "Campaign manager", icon: Megaphone },
  { name: "Brand research", icon: AtSign },
  { name: "Creative pipeline", icon: Brush },
  { name: "Audience research", icon: Users },
  { name: "Copywriter", icon: PenLine },
]
const WORKED_STEPS = [
  "Checked the Shopify sync – 26 of 44 products imported",
  "Ranked synced products by revenue this month",
  "Read the brand voice notes and last autumn's best ads",
  "Matched audiences from the newsletter segments",
]

const CHAT_NAV = (hasChat: boolean): ShellNavGroup[] => [
  {
    items: [
      { label: "Home", icon: Home },
      { label: "Chat", icon: MessageSquare },
      { label: "Analytics", icon: BarChart3 },
      { label: "Plan", icon: ListChecks },
      { label: "Deliverables", icon: Inbox },
      { label: "On Slack", icon: Hash },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Campaign", icon: Megaphone },
      { label: "Creatives", icon: ImageIcon },
      { label: "Briefs", icon: ClipboardList },
      { label: "Workflows", icon: Workflow },
    ],
  },
  { label: "Chats", items: hasChat ? [{ label: "Plan the autumn campaign", icon: MessageSquare }] : [], empty: "No chats yet" },
]

const FIRST_MESSAGES: Message[] = [
  { id: 1, role: "user", text: "Ritual" },
  {
    id: 2,
    role: "agent",
    worked: "Worked for 2m 51s",
    agents: true,
    paragraphs: [
      "I'll check what's selling first, then set up the creative run.",
      "Your top product this month is the Ceramic Pour-Over Set (Shopify is about 60% synced, so treat that ranking as provisional).",
      "Before I write the brief and generate ads, I need one decision that shapes all of the copy: which angle should we lead with?",
    ],
  },
]

function replyTo(text: string): string[] {
  const angle = ANGLES.find((a) => a.name === text)
  if (angle)
    return [
      `Got it – ${angle.name.toLowerCase()} it is. I've updated the brief, so the hook leads with “${angle.sub.toLowerCase()}”.`,
      "Check the channels and formats on the right, then generate the ads when you're ready.",
    ]
  return [
    "On it. I've passed that to the Campaign manager and noted it in the brief.",
    "Anything else before I generate the ads?",
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ac { container-type: inline-size; position: relative; display: flex; flex: 1; min-width: 0; min-height: 0 }
.ac-main { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0 }
.ac-bar { display: flex; align-items: center; gap: 12px; height: 52px; flex: none; padding: 0 12px 0 20px; border-bottom: 1px solid var(--as-line); color: var(--as-muted) }
.as[data-side="closed"] .ac-bar { padding-left: 52px }
.ac-crumbs { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 13.5px }
.ac-crumbs svg { width: 15px; height: 15px }
.ac-crumbs strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--as-ink) }
.ac-tools { display: flex; gap: 2px; margin-left: auto }

/* Thread */
.ac-thread { flex: 1; min-height: 0; overflow-y: auto; padding: 40px 32px 16px; scroll-behavior: smooth }
.ac-column { display: flex; flex-direction: column; gap: 22px; max-width: 680px; margin: 0 auto }
.ac-user {
  align-self: flex-end; max-width: 80%; padding: 8px 14px; border-radius: 14px; background: var(--as-fill);
  font-size: 14px; line-height: 19px; color: var(--as-ink); animation: as-rise .38s var(--as-ease) backwards;
}
.ac-answer { display: flex; flex-direction: column; gap: 14px; font-size: 14px; line-height: 22.4px; color: var(--as-ink); animation: as-rise .38s var(--as-ease) backwards }
.ac-answer p { margin: 0 }
.ac-who { display: flex; align-items: center; gap: 8px; font-weight: 500 }
.ac-avatar { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--as-fill) }
.ac-avatar svg { width: 12px; height: 12px }
.ac-who .as-shimmer { font-weight: 400; color: var(--as-muted) }
.ac .ac-worked { display: flex; align-items: center; gap: 6px; width: max-content; font-size: 13px; line-height: 20.8px; color: var(--as-muted); transition: color .16s }
.ac .ac-worked:hover { color: var(--as-ink) }
.ac-worked svg { width: 14px; height: 14px; transition: transform .3s var(--as-ease) }
.ac-worked[aria-expanded="true"] svg { transform: rotate(90deg) }
.ac-collapse { display: grid; grid-template-rows: 0fr; opacity: 0; margin-top: -14px; transition: grid-template-rows .38s var(--as-ease), opacity .24s, margin .38s var(--as-ease) }
.ac-collapse[data-open="true"] { grid-template-rows: 1fr; opacity: 1; margin-top: -6px }
.ac-collapse > div { min-height: 0; overflow: hidden }
.ac-worked-list { margin: 0; padding: 2px 0 2px 20px; list-style: none; border-left: 1px solid var(--as-line); margin-left: 6px; display: grid; gap: 4px; font-size: 13px; line-height: 19px; color: var(--as-muted) }
.ac-w { animation: as-word .42s var(--as-ease) backwards }
.ac-label { padding-top: 4px; font-size: 12.5px; line-height: 20px; color: var(--as-muted) }
.ac-agents { display: flex; flex-wrap: wrap; gap: 6px; margin-top: -6px }
.ac .ac-agent {
  display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px 0 10px; border-radius: 999px; background: var(--as-fill);
  font-size: 13px; color: var(--as-ink); transition: background-color .16s; animation: as-rise .38s var(--as-ease) backwards;
}
.ac .ac-agent:hover { background: color-mix(in oklab, var(--as-fill), var(--as-ink) 5%) }
.ac-agent svg { width: 14px; height: 14px; color: var(--as-muted) }

/* Composer */
.ac-composer { display: flex; flex-direction: column; gap: 8px; flex: none; padding: 8px 32px 24px }
.ac-composer > * { width: 100%; max-width: 680px; margin: 0 auto }
.ac-route { display: flex; align-items: center; gap: 8px; color: var(--as-muted) }
.ac-route svg { width: 15px; height: 15px }
.ac-route b { font-weight: 500; color: var(--as-ink) }
.ac-well { padding: 4px; border-radius: 18px; background: var(--as-well) }
:is(.dark, [data-theme="dark"]) .ac-well { box-shadow: inset 0 0 0 1px var(--as-line) }
.ac-card { padding: 14px 10px 8px 14px; border-radius: 14px; background: var(--as-surface); box-shadow: 0 0 0 1px var(--as-border), 0 1px 2px 0 rgb(0 0 0 / .05); transition: box-shadow .2s }
.ac-card:focus-within { box-shadow: 0 0 0 1px color-mix(in oklab, var(--as-ink) 22%, transparent), 0 1px 2px 0 rgb(0 0 0 / .05) }
.ac-field {
  display: block; width: 100%; max-height: 160px; padding: 0; border: 0; outline: none; resize: none; background: transparent;
  font: inherit; font-size: 14px; line-height: 20px; color: var(--as-ink); field-sizing: content; min-height: 20px;
}
.ac-field::placeholder { color: var(--as-faint) }
.ac-cbar { display: flex; align-items: center; gap: 2px; margin: 19px 0 0 -6px }
.ac .ac-ghost {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border-radius: 8px; font-size: 12.5px;
  color: var(--as-text); transition: background-color .16s, color .16s;
}
.ac .ac-ghost:hover { background: var(--as-hover); color: var(--as-ink) }
.ac-ghost svg { width: 15px; height: 15px; color: var(--as-muted) }
.ac .ac-ghost--model { margin-left: auto; font-weight: 500; color: var(--as-ink) }
.ac-ghost--model svg:last-child { width: 13px; height: 13px }
.ac .ac-send {
  display: grid; place-items: center; width: 30px; height: 30px; margin-left: 2px; border-radius: 50%; background: #dcdcdc; color: #fff;
  transition: background-color .2s, transform .2s var(--as-ease);
}
:is(.dark, [data-theme="dark"]) .ac .ac-send { background: #3a3a3e; color: #8b8b92 }
.ac .ac-send[data-ready] { background: var(--as-primary); color: var(--as-primary-ink) }
.ac .ac-send[data-ready]:active { transform: scale(.92) }
.ac-send svg { width: 16px; height: 16px }
.ac-tray { display: flex; align-items: center; justify-content: space-between; height: 37px; padding: 0 8px 0 6px }
.ac .ac-tray-link { display: inline-flex; align-items: center; gap: 7px; height: 26px; padding: 0 6px; border-radius: 8px; font-size: 11.5px; color: var(--as-text); transition: background-color .16s }
.ac .ac-tray-link:hover { background: var(--as-hover) }
.ac-tray-link svg { width: 15px; height: 15px; color: var(--as-muted) }
.ac .ac-tray-link--apps { gap: 10px; color: var(--as-muted) }
.ac-apps { display: flex; gap: 4px }
.ac-apps i { display: grid; place-items: center; width: 13px; height: 13px; border-radius: 3px; font-size: 8px; font-weight: 700; font-style: normal; color: #fff }

/* Brief panel */
.ac-brief { display: flex; flex-direction: column; width: 400px; flex: none; min-height: 0; border-left: 1px solid var(--as-line); background: var(--as-surface); transition: margin-right .36s var(--as-ease), transform .36s var(--as-ease) }
.ac[data-panel="closed"] .ac-brief { margin-right: -401px }
.ac-brief__bar { display: flex; align-items: center; gap: 8px; height: 52px; flex: none; padding: 0 12px 0 20px; border-bottom: 1px solid var(--as-line); font-size: 13.5px; color: var(--as-muted) }
.ac-brief__bar strong { font-weight: 500; color: var(--as-ink) }
.ac-brief__bar .as-icon-btn { margin-left: auto }
.ac-seg { position: relative; display: flex; gap: 2px; margin: 20px 20px 0; padding: 3px; border-radius: 10px; background: var(--as-fill); flex: none }
.ac-seg__thumb {
  position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 10px) / 3); border-radius: 8px; background: var(--as-surface);
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 2px 0 rgb(0 0 0 / .08); transition: transform .36s var(--as-ease);
}
:is(.dark, [data-theme="dark"]) .ac-seg__thumb { background: #2a2a2e }
.ac .ac-seg button { position: relative; flex: 1; height: 28px; border-radius: 8px; font-size: 13px; color: var(--as-muted); text-align: center; transition: color .2s }
.ac .ac-seg button[aria-selected="true"] { font-weight: 500; color: var(--as-ink) }
.ac-brief__body { flex: 1; min-height: 0; overflow-y: auto }
.ac-panel { display: flex; flex-direction: column; animation: as-rise .38s var(--as-ease) backwards }
.ac-product { display: flex; align-items: center; gap: 12px; margin: 18px 20px 6px }
.ac-thumb { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 10px; background: #efe7da; color: #7c6a4f }
.ac-thumb svg { width: 20px; height: 20px }
.ac-pinfo { display: flex; flex-direction: column; min-width: 0; font-size: 12.5px; line-height: 17px; color: var(--as-muted) }
.ac-pinfo b { font-size: 13.5px; line-height: 19px; font-weight: 500; color: var(--as-ink) }
.ac-chip { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: var(--as-green-soft); color: var(--as-green); font-size: 12px; font-weight: 500; white-space: nowrap }
.ac-section { display: flex; flex-direction: column; padding: 18px 20px; border-top: 1px solid var(--as-line) }
.ac-product + .ac-section { margin-top: 14px }
.ac-section__label { padding-bottom: 12px; font-size: 12.5px; font-weight: 500; line-height: 16px; color: var(--as-faint) }
.ac .ac-option {
  display: flex; align-items: center; gap: 10px; width: calc(100% + 20px); height: 46px; margin: 0 -10px; padding: 0 10px; border-radius: 10px;
  transition: background-color .2s;
}
.ac .ac-option:hover { background: var(--as-hover) }
.ac .ac-option[aria-checked="true"] { background: var(--as-fill) }
.ac-radio { width: 14px; height: 14px; flex: none; border-radius: 50%; box-shadow: inset 0 0 0 1px #d4d4d4; transition: box-shadow .26s var(--as-ease) }
:is(.dark, [data-theme="dark"]) .ac-radio { box-shadow: inset 0 0 0 1px #4a4a50 }
.ac-option[aria-checked="true"] .ac-radio { box-shadow: inset 0 0 0 4px var(--as-ink) }
.ac-option__name { display: flex; flex-direction: column; flex: 1; min-width: 0; font-size: 13.5px; font-weight: 500; line-height: 18px; color: var(--as-ink) }
.ac-option__name span { font-size: 12.5px; font-weight: 400; line-height: 17px; color: var(--as-muted) }
.ac-signal { display: flex; align-items: flex-end; gap: 2px; height: 11px }
.ac-signal i { width: 3px; border-radius: 1px; background: var(--as-border) }
.ac-signal i[data-on] { background: #22a05a }
.ac-pills { display: flex; flex-wrap: wrap; gap: 8px }
.ac .ac-pill {
  display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--as-border);
  font-size: 12.5px; color: var(--as-text); transition: background-color .16s, color .16s, box-shadow .16s;
}
.ac .ac-pill:hover { background: var(--as-hover) }
.ac .ac-pill[aria-pressed="false"] { color: var(--as-faint); box-shadow: inset 0 0 0 1px var(--as-line); text-decoration: line-through }
.ac-channels { display: grid; gap: 4px }
.ac .ac-channel { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 44px }
.ac-channel > svg { width: 16px; height: 16px; color: var(--as-muted) }
.ac-channel .ac-option__name { font-size: 13.5px }
.ac-switch { position: relative; width: 30px; height: 18px; flex: none; border-radius: 999px; background: #e5e5e5; transition: background-color .26s }
:is(.dark, [data-theme="dark"]) .ac-switch { background: #3a3a3e }
.ac-switch::after {
  content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / .2); transition: transform .3s var(--as-ease);
}
[aria-checked="true"] > .ac-switch { background: var(--as-ink) }
:is(.dark, [data-theme="dark"]) [aria-checked="true"] > .ac-switch::after { background: #171717 }
[aria-checked="true"] > .ac-switch::after { transform: translateX(12px) }
.ac-split { display: flex; gap: 16px; padding: 18px 20px; border-top: 1px solid var(--as-line) }
.ac-split > div { display: flex; flex-direction: column }
.ac-split > div + div { margin-left: auto }
.ac-swatches { display: flex; gap: 14px; font-size: 12px; line-height: 16px; color: var(--as-muted) }
.ac-swatch { display: flex; flex-direction: column; align-items: center; gap: 6px }
.ac-swatch i { width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .08) }
.ac .ac-format { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; line-height: 16px; color: var(--as-muted) }
.ac-format span { display: grid; place-items: center; height: 20px }
.ac-format i { border-radius: 3px; box-shadow: inset 0 0 0 1.5px var(--as-faint); transition: box-shadow .2s }
.ac-format[aria-pressed="true"] { color: var(--as-ink) }
.ac-format[aria-pressed="true"] i { box-shadow: inset 0 0 0 1.5px var(--as-ink) }
.ac-details { display: grid; gap: 12px }
.ac-details div { display: flex; justify-content: space-between; color: var(--as-muted) }
.ac-details b { font-weight: 500; color: var(--as-ink) }
.ac-go { display: flex; align-items: center; gap: 4px; flex: none; padding: 16px 20px 20px; border-top: 1px solid var(--as-line); background: var(--as-surface) }
.ac-tag { padding: 2px 8px; border-radius: 999px; background: var(--as-fill); font-size: 12px; color: var(--as-text); font-variant-numeric: tabular-nums }
.ac-go .as-btn { margin-left: auto }

/* Assets */
.ac-empty { display: grid; justify-items: center; gap: 6px; margin: 48px 28px; text-align: center }
.ac-empty svg { width: 20px; height: 20px; margin-bottom: 4px; color: var(--as-subtle) }
.ac-empty strong { font-size: 13.5px; font-weight: 500; color: var(--as-ink) }
.ac-empty span { max-width: 240px; color: var(--as-muted) }
.ac-empty .as-btn { margin-top: 10px }
.ac-assets { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 20px }
.ac-asset { display: flex; flex-direction: column; gap: 6px; animation: ac-tile .5s var(--as-ease) backwards }
.ac-asset__art {
  position: relative; display: flex; align-items: flex-end; padding: 10px; overflow: hidden; border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / .06); font-size: 12px; font-weight: 600; line-height: 15px;
}
.ac-asset__art svg { position: absolute; right: 10px; top: 10px; width: 22px; height: 22px; opacity: .55 }
.ac-asset__meta { font-size: 12px; color: var(--as-muted) }

/* Activity */
.ac-activity { margin: 0; padding: 20px; list-style: none }
.ac-activity li { position: relative; display: flex; flex-direction: column; padding: 0 0 18px 20px; animation: as-rise .38s var(--as-ease) backwards }
.ac-activity li::before { content: ""; position: absolute; left: 3px; top: 7px; width: 7px; height: 7px; border-radius: 50%; background: var(--as-border) }
.ac-activity li:first-child::before { background: var(--as-accent) }
.ac-activity li:not(:last-child)::after { content: ""; position: absolute; left: 6px; top: 18px; bottom: 2px; width: 1px; background: var(--as-line) }
.ac-activity b { font-weight: 400; color: var(--as-ink) }
.ac-activity span { font-size: 12px; color: var(--as-muted) }

.ac-scrim { display: none }
@container (max-width: 999px) {
  .ac-brief { position: absolute; top: 0; right: 0; bottom: 0; z-index: 20; box-shadow: -12px 0 32px -12px rgb(0 0 0 / .18); margin-right: 0 !important; max-width: 100% }
  .ac[data-panel="closed"] .ac-brief { transform: translateX(calc(100% + 24px)) }
  .ac[data-panel="open"] .ac-scrim { display: block; position: absolute; inset: 0; z-index: 15; background: rgb(0 0 0 / .12); animation: as-fade .2s ease backwards }
  .ac-thread { padding: 28px 20px 12px }
  .ac-composer { padding: 8px 20px 20px }
}

@keyframes as-word { from { opacity: 0; filter: blur(3px) } }
@keyframes ac-tile { from { opacity: 0; transform: translateY(6px) scale(.96) } }
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

/** Reveals paragraphs word by word at a steady pace (each word fades out of a light blur). */
function useReveal(paragraphs: string[], enabled: boolean, wps = 38) {
  const total = React.useMemo(() => paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0), [paragraphs])
  const [count, setCount] = React.useState(enabled ? 0 : total)
  React.useEffect(() => {
    if (!enabled) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const n = Math.min(total, Math.floor(((t - start) / 1000) * wps))
      setCount(n)
      if (n < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [enabled, total, wps])
  return enabled ? count : total
}

function AgentMessage({ msg, onDone }: { msg: Extract<Message, { role: "agent" }>; onDone?: () => void }) {
  const [thinking, setThinking] = React.useState(!!msg.live)
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!thinking) return
    const id = window.setTimeout(() => setThinking(false), 1100)
    return () => window.clearTimeout(id)
  }, [thinking])
  const shown = useReveal(msg.paragraphs, !!msg.live && !thinking)
  const total = msg.paragraphs.reduce((n, p) => n + p.split(/\s+/).length, 0)
  const doneRef = React.useRef(false)
  React.useEffect(() => {
    if (msg.live && !thinking && shown >= total && !doneRef.current) {
      doneRef.current = true
      onDone?.()
    }
  }, [msg.live, thinking, shown, total, onDone])

  let left = msg.live ? (thinking ? 0 : shown) : Infinity
  return (
    <div className="ac-answer">
      <div className="ac-who">
        <span className="ac-avatar" aria-hidden>
          <Workflow />
        </span>
        Orchestrator
        {thinking && (
          <span className="as-shimmer" data-text="Routing your request…">
            Routing your request…
          </span>
        )}
      </div>
      {msg.paragraphs.map((p, pi) => {
        if (left <= 0) return null
        const words = p.split(/(\s+)/)
        const out: React.ReactNode[] = []
        for (let i = 0; i < words.length; i++) {
          if (/^\s+$/.test(words[i])) {
            out.push(words[i])
            continue
          }
          if (left <= 0) break
          left--
          out.push(
            <span key={i} className={msg.live ? "ac-w" : undefined}>
              {words[i]}
            </span>,
          )
        }
        const para = (
          <React.Fragment key={pi}>
            <p>{out}</p>
            {pi === 0 && msg.worked && (
              <>
                <button type="button" className="ac-worked" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                  <ChevronRight aria-hidden />
                  {msg.worked}
                </button>
                <div className="ac-collapse" data-open={open}>
                  <div>
                    <ul className="ac-worked-list">
                      {WORKED_STEPS.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </React.Fragment>
        )
        return para
      })}
      {msg.agents && (
        <>
          <div className="ac-label">Agents working</div>
          <div className="ac-agents">
            {AGENTS.map((a, i) => (
              <button key={a.name} type="button" className="ac-agent" style={{ animationDelay: `${120 + i * 60}ms` }}>
                <a.icon aria-hidden />
                {a.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AssetTile({ i, channel, format, headline }: { i: number; channel: string; format: (typeof FORMATS)[number]; headline: string }) {
  const bg = PALETTE[i % PALETTE.length]
  const ink = bg.name === "Espresso" || bg.name === "Sage" ? "#f6f1e7" : "#2b2b2e"
  const ratio = format.name === "Story" ? "9 / 14" : format.name === "Banner" ? "16 / 9" : "1 / 1"
  return (
    <div className="ac-asset" style={{ animationDelay: `${i * 90}ms` }}>
      <div className="ac-asset__art" style={{ aspectRatio: ratio, background: `linear-gradient(160deg, ${bg.color}, color-mix(in oklab, ${bg.color}, #000 12%))`, color: ink }}>
        <Coffee aria-hidden style={{ color: ink }} />
        {headline}
      </div>
      <span className="ac-asset__meta">
        {channel} · {format.name}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 AgentChat                                  */
/* -------------------------------------------------------------------------- */

export function AgentChat({ onNavigate, workspace = "Northwind", user = { name: "Sam Rivera" }, sideTools, className }: AgentChatProps) {
  const [messages, setMessages] = React.useState<Message[]>(FIRST_MESSAGES)
  const [draft, setDraft] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [panel, setPanel] = React.useState(true)
  const [tab, setTab] = React.useState<"Brief" | "Assets" | "Activity">("Brief")
  const [angle, setAngle] = React.useState(ANGLES[0].name)
  const [audience, setAudience] = React.useState<Record<string, boolean>>(() => Object.fromEntries(AUDIENCE.map((a) => [a, true])))
  const [channels, setChannels] = React.useState<Record<string, boolean>>(() => Object.fromEntries(CHANNELS.map((c) => [c.name, c.on])))
  const [formats, setFormats] = React.useState<Record<string, boolean>>(() => Object.fromEntries(FORMATS.map((f) => [f.name, true])))
  const [generating, setGenerating] = React.useState(false)
  const [assets, setAssets] = React.useState<{ channel: string; format: (typeof FORMATS)[number] }[]>([])
  const [activity, setActivity] = React.useState([
    { text: "Angle set to Ritual", time: "1 min ago" },
    { text: "Brand research pulled the autumn palette", time: "2 min ago" },
    { text: "Ceramic Pour-Over Set picked as top product", time: "4 min ago" },
    { text: "Shopify sync started", time: "5 min ago" },
    { text: "Brief “Autumn drop” created", time: "6 min ago" },
  ])
  const nextId = React.useRef(10)
  const threadRef = React.useRef<HTMLDivElement>(null)
  const log = (text: string) => setActivity((a) => [{ text, time: "just now" }, ...a])

  const activeChannels = CHANNELS.filter((c) => channels[c.name])
  const activeFormats = FORMATS.filter((f) => formats[f.name])
  const ads = activeChannels.length * activeFormats.length
  const headline = ANGLES.find((a) => a.name === angle)?.sub ?? ""

  React.useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setMessages((m) => [
      ...m,
      { id: nextId.current++, role: "user", text: t },
      { id: nextId.current++, role: "agent", paragraphs: replyTo(t), live: true },
    ])
    setBusy(true)
  }

  const pickAngle = (name: string) => {
    if (name === angle) return
    setAngle(name)
    log(`Angle set to ${name}`)
    send(name)
  }

  const generate = () => {
    if (generating || !ads) return
    setGenerating(true)
    window.setTimeout(() => {
      setAssets(activeChannels.flatMap((c) => activeFormats.map((f) => ({ channel: c.name, format: f }))))
      setGenerating(false)
      log(`${ads} ads generated for “${angle}”`)
      setTab("Assets")
    }, 2600)
  }

  const goButton = (
    <ShellButton
      variant="primary"
      label={generating ? "Generating…" : assets.length ? "Generate again" : "Generate ads"}
      icon={generating ? <Rays /> : undefined}
      onClick={generate}
      disabled={!ads}
    />
  )
  const tabIndex = ["Brief", "Assets", "Activity"].indexOf(tab)

  return (
    <AppShell nav={CHAT_NAV(messages.length > 2)} active="Chat" onNavigate={onNavigate} workspace={workspace} user={user} sideTools={sideTools} className={className}>
      <style href="agent-chat" precedence="default">
        {CSS}
      </style>
      <div className="ac" data-panel={panel ? "open" : "closed"}>
        <div className="ac-main">
          <header className="ac-bar">
            <nav className="ac-crumbs" aria-label="Breadcrumb">
              <MessageSquare aria-hidden />
              Chat
              <span aria-hidden>/</span>
              <strong>Plan the autumn campaign</strong>
              <button type="button" className="as-icon-btn" aria-label="Chat options">
                <MoreHorizontal />
              </button>
            </nav>
            <div className="ac-tools">
              <button type="button" className="as-icon-btn" aria-label="Plan">
                <ListChecks />
              </button>
              <button type="button" className="as-icon-btn" aria-label={panel ? "Hide brief" : "Show brief"} aria-pressed={panel} onClick={() => setPanel((p) => !p)}>
                <PanelRight />
              </button>
            </div>
          </header>

          <div className="ac-thread" ref={threadRef}>
            <div className="ac-column" aria-live="polite">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="ac-user">
                    {m.text}
                  </div>
                ) : (
                  <AgentMessage key={m.id} msg={m} onDone={() => setBusy(false)} />
                ),
              )}
            </div>
          </div>

          <form
            className="ac-composer"
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
              setDraft("")
            }}
          >
            <div className="ac-route">
              <Workflow aria-hidden />
              <b>Orchestrator</b> Routes each request
            </div>
            <div className="ac-well">
              <div className="ac-card">
                <textarea
                  className="ac-field"
                  rows={1}
                  value={draft}
                  placeholder="Ask anything or @ to add context"
                  aria-label="Message"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send(draft)
                      setDraft("")
                    }
                  }}
                />
                <div className="ac-cbar">
                  <button type="button" className="as-icon-btn" aria-label="Add">
                    <Plus />
                  </button>
                  <button type="button" className="ac-ghost">
                    <Puzzle aria-hidden />
                    Plugins
                  </button>
                  <button type="button" className="ac-ghost ac-ghost--model">
                    <Sparkles aria-hidden />
                    Auto
                    <ChevronDown aria-hidden />
                  </button>
                  <button type="button" className="as-icon-btn" aria-label="Voice input">
                    <Mic />
                  </button>
                  <button type="submit" className="ac-send" aria-label="Send" data-ready={draft.trim() && !busy ? "" : undefined}>
                    <ArrowUp />
                  </button>
                </div>
              </div>
              <div className="ac-tray">
                <button type="button" className="ac-tray-link">
                  <Folder aria-hidden />
                  Work in a folder
                </button>
                <button type="button" className="ac-tray-link ac-tray-link--apps">
                  Connect apps
                  <span className="ac-apps" aria-hidden>
                    <i style={{ background: "#ea4335" }}>M</i>
                    <i style={{ background: "#4a154b" }}>#</i>
                    <i style={{ background: "#0f9d58" }}>S</i>
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="ac-scrim" onClick={() => setPanel(false)} aria-hidden />
        <aside className="ac-brief" aria-label="Brief">
          <div className="ac-brief__bar">
            Brief <span aria-hidden>/</span> <strong>Autumn drop</strong>
            <button type="button" className="as-icon-btn" aria-label="Close brief" onClick={() => setPanel(false)}>
              <X />
            </button>
          </div>
          <div className="ac-seg" role="tablist" aria-label="Brief views">
            <span className="ac-seg__thumb" style={{ transform: `translateX(calc(${tabIndex * 100}% + ${tabIndex * 2}px))` }} aria-hidden />
            {(["Brief", "Assets", "Activity"] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          <div className="ac-brief__body">
            {tab === "Brief" && (
              <div key="brief" className="ac-panel" role="tabpanel">
                <div className="ac-product">
                  <span className="ac-thumb" aria-hidden>
                    <Coffee />
                  </span>
                  <span className="ac-pinfo">
                    <b>Ceramic Pour-Over Set</b>
                    $64 · 318 sold this month
                  </span>
                  <span className="ac-chip">Bestseller</span>
                </div>

                <div className="ac-section">
                  <div className="ac-section__label">Selling angle</div>
                  <div role="radiogroup" aria-label="Selling angle">
                    {ANGLES.map((a) => (
                      <button key={a.name} type="button" role="radio" aria-checked={angle === a.name} className="ac-option" onClick={() => pickAngle(a.name)}>
                        <span className="ac-radio" aria-hidden />
                        <span className="ac-option__name">
                          {a.name}
                          <span>{a.sub}</span>
                        </span>
                        <span className="ac-signal" aria-label={`Strength ${a.strength} of 3`}>
                          {[4, 7, 10].map((h, i) => (
                            <i key={h} style={{ height: h }} data-on={i < a.strength || undefined} />
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ac-section">
                  <div className="ac-section__label">Audience</div>
                  <div className="ac-pills">
                    {AUDIENCE.map((a) => (
                      <button key={a} type="button" className="ac-pill" aria-pressed={audience[a]} onClick={() => setAudience((s) => ({ ...s, [a]: !s[a] }))}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ac-section">
                  <div className="ac-section__label">Channels</div>
                  <div className="ac-channels">
                    {CHANNELS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        role="switch"
                        aria-checked={channels[c.name]}
                        className="ac-channel"
                        onClick={() => setChannels((s) => ({ ...s, [c.name]: !s[c.name] }))}
                      >
                        <c.icon aria-hidden />
                        <span className="ac-option__name">
                          {c.name}
                          <span>{c.sub}</span>
                        </span>
                        <span className="ac-switch" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ac-split">
                  <div>
                    <div className="ac-section__label">Palette</div>
                    <div className="ac-swatches">
                      {PALETTE.map((p) => (
                        <span key={p.name} className="ac-swatch">
                          <i style={{ background: p.color }} aria-hidden />
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="ac-section__label">Formats</div>
                    <div className="ac-swatches">
                      {FORMATS.map((f) => (
                        <button key={f.name} type="button" className="ac-format" aria-pressed={formats[f.name]} onClick={() => setFormats((s) => ({ ...s, [f.name]: !s[f.name] }))}>
                          <span aria-hidden>
                            <i style={{ width: f.w, height: f.h }} />
                          </span>
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ac-section">
                  <div className="ac-section__label">Details</div>
                  <div className="ac-details">
                    <div>
                      Launch <b>Mon, Oct 6</b>
                    </div>
                    <div>
                      Budget <b>$1,800 / week</b>
                    </div>
                    <div>
                      Markets <b>US, CA, DE</b>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "Assets" && (
              <div key="assets" className="ac-panel" role="tabpanel">
                {assets.length ? (
                  <div className="ac-assets">
                    {assets.map((a, i) => (
                      <AssetTile key={`${a.channel}-${a.format.name}`} i={i} channel={a.channel} format={a.format} headline={headline} />
                    ))}
                  </div>
                ) : (
                  <div className="ac-empty">
                    <ImageIcon aria-hidden />
                    <strong>No assets yet</strong>
                    <span>Fill in the brief and generate ads – they show up here.</span>
                    {goButton}
                  </div>
                )}
              </div>
            )}

            {tab === "Activity" && (
              <ul key="activity" className="ac-activity ac-panel" role="tabpanel">
                {activity.map((a, i) => (
                  <li key={`${a.text}-${activity.length - i}`}>
                    <b>{a.text}</b>
                    <span>{a.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ac-go">
            <span className="ac-tag">{ads} ads</span>
            <span className="ac-tag">~{Math.max(1, Math.ceil(ads / 3))} min</span>
            {goButton}
          </div>
        </aside>
      </div>
    </AppShell>
  )
}

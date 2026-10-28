"use client"

import * as React from "react"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  File as FileIcon,
  Globe,
  Hexagon,
  Diamond,
  Paperclip,
  Pencil,
  RotateCw,
  Search,
  Sparkles,
  Square,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Timer,
  TriangleAlert,
  X,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ChatModel = {
  id: string
  name: string
  /** One short line under the name in the menu. */
  note?: string
  /** A tiny glyph. Use a built-in mark or pass your own 16px node. */
  mark?: "spark" | "hex" | "diamond" | React.ReactNode
  /** Tints a built-in mark. */
  color?: string
}

export type ChatSource = { title: string; domain: string; snippet?: string; url?: string }

export type ChatTool = {
  id: string
  /** Label while running, e.g. "Searching the web". */
  name: string
  status: "running" | "done" | "error"
  /** Short result, e.g. "4 sources" or "40,213 rows". */
  summary?: string
  /** A search tool lists the sources it found. */
  sources?: ChatSource[]
  /** A query tool shows its input and output. */
  input?: string
  output?: string
}

export type AiChatMessage = {
  id: string
  role: "user" | "assistant"
  /** Markdown subset: paragraphs, lists, short headings, **bold**, `code`, fenced code blocks and [n] citations. */
  content: string
  /** Id of the model that wrote an assistant message. */
  model?: string
  reasoning?: string
  /** Seconds the model thought, shown as "Thought for 4s". */
  thoughtFor?: number
  tools?: ChatTool[]
  /** Sources that [n] citations index into (1 based). */
  sources?: ChatSource[]
  status?: "streaming" | "done" | "stopped" | "error"
  error?: string
  feedback?: "up" | "down" | null
}

export type ChatStreamEvent =
  | { type: "reasoning"; delta: string }
  | { type: "reasoning-end"; seconds?: number }
  | { type: "tool"; tool: ChatTool }
  | { type: "sources"; sources: ChatSource[] }
  | { type: "text"; delta: string }
  | { type: "error"; message: string }

export type ChatRespond = (messages: AiChatMessage[], options: { signal: AbortSignal; model: ChatModel }) => AsyncIterable<ChatStreamEvent>

export type AiChatHistoryItem = { id: string; title: string; group?: string; messages: AiChatMessage[] }

export type ChatSuggestion = { label: string; prompt?: string; icon?: "database" | "timer" | "activity" | "search" }

export type AiChatProps = {
  /** Streams one reply for the messages on screen. Throw or yield an error event to fail it with a Retry; Stop aborts the signal. Without it the chat plays scripted, simulated replies. */
  respond?: ChatRespond
  /** Models in the header menu. */
  models?: ChatModel[]
  /** Id of the model selected first. */
  defaultModel?: string
  /** The open conversation, alternating user and assistant messages. A trailing user message is answered when the card first scrolls into view. */
  initialMessages?: AiChatMessage[]
  /** Title of the open conversation. Defaults to one taken from its first message. */
  title?: string
  /** Earlier conversations in the title menu. Defaults to sample chats only in the simulated preview. */
  history?: AiChatHistoryItem[]
  /** Up to three prompts in the empty state. */
  suggestions?: ChatSuggestion[]
  /** Heading of the empty state. */
  greeting?: string
  /** Composer placeholder. */
  placeholder?: string
  /** Plays a two turn scripted conversation once the card is in view. Defaults to true only without `respond` and `initialMessages`. */
  autoPlay?: boolean
  /** A reply was rated, or the rating cleared. Without it the rating is kept locally and announced as simulated. */
  onFeedback?: (message: AiChatMessage, value: "up" | "down" | null) => void
  /** A model was picked. New replies use it; earlier replies keep the mark of the model that wrote them. */
  onModelChange?: (model: ChatModel) => void
  /** The New chat button or menu item was used. */
  onNewChat?: () => void
  /** Class on the root. Set `--chat-height` to embed it and `--chat-column` (default 760px) for the conversation width. */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                         Conversation tree (versions)                       */
/* -------------------------------------------------------------------------- */

type Reply = {
  id: string
  model: string
  reasoning: string
  thoughtFor?: number
  reasoningDone: boolean
  tools: ChatTool[]
  sources: ChatSource[]
  /** Everything revealed so far. */
  content: string
  /** Start offsets of the newest chunks, which fade in once. */
  bounds: number[]
  status: "streaming" | "done" | "stopped" | "error"
  error?: string
  feedback: "up" | "down" | null
}
type Version = { user: string; files: string[]; reply: Reply | null; next: Turn | null }
type Turn = { id: string; active: number; versions: Version[] }
type Chat = { id: string; title: string; auto: boolean; group: string; root: Turn | null }

let seq = 0
const nid = (p: string) => `${p}${++seq}`

const emptyReply = (model: string): Reply => ({ id: nid("r"), model, reasoning: "", reasoningDone: false, tools: [], sources: [], content: "", bounds: [], status: "streaming", feedback: null })

function fromMessages(messages: AiChatMessage[], fallbackModel: string): Turn | null {
  let root: Turn | null = null
  let tail: Version | null = null
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (m.role !== "user") continue
    const a = messages[i + 1]?.role === "assistant" ? messages[i + 1] : undefined
    const reply: Reply | null = a
      ? {
          id: a.id,
          model: a.model ?? fallbackModel,
          reasoning: a.reasoning ?? "",
          thoughtFor: a.thoughtFor,
          reasoningDone: true,
          tools: a.tools ?? [],
          sources: a.sources ?? [],
          content: a.content,
          bounds: [],
          status: a.status === "stopped" ? "stopped" : a.status === "error" ? "error" : "done",
          error: a.error,
          feedback: a.feedback ?? null,
        }
      : null
    const turn: Turn = { id: m.id, active: 0, versions: [{ user: m.content, files: [], reply, next: null }] }
    if (tail) tail.next = turn
    else root = turn
    tail = turn.versions[0]
  }
  return root
}

/** The visible branch: each turn with its active version. */
function chainOf(root: Turn | null) {
  const out: { turn: Turn; version: Version }[] = []
  for (let t = root; t; ) {
    const v = t.versions[t.active]
    out.push({ turn: t, version: v })
    t = v.next
  }
  return out
}

function mapAt(turn: Turn | null, depth: number, fn: (t: Turn) => Turn): Turn | null {
  if (!turn) return turn
  if (depth === 0) return fn(turn)
  const v = turn.versions[turn.active]
  const versions = turn.versions.slice()
  versions[turn.active] = { ...v, next: mapAt(v.next, depth - 1, fn) }
  return { ...turn, versions }
}

const withReply = (fn: (r: Reply) => Reply) => (t: Turn): Turn => {
  const versions = t.versions.slice()
  const v = versions[t.active]
  if (v.reply) versions[t.active] = { ...v, reply: fn(v.reply) }
  return { ...t, versions }
}

const appendTurn = (root: Turn | null, turn: Turn): Turn => {
  if (!root) return turn
  const n = chainOf(root).length
  return mapAt(root, n - 1, (t) => {
    const versions = t.versions.slice()
    versions[t.active] = { ...versions[t.active], next: turn }
    return { ...t, versions }
  })!
}

const messagesUpTo = (root: Turn | null, depth: number): AiChatMessage[] => {
  const out: AiChatMessage[] = []
  chainOf(root).forEach(({ turn, version }, i) => {
    if (i > depth) return
    out.push({ id: turn.id, role: "user", content: version.user })
    if (i < depth && version.reply) out.push({ id: version.reply.id, role: "assistant", content: version.reply.content, model: version.reply.model })
  })
  return out
}

/* -------------------------------------------------------------------------- */
/*                               Sample content                               */
/* -------------------------------------------------------------------------- */

const SAMPLE_MODELS: ChatModel[] = [
  { id: "nova-5", name: "Nova 5", note: "Flagship for complex work", mark: "spark", color: "#d4623a" },
  { id: "atlas-2", name: "Atlas 2 Pro", note: "Everyday writing and agents", mark: "hex", color: "#0f9d7a" },
  { id: "sage-mini", name: "Sage Mini", note: "Fastest for quick answers", mark: "diamond", color: "#3b6cf0" },
  { id: "orbit-1", name: "Orbit 1 Long", note: "2M tokens of context", mark: "hex", color: "#8a5cf5" },
]

const SAMPLE_SUGGESTIONS: ChatSuggestion[] = [
  { label: "Compare two ways to cache a slow query", icon: "database" },
  { label: "Estimate the rollout time for 12 services", icon: "timer" },
  { label: "Check error rates for the payments API", icon: "activity" },
]

const SRC_ROTATE: ChatSource[] = [
  { title: "Rotating API credentials without downtime", domain: "guides.northpeak.example", snippet: "Issue the new credential first, deploy it everywhere, and revoke the old one only after its traffic drops to zero." },
  { title: "Dual-key rotation patterns", domain: "fieldnotes.example", snippet: "Two active keys let you roll services one at a time. Keep the overlap window short and watch both keys." },
  { title: "Reading key usage from your audit log", domain: "docs.kitewise.example", snippet: "Usage by key id is available per service, so you can see which callers still use the old key." },
  { title: "What to do after a secret leaks in logs", domain: "security.ledgerline.example", snippet: "Treat the secret as compromised, rotate it, and add a redaction rule so it cannot be logged again." },
]

const SCRIPT_ROTATE_TEXT = `Treat the key as compromised and rotate it in four short steps, keeping both keys valid until the very end.

1. **Create a second key.** Most providers allow two active keys at once, which is what makes a zero-downtime swap possible. [1]
2. **Deploy the new key** to every service through your secret store, one service at a time. [1][2]
3. **Watch the old key's traffic** until it stays at zero for a full day, then revoke it. [3]
4. **Scrub the leak.** Remove the line from your logs and add a redaction rule so it cannot happen again.

Check that the new key works before you move any traffic:

\`\`\`bash
curl -s https://api.example.com/v1/ping \\
  -H "Authorization: Bearer $NEW_KEY" \\
  -w "\\n%{http_code}\\n"
# expect 200 before you cut over
\`\`\`

Keep the overlap short, such as \`24h\`, so a leaked key does not stay usable longer than it has to. [4]`

const SCRIPT_USAGE_TEXT = `Seven services called the old key in the last day, but three of them account for almost all of it.

- **checkout-api:** 41,208 calls, the one to move first
- **billing-worker:** 9,331 calls, it picks up the new key on its next restart
- **reports-cron:** 212 calls, it runs nightly, so it can look idle

Move checkout, restart billing, then wait for the nightly job to run once with the new key:

\`\`\`bash
kubectl rollout restart deploy/checkout-api
kubectl rollout restart deploy/billing-worker
\`\`\`

Once the old key shows zero calls for 24 hours, revoke it.`

const GENERIC_TEXT = `Here is a quick take. Start with the smallest change that you can verify, then widen it.

- **Define done:** write the one check that proves it works
- **Change one thing:** keep the diff small enough to review in five minutes
- **Measure again:** compare against the number you started with

If you share the details, I can turn this into concrete steps.`

const SAMPLE_CHATS: AiChatHistoryItem[] = [
  {
    id: "h1",
    title: "Slow search results",
    group: "Today",
    messages: [
      { id: "h1u", role: "user", content: "Search takes 3 seconds on the products page. Where should I look first?" },
      { id: "h1a", role: "assistant", model: "nova-5", thoughtFor: 3, content: "Start with the query plan: check whether the `ILIKE` filter uses an index. Then look at how many rows the page loads. A trigram index and a page size of 24 usually brings it under 200ms." },
    ],
  },
  {
    id: "h2",
    title: "Weekly digest email",
    group: "Previous 7 days",
    messages: [
      { id: "h2u", role: "user", content: "Draft a subject line for our weekly digest." },
      { id: "h2a", role: "assistant", model: "atlas-2", content: "Try **\"Three things that moved this week\"**. It is specific, short and promises a quick read." },
    ],
  },
  {
    id: "h3",
    title: "Retry policy for webhooks",
    group: "Previous 7 days",
    messages: [
      { id: "h3u", role: "user", content: "How many times should we retry a failed webhook?" },
      { id: "h3a", role: "assistant", model: "nova-5", thoughtFor: 2, content: "Retry with exponential backoff for about 24 hours: after 1m, 5m, 30m, 2h, 6h, then every 12h. Stop after 8 tries and surface the failure in the dashboard." },
    ],
  },
]

const SUG_ICON = { database: Database, timer: Timer, activity: Activity, search: Search } as const

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ach {
  --ach-ink: #0a0a0a;
  --ach-surface: #fff;
  --ach-accent: #0060e2;
  --ach-warn: #d9480f;
  --ach-on-ink: #fff;
  --ach-t1: var(--ach-ink);
  --ach-t2: color-mix(in oklab, var(--ach-ink) 70%, transparent);
  --ach-t3: color-mix(in oklab, var(--ach-ink) 54%, transparent);
  --ach-wash: color-mix(in oklab, var(--ach-ink) 3.5%, transparent);
  --ach-hover: color-mix(in oklab, var(--ach-ink) 5%, transparent);
  --ach-soft: color-mix(in oklab, var(--ach-ink) 6%, transparent);
  --ach-line: color-mix(in oklab, var(--ach-ink) 9%, transparent);
  --ach-code-bg: color-mix(in oklab, var(--ach-ink) 1.8%, transparent);
  --ach-kw: #2f55c7;
  --ach-num: #b0672a;
  --ach-str: #1b7f5c;
  --ach-com: color-mix(in oklab, var(--ach-ink) 45%, transparent);
  --ach-glint: rgb(255 255 255 / .85);
  --ach-pop: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --ach-ease: cubic-bezier(.22, 1, .36, 1);
  --ach-spring: linear(0, .0213 2.8%, .0739 5.6%, .1443 8.3%, .2235 11.1%, .305 13.9%, .3849 16.7%, .4606 19.4%, .5305 22.2%, .594 25%, .7011 30.6%, .7836 36.1%, .8454 41.7%, .8907 47.2%, .9234 52.8%, .9467 58.3%, .9632 63.9%, .9747 69.4%, .9826 75%, .9882 80.6%, .992 86.1%, .9946 91.7%, 1);
  position: relative; display: flex; flex-direction: column; width: 100%; min-width: 0;
  height: var(--chat-height, 760px); max-height: 100%;
  container-type: inline-size; overflow: hidden; border-radius: 24px; border: 1px solid var(--ach-line); background: var(--ach-surface);
  color: var(--ach-t1);
  font-family: var(--ach-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px; line-height: 19.6px; letter-spacing: -.01em; -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ach {
  --ach-ink: #fff;
  --ach-surface: #161618;
  --ach-accent: #4d8dff;
  --ach-warn: #ff9b6b;
  --ach-on-ink: #0a0a0a;
  --ach-t2: color-mix(in oklab, var(--ach-ink) 66%, transparent);
  --ach-t3: color-mix(in oklab, var(--ach-ink) 48%, transparent);
  --ach-wash: color-mix(in oklab, var(--ach-ink) 6%, transparent);
  --ach-hover: color-mix(in oklab, var(--ach-ink) 8%, transparent);
  --ach-soft: color-mix(in oklab, var(--ach-ink) 8%, transparent);
  --ach-line: color-mix(in oklab, var(--ach-ink) 13%, transparent);
  --ach-code-bg: color-mix(in oklab, var(--ach-ink) 4%, transparent);
  --ach-kw: #8aa8ff;
  --ach-num: #f0a468;
  --ach-str: #5fd0a4;
  --ach-glint: rgb(255 255 255 / .9);
  --ach-pop: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35);
}
.ach *, .ach *::before, .ach *::after { box-sizing: border-box }
:where(.ach) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit; letter-spacing: inherit }
.ach button:disabled { cursor: default }
.ach :focus-visible { outline: 2px solid color-mix(in oklab, var(--ach-accent) 60%, transparent); outline-offset: 1px }
.ach .ach-input:focus-visible, .ach .ach-edit textarea:focus-visible { outline: none }
.ach-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }
.ach-in { animation: ach-in .16s var(--ach-ease) backwards }

/* Header */
.ach-head { position: relative; z-index: 20; flex: none; display: flex; align-items: center; gap: 2px; height: 52px; padding: 0 10px 0 18px; border-bottom: 1px solid var(--ach-soft) }
.ach-pill, .ach-iconBtn {
  display: inline-flex; align-items: center; height: 34px; border-radius: 999px; color: var(--ach-t1);
  transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease);
}
.ach-pill { gap: 6px; padding: 0 8px 0 10px; min-width: 0; font-weight: 500 }
.ach-pill:hover, .ach-pill[aria-expanded="true"], .ach-iconBtn:hover { background: var(--ach-hover) }
.ach-iconBtn { justify-content: center; width: 34px; color: var(--ach-t2) }
.ach-iconBtn:hover { color: var(--ach-t1) }
.ach-title { flex: 0 1 auto; min-width: 0 }
.ach-title > span.ach-swap { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0 }
.ach-spacer { flex: 1 }
.ach-chev { flex: none; color: var(--ach-t3); transition: transform .2s var(--ach-ease) }
[aria-expanded="true"] > .ach-chev { transform: rotate(180deg) }
.ach-swap { display: inline-flex; align-items: center; gap: 6px; min-width: 0 }
.ach-menuWrap { position: relative; min-width: 0; display: flex }
.ach-menu {
  position: absolute; top: calc(100% + 6px); z-index: 40; padding: 6px; border-radius: 18px; background: var(--ach-surface); border: 1px solid var(--ach-line); box-shadow: var(--ach-pop);
  transform-origin: 0 0; animation: ach-pop .18s var(--ach-ease) backwards;
}
.ach-menu[data-align="start"] { left: 0; width: 260px; max-width: calc(100cqw - 24px) }
.ach-menu[data-align="end"] { right: 0; width: 264px; max-width: calc(100cqw - 24px); transform-origin: 100% 0 }
.ach-mItem { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 36px; padding: 0 10px; border-radius: 12px; transition: background-color .1s var(--ach-ease) }
.ach-mItem:hover, .ach-mItem:focus-visible { background: var(--ach-wash) }
.ach-mItem:focus-visible { outline-offset: -2px }
.ach-mName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ach-mNote { display: block; font-size: 12px; line-height: 16px; color: var(--ach-t3) }
.ach-mModel { min-height: 46px; padding-block: 6px }
.ach-mText { display: grid; flex: 1; min-width: 0 }
.ach-mCheck { flex: none; width: 16px; color: var(--ach-t1) }
.ach-mSep { height: 1px; margin: 5px 0; background: var(--ach-soft) }
.ach-mLabel { padding: 10px 10px 4px; font-size: 12px; line-height: 16.8px; color: var(--ach-t3) }
.ach-mark { flex: none; display: inline-grid; place-items: center; width: 16px; height: 16px; color: var(--ach-mk, var(--ach-t1)) }
.ach-mark svg { display: block }

/* Body */
.ach-body { position: relative; flex: 1; min-height: 0 }
.ach-scroller { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain }
.ach-pane { min-height: 100%; animation: ach-pane .16s var(--ach-ease) backwards }
.ach-thread { display: grid; gap: 28px; width: 100%; max-width: var(--chat-column, 760px); margin-inline: auto; padding: 24px 28px 12px; margin-block: 0; list-style: none }
.ach-turn { min-width: 0 }
.ach-turnBody { display: grid; gap: 14px; animation: ach-rise .5s var(--ach-ease) backwards }
.ach-userRow { display: flex; align-items: flex-end; justify-content: flex-end; gap: 4px }
.ach-bubble { margin: 0; max-width: min(82%, 544px); padding: 10px 16px; border-radius: 20px; background: var(--ach-wash); font-size: 16px; line-height: 24px; white-space: pre-wrap; overflow-wrap: anywhere }
.ach-files { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; margin-bottom: -6px }
.ach-fileTag { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 8px; border-radius: 999px; border: 1px solid var(--ach-line); font-size: 12px; color: var(--ach-t2) }
.ach-actions { display: flex; align-items: center; gap: 4px; min-height: 30px; opacity: 0; transition: opacity .16s var(--ach-ease) }
.ach-userRow .ach-actions { min-height: 34px; padding-bottom: 4px }
.ach-turn:hover .ach-actions, .ach-actions:focus-within, .ach-actions[data-show] { opacity: 1 }
@media (hover: none) { .ach-actions { opacity: 1 } }
.ach-act {
  display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; color: var(--ach-t3);
  transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease), transform .58s var(--ach-spring);
}
.ach-act:hover { background: var(--ach-hover); color: var(--ach-t1) }
.ach-act:active { transform: scale(.9); transition-duration: .1s }
.ach-act[aria-pressed="true"] { color: var(--ach-t1) }
.ach-versions { display: inline-flex; align-items: center; gap: 0; color: var(--ach-t3); font-size: 12px; font-variant-numeric: tabular-nums }
.ach-versions .ach-act { width: 24px; height: 24px; border-radius: 8px }
.ach-versions span { min-width: 34px; text-align: center }

/* Editing */
.ach-edit { width: min(100%, 544px); margin-left: auto; padding: 8px; border-radius: 20px; background: var(--ach-wash); border: 1px solid var(--ach-line) }
.ach-edit textarea { display: block; width: 100%; min-height: 48px; max-height: 220px; padding: 6px 8px; border: 0; outline: 0; resize: none; background: transparent; font: inherit; font-size: 16px; line-height: 24px; color: inherit; letter-spacing: inherit }
.ach-editBar { display: flex; justify-content: flex-end; gap: 6px; padding-top: 4px }
.ach-btn { display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; font-weight: 500; transition: background-color .16s var(--ach-ease), opacity .16s }
.ach-btn:hover { background: var(--ach-hover) }
.ach-btn[data-primary] { background: var(--ach-ink); color: var(--ach-on-ink) }
.ach-btn[data-primary]:hover { opacity: .85 }
.ach-btn:disabled { opacity: .4 }

/* Reply */
.ach-reply { display: grid; gap: 10px; min-width: 0 }
.ach-replyHead { display: flex; align-items: center; gap: 6px; min-height: 28px }
.ach-replyMark { flex: none; display: inline-grid; place-items: center; width: 22px; height: 22px }
.ach-thought { display: inline-flex; align-items: center; gap: 2px; height: 28px; padding: 0 6px; border-radius: 999px; color: var(--ach-t2); transition: color .16s var(--ach-ease), background-color .16s var(--ach-ease) }
.ach-thought:hover:not(:disabled) { color: var(--ach-t1); background: var(--ach-wash) }
.ach-thought svg { transition: transform .2s var(--ach-ease) }
.ach-thought[aria-expanded="true"] svg { transform: rotate(90deg) }
.ach-modelTag { color: var(--ach-t3) }
.ach-fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s var(--ach-ease) }
.ach-fold[data-open] { grid-template-rows: 1fr }
.ach-fold > div { overflow: hidden; min-height: 0 }
.ach-reasoning { margin: 0 0 2px 11px; padding: 2px 0 2px 16px; border-left: 2px solid var(--ach-soft); color: var(--ach-t2); font-size: 14px; line-height: 21px; white-space: pre-wrap }
.ach-tools { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0 }
.ach-toolChip {
  display: inline-flex; align-items: center; gap: 8px; max-width: 100%; height: 30px; padding: 0 12px 0 10px; border-radius: 999px; border: 1px solid var(--ach-line); background: var(--ach-surface); color: var(--ach-t2);
  transition: border-color .16s var(--ach-ease), background-color .16s var(--ach-ease), color .16s var(--ach-ease);
}
.ach-toolChip:hover { background: var(--ach-wash); color: var(--ach-t1) }
.ach-toolChip[aria-expanded="true"] { border-color: color-mix(in oklab, var(--ach-ink) 18%, transparent) }
.ach-toolIcon { flex: none; display: grid; place-items: center; width: 14px; height: 14px }
.ach-toolSum { color: var(--ach-t3); white-space: nowrap }
.ach-toolName { white-space: nowrap }
.ach-marks { display: inline-flex }
.ach-marks i { display: grid; place-items: center; width: 13px; height: 13px; margin-left: -3px; border-radius: 50%; font-style: normal; font-size: 8px; font-weight: 600; line-height: 1; color: #fff; box-shadow: 0 0 0 1.5px var(--ach-surface) }
.ach-marks i:first-child { margin-left: 0 }
.ach-toolBody { width: 100%; padding-top: 6px }
.ach-srcList { display: grid; gap: 2px; margin: 0; padding: 4px; list-style: none; border-radius: 16px; border: 1px solid var(--ach-soft) }
.ach-srcRow { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 12px; color: inherit; text-decoration: none }
.ach-srcRow:hover { background: var(--ach-wash) }
.ach-fav { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; font-size: 10px; font-weight: 600; color: #fff }
.ach-srcText { display: grid; min-width: 0 }
.ach-srcTitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ach-srcDom { font-size: 12px; line-height: 16px; color: var(--ach-t3) }
.ach-io { display: grid; gap: 6px }
.ach-io pre { margin: 0; padding: 10px 12px; border-radius: 14px; background: var(--ach-code-bg); border: 1px solid var(--ach-soft); font: 12.5px/19px ui-monospace, "SF Mono", Menlo, Consolas, monospace; overflow-x: auto; color: var(--ach-t1) }
.ach-io b { font-size: 11px; font-weight: 500; letter-spacing: .02em; color: var(--ach-t3); text-transform: uppercase }

/* Markdown */
.ach-md { display: grid; gap: 12px; min-width: 0; font-size: 16px; line-height: 25.6px }
.ach-md > * { min-width: 0 }
.ach-md p, .ach-md ol, .ach-md ul, .ach-md h3, .ach-md h4, .ach-md h5 { margin: 0 }
.ach-md h3 { font-size: 18px; line-height: 26px; font-weight: 600; letter-spacing: -.02em }
.ach-md h4 { font-size: 16px; font-weight: 600 }
.ach-md h5 { font-size: 14px; font-weight: 600; color: var(--ach-t2) }
.ach-md ol, .ach-md ul { display: grid; gap: 6px; padding-left: 24px }
.ach-md ol { list-style: decimal }
.ach-md ul { list-style: none; padding-left: 20px }
.ach-md ul > li { position: relative }
.ach-md ul > li::before { content: ""; position: absolute; left: -16px; top: 11.5px; width: 5px; height: 5px; border-radius: 50%; background: var(--ach-t3) }
.ach-md ol > li { padding-left: 2px }
.ach-md ol > li::marker { color: var(--ach-t3); font-variant-numeric: tabular-nums }
.ach-md strong { font-weight: 500 }
.ach-chunk { animation: ach-chunk .15s linear backwards }
.ach-code { padding: 1px 5px; border-radius: 6px; background: var(--ach-soft); font: .86em/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: 0; overflow-wrap: anywhere }
.ach-cite { position: relative; display: inline-grid; place-items: center; min-width: 18px; height: 18px; margin: 0 1px 0 3px; padding: 0 5px; border-radius: 999px; background: var(--ach-wash); color: var(--ach-t2); font-size: 11px; line-height: 1; text-decoration: none; vertical-align: 2px; transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease) }
.ach-citeWrap { position: relative; display: inline }
.ach-cite:hover, .ach-cite:focus-visible, .ach-citeWrap[data-open] .ach-cite { background: var(--ach-line); color: var(--ach-t1) }
.ach-card {
  position: absolute; left: 50%; bottom: calc(100% + 8px); z-index: 30; width: 260px; max-width: calc(100cqw - 40px); padding: 12px; border-radius: 16px; background: var(--ach-surface); border: 1px solid var(--ach-line);
  box-shadow: var(--ach-pop); font-size: 13px; line-height: 18px; letter-spacing: -.005em; transform: translateX(-50%); animation: ach-pop .16s var(--ach-ease) backwards; pointer-events: none;
}
.ach-card b { display: block; font-weight: 500; margin-bottom: 2px }
.ach-card span { display: block; color: var(--ach-t3) }
.ach-card p { margin: 6px 0 0; color: var(--ach-t2) }
.ach-codeBlock { overflow: hidden; border-radius: 16px; border: 1px solid var(--ach-soft); background: var(--ach-code-bg); font-size: 13px }
.ach-codeHead { display: flex; align-items: center; justify-content: space-between; height: 36px; padding: 0 4px 0 14px; border-bottom: 1px solid var(--ach-soft) }
.ach-codeLang { font-size: 12px; line-height: 19px; color: var(--ach-t3) }
.ach-codeCopy { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border-radius: 10px; font-size: 12px; color: var(--ach-t2); transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease) }
.ach-codeCopy:hover { background: var(--ach-hover); color: var(--ach-t1) }
.ach-pre { margin: 0; padding: 12px 14px 14px; overflow-x: auto; font: 13px/21.45px ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: 0; tab-size: 2 }
.ach-pre .k { color: var(--ach-kw) }
.ach-pre .n { color: var(--ach-num) }
.ach-pre .s { color: var(--ach-str) }
.ach-pre .c { color: var(--ach-com) }
.ach-shimmer { position: relative }
.ach-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none;
  background: linear-gradient(90deg, transparent 38%, var(--ach-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: ach-sweep 1.6s linear infinite;
}
.ach-state { display: inline-flex; align-items: center; gap: 8px; color: var(--ach-t3) }
.ach-fail { display: flex; align-items: center; gap: 8px; color: var(--ach-warn); flex-wrap: wrap }
.ach-fail span { color: var(--ach-t2) }
.ach-replyActions { display: flex; align-items: center; gap: 4px; margin-left: -8px }

/* Empty */
.ach-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; min-height: 100%; padding: 32px 28px }
.ach-greet { margin: 0; font-size: 22px; line-height: 24.2px; font-weight: 400; letter-spacing: -.02em; text-align: center; animation: ach-rise .5s var(--ach-ease) backwards }
.ach-sugs { display: grid; gap: 6px; width: 100%; max-width: 368px; margin: 0; padding: 0; list-style: none }
.ach-sug { display: flex; align-items: center; gap: 12px; width: 100%; height: 44px; padding: 0 16px; border-radius: 18px; border: 1px solid var(--ach-line); background: var(--ach-surface); color: var(--ach-t2); animation: ach-rise .5s var(--ach-ease) backwards; transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease), transform .3s var(--ach-ease) }
.ach-sugs li:nth-child(2) .ach-sug { animation-delay: .05s }
.ach-sugs li:nth-child(3) .ach-sug { animation-delay: .1s }
.ach-sug:hover { background: var(--ach-wash); color: var(--ach-t1) }
.ach-sug:active { transform: scale(.985) }
.ach-sug svg { flex: none; color: var(--ach-t3) }

/* Jump */
.ach-jump { position: absolute; left: 50%; bottom: 10px; z-index: 5; display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px 0 10px; border-radius: 999px; background: var(--ach-surface); border: 1px solid var(--ach-line); box-shadow: var(--ach-pop); font-size: 13px; transform: translateX(-50%); animation: ach-jump .22s var(--ach-ease) backwards }

/* Composer */
.ach-dock { flex: none; padding: 6px 20px 12px }
.ach-comp { display: grid; gap: 6px; width: 100%; max-width: calc(var(--chat-column, 760px) - 56px + 0px); margin-inline: auto; padding: 7px; border-radius: 24px; border: 1px solid var(--ach-line); background: var(--ach-surface); transition: border-color .16s var(--ach-ease) }
.ach-dock { display: flex; justify-content: center }
.ach-comp:focus-within { border-color: color-mix(in oklab, var(--ach-ink) 20%, transparent) }
.ach-compFiles { display: flex; gap: 6px; overflow-x: auto; margin: 0; padding: 2px 4px 0; list-style: none; scrollbar-width: none }
.ach-compFile { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 4px 0 8px; border-radius: 999px; border: 1px solid var(--ach-line); background: var(--ach-wash); font-size: 13px; animation: ach-scale .24s var(--ach-ease) backwards }
.ach-compFile button { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; color: var(--ach-t3) }
.ach-compFile button:hover { background: var(--ach-soft); color: var(--ach-t1) }
.ach-row { display: flex; align-items: flex-end; gap: 4px }
.ach-round { flex: none; display: grid; place-items: center; width: 34px; height: 34px; margin-bottom: 1px; border-radius: 50%; color: var(--ach-t2); transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease) }
.ach-round:hover { background: var(--ach-hover); color: var(--ach-t1) }
.ach-field { flex: 1; min-width: 0 }
.ach-input { display: block; width: 100%; height: 36px; max-height: 168px; margin: 0; padding: 6px 4px; border: 0; background: transparent; resize: none; color: inherit; font: inherit; font-size: 16px; line-height: 24px; letter-spacing: inherit; outline: none; overflow-y: auto }
.ach-input::placeholder { color: var(--ach-t3) }
.ach-send { position: relative; flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--ach-wash); color: var(--ach-t3); transition: background-color .16s var(--ach-ease), color .16s var(--ach-ease), transform .58s var(--ach-spring) }
.ach-send[data-state="ready"], .ach-send[data-state="stop"] { background: var(--ach-ink); color: var(--ach-on-ink) }
.ach-send:active:not([data-state="idle"]) { transform: scale(.92); transition-duration: .1s }
.ach-glyph { position: absolute; display: grid; place-items: center; transition: transform .45s var(--ach-spring), opacity .18s var(--ach-ease) }
.ach-send[data-state="stop"] .ach-gArrow { transform: translateY(-12px) scale(.6); opacity: 0 }
.ach-send:not([data-state="stop"]) .ach-gStop { transform: scale(.4); opacity: 0 }

@keyframes ach-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes ach-chunk { from { opacity: 0 } to { opacity: 1 } }
@keyframes ach-in { from { opacity: 0; transform: translateY(2px) } to { opacity: 1; transform: none } }
@keyframes ach-pane { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes ach-rise { from { opacity: 0; transform: translateY(8px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }
@keyframes ach-pop { from { opacity: 0; transform: translateY(-4px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes ach-scale { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: none } }
@keyframes ach-jump { from { opacity: 0; transform: translate(-50%, 8px) } to { opacity: 1; transform: translateX(-50%) } }

@container (max-width: 520px) {
  .ach-thread { padding: 18px 16px 10px }
  .ach-head { padding-left: 12px }
  .ach-bubble { max-width: 90%; padding: 9px 14px }
  .ach-empty { padding: 24px 16px }
  .ach-dock { padding: 6px 12px 10px }
  .ach-md { font-size: 15px; line-height: 24px }
  .ach-md ul > li::before { top: 10.5px }
}
@container (max-width: 380px) { .ach-modelName { display: none } .ach-pill { padding-right: 8px } }
@media (prefers-reduced-motion: reduce) {
  .ach *, .ach *::before, .ach *::after { animation: none !important; transition: none !important }
  .ach-scroller { scroll-behavior: auto }
}
`

/* -------------------------------------------------------------------------- */
/*                         Small markdown, written for streaming              */
/* -------------------------------------------------------------------------- */

type Inline =
  | { t: "text"; s: number; e: number }
  | { t: "strong"; c: Inline[] }
  | { t: "code"; s: number; e: number }
  | { t: "cite"; n: number }

type Block =
  | { t: "p"; c: Inline[] }
  | { t: "h"; l: number; c: Inline[] }
  | { t: "ol"; items: Inline[][] }
  | { t: "ul"; items: Inline[][] }
  | { t: "code"; lang: string; s: number; e: number; open: boolean }

function parseInline(src: string, from: number, to: number): Inline[] {
  const out: Inline[] = []
  let i = from
  let textStart = from
  const flush = (end: number) => {
    if (end > textStart) out.push({ t: "text", s: textStart, e: end })
  }
  while (i < to) {
    const ch = src[i]
    if (ch === "`") {
      const close = src.indexOf("`", i + 1)
      if (close > -1 && close < to) {
        flush(i)
        out.push({ t: "code", s: i + 1, e: close })
        i = textStart = close + 1
        continue
      }
    } else if (ch === "*" && src[i + 1] === "*") {
      const close = src.indexOf("**", i + 2)
      if (close > -1 && close < to) {
        flush(i)
        out.push({ t: "strong", c: parseInline(src, i + 2, close) })
        i = textStart = close + 2
        continue
      }
    } else if (ch === "[") {
      const m = /^\[(\d{1,2})\]/.exec(src.slice(i, Math.min(to, i + 5)))
      if (m) {
        flush(i)
        out.push({ t: "cite", n: Number(m[1]) })
        i = textStart = i + m[0].length
        continue
      }
    }
    i++
  }
  flush(to)
  return out
}

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = []
  const lines: { s: number; e: number }[] = []
  for (let i = 0; i <= src.length; ) {
    const nl = src.indexOf("\n", i)
    const e = nl === -1 ? src.length : nl
    lines.push({ s: i, e })
    if (nl === -1) break
    i = nl + 1
  }
  let para: { s: number; e: number } | null = null
  const endPara = () => {
    if (para) blocks.push({ t: "p", c: parseInline(src, para.s, para.e) })
    para = null
  }
  for (let li = 0; li < lines.length; li++) {
    const { s, e } = lines[li]
    const line = src.slice(s, e)
    if (line.startsWith("```")) {
      endPara()
      const lang = line.slice(3).trim()
      const start = e + 1
      let end = -1
      let next = li + 1
      for (; next < lines.length; next++) {
        if (src.slice(lines[next].s, lines[next].e).startsWith("```")) {
          end = lines[next].s
          break
        }
      }
      if (end === -1) {
        blocks.push({ t: "code", lang, s: Math.min(start, src.length), e: src.length, open: true })
        break
      }
      blocks.push({ t: "code", lang, s: start, e: Math.max(start, end - 1), open: false })
      li = next
      continue
    }
    if (!line.trim()) {
      endPara()
      continue
    }
    const h = /^(#{1,3})\s+/.exec(line)
    if (h) {
      endPara()
      blocks.push({ t: "h", l: h[1].length, c: parseInline(src, s + h[0].length, e) })
      continue
    }
    const li2 = /^(\d+)\.\s+/.exec(line)
    const ul = /^[-*]\s+/.exec(line)
    if (li2 || ul) {
      endPara()
      const kind = li2 ? "ol" : "ul"
      const last = blocks[blocks.length - 1]
      const item = parseInline(src, s + (li2 ?? ul)![0].length, e)
      if (last && last.t === kind && lines[li - 1] && src.slice(lines[li - 1].s, lines[li - 1].e).trim()) last.items.push(item)
      else blocks.push({ t: kind, items: [item] })
      continue
    }
    if (para) para.e = e
    else para = { s, e }
  }
  endPara()
  return blocks
}

const KEYWORDS = new Set("curl export kubectl git npm npx docker select from where group by order limit join insert update delete create alter table add column const let var await async function return if else for while import from true false null in not and or set index rollout restart deploy".split(" "))
const TOKEN_RE = /((?<![\w-])--\s[^\n]*|(?<![\w$])#[^\n]*|(?<![:\w])\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(\d[\d,.]*)\b|\b([A-Za-z_][\w-]*)\b/g

function highlight(code: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let k = 0
  TOKEN_RE.lastIndex = 0
  for (let m = TOKEN_RE.exec(code); m; m = TOKEN_RE.exec(code)) {
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "n" : KEYWORDS.has(m[4].toLowerCase()) ? "k" : ""
    if (!cls) continue
    if (m.index > last) out.push(code.slice(last, m.index))
    out.push(<span key={k++} className={cls}>{m[0]}</span>)
    last = m.index + m[0].length
  }
  out.push(code.slice(last))
  return out
}

type MdCtx = { src: string; bounds: number[]; sources: ChatSource[]; idBase: string }

/** Text is cut at the chunk starts so each new chunk fades in once, and older text stays plain. */
function Range({ ctx, s, e }: { ctx: MdCtx; s: number; e: number }) {
  const { src, bounds } = ctx
  if (!bounds.length || e <= bounds[0]) return <>{src.slice(s, e)}</>
  const out: React.ReactNode[] = []
  let at = s
  if (at < bounds[0]) {
    out.push(src.slice(at, bounds[0]))
    at = bounds[0]
  }
  for (let i = 0; i < bounds.length && at < e; i++) {
    const end = Math.min(e, bounds[i + 1] ?? Infinity)
    if (end > at && end > bounds[i]) {
      out.push(<span key={bounds[i]} className="ach-chunk">{src.slice(Math.max(at, bounds[i]), end)}</span>)
      at = end
    }
  }
  return <>{out}</>
}

function Cite({ n, ctx }: { n: number; ctx: MdCtx }) {
  const [open, setOpen] = React.useState(false)
  const src = ctx.sources[n - 1]
  if (!src) return <>{n}</>
  const id = `${ctx.idBase}-c${n}`
  return (
    <span className="ach-citeWrap" data-open={open ? "" : undefined} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      <a className="ach-cite" href={src.url ?? "#"} target="_blank" rel="noreferrer noopener" aria-describedby={open ? id : undefined} aria-label={`Source ${n}: ${src.title}, ${src.domain}`} onClick={(e) => { if (!src.url) e.preventDefault() }}>
        {n}
      </a>
      {open && (
        <span className="ach-card" id={id} role="tooltip">
          <b>{src.title}</b>
          <span>{src.domain}</span>
          {src.snippet && <p>{src.snippet}</p>}
        </span>
      )}
    </span>
  )
}

function Inlines({ nodes, ctx }: { nodes: Inline[]; ctx: MdCtx }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.t === "text") return <Range key={i} ctx={ctx} s={n.s} e={n.e} />
        if (n.t === "strong") return <strong key={i}><Inlines nodes={n.c} ctx={ctx} /></strong>
        if (n.t === "code") return <code key={i} className="ach-code">{ctx.src.slice(n.s, n.e)}</code>
        return <Cite key={i} n={n.n} ctx={ctx} />
      })}
    </>
  )
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(id)
  }, [copied])
  return (
    <div className="ach-codeBlock">
      <div className="ach-codeHead">
        <span className="ach-codeLang">{lang || "text"}</span>
        <button
          type="button"
          className="ach-codeCopy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code)
            } catch {
              /* blocked clipboard: still confirm the click */
            }
            setCopied(true)
          }}
        >
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="ach-pre" tabIndex={0} aria-label={`${lang || "Code"} snippet`}><code>{highlight(code)}</code></pre>
    </div>
  )
}

const Markdown = React.memo(function Markdown({ content, bounds, sources, idBase }: { content: string; bounds: number[]; sources: ChatSource[]; idBase: string }) {
  const blocks = React.useMemo(() => parseBlocks(content), [content])
  const ctx: MdCtx = { src: content, bounds, sources, idBase }
  return (
    <div className="ach-md">
      {blocks.map((b, i) => {
        if (b.t === "p") return <p key={i}><Inlines nodes={b.c} ctx={ctx} /></p>
        if (b.t === "h") {
          const H = (b.l === 1 ? "h3" : b.l === 2 ? "h4" : "h5") as "h3"
          return <H key={i}><Inlines nodes={b.c} ctx={ctx} /></H>
        }
        if (b.t === "ol" || b.t === "ul") {
          const L = b.t
          return (
            <L key={i}>
              {b.items.map((it, j) => (
                <li key={j}><Inlines nodes={it} ctx={ctx} /></li>
              ))}
            </L>
          )
        }
        return <CodeBlock key={i} lang={b.lang} code={content.slice(b.s, b.e)} />
      })}
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*                               Scripted replies                             */
/* -------------------------------------------------------------------------- */

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const id = window.setTimeout(resolve, ms)
    signal.addEventListener("abort", () => { window.clearTimeout(id); resolve() }, { once: true })
  })

async function* scripted(messages: AiChatMessage[], signal: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  const last = messages[messages.length - 1]?.content ?? ""
  const userTurns = messages.filter((m) => m.role === "user").length
  if (/\bfail\b|\berror\b/i.test(last)) {
    yield { type: "reasoning", delta: "Let me look at that. " }
    await sleep(500, signal)
    yield { type: "reasoning-end", seconds: 1 }
    yield { type: "error", message: "The model is overloaded. Try again in a moment." }
    return
  }
  const rotate = /key|rotate|leak/i.test(messages[0]?.content ?? "") && userTurns === 1
  const usage = userTurns === 2 && /service|old key|call/i.test(last)
  if (rotate) {
    for (const d of ["The key leaked in a log line, so I will assume it is compromised. ", "Zero downtime means both keys must work for a while: create a second key, ", "deploy it everywhere, then revoke the first once its traffic is gone."]) {
      yield { type: "reasoning", delta: d }
      await sleep(260, signal)
    }
    yield { type: "reasoning-end", seconds: 4 }
    yield { type: "tool", tool: { id: "t1", name: "Searching the web", status: "running" } }
    await sleep(900, signal)
    yield { type: "tool", tool: { id: "t1", name: "Searched the web", status: "done", summary: "4 sources", sources: SRC_ROTATE } }
    yield { type: "sources", sources: SRC_ROTATE }
    yield { type: "text", delta: SCRIPT_ROTATE_TEXT }
    return
  }
  if (usage) {
    yield { type: "reasoning", delta: "I need per-service usage for the old key from the audit log." }
    await sleep(450, signal)
    yield { type: "reasoning-end", seconds: 2 }
    const input = "SELECT service, COUNT(*) AS calls\nFROM key_usage\nWHERE key_id = 'key_old' AND ts > now() - interval '24 hours'\nGROUP BY service\nORDER BY calls DESC;"
    yield { type: "tool", tool: { id: "t2", name: "Querying key usage", status: "running", input } }
    await sleep(800, signal)
    yield { type: "tool", tool: { id: "t2", name: "Queried key usage", status: "done", summary: "7 services", input, output: "checkout-api     41,208\nbilling-worker    9,331\nreports-cron        212\n... 4 more rows" } }
    yield { type: "text", delta: SCRIPT_USAGE_TEXT }
    return
  }
  yield { type: "reasoning", delta: "A short, practical answer is enough here." }
  await sleep(350, signal)
  yield { type: "reasoning-end", seconds: 1 }
  yield { type: "text", delta: GENERIC_TEXT }
}

const AUTOPLAY = ["A payments API key leaked in a log line. How do we rotate it without dropping requests?", "Which services still call the old key?"]

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const hues = ["#d4623a", "#0f9d7a", "#3b6cf0", "#8a5cf5", "#c0508a", "#b0872a"]
const hueOf = (s: string) => hues[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length]

function Mark({ model }: { model?: ChatModel }) {
  const m = model?.mark ?? "spark"
  const style = { ["--ach-mk" as string]: model?.color ?? "#d4623a" }
  if (m === "spark") return <span className="ach-mark" style={style}><Sparkles size={15} strokeWidth={2} aria-hidden /></span>
  if (m === "hex") return <span className="ach-mark" style={style}><Hexagon size={15} strokeWidth={2} aria-hidden /></span>
  if (m === "diamond") return <span className="ach-mark" style={style}><Diamond size={15} strokeWidth={2} aria-hidden /></span>
  return <span className="ach-mark">{m}</span>
}

const Swap = ({ k, children, className }: { k: string; children: React.ReactNode; className?: string }) => (
  <span key={k} className={["ach-swap", "ach-in", className].filter(Boolean).join(" ")}>{children}</span>
)

function Fold({ open, id, children }: { open: boolean; id: string; children: React.ReactNode }) {
  return (
    <div className="ach-fold" data-open={open ? "" : undefined} id={id} inert={!open}>
      <div>{children}</div>
    </div>
  )
}

function stripMd(s: string) {
  return s.replace(/\[\d+\]/g, "").replace(/[*`]/g, "")
}

const titleFrom = (s: string) => {
  const t = s.replace(/\s+/g, " ").trim()
  return t.length > 34 ? `${t.slice(0, 32).trimEnd()}...` : t
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function AiChat({
  respond,
  models = SAMPLE_MODELS,
  defaultModel,
  initialMessages,
  title,
  history,
  suggestions = SAMPLE_SUGGESTIONS,
  greeting = "What are we working on?",
  placeholder = "Ask anything",
  autoPlay,
  onFeedback,
  onModelChange,
  onNewChat,
  className,
}: AiChatProps) {
  const idBase = React.useId().replace(/:/g, "")
  const simulated = !respond
  const play = autoPlay ?? (!respond && !initialMessages)
  const firstModel = models.find((m) => m.id === defaultModel) ?? models[0]

  const [modelId, setModelId] = React.useState(firstModel?.id ?? "")
  const model = models.find((m) => m.id === modelId) ?? firstModel

  const [chats, setChats] = React.useState<Chat[]>(() => {
    const fm = firstModel?.id ?? ""
    const list: Chat[] = []
    const open = initialMessages?.length || play
    if (open) {
      const root = initialMessages?.length ? fromMessages(initialMessages, fm) : null
      const first = initialMessages?.find((m) => m.role === "user")?.content ?? AUTOPLAY[0]
      list.push({ id: "open", title: title ?? (initialMessages?.length ? titleFrom(first) : "Rotate the payments key"), auto: !title && !!initialMessages?.length, group: "Today", root })
    }
    const hist = history ?? (simulated ? SAMPLE_CHATS : [])
    for (const h of hist) list.push({ id: h.id, title: h.title, auto: false, group: h.group ?? "Earlier", root: fromMessages(h.messages, fm) })
    return list
  })
  const [activeId, setActiveId] = React.useState<string>(() => (initialMessages?.length || play ? "open" : ""))
  const [draft, setDraft] = React.useState("")
  const [files, setFiles] = React.useState<string[]>([])
  const [menu, setMenu] = React.useState<null | "chats" | "models">(null)
  const [open, setOpen] = React.useState<Record<string, boolean>>({})
  const [editing, setEditing] = React.useState<{ chat: string; depth: number; text: string } | null>(null)
  const [status, setStatus] = React.useState("")
  const [copiedId, setCopiedId] = React.useState("")
  const [stuck, setStuck] = React.useState(true)
  const [playing, setPlaying] = React.useState(play)

  const rootRef = React.useRef<HTMLElement>(null)
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  const runRef = React.useRef(0)
  const scrollMemo = React.useRef<Record<string, number>>({})
  const timers = React.useRef(new Set<number>())
  const chatsRef = React.useRef(chats)
  const activeRef = React.useRef(activeId)
  const modelRef = React.useRef(model)
  const respondRef = React.useRef(respond)
  const stuckRef = React.useRef(true)

  React.useLayoutEffect(() => {
    chatsRef.current = chats
    activeRef.current = activeId
    modelRef.current = model
    respondRef.current = respond
  })

  const chat = chats.find((c) => c.id === activeId)
  const chain = React.useMemo(() => chainOf(chat?.root ?? null), [chat?.root])
  const lastReply = chain[chain.length - 1]?.version.reply
  const busy = lastReply?.status === "streaming"
  const hasText = draft.trim().length > 0 || files.length > 0
  React.useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "0px"
    el.style.height = `${Math.min(168, Math.max(36, el.scrollHeight))}px`
  }, [draft])
  const sendState = busy ? "stop" : hasText ? "ready" : "idle"

  const later = React.useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => { timers.current.delete(id); fn() }, ms)
    timers.current.add(id)
    return id
  }, [])

  const abortNow = React.useCallback(() => {
    abortRef.current?.abort()
    runRef.current++
  }, [])

  React.useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach((id) => window.clearTimeout(id))
      abortNow()
    }
  }, [abortNow])

  /* ---------- patch helpers ---------- */
  const patchChat = React.useCallback((id: string, fn: (c: Chat) => Chat) => setChats((list) => list.map((c) => (c.id === id ? fn(c) : c))), [])
  const patchReply = React.useCallback(
    (chatId: string, depth: number, fn: (r: Reply) => Reply) => patchChat(chatId, (c) => ({ ...c, root: mapAt(c.root, depth, withReply(fn)) })),
    [patchChat],
  )

  /* ---------- scrolling ---------- */
  const scrollToEnd = React.useCallback(() => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    stuckRef.current = near
    setStuck(near)
  }

  const follow = lastReply ? lastReply.content.length + lastReply.reasoning.length + lastReply.tools.length + lastReply.status : 0
  React.useLayoutEffect(() => {
    if (stuckRef.current) scrollToEnd()
  }, [follow, chain.length, scrollToEnd])

  /* ---------- running a reply ---------- */
  const run = React.useCallback(
    async (chatId: string, depth: number, messages: AiChatMessage[], modelUsed: ChatModel) => {
      const id = ++runRef.current
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const alive = () => runRef.current === id && !ctrl.signal.aborted
      const started = performance.now()
      let pending = ""
      let finished = false
      let failed = null as string | null
      let shown = 0

      const consume = async () => {
        try {
          const stream = respondRef.current ? respondRef.current(messages, { signal: ctrl.signal, model: modelUsed }) : scripted(messages, ctrl.signal)
          for await (const ev of stream) {
            if (!alive()) return
            if (ev.type === "text") pending += ev.delta
            else if (ev.type === "reasoning") patchReply(chatId, depth, (r) => ({ ...r, reasoning: r.reasoning + ev.delta }))
            else if (ev.type === "reasoning-end")
              patchReply(chatId, depth, (r) => ({ ...r, reasoningDone: true, thoughtFor: ev.seconds ?? Math.max(1, Math.round((performance.now() - started) / 1000)) }))
            else if (ev.type === "tool")
              patchReply(chatId, depth, (r) => {
                const i = r.tools.findIndex((t) => t.id === ev.tool.id)
                const tools = r.tools.slice()
                if (i === -1) tools.push(ev.tool)
                else tools[i] = ev.tool
                return { ...r, tools }
              })
            else if (ev.type === "sources") patchReply(chatId, depth, (r) => ({ ...r, sources: ev.sources }))
            else if (ev.type === "error") {
              failed = ev.message
              return
            }
          }
        } catch (e) {
          if (alive()) failed = e instanceof Error ? e.message : "Something went wrong"
        } finally {
          finished = true
        }
      }
      void consume()
      setStatus("Reply started")

      await new Promise<void>((resolve) => {
        let last = 0
        const tick = (now: number) => {
          if (!alive()) return resolve()
          if (now - last >= 34) {
            last = now
            if (pending) {
              const words = pending.match(/\S+\s*/g) ?? [pending]
              const k = pending.length > 900 ? 14 : pending.length > 500 ? 6 : respondRef.current ? 4 : 2
              const chunk = words.slice(0, k).join("")
              pending = pending.slice(chunk.length)
              const start = shown
              shown += chunk.length
              patchReply(chatId, depth, (r) => {
                const bounds = [...r.bounds, start]
                while (bounds.length > 8) bounds.shift()
                return { ...r, content: r.content + chunk, bounds }
              })
            } else if (finished) return resolve()
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      if (!alive()) return
      if (failed) {
        patchReply(chatId, depth, (r) => ({ ...r, status: "error", error: failed!, reasoningDone: true, thoughtFor: r.thoughtFor ?? Math.max(1, Math.round((performance.now() - started) / 1000)) }))
        setStatus(`Reply failed. ${failed}`)
      } else {
        patchReply(chatId, depth, (r) => ({ ...r, status: "done", reasoningDone: true }))
        setStatus(simulated ? "Reply finished. This reply is simulated." : "Reply finished")
        later(() => patchReply(chatId, depth, (r) => (r.status === "done" ? { ...r, bounds: [] } : r)), 240)
      }
    },
    [later, patchReply, simulated],
  )

  const stop = React.useCallback(() => {
    abortRef.current?.abort()
    runRef.current++
    const c = chatsRef.current.find((x) => x.id === activeRef.current)
    if (!c) return
    const depth = chainOf(c.root).length - 1
    if (depth >= 0) patchReply(c.id, depth, (r) => (r.status === "streaming" ? { ...r, status: "stopped", bounds: [], reasoningDone: true, thoughtFor: r.thoughtFor ?? 1 } : r))
    setStatus("Reply stopped")
  }, [patchReply])

  const send = React.useCallback(
    (text: string, attached: string[] = []) => {
      const cid = activeRef.current
      const m = modelRef.current
      if (!m) return
      let id = cid
      if (!id) {
        id = nid("c")
        const fresh: Chat = { id, title: "New chat", auto: true, group: "Today", root: null }
        setChats((list) => [fresh, ...list])
        setActiveId(id)
        activeRef.current = id
      }
      const turn: Turn = { id: nid("u"), active: 0, versions: [{ user: text, files: attached, reply: emptyReply(m.id), next: null }] }
      const existing = id === cid ? chatsRef.current.find((c) => c.id === id)?.root ?? null : null
      const depth = chainOf(existing).length
      const nextRoot = appendTurn(existing, turn)
      setChats((list) => list.map((c) => (c.id === id ? { ...c, title: c.auto && !existing ? titleFrom(text) : c.title, root: nextRoot } : c)))
      stuckRef.current = true
      setStuck(true)
      void run(id, depth, messagesUpTo(nextRoot, depth), m)
    },
    [run],
  )

  /* ---------- autoplay: two scripted turns once in view ---------- */
  // Resumable on purpose: if React re-runs the effect (strict mode, a Suspense re-reveal) it picks up where it was.
  const sentByPlay = React.useRef(0)
  React.useEffect(() => {
    if (!playing || !rootRef.current) return
    const el = rootRef.current
    let cancelled = false
    const advance = () => {
      if (cancelled || sentByPlay.current >= AUTOPLAY.length) return
      if (sentByPlay.current > 0) {
        const c = chatsRef.current.find((x) => x.id === activeRef.current)
        const r = c ? chainOf(c.root)[sentByPlay.current - 1]?.version.reply : null
        if (!r || r.status === "streaming") return void later(advance, 400)
      }
      later(() => {
        if (cancelled) return
        send(AUTOPLAY[sentByPlay.current++])
        later(advance, 1300)
      }, sentByPlay.current === 0 ? 900 : 1100)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        advance()
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [playing, send, later])

  const cancelPlay = () => setPlaying(false)

  /* ---------- user actions ---------- */
  const submit = () => {
    if (busy) return stop()
    if (!hasText) return
    cancelPlay()
    const text = draft.trim() || (files.length ? "See the attached files." : "")
    send(text, files)
    setDraft("")
    setFiles([])
  }

  const newChat = () => {
    cancelPlay()
    stop()
    setMenu(null)
    setActiveId("")
    setEditing(null)
    setDraft("")
    setStatus("New chat")
    onNewChat?.()
    inputRef.current?.focus()
  }

  const openChat = (id: string) => {
    cancelPlay()
    if (id !== activeId) {
      if (busy) stop()
      if (scrollerRef.current) scrollMemo.current[activeId] = scrollerRef.current.scrollTop
      setActiveId(id)
      setEditing(null)
      const c = chats.find((x) => x.id === id)
      setStatus(`Opened ${c?.title ?? "chat"}`)
      requestAnimationFrame(() => {
        const el = scrollerRef.current
        if (!el) return
        const saved = scrollMemo.current[id]
        el.scrollTop = saved ?? el.scrollHeight
      })
    }
    setMenu(null)
  }

  const chooseModel = (m: ChatModel) => {
    setModelId(m.id)
    setMenu(null)
    setStatus(`Model ${m.name}`)
    onModelChange?.(m)
    inputRef.current?.focus()
  }

  const addVersion = (depth: number, text: string) => {
    const cid = activeRef.current
    const m = modelRef.current
    if (!cid || !m) return
    cancelPlay()
    const c = chatsRef.current.find((x) => x.id === cid)
    if (!c) return
    const nextRoot = mapAt(c.root, depth, (t) => {
      const prev = t.versions[t.active]
      const versions = [...t.versions, { user: text, files: prev.files, reply: emptyReply(m.id), next: null } as Version]
      return { ...t, versions, active: versions.length - 1 }
    })
    patchChat(cid, (x) => ({ ...x, root: nextRoot }))
    stuckRef.current = true
    void run(cid, depth, messagesUpTo(nextRoot, depth), m)
  }

  const retryAt = (depth: number) => {
    if (busy) return
    const v = chain[depth]?.version
    if (v) addVersion(depth, v.user)
  }

  const setVersion = (depth: number, delta: number) => {
    const cid = activeRef.current
    patchChat(cid, (c) => ({
      ...c,
      root: mapAt(c.root, depth, (t) => {
        const a = Math.max(0, Math.min(t.versions.length - 1, t.active + delta))
        setStatus(`Version ${a + 1} of ${t.versions.length}`)
        return { ...t, active: a }
      }),
    }))
  }

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* blocked clipboard: still confirm the click */
    }
    setCopiedId(key)
    setStatus("Copied")
    later(() => setCopiedId((c) => (c === key ? "" : c)), 1400)
  }

  const rate = (depth: number, value: "up" | "down") => {
    const cid = activeRef.current
    const r = chain[depth]?.version.reply
    if (!r) return
    const next = r.feedback === value ? null : value
    patchReply(cid, depth, (x) => ({ ...x, feedback: next }))
    const msg: AiChatMessage = { id: r.id, role: "assistant", content: r.content, model: r.model, feedback: next }
    if (onFeedback) onFeedback(msg, next)
    setStatus(next ? `Rated ${next === "up" ? "good" : "bad"}${onFeedback ? "" : ". Ratings are simulated in this preview."}` : "Rating cleared")
  }

  /* ---------- menus ---------- */
  React.useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(".ach-menuWrap")) setMenu(null)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [menu])

  const menuNode = React.useCallback((node: HTMLDivElement | null) => {
    node?.querySelector<HTMLElement>("[data-nav][aria-checked='true'], [data-nav]")?.focus({ preventScroll: true })
  }, [])

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>, back: HTMLElement | null) => {
    if (e.key === "Escape") {
      e.preventDefault()
      setMenu(null)
      back?.focus()
      return
    }
    if (e.key === "Tab") return setMenu(null)
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
    e.preventDefault()
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-nav]"))
    const i = items.indexOf(document.activeElement as HTMLElement)
    const to = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
    items[to]?.focus()
  }

  const titleBtn = React.useRef<HTMLButtonElement>(null)
  const modelBtn = React.useRef<HTMLButtonElement>(null)

  /* ---------- composer ---------- */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Escape" && busy) {
      e.preventDefault()
      return stop()
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const grouped = React.useMemo(() => {
    const out: [string, Chat[]][] = []
    for (const c of chats) {
      const g = out.find((x) => x[0] === c.group)
      if (g) g[1].push(c)
      else out.push([c.group, [c]])
    }
    return out
  }, [chats])

  const headerTitle = chat?.title ?? "New chat"
  const columnGroups = chain

  return (
    <section ref={rootRef} className={["ach", className].filter(Boolean).join(" ")} aria-label="AI chat" data-open={menu ? "" : undefined}>
      <style href="ai-chat" precedence="default">{CSS}</style>

      <header className="ach-head">
        <div className="ach-menuWrap ach-title">
          <button ref={titleBtn} type="button" className="ach-pill ach-title" aria-haspopup="menu" aria-expanded={menu === "chats"} onClick={() => setMenu(menu === "chats" ? null : "chats")}>
            <Swap k={headerTitle}>{headerTitle}</Swap>
            <ChevronDown className="ach-chev" size={14} aria-hidden />
          </button>
          {menu === "chats" && (
            <div className="ach-menu" data-align="start" role="menu" aria-label="Chats" ref={menuNode} onKeyDown={(e) => onMenuKey(e, titleBtn.current)}>
              <button type="button" role="menuitem" data-nav className="ach-mItem" onClick={newChat}>
                <SquarePen size={16} aria-hidden />
                <span className="ach-mName">New chat</span>
              </button>
              {grouped.length > 0 && <div className="ach-mSep" role="separator" />}
              {grouped.map(([g, list]) => (
                <div key={g} role="group" aria-label={g}>
                  <div className="ach-mLabel" aria-hidden>{g}</div>
                  {list.map((c) => (
                    <button key={c.id} type="button" role="menuitemradio" aria-checked={c.id === activeId} data-nav className="ach-mItem" onClick={() => openChat(c.id)}>
                      <span className="ach-mName">{c.title}</span>
                      <span className="ach-mCheck">{c.id === activeId && <Check size={16} aria-hidden />}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="ach-spacer" />
        <div className="ach-menuWrap">
          <button ref={modelBtn} type="button" className="ach-pill" aria-haspopup="menu" aria-expanded={menu === "models"} aria-label={`Model: ${model?.name}`} onClick={() => setMenu(menu === "models" ? null : "models")}>
            <Swap k={model?.id ?? ""}>
              <Mark model={model} />
              <span className="ach-modelName">{model?.name}</span>
            </Swap>
            <ChevronDown className="ach-chev" size={14} aria-hidden />
          </button>
          {menu === "models" && (
            <div className="ach-menu" data-align="end" role="menu" aria-label="Model" ref={menuNode} onKeyDown={(e) => onMenuKey(e, modelBtn.current)}>
              {models.map((m) => (
                <button key={m.id} type="button" role="menuitemradio" aria-checked={m.id === modelId} data-nav className="ach-mItem ach-mModel" onClick={() => chooseModel(m)}>
                  <Mark model={m} />
                  <span className="ach-mText">
                    <span>{m.name}</span>
                    {m.note && <span className="ach-mNote">{m.note}</span>}
                  </span>
                  <span className="ach-mCheck">{m.id === modelId && <Check size={16} aria-hidden />}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="ach-iconBtn" aria-label="New chat" onClick={newChat}>
          <SquarePen size={18} />
        </button>
      </header>

      <div className="ach-body">
        <div className="ach-scroller" ref={scrollerRef} onScroll={onScroll} tabIndex={-1}>
          <div className="ach-pane" key={activeId || "new"}>
            {chain.length === 0 ? (
              <div className="ach-empty">
                <h2 className="ach-greet">{greeting}</h2>
                {suggestions.length > 0 && (
                  <ul className="ach-sugs" aria-label="Suggestions">
                    {suggestions.slice(0, 3).map((s) => {
                      const Icon = SUG_ICON[s.icon ?? "search"]
                      return (
                        <li key={s.label}>
                          <button type="button" className="ach-sug" onClick={() => { cancelPlay(); send(s.prompt ?? s.label) }}>
                            <Icon size={16} aria-hidden />
                            {s.label}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <ol className="ach-thread" aria-label="Conversation">
                {columnGroups.map(({ turn, version }, depth) => {
                  const r = version.reply
                  const isLast = depth === chain.length - 1
                  const isEditing = editing?.chat === activeId && editing.depth === depth
                  const rm = models.find((m) => m.id === r?.model) ?? model
                  const verLabel = turn.versions.length > 1 ? `Version ${turn.active + 1} of ${turn.versions.length}` : ""
                  const rid = `${idBase}-${r?.id ?? depth}`
                  const thinking = r?.status === "streaming" && !r.reasoningDone && !r.content
                  const showRow = r && (r.reasoning || thinking || r.thoughtFor)
                  return (
                    <li key={turn.id} className="ach-turn">
                      <article className="ach-turnBody" aria-busy={r?.status === "streaming"} aria-label={`Turn ${depth + 1}`}>
                        <div style={{ display: "grid", gap: 8 }}>
                          {version.files.length > 0 && (
                            <div className="ach-files">
                              {version.files.map((f) => (
                                <span key={f} className="ach-fileTag"><FileIcon size={12} aria-hidden />{f}</span>
                              ))}
                            </div>
                          )}
                          {isEditing ? (
                            <EditBox
                              text={editing.text}
                              onCancel={() => { setEditing(null); setStatus("Edit cancelled") }}
                              onSend={(t) => { setEditing(null); addVersion(depth, t) }}
                            />
                          ) : (
                            <div className="ach-userRow">
                              <div className="ach-actions">
                                {turn.versions.length > 1 && (
                                  <Versions n={turn.versions.length} a={turn.active} onStep={(d) => setVersion(depth, d)} label={verLabel} />
                                )}
                                <button type="button" className="ach-act" aria-label={copiedId === `u${turn.id}` ? "Copied" : "Copy"} onClick={() => copy(`u${turn.id}`, version.user)}>
                                  {copiedId === `u${turn.id}` ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                                <button type="button" className="ach-act" aria-label="Edit" disabled={busy} onClick={() => setEditing({ chat: activeId, depth, text: version.user })}>
                                  <Pencil size={16} />
                                </button>
                              </div>
                              <p className="ach-bubble">{version.user}</p>
                            </div>
                          )}
                        </div>

                        {r && (
                          <div className="ach-reply" key={`${turn.id}-${turn.active}`}>
                            <div className="ach-replyHead">
                              <span className="ach-replyMark"><Mark model={rm} /></span>
                              {showRow ? (
                                <button type="button" className="ach-thought" aria-expanded={!!open[`${rid}-r`]} aria-controls={`${rid}-rp`} disabled={!r.reasoning} onClick={() => setOpen((o) => ({ ...o, [`${rid}-r`]: !o[`${rid}-r`] }))}>
                                  {thinking ? (
                                    <Swap k="thinking"><span className="ach-shimmer" data-text="Thinking">Thinking</span></Swap>
                                  ) : (
                                    <Swap k="thought">{r.thoughtFor ? `Thought for ${r.thoughtFor}s` : "Thought"}</Swap>
                                  )}
                                  {!!r.reasoning && <ChevronRight size={14} aria-hidden />}
                                </button>
                              ) : (
                                <span className="ach-modelTag">{rm?.name}</span>
                              )}
                            </div>
                            {!!r.reasoning && (
                              <Fold open={!!open[`${rid}-r`]} id={`${rid}-rp`}>
                                <p className="ach-reasoning">{r.reasoning}</p>
                              </Fold>
                            )}

                            {r.tools.length > 0 && (
                              <div className="ach-tools">
                                {r.tools.map((t) => (
                                  <ToolChip key={t.id} tool={t} open={!!open[`${rid}-${t.id}`]} onToggle={() => setOpen((o) => ({ ...o, [`${rid}-${t.id}`]: !o[`${rid}-${t.id}`] }))} id={`${rid}-${t.id}`} />
                                ))}
                              </div>
                            )}

                            {r.content && <Markdown content={r.content} bounds={r.bounds} sources={r.sources} idBase={rid} />}

                            {r.status === "stopped" && (
                              <span className="ach-state"><Square size={12} aria-hidden fill="currentColor" strokeWidth={0} />Stopped</span>
                            )}
                            {r.status === "error" && (
                              <p className="ach-fail" role="alert">
                                <TriangleAlert size={16} aria-hidden />
                                Reply failed
                                <span>{r.error}</span>
                              </p>
                            )}

                            {r.status !== "streaming" && (
                              <div className="ach-replyActions">
                                <div className="ach-actions" data-show={isLast ? "" : undefined}>
                                  {turn.versions.length > 1 && <Versions n={turn.versions.length} a={turn.active} onStep={(d) => setVersion(depth, d)} label={verLabel} />}
                                  {r.content && (
                                    <button type="button" className="ach-act" aria-label={copiedId === r.id ? "Copied" : "Copy"} onClick={() => copy(r.id, stripMd(r.content))}>
                                      {copiedId === r.id ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                  )}
                                  <button type="button" className="ach-act" aria-label="Retry" disabled={busy} onClick={() => retryAt(depth)}>
                                    <RotateCw size={16} />
                                  </button>
                                  {r.status === "done" && (
                                    <>
                                      <button type="button" className="ach-act" aria-label="Good response" aria-pressed={r.feedback === "up"} onClick={() => rate(depth, "up")}>
                                        <ThumbsUp size={16} fill={r.feedback === "up" ? "currentColor" : "none"} />
                                      </button>
                                      <button type="button" className="ach-act" aria-label="Bad response" aria-pressed={r.feedback === "down"} onClick={() => rate(depth, "down")}>
                                        <ThumbsDown size={16} fill={r.feedback === "down" ? "currentColor" : "none"} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
        {!stuck && chain.length > 0 && (
          <button type="button" className="ach-jump" onClick={() => { stuckRef.current = true; setStuck(true); scrollToEnd() }}>
            <ArrowDown size={14} aria-hidden />
            Jump to latest
          </button>
        )}
      </div>

      <div className="ach-dock">
        <form
          className="ach-comp"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          {files.length > 0 && (
            <ul className="ach-compFiles" aria-label="Attachments">
              {files.map((f) => (
                <li key={f} className="ach-compFile">
                  <FileIcon size={13} aria-hidden />
                  {f}
                  <button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles((l) => l.filter((x) => x !== f))}>
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="ach-row">
            <button type="button" className="ach-round" aria-label="Attach files" onClick={() => fileRef.current?.click()}>
              <Paperclip size={18} />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              tabIndex={-1}
              onChange={(e) => {
                setFiles((l) => [...l, ...Array.from(e.target.files ?? []).map((f) => f.name)])
                e.target.value = ""
                inputRef.current?.focus()
              }}
            />
            <div className="ach-field">
              <textarea
                ref={inputRef}
                className="ach-input"
                rows={1}
                aria-label="Message"
                placeholder={placeholder}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); cancelPlay() }}
                onKeyDown={onKeyDown}
              />
            </div>
            <button type="submit" className="ach-send" data-state={sendState} aria-label={busy ? "Stop reply" : "Send message"} aria-disabled={sendState === "idle" ? true : undefined}>
              <span className="ach-glyph ach-gArrow"><ArrowUp size={20} strokeWidth={2.2} aria-hidden /></span>
              <span className="ach-glyph ach-gStop"><Square size={13} fill="currentColor" strokeWidth={0} aria-hidden /></span>
            </button>
          </div>
        </form>
      </div>

      <p className="ach-sr" role="status" aria-live="polite">{status}</p>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Pieces                                    */
/* -------------------------------------------------------------------------- */

function Versions({ n, a, onStep, label }: { n: number; a: number; onStep: (d: number) => void; label: string }) {
  return (
    <div className="ach-versions" role="group" aria-label={label}>
      <button type="button" className="ach-act" aria-label="Previous version" disabled={a === 0} onClick={() => onStep(-1)}>
        <ChevronLeft size={14} />
      </button>
      <span aria-hidden>{a + 1} / {n}</span>
      <button type="button" className="ach-act" aria-label="Next version" disabled={a === n - 1} onClick={() => onStep(1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function EditBox({ text, onCancel, onSend }: { text: string; onCancel: () => void; onSend: (t: string) => void }) {
  const [v, setV] = React.useState(text)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])
  const fit = (el: HTMLTextAreaElement) => {
    el.style.height = "0px"
    el.style.height = `${Math.min(220, el.scrollHeight)}px`
  }
  return (
    <div className="ach-edit">
      <textarea
        ref={(el) => { ref.current = el; if (el) fit(el) }}
        aria-label="Edit message"
        value={v}
        onChange={(e) => { setV(e.target.value); fit(e.target) }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); onCancel() }
          else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && v.trim()) { e.preventDefault(); onSend(v.trim()) }
        }}
      />
      <div className="ach-editBar">
        <button type="button" className="ach-btn" onClick={onCancel}>Cancel</button>
        <button type="button" className="ach-btn" data-primary disabled={!v.trim()} onClick={() => onSend(v.trim())}>Send</button>
      </div>
    </div>
  )
}

function ToolChip({ tool, open, onToggle, id }: { tool: ChatTool; open: boolean; onToggle: () => void; id: string }) {
  const running = tool.status === "running"
  const Icon = tool.sources || /search/i.test(tool.name) ? Globe : Database
  const hasBody = !!(tool.sources?.length || tool.input || tool.output)
  return (
    <div style={{ minWidth: 0, maxWidth: "100%", width: open ? "100%" : undefined }}>
      <button type="button" className="ach-toolChip" aria-expanded={open} aria-controls={`${id}-p`} disabled={running || !hasBody} onClick={onToggle}>
        <span className="ach-toolIcon">{tool.status === "error" ? <TriangleAlert size={14} aria-hidden /> : <Icon size={14} aria-hidden />}</span>
        <Swap k={`${tool.status}-${tool.name}`}>
          {running ? <span className="ach-shimmer ach-toolName" data-text={tool.name}>{tool.name}</span> : <span className="ach-toolName">{tool.name}</span>}
          {!running && tool.sources && (
            <span className="ach-marks" aria-hidden>
              {tool.sources.slice(0, 3).map((s) => (
                <i key={s.domain} style={{ background: hueOf(s.domain) }}>{s.domain[0].toUpperCase()}</i>
              ))}
            </span>
          )}
          {!running && tool.summary && <span className="ach-toolSum">{tool.summary}</span>}
        </Swap>
      </button>
      <Fold open={open} id={`${id}-p`}>
        <div className="ach-toolBody">
          {tool.sources ? (
            <ul className="ach-srcList">
              {tool.sources.map((s, i) => (
                <li key={s.domain}>
                  <a className="ach-srcRow" href={s.url ?? "#"} target="_blank" rel="noreferrer noopener" onClick={(e) => { if (!s.url) e.preventDefault() }}>
                    <span className="ach-fav" style={{ background: hueOf(s.domain) }} aria-hidden>{i + 1}</span>
                    <span className="ach-srcText">
                      <span className="ach-srcTitle">{s.title}</span>
                      <span className="ach-srcDom">{s.domain}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ach-io">
              {tool.input && (<><b>Query</b><pre>{highlight(tool.input)}</pre></>)}
              {tool.output && (<><b>Result</b><pre>{tool.output}</pre></>)}
            </div>
          )}
        </div>
      </Fold>
    </div>
  )
}

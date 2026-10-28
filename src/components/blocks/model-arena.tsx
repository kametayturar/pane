"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Check, CircleAlert, Compass, Equal, Flag, Leaf, Orbit, Play, RotateCcw, Sparkles, Square, ThumbsDown, Trophy } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ArenaModel = {
  id: string
  /** Full name, shown after the vote (or at once when Blind is off). */
  name: string
  /** Shorter name for tight spots, such as the vote summary. Defaults to `name`. */
  short?: string
  provider: string
  /** A 14px mark (an svg or an <img>). Defaults to a coloured glyph tile. */
  mark?: React.ReactNode
  /** Colour of the default mark tile. */
  markColor?: string
  /** USD per million input tokens, for the cost readout. */
  inputPrice: number
  /** USD per million output tokens, for the cost readout. */
  outputPrice: number
  /** Colour of the leaderboard bar. */
  color?: string
  /** Speed of the built-in simulation: seconds to the first token and tokens per second. */
  sim?: { firstTokenMs: number; tokensPerSec: number }
}

export type ArenaPrompt = {
  id: string
  /** Short chip label. */
  label: string
  /** The full prompt that fills the field. */
  text: string
  /** Scripted answers for the built-in simulation (small markdown: paragraphs, lists, **bold**, `code`, fenced code). */
  answers?: string[]
}

/** What `run` yields: a text chunk, or usage numbers (yield one at the end for exact token counts). */
export type ArenaChunk = string | { usage: { inputTokens?: number; outputTokens?: number } }

export type ArenaMetrics = {
  firstTokenMs: number | null
  tokensPerSec: number | null
  totalMs: number | null
  outputTokens: number
  /** USD */
  cost: number
}

export type ArenaChoice = "a" | "b" | "tie" | "bad"

export type ArenaVote = {
  round: number
  prompt: string
  a: ArenaModel
  b: ArenaModel
  choice: ArenaChoice
  winner: ArenaModel | null
  metrics: { a: ArenaMetrics; b: ArenaMetrics }
}

export type ArenaStanding = { wins: number; ties: number; losses: number }

export type ModelArenaProps = {
  /** Models each round draws its blind pair from. Leave it out for four invented ones. */
  contestants?: ArenaModel[]
  /** Sample prompts shown as chips. The first fills the field; Next round moves to the next one. */
  prompts?: ArenaPrompt[]
  /** Streams one model's answer. Throw to fail a pane; stop when the signal aborts. Without it the arena plays scripted answers. */
  run?: (model: ArenaModel, prompt: string, signal: AbortSignal) => AsyncIterable<ArenaChunk>
  /** Called once per vote. */
  onVote?: (vote: ArenaVote) => void
  /** Hide model names and marks until a vote. The Blind switch toggles it at any time. */
  defaultBlind?: boolean
  /** Run the first round when the card scrolls into view. Defaults to true without `run`, false with it. */
  autoStart?: boolean
  /** Starting records per model id, for a leaderboard loaded from your own store. */
  initialStandings?: Record<string, ArenaStanding>
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               Demo content                                 */
/* -------------------------------------------------------------------------- */

const glyph = (Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>) => <Icon size={9} strokeWidth={2.4} />

const SAMPLE_MODELS: ArenaModel[] = [
  { id: "nova", name: "Nova 2 Pro", short: "Nova 2", provider: "Orbitworks", mark: glyph(Sparkles), markColor: "#7a5af8", color: "#7a5af8", inputPrice: 3, outputPrice: 15, sim: { firstTokenMs: 890, tokensPerSec: 151 } },
  { id: "atlas", name: "Atlas 4", short: "Atlas 4", provider: "Meridian Labs", mark: glyph(Compass), markColor: "#e4682f", color: "#e4682f", inputPrice: 2.5, outputPrice: 12, sim: { firstTokenMs: 620, tokensPerSec: 168 } },
  { id: "sage", name: "Sage Mini", short: "Sage Mini", provider: "Fernhill", mark: glyph(Leaf), markColor: "#2f9e6b", color: "#2f9e6b", inputPrice: 0.3, outputPrice: 1.4, sim: { firstTokenMs: 480, tokensPerSec: 214 } },
  { id: "orbit", name: "Orbit 7B", short: "Orbit 7B", provider: "Open weights", mark: glyph(Orbit), markColor: "#2b7fd9", color: "#2b7fd9", inputPrice: 0.1, outputPrice: 0.4, sim: { firstTokenMs: 1050, tokensPerSec: 122 } },
]

const SAMPLE_PROMPTS: ArenaPrompt[] = [
  {
    id: "sql",
    label: "Top customers in SQL",
    text: "Write a Postgres query for the top 5 customers by revenue in Q3 2026, with ties handled.",
    answers: [
      "```sql\nselect c.name, sum(o.total_cents) as revenue_cents\nfrom orders o\njoin customers c on c.id = o.customer_id\nwhere o.placed_at >= '2026-07-01'\n  and o.placed_at <  '2026-10-01'\n  and o.status = 'paid'\ngroup by c.id, c.name\norder by revenue_cents desc\nfetch first 5 rows with ties;\n```\n\n**Half-open range.** `placed_at < '2026-10-01'` keeps every order placed on September 30, which `between` would cut off at midnight.\n\n**Ties.** If two customers share fifth place, `with ties` returns both instead of dropping one.",
      "Aggregate first, then rank, so the join touches one row per customer.\n\n```sql\nwith q3 as (\n  select customer_id, sum(total_cents) as revenue_cents\n  from orders\n  where status = 'paid'\n    and placed_at >= '2026-07-01' and placed_at < '2026-10-01'\n  group by customer_id\n)\nselect c.name, q3.revenue_cents\nfrom q3 join customers c on c.id = q3.customer_id\norder by q3.revenue_cents desc\nlimit 5;\n```\n\n**Speed tip:** an index on `orders (status, placed_at) include (customer_id, total_cents)` turns this into an index-only scan.",
      "Rank with a window function so ties are explicit:\n\n- Sum paid orders per customer for July 1 to September 30.\n- Use `dense_rank()` over revenue, highest first.\n- Keep rows where the rank is 5 or lower.\n\nThat can return more than five rows when customers tie, which is usually what finance wants. Add `limit 5` only if a hard cap matters more than fairness.",
    ],
  },
  {
    id: "mutex",
    label: "Mutex or semaphore",
    text: "Explain the difference between a mutex and a semaphore to a junior engineer.",
    answers: [
      "Think of a **mutex** as the key to one room. Whoever holds the key is inside, everyone else waits, and only the holder may hand it back.\n\nA **semaphore** is a counter of free seats. A semaphore started at 3 lets three threads in at once and queues the rest.\n\n- **Count:** a mutex allows exactly one holder, a semaphore allows up to N.\n- **Ownership:** a mutex must be released by the thread that took it. A semaphore can be signalled from anywhere.\n\nOne last tip: a semaphore with a count of 1 behaves like a mutex, but without ownership it will not catch a thread releasing a lock it never took.",
      "**Mutex.** One person in, door locked. Use it when two threads must never touch the same thing at once, like appending to one log file.\n\n**Semaphore.** The bouncer lets in up to N people and counts them out. Use it to cap concurrency, like allowing only 5 image resizes at a time so the server doesn't melt.\n\nIf you remember one thing: a mutex says **mine**, a semaphore says **how many**.",
      "Short version: a mutex protects data, a semaphore limits access.\n\n1. A mutex has an owner. The thread that locks it must unlock it.\n2. A semaphore has a count. `wait` takes a permit, `post` returns one.\n3. Use a mutex around shared state such as a `requestCount` shared by many threads. Without the lock, two threads can both read 41 and both write 42, and one increment disappears.\n4. Use a semaphore for a pool, such as three printers shared by a queue of print jobs.",
    ],
  },
  {
    id: "decline",
    label: "Decline a meeting",
    text: "Write a polite note declining a meeting that has no agenda.",
    answers: [
      "Hi Maya,\n\nThanks for the invite. I can't make this one work without a sense of what we need to decide, so I'm going to pass for now.\n\nIf you send a short agenda or the question you want answered, I'm glad to reply in writing today or join a shorter slot later this week.\n\nThanks for understanding,\nTomas",
      "**Subject:** Re: Quick sync\n\nHi Maya, thank you for thinking of me. Before I block time, could you share what you'd like to cover and what outcome you're hoping for?\n\n- If it's a quick question, send it over and I'll answer by end of day.\n- If it needs a live conversation, I can do Thursday at 10:30 with an agenda.\n\nBest,\nTomas",
      "Hi Maya, I'm going to decline this one since I can't see the goal from the invite. Happy to jump on a call once there's an agenda or a decision we need to make together. In the meantime, I'm glad to help over chat. Thanks, Tomas",
    ],
  },
]

const GENERIC_ANSWERS = [
  "This is a **scripted sample answer** for a prompt the simulation has no script for.\n\nPass your own `run` function to stream real answers from your models, and the arena keeps the same flow: both panes at one pace, a blind vote, then the reveal.",
  "Sample answer.\n\n- Both panes stream at the same pace.\n- You vote before you know who wrote what.\n- The leaderboard keeps score between rounds.\n\nProvide `run` to use your own models.",
  "A short scripted reply. Wire up `run` to see real model output here, one chunk at a time.",
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mar {
  --mar-ink: #000;
  --mar-surface: #fff;
  --mar-accent: #0060e2;
  --mar-t1: color-mix(in oklab, var(--mar-ink) 88%, transparent);
  --mar-t2: color-mix(in oklab, var(--mar-ink) 61%, transparent);
  --mar-t3: color-mix(in oklab, var(--mar-ink) 45%, transparent);
  --mar-t4: color-mix(in oklab, var(--mar-ink) 27%, transparent);
  --mar-fill: color-mix(in oklab, var(--mar-ink) 4%, transparent);
  --mar-hover: color-mix(in oklab, var(--mar-ink) 5%, transparent);
  --mar-line: color-mix(in oklab, var(--mar-ink) 7%, transparent);
  --mar-soft: color-mix(in oklab, var(--mar-ink) 4.5%, transparent);
  --mar-code: color-mix(in oklab, var(--mar-ink) 5%, transparent);
  --mar-main-bg: color-mix(in oklab, var(--mar-ink) 80%, transparent);
  --mar-main-fg: #fcfcfc;
  --mar-glint: rgb(255 255 255 / .82);
  --mar-float: 0 20px 48px 0 rgb(0 0 0 / .105), 0 3px 10px 0 rgb(0 0 0 / .045);
  --mar-btn-shadow: 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .04);
  --mar-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 800px;
  container: mar / inline-size;
  border-radius: 26px;
  border: 1px solid var(--mar-line);
  background: var(--mar-surface);
  color: var(--mar-t1);
  font-family: var(--mar-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .mar {
  --mar-ink: #fff;
  --mar-surface: #1c1c1e;
  --mar-accent: #4d8dff;
  --mar-t1: color-mix(in oklab, var(--mar-ink) 90%, transparent);
  --mar-t2: color-mix(in oklab, var(--mar-ink) 62%, transparent);
  --mar-t3: color-mix(in oklab, var(--mar-ink) 46%, transparent);
  --mar-t4: color-mix(in oklab, var(--mar-ink) 28%, transparent);
  --mar-fill: color-mix(in oklab, var(--mar-ink) 6%, transparent);
  --mar-hover: color-mix(in oklab, var(--mar-ink) 8%, transparent);
  --mar-line: color-mix(in oklab, var(--mar-ink) 10%, transparent);
  --mar-soft: color-mix(in oklab, var(--mar-ink) 7%, transparent);
  --mar-code: color-mix(in oklab, var(--mar-ink) 8%, transparent);
  --mar-main-bg: rgb(255 255 255 / .9);
  --mar-main-fg: #171717;
  --mar-glint: rgb(255 255 255 / .9);
  --mar-float: 0 20px 48px 0 rgb(0 0 0 / .55), 0 3px 10px 0 rgb(0 0 0 / .35), 0 0 0 .5px rgb(255 255 255 / .1);
  --mar-btn-shadow: none;
}
.mar *, .mar *::before, .mar *::after { box-sizing: border-box }
:where(.mar) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.mar) input { font: inherit; color: inherit }
.mar button:disabled { cursor: default }
.mar :focus-visible { outline: 2px solid color-mix(in oklab, var(--mar-accent) 60%, transparent); outline-offset: 1px }
.mar :focus:not(:focus-visible) { outline: none }
.mar svg { display: block; flex: none }
.mar-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Buttons */
.mar-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 36px; padding: 0 12px;
  border-radius: 18px; font-weight: 500; white-space: nowrap; transition: background-color .16s, color .16s, box-shadow .16s, transform .16s var(--mar-ease);
}
.mar-btn:active:not(:disabled) { transform: scale(.975) }
.mar-btn[data-kind="ghost"] { color: var(--mar-t2); padding: 0 10px; gap: 6px }
.mar-btn[data-kind="ghost"]:hover, .mar-btn[data-kind="ghost"][aria-expanded="true"] { background: var(--mar-fill); color: var(--mar-t1) }
.mar-btn[data-kind="secondary"] { background: var(--mar-surface); box-shadow: inset 0 0 0 1px var(--mar-line), var(--mar-btn-shadow) }
.mar-btn[data-kind="secondary"]:hover:not(:disabled) { background: color-mix(in oklab, var(--mar-surface), var(--mar-ink) 3%) }
.mar-btn[data-kind="primary"] { background: var(--mar-main-bg); color: var(--mar-main-fg) }
.mar-btn[data-kind="primary"]:hover:not(:disabled) { background: color-mix(in oklab, var(--mar-main-bg), var(--mar-ink) 8%) }
.mar-btn svg { width: 16px; height: 16px }

/* Header */
.mar-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px 0 20px; min-height: 52px }
.mar-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--mar-ink) }
.mar-round { display: inline-flex; gap: 6px; color: var(--mar-t3); font-variant-numeric: tabular-nums }
.mar-num { display: inline-block; animation: mar-pop .4s var(--mar-ease) backwards }
.mar-tools { display: flex; align-items: center; gap: 6px; margin-left: auto }
.mar-blind { display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 6px 0 8px; border-radius: 10px; color: var(--mar-t2); transition: color .16s }
.mar-blind:hover { color: var(--mar-t1) }
.mar-track { position: relative; width: 42px; height: 24px; padding: 3px; border-radius: 999px; background: color-mix(in oklab, var(--mar-ink) 11%, transparent); transition: background-color .22s }
.mar-blind[aria-checked="true"] .mar-track { background: var(--mar-main-bg) }
.mar-thumb { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 2px rgb(0 0 0 / .14); transition: transform .3s var(--mar-ease) }
.mar-blind[aria-checked="true"] .mar-thumb { transform: translateX(18px) }
:is(.dark, [data-theme="dark"]) .mar-blind[aria-checked="true"] .mar-thumb { background: #171717 }

/* Prompt */
.mar-prompt { padding: 6px 20px 14px }
.mar-field {
  display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 5px 0 16px; border-radius: 18px; background: var(--mar-surface);
  border: 1px solid var(--mar-line); transition: border-color .16s var(--mar-ease), box-shadow .16s var(--mar-ease);
}
.mar-field:focus-within { border-color: color-mix(in oklab, var(--mar-ink) 22%, transparent); box-shadow: 0 0 0 3px var(--mar-fill) }
.mar .mar-input:focus-visible { outline: none }
.mar-input { flex: 1; min-width: 0; height: 46px; border: 0; background: none; outline: none; color: var(--mar-t1); text-overflow: ellipsis }
.mar-input::placeholder { color: var(--mar-t3) }
.mar-run { display: inline-grid; padding: 0 12px }
.mar-run > span { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: opacity .2s var(--mar-ease), transform .26s var(--mar-ease), filter .2s }
.mar-run [data-off] { opacity: 0; transform: scale(.9); filter: blur(3px); pointer-events: none }
.mar-kbd { font-size: 12px; color: color-mix(in oklab, var(--mar-main-fg) 55%, transparent); letter-spacing: .02em }
.mar-chips { display: flex; gap: 6px; margin-top: 10px; overflow-x: auto; scrollbar-width: none; padding: 1px 0 }
.mar-chips::-webkit-scrollbar { display: none }
.mar-chip {
  flex: none; height: 28px; padding: 0 11px; border-radius: 999px; font-size: 12px; line-height: 16px; color: var(--mar-t2);
  border: 1px solid transparent; transition: background-color .16s, color .16s, border-color .16s;
}
.mar-chip:hover { background: var(--mar-fill); color: var(--mar-t1) }
.mar-chip[aria-pressed="true"] { background: var(--mar-fill); border-color: var(--mar-line); color: var(--mar-t1) }

/* Stage */
.mar-stage { border-top: 1px solid var(--mar-line) }
.mar-tabs { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 10px 14px 0; padding: 3px; border-radius: 18px; background: var(--mar-fill); box-shadow: inset 0 0 0 1px var(--mar-line) }
.mar-tabHl { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc(50% - 3px); border-radius: 15px; background: var(--mar-surface); box-shadow: 0 0 0 1px var(--mar-line), 0 1px 2px rgb(0 0 0 / .04); transition: transform .32s var(--mar-ease) }
.mar-tabs[data-active="1"] .mar-tabHl { transform: translateX(100%) }
.mar-tab { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 7px 12px; border-radius: 15px; text-align: left; min-width: 0 }
.mar-tab .mar-name { font-weight: 500; color: var(--mar-t2); transition: color .2s }
.mar-tab[aria-selected="true"] .mar-name { color: var(--mar-t1) }
.mar-panes { display: grid; grid-template-columns: 1fr }
.mar-pane { position: relative; display: flex; flex-direction: column; min-width: 0 }
.mar-pane[hidden] { display: none }
.mar-pane + .mar-pane { border-top: 1px solid var(--mar-soft) }
.mar-paneHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 48px; padding: 4px 12px 0 20px }
.mar-name { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-weight: 500; color: var(--mar-t1); animation: mar-fade .3s var(--mar-ease) backwards }
.mar-nameText { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.mar-mark { display: grid; place-items: center; flex: none; width: 16px; height: 16px; overflow: hidden; border-radius: 5px; color: #fff }
.mar-mark > * { max-width: 100%; max-height: 100% }
.mar-status {
  position: relative; display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px; border-radius: 999px;
  font-size: 12px; line-height: 16px; color: var(--mar-t3); white-space: nowrap; animation: mar-fade .3s var(--mar-ease) backwards;
}
.mar-status svg { width: 13px; height: 13px }
.mar-status[data-s="thinking"], .mar-status[data-s="writing"] { color: var(--mar-t2) }
.mar-status[data-s="done"] { color: var(--mar-t2) }
.mar-status[data-s="first"] { color: var(--mar-t1); background: var(--mar-surface); box-shadow: inset 0 0 0 1px var(--mar-line) }
.mar-status[data-s="failed"] { color: #c0392b }
:is(.dark, [data-theme="dark"]) .mar-status[data-s="failed"] { color: #ff8a7a }
.mar-spin { animation: mar-spin .9s linear infinite }
.mar-shimmer { position: relative }
.mar-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, var(--mar-glint) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: mar-sweep 1.6s linear infinite;
}
.mar-scroller {
  position: relative; height: 272px; overflow-y: auto; overscroll-behavior: contain; padding: 8px 20px 18px; scrollbar-width: thin; scrollbar-color: var(--mar-t4) transparent;
}
.mar-fade { position: relative }
.mar-fade::before, .mar-fade::after { content: ""; position: absolute; left: 0; right: 10px; z-index: 1; pointer-events: none }
.mar-fade::before { top: 0; height: 10px; background: linear-gradient(var(--mar-surface), transparent) }
.mar-fade::after { bottom: 0; height: 22px; background: linear-gradient(transparent, var(--mar-surface)) }
.mar-empty { margin: 0; color: var(--mar-t4) }
.mar-retry { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; height: 28px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 500; box-shadow: inset 0 0 0 1px var(--mar-line); transition: background-color .16s }
.mar-retry:hover { background: var(--mar-fill) }
.mar-retry svg { width: 13px; height: 13px }
.mar-metrics { display: flex; flex-wrap: wrap; gap: 2px 8px; margin: 0; padding: 8px 20px 14px; font-size: 12px; line-height: 16.8px; color: var(--mar-t3) }
.mar-metric { display: flex; align-items: baseline; gap: 5px; margin: 0 }
.mar-metric dt { color: var(--mar-t3) }
.mar-metric dt[data-hide] { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0) }
.mar-metric dd { margin: 0; color: var(--mar-t2); font-variant-numeric: tabular-nums }
.mar-metric dd b { font-weight: 400; color: var(--mar-t1) }
.mar-sep { width: 3px; height: 3px; align-self: center; border-radius: 50%; background: var(--mar-t4) }

/* Answer text */
.mar-md { display: flex; flex-direction: column; gap: 12px; font-size: 14px; line-height: 22.4px; color: var(--mar-t1) }
.mar-md p, .mar-md ul, .mar-md ol, .mar-md pre { margin: 0 }
.mar-md ul, .mar-md ol { padding-left: 20px; display: flex; flex-direction: column; gap: 6px }
.mar-md ul { list-style: disc }
.mar-md ol { list-style: decimal }
.mar-md li { display: list-item }
.mar-md li::marker { color: var(--mar-t3) }
.mar-w { animation: mar-word .16s ease-out backwards }
.mar-md b { font-weight: 600; color: var(--mar-ink) }
.mar-md code { padding: 1px 4px; border-radius: 5px; background: var(--mar-code); font: 12.5px/1 ui-monospace, "SF Mono", Menlo, Consolas, monospace; white-space: pre-wrap; word-break: break-word }
.mar-md pre { padding: 10px 12px; border-radius: 12px; background: var(--mar-code); overflow-x: auto; scrollbar-width: thin }
.mar-md pre code { display: block; padding: 0; background: none; white-space: pre; font-size: 12px; line-height: 18px; word-break: normal }

/* Vote */
.mar-voteClip { border-top: 1px solid var(--mar-line); overflow: hidden; border-radius: 0 0 25px 25px; transition: height .4s var(--mar-ease) }
.mar-voteBar { padding: 12px 12px 12px 20px; animation: mar-fade .32s var(--mar-ease) backwards }
.mar-voteRow { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; min-height: 36px }
.mar-voteLabel { margin: 0; color: var(--mar-t2) }
.mar-voteLabel b { font-weight: 500; color: var(--mar-t1) }
.mar-voteGroup { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto }
.mar-voteNote { margin: 4px 0 0; font-size: 12px; line-height: 16px; color: var(--mar-t3) }
.mar-picked { display: inline-flex; align-items: center; gap: 8px; color: var(--mar-t2) }
.mar-picked svg { width: 16px; height: 16px; color: var(--mar-t1) }
.mar-picked b { display: inline-flex; align-items: center; gap: 6px; font-weight: 500; color: var(--mar-t1) }
.mar-next { margin-left: auto }
.mar-idle { padding: 18px 20px; margin: 0; color: var(--mar-t3); animation: mar-fade .32s var(--mar-ease) backwards }

/* Leaderboard popover */
.mar-board {
  position: absolute; z-index: 20; top: 52px; right: 10px; width: min(320px, calc(100% - 20px)); padding: 14px 16px 8px; border-radius: 26px; transform-origin: top right;
  background: var(--mar-surface); box-shadow: var(--mar-float); animation: mar-board .34s var(--mar-ease) backwards;
}
.mar-board:focus-visible { outline: none }
.mar-boardHead { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px }
.mar-boardTitle { margin: 0; font-size: 13px; line-height: 20px; font-weight: 500; color: var(--mar-ink) }
.mar-boardMeta { font-size: 12px; color: var(--mar-t3); font-variant-numeric: tabular-nums }
.mar-rows { position: relative; margin: 0; padding: 0; list-style: none }
.mar-row {
  position: absolute; inset: 0 0 auto 0; display: grid; grid-template-columns: 14px 16px minmax(0, 1fr) 54px 38px; align-items: center; gap: 8px; height: 30px;
  transition: transform .55s var(--mar-ease); animation: mar-fade .4s var(--mar-ease) backwards;
}
.mar-rank { font-size: 12px; color: var(--mar-t3); font-variant-numeric: tabular-nums }
.mar-who { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: var(--mar-t1) }
.mar-bar { position: relative; height: 3px; border-radius: 99px; background: var(--mar-fill); overflow: hidden }
.mar-bar i { position: absolute; inset: 0; border-radius: inherit; background: var(--mar-bar, var(--mar-ink)); transform-origin: left; transition: transform .6s var(--mar-ease); animation: mar-grow .7s var(--mar-ease) backwards }
.mar-pct { text-align: right; font-size: 12px; color: var(--mar-t1); font-variant-numeric: tabular-nums }
.mar-boardFoot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; padding-top: 2px; font-size: 12px; color: var(--mar-t3) }

/* Narrow */
@container mar (max-width: 559px) {
  .mar-prompt { padding-inline: 14px }
  .mar-head { padding-left: 16px }
  .mar-scroller { height: 252px; padding-inline: 16px }
  .mar-metrics { padding-inline: 16px }
  .mar-voteBar { padding-left: 16px }
}
@container mar (max-width: 479px) {
  .mar-boardLabel, .mar-kbd { display: none }
  .mar-btn[data-kind="ghost"] { width: 36px; padding: 0 }
  .mar-chips { margin-inline: -14px; padding-inline: 14px }
  .mar-voteGroup { display: grid; grid-template-columns: 1fr 1fr; width: 100%; margin-left: 0 }
  .mar-voteGroup .mar-btn { padding: 0 8px }
  .mar-voteLabel { width: 100% }
}
@container mar (min-width: 560px) {
  .mar-panes { grid-template-columns: 1fr 1fr }
  .mar-pane + .mar-pane { border-top: 0; border-left: 1px solid var(--mar-soft) }
}

@keyframes mar-fade { from { opacity: 0 } }
@keyframes mar-pop { from { opacity: 0; transform: translateY(5px); filter: blur(2px) } }
@keyframes mar-word { from { opacity: 0 } }
@keyframes mar-spin { to { transform: rotate(360deg) } }
@keyframes mar-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes mar-board { from { opacity: 0; transform: translateY(-6px) scale(.96) } }
@keyframes mar-grow { from { transform: scaleX(0) } }

@media (prefers-reduced-motion: reduce) {
  .mar *, .mar *::before, .mar *::after { animation: none !important; transition: none !important }
  .mar-shimmer::after { display: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const join = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ")

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"))
    const id = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(id)
      reject(new DOMException("Aborted", "AbortError"))
    }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

/** The built-in simulation: wait for the first token, then stream word chunks at one pace. */
async function* scripted(model: ArenaModel, text: string, signal: AbortSignal): AsyncGenerator<ArenaChunk> {
  await sleep(model.sim?.firstTokenMs ?? 700, signal)
  const parts = text.match(/\S+\s*/g) ?? [text]
  for (let i = 0; i < parts.length; i += 2) {
    yield parts.slice(i, i + 2).join("")
    await sleep(30 + Math.random() * 10, signal)
  }
  yield { usage: { outputTokens: Math.round(text.length / 4) } }
}

const hashId = (s: string) => [...s].reduce((n, c) => n + c.charCodeAt(0), 0)
const estimateTokens = (s: string) => Math.max(1, Math.round(s.length / 4))
const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError"

type PaneStatus = "idle" | "thinking" | "writing" | "done" | "stopped" | "failed"

type Pane = {
  status: PaneStatus
  text: string
  t0: number
  firstAt: number | null
  endAt: number | null
  outTokens: number | null
  inTokens: number
  simTps: number | null
  place: number | null
}

const IDLE_PANE: Pane = { status: "idle", text: "", t0: 0, firstAt: null, endAt: null, outTokens: null, inTokens: 0, simTps: null, place: null }

type PaneAction =
  | { type: "reset"; run: number; inTokens: number; simTps: (number | null)[] }
  | { type: "start"; run: number; i: 0 | 1; t: number }
  | { type: "chunk"; run: number; i: 0 | 1; t: number; text: string }
  | { type: "usage"; run: number; i: 0 | 1; out?: number; inp?: number }
  | { type: "end"; run: number; i: 0 | 1; t: number; place: number | null; status: "done" | "failed" | "stopped" }
  | { type: "stopAll"; run: number; t: number }

type PaneState = { run: number; panes: [Pane, Pane] }

function paneReducer(state: PaneState, a: PaneAction): PaneState {
  if (a.type === "reset") {
    return { run: a.run, panes: [0, 1].map((i) => ({ ...IDLE_PANE, inTokens: a.inTokens, simTps: a.simTps[i] ?? null })) as [Pane, Pane] }
  }
  if (a.run !== state.run) return state
  const set = (i: 0 | 1, patch: Partial<Pane>): PaneState => {
    const panes = [...state.panes] as [Pane, Pane]
    panes[i] = { ...panes[i], ...patch }
    return { ...state, panes }
  }
  switch (a.type) {
    case "start":
      return set(a.i, { status: "thinking", t0: a.t, text: "", firstAt: null, endAt: null, outTokens: null, place: null })
    case "chunk": {
      const p = state.panes[a.i]
      return set(a.i, { status: "writing", text: p.text + a.text, firstAt: p.firstAt ?? a.t })
    }
    case "usage":
      return set(a.i, { outTokens: a.out ?? state.panes[a.i].outTokens, inTokens: a.inp ?? state.panes[a.i].inTokens })
    case "end":
      return set(a.i, { status: a.status, endAt: a.t, place: a.place })
    case "stopAll": {
      const panes = state.panes.map((p) => (p.status === "thinking" || p.status === "writing" ? { ...p, status: "stopped" as const, endAt: a.t } : p)) as [Pane, Pane]
      return { ...state, panes }
    }
  }
}

const settled = (p: Pane) => p.status === "done" || p.status === "failed" || p.status === "stopped"

function metricsOf(p: Pane, m: ArenaModel | undefined, now: number): ArenaMetrics {
  const outTokens = p.outTokens ?? estimateTokens(p.text)
  const end = p.endAt ?? now
  const firstTokenMs = p.firstAt !== null ? p.firstAt - p.t0 : null
  let tokensPerSec: number | null = null
  if (p.simTps !== null && p.firstAt !== null) tokensPerSec = p.simTps
  else if (p.firstAt !== null && end - p.firstAt > 250) tokensPerSec = outTokens / ((end - p.firstAt) / 1000)
  const cost = m ? (p.inTokens * m.inputPrice + outTokens * m.outputPrice) / 1e6 : 0
  return { firstTokenMs, tokensPerSec, totalMs: p.endAt !== null ? p.endAt - p.t0 : null, outputTokens: outTokens, cost }
}

/* -------------------------------------------------------------------------- */
/*                               Answer markdown                              */
/* -------------------------------------------------------------------------- */

type MdBlock = { t: "p"; text: string } | { t: "ul" | "ol"; items: string[] } | { t: "code"; text: string }

function parseMd(src: string): MdBlock[] {
  const out: MdBlock[] = []
  const lines = src.split("\n")
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("```")) {
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++])
      i++
      out.push({ t: "code", text: body.join("\n") })
    } else if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
      const ordered = /^\s*\d+\. /.test(line)
      const items: string[] = []
      while (i < lines.length && (ordered ? /^\s*\d+\. /.test(lines[i]) : /^\s*[-*] /.test(lines[i]))) items.push(lines[i++].replace(/^\s*(?:[-*]|\d+\.) /, ""))
      out.push({ t: ordered ? "ol" : "ul", items })
    } else if (line.trim() === "") i++
    else {
      const para: string[] = []
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("```") && !/^\s*[-*] /.test(lines[i]) && !/^\s*\d+\. /.test(lines[i])) para.push(lines[i++])
      out.push({ t: "p", text: para.join(" ") })
    }
  }
  return out
}

/** Bold and code toggle on every marker, so a half-streamed `**word` is already bold. Each word fades in once, on mount. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*|`)/)
  let bold = false
  let code = false
  const nodes: React.ReactNode[] = []
  parts.forEach((part, pi) => {
    if (part === "**") return void (bold = !bold)
    if (part === "`") return void (code = !code)
    if (!part) return
    const words = part.split(/(\s+)/).map((w, wi) => (/^\s+$/.test(w) || w === "" ? w : <span key={wi} className="mar-w">{w}</span>))
    let node: React.ReactNode = words
    if (code) node = <code>{node}</code>
    if (bold) node = <b>{node}</b>
    nodes.push(<React.Fragment key={pi}>{node}</React.Fragment>)
  })
  return <>{nodes}</>
}

function Markdown({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseMd(text), [text])
  return (
    <div className="mar-md">
      {blocks.map((b, i) => {
        if (b.t === "p") return <p key={i}><Inline text={b.text} /></p>
        if (b.t === "code")
          return (
            <pre key={i} tabIndex={0} aria-label="Code">
              <code>{b.text.split("\n").map((l, li, arr) => <span key={li} className="mar-w">{l}{li < arr.length - 1 ? "\n" : ""}</span>)}</code>
            </pre>
          )
        const List = b.t === "ul" ? "ul" : "ol"
        return (
          <List key={i}>
            {b.items.map((it, ii) => <li key={ii}><Inline text={it} /></li>)}
          </List>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

function Mark({ model }: { model: ArenaModel }) {
  return (
    <span className="mar-mark" style={{ background: model.markColor ?? "var(--mar-t2)" }} aria-hidden>
      {model.mark ?? model.name.charAt(0)}
    </span>
  )
}

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="mar-spin" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.6" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const STATUS_LABEL: Record<string, string> = { idle: "Ready", thinking: "Thinking", writing: "Writing", done: "Done", first: "Finished first", stopped: "Stopped", failed: "Failed" }

function Status({ pane }: { pane: Pane }) {
  const key = pane.status === "done" && pane.place === 1 ? "first" : pane.status
  const busy = key === "thinking" || key === "writing"
  const icon =
    key === "idle" ? <svg viewBox="0 0 16 16" fill="none" aria-hidden><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 2.4" /></svg>
    : busy ? <Spinner />
    : key === "done" ? <Check strokeWidth={2} />
    : key === "first" ? <Flag strokeWidth={1.8} />
    : key === "stopped" ? <Square strokeWidth={2} />
    : <CircleAlert strokeWidth={1.8} />
  return (
    <span key={key} className="mar-status" data-s={key}>
      {icon}
      <span className={busy ? "mar-shimmer" : undefined} data-text={STATUS_LABEL[key]}>{STATUS_LABEL[key]}</span>
    </span>
  )
}

/** Animates its height to follow its content (height: auto can't be transitioned). */
function AutoHeight({ children, className }: { children: React.ReactNode; className?: string }) {
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
    <div className={className} style={height !== null ? { height } : undefined}>
      <div ref={inner} style={{ display: "flow-root" }}>{children}</div>
    </div>
  )
}

const fmtS = (ms: number | null) => (ms === null ? "–" : `${(ms / 1000).toFixed(2)}s`)
const fmtCost = (v: number) => `$${v.toFixed(4)}`
const rate = (s: ArenaStanding | undefined) => {
  const n = s ? s.wins + s.ties + s.losses : 0
  return n === 0 || !s ? 0 : (s.wins + s.ties / 2) / n
}

/* -------------------------------------------------------------------------- */
/*                                 ModelArena                                 */
/* -------------------------------------------------------------------------- */

export function ModelArena({
  contestants: contestantsProp,
  prompts: promptsProp,
  run,
  onVote,
  defaultBlind = true,
  autoStart,
  initialStandings,
  className,
}: ModelArenaProps) {
  const contestants = contestantsProp && contestantsProp.length >= 2 ? contestantsProp : SAMPLE_MODELS
  const prompts = promptsProp && promptsProp.length ? promptsProp : SAMPLE_PROMPTS
  const auto = autoStart ?? !run
  const uid = React.useId()

  const [blind, setBlind] = React.useState(defaultBlind)
  const [round, setRound] = React.useState(1)
  const [text, setText] = React.useState(prompts[0].text)
  const [pair, setPair] = React.useState<[ArenaModel, ArenaModel]>([contestants[0], contestants[1]])
  const [phase, setPhase] = React.useState<"idle" | "running" | "voted">("idle")
  const [choice, setChoice] = React.useState<ArenaChoice | null>(null)
  const [pstate, dispatch] = React.useReducer(paneReducer, { run: 0, panes: [IDLE_PANE, IDLE_PANE] })
  const [now, setNow] = React.useState(0)
  const [announce, setAnnounce] = React.useState("")
  const [narrow, setNarrow] = React.useState(false)
  const [tab, setTab] = React.useState<0 | 1>(0)
  const [boardOpen, setBoardOpen] = React.useState(false)
  const [standings, setStandings] = React.useState<Record<string, ArenaStanding>>(initialStandings ?? {})

  const rootRef = React.useRef<HTMLElement>(null)
  const boardRef = React.useRef<HTMLDivElement>(null)
  const boardBtn = React.useRef<HTMLButtonElement>(null)
  const nextBtn = React.useRef<HTMLButtonElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const ctl = React.useRef<{ abort: AbortController; run: number; done: number; place: number; variants: [string, string] } | null>(null)
  const runCount = React.useRef(0)
  const runRef = React.useRef(run)
  const onVoteRef = React.useRef(onVote)
  const started = React.useRef(false)
  const lastPrompt = React.useRef("")
  React.useEffect(() => {
    runRef.current = run
    onVoteRef.current = onVote
  })

  const panes = pstate.panes
  const running = phase === "running"
  const anyBusy = running && panes.some((p) => p.status === "thinking" || p.status === "writing")
  const allSettled = panes.every(settled)
  const allDone = panes.every((p) => p.status === "done")
  const voting = running && allSettled && allDone
  const doneCount = panes.filter(settled).length
  const revealed = phase === "voted"
  const showNames = !blind || revealed

  // Live readouts: tick while a model is working.
  React.useEffect(() => {
    if (!anyBusy) return
    const id = window.setInterval(() => setNow(performance.now()), 100)
    return () => window.clearInterval(id)
  }, [anyBusy])
  const slowNow = Math.floor(now / 500) * 500

  // Narrow layout switches panes to tabs.
  React.useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setNarrow(el.getBoundingClientRect().width < 560))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Close the leaderboard on outside press.
  React.useEffect(() => {
    if (!boardOpen) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (boardRef.current?.contains(t) || boardBtn.current?.contains(t)) return
      setBoardOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [boardOpen])
  React.useEffect(() => {
    if (boardOpen) boardRef.current?.focus({ preventScroll: true })
  }, [boardOpen])
  React.useEffect(() => {
    if (revealed) nextBtn.current?.focus({ preventScroll: true })
  }, [revealed])
  React.useEffect(() => () => ctl.current?.abort.abort(), [])

  const startPane = React.useCallback(async (runId: number, i: 0 | 1, model: ArenaModel, prompt: string, variant: string, signal: AbortSignal) => {
    const c = ctl.current
    dispatch({ type: "start", run: runId, i, t: performance.now() })
    try {
      const source = runRef.current ? runRef.current(model, prompt, signal) : scripted(model, variant, signal)
      for await (const part of source) {
        if (signal.aborted) return
        if (typeof part === "string") dispatch({ type: "chunk", run: runId, i, t: performance.now(), text: part })
        else dispatch({ type: "usage", run: runId, i, out: part.usage.outputTokens, inp: part.usage.inputTokens })
      }
      if (signal.aborted || !c || c.run !== runId) return
      c.done++
      const place = ++c.place
      dispatch({ type: "end", run: runId, i, t: performance.now(), place, status: "done" })
      const label = i === 0 ? "Model A" : "Model B"
      if (place === 1) setAnnounce(`${label} finished first.`)
      else if (c.done === 2) setAnnounce("Both answers are ready. Vote to reveal the models.")
    } catch (e) {
      if (isAbort(e) || signal.aborted) return
      dispatch({ type: "end", run: runId, i, t: performance.now(), place: null, status: "failed" })
      setAnnounce(`${i === 0 ? "Model A" : "Model B"} failed. You can retry it.`)
    }
  }, [])

  const begin = React.useCallback(
    (prompt: string, roundNo: number) => {
      ctl.current?.abort.abort()
      const abort = new AbortController()
      const runId = ++runCount.current
      lastPrompt.current = prompt

      // Blind pair: two distinct contestants, in random order.
      const a = Math.floor(Math.random() * contestants.length)
      let b = Math.floor(Math.random() * (contestants.length - 1))
      if (b >= a) b++
      const models: [ArenaModel, ArenaModel] = [contestants[a], contestants[b]]
      setPair(models)

      const known = prompts.find((p) => p.text === prompt)
      const pool = known?.answers?.length ? known.answers : GENERIC_ANSWERS
      const vA = hashId(models[0].id) % pool.length
      let vB = hashId(models[1].id) % pool.length
      if (vB === vA) vB = (vB + 1) % pool.length
      const variants: [string, string] = [pool[vA], pool[vB]]
      ctl.current = { abort, run: runId, done: 0, place: 0, variants }

      setChoice(null)
      setPhase("running")
      setTab(0)
      dispatch({ type: "reset", run: runId, inTokens: estimateTokens(prompt), simTps: models.map((m) => (runRef.current ? null : (m.sim?.tokensPerSec ?? null))) })
      setAnnounce(`Round ${roundNo} started. Two anonymous models are answering.`)
      setNow(performance.now())
      void startPane(runId, 0, models[0], prompt, variants[0], abort.signal)
      void startPane(runId, 1, models[1], prompt, variants[1], abort.signal)
    },
    [contestants, prompts, startPane],
  )

  const submit = () => {
    const prompt = text.trim()
    if (!prompt || running) return
    begin(prompt, round)
  }

  const stop = () => {
    const c = ctl.current
    if (!c) return
    c.abort.abort()
    dispatch({ type: "stopAll", run: c.run, t: performance.now() })
    setPhase("idle")
    setAnnounce("Stopped.")
  }

  const retry = (i: 0 | 1) => {
    const c = ctl.current
    if (!c) return
    const model = pair[i]
    c.abort = new AbortController()
    void startPane(c.run, i, model, lastPrompt.current, c.variants[i], c.abort.signal)
  }

  // Run the first round when the card scrolls into view.
  React.useEffect(() => {
    const el = rootRef.current
    if (!auto || !el || started.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return
        started.current = true
        io.disconnect()
        begin(prompts[0].text, 1)
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [auto, begin, prompts])

  const vote = (c: ArenaChoice) => {
    if (!voting) return
    const [ma, mb] = pair
    const winner = c === "a" ? ma : c === "b" ? mb : null
    setStandings((s) => {
      const next = { ...s }
      const upd = (id: string, k: keyof ArenaStanding) => {
        const cur = next[id] ?? { wins: 0, ties: 0, losses: 0 }
        next[id] = { ...cur, [k]: cur[k] + 1 }
      }
      if (c === "a") {
        upd(ma.id, "wins")
        upd(mb.id, "losses")
      } else if (c === "b") {
        upd(mb.id, "wins")
        upd(ma.id, "losses")
      } else if (c === "tie") {
        upd(ma.id, "ties")
        upd(mb.id, "ties")
      } else {
        upd(ma.id, "losses")
        upd(mb.id, "losses")
      }
      return next
    })
    setChoice(c)
    setPhase("voted")
    const verdict = c === "a" ? `You picked ${ma.name}.` : c === "b" ? `You picked ${mb.name}.` : c === "tie" ? "You voted a tie." : "You voted both bad."
    setAnnounce(`${verdict} Model A was ${ma.name}. Model B was ${mb.name}.`)
    onVoteRef.current?.({
      round,
      prompt: lastPrompt.current,
      a: ma,
      b: mb,
      choice: c,
      winner,
      metrics: { a: metricsOf(panes[0], ma, now), b: metricsOf(panes[1], mb, now) },
    })
  }

  const nextRound = () => {
    const idx = (Math.max(0, prompts.findIndex((p) => p.text === lastPrompt.current)) + 1) % prompts.length
    const nextText = prompts[idx].text
    setText(nextText)
    setRound((r) => r + 1)
    begin(nextText, round + 1)
  }

  const onTabKey = (e: React.KeyboardEvent) => {
    let n: 0 | 1 | null = null
    if (e.key === "ArrowRight" || e.key === "End") n = 1
    if (e.key === "ArrowLeft" || e.key === "Home") n = 0
    if (n === null) return
    e.preventDefault()
    setTab(n)
    tabRefs.current[n]?.focus()
  }

  const onRootKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return
    if (boardOpen) {
      e.stopPropagation()
      setBoardOpen(false)
      boardBtn.current?.focus()
    } else if (running && anyBusy) stop()
  }

  const ranking = React.useMemo(() => {
    return contestants
      .map((m) => ({ m, s: standings[m.id], r: rate(standings[m.id]) }))
      .sort((x, y) => y.r - x.r || (y.s?.wins ?? 0) - (x.s?.wins ?? 0) || x.m.name.localeCompare(y.m.name))
  }, [contestants, standings])
  const totalVotes = Object.values(standings).reduce((n, s) => n + s.wins + s.ties + s.losses, 0) / 2

  const names = ["Model A", "Model B"] as const
  const nameOf = (i: 0 | 1) => (showNames ? pair[i].name : names[i])

  const picked = choice === "a" ? pair[0] : choice === "b" ? pair[1] : null

  return (
    <section ref={rootRef} className={join("mar", className)} aria-label="Model arena" onKeyDown={onRootKey}>
      <style href="model-arena" precedence="default">{CSS}</style>

      <header className="mar-head">
        <h2 className="mar-title">Arena</h2>
        <span className="mar-round">
          <span aria-hidden>·</span> Round <span key={round} className="mar-num">{round}</span>
        </span>
        <div className="mar-tools">
          <button
            ref={boardBtn}
            type="button"
            className="mar-btn"
            data-kind="ghost"
            aria-haspopup="dialog"
            aria-expanded={boardOpen}
            aria-label="Leaderboard"
            onClick={() => setBoardOpen((o) => !o)}
          >
            <Trophy aria-hidden />
            <span className="mar-boardLabel">Leaderboard</span>
          </button>
          <button type="button" role="switch" aria-checked={blind} className="mar-blind" onClick={() => setBlind((b) => !b)}>
            Blind
            <span className="mar-track" aria-hidden><span className="mar-thumb" /></span>
          </button>
        </div>
      </header>

      {boardOpen && (
        <div ref={boardRef} className="mar-board" role="dialog" aria-labelledby={`${uid}-board`} tabIndex={-1}>
          <div className="mar-boardHead">
            <h3 id={`${uid}-board`} className="mar-boardTitle">Leaderboard</h3>
            <span className="mar-boardMeta">{totalVotes} {totalVotes === 1 ? "vote" : "votes"}</span>
          </div>
          <ol className="mar-rows" style={{ height: ranking.length * 30 }}>
            {contestants.map((m) => {
              const idx = ranking.findIndex((r) => r.m.id === m.id)
              const s = standings[m.id] ?? { wins: 0, ties: 0, losses: 0 }
              const pct = Math.round(rate(standings[m.id]) * 100)
              return (
                <li key={m.id} className="mar-row" style={{ transform: `translateY(${idx * 30}px)`, animationDelay: `${idx * 40}ms` }}>
                  <span className="mar-sr">Rank {idx + 1}, </span>
                  <span className="mar-rank" aria-hidden>{idx + 1}</span>
                  <Mark model={m} />
                  <span className="mar-who">{m.name}<span className="mar-sr">, win rate {pct}%, {s.wins} wins, {s.ties} ties, {s.losses} losses</span></span>
                  <span className="mar-bar" aria-hidden style={{ "--mar-bar": m.color } as React.CSSProperties}>
                    <i style={{ transform: `scaleX(${pct / 100})`, animationDelay: `${120 + idx * 50}ms` }} />
                  </span>
                  <span className="mar-pct" aria-hidden>{pct}%</span>
                </li>
              )
            })}
          </ol>
          <div className="mar-boardFoot">
            <span>A tie counts as half a win</span>
            <button
              type="button"
              className="mar-btn"
              data-kind="ghost"
              style={{ height: 28, padding: "0 8px", fontSize: 12 }}
              onClick={() => {
                setStandings({})
                setAnnounce("Leaderboard reset.")
              }}
            >
              <RotateCcw aria-hidden style={{ width: 13, height: 13 }} />
              Reset
            </button>
          </div>
        </div>
      )}

      <form
        className="mar-prompt"
        onSubmit={(e) => {
          e.preventDefault()
          if (!running) submit()
        }}
      >
        <div className="mar-field">
          <label className="mar-sr" htmlFor={`${uid}-prompt`}>Prompt for both models</label>
          <input
            ref={inputRef}
            id={`${uid}-prompt`}
            className="mar-input"
            value={text}
            placeholder="Ask both models anything"
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault()
                if (!running) submit()
              }
            }}
          />
          <button
            type={running && anyBusy ? "button" : "submit"}
            className="mar-btn mar-run"
            data-kind="primary"
            disabled={!(running && anyBusy) && (running || !text.trim())}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            aria-label={running && anyBusy ? "Stop" : "Run, shortcut Command or Control Enter"}
            onClick={running && anyBusy ? stop : undefined}
          >
            <span aria-hidden data-off={running && anyBusy ? "" : undefined}><Play fill="currentColor" style={{ width: 12, height: 12 }} /> Run <span className="mar-kbd">⌘↵</span></span>
            <span aria-hidden data-off={running && anyBusy ? undefined : ""}><Square fill="currentColor" style={{ width: 11, height: 11 }} /> Stop</span>
          </button>
        </div>
        <div className="mar-chips" role="group" aria-label="Sample prompts">
          {prompts.map((p) => (
            <button key={p.id} type="button" className="mar-chip" aria-pressed={text === p.text} disabled={running && anyBusy} onClick={() => setText(p.text)}>
              {p.label}
            </button>
          ))}
        </div>
      </form>

      <div className="mar-stage">
        {narrow && (
          <div className="mar-tabs" role="tablist" aria-label="Models" data-active={tab} onKeyDown={onTabKey}>
            <span className="mar-tabHl" aria-hidden />
            {([0, 1] as const).map((i) => (
              <button
                key={i}
                ref={(el) => void (tabRefs.current[i] = el)}
                type="button"
                role="tab"
                id={`${uid}-tab-${i}`}
                aria-selected={tab === i}
                aria-controls={`${uid}-pane-${i}`}
                tabIndex={tab === i ? 0 : -1}
                className="mar-tab"
                onClick={() => setTab(i)}
              >
                <span key={nameOf(i)} className="mar-name">
                  {showNames && <Mark model={pair[i]} />}
                  <span className="mar-nameText">{nameOf(i)}</span>
                </span>
                <Status pane={panes[i]} />
              </button>
            ))}
          </div>
        )}
        <div className="mar-panes">
          {([0, 1] as const).map((i) => (
            <PaneView
              key={i}
              id={`${uid}-pane-${i}`}
              labelId={narrow ? `${uid}-tab-${i}` : `${uid}-name-${i}`}
              narrow={narrow}
              hidden={narrow && tab !== i}
              pane={panes[i]}
              model={pair[i]}
              name={nameOf(i)}
              showNames={showNames}
              now={now}
              slowNow={slowNow}
              onRetry={() => retry(i)}
            />
          ))}
        </div>
      </div>

      <AutoHeight className="mar-voteClip">
        {phase === "idle" && !panes.some((p) => p.status !== "idle") && (
          <p key="idle" className="mar-idle">Run a prompt, then vote for the better answer</p>
        )}
        {phase === "idle" && panes.some((p) => p.status !== "idle") && (
          <div key="stopped" className="mar-voteBar">
            <p className="mar-voteLabel">Run stopped. Run the prompt again to compare.</p>
          </div>
        )}
        {running && !voting && (
          <div key="wait" className="mar-voteBar">
            <p className="mar-voteLabel">
              {panes.some((p) => p.status === "failed") ? "One model failed. Retry it to vote." : <>Voting opens when both answers finish <span style={{ color: "var(--mar-t3)" }}>·</span> {doneCount} of 2 done</>}
            </p>
            {!run && <p className="mar-voteNote">Simulated run with scripted sample answers.</p>}
          </div>
        )}
        {voting && (
          <div key="vote" className="mar-voteBar">
            <div className="mar-voteRow">
              <p className="mar-voteLabel" id={`${uid}-vote`}>Which answer is better?</p>
              <div className="mar-voteGroup" role="group" aria-labelledby={`${uid}-vote`}>
                <button type="button" className="mar-btn" data-kind="secondary" onClick={() => vote("a")}><ArrowLeft aria-hidden />A is better</button>
                <button type="button" className="mar-btn" data-kind="secondary" onClick={() => vote("tie")}><Equal aria-hidden />Tie</button>
                <button type="button" className="mar-btn" data-kind="secondary" onClick={() => vote("b")}>B is better<ArrowRight aria-hidden /></button>
                <button type="button" className="mar-btn" data-kind="secondary" onClick={() => vote("bad")}><ThumbsDown aria-hidden />Both bad</button>
              </div>
            </div>
          </div>
        )}
        {revealed && (
          <div key="voted" className="mar-voteBar">
            <div className="mar-voteRow">
              <span className="mar-picked">
                <Check aria-hidden strokeWidth={2} />
                {picked ? (
                  <>
                    You picked <b><Mark model={picked} />{picked.short ?? picked.name}</b>
                  </>
                ) : choice === "tie" ? (
                  "You voted a tie"
                ) : (
                  "You voted both bad"
                )}
              </span>
              <button ref={nextBtn} type="button" className="mar-btn mar-next" data-kind="primary" onClick={nextRound}>
                Next round <ArrowRight aria-hidden />
              </button>
            </div>
          </div>
        )}
      </AutoHeight>

      <p className="mar-sr" role="status" aria-live="polite">{announce}</p>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Pane                                    */
/* -------------------------------------------------------------------------- */

function PaneView({
  id,
  labelId,
  narrow,
  hidden,
  pane,
  model,
  name,
  showNames,
  now,
  slowNow,
  onRetry,
}: {
  id: string
  labelId: string
  narrow: boolean
  hidden: boolean
  pane: Pane
  model: ArenaModel
  name: string
  showNames: boolean
  now: number
  slowNow: number
  onRetry: () => void
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const follow = React.useRef(true)
  const busy = pane.status === "thinking" || pane.status === "writing"

  React.useLayoutEffect(() => {
    const el = scroller.current
    if (el && follow.current) el.scrollTop = el.scrollHeight
  }, [pane.text])
  React.useLayoutEffect(() => {
    if (pane.status === "thinking") {
      follow.current = true
      if (scroller.current) scroller.current.scrollTop = 0
    }
  }, [pane.status])

  const live = busy ? slowNow : (pane.endAt ?? 0)
  const m = metricsOf(pane, model, live)
  const ttft = pane.status === "thinking" ? Math.max(0, now - pane.t0) : m.firstTokenMs
  const idle = pane.status === "idle"

  return (
    <section
      id={id}
      className="mar-pane"
      role={narrow ? "tabpanel" : "region"}
      aria-labelledby={labelId}
      hidden={hidden}
    >
      {!narrow && (
        <header className="mar-paneHead">
          <span key={name} id={labelId} className="mar-name">
            {showNames && <Mark model={model} />}
            <span className="mar-nameText">{name}</span>
          </span>
          <Status pane={pane} />
        </header>
      )}
      <div className="mar-fade">
      <div
        ref={scroller}
        className="mar-scroller"
        tabIndex={0}
        role="region"
        aria-label={`${name} answer`}
        aria-busy={busy}
        onScroll={(e) => {
          const el = e.currentTarget
          follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
        onKeyDown={(e) => {
          if (["ArrowUp", "PageUp", "Home"].includes(e.key)) follow.current = false
        }}
      >
        {pane.text ? (
          <Markdown text={pane.text} />
        ) : (
          <p className="mar-empty">{pane.status === "thinking" ? "" : pane.status === "failed" ? "No answer came back." : "The answer streams here"}</p>
        )}
        {pane.status === "failed" && (
          <button type="button" className="mar-retry" onClick={onRetry}>
            <RotateCcw aria-hidden />
            Retry
          </button>
        )}
      </div>
      </div>
      <dl className="mar-metrics">
        <div className="mar-metric">
          <dt>First token</dt>
          <dd><b>{idle ? "0.00s" : fmtS(ttft)}</b></dd>
        </div>
        <span className="mar-sep" aria-hidden />
        <div className="mar-metric">
          <dt data-hide>Speed</dt>
          <dd><b>{m.tokensPerSec === null ? "–" : Math.round(m.tokensPerSec)}</b> tok/s</dd>
        </div>
        <span className="mar-sep" aria-hidden />
        <div className="mar-metric">
          <dt data-hide>Cost</dt>
          <dd><b>{idle || m.cost === 0 ? "–" : fmtCost(m.cost)}</b></dd>
        </div>
      </dl>
    </section>
  )
}

# Pane

**143 pieces of UI for AI products, made with taste.** Components, full screens, illustrations and motion – streamed
answers with sources, agents you can approve and steer, tactile controls, real glass, and animated scenes for your
landing page. One file each, calm motion, dark mode built in. Open source (MIT).

**Live library:** https://paneui.vercel.app · **Catalog for agents:** https://paneui.vercel.app/llms.txt · **Skill:** [`skills/pane`](skills/pane/SKILL.md)

## Use it

**Let your agent do it.** Open Claude Code, Cursor or Codex in your project and paste the prompt from the
[overview](https://paneui.vercel.app/#/browse) – it reads the catalog, picks the pieces that fit your site and builds them in with your content.

**Install a piece yourself** (any React + Tailwind v4 project, no setup needed):

```bash
curl -sO https://paneui.vercel.app/add.mjs && node add.mjs ai-answer approval-card model-arena
```

or with the shadcn CLI:

```bash
npx shadcn@latest add https://paneui.vercel.app/r/ai-answer.json
```

**Install the skill** so your agent always builds in this style and knows every piece:

```bash
mkdir -p ~/.claude/skills && cp -r skills/pane ~/.claude/skills/
```

Each piece is a single `.tsx` file with its own CSS, tokens and motion. Read it, change it, it is yours.

## Three looks

Every piece restyles from its tokens: **Classic** (white, one blue accent), **Mono** (black and white, crisp) and
**Glass** – real Liquid Glass with refraction at the edges in Chromium and frosted glass everywhere else. Switch them in the
sidebar of the [live library](https://paneui.vercel.app/#/browse).

## Find anything

Press <kbd>⌘K</kbd> on the site: search runs across names, tags, synonyms ("modal" finds dialogs, "spinner" finds loaders)
and descriptions, tolerates typos, and every piece page links its tags and related pieces from other groups.

## Catalog

### Originals

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Action Drum**](https://paneui.vercel.app/#/action-drum) · [source](src/components/ui/action-drum.tsx) | Confirm an agent's action by rolling a drum of verbs – Discard, Hold, Send – until the one you mean settles under the highlight. | `agent` `approval` `picker` `scroll` |
| [**Odometer**](https://paneui.vercel.app/#/odometer) · [source](src/components/ui/odometer.tsx) | A background agent's progress as one big rolling count that stops on the number it needs you to check. | `agent` `progress` `text-effect` `kpi` |
| [**Thought Stack**](https://paneui.vercel.app/#/thought-stack) · [source](src/components/ui/thought-stack.tsx) | Reasoning steps dealt as a deck of cards; the answer springs forward on top with the steps tucked underneath. | `chat` `reasoning` `card` `streaming` |
| [**Fill In**](https://paneui.vercel.app/#/fill-in) · [source](src/components/ui/fill-in.tsx) | The agent stops mid-sentence at a blank; the answer you tap lifts out of the options and lands in the sentence. | `agent` `chat` `prompt` `feedback` |

### Chat

| Piece | What it does | Tags |
| --- | --- | --- |
| [**AI Answer**](https://paneui.vercel.app/#/ai-answer) · [source](src/components/ui/ai-answer.tsx) | Streamed answer with source cards, citation previews, copy, stop, feedback and follow-ups. | `card` `chat` `feedback` `retrieval` |
| [**Thinking State**](https://paneui.vercel.app/#/thinking-state) · [source](src/components/ui/thinking-state.tsx) | Working panel with a live timer, searched sources and steps that appear one by one. | `agent` `loading` `progress` `reasoning` |
| [**Thinking Loader**](https://paneui.vercel.app/#/thinking-loader) · [source](src/components/ui/thinking-loader.tsx) | A small working pill that rolls through phases and settles on a check. | `chat` `loading` `morph` `progress` |
| [**Chat Composer**](https://paneui.vercel.app/#/chat-composer) · [source](src/components/ui/chat-composer.tsx) | Prompt composer with a model menu, voice input, app connections and an approval request. | `approval` `chat` `input` `menu` |
| [**Writing Assistant**](https://paneui.vercel.app/#/writing-assistant) · [source](src/components/ui/writing-assistant.tsx) | A small AI writing helper with suggestions, streamed replies and voice dictation. | `chat` `input` `prompt` `streaming` |
| [**Model Picker**](https://paneui.vercel.app/#/model-picker) · [source](src/components/ui/model-picker.tsx) | Model menu with speed, quality and cost bars, extended thinking and effort. | `chat` `cost` `menu` `model` |
| [**Message Actions**](https://paneui.vercel.app/#/message-actions) · [source](src/components/ui/message-actions.tsx) | Copy, retry, feedback and share under an assistant message. | `button` `chat` `feedback` `hover` |
| [**Tool Call Card**](https://paneui.vercel.app/#/tool-call-card) · [source](src/components/ui/tool-call-card.tsx) | One tool call with its arguments, a live status and the result folded in. | `agent` `card` `chat` `loading` |
| [**Approval Card**](https://paneui.vercel.app/#/approval-card) · [source](src/components/ui/approval-card.tsx) | An action the agent wants to take, waiting for you to approve or deny. | `agent` `approval` `button` `card` |
| [**Permission Request**](https://paneui.vercel.app/#/permission-request) · [source](src/components/ui/permission-request.tsx) | An app asks for access – scopes, once or always, and a clear deny. | `agent` `approval` `button` `card` |
| [**Reaction Bar**](https://paneui.vercel.app/#/reaction-bar) · [source](src/components/ui/reaction-bar.tsx) | Emoji reactions that pop, count up and show who reacted. | `button` `chat` `feedback` `hover` |
| [**Email Draft**](https://paneui.vercel.app/#/email-draft) · [source](src/components/ui/email-draft.tsx) | An AI-drafted email you can review, tweak and send. | `agent` `card` `chat` `form` |
| [**Comment Thread**](https://paneui.vercel.app/#/comment-thread) · [source](src/components/ui/comment-thread.tsx) | A threaded discussion with replies, mentions and resolve. | `card` `chat` `comment` `hover` |

### Agents

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Agent Plan**](https://paneui.vercel.app/#/agent-plan) · [source](src/components/ui/agent-plan.tsx) | The agent's plan as steps that tick through, with sub-steps and edits. | `agent` `card` `dashboard` `progress` |
| [**Decision Inbox**](https://paneui.vercel.app/#/decision-inbox) · [source](src/components/ui/decision-inbox.tsx) | Decisions the agents need from you, one at a time. | `agent` `approval` `button` `card` |
| [**Change Summary**](https://paneui.vercel.app/#/change-summary) · [source](src/components/ui/change-summary.tsx) | What an agent changed, summarised with counts and details. | `agent` `approval` `card` `feedback` |
| [**Progress Tracker**](https://paneui.vercel.app/#/progress-tracker) · [source](src/components/ui/progress-tracker.tsx) | A long task's progress with steps, ETA and live updates. | `agent` `card` `loading` `progress` |
| [**Smart Recommendation**](https://paneui.vercel.app/#/smart-recommendation) · [source](src/components/ui/smart-recommendation.tsx) | A suggestion from the assistant with its reason and one-click apply. | `agent` `button` `card` `chat` |
| [**Tips Panel**](https://paneui.vercel.app/#/tips-panel) · [source](src/components/ui/tips-panel.tsx) | Rotating tips and how-tos in a small dismissible panel. | `agent` `button` `card` `feedback` |
| [**Memory Panel**](https://paneui.vercel.app/#/memory-panel) · [source](src/components/ui/memory-panel.tsx) | What the assistant remembers – grouped, searchable, editable, with pause and undo. | `agent` `card` `context` `memory` |

### AI blocks

| Piece | What it does | Tags |
| --- | --- | --- |
| [**MCP Servers**](https://paneui.vercel.app/#/mcp-servers) · [source](src/components/blocks/mcp-servers.tsx) | The MCP servers behind an agent: what the enabled tools cost in context, connect or pause a server, switch single tools. | `agent` `context` `menu` `settings` |
| [**Eval Suite**](https://paneui.vercel.app/#/eval-suite) · [source](src/components/blocks/eval-suite.tsx) | Run a suite on a new version against its baseline: cases stream in, regressions and fixes are called out with the cases behind them. | `agent` `dashboard` `evals` `feedback` |
| [**Usage Forecast**](https://paneui.vercel.app/#/usage-forecast) · [source](src/components/blocks/usage-forecast.tsx) | A billing period usage chart with a forecast cone and a draggable budget that dates the crossing. | `chart` `cost` `dashboard` `drag` |
| [**Agent Orchestrator**](https://paneui.vercel.app/#/agent-orchestrator) · [source](src/components/blocks/agent-orchestrator.tsx) | A lead agent splits a goal into a plan, fans subtasks out to parallel lanes and merges the results. | `agent` `dashboard` `diagram` `flow` |
| [**AI Composer**](https://paneui.vercel.app/#/ai-composer) · [source](src/components/blocks/ai-composer.tsx) | Prompt box with attachments, @ mentions and / commands, a model and effort menu, and a send button ringed by the reply's progress. | `chat` `input` `keyboard` `menu` |
| [**Model Arena**](https://paneui.vercel.app/#/model-arena) · [source](src/components/blocks/model-arena.tsx) | Blind side-by-side model comparison: one prompt, two streaming answers, a vote, then the reveal and a leaderboard. | `card` `chat` `evals` `feedback` |
| [**Agent Tasks**](https://paneui.vercel.app/#/agent-tasks) · [source](src/components/blocks/agent-tasks.tsx) | A home for background coding agents: start a task, watch it run, review and open a pull request. | `agent` `app-shell` `approval` `board` |
| [**AI Chat**](https://paneui.vercel.app/#/ai-chat) · [source](src/components/blocks/ai-chat.tsx) | Full chat card: streamed markdown, folding reasoning, tool chips, cited sources, chat and model menus, edit and retry into versions. | `chat` `menu` `model` `reasoning` |
| [**Agent Approvals**](https://paneui.vercel.app/#/agent-approvals) · [source](src/components/blocks/agent-approvals.tsx) | One approval card: the waiting tool call, its reason and arguments, and approve, deny or always allow. | `agent` `approval` `button` `card` |
| [**Document Extract**](https://paneui.vercel.app/#/document-extract) · [source](src/components/blocks/document-extract.tsx) | A model reads a document into typed fields: values fill in, hovering one lights its source on the page, low-confidence ones wait for review. | `card` `feedback` `form` `hover` |
| [**Agent Routines**](https://paneui.vercel.app/#/agent-routines) · [source](src/components/blocks/agent-routines.tsx) | Scheduled agents in one card: schedule, next run countdown, run history, run now and edit in place. | `agent` `button` `card` `progress` |
| [**AI Side Panel**](https://paneui.vercel.app/#/ai-side-panel) · [source](src/components/blocks/ai-side-panel.tsx) | An assistant docked beside a page: ask about the page or a selection, review each edit as a word diff, apply it with a tint sweep and undo it. | `agent` `app-shell` `approval` `chat` |
| [**Knowledge Base**](https://paneui.vercel.app/#/knowledge-base) · [source](src/components/blocks/knowledge-base.tsx) | Sources moving through parse, chunk, embed and index, then a retrieval test that shows which chunks come back, with rerank and settings. | `dashboard` `progress` `retrieval` `search` |
| [**Agent Memory**](https://paneui.vercel.app/#/agent-memory) · [source](src/components/blocks/agent-memory.tsx) | A full memory card: capacity meter, switches, filters, search, captured notes, inline edit and forget with undo. | `agent` `card` `form` `memory` |
| [**Prompt Studio**](https://paneui.vercel.app/#/prompt-studio) · [source](src/components/blocks/prompt-studio.tsx) | Edit, test and ship a prompt template: variable chips with sample values, a test run on the chosen model, and versions to compare and promote. | `app-shell` `evals` `form` `model` |

### Building blocks

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Command Menu**](https://paneui.vercel.app/#/command-menu) · [source](src/components/ui/command-menu.tsx) | ⌘K palette with groups, search, shortcuts and nested pages. | `app-shell` `dialog` `keyboard` `menu` |
| [**Combobox**](https://paneui.vercel.app/#/combobox) · [source](src/components/ui/combobox.tsx) | Searchable select with keyboard navigation and multi-select. | `form` `input` `keyboard` `menu` |
| [**Segmented Control**](https://paneui.vercel.app/#/segmented-control) · [source](src/components/ui/segmented-control.tsx) | Options in a row with a thumb that glides to the selection. | `button` `gesture` `hover` `picker` |
| [**OTP Input**](https://paneui.vercel.app/#/otp-input) · [source](src/components/ui/otp-input.tsx) | One-time code boxes with paste, auto-advance and a verify state. | `feedback` `form` `input` `keyboard` |
| [**Dot Matrix Number**](https://paneui.vercel.app/#/dot-matrix-number) · [source](src/components/ui/dot-matrix-number.tsx) | Numbers drawn in dots that morph between values, with a glass vitals card. | `dashboard` `glass` `hero` `kpi` |
| [**Toaster**](https://paneui.vercel.app/#/toaster) · [source](src/components/ui/toaster.tsx) | Stacked toasts that expand on hover, swipe away and track promises. | `feedback` `gesture` `hover` `loading` |
| [**Notification Stack**](https://paneui.vercel.app/#/notification-stack) · [source](src/components/ui/notification-stack.tsx) | A stack of notifications that fans out, groups and clears. | `app-shell` `card` `dashboard` `gesture` |
| [**Dropzone**](https://paneui.vercel.app/#/dropzone) · [source](src/components/ui/dropzone.tsx) | Drag-and-drop upload with per-file progress, errors and remove. | `drag` `feedback` `form` `progress` |
| [**Usage Meter**](https://paneui.vercel.app/#/usage-meter) · [source](src/components/ui/usage-meter.tsx) | Credits and limits as meters that fill, with a reset date. | `card` `cost` `dashboard` `kpi` |
| [**Button**](https://paneui.vercel.app/#/button) · [source](src/components/ui/button.tsx) | Variants, sizes, icons and a loading state. | `button` `feedback` `form` `loading` |
| [**Filter Menu**](https://paneui.vercel.app/#/filter-menu) · [source](src/components/ui/filter-menu.tsx) | Add, edit and clear filters from one menu. | `dashboard` `form` `menu` `picker` |
| [**Profile Menu**](https://paneui.vercel.app/#/profile-menu) · [source](src/components/ui/profile-menu.tsx) | Account menu with workspace switcher, theme and sign out. | `app-shell` `menu` `navigation` `picker` |

### Blocks

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Logo Marquee**](https://paneui.vercel.app/#/logo-marquee) · [source](src/components/blocks/logo-marquee.tsx) | The endless 'Trusted by' strip that eases to a stop on hover and scrubs with inertia. | `hover` `landing` `marketing` `scroll` |
| [**Dither Cards**](https://paneui.vercel.app/#/dither-cards) · [source](src/components/blocks/dither-cards.tsx) | Editorial cards with dithered ASCII art, task bars and live deltas, gliding sideways. | `card` `dither` `gesture` `kpi` |
| [**Testimonial Wall**](https://paneui.vercel.app/#/testimonial-wall) · [source](src/components/blocks/testimonial-wall.tsx) | Columns of testimonials scrolling at different speeds. | `card` `hover` `landing` `marketing` |
| [**Market Terminal**](https://paneui.vercel.app/#/market-terminal) · [source](src/components/blocks/market-terminal.tsx) | Candlestick chart with moving averages and zoom, a live watchlist and an order ticket – plug in real market data. | `chart` `dashboard` `finance` `form` |
| [**Journey Flow**](https://paneui.vercel.app/#/journey-flow) · [source](src/components/blocks/journey-flow.tsx) | A Sankey of paths from first visit to paid: ribbons morph by channel and trace a step's cohort on hover. | `chart` `dashboard` `diagram` `flow` |
| [**MRR Waterfall**](https://paneui.vercel.app/#/mrr-waterfall) · [source](src/components/blocks/mrr-waterfall.tsx) | An MRR bridge of floating bars that morph by period and open the accounts behind each move. | `chart` `dashboard` `finance` `hover` |
| [**Cohort Retention**](https://paneui.vercel.app/#/cohort-retention) · [source](src/components/blocks/cohort-retention.tsx) | A cohort retention triangle that morphs into retention curves and rewashes by segment. | `chart` `dashboard` `hover` `kpi` |

### Showpieces

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Dock**](https://paneui.vercel.app/#/dock) · [source](src/components/ui/dock.tsx) | Magnifying dock: tiles swell with pointer distance on springs, a gliding label, running dots, badges, launch bounce and keyboard. | `app-shell` `hover` `landing` `menu` |
| [**Morph Nav**](https://paneui.vercel.app/#/morph-nav) · [source](src/components/ui/morph-nav.tsx) | Site navigation that morphs one surface into rich dropdown panels, search and a compact state, with a gliding highlight. | `hover` `landing` `marketing` `menu` |
| [**Orbit Menu**](https://paneui.vercel.app/#/orbit-menu) · [source](src/components/ui/orbit-menu.tsx) | Press a round button and its actions swirl out in an arc; drag to an action and release, or tap to keep it open. | `app-shell` `button` `drag` `gesture` |
| [**Holo Card**](https://paneui.vercel.app/#/holo-card) · [source](src/components/ui/holo-card.tsx) | A member card that leans toward the pointer with holographic foil, glitter and glare, and flips to its back. | `3d` `card` `glow` `hover` |
| [**Glass Menu**](https://paneui.vercel.app/#/glass-menu) · [source](src/components/ui/glass-menu.tsx) | Frosted action menu: the trigger morphs into the panel on a spring, a highlight pill glides between rows, one in-place submenu. | `app-shell` `glass` `hover` `keyboard` |
| [**Glass Tab Bar**](https://paneui.vercel.app/#/glass-tabbar) · [source](src/components/ui/glass-tabbar.tsx) | Floating liquid-glass tab bar that refracts the feed behind it, with a draggable lens, a search bubble and a compact state on scroll. | `app-shell` `drag` `glass` `navigation` |
| [**Glass Card**](https://paneui.vercel.app/#/glass-card) · [source](src/components/ui/glass-card.tsx) | Photo card with a glass info panel: pointer-following rim highlight, tilt, and a tap that morphs the panel into a detail sheet. | `3d` `card` `glass` `media` |
| [**Glass Segmented**](https://paneui.vercel.app/#/glass-segmented) · [source](src/components/ui/glass-segmented.tsx) | Glass segmented control with a liquid drop that stretches between segments and can be dragged and flung. | `drag` `gesture` `glass` `morph` |
| [**Control Center**](https://paneui.vercel.app/#/control-center) · [source](src/components/ui/control-center.tsx) | Quick-settings glass panel: tiles that morph into detail, a duration dial and rubber-banded meters. | `app-shell` `dashboard` `drag` `glass` |
| [**Action Morph**](https://paneui.vercel.app/#/action-morph) · [source](src/components/ui/action-morph.tsx) | A floating button that springs into a quick-action menu, then an inline composer, and folds back with a check. | `app-shell` `button` `form` `input` |
| [**Share Sheet**](https://paneui.vercel.app/#/share-sheet) · [source](src/components/ui/share-sheet.tsx) | A Share button that springs open into a panel with copy link, access level, channels and people to send to. | `app-shell` `button` `dialog` `form` |
| [**Sheet Stack**](https://paneui.vercel.app/#/sheet-stack) · [source](src/components/ui/sheet-stack.tsx) | Nested sheets that stack with depth, drag to dismiss, and become stacked dialogs on wide screens. | `app-shell` `dialog` `drag` `gesture` |
| [**Time Dial**](https://paneui.vercel.app/#/time-dial) · [source](src/components/ui/time-dial.tsx) | A 24-hour rotary dial: spin one knob and every office rides its own ring at its local time, with working hours shaded and a rolling readout. | `dashboard` `drag` `gesture` `map` |
| [**Date Reel**](https://paneui.vercel.app/#/date-reel) · [source](src/components/ui/date-reel.tsx) | iOS-style 3D wheel picker for day and time: curved drums, momentum, rubber-band ends, a glass lens and quick picks. | `3d` `drag` `form` `gesture` |
| [**Activity Rings**](https://paneui.vercel.app/#/activity-rings) · [source](src/components/ui/activity-rings.tsx) | Daily goals as tick rings that sweep, count up and trace a second lap past 100%, with a week picker. | `chart` `dashboard` `finance` `kpi` |
| [**Slot Text**](https://paneui.vercel.app/#/slot-text) · [source](src/components/ui/slot-text.tsx) | Text and numbers that spin into their new value on staggered slot-machine reels. | `dashboard` `kpi` `marketing` `morph` |
| [**Now Playing**](https://paneui.vercel.app/#/now-playing) · [source](src/components/ui/now-playing.tsx) | A mini player that grows into the full player in one continuous morph, with generated artwork, a waveform scrubber and pull-down to close. | `app-shell` `drag` `gesture` `media` |
| [**Voice Recorder**](https://paneui.vercel.app/#/voice-recorder) · [source](src/components/ui/voice-recorder.tsx) | Voice notes: tap the mic into a live scrolling waveform, review and scrub, then send the take into the thread. Simulated by default, real microphone on request. | `chat` `gesture` `media` `morph` |
| [**Mega Menu Morph**](https://paneui.vercel.app/#/mega-menu-morph) · [source](src/components/ui/mega-menu-morph.tsx) | A site header whose menus share one floating panel that morphs between them, with hover intent, a safe triangle and an accordion sheet when narrow. | `hover` `landing` `marketing` `menu` |

### Charts

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Sunburst**](https://paneui.vercel.app/#/sunburst) · [source](src/components/ui/sunburst.tsx) | A hierarchy in rings: click a segment and every arc swings around it as the new centre, with a breadcrumb back and a rolling total. | `chart` `dashboard` `diagram` `hierarchy` |
| [**Sankey Flow**](https://paneui.vercel.app/#/sankey-flow) · [source](src/components/ui/sankey-flow.tsx) | Flows between stages as ribbons with drifting particles; hover any node or ribbon to pour its share through the whole journey. | `chart` `dashboard` `diagram` `flow` |
| [**Streamgraph**](https://paneui.vercel.app/#/streamgraph) · [source](src/components/ui/streamgraph.tsx) | Layered streams on a wiggle baseline that morph between ranges, with a layer you can isolate and read week by week. | `chart` `dashboard` `gradient` `hover` |
| [**Radar Chart**](https://paneui.vercel.app/#/radar-chart) · [source](src/components/ui/radar-chart.tsx) | Two or three profiles on one web: shapes morph when you swap a profile, and a sweep across the axes compares values in place. | `chart` `dashboard` `evals` `hover` |
| [**Funnel Chart**](https://paneui.vercel.app/#/funnel-chart) · [source](src/components/ui/funnel-chart.tsx) | A conversion funnel as one smooth tapered band with drop-off at every step, a device split and dots streaming through. | `chart` `dashboard` `flow` `kpi` |
| [**Realtime Stream**](https://paneui.vercel.app/#/realtime-stream) · [source](src/components/ui/realtime-stream.tsx) | A live latency feed on a canvas: it scrolls at the display rate, holds still on hover to read, and pops a marker on every anomaly. | `chart` `dashboard` `hover` `observability` |
| [**Treemap**](https://paneui.vercel.app/#/treemap) · [source](src/components/ui/treemap.tsx) | A squarified treemap: click a tile and the view zooms into it, with a breadcrumb back and a measure switch that morphs every tile. | `chart` `cost` `dashboard` `diagram` |
| [**Ridgeline**](https://paneui.vercel.app/#/ridgeline) · [source](src/components/ui/ridgeline.tsx) | Overlapping distributions, one ridge per group: hover lifts a ridge and reads its quartiles, switching datasets morphs every curve. | `chart` `dashboard` `evals` `gradient` |
| [**Race Bar Chart**](https://paneui.vercel.app/#/race-bar-chart) · [source](src/components/ui/race-bar-chart.tsx) | A ranking over time: bars overtake on springs, values count up, and a timeline you can play or scrub. | `chart` `dashboard` `morph` `physics` |
| [**Data Grid**](https://paneui.vercel.app/#/data-grid) · [source](src/components/ui/data-grid.tsx) | A virtualised grid for thousands of rows: sort, resize columns, select ranges and read trends in inline sparkline cells. | `app-shell` `chart` `dashboard` `drag` |

### AI concepts

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Data Flow**](https://paneui.vercel.app/#/data-flow) · [source](src/components/illustrations/data-flow.tsx) | Sources feed a processing core with a live count: hollow dots turn into solid squares and fan out to destinations. | `diagram` `flow` `graph` `landing` |
| [**Payment Flow**](https://paneui.vercel.app/#/payment-flow) · [source](src/components/illustrations/payment-flow.tsx) | A card tap travels processor, network and bank and back approved, then settlement runs a second rail and the balance counts up. | `diagram` `finance` `flow` `landing` |
| [**Prompt Cache**](https://paneui.vercel.app/#/prompt-cache) · [source](src/components/illustrations/prompt-cache.tsx) | Requests share a prefix: it is written once, read back on later requests, and the cost and time saved add up. | `context` `cost` `diagram` `flow` |
| [**Vector Search**](https://paneui.vercel.app/#/vector-search) · [source](src/components/illustrations/vector-search.tsx) | Documents fold into points on an embedding plane, a query lands, a signal hops the index and a ring lights the nearest matches. | `diagram` `graph` `map` `model` |
| [**Multi-Region Failover**](https://paneui.vercel.app/#/multi-region-failover) · [source](src/components/illustrations/multi-region-failover.tsx) | Requests stream through a load balancer to two regions; one fails, traffic shifts, it recovers and rebalances. | `diagram` `flow` `landing` `map` |
| [**Agent Loop**](https://paneui.vercel.app/#/agent-loop) · [source](src/components/illustrations/agent-loop.tsx) | A head circles gather, act and verify while tool calls and checks land and the context grows. | `agent` `context` `diagram` `flow` |
| [**Mixture of Experts**](https://paneui.vercel.app/#/mixture-of-experts) · [source](src/components/illustrations/mixture-of-experts.tsx) | A router scores each token, sends it to its top experts and merges their outputs. | `diagram` `flow` `graph` `model` |
| [**Speculative Decoding**](https://paneui.vercel.app/#/speculative-decoding) · [source](src/components/illustrations/speculative-decoding.tsx) | A small draft model guesses ahead, the large model checks the guesses in one pass. | `diagram` `flow` `model` `streaming` |
| [**Reasoning Tree**](https://paneui.vercel.app/#/reasoning-tree) · [source](src/components/illustrations/reasoning-tree.tsx) | Tree search over thoughts: score, prune, expand, then draw the best path to the answer. | `agent` `diagram` `graph` `hierarchy` |
| [**Agent Timeline**](https://paneui.vercel.app/#/agent-timeline) · [source](src/components/illustrations/agent-timeline.tsx) | One orchestrated run on a shared time axis, with handoffs and a live token and cost counter. | `agent` `cost` `diagram` `multi-agent` |

### Illustrations

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Neural Panels**](https://paneui.vercel.app/#/neural-panels) · [source](src/components/illustrations/neural-panels.tsx) | Dithered terrain and a particle brain in calm editorial cards, with a typing log. | `3d` `agent` `card` `dither` |
| [**Telemetry Board**](https://paneui.vercel.app/#/telemetry-board) · [source](src/components/illustrations/telemetry-board.tsx) | Dithered art bleeding past editorial panels, ticking telemetry and a glass vitals card. | `card` `dashboard` `dither` `glass` |
| [**Integration Beam**](https://paneui.vercel.app/#/integration-beam) · [source](src/components/illustrations/integration-beam.tsx) | Your product between the tools it connects, with light pulses along curved beams. | `diagram` `flow` `glow` `landing` |
| [**Pipeline Steps**](https://paneui.vercel.app/#/pipeline-steps) · [source](src/components/illustrations/pipeline-steps.tsx) | A how-it-works pipeline that lights up step by step. | `diagram` `flow` `landing` `marketing` |
| [**Step Cards**](https://paneui.vercel.app/#/step-cards) · [source](src/components/illustrations/step-cards.tsx) | Three scene cards that play in sequence: event, AI draft, review. | `agent` `approval` `card` `landing` |
| [**Voice Orb**](https://paneui.vercel.app/#/voice-orb) · [source](src/components/illustrations/voice-orb.tsx) | A sphere of dots that breathes, listens, thinks and speaks. | `3d` `agent` `hero` `loading` |
| [**Agent Team**](https://paneui.vercel.app/#/agent-team) · [source](src/components/illustrations/agent-team.tsx) | A prompt types itself and branches out into a team of agents. | `agent` `diagram` `hierarchy` `landing` |
| [**Logo Cluster**](https://paneui.vercel.app/#/logo-cluster) · [source](src/components/illustrations/logo-cluster.tsx) | Your mark in the middle; logos bounce out of it and settle around it. | `diagram` `hero` `landing` `marketing` |
| [**Lead Sourcing**](https://paneui.vercel.app/#/lead-sourcing) · [source](src/components/illustrations/lead-sourcing.tsx) | An AI tile linked to two tools with a shine running along the connection. | `agent` `diagram` `flow` `glow` |
| [**Integration Grid**](https://paneui.vercel.app/#/integration-grid) · [source](src/components/illustrations/integration-grid.tsx) | A honeycomb wall of app tiles that light up in ripples. | `background` `glow` `graph` `hover` |
| [**Project Flow**](https://paneui.vercel.app/#/project-flow) · [source](src/components/illustrations/project-flow.tsx) | A client task branching into subtasks, notes and roles. | `agent` `board` `diagram` `flow` |
| [**Team Invite**](https://paneui.vercel.app/#/team-invite) · [source](src/components/illustrations/team-invite.tsx) | A cursor drags a new teammate into the empty slot and they go online. | `card` `drag` `marketing` `onboarding` |
| [**Glow Keyboard**](https://paneui.vercel.app/#/glow-keyboard) · [source](src/components/illustrations/glow-keyboard.tsx) | A chat input types itself over a glass keyboard on a glowing floor. | `chat` `glass` `glow` `hero` |
| [**Glow Cloud**](https://paneui.vercel.app/#/glow-cloud) · [source](src/components/illustrations/glow-cloud.tsx) | A cloud mascot that floats, looks around, blinks and winks when clicked. | `empty-state` `feedback` `glow` `hero` |
| [**Empty Calendar**](https://paneui.vercel.app/#/empty-calendar) · [source](src/components/illustrations/empty-calendar.tsx) | Calendar cards marked empty that fan out – an empty state. | `card` `empty-state` `hover` `morph` |
| [**Ghosted Chat**](https://paneui.vercel.app/#/ghosted-chat) · [source](src/components/illustrations/ghosted-chat.tsx) | Unanswered messages marked as read – an empty state. | `card` `chat` `comment` `empty-state` |
| [**Tab Overload**](https://paneui.vercel.app/#/tab-overload) · [source](src/components/illustrations/tab-overload.tsx) | Overlapping browser windows where the highlight follows the tab. | `card` `hover` `marketing` `navigation` |

### Motion

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Dither Field**](https://paneui.vercel.app/#/dither-field) · [source](src/components/motion/dither-field.tsx) | A flowing noise field drawn as ordered-dither dots – a living background. | `background` `dither` `gradient` `hero` |
| [**Text Reveal**](https://paneui.vercel.app/#/text-reveal) · [source](src/components/motion/text-reveal.tsx) | Text that arrives word by word, each fading out of a soft blur. | `hero` `landing` `marketing` `scroll` |
| [**Blur Crossfade**](https://paneui.vercel.app/#/blur-crossfade) · [source](src/components/motion/blur-crossfade.tsx) | Swap content through a soft blur while the box glides to its new size. | `card` `feedback` `morph` `tabs` |
| [**Number Ticker**](https://paneui.vercel.app/#/number-ticker) · [source](src/components/motion/number-ticker.tsx) | Odometer numbers – every digit rolls to its new value. | `dashboard` `finance` `kpi` `pricing` |
| [**Dither Image**](https://paneui.vercel.app/#/dither-image) · [source](src/components/motion/dither-image.tsx) | Turn any image into ordered-dither dot art that assembles and drifts. | `dither` `hero` `landing` `media` |
| [**Gradient Text**](https://paneui.vercel.app/#/gradient-text) · [source](src/components/motion/gradient-text.tsx) | Letters cut from a liquid, ever-flowing gradient. | `fluid` `gradient` `hero` `landing` |
| [**Shimmer Loader**](https://paneui.vercel.app/#/shimmer-loader) · [source](src/components/motion/shimmer-loader.tsx) | Skeleton blocks sharing one soft light sweep, then the content. | `card` `chat` `dashboard` `loading` |
| [**Grid Background**](https://paneui.vercel.app/#/grid-background) · [source](src/components/motion/grid-background.tsx) | A fine line grid that drifts slowly behind your content. | `app-shell` `background` `hero` `landing` |
| [**Gradient Floor**](https://paneui.vercel.app/#/gradient-floor) · [source](src/components/motion/gradient-floor.tsx) | A blurred colour gradient that glows up from the bottom. | `background` `fluid` `glow` `gradient` |

### Screens

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Agent Run**](https://paneui.vercel.app/#/agent-run) · [source](src/components/screens/agent-run.tsx) | One autonomous run: plan, tool calls, an approval it waits on and the draft as a diff. | `agent` `app-shell` `approval` `reasoning` |
| [**Agent Chat**](https://paneui.vercel.app/#/agent-chat) · [source](src/components/screens/agent-chat.tsx) | Orchestrator chat with the agents at work and a brief to fill in beside it. | `agent` `app-shell` `chat` `context` |
| [**Mission Control**](https://paneui.vercel.app/#/mission-control) · [source](src/components/screens/mission-control.tsx) | Multi-agent ops: live throughput, agent lanes, a queue that needs a human, and the run log. | `app-shell` `approval` `dashboard` `kpi` |
| [**Research Desk**](https://paneui.vercel.app/#/research-desk) · [source](src/components/screens/research-desk.tsx) | An agent writes a brief and every claim traces to its source. | `agent` `app-shell` `hover` `reasoning` |
| [**Agent Workbench**](https://paneui.vercel.app/#/agent-workbench) · [source](src/components/screens/agent-workbench.tsx) | Co-edit a doc with an agent: its cursor, tracked suggestions, margin notes and a tape to scrub. | `agent` `app-shell` `approval` `comment` |
| [**Eval Lab**](https://paneui.vercel.app/#/eval-lab) · [source](src/components/screens/eval-lab.tsx) | Compare models on an eval suite, inspect regressions, then ship the candidate. | `app-shell` `chart` `cost` `dashboard` |
| [**Task Tracker**](https://paneui.vercel.app/#/task-tracker) · [source](src/components/screens/task-tracker.tsx) | Board, list and timeline for a project where some assignees are agents. | `agent` `app-shell` `board` `drag` |
| [**Dashboard**](https://paneui.vercel.app/#/ops-dashboard) · [source](src/components/screens/ops-dashboard.tsx) | Business overview: KPIs, revenue with a forecast band, channels, products, regions and a funnel. | `app-shell` `chart` `dashboard` `forecast` |
| [**Accounting**](https://paneui.vercel.app/#/accounting) · [source](src/components/screens/accounting.tsx) | Month-end close: reconcile with agent matches, invoices, a balanced ledger and the P&L. | `agent` `app-shell` `finance` `form` |
| [**Finance**](https://paneui.vercel.app/#/finance) · [source](src/components/screens/finance.tsx) | Cash runway with live scenarios, budget vs actual, flagged spend and subscriptions. | `app-shell` `chart` `dashboard` `finance` |

### Instrument

| Piece | What it does | Tags |
| --- | --- | --- |
| [**Provenance Trail**](https://paneui.vercel.app/#/provenance-trail) · [source](src/components/ui/provenance-trail.tsx) | An AI answer where every claim traces to its source, and unsupported ones say so. | `card` `chat` `hover` `observability` |
| [**Confidence Dither**](https://paneui.vercel.app/#/confidence-dither) · [source](src/components/ui/confidence-dither.tsx) | Model uncertainty drawn as dither density: bars, option distributions and per-token confidence. | `chart` `dither` `evals` `hover` |
| [**Run Scrubber**](https://paneui.vercel.app/#/run-scrubber) · [source](src/components/ui/run-scrubber.tsx) | Scrub back and forth through an agent run like a tape, with its state at every moment. | `agent` `drag` `keyboard` `observability` |
| [**Token Scope**](https://paneui.vercel.app/#/token-scope) · [source](src/components/ui/token-scope.tsx) | An oscilloscope for a live model stream: tokens per second, latency, stalls and tool calls. | `chart` `cost` `model` `observability` |
| [**Readout Bar**](https://paneui.vercel.app/#/readout-bar) · [source](src/components/ui/readout-bar.tsx) | A strip of key numbers that settle when they change, with deltas, tolerances and sparklines. | `chart` `dashboard` `kpi` `observability` |
| [**Spec Table**](https://paneui.vercel.app/#/spec-table) · [source](src/components/ui/spec-table.tsx) | A precise data table: sorting, selection, dither score bars, sticky headers and a readout footer. | `dashboard` `dither` `evals` `keyboard` |
| [**Instrument Form**](https://paneui.vercel.app/#/instrument-form) · [source](src/components/ui/instrument-form.tsx) | Form kit – fields, select, toggles, a ruler slider, stepper, sections and a save bar. | `drag` `form` `input` `keyboard` |
| [**Instrument Shell**](https://paneui.vercel.app/#/instrument-shell) · [source](src/components/blocks/instrument-shell.tsx) | The app frame: a rail with a ruler nav, ⌘K search, breadcrumb and a gridded content area. | `app-shell` `dashboard` `keyboard` `menu` |
| [**Instrument Hero**](https://paneui.vercel.app/#/instrument-hero) · [source](src/components/blocks/instrument-hero.tsx) | An editorial landing hero with a live specimen plot and proof numbers. | `chart` `hero` `landing` `marketing` |
| [**Instrument Pricing**](https://paneui.vercel.app/#/instrument-pricing) · [source](src/components/blocks/instrument-pricing.tsx) | Plans priced live from a usage ruler, with a comparison table that folds on mobile. | `cost` `drag` `landing` `marketing` |

## Learn from it

Every demo file exports `notes` – a few sentences on the technique behind the piece (which CSS or JS trick makes it move).
The [skills page](https://paneui.vercel.app/#/skills) shows 60+ agent skills with real before/after output.

## Develop

```bash
npm install
npm run dev
```

Checks: `npx tsc --noEmit -p tsconfig.app.json`, `npx oxlint src`, `npm run build`. After adding a piece:
`python3 scripts/sync-registry.py && npx shadcn@latest build && python3 scripts/build-llms.py && python3 scripts/build-readme.py`.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

Pane learned a lot from the public work of [affectUI](https://www.affectui.com) by Flo Hoeller and
[Arc UI](https://uiarc.dev) by Elia Kuratli – go look at theirs. All code here is written from scratch; see
[CREDITS.md](CREDITS.md) for techniques and references.

## Licence

MIT © Turar Kametay

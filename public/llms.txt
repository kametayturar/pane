# Pane

> Open-source (MIT) React + Tailwind UI for AI products and agents: components, blocks, animated illustrations and
> motion effects. Each piece is ONE self-contained .tsx file (its own CSS and tokens, light + dark, reduced motion,
> keyboard and screen reader support) with a built-in demo state so it works with no props, plus typed props for real data.

## How to use this catalog (for AI coding agents)

### Install

- Easiest, works in any React project (no shadcn needed): `curl -sO https://paneui.vercel.app/add.mjs && node add.mjs <slug> [<slug>…]`.
  It writes each piece to `src/components/...` (or `components/...`), creates `lib/utils.ts` if a piece needs it,
  checks the `@/` alias and prints the npm packages to install (usually `lucide-react`).
- In a project that already has shadcn set up (a `components.json`): `npx shadcn@latest add https://paneui.vercel.app/r/<slug>.json`.
  Without `components.json` the shadcn CLI stops at an interactive prompt – use add.mjs instead.
- By hand: fetch `https://paneui.vercel.app/r/<slug>.json` and write `files[0].content` to `<src>/` + `files[0].target`.

### Project prerequisites

- React 19 + react-dom. Many pieces use `lucide-react`. About half import `cn` from `@/lib/utils`.
- The `@/` import alias must resolve to your source folder in BOTH the bundler and TypeScript:
  tsconfig `"paths": { "@/*": ["./src/*"] }` and (Vite) `resolve: { alias: { "@": path.resolve(__dirname, "src") } }`.
- Pieces ship their own CSS (a `<style>` tag inside the file) – Tailwind is NOT required, and you don't need the demos.

### Theming

- Dark mode: pieces switch when an ancestor has the class `dark` or `data-theme="dark"`. To follow the OS, add to your entry file:
  `const mq = matchMedia('(prefers-color-scheme: dark)'); const sync = () => document.documentElement.classList.toggle('dark', mq.matches); sync(); mq.addEventListener('change', sync)`.
- Brand colour: illustrations, motion pieces and many blocks take an `accent` prop – pass a CSS colour or a variable (`accent="var(--brand)"`).
  Every piece also exposes tokens on its root (`--<prefix>-accent`, `-ink`, `-surface`, `-font`, `-ease`). Override them with a selector
  at least as specific as the piece's own dark rule, e.g. `html .aia, html.dark .aia { --aia-accent: #4f46e5; }` – a plain `.aia {}` loses in dark mode.
  The prefix is the root class of the piece (open the file – it's the first selector in its CSS).
- Tailwind v4: pieces' CSS is unlayered, so it beats Tailwind utilities (which live in `@layer`). Put layout classes on a wrapper
  element around the piece instead of on the piece itself.

### Behaviour

- Every piece works with no props (built-in demo content/simulation). Pass your real content through props – read the file's exported types.
- Some pieces start their animation when they mount (e.g. `ai-answer`, `thinking-state`). Below the fold, mount them when they scroll
  into view (an IntersectionObserver gate) so people see the motion. Illustrations and motion pieces already wait until visible.
- Live preview of every piece: https://paneui.vercel.app/#/<slug>
- Skill (house style, build method, glass recipe – follow it when you compose pages): https://paneui.vercel.app/skills/pane.md

## Recipes (which pieces fit which page)

- **A whole product:** start from a Meridian screen that matches the job – `mission-control` (multi-agent ops),
  `research-desk` (reports with sources), `agent-workbench` (co-editing with an agent), `eval-lab` (model evals), `task-tracker` (board/list/timeline),
  `ops-dashboard` (business KPIs), `accounting` (reconcile, invoices, ledger, P&L), `finance` (cash runway, budgets, spend). Each is one file:
  keep its rail and top bar, replace the content with your data. Kit: `instrument-shell`, `instrument-form`, `spec-table`, `readout-bar`,
  `instrument-hero`, `instrument-pricing`, `provenance-trail`, `confidence-dither`, `run-scrubber`, `token-scope`.
- **Landing page:** hero = `dither-field` or `gradient-floor` or `grid-background` behind `text-reveal`; or an illustration like `neural-panels` or `data-flow`.
  How it works = `pipeline-steps` or `step-cards`. Integrations = `integration-beam` or `logo-cluster`. Product demo = an AI block
  (`ai-answer`, `ai-chat`, `agent-orchestrator`). Social proof = `logo-marquee`, `testimonial-wall`. Pricing numbers = `number-ticker`. Buttons = `button`.
- **AI chat app:** `ai-chat` (full block) or compose `chat-composer` / `ai-composer` + `ai-answer` + `thinking-state` + `tool-call-card` + `message-actions`;
  side assistant = `ai-side-panel`; model choice = `model-picker`; usage = `usage-meter`.
- **Agent product:** `agent-orchestrator`, `agent-tasks`, `agent-approvals`, `agent-routines`, `agent-plan`, `approval-card`.
- **Analytics / data:** KPI numbers with `number-ticker`, charts `sunburst`, `sankey-flow`, `streamgraph`, `treemap`, `race-bar-chart`, `realtime-stream`,
  tables `data-grid`; blocks `cohort-retention`, `mrr-waterfall`, `usage-forecast`, `journey-flow`.
- **App chrome & polish:** `command-menu`, `dock`, `morph-nav`, `toaster`, `notification-stack`, `segmented-control`, `glass-*`, empty states (`empty-calendar`, `ghosted-chat`).

## Chat

- **AI Answer** (`ai-answer`, component) – Streamed answer with source cards, citation previews, copy, stop, feedback and follow-ups. Tags: card, chat, feedback, retrieval, sources, streaming, text-effect. File: `components/ui/ai-answer.tsx`. Install: `node add.mjs ai-answer`
- **Thinking State** (`thinking-state`, component) – Working panel with a live timer, searched sources and steps that appear one by one. Tags: agent, loading, progress, reasoning, sources, timeline. File: `components/ui/thinking-state.tsx`. Install: `node add.mjs thinking-state`
- **Thinking Loader** (`thinking-loader`, component) – A small working pill that rolls through phases and settles on a check. Tags: chat, loading, morph, progress, reasoning, text-effect. File: `components/ui/thinking-loader.tsx`. Install: `node add.mjs thinking-loader`
- **Chat Composer** (`chat-composer`, component) – Prompt composer with a model menu, voice input, app connections and an approval request. Tags: approval, chat, input, menu, model, prompt, voice. File: `components/ui/chat-composer.tsx`. Install: `node add.mjs chat-composer`
- **Writing Assistant** (`writing-assistant`, component) – A small AI writing helper with suggestions, streamed replies and voice dictation. Tags: chat, input, prompt, streaming, text-effect, voice. File: `components/ui/writing-assistant.tsx`. Install: `node add.mjs writing-assistant`
- **Model Picker** (`model-picker`, component) – Model menu with speed, quality and cost bars, extended thinking and effort. Tags: chat, cost, menu, model, picker, reasoning, toggle. File: `components/ui/model-picker.tsx`. Install: `node add.mjs model-picker`
- **Message Actions** (`message-actions`, component) – Copy, retry, feedback and share under an assistant message. Tags: button, chat, feedback, hover, toggle. File: `components/ui/message-actions.tsx`. Install: `node add.mjs message-actions`
- **Tool Call Card** (`tool-call-card`, component) – One tool call with its arguments, a live status and the result folded in. Tags: agent, card, chat, loading, progress, tool-call. File: `components/ui/tool-call-card.tsx`. Install: `node add.mjs tool-call-card`
- **Approval Card** (`approval-card`, component) – An action the agent wants to take, waiting for you to approve or deny. Tags: agent, approval, button, card, chat, feedback. File: `components/ui/approval-card.tsx`. Install: `node add.mjs approval-card`
- **Permission Request** (`permission-request`, component) – An app asks for access – scopes, once or always, and a clear deny. Tags: agent, approval, button, card, dialog, toggle. File: `components/ui/permission-request.tsx`. Install: `node add.mjs permission-request`
- **Reaction Bar** (`reaction-bar`, component) – Emoji reactions that pop, count up and show who reacted. Tags: button, chat, feedback, hover, social-proof, toggle. File: `components/ui/reaction-bar.tsx`. Install: `node add.mjs reaction-bar`
- **Email Draft** (`email-draft`, component) – An AI-drafted email you can review, tweak and send. Tags: agent, card, chat, form, input, prompt. File: `components/ui/email-draft.tsx`. Install: `node add.mjs email-draft`
- **Comment Thread** (`comment-thread`, component) – A threaded discussion with replies, mentions and resolve. Tags: card, chat, comment, hover, input, social-proof. File: `components/ui/comment-thread.tsx`. Install: `node add.mjs comment-thread`

## Agents

- **Agent Plan** (`agent-plan`, component) – The agent's plan as steps that tick through, with sub-steps and edits. Tags: agent, card, dashboard, progress, reasoning, timeline. File: `components/ui/agent-plan.tsx`. Install: `node add.mjs agent-plan`
- **Decision Inbox** (`decision-inbox`, component) – Decisions the agents need from you, one at a time. Tags: agent, approval, button, card, feedback, notification. File: `components/ui/decision-inbox.tsx`. Install: `node add.mjs decision-inbox`
- **Change Summary** (`change-summary`, component) – What an agent changed, summarised with counts and details. Tags: agent, approval, card, feedback, table, tool-call. File: `components/ui/change-summary.tsx`. Install: `node add.mjs change-summary`
- **Progress Tracker** (`progress-tracker`, component) – A long task's progress with steps, ETA and live updates. Tags: agent, card, loading, progress, realtime, timeline. File: `components/ui/progress-tracker.tsx`. Install: `node add.mjs progress-tracker`
- **Smart Recommendation** (`smart-recommendation`, component) – A suggestion from the assistant with its reason and one-click apply. Tags: agent, button, card, chat, feedback, reasoning. File: `components/ui/smart-recommendation.tsx`. Install: `node add.mjs smart-recommendation`
- **Tips Panel** (`tips-panel`, component) – Rotating tips and how-tos in a small dismissible panel. Tags: agent, button, card, feedback, notification, onboarding. File: `components/ui/tips-panel.tsx`. Install: `node add.mjs tips-panel`
- **Memory Panel** (`memory-panel`, component) – What the assistant remembers – grouped, searchable, editable, with pause and undo. Tags: agent, card, context, memory, search, settings, toggle. File: `components/ui/memory-panel.tsx`. Install: `node add.mjs memory-panel`

## AI blocks

- **MCP Servers** (`mcp-servers`, block) – The MCP servers behind an agent: what the enabled tools cost in context, connect or pause a server, switch single tools. Tags: agent, context, menu, settings, toggle, tool-call. File: `components/blocks/mcp-servers.tsx`. Install: `node add.mjs mcp-servers`
- **Eval Suite** (`eval-suite`, block) – Run a suite on a new version against its baseline: cases stream in, regressions and fixes are called out with the cases behind them. Tags: agent, dashboard, evals, feedback, progress, streaming, table. File: `components/blocks/eval-suite.tsx`. Install: `node add.mjs eval-suite`
- **Usage Forecast** (`usage-forecast`, block) – A billing period usage chart with a forecast cone and a draggable budget that dates the crossing. Tags: chart, cost, dashboard, drag, finance, forecast. File: `components/blocks/usage-forecast.tsx`. Install: `node add.mjs usage-forecast`
- **Agent Orchestrator** (`agent-orchestrator`, block) – A lead agent splits a goal into a plan, fans subtasks out to parallel lanes and merges the results. Tags: agent, dashboard, diagram, flow, multi-agent, progress, streaming. File: `components/blocks/agent-orchestrator.tsx`. Install: `node add.mjs agent-orchestrator`
- **AI Composer** (`ai-composer`, block) – Prompt box with attachments, @ mentions and / commands, a model and effort menu, and a send button ringed by the reply's progress. Tags: chat, input, keyboard, menu, model, progress, prompt. File: `components/blocks/ai-composer.tsx`. Install: `node add.mjs ai-composer`
- **Model Arena** (`model-arena`, block) – Blind side-by-side model comparison: one prompt, two streaming answers, a vote, then the reveal and a leaderboard. Tags: card, chat, evals, feedback, model, ranking, streaming. File: `components/blocks/model-arena.tsx`. Install: `node add.mjs model-arena`
- **Agent Tasks** (`agent-tasks`, block) – A home for background coding agents: start a task, watch it run, review and open a pull request. Tags: agent, app-shell, approval, board, dashboard, progress, streaming. File: `components/blocks/agent-tasks.tsx`. Install: `node add.mjs agent-tasks`
- **AI Chat** (`ai-chat`, block) – Full chat card: streamed markdown, folding reasoning, tool chips, cited sources, chat and model menus, edit and retry into versions. Tags: chat, menu, model, reasoning, sources, streaming, tool-call. File: `components/blocks/ai-chat.tsx`. Install: `node add.mjs ai-chat`
- **Agent Approvals** (`agent-approvals`, block) – One approval card: the waiting tool call, its reason and arguments, and approve, deny or always allow. Tags: agent, approval, button, card, dialog, feedback, tool-call. File: `components/blocks/agent-approvals.tsx`. Install: `node add.mjs agent-approvals`
- **Document Extract** (`document-extract`, block) – A model reads a document into typed fields: values fill in, hovering one lights its source on the page, low-confidence ones wait for review. Tags: card, feedback, form, hover, media, retrieval, streaming, upload. File: `components/blocks/document-extract.tsx`. Install: `node add.mjs document-extract`
- **Agent Routines** (`agent-routines`, block) – Scheduled agents in one card: schedule, next run countdown, run history, run now and edit in place. Tags: agent, button, card, progress, settings, timeline, toggle. File: `components/blocks/agent-routines.tsx`. Install: `node add.mjs agent-routines`
- **AI Side Panel** (`ai-side-panel`, block) – An assistant docked beside a page: ask about the page or a selection, review each edit as a word diff, apply it with a tint sweep and undo it. Tags: agent, app-shell, approval, chat, context, feedback, streaming. File: `components/blocks/ai-side-panel.tsx`. Install: `node add.mjs ai-side-panel`
- **Knowledge Base** (`knowledge-base`, block) – Sources moving through parse, chunk, embed and index, then a retrieval test that shows which chunks come back, with rerank and settings. Tags: dashboard, progress, retrieval, search, settings, sources, upload. File: `components/blocks/knowledge-base.tsx`. Install: `node add.mjs knowledge-base`
- **Agent Memory** (`agent-memory`, block) – A full memory card: capacity meter, switches, filters, search, captured notes, inline edit and forget with undo. Tags: agent, card, form, memory, search, settings, toggle. File: `components/blocks/agent-memory.tsx`. Install: `node add.mjs agent-memory`
- **Prompt Studio** (`prompt-studio`, block) – Edit, test and ship a prompt template: variable chips with sample values, a test run on the chosen model, and versions to compare and promote. Tags: app-shell, evals, form, model, prompt, settings, streaming. File: `components/blocks/prompt-studio.tsx`. Install: `node add.mjs prompt-studio`

## Building blocks

- **Command Menu** (`command-menu`, component) – ⌘K palette with groups, search, shortcuts and nested pages. Tags: app-shell, dialog, keyboard, menu, navigation, search. File: `components/ui/command-menu.tsx`. Install: `node add.mjs command-menu`
- **Combobox** (`combobox`, component) – Searchable select with keyboard navigation and multi-select. Tags: form, input, keyboard, menu, picker, search. File: `components/ui/combobox.tsx`. Install: `node add.mjs combobox`
- **Segmented Control** (`segmented-control`, component) – Options in a row with a thumb that glides to the selection. Tags: button, gesture, hover, picker, tabs, toggle. File: `components/ui/segmented-control.tsx`. Install: `node add.mjs segmented-control`
- **OTP Input** (`otp-input`, component) – One-time code boxes with paste, auto-advance and a verify state. Tags: feedback, form, input, keyboard, progress. File: `components/ui/otp-input.tsx`. Install: `node add.mjs otp-input`
- **Dot Matrix Number** (`dot-matrix-number`, component) – Numbers drawn in dots that morph between values, with a glass vitals card. Tags: dashboard, glass, hero, kpi, morph, text-effect. File: `components/ui/dot-matrix-number.tsx`. Install: `node add.mjs dot-matrix-number`
- **Toaster** (`toaster`, component) – Stacked toasts that expand on hover, swipe away and track promises. Tags: feedback, gesture, hover, loading, notification, progress. File: `components/ui/toaster.tsx`. Install: `node add.mjs toaster`
- **Notification Stack** (`notification-stack`, component) – A stack of notifications that fans out, groups and clears. Tags: app-shell, card, dashboard, gesture, hover, notification. File: `components/ui/notification-stack.tsx`. Install: `node add.mjs notification-stack`
- **Dropzone** (`dropzone`, component) – Drag-and-drop upload with per-file progress, errors and remove. Tags: drag, feedback, form, progress, upload. File: `components/ui/dropzone.tsx`. Install: `node add.mjs dropzone`
- **Usage Meter** (`usage-meter`, component) – Credits and limits as meters that fill, with a reset date. Tags: card, cost, dashboard, kpi, progress, settings. File: `components/ui/usage-meter.tsx`. Install: `node add.mjs usage-meter`
- **Button** (`button`, component) – Variants, sizes, icons and a loading state. Tags: button, feedback, form, loading, marketing. File: `components/ui/button.tsx`. Install: `node add.mjs button`
- **Filter Menu** (`filter-menu`, component) – Add, edit and clear filters from one menu. Tags: dashboard, form, menu, picker, search, table. File: `components/ui/filter-menu.tsx`. Install: `node add.mjs filter-menu`
- **Profile Menu** (`profile-menu`, component) – Account menu with workspace switcher, theme and sign out. Tags: app-shell, menu, navigation, picker, settings, toggle. File: `components/ui/profile-menu.tsx`. Install: `node add.mjs profile-menu`

## Blocks

- **Logo Marquee** (`logo-marquee`, block) – The endless 'Trusted by' strip that eases to a stop on hover and scrubs with inertia. Tags: hover, landing, marketing, scroll, scrub, social-proof. File: `components/blocks/logo-marquee.tsx`. Install: `node add.mjs logo-marquee`
- **Dither Cards** (`dither-cards`, block) – Editorial cards with dithered ASCII art, task bars and live deltas, gliding sideways. Tags: card, dither, gesture, kpi, landing, marketing, scroll. File: `components/blocks/dither-cards.tsx`. Install: `node add.mjs dither-cards`
- **Testimonial Wall** (`testimonial-wall`, block) – Columns of testimonials scrolling at different speeds. Tags: card, hover, landing, marketing, scroll, social-proof. File: `components/blocks/testimonial-wall.tsx`. Install: `node add.mjs testimonial-wall`
- **Market Terminal** (`market-terminal`, block) – Candlestick chart with moving averages and zoom, a live watchlist and an order ticket – plug in real market data. Tags: chart, dashboard, finance, form, keyboard, realtime, table. File: `components/blocks/market-terminal.tsx`. Install: `node add.mjs market-terminal`
- **Journey Flow** (`journey-flow`, block) – A Sankey of paths from first visit to paid: ribbons morph by channel and trace a step's cohort on hover. Tags: chart, dashboard, diagram, flow, hover, kpi, morph. File: `components/blocks/journey-flow.tsx`. Install: `node add.mjs journey-flow`
- **MRR Waterfall** (`mrr-waterfall`, block) – An MRR bridge of floating bars that morph by period and open the accounts behind each move. Tags: chart, dashboard, finance, hover, kpi, morph, table. File: `components/blocks/mrr-waterfall.tsx`. Install: `node add.mjs mrr-waterfall`
- **Cohort Retention** (`cohort-retention`, block) – A cohort retention triangle that morphs into retention curves and rewashes by segment. Tags: chart, dashboard, hover, kpi, morph, table, timeline. File: `components/blocks/cohort-retention.tsx`. Install: `node add.mjs cohort-retention`

## Showpieces

- **Dock** (`dock`, component) – Magnifying dock: tiles swell with pointer distance on springs, a gliding label, running dots, badges, launch bounce and keyboard. Tags: app-shell, hover, landing, menu, navigation, pointer-follow. File: `components/ui/dock.tsx`. Install: `node add.mjs dock`
- **Morph Nav** (`morph-nav`, component) – Site navigation that morphs one surface into rich dropdown panels, search and a compact state, with a gliding highlight. Tags: hover, landing, marketing, menu, morph, navigation, search. File: `components/ui/morph-nav.tsx`. Install: `node add.mjs morph-nav`
- **Orbit Menu** (`orbit-menu`, component) – Press a round button and its actions swirl out in an arc; drag to an action and release, or tap to keep it open. Tags: app-shell, button, drag, gesture, menu, morph. File: `components/ui/orbit-menu.tsx`. Install: `node add.mjs orbit-menu`
- **Holo Card** (`holo-card`, component) – A member card that leans toward the pointer with holographic foil, glitter and glare, and flips to its back. Tags: 3d, card, glow, hover, landing, pointer-follow. File: `components/ui/holo-card.tsx`. Install: `node add.mjs holo-card`
- **Glass Menu** (`glass-menu`, component) – Frosted action menu: the trigger morphs into the panel on a spring, a highlight pill glides between rows, one in-place submenu. Tags: app-shell, glass, hover, keyboard, menu, morph. File: `components/ui/glass-menu.tsx`. Install: `node add.mjs glass-menu`
- **Glass Tab Bar** (`glass-tabbar`, component) – Floating liquid-glass tab bar that refracts the feed behind it, with a draggable lens, a search bubble and a compact state on scroll. Tags: app-shell, drag, glass, navigation, scroll, search, tabs. File: `components/ui/glass-tabbar.tsx`. Install: `node add.mjs glass-tabbar`
- **Glass Card** (`glass-card`, component) – Photo card with a glass info panel: pointer-following rim highlight, tilt, and a tap that morphs the panel into a detail sheet. Tags: 3d, card, glass, media, morph, pointer-follow. File: `components/ui/glass-card.tsx`. Install: `node add.mjs glass-card`
- **Glass Segmented** (`glass-segmented`, component) – Glass segmented control with a liquid drop that stretches between segments and can be dragged and flung. Tags: drag, gesture, glass, morph, settings, tabs, toggle. File: `components/ui/glass-segmented.tsx`. Install: `node add.mjs glass-segmented`
- **Control Center** (`control-center`, component) – Quick-settings glass panel: tiles that morph into detail, a duration dial and rubber-banded meters. Tags: app-shell, dashboard, drag, glass, morph, settings, toggle. File: `components/ui/control-center.tsx`. Install: `node add.mjs control-center`
- **Action Morph** (`action-morph`, component) – A floating button that springs into a quick-action menu, then an inline composer, and folds back with a check. Tags: app-shell, button, form, input, menu, morph. File: `components/ui/action-morph.tsx`. Install: `node add.mjs action-morph`
- **Share Sheet** (`share-sheet`, component) – A Share button that springs open into a panel with copy link, access level, channels and people to send to. Tags: app-shell, button, dialog, form, menu, morph. File: `components/ui/share-sheet.tsx`. Install: `node add.mjs share-sheet`
- **Sheet Stack** (`sheet-stack`, component) – Nested sheets that stack with depth, drag to dismiss, and become stacked dialogs on wide screens. Tags: app-shell, dialog, drag, gesture, screen. File: `components/ui/sheet-stack.tsx`. Install: `node add.mjs sheet-stack`
- **Time Dial** (`time-dial`, component) – A 24-hour rotary dial: spin one knob and every office rides its own ring at its local time, with working hours shaded and a rolling readout. Tags: dashboard, drag, gesture, map, picker, settings, timeline. File: `components/ui/time-dial.tsx`. Install: `node add.mjs time-dial`
- **Date Reel** (`date-reel`, component) – iOS-style 3D wheel picker for day and time: curved drums, momentum, rubber-band ends, a glass lens and quick picks. Tags: 3d, drag, form, gesture, glass, picker, scroll. File: `components/ui/date-reel.tsx`. Install: `node add.mjs date-reel`
- **Activity Rings** (`activity-rings`, component) – Daily goals as tick rings that sweep, count up and trace a second lap past 100%, with a week picker. Tags: chart, dashboard, finance, kpi, progress, scrub. File: `components/ui/activity-rings.tsx`. Install: `node add.mjs activity-rings`
- **Slot Text** (`slot-text`, component) – Text and numbers that spin into their new value on staggered slot-machine reels. Tags: dashboard, kpi, marketing, morph, text-effect. File: `components/ui/slot-text.tsx`. Install: `node add.mjs slot-text`
- **Now Playing** (`now-playing`, component) – A mini player that grows into the full player in one continuous morph, with generated artwork, a waveform scrubber and pull-down to close. Tags: app-shell, drag, gesture, media, morph, scrub. File: `components/ui/now-playing.tsx`. Install: `node add.mjs now-playing`
- **Voice Recorder** (`voice-recorder`, component) – Voice notes: tap the mic into a live scrolling waveform, review and scrub, then send the take into the thread. Simulated by default, real microphone on request. Tags: chat, gesture, media, morph, scrub, upload, voice. File: `components/ui/voice-recorder.tsx`. Install: `node add.mjs voice-recorder`
- **Mega Menu Morph** (`mega-menu-morph`, component) – A site header whose menus share one floating panel that morphs between them, with hover intent, a safe triangle and an accordion sheet when narrow. Tags: hover, landing, marketing, menu, morph, navigation. File: `components/ui/mega-menu-morph.tsx`. Install: `node add.mjs mega-menu-morph`

## Charts

- **Sunburst** (`sunburst`, component) – A hierarchy in rings: click a segment and every arc swings around it as the new centre, with a breadcrumb back and a rolling total. Tags: chart, dashboard, diagram, hierarchy, hover, morph. File: `components/ui/sunburst.tsx`. Install: `node add.mjs sunburst`
- **Sankey Flow** (`sankey-flow`, component) – Flows between stages as ribbons with drifting particles; hover any node or ribbon to pour its share through the whole journey. Tags: chart, dashboard, diagram, flow, graph, hover, particles. File: `components/ui/sankey-flow.tsx`. Install: `node add.mjs sankey-flow`
- **Streamgraph** (`streamgraph`, component) – Layered streams on a wiggle baseline that morph between ranges, with a layer you can isolate and read week by week. Tags: chart, dashboard, gradient, hover, morph, timeline. File: `components/ui/streamgraph.tsx`. Install: `node add.mjs streamgraph`
- **Radar Chart** (`radar-chart`, component) – Two or three profiles on one web: shapes morph when you swap a profile, and a sweep across the axes compares values in place. Tags: chart, dashboard, evals, hover, morph, scrub. File: `components/ui/radar-chart.tsx`. Install: `node add.mjs radar-chart`
- **Funnel Chart** (`funnel-chart`, component) – A conversion funnel as one smooth tapered band with drop-off at every step, a device split and dots streaming through. Tags: chart, dashboard, flow, kpi, marketing, particles. File: `components/ui/funnel-chart.tsx`. Install: `node add.mjs funnel-chart`
- **Realtime Stream** (`realtime-stream`, component) – A live latency feed on a canvas: it scrolls at the display rate, holds still on hover to read, and pops a marker on every anomaly. Tags: chart, dashboard, hover, observability, realtime, timeline. File: `components/ui/realtime-stream.tsx`. Install: `node add.mjs realtime-stream`
- **Treemap** (`treemap`, component) – A squarified treemap: click a tile and the view zooms into it, with a breadcrumb back and a measure switch that morphs every tile. Tags: chart, cost, dashboard, diagram, hierarchy, hover, morph. File: `components/ui/treemap.tsx`. Install: `node add.mjs treemap`
- **Ridgeline** (`ridgeline`, component) – Overlapping distributions, one ridge per group: hover lifts a ridge and reads its quartiles, switching datasets morphs every curve. Tags: chart, dashboard, evals, gradient, hover, morph. File: `components/ui/ridgeline.tsx`. Install: `node add.mjs ridgeline`
- **Race Bar Chart** (`race-bar-chart`, component) – A ranking over time: bars overtake on springs, values count up, and a timeline you can play or scrub. Tags: chart, dashboard, morph, physics, ranking, scrub, timeline. File: `components/ui/race-bar-chart.tsx`. Install: `node add.mjs race-bar-chart`
- **Data Grid** (`data-grid`, component) – A virtualised grid for thousands of rows: sort, resize columns, select ranges and read trends in inline sparkline cells. Tags: app-shell, chart, dashboard, drag, keyboard, scroll, table. File: `components/ui/data-grid.tsx`. Install: `node add.mjs data-grid`

## AI concepts

- **Data Flow** (`data-flow`, illustration) – Sources feed a processing core with a live count: hollow dots turn into solid squares and fan out to destinations. Tags: diagram, flow, graph, landing, marketing, particles. File: `components/illustrations/data-flow.tsx`. Install: `node add.mjs data-flow`
- **Payment Flow** (`payment-flow`, illustration) – A card tap travels processor, network and bank and back approved, then settlement runs a second rail and the balance counts up. Tags: diagram, finance, flow, landing, marketing, timeline. File: `components/illustrations/payment-flow.tsx`. Install: `node add.mjs payment-flow`
- **Prompt Cache** (`prompt-cache`, illustration) – Requests share a prefix: it is written once, read back on later requests, and the cost and time saved add up. Tags: context, cost, diagram, flow, prompt, timeline. File: `components/illustrations/prompt-cache.tsx`. Install: `node add.mjs prompt-cache`
- **Vector Search** (`vector-search`, illustration) – Documents fold into points on an embedding plane, a query lands, a signal hops the index and a ring lights the nearest matches. Tags: diagram, graph, map, model, retrieval, search. File: `components/illustrations/vector-search.tsx`. Install: `node add.mjs vector-search`
- **Multi-Region Failover** (`multi-region-failover`, illustration) – Requests stream through a load balancer to two regions; one fails, traffic shifts, it recovers and rebalances. Tags: diagram, flow, landing, map, observability, realtime. File: `components/illustrations/multi-region-failover.tsx`. Install: `node add.mjs multi-region-failover`
- **Agent Loop** (`agent-loop`, illustration) – A head circles gather, act and verify while tool calls and checks land and the context grows. Tags: agent, context, diagram, flow, reasoning, tool-call. File: `components/illustrations/agent-loop.tsx`. Install: `node add.mjs agent-loop`
- **Mixture of Experts** (`mixture-of-experts`, illustration) – A router scores each token, sends it to its top experts and merges their outputs. Tags: diagram, flow, graph, model, ranking. File: `components/illustrations/mixture-of-experts.tsx`. Install: `node add.mjs mixture-of-experts`
- **Speculative Decoding** (`speculative-decoding`, illustration) – A small draft model guesses ahead, the large model checks the guesses in one pass. Tags: diagram, flow, model, streaming, timeline. File: `components/illustrations/speculative-decoding.tsx`. Install: `node add.mjs speculative-decoding`
- **Reasoning Tree** (`reasoning-tree`, illustration) – Tree search over thoughts: score, prune, expand, then draw the best path to the answer. Tags: agent, diagram, graph, hierarchy, reasoning. File: `components/illustrations/reasoning-tree.tsx`. Install: `node add.mjs reasoning-tree`
- **Agent Timeline** (`agent-timeline`, illustration) – One orchestrated run on a shared time axis, with handoffs and a live token and cost counter. Tags: agent, cost, diagram, multi-agent, observability, timeline. File: `components/illustrations/agent-timeline.tsx`. Install: `node add.mjs agent-timeline`

## Illustrations

- **Neural Panels** (`neural-panels`, illustration) – Dithered terrain and a particle brain in calm editorial cards, with a typing log. Tags: 3d, agent, card, dither, landing, particles, streaming. File: `components/illustrations/neural-panels.tsx`. Install: `node add.mjs neural-panels`
- **Telemetry Board** (`telemetry-board`, illustration) – Dithered art bleeding past editorial panels, ticking telemetry and a glass vitals card. Tags: card, dashboard, dither, glass, kpi, observability, realtime. File: `components/illustrations/telemetry-board.tsx`. Install: `node add.mjs telemetry-board`
- **Integration Beam** (`integration-beam`, illustration) – Your product between the tools it connects, with light pulses along curved beams. Tags: diagram, flow, glow, landing, marketing. File: `components/illustrations/integration-beam.tsx`. Install: `node add.mjs integration-beam`
- **Pipeline Steps** (`pipeline-steps`, illustration) – A how-it-works pipeline that lights up step by step. Tags: diagram, flow, landing, marketing, progress, timeline. File: `components/illustrations/pipeline-steps.tsx`. Install: `node add.mjs pipeline-steps`
- **Step Cards** (`step-cards`, illustration) – Three scene cards that play in sequence: event, AI draft, review. Tags: agent, approval, card, landing, marketing, onboarding, timeline. File: `components/illustrations/step-cards.tsx`. Install: `node add.mjs step-cards`
- **Voice Orb** (`voice-orb`, illustration) – A sphere of dots that breathes, listens, thinks and speaks. Tags: 3d, agent, hero, loading, particles, streaming, voice. File: `components/illustrations/voice-orb.tsx`. Install: `node add.mjs voice-orb`
- **Agent Team** (`agent-team`, illustration) – A prompt types itself and branches out into a team of agents. Tags: agent, diagram, hierarchy, landing, multi-agent, prompt, streaming. File: `components/illustrations/agent-team.tsx`. Install: `node add.mjs agent-team`
- **Logo Cluster** (`logo-cluster`, illustration) – Your mark in the middle; logos bounce out of it and settle around it. Tags: diagram, hero, landing, marketing, physics, social-proof. File: `components/illustrations/logo-cluster.tsx`. Install: `node add.mjs logo-cluster`
- **Lead Sourcing** (`lead-sourcing`, illustration) – An AI tile linked to two tools with a shine running along the connection. Tags: agent, diagram, flow, glow, landing, marketing. File: `components/illustrations/lead-sourcing.tsx`. Install: `node add.mjs lead-sourcing`
- **Integration Grid** (`integration-grid`, illustration) – A honeycomb wall of app tiles that light up in ripples. Tags: background, glow, graph, hover, landing, marketing, social-proof. File: `components/illustrations/integration-grid.tsx`. Install: `node add.mjs integration-grid`
- **Project Flow** (`project-flow`, illustration) – A client task branching into subtasks, notes and roles. Tags: agent, board, diagram, flow, hierarchy, marketing. File: `components/illustrations/project-flow.tsx`. Install: `node add.mjs project-flow`
- **Team Invite** (`team-invite`, illustration) – A cursor drags a new teammate into the empty slot and they go online. Tags: card, drag, marketing, onboarding, pointer-follow, settings. File: `components/illustrations/team-invite.tsx`. Install: `node add.mjs team-invite`
- **Glow Keyboard** (`glow-keyboard`, illustration) – A chat input types itself over a glass keyboard on a glowing floor. Tags: chat, glass, glow, hero, input, keyboard, landing. File: `components/illustrations/glow-keyboard.tsx`. Install: `node add.mjs glow-keyboard`
- **Glow Cloud** (`glow-cloud`, illustration) – A cloud mascot that floats, looks around, blinks and winks when clicked. Tags: empty-state, feedback, glow, hero, morph, pointer-follow. File: `components/illustrations/glow-cloud.tsx`. Install: `node add.mjs glow-cloud`
- **Empty Calendar** (`empty-calendar`, illustration) – Calendar cards marked empty that fan out – an empty state. Tags: card, empty-state, hover, morph, timeline. File: `components/illustrations/empty-calendar.tsx`. Install: `node add.mjs empty-calendar`
- **Ghosted Chat** (`ghosted-chat`, illustration) – Unanswered messages marked as read – an empty state. Tags: card, chat, comment, empty-state, feedback. File: `components/illustrations/ghosted-chat.tsx`. Install: `node add.mjs ghosted-chat`
- **Tab Overload** (`tab-overload`, illustration) – Overlapping browser windows where the highlight follows the tab. Tags: card, hover, marketing, navigation, pointer-follow, tabs. File: `components/illustrations/tab-overload.tsx`. Install: `node add.mjs tab-overload`

## Motion

- **Dither Field** (`dither-field`, motion effect) – A flowing noise field drawn as ordered-dither dots – a living background. Tags: background, dither, gradient, hero, landing, particles. File: `components/motion/dither-field.tsx`. Install: `node add.mjs dither-field`
- **Text Reveal** (`text-reveal`, motion effect) – Text that arrives word by word, each fading out of a soft blur. Tags: hero, landing, marketing, scroll, streaming, text-effect. File: `components/motion/text-reveal.tsx`. Install: `node add.mjs text-reveal`
- **Blur Crossfade** (`blur-crossfade`, motion effect) – Swap content through a soft blur while the box glides to its new size. Tags: card, feedback, morph, tabs, text-effect. File: `components/motion/blur-crossfade.tsx`. Install: `node add.mjs blur-crossfade`
- **Number Ticker** (`number-ticker`, motion effect) – Odometer numbers – every digit rolls to its new value. Tags: dashboard, finance, kpi, pricing, realtime, text-effect. File: `components/motion/number-ticker.tsx`. Install: `node add.mjs number-ticker`
- **Dither Image** (`dither-image`, motion effect) – Turn any image into ordered-dither dot art that assembles and drifts. Tags: dither, hero, landing, media, paper, particles. File: `components/motion/dither-image.tsx`. Install: `node add.mjs dither-image`
- **Gradient Text** (`gradient-text`, motion effect) – Letters cut from a liquid, ever-flowing gradient. Tags: fluid, gradient, hero, landing, marketing, text-effect. File: `components/motion/gradient-text.tsx`. Install: `node add.mjs gradient-text`
- **Shimmer Loader** (`shimmer-loader`, motion effect) – Skeleton blocks sharing one soft light sweep, then the content. Tags: card, chat, dashboard, loading, progress, streaming. File: `components/motion/shimmer-loader.tsx`. Install: `node add.mjs shimmer-loader`
- **Grid Background** (`grid-background`, motion effect) – A fine line grid that drifts slowly behind your content. Tags: app-shell, background, hero, landing, marketing, scroll. File: `components/motion/grid-background.tsx`. Install: `node add.mjs grid-background`
- **Gradient Floor** (`gradient-floor`, motion effect) – A blurred colour gradient that glows up from the bottom. Tags: background, fluid, glow, gradient, hero, landing. File: `components/motion/gradient-floor.tsx`. Install: `node add.mjs gradient-floor`

## Instrument

- **Provenance Trail** (`provenance-trail`, component) – An AI answer where every claim traces to its source, and unsupported ones say so. Tags: card, chat, hover, observability, reasoning, sources. File: `components/ui/provenance-trail.tsx`. Install: `node add.mjs provenance-trail`
- **Confidence Dither** (`confidence-dither`, component) – Model uncertainty drawn as dither density: bars, option distributions and per-token confidence. Tags: chart, dither, evals, hover, model, observability. File: `components/ui/confidence-dither.tsx`. Install: `node add.mjs confidence-dither`
- **Run Scrubber** (`run-scrubber`, component) – Scrub back and forth through an agent run like a tape, with its state at every moment. Tags: agent, drag, keyboard, observability, progress, scrub, timeline. File: `components/ui/run-scrubber.tsx`. Install: `node add.mjs run-scrubber`
- **Token Scope** (`token-scope`, component) – An oscilloscope for a live model stream: tokens per second, latency, stalls and tool calls. Tags: chart, cost, model, observability, realtime, streaming, tool-call. File: `components/ui/token-scope.tsx`. Install: `node add.mjs token-scope`
- **Readout Bar** (`readout-bar`, component) – A strip of key numbers that settle when they change, with deltas, tolerances and sparklines. Tags: chart, dashboard, kpi, observability, progress, realtime. File: `components/ui/readout-bar.tsx`. Install: `node add.mjs readout-bar`
- **Spec Table** (`spec-table`, component) – A precise data table: sorting, selection, dither score bars, sticky headers and a readout footer. Tags: dashboard, dither, evals, keyboard, ranking, table. File: `components/ui/spec-table.tsx`. Install: `node add.mjs spec-table`
- **Instrument Form** (`instrument-form`, component) – Form kit – fields, select, toggles, a ruler slider, stepper, sections and a save bar. Tags: drag, form, input, keyboard, picker, settings, toggle. File: `components/ui/instrument-form.tsx`. Install: `node add.mjs instrument-form`
- **Instrument Shell** (`instrument-shell`, block) – The app frame: a rail with a ruler nav, ⌘K search, breadcrumb and a gridded content area. Tags: app-shell, dashboard, keyboard, menu, navigation, search. File: `components/blocks/instrument-shell.tsx`. Install: `node add.mjs instrument-shell`
- **Instrument Hero** (`instrument-hero`, block) – An editorial landing hero with a live specimen plot and proof numbers. Tags: chart, hero, landing, marketing, social-proof, text-effect. File: `components/blocks/instrument-hero.tsx`. Install: `node add.mjs instrument-hero`
- **Instrument Pricing** (`instrument-pricing`, block) – Plans priced live from a usage ruler, with a comparison table that folds on mobile. Tags: cost, drag, landing, marketing, picker, pricing, table. File: `components/blocks/instrument-pricing.tsx`. Install: `node add.mjs instrument-pricing`

## Screens

- **Agent Run** (`agent-run`) and **Agent Chat** (`agent-chat`) – full app screens built from the pieces above; see https://paneui.vercel.app/#/agent-run and https://paneui.vercel.app/#/agent-chat.

## Backdrop

- **Backdrop** (`backdrop`) – the stage illustrations sit on: plain, dots, halftone, grid, drift, floor, aurora, dither. File: `components/motion/backdrop.tsx`. Install: `npx shadcn@latest add https://paneui.vercel.app/r/backdrop.json`

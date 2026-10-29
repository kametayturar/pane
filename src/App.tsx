import * as React from "react"
import {
  Activity,
  ImageIcon,
  AppWindow,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioWaveform,
  BellRing,
  Binary,
  Blend,
  Bot,
  Brain,
  Cable,
  CalendarX,
  Check,
  ChevronsUpDown,
  Cloud,
  Code2,
  Columns3,
  Command,
  Copy,
  Dock,
  Eye,
  Gauge,
  Grid2x2,
  Grid3x3,
  Mountain,
  Radio,
  Table2,
  ChartNoAxesColumn,
  Hash,
  KeyRound,
  Keyboard,
  Layers,
  Lightbulb,
  LayoutGrid,
  Link2,
  ListChecks,
  Loader,
  Menu,
  MessageCircleOff,
  MessageSquareText,
  Mic,
  Moon,
  MousePointerClick,
  Navigation,
  Orbit,
  Palette,
  Pause,
  PenLine,
  Play,
  RotateCw,
  Route,
  ScanLine,
  Search,
  Share2,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Sunrise,
  ToggleLeft,
  Type,
  Upload,
  UserPlus,
  Users,
  Waypoints,
  Workflow,
  CalendarClock,
  GitPullRequest,
  Wrench,
  X,
  Smile,
  Mail,
  MessagesSquare,
  FileDiff,
  Scale,
  Wand2,
  ListTodo,
  SquareMousePointer,
  Filter,
  CircleUser,
  GalleryHorizontalEnd,
  Quote,
  BrainCircuit,
  Grip,
  PanelsTopLeft,
  CandlestickChart,
  TextCursorInput,
  Swords,
  FlaskConical,
  TrendingUp,
  ScanText,
  PanelRight,
  LibraryBig,
  BrainCog,
  Waves,
  Funnel,
  Radar,
  type LucideIcon,
  CreditCard as PayFlowIcon,
  Globe as FailoverGlobeIcon,
  ScanSearch as VecSearchIcon,
  DatabaseZap as CacheIcon,
  Droplets,
  PanelBottom,
  SquareMenu,
  IdCard,
  Gem,
  Repeat as AiLoopIcon,
  Split as AiMoeIcon,
  FastForward as AiSpecIcon,
  ListTree as AiTreeIcon,
  GanttChart as AiTimelineIcon,
  Plus,
  Wallet,
  Clock,
  Dices,
  ListMusic,
  PanelLeft,
  Tag,
  History,
  BookOpenText,
  LayoutDashboard,
  Landmark,
} from "lucide-react"

import { Backdrop, BACKDROP_VARIANTS, type BackdropVariant, type StudioProps } from "@/components/motion/backdrop"
import { AgentChat } from "@/components/screens/agent-chat"
import { AgentRun } from "@/components/screens/agent-run"

type ScreenProps = { onNavigate?: (label: string) => void; sideTools?: React.ReactNode }
const lazyScreen = (load: () => Promise<React.ComponentType<ScreenProps>>) => React.lazy(() => load().then((C) => ({ default: C })))
const SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  "agent-run": AgentRun,
  "agent-chat": AgentChat,
  "mission-control": lazyScreen(() => import("@/components/screens/mission-control").then((m) => m.MissionControl)),
  "research-desk": lazyScreen(() => import("@/components/screens/research-desk").then((m) => m.ResearchDesk)),
  "agent-workbench": lazyScreen(() => import("@/components/screens/agent-workbench").then((m) => m.AgentWorkbench)),
  "eval-lab": lazyScreen(() => import("@/components/screens/eval-lab").then((m) => m.EvalLab)),
  "task-tracker": lazyScreen(() => import("@/components/screens/task-tracker").then((m) => m.TaskTracker)),
  "ops-dashboard": lazyScreen(() => import("@/components/screens/ops-dashboard").then((m) => m.OpsDashboard)),
  accounting: lazyScreen(() => import("@/components/screens/accounting").then((m) => m.Accounting)),
  finance: lazyScreen(() => import("@/components/screens/finance").then((m) => m.Finance)),
}
import { cn } from "@/lib/utils"
import { PromptBuilder } from "@/prompt-builder"
import { SKILLS, SkillsPage } from "@/skills-page"
import { CommandPalette } from "@/command-palette"
import { Landing } from "@/landing"
import { buildIndex, keywordsFor, related, search, tagsFor, type SearchDoc } from "@/search"
import { PaneMark } from "@/pane-mark"
import { LivePreview } from "@/live-preview"

/* Catalog ------------------------------------------------------------------ */

/** Where the piece lives: ui = component, illustrations / motion = studio pieces (background, speed, accent). */
type Kind = "ui" | "blocks" | "illustrations" | "motion" | "screen"

type DemoModule = { default: React.ComponentType<StudioProps>; notes?: string[] }

type Entry = {
  slug: string
  name: string
  description: string
  icon: LucideIcon
  kind: Kind
  /** Exported component name, used in the generated usage snippet. */
  exportName?: string
  /** Backgrounds that suit this piece (studio pieces). Default: all. */
  backdrops?: readonly BackdropVariant[]
  isNew?: boolean
  load?: () => Promise<DemoModule>
  demo?: React.LazyExoticComponent<React.ComponentType<StudioProps>>
}

// Every demo file; an entry only shows up once its demo exists.
const DEMO_FILES = import.meta.glob("./demos/*.demo.tsx") as Record<string, () => Promise<DemoModule>>

type Spec = Omit<Entry, "kind" | "load" | "demo">
const ui = (s: Spec): Entry => ({ ...s, kind: "ui" })
const ill = (s: Spec): Entry => ({ ...s, kind: "illustrations", isNew: true })
const mo = (s: Spec): Entry => ({ ...s, kind: "motion", isNew: true })
const bl = (s: Spec): Entry => ({ ...s, kind: "blocks", isNew: true })

const RAW_GROUPS: { label: string; entries: Entry[] }[] = [
  {
    label: "Originals",
    entries: [
      ui({ slug: "action-drum", name: "Action Drum", exportName: "ActionDrum", icon: ChevronsUpDown, isNew: true, description: "Confirm an agent's action by rolling a drum of verbs – Discard, Hold, Send – until the one you mean settles under the highlight." }),
      ui({ slug: "odometer", name: "Odometer", exportName: "Odometer", icon: Gauge, isNew: true, description: "A background agent's progress as one big rolling count that stops on the number it needs you to check." }),
      ui({ slug: "thought-stack", name: "Thought Stack", exportName: "ThoughtStack", icon: Layers, isNew: true, description: "Reasoning steps dealt as a deck of cards; the answer springs forward on top with the steps tucked underneath." }),
      ui({ slug: "fill-in", name: "Fill In", exportName: "FillIn", icon: TextCursorInput, isNew: true, description: "The agent stops mid-sentence at a blank; the answer you tap lifts out of the options and lands in the sentence." }),
    ],
  },
  {
    label: "Chat",
    entries: [
      ui({ slug: "ai-answer", name: "AI Answer", icon: MessageSquareText, description: "Streamed answer with source cards, citation previews, copy, stop, feedback and follow-ups." }),
      ui({ slug: "thinking-state", name: "Thinking State", icon: Brain, description: "Working panel with a live timer, searched sources and steps that appear one by one." }),
      ui({ slug: "thinking-loader", name: "Thinking Loader", icon: Loader, description: "A small working pill that rolls through phases and settles on a check." }),
      ui({ slug: "chat-composer", name: "Chat Composer", icon: AudioWaveform, description: "Prompt composer with a model menu, voice input, app connections and an approval request." }),
      ui({ slug: "writing-assistant", name: "Writing Assistant", icon: PenLine, description: "A small AI writing helper with suggestions, streamed replies and voice dictation." }),
      ui({ slug: "model-picker", name: "Model Picker", icon: SlidersHorizontal, description: "Model menu with speed, quality and cost bars, extended thinking and effort." }),
      ui({ slug: "message-actions", name: "Message Actions", icon: MousePointerClick, isNew: true, description: "Copy, retry, feedback and share under an assistant message." }),
      ui({ slug: "tool-call-card", name: "Tool Call Card", icon: Wrench, isNew: true, description: "One tool call with its arguments, a live status and the result folded in." }),
      ui({ slug: "approval-card", name: "Approval Card", icon: ShieldCheck, isNew: true, description: "An action the agent wants to take, waiting for you to approve or deny." }),
      ui({ slug: "permission-request", name: "Permission Request", icon: KeyRound, isNew: true, description: "An app asks for access – scopes, once or always, and a clear deny." }),
      ui({ slug: "reaction-bar", name: "Reaction Bar", icon: Smile, isNew: true, description: "Emoji reactions that pop, count up and show who reacted." }),
      ui({ slug: "email-draft", name: "Email Draft", icon: Mail, isNew: true, description: "An AI-drafted email you can review, tweak and send." }),
      ui({ slug: "comment-thread", name: "Comment Thread", icon: MessagesSquare, isNew: true, description: "A threaded discussion with replies, mentions and resolve." }),
    ],
  },
  {
    label: "Agents",
    entries: [
      ui({ slug: "agent-plan", name: "Agent Plan", icon: ListChecks, isNew: true, description: "The agent's plan as steps that tick through, with sub-steps and edits." }),
      ui({ slug: "decision-inbox", name: "Decision Inbox", icon: Scale, isNew: true, description: "Decisions the agents need from you, one at a time." }),
      ui({ slug: "change-summary", name: "Change Summary", icon: FileDiff, isNew: true, description: "What an agent changed, summarised with counts and details." }),
      ui({ slug: "progress-tracker", name: "Progress Tracker", icon: ListTodo, isNew: true, description: "A long task's progress with steps, ETA and live updates." }),
      ui({ slug: "smart-recommendation", name: "Smart Recommendation", icon: Wand2, isNew: true, description: "A suggestion from the assistant with its reason and one-click apply." }),
      ui({ slug: "tips-panel", name: "Tips Panel", icon: Lightbulb, isNew: true, description: "Rotating tips and how-tos in a small dismissible panel." }),
      ui({ slug: "memory-panel", name: "Memory Panel", icon: Bot, description: "What the assistant remembers – grouped, searchable, editable, with pause and undo." }),
    ],
  },
  {
    label: "AI blocks",
    entries: [
      // Arc-inspired AI and agent blocks are added here.
      bl({ slug: "mcp-servers", name: "MCP Servers", icon: Cable, description: "The MCP servers behind an agent: what the enabled tools cost in context, connect or pause a server, switch single tools." }),
      bl({ slug: "eval-suite", name: "Eval Suite", icon: FlaskConical, description: "Run a suite on a new version against its baseline: cases stream in, regressions and fixes are called out with the cases behind them." }),
      bl({ slug: "usage-forecast", name: "Usage Forecast", icon: TrendingUp, description: "A billing period usage chart with a forecast cone and a draggable budget that dates the crossing." }),
      bl({ slug: "agent-orchestrator", name: "Agent Orchestrator", icon: Workflow, description: "A lead agent splits a goal into a plan, fans subtasks out to parallel lanes and merges the results." }),
      bl({ slug: "ai-composer", name: "AI Composer", icon: TextCursorInput, description: "Prompt box with attachments, @ mentions and / commands, a model and effort menu, and a send button ringed by the reply's progress." }),
      bl({ slug: "model-arena", name: "Model Arena", icon: Swords, description: "Blind side-by-side model comparison: one prompt, two streaming answers, a vote, then the reveal and a leaderboard." }),
      bl({ slug: "agent-tasks", name: "Agent Tasks", icon: GitPullRequest, description: "A home for background coding agents: start a task, watch it run, review and open a pull request." }),
      bl({ slug: "ai-chat", name: "AI Chat", icon: MessagesSquare, description: "Full chat card: streamed markdown, folding reasoning, tool chips, cited sources, chat and model menus, edit and retry into versions." }),
      bl({ slug: "agent-approvals", name: "Agent Approvals", icon: ShieldAlert, description: "One approval card: the waiting tool call, its reason and arguments, and approve, deny or always allow." }),
      bl({ slug: "document-extract", name: "Document Extract", icon: ScanText, description: "A model reads a document into typed fields: values fill in, hovering one lights its source on the page, low-confidence ones wait for review." }),
      bl({ slug: "agent-routines", name: "Agent Routines", icon: CalendarClock, description: "Scheduled agents in one card: schedule, next run countdown, run history, run now and edit in place." }),
      bl({ slug: "ai-side-panel", name: "AI Side Panel", icon: PanelRight, description: "An assistant docked beside a page: ask about the page or a selection, review each edit as a word diff, apply it with a tint sweep and undo it." }),
      bl({ slug: "knowledge-base", name: "Knowledge Base", icon: LibraryBig, description: "Sources moving through parse, chunk, embed and index, then a retrieval test that shows which chunks come back, with rerank and settings." }),
      bl({ slug: "agent-memory", name: "Agent Memory", icon: BrainCog, description: "A full memory card: capacity meter, switches, filters, search, captured notes, inline edit and forget with undo." }),
      bl({ slug: "prompt-studio", name: "Prompt Studio", icon: FlaskConical, description: "Edit, test and ship a prompt template: variable chips with sample values, a test run on the chosen model, and versions to compare and promote." }),
    ],
  },
  {
    label: "Building blocks",
    entries: [
      ui({ slug: "command-menu", name: "Command Menu", icon: Command, isNew: true, description: "⌘K palette with groups, search, shortcuts and nested pages." }),
      ui({ slug: "combobox", name: "Combobox", icon: ChevronsUpDown, isNew: true, description: "Searchable select with keyboard navigation and multi-select." }),
      ui({ slug: "segmented-control", name: "Segmented Control", icon: ToggleLeft, isNew: true, description: "Options in a row with a thumb that glides to the selection." }),
      ui({ slug: "otp-input", name: "OTP Input", icon: Hash, isNew: true, description: "One-time code boxes with paste, auto-advance and a verify state." }),
      ui({ slug: "dot-matrix-number", name: "Dot Matrix Number", icon: Grid3x3, isNew: true, description: "Numbers drawn in dots that morph between values, with a glass vitals card." }),
      ui({ slug: "toaster", name: "Toaster", icon: BellRing, isNew: true, description: "Stacked toasts that expand on hover, swipe away and track promises." }),
      ui({ slug: "notification-stack", name: "Notification Stack", icon: Layers, isNew: true, description: "A stack of notifications that fans out, groups and clears." }),
      ui({ slug: "dropzone", name: "Dropzone", icon: Upload, isNew: true, description: "Drag-and-drop upload with per-file progress, errors and remove." }),
      ui({ slug: "usage-meter", name: "Usage Meter", icon: Activity, isNew: true, description: "Credits and limits as meters that fill, with a reset date." }),
      ui({ slug: "button", name: "Button", icon: SquareMousePointer, isNew: true, description: "Variants, sizes, icons and a loading state." }),
      ui({ slug: "filter-menu", name: "Filter Menu", icon: Filter, isNew: true, description: "Add, edit and clear filters from one menu." }),
      ui({ slug: "profile-menu", name: "Profile Menu", icon: CircleUser, isNew: true, description: "Account menu with workspace switcher, theme and sign out." }),
    ],
  },
  {
    label: "Blocks",
    entries: [
      bl({ slug: "logo-marquee", name: "Logo Marquee", icon: GalleryHorizontalEnd, description: "The endless 'Trusted by' strip that eases to a stop on hover and scrubs with inertia." }),
      bl({ slug: "dither-cards", name: "Dither Cards", icon: PanelsTopLeft, description: "Editorial cards with dithered ASCII art, task bars and live deltas, gliding sideways." }),
      bl({ slug: "testimonial-wall", name: "Testimonial Wall", icon: Quote, description: "Columns of testimonials scrolling at different speeds." }),
      bl({ slug: "market-terminal", name: "Market Terminal", icon: CandlestickChart, description: "Candlestick chart with moving averages and zoom, a live watchlist and an order ticket – plug in real market data." }),
      bl({ slug: "journey-flow", name: "Journey Flow", icon: Waypoints, description: "A Sankey of paths from first visit to paid: ribbons morph by channel and trace a step's cohort on hover." }),
      bl({ slug: "mrr-waterfall", name: "MRR Waterfall", icon: ChartNoAxesColumn, description: "An MRR bridge of floating bars that morph by period and open the accounts behind each move." }),
      bl({ slug: "cohort-retention", name: "Cohort Retention", icon: Grid3x3, description: "A cohort retention triangle that morphs into retention curves and rewashes by segment." }),
    ],
  },
  {
    label: "Showpieces",
    entries: [
      // Motion-heavy interface pieces (dock, glass, stacks, dials, physics) are added here.
      ui({ slug: "dock", name: "Dock", icon: Dock, isNew: true, description: "Magnifying dock: tiles swell with pointer distance on springs, a gliding label, running dots, badges, launch bounce and keyboard." }),
      ui({ slug: "morph-nav", name: "Morph Nav", icon: Navigation, isNew: true, description: "Site navigation that morphs one surface into rich dropdown panels, search and a compact state, with a gliding highlight." }),
      ui({ slug: "orbit-menu", name: "Orbit Menu", icon: Orbit, isNew: true, description: "Press a round button and its actions swirl out in an arc; drag to an action and release, or tap to keep it open." }),
      ui({ slug: "holo-card", name: "Holo Card", icon: Gem, isNew: true, description: "A member card that leans toward the pointer with holographic foil, glitter and glare, and flips to its back." }),
      ui({ slug: "glass-menu", name: "Glass Menu", icon: SquareMenu, isNew: true, description: "Frosted action menu: the trigger morphs into the panel on a spring, a highlight pill glides between rows, one in-place submenu." }),
      ui({ slug: "glass-tabbar", name: "Glass Tab Bar", icon: PanelBottom, isNew: true, description: "Floating liquid-glass tab bar that refracts the feed behind it, with a draggable lens, a search bubble and a compact state on scroll." }),
      ui({ slug: "glass-card", name: "Glass Card", icon: IdCard, isNew: true, description: "Photo card with a glass info panel: pointer-following rim highlight, tilt, and a tap that morphs the panel into a detail sheet." }),
      ui({ slug: "glass-segmented", name: "Glass Segmented", icon: Droplets, isNew: true, description: "Glass segmented control with a liquid drop that stretches between segments and can be dragged and flung." }),
      ui({ slug: "control-center", name: "Control Center", icon: SlidersHorizontal, isNew: true, description: "Quick-settings glass panel: tiles that morph into detail, a duration dial and rubber-banded meters." }),
      ui({ slug: "action-morph", name: "Action Morph", icon: Plus, isNew: true, description: "A floating button that springs into a quick-action menu, then an inline composer, and folds back with a check." }),
      ui({ slug: "share-sheet", name: "Share Sheet", icon: Share2, isNew: true, description: "A Share button that springs open into a panel with copy link, access level, channels and people to send to." }),
      ui({ slug: "sheet-stack", name: "Sheet Stack", icon: Layers, isNew: true, description: "Nested sheets that stack with depth, drag to dismiss, and become stacked dialogs on wide screens." }),
      ui({ slug: "time-dial", name: "Time Dial", icon: Clock, isNew: true, description: "A 24-hour rotary dial: spin one knob and every office rides its own ring at its local time, with working hours shaded and a rolling readout." }),
      ui({ slug: "date-reel", name: "Date Reel", icon: CalendarClock, isNew: true, description: "iOS-style 3D wheel picker for day and time: curved drums, momentum, rubber-band ends, a glass lens and quick picks." }),
      ui({ slug: "activity-rings", name: "Activity Rings", icon: Activity, isNew: true, description: "Daily goals as tick rings that sweep, count up and trace a second lap past 100%, with a week picker." }),
      ui({ slug: "slot-text", name: "Slot Text", icon: Dices, isNew: true, description: "Text and numbers that spin into their new value on staggered slot-machine reels." }),
      ui({ slug: "now-playing", name: "Now Playing", icon: ListMusic, isNew: true, description: "A mini player that grows into the full player in one continuous morph, with generated artwork, a waveform scrubber and pull-down to close." }),
      ui({ slug: "voice-recorder", name: "Voice Recorder", icon: Mic, isNew: true, description: "Voice notes: tap the mic into a live scrolling waveform, review and scrub, then send the take into the thread. Simulated by default, real microphone on request." }),
      ui({ slug: "mega-menu-morph", name: "Mega Menu Morph", icon: PanelsTopLeft, isNew: true, description: "A site header whose menus share one floating panel that morphs between them, with hover intent, a safe triangle and an accordion sheet when narrow." }),
    ],
  },
  {
    label: "Charts",
    entries: [
      // Advanced, animated data visualisation is added here.
      ui({ slug: "sunburst", name: "Sunburst", icon: Sun, isNew: true, description: "A hierarchy in rings: click a segment and every arc swings around it as the new centre, with a breadcrumb back and a rolling total." }),
      ui({ slug: "sankey-flow", name: "Sankey Flow", icon: Waypoints, isNew: true, description: "Flows between stages as ribbons with drifting particles; hover any node or ribbon to pour its share through the whole journey." }),
      ui({ slug: "streamgraph", name: "Streamgraph", icon: Waves, isNew: true, description: "Layered streams on a wiggle baseline that morph between ranges, with a layer you can isolate and read week by week." }),
      ui({ slug: "radar-chart", name: "Radar Chart", icon: Radar, isNew: true, description: "Two or three profiles on one web: shapes morph when you swap a profile, and a sweep across the axes compares values in place." }),
      ui({ slug: "funnel-chart", name: "Funnel Chart", icon: Funnel, isNew: true, description: "A conversion funnel as one smooth tapered band with drop-off at every step, a device split and dots streaming through." }),
      ui({ slug: "realtime-stream", name: "Realtime Stream", icon: Radio, isNew: true, description: "A live latency feed on a canvas: it scrolls at the display rate, holds still on hover to read, and pops a marker on every anomaly." }),
      ui({ slug: "treemap", name: "Treemap", icon: LayoutGrid, isNew: true, description: "A squarified treemap: click a tile and the view zooms into it, with a breadcrumb back and a measure switch that morphs every tile." }),
      ui({ slug: "ridgeline", name: "Ridgeline", icon: Mountain, isNew: true, description: "Overlapping distributions, one ridge per group: hover lifts a ridge and reads its quartiles, switching datasets morphs every curve." }),
      ui({ slug: "race-bar-chart", name: "Race Bar Chart", icon: ChartNoAxesColumn, isNew: true, description: "A ranking over time: bars overtake on springs, values count up, and a timeline you can play or scrub." }),
      ui({ slug: "data-grid", name: "Data Grid", icon: Table2, isNew: true, description: "A virtualised grid for thousands of rows: sort, resize columns, select ranges and read trends in inline sparkline cells." }),
    ],
  },
  {
    label: "AI concepts",
    entries: [
      // Animated explainers of how AI systems work (studio pieces) are added here.
      ill({ slug: "data-flow", name: "Data Flow", exportName: "DataFlow", icon: Workflow, description: "Sources feed a processing core with a live count: hollow dots turn into solid squares and fan out to destinations." }),
      ill({ slug: "payment-flow", name: "Payment Flow", exportName: "PaymentFlow", icon: PayFlowIcon, description: "A card tap travels processor, network and bank and back approved, then settlement runs a second rail and the balance counts up." }),
      ill({ slug: "prompt-cache", name: "Prompt Cache", exportName: "PromptCache", icon: CacheIcon, description: "Requests share a prefix: it is written once, read back on later requests, and the cost and time saved add up." }),
      ill({ slug: "vector-search", name: "Vector Search", exportName: "VectorSearch", icon: VecSearchIcon, description: "Documents fold into points on an embedding plane, a query lands, a signal hops the index and a ring lights the nearest matches." }),
      ill({ slug: "multi-region-failover", name: "Multi-Region Failover", exportName: "MultiRegionFailover", icon: FailoverGlobeIcon, description: "Requests stream through a load balancer to two regions; one fails, traffic shifts, it recovers and rebalances." }),
      ill({ slug: "agent-loop", name: "Agent Loop", exportName: "AgentLoop", icon: AiLoopIcon, description: "A head circles gather, act and verify while tool calls and checks land and the context grows." }),
      ill({ slug: "mixture-of-experts", name: "Mixture of Experts", exportName: "MixtureOfExperts", icon: AiMoeIcon, description: "A router scores each token, sends it to its top experts and merges their outputs." }),
      ill({ slug: "speculative-decoding", name: "Speculative Decoding", exportName: "SpeculativeDecoding", icon: AiSpecIcon, description: "A small draft model guesses ahead, the large model checks the guesses in one pass." }),
      ill({ slug: "reasoning-tree", name: "Reasoning Tree", exportName: "ReasoningTree", icon: AiTreeIcon, description: "Tree search over thoughts: score, prune, expand, then draw the best path to the answer." }),
      ill({ slug: "agent-timeline", name: "Agent Timeline", exportName: "AgentTimeline", icon: AiTimelineIcon, description: "One orchestrated run on a shared time axis, with handoffs and a live token and cost counter." }),
    ],
  },
  {
    label: "Illustrations",
    entries: [
      ill({ slug: "neural-panels", name: "Neural Panels", exportName: "NeuralPanels", icon: BrainCircuit, backdrops: ["plain", "grid", "aurora", "dither"], description: "Dithered terrain and a particle brain in calm editorial cards, with a typing log." }),
      ill({ slug: "telemetry-board", name: "Telemetry Board", exportName: "TelemetryBoard", icon: Activity, backdrops: ["plain", "grid", "aurora"], description: "Dithered art bleeding past editorial panels, ticking telemetry and a glass vitals card." }),
      ill({ slug: "integration-beam", name: "Integration Beam", exportName: "IntegrationBeam", icon: Cable, description: "Your product between the tools it connects, with light pulses along curved beams." }),
      ill({ slug: "pipeline-steps", name: "Pipeline Steps", exportName: "PipelineSteps", icon: Route, description: "A how-it-works pipeline that lights up step by step." }),
      ill({ slug: "step-cards", backdrops: ["plain", "grid", "drift", "floor", "aurora"], name: "Step Cards", exportName: "StepCards", icon: Columns3, description: "Three scene cards that play in sequence: event, AI draft, review." }),
      ill({ slug: "voice-orb", backdrops: ["plain", "grid", "drift", "floor", "aurora"], name: "Voice Orb", exportName: "VoiceOrb", icon: Mic, description: "A sphere of dots that breathes, listens, thinks and speaks." }),
      ill({ slug: "agent-team", name: "Agent Team", exportName: "AgentTeam", icon: Users, description: "A prompt types itself and branches out into a team of agents." }),
      ill({ slug: "logo-cluster", name: "Logo Cluster", exportName: "LogoCluster", icon: Orbit, description: "Your mark in the middle; logos bounce out of it and settle around it." }),
      ill({ slug: "lead-sourcing", name: "Lead Sourcing", exportName: "LeadSourcing", icon: Link2, description: "An AI tile linked to two tools with a shine running along the connection." }),
      ill({ slug: "integration-grid", backdrops: ["plain", "dots", "grid", "floor", "aurora"], name: "Integration Grid", exportName: "IntegrationGrid", icon: Grid3x3, description: "A honeycomb wall of app tiles that light up in ripples." }),
      ill({ slug: "project-flow", name: "Project Flow", exportName: "ProjectFlow", icon: Share2, description: "A client task branching into subtasks, notes and roles." }),
      ill({ slug: "team-invite", name: "Team Invite", exportName: "TeamInvite", icon: UserPlus, description: "A cursor drags a new teammate into the empty slot and they go online." }),
      ill({ slug: "glow-keyboard", backdrops: ["plain", "dots", "grid", "drift", "aurora"], name: "Glow Keyboard", exportName: "GlowKeyboard", icon: Keyboard, description: "A chat input types itself over a glass keyboard on a glowing floor." }),
      ill({ slug: "glow-cloud", name: "Glow Cloud", exportName: "GlowCloud", icon: Cloud, description: "A cloud mascot that floats, looks around, blinks and winks when clicked." }),
      ill({ slug: "empty-calendar", name: "Empty Calendar", exportName: "EmptyCalendar", icon: CalendarX, description: "Calendar cards marked empty that fan out – an empty state." }),
      ill({ slug: "ghosted-chat", name: "Ghosted Chat", exportName: "GhostedChat", icon: MessageCircleOff, description: "Unanswered messages marked as read – an empty state." }),
      ill({ slug: "tab-overload", name: "Tab Overload", exportName: "TabOverload", icon: AppWindow, description: "Overlapping browser windows where the highlight follows the tab." }),
    ],
  },
  {
    label: "Motion",
    entries: [
      mo({ slug: "dither-field", name: "Dither Field", exportName: "DitherField", icon: Grip, backdrops: ["plain"], description: "A flowing noise field drawn as ordered-dither dots – a living background." }),
      mo({ slug: "text-reveal", name: "Text Reveal", exportName: "TextReveal", icon: Type, description: "Text that arrives word by word, each fading out of a soft blur." }),
      mo({ slug: "blur-crossfade", name: "Blur Crossfade", exportName: "BlurCrossfade", icon: Blend, description: "Swap content through a soft blur while the box glides to its new size." }),
      mo({ slug: "number-ticker", name: "Number Ticker", exportName: "NumberTicker", icon: Binary, description: "Odometer numbers – every digit rolls to its new value." }),
      mo({ slug: "dither-image", name: "Dither Image", exportName: "DitherImage", icon: ImageIcon, backdrops: ["plain", "grid", "aurora"], description: "Turn any image into ordered-dither dot art that assembles and drifts." }),
      mo({ slug: "gradient-text", name: "Gradient Text", exportName: "GradientText", icon: Palette, description: "Letters cut from a liquid, ever-flowing gradient." }),
      mo({ slug: "shimmer-loader", name: "Shimmer Loader", exportName: "ShimmerLoader", icon: ScanLine, description: "Skeleton blocks sharing one soft light sweep, then the content." }),
      mo({ slug: "grid-background", backdrops: ["plain"], name: "Grid Background", exportName: "GridBackground", icon: Grid2x2, description: "A fine line grid that drifts slowly behind your content." }),
      mo({ slug: "gradient-floor", backdrops: ["plain"], name: "Gradient Floor", exportName: "GradientFloor", icon: Sunrise, description: "A blurred colour gradient that glows up from the bottom." }),
    ],
  },
  {
    label: "Screens",
    entries: [
      { slug: "agent-run", name: "Agent Run", icon: Play, kind: "screen", description: "One autonomous run: plan, tool calls, an approval it waits on and the draft as a diff." },
      { slug: "agent-chat", name: "Agent Chat", icon: Sparkles, kind: "screen", description: "Orchestrator chat with the agents at work and a brief to fill in beside it." },
      { slug: "mission-control", name: "Mission Control", icon: Radar, kind: "screen", isNew: true, description: "Multi-agent ops: live throughput, agent lanes, a queue that needs a human, and the run log." },
      { slug: "research-desk", name: "Research Desk", icon: BookOpenText, kind: "screen", isNew: true, description: "An agent writes a brief and every claim traces to its source." },
      { slug: "agent-workbench", name: "Agent Workbench", icon: PenLine, kind: "screen", isNew: true, description: "Co-edit a doc with an agent: its cursor, tracked suggestions, margin notes and a tape to scrub." },
      { slug: "eval-lab", name: "Eval Lab", icon: FlaskConical, kind: "screen", isNew: true, description: "Compare models on an eval suite, inspect regressions, then ship the candidate." },
      { slug: "task-tracker", name: "Task Tracker", icon: ListChecks, kind: "screen", isNew: true, description: "Board, list and timeline for a project where some assignees are agents." },
      { slug: "ops-dashboard", name: "Dashboard", icon: LayoutDashboard, kind: "screen", isNew: true, description: "Business overview: KPIs, revenue with a forecast band, channels, products, regions and a funnel." },
      { slug: "accounting", name: "Accounting", icon: Landmark, kind: "screen", isNew: true, description: "Month-end close: reconcile with agent matches, invoices, a balanced ledger and the P&L." },
      { slug: "finance", name: "Finance", icon: Wallet, kind: "screen", isNew: true, description: "Cash runway with live scenarios, budget vs actual, flagged spend and subscriptions." },
    ],
  },
  {
    label: "Instrument",
    entries: [
      ui({ slug: "provenance-trail", name: "Provenance Trail", exportName: "ProvenanceTrail", icon: Quote, isNew: true, description: "An AI answer where every claim traces to its source, and unsupported ones say so." }),
      ui({ slug: "confidence-dither", name: "Confidence Dither", exportName: "ConfidenceDither", icon: Grid3x3, isNew: true, description: "Model uncertainty drawn as dither density: bars, option distributions and per-token confidence." }),
      ui({ slug: "run-scrubber", name: "Run Scrubber", exportName: "RunScrubber", icon: History, isNew: true, description: "Scrub back and forth through an agent run like a tape, with its state at every moment." }),
      ui({ slug: "token-scope", name: "Token Scope", exportName: "TokenScope", icon: Activity, isNew: true, description: "An oscilloscope for a live model stream: tokens per second, latency, stalls and tool calls." }),
      ui({ slug: "readout-bar", name: "Readout Bar", exportName: "ReadoutBar", icon: Gauge, isNew: true, description: "A strip of key numbers that settle when they change, with deltas, tolerances and sparklines." }),
      ui({ slug: "spec-table", name: "Spec Table", exportName: "SpecTable", icon: Table2, isNew: true, description: "A precise data table: sorting, selection, dither score bars, sticky headers and a readout footer." }),
      ui({ slug: "instrument-form", name: "Instrument Form", exportName: "Field", icon: SlidersHorizontal, isNew: true, description: "Form kit – fields, select, toggles, a ruler slider, stepper, sections and a save bar." }),
      bl({ slug: "instrument-shell", name: "Instrument Shell", exportName: "InstrumentShell", icon: PanelLeft, description: "The app frame: a rail with a ruler nav, ⌘K search, breadcrumb and a gridded content area." }),
      bl({ slug: "instrument-hero", name: "Instrument Hero", exportName: "InstrumentHero", icon: Type, description: "An editorial landing hero with a live specimen plot and proof numbers." }),
      bl({ slug: "instrument-pricing", name: "Instrument Pricing", exportName: "InstrumentPricing", icon: Tag, description: "Plans priced live from a usage ruler, with a comparison table that folds on mobile." }),
    ],
  },
  {
    label: "Archive",
    entries: [
    ],
  },
]

const GROUPS = RAW_GROUPS.map((g) => ({
  ...g,
  entries: g.entries.flatMap((e) => {
    if (e.kind === "screen") return [e]
    const load = DEMO_FILES[`./demos/${e.slug}.demo.tsx`]
    return load ? [{ ...e, load, demo: React.lazy(load) }] : []
  }),
})).filter((g) => g.entries.length)

const ALL = GROUPS.flatMap((g) => g.entries)
const PAGES = ALL.filter((e) => e.kind !== "screen")
const COUNT = (k: Kind) => ALL.filter((e) => e.kind === k).length
const SITE = "https://paneui.vercel.app"

// Search documents for every piece and skill (tags from src/data/tags.json).
const KIND_GROUP: Record<string, string> = {}
for (const g of GROUPS) for (const e of g.entries) KIND_GROUP[e.slug] = g.label
const DOCS: SearchDoc[] = [
  ...ALL.map((e) => ({
    id: e.slug,
    href: `#/${e.slug}`,
    title: e.name,
    kind: e.kind,
    group: KIND_GROUP[e.slug] ?? "",
    description: e.description.replace(/^Instrument · /, ""),
    tags: tagsFor(e.slug),
    keywords: keywordsFor(e.slug),
    extra: e.exportName,
  })),
  ...SKILLS.map((k) => ({
    id: `skill:${k.id}`,
    href: `#/skills/${k.id}`,
    title: k.name,
    kind: "skill",
    group: `Skills · ${k.category}`,
    description: k.description,
    tags: [],
    keywords: [k.category, ...(k.bestFor ? String(k.bestFor).split(/[ ,]+/).slice(0, 8) : [])],
  })),
]
const TAG_COUNTS: Record<string, number> = {}
for (const d of DOCS) for (const t of d.tags) TAG_COUNTS[t] = (TAG_COUNTS[t] ?? 0) + 1
const PIECE_INDEX = buildIndex(DOCS)

// Sources, loaded only when the Code tab opens.
const SOURCES = import.meta.glob(["./components/ui/*.tsx", "./components/blocks/*.tsx", "./components/illustrations/*.tsx", "./components/motion/*.tsx"], {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>

/* Routing (hash based, so the static build works anywhere) ------------------ */

function readSlug() {
  return window.location.hash.replace(/^#\/?/, "")
}

function useSlug() {
  const [slug, setSlug] = React.useState(readSlug)
  React.useEffect(() => {
    const onHash = () => {
      setSlug(readSlug())
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  return slug
}

/** Sidebar labels inside the screens that lead somewhere in this demo. */
function navigateFromScreen(label: string) {
  if (label === "Home") window.location.hash = "/"
  else if (label === "Chat" || label === "Plan the autumn campaign") window.location.hash = "/agent-chat"
  else if (label === "Runs" || label === "Finance ops") window.location.hash = "/agent-run"
  else {
    const meridian: Record<string, string> = {
      "Mission control": "mission-control", "Research desk": "research-desk", Workbench: "agent-workbench", Evals: "eval-lab",
      Tasks: "task-tracker", Dashboard: "ops-dashboard", Accounting: "accounting", Finance: "finance",
    }
    if (meridian[label]) window.location.hash = "/" + meridian[label]
  }
}

/* Theme -------------------------------------------------------------------- */

function useTheme() {
  const [dark, setDark] = React.useState(() => {
    try {
      const saved = (localStorage.getItem("pane-theme") ?? localStorage.getItem("cadence-ui-theme"))
      if (saved) return saved === "dark"
    } catch {
      /* storage can be blocked */
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem("pane-theme", dark ? "dark" : "light")
    } catch {
      /* storage can be blocked */
    }
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

/* Style (Classic / Warm / Mono / Glass – see src/styles.css) ----------------- */

const STYLE_OPTIONS = [
  { id: "classic", label: "Classic", swatch: "linear-gradient(135deg, #fff 50%, #0060e2 50%)" },
  { id: "mono", label: "Mono", swatch: "linear-gradient(135deg, #fff 50%, #000 50%)" },
  { id: "glass", label: "Glass", swatch: "radial-gradient(circle at 30% 25%, #fff 0 18%, transparent 40%), linear-gradient(135deg, #a5b4fc, #7dd3fc 50%, #f0abfc)" },
] as const
type StyleId = (typeof STYLE_OPTIONS)[number]["id"]

function useStyle() {
  const [style, setStyle] = React.useState<StyleId>(() => {
    try {
      const saved = (localStorage.getItem("pane-style") ?? localStorage.getItem("cadence-ui-style"))
      if (STYLE_OPTIONS.some((o) => o.id === saved)) return saved as StyleId
    } catch {
      /* storage can be blocked */
    }
    return "classic"
  })
  React.useEffect(() => {
    if (style === "classic") delete document.documentElement.dataset.style
    else document.documentElement.dataset.style = style
    try {
      localStorage.setItem("pane-style", style)
    } catch {
      /* storage can be blocked */
    }
  }, [style])
  return [style, setStyle] as const
}

function StylePicker({ style, setStyle }: { style: StyleId; setStyle: (s: StyleId) => void }) {
  return (
    <div className="mx-3 mb-4">
      <div className="mb-1.5 px-1 text-[11.5px] font-medium tracking-wide text-neutral-400 uppercase">Style</div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]" role="radiogroup" aria-label="Style">
        {STYLE_OPTIONS.map((o) => (

          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={style === o.id}
            onClick={() => setStyle(o.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[9px] py-1.5 text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
              style === o.id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
            )}
          >
            <span className="size-4 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: o.swatch }} aria-hidden />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* Small pieces ------------------------------------------------------------- */

function IconButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  )
}

function useCopied() {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(id)
  }, [copied])
  return [copied, (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
  }] as const
}

function Logo() {
  return (
    <PaneMark className="size-6" />
  )
}

/* Sidebar ------------------------------------------------------------------ */

function Sidebar({ slug, dark, toggleDark, style, setStyle, onPick, onSearch }: { slug: string; dark: boolean; toggleDark: () => void; style: StyleId; setStyle: (s: StyleId) => void; onPick?: () => void; onSearch?: () => void }) {
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const q = query.trim()
  // Typing here ranks across names, tags, synonyms and descriptions; an empty box shows the groups.
  const results = React.useMemo(() => (q ? search(PIECE_INDEX, q, 60) : []), [q])
  const bySlug = React.useMemo(() => new Map(ALL.map((e) => [e.slug, e])), [])
  const groups = q
    ? [{ label: "Results", entries: results.flatMap((r) => (bySlug.get(r.id) ? [bySlug.get(r.id)!] : [])) }].filter((g) => g.entries.length)
    : GROUPS

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-3 pt-5 pb-4">
        <a href="#/" onClick={onPick} className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <Logo />
          Pane
        </a>
        <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10.5px] font-medium text-neutral-500 dark:bg-white/10 dark:text-neutral-400">v0.1</span>
        <a href="#/" onClick={onPick} className="text-[12px] text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200">
          Home
        </a>
        <IconButton label="Toggle dark mode" onClick={toggleDark} className="ml-auto">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </IconButton>
      </div>

      <label className="mx-3 mb-4 flex h-9 items-center gap-2 rounded-xl bg-white px-2.5 text-[13px] text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.04)] focus-within:shadow-[0_0_0_1px_rgb(0_0_0/0.18)] dark:bg-white/[0.05] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
        <Search className="size-3.5 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("")
            if (e.key === "Enter" && q && results[0] && !groups[0]) {
              window.location.hash = results[0].href.replace(/^#/, "")
              setQuery("")
              onPick?.()
            } else if (e.key === "Enter" && groups[0]) {
              window.location.hash = `/${groups[0].entries[0].slug}`
              setQuery("")
              onPick?.()
            }
          }}
          placeholder="Search…"
          aria-label="Search components"
          className="min-w-0 flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
        />
        <button type="button" onClick={onSearch} title="Search everything (⌘K)" className="rounded-md bg-black/[0.05] px-1.5 font-sans text-[10.5px] text-neutral-400 transition-colors hover:text-neutral-700 dark:bg-white/10 dark:hover:text-neutral-200">
          ⌘K
        </button>
      </label>

      <StylePicker style={style} setStyle={setStyle} />

      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Components">
        <a
          href="#/browse"
          onClick={onPick}
          aria-current={slug === "browse" ? "page" : undefined}
          className={cn(navItem, slug === "browse" && navActive)}
        >
          <LayoutGrid className="size-4 text-neutral-400" />
          Overview
        </a>
        {groups.map((g) => (
          <div key={g.label} className="mt-5">
            <div className="mb-1 flex items-center justify-between px-2 text-[11.5px] font-medium tracking-wide text-neutral-400 uppercase">
              {g.label}
              <span className="font-normal tabular-nums normal-case">{g.entries.length}</span>
            </div>
            <ul className="flex flex-col gap-px">
              {g.entries.map((e) => {
                const active = slug === e.slug
                return (
                  <li key={e.slug}>
                    <a href={`#/${e.slug}`} onClick={onPick} aria-current={active ? "page" : undefined} className={cn(navItem, active && navActive)}>
                      {active && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[2px] rounded-full bg-blue-600 dark:bg-blue-400" aria-hidden />}
                      <e.icon className={cn("size-4 shrink-0", active ? "text-neutral-900 dark:text-white" : "text-neutral-400")} />
                      <span className="truncate">{e.name}</span>
                      {e.isNew && <span className="ml-auto rounded-full bg-blue-500/10 px-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">New</span>}
                      {e.kind === "screen" && <ArrowUpRight className="ml-auto size-3.5 opacity-40" />}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {!groups.length && <p className="px-2 pt-4 text-[13px] text-neutral-400">Nothing matches “{query}”.</p>}
        {SKILLS.length > 0 && (
          <div className="mt-5">
            <div className="mb-1 px-2 text-[11.5px] font-medium tracking-wide text-neutral-400 uppercase">For your agent</div>
            <a href="#/skills" onClick={onPick} aria-current={slug === "skills" ? "page" : undefined} className={cn(navItem, slug === "skills" && navActive)}>
              <Wand2 className="size-4 text-neutral-400" />
              Skills
              <span className="ml-auto text-[11.5px] text-neutral-400 tabular-nums">{SKILLS.length}</span>
            </a>
          </div>
        )}
      </nav>

      <div className="border-t border-black/[0.06] px-5 py-4 text-xs text-neutral-400 dark:border-white/[0.06]">
        <a href="https://github.com/kametayturar/pane" target="_blank" rel="noreferrer" className="hover:text-neutral-700 dark:hover:text-neutral-200">
          GitHub ↗
        </a>
        <span className="mx-1.5">·</span>
        MIT
        <p className="mt-1.5 leading-4">
          Inspired by{" "}
          <a href="https://www.affectui.com" target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-200">
            affectUI
          </a>{" "}
          and{" "}
          <a href="https://uiarc.dev" target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700 dark:decoration-neutral-600 dark:hover:text-neutral-200">
            Arc UI
          </a>
        </p>
      </div>
    </div>
  )
}

const navItem =
  "relative flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13.5px] text-neutral-600 transition-colors hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
const navActive = "bg-black/[0.05] font-medium text-neutral-900 dark:bg-white/[0.08] dark:text-white"

/* Pages -------------------------------------------------------------------- */

/* Home: hero, a featured bento of big live tiles, then every group ---------- */

type Feature = { slug: string; span: string; width: number; align?: "center" | "top"; variant?: BackdropVariant; accent?: string; tag: string }

// Big, live showcase tiles. `width` is the size the demo is laid out at before it is scaled to fit the tile.
const FEATURED: Feature[] = [
  { slug: "neural-panels", span: "md:col-span-2 xl:col-span-4 xl:row-span-2", width: 1040, variant: "plain", accent: "#5b5bd6", tag: "Illustration" },
  { slug: "glass-tabbar", span: "xl:col-span-2 xl:row-span-2", width: 520, align: "top", tag: "Showpiece" },
  { slug: "model-arena", span: "xl:col-span-3", width: 1000, align: "top", tag: "Component" },
  { slug: "data-flow", span: "xl:col-span-3", width: 900, variant: "dots", tag: "AI concept" },
  { slug: "voice-orb", span: "xl:col-span-2", width: 620, tag: "Component" },
  { slug: "sunburst", span: "xl:col-span-2", width: 760, align: "top", tag: "Chart" },
  { slug: "approval-card", span: "xl:col-span-2", width: 480, align: "top", tag: "Agents" },
]

function Home({ group }: { group?: string }) {
  React.useEffect(() => {
    if (!group) return
    const id = window.setTimeout(() => document.getElementById(`group-${group}`)?.scrollIntoView({ block: "start" }), 60)
    return () => window.clearTimeout(id)
  }, [group])
  const stats = [
    [COUNT("ui"), "components"],
    [COUNT("illustrations"), "illustrations"],
    [COUNT("motion"), "motion effects"],
    [COUNT("blocks"), "blocks"],
    [COUNT("screen"), "screens"],
    [SKILLS.length, "skills"],
  ].filter(([n]) => n)
  const featured = FEATURED.flatMap((f) => {
    const entry = ALL.find((e) => e.slug === f.slug)
    return entry?.demo ? [{ ...f, entry }] : []
  })
  const jump = (label: string) => document.getElementById(`group-${label}`)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div>
      <section className="pt-2">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          <Sparkles className="size-3" /> {stats.map(([n, l]) => `${n} ${l}`).join(" · ")}
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[56px]">
          A taste library for <span className="text-neutral-400 dark:text-neutral-500">AI products.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-6 text-neutral-500 dark:text-neutral-400">
          Components, illustrations, motion and the agent skills behind them. One file each, calm motion, dark mode built in, installable with the
          shadcn CLI.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ["Components", "Chat"],
            ["Illustrations", "Illustrations"],
            ["Motion", "Motion"],
          ].map(([label, group], i) => (
            <button
              key={label}
              type="button"
              onClick={() => jump(group)}
              className={cn(
                "h-10 rounded-xl px-4 text-[13.5px] font-medium transition-colors",
                i === 0
                  ? "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  : "bg-white text-neutral-700 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] hover:bg-neutral-50 dark:bg-white/[0.05] dark:text-neutral-200 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/10",
              )}
            >
              {label}
            </button>
          ))}
          {SKILLS.length > 0 && (
            <a
              href="#/skills"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13.5px] font-medium text-neutral-700 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-colors hover:bg-neutral-50 dark:bg-white/[0.05] dark:text-neutral-200 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/10"
            >
              <Wand2 className="size-3.5" /> Skills
            </a>
          )}
        </div>
      </section>

      <div className="mt-8">
        <PromptBuilder />
      </div>

      {featured.length > 0 && (
        <section className="mt-12" aria-label="Featured">
          <div className="grid auto-rows-[300px] gap-3 md:grid-cols-2 xl:auto-rows-[268px] xl:grid-cols-6">
            {featured.map((f) => (
              <a
                key={f.slug}
                href={`#/${f.slug}`}
                className={cn(
                  "group relative overflow-hidden rounded-3xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-shadow hover:shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_18px_40px_-20px_rgb(0_0_0/0.3)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
                  f.span,
                )}
              >
                <LivePreview
                  Demo={f.entry.demo!}
                  width={f.width}
                  align={f.align ?? "center"}
                  variant={f.variant ?? "dots"}
                  accent={f.accent}
                  replay={f.entry.kind === "ui" || f.entry.kind === "blocks" ? 13000 : undefined}
                  className="absolute inset-0"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-neutral-900 dark:via-neutral-900/80" />
                <div className="absolute inset-x-4 bottom-4 flex items-end gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">{f.tag}</div>
                    <div className="mt-0.5 text-[16px] font-semibold tracking-tight">{f.entry.name}</div>
                    <p className="mt-0.5 line-clamp-1 max-w-md text-[13px] text-neutral-500 dark:text-neutral-400">{f.entry.description}</p>
                  </div>
                  <span className="ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-neutral-900 text-white transition-transform group-hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <MeridianShowcase />

      {GROUPS.map((g) => (
        <section key={g.label} id={`group-${g.label}`} className="mt-16 scroll-mt-20">
          <div className="mb-4 flex items-baseline gap-2">
            <h2 className="text-[20px] font-semibold tracking-tight">{g.label}</h2>
            <span className="text-[13px] text-neutral-400 tabular-nums">{g.entries.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {g.entries.map((e, i) => (
              <EntryCard key={e.slug} entry={e} wide={i === 0 && g.entries.length > 2} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** A still of a full screen (public/screens/<slug>[-dark].webp, from scripts/shoot-screens.mjs) matching the current style and theme. */
function ScreenThumb({ slug, className }: { slug: string; className?: string }) {
  return (
    <div className={cn("overflow-hidden bg-neutral-100 dark:bg-neutral-900", className)}>
      {["", "-dark"].map((v) => (
        <img key={v} src={`/screens/${slug}${v}.webp`} alt="" loading="lazy" data-still={v || "-light"} className="screen-still h-full w-full object-cover object-top-left" />
      ))}
    </div>
  )
}

const MERIDIAN = ["mission-control", "ops-dashboard", "task-tracker", "accounting", "finance", "research-desk", "agent-workbench", "eval-lab"]

function MeridianShowcase() {
  const entries = MERIDIAN.flatMap((slug) => ALL.filter((e) => e.slug === slug))
  if (!entries.length) return null
  const [lead, ...rest] = entries
  return (
    <section className="mt-12" aria-label="Meridian screens">
      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-1">
        <div>
          <div className="font-mono text-[11px] tracking-[0.08em] text-neutral-400 uppercase">Ours · Meridian</div>
          <h2 className="mt-1 text-[34px] leading-[1.05] font-normal tracking-[-0.01em]" style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}>
            Eight screens, <em>one</em> product.
          </h2>
        </div>
        <p className="max-w-md text-[13.5px] leading-5 text-neutral-500 dark:text-neutral-400 sm:ml-auto">
          Meridian – ops, dashboard, tasks, accounting, finance, research, co-editing and evals – one product built from the Instrument kit. Open one and click
          through the rail; take the file and swap in your data.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-4">
        <a href={`#/${lead.slug}`} className="group relative overflow-hidden rounded-3xl shadow-[0_0_0_1px_rgb(0_0_0/0.08)] lg:col-span-2 lg:row-span-2 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]">
          <ScreenThumb slug={lead.slug} className="aspect-[16/10] h-full w-full transition-transform duration-500 group-hover:scale-[1.01]" />
          <ScreenLabel entry={lead} />
        </a>
        {rest.map((e) => (
          <a key={e.slug} href={`#/${e.slug}`} className="group relative overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]">
            <ScreenThumb slug={e.slug} className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
            <ScreenLabel entry={e} small />
          </a>
        ))}
        <a
          href="#/browse/Instrument"
          onClick={(ev) => {
            ev.preventDefault()
            document.getElementById("group-Instrument")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
          className="flex aspect-[16/10] flex-col justify-between rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-colors hover:bg-neutral-50 dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)] dark:hover:bg-white/[0.06]"
        >
          <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase opacity-60">The kit · 10 pieces</span>
          <span className="text-[22px] leading-6" style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}>
            Shell, forms, tables, readouts, <em>provenance</em> and more
          </span>
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
            <span className="inline-block h-px w-5 bg-[var(--inst-signal)]" /> Open the Instrument kit
          </span>
        </a>
      </div>
    </section>
  )
}

function ScreenLabel({ entry, small }: { entry: Entry; small?: boolean }) {
  return (
    <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] backdrop-blur dark:bg-neutral-900/90 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
      <entry.icon className="size-3.5 shrink-0 text-neutral-500" />
      <span className={cn("shrink-0 font-medium whitespace-nowrap", small ? "text-[12.5px]" : "text-[14px]")}>{entry.name}</span>
      {!small && <span className="hidden truncate text-[12.5px] text-neutral-500 sm:inline dark:text-neutral-400">{entry.description.replace(/^Instrument · /, "")}</span>}
      <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-neutral-400" />
    </div>
  )
}

function EntryCard({ entry: e, wide }: { entry: Entry; wide?: boolean }) {
  const studio = e.kind === "illustrations" || e.kind === "motion"
  const [hovered, setHovered] = React.useState(false)
  return (
    <a
      href={`#/${e.slug}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "gallery-card group flex flex-col rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_12px_28px_-14px_rgb(0_0_0/0.25)] dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
        wide && "sm:col-span-2 xl:row-span-2",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-200">
          <e.icon className="size-4" />
        </span>
        <span className={cn("font-medium", wide ? "text-[15px]" : "text-[14px]")}>{e.name}</span>
        {e.isNew && <span className="rounded-full bg-blue-500/10 px-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">New</span>}
        <ArrowUpRight className="ml-auto size-4 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-neutral-600" />
      </div>
      <p className="mt-2.5 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">{e.description}</p>
      {e.kind === "screen" && MERIDIAN.includes(e.slug) && (
        <ScreenThumb slug={e.slug} className={cn("mt-3 rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]", wide ? "h-40 flex-1 xl:min-h-[340px]" : "h-40")} />
      )}
      {e.demo && (
        <LivePreview
          Demo={e.demo}
          width={wide ? 860 : 760}
          align={studio ? "center" : "top"}
          replay={studio ? undefined : 12000}
          hovered={hovered}
          className={cn("mt-3 rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]", wide ? "h-40 flex-1 xl:min-h-[340px]" : "h-40")}
        />
      )}
    </a>
  )
}

function useSource(path: string | null) {
  const [source, setSource] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!path) return
    let live = true
    SOURCES[`./${path}`]?.().then((s) => live && setSource(s))
    return () => {
      live = false
    }
  }, [path])
  return source
}

function CodeBlock({ title, code, maxHeight = 640 }: { title: React.ReactNode; code: string | null; maxHeight?: number }) {
  const [copied, copy] = useCopied()
  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-950 text-neutral-200 shadow-[0_0_0_1px_rgb(0_0_0/0.1)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 font-mono text-xs text-neutral-400">
        <span className="min-w-0 truncate">{title}</span>
        <IconButton label={copied ? "Copied" : "Copy"} className="size-7 text-neutral-400 hover:bg-white/10 hover:text-white" onClick={() => code && copy(code)}>
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </IconButton>
      </div>
      <pre className="overflow-auto p-4 font-mono text-[12px] leading-5" style={{ maxHeight }}>
        {code ?? "Loading…"}
      </pre>
    </div>
  )
}

function filePath(entry: Entry) {
  return `components/${entry.kind}/${entry.slug}.tsx`
}

function CodeView({ entry, extra }: { entry: Entry; extra?: string[] }) {
  const files = [filePath(entry), ...(extra ?? [])]
  const [active, setActive] = React.useState(files[0])
  const source = useSource(active)
  return (
    <div>
      {files.length > 1 && (
        <div className="mb-2 flex gap-1">
          {files.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActive(f)}
              className={cn(
                "rounded-lg px-2.5 py-1 font-mono text-[11.5px] text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
                active === f && "bg-black/[0.05] text-neutral-900 dark:bg-white/10 dark:text-white",
              )}
            >
              {f.split("/").pop()}
            </button>
          ))}
        </div>
      )}
      <CodeBlock key={active} title={`src/${active}`} code={source} />
    </div>
  )
}

function PageHeader({ entry, section }: { entry: Entry; section: string }) {
  return (
    <>
      <div className="text-[13px] text-neutral-400">
        {section} <span className="mx-1">/</span> <span className="text-neutral-600 dark:text-neutral-300">{entry.name}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{entry.name}</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-6 text-neutral-500 dark:text-neutral-400">{entry.description}</p>
      {tagsFor(entry.slug).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
          {tagsFor(entry.slug).map((t) => (
            <a key={t} href={`#/tag/${t}`} className="rounded-full px-2.5 py-0.5 text-[12px] text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-colors hover:text-neutral-900 hover:shadow-[0_0_0_1px_rgb(0_0_0/0.18)] dark:text-neutral-400 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:text-white">
              #{t}
            </a>
          ))}
        </div>
      )}
    </>
  )
}

/** Pieces that share the most tags with this one, from any group. */
function Related({ entry }: { entry: Entry }) {
  const items = related(DOCS.filter((d) => d.kind !== "skill"), entry.slug, 4).flatMap((d) => ALL.filter((e) => e.slug === d.id))
  if (!items.length) return null
  return (
    <section className="mt-12" aria-label="Related pieces">
      <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Goes well with</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((e) => (
          <a key={e.slug} href={`#/${e.slug}`} className="group rounded-2xl bg-white p-3.5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-shadow hover:shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_12px_28px_-14px_rgb(0_0_0/0.25)] dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
            <span className="flex items-center gap-2">
              <e.icon className="size-4 text-neutral-400" />
              <span className="truncate text-[13.5px] font-medium">{e.name}</span>
              <ArrowUpRight className="ml-auto size-3.5 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-neutral-600" />
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[12.5px] leading-[18px] text-neutral-500 dark:text-neutral-400">{e.description.replace(/^Instrument · /, "")}</span>
            <span className="mt-2 block truncate text-[11px] text-neutral-400">{KIND_GROUP[e.slug]}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

/** Every piece with one tag, across groups. */
function TagPage({ tag }: { tag: string }) {
  const items = ALL.filter((e) => tagsFor(e.slug).includes(tag))
  return (
    <div>
      <div className="text-[13px] text-neutral-400">
        <a href="#/browse" className="hover:text-neutral-700 dark:hover:text-neutral-200">Overview</a> <span className="mx-1">/</span> Tag
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">#{tag}</h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">{items.length} pieces across {new Set(items.map((e) => KIND_GROUP[e.slug])).size} groups.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((e) => (
          <EntryCard key={e.slug} entry={e} />
        ))}
      </div>
      {!items.length && <p className="mt-6 text-[14px] text-neutral-500">No pieces have this tag yet.</p>}
    </div>
  )
}

function Tabs({ tab, setTab }: { tab: "preview" | "code"; setTab: (t: "preview" | "code") => void }) {
  return (
    <div className="flex rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]" role="tablist">
      {(
        [
          ["preview", "Preview", Eye],
          ["code", "Code", Code2],
        ] as const
      ).map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium text-neutral-500 transition-colors",
            tab === id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

function InstallButton({ slugs }: { slugs: string[] }) {
  const [copied, copy] = useCopied()
  const cmd = `npx shadcn@latest add ${slugs.map((s) => `${SITE}/r/${s}.json`).join(" ")}`
  return (
    <button
      type="button"
      onClick={() => copy(cmd)}
      title={cmd}
      className="ml-auto flex h-9 min-w-0 items-center gap-2 rounded-xl bg-neutral-900 px-3 font-mono text-xs text-neutral-200 transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-800 dark:hover:bg-neutral-200"
    >
      <span className="truncate">npx shadcn add …/{slugs[0]}.json</span>
      {copied ? <Check className="size-3.5 shrink-0 text-emerald-400 dark:text-emerald-600" /> : <Copy className="size-3.5 shrink-0" />}
    </button>
  )
}

function PrevNext({ entry }: { entry: Entry }) {
  const index = PAGES.findIndex((e) => e.slug === entry.slug)
  const prev = PAGES[index - 1]
  const next = PAGES[index + 1]
  return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      {prev ? (
        <a href={`#/${prev.slug}`} className="group rounded-xl px-4 py-3 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] transition-colors hover:bg-black/[0.02] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)] dark:hover:bg-white/[0.03]">
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="text-[14px] font-medium">{prev.name}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={`#/${next.slug}`} className="group rounded-xl px-4 py-3 text-right shadow-[0_0_0_1px_rgb(0_0_0/0.06)] transition-colors hover:bg-black/[0.02] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)] dark:hover:bg-white/[0.03]">
          <span className="flex items-center justify-end gap-1 text-xs text-neutral-400">
            Next <ArrowRight className="size-3" />
          </span>
          <span className="text-[14px] font-medium">{next.name}</span>
        </a>
      )}
    </div>
  )
}

function ComponentPage({ entry }: { entry: Entry }) {
  const [run, setRun] = React.useState(0)
  const [tab, setTab] = React.useState<"preview" | "code">("preview")
  const Demo = entry.demo!

  return (
    <div>
      <PageHeader entry={entry} section={entry.kind === "blocks" ? "Blocks" : "Components"} />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Tabs tab={tab} setTab={setTab} />
        <InstallButton slugs={[entry.slug]} />
      </div>

      <div className="mt-3">
        {tab === "preview" ? (
          <div className="demo-stage relative flex min-h-[460px] justify-center overflow-hidden rounded-2xl px-4 py-12 sm:px-10">
            <IconButton label="Replay demo" onClick={() => setRun((r) => r + 1)} className="absolute top-3 right-3 bg-white/70 backdrop-blur dark:bg-white/5">
              <RotateCw className="size-4" />
            </IconButton>
            <React.Suspense fallback={<div className="self-center text-sm text-neutral-400">Loading…</div>}>
              <Demo key={run} />
            </React.Suspense>
          </div>
        ) : (
          <CodeView entry={entry} />
        )}
      </div>
      <Related entry={entry} />
      <PrevNext entry={entry} />
    </div>
  )
}

/* Studio: illustrations and motion with background, accent and speed ------- */

const BACKDROP_LABELS: Record<BackdropVariant, string> = {
  plain: "Plain",
  dots: "Dots",
  halftone: "Halftone",
  grid: "Grid",
  drift: "Drift",
  floor: "Floor",
  aurora: "Aurora",
  dither: "Dither",
}

const ACCENTS = [
  { id: "#0060e2", label: "Blue" },
  { id: "#5b5bd6", label: "Indigo" },
  { id: "#7c3aed", label: "Violet" },
  { id: "#e8590c", label: "Coral" },
  { id: "#0f9d58", label: "Green" },
  { id: "#db2777", label: "Pink" },
  { id: "#18181b", label: "Ink" },
] as const

const SPEEDS = [0.5, 1, 1.5, 2] as const

type Studio = { variant: BackdropVariant; accent: string; speed: number; paused: boolean }
const STUDIO_DEFAULT: Studio = { variant: "dots", accent: "#0060e2", speed: 1, paused: false }

/** Studio choices persist across pages so you can compare pieces on the same background. */
function useStudio() {
  const [studio, setStudio] = React.useState<Studio>(() => {
    try {
      const saved = JSON.parse((localStorage.getItem("pane-studio") ?? localStorage.getItem("cadence-ui-studio")) ?? "null")
      if (saved && BACKDROP_VARIANTS.includes(saved.variant)) return { ...STUDIO_DEFAULT, ...saved, paused: false }
    } catch {
      /* storage can be blocked */
    }
    return STUDIO_DEFAULT
  })
  React.useEffect(() => {
    try {
      localStorage.setItem("pane-studio", JSON.stringify({ ...studio, paused: undefined }))
    } catch {
      /* storage can be blocked */
    }
  }, [studio])
  const set = React.useCallback((patch: Partial<Studio>) => setStudio((s) => ({ ...s, ...patch })), [])
  return [studio, set] as const
}

function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: React.ReactNode; title?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="px-0.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">{label}</span>
      <div className="flex flex-wrap gap-0.5 rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.id)}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            title={o.title}
            onClick={() => onChange(o.id)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
              value === o.id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function StudioBar({ studio, set, onReplay, allowed }: { studio: Studio; set: (p: Partial<Studio>) => void; onReplay: () => void; allowed: readonly BackdropVariant[] }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      {allowed.length > 1 && <Seg label="Background" value={studio.variant} onChange={(variant) => set({ variant })} options={allowed.map((v) => ({ id: v, label: BACKDROP_LABELS[v] }))} />}
      <div className="flex flex-col gap-1.5">
        <span className="px-0.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">Accent</span>
        <div className="flex h-[34px] items-center gap-1.5 px-0.5" role="radiogroup" aria-label="Accent">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={studio.accent === a.id}
              aria-label={a.label}
              title={a.label}
              onClick={() => set({ accent: a.id })}
              className={cn(
                "size-5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] transition-transform hover:scale-110 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]",
                studio.accent === a.id && "ring-2 ring-neutral-900/70 ring-offset-2 ring-offset-white dark:ring-white/80 dark:ring-offset-neutral-950",
              )}
              style={{ background: a.id === "#18181b" ? "linear-gradient(135deg, #18181b 50%, #fafafa 50%)" : a.id }}
            />
          ))}
        </div>
      </div>
      <Seg label="Speed" value={studio.speed} onChange={(speed) => set({ speed })} options={SPEEDS.map((s) => ({ id: s, label: `${s}×` }))} />
      <div className="flex gap-1 pb-px">
        <IconButton label={studio.paused ? "Play" : "Pause"} onClick={() => set({ paused: !studio.paused })} className="shadow-[0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]">
          {studio.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </IconButton>
        <IconButton label="Replay" onClick={onReplay} className="shadow-[0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]">
          <RotateCw className="size-4" />
        </IconButton>
      </div>
    </div>
  )
}

/** The snippet that reproduces exactly what's on screen. */
function usageSnippet(entry: Entry, studio: Studio, solo: boolean) {
  const name = entry.exportName ?? entry.name.replace(/\s+/g, "")
  const props = [
    studio.accent !== STUDIO_DEFAULT.accent && `accent="${studio.accent}"`,
    studio.speed !== 1 && `speed={${studio.speed}}`,
  ].filter(Boolean)
  const backdropProps = [`variant="${studio.variant}"`, studio.accent !== STUDIO_DEFAULT.accent && `accent="${studio.accent}"`, studio.speed !== 1 && `speed={${studio.speed}}`].filter(Boolean)
  const tag = `<${name}${props.length ? " " + props.join(" ") : ""} />`
  if (solo) return [`import { ${name} } from "@/components/${entry.kind}/${entry.slug}"`, ``, `export function Hero() {`, `  return ${tag}`, `}`].join("\n")
  return [
    `import { Backdrop } from "@/components/motion/backdrop"`,
    `import { ${name} } from "@/components/${entry.kind}/${entry.slug}"`,
    ``,
    `export function Hero() {`,
    `  return (`,
    `    <Backdrop ${backdropProps.join(" ")} className="rounded-2xl">`,
    `      ${tag}`,
    `    </Backdrop>`,
    `  )`,
    `}`,
  ].join("\n")
}

function StudioPage({ entry }: { entry: Entry }) {
  const [saved, set] = useStudio()
  const allowed = entry.backdrops ?? BACKDROP_VARIANTS
  // A background that clashes with this piece falls back to its first suitable one.
  const studio = allowed.includes(saved.variant) ? saved : { ...saved, variant: allowed[0] }
  const [run, setRun] = React.useState(0)
  const [tab, setTab] = React.useState<"preview" | "code">("preview")
  const Demo = entry.demo!

  return (
    <div>
      <PageHeader entry={entry} section={entry.kind === "motion" ? "Motion" : "Illustrations"} />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Tabs tab={tab} setTab={setTab} />
        <InstallButton slugs={[entry.slug, "backdrop"]} />
      </div>

      {tab === "preview" ? (
        <>
          <div className="mt-4 rounded-2xl bg-neutral-50 p-3 shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-white/[0.02] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]">
            <StudioBar studio={studio} set={set} allowed={allowed} onReplay={() => setRun((r) => r + 1)} />
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgb(0_0_0/0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]">
            <Backdrop variant={studio.variant} accent={studio.accent} speed={studio.speed} paused={studio.paused} minHeight={0} className="min-h-[300px] sm:min-h-[480px]">
              <div className="flex w-full justify-center px-2 py-6 sm:px-10 sm:py-10">
                <React.Suspense fallback={<div className="text-sm text-neutral-400">Loading…</div>}>
                  <Demo key={run} speed={studio.speed} paused={studio.paused} accent={studio.accent} />
                </React.Suspense>
              </div>
            </Backdrop>
          </div>
          <div className="mt-6">
            <h2 className="mb-2 text-[14px] font-semibold">Use it like this</h2>
            <CodeBlock title={allowed.length === 1 ? "Your current accent and speed" : "Your current background, accent and speed"} code={usageSnippet(entry, studio, allowed.length === 1)} />
          </div>
        </>
      ) : (
        <div className="mt-3">
          <CodeView entry={entry} extra={["components/motion/backdrop.tsx"]} />
        </div>
      )}
      <Related entry={entry} />
      <PrevNext entry={entry} />
    </div>
  )
}

/* App ---------------------------------------------------------------------- */

export default function App() {
  const [dark, toggleDark] = useTheme()
  const [style, setStyle] = useStyle()
  const slug = useSlug()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const entry = ALL.find((e) => e.slug === slug)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  const palette = <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} docs={DOCS} counts={TAG_COUNTS} />

  if (entry?.kind === "screen") {
    const Screen = SCREENS[entry.slug] ?? AgentChat
    // The Meridian screens don't load the app-shell CSS, so their rail buttons are styled here.
    const toolBtn = entry.slug === "agent-run" || entry.slug === "agent-chat"
      ? "as-icon-btn"
      : "grid size-7 place-items-center rounded-[2px] text-neutral-500 transition-colors hover:bg-black/[0.05] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.07] dark:hover:text-white [&_svg]:size-[15px] [&_svg]:stroke-[1.5]"
    return (
      <div className="h-dvh">
        {palette}
        <React.Suspense fallback={null}>
        <Screen
          key={entry.slug}
          onNavigate={navigateFromScreen}
          sideTools={
            <div className="flex gap-1">
              <button
                type="button"
                className={toolBtn}
                aria-label={`Style: ${style} (switch)`}
                title={`Style: ${style}`}
                onClick={() => setStyle(STYLE_OPTIONS[(STYLE_OPTIONS.findIndex((o) => o.id === style) + 1) % STYLE_OPTIONS.length].id)}
              >
                <Palette />
              </button>
              <button type="button" className={toolBtn} aria-label="Toggle dark mode" onClick={toggleDark}>
                {dark ? <Sun /> : <Moon />}
              </button>
            </div>
          }
        />
        </React.Suspense>
      </div>
    )
  }

  if (slug === "") return <>{palette}<Landing groups={GROUPS} dark={dark} toggleDark={toggleDark} style={style} setStyle={(id) => setStyle(id as StyleId)} styles={STYLE_OPTIONS} /></>

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="gallery-side sticky top-0 hidden h-dvh w-[264px] shrink-0 border-r border-black/[0.06] bg-neutral-50/80 md:block dark:border-white/[0.06] dark:bg-white/[0.015]">
        <Sidebar slug={slug} dark={dark} toggleDark={toggleDark} style={style} setStyle={setStyle} onSearch={() => setPaletteOpen(true)} />
      </aside>

      {/* Mobile bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/80 px-4 py-2.5 backdrop-blur md:hidden dark:border-white/10 dark:bg-neutral-950/80">
        <a href="#/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo /> Pane
        </a>
        <IconButton label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </IconButton>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/20" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl dark:bg-neutral-950">
            <Sidebar slug={slug} dark={dark} toggleDark={toggleDark} style={style} setStyle={setStyle} onPick={() => setMenuOpen(false)} onSearch={() => { setMenuOpen(false); setPaletteOpen(true) }} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 md:px-12 md:py-12">
        {palette}
        <div className="mx-auto max-w-5xl">{slug === "skills" || slug.startsWith("skills/") ? <SkillsPage initialId={slug.startsWith("skills/") ? decodeURIComponent(slug.slice(7)) : undefined} /> : slug.startsWith("tag/") ? <TagPage tag={decodeURIComponent(slug.slice(4))} /> : entry?.demo ? entry.kind === "ui" || entry.kind === "blocks" ? <ComponentPage key={entry.slug} entry={entry} /> : <StudioPage key={entry.slug} entry={entry} /> : <Home group={slug.startsWith("browse/") ? decodeURIComponent(slug.slice(7)) : undefined} />}</div>
      </main>
    </div>
  )
}

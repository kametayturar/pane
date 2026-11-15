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
  Clapperboard,
  Plug,
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
  Timer,
  TextQuote,
  ArrowRightLeft,
  GitMerge,
  BellDot,
  ArrowLeftRight,
  Box,
  Cat,
  Flower2,
  GalleryVerticalEnd,
  Hand,
  Layers2,
  MessageSquareDashed,
  MousePointer2,
  Sailboat,
  Smartphone,
  WavesHorizontal,
  Anchor,
  Sprout,
  Telescope,
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
const StudioApp = React.lazy(() => import("@/studio/studio-page"))
const McpPage = React.lazy(() => import("@/mcp-page"))
const AgentPage = React.lazy(() => import("@/agent-page"))
// Landing drafts under review: src/landings/<id>.tsx, shown at #/draft/<id>. Not linked from anywhere.
const DRAFT_PAGES: Record<string, React.LazyExoticComponent<React.ComponentType<React.ComponentProps<typeof Landing>>>> = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: React.ComponentType<React.ComponentProps<typeof Landing>> }>("./landings/*.tsx")).map(([file, load]) => [file.slice("./landings/".length, -".tsx".length), React.lazy(load)]),
)
/** Pieces with a Studio spec (src/studio/pieces/<slug>.studio.ts) get an "Open in Studio" link. */
const STUDIO_SLUGS = new Set(Object.keys(import.meta.glob("./studio/pieces/*.studio.ts*")).map((k) => k.replace(/^.*\//, "").replace(/\.studio\.tsx?$/, "")))
const isStudioSlug = (s: string) => s === "studio" || s.startsWith("studio/") || s.startsWith("studio?")
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
const ill = (s: Spec): Entry => ({ ...s, kind: "illustrations" })
const mo = (s: Spec): Entry => ({ ...s, kind: "motion" })
const bl = (s: Spec): Entry => ({ ...s, kind: "blocks" })

const RAW_GROUPS: { label: string; entries: Entry[] }[] = [
  {
    label: "Originals",
    entries: [
      ui({ slug: "action-drum", name: "Action Drum", exportName: "ActionDrum", icon: ChevronsUpDown, isNew: true, description: "Confirm an agent's action by rolling a drum of verbs – Discard, Hold, Send – until the one you mean settles under the highlight." }),
      ui({ slug: "odometer", name: "Odometer", exportName: "Odometer", icon: Gauge, isNew: true, description: "A background agent's progress as one big rolling count that stops on the number it needs you to check." }),
      ui({ slug: "thought-stack", name: "Thought Stack", exportName: "ThoughtStack", icon: Layers, isNew: true, description: "Reasoning steps dealt as a deck of cards; the answer springs forward on top with the steps tucked underneath." }),
      ui({ slug: "fill-in", name: "Fill In", exportName: "FillIn", icon: TextCursorInput, isNew: true, description: "The agent stops mid-sentence at a blank; the answer you tap lifts out of the options and lands in the sentence." }),
      ui({ slug: "effort-sentence", name: "Effort Sentence", exportName: "EffortSentence", icon: TextQuote, isNew: true, description: "How hard the model thinks, as one sentence: Think longer adds what it will do, and the seconds and price change in place." }),
      ui({ slug: "undo-countdown", name: "Undo Countdown", exportName: "UndoCountdown", icon: Timer, isNew: true, description: "A big countdown to undo an agent's action; the word undo is the button, and the number becomes the count it moved." }),
      ui({ slug: "plan-words", name: "Plan Words", exportName: "PlanWords", icon: ListChecks, isNew: true, description: "Before an agent starts, each step's last word is its control: Run, Ask first or Skip. At Go the words roll into live status." }),
      ui({ slug: "same-page", name: "Same Page", exportName: "SamePage", icon: ArrowRightLeft, isNew: true, description: "A handoff between agents as one document: the first agent's finding lifts out of its notes and becomes the opening line the next agent writes on from." }),
      ui({ slug: "tool-headline", name: "Tool Headline", exportName: "ToolHeadline", icon: Wrench, isNew: true, description: "The tool an agent is using right now as a big headline; the verb turns past tense and shrinks into a receipt as the next tool takes over." }),
      ui({ slug: "scope-words", name: "Scope Words", exportName: "ScopeWords", icon: KeyRound, isNew: true, description: "Grant an agent access with three big words \u2013 Once, This task, Always \u2013 each with its consequence; the one you pick rises into the headline." }),
      ui({ slug: "merge-range", name: "Merge Range", exportName: "MergeRange", icon: GitMerge, isNew: true, description: "Parallel sub-agents report at different times; their three findings glide together into one answer, a range like $19\u2013$31." }),
      ui({ slug: "steer-swap", name: "Steer Swap", exportName: "SteerSwap", icon: Route, isNew: true, description: "Redirect a running agent: tap the other option and it grows into the headline while the old one shrinks into the row it left, with nothing lost." }),
      ui({ slug: "pulled-focus", name: "Pulled Focus", exportName: "PulledFocus", icon: BellDot, isNew: true, description: "Back from a break: finished work folds into one small row and the one thing that needs you swells into the headline." }),
    ],
  },
  {
    label: "Overlays",
    entries: [
      ui({ slug: "modal", name: "Modal", exportName: "Modal", icon: AppWindow, isNew: true, description: "A dialog that grows out of the button that opened it, dims the page and returns focus when it closes." }),
      ui({ slug: "popover", name: "Popover", exportName: "Popover", icon: MessageSquareDashed, isNew: true, description: "A panel anchored to its trigger that flips to stay on screen and glides to the next trigger instead of closing." }),
      ui({ slug: "tooltip", name: "Tooltip", exportName: "Tooltip", icon: MessageSquareText, isNew: true, description: "A label with a shortcut that waits on the first hover, then shows instantly as you slide along a toolbar." }),
      ui({ slug: "drawer", name: "Drawer", exportName: "Drawer", icon: PanelBottom, isNew: true, description: "A sheet that follows the finger, rubber-bands past its edge, snaps between heights and leaves at the speed you flicked it." }),
      ui({ slug: "swipe-row", name: "Swipe Row", exportName: "SwipeRow", icon: ArrowLeftRight, isNew: true, description: "A list row you drag to reveal actions; a long swipe or a flick commits and the list closes the gap." }),
      ui({ slug: "hold-to-confirm", name: "Hold to Confirm", exportName: "HoldToConfirm", icon: Hand, isNew: true, description: "A button that fills while you hold it: the commit is slow, letting go cancels at once." }),
    ],
  },
  {
    label: "Stage",
    entries: [
      ui({ slug: "device-frames", name: "Device Frames", exportName: "DeviceFrames", icon: Smartphone, isNew: true, description: "Browser and phone frames for product shots that scale a fixed stage and bleed off the card edge." }),
      mo({ slug: "cursor-walkthrough", name: "Cursor Walkthrough", exportName: "CursorWalkthrough", icon: MousePointer2, isNew: true, description: "A scripted cursor that moves, clicks, types and drags through any piece and holds on the result." }),
      bl({ slug: "control-bento", name: "Control Bento", exportName: "ControlBento", icon: LayoutGrid, isNew: true, description: "A bento of small live controls for a landing page, with one tile at a time demonstrated by a cursor." }),
      bl({ slug: "overlay-atlas", name: "Overlay Atlas", exportName: "OverlayAtlas", icon: Layers2, isNew: true, description: "Modal, popover, tooltip, toast, sheet and drawer side by side in one product window, each played on hover." }),
      bl({ slug: "light-cards", name: "Light Cards", exportName: "LightCards", icon: GalleryVerticalEnd, isNew: true, description: "Numbered dark feature cards, each with light-painted art cropped by its edge that brightens on hover." }),
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
      ui({ slug: "reaction-bar", name: "Reaction Bar", icon: Smile, isNew: true, description: "Reactions that count up and show who reacted." }),
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
      ill({ slug: "pastel-harbor", name: "Pastel Harbor", exportName: "PastelHarbor", icon: Anchor, isNew: true, description: "A harbour at first light drawn in oil pastel and crayon strokes: cranes, a ferry's lamps and long reflections on the water." }),
      ill({ slug: "pencil-greenhouse", name: "Pencil Greenhouse", exportName: "PencilGreenhouse", icon: Sprout, isNew: true, description: "A glass greenhouse after rain in coloured pencil and chalk: hatched leaves, wet panes and light falling through the roof." }),
      ill({ slug: "chalk-observatory", name: "Chalk Observatory", exportName: "ChalkObservatory", icon: Telescope, isNew: true, description: "A mountain observatory under a crowded night sky, drawn in chalk and pastel on dark paper." }),
      ill({ slug: "dash-ribbon", name: "Dash Ribbon", exportName: "DashRibbon", icon: WavesHorizontal, isNew: true, description: "Rows of rounded dashes following a rolling wave, with a run of light traced down one row." }),
      ill({ slug: "light-form", name: "Light Form", exportName: "LightForm", icon: Flower2, isNew: true, description: "A moth, orchid or fern drawn from hundreds of glowing strands with a chromatic fringe, breathing slowly." }),
      ill({ slug: "gouache-lake", name: "Gouache Lake", exportName: "GouacheLake", icon: Sailboat, isNew: true, description: "A painted hillside and its reflection drawn from brush dabs, with a small boat leaving a wake." }),
      ill({ slug: "golden-hills", name: "Golden Hills", exportName: "GoldenHills", icon: Mountain, isNew: true, description: "Grassy hills lit by a low sun, a lone tree and a tiny walker, with cloud shadows drifting over." }),
      ill({ slug: "hatched-skies", name: "Hatched Skies", exportName: "HatchedSkies", icon: Cloud, isNew: true, description: "Clouds filled with fine vertical ticks drifting behind a headline." }),
      ill({ slug: "dash-burst", name: "Dash Burst", exportName: "DashBurst", icon: Sun, isNew: true, description: "A ring of radial dashes sized by a metric around one big number, bursting outward from one sector." }),
      ill({ slug: "column-cube", name: "Column Cube", exportName: "ColumnCube", icon: Box, isNew: true, description: "An isometric block of columns cut open to show a coloured layer, with a scan that lifts the cells it finds." }),
      ill({ slug: "peek-icon", name: "Peek Icon", exportName: "PeekIcon", icon: Cat, isNew: true, description: "App icons where a character peeks in at an angle over a background that says what the app does." }),
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
      mo({ slug: "grain-gradient", name: "Grain Gradient", exportName: "GrainGradient", icon: Blend, isNew: true, description: "A smooth gradient field \u2013 orb, ring, band or wave \u2013 with fine grain so it never bands, exportable as an image." }),
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
    icon: e.icon,
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
  { id: "page:studio", href: "#/studio", title: "Studio", kind: "page", group: "Pages", description: "Tune any piece and export PNG, SVG, video or GIF.", tags: [], keywords: ["export", "png", "svg", "gif", "webm", "video", "gradient", "editor", "make"], icon: Clapperboard },
  { id: "page:mcp", href: "#/mcp", title: "MCP", kind: "page", group: "Pages", description: "Connect Pane to your coding agent over MCP.", tags: [], keywords: ["model context protocol", "agent", "claude", "cursor", "server", "install"], icon: Plug },
  { id: "page:agent-operable", href: "#/agent-operable", title: "Agent-operable", kind: "page", group: "Pages", description: "Let an agent read Pane pieces and operate them through their own handlers, behind your approval.", tags: [], keywords: ["agent", "snapshot", "act", "bridge", "approval", "webmcp", "operate", "tools"], icon: Bot },
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

/** Flat line glyphs for the three styles: filled, half filled, ringed. */
function StyleGlyph({ id }: { id: StyleId }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
      {id === "classic" && <circle cx="8" cy="8" r="6" fill="currentColor" />}
      {id === "mono" && (
        <>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
        </>
      )}
      {id === "glass" && (
        <>
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="2.5" />
        </>
      )}
    </svg>
  )
}

function StylePicker({ style, setStyle }: { style: StyleId; setStyle: (s: StyleId) => void }) {
  return (
    <div className="mx-3 mb-4">
      <div className="mb-1.5 px-1 text-[12px] text-neutral-400">Style</div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]" role="radiogroup" aria-label="Style">
        {STYLE_OPTIONS.map((o) => (

          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={style === o.id}
            onClick={() => setStyle(o.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[9px] py-1.5 text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
              style === o.id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
            )}
          >
            <StyleGlyph id={o.id} />
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
        <a href="#/" onClick={onPick} aria-label="Pane home" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <Logo />
          Pane
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
          placeholder="Search"
          aria-label="Search components"
          className="min-w-0 flex-1 bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
        />
        <button type="button" onClick={onSearch} title="Search everything (⌘K)" className="rounded-md bg-black/[0.05] px-1.5 font-sans text-[12px] text-neutral-400 transition-colors hover:text-neutral-700 dark:bg-white/10 dark:hover:text-neutral-200">
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
            <div className="mb-1 flex items-center justify-between px-2 text-[12px] font-medium text-neutral-500">
              {g.label}
              <span className="font-normal text-neutral-400 tabular-nums">{g.entries.length}</span>
            </div>
            <ul className="flex flex-col gap-px">
              {g.entries.map((e) => {
                const active = slug === e.slug
                return (
                  <li key={e.slug}>
                    <a href={`#/${e.slug}`} onClick={onPick} aria-current={active ? "page" : undefined} className={cn(navItem, active && navActive)}>
                      {active && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[2px] rounded-full bg-neutral-900/70 dark:bg-white/70" aria-hidden />}
                      <e.icon className={cn("size-4 shrink-0", active ? "text-neutral-900 dark:text-white" : "text-neutral-400")} />
                      <span className="truncate">{e.name}</span>
                      {e.kind === "screen" && <ArrowUpRight className="ml-auto size-3.5 opacity-40" />}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {!groups.length && <p className="px-2 pt-4 text-[13px] text-neutral-400">No results for “{query}”</p>}
        <div className="mt-5">
          <div className="mb-1 px-2 text-[12px] font-medium text-neutral-500">Make</div>
          <a href="#/studio" onClick={onPick} aria-current={isStudioSlug(slug) ? "page" : undefined} className={cn(navItem, isStudioSlug(slug) && navActive)}>
            <Clapperboard className="size-4 text-neutral-400" />
            Studio
          </a>
        </div>
        {SKILLS.length > 0 && (
          <div className="mt-5">
            <div className="mb-1 px-2 text-[12px] font-medium text-neutral-500">For your agent</div>
            <a href="#/skills" onClick={onPick} aria-current={slug === "skills" ? "page" : undefined} className={cn(navItem, slug === "skills" && navActive)}>
              <Wand2 className="size-4 text-neutral-400" />
              Skills
              <span className="ml-auto text-[12px] text-neutral-400 tabular-nums">{SKILLS.length}</span>
            </a>
            <a href="#/mcp" onClick={onPick} aria-current={slug === "mcp" ? "page" : undefined} className={cn(navItem, slug === "mcp" && navActive)}>
              <Plug className="size-4 text-neutral-400" />
              MCP
            </a>
            <a href="#/agent-operable" onClick={onPick} aria-current={slug === "agent-operable" ? "page" : undefined} className={cn(navItem, slug === "agent-operable" && navActive)}>
              <Bot className="size-4 text-neutral-400" />
              Agent-operable
            </a>
          </div>
        )}
      </nav>

      <div className="border-t border-black/[0.06] px-5 py-4 text-[12px] text-neutral-400 dark:border-white/[0.06]">
        v0.1 <span className="mx-1.5">·</span> MIT <span className="mx-1.5">·</span>
        <a href="https://github.com/kametayturar/pane" target="_blank" rel="noreferrer" className="transition-colors hover:text-neutral-700 dark:hover:text-neutral-200">
          GitHub ↗
        </a>
      </div>
    </div>
  )
}

const navItem =
  "relative flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13px] text-neutral-600 transition-colors hover:bg-black/[0.04] hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
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
  { slug: "overlay-atlas", span: "md:col-span-2 xl:col-span-4", width: 900, align: "top", tag: "Overlays" },
  { slug: "drawer", span: "xl:col-span-2", width: 460, align: "top", tag: "Overlays" },
  { slug: "gouache-lake", span: "xl:col-span-2", width: 760, variant: "plain", tag: "Art" },
  { slug: "golden-hills", span: "xl:col-span-2", width: 640, variant: "plain", tag: "Art" },
  { slug: "light-form", span: "xl:col-span-2", width: 560, variant: "plain", tag: "Art" },
]

/** Browse by interaction: each chip filters the overview by a tag from src/data/tags.json. */
const INTERACTIONS = [
  { label: "Hover", tag: "hover" },
  { label: "Scroll", tag: "scroll" },
  { label: "Drag", tag: "drag" },
  { label: "Gesture", tag: "gesture" },
  { label: "Keyboard", tag: "keyboard" },
  { label: "Streaming", tag: "streaming" },
  { label: "Glass", tag: "glass" },
  { label: "Dither", tag: "dither" },
  { label: "3D", tag: "3d" },
]
const INTERACTION_COUNTS: Record<string, number> = Object.fromEntries(INTERACTIONS.map((i) => [i.tag, ALL.filter((e) => tagsFor(e.slug).includes(i.tag)).length]))

function Home({ group }: { group?: string }) {
  React.useEffect(() => {
    if (!group) return
    const id = window.setTimeout(() => document.getElementById(`group-${group}`)?.scrollIntoView({ block: "start" }), 60)
    return () => window.clearTimeout(id)
  }, [group])
  const [interaction, setInteraction] = React.useState<string | null>(null)
  const filtered = interaction ? INTERACTIONS.find((i) => i.tag === interaction) : undefined
  const shownGroups = filtered
    ? GROUPS.map((g) => ({ ...g, entries: g.entries.filter((e) => tagsFor(e.slug).includes(filtered.tag)) })).filter((g) => g.entries.length)
    : GROUPS
  const featured = FEATURED.flatMap((f) => {
    const entry = ALL.find((e) => e.slug === f.slug)
    return entry?.demo ? [{ ...f, entry }] : []
  })
  const jump = (label: string) => document.getElementById(`group-${label}`)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div>
      <section className="pt-2">
        <h1 className="max-w-4xl text-4xl text-balance leading-[1.05] font-semibold tracking-[-0.03em] sm:text-[56px]">One-file React pieces for AI products</h1>
        <p className="mt-4 max-w-xl text-[16px] leading-6 text-neutral-500 dark:text-neutral-400">
          Components, illustrations, motion and agent skills. Copy a file or install with the shadcn CLI.
        </p>
        <p className="mt-3 text-[13px] text-neutral-400 tabular-nums">
          {ALL.length} pieces <span className="mx-1">·</span> {SKILLS.length} skills
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

      <nav className="mt-12 flex flex-wrap items-baseline gap-x-1 gap-y-1" aria-label="Browse by interaction">
        <span className="mr-2 text-[13px] text-neutral-400">Browse by interaction</span>
        {INTERACTIONS.map((i) => {
          const on = interaction === i.tag
          return (
            <button
              key={i.tag}
              type="button"
              aria-pressed={on}
              onClick={() => setInteraction(on ? null : i.tag)}
              className={cn(
                "rounded-md px-2 py-1 text-[13px] transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(.22,1,.36,1)] active:scale-[0.97]",
                on ? "bg-black/[0.05] font-medium text-neutral-900 dark:bg-white/10 dark:text-white" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              {i.label} <span className="text-neutral-400 tabular-nums">{INTERACTION_COUNTS[i.tag]}</span>
            </button>
          )
        })}
      </nav>

      {!filtered && featured.length > 0 && (
        <section className="mt-12" aria-label="Featured">
          <div className="grid auto-rows-[300px] gap-3 md:grid-cols-2 xl:auto-rows-[268px] xl:grid-cols-6">
            {featured.map((f) => (
              <a
                key={f.slug}
                href={`#/${f.slug}`}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-shadow hover:shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_18px_40px_-20px_rgb(0_0_0/0.3)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
                  f.span,
                )}
              >
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <LivePreview
                    Demo={f.entry.demo!}
                    width={f.width}
                    align={f.align ?? "center"}
                    variant={f.variant ?? "dots"}
                    accent={f.accent}
                    replay={f.entry.kind === "ui" || f.entry.kind === "blocks" ? 13000 : undefined}
                    className="absolute inset-0"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-3 border-t border-black/[0.06] bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-neutral-900">
                  <div className="min-w-0">
                    <div className="text-[12px] text-neutral-400">{f.tag}</div>
                    <div className="mt-0.5 text-[15px] font-semibold tracking-tight">{f.entry.name}</div>
                    <p className="mt-0.5 line-clamp-1 max-w-md text-[13px] text-neutral-500 dark:text-neutral-400">{f.entry.description}</p>
                  </div>
                  <span className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {!filtered && <MeridianShowcase />}

      {shownGroups.map((g) => (
        <section key={g.label} id={`group-${g.label}`} className={cn("scroll-mt-20", filtered ? "mt-8" : "mt-16")}>
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
          <div className="text-[12px] text-neutral-400">Meridian</div>
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
          <ScreenThumb slug={lead.slug} className="aspect-[16/10] h-full w-full" />
          <ScreenLabel entry={lead} />
        </a>
        {rest.map((e) => (
          <a key={e.slug} href={`#/${e.slug}`} className="group relative overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]">
            <ScreenThumb slug={e.slug} className="aspect-[16/10] w-full" />
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
          <span className="text-[12px] opacity-60">The kit · 10 pieces</span>
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
        "gallery-card group flex flex-col rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 ease-[cubic-bezier(.22,1,.36,1)] [@media(hover:hover)]:hover:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_8px_20px_-14px_rgb(0_0_0/0.25)] dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
        wide && "sm:col-span-2 xl:row-span-2",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-200">
          <e.icon className="size-4" />
        </span>
        <span className={cn("font-medium", wide ? "text-[15px]" : "text-[14px]")}>{e.name}</span>
        <ArrowUpRight className="ml-auto size-4 text-neutral-300 dark:text-neutral-600" />
      </div>
      <p className="mt-2.5 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">{e.description}</p>
      {e.kind === "screen" && MERIDIAN.includes(e.slug) && (
        <ScreenThumb slug={e.slug} className={cn("mt-3 rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]", wide ? "h-40 min-h-40 flex-1 xl:min-h-[340px]" : "h-40")} />
      )}
      {e.demo && (
        <LivePreview
          Demo={e.demo}
          width={wide ? 860 : 760}
          align={studio ? "center" : "top"}
          replay={studio ? undefined : 12000}
          hovered={hovered}
          className={cn("mt-3 rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/0.05)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]", wide ? "h-40 min-h-40 flex-1 xl:min-h-[340px]" : "h-40")}
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
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
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
      {STUDIO_SLUGS.has(entry.slug) && (
        <a href={`#/studio/${entry.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
          <Clapperboard className="size-3.5" /> Open in Studio <ArrowUpRight className="size-3" />
        </a>
      )}
      {tagsFor(entry.slug).length > 0 && (
        <p className="mt-3 text-[12px] text-neutral-400" aria-label="Tags">
          {tagsFor(entry.slug).map((t, n) => (
            <React.Fragment key={t}>
              {n > 0 && ", "}
              <a href={`#/tag/${t}`} className="transition-colors hover:text-neutral-900 dark:hover:text-white">
                {t}
              </a>
            </React.Fragment>
          ))}
        </p>
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
              <ArrowUpRight className="ml-auto size-3.5 text-neutral-300 dark:text-neutral-600" />
            </span>
            <span className="mt-1.5 line-clamp-2 block text-[12.5px] leading-[18px] text-neutral-500 dark:text-neutral-400">{e.description.replace(/^Instrument · /, "")}</span>
            <span className="mt-2 block truncate text-[12px] text-neutral-400">{KIND_GROUP[e.slug]}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

/** Every piece with one tag, across groups. A near miss ("agents" for "agent") redirects; a true miss lists the biggest tags. */
function TagPage({ tag }: { tag: string }) {
  const known = (t: string) => TAG_COUNTS[t] > 0
  const slug = tag.trim().toLowerCase()
  const alias = known(slug) ? slug : [slug.replace(/s$/, ""), slug.replace(/-/g, ""), slug.replace(/\s+/g, "-")].find(known)
  React.useEffect(() => {
    if (alias && alias !== tag) window.location.replace(`#/tag/${alias}`)
  }, [alias, tag])
  const items = alias ? ALL.filter((e) => tagsFor(e.slug).includes(alias)) : []
  const top = Object.entries(TAG_COUNTS).sort((a, b) => b[1] - a[1]).slice(0, 8)
  return (
    <div>
      <div className="text-[13px] text-neutral-400">
        <a href="#/browse" className="hover:text-neutral-700 dark:hover:text-neutral-200">Overview</a> <span className="mx-1">/</span> Tags <span className="mx-1">/</span>{" "}
        <span className="text-neutral-600 dark:text-neutral-300">{tag}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{tag}</h1>
      {items.length > 0 ? (
        <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">{items.length} pieces across {new Set(items.map((e) => KIND_GROUP[e.slug])).size} groups</p>
      ) : (
        <div className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
          <p>No tag called {tag}. Try one of these:</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {top.map(([t, n]) => (
              <a key={t} href={`#/tag/${t}`} className="transition-colors hover:text-neutral-900 dark:hover:text-white">
                {t} <span className="text-neutral-400 tabular-nums">{n}</span>
              </a>
            ))}
          </p>
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((e) => (
          <EntryCard key={e.slug} entry={e} />
        ))}
      </div>
    </div>
  )
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Nothing at <span className="font-mono text-[13px]">#/{slug}</span>. It may have been renamed. <a href="#/browse" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 dark:decoration-neutral-600 dark:hover:text-white">Browse everything</a>
      </p>
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
            "flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
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
  const shown = `npx shadcn@latest add ${SITE}/r/${slugs[0]}.json`.replace("https://", "")
  return (
    <button
      type="button"
      onClick={() => copy(cmd)}
      title="Copy install command"
      className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl px-3 font-mono text-[12px] text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-[color,box-shadow,transform] duration-150 ease-[cubic-bezier(.22,1,.36,1)] hover:text-neutral-900 hover:shadow-[0_0_0_1px_rgb(0_0_0/0.18)] active:scale-[0.99] sm:ml-auto sm:w-auto sm:max-w-[min(100%,560px)] dark:text-neutral-400 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:text-white"
    >
      <span className="truncate">{shown}</span>
      {slugs.length > 1 && <span className="shrink-0 font-sans text-neutral-400">+ backdrop</span>}
      {copied ? <Check className="size-3.5 shrink-0" /> : <Copy className="size-3.5 shrink-0" />}
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
          <span className="flex items-center gap-1 text-[12px] text-neutral-400">
            <ArrowLeft className="size-3" /> Previous
          </span>
          <span className="text-[14px] font-medium">{prev.name}</span>
        </a>
      ) : (
        <span />
      )}
      {next && (
        <a href={`#/${next.slug}`} className="group rounded-xl px-4 py-3 text-right shadow-[0_0_0_1px_rgb(0_0_0/0.06)] transition-colors hover:bg-black/[0.02] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)] dark:hover:bg-white/[0.03]">
          <span className="flex items-center justify-end gap-1 text-[12px] text-neutral-400">
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
          <div className="demo-stage relative flex min-h-[320px] justify-center overflow-hidden rounded-2xl px-4 py-10 sm:min-h-[380px] sm:px-10">
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
  orbs: "Orbs",
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
      <span className="px-0.5 text-[12px] font-medium text-neutral-400">{label}</span>
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
        <span className="px-0.5 text-[12px] font-medium text-neutral-400">Accent</span>
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

  const Draft = slug.startsWith("draft/") ? DRAFT_PAGES[slug.slice("draft/".length)] : undefined
  if (Draft)
    return (
      <>
        {palette}
        <React.Suspense fallback={null}>
          <Draft groups={GROUPS} dark={dark} toggleDark={toggleDark} style={style} setStyle={(id) => setStyle(id as StyleId)} styles={STYLE_OPTIONS} />
        </React.Suspense>
      </>
    )

  if (slug === "") return <>{palette}<Landing groups={GROUPS} dark={dark} toggleDark={toggleDark} style={style} setStyle={(id) => setStyle(id as StyleId)} styles={STYLE_OPTIONS} /></>

  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus() }} className="sr-only z-50 rounded-lg bg-white px-3 py-2 text-[13px] text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0/0.1)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="gallery-side sticky top-0 hidden h-dvh w-[264px] shrink-0 border-r border-black/[0.06] bg-neutral-50/80 md:block dark:border-white/[0.06] dark:bg-white/[0.015]">
        <Sidebar slug={slug} dark={dark} toggleDark={toggleDark} style={style} setStyle={setStyle} onSearch={() => setPaletteOpen(true)} />
      </aside>

      {/* Mobile bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/80 px-4 py-2.5 backdrop-blur md:hidden dark:border-white/10 dark:bg-neutral-950/80">
        <a href="#/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo /> Pane
        </a>
        <div className="flex items-center">
          <IconButton label="Search" onClick={() => setPaletteOpen(true)} className="size-10">
            <Search className="size-4" />
          </IconButton>
          <IconButton label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)} className="size-10">
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </IconButton>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/20" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl dark:bg-neutral-950">
            <Sidebar slug={slug} dark={dark} toggleDark={toggleDark} style={style} setStyle={setStyle} onPick={() => setMenuOpen(false)} onSearch={() => { setMenuOpen(false); setPaletteOpen(true) }} />
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="min-w-0 outline-none flex-1 px-4 py-8 sm:px-8 md:px-12 md:py-12">
        {palette}
        <div className={cn("mx-auto", isStudioSlug(slug) ? "max-w-none" : "max-w-5xl")}>{isStudioSlug(slug) ? <React.Suspense fallback={<div className="text-sm text-neutral-400">Loading…</div>}><StudioApp /></React.Suspense> : slug === "mcp" ? <React.Suspense fallback={<div className="text-sm text-neutral-400">Loading…</div>}><McpPage /></React.Suspense> : slug === "agent-operable" ? <React.Suspense fallback={<div className="text-sm text-neutral-400">Loading…</div>}><AgentPage /></React.Suspense> : slug === "skills" || slug.startsWith("skills/") ? <SkillsPage initialId={slug.startsWith("skills/") ? decodeURIComponent(slug.slice(7)) : undefined} /> : slug.startsWith("tag/") ? <TagPage tag={decodeURIComponent(slug.slice(4))} /> : entry?.demo ? entry.kind === "ui" || entry.kind === "blocks" ? <ComponentPage key={entry.slug} entry={entry} /> : <StudioPage key={entry.slug} entry={entry} /> : slug && slug !== "browse" && !slug.startsWith("browse/") ? <NotFound slug={slug} /> : <Home group={slug.startsWith("browse/") ? decodeURIComponent(slug.slice(7)) : undefined} />}</div>
      </main>
    </div>
  )
}

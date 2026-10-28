"use client"

import * as React from "react"
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Building2,
  ChevronDown,
  Code2,
  FileText,
  FlaskConical,
  Headset,
  Heart,
  Menu,
  Newspaper,
  Package,
  Rocket,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type MegaMenuLink = {
  label: string
  /** One short line under the label. */
  description?: string
  icon?: React.ReactNode
  href?: string
  /** Small pill next to the label, e.g. "New". */
  badge?: string
}

export type MegaMenuGroup = { title?: string; links: MegaMenuLink[] }

export type MegaMenuFeature = {
  title: string
  description?: string
  /** Call to action with an arrow, e.g. "Read the announcement". */
  cta?: string
  href?: string
  /** Replaces the built-in placeholder art. */
  media?: React.ReactNode
}

export type MegaMenuItem = {
  value: string
  label: string
  /** A plain link when the item has no groups or feature. */
  href?: string
  groups?: MegaMenuGroup[]
  feature?: MegaMenuFeature
  /** A muted band along the bottom edge of the menu that grows and shrinks with the panel. */
  footer?: React.ReactNode
}

export type MegaMenuAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: "primary" | "quiet"
}

export type MegaMenuDestination = { label: string; href?: string; section?: string }

export type MegaMenuMorphProps = {
  /** Sections of the header, in order. An item with groups or a feature opens a menu; an item without is a plain link. */
  items?: MegaMenuItem[]
  /** Mark and name at the start of the header. */
  brand?: { name: string; mark?: React.ReactNode; href?: string }
  /** Actions at the end of the header. When the header folds, primary actions stay in the bar and quiet ones move into the sheet. */
  actions?: MegaMenuAction[]
  /** The open menu, controlled. `null` keeps every menu closed. */
  value?: string | null
  /** The menu open on first render when uncontrolled. */
  defaultValue?: string | null
  /** Called with the menu that should open, or null when menus close. */
  onValueChange?: (value: string | null) => void
  /** Value of the section that holds the current page. Its trigger gets a short accent mark and plain links get aria-current="page". */
  current?: string
  /** How long in ms the pointer rests on a trigger before the first menu opens. Default 90. */
  openDelay?: number
  /** Grace period in ms after the pointer leaves the header and menu before the menu closes. Default 240. */
  closeDelay?: number
  /** Header width in px below which the sections fold into the accordion sheet. `auto` measures the full row and folds exactly when it stops fitting. */
  collapseBelow?: number | "auto"
  /** Draw the safe triangle from the pointer to the top corners of the open menu. A development aid for tuning hover. */
  showSafeArea?: boolean
  /** Called with every destination. When set, default link navigation is prevented so you can route yourself. */
  onNavigate?: (destination: MegaMenuDestination) => void
  /** Accessible name of the navigation landmark. */
  label?: string
  className?: string
  /** Set `--mm-bar-h` to change the bar height and `--mm-sheet-max` to cap the folded sheet. */
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                Sample content                              */
/* -------------------------------------------------------------------------- */

function Status({ children, detail }: { children: React.ReactNode; detail?: string }) {
  return (
    <span className="mgm-status">
      <i className="mgm-dot" aria-hidden="true" />
      <span>{children}</span>
      {detail ? <em>{detail}</em> : null}
    </span>
  )
}

export const megaMenuSampleItems: MegaMenuItem[] = [
  {
    value: "products",
    label: "Products",
    groups: [
      {
        title: "Build",
        links: [
          { label: "Agents", description: "Orchestrate multi-step tool use", icon: <Bot /> },
          { label: "Memory", description: "Long-term context for every user", icon: <Brain /> },
          { label: "Prompts", description: "Version and test instructions", icon: <FileText /> },
        ],
      },
      {
        title: "Operate",
        links: [
          { label: "Evals", description: "Score every change before it ships", icon: <FlaskConical />, badge: "New" },
          { label: "Observability", description: "Traces, cost and latency", icon: <Activity /> },
          { label: "Guardrails", description: "Policy checks on every call", icon: <ShieldCheck /> },
        ],
      },
    ],
    feature: { title: "Replay any agent run", description: "Step through tool calls, retries and decisions, then fork from any point.", cta: "See how replay works" },
  },
  {
    value: "solutions",
    label: "Solutions",
    groups: [
      { title: "By team", links: [{ label: "Support", icon: <Headset /> }, { label: "Engineering", icon: <Code2 /> }, { label: "Revenue", icon: <TrendingUp /> }] },
      { title: "By stage", links: [{ label: "Startups", icon: <Rocket /> }, { label: "Scale-ups", icon: <Zap /> }, { label: "Enterprise", icon: <Building2 /> }] },
    ],
  },
  {
    value: "developers",
    label: "Developers",
    groups: [
      {
        title: "Documentation",
        links: [
          { label: "Quickstart", description: "Run your first agent in 10 minutes", icon: <Zap /> },
          { label: "API reference", description: "Every endpoint, with live examples", icon: <BookOpen /> },
        ],
      },
      {
        title: "Tools",
        links: [
          { label: "CLI", description: "Run and debug agents locally", icon: <Terminal /> },
          { label: "SDKs", description: "TypeScript, Python and Go", icon: <Package /> },
        ],
      },
    ],
    footer: <Status detail="p95 latency 212 ms this week">All systems normal</Status>,
  },
  {
    value: "company",
    label: "Company",
    groups: [
      {
        links: [
          { label: "About", icon: <Heart /> },
          { label: "Customers", icon: <Users /> },
          { label: "Careers", icon: <Briefcase />, badge: "9 open roles" },
          { label: "Press", icon: <Newspaper /> },
        ],
      },
    ],
    footer: <span>Offices in Berlin, Austin and Singapore</span>,
  },
  { value: "pricing", label: "Pricing" },
]

const SAMPLE_BRAND = {
  name: "Lumen",
  mark: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="2" width="16" height="16" rx="5" fill="currentColor" />
      <path d="M10 5.8v2.6M10 11.6v2.6M5.8 10h2.6M11.6 10h2.6" stroke="var(--mgm-surface)" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
}

const SAMPLE_ACTIONS: MegaMenuAction[] = [
  { label: "Sign in", variant: "quiet" },
  { label: "Start building", variant: "primary" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.mgm {
  --mgm-ink: oklch(.15 0 0);
  --mgm-surface: oklch(1 0 0);
  --mgm-accent: #0060e2;
  --mgm-t2: oklch(.46 0 0);
  --mgm-t3: oklch(.59 0 0);
  --mgm-line: oklch(.935 0 0);
  --mgm-fill: oklch(.978 0 0);
  --mgm-fill2: oklch(.965 0 0);
  --mgm-hover: color-mix(in oklab, var(--mgm-ink) 5%, transparent);
  --mgm-mark: oklch(.33 0 0);
  --mgm-ok: oklch(.62 .17 150);
  --mgm-panel-shadow: 0 1px 2px 0 oklch(0 0 0 / .04), 0 18px 44px 0 oklch(0 0 0 / .1), 0 4px 12px 0 oklch(0 0 0 / .04);
  --mgm-ease: cubic-bezier(.22, 1, .36, 1);
  --mm-bar-h: 60px;
  position: relative;
  z-index: 30;
  display: block;
  width: 100%;
  container-type: inline-size;
  color: var(--mgm-ink);
  font-family: var(--mgm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  text-align: start;
}
:is(.dark, [data-theme="dark"]) .mgm {
  --mgm-ink: oklch(.96 0 0);
  --mgm-surface: oklch(.215 0 0);
  --mgm-accent: #4d8dff;
  --mgm-t2: oklch(.74 0 0);
  --mgm-t3: oklch(.58 0 0);
  --mgm-line: oklch(1 0 0 / .1);
  --mgm-fill: oklch(1 0 0 / .06);
  --mgm-fill2: oklch(1 0 0 / .09);
  --mgm-hover: color-mix(in oklab, var(--mgm-ink) 8%, transparent);
  --mgm-mark: oklch(.9 0 0);
  --mgm-ok: oklch(.74 .16 150);
  --mgm-panel-shadow: 0 0 0 .5px oklch(1 0 0 / .1), 0 18px 44px 0 oklch(0 0 0 / .55), 0 4px 12px 0 oklch(0 0 0 / .35);
}
.mgm *, .mgm *::before, .mgm *::after { box-sizing: border-box }
:where(.mgm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.mgm) a { color: inherit; text-decoration: none }
:where(.mgm) ul { list-style: none; margin: 0; padding: 0 }
.mgm :focus { outline: none }
.mgm :focus-visible { outline: 2px solid color-mix(in oklab, var(--mgm-accent) 60%, transparent); outline-offset: 1px }
.mgm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Bar */
.mgm-bar { position: relative; display: flex; align-items: center; gap: 12px; height: var(--mm-bar-h); padding: 0 12px 0 16px; background: var(--mgm-surface); border-bottom: 1px solid var(--mgm-line); white-space: nowrap }
.mgm-measure { position: absolute; left: 0; top: 0; width: max-content; visibility: hidden; pointer-events: none; overflow: hidden; height: 0; border: 0 }
.mgm-brand { display: flex; align-items: center; gap: 8px; margin-right: 8px; padding: 6px 4px; border-radius: 12px; font-size: 16px; font-weight: 500; line-height: 22.4px; transition: background-color .16s var(--mgm-ease) }
.mgm-brand:hover { background: var(--mgm-hover) }
.mgm-brand-mark { display: grid; place-items: center; width: 22px; height: 22px; color: var(--mgm-ink) }
.mgm-brand-mark svg { width: 22px; height: 22px; display: block }
.mgm-track { position: relative; flex: 1; min-width: 0 }
.mgm-items { display: flex; gap: 2px }
.mgm-item {
  position: relative; display: flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px; border-radius: 9999px; color: var(--mgm-t2); font-weight: 400;
  transition: color .16s var(--mgm-ease);
}
.mgm-item[data-menu] { padding-right: 9px }
.mgm-item[data-hot], .mgm-item[aria-expanded="true"], .mgm-item:focus-visible { color: var(--mgm-ink) }
.mgm-item[data-current]::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 12px; height: 2px; margin-left: -6px; border-radius: 1px; background: var(--mgm-mark) }
.mgm-chev { display: block; width: 14px; height: 14px; stroke-width: 2; transition: transform .3s var(--mgm-ease) }
.mgm-item[aria-expanded="true"] .mgm-chev { transform: rotate(180deg) }
.mgm-highlight { position: absolute; left: 0; top: 0; height: 36px; width: 0; border-radius: 9999px; background: var(--mgm-hover); opacity: 0; pointer-events: none; transition: opacity .16s var(--mgm-ease); will-change: transform, width }
.mgm-highlight[data-on] { opacity: 1 }
.mgm-actions { display: flex; align-items: center; gap: 4px; margin-left: auto }
.mgm-act { display: flex; align-items: center; height: 36px; padding: 0 14px; border-radius: 9999px; font-weight: 500; transition: background-color .16s var(--mgm-ease), color .16s var(--mgm-ease), transform .16s var(--mgm-ease) }
.mgm-act[data-variant="quiet"] { color: var(--mgm-t2) }
.mgm-act[data-variant="quiet"]:hover { background: var(--mgm-hover); color: var(--mgm-ink) }
.mgm-act[data-variant="primary"] { background: var(--mgm-ink); color: var(--mgm-surface) }
.mgm-act[data-variant="primary"]:hover { background: color-mix(in oklab, var(--mgm-ink) 86%, var(--mgm-surface)) }
.mgm-act:active { transform: scale(.97) }
.mgm-toggle { position: relative; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--mgm-fill2); transition: background-color .16s var(--mgm-ease) }
.mgm-toggle:hover { background: color-mix(in oklab, var(--mgm-ink) 9%, transparent) }
.mgm-toggle svg { grid-area: 1 / 1; width: 20px; height: 20px; stroke-width: 2; transition: opacity .2s var(--mgm-ease), transform .3s var(--mgm-ease), filter .2s var(--mgm-ease) }
.mgm-toggle[aria-expanded="false"] .mgm-x, .mgm-toggle[aria-expanded="true"] .mgm-burger { opacity: 0; transform: rotate(-45deg) scale(.6); filter: blur(2px) }

/* Panel: one surface that serves every menu. JS springs its width, height and position. */
.mgm-panel { position: absolute; left: 0; top: calc(var(--mm-bar-h) + 10px); width: 0; height: 0; transition: opacity .18s var(--mgm-ease), translate .22s var(--mgm-ease), scale .22s var(--mgm-ease); transform-origin: var(--mgm-ox, 50%) 0 }
.mgm-panel::before { content: ""; position: absolute; left: 0; right: 0; top: -14px; height: 14px }
.mgm-panel[data-fresh] { animation: mgm-drop .26s var(--mgm-ease) backwards }
.mgm-panel[data-closing] { opacity: 0; translate: 0 -6px; scale: .985; pointer-events: none }
@keyframes mgm-drop { from { opacity: 0; translate: 0 -6px; scale: .96 } }
.mgm-surface { position: absolute; inset: 0; overflow: hidden; border-radius: 26px; background: var(--mgm-surface); box-shadow: var(--mgm-panel-shadow) }
.mgm-band { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: var(--mgm-fill); box-shadow: inset 0 1px 0 0 var(--mgm-fill2) }
.mgm-caret { position: absolute; left: 0; top: -6px; width: 12px; height: 12px; border-radius: 3px; background: var(--mgm-surface); transform: translateX(0) rotate(45deg); box-shadow: -1px -1px 2px 0 oklch(0 0 0 / .05) }
.mgm-clip { position: absolute; inset: 0; overflow: hidden; border-radius: 26px }
.mgm-face { position: absolute; left: 0; top: 0 }
.mgm-face[data-state="enter"] { animation: mgm-in .3s var(--mgm-ease) backwards }
.mgm-face[data-state="leave"] { animation: mgm-out .22s var(--mgm-ease) forwards; pointer-events: none }
@keyframes mgm-in { from { opacity: 0; filter: blur(2px); transform: translateX(calc(var(--dir) * 36px)) } }
@keyframes mgm-out { to { opacity: 0; filter: blur(2px); transform: translateX(calc(var(--dir) * -36px)) } }
.mgm-body { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; width: max-content; max-width: calc(100cqw - 16px); padding: 12px }
.mgm-group { flex: 1 1 232px; min-width: 0; display: grid; align-content: start }
.mgm-group-title { margin: 0; padding: 6px 12px 4px; font-size: 12px; line-height: 16.8px; color: var(--mgm-t3) }
.mgm-links { display: grid; gap: 1px }
.mgm-link { display: flex; align-items: flex-start; gap: 12px; padding: 9px 12px; border-radius: 16px; transition: background-color .16s var(--mgm-ease) }
.mgm-link:hover, .mgm-link:focus-visible, .mgm-feature:hover, .mgm-feature:focus-visible { background: var(--mgm-hover) }
.mgm-link-icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; margin-top: 0; color: var(--mgm-t3); transition: color .16s var(--mgm-ease) }
.mgm-link-icon svg { width: 18px; height: 18px; stroke-width: 1.6 }
.mgm-link:hover .mgm-link-icon, .mgm-link:focus-visible .mgm-link-icon { color: var(--mgm-ink) }
.mgm-link-text { display: grid; gap: 1px; min-width: 0 }
.mgm-link-label { display: flex; align-items: center; gap: 8px; font-weight: 500; line-height: 19.6px }
.mgm-link-desc { font-size: 12px; line-height: 16.8px; color: var(--mgm-t3) }
.mgm-badge { padding: 0 7px; border-radius: 9999px; font-size: 11px; font-weight: 400; line-height: 17px; color: var(--mgm-t2); background: var(--mgm-fill2); white-space: nowrap }
.mgm-feature { flex: 0 0 216px; display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: 18px; background: var(--mgm-fill); transition: background-color .16s var(--mgm-ease) }
.mgm-feature-art { display: grid; gap: 5px; height: 86px; margin-bottom: 10px; padding: 10px; border-radius: 12px; background: var(--mgm-surface); border: 1px solid var(--mgm-fill2); overflow: hidden }
.mgm-feature-art > span { display: block; height: 18px; border-radius: 6px; background: var(--mgm-fill) }
.mgm-feature-art > span:nth-child(2) { width: 82% }
.mgm-feature-art > span:nth-child(3) { width: 64% }
.mgm-feature-title { font-weight: 500; line-height: 19.6px }
.mgm-feature-desc { font-size: 12px; line-height: 16.8px; color: var(--mgm-t3) }
.mgm-feature-cta { display: flex; align-items: center; gap: 4px; padding-top: 8px; margin-top: auto; font-size: 12px; font-weight: 500; line-height: 16.8px }
.mgm-feature-cta svg { width: 13px; height: 13px; stroke-width: 2; transition: transform .2s var(--mgm-ease) }
.mgm-feature:hover .mgm-feature-cta svg { transform: translateX(2px) }
.mgm-footer { flex: 0 0 calc(100% + 24px); display: flex; align-items: center; height: 44px; margin: 4px -12px -12px; padding: 0 24px; font-size: 12px; line-height: 16.8px; color: var(--mgm-t3) }
.mgm-status { display: inline-flex; align-items: center; gap: 8px }
.mgm-status em { font-style: normal; color: var(--mgm-t3) }
.mgm-status > span { color: var(--mgm-ink); font-weight: 500 }
.mgm-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mgm-ok); box-shadow: 0 0 0 3px color-mix(in oklab, var(--mgm-ok) 22%, transparent) }

/* Safe area overlay */
.mgm-safe { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 2 }
.mgm-safe polygon { fill: color-mix(in oklab, var(--mgm-ink) 6%, transparent); stroke: color-mix(in oklab, var(--mgm-ink) 18%, transparent); stroke-width: 1; transition: fill .15s, stroke .15s }
.mgm-safe[data-holding] polygon { fill: color-mix(in oklab, var(--mgm-accent) 22%, transparent); stroke: var(--mgm-accent) }

/* Folded: an accordion sheet */
.mgm-sheet { position: absolute; left: 0; right: 0; top: var(--mm-bar-h); overflow: hidden; background: var(--mgm-surface); border-radius: 0 0 26px 26px; box-shadow: var(--mgm-panel-shadow); transition: height .5s var(--mgm-ease) }
.mgm-sheet-scroll { max-height: inherit; overflow-y: auto; overscroll-behavior: contain }
.mgm-sheet-list { padding: 8px }
.mgm-sheet-item { animation: mgm-row .4s var(--mgm-ease) backwards; animation-delay: calc(var(--i) * 36ms + 60ms) }
@keyframes mgm-row { from { opacity: 0; transform: translateY(-6px) } }
.mgm-sheet-row { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 48px; padding: 0 12px; border-radius: 14px; font-size: 16px; font-weight: 500; text-align: left; transition: background-color .16s var(--mgm-ease) }
.mgm-sheet-row:hover { background: var(--mgm-hover) }
.mgm-sheet-row[data-current] { color: var(--mgm-ink) }
.mgm-sheet-row svg { width: 16px; height: 16px; stroke-width: 2; color: var(--mgm-t3); transition: transform .3s var(--mgm-ease) }
.mgm-sheet-row[aria-expanded="true"] svg { transform: rotate(180deg) }
.mgm-region { display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden; transition: grid-template-rows .4s var(--mgm-ease), opacity .3s var(--mgm-ease), visibility 0s .4s }
.mgm-region[data-open] { grid-template-rows: 1fr; opacity: 1; visibility: visible; transition-delay: 0s }
.mgm-region-in { min-height: 0; overflow: hidden }
.mgm-region-body { display: grid; gap: 4px; padding: 0 4px 8px }
.mgm-sheet-actions { display: grid; gap: 6px; padding: 8px 0 4px }
.mgm-sheet-actions .mgm-act { height: 44px; justify-content: center }
.mgm-sheet-actions .mgm-act[data-variant="quiet"] { background: var(--mgm-fill2) }

@media (prefers-reduced-motion: reduce) {
  .mgm-panel, .mgm-sheet, .mgm-region, .mgm-highlight { transition-duration: .01s !important }
  .mgm-panel[data-fresh], .mgm-sheet-item { animation: none !important }
  .mgm-face[data-state] { animation: mgm-fade .14s linear backwards !important }
  .mgm-face[data-state="leave"] { animation: mgm-fade-out .14s linear forwards !important }
  @keyframes mgm-fade { from { opacity: 0 } }
  @keyframes mgm-fade-out { to { opacity: 0 } }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Springs                                   */
/* -------------------------------------------------------------------------- */

type Spring = { x: number; v: number; t: number; shrink: boolean }
const mk = (x = 0): Spring => ({ x, v: 0, t: x, shrink: false })
function aim(s: Spring, t: number, snap: boolean) {
  if (snap) {
    s.x = s.t = t
    s.v = 0
    s.shrink = false
    return
  }
  if (t === s.t) return
  s.shrink = t < s.x
  s.t = t
}
/** Retargeting keeps the velocity it has. Shrinking springs stop at the target instead of undershooting. */
function step(s: Spring, k: number, c: number, dt: number, noUndershoot = false): boolean {
  const n = Math.max(1, Math.ceil(dt / (1 / 240)))
  const h = dt / n
  for (let i = 0; i < n; i++) {
    s.v += (-k * (s.x - s.t) - c * s.v) * h
    s.x += s.v * h
    if (noUndershoot && s.shrink && s.x <= s.t) {
      s.x = s.t
      s.v = 0
    }
  }
  const moving = Math.abs(s.x - s.t) > 0.05 || Math.abs(s.v) > 0.5
  if (!moving) {
    s.x = s.t
    s.v = 0
  }
  return moving
}

function inTriangle(px: number, py: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number): boolean {
  const d = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3)
  const d1 = d(px, py, ax, ay, bx, by)
  const d2 = d(px, py, bx, by, cx, cy)
  const d3 = d(px, py, cx, cy, ax, ay)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

const hasMenu = (it: MegaMenuItem) => !!((it.groups && it.groups.length) || it.feature)

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

type View = { shown: string | null; prev: string | null; dir: 1 | -1; key: number; fresh: boolean }

/**
 * A site header whose menus share one floating panel. Moving between sections morphs its size, slides the next menu in
 * from that side and glides the caret under the new trigger, with hover intent, a safe triangle and an accordion sheet
 * on narrow screens.
 */
export function MegaMenuMorph({
  items = megaMenuSampleItems,
  brand = SAMPLE_BRAND,
  actions = SAMPLE_ACTIONS,
  value,
  defaultValue = null,
  onValueChange,
  current,
  openDelay = 90,
  closeDelay = 240,
  collapseBelow = "auto",
  showSafeArea = false,
  onNavigate,
  label = "Main",
  className,
  style,
}: MegaMenuMorphProps) {
  const [inner, setInner] = React.useState<string | null>(defaultValue)
  const open = value !== undefined ? value : inner
  const [hover, setHover] = React.useState<string | null>(null)
  const [focused, setFocused] = React.useState<string | null>(null)
  const [folded, setFolded] = React.useState(false)
  const [sheetMounted, setSheetMounted] = React.useState(false)
  const [sheetOn, setSheetOn] = React.useState(false)
  const [sheetH, setSheetH] = React.useState(0)
  const [section, setSection] = React.useState<string | null>(null)
  const uid = React.useId()
  const menuId = `${uid}-menu`
  const sheetId = `${uid}-sheet`

  const rootRef = React.useRef<HTMLDivElement>(null)
  const measureRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const highlightRef = React.useRef<HTMLSpanElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const bandRef = React.useRef<HTMLDivElement>(null)
  const caretRef = React.useRef<HTMLSpanElement>(null)
  const safeRef = React.useRef<SVGSVGElement>(null)
  const polyRef = React.useRef<SVGPolygonElement>(null)
  const toggleRef = React.useRef<HTMLButtonElement>(null)
  const sheetInnerRef = React.useRef<HTMLDivElement>(null)
  const trigEls = React.useRef(new Map<string, HTMLElement>())
  const bodyEls = React.useRef(new Map<string, HTMLElement>())
  const timers = React.useRef<{ open?: number; close?: number; hold?: number; sheet?: number; view?: number; leave?: number }>({})
  const hovered = React.useRef<string | null>(null)
  const samples = React.useRef<{ x: number; y: number; t: number }[]>([])
  const holding = React.useRef(false)
  const pointerInside = React.useRef(false)
  const lastPointerType = React.useRef("mouse")
  const pendingFocus = React.useRef<string | null>(null)
  const eng = React.useRef<{ retarget: (snap?: boolean) => void } | null>(null)
  const lastFolded = React.useRef(false)
  const viewRef = React.useRef<string | null>(null)
  const hotRef = React.useRef<string | null>(null)

  const setOpen = (next: string | null) => {
    if (next === open) return
    if (value === undefined) setInner(next)
    onValueChange?.(next)
  }
  const L = React.useRef({ open, items, openDelay, closeDelay, setOpen, showSafeArea, folded })
  React.useLayoutEffect(() => {
    L.current = { open, items, openDelay, closeDelay, setOpen, showSafeArea, folded }
  })

  /* Which menu is mounted: the open one, the one leaving, and the last one while the panel fades away. */
  const [view, setView] = React.useState<View>({ shown: open, prev: null, dir: 1, key: 0, fresh: open !== null })
  if (open !== null && open !== view.shown) {
    const a = items.findIndex((i) => i.value === view.shown)
    const b = items.findIndex((i) => i.value === open)
    setView({ shown: open, prev: view.shown, dir: a < 0 || b >= a ? 1 : -1, key: view.key + 1, fresh: view.shown === null })
  }
  const closing = open === null && view.shown !== null
  React.useEffect(() => {
    if (!closing) return
    const id = window.setTimeout(() => setView((v) => (v.shown ? { ...v, shown: null, prev: null } : v)), 260)
    return () => window.clearTimeout(id)
  }, [closing])
  React.useEffect(() => {
    if (view.prev === null) return
    const id = window.setTimeout(() => setView((v) => ({ ...v, prev: null })), 260)
    return () => window.clearTimeout(id)
  }, [view.key, view.prev])

  const shownItem = items.find((i) => i.value === view.shown)
  const prevItem = view.prev ? items.find((i) => i.value === view.prev) : undefined

  /* --------------------------- helpers: close / go --------------------------- */
  const clearTimer = (k: keyof typeof timers.current) => {
    window.clearTimeout(timers.current[k])
    timers.current[k] = undefined
  }
  const closeSheet = React.useCallback(() => {
    setSheetOn(false)
    window.clearTimeout(timers.current.sheet)
    timers.current.sheet = window.setTimeout(() => setSheetMounted(false), 480)
  }, [])
  const go = (e: React.MouseEvent | null, d: MegaMenuDestination) => {
    if (onNavigate) {
      e?.preventDefault()
      onNavigate(d)
    } else if (!d.href) e?.preventDefault()
    clearTimer("open")
    clearTimer("hold")
    setOpen(null)
    closeSheet()
  }

  /* ------------------------------- fold detect ------------------------------- */
  React.useLayoutEffect(() => {
    const root = rootRef.current
    const meas = measureRef.current
    if (!root || !meas) return
    const check = () => {
      const threshold = collapseBelow === "auto" ? meas.offsetWidth : collapseBelow
      const next = root.clientWidth < threshold
      if (next !== lastFolded.current) {
        lastFolded.current = next
        setFolded(next)
        if (next) {
          if (L.current.open !== null) L.current.setOpen(null)
        } else {
          setSheetOn(false)
          setSheetMounted(false)
        }
      }
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(root)
    ro.observe(meas)
    return () => ro.disconnect()
  }, [collapseBelow, items, brand, actions])

  /* ----------------------------- springs engine ------------------------------ */
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const S = { px: mk(), pw: mk(), ph: mk(), caret: mk(), band: mk(), hx: mk(), hw: mk() }
    let raf = 0
    let last = 0
    let hlOn = false
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const write = () => {
      const panel = panelRef.current
      if (panel) {
        panel.style.width = `${S.pw.x}px`
        panel.style.height = `${S.ph.x}px`
        panel.style.transform = `translate3d(${S.px.x}px,0,0)`
        panel.style.setProperty("--mgm-ox", `${S.caret.x - S.px.x}px`)
      }
      if (bandRef.current) bandRef.current.style.height = `${S.band.x}px`
      if (caretRef.current) caretRef.current.style.transform = `translateX(${S.caret.x - S.px.x - 6}px) rotate(45deg)`
      const hl = highlightRef.current
      if (hl) {
        hl.style.width = `${S.hw.x}px`
        hl.style.transform = `translate3d(${S.hx.x}px,0,0)`
      }
    }
    const frame = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      let busy = false
      busy = step(S.px, 380, 30, dt) || busy
      busy = step(S.pw, 420, 34, dt, true) || busy
      busy = step(S.ph, 420, 34, dt, true) || busy
      busy = step(S.band, 420, 34, dt, true) || busy
      busy = step(S.caret, 520, 36, dt) || busy
      busy = step(S.hx, 560, 30, dt) || busy
      busy = step(S.hw, 560, 30, dt) || busy
      write()
      if (busy) raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      if (raf) return
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const retarget = (snapPanel = false) => {
      const c = L.current
      const rr = root.getBoundingClientRect()
      const noMotion = reduced()
      const sv = viewRef.current
      if (sv) {
        const body = bodyEls.current.get(sv)
        const trig = trigEls.current.get(sv)
        if (body && trig) {
          const w = body.offsetWidth
          const h = body.offsetHeight
          const tr = trig.getBoundingClientRect()
          const cx = tr.left + tr.width / 2 - rr.left
          const x = Math.max(8, Math.min(cx - w / 2, root.clientWidth - 8 - w))
          const footer = body.querySelector<HTMLElement>("[data-mm-footer]")
          const snap = snapPanel || noMotion
          aim(S.px, x, snap)
          aim(S.pw, w, snap)
          aim(S.ph, h, snap)
          aim(S.caret, cx, snap)
          aim(S.band, footer ? footer.offsetHeight : 0, snap)
        }
      }
      // highlight
      const hot = hotRef.current
      const ht = hot ? trigEls.current.get(hot) : undefined
      const track = trackRef.current
      const hl = highlightRef.current
      if (ht && track && hl && !c.folded) {
        const tr = ht.getBoundingClientRect()
        const kr = track.getBoundingClientRect()
        const snap = !hlOn || noMotion
        aim(S.hx, tr.left - kr.left, snap)
        aim(S.hw, tr.width, snap)
        if (!hlOn) {
          hlOn = true
          hl.setAttribute("data-on", "")
        }
      } else if (hlOn) {
        hlOn = false
        highlightRef.current?.removeAttribute("data-on")
      }
      write()
      wake()
    }
    eng.current = { retarget }
    const ro = new ResizeObserver(() => retarget())
    ro.observe(root)
    retarget(true)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      raf = 0
      eng.current = null
    }
  }, [])

  /* The engine reads the latest view / hot trigger from refs; every render re-aims it. */
  const hot = hover ?? focused ?? (open !== null ? open : null)
  const mountedPanel = view.shown !== null
  React.useLayoutEffect(() => {
    viewRef.current = view.shown
    hotRef.current = hot
    eng.current?.retarget(false)
  })
  React.useLayoutEffect(() => {
    // The panel just mounted from closed: land in place.
    if (mountedPanel) eng.current?.retarget(true)
  }, [mountedPanel])

  /* Bodies resize when fonts load or the header narrows. */
  const bodyRo = React.useRef<ResizeObserver | null>(null)
  React.useEffect(() => {
    bodyRo.current = new ResizeObserver(() => eng.current?.retarget())
    for (const el of bodyEls.current.values()) bodyRo.current.observe(el)
    return () => bodyRo.current?.disconnect()
  }, [])
  const registerBody = React.useCallback((value: string, el: HTMLElement | null) => {
    const old = bodyEls.current.get(value)
    if (old && old !== el) bodyRo.current?.unobserve(old)
    if (el) {
      bodyEls.current.set(value, el)
      bodyRo.current?.observe(el)
    } else bodyEls.current.delete(value)
  }, [])

  /* ---------------------------- hover intent ---------------------------- */
  const headingIntoPanel = (px: number, py: number): boolean => {
    const pr = panelRef.current?.getBoundingClientRect()
    const s = samples.current
    if (!pr || s.length < 2) return false
    const now = s[s.length - 1].t
    let apex = s[0]
    for (const p of s) {
      if (now - p.t <= 260) {
        apex = p
        break
      }
    }
    if (now - apex.t < 40 || py <= apex.y + 1) return false
    return inTriangle(px, py, apex.x, apex.y, pr.left, pr.top, pr.right, pr.top)
  }
  const drawSafe = (px: number, py: number) => {
    const poly = polyRef.current
    const panel = panelRef.current
    const root = rootRef.current
    if (!poly || !panel || !root || !L.current.showSafeArea || L.current.open === null) {
      polyRef.current?.setAttribute("points", "")
      return
    }
    const rr = root.getBoundingClientRect()
    const pr = panel.getBoundingClientRect()
    poly.setAttribute("points", `${px - rr.left},${py - rr.top} ${pr.left - rr.left},${pr.top - rr.top} ${pr.right - rr.left},${pr.top - rr.top}`)
  }
  const setHolding = (on: boolean) => {
    holding.current = on
    if (on) safeRef.current?.setAttribute("data-holding", "")
    else safeRef.current?.removeAttribute("data-holding")
  }

  const onTriggerEnter = (item: MegaMenuItem, e: React.PointerEvent) => {
    if (e.pointerType === "touch" || L.current.folded) return
    clearTimer("close")
    hovered.current = item.value
    setHover(item.value)
    const target = hasMenu(item) ? item.value : null
    const c = L.current
    clearTimer("open")
    clearTimer("hold")
    setHolding(false)
    if (c.open === target) return
    if (c.open === null) {
      if (target) timers.current.open = window.setTimeout(() => c.setOpen(target), c.openDelay)
      return
    }
    if (headingIntoPanel(e.clientX, e.clientY)) {
      setHolding(true)
      timers.current.hold = window.setTimeout(() => {
        setHolding(false)
        if (hovered.current === item.value) L.current.setOpen(target)
      }, 170)
      return
    }
    c.setOpen(target)
  }
  const onTriggerLeave = (item: MegaMenuItem, e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    if (hovered.current === item.value) hovered.current = null
    setHover((h) => (h === item.value ? null : h))
    clearTimer("open")
  }
  const onRootEnter = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    pointerInside.current = true
    clearTimer("close")
  }
  const onRootLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    pointerInside.current = false
    hovered.current = null
    setHover(null)
    clearTimer("open")
    clearTimer("hold")
    setHolding(false)
    polyRef.current?.setAttribute("points", "")
    if (L.current.open !== null) {
      clearTimer("close")
      timers.current.close = window.setTimeout(() => L.current.setOpen(null), L.current.closeDelay)
    }
  }
  const onRootMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return
    const s = samples.current
    s.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
    if (s.length > 10) s.shift()
    if (L.current.showSafeArea) drawSafe(e.clientX, e.clientY)
  }

  /* Outside press closes the menu and the sheet from anywhere. */
  React.useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const root = rootRef.current
      if (!root || root.contains(e.target as Node)) return
      if (L.current.open !== null) L.current.setOpen(null)
      setSheetOn(false)
      window.clearTimeout(timers.current.sheet)
      timers.current.sheet = window.setTimeout(() => setSheetMounted(false), 480)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [])
  React.useEffect(() => {
    const t = timers.current
    return () => {
      for (const k of Object.keys(t) as (keyof typeof t)[]) window.clearTimeout(t[k])
    }
  }, [])

  /* ------------------------------ focus handling ----------------------------- */
  const order = React.useMemo(() => items.map((i) => i.value), [items])
  const focusTrigger = (value: string) => trigEls.current.get(value)?.focus({ preventScroll: true })
  const panelLinks = (): HTMLElement[] => Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[data-mm-active] [data-mm-link]") ?? [])

  React.useLayoutEffect(() => {
    const pf = pendingFocus.current
    if (!pf || view.shown !== pf) return
    pendingFocus.current = null
    panelLinks()[0]?.focus({ preventScroll: true })
  })

  const onTriggerKey = (item: MegaMenuItem, e: React.KeyboardEvent) => {
    const i = order.indexOf(item.value)
    const move = (to: number) => {
      const next = items[(to + items.length) % items.length]
      e.preventDefault()
      focusTrigger(next.value)
      if (L.current.open !== null) setOpen(hasMenu(next) ? next.value : null)
    }
    switch (e.key) {
      case "ArrowRight": move(Math.min(i + 1, items.length - 1)); break
      case "ArrowLeft": move(Math.max(i - 1, 0)); break
      case "Home": move(0); break
      case "End": move(items.length - 1); break
      case "ArrowDown":
        if (hasMenu(item)) {
          e.preventDefault()
          pendingFocus.current = item.value
          if (open === item.value) {
            panelLinks()[0]?.focus({ preventScroll: true })
            pendingFocus.current = null
          } else setOpen(item.value)
        }
        break
      case "Escape":
        if (open !== null) {
          e.preventDefault()
          setOpen(null)
        }
        break
      case "Tab":
        if (!e.shiftKey && open === item.value && panelLinks().length) {
          e.preventDefault()
          panelLinks()[0].focus({ preventScroll: true })
        }
        break
      default: break
    }
  }
  const onPanelKey = (e: React.KeyboardEvent) => {
    const links = panelLinks()
    const idx = links.indexOf(document.activeElement as HTMLElement)
    const cur = view.shown
    if (!cur) return
    const menuItems = items.filter(hasMenu)
    const mi = menuItems.findIndex((m) => m.value === cur)
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        links[Math.min(idx + 1, links.length - 1)]?.focus({ preventScroll: true })
        break
      case "ArrowUp":
        e.preventDefault()
        if (idx <= 0) focusTrigger(cur)
        else links[idx - 1]?.focus({ preventScroll: true })
        break
      case "ArrowRight":
      case "ArrowLeft": {
        const next = menuItems[(mi + (e.key === "ArrowRight" ? 1 : -1) + menuItems.length) % menuItems.length]
        if (next && next.value !== cur) {
          e.preventDefault()
          pendingFocus.current = next.value
          setOpen(next.value)
        }
        break
      }
      case "Escape":
        e.preventDefault()
        e.stopPropagation()
        setOpen(null)
        focusTrigger(cur)
        break
      case "Tab":
        if (e.shiftKey && idx <= 0) {
          e.preventDefault()
          focusTrigger(cur)
        } else if (!e.shiftKey && idx === links.length - 1) {
          e.preventDefault()
          const nxt = items[order.indexOf(cur) + 1]
          setOpen(null)
          if (nxt) focusTrigger(nxt.value)
          else (rootRef.current?.querySelector(".mgm-actions a, .mgm-actions button") as HTMLElement | null)?.focus()
        }
        break
      default: break
    }
  }
  const onRootBlur = (e: React.FocusEvent) => {
    setFocused(null)
    const next = e.relatedTarget as Node | null
    if (next && rootRef.current?.contains(next)) return
    if (!next && pointerInside.current) return
    if (L.current.open !== null) L.current.setOpen(null)
  }
  const onRootKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && sheetMounted) {
      e.preventDefault()
      closeSheet()
      toggleRef.current?.focus({ preventScroll: true })
    }
  }

  /* ------------------------------ folded sheet ------------------------------- */
  const toggleSheet = () => {
    if (sheetOn) {
      closeSheet()
      return
    }
    window.clearTimeout(timers.current.sheet)
    setSheetMounted(true)
    setSection(null)
    timers.current.sheet = window.setTimeout(() => setSheetOn(true), 30)
  }
  React.useLayoutEffect(() => {
    const el = sheetInnerRef.current
    if (!el || !sheetMounted) return
    const ro = new ResizeObserver(() => setSheetH(el.offsetHeight))
    ro.observe(el)
    setSheetH(el.offsetHeight)
    return () => ro.disconnect()
  }, [sheetMounted])

  /* -------------------------------- render -------------------------------- */
  const primaries = actions.filter((a) => a.variant === "primary")
  const quiets = actions.filter((a) => a.variant !== "primary")
  const renderAction = (a: MegaMenuAction, key: string) => {
    const variant = a.variant === "primary" ? "primary" : "quiet"
    const click = (e: React.MouseEvent) => {
      a.onClick?.()
      go(e, { label: a.label, href: a.href })
    }
    return (
      <a key={key} className="mgm-act" data-variant={variant} href={a.href ?? "#"} onClick={click}>
        {a.label}
      </a>
    )
  }
  const renderBrand = () => (
    <a className="mgm-brand" href={brand.href ?? "#"} onClick={(e) => go(e, { label: brand.name, href: brand.href })}>
      <span className="mgm-brand-mark" aria-hidden="true">{brand.mark ?? SAMPLE_BRAND.mark}</span>
      <span>{brand.name}</span>
    </a>
  )

  const renderFace = (it: MegaMenuItem, state: "enter" | "leave" | "idle", active: boolean) => (
    <div
      key={`${it.value}-${state}-${view.key}`}
      className="mgm-face"
      data-state={state === "idle" || (state === "enter" && view.fresh) ? undefined : state}
      data-mm-active={active ? "" : undefined}
      aria-hidden={state === "leave" ? true : undefined}
      style={{ "--dir": view.dir } as React.CSSProperties}
    >
      <div className="mgm-body" ref={active ? (el) => registerBody(it.value, el) : undefined}>
        {it.groups?.map((g, gi) => (
          <div className="mgm-group" key={gi}>
            {g.title ? <p className="mgm-group-title">{g.title}</p> : null}
            <ul className="mgm-links">
              {g.links.map((l) => (
                <li key={l.label}>
                  <a className="mgm-link" href={l.href ?? "#"} data-mm-link="" tabIndex={active ? 0 : -1} onClick={(e) => go(e, { label: l.label, href: l.href, section: it.label })}>
                    {l.icon ? <span className="mgm-link-icon" aria-hidden="true">{l.icon}</span> : null}
                    <span className="mgm-link-text">
                      <span className="mgm-link-label">
                        {l.label}
                        {l.badge ? <span className="mgm-badge">{l.badge}</span> : null}
                      </span>
                      {l.description ? <span className="mgm-link-desc">{l.description}</span> : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {it.feature ? (
          <a className="mgm-feature" href={it.feature.href ?? "#"} data-mm-link="" tabIndex={active ? 0 : -1} onClick={(e) => go(e, { label: it.feature!.title, href: it.feature!.href, section: it.label })}>
            {it.feature.media ?? <span className="mgm-feature-art" aria-hidden="true"><span /><span /><span /></span>}
            <span className="mgm-feature-title">{it.feature.title}</span>
            {it.feature.description ? <span className="mgm-feature-desc">{it.feature.description}</span> : null}
            {it.feature.cta ? (
              <span className="mgm-feature-cta">
                {it.feature.cta}
                <ArrowRight aria-hidden />
              </span>
            ) : null}
          </a>
        ) : null}
        {it.footer ? <div className="mgm-footer" data-mm-footer="">{it.footer}</div> : null}
      </div>
    </div>
  )

  const sheetRegions = items.filter(hasMenu)

  return (
    <div
      ref={rootRef}
      className={cn("mgm", className)}
      style={style}
      data-open={open !== null ? "" : undefined}
      onPointerEnter={onRootEnter}
      onPointerLeave={onRootLeave}
      onPointerMove={onRootMove}
      onBlur={onRootBlur}
      onKeyDown={onRootKey}
    >
      <style href="mgm" precedence="default">{CSS}</style>

      <nav className="mgm-bar" aria-label={label} data-folded={folded ? "" : undefined}>
        {renderBrand()}
        {folded ? (
          <>
            <div className="mgm-actions">
              {primaries.map((a, i) => renderAction(a, `p${i}`))}
              <button
                ref={toggleRef}
                type="button"
                className="mgm-toggle"
                aria-expanded={sheetOn}
                aria-controls={sheetId}
                aria-label={sheetOn ? "Close menu" : "Open menu"}
                onClick={toggleSheet}
              >
                <Menu className="mgm-burger" aria-hidden />
                <X className="mgm-x" aria-hidden />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mgm-track" ref={trackRef}>
              <span ref={highlightRef} className="mgm-highlight" aria-hidden="true" />
              <ul className="mgm-items">
                {items.map((it) => {
                  const menu = hasMenu(it)
                  const isCurrent = current === it.value
                  const common = {
                    ref: (el: HTMLElement | null) => {
                      if (el) trigEls.current.set(it.value, el)
                      else trigEls.current.delete(it.value)
                    },
                    className: "mgm-item",
                    "data-hot": hot === it.value ? "" : undefined,
                    "data-current": isCurrent ? "" : undefined,
                    onPointerEnter: (e: React.PointerEvent) => onTriggerEnter(it, e),
                    onPointerLeave: (e: React.PointerEvent) => onTriggerLeave(it, e),
                    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      if (e.currentTarget.matches(":focus-visible")) setFocused(it.value)
    },
                    onKeyDown: (e: React.KeyboardEvent) => onTriggerKey(it, e),
                  }
                  return (
                    <li key={it.value}>
                      {menu ? (
                        <button
                          {...common}
                          type="button"
                          data-menu=""
                          aria-expanded={open === it.value}
                          aria-controls={open === it.value ? menuId : undefined}
                          onPointerDown={(e) => { lastPointerType.current = e.pointerType }}
                          onClick={(e) => {
                            const keyboard = e.detail === 0
                            if (keyboard || lastPointerType.current === "touch") setOpen(open === it.value ? null : it.value)
                            else {
                              clearTimer("open")
                              setOpen(it.value)
                            }
                          }}
                        >
                          {it.label}
                          <ChevronDown className="mgm-chev" aria-hidden />
                        </button>
                      ) : (
                        <a {...common} href={it.href ?? "#"} aria-current={isCurrent ? "page" : undefined} onClick={(e) => go(e, { label: it.label, href: it.href })}>
                          {it.label}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="mgm-actions">{actions.map((a, i) => renderAction(a, `a${i}`))}</div>
          </>
        )}
      </nav>

      {/* The measuring copy of the full row: invisible and inert, so the header folds exactly when it stops fitting. */}
      <div ref={measureRef} className="mgm-bar mgm-measure" aria-hidden="true" inert>
        <span className="mgm-brand">
          <span className="mgm-brand-mark">{brand.mark ?? SAMPLE_BRAND.mark}</span>
          <span>{brand.name}</span>
        </span>
        <ul className="mgm-items">
          {items.map((it) => (
            <li key={it.value}>
              <span className="mgm-item" data-menu={hasMenu(it) ? "" : undefined}>
                {it.label}
                {hasMenu(it) ? <ChevronDown className="mgm-chev" /> : null}
              </span>
            </li>
          ))}
        </ul>
        <div className="mgm-actions">
          {actions.map((a, i) => <span key={i} className="mgm-act" data-variant={a.variant === "primary" ? "primary" : "quiet"}>{a.label}</span>)}
        </div>
      </div>

      {!folded && mountedPanel && shownItem ? (
        <div
          ref={panelRef}
          id={menuId}
          className="mgm-panel"
          data-fresh={view.fresh ? "" : undefined}
          data-closing={closing ? "" : undefined}
          onPointerEnter={() => {
            clearTimer("hold")
            setHolding(false)
          }}
          onKeyDown={onPanelKey}
        >
          <div className="mgm-surface" aria-hidden="true">
            <div ref={bandRef} className="mgm-band" />
          </div>
          <span ref={caretRef} className="mgm-caret" aria-hidden="true" />
          <div className="mgm-clip">
            {prevItem ? renderFace(prevItem, "leave", false) : null}
            {renderFace(shownItem, "enter", true)}
          </div>
        </div>
      ) : null}

      {showSafeArea && !folded ? (
        <svg ref={safeRef} className="mgm-safe" aria-hidden="true">
          <polygon ref={polyRef} points="" />
        </svg>
      ) : null}

      {folded && sheetMounted ? (
        <div
          id={sheetId}
          className="mgm-sheet"
          style={{ height: sheetOn ? `min(${sheetH}px, var(--mm-sheet-max, 80vh))` : "0px", maxHeight: "var(--mm-sheet-max, 80vh)" }}
        >
          <div className="mgm-sheet-scroll" style={{ maxHeight: "var(--mm-sheet-max, 80vh)" }}>
            <div ref={sheetInnerRef}>
              <ul className="mgm-sheet-list">
                {items.map((it, i) => {
                  const menu = hasMenu(it)
                  const isCurrent = current === it.value
                  return (
                    <li key={it.value} className="mgm-sheet-item" style={{ "--i": i } as React.CSSProperties}>
                      {menu ? (
                        <>
                          <button
                            type="button"
                            id={`${uid}-${it.value}-row`}
                            className="mgm-sheet-row"
                            data-current={isCurrent ? "" : undefined}
                            aria-expanded={section === it.value}
                            aria-controls={`${uid}-${it.value}-region`}
                            onClick={() => setSection(section === it.value ? null : it.value)}
                          >
                            {it.label}
                            <ChevronDown aria-hidden />
                          </button>
                          {sheetRegions.includes(it) ? (
                            <div id={`${uid}-${it.value}-region`} role="region" aria-labelledby={`${uid}-${it.value}-row`} className="mgm-region" data-open={section === it.value ? "" : undefined} inert={section !== it.value}>
                              <div className="mgm-region-in">
                                <div className="mgm-region-body">
                                  {it.groups?.map((g, gi) => (
                                    <div key={gi}>
                                      {g.title ? <p className="mgm-group-title">{g.title}</p> : null}
                                      <ul className="mgm-links">
                                        {g.links.map((l) => (
                                          <li key={l.label}>
                                            <a className="mgm-link" href={l.href ?? "#"} onClick={(e) => go(e, { label: l.label, href: l.href, section: it.label })}>
                                              {l.icon ? <span className="mgm-link-icon" aria-hidden="true">{l.icon}</span> : null}
                                              <span className="mgm-link-text">
                                                <span className="mgm-link-label">{l.label}{l.badge ? <span className="mgm-badge">{l.badge}</span> : null}</span>
                                                {l.description ? <span className="mgm-link-desc">{l.description}</span> : null}
                                              </span>
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                  {it.feature ? (
                                    <a className="mgm-link" href={it.feature.href ?? "#"} onClick={(e) => go(e, { label: it.feature!.title, href: it.feature!.href, section: it.label })}>
                                      <span className="mgm-link-text">
                                        <span className="mgm-link-label">{it.feature.title}</span>
                                        {it.feature.description ? <span className="mgm-link-desc">{it.feature.description}</span> : null}
                                      </span>
                                    </a>
                                  ) : null}
                                  {it.footer ? <div className="mgm-footer" style={{ margin: "4px 0 0", padding: "0 12px", height: 36 }}>{it.footer}</div> : null}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <a className="mgm-sheet-row" data-current={isCurrent ? "" : undefined} href={it.href ?? "#"} aria-current={isCurrent ? "page" : undefined} onClick={(e) => go(e, { label: it.label, href: it.href })}>
                          {it.label}
                        </a>
                      )}
                    </li>
                  )
                })}
                {quiets.length ? (
                  <li className="mgm-sheet-item mgm-sheet-actions" style={{ "--i": items.length } as React.CSSProperties}>
                    {quiets.map((a, i) => renderAction(a, `q${i}`))}
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

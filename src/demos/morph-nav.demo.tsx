import * as React from "react"
import { BarChart3, BookOpen, Bot, Boxes, FileText, GitBranch, LifeBuoy, Plug, ShieldCheck, Sparkles, Workflow, ArrowRight } from "lucide-react"

import { MorphNav, type MorphNavDestination, type MorphNavItem } from "@/components/ui/morph-nav"
import { SegmentedControl } from "@/components/ui/segmented-control"

export const notes = [
  "The bar, every dropdown panel and the search box are faces on one clipped surface. Only the surface's `width` and `height` are transitioned; each face is absolutely positioned inside it at its own target width, so the panel text never reflows while the surface grows around it.",
  "A ResizeObserver inside a small `Measured` wrapper reports each open face's content height. The surface height is `bar + measured panel`, and when the target grows it switches to an overshooting cubic-bezier (a little bounce) and back to a plain ease-out when it shrinks.",
  "Moving between neighbouring sections keeps both panels mounted for 260ms: the old face plays a CSS exit keyframe toward the side you came from while the new one enters from the other side. The highlight pill glides by transitioning `transform` and `width` to the hovered item's offsetLeft / offsetWidth.",
  "Hover opens after a 60ms intent timer and leaving the nav waits 180ms before closing, so crossing the gap never flickers. Touch and keyboard skip hover entirely: panel triggers are real `aria-expanded` buttons with Arrow-key roving, and focus moves into the panel only when you asked for it.",
  "Search is an ARIA combobox: focus stays in the input, `aria-activedescendant` points at the highlighted option, and results are ranked in memory on every keystroke. A ResizeObserver on the root folds the items into one menu below `collapseBelow`.",
]

const Mark = () => (
  <svg viewBox="0 0 26 26" fill="none">
    <rect width="26" height="26" rx="8" fill="currentColor" />
    <path d="M7 18.5V7.5h7.5M7 13h5.5" stroke="var(--mnv-surface, #fff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const FEATURE = (
  <div className="flex flex-col gap-2">
    <div
      className="aspect-[16/10] w-full rounded-xl"
      style={{ background: "radial-gradient(circle at 25% 20%, #ffd9a8, transparent 55%), radial-gradient(circle at 80% 80%, #9fc1ff, transparent 55%), linear-gradient(135deg, #e9e3ff, #d6f0ff)" }}
      aria-hidden="true"
    />
    <div className="px-0.5">
      <div className="text-[14px] font-medium">Agent 2.0 is here</div>
      <div className="text-[12px] leading-[16.8px] opacity-60">Plan, delegate and review in one place.</div>
    </div>
  </div>
)

const ITEMS: MorphNavItem[] = [
  {
    value: "product",
    label: "Product",
    feature: FEATURE,
    links: [
      { label: "Agents", description: "Long-running workers with tools", icon: <Bot />, href: "/agents" },
      { label: "Workflows", description: "Chain steps and approvals", icon: <Workflow />, href: "/workflows" },
      { label: "Evals", description: "Score every change before ship", icon: <BarChart3 />, href: "/evals" },
      { label: "Connectors", description: "Slack, Notion, Postgres and more", icon: <Plug />, href: "/connectors" },
      { label: "Guardrails", description: "Policies, review queues and audit", icon: <ShieldCheck />, href: "/guardrails" },
      { label: "Studio", description: "Prompt and trace workbench", icon: <Boxes />, href: "/studio" },
    ],
    footer: (
      <a href="/changelog" className="inline-flex items-center gap-1.5">
        Scheduled runs are now generally available <ArrowRight size={12} />
      </a>
    ),
  },
  {
    value: "resources",
    label: "Resources",
    columns: 1,
    links: [
      { label: "Documentation", description: "Guides and API reference", icon: <BookOpen />, href: "/docs" },
      { label: "Cookbook", description: "Recipes for real workloads", icon: <FileText />, href: "/cookbook" },
      { label: "Open source", description: "SDKs and example apps", icon: <GitBranch />, href: "/oss" },
      { label: "Support", description: "Talk to a human", icon: <LifeBuoy />, href: "/support" },
    ],
  },
  { value: "pricing", label: "Pricing", href: "/pricing" },
  { value: "customers", label: "Customers", href: "/customers" },
]

const SEARCH = [
  { label: "Agents", description: "Long-running workers with tools", group: "Product", icon: <Bot />, href: "/agents", keywords: "assistant worker" },
  { label: "Workflows", description: "Chain steps and approvals", group: "Product", icon: <Workflow />, href: "/workflows" },
  { label: "Pricing", description: "Free, Team and Enterprise", group: "Company", icon: <Sparkles />, href: "/pricing", keywords: "plans cost" },
  { label: "Documentation", description: "Guides and API reference", group: "Resources", icon: <BookOpen />, href: "/docs", keywords: "docs api" },
  { label: "Changelog", description: "What shipped this week", group: "Resources", icon: <FileText />, href: "/changelog", keywords: "release notes" },
  { label: "Guardrails", description: "Policies and review queues", group: "Product", icon: <ShieldCheck />, href: "/guardrails", keywords: "safety" },
]

export default function Demo() {
  const [compact, setCompact] = React.useState(false)
  const [width, setWidth] = React.useState<"full" | "narrow">("full")
  const [last, setLast] = React.useState("Hover a section, press search, or tab through the bar.")
  const onNavigate = (d: MorphNavDestination) => setLast(`Navigate to ${d.label}${d.section ? ` (${d.section})` : ""}`)
  return (
    <div className="flex w-full max-w-[760px] flex-col items-center gap-6">
      <div
        className="relative w-full rounded-3xl px-3 pt-4"
        style={{ minHeight: 440, background: "color-mix(in oklab, currentColor 3.5%, transparent)" }}
      >
        <div className="mx-auto" style={{ maxWidth: width === "narrow" ? 360 : 740 }}>
          <MorphNav
            items={ITEMS}
            brand={{ name: "Fieldwork", mark: <Mark />, href: "/" }}
            action={{ label: "Start free", href: "/signup" }}
            search={{ placeholder: "Search Fieldwork", items: SEARCH }}
            current="pricing"
            compact={compact}
            onNavigate={onNavigate}
          />
        </div>
      </div>
      <p className="text-[13px] text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {last}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <SegmentedControl
          variant="tray"
          aria-label="Bar size"
          value={compact ? "compact" : "full"}
          onChange={(v) => setCompact(v === "compact")}
          options={[
            { value: "full", label: "Full" },
            { value: "compact", label: "Compact" },
          ]}
        />
        <SegmentedControl
          variant="tray"
          aria-label="Container width"
          value={width}
          onChange={(v) => setWidth(v as "full" | "narrow")}
          options={[
            { value: "full", label: "Wide" },
            { value: "narrow", label: "Narrow" },
          ]}
        />
      </div>
    </div>
  )
}

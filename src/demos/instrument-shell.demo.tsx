import * as React from "react"
import { Activity, Bot, FlaskConical, Library, Radar, Settings, Sparkles, Wrench } from "lucide-react"

import { InstrumentShell, type ShellNavGroup, type ShellReadout } from "@/components/blocks/instrument-shell"

const ic = (Icon: typeof Radar) => <Icon size={16} strokeWidth={1.5} aria-hidden="true" />

const NAV: ShellNavGroup[] = [
  {
    items: [
      { id: "mission", label: "Mission control", icon: ic(Radar), count: 3 },
      { id: "research", label: "Research desk", icon: ic(Library), count: 12 },
      { id: "workbench", label: "Workbench", icon: ic(Wrench) },
      { id: "evals", label: "Evals", icon: ic(FlaskConical), count: "98%" },
    ],
  },
  {
    label: "Agents",
    items: [
      { id: "atlas", label: "Atlas", icon: ic(Bot), count: 2 },
      { id: "sage", label: "Sage", icon: ic(Sparkles) },
      { id: "quill", label: "Quill", icon: ic(Activity) },
    ],
  },
  { label: "Workspace", items: [{ id: "settings", label: "Settings", icon: ic(Settings) }] },
]

const READOUTS: ShellReadout[] = [
  { label: "Runs", value: "4 live", tone: "live" },
  { label: "Tokens", value: "41.2k" },
  { label: "Spend", value: "$7.31" },
]

const PAGES: Record<string, { label: string; title: React.ReactNode; blurb: string }> = {
  mission: { label: "01 · Mission control", title: <>What is <em>running</em></>, blurb: "Every live run across the workspace, with the evidence each one has gathered so far." },
  research: { label: "02 · Research desk", title: <>Sources <em>in hand</em></>, blurb: "Documents Atlas and Sage have read, ranked by how often their claims were used." },
  workbench: { label: "03 · Workbench", title: <>Build a <em>run</em></>, blurb: "Compose a task, pick tools and watch the trace before you commit it." },
  evals: { label: "04 · Evals", title: <>How well it <em>holds</em></>, blurb: "Nightly checks against 240 fixed questions. A drop of two points raises a flag." },
  atlas: { label: "AGT-0412 · Atlas", title: <>Atlas, <em>research</em></>, blurb: "Reads, compares and cites. Never sends anything on its own." },
  sage: { label: "AGT-0413 · Sage", title: <>Sage, <em>review</em></>, blurb: "Slow, careful second reader for anything Atlas marks as uncertain." },
  quill: { label: "AGT-0414 · Quill", title: <>Quill, <em>drafts</em></>, blurb: "Turns approved findings into briefs for the Harbor & Finch team." },
  settings: { label: "Workspace · Settings", title: <>Workspace <em>settings</em></>, blurb: "Members, budgets and the default model for new agents." },
}

const CARDS = [
  { id: "RUN 0412", title: "Q3 churn drivers", meta: "Atlas · 14 sources", value: "62%", note: "confidence" },
  { id: "RUN 0413", title: "Vendor contract review", meta: "Sage · 6 sources", value: "88%", note: "confidence" },
  { id: "RUN 0414", title: "Board brief, draft 2", meta: "Quill · waiting on you", value: "1", note: "approval" },
]

const btn: React.CSSProperties = { height: 30, padding: "0 12px", borderRadius: 2, fontWeight: 500, fontSize: 12.5, cursor: "pointer", font: "inherit" }

export default function Demo() {
  const [active, setActive] = React.useState("mission")
  const page = PAGES[active] ?? PAGES.mission
  const group = NAV.find((g) => g.items.some((i) => i.id === active))
  const item = group?.items.find((i) => i.id === active)

  return (
    <div style={{ height: 640, maxWidth: 1180, margin: "0 auto", borderRadius: 4, overflow: "hidden", boxShadow: "0 0 0 1px rgb(128 128 128 / .3)" }}>
      <InstrumentShell
        product={{ name: "Meridian" }}
        nav={NAV}
        active={active}
        onNavigate={(key) => setActive(key)}
        workspaces={[
          { id: "hf", name: "Harbor & Finch", meta: "Team · 14" },
          { id: "nw", name: "Northwind Clinics", meta: "Team · 6" },
        ]}
        breadcrumb={["Meridian", group?.label ?? "Workspace", item?.label ?? "Mission control"]}
        readouts={READOUTS}
        actions={
          <>
            <button type="button" style={{ ...btn, color: "var(--ish-t2)", background: "transparent", border: 0 }}>
              Share
            </button>
            <button type="button" style={{ ...btn, color: "var(--ish-ink)", background: "transparent", border: "1px solid var(--ish-accent)" }}>
              New run
            </button>
          </>
        }
        commands={[
          { id: "new", label: "Start a new run", hint: "N", onSelect: () => setActive("workbench") },
          { id: "approve", label: "Review pending approvals", hint: "1 waiting", onSelect: () => setActive("mission") },
        ]}
      >
        <div style={{ maxWidth: 860 }}>
          <span className="ish-lab">{page.label}</span>
          <h1 style={{ margin: "6px 0 8px", font: "400 clamp(32px, 5cqw, 44px)/1.05 var(--ish-serif)", letterSpacing: "-.01em", color: "var(--ish-ink)" }}>{page.title}</h1>
          <p style={{ margin: 0, maxWidth: "56ch", color: "var(--ish-t2)" }}>{page.blurb}</p>

          <dl style={{ display: "flex", flexWrap: "wrap", margin: "24px 0 0", boxShadow: "0 -1px 0 var(--ish-rule), 0 1px 0 var(--ish-rule)" }}>
            {[
              ["Runs today", "27"],
              ["Median latency", "812 ms"],
              ["Cited claims", "94%"],
              ["Cost per run", "$0.27"],
            ].map(([k, v]) => (
              <div key={k} style={{ flex: "1 1 120px", padding: "10px 16px", boxShadow: "inset 1px 0 0 var(--ish-rule)" }}>
                <dt className="ish-lab" style={{ fontSize: 10 }}>{k}</dt>
                <dd style={{ margin: 0, font: "500 18px/26px var(--ish-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ish-ink)" }}>{v}</dd>
              </div>
            ))}
          </dl>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
            {CARDS.map((c) => (
              <article key={c.id} style={{ position: "relative", padding: "14px 16px 16px", background: "var(--ish-surface)", borderRadius: 4, boxShadow: "0 0 0 1px var(--ish-rule)" }}>
                <span className="ish-lab">{c.id}</span>
                <h3 style={{ margin: "4px 0 2px", font: "500 14px/20px var(--ish-font)", color: "var(--ish-ink)" }}>{c.title}</h3>
                <p style={{ margin: 0, color: "var(--ish-t3)" }}>{c.meta}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14, paddingTop: 10, boxShadow: "0 -1px 0 var(--ish-rule-2)" }}>
                  <span style={{ font: "500 20px/24px var(--ish-mono)", fontVariantNumeric: "tabular-nums", color: "var(--ish-ink)" }}>{c.value}</span>
                  <span className="ish-lab">{c.note}</span>
                </div>
              </article>
            ))}
          </div>

          <p style={{ margin: "28px 0 0", font: "italic 14px/20px var(--ish-serif)", color: "var(--ish-t2)", maxWidth: "52ch" }}>
            FIG. 1 — Placeholder content. Anything goes in this slot; the grid fades at the edges and the page scrolls inside the frame.
          </p>
          <div style={{ height: 120 }} />
        </div>
      </InstrumentShell>
    </div>
  )
}

export const notes: string[] = [
  "The shell is a flex row inside a container-type: inline-size root. Layout switches use @container queries on the shell's own width, not the viewport, so it becomes a drawer correctly inside a narrow panel too.",
  "The active tick on the vertical ruler is one absolutely positioned element. A layout effect reads the active link's offsetTop and writes translateY straight to the DOM; a ResizeObserver re-places it when the rail or fonts change, and a CSS transition slides it.",
  "The ruler's ticks are three stacked repeating-linear-gradient backgrounds (spine, minor every 8px, major every 40px), so the scale costs one element and no markup per tick.",
  "The registration grid is two 1px linear-gradients on a 24px tile, faded at the edges with a mask-image made of two gradients combined by mask-composite: intersect. Content scrolls in a separate absolutely positioned layer, so the grid stays still.",
  "The ⌘K list is a combobox with a listbox: focus stays in the input and aria-activedescendant names the highlighted row. The global shortcut is one keydown listener on document, removed on unmount.",
]

"use client"

import * as React from "react"
import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen, Menu, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type ShellNavItem = {
  /** Stable key for `active`. Defaults to the label. */
  id?: string
  label: string
  /** 16px icon. Without one the item gets a mono monogram. */
  icon?: React.ReactNode
  /** Mono count on the right, e.g. unread items. */
  count?: number | string
  /** Makes the item a real link. With `onNavigate` set the click is handed to you instead. */
  href?: string
}

export type ShellNavGroup = {
  /** Mono group label. Leave out for an unlabelled first group. */
  label?: string
  items: ShellNavItem[]
}

export type ShellProduct = {
  name: string
  /** A small drawn glyph. Defaults to a meridian circle. */
  mark?: React.ReactNode
}

export type ShellWorkspace = { id: string; name: string; meta?: string }

export type ShellCrumb = string | { label: string; href?: string; onClick?: () => void }

export type ShellReadout = {
  label: string
  value: React.ReactNode
  /** "live" adds the one pulsing signal dot. */
  tone?: "live" | "ok" | "warn" | "bad"
}

export type ShellCommand = {
  id: string
  label: string
  hint?: string
  icon?: React.ReactNode
  /** Mono group label in the command list. */
  group?: string
  onSelect: () => void
}

export type InstrumentShellProps = {
  product?: ShellProduct
  /** Navigation groups. Defaults to a small sample. */
  nav?: ShellNavGroup[]
  /** `id` (or label) of the active item (controlled). */
  active?: string
  defaultActive?: string
  onNavigate?: (key: string, item: ShellNavItem) => void
  workspaces?: ShellWorkspace[]
  defaultWorkspace?: string
  onWorkspaceChange?: (id: string, workspace: ShellWorkspace) => void
  breadcrumb?: ShellCrumb[]
  /** Right side of the top bar, e.g. buttons. */
  actions?: React.ReactNode
  /** Key/value readouts in the top bar. Hidden below ~960px. */
  readouts?: ShellReadout[]
  /** Extra entries for the ⌘K list, after "Go to …" for every nav item. */
  commands?: ShellCommand[]
  searchPlaceholder?: string
  /** Rail collapsed to icons (controlled). */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** The page. It scrolls inside the shell. */
  children?: React.ReactNode
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Defaults                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_NAV: ShellNavGroup[] = [
  { items: [{ label: "Overview" }, { label: "Runs", count: 12 }, { label: "Library" }] },
  { label: "Team", items: [{ label: "Members", count: 4 }, { label: "Settings" }] },
]
const DEFAULT_WORKSPACES: ShellWorkspace[] = [{ id: "main", name: "Harbor & Finch", meta: "Team · 14" }]
const keyOf = (i: ShellNavItem) => i.id ?? i.label

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ish {
  --ish-paper: #fafafa;
  --ish-sheet: #ffffff;
  --ish-ink: #0a0a0a;
  --ish-signal: #0060e2;
  --ish-accent: var(--ish-signal);
  --ish-surface: var(--ish-sheet);
  --ish-signal-soft: color-mix(in oklab, var(--ish-accent) 12%, transparent);
  --ish-t1: color-mix(in oklab, var(--ish-ink) 92%, transparent);
  --ish-t2: color-mix(in oklab, var(--ish-ink) 64%, transparent);
  --ish-t3: color-mix(in oklab, var(--ish-ink) 44%, transparent);
  --ish-t4: color-mix(in oklab, var(--ish-ink) 22%, transparent);
  --ish-rule: color-mix(in oklab, var(--ish-ink) 14%, transparent);
  --ish-rule-2: color-mix(in oklab, var(--ish-ink) 7%, transparent);
  --ish-ok: #1f8a4c; --ish-warn: #b7791f; --ish-bad: #c4321a;
  --ish-serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --ish-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --ish-font: var(--ish-sans);
  --ish-mono: "Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace;
  --ish-ease: cubic-bezier(.2, .8, .2, 1);
  --ish-ease-trace: cubic-bezier(.65, 0, .35, 1);
  --ish-rail: 236px;
  position: relative; display: flex; width: 100%; height: 100%; min-height: 0; overflow: hidden;
  container: ish / inline-size;
  background: var(--ish-paper);
  font: 13px/20px var(--ish-font); color: var(--ish-t1);
  -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ish {
  --ish-paper: #0c0c0d; --ish-sheet: #1c1c1e; --ish-ink: #f5f5f5; --ish-signal: #4d8dff;
  --ish-ok: #4cc27f; --ish-warn: #e0a64a; --ish-bad: #ff7a62;
}
.ish *, .ish *::before, .ish *::after { box-sizing: border-box }
:where(.ish) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
:where(.ish) :is(ul, ol) { list-style: none; margin: 0; padding: 0 }
:where(.ish) a { color: inherit; text-decoration: none }
.ish :focus-visible { outline: 2px solid color-mix(in oklab, var(--ish-accent) 60%, transparent); outline-offset: 1px }

.ish-lab { font: 500 10.5px/16px var(--ish-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ish-t3) }

/* Rail */
.ish-rail {
  position: relative; z-index: 20; flex: none; display: flex; flex-direction: column; width: var(--ish-rail); min-height: 0;
  background: var(--ish-surface); box-shadow: 1px 0 0 var(--ish-rule);
  transition: width .3s var(--ish-ease);
}
.ish-brand { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px 0 18px; flex: none }
.ish-mark { flex: none; width: 20px; height: 20px; color: var(--ish-ink) }
.ish-mark path, .ish-mark circle, .ish-mark ellipse { stroke-dasharray: 1; stroke-dashoffset: 0; animation: ish-trace .9s var(--ish-ease-trace) backwards }
.ish-mark ellipse { animation-delay: .12s }
.ish-mark path { animation-delay: .24s }
@keyframes ish-trace { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
.ish-pname { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 22px/24px var(--ish-serif); letter-spacing: -.01em; color: var(--ish-ink) }
.ish-pname em { font-style: italic }
.ish-close { display: none; flex: none; width: 28px; height: 28px; place-items: center; border-radius: 2px; color: var(--ish-t2) }
.ish-close:hover { background: var(--ish-rule-2); color: var(--ish-ink) }

/* Workspace switcher */
.ish-ws { position: relative; flex: none; padding: 0 10px 10px 10px }
.ish-ws-btn {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 40px; padding: 0 8px; border-radius: 2px;
  box-shadow: 0 0 0 1px var(--ish-rule); transition: box-shadow .16s var(--ish-ease);
}
.ish-ws-btn:hover, .ish-ws[data-open] .ish-ws-btn { box-shadow: 0 0 0 1px var(--ish-t4) }
.ish-ws-mono { flex: none; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 2px; background: var(--ish-ink); color: var(--ish-paper); font: 600 11px/1 var(--ish-mono) }
.ish-ws-tx { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; line-height: 15px }
.ish-ws-tx b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ish-t1) }
.ish-ws-tx i { font: 500 10px/14px var(--ish-mono); letter-spacing: .06em; text-transform: uppercase; font-style: normal; color: var(--ish-t3); white-space: nowrap }
.ish-ws-chev { flex: none; color: var(--ish-t3) }
.ish-menu {
  position: absolute; left: 10px; top: calc(100% - 6px); z-index: 50; min-width: 216px; padding: 4px; background: var(--ish-surface); border-radius: 4px;
  box-shadow: 0 0 0 1px var(--ish-rule), 0 1px 0 var(--ish-rule), 0 12px 24px -16px rgb(0 0 0 / .25);
  animation: ish-reveal .22s var(--ish-ease) backwards;
}
.ish-menu-i { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 8px 7px 14px; border-radius: 2px; position: relative }
.ish-menu-i:hover, .ish-menu-i:focus-visible { background: var(--ish-rule-2) }
.ish-menu-i:focus-visible { outline: none }
.ish-menu-i[aria-checked="true"]::before { content: ""; position: absolute; left: 4px; top: 50%; width: 2px; height: 12px; margin-top: -6px; background: var(--ish-accent) }
.ish-menu-i > span { flex: 1 1 auto; min-width: 0 }
.ish-menu-i i { flex: none; font: 500 10px/14px var(--ish-mono); letter-spacing: .06em; text-transform: uppercase; font-style: normal; color: var(--ish-t3) }
@keyframes ish-reveal { from { clip-path: inset(0 -20px 100% -20px) } to { clip-path: inset(-20px -20px -20px -20px) } }

/* Nav with a vertical ruler */
.ish-nav { position: relative; flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto; padding: 4px 10px 12px 0; scrollbar-width: none }
.ish-nav::-webkit-scrollbar { display: none }
.ish-ruler {
  position: absolute; left: 6px; top: 0; bottom: 0; width: 12px; pointer-events: none;
  background:
    linear-gradient(var(--ish-rule), var(--ish-rule)) right 0 top 0 / 1px 100% no-repeat,
    repeating-linear-gradient(to bottom, var(--ish-t3) 0 1px, transparent 1px 40px) right 1px top 0 / 8px 100% no-repeat,
    repeating-linear-gradient(to bottom, var(--ish-t4) 0 1px, transparent 1px 8px) right 1px top 0 / 4px 100% no-repeat;
  animation: ish-ruler .8s var(--ish-ease-trace) backwards;
}
@keyframes ish-ruler { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0) } }
.ish-ind {
  position: absolute; left: 6px; top: 0; width: 13px; height: 2px; margin-top: -1px; background: var(--ish-accent); pointer-events: none; opacity: 0;
}
.ish-ind[data-ready] { transition: transform .32s var(--ish-ease), opacity .2s }
.ish-glab { margin: 14px 0 4px 20px; padding-right: 8px; white-space: nowrap; overflow: hidden }
.ish-group:first-of-type .ish-glab { margin-top: 6px }
.ish-sep { display: none; height: 1px; margin: 10px 0 10px 20px; width: 24px; background: var(--ish-rule) }
.ish-item {
  position: relative; display: flex; align-items: center; gap: 10px; width: calc(100% - 20px); height: 30px; margin-left: 20px; padding: 0 8px; border-radius: 2px;
  color: var(--ish-t2); white-space: nowrap; transition: background-color .16s, color .16s;
}
.ish-item:hover { background: var(--ish-rule-2); color: var(--ish-ink) }
.ish-item[aria-current="page"] { color: var(--ish-ink); font-weight: 500 }
.ish-ic { flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--ish-t3); transition: color .16s }
.ish-item:hover .ish-ic, .ish-item[aria-current="page"] .ish-ic { color: var(--ish-ink) }
.ish-mono { width: 16px; height: 16px; display: grid; place-items: center; border-radius: 2px; box-shadow: 0 0 0 1px var(--ish-rule); font: 600 9.5px/1 var(--ish-mono); text-transform: uppercase }
.ish-item-l { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: left }
.ish-count { flex: none; font: 500 11px/16px var(--ish-mono); font-variant-numeric: tabular-nums; color: var(--ish-t3) }
.ish-item[aria-current="page"] .ish-count { color: var(--ish-ink) }
.ish-foot { flex: none; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 10px 0 20px; box-shadow: 0 -1px 0 var(--ish-rule) }
.ish-collapse { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 8px; margin-left: -8px; border-radius: 2px; color: var(--ish-t3); white-space: nowrap }
.ish-collapse:hover { background: var(--ish-rule-2); color: var(--ish-ink) }

/* Column: top bar + stage */
.ish-col { position: relative; flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column }
.ish-top { position: relative; z-index: 10; flex: none; display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 16px; background: var(--ish-paper); box-shadow: 0 1px 0 var(--ish-rule) }
.ish-burger { display: none; flex: none; width: 30px; height: 30px; margin-left: -6px; place-items: center; border-radius: 2px; color: var(--ish-t2) }
.ish-burger:hover { background: var(--ish-rule-2); color: var(--ish-ink) }
.ish-top > nav { min-width: 0; flex: 0 1 auto }
.ish-crumbs { display: flex; align-items: center; min-width: 0; white-space: nowrap }
.ish-crumbs li { display: flex; align-items: center; min-width: 0 }
.ish-crumbs li + li::before { content: "/"; margin: 0 8px; font: 500 12px/1 var(--ish-mono); color: var(--ish-t4) }
.ish-crumbs a, .ish-crumbs button, .ish-crumbs span { overflow: hidden; text-overflow: ellipsis; color: var(--ish-t2) }
.ish-crumbs a:hover, .ish-crumbs button:hover { color: var(--ish-ink) }
.ish-crumbs li:last-child > * { color: var(--ish-ink); font-weight: 500 }
.ish-sp { flex: 1 1 auto }
.ish-search {
  display: flex; align-items: center; gap: 8px; flex: none; width: 220px; height: 30px; padding: 0 6px 0 9px; border-radius: 2px; background: var(--ish-surface);
  box-shadow: 0 0 0 1px var(--ish-rule); color: var(--ish-t3); transition: box-shadow .16s var(--ish-ease);
}
.ish-search:hover { box-shadow: 0 0 0 1px var(--ish-t4) }
.ish-search-t { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ish-kbd { flex: none; padding: 0 5px; border-radius: 2px; box-shadow: 0 0 0 1px var(--ish-rule); font: 500 10.5px/16px var(--ish-mono); letter-spacing: .04em; color: var(--ish-t3) }
.ish-ro { display: flex; flex: none; margin: 0 }
.ish-ro > div { display: flex; flex-direction: column; justify-content: center; padding: 0 14px; box-shadow: -1px 0 0 var(--ish-rule) }
.ish-ro dt { font: 500 9.5px/12px var(--ish-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--ish-t3) }
.ish-ro dd { display: flex; align-items: center; gap: 6px; margin: 0; font: 500 12px/16px var(--ish-mono); font-variant-numeric: tabular-nums; color: var(--ish-t1) }
.ish-ro dd[data-tone="ok"] { color: var(--ish-ok) }
.ish-ro dd[data-tone="warn"] { color: var(--ish-warn) }
.ish-ro dd[data-tone="bad"] { color: var(--ish-bad) }
.ish-dot { position: relative; flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--ish-accent) }
.ish-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 1px solid var(--ish-accent); animation: ish-ring 1.6s var(--ish-ease) infinite }
@keyframes ish-ring { from { transform: scale(1); opacity: .8 } to { transform: scale(3.2); opacity: 0 } }
.ish-actions { display: flex; align-items: center; gap: 8px; flex: none }

/* Command list */
.ish-cmd {
  position: absolute; right: 16px; top: calc(100% - 8px); z-index: 30; width: min(400px, calc(100% - 32px)); background: var(--ish-surface); border-radius: 4px;
  box-shadow: 0 0 0 1px var(--ish-rule), 0 1px 0 var(--ish-rule), 0 12px 24px -16px rgb(0 0 0 / .25);
  animation: ish-reveal .26s var(--ish-ease) backwards;
}
.ish-cmd-in { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; color: var(--ish-t3); box-shadow: 0 1px 0 var(--ish-rule) }
.ish-cmd-in input:focus-visible { outline: 0 }
.ish-cmd-in input { flex: 1 1 auto; min-width: 0; height: 100%; padding: 0; background: none; border: 0; outline: 0; font: inherit; color: var(--ish-t1) }
.ish-cmd-in input::placeholder { color: var(--ish-t3) }
.ish-cmd-list { max-height: 264px; overflow: auto; padding: 4px }
.ish-cmd-g { padding: 8px 8px 2px }
.ish-cmd-i { position: relative; display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 8px 7px 14px; border-radius: 2px; cursor: pointer; color: var(--ish-t1) }
.ish-cmd-i[data-active] { background: var(--ish-rule-2) }
.ish-cmd-i[data-active]::before { content: ""; position: absolute; left: 4px; top: 50%; width: 2px; height: 12px; margin-top: -6px; background: var(--ish-accent) }
.ish-cmd-i > span:not(.ish-ic) { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ish-cmd-i i { flex: none; font: 500 10px/14px var(--ish-mono); letter-spacing: .06em; text-transform: uppercase; font-style: normal; color: var(--ish-t3) }
.ish-cmd-empty { padding: 16px 12px; color: var(--ish-t3) }

/* Stage: registration grid + scrolling content */
.ish-stage { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden }
.ish-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--ish-rule-2) 1px, transparent 1px),
    linear-gradient(90deg, var(--ish-rule-2) 1px, transparent 1px);
  background-size: 24px 24px; background-position: -1px -1px;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent), linear-gradient(transparent, #000 16%, #000 84%, transparent);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent), linear-gradient(transparent, #000 16%, #000 84%, transparent);
  mask-composite: intersect;
}
.ish-crop { position: absolute; z-index: 2; width: 8px; height: 8px; pointer-events: none; border: 0 solid var(--ish-t4) }
.ish-crop[data-c="tl"] { top: 8px; left: 8px; border-width: 1px 0 0 1px }
.ish-crop[data-c="tr"] { top: 8px; right: 8px; border-width: 1px 1px 0 0 }
.ish-crop[data-c="bl"] { bottom: 8px; left: 8px; border-width: 0 0 1px 1px }
.ish-crop[data-c="br"] { bottom: 8px; right: 8px; border-width: 0 1px 1px 0 }
.ish-main { position: absolute; inset: 0; overflow: auto; padding: 28px clamp(16px, 4cqw, 40px) 40px; outline: 0 }
.ish-scan { position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--ish-accent); pointer-events: none; z-index: 3; opacity: 0; animation: ish-scan .7s var(--ish-ease-trace) }
@keyframes ish-scan { 0% { top: 0; opacity: 1 } 75% { opacity: 1 } 100% { top: calc(100% - 1px); opacity: 0 } }

/* Drawer scrim */
.ish-scrim { display: none }

/* Wide: collapsed rail */
@container ish (min-width: 761px) {
  .ish[data-collapsed] .ish-rail { width: 64px }
  .ish[data-collapsed] .ish-brand { padding: 0 0 0 22px }
  .ish[data-collapsed] .ish-pname, .ish[data-collapsed] .ish-ws-tx, .ish[data-collapsed] .ish-ws-chev, .ish[data-collapsed] .ish-glab,
  .ish[data-collapsed] .ish-item-l, .ish[data-collapsed] .ish-count, .ish[data-collapsed] .ish-collapse-l { display: none }
  .ish[data-collapsed] .ish-sep { display: block }
  .ish[data-collapsed] .ish-ws { padding: 0 10px 10px 20px }
  .ish[data-collapsed] .ish-ws-btn { width: 34px; padding: 0 5px; box-shadow: none }
  .ish[data-collapsed] .ish-item { width: 34px; padding: 0; justify-content: center }
  .ish[data-collapsed] .ish-item[data-count]::after { content: ""; position: absolute; top: 6px; right: 5px; width: 4px; height: 4px; border-radius: 50%; background: var(--ish-t2) }
  .ish[data-collapsed] .ish-foot { padding-left: 20px }
  .ish[data-collapsed] .ish-collapse { width: 34px; justify-content: center; padding: 0; margin-left: 0 }
}

/* Narrow: the rail becomes a slide-over drawer */
@container ish (max-width: 760px) {
  .ish-rail {
    position: absolute; left: 0; top: 0; bottom: 0; width: min(284px, 86%); transform: translateX(-102%); visibility: hidden;
    transition: transform .34s var(--ish-ease), visibility 0s .34s; box-shadow: 1px 0 0 var(--ish-rule), 12px 0 24px -16px rgb(0 0 0 / .25);
  }
  .ish[data-drawer] .ish-rail { transform: none; visibility: visible; transition-delay: 0s }
  .ish-scrim { display: block; position: absolute; inset: 0; z-index: 15; background: color-mix(in oklab, var(--ish-ink) 38%, transparent); opacity: 0; pointer-events: none; transition: opacity .3s var(--ish-ease) }
  .ish[data-drawer] .ish-scrim { opacity: 1; pointer-events: auto }
  .ish-burger, .ish-close { display: grid }
  .ish-collapse-wrap { display: none }
  .ish-foot { display: none }
  .ish-search { width: 30px; padding: 0; justify-content: center }
  .ish-search-t, .ish-search .ish-kbd { display: none }
  .ish-top { gap: 10px; padding: 0 12px }
  .ish-crumbs li:not(:last-child) { display: none }
  .ish-crumbs li + li::before { display: none }
  .ish-cmd { right: 12px }
}
@container ish (max-width: 980px) { .ish-ro { display: none } }

@media (prefers-reduced-motion: reduce) {
  .ish *, .ish *::before, .ish *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

function Glyph() {
  return (
    <svg className="ish-mark" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" pathLength="1" />
      <ellipse cx="10" cy="10" rx="3.4" ry="8.25" pathLength="1" />
      <path d="M1.75 10h16.5" pathLength="1" />
    </svg>
  )
}

function Monogram({ label }: { label: string }) {
  return <span className="ish-mono">{label.slice(0, 1)}</span>
}

type PaletteEntry = ShellCommand & { index: number }

function CommandList({
  entries,
  onClose,
  placeholder,
}: {
  entries: ShellCommand[]
  onClose: () => void
  placeholder: string
}) {
  const [q, setQ] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listId = React.useId()

  const filtered: PaletteEntry[] = React.useMemo(() => {
    const n = q.trim().toLowerCase()
    return entries.filter((c) => !n || c.label.toLowerCase().includes(n) || c.group?.toLowerCase().includes(n)).map((c, index) => ({ ...c, index }))
  }, [entries, q])

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])
  React.useEffect(() => {
    listRef.current?.querySelector("[data-active]")?.scrollIntoView({ block: "nearest" })
  }, [active, filtered])

  const run = (c?: ShellCommand) => {
    if (!c) return
    onClose()
    c.onSelect()
  }
  const act = Math.min(active, Math.max(filtered.length - 1, 0))

  return (
    <div className="ish-cmd" role="dialog" aria-label="Command list">
      <div className="ish-cmd-in">
        <Search size={14} strokeWidth={1.5} aria-hidden="true" />
        <input
          ref={inputRef}
          value={q}
          placeholder={placeholder}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={filtered.length ? `${listId}-${act}` : undefined}
          aria-label="Search commands"
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive(Math.min(act + 1, filtered.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive(Math.max(act - 1, 0))
            } else if (e.key === "Enter") {
              e.preventDefault()
              run(filtered[act])
            } else if (e.key === "Escape") {
              e.preventDefault()
              onClose()
            }
          }}
        />
        <span className="ish-kbd">ESC</span>
      </div>
      <div ref={listRef} id={listId} role="listbox" aria-label="Commands" className="ish-cmd-list">
        {filtered.length === 0 ? <div className="ish-cmd-empty">Nothing matches “{q}”.</div> : null}
        {filtered.map((c, i) => (
          <React.Fragment key={c.id}>
            {c.group && c.group !== filtered[i - 1]?.group ? <div className="ish-cmd-g ish-lab">{c.group}</div> : null}
            <div
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === act}
              data-active={i === act || undefined}
              className="ish-cmd-i"
              onPointerMove={() => i !== act && setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => run(c)}
            >
              {c.icon ? <span className="ish-ic">{c.icon}</span> : null}
              <span>{c.label}</span>
              {c.hint ? <i>{c.hint}</i> : null}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Shell                                   */
/* -------------------------------------------------------------------------- */

/** App shell for an AI product: ruler nav rail, top bar with breadcrumb, ⌘K list and readouts, and a scrolling content slot. Fills its parent's height. */
export function InstrumentShell({
  product = { name: "Product" },
  nav = DEFAULT_NAV,
  active,
  defaultActive,
  onNavigate,
  workspaces = DEFAULT_WORKSPACES,
  defaultWorkspace,
  onWorkspaceChange,
  breadcrumb,
  actions,
  readouts,
  commands,
  searchPlaceholder = "Search or jump to…",
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  children,
  className,
}: InstrumentShellProps) {
  const firstKey = nav.find((g) => g.items.length)?.items[0]
  const [innerActive, setInnerActive] = React.useState(defaultActive ?? (firstKey ? keyOf(firstKey) : ""))
  const activeKey = active ?? innerActive
  const [innerCollapsed, setInnerCollapsed] = React.useState(defaultCollapsed)
  const isCollapsed = collapsed ?? innerCollapsed
  const [wsId, setWsId] = React.useState(defaultWorkspace ?? workspaces[0]?.id)
  const ws = workspaces.find((w) => w.id === wsId) ?? workspaces[0]
  const [wsOpen, setWsOpen] = React.useState(false)
  const [drawer, setDrawer] = React.useState(false)
  const [cmdOpen, setCmdOpen] = React.useState(false)

  const railId = React.useId()
  const navRef = React.useRef<HTMLElement>(null)
  const indRef = React.useRef<HTMLSpanElement>(null)
  const burgerRef = React.useRef<HTMLButtonElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const searchRef = React.useRef<HTMLButtonElement>(null)
  const cmdWrapRef = React.useRef<HTMLDivElement>(null)
  const wsMenuRef = React.useRef<HTMLDivElement>(null)
  const drawerWas = React.useRef(false)

  const setCollapsed = (v: boolean) => {
    if (collapsed === undefined) setInnerCollapsed(v)
    onCollapsedChange?.(v)
  }

  const go = (item: ShellNavItem, e?: React.MouseEvent) => {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return
    if (item.href && !onNavigate) {
      setDrawer(false)
      return
    }
    e?.preventDefault()
    if (active === undefined) setInnerActive(keyOf(item))
    setDrawer(false)
    onNavigate?.(keyOf(item), item)
  }

  /* The signal tick slides to the active item. Positions are written to the DOM, not state. */
  React.useLayoutEffect(() => {
    const navEl = navRef.current
    const ind = indRef.current
    if (!navEl || !ind) return
    const place = () => {
      const el = navEl.querySelector<HTMLElement>('[aria-current="page"]')
      if (!el) {
        ind.style.opacity = "0"
        return
      }
      ind.style.opacity = "1"
      ind.style.transform = `translateY(${el.offsetTop + el.offsetHeight / 2}px)`
    }
    place()
    if (!ind.dataset.ready) {
      requestAnimationFrame(() => {
        ind.dataset.ready = "1"
      })
    }
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(place)
    ro.observe(navEl)
    return () => ro.disconnect()
  }, [activeKey, nav, isCollapsed])

  React.useEffect(() => {
    if (drawer) closeRef.current?.focus()
    else if (drawerWas.current) burgerRef.current?.focus()
    drawerWas.current = drawer
  }, [drawer])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  React.useEffect(() => {
    if (!cmdOpen) return
    const onDown = (e: PointerEvent) => {
      if (!cmdWrapRef.current?.contains(e.target as Node)) setCmdOpen(false)
    }
    document.addEventListener("pointerdown", onDown)
    return () => document.removeEventListener("pointerdown", onDown)
  }, [cmdOpen])

  const entries = React.useMemo<ShellCommand[]>(() => {
    const jump: ShellCommand[] = nav.flatMap((g) =>
      g.items.map((it) => ({
        id: `go-${keyOf(it)}`,
        label: it.label,
        hint: g.label ?? "Page",
        group: "Jump to",
        icon: it.icon,
        onSelect: () => {
          if (active === undefined) setInnerActive(keyOf(it))
          onNavigate?.(keyOf(it), it)
        },
      })),
    )
    return [...jump, ...(commands ?? []).map((c) => ({ ...c, group: c.group ?? "Actions" }))]
  }, [nav, commands, active, onNavigate])

  const crumbs = breadcrumb ?? []

  return (
    <div
      className={cn("ish", className)}
      data-collapsed={isCollapsed || undefined}
      data-drawer={drawer || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && drawer) setDrawer(false)
      }}
    >
      <style href="instrument-shell" precedence="default">
        {CSS}
      </style>

      <aside id={railId} className="ish-rail" aria-label="Primary">
        <div className="ish-brand">
          {product.mark ?? <Glyph />}
          <span className="ish-pname">{product.name}</span>
          <button ref={closeRef} type="button" className="ish-close" aria-label="Close navigation" onClick={() => setDrawer(false)}>
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {ws ? (
          <div
            className="ish-ws"
            data-open={wsOpen || undefined}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setWsOpen(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && wsOpen) {
                e.stopPropagation()
                setWsOpen(false)
              } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && wsOpen) {
                e.preventDefault()
                const items = [...(wsMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])]
                const i = items.indexOf(document.activeElement as HTMLElement)
                items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus()
              }
            }}
          >
            <button
              type="button"
              className="ish-ws-btn"
              aria-haspopup={workspaces.length > 1 ? "menu" : undefined}
              aria-expanded={workspaces.length > 1 ? wsOpen : undefined}
              aria-label={`Workspace: ${ws.name}`}
              title={isCollapsed ? ws.name : undefined}
              onClick={() => workspaces.length > 1 && setWsOpen((o) => !o)}
            >
              <span className="ish-ws-mono">{ws.name.slice(0, 1)}</span>
              <span className="ish-ws-tx">
                <b>{ws.name}</b>
                {ws.meta ? <i>{ws.meta}</i> : null}
              </span>
              {workspaces.length > 1 ? <ChevronsUpDown className="ish-ws-chev" size={14} strokeWidth={1.5} aria-hidden="true" /> : null}
            </button>
            {wsOpen ? (
              <div ref={wsMenuRef} role="menu" aria-label="Workspaces" className="ish-menu">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={w.id === ws.id}
                    className="ish-menu-i"
                    ref={(el) => {
                      if (el && w.id === ws.id && !el.dataset.focused) {
                        el.dataset.focused = "1"
                        el.focus()
                      }
                    }}
                    onClick={() => {
                      setWsId(w.id)
                      setWsOpen(false)
                      onWorkspaceChange?.(w.id, w)
                    }}
                  >
                    <span>{w.name}</span>
                    {w.meta ? <i>{w.meta}</i> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <nav ref={navRef} className="ish-nav" aria-label="Main">
          <span className="ish-ruler" aria-hidden="true" />
          <span ref={indRef} className="ish-ind" aria-hidden="true" />
          {nav.map((g, gi) => (
            <div key={g.label ?? `g${gi}`} className="ish-group" role="group" aria-label={g.label}>
              {gi > 0 ? <div className="ish-sep" aria-hidden="true" /> : null}
              {g.label ? <div className="ish-glab ish-lab">{g.label}</div> : null}
              <ul>
                {g.items.map((it) => {
                  const key = keyOf(it)
                  const isActive = key === activeKey
                  const inner = (
                    <>
                      <span className="ish-ic">{it.icon ?? <Monogram label={it.label} />}</span>
                      <span className="ish-item-l">{it.label}</span>
                      {it.count !== undefined ? <span className="ish-count">{it.count}</span> : null}
                    </>
                  )
                  const common = {
                    className: "ish-item",
                    "aria-current": isActive ? ("page" as const) : undefined,
                    "data-count": it.count !== undefined ? "" : undefined,
                    title: isCollapsed ? it.label : undefined,
                  }
                  return (
                    <li key={key}>
                      {it.href ? (
                        <a {...common} href={it.href} onClick={(e) => go(it, e)}>
                          {inner}
                        </a>
                      ) : (
                        <button type="button" {...common} onClick={(e) => go(it, e)}>
                          {inner}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="ish-foot ish-collapse-wrap">
          <button
            type="button"
            className="ish-collapse"
            aria-expanded={!isCollapsed}
            aria-controls={railId}
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={isCollapsed ? "Expand navigation" : undefined}
            onClick={() => setCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <PanelLeftOpen size={16} strokeWidth={1.5} aria-hidden="true" /> : <PanelLeftClose size={16} strokeWidth={1.5} aria-hidden="true" />}
            <span className="ish-collapse-l ish-lab">Collapse</span>
          </button>
        </div>
      </aside>

      <div className="ish-scrim" aria-hidden="true" onClick={() => setDrawer(false)} />

      <div className="ish-col">
        <header className="ish-top">
          <button
            ref={burgerRef}
            type="button"
            className="ish-burger"
            aria-label="Open navigation"
            aria-expanded={drawer}
            aria-controls={railId}
            onClick={() => setDrawer(true)}
          >
            <Menu size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>

          {crumbs.length ? (
            <nav aria-label="Breadcrumb">
              <ol className="ish-crumbs">
                {crumbs.map((c, i) => {
                  const last = i === crumbs.length - 1
                  const label = typeof c === "string" ? c : c.label
                  const href = typeof c === "string" ? undefined : c.href
                  const onClick = typeof c === "string" ? undefined : c.onClick
                  return (
                    <li key={`${label}-${i}`}>
                      {last || (!href && !onClick) ? (
                        <span aria-current={last ? "page" : undefined}>{label}</span>
                      ) : href ? (
                        <a href={href} onClick={onClick}>
                          {label}
                        </a>
                      ) : (
                        <button type="button" onClick={onClick}>
                          {label}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>
          ) : null}

          <span className="ish-sp" />

          <div ref={cmdWrapRef} style={{ display: "contents" }}>
            <button
              ref={searchRef}
              type="button"
              className="ish-search"
              aria-haspopup="dialog"
              aria-expanded={cmdOpen}
              aria-label="Search"
              onClick={() => setCmdOpen((o) => !o)}
            >
              <Search size={14} strokeWidth={1.5} aria-hidden="true" />
              <span className="ish-search-t">{searchPlaceholder}</span>
              <span className="ish-kbd">⌘K</span>
            </button>
            {cmdOpen ? (
              <CommandList
                entries={entries}
                placeholder={searchPlaceholder}
                onClose={() => {
                  setCmdOpen(false)
                  searchRef.current?.focus()
                }}
              />
            ) : null}
          </div>

          {readouts?.length ? (
            <dl className="ish-ro">
              {readouts.map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd data-tone={r.tone && r.tone !== "live" ? r.tone : undefined}>
                    {r.tone === "live" ? <span className="ish-dot" aria-hidden="true" /> : null}
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {actions ? <div className="ish-actions">{actions}</div> : null}
        </header>

        <div className="ish-stage">
          <div className="ish-grid" aria-hidden="true" />
          <main className="ish-main" tabIndex={-1}>
            {children}
          </main>
          <i className="ish-crop" data-c="tl" aria-hidden="true" />
          <i className="ish-crop" data-c="tr" aria-hidden="true" />
          <i className="ish-crop" data-c="bl" aria-hidden="true" />
          <i className="ish-crop" data-c="br" aria-hidden="true" />
          <span key={activeKey} className="ish-scan" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

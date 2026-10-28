"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, PanelLeft, Search, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ShellNavItem = { label: string; icon: LucideIcon; badge?: number | string }
export type ShellNavGroup = { label?: string; items: ShellNavItem[]; empty?: string }
export type ShellUser = { name: string; avatar?: string }

export type AppShellProps = {
  nav: ShellNavGroup[]
  /** Label of the current sidebar item. */
  active: string
  onNavigate?: (label: string) => void
  workspace?: string
  user?: ShellUser
  /** Extra buttons next to search in the sidebar header. */
  sideTools?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

// Shared by the shell and every screen inside it (buttons, tokens, keyframes).
export const SHELL_CSS = `
.as {
  --as-bg: #f8f8f8;
  --as-surface: #fff;
  --as-border: #ebebeb;
  --as-line: #f0f0f0;
  --as-ink: #171717;
  --as-text: #404040;
  --as-text-2: #6b6b6b;
  --as-muted: #737373;
  --as-subtle: #8a8a8a;
  --as-faint: #a3a3a3;
  --as-fill: #f5f5f5;
  --as-well: #f4f4f4;
  --as-code: #fafafa;
  --as-hover: rgb(0 0 0 / .04);
  --as-active: rgb(0 0 0 / .055);
  --as-accent: #4469fc;
  --as-accent-soft: #eef3ff;
  --as-primary: #262626;
  --as-primary-ink: #fff;
  --as-card: 0 0 0 1px #ebebeb, 0 2px 6px 0 rgb(0 0 0 / .04);
  --as-card-2: 0 0 0 1px #ececec, 0 1px 2px 0 rgb(0 0 0 / .04);
  --as-inset: inset 0 0 0 1px #e7e7e7;
  --as-green: #18794e;
  --as-green-soft: rgb(34 160 90 / .1);
  --as-red: #b42318;
  --as-red-soft: rgb(220 60 60 / .08);
  --as-amber: #b45309;
  --as-amber-soft: rgb(217 119 6 / .1);
  --as-blue: #3355e0;
  --as-blue-soft: rgb(68 105 252 / .1);
  --as-ease: cubic-bezier(.22, 1, .36, 1);
  --as-ease-2: cubic-bezier(.25, 1, .5, 1);
  --as-mono: ui-monospace, "SF Mono", Menlo, monospace;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--as-bg);
  color: var(--as-text);
  font-family: var(--as-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 1.4286;
  -webkit-font-smoothing: antialiased;
  text-align: left;
  transition: grid-template-columns .36s var(--as-ease);
}
:is(.dark, [data-theme="dark"]) .as {
  --as-bg: #0e0e10;
  --as-surface: #141416;
  --as-border: #29292d;
  --as-line: #222225;
  --as-ink: #f4f4f5;
  --as-text: #d4d4d8;
  --as-text-2: #a1a1aa;
  --as-muted: #a1a1aa;
  --as-subtle: #8b8b92;
  --as-faint: #71717a;
  --as-fill: #1f1f22;
  --as-well: #111113;
  --as-code: #18181b;
  --as-hover: rgb(255 255 255 / .04);
  --as-active: rgb(255 255 255 / .07);
  --as-accent: #6d8bff;
  --as-accent-soft: rgb(109 139 255 / .14);
  --as-primary: #f4f4f5;
  --as-primary-ink: #171717;
  --as-card: 0 0 0 1px #29292d, 0 2px 6px 0 rgb(0 0 0 / .3);
  --as-card-2: 0 0 0 1px #2a2a2e, 0 1px 2px 0 rgb(0 0 0 / .3);
  --as-inset: inset 0 0 0 1px rgb(255 255 255 / .1);
  --as-green: #4ade80;
  --as-green-soft: rgb(74 222 128 / .12);
  --as-red: #f87171;
  --as-red-soft: rgb(248 113 113 / .12);
  --as-amber: #fbbf24;
  --as-amber-soft: rgb(251 191 36 / .12);
  --as-blue: #8aa2ff;
  --as-blue-soft: rgb(109 139 255 / .14);
}
.as[data-side="closed"] { grid-template-columns: 0 minmax(0, 1fr) }
.as *, .as *::before, .as *::after { box-sizing: border-box }
.as button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
.as :focus-visible { outline: 2px solid color-mix(in oklab, var(--as-accent) 55%, transparent); outline-offset: 1px }
.as svg { flex: none }
.as .sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0 }

/* Buttons */
.as .as-icon-btn {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; color: var(--as-muted);
  transition: background-color .16s, color .16s;
}
.as .as-icon-btn:hover { background: var(--as-hover); color: var(--as-ink) }
.as .as-icon-btn[aria-pressed="true"] { color: var(--as-ink) }
.as .as-icon-btn svg { width: 16px; height: 16px }
.as .as-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 12px;
  border-radius: 10px; border: 1px solid transparent; font-size: 13px; font-weight: 500; line-height: 13px; letter-spacing: -.13px;
  white-space: nowrap; transition: background-color .16s, box-shadow .16s, color .16s, opacity .16s;
}
.as .as-btn svg { width: 16px; height: 16px }
.as .as-btn--outline { background: var(--as-surface); border-color: #e5e5e5; color: var(--as-ink); box-shadow: 0 1px 2px 0 rgb(0 0 0 / .06) }
:is(.dark, [data-theme="dark"]) .as .as-btn--outline { border-color: var(--as-border) }
.as .as-btn--outline:hover { background: var(--as-fill) }
.as .as-btn--primary {
  background: var(--as-primary); color: var(--as-primary-ink);
  box-shadow: inset 0 1px .5px 0 rgb(255 255 255 / .16), inset 0 -1px .5px 0 rgb(19 20 27 / .1), 0 1px 2px 0 rgb(19 20 27 / .1);
}
.as .as-btn--primary:hover { background: color-mix(in oklab, var(--as-primary), var(--as-surface) 12%) }
.as .as-btn--sm { height: 30px }
.as .as-btn:disabled { opacity: .45; pointer-events: none }
.as-btn-label { display: inline-block; animation: as-label-in .48s var(--as-ease-2) backwards }
.as-btn-icon { display: grid; animation: as-icon-in .52s var(--as-ease-2) backwards }
.as-kbd {
  display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 6px;
  background: rgb(0 0 0 / .055); font-size: 11px; font-weight: 500; line-height: 11px; color: var(--as-subtle);
}
.as-btn--primary .as-kbd { background: rgb(255 255 255 / .14); color: rgb(255 255 255 / .7) }
:is(.dark, [data-theme="dark"]) .as-kbd { background: rgb(255 255 255 / .08) }
:is(.dark, [data-theme="dark"]) .as-btn--primary .as-kbd { background: rgb(0 0 0 / .1); color: rgb(0 0 0 / .55) }

/* Sidebar */
.as-side { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 10px 8px 8px 10px; overflow: hidden }
.as[data-side="closed"] .as-side { visibility: hidden }
.as-side__head { display: flex; align-items: center; justify-content: space-between; height: 28px; flex: none }
.as .as-side__workspace {
  display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 6px; border-radius: 8px;
  font-size: 14px; font-weight: 600; color: var(--as-ink); transition: background-color .16s;
}
.as .as-side__workspace:hover { background: var(--as-hover) }
.as-side__logo {
  display: grid; place-items: center; width: 18px; height: 18px; margin-right: 1px; border-radius: 5px;
  background: var(--as-surface); box-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px 0 rgb(0 0 0 / .12);
  font-size: 10.5px; font-weight: 600; color: var(--as-ink);
}
.as-side__workspace svg { width: 14px; height: 14px; color: var(--as-faint) }
.as-side__tools { display: flex; gap: 2px }
.as-side__nav { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; min-height: 0; overflow-y: auto; scrollbar-width: none }
.as-side__group { display: flex; flex-direction: column; gap: 1px }
.as-side__label { margin: 6px 0 4px; padding: 0 6px; font-size: 12.5px; line-height: 16px; color: var(--as-faint) }
.as-side__empty { padding: 4px 6px; color: var(--as-faint) }
.as .as-side__item {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 30px; padding: 0 6px; border-radius: 8px;
  font-size: 13.5px; color: var(--as-text); transition: background-color .16s, color .16s;
}
.as .as-side__item:hover { background: var(--as-hover); color: var(--as-ink) }
.as .as-side__item[aria-current="page"] { background: var(--as-active); color: var(--as-ink); font-weight: 500 }
.as-side__item svg { width: 16px; height: 16px; color: var(--as-muted) }
.as-side__item[aria-current="page"] svg { color: var(--as-ink) }
.as-side__badge { margin-left: auto; font-size: 12px; color: var(--as-faint); font-variant-numeric: tabular-nums }
.as-side__foot { display: flex; flex-direction: column; gap: 8px; margin-top: auto; padding-top: 16px; flex: none }

/* "New in" card stack */
.as-news { position: relative; padding-top: 20px; animation: as-guide-in .36s var(--as-ease) backwards }
.as-news__back {
  position: absolute; left: 8px; right: 8px; top: 0; height: 44px; border-radius: 12px; background: var(--as-surface); box-shadow: var(--as-card);
  padding: 4px 9px 0; font-size: 11.5px; font-weight: 500; line-height: 15px; color: var(--as-accent);
}
.as-news__back::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--as-bg); opacity: .35 }
.as-news__card { position: relative; padding: 9px 10px 0; border-radius: 12px; background: var(--as-surface); box-shadow: var(--as-card) }
.as-news__top { display: flex; align-items: center; justify-content: space-between }
.as-news__kicker { font-size: 11.5px; font-weight: 500; line-height: 15px; color: var(--as-accent) }
.as .as-news__close { display: grid; place-items: center; width: 18px; height: 18px; margin: -2px -2px 0 0; border-radius: 6px; color: var(--as-faint) }
.as .as-news__close:hover { background: var(--as-hover); color: var(--as-ink) }
.as-news__close svg { width: 12px; height: 12px }
.as-news__title { margin-top: 4px; font-size: 13.5px; font-weight: 600; line-height: 18px; color: var(--as-ink) }
.as .as-news__more {
  display: flex; align-items: center; justify-content: space-between; width: calc(100% + 20px); height: 34px; margin: 10px -10px 0;
  padding: 0 10px; border-top: 1px solid var(--as-line); border-radius: 0 0 12px 12px; font-size: 12.5px; color: var(--as-muted);
  transition: color .16s;
}
.as .as-news__more:hover { color: var(--as-ink) }
.as-news__more svg { width: 14px; height: 14px }

/* Getting started */
.as .as-guide {
  display: grid; gap: 3px; width: 100%; padding: 10px 10px 9px; border-radius: 12px; background: var(--as-surface); box-shadow: var(--as-card);
  animation: as-guide-in .36s var(--as-ease) backwards;
}
.as-guide__title { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; font-weight: 600; line-height: 18px; color: var(--as-ink) }
.as-guide__title svg { width: 14px; height: 14px; color: var(--as-faint) }
.as-guide__sub { font-size: 12.5px; line-height: 17px; color: var(--as-muted) }
.as-guide__cheer { color: var(--as-accent) }
.as-guide__bar { height: 4px; margin-top: 6px; border-radius: 2px; background: var(--as-well); overflow: hidden }
:is(.dark, [data-theme="dark"]) .as-guide__bar { background: var(--as-fill) }
.as-guide__fill { height: 100%; border-radius: 2px; background: var(--as-accent); transform-origin: left; animation: as-grow .9s var(--as-ease) .2s backwards }

/* Account */
.as .as-user {
  display: flex; align-items: center; gap: 7px; width: 100%; height: 34px; padding: 0 6px; border-radius: 8px;
  font-size: 13.5px; font-weight: 500; color: var(--as-ink); transition: background-color .16s;
}
.as .as-user:hover { background: var(--as-hover) }
.as-user__initials {
  display: grid; place-items: center; width: 21px; height: 21px; border-radius: 50%; overflow: hidden;
  background: var(--as-accent-soft); color: var(--as-accent); font-size: 9.5px; font-weight: 600;
}
.as-user__initials img { width: 100%; height: 100%; object-fit: cover }
.as-user > svg { width: 14px; height: 14px; margin-left: auto; color: var(--as-faint) }

/* Main frame */
.as-main {
  position: relative; display: flex; min-width: 0; min-height: 0; margin: 8px 8px 8px 0; overflow: hidden;
  border: 1px solid var(--as-border); border-radius: 18px; background: var(--as-surface);
}
.as[data-side="closed"] .as-main { margin-left: 8px }
.as-side-open { position: absolute; left: 12px; top: 12px; z-index: 5 }

/* Shared bits for screens */
.as-shimmer { position: relative; display: inline-block }
.as-shimmer::after {
  content: attr(data-text); position: absolute; inset: 0; color: transparent; pointer-events: none; white-space: nowrap;
  background: linear-gradient(90deg, transparent 38%, rgb(255 255 255 / .85) 50%, transparent 62%) 0 0 / 250% 100%;
  -webkit-background-clip: text; background-clip: text; animation: as-sweep 1.8s linear infinite;
}
:is(.dark, [data-theme="dark"]) .as-shimmer::after {
  background-image: linear-gradient(90deg, transparent 38%, rgb(255 255 255 / .9) 50%, transparent 62%);
}
.as-rays { width: 13px; height: 13px }
.as-rays line { stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; animation: as-ray .8s linear infinite }

@keyframes as-label-in { from { opacity: 0; filter: blur(3px); transform: translateY(25%) } }
@keyframes as-icon-in { from { opacity: 0; filter: blur(2px); transform: scale(.7) } }
@keyframes as-guide-in { from { opacity: 0; transform: translateY(6px) } }
@keyframes as-rise { from { opacity: 0; transform: translateY(8px) } }
@keyframes as-fade { from { opacity: 0; transform: translateY(3px) } }
@keyframes as-pop { from { opacity: 0; transform: scale(.6) } }
@keyframes as-grow { from { transform: scaleX(0) } }
@keyframes as-sweep { from { background-position: 100% 0 } to { background-position: 0 0 } }
@keyframes as-ray { from { opacity: 1 } to { opacity: .18 } }
@keyframes as-spin { to { transform: rotate(360deg) } }
@keyframes as-breathe { 50% { opacity: .35 } }

@media (prefers-reduced-motion: reduce) {
  .as *, .as *::before, .as *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important }
}
`

/* -------------------------------------------------------------------------- */
/*                               Shared helpers                               */
/* -------------------------------------------------------------------------- */

/** 8-ray spinner: each ray fades in turn. */
export function Rays({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("as-rays", className)} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4
        return (
          <line
            key={i}
            x1={8 + Math.sin(a) * 3.6}
            y1={8 - Math.cos(a) * 3.6}
            x2={8 + Math.sin(a) * 6.6}
            y2={8 - Math.cos(a) * 6.6}
            style={{ animationDelay: `${(i - 8) * 100}ms` }}
          />
        )
      })}
    </svg>
  )
}

/** Button whose label and icon blur in whenever they change. */
export function ShellButton({
  variant = "outline",
  size,
  icon,
  label,
  kbd,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  variant?: "outline" | "primary"
  size?: "sm"
  icon?: React.ReactNode
  label: string
  kbd?: string
}) {
  return (
    <button type="button" className={cn("as-btn", `as-btn--${variant}`, size && `as-btn--${size}`, className)} {...props}>
      {icon && (
        <span key={`i-${label}`} className="as-btn-icon" aria-hidden>
          {icon}
        </span>
      )}
      <span key={`l-${label}`} className="as-btn-label">
        {label}
      </span>
      {kbd && <span className="as-kbd">{kbd}</span>}
    </button>
  )
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/* -------------------------------------------------------------------------- */
/*                                  AppShell                                  */
/* -------------------------------------------------------------------------- */

export function AppShell({
  nav,
  active,
  onNavigate,
  workspace = "Northwind",
  user = { name: "Sam Rivera" },
  sideTools,
  children,
  className,
}: AppShellProps) {
  const [sideOpen, setSideOpen] = React.useState(true)
  const [newsOpen, setNewsOpen] = React.useState(true)

  return (
    <div className={cn("as", className)} data-side={sideOpen ? "open" : "closed"}>
      <style href="app-shell" precedence="default">
        {SHELL_CSS}
      </style>

      <aside className="as-side" aria-label="Sidebar">
        <div className="as-side__head">
          <button type="button" className="as-side__workspace">
            <span className="as-side__logo" aria-hidden>
              {workspace.charAt(0)}
            </span>
            {workspace}
            <ChevronDown aria-hidden />
          </button>
          <div className="as-side__tools">
            {sideTools}
            <button type="button" className="as-icon-btn" aria-label="Search">
              <Search />
            </button>
            <button type="button" className="as-icon-btn" aria-label="Collapse sidebar" onClick={() => setSideOpen(false)}>
              <PanelLeft />
            </button>
          </div>
        </div>

        <nav className="as-side__nav">
          {nav.map((group, gi) => (
            <div key={gi} className="as-side__group">
              {group.label && <div className="as-side__label">{group.label}</div>}
              {group.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="as-side__item"
                  aria-current={item.label === active ? "page" : undefined}
                  onClick={() => onNavigate?.(item.label)}
                >
                  <item.icon aria-hidden />
                  {item.label}
                  {item.badge !== undefined && <span className="as-side__badge">{item.badge}</span>}
                </button>
              ))}
              {!group.items.length && group.empty && <div className="as-side__empty">{group.empty}</div>}
            </div>
          ))}
        </nav>

        <div className="as-side__foot">
          {newsOpen && (
            <div className="as-news">
              <div className="as-news__back" aria-hidden>
                New in {workspace}
              </div>
              <div className="as-news__card">
                <div className="as-news__top">
                  <span className="as-news__kicker">New in {workspace}</span>
                  <button type="button" className="as-news__close" aria-label="Dismiss" onClick={() => setNewsOpen(false)}>
                    <X />
                  </button>
                </div>
                <div className="as-news__title">Scheduled runs</div>
                <button type="button" className="as-news__more" onClick={() => onNavigate?.("Changelog")}>
                  Full changelog
                  <ChevronRight aria-hidden />
                </button>
              </div>
            </div>
          )}
          <button type="button" className="as-guide" onClick={() => onNavigate?.("Getting started")}>
            <span className="as-guide__title">
              Getting started
              <ChevronRight aria-hidden />
            </span>
            <span className="as-guide__sub">
              2 of 8 done · <span className="as-guide__cheer">Nice pace!</span>
            </span>
            <span className="as-guide__bar">
              <span className="as-guide__fill" style={{ display: "block", width: "25%" }} />
            </span>
          </button>
          <button type="button" className="as-user">
            <span className="as-user__initials" aria-hidden>
              {user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}
            </span>
            {user.name}
            <ChevronDown aria-hidden />
          </button>
        </div>
      </aside>

      <main className="as-main">
        {!sideOpen && (
          <button type="button" className="as-icon-btn as-side-open" aria-label="Open sidebar" onClick={() => setSideOpen(true)}>
            <PanelLeft />
          </button>
        )}
        {children}
      </main>
    </div>
  )
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type OverlayKind = "modal" | "popover" | "tooltip" | "toast" | "sheet" | "drawer"

export type OverlayAtlasProps = {
  /** Play the built-in cascade until the first touch, key press or hover. Default true. */
  autoplay?: boolean
  /** Playback speed. 1 is normal, 2 twice as fast. Default 1. */
  speed?: number
  /** Hold the built-in cascade. Hover and click still replay a cell. */
  paused?: boolean
  /** Keep one overlay at full strength and quiet the other five. */
  highlight?: OverlayKind
  /** Tighter gaps, and the one-line difference under each name is left out. */
  compact?: boolean
  /** Called when a cell is clicked or activated with the keyboard. */
  onPick?: (kind: OverlayKind) => void
  className?: string
}

type Scene = { kind: OverlayKind; name: string; line: string }

const SCENES: Scene[] = [
  { kind: "modal", name: "Modal", line: "Blocks the page until you answer" },
  { kind: "popover", name: "Popover", line: "Anchored to the control that opened it" },
  { kind: "tooltip", name: "Tooltip", line: "A hint on hover; never takes focus" },
  { kind: "toast", name: "Toast", line: "Appears and leaves on its own" },
  { kind: "sheet", name: "Sheet", line: "Rises from the bottom over the page" },
  { kind: "drawer", name: "Drawer", line: "Slides from the edge, page stays in view" },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ovl {
  --ovl-ink: #000;
  --ovl-win: #fff;
  --ovl-pop: #fff;
  --ovl-accent: #0060e2;
  --ovl-t1: color-mix(in oklab, var(--ovl-ink) 88%, transparent);
  --ovl-t2: color-mix(in oklab, var(--ovl-ink) 61%, transparent);
  --ovl-t3: color-mix(in oklab, var(--ovl-ink) 47%, transparent);
  --ovl-t4: color-mix(in oklab, var(--ovl-ink) 30%, transparent);
  --ovl-bar: color-mix(in oklab, var(--ovl-ink) 7%, transparent);
  --ovl-fill: color-mix(in oklab, var(--ovl-ink) 5%, transparent);
  --ovl-fill2: color-mix(in oklab, var(--ovl-ink) 10%, transparent);
  --ovl-line: color-mix(in oklab, var(--ovl-ink) 7%, transparent);
  --ovl-ground: color-mix(in oklab, var(--ovl-ink) 4.5%, transparent);
  --ovl-scrim: color-mix(in oklab, #0a0f1a 26%, transparent);
  --ovl-win-shadow: 0 0 0 .5px rgb(0 0 0 / .07), 0 1px 1px -1px rgb(0 0 0 / .1), 0 2px 4px -1px rgb(0 0 0 / .05), 0 14px 30px -10px rgb(0 0 0 / .12);
  --ovl-pop-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 2px 4px -1px rgb(0 0 0 / .08), 0 16px 32px -8px rgb(0 0 0 / .22);
  --ovl-ease: cubic-bezier(.22, 1, .36, 1);
  --ovl-k: 1;
  --ovl-gap-x: 28px; --ovl-gap-y: 32px;
  position: relative; container-type: inline-size; width: 100%;
  font: 13px/20px var(--ovl-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--ovl-t1); -webkit-font-smoothing: antialiased; text-align: left;
}
:is(.dark, [data-theme="dark"]) .ovl {
  --ovl-ink: #fff;
  --ovl-win: #1c1c1e;
  --ovl-pop: #2b2b2f;
  --ovl-accent: #4d8dff;
  --ovl-t1: color-mix(in oklab, var(--ovl-ink) 90%, transparent);
  --ovl-t2: color-mix(in oklab, var(--ovl-ink) 63%, transparent);
  --ovl-t3: color-mix(in oklab, var(--ovl-ink) 48%, transparent);
  --ovl-t4: color-mix(in oklab, var(--ovl-ink) 30%, transparent);
  --ovl-bar: color-mix(in oklab, var(--ovl-ink) 9%, transparent);
  --ovl-fill: color-mix(in oklab, var(--ovl-ink) 7%, transparent);
  --ovl-fill2: color-mix(in oklab, var(--ovl-ink) 13%, transparent);
  --ovl-line: color-mix(in oklab, var(--ovl-ink) 10%, transparent);
  --ovl-ground: color-mix(in oklab, var(--ovl-ink) 5.5%, transparent);
  --ovl-scrim: color-mix(in oklab, #000 46%, transparent);
  --ovl-win-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 4px 0 rgb(0 0 0 / .4), 0 14px 30px -10px rgb(0 0 0 / .5);
  --ovl-pop-shadow: 0 0 0 .5px rgb(255 255 255 / .12), 0 2px 4px -1px rgb(0 0 0 / .4), 0 16px 32px -8px rgb(0 0 0 / .6);
}
html[data-style="mono"] .ovl {
  --ovl-ink: #000; --ovl-win: #fff; --ovl-pop: #fff; --ovl-accent: #111;
  --ovl-win-shadow: 0 0 0 1px rgb(0 0 0 / .16); --ovl-pop-shadow: 0 0 0 1px rgb(0 0 0 / .22);
  --ovl-ease: cubic-bezier(.2, .9, .1, 1); --ovl-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
html[data-style="mono"].dark .ovl { --ovl-ink: #fff; --ovl-win: #0a0a0a; --ovl-pop: #0a0a0a; --ovl-accent: #f2f2f2; --ovl-win-shadow: 0 0 0 1px rgb(255 255 255 / .18); --ovl-pop-shadow: 0 0 0 1px rgb(255 255 255 / .26) }
html[data-style="glass"] .ovl {
  --ovl-ink: var(--pane-ink); --ovl-win: var(--pane-solid); --ovl-pop: var(--pane-solid); --ovl-accent: var(--pane-accent);
  --ovl-ease: var(--pane-ease); --ovl-font: var(--pane-font);
  --ovl-t1: var(--pane-t1); --ovl-t2: var(--pane-t2); --ovl-t3: var(--pane-t3); --ovl-t4: var(--pane-t4);
  --ovl-win-shadow: var(--pane-card); --ovl-pop-shadow: var(--pane-shadow);
}
html[data-style="glass"] .ovl-stage { background-color: color-mix(in oklab, var(--pane-accent) 10%, transparent); background-image: radial-gradient(70% 90% at 12% 8%, color-mix(in oklab, var(--pane-accent) 34%, transparent), transparent 70%), radial-gradient(60% 80% at 92% 100%, color-mix(in oklab, var(--pane-accent) 22%, #e8a0c0), transparent 70%) }
html[data-style="glass"] .ovl-win { background-color: var(--pane-tint); background-image: var(--pane-sheen); -webkit-backdrop-filter: blur(18px) saturate(1.8); backdrop-filter: blur(18px) saturate(1.8) }
html[data-style="glass"].dark .ovl-win { -webkit-backdrop-filter: blur(18px) saturate(1.7); backdrop-filter: blur(18px) saturate(1.7) }
html[data-style="glass"][data-refract] .ovl-win { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
html[data-style="glass"].dark[data-refract] .ovl-win { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
.ovl *, .ovl *::before, .ovl *::after { box-sizing: border-box }
:where(.ovl) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: inherit }
:where(.ovl) p, :where(.ovl) ul, :where(.ovl) li { margin: 0; padding: 0; list-style: none }

/* Grid of six cells */
.ovl-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--ovl-gap-y) var(--ovl-gap-x) }
.ovl[data-compact] { --ovl-gap-x: 20px; --ovl-gap-y: 24px }
@container (min-width: 640px) { .ovl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
@container (min-width: 960px) { .ovl-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) } .ovl-stage { aspect-ratio: 16 / 10 } }
.ovl-cell { display: grid; gap: 14px; align-content: start; transition: opacity calc(.4s * var(--ovl-k)) var(--ovl-ease) }
.ovl-cell[data-dim] { opacity: .38 }

/* The stage: a quiet ground with one window bleeding off the foot */
.ovl-stage {
  position: relative; display: block; width: 100%; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 20px;
  background: var(--ovl-ground); box-shadow: inset 0 0 0 1px var(--ovl-line); cursor: pointer; --crop: 24px;
  transition: background-color .2s var(--ovl-ease);
}
@container (min-width: 420px) and (max-width: 639px) { .ovl-stage { aspect-ratio: 16 / 9 } }
@media (hover: hover) { .ovl-stage:hover { background-color: color-mix(in oklab, var(--ovl-ink) 6.5%, transparent) } }
.ovl-stage:focus-visible { outline: 2px solid var(--ovl-accent); outline-offset: 3px }

.ovl-win {
  position: absolute; left: 16px; right: 16px; top: 16px; bottom: calc(var(--crop) * -1); overflow: hidden;
  border-radius: 12px 12px 0 0; background: var(--ovl-win); box-shadow: var(--ovl-win-shadow);
}
.ovl-vis { position: absolute; inset: 0 0 var(--crop) 0; overflow: hidden; pointer-events: none }
.ovl-page { position: absolute; inset: 0; transition: transform calc(.5s * var(--ovl-k)) var(--ovl-ease) }
.ovl-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 46px; padding: 0 12px; box-shadow: inset 0 -1px 0 var(--ovl-line) }
.ovl-brand { display: flex; align-items: center; gap: 8px; min-width: 0; font-weight: 500; color: var(--ovl-t1); white-space: nowrap }
.ovl-brand i { flex: none; width: 10px; height: 10px; border-radius: 3px; background: var(--ovl-t1) }
.ovl-tools { display: flex; align-items: center; gap: 4px }
.ovl-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 28px; padding: 0 12px; border-radius: 8px; white-space: nowrap;
  font-weight: 500; color: var(--ovl-t1); background: var(--ovl-fill); box-shadow: inset 0 0 0 1px var(--ovl-line);
  transition: background-color .16s var(--ovl-ease), transform .16s var(--ovl-ease);
}
.ovl-btn.is-ink { background: var(--ovl-t1); color: var(--ovl-win); box-shadow: none }
.ovl-ico { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; color: var(--ovl-t3); transition: background-color .16s var(--ovl-ease), color .16s var(--ovl-ease), transform .16s var(--ovl-ease) }
.ovl-ico svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round }
.ovl-st[data-step="2"] [data-target].ovl-btn { background: var(--ovl-fill2); transform: scale(.96) }
.ovl-st[data-step="2"] [data-target].ovl-btn.is-ink { background: var(--ovl-t1); transform: scale(.96) }
.ovl-st[data-step="2"] [data-target].ovl-ico, .ovl-st[data-step="3"] [data-target].ovl-ico { background: var(--ovl-fill); color: var(--ovl-t1) }

.ovl-body { display: grid; gap: 12px; padding: 12px }
.ovl-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px }
.ovl-tile { display: grid; gap: 8px; padding: 10px; border-radius: 10px; box-shadow: inset 0 0 0 1px var(--ovl-line) }
.ovl-tile b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--ovl-t1) }
.ovl-bar { display: block; height: 7px; border-radius: 4px; background: var(--ovl-bar) }
.ovl-rows { display: grid }
.ovl-row { display: flex; align-items: center; gap: 10px; height: 38px; box-shadow: 0 -1px 0 var(--ovl-line) }
.ovl-row:first-child { box-shadow: none }
.ovl-av { flex: none; width: 20px; height: 20px; border-radius: 50%; background: var(--ovl-bar) }
.ovl-row .ovl-bar:nth-child(2) { width: 38% }
.ovl-row .ovl-bar:nth-child(3) { width: 16%; margin-left: auto }

/* Overlays: closed until step 3 */
.ovl-o {
  position: absolute; opacity: 0; filter: blur(4px); pointer-events: none;
  transition: opacity calc(.16s * var(--ovl-k)) var(--ovl-ease), transform calc(.2s * var(--ovl-k)) var(--ovl-ease), filter calc(.16s * var(--ovl-k)) var(--ovl-ease);
}
.ovl-st[data-step="3"] .ovl-o {
  opacity: 1; filter: none; transform: none;
  transition: opacity calc(.34s * var(--ovl-k)) var(--ovl-ease), transform calc(.46s * var(--ovl-k)) var(--ovl-ease), filter calc(.34s * var(--ovl-k)) var(--ovl-ease);
}
.ovl-scrim { inset: 0; background: var(--ovl-scrim); filter: none; transition: opacity calc(.2s * var(--ovl-k)) var(--ovl-ease) }
.ovl-st[data-step="3"] .ovl-scrim { transition: opacity calc(.34s * var(--ovl-k)) var(--ovl-ease) }
.ovl-scrim.is-soft { background: color-mix(in oklab, var(--ovl-scrim) 55%, transparent) }
.ovl-surface { background: var(--ovl-pop); box-shadow: var(--ovl-pop-shadow) }

.ovl-dialog { left: 50%; top: 50%; width: min(78%, 236px); margin: -76px 0 0 calc(min(78%, 236px) / -2); padding: 16px; border-radius: 14px; transform: scale(.96) translateY(6px); transform-origin: var(--ox, 90%) var(--oy, -40px) }
.ovl-title { display: block; font-weight: 500; color: var(--ovl-t1) }
.ovl-copy { display: block; margin-top: 4px; color: var(--ovl-t2) }
.ovl-acts { display: flex; justify-content: flex-end; gap: 6px; margin-top: 14px }
.ovl-btn.is-ghost { background: none; box-shadow: none; color: var(--ovl-t2) }

.ovl-popover { right: 8px; top: 42px; width: 150px; padding: 4px; border-radius: 12px; transform: scale(.95) translateY(-4px); transform-origin: 90% 0 }
.ovl-opt { display: flex; align-items: center; justify-content: space-between; height: 28px; padding: 0 8px; border-radius: 8px; color: var(--ovl-t1) }
.ovl-opt svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round }
.ovl-opt[data-on] { background: var(--ovl-fill) }

.ovl-tip { right: 8px; top: 42px; padding: 3px 9px; border-radius: 8px; white-space: nowrap; background: var(--ovl-t1); color: var(--ovl-win); box-shadow: var(--ovl-pop-shadow); transform: translateY(-3px) scale(.96); transform-origin: 82% 0 }
.ovl-tip::before { content: ""; position: absolute; top: -3px; right: 40px; width: 8px; height: 8px; border-radius: 2px; background: inherit; transform: rotate(45deg) }

.ovl-toast { left: 10px; right: 10px; bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 8px 8px 14px; border-radius: 12px; transform: translateY(14px) scale(.98) }
.ovl-toast > span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ovl-t1) }
.ovl-toast .ovl-btn { height: 26px; padding: 0 10px }

.ovl-sheet { left: 0; right: 0; bottom: calc(var(--crop) * -1); height: calc(64% + var(--crop)); padding: 8px 16px 0; border-radius: 16px 16px 0 0; transform: translateY(40%); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ovl-ink) 10%, transparent), 0 -10px 30px -8px rgb(0 0 0 / .22) }
.ovl-grab { display: block; width: 32px; height: 4px; margin: 0 auto 12px; border-radius: 2px; background: var(--ovl-fill2) }
.ovl-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 40px; box-shadow: 0 -1px 0 var(--ovl-line); color: var(--ovl-t2) }
.ovl-line .ovl-btn { height: 26px; padding: 0 10px }

.ovl-drawer { right: 0; top: 46px; bottom: calc(var(--crop) * -1); width: 54%; padding: 14px 14px 0; border-radius: 0; transform: translateX(34%); box-shadow: -1px 0 0 var(--ovl-line), -16px 0 32px -12px rgb(0 0 0 / .2) }
.ovl-dh { display: flex; align-items: center; justify-content: space-between; height: 24px; margin-bottom: 10px }
.ovl-dh .ovl-ico { width: 24px; height: 24px; margin-right: -6px }
.ovl-field { display: grid; gap: 4px; padding: 10px 0; box-shadow: 0 -1px 0 var(--ovl-line) }
.ovl-field .ovl-bar { width: 30% }
.ovl-field > span:last-child { color: var(--ovl-t1); white-space: nowrap }
.ovl-st[data-step="3"].ovl-has-drawer .ovl-page { transform: translateX(-4%) }

/* Pointer */
.ovl-cursor { position: absolute; left: 0; top: 0; z-index: 4; display: block; pointer-events: none; opacity: 0; transform: translate(var(--sx, 240px), var(--sy, 120px)); transition: opacity .2s var(--ovl-ease), transform calc(.76s * var(--ovl-k)) var(--ovl-ease) }
.ovl-cursor svg { display: block; width: 18px; height: 22px; margin: -2px 0 0 -3px; fill: var(--ovl-t1); stroke: var(--ovl-win); stroke-width: 1.5; stroke-linejoin: round; transform-origin: 3px 2px; transition: transform .14s var(--ovl-ease); filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / .28)) }
.ovl-st:not([data-step="0"]) .ovl-cursor { opacity: 1; transform: translate(var(--tx, 240px), var(--ty, 22px)) }
.ovl-st[data-step="2"] .ovl-cursor svg { transform: scale(.86) }
.ovl-st[data-snap] *, .ovl-st[data-snap] *::before { transition: none !important }

/* Caption */
.ovl-cap { display: grid; gap: 2px; padding: 0 2px }
.ovl-name { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-weight: 500; color: var(--ovl-t1) }
.ovl-n { font: 400 12px/16px ui-monospace, "SF Mono", Menlo, monospace; color: var(--ovl-t4); font-variant-numeric: tabular-nums; letter-spacing: .02em }
.ovl-desc { color: var(--ovl-t3) }

@media (pointer: coarse) { .ovl-stage { -webkit-tap-highlight-color: transparent } }
@media (prefers-reduced-motion: reduce) {
  .ovl *, .ovl *::before, .ovl *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

const ICO_BELL = "M4.5 11V7.2a3.5 3.5 0 017 0V11l1 1.2h-9L4.5 11zM6.6 13.8h2.8"
const ICO_INFO = "M8 7.2v3.6M8 5v.01M8 14a6 6 0 100-12 6 6 0 000 12z"
const ICO_GRID = "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z"
const ICO_X = "M4.5 4.5l7 7M11.5 4.5l-7 7"

function Ico({ d, target }: { d: string; target?: boolean }) {
  return (
    <span className="ovl-ico" data-target={target ? "" : undefined}>
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d={d} />
      </svg>
    </span>
  )
}

const TRIGGER: Record<OverlayKind, string> = { modal: "Delete", popover: "This week", toast: "Save", sheet: "Share", drawer: "Details", tooltip: "" }

function Header({ kind }: { kind: OverlayKind }) {
  return (
    <span className="ovl-head">
      <span className="ovl-brand">
        <i />
        Harbor &amp; Finch
      </span>
      <span className="ovl-tools">
        {kind === "tooltip" ? (
          <>
            <Ico d={ICO_BELL} />
            <Ico d={ICO_INFO} target />
            <Ico d={ICO_GRID} />
          </>
        ) : (
          <span className={cn("ovl-btn", kind === "toast" && "is-ink")} data-target>
            {TRIGGER[kind]}
          </span>
        )}
      </span>
    </span>
  )
}

function Overlay({ kind }: { kind: OverlayKind }) {
  switch (kind) {
    case "modal":
      return (
        <>
          <span className="ovl-o ovl-scrim" />
          <span className="ovl-o ovl-surface ovl-dialog">
            <span className="ovl-title">Delete this report?</span>
            <span className="ovl-copy">It disappears for everyone on the team.</span>
            <span className="ovl-acts">
              <span className="ovl-btn is-ghost">Cancel</span>
              <span className="ovl-btn is-ink">Delete</span>
            </span>
          </span>
        </>
      )
    case "popover":
      return (
        <span className="ovl-o ovl-surface ovl-popover">
          {(["Today", "This week", "This month"] as const).map((t) => (
            <span key={t} className="ovl-opt" data-on={t === "This week" ? "" : undefined}>
              {t}
              {t === "This week" ? (
                <svg viewBox="0 0 16 16" aria-hidden>
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
              ) : null}
            </span>
          ))}
        </span>
      )
    case "tooltip":
      return <span className="ovl-o ovl-tip">Synced 09:41</span>
    case "toast":
      return (
        <span className="ovl-o ovl-surface ovl-toast">
          <span>Saved to Harbor &amp; Finch</span>
          <span className="ovl-btn">Undo</span>
        </span>
      )
    case "sheet":
      return (
        <>
          <span className="ovl-o ovl-scrim is-soft" />
          <span className="ovl-o ovl-surface ovl-sheet">
            <i className="ovl-grab" />
            <span className="ovl-title" style={{ marginBottom: 6 }}>Share report</span>
            <span className="ovl-line">
              <span>3 people</span>
              <span>Can view</span>
            </span>
            <span className="ovl-line">
              <span>Anyone with the link</span>
              <span className="ovl-btn">Copy</span>
            </span>
          </span>
        </>
      )
    case "drawer":
      return (
        <span className="ovl-o ovl-surface ovl-drawer">
          <span className="ovl-dh">
            <span className="ovl-title">Booking 2481</span>
            <Ico d={ICO_X} />
          </span>
          {["Ines Marlow", "Friday 19:30", "4 guests"].map((v) => (
            <span key={v} className="ovl-field">
              <span className="ovl-bar" />
              <span>{v}</span>
            </span>
          ))}
        </span>
      )
  }
}

function Cursor() {
  return (
    <span className="ovl-cursor" aria-hidden>
      <svg viewBox="0 0 18 22">
        <path d="M3 2v15.4l3.7-3.4 2.6 5.9 2.6-1.2-2.6-5.8h5.1z" />
      </svg>
    </span>
  )
}

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/*                                Overlay Atlas                               */
/* -------------------------------------------------------------------------- */

export function OverlayAtlas({ autoplay = true, speed = 1, paused = false, highlight, compact = false, onPick, className }: OverlayAtlasProps) {
  const reduce = React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    prefersReduced,
    () => false,
  )
  const k = 1 / Math.max(0.25, Math.min(4, speed))

  const uid = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(false)
  const [auto, setAuto] = React.useState(true)
  const run = React.useRef({ timers: [] as number[][], playing: [] as boolean[], own: [] as boolean[], k })
  React.useLayoutEffect(() => {
    run.current.k = k
  }, [k])

  const stages = React.useCallback(() => Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-stage]") ?? []), [])

  const setStep = React.useCallback((el: HTMLElement, n: number, snap = false) => {
    if (snap) el.setAttribute("data-snap", "")
    el.setAttribute("data-step", String(n))
    if (snap) {
      void el.offsetWidth
      el.removeAttribute("data-snap")
    }
  }, [])

  const settle = React.useCallback(
    (i: number) => {
      const r = run.current
      ;(r.timers[i] ?? []).forEach(window.clearTimeout)
      r.timers[i] = []
      r.playing[i] = false
      r.own[i] = false
      const el = stages()[i]
      if (el) setStep(el, 3, true)
    },
    [setStep, stages],
  )

  const play = React.useCallback(
    (i: number, fromAuto = false) => {
      const el = stages()[i]
      if (!el) return
      const r = run.current
      ;(r.timers[i] ?? []).forEach(window.clearTimeout)
      r.own[i] = fromAuto
      r.playing[i] = true
      setStep(el, 0, true)
      const tip = el.dataset.kind === "tooltip"
      const t1 = 70
      const t2 = t1 + 780 * r.k
      const t3 = t2 + (tip ? 460 : 200) * r.k
      r.timers[i] = [
        window.setTimeout(() => setStep(el, 1), t1),
        window.setTimeout(() => setStep(el, 2), t2),
        window.setTimeout(() => {
          setStep(el, 3)
          r.playing[i] = false
        }, t3),
      ]
    },
    [setStep, stages],
  )

  // Measure where each trigger sits so the pointer can land on it, and where the modal grows from.
  React.useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      for (const st of stages()) {
        const s = st.getBoundingClientRect()
        if (!s.width) continue
        const t = st.querySelector<HTMLElement>("[data-target]")?.getBoundingClientRect()
        if (!t) continue
        const icon = st.dataset.kind === "tooltip"
        const tx = t.left - s.left + (icon ? t.width / 2 + 2 : t.width - 12)
        const ty = t.top - s.top + (icon ? t.height / 2 + 5 : t.height - 8)
        st.style.setProperty("--tx", `${tx.toFixed(1)}px`)
        st.style.setProperty("--ty", `${ty.toFixed(1)}px`)
        st.style.setProperty("--sx", `${Math.min(s.width - 24, tx + 36).toFixed(1)}px`)
        st.style.setProperty("--sy", `${Math.min(s.height - 24, ty + 108).toFixed(1)}px`)
        const d = st.querySelector<HTMLElement>(".ovl-dialog")?.getBoundingClientRect()
        if (d) {
          st.style.setProperty("--ox", `${(t.left + t.width / 2 - d.left).toFixed(1)}px`)
          st.style.setProperty("--oy", `${(t.top + t.height / 2 - d.top).toFixed(1)}px`)
        }
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    return () => ro.disconnect()
  }, [stages])

  // Run only while on screen and in a visible tab.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let onScreen = false
    const update = () => setActive(onScreen && document.visibilityState === "visible")
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((x) => x.isIntersecting)
      update()
    })
    io.observe(el)
    document.addEventListener("visibilitychange", update)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])

  // The built-in cascade: cells on screen play one after another, rest open, then go again.
  // A cell that scrolls into view later (one column on a phone) plays when it arrives.
  React.useEffect(() => {
    if (!autoplay || !auto || paused || !active || reduce) return
    const r = run.current
    const ids: number[] = []
    const seen: boolean[] = []
    const els = stages()
    const n = SCENES.length
    const io = new IntersectionObserver(
      (entries) => {
        for (const x of entries) {
          const i = els.indexOf(x.target as HTMLElement)
          if (i < 0) continue
          const was = seen[i]
          seen[i] = x.isIntersecting
          if (x.isIntersecting && was === false && !r.playing[i]) ids.push(window.setTimeout(() => play(i, true), 200))
        }
      },
      { threshold: 0.5 },
    )
    els.forEach((el) => io.observe(el))
    const cycle = () => {
      let slot = 0
      for (let i = 0; i < n; i++) {
        if (seen[i] === false) continue
        ids.push(window.setTimeout(() => play(i, true), slot++ * 640 * r.k))
      }
      ids.push(window.setTimeout(cycle, (n * 640 + 1500) * r.k + 4200))
    }
    ids.push(window.setTimeout(cycle, 900))
    return () => {
      io.disconnect()
      ids.forEach(window.clearTimeout)
      for (let i = 0; i < n; i++) if (r.own[i] && !r.playing[i]) settle(i)
    }
  }, [autoplay, auto, paused, active, reduce, play, settle, stages])

  // Any touch or key press anywhere ends the built-in cascade for good.
  React.useEffect(() => {
    const stop = () => setAuto(false)
    window.addEventListener("pointerdown", stop, true)
    window.addEventListener("keydown", stop, true)
    return () => {
      window.removeEventListener("pointerdown", stop, true)
      window.removeEventListener("keydown", stop, true)
    }
  }, [])

  React.useEffect(() => {
    const r = run.current
    return () => r.timers.forEach((l) => l?.forEach(window.clearTimeout))
  }, [])

  const replay = (i: number) => {
    setAuto(false)
    if (!reduce && !run.current.playing[i]) play(i)
  }

  return (
    <div ref={rootRef} className={cn("ovl", className)} data-compact={compact ? "" : undefined} style={{ "--ovl-k": k } as React.CSSProperties}>
      <style href="overlay-atlas" precedence="default">
        {CSS}
      </style>
      <div className="ovl-grid" role="list" aria-label="Overlay types">
        {SCENES.map((s, i) => (
          <div key={s.kind} className="ovl-cell" role="listitem" data-dim={highlight && highlight !== s.kind ? "" : undefined}>
            <button
              type="button"
              className={cn("ovl-stage ovl-st", s.kind === "drawer" && "ovl-has-drawer")}
              data-stage
              data-kind={s.kind}
              data-step="3"
              aria-label={`Replay ${s.name}`}
              aria-describedby={compact ? undefined : `${uid}-${s.kind}`}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") replay(i)
              }}
              onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) replay(i)
              }}
              onClick={() => {
                replay(i)
                onPick?.(s.kind)
              }}
            >
              <span className="ovl-win" aria-hidden>
                <span className="ovl-page">
                  <Header kind={s.kind} />
                  <span className="ovl-body">
                    <span className="ovl-tiles">
                      {[
                        ["128", "34%"],
                        ["94%", "46%"],
                        ["$4.2k", "40%"],
                      ].map(([v, w]) => (
                        <span key={v} className="ovl-tile">
                          <span className="ovl-bar" style={{ width: w }} />
                          <b>{v}</b>
                        </span>
                      ))}
                    </span>
                    <span className="ovl-rows">
                      {[0, 1, 2, 3, 4].map((r) => (
                        <span key={r} className="ovl-row">
                          <i className="ovl-av" />
                          <span className="ovl-bar" style={r % 2 ? { width: "30%" } : undefined} />
                          <span className="ovl-bar" />
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
                <span className="ovl-vis">
                  <Overlay kind={s.kind} />
                </span>
              </span>
              <Cursor />
            </button>
            <div className="ovl-cap">
              <span className="ovl-name">
                {s.name}
                <span className="ovl-n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
              </span>
              {compact ? null : <span className="ovl-desc" id={`${uid}-${s.kind}`}>{s.line}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

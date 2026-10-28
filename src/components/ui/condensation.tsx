"use client"

import * as React from "react"
import { Brain, CloudFog, Eye, Hand, ShieldCheck } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type CondensationSecret = {
  id: string
  /** Visible label above the fog, such as "Production key". */
  label: string
  /** Small tag next to the label, such as "Read + write". */
  scope?: string
  /** Visible line under the value, such as "Used 4 min ago by Sage". */
  meta?: string
  /** The secret itself. It only enters the DOM while the glass is being wiped. */
  value: string
}

export type CondensationMemory = {
  id: string
  /** Visible topic above the fog, such as "Billing". */
  topic: string
  /** What the agent remembers. It only enters the DOM while the glass is being wiped. */
  text: string
}

/** Methods for the `ref`. */
export type CondensationHandle = {
  /** Play the scripted wipe again. */
  replay: () => void
  /** Fog everything back over now. */
  fog: () => void
}

export type CondensationProps = {
  /** Panel title. */
  title?: string
  /** Line under the title. */
  subtitle?: string
  /** Heading of the secrets card. */
  secretsTitle?: string
  /** The secrets, each one a row. */
  secrets?: CondensationSecret[]
  /** Heading of the memory card. */
  memoryTitle?: string
  /** Things the agent remembers. */
  memories?: CondensationMemory[]
  /** Consequence line under the glass, shown until something is read. */
  footnote?: string
  /** How long a wiped trail stays fully clear, in ms. Default 2000. */
  holdMs?: number
  /** How long the fog takes to creep back, in ms. Default 6000. */
  fadeMs?: number
  /** How long a keyboard peek stays clear, in ms. Default 5000. */
  peekMs?: number
  /** Hero layout for screenshots and film: no outer card, one column, type that scales with the width (about 2.1% of it), no footnote. */
  stage?: boolean
  /** Play one scripted wipe the first time the piece is seen. On by default only when you pass no data. Scripted strokes never call `onReveal`. */
  demo?: boolean
  /** Wait before the scripted wipe starts once the piece is on screen, in ms. Default 400. */
  demoDelayMs?: number
  /** Speed of the scripted wipe. 1 is normal, 2 is twice as fast. */
  demoSpeed?: number
  /** Called once per wipe session for each item that becomes readable by a real pointer or key press. */
  onReveal?: (id: string) => void
  ref?: React.Ref<CondensationHandle>
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                Demo content                                */
/* -------------------------------------------------------------------------- */

const SECRETS: CondensationSecret[] = [
  { id: "prod", label: "Production key", scope: "Read + write", meta: "Used 4 min ago by Sage", value: "hf_live_EXAMPLE_7Kq2vN9xWm4T" },
  { id: "stage", label: "Staging key", scope: "Read + write", meta: "Used yesterday by Quill", value: "hf_test_EXAMPLE_3Fh8sJ1yPa6Q" },
  { id: "hook", label: "Webhook signing secret", scope: "Verify only", meta: "Rotated 12 days ago", value: "hf_hook_EXAMPLE_9Vb4TnK7mDx2" },
]

const MEMORIES: CondensationMemory[] = [
  { id: "m-billing", topic: "Billing", text: "Invoices go out on the 1st, to ap@harborfinch.example, in euros." },
  { id: "m-voice", topic: "Voice", text: "Short sentences, no exclamation marks. Signs off with “Thanks, Mara”." },
  { id: "m-people", topic: "People", text: "Dev Okafor at Northwind Clinics owns the renewal." },
  { id: "m-time", topic: "Schedule", text: "No meetings before 10:00 on Thursdays." },
]

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

/** Fog texture: low-frequency clouds (uneven density), a few large resting droplets, then a fine grain layer. */
function makeFogTexture() {
  let s = 91
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  const grain = (() => {
    let drops = ""
    for (let i = 0; i < 34; i++) {
      const big = r() > 0.82
      const rad = big ? 1.8 + r() * 1.3 : 0.5 + r() * 0.8
      const cx = (r() * 220).toFixed(1)
      const cy = (r() * 220).toFixed(1)
      drops += big
        ? `<circle cx="${cx}" cy="${cy}" r="${rad.toFixed(2)}" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/><circle cx="${(+cx - rad * 0.3).toFixed(1)}" cy="${(+cy - rad * 0.35).toFixed(1)}" r="${(rad * 0.28).toFixed(2)}" fill="#fff" fill-opacity=".9"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${rad.toFixed(2)}" fill="#fff" fill-opacity="${(0.28 + r() * 0.3).toFixed(2)}"/>`
    }
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">` +
      `<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="7" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.5 -.55"/></filter>` +
      `<rect width="220" height="220" filter="url(#n)"/>${drops}</svg>`
    )
  })()
  const cloud = (() => {
    let drops = ""
    for (let i = 0; i < 15; i++) {
      const rad = 2.6 + r() * 4.4
      const cx = 14 + r() * 372
      const cy = 14 + r() * 372
      drops +=
        `<ellipse cx="${(cx + rad * 0.3).toFixed(1)}" cy="${(cy + rad * 0.75).toFixed(1)}" rx="${(rad * 1.05).toFixed(1)}" ry="${(rad * 0.8).toFixed(1)}" fill="#142a5c" fill-opacity=".13"/>` +
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad.toFixed(1)}" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-opacity=".72" stroke-width=".9"/>` +
        `<path d="M${(cx + rad * 0.86).toFixed(1)} ${(cy + rad * 0.3).toFixed(1)} A${rad.toFixed(1)} ${rad.toFixed(1)} 0 0 1 ${(cx - rad * 0.2).toFixed(1)} ${(cy + rad * 0.96).toFixed(1)}" fill="none" stroke="#142a5c" stroke-opacity=".3" stroke-width=".9"/>` +
        `<ellipse cx="${(cx - rad * 0.36).toFixed(1)}" cy="${(cy - rad * 0.4).toFixed(1)}" rx="${(rad * 0.3).toFixed(1)}" ry="${(rad * 0.2).toFixed(1)}" fill="#fff" fill-opacity=".96" transform="rotate(-34 ${(cx - rad * 0.36).toFixed(1)} ${(cy - rad * 0.4).toFixed(1)})"/>`
    }
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">` +
      `<filter id="c" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011 .014" numOctaves="3" seed="19" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 2.6 -.9"/></filter>` +
      `<rect width="400" height="400" filter="url(#c)" opacity=".7"/>${drops}</svg>`
    )
  })()
  const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  return `${url(cloud)}, ${url(grain)}`
}

const RING_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><circle cx="22" cy="22" r="18.5" fill="rgba(255,255,255,.07)" stroke="rgba(0,0,0,.28)" stroke-width="3.2"/><circle cx="22" cy="22" r="18.5" fill="none" stroke="#fff" stroke-width="1.6"/></svg>`,
)}") 22 22, crosshair`

const CSS = `
.icn {
  --icn-ink: #000; --icn-surface: #fff; --icn-accent: #0060e2;
  --icn-t1: color-mix(in oklab, var(--icn-ink) 88%, transparent);
  --icn-t2: color-mix(in oklab, var(--icn-ink) 61%, transparent);
  --icn-t3: color-mix(in oklab, var(--icn-ink) 45%, transparent);
  --icn-t4: color-mix(in oklab, var(--icn-ink) 27%, transparent);
  --icn-fill: color-mix(in oklab, var(--icn-ink) 6%, transparent);
  --icn-fill2: color-mix(in oklab, var(--icn-ink) 10%, transparent);
  --icn-line: color-mix(in oklab, var(--icn-ink) 8%, transparent);
  --icn-amber: #7a4200;
  --icn-amberbg: color-mix(in oklab, #f59e0b 26%, var(--icn-surface));
  /* fog colours are derived from the tokens, so Classic, Mono and Glass restyle them */
  --icn-opaque: color-mix(in oklab, var(--icn-surface) 88%, var(--icn-accent));
  --icn-hazec: color-mix(in oklab, var(--icn-surface) 84%, var(--icn-accent));
  --icn-haze: 60%;
  --icn-blur: 14px; --icn-sat: 150%;
  --icn-vig: .3;
  --icn-slot: color-mix(in oklab, var(--icn-ink) 5%, transparent);
  --icn-vaultbg: color-mix(in oklab, var(--icn-surface) 82%, transparent);
  --icn-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --icn-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --icn-glint: rgb(255 255 255 / .82);
  --icn-ease: cubic-bezier(.22, 1, .36, 1);
  --icn-rim: .95;
  --icn-grain: .9;
  --icn-r: 28px; --icn-rv: 20px;
  --icn-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  container: icn / inline-size;
  position: relative; display: block; width: 100%; max-width: 780px; margin-inline: auto; text-align: left;
  font: 13px/20px var(--icn-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--icn-t1); -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .icn {
  --icn-ink: #fff; --icn-surface: #1c1c1e; --icn-accent: #4d8dff;
  --icn-t1: color-mix(in oklab, var(--icn-ink) 90%, transparent);
  --icn-t2: color-mix(in oklab, var(--icn-ink) 62%, transparent);
  --icn-t3: color-mix(in oklab, var(--icn-ink) 46%, transparent);
  --icn-t4: color-mix(in oklab, var(--icn-ink) 28%, transparent);
  --icn-fill: color-mix(in oklab, var(--icn-ink) 8%, transparent);
  --icn-fill2: color-mix(in oklab, var(--icn-ink) 13%, transparent);
  --icn-line: color-mix(in oklab, var(--icn-ink) 10%, transparent);
  --icn-amber: #f5b14a;
  /* night fog is lighter than the glass it covers: breath scatters the street light */
  --icn-opaque: color-mix(in oklab, #d8d4f6 24%, color-mix(in oklab, var(--icn-surface) 86%, var(--icn-accent)));
  --icn-hazec: color-mix(in oklab, #d6d1f4 62%, var(--icn-accent));
  --icn-haze: 40%;
  --icn-vig: .14;
  --icn-slot: color-mix(in oklab, var(--icn-surface) 52%, transparent);
  --icn-vaultbg: color-mix(in oklab, var(--icn-surface) 24%, transparent);
  --icn-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --icn-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
  --icn-glint: rgb(255 255 255 / .9);
  --icn-rim: .85;
  --icn-grain: .34;
}
html[data-style="mono"] .icn { --icn-r: 4px; --icn-rv: 3px; --icn-blur: 10px; --icn-sat: 100% }
html[data-style="glass"] .icn { --icn-haze: 30%; --icn-blur: 18px; --icn-sat: 210%; --icn-vig: .2 }
.icn *, .icn *::before, .icn *::after { box-sizing: border-box }
:where(.icn) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.icn) ul { list-style: none; margin: 0; padding: 0 }
:where(.icn) p { margin: 0 }
.icn :focus-visible { outline: 2px solid color-mix(in oklab, var(--icn-accent) 60%, transparent); outline-offset: 1px }
.icn-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }

/* ---- Tier 0: the safe, opaque glass (also reduced transparency, high contrast, no backdrop-filter) ---- */
.icn-panel {
  position: relative; border-radius: var(--icn-r); overflow: hidden;
  background: color-mix(in oklab, var(--icn-surface) 93%, transparent);
  border: 1px solid color-mix(in oklab, var(--icn-ink) 14%, transparent);
  box-shadow: var(--icn-float), 0 18px 48px -16px rgb(14 16 48 / .34);
}
.icn-bd { position: absolute; inset: 0; border-radius: inherit; z-index: 0; pointer-events: none }
.icn-panel::before {
  content: ""; position: absolute; inset: 0; padding: 1.5px; border-radius: inherit; z-index: 5; pointer-events: none; opacity: var(--icn-rim);
  background: linear-gradient(135deg, var(--icn-glint), rgb(255 255 255 / .12) 30%, transparent 50%, rgb(255 255 255 / .12) 70%, rgb(255 255 255 / .6));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
}
.icn-body { position: relative; z-index: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px }
@container icn (min-width: 520px) { .icn-body { padding: 22px 22px 18px; gap: 16px } }

/* header */
.icn-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px }
.icn-head > * { animation: icn-in .5s var(--icn-ease) backwards }
.icn-head > :nth-child(2) { animation-delay: .05s }
.icn-head > :nth-child(3) { animation-delay: .1s }
.icn-tile { flex: none; width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: var(--icn-accent);
  background: color-mix(in oklab, var(--icn-accent) 13%, transparent); box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--icn-accent) 24%, transparent) }
.icn-tile svg { width: 19px; height: 19px }
.icn-titles { flex: 1 1 160px; min-width: 0 }
.icn-title { font-size: 15px; line-height: 20px; font-weight: 500; letter-spacing: -.005em; color: var(--icn-t1) }
.icn-sub { font-size: 12.5px; line-height: 18px; color: var(--icn-t3) }
.icn-tools { display: flex; align-items: center; gap: 8px }
@container icn (max-width: 519px) { .icn-tools { flex: 1 1 100%; justify-content: space-between } }
.icn-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px 0 9px; border-radius: 999px; font-size: 12.5px; font-weight: 500; white-space: nowrap;
  color: var(--icn-t2); background: var(--icn-fill); transition: background-color .4s var(--icn-ease), color .4s var(--icn-ease) }
.icn-chip svg { width: 14px; height: 14px; flex: none }
.icn-chip[data-clear] { color: var(--icn-amber); background: var(--icn-amberbg) }
.icn-chip b { font-weight: 500; font-variant-numeric: tabular-nums; display: inline-block; min-width: 2ch; text-align: left }
@container icn (max-width: 519px) { .icn-chip-long { display: none } }
.icn-swap { display: inline-block; animation: icn-swap .42s var(--icn-ease) backwards }
.icn-fogbtn { display: inline-flex; align-items: center; gap: 7px; height: 28px; padding: 0 8px 0 10px; border-radius: 8px; font-size: 12.5px; font-weight: 500; color: var(--icn-t1);
  background: var(--icn-fill); transition: background-color .2s var(--icn-ease), opacity .3s var(--icn-ease), transform .2s var(--icn-ease) }
.icn-fogbtn:hover { background: var(--icn-fill2) }
.icn-fogbtn:active { transform: scale(.97) }
.icn-fogbtn[aria-disabled="true"] { opacity: .45; cursor: default }
.icn-fogbtn[aria-disabled="true"]:hover { background: var(--icn-fill) }
.icn-fogbtn svg { width: 14px; height: 14px }
.icn-kbd { font: 500 10.5px/16px var(--icn-mono); padding: 0 5px; border-radius: 5px; color: var(--icn-t3); background: var(--icn-fill); box-shadow: inset 0 0 0 .5px var(--icn-line) }
@media (hover: none) { .icn-kbd { display: none } .icn-fogbtn { padding-right: 10px } }

/* the vault: one sheet of glass with two sections, under one sheet of fog */
.icn-glass { position: relative; margin-bottom: 14px }
.icn-vault { position: relative; z-index: 0; display: grid; grid-template-columns: minmax(0, 1fr); border-radius: var(--icn-rv); overflow: hidden; touch-action: pan-y;
  background: var(--icn-vaultbg); box-shadow: var(--icn-shadow) }
.icn-vault::after { content: ""; position: absolute; inset: 0; border-radius: inherit; z-index: 3; pointer-events: none;
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--icn-ink) 12%, transparent), inset 0 1px 0 rgb(255 255 255 / .5) }
:is(.dark, [data-theme="dark"]) .icn-vault::after { box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .12), inset 0 1px 0 rgb(255 255 255 / .08) }
.icn-card { position: relative; display: flex; flex-direction: column; min-width: 0 }
.icn-card + .icn-card::before { content: ""; position: absolute; left: 14px; right: 14px; top: 0; height: 1px; background: var(--icn-line); z-index: 3; pointer-events: none }
@container icn (min-width: 640px) {
  .icn:not([data-stage]) .icn-vault[data-cols="2"] { grid-template-columns: minmax(0, 1.14fr) minmax(0, 1fr) }
  .icn:not([data-stage]) .icn-card + .icn-card::before { left: 0; right: auto; top: 14px; bottom: 14px; width: 1px; height: auto }
}
/* everything that stays sharp above the fog */
.icn-up { position: relative; z-index: 3; pointer-events: none; text-shadow: 0 0 10px color-mix(in oklab, var(--icn-surface) 75%, transparent) }
.icn-cardhead { display: flex; align-items: center; gap: 8px; padding: 10px 14px 6px 14px; min-height: 46px }
.icn-cardhead > .icn-up:first-child { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; color: var(--icn-t2) }
.icn-cardhead svg { width: 14px; height: 14px; flex: none }
.icn-count { margin-left: auto; white-space: nowrap; font-size: 12px; color: var(--icn-t3); font-variant-numeric: tabular-nums }
.icn-cardhead .icn-peek { margin-left: 2px }

.icn-list { flex: 1; display: flex; flex-direction: column }
.icn-key { position: relative; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "head peek" "slot slot" "meta meta"; align-content: center; align-items: center; column-gap: 8px; row-gap: 4px; padding: 9px 14px 10px }
.icn-key::before { content: ""; position: absolute; left: 14px; right: 14px; top: 0; height: 1px; background: var(--icn-line); z-index: 3; pointer-events: none }
.icn-key:first-child::before { display: none }
.icn-keyhead { grid-area: head; display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap }
.icn-label { font-size: 13px; line-height: 20px; font-weight: 500; color: var(--icn-t1) }
.icn-scope { font-size: 11.5px; line-height: 16px; padding: 1px 7px; border-radius: 6px; color: var(--icn-t2); background: var(--icn-fill); white-space: nowrap }
.icn-key > .icn-peek { grid-area: peek }
.icn-slot { grid-area: slot; border-radius: 9px; padding: 5px 11px; background: var(--icn-slot); min-height: 32px; display: flex; align-items: center }
.icn-val, .icn-note { font-family: var(--icn-mono); font-size: 12.5px; line-height: 20px; letter-spacing: .01em; color: var(--icn-t1); font-weight: 600; overflow-wrap: anywhere; user-select: none; -webkit-user-select: none }
.icn-val[data-shown], .icn-note[data-shown] { animation: icn-text .18s ease-out backwards }
.icn-slot[data-open] .icn-val, .icn-slot[data-open] .icn-note { user-select: text; -webkit-user-select: text }
@container icn (max-width: 430px) { .icn-val { font-size: 11.5px; letter-spacing: 0 } }
.icn-meta { grid-area: meta; font-size: 12px; line-height: 16px; color: var(--icn-t3) }

.icn-mem { position: relative; padding: 0 14px 6px; display: flex; flex-direction: column; flex: 1 }
.icn-memrow { position: relative; flex: 1; padding: 8px 0 9px; display: flex; flex-direction: column; justify-content: center; gap: 4px }
.icn-memrow::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--icn-line); z-index: 3; pointer-events: none }
.icn-topic { font-size: 11.5px; line-height: 16px; font-weight: 500; color: var(--icn-t3) }
.icn-memrow .icn-slot { min-height: 0; padding: 5px 10px; display: block }
.icn-note { font-family: var(--icn-font, Inter, ui-sans-serif, system-ui, sans-serif); font-size: 13px; letter-spacing: 0; font-weight: 400 }

.icn-peek { flex: none; width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; position: relative; z-index: 3; color: var(--icn-t2);
  background: var(--icn-fill); transition: background-color .2s var(--icn-ease), transform .2s var(--icn-ease), color .2s var(--icn-ease) }
.icn-peek:hover { background: var(--icn-fill2); color: var(--icn-t1) }
.icn-peek:active { transform: scale(.94) }
.icn-peek svg { width: 14px; height: 14px }

/* ---- the fog ---- */
.icn-frost {
  position: absolute; inset: 0; z-index: 2; border-radius: inherit; touch-action: pan-y; cursor: ${RING_CURSOR}; user-select: none; -webkit-user-select: none;
  -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  background-color: var(--icn-opaque);
  background-image:
    linear-gradient(var(--icn-light, 135deg), rgb(255 255 255 / .42), rgb(255 255 255 / 0) 46%),
    linear-gradient(180deg, rgb(255 255 255 / 0) 55%, rgb(255 255 255 / .14));
  box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .4);
}
/* thicker at the edges, thinner in the middle, and a slow breath when it first settles */
.icn-frost::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(125% 100% at 50% 44%, transparent 28%, rgb(255 255 255 / var(--icn-vig)) 100%);
  animation: icn-breathe 2.6s ease-in-out backwards }
.icn-frost::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: var(--icn-grain);
  background-image: ${makeFogTexture()}; background-size: 400px 400px, 220px 220px }
.icn-rim, .icn-fx { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; border-radius: inherit }
.icn-rim { z-index: 4; opacity: var(--icn-rim) }
.icn-fx { z-index: 4 }
.icn-hint { position: absolute; left: 50%; bottom: 0; z-index: 6; transform: translate(-50%, 50%); pointer-events: none; display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 13px 0 10px;
  border-radius: 999px; font-size: 12.5px; font-weight: 500; color: var(--icn-t1); white-space: nowrap;
  background: color-mix(in oklab, var(--icn-surface) 84%, transparent); box-shadow: var(--icn-float), inset 0 0 0 .5px rgb(255 255 255 / .6);
  opacity: 0; filter: blur(4px); transition: opacity .35s var(--icn-ease), filter .35s var(--icn-ease) }
.icn-hint[data-on] { opacity: 1; filter: none }
.icn-hint svg { width: 15px; height: 15px; color: var(--icn-accent) }
.icn-hint-t { display: none }
@media (hover: none) { .icn-hint-t { display: inline } .icn-hint-m { display: none } }

/* foot */
.icn-foot { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; line-height: 18px; color: var(--icn-t2); min-height: 36px; padding-inline: 2px }
.icn-foot svg { width: 14px; height: 14px; margin-top: 2px; flex: none; color: var(--icn-t3) }

@keyframes icn-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } to { opacity: 1; transform: none; filter: none } }
@keyframes icn-swap { from { opacity: 0; filter: blur(5px); transform: translateY(2px) } to { opacity: 1; filter: none; transform: none } }
@keyframes icn-text { from { opacity: 0 } to { opacity: 1 } }
@keyframes icn-breathe { 0% { opacity: .35 } 38% { opacity: 1 } 68% { opacity: .78 } 100% { opacity: 1 } }

/* ---- Stage: the hero layout for film and screenshots. No card, one column, type scales with the width ---- */
.icn[data-stage] { max-width: 760px }
.icn[data-stage] .icn-panel { font-size: clamp(11px, 2.1cqw, 26px); background: none; border: 0; box-shadow: none; border-radius: 0; overflow: visible }
.icn[data-stage] .icn-panel::before, .icn[data-stage] .icn-bd, .icn[data-stage] .icn-foot, .icn[data-stage] .icn-fogbtn { display: none }
.icn[data-stage] .icn-body { padding: 0; gap: 1.15em }
.icn[data-stage] .icn-head { --icn-t1: var(--icn-stage-ink, #fff); --icn-t2: rgb(255 255 255 / .82); --icn-t3: rgb(255 255 255 / .72); text-shadow: 0 1px 14px rgb(10 12 40 / .45) }
.icn[data-stage] .icn-chip { text-shadow: none }
.icn[data-stage] .icn-tile { width: 2.9em; height: 2.9em; border-radius: .9em }
.icn[data-stage] .icn-tile { color: #fff; background: rgb(255 255 255 / .2); box-shadow: inset 0 0 0 .5px rgb(255 255 255 / .4) }
.icn[data-stage] .icn-tile svg { width: 1.4em; height: 1.4em }
.icn[data-stage] .icn-title { font-size: 1.5em; line-height: 1.25 }
.icn[data-stage] .icn-sub { font-size: .95em; line-height: 1.4 }
.icn[data-stage] .icn-chip { height: 2.1em; font-size: .95em; padding: 0 .95em 0 .75em; gap: .45em }
.icn[data-stage] .icn-chip svg { width: 1.05em; height: 1.05em }
.icn[data-stage] .icn-vault { grid-template-columns: minmax(0, 1fr); border-radius: 1.4em }
.icn[data-stage] .icn-glass { margin-bottom: 1.1em }
.icn[data-stage] .icn-cardhead { padding: .75em 1.2em .35em; min-height: 3em; gap: .6em }
.icn[data-stage] .icn-cardhead > .icn-up:first-child { font-size: .95em; gap: .5em }
.icn[data-stage] .icn-cardhead svg { width: 1em; height: 1em }
.icn[data-stage] .icn-count { font-size: .9em }
.icn[data-stage] .icn-key { padding: .55em 1.2em .6em; row-gap: .25em }
.icn[data-stage] .icn-key::before, .icn[data-stage] .icn-card + .icn-card::before { left: 1.2em; right: 1.2em }
.icn[data-stage] .icn-keyhead { gap: .6em }
.icn[data-stage] .icn-label { font-size: 1.08em; line-height: 1.4 }
.icn[data-stage] .icn-scope { font-size: .8em; line-height: 1.35; padding: .05em .55em; border-radius: .45em }
.icn[data-stage] .icn-slot { min-height: 2.45em; padding: .3em .85em; border-radius: .65em }
.icn[data-stage] .icn-val { font-size: 1.12em; line-height: 1.5; letter-spacing: .01em }
.icn[data-stage] .icn-meta { font-size: .86em; line-height: 1.3 }
.icn[data-stage] .icn-mem { padding: 0 1.2em .4em }
.icn[data-stage] .icn-memrow { padding: .5em 0 .55em; gap: .25em }
.icn[data-stage] .icn-topic { font-size: .84em; line-height: 1.3 }
.icn[data-stage] .icn-memrow .icn-slot { padding: .3em .85em; min-height: 2.45em; display: flex; align-items: center }
.icn[data-stage] .icn-note { font-size: 1.04em; line-height: 1.45 }
.icn[data-stage] .icn-peek { width: 2.1em; height: 2.1em }
.icn[data-stage] .icn-peek svg { width: 1em; height: 1em }
.icn[data-stage] .icn-hint { height: 2.3em; font-size: .88em; padding: 0 1em 0 .8em }

/* ---- Tier 1: frosted glass with a lit rim. Needs backdrop-filter and no reduced-transparency preference ---- */
@media (prefers-reduced-transparency: no-preference) {
  @supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
    /* Two blur layers on purpose: the panel frosts the scene, the fog frosts the panel. They never overlap text. */
    .icn-panel { background: color-mix(in oklab, var(--icn-surface) 52%, transparent); border-color: transparent;
      box-shadow: var(--icn-float), 0 18px 48px -16px rgb(14 16 48 / .34), inset 0 0 0 .5px rgb(255 255 255 / .55), inset 0 1px 3px rgb(255 255 255 / .22) }
    .icn-bd { -webkit-backdrop-filter: blur(16px) saturate(180%); backdrop-filter: blur(16px) saturate(180%) }
    .icn-frost {
      background-color: color-mix(in oklab, var(--icn-hazec) var(--icn-haze), transparent);
      background-image:
        linear-gradient(var(--icn-light, 135deg), rgb(255 255 255 / .5), rgb(255 255 255 / 0) 46%),
        linear-gradient(180deg, rgb(255 255 255 / 0) 50%, rgb(255 255 255 / .16));
      -webkit-backdrop-filter: blur(var(--icn-blur)) saturate(var(--icn-sat)); backdrop-filter: blur(var(--icn-blur)) saturate(var(--icn-sat));
    }
    .icn[data-stage] .icn-panel { background: none; box-shadow: none }
  }
}
@media (prefers-contrast: more) {
  .icn-panel { background: var(--icn-surface); border: 2px solid var(--icn-ink); box-shadow: none }
  .icn-panel::before { display: none }
  .icn-frost { background-image: none; background-color: var(--icn-opaque); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: inset 0 0 0 2px var(--icn-ink) }
  .icn-frost::before, .icn-frost::after { display: none }
}
@media (forced-colors: active) {
  .icn-panel { background: Canvas; border: 1px solid CanvasText }
  .icn-panel::before { display: none }
  .icn-bd, .icn-frost { -webkit-backdrop-filter: none; backdrop-filter: none }
  .icn-frost { background-image: none; background-color: Canvas; border: 1px solid CanvasText }
  .icn-frost::before, .icn-frost::after { display: none }
}
@media (prefers-reduced-motion: reduce) {
  .icn *, .icn *::before, .icn *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                         Engine (canvas mask + beads)                       */
/* -------------------------------------------------------------------------- */

type Rect = { l: number; t: number; r: number; b: number }
type Item = { id: string; label: string; kind: string; rect: Rect }
/** `q` marks a scripted (demo) stamp: it clears the glass but is not a real read. */
type Stamp = { x: number; y: number; r: number; t: number; hold: number; fade: number; grow: number; n: number; q?: boolean; only?: string[]; ov?: { k0: number; t: number; d: number } }
type Bead = { x: number; y: number; r: number; born: number; st: Stamp; dripAt: number; dripLen: number; y0: number; sy: number; vy: number; state: 0 | 1 | 2 }
type Pen = { last: { x: number; y: number } | null; raw: { x: number; y: number } | null; mid: { x: number; y: number } | null; path: number; next: number; q?: boolean }
type Stroke = { pts: { x: number; y: number }[]; cum: number[]; start: number; dur: number; pen: Pen }
type ReadItem = { id: string; label: string; kind: string }

type UiState = { armed: boolean; readable: string[]; near: string[]; remain: number; read: ReadItem[] }
type EngineCfg = { hold: number; fade: number; peek: number; reduce: boolean; speed: number; onReveal?: (id: string) => void }

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const smooth = (x: number) => x * x * (3 - 2 * x)
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
const easeIO = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2

/** 0..1: how clear a stamp still is. */
function life(st: Stamp, now: number) {
  const age = now - st.t
  if (age < 0) return 0
  const d = age - st.hold
  let s = d <= 0 ? 1 : 1 - smooth(Math.min(1, d / st.fade))
  if (st.ov) s = Math.min(s, st.ov.k0 * (1 - smooth(Math.min(1, Math.max(0, (now - st.ov.t) / st.ov.d)))))
  return s
}
function alive(st: Stamp, now: number) {
  if (now - st.t > st.hold + st.fade * 0.93) return false
  if (st.ov && now - st.ov.t >= st.ov.d) return false
  return true
}
function effRadius(st: Stamp, s: number, now: number) {
  const age = now - st.t
  const g = st.grow ? easeOut(Math.min(1, Math.max(0, age / st.grow))) : 1
  return st.r * g * (0.6 + 0.4 * s)
}
function rectDist(r: Rect, x: number, y: number) {
  return Math.hypot(Math.max(r.l - x, 0, x - r.r), Math.max(r.t - y, 0, y - r.b))
}

/** A soft round stamp with a fairly crisp edge, so the trail reads as a wiped band. */
function makeSprite() {
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const g = c.getContext("2d")!
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, "rgba(0,0,0,1)")
  gr.addColorStop(0.8, "rgba(0,0,0,1)")
  gr.addColorStop(0.91, "rgba(0,0,0,.55)")
  gr.addColorStop(1, "rgba(0,0,0,0)")
  g.fillStyle = gr
  g.fillRect(0, 0, 64, 64)
  return c
}

function drawBead(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a: number, dark: boolean) {
  g.save()
  g.globalAlpha = a
  g.fillStyle = dark ? "rgba(0,0,0,.2)" : "rgba(12,24,52,.17)"
  g.beginPath()
  g.ellipse(x + rx * 0.34, y + ry * 0.7, rx * 1.05, ry * 0.85, 0, 0, Math.PI * 2)
  g.fill()
  const gr = g.createRadialGradient(x - rx * 0.25, y - ry * 0.3, rx * 0.08, x, y, rx * 1.05)
  gr.addColorStop(0, "rgba(255,255,255,.18)")
  gr.addColorStop(0.62, dark ? "rgba(214,206,255,.14)" : "rgba(190,214,240,.1)")
  gr.addColorStop(1, dark ? "rgba(150,140,230,.3)" : "rgba(18,40,86,.34)")
  g.fillStyle = gr
  g.beginPath()
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = Math.max(0.6, rx * 0.22)
  g.strokeStyle = "rgba(255,255,255,.88)"
  g.beginPath()
  g.ellipse(x, y, rx * 0.92, ry * 0.92, 0, Math.PI * 0.95, Math.PI * 1.6)
  g.stroke()
  g.strokeStyle = dark ? "rgba(255,255,255,.22)" : "rgba(14,30,70,.3)"
  g.beginPath()
  g.ellipse(x, y, rx * 0.92, ry * 0.92, 0, Math.PI * 1.95, Math.PI * 2.55)
  g.stroke()
  g.fillStyle = "rgba(255,255,255,.95)"
  g.beginPath()
  g.ellipse(x - rx * 0.36, y - ry * 0.4, rx * 0.3, ry * 0.2, -0.6, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = "rgba(255,255,255,.5)"
  g.beginPath()
  g.ellipse(x + rx * 0.3, y + ry * 0.42, rx * 0.32, ry * 0.16, -0.5, 0, Math.PI * 2)
  g.fill()
  g.restore()
}

function makeCanvas() {
  const c = document.createElement("canvas")
  return { c, g: c.getContext("2d")! }
}

/** Catmull-Rom through the waypoints, sampled densely: scripted strokes get round turns instead of corners. */
function spline(p: { x: number; y: number }[], per = 14) {
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[Math.min(p.length - 1, i + 2)]
    for (let j = 0; j < per; j++) {
      const t = j / per
      const t2 = t * t
      const t3 = t2 * t
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  out.push(p[p.length - 1])
  return out
}

function createEngine(o: { root: HTMLElement; vault: HTMLElement; frost: HTMLElement; fx: HTMLCanvasElement; rim: HTMLCanvasElement; getCfg: () => EngineCfg; onUi: (u: UiState) => void }) {
  const { root, vault, frost, fx, rim } = o
  const mc = document.createElement("canvas")
  const mctx = mc.getContext("2d")!
  const fctx = fx.getContext("2d")!
  const rimDom = rim.getContext("2d")!
  const tw = makeCanvas()
  const td = makeCanvas()
  const rb = makeCanvas()
  const rs = makeCanvas()
  const sprite = makeSprite()
  let W = 0
  let H = 0
  let k = 0.45
  let sc = 1
  let dpr = 1
  let dark = false
  let stamps: Stamp[] = []
  let beads: Bead[] = []
  let items: Item[] = []
  let strokes: Stroke[] = []
  let raf = 0
  let visible = true
  let dead = false
  let pressed = false
  let touch = false
  let touched = false
  let phase = ""
  let lastTick = 0
  let lastMask = -1e9
  let lastUi = -1e9
  let maskDirty = false
  let pending = false
  let again = false
  let gen = 0
  let armed = false
  let curUrl = ""
  let ui: UiState = { armed: false, readable: [], near: [], remain: 0, read: [] }
  const session: string[] = []
  const pen: Pen = { last: null, raw: null, mid: null, path: 0, next: 14 }
  const timers = new Set<number>()

  const cfg = () => o.getCfg()
  const now0 = () => performance.now()

  function readTheme() {
    const ink = getComputedStyle(root).getPropertyValue("--icn-ink").trim().toLowerCase()
    dark = ink === "#fff" || ink === "#ffffff" || ink === "white"
  }

  function resize() {
    W = vault.clientWidth
    H = vault.clientHeight
    dpr = Math.min(2, window.devicePixelRatio || 1)
    k = Math.min(0.55, 380 / Math.max(W, H, 1))
    sc = clamp(W / 700, 0.85, 1.6)
    const mw = Math.max(8, Math.round(W * k))
    const mh = Math.max(8, Math.round(H * k))
    for (const c of [mc, tw.c, td.c, rb.c, rs.c, rim]) {
      c.width = mw
      c.height = mh
    }
    fx.width = Math.max(1, Math.round(W * dpr))
    fx.height = Math.max(1, Math.round(H * dpr))
    readTheme()
    refreshItems()
    maskDirty = true
    kick()
  }

  function refreshItems() {
    const vr = vault.getBoundingClientRect()
    items = Array.from(vault.querySelectorAll<HTMLElement>("[data-icn-item]")).map((el) => {
      const b = el.getBoundingClientRect()
      return {
        id: el.dataset.icnItem ?? "",
        label: el.dataset.icnLabel ?? "",
        kind: el.dataset.icnKind ?? "",
        rect: { l: b.left - vr.left, t: b.top - vr.top, r: b.right - vr.left, b: b.bottom - vr.top },
      }
    })
  }

  /** Brush radius: about 0.85 of a row, so one pass clears a full line of text. */
  function brush() {
    const hs = items.map((i) => i.rect.b - i.rect.t)
    const m = hs.length ? hs.reduce((a, b) => a + b, 0) / hs.length : 32
    return clamp(m * 0.85, 26 * sc, 46 * sc) * (touch ? 1.12 : 1)
  }

  function setMask(url: string | null) {
    const v = url ? `url("${url}")` : "none"
    frost.style.setProperty("mask-image", v)
    frost.style.setProperty("-webkit-mask-image", v)
  }

  function commit(url: string) {
    setMask(url)
    rimDom.clearRect(0, 0, rim.width, rim.height)
    rimDom.drawImage(rs.c, 0, 0)
    const prev = curUrl
    curUrl = url
    if (prev) {
      const id = window.setTimeout(() => {
        timers.delete(id)
        URL.revokeObjectURL(prev)
      }, 500)
      timers.add(id)
    }
  }

  /** Encode the mask off the main thread (toBlob), decode it, then swap it in together with the matching rim. */
  function pushMask() {
    if (pending) {
      again = true
      return
    }
    pending = true
    const g = gen
    rs.g.clearRect(0, 0, rs.c.width, rs.c.height)
    rs.g.drawImage(rb.c, 0, 0)
    mc.toBlob((blob) => {
      if (g !== gen) return
      if (!blob || dead) {
        pending = false
        return
      }
      const url = URL.createObjectURL(blob)
      const im = new Image()
      im.src = url
      const done = () => {
        if (g !== gen) {
          URL.revokeObjectURL(url)
          return
        }
        pending = false
        if (dead) {
          URL.revokeObjectURL(url)
          return
        }
        commit(url)
        if (again) {
          again = false
          pushMask()
        }
      }
      im.decode().then(done, done)
    })
  }

  function tint(t: { c: HTMLCanvasElement; g: CanvasRenderingContext2D }, color: string) {
    t.g.globalCompositeOperation = "source-over"
    t.g.clearRect(0, 0, t.c.width, t.c.height)
    t.g.drawImage(mc, 0, 0)
    t.g.globalCompositeOperation = "source-in"
    t.g.fillStyle = color
    t.g.fillRect(0, 0, t.c.width, t.c.height)
    t.g.globalCompositeOperation = "source-over"
  }

  /** The wet edge: the fog silhouette nudged a few pixels, minus the fog itself, leaves a lit crescent on the upper-left lip of every clear patch and a shadow on the lower-right. It follows the real mask, so turns and merges stay smooth. */
  function renderRim(d: number) {
    const w = rb.c.width
    const h = rb.c.height
    tint(tw, dark ? "#f2eeff" : "#ffffff")
    tint(td, dark ? "#05061a" : "#0e1e46")
    const g = rb.g
    g.globalCompositeOperation = "source-over"
    g.clearRect(0, 0, w, h)
    g.globalAlpha = dark ? 0.5 : 0.4
    g.drawImage(td.c, -d, -d)
    g.globalAlpha = 1
    g.drawImage(tw.c, d, d)
    g.drawImage(tw.c, d, d)
    g.globalCompositeOperation = "destination-out"
    g.drawImage(mc, 0, 0)
    g.globalCompositeOperation = "source-over"
  }

  function renderMask(now: number) {
    mctx.setTransform(1, 0, 0, 1, 0, 0)
    mctx.globalCompositeOperation = "source-over"
    mctx.globalAlpha = 1
    mctx.clearRect(0, 0, mc.width, mc.height)
    mctx.fillStyle = "#000"
    mctx.fillRect(0, 0, mc.width, mc.height)
    mctx.globalCompositeOperation = "destination-out"
    let rMax = 0
    for (const st of stamps) {
      const s = life(st, now)
      if (s <= 0.004) continue
      const rad = effRadius(st, s, now) * k
      if (rad < 0.35) continue
      if (st.n >= 2) rMax = Math.max(rMax, rad)
      mctx.globalAlpha = 1 - Math.pow(1 - Math.min(1, s), 1 / st.n)
      mctx.drawImage(sprite, st.x * k - rad, st.y * k - rad, rad * 2, rad * 2)
    }
    mctx.globalAlpha = 1
    mctx.globalCompositeOperation = "source-over"
    renderRim(clamp(rMax * 0.1, 1.3, 2.6))
    lastMask = now
    maskDirty = false
    pushMask()
  }

  function renderFx(now: number) {
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fctx.globalCompositeOperation = "source-over"
    fctx.globalAlpha = 1
    fctx.clearRect(0, 0, W, H)
    for (const b of beads) {
      const s = life(b.st, now)
      const a = Math.min(1, Math.max(0, (s - 0.08) / 0.4))
      if (a <= 0) continue
      const pop = cfg().reduce ? 1 : easeOut(Math.min(1, (now - b.born) / 260))
      if (pop <= 0) continue
      const stretch = b.state === 1 ? 1 + Math.min(0.7, b.vy / 260) : 1
      const rx = b.r * (0.45 + 0.55 * pop) * (b.state === 1 ? 0.92 : 1)
      drawBead(fctx, b.x, b.y, rx, rx * stretch, a, dark)
    }
  }

  function addStamp(x: number, y: number, r: number, extra?: Partial<Stamp>) {
    const c = cfg()
    const st: Stamp = { x, y, r, t: now0(), hold: c.hold, fade: c.reduce ? 240 : c.fade, grow: 0, n: 4.5, ...extra }
    stamps.push(st)
    if (stamps.length > 4000) stamps.splice(0, stamps.length - 4000)
    maskDirty = true
    return st
  }

  function spawnBead(x: number, y: number, nx: number, ny: number, R: number, st: Stamp) {
    let sx = nx
    let sy = ny
    if (Math.random() < 0.62 ? sy < 0 : Math.random() < 0.5) {
      sx = -sx
      sy = -sy
    }
    const off = R * (0.8 + Math.random() * 0.12)
    const rr = (Math.random() < 0.1 ? 3.8 + Math.random() * 1.1 : 1.5 + Math.pow(Math.random(), 1.6) * 2.3) * sc
    const b: Bead = { x: x + sx * off, y: y + sy * off, r: rr, born: now0(), st, dripAt: 0, dripLen: 0, y0: 0, sy: 0, vy: 0, state: 0 }
    if (!cfg().reduce && sy > 0.35 && rr > 1.9 * sc && Math.random() < 0.3 && beads.filter((q) => q.dripAt && q.state < 2).length < 4) {
      b.dripAt = b.born + 450 + Math.random() * 1700
      b.dripLen = (26 + Math.random() * 62) * sc
    }
    beads.push(b)
    if (beads.length > 90) beads.shift()
  }

  function jitter(R: number, p: Pen) {
    return R * (0.94 + 0.12 * Math.sin(p.path * 0.045 + 1.3))
  }

  function stampTo(p: Pen, x: number, y: number, R: number) {
    if (!p.last) {
      const st = addStamp(x, y, jitter(R, p), { q: p.q })
      p.last = { x, y }
      p.next = 12
      spawnBead(x, y, 0, 1, R, st)
      return
    }
    const dx = x - p.last.x
    const dy = y - p.last.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1.2) return
    const n = Math.max(1, Math.ceil(dist / (R * 0.3)))
    const nx = -dy / dist
    const ny = dx / dist
    for (let i = 1; i <= n; i++) {
      const px = p.last.x + (dx * i) / n
      const py = p.last.y + (dy * i) / n
      p.path += dist / n
      const st = addStamp(px, py, jitter(R, p), { q: p.q })
      if (p.path >= p.next) {
        spawnBead(px, py, nx, ny, R, st)
        p.next = p.path + 10 + Math.random() * 20
      }
    }
    p.last = { x, y }
  }

  function startSession() {
    if (!armed || (stamps.length === 0 && strokes.length === 0 && !pressed)) session.length = 0
  }

  function computeUi(now: number) {
    lastUi = now
    const live = stamps.filter((st) => alive(st, now))
    armed = pressed || strokes.length > 0 || live.length > 0
    const readable: string[] = []
    const near: string[] = []
    const real: string[] = []
    for (const it of items) {
      let rd = false
      let nr = false
      let rl = false
      for (const st of live) {
        if (st.n < 2 || (st.only && !st.only.includes(it.id))) continue
        const s = life(st, now)
        if (s <= 0.05) continue
        const e = effRadius(st, s, now)
        const d = rectDist(it.rect, st.x, st.y)
        if (d <= e * 2.2) nr = true
        if (s > 0.4 && d <= e * 0.7) {
          rd = true
          if (!st.q) rl = true
        }
      }
      if (rd) readable.push(it.id)
      if (nr || rd) near.push(it.id)
      if (rl) real.push(it.id)
    }
    // the session log lists every item a real wipe or peek made readable; scripted strokes show the same line but never call onReveal
    for (const id of readable) {
      if (!session.includes(id)) session.push(id)
    }
    for (const id of real) {
      if (!revealed.has(id)) {
        revealed.add(id)
        cfg().onReveal?.(id)
      }
    }
    if (!armed) revealed.clear()
    let remain = 0
    for (const st of live) {
      if (st.n < 2) continue
      const left = st.ov ? st.ov.d - (now - st.ov.t) : st.hold + st.fade - (now - st.t)
      remain = Math.max(remain, left)
    }
    const next: UiState = {
      armed,
      readable,
      near,
      remain: remain > 0 ? Math.ceil(remain / 1000) : 0,
      read: session.map((id) => {
        const it = items.find((q) => q.id === id)
        return { id, label: it?.label ?? id, kind: it?.kind ?? "" }
      }),
    }
    let p: string
    if (!touched) p = "idle"
    else if (pressed || strokes.length) p = "wiping"
    else if (!armed) p = "fogged"
    else p = live.some((st) => st.n >= 2 && !st.ov && now - st.t <= st.hold) ? "clear" : "fogging"
    if (p !== phase) {
      phase = p
      root.dataset.demoPhase = p
    }
    if (
      next.armed !== ui.armed ||
      next.remain !== ui.remain ||
      next.readable.join() !== ui.readable.join() ||
      next.near.join() !== ui.near.join() ||
      next.read.map((r) => r.id).join() !== ui.read.map((r) => r.id).join()
    ) {
      ui = next
      o.onUi(next)
    }
  }
  const revealed = new Set<string>()

  function stepScript(now: number) {
    const R = brush()
    for (const s of strokes) {
      if (now < s.start) continue
      const total = s.cum[s.cum.length - 1]
      const u = Math.min(1, (now - s.start) / s.dur)
      const d = easeIO(u) * total
      let i = 1
      while (i < s.cum.length - 1 && s.cum[i] < d) i++
      const a = s.pts[i - 1]
      const b = s.pts[i]
      const seg = s.cum[i] - s.cum[i - 1] || 1
      const f = Math.min(1, Math.max(0, (d - s.cum[i - 1]) / seg))
      stampTo(s.pen, a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, R)
    }
    strokes = strokes.filter((s) => now < s.start + s.dur)
  }

  function stepDrips(now: number, dt: number) {
    for (const b of beads) {
      if (b.state === 0 && b.dripAt && now >= b.dripAt) {
        b.state = 1
        b.y0 = b.y
        b.sy = b.y
        b.vy = 24 * sc
      }
      if (b.state !== 1) continue
      b.vy = Math.min(250 * sc, b.vy + 540 * sc * dt)
      b.y += b.vy * dt
      while (b.y - b.sy >= 3.2 * sc) {
        b.sy += 3.2 * sc
        b.st = addStamp(b.x + (Math.random() - 0.5) * 0.6, b.sy, (2.3 + Math.random() * 0.7) * sc, { hold: 700, fade: 2600, n: 1.3 })
      }
      if (b.y - b.y0 >= b.dripLen) {
        b.state = 2
        b.vy = 0
      }
    }
  }

  function finish() {
    gen++
    pending = false
    again = false
    setMask(null)
    if (curUrl) {
      URL.revokeObjectURL(curUrl)
      curUrl = ""
    }
    rimDom.clearRect(0, 0, rim.width, rim.height)
    fctx.setTransform(1, 0, 0, 1, 0, 0)
    fctx.clearRect(0, 0, fx.width, fx.height)
    computeUi(now0())
  }
  const maskOn = () => frost.style.getPropertyValue("mask-image") !== "none" && frost.style.getPropertyValue("mask-image") !== ""

  function tick() {
    raf = 0
    if (dead || !visible || document.hidden) return
    const now = now0()
    const dt = Math.min(0.05, Math.max(0, (now - lastTick) / 1000))
    lastTick = now
    if (strokes.length) stepScript(now)
    stepDrips(now, dt)
    let changing = false
    stamps = stamps.filter((st) => {
      if (!alive(st, now)) return false
      const age = now - st.t
      if (age < st.grow || age > st.hold || age < 0 || st.ov) changing = true
      return true
    })
    let beadsMoving = false
    beads = beads.filter((b) => {
      if (!alive(b.st, now)) return false
      if (b.state === 1 || now - b.born < 300) beadsMoving = true
      return true
    })
    if (stamps.length === 0 && strokes.length === 0 && !pressed) {
      if (maskOn()) finish()
      else computeUi(now)
      return
    }
    // the mask (and the rim that rides with it) updates at one cadence; beads redraw with it, or every frame while they move
    const doMask = maskDirty || changing
    if (doMask && (pressed || strokes.length || now - lastMask > 55)) {
      renderMask(now)
      renderFx(now)
    } else if (beadsMoving) renderFx(now)
    if (now - lastUi > (pressed || strokes.length ? 28 : 110)) computeUi(now)
    raf = requestAnimationFrame(tick)
  }

  function kick() {
    if (dead || raf || !visible || document.hidden) return
    lastTick = now0()
    raf = requestAnimationFrame(tick)
  }

  /* ---- public ---- */
  function begin(x: number, y: number, isTouch: boolean) {
    startSession()
    pressed = true
    touched = true
    touch = isTouch
    readTheme()
    refreshItems()
    const R = brush()
    pen.q = false
    pen.last = null
    pen.raw = { x, y }
    pen.mid = { x, y }
    stampTo(pen, x, y, R)
    computeUi(now0())
    renderMask(now0())
    renderFx(now0())
    kick()
  }
  /** Pointer moves are smoothed through quadratic midpoints, so a quick turn leaves a round corner. */
  function move(x: number, y: number) {
    if (!pressed || !pen.raw || !pen.mid) return
    const R = brush()
    const m = { x: (pen.raw.x + x) / 2, y: (pen.raw.y + y) / 2 }
    const len = Math.hypot(m.x - pen.mid.x, m.y - pen.mid.y)
    const steps = clamp(Math.ceil(len / (R * 0.5)), 1, 10)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      stampTo(pen, u * u * pen.mid.x + 2 * u * t * pen.raw.x + t * t * m.x, u * u * pen.mid.y + 2 * u * t * pen.raw.y + t * t * m.y, R)
    }
    pen.mid = m
    pen.raw = { x, y }
    const now = now0()
    if (now - lastMask > 14) renderMask(now)
    if (now - lastUi > 28) computeUi(now)
    kick()
  }
  function end() {
    if (pressed && pen.raw && pen.last) stampTo(pen, pen.raw.x, pen.raw.y, brush())
    pressed = false
    pen.last = null
    pen.raw = null
    pen.mid = null
    kick()
  }

  function peekRect(l: number, t: number, w: number, h: number, hold: number) {
    const only = items.filter((it) => it.rect.l >= l - 1 && it.rect.r <= l + w + 1 && it.rect.t >= t - 1 && it.rect.b <= t + h + 1).map((it) => it.id)
    const c = cfg()
    const rr = clamp(h * 0.8, 24 * sc, 52 * sc)
    const cols = Math.max(1, Math.ceil(w / (rr * 0.5)))
    const rows = Math.max(1, Math.ceil(h / (rr * 0.5)))
    const t0 = now0()
    let last: Stamp | null = null
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) {
        last = addStamp(l + ((q + 0.5) * w) / cols, t + ((r + 0.5) * h) / rows, rr, {
          t: t0 + (c.reduce ? 0 : q * 16 + r * 34),
          hold,
          fade: c.reduce ? 240 : 1600,
          grow: c.reduce ? 0 : 420,
          n: 8,
          only,
        })
      }
    }
    if (!c.reduce && last) {
      for (let i = 0; i < 3; i++) spawnBead(l + w * (0.15 + Math.random() * 0.7), t + h * 0.5, 0, 1, h * 0.5 + 2, last)
    }
  }

  function peek(el: HTMLElement) {
    startSession()
    touched = true
    readTheme()
    refreshItems()
    const vr = vault.getBoundingClientRect()
    const b = el.getBoundingClientRect()
    peekRect(b.left - vr.left, b.top - vr.top, b.width, b.height, cfg().peek)
    computeUi(now0())
    renderMask(now0())
    kick()
  }

  /** Clear every item for a moment: the still for people who asked for reduced motion. */
  function peekAll(hold: number) {
    startSession()
    touched = true
    refreshItems()
    for (const it of items) peekRect(it.rect.l, it.rect.t, it.rect.r - it.rect.l, it.rect.b - it.rect.t, hold)
    computeUi(now0())
    renderMask(now0())
    kick()
  }

  function refog(ms: number) {
    const now = now0()
    strokes = []
    pressed = false
    if (ms <= 0) {
      stamps = []
      beads = []
      finish()
      return
    }
    for (const st of stamps) st.ov = { k0: life(st, now), t: now, d: ms }
    for (const b of beads) b.dripAt = 0
    maskDirty = true
    kick()
  }

  /** One confident gesture down the key list, then one down the notes. Speed and delay come from the props. */
  function demo() {
    startSession()
    touched = true
    readTheme()
    refreshItems()
    const R = brush()
    const sp = Math.max(0.25, cfg().speed)
    const margin = R * 0.5
    const serp = (list: Item[], start: number, dur: number) => {
      if (!list.length) return
      const wp: { x: number; y: number }[] = []
      list.forEach((it, i) => {
        const cy = (it.rect.t + it.rect.b) / 2
        const l = Math.max(margin, it.rect.l + 6)
        const r = Math.min(W - margin, it.rect.r - 10)
        const ltr = i % 2 === 0
        const x0 = ltr ? l : r
        const x1 = ltr ? r : l
        if (i === 0) wp.push({ x: x0, y: cy + 4 })
        wp.push({ x: x0 + (x1 - x0) * 0.5, y: cy - 3 }, { x: x1, y: cy })
        const nx = list[i + 1]
        if (nx) {
          const ny = (nx.rect.t + nx.rect.b) / 2
          wp.push({ x: clamp(x1 + (ltr ? 1 : -1) * R * 0.55, margin, W - margin), y: (cy + ny) / 2 })
        }
      })
      const pts = spline(wp)
      const cum = [0]
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
      strokes.push({ pts, cum, start, dur, pen: { last: null, raw: null, mid: null, path: 0, next: 10, q: true } })
    }
    const secrets = items.filter((q) => q.kind === "secret").slice(0, 3)
    const mems = items.filter((q) => q.kind === "memory").slice(0, 3)
    const t0 = now0() + 40
    const d1 = 1400 / sp
    serp(secrets, t0, d1)
    serp(mems, t0 + (secrets.length ? d1 + 120 / sp : 0), 1250 / sp)
    kick()
  }

  /* ---- lifecycle ---- */
  const ro = new ResizeObserver(() => resize())
  ro.observe(vault)
  const onVis = () => {
    if (document.hidden) refog(0)
    else kick()
  }
  document.addEventListener("visibilitychange", onVis)
  root.dataset.demoPhase = "idle"
  resize()

  return {
    begin,
    move,
    end,
    peek,
    peekAll,
    refog,
    demo,
    isArmed: () => armed,
    setVisible(v: boolean) {
      visible = v
      if (v) kick()
    },
    destroy() {
      dead = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      timers.forEach((id) => window.clearTimeout(id))
      timers.clear()
      if (curUrl) URL.revokeObjectURL(curUrl)
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

function useReducedMotion() {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)")
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  )
}

/** Same-shape stand-in for fogged text: every letter becomes another letter of similar width, so nothing real is in the DOM and nothing reflows when the real text mounts. */
const GROUPS: [RegExp, string][] = [
  [/[ijltfr]/, "ijltfr"],
  [/[mw]/, "mw"],
  [/[a-z]/, "abcdeghknopqsuvxyz"],
  [/[IJ]/, "IJ"],
  [/[MW]/, "MW"],
  [/[A-Z]/, "ABCDEFGHKLNOPQRSTUVXYZ"],
  [/[0-9]/, "0123456789"],
]
const maskText = (s: string) =>
  Array.from(s, (c, i) => {
    const g = GROUPS.find(([re]) => re.test(c))
    return g ? g[1][(c.charCodeAt(0) * 7 + i * 13 + 5) % g[1].length] : c
  }).join("")
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Secrets and memory behind fogged glass. Press and drag to wipe a clear trail with water beads along
 * its rim; the fog creeps back after a few seconds. Tab to a peek button and press Enter to clear one
 * item for five seconds. Esc fogs everything back at once. A secret only enters the DOM while a wipe is
 * close to it: until then the row holds a same-shape stand-in.
 */
export function Condensation({
  title = "Secrets & memory",
  subtitle = "Harbor & Finch · Workspace settings",
  secretsTitle = "API keys",
  secrets,
  memoryTitle = "What Atlas remembers",
  memories,
  footnote,
  holdMs = 2000,
  fadeMs = 6000,
  peekMs = 5000,
  stage = false,
  demo,
  demoDelayMs = 400,
  demoSpeed = 1,
  onReveal,
  ref,
  className,
  style,
}: CondensationProps) {
  const useDemoData = secrets === undefined && memories === undefined
  const keys = secrets ?? (useDemoData ? SECRETS : [])
  const mems = memories ?? (useDemoData ? (stage ? MEMORIES.slice(0, 3) : MEMORIES) : [])
  const playDemo = demo ?? useDemoData
  const reduce = useReducedMotion()
  const note = footnote ?? `Reading a secret writes it to the audit log. Everything fogs back within ${Math.round((holdMs + fadeMs) / 1000)} seconds.`

  const rootRef = React.useRef<HTMLElement>(null)
  const vaultRef = React.useRef<HTMLDivElement>(null)
  const frostRef = React.useRef<HTMLDivElement>(null)
  const fxRef = React.useRef<HTMLCanvasElement>(null)
  const rimRef = React.useRef<HTMLCanvasElement>(null)
  const engine = React.useRef<ReturnType<typeof createEngine> | null>(null)
  const cfgRef = React.useRef<EngineCfg>({ hold: holdMs, fade: fadeMs, peek: peekMs, reduce, speed: demoSpeed, onReveal })
  const demoRef = React.useRef({ play: playDemo && !reduce, delay: demoDelayMs, played: false })
  const [ui, setUi] = React.useState<UiState>({ armed: false, readable: [], near: [], remain: 0, read: [] })
  const [said, setSaid] = React.useState("")
  const replayTimer = React.useRef(0)

  React.useEffect(() => {
    cfgRef.current = { hold: holdMs, fade: fadeMs, peek: peekMs, reduce, speed: demoSpeed, onReveal }
    demoRef.current.play = playDemo && !reduce
    demoRef.current.delay = demoDelayMs
  })

  React.useEffect(() => {
    const root = rootRef.current
    const vault = vaultRef.current
    const frost = frostRef.current
    const fx = fxRef.current
    const rim = rimRef.current
    if (!root || !vault || !frost || !fx || !rim) return
    const eng = createEngine({ root, vault, frost, fx, rim, getCfg: () => cfgRef.current, onUi: setUi })
    engine.current = eng
    let timer = 0
    const io = new IntersectionObserver(
      (l) => {
        const vis = l.some((en) => en.isIntersecting && en.intersectionRatio >= 0.35)
        eng.setVisible(l.some((en) => en.isIntersecting))
        window.clearTimeout(timer)
        const d = demoRef.current
        if (vis && d.play && !d.played) {
          timer = window.setTimeout(() => {
            if (d.played || !d.play) return
            d.played = true
            eng.demo()
          }, d.delay)
        }
      },
      { threshold: [0, 0.35, 0.6] },
    )
    io.observe(root)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && eng.isArmed()) eng.refog(cfgRef.current.reduce ? 0 : 170)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(replayTimer.current)
      io.disconnect()
      window.removeEventListener("keydown", onKey)
      eng.destroy()
      engine.current = null
    }
  }, [])

  React.useImperativeHandle(ref, () => ({
    replay: () => {
      engine.current?.refog(0)
      window.clearTimeout(replayTimer.current)
      replayTimer.current = window.setTimeout(() => {
        if (cfgRef.current.reduce) engine.current?.peekAll(2600)
        else engine.current?.demo()
      }, 80)
    },
    fog: () => engine.current?.refog(cfgRef.current.reduce ? 0 : 900),
  }))

  const local = (e: React.PointerEvent) => {
    const r = vaultRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const p = local(e)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* synthetic or finished pointer: wiping still works inside the glass */
    }
    engine.current?.begin(p.x, p.y, e.pointerType === "touch")
  }
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return
    const p = local(e)
    engine.current?.move(p.x, p.y)
  }
  const onUp = () => engine.current?.end()

  const peek = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget.closest<HTMLElement>("[data-icn-peekroot]")?.querySelector<HTMLElement>("[data-icn-target]")
    if (target) engine.current?.peek(target)
  }

  const open = (id: string) => ui.readable.includes(id)
  const shown = (id: string) => ui.near.includes(id)
  const fogged = ui.readable.length === 0

  /* One polite announcement per reading session step: wait until the readable set stops changing, then read what is readable. */
  const readKey = ui.readable.join("|")
  React.useEffect(() => {
    if (!readKey) return
    const t = window.setTimeout(() => setSaid(readKey), 450)
    return () => window.clearTimeout(t)
  }, [readKey])
  const spoken = fogged
    ? "Fogged."
    : said
        .split("|")
        .filter((id) => ui.readable.includes(id))
        .map((id) => {
          const s = keys.find((q) => q.id === id)
          if (s) return `${s.label}: ${s.value}`
          const m = mems.find((q) => q.id === id)
          return m ? `${m.topic}: ${m.text}` : ""
        })
        .filter(Boolean)
        .map((t) => t.replace(/[.!?]+$/, ""))
        .join(". ")

  const kindCount = (kind: string) => ui.read.filter((r) => r.kind === kind).length
  const logLine = (() => {
    const parts = [kindCount("secret") ? plural(kindCount("secret"), "key", "keys") : "", kindCount("memory") ? plural(kindCount("memory"), "note", "notes") : ""].filter(Boolean)
    return `${plural(ui.read.length, "read", "reads")} logged: ${parts.join(", ")}`
  })()
  const cols = (keys.length ? 1 : 0) + (mems.length ? 1 : 0)

  return (
    <section ref={rootRef} className={["icn", className].filter(Boolean).join(" ")} style={style} aria-label={title} data-state={fogged ? "fogged" : "clear"} data-stage={stage ? "" : undefined}>
      <style href="condensation" precedence="default">
        {CSS}
      </style>
      <div className="icn-panel">
        <span className="icn-bd" aria-hidden="true" />
        <div className="icn-body">
          <header className="icn-head">
            <span className="icn-tile" aria-hidden="true">
              <CloudFog strokeWidth={1.8} />
            </span>
            <div className="icn-titles">
              <h3 className="icn-title" style={{ margin: 0 }}>{title}</h3>
              <p className="icn-sub">{subtitle}</p>
            </div>
            <div className="icn-tools">
              <span className="icn-chip" data-clear={fogged ? undefined : ""} title={fogged ? undefined : `Fogs back in ${ui.remain} seconds`}>
                {fogged ? <CloudFog strokeWidth={1.8} aria-hidden="true" /> : <Eye strokeWidth={1.8} aria-hidden="true" />}
                <span className="icn-swap" key={fogged ? "fogged" : "clear"}>
                  {fogged ? (
                    "Fogged"
                  ) : (
                    <>
                      Readable{ui.remain > 0 && <> · <span className="icn-chip-long">fogs in </span><b>{ui.remain}s</b></>}
                    </>
                  )}
                </span>
              </span>
              <button
                type="button"
                className="icn-fogbtn"
                aria-disabled={ui.armed ? undefined : true}
                aria-keyshortcuts="Escape"
                onClick={() => ui.armed && engine.current?.refog(reduce ? 0 : 900)}
              >
                Fog up
                <span className="icn-kbd" aria-hidden="true">Esc</span>
              </button>
            </div>
          </header>

          <div className="icn-glass">
            <div className="icn-vault" ref={vaultRef} data-cols={cols} role="group" aria-label={fogged ? "Secrets and memory, fogged" : "Secrets and memory, partly visible"}>
              {keys.length > 0 && (
                <div className="icn-card">
                  <div className="icn-cardhead">
                    <span className="icn-up">{secretsTitle}</span>
                    <span className="icn-up icn-count">{plural(keys.length, "key", "keys")}</span>
                  </div>
                  <ul className="icn-list">
                    {keys.map((s) => (
                      <li className="icn-key" key={s.id} data-icn-peekroot="">
                        <div className="icn-keyhead icn-up">
                          <span className="icn-label">{s.label}</span>
                          {s.scope && <span className="icn-scope">{s.scope}</span>}
                        </div>
                        <button type="button" className="icn-peek" onClick={peek} aria-label={`Peek at ${s.label} for ${Math.round(peekMs / 1000)} seconds`} title={`Peek for ${Math.round(peekMs / 1000)} seconds`}>
                          <Eye strokeWidth={1.8} />
                        </button>
                        <div className="icn-slot" data-icn-item={s.id} data-icn-label={s.label} data-icn-kind="secret" data-icn-target="" data-open={open(s.id) ? "" : undefined} aria-hidden={open(s.id) ? undefined : true}>
                          <code className="icn-val" key={shown(s.id) ? "v" : "m"} data-shown={shown(s.id) ? "" : undefined}>{shown(s.id) ? s.value : maskText(s.value)}</code>
                        </div>
                        {s.meta && <div className="icn-meta icn-up">{s.meta}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {mems.length > 0 && (
                <div className="icn-card" data-icn-peekroot="">
                  <div className="icn-cardhead">
                    <span className="icn-up">
                      <Brain strokeWidth={1.8} aria-hidden="true" />
                      {memoryTitle}
                    </span>
                    <span className="icn-up icn-count">{plural(mems.length, "note", "notes")}</span>
                    <button type="button" className="icn-peek" onClick={peek} aria-label={`Peek at ${memoryTitle} for ${Math.round(peekMs / 1000)} seconds`} title={`Peek for ${Math.round(peekMs / 1000)} seconds`}>
                      <Eye strokeWidth={1.8} />
                    </button>
                  </div>
                  <div className="icn-mem" data-icn-target="">
                    {mems.map((m) => (
                      <div className="icn-memrow" key={m.id}>
                        <span className="icn-topic icn-up">{m.topic}</span>
                        <div className="icn-slot" data-icn-item={m.id} data-icn-label={m.topic} data-icn-kind="memory" data-open={open(m.id) ? "" : undefined} aria-hidden={open(m.id) ? undefined : true}>
                          <span className="icn-note" key={shown(m.id) ? "v" : "m"} data-shown={shown(m.id) ? "" : undefined}>{shown(m.id) ? m.text : maskText(m.text)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="icn-frost"
                ref={frostRef}
                aria-hidden="true"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onLostPointerCapture={onUp}
              />
              <canvas className="icn-rim" ref={rimRef} aria-hidden="true" />
              <canvas className="icn-fx" ref={fxRef} aria-hidden="true" />
            </div>
            <span className="icn-hint" aria-hidden="true" data-on={ui.armed ? undefined : ""}>
              <Hand strokeWidth={1.8} />
              <span className="icn-hint-m">Wipe the glass to read</span>
              <span className="icn-hint-t">Swipe across to read</span>
            </span>
          </div>

          <p className="icn-foot">
            <ShieldCheck strokeWidth={1.8} aria-hidden="true" />
            <span className="icn-swap" key={!fogged && ui.read.length ? "read" : "idle"}>
              {!fogged && ui.read.length ? logLine : note}
            </span>
          </p>
          <span className="icn-sr" role="status" aria-live="polite">{spoken}</span>
        </div>
      </div>
    </section>
  )
}

export default Condensation

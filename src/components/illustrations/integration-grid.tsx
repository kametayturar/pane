"use client"

import * as React from "react"
import {
  Bell, BarChart3, Bookmark, Briefcase, Calendar, Camera, Cloud, Code, Cog, Compass, CreditCard, Cpu, Database, Download, FileText,
  Folder, Gauge, GitBranch, Globe, Headphones, Heart, Image, Inbox, Key, Layers, Lightbulb, Link, Lock, Mail, Map, MessageSquare, Mic,
  Music, Newspaper, Package, Palette, PenTool, Phone, Plug, Receipt, Rocket, Search, Server, Shield, ShoppingCart, Sparkles, Star, Store,
  Table, Tag, Target, Terminal, Truck, Users, Video, Wallet, Webhook, Workflow, Zap,
} from "lucide-react"

/**
 * IntegrationGrid – a honeycomb wall of app tiles. A ripple travels out from the hub tile in the
 * middle and lights each tile as it passes; a few tiles carry a tint. Tiles take any icon node, so
 * drop in real logos.
 *
 *   <IntegrationGrid items={[{ icon: <Mail size={20} />, name: "Mail" }, …]} />
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type IntegrationGridItem = {
  /** Glyph or logo shown on the tile (about 20px). */
  icon: React.ReactNode
  /** Tooltip text. */
  name?: string
  /** Optional tint (any CSS colour) for the tile's wash and glyph. */
  tint?: string
}

export type IntegrationGridProps = {
  /** Tiles, placed row by row around the hub. They repeat when there are fewer than cells. */
  items?: IntegrationGridItem[]
  /** Content of the hub tile in the middle. Default: a sparkles glyph. */
  center?: React.ReactNode
  /** Motion speed multiplier – 1 is the designed pace, 2 is twice as fast. */
  speed?: number
  /** Freeze all motion on the current frame. */
  paused?: boolean
  /** Accent colour (any CSS colour) used for the hub, the ripple and the glow. */
  accent?: string
  /** Accessible description of the scene. */
  label?: string
  className?: string
}

const g = (Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>, name: string): IntegrationGridItem => ({
  icon: <Icon size={20} strokeWidth={1.6} />,
  name,
})

const BASE_ITEMS: IntegrationGridItem[] = [
  g(Mail, "Mail"), g(MessageSquare, "Chat"), g(FileText, "Docs"), g(Calendar, "Calendar"), g(Database, "Warehouse"),
  g(CreditCard, "Billing"), g(Users, "CRM"), g(BarChart3, "Analytics"), g(Cloud, "Storage"), g(Globe, "Web"),
  g(Folder, "Files"), g(Image, "Images"), g(Music, "Audio"), g(Phone, "Calls"), g(Lock, "Vault"),
  g(Cpu, "Compute"), g(GitBranch, "Code"), g(Bell, "Alerts"), g(Bookmark, "Saved"), g(Camera, "Capture"),
  g(Code, "Scripts"), g(Cog, "Settings"), g(Compass, "Maps"), g(Download, "Exports"), g(Gauge, "Metrics"),
  g(Heart, "Surveys"), g(Layers, "Design"), g(Map, "Routes"), g(Package, "Shipping"), g(Search, "Search"),
  g(Server, "Servers"), g(ShoppingCart, "Store"), g(Star, "Reviews"), g(Tag, "Pricing"), g(Truck, "Fleet"),
  g(Video, "Meetings"), g(Wallet, "Payouts"), g(Zap, "Automation"), g(Terminal, "Shell"), g(Rocket, "Releases"),
  g(Shield, "Security"), g(Link, "Links"), g(PenTool, "Sketch"), g(Receipt, "Invoices"), g(Inbox, "Inbox"),
  g(Headphones, "Support"), g(Lightbulb, "Ideas"), g(Palette, "Brand"), g(Briefcase, "Jobs"), g(Key, "Access"),
  g(Newspaper, "News"), g(Mic, "Voice"), g(Plug, "Plugins"), g(Store, "Market"), g(Table, "Sheets"),
  g(Target, "Goals"), g(Webhook, "Hooks"), g(Workflow, "Flows"),
]

// A handful of tinted tiles, spread through the wall.
const TINTS: Record<number, string> = {
  3: "var(--ig-accent)",
  9: "#12a150",
  14: "#e8590c",
  22: "var(--ig-accent)",
  29: "#8e5cf0",
  36: "#12a150",
  43: "#e8590c",
  50: "#8e5cf0",
}

const DEFAULT_ITEMS: IntegrationGridItem[] = BASE_ITEMS.map((it, i) => (TINTS[i] ? { ...it, tint: TINTS[i] } : it))

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const W = 640
const H = 400
const TILE = 48
const PX = 64
const PY = 54
const ROWS = 7
const MID = Math.floor(ROWS / 2)

type Cell = { x: number; y: number; d: number; hub: boolean; n: number }

/** Honeycomb layout: even rows hold 8 tiles, odd rows 9, so every row is offset half a pitch. */
const CELLS: Cell[] = (() => {
  const out: Cell[] = []
  const cells: { x: number; y: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    const cols = r % 2 === 0 ? 8 : 9
    const x0 = W / 2 - ((cols - 1) * PX) / 2
    for (let c = 0; c < cols; c++) cells.push({ x: x0 + c * PX, y: H / 2 + (r - MID) * PY })
  }
  const dist = (p: { x: number; y: number }) => Math.hypot(p.x - W / 2, (p.y - H / 2) * 1.25)
  const max = Math.max(...cells.map(dist))
  let n = 0
  for (const p of cells) {
    const hub = Math.abs(p.x - W / 2) < 1 && Math.abs(p.y - H / 2) < 1
    out.push({ x: p.x, y: p.y, d: dist(p) / max, hub, n: hub ? -1 : n++ })
  }
  return out
})()

function useStageScale(designWidth: number) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / designWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [designWidth])
  return [ref, scale] as const
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.ig {
  --ig-ink: #000;
  --ig-surface: #fff;
  --ig-accent: #0060e2;
  --ig-speed: 1;
  --ig-t1: color-mix(in oklab, var(--ig-ink) 88%, transparent);
  --ig-t2: color-mix(in oklab, var(--ig-ink) 61%, transparent);
  --ig-t3: color-mix(in oklab, var(--ig-ink) 45%, transparent);
  --ig-t4: color-mix(in oklab, var(--ig-ink) 27%, transparent);
  --ig-fill: color-mix(in oklab, var(--ig-ink) 6%, transparent);
  --ig-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ig-ease: cubic-bezier(.22, 1, .36, 1);
  --ig-cycle: calc(5.6s / var(--ig-speed));
  --ig-scale: 1;
  position: relative; width: 100%; max-width: ${W}px; aspect-ratio: ${W} / ${H};
  font-family: var(--ig-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; color: var(--ig-t1);
}
:is(.dark, [data-theme="dark"]) .ig {
  --ig-ink: #fff;
  --ig-surface: #1c1c1e;
  --ig-accent: #4d8dff;
  --ig-t1: color-mix(in oklab, var(--ig-ink) 90%, transparent);
  --ig-t2: color-mix(in oklab, var(--ig-ink) 62%, transparent);
  --ig-t3: color-mix(in oklab, var(--ig-ink) 46%, transparent);
  --ig-t4: color-mix(in oklab, var(--ig-ink) 28%, transparent);
  --ig-fill: color-mix(in oklab, var(--ig-ink) 8%, transparent);
  --ig-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.ig *, .ig *::before, .ig *::after { box-sizing: border-box }

.ig-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; transform: scale(var(--ig-scale)); visibility: hidden }
.ig[data-ready] .ig-stage { visibility: visible }
.ig-wall {
  position: absolute; inset: 0;
  mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 42%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 62% 66% at 50% 50%, #000 42%, transparent 100%);
}

/* Soft light travelling with the ripple */
.ig-bloom {
  position: absolute; left: ${W / 2 - 210}px; top: ${H / 2 - 210}px; width: 420px; height: 420px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--ig-accent) 16%, transparent), transparent);
  animation: ig-bloom var(--ig-cycle) ease-out infinite;
}
@keyframes ig-bloom { 0% { opacity: .9; transform: scale(.2) } 55%, 100% { opacity: 0; transform: scale(1.5) } }

.ig-cell {
  position: absolute; width: ${TILE}px; height: ${TILE}px; translate: -50% -50%;
  animation: ig-in calc(.7s / var(--ig-speed)) var(--ig-ease) backwards; animation-delay: calc(var(--d) * .7s / var(--ig-speed));
  transition: transform .3s var(--ig-ease);
}
.ig-cell:hover { transform: translateY(-2px) }
@keyframes ig-in { from { opacity: 0; transform: scale(.6); filter: blur(3px) } }

.ig-tile {
  display: grid; place-items: center; width: 100%; height: 100%; border-radius: 13px; color: var(--ig-t3);
  background-color: var(--ig-surface); box-shadow: var(--ig-shadow);
  animation: ig-ripple var(--ig-cycle) cubic-bezier(.3, 0, .2, 1) infinite backwards; animation-delay: calc(var(--d) * var(--ig-cycle) * .34);
}
.ig-tile[data-tint] {
  color: var(--tint);
  background-image: linear-gradient(color-mix(in oklab, var(--tint) 12%, transparent), color-mix(in oklab, var(--tint) 12%, transparent));
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--tint) 30%, transparent), 0 1px 2px 0 color-mix(in oklab, var(--tint) 14%, transparent);
}
@keyframes ig-ripple {
  0%, 22%, 100% { transform: none; color: var(--rest, var(--ig-t3)) }
  9% {
    transform: scale(1.12); color: var(--ig-accent);
    background-color: color-mix(in oklab, var(--ig-accent) 14%, var(--ig-surface));
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--ig-accent) 45%, transparent), 0 8px 20px -6px color-mix(in oklab, var(--ig-accent) 45%, transparent);
  }
}
.ig-tile[data-tint] { --rest: var(--tint) }

/* Hub */
.ig-hub {
  display: grid; place-items: center; width: 100%; height: 100%; border-radius: 15px; color: #fff; position: relative;
  background: linear-gradient(160deg, color-mix(in oklab, var(--ig-accent) 80%, #fff), var(--ig-accent) 55%, color-mix(in oklab, var(--ig-accent) 82%, #000));
  box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ig-accent) 70%, #000), inset 0 1px 0 rgb(255 255 255 / .4), 0 10px 22px -8px color-mix(in oklab, var(--ig-accent) 70%, transparent);
}
.ig-hub::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--ig-accent) 60%, transparent);
  animation: ig-ping var(--ig-cycle) ease-out infinite;
}
@keyframes ig-ping { 0% { opacity: 1; transform: scale(1) } 30%, 100% { opacity: 0; transform: scale(1.7) } }
.ig-hub svg { width: 22px; height: 22px }

.ig[data-paused], .ig[data-paused] *, .ig[data-paused] *::before, .ig[data-paused] *::after { animation-play-state: paused !important }
@media (prefers-reduced-motion: reduce) {
  .ig *, .ig *::before, .ig *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export function IntegrationGrid({
  items = DEFAULT_ITEMS,
  center,
  speed = 1,
  paused = false,
  accent,
  label = "A honeycomb wall of app tiles with a ripple of light travelling outward from the middle",
  className,
}: IntegrationGridProps) {
  const [rootRef, scale] = useStageScale(W)

  const style = {
    "--ig-speed": speed,
    "--ig-scale": scale || 1,
    ...(accent ? { "--ig-accent": accent } : null),
  } as React.CSSProperties

  return (
    <div
      ref={rootRef}
      className={["ig", className].filter(Boolean).join(" ")}
      style={style}
      role="img"
      aria-label={label}
      data-paused={paused || undefined}
      data-ready={scale > 0 || undefined}
    >
      <style href="integration-grid" precedence="default">
        {CSS}
      </style>
      <div className="ig-stage" aria-hidden="true">
        <div className="ig-wall">
          <div className="ig-bloom" />
          {CELLS.map((cell, i) => {
            const item = cell.hub || items.length === 0 ? undefined : items[cell.n % items.length]
            return (
              <div
                key={i}
                className="ig-cell"
                title={item?.name}
                style={{ left: cell.x, top: cell.y, "--d": cell.d } as React.CSSProperties}
              >
                {cell.hub ? (
                  <div className="ig-hub">{center ?? <Sparkles strokeWidth={1.6} />}</div>
                ) : (
                  <div
                    className="ig-tile"
                    data-tint={item?.tint ? "" : undefined}
                    style={item?.tint ? ({ "--tint": item.tint } as React.CSSProperties) : undefined}
                  >
                    {item?.icon}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default IntegrationGrid

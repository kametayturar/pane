"use client"

import * as React from "react"
import { Menu, Moon, Sun, X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Landing Nav – the slim top bar of a landing page.
 *
 * Brand mark and name on the left, three to five centred links, and on the right an optional text link,
 * an optional theme toggle and one filled action. Sticky by default: once the page (or the nearest scrolling
 * parent) has scrolled a little, the bar gains a hairline and a solid background in one eased change.
 * Below 720px of its own width the links fold into a menu button that opens a full-width panel under the bar
 * (a disclosure: `aria-expanded`, focus moves in, Escape or an outside click closes it, focus returns).
 *
 * Content is plain data (`DEFAULT_LANDING_NAV`), so a page builder can edit and save it as JSON.
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingNavLink = {
  label: string
  href: string
}

export type LandingNavProps = {
  /** Product name. Its first letter draws the default monogram. */
  brand?: string
  /** Where the brand links to. Default "#". */
  brandHref?: string
  /** Replaces the default rounded-square monogram (pass your logo, about 28px tall). */
  mark?: React.ReactNode
  /** Three to five centred links. More than five are cut to five. */
  links?: LandingNavLink[]
  /** `href` (or `label`) of the current page's link; it is highlighted and gets `aria-current="page"`. */
  current?: string
  /** Quiet text link before the action ("Sign in"). `null` hides it. */
  textLink?: LandingNavLink | null
  /** The one filled action on the right. `null` hides it. */
  action?: LandingNavLink | null
  /** Called when the action is pressed (it still follows `href` unless you prevent it). */
  onAction?: (event: React.MouseEvent<HTMLAnchorElement>) => void
  /** Shows a theme toggle that calls this. The icon follows the `.dark` / `[data-theme="dark"]` ancestor. */
  onToggleTheme?: () => void
  /** Sticks to the top of its scrolling parent. Default true. */
  sticky?: boolean
  /** Forces the scrolled look (hairline and background) on or off. By default it follows the scroll position. */
  scrolled?: boolean
  /** Accessible name of the `<nav>`. Default "Main". */
  navLabel?: string
  /** Label of the menu button on narrow widths. Default "Menu". */
  menuLabel?: string
  /** Max content width in px. Default 1200. */
  width?: number
  /** The bar's parts fade and rise in once when it first shows. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_NAV = {
  brand: "Northwind",
  brandHref: "#",
  links: [
    { label: "Product", href: "#product" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "#docs" },
  ],
  current: "",
  textLink: { label: "Sign in", href: "#sign-in" },
  action: { label: "Start free", href: "#start" },
} satisfies Pick<LandingNavProps, "brand" | "brandHref" | "links" | "current" | "textLink" | "action">

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lnv {
  --lnv-ink: #000;
  --lnv-bar: #fff;
  --lnv-accent: var(--pane-accent, #0060e2);
  --lnv-t1: color-mix(in oklab, var(--lnv-ink) 88%, transparent);
  --lnv-t2: color-mix(in oklab, var(--lnv-ink) 61%, transparent);
  --lnv-t3: color-mix(in oklab, var(--lnv-ink) 45%, transparent);
  --lnv-fill: color-mix(in oklab, var(--lnv-ink) 5%, transparent);
  --lnv-line: color-mix(in oklab, var(--lnv-ink) 8%, transparent);
  --lnv-solid: color-mix(in oklab, var(--lnv-ink) 90%, var(--lnv-bar));
  --lnv-drop: 0 16px 32px -20px rgb(0 0 0 / .18);
  --lnv-ease: cubic-bezier(.22, 1, .36, 1);
  --lnv-radius: 8px;
  --lnv-mark-radius: 8px;
  --lnv-gutter: 24px;
  position: relative;
  z-index: 40;
  display: block;
  width: 100%;
  container: lnv / inline-size;
  font: 14px/20px var(--lnv-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lnv-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  background-color: transparent;
  box-shadow: 0 1px 0 transparent;
  transition: background-color 280ms var(--lnv-ease), box-shadow 280ms var(--lnv-ease);
}
:is(.dark, [data-theme="dark"]) .lnv {
  --lnv-ink: #fff;
  --lnv-bar: #0a0a0a;
  --lnv-t1: color-mix(in oklab, var(--lnv-ink) 92%, transparent);
  --lnv-t2: color-mix(in oklab, var(--lnv-ink) 62%, transparent);
  --lnv-t3: color-mix(in oklab, var(--lnv-ink) 46%, transparent);
  --lnv-fill: color-mix(in oklab, var(--lnv-ink) 7%, transparent);
  --lnv-line: color-mix(in oklab, var(--lnv-ink) 10%, transparent);
  --lnv-drop: 0 16px 32px -20px rgb(0 0 0 / .7);
}
.lnv[data-sticky] { position: sticky; top: 0 }
.lnv:is([data-scrolled], [data-open]) { background-color: var(--lnv-bar); box-shadow: 0 1px 0 var(--lnv-line) }

.lnv *, .lnv *::before, .lnv *::after { box-sizing: border-box }
:where(.lnv) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.lnv) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
:where(.lnv) ul { list-style: none; margin: 0; padding: 0 }
.lnv :focus-visible { outline: 2px solid var(--lnv-accent); outline-offset: 2px }
.lnv svg { display: block; flex: none }

.lnv-in {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 16px;
  max-width: calc(var(--lnv-width, 1200px) + 2 * var(--lnv-gutter)); height: 64px; margin: 0 auto; padding: 0 var(--lnv-gutter);
}

/* brand */
.lnv-brand {
  justify-self: start; display: inline-flex; align-items: center; gap: 10px; min-width: 0; max-width: 100%;
  border-radius: var(--lnv-radius); font-size: 15px; font-weight: 600; letter-spacing: -.01em; color: var(--lnv-t1);
}
.lnv-brand > span:last-child { overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.lnv-mark { display: inline-flex; flex: none; align-items: center }
.lnv-mono {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--lnv-mark-radius);
  background: var(--lnv-solid); color: var(--lnv-bar); font-size: 14px; font-weight: 600; letter-spacing: 0; line-height: 1;
}

/* links */
.lnv-links { display: flex; align-items: center; gap: 2px }
.lnv-link {
  display: inline-flex; align-items: center; height: 36px; padding: 0 12px; border-radius: var(--lnv-radius);
  color: var(--lnv-t2); white-space: nowrap;
  transition: color 160ms var(--lnv-ease), background-color 160ms var(--lnv-ease);
}
.lnv-link:hover { color: var(--lnv-t1); background-color: var(--lnv-fill) }
.lnv-link[aria-current="page"] { color: var(--lnv-t1); background-color: var(--lnv-fill) }

/* end */
.lnv-end { justify-self: end; display: flex; align-items: center; gap: 4px }
.lnv-icon {
  display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: var(--lnv-radius); color: var(--lnv-t2);
  transition: color 160ms var(--lnv-ease), background-color 160ms var(--lnv-ease), transform 120ms var(--lnv-ease);
}
.lnv-icon:hover { color: var(--lnv-t1); background-color: var(--lnv-fill) }
.lnv-icon:active { transform: scale(.94) }
.lnv .lnv-sun { display: none }
:is(.dark, [data-theme="dark"]) .lnv .lnv-sun { display: block }
:is(.dark, [data-theme="dark"]) .lnv .lnv-moon { display: none }
.lnv-btn {
  display: inline-flex; align-items: center; justify-content: center; height: 36px; margin-left: 6px; padding: 0 14px;
  border-radius: var(--lnv-radius); background: var(--lnv-solid); color: var(--lnv-bar);
  font-size: 13.5px; font-weight: 500; white-space: nowrap;
  transition: background-color 160ms var(--lnv-ease), transform 120ms var(--lnv-ease);
}
.lnv-btn:hover { background: color-mix(in oklab, var(--lnv-ink) 78%, var(--lnv-bar)) }
.lnv-btn:active { transform: scale(.97) }
.lnv-menu { display: none }

/* narrow: links fold into the menu */
.lnv-panel { display: none }
@container lnv (max-width: 719.98px) {
  .lnv-in { grid-template-columns: minmax(0, 1fr) auto; height: 56px }
  .lnv-center, .lnv-end > .lnv-text { display: none }
  .lnv-menu { display: inline-grid }
  .lnv-panel:not([hidden]) {
    display: block; position: absolute; top: 100%; left: 0; right: 0;
    background-color: var(--lnv-bar); box-shadow: 0 1px 0 var(--lnv-line), var(--lnv-drop);
    border-top: 1px solid var(--lnv-line);
    animation: lnv-drop 240ms var(--lnv-ease) backwards;
  }
}
@container lnv (max-width: 479.98px) {
  .lnv-in, .lnv-panel { --lnv-gutter: 16px }
  .lnv-in { gap: 12px }
  .lnv-btn { margin-left: 4px; padding: 0 12px }
}
.lnv-pin { max-width: calc(var(--lnv-width, 1200px) + 2 * var(--lnv-gutter)); margin: 0 auto; padding: 8px calc(var(--lnv-gutter) - 12px) 16px }
.lnv-plink {
  display: flex; align-items: center; min-height: 48px; padding: 0 12px; border-radius: var(--lnv-radius);
  font-size: 16px; color: var(--lnv-t1);
  transition: background-color 160ms var(--lnv-ease);
}
.lnv-plink:hover { background-color: var(--lnv-fill) }
.lnv-plink[aria-current="page"] { background-color: var(--lnv-fill); font-weight: 500 }
.lnv-plink[data-quiet] { color: var(--lnv-t2) }

/* arrival */
.lnv[data-reveal="wait"] .lnv-r { opacity: 0; transform: translateY(12px) }
.lnv[data-reveal="in"] .lnv-r {
  transition: opacity 560ms var(--lnv-ease), transform 560ms var(--lnv-ease);
  transition-delay: calc(var(--i, 0) * 70ms);
}

@keyframes lnv-drop { from { opacity: 0; transform: translateY(-6px) } }

/* Mono: ink on paper, a 1px rule, small radii and a monospaced face */
html[data-style="mono"] .lnv {
  --lnv-accent: #111; --lnv-radius: 4px; --lnv-mark-radius: 3px;
  --lnv-line: color-mix(in oklab, var(--lnv-ink) 14%, transparent);
  --lnv-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 13px;
}
html[data-style="mono"].dark .lnv { --lnv-accent: #f2f2f2 }
html[data-style="mono"] .lnv-brand { font-size: 14px; letter-spacing: -.02em }
html[data-style="mono"] .lnv-btn { font-size: 12.5px }
html[data-style="mono"] .lnv-plink { font-size: 15px }

/* Glass: Pane tokens; the bar frosts once it is over content, the panel stays near-opaque (no glass on glass) */
html[data-style="glass"] .lnv {
  --lnv-ink: var(--pane-ink); --lnv-bar: var(--pane-solid); --lnv-accent: var(--pane-accent);
  --lnv-t1: var(--pane-t1); --lnv-t2: var(--pane-t2); --lnv-t3: var(--pane-t3);
  --lnv-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lnv-fill: color-mix(in oklab, var(--pane-ink) 7%, transparent);
  --lnv-ease: var(--pane-ease); --lnv-font: var(--pane-font); --lnv-radius: 10px;
}
html[data-style="glass"] .lnv:is([data-scrolled], [data-open]) {
  background-color: var(--pane-tint); background-image: var(--pane-sheen);
  box-shadow: inset 0 -1px 0 rgb(255 255 255 / .35), 0 1px 0 var(--lnv-line), 0 10px 30px -18px rgb(30 40 100 / .35);
}
html[data-style="glass"].dark .lnv:is([data-scrolled], [data-open]) {
  box-shadow: inset 0 -1px 0 rgb(255 255 255 / .08), 0 1px 0 var(--lnv-line), 0 10px 30px -18px rgb(0 0 0 / .7);
}
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lnv:is([data-scrolled], [data-open]) { -webkit-backdrop-filter: blur(16px) saturate(1.8); backdrop-filter: blur(16px) saturate(1.8) }
  html[data-style="glass"].dark .lnv:is([data-scrolled], [data-open]) { -webkit-backdrop-filter: blur(16px) saturate(1.7); backdrop-filter: blur(16px) saturate(1.7) }
}
@container lnv (max-width: 719.98px) {
  html[data-style="glass"] .lnv-panel:not([hidden]) { background-color: var(--pane-tint-over); border-top-color: transparent }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lnv:is([data-scrolled], [data-open]) { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

@media (prefers-reduced-motion: reduce) {
  .lnv, .lnv *, .lnv *::before, .lnv *::after { transition: none !important; animation: none !important }
  .lnv[data-reveal] .lnv-r { opacity: 1; transform: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED = "(prefers-reduced-motion: reduce)"
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/** The nearest ancestor that scrolls vertically, or the window. */
function scrollParent(el: HTMLElement): HTMLElement | Window {
  let p = el.parentElement
  while (p && p !== document.body && p !== document.documentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(p).overflowY)) return p
    p = p.parentElement
  }
  return window
}

function Monogram({ brand }: { brand: string }) {
  const letter = Array.from(brand.trim())[0]?.toUpperCase() ?? "·"
  return (
    <span className="lnv-mono" aria-hidden>
      {letter}
    </span>
  )
}

const isCurrent = (link: LandingNavLink, current?: string) => !!current && (link.href === current || link.label === current)

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function LandingNav({
  brand = DEFAULT_LANDING_NAV.brand,
  brandHref = DEFAULT_LANDING_NAV.brandHref,
  mark,
  links = DEFAULT_LANDING_NAV.links,
  current = DEFAULT_LANDING_NAV.current,
  textLink = DEFAULT_LANDING_NAV.textLink,
  action = DEFAULT_LANDING_NAV.action,
  onAction,
  onToggleTheme,
  sticky = true,
  scrolled: scrolledProp,
  navLabel = "Main",
  menuLabel = "Menu",
  width = 1200,
  reveal = true,
  className,
}: LandingNavProps) {
  const rootRef = React.useRef<HTMLElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panelId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [scrolledAuto, setScrolledAuto] = React.useState(false)
  const [phase, setPhase] = React.useState<"off" | "wait" | "in">("off")
  const shown = links.slice(0, 5)
  const scrolled = scrolledProp ?? (sticky && scrolledAuto)

  /* Scrolled look: follow the nearest scrolling parent (the window on a real page, a frame in a builder). */
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || scrolledProp !== undefined || !sticky) return
    const target = scrollParent(el)
    const read = () => setScrolledAuto((target instanceof Window ? window.scrollY : target.scrollTop) > 8)
    read()
    target.addEventListener("scroll", read, { passive: true })
    return () => target.removeEventListener("scroll", read)
  }, [scrolledProp, sticky])

  /* Arrival: hide before first paint, then let the parts rise in once the bar is on screen. */
  useIsoLayoutEffect(() => {
    const el = rootRef.current
    if (!el || !reveal || window.matchMedia(REDUCED).matches || typeof IntersectionObserver === "undefined") return
    setPhase("wait")
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        // One frame in the hidden state so the transition has a start.
        requestAnimationFrame(() => setPhase("in"))
        window.setTimeout(() => setPhase("in"), 120)
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [reveal])

  /* Menu: focus moves in on open; Escape, an outside press or focus landing outside the bar closes it. */
  const close = React.useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  React.useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>("a")?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close(true)
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    const onFocus = (e: FocusEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("focusin", onFocus)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("focusin", onFocus)
    }
  }, [open, close])

  const brandLabel = brand.trim() || "Home"

  return (
    <header
      ref={rootRef}
      className={cn("lnv", className)}
      data-sticky={sticky ? "" : undefined}
      data-scrolled={scrolled ? "" : undefined}
      data-open={open ? "" : undefined}
      data-reveal={phase === "off" ? undefined : phase}
      style={{ "--lnv-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-nav" precedence="default">
        {CSS}
      </style>
      <nav aria-label={navLabel}>
        <div className="lnv-in">
          <a className="lnv-brand lnv-r" href={brandHref} style={{ "--i": 0 } as React.CSSProperties} aria-label={brand ? undefined : brandLabel}>
            <span className="lnv-mark" aria-hidden={brand ? true : undefined}>
              {mark ?? <Monogram brand={brandLabel} />}
            </span>
            {brand && <span>{brand}</span>}
          </a>

          {shown.length > 0 && (
            <ul className="lnv-center lnv-links lnv-r" style={{ "--i": 1 } as React.CSSProperties}>
              {shown.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <a className="lnv-link" href={l.href} aria-current={isCurrent(l, current) ? "page" : undefined}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="lnv-end lnv-r" style={{ "--i": 2 } as React.CSSProperties}>
            {textLink && (
              <a className="lnv-link lnv-text" href={textLink.href} aria-current={isCurrent(textLink, current) ? "page" : undefined}>
                {textLink.label}
              </a>
            )}
            {onToggleTheme && (
              <button type="button" className="lnv-icon" onClick={onToggleTheme} aria-label="Toggle colour theme">
                <Moon className="lnv-moon" size={16} strokeWidth={1.75} aria-hidden />
                <Sun className="lnv-sun" size={16} strokeWidth={1.75} aria-hidden />
              </button>
            )}
            {action && (
              <a className="lnv-btn" href={action.href} onClick={onAction}>
                {action.label}
              </a>
            )}
            {(shown.length > 0 || textLink) && (
              <button
                ref={buttonRef}
                type="button"
                className="lnv-icon lnv-menu"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={menuLabel}
                onClick={() => (open ? close(true) : setOpen(true))}
              >
                {open ? <X size={18} strokeWidth={1.75} aria-hidden /> : <Menu size={18} strokeWidth={1.75} aria-hidden />}
              </button>
            )}
          </div>
        </div>

        <div id={panelId} ref={panelRef} className="lnv-panel" hidden={!open}>
          <ul className="lnv-pin">
            {shown.map((l) => (
              <li key={`${l.label}-${l.href}`}>
                <a className="lnv-plink" href={l.href} aria-current={isCurrent(l, current) ? "page" : undefined} onClick={() => close(false)}>
                  {l.label}
                </a>
              </li>
            ))}
            {textLink && (
              <li>
                <a className="lnv-plink" data-quiet href={textLink.href} onClick={() => close(false)}>
                  {textLink.label}
                </a>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  )
}

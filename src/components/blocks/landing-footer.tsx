"use client"

import * as React from "react"
import { AtSign, BriefcaseBusiness, Camera, CodeXml, Globe, Mail, MessagesSquare, Rss, SquarePlay, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Landing Footer – the quiet foot of a landing page.
 *
 * Brand mark and name with one line of description, up to five social links as plain line icons, two to five
 * titled link columns (two columns on phones) and a bottom line with the copyright and small legal links.
 * Muted text, one hairline above, no boxes. The parts rise and fade in once when the footer scrolls into view.
 *
 * Content is plain data (`DEFAULT_LANDING_FOOTER`), so a page builder can edit and save it as JSON.
 */

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingFooterLink = {
  label: string
  href: string
}

/**
 * Which glyph a social link gets. Lucide ships no brand logos, so each kind maps to a neutral line icon:
 * x → at sign, github → code brackets, linkedin → briefcase, youtube → play square, mail → envelope,
 * discord → speech bubbles, instagram → camera, rss → feed, anything else → globe.
 */
export type LandingFooterSocialKind = "x" | "github" | "linkedin" | "youtube" | "mail" | "discord" | "instagram" | "rss" | "website" | (string & {})

export type LandingFooterSocial = {
  kind: LandingFooterSocialKind
  href: string
  /** Accessible name. Default: the platform name ("GitHub", "Email"). */
  label?: string
}

export type LandingFooterColumn = {
  title: string
  links: LandingFooterLink[]
}

export type LandingFooterProps = {
  /** Product name. Its first letter draws the default monogram. */
  brand?: string
  /** Where the brand links to. Default "#". */
  brandHref?: string
  /** Replaces the default rounded-square monogram (pass your logo, about 28px tall). */
  mark?: React.ReactNode
  /** One line under the brand. */
  description?: string
  /** Up to five social links shown as line icons. More are cut to five. */
  socials?: LandingFooterSocial[]
  /** Two to five titled link columns. More are cut to five. */
  columns?: LandingFooterColumn[]
  /** The copyright line, e.g. "© 2026 Northwind, Inc.". */
  copyright?: string
  /** Small links on the bottom line (privacy, terms). */
  legal?: LandingFooterLink[]
  /** Heading level of the column titles. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Max content width in px. Default 1200. */
  width?: number
  /** The parts fade and rise in once when the footer scrolls into view. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_FOOTER = {
  brand: "Northwind",
  brandHref: "#",
  description: "Support replies drafted by Atlas and approved by your team.",
  socials: [
    { kind: "x", href: "#x" },
    { kind: "github", href: "#github" },
    { kind: "linkedin", href: "#linkedin" },
    { kind: "youtube", href: "#youtube" },
    { kind: "mail", href: "mailto:hello@northwind.example" },
  ],
  columns: [
    {
      title: "Product",
      links: [
        { label: "Overview", href: "#overview" },
        { label: "Agents", href: "#agents" },
        { label: "Integrations", href: "#integrations" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#changelog" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "For support teams", href: "#support" },
        { label: "For online shops", href: "#shops" },
        { label: "For SaaS teams", href: "#saas" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Docs", href: "#docs" },
        { label: "Guides", href: "#guides" },
        { label: "API reference", href: "#api" },
        { label: "Status", href: "#status" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#about" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" },
      ],
    },
  ],
  copyright: "© 2026 Northwind, Inc.",
  legal: [
    { label: "Privacy", href: "#privacy" },
    { label: "Terms", href: "#terms" },
    { label: "Security", href: "#security" },
  ],
} satisfies Pick<LandingFooterProps, "brand" | "brandHref" | "description" | "socials" | "columns" | "copyright" | "legal">

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lft {
  --lft-ink: #000;
  --lft-bg: #fff;
  --lft-accent: var(--pane-accent, #0060e2);
  --lft-t1: color-mix(in oklab, var(--lft-ink) 88%, transparent);
  --lft-t2: color-mix(in oklab, var(--lft-ink) 61%, transparent);
  --lft-t3: color-mix(in oklab, var(--lft-ink) 45%, transparent);
  --lft-fill: color-mix(in oklab, var(--lft-ink) 5%, transparent);
  --lft-line: color-mix(in oklab, var(--lft-ink) 8%, transparent);
  --lft-solid: color-mix(in oklab, var(--lft-ink) 90%, var(--lft-bg));
  --lft-ease: cubic-bezier(.22, 1, .36, 1);
  --lft-radius: 8px;
  --lft-mark-radius: 8px;
  --lft-gutter: 24px;
  display: block;
  width: 100%;
  container: lft / inline-size;
  font: 14px/20px var(--lft-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lft-t2);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lft {
  --lft-ink: #fff;
  --lft-bg: #0a0a0a;
  --lft-t1: color-mix(in oklab, var(--lft-ink) 92%, transparent);
  --lft-t2: color-mix(in oklab, var(--lft-ink) 62%, transparent);
  --lft-t3: color-mix(in oklab, var(--lft-ink) 46%, transparent);
  --lft-fill: color-mix(in oklab, var(--lft-ink) 7%, transparent);
  --lft-line: color-mix(in oklab, var(--lft-ink) 10%, transparent);
}
.lft *, .lft *::before, .lft *::after { box-sizing: border-box }
:where(.lft) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
:where(.lft) :is(ul, p, h2, h3, h4, h5, h6) { list-style: none; margin: 0; padding: 0; font: inherit }
.lft :focus-visible { outline: 2px solid var(--lft-accent); outline-offset: 2px }
.lft svg { display: block; flex: none }

.lft-in { max-width: calc(var(--lft-width, 1200px) + 2 * var(--lft-gutter)); margin: 0 auto; padding: 0 var(--lft-gutter) }
.lft-rule { border-top: 1px solid var(--lft-line); padding: 56px 0 40px }

.lft-top { display: grid; gap: 48px }
@container lft (min-width: 880px) {
  .lft-top { grid-template-columns: minmax(240px, 4fr) minmax(0, 8fr); gap: 32px }
  .lft-rule { padding-top: 64px }
}

/* brand block */
.lft-about { min-width: 0; max-width: 340px }
.lft-brand {
  display: inline-flex; align-items: center; gap: 10px; max-width: 100%; border-radius: var(--lft-radius);
  font-size: 15px; font-weight: 600; letter-spacing: -.01em; color: var(--lft-t1);
}
.lft-brand > span:last-child { overflow: hidden; white-space: nowrap; text-overflow: ellipsis }
.lft-mark { display: inline-flex; flex: none; align-items: center }
.lft-mono {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--lft-mark-radius);
  background: var(--lft-solid); color: var(--lft-bg); font-size: 14px; font-weight: 600; line-height: 1;
}
.lft-desc { margin-top: 12px; font-size: 13.5px; line-height: 22px; color: var(--lft-t2); text-wrap: pretty }
.lft-social { display: flex; flex-wrap: wrap; gap: 4px; margin: 20px 0 0 -8px }
.lft-icon {
  display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: var(--lft-radius); color: var(--lft-t3);
  transition: color 160ms var(--lft-ease), background-color 160ms var(--lft-ease);
}
.lft-icon:hover { color: var(--lft-t1); background-color: var(--lft-fill) }

/* columns */
.lft-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; min-width: 0 }
@container lft (min-width: 600px) { .lft-cols { grid-template-columns: repeat(var(--n3, 3), minmax(0, 1fr)) } }
@container lft (min-width: 760px) { .lft-cols { grid-template-columns: repeat(var(--n, 4), minmax(120px, 192px)) } }
@container lft (min-width: 880px) { .lft-cols { justify-content: end } }
.lft-col { min-width: 0 }
.lft-title { font-size: 13px; line-height: 28px; font-weight: 500; color: var(--lft-t1) }
.lft-list { display: grid; gap: 2px; margin-top: 8px }
.lft-link {
  display: inline-flex; align-items: center; min-height: 32px; max-width: 100%; border-radius: 4px;
  font-size: 13.5px; color: var(--lft-t2); overflow-wrap: anywhere;
  transition: color 160ms var(--lft-ease);
}
.lft-link:hover { color: var(--lft-t1) }

/* bottom line */
.lft-base {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px;
  margin-top: 56px; font-size: 12.5px; line-height: 20px; color: var(--lft-t3);
}
@container lft (min-width: 880px) { .lft-base { margin-top: 72px } }
.lft-legal { display: flex; flex-wrap: wrap; gap: 4px 20px }
.lft-legal a { display: inline-flex; align-items: center; min-height: 32px; border-radius: 4px; transition: color 160ms var(--lft-ease) }
.lft-legal a:hover { color: var(--lft-t1) }

/* arrival */
.lft[data-reveal="wait"] .lft-r { opacity: 0; transform: translateY(14px) }
.lft[data-reveal="in"] .lft-r {
  transition: opacity 620ms var(--lft-ease), transform 620ms var(--lft-ease);
  transition-delay: calc(var(--i, 0) * 70ms);
}

/* Mono: ink on paper, a stronger 1px rule, small radii and a monospaced face */
html[data-style="mono"] .lft {
  --lft-accent: #111; --lft-radius: 4px; --lft-mark-radius: 3px;
  --lft-line: color-mix(in oklab, var(--lft-ink) 14%, transparent);
  --lft-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 13px;
}
html[data-style="mono"].dark .lft { --lft-accent: #f2f2f2 }
html[data-style="mono"] .lft-brand { font-size: 14px; letter-spacing: -.02em }
html[data-style="mono"] :is(.lft-desc, .lft-link) { font-size: 12.5px }
html[data-style="mono"] .lft-title { font-size: 12.5px }
html[data-style="mono"] .lft-base { font-size: 12px }

/* Glass: Pane's stronger text floors over the moving backdrop; the footer stays a clear sheet, no frost */
html[data-style="glass"] .lft {
  --lft-ink: var(--pane-ink); --lft-bg: var(--pane-solid); --lft-accent: var(--pane-accent);
  --lft-t1: var(--pane-t1); --lft-t2: var(--pane-t2); --lft-t3: var(--pane-t3);
  --lft-line: color-mix(in oklab, var(--pane-ink) 14%, transparent);
  --lft-fill: color-mix(in oklab, var(--pane-ink) 8%, transparent);
  --lft-ease: var(--pane-ease); --lft-font: var(--pane-font); --lft-radius: 10px;
}
html[data-style="glass"] .lft-icon:hover { background-color: var(--pane-tint-nested) }

@media (prefers-reduced-motion: reduce) {
  .lft *, .lft *::before, .lft *::after { transition: none !important; animation: none !important }
  .lft[data-reveal] .lft-r { opacity: 1; transform: none }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const REDUCED = "(prefers-reduced-motion: reduce)"
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

const SOCIALS: Record<string, { icon: LucideIcon; name: string }> = {
  x: { icon: AtSign, name: "X" },
  twitter: { icon: AtSign, name: "X" },
  github: { icon: CodeXml, name: "GitHub" },
  linkedin: { icon: BriefcaseBusiness, name: "LinkedIn" },
  youtube: { icon: SquarePlay, name: "YouTube" },
  mail: { icon: Mail, name: "Email" },
  email: { icon: Mail, name: "Email" },
  discord: { icon: MessagesSquare, name: "Discord" },
  instagram: { icon: Camera, name: "Instagram" },
  rss: { icon: Rss, name: "RSS feed" },
  website: { icon: Globe, name: "Website" },
}

function social(kind: string) {
  const k = kind.toLowerCase()
  return SOCIALS[k] ?? { icon: Globe, name: kind ? kind[0].toUpperCase() + kind.slice(1) : "Link" }
}

function Monogram({ brand }: { brand: string }) {
  const letter = Array.from(brand.trim())[0]?.toUpperCase() ?? "·"
  return (
    <span className="lft-mono" aria-hidden>
      {letter}
    </span>
  )
}

const step = (i: number) => ({ "--i": i }) as React.CSSProperties

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function LandingFooter({
  brand = DEFAULT_LANDING_FOOTER.brand,
  brandHref = DEFAULT_LANDING_FOOTER.brandHref,
  mark,
  description = DEFAULT_LANDING_FOOTER.description,
  socials = DEFAULT_LANDING_FOOTER.socials,
  columns = DEFAULT_LANDING_FOOTER.columns,
  copyright = DEFAULT_LANDING_FOOTER.copyright,
  legal = DEFAULT_LANDING_FOOTER.legal,
  headingLevel = 2,
  width = 1200,
  reveal = true,
  className,
}: LandingFooterProps) {
  const rootRef = React.useRef<HTMLElement>(null)
  const [phase, setPhase] = React.useState<"off" | "wait" | "in">("off")
  const cols = columns.slice(0, 5)
  const icons = socials.slice(0, 5)
  const H = `h${headingLevel}` as "h2"
  const uid = React.useId()
  const brandLabel = brand.trim() || "Home"

  /* Arrival: hidden before first paint, then the parts rise in once the footer is on screen. */
  useIsoLayoutEffect(() => {
    const el = rootRef.current
    if (!el || !reveal || window.matchMedia(REDUCED).matches || typeof IntersectionObserver === "undefined") return
    setPhase("wait")
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          requestAnimationFrame(() => setPhase("in"))
          window.setTimeout(() => setPhase("in"), 120)
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reveal])

  return (
    <footer
      ref={rootRef}
      className={cn("lft", className)}
      data-reveal={phase === "off" ? undefined : phase}
      style={{ "--lft-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-footer" precedence="default">
        {CSS}
      </style>
      <div className="lft-in">
        <div className="lft-rule">
          <div className="lft-top">
            <div className="lft-about lft-r" style={step(0)}>
              <a className="lft-brand" href={brandHref} aria-label={brand ? undefined : brandLabel}>
                <span className="lft-mark" aria-hidden={brand ? true : undefined}>
                  {mark ?? <Monogram brand={brandLabel} />}
                </span>
                {brand && <span>{brand}</span>}
              </a>
              {description && <p className="lft-desc">{description}</p>}
              {icons.length > 0 && (
                <ul className="lft-social" aria-label="Social links">
                  {icons.map((s, i) => {
                    const { icon: Icon, name } = social(s.kind)
                    return (
                      <li key={`${s.kind}-${i}`}>
                        <a className="lft-icon" href={s.href} aria-label={s.label ?? name} title={s.label ?? name}>
                          <Icon size={16} strokeWidth={1.75} aria-hidden />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {cols.length > 0 && (
              <nav className="lft-cols" aria-label="Footer" style={{ "--n": cols.length, "--n3": Math.min(cols.length, 3) } as React.CSSProperties}>
                {cols.map((c, i) => {
                  const id = `${uid}-c${i}`
                  return (
                    <div key={`${c.title}-${i}`} className="lft-col lft-r" style={step(i + 1)}>
                      <H className="lft-title" id={id}>
                        {c.title}
                      </H>
                      <ul className="lft-list" aria-labelledby={id}>
                        {c.links.map((l, j) => (
                          <li key={`${l.label}-${j}`}>
                            <a className="lft-link" href={l.href}>
                              {l.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </nav>
            )}
          </div>

          {(copyright || legal.length > 0) && (
            <div className="lft-base lft-r" style={step(cols.length + 1)}>
              {copyright && <p>{copyright}</p>}
              {legal.length > 0 && (
                <ul className="lft-legal" aria-label="Legal">
                  {legal.map((l, i) => (
                    <li key={`${l.label}-${i}`}>
                      <a href={l.href}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}

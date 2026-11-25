"use client"

/**
 * Landing Pricing – the pricing part of a landing page, in two layouts.
 *
 * - `layout="plans"` (default): a centred two-tone heading, an optional Monthly / Yearly switch with one plain
 *   line saying what yearly saves, then two to four plan cards in a row that stack on narrow containers.
 * - `layout="teaser"`: heading, paragraph and a link on the left, one plan card on the right (the `featured`
 *   plan, or the first one).
 *
 * A plan card holds a name, a price (the currency symbol small and raised, the number large with tabular
 * figures, then a unit such as "/ month"), an optional one-line description, up to six ticked features,
 * optional label / value detail rows and one full-width button. A `featured` plan gets the filled button and an
 * accent hairline, nothing louder. The switch is a native radio group; changing it rolls each price once to the
 * other period's number. The heading, switch and cards rise in once when the section scrolls into view.
 *
 * ```tsx
 * <LandingPricing
 *   layout="teaser"
 *   title="Free to start."
 *   titleMuted="Pay for answers, not seats."
 *   plans={[{ name: "Core", price: 0, features: ["Unlimited inboxes"], action: { label: "Start free", href: "/start" } }]}
 * />
 * ```
 *
 * Content is plain data (`DEFAULT_LANDING_PRICING`), so a page builder can edit and save it as JSON.
 */

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type LandingPricingLink = {
  label: string
  href: string
}

export type LandingPricingDetail = {
  /** Left side, muted: "AI assistance". */
  label: string
  /** Right side: "Pay as you go". */
  value: string
}

export type LandingPricingPeriod = "monthly" | "yearly"

export type LandingPricingPlan = {
  name: string
  /** Monthly price. A number is drawn with the currency symbol and unit; a string ("Custom") is drawn as is. */
  price: number | string
  /** Price per month when billed yearly. Plans without it keep `price` in both periods. */
  priceYearly?: number | string
  /** Currency symbol, drawn small and raised. Default "$". */
  currency?: string
  /** Unit after the number. Default "/ month". */
  unit?: string
  /** One line under the price. */
  description?: string
  /** Up to six ticked features. More are cut to six. */
  features?: string[]
  /** Label / value rows under the features, e.g. "AI assistance" / "Pay as you go". */
  details?: LandingPricingDetail[]
  /** The card's one full-width button. */
  action: LandingPricingLink
  /** The filled button and an accent hairline. Use on one plan at most. */
  featured?: boolean
}

export type LandingPricingProps = {
  /** "plans": centred heading and a row of cards. "teaser": copy left, one card right. Default "plans". */
  layout?: "plans" | "teaser"
  /** First line of the heading. */
  title?: string
  /** Second line of the heading, drawn muted. Empty hides it. */
  titleMuted?: string
  /** A short paragraph under the heading. Empty hides it. */
  description?: string
  /** A plain link: under the paragraph in the teaser, under the cards in plans. `null` hides it. */
  link?: LandingPricingLink | null
  /** Two to four plans for "plans" (more are cut to four); the teaser shows the featured one, else the first. */
  plans?: LandingPricingPlan[]
  /** Show the Monthly / Yearly switch ("plans" only, and only when a plan has `priceYearly`). Default true. */
  billing?: boolean
  /** Which period is selected first. Default "monthly". */
  defaultPeriod?: LandingPricingPeriod
  /** The two switch labels. */
  periodLabels?: { monthly: string; yearly: string }
  /** The plain line under the switch. `{percent}` becomes the largest yearly saving, e.g. "20%". Empty hides it. */
  savingsNote?: string
  /** Level of the section heading; plan names are one level below. Default 2. */
  headingLevel?: 1 | 2 | 3 | 4
  /** Id on the `<section>`, for in-page links. */
  id?: string
  /** Max content width in px. Default 1200. */
  width?: number
  /** Heading, switch and cards rise in once when the section scrolls into view. Default true. */
  reveal?: boolean
  className?: string
}

export const DEFAULT_LANDING_PRICING = {
  layout: "plans",
  title: "Start free.",
  titleMuted: "Pay when the queue grows.",
  description: "Every plan includes Atlas for replies and Sage for routing. Add seats or tickets when you need them, and cancel whenever you like.",
  link: { label: "Compare every feature", href: "#compare" },
  plans: [
    {
      name: "Starter",
      price: 0,
      priceYearly: 0,
      description: "For one person answering the inbox.",
      features: ["One inbox and one seat", "Atlas drafts replies for approval", "100 answered tickets a month"],
      details: [{ label: "Extra tickets", value: "$0.20 each" }],
      action: { label: "Start free", href: "#start" },
    },
    {
      name: "Team",
      price: 29,
      priceYearly: 24,
      description: "For support teams with a shared queue.",
      features: ["Up to ten seats", "Atlas, Quill and Sage included", "Help desk and store connections", "Approval rules per queue"],
      details: [{ label: "Answered tickets", value: "2,000 a month" }],
      action: { label: "Start a 14-day trial", href: "#trial" },
      featured: true,
    },
    {
      name: "Scale",
      price: 79,
      priceYearly: 64,
      description: "For teams running several brands.",
      features: ["Unlimited inboxes and brands", "Each with its own tone and rules", "Roles, single sign-on and full history", "Priority support"],
      details: [{ label: "Answered tickets", value: "10,000 a month" }],
      action: { label: "Talk to us", href: "#contact" },
    },
  ],
  billing: true,
  defaultPeriod: "monthly",
  periodLabels: { monthly: "Monthly", yearly: "Yearly" },
  savingsNote: "Billed yearly, paid plans cost {percent} less.",
} satisfies Required<
  Pick<
    LandingPricingProps,
    "layout" | "title" | "titleMuted" | "description" | "plans" | "billing" | "defaultPeriod" | "periodLabels" | "savingsNote"
  >
> & { link: LandingPricingLink }

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.lpr {
  --lpr-ink: #000;
  --lpr-surface: #fff;
  --lpr-accent: var(--pane-accent, #0060e2);
  --lpr-on-accent: #fff;
  --lpr-btn: var(--lpr-accent);
  --lpr-t1: color-mix(in oklab, var(--lpr-ink) 88%, transparent);
  --lpr-t2: color-mix(in oklab, var(--lpr-ink) 61%, transparent);
  --lpr-t3: color-mix(in oklab, var(--lpr-ink) 45%, transparent);
  --lpr-fill: color-mix(in oklab, var(--lpr-ink) 5%, transparent);
  --lpr-line: color-mix(in oklab, var(--lpr-ink) 9%, transparent);
  --lpr-drop: 0 1px 2px rgb(0 0 0 / .04), 0 16px 36px -20px rgb(0 0 0 / .16);
  --lpr-thumb-shadow: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 2px rgb(0 0 0 / .08);
  --lpr-ease: cubic-bezier(.22, 1, .36, 1);
  --lpr-radius: 16px;
  --lpr-r-btn: 10px;
  --lpr-head-ls: -.035em;
  display: block;
  width: 100%;
  container: lpr / inline-size;
  font-size: 14px; line-height: 22px;
  font-family: var(--lpr-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--lpr-t1);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .lpr {
  --lpr-ink: #fff;
  --lpr-surface: #161618;
  --lpr-accent: var(--pane-accent, #4d8dff);
  --lpr-btn: color-mix(in oklab, var(--lpr-accent) 82%, #000);
  --lpr-t1: color-mix(in oklab, var(--lpr-ink) 92%, transparent);
  --lpr-t2: color-mix(in oklab, var(--lpr-ink) 62%, transparent);
  --lpr-t3: color-mix(in oklab, var(--lpr-ink) 46%, transparent);
  --lpr-fill: color-mix(in oklab, var(--lpr-ink) 7%, transparent);
  --lpr-line: color-mix(in oklab, var(--lpr-ink) 11%, transparent);
  --lpr-drop: 0 1px 2px rgb(0 0 0 / .3), 0 16px 36px -20px rgb(0 0 0 / .7);
  --lpr-thumb-shadow: 0 0 0 .5px rgb(255 255 255 / .12), 0 1px 2px rgb(0 0 0 / .4);
}
:is(.dark, [data-theme="dark"]) .lpr-switch { --lpr-thumb: #2a2a2e }

/* Mono: ink on paper, a firmer 1px rule, small radii and a monospaced face; featured is an ink line */
html[data-style="mono"] .lpr {
  --lpr-accent: #111; --lpr-btn: #111; --lpr-on-accent: #fff;
  --lpr-line: color-mix(in oklab, var(--lpr-ink) 14%, transparent);
  --lpr-drop: 0 0 #0000; --lpr-thumb-shadow: 0 0 0 1px var(--lpr-line);
  --lpr-ease: cubic-bezier(.2, .9, .1, 1);
  --lpr-font: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --lpr-radius: 6px; --lpr-r-btn: 4px;
  --lpr-head-ls: -.05em;
}
html[data-style="mono"].dark .lpr {
  --lpr-accent: #f2f2f2; --lpr-btn: #f2f2f2; --lpr-on-accent: #000; --lpr-surface: #0a0a0a;
  --lpr-line: color-mix(in oklab, var(--lpr-ink) 18%, transparent);
}
html[data-style="mono"] .lpr-h { font-size: clamp(26px, 2.6cqi + 14px, 44px) }
html[data-style="mono"] .lpr-num { letter-spacing: -.06em }
html[data-style="mono"] :is(.lpr-feats, .lpr-details, .lpr-desc, .lpr-text, .lpr-link, .lpr-btn) { font-size: 13px }

/* Glass: each card is a frosted slab with Pane's rim; text takes the stronger glass ramp */
html[data-style="glass"] .lpr {
  --lpr-ink: var(--pane-ink); --lpr-surface: var(--pane-solid); --lpr-accent: var(--pane-accent); --lpr-btn: var(--pane-accent);
  --lpr-ease: var(--pane-ease); --lpr-font: var(--pane-font);
  --lpr-t1: var(--pane-t1); --lpr-t2: var(--pane-t2); --lpr-t3: var(--pane-t3);
  --lpr-line: color-mix(in oklab, var(--pane-ink) 12%, transparent);
  --lpr-fill: color-mix(in oklab, var(--pane-ink) 7%, transparent);
  --lpr-thumb-shadow: var(--pane-shadow);
  --lpr-radius: 24px; --lpr-r-btn: 12px;
}
html[data-style="glass"].dark .lpr { --lpr-line: color-mix(in oklab, var(--pane-ink) 15%, transparent) }
html[data-style="glass"] .lpr-card { background-color: var(--pane-tint); background-image: var(--pane-sheen); box-shadow: var(--pane-card) }
html[data-style="glass"] .lpr-card[data-featured] { box-shadow: 0 0 0 1px var(--lpr-accent), var(--pane-card) }
html[data-style="glass"] .lpr-switch { --lpr-thumb: var(--pane-tint-float) }
html[data-style="glass"] .lpr-btn[data-variant="plain"] { background-color: var(--pane-tint-float); box-shadow: var(--pane-shadow) }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  html[data-style="glass"] .lpr-card { -webkit-backdrop-filter: blur(22px) saturate(2); backdrop-filter: blur(22px) saturate(2) }
  html[data-style="glass"].dark .lpr-card { -webkit-backdrop-filter: blur(22px) saturate(1.8); backdrop-filter: blur(22px) saturate(1.8) }
  html[data-style="glass"][data-refract] .lpr-card { -webkit-backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05); backdrop-filter: url(#pane-glass-card-l) saturate(1.8) brightness(1.05) }
  html[data-style="glass"].dark[data-refract] .lpr-card { -webkit-backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12); backdrop-filter: url(#pane-glass-card-d) saturate(1.7) brightness(1.12) }
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  html[data-style="glass"] .lpr-card { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--pane-solid); background-image: none }
}

.lpr *, .lpr *::before, .lpr *::after { box-sizing: border-box }
:where(.lpr) :is(h1, h2, h3, h4, h5, p, ul, li, dl, dt, dd, fieldset, legend) { margin: 0; padding: 0; border: 0; min-width: 0 }
:where(.lpr) ul { list-style: none }
:where(.lpr) a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent }
.lpr svg { display: block; flex: none }
.lpr-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0 }

.lpr-in {
  max-width: calc(var(--lpr-width, 1200px) + 48px); margin: 0 auto;
  padding: clamp(64px, 7cqi, 104px) 24px;
}

/* heading */
.lpr-h {
  font-weight: 500; font-size: clamp(30px, 3.2cqi + 16px, 52px); line-height: 1.06;
  letter-spacing: var(--lpr-head-ls); color: var(--lpr-ink); text-wrap: balance;
}
.lpr-h > span { display: block }
.lpr-h > span + span { color: var(--lpr-t3) }
.lpr-text { margin-top: 20px; max-width: 46ch; font-size: 16px; line-height: 26px; color: var(--lpr-t2); text-wrap: pretty }
.lpr-link {
  display: inline-flex; align-items: center; gap: 4px; border-radius: 4px;
  font-size: 14px; line-height: 20px; font-weight: 500; color: var(--lpr-accent);
}
.lpr-link svg { width: 14px; height: 14px; transition: transform 220ms var(--lpr-ease) }
@media (hover: hover) { .lpr-link:hover svg { transform: translateX(2px) } }
.lpr-link:active svg { transform: translateX(3px) }
.lpr :is(.lpr-link, .lpr-btn):focus-visible { outline: 2px solid var(--lpr-accent); outline-offset: 3px }

/* plans layout: centred head, switch, cards */
.lpr[data-layout="plans"] .lpr-head { display: grid; justify-items: center; text-align: center }
.lpr[data-layout="plans"] .lpr-text { max-width: 54ch; margin-inline: auto }
.lpr-billing { display: grid; justify-items: center; gap: 12px; margin-top: 32px }
.lpr-save { font-size: 13px; line-height: 20px; color: var(--lpr-t3); text-align: center; text-wrap: balance }
.lpr-plans {
  display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px;
  max-width: 440px; margin: 40px auto 0;
}
@container lpr (width >= 720px) { .lpr-plans { margin-top: 48px } }
@container lpr (width >= 620px) {
  .lpr-plans:is([data-count="2"], [data-count="4"]) { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 880px }
}
@container lpr (width >= 820px) { .lpr-plans[data-count="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: none } }
@container lpr (width >= 1060px) { .lpr-plans[data-count="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: none } }
.lpr-plans > li { display: flex; min-width: 0 }
.lpr-more { margin-top: 32px; text-align: center }

/* teaser layout: copy left, one card right */
.lpr-split { display: grid; gap: 40px; align-items: center }
.lpr-split .lpr-link { margin-top: 24px }
.lpr-aside { display: flex; width: 100%; max-width: 440px }
@container lpr (width >= 820px) {
  .lpr-split { grid-template-columns: minmax(0, 1fr) minmax(320px, 420px); column-gap: 64px }
  .lpr-aside { justify-self: end }
}

/* the switch: two native radios over a sliding thumb */
.lpr-switch {
  --lpr-thumb: var(--lpr-surface);
  position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 4px; border-radius: calc(var(--lpr-r-btn) + 2px); background: var(--lpr-fill);
}
.lpr-thumb {
  position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px);
  border-radius: calc(var(--lpr-r-btn) - 2px); background: var(--lpr-thumb); box-shadow: var(--lpr-thumb-shadow);
  transition: transform 320ms var(--lpr-ease);
}
.lpr-switch[data-period="yearly"] .lpr-thumb { transform: translateX(100%) }
.lpr-opt {
  position: relative; display: grid; place-items: center; min-width: 96px; height: 32px; padding: 0 16px;
  border-radius: calc(var(--lpr-r-btn) - 2px); cursor: pointer; user-select: none;
  font-size: 13.5px; line-height: 1; font-weight: 500; color: var(--lpr-t2); white-space: nowrap;
  transition: color 160ms var(--lpr-ease);
}
.lpr-opt:has(input:checked) { color: var(--lpr-t1) }
.lpr-opt input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer }
.lpr-opt:has(input:focus-visible) { outline: 2px solid var(--lpr-accent); outline-offset: 2px }
@media (hover: hover) { .lpr-opt:hover { color: var(--lpr-t1) } }

/* the card */
.lpr-card {
  position: relative; display: flex; flex-direction: column; flex: 1; min-width: 0;
  padding: 28px 24px 24px; border-radius: var(--lpr-radius); background: var(--lpr-surface);
  box-shadow: 0 0 0 1px var(--lpr-line), var(--lpr-drop);
}
@container lpr (width >= 560px) { .lpr-split .lpr-card { padding: 32px 32px 28px } }
.lpr-card[data-featured] { box-shadow: 0 0 0 1px var(--lpr-accent), var(--lpr-drop) }
.lpr-name { font-size: 14px; line-height: 20px; font-weight: 500; color: var(--lpr-t2) }
.lpr-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0 8px; margin-top: 12px }
.lpr-amount { display: inline-flex; align-items: baseline; color: var(--lpr-ink) }
.lpr-cur { align-self: flex-start; margin: 4px 2px 0 0; font-size: 20px; line-height: 1; font-weight: 500 }
.lpr-num {
  font-size: 48px; line-height: 1; font-weight: 500; letter-spacing: -.04em;
  font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
}
.lpr-unit { font-size: 14px; line-height: 20px; color: var(--lpr-t3) }
.lpr-desc { margin-top: 12px; color: var(--lpr-t2); text-wrap: pretty }
.lpr-feats { display: grid; gap: 10px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--lpr-line); color: var(--lpr-t1) }
.lpr-feats li { display: grid; grid-template-columns: 16px minmax(0, 1fr); column-gap: 12px }
.lpr-feats svg { width: 15px; height: 15px; margin-top: 3.5px; color: var(--lpr-t3) }
.lpr-details { display: grid; margin-top: 20px }
.lpr-details > div {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 10px 0;
  border-top: 1px solid var(--lpr-line);
}
.lpr-details > div:last-child { border-bottom: 1px solid var(--lpr-line) }
.lpr-details dt { flex: none; color: var(--lpr-t2); white-space: nowrap }
.lpr-details dd { min-width: 0; font-weight: 500; color: var(--lpr-t1); text-align: right; text-wrap: balance }
.lpr-foot { margin-top: auto; padding-top: 24px }
.lpr-btn {
  display: flex; align-items: center; justify-content: center; width: 100%; height: 44px; padding: 0 16px;
  border-radius: var(--lpr-r-btn); font-size: 14.5px; line-height: 1; font-weight: 500; white-space: nowrap;
  transition: background-color 160ms var(--lpr-ease), box-shadow 160ms var(--lpr-ease), transform 160ms var(--lpr-ease);
}
.lpr-btn:active { transform: scale(.98) }
.lpr-btn[data-variant="filled"] { background: var(--lpr-btn); color: var(--lpr-on-accent) }
.lpr-btn[data-variant="plain"] { background: var(--lpr-surface); box-shadow: inset 0 0 0 1px var(--lpr-line), 0 1px 2px rgb(0 0 0 / .04); color: var(--lpr-t1) }
@media (hover: hover) {
  .lpr-btn[data-variant="filled"]:hover { background: color-mix(in oklab, var(--lpr-btn) 88%, #000) }
  .lpr-btn[data-variant="plain"]:hover { background-color: color-mix(in oklab, var(--lpr-surface) 95%, var(--lpr-ink)) }
}

/* the price roll: the old number leaves and the new one arrives in the same grid cell, once */
.lpr-roll { display: inline-grid; overflow: hidden; padding-block: .06em; margin-block: -.06em }
.lpr-roll > span { grid-area: 1 / 1 }
.lpr-roll-in { animation: lpr-roll-in 460ms var(--lpr-ease) backwards }
.lpr-roll-out { animation: lpr-roll-out 460ms var(--lpr-ease) forwards }
@keyframes lpr-roll-in { from { opacity: 0; transform: translateY(calc(var(--dir, 1) * 72%)); filter: blur(2px) } }
@keyframes lpr-roll-out { to { opacity: 0; transform: translateY(calc(var(--dir, 1) * -72%)); filter: blur(2px) } }

/* arrival */
.lpr[data-reveal="wait"] .lpr-r { opacity: 0 }
.lpr[data-reveal="in"] .lpr-r {
  animation: lpr-rise 680ms var(--lpr-ease) backwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@keyframes lpr-rise { from { opacity: 0; transform: translateY(14px); filter: blur(3px) } }

@media (prefers-reduced-motion: reduce) {
  .lpr[data-reveal] .lpr-r { opacity: 1; animation: none }
  .lpr-roll-in { animation: none }
  .lpr-roll-out { display: none }
  .lpr *, .lpr *::before, .lpr *::after { transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                  Arrival                                   */
/* -------------------------------------------------------------------------- */

const REDUCED = "(prefers-reduced-motion: reduce)"
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

/** Hides the parts before first paint, then lets them rise once when the section enters the viewport. */
function useArrival(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || !enabled || typeof IntersectionObserver === "undefined" || window.matchMedia(REDUCED).matches) return
    el.dataset.reveal = "wait"
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        el.dataset.reveal = "in"
        io.disconnect()
      },
      { rootMargin: "0px 0px -8% 0px" },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      delete el.dataset.reveal
    }
  }, [ref, enabled])
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

type Heading = "h1" | "h2" | "h3" | "h4" | "h5"

const step = (i: number) => ({ "--i": i }) as React.CSSProperties
const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

function priceFor(plan: LandingPricingPlan, period: LandingPricingPeriod) {
  return period === "yearly" && plan.priceYearly !== undefined ? plan.priceYearly : plan.price
}

/** Largest yearly saving across plans, as a whole percent ("20%"), or "" when no plan saves. */
function bestSaving(plans: LandingPricingPlan[]) {
  let best = 0
  for (const p of plans) {
    if (typeof p.price === "number" && typeof p.priceYearly === "number" && p.price > 0) best = Math.max(best, 1 - p.priceYearly / p.price)
  }
  return best > 0 ? `${Math.round(best * 100)}%` : ""
}

/** The number rolls once from its old value to the new one; the old copy is dropped when its exit ends. */
function Roll({ value, dir }: { value: string; dir: 1 | -1 }) {
  const [s, setS] = React.useState({ cur: value, prev: null as string | null, n: 0 })
  if (value !== s.cur) setS({ cur: value, prev: s.cur, n: s.n + 1 })
  const style = { "--dir": dir } as React.CSSProperties
  return (
    <span className="lpr-roll" style={style}>
      {s.prev !== null && (
        <span key={`o${s.n}`} className="lpr-roll-out" onAnimationEnd={() => setS((x) => ({ ...x, prev: null }))}>
          {s.prev}
        </span>
      )}
      <span key={`i${s.n}`} className={s.n > 0 ? "lpr-roll-in" : undefined}>
        {s.cur}
      </span>
    </span>
  )
}

function PlanCard({
  plan,
  period,
  dir,
  Sub,
  filled,
  className,
  style,
}: {
  plan: LandingPricingPlan
  period: LandingPricingPeriod
  dir: 1 | -1
  Sub: Heading
  filled: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const nameId = React.useId()
  const value = priceFor(plan, period)
  const numeric = typeof value === "number"
  const shown = numeric ? NUMBER.format(value) : value
  const currency = plan.currency ?? "$"
  const unit = plan.unit ?? "/ month"
  const yearly = period === "yearly" && plan.priceYearly !== undefined
  const spoken = numeric
    ? `${currency}${shown} ${unit.replace(/^\s*\/\s*/, "per ")}${yearly ? ", billed yearly" : ""}`
    : shown
  const features = (plan.features ?? []).slice(0, 6)
  const details = plan.details ?? []

  return (
    <article className={cn("lpr-card", className)} style={style} data-featured={plan.featured ? "" : undefined} aria-labelledby={nameId}>
      <Sub className="lpr-name" id={nameId}>
        {plan.name}
      </Sub>
      <p className="lpr-price">
        <span className="lpr-sr">{spoken}</span>
        <span className="lpr-amount" aria-hidden>
          {numeric && currency && <span className="lpr-cur">{currency}</span>}
          <span className="lpr-num">
            <Roll value={shown} dir={dir} />
          </span>
        </span>
        {numeric && unit && (
          <span className="lpr-unit" aria-hidden>
            {unit}
          </span>
        )}
      </p>
      {plan.description && <p className="lpr-desc">{plan.description}</p>}
      {features.length > 0 && (
        <ul className="lpr-feats" role="list">
          {features.map((f, i) => (
            <li key={i}>
              <Check strokeWidth={1.75} aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      {details.length > 0 && (
        <dl className="lpr-details">
          {details.map((d, i) => (
            <div key={`${d.label}-${i}`}>
              <dt>{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="lpr-foot">
        <a className="lpr-btn" data-variant={filled ? "filled" : "plain"} href={plan.action.href}>
          {plan.action.label}
        </a>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Section                                  */
/* -------------------------------------------------------------------------- */

export function LandingPricing({
  layout = DEFAULT_LANDING_PRICING.layout,
  title = DEFAULT_LANDING_PRICING.title,
  titleMuted = DEFAULT_LANDING_PRICING.titleMuted,
  description = DEFAULT_LANDING_PRICING.description,
  link = DEFAULT_LANDING_PRICING.link,
  plans = DEFAULT_LANDING_PRICING.plans,
  billing = DEFAULT_LANDING_PRICING.billing,
  defaultPeriod = DEFAULT_LANDING_PRICING.defaultPeriod,
  periodLabels = DEFAULT_LANDING_PRICING.periodLabels,
  savingsNote = DEFAULT_LANDING_PRICING.savingsNote,
  headingLevel = 2,
  id,
  width = 1200,
  reveal = true,
  className,
}: LandingPricingProps) {
  const ref = React.useRef<HTMLElement>(null)
  const headingId = React.useId()
  const groupName = React.useId()
  const [period, setPeriod] = React.useState<LandingPricingPeriod>(defaultPeriod)
  useArrival(ref, reveal)

  const level = Math.min(4, Math.max(1, headingLevel))
  const H = `h${level}` as Heading
  const Sub = `h${level + 1}` as Heading
  const teaser = layout === "teaser"
  const shownPlans = teaser ? [plans.find((p) => p.featured) ?? plans[0]].filter(Boolean) : plans.slice(0, 4)
  const hasSwitch = !teaser && billing && shownPlans.some((p) => p.priceYearly !== undefined)
  const activePeriod = hasSwitch ? period : "monthly"
  const dir: 1 | -1 = activePeriod === "yearly" ? 1 : -1
  const saving = bestSaving(shownPlans)
  const note = savingsNote && (saving || !savingsNote.includes("{percent}")) ? savingsNote.replaceAll("{percent}", saving) : ""

  const lead = 1 + (titleMuted ? 1 : 0) + (description ? 1 : 0)
  const heading = (
    <H className="lpr-h" id={headingId}>
      <span className="lpr-r" style={step(0)}>
        {title}
      </span>{" "}
      {titleMuted && (
        <span className="lpr-r" style={step(1)}>
          {titleMuted}
        </span>
      )}
    </H>
  )
  const text = description && (
    <p className="lpr-text lpr-r" style={step(lead - 1)}>
      {description}
    </p>
  )
  const more = (i: number) =>
    link && (
      <a className="lpr-link lpr-r" href={link.href} style={step(i)}>
        {link.label}
        <ChevronRight strokeWidth={1.75} aria-hidden />
      </a>
    )

  return (
    <section
      ref={ref}
      id={id}
      className={cn("lpr", className)}
      data-layout={teaser ? "teaser" : "plans"}
      aria-labelledby={headingId}
      style={{ "--lpr-width": `${width}px` } as React.CSSProperties}
    >
      <style href="landing-pricing" precedence="default">
        {CSS}
      </style>
      {teaser ? (
        <div className="lpr-in lpr-split">
          <header className="lpr-head">
            {heading}
            {text}
            {link && <div>{more(lead)}</div>}
          </header>
          {shownPlans[0] && (
            <div className="lpr-aside">
              <PlanCard plan={shownPlans[0]} period="monthly" dir={1} Sub={Sub} filled className="lpr-r" style={step(lead + 1)} />
            </div>
          )}
        </div>
      ) : (
        <div className="lpr-in">
          <header className="lpr-head">
            {heading}
            {text}
          </header>
          {hasSwitch && (
            <div className="lpr-billing lpr-r" style={step(lead)}>
              <fieldset className="lpr-switch" data-period={activePeriod}>
                <legend className="lpr-sr">Billing period</legend>
                <span className="lpr-thumb" aria-hidden />
                {(["monthly", "yearly"] as const).map((p) => (
                  <label key={p} className="lpr-opt">
                    <input
                      type="radio"
                      name={groupName}
                      value={p}
                      checked={activePeriod === p}
                      onChange={() => setPeriod(p)}
                    />
                    <span>{periodLabels[p]}</span>
                  </label>
                ))}
              </fieldset>
              {note && <p className="lpr-save">{note}</p>}
            </div>
          )}
          {shownPlans.length > 0 && (
            <ul className="lpr-plans" role="list" data-count={shownPlans.length}>
              {shownPlans.map((p, i) => (
                <li key={`${p.name}-${i}`}>
                  <PlanCard
                    plan={p}
                    period={activePeriod}
                    dir={dir}
                    Sub={Sub}
                    filled={!!p.featured}
                    className="lpr-r"
                    style={step(lead + (hasSwitch ? 1 : 0) + i)}
                  />
                </li>
              ))}
            </ul>
          )}
          {link && <p className="lpr-more">{more(lead + (hasSwitch ? 1 : 0) + shownPlans.length)}</p>}
        </div>
      )}
    </section>
  )
}

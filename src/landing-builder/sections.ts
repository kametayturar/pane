// Landing Builder: the section registry.
//
// One entry per landing section. Components and their default content load lazily (each section is its own chunk),
// and the editable fields are derived from the default content's shape (see schema.ts) plus a few overrides here.
// Adding a section costs one entry: slug, name, a one-line description, the loader, and any overrides.
import type * as React from "react"

import { deriveFields, type Content, type Field, type FieldOverride, type Option, type Overrides } from "./schema"

export const SITE = "https://paneui.vercel.app"

type Loaded = {
  Component: React.ComponentType<Content>
  defaults: Content
  /** Overrides that need the loaded module (e.g. the icon names a section knows). */
  overrides?: Overrides
}

export type SectionDef = {
  slug: string
  name: string
  /** One line for the Add section list. */
  description: string
  /** The component's export name, used in the exported page file. */
  exportName: string
  load: () => Promise<Loaded>
  /** Props worth editing that are not in the section's DEFAULT_ constant, with the component's own default values. */
  extra?: Content
  overrides?: Overrides
  /** Keys that take the product name from the Brand panel (hidden in the editor). */
  brandKeys?: string[]
  /** CSS custom properties that hold the text colour on accent-filled buttons, e.g. "--lhr-on-accent". */
  onAccent?: string[]
  /** Clean content into props before rendering or exporting (drop empty optional values). */
  toProps?: (c: Content) => Content
  /** The key copy, one line, for the agent prompt. */
  summary: (c: Content) => string
}

export type LoadedSection = SectionDef & {
  Component: React.ComponentType<Content>
  defaults: Content
  fields: Field[]
  /** Every override, including the ones the module supplied (used to validate imported content). */
  allOverrides: Overrides
}

/* --------------------------------- helpers -------------------------------- */

const ch = (...pairs: [string | number | null, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }))
const lines = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(" / ") : typeof v === "string" ? v.replace(/\n/g, " / ") : "")
const q = (v: unknown) => (typeof v === "string" && v.trim() ? `"${v.trim().replace(/\n/g, " / ")}"` : "")
const lbl = (v: unknown) => (v && typeof v === "object" && "label" in v ? String((v as { label: string }).label) : "")
const list = (v: unknown, pick: (x: Content) => unknown = (x) => x) =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : String(pick(x as Content) ?? ""))).filter(Boolean) : []
const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join("; ")
const dropEmpty =
  (...keys: string[]) =>
  (c: Content) => {
    const out = { ...c }
    for (const k of keys) {
      const v = out[k]
      if (v === "" || v === undefined || (Array.isArray(v) && v.length === 0)) delete out[k]
    }
    return out
  }

const HEADLINE: FieldOverride = { kind: "tuple", itemLabels: ["First line", "Second line, muted"] }
const ANCHOR = { label: "Anchor id", help: "Lets a nav link like #pricing jump here. Leave empty for none." }

/* -------------------------------- registry -------------------------------- */

export const SECTIONS: SectionDef[] = [
  {
    slug: "landing-nav",
    name: "Nav",
    description: "Slim top bar: brand, a few centred links, a sign-in link and one button.",
    exportName: "LandingNav",
    load: () => import("@/components/blocks/landing-nav").then((m) => ({ Component: m.LandingNav as never, defaults: m.DEFAULT_LANDING_NAV })),
    extra: { sticky: true },
    brandKeys: ["brand"],
    overrides: {
      current: { kind: "hidden" },
      links: { max: 5, item: "link", help: "Three to five links read best." },
      textLink: { nullable: true },
      action: { nullable: true },
    },
    summary: (c) => join(`links ${list(c.links, (x) => x.label).join(", ")}`, !!lbl(c.action) && `button "${lbl(c.action)}"`),
  },
  {
    slug: "landing-hero",
    name: "Hero",
    description: "Two-tone headline, one sentence, two buttons, proof points and a playing product mock.",
    exportName: "LandingHero",
    load: () => import("@/components/blocks/landing-hero").then((m) => ({ Component: m.LandingHero as never, defaults: m.DEFAULT_LANDING_HERO })),
    extra: { layout: "split", panel: "accent", id: "" },
    onAccent: ["--lhr-on-accent"],
    toProps: dropEmpty("id"),
    overrides: {
      headline: HEADLINE,
      description: { kind: "textarea" },
      primaryAction: { nullable: true },
      secondaryAction: { nullable: true },
      proof: { max: 4, item: "point" },
      layout: { options: ch(["split", "Split"], ["centered", "Centred"]) },
      panel: { options: ch(["accent", "Accent"], ["soft", "Soft"]) },
      "mock.steps": { kind: "tuple", itemLabels: ["Frame 1", "Frame 2", "Frame 3"], label: "Frame names" },
      "mock.rows": { label: "Record fields", item: "field", max: 3 },
      id: ANCHOR,
    },
    summary: (c) => join(q(lines(c.headline)), q(c.description), !!lbl(c.primaryAction) && `buttons "${lbl(c.primaryAction)}"${lbl(c.secondaryAction) ? `, "${lbl(c.secondaryAction)}"` : ""}`),
  },
  {
    slug: "landing-steps",
    name: "Steps",
    description: "How it works: a heading with a side note and three cards, each playing a small mock.",
    exportName: "LandingSteps",
    load: () => import("@/components/blocks/landing-steps").then((m) => ({ Component: m.LandingSteps as never, defaults: m.DEFAULT_LANDING_STEPS })),
    extra: { id: "" },
    toProps: dropEmpty("id"),
    overrides: {
      note: { kind: "textarea" },
      link: { nullable: true },
      steps: { max: 4, item: "step", help: "Two to four steps." },
      "steps.*.body": { kind: "textarea" },
      id: ANCHOR,
    },
    summary: (c) => join(q([c.title, c.titleMuted].filter(Boolean).join(" / ")), `steps ${list(c.steps, (x) => x.title).join(", ")}`),
  },
  {
    slug: "landing-feature-rows",
    name: "Feature rows",
    description: "Alternating rows: headline, paragraph, ticked points and a link beside a soft panel.",
    exportName: "LandingFeatureRows",
    load: () =>
      import("@/components/blocks/landing-feature-rows").then((m) => ({ Component: m.LandingFeatureRows as never, defaults: m.DEFAULT_LANDING_FEATURE_ROWS })),
    onAccent: ["--lfr-on-accent"],
    overrides: {
      start: { options: ch(["media-right", "Media right"], ["media-left", "Media left"]) },
      rows: { item: "row" },
      "rows.*.title": { kind: "textarea", label: "Headline", help: "A line break starts the second line." },
      "rows.*.body": { kind: "textarea" },
      "rows.*.points": { max: 4, item: "point" },
      "rows.*.mock": { options: ch(["chat", "Chat"], ["report", "Report"], ["list", "List"]), label: "Mock" },
      "rows.*.mockText.rows": { label: "Report rows", item: "row", max: 4 },
      "rows.*.mockText.lines": { label: "Lines", item: "line" },
    },
    summary: (c) => `rows ${list(c.rows, (x) => q(x.title)).join(", ")}`,
  },
  {
    slug: "landing-feature-grid",
    name: "Feature grid",
    description: "A hairline grid of features, each an icon, a title and two lines, with one wide row.",
    exportName: "LandingFeatureGrid",
    load: () =>
      import("@/components/blocks/landing-feature-grid").then((m) => {
        const icons = { kind: "select" as const, label: "Icon", options: m.LANDING_FEATURE_ICONS.map((i) => ({ value: i, label: i })) }
        return {
          Component: m.LandingFeatureGrid as never,
          defaults: m.DEFAULT_LANDING_FEATURE_GRID,
          overrides: { "features.*.icon": icons, "wide.icon": icons },
        }
      }),
    extra: { id: "" },
    toProps: dropEmpty("id"),
    overrides: {
      columns: { options: ch([2, "2"], [3, "3"], [4, "4"]) },
      features: { item: "feature" },
      "features.*.text": { kind: "textarea" },
      "features.*.href": { label: "Link (optional)" },
      wide: { nullable: true },
      "wide.text": { kind: "textarea" },
      "wide.href": { label: "Link (optional)" },
      id: ANCHOR,
    },
    summary: (c) => join(q([c.title, c.titleMuted].filter(Boolean).join(" / ")), `features ${list(c.features, (x) => x.title).join(" ")}`),
  },
  {
    slug: "landing-audience",
    name: "Audience",
    description: "Two or three side-by-side cards, one per kind of customer, with ticked points.",
    exportName: "LandingAudience",
    load: () => import("@/components/blocks/landing-audience").then((m) => ({ Component: m.LandingAudience as never, defaults: m.DEFAULT_LANDING_AUDIENCE })),
    extra: { id: "" },
    toProps: dropEmpty("id"),
    overrides: {
      audiences: { max: 3, item: "audience" },
      "audiences.*.points": { max: 4, item: "point" },
      "audiences.*.link": { nullable: true },
      highlight: { options: ch([null, "None"], [0, "First"], [1, "Second"], [2, "Third"]) },
      id: ANCHOR,
    },
    summary: (c) => join(q([c.title, c.titleMuted].filter(Boolean).join(" ")), `for ${list(c.audiences, (x) => x.label).join(", ")}`),
  },
  {
    slug: "landing-proof",
    name: "Proof",
    description: "Social proof without logos: two to four figures with a source line, and one or two quotes.",
    exportName: "LandingProof",
    load: () => import("@/components/blocks/landing-proof").then((m) => ({ Component: m.LandingProof as never, defaults: m.DEFAULT_LANDING_PROOF })),
    extra: { show: "both", align: "left", id: "" },
    toProps: dropEmpty("id"),
    overrides: {
      figures: { max: 4, item: "figure", help: "Real numbers only, with a source line that says where they come from." },
      "figures.*.decimals": { label: "Decimal places" },
      quotes: { max: 2, item: "quote" },
      "quotes.*.text": { kind: "textarea", label: "Quote", help: "Without quotation marks; they are added." },
      show: { options: ch(["both", "Both"], ["figures", "Figures"], ["quotes", "Quotes"]) },
      align: { options: ch(["left", "Left"], ["center", "Centre"]) },
      source: { kind: "textarea", label: "Source line" },
      id: ANCHOR,
    },
    summary: (c) =>
      join(
        q([c.title, c.titleMuted].filter(Boolean).join(" / ")),
        `figures ${list(c.figures, (x) => `${x.prefix ?? ""}${x.value}${x.suffix ?? ""} ${x.label}`).join("; ")}`,
        list(c.quotes).length > 0 && `${list(c.quotes).length} quotes`,
      ),
  },
  {
    slug: "landing-pricing",
    name: "Pricing",
    description: "Plans in a row with a monthly / yearly switch, or a teaser with one plan beside the copy.",
    exportName: "LandingPricing",
    load: () => import("@/components/blocks/landing-pricing").then((m) => ({ Component: m.LandingPricing as never, defaults: m.DEFAULT_LANDING_PRICING })),
    extra: { id: "" },
    onAccent: ["--lpr-on-accent"],
    toProps: dropEmpty("id"),
    overrides: {
      layout: { options: ch(["plans", "Plans"], ["teaser", "Teaser"]) },
      description: { kind: "textarea" },
      link: { nullable: true },
      plans: { max: 4, item: "plan", shape: { currency: "$", unit: "/ month" } },
      "plans.*.unit": { help: "Shown after a number price, e.g. / month or per project." },
      "plans.*.price": { kind: "numtext", help: "A number, or words such as Custom." },
      "plans.*.priceYearly": { kind: "numtext", label: "Price per month, billed yearly" },
      "plans.*.features": { max: 6, item: "feature" },
      "plans.*.details": { item: "row" },
      defaultPeriod: { options: ch(["monthly", "Monthly"], ["yearly", "Yearly"]) },
      savingsNote: { help: "{percent} becomes the largest yearly saving." },
      id: ANCHOR,
    },
    summary: (c) =>
      join(
        q([c.title, c.titleMuted].filter(Boolean).join(" ")),
        `plans ${list(c.plans, (x) => `${x.name} ${typeof x.price === "number" ? `$${x.price}` : x.price}`).join(", ")}`,
      ),
  },
  {
    slug: "landing-faq",
    name: "FAQ",
    description: "Heading and a short note on one side, an accordion of questions on the other.",
    exportName: "LandingFaq",
    load: () => import("@/components/blocks/landing-faq").then((m) => ({ Component: m.LandingFaq as never, defaults: m.DEFAULT_LANDING_FAQ })),
    extra: { id: "" },
    toProps: dropEmpty("id"),
    overrides: {
      link: { nullable: true },
      items: { item: "question", label: "Questions" },
      "items.*.answer": { kind: "textarea", help: "A blank line starts a new paragraph." },
      defaultOpen: { kind: "hidden" },
      id: ANCHOR,
    },
    summary: (c) => join(q(c.title), `${list(c.items).length} questions: ${list(c.items, (x) => x.question).slice(0, 4).join(" ")}`),
  },
  {
    slug: "landing-cta",
    name: "Call to action",
    description: "The closing band: headline, one paragraph, two buttons and a short checklist mock.",
    exportName: "LandingCta",
    load: () => import("@/components/blocks/landing-cta").then((m) => ({ Component: m.LandingCta as never, defaults: m.DEFAULT_LANDING_CTA })),
    extra: { tone: "accent", layout: "split", id: "" },
    toProps: dropEmpty("id"),
    overrides: {
      headline: HEADLINE,
      description: { kind: "textarea" },
      primaryAction: { nullable: true },
      secondaryAction: { nullable: true },
      links: { max: 4, item: "link" },
      tone: { options: ch(["accent", "Accent"], ["ink", "Ink"], ["soft", "Soft"]) },
      layout: { options: ch(["split", "Split"], ["centered", "Centred"]) },
      "mock.rows": { label: "Checklist rows", item: "row", max: 3 },
      id: ANCHOR,
    },
    summary: (c) => join(q(lines(c.headline)), q(c.description), !!lbl(c.primaryAction) && `button "${lbl(c.primaryAction)}"`),
  },
  {
    slug: "landing-footer",
    name: "Footer",
    description: "Brand and one line, social icons, link columns and a copyright line.",
    exportName: "LandingFooter",
    load: () => import("@/components/blocks/landing-footer").then((m) => ({ Component: m.LandingFooter as never, defaults: m.DEFAULT_LANDING_FOOTER })),
    brandKeys: ["brand"],
    overrides: {
      socials: {
        max: 5,
        item: "social link",
        template: { kind: "website", href: "" },
      },
      "socials.*.kind": {
        kind: "select",
        options: ch(["x", "X"], ["github", "GitHub"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"], ["mail", "Email"], ["discord", "Discord"], ["instagram", "Instagram"], ["rss", "RSS"], ["website", "Website"]),
      },
      columns: { max: 5, item: "column" },
      "columns.*.links": { item: "link" },
      legal: { item: "link" },
    },
    summary: (c) => join(q(c.description), `columns ${list(c.columns, (x) => x.title).join(", ")}`, q(c.copyright)),
  },
  {
    slug: "logo-marquee",
    name: "Logo strip",
    description: "A strip of customer logos. It scrolls continuously, so use it once at most.",
    exportName: "LogoMarquee",
    load: () => import("@/components/blocks/logo-marquee").then((m) => ({ Component: m.LogoMarquee as never, defaults: {} })),
    extra: { label: "Logos of companies using the product", speed: 40, direction: "left", items: [] },
    toProps: dropEmpty("items"),
    overrides: {
      label: { label: "Accessible name" },
      direction: { options: ch(["left", "Left"], ["right", "Right"]) },
      items: { label: "Company names", item: "company", template: { name: "", href: "" }, help: "Empty shows five invented wordmarks. Names you add show as plain wordmarks." },
    },
    summary: (c) => (Array.isArray(c.items) && c.items.length ? `logos ${list(c.items, (x) => x.name).join(", ")}` : "invented placeholder logos"),
  },
  {
    slug: "testimonial-wall",
    name: "Testimonials",
    description: "A wall of quotes in slowly moving columns. It moves continuously, so keep it short.",
    exportName: "TestimonialWall",
    load: () => import("@/components/blocks/testimonial-wall").then((m) => ({ Component: m.TestimonialWall as never, defaults: {} })),
    extra: { label: "What customers say", columns: 3, speed: 28, items: [] },
    toProps: dropEmpty("items"),
    overrides: {
      label: { label: "Accessible name" },
      columns: { options: ch([1, "1"], [2, "2"], [3, "3"]) },
      items: {
        label: "Quotes",
        item: "quote",
        template: { quote: "", name: "", role: "", company: "" },
        help: "Empty shows twelve invented quotes.",
      },
      "items.*.quote": { kind: "textarea" },
    },
    summary: (c) => (Array.isArray(c.items) && c.items.length ? `${c.items.length} quotes` : "placeholder quotes"),
  },
]

export const SECTION_BY_SLUG = new Map(SECTIONS.map((s) => [s.slug, s]))

let loading: Promise<Map<string, LoadedSection>> | null = null

/** Load every section module (in parallel, each its own chunk) and derive its fields. */
export function loadSections(): Promise<Map<string, LoadedSection>> {
  loading ??= Promise.all(
    SECTIONS.map(async (def) => {
      const m = await def.load()
      const defaults = { ...JSON.parse(JSON.stringify(m.defaults)), ...(def.extra ?? {}) } as Content
      const overrides: Overrides = { ...(def.overrides ?? {}), ...(m.overrides ?? {}) }
      for (const k of def.brandKeys ?? []) overrides[k] = { kind: "hidden" }
      const fields = deriveFields(defaults, overrides)
      return [def.slug, { ...def, Component: m.Component, defaults, fields, allOverrides: overrides }] as const
    }),
  ).then((entries) => new Map(entries))
  return loading
}

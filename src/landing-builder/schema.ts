// Landing Builder: turn a section's default content into an editable field schema.
//
// The rule is "derive from the shape of the default, override by path":
//   string            → text input, or a textarea when it is long or holds a line break
//   number            → number input
//   boolean           → switch
//   string[]          → list editor (add, remove, reorder)
//   object[]          → repeatable group (add, remove, reorder), its item schema derived from all items
//   { label, href }   → one paired field
//   other objects     → a nested group
// Overrides are keyed by path, with "*" for any array index ("rows.*.mock"). They rename fields, turn strings or
// numbers into choices, mark a field as nullable or hidden, and give fixed-length tuples their item labels.

export type Content = Record<string, unknown>
export type Path = (string | number)[]

export type Option = { value: string | number | null; label: string }

export type FieldOverride = {
  label?: string
  /** Force a field kind. "hidden" leaves the field out of the editor (its value is still kept and exported). */
  kind?: "text" | "textarea" | "choice" | "select" | "hidden" | "tuple" | "numtext"
  /** Options for "choice" (segmented) or "select" (dropdown). */
  options?: Option[]
  /** The field can be switched off, which stores `null` (for props typed `X | null`). */
  nullable?: boolean
  /** Labels for a fixed-length string tuple, e.g. a two-line headline. */
  itemLabels?: string[]
  /** Most items a list or repeat takes. */
  max?: number
  /** One short help line under the field. */
  help?: string
  /** Singular noun for the add button of a list or repeat ("step", "link"). */
  item?: string
  /** Template for a new item of an empty list or repeat. */
  template?: unknown
  /** Keys a repeat's items can take that no default item has (with a sample value), so they get fields too. */
  shape?: Content
}

export type Overrides = Record<string, FieldOverride>

type Base = { key: string | number; label: string; help?: string; nullable?: boolean }

export type Field =
  | (Base & { type: "text" | "textarea" | "numtext" })
  | (Base & { type: "number" })
  | (Base & { type: "switch" })
  | (Base & { type: "choice" | "select"; options: Option[] })
  | (Base & { type: "link"; template: { label: string; href: string } })
  | (Base & { type: "tuple"; itemLabels: string[] })
  | (Base & { type: "list"; max?: number; item: string; long: boolean })
  | (Base & { type: "repeat"; fields: Field[]; max?: number; item: string; template: unknown })
  | (Base & { type: "group"; fields: Field[]; template: Content })

/* --------------------------------- labels --------------------------------- */

const LABELS: Record<string, string> = {
  title: "Heading",
  titleMuted: "Second line, muted",
  headline: "Headline",
  note: "Side note",
  description: "Description",
  eyebrow: "Line above the headline",
  body: "Text",
  text: "Text",
  points: "Ticked points",
  proof: "Proof points",
  link: "Link",
  href: "Link",
  label: "Label",
  links: "Links",
  textLink: "Text link",
  action: "Button",
  primaryAction: "Main button",
  secondaryAction: "Second button",
  reassurance: "Reassurance line",
  brandHref: "Brand link",
  mock: "Words in the mock",
  mockText: "Words in the mock",
  story: "Words in the mocks",
  rows: "Rows",
  items: "Items",
  question: "Question",
  answer: "Answer",
  copyright: "Copyright line",
  legal: "Legal links",
  socials: "Social links",
  columns: "Columns",
  features: "Features",
  wide: "Wide row",
  id: "Anchor id",
  sticky: "Sticks to the top",
  layout: "Layout",
  panel: "Panel",
  tone: "Tone",
  start: "First media side",
  band: "Banded rows",
  mutedSecondLine: "Muted second line",
  audiences: "Audiences",
  highlight: "Highlighted card",
  promise: "Promise",
  steps: "Steps",
  plans: "Plans",
  price: "Price",
  priceYearly: "Price, billed yearly",
  details: "Detail rows",
  featured: "Featured",
  billing: "Monthly / yearly switch",
  defaultPeriod: "Selected first",
  periodLabels: "Switch labels",
  savingsNote: "Savings line",
  multiple: "Several open at once",
  value: "Value",
  name: "Name",
  role: "Role",
  company: "Company",
  quote: "Quote",
  kind: "Kind",
  speed: "Speed",
  direction: "Direction",
}

export function humanize(key: string | number): string {
  if (typeof key === "number") return `Item ${key + 1}`
  if (LABELS[key]) return LABELS[key]
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/* ---------------------------------- derive --------------------------------- */

const isObj = (v: unknown): v is Content => !!v && typeof v === "object" && !Array.isArray(v)
const isLink = (v: unknown): v is { label: string; href: string } =>
  isObj(v) && typeof v.label === "string" && typeof v.href === "string" && Object.keys(v).every((k) => k === "label" || k === "href")

/** All items of an object array merged into one shape: every key any item has (nested objects merged), with the first value seen. */
function unionShape(items: unknown[]): Content {
  const out: Content = {}
  for (const it of items) {
    if (!isObj(it)) continue
    for (const [k, v] of Object.entries(it)) {
      if (v === undefined) continue
      const cur = out[k]
      // Nested objects merge too, so a key only a later item's sub-object has (a report mock's rows) is kept.
      if (isObj(cur) && isObj(v)) out[k] = unionShape([cur, v])
      else if (cur === undefined || (Array.isArray(cur) && !cur.length && Array.isArray(v) && v.length)) out[k] = v
    }
  }
  return out
}

/** A fresh item from a sample: strings emptied, lists emptied, numbers and booleans kept, links kept as blanks. */
export function blankFrom(sample: unknown): unknown {
  if (typeof sample === "string") return ""
  if (Array.isArray(sample)) return []
  if (isObj(sample)) return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blankFrom(v)]))
  return sample
}

function pattern(path: string[]): string {
  return path.join(".")
}

export function deriveFields(value: Content, overrides: Overrides = {}, at: string[] = []): Field[] {
  const out: Field[] = []
  for (const [key, v] of Object.entries(value)) {
    const f = deriveField(key, v, overrides, [...at, key])
    if (f) out.push(f)
  }
  return out
}

function deriveField(key: string | number, v: unknown, overrides: Overrides, at: string[]): Field | null {
  const o = overrides[pattern(at)] ?? {}
  if (o.kind === "hidden") return null
  const base = { key, label: o.label ?? humanize(key), help: o.help, nullable: o.nullable }
  const sample = v === null || v === undefined ? o.template : v

  if (o.options && (o.kind === "select" || o.kind === "choice" || o.kind === undefined)) {
    return { ...base, type: o.kind === "select" ? "select" : "choice", options: o.options }
  }
  if (o.kind === "numtext") return { ...base, type: "numtext" }
  if (o.kind === "tuple" || o.itemLabels) {
    return { ...base, type: "tuple", itemLabels: o.itemLabels ?? (Array.isArray(v) ? v.map((_, i) => `Line ${i + 1}`) : []) }
  }
  if (typeof sample === "string") {
    const long = o.kind === "textarea" || (o.kind !== "text" && (sample.length > 64 || sample.includes("\n")))
    return { ...base, type: long ? "textarea" : "text" }
  }
  if (typeof sample === "number") return { ...base, type: "number" }
  if (typeof sample === "boolean") return { ...base, type: "switch" }
  if (isLink(sample)) return { ...base, type: "link", template: { label: sample.label, href: sample.href } }
  if (Array.isArray(sample)) {
    const items = sample.length ? sample : o.template !== undefined ? [o.template] : []
    if (!items.length) return null
    if (items.every((x) => typeof x === "string")) {
      const long = (items as string[]).some((s) => s.length > 64)
      return { ...base, type: "list", max: o.max, item: o.item ?? "item", long }
    }
    if (items.every(isObj)) {
      const shape = unionShape(o.shape ? [...items, o.shape] : items)
      const fields = deriveFields(shape, overrides, [...at, "*"])
      return { ...base, type: "repeat", fields, max: o.max, item: o.item ?? "item", template: o.template ?? blankFrom(shape) }
    }
    return null
  }
  if (isObj(sample)) {
    return { ...base, type: "group", fields: deriveFields(sample, overrides, at), template: sample }
  }
  return null
}

/* --------------------------------- paths ---------------------------------- */

export function getIn(obj: unknown, path: Path): unknown {
  let cur: unknown = obj
  for (const k of path) {
    if (cur === null || cur === undefined) return undefined
    cur = (cur as Record<string | number, unknown>)[k]
  }
  return cur
}

/** Immutable set. `undefined` deletes an object key. */
export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T
  const [k, ...rest] = path
  if (Array.isArray(obj)) {
    const copy = obj.slice()
    copy[k as number] = setIn(copy[k as number], rest, value)
    return copy as T
  }
  const src = (isObj(obj) ? obj : {}) as Content
  const next = rest.length ? setIn(src[k as string], rest, value) : value
  const copy: Content = { ...src }
  if (next === undefined) delete copy[k as string]
  else copy[k as string] = next
  return copy as T
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const bb = b as unknown[]
    return a.length === bb.length && a.every((x, i) => deepEqual(x, bb[i]))
  }
  const ka = Object.keys(a as Content).filter((k) => (a as Content)[k] !== undefined)
  const kb = Object.keys(b as Content).filter((k) => (b as Content)[k] !== undefined)
  return ka.length === kb.length && ka.every((k) => deepEqual((a as Content)[k], (b as Content)[k]))
}

export const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T))

/** The first short string of an item, used as its summary in collapsed rows. */
export function itemSummary(v: unknown): string {
  if (typeof v === "string") return v
  if (!isObj(v)) return ""
  for (const k of ["title", "name", "label", "question", "quote", "kind"]) {
    const s = v[k]
    if (typeof s === "string" && s.trim()) return s.replace(/\n/g, " ")
  }
  for (const s of Object.values(v)) if (typeof s === "string" && s.trim()) return s.replace(/\n/g, " ")
  return ""
}

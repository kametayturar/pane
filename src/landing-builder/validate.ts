// Landing Builder: make untrusted content safe. Everything that comes from an imported file or from localStorage is
// coerced to the shape of the section's own default content: unknown keys are dropped, wrong types fall back to the
// default, choices must be one of their options, strings and lists are capped, and links cannot use script schemes.
import type { Brand } from "./doc"
import type { Content, Overrides } from "./schema"

export const MAX_STRING = 2000
export const MAX_ITEMS = 24
export const MAX_SECTIONS = 40
export const MAX_NAME = 80

const isObj = (v: unknown): v is Content => !!v && typeof v === "object" && !Array.isArray(v)

// Control characters except tab and line feed, plus the Unicode line and paragraph separators.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f\u2028\u2029]/g

export function cleanString(v: string, max = MAX_STRING): string {
  return v.replace(/\r\n?/g, "\n").replace(CONTROL, "").slice(0, max)
}

/** One line of plain text: no line breaks or control characters, capped. */
export function cleanLine(v: unknown, max = MAX_NAME): string {
  return typeof v === "string" ? cleanString(v, max).replace(/[\n\t]+/g, " ") : ""
}

const SCRIPT_SCHEME = /^(javascript|data|vbscript|file):/i

/** Links: no script or data schemes (checked after removing whitespace and control characters, as browsers do). */
export function cleanHref(v: string): string {
  const s = cleanString(v, 500).trim()
  // eslint-disable-next-line no-control-regex
  return SCRIPT_SCHEME.test(s.replace(/[\s\u0000-\u001f]+/g, "")) ? "#" : s
}

export function cleanBrand(raw: unknown, fallback: Brand): Brand {
  const b = isObj(raw) ? raw : {}
  const name = cleanLine(b.name).trim()
  const accent = typeof b.accent === "string" && /^#[0-9a-f]{6}$/i.test(b.accent.trim()) ? b.accent.trim().toLowerCase() : fallback.accent
  const url = cleanLine(b.baseUrl, 200).trim()
  const baseUrl = /^https?:\/\/[^\s"'<>`\\]+$/i.test(url) ? url : ""
  return { name: name || fallback.name, accent, baseUrl }
}

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

/**
 * Coerce `value` to the shape of `sample` (the default at the same path). Returns `undefined` when there is
 * nothing usable, so the caller keeps the default.
 */
function coerce(sample: unknown, value: unknown, overrides: Overrides, at: string[], key?: string): unknown {
  const o = overrides[at.join(".")] ?? {}
  if (o.options) {
    return o.options.some((opt) => opt.value === value) ? value : undefined
  }
  if (value === null) return sample === null || o.nullable ? null : undefined
  const base = sample === null || sample === undefined ? o.template : sample

  if (o.kind === "numtext") {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") return cleanLine(value, 40)
    return undefined
  }
  if (typeof base === "string") {
    if (typeof value !== "string") return undefined
    return key === "href" ? cleanHref(value) : cleanString(value)
  }
  if (typeof base === "number") return typeof value === "number" && Number.isFinite(value) ? Math.max(-1e12, Math.min(1e12, value)) : undefined
  if (typeof base === "boolean") return typeof value === "boolean" ? value : undefined
  if (Array.isArray(base)) {
    if (!Array.isArray(value)) return undefined
    const tupleLen = o.kind === "tuple" || o.itemLabels ? Math.max(base.length, o.itemLabels?.length ?? 0) : 0
    const items = value.slice(0, tupleLen || Math.min(o.max ?? MAX_ITEMS, MAX_ITEMS))
    const samples = base.length ? base : o.template !== undefined ? [o.template] : []
    if (!samples.length) return undefined
    if (samples.every((x) => typeof x === "string")) {
      return items.filter((x): x is string => typeof x === "string").map((x) => cleanString(x))
    }
    if (samples.every(isObj)) {
      const shape = unionShape(o.shape ? [...samples, o.shape] : samples)
      return items.filter(isObj).map((it) => coerceObject(shape, it, overrides, [...at, "*"]))
    }
    return undefined
  }
  if (isObj(base)) {
    if (!isObj(value)) return undefined
    return coerceObject(base, value, overrides, at)
  }
  return undefined
}

function coerceObject(shape: Content, value: Content, overrides: Overrides, at: string[]): Content {
  const out: Content = {}
  for (const [k, sample] of Object.entries(shape)) {
    if (!(k in value)) continue
    const v = coerce(sample, value[k], overrides, [...at, k], k)
    if (v !== undefined) out[k] = v
  }
  return out
}

/** Content from an untrusted source, reduced to the keys and types of the section's defaults. */
export function sanitizeContent(defaults: Content, raw: unknown, overrides: Overrides): Content {
  return isObj(raw) ? coerceObject(defaults, raw, overrides, []) : {}
}

/** Text for a code comment: one line, no comment delimiters, capped. */
export function commentSafe(v: string, max = 60): string {
  let s = cleanLine(v, 200)
  while (/\*\/|\/\*/.test(s)) s = s.replace(/\*\/|\/\*/g, "")
  return s.slice(0, max).trim()
}

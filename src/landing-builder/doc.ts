// Landing Builder: the page document, how it is made from presets, checked on import, saved, and undone.
import { clone, deepEqual, type Content } from "./schema"
import type { LoadedSection } from "./sections"
import { cleanBrand, cleanLine, MAX_SECTIONS, sanitizeContent } from "./validate"

export type Brand = { name: string; accent: string; baseUrl: string }
export type SectionInstance = { id: string; slug: string; hidden: boolean; content: Content }
export type LandingDoc = { version: 1; brand: Brand; sections: SectionInstance[] }

/** A preset as written in presets.ts: section content is only what differs from the section's defaults (shallow). */
export type PresetSection = { slug: string; hidden?: boolean; content?: Content }
export type PresetDoc = { brand: Brand; sections: PresetSection[] }
export type Preset = { id: string; name: string; description: string; doc: PresetDoc }

/** A preset the owner saved (localStorage) or imported. */
export type SavedPreset = { id: string; name: string; savedAt: number; doc: LandingDoc }

export type Registry = Map<string, LoadedSection>

export const DOC_KEY = "pane-landing-builder:doc"
export const PRESETS_KEY = "pane-landing-builder:presets"
export const VIEW_KEY = "pane-landing-builder:view"
export const FILE_KIND = "pane-landing-builder-preset"

export const uid = () => `s${Math.random().toString(36).slice(2, 9)}`

export function instance(reg: Registry, slug: string, content?: Content, hidden = false): SectionInstance | null {
  const def = reg.get(slug)
  if (!def) return null
  // Content is always reduced to the section's own shape, so a preset or file can only set what the editor can.
  return { id: uid(), slug: def.slug, hidden, content: { ...clone(def.defaults), ...sanitizeContent(def.defaults, clone(content ?? {}), def.allOverrides) } }
}

/** A full document from a preset (unknown sections are left out and counted). */
export function materialize(reg: Registry, p: PresetDoc): { doc: LandingDoc; skipped: string[] } {
  const skipped: string[] = []
  const sections: SectionInstance[] = []
  for (const s of p.sections) {
    const inst = instance(reg, s.slug, s.content, !!s.hidden)
    if (inst) sections.push(inst)
    else skipped.push(s.slug)
  }
  const doc: LandingDoc = { version: 1, brand: { ...p.brand }, sections }
  return { doc: applyBrandKeys(reg, doc), skipped }
}

/** Write the product name into every section key that takes it (nav and footer brand). */
export function applyBrandKeys(reg: Registry, doc: LandingDoc): LandingDoc {
  return {
    ...doc,
    sections: doc.sections.map((s) => {
      const keys = reg.get(s.slug)?.brandKeys
      if (!keys?.length) return s
      const content = { ...s.content }
      for (const k of keys) content[k] = doc.brand.name
      return { ...s, content }
    }),
  }
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

function replaceStrings(v: unknown, re: RegExp, next: string): unknown {
  if (typeof v === "string") return v.replace(re, next)
  if (Array.isArray(v)) return v.map((x) => replaceStrings(x, re, next))
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "href" ? x : replaceStrings(x, re, next)]))
  return v
}

/** Rename the product: the brand keys take the new name, and whole-word mentions of the old name in copy follow. */
export function renameBrand(reg: Registry, doc: LandingDoc, prev: string, next: string): LandingDoc {
  const p = prev.trim()
  const n = next.trim()
  let sections = doc.sections
  if (p.length >= 2 && n && p !== n) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(p)}(?![\\p{L}\\p{N}])`, "gu")
    sections = sections.map((s) => ({ ...s, content: replaceStrings(s.content, re, n) as Content }))
  }
  return applyBrandKeys(reg, { ...doc, brand: { ...doc.brand, name: next }, sections })
}

/** Join links that start with "/" to the base URL. In-page (#) and absolute links stay as they are. */
function withBase(v: unknown, base: string, key?: string): unknown {
  if (typeof v === "string") return key === "href" && v.startsWith("/") && !v.startsWith("//") ? base + v : v
  if (Array.isArray(v)) return v.map((x) => withBase(x, base))
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, withBase(x, base, k)]))
  return v
}

/** What a section is rendered (and exported) with: content, cleaned, with the base URL applied. */
export function resolveProps(def: LoadedSection, content: Content, brand: Brand): Content {
  const base = brand.baseUrl.trim().replace(/\/+$/, "")
  const c = base ? (withBase(content, base) as Content) : content
  return def.toProps ? def.toProps(c) : c
}

/** Only the props that differ from the section's defaults (for the exported page file). */
export function changedProps(def: LoadedSection, content: Content, brand: Brand): Content {
  const props = resolveProps(def, content, brand)
  const defaults = def.toProps ? def.toProps(def.defaults) : def.defaults
  const out: Content = {}
  for (const [k, v] of Object.entries(props)) if (v !== undefined && !deepEqual(v, defaults[k])) out[k] = v
  return out
}

/* --------------------------------- import --------------------------------- */

const isObj = (v: unknown): v is Content => !!v && typeof v === "object" && !Array.isArray(v)

const FALLBACK_BRAND: Brand = { name: "Product", accent: "#0060e2", baseUrl: "" }

/**
 * Check a parsed JSON value (an imported file or what localStorage held) and turn it into a document. Accepts a
 * document or a preset file. Unknown sections are dropped and named; every value is coerced to its section's shape.
 */
export function parseDocument(reg: Registry, raw: unknown): { doc: LandingDoc; name?: string; skipped: string[] } {
  let name: string | undefined
  let v = raw
  if (isObj(v) && isObj(v.doc)) {
    name = cleanLine(v.name).trim() || undefined
    v = v.doc
  }
  if (!isObj(v) || !Array.isArray(v.sections)) throw new Error("This file is not a Landing Builder page. It needs a list of sections.")
  if (v.version !== undefined && v.version !== 1) throw new Error("This page was saved by a newer version of the builder.")
  const brand = cleanBrand(v.brand, FALLBACK_BRAND)
  const skipped: string[] = []
  const sections: SectionInstance[] = []
  for (const s of v.sections.slice(0, MAX_SECTIONS)) {
    if (!isObj(s) || typeof s.slug !== "string") continue
    const inst = reg.has(s.slug) ? instance(reg, s.slug, isObj(s.content) ? s.content : undefined, s.hidden === true) : null
    if (inst) sections.push(inst)
    else skipped.push(cleanLine(s.slug, 40))
  }
  return { doc: applyBrandKeys(reg, { version: 1, brand, sections }), name, skipped }
}

export function presetFile(name: string, doc: LandingDoc): string {
  return JSON.stringify({ kind: FILE_KIND, version: 1, name, doc }, null, 2)
}

/* --------------------------------- storage -------------------------------- */

export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/* --------------------------------- history -------------------------------- */

export type History = { past: LandingDoc[]; present: LandingDoc; future: LandingDoc[]; key: string | null; at: number }
export type HistoryAction =
  | { type: "commit"; doc: LandingDoc; key?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "endStep" }

const LIMIT = 100
const COALESCE_MS = 1200

/** Edits to the same field within a moment fold into one undo step, so undo works per word, not per letter. */
export function historyReducer(h: History, a: HistoryAction): History {
  switch (a.type) {
    case "commit": {
      if (a.doc === h.present) return h
      const now = Date.now()
      if (a.key && a.key === h.key && now - h.at < COALESCE_MS) return { ...h, present: a.doc, future: [], at: now }
      return { past: [...h.past, h.present].slice(-LIMIT), present: a.doc, future: [], key: a.key ?? null, at: now }
    }
    case "undo": {
      const prev = h.past[h.past.length - 1]
      if (!prev) return h
      return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future], key: null, at: 0 }
    }
    case "redo": {
      const next = h.future[0]
      if (!next) return h
      return { past: [...h.past, h.present], present: next, future: h.future.slice(1), key: null, at: 0 }
    }
    case "endStep":
      return h.key ? { ...h, key: null } : h
  }
}

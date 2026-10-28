// Library-wide search: every piece, screen and skill, ranked across names, tags, synonyms and descriptions.
// Tags and synonyms live in src/data/tags.json (generated once, edited by hand).
import TAGS from "@/data/tags.json"

export type SearchDoc = {
  id: string
  href: string
  title: string
  kind: string
  group: string
  description: string
  tags: string[]
  keywords: string[]
  extra?: string
}

export type SearchHit = SearchDoc & { score: number; why: string }

type TagFile = { synonyms: Record<string, string[]>; entries: Record<string, { tags: string[]; keywords: string[] }>; vocab: { tag: string; facet: string; meaning: string }[] }
const TAG_FILE = TAGS as TagFile

export const TAG_VOCAB = TAG_FILE.vocab
export const tagsFor = (slug: string) => TAG_FILE.entries[slug]?.tags ?? []
export const keywordsFor = (slug: string) => TAG_FILE.entries[slug]?.keywords ?? []

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

const words = (s: string) => norm(s).split(" ").filter(Boolean)

/** Levenshtein distance, capped – only used for short typo checks. */
function close(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return false
    prev = cur
  }
  return prev[b.length] <= max
}

/** How well one query token matches one field's words (0–1). */
function tokenScore(token: string, fieldWords: string[], fuzzy: boolean) {
  let best = 0
  for (const w of fieldWords) {
    if (w === token) return 1
    if (w.startsWith(token)) best = Math.max(best, token.length >= 2 ? 0.8 : 0.4)
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, 0.5)
    else if (fuzzy && token.length >= 4 && close(token, w, token.length >= 7 ? 2 : 1)) best = Math.max(best, 0.4)
  }
  return best
}

const FIELDS = [
  { key: "title", weight: 10, fuzzy: true },
  { key: "tags", weight: 6, fuzzy: true },
  { key: "keywords", weight: 4, fuzzy: true },
  { key: "extra", weight: 4, fuzzy: false },
  { key: "group", weight: 3, fuzzy: false },
  { key: "description", weight: 2, fuzzy: false },
] as const

type Indexed = { doc: SearchDoc; fields: Record<(typeof FIELDS)[number]["key"], string[]>; title: string }

export function buildIndex(docs: SearchDoc[]): Indexed[] {
  return docs.map((doc) => ({
    doc,
    title: norm(doc.title),
    fields: {
      title: [...words(doc.title), ...words(doc.id)],
      tags: doc.tags.flatMap((t) => [t, ...words(t)]),
      keywords: doc.keywords.flatMap(words),
      extra: words(doc.extra ?? ""),
      group: words(doc.group),
      description: words(doc.description),
    },
  }))
}

/** Rank docs for a query. Every query word must match something (directly or through a synonym). */
export function search(index: Indexed[], query: string, limit = 40): SearchHit[] {
  const q = norm(query)
  if (!q) return []
  const tokens = q.split(" ")
  const hits: SearchHit[] = []
  for (const item of index) {
    let total = 0
    let why = ""
    let ok = true
    for (const token of tokens) {
      // A token can match itself or any synonym it stands for ("modal" → "dialog").
      const variants = [token, ...(TAG_FILE.synonyms[token] ?? [])]
      let best = 0
      let bestField = ""
      for (const v of variants) {
        const vWords = words(v)
        for (const f of FIELDS) {
          const s = vWords.reduce((acc, w) => acc + tokenScore(w, item.fields[f.key], f.fuzzy), 0) / vWords.length
          const weighted = s * f.weight * (v === token ? 1 : 0.85)
          if (weighted > best) {
            best = weighted
            bestField = f.key === "tags" ? `tag: ${v}` : v !== token ? `means ${v}` : ""
          }
        }
      }
      if (best === 0) {
        ok = false
        break
      }
      total += best
      if (!why && bestField) why = bestField
    }
    if (!ok) continue
    if (item.title === q) total += 30
    else if (item.title.startsWith(q)) total += 12
    hits.push({ ...item.doc, score: total, why })
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit)
}

/** Pieces that share the most tags with this one (Jaccard), for "Related" links. */
export function related(docs: SearchDoc[], id: string, limit = 4) {
  const me = docs.find((d) => d.id === id)
  if (!me || !me.tags.length) return []
  const mine = new Set(me.tags)
  return docs
    .filter((d) => d.id !== id && d.tags.length)
    .map((d) => {
      const shared = d.tags.filter((t) => mine.has(t)).length
      return { doc: d, score: shared / (mine.size + d.tags.length - shared) + (d.group === me.group ? 0.04 : 0) }
    })
    .filter((r) => r.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.doc)
}

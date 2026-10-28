import * as React from "react"
import { ArrowUpRight, CornerDownLeft, Hash, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { buildIndex, search, TAG_VOCAB, type SearchDoc } from "@/search"

const KIND_LABEL: Record<string, string> = {
  ui: "Component",
  blocks: "Block",
  illustrations: "Illustration",
  motion: "Motion",
  screen: "Screen",
  skill: "Skill",
  tag: "Tag",
}

/** ⌘K palette over the whole library: pieces, screens, skills and tags. */
export function CommandPalette({ open, onClose, docs, counts }: { open: boolean; onClose: () => void; docs: SearchDoc[]; counts: Record<string, number> }) {
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const tagDocs = React.useMemo<SearchDoc[]>(
    () =>
      TAG_VOCAB.filter((t) => counts[t.tag]).map((t) => ({
        id: `tag:${t.tag}`,
        href: `#/tag/${t.tag}`,
        title: t.tag.replace(/-/g, " "),
        kind: "tag",
        group: t.facet,
        description: `${counts[t.tag]} pieces · ${t.meaning}`,
        tags: [t.tag],
        keywords: [],
      })),
    [counts],
  )
  const index = React.useMemo(() => buildIndex([...docs, ...tagDocs]), [docs, tagDocs])
  const hits = React.useMemo(() => {
    if (!query.trim()) return [...docs.filter((d) => d.kind === "screen").slice(0, 4), ...tagDocs.filter((t) => ["glass", "agent", "chart", "chat", "landing", "dither"].includes(t.tags[0]))]
    const found = search(index, query, 30)
    // Tags first only when they are an exact hit; otherwise pieces lead.
    return found.sort((a, b) => (a.kind === "tag" ? (a.score > 40 ? -1 : 1) : 0) - (b.kind === "tag" ? (b.score > 40 ? -1 : 1) : 0) || b.score - a.score)
  }, [docs, index, query, tagDocs])

  const [prevQuery, setPrevQuery] = React.useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setActive(0)
  }

  React.useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const close = () => {
    setQuery("")
    onClose()
  }
  const go = (hit?: SearchDoc) => {
    if (!hit) return
    window.location.hash = hit.href.replace(/^#/, "")
    close()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-[2px] dark:bg-black/50" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label="Search the library" className="flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_24px_60px_-20px_rgb(0_0_0/0.45)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_24px_60px_-20px_rgb(0_0_0/0.8)]">
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 dark:border-white/[0.08]">
          <Search className="size-4 shrink-0 text-neutral-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close()
              else if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, hits.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === "Enter") go(hits[active])
            }}
            placeholder="Search components, screens, skills… try “modal”, “glass”, “pricing”"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={hits[active] ? `palette-${active}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
          />
          <kbd className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-sans text-[11px] text-neutral-400 dark:bg-white/10">esc</kbd>
        </div>
        <ul ref={listRef} id="palette-results" role="listbox" className="overflow-y-auto p-2">
          {!query.trim() && <li className="px-3 pt-1 pb-2 text-[11.5px] font-medium tracking-wide text-neutral-400 uppercase">Jump to</li>}
          {hits.map((h, i) => (
            <li key={h.id} id={`palette-${i}`} role="option" aria-selected={i === active} data-index={i}>
              <a
                href={h.href}
                onClick={(e) => {
                  e.preventDefault()
                  go(h)
                }}
                onMouseMove={() => setActive(i)}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5", i === active && "bg-black/[0.045] dark:bg-white/[0.07]")}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-300">
                  {h.kind === "tag" ? <Hash className="size-4" /> : h.kind === "screen" ? <ArrowUpRight className="size-4" /> : <span className="text-[11px] font-semibold">{h.title.slice(0, 2)}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-neutral-900 dark:text-white">{h.title}</span>
                    <span className="shrink-0 rounded-md bg-black/[0.04] px-1.5 py-px text-[10.5px] font-medium text-neutral-500 dark:bg-white/[0.07] dark:text-neutral-400">{KIND_LABEL[h.kind] ?? h.kind}</span>
                    {"why" in h && typeof h.why === "string" && h.why && <span className="hidden truncate text-[11.5px] text-neutral-400 sm:inline">{h.why}</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-neutral-500 dark:text-neutral-400">{h.description}</span>
                </span>
                {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-neutral-400" />}
              </a>
            </li>
          ))}
          {query.trim() && !hits.length && <li className="px-3 py-8 text-center text-[13.5px] text-neutral-500">Nothing matches “{query}”. Try a job (“menu”, “chart”) or a material (“glass”, “dither”).</li>}
        </ul>
        <div className="flex items-center gap-4 border-t border-black/[0.06] px-4 py-2 text-[11.5px] text-neutral-400 dark:border-white/[0.08]">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span className="ml-auto">{docs.length} pieces and skills, searchable by name, tag and synonym</span>
        </div>
      </div>
    </div>
  )
}

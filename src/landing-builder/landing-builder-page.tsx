// Pane Landing Builder: assemble a product landing page from Pane's landing sections, edit its words, export it.
// Everything runs in the tab; the page is one JSON document, autosaved to this browser with undo and redo.
import * as React from "react"
import { Layers, Monitor, Moon, Redo2, RotateCcw, Smartphone, Sun, Tablet, Undo2, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, FIELD, IconButton, Seg, STUDIO_CSS, useInertOutside } from "@/studio/ui"
import { ACCENTS, darkAccent, isHex, onAccent } from "./color"
import { ExportDialog, PresetsDialog, type ExportTab } from "./dialogs"
import {
  applyBrandKeys,
  DOC_KEY,
  historyReducer,
  instance,
  materialize,
  parseDocument,
  PRESETS_KEY,
  readJSON,
  renameBrand,
  uid,
  VIEW_KEY,
  writeJSON,
  type History,
  type LandingDoc,
  type Preset,
  type Registry,
  type SavedPreset,
} from "./doc"
import { FieldsEditor } from "./editor"
import { Outline } from "./outline"
import { DEFAULT_PRESET, PRESETS } from "./presets"
import { PreviewFrame, type Look, type Scheme, type WidthKey } from "./preview"
import { clone, setIn, type Path } from "./schema"
import { loadSections } from "./sections"
import { cleanLine, MAX_NAME } from "./validate"

/* --------------------------------- helpers -------------------------------- */

function useMedia(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener("change", cb)
      return () => m.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => true,
  )
}

function useTheme() {
  const [dark, setDark] = React.useState(() => document.documentElement.classList.contains("dark"))
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem("pane-theme", next ? "dark" : "light")
    } catch {
      /* storage can be blocked */
    }
    setDark(next)
  }
  return [dark, toggle] as const
}

type View = { width: WidthKey; scheme: Scheme; look: Look }

function readView(): View {
  const v = readJSON<Partial<View>>(VIEW_KEY) ?? {}
  return {
    width: v.width === "tablet" || v.width === "phone" || v.width === "desktop" ? v.width : window.innerWidth < 1024 ? "phone" : "desktop",
    scheme: v.scheme === "dark" ? "dark" : "light",
    look: v.look === "mono" || v.look === "glass" ? v.look : "classic",
  }
}

function readSaved(reg: Registry): SavedPreset[] {
  const raw = readJSON<unknown>(PRESETS_KEY)
  if (!Array.isArray(raw)) return []
  const out: SavedPreset[] = []
  for (const p of raw.slice(0, 100)) {
    if (!p || typeof p !== "object") continue
    const r = p as Record<string, unknown>
    try {
      const { doc } = parseDocument(reg, r.doc)
      out.push({ id: typeof r.id === "string" ? cleanLine(r.id, 40) : uid(), name: cleanLine(r.name).trim() || "Untitled", savedAt: typeof r.savedAt === "number" ? r.savedAt : Date.now(), doc })
    } catch {
      /* skip a broken entry */
    }
  }
  return out
}

function initialDoc(reg: Registry): LandingDoc {
  const stored = readJSON<unknown>(DOC_KEY)
  if (stored) {
    try {
      return parseDocument(reg, stored).doc
    } catch {
      /* fall through to the default preset */
    }
  }
  return materialize(reg, DEFAULT_PRESET.doc).doc
}

const PANE_HEAD = "text-[13px] font-medium text-neutral-900 dark:text-neutral-100"
const LABEL = "px-0.5 text-[12px] font-medium text-neutral-500 dark:text-neutral-400"
const HELP = "px-0.5 text-[12px] leading-[18px] text-neutral-400 dark:text-neutral-500"

/* ---------------------------------- brand --------------------------------- */

function AccentPicker({ value, onChange }: { value: string; onChange: (hex: string, typing?: boolean) => void }) {
  const [text, setText] = React.useState(value)
  React.useEffect(() => setText(value), [value])
  const idx = ACCENTS.findIndex((a) => a.hex === value.toLowerCase())
  const focusable = idx === -1 ? 0 : idx
  return (
    <div className="flex flex-col gap-2.5">
      <span id="lb-accent-label" className={LABEL}>
        Accent colour
      </span>
      <div
        role="radiogroup"
        aria-labelledby="lb-accent-label"
        className="flex flex-wrap gap-2"
        onKeyDown={(e) => {
          if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return
          e.preventDefault()
          const next = ACCENTS[(focusable + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + ACCENTS.length) % ACCENTS.length]
          onChange(next.hex)
          requestAnimationFrame(() => (e.currentTarget.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus())
        }}
      >
        {ACCENTS.map((a, i) => (
          <button
            key={a.hex}
            type="button"
            role="radio"
            aria-checked={i === idx}
            aria-label={a.name}
            title={`${a.name} ${a.hex}`}
            tabIndex={i === focusable ? 0 : -1}
            onClick={() => onChange(a.hex)}
            className={cn(
              "st-press size-7 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/60 dark:focus-visible:ring-offset-neutral-950",
              i === idx ? "shadow-[0_0_0_2px_#fff,0_0_0_3.5px_rgb(23_23_23/0.85)] dark:shadow-[0_0_0_2px_#0a0a0a,0_0_0_3.5px_rgb(255_255_255/0.85)]" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]",
            )}
            style={{ background: a.hex }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: isHex(value) ? value : "#0060e2" }}>
          <span className="sr-only">Pick a custom colour</span>
          <input type="color" value={isHex(value) ? value : "#0060e2"} onChange={(e) => onChange(e.target.value, true)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <label htmlFor="lb-accent-hex" className="sr-only">
          Custom colour, hex
        </label>
        <input
          id="lb-accent-hex"
          value={text}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            const t = e.target.value.trim()
            setText(t)
            const hex = t.startsWith("#") ? t : `#${t}`
            if (isHex(hex)) onChange(hex.toLowerCase(), true)
          }}
          className={cn(FIELD, "w-28 font-mono text-[12.5px] uppercase")}
        />
        <span className="ml-auto inline-flex h-7 items-center rounded-md px-2.5 text-[12px] font-medium" style={{ background: value, color: onAccent(value) }} aria-hidden>
          Start free
        </span>
      </div>
      <p className={HELP}>
        Button text on this colour: {onAccent(value) === "#ffffff" ? "white" : "near-black"}. On dark pages the accent lifts to {darkAccent(value)} so it stays readable.
      </p>
    </div>
  )
}

function BrandPanel({ doc, onName, onNameCommit, onAccent: setAccent, onBaseUrl }: { doc: LandingDoc; onName: (v: string) => void; onNameCommit: (from: string, to: string) => void; onAccent: (hex: string, typing?: boolean) => void; onBaseUrl: (v: string) => void }) {
  const focusName = React.useRef(doc.brand.name)
  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
      <div className="flex flex-col gap-1">
        <h2 className={PANE_HEAD}>Brand</h2>
        <p className="text-[12.5px] leading-[19px] text-neutral-500 dark:text-neutral-400">Name, colour and address for the whole page. They apply to the preview and to every export. Pick a section to edit its words.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lb-brand-name" className={LABEL}>
          Product name
        </label>
        <input
          id="lb-brand-name"
          value={doc.brand.name}
          maxLength={MAX_NAME}
          onFocus={() => (focusName.current = doc.brand.name)}
          onChange={(e) => onName(cleanLine(e.target.value))}
          onBlur={(e) => onNameCommit(focusName.current, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
          className={cn(FIELD, "w-full")}
        />
        <p className={HELP}>Shown in the nav and footer as you type. When you leave the field, the copy that mentions the old name follows, including the copyright line.</p>
      </div>
      <AccentPicker value={doc.brand.accent} onChange={setAccent} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lb-base-url" className={LABEL}>
          Base URL
        </label>
        <input id="lb-base-url" value={doc.brand.baseUrl} placeholder="https://example.com" spellCheck={false} onChange={(e) => onBaseUrl(cleanLine(e.target.value, 200))} className={cn(FIELD, "w-full")} />
        <p className={HELP}>Links that start with / are joined to this address in the preview and the export. Links to #sections stay on the page.</p>
      </div>
    </div>
  )
}

/* --------------------------------- builder -------------------------------- */

function Builder({ reg }: { reg: Registry }) {
  const [hist, dispatch] = React.useReducer(historyReducer, undefined, (): History => ({ past: [], present: initialDoc(reg), future: [], key: null, at: 0 }))
  const doc = hist.present
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [view, setView] = React.useState<View>(() => readView())
  const [saved, setSaved] = React.useState<SavedPreset[]>(() => readSaved(reg))
  const [dialog, setDialog] = React.useState<null | { kind: "export"; tab: ExportTab } | { kind: "presets" }>(null)
  const [tab, setTab] = React.useState<"page" | "preview" | "edit">("preview")
  const [scrollTo, setScrollTo] = React.useState<{ id: string; n: number } | null>(null)
  const [scale, setScale] = React.useState(1)
  const [message, setMessage] = React.useState("")
  const [dark, toggleTheme] = useTheme()
  const desktop = useMedia("(min-width: 1024px)")
  const root = React.useRef<HTMLDivElement>(null)
  useInertOutside(root)

  const selected = doc.sections.find((s) => s.id === selectedId) ?? null
  const def = selected ? reg.get(selected.slug) : undefined
  const announce = React.useCallback((m: string) => setMessage((prev) => (prev === m ? `${m} ` : m)), [])
  const commit = React.useCallback((next: LandingDoc, key?: string) => dispatch({ type: "commit", doc: next, key }), [])

  // Autosave the document and the view.
  React.useEffect(() => {
    const t = setTimeout(() => writeJSON(DOC_KEY, doc), 250)
    return () => clearTimeout(t)
  }, [doc])
  React.useEffect(() => {
    writeJSON(VIEW_KEY, view)
  }, [view])

  const undo = React.useCallback(() => {
    if (!hist.past.length) return
    dispatch({ type: "undo" })
    announce("Undone.")
  }, [hist.past.length, announce])
  const redo = React.useCallback(() => {
    if (!hist.future.length) return
    dispatch({ type: "redo" })
    announce("Redone.")
  }, [hist.future.length, announce])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === "y" && e.ctrlKey) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  /* ------------------------------- operations ------------------------------- */

  const nameOf = (slug: string) => reg.get(slug)?.name ?? slug

  const select = (id: string | null, from: "outline" | "preview") => {
    setSelectedId(id)
    if (!id) return
    if (from === "outline") {
      setScrollTo({ id, n: Date.now() })
      if (!desktop) setTab("edit")
    } else {
      requestAnimationFrame(() => document.querySelector(`[data-outline-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "nearest" }))
    }
  }

  const updateContent = (path: Path, value: unknown, coalesce?: boolean) => {
    if (!selected) return
    commit({ ...doc, sections: doc.sections.map((s) => (s.id === selected.id ? { ...s, content: setIn(s.content, path, value) } : s)) }, coalesce ? `${selected.id}:${path.join(".")}` : undefined)
  }

  const toggleHidden = (id: string) => {
    const s = doc.sections.find((x) => x.id === id)
    if (!s) return
    commit({ ...doc, sections: doc.sections.map((x) => (x.id === id ? { ...x, hidden: !x.hidden } : x)) })
    announce(`${nameOf(s.slug)} ${s.hidden ? "shown" : "hidden"}.`)
  }

  const remove = (id: string) => {
    const i = doc.sections.findIndex((x) => x.id === id)
    if (i < 0) return
    commit({ ...doc, sections: doc.sections.filter((x) => x.id !== id) })
    if (selectedId === id) setSelectedId(null)
    announce(`${nameOf(doc.sections[i].slug)} removed. Undo brings it back.`)
  }

  const duplicate = (id: string) => {
    const i = doc.sections.findIndex((x) => x.id === id)
    if (i < 0) return
    const copy = { ...clone(doc.sections[i]), id: uid() }
    // Two sections must not share an anchor id.
    if (typeof copy.content.id === "string") copy.content.id = ""
    const sections = doc.sections.slice()
    sections.splice(i + 1, 0, copy)
    commit({ ...doc, sections })
    setSelectedId(copy.id)
    setScrollTo({ id: copy.id, n: Date.now() })
    announce(`${nameOf(copy.slug)} duplicated, at position ${i + 2}.`)
  }

  const order = (ids: string[]) => {
    const by = new Map(doc.sections.map((s) => [s.id, s]))
    commit({ ...doc, sections: ids.map((id) => by.get(id)!).filter(Boolean) })
  }

  const add = (slug: string) => {
    const inst = instance(reg, slug)
    if (!inst) return
    const withBrand = applyBrandKeys(reg, { ...doc, sections: [inst] }).sections[0]
    const sections = doc.sections.slice()
    const at = selected ? sections.findIndex((s) => s.id === selected.id) + 1 : sections.length && sections[sections.length - 1].slug === "landing-footer" ? sections.length - 1 : sections.length
    sections.splice(at, 0, withBrand)
    commit({ ...doc, sections })
    setSelectedId(withBrand.id)
    setScrollTo({ id: withBrand.id, n: Date.now() })
    announce(`${nameOf(slug)} added at position ${at + 1}.`)
  }

  const loadPreset = (p: Preset) => {
    const { doc: next } = materialize(reg, p.doc)
    commit(next)
    setSelectedId(null)
    announce(`Loaded the ${p.name} preset. Undo brings your page back.`)
  }

  const loadDoc = (next: LandingDoc, name: string) => {
    commit({ ...clone(next), sections: next.sections.map((s) => ({ ...clone(s), id: uid() })) })
    setSelectedId(null)
    announce(`Loaded ${name}.`)
  }

  const persistSaved = (list: SavedPreset[]) => {
    setSaved(list)
    return writeJSON(PRESETS_KEY, list)
  }

  const savePreset = (name: string, d?: LandingDoc): SavedPreset | null => {
    const n = cleanLine(name).trim() || "Untitled"
    const taken = new Set(saved.map((p) => p.name))
    let unique = n
    for (let i = 2; taken.has(unique); i++) unique = `${n} (${i})`
    const entry: SavedPreset = { id: uid(), name: unique, savedAt: Date.now(), doc: clone(d ?? doc) }
    return persistSaved([entry, ...saved]) ? entry : null
  }

  /* ---------------------------------- parts --------------------------------- */

  const header = (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-black/[0.06] px-3 lg:gap-3 lg:px-5 dark:border-white/[0.08]">
      <a href="#/" className="st-press flex min-w-0 items-center gap-2 rounded-lg text-[14px] font-semibold tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50">
        <span className="shrink-0">Pane</span>
        <span className="font-normal text-neutral-400">/</span>
        <span className="truncate font-medium">{desktop ? "Landing Builder" : "Builder"}</span>
      </a>
      {desktop && <span className="truncate text-[13px] text-neutral-400">{doc.brand.name}</span>}
      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Undo" title="Undo (⌘Z)" onClick={undo} disabled={!hist.past.length}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton label="Redo" title="Redo (⇧⌘Z)" onClick={redo} disabled={!hist.future.length}>
          <Redo2 className="size-4" />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-black/[0.08] dark:bg-white/[0.1]" aria-hidden />
        {desktop ? (
          <>
            <Button onClick={() => setDialog({ kind: "presets" })}>
              <Layers className="size-3.5" />
              Presets
            </Button>
            <Button onClick={() => loadPresetAsStartOver()}>
              <RotateCcw className="size-3.5" />
              Start over
            </Button>
            <IconButton label={dark ? "Switch the builder to light" : "Switch the builder to dark"} onClick={toggleTheme}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
          </>
        ) : (
          <IconButton label="Presets" onClick={() => setDialog({ kind: "presets" })}>
            <Layers className="size-4" />
          </IconButton>
        )}
        <Button primary onClick={() => setDialog({ kind: "export", tab: "install" })} className="ml-1">
          <Upload className="size-3.5" />
          Export
        </Button>
      </div>
    </header>
  )

  function loadPresetAsStartOver() {
    const { doc: next } = materialize(reg, DEFAULT_PRESET.doc)
    commit(next)
    setSelectedId(null)
    announce(`Started over from the ${DEFAULT_PRESET.name} preset. Undo brings your page back.`)
  }

  const toolbar = (
    <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pt-3">
      <Seg
        label="Preview width"
        hideLabel
        value={view.width}
        onChange={(width) => setView((v) => ({ ...v, width }))}
        options={[
          { id: "desktop", title: "Desktop, 1280 px", label: (<><Monitor className="size-3.5" /><span className="sr-only 2xl:not-sr-only">Desktop</span></>) },
          { id: "tablet", title: "Tablet, 820 px", label: (<><Tablet className="size-3.5" /><span className="sr-only 2xl:not-sr-only">Tablet</span></>) },
          { id: "phone", title: "Phone, 390 px", label: (<><Smartphone className="size-3.5" /><span className="sr-only 2xl:not-sr-only">Phone</span></>) },
        ]}
      />
      <Seg
        label="Preview colour scheme"
        hideLabel
        value={view.scheme}
        onChange={(scheme) => setView((v) => ({ ...v, scheme }))}
        options={[
          { id: "light", title: "Light", label: (<><Sun className="size-3.5" /><span className="sr-only xl:not-sr-only">Light</span></>) },
          { id: "dark", title: "Dark", label: (<><Moon className="size-3.5" /><span className="sr-only xl:not-sr-only">Dark</span></>) },
        ]}
      />
      <Seg
        label="Preview look"
        hideLabel
        value={view.look}
        onChange={(look) => setView((v) => ({ ...v, look }))}
        options={[
          { id: "classic", label: "Classic" },
          { id: "mono", label: "Mono" },
          { id: "glass", label: "Glass" },
        ]}
      />
      <span className="ml-auto text-[12px] tabular-nums text-neutral-400" title="Preview scale">
        {view.width === "desktop" ? 1280 : view.width === "tablet" ? 820 : 390} px · {Math.round(scale * 100)}%
      </span>
    </div>
  )

  const preview = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-neutral-100/70 dark:bg-white/[0.02]">
      {toolbar}
      <PreviewFrame doc={doc} reg={reg} width={view.width} scheme={view.scheme} look={view.look} selectedId={selectedId} onSelect={(id) => select(id, "preview")} scrollTo={scrollTo} onScale={setScale} />
    </div>
  )

  const outline = (
    <Outline
      sections={doc.sections}
      reg={reg}
      selectedId={selectedId}
      onSelect={(id) => select(id, "outline")}
      onToggleHidden={toggleHidden}
      onRemove={remove}
      onDuplicate={duplicate}
      onOrder={order}
      onAdd={add}
      announce={announce}
      touch={!desktop}
    />
  )

  const editor =
    selected && def ? (
      <div className="flex flex-col">
        <div className="sticky top-0 z-10 flex flex-col gap-1 border-b border-black/[0.06] bg-white/95 px-5 pb-3.5 pt-4 backdrop-blur dark:border-white/[0.08] dark:bg-neutral-950/95">
          <div className="flex items-center justify-between gap-2">
            <h2 className={PANE_HEAD}>{def.name}</h2>
            <IconButton label="Close the section editor and show Brand" onClick={() => setSelectedId(null)}>
              <X className="size-4" />
            </IconButton>
          </div>
          <p className="text-[12.5px] leading-[19px] text-neutral-500 dark:text-neutral-400">{def.description}</p>
        </div>
        <div className="px-5 pb-6 pt-5">
          <FieldsEditor key={selected.id} fields={def.fields} value={selected.content} onChange={updateContent} idBase={`lb-${selected.id}`} />
        </div>
        <div className="border-t border-black/[0.06] px-5 py-4 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              const fresh = applyBrandKeys(reg, { ...doc, sections: [{ ...selected, content: clone(def.defaults) }] }).sections[0]
              commit({ ...doc, sections: doc.sections.map((s) => (s.id === selected.id ? fresh : s)) })
              announce(`${def.name} reset to its default words.`)
            }}
            className="st-press inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-neutral-500 outline-none hover:bg-black/[0.04] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:hover:bg-white/[0.06] dark:hover:text-white dark:focus-visible:ring-white/50"
          >
            <RotateCcw className="size-3.5" />
            Reset this section
          </button>
        </div>
      </div>
    ) : (
      <BrandPanel
        doc={doc}
        onName={(name) => commit(applyBrandKeys(reg, { ...doc, brand: { ...doc.brand, name } }), "brand:name")}
        onNameCommit={(from, to) => {
          const next = renameBrand(reg, doc, from, cleanLine(to))
          if (JSON.stringify(next.sections) !== JSON.stringify(doc.sections)) commit(next, "brand:name")
        }}
        onAccent={(accent, typing) => commit({ ...doc, brand: { ...doc.brand, accent } }, typing ? "brand:accent" : undefined)}
        onBaseUrl={(baseUrl) => commit({ ...doc, brand: { ...doc.brand, baseUrl } }, "brand:url")}
      />
    )

  return (
    <div ref={root} className="st-root fixed inset-0 z-40 flex flex-col bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      <style>{STUDIO_CSS}</style>
      {header}
      {desktop ? (
        <div className="flex min-h-0 flex-1">
          <aside aria-label="Page outline" className="flex w-[272px] shrink-0 flex-col border-r border-black/[0.06] dark:border-white/[0.08]">
            {outline}
          </aside>
          <main aria-label="Preview" className="flex min-w-0 flex-1">
            {preview}
          </main>
          <aside aria-label={def ? `${def.name} editor` : "Brand"} className="st-scroll w-[328px] shrink-0 overflow-y-auto border-l border-black/[0.06] dark:border-white/[0.08]">
            {editor}
          </aside>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Builder" className="flex shrink-0 gap-1 border-b border-black/[0.06] px-3 py-2 dark:border-white/[0.08]">
            {(
              [
                ["page", "Page"],
                ["preview", "Preview"],
                ["edit", def ? `Edit ${def.name}` : "Brand"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                id={`lb-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`lb-panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
                  const ids = ["page", "preview", "edit"] as const
                  const next = ids[(ids.indexOf(id) + (e.key === "ArrowRight" ? 1 : -1) + 3) % 3]
                  setTab(next)
                  requestAnimationFrame(() => document.getElementById(`lb-tab-${next}`)?.focus())
                }}
                className={cn(
                  "st-press h-9 min-w-0 flex-1 truncate rounded-lg px-2 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50",
                  tab === id ? "bg-black/[0.06] text-neutral-900 dark:bg-white/[0.1] dark:text-white" : "text-neutral-500",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div id="lb-panel-page" role="tabpanel" aria-labelledby="lb-tab-page" hidden={tab !== "page"} className="min-h-0 flex-1 flex-col data-[on]:flex" data-on={tab === "page" ? "" : undefined}>
            {outline}
            <div className="flex shrink-0 gap-2 border-t border-black/[0.06] px-4 py-3 dark:border-white/[0.08]">
              <Button onClick={() => loadPresetAsStartOver()}>
                <RotateCcw className="size-3.5" />
                Start over
              </Button>
              <Button onClick={toggleTheme}>
                {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                {dark ? "Light builder" : "Dark builder"}
              </Button>
            </div>
          </div>
          <div id="lb-panel-preview" role="tabpanel" aria-labelledby="lb-tab-preview" hidden={tab !== "preview"} className="min-h-0 flex-1 flex-col data-[on]:flex" data-on={tab === "preview" ? "" : undefined}>
            {preview}
          </div>
          <div id="lb-panel-edit" role="tabpanel" aria-labelledby="lb-tab-edit" hidden={tab !== "edit"} className="st-scroll min-h-0 flex-1 overflow-y-auto">
            {editor}
          </div>
        </>
      )}
      <div aria-live="polite" className="sr-only">
        {message}
      </div>
      {dialog?.kind === "export" && <ExportDialog doc={doc} reg={reg} initial={dialog.tab} onClose={() => setDialog(null)} />}
      {dialog?.kind === "presets" && (
        <PresetsDialog
          presets={PRESETS}
          saved={saved}
          doc={doc}
          reg={reg}
          onClose={() => setDialog(null)}
          onLoadPreset={loadPreset}
          onLoadDoc={loadDoc}
          onSave={savePreset}
          onRename={(id, name) => persistSaved(saved.map((p) => (p.id === id ? { ...p, name } : p)))}
          onDelete={(id) => persistSaved(saved.filter((p) => p.id !== id))}
        />
      )}
    </div>
  )
}

/* ---------------------------------- page ---------------------------------- */

export default function LandingBuilderPage() {
  const [reg, setReg] = React.useState<Registry | null>(null)
  const [error, setError] = React.useState("")
  React.useEffect(() => {
    let alive = true
    loadSections()
      .then((r) => alive && setReg(r))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "The sections could not load."))
    return () => {
      alive = false
    }
  }, [])
  if (!reg)
    return (
      <div className="st-root fixed inset-0 z-40 grid place-items-center bg-white text-[13px] text-neutral-400 dark:bg-neutral-950">
        <style>{STUDIO_CSS}</style>
        {error ? <span className="text-red-600 dark:text-red-400">{error}</span> : "Loading Landing Builder"}
      </div>
    )
  return <Builder reg={reg} />
}

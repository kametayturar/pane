// Landing Builder: the Export and Presets dialogs.
import * as React from "react"
import { Check, Copy, Download, Pencil, Trash2, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, FIELD, HAIR, IconButton, Seg, useInertOutside } from "@/studio/ui"
import { parseDocument, presetFile, type LandingDoc, type Preset, type Registry, type SavedPreset } from "./doc"
import { agentPrompt, installCommand, pageFile } from "./export"
import { cleanLine } from "./validate"

/* --------------------------------- shared --------------------------------- */

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Clipboard API can be blocked (iframes, insecure origins): fall back to a hidden selection.
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function download(name: string, text: string, type = "application/json") {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }))
    const a = document.createElement("a")
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  } catch {
    /* downloads can be blocked; the text stays on screen to copy */
  }
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = React.useState<"idle" | "done" | "failed">("idle")
  React.useEffect(() => {
    if (state === "idle") return
    const t = setTimeout(() => setState("idle"), 1600)
    return () => clearTimeout(t)
  }, [state])
  return (
    <Button onClick={async () => setState((await copyText(text)) ? "done" : "failed")} aria-live="polite">
      {state === "done" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {state === "done" ? "Copied" : state === "failed" ? "Select and copy" : label}
    </Button>
  )
}

function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  useInertOutside(ref)
  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>("[data-autofocus], button")?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("keydown", key)
      prev?.focus()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div className="st-fade absolute inset-0 bg-black/25 dark:bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "st-enter relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_24px_60px_-20px_rgb(0_0_0/0.35)] sm:rounded-2xl dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_24px_60px_-20px_rgb(0_0_0/0.8)]",
          wide ? "sm:max-w-[760px]" : "sm:max-w-[560px]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
          <h2 id={titleId} className="text-[15px] font-medium tracking-[-0.01em]">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="st-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}

function Code({ text, label, maxH = "max-h-[46dvh]" }: { text: string; label: string; maxH?: string }) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className={cn("st-scroll overflow-auto rounded-xl bg-neutral-50 p-4 font-mono text-[12px] leading-[19px] text-neutral-800 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:bg-white/[0.04] dark:text-neutral-200", HAIR, maxH)}
    >
      {text}
    </pre>
  )
}

/* --------------------------------- export --------------------------------- */

export type ExportTab = "install" | "page" | "prompt"

export function ExportDialog({ doc, reg, onClose, initial = "install" }: { doc: LandingDoc; reg: Registry; onClose: () => void; initial?: ExportTab }) {
  const [tab, setTab] = React.useState<ExportTab>(initial)
  const out = React.useMemo(() => ({ install: installCommand(doc, reg), page: pageFile(doc, reg), prompt: agentPrompt(doc, reg) }), [doc, reg])
  const copy = {
    install: {
      title: "Install the sections",
      body: "Run this in your project root. It copies every section on this page into src/components/blocks with the shadcn CLI. Tailwind v4 is required and the @/ alias must point at src/.",
      file: null,
    },
    page: {
      title: "landing-page.tsx",
      body: "A complete page with your words inlined as typed props; only what differs from each section's defaults is written out, and hidden sections are left out. Save it as a route (for example app/page.tsx or src/pages/landing-page.tsx) after installing the sections, then set the accent as the comment at the top says.",
      file: "landing-page.tsx",
    },
    prompt: {
      title: "Prompt for your agent",
      body: "Paste this into Claude Code, Cursor or another coding agent working in your project. It points the agent at the Pane MCP server, lists the sections in order with their copy, and states the taste rules.",
      file: null,
    },
  }[tab]
  return (
    <Dialog title="Export" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <Seg
          label="Output"
          hideLabel
          value={tab}
          onChange={setTab}
          options={[
            { id: "install", label: "Install" },
            { id: "page", label: "Page file" },
            { id: "prompt", label: "Prompt for your agent" },
          ]}
        />
        <div className="flex flex-col gap-1">
          <h3 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{copy.title}</h3>
          <p className="max-w-[62ch] text-[13px] leading-[20px] text-neutral-500 dark:text-neutral-400">{copy.body}</p>
        </div>
        <Code text={out[tab]} label={copy.title} />
        <div className="flex flex-wrap gap-2">
          <CopyButton text={out[tab]} />
          {copy.file && (
            <Button onClick={() => download(copy.file!, out[tab], "text/plain")}>
              <Download className="size-3.5" />
              Download
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}

/* --------------------------------- presets -------------------------------- */

function JsonView({ name, text, onDone }: { name: string; text: string; onDone: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-[20px] text-neutral-500 dark:text-neutral-400">
        The whole page as JSON. Keep it with the project, or import it here later. Download saves it as a .json file; if downloads are blocked, copy it instead.
      </p>
      <textarea readOnly value={text} aria-label={`${name} as JSON`} className={cn(FIELD, "st-scroll h-[40dvh] w-full resize-none py-2 font-mono text-[12px] leading-[18px]")} />
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} />
        <Button onClick={() => download(`${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "landing-page"}.json`, text)}>
          <Download className="size-3.5" />
          Download
        </Button>
        <Button onClick={onDone}>Back to presets</Button>
      </div>
    </div>
  )
}

export function PresetsDialog({
  presets,
  saved,
  doc,
  reg,
  onClose,
  onLoadPreset,
  onLoadDoc,
  onSave,
  onRename,
  onDelete,
}: {
  presets: Preset[]
  saved: SavedPreset[]
  doc: LandingDoc
  reg: Registry
  onClose: () => void
  onLoadPreset: (p: Preset) => void
  onLoadDoc: (doc: LandingDoc, name: string) => void
  onSave: (name: string, doc?: LandingDoc) => SavedPreset | null
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = React.useState(doc.brand.name ? `${doc.brand.name} page` : "")
  const [json, setJson] = React.useState<{ name: string; text: string } | null>(null)
  const [renaming, setRenaming] = React.useState<{ id: string; name: string } | null>(null)
  const [confirm, setConfirm] = React.useState<string | null>(null)
  const [paste, setPaste] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [error, setError] = React.useState("")
  const fileRef = React.useRef<HTMLInputElement>(null)

  const importText = (text: string, fallbackName: string) => {
    setError("")
    try {
      const raw = JSON.parse(text) as unknown
      const { doc: imported, name: n, skipped } = parseDocument(reg, raw)
      const label = n ?? fallbackName
      const kept = onSave(label, imported)
      onLoadDoc(imported, label)
      setPaste("")
      setStatus(`Imported “${kept?.name ?? label}” and loaded it.${skipped.length ? ` Left out ${skipped.length} unknown section${skipped.length > 1 ? "s" : ""} (${skipped.join(", ")}).` : ""}`)
    } catch (e) {
      setError(e instanceof SyntaxError ? "That is not valid JSON." : e instanceof Error ? e.message : "That file could not be read.")
    }
  }

  if (json)
    return (
      <Dialog title={`Export “${json.name}”`} onClose={onClose}>
        <JsonView name={json.name} text={json.text} onDone={() => setJson(null)} />
      </Dialog>
    )

  return (
    <Dialog title="Presets" onClose={onClose} wide>
      <div className="flex flex-col gap-7">
        <section aria-labelledby="lb-starters" className="flex flex-col gap-2.5">
          <div>
            <h3 id="lb-starters" className="text-[13px] font-medium">
              Starting points
            </h3>
            <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400">Each replaces the current page. Undo brings it back.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onLoadPreset(p)
                  onClose()
                }}
                className={cn("st-press flex flex-col items-start gap-1 rounded-xl p-3.5 text-left outline-none hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:hover:bg-white/[0.03] dark:focus-visible:ring-white/50", HAIR)}
              >
                <span className="flex w-full items-baseline justify-between gap-2">
                  <span className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100">{p.name}</span>
                  <span className="text-[12px] tabular-nums text-neutral-400">{p.doc.brand.name}</span>
                </span>
                <span className="text-[12.5px] leading-[19px] text-neutral-500 dark:text-neutral-400">{p.description}</span>
                <span className="text-[12px] text-neutral-400">{p.doc.sections.filter((s) => reg.has(s.slug)).length} sections</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="lb-yours" className="flex flex-col gap-2.5">
          <div>
            <h3 id="lb-yours" className="text-[13px] font-medium">
              Your presets
            </h3>
            <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400">Saved in this browser. Export one to keep it with a project.</p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const n = cleanLine(name).trim()
              if (!n) return
              const kept = onSave(n)
              setStatus(kept ? `Saved “${kept.name}”.` : "Could not save: this browser is blocking storage.")
            }}
          >
            <label htmlFor="lb-save-name" className="sr-only">
              Name for this page
            </label>
            <input id="lb-save-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name for this page" className={cn(FIELD, "min-w-0 flex-1")} />
            <Button type="submit" primary disabled={!name.trim()}>
              Save current page
            </Button>
          </form>
          {saved.length > 0 ? (
            <ul className="flex flex-col divide-y divide-black/[0.06] dark:divide-white/[0.08]" aria-label="Your presets">
              {saved.map((p) => (
                <li key={p.id} className="flex min-h-12 items-center gap-2 py-1.5">
                  {renaming?.id === p.id ? (
                    <form
                      className="flex min-w-0 flex-1 gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const n = cleanLine(renaming.name).trim()
                        if (n) onRename(p.id, n)
                        setRenaming(null)
                      }}
                    >
                      <label htmlFor={`lb-rename-${p.id}`} className="sr-only">
                        New name
                      </label>
                      <input id={`lb-rename-${p.id}`} data-autofocus autoFocus value={renaming.name} onChange={(e) => setRenaming({ id: p.id, name: e.target.value })} className={cn(FIELD, "min-w-0 flex-1")} />
                      <Button type="submit">Rename</Button>
                      <Button onClick={() => setRenaming(null)}>Cancel</Button>
                    </form>
                  ) : confirm === p.id ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-[13px]">Delete “{p.name}”? This cannot be undone.</span>
                      <Button
                        onClick={() => {
                          onDelete(p.id)
                          setConfirm(null)
                          setStatus(`Deleted “${p.name}”.`)
                        }}
                      >
                        Delete
                      </Button>
                      <Button onClick={() => setConfirm(null)}>Keep</Button>
                    </>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-medium">{p.name}</span>
                        <span className="text-[12px] text-neutral-400">
                          {p.doc.sections.length} sections · saved {new Date(p.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <Button
                        onClick={() => {
                          onLoadDoc(p.doc, p.name)
                          onClose()
                        }}
                      >
                        Load
                      </Button>
                      <IconButton label={`Rename ${p.name}`} onClick={() => setRenaming({ id: p.id, name: p.name })}>
                        <Pencil className="size-3.5" />
                      </IconButton>
                      <IconButton label={`Export ${p.name}`} onClick={() => setJson({ name: p.name, text: presetFile(p.name, p.doc) })}>
                        <Download className="size-3.5" />
                      </IconButton>
                      <IconButton label={`Delete ${p.name}`} onClick={() => setConfirm(p.id)}>
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12.5px] text-neutral-400">Nothing saved yet.</p>
          )}
        </section>

        <section aria-labelledby="lb-files" className="flex flex-col gap-2.5">
          <div>
            <h3 id="lb-files" className="text-[13px] font-medium">
              Files
            </h3>
            <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400">Import a page exported from this builder, or export the current one.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" />
              Import a .json file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-label="Import a .json file"
              data-lb-import=""
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ""
                if (!f) return
                if (f.size > 1_000_000) return setError("That file is larger than 1 MB; a page export is a few kilobytes.")
                importText(await f.text(), f.name.replace(/\.json$/i, ""))
              }}
            />
            <Button onClick={() => setJson({ name: doc.brand.name || "Landing page", text: presetFile(doc.brand.name || "Landing page", doc) })}>
              <Download className="size-3.5" />
              Export current page
            </Button>
          </div>
          <details className="group">
            <summary className="w-max cursor-pointer rounded text-[12.5px] text-neutral-500 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:text-neutral-400 dark:hover:text-white">Paste JSON instead</summary>
            <div className="mt-2 flex flex-col gap-2">
              <label htmlFor="lb-paste" className="sr-only">
                Page JSON
              </label>
              <textarea id="lb-paste" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="{ … }" className={cn(FIELD, "h-28 w-full resize-y py-2 font-mono text-[12px]")} />
              <Button className="self-start" disabled={!paste.trim()} onClick={() => importText(paste, "Imported page")}>
                Import
              </Button>
            </div>
          </details>
          <p role="status" className="min-h-5 text-[12.5px] text-neutral-500 dark:text-neutral-400">
            {status}
          </p>
          {error && (
            <p role="alert" className="text-[12.5px] text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </section>
      </div>
    </Dialog>
  )
}

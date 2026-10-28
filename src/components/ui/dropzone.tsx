"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type DropzoneFileStatus = "uploading" | "done" | "error"

export type DropzoneFile = {
  id: string
  name: string
  /** Size in bytes. */
  size: number
  /** 0–100. */
  progress: number
  status: DropzoneFileStatus
  /** Why it failed (validation or upload). */
  error?: string
  /** True when the file was refused before uploading (wrong type, too big…). Rejected files can't be retried. */
  rejected?: boolean
  /** The browser File, when it came from a drop or the picker. */
  file?: File
}

export type DropzoneRejection = { file: File; reason: string }

export type DropzoneProps = {
  /** Comma-separated types like the `accept` attribute: ".pdf,image/*,text/plain". Empty means anything. */
  accept?: string
  /** Largest allowed file in bytes. */
  maxSize?: number
  /** Most files in the list (rejected rows count). */
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  /** Rows to start with, e.g. files that were uploaded earlier. */
  defaultFiles?: DropzoneFile[]
  /**
   * Your real upload. Report progress with `onProgress(0–100)`; reject to mark the row as failed.
   * Leave it out and the component simulates progress (names containing "fail" or "error" end in an error).
   */
  upload?: (file: File, onProgress: (percent: number) => void, signal: AbortSignal) => Promise<void>
  /** Called with the files that passed validation. */
  onFilesAdded?: (files: File[]) => void
  /** Called with the files that were refused and why. */
  onRejected?: (rejections: DropzoneRejection[]) => void
  /** Called after an upload finishes. */
  onUploaded?: (file: DropzoneFile) => void
  /** Called after a row was removed. */
  onRemove?: (file: DropzoneFile) => void
  title?: string
  /** Helper line under the title; defaults to a summary of `accept` and `maxSize`. */
  hint?: string
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.dz {
  --dz-ink: #000;
  --dz-surface: #fff;
  --dz-accent: #0060e2;
  --dz-ok: #139a52;
  --dz-err: #e5484d;
  --dz-t1: color-mix(in oklab, var(--dz-ink) 88%, transparent);
  --dz-t2: color-mix(in oklab, var(--dz-ink) 61%, transparent);
  --dz-t3: color-mix(in oklab, var(--dz-ink) 45%, transparent);
  --dz-t4: color-mix(in oklab, var(--dz-ink) 27%, transparent);
  --dz-fill: color-mix(in oklab, var(--dz-ink) 6%, transparent);
  --dz-line: color-mix(in oklab, var(--dz-ink) 6%, transparent);
  --dz-dash: color-mix(in oklab, var(--dz-ink) 20%, transparent);
  --dz-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --dz-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 480px;
  color: var(--dz-t1);
  font-family: var(--dz-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .dz {
  --dz-ink: #fff;
  --dz-surface: #1c1c1e;
  --dz-accent: #4d8dff;
  --dz-ok: #3fd17f;
  --dz-err: #ff6369;
  --dz-t1: color-mix(in oklab, var(--dz-ink) 90%, transparent);
  --dz-t2: color-mix(in oklab, var(--dz-ink) 62%, transparent);
  --dz-t3: color-mix(in oklab, var(--dz-ink) 46%, transparent);
  --dz-t4: color-mix(in oklab, var(--dz-ink) 28%, transparent);
  --dz-fill: color-mix(in oklab, var(--dz-ink) 8%, transparent);
  --dz-line: color-mix(in oklab, var(--dz-ink) 8%, transparent);
  --dz-dash: color-mix(in oklab, var(--dz-ink) 24%, transparent);
  --dz-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.dz *, .dz *::before, .dz *::after { box-sizing: border-box }
.dz button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
.dz :focus-visible { outline: 2px solid color-mix(in oklab, var(--dz-accent) 60%, transparent); outline-offset: 1px }

/* Drop area */
.dz-zone {
  position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 28px 20px 24px;
  border-radius: 12px; background: var(--dz-surface); text-align: center; cursor: pointer; user-select: none; -webkit-user-select: none;
  box-shadow: var(--dz-shadow); transition: background-color .2s, box-shadow .2s;
}
.dz-zone::before {
  content: ""; position: absolute; inset: 5px; border-radius: 8px; pointer-events: none;
  border: 1px dashed var(--dz-dash); transition: border-color .2s, background-color .2s;
}
.dz-zone:hover::before { border-color: var(--dz-t3) }
.dz-zone[data-over="true"] { background: color-mix(in oklab, var(--dz-accent) 4%, var(--dz-surface)) }
.dz-zone[data-over="true"]::before { border-color: var(--dz-accent); background: color-mix(in oklab, var(--dz-accent) 5%, transparent) }
.dz-zone[data-shake] { animation: dz-shake .42s var(--dz-ease) }
.dz-zone[aria-disabled="true"] { opacity: .5; cursor: not-allowed }
.dz-icon {
  display: grid; place-items: center; width: 36px; height: 36px; margin-bottom: 8px; border-radius: 10px;
  background: var(--dz-fill); color: var(--dz-t2); transition: transform .4s var(--dz-ease), background-color .2s, color .2s;
}
.dz-icon svg { width: 18px; height: 18px }
.dz-zone[data-over="true"] .dz-icon { transform: translateY(-3px) scale(1.06); color: var(--dz-accent); background: color-mix(in oklab, var(--dz-accent) 12%, transparent) }
.dz-title { position: relative; display: grid; font-weight: 500; color: var(--dz-t1) }
.dz-title > span { grid-area: 1 / 1; transition: opacity .25s, filter .25s, transform .3s var(--dz-ease) }
.dz-title > span:last-child { opacity: 0; filter: blur(4px); transform: translateY(3px) }
.dz-zone[data-over="true"] .dz-title > span:first-child { opacity: 0; filter: blur(4px); transform: translateY(-3px) }
.dz-zone[data-over="true"] .dz-title > span:last-child { opacity: 1; filter: none; transform: none; color: var(--dz-accent) }
.dz-browse { text-decoration: underline; text-decoration-color: var(--dz-t4); text-underline-offset: 2px }
.dz-hint { font-size: 12px; line-height: 16px; color: var(--dz-t3) }
.dz-input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none }

/* Files */
.dz-list { margin: 0; padding: 0; list-style: none }
.dz-row {
  display: grid; grid-template-rows: 1fr; transition: grid-template-rows .4s var(--dz-ease), opacity .28s, filter .28s;
  animation: dz-row-in .5s var(--dz-ease) backwards;
}
.dz-row[data-leaving] { grid-template-rows: 0fr; opacity: 0; filter: blur(3px); pointer-events: none }
.dz-clip { min-height: 0; overflow: hidden; padding: 0 1px }
.dz-card {
  position: relative; display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 10px 8px 10px 10px;
  border-radius: 10px; background: var(--dz-surface); box-shadow: var(--dz-shadow);
}
.dz-card[data-status="error"] { box-shadow: 0 0 0 .5px color-mix(in oklab, var(--dz-err) 45%, transparent), 0 1px 2px 0 rgb(0 0 0 / .05) }
.dz-ext {
  display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 8px; background: var(--dz-fill);
  font-size: 9.5px; line-height: 1; font-weight: 600; letter-spacing: .02em; color: var(--dz-t2); text-transform: uppercase;
}
.dz-main { flex: 1; min-width: 0 }
.dz-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: var(--dz-t1) }
.dz-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16px; color: var(--dz-t3); font-variant-numeric: tabular-nums }
.dz-card[data-status="error"] .dz-meta { color: var(--dz-err) }
.dz-meta > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.dz-bar { height: 3px; margin-top: 6px; border-radius: 2px; overflow: hidden; background: var(--dz-fill); transition: opacity .4s .3s, margin .4s .3s, height .4s .3s }
.dz-bar i { display: block; height: 100%; width: 100%; border-radius: 2px; background: var(--dz-accent); transform-origin: left; transform: scaleX(var(--dz-p, 0)); transition: transform .24s linear }
.dz-card:not([data-status="uploading"]) .dz-bar { opacity: 0; height: 0; margin-top: 0 }
.dz-state { display: grid; place-items: center; flex: none; width: 20px; height: 20px }
.dz-state svg { width: 16px; height: 16px }
.dz-spin { animation: dz-spin .8s linear infinite; color: var(--dz-accent) }
.dz-ok { color: var(--dz-ok); animation: dz-pop .46s var(--dz-ease) backwards }
.dz-bad { color: var(--dz-err); animation: dz-pop .46s var(--dz-ease) backwards }
.dz .dz-btn {
  display: grid; place-items: center; flex: none; width: 26px; height: 26px; border-radius: 6px; color: var(--dz-t3);
  transition: background-color .16s, color .16s;
}
.dz .dz-btn:hover { background: var(--dz-fill); color: var(--dz-ink) }
.dz .dz-btn svg { width: 14px; height: 14px }

@keyframes dz-row-in { from { grid-template-rows: 0fr; opacity: 0; filter: blur(3px) } }
@keyframes dz-spin { to { transform: rotate(360deg) } }
@keyframes dz-pop { 0% { transform: scale(.5); opacity: 0 } 60% { transform: scale(1.14) } 100% { transform: none } }
@keyframes dz-shake { 20% { transform: translateX(-4px) } 40% { transform: translateX(3px) } 60% { transform: translateX(-2px) } 80% { transform: translateX(1px) } }

@media (prefers-reduced-motion: reduce) {
  .dz *, .dz *::before, .dz *::after { animation: none !important; transition: none !important }
  .dz-zone[data-shake] { animation: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const svg = { viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / (1024 * 1024)
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`
}

function extOf(name: string) {
  const i = name.lastIndexOf(".")
  return i > 0 ? name.slice(i + 1).slice(0, 4) : "file"
}

function matchesAccept(file: File, accept: string) {
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  if (tokens.length === 0) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return tokens.some((t) => {
    if (t.startsWith(".")) return name.endsWith(t)
    if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1))
    return type === t
  })
}

function describeAccept(accept: string) {
  const tokens = accept
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
  if (tokens.length === 0) return ""
  return tokens.map((t) => (t.startsWith(".") ? t.slice(1).toUpperCase() : t.endsWith("/*") ? t.slice(0, -2) : (t.split("/")[1] ?? t).toUpperCase())).join(", ")
}

/** Tiny deterministic hash so each simulated upload runs at its own speed. */
function speedOf(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return 3 + (Math.abs(h) % 6)
}

type Row = DropzoneFile & { leaving?: boolean }

/* -------------------------------------------------------------------------- */
/*                                  Dropzone                                  */
/* -------------------------------------------------------------------------- */

export function Dropzone({
  accept = "",
  maxSize = 10 * 1024 * 1024,
  maxFiles = 8,
  multiple = true,
  disabled = false,
  defaultFiles = [],
  upload,
  onFilesAdded,
  onRejected,
  onUploaded,
  onRemove,
  title = "Drop files here or",
  hint,
  className,
}: DropzoneProps) {
  const [rows, setRows] = React.useState<Row[]>(defaultFiles)
  const [over, setOver] = React.useState(false)
  const [shake, setShake] = React.useState(false)
  const [announce, setAnnounce] = React.useState("")
  const input = React.useRef<HTMLInputElement>(null)
  const depth = React.useRef(0)
  const seq = React.useRef(0)
  const aborts = React.useRef(new Map<string, AbortController>())
  const timers = React.useRef(new Set<number>())
  const latest = React.useRef({ onUploaded, onRemove, upload })
  React.useEffect(() => {
    latest.current = { onUploaded, onRemove, upload }
  })

  React.useEffect(() => {
    const a = aborts.current
    const t = timers.current
    return () => {
      a.forEach((c) => c.abort())
      t.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  // Report finished uploads once each (rows that arrived already done are not reported).
  const notified = React.useRef(new Set(defaultFiles.filter((f) => f.status === "done").map((f) => f.id)))
  React.useEffect(() => {
    rows.forEach((r) => {
      if (r.status === "done" && !notified.current.has(r.id)) {
        notified.current.add(r.id)
        latest.current.onUploaded?.(r)
      } else if (r.status !== "done") notified.current.delete(r.id)
    })
  }, [rows])

  const patch = React.useCallback((id: string, p: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))
  }, [])

  const run = React.useCallback(
    (row: Row) => {
      const file = row.file
      const real = latest.current.upload
      if (!real || !file) return
      const ctrl = new AbortController()
      aborts.current.set(row.id, ctrl)
      real(file, (p) => patch(row.id, { progress: Math.max(0, Math.min(100, p)) }), ctrl.signal).then(
        () => {
          aborts.current.delete(row.id)
          patch(row.id, { status: "done", progress: 100 })
          setAnnounce(`${row.name} uploaded`)
        },
        (err: unknown) => {
          aborts.current.delete(row.id)
          if (ctrl.signal.aborted) return
          const msg = err instanceof Error && err.message ? err.message : "Upload failed"
          patch(row.id, { status: "error", error: msg })
          setAnnounce(`${row.name} failed: ${msg}`)
        },
      )
    },
    [patch],
  )

  // Simulated progress when no real upload function is given.
  const simulating = !upload && rows.some((r) => r.status === "uploading" && !r.leaving)
  React.useEffect(() => {
    if (!simulating) return
    const id = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.status !== "uploading" || r.leaving) return r
          const next = Math.min(100, r.progress + speedOf(r.id))
          if (/fail|error/i.test(r.name) && next >= 58) return { ...r, progress: 58, status: "error", error: "Upload failed – connection lost" }
          if (next >= 100) return { ...r, progress: 100, status: "done" }
          return { ...r, progress: next }
        }),
      )
    }, 140)
    return () => window.clearInterval(id)
  }, [simulating])

  const addFiles = (list: FileList | File[]) => {
    if (disabled) return
    let incoming = Array.from(list)
    if (!multiple) incoming = incoming.slice(0, 1)
    const accepted: File[] = []
    const rejections: DropzoneRejection[] = []
    let room = maxFiles - rows.filter((r) => !r.leaving).length + (multiple ? 0 : rows.filter((r) => !r.leaving).length)
    const nextRows: Row[] = []
    for (const file of incoming) {
      const id = `f${Date.now().toString(36)}-${++seq.current}`
      let reason = ""
      if (!matchesAccept(file, accept)) reason = `Type not allowed${accept ? ` (${describeAccept(accept)})` : ""}`
      else if (file.size > maxSize) reason = `Larger than ${formatSize(maxSize)}`
      else if (room <= 0) reason = `Limit of ${maxFiles} files reached`
      if (reason) {
        rejections.push({ file, reason })
        nextRows.push({ id, name: file.name, size: file.size, progress: 0, status: "error", error: reason, rejected: true, file })
      } else {
        room--
        accepted.push(file)
        nextRows.push({ id, name: file.name, size: file.size, progress: 0, status: "uploading", file })
      }
    }
    if (nextRows.length === 0) return
    setRows((prev) => (multiple ? [...prev, ...nextRows] : nextRows))
    nextRows.filter((r) => !r.rejected).forEach(run)
    if (accepted.length) onFilesAdded?.(accepted)
    if (rejections.length) {
      onRejected?.(rejections)
      setShake(true)
      timers.current.add(window.setTimeout(() => setShake(false), 460))
      setAnnounce(`${rejections.length} file${rejections.length > 1 ? "s" : ""} rejected: ${rejections[0].reason}`)
    }
  }

  const remove = (row: Row) => {
    aborts.current.get(row.id)?.abort()
    aborts.current.delete(row.id)
    patch(row.id, { leaving: true })
    const t = window.setTimeout(() => {
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      latest.current.onRemove?.(row)
    }, 400)
    timers.current.add(t)
  }

  const retry = (row: Row) => {
    const next: Row = { ...row, status: "uploading", progress: 0, error: undefined }
    patch(row.id, { status: "uploading", progress: 0, error: undefined })
    run(next)
  }

  const dragProps = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault()
      if (disabled) return
      depth.current++
      setOver(true)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = disabled ? "none" : "copy"
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) setOver(false)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      depth.current = 0
      setOver(false)
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
    },
  }

  const helper = hint ?? [describeAccept(accept), maxSize ? `up to ${formatSize(maxSize)}` : ""].filter(Boolean).join(" · ")

  return (
    <div className={cn("dz", className)}>
      <style href="dropzone" precedence="default">
        {CSS}
      </style>

      <div
        className="dz-zone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label="Upload files. Drop files here or press Enter to browse."
        data-over={over}
        data-shake={shake || undefined}
        onClick={() => !disabled && input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (!disabled) input.current?.click()
          }
        }}
        {...dragProps}
      >
        <span className="dz-icon" aria-hidden>
          <svg {...svg}>
            <path d="M8 10.5V3m0 0L5.2 5.8M8 3l2.8 2.8M3 10.5v1A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="dz-title">
          <span>
            {title} <span className="dz-browse">browse</span>
          </span>
          <span aria-hidden>Release to upload</span>
        </span>
        {helper && <span className="dz-hint">{helper}</span>}
        <input
          ref={input}
          className="dz-input"
          type="file"
          accept={accept || undefined}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      <ul className="dz-list" aria-label="Files">
        {rows.map((row) => (
          <li key={row.id} className="dz-row" data-leaving={row.leaving || undefined}>
            <div className="dz-clip">
              <div className="dz-card" data-status={row.status} style={{ "--dz-p": row.progress / 100 } as React.CSSProperties}>
                <span className="dz-ext" aria-hidden>
                  {extOf(row.name)}
                </span>
                <div className="dz-main">
                  <div className="dz-name" title={row.name}>
                    {row.name}
                  </div>
                  <div className="dz-meta">
                    {row.status === "error" ? (
                      <span>{row.error ?? "Upload failed"}</span>
                    ) : (
                      <>
                        <span>{formatSize(row.size)}</span>
                        {row.status === "uploading" && <span aria-hidden>· {Math.round(row.progress)}%</span>}
                        {row.status === "done" && <span aria-hidden>· Uploaded</span>}
                      </>
                    )}
                  </div>
                  <div
                    className="dz-bar"
                    role="progressbar"
                    aria-label={`Uploading ${row.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(row.progress)}
                    aria-hidden={row.status !== "uploading" || undefined}
                  >
                    <i />
                  </div>
                </div>
                <span className="dz-state" aria-hidden>
                  {row.status === "uploading" && (
                    <svg {...svg} className="dz-spin">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity=".2" />
                      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {row.status === "done" && (
                    <svg {...svg} className="dz-ok">
                      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
                      <path d="m5.4 8.2 1.8 1.8 3.5-3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {row.status === "error" && (
                    <svg {...svg} className="dz-bad">
                      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M8 4.9v3.5M8 10.6v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                {row.status === "error" && !row.rejected && (
                  <button type="button" className="dz-btn" aria-label={`Retry ${row.name}`} onClick={() => retry(row)}>
                    <svg {...svg}>
                      <path d="M12.5 8a4.5 4.5 0 1 1-1.4-3.25M12.5 2.8v2.4h-2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                <button type="button" className="dz-btn" aria-label={`Remove ${row.name}`} onClick={() => remove(row)}>
                  <svg {...svg}>
                    <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div aria-live="polite" role="status" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {announce}
      </div>
    </div>
  )
}

// The Export menu button and the hook that runs exports and reports progress.
import * as React from "react"
import { ChevronDown, Download } from "lucide-react"

import { cn } from "@/lib/utils"
import { Cancelled, capabilities, copyImage, copyText, download, exportGif, exportPng, exportSvg, exportWebm, formatBytes, motionPlan, stillSize, stillTooLarge, type Job } from "./export"
import { buildHash, componentSnippet, changedValues, type StudioState } from "./registry"
import type { StudioSpec, Values } from "./schema"
import type { StageHandle } from "./stage"
import { Button } from "./ui"

export type Status = { text: string; busy?: boolean; error?: boolean; frac?: number }
type Kind = "png" | "copy" | "svg" | "webm" | "gif"

export function useExporter(spec: StudioSpec, values: Values, w: number, h: number, state: StudioState, stage: React.RefObject<StageHandle | null>) {
  const [status, setStatus] = React.useState<Status | null>(null)
  const [scale, setScale] = React.useState<1 | 2 | 3>(1)
  const [hd, setHd] = React.useState(false)
  const ctl = React.useRef<AbortController | null>(null)
  const clear = React.useRef<number | undefined>(undefined)

  const say = React.useCallback((s: Status | null, ttl = 0) => {
    window.clearTimeout(clear.current)
    setStatus(s)
    if (s && ttl) clear.current = window.setTimeout(() => setStatus(null), ttl)
  }, [])

  const job = (signal?: AbortSignal, onProgress?: Job["onProgress"]): Job => ({
    spec,
    values,
    w,
    h,
    t: stage.current?.time() ?? 0,
    dom: stage.current?.dom() ?? null,
    signal,
    onProgress,
  })

  const base = `pane-${spec.id}-${w}x${h}`
  const busy = !!status?.busy

  const run = async (kind: Kind) => {
    if (busy) return
    const ac = new AbortController()
    ctl.current = ac
    const progress = (d: number, total: number, label?: string) => say({ busy: true, text: `${label ?? "Rendering"} ${d}/${total}`, frac: total ? d / total : 0 })
    try {
      if (kind === "png") {
        say({ busy: true, text: "Rendering image" })
        const blob = await exportPng(job(ac.signal), scale)
        download(blob, `${base}${scale > 1 ? `@${scale}x` : ""}.png`)
        say({ text: `Saved ${stillSize({ w, h }, scale).w} × ${stillSize({ w, h }, scale).h} PNG` }, 5000)
      } else if (kind === "copy") {
        say({ busy: true, text: "Copying image" })
        const s = Math.min(scale, 2)
        const promise = exportPng(job(ac.signal), s)
        const ok = await copyImage(promise)
        if (ok) say({ text: "Image copied" }, 4000)
        else {
          download(await promise, `${base}.png`)
          say({ text: "This browser cannot copy images, so the PNG was saved." }, 6000)
        }
      } else if (kind === "svg") {
        download(exportSvg(job()), `${base}.svg`)
        say({ text: "Saved SVG" }, 4000)
      } else if (kind === "webm") {
        const blob = await exportWebm(job(ac.signal, progress), hd)
        download(blob, `${base}.webm`)
        say({ text: `Saved WebM, ${formatBytes(blob.size)}` }, 6000)
      } else {
        const blob = await exportGif(job(ac.signal, progress), hd)
        download(blob, `${base}.gif`)
        say({ text: `Saved GIF, ${formatBytes(blob.size)}` }, 6000)
      }
    } catch (e) {
      if (e instanceof Cancelled || ac.signal.aborted) say({ text: "Cancelled" }, 2500)
      else say({ text: e instanceof Error ? e.message : "The export failed.", error: true }, 10000)
    } finally {
      ctl.current = null
    }
  }

  const copy = async (what: "component" | "settings" | "link") => {
    const text =
      what === "component"
        ? componentSnippet(spec, values)
        : what === "settings"
          ? JSON.stringify({ piece: spec.id, size: state.size === "custom" ? { w, h } : state.size, values: changedValues(spec, values) }, null, 2)
          : `${location.origin}${location.pathname}${buildHash(spec, state)}`
    const ok = await copyText(text)
    say(ok ? { text: what === "component" ? "Component copied" : what === "settings" ? "Settings copied" : "Link copied" } : { text: "Copy was blocked by the browser.", error: true }, 3500)
  }

  // A status that names a size or look goes stale when either changes.
  React.useEffect(() => {
    setStatus((s) => (s && !s.busy ? null : s))
  }, [w, h, spec.id])

  React.useEffect(() => () => ctl.current?.abort(), [])
  return { status, busy, scale, setScale, hd, setHd, run, copy, cancel: () => ctl.current?.abort() }
}

export type Exporter = ReturnType<typeof useExporter>

export function StatusLine({ ex }: { ex: Exporter }) {
  const s = ex.status
  if (!s) return null
  return (
    <span className={cn("flex min-w-0 items-center gap-2", s.error ? "text-red-600 dark:text-red-400" : "text-neutral-500")}>
      {s.busy && (
        <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 -rotate-90" aria-hidden>
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${(s.frac ?? 0.08) * 37.7} 37.7`} style={{ transition: "stroke-dasharray 200ms cubic-bezier(.22,1,.36,1)" }} />
        </svg>
      )}
      <span className="truncate tabular-nums">{s.text}</span>
      {s.busy && (
        <button type="button" onClick={ex.cancel} className="shrink-0 rounded px-1 text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline dark:hover:text-white">
          Cancel
        </button>
      )}
    </span>
  )
}

function Item({ children, hint, disabled, reason, onClick, role = "menuitem", checked }: { children: React.ReactNode; hint?: React.ReactNode; disabled?: boolean; reason?: string; onClick: () => void; role?: string; checked?: boolean }) {
  return (
    <div>
      <button
        type="button"
        role={role}
        aria-checked={checked}
        disabled={disabled}
        onClick={onClick}
        className="st-press flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] text-neutral-800 outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.05] disabled:pointer-events-none disabled:text-neutral-400 dark:text-neutral-200 dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.08] disabled:dark:text-neutral-500"
      >
        <span>{children}</span>
        {hint && <span className="text-[12px] tabular-nums text-neutral-400">{hint}</span>}
      </button>
      {disabled && reason && <p className="px-2.5 pb-1.5 text-[12px] text-neutral-400">{reason}</p>}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col py-1" role="group" aria-label={title}>
      <div className="px-2.5 pb-0.5 pt-1.5 text-[12px] font-medium text-neutral-400">{title}</div>
      {children}
    </div>
  )
}

export function ExportMenu({ spec, ex, w, h }: { spec: StudioSpec; ex: Exporter; w: number; h: number }) {
  const [open, setOpen] = React.useState(false)
  const btn = React.useRef<HTMLButtonElement>(null)
  const pop = React.useRef<HTMLDivElement>(null)
  const caps = capabilities(spec)
  const job = { w, h }
  const tooBig = (s: number) => stillTooLarge(job, s)
  const dom = spec.export.png === "dom"
  const webmPlan = spec.duration ? motionPlan(spec, "webm", ex.hd, w, h) : null
  const gifPlan = spec.duration ? motionPlan(spec, "gif", ex.hd, w, h) : null
  const hidden = typeof document !== "undefined" && document.visibilityState === "hidden"

  const close = React.useCallback((back = true) => {
    setOpen(false)
    if (back) btn.current?.focus()
  }, [])

  React.useEffect(() => {
    if (!open) return
    const first = pop.current?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')
    first?.focus()
    const down = (e: PointerEvent) => {
      if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", down)
    return () => document.removeEventListener("pointerdown", down)
  }, [open, close])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      close()
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault()
      const items = [...(pop.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? [])]
      const i = items.indexOf(document.activeElement as HTMLElement)
      const n = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
      items[n]?.focus()
    } else if (e.key === "Tab") close(false)
  }

  const act = (fn: () => void) => () => {
    close(false)
    fn()
  }
  const motionBlock = (kind: "webm" | "gif") => {
    const cap = caps[kind]
    const plan = kind === "webm" ? webmPlan : gifPlan
    const reason = cap.ok && hidden ? "Keep this tab visible while it renders." : cap.reason
    return (
      <Item
        key={kind}
        disabled={!cap.ok || hidden}
        reason={reason}
        hint={cap.ok && plan ? `${plan.w}×${plan.h} · ${spec.duration}s · about ${formatBytes(plan.estimate)}` : undefined}
        onClick={act(() => ex.run(kind))}
      >
        {kind === "webm" ? "WebM video" : "GIF"}
      </Item>
    )
  }

  return (
    <div className="relative">
      <Button ref={btn} primary onClick={() => (open ? close(false) : setOpen(true))} aria-haspopup="menu" aria-expanded={open} disabled={ex.busy}>
        <Download className="size-3.5" />
        Export
        <ChevronDown className={cn("size-3.5 opacity-70 transition-transform duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)]", open && "rotate-180")} />
      </Button>
      {open && (
        <div
          ref={pop}
          role="menu"
          aria-label="Export"
          onKeyDown={onKey}
          className={cn("st-pop absolute right-0 top-[calc(100%+8px)] z-50 w-[22rem] max-w-[calc(100vw-24px)] divide-y divide-black/[0.06] rounded-2xl bg-white p-1.5 shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_16px_40px_-12px_rgb(0_0_0/0.22)] dark:divide-white/[0.08] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_16px_40px_-12px_rgb(0_0_0/0.7)]", )}
        >
          <Group title="Image">
            <div className="flex items-center justify-between gap-3 px-1.5 pb-1" role="group" aria-label="Scale">
              <div className="flex gap-0.5 rounded-lg bg-black/[0.04] p-[3px] dark:bg-white/[0.06]">
                {([1, 2, 3] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitemradio"
                    aria-checked={ex.scale === s}
                    disabled={tooBig(s)}
                    onClick={() => ex.setScale(s)}
                    className={cn("st-press h-6 rounded-md px-2.5 text-[12.5px] font-medium text-neutral-500 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 disabled:opacity-35 dark:focus-visible:ring-white/50", ex.scale === s && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:bg-white/10 dark:text-white")}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <span className="text-[12px] tabular-nums text-neutral-400">
                → {stillSize(job, ex.scale).w} × {stillSize(job, ex.scale).h} px
              </span>
            </div>
            <Item disabled={!caps.png.ok} reason={caps.png.reason} onClick={act(() => ex.run("png"))} hint="PNG">
              Download image
            </Item>
            <Item disabled={!caps.png.ok} reason={caps.png.reason} onClick={act(() => ex.run("copy"))}>
              Copy image
            </Item>
          </Group>
          <Group title="Vector">
            <Item disabled={!caps.svg.ok} reason={caps.svg.reason} onClick={act(() => ex.run("svg"))} hint="SVG">
              Download SVG
            </Item>
          </Group>
          <Group title="Motion">
            {motionBlock("webm")}
            {motionBlock("gif")}
            {(caps.webm.ok || caps.gif.ok) && (
              <Item role="menuitemcheckbox" checked={ex.hd} onClick={() => ex.setHd(!ex.hd)} hint={ex.hd ? "On" : "Off"}>
                HD, up to 1920 px
              </Item>
            )}
          </Group>
          <Group title="Code">
            <Item onClick={act(() => ex.copy("component"))}>Copy as component</Item>
            <Item onClick={act(() => ex.copy("settings"))}>Copy settings (JSON)</Item>
            <Item onClick={act(() => ex.copy("link"))}>Copy link to this look</Item>
          </Group>
          {(spec.export.notes || dom) && (
            <p className={cn("px-3 pb-2 pt-2.5 text-[12px] leading-relaxed text-neutral-400")}>
              {dom && "Approximate: this image is captured from the page. "}
              {spec.export.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}


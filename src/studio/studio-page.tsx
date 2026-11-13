// Pane Studio: pick a piece, shape it with schema-driven controls, export it. Everything runs in the tab.
import * as React from "react"
import { Moon, RotateCcw, SlidersHorizontal, Sun, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { ControlPanel } from "./controls"
import { ExportMenu, StatusLine, useExporter } from "./export-menu"
import {
  allowedSizes,
  buildHash,
  clampSide,
  dims,
  initialValues,
  KIND_ORDER,
  loadSpecs,
  MAX_SIDE,
  MIN_SIDE,
  parseHash,
  samePreset,
  SIZE_ORDER,
  type SizeKey,
  type StudioState,
} from "./registry"
import { SIZES, type SizeId, type StudioSpec, type Values } from "./schema"
import { Stage, type StageHandle } from "./stage"
import { Thumb } from "./thumb"
import { FIELD, HAIR, IconButton, Seg, STUDIO_CSS, useInertOutside } from "./ui"

const STORE = "pane-studio-v2:"
const DEFAULT_PIECE = "grain-gradient"
const EMPTY_SPEC: StudioSpec = { id: "", name: "", kind: "gradient", controls: [], presets: [], export: { png: false } }
const EMPTY_STATE: StudioState = { id: "", values: {}, size: "1:1", cw: 1200, ch: 800 }
const NO_VALUES: Values = {}

/* ------------------------------ state helpers ------------------------------ */

function firstSize(spec: StudioSpec): SizeKey {
  return spec.presets[0]?.size ?? allowedSizes(spec)[0] ?? "1:1"
}

function freshState(spec: StudioSpec, presetId?: string): StudioState {
  const p = spec.presets.find((x) => x.id === presetId) ?? spec.presets[0]
  return { id: spec.id, values: initialValues(spec, p?.values), size: p?.size ?? firstSize(spec), cw: 1200, ch: 800 }
}

function readStored(id: string): Partial<StudioState> | null {
  try {
    const raw = localStorage.getItem(STORE + id)
    return raw ? (JSON.parse(raw) as Partial<StudioState>) : null
  } catch {
    return null
  }
}

function resolve(specs: StudioSpec[], hash: string): StudioState {
  const parsed = parseHash(hash)
  let spec = specs.find((s) => s.id === parsed?.id)
  let presetId: string | undefined
  if (!spec && parsed?.id) {
    // The path can also name a preset on its own.
    for (const s of specs) {
      if (s.presets.some((p) => p.id === parsed.id)) {
        spec = s
        presetId = parsed.id
        break
      }
    }
  }
  spec ??= specs.find((s) => s.id === DEFAULT_PIECE) ?? specs[0]
  const base = freshState(spec, presetId)
  if (parsed?.v || parsed?.size) {
    const size = parsed.size && (parsed.size === "custom" || allowedSizes(spec).includes(parsed.size as SizeId)) ? parsed.size : base.size
    return { ...base, values: { ...base.values, ...stripImages(spec, parsed.v ?? {}) }, size, cw: parsed.w ? clampSide(parsed.w) : base.cw, ch: parsed.h ? clampSide(parsed.h) : base.ch }
  }
  const stored = !presetId ? readStored(spec.id) : null
  if (stored?.values && typeof stored.values === "object") {
    const size = stored.size && (stored.size === "custom" || allowedSizes(spec).includes(stored.size as SizeId)) ? stored.size : base.size
    return { ...base, values: { ...base.values, ...stripImages(spec, stored.values) }, size, cw: clampSide(stored.cw ?? base.cw), ch: clampSide(stored.ch ?? base.ch) }
  }
  return base
}

function stripImages(spec: StudioSpec, v: Values): Values {
  const out = { ...v }
  for (const c of spec.controls) if (c.type === "image") delete out[c.key]
  return out
}

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

/* ---------------------------------- parts ---------------------------------- */

function DimInput({ label, value, onCommit }: { label: string; value: number; onCommit: (n: number) => void }) {
  const [text, setText] = React.useState(String(value))
  React.useEffect(() => setText(String(value)), [value])
  const commit = () => {
    const n = clampSide(Number(text))
    setText(String(n))
    onCommit(n)
  }
  return (
    <input
      aria-label={label}
      inputMode="numeric"
      type="number"
      min={MIN_SIDE}
      max={MAX_SIDE}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className={cn(FIELD, "h-7 w-[4.5rem] px-2 text-[12.5px] tabular-nums")}
    />
  )
}

function SizeBar({ spec, state, set }: { spec: StudioSpec; state: StudioState; set: (p: Partial<StudioState>) => void }) {
  const ok = allowedSizes(spec)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="st-noscroll min-w-0 overflow-x-auto">
        <Seg
          label="Size"
          hideLabel
          nowrap
          value={state.size}
          onChange={(size) => set({ size })}
          options={SIZE_ORDER.map((o) => ({
            id: o.id,
            label: o.label,
            title: o.id === "custom" ? "Any size from 64 to 4096 px" : `${SIZES[o.id].w} × ${SIZES[o.id].h}`,
            disabled: o.id !== "custom" && !ok.includes(o.id),
          }))}
        />
      </div>
      {state.size === "custom" && (
        <div className="flex shrink-0 items-center gap-1.5 text-[12px] text-neutral-400">
          <DimInput label="Width in pixels" value={state.cw} onCommit={(cw) => set({ cw })} />
          ×
          <DimInput label="Height in pixels" value={state.ch} onCommit={(ch) => set({ ch })} />
        </div>
      )}
    </div>
  )
}

function Looks({ spec, values, onPick }: { spec: StudioSpec; values: Values; onPick: (id: string) => void }) {
  if (!spec.presets.length) return null
  const visual = !!(spec.draw || spec.svg)
  return (
    <section aria-label="Looks" className="flex flex-col gap-3 pb-5">
      <h3 className="px-0.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">Looks</h3>
      {visual ? (
        <div className="grid grid-cols-3 gap-2.5">
          {spec.presets.map((p) => {
            const active = samePreset(spec, values, p.values)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p.id)}
                aria-pressed={active}
                title={p.name}
                className="st-press group flex min-w-0 flex-col gap-1.5 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50"
              >
                <Thumb
                  spec={spec}
                  values={initialValues(spec, p.values)}
                  size="1:1"
                  edge={120}
                  className={cn("aspect-square w-full rounded-lg transition-shadow duration-300", active ? "shadow-[0_0_0_2px_rgb(23_23_23/0.85)] dark:shadow-[0_0_0_2px_rgb(255_255_255/0.85)]" : HAIR, "group-hover:shadow-[0_0_0_1px_rgb(0_0_0/0.25)] dark:group-hover:shadow-[0_0_0_1px_rgb(255_255_255/0.3)]")}
                />
                <span className={cn("truncate px-0.5 text-[12px]", active ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-500")}>{p.name}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {spec.presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              aria-pressed={samePreset(spec, values, p.values)}
              className={cn("st-press h-7 rounded-lg px-2.5 text-[12.5px] font-medium text-neutral-600 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 aria-pressed:bg-black/[0.06] aria-pressed:text-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:aria-pressed:bg-white/10 dark:aria-pressed:text-white", HAIR)}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function Panel({ spec, state, onChange, onPick, onReset }: { spec: StudioSpec; state: StudioState; onChange: (k: string, v: unknown) => void; onPick: (id: string) => void; onReset: () => void }) {
  return (
    <div className="px-5 pb-8 pt-5">
      <Looks spec={spec} values={state.values} onPick={onPick} />
      <div className="border-t border-black/[0.06] pt-5 dark:border-white/[0.08]">
        <ControlPanel spec={spec} values={state.values} onChange={onChange} />
      </div>
      <button
        type="button"
        onClick={onReset}
        className="st-press mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-neutral-500 outline-none hover:bg-black/[0.04] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:hover:bg-white/[0.06] dark:hover:text-white dark:focus-visible:ring-white/50"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </button>
    </div>
  )
}

function Rail({ specs, activeId, onPick }: { specs: StudioSpec[]; activeId: string; onPick: (id: string) => void }) {
  return (
    <nav aria-label="Pieces" className="st-scroll flex w-[232px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-black/[0.06] px-3 py-5 dark:border-white/[0.08]">
      {KIND_ORDER.map((k) => {
        const items = specs.filter((s) => s.kind === k.id)
        if (!items.length) return null
        return (
          <div key={k.id} className="flex flex-col gap-0.5">
            <h2 className="px-2 pb-1.5 text-[12px] font-medium text-neutral-400">{k.label}</h2>
            {items.map((s) => {
              const active = s.id === activeId
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => onPick(s.id)}
                  className={cn(
                    "st-press flex items-center gap-2.5 rounded-xl p-1.5 text-left text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50",
                    active ? "bg-black/[0.05] font-medium text-neutral-900 dark:bg-white/[0.08] dark:text-white" : "text-neutral-600 hover:bg-black/[0.03] dark:text-neutral-400 dark:hover:bg-white/[0.04]",
                  )}
                >
                  <Thumb spec={s} values={initialValues(s, s.presets[0]?.values)} size="1:1" edge={80} className={cn("size-9 shrink-0 rounded-lg", HAIR)} />
                  <span className="truncate">{s.name}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}

function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  useInertOutside(ref)
  React.useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>("button")?.focus()
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", key)
    return () => {
      window.removeEventListener("keydown", key)
      prev?.focus()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="st-fade absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Controls"
        className="st-sheet relative flex max-h-[78dvh] w-full flex-col rounded-t-3xl bg-white shadow-[0_-1px_0_rgb(0_0_0/0.06),0_-20px_50px_-20px_rgb(0_0_0/0.3)] dark:bg-neutral-900 dark:shadow-[0_-1px_0_rgb(255_255_255/0.1)]"
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <div className="mx-auto absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-black/15 dark:bg-white/20" aria-hidden />
          <h2 className="text-[14px] font-medium">Controls</h2>
          <IconButton label="Close controls" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="st-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}

/* ---------------------------------- page ---------------------------------- */

export default function StudioPage() {
  const [specs, setSpecs] = React.useState<StudioSpec[] | null>(null)
  const [state, setState] = React.useState<StudioState | null>(null)
  const [sheet, setSheet] = React.useState(false)
  const desktop = useMedia("(min-width: 1024px)")
  const [dark, toggleTheme] = useTheme()
  const stage = React.useRef<StageHandle | null>(null)
  const written = React.useRef("")
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let alive = true
    loadSpecs().then((s) => {
      if (!alive || !s.length) return
      setSpecs(s)
      setState(resolve(s, location.hash))
    })
    return () => {
      alive = false
    }
  }, [])

  // Paste a Studio link or press Back and the page follows the hash.
  React.useEffect(() => {
    if (!specs) return
    const on = () => {
      if (location.hash === written.current || !parseHash(location.hash)) return
      setState(resolve(specs, location.hash))
    }
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [specs])

  const spec = specs?.find((s) => s.id === state?.id) ?? null

  // Every look is a link: mirror the state to the hash, and remember the last look per piece.
  React.useEffect(() => {
    if (!spec || !state) return
    const next = buildHash(spec, state)
    written.current = next
    if (location.hash !== next) history.replaceState(null, "", next)
    try {
      localStorage.setItem(STORE + spec.id, JSON.stringify({ values: stripImages(spec, state.values), size: state.size, cw: state.cw, ch: state.ch }))
    } catch {
      /* storage can be blocked */
    }
  }, [spec, state])

  // The gallery shell stays mounted under this full-screen page: keep it out of the tab order and the reading order.
  useInertOutside(root, !!spec)

  const { w, h } = state ? dims(state) : { w: 1080, h: 1080 }
  const exporter = useExporter(spec ?? EMPTY_SPEC, state?.values ?? NO_VALUES, w, h, state ?? EMPTY_STATE, stage)

  const patch = React.useCallback((p: Partial<StudioState>) => setState((s) => (s ? { ...s, ...p } : s)), [])
  const change = React.useCallback((k: string, v: unknown) => setState((s) => (s ? { ...s, values: { ...s.values, [k]: v } } : s)), [])
  const pickPiece = React.useCallback(
    (id: string) => {
      const next = specs?.find((s) => s.id === id)
      if (next) setState(freshState(next))
    },
    [specs],
  )
  const pickLook = (id: string) => {
    if (!spec) return
    const p = spec.presets.find((x) => x.id === id)
    if (!p) return
    setState((s) => (s ? { ...s, values: { ...initialValues(spec, p.values), ...imagesOf(spec, s.values) }, size: p.size && allowedSizes(spec).includes(p.size) ? p.size : s.size } : s))
  }
  const reset = () => {
    if (!spec) return
    const active = spec.presets.find((p) => samePreset(spec, state!.values, p.values)) ?? spec.presets[0]
    setState((s) => (s ? { ...s, values: initialValues(spec, active?.values) } : s))
  }

  if (!specs || !state || !spec) {
    return (
      <div className="st-root fixed inset-0 z-40 grid place-items-center bg-white text-[13px] text-neutral-400 dark:bg-neutral-950">
        <style>{STUDIO_CSS}</style>
        Loading Studio
      </div>
    )
  }

  const panel = <Panel spec={spec} state={state} onChange={change} onPick={pickLook} onReset={reset} />

  return (
    <div ref={root} className="st-root fixed inset-0 z-40 flex flex-col bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
      <style>{STUDIO_CSS}</style>
      <header className="flex shrink-0 flex-col border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-5">
          <a href="#/" className="st-press flex items-center gap-2 rounded-lg text-[14px] font-semibold tracking-[-0.01em] outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50">
            Pane
            <span className="font-normal text-neutral-400">/</span>
            <span className="font-medium">Studio</span>
          </a>
          <span className="hidden truncate text-[13px] text-neutral-400 sm:block">{spec.name}</span>
          {desktop && (
            <div className="ml-auto min-w-0">
              <SizeBar spec={spec} state={state} set={patch} />
            </div>
          )}
          <div className={cn("flex items-center gap-1.5", desktop ? "" : "ml-auto")}>
            <IconButton label={dark ? "Switch to light" : "Switch to dark"} onClick={toggleTheme}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
            <ExportMenu spec={spec} ex={exporter} w={w} h={h} />
          </div>
        </div>
        {!desktop && (
          <div className="flex flex-col gap-2 px-4 pb-3">
            <div className="st-noscroll -mx-4 overflow-x-auto px-4">
              <div className="flex w-max gap-1.5" role="group" aria-label="Pieces">
                {specs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={s.id === spec.id}
                    ref={(el) => {
                      if (el && s.id === spec.id) el.scrollIntoView({ inline: "center", block: "nearest" })
                    }}
                    onClick={() => pickPiece(s.id)}
                    className={cn("st-press h-8 shrink-0 rounded-full px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40", s.id === spec.id ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : cn("text-neutral-600 dark:text-neutral-400", HAIR))}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="st-noscroll -mx-4 overflow-x-auto px-4">
              <SizeBar spec={spec} state={state} set={patch} />
            </div>
          </div>
        )}
      </header>
      <div className="flex min-h-0 flex-1">
        {desktop && <Rail specs={specs} activeId={spec.id} onPick={pickPiece} />}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <Stage key={spec.id} spec={spec} values={state.values} w={w} h={h} handleRef={stage} status={<StatusLine ex={exporter} />} compact={!desktop} />
          {!desktop && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[3.75rem] flex justify-center">
              <button
                type="button"
                onClick={() => setSheet(true)}
                className={cn("st-press pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_8px_24px_-8px_rgb(0_0_0/0.25)] outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:bg-neutral-900 dark:text-white dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_8px_24px_-8px_rgb(0_0_0/0.7)]")}
              >
                <SlidersHorizontal className="size-4" />
                Adjust
              </button>
            </div>
          )}
        </main>
        {desktop && (
          <aside aria-label="Controls" className="st-scroll w-[288px] shrink-0 overflow-y-auto border-l border-black/[0.06] dark:border-white/[0.08]">
            {panel}
          </aside>
        )}
      </div>
      {!desktop && sheet && <Sheet onClose={() => setSheet(false)}>{panel}</Sheet>}
    </div>
  )
}

function imagesOf(spec: StudioSpec, v: Values): Values {
  const out: Values = {}
  for (const c of spec.controls) if (c.type === "image" && v[c.key] !== undefined) out[c.key] = v[c.key]
  return out
}

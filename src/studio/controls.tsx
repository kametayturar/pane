// Renders every Control type from a spec's schema. No per-piece UI code.
import * as React from "react"
import { Dices, ImagePlus, Minus, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { PALETTES, visibleControls } from "./registry"
import type { Control, StudioSpec, Values } from "./schema"
import { FIELD, HAIR, IconButton, Seg, Switch } from "./ui"

const GROUPS = ["Content", "Shape", "Colour", "Motion", "Grain & finish"] as const

const toHex = (c: unknown) => {
  const s = String(c ?? "").trim()
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase()
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s)
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`.toLowerCase() : "#000000"
}

const clampNum = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function Row({ id, label, children, value }: { id: string; label: string; children: React.ReactNode; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="px-0.5 text-[12px] font-medium text-neutral-400">
          {label}
        </label>
        {value}
      </div>
      {children}
    </div>
  )
}

function RangeControl({ c, v, set, id }: { c: Extract<Control, { type: "range" }>; v: number; set: (n: number) => void; id: string }) {
  const step = c.step ?? 1
  const decimals = (String(step).split(".")[1] ?? "").length
  const p = ((v - c.min) / (c.max - c.min || 1)) * 100
  return (
    <Row
      id={id}
      label={c.label}
      value={
        <div className="flex items-center gap-1">
          <input
            aria-label={`${c.label}, number`}
            type="number"
            min={c.min}
            max={c.max}
            step={step}
            value={Number.isFinite(v) ? Number(v.toFixed(decimals + 1)) : c.default}
            onChange={(e) => e.target.value !== "" && set(clampNum(Number(e.target.value), c.min, c.max))}
            className="h-6 w-14 rounded-md bg-transparent px-1.5 text-right text-[12px] tabular-nums text-neutral-600 outline-none transition-shadow duration-200 hover:bg-black/[0.04] focus-visible:bg-black/[0.05] focus-visible:shadow-[0_0_0_1.5px_rgb(0_0_0/0.45)] dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.08] dark:focus-visible:shadow-[0_0_0_1.5px_rgb(255_255_255/0.55)]"
          />
          {c.unit && <span className="text-[12px] text-neutral-400">{c.unit}</span>}
        </div>
      }
    >
      <input
        id={id}
        type="range"
        className="st-range text-neutral-900 dark:text-neutral-100"
        style={{ "--p": `${p}%` } as React.CSSProperties}
        min={c.min}
        max={c.max}
        step={step}
        value={v}
        onChange={(e) => set(Number(e.target.value))}
      />
    </Row>
  )
}

function Swatch({ color, selected, label, onPick }: { color: string; selected: boolean; label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={color}
      onClick={onPick}
      className={cn(
        "st-press size-[22px] shrink-0 rounded-full outline-none shadow-[inset_0_0_0_1px_rgb(0_0_0/0.14)] hover:scale-110 focus-visible:ring-2 focus-visible:ring-neutral-900/50 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] dark:focus-visible:ring-white/60",
        selected && "ring-2 ring-neutral-900/80 ring-offset-2 ring-offset-white dark:ring-white/85 dark:ring-offset-neutral-950",
      )}
      style={{ background: color }}
    />
  )
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  return (
    <input
      type="color"
      aria-label={label}
      value={toHex(value)}
      onChange={(e) => onChange(e.target.value)}
      className="st-swatch size-[22px] shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.14)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)]"
    />
  )
}

function ColorControl({ c, v, set, id }: { c: Extract<Control, { type: "color" }>; v: string; set: (s: string) => void; id: string }) {
  const sw = c.swatches ?? []
  const cur = toHex(v)
  return (
    <Row id={id} label={c.label} value={<span className="text-[12px] tabular-nums text-neutral-400">{cur}</span>}>
      <div className="flex flex-wrap items-center gap-2 px-0.5 py-1" role="radiogroup" aria-label={c.label}>
        {sw.map((s) => (
          <Swatch key={s} color={s} label={s} selected={toHex(s) === cur} onPick={() => set(s)} />
        ))}
        <ColorInput value={v} label={`${c.label}, custom colour`} onChange={set} />
      </div>
    </Row>
  )
}

function PaletteControl({ c, v, set, id }: { c: Extract<Control, { type: "palette" }>; v: string[]; set: (s: string[]) => void; id: string }) {
  const min = c.min ?? 2
  const max = c.max ?? 6
  const stops = v.length ? v : c.default
  const grad = `linear-gradient(90deg, ${stops.map(toHex).join(", ")})`
  return (
    <Row id={id} label={c.label}>
      <div className="flex flex-col gap-2.5">
        <div className="h-5 rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]" style={{ background: grad }} />
        <div className="flex items-center gap-2 px-0.5" role="group" aria-label={`${c.label} stops`}>
          {stops.map((s, i) => (
            <ColorInput key={i} value={s} label={`Stop ${i + 1} of ${stops.length}`} onChange={(n) => set(stops.map((x, j) => (j === i ? n : x)))} />
          ))}
          <div className="ml-auto flex gap-0.5">
            <IconButton label="Remove last stop" className="size-6" disabled={stops.length <= min} onClick={() => set(stops.slice(0, -1))}>
              <Minus className="size-3.5" />
            </IconButton>
            <IconButton
              label="Add a stop"
              className="size-6"
              disabled={stops.length >= max}
              onClick={() => set([...stops, stops[stops.length - 1]])}
            >
              <Plus className="size-3.5" />
            </IconButton>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Curated palettes">
          {PALETTES.map((p) => {
            const n = clampNum(stops.length, min, max)
            const pick = n >= p.stops.length ? p.stops : Array.from({ length: n }, (_, i) => p.stops[Math.round((i * (p.stops.length - 1)) / Math.max(1, n - 1))])
            return (
              <button
                key={p.id}
                type="button"
                title={p.id[0].toUpperCase() + p.id.slice(1)}
                aria-label={`Use the ${p.id} palette`}
                onClick={() => set(pick)}
                className="st-press h-5 w-9 rounded-md shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-neutral-900/50 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] dark:focus-visible:ring-white/60"
                style={{ background: `linear-gradient(90deg, ${p.stops.join(", ")})` }}
              />
            )
          })}
        </div>
      </div>
    </Row>
  )
}

function AngleControl({ c, v, set, id }: { c: Extract<Control, { type: "angle" }>; v: number; set: (n: number) => void; id: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const from = (e: { clientX: number; clientY: number }) => {
    const r = ref.current!.getBoundingClientRect()
    const a = (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI
    set(Math.round((a + 360) % 360))
  }
  return (
    <Row
      id={id}
      label={c.label}
      value={
        <div className="flex items-center gap-1">
          <input
            aria-label={`${c.label}, degrees`}
            type="number"
            min={0}
            max={360}
            value={Math.round(v)}
            onChange={(e) => e.target.value !== "" && set(((Number(e.target.value) % 360) + 360) % 360)}
            className="h-6 w-14 rounded-md bg-transparent px-1.5 text-right text-[12px] tabular-nums text-neutral-600 outline-none transition-shadow duration-200 hover:bg-black/[0.04] focus-visible:bg-black/[0.05] focus-visible:shadow-[0_0_0_1.5px_rgb(0_0_0/0.45)] dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.08] dark:focus-visible:shadow-[0_0_0_1.5px_rgb(255_255_255/0.55)]"
          />
          <span className="text-[12px] text-neutral-400">°</span>
        </div>
      }
    >
      <div
        id={id}
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={c.label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(v)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          from(e)
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && from(e)}
        onKeyDown={(e) => {
          const d = e.shiftKey ? 15 : 3
          if (e.key === "ArrowRight" || e.key === "ArrowUp") (e.preventDefault(), set((v + d) % 360))
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") (e.preventDefault(), set((v - d + 360) % 360))
        }}
        className={cn("relative size-14 cursor-grab touch-none self-start rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/50 active:cursor-grabbing dark:focus-visible:ring-white/60", HAIR)}
      >
        <div className="absolute inset-0" style={{ transform: `rotate(${v}deg)` }}>
          <div className="absolute left-1/2 top-1/2 h-px w-[22px] bg-neutral-900 dark:bg-white" />
          <div className="absolute left-[calc(50%+19px)] top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-neutral-900 dark:bg-white" />
        </div>
        <div className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400" />
      </div>
    </Row>
  )
}

function ImageControl({ c, v, set, id }: { c: Extract<Control, { type: "image" }>; v: string; set: (s: string) => void; id: string }) {
  const input = React.useRef<HTMLInputElement>(null)
  return (
    <Row id={id} label={c.label}>
      <input
        ref={input}
        id={id}
        type="file"
        accept={c.accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          if (v?.startsWith("blob:")) URL.revokeObjectURL(v)
          set(URL.createObjectURL(f))
          e.target.value = ""
        }}
      />
      <div className="flex items-center gap-2">
        {v ? <img src={v} alt="" className={cn("size-10 rounded-lg object-cover", HAIR)} /> : null}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn("st-press inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-neutral-700 outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:text-neutral-300 dark:hover:bg-white/[0.06]", HAIR)}
        >
          <ImagePlus className="size-3.5" />
          {v ? "Replace" : "Choose image"}
        </button>
        {v && (
          <IconButton
            label="Remove image"
            onClick={() => {
              if (v.startsWith("blob:")) URL.revokeObjectURL(v)
              set("")
            }}
          >
            <X className="size-3.5" />
          </IconButton>
        )}
      </div>
      <p className="px-0.5 text-[12px] text-neutral-400">Stays on this device. Nothing is uploaded.</p>
    </Row>
  )
}

function One({ c, values, onChange }: { c: Control; values: Values; onChange: (key: string, value: unknown) => void }) {
  const uid = React.useId()
  const id = `${uid}-${c.key}`
  const set = (x: unknown) => onChange(c.key, x)
  const val = values[c.key]
  switch (c.type) {
    case "range":
      return <RangeControl c={c} id={id} v={typeof val === "number" ? val : c.default} set={set} />
    case "color":
      return <ColorControl c={c} id={id} v={typeof val === "string" ? val : c.default} set={set} />
    case "palette":
      return <PaletteControl c={c} id={id} v={Array.isArray(val) ? (val as string[]) : c.default} set={set} />
    case "segmented":
      return <Seg label={c.label} value={String(val ?? c.default)} options={c.options} onChange={set} />
    case "select":
      return (
        <Row id={id} label={c.label}>
          <select id={id} value={String(val ?? c.default)} onChange={(e) => set(e.target.value)} className={cn(FIELD, "w-full cursor-pointer bg-white pr-6 dark:bg-neutral-950")}>
            {c.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>
      )
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={id} className="px-0.5 text-[13px] text-neutral-700 dark:text-neutral-300">
            {c.label}
          </label>
          <Switch id={id} label={c.label} checked={val === true} onChange={set} />
        </div>
      )
    case "text":
      return (
        <Row id={id} label={c.label}>
          <input id={id} type="text" maxLength={c.max} value={String(val ?? c.default)} onChange={(e) => set(e.target.value)} className={cn(FIELD, "w-full")} />
        </Row>
      )
    case "seed":
      return (
        <Row id={id} label={c.label}>
          <div className="flex items-center gap-1.5">
            <input
              id={id}
              type="number"
              min={0}
              max={99999}
              value={Number(val ?? c.default)}
              onChange={(e) => e.target.value !== "" && set(clampNum(Math.round(Number(e.target.value)), 0, 99999))}
              className={cn(FIELD, "w-24 tabular-nums")}
            />
            <IconButton label="Roll a new seed" className={cn(HAIR, "size-8")} onClick={() => set(1 + Math.floor(Math.random() * 9999))}>
              <Dices className="size-4" />
            </IconButton>
          </div>
        </Row>
      )
    case "angle":
      return <AngleControl c={c} id={id} v={typeof val === "number" ? val : c.default} set={set} />
    case "image":
      return <ImageControl c={c} id={id} v={typeof val === "string" ? val : ""} set={set} />
  }
}

export function ControlPanel({ spec, values, onChange }: { spec: StudioSpec; values: Values; onChange: (key: string, value: unknown) => void }) {
  const visible = visibleControls(spec, values)
  const named = GROUPS.map((g) => ({ g: g as string, items: visible.filter((c) => c.group === g) }))
  const loose = visible.filter((c) => !c.group || !(GROUPS as readonly string[]).includes(c.group))
  const sections = [{ g: "", items: loose }, ...named].filter((s) => s.items.length)
  if (!sections.length) return <p className="text-[13px] text-neutral-400">This piece has no controls.</p>
  return (
    <div className="flex flex-col">
      {sections.map((s, i) => (
        <section key={s.g || "general"} className={cn("flex flex-col gap-4 py-5", i > 0 && "border-t border-black/[0.06] dark:border-white/[0.08]", i === 0 && "pt-1")} aria-label={s.g || "Controls"}>
          {s.g && <h3 className="px-0.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{s.g}</h3>}
          {s.items.map((c) => (
            <One key={c.key} c={c} values={values} onChange={onChange} />
          ))}
        </section>
      ))}
    </div>
  )
}

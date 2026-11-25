// Landing Builder: the editor generated from a section's field schema.
import * as React from "react"
import { ArrowDown, ArrowUp, ChevronRight, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { FIELD, HAIR, IconButton, Seg, Switch } from "@/studio/ui"
import { blankFrom, clone, getIn, itemSummary, type Content, type Field, type Path } from "./schema"

type Change = (path: Path, value: unknown, coalesce?: boolean) => void

const LABEL = "px-0.5 text-[12px] font-medium text-neutral-500 dark:text-neutral-400"
const HELP = "px-0.5 text-[12px] leading-[18px] text-neutral-400 dark:text-neutral-500"
const SUB = "flex min-w-0 flex-col gap-1.5"

const domId = (base: string, path: Path) => `${base}-${path.join("-")}`.replace(/[^\w-]/g, "_")

export function FieldsEditor({ fields, value, onChange, idBase }: { fields: Field[]; value: Content; onChange: Change; idBase: string }) {
  return <Fields fields={fields} value={value} path={[]} onChange={onChange} idBase={idBase} depth={0} />
}

function Fields({ fields, value, path, onChange, idBase, depth }: { fields: Field[]; value: unknown; path: Path; onChange: Change; idBase: string; depth: number }) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((f) => (
        <FieldRow key={String(f.key)} field={f} value={getIn(value, [f.key])} path={[...path, f.key]} onChange={onChange} idBase={idBase} depth={depth} />
      ))}
    </div>
  )
}

function Help({ text }: { text?: string }) {
  return text ? <p className={HELP}>{text}</p> : null
}

function TextInput({ id, value, onChange, multiline, label, placeholder }: { id: string; value: string; onChange: (v: string) => void; multiline?: boolean; label?: string; placeholder?: string }) {
  if (multiline)
    return (
      <textarea
        id={id}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className={cn(FIELD, "h-auto min-h-[60px] w-full resize-y py-1.5 leading-[20px] [field-sizing:content]")}
      />
    )
  return <input id={id} aria-label={label} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cn(FIELD, "w-full min-w-0")} />
}

function FieldRow({ field: f, value, path, onChange, idBase, depth }: { field: Field; value: unknown; path: Path; onChange: Change; idBase: string; depth: number }) {
  const id = domId(idBase, path)
  const set = (v: unknown, coalesce = true) => onChange(path, v, coalesce)

  switch (f.type) {
    case "text":
    case "textarea":
      return (
        <div className={SUB}>
          <label htmlFor={id} className={LABEL}>
            {f.label}
          </label>
          <TextInput id={id} value={typeof value === "string" ? value : ""} onChange={set} multiline={f.type === "textarea"} />
          <Help text={f.help} />
        </div>
      )
    case "numtext":
      return (
        <div className={SUB}>
          <label htmlFor={id} className={LABEL}>
            {f.label}
          </label>
          <input
            id={id}
            value={value === undefined || value === null ? "" : String(value)}
            inputMode="decimal"
            onChange={(e) => {
              const t = e.target.value
              set(/^\d+(\.\d+)?$/.test(t.trim()) ? Number(t.trim()) : t)
            }}
            className={cn(FIELD, "w-full tabular-nums")}
          />
          <Help text={f.help} />
        </div>
      )
    case "number":
      return (
        <div className={SUB}>
          <label htmlFor={id} className={LABEL}>
            {f.label}
          </label>
          <input
            id={id}
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) => e.target.value !== "" && Number.isFinite(Number(e.target.value)) && set(Number(e.target.value))}
            className={cn(FIELD, "w-32 tabular-nums")}
          />
          <Help text={f.help} />
        </div>
      )
    case "switch":
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={id} className="px-0.5 text-[13px] text-neutral-700 dark:text-neutral-300">
              {f.label}
            </label>
            <Switch id={id} checked={value === true} onChange={(v) => set(v, false)} label={f.label} />
          </div>
          <Help text={f.help} />
        </div>
      )
    case "choice": {
      const idx = Math.max(0, f.options.findIndex((o) => o.value === (value ?? null)))
      return (
        <div className="flex flex-col gap-1">
          <Seg label={f.label} value={idx} onChange={(i) => set(f.options[i].value, false)} options={f.options.map((o, i) => ({ id: i, label: o.label }))} />
          <Help text={f.help} />
        </div>
      )
    }
    case "select":
      return (
        <div className={SUB}>
          <label htmlFor={id} className={LABEL}>
            {f.label}
          </label>
          <select id={id} value={String(value ?? "")} onChange={(e) => set(f.options.find((o) => String(o.value) === e.target.value)?.value ?? e.target.value, false)} className={cn(FIELD, "w-full appearance-auto pr-1 dark:bg-neutral-900")}>
            {f.options.map((o) => (
              <option key={String(o.value)} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
          <Help text={f.help} />
        </div>
      )
    case "link": {
      const on = value !== null && value !== undefined
      const link = (on ? value : f.template) as { label: string; href: string }
      return (
        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <legend className={LABEL}>{f.label}</legend>
            {f.nullable && <Switch checked={on} onChange={(v) => set(v ? clone(f.template) : null, false)} label={`Show ${f.label.toLowerCase()}`} />}
          </div>
          {on && (
            <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-1.5">
              <TextInput id={`${id}-label`} label={`${f.label} text`} placeholder="Text" value={link.label ?? ""} onChange={(v) => onChange([...path, "label"], v, true)} />
              <TextInput id={`${id}-href`} label={`${f.label} address`} placeholder="/path or #section" value={link.href ?? ""} onChange={(v) => onChange([...path, "href"], v, true)} />
            </div>
          )}
          <Help text={f.help} />
        </fieldset>
      )
    }
    case "tuple": {
      const arr = Array.isArray(value) ? (value as unknown[]) : []
      return (
        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className={cn(LABEL, "mb-1.5")}>{f.label}</legend>
          {f.itemLabels.map((l, i) => (
            <TextInput
              key={i}
              id={`${id}-${i}`}
              label={l}
              placeholder={l}
              value={typeof arr[i] === "string" ? (arr[i] as string) : ""}
              onChange={(v) => {
                const next = f.itemLabels.map((_, j) => (j === i ? v : typeof arr[j] === "string" ? arr[j] : ""))
                set(next)
              }}
            />
          ))}
          <Help text={f.help} />
        </fieldset>
      )
    }
    case "list":
      return <ListField field={f} value={value} path={path} onChange={onChange} id={id} />
    case "repeat":
      return <RepeatField field={f} value={value} path={path} onChange={onChange} idBase={idBase} id={id} depth={depth} />
    case "group":
      return <GroupField field={f} value={value} path={path} onChange={onChange} idBase={idBase} id={id} depth={depth} />
  }
}

/* ---------------------------------- lists --------------------------------- */

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  return next
}

function ItemTools({ i, n, noun, onMove, onRemove }: { i: number; n: number; noun: string; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center">
      <IconButton label={`Move ${noun} ${i + 1} up`} disabled={i === 0} onClick={() => onMove(i - 1)} className="size-7">
        <ArrowUp className="size-3.5" />
      </IconButton>
      <IconButton label={`Move ${noun} ${i + 1} down`} disabled={i === n - 1} onClick={() => onMove(i + 1)} className="size-7">
        <ArrowDown className="size-3.5" />
      </IconButton>
      <IconButton label={`Remove ${noun} ${i + 1}`} onClick={onRemove} className="size-7">
        <X className="size-3.5" />
      </IconButton>
    </div>
  )
}

function AddButton({ noun, onClick, disabled }: { noun: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="st-press inline-flex h-8 items-center gap-1.5 self-start rounded-lg px-2 text-[12.5px] font-medium text-neutral-500 outline-none hover:bg-black/[0.04] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/[0.06] dark:hover:text-white dark:focus-visible:ring-white/50"
    >
      <Plus className="size-3.5" />
      Add {noun}
    </button>
  )
}

function ListField({ field: f, value, path, onChange, id }: { field: Extract<Field, { type: "list" }>; value: unknown; path: Path; onChange: Change; id: string }) {
  const items = Array.isArray(value) ? (value as string[]) : []
  const full = f.max !== undefined && items.length >= f.max
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className={cn(LABEL, "mb-1.5")}>{f.label}</legend>
      {items.map((it, i) => (
        <div key={i} className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <TextInput id={`${id}-${i}`} label={`${f.label}, ${f.item} ${i + 1}`} value={it} multiline={f.long} onChange={(v) => onChange([...path, i], v, true)} />
          </div>
          <ItemTools i={i} n={items.length} noun={f.item} onMove={(to) => onChange(path, move(items, i, to))} onRemove={() => onChange(path, items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddButton noun={f.item} disabled={full} onClick={() => onChange(path, [...items, ""])} />
      <Help text={f.help} />
    </fieldset>
  )
}

function Disclosure({ id, title, summary, open, onToggle, tools, children }: { id: string; title: string; summary?: string; open: boolean; onToggle: () => void; tools?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl", HAIR)}>
      <div className="flex min-w-0 items-center gap-1 pr-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={onToggle}
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl pl-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50"
        >
          <ChevronRight className={cn("size-3.5 shrink-0 text-neutral-400 transition-transform duration-200 [transition-timing-function:cubic-bezier(.22,1,.36,1)]", open && "rotate-90")} />
          <span className="shrink-0 text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{title}</span>
          {summary && <span className="min-w-0 truncate text-[12.5px] text-neutral-400">{summary}</span>}
        </button>
        {tools}
      </div>
      <div id={`${id}-body`} hidden={!open} className="px-3 pb-3.5 pt-1">
        {open && children}
      </div>
    </div>
  )
}

function RepeatField({ field: f, value, path, onChange, idBase, id, depth }: { field: Extract<Field, { type: "repeat" }>; value: unknown; path: Path; onChange: Change; idBase: string; id: string; depth: number }) {
  const items = Array.isArray(value) ? (value as unknown[]) : []
  const [open, setOpen] = React.useState<number | null>(null)
  const full = f.max !== undefined && items.length >= f.max
  const noun = f.item
  const title = noun.charAt(0).toUpperCase() + noun.slice(1)
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className={cn(LABEL, "mb-1.5")}>{f.label}</legend>
      {items.map((it, i) => (
        <Disclosure
          key={i}
          id={`${id}-${i}`}
          title={`${title} ${i + 1}`}
          summary={itemSummary(it)}
          open={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
          tools={
            <ItemTools
              i={i}
              n={items.length}
              noun={noun}
              onMove={(to) => {
                onChange(path, move(items, i, to))
                if (open === i) setOpen(to)
              }}
              onRemove={() => {
                onChange(path, items.filter((_, j) => j !== i))
                setOpen(null)
              }}
            />
          }
        >
          <Fields fields={f.fields} value={it} path={[...path, i]} onChange={onChange} idBase={idBase} depth={depth + 1} />
        </Disclosure>
      ))}
      <AddButton
        noun={noun}
        disabled={full}
        onClick={() => {
          const sample = items.length ? blankFrom(items[items.length - 1]) : clone(f.template)
          onChange(path, [...items, sample])
          setOpen(items.length)
        }}
      />
      <Help text={f.help} />
    </fieldset>
  )
}

function GroupField({ field: f, value, path, onChange, idBase, id, depth }: { field: Extract<Field, { type: "group" }>; value: unknown; path: Path; onChange: Change; idBase: string; id: string; depth: number }) {
  const on = value !== null && value !== undefined
  const [open, setOpen] = React.useState(f.fields.length <= 3 && depth === 0)
  if (f.nullable && !on)
    return (
      <div className="flex items-center justify-between gap-3">
        <span className={LABEL}>{f.label}</span>
        <Switch checked={false} onChange={() => onChange(path, clone(f.template), false)} label={`Show ${f.label.toLowerCase()}`} />
      </div>
    )
  return (
    <Disclosure
      id={id}
      title={f.label}
      open={open}
      onToggle={() => setOpen((o) => !o)}
      tools={f.nullable ? <Switch checked onChange={() => onChange(path, null, false)} label={`Show ${f.label.toLowerCase()}`} /> : undefined}
    >
      <Fields fields={f.fields} value={value} path={path} onChange={onChange} idBase={idBase} depth={depth + 1} />
    </Disclosure>
  )
}

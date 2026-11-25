// Landing Builder: the page outline. A real ordered list; each row can be dragged by its handle, or moved from the
// keyboard (Space on the handle picks it up, arrows move, Space drops, Escape puts it back; Alt+arrows move at once).
import * as React from "react"
import { Copy, Eye, EyeOff, GripVertical, Palette, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { IconButton } from "@/studio/ui"
import type { SectionInstance, Registry } from "./doc"
import { SECTIONS } from "./sections"
import { itemSummary } from "./schema"

type Props = {
  sections: SectionInstance[]
  reg: Registry
  selectedId: string | null
  onSelect: (id: string | null) => void
  onToggleHidden: (id: string) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  /** Commit a new order (one undo step). */
  onOrder: (ids: string[]) => void
  onAdd: (slug: string) => void
  announce: (msg: string) => void
  touch?: boolean
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  return next
}

const ROW_FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 dark:focus-visible:ring-white/50"

function summaryOf(s: SectionInstance): string {
  const c = s.content
  for (const k of ["headline", "title", "description", "brand"]) {
    const v = c[k]
    if (Array.isArray(v) && typeof v[0] === "string" && v[0]) return v[0]
    if (typeof v === "string" && v.trim()) return v.replace(/\n/g, " ")
  }
  for (const v of Object.values(c)) if (Array.isArray(v) && v[0] && typeof v[0] === "object") return itemSummary(v[0])
  return itemSummary(c)
}

export function Outline({ sections, reg, selectedId, onSelect, onToggleHidden, onRemove, onDuplicate, onOrder, onAdd, announce, touch }: Props) {
  // While dragging or carrying a row from the keyboard, the list shows a local order; it is committed on drop.
  const [order, setOrder] = React.useState<string[] | null>(null)
  const [grabbed, setGrabbed] = React.useState<string | null>(null)
  const [drag, setDrag] = React.useState<{ id: string; dy: number } | null>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const rowRefs = React.useRef(new Map<string, HTMLLIElement>())
  const handleRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const prevTops = React.useRef(new Map<string, number>())
  // React may move the focused row in the DOM while it is carried; that blur must not cancel the move.
  const moving = React.useRef(false)
  const byId = new Map(sections.map((s) => [s.id, s]))
  const ids = order ?? sections.map((s) => s.id)
  const rows = ids.map((id) => byId.get(id)).filter((s): s is SectionInstance => !!s)
  const nameOf = (s: SectionInstance) => reg.get(s.slug)?.name ?? s.slug

  // FLIP: rows that change place glide to it instead of jumping.
  React.useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    for (const [id, el] of rowRefs.current) {
      const top = el.offsetTop
      const prev = prevTops.current.get(id)
      prevTops.current.set(id, top)
      if (reduce || prev === undefined || prev === top || id === drag?.id) continue
      el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "translateY(0)" }], { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" })
    }
  })

  /* ------------------------------ pointer drag ------------------------------ */

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget as HTMLElement
    handle.setPointerCapture(e.pointerId)
    const start = sections.map((s) => s.id)
    const els = start.map((x) => rowRefs.current.get(x)!)
    const tops = els.map((el) => el.getBoundingClientRect().top)
    const heights = els.map((el) => el.getBoundingClientRect().height)
    const from = start.indexOf(id)
    const y0 = e.clientY
    let current = start
    setOrder(start)
    setDrag({ id, dy: 0 })
    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - y0
      const center = tops[from] + heights[from] / 2 + dy
      let to = 0
      for (let i = 0; i < start.length; i++) if (i !== from && tops[i] + heights[i] / 2 < center) to++
      const next = move(start, from, to)
      // Offset from the row's new resting place, so it stays under the pointer.
      const restTop = next.slice(0, to).reduce((acc, x) => acc + heights[start.indexOf(x)] + 2, tops[0])
      if (next.join() !== current.join()) {
        current = next
        setOrder(next)
      }
      setDrag({ id, dy: tops[from] + dy - restTop })
    }
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove)
      handle.removeEventListener("pointerup", onUp)
      handle.removeEventListener("pointercancel", onUp)
      setDrag(null)
      setOrder(null)
      if (current.join() !== start.join()) {
        onOrder(current)
        const s = byId.get(id)
        if (s) announce(`${nameOf(s)} moved to position ${current.indexOf(id) + 1} of ${current.length}.`)
      }
    }
    handle.addEventListener("pointermove", onMove)
    handle.addEventListener("pointerup", onUp)
    handle.addEventListener("pointercancel", onUp)
  }

  /* ---------------------------- keyboard reorder ---------------------------- */

  const moveNow = (id: string, delta: number) => {
    const cur = sections.map((s) => s.id)
    const from = cur.indexOf(id)
    const to = Math.max(0, Math.min(cur.length - 1, from + delta))
    if (to === from) return
    onOrder(move(cur, from, to))
    const s = byId.get(id)
    if (s) announce(`${nameOf(s)} moved to position ${to + 1} of ${cur.length}.`)
    requestAnimationFrame(() => handleRefs.current.get(id)?.focus())
  }

  const onHandleKey = (e: React.KeyboardEvent, s: SectionInstance) => {
    const name = nameOf(s)
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      if (grabbed === s.id) {
        const final = order ?? sections.map((x) => x.id)
        setGrabbed(null)
        setOrder(null)
        if (final.join() !== sections.map((x) => x.id).join()) onOrder(final)
        announce(`${name} dropped at position ${final.indexOf(s.id) + 1} of ${final.length}.`)
      } else {
        setGrabbed(s.id)
        setOrder(sections.map((x) => x.id))
        announce(`${name} picked up, position ${sections.findIndex((x) => x.id === s.id) + 1} of ${sections.length}. Use the up and down arrows to move it, Space to drop, Escape to cancel.`)
      }
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && grabbed === s.id) {
      e.preventDefault()
      const cur = order ?? sections.map((x) => x.id)
      const from = cur.indexOf(s.id)
      const to = Math.max(0, Math.min(cur.length - 1, from + (e.key === "ArrowUp" ? -1 : 1)))
      if (to !== from) {
        moving.current = true
        setOrder(move(cur, from, to))
        announce(`${name}, position ${to + 1} of ${cur.length}.`)
      }
    } else if (e.key === "Escape" && grabbed === s.id) {
      e.preventDefault()
      e.stopPropagation()
      setGrabbed(null)
      setOrder(null)
      announce(`Move cancelled. ${name} is back at position ${sections.findIndex((x) => x.id === s.id) + 1}.`)
    }
  }

  React.useEffect(() => {
    if (!grabbed) return
    requestAnimationFrame(() => {
      handleRefs.current.get(grabbed)?.focus()
      moving.current = false
    })
  }, [order, grabbed])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">Page</h2>
        <span className="text-[12px] tabular-nums text-neutral-400">
          {sections.filter((s) => !s.hidden).length} of {sections.length} shown
        </span>
      </div>
      <div className="st-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-current={selectedId === null ? "true" : undefined}
          className={cn(
            "st-press mb-1 flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[13px]",
            ROW_FOCUS,
            selectedId === null ? "bg-black/[0.05] font-medium text-neutral-900 dark:bg-white/[0.08] dark:text-white" : "text-neutral-600 hover:bg-black/[0.03] dark:text-neutral-400 dark:hover:bg-white/[0.04]",
          )}
        >
          <Palette className="size-4 text-neutral-400" />
          Brand
        </button>
        <ol ref={listRef} aria-label="Page sections" className="flex flex-col gap-0.5">
          {rows.map((s, i) => {
            const sel = s.id === selectedId
            const name = nameOf(s)
            const isDrag = drag?.id === s.id
            const isGrab = grabbed === s.id
            return (
              <li
                key={s.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(s.id, el)
                  else rowRefs.current.delete(s.id)
                }}
                data-outline-id={s.id}
                className={cn(
                  "group relative flex min-h-[48px] items-center gap-0.5 rounded-xl pr-1",
                  sel ? "bg-black/[0.05] dark:bg-white/[0.08]" : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                  (isDrag || isGrab) && "z-10 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_10px_24px_-10px_rgb(0_0_0/0.3)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_10px_24px_-10px_rgb(0_0_0/0.8)]",
                )}
                style={isDrag ? { transform: `translateY(${drag.dy}px)` } : undefined}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) handleRefs.current.set(s.id, el)
                    else handleRefs.current.delete(s.id)
                  }}
                  aria-label={`Reorder ${name}, position ${i + 1} of ${rows.length}`}
                  aria-describedby="lb-reorder-help"
                  aria-pressed={isGrab}
                  onPointerDown={(e) => startDrag(e, s.id)}
                  onKeyDown={(e) => onHandleKey(e, s)}
                  onBlur={() => {
                    if (grabbed === s.id && !moving.current) {
                      setGrabbed(null)
                      setOrder(null)
                    }
                  }}
                  className={cn("grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-neutral-300 hover:text-neutral-600 active:cursor-grabbing dark:text-neutral-600 dark:hover:text-neutral-300", ROW_FOCUS, isGrab && "text-neutral-900 dark:text-white")}
                >
                  <GripVertical className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  onKeyDown={(e) => {
                    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                      e.preventDefault()
                      moveNow(s.id, e.key === "ArrowUp" ? -1 : 1)
                    }
                  }}
                  aria-current={sel ? "true" : undefined}
                  className={cn("flex min-w-0 flex-1 flex-col items-start rounded-lg py-1.5 pl-1 text-left", ROW_FOCUS, s.hidden && "opacity-45")}
                >
                  <span className={cn("max-w-full truncate text-[13px]", sel ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300")}>{name}</span>
                  <span className="max-w-full truncate text-[12px] text-neutral-400">{summaryOf(s)}</span>
                </button>
                <div className={cn("flex shrink-0 items-center", !touch && !sel && "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100")}>
                  <IconButton label={`Duplicate ${name}`} onClick={() => onDuplicate(s.id)} className="size-7">
                    <Copy className="size-3.5" />
                  </IconButton>
                  <IconButton label={`Remove ${name}`} onClick={() => onRemove(s.id)} className="size-7">
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!s.hidden}
                  aria-label={`Show ${name}`}
                  title={s.hidden ? "Hidden. Show it" : "Shown. Hide it"}
                  onClick={() => onToggleHidden(s.id)}
                  className={cn("st-press grid size-7 shrink-0 place-items-center rounded-lg text-neutral-400 hover:bg-black/[0.05] hover:text-neutral-900 dark:hover:bg-white/[0.08] dark:hover:text-white", ROW_FOCUS)}
                >
                  {s.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </li>
            )
          })}
        </ol>
        <p id="lb-reorder-help" className="sr-only">
          Press Space to pick the section up, the arrow keys to move it and Space again to drop it. Alt with the up or down arrow moves the focused section at once.
        </p>
        <AddSection onAdd={onAdd} />
      </div>
    </div>
  )
}

function AddSection({ onAdd }: { onAdd: (slug: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const [pos, setPos] = React.useState<React.CSSProperties>({})
  const btn = React.useRef<HTMLButtonElement>(null)
  const pop = React.useRef<HTMLDivElement>(null)

  // The list sits in a scrolling pane, so the menu is placed in the viewport, above the button, kept on screen.
  const place = React.useCallback(() => {
    const r = btn.current?.getBoundingClientRect()
    if (!r) return
    const width = Math.min(360, window.innerWidth - 24)
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12))
    const above = r.top - 12
    const below = window.innerHeight - r.bottom - 12
    setPos(above >= 320 || above >= below ? { left, width, bottom: window.innerHeight - r.top + 6, maxHeight: Math.min(560, above) } : { left, width, top: r.bottom + 6, maxHeight: Math.min(560, below) })
  }, [])

  const close = React.useCallback((back = true) => {
    setOpen(false)
    if (back) btn.current?.focus()
  }, [])

  React.useEffect(() => {
    if (!open) return
    place()
    window.addEventListener("resize", place)
    pop.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const down = (e: PointerEvent) => {
      if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener("pointerdown", down)
    return () => {
      document.removeEventListener("pointerdown", down)
      window.removeEventListener("resize", place)
    }
  }, [open, close, place])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation()
      close()
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault()
      const items = [...(pop.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
      const i = items.indexOf(document.activeElement as HTMLElement)
      const n = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
      items[n]?.focus()
    } else if (e.key === "Tab") close(false)
  }

  return (
    <div className="relative mt-2">
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={cn(
          "st-press flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium text-neutral-600 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] hover:bg-black/[0.03] hover:text-neutral-900 dark:text-neutral-400 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/[0.04] dark:hover:text-white",
          ROW_FOCUS,
        )}
      >
        <Plus className="size-4" />
        Add section
      </button>
      {open && (
        <div
          ref={pop}
          role="menu"
          aria-label="Add a section"
          onKeyDown={onKey}
          style={pos}
          className="st-pop st-scroll fixed z-50 overflow-y-auto rounded-2xl bg-white p-1.5 [transform-origin:bottom_left] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_16px_40px_-12px_rgb(0_0_0/0.22)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_16px_40px_-12px_rgb(0_0_0/0.7)]"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.slug}
              type="button"
              role="menuitem"
              onClick={() => {
                onAdd(s.slug)
                close()
              }}
              className="flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.08] dark:focus-visible:ring-white/40"
            >
              <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{s.name}</span>
              <span className="text-[12px] leading-[18px] text-neutral-500 dark:text-neutral-400">{s.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

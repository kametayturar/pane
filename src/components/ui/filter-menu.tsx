"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type FilterOption = { id: string; label: string }

export type FilterGroup = {
  id: string
  label: string
  options: FilterOption[]
  /** Text put in front of the option label on its chip, e.g. "Deal: ". */
  chipPrefix?: string
}

/** Picked option ids per group id. */
export type FilterValue = Record<string, string[]>

export type FilterMenuProps = {
  groups: FilterGroup[]
  /** Picked option ids per group. Makes the menu controlled. */
  value?: FilterValue
  /** Starting filters when uncontrolled. */
  defaultValue?: FilterValue
  /** Called with the new filters after every change. */
  onChange?: (value: FilterValue) => void
  /** Groups that start open. Defaults to the first group. */
  defaultOpen?: string[]
  /** Heading on top. */
  title?: string
  /** Shows the keyboard hints as the last row of the card. */
  hints?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.fm {
  --fm-ink: #000;
  --fm-surface: #fff;
  --fm-accent: #0060e2;
  --fm-t1: color-mix(in oklab, var(--fm-ink) 88%, transparent);
  --fm-t2: color-mix(in oklab, var(--fm-ink) 61%, transparent);
  --fm-t3: color-mix(in oklab, var(--fm-ink) 45%, transparent);
  --fm-t4: color-mix(in oklab, var(--fm-ink) 27%, transparent);
  --fm-fill: color-mix(in oklab, var(--fm-ink) 6%, transparent);
  --fm-hover: color-mix(in oklab, var(--fm-ink) 3%, transparent);
  --fm-line: color-mix(in oklab, var(--fm-ink) 6%, transparent);
  --fm-box: 0 0 0 .5px rgb(0 0 0 / .22) inset, 0 1px 1px 0 rgb(0 0 0 / .04);
  --fm-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --fm-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--fm-surface);
  box-shadow: var(--fm-shadow);
  color: var(--fm-t1);
  font-family: var(--fm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .fm {
  --fm-ink: #fff;
  --fm-surface: #1c1c1e;
  --fm-accent: #4d8dff;
  --fm-t1: color-mix(in oklab, var(--fm-ink) 90%, transparent);
  --fm-t2: color-mix(in oklab, var(--fm-ink) 62%, transparent);
  --fm-t3: color-mix(in oklab, var(--fm-ink) 46%, transparent);
  --fm-t4: color-mix(in oklab, var(--fm-ink) 28%, transparent);
  --fm-fill: color-mix(in oklab, var(--fm-ink) 8%, transparent);
  --fm-hover: color-mix(in oklab, var(--fm-ink) 5%, transparent);
  --fm-line: color-mix(in oklab, var(--fm-ink) 8%, transparent);
  --fm-box: 0 0 0 .5px rgb(255 255 255 / .28) inset;
  --fm-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.fm *, .fm *::before, .fm *::after { box-sizing: border-box }
:where(.fm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.fm :focus-visible { outline: 2px solid color-mix(in oklab, var(--fm-accent) 60%, transparent); outline-offset: -2px }

/* Head */
.fm-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 10px 8px 16px }
.fm-title { margin: 0; font-size: 15px; font-weight: 500; line-height: 24px; color: var(--fm-ink) }
.fm .fm-clear {
  height: 28px; padding: 0 8px; border-radius: 6px; font-weight: 500; color: var(--fm-t2);
  transition: color .16s, background-color .16s, opacity .2s;
}
.fm .fm-clear:hover { background: var(--fm-hover); color: var(--fm-t1) }
.fm .fm-clear[data-hidden] { opacity: 0; pointer-events: none }

/* Chips: the row collapses by animating its grid track from 1fr to 0fr */
.fm-chips-outer { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .32s var(--fm-ease) }
.fm-chips-outer[data-empty] { grid-template-rows: 0fr }
.fm-chips-clip { min-height: 0; overflow: hidden }
.fm-chips { position: relative; display: flex; flex-wrap: nowrap; gap: 4px; padding: 0 16px 12px; overflow: hidden }
.fm-chip {
  display: flex; flex: none; align-items: center; gap: 2px; height: 24px; padding: 0 3px 0 8px; border-radius: 6px;
  background: var(--fm-fill); font-size: 12px; font-weight: 500; line-height: 16px; white-space: nowrap;
  animation: fm-chip-in .26s var(--fm-ease) backwards;
}
.fm-chip[data-more] { padding: 0 8px; color: var(--fm-t2) }
.fm-chip-label { display: block; overflow: hidden; text-overflow: ellipsis; max-width: 220px }
.fm .fm-chip-x {
  display: grid; place-items: center; width: 18px; height: 18px; border-radius: 4px; color: var(--fm-t3);
  transition: background-color .14s, color .14s;
}
.fm .fm-chip-x:hover { background: color-mix(in oklab, var(--fm-ink) 8%, transparent); color: var(--fm-ink) }
.fm-chip-x svg { display: block; width: 12px; height: 12px }
.fm-measure { position: absolute; left: 0; top: 0; display: flex; gap: 4px; width: max-content; visibility: hidden; pointer-events: none }
.fm-measure .fm-chip { animation: none }

/* Groups */
.fm-groups { display: grid; padding: 4px; border-top: .5px solid var(--fm-line) }
.fm .fm-group-head {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 8px; border-radius: 6px;
  transition: background-color .14s;
}
.fm .fm-group-head:hover, .fm .fm-option:hover { background: var(--fm-hover); transition: none }
.fm-chev { display: block; flex: none; width: 16px; height: 16px; color: var(--fm-t2); transition: transform .26s var(--fm-ease) }
.fm-group[data-open="false"] .fm-chev { transform: rotate(-90deg) }
.fm-group-label { font-weight: 500; color: var(--fm-t1) }
.fm-group-count { font-size: 12px; line-height: 16px; color: var(--fm-t4); font-variant-numeric: tabular-nums }
.fm-picked { display: flex; margin-left: auto; overflow: hidden; font-size: 12px; line-height: 16px; color: var(--fm-t3); font-variant-numeric: tabular-nums }
.fm-roll { display: block; white-space: nowrap; animation: fm-roll .3s var(--fm-ease) backwards }

/* Panel: height animates between 0fr and 1fr */
.fm-panel { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .32s var(--fm-ease) }
.fm-panel[data-open="false"] { grid-template-rows: 0fr }
.fm-inner { display: grid; min-height: 0; overflow: hidden; padding-bottom: 4px; transition: opacity .22s, padding .32s var(--fm-ease), visibility 0s }
.fm-panel[data-open="false"] .fm-inner { opacity: 0; padding-bottom: 0; visibility: hidden; transition: opacity .22s, padding .32s var(--fm-ease), visibility 0s .32s }
.fm .fm-option {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 32px; padding: 0 8px 0 32px; border-radius: 6px;
  transition: background-color .14s;
}
.fm-box {
  display: grid; place-items: center; flex: none; width: 14px; height: 14px; border-radius: 4px; background: var(--fm-surface);
  box-shadow: var(--fm-box); transition: background-color .16s, box-shadow .16s;
}
.fm-box svg { display: block; width: 12px; height: 12px; overflow: visible }
.fm-box path { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 12; stroke-dashoffset: 12; transition: stroke-dashoffset .24s var(--fm-ease) }
.fm-option[aria-checked="true"] .fm-box { background: color-mix(in oklab, var(--fm-accent) 76.5%, transparent); box-shadow: none }
.fm-option[aria-checked="true"] .fm-box path { stroke-dashoffset: 0; transition-delay: .04s }
.fm-option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }

/* Keyboard hints */
.fm-hints { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 32px; padding: 0 12px; border-top: .5px solid var(--fm-line); font-size: 12px; line-height: 16px; color: var(--fm-t3) }
.fm-hint { display: flex; align-items: center; gap: 2px }
.fm-hint span { margin-left: 4px }
.fm-hint kbd {
  display: grid; place-items: center; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 4px; background: var(--fm-surface);
  box-shadow: var(--fm-shadow); font: inherit; font-size: 10px; font-weight: 500; color: var(--fm-t2);
}

@keyframes fm-chip-in { from { opacity: 0; transform: scale(.9) } }
@keyframes fm-roll { from { opacity: 0; transform: translateY(60%) } }

/* Touch screens: taller rows, no keyboard hints */
@media (hover: none) and (pointer: coarse) {
  .fm .fm-group-head, .fm .fm-option { height: 40px }
  .fm .fm-clear { height: 36px }
  .fm .fm-chip-x { width: 24px; height: 24px }
  .fm-hints { display: none }
}

@media (prefers-reduced-motion: reduce) {
  .fm *, .fm *::before, .fm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                Small pieces                                */
/* -------------------------------------------------------------------------- */

const ChevronIcon = () => (
  <svg className="fm-chev" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M4.5 6.25 8 9.75l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="m5 5 6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

type Chip = { key: string; groupId: string; optionId: string; label: string }

const EMPTY: FilterValue = {}

/* -------------------------------------------------------------------------- */
/*                                 FilterMenu                                 */
/* -------------------------------------------------------------------------- */

export function FilterMenu({
  groups,
  value: valueProp,
  defaultValue = EMPTY,
  onChange,
  defaultOpen,
  title = "Filters",
  hints = true,
  className,
}: FilterMenuProps) {
  const uid = React.useId()
  const controlled = valueProp !== undefined
  const [inner, setInner] = React.useState<FilterValue>(defaultValue)
  const value = controlled ? valueProp : inner
  const [open, setOpen] = React.useState<string[]>(() => defaultOpen ?? groups.slice(0, 1).map((g) => g.id))
  const [active, setActive] = React.useState<string | null>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)

  /* Which options are picked, in group order, as chips */
  const chips: Chip[] = []
  for (const g of groups) {
    const picked = value[g.id] ?? []
    for (const o of g.options) {
      if (picked.includes(o.id)) chips.push({ key: `${g.id}:${o.id}`, groupId: g.id, optionId: o.id, label: `${g.chipPrefix ?? ""}${o.label}` })
    }
  }
  const signature = chips.map((c) => c.key).join("|")

  // Keep the last chips on screen while the row collapses after "Clear all".
  const [held, setHeld] = React.useState<{ sig: string; chips: Chip[] }>({ sig: signature, chips })
  if (chips.length > 0 && held.sig !== signature) setHeld({ sig: signature, chips })
  const shown = chips.length > 0 ? chips : held.chips

  const commit = (next: FilterValue) => {
    if (!controlled) setInner(next)
    onChange?.(next)
  }

  const toggle = (groupId: string, optionId: string) => {
    const current = value[groupId] ?? []
    const list = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    const next = { ...value }
    if (list.length) next[groupId] = list
    else delete next[groupId]
    commit(next)
  }

  const clearAll = () => commit({})

  const setGroupOpen = (id: string, want?: boolean) =>
    setOpen((cur) => {
      const isOpen = cur.includes(id)
      const next = want ?? !isOpen
      if (next === isOpen) return cur
      return next ? [...cur, id] : cur.filter((x) => x !== id)
    })

  /* One roving tab stop across group headers and the options of open groups */
  const rows: string[] = []
  for (const g of groups) {
    rows.push(`g:${g.id}`)
    if (open.includes(g.id)) for (const o of g.options) rows.push(`o:${g.id}:${o.id}`)
  }
  const tabKey = active && rows.includes(active) ? active : rows[0]

  const focusRow = (key: string | undefined) => {
    if (!key) return
    setActive(key)
    rootRef.current?.querySelector<HTMLElement>(`[data-key="${escapeKey(key)}"]`)?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>("[data-key]")?.dataset.key
    if (!key) return
    const i = rows.indexOf(key)
    const isHeader = key.startsWith("g:")
    const groupId = key.split(":")[1]
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        focusRow(rows[Math.min(i + 1, rows.length - 1)])
        break
      case "ArrowUp":
        e.preventDefault()
        focusRow(rows[Math.max(i - 1, 0)])
        break
      case "Home":
        e.preventDefault()
        focusRow(rows[0])
        break
      case "End":
        e.preventDefault()
        focusRow(rows[rows.length - 1])
        break
      case "ArrowRight":
        if (isHeader) {
          e.preventDefault()
          setGroupOpen(groupId, true)
        }
        break
      case "ArrowLeft":
        e.preventDefault()
        setGroupOpen(groupId, false)
        if (!isHeader) focusRow(`g:${groupId}`)
        break
    }
  }

  /* Chips stay on one line; the rest fold into "+N". Widths come from a hidden twin row. */
  const chipsRef = React.useRef<HTMLDivElement>(null)
  const measureRef = React.useRef<HTMLDivElement>(null)
  const [fit, setFit] = React.useState<number | null>(null)
  React.useEffect(() => {
    const row = chipsRef.current
    const twin = measureRef.current
    if (!row || !twin) return
    const compute = () => {
      const kids = Array.from(twin.children) as HTMLElement[]
      const moreW = kids[kids.length - 1]?.offsetWidth ?? 0
      const widths = kids.slice(0, -1).map((k) => k.offsetWidth)
      const avail = row.clientWidth - 32
      const total = widths.reduce((a, w) => a + w, 0) + Math.max(0, widths.length - 1) * 4
      if (total <= avail) return setFit(null)
      let used = 0
      let n = 0
      for (let k = 0; k < widths.length; k++) {
        const next = used + widths[k] + (k > 0 ? 4 : 0)
        if (next + 4 + moreW > avail) break
        used = next
        n = k + 1
      }
      setFit(n)
    }
    const ro = new ResizeObserver(compute)
    ro.observe(row)
    ro.observe(twin)
    return () => ro.disconnect()
  }, [])
  const visible = fit === null ? shown : shown.slice(0, fit)
  const hidden = shown.length - visible.length

  return (
    <div className={cn("fm", className)} ref={rootRef}>
      <style href="filter-menu" precedence="default">
        {CSS}
      </style>

      <div className="fm-head">
        <h3 className="fm-title">{title}</h3>
        <button type="button" className="fm-clear" data-hidden={chips.length === 0 || undefined} tabIndex={chips.length ? 0 : -1} onClick={clearAll}>
          Clear all
        </button>
      </div>

      <div className="fm-chips-outer" data-empty={chips.length === 0 || undefined}>
        <div className="fm-chips-clip">
          <div className="fm-chips" ref={chipsRef} aria-live="polite" aria-hidden={chips.length === 0 || undefined}>
            <div className="fm-measure" ref={measureRef} aria-hidden>
              {shown.map((c) => (
                <span key={c.key} className="fm-chip">
                  <span className="fm-chip-label">{c.label}</span>
                  <span className="fm-chip-x" />
                </span>
              ))}
              <span className="fm-chip" data-more>
                +99
              </span>
            </div>
            {visible.map((c) => (
              <span key={c.key} className="fm-chip">
                <span className="fm-chip-label">{c.label}</span>
                <button
                  type="button"
                  className="fm-chip-x"
                  aria-label={`Remove ${c.label}`}
                  tabIndex={chips.length ? 0 : -1}
                  onClick={() => toggle(c.groupId, c.optionId)}
                >
                  <CloseIcon />
                </button>
              </span>
            ))}
            {hidden > 0 && (
              <span className="fm-chip" data-more title={shown.slice(visible.length).map((c) => c.label).join(", ")}>
                +{hidden}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="fm-groups" onKeyDown={onKeyDown}>
        {groups.map((g) => {
          const isOpen = open.includes(g.id)
          const picked = value[g.id]?.length ?? 0
          const panelId = `${uid}-${g.id}`
          return (
            <section key={g.id} className="fm-group" data-open={isOpen}>
              <button
                type="button"
                className="fm-group-head"
                data-key={`g:${g.id}`}
                tabIndex={tabKey === `g:${g.id}` ? 0 : -1}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onFocus={() => setActive(`g:${g.id}`)}
                onClick={() => setGroupOpen(g.id)}
              >
                <ChevronIcon />
                <span className="fm-group-label">{g.label}</span>
                <span className="fm-group-count">{g.options.length}</span>
                <span className="fm-picked" aria-live="polite">
                  {picked > 0 && (
                    <span key={picked} className="fm-roll">
                      {picked} {picked === 1 ? "filter" : "filters"}
                    </span>
                  )}
                </span>
              </button>
              <div className="fm-panel" id={panelId} role="group" aria-label={g.label} data-open={isOpen}>
                <div className="fm-inner">
                  {g.options.map((o) => {
                    const on = value[g.id]?.includes(o.id) ?? false
                    const key = `o:${g.id}:${o.id}`
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        className="fm-option"
                        data-key={key}
                        tabIndex={tabKey === key ? 0 : -1}
                        onFocus={() => setActive(key)}
                        onClick={() => toggle(g.id, o.id)}
                      >
                        <span className="fm-box" aria-hidden>
                          <svg viewBox="0 0 16 16">
                            <path d="m4.25 8.25 2.5 2.5 5-5.5" />
                          </svg>
                        </span>
                        <span className="fm-option-label">{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {hints && (
        <div className="fm-hints" aria-hidden>
          <span className="fm-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>to navigate</span>
          </span>
          <span className="fm-hint">
            <kbd>↵</kbd>
            <span>to select</span>
          </span>
        </div>
      )}
    </div>
  )
}

/** Escapes a value for use inside a [data-key="…"] selector. */
function escapeKey(key: string) {
  return key.replace(/["\\]/g, "\\$&")
}

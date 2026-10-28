"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ReactionKey = "like" | "comment" | "repost" | "share"

export type ReactionState = {
  /** Number shown next to the icon. Leave out for actions without a count (like share). */
  count?: number
  /** Whether the action starts pressed. */
  active?: boolean
}

export type ReactionBarProps = {
  /** Starting count and pressed state per action. */
  reactions?: Partial<Record<ReactionKey, ReactionState>>
  /** Called after a toggle with the new count and state. */
  onReact?: (key: ReactionKey, state: { count?: number; active: boolean }) => void
  /** Which actions to show, in order. */
  actions?: ReactionKey[]
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.rb {
  --rb-ink: #000;
  --rb-accent: #0060e2;
  --rb-t1: color-mix(in oklab, var(--rb-ink) 88%, transparent);
  --rb-t2: color-mix(in oklab, var(--rb-ink) 61%, transparent);
  --rb-t3: color-mix(in oklab, var(--rb-ink) 45%, transparent);
  --rb-ring: color-mix(in oklab, var(--rb-ink) 6%, transparent);
  --rb-hover: color-mix(in oklab, var(--rb-ink) 4%, transparent);
  --rb-roll: cubic-bezier(.85, 0, .15, 1);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--rb-t2);
  font-family: var(--rb-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
}
:is(.dark, [data-theme="dark"]) .rb {
  --rb-ink: #fff;
  --rb-accent: #4d8dff;
  --rb-t1: color-mix(in oklab, var(--rb-ink) 90%, transparent);
  --rb-t2: color-mix(in oklab, var(--rb-ink) 62%, transparent);
  --rb-t3: color-mix(in oklab, var(--rb-ink) 46%, transparent);
  --rb-ring: color-mix(in oklab, var(--rb-ink) 10%, transparent);
  --rb-hover: color-mix(in oklab, var(--rb-ink) 6%, transparent);
}
.rb *, .rb *::before, .rb *::after { box-sizing: border-box }
.rb button { font: inherit; color: inherit; background: none; border: 0; margin: 0; cursor: pointer }
.rb :focus-visible { outline: 2px solid color-mix(in oklab, var(--rb-accent) 60%, transparent); outline-offset: 1px }

.rb .rb-btn {
  position: relative; display: flex; align-items: center; height: 28px; padding: 0 8px; border-radius: 6px;
  color: var(--rb-t2); box-shadow: inset 0 0 0 .5px var(--rb-ring);
  transition: background-color .09s, box-shadow .16s, color .16s;
}
.rb .rb-btn:hover { background: var(--rb-hover); color: var(--rb-t1) }
.rb .rb-btn[aria-pressed="true"] {
  background: color-mix(in oklab, var(--rb-accent) 5%, transparent);
  color: color-mix(in oklab, var(--rb-accent) 76.5%, transparent);
  box-shadow: inset 0 0 0 .5px color-mix(in oklab, var(--rb-accent) 35%, transparent);
}
.rb-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--rb-t3); transition: color .16s }
.rb .rb-btn:hover .rb-icon { color: var(--rb-t1) }
.rb .rb-btn[aria-pressed="true"] .rb-icon { color: inherit }
.rb-icon svg { display: block; width: 16px; height: 16px; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round }
.rb-icon svg path { transition: fill .16s }
.rb .rb-btn[aria-pressed="true"] .rb-icon[data-fill] svg path { fill: currentColor }
.rb-icon[data-pop] { animation: rb-pop .32s cubic-bezier(.65, 0, .35, 1) }

/* The count's width glides to the new digits; changed digits roll in */
.rb-count { display: block; height: 20px; overflow: hidden }
.rb-count[data-smooth] { transition: width .4s var(--rb-roll) }
.rb-digits { display: inline-flex; padding: 0 2px 0 6px; font-variant-numeric: tabular-nums; white-space: nowrap }
.rb-digit { display: block }
.rb-digit[data-roll] { animation: rb-roll .4s var(--rb-roll) backwards }

@keyframes rb-pop {
  0% { transform: scale(1) }
  35% { transform: scale(.75) }
  70% { transform: scale(1.12) }
  100% { transform: scale(1) }
}
@keyframes rb-roll { from { opacity: 0; transform: translateY(70%) } }

@media (prefers-reduced-motion: reduce) {
  .rb *, .rb *::before, .rb *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const ICONS: Record<ReactionKey, React.ReactNode> = {
  like: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 20.4S3.8 15.6 3.8 9.5A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.2 2.6c0 6.1-8.2 10.9-8.2 10.9z" />
    </svg>
  ),
  comment: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  ),
  repost: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16.5 3.5 19 6l-2.5 2.5M19 6H8a4 4 0 0 0-4 4v1M7.5 20.5 5 18l2.5-2.5M5 18h11a4 4 0 0 0 4-4v-1" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M21 3 3 9.8l7.5 3.7L14.2 21z" />
      <path d="M21 3 10.5 13.5" />
    </svg>
  ),
}

const FILLS: Record<ReactionKey, boolean> = { like: true, comment: true, repost: false, share: true }

const NOUN: Record<ReactionKey, [string, string, string] | null> = {
  like: ["Like", "like", "likes"],
  comment: ["Comment", "comment", "comments"],
  repost: ["Repost", "repost", "reposts"],
  share: null,
}

const DEFAULTS: Partial<Record<ReactionKey, ReactionState>> = {
  like: { count: 128 },
  comment: { count: 24 },
  repost: { count: 9 },
  share: {},
}

function labelFor(key: ReactionKey, count: number | undefined) {
  const n = NOUN[key]
  if (!n) return "Share"
  if (!count) return n[0]
  return `${n[0]}, ${count} ${count === 1 ? n[1] : n[2]}`
}

/* -------------------------------------------------------------------------- */
/*                                   Count                                    */
/* -------------------------------------------------------------------------- */

/** Digits that roll in when they change; the box animates its width between two pixel values. */
function Count({ value }: { value: number | undefined }) {
  const text = value ? String(value) : ""
  const [prev, setPrev] = React.useState(text)
  const [rollFrom, setRollFrom] = React.useState<string | null>(null)
  if (text !== prev) {
    setPrev(text)
    setRollFrom(prev)
  }

  const digitsRef = React.useRef<HTMLSpanElement>(null)
  const [width, setWidth] = React.useState<number | null>(null)
  const [smooth, setSmooth] = React.useState(false)
  React.useEffect(() => {
    const el = digitsRef.current
    if (!el) return
    let frame = 0
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].borderBoxSize?.[0]
      setWidth(box ? box.inlineSize : el.offsetWidth)
      if (!frame) frame = requestAnimationFrame(() => setSmooth(true))
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const chars = text.split("")
  return (
    <span className="rb-count" aria-hidden data-smooth={smooth || undefined} style={width !== null ? { width } : undefined}>
      <span className="rb-digits" ref={digitsRef} style={text ? undefined : { padding: 0 }}>
        {chars.map((ch, i) => {
          const fromRight = chars.length - 1 - i
          const changed = rollFrom !== null && rollFrom.charAt(rollFrom.length - 1 - fromRight) !== ch
          return (
            <span key={`${fromRight}-${ch}`} className="rb-digit" data-roll={changed || undefined}>
              {ch}
            </span>
          )
        })}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ReactionBar                                 */
/* -------------------------------------------------------------------------- */

export function ReactionBar({ reactions = DEFAULTS, onReact, actions = ["like", "comment", "repost", "share"], className }: ReactionBarProps) {
  const [state, setState] = React.useState<Partial<Record<ReactionKey, ReactionState & { touched?: boolean }>>>(() => ({ ...reactions }))

  const toggle = (key: ReactionKey) => {
    const cur = state[key] ?? {}
    const active = !cur.active
    const count = cur.count === undefined ? undefined : Math.max(0, cur.count + (active ? 1 : -1))
    setState((s) => ({ ...s, [key]: { count, active, touched: true } }))
    onReact?.(key, { count, active })
  }

  return (
    <div className={cn("rb", className)} role="group" aria-label="Reactions">
      <style href="reaction-bar" precedence="default">
        {CSS}
      </style>
      {actions.map((key) => {
        const s = state[key] ?? {}
        const active = !!s.active
        return (
          <button
            key={key}
            type="button"
            className="rb-btn"
            data-kind={key}
            aria-pressed={active}
            aria-label={labelFor(key, s.count)}
            onClick={() => toggle(key)}
          >
            <span key={String(active)} className="rb-icon" data-fill={FILLS[key] || undefined} data-pop={(active && s.touched) || undefined}>
              {ICONS[key]}
            </span>
            {s.count !== undefined && <Count value={s.count} />}
          </button>
        )
      })}
    </div>
  )
}

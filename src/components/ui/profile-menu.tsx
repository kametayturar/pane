"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ProfileMenuItem = {
  id: string
  label: string
  /** 16px icon, e.g. one of the exported icons. */
  icon?: React.ReactNode
  /** Small pill on the right, e.g. "New". */
  badge?: string
  onSelect?: () => void
}

export type ProfileSetup = {
  done: number
  total: number
  /** What to do next, e.g. "Add a profile photo". Omit to hide the row. */
  next?: string
  onContinue?: () => void
}

export type ProfileMenuProps = {
  /** Name of the signed-in user. */
  name?: string
  /** Email under the name, cut off with an ellipsis when long. */
  email?: string
  /** Replaces the default avatar, e.g. an <img>. */
  avatar?: React.ReactNode
  /** Actions with label, icon, optional badge and onSelect. */
  items?: ProfileMenuItem[]
  /** Profile setup progress. Pass `null` to hide it. */
  setup?: ProfileSetup | null
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pm {
  --pm-ink: #000;
  --pm-surface: #fff;
  --pm-accent: #0060e2;
  --pm-rose: #e11d48;
  --pm-t1: color-mix(in oklab, var(--pm-ink) 88%, transparent);
  --pm-t2: color-mix(in oklab, var(--pm-ink) 61%, transparent);
  --pm-t3: color-mix(in oklab, var(--pm-ink) 45%, transparent);
  --pm-hover: color-mix(in oklab, var(--pm-ink) 3%, transparent);
  --pm-line: color-mix(in oklab, var(--pm-ink) 6%, transparent);
  --pm-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 28px -10px rgb(0 0 0 / .16), 0 1px 2px 0 rgb(0 0 0 / .05);
  --pm-ease: cubic-bezier(.22, 1, .36, 1);
  width: 100%;
  max-width: 260px;
  color: var(--pm-t1);
  font-family: var(--pm-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .pm {
  --pm-ink: #fff;
  --pm-surface: #1c1c1e;
  --pm-accent: #4d8dff;
  --pm-rose: #fb7185;
  --pm-t1: color-mix(in oklab, var(--pm-ink) 90%, transparent);
  --pm-t2: color-mix(in oklab, var(--pm-ink) 62%, transparent);
  --pm-t3: color-mix(in oklab, var(--pm-ink) 46%, transparent);
  --pm-hover: color-mix(in oklab, var(--pm-ink) 6%, transparent);
  --pm-line: color-mix(in oklab, var(--pm-ink) 8%, transparent);
  --pm-float: 0 0 0 .5px rgb(255 255 255 / .1), 0 12px 28px -10px rgb(0 0 0 / .6), 0 1px 2px 0 rgb(0 0 0 / .4);
}
.pm *, .pm *::before, .pm *::after { box-sizing: border-box }
:where(.pm) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-align: left }
.pm :focus-visible { outline: 2px solid color-mix(in oklab, var(--pm-accent) 60%, transparent); outline-offset: -2px }

.pm-card { padding: 4px; overflow: hidden; border-radius: 10px; background: var(--pm-surface); box-shadow: var(--pm-float) }

/* Who is signed in */
.pm-user { display: flex; align-items: center; gap: 10px; margin: 0 -4px 4px; padding: 8px 12px 10px }
.pm-avatar { flex: none; width: 32px; height: 32px; overflow: hidden; border-radius: 50%; color: color-mix(in oklab, var(--pm-accent) 76.5%, transparent) }
.pm-avatar > * { display: block; width: 100%; height: 100%; object-fit: cover }
.pm-who { display: grid; min-width: 0 }
.pm-name, .pm-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.pm-name { font-weight: 500; color: var(--pm-ink) }
.pm-email { font-size: 12px; line-height: 16px; color: var(--pm-t3) }

/* Actions */
.pm-items { display: grid }
.pm .pm-item {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 32px; padding: 0 8px; border-radius: 6px;
  transition: background-color .14s;
}
.pm .pm-item:hover, .pm .pm-item:focus-visible { background: var(--pm-hover) }
.pm-icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--pm-t3); transition: color .14s }
.pm-icon svg { display: block; width: 16px; height: 16px }
.pm-item:hover .pm-icon, .pm-item:focus-visible .pm-icon { color: var(--pm-t1) }
.pm-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.pm-badge {
  flex: none; height: 18px; padding: 0 6px; border-radius: 5px; background: color-mix(in oklab, var(--pm-rose) 8%, transparent);
  font-size: 11px; font-weight: 500; line-height: 18px; color: var(--pm-rose);
}

/* Setup progress */
.pm-setup { margin: 4px -4px -4px; padding: 10px 12px 6px; border-top: .5px solid var(--pm-line) }
.pm-setup-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; line-height: 16px }
.pm-setup-title { font-weight: 500; color: var(--pm-t2) }
.pm-setup-count { color: var(--pm-t3); font-variant-numeric: tabular-nums }
.pm-track { display: block; height: 4px; margin-top: 8px; overflow: hidden; border-radius: 2px; background: var(--pm-line) }
.pm-fill {
  display: block; width: 100%; height: 100%; border-radius: 2px; transform-origin: left;
  background: color-mix(in oklab, var(--pm-accent) 76.5%, transparent);
  transition: scale .9s var(--pm-ease) .15s;
}
.pm .pm-next {
  display: flex; align-items: center; gap: 8px; width: calc(100% + 16px); height: 28px; margin: 6px -8px 0; padding: 0 8px; border-radius: 6px;
  transition: background-color .14s;
}
.pm .pm-next:hover { background: var(--pm-hover) }
.pm-next-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.pm-next-hint { color: var(--pm-t3) }
.pm-next svg { display: block; flex: none; width: 16px; height: 16px; color: var(--pm-t3); transition: transform .2s var(--pm-ease), color .14s }
.pm-next:hover svg { transform: translateX(2px); color: var(--pm-t1) }

@media (prefers-reduced-motion: reduce) {
  .pm *, .pm *::before, .pm *::after { animation: none !important; transition: none !important }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

const ico = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const

export const SettingsIcon = () => (
  <svg {...ico}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8 14 4.4l2.5-.3.9 2.4 2.4.9-.3 2.5L21.2 12l-1.7 2-.3 2.5-2.4.9-.9 2.4-2.5-.3L12 21.2 10 19.6l-2.5.3-.9-2.4-2.4-.9.3-2.5L2.8 12l1.7-2 .3-2.5 2.4-.9.9-2.4 2.5.3z" />
  </svg>
)
export const DocsIcon = () => (
  <svg {...ico}>
    <path d="M14 3H7.5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7.5z" />
    <path d="M14 3v4.5h4.5M9 12.5h6M9 16h4" />
  </svg>
)
export const AppsIcon = () => (
  <svg {...ico}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <path d="M17.5 3v7M14 6.5h7" />
  </svg>
)
export const LogoutIcon = () => (
  <svg {...ico}>
    <path d="M9.5 4H7a2.5 2.5 0 0 0-2.5 2.5v11A2.5 2.5 0 0 0 7 20h2.5M15 8l4 4-4 4M19 12H9.5" />
  </svg>
)
export const BillingIcon = () => (
  <svg {...ico}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18M7 15h3" />
  </svg>
)

const ArrowRight = () => (
  <svg {...ico}>
    <path d="M5 12h13.5M13 6.5 18.5 12 13 17.5" />
  </svg>
)

const DEFAULT_ITEMS: ProfileMenuItem[] = [
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  { id: "docs", label: "Docs", icon: <DocsIcon /> },
  { id: "apps", label: "Apps", icon: <AppsIcon />, badge: "New" },
  { id: "logout", label: "Logout", icon: <LogoutIcon /> },
]

const DEFAULT_SETUP: ProfileSetup = { done: 3, total: 5, next: "Add a profile photo" }

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="currentColor" opacity=".1" />
      <circle cx="20" cy="16" r="4.75" fill="currentColor" />
      <path d="M10.5 31c.9-5 4.4-7.6 9.5-7.6s8.6 2.6 9.5 7.6a14 14 0 0 1-19 0z" fill="currentColor" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                                ProfileMenu                                 */
/* -------------------------------------------------------------------------- */

export function ProfileMenu({
  name = "Lena Hartmann",
  email = "lena.hartmann@fastmail.com",
  avatar,
  items = DEFAULT_ITEMS,
  setup = DEFAULT_SETUP,
  className,
}: ProfileMenuProps) {
  const [active, setActive] = React.useState(0)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [seen, setSeen] = React.useState(false)

  // The setup bar fills once the card scrolls into view.
  React.useEffect(() => {
    const el = cardRef.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setSeen(true))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const move = (to: number) => {
    const n = items.length
    if (!n) return
    const i = (to + n) % n
    setActive(i)
    itemRefs.current[i]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = itemRefs.current.findIndex((el) => el === document.activeElement)
    if (e.key === "ArrowDown") {
      e.preventDefault()
      move(cur + 1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      move(cur === -1 ? items.length - 1 : cur - 1)
    } else if (e.key === "Home") {
      e.preventDefault()
      move(0)
    } else if (e.key === "End") {
      e.preventDefault()
      move(items.length - 1)
    }
  }

  const ratio = setup && setup.total > 0 ? Math.min(1, Math.max(0, setup.done / setup.total)) : 0
  const tabIndexFor = (i: number) => (i === Math.min(active, items.length - 1) ? 0 : -1)

  return (
    <section className={cn("pm", className)}>
      <style href="profile-menu" precedence="default">
        {CSS}
      </style>
      <div className="pm-card" ref={cardRef}>
        <header className="pm-user">
          <span className="pm-avatar">{avatar ?? <DefaultAvatar />}</span>
          <span className="pm-who">
            <span className="pm-name">{name}</span>
            <span className="pm-email" title={email}>
              {email}
            </span>
          </span>
        </header>

        <div className="pm-items" role="menu" aria-label="Account" onKeyDown={onKeyDown}>
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              type="button"
              role="menuitem"
              className="pm-item"
              tabIndex={tabIndexFor(i)}
              onFocus={() => setActive(i)}
              onClick={item.onSelect}
            >
              {item.icon && <span className="pm-icon">{item.icon}</span>}
              <span className="pm-label">{item.label}</span>
              {item.badge && <span className="pm-badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        {setup && (
          <div className="pm-setup">
            <div className="pm-setup-head">
              <span className="pm-setup-title">Profile setup</span>
              <span className="pm-setup-count">
                {setup.done}/{setup.total}
              </span>
            </div>
            <span
              className="pm-track"
              role="progressbar"
              aria-label="Profile setup"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(ratio * 100)}
            >
              <span className="pm-fill" style={{ scale: `${seen ? ratio : 0} 1` }} />
            </span>
            {setup.next && (
              <button type="button" className="pm-next" onClick={setup.onContinue}>
                <span className="pm-next-label">
                  <span className="pm-next-hint">Next:</span> {setup.next}
                </span>
                <ArrowRight />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

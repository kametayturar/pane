// Small controls shared by the Studio panels. Plain, labelled, native where it helps.
import * as React from "react"

import { cn } from "@/lib/utils"

export const HAIR = "shadow-[0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]"
export const FIELD = cn(
  "h-8 rounded-lg bg-transparent px-2.5 text-[13px] text-neutral-900 outline-none transition-shadow duration-200 placeholder:text-neutral-400 focus-visible:shadow-[0_0_0_1.5px_rgb(0_0_0/0.45)] dark:text-neutral-100 dark:focus-visible:shadow-[0_0_0_1.5px_rgb(255_255_255/0.55)]",
  HAIR,
)

export const STUDIO_CSS = `
.st-root { --st-ease: cubic-bezier(.22,1,.36,1); }
.st-root button, .st-root [role=radio], .st-root [role=menuitem] { transition-timing-function: var(--st-ease); }
.st-press:active { transform: scale(.97); }
.st-press { transition: transform 160ms var(--st-ease), background-color 160ms var(--st-ease), color 160ms var(--st-ease), box-shadow 160ms var(--st-ease), opacity 160ms var(--st-ease); }
@keyframes st-in { from { opacity: 0; filter: blur(6px); transform: translateY(6px) } to { opacity: 1; filter: blur(0); transform: none } }
.st-enter { animation: st-in 420ms var(--st-ease) both; }
@keyframes st-pop { from { opacity: 0; transform: translateY(-4px) scale(.98) } to { opacity: 1; transform: none } }
.st-pop { animation: st-pop 160ms var(--st-ease) both; transform-origin: top right; }
@keyframes st-sheet { from { transform: translateY(100%) } to { transform: none } }
.st-sheet { animation: st-sheet 320ms var(--st-ease) both; }
@keyframes st-fade { from { opacity: 0 } to { opacity: 1 } }
.st-fade { animation: st-fade 200ms var(--st-ease) both; }
.st-range { -webkit-appearance: none; appearance: none; height: 20px; width: 100%; background: transparent; cursor: pointer; --p: 50%; }
.st-range::-webkit-slider-runnable-track { height: 3px; border-radius: 2px; background: linear-gradient(to right, currentColor var(--p), color-mix(in srgb, currentColor 14%, transparent) var(--p)); }
.st-range::-moz-range-track { height: 3px; border-radius: 2px; background: color-mix(in srgb, currentColor 14%, transparent); }
.st-range::-moz-range-progress { height: 3px; border-radius: 2px; background: currentColor; }
.st-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; margin-top: -5.5px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .22), 0 1px 3px rgb(0 0 0 / .18); transition: transform 160ms var(--st-ease); }
.st-range::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgb(0 0 0 / .22), 0 1px 3px rgb(0 0 0 / .18); }
.st-range:active::-webkit-slider-thumb { transform: scale(1.12); }
.st-range:focus-visible { outline: none; }
.st-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 2px #fff, 0 0 0 4.5px rgb(0 0 0 / .8); }
.st-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 2px #fff, 0 0 0 4.5px rgb(0 0 0 / .8); }
.dark .st-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 2px #171717, 0 0 0 4.5px rgb(255 255 255 / .85); }
.dark .st-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 2px #171717, 0 0 0 4.5px rgb(255 255 255 / .85); }
.st-swatch::-webkit-color-swatch-wrapper { padding: 0; }
.st-swatch::-webkit-color-swatch { border: 0; border-radius: 50%; }
.st-swatch::-moz-color-swatch { border: 0; border-radius: 50%; }
.st-scroll { scrollbar-width: thin; scrollbar-color: rgb(128 128 128 / .3) transparent; }
.st-noscroll { scrollbar-width: none; }
.st-noscroll::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) { .st-enter, .st-pop, .st-sheet, .st-fade { animation: none; } .st-press { transition: none; } }
`

export function Seg<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
  hideLabel,
  nowrap,
  className,
}: {
  label: string
  value: T
  options: { id: T; label: React.ReactNode; title?: string; disabled?: boolean }[]
  onChange: (v: T) => void
  disabled?: boolean
  hideLabel?: boolean
  nowrap?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {!hideLabel && <span className="px-0.5 text-[12px] font-medium text-neutral-400">{label}</span>}
      <div
        className={cn("flex gap-0.5 rounded-xl bg-black/[0.04] p-[3px] dark:bg-white/[0.06]", nowrap ? "w-max flex-nowrap" : "flex-wrap")}
        role="radiogroup"
        aria-label={label}
        onKeyDown={(e) => {
          if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return
          const ids = options.filter((o) => !o.disabled).map((o) => o.id)
          const i = ids.indexOf(value)
          const next = ids[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + ids.length) % ids.length]
          if (next !== undefined) {
            e.preventDefault()
            onChange(next)
            requestAnimationFrame(() => (e.currentTarget.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus())
          }
        }}
      >
        {options.map((o) => (
          <button
            key={String(o.id)}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            tabIndex={value === o.id ? 0 : -1}
            title={o.title}
            disabled={disabled || o.disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "st-press flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-2.5 text-[12.5px] font-medium text-neutral-500 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 disabled:pointer-events-none disabled:opacity-35 dark:hover:text-white dark:focus-visible:ring-white/50",
              value === o.id && "bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_0.5px_rgb(0_0_0/0.06)] dark:bg-white/10 dark:text-white",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "st-press relative h-[22px] w-[38px] shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-neutral-950",
        checked ? "bg-neutral-900 dark:bg-white" : "bg-black/[0.12] dark:bg-white/[0.16]",
      )}
    >
      <span
        className={cn(
          "absolute left-[3px] top-[3px] size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)] dark:bg-neutral-900",
          checked && "translate-x-4",
        )}
      />
    </button>
  )
}

export function IconButton({ label, className, children, ...rest }: { label: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        "st-press grid size-8 shrink-0 place-items-center rounded-lg text-neutral-500 outline-none hover:bg-black/[0.05] hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/40 disabled:pointer-events-none disabled:opacity-35 dark:hover:bg-white/[0.08] dark:hover:text-white dark:focus-visible:ring-white/50",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Button({ children, className, primary, ...rest }: { primary?: boolean } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "st-press inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40 dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-neutral-950",
        primary ? "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200" : cn("text-neutral-700 hover:bg-black/[0.04] dark:text-neutral-300 dark:hover:bg-white/[0.06]", HAIR),
        className,
      )}
    >
      {children}
    </button>
  )
}

/**
 * Make everything outside `el` inert (and hidden from screen readers) while `active`: walk up the tree and
 * mark each ancestor's other children. Only what this call changed is put back.
 */
export function useInertOutside(ref: React.RefObject<HTMLElement | null>, active = true) {
  React.useEffect(() => {
    const el = ref.current
    if (!el || !active) return
    const changed: { n: Element; hidden: string | null }[] = []
    for (let node: Element = el; node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sib of Array.from(node.parentElement.children)) {
        if (sib === node || sib.hasAttribute("inert") || sib.tagName === "SCRIPT" || sib.tagName === "STYLE") continue
        changed.push({ n: sib, hidden: sib.getAttribute("aria-hidden") })
        sib.setAttribute("inert", "")
        sib.setAttribute("aria-hidden", "true")
      }
    }
    return () => {
      for (const { n, hidden } of changed) {
        n.removeAttribute("inert")
        if (hidden === null) n.removeAttribute("aria-hidden")
        else n.setAttribute("aria-hidden", hidden)
      }
    }
  }, [ref, active])
}

import { cn } from "@/lib/utils"

/* Small letter badges standing in for app icons in the demos. */
export const badge = (letter: string, className: string) => (
  <span className={cn("flex size-full items-center justify-center text-[9px] font-bold text-white", className)}>
    {letter}
  </span>
)

export const ICONS = {
  notion: badge("N", "bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-900"),
  slack: badge("#", "bg-violet-600"),
  wiki: badge("W", "bg-neutral-500"),
  appstore: badge("A", "bg-sky-500"),
  sensor: badge("S", "bg-orange-500"),
  ads: badge("G", "bg-emerald-600"),
  linear: badge("L", "bg-indigo-500"),
}


import * as React from "react"

import { MegaMenuMorph, type MegaMenuDestination } from "@/components/ui/mega-menu-morph"

export const notes = [
  "One floating surface serves every menu. Its x position, width and height (plus the caret and the footer band) are springs integrated by hand: `a = -k(x - target) - c v`, stepped at 240Hz inside one rAF loop, so retargeting mid-flight keeps the velocity it has. Growing springs may overshoot a little; shrinking springs are clamped at the target so a panel never undershoots.",
  "The size to spring to is the menu's natural size: each menu hangs from the top-left of the surface in an absolutely positioned box with `width: max-content`, and a ResizeObserver reads its `offsetWidth` and `offsetHeight`. Only the open menu and, during a switch, the leaving one are mounted. The new one slides in 36px from the side of the trigger you moved to (`--dir` is the sign of the index difference) while the old one slides out the other way.",
  "Hover intent has two parts. A delay (90ms) before the first menu opens, and a safe triangle for switching: the last few pointer samples are kept in a small ring; when the pointer enters another trigger while a menu is open, one point-in-triangle test (apex = the pointer a moment ago, base = the panel's top corners) decides whether it is heading into the open menu. If so the switch is held for a beat instead of firing. Turn on 'Show safe area' to see it.",
  "The header folds exactly when it stops fitting. An invisible, inert copy of the full row is measured with a ResizeObserver, and the real bar folds into a brand, the primary action and a menu button when its container is narrower than that measurement. The folded sheet animates `height` between 0 and the measured content height, staggers its rows with `animation-delay: calc(var(--i) * 36ms)`, and opens accordion sections with a `grid-template-rows: 0fr -> 1fr` transition.",
  "It follows the disclosure-navigation pattern, not role=\"menu\": triggers are buttons with `aria-expanded` and `aria-controls`, the links inside stay links, and Tab, arrow keys, Home/End, Escape and focus-out are handled by hand because the panel is not next to its trigger in DOM order.",
]

export default function Demo() {
  const [safe, setSafe] = React.useState(false)
  const [current, setCurrent] = React.useState("products")
  const [last, setLast] = React.useState("Choose any destination in the header")
  const go = (d: MegaMenuDestination) => {
    setLast(d.section ? `${d.section} / ${d.label}` : d.label)
    const map: Record<string, string> = { Products: "products", Solutions: "solutions", Developers: "developers", Company: "company", Pricing: "pricing" }
    if (d.section) setCurrent(map[d.section] ?? current)
    else if (map[d.label]) setCurrent(map[d.label])
  }
  return (
    <div className="flex w-full max-w-[960px] flex-col gap-4">
      <div className="relative overflow-hidden rounded-[26px] border border-black/[0.07] bg-white dark:border-white/10 dark:bg-neutral-900" style={{ minHeight: 460 }}>
        <MegaMenuMorph current={current} showSafeArea={safe} onNavigate={go} />
        <div className="px-6 pb-10 sm:px-10" style={{ paddingTop: 48 }}>
          <h3 className="max-w-[16ch] text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-neutral-900 dark:text-neutral-50 sm:text-[38px]">Ship agents you can trust</h3>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            One platform to build, evaluate and watch agents in production, with replay, guardrails and cost tracking built in.
          </p>
          <p className="mt-6 text-[13px] text-neutral-400 dark:text-neutral-500" aria-live="polite">{last}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 text-[13px] text-neutral-500 dark:text-neutral-400">
        <label className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
          <input type="checkbox" className="size-4 accent-neutral-900 dark:accent-white" checked={safe} onChange={(e) => setSafe(e.target.checked)} />
          Show safe area
        </label>
        <span>Move diagonally from a menu into its links, or tab in and use the arrow keys</span>
      </div>
    </div>
  )
}

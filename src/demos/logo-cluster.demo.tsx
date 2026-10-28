import type { StudioProps } from "@/components/motion/backdrop"
import { LogoCluster } from "@/components/illustrations/logo-cluster"

/** An invented mark: a rounded square with a spark, standing in for your product's logo. */
const Mark = (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
    <rect x="3" y="3" width="28" height="28" rx="9" fill="currentColor" />
    <path d="M17 9.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z" fill="#fff" />
  </svg>
)

export default function Demo(props: StudioProps) {
  return (
    <div className="flex w-full justify-center py-4">
      <LogoCluster {...props} mark={Mark} />
    </div>
  )
}

export const notes = [
  "The whole scene is laid out on a 320-unit stage: `container-type: inline-size` makes `100cqw` the container's width, so one unit is `calc(100cqw / 320)` and every size and offset scales with it – no JavaScript resize handling.",
  "Each bubble has a settled position in CSS variables (`--x`, `--y`) applied with the individual `translate` property, and the entrance keyframes only name the start (scale .3, opacity 0, translate 0) – the browser animates to the settled values.",
  "The spring is a cubic-bezier whose second control point sits above 1 – `cubic-bezier(.34, 1.56, .64, 1)` – so the value overshoots the target and eases back. Bubbles are staggered with `animation-delay: calc(.18s + var(--i) * .045s)`.",
  "The orbit wrapper rotates 360° in 48s while every face rotates the same amount in reverse, so the cluster drifts around the disc but each logo stays upright. `rotate`, `translate` and `scale` are separate CSS properties, so they never overwrite each other.",
  "`speed` divides every duration and delay through one `--lc-speed` variable, and `paused` flips `animation-play-state` on everything.",
]

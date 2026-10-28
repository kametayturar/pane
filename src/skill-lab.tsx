import * as React from "react"
import { ArrowUpRight, Columns2, Image as ImageIcon, MonitorPlay } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * "See it in action" – real outputs from the skill lab: the same prompt built by one agent without the skill
 * and one that followed its SKILL.md. Data: public/skill-lab/index.json (scripts/build-skill-lab.mjs).
 */

export type LabExample = { prompt: string; after: string; afterThumb: string; before: string | null; beforeThumb: string | null; changes: string[] }
export type LabSkill = { skillSays: string[]; examples: LabExample[] }
export type LabIndex = { prompts: Record<string, { label: string; text: string }>; skills: Record<string, LabSkill> }

let cache: Promise<LabIndex | null> | null = null
function loadLab() {
  cache ??= fetch("/skill-lab/index.json")
    .then((r) => (r.ok ? (r.json() as Promise<LabIndex>) : null))
    .catch(() => null)
  return cache
}

export function useSkillLab() {
  const [lab, setLab] = React.useState<LabIndex | null>(null)
  React.useEffect(() => {
    let live = true
    loadLab().then((d) => live && setLab(d))
    return () => {
      live = false
    }
  }, [])
  return lab
}

/** Drag the divider to compare the two screenshots. */
function CompareSlider({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = React.useState(50)
  const ref = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef(false)
  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] touch-none overflow-hidden rounded-xl bg-neutral-100 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] select-none dark:bg-white/5 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]"
      onPointerDown={(e) => {
        drag.current = true
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        move(e.clientX)
      }}
      onPointerMove={(e) => drag.current && move(e.clientX)}
      onPointerUp={() => (drag.current = false)}
    >
      <img src={after} alt={`${alt} – with the skill`} className="absolute inset-0 size-full object-cover object-top" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={`${alt} – without the skill`} className="absolute inset-0 size-full object-cover object-top" draggable={false} />
      </div>
      <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-neutral-950/75 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">No skill</span>
      <span className="pointer-events-none absolute top-2 right-2 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">With skill</span>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-neutral-700 shadow-[0_1px_4px_rgb(0_0_0/0.25)]">
          <Columns2 className="size-3.5" />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare without and with the skill"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}

/** A real page in a scaled iframe, laid out at 1280px wide. */
function LiveFrame({ src, title, tone }: { src: string; title: string; tone: "before" | "after" }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = w / 1280
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex items-center gap-2 text-[11.5px] font-medium">
        <span className={cn("rounded px-1.5 py-0.5", tone === "after" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-black/[0.05] text-neutral-500 dark:bg-white/10")}>
          {tone === "after" ? "With skill" : "No skill"}
        </span>
        <a href={src} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-0.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
          Open full page <ArrowUpRight className="size-3" />
        </a>
      </figcaption>
      <div ref={ref} className="relative aspect-[16/10] overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]">
        {w > 0 && (
          <iframe
            src={src}
            title={`${title} – ${tone === "after" ? "with" : "without"} the skill`}
            loading="lazy"
            sandbox="allow-scripts"
            className="absolute top-0 left-0 origin-top-left border-0"
            style={{ width: 1280, height: 800, transform: `scale(${scale})` }}
          />
        )}
      </div>
    </figure>
  )
}

export function SkillInAction({ skillId, lab }: { skillId: string; lab: LabIndex }) {
  const data = lab.skills[skillId]
  const [picked, setPicked] = React.useState<{ skill: string; i: number; live: boolean | null }>({ skill: skillId, i: 0, live: null })
  const i = picked.skill === skillId ? picked.i : 0
  if (!data) return null
  const ex = data.examples[Math.min(i, data.examples.length - 1)]
  // Text-heavy reports (code, terminal) read better side by side than through a slider.
  const chosen = picked.skill === skillId ? picked.live : null
  const live = chosen ?? /^(perf|browser|mcp)/.test(ex.prompt)
  const prompt = lab.prompts[ex.prompt]
  const isMotion = ex.prompt.startsWith("motion") || ex.prompt.startsWith("3d")

  return (
    <section className="mt-5" aria-label="See it in action">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">See it in action</span>
        <span className="text-[11.5px] text-neutral-400">Same prompt · one agent without the skill, one following it</span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <div role="tablist" aria-label="Examples" className="flex flex-wrap gap-1">
          {data.examples.map((e, n) => (
            <button
              key={e.prompt}
              type="button"
              role="tab"
              aria-selected={n === i}
              onClick={() => setPicked({ skill: skillId, i: n, live: chosen })}
              className={cn(
                "h-7 rounded-full px-3 text-[12px] font-medium text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-colors hover:text-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)] dark:hover:text-white",
                n === i && "bg-neutral-900 text-white shadow-none hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:text-neutral-900",
              )}
            >
              {lab.prompts[e.prompt]?.label ?? e.prompt}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="View" className="ml-auto inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/10">
          {[
            { id: false, label: "Compare", icon: ImageIcon },
            { id: true, label: "Live", icon: MonitorPlay },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={live === o.id}
              onClick={() => setPicked({ skill: skillId, i, live: o.id })}
              className={cn(
                "flex h-7 items-center gap-1 rounded-full px-3 text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
                live === o.id && "bg-white text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/15 dark:text-white dark:shadow-none",
              )}
            >
              <o.icon className="size-3" /> {o.label}
            </button>
          ))}
        </div>
      </div>

      {prompt && (
        <p className="mt-2.5 rounded-lg bg-black/[0.03] px-3 py-2 font-mono text-[11.5px] leading-[18px] text-neutral-600 dark:bg-white/[0.05] dark:text-neutral-300">
          <span className="text-neutral-400">Prompt › </span>
          {prompt.text}
        </p>
      )}

      <div className="mt-3">
        {live || !ex.beforeThumb ? (
          <div className="grid gap-3">
            {ex.before && <LiveFrame key={ex.before} src={ex.before} title={prompt?.label ?? ex.prompt} tone="before" />}
            <LiveFrame key={ex.after} src={ex.after} title={prompt?.label ?? ex.prompt} tone="after" />
          </div>
        ) : (
          <>
            <CompareSlider key={ex.afterThumb} before={ex.beforeThumb} after={ex.afterThumb} alt={prompt?.label ?? ex.prompt} />
            <p className="mt-1.5 text-[11.5px] text-neutral-400">
              Drag to compare.{isMotion ? " This one moves – switch to Live to watch both." : " Switch to Live to use the real pages."}
            </p>
          </>
        )}
      </div>

      {ex.changes.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">What the skill changed here</div>
          <ul className="space-y-1.5">
            {ex.changes.map((c) => (
              <li key={c} className="flex gap-2 text-[13px] leading-5 text-neutral-700 dark:text-neutral-200">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.skillSays.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">What the skill tells the agent</div>
          <ul className="space-y-1.5">
            {data.skillSays.map((c) => (
              <li key={c} className="flex gap-2 text-[13px] leading-5 text-neutral-600 dark:text-neutral-300">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/**
 * Card thumbnail: the finished output with the skill, cycling through its examples (soft blur crossfade).
 * Hover or focus the card to wipe in the same prompt without the skill.
 */
export function LabCardThumb({ examples, prompts }: { examples: LabExample[]; prompts: LabIndex["prompts"] }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [i, setI] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "80px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    if (!visible || examples.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % examples.length), 4200 + Math.random() * 1600)
    return () => window.clearInterval(id)
  }, [visible, examples.length])
  const ex = examples[i]
  return (
    <div ref={ref} className="group/lab relative aspect-[16/10] overflow-hidden rounded-xl bg-neutral-100 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] dark:bg-white/5">
      {examples.map((e, n) => (
        <img
          key={e.afterThumb}
          src={e.afterThumb}
          alt=""
          loading="lazy"
          className={cn(
            "absolute inset-0 size-full object-cover object-top transition-[opacity,filter,transform] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none",
            n === i ? "scale-100 opacity-100 blur-0" : "scale-[1.02] opacity-0 blur-[6px]",
          )}
        />
      ))}
      {ex.beforeThumb && (
        <img
          src={ex.beforeThumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-top transition-[clip-path] duration-500 ease-[cubic-bezier(.22,1,.36,1)] [clip-path:inset(0_100%_0_0)] group-hover/card:[clip-path:inset(0_0_0_0)] group-has-[:focus-visible]/card:[clip-path:inset(0_0_0_0)] motion-reduce:transition-none"
        />
      )}
      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white transition-opacity group-hover/card:opacity-0">
        With skill · {prompts[ex.prompt]?.label ?? ex.prompt}
      </span>
      {ex.beforeThumb && (
        <span className="absolute bottom-1.5 left-1.5 rounded bg-neutral-950/75 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/card:opacity-100">
          No skill · same prompt
        </span>
      )}
      {examples.length > 1 && (
        <span className="absolute right-2 bottom-2 flex gap-1" aria-hidden>
          {examples.map((e, n) => (
            <span key={e.prompt} className={cn("h-1 rounded-full bg-white/90 shadow-[0_0_0_0.5px_rgb(0_0_0/0.2)] transition-all duration-500", n === i ? "w-3" : "w-1 opacity-60")} />
          ))}
        </span>
      )}
    </div>
  )
}

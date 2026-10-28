import * as React from "react"
import { createPortal } from "react-dom"
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Film,
  Globe,
  LayoutTemplate,
  LineChart,
  Pause,
  Palette,
  Play,
  Search,
  Sparkles,
  Star,
  Type,
  Waves,
  Accessibility,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { LabCardThumb, SkillInAction, useSkillLab, type LabIndex } from "@/skill-lab"
import { CATEGORY_VISUAL, SkillVisual, SkillVisualStyles, VISUAL_LABEL, type VisualKind, type VisualMode } from "@/skill-visuals"

/** One agent skill (a SKILL.md folder) worth having next to the components. Data: src/data/skills.json */
export type Skill = {
  id: string
  name: string
  description: string
  category: string
  repo: string
  path?: string
  license?: string
  stars?: number
  install: string
  source?: string
  /** One plain sentence: what changes in the agent's output. */
  does?: string
  /** What an agent produces without the skill (very short). */
  before?: string
  /** What an agent produces with the skill (very short). */
  after?: string
  /** 2-4 short use-case tags. */
  bestFor?: string[]
  /** One line you would type to use it. */
  examplePrompt?: string
  /** Which animated before/after scene to show; defaults from the category. */
  visual?: VisualKind
}

// Loaded through a glob so the gallery still builds before the data file exists.
const DATA = import.meta.glob("./data/skills.json", { eager: true, import: "default" }) as Record<string, Skill[]>
export const SKILLS: Skill[] = DATA["./data/skills.json"] ?? []

const OURS_ID = "pane"

const INTENTS = [
  { id: "generic", label: "My UI looks generic", hint: "Taste and craft", cats: ["Design taste", "Frontend craft"], icon: Sparkles },
  { id: "motion", label: "Animations feel off", hint: "Easing and polish", cats: ["Motion"], icon: Waves },
  { id: "a11y", label: "Accessibility and quality", hint: "Audits that fix", cats: ["Accessibility & quality"], icon: Accessibility },
  { id: "system", label: "Design system", hint: "Tokens and themes", cats: ["Design systems"], icon: Palette },
  { id: "media", label: "Video or 3D", hint: "Frames, scenes, shaders", cats: ["Media, video & 3D"], icon: Film },
  { id: "browser", label: "Automate a browser", hint: "Drive and test apps", cats: ["Tools & browser"], icon: Globe },
  { id: "copy", label: "My copy reads badly", hint: "Microcopy to docs", cats: ["Writing & UX copy"], icon: Type },
  { id: "data", label: "Charts and diagrams", hint: "Clear data visuals", cats: ["Data viz"], icon: LineChart },
] as const

type Filter = { kind: "all" } | { kind: "cat"; value: string } | { kind: "intent"; value: string }
type Sort = "stars" | "name"

function formatStars(n?: number) {
  if (!n) return null
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n)
}

function repoLabel(url: string) {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "")
}

function skillUrl(s: Skill) {
  const p = s.path
  if (!p || p === "." || /[\s(]/.test(p)) return s.repo
  return `${s.repo.replace(/\/$/, "")}/tree/HEAD/${p}`
}

function visualOf(s: Skill): VisualKind {
  return s.visual ?? CATEGORY_VISUAL[s.category] ?? "slop"
}

function matches(s: Skill, q: string) {
  if (!q) return true
  const hay = [s.name, s.description, s.does, s.category, s.before, s.after, s.examplePrompt, s.repo, ...(s.bestFor ?? [])].join(" ").toLowerCase()
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t))
}

/* ----------------------------------------------------------------- copy rows */

function useCopied() {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(id)
  }, [copied])
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
  }
  return [copied, copy] as const
}

function InstallRow({ command, className }: { command: string; className?: string }) {
  const [copied, copy] = useCopied()
  return (
    <button
      type="button"
      onClick={() => copy(command)}
      title={command}
      className={cn(
        "relative z-10 flex w-full min-w-0 items-center gap-2 rounded-lg bg-neutral-950 px-3 py-2 text-left font-mono text-[11.5px] text-neutral-300 transition-colors hover:bg-neutral-800 dark:bg-white/[0.06] dark:hover:bg-white/10",
        className,
      )}
    >
      <span className="text-neutral-500">$</span>
      <span className="min-w-0 flex-1 truncate">{command}</span>
      {copied ? <Check className="size-3.5 shrink-0 text-emerald-400" /> : <Copy className="size-3.5 shrink-0 text-neutral-500" />}
      <span className="sr-only">{copied ? "Copied" : "Copy install command"}</span>
    </button>
  )
}

function CopyBlock({ label, text, mono, prefix }: { label: string; text: string; mono?: boolean; prefix?: string }) {
  const [copied, copy] = useCopied()
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">{label}</div>
      <button
        type="button"
        onClick={() => copy(text)}
        className={cn(
          "group flex w-full min-w-0 items-start gap-2 rounded-xl px-3.5 py-3 text-left text-[13px] leading-5 transition-colors",
          mono
            ? "bg-neutral-950 font-mono text-[12px] text-neutral-300 hover:bg-neutral-800 dark:bg-white/[0.06] dark:hover:bg-white/10"
            : "bg-black/[0.035] text-neutral-700 hover:bg-black/[0.06] dark:bg-white/[0.05] dark:text-neutral-200 dark:hover:bg-white/[0.08]",
        )}
      >
        {prefix && <span className="text-neutral-500 select-none">{prefix}</span>}
        <span className="min-w-0 flex-1 break-words">{text}</span>
        {copied ? <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" /> : <Copy className="mt-0.5 size-3.5 shrink-0 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200" />}
        <span className="sr-only">{copied ? "Copied" : `Copy ${label.toLowerCase()}`}</span>
      </button>
    </div>
  )
}

/* ----------------------------------------------------------------- bits */

function StarCount({ n }: { n?: number }) {
  const f = formatStars(n)
  if (!f) return null
  return (
    <span className="flex shrink-0 items-center gap-1 text-[12px] text-neutral-400 tabular-nums">
      <Star className="size-3" /> {f}
    </span>
  )
}

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "amber" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11.5px]",
        tone === "amber" ? "bg-amber-500/10 font-medium text-amber-700 dark:text-amber-300" : "bg-black/[0.05] text-neutral-500 dark:bg-white/10 dark:text-neutral-400",
      )}
    >
      {children}
    </span>
  )
}

function OursBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-neutral-900">
      <Sparkles className="size-3" /> Ours
    </span>
  )
}

/* ----------------------------------------------------------------- card */

function SkillCard({ s, onOpen, featured, lab }: { s: Skill; onOpen: (id: string) => void; featured?: boolean; lab: LabIndex | null }) {
  const labExamples = lab?.skills[s.id]?.examples
  const ours = s.id === OURS_ID
  const before = s.before ?? ""
  const after = s.after ?? ""
  return (
    <article
      className={cn(
        "group/card relative flex min-w-0 flex-col rounded-2xl bg-white p-3 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_8px_24px_-8px_rgb(0_0_0/0.12)] dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)] dark:hover:shadow-[0_0_0_1px_rgb(255_255_255/0.16)]",
        featured && "@3xl:grid @3xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] @3xl:gap-6 @3xl:p-4",
      )}
    >
      {labExamples?.length && lab ? <LabCardThumb examples={labExamples} prompts={lab.prompts} /> : <SkillVisual id={s.id} kind={visualOf(s)} before={before} after={after} size={featured ? "large" : "card"} />}
      <div className={cn("flex min-w-0 flex-1 flex-col", featured && "@3xl:py-1")}>
        <div className="mt-3 flex items-start gap-2 @3xl:mt-0">
          <h2 className={cn("min-w-0 flex-1 font-mono font-medium", featured ? "text-[16px]" : "truncate text-[14px]")}>
            <button
              type="button"
              onClick={() => onOpen(s.id)}
              className="text-left after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-neutral-900/40 dark:focus-visible:after:ring-white/50"
            >
              {s.name}
            </button>
          </h2>
          {ours ? <OursBadge /> : <StarCount n={s.stars} />}
        </div>
        <p className={cn("mt-1 text-[13px] leading-5 text-neutral-600 dark:text-neutral-300", featured ? "" : "line-clamp-2")}>{s.does ?? s.description}</p>
        {featured && <p className="mt-2 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">{s.description}</p>}
        <div className={cn("mt-3 flex items-center gap-1.5", featured ? "flex-wrap" : "flex-nowrap overflow-hidden [&>span]:shrink-0")}>
          <Chip tone="amber">{s.category}</Chip>
          {(s.bestFor ?? []).slice(0, featured ? 4 : 1).map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
        <div className="flex-1" />
        <div className="mt-3 flex items-center gap-2 text-[11.5px]">
          <span className="text-neutral-400">{s.license}</span>
          <a
            href={s.repo}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 ml-auto flex min-w-0 items-center gap-0.5 truncate text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <span className="truncate">{repoLabel(s.repo)}</span>
            <ArrowUpRight className="size-3 shrink-0" />
          </a>
        </div>
        <InstallRow command={s.install} className="mt-2" />
      </div>
    </article>
  )
}

/* ----------------------------------------------------------------- drawer */

function ModeToggle({ mode, onChange }: { mode: VisualMode; onChange: (m: VisualMode) => void }) {
  const opts: { id: VisualMode; label: React.ReactNode }[] = [
    { id: "before", label: "Before" },
    { id: "after", label: "After" },
    { id: "auto", label: mode === "auto" ? <><Pause className="size-3" /> Playing</> : <><Play className="size-3" /> Play</> },
  ]
  return (
    <div role="radiogroup" aria-label="Preview state" className="inline-flex rounded-full bg-black/[0.05] p-0.5 dark:bg-white/10">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={mode === o.id}
          onClick={() => onChange(o.id === "auto" && mode === "auto" ? "after" : o.id)}
          className={cn(
            "flex h-7 items-center gap-1 rounded-full px-3 text-[12px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
            mode === o.id && "bg-white text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06)] hover:text-neutral-900 dark:bg-white/15 dark:text-white dark:shadow-none",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SkillDrawer({ list, activeId, onClose, onNavigate, lab }: { list: Skill[]; activeId: string; onClose: () => void; onNavigate: (id: string) => void; lab: LabIndex | null }) {
  const idx = list.findIndex((s) => s.id === activeId)
  const s = list[idx]
  const [shown, setShown] = React.useState(false)
  const [picked, setPicked] = React.useState<{ id: string; mode: VisualMode }>({ id: activeId, mode: "auto" })
  const mode: VisualMode = picked.id === activeId ? picked.mode : "auto"
  const setMode = (m: VisualMode) => setPicked({ id: activeId, mode: m })
  const panelRef = React.useRef<HTMLDivElement>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const timer = React.useRef(0)

  const close = React.useCallback(() => {
    setShown(false)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(onClose, 220)
  }, [onClose])

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer.current)
      document.body.style.overflow = prev
    }
  }, [])

  const go = React.useCallback(
    (d: number) => {
      const n = list[idx + d]
      if (n) onNavigate(n.id)
    },
    [list, idx, onNavigate],
  )

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
      } else if (e.key === "ArrowLeft" && !(e.target instanceof HTMLInputElement)) go(-1)
      else if (e.key === "ArrowRight" && !(e.target instanceof HTMLInputElement)) go(1)
      else if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close, go])

  if (!s) return null
  const ours = s.id === OURS_ID
  const kind = visualOf(s)
  const hasLab = !!lab?.skills[s.id]

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div
        onClick={close}
        className={cn("absolute inset-0 bg-neutral-950/35 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none", shown ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${s.name} skill`}
        className={cn(
          "absolute top-0 right-0 flex h-dvh w-[min(880px,100vw)] flex-col bg-white shadow-[-1px_0_0_rgb(0_0_0/0.06),-24px_0_60px_-20px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none dark:bg-neutral-950 dark:shadow-[-1px_0_0_rgb(255_255_255/0.08)]",
          shown ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.08]">
          <div className="flex items-center gap-1 text-neutral-400">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={idx <= 0}
              aria-label="Previous skill"
              className="grid size-8 place-items-center rounded-lg hover:bg-black/5 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={idx >= list.length - 1}
              aria-label="Next skill"
              className="grid size-8 place-items-center rounded-lg hover:bg-black/5 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <span className="text-[12px] text-neutral-400 tabular-nums">
            {idx + 1} / {list.length}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="ml-auto grid size-8 place-items-center rounded-lg text-neutral-500 hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 font-mono text-[20px] font-medium tracking-tight break-words">{s.name}</h2>
            {ours && <OursBadge />}
            <div className="ml-auto">
              <StarCount n={s.stars} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip tone="amber">{s.category}</Chip>
            {s.license && <Chip>{s.license}</Chip>}
          </div>

          {hasLab && lab && <SkillInAction skillId={s.id} lab={lab} />}

          <div className={cn("mt-5", hasLab && "hidden")}>
            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="text-[11px] font-medium tracking-wide whitespace-nowrap text-neutral-400 uppercase">What it changes</span>
              <span className="hidden text-[11.5px] text-neutral-400 sm:inline">· {VISUAL_LABEL[kind]}</span>
              <div className="ml-auto">
                <ModeToggle mode={mode} onChange={setMode} />
              </div>
            </div>
            <SkillVisual id={s.id} kind={kind} before={s.before ?? ""} after={s.after ?? ""} size="large" mode={mode} />
          </div>

          <p className="mt-5 text-[15px] leading-6 text-neutral-800 dark:text-neutral-100">{s.does ?? s.description}</p>
          {s.does && s.description.slice(0, 24).toLowerCase() !== s.does.slice(0, 24).toLowerCase() && (
            <p className="mt-2 text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">{s.description}</p>
          )}

          {s.bestFor && s.bestFor.length > 0 && (
            <div className="mt-5">
              <div className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">Best for</div>
              <div className="flex flex-wrap gap-1.5">
                {s.bestFor.map((t) => (
                  <span key={t} className="rounded-full px-2.5 py-1 text-[12px] text-neutral-700 shadow-[0_0_0_1px_rgb(0_0_0/0.09)] dark:text-neutral-200 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {s.examplePrompt && <CopyBlock label="Try this prompt" text={s.examplePrompt} />}
            <CopyBlock label="Install" text={s.install} mono prefix="$" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/[0.06] pt-4 text-[12.5px] text-neutral-500 dark:border-white/[0.08] dark:text-neutral-400">
            <a href={skillUrl(s)} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-neutral-800 hover:underline dark:text-neutral-100">
              <LayoutTemplate className="size-3.5" /> View SKILL.md
              <ArrowUpRight className="size-3" />
            </a>
            <a href={s.repo} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:text-neutral-900 dark:hover:text-white">
              {repoLabel(s.repo)}
              <ArrowUpRight className="size-3" />
            </a>
            <span>Licence: {s.license ?? "Not specified"}</span>
            {s.source && <span className="text-neutral-400">Source: {s.source}</span>}
          </div>
          <p className="mt-3 text-[11.5px] text-neutral-400">Skills belong to their authors. Check the licence before you copy one into a project.</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ----------------------------------------------------------------- page */

export function SkillsPage({ initialId }: { initialId?: string } = {}) {
  const lab = useSkillLab()
  const [filter, setFilter] = React.useState<Filter>({ kind: "all" })
  const [query, setQuery] = React.useState("")
  const [sort, setSort] = React.useState<Sort>("stars")
  const [activeId, setActiveId] = React.useState<string | null>(() => (initialId && SKILLS.some((k) => k.id === initialId) ? initialId : null))
  const lastFocus = React.useRef<HTMLElement | null>(null)

  const categories = React.useMemo(() => [...new Set(SKILLS.map((s) => s.category))], [])
  const searched = React.useMemo(() => SKILLS.filter((s) => matches(s, query.trim())), [query])
  const countFor = (cats: readonly string[]) => searched.filter((s) => cats.includes(s.category)).length

  const list = React.useMemo(() => {
    const cats = filter.kind === "cat" ? [filter.value] : filter.kind === "intent" ? (INTENTS.find((i) => i.id === filter.value)?.cats ?? []) : null
    const base = cats ? searched.filter((s) => (cats as readonly string[]).includes(s.category)) : searched
    const rest = base.filter((s) => s.id !== OURS_ID)
    rest.sort((a, b) => (sort === "stars" ? (b.stars ?? 0) - (a.stars ?? 0) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)))
    const ours = base.find((s) => s.id === OURS_ID)
    return ours ? [ours, ...rest] : rest
  }, [filter, searched, sort])

  const open = (id: string) => {
    lastFocus.current = document.activeElement as HTMLElement | null
    setActiveId(id)
  }
  const closeDrawer = React.useCallback(() => {
    setActiveId(null)
    lastFocus.current?.focus?.()
  }, [])

  const pill = (active: boolean) =>
    cn(
      "h-8 rounded-full px-3 text-[12.5px] font-medium text-neutral-500 shadow-[0_0_0_1px_rgb(0_0_0/0.08)] transition-colors hover:text-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:text-white",
      active && "bg-neutral-900 text-white shadow-none hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:text-neutral-900",
    )

  const activeIntent = filter.kind === "intent" ? INTENTS.find((i) => i.id === filter.value) : undefined

  return (
    <div className="@container">
      <SkillVisualStyles />
      <div className="text-[13px] text-neutral-400">
        Library <span className="mx-1">/</span> <span className="text-neutral-600 dark:text-neutral-300">Skills</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Skills</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-6 text-neutral-500 dark:text-neutral-400">
        Agent skills that carry taste. We ran them: the same prompts built by one agent without the skill and one following it – open a skill to compare the real pages. Each one is open
        source; copy the install command.
      </p>

      {SKILLS.length === 0 ? (
        <p className="mt-10 text-sm text-neutral-400">No skills listed yet.</p>
      ) : (
        <>
          <section className="mt-7" aria-labelledby="skills-picker">
            <h2 id="skills-picker" className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
              What do you want to improve?
            </h2>
            <div className="mt-2.5 grid grid-cols-2 gap-2 @2xl:grid-cols-4">
              {INTENTS.map((it) => {
                const on = filter.kind === "intent" && filter.value === it.id
                const Icon = it.icon
                return (
                  <button
                    key={it.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(on ? { kind: "all" } : { kind: "intent", value: it.id })}
                    className={cn(
                      "group flex min-w-0 items-center gap-2.5 rounded-xl p-2.5 text-left shadow-[0_0_0_1px_rgb(0_0_0/0.07)] transition-[background-color,box-shadow] hover:bg-black/[0.025] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)] dark:hover:bg-white/[0.04]",
                      on && "bg-neutral-900 text-white shadow-none hover:bg-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-white",
                    )}
                  >
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-black/[0.05] text-neutral-600 dark:bg-white/10 dark:text-neutral-300", on && "bg-white/15 text-white dark:bg-neutral-900/10 dark:text-neutral-900")}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-4 font-medium @xl:truncate">{it.label}</span>
                      <span className={cn("hidden truncate text-[11.5px] leading-4 text-neutral-400 @xl:block", on && "text-white/60 dark:text-neutral-900/60")}>{it.hint}</span>
                    </span>
                    <span className={cn("text-[11.5px] text-neutral-400 tabular-nums", on && "text-white/60 dark:text-neutral-900/60")}>{countFor(it.cats)}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <label className="relative min-w-[200px] flex-1">
              <span className="sr-only">Search skills</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search skills, use cases, prompts"
                className="h-10 w-full rounded-xl bg-white pr-9 pl-9 text-[14px] shadow-[0_0_0_1px_rgb(0_0_0/0.09)] outline-none placeholder:text-neutral-400 focus:shadow-[0_0_0_2px_rgb(0_0_0/0.55)] dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)] dark:focus:shadow-[0_0_0_2px_rgb(255_255_255/0.6)] [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-neutral-400 hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </label>
            <div role="radiogroup" aria-label="Sort" className="inline-flex shrink-0 rounded-full bg-black/[0.05] p-0.5 dark:bg-white/10">
              {([
                ["stars", "Most stars"],
                ["name", "A to Z"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={sort === id}
                  onClick={() => setSort(id)}
                  className={cn(
                    "h-9 rounded-full px-3.5 text-[12.5px] font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white",
                    sort === id && "bg-white text-neutral-900 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.06)] dark:bg-white/15 dark:text-white dark:shadow-none",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>button]:shrink-0" role="radiogroup" aria-label="Category">
            <button type="button" role="radio" aria-checked={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })} className={pill(filter.kind === "all")}>
              All<span className="ml-1.5 tabular-nums opacity-50">{searched.length}</span>
            </button>
            {categories.map((c) => {
              const on = filter.kind === "cat" && filter.value === c
              return (
                <button key={c} type="button" role="radio" aria-checked={on} onClick={() => setFilter({ kind: "cat", value: c })} className={pill(on)}>
                  {c}
                  <span className="ml-1.5 tabular-nums opacity-50">{searched.filter((s) => s.category === c).length}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[12.5px] text-neutral-400" aria-live="polite">
            <span>
              {list.length} {list.length === 1 ? "skill" : "skills"}
              {activeIntent ? ` for "${activeIntent.label}"` : ""}
              {query.trim() ? ` matching "${query.trim()}"` : ""}
            </span>
            {(filter.kind !== "all" || query) && (
              <button
                type="button"
                onClick={() => {
                  setFilter({ kind: "all" })
                  setQuery("")
                }}
                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <p className="mt-10 text-sm text-neutral-400">No skill matches that. Try a broader word, or clear the filters.</p>
          ) : (
            <div className="mt-3 grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
              {list.map((s) => (
                <div key={s.id} className={cn("contents", s.id === OURS_ID && "[&>article]:col-span-full")}>
                  <SkillCard s={s} onOpen={open} featured={s.id === OURS_ID} lab={lab} />
                </div>
              ))}
            </div>
          )}

          <p className="mt-8 text-xs text-neutral-400">
            Curated with help from{" "}
            <a href="https://skill-issue.in" target="_blank" rel="noreferrer" className="underline decoration-neutral-300 underline-offset-2">
              Skill Issue
            </a>
            . Skills belong to their authors – check each licence.
          </p>
        </>
      )}

      {activeId && <SkillDrawer list={list} activeId={activeId} onClose={closeDrawer} onNavigate={setActiveId} lab={lab} />}
    </div>
  )
}

import * as React from "react"
import { ArrowUpRight, Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

const SITE = "https://paneui.vercel.app"

const GOALS = [
  { id: "app", label: "Build a whole app", text: "Build the app's main screens fast from Pane's Meridian screens (dashboard, tasks, accounting, finance, ops, research, evals): pick the closest ones, keep their rail and top bar, and fill them with this project's real data, routes and actions." },
  { id: "upgrade", label: "Make my whole site nicer", text: "Upgrade the look and feel of the whole site: calmer, more premium, more alive – keep what works, replace generic sections with fitting Pane pieces." },
  { id: "landing", label: "Build a landing page", text: "Build (or rebuild) the marketing landing page: a strong hero with a live illustration, features, social proof and a clear call to action." },
  { id: "ai-chat", label: "Add an AI chat", text: "Add an AI chat experience to the product: composer, streamed answers with sources, thinking states, tool calls and message actions." },
  { id: "agents", label: "Add agent screens", text: "Add screens for AI agents: runs with plans and approvals, an inbox of background tasks, traces and costs." },
  { id: "dashboard", label: "Make data beautiful", text: "Make the dashboards and data views beautiful: charts, KPIs and tables that animate in and are easy to read." },
  { id: "motion", label: "Add motion & art", text: "Add tasteful motion and illustrations: text reveals, number tickers, backgrounds, and one or two animated scenes where they explain the product." },
  { id: "draw", label: "Draw by hand", text: "Draw one picture in code that looks made by hand with pastel, crayon and pencil, and carries the feeling of my story." },
] as const

type GoalId = (typeof GOALS)[number]["id"]

const STORY_PLACEHOLDER =
  "[Paste a memory here, 100–200 words: where you were, what you heard, what you hoped for or feared, how it ended. It sets the mood only – none of it will be drawn.]"

/** The emotion brief: fixed tools and format, open subject, a story whose feeling the picture carries. */
function buildDrawPrompt(story: string, askFirst: boolean) {
  return [
    `Draw one picture by hand – in code – for this project, the way Pane draws its canvas art (${SITE}).`,
    ``,
    `1. Read ${SITE}/skills/pane/hand-drawn.md first and follow it: the tools, the layering order, the palette, the engineering rules and the "does it look digital?" checklist.`,
    `2. Choose 3–5 dry tools (oil pastel, wax crayon, coloured pencil, chalk, charcoal, conté – or your own). Name them before you write any code, say how each behaves on paper, and use only those.`,
    `3. Draw one 16:9 piece (1920×1080) in JavaScript only, as a Pane-style canvas piece: one self-contained React file with a pure draw(ctx, w, h, t, values), seeded randomness, heavy layers baked once and at most a tiny, slow live layer. No images, no SVG, no libraries. Put it where this project keeps its components and show it on a page.`,
    `4. Colour: a small 1990s cel-anime family (peach, coral, teal, indigo, cream) used with weights. Make something original.`,
    `5. The feeling: read my story below and make a picture that gives a viewer the same feeling. Do not illustrate it – nothing from the story may appear (no place, object, animal or event it mentions) and no people at all. Choose a different scene whose light, weather, distance and colour carry that feeling.`,
    ``,
    `My story:`,
    story.trim() || STORY_PLACEHOLDER,
    ``,
    askFirst
      ? `6. Before drawing, tell me the tools, the scene and the palette you chose and why the scene carries the feeling, then wait for my OK.`
      : `6. Write down the tools, the scene and the palette you chose, then draw.`,
    `7. It must look drawn by a person with those tools: visible directional strokes, pressure, layered colour, paper showing through – never flat fills or anything that looks like an SVG. Use every pixel. The same seed draws the same picture.`,
    `8. Render it and look: the PNG at full size and zoomed into three areas. Fix what looks digital and repeat until you would believe a person drew it. Then show me the final image and say how the scene carries the feeling.`,
  ].join("\n")
}

function buildPrompt(goal: string, extra: string, askFirst: boolean, keepBrand: boolean) {
  return [
    `You're improving this project with Pane – an open-source React UI library for AI products (${SITE}).`,
    ``,
    `My goal: ${goal}${extra.trim() ? `\nDetails: ${extra.trim()}` : ""}`,
    ``,
    `1. Read the catalog: ${SITE}/llms.txt – every component, block, illustration and motion piece, what it's for, and how to install it.`,
    `2. Read the house style: ${SITE}/skills/pane.md – follow it for anything you build or change.`,
    `3. Study this project before touching it: framework, styling setup, routes/pages, components, brand colours and fonts, and what the product does.`,
    askFirst
      ? `4. Propose a plan and wait for my OK: which pages and sections to change, which Pane pieces fit each one (open ${SITE}/#/<slug> to check a piece looks right), and what stays as it is.`
      : `4. Write a short plan (pages, sections, which Pane pieces and why), then carry it out.`,
    `5. Install pieces with \`curl -sO ${SITE}/add.mjs && node add.mjs <slug> <slug>…\` (works in any React project; in a shadcn project \`npx shadcn@latest add ${SITE}/r/<slug>.json\` also works). Each piece is one self-contained file – follow the catalog's setup and theming notes.`,
    `6. Wire them to real content and data from this project – no lorem ipsum, no demo names.${keepBrand ? " Keep my brand: set each piece's accent and font tokens to my colours and type." : ""} Support light and dark mode and mobile.`,
    `7. Verify like a designer: run the app, take screenshots of every changed page on desktop and mobile, compare them with Pane's previews, and fix anything that looks off. Then show me the before/after screenshots and list what you changed.`,
  ].join("\n")
}

export function PromptBuilder() {
  const [goal, setGoal] = React.useState<GoalId>("app")
  const [extra, setExtra] = React.useState("")
  const [askFirst, setAskFirst] = React.useState(true)
  const [keepBrand, setKeepBrand] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const prompt = goal === "draw" ? buildDrawPrompt(extra, askFirst) : buildPrompt(GOALS.find((g) => g.id === goal)!.text, extra, askFirst, keepBrand)

  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = () => {
    navigator.clipboard?.writeText(prompt).catch(() => {})
    setCopied(true)
  }

  return (
    <section
      aria-label="Agent prompt"
      className="overflow-hidden rounded-3xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.04),0_24px_48px_-28px_rgb(0_0_0/0.25)] dark:bg-white/[0.04] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
            Let your agent build it
          </div>
          <h2 className="mt-2 text-[22px] leading-7 font-semibold tracking-tight">Paste one prompt, get a nicer site.</h2>
          <p className="mt-2 text-[13.5px] leading-[21px] text-neutral-500 dark:text-neutral-400">
            Open Claude Code, Cursor or Codex in your project and paste this. Your agent reads the whole Pane catalog, studies your site, picks the
            pieces that fit and builds them in – with your content and your brand.
          </p>

          <div className="mt-5 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">What do you want?</div>
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Goal">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={goal === g.id}
                onClick={() => {
                  setGoal(g.id)
                }}
                className={cn(
                  "h-8 rounded-full px-3 text-[12.5px] font-medium text-neutral-600 shadow-[0_0_0_1px_rgb(0_0_0/0.09)] transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)] dark:hover:text-white",
                  goal === g.id && "bg-neutral-900 text-white shadow-none hover:text-white dark:bg-white dark:text-neutral-900 dark:hover:text-neutral-900",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">{goal === "draw" ? "Your story" : "Anything specific? (optional)"}</span>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={goal === "draw" ? 5 : 2}
              placeholder={
                goal === "draw"
                  ? "Paste a memory, 100–200 words: where you were, what you heard, how it felt. It sets the mood; none of it is drawn."
                  : "e.g. It's a booking app for clinics. Keep the green brand colour. Focus on the pricing page."
              }
              className="mt-2 block w-full resize-none rounded-xl bg-black/[0.03] px-3 py-2 text-[13px] leading-5 text-neutral-900 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] outline-none placeholder:text-neutral-400 focus:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)] dark:bg-white/[0.04] dark:text-white dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12.5px] text-neutral-600 dark:text-neutral-300">
            {[
              { on: askFirst, set: setAskFirst, label: "Show me a plan first" },
              ...(goal === "draw" ? [] : [{ on: keepBrand, set: setKeepBrand, label: "Keep my brand colours" }]),
            ].map((t) => (
              <label key={t.label} className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={t.on} onChange={(e) => t.set(e.target.checked)} className="size-3.5 accent-neutral-900 dark:accent-white" />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-neutral-950 text-neutral-300">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </span>
            <span className="ml-1 font-mono text-[11.5px] text-neutral-500">prompt.md</span>
            <a href={`${SITE}/llms.txt`} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-0.5 font-mono text-[11.5px] text-neutral-500 hover:text-white">
              llms.txt <ArrowUpRight className="size-3" />
            </a>
          </div>
          <pre className="max-h-[340px] min-h-[260px] flex-1 overflow-auto px-4 py-3 font-mono text-[11.5px] leading-[19px] whitespace-pre-wrap lg:h-0 lg:max-h-none lg:min-h-0">{prompt}</pre>
          <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
            <span className="text-[12px] text-neutral-500">Works in Claude Code, Cursor, Codex and any agent that can read a URL.</span>
            <button
              type="button"
              onClick={copy}
              className="ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
            >
              {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

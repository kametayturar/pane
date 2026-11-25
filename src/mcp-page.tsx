import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

const ENDPOINT = "https://paneui.vercel.app/api/mcp"
const EASE = "ease-[cubic-bezier(.22,1,.36,1)]"

type Client = { id: string; label: string; note: React.ReactNode; blocks: { title: string; code: string }[] }

const CLIENTS: Client[] = [
  {
    id: "claude",
    label: "Claude Code",
    note: "One command. It adds Pane for the current project; add --scope user to have it everywhere.",
    blocks: [{ title: "Run in your terminal", code: `claude mcp add --transport http pane ${ENDPOINT}` }],
  },
  {
    id: "cursor",
    label: "Cursor and others",
    note: (
      <>
        Put this in <code className="font-mono text-[12px]">.cursor/mcp.json</code> (or <code className="font-mono text-[12px]">~/.cursor/mcp.json</code> for every project). Any client that reads an <code className="font-mono text-[12px]">mcpServers</code> file with a remote <code className="font-mono text-[12px]">url</code> takes the same snippet.
      </>
    ),
    blocks: [{ title: "mcp.json", code: `{\n  "mcpServers": {\n    "pane": {\n      "url": "${ENDPOINT}"\n    }\n  }\n}` }],
  },
  {
    id: "codex",
    label: "Codex",
    note: (
      <>
        Codex talks to remote Streamable HTTP servers directly through <code className="font-mono text-[12px]">url</code>, so no bridge is needed. On a Codex build that only knows local servers
        (<code className="font-mono text-[12px]">command</code>), run the endpoint through <code className="font-mono text-[12px]">mcp-remote</code> instead.
      </>
    ),
    blocks: [
      { title: "Run in your terminal", code: `codex mcp add pane --url ${ENDPOINT}` },
      { title: "Or add to ~/.codex/config.toml", code: `[mcp_servers.pane]\nurl = "${ENDPOINT}"` },
      { title: "Older Codex, through a bridge", code: `[mcp_servers.pane]\ncommand = "npx"\nargs = ["-y", "mcp-remote", "${ENDPOINT}"]` },
    ],
  },
]

const TOOLS: { name: string; does: string; args: string }[] = [
  { name: "search_pieces", does: "Find pieces by job, interaction or look, best match first.", args: "query, kind, tag, limit" },
  { name: "get_piece", does: "One piece in full: description, tags, install commands and the .tsx source.", args: "slug, source" },
  { name: "list_pieces", does: "Every piece, grouped the way the site groups them.", args: "group, kind" },
  { name: "list_tags", does: "The tag vocabulary with what each tag means and how many pieces carry it.", args: "none" },
  { name: "get_guide", does: "Pane's house style: tokens, type, motion, the Glass recipe, how a piece is built, hand-drawn canvas art, landing pages.", args: "topic" },
  { name: "search_skills", does: "Search the curated agent skills for UI work, with install commands.", args: "query, category, limit" },
]

const PROMPTS = [
  "Use Pane to build an approval step for our agent.",
  "Search Pane for a streaming answer component and add it to this project.",
  "Find a bottom sheet in Pane that drags with velocity, then wire it to our settings screen.",
  "Read Pane's house style, then restyle this card to match.",
  "Which Pane pieces would make a good agent run timeline? Show me two and pick one.",
]

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

function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, copy] = useCopied()
  const Icon = copied ? Check : Copy
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      aria-label={`${label}: ${text.split("\n")[0]}`}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[12px] text-neutral-500 transition-[color,background-color,transform] duration-200 hover:bg-black/[0.04] hover:text-neutral-900 active:scale-[0.97] dark:text-neutral-400 dark:hover:bg-white/[0.07] dark:hover:text-white",
        EASE,
        className,
      )}
    >
      <Icon className="size-3.5" />
      <span className="min-w-[2.6rem] text-left">{copied ? "Copied" : label}</span>
    </button>
  )
}

const surface =
  "bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.03)] dark:bg-white/[0.03] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]"

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-xl", surface)}>
      <figcaption className="flex items-center justify-between gap-3 border-b border-black/[0.06] py-1 pr-1.5 pl-3.5 dark:border-white/[0.08]">
        <span className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">{title}</span>
        <CopyButton text={code} />
      </figcaption>
      <pre className="overflow-x-auto px-3.5 break-all whitespace-pre-wrap sm:break-normal sm:whitespace-pre py-3 font-mono text-[12.5px] leading-6 text-neutral-800 [scrollbar-width:thin] dark:text-neutral-200">
        <code>{code}</code>
      </pre>
    </figure>
  )
}

function Section({ id, title, lead, children }: { id: string; title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="text-[22px] leading-tight font-medium tracking-[-0.01em]">
        {title}
      </h2>
      {lead && <p className="mt-2 max-w-xl text-[14.5px] leading-6 text-neutral-500 dark:text-neutral-400">{lead}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function McpPage() {
  const [active, setActive] = React.useState(CLIENTS[0].id)
  const client = CLIENTS.find((c) => c.id === active) ?? CLIENTS[0]
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})

  const onKey = (e: React.KeyboardEvent) => {
    const i = CLIENTS.findIndex((c) => c.id === active)
    const next = e.key === "ArrowRight" ? (i + 1) % CLIENTS.length : e.key === "ArrowLeft" ? (i - 1 + CLIENTS.length) % CLIENTS.length : -1
    if (next < 0) return
    e.preventDefault()
    setActive(CLIENTS[next].id)
    tabRefs.current[CLIENTS[next].id]?.focus()
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-0.02em]">Pane for your agent</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-6 text-neutral-500 dark:text-neutral-400">
        Pane runs a small MCP server. Connect it once and your agent can search Pane, read a piece&rsquo;s source and follow its house style in any project, without you pasting code or opening the site.
      </p>

      <div className={cn("mt-7 flex items-center gap-1 rounded-xl py-1 pr-1 pl-3.5", surface)}>
        <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-neutral-800 dark:text-neutral-200">{ENDPOINT}</code>
        <CopyButton text={ENDPOINT} label="Copy" />
      </div>
      <p className="mt-2 text-[12.5px] text-neutral-500 dark:text-neutral-400">Streamable HTTP, stateless, read-only, no sign-in.</p>

      <Section id="mcp-setup" title="Connect it" lead="Pick your client. Every command has a copy button.">
        <div role="tablist" aria-label="Client" onKeyDown={onKey} className="flex gap-5 border-b border-black/[0.08] dark:border-white/[0.1]">
          {CLIENTS.map((c) => {
            const on = c.id === active
            return (
              <button
                key={c.id}
                ref={(el) => {
                  tabRefs.current[c.id] = el
                }}
                role="tab"
                id={`mcp-tab-${c.id}`}
                aria-selected={on}
                aria-controls={`mcp-panel-${c.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(c.id)}
                className={cn(
                  "relative -mb-px h-10 text-[13.5px] whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:focus-visible:ring-white/40",
                  EASE,
                  on ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white",
                )}
              >
                {c.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-900 transition-transform duration-300 dark:bg-white motion-reduce:transition-none",
                    EASE,
                    on ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            )
          })}
        </div>
        <div role="tabpanel" id={`mcp-panel-${client.id}`} aria-labelledby={`mcp-tab-${client.id}`} className="pt-4">
          <p className="max-w-xl text-[13.5px] leading-6 text-neutral-500 dark:text-neutral-400">{client.note}</p>
          <div className="mt-3 grid gap-3">
            {client.blocks.map((b) => (
              <CodeBlock key={b.title} {...b} />
            ))}
          </div>
        </div>
      </Section>

      <Section id="mcp-tools" title="Six tools" lead="Your agent picks them itself. All are read-only: nothing is written to your project until the agent writes it.">
        <ul className={cn("divide-y divide-black/[0.06] overflow-hidden rounded-xl dark:divide-white/[0.08]", surface)}>
          {TOOLS.map((t) => (
            <li key={t.name} className="grid gap-x-6 gap-y-1 px-4 py-3.5 sm:grid-cols-[11rem_1fr]">
              <code className="font-mono text-[13px] text-neutral-900 dark:text-white">{t.name}</code>
              <div className="min-w-0">
                <p className="text-[13.5px] leading-5 text-neutral-700 dark:text-neutral-300">{t.does}</p>
                <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400">
                  Arguments: <span className="font-mono">{t.args}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="mcp-prompts" title="Things to ask" lead="Say &ldquo;Pane&rdquo; and the agent knows where to look.">
        <ul className="grid gap-2">
          {PROMPTS.map((p) => (
            <li key={p} className={cn("flex items-center gap-2 rounded-xl py-1.5 pr-1.5 pl-4", surface)}>
              <span className="min-w-0 flex-1 py-1 text-[14px] leading-5 text-neutral-800 dark:text-neutral-200">{p}</span>
              <CopyButton text={p} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="mcp-why" title="Why an MCP">
        <p className="max-w-xl text-[14.5px] leading-6 text-neutral-600 dark:text-neutral-300">
          A skill teaches your agent how Pane looks; the MCP lets it fetch the actual pieces. It searches by the job you describe, reads the one-file source and the install command, and builds from it in whatever project
          you have open.
        </p>
        <p className="mt-3 max-w-xl text-[13px] leading-5 text-neutral-500 dark:text-neutral-400">
          Prefer plain files? Everything here is also on the{" "}
          <a href="#/skills" className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900 dark:decoration-neutral-600 dark:hover:text-white">
            Skills page
          </a>
          .
        </p>
      </Section>
    </div>
  )
}

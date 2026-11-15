import * as React from "react"

import { ActionDrum } from "@/components/ui/action-drum"
import { Drawer } from "@/components/ui/drawer"
import { HoldToConfirm } from "@/components/ui/hold-to-confirm"
import { Modal } from "@/components/ui/modal"
import { PlanWords } from "@/components/ui/plan-words"
import { Popover } from "@/components/ui/popover"
import { ScopeWords } from "@/components/ui/scope-words"
import { SwipeRow, type SwipeRowItem } from "@/components/ui/swipe-row"
import { Tooltip } from "@/components/ui/tooltip"
import {
  createAgentBridge,
  registerWebMCP,
  webMCPSupported,
  type AgentArg,
  type AgentBridge,
  type AgentEvent,
  type AgentRequest,
  type AgentResult,
  type AgentSnapshotEntry,
} from "@/lib/agent-bridge"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*                                   Tokens                                   */
/* -------------------------------------------------------------------------- */

const EASE = "ease-[cubic-bezier(.22,1,.36,1)]"
const MONO = "font-[family-name:'Geist_Mono',ui-monospace,SFMono-Regular,monospace]"
const T1 = "text-black/[.88] dark:text-white/[.9]"
const T2 = "text-black/[.62] dark:text-white/[.66]"
const T3 = "text-black/[.55] dark:text-white/[.52]"
const LINE = "border-black/[0.07] dark:border-white/[0.09]"
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 dark:focus-visible:ring-white/35"
const surface = "bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_rgb(0_0_0/0.03)] dark:bg-[#141414] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.09)]"
const btnBase = cn("inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-[13px] transition-[transform,background-color,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none", EASE, FOCUS)
const btnPrimary = cn(btnBase, "bg-neutral-900 font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200")
const btnQuiet = cn(btnBase, "text-black/70 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.09)] hover:bg-black/[0.04] dark:text-white/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] dark:hover:bg-white/[0.06]")
const field = cn("h-8 min-w-0 rounded-lg bg-transparent px-2 text-[12.5px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] dark:[color-scheme:dark]", MONO, T1, FOCUS)

/* -------------------------------------------------------------------------- */
/*                                 The script                                 */
/* -------------------------------------------------------------------------- */

const INBOX: SwipeRowItem[] = [
  { id: "invoice", title: "Northwind invoice is $180 over", meta: "Atlas · needs a decision", time: "09:41" },
  { id: "reply", title: "Reply to Harbor & Finch", meta: "Quill · draft ready to send", time: "09:12" },
  { id: "spend", title: "Q3 spend summary", meta: "Sage · 4 pages", time: "08:50" },
  { id: "renewal", title: "Renewal terms changed", meta: "Atlas · Northwind", time: "Mon" },
]

type Ctx = { agent: AgentBridge; wait: (ms: number) => Promise<void> }
type Step = { say: string; run: (c: Ctx) => unknown }

const SCRIPT: Step[] = [
  { say: "Read what is on the page.", run: (c) => c.agent.snapshot() },
  { say: "Open the Sort panel.", run: (c) => c.agent.act("popover", "open", { id: "sort" }) },
  { say: "Show what the Retry button does.", run: (c) => c.agent.act("tooltip", "show", { id: "retry" }) },
  { say: "Close the panel again.", run: (c) => c.agent.act("popover", "close") },
  { say: "And hide the tip.", run: (c) => c.agent.act("tooltip", "hide") },
  { say: "Pull the drawer up to full height.", run: (c) => c.agent.act("drawer", "snapTo", { snap: 0.9 }) },
  { say: "Roll the drum to Hold for review.", run: (c) => c.agent.act("drum", "select", { id: "hold" }) },
  { say: "Show the actions on the Northwind invoice.", run: (c) => c.agent.act("inbox", "reveal", { id: "invoice", side: "right" }) },
  { say: "A wrong argument: rows have no side called up.", run: (c) => c.agent.act("inbox", "reveal", { id: "invoice", side: "up" }) },
  { say: "Delete the workspace. This commits something, so it waits for you.", run: (c) => c.agent.act("hold", "confirm") },
  { say: "Give Quill send access, once.", run: (c) => c.agent.act("scope", "grant", { id: "once" }) },
  { say: "Ask before reconciling invoices.", run: (c) => c.agent.act("plan", "setMode", { step: "invoices", mode: "ask" }) },
  { say: "Start the plan.", run: (c) => c.agent.act("plan", "go") },
  {
    say: "Open the dialog, read the page, close it. The console is inert while the dialog is open, so this runs as one step.",
    run: async (c) => {
      const r = await c.agent.act("modal", "open")
      if (!r.ok) return
      await c.wait(1300)
      c.agent.snapshot()
      await c.wait(900)
      await c.agent.act("modal", "dismiss")
    },
  },
  { say: "Read the page again.", run: (c) => c.agent.snapshot() },
]

/* -------------------------------------------------------------------------- */
/*                                 Transcript                                 */
/* -------------------------------------------------------------------------- */

type Caller = "agent" | "you" | "browser agent" | "console"
type PromptStatus = "pending" | "allowed" | "denied" | "withdrawn"
type Line =
  | { id: number; kind: "say"; text: string }
  | { id: number; kind: "call"; caller: Caller; text: string }
  | { id: number; kind: "snapshot"; caller: Caller; entries: AgentSnapshotEntry[]; prev: AgentSnapshotEntry[] | null }
  | { id: number; kind: "result"; result: AgentResult; ms: number }
  | { id: number; kind: "change"; ref: string; value: unknown; source: "agent" | "page" }
  | { id: number; kind: "prompt"; pid: number }
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
type NewLine = DistOmit<Line, "id">
type Prompt = { request: AgentRequest; status: PromptStatus }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/** A value as short readable text: lists of objects (items, options, steps) and snap points are left out. */
function brief(value: unknown, top = true): string {
  if (Array.isArray(value)) return `[${value.map((v) => brief(v, false)).join(", ")}]`
  if (isObj(value)) {
    const parts = Object.entries(value)
      .filter(([k, v]) => !(top && (k === "snapPoints" || (Array.isArray(v) && v.some(isObj)))))
      .map(([k, v]) => `${k}: ${brief(v, false)}`)
    return top ? parts.join(", ") : `{ ${parts.join(", ")} }`
  }
  return JSON.stringify(value) ?? "undefined"
}

const argText = (args: Record<string, unknown>) =>
  Object.keys(args).length ? `, { ${Object.entries(args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")} }` : ""
const callText = (ref: string, action: string, args: Record<string, unknown>) => `act(${JSON.stringify(ref)}, ${JSON.stringify(action)}${argText(args)})`

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))
const reduceMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

function useMedia(query: string) {
  return React.useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

type Agents = { raw: AgentBridge; script: AgentBridge; you: AgentBridge }
type WebMCPState = "checking" | "accepted" | "unlisted" | "unavailable"

export default function AgentOperablePage() {
  const wide = useMedia("(min-width: 1024px)")
  const [agents, setAgents] = React.useState<Agents | null>(null)
  const [lines, setLines] = React.useState<Line[]>([])
  const [prompts, setPrompts] = React.useState<Record<number, Prompt>>({})
  const [snap, setSnap] = React.useState<AgentSnapshotEntry[]>([])
  const [acting, setActing] = React.useState<string | null>(null)
  const [next, setNext] = React.useState(0)
  const [mode, setMode] = React.useState<"idle" | "run" | "step">("idle")
  const [piecesKey, setPiecesKey] = React.useState(0)
  const [webmcp, setWebmcp] = React.useState<WebMCPState>("checking")
  const [announce, setAnnounce] = React.useState("")
  const [pressed, setPressed] = React.useState("")

  const lineId = React.useRef(0)
  const promptId = React.useRef(0)
  const gen = React.useRef(0)
  const lastSnap = React.useRef<AgentSnapshotEntry[] | null>(null)
  const resolvers = React.useRef(new Map<number, (ok: boolean, status: PromptStatus) => void>())
  const consoleRef = React.useRef<HTMLElement>(null)
  const logRef = React.useRef<HTMLOListElement>(null)
  const stickLog = React.useRef(true)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const focusBack = React.useRef<HTMLElement | null>(null)
  const wideRef = React.useRef(wide)
  wideRef.current = wide

  const push = React.useCallback((line: NewLine, at = gen.current) => {
    if (at !== gen.current) return
    setLines((ls) => [...ls, { ...line, id: ++lineId.current } as Line])
  }, [])

  /** Scrolls a piece into view when it is not already fully visible (below the sticky console on narrow screens). */
  const reveal = React.useCallback((ref: string) => {
    const el = document.querySelector<HTMLElement>(`[data-piece="${CSS.escape(ref)}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const top = wideRef.current ? 0 : (consoleRef.current?.getBoundingClientRect().bottom ?? 0)
    if (r.top >= top && r.bottom <= window.innerHeight) return
    el.scrollIntoView({ block: wideRef.current && r.height < window.innerHeight - 64 ? "center" : "start", behavior: reduceMotion() ? "auto" : "smooth" })
  }, [])

  /* ---- the bridge: one per page, destroyed on unmount ---- */
  React.useEffect(() => {
    const raw = createAgentBridge({
      // Harmless requests pass at once; destructive ones wait for Allow or Deny in the transcript.
      allow: (request, { signal }) => {
        if (!request.destructive) return true
        if (signal.aborted) return false
        return new Promise<boolean>((resolve) => {
          const pid = ++promptId.current
          const at = gen.current
          const onAbort = () => settle(false, "withdrawn")
          function settle(ok: boolean, status: PromptStatus) {
            if (!resolvers.current.has(pid)) return
            resolvers.current.delete(pid)
            signal.removeEventListener("abort", onAbort)
            if (status === "withdrawn") setLines((ls) => ls.filter((l) => !(l.kind === "prompt" && l.pid === pid)))
            setPrompts((p) => ({ ...p, [pid]: { request, status } }))
            resolve(ok)
          }
          signal.addEventListener("abort", onAbort, { once: true })
          resolvers.current.set(pid, settle)
          setPrompts((p) => ({ ...p, [pid]: { request, status: "pending" } }))
          push({ kind: "prompt", pid }, at)
          setAnnounce(`Approval needed: ${request.reason ?? `${request.action} on ${request.ref}`}. Allow or Deny it in the transcript.`)
        })
      },
    })

    /** The same bridge, with every call written to the transcript under who made it. */
    const logged = (caller: Caller): AgentBridge => ({
      ...raw,
      snapshot() {
        const entries = raw.snapshot()
        push({ kind: "snapshot", caller, entries, prev: lastSnap.current })
        lastSnap.current = entries
        return entries
      },
      async act(ref, action, args = {}) {
        const at = gen.current
        const target = raw.snapshot().find((p) => p.ref === ref || p.label.trim().toLowerCase() === String(ref).trim().toLowerCase())?.ref
        push({ kind: "call", caller, text: callText(ref, action, args) }, at)
        if (target) {
          setActing(target)
          reveal(target)
        }
        const t0 = performance.now()
        const result = await raw.act(ref, action, args)
        if (target) setActing((a) => (a === target ? null : a))
        push({ kind: "result", result, ms: Math.round(performance.now() - t0) }, at)
        return result
      },
    })

    const off = raw.subscribe((event: AgentEvent) => {
      if (event.type === "change") push({ kind: "change", ref: event.ref, value: event.value, source: event.source })
      setSnap(raw.snapshot())
    })
    setAgents({ raw, script: logged("agent"), you: logged("you") })
    setSnap(raw.snapshot())

    // The Tooltip's toolbar has no prop that turns its built-in cursor loop off; it ends at the first
    // pointerdown anywhere. Send it one on <body> (no bubbling: nothing else hears it) so the page starts still.
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: false }))

    // WebMCP: hand the two tools to the browser's own agent, when the browser has one.
    const unregister = registerWebMCP(logged("browser agent"))
    let live = true
    if (!webMCPSupported()) setWebmcp("unavailable")
    else {
      const mc = (document as unknown as { modelContext?: { getTools?: () => Promise<{ name: string }[]> | { name: string }[] } }).modelContext
      Promise.resolve(mc?.getTools?.())
        .then((tools) => live && setWebmcp(Array.isArray(tools) && tools.some((t) => t.name === "pane_act") ? "accepted" : "unlisted"))
        .catch(() => live && setWebmcp("unlisted"))
    }

    // dev only, for docs/review/agent-operable.mjs: the bridge with its calls logged as "console", and
    // peek(), a snapshot that is not written to the transcript
    const w = window as unknown as { __paneAgent?: AgentBridge & { peek: () => AgentSnapshotEntry[] } }
    if (import.meta.env.DEV) w.__paneAgent = { ...logged("console"), peek: () => raw.snapshot() }
    const pending = resolvers.current
    return () => {
      live = false
      off()
      unregister()
      raw.destroy()
      for (const settle of [...pending.values()]) settle(false, "withdrawn")
      if (import.meta.env.DEV) delete w.__paneAgent
    }
  }, [push, reveal])

  /* ---- the script ---- */
  const ctx = React.useCallback((): Ctx | null => (agents ? { agent: agents.script, wait: sleep } : null), [agents])

  const runStep = async (i: number, at: number) => {
    const c = ctx()
    if (!c || at !== gen.current) return false
    push({ kind: "say", text: SCRIPT[i].say }, at)
    setNext(i + 1)
    await SCRIPT[i].run(c)
    return at === gen.current
  }

  const play = async (all: boolean) => {
    if (mode !== "idle" || next >= SCRIPT.length) return
    const at = gen.current
    setMode(all ? "run" : "step")
    let i = next
    try {
      do {
        if (!(await runStep(i, at))) return
        i++
        if (all && i < SCRIPT.length) await sleep(650)
      } while (all && i < SCRIPT.length && at === gen.current)
    } finally {
      if (at === gen.current) setMode("idle")
    }
  }

  const reset = () => {
    focusBack.current = document.activeElement as HTMLElement | null
    gen.current++
    for (const settle of [...resolvers.current.values()]) settle(false, "withdrawn")
    lastSnap.current = null
    setLines([])
    setPrompts({})
    setNext(0)
    setMode("idle")
    setActing(null)
    setPressed("")
    setAnnounce("")
    setPiecesKey((k) => k + 1)
  }

  const answer = (pid: number, ok: boolean) => {
    const inPrompt = !!(document.activeElement as HTMLElement | null)?.closest?.(`[data-prompt="${pid}"]`)
    resolvers.current.get(pid)?.(ok, ok ? "allowed" : "denied")
    setAnnounce(ok ? "Allowed." : "Denied.")
    // the buttons go away; keep keyboard focus in the transcript rather than dropping it on <body>
    if (inPrompt) requestAnimationFrame(() => logRef.current?.focus({ preventScroll: true }))
  }

  // Modal, when it is not playing its demo, puts focus on its trigger as it mounts (see the report on
  // modal.tsx). Give focus back to where the person had it (Reset), or to nothing on first load.
  React.useEffect(() => {
    const a = document.activeElement as HTMLElement | null
    if (!a?.closest?.('[data-piece="modal"]')) return
    const back = focusBack.current
    if (back?.isConnected && back !== a) back.focus({ preventScroll: true })
    else a.blur()
  }, [piecesKey])

  /* ---- transcript follows new lines unless the person scrolled up ---- */
  // Not while a press is held inside it: a line that arrives between press and release (pressing Deny
  // closes an open popover, which logs a change) would move the button from under the pointer and lose the click.
  const holdLog = React.useRef(false)
  React.useLayoutEffect(() => {
    const el = logRef.current
    if (el && stickLog.current && !holdLog.current) el.scrollTop = el.scrollHeight
  }, [lines])
  React.useEffect(() => {
    const release = () => {
      if (!holdLog.current) return
      holdLog.current = false
      const el = logRef.current
      if (el && stickLog.current) el.scrollTop = el.scrollHeight
    }
    window.addEventListener("pointerup", release)
    window.addEventListener("pointercancel", release)
    return () => {
      window.removeEventListener("pointerup", release)
      window.removeEventListener("pointercancel", release)
    }
  }, [])

  /* ---- narrow screens: pieces scroll in below the sticky console ---- */
  React.useEffect(() => {
    const el = consoleRef.current
    const grid = gridRef.current
    if (!el || !grid) return
    const ro = new ResizeObserver(() => grid.style.setProperty("--agent-console", `${Math.round(el.getBoundingClientRect().height)}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const done = next >= SCRIPT.length
  const pendingPrompt = Object.values(prompts).some((p) => p.status === "pending")
  const status = mode === "run" && pendingPrompt ? "Waiting for you" : mode !== "idle" ? "Running" : done ? "End of script" : next === 0 ? "Ready" : "Paused"

  return (
    <div className="pb-16">
      <style>{"@keyframes agent-line { from { opacity: 0; transform: translateY(3px) } }"}</style>
      <h1 className={cn("text-[40px] leading-[1.05] font-medium tracking-[-0.02em]", T1)}>Agent-operable</h1>
      <p className={cn("mt-3 max-w-2xl text-[15px] leading-6", T2)}>
        Nine Pane pieces describe themselves to an agent and accept its actions through their own handlers. An agent reads the page with <code className={cn(MONO, "text-[13.5px]")}>snapshot()</code> and operates it with{" "}
        <code className={cn(MONO, "text-[13.5px]")}>act()</code>; anything that commits on your behalf waits for your approval.
      </p>
      <p className={cn("mt-3 max-w-2xl text-[13px] leading-5", T3)}>
        The agent here is a script: no model runs on this page. Every line below is a real call to the bridge on this page and shows what really came back. The pieces are live, so you can also use them yourself.
      </p>
      <p className={cn("mt-2 max-w-2xl text-[12.5px] leading-5", T3)} data-webmcp={webmcp}>
        <span className={cn("font-medium", T2)}>WebMCP</span>
        <span className="mx-1.5">·</span>
        {webmcp === "accepted" ? (
          <>
            This browser took the page&rsquo;s two tools, <code className={MONO}>pane_snapshot</code> and <code className={MONO}>pane_act</code>, so its own agent can call them; its calls show up in the transcript as{" "}
            <span className={MONO}>browser agent</span>.
          </>
        ) : webmcp === "unlisted" ? (
          <>This browser has <code className={MONO}>document.modelContext</code> but did not list the page&rsquo;s tools.</>
        ) : webmcp === "unavailable" ? (
          <>
            Not available in this browser. Chrome 157 has <code className={MONO}>document.modelContext</code> only behind <code className={MONO}>chrome://flags/#enable-webmcp-testing</code> or an origin trial; with it, the page
            registers <code className={MONO}>pane_snapshot</code> and <code className={MONO}>pane_act</code> for the browser&rsquo;s own agent.
          </>
        ) : (
          "Checking…"
        )}
      </p>

      <div ref={gridRef} className="mt-9 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        {/* ---------------------------------------------------------- console */}
        <aside
          ref={consoleRef}
          aria-label="Agent console"
          data-agent-console=""
          className={cn("sticky top-[60px] z-20 flex flex-col self-start overflow-hidden rounded-2xl md:top-4 lg:top-8 lg:h-[calc(100dvh-4rem)] lg:max-h-[860px]", surface)}
        >
          <div className={cn("flex items-center gap-2 border-b px-3 py-2.5", LINE)}>
            <button type="button" className={btnPrimary} disabled={!agents || mode !== "idle" || done} onClick={() => void play(true)} data-ctl="run">
              Run
            </button>
            <button type="button" className={btnQuiet} disabled={!agents || mode !== "idle" || done} onClick={() => void play(false)} data-ctl="step">
              Step
            </button>
            <button type="button" className={btnQuiet} onClick={reset} data-ctl="reset">
              Reset
            </button>
            <span className={cn("ml-auto text-right text-[12px] tabular-nums", T3)} data-status={status}>
              {status}
              <span className="ml-1.5">
                {Math.min(next, SCRIPT.length)}/{SCRIPT.length}
              </span>
            </span>
          </div>

          <ol
            ref={logRef}
            tabIndex={-1}
            aria-label="Transcript"
            onPointerDown={() => (holdLog.current = true)}
            onScroll={(e) => {
              const el = e.currentTarget
              stickLog.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
            }}
            className={cn("min-h-[120px] overflow-y-auto overscroll-contain px-3 py-3 outline-none [scrollbar-width:thin] max-lg:max-h-[30dvh] lg:flex-1", MONO)}
          >
            {lines.length === 0 && (
              <li className={cn("px-1 py-1 text-[12.5px] leading-5 font-sans", T3)}>Press Run to play the script, or Step to make one call at a time.</li>
            )}
            {lines.map((l) => (
              <TranscriptLine key={l.id} line={l} prompt={l.kind === "prompt" ? prompts[l.pid] : undefined} onAnswer={answer} />
            ))}
          </ol>

          <TryIt agent={agents?.you ?? null} snap={snap} defaultOpen={wide} />

          <p className="sr-only" role="status" aria-live="polite">
            {announce}
          </p>
        </aside>

        {/* ----------------------------------------------------------- pieces */}
        <div key={piecesKey} className="grid min-w-0 gap-14" style={{ "--agent-gap": "16px" } as React.CSSProperties}>
          <Piece ref_="popover" kind="popover" acting={acting}>
            <Popover agentId="popover" defaultValue={null} />
          </Piece>
          <Piece ref_="tooltip" kind="tooltip" acting={acting} note={pressed ? `pressed ${pressed}` : undefined}>
            <Tooltip agentId="tooltip" onSelect={(item) => setPressed(String(item.label))} />
          </Piece>
          <Piece ref_="drawer" kind="drawer" acting={acting}>
            <Drawer agentId="drawer" onOpenChange={() => {}} />
          </Piece>
          <Piece ref_="drum" kind="action-drum" acting={acting}>
            <ActionDrum agentId="drum" demo={false} />
          </Piece>
          <Piece ref_="inbox" kind="swipe-row" acting={acting}>
            <SwipeRow agentId="inbox" items={INBOX} />
          </Piece>
          <Piece ref_="hold" kind="hold-to-confirm" acting={acting}>
            <HoldToConfirm agentId="hold" onConfirm={() => {}} onReset={() => {}} />
          </Piece>
          <Piece ref_="scope" kind="scope-words" acting={acting}>
            <ScopeWords agentId="scope" autoPlay={false} />
          </Piece>
          <Piece ref_="plan" kind="plan-words" acting={acting}>
            <PlanWords agentId="plan" autoPlay={false} />
          </Piece>
          <Piece
            ref_="modal"
            kind="modal"
            acting={acting}
            footnote="While this dialog is open the rest of the document is inert, this console included, so an Allow button here could not be pressed. That is why the script never calls its confirm: an approval UI must not live in the part of the page a modal makes inert."
          >
            <Modal agentId="modal" autoplay={false} />
          </Piece>
        </div>
      </div>


      <HowItWorks />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Pieces                                   */
/* -------------------------------------------------------------------------- */

function Piece({ ref_, kind, acting, note, footnote, children }: { ref_: string; kind: string; acting: string | null; note?: string; footnote?: string; children: React.ReactNode }) {
  const on = acting === ref_
  return (
    <figure
      data-piece={ref_}
      data-acting={on || undefined}
      className={cn(
        "relative min-w-0 scroll-mt-[calc(var(--agent-console,0px)+88px)] rounded-2xl outline outline-1 outline-offset-[6px] sm:outline-offset-[10px] transition-[outline-color] duration-300 md:scroll-mt-[calc(var(--agent-console,0px)+32px)] lg:scroll-mt-8 motion-reduce:transition-none",
        EASE,
        on ? "outline-black/[0.16] dark:outline-white/[0.2]" : "outline-transparent",
      )}
    >
      <figcaption className={cn("mb-4 flex items-baseline gap-2 border-b pb-2 text-[12px]", LINE, MONO)}>
        <span className={cn(T1, on && "font-semibold")}>{ref_}</span>
        <span className={T3}>{kind}</span>
        {note && <span className={cn("ml-auto truncate", T3)}>{note}</span>}
      </figcaption>
      <div className="flex justify-center">{children}</div>
      {footnote && <p className={cn("mx-auto mt-4 max-w-[440px] text-[12.5px] leading-5", T3)}>{footnote}</p>}
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Transcript line                              */
/* -------------------------------------------------------------------------- */

const enter = "motion-safe:animate-[agent-line_.32s_cubic-bezier(.22,1,.36,1)_backwards]"

function Gutter({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={cn("w-13 shrink-0 text-[11.5px] leading-5", strong ? cn("font-semibold", T1) : T3)}>{children}</span>
}

function TranscriptLine({ line, prompt, onAnswer }: { line: Line; prompt?: Prompt; onAnswer: (pid: number, ok: boolean) => void }) {
  const row = cn("flex gap-2 px-1 py-0.5 text-[12px] leading-5", enter)
  switch (line.kind) {
    case "say":
      return (
        <li data-line="say" className={cn("mt-3 px-1 pb-0.5 font-sans text-[12.5px] leading-5 first:mt-0", T2, enter)}>
          {line.text}
        </li>
      )
    case "call":
      return (
        <li data-line="call" data-caller={line.caller} className={row}>
          <Gutter>{line.caller === "browser agent" ? "browser" : line.caller}</Gutter>
          <span className={cn("min-w-0 break-words", T1)}>{line.text}</span>
        </li>
      )
    case "snapshot":
      return <SnapshotLine line={line} />
    case "result": {
      const r = line.result
      const ms = line.ms >= 1000 ? `${(line.ms / 1000).toFixed(1)} s` : `${line.ms} ms`
      return (
        <li data-line="result" data-ok={r.ok} data-code={r.ok ? "ok" : r.error.code} data-ref={r.ref} data-action={r.action} className={row}>
          <Gutter strong>{r.ok ? "ok" : "error"}</Gutter>
          <span className={cn("min-w-0 flex-1 break-words", r.ok ? T2 : T1)}>
            {r.ok ? brief(r.value) || "done" : <><span className="font-semibold">{r.error.code}</span> {r.error.message}</>}
          </span>
          <span className={cn("shrink-0 tabular-nums", T3)}>{ms}</span>
        </li>
      )
    }
    case "change":
      return (
        <li data-line="change" data-source={line.source} data-ref={line.ref} className={cn(row, T3)}>
          <Gutter>change</Gutter>
          <span className="min-w-0 flex-1 break-words">
            {line.ref} {brief(line.value)} <span className="whitespace-nowrap">· source: {line.source}</span>
          </span>
        </li>
      )
    case "prompt": {
      if (!prompt) return null
      const { request, status } = prompt
      return (
        <li data-line="prompt" data-prompt={line.pid} data-status={status} className={cn("my-2 rounded-xl px-3 py-2.5 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.09)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]", enter)}>
          <p className={cn("text-[11.5px] leading-5", T3)}>
            <span className={cn("font-semibold", T1)}>needs approval</span>
            <span className="mx-1.5">·</span>
            {request.ref} {request.action}
          </p>
          <p className={cn("mt-1 font-sans text-[13px] leading-5", T1)}>{request.reason ?? `${request.action} on ${request.label}`}</p>
          {status === "pending" ? (
            <div className="mt-2.5 flex gap-2 font-sans">
              <button type="button" className={btnPrimary} onClick={() => onAnswer(line.pid, true)} data-answer="allow">
                Allow
              </button>
              <button type="button" className={btnQuiet} onClick={() => onAnswer(line.pid, false)} data-answer="deny">
                Deny
              </button>
            </div>
          ) : (
            <p className={cn("mt-1.5 text-[11.5px] leading-5", T3)}>
              <span className={cn("font-semibold", T2)}>{status}</span> {status === "withdrawn" ? "" : "by you"}
            </p>
          )}
        </li>
      )
    }
  }
}

function SnapshotLine({ line }: { line: Extract<Line, { kind: "snapshot" }> }) {
  const { entries, prev, caller } = line
  const before = new Map((prev ?? []).map((e) => [e.ref, JSON.stringify(e.value)]))
  const changed = prev ? entries.filter((e) => before.get(e.ref) !== JSON.stringify(e.value)) : entries
  const shown = changed
  return (
    <li data-line="snapshot" data-caller={caller} data-count={entries.length} className={cn("px-1 py-0.5 text-[12px] leading-5", enter)}>
      <div className="flex gap-2">
        <Gutter>{caller === "browser agent" ? "browser" : caller}</Gutter>
        <span className={T1}>snapshot()</span>
      </div>
      <div className="flex gap-2">
        <Gutter strong>ok</Gutter>
        <span className={T2}>
          {entries.length} pieces{prev ? `, ${changed.length} changed since the last snapshot` : ""}
        </span>
      </div>
      {shown.length > 0 && (
        <ul className="mt-1 mb-1 ml-15 grid gap-0.5">
          {shown.map((e) => (
            <li key={e.ref} data-snap-ref={e.ref} className="flex gap-2" title={e.label}>
              <span className={cn("w-14 shrink-0 truncate", T1)}>{e.ref}</span>
              <span className={cn("min-w-0 break-words", T2)}>{brief(e.value)}</span>
            </li>
          ))}
        </ul>
      )}
      <details className="ml-15 group">
        <summary className={cn("w-fit cursor-pointer list-none rounded text-[11.5px] [&::-webkit-details-marker]:hidden", T3, "hover:text-black/80 dark:hover:text-white/80", FOCUS)}>
          <span className="inline-block transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none">›</span> Raw JSON
        </summary>
        <pre className={cn("mt-1.5 max-h-[260px] overflow-auto rounded-lg bg-black/[0.03] p-2.5 text-[11px] leading-[17px] [scrollbar-width:thin] dark:bg-white/[0.04]", T2)}>{JSON.stringify(entries, null, 2)}</pre>
      </details>
    </li>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Try it                                   */
/* -------------------------------------------------------------------------- */

type ArgValue = string | number | boolean

function initialArg(a: AgentArg): ArgValue | "" {
  if (a.enum?.length) return a.enum[0]
  if (a.type === "number") return a.optional ? "" : 0
  if (a.type === "boolean") return false
  return ""
}

function TryIt({ agent, snap, defaultOpen }: { agent: AgentBridge | null; snap: AgentSnapshotEntry[]; defaultOpen: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)
  React.useEffect(() => setOpen(defaultOpen), [defaultOpen])
  const [ref, setRef] = React.useState("")
  const [action, setAction] = React.useState("")
  const [args, setArgs] = React.useState<Record<string, ArgValue | "">>({})
  const [busy, setBusy] = React.useState(false)
  const uid = React.useId()

  const piece = snap.find((p) => p.ref === ref) ?? snap[0]
  const act = piece?.actions.find((a) => a.name === action) ?? piece?.actions.find((a) => !a.disabled) ?? piece?.actions[0]

  // keep args shaped like the chosen action's declared args
  const sig = `${piece?.ref}:${act?.name}:${JSON.stringify(act?.args ?? [])}`
  const lastSig = React.useRef("")
  React.useEffect(() => {
    if (lastSig.current === sig) return
    lastSig.current = sig
    setArgs((prev) => Object.fromEntries((act?.args ?? []).map((a) => [a.name, a.name in prev && (!a.enum || a.enum.includes(prev[a.name] as string | number)) ? prev[a.name] : initialArg(a)])))
  }, [sig, act])

  const call = async () => {
    if (!agent || !piece || !act) return
    const given: Record<string, unknown> = {}
    for (const a of act.args ?? []) {
      const v = args[a.name]
      if (v === "" && a.optional) continue
      given[a.name] = v
    }
    setBusy(true)
    try {
      await agent.act(piece.ref, act.name, given)
    } finally {
      setBusy(false)
    }
  }

  const label = cn("text-[11.5px] leading-4", T3)
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className={cn("group border-t", LINE)} data-try="">
      <summary className={cn("flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium [&::-webkit-details-marker]:hidden", T1, FOCUS)}>
        <span className={cn("inline-block transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none", T3)}>›</span>
        <span className="shrink-0">Try it</span>
        <span className={cn("min-w-0 truncate font-normal", T3)}>call any action yourself, through the same gate</span>
      </summary>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1">
            <span className={label}>Piece</span>
            <select id={`${uid}-ref`} className={field} value={piece?.ref ?? ""} onChange={(e) => setRef(e.target.value)} data-try-ref="">
              {snap.map((p) => (
                <option key={p.ref} value={p.ref}>
                  {p.ref}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className={label}>Action</span>
            <select className={field} value={act?.name ?? ""} onChange={(e) => setAction(e.target.value)} data-try-action="">
              {piece?.actions.map((a) => (
                <option key={a.name} value={a.name} disabled={a.disabled}>
                  {a.name}
                  {a.disabled ? " (unavailable)" : a.destructive ? " (asks you)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        {act?.args?.length ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {act.args.map((a) => {
              const v = args[a.name]
              return (
                <label key={a.name} className={cn("grid gap-1", a.type === "boolean" && "content-end")}>
                  <span className={label}>
                    {a.name}
                    <span className="ml-1 opacity-80">{a.type}{a.optional ? ", optional" : ""}</span>
                  </span>
                  {a.enum ? (
                    <select className={field} value={String(v ?? "")} onChange={(e) => setArgs((s) => ({ ...s, [a.name]: a.type === "number" ? Number(e.target.value) : e.target.value }))} data-try-arg={a.name}>
                      {a.enum.map((o) => (
                        <option key={String(o)} value={String(o)}>
                          {String(o)}
                        </option>
                      ))}
                    </select>
                  ) : a.type === "number" ? (
                    <input type="number" className={field} value={v === "" ? "" : Number(v)} onChange={(e) => setArgs((s) => ({ ...s, [a.name]: e.target.value === "" ? "" : Number(e.target.value) }))} data-try-arg={a.name} />
                  ) : a.type === "boolean" ? (
                    <input type="checkbox" className="size-4 accent-neutral-900 dark:accent-white" checked={v === true} onChange={(e) => setArgs((s) => ({ ...s, [a.name]: e.target.checked }))} data-try-arg={a.name} />
                  ) : (
                    <input type="text" className={field} value={String(v ?? "")} onChange={(e) => setArgs((s) => ({ ...s, [a.name]: e.target.value }))} data-try-arg={a.name} />
                  )}
                </label>
              )
            })}
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-3">
          <button type="button" className={btnPrimary} disabled={!agent || !act || act.disabled || busy} onClick={() => void call()} data-try-call="">
            Call
          </button>
          <span className={cn("min-w-0 truncate text-[12px]", T3)}>
            {act?.disabled ? `${act.name} is not possible in ${piece?.ref}'s current state` : act?.description ?? ""}
          </span>
        </div>
      </div>
    </details>
  )
}

/* -------------------------------------------------------------------------- */
/*                                How it works                                */
/* -------------------------------------------------------------------------- */

const HOOK_SAMPLE = `// inside a piece: describe it, once per render
useAgentNode(rootRef, {
  id: agentId,                 // "popover": the ref an agent uses
  kind: "popover",
  label,                       // its accessible name
  value: { open: value },      // plain JSON state
  actions: {
    open: {
      run: (a) => open(String(a.id)),   // the same function a press calls
      args: [{ name: "id", type: "string", enum: ids }],
    },
    close: { run: () => close(), disabled: value === null },
  },
})`

const BRIDGE_SAMPLE = `import { createAgentBridge } from "@/lib/agent-bridge"

const agent = createAgentBridge({
  // every request passes here; only true lets it run
  allow: (request, { signal }) =>
    request.destructive ? askThePerson(request.reason, signal) : true,
})

agent.snapshot()                          // [{ ref, kind, label, value, actions }]
await agent.act("popover", "open", { id: "sort" })
// { ok: true, ref: "popover", action: "open", value: { open: "sort", ... } }`

const FLOW = [
  { k: "piece", v: "useAgentNode()" },
  { k: "registry", v: "globalThis[Symbol.for(\"pane.agent\")]" },
  { k: "bridge", v: "snapshot() · act()" },
  { k: "gate", v: "allow(request)" },
  { k: "piece", v: "action.run()" },
]

function Code({ title, code }: { title: string; code: string }) {
  return (
    <figure className={cn("min-w-0 overflow-hidden rounded-xl", surface)}>
      <figcaption className={cn("border-b px-3.5 py-2 text-[12px]", LINE, T3)}>{title}</figcaption>
      <pre className={cn("overflow-x-auto px-3.5 py-3 text-[12px] leading-[19px] [scrollbar-width:thin]", MONO, T1)}>
        <code>{code}</code>
      </pre>
    </figure>
  )
}

function HowItWorks() {
  const p = cn("max-w-2xl text-[14.5px] leading-6", T2)
  const c = cn(MONO, "text-[13px]", T1)
  return (
    <section aria-labelledby="agent-how" className="mt-20">
      <h2 id="agent-how" className={cn("text-[22px] leading-tight font-medium tracking-[-0.01em]", T1)}>
        How it works
      </h2>

      <ol aria-label="Path of one request" className={cn("mt-6 flex flex-wrap items-center gap-y-2 text-[12px]", MONO)}>
        {FLOW.map((f, i) => (
          <li key={i} className="flex items-center">
            {i > 0 && (
              <span aria-hidden className={cn("mx-2.5", T3)}>
                →
              </span>
            )}
            <span className={cn("rounded-lg px-2.5 py-1.5 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.09)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]", T1)}>
              <span className={cn("mr-1.5", T3)}>{f.k}</span>
              {f.v}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-7 grid gap-4">
        <p className={p}>
          <span className={cn("font-medium", T1)}>A snapshot is the page described as data.</span> Each operable piece says what it is, its accessible label, its state as plain JSON and the actions it takes, with typed args.{" "}
          <code className={c}>snapshot()</code> returns that list, so an agent reads the page in one call, without a screenshot or scraping the DOM, and gets refs it can pass back to <code className={c}>act()</code>.
        </p>
        <p className={p}>
          <span className={cn("font-medium", T1)}>Actions go through the piece&rsquo;s own handlers, not synthetic clicks.</span> An action calls the same function a press or a key calls, so the piece&rsquo;s callbacks fire, focus and ARIA behave as
          they do for a person, and its motion plays out: Hold to Confirm still takes its 1.2 seconds. A synthetic click would depend on layout, could not drag or hold, and would break when the markup changes.
        </p>
        <p className={p}>
          <span className={cn("font-medium", T1)}>The gate decides what runs.</span> Every request passes <code className={c}>allow(request)</code>. This page lets harmless ones through at once and shows Allow and Deny for the ones that commit
          something (pieces mark those themselves). Without a gate, destructive requests are refused. After an approval the bridge checks again that the action is still possible and still what you approved.
        </p>
        <p className={p}>
          <span className={cn("font-medium", T1)}>A piece copied alone still works.</span> Each one carries a short inline stub with no imports that writes into a registry on <code className={c}>globalThis</code>. Without the helper nothing reads
          it; add <code className={c}>agent-bridge.ts</code> and every operable piece on the page can be read and operated, with no change to the pieces. The ideas and the full contract are in the{" "}
          <a
            href="https://github.com/kametayturar/pane/blob/main/docs/agent-operable.md"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-black/20 underline-offset-2 hover:text-black dark:decoration-white/25 dark:hover:text-white"
          >
            design note
          </a>
          .
        </p>
      </div>

      <div className="mt-8 grid max-w-2xl gap-4">
        <Code title="In a piece" code={HOOK_SAMPLE} />
        <Code title="In your app" code={BRIDGE_SAMPLE} />
      </div>
    </section>
  )
}

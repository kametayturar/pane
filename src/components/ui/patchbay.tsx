"use client"

import * as React from "react"
import { CalendarDays, Compass, CreditCard, Feather, FolderOpen, Mail, Search, Sprout } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type PatchbayScope = {
  /** Stable id, unique inside its tool. */
  id: string
  /** Short permission shown on the cable, e.g. "read inbox". */
  label: string
  /** What the agent can do, finishing "Atlas can now …". */
  can: string
  /** Optional second sentence about the limit, e.g. "Nothing is sent." */
  note?: string
  /** "write" turns the cable amber, "high" turns it red. Default "read". */
  risk?: "read" | "write" | "high"
}

export type PatchbayTool = {
  id: string
  name: string
  /** One line under the name: an account, a folder, a quota. */
  detail?: string
  /** Glyph for the tool tile. */
  icon?: React.ReactNode
  /** Permissions from the narrowest to the widest. A new cable always starts on the first one. */
  scopes: PatchbayScope[]
}

export type PatchbayAgent = {
  id: string
  name: string
  role?: string
  icon?: React.ReactNode
  /** How many ports the agent has. Default 3. */
  ports?: number
}

export type PatchbayLink = {
  tool: string
  agent: string
  /** Scope id. Defaults to the tool's first (narrowest) scope. */
  scope?: string
  /** Port index on the agent. Defaults to the first free port. */
  port?: number
}

export type PatchbayProps = {
  /** The sources on the left. Defaults to a demo set (Email, Calendar, Files, Search, Payments). Pass a stable reference (module constant or useMemo): a new array on every render re-measures the board. */
  tools?: PatchbayTool[]
  /** The agents on the right. Defaults to Atlas, Quill and Sage. Pass a stable reference, like `tools`. */
  agents?: PatchbayAgent[]
  /** Cables, to control the board. */
  links?: PatchbayLink[]
  /** Starting cables when uncontrolled. */
  defaultLinks?: PatchbayLink[]
  /** Called after every plug, unplug, move and permission change. */
  onLinksChange?: (links: Required<PatchbayLink>[]) => void
  /** Heading. */
  title?: string
  /** Line under the heading. Defaults to the number of tools and agents. */
  subtitle?: string
  /** Buttons for the footer, such as Reset. */
  actions?: React.ReactNode
  /** Look but don't touch. */
  disabled?: boolean
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                Demo content                                */
/* -------------------------------------------------------------------------- */

const DEFAULT_TOOLS: PatchbayTool[] = [
  {
    id: "email",
    name: "Email",
    detail: "Shared inbox",
    icon: <Mail size={16} strokeWidth={1.75} />,
    scopes: [
      { id: "read", label: "read inbox", can: "read the inbox at hello@harbor-finch.example" },
      { id: "draft", label: "draft replies", can: "draft replies in the inbox", note: "Nothing is sent.", risk: "write" },
      { id: "send", label: "send mail", can: "send mail as hello@harbor-finch.example", note: "There is no review step.", risk: "write" },
    ],
  },
  {
    id: "calendar",
    name: "Calendar",
    detail: "Studio calendar",
    icon: <CalendarDays size={16} strokeWidth={1.75} />,
    scopes: [
      { id: "view", label: "see free times", can: "see when the studio is free" },
      { id: "create", label: "create events", can: "put events on the studio calendar", risk: "write" },
    ],
  },
  {
    id: "files",
    name: "Files",
    detail: "/Q4 planning",
    icon: <FolderOpen size={16} strokeWidth={1.75} />,
    scopes: [
      { id: "read", label: "read files", can: "open files in /Q4 planning" },
      { id: "edit", label: "edit files", can: "edit files in /Q4 planning", risk: "write" },
    ],
  },
  {
    id: "search",
    name: "Search",
    detail: "Web, 200 a day",
    icon: <Search size={16} strokeWidth={1.75} />,
    scopes: [{ id: "web", label: "search the web", can: "search the web, up to 200 queries a day" }],
  },
  {
    id: "payments",
    name: "Payments",
    detail: "Harbor & Finch billing",
    icon: <CreditCard size={16} strokeWidth={1.75} />,
    scopes: [
      { id: "read", label: "read invoices", can: "see invoices and payouts" },
      { id: "refund", label: "refund up to $50", can: "refund orders up to $50 each", note: "Anything larger waits for a person.", risk: "write" },
      { id: "pay", label: "send payments", can: "send payments from the billing account", note: "There is no limit and no review step.", risk: "high" },
    ],
  },
]

const DEFAULT_AGENTS: PatchbayAgent[] = [
  { id: "atlas", name: "Atlas", role: "Scheduling", icon: <Compass size={15} strokeWidth={1.75} /> },
  { id: "quill", name: "Quill", role: "Replies", icon: <Feather size={15} strokeWidth={1.75} /> },
  { id: "sage", name: "Sage", role: "Research", icon: <Sprout size={15} strokeWidth={1.75} /> },
]

const DEFAULT_LINKS: PatchbayLink[] = [
  { tool: "email", agent: "atlas", scope: "read", port: 0 },
  { tool: "calendar", agent: "atlas", scope: "create", port: 1 },
  { tool: "email", agent: "quill", scope: "draft", port: 0 },
  { tool: "files", agent: "sage", scope: "read", port: 0 },
  { tool: "search", agent: "sage", scope: "web", port: 1 },
]

/* -------------------------------------------------------------------------- */
/*                               Link bookkeeping                             */
/* -------------------------------------------------------------------------- */

type LinkN = Required<PatchbayLink>

const linkKey = (l: { tool: string; agent: string }) => `${l.tool}\u001f${l.agent}`
const portKey = (agent: string, port: number) => `${agent}#${port}`

function normalize(raw: PatchbayLink[], tools: PatchbayTool[], agents: PatchbayAgent[]): LinkN[] {
  const usedPorts = new Set<string>()
  const pairs = new Set<string>()
  const out: LinkN[] = []
  const later: { l: PatchbayLink; tool: PatchbayTool; agent: PatchbayAgent }[] = []
  const scopeOf = (t: PatchbayTool, id?: string) => (t.scopes.some((s) => s.id === id) ? (id as string) : t.scopes[0].id)
  for (const l of raw) {
    const tool = tools.find((t) => t.id === l.tool)
    const agent = agents.find((a) => a.id === l.agent)
    if (!tool || !agent || !tool.scopes.length || pairs.has(linkKey(l))) continue
    const cap = agent.ports ?? 3
    if (l.port !== undefined && l.port >= 0 && l.port < cap && !usedPorts.has(portKey(agent.id, l.port))) {
      usedPorts.add(portKey(agent.id, l.port))
      pairs.add(linkKey(l))
      out.push({ tool: tool.id, agent: agent.id, scope: scopeOf(tool, l.scope), port: l.port })
    } else later.push({ l, tool, agent })
  }
  for (const { l, tool, agent } of later) {
    if (pairs.has(linkKey(l))) continue
    const cap = agent.ports ?? 3
    let p = 0
    while (p < cap && usedPorts.has(portKey(agent.id, p))) p++
    if (p >= cap) continue
    usedPorts.add(portKey(agent.id, p))
    pairs.add(linkKey(l))
    out.push({ tool: tool.id, agent: agent.id, scope: scopeOf(tool, l.scope), port: p })
  }
  return out
}

const sameLinks = (a: LinkN[], b: LinkN[]) =>
  a.length === b.length && a.every((l) => b.some((m) => m.tool === l.tool && m.agent === l.agent && m.port === l.port && m.scope === l.scope))

function names(list: string[]) {
  if (list.length < 2) return list[0] ?? ""
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`
}

/* -------------------------------------------------------------------------- */
/*                             Rope physics engine                            */
/* -------------------------------------------------------------------------- */

/** Ghost cables (a cable being retracted) are keyed with this prefix so they can never collide with a link key. */
const GHOST = "\u001e"
const N = 20 // points per cable
const H = 1 / 120 // fixed physics step
const GRAVITY = 2600 // px/s²
const DAMP = 0.991
const ITER = 16
const POSE = [0.62, 0.3] // how hard the first points are pulled straight out of a plug
const slack = (c: number) => c * 0.11 + 32
const PLUG = 1.35 // plug scale on a wide board
const PLUG_SMALL = 0.9

type Pt = { x: number; y: number }
type Box = { l: number; t: number; r: number; b: number }
type Mode = "seated" | "drag" | "carry" | "retract"

type Sim = {
  x: Float64Array
  y: Float64Array
  px: Float64Array
  py: Float64Array
  len: number
  ax: number
  ay: number
  bx: number
  by: number
  aa: number
  ab: number
  mode: Mode
  tool: string
  port: string | null
  /** seconds the rope stays frozen (the intro staggers cables with it) */
  wait: number
  /** seconds the free end eases slowly toward its port (the intro drop) */
  ease: number
  /** seconds spent retracting; a ghost that never arrives is dropped after a while */
  rt: number
  energy: number
}

type CableEls = { sh: SVGPathElement; core: SVGPathElement; hi: SVGPathElement; pa: SVGGElement; pb: SVGGElement }

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function layOut(s: Sim, len: number) {
  const c = Math.hypot(s.bx - s.ax, s.by - s.ay)
  const sag = Math.sqrt(Math.max(0, (3 * c * Math.max(0, len - c)) / 8))
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    s.x[i] = s.px[i] = s.ax + (s.bx - s.ax) * t
    s.y[i] = s.py[i] = s.ay + (s.by - s.ay) * t + 4 * sag * t * (1 - t)
  }
}

function makeSim(a: Pt, b: Pt, tool: string, port: string | null, mode: Mode): Sim {
  const s: Sim = {
    x: new Float64Array(N), y: new Float64Array(N), px: new Float64Array(N), py: new Float64Array(N),
    len: 0, ax: a.x, ay: a.y, bx: b.x, by: b.y, aa: Math.PI, ab: 0, mode, tool, port, wait: 0, ease: 0, rt: 0, energy: 1,
  }
  const c = Math.hypot(b.x - a.x, b.y - a.y)
  s.len = c + slack(c)
  layOut(s, s.len)
  return s
}

function pathD(s: Sim) {
  let d = `M${s.x[0].toFixed(1)} ${s.y[0].toFixed(1)}`
  for (let i = 1; i < N - 1; i++) {
    d += `Q${s.x[i].toFixed(1)} ${s.y[i].toFixed(1)} ${((s.x[i] + s.x[i + 1]) / 2).toFixed(1)} ${((s.y[i] + s.y[i + 1]) / 2).toFixed(1)}`
  }
  return d + `L${s.x[N - 1].toFixed(1)} ${s.y[N - 1].toFixed(1)}`
}

type Seed = { key: string; tool: string; port: string }

type EngineHost = { stage: { current: HTMLElement | null }; ghostDone: (key: string) => void; booted: () => void }

function createEngine() {
  let host: EngineHost = { stage: { current: null }, ghostDone: () => {}, booted: () => {} }
  const sims = new Map<string, Sim>()
  const els = new Map<string, CableEls>()
  const chips = new Map<string, HTMLElement>()
  const chipW = new Map<string, number>()
  const anchors = { jack: new Map<string, Pt>(), port: new Map<string, Pt>(), card: new Map<string, Box>(), w: 0, h: 0, compact: false, jx: 0, px: 0 }
  const drag = { on: false, tx: 0, ty: 0, key: null as string | null }
  // the board starts asleep and wakes when the IntersectionObserver says it is on screen
  const flags = { visible: false, reduced: false, intro: false, introDone: false }
  let retargetFn: null | ((dt: number) => void) = null
  let wanted: Seed[] = []
  let raf = 0
  let last = 0
  let acc = 0
  let quiet = 0
  let bootAt = 0

  function measure() {
    const st = host.stage.current
    if (!st) return
    const sr = st.getBoundingClientRect()
    anchors.w = sr.width
    anchors.h = sr.height
    anchors.compact = sr.width < 440
    anchors.jack.clear()
    anchors.port.clear()
    anchors.card.clear()
    anchors.jx = 0
    anchors.px = sr.width
    st.querySelectorAll<HTMLElement>("[data-ipy-jack]").forEach((el) => {
      const r = el.getBoundingClientRect()
      const x = r.left + r.width / 2 - sr.left
      anchors.jx = Math.max(anchors.jx, x)
      anchors.jack.set(el.dataset.ipyJack as string, { x, y: r.top + r.height / 2 - sr.top })
    })
    st.querySelectorAll<HTMLElement>("[data-ipy-port]").forEach((el) => {
      const r = el.getBoundingClientRect()
      const x = r.left + r.width / 2 - sr.left
      anchors.px = Math.min(anchors.px, x)
      anchors.port.set(el.dataset.ipyPort as string, { x, y: r.top + r.height / 2 - sr.top })
    })
    chips.forEach((el, k) => chipW.set(k, el.offsetWidth))
    st.querySelectorAll<HTMLElement>("[data-ipy-card]").forEach((el) => {
      const r = el.getBoundingClientRect()
      anchors.card.set(el.dataset.ipyCard as string, { l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top })
    })
  }

  function sync(seeds: Seed[]) {
    wanted = seeds
    if (!anchors.jack.size) return
    const keep = new Set(seeds.map((s) => s.key))
    for (const k of [...sims.keys()]) if (k !== "drag" && !k.startsWith(GHOST) && !keep.has(k)) sims.delete(k)
    let created = 0
    for (const sd of seeds) {
      const a = anchors.jack.get(sd.tool)
      const b = anchors.port.get(sd.port)
      if (!a || !b) continue
      const have = sims.get(sd.key)
      if (have) {
        have.tool = sd.tool
        have.port = sd.port
        have.mode = "seated"
      } else {
        sims.set(sd.key, makeSim(a, b, sd.tool, sd.port, "seated"))
        created++
      }
    }
    if (created && !flags.introDone && !flags.reduced) flags.intro = true
  }

  function kick(s: Sim, amp: number) {
    for (let i = 1; i < N - 1; i++) s.py[i] = s.y[i] - amp * Math.sin((Math.PI * i) / (N - 1))
    s.energy = 1
  }

  /** The plug follows the end of the rope; a seated plug is rigid, so it may only tilt a little. */
  function angles(s: Sim) {
    const { x, y } = s
    const kAng = flags.reduced ? 1 : 1 - Math.exp(-24 * H)
    const ta = Math.PI + clamp(wrap(Math.atan2(y[0] - y[2], x[0] - x[2]) - Math.PI), -0.38, 0.38)
    s.aa += wrap(ta - s.aa) * kAng
    const rawB = Math.atan2(y[N - 1] - y[N - 3], x[N - 1] - x[N - 3])
    const tb = s.mode === "seated" ? clamp(wrap(rawB), -0.38, 0.38) : rawB
    s.ab += wrap(tb - s.ab) * kAng
  }

  function step(s: Sim) {
    const A = anchors.jack.get(s.tool)
    if (!A) {
      s.energy = 0
      return
    }
    if (s.wait > 0) {
      s.wait -= H
      angles(s)
      return
    }
    let tx = s.bx
    let ty = s.by
    let rate = 30
    if (s.mode === "seated") {
      const P = s.port ? anchors.port.get(s.port) : undefined
      if (P) { tx = P.x; ty = P.y }
      rate = s.ease > 0 ? 2.2 + (1.15 - s.ease) * 9 : 36
      if (s.ease > 0) s.ease -= H
    } else if (s.mode === "drag") {
      tx = drag.tx; ty = drag.ty; rate = 44
    } else if (s.mode === "carry") {
      const P = drag.key ? anchors.port.get(drag.key) : undefined
      if (P) { tx = P.x; ty = P.y }
      rate = 13
    } else {
      tx = A.x; ty = A.y; rate = 10
      s.rt += H
    }
    const reduced = flags.reduced
    const kA = reduced ? 1 : 1 - Math.exp(-28 * H)
    const kB = reduced ? 1 : 1 - Math.exp(-rate * H)
    s.ax += (A.x - s.ax) * kA
    s.ay += (A.y - s.ay) * kA
    s.bx += (tx - s.bx) * kB
    s.by += (ty - s.by) * kB
    const c = Math.hypot(s.bx - s.ax, s.by - s.ay)
    const want = s.mode === "retract" ? c * 1.01 + 3 : c + slack(c)
    s.len = want > s.len ? want : Math.max(want, s.len - (s.mode === "retract" ? 1400 : s.ease > 0 ? 800 : 320) * H)
    const { x, y, px, py } = s
    if (reduced) {
      layOut(s, want)
      s.energy = 0
    } else {
      const seg = s.len / (N - 1)
      x[0] = s.ax; y[0] = s.ay; x[N - 1] = s.bx; y[N - 1] = s.by
      const g = GRAVITY * H * H
      for (let i = 1; i < N - 1; i++) {
        const vx = (x[i] - px[i]) * DAMP
        const vy = (y[i] - py[i]) * DAMP
        px[i] = x[i]; py[i] = y[i]
        x[i] += vx; y[i] += vy + g
      }
      // the plug is stiff: the cable leaves it in a straight stub before it bends
      for (let k = 1; k <= 2; k++) {
        x[k] += (s.ax + seg * k - x[k]) * POSE[k - 1]
        y[k] += (s.ay - y[k]) * POSE[k - 1]
        if (s.mode === "seated" || s.mode === "carry") {
          const j = N - 1 - k
          x[j] += (s.bx - seg * k - x[j]) * POSE[k - 1]
          y[j] += (s.by - y[j]) * POSE[k - 1]
        }
      }
      for (let it = 0; it < ITER; it++) {
        const fwd = it % 2 === 0
        for (let n = 0; n < N - 1; n++) {
          const i = fwd ? n : N - 2 - n
          const dx = x[i + 1] - x[i]
          const dy = y[i + 1] - y[i]
          const d = Math.hypot(dx, dy) || 1e-6
          const diff = (d - seg) / d
          const wa = i === 0 ? 0 : 1
          const wb = i + 1 === N - 1 ? 0 : 1
          const w = wa + wb
          if (!w) continue
          const ox = (dx * diff) / w
          const oy = (dy * diff) / w
          x[i] += ox * wa; y[i] += oy * wa
          x[i + 1] -= ox * wb; y[i + 1] -= oy * wb
        }
      }
      const floor = anchors.h - 8
      let e = 0
      for (let i = 1; i < N - 1; i++) {
        if (y[i] > floor) y[i] = floor
        e += Math.abs(x[i] - px[i]) + Math.abs(y[i] - py[i])
      }
      s.energy = e / N + Math.abs(tx - s.bx) * 0.08
    }
    angles(s)
  }

  function draw(key: string, s: Sim) {
    const e = els.get(key)
    if (e) {
      const d = pathD(s)
      const ps = anchors.compact ? PLUG_SMALL : PLUG
      e.sh.setAttribute("d", d)
      e.core.setAttribute("d", d)
      e.hi.setAttribute("d", d)
      e.pa.setAttribute("transform", `translate(${s.x[0].toFixed(1)} ${s.y[0].toFixed(1)}) rotate(${((s.aa * 180) / Math.PI).toFixed(1)}) scale(${ps})`)
      e.pb.setAttribute("transform", `translate(${s.x[N - 1].toFixed(1)} ${s.y[N - 1].toFixed(1)}) rotate(${((s.ab * 180) / Math.PI).toFixed(1)}) scale(${ps})`)
    }
  }

  /** Where a permission label sits: on the rope, just in front of the agent's plug. */
  function chipSpot(key: string, s: Sim): Pt {
    const target = (anchors.compact ? 42 : 58) + (chipW.get(key) ?? 80) / 2
    let walked = 0
    for (let i = N - 1; i > 0; i--) {
      const seg = Math.hypot(s.x[i - 1] - s.x[i], s.y[i - 1] - s.y[i])
      if (walked + seg >= target) {
        const f = (target - walked) / (seg || 1)
        return { x: s.x[i] + (s.x[i - 1] - s.x[i]) * f, y: s.y[i] + (s.y[i - 1] - s.y[i]) * f }
      }
      walked += seg
    }
    const m = N >> 1
    return { x: s.x[m], y: s.y[m] }
  }

  /** Puts every permission label on its cable, then nudges overlapping labels apart vertically. */
  function layChips() {
    const list: { el: HTMLElement; x: number; y: number; w: number }[] = []
    for (const [k, el] of chips) {
      const s = sims.get(k)
      if (!s) continue
      const p = chipSpot(k, s)
      const w = chipW.get(k) ?? 80
      // keep the label between the plugs, off the tool and agent columns
      const pad = anchors.compact ? 26 : 40
      const lo = anchors.jx + pad + w / 2
      const hi = anchors.px - pad - w / 2
      list.push({ el, x: lo <= hi ? clamp(p.x, lo, hi) : (anchors.jx + anchors.px) / 2, y: p.y, w })
    }
    list.sort((a, b) => a.y - b.y)
    const gap = 30
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i]
          const b = list[j]
          const dy = b.y - a.y
          if (dy >= gap || Math.abs(b.x - a.x) >= (a.w + b.w) / 2 + 4) continue
          const push = (gap - dy) / 2
          a.y -= push
          b.y += push
        }
      }
    }
    for (const c of list) c.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`
  }

  function drawAll() {
    for (const [k, s] of sims) draw(k, s)
    layChips()
  }

  const canRun = () => flags.visible && !document.hidden

  /** First time on screen: every cable is lifted above the board and lowered into its port, one after another. */
  function startIntro(now: number) {
    flags.intro = false
    bootAt = now + 2600
    flags.introDone = true
    const list = [...sims.values()].filter((s) => s.mode === "seated" && s.port && anchors.port.has(s.port))
    list.sort((a, b) => a.ay - b.ay)
    list.forEach((s, n) => {
      const P = anchors.port.get(s.port as string) as Pt
      s.bx = P.x - 30
      s.by = Math.max(P.y - 190, -70)
      const c = Math.hypot(s.bx - s.ax, s.by - s.ay)
      s.len = c + slack(c)
      layOut(s, s.len)
      s.wait = 0.08 + n * 0.12
      s.ease = 1.15
      s.energy = 1
    })
  }

  function tick(now: number) {
    raf = 0
    if (!canRun()) { last = 0; return }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    if (flags.intro) startIntro(now)
    if (bootAt && now > bootAt) {
      bootAt = 0
      host.booted()
    }
    if (drag.on) retargetFn?.(dt)
    acc += dt
    let steps = 0
    while (acc >= H && steps < 8) {
      for (const s of sims.values()) step(s)
      acc -= H
      steps++
    }
    if (steps === 8) acc = 0
    let awake = drag.on
    const done: string[] = []
    for (const [k, s] of sims) {
      if (s.energy > 0.015) awake = true
      const gone = !anchors.jack.has(s.tool)
      if (s.mode === "retract" && (gone || s.rt > 1.6 || Math.hypot(s.bx - s.ax, s.by - s.ay) < 5)) done.push(k)
      else if (k === "drag" && gone) done.push(k)
    }
    drawAll()
    for (const k of done) {
      sims.delete(k)
      if (k === "drag") drag.on = false
      else host.ghostDone(k)
    }
    quiet = awake ? 0 : quiet + 1
    if (quiet < 24) raf = requestAnimationFrame(tick)
    else last = 0
  }

  function wake() {
    quiet = 0
    if (!raf && canRun()) raf = requestAnimationFrame(tick)
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    last = 0
  }

  return {
    sims, els, chips, chipW, anchors, drag, flags, measure, kick, drawAll, wake, stop, draw, layChips, sync,
    resync: () => sync(wanted),
    setHost: (h: EngineHost) => { host = h },
    setReduced: (v: boolean) => { flags.reduced = v },
    setVisible: (v: boolean) => { flags.visible = v; if (v) wake() },
    setRetarget: (fn: null | ((dt: number) => void)) => { retargetFn = fn },
    setDrag: (on: boolean, key: string | null = null) => { drag.on = on; drag.key = key },
    setAim: (key: string | null) => { drag.key = key },
    setTarget: (x: number, y: number) => { drag.tx = x; drag.ty = y },
    setMode: (s: Sim, mode: Mode, port: string | null) => { s.mode = mode; s.port = port },
  }
}

type Engine = ReturnType<typeof createEngine>

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const STYLES = `
.ipy {
  --ipy-ink: #000;
  --ipy-surface: #fff;
  --ipy-accent: #0060e2;
  --ipy-warn: #c2570c;
  --ipy-danger: #cf2e2e;
  --ipy-t1: color-mix(in oklab, var(--ipy-ink) 88%, transparent);
  --ipy-t2: color-mix(in oklab, var(--ipy-ink) 61%, transparent);
  --ipy-t3: color-mix(in oklab, var(--ipy-ink) 45%, transparent);
  --ipy-t4: color-mix(in oklab, var(--ipy-ink) 27%, transparent);
  --ipy-fill: color-mix(in oklab, var(--ipy-ink) 6%, transparent);
  --ipy-line: color-mix(in oklab, var(--ipy-ink) 6%, transparent);
  --ipy-hole: color-mix(in oklab, var(--ipy-ink) 15%, transparent);
  --ipy-stage: color-mix(in oklab, var(--ipy-ink) 3.2%, transparent);
  --ipy-cable: color-mix(in oklab, var(--ipy-ink) 74%, #7184a8);
  --ipy-plug: #1b1b1f;
  --ipy-plug-rim: rgb(255 255 255 / 0);
  --ipy-sh: rgb(20 24 40 / .08);
  --ipy-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ipy-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 1px 1px -1px rgb(0 0 0 / .1), 0 8px 20px -6px rgb(0 0 0 / .22);
  --ipy-glint: rgb(255 255 255 / .8);
  --ipy-ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 900px;
  color: var(--ipy-t1);
  font-family: var(--ipy-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px;
  line-height: 20px;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}
:is(.dark, [data-theme="dark"]) .ipy {
  --ipy-ink: #fff;
  --ipy-surface: #1c1c1e;
  --ipy-accent: #4d8dff;
  --ipy-warn: #f5a524;
  --ipy-danger: #ff6b6b;
  --ipy-t1: color-mix(in oklab, var(--ipy-ink) 90%, transparent);
  --ipy-t2: color-mix(in oklab, var(--ipy-ink) 62%, transparent);
  --ipy-t3: color-mix(in oklab, var(--ipy-ink) 46%, transparent);
  --ipy-t4: color-mix(in oklab, var(--ipy-ink) 28%, transparent);
  --ipy-fill: color-mix(in oklab, var(--ipy-ink) 8%, transparent);
  --ipy-line: color-mix(in oklab, var(--ipy-ink) 9%, transparent);
  --ipy-hole: #0b0b0e;
  --ipy-stage: color-mix(in oklab, var(--ipy-ink) 4.5%, transparent);
  --ipy-cable: color-mix(in oklab, #b3c2de 80%, var(--ipy-surface));
  --ipy-plug: #36363d;
  --ipy-plug-rim: rgb(255 255 255 / .2);
  --ipy-sh: rgb(0 0 0 / .22);
  --ipy-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ipy-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 10px 24px -6px rgb(0 0 0 / .6);
  --ipy-glint: rgb(255 255 255 / .12);
}
/* Mono tells the permissions apart by line style, not hue */
html[data-style="mono"] .ipy {
  --ipy-warn: var(--ipy-ink);
  --ipy-danger: var(--ipy-ink);
  --ipy-cable: color-mix(in oklab, var(--ipy-ink) 82%, transparent);
}
.ipy *, .ipy *::before, .ipy *::after { box-sizing: border-box }
:where(.ipy) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer }
:where(.ipy) ul, :where(.ipy) li { list-style: none; margin: 0; padding: 0 }
:where(.ipy) p, :where(.ipy) h3 { margin: 0 }
.ipy :focus-visible { outline: 2px solid color-mix(in oklab, var(--ipy-accent) 60%, transparent); outline-offset: 2px }

.ipy-card { position: relative; padding: 22px 24px 18px; border-radius: 26px; background: var(--ipy-surface); box-shadow: var(--ipy-shadow) }

/* Head */
.ipy-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 22px }
.ipy-title { font-size: 19px; line-height: 24px; font-weight: 600; letter-spacing: -.012em; color: var(--ipy-t1) }
.ipy-sub { margin-top: 1px; font-size: 13px; line-height: 18px; color: var(--ipy-t2) }
.ipy-legend { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px 14px; padding-top: 4px; font-size: 12px; line-height: 18px; color: var(--ipy-t2) }
.ipy-legend span { display: inline-flex; align-items: center; gap: 7px }
.ipy-legend i { width: 18px; height: 5px; border-radius: 3px; background: var(--ipy-cable) }
.ipy-legend span[data-risk="write"] i { background: var(--ipy-warn) }
.ipy-legend span[data-risk="high"] i { background: var(--ipy-danger) }

/* Stage: tools | pegboard | agents */
.ipy-caps, .ipy-stage { display: grid; grid-template-columns: 220px minmax(60px, 1fr) 248px }
.ipy-caps { margin-bottom: 10px; font-size: 11px; line-height: 14px; font-weight: 500; letter-spacing: .07em; text-transform: uppercase; color: var(--ipy-t3) }
.ipy-caps span:last-child { grid-column: 3 }
.ipy-stage { position: relative; align-items: stretch; touch-action: pan-y; grid-template-rows: auto 36px }
.ipy-mid {
  grid-column: 2; grid-row: 1 / span 2; margin: 0 -6px; border-radius: 18px;
  background-color: var(--ipy-stage);
  background-image: radial-gradient(circle, color-mix(in oklab, var(--ipy-ink) 17%, transparent) 1px, transparent 1.5px);
  background-size: 14px 14px; background-position: 7px 7px;
  box-shadow: inset 0 0 0 1px var(--ipy-line);
}
.ipy-tools { grid-column: 1; grid-row: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; position: relative; z-index: 1 }
.ipy-agents { grid-column: 3; grid-row: 1; display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 1 }

/* Tool modules */
.ipy-tool {
  position: relative; display: flex; align-items: center; gap: 11px; height: 72px; padding: 0 28px 0 14px; border-radius: 16px;
  background: var(--ipy-surface); box-shadow: var(--ipy-shadow); cursor: grab; user-select: none; -webkit-user-select: none;
  transition: box-shadow .3s var(--ipy-ease), transform .3s var(--ipy-ease);
}
.ipy-tool:hover, .ipy-tool[data-hot] { box-shadow: var(--ipy-float); transform: translateY(-1px) }
.ipy-tool[data-active] { box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--ipy-accent) 55%, transparent), var(--ipy-float) }
.ipy-glyph { flex: none; display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; background: var(--ipy-fill); color: var(--ipy-t1) }
.ipy-tt { display: flex; flex-direction: column; min-width: 0 }
.ipy-tname { font-size: 14px; line-height: 19px; font-weight: 500; color: var(--ipy-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ipy-tmeta { font-size: 12px; line-height: 17px; color: var(--ipy-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ipy-tmeta[data-off] { color: var(--ipy-t2) }
.ipy-jackhit { position: absolute; top: 0; right: -30px; width: 60px; height: 100%; display: grid; place-items: center; touch-action: none; cursor: grab }

/* Sockets */
.ipy-hole {
  position: relative; display: block; flex: none; width: 24px; height: 24px; border-radius: 50%;
  background: var(--ipy-surface); box-shadow: var(--ipy-shadow);
}
.ipy-hole::before {
  content: ""; position: absolute; inset: 4px; border-radius: 50%; background: var(--ipy-hole);
  box-shadow: inset 0 1.5px 2.5px rgb(0 0 0 / .32), 0 .5px 0 var(--ipy-glint);
}
.ipy-hole::after {
  content: ""; position: absolute; inset: -6px; border-radius: 50%; pointer-events: none; opacity: 0; transform: scale(.7);
  border: 1.5px solid var(--ipy-accent); transition: opacity .2s, transform .35s var(--ipy-ease), box-shadow .25s;
}
button.ipy-hole { padding: 0; cursor: grab }
.ipy-port[data-open] .ipy-hole::after { opacity: .5; transform: scale(1); animation: ipy-pulse 1.3s ease-in-out infinite }
.ipy-port[data-hot] .ipy-hole::after { opacity: 1; transform: scale(1.12); animation: none; box-shadow: 0 0 0 4px color-mix(in oklab, var(--ipy-accent) 20%, transparent) }
.ipy-port[data-fresh] .ipy-hole::after { opacity: 0; animation: ipy-ripple .7s var(--ipy-ease) backwards }
.ipy-tool[data-active] .ipy-hole::after { opacity: .9; transform: scale(1) }
.ipy-jackhit:hover .ipy-hole::after { opacity: .4; transform: scale(1) }
.ipy-jack:focus-visible { outline: none }
.ipy-jack:focus-visible::after { opacity: 1; transform: scale(1); border-color: color-mix(in oklab, var(--ipy-accent) 70%, transparent) }
.ipy-jack { cursor: grab }

/* Agent cards */
.ipy-agent {
  position: relative; border-radius: 18px; background: var(--ipy-surface); box-shadow: var(--ipy-shadow); padding: 10px 14px 8px 0;
  transition: box-shadow .3s var(--ipy-ease), opacity .3s;
}
.ipy-agent[data-hot] { box-shadow: var(--ipy-float) }
.ipy-agent[data-over] { box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--ipy-accent) 55%, transparent), var(--ipy-float) }
.ipy-agent[data-blocked] { box-shadow: 0 0 0 1.5px color-mix(in oklab, var(--ipy-warn) 60%, transparent), var(--ipy-float); animation: ipy-shake .4s var(--ipy-ease) backwards }
.ipy-agent[data-shake] { animation: ipy-shake .4s var(--ipy-ease) backwards }
.ipy-ahead { display: flex; align-items: center; gap: 10px; padding: 0 0 0 20px; height: 40px }
.ipy-av { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: color-mix(in oklab, var(--ipy-accent) 10%, transparent); color: var(--ipy-accent) }
.ipy-an { display: flex; flex-direction: column; min-width: 0; flex: 1 }
.ipy-aname { font-size: 14px; line-height: 18px; font-weight: 500; color: var(--ipy-t1) }
.ipy-arole { font-size: 12px; line-height: 15px; color: var(--ipy-t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ipy-badge {
  flex: none; display: inline-flex; align-items: center; gap: 5px; height: 21px; padding: 0 8px; border-radius: 7px;
  font-size: 11.5px; line-height: 21px; font-weight: 500; background: var(--ipy-fill); color: var(--ipy-t2);
  transition: background-color .3s, color .3s;
}
.ipy-badge i { width: 6px; height: 6px; border-radius: 50%; background: var(--ipy-t4) }
.ipy-badge[data-level="write"] { background: color-mix(in oklab, var(--ipy-warn) 13%, transparent); color: var(--ipy-warn) }
.ipy-badge[data-level="write"] i { background: var(--ipy-warn) }
.ipy-badge[data-level="high"] { background: color-mix(in oklab, var(--ipy-danger) 13%, transparent); color: var(--ipy-danger) }
.ipy-badge[data-level="high"] i { background: var(--ipy-danger) }
.ipy-badge[data-level="read"] i { background: var(--ipy-t2) }
.ipy-ports { margin-top: 2px }
.ipy-port { position: relative; display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 0 0 28px }
.ipy-port > .ipy-hole { position: absolute; left: -12px; top: 50%; margin-top: -12px }
.ipy-ptxt { flex: 1; min-width: 0; font-size: 13px; line-height: 20px; color: var(--ipy-t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.ipy-port[data-state="free"] .ipy-ptxt { color: var(--ipy-t3) }
.ipy-port[data-open] .ipy-ptxt, .ipy-port[data-hot] .ipy-ptxt { color: var(--ipy-accent) }

/* Cables */
.ipy-wires { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; z-index: 2 }
.ipy-cable { --cc: var(--ipy-cable); transition: opacity .3s }
.ipy-cable[data-risk="write"] { --cc: var(--ipy-warn) }
.ipy-cable[data-risk="high"] { --cc: var(--ipy-danger) }
.ipy-cable[data-mode="drag"], .ipy-cable[data-mode="carry"] { --cc: var(--ipy-accent) }
.ipy-cable[data-dim] { opacity: .55 }
.ipy-sh, .ipy-core, .ipy-hi { fill: none; stroke-linecap: round; stroke-linejoin: round }
.ipy-sh { stroke: var(--ipy-sh); stroke-width: 6.5px; transform: translateY(3.5px) }
.ipy-core { stroke: var(--cc); stroke-width: 5px; transition: stroke .3s, stroke-width .25s }
.ipy-hi { stroke: rgb(255 255 255 / .34); stroke-width: 1.5px; transform: translateY(-1.3px) }
:is(.dark, [data-theme="dark"]) .ipy .ipy-hi { stroke: rgb(255 255 255 / .2) }
.ipy-cable[data-hot] .ipy-core, .ipy-cable[data-mode="drag"] .ipy-core, .ipy-cable[data-mode="carry"] .ipy-core { stroke-width: 6.4px }
.ipy-cable[data-hot] .ipy-core { filter: drop-shadow(0 0 4px color-mix(in oklab, var(--cc) 65%, transparent)) }
.ipy-cable[data-fresh] .ipy-core { animation: ipy-fresh 1.4s ease-out backwards }
html[data-style="mono"] .ipy .ipy-cable[data-risk="write"] .ipy-core, html[data-style="mono"] .ipy .ipy-cable[data-risk="high"] .ipy-core { stroke-width: 7px }
html[data-style="mono"] .ipy .ipy-cable[data-risk="write"] .ipy-hi, html[data-style="mono"] .ipy .ipy-cable[data-risk="high"] .ipy-hi { stroke: var(--ipy-surface); stroke-width: 2.4px; transform: none }
html[data-style="mono"] .ipy .ipy-cable[data-risk="high"] .ipy-hi { stroke-dasharray: 6 5; stroke-linecap: butt }
html[data-style="mono"] .ipy .ipy-legend span[data-risk] i { background: var(--ipy-surface); box-shadow: inset 0 0 0 1.5px var(--ipy-ink) }
.ipy-plug { pointer-events: none }
.ipy-plug[data-grab] { pointer-events: auto; cursor: grab; touch-action: none }
.ipy-plug-in { transform-origin: 0 0; transition: transform .2s var(--ipy-ease) }
.ipy-cable[data-mode="drag"] .ipy-plug[data-end="b"] .ipy-plug-in, .ipy-cable[data-mode="carry"] .ipy-plug[data-end="b"] .ipy-plug-in { transform: scale(1.08) }
.ipy-cable[data-seated] .ipy-plug[data-end="b"] .ipy-plug-in { animation: ipy-seat .22s var(--ipy-ease) backwards }
.ipy[data-boot] .ipy-cable[data-seated] .ipy-plug .ipy-plug-in { animation: none }
.ipy-pbody { fill: var(--ipy-plug); stroke: var(--ipy-plug-rim); stroke-width: .7px }
.ipy-pcollar { fill: var(--cc); transition: fill .3s }
.ipy-ptip { fill: color-mix(in oklab, var(--ipy-ink) 14%, var(--ipy-surface)); stroke: color-mix(in oklab, var(--ipy-ink) 40%, transparent); stroke-width: .75px }
.ipy-pgloss { fill: none; stroke: rgb(255 255 255 / .3); stroke-width: 1.3px; stroke-linecap: round }
:is(.dark, [data-theme="dark"]) .ipy .ipy-pgloss { stroke: rgb(255 255 255 / .16) }
.ipy-plug-hit { fill: transparent }

/* Permission labels ride on the cables */
.ipy-chips { position: absolute; inset: 0; pointer-events: none; z-index: 3 }
.ipy-chip {
  position: absolute; left: 0; top: 0; translate: -50% -50%; display: inline-flex; align-items: center; gap: 7px; height: 26px; padding: 0 11px 0 9px;
  border-radius: 999px; background: var(--ipy-surface); box-shadow: var(--ipy-float); pointer-events: auto; white-space: nowrap;
  font-size: 12.5px; line-height: 26px; font-weight: 500; color: var(--ipy-t1); will-change: transform; transition: opacity .3s;
}
.ipy-chip::before { content: ""; position: absolute; inset: -8px -4px }
.ipy-chip[data-dim] { opacity: .5 }
.ipy-chip:hover, .ipy-chip:focus-visible { z-index: 2 }
.ipy-chip i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--ipy-t3); transition: background-color .3s }
.ipy-chip[data-risk="write"] i { background: var(--ipy-warn) }
.ipy-chip[data-risk="high"] i { background: var(--ipy-danger) }
.ipy-chip-text { display: inline-block; animation: ipy-in .2s var(--ipy-ease) backwards }
.ipy-chip[data-fresh] { animation: ipy-chip-in .5s var(--ipy-ease) backwards }
.ipy[data-boot] .ipy-chip { animation: ipy-chip-in .5s var(--ipy-ease) backwards; animation-delay: calc(1.1s + var(--i, 0) * 90ms) }
.ipy-chip:active { scale: .97 }
.ipy-chip[aria-disabled="true"] { cursor: default }

/* Footer: the consequence line */
.ipy-foot { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px 16px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--ipy-line); min-height: 70px }
.ipy-foot-main { flex: 1; min-width: 0 }
.ipy-say { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; line-height: 20px; color: var(--ipy-t1) }
.ipy-say i { flex: none; width: 7px; height: 7px; margin-top: 6.5px; border-radius: 50%; background: var(--ipy-t4); transition: background-color .3s }
.ipy-say[data-tone="ok"] i { background: var(--ipy-accent) }
.ipy-say[data-tone="warn"] i { background: var(--ipy-warn) }
.ipy-say span { animation: ipy-in .35s var(--ipy-ease) backwards }
.ipy-hint { margin-top: 4px; padding-left: 16px; font-size: 12px; line-height: 18px; color: var(--ipy-t2) }
.ipy-hint kbd { font: inherit; font-weight: 500; color: var(--ipy-t1) }
.ipy-hint-s { display: none }
.ipy-actions { flex: none; display: flex; gap: 6px }
.ipy-actions button, .ipy-act {
  height: 28px; padding: 0 11px; border-radius: 8px; font-size: 12.5px; line-height: 28px; font-weight: 500;
  color: var(--ipy-t2); background: var(--ipy-fill); transition: background-color .2s, color .2s;
}
.ipy-actions button:hover, .ipy-act:hover { color: var(--ipy-t1); background: color-mix(in oklab, var(--ipy-ink) 10%, transparent) }
.ipy[data-disabled] .ipy-tool, .ipy[data-disabled] .ipy-jackhit { cursor: default }

@keyframes ipy-in { from { opacity: 0; transform: translateY(4px); filter: blur(3px) } }
@keyframes ipy-chip-in { from { opacity: 0; filter: blur(3px) } }
@keyframes ipy-seat { 0% { transform: translateX(-10px) scale(1.12) } 62% { transform: translateX(1.5px) scale(.97) } 100% { transform: none } }
@keyframes ipy-pulse { 50% { opacity: .22; transform: scale(1.1) } }
@keyframes ipy-ripple { from { opacity: .9; transform: scale(.8) } to { opacity: 0; transform: scale(2.1) } }
@keyframes ipy-shake { 20% { transform: translateX(-4px) } 45% { transform: translateX(3.5px) } 70% { transform: translateX(-2px) } }
@keyframes ipy-fresh { from { stroke-width: 8px; filter: drop-shadow(0 0 7px color-mix(in oklab, var(--cc) 70%, transparent)) } }

/* Narrower boards: smaller modules, then icon-only tools */
@container (max-width: 740px) {
  .ipy-card { padding: 18px 18px 14px }
  .ipy-caps, .ipy-stage { grid-template-columns: 188px minmax(60px, 1fr) 214px }
  .ipy-tool { padding-right: 26px }
  .ipy-legend, .ipy-arole { display: none }
  .ipy-ahead { padding-left: 18px }
}
@container (max-width: 560px) {
  .ipy-caps, .ipy-stage { grid-template-columns: 150px minmax(60px, 1fr) 190px }
  .ipy-tool { gap: 9px; padding-left: 10px }
  .ipy-glyph { width: 32px; height: 32px; border-radius: 10px }
  .ipy-tmeta, .ipy-arole { display: none }
  .ipy-ahead { gap: 8px; padding-left: 16px }
  .ipy-badge { padding: 0 6px; font-size: 11px }
}
@container (max-width: 470px) {
  .ipy-card { padding: 16px 10px 12px; border-radius: 22px }
  .ipy-head { margin-bottom: 16px }
  .ipy-title { font-size: 17px; line-height: 22px }
  .ipy-caps, .ipy-stage { grid-template-columns: 54px minmax(60px, 1fr) 106px }
  .ipy-caps { font-size: 10.5px; letter-spacing: .05em }
  .ipy-tool { flex-direction: column; justify-content: center; gap: 4px; height: 68px; padding: 0 2px; border-radius: 14px }
  .ipy-tt { align-items: center; max-width: 100% }
  .ipy-glyph { width: 28px; height: 28px; border-radius: 8px }
  .ipy-badge { display: none }
  .ipy-tname { font-size: 11px; line-height: 14px }
  .ipy-tool { padding: 0 2px }
  .ipy-aname { font-size: 13px }
  .ipy-ahead { padding-left: 14px; gap: 6px }
  .ipy-av { width: 24px; height: 24px; border-radius: 8px }
  .ipy-port { padding-left: 20px }
  .ipy-ptxt { font-size: 12px }
  .ipy-agent { padding-right: 6px; border-radius: 16px }
  .ipy-chip { height: 24px; padding: 0 9px 0 7px; font-size: 11.5px; line-height: 24px; gap: 5px }
  .ipy-hint-l { display: none }
  .ipy-hint-s { display: inline }
  .ipy-foot { flex-wrap: wrap; min-height: 56px; margin-top: 14px }
  .ipy-actions { flex: 1 0 100% }
}

@media (prefers-reduced-motion: reduce) {
  .ipy *, .ipy *::before, .ipy *::after { animation: none !important; transition: none !important }
}
@media (forced-colors: active) {
  .ipy-core, .ipy-hi { stroke: CanvasText }
  .ipy-cable[data-hot] .ipy-core, .ipy-cable[data-mode="drag"] .ipy-core, .ipy-cable[data-mode="carry"] .ipy-core { stroke: Highlight }
  .ipy-pbody, .ipy-pcollar { fill: CanvasText }
  .ipy-ptip { fill: Canvas; stroke: CanvasText }
}
`

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function useEvent<A extends unknown[], R>(fn: (...a: A) => R) {
  const ref = React.useRef(fn)
  React.useLayoutEffect(() => {
    ref.current = fn
  })
  return React.useCallback((...a: A) => ref.current(...a), [])
}

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const motionSnapshot = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

type Tone = "idle" | "ok" | "warn"
type Risk = "read" | "write" | "high"
type Hit = { kind: "port"; agent: string; port: number; key: string; dist: number } | { kind: "blocked"; agent: string; reason: "full" | "dup" }
type Cand = { agent: string; port: number; key: string }

function Plug({ end, grab, onGrab }: { end: "a" | "b"; grab?: boolean; onGrab?: (e: React.PointerEvent) => void }) {
  return (
    <g className="ipy-plug" data-end={end} data-grab={grab ? "" : undefined} onPointerDown={grab ? onGrab : undefined}>
      <g className="ipy-plug-in">
        <g transform="translate(-3 0)">
          <rect className="ipy-plug-hit" x="-33" y="-16" width="42" height="32" />
          <rect className="ipy-pbody" x="-31" y="-7" width="22" height="14" rx="5" />
          <path className="ipy-pgloss" d="M-27 -3.8H-14" />
          <rect className="ipy-pcollar" x="-12" y="-5.4" width="5" height="10.8" rx="1.4" />
          <rect className="ipy-ptip" x="-9" y="-3.5" width="9.5" height="7" rx="2.3" />
        </g>
      </g>
    </g>
  )
}

const CableSvg = React.memo(function CableSvg({
  id, mode, risk, hot, dim, fresh, grab, onGrab, reg,
}: {
  id: string
  mode: Mode
  risk: Risk
  hot: boolean
  dim: boolean
  fresh: boolean
  grab: boolean
  onGrab: (e: React.PointerEvent, id: string) => void
  reg: (id: string, g: SVGGElement | null) => void
}) {
  const ref = React.useCallback((g: SVGGElement | null) => reg(id, g), [reg, id])
  return (
    <g
      ref={ref}
      className="ipy-cable"
      data-mode={mode}
      data-risk={risk}
      data-hot={hot ? "" : undefined}
      data-dim={dim ? "" : undefined}
      data-fresh={fresh ? "" : undefined}
      data-seated={mode === "seated" ? "" : undefined}
    >
      <path className="ipy-sh" />
      <path className="ipy-core" />
      <path className="ipy-hi" />
      <Plug end="a" />
      <Plug end="b" grab={grab} onGrab={(e) => onGrab(e, id)} />
    </g>
  )
})

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

export function Patchbay({
  tools = DEFAULT_TOOLS,
  agents = DEFAULT_AGENTS,
  links: linksProp,
  defaultLinks = DEFAULT_LINKS,
  onLinksChange,
  title = "Agent access",
  subtitle,
  actions,
  disabled = false,
  className,
}: PatchbayProps) {
  const [inner, setInner] = React.useState<PatchbayLink[]>(defaultLinks)
  const links = React.useMemo(() => normalize(linksProp ?? inner, tools, agents), [linksProp, inner, tools, agents])

  const [drag, setDrag] = React.useState<null | { tool: string; lifted: LinkN | null; via: "pointer" | "key" }>(null)
  const [hot, setHot] = React.useState<string | null>(null)
  const [blocked, setBlocked] = React.useState<string | null>(null)
  const [hover, setHover] = React.useState<null | { kind: "tool" | "agent" | "cable"; id: string }>(null)
  const [ghosts, setGhosts] = React.useState<{ key: string; tool: string; risk: Risk }[]>([])
  const [fresh, setFresh] = React.useState<{ link: string | null; port: string | null }>({ link: null, port: null })
  const [shake, setShake] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<null | { text: string; tone: Tone }>(null)
  const [boot, setBoot] = React.useState(true)

  const stageRef = React.useRef<HTMLDivElement>(null)
  const timers = React.useRef<{ fresh?: number; shake?: number }>({})
  const ghostN = React.useRef(0)
  const dr = React.useRef({
    px: 0, py: 0, offx: 0, offy: 0, liftx: 0, liftY: 0, tool: "", lifted: null as LinkN | null, via: "pointer" as "pointer" | "key",
    hit: null as Hit | null, hotKey: null as string | null, blockedAgent: null as string | null, cands: [] as Cand[], idx: 0,
    sx: 0, sy: 0, pid: -1, detach: null as null | (() => void),
  })

  const reducedMotion = React.useSyncExternalStore(subscribeMotion, motionSnapshot, () => false)
  const ghostDone = useEvent((key: string) => setGhosts((g) => g.filter((x) => x.key !== key)))
  const booted = useEvent(() => setBoot(false))
  const [eng] = React.useState<Engine>(() => createEngine())

  const toolById = React.useMemo(() => new Map(tools.map((t) => [t.id, t])), [tools])
  const agentById = React.useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents])
  const scopeOf = (l: { tool: string; scope: string }) => toolById.get(l.tool)?.scopes.find((s) => s.id === l.scope)
  const riskOf = (l: { tool: string; scope: string }): Risk => scopeOf(l)?.risk ?? "read"

  const liftedKey = drag?.lifted ? linkKey(drag.lifted) : null
  const seats = React.useMemo(() => links.filter((l) => linkKey(l) !== liftedKey), [links, liftedKey])

  const say = (text: string, tone: Tone = "idle") => setStatus({ text, tone })
  const markFresh = (link: string | null, port: string | null) => {
    setFresh({ link, port })
    window.clearTimeout(timers.current.fresh)
    timers.current.fresh = window.setTimeout(() => setFresh({ link: null, port: null }), 1600)
  }

  const commitLinks = (next: LinkN[]) => {
    if (sameLinks(next, links)) return
    onLinksChange?.(next)
    if (linksProp === undefined) setInner(next)
  }

  /* ---- engine lifecycle ---- */
  React.useLayoutEffect(() => {
    eng.setHost({ stage: stageRef, ghostDone, booted })
  }, [eng, ghostDone, booted])

  React.useLayoutEffect(() => {
    eng.setReduced(reducedMotion)
  }, [eng, reducedMotion])

  React.useLayoutEffect(() => {
    eng.measure()
    eng.sync(seats.map((l) => ({ key: linkKey(l), tool: l.tool, port: portKey(l.agent, l.port) })))
    eng.drawAll()
    eng.wake()
  }, [eng, seats, tools, agents])

  // a label can change width when its permission changes: measure again and re-lay the labels
  React.useLayoutEffect(() => {
    eng.chips.forEach((el, k) => eng.chipW.set(k, el.offsetWidth))
    eng.layChips()
  }, [eng, links])

  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let alive = true
    const ro = new ResizeObserver(() => {
      eng.measure()
      eng.resync()
      eng.drawAll()
      eng.wake()
    })
    ro.observe(stage)
    const io = new IntersectionObserver((entries) => {
      const en = entries[entries.length - 1]
      eng.setVisible(en.isIntersecting)
    })
    io.observe(stage)
    const onVis = () => eng.wake()
    document.addEventListener("visibilitychange", onVis)
    document.fonts?.ready.then(() => {
      if (!alive) return
      eng.measure()
      eng.wake()
    })
    const t = timers.current
    const d = dr.current
    return () => {
      alive = false
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      eng.stop()
      window.clearTimeout(t.fresh)
      window.clearTimeout(t.shake)
      d.detach?.()
    }
  }, [eng])

  const regCable = React.useCallback(
    (id: string, g: SVGGElement | null) => {
      if (!g) {
        eng.els.delete(id)
        return
      }
      const [sh, core, hi] = Array.from(g.children).slice(0, 3) as SVGPathElement[]
      const plugs = g.querySelectorAll<SVGGElement>(":scope > .ipy-plug")
      eng.els.set(id, { sh, core, hi, pa: plugs[0], pb: plugs[1] })
      const s = eng.sims.get(id)
      if (s) eng.draw(id, s)
    },
    [eng],
  )
  // one stable ref for every label: it learns its key from data-ipy-chip and hands back its own cleanup
  const chipRef = React.useCallback(
    (el: HTMLElement | null) => {
      if (!el) return
      const k = el.dataset.ipyChip as string
      eng.chips.set(k, el)
      eng.chipW.set(k, el.offsetWidth)
      eng.layChips()
      return () => {
        eng.chips.delete(k)
        eng.chipW.delete(k)
      }
    },
    [eng],
  )

  /* ---- hit testing ---- */
  const findTarget = (tx: number, ty: number, tool: string, skipKey: string | null): Hit | null => {
    let best: Extract<Hit, { kind: "port" }> | null = null
    let blockedHit: Hit | null = null
    for (const ag of agents) {
      const card = eng.anchors.card.get(ag.id)
      const inside = !!card && tx >= card.l - 14 && tx <= card.r + 10 && ty >= card.t - 6 && ty <= card.b + 6
      const pairTaken = links.some((l) => l.tool === tool && l.agent === ag.id && linkKey(l) !== skipKey)
      let anyFree = false
      for (let i = 0; i < (ag.ports ?? 3); i++) {
        const occupied = links.some((l) => l.agent === ag.id && l.port === i && linkKey(l) !== skipKey)
        if (occupied || pairTaken) continue
        anyFree = true
        const P = eng.anchors.port.get(portKey(ag.id, i))
        if (!P) continue
        const dist = Math.hypot(P.x - tx, P.y - ty)
        if ((dist <= 46 || inside) && (!best || dist < best.dist)) best = { kind: "port", agent: ag.id, port: i, key: portKey(ag.id, i), dist }
      }
      if (inside && !anyFree && !blockedHit) blockedHit = { kind: "blocked", agent: ag.id, reason: pairTaken ? "dup" : "full" }
    }
    return best ?? blockedHit
  }

  const retarget = useEvent((dt: number) => {
    const d = dr.current
    if (d.via === "key") return
    if (dt) {
      const k = Math.exp(-9 * dt)
      d.offx *= k
      d.offy *= k
    }
    const tx = d.px + d.offx + d.liftx
    const ty = d.py + d.offy + d.liftY
    const hit = findTarget(tx, ty, d.tool, d.lifted ? linkKey(d.lifted) : null)
    d.hit = hit
    let ex = tx
    let ey = ty
    if (hit?.kind === "port") {
      const P = eng.anchors.port.get(hit.key)
      if (P) {
        const m0 = clamp((84 - hit.dist) / 64, 0, 1)
        const m = m0 * m0 * (3 - 2 * m0)
        ex = tx + (P.x - tx) * m
        ey = ty + (P.y - ty) * m
      }
    }
    eng.setTarget(ex, ey)
    const hk = hit?.kind === "port" ? hit.key : null
    const ba = hit?.kind === "blocked" ? hit.agent : null
    if (hk !== d.hotKey) {
      d.hotKey = hk
      setHot(hk)
    }
    if (ba !== d.blockedAgent) {
      d.blockedAgent = ba
      setBlocked(ba)
    }
  })

  React.useLayoutEffect(() => {
    eng.setRetarget(retarget)
    return () => eng.setRetarget(null)
  }, [eng, retarget])

  /* ---- finishing a drag or a carry ---- */
  const conclude = (hit: Hit | null) => {
    const d = dr.current
    const tool = toolById.get(d.tool)
    const lifted = d.lifted
    d.detach?.()
    d.detach = null
    eng.setDrag(false)
    d.hotKey = null
    d.blockedAgent = null
    setHot(null)
    setBlocked(null)
    setDrag(null)
    const sim = eng.sims.get("drag")
    if (!tool || !tool.scopes.length) {
      eng.sims.delete("drag")
      return
    }
    if (hit?.kind === "port" && sim) {
      const agent = agentById.get(hit.agent)
      const link: LinkN = { tool: tool.id, agent: hit.agent, port: hit.port, scope: lifted?.scope ?? tool.scopes[0].id }
      const base = links.filter((l) => linkKey(l) !== (lifted ? linkKey(lifted) : ""))
      eng.sims.delete("drag")
      eng.sims.set(linkKey(link), sim)
      eng.setMode(sim, "seated", hit.key)
      eng.kick(sim, 1.7)
      const moved = !lifted || lifted.agent !== hit.agent || lifted.port !== hit.port
      commitLinks([...base, link])
      if (moved && agent) {
        const sc = tool.scopes.find((s) => s.id === link.scope) as PatchbayScope
        say(`${agent.name} can now ${sc.can}.${sc.note ? ` ${sc.note}` : ""}`, sc.risk ? "warn" : "ok")
        markFresh(linkKey(link), hit.key)
      } else if (!moved && agent) {
        say(`${tool.name} stays on ${agent.name}.`, "idle")
      }
    } else {
      if (sim) {
        const gk = `${GHOST}${++ghostN.current}`
        eng.sims.delete("drag")
        eng.sims.set(gk, sim)
        eng.setMode(sim, "retract", null)
        const risk = lifted ? riskOf(lifted) : "read"
        setGhosts((g) => [...g, { key: gk, tool: tool.id, risk }])
      }
      if (hit?.kind === "blocked") {
        const ag = agentById.get(hit.agent)
        setShake(hit.agent)
        window.clearTimeout(timers.current.shake)
        timers.current.shake = window.setTimeout(() => setShake(null), 450)
        say(hit.reason === "full" ? `${ag?.name} has no free port. Unplug a cable first.` : `${ag?.name} already has ${tool.name}.`, "warn")
      }
      if (lifted) {
        commitLinks(links.filter((l) => linkKey(l) !== linkKey(lifted)))
        const sc = scopeOf(lifted)
        say(`${agentById.get(lifted.agent)?.name} can no longer ${sc?.can}.`, "idle")
      } else if (hit?.kind !== "blocked") {
        say(`Cable put back. Drop it on a free port to connect ${tool.name}.`, "idle")
      }
    }
    eng.wake()
  }

  /** Puts a lifted cable back where it came from, or a new one back on its jack. */
  const cancel = () => {
    const l = dr.current.lifted
    conclude(l ? { kind: "port", agent: l.agent, port: l.port, key: portKey(l.agent, l.port), dist: 0 } : null)
  }

  /* ---- pointer drag: only the pointer that picked the cable up can steer or drop it ---- */
  const onMove = useEvent((ev: PointerEvent) => {
    const d = dr.current
    if (ev.pointerId !== d.pid) return
    const r = stageRef.current?.getBoundingClientRect()
    if (r) {
      d.sx = r.left
      d.sy = r.top
    }
    d.px = ev.clientX - d.sx
    d.py = ev.clientY - d.sy
    retarget(0)
    eng.wake()
  })
  const onUp = useEvent((ev: PointerEvent) => {
    if (ev.pointerId === dr.current.pid) conclude(dr.current.hit)
  })
  const onPointerCancel = useEvent((ev: PointerEvent) => {
    if (ev.pointerId === dr.current.pid) cancel()
  })
  const onKeyWin = useEvent((ev: KeyboardEvent) => {
    if (ev.key === "Escape") cancel()
  })

  const beginDrag = (e: React.PointerEvent, toolId: string, lifted: LinkN | null) => {
    if (disabled || eng.drag.on) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    const stage = stageRef.current
    const tool = toolById.get(toolId)
    if (!stage || !tool?.scopes.length) return
    e.preventDefault()
    e.stopPropagation()
    eng.measure()
    const sr = stage.getBoundingClientRect()
    const d = dr.current
    const touch = e.pointerType !== "mouse"
    d.sx = sr.left
    d.sy = sr.top
    d.px = e.clientX - sr.left
    d.py = e.clientY - sr.top
    d.pid = e.pointerId
    d.tool = toolId
    d.lifted = lifted
    d.via = "pointer"
    d.liftx = 0
    d.liftY = touch ? -30 : 0
    let sim: Sim | undefined
    if (lifted) {
      sim = eng.sims.get(linkKey(lifted))
      eng.sims.delete(linkKey(lifted))
      if (sim) {
        d.offx = sim.bx - d.px
        d.offy = sim.by - d.py
      }
    } else {
      const a = eng.anchors.jack.get(toolId)
      if (!a) return
      sim = makeSim(a, a, toolId, null, "drag")
      sim.len = 8
      layOut(sim, 8)
      d.offx = 0
      d.offy = 0
    }
    if (!sim) return
    eng.setMode(sim, "drag", null)
    eng.sims.set("drag", sim)
    eng.setDrag(true)
    setBoot(false)
    setDrag({ tool: toolId, lifted, via: "pointer" })
    retarget(0)
    say(lifted ? `Moving ${tool.name} off ${agentById.get(lifted.agent)?.name}. Drop it on a free port, or anywhere else to unplug.` : `Drag ${tool.name} to a free port.`, "idle")
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onPointerCancel)
    window.addEventListener("keydown", onKeyWin)
    d.detach = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onPointerCancel)
      window.removeEventListener("keydown", onKeyWin)
    }
    eng.wake()
  }

  /* ---- keyboard carry ---- */
  const candidates = (toolId: string, skipKey: string | null): Cand[] => {
    const out: Cand[] = []
    for (const ag of agents) {
      if (links.some((l) => l.tool === toolId && l.agent === ag.id && linkKey(l) !== skipKey)) continue
      for (let i = 0; i < (ag.ports ?? 3); i++) {
        if (links.some((l) => l.agent === ag.id && l.port === i && linkKey(l) !== skipKey)) continue
        out.push({ agent: ag.id, port: i, key: portKey(ag.id, i) })
      }
    }
    return out
  }

  /** The long instruction is said once, when the cable is picked up; after that only where it is. */
  const aim = (c: Cand, toolId: string, first: boolean) => {
    const d = dr.current
    eng.setAim(c.key)
    d.hotKey = c.key
    setHot(c.key)
    const where = `${agentById.get(c.agent)?.name}, port ${c.port + 1}`
    say(
      first
        ? `Carrying ${toolById.get(toolId)?.name}. ${where}. Up and Down choose a port, Left and Right choose an agent, Enter plugs in, Escape puts it back.`
        : `${toolById.get(toolId)?.name} to ${where}. Enter plugs in.`,
      "idle",
    )
    eng.wake()
  }

  /** Picks up a new cable from a jack, or, with `lifted`, a seated cable from its port (keeps its permission). */
  const startCarry = (toolId: string, lifted: LinkN | null = null) => {
    if (disabled || eng.drag.on) return
    const tool = toolById.get(toolId)
    if (!tool?.scopes.length) return
    const lk = lifted ? linkKey(lifted) : null
    const cands = candidates(toolId, lk)
    if (!cands.length) {
      say(`${tool.name} has no free port to plug into.`, "warn")
      return
    }
    const a = eng.anchors.jack.get(toolId)
    if (!a) return
    let sim: Sim | undefined
    if (lifted && lk) {
      sim = eng.sims.get(lk)
      if (!sim) return
      eng.sims.delete(lk)
      eng.setMode(sim, "carry", null)
    } else {
      sim = makeSim(a, a, toolId, null, "carry")
      sim.len = 8
      layOut(sim, 8)
    }
    const d = dr.current
    d.tool = toolId
    d.lifted = lifted
    d.via = "key"
    d.cands = cands
    d.idx = lifted ? Math.max(0, cands.findIndex((c) => c.key === portKey(lifted.agent, lifted.port))) : 0
    d.hit = null
    eng.sims.set("drag", sim)
    eng.setDrag(true)
    setBoot(false)
    setDrag({ tool: toolId, lifted, via: "key" })
    aim(cands[d.idx], toolId, true)
    stageRef.current?.querySelector<HTMLElement>(`[data-ipy-jack="${CSS.escape(toolId)}"]`)?.focus()
  }

  const onJackKey = (e: React.KeyboardEvent, toolId: string) => {
    const d = dr.current
    const carrying = eng.drag.on && d.via === "key" && d.tool === toolId
    if (!carrying) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        startCarry(toolId)
      }
      return
    }
    const n = d.cands.length
    const go = (i: number) => {
      d.idx = (i + n) % n
      aim(d.cands[d.idx], toolId, false)
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      go(d.idx + (e.key === "ArrowDown" ? 1 : -1))
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault()
      const dir = e.key === "ArrowRight" ? 1 : -1
      const cur = d.cands[d.idx].agent
      let j = d.idx
      for (let k = 1; k <= n; k++) {
        const c = d.cands[(d.idx + dir * k + n * 2) % n]
        if (c.agent !== cur) {
          j = (d.idx + dir * k + n * 2) % n
          break
        }
      }
      if (dir < 0) while (j > 0 && d.cands[j - 1].agent === d.cands[j].agent) j--
      go(j)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const c = d.cands[d.idx]
      conclude({ kind: "port", agent: c.agent, port: c.port, key: c.key, dist: 0 })
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    }
  }

  const onJackBlur = (toolId: string) => {
    const d = dr.current
    setHover(null)
    if (eng.drag.on && d.via === "key" && d.tool === toolId) cancel()
  }

  /* ---- cables: change access, move, unplug ---- */
  const cycle = (l: LinkN, dir: 1 | -1) => {
    if (disabled) return
    const tool = toolById.get(l.tool)
    if (!tool || tool.scopes.length < 2) {
      say(`${tool?.name ?? "This tool"} has one permission, so there is nothing to change.`, "idle")
      return
    }
    const i = tool.scopes.findIndex((s) => s.id === l.scope)
    const sc = tool.scopes[(i + dir + tool.scopes.length) % tool.scopes.length]
    commitLinks(links.map((x) => (linkKey(x) === linkKey(l) ? { ...x, scope: sc.id } : x)))
    say(`${agentById.get(l.agent)?.name} can now ${sc.can}.${sc.note ? ` ${sc.note}` : ""}`, sc.risk ? "warn" : "ok")
    markFresh(linkKey(l), null)
    const s = eng.sims.get(linkKey(l))
    if (s) eng.kick(s, 0.9)
    eng.wake()
  }

  const unplug = (l: LinkN) => {
    if (disabled) return
    const k = linkKey(l)
    const sim = eng.sims.get(k)
    if (sim) {
      const gk = `${GHOST}${++ghostN.current}`
      eng.sims.delete(k)
      eng.sims.set(gk, sim)
      eng.setMode(sim, "retract", null)
      setGhosts((g) => [...g, { key: gk, tool: l.tool, risk: riskOf(l) }])
    }
    commitLinks(links.filter((x) => linkKey(x) !== k))
    say(`${agentById.get(l.agent)?.name} can no longer ${scopeOf(l)?.can}.`, "idle")
    stageRef.current?.querySelector<HTMLElement>(`[data-ipy-jack="${CSS.escape(l.tool)}"]`)?.focus()
    eng.wake()
  }

  const onChipKey = (e: React.KeyboardEvent, l: LinkN) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault()
      unplug(l)
    } else if ((e.key === "m" || e.key === "M") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      startCarry(l.tool, l)
    }
  }

  const grabCable = useEvent((e: React.PointerEvent, id: string) => {
    const l = seats.find((x) => linkKey(x) === id)
    if (l) beginDrag(e, l.tool, l)
  })

  /* ---- derived view ---- */
  const dragRisk: Risk = drag?.lifted ? riskOf(drag.lifted) : "read"
  const items: { key: string; mode: Mode; risk: Risk; tool: string; agent: string | null }[] = [
    ...seats.map((l) => ({ key: linkKey(l), mode: "seated" as Mode, risk: riskOf(l), tool: l.tool, agent: l.agent as string | null })),
    ...(drag ? [{ key: "drag", mode: (drag.via === "key" ? "carry" : "drag") as Mode, risk: dragRisk, tool: drag.tool, agent: null }] : []),
    ...ghosts.map((g) => ({ key: g.key, mode: "retract" as Mode, risk: g.risk, tool: g.tool, agent: null })),
  ]

  const matchHover = (it: { tool: string; agent: string | null; key: string }) =>
    !!hover && !drag && ((hover.kind === "tool" && it.tool === hover.id) || (hover.kind === "agent" && it.agent === hover.id) || (hover.kind === "cable" && it.key === hover.id))

  const level = (agentId: string): "none" | Risk => {
    const mine = links.filter((l) => l.agent === agentId)
    if (!mine.length) return "none"
    if (mine.some((l) => riskOf(l) === "high")) return "high"
    return mine.some((l) => riskOf(l) === "write") ? "write" : "read"
  }

  const idleText = React.useMemo(() => {
    if (!links.length) return "No cables yet. Drag from a jack to a port to give an agent a tool."
    const writers: string[] = []
    const readers: string[] = []
    for (const a of agents) {
      const mine = links.filter((l) => l.agent === a.id)
      if (!mine.length) continue
      const w = mine.some((l) => toolById.get(l.tool)?.scopes.find((s) => s.id === l.scope)?.risk)
      ;(w ? writers : readers).push(a.name)
    }
    const parts: string[] = []
    if (writers.length) parts.push(`${names(writers)} can change things.`)
    if (readers.length) parts.push(`${names(readers)} ${readers.length > 1 ? "only read" : "only reads"}.`)
    return `${links.length} ${links.length === 1 ? "cable" : "cables"} live. ${parts.join(" ")}`
  }, [links, agents, toolById])

  const text = status?.text ?? idleText
  const tone: Tone = status?.tone ?? "idle"

  const hasWrite = tools.some((t) => t.scopes.some((s) => s.risk === "write"))
  const hasHigh = tools.some((t) => t.scopes.some((s) => s.risk === "high"))
  const sub = subtitle ?? `${tools.length} ${tools.length === 1 ? "tool" : "tools"}, ${agents.length} ${agents.length === 1 ? "agent" : "agents"}`

  return (
    <div
      className={["ipy", className].filter(Boolean).join(" ")}
      data-disabled={disabled ? "" : undefined}
      data-dragging={drag ? "" : undefined}
      data-boot={boot ? "" : undefined}
    >
      <style href="patchbay" precedence="default">{STYLES}</style>
      <div className="ipy-card" role="group" aria-label={`${title}: connect tools to agents`}>
        <div className="ipy-head">
          <div>
            <h3 className="ipy-title">{title}</h3>
            {sub ? <p className="ipy-sub">{sub}</p> : null}
          </div>
          <div className="ipy-legend" aria-hidden="true">
            <span><i />Reads</span>
            {hasWrite ? <span data-risk="write"><i />Changes things</span> : null}
            {hasHigh ? <span data-risk="high"><i />High stakes</span> : null}
          </div>
        </div>

        <div className="ipy-caps" aria-hidden="true">
          <span>Tools</span>
          <span />
          <span>Agents</span>
        </div>

        <div className="ipy-stage" ref={stageRef}>
          <div className="ipy-mid" aria-hidden="true" />

          <ul className="ipy-tools" role="list" aria-label="Tools">
            {tools.map((t) => {
              const count = links.filter((l) => l.tool === t.id).length
              const carrying = drag?.tool === t.id
              const keyCarry = carrying && drag?.via === "key"
              return (
                <li
                  key={t.id}
                  className="ipy-tool"
                  data-tool={t.id}
                  data-active={carrying ? "" : undefined}
                  data-hot={hover?.kind === "tool" && hover.id === t.id && !drag ? "" : undefined}
                  onPointerEnter={() => setHover({ kind: "tool", id: t.id })}
                  onPointerLeave={() => setHover(null)}
                  onPointerDown={(e) => {
                    if (e.pointerType === "mouse") beginDrag(e, t.id, null)
                  }}
                >
                  <span className="ipy-glyph" aria-hidden="true">{t.icon}</span>
                  <span className="ipy-tt">
                    <span className="ipy-tname">{t.name}</span>
                    {count === 0 ? (
                      <span className="ipy-tmeta" data-off="">Not connected</span>
                    ) : t.detail ? (
                      <span className="ipy-tmeta">{t.detail}</span>
                    ) : null}
                  </span>
                  <span className="ipy-jackhit" onPointerDown={(e) => beginDrag(e, t.id, null)}>
                    <button
                      type="button"
                      className="ipy-hole ipy-jack"
                      data-ipy-jack={t.id}
                      aria-disabled={disabled ? true : undefined}
                      aria-pressed={keyCarry}
                      aria-label={
                        keyCarry
                          ? `Carrying ${t.name}. Arrow keys choose a port, Enter plugs in, Escape puts it back.`
                          : `${t.name} output, ${count} ${count === 1 ? "cable" : "cables"}. Press Enter to pick up a new cable.`
                      }
                      onKeyDown={(e) => onJackKey(e, t.id)}
                      onBlur={() => onJackBlur(t.id)}
                      onFocus={() => setHover({ kind: "tool", id: t.id })}
                    />
                  </span>
                </li>
              )
            })}
          </ul>

          <ul className="ipy-agents" role="list" aria-label="Agents">
            {agents.map((a) => {
              const lv = level(a.id)
              const nPorts = a.ports ?? 3
              return (
                <li
                  key={a.id}
                  className="ipy-agent"
                  data-ipy-card={a.id}
                  data-hot={hover?.kind === "agent" && hover.id === a.id && !drag ? "" : undefined}
                  data-over={hot?.startsWith(`${a.id}#`) ? "" : undefined}
                  data-blocked={blocked === a.id ? "" : undefined}
                  data-shake={shake === a.id ? "" : undefined}
                  onPointerEnter={() => setHover({ kind: "agent", id: a.id })}
                  onPointerLeave={() => setHover(null)}
                >
                  <div className="ipy-ahead">
                    <span className="ipy-av" aria-hidden="true">{a.icon}</span>
                    <span className="ipy-an">
                      <span className="ipy-aname">{a.name}</span>
                      {a.role ? <span className="ipy-arole">{a.role}</span> : null}
                    </span>
                    <span className="ipy-badge" data-level={lv}>
                      <i />
                      {lv === "high" ? "High stakes" : lv === "write" ? "Can change" : lv === "read" ? "Read only" : "No tools"}
                    </span>
                  </div>
                  <ul className="ipy-ports" role="list" aria-label={`${a.name} ports`}>
                    {Array.from({ length: nPorts }, (_, i) => {
                      const key = portKey(a.id, i)
                      const l = seats.find((x) => x.agent === a.id && x.port === i)
                      const open = !!drag && !l && !links.some((x) => x.tool === drag.tool && x.agent === a.id && linkKey(x) !== liftedKey)
                      return (
                        <li
                          key={key}
                          className="ipy-port"
                          data-state={l ? "seated" : "free"}
                          data-open={open ? "" : undefined}
                          data-hot={hot === key ? "" : undefined}
                          data-fresh={fresh.port === key ? "" : undefined}
                        >
                          <span className="ipy-hole" data-ipy-port={key} aria-hidden="true" />
                          <span className="ipy-ptxt">{l ? toolById.get(l.tool)?.name : hot === key ? "Drop to connect" : "Free port"}</span>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>

          <svg className="ipy-wires" aria-hidden="true" focusable="false">
            {items.map((it) => (
              <CableSvg
                key={it.key}
                id={it.key}
                mode={it.mode}
                risk={it.risk}
                hot={matchHover(it)}
                dim={!!hover && !drag && !matchHover(it) && it.mode === "seated"}
                fresh={fresh.link === it.key}
                grab={it.mode === "seated" && !disabled}
                onGrab={grabCable}
                reg={regCable}
              />
            ))}
          </svg>

          <div className="ipy-chips">
            {seats.map((l, index) => {
              const tool = toolById.get(l.tool)
              const agent = agentById.get(l.agent)
              const sc = scopeOf(l)
              if (!tool || !agent || !sc) return null
              const k = linkKey(l)
              const hit = matchHover({ key: k, tool: l.tool, agent: l.agent })
              return (
                <button
                  key={k}
                  type="button"
                  className="ipy-chip"
                  ref={chipRef}
                  data-ipy-chip={k}
                  data-risk={sc.risk ?? "read"}
                  data-hot={hit ? "" : undefined}
                  data-dim={!!hover && !drag && !hit ? "" : undefined}
                  data-fresh={fresh.link === k ? "" : undefined}
                  style={{ "--i": index } as React.CSSProperties}
                  aria-disabled={disabled ? true : undefined}
                  aria-label={`${tool.name} to ${agent.name}: ${sc.label}. Enter changes the permission, M moves the plug, Delete unplugs.`}
                  onClick={(e) => cycle(l, e.shiftKey ? -1 : 1)}
                  onKeyDown={(e) => onChipKey(e, l)}
                  onPointerEnter={() => setHover({ kind: "cable", id: k })}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover({ kind: "cable", id: k })}
                  onBlur={() => setHover(null)}
                >
                  <i aria-hidden="true" />
                  <span className="ipy-chip-text" key={sc.id}>{sc.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="ipy-foot">
          <div className="ipy-foot-main">
            <p className="ipy-say" data-tone={tone} aria-live="polite">
              <i aria-hidden="true" />
              <span key={text}>{text}</span>
            </p>
            <p className="ipy-hint">
              <span className="ipy-hint-l">
                Drag a jack to a free port. Click a label to change access, <kbd>M</kbd> moves a plug, <kbd>Delete</kbd> unplugs.
              </span>
              <span className="ipy-hint-s">Drag a jack to a free port. Tap a label to change access.</span>
            </p>
          </div>
          {actions ? <div className="ipy-actions">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

export default Patchbay

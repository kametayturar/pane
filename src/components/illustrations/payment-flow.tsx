"use client"

import * as React from "react"
import { Landmark, Network, Nfc, ShieldCheck, Wallet } from "lucide-react"

/**
 * PaymentFlow – a card tap goes to a processor, then the card network, then the issuing bank and back with an
 * authorization; settlement then runs on a second rail: the funds clear through the network, the processor keeps
 * its fee (the chip turns into the net amount) and the payout lands in the merchant balance, which counts up.
 *
 *   <PaymentFlow amount={42.5} fee={1.53} balance={1284.1} currency="USD" />
 */

export type PaymentFlowNode = {
  /** First line of the stop. */
  label: string
  /** Resting second line (the status line takes over while the stop is working). */
  meta?: string
  /** One-line tag shown on hover. */
  detail?: string
  /** Glyph: any ReactNode (lucide icon, <img>, svg). */
  icon?: React.ReactNode
  /** Colour of the glyph. Muted by default. */
  color?: string
}
export type PaymentFlowProps = {
  /** The five stops. Each one you pass replaces the default for that stop. */
  nodes?: { terminal?: PaymentFlowNode; processor?: PaymentFlowNode; network?: PaymentFlowNode; issuer?: PaymentFlowNode; merchant?: PaymentFlowNode }
  /** The charge, shown on the chip that travels to the bank. Default 42.5. */
  amount?: number
  /** What the processor keeps at settlement; the payout is amount minus fee. Default 1.53. */
  fee?: number
  /** Merchant balance before the first payout. It grows by the payout on every loop. Default 1284.1. */
  balance?: number
  /** ISO currency code for every amount. Default "USD". */
  currency?: string
  /** Locale for money formatting. Keep it fixed so server and browser agree. Default "en-US". */
  locale?: string
  /** Authorization time the step row counts to, in milliseconds. Default 1340. */
  authorizationMs?: number
  /** Phase names in the step row, when settlement happens, and the text on the approval chip. */
  labels?: { authorization?: string; settlement?: string; settlementTime?: string; approved?: string }
  /** Hide the step row and show only the diagram. */
  hideSteps?: boolean
  /** Motion speed multiplier – 1 is the designed pace (one payment takes about 15 seconds). */
  speed?: number
  /** Freeze all motion on the current frame (it eases to rest). */
  paused?: boolean
  /** Accent colour (any CSS colour) for the moving amount, the active path and the settlement rail. */
  accent?: string
  /** Accessible description of the diagram. Built from the nodes and amounts when left out. */
  label?: string
  /** Optional visible caption under the diagram. */
  caption?: React.ReactNode
  className?: string
}

const ic = { strokeWidth: 1.75, "aria-hidden": true } as const
const DEFAULT_NODES = {
  terminal: { label: "Checkout", meta: "Tap to pay", detail: "A card or phone is tapped on the reader", icon: <Nfc {...ic} /> },
  processor: { label: "Payments", meta: "Processor", detail: "Checks risk and forwards the request", icon: <ShieldCheck {...ic} />, color: "#6d5ae6" },
  network: { label: "Card network", meta: "Routing", detail: "Routes it to the bank that issued the card", icon: <Network {...ic} />, color: "#e8731a" },
  issuer: { label: "Bank", meta: "Card issuer", detail: "Checks the balance and holds the funds", icon: <Landmark {...ic} /> },
  merchant: { label: "Your balance", detail: "Receives the payout, minus fees", icon: <Wallet {...ic} /> },
}

/* -------------------------------------------------------------------------- */
/*                                 Geometry                                   */
/* -------------------------------------------------------------------------- */

const W = 660
const STAGE_H = 392
const STEPS_Y = 414
const H = 450
const CHIP_H = 56
const CHIP_W = 240
const COL = CHIP_W / 2 // x of the vertical wires
const TOPS = [10, 118, 226, 334]
const YS = TOPS.map((t) => t + CHIP_H / 2) // 38 146 254 362
const RAIL_X = 455
const RAD = 18
const MERCH_X = 250
const T = 15
const START_RUN = 0.5
const START_STILL = 11.7

// Settlement rail (bank → right → up to the balance).
const R_H = RAIL_X - RAD - COL // straight run along the bottom
const R_ARC = (Math.PI / 2) * RAD
const R_V = YS[3] - RAD - YS[0]
const R_L = R_H + R_ARC + R_V
const D_NET = R_H + R_ARC + (YS[3] - RAD - YS[2])
const D_PROC = R_H + R_ARC + (YS[3] - RAD - YS[1])
const railPath = `M${COL} ${YS[3]} L${COL + R_H} ${YS[3]} Q${RAIL_X} ${YS[3]} ${RAIL_X} ${YS[3] - RAD} L${RAIL_X} ${YS[0]}`

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const ease = (p: number) => {
  const x = clamp01(p)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
const lerp = (a: number, b: number, p: number) => a + (b - a) * p

/** Position on the settlement rail at distance d. */
function railAt(d: number): [number, number] {
  if (d <= R_H) return [COL + d, YS[3]]
  if (d <= R_H + R_ARC) {
    const phi = (d - R_H) / RAD
    return [COL + R_H + RAD * Math.sin(phi), YS[3] - RAD + RAD * Math.cos(phi)]
  }
  return [RAIL_X, YS[3] - RAD - (d - R_H - R_ARC)]
}

/** The amount chip's y while it travels down the chain (it dwells under each chip). */
function amountY(u: number) {
  const hop = (a: number, b: number, k: number) => lerp(YS[k], YS[k + 1], ease((u - a) / (b - a)))
  if (u < 0.85) return YS[0]
  if (u < 1.75) return hop(0.85, 1.75, 0)
  if (u < 2.35) return YS[1]
  if (u < 3.25) return hop(2.35, 3.25, 1)
  if (u < 3.85) return YS[2]
  if (u < 4.75) return hop(3.85, 4.75, 2)
  return YS[3]
}
const AUTH_END = 7.9
const approvalY = (u: number) => YS[3] - (YS[3] - YS[0]) * ease((u - 5.6) / (AUTH_END - 5.6))
/** Distance travelled on the settlement rail. */
function settleD(u: number) {
  if (u < 8.5) return 0
  if (u < 10.0) return D_NET * ease((u - 8.5) / 1.5)
  if (u < 10.4) return D_NET
  if (u < 11.4) return lerp(D_NET, D_PROC, ease((u - 10.4) / 1))
  if (u < 12.0) return D_PROC
  if (u < 13.0) return lerp(D_PROC, R_L, ease((u - 12.0) / 1))
  return R_L
}

type Tone = "idle" | "active" | "done" | "ok"
const RESET_AT = 14.75

const cache = new WeakMap<Element, Record<string, string>>()
function put(el: Element | null | undefined, kind: "a" | "s", key: string, value: string | number) {
  if (!el) return
  const v = typeof value === "number" ? String(Math.round(value * 1000) / 1000) : value
  let c = cache.get(el)
  if (!c) cache.set(el, (c = {}))
  const k = kind + key
  if (c[k] === v) return
  c[k] = v
  if (kind === "a") el.setAttribute(key, v)
  else (el as HTMLElement).style.setProperty(key, v)
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const CSS = `
.pyf {
  --pyf-ink: #000;
  --pyf-surface: #fff;
  --pyf-accent: #0060e2;
  --pyf-ok: #1fa85a;
  --pyf-t1: color-mix(in oklab, var(--pyf-ink) 88%, transparent);
  --pyf-t2: color-mix(in oklab, var(--pyf-ink) 61%, transparent);
  --pyf-t3: color-mix(in oklab, var(--pyf-ink) 45%, transparent);
  --pyf-t4: color-mix(in oklab, var(--pyf-ink) 27%, transparent);
  --pyf-fill: color-mix(in oklab, var(--pyf-ink) 7%, transparent);
  --pyf-line: color-mix(in oklab, var(--pyf-ink) 17%, transparent);
  --pyf-edge: color-mix(in oklab, var(--pyf-ink) 9%, transparent);
  --pyf-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 2px 6px -2px rgb(0 0 0 / .06);
  --pyf-scale: 1;
  margin: 0; width: 100%; max-width: ${W}px; text-align: left;
  font-family: var(--pyf-font, Inter, InterVariable, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: 13px; line-height: 20px; -webkit-font-smoothing: antialiased; color: var(--pyf-t1);
}
:is(.dark, [data-theme="dark"]) .pyf {
  --pyf-ink: #fff; --pyf-surface: #1c1c1e; --pyf-accent: #4d8dff; --pyf-ok: #34d27b;
  --pyf-t1: color-mix(in oklab, var(--pyf-ink) 90%, transparent);
  --pyf-t2: color-mix(in oklab, var(--pyf-ink) 62%, transparent);
  --pyf-t3: color-mix(in oklab, var(--pyf-ink) 46%, transparent);
  --pyf-t4: color-mix(in oklab, var(--pyf-ink) 28%, transparent);
  --pyf-fill: color-mix(in oklab, var(--pyf-ink) 9%, transparent);
  --pyf-line: color-mix(in oklab, var(--pyf-ink) 20%, transparent);
  --pyf-edge: color-mix(in oklab, var(--pyf-ink) 11%, transparent);
  --pyf-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 2px 8px -2px rgb(0 0 0 / .5);
}
.pyf *, .pyf *::before, .pyf *::after { box-sizing: border-box }
.pyf-box { position: relative; width: 100% }
.pyf-stage { position: absolute; left: 0; top: 0; width: ${W}px; height: var(--pyf-h, ${H}px); transform-origin: 0 0; transform: scale(var(--pyf-scale)) }
.pyf-svg { position: absolute; left: 0; top: 0; width: ${W}px; height: ${STAGE_H}px; overflow: visible; pointer-events: none }
.pyf-wire { fill: none; stroke: var(--pyf-line); stroke-width: 1.25 }
.pyf-stub { fill: none; stroke: var(--pyf-line); stroke-width: 1.25; stroke-dasharray: 2 4 }
.pyf-lit { fill: none; stroke: var(--pyf-accent); stroke-width: 1.75; stroke-linecap: round }
.pyf-ok-lit { fill: none; stroke: var(--pyf-ok); stroke-width: 1.75; stroke-linecap: round }
.pyf-port { fill: var(--pyf-surface); stroke: var(--pyf-line); stroke-width: 1.25 }
.pyf-port[data-s="a"] { fill: var(--pyf-accent); stroke: var(--pyf-accent) }
.pyf-port[data-s="ok"] { fill: var(--pyf-ok); stroke: var(--pyf-ok) }
.pyf-node { fill: var(--pyf-surface); stroke: var(--pyf-line); stroke-width: 1.25; transition: fill .2s, stroke .2s }
.pyf-node[data-s="a"] { fill: var(--pyf-accent); stroke: var(--pyf-accent) }

.pyf-chip { position: absolute; display: flex; align-items: center; gap: 12px; padding: 0 14px; height: ${CHIP_H}px; border-radius: 16px; background: var(--pyf-surface);
  box-shadow: var(--pyf-shadow); transition: box-shadow .25s }
.pyf-chip::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; border: 1px solid var(--pyf-edge); transition: border-color .25s }
.pyf-chip[data-active]::before { border-color: color-mix(in oklab, var(--pyf-accent) 65%, transparent) }
.pyf-chip[data-active] { box-shadow: var(--pyf-shadow), 0 6px 18px -8px color-mix(in oklab, var(--pyf-accent) 45%, transparent) }
.pyf-mark { flex: none; display: grid; place-items: center; width: 16px; height: 16px; color: var(--ic, var(--pyf-t2)) }
.pyf-mark > svg, .pyf-mark > img { display: block; width: 16px; height: 16px; object-fit: contain }
.pyf-text { display: flex; flex-direction: column; min-width: 0; flex: 1 }
.pyf-label { font-size: 14px; line-height: 20px; font-weight: 500; letter-spacing: -.01em; color: var(--pyf-t1); white-space: nowrap }
.pyf-meta { position: relative; display: flex; align-items: center; gap: 6px; height: 16px; font-size: 12px; line-height: 16px; letter-spacing: -.005em; color: var(--pyf-t3); white-space: nowrap; font-variant-numeric: tabular-nums }
.pyf-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--pyf-t4); transition: background .25s }
.pyf-meta[data-tone="active"] .pyf-dot { background: var(--pyf-accent) }
.pyf-meta[data-tone="done"] .pyf-dot { background: var(--pyf-t3) }
.pyf-meta[data-tone="ok"] { color: var(--pyf-t2) }
.pyf-meta[data-tone="ok"] .pyf-dot { background: var(--pyf-ok) }
.pyf-st { display: grid }
.pyf-st > span { grid-area: 1 / 1; white-space: nowrap; transition: opacity .22s, filter .22s; opacity: 0; filter: blur(2px) }
.pyf-st > span[data-on] { opacity: 1; filter: none }
.pyf-meta[data-tone="ok"] .pyf-st > span[data-on] { color: var(--pyf-ok) }
.pyf-tag { position: absolute; z-index: 6; top: calc(100% + 6px); padding: 3px 8px; border-radius: 999px; background: var(--pyf-ink); color: var(--pyf-surface);
  font-size: 12px; line-height: 14px; font-weight: 500; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(-3px); transition: opacity .18s, transform .18s }
.pyf-chip[data-side="l"] .pyf-tag { left: 2px }
.pyf-chip[data-side="r"] .pyf-tag { right: 2px }
@media (hover: hover) { .pyf-chip:hover .pyf-tag { opacity: 1; transform: none } }

.pyf-pill { position: absolute; left: 0; top: 0; display: grid; place-items: center; height: 24px; padding: 0 9px; border-radius: 999px; opacity: 0;
  background: color-mix(in oklab, var(--pyf-accent) 12%, var(--pyf-surface)); border: 1px solid color-mix(in oklab, var(--pyf-accent) 42%, transparent);
  color: var(--pyf-t1); font-size: 12px; line-height: 16px; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; will-change: transform }
.pyf-pill-ok { grid-auto-flow: column; gap: 4px; background: color-mix(in oklab, var(--pyf-ok) 13%, var(--pyf-surface)); border-color: color-mix(in oklab, var(--pyf-ok) 48%, transparent); color: var(--pyf-ok) }
.pyf-pill-ok svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round }
.pyf-pill-settle { width: 64px; padding: 0 }
.pyf-pill-settle > span { grid-area: 1 / 1 }

.pyf-steps { position: absolute; left: 0; top: ${STEPS_Y}px; width: ${W}px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 24px }
.pyf-step { display: flex; flex-direction: column; gap: 8px }
.pyf-step-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 13px; line-height: 20px }
.pyf-step-label { font-weight: 500; letter-spacing: -.01em; color: var(--pyf-t3); transition: color .25s }
.pyf-step[data-state="active"] .pyf-step-label, .pyf-step[data-state="done"] .pyf-step-label { color: var(--pyf-t1) }
.pyf-step-meta { font-size: 12px; color: var(--pyf-t3); font-variant-numeric: tabular-nums; white-space: nowrap }
.pyf-track { display: block; height: 2px; border-radius: 2px; background: var(--pyf-fill); overflow: hidden }
.pyf-fill { display: block; height: 100%; border-radius: 2px; background: var(--pyf-accent); transform-origin: 0 50%; transform: scaleX(0) }
.pyf-cap { margin: 14px 0 0; font-size: 13px; line-height: 20px; color: var(--pyf-t2) }
`

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

type StatusEl = { box: HTMLElement; spans: [HTMLElement, HTMLElement] }

function swapText(st: StatusEl, text: string) {
  const cur = st.box.dataset.cur
  if (cur === text) return
  const i = st.box.dataset.i === "0" ? 1 : 0
  st.box.dataset.cur = text
  st.box.dataset.i = String(i)
  st.spans[i].textContent = text
  st.spans[i].toggleAttribute("data-on", true)
  st.spans[1 - i].toggleAttribute("data-on", false)
}

export function PaymentFlow({
  nodes,
  amount = 42.5,
  fee = 1.53,
  balance = 1284.1,
  currency = "USD",
  locale = "en-US",
  authorizationMs = 1340,
  labels,
  hideSteps,
  speed = 1,
  paused,
  accent,
  label,
  caption,
  className,
}: PaymentFlowProps) {
  const N = {
    terminal: { ...DEFAULT_NODES.terminal, ...nodes?.terminal },
    processor: { ...DEFAULT_NODES.processor, ...nodes?.processor },
    network: { ...DEFAULT_NODES.network, ...nodes?.network },
    issuer: { ...DEFAULT_NODES.issuer, ...nodes?.issuer },
    merchant: { ...DEFAULT_NODES.merchant, ...nodes?.merchant },
  }
  const L = {
    authorization: labels?.authorization ?? "Authorization",
    settlement: labels?.settlement ?? "Settlement",
    settlementTime: labels?.settlementTime ?? "Next business day",
    approved: labels?.approved ?? "Approved",
  }
  const net = Math.round((amount - fee) * 100) / 100
  const money = React.useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }), [locale, currency])
  const reduced = React.useSyncExternalStore(subscribeMotion, readMotion, () => false)
  const stageH = hideSteps ? STAGE_H : H

  const boxRef = React.useRef<HTMLDivElement>(null)
  const els = React.useRef<{
    pill: Element | null
    appr: Element | null
    settle: Element | null
    settleGross: Element | null
    settleNet: Element | null
    lit: Element | null
    okLit: Element | null
    railLit: Element | null
    stubs: Element[]
    ports: Element[]
    nodes: Element[]
    chips: HTMLElement[]
    status: StatusEl[]
    balance: Element | null
    steps: Element[]
    fills: Element[]
    stepMeta: Element[]
  } | null>(null)

  const time = React.useRef(paused ? START_STILL : START_RUN)
  const rate = React.useRef(paused ? 0 : 1)
  const hover = React.useRef(1)
  const frozen = React.useRef(!!paused)
  const target = React.useRef(Math.max(0.05, speed))
  const kick = React.useRef<() => void>(() => {})

  const draw = (t: number) => {
    const e = els.current
    if (!e) return
    const k = Math.floor(t / T)
    const u = t - k * T
    const base = balance + k * net

    // Fades for the whole scene at the end of the loop.
    const fade = u > 14.5 ? 1 - clamp01((u - 14.5) / 0.4) : 1

    // Amount chip going down.
    const ay = amountY(u)
    const showAmt = u >= 0.3 && u < 5.75
    put(e.pill, "s", "opacity", showAmt ? clamp01((u - 0.3) / 0.2) * (1 - clamp01((u - 5.55) / 0.2)) : 0)
    put(e.pill, "s", "transform", `translate(${COL}px, ${ay.toFixed(1)}px) translate(-50%, -50%)`)
    const authF = u < 5.6 ? (ay - YS[0]) / (YS[3] - YS[0]) : 1
    put(e.lit, "a", "stroke-dasharray", `${(authF * 1000).toFixed(1)} 1000`)
    put(e.lit, "a", "opacity", u < 0.3 ? 0 : fade)

    // Approval coming back.
    const showAppr = u >= 5.6 && u < AUTH_END + 0.05
    const apy = approvalY(u)
    put(e.appr, "s", "opacity", showAppr ? clamp01((u - 5.6) / 0.15) * (1 - clamp01((u - (AUTH_END - 0.12)) / 0.12)) : 0)
    put(e.appr, "s", "transform", `translate(${COL}px, ${apy.toFixed(1)}px) translate(-50%, -50%)`)
    const okF = u < 5.6 ? 0 : u > AUTH_END ? 1 : (YS[3] - apy) / (YS[3] - YS[0])
    put(e.okLit, "a", "stroke-dasharray", `${(okF * 1000).toFixed(1)} 1000`)
    put(e.okLit, "a", "opacity", fade)

    // Settlement.
    const d = settleD(u)
    const sp = railAt(d)
    const showSet = u >= 8.5 && u < 13.25
    put(e.settle, "s", "opacity", showSet ? clamp01((u - 8.5) / 0.2) * (1 - clamp01((u - 13.05) / 0.2)) : 0)
    put(e.settle, "s", "transform", `translate(${sp[0].toFixed(1)}px, ${sp[1].toFixed(1)}px) translate(-50%, -50%)`)
    const mix = ease((u - 11.4) / 0.6)
    put(e.settleGross, "s", "opacity", 1 - mix)
    put(e.settleNet, "s", "opacity", mix)
    put(e.railLit, "a", "stroke-dasharray", `${((d / R_L) * 1000).toFixed(1)} 1000`)
    put(e.railLit, "a", "opacity", u < 8.5 ? 0 : fade)
    const stubNet = ease((u - 10.0) / 0.5)
    const stubProc = ease((u - 11.4) / 0.5)
    put(e.stubs[0], "a", "stroke-dasharray", `${(stubProc * 1000).toFixed(1)} 1000`)
    put(e.stubs[0], "a", "opacity", fade)
    put(e.stubs[1], "a", "stroke-dasharray", `${(stubNet * 1000).toFixed(1)} 1000`)
    put(e.stubs[1], "a", "opacity", fade)
    put(e.nodes[0], "a", "data-s", u > 11.4 && fade > 0.5 ? "a" : "")
    put(e.nodes[1], "a", "data-s", u > 10.0 && fade > 0.5 ? "a" : "")

    // Ports on the vertical wire: accent as the amount passes, green as the approval returns.
    e.ports.forEach((p, i) => {
      const y = i % 2 === 0 ? TOPS[i / 2] + CHIP_H : TOPS[(i + 1) / 2]
      let s = ""
      if (u > 0.85 && (u >= 5.6 ? true : ay >= y)) s = "a"
      if (u >= 5.6 && apy <= y) s = "ok"
      if (u >= RESET_AT - 0.2) s = ""
      put(p, "a", "data-s", s)
    })

    // Statuses.
    const run = u < RESET_AT
    const set = (i: number, text: string, tn: Tone | "done") => {
      swapText(e.status[i], text)
      put(e.status[i].box.parentElement, "a", "data-tone", tn)
      if (i < 4) {
        if (tn === "active") e.chips[i].setAttribute("data-active", "")
        else e.chips[i].removeAttribute("data-active")
      }
    }
    const r = (n: PaymentFlowNode | undefined, fallback: string) => n?.meta ?? fallback
    if (!run || u < 0.35) set(0, r(N.terminal, "Tap to pay"), "idle")
    else if (u < AUTH_END) set(0, "Authorizing", "active")
    else set(0, L.approved, "ok")
    if (!run || u < 1.75) set(1, r(N.processor, "Processor"), "idle")
    else if (u < 2.35) set(1, "Checking risk", "active")
    else if (u < 11.4) set(1, "Risk checked", "done")
    else set(1, `Fee ${money.format(fee)}`, "ok")
    if (!run || u < 3.25) set(2, r(N.network, "Card network"), "idle")
    else if (u < 3.85) set(2, "Routing", "active")
    else if (u < 10.0) set(2, "Routed to bank", "done")
    else set(2, "Cleared", "ok")
    if (!run || u < 4.75) set(3, r(N.issuer, "Card issuer"), "idle")
    else if (u < 5.6) set(3, "Checking funds", "active")
    else if (u < 8.5) set(3, L.approved, "ok")
    else set(3, "Settled", "ok")
    // Merchant: balance counts up when the payout lands.
    const bal = base + net * ease((u - 13.0) / 1.0)
    swapBalance(e.status[4], money.format(bal))
    put(e.status[4].box.parentElement, "a", "data-tone", u >= 13.0 && run ? "ok" : "idle")

    // Step row.
    const authP = u < 0.35 ? 0 : u > AUTH_END ? 1 : (u - 0.35) / (AUTH_END - 0.35)
    const setP = u < 8.5 ? 0 : u > 13.0 ? 1 : (u - 8.5) / 4.5
    const live = run && u >= 0.35
    put(e.fills[0], "s", "transform", `scaleX(${(live ? authP : 0).toFixed(4)})`)
    put(e.fills[1], "s", "transform", `scaleX(${(run ? setP : 0).toFixed(4)})`)
    put(e.steps[0], "a", "data-state", !live ? "idle" : authP >= 1 ? "done" : "active")
    put(e.steps[1], "a", "data-state", !run || u < 8.5 ? "idle" : setP >= 1 ? "done" : "active")
    const secs = (live ? authP : 0) * (authorizationMs / 1000)
    const txt = `${secs.toFixed(2)} s`
    if (e.stepMeta[0] && cache.get(e.stepMeta[0])?.t !== txt) {
      e.stepMeta[0].textContent = txt
      cache.set(e.stepMeta[0], { t: txt })
    }
  }
  function swapBalance(st: StatusEl, text: string) {
    const el = st.spans[0]
    if (cache.get(el)?.t === text) return
    cache.set(el, { t: text })
    el.textContent = text
    el.toggleAttribute("data-on", true)
  }
  const drawRef = React.useRef(draw)
  React.useEffect(() => {
    drawRef.current = draw
  })

  React.useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const q = <T extends Element>(s: string) => Array.from(box.querySelectorAll<T>(s))
    const chips = q<HTMLElement>(".pyf-chip")
    els.current = {
      pill: box.querySelector(".pyf-pill-amount"),
      appr: box.querySelector(".pyf-pill-ok"),
      settle: box.querySelector(".pyf-pill-settle"),
      settleGross: box.querySelector(".pyf-gross"),
      settleNet: box.querySelector(".pyf-net"),
      lit: box.querySelector(".pyf-lit-auth"),
      okLit: box.querySelector(".pyf-ok-lit"),
      railLit: box.querySelector(".pyf-lit-rail"),
      stubs: q(".pyf-lit-stub"),
      ports: q(".pyf-port"),
      nodes: q(".pyf-node"),
      chips,
      status: chips.map((c) => {
        const st = c.querySelector<HTMLElement>(".pyf-st")!
        return { box: st, spans: [st.children[0] as HTMLElement, st.children[1] as HTMLElement] }
      }),
      balance: null,
      steps: q(".pyf-step"),
      fills: q(".pyf-fill"),
      stepMeta: q(".pyf-step-meta"),
    }
    drawRef.current(reduced ? START_STILL : time.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, hideSteps])
  React.useEffect(() => {
    if (reduced) drawRef.current(START_STILL)
    else if (frozen.current) drawRef.current(time.current)
  })

  React.useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const set = () => box.style.setProperty("--pyf-scale", String(box.clientWidth / W))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    if (reduced) return
    const root = boxRef.current
    if (!root) return
    let raf = 0
    let last = 0
    let visible = false
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.08, (now - last) / 1000) : 0
      last = now
      const goal = frozen.current ? 0 : target.current * hover.current
      rate.current += (goal - rate.current) * (1 - Math.exp(-dt * 9))
      time.current += dt * rate.current
      drawRef.current(time.current)
      if (visible && (goal > 0 || rate.current > 0.003)) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const start = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }
    kick.current = start
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
      if (visible) start()
      else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      kick.current = () => {}
    }
  }, [reduced])
  React.useEffect(() => {
    frozen.current = !!paused
    target.current = Math.max(0.05, speed)
    kick.current()
  }, [paused, speed])

  const aria =
    label ??
    `A card payment of ${money.format(amount)} goes from ${N.terminal.label} to ${N.processor.label}, ${N.network.label} and ${N.issuer.label}, which approves it and sends the approval back. Settlement then clears through the network, the processor keeps a ${money.format(
      fee,
    )} fee and a ${money.format(net)} payout lands in ${N.merchant.label}.`

  const vars = { ...(accent ? { "--pyf-accent": accent } : null), "--pyf-h": `${stageH}px` } as React.CSSProperties
  const nodeList: [PaymentFlowNode, number, "l" | "r", number, number, number][] = [
    [N.terminal, 0, "l", 0, TOPS[0], CHIP_W],
    [N.processor, 1, "l", 0, TOPS[1], CHIP_W],
    [N.network, 2, "l", 0, TOPS[2], CHIP_W],
    [N.issuer, 3, "l", 0, TOPS[3], CHIP_W],
    [N.merchant, 4, "r", MERCH_X, TOPS[0], W - MERCH_X],
  ]

  return (
    <figure className={className ? `pyf ${className}` : "pyf"} style={vars} data-paused={paused || undefined} data-still={reduced || undefined}>
      <style href="pane-payment-flow" precedence="default">
        {CSS}
      </style>
      <div
        ref={boxRef}
        className="pyf-box"
        role="img"
        aria-label={aria}
        style={{ aspectRatio: `${W} / ${stageH}` }}
        onPointerEnter={() => (hover.current = 0.8)}
        onPointerLeave={() => (hover.current = 1)}
      >
        <div className="pyf-stage" aria-hidden>
          <svg className="pyf-svg" viewBox={`0 0 ${W} ${STAGE_H}`}>
            <path className="pyf-wire" d={`M${COL} ${YS[0]} L${COL} ${YS[3]}`} />
            <path className="pyf-wire" d={railPath} />
            <path className="pyf-stub" d={`M${CHIP_W} ${YS[1]} L${RAIL_X - 4} ${YS[1]}`} />
            <path className="pyf-stub" d={`M${CHIP_W} ${YS[2]} L${RAIL_X - 4} ${YS[2]}`} />
            <path className="pyf-lit pyf-lit-stub" d={`M${RAIL_X - 4} ${YS[1]} L${CHIP_W} ${YS[1]}`} pathLength={1000} strokeDasharray="0 1000" />
            <path className="pyf-lit pyf-lit-stub" d={`M${RAIL_X - 4} ${YS[2]} L${CHIP_W} ${YS[2]}`} pathLength={1000} strokeDasharray="0 1000" />
            <path className="pyf-lit pyf-lit-auth" d={`M${COL} ${YS[0]} L${COL} ${YS[3]}`} pathLength={1000} strokeDasharray="0 1000" />
            <path className="pyf-ok-lit" d={`M${COL} ${YS[3]} L${COL} ${YS[0]}`} pathLength={1000} strokeDasharray="0 1000" />
            <path className="pyf-lit pyf-lit-rail" d={railPath} pathLength={1000} strokeDasharray="0 1000" />
            {TOPS.slice(0, 3).flatMap((tp, i) => [
              <circle key={`pa${i}`} className="pyf-port" cx={COL} cy={tp + CHIP_H + 4} r="2.75" />,
              <circle key={`pb${i}`} className="pyf-port" cx={COL} cy={TOPS[i + 1] - 4} r="2.75" />,
            ])}
            <circle className="pyf-node" cx={RAIL_X} cy={YS[1]} r="3.5" />
            <circle className="pyf-node" cx={RAIL_X} cy={YS[2]} r="3.5" />
          </svg>

          <span className="pyf-pill pyf-pill-amount">{money.format(amount)}</span>
          <span className="pyf-pill pyf-pill-ok">
            <svg viewBox="0 0 12 12" aria-hidden>
              <path d="M2.6 6.3 L5 8.6 L9.4 3.6" />
            </svg>
            {L.approved}
          </span>
          <span className="pyf-pill pyf-pill-settle">
            <span className="pyf-gross">{money.format(amount)}</span>
            <span className="pyf-net" style={{ opacity: 0 }}>
              {money.format(net)}
            </span>
          </span>

          {nodeList.map(([n, i, side, x, y, w]) => (
            <div key={i} className="pyf-chip" data-side={side} style={{ left: x, top: y, width: w, ...(n.color ? ({ "--ic": n.color } as React.CSSProperties) : null) }}>
              {n.icon ? <span className="pyf-mark">{n.icon}</span> : null}
              <span className="pyf-text">
                <span className="pyf-label">{n.label}</span>
                <span className="pyf-meta" data-tone="idle">
                  <i className="pyf-dot" />
                  {i === 4 ? (
                    <span className="pyf-st">
                      <span data-on>{money.format(balance)}</span>
                      <span />
                    </span>
                  ) : (
                    <span className="pyf-st">
                      <span data-on>{n.meta}</span>
                      <span />
                    </span>
                  )}
                </span>
              </span>
              {n.detail ? <span className="pyf-tag">{n.detail}</span> : null}
            </div>
          ))}

          {hideSteps ? null : (
            <div className="pyf-steps">
              <div className="pyf-step" data-state="idle">
                <span className="pyf-step-head">
                  <span className="pyf-step-label">{L.authorization}</span>
                  <span className="pyf-step-meta">0.00 s</span>
                </span>
                <span className="pyf-track">
                  <span className="pyf-fill" />
                </span>
              </div>
              <div className="pyf-step" data-state="idle">
                <span className="pyf-step-head">
                  <span className="pyf-step-label">{L.settlement}</span>
                  <span className="pyf-step-meta">{L.settlementTime}</span>
                </span>
                <span className="pyf-track">
                  <span className="pyf-fill" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {caption ? <figcaption className="pyf-cap">{caption}</figcaption> : null}
    </figure>
  )
}

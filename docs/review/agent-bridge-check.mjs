// Checks for src/lib/agent-bridge.ts under plain Node (type stripping), no browser.
//
//   node docs/review/agent-bridge-check.mjs
//
// Pieces are simulated by writing entries into the globalThis registry the way the inline
// `useAgentNode` stub does (see docs/agent-operable.md); fake elements are objects with a
// `closest(selector)` method. Prints one PASS/FAIL line per check with the observed value
// and exits 1 on any FAIL.

import { agentTools, callAgentTool, createAgentBridge, registerWebMCP, webMCPSupported } from "../../src/lib/agent-bridge.ts"

const HOST = Symbol.for("pane.agent")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------------------------ report */
let passed = 0
let failed = 0
const fmt = (v) => (typeof v === "string" ? v : JSON.stringify(v))
function check(name, ok, observed, expected = "") {
  if (ok) passed++
  else failed++
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${observed !== undefined ? `  | observed: ${fmt(observed)}` : ""}${!ok && expected ? `  | expected: ${expected}` : ""}`)
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

const unhandled = []
process.on("unhandledRejection", (e) => unhandled.push(String(e?.message ?? e)))

/* ----------------------------------------------------------------- helpers */
let bridges = []
/** A fresh registry and bridge for each scenario. */
function fresh() {
  for (const b of bridges) b.destroy()
  bridges = []
  delete globalThis[HOST]
}
function bridge(options) {
  const b = createAgentBridge(options)
  bridges.push(b)
  return b
}
/** Fake element: `closest("[attr]")` finds an ancestor carrying `attrs[attr]`. */
const el = (attrs = {}) => ({
  closest: (sel) => {
    const name = sel.slice(1, -1)
    return name in attrs ? { getAttribute: (n) => attrs[n] ?? null } : null
  },
})
/** Mounts a piece the way the stub does; `set` replaces the node and pings when its JSON value changed. */
function mount(node, element = null) {
  const h = (globalThis[HOST] ??= { v: 1, nodes: new Map(), listeners: new Set() })
  const key = {}
  let current = node
  // (the real stub's JSON.stringify would throw on a cycle; the helper tolerates it to test the bridge)
  const stringify = (v) => {
    try {
      return JSON.stringify(v)
    } catch {
      return "unserialisable"
    }
  }
  let sig = stringify(node.value)
  h.nodes.set(key, { el: () => element, node: () => current })
  h.listeners.forEach((f) => f(key))
  return {
    key,
    set(next) {
      current = next
      const s = stringify(next.value)
      if (s !== sig) {
        sig = s
        h.listeners.forEach((f) => f(key))
      }
    },
    ping: () => h.listeners.forEach((f) => f(key)),
    unmount() {
      h.nodes.delete(key)
      h.listeners.forEach((f) => f(key))
    },
  }
}
/** A modal-like piece whose state commits `delay` ms after an action (like a React render). */
function modal({ id, label = "Delete project", delay = 0, element = null, destructive = "Delete: removes every file" } = {}) {
  const calls = []
  let open = false
  let m
  const node = () => ({
    id,
    kind: "modal",
    label,
    value: { open },
    actions: {
      open: { run: () => (calls.push("open"), update(true)), disabled: open, description: "Opens the dialog" },
      dismiss: { run: () => (calls.push("dismiss"), update(false)), disabled: !open },
      confirm: { run: () => (calls.push("confirm"), update(false)), disabled: !open, destructive },
    },
  })
  const update = (next) => {
    open = next
    const commit = () => m.set(node())
    if (delay) setTimeout(commit, delay)
    else commit()
  }
  m = mount(node(), element)
  return { ...m, calls, node, update }
}
/** A piece with typed args. */
function plan({ id, label = "Deploy plan", element = null, run } = {}) {
  const calls = []
  const state = { modes: { build: "auto", notify: "auto" } }
  let m
  const node = () => ({
    id,
    kind: "plan-words",
    label,
    value: structuredClone(state),
    actions: {
      setMode: {
        run: (args) => {
          calls.push(args)
          if (run) return run(args)
          state.modes[args.step] = args.mode
          m.set(node())
        },
        args: [
          { name: "step", type: "string", enum: ["build", "notify"], description: "Which step" },
          { name: "mode", type: "string", enum: ["auto", "ask"] },
          { name: "times", type: "number", optional: true },
        ],
      },
    },
  })
  m = mount(node(), element)
  return { ...m, calls }
}

/* ------------------------------------------------------------ 1. snapshot */
{
  fresh()
  const a = modal()
  mount({ id: "main-drawer", kind: "drawer", label: "Settings", value: { open: false, snap: 0.5 }, actions: { open: { run: () => {} } } })
  modal({ label: "Rename" })
  plan()
  const agent = bridge()
  const events = []
  agent.subscribe((e) => events.push(e))
  const snap = agent.snapshot()
  check("snapshot order is mount order, refs from id or <kind>-<n>", same(snap.map((s) => s.ref), ["modal-1", "main-drawer", "modal-2", "plan-words-1"]), snap.map((s) => s.ref))
  check("snapshot entry has exactly ref, kind, label, value, actions", same(Object.keys(snap[0]), ["ref", "kind", "label", "value", "actions"]), Object.keys(snap[0]))
  check("snapshot value is the piece's JSON state", same(snap[1].value, { open: false, snap: 0.5 }), snap[1].value)
  check(
    "actions list: description kept, falsy flags omitted, disabled and destructive set",
    same(snap[0].actions, [
      { name: "open", description: "Opens the dialog" },
      { name: "dismiss", disabled: true },
      { name: "confirm", destructive: true, disabled: true },
    ]),
    snap[0].actions,
  )
  check("action args are listed with type, enum, optional and description", same(snap[3].actions[0].args?.map((x) => x.name), ["step", "mode", "times"]) && snap[3].actions[0].args[0].description === "Which step" && snap[3].actions[0].args[2].optional === true, snap[3].actions[0].args)
  snap[1].value.open = true
  check("snapshot value is a copy (mutating it leaves the piece alone)", agent.snapshot()[1].value.open === false, agent.snapshot()[1].value)
  check("pieces mounted before the bridge make no add events", events.length === 0, events.length)
  a.ping()
  check("a ping with an unchanged value makes no event", events.length === 0, events.length)
  a.update(true)
  check("first change of a pre-mounted piece is a change event, not add", events.length === 1 && events[0].type === "change" && events[0].ref === "modal-1", events)
}

/* ------------------------------------------------------------------ 2. refs */
{
  fresh()
  const agent = bridge()
  const one = mount({ id: "drawer-x", kind: "drawer", label: "A", actions: {} })
  const two = mount({ id: "drawer-x", kind: "drawer", label: "B", actions: {} })
  check("duplicate id: the second piece gets a generated ref", same(agent.snapshot().map((s) => s.ref), ["drawer-x", "drawer-1"]), agent.snapshot().map((s) => s.ref))
  one.unmount()
  mount({ id: "drawer-x", kind: "drawer", label: "C", actions: {} })
  check("an id freed by an unmount can be taken again; existing refs stay", same(agent.snapshot().map((s) => s.ref), ["drawer-1", "drawer-x"]), agent.snapshot().map((s) => s.ref))
  mount({ id: "drawer-2", kind: "drawer", label: "D", actions: {} })
  const gen = mount({ kind: "drawer", label: "E", actions: {} })
  check("a generated ref skips one a live piece already holds as its id", agent.snapshot().at(-1).ref === "drawer-3", agent.snapshot().map((s) => s.ref))
  two.set({ id: "renamed", kind: "drawer", label: "B2", value: { x: 1 }, actions: {} })
  check("a ref is stable for the life of its piece (id change ignored)", agent.snapshot()[0].ref === "drawer-1", agent.snapshot()[0])
  gen.unmount()
  mount({ kind: "drawer", label: "F", actions: {} })
  check("generated refs are not reused after an unmount", agent.snapshot().at(-1).ref === "drawer-4", agent.snapshot().map((s) => s.ref))
}

/* ---------------------------------------------------------- 3. resolution */
{
  fresh()
  const agent = bridge()
  const a = modal({ label: "Delete project" })
  let r = await agent.act("  delete PROJECT ", "open")
  check("act by label: trimmed, case-insensitive", r.ok === true && r.ref === "modal-1" && same(r.value, { open: true }), r)
  modal({ label: "Delete Project" })
  r = await agent.act("Delete project", "dismiss")
  check("ambiguous label: code ambiguous, message lists each ref", r.ok === false && r.error.code === "ambiguous" && r.error.message.includes("modal-1") && r.error.message.includes("modal-2"), r.error)
  r = await agent.act("modal-9", "open")
  check("unknown ref or label: not_found", r.ok === false && r.error.code === "not_found" && r.ref === "modal-9", r)
  r = await agent.act("modal-1", "open")
  check("disabled action: disabled", r.ok === false && r.error.code === "disabled", r.error)
  r = await agent.act("modal-1", "explode")
  check("unknown action: unknown_action, message lists the names", r.ok === false && r.error.code === "unknown_action" && /open, dismiss, confirm/.test(r.error.message), r.error)
  r = await agent.act("modal-1", "toString")
  check("an inherited name (toString) is not an action", r.ok === false && r.error.code === "unknown_action", r.error.code)
  void a
}

/* --------------------------------------------------------------- 4. args */
{
  fresh()
  const agent = bridge()
  const p = plan()
  const cases = [
    [{ step: "build" }, "mode", "missing arg"],
    [{ step: "build", mode: 3 }, "mode", "wrong type"],
    [{ step: "deploy", mode: "ask" }, "step", "value outside enum"],
    [{ step: "build", mode: "ask", colour: "red" }, "colour", "undeclared arg"],
    [{ step: "build", mode: "ask", times: "2" }, "times", "wrong type on an optional arg"],
  ]
  for (const [args, names, what] of cases) {
    const r = await agent.act("plan-words-1", "setMode", args)
    check(`bad_args: ${what}, message names the arg and what is allowed`, r.ok === false && r.error.code === "bad_args" && r.error.message.includes(names) && /string|number|one of/.test(r.error.message), r.error?.message)
  }
  let r = await agent.act("plan-words-1", "setMode", ["build"])
  check("bad_args: args that are not an object", r.ok === false && r.error.code === "bad_args", r.error)
  r = await agent.act("plan-words-1", "setMode", { step: "notify", mode: "ask" })
  check("good args (optional omitted) run the action with them", r.ok === true && same(r.value.modes, { build: "auto", notify: "ask" }) && same(p.calls.at(-1), { step: "notify", mode: "ask" }), r)
  check("bad requests never reached run", p.calls.length === 1, p.calls.length)
}

/* --------------------------------------------------------- 5. default gate */
{
  fresh()
  const agent = bridge()
  const ran = []
  const piece = (label, destructive, element) =>
    mount({ kind: "x", label, value: {}, actions: { go: { run: () => ran.push(label), destructive, args: [{ name: "n", type: "number", optional: true }] } } }, element)
  piece("plain", undefined)
  piece("bool", true)
  piece("text", "Sends the invoice to the client")
  piece("fnFalse", (args) => args.n > 5)
  piece("fnText", (args) => (args.n > 5 ? "Deletes many rows" : false))
  piece("fnThrows", () => {
    throw new Error("boom")
  })
  piece("confirm", undefined, el({ "data-agent-confirm": "Publishes the post" }))
  const res = {}
  for (const label of ["plain", "bool", "text", "fnFalse", "confirm", "fnThrows"]) res[label] = await agent.act(label, "go")
  res.fnText = await agent.act("fnText", "go", { n: 9 })
  res.fnTextSmall = await agent.act("fnText", "go", { n: 1 })
  check("default gate allows a non-destructive request", res.plain.ok === true, res.plain)
  check("default gate denies destructive: true", res.bool.ok === false && res.bool.error.code === "denied", res.bool.error)
  check("default gate denies a destructive string, message has the reason", res.text.error?.code === "denied" && res.text.error.message.includes("Sends the invoice"), res.text.error?.message)
  check("destructive function returning false: allowed", res.fnFalse.ok === true, res.fnFalse)
  check("destructive function returning a string for these args: denied with it", res.fnText.error?.code === "denied" && res.fnText.error.message.includes("Deletes many rows"), res.fnText.error?.message)
  check("destructive function returning false for other args: allowed", res.fnTextSmall.ok === true, res.fnTextSmall)
  check("destructive function that throws: treated as destructive, denied", res.fnThrows.error?.code === "denied", res.fnThrows.error)
  check("inside data-agent-confirm: denied with the attribute as reason", res.confirm.error?.code === "denied" && res.confirm.error.message.includes("Publishes the post"), res.confirm.error?.message)
  check("denied requests never ran", same(ran, ["plain", "fnFalse", "fnText"]), ran)
  const s = agent.snapshot()
  check("snapshot marks bool, string, function and data-agent-confirm as destructive", same(s.map((e) => e.actions[0].destructive ?? false), [false, true, true, true, true, true, true]), s.map((e) => e.actions[0].destructive ?? false))
}

/* ---------------------------------------------------------- 6. custom gate */
{
  fresh()
  const seen = []
  let answer = () => true
  const agent = bridge({ allow: (request, ctx) => (seen.push({ request, signal: ctx.signal }), answer(request)) })
  const m = modal({ destructive: "Delete: removes every file" })
  let r = await agent.act("modal-1", "open")
  check("allow is called for a non-destructive request too", r.ok === true && seen.length === 1 && seen[0].request.destructive === false, seen.map((s) => s.request))
  check(
    "allow gets the full request and an AbortSignal",
    same(Object.keys(seen[0].request).sort(), ["action", "args", "destructive", "kind", "label", "ref"]) && seen[0].signal instanceof AbortSignal && seen[0].signal.aborted === false,
    seen[0].request,
  )
  answer = () => false
  r = await agent.act("modal-1", "dismiss")
  check("allow returning false denies a non-destructive request", r.ok === false && r.error.code === "denied" && m.calls.length === 1, r.error)
  answer = async () => true
  r = await agent.act("modal-1", "confirm")
  check("async allow resolving true lets a destructive request run", r.ok === true && m.calls.at(-1) === "confirm", r)
  check("the request carried destructive and the reason", seen.at(-1).request.destructive === true && seen.at(-1).request.reason === "Delete: removes every file", seen.at(-1).request)
  m.update(true)
  answer = async () => false
  r = await agent.act("modal-1", "confirm")
  check("async allow resolving false: denied, message has the reason", r.error?.code === "denied" && r.error.message.includes("removes every file"), r.error?.message)
  answer = () => {
    throw new Error("approval UI crashed")
  }
  r = await agent.act("modal-1", "confirm")
  check("allow throwing: denied with the thrown message", r.error?.code === "denied" && r.error.message.includes("approval UI crashed"), r.error?.message)
  answer = () => Promise.reject(new Error("person closed the tab"))
  r = await agent.act("modal-1", "confirm")
  check("allow rejecting: denied with the rejection message", r.error?.code === "denied" && r.error.message.includes("person closed the tab"), r.error?.message)
  answer = () => "yes"
  r = await agent.act("modal-1", "dismiss")
  check("allow returning a non-boolean truthy value: denied (only true allows)", r.error?.code === "denied", r.error?.code)
  check("denied requests never ran", same(m.calls, ["open", "confirm"]), m.calls)
}

/* ------------------------------------------------- 7. re-check after gate */
{
  fresh()
  let during = () => {}
  const agent = bridge({ allow: async () => (during(), await sleep(30), true) })
  const m = modal()
  during = () => setTimeout(() => m.unmount(), 5)
  let r = await agent.act("modal-1", "open")
  check("piece unmounted while the gate waited: not_found, run not called", r.error?.code === "not_found" && m.calls.length === 0, r.error)
  const n = modal()
  during = () => setTimeout(() => n.update(true), 5) // opening disables `open`
  r = await agent.act("modal-2", "open")
  check("action disabled while the gate waited: disabled, run not called", r.error?.code === "disabled" && n.calls.length === 0, r.error)
}

/* --------------------------------------- 7b. risk re-checked after the gate */
{
  fresh()
  let during = () => {}
  const asked = []
  const agent = bridge({ allow: async (request) => (asked.push(request), during(), await sleep(30), true), settle: 5 })
  // `verb` stands for state a person can change while the gate waits (the drum's verb, a plan's modes).
  const piece = (label, verbAt, attrs = {}) => {
    const ran = []
    const state = { verb: verbAt }
    const destructive = () => (state.verb === "archive" ? false : state.verb === "keep-open" ? false : state.verb)
    const m = mount({ kind: "risk", label, value: {}, actions: { go: { run: () => ran.push(state.verb), destructive } } }, el(attrs))
    return { m, ran, state, attrs }
  }

  const a = piece("Sentence", "Deletes 3 files")
  during = () => setTimeout(() => (a.state.verb = "Deletes 300 files"), 5)
  let r = await agent.act("Sentence", "go")
  check("(a) gate approved one sentence, the piece now says another: denied, run not called", r.error?.code === "denied" && a.ran.length === 0 && r.error.message.includes("Deletes 300 files"), r.error?.message)

  const b = piece("Became", "archive")
  during = () => setTimeout(() => (b.state.verb = "Deletes the project"), 5)
  r = await agent.act("Became", "go")
  check("(b) not destructive at the gate, destructive after: denied, run not called", asked.at(-1).destructive === false && r.error?.code === "denied" && b.ran.length === 0, r.error?.message)

  const c = piece("Same", "Sends the invoice")
  during = () => setTimeout(() => (c.state.verb = "Sends the invoice"), 5) // re-set, same sentence
  r = await agent.act("Same", "go")
  check("(c) destructive with the same reason before and after: runs", r.ok === true && same(c.ran, ["Sends the invoice"]), r)

  const d = piece("Calmed", "Deletes the draft")
  during = () => setTimeout(() => (d.state.verb = "keep-open"), 5)
  r = await agent.act("Calmed", "go")
  check("(d) destructive at the gate, not after: runs", asked.at(-1).destructive === true && r.ok === true && same(d.ran, ["keep-open"]), r)

  const e = piece("Wrapped", "archive")
  during = () => setTimeout(() => (e.attrs["data-agent-confirm"] = "Publishes the post"), 5)
  r = await agent.act("Wrapped", "go")
  check("(e) data-agent-confirm added around the piece while the gate waits: denied", r.error?.code === "denied" && e.ran.length === 0 && r.error.message.includes("Publishes the post"), r.error?.message)
}

/* ------------------------------------- 7c. one end mark after a reason */
{
  const endings = [
    ["period", "Removes the project for good."],
    ["question", "Send it to every client?"],
    ["none", "Publishes the post"],
  ]
  const markAfter = (message, reason) => message.slice(message.indexOf(reason) + reason.length).match(/^[.!?…]*/)[0]
  for (const [what, reason] of endings) {
    fresh()
    const plain = bridge({ settle: 5 })
    mount({ kind: "x", label: "R", value: {}, actions: { go: { run: () => {}, destructive: reason } } })
    const r = await plain.act("R", "go")
    const msg = r.error?.message ?? ""
    const mark = markAfter(msg, reason.replace(/[.?]$/, ""))
    check(`denied by the default gate, reason ending with ${what}: exactly one mark after it, no ".."`, r.error?.code === "denied" && mark.length === 1 && !msg.includes(".."), msg)

    fresh()
    const thrower = bridge({
      settle: 5,
      allow: () => {
        throw new Error(reason)
      },
    })
    mount({ kind: "x", label: "R", value: {}, actions: { go: { run: () => {} } } })
    const t = await thrower.act("R", "go")
    const tmsg = t.error?.message ?? ""
    check(`denied by a throwing gate, message ending with ${what}: exactly one mark, no ".."`, t.error?.code === "denied" && markAfter(tmsg, reason.replace(/[.?]$/, "")).length === 1 && !tmsg.includes(".."), tmsg)

    fresh()
    const state = { reason: "Archives the project" }
    const slow = bridge({ settle: 5, allow: async () => (setTimeout(() => (state.reason = reason), 5), await sleep(20), true) })
    mount({ kind: "x", label: "R", value: {}, actions: { go: { run: () => {}, destructive: () => state.reason } } })
    const c = await slow.act("R", "go")
    const cmsg = c.error?.message ?? ""
    check(`denied after a change during the gate, new reason ending with ${what}: exactly one mark, no ".."`, c.error?.code === "denied" && markAfter(cmsg, reason.replace(/[.?]$/, "")).length === 1 && !cmsg.includes(".."), cmsg)
  }
}

/* ----------------------------------------------- 8. queue, promises, current */
{
  fresh()
  const log = []
  let running = 0
  let maxRunning = 0
  let currentInGate = "unset"
  let agent
  agent = bridge({ allow: async (request) => (request.action === "slow" ? ((currentInGate = agent.current()), await sleep(25)) : null, true), settle: 5 })
  const make = (name) => ({
    run: async () => {
      running++
      maxRunning = Math.max(maxRunning, running)
      log.push(`start ${name}`)
      await sleep(20)
      log.push(`end ${name}`)
      running--
    },
  })
  mount({ kind: "q", label: "Queue", value: 0, actions: { a: make("a"), b: make("b"), slow: make("slow"), c: make("c") } })
  check("current() is null before any request", agent.current() === null, agent.current())
  const t0 = Date.now()
  const results = await Promise.all([agent.act("q-1", "a"), agent.act("q-1", "slow"), agent.act("q-1", "b"), agent.act("q-1", "c")])
  check("requests run one at a time, in call order", same(log, ["start a", "end a", "start slow", "end slow", "start b", "end b", "start c", "end c"]), log)
  check("never more than one run at once", maxRunning === 1, maxRunning)
  check("each act resolves with its own result", same(results.map((r) => r.action), ["a", "slow", "b", "c"]) && results.every((r) => r.ok), results.map((r) => r.action))
  check("a promise returned by run is awaited (4 x 20ms runs + 25ms gate)", Date.now() - t0 >= 100, `${Date.now() - t0}ms`)
  check("current() is null while the gate waits", currentInGate === null, currentInGate)
  check("current() is null after the request", agent.current() === null, agent.current())

  fresh()
  let inRun = null
  const agent2 = bridge({ settle: 5 })
  mount({ kind: "c", label: "Cur", value: 1, actions: { go: { run: () => (inRun = agent2.current()), args: [{ name: "x", type: "number" }] } } })
  await agent2.act("Cur", "go", { x: 2 })
  check("current() during run is the request (by label, resolved to its ref)", inRun?.ref === "c-1" && inRun.action === "go" && same(inRun.args, { x: 2 }) && inRun.destructive === false, inRun)
}

/* ---------------------------------------- 8b. runs that never finish */
{
  fresh()
  const agent = bridge({ timeout: 60, settle: 5 })
  const ran = []
  let rejectLate
  const m = mount({
    kind: "t",
    label: "Stuck",
    value: 0,
    actions: {
      hang: { run: () => (ran.push("hang"), new Promise(() => {})) },
      next: { run: () => ran.push("next") },
      lateReject: { run: () => (ran.push("lateReject"), new Promise((_, reject) => (rejectLate = reject))) },
      inTime: { run: () => (ran.push("inTime"), sleep(40)) },
    },
  })
  let t0 = Date.now()
  const [hung, after] = await Promise.all([agent.act("Stuck", "hang"), agent.act("Stuck", "next")])
  const took = Date.now() - t0
  check("a run that never settles fails at the timeout, message names action, ref and limit", hung.error?.code === "failed" && /"hang" on t-1 did not finish within 60 ms/.test(hung.error.message) && took >= 55 && took < 1000, { took: `${took}ms`, message: hung.error?.message })
  check("the next queued request still runs after a timeout", after.ok === true && same(ran, ["hang", "next"]), { after, ran })
  check("current() is null after a timeout", agent.current() === null, agent.current())

  const before = unhandled.length
  const late = await agent.act("Stuck", "lateReject")
  const following = agent.act("Stuck", "next")
  rejectLate(new Error("too late")) // lands while the next request is in flight
  const nextResult = await following
  await sleep(20)
  check("a late rejection after a timeout: no unhandled rejection, the next request unaffected", late.error?.code === "failed" && nextResult.ok === true && unhandled.length === before, { late: late.error?.code, next: nextResult, unhandled: unhandled.slice(before) })

  const ok = await agent.act("Stuck", "inTime")
  check("a run that resolves just inside the limit (40 of 60 ms) succeeds", ok.ok === true, ok)

  fresh()
  const agent2 = bridge({ timeout: 5000, settle: 5 })
  const order = []
  const gone = mount({ kind: "t", label: "Leaving", value: 0, actions: { hang: { run: () => (order.push("hang"), new Promise(() => {})) } } })
  mount({ kind: "t", label: "Staying", value: 0, actions: { go: { run: () => order.push("go") } } })
  t0 = Date.now()
  const pending = agent2.act("Leaving", "hang")
  const queued = agent2.act("Staying", "go")
  setTimeout(() => gone.unmount(), 20)
  const res = await pending
  const left = Date.now() - t0
  const q = await queued
  check("a piece that unmounts during a pending run fails promptly, message says it went away", res.error?.code === "failed" && res.error.message.includes("went away during") && left < 500, { took: `${left}ms`, message: res.error?.message })
  check("the queue continues after the unmount", q.ok === true && same(order, ["hang", "go"]) && agent2.current() === null, { q, order })
  void m
}

/* ------------------------------------------------ 9. settle and change events */
{
  fresh()
  const agent = bridge() // settle 60
  const events = []
  agent.subscribe((e) => events.push(e))
  const m = modal({ delay: 20 }) // state commits 20ms after the action, like a React render
  events.length = 0
  const r = await agent.act("modal-1", "open")
  check("result value is read after settle (commit 20ms later, settle 60ms)", same(r.value, { open: true }), r.value)
  const change = events.find((e) => e.type === "change")
  check("a change during the request is source agent with the request", change?.source === "agent" && change.request?.action === "open" && change.request.ref === "modal-1", change)
  check("event order: change then act", same(events.map((e) => e.type), ["change", "act"]), events.map((e) => e.type))
  events.length = 0
  m.update(false)
  await sleep(30)
  check("a change outside a request is source page, no request", events.length === 1 && events[0].source === "page" && !("request" in events[0]) && same(events[0].value, { open: false }), events)

  fresh()
  const quick = bridge({ settle: 0 })
  modal({ delay: 20 })
  const r2 = await quick.act("modal-1", "open")
  check("settle option: with settle 0 the value is read before a slow commit", same(r2.value, { open: false }), r2.value)
  await sleep(30)

  fresh()
  const agent3 = bridge({ settle: 30 })
  const ev3 = []
  agent3.subscribe((e) => ev3.push(e))
  const other = modal({ label: "Other" })
  const busy = mount({ kind: "s", label: "Slow", value: 0, actions: { go: { run: () => sleep(20) } } })
  const pending = agent3.act("Slow", "go")
  await sleep(5)
  other.update(true)
  await pending
  const ch = ev3.find((e) => e.type === "change")
  check("a change to another piece while a request runs is source page", ch?.ref === "modal-1" && ch.source === "page", ch)
  void busy
}

/* -------------------------------------------------------- 10. add / remove */
{
  fresh()
  const agent = bridge()
  const events = []
  agent.subscribe((e) => events.push(e))
  const m = mount({ kind: "popover", label: "Files", value: { open: null }, actions: {} })
  check("a new piece emits add with ref, kind, label", same(events, [{ type: "add", ref: "popover-1", kind: "popover", label: "Files" }]), events)
  m.unmount()
  check("an unmount emits remove", same(events[1], { type: "remove", ref: "popover-1", kind: "popover", label: "Files" }), events[1])
  m.ping()
  check("a stray ping after remove emits nothing", events.length === 2, events.length)
}

/* ------------------------------------------------------------ 11. hidden */
{
  fresh()
  const agent = bridge()
  const ran = []
  mount({ kind: "x", label: "Secret", value: 1, actions: { go: { run: () => ran.push(1) } } }, el({ "data-agent-hidden": "" }))
  mount({ kind: "x", label: "Null el", value: 2, actions: {} }, null)
  mount({ kind: "x", label: "No closest", value: 3, actions: {} }, {})
  const h = globalThis[HOST]
  const k = {}
  h.nodes.set(k, { el: () => { throw new Error("detached") }, node: () => ({ kind: "x", label: "Throwing el", value: 4, actions: {} }) })
  h.listeners.forEach((f) => f(k))
  const labels = agent.snapshot().map((s) => s.label)
  check("a piece inside data-agent-hidden is left out of the snapshot", !labels.includes("Secret"), labels)
  check("null el, el without closest, and a throwing el() are fine", same(labels, ["Null el", "No closest", "Throwing el"]), labels)
  const byRef = await agent.act("x-1", "go")
  const byLabel = await agent.act("Secret", "go")
  check("a hidden piece cannot be acted on by ref or label (not_found)", byRef.error?.code === "not_found" && byLabel.error?.code === "not_found" && ran.length === 0, [byRef.error?.code, byLabel.error?.code])
}

/* ------------------------------------------- 11b. hidden pieces and events */
{
  fresh()
  const agent = bridge()
  const events = []
  agent.subscribe((e) => events.push(e))
  const attrs = { "data-agent-hidden": "" }
  const card = (value) => ({ kind: "x", label: "Card number", value, actions: {} })
  const secret = mount(card("4111"), el(attrs))
  secret.set(card("4242"))
  check("a hidden piece emits no add or change: its label and value reach no subscriber", events.length === 0 && !/Card number|4111|4242/.test(JSON.stringify(events)), events)
  delete attrs["data-agent-hidden"]
  secret.set(card("shown"))
  check("when it stops being hidden, its next report is an add, with nothing from the hidden time", events.length === 1 && events[0].type === "add" && events[0].label === "Card number" && !/4111|4242/.test(JSON.stringify(events)), events)
  secret.set(card("shown 2"))
  check("after that its changes are reported as usual", events.length === 2 && events[1].type === "change" && events[1].value === "shown 2", events.slice(1))
  attrs["data-agent-hidden"] = ""
  secret.set(card("private again"))
  const last = events.at(-1)
  check("when it becomes hidden, its next report is a remove with no label and no value", events.length === 3 && last.type === "remove" && last.label === "" && !/private again/.test(JSON.stringify(last)), last)
  secret.set(card("still private"))
  secret.unmount()
  check("a hidden piece that changes and then unmounts emits nothing more", events.length === 3, events.length)

  // hidden and already on the page when the bridge is created
  fresh()
  const attrs2 = { "data-agent-hidden": "" }
  const codes = (value) => ({ kind: "y", label: "Recovery codes", value, actions: {} })
  const early = mount(codes("a"), el(attrs2))
  const agent2 = bridge()
  const ev2 = []
  agent2.subscribe((e) => ev2.push(e))
  early.set(codes("b"))
  early.unmount()
  check("a piece that was hidden before the bridge existed stays silent, unmount included", ev2.length === 0, ev2)
}

/* ----------------------------------------------------- 12. snapshot only reads */
{
  fresh()
  const agent = bridge()
  let runs = 0
  let destructiveCalls = 0
  mount({ kind: "x", label: "Read only", value: 1, actions: { go: { run: () => runs++, destructive: () => (destructiveCalls++, true) } } })
  agent.snapshot()
  agent.snapshot()
  check("snapshot never calls run or a destructive function", runs === 0 && destructiveCalls === 0, { runs, destructiveCalls })
  const cyclic = { a: 1 }
  cyclic.self = cyclic
  mount({ kind: "y", label: "Cyclic", value: cyclic, actions: {} })
  mount({ kind: "y", label: "Big", value: { n: 10n }, actions: {} })
  mount({ kind: "y", label: "Nothing", actions: {} })
  let snap
  let threw = null
  try {
    snap = agent.snapshot()
  } catch (e) {
    threw = e.message
  }
  check("unserialisable values (cycle, BigInt) become null, snapshot does not throw", threw === null && snap[1].value === null && snap[2].value === null, threw ?? snap.slice(1).map((s) => s.value))
  check("an undefined value is null", snap[3].value === null, snap[3].value)
  const r = await agent.act("Cyclic", "nope")
  check("act on a piece with an unserialisable value still answers", r.error?.code === "unknown_action", r.error?.code)
}

/* ------------------------------------------------------- 13. version guard */
{
  fresh()
  const ran = []
  const k = {}
  const foreign = { v: 2, nodes: new Map([[k, { el: () => null, node: () => ({ kind: "x", label: "New", actions: { go: { run: () => ran.push(1) } } }) }]]), listeners: new Set() }
  globalThis[HOST] = foreign
  const agent = bridge()
  const snap = agent.snapshot()
  const r = await agent.act("New", "go")
  check("registry v 2: snapshot is empty", same(snap, []), snap)
  check("registry v 2: act fails with failed, message names the version", r.error?.code === "failed" && r.error.message.includes("version 2") && ran.length === 0, r.error)
  check("registry v 2 is left untouched (same object, no listener added)", globalThis[HOST] === foreign && foreign.v === 2 && foreign.listeners.size === 0, { v: foreign.v, listeners: foreign.listeners.size })
}

/* --------------------------------------------------- 14. subscribers, act events */
{
  fresh()
  const agent = bridge({ settle: 5 })
  const good = []
  agent.subscribe(() => {
    throw new Error("bad subscriber")
  })
  const off = agent.subscribe((e) => good.push(e))
  modal()
  const r = await agent.act("modal-1", "open")
  check("a throwing subscriber breaks neither the bridge nor the others", r.ok === true && good.some((e) => e.type === "act"), good.map((e) => e.type))
  const actEvent = good.find((e) => e.type === "act")
  check("a finished act emits one act event with request and result", good.filter((e) => e.type === "act").length === 1 && actEvent.result === r && actEvent.request.ref === "modal-1", actEvent)
  const before = good.length
  const nf = await agent.act("ghost", "open", { x: 1 })
  const e = good.at(-1)
  check(
    "a failure before resolution: act event with the ref as given, empty kind/label, not destructive",
    good.length === before + 1 && e.type === "act" && same(e.request, { ref: "ghost", kind: "", label: "", action: "open", args: { x: 1 }, destructive: false }) && e.result === nf,
    e,
  )
  off()
  await agent.act("modal-1", "dismiss")
  check("unsubscribe stops events", good.length === before + 1, good.length)
}

/* ------------------------------------------------------- 15. run failures */
{
  fresh()
  const agent = bridge({ settle: 5 })
  mount({ kind: "x", label: "Breaks", value: 1, actions: { sync: { run: () => { throw new Error("sync boom") } }, async: { run: async () => { throw new Error("async boom") } } } })
  const a = await agent.act("Breaks", "sync")
  const b = await agent.act("Breaks", "async")
  check("run throwing: failed with its message", a.error?.code === "failed" && a.error.message.includes("sync boom"), a.error)
  check("run rejecting: failed with its message", b.error?.code === "failed" && b.error.message.includes("async boom"), b.error)
  check("current() is cleared after a failed run", agent.current() === null, agent.current())
}

/* -------------------------------------------------------------- 16. tools */
{
  fresh()
  const agent = bridge({ settle: 5 })
  modal()
  check("agentTools: pane_snapshot then pane_act", same(agentTools.map((t) => t.name), ["pane_snapshot", "pane_act"]), agentTools.map((t) => t.name))
  check("pane_snapshot annotations: readOnlyHint, untrustedContentHint", same(agentTools[0].annotations, { readOnlyHint: true, untrustedContentHint: true }), agentTools[0].annotations)
  check("pane_act annotations: consequentialHint, untrustedContentHint", same(agentTools[1].annotations, { consequentialHint: true, untrustedContentHint: true }), agentTools[1].annotations)
  check("pane_act schema: ref and action required strings, args object", same(agentTools[1].inputSchema.required, ["ref", "action"]) && agentTools[1].inputSchema.properties.ref.type === "string" && agentTools[1].inputSchema.properties.args.type === "object", agentTools[1].inputSchema.required)
  check("tool descriptions explain refs, labels and every error code", ["not_found", "ambiguous", "unknown_action", "disabled", "bad_args", "denied", "failed", "label"].every((w) => agentTools[1].description.includes(w)) && agentTools[0].description.includes("ref"), agentTools[1].description.length + " chars")
  const s = await callAgentTool(agent, "pane_snapshot", {})
  check("callAgentTool pane_snapshot returns { ok, pieces }", s.ok === true && s.pieces[0].ref === "modal-1", s)
  const a = await callAgentTool(agent, "pane_act", { ref: "modal-1", action: "open" })
  check("callAgentTool pane_act runs the action", a.ok === true && same(a.value, { open: true }), a)
  const bads = [
    [null, "not an object"],
    [{ action: "open" }, "missing ref"],
    [{ ref: "modal-1" }, "missing action"],
    [{ ref: "modal-1", action: "open", args: [1] }, "args not an object"],
    [{ ref: "modal-1", action: "open", extra: 1 }, "unknown field"],
  ]
  for (const [input, what] of bads) {
    const r = await callAgentTool(agent, "pane_act", input)
    check(`callAgentTool pane_act rejects bad input (${what}) with bad_args`, r.ok === false && r.error.code === "bad_args", r.error?.message)
  }
  const n = await callAgentTool(agent, "pane_act", { ref: "modal-1", action: "dismiss", args: null })
  check("callAgentTool pane_act accepts args: null as no args", n.ok === true, n)
  const u = await callAgentTool(agent, "pane_delete_everything", {})
  check("callAgentTool unknown tool: failed, names the tools", u.ok === false && u.error.code === "failed" && u.error.message.includes("pane_snapshot"), u)
}

/* ------------------------------------------------------------- 17. WebMCP */
{
  fresh()
  const agent = bridge({ settle: 5 })
  modal()
  delete globalThis.document
  check("no document: webMCPSupported is false", webMCPSupported() === false, webMCPSupported())
  let off = registerWebMCP(agent)
  let threw = null
  try {
    off()
  } catch (e) {
    threw = e.message
  }
  check("no document: registerWebMCP is a no-op returning a callable", typeof off === "function" && threw === null, threw)

  globalThis.document = { modelContext: {} }
  check("modelContext without registerTool: unsupported", webMCPSupported() === false, webMCPSupported())

  const registered = []
  globalThis.document = { modelContext: { registerTool: (tool, options) => (registered.push({ tool, options }), Promise.resolve()) } }
  check("document.modelContext.registerTool present: supported", webMCPSupported() === true, webMCPSupported())
  off = registerWebMCP(agent)
  check("registers both tools by name", same(registered.map((r) => r.tool.name), ["pane_snapshot", "pane_act"]), registered.map((r) => r.tool.name))
  check(
    "registered tools carry description, inputSchema and the annotations",
    registered.every((r, i) => r.tool.description === agentTools[i].description && r.tool.inputSchema === agentTools[i].inputSchema && same(r.tool.annotations, agentTools[i].annotations)),
    registered.map((r) => r.tool.annotations),
  )
  check("each registration gets an unaborted AbortSignal", registered.every((r) => r.options?.signal instanceof AbortSignal && !r.options.signal.aborted), registered.map((r) => r.options?.signal?.aborted))
  const snap = await registered[0].tool.execute({})
  const act = await registered[1].tool.execute({ ref: "modal-1", action: "open" })
  check("execute routes to the bridge (snapshot, act)", snap.ok === true && snap.pieces.length === 1 && act.ok === true && same(act.value, { open: true }), { snap: snap.ok, act })
  off()
  check("the returned function aborts the signals (unregisters)", registered.every((r) => r.options.signal.aborted), registered.map((r) => r.options.signal.aborted))

  const before = unhandled.length
  globalThis.document = { modelContext: { registerTool: () => Promise.reject(new Error("name taken")) } }
  registerWebMCP(agent)
  globalThis.document = {
    modelContext: {
      registerTool: () => {
        throw new Error("sync refusal")
      },
    },
  }
  threw = null
  try {
    registerWebMCP(agent)
  } catch (e) {
    threw = e.message
  }
  await sleep(10)
  check("a rejected or throwing registration is swallowed", threw === null && unhandled.length === before, { threw, unhandled: unhandled.slice(before) })
  delete globalThis.document
}

/* ------------------------------------------------------------- 18. destroy */
{
  fresh()
  let gateSignal = null
  const agent = createAgentBridge({ allow: (request, { signal }) => ((gateSignal = signal), new Promise(() => {})) }) // a gate that never answers
  const ran = []
  mount({ kind: "x", label: "D", value: 0, actions: { go: { run: () => ran.push(1) } } })
  const events = []
  agent.subscribe((e) => events.push(e))
  const host = globalThis[HOST]
  check("the bridge listens on the registry", host.listeners.size === 1, host.listeners.size)
  const first = agent.act("D", "go")
  const second = agent.act("D", "go")
  const third = agent.act("nobody", "go")
  await sleep(5)
  agent.destroy()
  const results = await Promise.race([Promise.all([first, second, third]), sleep(200).then(() => "timeout")])
  check("destroy aborts the signal a pending gate was given", gateSignal?.aborted === true, gateSignal?.aborted)
  check("destroy resolves the request at the gate and everything queued with failed", Array.isArray(results) && results.every((r) => r.ok === false && r.error.code === "failed"), results === "timeout" ? results : results.map((r) => r.error?.code))
  check("nothing ran", ran.length === 0, ran.length)
  check("each of them still emitted its act event", events.filter((e) => e.type === "act").length === 3, events.filter((e) => e.type === "act").length)
  check("destroy removes the bridge's listener from the registry", host.listeners.size === 0, host.listeners.size)
  const after = await agent.act("D", "go")
  check("act after destroy: failed", after.error?.code === "failed", after.error)
  agent.destroy()
  check("destroy twice is fine", true, "no throw")
}

fresh()
check("no unhandled promise rejections", unhandled.length === 0, unhandled)
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)

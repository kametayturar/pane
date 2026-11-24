// End-to-end check of the agent-operable demo page (#/agent-operable): the nine operable pieces,
// the agent bridge, the approval gate in the transcript, the page's own controls and WebMCP,
// driven with real (trusted) Chrome input through puppeteer-core.
//
//   node docs/review/agent-operable.mjs
//
// Needs the dev server on http://localhost:5180 (the page puts its bridge on window.__paneAgent
// in dev only). A second Chrome is launched with --enable-features=WebMCP for the WebMCP rows.
// Saves screenshots to docs/review/agent-operable-*.png. Prints one PASS/FAIL line per check with
// the observed value (INFO lines never fail) and exits 1 on any FAIL.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "./node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"

const BASE = process.env.A11Y_BASE ?? "http://localhost:5180"
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "../..")
const URL_ = `${BASE}/#/agent-operable`
const ARGS = ["--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows"]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
/** Fails fast with a readable message instead of waiting for puppeteer's protocol timeout. */
const within = (promise, ms, what) => {
  let t
  return Promise.race([promise, new Promise((_, rej) => (t = setTimeout(() => rej(new Error(`timed out after ${ms} ms waiting for ${what}`)), ms)))]).finally(() => clearTimeout(t))
}

/* ------------------------------------------------------------------ report */
let results = []
let out = []
const fmt = (v) => (typeof v === "string" ? v : JSON.stringify(v))
function check(area, name, ok, observed, expected = "") {
  out.push(`${ok ? "PASS" : "FAIL"}  [${area}] ${name}${observed !== undefined ? `  | observed: ${fmt(observed)}` : ""}${!ok && expected ? `  | expected: ${expected}` : ""}`)
  results.push({ area, name, ok })
  return ok
}
const info = (area, name, observed) => out.push(`INFO  [${area}] ${name}  | ${fmt(observed)}`)

/* ------------------------------------------------------------- page setup */
const errors = [] // console errors and page errors, from every page
// preview.html has no <link rel="icon">, so Chrome's automatic /favicon.ico request 404s there: not the page's doing
const IGNORED = /favicon\.ico/
const ignoredSeen = new Set()
let reloaded = false // set when the dev server reloads or hot-updates a page mid-run
let interruption = ""
const interrupted = (what) => {
  reloaded = true
  interruption ||= what
}

async function openPage(browser, { url = URL_, width = 1440, height = 900, theme = "light", label = "page" } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  // E2E_CPU=4 slows the page's CPU four times, to shake out timing-dependent results
  if (process.env.E2E_CPU) await page.emulateCPUThrottling(Number(process.env.E2E_CPU))
  // A small trace of input, focus and scroll, printed when a check about unexpected state fails.
  await page.evaluateOnNewDocument(() => {
    window.__trace = []
    const t0 = performance.now()
    const L = (s) => window.__trace.push(`${Math.round(performance.now() - t0)}ms ${s}`)
    const who = (t) => (t?.nodeType === 1 ? `${t.tagName.toLowerCase()}.${String(t.className).split(" ")[0]}${t.dataset?.answer ? `[${t.dataset.answer}]` : ""}${t.dataset?.ctl ? `[${t.dataset.ctl}]` : ""}` : String(t?.nodeName ?? t))
    for (const type of ["pointerdown", "keydown", "focusin"]) document.addEventListener(type, (e) => L(`${type}${e.isTrusted ? "" : " (synthetic)"} ${e.key ?? ""} ${who(e.target)}`), true)
    let lastY = -1
    document.addEventListener("scroll", () => {
      if (Math.abs(scrollY - lastY) > 200) L(`scroll y=${Math.round((lastY = scrollY))}`)
    }, true)
    window.__L = L
  })
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem("pane-theme", t)
    } catch {}
  }, theme)
  page.on("pageerror", (e) => errors.push(`${label} pageerror: ${e.message}`))
  page.on("console", (m) => {
    // Vite logs both kinds of update; a hot update re-renders without a load event
    const text = m.text()
    if (/\[vite\] (hot updated|page reload)/.test(text)) interrupted(`${/hot/.test(text) ? "hot update" : "page reload"} (${text.slice(7, 90)})`)
    if (m.type() !== "error") return
    const where = m.location()?.url ?? ""
    if (IGNORED.test(where)) return void ignoredSeen.add(`${label}: ${where}`)
    errors.push(`${label} console.error: ${m.text()}${where ? ` (${where})` : ""}`)
  })
  await page.goto(url, { waitUntil: "networkidle0" })
  // a Vite full reload fires load again (a hash change, as in the WebMCP rows, does not)
  page.on("load", () => interrupted("page reload"))
  await page.bringToFront()
  if (url === URL_) {
    await page.waitForFunction(() => !!window.__paneAgent && window.__paneAgent.peek().length === 9, { timeout: 10000 })
    await page.evaluate(() => {
      window.__ev = []
      window.__paneAgent.subscribe((e) => {
        window.__ev.push(e)
        if (e.type === "change") window.__L(`change ${e.ref} ${JSON.stringify(e.value?.open ?? e.value?.value ?? "")} ${e.source}`)
        if (e.type === "act") window.__L(`act ${e.request.ref}.${e.request.action} -> ${e.result.ok ? "ok" : e.result.error.code}`)
      })
    })
  }
  await sleep(600)
  return page
}

/** The live snapshot, read without writing a line to the transcript (peek is the dev-only unlogged snapshot). */
const snap = (page) => page.evaluate(() => window.__paneAgent.peek())
const piece = async (page, ref) => (await snap(page)).find((p) => p.ref === ref)
const flags = async (page, ref) => Object.fromEntries(((await piece(page, ref))?.actions ?? []).map((a) => [a.name, a.disabled ? "off" : "on"]))
const act = (page, ref, action, args) => within(page.evaluate((r, a, g) => window.__paneAgent.act(r, a, g), ref, action, args), 15000, `act("${ref}", "${action}") to settle`)
/**
 * A real (trusted) click that cannot land on a moving target: scroll the element into view at once,
 * wait until its box is the same across two animation frames (smooth scrolls, sticky offsets and
 * springs have settled), then press its centre.
 */
async function press(page, selector) {
  const el = await page.waitForSelector(selector, { timeout: 5000 })
  const box = await within(
    el.evaluate(async (node) => {
      node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" })
      const frame = () => new Promise((r) => requestAnimationFrame(() => r()))
      const read = () => JSON.stringify(node.getBoundingClientRect())
      let last = read()
      for (let i = 0; i < 120; i++) {
        await frame()
        await frame()
        const now = read()
        if (now === last) return now
        last = now
      }
      return null
    }),
    5000,
    `${selector} to stop moving`,
  )
  if (!box) throw new Error(`${selector} kept moving for 120 frame pairs; not pressing it`)
  await el.click()
}
/** Starts an act without waiting for it; `settle(page)` returns its result. */
const actLater = (page, ref, action, args) =>
  page.evaluate((r, a, g) => {
    window.__later = window.__paneAgent.act(r, a, g)
  }, ref, action, args)
const settle = (page) => within(page.evaluate(() => window.__later), 15000, "the pending act to settle after the prompt was answered")
const pendingPrompt = (page) => page.$('[data-line="prompt"][data-status="pending"]')
async function waitPrompt(page, timeout = 5000) {
  try {
    await page.waitForSelector('[data-line="prompt"][data-status="pending"]', { timeout })
    return true
  } catch {
    return false
  }
}
async function until(page, fn, timeout = 3000, arg) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 16 }, arg)
    return true
  } catch {
    return false
  }
}
const q = (page, sel, fn) => page.$eval(sel, fn).catch(() => null)
const promptText = (page) => q(page, '[data-line="prompt"][data-status="pending"]', (el) => el.textContent.replace(/\s+/g, " ").trim())
const lastResult = (page) =>
  page.evaluate(() => {
    const all = document.querySelectorAll('[data-line="result"]')
    const el = all[all.length - 1]
    return el ? { code: el.dataset.code, ref: el.dataset.ref, action: el.dataset.action, text: el.textContent.replace(/\s+/g, " ").trim() } : null
  })
/** Resets the page through its own Reset button (pieces remount, transcript clears). */
async function resetPage(page) {
  await press(page, '[data-ctl="reset"]')
  await sleep(700)
  await page.evaluate(() => (window.__ev = []))
}

/* ----------------------------------------------------------------- doc table */
function docTable() {
  const md = fs.readFileSync(path.join(ROOT, "docs/agent-operable.md"), "utf8")
  const KIND = { Modal: "modal", Popover: "popover", Tooltip: "tooltip", Drawer: "drawer", "Swipe Row": "swipe-row", "Hold to Confirm": "hold-to-confirm", "Action Drum": "action-drum", "Scope Words": "scope-words", "Plan Words": "plan-words" }
  const table = {}
  for (const line of md.split("\n")) {
    const m = line.match(/^\| ([A-Za-z ]+?) \| .* \| (.+) \|$/)
    if (!m || !KIND[m[1]]) continue
    // "No `reset`: ..." after the list says an action is deliberately absent
    const [list, ...rest] = m[2].split(/\bNo (?=`)/)
    const actions = [...list.matchAll(/(\*\*)?`(\w+)/g)].map((x) => ({ name: x[2], destructive: !!x[1] }))
    const absent = rest.map((r) => r.match(/^`(\w+)`/)?.[1]).filter(Boolean)
    table[KIND[m[1]]] = { actions, absent }
  }
  return table
}

/* ------------------------------------------------------------------ checks */
const REFS = { popover: "popover", tooltip: "tooltip", drawer: "drawer", drum: "action-drum", inbox: "swipe-row", hold: "hold-to-confirm", scope: "scope-words", plan: "plan-words", modal: "modal" }

async function snapshotChecks(page) {
  const A = "snapshot"
  const s = await snap(page)
  check(A, "nine entries", s.length === 9, s.length)
  const kinds = s.map((p) => p.kind).sort()
  check(A, "the nine kinds", JSON.stringify(kinds) === JSON.stringify(Object.values(REFS).sort()), kinds)
  check(A, "every label non-empty", s.every((p) => typeof p.label === "string" && p.label.trim()), s.map((p) => `${p.ref}: ${p.label}`))
  check(A, "refs as set by agentId", s.every((p) => REFS[p.ref] === p.kind), s.map((p) => `${p.ref}=${p.kind}`))
  check(A, "every value is plain JSON", s.every((p) => JSON.stringify(JSON.parse(JSON.stringify(p.value))) === JSON.stringify(p.value)), "round-trips")
  const table = docTable()
  check(A, "the design note's table lists all nine kinds", Object.keys(table).length === 9, Object.keys(table))
  for (const [kind, { actions, absent }] of Object.entries(table)) {
    const p = s.find((x) => x.kind === kind)
    const have = p?.actions.map((a) => a.name) ?? []
    const want = actions.map((a) => a.name)
    const same = have.length === want.length && want.every((n) => have.includes(n))
    check(A, `${kind}: declares exactly the actions in the note's table`, same, `declared ${have.join(", ")}`, want.join(", "))
    if (absent.length) check(A, `${kind}: has none of the actions the table says it lacks (${absent.join(", ")})`, absent.every((n) => !have.includes(n)), have)
    const wrong = actions.filter((a) => have.includes(a.name) && !!p.actions.find((x) => x.name === a.name).destructive !== a.destructive).map((a) => a.name)
    check(A, `${kind}: destructive flags match the table`, wrong.length === 0, p?.actions.filter((a) => a.destructive).map((a) => a.name) ?? [], `bold in table: ${actions.filter((a) => a.destructive).map((a) => a.name).join(", ")}`)
  }
}

async function loggingChecks(page) {
  const A = "transcript"
  const before = await page.$$eval('[data-line="snapshot"]', (els) => els.length)
  const n = await page.evaluate(() => window.__paneAgent.snapshot().length)
  const line = await page.evaluate(() => {
    const all = document.querySelectorAll('[data-line="snapshot"]')
    const el = all[all.length - 1]
    return el ? { caller: el.dataset.caller, count: el.dataset.count, rows: el.querySelectorAll("[data-snap-ref]").length } : null
  })
  check(A, "a snapshot() from another caller is written to the transcript under its name", n === 9 && line && line.caller === "console" && line.count === "9" && line.rows === 9, { before, line })
}

async function errorChecks(page) {
  const A = "errors"
  let r = await act(page, "nope", "open")
  check(A, "not_found for an unknown ref", !r.ok && r.error.code === "not_found", r.error)
  check(A, "not_found shown in the transcript", (await lastResult(page))?.code === "not_found", await lastResult(page))
  r = await act(page, "Filters", "open", { id: "status" })
  check(A, "a unique label works as a ref", r.ok && r.ref === "popover" && r.value.open === "status", r.ok ? { ref: r.ref, open: r.value.open } : r.error)
  await act(page, "popover", "close")
  const labels = (await snap(page)).map((p) => p.label.trim().toLowerCase())
  info(A, "ambiguous", new Set(labels).size === labels.length ? "not reachable on this page (all nine labels differ); covered by docs/review/agent-bridge-check.mjs 'ambiguous label'" : "labels repeat")
  r = await act(page, "popover", "explode")
  check(A, "unknown_action lists the available actions", !r.ok && r.error.code === "unknown_action" && /open, close/.test(r.error.message), r.error)
  r = await act(page, "popover", "close")
  check(A, "disabled for close on a closed popover", !r.ok && r.error.code === "disabled", r.error)
  r = await act(page, "drawer", "snapTo", { snap: 0.5 })
  check(A, "bad_args for a number outside the enum, message names the allowed values", !r.ok && r.error.code === "bad_args" && /0\.42 \| 0\.9/.test(r.error.message), r.error)
  r = await act(page, "drawer", "snapTo", { snap: "0.9" })
  check(A, "bad_args for a string where a number is declared", !r.ok && r.error.code === "bad_args" && /got a string/.test(r.error.message), r.error)
  r = await act(page, "popover", "open", { id: "sort", extra: 1 })
  check(A, "bad_args for an undeclared arg", !r.ok && r.error.code === "bad_args" && /Unknown arg "extra"/.test(r.error.message), r.error)
  check(A, "bad_args shown in the transcript with its message", /bad_args.*Unknown arg/.test((await lastResult(page))?.text ?? ""), (await lastResult(page))?.text)
}

async function popoverChecks(page) {
  const A = "popover"
  check(A, "disabled before: open on, close off", JSON.stringify(await flags(page, "popover")) === '{"open":"on","close":"off"}', await flags(page, "popover"))
  let r = await act(page, "popover", "open", { id: "share" })
  const exp = await q(page, '[data-piece="popover"] [aria-expanded="true"]', (el) => el.textContent.trim())
  const panel = await page.evaluate(() => [...document.querySelectorAll(".pvr-pn")].some((el) => el.getBoundingClientRect().height > 40 && getComputedStyle(el).visibility !== "hidden"))
  check(A, "open(share): ok, value.open = share, the Share trigger is expanded and its panel shows", r.ok && r.value.open === "share" && /Share/.test(exp ?? "") && panel, { value: r.value?.open, expanded: exp, panel })
  check(A, "disabled after open: close on", (await flags(page, "popover")).close === "on", await flags(page, "popover"))
  const ev = await page.evaluate(() => window.__ev.filter((e) => e.type === "change" && e.ref === "popover").map((e) => e.source))
  check(A, "change event for the act carries source: agent", ev.length > 0 && ev.every((s) => s === "agent"), ev)
  check(A, "the transcript shows the change as source: agent", !!(await page.$('[data-line="change"][data-ref="popover"][data-source="agent"]')), "line present")
  r = await act(page, "popover", "close")
  const exp2 = await page.$('[data-piece="popover"] [aria-expanded="true"]')
  check(A, "close: ok, value.open = null, no trigger expanded", r.ok && r.value.open === null && !exp2, { value: r.value?.open, expanded: !!exp2 })
  check(A, "disabled after close: close off", (await flags(page, "popover")).close === "off", await flags(page, "popover"))

  // a person's real click is a page change
  await page.evaluate(() => (window.__ev = []))
  // settle any smooth scroll first, so the click lands where the trigger is
  await page.$eval('[data-piece="popover"] .pvr-tr', (el) => el.scrollIntoView({ block: "center", behavior: "instant" }))
  await sleep(300)
  await press(page, '[data-piece="popover"] .pvr-tr')
  await sleep(400)
  const ev2 = await page.evaluate(() => window.__ev.filter((e) => e.type === "change" && e.ref === "popover").map((e) => ({ s: e.source, open: e.value.open })))
  check(A, "a real click on a trigger: change event with source: page", ev2.length > 0 && ev2.every((e) => e.s === "page") && ev2.at(-1).open, ev2)
  check(A, "the transcript shows it as source: page", !!(await page.$('[data-line="change"][data-ref="popover"][data-source="page"]')), "line present")
  await page.keyboard.press("Escape")
  await sleep(300)
}

async function tooltipChecks(page) {
  const A = "tooltip"
  check(A, "disabled before: show on, hide off, press on", JSON.stringify(await flags(page, "tooltip")) === '{"show":"on","hide":"off","press":"on"}', await flags(page, "tooltip"))
  let r = await act(page, "tooltip", "show", { id: "copy" })
  const tip = await page.evaluate(() => [...document.querySelectorAll('.tlt-tip[data-state="open"]')].map((t) => t.textContent.trim()))
  check(A, "show(copy): ok, value.open = copy, the Copy reply tip is open", r.ok && r.value.open === "copy" && tip.some((t) => /Copy reply/.test(t)), { value: r.value?.open, tips: tip })
  check(A, "disabled after show: hide on", (await flags(page, "tooltip")).hide === "on", await flags(page, "tooltip"))
  r = await act(page, "tooltip", "hide")
  const tip2 = await page.evaluate(() => document.querySelectorAll('.tlt-tip[data-state="open"]').length)
  check(A, "hide: ok, value.open = null, no tip open", r.ok && r.value.open === null && tip2 === 0, { value: r.value?.open, open: tip2 })
  r = await act(page, "tooltip", "press", { id: "save" })
  const note = await q(page, '[data-piece="tooltip"] figcaption', (el) => el.textContent)
  check(A, "press(save): ok, the page's onSelect ran (caption says pressed Save)", r.ok && /pressed Save/.test(note ?? ""), { ok: r.ok, caption: note })
}

async function drawerChecks(page) {
  const A = "drawer"
  let p = await piece(page, "drawer")
  check(A, "starts open at the low snap; disabled: open off, close on, snapTo on", p.value.open === true && p.value.snap === 0.42 && JSON.stringify(await flags(page, "drawer")) === '{"open":"off","close":"on","snapTo":"on"}', { value: p.value, flags: await flags(page, "drawer") })
  let r = await act(page, "drawer", "snapTo", { snap: 0.9 })
  const top = await page.$('[data-piece="drawer"] .drw-sheet[data-top]')
  check(A, "snapTo(0.9): ok, value.snap = 0.9, the sheet is at its top snap", r.ok && r.value.snap === 0.9 && !!top, { value: r.value, dataTop: !!top })
  r = await act(page, "drawer", "close")
  await sleep(300)
  const vis = await page.$('[data-piece="drawer"] .drw[data-vis]')
  check(A, "close: ok, value.open = false, the sheet is hidden", r.ok && r.value.open === false && !vis, { value: r.value, visible: !!vis })
  check(A, "disabled after close: open on, close off", JSON.stringify(await flags(page, "drawer")) === '{"open":"on","close":"off","snapTo":"on"}', await flags(page, "drawer"))
  r = await act(page, "drawer", "open")
  const vis2 = await page.$('[data-piece="drawer"] .drw[data-vis]')
  check(A, "open: ok, opens at the low snap, the sheet shows", r.ok && r.value.open === true && r.value.snap === 0.42 && !!vis2, { value: r.value, visible: !!vis2 })
}

async function drumChecks(page) {
  const A = "drum"
  check(A, "disabled before: select on, confirm on", (await flags(page, "drum")).select === "on" && (await flags(page, "drum")).confirm === "on", await flags(page, "drum"))
  let r = await act(page, "drum", "select", { id: "discard" })
  let label = await q(page, '[data-piece="drum"] .adr-go', (el) => el.getAttribute("aria-label"))
  check(A, "select(discard): ok, value = discard, the highlight reads Discard draft", r.ok && r.value.value === "discard" && label === "Discard draft", { value: r.value?.value, label })
  r = await act(page, "drum", "select", { id: "send" })
  const snapSend = (await piece(page, "drum")).actions.find((a) => a.name === "confirm")
  check(A, "on the accent verb, confirm is destructive", snapSend.destructive === true, snapSend)
  await actLater(page, "drum", "confirm")
  const shown = await waitPrompt(page)
  const txt = await promptText(page)
  check(A, "confirm on Send: the approval prompt appears with the reason", shown && /Send to 14 investors/.test(txt ?? ""), txt)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  r = await settle(page)
  const state = await q(page, '[data-piece="drum"] .adr-card', (el) => el.dataset.state)
  check(A, "Deny (real click): denied, nothing confirmed, card still idle", !r.ok && r.error.code === "denied" && (await piece(page, "drum")).value.confirmed === null && state === "idle", { result: r.error?.code, state })
  // a neutral-looking verb needs a person too: an agent's confirm here is the agent approving itself
  const ALLOW = '[data-line="prompt"][data-status="pending"] [data-answer="allow"]'
  r = await act(page, "drum", "select", { id: "hold" })
  const snapHold = (await piece(page, "drum")).actions.find((a) => a.name === "confirm")
  await actLater(page, "drum", "confirm")
  const shownHold = await waitPrompt(page)
  const txtHold = await promptText(page)
  check(A, "confirm on Hold (not the accent verb) is destructive too: the prompt names that verb", snapHold.destructive === true && shownHold && /Hold for review\. Nothing leaves yet/.test(txtHold ?? ""), txtHold)
  // the person rolls the drum to Send while that approval is open, then allows it: Hold was approved, Send would run
  await page.$eval('[data-piece="drum"] .adr-go', (el) => el.scrollIntoView({ block: "center", behavior: "instant" }))
  await page.focus('[data-piece="drum"] .adr-go')
  await page.keyboard.press("ArrowDown")
  await until(page, () => window.__paneAgent.peek().find((p) => p.ref === "drum").value.value === "send", 3000)
  await sleep(300)
  await press(page, ALLOW)
  r = await settle(page)
  const afterRace = (await piece(page, "drum")).value
  check(A, "rolled to Send while the approval for Hold was open, then Allow: refused, nothing confirmed", !r.ok && r.error.code === "denied" && /changed while the request waited/.test(r.error.message) && /Send to 14 investors/.test(r.error.message) && afterRace.confirmed === null && afterRace.value === "send", { code: r.error?.code, message: r.error?.message, value: afterRace })
  r = await act(page, "drum", "select", { id: "hold" })
  await actLater(page, "drum", "confirm")
  await waitPrompt(page)
  await press(page, ALLOW)
  r = await settle(page)
  const state2 = await q(page, '[data-piece="drum"] .adr-card', (el) => el.dataset.state)
  check(A, "confirm on Hold, Allow: ok, confirmed = hold, card done", r.ok && r.value.confirmed === "hold" && state2 === "done", { confirmed: r.value?.confirmed, state: state2 })
  check(A, "disabled after confirm: select off, confirm off", JSON.stringify(await flags(page, "drum")) === '{"select":"off","confirm":"off"}', await flags(page, "drum"))
  r = await act(page, "drum", "reset")
  check(A, "no reset, as the note's table says: unknown_action, and the drum stays confirmed", !r.ok && r.error.code === "unknown_action" && (await piece(page, "drum")).value.confirmed === "hold", r.ok ? r.value : r.error, "unknown_action")
}

async function inboxChecks(page) {
  const A = "inbox"
  check(A, "disabled before: reveal on, close off, commit on, restore off", JSON.stringify(await flags(page, "inbox")) === '{"reveal":"on","close":"off","commit":"on","restore":"off"}', await flags(page, "inbox"))
  let r = await act(page, "inbox", "reveal", { id: "reply", side: "left" })
  let side = await page.$$eval('[data-piece="inbox"] .swr-li[data-side]', (els) => els.map((e) => `${e.textContent.slice(0, 24)}|${e.dataset.side}`))
  check(A, "reveal(reply, left): ok, revealed = reply/left, that row is open in the DOM", r.ok && r.value.revealed?.id === "reply" && r.value.revealed?.side === "left" && side.length === 1 && /Reply to Harbor/.test(side[0]), { revealed: r.value?.revealed, dom: side })
  check(A, "disabled after reveal: close on", (await flags(page, "inbox")).close === "on", await flags(page, "inbox"))
  r = await act(page, "inbox", "close")
  side = await page.$$eval('[data-piece="inbox"] .swr-li[data-side]', (els) => els.length)
  check(A, "close: ok, revealed = null, no row open", r.ok && r.value.revealed === null && side === 0, { revealed: r.value?.revealed, open: side })

  await actLater(page, "inbox", "commit", { id: "invoice", action: "delete" })
  let txt = (await waitPrompt(page)) && (await promptText(page))
  check(A, "commit(invoice, delete): prompt names the action and the row", /Delete .Northwind invoice is \$180 over./.test(txt || ""), txt)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  r = await settle(page)
  let rows = await page.$$eval('[data-piece="inbox"] .swr-li:not([data-gone])', (els) => els.length)
  check(A, "Deny: denied, the row is still there", !r.ok && r.error.code === "denied" && rows === 4, { result: r.error?.code, rows })

  await actLater(page, "inbox", "commit", { id: "spend", action: "snooze" })
  await waitPrompt(page)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  r = await settle(page)
  await sleep(300)
  const titles = await page.$$eval('[data-piece="inbox"] .swr-li:not([data-gone])', (els) => els.map((e) => e.textContent))
  check(A, "Allow: commit(spend, snooze) ok, removed = [spend], the row left the list", r.ok && JSON.stringify(r.value.removed) === '["spend"]' && titles.length === 3 && !titles.some((t) => /Q3 spend/.test(t)), { removed: r.value?.removed, rows: titles.length })
  check(A, "disabled after commit: restore on", (await flags(page, "inbox")).restore === "on", await flags(page, "inbox"))
  r = await act(page, "inbox", "restore")
  rows = await page.$$eval('[data-piece="inbox"] .swr-li', (els) => els.length)
  check(A, "restore: ok, removed = [], four rows again", r.ok && r.value.removed.length === 0 && rows === 4, { removed: r.value?.removed, rows })
  check(A, "disabled after restore: restore off", (await flags(page, "inbox")).restore === "off", await flags(page, "inbox"))
}

async function holdChecks(page) {
  const A = "hold"
  check(A, "disabled before: confirm on, reset off", JSON.stringify(await flags(page, "hold")) === '{"confirm":"on","reset":"off"}', await flags(page, "hold"))
  await actLater(page, "hold", "confirm")
  await waitPrompt(page)
  check(A, "confirm: the prompt shows the reason", /Delete Harbor & Finch\? 14 members/.test((await promptText(page)) ?? ""), await promptText(page))
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  let r = await settle(page)
  let phase = await q(page, '[data-piece="hold"] .hcn', (el) => el.dataset.phase)
  check(A, "Deny: denied, the button never moved (phase idle)", !r.ok && r.error.code === "denied" && phase === "idle", { result: r.error?.code, phase })

  await actLater(page, "hold", "confirm")
  await waitPrompt(page)
  await page.evaluate(() => {
    window.__hold = { phases: [] }
    const el = document.querySelector('[data-piece="hold"] .hcn')
    new MutationObserver(() => window.__hold.phases.push([el.dataset.phase, performance.now()])).observe(el, { attributes: true, attributeFilter: ["data-phase"] })
    document.querySelector('[data-line="prompt"][data-status="pending"] [data-answer="allow"]').addEventListener("pointerdown", () => (window.__hold.click = performance.now()), { once: true })
  })
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  const midHold = await until(page, () => document.querySelector('[data-piece="hold"] .hcn').dataset.phase === "hold", 1000)
  r = await settle(page)
  const h = await page.evaluate(() => window.__hold)
  const done = h.phases.find((p) => p[0] === "done")
  const held = h.phases.find((p) => p[0] === "hold")
  const ms = done && h.click ? Math.round(done[1] - h.click) : null
  const holdMs = done && held ? Math.round(done[1] - held[1]) : null
  check(A, "Allow: the piece plays its own hold first (phase hold seen)", midHold, h.phases.map((p) => p[0]))
  check(A, "Allow: done only after the 1.2 s hold", r.ok && r.value.phase === "done" && holdMs !== null && holdMs >= 1180, { phase: r.value?.phase, allowClickToDoneMs: ms, holdToDoneMs: holdMs })
  check(A, "the result line shows ok with phase done", /phase: "done"/.test((await lastResult(page))?.text ?? "") && (await lastResult(page))?.code === "ok", (await lastResult(page))?.text)
  check(A, "disabled after done: confirm off, reset on", JSON.stringify(await flags(page, "hold")) === '{"confirm":"off","reset":"on"}', await flags(page, "hold"))
  return async () => {
    r = await act(page, "hold", "reset")
    phase = await q(page, '[data-piece="hold"] .hcn', (el) => el.dataset.phase)
    check(A, "reset: ok, phase idle again in the value and the DOM", r.ok && r.value.phase === "idle" && phase === "idle", { value: r.value, phase })
  }
}

async function scopeChecks(page) {
  const A = "scope"
  check(A, "disabled before: grant on, revoke off", JSON.stringify(await flags(page, "scope")) === '{"grant":"on","revoke":"off"}', await flags(page, "scope"))
  await actLater(page, "scope", "grant", { id: "always" })
  await waitPrompt(page)
  check(A, "grant(always): prompt says what widens", /Quill can now send email as you: Always/.test((await promptText(page)) ?? ""), await promptText(page))
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  let r = await settle(page)
  check(A, "Deny: denied, nothing granted", !r.ok && r.error.code === "denied" && (await piece(page, "scope")).value.granted === null, r.error?.code)
  await actLater(page, "scope", "grant", { id: "task" })
  await waitPrompt(page)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  r = await settle(page)
  const head = await q(page, '[data-piece="scope"] .scw-tick', (el) => el.textContent.replace(/\s+/g, " ").trim())
  const pressed = await q(page, '[data-piece="scope"] [aria-pressed="true"]', (el) => el.textContent.trim())
  check(A, "Allow: grant(task) ok, granted = task, the heading and the pressed word follow", r.ok && r.value.granted === "task" && /can now/.test(head ?? "") && /This task/.test(pressed ?? ""), { granted: r.value?.granted, head, pressed })
  check(A, "disabled after grant: grant off, revoke on", JSON.stringify(await flags(page, "scope")) === '{"grant":"off","revoke":"on"}', await flags(page, "scope"))
  r = await act(page, "scope", "revoke")
  const head2 = await q(page, '[data-piece="scope"] .scw-tick', (el) => el.textContent.replace(/\s+/g, " ").trim())
  check(A, "revoke: ok, granted = null, the heading goes back", r.ok && r.value.granted === null && /can.t send/.test(head2 ?? ""), { granted: r.value?.granted, head: head2 })
}

async function planChecks(page) {
  const A = "plan"
  check(A, "disabled before: setMode on, go on", JSON.stringify(await flags(page, "plan")) === '{"setMode":"on","go":"on"}', await flags(page, "plan"))
  let r = await act(page, "plan", "setMode", { step: "summary", mode: "skip" })
  const m = await page.$$eval('[data-piece="plan"] .plw-row', (els) => els.map((e) => e.dataset.m))
  check(A, "setMode(summary, skip): ok, modes.summary = skip, that row reads skip in the DOM", r.ok && r.value.modes.summary === "skip" && m[2] === "skip", { modes: r.value?.modes, dom: m })
  r = await act(page, "plan", "setMode", { step: "invoices", mode: "ask" })
  check(A, "setMode(invoices, ask): two presses land on ask", r.ok && r.value.modes.invoices === "ask", r.value?.modes)
  await actLater(page, "plan", "go")
  await waitPrompt(page)
  const txt = await promptText(page)
  check(A, "go: the prompt summarises the plan as it stands", /2 steps run, 1 asks first, 1 skipped/.test(txt ?? ""), txt)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  r = await settle(page)
  check(A, "Deny: denied, not started", !r.ok && r.error.code === "denied" && (await piece(page, "plan")).value.started === false && !(await page.$('[data-piece="plan"] .plw-card[data-started]')), r.error?.code)
  await actLater(page, "plan", "go")
  await waitPrompt(page)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  r = await settle(page)
  const started = !!(await page.$('[data-piece="plan"] .plw-card[data-started]'))
  check(A, "Allow: go ok, started = true, the card shows statuses", r.ok && r.value.started === true && started, { started: r.value?.started, dom: started })
  check(A, "disabled after go: setMode off, go off", JSON.stringify(await flags(page, "plan")) === '{"setMode":"off","go":"off"}', await flags(page, "plan"))
}

async function modalChecks(page) {
  const A = "modal"
  check(A, "disabled before: open on, dismiss off, confirm off", JSON.stringify(await flags(page, "modal")) === '{"open":"on","dismiss":"off","confirm":"off"}', await flags(page, "modal"))
  let r = await act(page, "modal", "open")
  const dom = await page.evaluate(() => ({
    open: document.querySelector('[data-piece="modal"] .mdl-root')?.dataset.open,
    ariaModal: document.querySelector('[data-piece="modal"] [role="dialog"]')?.getAttribute("aria-modal"),
    consoleInert: !!document.querySelector("[data-agent-console]").closest("[inert]"),
    focus: document.activeElement?.textContent?.trim(),
  }))
  check(A, "open: ok, value.open = true, dialog open and aria-modal, focus on Cancel, the console is inert", r.ok && r.value.open === true && dom.open === "true" && dom.ariaModal === "true" && dom.consoleInert && dom.focus === "Cancel", dom)
  check(A, "disabled after open: open off, dismiss on, confirm on", JSON.stringify(await flags(page, "modal")) === '{"open":"off","dismiss":"on","confirm":"on"}', await flags(page, "modal"))
  r = await act(page, "modal", "dismiss")
  const dom2 = await page.evaluate(() => ({ open: document.querySelector('[data-piece="modal"] .mdl-root')?.dataset.open, consoleInert: !!document.querySelector("[data-agent-console]").closest("[inert]") }))
  check(A, "dismiss: ok, value.open = false, dialog closed, console live again", r.ok && r.value.open === false && dom2.open === "false" && !dom2.consoleInert, dom2)

  // The lesson: a confirm while the dialog is open asks in a console the dialog made inert.
  await act(page, "modal", "open")
  await actLater(page, "modal", "confirm")
  const shown = await waitPrompt(page)
  const inert = await page.evaluate(() => !!document.querySelector('[data-line="prompt"][data-status="pending"]')?.closest("[inert]"))
  check(A, "confirm while open: the prompt appears, inside the inert part of the page", shown && inert, { shown, inert })
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  await sleep(500)
  const after = await page.evaluate(() => ({ open: document.querySelector('[data-piece="modal"] .mdl-root')?.dataset.open, prompt: document.querySelector('[data-line="prompt"]:last-of-type')?.dataset.status }))
  check(A, "a real click on that Allow cannot press it: it lands as a press outside the dialog, which closes it; the prompt stays pending", after.open === "false" && !!(await pendingPrompt(page)), after)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  r = await settle(page)
  check(A, "Allow, now pressable: the bridge re-checks and refuses, the dialog is no longer open", !r.ok && r.error.code === "disabled" && /while the request waited/.test(r.error.message), r.error)

  // The confirm path itself: Allow pressed programmatically (no person could press it while the console is inert).
  await act(page, "modal", "open")
  await actLater(page, "modal", "confirm")
  await waitPrompt(page)
  await page.$eval('[data-line="prompt"][data-status="pending"] [data-answer="allow"]', (b) => b.click())
  r = await Promise.race([settle(page), sleep(4000).then(() => ({ timeout: true }))])
  if (r.timeout) {
    check(A, "confirm runs when allowed (Allow pressed with element.click(), the console being inert)", false, "the inert Allow did not respond to element.click()")
    await page.keyboard.press("Escape")
    await sleep(400)
    await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]').catch(() => {})
    await settle(page)
  } else {
    const done = await page.evaluate(() => ({ open: document.querySelector('[data-piece="modal"] .mdl-root')?.dataset.open, header: document.querySelector('[data-piece="modal"] .mdl-bar')?.dataset.done }))
    check(A, "confirm runs when allowed (Allow pressed with element.click(), the console being inert): ok, closed, inbox shows 212 archived", r.ok && r.value.open === false && done.open === "false" && done.header === "true", { result: r.ok ? r.value : r.error, ...done })
  }
}

async function pageUiChecks(page) {
  const A = "page"
  await resetPage(page)
  const fresh = await page.evaluate(() => ({
    lines: document.querySelectorAll("[data-line]").length,
    status: document.querySelector("[data-status]")?.dataset.status,
    counter: document.querySelector("[data-status] span")?.textContent,
    hold: document.querySelector('[data-piece="hold"] .hcn')?.dataset.phase,
    plan: !!document.querySelector('[data-piece="plan"] .plw-card[data-started]'),
    rows: document.querySelectorAll('[data-piece="inbox"] .swr-li').length,
  }))
  check(A, "Reset clears the transcript and remounts the pieces", fresh.lines === 0 && fresh.status === "Ready" && /^0\/\d+$/.test(fresh.counter) && fresh.hold === "idle" && !fresh.plan && fresh.rows === 4, fresh)
  const refs = (await snap(page)).map((p) => p.ref).sort().join(",")
  check(A, "after the remount the refs are the same nine", refs === Object.keys(REFS).sort().join(","), refs)

  await press(page, '[data-ctl="step"]')
  await until(page, () => document.querySelector('[data-status]')?.dataset.status !== "Running", 4000)
  const s1 = await page.evaluate(() => ({ kinds: [...document.querySelectorAll("[data-line]")].map((l) => l.dataset.line), rows: document.querySelectorAll('[data-line="snapshot"] [data-snap-ref]').length, counter: document.querySelector("[data-status] span")?.textContent }))
  check(A, "Step makes one call: snapshot(), listing nine pieces", JSON.stringify(s1.kinds) === '["say","snapshot"]' && s1.rows === 9 && /^1\//.test(s1.counter), s1)
  await press(page, '[data-ctl="step"]')
  await until(page, () => document.querySelectorAll('[data-line="result"]').length === 1, 4000)
  const s2 = await page.evaluate(() => [...document.querySelectorAll("[data-line]")].map((l) => l.dataset.line + (l.dataset.code ? `:${l.dataset.code}` : "") + (l.dataset.source ? `:${l.dataset.source}` : "")))
  check(A, "Step again: one act (popover open) with its result and its agent change", s2.slice(2).join(" ") === "say call change:agent result:ok" || s2.slice(2).join(" ") === "say call result:ok change:agent", s2)
  const raw = await page.$eval('[data-line="snapshot"] details', (d) => {
    d.open = true
    return JSON.parse(d.querySelector("pre").textContent).length
  })
  check(A, "the snapshot's raw JSON sits behind a disclosure and parses to nine entries", raw === 9, raw)

  await resetPage(page)
  await page.evaluate(() => (window.__trace.length = 0))
  await press(page, '[data-ctl="run"]')
  const t0 = Date.now()
  const at = await waitPrompt(page, 30000)
  const run1 = await page.evaluate(() => ({
    calls: [...document.querySelectorAll('[data-line="call"]')].map((l) => l.textContent.replace(/^agent/, "").trim()),
    results: [...document.querySelectorAll('[data-line="result"]')].map((l) => l.dataset.code),
    status: document.querySelector("[data-status]")?.dataset.status,
    prompt: document.querySelector('[data-line="prompt"][data-status="pending"]')?.textContent.slice(0, 60),
  }))
  check(A, "Run plays the script to its first approval prompt and waits", at && run1.status === "Waiting for you" && /hold confirm/.test(run1.prompt ?? ""), { ms: Date.now() - t0, status: run1.status, prompt: run1.prompt })
  if (!check(A, "the calls before it: snapshot, harmless acts on six pieces, one bad_args", run1.results.join(",") === "ok,ok,ok,ok,ok,ok,ok,bad_args" && run1.calls.length === 9, { calls: run1.calls, results: run1.results }))
    info(A, "trace of that run", await page.evaluate(() => window.__trace.slice(0, 80)))
  await sleep(1500)
  const still = await page.evaluate(() => document.querySelectorAll('[data-line="call"]').length)
  check(A, "while the prompt is open the script makes no further call", still === run1.calls.length, still)
  return run1
}

async function finishRun(page, shots) {
  const A = "page"
  // hold: Deny; scope: Allow; plan go: Allow; then the modal steps and the last snapshot run alone
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  await waitPrompt(page, 8000)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  await waitPrompt(page, 8000)
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="allow"]')
  const end = await until(page, () => document.querySelector("[data-status]")?.dataset.status === "End of script", 20000)
  const fin = await page.evaluate(() => ({
    results: [...document.querySelectorAll('[data-line="result"]')].map((l) => `${l.dataset.ref}.${l.dataset.action}:${l.dataset.code}`),
    snaps: document.querySelectorAll('[data-line="snapshot"]').length,
    modalOpenInSnap: [...document.querySelectorAll('[data-line="snapshot"] [data-snap-ref="modal"]')].map((r) => r.textContent),
    prompts: [...document.querySelectorAll('[data-line="prompt"]')].map((p) => p.dataset.status),
  }))
  check(A, "after Deny, Allow, Allow the script runs to its end", end, fin.results)
  check(A, "the denied hold confirm shows as denied, the allowed grant and go as ok", fin.results.includes("hold.confirm:denied") && fin.results.includes("scope.grant:ok") && fin.results.includes("plan.go:ok"), fin.prompts)
  check(A, "a snapshot while the dialog is open lists modal open: true; it is dismissed after", fin.modalOpenInSnap.some((t) => /open: true/.test(t)) && fin.results.includes("modal.open:ok") && fin.results.includes("modal.dismiss:ok"), fin.modalOpenInSnap)
  check(A, "Run and Step are disabled at the end of the script", await page.$eval('[data-ctl="run"]', (b) => b.disabled) && (await page.$eval('[data-ctl="step"]', (b) => b.disabled)), "disabled")
  if (shots) await shots()
}

async function tryItChecks(page) {
  const A = "try it"
  await resetPage(page)
  await page.select("[data-try-ref]", "popover")
  const opts = await page.$$eval("[data-try-action] option", (os) => os.map((o) => `${o.value}${o.disabled ? " (disabled)" : ""}: ${o.textContent}`))
  check(A, "disabled actions are listed as unavailable", opts.some((o) => /^close \(disabled\): close \(unavailable\)/.test(o)), opts)
  await page.select("[data-try-ref]", "drum")
  await page.select("[data-try-action]", "select")
  const kind = await page.$eval('[data-try-arg="id"]', (el) => `${el.tagName}:${[...(el.options ?? [])].map((o) => o.value).join("|")}`)
  check(A, "an enum arg is a select with the declared values", kind === "SELECT:discard|hold|send", kind)
  await page.select('[data-try-arg="id"]', "discard")
  await press(page, "[data-try-call]")
  await until(page, () => document.querySelector('[data-line="result"]'), 4000)
  const line = await page.evaluate(() => ({ caller: document.querySelector('[data-line="call"]')?.dataset.caller, call: document.querySelector('[data-line="call"]')?.textContent, result: document.querySelector('[data-line="result"]')?.textContent }))
  const label = await q(page, '[data-piece="drum"] .adr-go', (el) => el.getAttribute("aria-label"))
  check(A, "Call runs select(discard) through the bridge: logged as you, ok, the drum moved", line.caller === "you" && /act\("drum", "select", \{ id: "discard" \}\)/.test(line.call) && /value: "discard"/.test(line.result) && label === "Discard draft", { ...line, label })
  await page.select("[data-try-ref]", "drawer")
  await page.select("[data-try-action]", "snapTo")
  const num = await page.$eval('[data-try-arg="snap"]', (el) => `${el.tagName}:${[...(el.options ?? [])].map((o) => o.value).join("|")}`)
  check(A, "a number enum arg is a select of numbers", num === "SELECT:0.42|0.9", num)
  await page.select('[data-try-arg="snap"]', "0.9")
  await press(page, "[data-try-call]")
  await until(page, () => document.querySelectorAll('[data-line="result"]').length === 2, 4000)
  check(A, "Call snapTo(0.9) sends a number and the sheet moves", (await piece(page, "drawer")).value.snap === 0.9, (await piece(page, "drawer")).value)
  await page.select("[data-try-ref]", "hold")
  await page.select("[data-try-action]", "confirm")
  await press(page, "[data-try-call]")
  const shown = await waitPrompt(page)
  check(A, "a destructive call from Try it goes through the same gate", shown, await promptText(page))
  await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
  await until(page, () => document.querySelectorAll('[data-line="result"]').length === 3, 4000)
  check(A, "denied", (await lastResult(page))?.code === "denied", await lastResult(page))
}

async function keyboardPageChange(page) {
  const A = "events"
  await resetPage(page)
  await page.$eval('[data-piece="drum"] .adr-go', (el) => el.scrollIntoView({ block: "center", behavior: "instant" }))
  await sleep(300)
  await page.focus('[data-piece="drum"] .adr-go')
  await page.keyboard.press("ArrowDown")
  await sleep(900)
  const ev = await page.evaluate(() => window.__ev.filter((e) => e.type === "change" && e.ref === "drum").map((e) => ({ s: e.source, v: e.value.value })))
  check(A, "a real ArrowDown on the drum: change event with source: page", ev.length > 0 && ev.every((e) => e.s === "page") && ev.at(-1).v === "send", ev)
  const r = await act(page, "drum", "select", { id: "hold" })
  const ev2 = await page.evaluate(() => window.__ev.filter((e) => e.type === "change" && e.ref === "drum").map((e) => e.source))
  check(A, "the agent's select right after: source: agent, and current() named the request meanwhile", r.ok && ev2.at(-1) === "agent", ev2)
  const cur = await page.evaluate(async () => {
    const seen = []
    const off = window.__paneAgent.subscribe((e) => e.type === "change" && seen.push(window.__paneAgent.current()?.action ?? null))
    await window.__paneAgent.act("drum", "select", { id: "discard" })
    off()
    return seen
  })
  check(A, "current() during an act's change is that request", cur.length > 0 && cur.every((a) => a === "select"), cur)
}

/* ------------------------------------------------------------- the stub */
function stubChecks() {
  const A = "stub"
  // the nine pieces on the demo page, then the operable pieces that are not on it
  const operable = ["modal", "popover", "tooltip", "drawer", "swipe-row", "hold-to-confirm", "action-drum", "scope-words", "plan-words", "range-bar", "run-health", "diff-review", "terminal-transcript", "change-tree"]
  const cut = (text) => {
    const lines = text.split("\n")
    const a = lines.findIndex((l) => l.includes("Agent bridge (inline stub)"))
    const b = lines.findIndex((l, i) => i > a && l.includes("end of stub"))
    return a < 0 || b < 0 ? null : lines.slice(a, b + 1).join("\n")
  }
  const stubs = operable.map((n) => cut(fs.readFileSync(path.join(ROOT, `src/components/ui/${n}.tsx`), "utf8")))
  const same = stubs.every((s) => s !== null && s === stubs[0])
  check(A, `the stub text is byte-identical in all ${operable.length} operable pieces`, same, `${Buffer.byteLength(stubs[0] ?? "")} bytes, ${(stubs[0] ?? "").split("\n").length} lines`)
  // nothing else in src carries a stub (or a drifted copy of it)
  const others = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.tsx?$/.test(e.name) && /Agent bridge \(inline stub\)|function useAgentNode/.test(fs.readFileSync(p, "utf8"))) others.push(path.relative(ROOT, p))
    }
  }
  walk(path.join(ROOT, "src"))
  const extra = others.filter((f) => !operable.some((n) => f === `src/components/ui/${n}.tsx`))
  check(A, "no other file in src carries the stub", extra.length === 0, extra.length ? extra : `${others.length} files, all ${operable.length} operable pieces`)
  const fns = operable.map((n) => (fs.readFileSync(path.join(ROOT, `src/components/ui/${n}.tsx`), "utf8").match(/useAgentNode\(/g) ?? []).length)
  info(A, "useAgentNode( occurrences per piece (definition + calls)", Object.fromEntries(operable.map((n, i) => [n, fns[i]])))
}

/* --------------------------------------------------------------- standalone */
async function standaloneChecks(browser) {
  const A = "standalone"
  const before = errors.length
  const page = await openPage(browser, { url: `${BASE}/preview.html?slug=modal`, width: 1000, height: 800, label: "preview modal" })
  const reg = await page.evaluate(() => {
    const h = globalThis[Symbol.for("pane.agent")]
    return h ? { v: h.v, nodes: h.nodes.size, listeners: h.listeners.size, helper: "__paneAgent" in window } : null
  })
  check(A, "preview.html?slug=modal: the registry exists with one node and no listeners, no helper on the page", reg && reg.v === 1 && reg.nodes === 1 && reg.listeners === 0 && !reg.helper, reg)
  const seen = new Set()
  for (let i = 0; i < 90; i++) {
    seen.add(await page.$eval(".mdl-root", (el) => el.dataset.open).catch(() => "?"))
    if (seen.has("true") && seen.has("false")) break
    await sleep(100)
  }
  check(A, "the modal's own loop still plays (the dialog opens and closes by itself)", seen.has("true") && seen.has("false"), [...seen])
  check(A, "no page or console errors there", errors.length === before, errors.slice(before))
  await page.close()
}

/* ------------------------------------------------------------------ WebMCP */
async function webmcpChecks() {
  const A = "webmcp"
  const browser = await puppeteer.launch({ executablePath: CHROME, args: [...ARGS, "--enable-features=WebMCP"], protocolTimeout: 60000 })
  try {
    const page = await openPage(browser, { label: "webmcp" })
    const state = await until(page, () => document.querySelector("[data-webmcp]")?.dataset.webmcp !== "checking", 4000).then(() => q(page, "[data-webmcp]", (el) => el.dataset.webmcp))
    check(A, "with --enable-features=WebMCP the page says the browser took the tools", state === "accepted", state)
    const names = await page.evaluate(async () => (await document.modelContext.getTools()).map((t) => t.name))
    check(A, "document.modelContext.getTools() lists pane_snapshot and pane_act", names.includes("pane_snapshot") && names.includes("pane_act"), names)
    const exec = (name, input) =>
      within(page.evaluate(async (n, i) => {
        const tool = (await document.modelContext.getTools()).find((t) => t.name === n)
        const r = await document.modelContext.executeTool(tool, i)
        return typeof r === "string" ? JSON.parse(r) : r
      }, name, input), 15000, `executeTool(${name})`)
    const s = await exec("pane_snapshot", {})
    check(A, "executeTool(pane_snapshot) returns nine pieces", s.ok === true && s.pieces?.length === 9, { ok: s.ok, pieces: s.pieces?.map((p) => p.ref) })
    const r = await exec("pane_act", { ref: "popover", action: "open", args: { id: "sort" } })
    const exp = await q(page, '[data-piece="popover"] [aria-expanded="true"]', (el) => el.textContent.trim())
    const logged = await q(page, '[data-line="call"][data-caller="browser agent"]', (el) => el.textContent)
    check(A, "executeTool(pane_act popover open sort): ok and the Sort panel is open in the DOM", r.ok && r.value.open === "sort" && /Sort/.test(exp ?? ""), { ok: r.ok, expanded: exp })
    check(A, "the browser agent's call shows in the transcript", /act\("popover", "open", \{ id: "sort" \}\)/.test(logged ?? ""), logged)
    await page.evaluate(async () => {
      const tool = (await document.modelContext.getTools()).find((t) => t.name === "pane_act")
      window.__wm = document.modelContext.executeTool(tool, { ref: "hold", action: "confirm" })
    })
    const shown = await waitPrompt(page)
    check(A, "a destructive pane_act produces the approval prompt", shown, await promptText(page))
    await press(page, '[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
    const d = await within(
      page.evaluate(async () => {
        const r = await window.__wm
        return typeof r === "string" ? JSON.parse(r) : r
      }),
      15000,
      "executeTool(pane_act hold confirm) to return after Deny",
    ).catch(async (e) => {
      // say which side is stuck: the press (prompt still pending, something over the button) or the browser's executeTool
      const diag = await page.evaluate(() => {
        const prompts = [...document.querySelectorAll('[data-line="prompt"]')].map((p) => p.dataset.status)
        const results = [...document.querySelectorAll('[data-line="result"]')].slice(-2).map((l) => l.textContent.slice(0, 120))
        const b = document.querySelector('[data-line="prompt"][data-status="pending"] [data-answer="deny"]')
        if (!b) return { prompts, results, deny: "no pending prompt left: the press landed", trace: window.__trace.slice(-30) }
        const r = b.getBoundingClientRect()
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        const name = (el) => (el ? `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}` : "nothing")
        return { prompts, results, denyBox: [r.left, r.top, r.width, r.height].map(Math.round), atItsCentre: name(top), isDeny: !!top && (top === b || b.contains(top)), inert: !!b.closest("[inert]"), trace: window.__trace.slice(-30) }
      }).catch((x) => ({ error: String(x) }))
      info(A, "state when the Deny wait timed out", diag)
      throw e
    })
    check(A, "Deny returns denied to the browser agent, the hold never moved", d.ok === false && d.error?.code === "denied" && (await q(page, '[data-piece="hold"] .hcn', (el) => el.dataset.phase)) === "idle", d.error)
    const bad = await exec("pane_act", { ref: "popover", action: "open", args: { id: "nope" } })
    check(A, "bad args through WebMCP come back as bad_args", bad.ok === false && bad.error.code === "bad_args", bad.error)
    // leaving the page unregisters the tools
    await page.evaluate(() => (location.hash = "#/mcp"))
    await sleep(800)
    const left = await page.evaluate(async () => (await document.modelContext.getTools()).map((t) => t.name))
    check(A, "navigating away unregisters both tools", !left.includes("pane_act") && !left.includes("pane_snapshot"), left)
    await page.close()
  } finally {
    await browser.close()
  }
}

/**
 * A press held for 300 ms on Deny while a popover is open. The press's pointerdown closes the popover
 * (light dismiss), which logs a change line; if the transcript scrolled for that line the button would
 * leave the pointer before the release and the click would be lost.
 */
async function slowPressChecks(page) {
  const A = "gate"
  await resetPage(page)
  // enough lines for the transcript to overflow, so a new line would scroll it
  for (let i = 0; i < 4; i++) {
    await act(page, "popover", "open", { id: "sort" })
    await act(page, "popover", "close")
  }
  await act(page, "popover", "open", { id: "sort" })
  await actLater(page, "hold", "confirm")
  await waitPrompt(page)
  const sel = '[data-line="prompt"][data-status="pending"] [data-answer="deny"]'
  const box = async () => q(page, sel, (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: Math.round(r.top) }
  })
  await sleep(900) // the page's scroll to the hold piece has ended
  const b0 = await box()
  await page.mouse.move(b0.x, b0.y)
  await page.mouse.down()
  await sleep(300)
  const b1 = await box()
  const popoverOpen = (await piece(page, "popover")).value.open
  await page.mouse.up()
  const r = await settle(page).catch((e) => ({ ok: false, error: { code: String(e.message) } }))
  check(A, "a 300 ms press on Deny while a popover is open: the button stays under the pointer and the request is denied", r.ok === false && r.error.code === "denied" && b1 && b1.top === b0.top && popoverOpen === null, {
    result: r.error?.code,
    denyTopBeforeAndDuringPress: [b0.top, b1?.top ?? "gone"],
    popoverClosedByThePress: popoverOpen === null,
  })
  if (await pendingPrompt(page)) await press(page, sel).catch(() => {})
}

/* -------------------------------------------------------------- screenshots */
const shot = (name) => path.join(HERE, name)

async function themedRun(browser, theme) {
  const page = await openPage(browser, { theme, label: `run-${theme}` })
  await press(page, '[data-ctl="run"]')
  await waitPrompt(page, 30000)
  await sleep(700)
  await page.screenshot({ path: shot(`agent-operable-${theme}.png`) })
  const aside = await page.$("[data-agent-console]")
  await aside.screenshot({ path: shot(`agent-operable-prompt-${theme}.png`) })
  return page
}

/* ------------------------------------------------------------------- main */
async function main() {
  // E2E_ONLY=webmcp runs just the flagged-Chrome section (one browser), for repeating it cheaply
  if (process.env.E2E_ONLY === "webmcp") return webmcpChecks()
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ARGS, protocolTimeout: 60000 })
  if (process.env.E2E_ONLY === "slow-press") {
    try {
      return await slowPressChecks(await openPage(browser, { label: "slow press" }))
    } finally {
      await browser.close()
    }
  }
  try {
    stubChecks()
    const page = await openPage(browser, { label: "agent page" })
    const w = await q(page, "[data-webmcp]", (el) => el.dataset.webmcp)
    const wText = await q(page, "[data-webmcp]", (el) => el.textContent)
    check("webmcp", "without the flag the page says WebMCP is not available, naming the flag", w === "unavailable" && /chrome:\/\/flags\/#enable-webmcp-testing/.test(wText ?? ""), w)
    const focus = await page.evaluate(() => document.activeElement?.tagName)
    check("page", "nothing on the page holds focus after load", focus === "BODY", focus)
    await snapshotChecks(page)
    await loggingChecks(page)
    await errorChecks(page)
    await popoverChecks(page)
    await tooltipChecks(page)
    await drawerChecks(page)
    await drumChecks(page)
    await inboxChecks(page)
    const holdReset = await holdChecks(page)
    await page.screenshot({ path: shot("agent-operable-done.png") })
    await holdReset()
    await scopeChecks(page)
    await planChecks(page)
    await modalChecks(page)
    await keyboardPageChange(page)
    await pageUiChecks(page)
    await finishRun(page)
    await tryItChecks(page)
    await slowPressChecks(page)
    await page.close()

    // screenshots: light and dark at the first prompt, the console alone, mobile
    const light = await themedRun(browser, "light")
    await light.close()
    const dark = await themedRun(browser, "dark")
    await dark.close()
    const m = await openPage(browser, { width: 390, height: 844, label: "mobile" })
    await press(m, '[data-ctl="run"]')
    await waitPrompt(m, 30000)
    await sleep(800)
    const mo = await m.evaluate(() => {
      const c = document.querySelector("[data-agent-console]").getBoundingClientRect()
      const p = document.querySelector('[data-piece="hold"]').getBoundingClientRect()
      const allow = document.querySelector('[data-answer="allow"]').getBoundingClientRect()
      return { consoleBottom: Math.round(c.bottom), pieceTop: Math.round(p.top), allowVisible: allow.top >= c.top && allow.bottom <= c.bottom, overflowX: document.documentElement.scrollWidth > innerWidth }
    })
    check("mobile", "390 wide: the console with its Allow button and the hold piece below it are both on screen, no sideways scroll", mo.allowVisible && mo.pieceTop >= mo.consoleBottom - 2 && mo.pieceTop < 844 && !mo.overflowX, mo)
    await m.screenshot({ path: shot("agent-operable-mobile.png") })
    await m.close()

    await standaloneChecks(browser)
  } finally {
    await browser.close()
  }
  await webmcpChecks()
  if (ignoredSeen.size) info("errors", "left out: the dev harness's automatic favicon request", [...ignoredSeen])
  check("errors", "no console errors or page errors on any page", errors.length === 0, errors.length ? errors.slice(0, 6) : "none")
}

for (let attempt = 1; attempt <= 3; attempt++) {
  results = []
  out = []
  errors.length = 0
  reloaded = false
  interruption = ""
  try {
    await main()
  } catch (e) {
    if (!reloaded) check("script", "ran to the end", false, e.stack?.split("\n").slice(0, 4).join(" "), "no exception")
  }
  if (reloaded && attempt < 3) {
    console.log(`(a dev-server update interrupted attempt ${attempt}: ${interruption}; discarding it and running again)`)
    continue
  }
  break
}
for (const l of out) console.log(l)
const fails = results.filter((r) => !r.ok).length
console.log(`\n${results.length - fails} passed, ${fails} failed`)
console.log(`screenshots: ${["light", "dark", "mobile", "prompt-light", "prompt-dark", "done"].map((s) => `docs/review/agent-operable-${s}.png`).join(", ")}`)
process.exit(fails ? 1 : 0)

// Behavioural checks for the Glass style: tiers, fallbacks, nesting, style switching. node docs/review/glass-checks.mjs
import puppeteer from "puppeteer-core"
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--disable-renderer-backgrounding"] })
let bad = 0
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!cond) bad++ }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function open(url, { media } = {}) {
  const p = await b.newPage(); await p.setViewport({ width: 1000, height: 800 })
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && !(m.location()?.url ?? "").endsWith("favicon.ico") && errs.push(m.text() + " " + (m.location()?.url ?? "")))
  if (media) await (await p.createCDPSession()).send("Emulation.setEmulatedMedia", { features: media })
  await p.goto(url, { waitUntil: "networkidle0" }); await wait(1200); p.errs = errs; return p
}
const css = (p, sel, prop) => p.evaluate((s, k) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[k] : null }, sel, prop)

// 1. Tier 2 on a floating surface, Tier 1 on a card
let p = await open("http://localhost:5180/preview.html?slug=model-picker&style=glass")
await p.click(".mp-trigger"); await wait(900)
ok("refract flag set (Chromium)", (await p.evaluate(() => document.documentElement.dataset.refract)) === "1")
ok("menu uses url(#pane-glass-menu-l)", (await css(p, ".mp-pop", "backdropFilter"))?.includes("#pane-glass-menu-l"), await css(p, ".mp-pop", "backdropFilter"))
ok("filter exists in DOM and has a painted map", await p.evaluate(() => !!document.querySelector("#pane-glass-menu-l feImage")?.getAttribute("href")?.startsWith("data:image/png")))
ok("no console errors", p.errs.length === 0, p.errs.join(" | ")); await p.close()

// 2. Top-level card refracts with the card map; a card with the refract flag removed falls back to frost
p = await open("http://localhost:5180/preview.html?slug=ai-answer&style=glass")
const bf = await css(p, ".aia", "backdropFilter")
ok("card refracts (url(#pane-glass-card-l))", bf.includes("#pane-glass-card-l"), bf)
await p.evaluate(() => delete document.documentElement.dataset.refract)
const bfFrost = await css(p, ".aia", "backdropFilter")
ok("card without the refract flag is frosted (blur+saturate, no url)", /blur\(22px\)/.test(bfFrost) && !bfFrost.includes("url("), bfFrost)
ok("card tint is translucent", +(((await css(p, ".aia", "backgroundColor")).match(/[\d.]+\)$/) ?? ["1)"])[0].slice(0, -1)) < 0.8, await css(p, ".aia", "backgroundColor")); await p.close()

// 3. Reduced transparency: opaque, no filters, no refract flag
p = await open("http://localhost:5180/preview.html?slug=model-picker&style=glass", { media: [{ name: "prefers-reduced-transparency", value: "reduce" }] })
await p.click(".mp-trigger"); await wait(700)
ok("reduced transparency: no backdrop-filter on menu", (await css(p, ".mp-pop", "backdropFilter")) === "none")
ok("reduced transparency: menu is opaque", /0\.9[5-9]|, 1\)|rgb\(/.test(await css(p, ".mp-pop", "backgroundColor")), await css(p, ".mp-pop", "backgroundColor"))
ok("reduced transparency: no refract flag", (await p.evaluate(() => document.documentElement.dataset.refract)) === undefined); await p.close()

// 4. More contrast
p = await open("http://localhost:5180/preview.html?slug=ai-answer&style=glass", { media: [{ name: "prefers-contrast", value: "more" }] })
ok("prefers-contrast: more -> card has no backdrop-filter", (await css(p, ".aia", "backdropFilter")) === "none"); await p.close()

// 5. Nesting: a menu inside a glass card must not get its own backdrop-filter, and is more opaque
p = await open("http://localhost:5180/preview.html?slug=chat-composer&style=glass")
const info = await p.evaluate(() => { const n = [...document.querySelectorAll(".cc-menu-panel, .cc-body .mp-pop")]; return n.map((e) => ({ cls: e.className, nested: !!e.parentElement.closest(".cc-body"), bf: getComputedStyle(e).backdropFilter })) })
ok("no nested element carries a backdrop-filter", info.every((i) => !i.nested || i.bf === "none"), JSON.stringify(info))
const nested = await p.evaluate(() => [...document.querySelectorAll("*")].filter((e) => { const bf = getComputedStyle(e).backdropFilter; return bf && bf !== "none" && e.parentElement?.closest("*") && [...(function* () { for (let a = e.parentElement; a; a = a.parentElement) yield a })()].some((a) => { const x = getComputedStyle(a).backdropFilter; return x && x !== "none" }) }).map((e) => e.className))
ok("page-wide: zero glass-on-glass pairs", nested.length === 0, nested.join(","))
await p.close()

// 6. Switching style in the gallery turns refraction on and off
p = await open("http://localhost:5180/#/model-picker")
await p.evaluate(() => { localStorage.setItem("pane-style", "classic") })
const flag = () => p.evaluate(() => document.documentElement.dataset.refract)
ok("classic: no refract flag", (await flag()) === undefined)
const click = async (label) => { await p.evaluate((l) => [...document.querySelectorAll('[role="radio"]')].find((e) => e.textContent.trim().startsWith(l))?.click(), label); await wait(500) }
await click("Glass"); ok("switch to Glass sets refract flag", (await flag()) === "1")
await click("Mono"); ok("switch to Mono clears refract flag", (await flag()) === undefined)
await click("Glass"); ok("back to Glass sets it again", (await flag()) === "1")
ok("only three styles offered", (await p.evaluate(() => [...document.querySelectorAll('[aria-label="Style"] [role="radio"]')].map((e) => e.textContent.trim().split(/\s/)[0]))).join() === "Classic,Mono,Glass" , (await p.evaluate(() => [...document.querySelectorAll('[aria-label="Style"] [role="radio"]')].map((e) => e.textContent.trim().split(/\s/)[0]))).join())
await p.close()

// 7. Not Chromium: the gate must be off (fake a UA data without Chromium)
p = await b.newPage(); await p.setViewport({ width: 1000, height: 800 })
await p.evaluateOnNewDocument(() => Object.defineProperty(navigator, "userAgentData", { get: () => ({ brands: [{ brand: "Safari", version: "17" }] }) }))
await p.goto("http://localhost:5180/preview.html?slug=model-picker&style=glass", { waitUntil: "networkidle0" }); await wait(800)
await p.click(".mp-trigger"); await wait(700)
ok("non-Chromium: no refract flag", (await p.evaluate(() => document.documentElement.dataset.refract)) === undefined)
const bf2 = await css(p, ".mp-pop", "backdropFilter")
ok("non-Chromium: menu falls back to frosted blur", /blur\(26px\)/.test(bf2) && !bf2.includes("url("), bf2); await p.close()

// 8. Every glass surface keeps its own text legible: the opaque fallback tint is >= .95
p = await open("http://localhost:5180/preview.html?slug=agent-run&style=glass", { media: [{ name: "prefers-reduced-transparency", value: "reduce" }] })
const alphas = await p.evaluate(() => [...document.querySelectorAll(".as-main, .ai-card")].map((e) => getComputedStyle(e).backgroundColor))
ok("fallback shell tint is opaque", alphas.every((a) => !/ 0\.[0-8]\d*\)$/.test(a)), alphas.join(" | ")); await p.close()

await b.close()
console.log(bad ? `\n${bad} check(s) failed` : "\nall checks passed")
process.exit(bad ? 1 : 0)

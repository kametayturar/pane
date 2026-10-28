// Checks library search: ⌘K palette with a synonym and a typo, the sidebar ranking, a tag page.
import puppeteer from "puppeteer-core"
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--disable-renderer-backgrounding", "--disable-background-timer-throttling"] })
const p = await b.newPage()
await p.setViewport({ width: 1440, height: 900 })
await p.goto("http://localhost:5180/#/browse", { waitUntil: "networkidle0" })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [q, name] of [["modal", "modal"], ["glas", "typo"], ["pricing table", "two-words"]]) {
  await p.click('button[title^="Search everything"]')
  await sleep(300)
  await p.keyboard.type(q)
  await sleep(400)
  const titles = await p.$$eval('#palette-results [role="option"]', (els) => els.slice(0, 6).map((e) => e.textContent.replace(/\s+/g, " ").trim().slice(0, 70)))
  console.log(`"${q}":`, titles)
  await p.screenshot({ path: `/tmp/claude-501/shots/search-${name}.png` })
  await p.keyboard.press("Escape"); await sleep(200)
}
await p.goto("http://localhost:5180/#/tag/glass", { waitUntil: "networkidle0" }); await sleep(800)
console.log("tag page:", await p.$eval("h1", (h) => h.textContent), await p.$eval("main p, h1 + p", (e) => e.textContent).catch(() => ""))
await p.goto("http://localhost:5180/#/model-picker", { waitUntil: "networkidle0" }); await sleep(1200)
console.log("related:", await p.$$eval('[aria-label="Related pieces"] a', (els) => els.map((e) => e.textContent.slice(0, 30))))
await p.evaluate(() => document.querySelector('[aria-label="Related pieces"]')?.scrollIntoView({ block: "center" })); await sleep(500)
await p.screenshot({ path: "/tmp/claude-501/shots/search-related.png" })
await b.close()

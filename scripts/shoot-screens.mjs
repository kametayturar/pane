// Captures a still of each Meridian screen for the gallery: public/screens/<slug>.webp and -dark.
// Needs the dev server (npm run dev -- --port 5180) and puppeteer-core from docs/review/node_modules.
// Run: node scripts/shoot-screens.mjs [slug…]
import { mkdirSync } from "node:fs"
import puppeteer from "../docs/review/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"

const SLUGS = ["mission-control", "research-desk", "agent-workbench", "eval-lab", "task-tracker", "ops-dashboard", "accounting", "finance"]
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : SLUGS
const base = process.env.BASE || "http://localhost:5180"
mkdirSync("public/screens", { recursive: true })
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--disable-renderer-backgrounding", "--disable-background-timer-throttling"],
})
for (const slug of slugs) {
  for (const [style, dark] of [["", false], ["", true]]) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.goto(`${base}/preview.html?slug=${slug}${dark ? "&dark=1" : ""}${style ? `&style=${style}` : ""}`, { waitUntil: "networkidle0" })
    await new Promise((r) => setTimeout(r, 5000))
    const out = `public/screens/${slug}${style ? `-${style}` : ""}${dark ? "-dark" : ""}.webp`
    await page.screenshot({ path: out, type: "webp", quality: 82 })
    console.log(out)
    await page.close()
  }
}
await browser.close()

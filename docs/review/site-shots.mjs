// Screenshots of gallery pages: node docs/review/site-shots.mjs [base] [outDir]
// Each shot: [name, hash, { style, dark, w, h, wait, palette }]
import { mkdirSync } from "node:fs"
import puppeteer from "puppeteer-core"

const base = process.argv[2] ?? "http://localhost:5180"
const out = process.argv[3] ?? "/tmp/claude-501/shots/site"
mkdirSync(out, { recursive: true })
const SHOTS = [
  ["landing", "", { wait: 4500 }],
  ["browse-classic", "#/browse", { wait: 5000 }],
  ["browse-glass", "#/browse", { style: "glass", wait: 5000 }],
  ["browse-glass-dark", "#/browse", { style: "glass", dark: true, wait: 5000 }],
  ["agents-group", "#/browse/Agents", { wait: 5000 }],
  ["approval-page", "#/approval-card", { wait: 4000 }],
  ["orchestrator-glass", "#/agent-orchestrator", { style: "glass", wait: 4000 }],
  ["arena-dark", "#/model-arena", { dark: true, wait: 4000 }],
  ["search-modal", "#/browse", { wait: 3000, palette: "modal" }],
  ["mobile-browse", "#/browse", { w: 390, h: 844, wait: 4000 }],
]
const only = process.env.ONLY?.split(",")
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--disable-renderer-backgrounding", "--disable-background-timer-throttling"],
})
for (const [name, hash, o] of SHOTS) {
  if (only && !only.includes(name)) continue
  const p = await b.newPage()
  await p.setViewport({ width: o.w ?? 1440, height: o.h ?? 900, deviceScaleFactor: o.w ? 2 : 1 })
  await p.evaluateOnNewDocument((style, dark) => {
    localStorage.setItem("pane-style", style)
    localStorage.setItem("pane-theme", dark ? "dark" : "light")
  }, o.style ?? "classic", !!o.dark)
  await p.goto(`${base}/${hash}`, { waitUntil: "networkidle0" })
  await new Promise((r) => setTimeout(r, o.wait ?? 3000))
  if (o.palette) {
    await p.click('button[title^="Search everything"]').catch(() => p.keyboard.down("Meta").then(() => p.keyboard.press("k")))
    await new Promise((r) => setTimeout(r, 400))
    await p.keyboard.type(o.palette, { delay: 40 })
    await new Promise((r) => setTimeout(r, 600))
  }
  await p.screenshot({ path: `${out}/${name}.png` })
  console.log(`${out}/${name}.png`)
  await p.close()
}
await b.close()

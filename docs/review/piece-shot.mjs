// Screenshot one demo or screen alone (dev server on :5180 must be running).
// node docs/review/piece-shot.mjs <slug> [--w 1280] [--h 900] [--dark] [--style glass|mono] [--wait 2800] [--full] [--out file.png]
import puppeteer from "puppeteer-core"
const a = process.argv.slice(2)
const slug = a[0]
const opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d)
const w = +opt("--w", 1280), h = +opt("--h", 900), wait = +opt("--wait", 2800)
const dark = a.includes("--dark"), full = a.includes("--full"), style = opt("--style", "")
const out = opt("--out", `/tmp/claude-501/shots/${slug}-${w}${dark ? "-dark" : ""}${style ? "-" + style : ""}.png`)
const { mkdirSync } = await import("node:fs")
mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true })
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--disable-renderer-backgrounding", "--disable-background-timer-throttling"] })
const p = await b.newPage()
await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
const qs = new URLSearchParams({ slug, ...(dark ? { dark: "1" } : {}), ...(style ? { style } : {}) })
await p.goto(`http://localhost:5180/preview.html?${qs}`, { waitUntil: "networkidle0" })
await new Promise((r) => setTimeout(r, wait))
await p.screenshot({ path: out, fullPage: full })
console.log(out)
await b.close()

// Contrast audit: text colour vs the real pixels behind it (text hidden), Glass vs Classic, light and dark.
// node docs/review/glass-contrast.mjs   (dev server on :5180)
import puppeteer from "puppeteer-core"
const pages = [
  ["gallery browse", "http://localhost:5180/#/browse", "gallery"],
  ["gallery ai-answer", "http://localhost:5180/#/ai-answer", "gallery"],
  ["ai-answer", "preview.html?slug=ai-answer"], ["chat-composer", "preview.html?slug=chat-composer"],
  ["agent-run", "preview.html?slug=agent-run"], ["instrument-pricing", "preview.html?slug=instrument-pricing"],
  ["thinking-state", "preview.html?slug=thinking-state"], ["agent-tasks", "preview.html?slug=agent-tasks"],
  ["tool-call-card", "preview.html?slug=tool-call-card"], ["usage-forecast", "preview.html?slug=usage-forecast"],
  ["permission-request", "preview.html?slug=permission-request"], ["knowledge-base", "preview.html?slug=knowledge-base"],
  ["mission-control", "preview.html?slug=mission-control"], ["command-menu", "preview.html?slug=command-menu"], ["spec-table", "preview.html?slug=spec-table"],
  ["model-picker", "preview.html?slug=model-picker"],
]
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--disable-renderer-backgrounding"] })
const helper = await b.newPage()
await helper.goto("about:blank")
const lum = (r, g, bl) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl) }
const results = {}
const STYLES = process.argv.includes("--glass-only") ? ["glass"] : ["classic", "glass"]
for (const style of STYLES) for (const theme of ["light", "dark"]) {
  const p = await b.newPage()
  await p.setViewport({ width: 1280, height: 900 })
  await p.evaluateOnNewDocument((s, t) => { try { localStorage.setItem("pane-style", s); localStorage.setItem("pane-theme", t) } catch {} }, style, theme)
  for (const [name, u] of pages) {
    const url = u.startsWith("http") ? u : `http://localhost:5180/${u}&style=${style === "classic" ? "" : style}${theme === "dark" ? "&dark=1" : ""}`
    await p.goto("about:blank"); await p.goto(url, { waitUntil: "networkidle0" }); await new Promise((r) => setTimeout(r, 4500))
    const texts = await p.evaluate(() => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true })
      const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
      const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim()) continue
        const el = n.parentElement; if (!el || el.closest("script,style,svg")) continue
        const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue
        let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity
        if (op < 0.9) continue // mid-animation or deliberately faded
        const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect()
        if (b.width < 4 || b.height < 6 || b.bottom < 0 || b.top > innerHeight || b.right < 0 || b.left > innerWidth) continue
        out.push({ t: n.textContent.trim().slice(0, 28), x: b.left, y: b.top, w: b.width, h: b.height, c: rgba(cs.color), size: parseFloat(cs.fontSize), bold: +cs.fontWeight >= 700 })
      }
      return out
    })
    await p.addStyleTag({ content: "*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}" })
    await new Promise((r) => setTimeout(r, 200))
    const png = await p.screenshot({ encoding: "base64" })
    const rows = await helper.evaluate(async (png, texts) => {
      const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode()
      const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height
      const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(img, 0, 0)
      const L = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      return texts.map((t) => {
        const x = Math.max(0, Math.floor(t.x)), y = Math.max(0, Math.floor(t.y)), w = Math.max(1, Math.min(img.width - x, Math.ceil(t.w))), h = Math.max(1, Math.min(img.height - y, Math.ceil(t.h)))
        const d = cx.getImageData(x, y, w, h).data; const cs = []
        for (let i = 0; i < d.length; i += 4 * 3) {
          const a = t.c[3]; const R = t.c[0] * a + d[i] * (1 - a), G = t.c[1] * a + d[i + 1] * (1 - a), B = t.c[2] * a + d[i + 2] * (1 - a)
          const l1 = L(R, G, B), l2 = L(d[i], d[i + 1], d[i + 2]); cs.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))
        }
        cs.sort((p, q) => p - q); return { ...t, ratio: cs[Math.floor(cs.length * 0.1)] ?? 21 }
      })
    }, png, texts)
    const large = (r) => r.size >= 24 || (r.size >= 18.66 && r.bold)
    const fails = rows.filter((r) => r.ratio < (large(r) ? 3 : 4.5))
    results[`${style}-${theme}-${name}`] = { n: rows.length, fails: fails.length, worst: fails.sort((a, b) => a.ratio - b.ratio).slice(0, 4).map((r) => `${r.t}|${r.ratio.toFixed(2)}`) }
  }
  await p.close()
}
await b.close()
console.log("page | classic light fail/n | glass light fail/n | classic dark | glass dark")
for (const [name] of pages) {
  const f = (s, t) => { const r = results[`${s}-${t}-${name}`]; return r ? `${r.fails}/${r.n}` : "-" }
  console.log(`${name.padEnd(22)} ${f("classic", "light").padStart(8)} ${f("glass", "light").padStart(8)}   ${f("classic", "dark").padStart(8)} ${f("glass", "dark").padStart(8)}`)
}
console.log("\nWorst glass cases:")
// --floor N: a Glass-only floor test. Fails (exit 1) if any page has more than N text nodes under 4.5:1 (3:1 for large text).
const floorArg = process.argv.indexOf("--floor")
if (floorArg > -1) {
  const limit = +process.argv[floorArg + 1]
  const over = Object.entries(results).filter(([k, v]) => k.startsWith("glass") && v.fails > limit)
  for (const [k, v] of over) console.log(`FLOOR FAIL ${k}: ${v.fails} of ${v.n} text nodes under AA (limit ${limit})`)
  if (over.length) process.exitCode = 1
}
for (const [k, v] of Object.entries(results)) if (k.startsWith("glass") && v.worst.length) console.log(k, v.worst.join("  "))

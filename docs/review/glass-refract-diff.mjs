// Does refraction show? Shoots a glass surface with <html data-refract> on and off and counts the pixels that change inside the
// surface's edge band (outer 44px) and in its middle. node docs/review/glass-refract-diff.mjs   (dev server on :5180)
import puppeteer from "puppeteer-core"
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--disable-renderer-backgrounding"] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const helper = await b.newPage(); await helper.goto("about:blank")
let bad = 0
const cases = [
  ["menu (model-picker)", "model-picker", ".mp-pop", ".mp-trigger"],
  ["card (ai-answer)", "ai-answer", ".aia", null],
  ["composer (chat-composer)", "chat-composer", ".cc-body", null],
  ["command palette", "command-menu", ".cm-card", null],
]
for (const dark of [false, true]) for (const [name, slug, sel, click] of cases) {
  const p = await b.newPage(); await p.setViewport({ width: 1100, height: 800 })
  await p.goto(`http://localhost:5180/preview.html?slug=${slug}&style=glass${dark ? "&dark=1" : ""}`, { waitUntil: "networkidle0" }); await wait(1500)
  if (click) { await p.click(click); await wait(900) }
  const box = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }, sel)
  if (!box) { console.log(`SKIP  ${name}: ${sel} not found`); await p.close(); continue }
  const shot = async () => await p.screenshot({ clip: { x: box.x, y: box.y, width: box.w, height: box.h }, encoding: "base64" })
  const on = await shot()
  await p.evaluate(() => delete document.documentElement.dataset.refract); await wait(400)
  const off = await shot()
  const { rim, rimN, mid, midN, maxd } = await helper.evaluate(async (A, B, w, h) => {
    const load = async (b64) => { const im = new Image(); im.src = "data:image/png;base64," + b64; await im.decode(); const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0); return { d: x.getImageData(0, 0, im.width, im.height).data, w: im.width } }
    const a = await load(A), b = await load(B)
    let rim = 0, rimN = 0, mid = 0, midN = 0, maxd = 0
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * a.w + x) * 4
      const d = Math.max(Math.abs(a.d[i] - b.d[i]), Math.abs(a.d[i + 1] - b.d[i + 1]), Math.abs(a.d[i + 2] - b.d[i + 2]))
      if (Math.min(x, y, w - 1 - x, h - 1 - y) < 44) { rimN++; if (d >= 12) rim++ } else { midN++; if (d >= 12) mid++ }
      if (d > maxd) maxd = d
    }
    return { rim, rimN, mid, midN, maxd }
  }, on, off, box.w, box.h)
  const pct = (a, n) => ((100 * a) / Math.max(1, n)).toFixed(2)
  const pass = +pct(rim, rimN) >= 1.5 // the edge band must visibly change
  if (!pass) bad++
  console.log(`${pass ? "PASS" : "FAIL"}  ${dark ? "dark " : "light"} ${name.padEnd(26)} ${box.w}x${box.h}  edge band changed ${pct(rim, rimN)}%  middle ${pct(mid, midN)}%  max delta ${maxd}`)
  await p.close()
}
await b.close()
process.exit(bad ? 1 : 0)

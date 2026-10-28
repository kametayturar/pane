// Shoot every demo in Glass and tile them into contact sheets: node docs/review/glass-sweep.mjs [--dark] [--style glass]
// Output: /tmp/claude-501/shots/sweep/<style>-<theme>/<slug>.png and sheet-N.png (12 per sheet). Needs python3 + Pillow for the sheets.
import puppeteer from "puppeteer-core"
import { mkdirSync, readdirSync } from "node:fs"
import { execFileSync } from "node:child_process"
const a = process.argv.slice(2)
const dark = a.includes("--dark"), style = a.includes("--style") ? a[a.indexOf("--style") + 1] : "glass"
const dir = `/tmp/claude-501/shots/sweep/${style}-${dark ? "dark" : "light"}`
mkdirSync(dir, { recursive: true })
const slugs = readdirSync("src/demos").filter((f) => f.endsWith(".demo.tsx")).map((f) => f.replace(".demo.tsx", "")).sort()
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--disable-renderer-backgrounding"] })
const errors = []
let i = 0
await Promise.all([0, 1, 2, 3].map(async () => {
  const p = await b.newPage()
  await p.setViewport({ width: 760, height: 560, deviceScaleFactor: 1 })
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`))
  while (i < slugs.length) {
    const slug = slugs[i++]
    try {
      await p.goto(`http://localhost:5180/preview.html?slug=${slug}&style=${style}${dark ? "&dark=1" : ""}`, { waitUntil: "networkidle0", timeout: 20000 })
      await new Promise((r) => setTimeout(r, 1300))
      await p.screenshot({ path: `${dir}/${slug}.png` })
    } catch (e) { errors.push(`${slug}: ${e.message}`) }
  }
}))
await b.close()
console.log(`shot ${slugs.length}; errors: ${errors.length}`)
errors.slice(0, 20).forEach((e) => console.log(e))
execFileSync("python3", ["-c", `
from PIL import Image, ImageDraw
import glob, os
d="${dir}"
fs=sorted(f for f in glob.glob(d+"/*.png") if not os.path.basename(f).startswith("sheet"))
for n in range(0,len(fs),12):
    sheet=Image.new("RGB",(4*480,3*360),"white")
    for k,f in enumerate(fs[n:n+12]):
        im=Image.open(f).convert("RGB").resize((480,360))
        ImageDraw.Draw(im).text((6,4),os.path.basename(f)[:-4],fill=(255,0,0))
        sheet.paste(im,((k%4)*480,(k//4)*360))
    sheet.save(f"{d}/sheet-{n//12:02d}.png")
`])

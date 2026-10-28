// Screenshots every skill-lab page (baseline + each skill's run) and writes public/skill-lab/index.json,
// which the Skills page reads. Run after the lab agents finish:  node scripts/build-skill-lab.mjs
// Needs Google Chrome and puppeteer-core (docs/review/node_modules – see docs/review/shoot.mjs).
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const LAB = path.join(ROOT, "public/skill-lab")
const THUMBS = path.join(LAB, "_thumbs")
const { default: puppeteer } = await import(pathToFileURL(path.join(ROOT, "docs/review/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js")).href)

// Prompt text and a short label for each prompt id (kept in sync with docs/skill-lab-brief.md).
const PROMPTS = {
  "web-1": ["Landing hero", "Build a landing page hero plus a three-item features section for Tidewater."],
  "web-2": ["Pricing", "Build a pricing section with three plans – Solo $19, Clinic $49, Group $129 per month – each with a feature list, plus a monthly/yearly toggle (yearly saves 20%)."],
  "web-3": ["Signup form", "Build a signup form: full name, work email, password, clinic size, accept terms, a submit button, and visible validation errors."],
  "motion-1": ["Toast", "Build a toast notification ('Appointment booked for Tue 10:30') that slides in, waits, and dismisses; loop it."],
  "motion-2": ["Dropdown", "Build a dropdown menu (Reschedule, Duplicate, Send reminder, Cancel appointment) that opens and closes on a loop."],
  "motion-3": ["Task list", "Build a small task list where tasks are added, checked off and removed; auto-play the sequence on a loop."],
  "copy-1": ["Import states", "Write the empty state, an upload error and a success message for Tidewater's 'Import patients from CSV' feature."],
  "copy-2": ["Welcome email", "Write the welcome email a new Tidewater clinic admin receives after signing up."],
  "copy-3": ["Landing copy", "Write the landing page headline, subheadline and three feature blurbs for Tidewater."],
  "data-1": ["Accounts per plan", "Visualise paying accounts per plan over the year."],
  "data-2": ["Churn summary", "Make a one-slide summary explaining why churn rose in Q3."],
  "data-3": ["Support KPIs", "Build a small KPI dashboard for the support team."],
  "3d-1": ["3D hero", "Build a landing hero with an animated 3D object that represents 'calm scheduling'."],
  "3d-2": ["Particle scene", "Build a scroll- or time-driven 3D particle scene behind the headline 'Every appointment, in its place'."],
  "poster-1": ["Jazz poster", "Make a poster for a late-night jazz concert series called 'Blue Hour'."],
  "poster-2": ["Marathon poster", "Make a poster for a city marathon."],
  "poster-3": ["Maps exhibition", "Make a poster for an exhibition about the history of maps."],
  "perf-1": ["Speed up a component", "Make this React dashboard component faster. Show the changed code and explain the impact."],
  "perf-2": ["Audit a page", "Audit this landing page for performance, accessibility and SEO, then fix the top issues."],
  "browser-1": ["Test a signup flow", "Test the signup flow: submit it with an invalid email, then with valid data, and report what happens with evidence."],
  "browser-2": ["Find a bug", "The 'Book appointment' button does nothing. Find out why and report the cause with evidence."],
  "video-1": ["Teaser video", "Make a 6-second 1280×720 MP4 teaser for Tidewater: title, three feature beats, end card."],
  "video-2": ["Slack GIF", "Turn this screen recording into a looping GIF for Slack: under 2 MB, smooth and readable."],
  "video-3": ["Lottie loader", "Make a small looping 'loading' animation for Tidewater as a Lottie JSON file."],
  "mcp-1": ["MCP server", "Build an MCP server for Tidewater appointments from an OpenAPI spec. Run it and show the tool list and one real tool call."],
}
const waitFor = (id) => (id.startsWith("motion") ? 1300 : id.startsWith("3d") ? 2600 : id.startsWith("video") ? 2200 : 700)

const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--hide-scrollbars", "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--enable-unsafe-swiftshader"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

const force = process.argv.includes("--force")
async function shoot(htmlFile, outFile, promptId) {
  if (!force && existsSync(outFile) && statSync(outFile).mtimeMs > statSync(htmlFile).mtimeMs) return true
  mkdirSync(path.dirname(outFile), { recursive: true })
  try {
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: "networkidle0", timeout: 20000 })
    await new Promise((r) => setTimeout(r, waitFor(promptId)))
    await page.screenshot({ path: outFile, type: "webp", quality: 72 })
    return true
  } catch (e) {
    console.warn("skip", path.relative(ROOT, htmlFile), String(e.message).slice(0, 80))
    return false
  }
}

const rel = (f) => "/" + path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/")
const index = { generated: new Date().toISOString(), prompts: Object.fromEntries(Object.entries(PROMPTS).map(([k, [label, text]]) => [k, { label, text }])), skills: {} }

for (const dir of readdirSync(LAB).filter((d) => !d.startsWith("_") && statSync(path.join(LAB, d)).isDirectory()).sort()) {
  const manifestFile = path.join(LAB, dir, "manifest.json")
  if (!existsSync(manifestFile)) continue
  let m
  try {
    m = JSON.parse(readFileSync(manifestFile, "utf8"))
  } catch {
    console.warn("bad manifest", dir)
    continue
  }
  const examples = []
  for (const ex of m.examples ?? []) {
    const id = ex.prompt
    const after = path.join(LAB, dir, `${id}.html`)
    const before = path.join(LAB, "_baseline", `${id}.html`)
    if (!PROMPTS[id] || !existsSync(after)) continue
    const afterThumb = path.join(THUMBS, dir, `${id}.webp`)
    const beforeThumb = path.join(THUMBS, "_baseline", `${id}.webp`)
    const okAfter = await shoot(after, afterThumb, id)
    const okBefore = existsSync(before) && (await shoot(before, beforeThumb, id))
    if (!okAfter) continue
    examples.push({
      prompt: id,
      after: rel(after),
      afterThumb: rel(afterThumb),
      before: okBefore ? rel(before) : null,
      beforeThumb: okBefore ? rel(beforeThumb) : null,
      changes: (ex.changes ?? []).slice(0, 6),
    })
  }
  if (examples.length) index.skills[m.id ?? dir] = { skillSays: (m.skillSays ?? []).slice(0, 7), examples }
  console.log(dir, examples.length, "examples")
}

await browser.close()
writeFileSync(path.join(LAB, "index.json"), JSON.stringify(index, null, 2) + "\n")
console.log("wrote public/skill-lab/index.json –", Object.keys(index.skills).length, "skills")

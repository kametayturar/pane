// Renders one skill-lab run (code / terminal / media output) as a self-contained HTML report.
// Both the baseline and the skill runs use this, so the comparison is about content, not presentation.
//
//   node docs/skill-lab/report.mjs <run.json> <out.html>
//
// run.json:
// {
//   "result":  "Plain-text summary of what was delivered (paragraphs separated by blank lines).",
//   "media":   [{ "type": "video" | "image" | "lottie", "src": "relative/path/next/to/out.html", "caption": "…" }],
//   "steps":   [{ "cmd": "the exact command that was run", "output": "its real output (trim long output, keep it honest)", "note": "optional one-line why" }],
//   "files":   [{ "name": "src/server.ts", "code": "full file contents" }]
// }
import { readFileSync, writeFileSync } from "node:fs"

const [, , input, out] = process.argv
if (!input || !out) {
  console.error("usage: node docs/skill-lab/report.mjs <run.json> <out.html>")
  process.exit(1)
}
const run = JSON.parse(readFileSync(input, "utf8"))
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Tiny, language-agnostic highlighter: strings, comments, numbers, keywords.
const KW = /\b(import|from|export|default|const|let|var|function|async|await|return|if|else|for|while|new|class|type|interface|extends|try|catch|throw|true|false|null|undefined|def|with|as|in|of|yield|lambda|None|True|False|server|tool)\b/g
function highlight(code) {
  return esc(code)
    .split("\n")
    .map((line) => {
      if (/^\s*(\/\/|#)/.test(line)) return `<span class="c">${line}</span>`
      return line
        .replace(/(&quot;|"|'|`)(.*?)\1/g, '<span class="s">$&</span>')
        .replace(KW, '<span class="k">$1</span>')
        .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="n">$1</span>')
    })
    .join("\n")
}

function media(m) {
  const cap = m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""
  if (m.type === "video") return `<figure><video src="${esc(m.src)}" autoplay muted loop playsinline controls></video>${cap}</figure>`
  if (m.type === "lottie")
    return `<figure><div class="lottie" data-src="${esc(m.src)}"></div>${cap}</figure>`
  return `<figure><img src="${esc(m.src)}" alt="${esc(m.caption ?? "")}">${cap}</figure>`
}

const hasLottie = (run.media ?? []).some((m) => m.type === "lottie")
const steps = run.steps ?? []
const files = run.files ?? []

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Run report</title>
<style>
:root{--ink:#16181d;--muted:#6b7280;--line:#e7e8ec;--bg:#f7f7f8;--term:#0f1115}
*{box-sizing:border-box}body{margin:0;font:14px/1.55 Inter,ui-sans-serif,system-ui,sans-serif;color:var(--ink);background:var(--bg)}
main{max-width:1180px;margin:0 auto;padding:28px 32px 48px}
h2{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600;margin:28px 0 10px}
.result{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;white-space:pre-wrap}
.media{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
figure{margin:0;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden}
figure img,figure video{display:block;width:100%;height:auto;background:#000}
.lottie{width:100%;aspect-ratio:16/10;background:#fff}
figcaption{padding:8px 12px;font-size:12.5px;color:var(--muted);border-top:1px solid var(--line)}
.term{background:var(--term);color:#d7dae0;border-radius:12px;padding:6px 0;font:12.5px/1.6 "JetBrains Mono",ui-monospace,Menlo,monospace;overflow:auto}
.step{padding:10px 16px;border-bottom:1px solid #1c1f26}.step:last-child{border:0}
.cmd{color:#8be9b0;white-space:pre-wrap}.cmd::before{content:"$ ";color:#5c6370}.note{color:#7f8794;font-style:italic;margin-bottom:2px}
.out{color:#c4c8d0;white-space:pre-wrap;margin-top:4px;max-height:280px;overflow:auto}
details{background:#fff;border:1px solid var(--line);border-radius:12px;margin-bottom:10px;overflow:hidden}
summary{cursor:pointer;padding:10px 14px;font:500 13px ui-monospace,Menlo,monospace}
pre{margin:0;padding:12px 14px;background:#fbfbfc;border-top:1px solid var(--line);overflow:auto;font:12.5px/1.6 ui-monospace,Menlo,monospace;max-height:520px}
.k{color:#7c3aed}.s{color:#0f766e}.c{color:#9ca3af;font-style:italic}.n{color:#b45309}
</style>
${hasLottie ? '<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>' : ""}
</head><body><main>
${run.media?.length ? `<h2>Output</h2><div class="media">${run.media.map(media).join("")}</div>` : ""}
<h2>Result</h2><div class="result">${esc(run.result ?? "")}</div>
${steps.length ? `<h2>Terminal</h2><div class="term">${steps.map((s) => `<div class="step">${s.note ? `<div class="note"># ${esc(s.note)}</div>` : ""}<div class="cmd">${esc(s.cmd)}</div>${s.output ? `<div class="out">${esc(s.output)}</div>` : ""}</div>`).join("")}</div>` : ""}
${files.length ? `<h2>Files</h2>${files.map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.name)}</summary><pre>${highlight(f.code)}</pre></details>`).join("")}` : ""}
</main>
${hasLottie ? `<script>document.querySelectorAll(".lottie").forEach(el=>lottie.loadAnimation({container:el,renderer:"svg",loop:true,autoplay:true,path:el.dataset.src}))</script>` : ""}
</body></html>
`
writeFileSync(out, html)
console.log("wrote", out)

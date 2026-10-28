// Dev-only harness: renders one demo or screen alone, for headless screenshots.
// http://localhost:5180/preview.html?slug=<slug>[&dark=1]
import * as React from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./styles.css"
import { GlassDefs } from "./glass-defs"

const demos = import.meta.glob("./demos/*.demo.tsx") as Record<string, () => Promise<{ default: React.ComponentType }>>
const screens = import.meta.glob("./components/screens/*.tsx") as Record<string, () => Promise<Record<string, unknown>>>

const params = new URLSearchParams(location.search)
const slug = params.get("slug") ?? ""
if (params.get("dark")) document.documentElement.classList.add("dark")
if (params.get("style")) document.documentElement.dataset.style = params.get("style")!

async function load(): Promise<{ C: React.ComponentType; screen: boolean }> {
  const demo = demos[`./demos/${slug}.demo.tsx`]
  if (demo) return { C: (await demo()).default, screen: false }
  const scr = screens[`./components/screens/${slug}.tsx`]
  if (scr) {
    const mod = await scr()
    const C = Object.entries(mod).find(([k, v]) => /^[A-Z]/.test(k) && typeof v === "function")?.[1] as React.ComponentType
    return { C, screen: true }
  }
  return { C: () => <p style={{ padding: 24 }}>No demo or screen named “{slug}”.</p>, screen: false }
}

load().then(({ C, screen }) => {
  createRoot(document.getElementById("root")!).render(
    <>
      {screen ? (
        <div className="preview-root h-dvh">
          <C />
        </div>
      ) : (
        <div className="preview-root min-h-dvh bg-white p-6 sm:p-10 dark:bg-neutral-950">
          <C />
        </div>
      )}
      <GlassDefs />
    </>,
  )
})

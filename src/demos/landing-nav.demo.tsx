import { LandingNav } from "@/components/blocks/landing-nav"

export const notes = [
  "The bar is `position: sticky` and listens to the nearest scrolling ancestor (it walks up the tree for `overflow-y: auto | scroll`, falling back to the window), so it behaves the same on a real page and inside a builder frame. Past 8px of scroll it sets `data-scrolled`, and one 280ms transition on `background-color` and a `0 1px 0` box-shadow hairline does the rest.",
  "The fold is a container query on the header (`container: lnv / inline-size`), not a media query: below 720px of the bar's own width the centred links and the text link hide and a menu button appears, so a narrow preview frame folds even on a wide screen.",
  "The menu is a disclosure, not a modal: the button carries `aria-expanded` and `aria-controls`, focus moves to the first link on open, Escape or a pointer press outside the header closes it, and Escape returns focus to the button. Focus leaving the header closes it too, so Tab never strands an open panel.",
  'The arrival is three parts (brand, links, actions) rising 12px with a 70ms stagger. A layout effect sets `data-reveal="wait"` before first paint and an IntersectionObserver flips it to `in` once, so transitions (not keyframes) run and a resize never replays them. Reduced motion skips it entirely.',
  'The theme toggle draws both icons and lets CSS pick one from the `.dark` / `[data-theme="dark"]` ancestor, so it is right on first paint without reading the theme in JavaScript.',
]

function toggleTheme() {
  document.documentElement.classList.toggle("dark")
}

function Page({ title, muted }: { title: string; muted: string }) {
  return (
    <div className="mx-auto px-6 pt-14 pb-24 sm:pt-20" style={{ maxWidth: 1248 }}>
      <h1 className="max-w-[18ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.025em] text-neutral-900 sm:text-[48px] dark:text-white">
        {title} <span className="text-neutral-400 dark:text-neutral-500">{muted}</span>
      </h1>
      <p className="mt-5 max-w-[52ch] text-[15px] leading-6 text-neutral-500 dark:text-neutral-400">
        Scroll this frame. Once the page moves, the bar picks up a hairline and a solid background, and stays on top.
      </p>
      <div className="mt-12 flex flex-wrap gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-black/[0.035] dark:bg-white/[0.05]" style={{ flex: "1 1 180px" }} />
        ))}
      </div>
      <div className="mt-4 h-72 rounded-2xl bg-black/[0.035] dark:bg-white/[0.05]" />
    </div>
  )
}

const frame = "relative w-full overflow-y-auto rounded-xl bg-white ring-1 ring-black/10 dark:bg-neutral-950 dark:ring-white/10 lnd-frame"

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-8">
      <style href="landing-nav-demo" precedence="default">{`html[data-style="glass"] .lnd-frame { background: transparent }`}</style>
      <div className={frame} style={{ height: 440 }} data-lnv-frame="default">
        <LandingNav onToggleTheme={toggleTheme} />
        <Page title="Answer every ticket the same day." muted="Atlas drafts the replies." />
      </div>

      <div className={`${frame} max-w-[420px]`} style={{ height: 520 }} data-lnv-frame="narrow">
        <LandingNav
          brand="Northwind"
          links={[
            { label: "Agents", href: "#agents" },
            { label: "Customers", href: "#customers" },
            { label: "Pricing", href: "#pricing" },
            { label: "Docs", href: "#docs" },
            { label: "Blog", href: "#blog" },
          ]}
          current="#pricing"
          textLink={{ label: "Log in", href: "#login" }}
          action={{ label: "Book a demo", href: "#demo" }}
        />
        <Page title="Sage sorts the queue." muted="You decide who answers." />
      </div>
    </div>
  )
}

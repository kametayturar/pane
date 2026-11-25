import { LandingFeatureGrid, type LandingFeature } from "@/components/blocks/landing-feature-grid"

export const notes = [
  "The rules are box-shadows the cells draw on themselves: every cell owns its bottom rule and, unless it sits in the first column, its left rule, so each line has exactly one owner and nothing doubles. Which cell is first in its column comes from `:nth-child(3n+1)`-style selectors written once per column count.",
  "The column count follows the section's own width with container queries (two from 560px, the full count from 860px or 1000px), so the grid collapses the same way inside a narrow builder frame as on a phone. The rule selectors are generated per count and scoped to those ranges, so they never have to undo each other.",
  "A short last row closes its last cell on the right. When a wide row follows, the last row is found with a quantity query (`:nth-child(3n+1):nth-last-child(-n+3)` and its following siblings) and drops its bottom rules, because the wide row's full-width top rule takes their place, empty slots included.",
  "A linked cell is one link: the title's `<a>` stretches a `::before` over the whole cell and draws its focus ring with `::after`, inset from the cell's own padding so it wraps the content evenly in every column. Hover and focus darken the title and slide in a 14px arrow; cells without `href` have no hover state.",
  "Arrival is an IntersectionObserver that sets `data-reveal` on the section once: before first paint the parts are hidden (a layout effect, so nothing flashes), then each rises 14px and fades with a 70ms stagger taken from its reading-order index. Reduced motion never arms it.",
]

const SEVEN: LandingFeature[] = [
  { icon: "bolt", title: "Answers in seconds.", text: "Atlas drafts a reply as the message arrives, using your past answers as the guide." },
  { icon: "lock", title: "Private by default.", text: "Each workspace is sealed. Nothing is used to train a model you do not own." },
  { icon: "calendar", title: "Booking built in.", text: "Customers pick a slot from your real calendar without leaving the thread." },
  { icon: "mail", title: "Email that threads.", text: "Replies stay in one conversation, however many people the customer copies in." },
  { icon: "search", title: "Find anything.", text: "Search every message, file and note across Northwind's workspaces at once." },
  { icon: "workflow", title: "Hand-offs that hold.", text: "Assign a thread to a colleague and its history, files and drafts go with it." },
  { icon: "key", title: "Single sign-on.", text: "Sign in with your company account and remove access in one place when people leave." },
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <LandingFeatureGrid />
      <LandingFeatureGrid
        title="Built for the busy week."
        titleMuted="Quiet the rest of the time."
        columns={4}
        features={SEVEN}
        wide={null}
      />
    </div>
  )
}

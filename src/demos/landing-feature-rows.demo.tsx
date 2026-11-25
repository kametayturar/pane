import { LandingFeatureRows, type LandingFeatureRow } from "@/components/blocks/landing-feature-rows"

export const notes = [
  "Each row is its own `<section aria-labelledby>`. An IntersectionObserver marks it seen once; the text parts then lose `opacity: 0; translateY(14px)` through one transition each, with `transition-delay` stepping 70ms per part, and the media panel follows after the last part. The hidden state only applies after mount (`data-armed`), so server-rendered or script-less pages show everything.",
  "Sides alternate from `start` with a container query on the section: under 820px of its own width the grid is one column and the panel always follows the text, so it also holds inside the builder's narrower frame.",
  "The panel's dots are one `radial-gradient` tile tinted from the accent, faded towards the middle by a radial `mask-image` on a pseudo-element, so the mask never touches the mock (glass inside it keeps its backdrop).",
  "Each mock waits for its own panel to be on screen. Chat: the question rises in, then the answer's words fade in from a 4px blur on a fixed 55ms pace, all CSS delays from one `--lfr-play` variable. Report: one rAF clock counts four rows in turn and the total last, under a rule that draws in; a timeout lands the real numbers even if frames never come. List: a timer walks one highlight down by `translateY`, ticking each row as it leaves.",
  "Reduced motion, or `reveal={false}` for the arrival, shows the finished frame: every word written, every number final, every row ticked.",
]

const VARIANT: LandingFeatureRow[] = [
  {
    title: "Every request lands\nin one calm inbox.",
    body: "Sage sorts what comes in from email, chat and forms, and Atlas drafts a first reply so nobody starts from a blank page.",
    points: ["Groups duplicates into one thread", "Suggests the right owner", "Learns your tone from past replies", "Never sends without a person"],
    link: { label: "Tour the inbox", href: "#inbox" },
    mock: "list",
    mockText: {
      title: "Today",
      note: "Northwind support",
      lines: ["Refund for order 4471", "Login loop on mobile", "Change of delivery address", "Bulk export request", "Feedback on onboarding"],
    },
  },
  {
    title: "Replies customers\ncan act on.",
    body: "Each draft quotes the order, the policy and the date, so customers get the full answer the first time.",
    link: { label: "Read the case study", href: "#case" },
    mock: "chat",
    mockText: {
      title: "Atlas",
      note: "Draft",
      question: "Can I still return the lamp I bought?",
      lines: ["Yes, you have until 14 April to return it.", "I've added a prepaid label to this reply.", "Your refund starts once it is scanned."],
      placeholder: "Edit the draft",
    },
  },
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <div className="w-full overflow-hidden rounded-[4px] ring-1 ring-black/10 dark:ring-white/10">
        <LandingFeatureRows />
      </div>
      <div>
        <p className="mb-3 text-[13px] text-neutral-500 dark:text-neutral-400">Media on the left first, soft band on alternate rows, muted second line</p>
        <div className="w-full overflow-hidden rounded-[4px] ring-1 ring-black/10 dark:ring-white/10">
          <LandingFeatureRows rows={VARIANT} start="media-left" band mutedSecondLine />
        </div>
      </div>
    </div>
  )
}

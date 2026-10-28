import * as React from "react"

import { Folio, type FolioFeature, type FolioPanel } from "@/components/ui/folio"

export const notes = [
  "Each panel is a hinged leaf. The folding is two registered CSS numbers, --ifo-k1 and --ifo-k2 (@property syntax \"<number>\"), one per hinge. Flipping data-open on the root changes them from 0 to 1 and the browser transitions them, so one attribute drives every angle and the whole thing stays interruptible.",
  "The panel you click is the one that stays flat; its neighbours are hinged to its edges. A leaf one hinge away rotates with rotateY() about the edge it shares with the selected leaf (transform-origin: 0 or 100%). A leaf two hinges away is carried by that first hinge with translate3d(lw * (cos(a) - 1), 0, -lw * sin(a)), then rotated by the difference of the two angles, so the edges stay joined all the way through the swing. CSS cos() and sin() do the trigonometry, and browsers without them still fold the near leaves.",
  "The swing uses a slow-fast-slow curve and the second hinge follows 160ms behind, so the fold visibly ripples away from the clicked panel; folding reverses the order. The leaves also shrink and the lane scales up by 20% as k1 goes to 1, so a folded folio fills its plate instead of sitting small in it.",
  "The rows and the folded cover cross-fade on overlapping ranges of the same hinge number (rows are gone at k = .55, the cover is full at k = .61), so a turning leaf is never empty. Both blur a little as they fade. Everything else, the fold shadow, the shade of a leaf turning away and the heights, reads the same two numbers.",
  "One ring glides to the selected leaf, and every other leaf is read as a difference from it (\"2.3x faster\", \"+1 level\"), written as words next to a colour. Reduced motion zeroes the angle, the slide and the zoom and leaves only the cross-fade. The first unfold waits for an IntersectionObserver and starts 320ms later, until then the folio rests folded.",
]

/* ---- second scene: plans, driven by typed props ---- */

const PLAN_FEATURES: FolioFeature[] = [
  { id: "seats", label: "Seats", detail: "people who can sign in", better: "higher", moreWord: "more", lessWord: "fewer" },
  { id: "runs", label: "Agent runs", detail: "every month", better: "higher", moreWord: "more", lessWord: "fewer" },
  { id: "history", label: "Run history", detail: "kept for", better: "higher", moreWord: "longer", lessWord: "shorter" },
  { id: "approvals", label: "Approvals", detail: "where people sign off" },
  { id: "support", label: "Support", detail: "first answer within" },
  { id: "price", label: "Per month", detail: "billed monthly", better: "lower", moreWord: "pricier", lessWord: "cheaper" },
]

const PLANS: FolioPanel[] = [
  {
    id: "solo",
    name: "Solo",
    tagline: "One person, one desk",
    hero: { value: "$19", label: "a month" },
    values: {
      seats: { text: "1", amount: 1 },
      runs: { text: "2,000", amount: 2000 },
      history: { text: "7 days", amount: 7 },
      approvals: { text: "Email", note: "one approver" },
      support: { text: "Community", note: "no set time" },
      price: { text: "$19", amount: 19 },
    },
    consequence: "Solo is $19 a month. Runs stop at 2,000 and wait for the 1st; nothing is billed extra.",
    confirmation: "Meridian Labs is on Solo. Billed $19 on 1 November.",
  },
  {
    id: "team",
    name: "Team",
    tagline: "Where most labs land",
    badge: "Most popular",
    hero: { value: "$79", label: "a month" },
    values: {
      seats: { text: "10", amount: 10 },
      runs: { text: "25,000", amount: 25000 },
      history: { text: "90 days", amount: 90 },
      approvals: { text: "Slack + email", note: "any approver" },
      support: { text: "1 workday", note: "by email" },
      price: { text: "$79", amount: 79 },
    },
    consequence: "Team is $79 a month. Ten people can approve runs from Slack, and 90 days of history stay searchable.",
    confirmation: "Meridian Labs is on Team. Billed $79 on 1 November; invite up to 9 colleagues.",
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For several teams",
    hero: { value: "$249", label: "a month" },
    values: {
      seats: { text: "50", amount: 50 },
      runs: { text: "150,000", amount: 150000 },
      history: { text: "1 year", amount: 365 },
      approvals: { text: "Any channel", note: "audit log" },
      support: { text: "4 hours", note: "chat and email" },
      price: { text: "$249", amount: 249 },
    },
    consequence: "Studio is $249 a month. Every approval is written to an audit log you can export for reviews.",
    confirmation: "Meridian Labs is on Studio. Billed $249 on 1 November; the audit log starts today.",
  },
]

const SCENES = [
  { id: "models", label: "Models" },
  { id: "plans", label: "Plans" },
] as const

export default function Demo() {
  const [scene, setScene] = React.useState<(typeof SCENES)[number]["id"]>("models")

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-5">
      <div role="group" aria-label="Scene" className="flex w-fit gap-1 rounded-[10px] bg-black/[.05] p-[3px] dark:bg-white/[.08]">
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scene === s.id}
            onClick={() => setScene(s.id)}
            className="h-7 cursor-pointer rounded-[7px] px-3 text-[13px] font-medium text-black/60 transition-colors aria-pressed:bg-white aria-pressed:text-black aria-pressed:shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_2px_rgb(0_0_0/.08)] dark:text-white/60 dark:aria-pressed:bg-white/15 dark:aria-pressed:text-white"
          >
            {s.label}
          </button>
        ))}
      </div>

      {scene === "models" ? (
        <Folio key="models" />
      ) : (
        <Folio
          key="plans"
          title="Plan for Meridian Labs"
          subtitle="Meridian Labs · 7 people · about 12,000 agent runs a month"
          panels={PLANS}
          features={PLAN_FEATURES}
          defaultValue="team"
          actionLabel={(p) => `Switch to ${p.name}`}
          doneLabel={(p) => `On ${p.name}`}
        />
      )}
    </div>
  )
}

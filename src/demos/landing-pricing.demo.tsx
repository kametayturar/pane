import { LandingPricing } from "@/components/blocks/landing-pricing"

export const notes = [
  "The Monthly / Yearly switch is two native radio inputs inside a `fieldset` with a hidden legend, so arrow keys, Tab and screen readers treat it as a real radio group. Each input covers its label at zero opacity; the thumb behind them is one span that slides 100% of its width when `data-period` flips.",
  "A price rolls once: when the value changes, the old number and the new one share one grid cell inside a clipped box. The old one leaves upward and the new one rises in from below (reversed going back to monthly), and the old copy is dropped on `animationend`. The visible number is `aria-hidden`; a visually hidden line reads the whole price, such as \"$20 per month, billed yearly\".",
  "`featured` changes two things only: the button goes from a plain hairline button to the filled accent one, and the card's 1px ring turns accent. There are no ribbons or badges, and the yearly saving is one plain line whose `{percent}` is worked out from the plans' own prices.",
  "Both layouts follow the section's own width through container queries: cards sit three across from 820px (four from 1060px, two from 620px) and stack below that; the teaser puts the card beside the copy from 820px. Buttons stay aligned across cards of different lengths with `margin-top: auto`.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <LandingPricing />
      <LandingPricing
        layout="teaser"
        title="Free to start."
        titleMuted="Pay for answers, not seats."
        description="The shared inbox is free for good. Buy answer credits when you want Atlas to take tickets off your plate, and see what you spend."
        link={{ label: "See how credits work", href: "#credits" }}
        plans={[
          {
            name: "Core",
            price: 0,
            features: ["Unlimited inboxes and seats", "Tags, routing and help-centre search", "Replies in any language"],
            details: [{ label: "Atlas replies", value: "Pay as you go" }],
            action: { label: "Open an inbox", href: "#start" },
          },
        ]}
      />
    </div>
  )
}

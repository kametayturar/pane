import { LandingHero } from "@/components/blocks/landing-hero"

export const notes = [
  "Arrival is one IntersectionObserver on two targets, the copy and the panel. Each part carries an index, and `animation-delay: calc(var(--i) * 70ms)` rises it 14px in reading order: headline, sentence, buttons, proof, then the panel. On a phone the panel enters later, so it skips the wait and rises when it is seen.",
  "The parts are hidden only after a layout effect marks the section as armed, before the first paint. With `reveal={false}`, reduced motion or no JavaScript, everything is simply there.",
  "The story is a `data-step` attribute (0 to 3) on the stage, set by three timeouts once the panel has arrived. Every change is a CSS transition keyed off that attribute, so the frame buttons can move back and forth through the same transitions.",
  "The two cards share one grid cell and are offset with margins, so the stage gets its height from its content. A container query on the panel adds the composer and sets the cards side by side when the panel is wide enough.",
  "The headline size follows the copy column (`12.4cqi`, clamped), not the viewport, so it holds inside a narrow builder frame. Each line is a block with `text-wrap: balance`.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <div className="w-full overflow-hidden rounded-[4px] ring-1 ring-black/10 dark:ring-white/10">
        <LandingHero />
      </div>
      <div className="w-full overflow-hidden rounded-[4px] ring-1 ring-black/10 dark:ring-white/10">
        <LandingHero
          layout="centered"
          panel="soft"
          headingLevel={2}
          eyebrow=""
          headline={["Answered once.", "Written up for good."]}
          description="Quill turns the tickets your team resolves into help-centre articles, so the next customer finds the answer before they have to ask."
          primaryAction={{ label: "Try Quill free", href: "#start" }}
          secondaryAction={{ label: "Book a walkthrough", href: "#demo" }}
          reassurance="Set up in ten minutes. Cancel any time."
          proof={["Written in your help centre's voice", "Every step links to a real ticket", "You publish, Quill never does"]}
          mock={{
            agent: "Quill",
            file: "late-orders.csv",
            fileMeta: "12 resolved tickets",
            message: "Twelve tickets this week about late orders. Can you write this up?",
            placeholder: "Message Quill",
            recordKind: "Draft article",
            recordTitle: "Tracking a late order",
            rows: [
              { label: "Section", value: "Shipping" },
              { label: "Sources", value: "12 tickets" },
              { label: "Reviewer", value: "Rosa Diaz" },
            ],
            checked: "Checked against the shipping policy",
            steps: ["Tickets are resolved", "Quill reads the threads", "An article to review"],
          }}
        />
      </div>
    </div>
  )
}

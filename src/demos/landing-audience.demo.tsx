import { LandingAudience, DEFAULT_LANDING_AUDIENCE } from "@/components/blocks/landing-audience"

export const notes = [
  "The cards share one frame: a single surface with a 1px ring drawn as a box-shadow outside it, and each card after the first draws one inset rule on its left (top when stacked). Nothing floats, and no line is drawn twice.",
  "`highlight` lays an accent line over exactly the pixels the frame ring and the dividing rules already use: a `::after` with `inset: -1px` and a 1px border, raised above its neighbour. Its corner radii come from custom properties set per layout, so only the corners that touch the frame's rounded edge are rounded. The highlighted card drops its own rule so the accent never sits beside a grey line.",
  "Layout follows the section's own width with container queries: two cards go side by side from 640px, three from 900px, so a narrow builder frame stacks them just like a phone. The link stays pinned to the bottom of each card with `margin-top: auto`, so links line up across cards of different lengths.",
  "Arrival is one IntersectionObserver that sets `data-reveal` on the section once. Heading lines, the note and the frame rise 14px and fade with a 70ms stagger; then each card's contents settle 8px inside the already-placed frame, so the frame's edge never moves under them. Reduced motion never arms it.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <LandingAudience />
      <LandingAudience
        title="Three teams,"
        titleMuted="one queue."
        note="Pick the door that fits. Everyone works from the same tickets."
        highlight={1}
        audiences={[
          { ...DEFAULT_LANDING_AUDIENCE.audiences[0], promise: undefined },
          { ...DEFAULT_LANDING_AUDIENCE.audiences[1], promise: undefined },
          {
            label: "For developers",
            points: [
              "A typed API and webhooks for every event.",
              "Run Quill and Sage from your own code.",
              "Sandbox workspaces with seeded data.",
              "Usage billed per call, with no seat fees.",
            ],
            link: { label: "Read the API docs", href: "#api" },
          },
        ]}
      />
    </div>
  )
}

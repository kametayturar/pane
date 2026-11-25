import { LandingCta } from "@/components/blocks/landing-cta"

export const notes = [
  "The panel colour, dots, text ramp and buttons are all custom properties set per `tone`, so accent, ink and soft are a handful of token overrides rather than three layouts. The accent panel is the accent mixed 12% towards black (42% in dark mode), which leaves room for a muted second headline line that still clears 4.5:1.",
  "Every text colour was checked by computing the WCAG ratio from the rendered pixels behind it, in Classic, Mono and Glass, light and dark, for all three tones.",
  "The checklist mock ticks its three rows one after another (720ms apart) once the band is in view, the progress hairline scales with each tick and the counter crossfades to its settled label. It plays once and then stays still; with reduced motion or `reveal={false}` it is simply finished.",
  "The split is a container query on the section's own width (two columns once the section is 860px wide), so the band folds correctly inside a narrow builder frame as well as on a phone.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col">
      <LandingCta />
      <LandingCta
        tone="soft"
        headline={["Let Sage sort the queue.", "Keep the last word."]}
        description="Sage tags every request and routes it to the right person, and asks before it changes a rule. Try it on this week's tickets."
        primaryAction={{ label: "Try Sage free", href: "#try" }}
        secondaryAction={{ label: "See a sample day", href: "#sample" }}
        reassurance="Set up in an afternoon. Cancel from settings."
        links={[]}
        mock={{
          title: "Harbor & Finch setup",
          done: "Live",
          rows: [
            { label: "Import last month's tickets", detail: "1,240 conversations" },
            { label: "Teach Sage your queues", detail: "From the tags you already use" },
            { label: "Turn on routing for the team", detail: "Every move is logged" },
          ],
        }}
      />
      <LandingCta
        tone="ink"
        layout="centered"
        headline={["Quill writes the first draft.", "You publish the final one."]}
        description="Help-centre articles, drafted from the tickets your team already solved."
        primaryAction={{ label: "Start writing", href: "#start" }}
        secondaryAction={{ label: "Read the docs", href: "#docs" }}
        reassurance="Free for teams of up to five."
        links={[
          { label: "Pricing", href: "#pricing" },
          { label: "Changelog", href: "#changelog" },
        ]}
      />
    </div>
  )
}

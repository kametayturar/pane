import { LandingProof } from "@/components/blocks/landing-proof"

export const notes = [
  "Each number counts up once from zero when the figures scroll into view, on the same cubic-bezier(.22, 1, .36, 1) the CSS uses (solved in a few lines of JS). The text is written through a ref, so React renders the final value and never re-renders per frame.",
  "Tabular digits and an invisible copy of the final value stacked in the same grid cell hold each number's width, so the row never shifts while it counts. Screen readers get the final value from a visually hidden span.",
  "Figures are separated by hairlines: left rules in a single row from 720px of the section's own width, top rules in a two-up grid below that. With three figures on a phone the first one takes the full row.",
  "Quotes carry plain curly quotation marks in the text and a monogram drawn from the first and last initials. No photos, no logos, no decorative quote glyph.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col">
      <LandingProof />
      <LandingProof
        align="center"
        show="figures"
        title="Sage sorts the queue."
        titleMuted="Before anyone logs in."
        figures={[
          { value: 97, suffix: "%", label: "Tickets routed to the right person first time" },
          { value: 30, suffix: " s", label: "Median time to tag and route a request" },
          { value: 1.8, decimals: 1, prefix: "$", suffix: "M", label: "Refunds Sage held for a person to approve" },
          { value: 38, label: "Languages recognised and routed" },
        ]}
        source="Harbor & Finch support, March to September 2026."
      />
      <LandingProof
        show="quotes"
        title="In their words."
        titleMuted=""
        quotes={[
          {
            text: "Quill turns the tickets we close into help-centre articles. I spend ten minutes editing instead of an afternoon writing, and nothing goes live that a person hasn't read.",
            name: "Priya Raman",
            role: "Head of support",
            company: "Harbor & Finch",
          },
        ]}
      />
    </div>
  )
}

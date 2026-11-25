import { LandingFooter } from "@/components/blocks/landing-footer"

export const notes = [
  "The footer is quiet by construction: one `border-top` hairline on the inner column, muted ink-alpha text (88 / 61 / 45%), and no boxes. Hover only moves a link from the secondary to the primary text tone.",
  "The layout is a container query on the footer itself, so it folds by its own width: brand block over the columns below 880px, columns two-up below 600px, three-up to 760px, then one per column. The column count is a `--n` custom property, so two to five columns all fill the row.",
  "Lucide ships no brand logos, so each social `kind` maps to a neutral line glyph (x to an at sign, github to code brackets, linkedin to a briefcase, youtube to a play square, mail to an envelope). Every icon link carries an accessible name and a title.",
  "The brand block, each column and the bottom line rise 14px and fade with a 70ms stagger once the footer scrolls into view (IntersectionObserver, then disconnect). The hidden state is set in a layout effect before first paint, and reduced motion leaves everything in place.",
]

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <div className="w-full">
        <LandingFooter />
      </div>
      <div className="w-full">
        <LandingFooter
          brand="Harbor & Finch"
          description="Lamps, linen and small furniture, made to order and shipped from Bristol."
          socials={[
            { kind: "linkedin", href: "#linkedin" },
            { kind: "github", href: "#github" },
            { kind: "rss", href: "#rss" },
          ]}
          columns={[
            {
              title: "Shop",
              links: [
                { label: "Lighting", href: "#lighting" },
                { label: "Linen", href: "#linen" },
                { label: "Furniture", href: "#furniture" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#about" },
                { label: "Press", href: "#press" },
                { label: "Contact", href: "#contact" },
              ],
            },
          ]}
          copyright="© 2026 Harbor & Finch Ltd."
          legal={[]}
        />
      </div>
    </div>
  )
}

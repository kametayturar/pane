import { ThinkingState, type ThinkingStep } from "@/components/ui/thinking-state"

const mono = (letter: string) => (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden className="text-neutral-500 dark:text-neutral-400">
    <rect x=".5" y=".5" width="15" height="15" rx="4" fill="none" stroke="currentColor" strokeOpacity=".35" />
    <text x="8" y="11.2" textAnchor="middle" fontSize="9" fontWeight="500" fill="currentColor" fontFamily="inherit">{letter}</text>
  </svg>
)
const ICONS = {
  notion: mono("N"), slack: mono("S"), appstore: mono("A"), wiki: mono("W"),
  sensor: mono("T"), ads: mono("G"), linear: mono("L"),
}

const STEPS: ThinkingStep[] = [
  {
    activeLabel: "Searching",
    label: "Searched",
    sources: [
      { label: "Notion – Japan launch plan", href: "https://notion.so", icon: ICONS.notion },
      { label: "Slack – #launch-jp", href: "https://slack.com", icon: ICONS.slack },
      { label: "App Store – yen tiers", href: "https://appstoreconnect.apple.com", icon: ICONS.appstore },
      { label: "Wikipedia – Golden Week", href: "https://en.wikipedia.org/wiki/Golden_Week_(Japan)", icon: ICONS.wiki },
    ],
    moreSources: [
      { label: "Sensor Tower – JP pricing", href: "https://sensortower.com", icon: ICONS.sensor },
      { label: "Google Ads – CPI by week", href: "https://ads.google.com", icon: ICONS.ads },
      { label: "Linear – Localization bugs", href: "https://linear.app", icon: ICONS.linear },
    ],
  },
  { label: "Reading 7 sources about the launch" },
  { label: "Comparing yen price tiers with local apps" },
  { label: "Checking dates against the holiday calendar" },
  { label: "Writing the launch recommendation" },
]

export default function Demo() {
  return (
    <div className="w-full max-w-[440px]">
      <ThinkingState steps={STEPS} />
    </div>
  )
}

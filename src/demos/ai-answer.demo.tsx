import * as React from "react"

import { AIAnswer, type AnswerSource } from "@/components/ui/ai-answer"
import { ICONS } from "./_icons"

const SOURCES: AnswerSource[] = [
  {
    name: "Notion",
    title: "Japan launch – timeline and owners",
    href: "https://notion.so",
    snippet: "Target: second half of May. Review build ready 6 May. Owners: Kenji (store listing), Ana (pricing), Lee (ads).",
    icon: ICONS.notion,
  },
  {
    name: "Slack",
    title: "#launch-jp – store listing status",
    href: "https://slack.com",
    snippet: "Kenji: \u201cScreenshots are localized. The description still needs a native review – our agency is booked out from June.\u201d",
    icon: ICONS.slack,
  },
  {
    name: "Wikipedia",
    title: "Golden Week – holidays in Japan",
    href: "https://en.wikipedia.org/wiki/Golden_Week_(Japan)",
    snippet: "Golden Week runs from 29 April to 5 May and is one of the busiest holiday periods of the year in Japan.",
    icon: ICONS.wiki,
  },
  {
    name: "App Store Connect",
    title: "Price tiers – Japanese yen",
    href: "https://appstoreconnect.apple.com",
    snippet: "Suggested tier for $4.99: ¥800 per month. Nearby tiers: ¥480, ¥600, ¥700.",
    icon: ICONS.appstore,
  },
  {
    name: "Sensor Tower",
    title: "Top productivity apps in Japan – pricing",
    href: "https://sensortower.com",
    snippet: "Median monthly price of the top 20 paid productivity apps in Japan: ¥500. Only 3 charge more than ¥700.",
    icon: ICONS.sensor,
  },
  {
    name: "Google Ads",
    title: "Cost per install by week – JP, last year",
    href: "https://ads.google.com",
    snippet: "CPI peaked at ¥410 during Golden Week and fell to ¥260 by the third week of May.",
    icon: ICONS.ads,
  },
]

type Script = { question: string; answer: string; followUps: string[] }

const SCRIPTS: Script[] = [
  {
    question: "When should we launch the app in Japan?",
    answer: `**Mid-May** is the safest window: right after Golden Week, when downloads recover and ad prices drop again [3,6].

- **Date:** 19 May gives the team two weeks after the holidays to fix review feedback [1].
- **Pricing:** start at ¥480 per month – the suggested ¥800 tier is high next to local apps [4,5].
- **Store listing:** the screenshots are done, only the description still needs a native review [2].

Book the native reviewer this week – the agency is busy from June [2].`,
    followUps: ["Compare ¥480 with ¥600 pricing", "Draft a launch checklist"],
  },
  {
    question: "Compare ¥480 with ¥600 pricing",
    answer: `**¥480** wins on conversion, **¥600** wins on revenue per user [4,5].

- **¥480:** just under the local median of ¥500, so it reads as fair in the store [5].
- **¥600:** 25% more per subscriber, but above most apps you'll be listed next to [5].
- **Ads:** cheaper installs in late May make a lower price easier to earn back [6].

Start at ¥480 and test ¥600 once you have three weeks of data.`,
    followUps: ["Draft a launch checklist", "When should we launch the app in Japan?"],
  },
  {
    question: "Draft a launch checklist",
    answer: `Here is a short checklist working back from 19 May [1].

- **By 6 May:** review build submitted, Japanese screenshots uploaded [1,2].
- **By 12 May:** native review of the description done, price set to ¥480 [2,4].
- **19 May:** release, then raise ad budgets once install costs drop [6].

Keep Golden Week free – support and reviewers are slow until 7 May [3].`,
    followUps: ["Compare ¥480 with ¥600 pricing", "When should we launch the app in Japan?"],
  },
]

/**
 * Fakes a model: text arrives in uneven bursts (20–70 characters every 80–320 ms),
 * like a real token stream. The component smooths it into a steady word-by-word reveal.
 */
function useFakeStream() {
  const [script, setScript] = React.useState(SCRIPTS[0])
  const [text, setText] = React.useState("")
  const [done, setDone] = React.useState(false)
  const [run, setRun] = React.useState(0)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    setText("")
    setDone(false)
    let i = 0
    const tick = () => {
      i = Math.min(script.answer.length, i + 20 + Math.floor(Math.random() * 50))
      setText(script.answer.slice(0, i))
      if (i >= script.answer.length) setDone(true)
      else timer.current = window.setTimeout(tick, 80 + Math.random() * 240)
    }
    timer.current = window.setTimeout(tick, 1100) // pretend to read sources first
    return () => window.clearTimeout(timer.current)
  }, [script, run])

  return {
    script,
    text,
    done,
    stop: () => {
      window.clearTimeout(timer.current)
      setDone(true)
    },
    regenerate: () => setRun((r) => r + 1),
    ask: (q: string) => setScript(SCRIPTS.find((s) => s.question === q) ?? SCRIPTS[0]),
  }
}

export default function Demo() {
  const stream = useFakeStream()
  const [log, setLog] = React.useState<string[]>([])
  const track = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4))
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <AIAnswer
        question={stream.script.question}
        sources={SOURCES}
        answer={stream.text}
        streaming={!stream.done}
        followUps={stream.script.followUps}
        onFollowUp={(q) => {
          track(`follow-up: "${q}"`)
          stream.ask(q)
        }}
        onRegenerate={() => {
          track("regenerate")
          stream.regenerate()
        }}
        onStop={() => {
          track("stop")
          stream.stop()
        }}
        onFeedback={(value, reason) => track(`feedback: ${value}${reason ? ` (${reason})` : ""}`)}
        onCopy={() => track("copied to clipboard")}
      />
      <div className="w-full max-w-[640px] font-mono text-xs text-neutral-500">
        {log.length ? log.map((l, i) => <div key={i}>→ {l}</div>) : <div>Try copy, 👍/👎, stop or a follow-up.</div>}
      </div>
    </div>
  )
}

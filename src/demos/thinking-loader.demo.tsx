import * as React from "react"

import { ThinkingLoader } from "@/components/ui/thinking-loader"

const SUPPORT_PHASES = ["Reading the ticket", "Checking order history", "Looking up the refund policy", "Drafting a reply"]

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs opacity-60">{hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function Demo() {
  const [done, setDone] = React.useState(false)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-6">
      <Row title="Auto phases" hint="Rolls through the labels on a timer and loops.">
        <ThinkingLoader phases={SUPPORT_PHASES} interval={2000} loop />
      </Row>

      <Row title="Done toggle" hint="Spinner turns into a check and the label settles. Toggle back to start over.">
        <ThinkingLoader phases={["Summarizing the thread", "Writing the update"]} interval={1800} done={done} />
        <button
          type="button"
          onClick={() => setDone((d) => !d)}
          className="rounded-md px-3 py-1.5 text-xs font-medium shadow-[0_0_0_.5px_rgb(0_0_0/.15)] hover:bg-black/5 dark:shadow-[0_0_0_.5px_rgb(255_255_255/.2)] dark:hover:bg-white/10"
        >
          {done ? "Start over" : "Mark done"}
        </button>
      </Row>

      <Row title="Small and plain, inline in a chat bubble" hint="size sm, variant plain.">
        <div className="max-w-xs rounded-2xl bg-black/5 px-4 py-3 text-sm dark:bg-white/10">
          <p className="mb-2">Sure, let me check that for you.</p>
          <ThinkingLoader
            size="sm"
            variant="plain"
            phases={["Checking the shipping status", "Comparing carrier updates"]}
            interval={2400}
            loop
          />
        </div>
      </Row>
    </div>
  )
}

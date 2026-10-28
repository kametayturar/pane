import * as React from "react"

import { OtpInput, type OtpStatus } from "@/components/ui/otp-input"

export const notes = [
  "One real <input> sits invisibly on top of six decorative boxes, so screen readers hear a single field and autocomplete=\"one-time-code\" lets iOS and Android offer the SMS code. The boxes just render the input's value.",
  "The active box is tracked in state and mirrored with setSelectionRange, so the browser's own selection covers one box: typing replaces it. Paste and autofill arrive as a whole new value, and a prefix/suffix diff against the old code tells what was inserted.",
  "The focus ring is a single absolutely positioned element moved with translateX(calc(var(--i) * step)); because it's one element, CSS can transition it, which is what makes it glide instead of blinking between boxes.",
  "Box width uses a container query unit: min(40px, (100cqw - gaps) / n) on a root with container-type: inline-size, so six boxes and a separator shrink to fit a 320px phone without media queries.",
  "Status is one data-status attribute on the root; the shake, red fill, shimmer band and the morph to the Verified chip are all CSS keyed off it. The success morph transitions one frame's width while the boxes translate toward its centre.",
]

const CODE = "482913"

export default function Demo() {
  const [code, setCode] = React.useState("")
  const [status, setStatus] = React.useState<OtpStatus>("idle")
  const [tries, setTries] = React.useState(3)
  const [run, setRun] = React.useState(0)
  const timer = React.useRef<number | undefined>(undefined)

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  function verify(value: string) {
    setStatus("verifying")
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (value === CODE) {
        setStatus("success")
      } else {
        setTries((n) => Math.max(0, n - 1))
        setStatus("error")
      }
    }, 1100)
  }

  function reset() {
    window.clearTimeout(timer.current)
    setCode("")
    setStatus("idle")
    setTries(3)
    setRun((r) => r + 1)
  }

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <div className="rounded-xl bg-white px-5 pb-5 pt-6 text-center shadow-[0_0_0_.5px_rgb(0_0_0/.08),0_1px_2px_rgb(0_0_0/.05)] dark:bg-[#1c1c1e] dark:shadow-[0_0_0_.5px_rgb(255_255_255/.1)]">
        <h3 className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Confirm it's you</h3>
        <p className="mb-5 mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          Atlas Assistant sent a code to <span className="font-medium text-neutral-800 dark:text-neutral-200">sam@northwind.dev</span>
        </p>
        <OtpInput
          key={run}
          align="center"
          separator
          value={code}
          onChange={(next) => {
            setCode(next)
            if (status === "error" && next) setStatus("idle")
          }}
          onComplete={verify}
          status={status}
          errorMessage={tries > 0 ? `That code didn't work. ${tries} ${tries === 1 ? "try" : "tries"} left.` : "Too many attempts. Request a new code."}
          onResend={() => setTries(3)}
          resendIn={30}
        />
        <p className="mt-4 border-t border-black/5 pt-3 text-[12px] text-neutral-400 dark:border-white/10">
          Demo code: <span className="font-medium tabular-nums text-neutral-600 dark:text-neutral-300">482 913</span>
          {status === "success" && (
            <button type="button" className="ml-2 underline underline-offset-2" onClick={reset}>
              Try again
            </button>
          )}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Invite code (letters, 8 boxes, left aligned)</p>
        <OtpInput length={8} numeric={false} separator={4} label="Invite code" defaultValue="" />
      </div>
    </div>
  )
}

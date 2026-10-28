import * as React from "react"

import { VoiceRecorder, voicePeaks, type VoiceMessage } from "@/components/ui/voice-recorder"

export const notes = [
  "The live waveform is one `<canvas>` painted by one rAF loop, only while recording. Every 70ms the loudest sample of that slice becomes a new column; between columns the whole strip is shifted left by a sub-pixel offset, so it scrolls smoothly instead of ticking. A CSS `mask-image` fades the old end, and silence is drawn as faint 2px dots.",
  "The level comes from a source you choose. By default it is simulated: phrases of speech (summed sines gated at zero) with a syllable ripple. With `source=\"microphone\"` the browser is asked for the mic only after the tap (`getUserMedia`), an `AnalyserNode` supplies the RMS of the time-domain samples and a `MediaRecorder` collects the take, which plays back from an object URL. Denied, missing or unsupported devices show a clear message instead of failing silently.",
  "The mic, the recording bar and the review are one piece of UI. The bar grows from the mic with an animated `clip-path: inset(... round 999px)`, the content inside crossfades with a 3px blur between the recording and review rows, and the action button swaps its icon (mic, stop, arrow) while its colour transitions.",
  "Sending uses a FLIP animation: the bar's rectangle is measured just before the message is added, the new bubble is measured after layout, and the Web Animations API plays a `translate + scale` from the old box to the new one while the content fades in. That is what makes the take look like it travels into the thread.",
  "Bubbles share one playback engine: a Map of playhead positions, and one rAF loop that moves only the active message by setting a `clip-path: inset()` that reveals a darker copy of the bars. Nothing re-renders per frame, so a long thread stays smooth.",
]

const THREAD: VoiceMessage[] = [
  { id: "m1", duration: 14, peaks: voicePeaks(1, 14), from: "Megan", meta: "9:38 AM" },
  { id: "m2", duration: 6, peaks: voicePeaks(2, 6), meta: "9:40 AM" },
  { id: "m3", duration: 9, peaks: voicePeaks(3, 9), from: "Megan", meta: "9:41 AM" },
]

export default function Demo() {
  const [mic, setMic] = React.useState(false)
  const [run, setRun] = React.useState(0)
  const [log, setLog] = React.useState("Nothing sent yet.")
  return (
    <div className="flex w-full max-w-[420px] flex-col items-stretch gap-5">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_0_0_.5px_rgba(0,0,0,.08),0_20px_48px_rgba(0,0,0,.08)] dark:bg-neutral-900 dark:shadow-[0_0_0_.5px_rgba(255,255,255,.1),0_20px_48px_rgba(0,0,0,.5)]">
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 dark:border-white/10">
          <span className="grid size-8 place-items-center rounded-full text-[12px] font-semibold text-white" style={{ background: "linear-gradient(140deg, oklch(.72 .13 40), oklch(.55 .15 80))" }}>M</span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">Megan Brooks</div>
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400">Porch renovation</div>
          </div>
          <button type="button" aria-label="Reset the thread" onClick={() => { setRun((r) => r + 1); setLog("Nothing sent yet.") }} className="rounded-full px-2.5 py-1 text-[12px] text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10">Reset</button>
        </div>
        <div className="p-4">
          <VoiceRecorder
            key={`${run}-${mic}`}
            defaultMessages={THREAD}
            maxDuration={30}
            source={mic ? "microphone" : "simulated"}
            onSend={(m) => setLog(`Sent ${m.id.slice(0, 8)}: ${m.duration}s${m.audioUrl ? " with real audio" : " (simulated)"}.`)}
            onCancel={() => setLog("Take discarded.")}
            onError={(e) => setLog(`Mic error (${e.code}).`)}
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-[13px] text-neutral-600 dark:text-neutral-300">
        <input type="checkbox" className="mt-0.5 size-4 accent-neutral-900 dark:accent-white" checked={mic} onChange={(e) => setMic(e.target.checked)} />
        <span>Use my real microphone. The browser only asks after you tap the mic; nothing is uploaded and the take stays in this tab.</span>
      </label>
      <p className="text-[13px] text-neutral-500 dark:text-neutral-400" aria-live="polite">{log}</p>
    </div>
  )
}

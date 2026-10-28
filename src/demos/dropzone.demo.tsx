import { Dropzone, type DropzoneFile } from "@/components/ui/dropzone"

export const notes: string[] = [
  "Drag state is tracked with a counter: `dragenter` fires again for every child element you cross, so the counter goes up on enter and down on leave, and the zone is 'over' while it is above zero. `preventDefault()` on `dragover` is what allows a drop at all.",
  "Dropped and picked files go through the same function. It checks each File against `accept` (extension, exact MIME or `image/*`) and `maxSize`, so refused files become error rows with a reason instead of disappearing.",
  "The zone is a `div role=\"button\"` with Enter/Space opening a visually hidden `<input type=\"file\">`, so keyboard users get the same picker. Status changes go through an `aria-live` region.",
  "Rows slide in and out by animating `grid-template-rows` between `0fr` and `1fr` – a way to animate a row's height without measuring it. The progress bar is a `scaleX` transform, which stays on the compositor.",
  "Without an `upload` prop the component simulates progress with one interval; with one, it calls your function with an `onProgress` callback and an `AbortSignal` that fires when the row is removed.",
]

const FILES: DropzoneFile[] = [
  { id: "seed-1", name: "support-handbook.pdf", size: 2_340_000, progress: 100, status: "done" },
  { id: "seed-2", name: "release-notes-q3.md", size: 18_400, progress: 100, status: "done" },
  { id: "seed-3", name: "pricing-faq.docx", size: 612_000, progress: 12, status: "uploading" },
  { id: "seed-4", name: "refund-rules-fail.pdf", size: 904_000, progress: 20, status: "uploading" },
]

export default function Demo() {
  return (
    <div className="w-full max-w-[480px]">
      <Dropzone
        accept=".pdf,.md,.txt,.csv,.docx"
        maxSize={5 * 1024 * 1024}
        maxFiles={6}
        defaultFiles={FILES}
        title="Drop knowledge sources or"
      />
      <p className="mt-3 text-[12px] text-neutral-400">Drop your own files. Names containing &quot;fail&quot; end in an error you can retry.</p>
    </div>
  )
}

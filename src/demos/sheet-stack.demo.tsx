import * as React from "react"
import { Bell, ChevronRight, User } from "lucide-react"

import { Sheet, SheetStack, SheetTrigger, useSheetStack, type SheetStackMode } from "@/components/ui/sheet-stack"

export const notes: string[] = [
  "Every open sheet is positioned by one pure function of three springs – how far it has risen (`presence`), how deep it sits in the stack (`depth`) and how far it is being dragged. Pushing, popping, dragging and interrupting mid-flight all just move those numbers, so velocity carries over and the frames come from a single requestAnimationFrame loop that only writes `transform`.",
  "Sheets are declared where you like but rendered into one layer with `createPortal`; a `Sheet` stays mounted while its exit plays and unmounts when the spring is at rest. Lower sheets scale by 5% per level around their top edge, get a dim overlay, and are shifted so exactly 10px (14px for dialogs) of each one peeks above the one on top.",
  "Drag to dismiss uses pointer events with `setPointerCapture`: upward pulls rubber-band with 1 − 1/(x/48 + 1), a release past 35% of the height or 450px/s dismisses, and the drag offset is converted into the `presence` spring so the exit continues from where your finger left it. A drag that starts in a scrolled body scrolls instead.",
  "A `ResizeObserver` on each sheet's content turns height changes into a spring target, and one on the layer decides sheet vs dialog (`mode=\"auto\"` switches at 640px of the layer's own width, not the window's).",
  "Accessibility is built from the platform: lower sheets and the page behind get `inert`, only the top panel is `aria-modal`, Tab is trapped inside it, and focus returns to the element that opened a sheet when it pops.",
]

const SWATCHES = [
  ["#f7b267", "#f4845f"],
  ["#9bd1ff", "#5b8def"],
  ["#c3a6ff", "#8b6cf0"],
  ["#8fe3c1", "#33b58a"],
  ["#ffb3c7", "#ee6a93"],
  ["#ffe08a", "#e9b11f"],
  ["#b9c4d2", "#6f7f93"],
  ["#ff9d8a", "#d8523c"],
]

function Avatar({ i, size, label }: { i: number; size: number; label?: string }) {
  const [a, b] = SWATCHES[i % SWATCHES.length]
  return (
    <span
      aria-hidden="true"
      className="grid flex-none place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: `linear-gradient(145deg, ${a}, ${b})`, fontSize: size * 0.36 }}
    >
      {label}
    </span>
  )
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 flex-none rounded-full transition-colors"
      style={{ background: on ? "oklch(.15 0 0)" : "oklch(.88 0 0)" }}
    >
      <span className="absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: on ? "translateX(20px)" : "none" }} />
    </button>
  )
}

function Row({ title, hint, right }: { title: string; hint?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 px-4 py-3 dark:border-white/10">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium">{title}</div>
        {hint && <div className="text-[12px] text-neutral-500">{hint}</div>}
      </div>
      {right}
    </div>
  )
}

function BackButton({ children }: { children: React.ReactNode }) {
  const { pop } = useSheetStack()
  return (
    <button type="button" onClick={pop} className="h-11 w-full rounded-[18px] bg-neutral-900 text-[14px] font-medium text-white dark:bg-white dark:text-neutral-900">
      {children}
    </button>
  )
}
function CloseButton({ children }: { children: React.ReactNode }) {
  const { close } = useSheetStack()
  return (
    <button type="button" onClick={close} className="h-11 w-full rounded-[18px] bg-neutral-900 text-[14px] font-medium text-white dark:bg-white dark:text-neutral-900">
      {children}
    </button>
  )
}

const field =
  "h-11 w-full rounded-[18px] border border-black/10 bg-transparent px-4 text-[14px] outline-none focus-visible:border-black/40 dark:border-white/15 dark:focus-visible:border-white/50"

export default function Demo() {
  const [mode, setMode] = React.useState<SheetStackMode>("auto")
  const [stack, setStack] = React.useState<string[]>([])
  const [name, setName] = React.useState("Noor Haddad")
  const [role, setRole] = React.useState("Product designer")
  const [photo, setPhoto] = React.useState(2)
  const [draftPhoto, setDraftPhoto] = React.useState(2)
  const [mentions, setMentions] = React.useState(true)
  const [weekly, setWeekly] = React.useState(false)
  const [digest, setDigest] = React.useState(true)
  const [push, setPush] = React.useState(false)
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="flex w-full max-w-[720px] flex-col items-center gap-4">
      <div className="relative h-[560px] w-full overflow-hidden rounded-[28px] bg-neutral-50 shadow-[0_0_0_1px_rgb(0_0_0/.06)] dark:bg-neutral-900 dark:shadow-[0_0_0_1px_rgb(255_255_255/.1)]">
        <SheetStack contained mode={mode} stack={stack} onStackChange={setStack}>
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Avatar i={photo} size={72} label={initials} />
            <div>
              <div className="text-[18px] font-medium tracking-tight">{name}</div>
              <div className="text-[13px] text-neutral-500">{role} · Studio team</div>
            </div>
            <SheetTrigger sheet="settings" className="mt-1 h-10 rounded-full bg-neutral-900 px-5 text-[14px] font-medium text-white dark:bg-white dark:text-neutral-900">
              Open settings
            </SheetTrigger>
            <p className="max-w-[300px] text-[12px] leading-[18px] text-neutral-400">Open settings, then drill into your profile and photo. Drag a sheet down or press Escape to go back a level.</p>
          </div>

          <Sheet id="settings" title="Settings">
            <div className="flex flex-col gap-2 pb-4">
              <SheetTrigger sheet="profile" className="flex w-full items-center gap-3 rounded-2xl border border-black/5 px-4 py-3 text-left dark:border-white/10">
                <Avatar i={photo} size={36} label={initials} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">{name}</span>
                  <span className="block text-[12px] text-neutral-500">{role}</span>
                </span>
                <ChevronRight className="size-4 text-neutral-400" />
              </SheetTrigger>
              <SheetTrigger sheet="notifications" className="flex w-full items-center gap-3 rounded-2xl border border-black/5 px-4 py-3 text-left dark:border-white/10">
                <span className="grid size-9 place-items-center rounded-full bg-neutral-100 dark:bg-white/10"><Bell className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">Notifications</span>
                  <span className="block text-[12px] text-neutral-500">Email and push</span>
                </span>
                <ChevronRight className="size-4 text-neutral-400" />
              </SheetTrigger>
              <Row title="Mentions" hint="Notify me when someone tags me" right={<Switch on={mentions} onChange={setMentions} label="Mentions" />} />
              <Row title="Weekly summary" hint="An email every Monday at 9 a.m." right={<Switch on={weekly} onChange={setWeekly} label="Weekly summary" />} />
            </div>
          </Sheet>

          <Sheet
            id="profile"
            title="Edit profile"
            footer={
              <button type="button" onClick={() => setStack([])} className="h-11 w-full rounded-[18px] bg-neutral-900 text-[14px] font-medium text-white dark:bg-white dark:text-neutral-900">
                Save changes
              </button>
            }
          >
            <div className="flex flex-col gap-4 pb-3">
              <div className="flex flex-col items-center gap-2 pt-1">
                <Avatar i={photo} size={84} label={initials} />
                <SheetTrigger sheet="photo" onClick={() => setDraftPhoto(photo)} className="text-[13px] font-medium text-neutral-600 underline-offset-4 hover:underline dark:text-neutral-300">
                  Change photo
                </SheetTrigger>
              </div>
              <label className="flex flex-col gap-1.5 text-[12px] text-neutral-500">
                Name
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] text-neutral-500">
                Role
                <input className={field} value={role} onChange={(e) => setRole(e.target.value)} />
              </label>
            </div>
          </Sheet>

          <Sheet
            id="photo"
            title="Choose a photo"
            description="Pick a colour for your avatar."
            footer={
              <BackButton>
                <span onClick={() => setPhoto(draftPhoto)}>Use this one</span>
              </BackButton>
            }
          >
            <div className="grid grid-cols-4 gap-3 pb-3" role="radiogroup" aria-label="Avatar colour">
              {SWATCHES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={draftPhoto === i}
                  aria-label={`Colour ${i + 1}`}
                  onClick={() => setDraftPhoto(i)}
                  className="mx-auto grid size-[60px] place-items-center rounded-full transition-shadow"
                  style={{ boxShadow: draftPhoto === i ? "0 0 0 2px #fff, 0 0 0 4px oklch(.15 0 0)" : "none" }}
                >
                  <Avatar i={i} size={56} label={initials} />
                </button>
              ))}
            </div>
          </Sheet>

          <Sheet id="notifications" title="Notifications" footer={<CloseButton>Done</CloseButton>}>
            <div className="flex flex-col gap-2 pb-3">
              <Row title="Daily digest" hint="One email with everything new" right={<Switch on={digest} onChange={setDigest} label="Daily digest" />} />
              <Row title="Push notifications" hint="On this device" right={<Switch on={push} onChange={setPush} label="Push notifications" />} />
              <Row title="Mentions" hint="Always on for direct mentions" right={<Switch on={mentions} onChange={setMentions} label="Mentions" />} />
              <p className="flex items-center gap-2 px-1 pt-1 text-[12px] text-neutral-400"><User className="size-3.5" /> Applies to {name}</p>
            </div>
          </Sheet>
        </SheetStack>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-[13px]">
        <div className="inline-flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800" role="radiogroup" aria-label="Presentation">
          {(["auto", "sheet", "dialog"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={"rounded-full px-3 py-1 capitalize " + (mode === m ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-600 dark:text-white" : "text-neutral-500")}
            >
              {m === "sheet" ? "Sheets" : m === "dialog" ? "Dialogs" : "Auto"}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setStack([])} className="rounded-full bg-neutral-100 px-3 py-1.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          Reset
        </button>
      </div>
    </div>
  )
}

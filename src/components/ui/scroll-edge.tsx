"use client"

import * as React from "react"
import { ArrowUp, Bell, CalendarCheck, Check, ChevronLeft, FileText, Phone, Plus } from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type ThreadSlot = {
  id: string
  /** Main line, for example "Thu 14:20". */
  label: string
  /** Second line, for example the clinician. */
  detail?: string
}

export type ThreadCard =
  | {
      kind: "slots"
      title: string
      slots: ThreadSlot[]
      /** Id of the slot that starts picked. */
      chosen?: string
    }
  | {
      kind: "booking"
      title: string
      /** Date and time, as one line. */
      when: string
      /** Who and where. */
      where: string
      /** What happens next, in plain words: "Reminder text goes out on Wed at 16:00". */
      consequence: string
      /** Status chip next to the title. Defaults to "Confirmed". */
      status?: string
    }
  | { kind: "file"; name: string; size: string }

export type ThreadMessage = {
  id: string
  /** "me" sits on the right in the accent colour, "them" on the left on a surface, "note" is a centred system line. */
  side: "me" | "them" | "note"
  /** Name shown above the first message of a run from the same sender. */
  author?: string
  /** Small tag next to the name, such as "AI" or "Front desk". */
  role?: string
  text?: string
  /** Shown beside the author, or under your own bubble. */
  time?: string
  card?: ThreadCard
}

export type ScrollEdgeProps = {
  /** Large title that collapses into the glass bar. */
  title?: string
  /** One line under the large title. It fades out while the title collapses. */
  subtitle?: string
  /** Left side of the bar, usually a back button. Use `ScrollEdgeAction` for glass round buttons. */
  leading?: React.ReactNode
  /** Right side of the bar. Use `ScrollEdgeAction` for glass round buttons. */
  actions?: React.ReactNode
  /** Your scroll content. Leave it out to show the Northwind Clinics support thread. */
  children?: React.ReactNode
  /** Floating bar at the bottom. Leave it out for the message composer (only when `children` is also left out), or pass `null` for none. */
  footer?: React.ReactNode | null
  /** Messages for the built-in thread. */
  messages?: ThreadMessage[]
  /** Name of who is typing, shown as three dots at the end of the built-in thread. */
  typing?: string | null
  /** Quick replies above the built-in composer. Leave out for the built-in ones, which change after each exchange. */
  suggestions?: string[]
  /** Placeholder of the built-in composer. */
  placeholder?: string
  /** The built-in composer sent a message. */
  onSend?: (text: string) => void
  /** The built-in thread answers by itself with a canned reply from Atlas. On by default only when you do not pass `messages`. */
  autoReply?: boolean
  /** The plus button in the built-in composer. Without it the button is not rendered. */
  onAttach?: () => void
  /** Scenery behind the content, filling the frame and staying still. Leave it out for the built-in wallpaper that scrolls with the content. */
  backdrop?: React.ReactNode
  /** "progressive" fades the blur out over the whole strip. "uniform" is one flat blur with a hard line, for comparison. */
  edge?: "progressive" | "uniform"
  /** Scroll the content by itself so the demo is alive: true, or a speed in px per second. It holds still while the pointer or focus is inside, and stops for good at the first touch, key or wheel, or once a message is typed or sent. */
  autoScroll?: boolean | number
  /** Scroll distance in px over which the large title finishes collapsing. */
  collapseAt?: number
  /** Real refraction on the bars in Chromium. Other browsers and reduced-transparency users always get frosted glass. */
  refraction?: boolean
  /** Height of the frame. */
  height?: number | string
  /** Accessible name of the scroll area. */
  label?: string
  /** Gets the scroll container. */
  scrollRef?: React.Ref<HTMLDivElement>
  /** The title finished collapsing (true) or came back (false). */
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
  style?: React.CSSProperties
}

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const DEFAULT_MESSAGES: ThreadMessage[] = [
  { id: "n1", side: "note", text: "Today, 08:52" },
  { id: "m1", side: "me", text: "Morning! I need to move my Thursday check-up. Any afternoons free?", time: "08:52" },
  {
    id: "m2",
    side: "them",
    author: "Atlas",
    role: "AI",
    time: "08:52",
    text: "Morning Mara. I can see Thursday 09:40 with Dr. Singh. These afternoon slots are open this week:",
  },
  {
    id: "m3",
    side: "them",
    card: {
      kind: "slots",
      title: "Afternoon openings",
      chosen: "thu-1600",
      slots: [
        { id: "thu-1420", label: "Thu 14:20", detail: "Dr. Singh" },
        { id: "thu-1600", label: "Thu 16:00", detail: "Dr. Singh" },
        { id: "fri-1340", label: "Fri 13:40", detail: "Dr. Okoye" },
      ],
    },
  },
  { id: "m4", side: "me", text: "Thursday 16:00 works. Do I need to bring anything?", time: "08:54" },
  {
    id: "m5",
    side: "them",
    author: "Atlas",
    role: "AI",
    time: "08:54",
    text: "Moving it now. Dr. Singh asks you to bring your last blood test results, nothing else.",
  },
  {
    id: "m6",
    side: "them",
    card: {
      kind: "booking",
      title: "Check-up moved",
      when: "Thu 14 Nov, 16:00",
      where: "Dr. Singh, Room 3, Harbour Street",
      consequence: "Reminder text goes to ••• 0142 on Wed at 16:00",
    },
  },
  { id: "m7", side: "me", text: "Perfect. My insurer wants a referral letter on file. Can someone check?", time: "08:56" },
  { id: "n2", side: "note", text: "Nadia from the front desk joined" },
  {
    id: "m8",
    side: "them",
    author: "Nadia",
    role: "Front desk",
    time: "08:58",
    text: "Hi Mara, Nadia here. Atlas flagged the referral. It was filed on 2 Nov, so you are covered.",
  },
  { id: "m9", side: "them", card: { kind: "file", name: "Referral letter, Northwind.pdf", size: "184 KB" } },
  { id: "m10", side: "me", text: "Brilliant, thank you both.", time: "09:00" },
  { id: "m11", side: "them", author: "Atlas", role: "AI", time: "09:01", text: "Anytime. I will close this thread at 09:30 unless you reply." },
  { id: "n3", side: "note", text: "Thread closes at 09:30" },
]

const FIRST_CHIPS = ["Move reminder to 15:00", "Add to calendar", "Call me"]
const NEXT_CHIPS = ["That's all, thanks", "Email me the letter"]

const REPLIES: Record<string, string> = {
  "Move reminder to 15:00": "Done. Your reminder text now goes out on Wed at 15:00.",
  "Add to calendar": "Added. Thu 14 Nov, 16:00 is in your calendar with a one hour alert.",
  "Call me": "Nadia will call ••• 0142 within 10 minutes.",
  "That's all, thanks": "Lovely. I have closed the thread. See you Thursday at 16:00.",
  "Email me the letter": "Sent to the address on file. It should land within a minute.",
}
const FALLBACK_REPLY = "Got it. I have passed that to Nadia at the front desk, and she will confirm by 11:00 today."

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

/** Edge layers from weakest to strongest blur. Each one is a band of the strip, so blur grows smoothly towards the edge. */
const BLUR = [0.7, 2, 5, 10]
/** Saturation of each layer. The strongest ones pull colour down a little, so a blue bubble becomes a soft glow instead of a block. */
const SAT = [0, 0, 88, 72]

/** How much of each strip, from the screen edge, gets the strongest blur before it starts to fall off. The bottom one covers the quick replies. */
const HOLD = { top: 38, bottom: 52 }

/** One rule per layer and side. The values are literal because Safari ignores var() inside -webkit-backdrop-filter. */
function edgeCss() {
  const n = BLUR.length
  const d = 100 / (n + 1)
  let out = ""
  BLUR.forEach((px, i) => {
    const r = n - 1 - i // rank 0 is the strongest layer and sits at the edge
    for (const side of ["top", "bottom"] as const) {
      const hold = HOLD[side]
      const sat = SAT[i] ? ` saturate(${SAT[i]}%)` : ""
      const f = (v: number) => `${+(hold + (v * (100 - hold)) / 100).toFixed(2)}%`
      const stops = `${r === 0 ? "#000 0%" : `transparent ${f((r - 1) * d)}, #000 ${f(r * d)}`}, #000 ${f((r + 1) * d)}, transparent ${f((r + 2) * d)}`
      const m = `linear-gradient(${side === "top" ? "to bottom" : "to top"}, ${stops})`
      out += `.ise-edge-${side} > i:nth-child(${i + 1}) { -webkit-backdrop-filter: blur(${px}px)${sat}; backdrop-filter: blur(${px}px)${sat}; -webkit-mask-image: ${m}; mask-image: ${m} }\n`
    }
  })
  return out
}

const DOODLE = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='104' height='104' viewBox='0 0 104 104' fill='none' stroke='#000' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'>" +
    "<path d='M16 8v14M9 15h14'/><circle cx='70' cy='14' r='4.5'/>" +
    "<rect x='60' y='52' width='24' height='10' rx='5' transform='rotate(-35 72 57)'/>" +
    "<path d='M24 88c-10-7-13-13-9-18 3-4 9-3 9 2 0-5 6-6 9-2 4 5 1 11-9 18z'/>" +
    "<path d='M54 80c-5 6-7 10-3 13 3 3 9 1 9-4 0-4-4-7-6-9z'/><path d='M92 76l-7 9m4-12l-8 10'/>" +
    "<path d='M40 38l5 5m0-5l-5 5'/></svg>",
)

const STYLES = `
@property --ise-p { syntax: "<number>"; inherits: true; initial-value: 0 }
@property --ise-q { syntax: "<number>"; inherits: true; initial-value: 1 }

.ise {
  --ise-ink: #000; --ise-surface: #fff; --ise-accent: #0060e2;
  --ise-t1: color-mix(in oklab, var(--ise-ink) 88%, transparent);
  --ise-t2: color-mix(in oklab, var(--ise-ink) 61%, transparent);
  --ise-t3: color-mix(in oklab, var(--ise-ink) 45%, transparent);
  --ise-t4: color-mix(in oklab, var(--ise-ink) 27%, transparent);
  --ise-fill: color-mix(in oklab, var(--ise-ink) 6%, transparent);
  --ise-line: color-mix(in oklab, var(--ise-ink) 6%, transparent);
  --ise-shadow: 0 0 0 .5px rgb(0 0 0 / .06), 0 1px 1px -1px rgb(0 0 0 / .1), 0 1px 2px 0 rgb(0 0 0 / .05);
  --ise-float: 0 0 0 .5px rgb(0 0 0 / .08), 0 12px 32px -10px rgb(0 0 0 / .28);
  --ise-glint: rgb(255 255 255 / .85);
  --ise-ease: cubic-bezier(.22, 1, .36, 1);
  --ise-me: var(--ise-accent);
  --ise-ok: #17794a;
  /* glass: tier 1 tint, tier 0 solid, the colour the wallpaper rests on, and the rim light */
  --ise-glass: color-mix(in oklab, color-mix(in oklab, var(--ise-surface) 86%, var(--ise-accent)) 38%, transparent);
  --ise-solid: #fbfbfd;
  --ise-wall: #ebe6ff;
  --ise-b1: rgb(255 138 188 / .8); --ise-b2: rgb(112 188 255 / .85); --ise-b3: rgb(166 140 255 / .85);
  --ise-b4: rgb(96 222 176 / .8); --ise-b5: rgb(255 184 112 / .85);
  --ise-on-me: #fff;
  --ise-rim-a: rgb(255 255 255 / .9); --ise-rim-b: rgb(255 255 255 / .16); --ise-rim-c: rgb(255 255 255 / .7);
  --ise-lit: inset 0 0 0 .5px rgb(255 255 255 / .55), inset 0 1px 3px rgb(255 255 255 / .35), inset 0 -1px 2px rgb(60 40 140 / .12);
  --ise-drop: 0 10px 30px -10px rgb(30 20 80 / .34), 0 2px 8px -2px rgb(30 20 80 / .12);
  --ise-top: 124px; --ise-foot: 76px; --ise-range: 72px; --ise-edge-top: 132px;
  --ise-p: 0; --ise-q: 1;
  --ise-side: 50px;

  --ise-r: 28px;
  position: relative; width: 100%; height: var(--ise-h, 640px); border-radius: var(--ise-r);
  background: var(--ise-wall); color: var(--ise-t1);
  font: 13px/20px var(--ise-font, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
  -webkit-font-smoothing: antialiased; text-size-adjust: 100%;
  box-shadow: var(--ise-shadow);
}
:is(.dark, [data-theme="dark"]) .ise {
  --ise-ink: #fff; --ise-surface: #1c1c1e; --ise-accent: #4d8dff;
  --ise-t1: color-mix(in oklab, var(--ise-ink) 90%, transparent);
  --ise-t2: color-mix(in oklab, var(--ise-ink) 62%, transparent);
  --ise-t3: color-mix(in oklab, var(--ise-ink) 46%, transparent);
  --ise-t4: color-mix(in oklab, var(--ise-ink) 28%, transparent);
  --ise-fill: color-mix(in oklab, var(--ise-ink) 8%, transparent);
  --ise-line: color-mix(in oklab, var(--ise-ink) 8%, transparent);
  --ise-shadow: 0 0 0 .5px rgb(255 255 255 / .1), 0 1px 2px 0 rgb(0 0 0 / .4);
  --ise-float: 0 0 0 .5px rgb(255 255 255 / .12), 0 14px 36px -10px rgb(0 0 0 / .6);
  --ise-glint: rgb(255 255 255 / .5);
  --ise-me: color-mix(in oklab, var(--ise-accent) 76%, #000);
  --ise-ok: #5ad69a;
  --ise-glass: color-mix(in oklab, var(--ise-ink) 11%, transparent);
  --ise-solid: #242428;
  --ise-wall: #14132b;
  --ise-b1: rgb(190 56 140 / .5); --ise-b2: rgb(32 100 220 / .55); --ise-b3: rgb(100 70 240 / .5);
  --ise-b4: rgb(16 160 130 / .45); --ise-b5: rgb(210 112 40 / .42);
  --ise-rim-a: rgb(255 255 255 / .5); --ise-rim-b: rgb(255 255 255 / .06); --ise-rim-c: rgb(255 255 255 / .36);
  --ise-lit: inset 0 0 0 .5px rgb(255 255 255 / .16), inset 0 1px 3px rgb(255 255 255 / .12);
  --ise-drop: 0 12px 34px -10px rgb(0 0 0 / .7), 0 2px 8px -2px rgb(0 0 0 / .4);
}
/* text on your own bubbles follows the bubble: white on a strong accent, black on a pale one (Mono dark) */
@supports (color: oklch(from red l c h)) {
  .ise { --ise-on-me: oklch(from var(--ise-me) clamp(0, (0.64 - l) * 1000, 1) 0 0) }
}
:where(.ise) *, :where(.ise) *::before, :where(.ise) *::after { box-sizing: border-box }
:where(.ise) button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent }
:where(.ise) h2, :where(.ise) p { margin: 0 }
:where(.ise) :focus-visible { outline: 2px solid color-mix(in oklab, var(--ise-accent) 62%, transparent); outline-offset: 1px }

/* ---- scroll-driven progress: --ise-p is 0 at the top and 1 once the title has collapsed, --ise-q is 0 at the very end.
   The animations run on the three elements that read them, so style recalculation never reaches the messages. ---- */
@keyframes ise-p { from { --ise-p: 0 } to { --ise-p: 1 } }
@keyframes ise-q { from { --ise-q: 1 } to { --ise-q: 0 } }
@supports (animation-timeline: scroll()) and (timeline-scope: --ise-tl) {
  .ise[data-native] { timeline-scope: --ise-tl }
  .ise[data-native] .ise-scroll { scroll-timeline: --ise-tl block }
  .ise[data-native] .ise-head, .ise[data-native] .ise-edge-top { animation: ise-p linear both; animation-timeline: --ise-tl; animation-range: 0 var(--ise-range) }
  .ise[data-native] .ise-edge-bottom { animation: ise-q linear both; animation-timeline: --ise-tl; animation-range: calc(100% - 64px) 100% }
}

/* The clip is a separate layer: clip-path makes it the backdrop root, so rounded corners cut the blur layers too, and the shadow stays outside */
.ise-clip { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; clip-path: inset(0 round var(--ise-r)) }

/* ---- layers ---- */
.ise-wall { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden }
.ise-wall > * { width: 100%; height: 100%; display: block }
.ise-scroll {
  position: absolute; inset: 0; z-index: 1; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
  scroll-padding-top: var(--ise-top); scroll-padding-bottom: calc(var(--ise-foot) + 24px);
  scrollbar-width: none; -webkit-overflow-scrolling: touch;
  /* nothing shows in the 12px above the bar */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 12px); mask-image: linear-gradient(to bottom, transparent 0, #000 12px);
}
.ise-scroll::-webkit-scrollbar { display: none }
.ise-scroll:focus-visible { outline-offset: -3px; border-radius: inherit }
.ise-sheet { position: relative; min-height: 100%; padding-top: var(--ise-top); padding-bottom: calc(var(--ise-foot) + 22px) }
.ise[data-nofoot] .ise-edge-bottom { display: none }
.ise-paper {
  position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(62% 17% at 8% 0%, var(--ise-b1), transparent 72%),
    radial-gradient(56% 15% at 96% 20%, var(--ise-b2), transparent 72%),
    radial-gradient(62% 17% at 16% 41%, var(--ise-b3), transparent 72%),
    radial-gradient(56% 15% at 92% 58%, var(--ise-b4), transparent 72%),
    radial-gradient(62% 16% at 6% 78%, var(--ise-b5), transparent 72%),
    radial-gradient(62% 17% at 8% 100%, var(--ise-b1), transparent 72%);
  background-size: 100% 1240px; background-repeat: repeat-y;
}
.ise-paper::after {
  content: ""; position: absolute; inset: 0;
  background: color-mix(in oklab, var(--ise-ink) 9%, transparent);
  -webkit-mask: url("data:image/svg+xml,${DOODLE}") 0 0 / 104px 104px repeat; mask: url("data:image/svg+xml,${DOODLE}") 0 0 / 104px 104px repeat;
}
.ise-flow { position: relative; max-width: 720px; margin: 0 auto; padding: 0 14px; display: flex; flex-direction: column; gap: 6px }

/* ---- progressive edge: stacked, masked backdrop layers ---- */
.ise-edge { position: absolute; left: 0; right: 0; z-index: 2; pointer-events: none }
.ise-edge-top { top: 0; height: var(--ise-edge-top) }
.ise-edge-bottom { bottom: 0; height: calc(var(--ise-foot) + 56px) }
.ise-edge > i { position: absolute; inset: 0 }
.ise-edge-top > i, .ise-edge-top > b { opacity: clamp(0, calc(var(--ise-p) * 3), 1) }
.ise-edge-bottom > i, .ise-edge-bottom > b { opacity: var(--ise-q) }
.ise-edge > b { position: absolute; inset: 0; display: block }
.ise-edge-top > b { background: linear-gradient(to bottom, color-mix(in oklab, var(--ise-wall) 66%, transparent), color-mix(in oklab, var(--ise-wall) 26%, transparent) 46%, transparent) }
.ise-edge-bottom > b { background: linear-gradient(to top, color-mix(in oklab, var(--ise-wall) 78%, transparent), color-mix(in oklab, var(--ise-wall) 40%, transparent) 55%, transparent) }
${edgeCss()}
/* the flat version, to compare: one blur, a hard line */
.ise[data-edge="uniform"] { --ise-edge-top: 66px }
.ise[data-edge="uniform"] .ise-edge-bottom { height: calc(var(--ise-foot) - 6px) }
.ise[data-edge="uniform"] .ise-edge > i { display: none }
.ise[data-edge="uniform"] .ise-edge > i:nth-child(1) { display: block; -webkit-mask-image: none; mask-image: none; -webkit-backdrop-filter: blur(14px) saturate(140%); backdrop-filter: blur(14px) saturate(140%) }
.ise[data-edge="uniform"] .ise-edge > b { background: color-mix(in oklab, var(--ise-wall) 44%, transparent); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ise-ink) 10%, transparent) }

/* ---- glass (tier 0 by default, tier 1 where backdrop-filter exists, tier 2 where JS found Chromium) ---- */
.ise-glass { position: relative; border-radius: var(--r, 999px); overflow: hidden; box-shadow: 0 0 0 1px color-mix(in oklab, var(--ise-ink) 14%, transparent), 0 8px 28px rgb(0 0 0 / calc(.18 * var(--ise-gv, 1))) }
.ise-bd { position: absolute; inset: 0; border-radius: inherit; z-index: 0; pointer-events: none }
.ise-skin { position: absolute; inset: 0; border-radius: inherit; z-index: 1; pointer-events: none; background: var(--ise-solid); opacity: var(--ise-gv, 1) }
.ise-skin::before {
  content: ""; position: absolute; inset: 0; padding: 1.5px; border-radius: inherit; display: none;
  background: linear-gradient(135deg, var(--ise-rim-a), var(--ise-rim-b) 30%, transparent 50%, var(--ise-rim-b) 70%, var(--ise-rim-c));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); mask-composite: exclude;
}
.ise-glass > .ise-in { position: relative; z-index: 3 }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .ise-glass { box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ise-ink) calc(18% * var(--ise-gv, 1)), transparent), 0 10px 30px -10px rgb(30 20 80 / calc(.34 * var(--ise-gv, 1))), 0 2px 8px -2px rgb(30 20 80 / calc(.12 * var(--ise-gv, 1))) }
  .ise-bd { -webkit-backdrop-filter: blur(18px) saturate(150%); backdrop-filter: blur(18px) saturate(150%); opacity: var(--ise-gv, 1) }
  .ise-skin { background: var(--ise-glass); box-shadow: var(--ise-lit) }
  .ise-skin::before { display: block }
}
.ise[data-refract] [data-rf] > .ise-bd { backdrop-filter: var(--ise-rf) blur(.5px) saturate(135%) brightness(106%) }
:is(.dark, [data-theme="dark"]) .ise .ise-in { text-shadow: 0 1px 8px rgb(0 0 0 / .28) }

/* ---- header ---- */
.ise-head { position: absolute; left: 0; right: 0; top: 0; z-index: 3; padding: 0 12px; pointer-events: none; height: var(--ise-top) }
.ise-inner { position: relative; max-width: 720px; margin: 0 auto; height: 100% }
.ise-pill { position: absolute; left: 0; right: 0; top: 10px; height: 44px; --r: 22px; --ise-gv: clamp(0, calc(var(--ise-p) * 2.4 - .35), 1); transform: scale(calc(.94 + var(--ise-p) * .06)) }
.ise-row { position: absolute; left: 0; right: 0; top: 10px; height: 44px; padding: 0 3px; display: flex; align-items: center; justify-content: space-between; gap: 8px }
.ise-row > * { pointer-events: auto }
.ise-lead, .ise-actions { display: flex; align-items: center; gap: 6px }
.ise-title {
  position: absolute; margin: 0; pointer-events: none; width: max-content;
  left: calc(16px + var(--ise-p) * (50% - 16px)); top: calc(60px - var(--ise-p) * 38px);
  max-width: calc((1 - var(--ise-p)) * (100% - 32px) + var(--ise-p) * (100% - 2 * var(--ise-side)) / .6);
  transform-origin: calc(var(--ise-p) * 50%) 0;
  transform: translateX(calc(var(--ise-p) * -50%)) scale(calc(1 - var(--ise-p) * .4));
  font-size: clamp(24px, 6.6vw, 30px); line-height: 34px; font-weight: 600; letter-spacing: -.022em; color: var(--ise-t1); white-space: nowrap;
}
.ise-title button, .ise-title span { display: block; width: 100%; text-align: left; overflow: hidden; text-overflow: ellipsis; padding: 6px 10px; margin: -6px -10px; box-sizing: content-box; border-radius: 12px }
.ise[data-collapsed] .ise-title button { pointer-events: auto }
.ise-sub {
  position: absolute; left: 16px; right: 16px; top: 96px; color: var(--ise-t2); font-size: 13px; line-height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  opacity: clamp(0, calc(1 - var(--ise-p) * 2.6), 1); transform: translateY(calc(var(--ise-p) * -16px));
}

/* round glass buttons: their own backdrop only while they float alone, tint and rim once they sit in the bar */
.ise-act { position: relative; flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; color: var(--ise-t1); transition: transform .24s var(--ise-ease) }
.ise-act:active { transform: scale(.94) }
.ise-act .ise-bd { opacity: clamp(0, calc(1 - var(--ise-p) * 3), 1) }
.ise-act-skin { position: absolute; inset: 0; border-radius: 50%; z-index: 1; pointer-events: none; background: color-mix(in oklab, var(--ise-surface) 80%, transparent); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ise-ink) 12%, transparent) }
.ise-act svg { position: relative; z-index: 3; width: 19px; height: 19px; stroke-width: 1.9 }
.ise-act:focus-visible { outline-offset: 1px }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .ise-act .ise-bd { -webkit-backdrop-filter: blur(12px) saturate(180%); backdrop-filter: blur(12px) saturate(180%) }
  .ise-act-skin { background: color-mix(in oklab, var(--ise-surface) 40%, transparent); box-shadow: var(--ise-lit), 0 4px 12px -4px rgb(30 20 80 / .3) }
}

/* ---- footer ---- */
.ise-foot { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; padding: 0 12px 12px; pointer-events: none }
.ise-foot > .ise-inner { height: auto; pointer-events: none }
.ise-foot .ise-inner > * { pointer-events: auto }
.ise-chips { display: flex; gap: 6px; margin: 0 -2px 6px; padding: 6px 2px 4px; overflow-x: auto; scrollbar-width: none }
.ise-chips::-webkit-scrollbar { display: none }
.ise-chips[data-over] { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 26px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 26px), transparent) }
.ise-chips[data-new] { animation: ise-in .46s var(--ise-ease) backwards }
.ise-chip {
  flex: none; height: 32px; padding: 0 11px; border-radius: 16px; font-size: 13px; line-height: 32px; font-weight: 500; color: var(--ise-t1); white-space: nowrap;
  background: color-mix(in oklab, var(--ise-surface) 84%, transparent); box-shadow: var(--ise-float);
  transition: transform .24s var(--ise-ease);
}
.ise-chip:active { transform: scale(.96) }
.ise-composer { --r: 26px }
.ise-compose { display: flex; align-items: center; gap: 6px; height: 52px; padding: 6px }
.ise-input { flex: 1; min-width: 0; height: 40px; border: 0; background: none; padding: 0 6px; font: inherit; font-size: 15px; color: var(--ise-t1); outline: none }
.ise-input::placeholder { color: var(--ise-t3) }
.ise-composer:focus-within .ise-skin { box-shadow: var(--ise-lit), inset 0 0 0 1.5px color-mix(in oklab, var(--ise-accent) 55%, transparent) }
.ise-plus, .ise-send { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; transition: transform .24s var(--ise-ease), background-color .24s var(--ise-ease), color .24s var(--ise-ease) }
.ise-plus { color: var(--ise-t2); background: var(--ise-fill) }
.ise-plus svg, .ise-send svg { width: 19px; height: 19px; stroke-width: 2 }
.ise-send { color: var(--ise-on-me); background: var(--ise-me) }
.ise-send:disabled { color: var(--ise-t4); background: var(--ise-fill); cursor: default }
.ise-plus:active, .ise-send:not(:disabled):active { transform: scale(.94) }

/* ---- thread ---- */
.ise-msg { max-width: 84%; display: flex; flex-direction: column; gap: 3px; align-items: flex-start }
.ise-msg[data-side="me"] { align-self: flex-end; align-items: flex-end }
.ise-msg[data-gap] { margin-top: 8px }
.ise-msg[data-new] { animation: ise-in .46s var(--ise-ease) backwards }
@keyframes ise-in { from { opacity: 0; transform: translateY(6px); filter: blur(3px) } }
.ise-who { display: flex; align-items: center; gap: 6px; padding: 0 6px; font-size: 12px; line-height: 16px; color: var(--ise-t2); font-weight: 500 }
.ise-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap }
.ise-who time, .ise-when { color: var(--ise-t3); font-weight: 400; font-size: 12px; line-height: 16px }
.ise-tag { padding: 0 6px; border-radius: 6px; font-size: 11px; line-height: 16px; font-weight: 500; color: var(--ise-accent); background: color-mix(in oklab, var(--ise-accent) 12%, transparent) }
.ise-when { padding: 0 6px }
.ise-bubble { padding: 9px 13px 10px; border-radius: 19px; font-size: 14.5px; line-height: 20px; color: var(--ise-t1); background: var(--ise-surface); box-shadow: var(--ise-shadow); overflow-wrap: anywhere }
.ise-msg[data-side="me"] .ise-bubble { color: var(--ise-on-me); background: var(--ise-me); box-shadow: inset 0 1px 0 var(--ise-glint), 0 1px 2px rgb(0 40 120 / .2); border-bottom-right-radius: 7px }
.ise-msg[data-side="them"] .ise-bubble { border-bottom-left-radius: 7px }
.ise-note { align-self: center; margin: 8px 0 2px; padding: 2px 11px; border-radius: 999px; font-size: 12px; line-height: 20px; color: var(--ise-t2); background: color-mix(in oklab, var(--ise-surface) 70%, transparent); box-shadow: 0 0 0 .5px var(--ise-line) }
.ise-typing { display: inline-flex; gap: 4px; align-items: center; height: 38px; padding: 0 15px; border-radius: 19px; border-bottom-left-radius: 7px; background: var(--ise-surface); box-shadow: var(--ise-shadow) }
.ise-typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--ise-t3); animation: ise-dot 1.3s var(--ise-ease) infinite }
.ise-typing i:nth-child(2) { animation-delay: .16s }
.ise-typing i:nth-child(3) { animation-delay: .32s }
@keyframes ise-dot { 0%, 60%, 100% { opacity: .35; transform: none } 30% { opacity: 1; transform: translateY(-3px) } }
.ise[data-paused] .ise-typing i { animation-play-state: paused }

.ise-card { width: min(100%, 296px); border-radius: 18px; background: var(--ise-surface); box-shadow: var(--ise-shadow); overflow: hidden }
.ise-card-h { padding: 12px 14px 4px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--ise-t2) }
.ise-slots { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 10px 12px }
.ise-slot {
  flex: 1 1 74px; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 0; padding: 8px 9px; border-radius: 12px; text-align: left;
  background: var(--ise-fill); box-shadow: inset 0 0 0 .5px var(--ise-line); transition: background-color .24s var(--ise-ease), box-shadow .24s var(--ise-ease), color .24s var(--ise-ease);
}
.ise-slot b { font-weight: 500; font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; white-space: nowrap }
.ise-slot span { font-size: 12px; line-height: 16px; color: var(--ise-t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100% }
.ise-slot[aria-pressed="true"] { background: color-mix(in oklab, var(--ise-accent) 12%, transparent); box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ise-accent) 55%, transparent); color: var(--ise-accent) }
.ise-slot[aria-pressed="true"] span { color: color-mix(in oklab, var(--ise-accent) 70%, var(--ise-t2)) }
.ise-book-top { height: 5px; background: linear-gradient(90deg, var(--ise-accent), color-mix(in oklab, var(--ise-accent) 45%, var(--ise-ok))) }
.ise-book { display: flex; gap: 11px; padding: 13px 14px 12px }
.ise-tile { flex: none; width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; color: var(--ise-accent); background: color-mix(in oklab, var(--ise-accent) 12%, transparent) }
.ise-tile svg { width: 19px; height: 19px; stroke-width: 1.9 }
.ise-book-t { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 14.5px; line-height: 20px; font-weight: 500 }
.ise-ok { display: inline-flex; align-items: center; gap: 3px; padding: 0 7px 0 5px; border-radius: 999px; font-size: 12px; line-height: 18px; font-weight: 500; color: var(--ise-ok); background: color-mix(in oklab, var(--ise-ok) 12%, transparent) }
.ise-ok svg { width: 12px; height: 12px; stroke-width: 2.4 }
.ise-book-w { font-size: 13px; line-height: 18px; margin-top: 2px; font-variant-numeric: tabular-nums }
.ise-book-s { font-size: 12.5px; line-height: 18px; color: var(--ise-t2) }
.ise-next { display: flex; align-items: flex-start; gap: 8px; padding: 9px 14px 11px; border-top: 1px solid var(--ise-line); font-size: 12.5px; line-height: 18px; color: var(--ise-t2) }
.ise-next svg { flex: none; width: 15px; height: 15px; margin-top: 2px; color: var(--ise-accent); stroke-width: 1.9 }
.ise-file { display: flex; align-items: center; gap: 11px; padding: 10px 14px 10px 10px }
.ise-file-n { font-size: 13.5px; line-height: 18px; font-weight: 500; overflow-wrap: anywhere }
.ise-file-s { font-size: 12px; line-height: 16px; color: var(--ise-t3) }

/* ---- fallbacks: reduced transparency, higher contrast, forced colours, no backdrop-filter ---- */
@media (prefers-reduced-transparency: reduce) {
  .ise-bd, .ise-act .ise-bd, .ise-edge > i { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; display: none }
  .ise-skin, .ise-act-skin { background: var(--ise-solid); box-shadow: 0 0 0 1px color-mix(in oklab, var(--ise-ink) 16%, transparent) }
  .ise-skin::before { display: none }
  .ise-glass { box-shadow: 0 0 0 1px color-mix(in oklab, var(--ise-ink) 14%, transparent), 0 8px 28px rgb(0 0 0 / .2) }
  .ise-edge-top > b { background: linear-gradient(to bottom, color-mix(in oklab, var(--ise-wall) 96%, transparent), color-mix(in oklab, var(--ise-wall) 88%, transparent) 55%, transparent) }
  .ise-edge-bottom > b { background: linear-gradient(to top, color-mix(in oklab, var(--ise-wall) 96%, transparent), color-mix(in oklab, var(--ise-wall) 88%, transparent) 55%, transparent) }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .ise-edge-top > b { background: linear-gradient(to bottom, color-mix(in oklab, var(--ise-wall) 96%, transparent), color-mix(in oklab, var(--ise-wall) 88%, transparent) 55%, transparent) }
  .ise-edge-bottom > b { background: linear-gradient(to top, color-mix(in oklab, var(--ise-wall) 96%, transparent), color-mix(in oklab, var(--ise-wall) 88%, transparent) 55%, transparent) }
}
@media (prefers-contrast: more) {
  .ise-glass, .ise-act { box-shadow: 0 0 0 2px var(--ise-t2) }
  .ise-pill { opacity: var(--ise-gv, 1) }
  .ise-skin { background: var(--ise-solid) }
  .ise-bd { display: none }
  .ise-bubble { box-shadow: 0 0 0 1px var(--ise-t3) }
}
@media (forced-colors: active) {
  .ise-bd, .ise-edge, .ise-paper { display: none }
  .ise-skin { background: Canvas; box-shadow: none }
  .ise-glass, .ise-act, .ise-bubble, .ise-card, .ise-chip { border: 1px solid CanvasText; box-shadow: none }
  .ise-pill { opacity: var(--ise-gv, 1) }
}
@media (prefers-reduced-motion: reduce) {
  .ise *, .ise *::before, .ise *::after { animation-duration: 0s !important; transition: none !important }
  .ise-typing i { animation: none !important; opacity: .7 }
}
`

/* -------------------------------------------------------------------------- */
/*                       Refraction map (Chromium only)                       */
/* -------------------------------------------------------------------------- */

const mapCache = new Map<string, string>()

/**
 * A displacement map for a rounded rectangle: neutral grey in the middle, and inside the rim a vector that points inward
 * (red = x, green = y) whose strength falls off with depth. feDisplacementMap uses it to bend what is behind the bar.
 */
function refractionMap(w: number, h: number, r: number) {
  const key = `${w}x${h}x${r}`
  const hit = mapCache.get(key)
  if (hit) return hit
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""
  const img = ctx.createImageData(w, h)
  const bezel = Math.min(26, 0.62 * (Math.min(w, h) / 2))
  const hx = w / 2
  const hy = h / 2
  const vx = new Float32Array(w * h)
  const vy = new Float32Array(w * h)
  let peak = 0.0001
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hx
      const py = y + 0.5 - hy
      const qx = Math.abs(px) - (hx - r)
      const qy = Math.abs(py) - (hy - r)
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      const depth = -(Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r)
      if (depth <= 0 || depth >= bezel) continue
      let nx = 0
      let ny = 0
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(ox, oy) || 1
        nx = (ox / l) * Math.sign(px)
        ny = (oy / l) * Math.sign(py)
      } else if (qx > qy) nx = Math.sign(px)
      else ny = Math.sign(py)
      const m = Math.pow(1 - depth / bezel, 2) * Math.min(1, depth / 1.5)
      peak = Math.max(peak, m)
      const i = y * w + x
      vx[i] = -nx * m // inward
      vy[i] = -ny * m
    }
  }
  for (let i = 0; i < w * h; i++) {
    img.data[i * 4] = 128 + (vx[i] / peak) * 127
    img.data[i * 4 + 1] = 128 + (vy[i] / peak) * 127
    img.data[i * 4 + 2] = 128
    img.data[i * 4 + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  const url = canvas.toDataURL("image/png")
  if (mapCache.size >= 24) mapCache.delete(mapCache.keys().next().value as string)
  mapCache.set(key, url)
  return url
}

type NavigatorExtras = Navigator & { userAgentData?: { brands: { brand: string }[] }; connection?: { saveData?: boolean } }

/** Refraction needs backdrop-filter: url(), which only Chromium renders. Feature detection says yes in other engines too, so this checks the brand. */
function canRefract() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false
  const nav = navigator as NavigatorExtras
  if (!nav.userAgentData?.brands.some((b) => /chromium/i.test(b.brand))) return false
  const mq = (q: string) => window.matchMedia(q).matches
  if (mq("(prefers-reduced-transparency: reduce)") || mq("(prefers-reduced-motion: reduce)") || mq("(prefers-contrast: more)") || mq("(forced-colors: active)"))
    return false
  if (nav.connection?.saveData || (nav.hardwareConcurrency || 8) <= 4) return false
  return true
}

function supportsScrollTimeline() {
  return typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()") && CSS.supports("timeline-scope: --ise-tl")
}

/* -------------------------------------------------------------------------- */
/*                               Small helpers                                */
/* -------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (t: number) => t * t * (3 - 2 * t)
const noopSubscribe = () => () => {}
const serverFalse = () => false
const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** True while the element is on screen and the tab is visible. */
function useLive(ref: React.RefObject<HTMLElement | null>) {
  const [live, setLive] = React.useState(true)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let seen = true
    let visible = !document.hidden
    const sync = () => setLive(seen && visible)
    const io = new IntersectionObserver((entries) => {
      seen = entries[entries.length - 1].isIntersecting
      sync()
    })
    io.observe(el)
    const onVis = () => {
      visible = !document.hidden
      sync()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [ref])
  return live
}

/* -------------------------------------------------------------------------- */
/*                                 Glass parts                                */
/* -------------------------------------------------------------------------- */

export type ScrollEdgeGlassProps = {
  children?: React.ReactNode
  /** Corner radius in px. 999 makes a pill. */
  radius?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * A glass bar for custom footers. The backdrop layer is its own element so text above it stays sharp, the rim is a plain
 * gradient ring, and nothing here uses mix-blend-mode or isolation, which would blank the backdrop.
 */
export function ScrollEdgeGlass({ children, radius = 26, className, style }: ScrollEdgeGlassProps) {
  return (
    <div className={["ise-glass", className].filter(Boolean).join(" ")} data-ise-glass="" style={{ "--r": `${radius}px`, ...style } as React.CSSProperties}>
      <i className="ise-bd" aria-hidden="true" />
      <i className="ise-skin" aria-hidden="true" />
      <div className="ise-in">{children}</div>
    </div>
  )
}

export type ScrollEdgeActionProps = {
  /** Accessible name and tooltip. */
  label: string
  /** 19px icon, for example from lucide-react. */
  icon: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}

/** A round glass button for the bar. It floats alone while the title is large and melts into the bar once it collapses. */
export function ScrollEdgeAction({ label, icon, onClick, className }: ScrollEdgeActionProps) {
  return (
    <button type="button" className={["ise-act", className].filter(Boolean).join(" ")} aria-label={label} title={label} onClick={onClick}>
      <i className="ise-bd" aria-hidden="true" />
      <i className="ise-act-skin" aria-hidden="true" />
      {icon}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Thread                                   */
/* -------------------------------------------------------------------------- */

function SlotsCard({ card }: { card: Extract<ThreadCard, { kind: "slots" }> }) {
  const [picked, setPicked] = React.useState(card.chosen ?? "")
  return (
    <div className="ise-card">
      <div className="ise-card-h">{card.title}</div>
      <div className="ise-slots" role="group" aria-label={card.title}>
        {card.slots.map((s) => (
          <button key={s.id} type="button" className="ise-slot" aria-pressed={picked === s.id} onClick={() => setPicked(s.id)}>
            <b>{s.label}</b>
            {s.detail && <span>{s.detail}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function CardView({ card }: { card: ThreadCard }) {
  if (card.kind === "slots") return <SlotsCard card={card} />
  if (card.kind === "booking") {
    return (
      <div className="ise-card">
        <div className="ise-book-top" aria-hidden="true" />
        <div className="ise-book">
          <span className="ise-tile" aria-hidden="true">
            <CalendarCheck />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="ise-book-t">
              {card.title}
              <span className="ise-ok">
                <Check aria-hidden="true" />
                {card.status ?? "Confirmed"}
              </span>
            </div>
            <div className="ise-book-w">{card.when}</div>
            <div className="ise-book-s">{card.where}</div>
          </div>
        </div>
        <div className="ise-next">
          <Bell aria-hidden="true" />
          <span>{card.consequence}</span>
        </div>
      </div>
    )
  }
  return (
    <div className="ise-card">
      <div className="ise-file">
        <span className="ise-tile" aria-hidden="true">
          <FileText />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="ise-file-n">{card.name}</div>
          <div className="ise-file-s">{card.size}</div>
        </div>
      </div>
    </div>
  )
}

export type ScrollEdgeThreadProps = {
  messages: ThreadMessage[]
  /** Name of who is typing, shown as three dots at the end. */
  typing?: string | null
  /** Ids of messages that should blur in when they mount. */
  freshIds?: ReadonlySet<string>
}

/** A chat thread to drop inside `ScrollEdge`. It is what the component shows by default. */
export function ScrollEdgeThread({ messages, typing, freshIds }: ScrollEdgeThreadProps) {
  const keys = messages.map((m) => (m.side === "note" ? "" : `${m.side}:${m.author ?? ""}`))
  return (
    <div className="ise-flow" role="log" aria-label="Messages">
      {messages.map((m, i) => {
        if (m.side === "note") {
          return (
            <div key={m.id} className="ise-note" data-new={freshIds?.has(m.id) ? "" : undefined}>
              {m.text}
            </div>
          )
        }
        const head = keys[i] !== keys[i - 1]
        return (
          <div key={m.id} className="ise-msg" data-side={m.side} data-gap={head ? "" : undefined} data-new={freshIds?.has(m.id) ? "" : undefined}>
            {m.side === "them" && head && m.author && (
              <div className="ise-who">
                {m.author}
                {m.role && <span className="ise-tag">{m.role}</span>}
                {m.time && <time>{m.time}</time>}
              </div>
            )}
            {m.text && (
              <div className="ise-bubble">
                {m.side === "me" && <span className="ise-sr">You said: </span>}
                {m.text}
              </div>
            )}
            {m.card && <CardView card={m.card} />}
            {m.side === "me" && m.time && <div className="ise-when">{m.time}</div>}
          </div>
        )
      })}
      {typing && (
        <div className="ise-msg" data-side="them" data-gap="">
          <div className="ise-who">
            {typing}
            <span className="ise-sr"> is typing</span>
          </div>
          <div className="ise-typing" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 The component                              */
/* -------------------------------------------------------------------------- */

/**
 * A scroll area with soft glass edges. A large title collapses into a glass bar as you scroll, content slides under it
 * through a progressive blur (stacked, masked backdrop layers), and a floating glass bar at the bottom shares the same edge.
 * With no props it shows a support thread for Northwind Clinics.
 */
export function ScrollEdge({
  title = "Northwind Clinics",
  subtitle = "Support with Atlas and the front desk",
  leading,
  actions,
  children,
  footer,
  messages,
  typing,
  suggestions,
  placeholder = "Reply to Atlas",
  onSend,
  autoReply,
  onAttach,
  backdrop,
  edge = "progressive",
  autoScroll,
  collapseAt = 72,
  refraction = true,
  height,
  label = "Support thread",
  scrollRef,
  onCollapsedChange,
  className,
  style,
}: ScrollEdgeProps) {
  const demo = children === undefined
  const auto = autoScroll ?? demo
  const speed = typeof auto === "number" ? auto : auto ? 84 : 0

  const frameRef = React.useRef<HTMLDivElement>(null)
  const scrollEl = React.useRef<HTMLDivElement>(null)
  const footRef = React.useRef<HTMLDivElement>(null)
  const timers = React.useRef<number[]>([])
  const headRef = React.useRef<HTMLElement>(null)
  const topRef = React.useRef<HTMLDivElement>(null)
  const botRef = React.useRef<HTMLDivElement>(null)
  const seq = React.useRef(0)
  const collapsedRef = React.useRef(false)
  const userTook = React.useRef(false)
  const holding = React.useRef(false)
  const busy = React.useRef(false)
  const live = useLive(frameRef)

  // The server and the first client render say "no", then React re-renders with the real answer, so hydration never mismatches.
  const native = React.useSyncExternalStore(noopSubscribe, supportsScrollTimeline, serverFalse)
  const canGlassRefract = React.useSyncExternalStore(noopSubscribe, canRefract, serverFalse)
  const refract = refraction && canGlassRefract
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const [filters, setFilters] = React.useState<Record<number, { id: string; w: number; h: number; url: string; scale: number }>>({})
  const [collapsed, setCollapsed] = React.useState(false)
  const [extra, setExtra] = React.useState<ThreadMessage[]>([])
  const [typingCount, setTypingCount] = React.useState(0)
  const [draft, setDraft] = React.useState("")
  const replyOn = autoReply ?? messages === undefined
  const hasFoot = footer === undefined ? demo : Boolean(footer)

  React.useImperativeHandle(scrollRef, () => scrollEl.current as HTMLDivElement)

  const onCollapsedRef = React.useRef(onCollapsedChange)
  React.useEffect(() => {
    onCollapsedRef.current = onCollapsedChange
  })

  /* -- scroll progress: native scroll timeline when the browser has one, otherwise a passive listener that writes the same variables -- */
  React.useEffect(() => {
    const el = scrollEl.current
    const targets = [headRef.current, topRef.current, botRef.current]
    if (!el || targets.some((t) => !t)) return
    const [head, top, bot] = targets as HTMLElement[]
    if (native) {
      for (const t of targets as HTMLElement[]) {
        t.style.removeProperty("--ise-p")
        t.style.removeProperty("--ise-q")
      }
    }
    const update = () => {
      const st = el.scrollTop
      const p = clamp01(st / collapseAt)
      if (!native) {
        const pv = p.toFixed(3)
        head.style.setProperty("--ise-p", pv)
        top.style.setProperty("--ise-p", pv)
        bot.style.setProperty("--ise-q", clamp01((el.scrollHeight - el.clientHeight - st) / 64).toFixed(3))
      }
      const next = p > 0.55
      if (next !== collapsedRef.current) {
        collapsedRef.current = next
        setCollapsed(next)
        onCollapsedRef.current?.(next)
      }
    }
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [native, collapseAt])

  /* -- the title stays centred in the room both sides of the bar leave it -- */
  React.useEffect(() => {
    const frame = frameRef.current
    const head = headRef.current
    const lead = head?.querySelector<HTMLElement>(".ise-lead")
    const act = head?.querySelector<HTMLElement>(".ise-actions")
    if (!frame || !lead || !act) return
    const sync = () => frame.style.setProperty("--ise-side", `${Math.max(lead.offsetWidth, act.offsetWidth) + 11}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(lead)
    ro.observe(act)
    return () => ro.disconnect()
  }, [])

  /* -- the footer's height decides where the thread stops and how tall the bottom edge is; the quick replies fade out when they overflow -- */
  const chipKey = suggestions ? suggestions.join("|") : extra.length ? "next" : "first"
  React.useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const foot = footRef.current
    if (!foot) {
      frame.style.setProperty("--ise-foot", "0px")
      return
    }
    const sync = () => {
      frame.style.setProperty("--ise-foot", `${foot.offsetHeight}px`)
      const chips = foot.querySelector<HTMLElement>(".ise-chips")
      if (chips) {
        if (chips.scrollWidth > chips.clientWidth + 1) chips.setAttribute("data-over", "")
        else chips.removeAttribute("data-over")
      }
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(foot)
    return () => ro.disconnect()
  }, [hasFoot, chipKey])

  /* -- a still, meaningful frame for reduced motion: already scrolled, so the bar and the soft edges show -- */
  React.useLayoutEffect(() => {
    const el = scrollEl.current
    if (el && demo && prefersReduced()) el.scrollTop = 300
  }, [demo])

  React.useEffect(() => {
    busy.current = extra.length > 0 || draft.length > 0
  }, [extra, draft])
  React.useEffect(() => {
    userTook.current = false
  }, [speed])

  /* -- auto scroll: hold on the large title, fold it slowly, then down at a steady pace, rest, glide back up. The first touch, key or wheel ends it for good. -- */
  React.useEffect(() => {
    const el = scrollEl.current
    const frame = frameRef.current
    if (!el || !frame || !speed || !live || prefersReduced()) return
    const take = () => {
      userTook.current = true
    }
    const hold = (v: boolean) => () => {
      holding.current = v
    }
    const holdIn = hold(true)
    const holdOut = hold(false)
    const hoverIn = (e: PointerEvent) => {
      if (e.pointerType === "mouse") holding.current = true
    }
    const takeEvs = ["wheel", "pointerdown", "touchstart", "keydown"] as const
    takeEvs.forEach((e) => frame.addEventListener(e, take, { passive: true }))
    frame.addEventListener("focusin", holdIn)
    frame.addEventListener("focusout", holdOut)
    frame.addEventListener("pointerenter", hoverIn)
    frame.addEventListener("pointerleave", holdOut)
    let raf = 0
    let phase: "top" | "down" | "bottom" | "up" = el.scrollTop < 2 ? "top" : "down"
    let since = performance.now()
    let last = since
    let pos = el.scrollTop
    let upFrom = 0
    const tick = (now: number) => {
      if (userTook.current) return
      raf = requestAnimationFrame(tick)
      const dt = Math.min(48, now - last)
      last = now
      if (holding.current || busy.current) {
        pos = el.scrollTop
        phase = pos < 2 ? "top" : "down"
        since = now
        return
      }
      const reach = Math.max(0, el.scrollHeight - el.clientHeight)
      if (phase === "top" && now - since > 1700) {
        phase = "down"
        since = now
      } else if (phase === "down") {
        const ramp = smooth(clamp01((now - since) / 900))
        const fold = 0.38 + 0.62 * smooth(clamp01(pos / (collapseAt * 1.5)))
        const end = clamp01((reach - pos) / 180)
        pos = Math.min(reach, pos + speed * Math.max(0.1, Math.min(ramp, fold, end)) * (dt / 1000))
        el.scrollTop = pos
        if (pos >= reach - 0.5) {
          phase = "bottom"
          since = now
        }
      } else if (phase === "bottom" && now - since > 2400) {
        phase = "up"
        since = now
        upFrom = pos
      } else if (phase === "up") {
        const t = Math.min(1, (now - since) / 2100)
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        pos = upFrom * (1 - e)
        el.scrollTop = pos
        if (t >= 1) {
          phase = "top"
          since = now
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      takeEvs.forEach((e) => frame.removeEventListener(e, take))
      frame.removeEventListener("focusin", holdIn)
      frame.removeEventListener("focusout", holdOut)
      frame.removeEventListener("pointerenter", hoverIn)
      frame.removeEventListener("pointerleave", holdOut)
    }
  }, [speed, live, collapseAt])

  /* -- tier 2 glass: one displacement map per bar size, one SVG filter per map -- */
  const footKey = footer === undefined ? "d" : footer === null ? "n" : "c"
  React.useEffect(() => {
    const frame = frameRef.current
    if (!refract || !frame) return
    const apply = (el: HTMLElement, slot: number) => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (w < 24 || h < 24) return
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2, w / 2, h / 2)
      const url = refractionMap(w, h, r)
      if (!url) return
      const id = `ise-${uid}-${w}x${h}`
      const scale = Math.round(Math.min(60, Math.max(34, h * 0.9)))
      setFilters((prev) => (prev[slot]?.id === id ? prev : { ...prev, [slot]: { id, w, h, url, scale } }))
      el.style.setProperty("--ise-rf", `url(#${id})`)
      el.setAttribute("data-rf", "")
    }
    const bars = Array.from(frame.querySelectorAll<HTMLElement>("[data-ise-glass]"))
    const ro = new ResizeObserver((entries) => entries.forEach((e) => apply(e.target as HTMLElement, bars.indexOf(e.target as HTMLElement))))
    bars.forEach((b) => ro.observe(b))
    return () => {
      ro.disconnect()
      bars.forEach((b) => {
        b.removeAttribute("data-rf")
        b.style.removeProperty("--ise-rf")
      })
    }
  }, [refract, footKey, uid])

  React.useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  const toBottom = () => {
    const el = scrollEl.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReduced() ? "auto" : "smooth" })
  }
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    onSend?.(t)
    setDraft("")
    if (!demo || !replyOn) return
    const n = seq.current++
    setExtra((p) => [...p, { id: `u${n}`, side: "me", text: t, time: "Just now" }])
    requestAnimationFrame(toBottom)
    later(() => {
      setTypingCount((c) => c + 1)
      requestAnimationFrame(toBottom)
    }, 600)
    later(() => {
      setTypingCount((c) => Math.max(0, c - 1))
      setExtra((p) => [...p, { id: `a${n}`, side: "them", author: "Atlas", role: "AI", text: REPLIES[t] ?? FALLBACK_REPLY, time: "Just now" }])
      requestAnimationFrame(toBottom)
    }, 2300)
  }

  const typingName = typing !== undefined ? typing : messages === undefined && extra.length === 0 ? "Atlas" : null
  const showTyping = typingCount > 0 ? "Atlas" : typingName
  const fresh = React.useMemo(() => new Set(extra.map((m) => m.id)), [extra])
  const thread = [...(messages ?? DEFAULT_MESSAGES), ...extra]
  const chips = suggestions ?? (extra.length > 0 ? NEXT_CHIPS : FIRST_CHIPS)

  const leadingNode = leading ?? <ScrollEdgeAction label="Back to inbox" icon={<ChevronLeft />} />
  const actionsNode = actions ?? (
    <>
      <ScrollEdgeAction label="Call the clinic" icon={<Phone />} />
    </>
  )

  const footerNode =
    footer === undefined ? (
      demo ? (
        <>
          {chips.length > 0 && (
            <div key={chipKey} className="ise-chips" role="group" aria-label="Quick replies" data-new={extra.length > 0 ? "" : undefined}>
              {chips.map((s) => (
                <button key={s} type="button" className="ise-chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <ScrollEdgeGlass radius={26} className="ise-composer">
            <form
              className="ise-compose"
              onSubmit={(e) => {
                e.preventDefault()
                send(draft)
              }}
            >
              {onAttach ? (
                <button type="button" className="ise-plus" aria-label="Attach a file" onClick={onAttach}>
                  <Plus aria-hidden="true" />
                </button>
              ) : (
                <span className="ise-plus" aria-hidden="true">
                  <Plus />
                </span>
              )}
              <input
                className="ise-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                aria-label="Message"
                enterKeyHint="send"
                autoComplete="off"
              />
              <button type="submit" className="ise-send" aria-label="Send message" disabled={!draft.trim()}>
                <ArrowUp aria-hidden="true" />
              </button>
            </form>
          </ScrollEdgeGlass>
        </>
      ) : null
    ) : (
      footer
    )

  const frameStyle = {
    ...(height !== undefined ? { "--ise-h": typeof height === "number" ? `${height}px` : height } : null),
    "--ise-range": `${collapseAt}px`,
    ...style,
  } as React.CSSProperties

  return (
    <div
      ref={frameRef}
      className={["ise", className].filter(Boolean).join(" ")}
      style={frameStyle}
      data-edge={edge}
      data-native={native ? "" : undefined}
      data-collapsed={collapsed ? "" : undefined}
      data-nofoot={hasFoot ? undefined : ""}
      data-refract={refract ? "" : undefined}
      data-paused={live ? undefined : ""}
    >
      <style href="scroll-edge" precedence="default">
        {STYLES}
      </style>
      <div className="ise-clip">
        {refract && Object.keys(filters).length > 0 && (
          <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
            <defs>
              {Object.values(filters).map((f) => (
                <filter key={f.id} id={f.id} x="0" y="0" width={f.w} height={f.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feImage href={f.url} x="0" y="0" width={f.w} height={f.h} preserveAspectRatio="none" result="map" />
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={f.scale} xChannelSelector="R" yChannelSelector="G" />
                </filter>
              ))}
            </defs>
          </svg>
        )}

        {backdrop && (
          <div className="ise-wall" aria-hidden="true">
            {backdrop}
          </div>
        )}

        <div ref={scrollEl} className="ise-scroll" tabIndex={0} role="region" aria-label={label}>
          <div className="ise-sheet">
            {!backdrop && <div className="ise-paper" aria-hidden="true" />}
            {demo ? <ScrollEdgeThread messages={thread} typing={showTyping} freshIds={fresh} /> : children}
          </div>
        </div>

        <div ref={topRef} className="ise-edge ise-edge-top" aria-hidden="true">
          {BLUR.map((b) => (
            <i key={b} />
          ))}
          <b />
        </div>
        <div ref={botRef} className="ise-edge ise-edge-bottom" aria-hidden="true">
          {BLUR.map((b) => (
            <i key={b} />
          ))}
          <b />
        </div>

        <header ref={headRef} className="ise-head">
          <div className="ise-inner">
            <div className="ise-pill ise-glass" data-ise-glass="" aria-hidden="true">
              <i className="ise-bd" />
              <i className="ise-skin" />
            </div>
            <div className="ise-row">
              <div className="ise-lead">{leadingNode}</div>
              <div className="ise-actions" role="group" aria-label="Thread actions">
                {actionsNode}
              </div>
            </div>
            <h2 className="ise-title">
              {collapsed ? (
                <button
                  type="button"
                  onClick={() => scrollEl.current?.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" })}
                  aria-label={`${title}, scroll to top`}
                >
                  {title}
                </button>
              ) : (
                <span>{title}</span>
              )}
            </h2>
            {subtitle && <p className="ise-sub">{subtitle}</p>}
          </div>
        </header>

        {hasFoot && footerNode && (
          <div ref={footRef} className="ise-foot">
            <div className="ise-inner">{footerNode}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScrollEdge

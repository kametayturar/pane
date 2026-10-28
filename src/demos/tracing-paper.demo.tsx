import * as React from "react"

import { TracingPaper, type TracingChange } from "@/components/ui/tracing-paper"

export const notes = [
  "The new version sits on a sheet laid over the old one. Both are real markup. The stage takes the height of the taller one (measured in a layout effect, before paint), the sheet is position:absolute, and how far it reaches is one registered CSS number, --itp-pos (@property with syntax \"<number>\"). Because the browser knows it is a number it can animate it, so the keyboard steps and the first lift are CSS transitions, not JS frames. While you drag, a data-drag attribute switches the transition off so the fold sticks to your finger.",
  "The fold is a mask-image: a linear-gradient that goes from opaque to transparent over 9px and ends at the edge. The sheet is 97% opaque, so the old page never shows through as ghost text. The edge leans because the sheet wrapper is skewX() by atan(16px / height), and the content inside is skewed back by the same angle so the text stays square. The shaded bend, the lit lip, the crease and the cast shadow are four gradient strips that read the same --itp-e variable.",
  "Changed regions are measured, not hand-placed. Each version marks changed elements with data-tp, and getBoundingClientRect reads their boxes. A ResizeObserver, a MutationObserver and the fonts 'loadingdone' event all trigger a re-measure, so the outlines follow reflow. Dashed red is the old, solid green the new, and the badges carry the same numbers as the list, so a change is found by number as well as by colour.",
  "\"Show only changes\" is an SVG <mask>: a white rectangle with a black rounded hole for every measured box, filled with the surface colour and faded in. Selecting a change parks the fold just past the new box (a small function maps a pixel to the overshooting scale the edge is drawn on) and floats a Was and Now card over the page, so nothing below it moves.",
  "Dragging uses pointer capture on the stage and the ruler. Touch waits for sideways movement before taking the fold, because the page also uses touch-action: pan-y for vertical scrolling. The grabber is a role=\"slider\" with arrow keys (5% steps, Shift for 1%, Home and End). Text on the accent button picks black or white with the CSS relative colour oklch(from ...), so it stays readable in Classic, Mono and Glass. Reduced motion shows the settled frame.",
]

/* ---------- second scene: a reminder email from Northwind Clinics ---------- */

const MAIL_CSS = `
.tpm { display: grid; grid-template-columns: 210px minmax(0, 1fr); color: var(--itp-t1); font-size: 15px; line-height: 24px }
.tpm-side { display: flex; flex-direction: column; gap: 2px; padding: 20px 12px; border-right: 1px solid var(--itp-line); background: color-mix(in oklab, var(--itp-ink) 2.5%, transparent) }
.tpm-side h4 { margin: 0 0 8px 10px; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--itp-t3) }
.tpm-row { display: grid; gap: 0; padding: 8px 10px; border-radius: 8px; font-size: 13px; line-height: 18px }
.tpm-row[data-on] { background: var(--itp-fill) }
.tpm-row b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500 }
.tpm-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--itp-t3) }
.tpm-main { display: flex; flex-direction: column; gap: 16px; padding: 26px 40px 40px }
.tpm-top { display: flex; align-items: center; gap: 12px; color: var(--itp-t3); font-size: 12.5px; line-height: 17px }
.tpm-top b { color: var(--itp-t1); font-weight: 500; font-size: 14px }
.tpm-top time { margin-left: auto }
.tpm-av { display: grid; place-items: center; flex: none; width: 34px; height: 34px; border-radius: 17px; background: color-mix(in oklab, var(--itp-add) 18%, var(--itp-surface)); color: var(--itp-add); font-size: 12px; font-weight: 600 }
.tpm-subj { margin: 6px 0 0; font-size: 21px; line-height: 28px; font-weight: 500; letter-spacing: -.015em }
.tpm p { margin: 0 }
.tpm-visit { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 14px; background: var(--itp-surface); box-shadow: var(--itp-shadow), 0 12px 26px -16px rgb(0 0 0 / .2) }
.tpm-date { display: grid; place-items: center; flex: none; width: 54px; height: 58px; border-radius: 11px; background: color-mix(in oklab, var(--itp-btn) 12%, var(--itp-surface)); color: var(--itp-accent) }
.tpm-date small { margin-bottom: -6px; font-size: 11px; line-height: 14px; font-weight: 600; letter-spacing: .05em }
.tpm-date b { font-size: 24px; line-height: 30px; font-weight: 500; font-variant-numeric: tabular-nums }
.tpm-visit div:last-child { display: grid; gap: 1px; font-size: 14px; line-height: 21px }
.tpm-visit div:last-child b { font-weight: 500 }
.tpm-visit div:last-child span { color: var(--itp-t2) }
.tpm-visit div:last-child small { font-size: 12.5px; color: var(--itp-t3) }
.tpm-btns { display: flex; flex-wrap: wrap; gap: 8px }
.tpm-btn { display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 10px; font-weight: 500; font-size: 14px }
.tpm-btn:not(.itp-primary) { background: var(--itp-fill) }
.tpm-muted { color: var(--itp-t3); font-size: 13px }
@container itps (max-width: 640px) {
  .tpm { grid-template-columns: minmax(0, 1fr) }
  .tpm-side { display: none }
  .tpm-main { gap: 14px; padding: 18px 18px 30px }
  .tpm { font-size: 14px; line-height: 22px }
  .tpm-subj { font-size: 19px; line-height: 26px }
}
`

const MailTop = () => (
  <div className="tpm-top">
    <span className="tpm-av">NC</span>
    <span>
      <b>Northwind Clinics</b>
      <br />
      to Maya Okafor
    </span>
    <time>Mon 08:00</time>
  </div>
)

const MailSide = () => (
  <div className="tpm-side">
    <h4>Inbox</h4>
    <div className="tpm-row" data-on="">
      <b>Northwind Clinics</b>
      <span>Visit reminder</span>
    </div>
    <div className="tpm-row">
      <b>Meridian Labs</b>
      <span>Your results are ready</span>
    </div>
    <div className="tpm-row">
      <b>Harbor &amp; Finch</b>
      <span>Invoice 2208 was paid</span>
    </div>
    <div className="tpm-row">
      <b>Atlas</b>
      <span>Weekly summary</span>
    </div>
  </div>
)

const MailOld = (
  <div className="tpm">
    <MailSide />
    <div className="tpm-main">
      <MailTop />
      <h3 className="tpm-subj" data-tp="subject">
        Appointment reminder
      </h3>
      <p data-tp="greeting">Dear Patient,</p>
      <p data-tp="details">
        This is a reminder that you have an appointment scheduled on 14/11 at 14:30 with Dr. Aydin at our Harbour Street location. Please arrive 15 minutes before your appointment time.
      </p>
      <p data-tp="cancel">If you need to cancel or change your appointment, please call 020 5550 1188 during office hours.</p>
      <p className="tpm-muted">Regards, Northwind Clinics</p>
    </div>
  </div>
)

const MailNew = (
  <div className="tpm">
    <MailSide />
    <div className="tpm-main">
      <MailTop />
      <h3 className="tpm-subj" data-tp="subject">
        Tuesday 14 Nov, 2:30 pm with Dr. Aydin
      </h3>
      <p data-tp="greeting">Hi Maya,</p>
      <div className="tpm-visit" data-tp="details">
        <div className="tpm-date">
          <small>NOV</small>
          <b>14</b>
        </div>
        <div>
          <b>Harbour Street clinic</b>
          <span>Tuesday, 2:30 pm with Dr. Aydin</span>
          <small>Please come 10 minutes early.</small>
        </div>
      </div>
      <p data-tp="prep">Bring your insurance card and a list of current medicines.</p>
      <div className="tpm-btns" data-tp="cancel">
        <span className="tpm-btn itp-primary">Confirm visit</span>
        <span className="tpm-btn">Reschedule</span>
      </div>
      <p className="tpm-muted">Northwind Clinics</p>
    </div>
  </div>
)

const MAIL_CHANGES: TracingChange[] = [
  { id: "subject", label: "Subject line", note: "Date and doctor", was: "Appointment reminder", now: "Tuesday 14 Nov, 2:30 pm with Dr. Aydin" },
  { id: "greeting", label: "Greeting", note: "Uses her name", was: "Dear Patient,", now: "Hi Maya," },
  { id: "details", label: "Visit details", note: "One glance", was: "Appointment scheduled on 14/11 at 14:30 with Dr. Aydin at our Harbour Street location.", now: "A card: Nov 14, Harbour Street clinic, come 10 minutes early." },
  { id: "prep", label: "What to bring", note: "Added", now: "Bring your insurance card and a list of current medicines." },
  { id: "cancel", label: "Cancel or change", note: "Call to 1 tap", was: "Call 020 5550 1188 during office hours.", now: "Confirm visit and Reschedule buttons." },
]

const SCENES = [
  { id: "site", label: "Homepage hero" },
  { id: "mail", label: "Reminder email" },
] as const

export default function Demo() {
  const [scene, setScene] = React.useState<(typeof SCENES)[number]["id"]>("site")

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-5">
      <style href="tracing-paper-demo" precedence="default">
        {MAIL_CSS}
      </style>
      <div role="group" aria-label="Edit to review" className="flex w-fit gap-1 rounded-[10px] bg-black/[.05] p-[3px] dark:bg-white/[.08]">
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scene === s.id}
            onClick={() => setScene(s.id)}
            className="h-7 cursor-pointer rounded-[7px] px-3 text-[13px] font-medium text-black/60 transition-colors outline-offset-1 focus-visible:outline-2 focus-visible:outline-[#0060e2]/60 aria-pressed:bg-white aria-pressed:text-black aria-pressed:shadow-[0_0_0_.5px_rgb(0_0_0/.06),0_1px_2px_rgb(0_0_0/.08)] dark:text-white/60 dark:aria-pressed:bg-white/15 dark:aria-pressed:text-white"
          >
            {s.label}
          </button>
        ))}
      </div>

      {scene === "site" ? (
        <TracingPaper key="site" />
      ) : (
        <TracingPaper
          key="mail"
          before={MailOld}
          after={MailNew}
          changes={MAIL_CHANGES}
          title="Reminder email, rewritten"
          agentName="Sage"
          subtitle="Sage · 5 changes · Northwind Clinics"
          consequence="Sends to 212 patients with visits next week, at 08:00 tomorrow."
          acceptedText="Accepted. Sends to 212 patients at 08:00 tomorrow."
          keptText="Kept the old email. Sage's draft stays in the template history."
        />
      )}
    </div>
  )
}

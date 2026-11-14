import { Modal } from "@/components/ui/modal"

export default function Demo() {
  return (
    <div className="flex w-full justify-center">
      <Modal />
    </div>
  )
}

export const notes = [
  "The dialog grows out of the button that opened it: on open, the trigger's `getBoundingClientRect` is measured against the dialog's own box and written to the card as `transform-origin`. The card then goes from `scale(.94)`, 4px of blur and 0 opacity to rest on the one Pane curve (about 500ms), so a button in the corner and a dialog in the middle read as one object. Closing is a quicker 160ms and never starts from scale 0.",
  "The page behind scales to .985, dims and blurs by 3px, and becomes `inert`, so nothing under the dialog can take focus. Once a person opens it (never during the demo loop), everything else in the document goes `inert` too, as `aria-modal` promises, the document stops scrolling with the scrollbar's width kept as padding, and a press anywhere outside closes it. `aria-modal` is only set while that is true, and the loop's dialog is `aria-hidden` and never announced. Focus starts on Cancel, the least destructive action, Tab wraps inside the dialog, and Escape, Cancel or a press outside put focus back on the trigger. It all runs on CSS transitions, so opening and closing mid-way reverses from where it is instead of restarting.",
  "The physics is the drag. The dialog follows the pointer 1:1 downwards and pulls against an elastic going upwards (`x * d * .55 / (d + x * .55)`). On release the last 90ms of pointer samples give a velocity: a slow drag past 110px or a quick flick past 24px sends it off the bottom with a duration set by that speed; anything else springs home from the release velocity in a small rAF integrator. Grabbing it mid-spring continues from where it is, and the scrim lightens as it leaves.",
  "With no props the card plays its own loop (press, open, hold, confirm, close, and the inbox header counts 212 archived) and stops for good at the first touch, key or focus. It also pauses off screen and in hidden tabs. Reduced motion shows the open dialog as a still frame and drops all transitions; Tab passes through it, and it becomes a real modal at the first key or press inside. Pass `open`, `onOpenChange`, `onConfirm` and your own `children` or `stage` to use it as a real modal shell.",
]

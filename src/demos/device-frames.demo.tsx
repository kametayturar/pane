import { DeviceFrames } from "@/components/ui/device-frames"

export default function Demo() {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-[880px]">
        <DeviceFrames />
      </div>
    </div>
  )
}

export const notes = [
  "The frames draw their own chrome (window controls, tab strip, address pill with a lock, island, status bar glyphs, home indicator), so the contents only ever supply the product. Both take any children and live inside a fixed design stage (760 × 460, or 360 × 470 in the compact redesign); a ResizeObserver measures the card and sets one `transform: scale()`, so nothing inside reflows between 360 and 1200px.",
  "The decisive moment is the crop. The card is the stage's mask: the browser is inset a 36px gutter from the top and left and runs off the bottom, and the phone straddles the window's margin, never its figures, and runs off the bottom too. Both rise into place once with a short blur-in, which is the only entrance. A lone frame takes `crop` (`bottom`, `right`, `fade` or `none`) and `bleed`, the share of it the card edge cuts.",
  "The built-in scene is one story across two devices: a cursor travels to Approve on a $4,860 invoice that is $180 over its PO, the row settles to a check and Friday, and 620ms later the phone's lock screen drops the notification. The cursor position is measured from the real button rect and divided by the scale, so it lands on the button at any card width. Press anywhere, or tab to a button, and the loop ends for good; Approve and Undo then work as real buttons.",
  "Pass `children` for your own window contents and `screen` for the phone. `approved` turns the loop off and drives the scene. It pauses off screen and in hidden tabs; reduced motion shows the approved frame with the notification on screen.",
]

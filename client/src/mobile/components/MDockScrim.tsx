/**
 * The screen's own background under a floating dock, fading out upwards. The
 * dock floats 12px above the screen's foot, and in that gap scrolled content
 * used to stay sharp: a pill, a name and an avatar peeking out under the bar.
 * Now the page ends where the dock begins, the way an iOS bar's scroll edge
 * does.
 *
 * The same layer as the shell's background (MobileShell), the colour and the
 * screen gradient over the whole window, masked down to the strip at the foot,
 * so the strip is exactly the colour behind it and shows no band. Above the
 * dock's middle the mask is clear, so nothing that sits above the dock (a stats
 * card, a carousel) is touched.
 */
export default function MDockScrim() {
  return (
    <div
      aria-hidden="true"
      className="m-dock-scrim pointer-events-none fixed inset-0 z-[39] bg-[color:var(--m-bg)] bg-[image:var(--m-scr)]"
    />
  );
}

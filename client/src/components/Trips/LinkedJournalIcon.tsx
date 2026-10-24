import { BookOpen, Link2 } from 'lucide-react';

/**
 * The trip's Journal tab: a book with a link on its corner, because the journal
 * is not the trip's own but one from the Journey addon tied to it. Takes the
 * props the tab bars hand a lucide icon.
 *
 * The book is masked out under the link rather than the link given a backing:
 * a backing has to match whatever the icon sits on (a card, the accent of a
 * picked tab), and the moment it does not, the link vanishes into it.
 */
export function LinkedJournalIcon({
  size = 16,
  strokeWidth = 2,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const badge = Math.round(size * 0.6);
  // The hole: a circle round the link's centre, a little wider than the link.
  const hole = `radial-gradient(circle at calc(100% + 2px) calc(100% + 1px), transparent ${badge * 0.62}px, currentColor ${badge * 0.62 + 0.5}px)`;
  return (
    // dir="ltr": the hole is cut on the right, so the link has to stay there in Arabic too.
    <span
      dir="ltr"
      className={`relative inline-flex flex-none ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <span className="inline-flex" style={{ maskImage: hole, WebkitMaskImage: hole }}>
        <BookOpen size={size} strokeWidth={strokeWidth} />
      </span>
      <Link2 size={badge} strokeWidth={strokeWidth + 0.6} className="absolute -bottom-[3px] -end-[4px]" />
    </span>
  );
}

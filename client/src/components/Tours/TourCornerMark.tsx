import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '../shared/Tooltip';

/**
 * A frosted badge on the top corner of a tour's round tile, carrying one
 * icon: a ski tour's discipline (SKI-02).
 * Its tooltip and accessible name say what the icon stands for.
 */
export function TourCornerMark({
  icon: Icon,
  label,
  size = 15,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  /** The badge's diameter in pixels, about half the tile's. */
  size?: number;
  testId: string;
}) {
  return (
    <span className="absolute -end-1 -top-1 flex">
      <Tooltip label={label}>
        <span
          data-testid={testId}
          role="img"
          aria-label={label}
          className="grid place-items-center rounded-full bg-surface-card text-info shadow-sm ring-1 ring-inset ring-edge-faint"
          style={{ width: size, height: size }}
        >
          <Icon size={Math.round(size * 0.64)} strokeWidth={2.4} aria-hidden="true" />
        </span>
      </Tooltip>
    </span>
  );
}

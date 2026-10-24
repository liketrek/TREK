// FE-ACT-BADGE-001
// ACT-01 on a tour's row: a tour with an actual track and a recording that is
// the actual track of a tour each say so with an icon, the tooltip naming which.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TourActivityBadge } from '../tourParts';

describe('TourActivityBadge (ACT-01)', () => {
  it('FE-ACT-BADGE-001: marks a tour with an actual track and a recording that is one, nothing else', () => {
    const { rerender } = render(
      <TourActivityBadge tour={{ activity_tracks: [{ id: 1, track_place_id: 9, assignment_id: null }] }} />
    );
    expect(screen.getByTestId('tour-activity-badge')).toHaveAttribute('aria-label', 'tours.activity.badgeHint');
    // The done mark, never footprints, which name a walk's moving time.
    expect(screen.getByTestId('tour-activity-badge').querySelector('svg.lucide-check-check')).not.toBeNull();
    expect(screen.getByTestId('tour-activity-badge').querySelector('svg.lucide-footprints')).toBeNull();

    rerender(<TourActivityBadge tour={{ activity_tracks: [], activity_of: 4 }} />);
    expect(screen.getByTestId('tour-activity-badge')).toHaveAttribute('aria-label', 'tours.activity.isTrackHint');

    rerender(<TourActivityBadge tour={{ activity_tracks: [], activity_of: null }} />);
    expect(screen.queryByTestId('tour-activity-badge')).toBeNull();
    rerender(<TourActivityBadge tour={{}} />);
    expect(screen.queryByTestId('tour-activity-badge')).toBeNull();
  });
});

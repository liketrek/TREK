import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TourDayRowAvatar } from '../TourDayRowFacts';
import { tourDayRowIcon } from '../tourDayRowIcon';
import { TourGradeTile } from '../tourParts';
import { SKI_DISCIPLINE_ICON, skiClassificationText, skiDisciplineOf, skiTechniqueOf } from './skiDiscipline';
import { SkiCornerMark, SkiHeadPill } from './skiMarks';

// FE-TOUR-SKI-MARK-001 to FE-TOUR-SKI-MARK-007

const t = (key: string) => key;
const skiTrack = {
  tour_type: 'ski' as const,
  max_hiking_difficulty: null,
  wanderer_ref: null,
  has_waypoints: false,
  ski_discipline: 'cross_country' as const,
  ski_technique: 'skating' as const,
};

describe('ski marks (SKI-02)', () => {
  it('FE-TOUR-SKI-MARK-001: reads the discipline of a ski track only, and the technique of cross-country only', () => {
    expect(skiDisciplineOf(skiTrack)).toBe('cross_country');
    expect(skiTechniqueOf(skiTrack)).toBe('skating');
    expect(skiTechniqueOf({ ...skiTrack, ski_discipline: 'alpine' })).toBeNull();
    expect(skiDisciplineOf({ tour_type: 'hike', ski_discipline: 'alpine' })).toBeNull();
    expect(skiDisciplineOf({ tour_type: 'ski' })).toBeNull();
    expect(skiClassificationText(skiTrack, t)).toBe(
      'tours.ski.discipline.cross_country, tours.ski.technique: tours.ski.technique.skating'
    );
    expect(skiClassificationText({ tour_type: 'ski', ski_discipline: 'touring' }, t)).toBe(
      'tours.ski.discipline.touring'
    );
    expect(skiClassificationText({ tour_type: 'run' }, t)).toBeNull();
  });

  it('FE-TOUR-SKI-MARK-002: the corner mark names the classification, and any other tour shows none', () => {
    const { container, rerender } = render(<SkiCornerMark tour={{ tour_type: 'hike' }} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SkiCornerMark tour={{ tour_type: 'ski', ski_discipline: 'snowboard' }} size={20} />);
    const mark = screen.getByRole('img', { name: 'tours.ski.discipline.snowboard' });
    expect(mark).toHaveAttribute('data-testid', 'tour-ski-mark');
    expect(mark).toHaveStyle({ width: '20px', height: '20px' });
    expect(mark.querySelector('svg.lucide-snowboard')).not.toBeNull();
    expect(mark.querySelector('svg.lucide-snowflake')).toBeNull();
  });

  it('FE-TOUR-SKI-MARK-003: the head pill names the discipline with a cross-country technique inside it', () => {
    const { container, rerender } = render(<SkiHeadPill tour={{ tour_type: 'bike' }} className="head-pill" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SkiHeadPill tour={skiTrack} className="head-pill" />);
    const pill = screen.getByTestId('tour-detail-ski');
    expect(pill).toHaveClass('head-pill');
    expect(pill).toHaveTextContent('tours.ski.discipline.cross_country');
    expect(screen.getByTestId('tour-detail-ski-technique')).toHaveTextContent('tours.ski.technique.skating');
    rerender(<SkiHeadPill tour={{ ...skiTrack, ski_discipline: 'alpine' }} className="head-pill" />);
    expect(screen.queryByTestId('tour-detail-ski-technique')).toBeNull();
  });

  it('FE-TOUR-SKI-MARK-004: a tour list tile shows the ski icon with the discipline at its corner', () => {
    render(<TourGradeTile tour={skiTrack} />);
    expect(screen.getByLabelText('tourTypes.ski')).toBeInTheDocument();
    expect(screen.getByTestId('tour-ski-mark')).toBeInTheDocument();
  });

  it('FE-TOUR-SKI-MARK-005: the day plan tile names the type and carries the mark, a ski track without one stays plain', () => {
    const { container, rerender } = render(
      <TourDayRowAvatar tour={{ ...skiTrack, ski_discipline: null, ski_technique: null }} size={32} />
    );
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'plan-tour-icon');
    expect(screen.getByRole('img', { name: 'tourTypes.ski' })).toBeInTheDocument();
    rerender(<TourDayRowAvatar tour={skiTrack} size={50} />);
    expect(screen.getByTestId('tour-ski-mark')).toHaveStyle({ width: '22px' });
  });

  it('FE-TOUR-SKI-MARK-006: each of the six disciplines has a corner glyph of its own, none the ski tile itself', () => {
    const icons = Object.values(SKI_DISCIPLINE_ICON);
    expect(icons).toHaveLength(6);
    expect(new Set(icons).size).toBe(icons.length);
    expect(icons).not.toContain(tourDayRowIcon('ski'));
    // No discipline borrows the mark of another tour type either.
    for (const type of ['hike', 'bike', 'walk', 'run', 'kayak', 'horse']) {
      expect(icons).not.toContain(tourDayRowIcon(type));
    }
  });

  it('FE-TOUR-SKI-MARK-007: snowshoeing and winter hiking are ski tours with their own marks, a hike carries none', () => {
    const { rerender } = render(<SkiCornerMark tour={{ tour_type: 'ski', ski_discipline: 'snowshoe' }} />);
    const snowshoe = screen.getByRole('img', { name: 'tours.ski.discipline.snowshoe' });
    expect(snowshoe.querySelector('svg.lucide-snowshoe')).not.toBeNull();
    // Footprints are the city walk's mark, so a snowshoe tile never carries them.
    expect(snowshoe.querySelector('svg.lucide-footprints')).toBeNull();
    rerender(<SkiCornerMark tour={{ tour_type: 'ski', ski_discipline: 'winter_hike' }} />);
    const winterHike = screen.getByRole('img', { name: 'tours.ski.discipline.winter_hike' });
    expect(winterHike.querySelector('svg.lucide-snowflake')).not.toBeNull();
    const hike = { tour_type: 'hike' as const, max_hiking_difficulty: 2, wanderer_ref: null, has_waypoints: true };
    render(<TourGradeTile tour={hike} />);
    expect(screen.queryAllByTestId('tour-ski-mark')).toHaveLength(1);
  });
});

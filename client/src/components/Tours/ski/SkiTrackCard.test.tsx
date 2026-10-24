import { fireEvent, render, screen } from '@testing-library/react';
import type { TourListItem } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { SkiTrackCard } from './SkiTrackCard';
import type { SkiClassification } from './useSkiClassification';

// FE-TOUR-SKI-CARD-001 to FE-TOUR-SKI-CARD-005

const tour = {
  place_id: 21,
  name: 'Up to the hut',
  tour_type: 'ski',
  ski_discipline: 'cross_country',
  ski_technique: 'skating',
} as TourListItem;

function classification(overrides: Partial<SkiClassification> = {}): SkiClassification {
  return {
    tour,
    canEdit: true,
    saving: false,
    draft: null,
    setDraft: vi.fn(),
    canSave: false,
    open: vi.fn(),
    close: vi.fn(),
    save: vi.fn(),
    ...overrides,
  };
}

describe('SkiTrackCard (SKI-02)', () => {
  it('FE-TOUR-SKI-CARD-001: names the discipline, the technique as a badge, and the ski time as not worked out', () => {
    render(<SkiTrackCard ski={classification()} />);
    expect(screen.getByTestId('ski-track-discipline')).toHaveTextContent('tours.ski.discipline.cross_country');
    expect(screen.getByTestId('ski-track-technique')).toHaveTextContent('tours.ski.technique.skating');
    expect(screen.getByText('tours.ski.time')).toBeInTheDocument();
    expect(screen.getByText('tours.ski.timeUnknown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tours.ski.infoLabel' })).toHaveAccessibleDescription('tours.ski.info');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-TOUR-SKI-CARD-005: says the recorded time of a track that has one, not that it is not worked out', () => {
    render(<SkiTrackCard ski={classification({ tour: { ...tour, duration: 95 } as TourListItem })} />);
    expect(screen.getByText('tours.durationMinutes')).toBeInTheDocument();
    expect(screen.queryByText('tours.ski.timeUnknown')).toBeNull();
  });

  it('FE-TOUR-SKI-CARD-002: Change opens the dialog, and is dimmed for someone who may not edit', () => {
    const ski = classification();
    const { rerender } = render(<SkiTrackCard ski={ski} />);
    fireEvent.click(screen.getByRole('button', { name: 'common.change' }));
    expect(ski.open).toHaveBeenCalledOnce();
    rerender(<SkiTrackCard ski={classification({ canEdit: false })} />);
    expect(screen.getByRole('button', { name: 'common.change' })).toBeDisabled();
  });

  it('FE-TOUR-SKI-CARD-003: the dialog saves only a complete change, and Cancel closes it', () => {
    const ski = classification({ draft: { discipline: 'cross_country', technique: 'skating' } });
    const { rerender } = render(<SkiTrackCard ski={ski} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('tours.ski.classifyTitle')).toBeInTheDocument();
    expect(screen.getByTestId('ski-classify-save')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'tours.ski.discipline.touring' }));
    expect(ski.setDraft).toHaveBeenCalledWith({ discipline: 'touring', technique: 'skating' });
    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(ski.close).toHaveBeenCalled();

    const ready = classification({ draft: { discipline: 'touring', technique: null }, canSave: true });
    rerender(<SkiTrackCard ski={ready} />);
    fireEvent.click(screen.getByTestId('ski-classify-save'));
    expect(ready.save).toHaveBeenCalledOnce();
  });

  it('FE-TOUR-SKI-CARD-004: shows nothing while no ski track is in view, and asks for a discipline a track lacks', () => {
    const { container, rerender } = render(<SkiTrackCard ski={classification({ tour: null })} />);
    expect(container).toBeEmptyDOMElement();
    const unclassified = { ...tour, ski_discipline: null, ski_technique: null };
    rerender(<SkiTrackCard ski={classification({ tour: unclassified })} />);
    expect(screen.getByTestId('ski-track-discipline')).toHaveTextContent('tours.ski.chooseDiscipline');
    expect(screen.queryByTestId('ski-track-technique')).toBeNull();
  });
});

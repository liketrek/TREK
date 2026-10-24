import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { hintWhen } from './hintWhen';
import { SourceHintPills, SourceHintTile } from './sourceHintParts';

// Rendered without the translation provider: every text reads as its key.
describe('sourceHintParts (WAN-02)', () => {
  it('names a possible change apart from a proven one, with the reason a source could not be judged', () => {
    const { rerender } = render(<SourceHintPills hint={{ state: 'possible_change', changes: [], reason: null }} />);
    expect(screen.getByTestId('source-hint-state')).toHaveAttribute('data-state', 'possible_change');
    expect(screen.getByText('wanderer.watch.state.possible_change')).toBeInTheDocument();

    rerender(<SourceHintPills hint={{ state: 'unverifiable', changes: [], reason: 'no_change_time' }} />);
    expect(screen.getByText('wanderer.watch.state.unverifiable')).toBeInTheDocument();
    expect(screen.getByText('wanderer.watch.reason.no_change_time')).toBeInTheDocument();
  });

  it('marks the tile with the state, and reads a stored instant or nothing', () => {
    const { container } = render(<SourceHintTile state="changed" />);
    expect(container.querySelector('.text-warning')).not.toBeNull();
    expect(hintWhen(null, 'en')).toBeNull();
    expect(hintWhen('not a time', 'en')).toBeNull();
    expect(hintWhen('2026-10-20T10:00:00Z', 'en')).toEqual(expect.stringContaining('Oct'));
  });
});

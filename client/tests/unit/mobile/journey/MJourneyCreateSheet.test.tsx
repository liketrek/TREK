import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../helpers/render';
import MJourneyCreateSheet from '../../../../src/mobile/screens/journey/MJourneyCreateSheet';

// FE-MOB-JRN-001 onwards

const trips = [
  { id: 1, title: 'Tokyo 2026', start_date: '2026-05-01', end_date: '2026-05-22', place_count: 101 },
  { id: 2, title: 'Germany 2027', start_date: '2027-06-01', end_date: '2027-06-04', place_count: 0 },
];

function setup(overrides: Partial<React.ComponentProps<typeof MJourneyCreateSheet>> = {}) {
  const props = {
    open: true,
    title: '',
    onTitleChange: vi.fn(),
    trips,
    selectedTripIds: new Set<number>(),
    onToggleTrip: vi.fn(),
    onCreate: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<MJourneyCreateSheet {...props} />);
  return props;
}

describe('MJourneyCreateSheet', () => {
  it('FE-MOB-JRN-001: lists the available trips and disables Create while the name is empty', () => {
    setup();
    expect(screen.getByText('Tokyo 2026')).toBeInTheDocument();
    expect(screen.getByText('Germany 2027')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('FE-MOB-JRN-002: tapping a trip card toggles its selection', () => {
    const props = setup();
    fireEvent.click(screen.getByText('Tokyo 2026'));
    expect(props.onToggleTrip).toHaveBeenCalledWith(1);
  });

  it('FE-MOB-JRN-003: Create fires once a name is set', () => {
    const props = setup({ title: 'Japan 2026' });
    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toBeEnabled();
    fireEvent.click(create);
    expect(props.onCreate).toHaveBeenCalledTimes(1);
  });
});

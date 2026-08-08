import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../helpers/render';
import MJourneyEntryCard from '../../../../src/mobile/screens/journey/MJourneyEntryCard';
import type { JourneyEntry } from '../../../../src/store/journeyStore';

// FE-MOB-JRN-004 onwards

function makeEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: 5,
    journey_id: 1,
    author_id: 1,
    type: 'entry',
    title: 'Sunrise Pier',
    story: 'A **peaceful** morning at the pier.',
    entry_date: '2026-05-04',
    location_name: 'Ginza, Japan',
    mood: 'amazing',
    weather: 'cloudy',
    visibility: 'private',
    sort_order: 0,
    photos: [],
    created_at: 0,
    updated_at: 0,
    ...overrides,
  } as JourneyEntry;
}

describe('MJourneyEntryCard', () => {
  it('FE-MOB-JRN-004: renders number badge, title, stripped story preview and location pill', () => {
    render(<MJourneyEntryCard entry={makeEntry()} number={1} onClick={() => {}} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Pier')).toBeInTheDocument();
    // Markdown is stripped for the 2-line preview.
    expect(screen.getByText(/A peaceful morning/)).toBeInTheDocument();
    expect(screen.getByText(/Ginza/)).toBeInTheDocument();
  });

  it('FE-MOB-JRN-005: tapping the card fires onClick', () => {
    const onClick = vi.fn();
    render(<MJourneyEntryCard entry={makeEntry()} number={2} onClick={onClick} />);
    fireEvent.click(screen.getByText('Sunrise Pier'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

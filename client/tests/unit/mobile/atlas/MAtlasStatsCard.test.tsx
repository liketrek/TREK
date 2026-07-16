import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../../helpers/render';
import MAtlasStatsCard from '../../../../src/mobile/screens/atlas/MAtlasStatsCard';

// FE-MOB-ATLAS-010 onwards

const stats = { totalCountries: 3, totalTrips: 2, totalPlaces: 125, totalCities: 31, totalDays: 26 };

describe('MAtlasStatsCard', () => {
  it('FE-MOB-ATLAS-010: renders the five stat columns with their values', () => {
    render(<MAtlasStatsCard stats={stats} bucketCount={0} onOpenBucket={() => {}} />);

    for (const label of ['Countries', 'Trips', 'Places', 'Cities', 'Days']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const value of ['3', '2', '125', '31', '26']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });

  it('FE-MOB-ATLAS-011: the bucket chip shows the count and opens the bucket sheet', async () => {
    const onOpenBucket = vi.fn();
    render(<MAtlasStatsCard stats={stats} bucketCount={4} onOpenBucket={onOpenBucket} />);

    const chip = screen.getByRole('button', { name: /bucket list/i });
    expect(chip).toHaveTextContent('4');
    await userEvent.click(chip);

    expect(onOpenBucket).toHaveBeenCalledTimes(1);
  });
});

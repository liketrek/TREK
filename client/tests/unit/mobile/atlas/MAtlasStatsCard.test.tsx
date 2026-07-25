import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../helpers/render';
import MAtlasStatsCard from '../../../../src/mobile/screens/atlas/MAtlasStatsCard';

// FE-MOB-ATLAS-010 onwards

const stats = { totalCountries: 3, totalTrips: 2, totalPlaces: 125, totalCities: 31, totalDays: 26 };

describe('MAtlasStatsCard', () => {
  it('FE-MOB-ATLAS-010: renders the five stat columns with their values', () => {
    render(<MAtlasStatsCard stats={stats} />);

    for (const label of ['Countries', 'Trips', 'Places', 'Cities', 'Days']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const value of ['3', '2', '125', '31', '26']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });
});

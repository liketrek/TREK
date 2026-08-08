import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../helpers/render';
import MAtlasStatsCard from '../../../../src/mobile/screens/atlas/MAtlasStatsCard';

// FE-MOB-ATLAS-010 to FE-MOB-ATLAS-012

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
    // No planned countries, no superscript — the column reads as a plain number.
    expect(screen.getByText('Countries').parentElement).toHaveTextContent(/^3Countries$/);
  });

  it('FE-MOB-ATLAS-011: hangs the planned countries off the country total as a superscript (#1048)', () => {
    render(<MAtlasStatsCard stats={{ ...stats, totalCountriesPlanned: 4 }} />);

    expect(screen.getByText('+4')).toBeInTheDocument();
    expect(screen.getByText('Countries').parentElement).toHaveTextContent(/^3\+4Countries$/);
    // Only the first column carries it — the other four stay untouched.
    expect(screen.getByText('Trips').parentElement).toHaveTextContent(/^2Trips$/);
  });

  it('FE-MOB-ATLAS-012: a zero planned count is left off entirely', () => {
    render(<MAtlasStatsCard stats={{ ...stats, totalCountriesPlanned: 0 }} />);

    expect(screen.queryByText('+0')).not.toBeInTheDocument();
    expect(screen.getByText('Countries').parentElement).toHaveTextContent(/^3Countries$/);
  });
});

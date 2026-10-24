import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import AtlasCountrySearch from './AtlasCountrySearch';
import type { AtlasPlaceHit } from './atlasModel';

const PLACE: AtlasPlaceHit = { name: 'Lisbon', address: 'Portugal', lat: 38.72, lng: -9.14 };

function renderSearch(overrides: Partial<Parameters<typeof AtlasCountrySearch>[0]> = {}) {
  const props = {
    dark: false,
    t: (key: string) => key,
    search: 'po',
    setSearch: vi.fn(),
    results: [{ code: 'PT', label: 'Portugal' }],
    setResults: vi.fn(),
    open: true,
    setOpen: vi.fn(),
    options: [],
    onSelect: vi.fn(),
    placeResults: [PLACE],
    placesLoading: false,
    onQueryChange: vi.fn(),
    onSelectPlace: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<AtlasCountrySearch {...props} />) };
}

describe('AtlasCountrySearch result rows', () => {
  it('draws a country and a place row the same way, each ending in a chevron', () => {
    renderSearch();
    const country = screen
      .getByText('Portugal', { selector: 'span.text-content' })
      .closest('button') as HTMLButtonElement;
    const place = screen.getByText('Lisbon').closest('button') as HTMLButtonElement;
    for (const row of [country, place]) {
      expect(row.style.padding).toBe('10px 12px');
      expect(row.style.borderBottom).toBe('1px solid rgba(0, 0, 0, 0.06)');
      expect(row.lastElementChild?.tagName.toLowerCase()).toBe('svg');
    }
    expect(country.querySelector('img')).toHaveAttribute('src', 'https://flagcdn.com/w40/pt.png');
    expect(place).toHaveTextContent('Portugal');
  });

  it('selects the country or the place that was clicked', () => {
    const { props } = renderSearch();
    fireEvent.click(screen.getByAltText('PT').closest('button') as HTMLButtonElement);
    expect(props.onSelect).toHaveBeenCalledWith('PT');
    fireEvent.click(screen.getByText('Lisbon').closest('button') as HTMLButtonElement);
    expect(props.onSelectPlace).toHaveBeenCalledWith(PLACE);
  });

  it('tints a row on hover in the colour of the scheme and clears it on leave', () => {
    renderSearch({ dark: true });
    const row = screen.getByText('Lisbon').closest('button') as HTMLButtonElement;
    expect(row.style.borderBottom).toBe('1px solid rgba(255, 255, 255, 0.06)');
    fireEvent.mouseEnter(row);
    expect(row.style.background).toBe('rgba(255, 255, 255, 0.06)');
    fireEvent.mouseLeave(row);
    expect(row.style.background).toBe('transparent');
  });
});

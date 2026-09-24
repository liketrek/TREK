// FE-PLANNER-LOCPICKS-001 to FE-PLANNER-LOCPICKS-003
import { toLocationPicks } from './locationPicks';

describe('toLocationPicks', () => {
  it('FE-PLANNER-LOCPICKS-001: a trip place becomes a pick with its name, coordinates and address', () => {
    expect(toLocationPicks([{ name: ' Bach Suites Saigon ', lat: '10.78', lng: 106.7, address: 'District 1' }])).toEqual([
      { name: 'Bach Suites Saigon', lat: 10.78, lng: 106.7, address: 'District 1' },
    ]);
  });

  it('FE-PLANNER-LOCPICKS-002: a place without a name or a real coordinate is not offered, never as 0,0', () => {
    expect(toLocationPicks([
      { name: 'No coordinates', lat: null, lng: null },
      { name: 'Half a coordinate', lat: 10, lng: null },
      { name: 'Blank coordinate', lat: '', lng: '' },
      { name: 'Not a number', lat: 'north', lng: 106.7 },
      { name: '   ', lat: 10, lng: 106 },
      { name: null, lat: 10, lng: 106 },
    ])).toEqual([]);
    expect(toLocationPicks(undefined)).toEqual([]);
  });

  it('FE-PLANNER-LOCPICKS-003: the same place added twice is offered once, a namesake elsewhere stays', () => {
    const picks = toLocationPicks([
      { name: 'Hotel', lat: 10, lng: 106 },
      { name: 'Hotel', lat: 10, lng: 106 },
      { name: 'Hotel', lat: 11, lng: 106 },
    ]);
    expect(picks.map(p => `${p.name}@${p.lat}`)).toEqual(['Hotel@10', 'Hotel@11']);
    expect(picks[0].address).toBeNull();
  });
});

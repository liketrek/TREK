/**
 * MAPS-SUGMERGE-001..010: the index's suggestions and Photon's in one list (#2877).
 *
 * The keystroke path asks the index with its OpenStreetMap layer and Photon at
 * once. Both carry OpenStreetMap places, so the same element can come back from
 * each side, and one list must show it once while still showing what only
 * Photon found.
 */
import { mergeSuggestions } from '../../../src/nest/maps/maps-index.helpers';
import { LEAD_TOWN_REACH_M } from '../../../src/nest/maps/maps-merge.helpers';
import type { PhotonLead } from '../../../src/nest/maps/providers/photon.mapping';

import { describe, it, expect } from 'vitest';

const row = (placeId: string, mainText: string, lat: number, lng: number, source: string) => ({
  placeId,
  mainText,
  secondaryText: '',
  source,
  lat,
  lng,
});

describe('mergeSuggestions', () => {
  it('MAPS-SUGMERGE-001: interleaves the two, the index leading', () => {
    const index = [
      row('gers:a', 'Café Kranzler', 52.5, 13.33, 'trek-places'),
      row('gers:b', 'Café Central', 52.6, 13.4, 'trek-places'),
    ];
    const photon = [
      row('way:1', 'Kranzler Eck', 52.503, 13.333, 'openstreetmap'),
      row('node:2', 'Kranzlersee', 53, 13, 'openstreetmap'),
    ];

    expect(mergeSuggestions(index, photon).map((s) => s.placeId)).toEqual(['gers:a', 'way:1', 'gers:b', 'node:2']);
  });

  it("MAPS-SUGMERGE-002: drops Photon's copy of an element the layer already listed", () => {
    const index = [row('node:9712313', 'Tokio Hauptbahnhof', 35.6811816, 139.76598265, 'openstreetmap')];
    // Photon names it in a different language, so only the id says it is one place.
    const photon = [row('node:9712313', 'Tokyo Station', 35.6812, 139.7671, 'openstreetmap')];

    expect(mergeSuggestions(index, photon)).toEqual(index);
  });

  it('MAPS-SUGMERGE-003: drops a Photon row for a place the index lists by the search-list rule', () => {
    const index = [row('gers:a', 'Brandenburger Tor', 52.5163, 13.3777, 'trek-places')];
    const photon = [
      row('way:518071791', 'Brandenburger Tor', 52.51628, 13.37771, 'openstreetmap'),
      row('node:3', 'Hotel Adlon', 52.5164, 13.3779, 'openstreetmap'),
    ];

    // The hotel next to the gate shares the spot and nothing else, so it stays.
    expect(mergeSuggestions(index, photon).map((s) => s.placeId)).toEqual(['gers:a', 'node:3']);
  });

  it('MAPS-SUGMERGE-004: stops at the limit, and answers from Photon alone when the index found nothing', () => {
    const photon = Array.from({ length: 10 }, (_, i) => row(`node:${i}`, `Place ${i}`, i, i, 'openstreetmap'));

    expect(mergeSuggestions([], photon)).toHaveLength(8);
    expect(mergeSuggestions([], photon, 3).map((s) => s.placeId)).toEqual(['node:0', 'node:1', 'node:2']);
  });

  // Measured on "Berlin": the index's first row is a business filed under the
  // city's name, Photon's first row is the city.
  const berlin: PhotonLead = {
    placeId: 'relation:62422',
    name: 'Berlin',
    reach: 'nearby',
    kind: 'city',
    lat: 52.5173885,
    lng: 13.3951309,
    extent: [13.088345, 52.6755087, 13.7611609, 52.3382448],
  };
  const berlinIndex = [
    row('gers:office', 'Berlin', 52.512, 13.32, 'trek-places'),
    row('node:484323', 'Berlin', 52.415, 13.197, 'openstreetmap'),
    row('node:21302157', 'Berlin-Tiergarten', 52.514, 13.336, 'openstreetmap'),
  ];
  const berlinPhoton = [
    row('relation:62422', 'Berlin', 52.5173885, 13.3951309, 'openstreetmap'),
    row('relation:170184', 'Berlin', 44.4697, -71.1811, 'openstreetmap'),
  ];

  it('MAPS-SUGMERGE-005: opens on the lead and drops the rows of its name inside it', () => {
    const list = mergeSuggestions(berlinIndex, berlinPhoton, 8, { lead: berlin });

    // The "Berlin" in Kleinmachnow lies inside the city's box, so it goes too.
    expect(list.map((s) => s.placeId)).toEqual(['relation:62422', 'relation:170184', 'node:21302157']);
  });

  it('MAPS-SUGMERGE-006: a town leads only near where the traveller looks', () => {
    const tokyo = { lat: 35.68, lng: 139.76 };
    expect(mergeSuggestions(berlinIndex, berlinPhoton, 8, { lead: berlin, bias: tokyo })[0].placeId).toBe(
      'gers:office',
    );
    const potsdam = { lat: 52.39, lng: 13.06 };
    expect(mergeSuggestions(berlinIndex, berlinPhoton, 8, { lead: berlin, bias: potsdam })[0].placeId).toBe(
      'relation:62422',
    );
    expect(LEAD_TOWN_REACH_M).toBe(1_000_000);
  });

  it('MAPS-SUGMERGE-007: a country leads from anywhere', () => {
    const mauritania: PhotonLead = {
      placeId: 'relation:192763',
      name: 'Mauritania',
      reach: 'everywhere',
      kind: 'country',
      lat: 20.25,
      lng: -10.33,
      extent: [-17.2380959, 27.314942, -4.8333344, 14.7209909],
    };
    const index = [row('gers:embassy', 'Islamische Republik Mauretanien', 52.51, 13.4, 'trek-places')];
    const photon = [row('relation:192763', 'Mauritania', 20.25, -10.33, 'openstreetmap')];

    const list = mergeSuggestions(index, photon, 8, { lead: mauritania, bias: { lat: 52.5, lng: 13.4 } });
    expect(list.map((s) => s.placeId)).toEqual(['relation:192763', 'gers:embassy']);
  });

  it("MAPS-SUGMERGE-008: leads with the layer's copy where Photon's was dropped as the same element", () => {
    const index = [row('gers:shop', 'Berlin Döner', 52.52, 13.4, 'trek-places'), berlinPhoton[0]];

    const list = mergeSuggestions(index, berlinPhoton, 8, { lead: berlin });
    expect(list.map((s) => s.placeId)).toEqual(['relation:62422', 'gers:shop', 'relation:170184']);
  });

  it('MAPS-SUGMERGE-009: shows rows that read the same once, and fills the list up behind them', () => {
    const branch = (id: string, lat: number) => ({
      ...row(id, 'Tokyo Tokyo', lat, 121, 'trek-places'),
      secondaryText: 'Philippines',
    });
    const index = [branch('gers:1', 14.5), branch('gers:2', 14.6), branch('gers:3', 14.7)];
    const photon = [row('relation:1543125', 'Tokyo', 35.68, 139.76, 'openstreetmap')];

    expect(mergeSuggestions(index, photon, 2).map((s) => s.placeId)).toEqual(['gers:1', 'relation:1543125']);
  });

  it('MAPS-SUGMERGE-010: with nothing to say where the traveller is, a municipality does not lead', () => {
    const municipality: PhotonLead = { ...berlin, kind: 'municipality' };
    expect(mergeSuggestions(berlinIndex, berlinPhoton, 8, { lead: municipality })[0].placeId).toBe('gers:office');
    expect(
      mergeSuggestions(berlinIndex, berlinPhoton, 8, { lead: municipality, bias: { lat: 52.4, lng: 13.1 } })[0].placeId,
    ).toBe('relation:62422');
  });
});

/**
 * The "cities visited" extractor (#1115). Every address below is either a real one
 * from a trip or the shape a geocoder returns for that part of the world, because
 * the bug being fixed here was precisely that the old rule looked plausible against
 * invented examples and failed against actual data.
 */
import { describe, it, expect } from 'vitest';
import { cityFromAddress } from '../../../src/nest/atlas/city-from-address';

const COUNTRIES = new Set(['Japan', 'France', 'Germany', 'Italy', 'Nederland', '日本', 'Россия', 'Ελλάδα', '대한민국']);
const isCountry = (part: string) => COUNTRIES.has(part);
const city = (address: string | null | undefined, region?: string | null) =>
  cityFromAddress(address, isCountry, region);

describe('cityFromAddress', () => {
  it('takes the city, not the name of the place itself', () => {
    // The old rule scanned left to right and returned "Shibuya Sky" for this.
    expect(city('Shibuya Sky, 12, Shibuya 2, Shibuya, Tokyo, 150-0002, Japan', 'Tokyo')).toBe('Shibuya');
    expect(city('Family Mart, Omotesandō, Kita-Aoyama 3, Kita-Aoyama, Minato, Tokyo, 107-0061, Japan', 'Tokyo')).toBe('Minato');
    expect(city('BNP Paribas, Boulevard de Courcelles, Paris, Île-de-France, 75008, France', 'Île-de-France')).toBe('Paris');
  });

  it('skips the region so the city below it wins', () => {
    // Without the region hint, walking back from the end stops at the region.
    expect(city('Museum, Marienplatz, München, Bayern, 80331, Germany', 'Bayern')).toBe('München');
    expect(city('Museum, Marienplatz, München, Bayern, 80331, Germany')).toBe('Bayern');
  });

  it('reads addresses that are not written in the latin alphabet', () => {
    // Every one of these returned nothing before.
    expect(city('渋谷スカイ, 渋谷区, 東京都, 日本', '東京都')).toBe('渋谷区');
    expect(city('Красная площадь, Москва, Россия')).toBe('Москва');
    expect(city('Πλάκα, Αθήνα, Ελλάδα')).toBe('Αθήνα');
    expect(city('경복궁, 종로구, 서울특별시, 대한민국', '서울특별시')).toBe('종로구');
  });

  it('ignores postcodes, house numbers and numbered districts', () => {
    expect(city('Trevi Fountain, Piazza di Trevi, Rione II Trevi, Roma, 00187, Italy', 'Lazio')).toBe('Roma');
    expect(city('Cafe, 12, Paris 8e Arrondissement, Paris, 75008, France', 'Île-de-France')).toBe('Paris');
  });

  it('has nothing to offer for an address that is only a name', () => {
    expect(city('Eiffel Tower')).toBeNull();
    expect(city('')).toBeNull();
    expect(city(null)).toBeNull();
    expect(city(undefined)).toBeNull();
  });

  it('returns null rather than a country when everything else drops out', () => {
    expect(city('Somewhere, France')).toBeNull();
    expect(city('Somewhere, 75008, France')).toBeNull();
  });

  it('survives stray separators', () => {
    expect(city('Place, , Lyon, France')).toBe('Lyon');
    expect(city('Place, -, Lyon, France')).toBe('Lyon');
  });
});

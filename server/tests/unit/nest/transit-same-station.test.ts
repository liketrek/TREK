/**
 * Same-station transfer detection (#1065 follow-up).
 *
 * The cases below are not invented: every "real sample" is a leg taken from a
 * live api.transitous.org response on 2026-08-28, and the negatives are the
 * pairs the rule must never fold together.
 */
import { describe, it, expect } from 'vitest';
import { isSameStation, isInternalLineId } from '../../../src/nest/transit/same-station';

describe('isSameStation', () => {
  describe('identical names — the same stop reached through two feeds', () => {
    // Real samples: Berlin returns a 193 m walk between two copies of
    // Friedrichstraße, Paris a 0 m walk between two copies of Châtelet.
    it('TRANSIT-SS-001: folds two copies of one station', () => {
      expect(isSameStation('S+U Friedrichstr. Bhf (Berlin)', 'S+U Friedrichstr. Bhf (Berlin)')).toBe(true);
      expect(isSameStation('Châtelet - Les Halles', 'Châtelet - Les Halles')).toBe(true);
      expect(isSameStation('品川', '品川')).toBe(true);
    });

    it('TRANSIT-SS-002: ignores case and surrounding whitespace', () => {
      expect(isSameStation('  Berlin Hbf ', 'berlin hbf')).toBe(true);
      expect(isSameStation('Gare de Lyon', 'Gare  de   Lyon')).toBe(true);
    });
  });

  describe('a romanisation added by one feed', () => {
    // Real samples: tokyo-rail writes 品川 Shinagawa, japan-rail writes 品川.
    it('TRANSIT-SS-010: folds a CJK name against the same name plus romaji', () => {
      expect(isSameStation('品川 Shinagawa', '品川')).toBe(true);
      expect(isSameStation('東京 Tōkyō', '東京')).toBe(true);
      expect(isSameStation('大崎 Ōsaki', '大崎')).toBe(true);
      // and the other way round, since leg direction is not ours to choose
      expect(isSameStation('新宿', '新宿 Shinjuku')).toBe(true);
    });

    it('TRANSIT-SS-011: works for other non-Latin scripts too', () => {
      expect(isSameStation('서울역 Seoul Station', '서울역')).toBe(true);
      expect(isSameStation('Москва', 'Москва')).toBe(true);
    });
  });

  describe('what it must never fold — these are different places', () => {
    // The trap the rule is built around: a naive prefix match folds these two,
    // and they are a full level apart in the same building.
    it('TRANSIT-SS-020: keeps a qualifier apart from the name it qualifies', () => {
      expect(isSameStation('Berlin Hbf', 'Berlin Hbf (tief)')).toBe(false);
      expect(isSameStation('Frankfurt (Main) Hbf', 'Frankfurt (Main) Hbf tief')).toBe(false);
      expect(isSameStation('Wien Mitte', 'Wien Mitte-Landstraße')).toBe(false);
    });

    it('TRANSIT-SS-021: keeps genuinely different stations apart', () => {
      expect(isSameStation('品川', '新宿')).toBe(false);
      expect(isSameStation('Gare du Nord', 'Gare de l’Est')).toBe(false);
    });

    it('TRANSIT-SS-022: a shared CJK character is not a shared station', () => {
      // Both contain 京 but they are Tokyo and Kyoto.
      expect(isSameStation('東京', '京都')).toBe(false);
    });

    it('TRANSIT-SS-023: refuses empty and missing names rather than folding them', () => {
      expect(isSameStation(null, null)).toBe(false);
      expect(isSameStation(undefined, '品川')).toBe(false);
      expect(isSameStation('', '')).toBe(false);
      expect(isSameStation('   ', '   ')).toBe(false);
    });

    it('TRANSIT-SS-024: two Latin names sharing no core are not folded by the CJK rule', () => {
      // Neither has a non-Latin core, so only exact equality can match — which
      // is what keeps rule 2 from ever firing on Latin-script networks.
      expect(isSameStation('Shinagawa', 'Shinjuku')).toBe(false);
      expect(isSameStation('Station A', 'Station B')).toBe(false);
    });
  });
});

describe('isInternalLineId', () => {
  it('TRANSIT-LID-001: rejects the bare route id a per-departure feed leaks', () => {
    // Real sample: a Yamanote service came back as line "7896371".
    expect(isInternalLineId('7896371')).toBe(true);
    expect(isInternalLineId(' 1234567 ')).toBe(true);
  });

  it('TRANSIT-LID-002: keeps real line names, including all-numeric short ones', () => {
    // Four digits is a real bus line (Berlin 8410), so the threshold is five.
    expect(isInternalLineId('8410')).toBe(false);
    expect(isInternalLineId('S1')).toBe(false);
    expect(isInternalLineId('ICE 72')).toBe(false);
    expect(isInternalLineId('のぞみ279号')).toBe(false);
    expect(isInternalLineId('N’EX')).toBe(false);
  });

  it('TRANSIT-LID-003: absent line names are not internal ids', () => {
    expect(isInternalLineId(null)).toBe(false);
    expect(isInternalLineId(undefined)).toBe(false);
    expect(isInternalLineId('')).toBe(false);
  });
});

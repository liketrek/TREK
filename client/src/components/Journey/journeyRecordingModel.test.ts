import { describe, expect, it } from 'vitest';
import { OnlineOnlyError } from '../../repo/onlineOnly';
import {
  deviceOffsetOn,
  formatOffset,
  modeLabel,
  recordingErrorCode,
  recordingErrorText,
  sketchPaths,
  zoneOptions,
} from './journeyRecordingModel';

// FE-JRN-RECORDING-MODEL-001 to FE-JRN-RECORDING-MODEL-006

const t = (key: string) => `t:${key}`;
const httpError = (code: string) => ({ response: { data: { error: 'English', code } } });

describe('journeyRecordingModel', () => {
  it('FE-JRN-RECORDING-MODEL-001: spells an offset the way a zone is named', () => {
    expect(formatOffset(120)).toBe('UTC+02:00');
    expect(formatOffset(-210)).toBe('UTC-03:30');
    expect(formatOffset(0)).toBe('UTC+00:00');
    expect(formatOffset(345)).toBe('UTC+05:45');
    expect(deviceOffsetOn('2026-05-14')).toBe(-new Date('2026-05-14T12:00:00').getTimezoneOffset());
  });

  it('FE-JRN-RECORDING-MODEL-002: lists every zone once, marking the one of Dawarich and the one of this device', () => {
    const options = zoneOptions(t, 120, 60);
    expect(options[0]).toEqual({ value: -720, label: 'UTC-12:00' });
    expect(options[options.length - 1]).toEqual({ value: 840, label: 'UTC+14:00' });
    expect(options.find((o) => o.value === 120)).toEqual({
      value: 120,
      label: 'UTC+02:00',
      badge: 't:journey.recording.zoneSource',
    });
    expect(options.find((o) => o.value === 60)).toEqual({
      value: 60,
      label: 'UTC+01:00',
      badge: 't:journey.recording.zoneDevice',
    });
    expect(new Set(options.map((o) => o.value)).size).toBe(options.length);
    // An odd zone a device really is in still gets its row.
    expect(zoneOptions(t, null, 17).some((o) => o.value === 17)).toBe(true);
  });

  it('FE-JRN-RECORDING-MODEL-003: names the modes TREK knows and shows any other as Dawarich spells it', () => {
    expect(modeLabel('walking', t)).toBe('t:journey.recording.mode.walking');
    expect(modeLabel('hovercraft', t)).toBe('hovercraft');
  });

  it('FE-JRN-RECORDING-MODEL-004: says a refusal in the reader’s language, from the code the server sent', () => {
    expect(recordingErrorText(new OnlineOnlyError(), t)).toBe('t:dawarich.error.offline');
    expect(recordingErrorText(httpError('recording_exists'), t)).toBe('t:journey.recording.error.recording_exists');
    expect(recordingErrorCode(httpError('recording_changed'))).toBe('recording_changed');
    const echo = (key: string) => (key === 'dawarich.error.not_connected' ? 'Not connected' : key);
    expect(recordingErrorText(httpError('not_connected'), echo)).toBe('Not connected');
    expect(recordingErrorText(httpError('brand_new'), echo)).toBe('dawarich.error.unknown');
    expect(recordingErrorText(new Error('boom'), echo)).toBe('dawarich.error.unknown');
    expect(recordingErrorCode(new Error('boom'))).toBeNull();
  });

  it('FE-JRN-RECORDING-MODEL-005: draws each piece on its own, north up, inside the box', () => {
    const { paths, ends } = sketchPaths(
      [
        {
          points: [
            [45, 12],
            [45.01, 12.01],
          ],
        },
        {
          points: [
            [45.05, 12.05],
            [45.06, 12.07],
          ],
        },
      ],
      320,
      150
    );
    expect(paths).toHaveLength(2);
    expect(paths.every((d) => d.startsWith('M') && !d.includes('M', 1))).toBe(true);
    expect(ends).toHaveLength(4);
    for (const [x, y] of ends) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(320);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(150);
    }
    // The northernmost point sits higher in the box than the southernmost.
    expect(ends[3]?.[1]).toBeLessThan(ends[0]?.[1] ?? 0);
  });

  it('FE-JRN-RECORDING-MODEL-006: nothing recorded is nothing drawn, and a lone fix is no line', () => {
    expect(sketchPaths([], 320, 150)).toEqual({ paths: [], ends: [] });
    expect(sketchPaths([{ points: [[45, 12]] }], 320, 150)).toEqual({ paths: [], ends: [] });
  });
});

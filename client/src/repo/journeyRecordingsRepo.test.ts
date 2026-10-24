import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDayStays, buildRecordedDay, buildRecordingPreview } from '../../tests/helpers/journeyRecording';
import { journeyRecordingsApi } from '../api/journeyRecordings';
import { journeyRecordingsRepo } from './journeyRecordingsRepo';
import { OnlineOnlyError } from './onlineOnly';

// FE-REPO-JOURNEY-RECORDINGS-001 to FE-REPO-JOURNEY-RECORDINGS-005

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }));

const HASH = 'a'.repeat(64);

beforeEach(() => {
  network.offline = false;
  vi.restoreAllMocks();
});

describe('journeyRecordingsRepo', () => {
  it('FE-REPO-JOURNEY-RECORDINGS-001: asks nothing offline, a journey keeps no offline copy of its recorded days', async () => {
    network.offline = true;
    const list = vi.spyOn(journeyRecordingsApi, 'list');
    await expect(journeyRecordingsRepo.list(7)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(journeyRecordingsRepo.preview(7, { date: '2026-05-14', utcOffsetMinutes: 0 })).rejects.toBeInstanceOf(
      OnlineOnlyError
    );
    await expect(
      journeyRecordingsRepo.save(7, '2026-05-14', { utcOffsetMinutes: 0, expectedHash: HASH })
    ).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(journeyRecordingsRepo.remove(7, '2026-05-14')).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(list).not.toHaveBeenCalled();
  });

  it('FE-REPO-JOURNEY-RECORDINGS-002: passes every call on and answers what the contract describes', async () => {
    const day = buildRecordedDay();
    vi.spyOn(journeyRecordingsApi, 'list').mockResolvedValue({ days: [day] });
    vi.spyOn(journeyRecordingsApi, 'preview').mockResolvedValue(buildRecordingPreview());
    const save = vi.spyOn(journeyRecordingsApi, 'save').mockResolvedValue({ day, outcome: 'created' });
    const remove = vi.spyOn(journeyRecordingsApi, 'remove').mockResolvedValue(undefined);

    expect(await journeyRecordingsRepo.list(7)).toEqual([day]);
    expect((await journeyRecordingsRepo.preview(7, { date: '2026-05-14', utcOffsetMinutes: 0 })).journey.title).toBe(
      'Venice'
    );
    expect(
      (await journeyRecordingsRepo.save(7, '2026-05-14', { utcOffsetMinutes: 120, expectedHash: HASH })).outcome
    ).toBe('created');
    await journeyRecordingsRepo.remove(7, '2026-05-14');
    expect(save).toHaveBeenCalledWith(7, '2026-05-14', { utcOffsetMinutes: 120, expectedHash: HASH });
    expect(remove).toHaveBeenCalledWith(7, '2026-05-14');
  });

  it('FE-REPO-JOURNEY-RECORDINGS-003: an answer the contract does not describe fails here, not on the map', async () => {
    vi.spyOn(journeyRecordingsApi, 'list').mockResolvedValue({ days: [{ date: '2026-05-14' }] } as never);
    await expect(journeyRecordingsRepo.list(7)).rejects.toThrow();
  });

  it('FE-REPO-JOURNEY-RECORDINGS-004: reviews and takes over a day online only, parsing both answers (JRN-02)', async () => {
    const review = buildDayStays();
    vi.spyOn(journeyRecordingsApi, 'reviewDay').mockResolvedValue(review);
    const takeOver = vi
      .spyOn(journeyRecordingsApi, 'takeOverDay')
      .mockResolvedValue({ entries: [{ id: 5, title: 'San Marco', stayCount: 2 }], alreadyTaken: [], skipped: [10] });
    const body = { groups: [{ kind: 'single' as const, stays: [{ suggestionId: 13 }] }] };

    expect(await journeyRecordingsRepo.reviewDay(7, '2026-05-14')).toEqual(review);
    expect((await journeyRecordingsRepo.takeOverDay(7, '2026-05-14', body)).entries).toHaveLength(1);
    expect(takeOver).toHaveBeenCalledWith(7, '2026-05-14', body);

    network.offline = true;
    await expect(journeyRecordingsRepo.reviewDay(7, '2026-05-14')).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(journeyRecordingsRepo.takeOverDay(7, '2026-05-14', body)).rejects.toBeInstanceOf(OnlineOnlyError);
  });

  it('FE-REPO-JOURNEY-RECORDINGS-005: reads how the journey prepares its days online only, parsing the answer (JRN-03)', async () => {
    const answer = {
      enabled: true,
      connection: 'ready',
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
    } as const;
    const prep = vi.spyOn(journeyRecordingsApi, 'prep').mockResolvedValue(answer);
    expect(await journeyRecordingsRepo.prep(7)).toEqual(answer);
    expect(prep).toHaveBeenCalledWith(7, undefined);

    prep.mockResolvedValue({ ...answer, connection: 'paused' } as never);
    await expect(journeyRecordingsRepo.prep(7)).rejects.toThrow();

    network.offline = true;
    await expect(journeyRecordingsRepo.prep(7)).rejects.toBeInstanceOf(OnlineOnlyError);
  });
});

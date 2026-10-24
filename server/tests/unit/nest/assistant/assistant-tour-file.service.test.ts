/**
 * P7: a route file attached in the trip chat, as the assistant proposes it:
 * refused where tours are off, one held import per track (the GPX text on the
 * held call only), the tracks the trip has or no import takes named in the
 * read step and not proposed, at most a step's worth.
 */
import { AddonsService } from '../../../../src/nest/addons/addons.service';
import {
  foundPlaceArgs,
  IMPORT_TOUR_FILE_TOOL,
  MAX_WRITES_PER_STEP,
  READ_TOUR_FILE_TOOL,
  writeToolOf,
} from '../../../../src/nest/assistant/assistant-tools.constants';
import { AssistantTourFileService } from '../../../../src/nest/assistant/assistant-tour-file.service';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { TourFileReadService, type TourFileTrack } from '../../../../src/nest/tours/tour-file-read.service';
import { Test } from '@nestjs/testing';

import { describe, expect, it, vi } from 'vitest';

// AST-TOUR-FILE-001 to AST-TOUR-FILE-005

const track = (name: string, over: Partial<TourFileTrack> = {}): TourFileTrack => ({
  name,
  gpx: `<gpx><trk><name>${name}</name></trk></gpx>`,
  point_count: 120,
  distance_km: 8.24,
  has_heights: true,
  duplicate: false,
  ...over,
});

function file(name: string): Express.Multer.File {
  return { originalname: name, buffer: Buffer.from('<gpx/>'), size: 6 } as Express.Multer.File;
}

async function make(tracks: TourFileTrack[], opts: { tours?: boolean; whole?: boolean } = {}) {
  const read = vi.fn(async () => ({ tracks, whole: opts.whole === true }));
  const isAddonEnabled = vi.fn(async () => opts.tours !== false);
  const moduleRef = await Test.createTestingModule({
    providers: [
      AssistantTourFileService,
      { provide: TourFileReadService, useValue: { read } },
      { provide: AddonsService, useValue: { isAddonEnabled } },
    ],
  }).compile();
  return { service: moduleRef.get(AssistantTourFileService), read, isAddonEnabled };
}

describe('AssistantTourFileService', () => {
  it('AST-TOUR-FILE-001: names its read step and the error of a file without a track', async () => {
    const { service } = await make([]);
    expect(service.readTool).toBe(READ_TOUR_FILE_TOOL);
    expect(service.emptyCode).toBe('no_tracks_found');
  });

  it('AST-TOUR-FILE-002: refuses a route file where tours are off', async () => {
    const { service, isAddonEnabled } = await make([], { tours: false });
    await expect(service.ensureReadable(7, file('a.gpx'))).rejects.toBeInstanceOf(DomainError);
    expect(isAddonEnabled).toHaveBeenCalledWith('tours');
    await expect((await make([])).service.ensureReadable(7, file('a.gpx'))).resolves.toBeUndefined();
  });

  it('AST-TOUR-FILE-003: proposes one hike per track, the GPX text kept on the held call only', async () => {
    const { service, read } = await make([track('Saturday'), track('Sunday')]);
    const { found, proposals } = await service.propose(7, 5, file('weekend.gpx'));
    expect(read).toHaveBeenCalledWith(5, expect.any(Buffer), 'weekend.gpx');
    expect(proposals).toHaveLength(2);
    expect(proposals[0]).toEqual({
      toolName: IMPORT_TOUR_FILE_TOOL,
      args: {
        via: 'import_tour_gpx',
        file_name: 'weekend.gpx',
        tour_type: 'hike',
        track_name: 'Saturday',
        gpx: '<gpx><trk><name>Saturday</name></trk></gpx>',
      },
      shownArgs: { via: 'import_tour_gpx', file_name: 'weekend.gpx', tour_type: 'hike', track_name: 'Saturday' },
    });
    expect(found).toEqual({
      tracks: [
        { name: 'Saturday', distance_km: 8.2, points: 120, has_heights: true },
        { name: 'Sunday', distance_km: 8.2, points: 120, has_heights: true },
      ],
    });
  });

  it('AST-TOUR-FILE-004: names a track the trip has or no import takes, and proposes neither', async () => {
    const { service } = await make([track('Known', { duplicate: true }), track('Huge', { gpx: null }), track('New')]);
    const { found, proposals } = await service.propose(7, 5, file('mixed.kml'));
    expect(proposals.map((proposal) => proposal.args.track_name)).toEqual(['New']);
    expect(found.tracks).toEqual([
      expect.objectContaining({ name: 'Known', skipped: 'already_in_trip' }),
      expect.objectContaining({ name: 'Huge', skipped: 'too_large' }),
      expect.objectContaining({ name: 'New' }),
    ]);
    expect(found.proposed).toBe(1);
  });

  it('AST-TOUR-FILE-005: holds at most a step of tracks, runs each through import_tour_gpx with what it takes', async () => {
    const many = Array.from({ length: MAX_WRITES_PER_STEP + 3 }, (_, index) => track(`Leg ${index}`));
    const { service } = await make(many, { whole: true });
    const { found, proposals } = await service.propose(7, 5, file('legs.gpx'));
    expect(proposals).toHaveLength(MAX_WRITES_PER_STEP);
    expect(found.whole_file).toBe(true);
    const args = proposals[0]?.args ?? {};
    expect(writeToolOf(IMPORT_TOUR_FILE_TOOL, args)).toBe('import_tour_gpx');
    expect(foundPlaceArgs(args)).toEqual({ gpx: args.gpx, file_name: 'legs.gpx', tour_type: 'hike' });
    expect(writeToolOf(IMPORT_TOUR_FILE_TOOL, { ...args, via: 'delete_place' })).toBe(IMPORT_TOUR_FILE_TOOL);
  });
});

import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { aiRefusal } from '../ai-connections/ai-connections.constants';
import { TourFileReadService, type TourFileTrack } from '../tours/tour-file-read.service';
import type { AttachedFileReader, FileProposal, FileRead } from './assistant-attached-file';
import { IMPORT_TOUR_FILE_TOOL, MAX_WRITES_PER_STEP, READ_TOUR_FILE_TOOL } from './assistant-tools.constants';
import { Injectable } from '@nestjs/common';

/** The longest file name an import keeps, as import_tour_gpx takes it. */
const FILE_NAME_CHARS = 200;

/** Kilometres to a hundred metres: enough for the model to tell the tracks apart. */
function roundedKm(km: number): number {
  return Math.round(km * 10) / 10;
}

/** A track as the read step tells the model of it: what it is, and why it is not proposed where it is not. */
function trackFact(track: TourFileTrack) {
  return {
    name: track.name,
    distance_km: roundedKm(track.distance_km),
    points: track.point_count,
    has_heights: track.has_heights,
    ...(track.duplicate ? { skipped: 'already_in_trip' } : {}),
    ...(track.gpx === null ? { skipped: 'too_large' } : {}),
  };
}

/**
 * P7: a GPX, KML or KMZ file the user attached in the trip chat, read into
 * its tracks and routes (TourFileReadService, the Tours import's reader) and
 * proposed as one held change per track, which takes it in as a hike through
 * import_tour_gpx with the user's rights when they apply it (the type can be
 * changed in the planner, or by asking the assistant afterwards). A track the
 * trip has already, or one longer than one import takes, is named in the read
 * step and not proposed. Only the held call keeps the track's GPX text; the
 * thread shows its name and the file's.
 */
@Injectable()
export class AssistantTourFileService implements AttachedFileReader {
  readonly readTool = READ_TOUR_FILE_TOOL;
  readonly emptyCode = 'no_tracks_found' as const;

  constructor(
    private readonly files: TourFileReadService,
    private readonly addons: AddonsService,
  ) {}

  /** Refuses a route file where tours are off: nothing could take it in. */
  async ensureReadable(_userId: number, _file: Express.Multer.File): Promise<void> {
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.TOURS))) {
      throw aiRefusal('import_unavailable', 'Tours are not enabled on this server');
    }
  }

  async propose(_userId: number, tripId: number, file: Express.Multer.File): Promise<FileRead> {
    const read = await this.files.read(tripId, file.buffer, file.originalname);
    const fileName = file.originalname.trim().slice(0, FILE_NAME_CHARS) || 'import.gpx';
    const taken = read.tracks.filter((track) => !track.duplicate && track.gpx !== null).slice(0, MAX_WRITES_PER_STEP);
    const proposals = taken.map((track): FileProposal => {
      const shown = { via: 'import_tour_gpx', file_name: fileName, tour_type: 'hike', track_name: track.name };
      return { toolName: IMPORT_TOUR_FILE_TOOL, args: { ...shown, gpx: track.gpx }, shownArgs: shown };
    });
    return {
      found: {
        tracks: read.tracks.map(trackFact),
        // A GPX file that could not be cut into its tracks comes in as one import of all of them.
        ...(read.whole ? { whole_file: true } : {}),
        ...(read.left_out ? { left_out: read.left_out } : {}),
        ...(read.tracks.length > taken.length ? { proposed: taken.length } : {}),
      },
      proposals,
    };
  }
}

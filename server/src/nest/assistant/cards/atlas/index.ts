import type { DomainCards, ToolCards } from '../card-types';
import { ATLAS_ANSWERS } from './atlas-answers';
import { ATLAS_APPLIED, DELETE_ADDED_WISH } from './atlas-applied';
import {
  ATLAS_CHANGES,
  ATLAS_DESCRIBERS,
  loadAtlas,
  loadAtlasRegions,
  loadBucket,
  type AtlasLoaded,
} from './atlas-changes';

/**
 * The atlas in the assistant chat: the passport of the user's travels, one
 * country with its trips and places, the bucket list as wish tiles, and the
 * changes to them drawn with their flag and the counters they move. Atlas
 * rows belong to the user, not to the trip, so nothing here lands on the
 * trip's map; a receipt opens the Atlas instead. Only an added wish can be
 * taken back: an unmark hides a country and may take regions along, which no
 * mark restores.
 */

const ATLAS_WRITE = { entity: 'atlas' } as const;

const markCountry: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericCreate' },
  load: loadAtlas,
  describe: ATLAS_DESCRIBERS.mark_country_visited,
  change: ATLAS_CHANGES.mark_country_visited,
  applied: ATLAS_APPLIED.mark_country_visited,
};

const unmarkCountry: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericRemove' },
  load: loadAtlas,
  describe: ATLAS_DESCRIBERS.unmark_country_visited,
  change: ATLAS_CHANGES.unmark_country_visited,
  applied: ATLAS_APPLIED.unmark_country_visited,
};

const markRegion: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericCreate' },
  load: loadAtlasRegions,
  describe: ATLAS_DESCRIBERS.mark_region_visited,
  change: ATLAS_CHANGES.mark_region_visited,
  applied: ATLAS_APPLIED.mark_region_visited,
};

const unmarkRegion: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericRemove' },
  load: loadAtlasRegions,
  describe: ATLAS_DESCRIBERS.unmark_region_visited,
  change: ATLAS_CHANGES.unmark_region_visited,
  applied: ATLAS_APPLIED.unmark_region_visited,
};

const createWish: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericCreate' },
  load: loadBucket,
  describe: ATLAS_DESCRIBERS.create_bucket_list_item,
  change: ATLAS_CHANGES.create_bucket_list_item,
  applied: ATLAS_APPLIED.create_bucket_list_item,
  undo: DELETE_ADDED_WISH,
};

const updateWish: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericUpdate' },
  load: loadBucket,
  describe: ATLAS_DESCRIBERS.update_bucket_list_item,
  change: ATLAS_CHANGES.update_bucket_list_item,
  applied: ATLAS_APPLIED.update_bucket_list_item,
};

const deleteWish: ToolCards<AtlasLoaded> = {
  write: { ...ATLAS_WRITE, verbKey: 'genericRemove' },
  load: loadBucket,
  describe: ATLAS_DESCRIBERS.delete_bucket_list_item,
  change: ATLAS_CHANGES.delete_bucket_list_item,
  applied: ATLAS_APPLIED.delete_bucket_list_item,
};

export const ATLAS_CARDS: DomainCards = {
  id: 'atlas',
  tools: {
    get_atlas_stats: { answer: ATLAS_ANSWERS.get_atlas_stats },
    get_country_atlas_places: { answer: ATLAS_ANSWERS.get_country_atlas_places },
    list_bucket_list: { answer: ATLAS_ANSWERS.list_bucket_list },
    mark_country_visited: markCountry,
    unmark_country_visited: unmarkCountry,
    mark_region_visited: markRegion,
    unmark_region_visited: unmarkRegion,
    create_bucket_list_item: createWish,
    update_bucket_list_item: updateWish,
    delete_bucket_list_item: deleteWish,
  },
  prompt: [
    'Atlas reads and changes are drawn as cards (flags, counts, the bucket list as tiles): answer in a sentence or two instead of listing them again.',
    'update_bucket_list_item and delete_bucket_list_item take the ids list_bucket_list gives; read it first when you have none.',
  ],
  foreignIdGroups: ['atlas'],
};

import { Globe2 } from 'lucide-react';

import type { PackLook } from '../cardTypes';
import { ATLAS_PAGE } from './atlasPage';

/**
 * What the atlas brings to the chat's pure look: the names of its tools and
 * reading steps, what an applied atlas change opens (the Atlas page: a
 * country, a region or a wish has no place on the trip's map), and what to
 * ask after each of its cards. A look stays pure, icons and literals only:
 * the chat's main chunk reads every look, so whatever a look imports ships
 * with it. `mark_country_visited` keeps its core label.
 */
export const ATLAS_LOOK = {
  verbs: {},
  tools: {
    unmark_country_visited: { labelKey: 'assistant.tool.unmark_country_visited' },
    mark_region_visited: { labelKey: 'assistant.tool.mark_region_visited' },
    unmark_region_visited: { labelKey: 'assistant.tool.unmark_region_visited' },
    create_bucket_list_item: { labelKey: 'assistant.tool.create_bucket_list_item' },
    update_bucket_list_item: { labelKey: 'assistant.tool.update_bucket_list_item' },
    delete_bucket_list_item: { labelKey: 'assistant.tool.delete_bucket_list_item' },
  },
  steps: {
    get_atlas_stats: { stepKey: 'assistant.step.atlas' },
    get_country_atlas_places: { stepKey: 'assistant.step.atlasCountry' },
    list_visited_regions: { stepKey: 'assistant.step.regions' },
    locate_atlas_region: { stepKey: 'assistant.step.locateRegion' },
    list_bucket_list: { stepKey: 'assistant.step.bucketList' },
  },
  entities: {
    atlas: {
      Icon: Globe2,
      openLabelKey: 'assistant.card.atlas.open',
      open: () => ATLAS_PAGE,
    },
  },
  cards: {
    atlasPassport: {
      followUps: [
        { id: 'atlasWishes', labelKey: 'assistant.followUp.atlasWishes' },
        { id: 'atlasLeast', labelKey: 'assistant.followUp.atlasLeast' },
      ],
    },
    atlasCountry: {
      followUps: [
        { id: 'atlasMark', labelKey: 'assistant.followUp.atlasMark' },
        { id: 'atlasWish', labelKey: 'assistant.followUp.atlasWish' },
      ],
    },
    atlasBucket: {
      followUps: [
        { id: 'atlasPlanWish', labelKey: 'assistant.followUp.atlasPlanWish' },
        { id: 'atlasAddWish', labelKey: 'assistant.followUp.atlasAddWish' },
      ],
    },
  },
} satisfies PackLook<'atlasPassport' | 'atlasCountry' | 'atlasBucket'>;

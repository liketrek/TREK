import type { CardView } from '../cardTypes';
import AtlasBucketBlock, { AtlasBucketBody, AtlasBucketFacts, AtlasBucketLead } from './AtlasBucketCard';
import AtlasCountryBlock, { AtlasCountryFacts, AtlasCountryLead } from './AtlasCountryCard';
import AtlasPassportBlock from './AtlasPassportCard';
import AtlasTallyGroup from './AtlasTally';

/**
 * How the kinds of the atlas draw in the chat: the passport and the countries
 * of an answer, the bucket list as wish tiles, and inside a change card each
 * country, region or wish as a row with its flag, headed by the counters the
 * run of changes moves. This file only maps each kind to its view: the
 * components live in sibling files, since a file that exports anything besides
 * components breaks fast refresh, and lint:warnings holds
 * react-refresh/only-export-components at zero for a new file.
 */
export const ATLAS_VIEWS = {
  atlasPassport: { Block: AtlasPassportBlock },
  atlasCountry: {
    Block: AtlasCountryBlock,
    Lead: AtlasCountryLead,
    Facts: AtlasCountryFacts,
    Group: AtlasTallyGroup,
  },
  atlasBucket: {
    Block: AtlasBucketBlock,
    Lead: AtlasBucketLead,
    Facts: AtlasBucketFacts,
    Body: AtlasBucketBody,
    Group: AtlasTallyGroup,
  },
} satisfies { [K in 'atlasPassport' | 'atlasCountry' | 'atlasBucket']: CardView<K> };

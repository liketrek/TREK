import { atlasBucketCardSchema } from './atlas-bucket.card';
import { atlasCountryCardSchema } from './atlas-country.card';
import { atlasPassportCardSchema } from './atlas-passport.card';

export * from './atlas-bucket.card';
export * from './atlas-country.card';
export * from './atlas-passport.card';

/**
 * What the atlas brings to the assistant chat: the kinds of card it draws,
 * the verbs of its change cards and what an applied change of its
 * touches, beyond the core ones. cards/index.ts and assistant.schema.ts
 * spread these into the card union and the shared enums, so a new kind, verb
 * or entity is added here and nowhere else.
 */
export const ATLAS_CARD_SCHEMAS = [atlasPassportCardSchema, atlasCountryCardSchema, atlasBucketCardSchema] as const;
export const ATLAS_VERB_KEYS = [] as const;
/** A country, a region or a wish of the bucket list: the receipt opens the Atlas. */
export const ATLAS_APPLIED_ENTITIES = ['atlas'] as const;

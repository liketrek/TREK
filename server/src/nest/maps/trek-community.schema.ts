import { z } from 'zod';

/** What the service publishes for a place found elsewhere (Photon, Overpass): the overlay of its own rows. */
export const trekCommunityValuesSchema = z.object({
  contact: z
    .object({ website: z.string().nullish(), phone: z.string().nullish(), email: z.string().nullish() })
    .nullish(),
  hours: z.object({ osm: z.string().nullish() }).nullish(),
  description: z.object({ text: z.string().nullish() }).nullish(),
  images: z.array(z.object({ url: z.string().optional(), cover: z.boolean().optional() })).nullish(),
  community: z.object({ version: z.number().int().optional(), fields: z.array(z.string()).optional() }).nullish(),
});

export type TrekCommunityValues = z.infer<typeof trekCommunityValuesSchema>;

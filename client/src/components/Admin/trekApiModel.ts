import { Globe2, KeyRound, Route, Search, ShieldOff, WifiOff } from 'lucide-react';

import type { TranslationFn } from '../../types';

/**
 * Proper nouns, so they are not translated. Naming them is also a licence obligation,
 * not decoration: ODbL and CC BY-SA both require attribution wherever their content is
 * shown, and the terrain tiles the routes take their heights from ask to be named too.
 */
export const TREK_API_SOURCES = [
  'Overture Maps Foundation',
  'OpenStreetMap',
  'Wikivoyage',
  'Wikimedia',
  'Mapzen Terrain Tiles',
];

/**
 * The fields a TREK Places API result carries, for the desktop card and the phone block
 * alike. Reuses the words TREK already has for these fields wherever it has them, so
 * the chip row costs two new strings instead of ten.
 */
export function trekApiFields(t: TranslationFn): string[] {
  return [
    t('places.formName'),
    t('collections.coordinates'),
    t('places.formCategory'),
    t('places.formAddress'),
    t('admin.trekApi.fieldPhone'),
    t('common.email'),
    t('places.formWebsite'),
    t('places.formDescription'),
    t('inspector.openingHours'),
    t('admin.trekApi.fieldStableId'),
  ];
}

/** What the address search answers: an address typed, a town, the address of a point. */
export function trekApiAddressFeatures(t: TranslationFn): string[] {
  return [
    t('admin.trekApi.addrStreets'),
    t('admin.trekApi.addrTowns'),
    t('admin.trekApi.addrReverse'),
    t('admin.trekApi.addrLanguages'),
  ];
}

/** What the routing does: the three ways of getting there, what a drive can avoid, the heights. */
export function trekApiRoutingFeatures(t: TranslationFn): string[] {
  return [
    t('admin.trekApi.routeCar'),
    t('admin.trekApi.routeBike'),
    t('admin.trekApi.routeFoot'),
    t('admin.trekApi.routeAvoid'),
    t('admin.trekApi.routeElevation'),
  ];
}

/** The facts the TREK API block leads with, each with its glyph: the three services first, then the terms. */
export function trekApiFacts(t: TranslationFn) {
  return [
    { Icon: Globe2, text: t('admin.trekApi.factPlaces') },
    { Icon: Search, text: t('admin.trekApi.factAddresses') },
    { Icon: Route, text: t('admin.trekApi.factRouting') },
    { Icon: KeyRound, text: t('admin.trekApi.factNoKey') },
    { Icon: WifiOff, text: t('admin.trekApi.factOffline') },
    { Icon: ShieldOff, text: t('admin.trekApi.factPrivacy') },
  ];
}

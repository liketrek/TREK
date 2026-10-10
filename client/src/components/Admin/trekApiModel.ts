import { Globe2, KeyRound, ShieldOff, WifiOff } from 'lucide-react';

import type { TranslationFn } from '../../types';

/**
 * Proper nouns, so they are not translated. Naming them is also a licence obligation,
 * not decoration: ODbL and CC BY-SA both require attribution wherever their content is
 * shown.
 */
export const TREK_API_SOURCES = ['Overture Maps Foundation', 'OpenStreetMap', 'Wikivoyage', 'Wikimedia'];

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

/** The four facts the TREK Places API block leads with, each with its glyph. */
export function trekApiFacts(t: TranslationFn) {
  return [
    { Icon: Globe2, text: t('admin.trekApi.factPlaces') },
    { Icon: KeyRound, text: t('admin.trekApi.factNoKey') },
    { Icon: WifiOff, text: t('admin.trekApi.factOffline') },
    { Icon: ShieldOff, text: t('admin.trekApi.factPrivacy') },
  ];
}

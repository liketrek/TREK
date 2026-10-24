import type {
  BikeProfile,
  ImportableTourType,
  PaddleBoatType,
  PaddleWaterContext,
  RunProfile,
  TourGpxImportFields,
} from '@trek/shared';
import { useState } from 'react';
import { NO_SKI_CHOICE, skiChoiceMissing, skiFieldsOf, type SkiChoice } from './ski/skiChoice';

/**
 * What the GPX preview has chosen: the type to import as, and what that type
 * names besides: a paddle import its boat and water, a bike or run import its
 * profile, a ski import (SKI-02) its discipline and technique.
 */
export interface GpxImportChoices {
  type: ImportableTourType;
  boat: PaddleBoatType | null;
  water: PaddleWaterContext | null;
  bikeProfile: BikeProfile;
  runProfile: RunProfile;
  ski: SkiChoice;
}

const HIKE: TourGpxImportFields = { tour_type: 'hike' };

/** The choices a preview opens with: the fields it was preset to (ACT-01), the rest as a fresh preview has them. */
function choicesFrom(initial: TourGpxImportFields): GpxImportChoices {
  return {
    type: initial.tour_type,
    boat: initial.boat_type ?? null,
    water: initial.water_context ?? null,
    bikeProfile: initial.bike_profile ?? 'touring',
    runProfile: initial.run_profile ?? 'running',
    ski:
      initial.tour_type === 'ski'
        ? { discipline: initial.ski_discipline ?? null, technique: initial.ski_technique ?? null }
        : NO_SKI_CHOICE,
  };
}

/** What the chosen type still lacks before anything can be imported; null when nothing does. */
export function importMissing(chosen: GpxImportChoices): 'paddle' | 'ski' | null {
  if (chosen.type === 'kayak' && (chosen.boat === null || chosen.water === null)) return 'paddle';
  if (chosen.type === 'ski' && skiChoiceMissing(chosen.ski)) return 'ski';
  return null;
}

/** What the import is asked to store the tracks as: the type and the fields that type names. */
export function importFields(chosen: GpxImportChoices): TourGpxImportFields {
  const { type } = chosen;
  if (type === 'kayak' && chosen.boat && chosen.water)
    return { tour_type: 'kayak', boat_type: chosen.boat, water_context: chosen.water };
  if (type === 'bike') return { tour_type: 'bike', bike_profile: chosen.bikeProfile };
  // RUN-01: a run comes in with its profile and no pace; its time stays unknown until one is planned from it.
  if (type === 'run') return { tour_type: 'run', run_profile: chosen.runProfile };
  // ACT-01: a city walk comes in as one, not as a hike.
  if (type === 'walk') return { tour_type: 'walk' };
  // HOR-01: a recorded ride comes in as a ride, with nothing of another type.
  if (type === 'horse') return { tour_type: 'horse' };
  // SKI-02: a ski track comes in with its discipline and, for cross-country, its technique, and no time.
  const ski = type === 'ski' ? skiFieldsOf(chosen.ski) : null;
  if (ski) {
    // The classification request may clear a technique with null; an import only ever names one or none.
    const { ski_discipline, ski_technique } = ski;
    return ski_technique ? { tour_type: 'ski', ski_discipline, ski_technique } : { tour_type: 'ski', ski_discipline };
  }
  return { tour_type: 'hike' };
}

/** The preview's choices, each field set on its own; a fresh preview starts as a hike, a preset one as preset. */
export function useGpxImportChoices(initial: TourGpxImportFields = HIKE) {
  const [chosen, setChosen] = useState<GpxImportChoices>(() => choicesFrom(initial));
  const set =
    <K extends keyof GpxImportChoices>(key: K) =>
    (value: GpxImportChoices[K]) =>
      setChosen((current) => ({ ...current, [key]: value }));
  return {
    chosen,
    setType: set('type'),
    setBoat: set('boat'),
    setWater: set('water'),
    setBikeProfile: set('bikeProfile'),
    setRunProfile: set('runProfile'),
    setSki: set('ski'),
  };
}

export type GpxImportChoicesState = ReturnType<typeof useGpxImportChoices>;

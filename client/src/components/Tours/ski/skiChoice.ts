import type {
  SkiDiscipline,
  SkiRouteOptionsInput,
  SkiTechnique,
  TourListItem,
  TourSkiClassificationRequest,
} from '@trek/shared';

/**
 * SKI-02: a ski classification as a form holds it: nothing chosen until the
 * skier picks, and a technique remembered while another discipline is tried,
 * though only cross-country sends one.
 */
export interface SkiChoice {
  discipline: SkiDiscipline | null;
  technique: SkiTechnique | null;
  /** What the piste router is asked for besides the discipline; absent means its defaults. */
  options?: SkiRouteOptionsInput | null;
}

export const NO_SKI_CHOICE: SkiChoice = { discipline: null, technique: null };

/** What a choice still lacks before it can be sent: the discipline, or a cross-country technique. */
export function skiChoiceMissing(choice: SkiChoice): 'discipline' | 'technique' | null {
  if (choice.discipline === null) return 'discipline';
  return choice.discipline === 'cross_country' && choice.technique === null ? 'technique' : null;
}

/** The fields a complete choice is sent as; null while something is missing. */
export function skiFieldsOf(
  choice: SkiChoice
): Pick<TourSkiClassificationRequest, 'ski_discipline' | 'ski_technique'> | null {
  if (choice.discipline === null || skiChoiceMissing(choice)) return null;
  return choice.discipline === 'cross_country'
    ? { ski_discipline: choice.discipline, ski_technique: choice.technique }
    : { ski_discipline: choice.discipline };
}

/** The choice a saved ski track opens with, with the router options it was planned with where it keeps them. */
export function skiChoiceOf(
  tour: Partial<Pick<TourListItem, 'ski_discipline' | 'ski_technique' | 'ski_options'>>
): SkiChoice {
  const choice: SkiChoice = { discipline: tour.ski_discipline ?? null, technique: tour.ski_technique ?? null };
  return tour.ski_options ? { ...choice, options: tour.ski_options } : choice;
}

/** Whether a choice says something else than the saved track does; the technique counts for cross-country only. */
export function skiChoiceChanged(choice: SkiChoice, saved: SkiChoice): boolean {
  if (choice.discipline !== saved.discipline) return true;
  return choice.discipline === 'cross_country' && choice.technique !== saved.technique;
}

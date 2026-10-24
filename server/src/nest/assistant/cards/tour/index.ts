import type { DomainCards, ToolCards } from '../card-types';
import { recordOf } from '../card-values';
import {
  appliedTourCard,
  createCityWalkCard,
  createHikeCard,
  createHikeEffect,
  loadCreateHike,
  loadCreateTour,
  loadUpdateTour,
  updateTourCard,
  type TourLoaded,
} from './tour-change.cards';
import { TOUR_DESCRIBERS } from './tour-describe';
import { TOUR_EDIT_CARDS } from './tour-edit.cards';
import { tourListCard } from './tour-lists.cards';
import { proposalCard, savedTourCard } from './tour-route.cards';
import {
  createPaddleCard,
  createSkiCard,
  loadCreatePaddle,
  loadCreateSki,
  type SportLoaded,
} from './tour-sport-change.cards';
import { cityWalkCard, paddleCard, skiCard } from './tour-sport.cards';
import { TOUR_STOP_CARDS } from './tour-stop.cards';
import { DELETE_CREATED_TOUR, DELETE_IMPORTED_TOUR } from './tour-undo';
import { describeVisit, loadVisit, SET_VISIT_UNDO } from './tour-visit.cards';
import { IMPORT_WANDERER_TRAIL, legWayCard, roundHikeCard, wandererPreviewCard } from './tour-ways.cards';
import { TOUR_WRITE_CARDS } from './tour-writes.cards';

/**
 * The tours in the assistant chat. A tour is a place with a route: its id is
 * its place's, so a created one is taken back by deleting that place. The
 * planning tools are always asked for their line for drawing, which the
 * model never sees (every key holding `geometry` is dropped for it); the
 * cards draw it.
 */

/** The planning tools answer their line for drawing; the flag is set by the server and hidden from the model. */
const WITH_GEOMETRY: NonNullable<ToolCards['argPolicy']> = { forced: { include_geometry: true } };

/** get_tour_plan as the model reads it: without the saved line in brief, which only the card draws. */
function withoutPreview(value: unknown): unknown {
  const plan = recordOf(value);
  if (!plan.line || typeof plan.line !== 'object') return value;
  const { preview: _preview, ...line } = recordOf(plan.line);
  return { ...plan, line };
}

const createHike: ToolCards<TourLoaded> = {
  write: { verbKey: 'addTour', entity: 'tour' },
  describe: TOUR_DESCRIBERS.create_hike,
  load: loadCreateHike,
  change: createHikeCard,
  effect: createHikeEffect,
  applied: appliedTourCard,
  undo: DELETE_CREATED_TOUR,
};

/** create_tour: a bike tour or a run, drawn and taken back as a hike is, its effect on the day too. */
const createTour: ToolCards<TourLoaded> = {
  write: { verbKey: 'addTour', entity: 'tour' },
  describe: TOUR_DESCRIBERS.create_tour,
  load: loadCreateTour,
  change: createHikeCard,
  effect: createHikeEffect,
  applied: appliedTourCard,
  undo: DELETE_CREATED_TOUR,
};

/** A paddle or ski tour saved from its plan: the plan's card waiting, the receipt opening the tour, its delete the way back. */
function sportCreate(
  describe: ToolCards<SportLoaded>['describe'],
  load: NonNullable<ToolCards<SportLoaded>['load']>,
  change: NonNullable<ToolCards<SportLoaded>['change']>,
): ToolCards<SportLoaded> {
  return {
    write: { verbKey: 'addTour', entity: 'tour' },
    describe,
    load,
    change,
    effect: createHikeEffect,
    applied: appliedTourCard,
    undo: DELETE_CREATED_TOUR,
  };
}

const updateTour: ToolCards<TourLoaded> = {
  write: { verbKey: 'updateTour', entity: 'tour' },
  describe: TOUR_DESCRIBERS.update_tour,
  load: loadUpdateTour,
  change: updateTourCard,
  // The new way stays beside the receipt: the answer is the tour as saved, naming it.
  applied: appliedTourCard,
};

export const TOUR_CARDS: DomainCards = {
  id: 'tour',
  tools: {
    propose_hike: { argPolicy: WITH_GEOMETRY, answer: proposalCard },
    propose_tour: { argPolicy: WITH_GEOMETRY, answer: proposalCard },
    propose_city_walk: { argPolicy: WITH_GEOMETRY, answer: cityWalkCard },
    propose_round_hike: { argPolicy: WITH_GEOMETRY, answer: roundHikeCard },
    propose_hike_leg_way: { argPolicy: WITH_GEOMETRY, answer: legWayCard },
    preview_wanderer_trail: { argPolicy: WITH_GEOMETRY, answer: wandererPreviewCard },
    import_wanderer_trail: IMPORT_WANDERER_TRAIL,
    plan_paddle_route: { argPolicy: WITH_GEOMETRY, answer: paddleCard },
    plan_ski_route: { argPolicy: WITH_GEOMETRY, answer: skiCard },
    get_tour_plan: { project: withoutPreview, answer: savedTourCard },
    list_tours: { answer: tourListCard },
    find_tours_for_day: { answer: tourListCard },
    create_hike: createHike,
    create_tour: createTour,
    create_paddle_tour: sportCreate(TOUR_DESCRIBERS.create_paddle_tour, loadCreatePaddle, createPaddleCard),
    create_ski_tour: sportCreate(TOUR_DESCRIBERS.create_ski_tour, loadCreateSki, createSkiCard),
    create_city_walk: {
      write: { verbKey: 'addTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.create_city_walk,
      change: createCityWalkCard,
      applied: appliedTourCard,
      undo: DELETE_CREATED_TOUR,
    },
    update_tour: updateTour,
    ...TOUR_WRITE_CARDS,
    ...TOUR_EDIT_CARDS,
    // A copy is a tour of its own, taken back by deleting it while it is as it was made.
    copy_tour: {
      write: { verbKey: 'copyTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.copy_tour,
      undo: DELETE_CREATED_TOUR,
    },
    set_city_walk_visit: {
      write: { verbKey: 'markVisited', entity: 'tour' },
      load: loadVisit,
      describe: describeVisit,
      undo: SET_VISIT_UNDO,
    },
    import_tour_gpx: {
      write: { verbKey: 'importTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.import_tour_gpx,
      undo: DELETE_IMPORTED_TOUR,
    },
    ...TOUR_STOP_CARDS,
    take_over_tour: {
      write: { verbKey: 'addTour', entity: 'tour' },
      describe: TOUR_DESCRIBERS.take_over_tour,
      undo: DELETE_CREATED_TOUR,
    },
  },
  prompt: [
    "Every tour type can be planned and saved. Pick the tool by what the user does: a hike (also a trek over several days) propose_hike then create_hike; a bike tour or a run propose_tour (activity bike or run) then create_tour; a city walk propose_city_walk then create_city_walk; a paddle tour plan_paddle_route then create_paddle_tour (it needs water_context river or lake); a ski or winter tour (alpine, snowboard, cross-country, ski touring, snowshoe, winter hike) plan_ski_route then create_ski_tour with the same points, discipline and options, passing the plan's points in order (the from of the first leg and the to of every leg). Profiles: a bike tour is touring (city or trekking bike, the default), road (asphalt only), gravel (gravel and farm tracks) or mtb (rough tracks and trails); a run is running (mostly paved, the default) or trail; ask when it is not clear. A run needs the runner's pace (run_pace_seconds_per_km, 330 for 5:30 min/km): ask for it, never guess one. A hike: propose_hike with a name, and day_id and start_time when known; to compare ways call it up to three times in one step, each with a variant_label and along false, the way you recommend first; create_hike only once the user chose a way. A hike over several days is one hike: stage_end on each stop a day ends at (no day_id), then each stage on its day with assign_place_to_day and tourStageKey.",
    "The app draws a proposed, planned or saved tour (route, profile, stops, times, weather, warnings) and lists of tours as cards: do not repeat their figures or list them again, say in one sentence what matters. Once a tour is planned, offer what goes with it: places along it (search_tour_pois), what to pack (get_tour_packing, link_tour_packing), the GPX file (export_tour_gpx). To change a saved tour: a city walk's stations (name, stay, importance, protection, opening hours), its direction or its loop through prepare_tour_change and save_tour_change (edit, reverse, close_loop); a hike's direction or loop with update_tour and reshape; breaks, website, words and planned time of any tour with update_tour_details; its colour with set_tour_route_color; a variant with copy_tour first. A round of about so many km from one point: propose_round_hike with round a, b and c in one step; other ways for one leg of a hike: propose_hike_leg_way with way a, b and c; then create_hike with the chosen create_with (update_tour for a saved hike). Wanderer trails of the user: search_wanderer_trails, preview_wanderer_trail, and import_wanderer_trail only after a yes.",
  ],
  // P8, P9: edits besides the route, and the writes and reads a ski, paddle or horse tour has of its own.
  toolControllers: { tours: ['TourEditMcp', 'TourSportWritesMcp'] },
};

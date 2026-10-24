import { z } from 'zod';

/**
 * What a planning tool answers for drawing. A tool that plans a way (a hike,
 * a city walk, a paddle or a ski tour) can add the line it planned, thinned
 * for display, under a key holding `geometry`, so a chat card draws it. Only
 * when asked: a client that reads the answer as text has no use for a few
 * hundred coordinates, and the assistant hides every such key from the model.
 */

/** The flag a planning tool takes to add its line for drawing. */
export const includeGeometryFlagSchema = z
  .boolean()
  .optional()
  .describe('Adds the line for drawing as line_geometry; leave out');

/** The most points of a line a planning tool answers for drawing, all its legs together. */
export const TOUR_DISPLAY_LINE_POINTS = 300;

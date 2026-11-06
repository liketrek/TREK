import { z } from 'zod';

/**
 * Prompt arguments arrive as strings (GetPromptRequest.arguments is a
 * Record<string, string>), so a numeric id has to be parsed out of one.
 * The old z.number().int().positive() failed every client, MCP Inspector
 * included, with "expected number, received string" (#2207).
 */
export const tripIdPromptArg = z
  .string()
  .regex(/^[1-9]\d*$/, 'Trip ID must be a positive integer')
  .transform(Number)
  .pipe(z.number().int().positive());

/** A calendar date, as the trip's days are keyed. */
export const datePromptArg = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

/** What the traveller is looking for, in their own words. */
export const queryPromptArg = z.string().trim().min(1).max(200);

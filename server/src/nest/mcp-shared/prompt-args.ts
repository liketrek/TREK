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

import { z } from 'zod';

export const TICKET_NOTE_PREFIX = 'TICKETJSON:';

const ticketParticipantIdsSchema = z
  .array(z.number().int().positive())
  .refine((ids) => new Set(ids).size === ids.length, 'Ticket participant IDs must be distinct');

export const ticketItemSchema = z
  .object({
    name: z.string(),
    price: z.union([z.string(), z.number()]),
    parts: ticketParticipantIdsSchema,
  })
  .passthrough();

export const ticketPayloadSchema = z.object({ items: z.array(ticketItemSchema) }).passthrough();
export type TicketPayload = z.infer<typeof ticketPayloadSchema>;

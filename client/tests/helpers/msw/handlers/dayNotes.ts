import {
  dayNoteCreateRequestSchema,
  dayNoteSchema,
  dayNoteUpdateRequestSchema,
  daySchema,
  dayUpdateRequestSchema,
} from '@trek/shared';
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { buildDayNote } from '../../factories';
import { contractHandler } from '../contract';

const noteResponse = z.object({ note: dayNoteSchema });

export const dayNotesHandlers = [
  contractHandler(
    'get',
    '/api/trips/:id/days/:dayId/notes',
    { response: z.object({ notes: z.array(dayNoteSchema) }) },
    ({ params }) => ({
      notes: [buildDayNote({ day_id: Number(params.dayId) })],
    })
  ),

  contractHandler(
    'post',
    '/api/trips/:id/days/:dayId/notes',
    { request: dayNoteCreateRequestSchema, response: noteResponse },
    ({ params, body }) => ({
      note: buildDayNote({ day_id: Number(params.dayId), ...body }),
    })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/days/:dayId/notes/:noteId',
    { request: dayNoteUpdateRequestSchema, response: noteResponse },
    ({ params, body }) => ({ note: buildDayNote({ id: Number(params.noteId), day_id: Number(params.dayId), ...body }) })
  ),

  contractHandler('delete', '/api/trips/:id/days/:dayId/notes/:noteId', {}, () => HttpResponse.json({ success: true })),

  contractHandler(
    'put',
    '/api/trips/:id/days/:dayId',
    { request: dayUpdateRequestSchema, response: z.object({ day: daySchema }) },
    ({ params, body }) => ({
      day: { id: Number(params.dayId), trip_id: Number(params.id), ...body },
    })
  ),
];

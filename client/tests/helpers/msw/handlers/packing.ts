import { packingCreateItemRequestSchema, packingItemSchema, packingUpdateItemRequestSchema } from '@trek/shared';
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { buildPackingItem } from '../../factories';
import { contractHandler } from '../contract';

const itemResponse = z.object({ item: packingItemSchema });

/** The server stores checked and is_private as 0/1 and answers them that way, whichever form the request used. */
const asStored = <T extends { checked?: boolean | number; is_private?: boolean }>({
  checked,
  is_private,
  ...rest
}: T) => ({
  ...rest,
  ...(checked === undefined ? {} : { checked: Number(checked) }),
  ...(is_private === undefined ? {} : { is_private: Number(is_private) }),
});

export const packingHandlers = [
  contractHandler(
    'get',
    '/api/trips/:id/packing',
    { response: z.object({ items: z.array(packingItemSchema) }) },
    ({ params }) => ({
      items: [buildPackingItem({ trip_id: Number(params.id) })],
    })
  ),

  contractHandler(
    'post',
    '/api/trips/:id/packing',
    { request: packingCreateItemRequestSchema, response: itemResponse },
    ({ params, body }) => ({
      item: buildPackingItem({ trip_id: Number(params.id), ...asStored(body) }),
    })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/packing/:itemId',
    { request: packingUpdateItemRequestSchema, response: itemResponse },
    ({ params, body }) => ({
      item: buildPackingItem({ id: Number(params.itemId), trip_id: Number(params.id), ...asStored(body) }),
    })
  ),

  contractHandler('delete', '/api/trips/:id/packing/:itemId', {}, () => HttpResponse.json({ success: true })),
];

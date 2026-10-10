import { todoCreateItemRequestSchema, todoUpdateItemRequestSchema } from '@trek/shared';
import { HttpResponse } from 'msw';
import { buildTodoItem } from '../../factories';
import { contractHandler } from '../contract';

// @trek/shared holds the todo requests but no todo item schema yet, so only
// the request side is checked here.

/**
 * The row as the server stores it: checked as 0/1 whichever form the request
 * used, and a cleared priority as its default, 0.
 */
const asStored = <T extends { checked?: boolean | number; priority?: number | null }>({
  checked,
  priority,
  ...rest
}: T) => ({
  ...rest,
  ...(checked === undefined ? {} : { checked: Number(checked) }),
  ...(priority === undefined ? {} : { priority: priority ?? 0 }),
});

export const todoHandlers = [
  contractHandler('get', '/api/trips/:id/todo', {}, ({ params }) => ({
    items: [buildTodoItem({ trip_id: Number(params.id) })],
  })),

  contractHandler('post', '/api/trips/:id/todo', { request: todoCreateItemRequestSchema }, ({ params, body }) => ({
    item: buildTodoItem({ trip_id: Number(params.id), ...body }),
  })),

  contractHandler(
    'put',
    '/api/trips/:id/todo/:itemId',
    { request: todoUpdateItemRequestSchema },
    ({ params, body }) => ({
      item: buildTodoItem({ id: Number(params.itemId), trip_id: Number(params.id), ...asStored(body) }),
    })
  ),

  contractHandler('delete', '/api/trips/:id/todo/:itemId', {}, () => HttpResponse.json({ success: true })),
];

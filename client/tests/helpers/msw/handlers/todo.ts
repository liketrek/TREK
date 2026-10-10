import { todoCreateItemRequestSchema, todoUpdateItemRequestSchema } from '@trek/shared';
import { HttpResponse } from 'msw';
import { buildTodoItem } from '../../factories';
import { contractHandler } from '../contract';

// @trek/shared holds the todo requests but no todo item schema yet, so only
// the request side is checked here.

/** The server stores checked as 0/1 and answers it that way, whichever form the request used. */
const asStored = <T extends { checked?: boolean | number }>({ checked, ...rest }: T) =>
  checked === undefined ? rest : { ...rest, checked: Number(checked) };
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

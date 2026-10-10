import {
  budgetCreateItemRequestSchema,
  budgetItemMemberSchema,
  budgetItemSchema,
  budgetToggleMemberPaidRequestSchema,
  budgetUpdateItemRequestSchema,
  budgetUpdateMembersRequestSchema,
} from '@trek/shared';
import { HttpResponse } from 'msw';
import { z } from 'zod';
import { buildBudgetItem } from '../../factories';
import { contractHandler } from '../contract';

const itemResponse = z.object({ item: budgetItemSchema });

/**
 * The fields of a create or update request that the stored item carries as
 * they are. Payers, members and receipts arrive as ids and amounts and come
 * back in a different shape the server builds, so they are not echoed.
 */
const itemFields = <T extends { payers?: unknown; members?: unknown; member_ids?: unknown }>(body: T) => {
  const { payers: _payers, members: _members, member_ids: _memberIds, ...fields } = body;
  return fields;
};

export const budgetHandlers = [
  contractHandler(
    'get',
    '/api/trips/:id/budget',
    { response: z.object({ items: z.array(budgetItemSchema) }) },
    ({ params }) => ({
      items: [buildBudgetItem({ trip_id: Number(params.id) })],
    })
  ),

  contractHandler(
    'post',
    '/api/trips/:id/budget',
    { request: budgetCreateItemRequestSchema, response: itemResponse },
    ({ params, body }) => ({
      item: buildBudgetItem({ trip_id: Number(params.id), ...itemFields(body) }),
    })
  ),

  contractHandler(
    'put',
    '/api/trips/:id/budget/:itemId',
    { request: budgetUpdateItemRequestSchema, response: itemResponse },
    ({ params, body }) => ({
      item: buildBudgetItem({ id: Number(params.itemId), trip_id: Number(params.id), ...itemFields(body) }),
    })
  ),

  contractHandler('delete', '/api/trips/:id/budget/:itemId', {}, () => HttpResponse.json({ success: true })),

  contractHandler(
    'put',
    '/api/trips/:id/budget/:itemId/members',
    {
      request: budgetUpdateMembersRequestSchema,
      response: itemResponse.extend({ members: z.array(budgetItemMemberSchema) }),
    },
    ({ params, body }) => {
      const members = body.user_ids.map((uid) => ({ user_id: uid, paid: 0, username: `user${uid}` }));
      const item = buildBudgetItem({
        id: Number(params.itemId),
        trip_id: Number(params.id),
        persons: body.user_ids.length,
        members,
      });
      return { members, item };
    }
  ),

  contractHandler(
    'put',
    '/api/trips/:id/budget/:itemId/members/:userId/paid',
    { request: budgetToggleMemberPaidRequestSchema },
    ({ body }) => ({
      success: true,
      paid: body.paid,
    })
  ),
];

import {
  categoryListResponseSchema,
  categorySchema,
  createCategoryRequestSchema,
  createTagRequestSchema,
  tagListResponseSchema,
  tagSchema,
  tripTagCreateRequestSchema,
  tripTagListResponseSchema,
  tripTagResponseSchema,
} from '@trek/shared';
import { z } from 'zod';
import { buildCategory, buildTag } from '../../factories';
import { contractHandler } from '../contract';

export const tagsHandlers = [
  contractHandler('get', '/api/tags', { response: tagListResponseSchema }, () => ({ tags: [buildTag(), buildTag()] })),

  contractHandler(
    'post',
    '/api/tags',
    { request: createTagRequestSchema, response: z.object({ tag: tagSchema }) },
    ({ body }) => ({
      tag: buildTag(body),
    })
  ),

  // The tags a trip owns: none unless a test serves its own.
  contractHandler('get', '/api/trips/:tripId/tags', { response: tripTagListResponseSchema }, () => ({ tags: [] })),

  contractHandler(
    'post',
    '/api/trips/:tripId/tags',
    { request: tripTagCreateRequestSchema, response: tripTagResponseSchema },
    ({ body, params }) => ({ tag: buildTag({ ...body, trip_id: Number(params.tripId) }) })
  ),

  contractHandler('get', '/api/categories', { response: categoryListResponseSchema }, () => ({
    categories: [buildCategory(), buildCategory()],
  })),

  contractHandler(
    'post',
    '/api/categories',
    { request: createCategoryRequestSchema, response: z.object({ category: categorySchema }) },
    ({ body }) => ({ category: buildCategory(body) })
  ),
];

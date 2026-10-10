import {
  categoryListResponseSchema,
  categorySchema,
  createCategoryRequestSchema,
  createTagRequestSchema,
  tagListResponseSchema,
  tagSchema,
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

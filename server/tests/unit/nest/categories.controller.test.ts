import { CategoriesController } from '../../../src/nest/categories/categories.controller';
import type { CategoriesService } from '../../../src/nest/categories/categories.service';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';
import type { Category } from '@trek/shared';

import { describe, it, expect, vi } from 'vitest';

const admin = { id: 1, role: 'admin' } as User;

function makeController(svc: Partial<CategoriesService>) {
  return new CategoriesController(svc as CategoriesService);
}

const cat: Category = { id: 1, name: 'Food', color: '#fff', icon: '🍔' };

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('CategoriesController (parity with the legacy /api/categories route)', () => {
  it('GET / returns the category list wrapped in { categories }', async () => {
    const list = vi.fn().mockReturnValue([cat]);
    expect(await makeController({ list }).list()).toEqual({ categories: [cat] });
  });

  describe('POST /', () => {
    // A body without a name no longer reaches the handler: createCategoryRequestSchema
    // requires it, and the global ZodValidationPipe rejects it by metatype. The
    // contract itself is covered by shared/src/category/category.schema.spec.ts.

    it('creates and returns { category }', async () => {
      const create = vi.fn().mockReturnValue(cat);
      expect(await makeController({ create }).create(admin, { name: 'Food', color: '#fff', icon: '🍔' })).toEqual({
        category: cat,
      });
      expect(create).toHaveBeenCalledWith(1, 'Food', '#fff', '🍔');
    });
  });

  describe('PUT /:id', () => {
    it('404 when the category does not exist', async () => {
      const getById = vi.fn().mockReturnValue(undefined);
      const update = vi.fn();
      expect(await thrown(() => makeController({ getById, update }).update('9', { name: 'X' }))).toEqual({
        status: 404,
        body: { error: 'Category not found' },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('updates and returns { category }', async () => {
      const getById = vi.fn().mockReturnValue(cat);
      const update = vi.fn().mockReturnValue({ ...cat, name: 'Drinks' });
      expect(await makeController({ getById, update }).update('1', { name: 'Drinks' })).toEqual({
        category: { ...cat, name: 'Drinks' },
      });
      expect(update).toHaveBeenCalledWith('1', 'Drinks', undefined, undefined);
    });
  });

  describe('DELETE /:id', () => {
    it('404 when the category does not exist', async () => {
      const getById = vi.fn().mockReturnValue(undefined);
      const remove = vi.fn();
      expect(await thrown(() => makeController({ getById, remove }).remove('9'))).toEqual({
        status: 404,
        body: { error: 'Category not found' },
      });
      expect(remove).not.toHaveBeenCalled();
    });

    it('deletes and returns { success: true }', async () => {
      const getById = vi.fn().mockReturnValue(cat);
      const remove = vi.fn();
      expect(await makeController({ getById, remove }).remove('1')).toEqual({ success: true });
      expect(remove).toHaveBeenCalledWith('1');
    });
  });
});

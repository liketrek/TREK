import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { CategoriesController } from '../../../src/nest/categories/categories.controller';
import type { CategoriesService } from '../../../src/nest/categories/categories.service';
import type { User } from '../../../src/types';
import type { Category } from '@trek/shared';

const admin = { id: 1, role: 'admin' } as User;

function makeController(svc: Partial<CategoriesService>) {
  return new CategoriesController(svc as CategoriesService);
}

const cat: Category = { id: 1, name: 'Food', color: '#fff', icon: '🍔' };

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('CategoriesController (parity with the legacy /api/categories route)', () => {
  it('GET / returns the category list wrapped in { categories }', () => {
    const list = vi.fn().mockReturnValue([cat]);
    expect(makeController({ list }).list()).toEqual({ categories: [cat] });
  });

  describe('POST /', () => {
    // A body without a name no longer reaches the handler: createCategoryRequestSchema
    // requires it, and the global ZodValidationPipe rejects it by metatype. The
    // contract itself is covered by shared/src/category/category.schema.spec.ts.

    it('creates and returns { category }', () => {
      const create = vi.fn().mockReturnValue(cat);
      expect(makeController({ create }).create(admin, { name: 'Food', color: '#fff', icon: '🍔' })).toEqual({ category: cat });
      expect(create).toHaveBeenCalledWith(1, 'Food', '#fff', '🍔');
    });
  });

  describe('PUT /:id', () => {
    it('404 when the category does not exist', () => {
      const getById = vi.fn().mockReturnValue(undefined);
      const update = vi.fn();
      expect(thrown(() => makeController({ getById, update }).update('9', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Category not found' },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('updates and returns { category }', () => {
      const getById = vi.fn().mockReturnValue(cat);
      const update = vi.fn().mockReturnValue({ ...cat, name: 'Drinks' });
      expect(makeController({ getById, update }).update('1', { name: 'Drinks' })).toEqual({ category: { ...cat, name: 'Drinks' } });
      expect(update).toHaveBeenCalledWith('1', 'Drinks', undefined, undefined);
    });
  });

  describe('DELETE /:id', () => {
    it('404 when the category does not exist', () => {
      const getById = vi.fn().mockReturnValue(undefined);
      const remove = vi.fn();
      expect(thrown(() => makeController({ getById, remove }).remove('9'))).toEqual({
        status: 404, body: { error: 'Category not found' },
      });
      expect(remove).not.toHaveBeenCalled();
    });

    it('deletes and returns { success: true }', () => {
      const getById = vi.fn().mockReturnValue(cat);
      const remove = vi.fn();
      expect(makeController({ getById, remove }).remove('1')).toEqual({ success: true });
      expect(remove).toHaveBeenCalledWith('1');
    });
  });
});

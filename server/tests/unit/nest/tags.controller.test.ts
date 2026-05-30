import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { TagsController } from '../../../src/nest/tags/tags.controller';
import type { TagsService } from '../../../src/nest/tags/tags.service';
import type { User } from '../../../src/types';
import type { Tag } from '@trek/shared';

const user = { id: 5 } as User;

function makeController(svc: Partial<TagsService>) {
  return new TagsController(svc as TagsService);
}

const tag: Tag = { id: 1, user_id: 5, name: 'Beach', color: '#10b981' };

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

describe('TagsController (parity with the legacy /api/tags route)', () => {
  it('GET / returns the caller\'s tags wrapped in { tags }', () => {
    const list = vi.fn().mockReturnValue([tag]);
    expect(makeController({ list }).list(user)).toEqual({ tags: [tag] });
    expect(list).toHaveBeenCalledWith(5);
  });

  describe('POST /', () => {
    it('400 when name is missing', () => {
      const create = vi.fn();
      expect(thrown(() => makeController({ create }).create(user, undefined))).toEqual({
        status: 400, body: { error: 'Tag name is required' },
      });
      expect(create).not.toHaveBeenCalled();
    });

    it('creates a tag for the caller', () => {
      const create = vi.fn().mockReturnValue(tag);
      expect(makeController({ create }).create(user, 'Beach', '#10b981')).toEqual({ tag });
      expect(create).toHaveBeenCalledWith(5, 'Beach', '#10b981');
    });
  });

  describe('PUT /:id', () => {
    it('404 when the tag is not owned by the caller', () => {
      const getByIdAndUser = vi.fn().mockReturnValue(undefined);
      const update = vi.fn();
      expect(thrown(() => makeController({ getByIdAndUser, update }).update(user, '9', 'X'))).toEqual({
        status: 404, body: { error: 'Tag not found' },
      });
      expect(getByIdAndUser).toHaveBeenCalledWith('9', 5);
      expect(update).not.toHaveBeenCalled();
    });

    it('updates an owned tag', () => {
      const getByIdAndUser = vi.fn().mockReturnValue(tag);
      const update = vi.fn().mockReturnValue({ ...tag, name: 'Hike' });
      expect(makeController({ getByIdAndUser, update }).update(user, '1', 'Hike')).toEqual({ tag: { ...tag, name: 'Hike' } });
      expect(update).toHaveBeenCalledWith('1', 'Hike', undefined);
    });
  });

  describe('DELETE /:id', () => {
    it('404 when the tag is not owned by the caller', () => {
      const getByIdAndUser = vi.fn().mockReturnValue(undefined);
      const remove = vi.fn();
      expect(thrown(() => makeController({ getByIdAndUser, remove }).remove(user, '9'))).toEqual({
        status: 404, body: { error: 'Tag not found' },
      });
      expect(remove).not.toHaveBeenCalled();
    });

    it('deletes an owned tag', () => {
      const getByIdAndUser = vi.fn().mockReturnValue(tag);
      const remove = vi.fn();
      expect(makeController({ getByIdAndUser, remove }).remove(user, '1')).toEqual({ success: true });
      expect(remove).toHaveBeenCalledWith('1');
    });
  });
});

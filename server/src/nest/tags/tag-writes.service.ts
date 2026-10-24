import { RealtimeService } from '../realtime/realtime.service';
import { TagsService } from './tags.service';
import { Injectable } from '@nestjs/common';
import type { Tag } from '@trek/shared';

/**
 * A user's tag writes, for REST and MCP alike, each followed by `tags:changed`
 * to the user's sockets so every tag picker they have open reads the list again.
 * A ping rather than the tag: a delete has nothing left to send.
 *
 * `socketId` is REST's requesting tab, which updated its own list and is left
 * out; MCP passes none. The callers keep their ownership checks.
 */
@Injectable()
export class TagWritesService {
  constructor(
    private readonly tags: TagsService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(userId: number, name: string, color: string | undefined, socketId: string | undefined): Promise<Tag> {
    const tag = await this.tags.create(userId, name, color);
    this.announce(userId, socketId);
    return tag;
  }

  async update(
    userId: number,
    id: string | number,
    changes: { name?: string; color?: string },
    socketId: string | undefined,
  ): Promise<Tag> {
    const tag = await this.tags.update(id, changes.name, changes.color);
    this.announce(userId, socketId);
    return tag;
  }

  async remove(userId: number, id: string | number, socketId: string | undefined): Promise<void> {
    await this.tags.remove(id);
    this.announce(userId, socketId);
  }

  private announce(userId: number, socketId: string | undefined): void {
    this.realtime.broadcastToUser(userId, { type: 'tags:changed' }, socketId);
  }
}

import { RealtimeService } from '../realtime/realtime.service';
import { AtlasService, type CreateBucketData, type UpdateBucketData } from './atlas.service';
import { Injectable } from '@nestjs/common';

/**
 * The atlas writes as the REST routes and the MCP tools make them: AtlasService
 * writes the rows, then every tab of the user hears `atlas:changed` and reads
 * its atlas again. REST leaves out the tab that asked, which updates from its
 * own answer; an MCP call leaves out none, so the tab the assistant runs in
 * shows the change too.
 *
 * The rows are the user's own, so the event goes to the user rather than to a
 * trip. AtlasService itself stays quiet: the Dawarich confirmations write
 * through it inside their own transactions and announce once, after the commit,
 * through `announce`.
 */
@Injectable()
export class AtlasWritesService {
  constructor(
    private readonly atlas: AtlasService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Tells the user's tabs their countries, regions or bucket list changed. */
  announce(userId: number, socketId?: string): void {
    this.realtime.broadcastToUser(userId, { type: 'atlas:changed' }, socketId);
  }

  async markCountry(userId: number, code: string, socketId?: string): Promise<void> {
    await this.atlas.markCountry(userId, code);
    this.announce(userId, socketId);
  }

  async unmarkCountry(userId: number, code: string, socketId?: string): Promise<void> {
    await this.atlas.unmarkCountry(userId, code);
    this.announce(userId, socketId);
  }

  async markRegion(userId: number, code: string, name: string, countryCode: string, socketId?: string): Promise<void> {
    await this.atlas.markRegion(userId, code, name, countryCode);
    this.announce(userId, socketId);
  }

  async unmarkRegion(userId: number, code: string, socketId?: string): Promise<void> {
    await this.atlas.unmarkRegion(userId, code);
    this.announce(userId, socketId);
  }

  async createBucketItem(userId: number, data: CreateBucketData, socketId?: string) {
    const item = await this.atlas.createBucketItem(userId, data);
    this.announce(userId, socketId);
    return item;
  }

  async updateBucketItem(userId: number, itemId: string | number, data: UpdateBucketData, socketId?: string) {
    const item = await this.atlas.updateBucketItem(userId, itemId, data);
    if (item) this.announce(userId, socketId);
    return item;
  }

  async deleteBucketItem(userId: number, itemId: string | number, socketId?: string): Promise<boolean> {
    const deleted = await this.atlas.deleteBucketItem(userId, itemId);
    if (deleted) this.announce(userId, socketId);
    return deleted;
  }
}

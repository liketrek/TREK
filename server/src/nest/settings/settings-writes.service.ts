import { RealtimeService } from '../realtime/realtime.service';
import { SettingsService } from './settings.service';
import { Injectable } from '@nestjs/common';
import { MASKED_SETTING_VALUE } from '@trek/shared';

/**
 * A user's own settings saved, for every surface, and their other tabs and
 * devices told which keys changed so they read their settings again. The event
 * names keys only, never a value: some keys hold secrets, and the receiving tab
 * reads the values through its own session anyway.
 *
 * `socketId` is REST's requesting tab, which applied the change itself and is
 * left out. MCP passes none, so the asking tab follows a change the assistant made.
 */
@Injectable()
export class SettingsWritesService {
  constructor(
    private readonly settings: SettingsService,
    private readonly realtime: RealtimeService,
  ) {}

  async saveOne(userId: number, key: string, value: unknown, socketId: string | undefined): Promise<void> {
    await this.settings.upsertSetting(userId, key, value);
    this.announce(userId, [key], socketId);
  }

  /** Answers how many rows were written. A masked secret echoed back is skipped, and named in no event. */
  async saveMany(userId: number, values: Record<string, unknown>, socketId: string | undefined): Promise<number> {
    const written = await this.settings.bulkUpsertSettings(userId, values);
    this.announce(
      userId,
      Object.keys(values).filter((key) => values[key] !== MASKED_SETTING_VALUE),
      socketId,
    );
    return written;
  }

  private announce(userId: number, keys: string[], socketId: string | undefined): void {
    if (keys.length > 0) this.realtime.broadcastToUser(userId, { type: 'settings:updated', keys }, socketId);
  }
}

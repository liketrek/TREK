import { DemoService } from '../common/demo.service';
import { SettingsService } from '../settings/settings.service';
import { AI_DEFAULT_DAILY_TURNS, AI_DEFAULT_POLICY, AI_DEFAULT_RETENTION, aiRefusal } from './ai-connections.constants';
import { Injectable } from '@nestjs/common';
import { aiPolicySchema, aiRetentionSchema, type AiAdminSettings } from '@trek/shared';

import { randomUUID } from 'node:crypto';

/**
 * The assistant's instance settings (`app_settings`): the policy, the daily
 * limit on the instance's connection, how long chats are kept and whether it
 * may search the web. A stored
 * value that does not read as what it should falls back to the default, so a
 * hand-edited row never switches the assistant to something nobody chose.
 */
@Injectable()
export class AiSettingsService {
  constructor(
    private readonly settings: SettingsService,
    private readonly demo: DemoService,
  ) {}

  async read(): Promise<AiAdminSettings> {
    const policy = aiPolicySchema.safeParse(await this.settings.getAppSetting('ai_assistant_policy'));
    const turns = Number(await this.settings.getAppSetting('ai_assistant_daily_turns'));
    return {
      policy: policy.success ? policy.data : AI_DEFAULT_POLICY,
      dailyTurns: Number.isInteger(turns) && turns >= 1 && turns <= 10_000 ? turns : AI_DEFAULT_DAILY_TURNS,
      retention: parseRetention(await this.settings.getAppSetting('ai_assistant_retention')),
      // Off only when switched off: a missing or odd row leaves the search on, as it ships.
      webSearch: (await this.settings.getAppSetting('ai_assistant_web_search')) !== 'false',
    };
  }

  async write(next: AiAdminSettings): Promise<AiAdminSettings> {
    await this.settings.setAppSettings({
      ai_assistant_policy: next.policy,
      ai_assistant_daily_turns: String(next.dailyTurns),
      ai_assistant_retention: JSON.stringify(next.retention),
      ai_assistant_web_search: next.webSearch ? 'true' : 'false',
    });
    return this.read();
  }

  /** Whether a user may connect a provider of their own: not under the `instance` policy, never the demo account. */
  async canConnectOwn(userId: number): Promise<boolean> {
    const { policy } = await this.read();
    return policy !== 'instance' && !(await this.demo.isDemoUserId(userId));
  }

  async assertCanConnectOwn(userId: number): Promise<void> {
    if (!(await this.canConnectOwn(userId))) {
      throw aiRefusal('forbidden', 'Connecting your own AI provider is not allowed here');
    }
  }

  /**
   * This install's host id for Sign in with ChatGPT (`urn:uuid:<uuid>`),
   * created on the first sign-in that needs it and kept from then on.
   */
  async siwcHostId(): Promise<string> {
    const stored = await this.settings.getAppSetting('ai_siwc_host_id');
    if (stored) return stored;
    const created = `urn:uuid:${randomUUID()}`;
    await this.settings.setAppSettings({ ai_siwc_host_id: created });
    return created;
  }
}

function parseRetention(stored: string | null) {
  if (!stored) return AI_DEFAULT_RETENTION;
  try {
    const parsed = aiRetentionSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : AI_DEFAULT_RETENTION;
  } catch {
    return AI_DEFAULT_RETENTION;
  }
}

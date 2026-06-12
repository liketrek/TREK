import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { ChannelTestResult, UnreadCountResult } from '@trek/shared';
import type { User } from '../../types';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

// The masked placeholder the client sends instead of a stored secret (8× U+2022).
const MASKED = '••••••••';

/**
 * /api/notifications — channel-preference matrix, channel test pings, and in-app
 * notifications.
 *
 * Byte-identical to the legacy Express route (server/src/routes/notifications.ts):
 * same auth, the same inline admin gate on /test-smtp (note: it returns
 * { error: 'Admin only' }, NOT the AdminGuard's wording), the same webhook/ntfy
 * fallback resolution, the same id parsing + 400/404 bodies, and the same status
 * codes. POSTs that answer with res.json stay 200 (Nest would default to 201).
 * The static /in-app/read-all and /in-app/all routes are declared before the
 * /in-app/:id routes so they win over the param, matching the legacy order.
 */
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('preferences')
  getPreferences(@CurrentUser() user: User) {
    return this.notifications.getPreferences(user.id, user.role);
  }

  @Put('preferences')
  setPreferences(@CurrentUser() user: User, @Body() body: Record<string, Record<string, boolean>>) {
    this.notifications.setPreferences(user.id, body);
    return this.notifications.getPreferences(user.id, user.role);
  }

  @Post('test-smtp')
  @HttpCode(200)
  async testSmtp(@CurrentUser() user: User, @Body('email') email?: string): Promise<ChannelTestResult> {
    if (user.role !== 'admin') {
      throw new HttpException({ error: 'Admin only' }, 403);
    }
    return this.notifications.testSmtp(email || user.email);
  }

  @Post('test-webhook')
  @HttpCode(200)
  async testWebhook(@CurrentUser() user: User, @Body('url') urlInput?: unknown): Promise<ChannelTestResult> {
    let url = urlInput;
    if (!url || url === MASKED) {
      url = this.notifications.userWebhookUrl(user.id);
      if (!url && user.role === 'admin') url = this.notifications.adminWebhookUrl();
      if (!url) {
        throw new HttpException({ error: 'No webhook URL configured' }, 400);
      }
    }
    if (typeof url !== 'string') {
      throw new HttpException({ error: 'url must be a string' }, 400);
    }
    try {
      new URL(url);
    } catch {
      throw new HttpException({ error: 'Invalid URL' }, 400);
    }
    return this.notifications.testWebhook(url);
  }

  @Post('test-ntfy')
  @HttpCode(200)
  async testNtfy(
    @CurrentUser() user: User,
    @Body('topic') topic?: string,
    @Body('server') server?: string,
    @Body('token') token?: string,
  ): Promise<ChannelTestResult> {
    const userCfg = this.notifications.userNtfyConfig(user.id);
    const adminCfg = this.notifications.adminNtfyConfig();

    const resolvedTopic = topic || userCfg?.topic || undefined;
    const resolvedServer = server || userCfg?.server || adminCfg.server || undefined;
    // Reuse the saved token when the request sends null, empty, or the masked placeholder.
    const resolvedToken = (token && token !== MASKED)
      ? token
      : (userCfg?.token ?? adminCfg.token ?? null);

    if (!resolvedTopic) {
      throw new HttpException({ error: 'No ntfy topic configured' }, 400);
    }
    return this.notifications.testNtfy({ topic: resolvedTopic, server: resolvedServer ?? null, token: resolvedToken });
  }

  @Get('in-app')
  listInApp(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unread_only') unreadOnly?: string,
  ) {
    return this.notifications.listInApp(user.id, {
      limit: Math.min(parseInt(limit as string) || 20, 50),
      offset: parseInt(offset as string) || 0,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('in-app/unread-count')
  unreadCount(@CurrentUser() user: User): UnreadCountResult {
    return { count: this.notifications.unreadCount(user.id) };
  }

  @Put('in-app/read-all')
  readAll(@CurrentUser() user: User): { success: boolean; count: number } {
    return { success: true, count: this.notifications.markAllRead(user.id) };
  }

  @Delete('in-app/all')
  deleteAll(@CurrentUser() user: User): { success: boolean; count: number } {
    return { success: true, count: this.notifications.deleteAll(user.id) };
  }

  @Put('in-app/:id/read')
  markRead(@CurrentUser() user: User, @Param('id') idParam: string): { success: boolean } {
    const id = this.parseId(idParam);
    if (!this.notifications.markRead(id, user.id)) {
      throw new HttpException({ error: 'Not found' }, 404);
    }
    return { success: true };
  }

  @Put('in-app/:id/unread')
  markUnread(@CurrentUser() user: User, @Param('id') idParam: string): { success: boolean } {
    const id = this.parseId(idParam);
    if (!this.notifications.markUnread(id, user.id)) {
      throw new HttpException({ error: 'Not found' }, 404);
    }
    return { success: true };
  }

  @Delete('in-app/:id')
  deleteOne(@CurrentUser() user: User, @Param('id') idParam: string): { success: boolean } {
    const id = this.parseId(idParam);
    if (!this.notifications.deleteOne(id, user.id)) {
      throw new HttpException({ error: 'Not found' }, 404);
    }
    return { success: true };
  }

  @Post('in-app/:id/respond')
  @HttpCode(200)
  async respond(
    @CurrentUser() user: User,
    @Param('id') idParam: string,
    @Body('response') response?: unknown,
  ): Promise<{ success: boolean; notification: unknown }> {
    const id = this.parseId(idParam);
    if (response !== 'positive' && response !== 'negative') {
      throw new HttpException({ error: 'response must be "positive" or "negative"' }, 400);
    }
    const result = await this.notifications.respond(id, user.id, response);
    if (!result.success) {
      throw new HttpException({ error: result.error }, 400);
    }
    return { success: true, notification: result.notification };
  }

  /** parseInt + the legacy "Invalid id" 400 guard, shared by the /:id handlers. */
  private parseId(idParam: string): number {
    const id = parseInt(idParam);
    if (isNaN(id)) {
      throw new HttpException({ error: 'Invalid id' }, 400);
    }
    return id;
  }
}

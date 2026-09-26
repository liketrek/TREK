import { Body, Controller, Delete, Get, Headers, HttpCode, HttpException, Post, UseGuards } from '@nestjs/common';
import type { PushPublicKeyResult, PushSubscribeResult, PushUnsubscribeResult } from '@trek/shared';
import type { User } from '../../../types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PushSubscribeDto, PushUnsubscribeDto } from '../notifications.dto';
import { checkPushSubscription } from './push-subscription.helpers';
import { PushSubscriptionsService } from './push-subscriptions.service';
import { PUSH_UNAVAILABLE_ERROR, PushUnavailableError, VapidKeysService } from './vapid-keys.service';

/**
 * /api/notifications/push: how a browser signs up for Web Push (#894).
 *
 * The browser fetches the server's public key, subscribes with its push
 * service, and hands the subscription over here; logging out or switching push
 * off in that browser deletes it again. Which events arrive is the ordinary
 * preference matrix ('push' column), and the test send is the generic
 * POST /api/notifications/test/push.
 *
 * No MCP tool mirrors these routes on purpose: a subscription is created by a
 * browser's push manager for that one browser, and there is nothing an MCP
 * client could subscribe with.
 */
@Controller('api/notifications/push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    private readonly keys: VapidKeysService,
    private readonly subscriptions: PushSubscriptionsService,
  ) {}

  @Get('public-key')
  publicKey(): PushPublicKeyResult {
    return { publicKey: this.currentPublicKey() };
  }

  @Post('subscriptions')
  @HttpCode(200)
  subscribe(
    @CurrentUser() user: User,
    @Body() body: PushSubscribeDto,
    @Headers('user-agent') userAgent?: string,
  ): PushSubscribeResult {
    const checked = checkPushSubscription(body.subscription);
    if ('error' in checked) throw new HttpException({ error: checked.error }, 400);
    const devices = this.subscriptions.upsert(user.id, checked.value, this.currentPublicKey(), userAgent);
    return { success: true, devices };
  }

  /**
   * Idempotent: the push service may already have expired the row, and a
   * browser logging out must not get an error for that. Only the caller's own
   * endpoint can go; the same URL on someone else's account is left alone.
   * Works while push is unavailable too, so a device can always be forgotten.
   */
  @Delete('subscriptions')
  @HttpCode(200)
  unsubscribe(@CurrentUser() user: User, @Body() body: PushUnsubscribeDto): PushUnsubscribeResult {
    this.subscriptions.removeForUser(user.id, body.endpoint);
    return { success: true };
  }

  /**
   * The key browsers subscribe with. While the key pair cannot be used, stored
   * or from VAPID_* (the log says why), the answer is a 503: nothing could be
   * signed for a new subscription, and the devices already subscribed stay as
   * they are.
   */
  private currentPublicKey(): string {
    try {
      return this.keys.getPublicKey();
    } catch (err) {
      if (err instanceof PushUnavailableError) throw new HttpException({ error: PUSH_UNAVAILABLE_ERROR }, 503);
      throw err;
    }
  }
}

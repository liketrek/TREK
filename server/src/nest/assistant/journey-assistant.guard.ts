import { ADDON_IDS } from '../../addons';
import type { User } from '../../types';
import { AddonsService } from '../addons/addons.service';
import { AssistantBookContext } from './assistant-book-context';
import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';

import type { Request } from 'express';

type JourneyRequest = Request & { user?: User };

/**
 * Lets a request through to the assistant of `:journeyId` only while the
 * journey addon is on and the user can open the journey, before the body is
 * read, as TripAccessGuard does for a trip. Both refusals are a 404, worded
 * like the journey routes' own, so a stranger learns nothing about which
 * journeys exist. The AI assistant addon is checked before this (AddonGuard),
 * the session before that (JwtAuthGuard).
 */
@Injectable()
export class JourneyAssistantGuard implements CanActivate {
  constructor(
    private readonly addons: AddonsService,
    private readonly books: AssistantBookContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<JourneyRequest>();
    const user = request.user;
    if (!user) throw new HttpException({ error: 'Unauthorized' }, 401);
    if (!(await this.addons.isAddonEnabled(ADDON_IDS.JOURNEY))) {
      throw new HttpException({ error: 'Journey addon is not enabled' }, 404);
    }
    const journeyId = Number((request.params as Record<string, string>).journeyId);
    const open = Number.isInteger(journeyId) && journeyId > 0 && (await this.books.canOpen(user.id, journeyId));
    if (!open) throw new HttpException({ error: 'Journey not found' }, 404);
    return true;
  }
}

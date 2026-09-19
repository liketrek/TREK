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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AddonGuard } from '../addons/addon.guard';
import { RequireAddon } from '../addons/require-addon.decorator';
import { ADDON_IDS } from '../../addons';
import { getClientIp } from '../audit/client-ip';
import { DawarichService } from './dawarich.service';
import { DawarichSyncService } from './dawarich-sync.service';
import { DawarichSuggestionsService, AcceptError } from './dawarich-suggestions.service';
import { DawarichTracksService } from './dawarich-tracks.service';
import { DawarichError } from './dawarich.client';
import {
  DawarichAcceptDto,
  DawarichAtlasAcceptDto,
  DawarichBucketConfirmDto,
  DawarichSettingsDto,
  DawarichSuggestionStateDto,
} from './dawarich.dto';

/**
 * `/api/integrations/dawarich` — the per-user Dawarich connection and everything
 * it produces (#2279).
 *
 * Two shapes of answer, deliberately different:
 *
 * - **Connection routes** (`status`, `test`) answer 200 even when the instance
 *   is unreachable, with the reason in the body. A form that is showing someone
 *   their own typo needs a field to render, not an exception.
 * - **Data routes** answer the status the failure deserves, because a caller
 *   that asked for suggestions and got an empty list would take it as "there
 *   are none".
 *
 * The whole group is gated on the `dawarich` addon, with `AddonGuard` ahead of
 * `JwtAuthGuard` — the order every addon-gated controller in TREK uses, so that
 * a switched-off addon answers the same 404 to everyone rather than 401 to some
 * callers and 404 to others. It does mean an unauthenticated caller can learn
 * whether the addon is on; that is true of every addon here and is not a secret
 * worth a second guard order for.
 */
@Controller('api/integrations/dawarich')
@UseGuards(AddonGuard, JwtAuthGuard)
@RequireAddon(ADDON_IDS.DAWARICH, 'Dawarich')
export class DawarichController {
  constructor(
    private readonly dawarich: DawarichService,
    private readonly sync: DawarichSyncService,
    private readonly suggestions: DawarichSuggestionsService,
    private readonly tracks: DawarichTracksService,
  ) {}

  // ── Connection ─────────────────────────────────────────────────────────────

  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return this.dawarich.getConnection(user.id);
  }

  @Put('settings')
  async putSettings(
    @CurrentUser() user: User,
    @Body() body: DawarichSettingsDto,
    @Req() req: Request,
  ) {
    const result = await this.dawarich.saveSettings(
      user.id,
      body.url,
      body.apiKey,
      !!body.allowInsecureTls,
      body.syncEnabled !== false,
      getClientIp(req),
    );
    if (!result.success) {
      throw new HttpException({ error: result.error }, 400);
    }
    // A changed address or key means every cached line was drawn from somewhere
    // else. Keeping it would show the previous instance's route under the new
    // connection's name.
    this.tracks.forget(user.id);
    return result.warning ? { success: true, warning: result.warning } : { success: true };
  }

  @Delete('settings')
  @HttpCode(200)
  disconnect(@CurrentUser() user: User, @Req() req: Request) {
    this.dawarich.disconnect(user.id, getClientIp(req));
    this.tracks.forget(user.id);
    return { success: true };
  }

  @Post('test')
  @HttpCode(200)
  test(@CurrentUser() user: User, @Body() body: DawarichSettingsDto) {
    return this.dawarich.testConnection(user.id, body.url, body.apiKey, !!body.allowInsecureTls);
  }

  /** Pull now, rather than waiting for the next tick. */
  @Post('sync')
  @HttpCode(200)
  async syncNow(@CurrentUser() user: User) {
    return this.sync.syncUser(user.id);
  }

  // ── Suggestions ────────────────────────────────────────────────────────────

  @Get('suggestions')
  listSuggestions(
    @CurrentUser() user: User,
    @Query('tripId') tripId?: string,
    @Query('state') state?: string,
  ) {
    return this.suggestions.list(user.id, {
      tripId: parseOptionalId(tripId, 'tripId'),
      state: parseState(state),
    });
  }

  @Post('suggestions/:id/accept')
  @HttpCode(200)
  acceptSuggestion(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: DawarichAcceptDto,
    @Req() req: Request,
  ) {
    return this.guard(() =>
      this.suggestions.accept(user.id, parseId(id), body, socketId(req)),
    );
  }

  @Put('suggestions/:id/state')
  @HttpCode(200)
  setSuggestionState(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: DawarichSuggestionStateDto,
  ) {
    const updated = this.suggestions.setState(user.id, parseId(id), body.state);
    if (!updated) throw new HttpException({ error: 'Suggestion not found' }, 404);
    return updated;
  }

  // ── Bucket list ────────────────────────────────────────────────────────────

  /** Ask the recordings whether the caller ever reached their own wishes. */
  @Post('bucket-list/scan')
  @HttpCode(200)
  async scanBucketList(@CurrentUser() user: User) {
    return this.guardAsync(() => this.suggestions.scanBucketList(user.id));
  }

  @Post('bucket-list/confirm')
  @HttpCode(200)
  confirmBucketVisits(@CurrentUser() user: User, @Body() body: DawarichBucketConfirmDto) {
    return { updated: this.suggestions.confirmBucketVisits(user.id, body.itemIds, body.visitedAt) };
  }

  @Delete('bucket-list/:itemId/visit')
  @HttpCode(200)
  clearBucketVisit(@CurrentUser() user: User, @Param('itemId') itemId: string) {
    const cleared = this.suggestions.clearBucketVisit(user.id, parseId(itemId));
    if (!cleared) throw new HttpException({ error: 'Bucket-list entry not found' }, 404);
    return { success: true };
  }

  // ── Atlas ──────────────────────────────────────────────────────────────────

  @Get('atlas/suggestions')
  async atlasSuggestions(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const window = parseWindow(from, to);
    return this.guardAsync(() => this.suggestions.atlasSuggestions(user.id, window.from, window.to));
  }

  @Post('atlas/accept')
  @HttpCode(200)
  acceptAtlasCountries(@CurrentUser() user: User, @Body() body: DawarichAtlasAcceptDto) {
    return { marked: this.suggestions.acceptAtlasCountries(user.id, body.countryCodes) };
  }

  // ── Track overlay ──────────────────────────────────────────────────────────

  /**
   * The recorded route for a trip. Fetched from Dawarich per request and not
   * stored — see DawarichTracksService.
   */
  @Get('trips/:tripId/track')
  async tripTrack(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('offset') offset?: string,
  ) {
    const track = await this.guardAsync(() =>
      this.tracks.forTrip(user.id, parseId(tripId), parseDate(from), parseDate(to), parseOffset(offset)),
    );
    if (!track) throw new HttpException({ error: 'Trip not found' }, 404);
    return track;
  }

  /** The recorded route for an explicit range — what the journal asks for. */
  @Get('track')
  async windowTrack(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('offset') offset?: string,
  ) {
    const window = parseWindow(from, to);
    return this.guardAsync(() =>
      this.tracks.forWindow(
        user.id,
        window.from.toISOString(),
        window.to.toISOString(),
        parseOffset(offset),
      ),
    );
  }

  // ── Error shaping ──────────────────────────────────────────────────────────

  /**
   * One place where a domain error becomes an HTTP one.
   *
   * `DawarichError` keeps its own code in the body: the client renders these
   * through i18n, and the upstream sentence would otherwise reach a German
   * install in English. 502 rather than 500, because the failure is a server
   * TREK called, not TREK itself.
   */
  private guard<T>(run: () => T): T {
    try {
      return run();
    } catch (err) {
      throw toHttp(err);
    }
  }

  private async guardAsync<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (err) {
      throw toHttp(err);
    }
  }
}

function toHttp(err: unknown): HttpException {
  if (err instanceof AcceptError) {
    return new HttpException({ error: err.message, code: err.code }, err.status);
  }
  if (err instanceof DawarichError) {
    return new HttpException(
      { error: err.message, code: err.code, ...(err.detail ? { detail: err.detail } : {}) },
      err.code === 'unauthorized' || err.code === 'forbidden' ? 400 : 502,
    );
  }
  if (err instanceof HttpException) return err;
  return new HttpException({ error: 'Dawarich request failed', code: 'server_error' }, 502);
}

/** Ids are integers. `parseInt` would turn "12abc" into 12 and log a request nobody made. */
function parseId(raw: string): number {
  if (!/^\d+$/.test(raw)) throw new HttpException({ error: 'Invalid id' }, 400);
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpException({ error: 'Invalid id' }, 400);
  return id;
}

function parseOptionalId(raw: string | undefined, label: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  if (!/^\d+$/.test(raw)) throw new HttpException({ error: `Invalid ${label}` }, 400);
  return Number(raw);
}

/** An unknown state is a 400 rather than a silently unfiltered list. */
function parseState(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === '') return undefined;
  if (raw !== 'new' && raw !== 'accepted' && raw !== 'dismissed') {
    throw new HttpException({ error: 'state must be one of: new, accepted, dismissed' }, 400);
  }
  return raw;
}

/**
 * The caller's UTC offset in minutes, as `Date.getTimezoneOffset()` negated —
 * +120 for Berlin in summer.
 *
 * Points from Dawarich are bare instants, so "which day was that" can only be
 * answered in somebody's timezone, and the browser is the only party that knows
 * which one. Absent or unreadable means UTC, which is what the endpoint did
 * before it asked. Bounded to the real range of world offsets (-12h..+14h) so a
 * junk value cannot shift a day by a week.
 */
function parseOffset(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 0;
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.max(-720, Math.min(840, Math.trunc(value)));
}

function parseDate(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === '') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new HttpException({ error: 'Dates must be ISO, YYYY-MM-DD' }, 400);
  }
  return raw;
}

/**
 * An explicit instant window. Both ends are required together: a half-open
 * range would silently become "everything since the epoch" on one side, which
 * is the request that makes an instance time out.
 */
function parseWindow(from: string | undefined, to: string | undefined): { from: Date; to: Date } {
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (!start || !end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new HttpException({ error: 'from and to are required ISO timestamps' }, 400);
  }
  if (end <= start) throw new HttpException({ error: 'to must be after from' }, 400);
  const MAX_DAYS = 400;
  if (end.getTime() - start.getTime() > MAX_DAYS * 86_400_000) {
    throw new HttpException({ error: `Window must be ${MAX_DAYS} days or less` }, 400);
  }
  return { from: start, to: end };
}

/** The originating client's socket id, so a broadcast does not echo back to it. */
function socketId(req: Request): string | undefined {
  const header = req.headers['x-socket-id'];
  return typeof header === 'string' && header ? header : undefined;
}

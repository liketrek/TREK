import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { ResponseContract } from '../common/response-contract';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { WalletPassService } from './wallet-pass.service';
import { walletLanguage } from './wallet-pass.words';
import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import {
  googleWalletAvailabilityResponseSchema,
  googleWalletSaveResponseSchema,
  type GoogleWalletAvailabilityResponse,
  type GoogleWalletSaveResponse,
} from '@trek/shared';

import type { Response } from 'express';

/**
 * GET /api/trips/:tripId/reservations/:id/wallet-pass: the booking's Apple
 * Wallet pass, which the iOS app hands to Wallet's own sheet (native/wallet.ts).
 * GET .../wallet-pass/google: the same booking as a Google Wallet save link,
 * which the Android app opens. GET .../google-wallet: whether that works here
 * at all, so the app offers the button only where it does.
 */
@Controller('api/trips/:tripId/reservations')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class WalletPassController {
  constructor(private readonly passes: WalletPassService) {}

  // response-contract-exempt: answers the signed .pkpass bytes through @Res(), not JSON.
  @Get(':id/wallet-pass')
  async pass(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const pass = await this.passes.passFor(user.id, tripId, id, walletLanguage(lang));
    res.set('Cache-Control', 'no-store');
    res.set('Content-Disposition', `attachment; filename="${pass.filename}"`);
    res.status(200).type('application/vnd.apple.pkpass').send(pass.bytes);
  }

  @Get('google-wallet')
  @ResponseContract(googleWalletAvailabilityResponseSchema)
  async googleAvailability(): Promise<GoogleWalletAvailabilityResponse> {
    return { available: await this.passes.googleAvailable() };
  }

  @Get(':id/wallet-pass/google')
  @ResponseContract(googleWalletSaveResponseSchema)
  async google(
    @CurrentUser() user: User,
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang: string | undefined,
  ): Promise<GoogleWalletSaveResponse> {
    return { saveUrl: await this.passes.googleSaveUrlFor(user.id, tripId, id, walletLanguage(lang)) };
  }
}

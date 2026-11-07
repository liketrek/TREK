import type { User } from '../../types';
import { CurrentUser } from '../auth-core/current-user.decorator';
import { JwtAuthGuard } from '../auth-core/jwt-auth.guard';
import { TripAccessGuard } from '../permissions/trip-access.guard';
import { WalletPassService } from './wallet-pass.service';
import { walletLanguage } from './wallet-pass.words';
import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';

import type { Response } from 'express';

/**
 * GET /api/trips/:tripId/reservations/:id/wallet-pass: the booking's Apple
 * Wallet pass, which the iOS app hands to Wallet's own sheet (native/wallet.ts).
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
}

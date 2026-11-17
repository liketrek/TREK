import { AppConfigModule } from '../app-config/app-config.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ReservationsReadModule } from '../reservations/reservations-read.module';
import { WalletPassController } from './wallet-pass.controller';
import { WalletPassService } from './wallet-pass.service';
import { Module } from '@nestjs/common';

/** Apple Wallet passes for bookings, signed by the TREK services (wallet-pass.service.ts). */
@Module({
  imports: [AppConfigModule, RateLimitModule, PermissionsModule, ReservationsReadModule],
  controllers: [WalletPassController],
  providers: [WalletPassService],
})
export class WalletPassModule {}

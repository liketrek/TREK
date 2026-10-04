import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { GoogleApiUsage } from '../../db/entities/GoogleApiUsage.entity';
import { AuditModule } from '../audit/audit.module';
import { GoogleQuotaController } from './google-quota.controller';
import { GoogleQuotaService } from './google-quota.service';

/**
 * The daily ceiling on Google API calls (#1582). A leaf: MapsModule and
 * TransitModule import it for the service, the admin settings use the controller.
 *
 * MikroOrmModule.forFeature([AppSettings, GoogleApiUsage]): the ceiling lives
 * in `app_settings`, the per-day count in `google_api_usage`.
 */
@Module({
  imports: [AuditModule, MikroOrmModule.forFeature([AppSettings, GoogleApiUsage])],
  controllers: [GoogleQuotaController],
  providers: [GoogleQuotaService],
  exports: [GoogleQuotaService],
})
export class GoogleQuotaModule {}

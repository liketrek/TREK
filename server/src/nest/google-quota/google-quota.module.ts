import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GoogleQuotaController } from './google-quota.controller';
import { GoogleQuotaService } from './google-quota.service';

/**
 * The daily ceiling on Google API calls (#1582). A leaf: MapsModule and
 * TransitModule import it for the service, the admin settings use the controller.
 */
@Module({
  imports: [AuditModule],
  controllers: [GoogleQuotaController],
  providers: [GoogleQuotaService],
  exports: [GoogleQuotaService],
})
export class GoogleQuotaModule {}

import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SettingsModule } from '../settings/settings.module';
import { IssuerClient } from './issuer.client';
import { QuotaTracker } from './quota-tracker';
import { ServiceClock } from './service-clock';
import { ServiceIdentityController } from './service-identity.controller';
import { ServiceIdentityPort, serviceIdentitySlot } from './service-identity.interface';
import { ServiceIdentityService } from './service-identity.service';
import { ServiceKeyJob } from './service-key.job';
import { ServiceKeyService } from './service-key.service';
import { ServiceKeyStore } from './service-key.store';
import { ServiceRequestIdentity } from './service-request-identity';
import { Module, type OnModuleDestroy } from '@nestjs/common';

/**
 * The installation identity towards the liketrek services: the key, its
 * registration and renewal, and the admin view of it. The Places client reads
 * the request side through serviceIdentitySlot, which this module fills with
 * the port the container resolved.
 */
@Module({
  imports: [AppConfigModule, AuditModule, SchedulingModule, SettingsModule],
  controllers: [ServiceIdentityController],
  providers: [
    IssuerClient,
    QuotaTracker,
    ServiceClock,
    ServiceIdentityService,
    ServiceKeyJob,
    ServiceKeyService,
    ServiceKeyStore,
    { provide: ServiceIdentityPort, useClass: ServiceRequestIdentity },
  ],
})
export class ServiceIdentityModule implements OnModuleDestroy {
  constructor(private readonly port: ServiceIdentityPort) {
    serviceIdentitySlot.install(port);
  }

  onModuleDestroy(): void {
    serviceIdentitySlot.release(this.port);
  }
}

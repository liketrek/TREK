import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { VacayService } from './vacay.service';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class VacayIcsRefreshJob implements OnApplicationBootstrap {
  constructor(
    private readonly registrar: CronRegistrarService,
    private readonly vacay: VacayService,
  ) {}
  onApplicationBootstrap(): void {
    if (this.registrar.isEnabled())
      this.registrar.register('vacay-ics-refresh', '0 8 * * *', () => this.vacay.refreshIcsCalendars());
  }
}

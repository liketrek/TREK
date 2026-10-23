import { logError } from '../audit/audit-log.logger';
import { CronRegistrarService } from '../scheduling/cron-registrar.service';
import { TransferNativeFiles } from './transfer-native-files';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class TransferRetentionJob implements OnApplicationBootstrap {
  constructor(
    private readonly registrar: CronRegistrarService,
    private readonly files: TransferNativeFiles,
  ) {}
  onApplicationBootstrap() {
    if (!this.registrar.isEnabled()) return;
    void this.registrar.runOnBoot('travel-transfer-retention-boot', () => this.sweep());
    this.registrar.register('travel-transfer-retention', '17 * * * *', () => this.sweep(), { timezone: 'none' });
  }
  async sweep() {
    try {
      await this.files.sweep();
    } catch {
      logError('Travel transfer orphan cleanup failed; retrying next hour');
    }
  }
}

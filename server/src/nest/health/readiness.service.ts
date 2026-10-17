import { Injectable, type BeforeApplicationShutdown } from '@nestjs/common';

/**
 * Whether this process still wants traffic. It stops wanting it the moment a
 * shutdown starts: index.ts marks it before the drain begins, and Nest's own
 * shutdown hook marks it too, for a close that does not come through
 * index.ts. The readiness probe answers 503 from then on, so an orchestrator
 * moves traffic away during the drain instead of one probe period later.
 */
@Injectable()
export class ReadinessService implements BeforeApplicationShutdown {
  private draining = false;

  markDraining(): void {
    this.draining = true;
  }

  isDraining(): boolean {
    return this.draining;
  }

  beforeApplicationShutdown(): void {
    this.markDraining();
  }
}

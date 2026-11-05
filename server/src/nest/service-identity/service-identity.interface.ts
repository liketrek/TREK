import { ProcessStoreSlot } from '../common/process-store-slot';

/**
 * What a client of a liketrek service asks before and after each request: the
 * headers that identify this installation, and a look at the answer (quota
 * headers, the server's clock, a refused key).
 *
 * The Places client is plain functions, so it reads the port from the slot
 * below instead of taking it through a constructor. ServiceIdentityModule
 * installs the implementation the container resolved.
 */
export abstract class ServiceIdentityPort {
  abstract headersFor(url: URL): Record<string, string>;
  abstract observe(url: URL, response: Response): void;
}

/** A process without the module (a hand-built test) sends what it sent before. */
class AnonymousIdentity extends ServiceIdentityPort {
  headersFor(): Record<string, string> {
    return {};
  }

  observe(): void {}
}

export const serviceIdentitySlot = new ProcessStoreSlot<ServiceIdentityPort>(new AnonymousIdentity());

import { Inject, Injectable } from '@nestjs/common';
import { PHOTO_PROVIDERS, type PhotoProvider } from './photo-provider';

/**
 * Where the `switch (photo.provider)` went (#584).
 *
 * Adding a backend is registering an adapter under PHOTO_PROVIDERS in
 * memories.module.ts — no dispatch site changes, because there is one.
 * Whether a registered provider is ENABLED is a separate question, answered by
 * the photo_providers table in UnifiedMemoriesService; this only knows what the
 * server can talk to at all.
 */
@Injectable()
export class PhotoProviderRegistry {
  private readonly byId: Map<string, PhotoProvider>;

  constructor(@Inject(PHOTO_PROVIDERS) providers: readonly PhotoProvider[]) {
    this.byId = new Map(providers.map((p) => [p.id, p]));
  }

  /** The provider for a stored photo's `provider` column, or undefined. */
  get(id: string | null | undefined): PhotoProvider | undefined {
    return id ? this.byId.get(id) : undefined;
  }

  /** Registered ids, for error messages and diagnostics. */
  ids(): string[] {
    return [...this.byId.keys()];
  }
}

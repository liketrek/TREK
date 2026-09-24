import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_PROVIDERS, type DocumentProvider } from './document-provider';

/**
 * The one dispatch site for document providers.
 *
 * Same shape as PhotoProviderRegistry, and for the same reason: adding a
 * backend is registering an adapter in the module, not editing a switch that
 * exists in four places. Whether a registered provider is switched ON is a
 * different question, answered by the `document_providers` table plus the
 * `documents` addon. This only knows what the server can talk to at all.
 */
@Injectable()
export class DocumentProviderRegistry {
  private readonly byId: Map<string, DocumentProvider>;

  constructor(@Inject(DOCUMENT_PROVIDERS) providers: readonly DocumentProvider[]) {
    this.byId = new Map(providers.map((p) => [p.id, p]));
  }

  get(id: string | null | undefined): DocumentProvider | undefined {
    return id ? this.byId.get(id) : undefined;
  }

  ids(): string[] {
    return [...this.byId.keys()];
  }
}

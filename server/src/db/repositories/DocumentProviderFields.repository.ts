import type { DocumentProviderFields } from '../entities/DocumentProviderFields.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** DSC2's projection — every column the connection form needs, minus `id`/`provider_id`. */
export interface DocumentProviderFieldRow {
  field_key: string;
  /** i18n key suffix, never display text: the client resolves `docsync.<label>`. */
  label: string;
  input_type: string;
  placeholder: string | null;
  hint: string | null;
  secret: number;
  required: number;
  sort_order: number;
}

/** A bare `document_provider_fields` row (every scalar column), for parity with the entity's own scalar keys. */
export interface DocumentProviderFieldFullRow extends DocumentProviderFieldRow {
  id: number;
  provider_id: string;
}

const _fieldRowKeys: AssertRowKeys<DocumentProviderFieldFullRow, DocumentProviderFields> = true;

/**
 * `document_provider_fields` — the per-provider form-field catalog (which
 * credentials a connection needs, which are secret, which are required).
 * Read-only, same reasoning as `DocumentProvidersRepository`: no statement
 * anywhere in doc-sync writes to this table.
 */
export class DocumentProviderFieldsRepository extends TrekRepository<DocumentProviderFields> {
  /**
   * DSC2 (`DocSyncConfigService.providerFields`) — `SELECT field_key, label,
   * input_type, placeholder, hint, secret, required, sort_order FROM
   * document_provider_fields WHERE provider_id = ? ORDER BY sort_order`.
   */
  async listForProvider(providerId: string): Promise<DocumentProviderFieldRow[]> {
    const rows = await this.find(
      { provider_id: providerId },
      {
        fields: ['field_key', 'label', 'input_type', 'placeholder', 'hint', 'secret', 'required', 'sort_order'],
        orderBy: { sort_order: 'asc' },
      },
    );
    return rows.map((r) => ({
      field_key: r.field_key,
      label: r.label,
      input_type: r.input_type,
      placeholder: r.placeholder ?? null,
      hint: r.hint ?? null,
      secret: r.secret ?? 0,
      required: r.required ?? 0,
      sort_order: r.sort_order ?? 0,
    }));
  }
}

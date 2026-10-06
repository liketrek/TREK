import type { PhotoProviderFields } from '../entities/PhotoProviderFields.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `photo_provider_fields` row as the API emits it. */
export interface PhotoProviderFieldRow {
  id: number;
  provider_id: string;
  field_key: string;
  label: string;
  input_type: string;
  placeholder: string | null;
  hint: string | null;
  required: number | null;
  secret: number | null;
  settings_key: string | null;
  payload_key: string | null;
  sort_order: number | null;
}

const _photoProviderFieldRowKeys: AssertRowKeys<PhotoProviderFieldRow, PhotoProviderFields> = true;

export class PhotoProviderFieldsRepository extends TrekRepository<PhotoProviderFields> {
  /**
   * `SELECT provider_id, field_key, label, input_type, placeholder, hint,
   * required, secret, settings_key, payload_key, sort_order FROM
   * photo_provider_fields ORDER BY sort_order, id` — `provider_id` is the
   * `persist(false)` twin of the `provider` relation (Days.trip_id
   * precedent): reading it back after `find()` needs no extra populate, only
   * a `create()`/twin write would.
   *
   * `disableIdentityMap: true`, applied by the base class's default (Plan 3b
   * interlude B — `_shared/trek-repository.ts`) — a "rows out"
   * read, converted via `toRow` and discarded.
   */
  async listAllOrdered(): Promise<PhotoProviderFieldRow[]> {
    const rows = await this.find({}, { orderBy: { sort_order: 'asc', id: 'asc' } });
    return rows.map((row) => toRow(row) as PhotoProviderFieldRow);
  }

  /**
   * AD28 (`admin.service.ts#listAddons`) — `SELECT provider_id, field_key,
   * label, input_type, placeholder, required, secret, settings_key,
   * payload_key, sort_order FROM photo_provider_fields ORDER BY sort_order,
   * id`. A NARROWER projection than {@link listAllOrdered} — no `id`, no
   * `hint` — a genuinely different column set for a different caller, not a
   * superset reuse (Task 0's report: parity is column-exact here).
   *
   * Plan 3i Task 4 fix wave: the `fields` list below names `'provider'` (the
   * real relation), not `provider_id` — `provider_id` is the `persist(false)`
   * shadow scalar and MikroORM's `fields` projection never selects it, so
   * every row came back with `provider_id: undefined` and every photo
   * provider grouped under `undefined` (`fields: []` in the admin response).
   * `toRow`'s `AssertRowKeys` maps the populated `provider` relation back onto
   * the flat `provider_id` column the same way {@link listAllOrdered} does.
   */
  async listAllOrderedForAdminShelf(): Promise<PhotoProviderFieldForAdminRow[]> {
    const rows = await this.find(
      {},
      {
        fields: [
          'provider',
          'field_key',
          'label',
          'input_type',
          'placeholder',
          'required',
          'secret',
          'settings_key',
          'payload_key',
          'sort_order',
        ],
        orderBy: { sort_order: 'asc', id: 'asc' },
      },
    );
    return rows.map((row) => ({
      // `row.provider.id` reads the raw `provider_id` COLUMN VALUE off the
      // (unpopulated) relation reference the `fields: ['provider', …]`
      // projection loaded — the same `row.<relation>.id` shape
      // `OauthTokens.repository.ts`/`McpTokens.repository.ts` already use,
      // not `row.provider_id`: that shadow scalar is never selected by a
      // narrowed `fields` projection (this method's own fix-wave docstring
      // above).
      provider_id: row.provider.id,
      field_key: row.field_key,
      label: row.label,
      input_type: row.input_type,
      placeholder: row.placeholder ?? null,
      required: row.required ?? null,
      secret: row.secret ?? null,
      settings_key: row.settings_key ?? null,
      payload_key: row.payload_key ?? null,
      sort_order: row.sort_order ?? null,
    }));
  }
}

/** AD28's own row shape — see {@link PhotoProviderFieldsRepository.listAllOrderedForAdminShelf}. */
export interface PhotoProviderFieldForAdminRow {
  provider_id: string;
  field_key: string;
  label: string;
  input_type: string;
  placeholder: string | null;
  required: number | null;
  secret: number | null;
  settings_key: string | null;
  payload_key: string | null;
  sort_order: number | null;
}

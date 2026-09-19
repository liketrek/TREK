import { useState } from 'react'
import type { DocSyncConnection, DocSyncProvider, useDocSync } from './useDocSync'

/**
 * The credential form's rules, for both shells.
 *
 * Which field carries the address, which one must not be drawn as a text box,
 * how a label becomes a translation key, what counts as filled in when a secret
 * is already stored: every one of those is a rule, and every one of them was
 * wrong in the phone sheet while being right on the desktop. The phone read the
 * address under `baseUrl` while the server names the field `base_url`, so every
 * connection it saved carried an empty address; it drew `allow_insecure_tls` as
 * a text input and always sent false; and it built label keys a different way,
 * so the labels rendered as raw keys.
 *
 * None of that is markup, so none of it belongs in a component.
 */

/** The field that holds the address rather than a credential. */
export const BASE_URL_FIELD = 'base_url'

/** Rendered as a switch beside the fields, never as one of them. */
export const INSECURE_TLS_FIELD = 'allow_insecure_tls'

export interface ConnectForm {
  /** The fields to draw, in order, minus the ones with their own control. */
  fields: DocSyncProvider['fields']
  /** Translation key for a field's label, and for its hint where it has one. */
  labelKey: (field: DocSyncProvider['fields'][number]) => string
  hintKey: (field: DocSyncProvider['fields'][number]) => string | undefined
  /** What to show in a field: the typed value, else what is stored. */
  valueOf: (fieldKey: string) => string
  /** A stored secret never comes back, so its box shows dots instead. */
  placeholderOf: (field: DocSyncProvider['fields'][number]) => string
  setValue: (fieldKey: string, value: string) => void
  baseUrl: string
  credentials: Record<string, string>
  insecureTls: boolean
  setInsecureTls: (on: boolean) => void
  /** Every required field is either filled in or already stored. */
  complete: boolean
  probe: () => Promise<{ connected: boolean; account?: string; error?: string }>
  save: () => Promise<boolean>
}

export function useConnectForm(
  provider: DocSyncProvider,
  existing: DocSyncConnection | null,
  sync: ReturnType<typeof useDocSync>,
): ConnectForm {
  const [values, setValues] = useState<Record<string, string>>({})
  // Null until touched, so a connection that arrives after the form opened is
  // still reflected. Seeding from `existing` at mount showed a stored "allow
  // self-signed" as off and wrote that back on the next save.
  const [insecure, setInsecure] = useState<boolean | null>(null)

  const insecureTls = insecure ?? existing?.allowInsecureTls ?? false

  /**
   * What a box shows.
   *
   * A secret shows only what was typed into it this time, never what is stored:
   * a stored credential must not travel back to a browser, and a value that
   * ended up in `settings` by mistake must not become the one place it leaks.
   * The address lives in its own column rather than in settings, so it is read
   * from there; everything else comes out of settings.
   */
  const secretKeys = new Set(provider.fields.filter(f => f.secret).map(f => f.field_key))
  const valueOf = (key: string) => {
    if (secretKeys.has(key)) return values[key] ?? ''
    return values[key] ?? (key === BASE_URL_FIELD ? existing?.baseUrl : existing?.settings?.[key]) ?? ''
  }

  const baseUrl = valueOf(BASE_URL_FIELD)
  // The address stays in here as well as in its own argument: the server walks
  // the provider's fields over `credentials` and would otherwise store no
  // `base_url` setting. It special-cases the key when checking completeness, so
  // dropping it changes nothing it needs, but it is an established request
  // shape and this is not the change to alter it in.
  const credentials = Object.fromEntries(
    Object.entries(values).filter(([k]) => k !== INSECURE_TLS_FIELD),
  )

  const fields = provider.fields.filter(f => f.field_key !== INSECURE_TLS_FIELD)

  const complete = fields.every(f => {
    if (!f.required) return true
    if (f.secret) return (values[f.field_key] ?? '').length > 0 || !!existing?.secrets?.[f.field_key]
    return valueOf(f.field_key).trim().length > 0
  })

  return {
    fields,
    // The label and hint columns store a key suffix, not text.
    labelKey: f => `docsync.${f.label}`,
    hintKey: f => (f.hint ? `docsync.${f.hint}` : undefined),
    valueOf,
    placeholderOf: f =>
      f.secret && existing?.secrets?.[f.field_key] ? '••••••••' : f.placeholder || '',
    setValue: (key, value) => setValues(v => ({ ...v, [key]: value })),
    baseUrl,
    credentials,
    insecureTls,
    setInsecureTls: setInsecure,
    complete,
    probe: () => sync.testConnection(provider.id, baseUrl, credentials, insecureTls),
    save: () => sync.saveConnection(provider.id, baseUrl, credentials, insecureTls),
  }
}

import type { NativeDomain, NativeRow } from '../../db/repositories/_shared/transfer-native-domains';
import { canonical, fail } from './transfer-wire';
import { toMinor } from '@trek/shared';

const flags = new Set(['checked', 'end_day', 'needs_review', 'paid']);
const decimals = new Set(['total_price', 'amount', 'exchange_rate', 'weight_grams', 'weight_limit_grams']);
const positions = new Set(['day_number', 'order_index', 'sort_order', 'sequence', 'day_plan_position']);
const dates = new Set(['date', 'due_date', 'local_date']);
const kinds = new Set([
  'flight',
  'train',
  'accommodation',
  'car',
  'bus',
  'ferry',
  'taxi',
  'bicycle',
  'cruise',
  'transit',
  'transport_other',
  'restaurant',
  'event',
  'tour',
  'activity',
  'parking',
  'other',
]);
const statuses = new Set(['planned', 'confirmed', 'cancelled', 'completed']);
export function nativeFieldName(domain: NativeDomain, column: string, fields: Record<string, unknown> = {}): string {
  if (domain.table === 'reservation_endpoints' && ['local_date', 'local_time'].includes(column))
    return (fields.role === 'from' ? 'departure_' : 'arrival_') + (column === 'local_date' ? 'date_text' : 'time_text');
  return (
    domain.aliases[column] ??
    (domain.writable.length && !domain.writable.includes(column) && !domain.references[column]
      ? 'trek_' + column
      : column)
  );
}
export function portableValue(domain: NativeDomain, column: string, value: NativeRow[string]): unknown {
  if (domain.table === 'todo_items' && column === 'priority')
    return value === 1 ? 'high' : value === 3 ? 'low' : 'normal';
  if (domain.table === 'reservations' && column === 'type') {
    if (value === 'hotel') return 'accommodation';
    if (value === 'rental_car') return 'car';
    return kinds.has(String(value)) ? value : 'other';
  }
  if (domain.table === 'reservations' && column === 'status') return statuses.has(String(value)) ? value : 'planned';
  if (domain.table === 'day_assignments' && ['assignment_time', 'assignment_end_time'].includes(column))
    return value ? { local: String(value), zone: '', utc: null, original_text: String(value) } : {};
  if (column === 'deleted_at')
    return typeof value === 'string' ? value.replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(value) ? '' : 'Z') : null;
  if (decimals.has(column)) return value === null ? null : String(value);
  if (flags.has(column)) return Boolean(value);
  if (domain.table === 'budget_items' && ['persons', 'days', 'sort_order'].includes(column))
    return String(value ?? (column === 'sort_order' ? 0 : 1));
  if (positions.has(column)) return value ?? 0;
  if (value === null && domain.writable.includes(column) && !domain.numeric.includes(column) && !dates.has(column))
    return '';
  return value;
}
/** Keep the source storage spelling whenever its portable representation is unchanged. */
export function nativeValue(domain: NativeDomain, column: string, fields: Record<string, unknown>): unknown {
  const name = nativeFieldName(domain, column, fields),
    value = fields[name];
  const retained = fields.trek_native_values;
  if (retained && typeof retained === 'object' && !Array.isArray(retained) && Object.hasOwn(retained, column)) {
    const raw = (retained as Record<string, unknown>)[column];
    if (
      (raw === null || typeof raw === 'string' || typeof raw === 'number') &&
      canonical(portableValue(domain, column, raw as NativeRow[string])) === canonical(value)
    )
      return raw;
  }
  if (domain.table === 'todo_items' && column === 'priority') {
    if (!['high', 'normal', 'low'].includes(String(value))) fail('Invalid task priority', 422);
    return value === 'high' ? 1 : value === 'low' ? 3 : 2;
  }
  if (domain.table === 'reservations' && column === 'type') return value === 'accommodation' ? 'hotel' : value;
  if (domain.table === 'day_assignments' && ['assignment_time', 'assignment_end_time'].includes(column)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Invalid itinerary time', 422);
    const local = (value as Record<string, unknown>).local;
    if (local === undefined && !Object.keys(value).length) return null;
    if (typeof local !== 'string') fail('Invalid itinerary time', 422);
    return local;
  }
  if (flags.has(column)) {
    if (typeof value !== 'boolean' && value !== null) fail('Invalid native boolean', 422);
    return value === null ? null : Number(value);
  }
  if (decimals.has(column) && value !== null) {
    if (
      typeof value !== 'string' ||
      !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) ||
      !Number.isFinite(Number(value)) ||
      normalDecimal(String(Number(value))) !== normalDecimal(value)
    )
      fail('Decimal cannot be represented exactly by native TREK storage', 422);
    return Number(value);
  }
  if (
    domain.table === 'budget_items' &&
    ['persons', 'days', 'sort_order'].includes(column) &&
    typeof value === 'string'
  ) {
    if (!/^-?\d+$/.test(value)) fail('Invalid native integer', 422);
    return Number(value);
  }
  return value;
}
function normalDecimal(value: string): string {
  const [mantissa, exponent = '0'] = value.toLowerCase().split('e');
  const negative = mantissa.startsWith('-');
  const [whole, fraction = ''] = mantissa.replace(/^-/, '').split('.');
  let digits = (whole + fraction).replace(/^0+/, '') || '0',
    power = Number(exponent) - fraction.length;
  while (digits.endsWith('0') && digits !== '0') {
    digits = digits.slice(0, -1);
    power++;
  }
  return digits === '0' ? '0' : (negative ? '-' : '') + digits + 'e' + power;
}
function minor(value: number): string {
  const result = toMinor(value);
  if (!Number.isFinite(value) || !Number.isSafeInteger(result))
    fail('Native amount exceeds exact transfer precision', 422);
  return String(result);
}
export function decoratePortable(
  domain: NativeDomain,
  row: NativeRow,
  fields: Record<string, unknown>,
  currency: string,
): void {
  if (domain.table === 'budget_items') {
    fields.currency = row.currency || currency;
    // TREK's ledger always uses hundredths, including currencies displayed with another precision.
    fields.exponent = 2;
    fields.amount_minor = minor(Number(row.total_price));
    if (Number(row.exchange_rate) > 0) {
      fields.fx_base_currency = currency;
      fields.fx_base_exponent = 2;
      fields.fx_direction = 'base_per_source';
      fields.fx_rounding = 'half_positive';
    } else {
      delete fields.fx_rate;
    }
  }
  if (['budget_item_members', 'budget_item_payers', 'budget_settlements'].includes(domain.table)) {
    fields.amount_text = row.amount === null ? '' : String(row.amount);
    fields.amount_minor = row.amount === null ? null : minor(Number(row.amount));
    if (domain.table === 'budget_settlements') {
      fields.currency = row.currency || currency;
      fields.exponent = 2;
      fields.notes = row.note ?? '';
    }
  }
  if (domain.table === 'packing_items') fields.quantity = row.quantity ?? 1;
  if (domain.table === 'trip_files') {
    fields.mime = row.mime_type || 'application/octet-stream';
    fields.description = row.description ?? '';
  }
}

// The full set of currencies the Frankfurter v2 FX API supports (archived codes
// excluded), so every selectable currency actually converts. Regenerate from
// `GET https://api.frankfurter.dev/v2/currencies?expand=providers` (iso_code +
// symbol) if the provider's list changes. See issue #1470.
export const CURRENCIES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD',
  'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNH', 'CNY',
  'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
  'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP',
  'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS',
  'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES',
  'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP',
  'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT',
  'MOP', 'MRO', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD',
  'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP',
  'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD',
  'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN',
  'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD',
  'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV',
  'WST', 'XAF', 'XAG', 'XAU', 'XCD', 'XCG', 'XDR', 'XOF', 'XPD', 'XPF',
  'XPT', 'YER', 'ZAR', 'ZMW', 'ZWG',
]

export const SYMBOLS: Record<string, string> = {
  AED: 'د.إ', AFN: '؋', ALL: 'L', AMD: '֏', ANG: 'ƒ',
  AOA: 'Kz', ARS: '$', AUD: '$', AWG: 'ƒ', AZN: '₼',
  BAM: 'КМ', BBD: '$', BDT: '৳', BHD: 'د.ب', BIF: 'Fr',
  BMD: '$', BND: '$', BOB: 'Bs.', BRL: 'R$', BSD: '$',
  BTN: 'Nu.', BWP: 'P', BYN: 'Br', BZD: '$', CAD: '$',
  CDF: 'Fr', CHF: 'CHF', CLP: '$', CNH: '¥', CNY: '¥',
  COP: '$', CRC: '₡', CUP: '$', CVE: '$', CZK: 'Kč',
  DJF: 'Fdj', DKK: 'kr.', DOP: '$', DZD: 'د.ج', EGP: 'ج.م',
  ERN: 'Nfk', ETB: 'Br', EUR: '€', FJD: '$', FKP: '£',
  GBP: '£', GEL: '₾', GGP: '£', GHS: '₵', GIP: '£',
  GMD: 'D', GNF: 'Fr', GTQ: 'Q', GYD: '$', HKD: '$',
  HNL: 'L', HTG: 'G', HUF: 'Ft', IDR: 'Rp', ILS: '₪',
  IMP: '£', INR: '₹', IQD: 'ع.د', IRR: '﷼', ISK: 'kr.',
  JEP: '£', JMD: '$', JOD: 'د.ا', JPY: '¥', KES: 'KSh',
  KGS: 'som', KHR: '៛', KMF: 'Fr', KPW: '₩', KRW: '₩',
  KWD: 'د.ك', KYD: '$', KZT: '₸', LAK: '₭', LBP: 'ل.ل',
  LKR: '₨', LRD: '$', LSL: 'L', LYD: 'ل.د', MAD: 'د.م.',
  MDL: 'L', MGA: 'Ar', MKD: 'ден', MMK: 'K', MNT: '₮',
  MOP: 'P', MRO: 'UM', MRU: 'UM', MUR: '₨', MVR: 'MVR',
  MWK: 'MK', MXN: '$', MYR: 'RM', MZN: 'MTn', NAD: '$',
  NGN: '₦', NIO: 'C$', NOK: 'kr', NPR: 'Rs.', NZD: '$',
  OMR: 'ر.ع.', PAB: 'B/.', PEN: 'S/', PGK: 'K', PHP: '₱',
  PKR: '₨', PLN: 'zł', PYG: '₲', QAR: 'ر.ق', RON: 'Lei',
  RSD: 'RSD', RUB: '₽', RWF: 'FRw', SAR: 'ر.س', SBD: '$',
  SCR: '₨', SDG: '£', SEK: 'kr', SGD: '$', SHP: '£',
  SLE: 'Le', SOS: 'Sh', SRD: '$', SSP: '£', STN: 'Db',
  SVC: '₡', SYP: '£S', SZL: 'E', THB: '฿', TJS: 'ЅМ',
  TMT: 'm', TND: 'د.ت', TOP: 'T$', TRY: '₺', TTD: '$',
  TWD: '$', TZS: 'Sh', UAH: '₴', UGX: 'USh', USD: '$',
  UYU: '$U', UZS: 'so\'m', VES: 'Bs', VND: '₫', VUV: 'Vt',
  WST: 'T', XAF: 'CFA', XAG: 'oz t', XAU: 'oz t', XCD: '$',
  XCG: 'Cg', XDR: 'SDR', XOF: 'Fr', XPD: 'oz t', XPF: 'Fr',
  XPT: 'oz t', YER: '﷼', ZAR: 'R', ZMW: 'K', ZWG: 'ZiG',
}

// Keep a currency the user already saved selectable even after it leaves the
// supported set (e.g. archived BGN/HRK), so opening an existing item or settings
// row doesn't silently blank the field and wipe the value on the next save.
export function currenciesWith(current?: string | null): readonly string[] {
  const cur = (current || '').toUpperCase()
  return cur && !CURRENCIES.includes(cur) ? [...CURRENCIES, cur] : CURRENCIES
}

export const PIE_COLORS =['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#a855f7']

export const SPLIT_COLORS = [
  { solid: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { solid: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { solid: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #22c55e)' },
  { solid: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  { solid: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { solid: '#a855f7', gradient: 'linear-gradient(135deg, #a855f7, #d946ef)' },
]

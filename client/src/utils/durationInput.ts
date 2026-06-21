const PLAIN_NUMBER_RE = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/
const DURATION_TOKEN_RE = /([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(hours?|hrs?|hr|h|minutes?|mins?|min|m)(?![a-z])/gi

function normalizeDecimalSeparators(input: string): string {
  return input.trim().toLowerCase().replace(/(\d),(\d)/g, '$1.$2')
}

function onlyTokenSeparators(value: string): boolean {
  return value.trim() === '' || /^[,+\s]+$/.test(value)
}

interface ParseDurationOptions {
  allowZero?: boolean
}

function roundMinutes(value: number, allowZero = false): number | null {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) return null
  const rounded = Math.round(value)
  if (rounded > 0) return rounded
  return allowZero && rounded === 0 ? 0 : null
}

export function parseDurationMinutes(input: unknown, options: ParseDurationOptions = {}): number | null {
  if (typeof input === 'number') return roundMinutes(input, options.allowZero)
  if (typeof input !== 'string') return null

  const value = normalizeDecimalSeparators(input)
  if (!value) return null

  if (PLAIN_NUMBER_RE.test(value)) {
    return roundMinutes(Number(value), options.allowZero)
  }

  DURATION_TOKEN_RE.lastIndex = 0
  let total = 0
  let matched = false
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = DURATION_TOKEN_RE.exec(value)) !== null) {
    if (!onlyTokenSeparators(value.slice(lastIndex, match.index))) return null

    const amount = Number(match[1])
    if (!Number.isFinite(amount) || amount < 0) return null

    const unit = match[2]
    total += unit.startsWith('h') ? amount * 60 : amount
    matched = true
    lastIndex = DURATION_TOKEN_RE.lastIndex
  }

  if (!matched || !onlyTokenSeparators(value.slice(lastIndex))) return null
  return roundMinutes(total, options.allowZero)
}

export function formatDurationInput(value: unknown, options: ParseDurationOptions = {}): string {
  const minutes = parseDurationMinutes(value, options) ?? (options.allowZero ? 0 : 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0 && remainingMinutes > 0) return `${hours}h ${remainingMinutes}m`
  if (hours > 0) return `${hours}h`
  return `${remainingMinutes}m`
}

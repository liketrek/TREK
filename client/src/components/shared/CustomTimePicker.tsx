import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { formatClockTime, parseMeridiemTime } from '../../utils/formatters'
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition'

interface CustomTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
  /** Read-only surfaces keep the field, they just cannot type in it — same
   *  affordance the native input they replaced offered (#2067). */
  disabled?: boolean
}

export default function CustomTimePicker({ value, onChange, placeholder = '00:00', style = {}, disabled = false }: CustomTimePickerProps) {
  const is12h = useSettingsStore(s => s.settings.time_format) === '12h'
  const [open, setOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  // The spinner is short, and it has to keep up with a scrolling sheet (#1999).
  const anchored = useAnchoredPosition(ref, open, { estimatedHeight: 120, matchWidth: false })

  // `m` falls back to NaN because a value with no colon ('' while the field is
  // empty) splits into a single part, and an absent minute has to read as unset.
  const [h, m = Number.NaN] = (parseMeridiemTime(value) ?? value ?? '').split(':').map(Number)
  const hour = Number.isNaN(h) ? null : h
  const minute = Number.isNaN(m) ? null : m

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // A value that arrives with a meridiem ("3:00 PM" — stored while 12h was configured,
  // or carried in by a booking import) is handed back as HH:MM right away, so the form
  // saves a clean value even when the field is never touched (#1725). While the input
  // has focus this stays out of the way — handleBlur parses what was typed.
  useEffect(() => {
    if (inputFocused) return
    const norm = parseMeridiemTime(value)
    if (norm && norm !== value) onChange(norm)
  }, [value, inputFocused])

  const update = (newH: number, newM: number) => {
    const hh = String(Math.max(0, Math.min(23, newH))).padStart(2, '0')
    const mm = String(Math.max(0, Math.min(59, newM))).padStart(2, '0')
    onChange(`${hh}:${mm}`)
  }

  const incHour = () => update(((hour ?? -1) + 1) % 24, minute ?? 0)
  const decHour = () => update(((hour ?? 1) - 1 + 24) % 24, minute ?? 0)
  const incMin = () => {
    const newM = ((minute ?? -5) + 5) % 60
    const newH = newM < (minute ?? 0) ? ((hour ?? 0) + 1) % 24 : (hour ?? 0)
    update(newH, newM)
  }
  const decMin = () => {
    const newM = ((minute ?? 5) - 5 + 60) % 60
    const newH = newM > (minute ?? 0) ? ((hour ?? 0) - 1 + 24) % 24 : (hour ?? 0)
    update(newH, newM)
  }

  const btnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
    color: 'var(--text-faint)', display: 'flex', borderRadius: 4,
    transition: 'color 0.15s',
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    onChange(raw)
    // Anything with letters in it ("5:30 pm") is left to handleBlur — stripping
    // them here would swallow the meridiem and turn 5:30 pm into 05:30.
    if (is12h || /[a-z]/i.test(raw)) return
    const clean = raw.replace(/[^0-9:]/g, '')
    if (/^\d{2}:\d{2}$/.test(clean)) onChange(clean)
    else if (/^\d{4}$/.test(clean)) onChange(clean.slice(0, 2) + ':' + clean.slice(2))
    else if (/^\d{1,2}:\d{2}$/.test(clean)) {
      const [hh, mm] = clean.split(':')
      onChange(hh.padStart(2, '0') + ':' + mm)
    }
  }

  const handleBlur = () => {
    if (!value) return
    const raw = value.trim()

    // Parse 12h input like "5:30 PM", "5:30pm", "530pm". A meridiem is
    // unambiguous, so it is honoured whatever the configured format is —
    // otherwise the cleanup below reads "5:30 PM" as 05:30 (#1725).
    const parsed12h = parseMeridiemTime(raw)
    if (parsed12h) {
      onChange(parsed12h)
      return
    }

    const clean = raw.replace(/[^0-9:]/g, '')
    if (/^\d{1,2}:\d{2}$/.test(clean)) {
      const [hh, mm] = clean.split(':')
      const h = Math.min(23, Math.max(0, Number.parseInt(hh)))
      const m = Math.min(59, Math.max(0, Number.parseInt(mm)))
      onChange(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'))
    } else if (/^\d{3,4}$/.test(clean)) {
      const s = clean.padStart(4, '0')
      const h = Math.min(23, Math.max(0, Number.parseInt(s.slice(0, 2))))
      const m = Math.min(59, Math.max(0, Number.parseInt(s.slice(2))))
      onChange(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'))
    } else if (/^\d{1,2}$/.test(clean)) {
      const h = Math.min(23, Math.max(0, Number.parseInt(clean)))
      onChange(String(h).padStart(2, '0') + ':00')
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 0,
        borderRadius: 10, border: '1px solid var(--border-primary)',
        background: 'var(--bg-input)', overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}>
        <input
          type="text"
          value={inputFocused ? value : formatClockTime(value, is12h)}
          onChange={handleInput}
          onFocus={() => setInputFocused(true)}
          onBlur={() => { setInputFocused(false); handleBlur() }}
          placeholder={is12h ? '2:30 PM' : placeholder}
          disabled={disabled}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '8px 10px 8px 14px', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontFamily: 'inherit',
            color: value ? 'var(--text-primary)' : 'var(--text-faint)',
            minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          disabled={disabled}
          style={{
            background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: '8px 10px',
            display: 'flex', alignItems: 'center', color: 'var(--text-faint)',
            transition: 'color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
          <Clock size={14} />
        </button>
      </div>

      {open && createPortal(
        <div ref={dropRef} style={{
          position: 'fixed',
          ...(anchored
            ? anchored.flipped
              ? { bottom: anchored.bottom, left: anchored.left }
              : { top: anchored.top, left: anchored.left }
            : { top: 0, left: 0 }),
          zIndex: 99999,
          background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: 12, display: 'flex', alignItems: 'center', gap: 6,
          animation: 'selectIn 0.15s ease-out',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        }}>
          {/* Hours */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button type="button" onClick={incHour} style={btnStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <ChevronUp size={16} />
            </button>
            <div style={{
              width: 44, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-primary)',
              background: 'var(--bg-hover)', borderRadius: 8,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {hour !== null ? (is12h ? String(hour === 0 ? 12 : hour > 12 ? hour - 12 : hour) : String(hour).padStart(2, '0')) : '--'}
            </div>
            <button type="button" onClick={decHour} style={btnStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <ChevronDown size={16} />
            </button>
          </div>

          <span style={{ fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-faint)', marginTop: -2 }}>:</span>

          {/* Minutes */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button type="button" onClick={incMin} style={btnStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <ChevronUp size={16} />
            </button>
            <div style={{
              width: 44, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'calc(22px * var(--fs-scale-title, 1))', fontWeight: 700, color: 'var(--text-primary)',
              background: 'var(--bg-hover)', borderRadius: 8,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {minute !== null ? String(minute).padStart(2, '0') : '--'}
            </div>
            <button type="button" onClick={decMin} style={btnStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              <ChevronDown size={16} />
            </button>
          </div>

          {/* AM/PM Toggle */}
          {is12h && hour !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginLeft: 4 }}>
              <button type="button" onClick={() => { if (hour < 12) update(hour + 12, minute ?? 0); else update(hour - 12, minute ?? 0) }} style={btnStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                <ChevronUp size={16} />
              </button>
              <div style={{
                width: 36, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)',
                background: 'var(--bg-hover)', borderRadius: 8,
              }}>
                {hour >= 12 ? 'PM' : 'AM'}
              </div>
              <button type="button" onClick={() => { if (hour < 12) update(hour + 12, minute ?? 0); else update(hour - 12, minute ?? 0) }} style={btnStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                <ChevronDown size={16} />
              </button>
            </div>
          )}

          {/* Clear */}
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }}
              style={{ ...btnStyle, marginLeft: 4, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', padding: '4px 6px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
              ✕
            </button>
          )}
        </div>,
        document.body
      )}

      <style>{`@keyframes selectIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

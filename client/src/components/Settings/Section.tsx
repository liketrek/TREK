import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface SectionProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}

export default function Section({ title, icon: Icon, children }: SectionProps): React.ReactElement {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        marginBottom: 24,
      }}
    >
      <div
        className="px-5 py-3.5 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--glass-border-inner)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--glass-bg-subtle)',
            border: '1px solid var(--glass-border-inner)',
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

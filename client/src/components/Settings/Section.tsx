import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface SectionProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}

export default function Section({ title, icon: Icon, children }: SectionProps): React.ReactElement {
  return (
    <div className="rounded-xl border overflow-hidden bg-surface-card border-edge" style={{ marginBottom: 24 }}>
      <div className="px-6 py-4 border-b flex items-center gap-2 border-edge-secondary">
        <Icon className="w-5 h-5 text-content-secondary" />
        <h2 className="font-semibold text-content">{title}</h2>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

import { Package } from 'lucide-react';
import type { TranslationFn } from '../../types';

interface PackingTemplateOptionProps {
  name: string;
  itemCount: number;
  onClick: () => void;
  t: TranslationFn;
  /** Fade the hover background in rather than switching it. */
  fade?: boolean;
}

/** One packing template in an apply menu: its name over how many items it adds. */
export function PackingTemplateOption({ name, itemCount, onClick, t, fade = false }: PackingTemplateOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',
        fontFamily: 'inherit',
        fontSize: 'calc(12px * var(--fs-scale-body, 1))',
        color: 'var(--text-primary)',
        transition: fade ? 'background 0.1s' : undefined,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Package size={13} className="text-content-faint" />
      <div style={{ flex: 1, textAlign: 'start' }}>
        <div style={{ fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)' }}>
          {itemCount} {t('admin.packingTemplates.items', { count: itemCount })}
        </div>
      </div>
    </button>
  );
}

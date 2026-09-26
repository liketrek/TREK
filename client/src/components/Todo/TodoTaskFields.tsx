import { useState } from 'react'
import { Flag, Plus, User } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { avatarSrc } from '../../utils/avatarSrc'
import CustomSelect from '../shared/CustomSelect'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import NameDialog from '../shared/NameDialog'
import { PRIO_CONFIG, katColor, taskInputStyle, taskLabelClass, type Member, type TaskFieldValues } from './todoListModel'

interface TodoTaskFieldsProps {
  values: TaskFieldValues
  onChange: (patch: Partial<TaskFieldValues>) => void
  categories: string[]
  members: Member[]
  canEdit?: boolean
}

/**
 * The fields a task is made of, shared by the detail pane and the new-task
 * dialog so both read and behave the same: description, priority as one
 * segmented track, the list (a new one is named in a dialog), the due date and
 * who does it.
 */
export default function TodoTaskFields({ values, onChange, categories, members, canEdit = true }: TodoTaskFieldsProps) {
  const { t } = useTranslation()
  const [namingList, setNamingList] = useState(false)
  const [listName, setListName] = useState('')
  const { desc, priority, category, dueDate, assignedUserId } = values

  const confirmList = () => {
    const name = listName.trim()
    if (!name) return
    onChange({ category: name })
    setNamingList(false)
    setListName('')
  }

  return (
    <>
      <div>
        <label className={taskLabelClass}>{t('todo.detail.description')}</label>
        <textarea value={desc} onChange={e => onChange({ desc: e.target.value })} disabled={!canEdit} rows={4}
          placeholder={t('todo.descriptionPlaceholder')}
          style={{ ...taskInputStyle, resize: 'vertical', minHeight: 84 }} />
      </div>

      <div>
        <label className={taskLabelClass}>{t('todo.detail.priority')}</label>
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 11, background: 'var(--bg-tertiary)' }}>
          {[0, 1, 2, 3].map(p => {
            const cfg = PRIO_CONFIG[p]
            const isActive = priority === p
            return (
              <button type="button" key={p} onClick={() => canEdit && onChange({ priority: p })} aria-pressed={isActive}
                style={{
                  flex: 1, height: 28, borderRadius: 8, border: 'none', cursor: canEdit ? 'pointer' : 'default',
                  fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  color: isActive ? (cfg ? cfg.color : 'var(--text-primary)') : 'var(--text-faint)',
                  transition: 'all 0.12s',
                }}>
                {cfg ? <><Flag size={10} />{cfg.label}</> : t('todo.detail.noPriority')}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className={taskLabelClass}>{t('todo.detail.category')}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CustomSelect
              value={category}
              onChange={v => onChange({ category: String(v) })}
              options={[
                { value: '', label: t('todo.noCategory') },
                ...categories.map(c => ({
                  value: c, label: c,
                  icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: katColor(c, categories), display: 'inline-block' }} />,
                })),
                ...(category && !categories.includes(category) ? [{
                  value: category, label: `${category} (${t('todo.newCategoryLabel')})`,
                  icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: katColor(category, categories), display: 'inline-block' }} />,
                }] : []),
              ]}
              placeholder={t('todo.noCategory')}
              size="sm"
              disabled={!canEdit}
            />
          </div>
          {canEdit && (
            <button type="button" onClick={() => setNamingList(true)} title={t('todo.addCategory')} aria-label={t('todo.addCategory')}
              style={{ width: 36, flexShrink: 0, background: 'var(--bg-tertiary)', border: 'none', borderRadius: 10, cursor: 'pointer', color: 'var(--text-muted)', display: 'grid', placeItems: 'center' }}>
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className={taskLabelClass}>{t('todo.detail.dueDate')}</label>
        <CustomDatePicker value={dueDate} onChange={v => onChange({ dueDate: v })} />
      </div>

      <div>
        <label className={taskLabelClass}>{t('todo.detail.assignedTo')}</label>
        <CustomSelect
          value={String(assignedUserId ?? '')}
          onChange={v => onChange({ assignedUserId: v ? Number(v) : null })}
          options={[
            { value: '', label: t('todo.unassigned'), icon: <User size={14} className="text-content-faint" /> },
            ...members.map(m => ({
              value: String(m.id),
              label: m.is_guest ? `${m.username} · ${t('members.guest')}` : m.username,
              icon: m.avatar ? (
                <img src={avatarSrc(m.avatar)!} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' as const }} alt="" />
              ) : (
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {m.username.charAt(0).toUpperCase()}
                </span>
              ),
            })),
          ]}
          placeholder={t('todo.unassigned')}
          size="sm"
          disabled={!canEdit}
        />
      </div>

      <NameDialog
        open={namingList}
        title={t('todo.addCategory')}
        placeholder={t('todo.newCategory')}
        confirmLabel={t('common.add')}
        value={listName}
        onChange={setListName}
        onConfirm={confirmList}
        onClose={() => { setNamingList(false); setListName('') }}
      />
    </>
  )
}

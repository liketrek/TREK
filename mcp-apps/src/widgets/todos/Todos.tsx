import { listTodosOutputSchema, type ListTodosOutput } from '@trek/shared/mcp-apps';
import { Checklist, useChecklist } from '../../lib/Checklist';
import { formatDateRange } from '../../lib/format';
import type { Translate } from '../../lib/i18n';

type Todo = ListTodosOutput['items'][number];

export interface TodosProps {
  data: unknown;
  locale: string;
  t: Translate;
  /** Ticks a to-do off or back on in TREK; resolves false when TREK refused. */
  onToggle: (todo: Todo, checked: boolean) => Promise<boolean>;
}

/** list_todos' result as a checklist: open ones first, each with its due date. */
export function Todos({ data, locale, t, onToggle }: TodosProps) {
  const parsed = listTodosOutputSchema.safeParse(data);
  const items = parsed.success ? parsed.data.items : [];
  const checklist = useChecklist((id, checked) => {
    const todo = items.find((candidate) => candidate.id === id);
    return todo ? onToggle(todo, checked) : Promise.resolve(false);
  });
  if (!parsed.success) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const ordered = [...items].sort((a, b) => Number(!!a.checked) - Number(!!b.checked));
  const done = items.filter((todo) => checklist.isChecked(todo.id, !!todo.checked)).length;
  const number = new Intl.NumberFormat(locale);
  return (
    <section className="trek-widget" aria-labelledby="todos-title">
      <header className="trek-header">
        <div className="trek-header__text">
          <h1 id="todos-title" className="trek-header__title">
            {t('mcpApps.todos.title')}
          </h1>
          <p className="trek-muted trek-header__subtitle">
            {t('mcpApps.todos.done')}: {number.format(done)} / {number.format(items.length)}
          </p>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="trek-muted">{t('mcpApps.todos.empty')}</p>
      ) : (
        <Checklist
          rows={ordered.map((todo) => {
            const due = formatDateRange(todo.due_date, null, locale);
            return {
              id: todo.id,
              name: todo.name,
              checked: checklist.isChecked(todo.id, !!todo.checked),
              aside: due ? (
                <span className="trek-muted">
                  {t('mcpApps.todos.due')}: {due}
                </span>
              ) : undefined,
            };
          })}
          failed={checklist.failed}
          errorText={t('mcpApps.todos.toggleError')}
          onToggle={(row) => void checklist.toggle(row.id, !!items.find((todo) => todo.id === row.id)?.checked)}
        />
      )}
    </section>
  );
}

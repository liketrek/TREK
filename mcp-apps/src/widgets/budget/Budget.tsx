import { useState } from 'react';
import type { Translate } from '../../lib/i18n';
import { categoriesOf, formatMoney, peopleOf, type BudgetView } from './budgetModel';
import './budget.css';

export interface BudgetProps {
  data: unknown;
  locale: string;
  t: Translate;
  /** Reads the other side (per person from a list, per category from per person) through the host. */
  loadOther: (view: BudgetView) => Promise<unknown>;
}

/**
 * The budget as a card: per category from list_budget_items, per person from
 * get_budget_per_person. Whichever tool drew it, the other side is one tap
 * away and read through the host's session. Read only.
 */
export function Budget({ data, locale, t, loadOther }: BudgetProps) {
  const fromList = categoriesOf(data);
  const fromPeople = peopleOf(data);
  const [view, setView] = useState<BudgetView>(fromList ? 'category' : 'person');
  const [other, setOther] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);
  const categories = fromList ?? categoriesOf(other);
  const people = fromPeople ?? peopleOf(other);
  if (!fromList && !fromPeople) return <p className="trek-muted trek-state">{t('mcpApps.error')}</p>;
  const currency = categories?.currency || people?.currency || '';
  const money = (amount: number) => formatMoney(amount, currency, locale);

  const show = async (next: BudgetView) => {
    setView(next);
    setFailed(false);
    if ((next === 'category' && categories) || (next === 'person' && people)) return;
    try {
      setOther(await loadOther(next));
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className="trek-widget" aria-labelledby="budget-title">
      <header className="trek-header">
        <div className="trek-header__text">
          <h1 id="budget-title" className="trek-header__title">
            {t('mcpApps.budget.title')}
          </h1>
          {categories ? (
            <p className="trek-muted trek-header__subtitle">
              {t('mcpApps.budget.total')}: {money(categories.total ?? 0)}
            </p>
          ) : null}
        </div>
      </header>
      <div role="group" aria-label={t('mcpApps.budget.title')} className="budget__tabs">
        {(['category', 'person'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            className="trek-button trek-hit"
            onClick={() => void show(option)}
          >
            {option === 'category' ? t('mcpApps.budget.byCategory') : t('mcpApps.budget.byPerson')}
          </button>
        ))}
      </div>
      {failed ? <p className="trek-muted">{t('mcpApps.error')}</p> : null}
      {view === 'category' && categories?.categories ? (
        categories.categories.length === 0 ? (
          <p className="trek-muted">{t('mcpApps.budget.empty')}</p>
        ) : (
          <ul className="trek-list">
            {categories.categories.map((row) => (
              <li key={row.name} className="budget__row">
                <span className="budget__label">{row.name || t('mcpApps.budget.uncategorized')}</span>
                <span className="budget__amount">{money(row.amount)}</span>
                <span className="budget__bar" aria-hidden="true">
                  <span style={{ inlineSize: `${Math.round(row.share * 100)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
      {view === 'person' && people?.people ? (
        people.people.length === 0 ? (
          <p className="trek-muted">{t('mcpApps.budget.empty')}</p>
        ) : (
          <table className="budget__people">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">{t('mcpApps.budget.share')}</th>
                <th scope="col">{t('mcpApps.budget.paid')}</th>
              </tr>
            </thead>
            <tbody>
              {people.people.map((row) => (
                <tr key={row.name}>
                  <th scope="row">{row.name}</th>
                  <td>{money(row.assigned)}</td>
                  <td>{money(row.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}
    </section>
  );
}

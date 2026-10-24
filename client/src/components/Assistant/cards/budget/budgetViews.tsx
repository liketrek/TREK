import type { CardView } from '../cardTypes';
import CostPerPersonCard from './CostPerPersonCard';
import { ExpenseAside, ExpenseBody, ExpenseFacts, ExpensesTogether } from './ExpenseChange';
import ExpensesCard from './ExpensesCard';
import PaymentsCard, { PaymentAside, PaymentBody, PaymentChangeFacts } from './PaymentsCard';
import SettlementCard from './SettlementCard';

/**
 * How the kinds of the costs draw in the chat: the expense list, the payment
 * history, settle up and the share per traveller as answer cards, and an
 * expense or a payment inside its change row (the amount at the end, the
 * facts on the faint line, the split or the two people under it). This file
 * only maps each kind to its view: the components live in sibling files,
 * since a file that exports anything besides components breaks fast refresh,
 * and lint:warnings holds react-refresh/only-export-components at zero for a
 * new file.
 */
export const BUDGET_VIEWS = {
  expenses: {
    Block: ExpensesCard,
    Aside: ExpenseAside,
    Facts: ExpenseFacts,
    Body: ExpenseBody,
    Group: ExpensesTogether,
  },
  payments: {
    Block: PaymentsCard,
    Aside: PaymentAside,
    Facts: PaymentChangeFacts,
    Body: PaymentBody,
  },
  settlement: { Block: SettlementCard },
  costPerPerson: { Block: CostPerPersonCard },
} satisfies { [K in 'expenses' | 'payments' | 'settlement' | 'costPerPerson']: CardView<K> };

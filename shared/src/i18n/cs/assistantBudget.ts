import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Zaznamenat platbu',
  'assistant.change.verb.updatePayment': 'Změnit platbu',
  'assistant.tool.create_budget_item_with_members': 'Přidat výdaj',
  'assistant.tool.set_budget_item_members': 'Změnit, kdo se dělí o náklad',
  'assistant.tool.toggle_budget_member_paid': 'Aktualizovat, kdo zaplatil',
  'assistant.tool.create_settlement': 'Zaznamenat platbu',
  'assistant.tool.update_settlement': 'Změnit tuto platbu',
  'assistant.tool.delete_settlement': 'Smazat tuto platbu',
  'assistant.tool.freeze_budget_rates': 'Zafixovat dnešní směnné kurzy',
  'assistant.followUp.whoOwes': 'Kdo dluží komu?',
  'assistant.followUp.recordPayments': 'Zaznamenat tyto platby',
  'assistant.card.budget.open': 'Otevřít v Nákladech',
  'assistant.card.budget.paidBy': '{name} zaplatil(a)',
  'assistant.card.budget.notPaid': 'Nezaplaceno',
  'assistant.card.budget.split.equal': 'Rozděleno rovným dílem',
  'assistant.card.budget.split.custom': 'Rozděleno nerovným dílem',
  'assistant.card.budget.split.none': 'Jen plánování, nerozděleno',
  'assistant.card.budget.together': 'Celkem {amount}',
  'assistant.card.budget.markedPaid': '{amount} označeno jako zaplaceno',
  'assistant.card.budget.receipts': '{count} účtenek',
  'assistant.card.budget.receipts.one': '{count} účtenka',
  'assistant.card.budget.receipts.few': '{count} účtenky',
  'assistant.card.budget.leftOut': '{count} výdajů v cizí měně se nezapočítává do součtu: zatím chybí směnný kurz.',
  'assistant.card.budget.leftOut.one': '{count} výdaj v cizí měně se nezapočítává do součtu: zatím chybí směnný kurz.',
  'assistant.card.budget.leftOut.few':
    '{count} výdaje v cizí měně se nezapočítávají do součtu: zatím chybí směnný kurz.',
  'assistant.card.budget.unconverted': '{count} položek v {currencies} se nezapočítává: zatím chybí směnný kurz.',
  'assistant.card.budget.unconverted.one': '{count} položka v {currencies} se nezapočítává: zatím chybí směnný kurz.',
  'assistant.card.budget.unconverted.few': '{count} položky v {currencies} se nezapočítávají: zatím chybí směnný kurz.',
};
export default assistantBudget;

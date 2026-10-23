import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Zaznamenať platbu',
  'assistant.change.verb.updatePayment': 'Zmeniť platbu',
  'assistant.tool.create_budget_item_with_members': 'Pridať výdavok',
  'assistant.tool.set_budget_item_members': 'Zmeniť, kto sa delí o náklad',
  'assistant.tool.toggle_budget_member_paid': 'Aktualizovať, kto zaplatil',
  'assistant.tool.create_settlement': 'Zaznamenať platbu',
  'assistant.tool.update_settlement': 'Zmeniť túto platbu',
  'assistant.tool.delete_settlement': 'Odstrániť túto platbu',
  'assistant.tool.freeze_budget_rates': 'Zafixovať dnešné výmenné kurzy',
  'assistant.followUp.whoOwes': 'Kto komu dlhuje?',
  'assistant.followUp.recordPayments': 'Zaznamenať tieto platby',
  'assistant.card.budget.open': 'Otvoriť v Nákladoch',
  'assistant.card.budget.paidBy': '{name} zaplatil(a)',
  'assistant.card.budget.notPaid': 'Nezaplatené',
  'assistant.card.budget.split.equal': 'Rozdelené rovnakým dielom',
  'assistant.card.budget.split.custom': 'Rozdelené nerovnakým dielom',
  'assistant.card.budget.split.none': 'Len plánovanie, nerozdelené',
  'assistant.card.budget.together': 'Spolu {amount}',
  'assistant.card.budget.markedPaid': '{amount} označené ako zaplatené',
  'assistant.card.budget.receipts': '{count} účteniek',
  'assistant.card.budget.receipts.one': '{count} účtenka',
  'assistant.card.budget.receipts.few': '{count} účtenky',
  'assistant.card.budget.leftOut':
    '{count} výdavkov v cudzej mene sa nezapočítava do súčtu: zatiaľ chýba výmenný kurz.',
  'assistant.card.budget.leftOut.one':
    '{count} výdavok v cudzej mene sa nezapočítava do súčtu: zatiaľ chýba výmenný kurz.',
  'assistant.card.budget.leftOut.few':
    '{count} výdavky v cudzej mene sa nezapočítavajú do súčtu: zatiaľ chýba výmenný kurz.',
  'assistant.card.budget.unconverted': '{count} položiek v {currencies} sa nezapočítava: zatiaľ chýba výmenný kurz.',
  'assistant.card.budget.unconverted.one': '{count} položka v {currencies} sa nezapočítava: zatiaľ chýba výmenný kurz.',
  'assistant.card.budget.unconverted.few':
    '{count} položky v {currencies} sa nezapočítavajú: zatiaľ chýba výmenný kurz.',
};
export default assistantBudget;

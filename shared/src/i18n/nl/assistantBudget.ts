import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Betaling vastleggen',
  'assistant.change.verb.updatePayment': 'Betaling wijzigen',
  'assistant.tool.create_budget_item_with_members': 'Uitgave toevoegen',
  'assistant.tool.set_budget_item_members': 'Wijzigen wie de kosten deelt',
  'assistant.tool.toggle_budget_member_paid': 'Bijwerken wie heeft betaald',
  'assistant.tool.create_settlement': 'Betaling vastleggen',
  'assistant.tool.update_settlement': 'De betaling wijzigen',
  'assistant.tool.delete_settlement': 'De betaling verwijderen',
  'assistant.tool.freeze_budget_rates': 'Wisselkoersen van vandaag vastzetten',
  'assistant.followUp.whoOwes': 'Wie is wie wat schuldig?',
  'assistant.followUp.recordPayments': 'Deze betalingen vastleggen',
  'assistant.card.budget.open': 'Openen in Onkosten',
  'assistant.card.budget.paidBy': '{name} heeft betaald',
  'assistant.card.budget.notPaid': 'Niet betaald',
  'assistant.card.budget.split.equal': 'Gelijk verdeeld',
  'assistant.card.budget.split.custom': 'Ongelijk verdeeld',
  'assistant.card.budget.split.none': 'Alleen planning, niet verdeeld',
  'assistant.card.budget.together': 'Samen {amount}',
  'assistant.card.budget.markedPaid': '{amount} als betaald gemarkeerd',
  'assistant.card.budget.receipts': '{count} bonnen',
  'assistant.card.budget.receipts.one': '{count} bon',
  'assistant.card.budget.leftOut':
    '{count} uitgaven in vreemde valuta tellen niet mee in het totaal: nog geen wisselkoers.',
  'assistant.card.budget.leftOut.one':
    '{count} uitgave in vreemde valuta telt niet mee in het totaal: nog geen wisselkoers.',
  'assistant.card.budget.unconverted': '{count} posten in {currencies} tellen niet mee: nog geen wisselkoers.',
  'assistant.card.budget.unconverted.one': '{count} post in {currencies} telt niet mee: nog geen wisselkoers.',
};
export default assistantBudget;

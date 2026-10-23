import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Zapisz płatność',
  'assistant.change.verb.updatePayment': 'Zmień płatność',
  'assistant.tool.create_budget_item_with_members': 'Dodaj wydatek',
  'assistant.tool.set_budget_item_members': 'Zmień, kto dzieli koszt',
  'assistant.tool.toggle_budget_member_paid': 'Zaktualizuj, kto zapłacił',
  'assistant.tool.create_settlement': 'Zapisz płatność',
  'assistant.tool.update_settlement': 'Zmień tę płatność',
  'assistant.tool.delete_settlement': 'Usuń tę płatność',
  'assistant.tool.freeze_budget_rates': 'Zablokuj dzisiejsze kursy walut',
  'assistant.followUp.whoOwes': 'Kto komu jest winien?',
  'assistant.followUp.recordPayments': 'Zapisz te płatności',
  'assistant.card.budget.open': 'Otwórz w Kosztach',
  'assistant.card.budget.paidBy': '{name} zapłacił(a)',
  'assistant.card.budget.notPaid': 'Niezapłacone',
  'assistant.card.budget.split.equal': 'Podzielone po równo',
  'assistant.card.budget.split.custom': 'Podzielone nierówno',
  'assistant.card.budget.split.none': 'Tylko planowanie, bez podziału',
  'assistant.card.budget.together': 'Razem {amount}',
  'assistant.card.budget.markedPaid': '{amount} oznaczono jako zapłacone',
  'assistant.card.budget.receipts': '{count} paragonu',
  'assistant.card.budget.receipts.one': '{count} paragon',
  'assistant.card.budget.receipts.few': '{count} paragony',
  'assistant.card.budget.receipts.many': '{count} paragonów',
  'assistant.card.budget.leftOut': '{count} wydatku w obcej walucie nie liczy się do sumy: brak jeszcze kursu wymiany.',
  'assistant.card.budget.leftOut.one':
    '{count} wydatek w obcej walucie nie liczy się do sumy: brak jeszcze kursu wymiany.',
  'assistant.card.budget.leftOut.few':
    '{count} wydatki w obcej walucie nie liczą się do sumy: brak jeszcze kursu wymiany.',
  'assistant.card.budget.leftOut.many':
    '{count} wydatków w obcej walucie nie liczy się do sumy: brak jeszcze kursu wymiany.',
  'assistant.card.budget.unconverted': '{count} pozycji w {currencies} nie jest liczone: brak jeszcze kursu wymiany.',
  'assistant.card.budget.unconverted.one':
    '{count} pozycja w {currencies} nie jest liczona: brak jeszcze kursu wymiany.',
  'assistant.card.budget.unconverted.few': '{count} pozycje w {currencies} nie są liczone: brak jeszcze kursu wymiany.',
  'assistant.card.budget.unconverted.many':
    '{count} pozycji w {currencies} nie jest liczonych: brak jeszcze kursu wymiany.',
};
export default assistantBudget;

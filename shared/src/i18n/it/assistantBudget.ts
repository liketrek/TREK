import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Registra un pagamento',
  'assistant.change.verb.updatePayment': 'Modifica un pagamento',
  'assistant.tool.create_budget_item_with_members': 'Aggiungi spesa',
  'assistant.tool.set_budget_item_members': 'Cambia chi divide la spesa',
  'assistant.tool.toggle_budget_member_paid': 'Aggiorna chi ha pagato',
  'assistant.tool.create_settlement': 'Registra un pagamento',
  'assistant.tool.update_settlement': 'Modifica il pagamento',
  'assistant.tool.delete_settlement': 'Elimina il pagamento',
  'assistant.tool.freeze_budget_rates': 'Blocca i tassi di cambio di oggi',
  'assistant.followUp.whoOwes': 'Chi deve quanto a chi?',
  'assistant.followUp.recordPayments': 'Registra questi pagamenti',
  'assistant.card.budget.open': 'Apri in Costi',
  'assistant.card.budget.paidBy': '{name} ha pagato',
  'assistant.card.budget.notPaid': 'Non pagato',
  'assistant.card.budget.split.equal': 'Diviso in parti uguali',
  'assistant.card.budget.split.custom': 'Diviso in parti diverse',
  'assistant.card.budget.split.none': 'Solo pianificazione, non divisa',
  'assistant.card.budget.together': 'In tutto {amount}',
  'assistant.card.budget.markedPaid': '{amount} segnato come pagato',
  'assistant.card.budget.receipts': '{count} ricevute',
  'assistant.card.budget.receipts.one': '{count} ricevuta',
  'assistant.card.budget.leftOut': '{count} spese in valuta estera non sono nel totale: ancora nessun tasso di cambio.',
  'assistant.card.budget.leftOut.one':
    '{count} spesa in valuta estera non è nel totale: ancora nessun tasso di cambio.',
  'assistant.card.budget.unconverted':
    '{count} voci in {currencies} non sono conteggiate: ancora nessun tasso di cambio.',
  'assistant.card.budget.unconverted.one':
    '{count} voce in {currencies} non è conteggiata: ancora nessun tasso di cambio.',
};
export default assistantBudget;

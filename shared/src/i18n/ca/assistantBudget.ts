import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Registra un pagament',
  'assistant.change.verb.updatePayment': 'Canvia un pagament',
  'assistant.tool.create_budget_item_with_members': 'Afegeix una despesa',
  'assistant.tool.set_budget_item_members': 'Canvia qui comparteix la despesa',
  'assistant.tool.toggle_budget_member_paid': 'Actualitza qui ha pagat',
  'assistant.tool.create_settlement': 'Registra un pagament',
  'assistant.tool.update_settlement': 'Canvia el pagament',
  'assistant.tool.delete_settlement': 'Elimina el pagament',
  'assistant.tool.freeze_budget_rates': "Fixa els tipus de canvi d'avui",
  'assistant.followUp.whoOwes': 'Qui deu a qui?',
  'assistant.followUp.recordPayments': 'Registra aquests pagaments',
  'assistant.card.budget.open': 'Obre a Despeses',
  'assistant.card.budget.paidBy': '{name} ha pagat',
  'assistant.card.budget.notPaid': 'No pagat',
  'assistant.card.budget.split.equal': 'Repartit a parts iguals',
  'assistant.card.budget.split.custom': 'Repartit de manera desigual',
  'assistant.card.budget.split.none': 'Només planificació, sense repartir',
  'assistant.card.budget.together': 'En total {amount}',
  'assistant.card.budget.markedPaid': '{amount} marcat com a pagat',
  'assistant.card.budget.receipts': '{count} rebuts',
  'assistant.card.budget.receipts.one': '{count} rebut',
  'assistant.card.budget.leftOut':
    '{count} despeses en moneda estrangera no es compten al total: encara no hi ha tipus de canvi.',
  'assistant.card.budget.leftOut.one':
    '{count} despesa en moneda estrangera no es compta al total: encara no hi ha tipus de canvi.',
  'assistant.card.budget.unconverted':
    '{count} entrades en {currencies} no es compten: encara no hi ha tipus de canvi.',
  'assistant.card.budget.unconverted.one':
    '{count} entrada en {currencies} no es compta: encara no hi ha tipus de canvi.',
};
export default assistantBudget;

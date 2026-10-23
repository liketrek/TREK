import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Enregistrer un paiement',
  'assistant.change.verb.updatePayment': 'Modifier un paiement',
  'assistant.tool.create_budget_item_with_members': 'Ajouter une dépense',
  'assistant.tool.set_budget_item_members': 'Modifier qui partage la dépense',
  'assistant.tool.toggle_budget_member_paid': 'Mettre à jour qui a payé',
  'assistant.tool.create_settlement': 'Enregistrer un paiement',
  'assistant.tool.update_settlement': 'Modifier le paiement',
  'assistant.tool.delete_settlement': 'Supprimer le paiement',
  'assistant.tool.freeze_budget_rates': 'Figer les taux de change du jour',
  'assistant.followUp.whoOwes': 'Qui doit combien à qui ?',
  'assistant.followUp.recordPayments': 'Enregistrer ces paiements',
  'assistant.card.budget.open': 'Ouvrir dans Coûts',
  'assistant.card.budget.paidBy': '{name} a payé',
  'assistant.card.budget.notPaid': 'Non payé',
  'assistant.card.budget.split.equal': 'Partagé à parts égales',
  'assistant.card.budget.split.custom': 'Partagé à parts inégales',
  'assistant.card.budget.split.none': 'Prévision seulement, non partagé',
  'assistant.card.budget.together': 'Au total {amount}',
  'assistant.card.budget.markedPaid': '{amount} marqué comme payé',
  'assistant.card.budget.receipts': '{count} justificatifs',
  'assistant.card.budget.receipts.one': '{count} justificatif',
  'assistant.card.budget.leftOut':
    '{count} dépenses en devise étrangère ne sont pas comptées dans le total : pas encore de taux de change.',
  'assistant.card.budget.leftOut.one':
    "{count} dépense en devise étrangère n'est pas comptée dans le total : pas encore de taux de change.",
  'assistant.card.budget.unconverted':
    '{count} entrées en {currencies} ne sont pas comptées : pas encore de taux de change.',
  'assistant.card.budget.unconverted.one':
    "{count} entrée en {currencies} n'est pas comptée : pas encore de taux de change.",
};
export default assistantBudget;

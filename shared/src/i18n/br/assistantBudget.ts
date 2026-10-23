import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Registrar um pagamento',
  'assistant.change.verb.updatePayment': 'Alterar um pagamento',
  'assistant.tool.create_budget_item_with_members': 'Adicionar despesa',
  'assistant.tool.set_budget_item_members': 'Alterar quem divide o custo',
  'assistant.tool.toggle_budget_member_paid': 'Atualizar quem já pagou',
  'assistant.tool.create_settlement': 'Registrar um pagamento',
  'assistant.tool.update_settlement': 'Alterar o pagamento',
  'assistant.tool.delete_settlement': 'Excluir o pagamento',
  'assistant.tool.freeze_budget_rates': 'Fixar as taxas de câmbio de hoje',
  'assistant.followUp.whoOwes': 'Quem deve a quem?',
  'assistant.followUp.recordPayments': 'Registrar estes pagamentos',
  'assistant.card.budget.open': 'Abrir em Custos',
  'assistant.card.budget.paidBy': '{name} pagou',
  'assistant.card.budget.notPaid': 'Não pago',
  'assistant.card.budget.split.equal': 'Dividido igualmente',
  'assistant.card.budget.split.custom': 'Dividido de forma desigual',
  'assistant.card.budget.split.none': 'Só planejamento, sem divisão',
  'assistant.card.budget.together': 'No total {amount}',
  'assistant.card.budget.markedPaid': '{amount} marcado como pago',
  'assistant.card.budget.receipts': '{count} recibos',
  'assistant.card.budget.receipts.one': '{count} recibo',
  'assistant.card.budget.leftOut':
    '{count} despesas em moeda estrangeira ficam fora do total: ainda sem taxa de câmbio.',
  'assistant.card.budget.leftOut.one':
    '{count} despesa em moeda estrangeira fica fora do total: ainda sem taxa de câmbio.',
  'assistant.card.budget.unconverted':
    '{count} lançamentos em {currencies} não são contados: ainda sem taxa de câmbio.',
  'assistant.card.budget.unconverted.one':
    '{count} lançamento em {currencies} não é contado: ainda sem taxa de câmbio.',
};
export default assistantBudget;

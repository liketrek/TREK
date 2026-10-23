import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Registrar un pago',
  'assistant.change.verb.updatePayment': 'Cambiar un pago',
  'assistant.tool.create_budget_item_with_members': 'Añadir gasto',
  'assistant.tool.set_budget_item_members': 'Cambiar quién comparte el gasto',
  'assistant.tool.toggle_budget_member_paid': 'Actualizar quién ha pagado',
  'assistant.tool.create_settlement': 'Registrar un pago',
  'assistant.tool.update_settlement': 'Cambiar el pago',
  'assistant.tool.delete_settlement': 'Eliminar el pago',
  'assistant.tool.freeze_budget_rates': 'Fijar los tipos de cambio de hoy',
  'assistant.followUp.whoOwes': '¿Quién debe a quién?',
  'assistant.followUp.recordPayments': 'Registrar estos pagos',
  'assistant.card.budget.open': 'Abrir en Costes',
  'assistant.card.budget.paidBy': '{name} pagó',
  'assistant.card.budget.notPaid': 'No pagado',
  'assistant.card.budget.split.equal': 'Repartido a partes iguales',
  'assistant.card.budget.split.custom': 'Repartido de forma desigual',
  'assistant.card.budget.split.none': 'Solo planificación, sin repartir',
  'assistant.card.budget.together': 'En total {amount}',
  'assistant.card.budget.markedPaid': '{amount} marcado como pagado',
  'assistant.card.budget.receipts': '{count} recibos',
  'assistant.card.budget.receipts.one': '{count} recibo',
  'assistant.card.budget.leftOut':
    '{count} gastos en moneda extranjera no se incluyen en el total: aún no hay tipo de cambio.',
  'assistant.card.budget.leftOut.one':
    '{count} gasto en moneda extranjera no se incluye en el total: aún no hay tipo de cambio.',
  'assistant.card.budget.unconverted': '{count} entradas en {currencies} no se cuentan: aún no hay tipo de cambio.',
  'assistant.card.budget.unconverted.one': '{count} entrada en {currencies} no se cuenta: aún no hay tipo de cambio.',
};
export default assistantBudget;

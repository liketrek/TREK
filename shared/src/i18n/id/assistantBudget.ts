import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Catat pembayaran',
  'assistant.change.verb.updatePayment': 'Ubah pembayaran',
  'assistant.tool.create_budget_item_with_members': 'Tambah pengeluaran',
  'assistant.tool.set_budget_item_members': 'Ubah siapa yang berbagi biaya',
  'assistant.tool.toggle_budget_member_paid': 'Perbarui siapa yang sudah membayar',
  'assistant.tool.create_settlement': 'Catat pembayaran',
  'assistant.tool.update_settlement': 'Ubah pembayaran ini',
  'assistant.tool.delete_settlement': 'Hapus pembayaran ini',
  'assistant.tool.freeze_budget_rates': 'Kunci kurs hari ini',
  'assistant.followUp.whoOwes': 'Siapa berutang kepada siapa?',
  'assistant.followUp.recordPayments': 'Catat semua pembayaran ini',
  'assistant.card.budget.open': 'Buka di Biaya',
  'assistant.card.budget.paidBy': '{name} membayar',
  'assistant.card.budget.notPaid': 'Belum dibayar',
  'assistant.card.budget.split.equal': 'Dibagi rata',
  'assistant.card.budget.split.custom': 'Dibagi dengan jumlah berbeda',
  'assistant.card.budget.split.none': 'Hanya perencanaan, tidak dibagi',
  'assistant.card.budget.together': 'Semuanya {amount}',
  'assistant.card.budget.markedPaid': '{amount} ditandai sudah dibayar',
  'assistant.card.budget.receipts': '{count} struk',
  'assistant.card.budget.leftOut': '{count} pengeluaran dalam mata uang asing tidak masuk total: belum ada kurs.',
  'assistant.card.budget.unconverted': '{count} entri dalam {currencies} tidak dihitung: belum ada kurs.',
};
export default assistantBudget;

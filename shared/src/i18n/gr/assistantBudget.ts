import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Καταγραφή πληρωμής',
  'assistant.change.verb.updatePayment': 'Αλλαγή πληρωμής',
  'assistant.tool.create_budget_item_with_members': 'Προσθήκη εξόδου',
  'assistant.tool.set_budget_item_members': 'Αλλαγή του ποιοι μοιράζονται το κόστος',
  'assistant.tool.toggle_budget_member_paid': 'Ενημέρωση του ποιος έχει πληρώσει',
  'assistant.tool.create_settlement': 'Καταγραφή πληρωμής',
  'assistant.tool.update_settlement': 'Αλλαγή της πληρωμής',
  'assistant.tool.delete_settlement': 'Διαγραφή της πληρωμής',
  'assistant.tool.freeze_budget_rates': 'Κλείδωμα των σημερινών ισοτιμιών',
  'assistant.followUp.whoOwes': 'Ποιος χρωστάει σε ποιον;',
  'assistant.followUp.recordPayments': 'Καταγραφή αυτών των πληρωμών',
  'assistant.card.budget.open': 'Άνοιγμα στα Κόστη',
  'assistant.card.budget.paidBy': '{name} πλήρωσε',
  'assistant.card.budget.notPaid': 'Απλήρωτο',
  'assistant.card.budget.split.equal': 'Μοιρασμένο ισόποσα',
  'assistant.card.budget.split.custom': 'Μοιρασμένο άνισα',
  'assistant.card.budget.split.none': 'Μόνο σχεδιασμός, χωρίς μοιρασιά',
  'assistant.card.budget.together': 'Συνολικά {amount}',
  'assistant.card.budget.markedPaid': '{amount} σημειωμένα ως πληρωμένα',
  'assistant.card.budget.receipts': '{count} αποδείξεις',
  'assistant.card.budget.receipts.one': '{count} απόδειξη',
  'assistant.card.budget.leftOut': '{count} έξοδα σε ξένο νόμισμα δεν μετρούν στο σύνολο: δεν υπάρχει ακόμη ισοτιμία.',
  'assistant.card.budget.leftOut.one':
    '{count} έξοδο σε ξένο νόμισμα δεν μετράει στο σύνολο: δεν υπάρχει ακόμη ισοτιμία.',
  'assistant.card.budget.unconverted':
    '{count} καταχωρίσεις σε {currencies} δεν υπολογίζονται: δεν υπάρχει ακόμη ισοτιμία.',
  'assistant.card.budget.unconverted.one':
    '{count} καταχώριση σε {currencies} δεν υπολογίζεται: δεν υπάρχει ακόμη ισοτιμία.',
};
export default assistantBudget;

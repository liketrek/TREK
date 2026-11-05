import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'רישום תשלום',
  'assistant.change.verb.updatePayment': 'שינוי תשלום',
  'assistant.tool.create_budget_item_with_members': 'הוספת הוצאה',
  'assistant.tool.set_budget_item_members': 'שינוי המשתתפים בחלוקת ההוצאה',
  'assistant.tool.toggle_budget_member_paid': 'עדכון מי שילם',
  'assistant.tool.create_settlement': 'רישום תשלום',
  'assistant.tool.update_settlement': 'שינוי התשלום',
  'assistant.tool.delete_settlement': 'מחיקת התשלום',
  'assistant.tool.freeze_budget_rates': 'קיבוע שערי החליפין של היום',
  'assistant.followUp.whoOwes': 'מי חייב למי?',
  'assistant.followUp.recordPayments': 'רשמו את התשלומים האלה',
  'assistant.card.budget.open': 'פתיחה בהוצאות',
  'assistant.card.budget.paidBy': '{name} שילם/ה',
  'assistant.card.budget.notPaid': 'לא שולם',
  'assistant.card.budget.split.equal': 'חלוקה שווה',
  'assistant.card.budget.split.custom': 'חלוקה לא שווה',
  'assistant.card.budget.split.none': 'לתכנון בלבד, ללא חלוקה',
  'assistant.card.budget.together': 'ביחד {amount}',
  'assistant.card.budget.markedPaid': '{amount} סומן כשולם',
  'assistant.card.budget.receipts': '{count} קבלות',
  'assistant.card.budget.receipts.one': 'קבלה אחת',
  'assistant.card.budget.receipts.two': '{count} קבלות',
  'assistant.card.budget.leftOut': '{count} הוצאות במטבע זר לא נכללות בסכום הכולל: עדיין אין שער חליפין.',
  'assistant.card.budget.leftOut.one': 'הוצאה אחת במטבע זר לא נכללת בסכום הכולל: עדיין אין שער חליפין.',
  'assistant.card.budget.leftOut.two': '{count} הוצאות במטבע זר לא נכללות בסכום הכולל: עדיין אין שער חליפין.',
  'assistant.card.budget.unconverted': '{count} רשומות ב-{currencies} לא נכללות בחישוב: עדיין אין שער חליפין.',
  'assistant.card.budget.unconverted.one': 'רשומה אחת ב-{currencies} לא נכללת בחישוב: עדיין אין שער חליפין.',
  'assistant.card.budget.unconverted.two': '{count} רשומות ב-{currencies} לא נכללות בחישוב: עדיין אין שער חליפין.',
};

export default assistantBudget;

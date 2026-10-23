import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': '支払いを記録',
  'assistant.change.verb.updatePayment': '支払いを変更',
  'assistant.tool.create_budget_item_with_members': '支出を追加',
  'assistant.tool.set_budget_item_members': '費用を分け合う人を変更',
  'assistant.tool.toggle_budget_member_paid': '支払い済みの人を更新',
  'assistant.tool.create_settlement': '支払いを記録',
  'assistant.tool.update_settlement': 'この支払いを変更',
  'assistant.tool.delete_settlement': 'この支払いを削除',
  'assistant.tool.freeze_budget_rates': '今日の為替レートで固定',
  'assistant.followUp.whoOwes': '誰が誰にいくら借りている？',
  'assistant.followUp.recordPayments': 'これらの支払いを記録',
  'assistant.card.budget.open': '費用で開く',
  'assistant.card.budget.paidBy': '{name}が支払い',
  'assistant.card.budget.notPaid': '未払い',
  'assistant.card.budget.split.equal': '均等に分割',
  'assistant.card.budget.split.custom': '金額を指定して分割',
  'assistant.card.budget.split.none': '計画のみ、分割なし',
  'assistant.card.budget.together': '合計 {amount}',
  'assistant.card.budget.markedPaid': '{amount} 支払い済み',
  'assistant.card.budget.receipts': '領収書 {count} 件',
  'assistant.card.budget.leftOut': '外貨の支出 {count} 件は合計に含まれていません。為替レートがまだありません。',
  'assistant.card.budget.unconverted':
    '{currencies} の {count} 件は計算に含まれていません。為替レートがまだありません。',
};
export default assistantBudget;

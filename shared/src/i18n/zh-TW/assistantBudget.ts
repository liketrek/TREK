import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': '記錄一筆付款',
  'assistant.change.verb.updatePayment': '修改付款',
  'assistant.tool.create_budget_item_with_members': '新增支出',
  'assistant.tool.set_budget_item_members': '變更分攤費用的人',
  'assistant.tool.toggle_budget_member_paid': '更新已付款的人',
  'assistant.tool.create_settlement': '記錄一筆付款',
  'assistant.tool.update_settlement': '修改這筆付款',
  'assistant.tool.delete_settlement': '刪除這筆付款',
  'assistant.tool.freeze_budget_rates': '鎖定今天的匯率',
  'assistant.followUp.whoOwes': '誰欠誰多少？',
  'assistant.followUp.recordPayments': '記錄這些付款',
  'assistant.card.budget.open': '在費用中開啟',
  'assistant.card.budget.paidBy': '{name} 已付款',
  'assistant.card.budget.notPaid': '未付',
  'assistant.card.budget.split.equal': '平均分攤',
  'assistant.card.budget.split.custom': '按金額分攤',
  'assistant.card.budget.split.none': '僅供規劃，不分攤',
  'assistant.card.budget.together': '合計 {amount}',
  'assistant.card.budget.markedPaid': '{amount} 已標記為已付',
  'assistant.card.budget.receipts': '{count} 張收據',
  'assistant.card.budget.leftOut': '{count} 筆外幣支出未計入總額：尚無匯率。',
  'assistant.card.budget.unconverted': '{currencies} 的 {count} 筆紀錄未計入：尚無匯率。',
};
export default assistantBudget;

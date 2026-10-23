import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': '记录一笔付款',
  'assistant.change.verb.updatePayment': '修改付款',
  'assistant.tool.create_budget_item_with_members': '添加支出',
  'assistant.tool.set_budget_item_members': '更改分摊费用的人',
  'assistant.tool.toggle_budget_member_paid': '更新已付款的人',
  'assistant.tool.create_settlement': '记录一笔付款',
  'assistant.tool.update_settlement': '修改这笔付款',
  'assistant.tool.delete_settlement': '删除这笔付款',
  'assistant.tool.freeze_budget_rates': '锁定今天的汇率',
  'assistant.followUp.whoOwes': '谁欠谁多少？',
  'assistant.followUp.recordPayments': '记录这些付款',
  'assistant.card.budget.open': '在费用中打开',
  'assistant.card.budget.paidBy': '{name} 已付款',
  'assistant.card.budget.notPaid': '未付',
  'assistant.card.budget.split.equal': '平均分摊',
  'assistant.card.budget.split.custom': '按金额分摊',
  'assistant.card.budget.split.none': '仅用于计划，不分摊',
  'assistant.card.budget.together': '合计 {amount}',
  'assistant.card.budget.markedPaid': '{amount} 已标记为已付',
  'assistant.card.budget.receipts': '{count} 张收据',
  'assistant.card.budget.leftOut': '{count} 笔外币支出未计入总额：暂无汇率。',
  'assistant.card.budget.unconverted': '{currencies} 的 {count} 条记录未计入：暂无汇率。',
};
export default assistantBudget;

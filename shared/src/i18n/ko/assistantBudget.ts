import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': '결제 기록',
  'assistant.change.verb.updatePayment': '결제 변경',
  'assistant.tool.create_budget_item_with_members': '지출 추가',
  'assistant.tool.set_budget_item_members': '비용을 나누는 사람 변경',
  'assistant.tool.toggle_budget_member_paid': '지불한 사람 업데이트',
  'assistant.tool.create_settlement': '결제 기록',
  'assistant.tool.update_settlement': '이 결제 변경',
  'assistant.tool.delete_settlement': '이 결제 삭제',
  'assistant.tool.freeze_budget_rates': '오늘 환율로 고정',
  'assistant.followUp.whoOwes': '누가 누구에게 얼마를 빚졌나요?',
  'assistant.followUp.recordPayments': '이 결제들 기록',
  'assistant.card.budget.open': '비용에서 열기',
  'assistant.card.budget.paidBy': '{name} 님이 지불',
  'assistant.card.budget.notPaid': '미결제',
  'assistant.card.budget.split.equal': '균등 분할',
  'assistant.card.budget.split.custom': '금액별 분할',
  'assistant.card.budget.split.none': '계획만, 분할 안 함',
  'assistant.card.budget.together': '합계 {amount}',
  'assistant.card.budget.markedPaid': '{amount} 지불 완료로 표시됨',
  'assistant.card.budget.receipts': '영수증 {count}개',
  'assistant.card.budget.leftOut': '외화 지출 {count}건이 합계에서 빠졌습니다: 아직 환율이 없습니다.',
  'assistant.card.budget.unconverted': '{currencies} 항목 {count}건이 계산되지 않습니다: 아직 환율이 없습니다.',
};
export default assistantBudget;

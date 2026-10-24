import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'Ghi nhận một khoản thanh toán',
  'assistant.change.verb.updatePayment': 'Sửa một khoản thanh toán',
  'assistant.tool.create_budget_item_with_members': 'Thêm khoản chi',
  'assistant.tool.set_budget_item_members': 'Đổi người cùng chia chi phí',
  'assistant.tool.toggle_budget_member_paid': 'Cập nhật ai đã trả',
  'assistant.tool.create_settlement': 'Ghi nhận một khoản thanh toán',
  'assistant.tool.update_settlement': 'Sửa khoản thanh toán này',
  'assistant.tool.delete_settlement': 'Xóa khoản thanh toán này',
  'assistant.tool.freeze_budget_rates': 'Chốt tỷ giá hôm nay',
  'assistant.followUp.whoOwes': 'Ai nợ ai?',
  'assistant.followUp.recordPayments': 'Ghi nhận các khoản thanh toán này',
  'assistant.card.budget.open': 'Mở trong Chi phí',
  'assistant.card.budget.paidBy': '{name} đã trả',
  'assistant.card.budget.notPaid': 'Chưa trả',
  'assistant.card.budget.split.equal': 'Chia đều',
  'assistant.card.budget.split.custom': 'Chia theo số tiền riêng',
  'assistant.card.budget.split.none': 'Chỉ để lên kế hoạch, không chia',
  'assistant.card.budget.together': 'Tổng cộng {amount}',
  'assistant.card.budget.markedPaid': '{amount} đã đánh dấu là đã trả',
  'assistant.card.budget.receipts': '{count} hóa đơn',
  'assistant.card.budget.leftOut': '{count} khoản chi ngoại tệ không được tính vào tổng: chưa có tỷ giá.',
  'assistant.card.budget.unconverted': '{count} mục bằng {currencies} không được tính: chưa có tỷ giá.',
};
export default assistantBudget;

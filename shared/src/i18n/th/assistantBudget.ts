import type { TranslationStrings } from '../types';

const assistantBudget: TranslationStrings = {
  'assistant.change.verb.addPayment': 'บันทึกการชำระเงิน',
  'assistant.change.verb.updatePayment': 'เปลี่ยนการชำระเงิน',
  'assistant.tool.create_budget_item_with_members': 'เพิ่มค่าใช้จ่าย',
  'assistant.tool.set_budget_item_members': 'เปลี่ยนผู้ที่หารค่าใช้จ่าย',
  'assistant.tool.toggle_budget_member_paid': 'อัปเดตผู้ที่จ่ายแล้ว',
  'assistant.tool.create_settlement': 'บันทึกการชำระเงิน',
  'assistant.tool.update_settlement': 'เปลี่ยนการชำระเงินนี้',
  'assistant.tool.delete_settlement': 'ลบการชำระเงินนี้',
  'assistant.tool.freeze_budget_rates': 'ล็อกอัตราแลกเปลี่ยนของวันนี้',
  'assistant.followUp.whoOwes': 'ใครติดเงินใคร?',
  'assistant.followUp.recordPayments': 'บันทึกการชำระเงินเหล่านี้',
  'assistant.card.budget.open': 'เปิดในค่าใช้จ่าย',
  'assistant.card.budget.paidBy': '{name} จ่ายแล้ว',
  'assistant.card.budget.notPaid': 'ยังไม่จ่าย',
  'assistant.card.budget.split.equal': 'หารเท่ากัน',
  'assistant.card.budget.split.custom': 'หารตามจำนวนที่กำหนด',
  'assistant.card.budget.split.none': 'วางแผนเท่านั้น ไม่หาร',
  'assistant.card.budget.together': 'รวม {amount}',
  'assistant.card.budget.markedPaid': '{amount} ทำเครื่องหมายว่าจ่ายแล้ว',
  'assistant.card.budget.receipts': 'ใบเสร็จ {count} ใบ',
  'assistant.card.budget.leftOut':
    'ค่าใช้จ่ายสกุลเงินต่างประเทศ {count} รายการไม่ได้รวมในยอดรวม: ยังไม่มีอัตราแลกเปลี่ยน',
  'assistant.card.budget.unconverted': 'รายการใน {currencies} จำนวน {count} รายการไม่ถูกนับ: ยังไม่มีอัตราแลกเปลี่ยน',
};
export default assistantBudget;

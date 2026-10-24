import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'ตรวจการเปลี่ยนแปลงของเส้นทางของฉัน',
  'wanderer.watch.hint': 'แจ้งเตือนเมื่อเส้นทางที่นำเข้าอาจมีการเปลี่ยนแปลง',
  'wanderer.watch.info':
    'TREK อ่านบันทึกสั้น ๆ ของแต่ละเส้นทางที่คุณนำเข้าอย่างมากวันละครั้ง และไม่อ่านไฟล์ GPX เลย TREK แค่แจ้งเตือน ส่วนจะรับการเปลี่ยนแปลงหรือไม่ คุณตัดสินใจเองผ่านการตรวจแหล่งที่มาของทัวร์',
  'wanderer.watch.notConnected': 'เชื่อมต่อ wanderer ก่อน',
  'wanderer.watch.on': 'เปิดการตรวจเบื้องหลังแล้ว',
  'wanderer.watch.off': 'ปิดการตรวจเบื้องหลังแล้ว',
  'wanderer.watch.failed': 'สลับการตรวจเบื้องหลังไม่สำเร็จ',
  'wanderer.watch.lastRun': 'ตรวจล่าสุด {date}',
  'wanderer.watch.neverRun': 'ยังไม่ได้ตรวจ',
  'wanderer.watch.paused': 'หยุดชั่วคราวถึง {time}',
  'wanderer.watch.pausedHint': 'wanderer ไม่ตอบกลับ หลังความล้มเหลวแต่ละครั้ง TREK จะรอนานขึ้นก่อนถามอีกครั้ง',
  'wanderer.watch.blocked': 'โทเค็นถูกปฏิเสธ',
  'wanderer.watch.blockedHint':
    'wanderer ปฏิเสธโทเค็น API การตรวจจะทำต่อเมื่อการทดสอบการเชื่อมต่อผ่านหรือบันทึกโทเค็นใหม่',
  'wanderer.watch.hints': 'ข้อสังเกต',
  'wanderer.watch.hintsCount': 'ข้อสังเกตที่เปิดอยู่ {count} รายการ',
  'wanderer.watch.empty': 'ไม่มีข้อสังเกตที่เปิดอยู่',
  'wanderer.watch.dialogTitle': 'ข้อสังเกตเกี่ยวกับเส้นทางของคุณ',
  'wanderer.watch.openTour': 'เปิดทัวร์',
  'wanderer.watch.checkedAt': 'ตรวจเมื่อ {date}',
  'wanderer.watch.noticeLabel': 'การตรวจเบื้องหลัง',
  'wanderer.watch.state.possible_change': 'อาจมีการเปลี่ยนแปลง',
  'wanderer.watch.state.changed': 'เปลี่ยนแปลงแล้ว',
  'wanderer.watch.state.unverifiable': 'ตรวจไม่ได้',
  'wanderer.watch.stateHint.possible_change':
    'wanderer เปลี่ยนเวลาประทับของเส้นทาง มีเพียงการตรวจแหล่งที่มาที่บอกได้ว่าเนื้อหาต่างกันหรือไม่',
  'wanderer.watch.stateHint.changed':
    'บันทึกใน wanderer แสดงชื่อหรือคำอธิบายอื่น การตรวจแหล่งที่มาจะแสดงทุกอย่างที่เปลี่ยน',
  'wanderer.watch.stateHint.unverifiable': 'TREK ประเมินเส้นทางนี้ไม่ได้ จึงไม่บอกอะไรเกี่ยวกับการเปลี่ยนแปลง',
  'wanderer.watch.reason.unavailable': 'เข้าถึงเส้นทางไม่ได้',
  'wanderer.watch.reason.no_change_time': 'ไม่มีเวลาประทับ',
};
export default wandererWatch;

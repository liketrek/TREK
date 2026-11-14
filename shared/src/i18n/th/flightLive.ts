import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} วัน {h} ชม.',
  'flightLive.durHoursMinutes': '{h} ชม. {m} นาที',
  'flightLive.durMinutes': '{m} นาที',
  'flightLive.late': '+{m} นาที',
  'flightLive.early': 'เร็วกว่า {m} นาที',
  'flightLive.onTime': 'ตรงเวลา',
  'flightLive.departsIn': 'ออกเดินทางในอีก {time}',
  'flightLive.scheduled': 'ตามกำหนด',
  'flightLive.taxiing': 'พร้อมออกเดินทาง',
  'flightLive.atAirport': 'อยู่บนพื้นที่ {code}',
  'flightLive.airborne': 'อยู่บนฟ้า',
  'flightLive.landsIn': 'ลงจอดในอีก {time}',
  'flightLive.landed': 'ลงจอดแล้ว',
  'flightLive.landedAt': 'ลงจอดเวลา {time} ที่ {code}',
  'flightLive.estimated': 'โดยประมาณ',
  'flightLive.altitude': 'ความสูง',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} ม.',
  'flightLive.speed': 'ความเร็ว',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} กม./ชม.',
  'flightLive.remaining': 'เหลือ',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} กม.',
  'flightLive.aircraft': 'เครื่องบิน',
  'flightLive.noGateHint': 'ประตู อาคาร และสายพานกระเป๋าไม่อยู่ในข้อมูลการบินแบบเปิด เพิ่มเองในการจองหากต้องการ',
  'flightLive.legOf': 'เที่ยวบิน {n} จาก {total}',
  'flightLive.adminTitle': 'สถานะเที่ยวบินสด',
  'flightLive.adminHint':
    'แสดงตำแหน่ง ความล่าช้า และเวลาถึงโดยประมาณของเที่ยวบินที่จองจากข้อมูล ADS-B แบบเปิด (adsb.lol, adsb.fi) มีเพียงสัญญาณเรียกขานของเที่ยวบินเท่านั้นที่ออกจากเซิร์ฟเวอร์นี้',
  'flightLive.adminToggle': 'ติดตามเที่ยวบินที่จองแบบสด',
  'flightLive.headlineDetail': '{headline} {detail}',
  'flightLive.adminHintManaged':
    'แสดงตำแหน่ง ความล่าช้า และเวลาถึงโดยประมาณของเที่ยวบินที่จองจากข้อมูล ADS-B แบบเปิด (adsb.lol) มีเพียงสัญญาณเรียกขานของเที่ยวบินเท่านั้นที่ออกจากอินสแตนซ์',
  'flightLive.noFlight': 'ไม่มีเที่ยวบินที่กำลังจะมาถึง',
  'flightLive.envLocked': 'ตั้งค่าโดย FLIGHT_LIVE_ENABLED บนเซิร์ฟเวอร์และเปลี่ยนที่นี่ไม่ได้',
};

export default flightLive;

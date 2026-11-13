import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} י׳ {h} ש׳',
  'flightLive.durHoursMinutes': '{h} ש׳ {m} ד׳',
  'flightLive.durMinutes': '{m} ד׳',
  'flightLive.late': '+{m} ד׳',
  'flightLive.early': 'מוקדם ב־{m} ד׳',
  'flightLive.onTime': 'בזמן',
  'flightLive.departsIn': 'המראה בעוד {time}',
  'flightLive.scheduled': 'מתוכננת',
  'flightLive.taxiing': 'מוכנה להמראה',
  'flightLive.atAirport': 'על הקרקע ב־{code}',
  'flightLive.airborne': 'באוויר',
  'flightLive.landsIn': 'נחיתה בעוד {time}',
  'flightLive.landed': 'נחתה',
  'flightLive.landedAt': 'נחתה ב־{time} ב־{code}',
  'flightLive.estimated': 'משוער',
  'flightLive.altitude': 'גובה',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} מ׳',
  'flightLive.speed': 'מהירות',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} קמ״ש',
  'flightLive.remaining': 'נותרו',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} ק״מ',
  'flightLive.aircraft': 'מטוס',
  'flightLive.noGateHint':
    'שער, טרמינל ומסוע מזוודות אינם חלק מנתוני הטיסות הפתוחים. הוסיפו אותם בעצמכם להזמנה אם צריך.',
  'flightLive.legOf': 'טיסה {n} מתוך {total}',
  'flightLive.adminTitle': 'סטטוס טיסות חי',
  'flightLive.adminHint':
    'מציג מיקום, עיכוב והגעה משוערת של טיסות שהוזמנו מנתוני ADS-B פתוחים (adsb.lol, adsb.fi). רק אות הקריאה של הטיסה יוצא מהשרת הזה.',
  'flightLive.adminToggle': 'מעקב חי אחר טיסות שהוזמנו',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'מציג מיקום, עיכוב והגעה משוערת של טיסות שהוזמנו מנתוני ADS-B פתוחים (adsb.lol). רק אות הקריאה של הטיסה יוצא מהמופע.',
  'flightLive.noFlight': 'אין טיסה קרובה',
  'flightLive.envLocked': 'נקבע על ידי FLIGHT_LIVE_ENABLED בשרת ולא ניתן לשנות כאן.',
};

export default flightLive;

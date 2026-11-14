import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} ي {h} س',
  'flightLive.durHoursMinutes': '{h} س {m} د',
  'flightLive.durMinutes': '{m} د',
  'flightLive.late': '+{m} د',
  'flightLive.early': 'أبكر بـ {m} د',
  'flightLive.onTime': 'في الموعد',
  'flightLive.departsIn': 'الإقلاع بعد {time}',
  'flightLive.scheduled': 'مجدولة',
  'flightLive.taxiing': 'جاهزة للإقلاع',
  'flightLive.atAirport': 'على الأرض في {code}',
  'flightLive.airborne': 'في الجو',
  'flightLive.landsIn': 'الهبوط بعد {time}',
  'flightLive.landed': 'هبطت',
  'flightLive.landedAt': 'هبطت الساعة {time} في {code}',
  'flightLive.estimated': 'متوقع',
  'flightLive.altitude': 'الارتفاع',
  'flightLive.feet': '{n} قدم',
  'flightLive.meters': '{n} م',
  'flightLive.speed': 'السرعة',
  'flightLive.mph': '{n} ميل/س',
  'flightLive.kmh': '{n} كم/س',
  'flightLive.remaining': 'المتبقي',
  'flightLive.mi': '{n} ميل',
  'flightLive.km': '{n} كم',
  'flightLive.aircraft': 'الطائرة',
  'flightLive.noGateHint':
    'البوابة والمبنى وحزام الأمتعة ليست ضمن بيانات الطيران المفتوحة. أضفها بنفسك إلى الحجز إذا احتجت إليها.',
  'flightLive.legOf': 'الرحلة {n} من {total}',
  'flightLive.adminTitle': 'حالة الرحلات المباشرة',
  'flightLive.adminHint':
    'يعرض موقع الرحلات المحجوزة وتأخيرها ووصولها المتوقع من بيانات ADS-B المفتوحة (adsb.lol وadsb.fi). لا يغادر هذا الخادم سوى رمز النداء الخاص بالرحلة.',
  'flightLive.adminToggle': 'تتبع الرحلات المحجوزة مباشرة',
  'flightLive.headlineDetail': '{headline}، {detail}',
  'flightLive.adminHintManaged':
    'يعرض موقع الرحلات المحجوزة وتأخيرها ووصولها المتوقع من بيانات ADS-B المفتوحة (adsb.lol). لا يغادر المثيل سوى رمز النداء الخاص بالرحلة.',
  'flightLive.noFlight': 'لا توجد رحلة قادمة',
  'flightLive.envLocked': 'مضبوط عبر FLIGHT_LIVE_ENABLED على الخادم ولا يمكن تغييره هنا.',
};

export default flightLive;

import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} g {h} sa',
  'flightLive.durHoursMinutes': '{h} sa {m} dk',
  'flightLive.durMinutes': '{m} dk',
  'flightLive.late': '+{m} dk',
  'flightLive.early': '{m} dk erken',
  'flightLive.onTime': 'Zamanında',
  'flightLive.departsIn': '{time} sonra kalkış',
  'flightLive.scheduled': 'Planlandı',
  'flightLive.taxiing': 'Kalkışa hazır',
  'flightLive.atAirport': '{code} yerde',
  'flightLive.airborne': 'Havada',
  'flightLive.landsIn': '{time} sonra iniş',
  'flightLive.landed': 'İndi',
  'flightLive.landedAt': '{time} saatinde {code} indi',
  'flightLive.estimated': 'tahmini',
  'flightLive.altitude': 'İrtifa',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Hız',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/sa',
  'flightLive.remaining': 'Kalan',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Uçak',
  'flightLive.noGateHint':
    'Kapı, terminal ve bagaj bandı açık uçuş verilerinde yer almaz. Gerekirse bunları rezervasyona kendin ekle.',
  'flightLive.legOf': 'Uçuş {n}/{total}',
  'flightLive.adminTitle': 'Canlı uçuş durumu',
  'flightLive.adminHint':
    'Açık ADS-B verilerinden (adsb.lol, adsb.fi) rezerve edilen uçuşların konumunu, gecikmesini ve tahmini varışını gösterir. Bu sunucudan yalnızca uçuşun çağrı kodu çıkar.',
  'flightLive.adminToggle': 'Rezerve edilen uçuşları canlı izle',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Açık ADS-B verilerinden (adsb.lol) rezerve edilen uçuşların konumunu, gecikmesini ve tahmini varışını gösterir. Örnekten yalnızca uçuşun çağrı kodu çıkar.',
  'flightLive.noFlight': 'Yaklaşan uçuş yok',
  'flightLive.envLocked': 'Sunucuda FLIGHT_LIVE_ENABLED ile ayarlanır, burada değiştirilemez.',
};

export default flightLive;

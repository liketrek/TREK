import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d}일 {h}시간',
  'flightLive.durHoursMinutes': '{h}시간 {m}분',
  'flightLive.durMinutes': '{m}분',
  'flightLive.late': '+{m}분',
  'flightLive.early': '{m}분 일찍',
  'flightLive.onTime': '정시',
  'flightLive.departsIn': '{time} 후 출발',
  'flightLive.scheduled': '예정',
  'flightLive.taxiing': '출발 준비 완료',
  'flightLive.atAirport': '{code} 지상',
  'flightLive.airborne': '비행 중',
  'flightLive.landsIn': '{time} 후 착륙',
  'flightLive.landed': '착륙함',
  'flightLive.landedAt': '{time}에 {code} 착륙',
  'flightLive.estimated': '예상',
  'flightLive.altitude': '고도',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': '속도',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': '남음',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': '항공기',
  'flightLive.noGateHint':
    '게이트, 터미널, 수하물 벨트는 공개 비행 데이터에 없습니다. 필요하면 예약에 직접 추가하세요.',
  'flightLive.legOf': '항공편 {n}/{total}',
  'flightLive.adminTitle': '실시간 항공편 상태',
  'flightLive.adminHint':
    '공개 ADS-B 데이터(adsb.lol, adsb.fi)로 예약한 항공편의 위치, 지연, 도착 예정 시각을 보여줍니다. 이 서버에서 나가는 것은 항공편 호출부호뿐입니다.',
  'flightLive.adminToggle': '예약한 항공편 실시간 추적',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    '공개 ADS-B 데이터(adsb.lol)로 예약한 항공편의 위치, 지연, 도착 예정 시각을 보여줍니다. 인스턴스에서 나가는 것은 항공편 호출부호뿐입니다.',
  'flightLive.noFlight': '예정된 항공편 없음',
  'flightLive.envLocked': '서버의 FLIGHT_LIVE_ENABLED로 설정되어 여기서 변경할 수 없습니다.',
};

export default flightLive;

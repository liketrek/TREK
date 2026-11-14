import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d}日{h}時間',
  'flightLive.durHoursMinutes': '{h}時間{m}分',
  'flightLive.durMinutes': '{m}分',
  'flightLive.late': '+{m}分',
  'flightLive.early': '{m}分早着',
  'flightLive.onTime': '定刻',
  'flightLive.departsIn': '出発まで{time}',
  'flightLive.scheduled': '予定',
  'flightLive.taxiing': '出発準備完了',
  'flightLive.atAirport': '{code} の地上',
  'flightLive.airborne': '飛行中',
  'flightLive.landsIn': '着陸まで{time}',
  'flightLive.landed': '着陸済み',
  'flightLive.landedAt': '{time} に {code} へ着陸',
  'flightLive.estimated': '予定',
  'flightLive.altitude': '高度',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': '速度',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': '残り',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': '機体',
  'flightLive.noGateHint':
    'ゲート、ターミナル、手荷物受取所はオープンなフライトデータに含まれません。必要なら予約に自分で追加してください。',
  'flightLive.legOf': 'フライト {n}/{total}',
  'flightLive.adminTitle': 'フライトのライブ状況',
  'flightLive.adminHint':
    'オープンな ADS-B データ（adsb.lol、adsb.fi）から、予約したフライトの位置、遅延、到着予定を表示します。このサーバーから送られるのは便のコールサインだけです。',
  'flightLive.adminToggle': '予約したフライトをライブで追跡',
  'flightLive.headlineDetail': '{headline}、{detail}',
  'flightLive.adminHintManaged':
    'オープンな ADS-B データ（adsb.lol）から、予約したフライトの位置、遅延、到着予定を表示します。インスタンスから送られるのは便のコールサインだけです。',
  'flightLive.noFlight': '予定のフライトはありません',
  'flightLive.envLocked': 'サーバーの FLIGHT_LIVE_ENABLED で設定されているため、ここでは変更できません。',
};

export default flightLive;

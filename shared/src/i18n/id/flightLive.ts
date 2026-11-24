import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} h {h} j',
  'flightLive.durHoursMinutes': '{h} j {m} mnt',
  'flightLive.durMinutes': '{m} mnt',
  'flightLive.late': '+{m} mnt',
  'flightLive.early': '{m} mnt lebih awal',
  'flightLive.onTime': 'Tepat waktu',
  'flightLive.departsIn': 'Berangkat dalam {time}',
  'flightLive.scheduled': 'Terjadwal',
  'flightLive.taxiing': 'Siap berangkat',
  'flightLive.atAirport': 'Di darat di {code}',
  'flightLive.airborne': 'Di udara',
  'flightLive.landsIn': 'Mendarat dalam {time}',
  'flightLive.landed': 'Mendarat',
  'flightLive.landedAt': 'Mendarat pukul {time} di {code}',
  'flightLive.estimated': 'perkiraan',
  'flightLive.altitude': 'Ketinggian',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Kecepatan',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/j',
  'flightLive.remaining': 'Tersisa',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Pesawat',
  'flightLive.noGateHint':
    'Gerbang, terminal, dan sabuk bagasi tidak termasuk data penerbangan terbuka. Tambahkan sendiri ke pemesanan jika perlu.',
  'flightLive.legOf': 'Penerbangan {n} dari {total}',
  'flightLive.adminTitle': 'Status penerbangan langsung',
  'flightLive.adminHint':
    'Menampilkan posisi, keterlambatan, dan perkiraan kedatangan penerbangan yang dipesan dari data ADS-B terbuka (adsb.lol, adsb.fi). Hanya tanda panggil penerbangan yang keluar dari server ini.',
  'flightLive.adminToggle': 'Ikuti penerbangan yang dipesan secara langsung',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Menampilkan posisi, keterlambatan, dan perkiraan kedatangan penerbangan yang dipesan dari data ADS-B terbuka (adsb.lol). Hanya tanda panggil penerbangan yang keluar dari instans.',
  'flightLive.noFlight': 'Tidak ada penerbangan mendatang',
  'flightLive.envLocked': 'Diatur oleh FLIGHT_LIVE_ENABLED di server dan tidak dapat diubah di sini.',
};

export default flightLive;

import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Periksa perubahan jalur saya',
  'wanderer.watch.hint': 'Notifikasi saat jalur yang diimpor mungkin telah berubah.',
  'wanderer.watch.info':
    'Paling banyak sekali sehari, TREK membaca catatan singkat setiap jalur yang Anda impor, tidak pernah file GPX-nya. TREK hanya memberi tahu: menerima perubahan atau tidak, Anda sendiri yang memutuskan lewat pemeriksaan sumber tur.',
  'wanderer.watch.notConnected': 'Hubungkan wanderer terlebih dahulu',
  'wanderer.watch.on': 'Pemeriksaan latar belakang diaktifkan',
  'wanderer.watch.off': 'Pemeriksaan latar belakang dinonaktifkan',
  'wanderer.watch.failed': 'Pemeriksaan latar belakang tidak dapat diubah',
  'wanderer.watch.lastRun': 'Terakhir diperiksa {date}',
  'wanderer.watch.neverRun': 'Belum diperiksa',
  'wanderer.watch.paused': 'Dijeda hingga {time}',
  'wanderer.watch.pausedHint':
    'wanderer tidak menjawab. Setelah setiap kegagalan, TREK menunggu lebih lama sebelum bertanya lagi.',
  'wanderer.watch.blocked': 'Token ditolak',
  'wanderer.watch.blockedHint':
    'wanderer menolak token API. Pemeriksaan berlanjut setelah tes koneksi berhasil atau token baru disimpan.',
  'wanderer.watch.hints': 'Petunjuk',
  'wanderer.watch.hintsCount': '{count} petunjuk terbuka',
  'wanderer.watch.empty': 'Tidak ada petunjuk terbuka',
  'wanderer.watch.dialogTitle': 'Petunjuk tentang jalur Anda',
  'wanderer.watch.openTour': 'Buka tur',
  'wanderer.watch.checkedAt': 'Diperiksa {date}',
  'wanderer.watch.noticeLabel': 'Pemeriksaan latar belakang',
  'wanderer.watch.state.possible_change': 'Mungkin berubah',
  'wanderer.watch.state.changed': 'Berubah',
  'wanderer.watch.state.unverifiable': 'Tidak dapat diperiksa',
  'wanderer.watch.stateHint.possible_change':
    'wanderer mengubah stempel waktu jalur. Hanya pemeriksaan sumber yang menunjukkan apakah isinya berbeda.',
  'wanderer.watch.stateHint.changed':
    'Catatan di wanderer menunjukkan nama atau deskripsi lain. Pemeriksaan sumber menunjukkan semua yang berubah.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK tidak dapat menilai jalur ini, jadi tidak ada yang dikatakan tentang perubahannya.',
  'wanderer.watch.reason.unavailable': 'Jalur tidak dapat dijangkau',
  'wanderer.watch.reason.no_change_time': 'Tanpa stempel waktu',
};
export default wandererWatch;

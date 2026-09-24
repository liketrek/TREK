import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Hubungkan ke TREK',
  'native.connect.hint': 'Masukkan alamat yang kamu gunakan untuk membuka TREK di browser.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Hubungkan',
  'native.connect.checking': 'Memeriksa…',
  'native.connect.errorInvalid': 'Itu tidak terlihat seperti alamat web.',
  'native.connect.errorUnreachable': 'Tidak ada server yang merespons di alamat ini. Periksa alamat dan koneksimu.',
  'native.connect.errorNotTrek': 'Server di alamat ini bukan TREK.',
  'native.connect.errorTooOld': 'Server TREK ini terlalu lama untuk aplikasi. Server perlu diperbarui terlebih dahulu.',
  'native.offline.title': 'Server tidak dapat dijangkau',
  'native.offline.hint': 'TREK tidak dapat menjangkau {server}. Periksa koneksimu dan coba lagi.',
  'native.offline.retry': 'Coba lagi',
  'native.changeServer': 'Ganti server',
  'native.login.failed': 'Gagal masuk. Silakan coba lagi.',
  'native.handoff.title': 'Lanjutkan di aplikasi',
  'native.handoff.hint': 'Kamu masuk sebagai {name}. Buka aplikasi TREK untuk menyelesaikan proses masuk di sana.',
  'native.handoff.open': 'Buka aplikasi TREK',
  'native.handoff.switchAccount': 'Gunakan akun lain',
  'native.settings.server': 'Server',
  'native.settings.serverHint': 'Aplikasi ini terhubung ke {server}.',
};

export default native;

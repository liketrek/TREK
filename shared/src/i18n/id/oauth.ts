import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Perjalanan',
  'oauth.scope.group.places': 'Tempat',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Perlengkapan',
  'oauth.scope.group.todos': 'To-do',
  'oauth.scope.group.budget': 'Anggaran',
  'oauth.scope.group.reservations': 'Reservasi',
  'oauth.scope.group.collab': 'Kolaborasi',
  'oauth.scope.group.notifications': 'Notifikasi',
  'oauth.scope.group.vacay': 'Liburan',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Cuaca',
  'oauth.scope.group.journey': 'Journey',
  'oauth.scope.trips:read.label': 'Lihat perjalanan & itinerari',
  'oauth.scope.trips:read.description': 'Baca perjalanan, hari, catatan harian, dan anggota',
  'oauth.scope.trips:write.label': 'Edit perjalanan & itinerari',
  'oauth.scope.trips:write.description': 'Buat dan perbarui perjalanan, hari, catatan, dan kelola anggota',
  'oauth.scope.trips:delete.label': 'Hapus perjalanan',
  'oauth.scope.trips:delete.description': 'Hapus permanen seluruh perjalanan — tindakan ini tidak dapat dibatalkan',
  'oauth.scope.trips:share.label': 'Kelola tautan berbagi',
  'oauth.scope.trips:share.description': 'Buat, perbarui, dan cabut tautan berbagi publik untuk perjalanan',
  'oauth.scope.places:read.label': 'Lihat tempat & data peta',
  'oauth.scope.places:read.description': 'Baca tempat, penugasan hari, tag, dan kategori',
  'oauth.scope.places:write.label': 'Kelola tempat',
  'oauth.scope.places:write.description': 'Buat, perbarui, dan hapus tempat, penugasan, dan tag',
  'oauth.scope.atlas:read.label': 'Lihat Atlas',
  'oauth.scope.atlas:read.description': 'Baca negara yang dikunjungi, wilayah, dan daftar impian',
  'oauth.scope.atlas:write.label': 'Kelola Atlas',
  'oauth.scope.atlas:write.description': 'Tandai negara dan wilayah yang dikunjungi, kelola daftar impian',
  'oauth.scope.packing:read.label': 'Lihat daftar perlengkapan',
  'oauth.scope.packing:read.description': 'Baca barang perlengkapan, tas, dan penugasan kategori',
  'oauth.scope.packing:write.label': 'Kelola daftar perlengkapan',
  'oauth.scope.packing:write.description': 'Tambah, perbarui, hapus, centang, dan urutkan barang dan tas',
  'oauth.scope.todos:read.label': 'Lihat daftar to-do',
  'oauth.scope.todos:read.description': 'Baca item to-do perjalanan dan penugasan kategori',
  'oauth.scope.todos:write.label': 'Kelola daftar to-do',
  'oauth.scope.todos:write.description': 'Buat, perbarui, centang, hapus, dan urutkan item to-do',
  'oauth.scope.budget:read.label': 'Lihat anggaran',
  'oauth.scope.budget:read.description': 'Baca item anggaran dan rincian pengeluaran',
  'oauth.scope.budget:write.label': 'Kelola anggaran',
  'oauth.scope.budget:write.description': 'Buat, perbarui, dan hapus item anggaran',
  'oauth.scope.reservations:read.label': 'Lihat reservasi',
  'oauth.scope.reservations:read.description': 'Baca reservasi dan detail akomodasi',
  'oauth.scope.reservations:write.label': 'Kelola reservasi',
  'oauth.scope.reservations:write.description': 'Buat, perbarui, hapus, dan urutkan reservasi',
  'oauth.scope.collab:read.label': 'Lihat kolaborasi',
  'oauth.scope.collab:read.description': 'Baca catatan, polling, dan pesan kolaborasi',
  'oauth.scope.collab:write.label': 'Kelola kolaborasi',
  'oauth.scope.collab:write.description': 'Buat, perbarui, dan hapus catatan, polling, dan pesan kolaborasi',
  'oauth.scope.notifications:read.label': 'Lihat notifikasi',
  'oauth.scope.notifications:read.description': 'Baca notifikasi dalam aplikasi dan jumlah yang belum dibaca',
  'oauth.scope.notifications:write.label': 'Kelola notifikasi',
  'oauth.scope.notifications:write.description': 'Tandai notifikasi sebagai telah dibaca dan tanggapi',
  'oauth.scope.vacay:read.label': 'Lihat rencana liburan',
  'oauth.scope.vacay:read.description': 'Baca data perencanaan liburan, entri, dan statistik',
  'oauth.scope.vacay:write.label': 'Kelola rencana liburan',
  'oauth.scope.vacay:write.description': 'Buat dan kelola entri liburan, hari libur, dan rencana tim',
  'oauth.scope.geo:read.label': 'Peta & geokoding',
  'oauth.scope.geo:read.description': 'Cari lokasi, selesaikan URL peta, dan geokode terbalik koordinat',
  'oauth.scope.weather:read.label': 'Prakiraan cuaca',
  'oauth.scope.weather:read.description': 'Ambil prakiraan cuaca untuk lokasi dan tanggal perjalanan',
  'oauth.scope.journey:read.label': 'Lihat Journey',
  'oauth.scope.journey:read.description': 'Baca Journey, entri, dan daftar kontributor',
  'oauth.scope.journey:write.label': 'Kelola Journey',
  'oauth.scope.journey:write.description': 'Buat, perbarui, dan hapus Journey beserta entrinya',
  'oauth.scope.journey:share.label': 'Kelola tautan Journey',
  'oauth.scope.journey:share.description': 'Buat, perbarui, dan cabut tautan berbagi publik untuk Journey',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;

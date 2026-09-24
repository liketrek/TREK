import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Sinkronisasi dokumen',
  'docsync.noProviders': 'Tidak ada penyedia dokumen yang tersedia',
  'docsync.noProvidersHint': 'Administrator instans mengaktifkannya di Admin → Addon → Dokumen.',
  'docsync.addProvider': 'Hubungkan penyedia',
  'docsync.test': 'Uji koneksi',
  'docsync.connect.optional': 'Opsional',
  'docsync.connected': 'Terhubung',
  'docsync.chooseFolder': 'Pilih folder',
  'docsync.noFolders': 'Belum ada yang ditemukan di instans ini.',
  'docsync.newFolderPlaceholder': 'Nama folder baru',
  'docsync.syncNow': 'Sinkronkan sekarang',
  'docsync.unlink': 'Putuskan',
  'docsync.confirmUnlink':
    'Dokumen tetap ada di TREK dan di penyimpananmu. Hanya pasangan di antara keduanya yang dilepas.',
  'docsync.syncEnabled': 'Sinkronkan otomatis',
  'docsync.deletePolicy': 'Saat sebuah dokumen dihapus',
  'docsync.deleteUnlink': 'Simpan kedua salinan',
  'docsync.deleteTrash': 'Pindahkan ke tempat sampah',
  'docsync.conflictPolicy': 'Saat kedua sisi berubah',
  'docsync.onConflict.manual': 'Tanya saya',
  'docsync.onConflict.trek_wins': 'Simpan salinan TREK',
  'docsync.onConflict.provider_wins': 'Simpan salinan penyimpanan',
  'docsync.webhookHint':
    'Tempelkan URL ini di penyediamu agar perubahan langsung tiba. Tanpa itu, TREK memeriksa secara berkala.',

  // Bidang formulir koneksi. Kuncinya mencerminkan kolom `label` di
  // document_provider_fields, yang menyimpan sufiks kunci, bukan teks.
  'docsync.providerUrl': 'Alamat',
  'docsync.providerApiToken': 'Token API',
  'docsync.providerApiKey': 'Kunci API',
  'docsync.providerAppPassword': 'Sandi aplikasi',
  'docsync.providerAppToken': 'Token aplikasi',
  'docsync.providerUsername': 'Nama pengguna',
  'docsync.providerPassword': 'Kata sandi',
  'docsync.providerOrganization': 'ID organisasi',
  'docsync.providerBasePath': 'Folder dasar',
  'docsync.providerOTP': 'Kode dua faktor',
  'docsync.allowInsecureTls': 'Terima sertifikat yang ditandatangani sendiri',

  'docsync.hintPaperlessToken': 'Buat di Paperless pada My Profile. Token ini membawa seluruh hak akun tersebut.',
  'docsync.hintPapraKey':
    'Buat di Papra pada API keys. Kunci Papra selalu menjangkau setiap organisasi yang kamu ikuti.',
  'docsync.hintPapraOrg': 'ID org_… dari bilah alamat Papra.',
  'docsync.hintNextcloudLogin': 'Nama login Nextcloud milikmu, bukan alamat emailmu.',
  'docsync.hintNextcloudAppPassword':
    'Settings → Security → Create new app password. Jangan pernah pakai kata sandi akunmu.',
  'docsync.hintOpenCloudToken': 'Dibuat di OpenCloud pada app tokens.',
  'docsync.hintBasePath': 'Tempat TREK mencari folder perjalanan. Default-nya /TREK.',
  'docsync.hintSynologyUrl': 'Sertakan portnya, misalnya https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Sebaiknya akun DSM khusus yang hanya punya akses ke folder bersama ini.',
  'docsync.hintSynologyOtp': 'Hanya perlu sekali, jika akun memakai autentikasi dua faktor.',

  'docsync.linkState.never': 'Belum disinkronkan',
  'docsync.linkState.ok': 'Tersinkron',
  'docsync.linkState.partial': 'Sebagian tersinkron',
  'docsync.linkState.failed': 'Gagal',
  'docsync.linkState.needs_reauth': 'Masuk lagi',
  'docsync.linkState.scope_lost': 'Folder sudah tidak ada',
  'docsync.linkState.orphaned': 'Pemilik meninggalkan perjalanan',

  'docsync.state.pending': 'Menunggu',
  'docsync.state.synced': 'Tersinkron',
  'docsync.state.conflict': 'Konflik',
  'docsync.state.rejected_type': 'Tipe tidak diizinkan',
  'docsync.state.too_large': 'Terlalu besar',
  'docsync.state.error': 'Kesalahan',
  'docsync.state.remote_missing': 'Tidak ada di penyedia',
  'docsync.state.local_deleted': 'Dihapus di TREK',
  'docsync.state.scope_drift': 'Dipindahkan keluar folder',

  'docsync.conflict.resolve': "Selesaikan {count}",

  'docsync.conflict.title': 'Kedua salinan berubah',
  'docsync.conflict.keepTrek': 'Pertahankan versi TREK',
  'docsync.conflict.keepProvider': 'Pertahankan versi penyedia',
  'docsync.conflict.keepBoth': 'Pertahankan keduanya',

  // Alasan kegagalan dikirim sebagai kode, bukan sebagai teks dari penyedia:
  // penyedia menjawab dalam bahasa Inggris, atau dengan halaman login HTML milik
  // proxy, dan keduanya tidak pantas ada di sini.
  'docsync.error.unreachable': 'Penyedia tidak dapat dijangkau.',
  'docsync.error.tls_untrusted':
    'Sertifikat ditolak. Izinkan sertifikat yang ditandatangani sendiri jika kamu memercayai instans ini.',
  'docsync.error.unauthorized': 'Kredensial ditolak.',
  'docsync.error.forbidden': 'Akun ini tidak diizinkan melakukan itu.',
  'docsync.error.not_found': 'Tidak ditemukan di penyedia.',
  'docsync.error.scope_missing': 'Folder yang terhubung sudah tidak ada.',
  'docsync.error.rate_limited': 'Penyedia membatasi laju permintaan kami. TREK akan mencoba lagi nanti.',
  'docsync.error.too_large': 'File lebih besar daripada yang diterima penyedia.',
  'docsync.error.unsupported_type': 'Penyedia tidak menerima tipe file ini.',
  'docsync.error.quota_exceeded': 'Penyedia kehabisan ruang.',
  'docsync.error.conflict': 'Dokumen berubah di kedua sisi.',
  'docsync.error.checksum_mismatch': 'Transfer tidak tiba dengan utuh.',
  'docsync.error.provider_error': 'Penyedia melaporkan kesalahan.',
  'docsync.error.timeout': 'Penyedia terlalu lama menjawab.',
  'docsync.error.ssrf_blocked': 'Alamat itu tidak diizinkan.',
  'docsync.error.mass_delete_guard':
    'Hampir semua dokumen hilang sekaligus, jadi tidak ada yang diubah. Periksa apakah foldernya masih terpasang.',
  'docsync.error.unknown': 'Ada yang tidak beres.',

  // ── Dialognya ──────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Perjalanan ini',
  'docsync.addAnother': 'Tambah lagi',
  'docsync.syncing': 'Menyinkronkan',
  'docsync.card.pickFolder': 'Terhubung, pilih folder',

  'docsync.empty.title': 'Belum ada yang terhubung',
  'docsync.empty.hintOwner':
    'Pilih penyimpanan di sebelah kiri. TREK menyimpan salinannya sendiri untuk semuanya, jadi tidak ada yang hilang kalau penyimpanan itu lenyap.',
  'docsync.empty.hintMember': 'Pemilik perjalanan yang mengaturnya. Dokumen tetap ada di TREK, apa pun pilihannya.',

  // Cara tiap produk mengarsipkan. Ditampilkan sebelum ada yang menghubungkan,
  // karena inilah yang akan ditanyakan layar berikutnya.
  'docsync.model.paperless': 'Mengarsipkan per tag',
  'docsync.model.papra': 'Mengarsipkan per tag, di dalam sebuah organisasi',
  'docsync.model.nextcloud': 'Mengarsipkan di dalam folder',
  'docsync.model.opencloud': 'Mengarsipkan di dalam sebuah ruang',
  'docsync.model.synologydrive': 'Mengarsipkan di dalam folder di NAS',

  // ── Bilah alur ─────────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Keluar ke penyimpanan',
  'docsync.flow.toTrek': 'Masuk dari penyimpanan',
  'docsync.flow.documents': 'dokumen',
  'docsync.flow.summary.both': 'Dokumen bergerak dua arah.',
  'docsync.flow.summary.pull': 'Dokumen hanya masuk.',
  'docsync.flow.summary.push': 'Dokumen hanya keluar.',
  'docsync.flow.summaryEditable.both': 'Bergerak dua arah. Ketuk satu jalur untuk menghentikannya.',
  'docsync.flow.summaryEditable.pull': 'Hanya masuk. Ketuk jalur satunya agar ikut dikirim keluar.',
  'docsync.flow.summaryEditable.push': 'Hanya keluar. Ketuk jalur satunya agar ikut dibawa masuk.',

  // ── Satu pasangan ──────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Pengaturan',
  'docsync.binding.folder': 'Folder',
  'docsync.binding.lastRun': 'Terakhir dijalankan',
  'docsync.binding.autoOff': 'Dijeda',
  'docsync.binding.neverRun': 'belum pernah dijalankan',
  'docsync.binding.deleteHint': 'Apa yang terjadi pada salinan di sisi satunya.',
  'docsync.binding.conflictHint': 'Salinan mana yang bertahan saat dokumen diubah di kedua tempat.',
  'docsync.binding.autoHint': 'Periksa perubahan di latar belakang.',
  'docsync.binding.webhookTitle': 'Pembaruan seketika',
  'docsync.binding.copy': 'Salin',
  'docsync.binding.copied': 'Tersalin',

  // ── Menghubungkan ──────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Hubungkan',
  'docsync.connect.testing': 'Mencoba menjangkaunya',
  'docsync.connect.okAs': 'Terjangkau, masuk sebagai {account}',
  'docsync.connect.insecureHint': 'Untuk instans di jaringanmu sendiri dengan sertifikat yang ditandatangani sendiri.',
  'docsync.connect.about.paperless':
    'TREK mengarsipkan perjalanan ini di bawah tag miliknya sendiri dan tidak pernah menyentuh sisa arsipmu.',
  'docsync.connect.about.papra':
    'Pilih organisasi tempat perjalanan ini berada. TREK mengarsipkannya di bawah tag miliknya sendiri di dalamnya.',
  'docsync.connect.about.nextcloud':
    'Pakai sandi aplikasi, bukan kata sandi akunmu: sandi aplikasi tahan terhadap dua faktor dan bisa dicabut sendiri.',
  'docsync.connect.about.opencloud': 'TREK mendapat ruang sendiri untuk perjalanan ini, terpisah dari yang lain.',
  'docsync.connect.about.synologydrive':
    'Sebaiknya akun DSM yang hanya menjangkau folder bersama untuk perjalanan ini.',

  // ── Memilih wadahnya ───────────────────────────────────────────────────────
  'docsync.scope.title': 'Di mana perjalanan ini disimpan di {provider}?',
  'docsync.scope.intro': 'Hanya isi di sini yang disinkronkan. Semua hal lain di penyimpananmu tetap di luar TREK.',
  'docsync.scope.createTitle': 'Buat yang baru',
  'docsync.scope.createAction': 'Buat',
  'docsync.scope.pickTitle': 'Atau pakai yang sudah ada',
  'docsync.scope.search': 'Cari',
  'docsync.scope.noMatch': 'Tidak ada yang cocok.',

  // ── Hal yang harus diputuskan orang ────────────────────────────────────────
  'docsync.issues.title': 'Perlu dilihat',
  'docsync.issues.conflict': 'Berubah di kedua tempat. Pilih mana yang dipertahankan.',
  'docsync.issues.remote_missing': 'Hilang dari penyimpanan. Salinan TREK masih ada.',
  'docsync.issues.rejected_type': 'Tipe file ini tidak diizinkan di sini.',
  'docsync.issues.too_large': 'Lebih besar dari batas.',
  'docsync.issues.error': 'Transfer tidak berhasil.',

  'docsync.error.unknown_provider': 'Penyedia ini tidak tersedia di instans ini.',
  'docsync.error.provider_disabled': 'Dijeda: administrator menonaktifkan penyedia ini. Sinkronisasi berlanjut setelah penyedia diaktifkan kembali.',
  'docsync.binding.reconnect': 'Hubungkan ulang',
};

export default docsync;

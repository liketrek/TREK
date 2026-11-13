import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Impor email pemesanan',
  'mailAdmin.hint': 'Konfirmasi pemesanan yang diteruskan menjadi pemesanan di perjalanan yang tepat.',
  'mailAdmin.enabled': 'Impor email pemesanan',
  'mailAdmin.enabledHint':
    'Memberi semua orang di instalasi ini alamat penerusan. Jika nonaktif, tidak ada alamat yang menerima email.',
  'mailAdmin.transport.label': 'Cara email masuk',
  'mailAdmin.transport.off': 'Hanya unggah',
  'mailAdmin.transport.imap': 'Kotak surat IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Tanpa kotak surat: email yang disimpan diunggah sebagai file .eml di pengaturan, dan TREK membacanya dengan cara yang sama. Cocok untuk mencoba.',
  'mailAdmin.transport.imapInfo':
    'TREK memeriksa kotak surat setiap dua menit dan mengambil email baru. Gunakan kotak surat tersendiri yang menerima alamat plus (trek+…@domain-anda), bukan kotak pribadi: email yang sudah dibaca dipindahkan ke TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Layanan email, seperti Cloudflare Email Worker, menyerahkan setiap email langsung ke TREK dan menandatanganinya dengan kunci di bawah, sehingga tidak ada orang lain yang bisa menyelipkan email. Untuk pemasangan tanpa kotak surat.',
  'mailAdmin.aiDaily': 'Email AI per orang per hari',
  'mailAdmin.aiDailyHint': 'Di atas batas ini, hanya data pemesanan yang dapat dibaca mesin yang dibaca.',
  'mailAdmin.template': 'Templat alamat',
  'mailAdmin.templateHint': 'Alamat penerusan, dengan {token} di tempat kode setiap orang dimasukkan.',
  'mailAdmin.imap.host': 'Server', // same-as-en
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Enkripsi',
  'mailAdmin.imap.user': 'Pengguna',
  'mailAdmin.imap.pass': 'Kata sandi',
  'mailAdmin.imap.mailbox': 'Folder', // same-as-en
  'mailAdmin.imap.mailboxHint': 'Email yang sudah dibaca dipindahkan ke TREK/processed.',
  'mailAdmin.webhook.secret': 'Rahasia penandatanganan',
  'mailAdmin.webhook.secretHint':
    'Minimal 32 karakter; pengirim menandatangani setiap email dengannya. Jika kosong, webhook dinonaktifkan.',
  'mailAdmin.inboundUrl': 'Alamat webhook',
  'mailAdmin.inboundUrlHint': 'Layanan email Anda mengirim setiap email ke sini, mentah dan bertanda tangan.',
  'mailAdmin.copyUrl': 'Salin alamat',
  'mailAdmin.envHint': 'Variabel lingkungan (MAIL_INGEST_*) lebih diutamakan daripada kolom ini.',
  'mailAdmin.loadError': 'Pengaturan impor email tidak dapat dimuat.',
  'mailAdmin.problem.secretShort': 'Rahasia minimal 32 karakter.',
  'mailAdmin.problem.portInvalid': 'Masukkan port antara 1 dan 65535.',
  'mailAdmin.problem.templateToken': 'Alamat memerlukan {token} untuk kode setiap orang.',
  'mailAdmin.problem.dailyInvalid': 'Masukkan bilangan bulat dari 0 sampai 1000.',
  'mailAdmin.status.title': 'Status', // same-as-en
  'mailAdmin.status.lastRead': 'Terakhir dibaca {time}',
  'mailAdmin.status.never': 'belum pernah',
  'mailAdmin.status.mails': 'Email, 24 j',
  'mailAdmin.status.added': 'Ditambahkan otomatis',
  'mailAdmin.status.waiting': 'Menunggu',
  'mailAdmin.status.failed': 'Gagal',
  'mailAdmin.test.run': 'Uji koneksi',
  'mailAdmin.test.ok': 'Terhubung',
  'mailAdmin.test.failed': 'Tidak terhubung',
};
export default mailAdmin;

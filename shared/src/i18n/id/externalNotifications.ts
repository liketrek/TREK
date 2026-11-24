import type { NotificationLocale } from '../externalNotifications/types';

const id: NotificationLocale = {
  email: {
    footer: 'Anda menerima ini karena Anda telah mengaktifkan notifikasi di TREK.',
    manage: 'Kelola preferensi di Pengaturan',
    madeWith: 'Dibuat dengan',
    openTrek: 'Buka TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Undangan perjalanan: "${p.trip}"`,
      body: `${p.actor} mengundang ${p.invitee || 'seorang anggota'} ke perjalanan "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Pemesanan baru: ${p.booking}`,
      body: `${p.actor} menambahkan "${p.booking}" (${p.type}) baru ke "${p.trip}".`,
    }),
    flight_departed: (p) => ({
      title: `${p.flight} telah lepas landas`,
      body: `${p.flight} dari ${p.from} ke ${p.to} sedang mengudara.`,
    }),
    flight_delayed: (p) => ({
      title: `${p.flight} terlambat`,
      body: `${p.flight} dari ${p.from} ke ${p.to} terlambat sekitar ${p.delay} menit dari jadwal.`,
    }),
    flight_landed: (p) => ({
      title: `${p.flight} telah mendarat`,
      body: `${p.flight} dari ${p.from} telah mendarat di ${p.to}.`,
    }),
    trip_reminder: (p) => ({
      title: `Pengingat perjalanan: ${p.trip}`,
      body: `Perjalanan Anda "${p.trip}" akan segera tiba!`,
    }),
    todo_due: (p) => ({
      title: `Tugas jatuh tempo: ${p.todo}`,
      body: `"${p.todo}" di "${p.trip}" jatuh tempo pada ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Undangan Penggabungan Vacay',
      body: `${p.actor} mengundang Anda untuk menggabungkan rencana liburan. Buka TREK untuk menerima atau menolak.`,
    }),
    vacay_share: (p) => ({
      title: 'Kalender Vacay Dibagikan',
      body: `${p.actor} membagikan kalender cutinya dengan Anda. Buka TREK untuk melihatnya.`,
    }),
    collection_invite: (p) => ({
      title: 'Undangan koleksi',
      body: `${p.actor} mengundang Anda untuk berbagi koleksi. Buka TREK untuk menerima atau menolak.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} foto dibagikan`,
      body: `${p.actor} membagikan ${p.count} foto di "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Pesan baru di "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Pengepakan: ${p.category}`,
      body: `${p.actor} menugaskan Anda ke kategori "${p.category}" di "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Versi TREK baru tersedia',
      body: `TREK ${p.version} sekarang tersedia. Kunjungi panel admin untuk memperbarui.`,
    }),
    replica_failure: (p) => ({
      title: 'Kegagalan replika penyimpanan',
      body:
        `Penulisan replika gagal pada '${p.backend}': ${p.op} dari ${p.key} — ${p.error}.` +
        (p.suppressed !== '0' ? ` ${p.suppressed} kegagalan lainnya tidak dilaporkan sejak notifikasi terakhir.` : ''),
    }),
    paddle_region_requested: (p) => ({
      title: 'Wilayah dayung diminta',
      body: `${p.actor} merencanakan tur dayung di ${p.region}. Muat atau tolak data airnya di area admin pada Add-on.`,
    }),
    synology_session_cleared: () => ({
      title: 'Sesi Synology dihapus',
      body: 'Akun atau URL Synology Anda berubah. Anda telah keluar dari Synology Photos.',
    }),
    wanderer_source_hint: (p) => ({
      title: `Jalur wanderer: ${p.tour}`,
      body:
        p.state === 'changed'
          ? `“${p.tour}” di “${p.trip}” telah diubah di wanderer. Buka tur dan periksa sumbernya untuk melihat semua perubahan. Tidak ada yang berubah sendiri di perjalanan.`
          : p.state === 'unverifiable'
            ? `“${p.tour}” di “${p.trip}” tidak dapat diperiksa lagi di wanderer. Tur di perjalanan Anda tetap seperti semula.`
            : `“${p.tour}” di “${p.trip}” mungkin berubah di wanderer. Buka tur dan periksa sumbernya. Tidak ada yang berubah sendiri di perjalanan.`,
    }),
    mail_booking_added: (p) => ({
      title: `Ditambahkan dari email: ${p.booking}`,
      body:
        p.role === 'traveller'
          ? `${p.actor} menambahkan "${p.booking}" ke "${p.trip}" dari email yang diteruskan.`
          : `"${p.booking}" dari email yang kamu teruskan ditambahkan ke "${p.trip}". Kamu bisa mengurungkannya di TREK selama 7 hari.`,
    }),
    mail_booking_pending: (p) => ({
      title: 'Pemesanan terusan untuk ditinjau',
      body: `Pemesanan terusan yang menunggumu di TREK: ${p.count}. Masing-masing menyebutkan mengapa tidak ditambahkan otomatis.`,
    }),
    mail_ingest_paused: () => ({
      title: 'Impor email dijeda',
      body: 'TREK untuk sementara tidak menerima email pemesanan yang diteruskan, jadi tunda dulu meneruskannya. Alamatmu tetap ada dan akan berfungsi lagi saat impor kembali, dan pemesanan yang sudah ditambahkan tetap ada di perjalananmu.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Setel ulang kata sandi Anda',
    greeting: 'Halo',
    body: 'Kami menerima permintaan untuk menyetel ulang kata sandi akun TREK Anda. Klik tombol di bawah untuk menetapkan kata sandi baru.',
    ctaIntro: 'Setel ulang kata sandi',
    expiry: 'Tautan ini kedaluwarsa dalam 60 menit.',
    ignore: 'Jika Anda tidak meminta ini, Anda dapat mengabaikan email ini — kata sandi Anda tidak akan berubah.',
  },
};

export default id;

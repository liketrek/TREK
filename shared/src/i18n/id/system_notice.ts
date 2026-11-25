import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Selamat datang di TREK',
  'system_notice.welcome_v1.body':
    'Perencana perjalanan lengkap Anda. Buat itinerari, bagikan perjalanan dengan teman, dan tetap terorganisir — online maupun offline.',
  'system_notice.welcome_v1.cta_label': 'Rencanakan perjalanan',
  'system_notice.welcome_v1.hero_alt': 'Destinasi wisata indah dengan antarmuka TREK',
  'system_notice.welcome_v1.highlight_plan': 'Itinerari harian untuk setiap perjalanan',
  'system_notice.welcome_v1.highlight_share': 'Berkolaborasi dengan teman perjalanan',
  'system_notice.welcome_v1.highlight_offline': 'Bekerja offline di ponsel',
  'system_notice.dev_test_modal.title': '[Dev] Pemberitahuan uji',
  'system_notice.dev_test_modal.body': 'Ini adalah pemberitahuan uji khusus dev.',
  'system_notice.thank_you_support.title': 'Terima kasih telah memakai TREK',
  'system_notice.thank_you_support.body':
    'Sekadar ucapan terima kasih singkat karena telah memasang TREK — ini benar-benar berarti banyak bagi saya.\n\nSaya seorang developer solo dan membangun TREK di waktu luang. Awalnya hanya alat kecil untuk perjalanan saya sendiri, dan sejujurnya saya terharu dengan dukungan serta minat dari komunitas sejak saat itu. TREK dibuat dengan sepenuh hati dari saya — tetapi juga berkat banyak kontributor eksternal hebat yang telah membantu membentuknya.\n\n**TREK bersifat open source dan sepenuhnya gratis — dan akan selalu begitu, selamanya. Tanpa paket berbayar, tanpa langganan, tanpa syarat tersembunyi. Saya janji.**\n\nJika TREK bermanfaat bagimu dan kamu ingin mendukung pengembangannya, secangkir kopi kecil sungguh membantu saya untuk terus membangun — sama sekali tanpa paksaan, tapi setiap cangkir membuat malam-malam panjang ini tetap berjalan.\n\nTerima kasih telah berada di sini.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% open source di GitHub',
  'system_notice.thank_you_support.highlight_free': 'Gratis selamanya — tanpa paket berbayar',
  'system_notice.thank_you_support.highlight_community': 'Dibangun bersama komunitas',
  'system_notice.thank_you_support.cta_bmc': 'Traktir Kopi',
  'system_notice.thank_you_support.cta_kofi': 'Dukung di Ko-fi',
  'system_notice.thank_you_support.cta_patreon': 'Bulanan di Patreon',
  'system_notice.pager.prev': 'Pemberitahuan sebelumnya',
  'system_notice.pager.next': 'Pemberitahuan berikutnya',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Pergi ke pemberitahuan {n}',
  'system_notice.pager.position': 'Pemberitahuan {current} dari {total}',
  'system_notice.v3_photos.title': 'Foto dipindahkan di 3.0',
  'system_notice.v3_photos.body':
    '**Foto** di Perencana Perjalanan telah dihapus. Foto Anda aman — TREK tidak pernah mengubah perpustakaan Immich atau Synology Anda.\n\nFoto kini ada di addon **Journey**. Journey bersifat opsional — jika belum tersedia, minta admin untuk mengaktifkannya di Admin → Addon.',
  'system_notice.v3_journey.title': 'Kenali Journey — jurnal perjalanan',
  'system_notice.v3_journey.body':
    'Dokumentasikan perjalanan Anda sebagai cerita hidup dengan linimasa, galeri foto, dan peta interaktif.',
  'system_notice.v3_journey.cta_label': 'Buka Journey',
  'system_notice.v3_journey.highlight_timeline': 'Linimasa & galeri',
  'system_notice.v3_journey.highlight_photos': 'Impor dari Immich atau Synology',
  'system_notice.v3_journey.highlight_share': 'Bagikan secara publik — tanpa login',
  'system_notice.v3_journey.highlight_export': 'Ekspor sebagai buku foto PDF',
  'system_notice.v3_features.title': 'Sorotan lain di 3.0',
  'system_notice.v3_features.body': 'Beberapa pembaruan lain dalam rilis ini.',
  'system_notice.v3_features.highlight_dashboard': 'Desain ulang dashboard mobile-first',
  'system_notice.v3_features.highlight_offline': 'Mode offline penuh sebagai PWA',
  'system_notice.v3_features.highlight_search': 'Pelengkapan otomatis tempat secara real-time',
  'system_notice.v3_features.highlight_import': 'Impor tempat dari file KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: pembaruan OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Integrasi MCP telah sepenuhnya diperbarui. OAuth 2.1 kini menjadi metode autentikasi yang direkomendasikan. Token statis (trek_…) sudah usang dan akan dihapus pada versi mendatang.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 direkomendasikan (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 cakupan izin yang terperinci',
  'system_notice.v3_mcp.highlight_deprecated': 'Token statis trek_ sudah usang',
  'system_notice.v3_mcp.highlight_tools': 'Perangkat dan prompt yang diperluas',
  'system_notice.v3_thankyou.title': 'Catatan pribadi dari saya',
  'system_notice.v3_thankyou.body':
    'Sebelum kamu lanjut — saya ingin berhenti sejenak.\n\nTREK dimulai sebagai proyek sampingan yang saya buat untuk perjalanan saya sendiri. Saya tidak pernah membayangkan ia akan tumbuh menjadi sesuatu yang dipercaya oleh 4.000 dari kalian untuk merencanakan petualangan. Setiap bintang, setiap issue, setiap permintaan fitur — saya membaca semuanya, dan itulah yang membuat saya terus bertahan di malam-malam larut antara pekerjaan penuh waktu dan kuliah.\n\nSaya ingin kalian tahu: TREK akan selalu open source, selalu self-hosted, selalu milik kalian. Tanpa pelacakan, tanpa langganan, tanpa syarat tersembunyi. Hanya sebuah alat yang dibuat oleh seseorang yang mencintai traveling sama seperti kalian.\n\nTerima kasih khusus untuk [jubnl](https://github.com/jubnl) — kamu telah menjadi kolaborator yang luar biasa. Begitu banyak hal yang membuat versi 3.0 hebat memiliki jejakmu. Terima kasih telah percaya pada proyek ini ketika masih kasar.\n\nDan untuk setiap dari kalian yang melaporkan bug, menerjemahkan string, membagikan TREK kepada teman, atau sekadar menggunakannya untuk merencanakan perjalanan — **terima kasih**. Kalianlah alasan semua ini ada.\n\nUntuk lebih banyak petualangan bersama.\n\n— Maurice\n\n---\n\n[Bergabunglah dengan komunitas di Discord](https://discord.gg/7Q6M6jDwzf)\n\nJika TREK membuat perjalananmu lebih baik, [secangkir kopi kecil](https://ko-fi.com/mauriceboe) selalu membantu menjaga lampu tetap menyala.',
  'system_notice.v3014_whitespace_collision.title': 'Tindakan diperlukan: konflik akun pengguna',
  'system_notice.v3014_whitespace_collision.body':
    'Pembaruan 3.0.14 mendeteksi satu atau lebih konflik nama pengguna atau email yang disebabkan oleh spasi di awal atau akhir nilai yang tersimpan. Akun yang terpengaruh telah diganti nama secara otomatis. Periksa log server untuk baris yang dimulai dengan **[migration] WHITESPACE COLLISION** guna mengidentifikasi akun mana yang perlu ditinjau.',
  'system_notice.release_notes.eyebrow': 'Pembaruan terpasang',
  'system_notice.release_notes.headline': 'Lebih sedikit mengetik, lebih banyak bepergian.',
  'system_notice.release_notes.intro':
    'Email pemesanan yang Anda teruskan masuk ke perjalanan Anda, TREK memantau penerbangan Anda secara langsung, dan PDF perjalanan benar-benar baru.',
  'system_notice.release_notes.features_label': 'Sorotan utama',
  'system_notice.release_notes.features_aside': 'Masih banyak lagi',
  'system_notice.release_notes.feature_mail_title': 'Email pemesanan masuk ke perjalanan Anda',
  'system_notice.release_notes.feature_mail_body':
    'Teruskan konfirmasi dan TREK menambahkan pemesanan ke perjalanan yang tepat.',
  'system_notice.release_notes.feature_flight_title': 'Status penerbangan langsung, gratis',
  'system_notice.release_notes.feature_flight_body': 'Status, keterlambatan, dan pesawat di peta, tanpa kunci API.',
  'system_notice.release_notes.feature_pdf_title': 'PDF perjalanan baru',
  'system_notice.release_notes.feature_pdf_body': 'Rute Anda, setiap hari, dan semua pemesanan Anda, siap dicetak.',
  'system_notice.release_notes.footnote':
    'Ditambah PostgreSQL, add-on per perjalanan, tag pada tempat, dan banyak perubahan kecil lainnya.',
  'system_notice.release_notes.notes_label': 'Catatan rilis',
  'system_notice.release_notes.note_eyebrow': 'Catatan dari maintainer',
  'system_notice.release_notes.note_title': 'Kalianlah alasan saya terus membangun TREK.',
  'system_notice.release_notes.note_body':
    'TREK bermula sebagai alat kecil untuk perjalanan saya sendiri, dibuat sepulang kerja. Hampir semua yang Anda pakai hari ini lahir larut malam, di akhir pekan, atau di kereta, di sela pekerjaan penuh waktu, dan saya sering bertanya-tanya apakah akan ada yang membukanya.',
  'system_notice.release_notes.promise_label': 'Janjinya',
  'system_notice.release_notes.promise_lead': 'TREK tetap gratis, selamanya.',
  'system_notice.release_notes.promise_text':
    'Setiap fitur, setiap pembaruan, untuk semua orang. Tanpa paket berbayar, tanpa langganan, tanpa syarat tersembunyi.',
  'system_notice.release_notes.note_body_after':
    'Lalu Anda datang, ribuan orang: dengan bintang, laporan bug, terjemahan, dan pull request dari orang yang belum pernah saya temui. Rasanya masih belum benar-benar nyata.',
  'system_notice.release_notes.note_closing': 'Terima kasih sudah ada di sini. Maurice',
  'system_notice.release_notes.support_label': 'Terwujud berkat Anda',
  'system_notice.release_notes.support_lead': 'TREK hanya ada berkat donasi.',
  'system_notice.release_notes.support_text':
    'Donasi itu membayar server dan memberi saya waktu untuk terus membangunnya. Satu kopi saja sudah membantu menjaga TREK tetap gratis untuk semua orang.',
  'system_notice.release_notes.cta_bmc': 'Traktir aku kopi',
  'system_notice.release_notes.cta_kofi': 'Dukung di Ko-fi',
  'system_notice.release_notes.cta_patreon': 'Bulanan di Patreon',
  'system_notice.release_notes.apps_title': 'TREK kini ada di ponsel Anda',
};
export default system_notice;

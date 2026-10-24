import type { TranslationStrings } from '../types';

// English fallback until 'id' is translated.
const help: TranslationStrings = {
  'help.title': 'Bantuan & Dokumentasi',
  'help.search': 'Cari di dokumentasi…',
  'help.contents': 'Daftar isi',
  'help.noResults': 'Tidak ada halaman yang cocok.',
  'help.errorTitle': 'Halaman ini gagal dimuat',
  'help.errorBody': 'Konten bantuan diambil dari wiki TREK. Periksa koneksimu lalu coba lagi.',

  // center
  'help.center.button': 'Bantuan untuk layar ini',
  'help.center.title': 'Bantuan',
  'help.center.onThisScreen': 'Di layar ini',
  'help.center.screens': 'Layar',
  'help.center.thisScreen': 'Saat ini',
  'help.center.subScreens': '{count} sublayar',
  'help.center.subScreensLabel': 'Sublayar',
  'help.center.guidesCount': '{count} panduan',
  'help.center.goToScreen': 'Buka {screen}',
  'help.center.overview': 'Ikhtisar',
  'help.center.howTo': 'Bagaimana cara…',
  'help.center.searchPlaceholder': 'Cari panduan dan dokumentasi…',
  'help.center.searchEmpty': 'Tidak ada hasil untuk “{query}”.',
  'help.center.searchGuides': 'Panduan',
  'help.center.searchDocs': 'Dokumentasi',
  'help.center.searchError': 'Pencarian sedang tidak tersedia.',
  'help.center.back': 'Kembali',
  'help.center.close': 'Tutup bantuan',
  'help.center.steps': '{count} langkah',
  'help.center.step': 'Langkah {n}',
  'help.center.stepsLabel': 'Langkah',
  'help.center.stepOf': 'Langkah {n} dari {total}',
  'help.center.screenshot': 'Tangkapan layar',
  'help.center.result': 'Hasilnya',
  'help.center.tips': 'Perlu diketahui',
  'help.center.related': 'Terkait',
  'help.center.openDocs': 'Buka di Bantuan & Dokumentasi',
  'help.center.docsSection': 'Di dokumentasi',
  'help.center.noContext': 'Belum ada panduan untuk layar ini.',
  'help.center.noContextHint': 'Cari di dokumentasi, atau beri tahu kami apa yang kamu cari.',
  'help.center.feedback': 'Ada yang kurang?',
  'help.center.feedbackLink': 'Beri tahu kami di GitHub',
  'help.center.discord': 'Tanya di Discord',
  'help.center.quick': 'Singkat',
  'help.center.guide': 'Panduan',
  'help.center.tour': 'Tur panduan',
  'help.center.imageAlt': 'Langkah {n} dari “{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Dasbor',
  'help.ctx.dashboard.summary':
    'Dasbor menampilkan semua perjalananmu. Kartu di bagian atas, bergaya boarding pass, menampilkan perjalanan yang sedang berlangsung atau yang berikutnya. Baris di bawahnya menghitung perjalanan yang sudah kamu tempuh, dan kartu-kartunya mencantumkan semua perjalanan yang sedang kamu rencanakan, diarsipkan, atau sudah selesai.',
  'help.ctx.dashboard.bullet.1':
    'Boarding pass: perjalanan yang sedang berlangsung atau yang berikutnya, lengkap dengan tanggal, teman perjalanan, tempat, dan hitung mundurnya. Klik untuk membuka perjalanan itu. Empat tombol di pojok kanan atasnya untuk mengedit, menduplikat, mengarsipkan, atau menghapusnya.',
  'help.ctx.dashboard.bullet.2':
    'Statistik perjalanan: negara yang dikunjungi, jumlah perjalanan, hari di perjalanan, dan jarak terbang dari semua perjalananmu.',
  'help.ctx.dashboard.bullet.3':
    'Kartu perjalanan, bisa disaring menurut “Direncanakan”, “Diarsipkan”, dan “Selesai”, dalam bentuk kisi atau daftar. Kotak pencarian di atasnya mencari di semua perjalananmu sekaligus, berdasarkan judul, tanggal, atau tempat dalam perjalanan. Tombol untuk mengedit, menduplikat, mengarsipkan, dan menghapus perjalanan ada di pojok kanan atas foto setiap kartu.',
  'help.ctx.dashboard.bullet.4':
    'Widget di sebelah kanan: konverter mata uang, “Koleksi” (jika addon Koleksi aktif), jam dunia, reservasi mendatang, dan widget dari plugin. Widget bawaan bisa dimatikan di “Pengaturan”, “Tampilan”.',
  'help.ctx.dashboard.bullet.5':
    'Kartu “Perjalanan Baru” dan tombol di pojok kanan bawah sama-sama untuk membuat perjalanan baru.',

  // create-trip
  'help.guide.create-trip.title': 'Buat perjalanan',
  'help.guide.create-trip.goal': 'Mulai perjalanan baru dengan nama, tanggal, dan foto sampul.',
  'help.guide.create-trip.step.1':
    'Klik “Perjalanan Baru”. Kartu di ujung daftar perjalananmu dan tombol di pojok kanan bawah fungsinya sama.',
  'help.guide.create-trip.step.2':
    'Beri nama perjalanannya. Hanya kolom ini yang wajib; sisanya bisa ditambahkan nanti.',
  'help.guide.create-trip.step.3':
    'Pilih tanggal mulai dan tanggal selesai. TREK membuat satu hari untuk setiap tanggal, jadi kamu bisa langsung mulai menyusun rencana perjalanan. Belum punya tanggal? Biarkan keduanya kosong dan isi “Jumlah Hari” saja.',
  'help.guide.create-trip.step.4':
    'Opsional: tambahkan foto sampul. Unggah foto sendiri, seret atau tempel foto, atau cari foto tujuanmu di Unsplash.',
  'help.guide.create-trip.step.5': 'Klik “Buat Perjalanan Baru”.',
  'help.guide.create-trip.result':
    'Perjalanan muncul di dasbor. Kalau ini perjalanan terdekatmu, perjalanan ini tampil di boarding pass di bagian atas.',
  'help.guide.create-trip.tip.1':
    'Tanggal bisa diubah nanti. Kalau sudah ada pemesanan, TREK akan menanyakan apakah pemesanan ikut dipindahkan bersama harinya.',
  'help.guide.create-trip.tip.2':
    'Semua biaya dikonversi ke mata uang perjalanan yang kamu pilih di sini. Pilih mata uang negara tujuan.',

  // edit-trip
  'help.guide.edit-trip.title': 'Edit perjalanan',
  'help.guide.edit-trip.goal': 'Ganti nama perjalanan, ubah tanggalnya, atau sesuaikan pengaturannya.',
  'help.guide.edit-trip.step.1': 'Klik ikon pensil di pojok kanan atas kartu perjalanan (atau boarding pass).',
  'help.guide.edit-trip.step.2':
    'Ubah yang perlu: nama, deskripsi, tanggal, sampul, mata uang, pengingat, atau teman perjalanan.',
  'help.guide.edit-trip.step.3': 'Klik “Perbarui”.',
  'help.guide.edit-trip.result': 'Kartu langsung diperbarui, bagi semua anggota perjalanan.',
  'help.guide.edit-trip.tip.1':
    'Jika kamu menggeser tanggal mulai perjalanan yang punya pemesanan, TREK bertanya apakah pemesanannya ikut digeser. Jika kamu memperpendek perjalanan, TREK mencantumkan hari-hari yang akan dihapus beserta rencananya. Perubahan baru tersimpan setelah kamu klik “Hapus hari dan simpan”.',

  // cover-image
  'help.guide.cover-image.title': 'Atur foto sampul',
  'help.guide.cover-image.goal': 'Beri perjalanan gambar yang tampil di kartunya dan di boarding pass.',
  'help.guide.cover-image.step.1': 'Buka formulir edit perjalanan lewat ikon pensil di kartunya.',
  'help.guide.cover-image.step.2':
    'Di bawah “Gambar Sampul”, jatuhkan atau tempel foto, klik untuk mengunggah foto, atau ketik tujuan lalu klik “Cari Unsplash”.',
  'help.guide.cover-image.step.3': 'Pilih foto, lalu klik “Perbarui”.',
  'help.guide.cover-image.result': 'Foto tersimpan di perjalanan dan tampil di mana pun perjalanan itu muncul.',
  'help.guide.cover-image.tip.1':
    'Foto dari pencarian Unsplash otomatis diberi kredit; foto unggahanmu sendiri tetap tersimpan di servermu.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Menduplikat perjalanan',
  'help.guide.duplicate-trip.goal': 'Pakai ulang perjalanan sebagai template untuk perjalanan baru.',
  'help.guide.duplicate-trip.step.1': 'Klik ikon duplikat di pojok kanan atas kartu.',
  'help.guide.duplicate-trip.step.2': 'Baca apa saja yang akan disalin dan yang tidak, lalu klik “Salin perjalanan”.',
  'help.guide.duplicate-trip.result':
    'Salinannya muncul di dasbormu, dengan nama aslinya diikuti (salinan). Kamu bisa mengganti nama dan tanggalnya.',
  'help.guide.duplicate-trip.tip.1':
    'Hari, tempat, tur dan rute perjalanan darat, reservasi, item anggaran, daftar bawaan, to-do, dan catatan hari ikut disalin; daftar bawaan dan to-do disalin tanpa centang. Anggota, obrolan, polling, file, dan tautan berbagi tidak ikut disalin.',

  // archive-trip
  'help.guide.archive-trip.title': 'Arsipkan dan pulihkan perjalanan',
  'help.guide.archive-trip.goal':
    'Keluarkan perjalanan dari daftar perjalananmu tanpa menghapusnya, lalu pulihkan nanti.',
  'help.guide.archive-trip.step.1': 'Klik ikon arsip di pojok kanan atas kartu.',
  'help.guide.archive-trip.step.2': 'Ubah filter di atas kartu ke “Diarsipkan” untuk melihatnya lagi.',
  'help.guide.archive-trip.step.3':
    'Klik “Pulihkan” pada kartu untuk mengembalikannya ke “Direncanakan”, atau ke “Selesai” jika tanggalnya sudah lewat.',
  'help.guide.archive-trip.result':
    'Perjalanan yang diarsipkan tetap menyimpan semua datanya, tetapi tidak lagi tampil di dasbor maupun di feed kalender semua perjalanan.',

  // delete-trip
  'help.guide.delete-trip.title': 'Menghapus perjalanan',
  'help.guide.delete-trip.goal': 'Hapus perjalanan secara permanen.',
  'help.guide.delete-trip.step.1': 'Klik ikon tempat sampah di pojok kanan atas kartu.',
  'help.guide.delete-trip.step.2':
    'Konfirmasi dengan “Hapus”. Dialog menyebutkan nama perjalanannya, jadi kamu tahu perjalanan yang dihapus sudah benar.',
  'help.guide.delete-trip.result':
    'Perjalanan beserta hari, tempat, pemesanan, dan file-nya dihapus. Ini tidak bisa dibatalkan, jadi arsipkan saja perjalanannya jika kamu ragu.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Cari perjalanan yang sudah selesai, ganti tampilan kisi dan daftar',
  'help.guide.filter-and-view.goal':
    'Lihat perjalanan yang sudah selesai atau diarsipkan, dan pilih tata letak yang kamu suka.',
  'help.guide.filter-and-view.step.1':
    'Pakai “Direncanakan”, “Diarsipkan”, dan “Selesai” di atas kartu. “Selesai” berisi semua perjalanan yang tanggal akhirnya sudah lewat.',
  'help.guide.filter-and-view.step.2':
    'Klik ikon daftar untuk beralih ke tampilan daftar ringkas. Klik lagi untuk kembali ke kisi.',
  'help.guide.filter-and-view.result': 'Dasbor mengingat tata letak pilihanmu di perangkat ini.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Berlangganan semua perjalanan di kalendermu',
  'help.guide.calendar-feed.goal':
    'Lihat hari dan pemesanan dari semua perjalanan aktif di aplikasi kalendermu, selalu tersinkron.',
  'help.guide.calendar-feed.step.1': 'Klik ikon kalender di samping pengalih tampilan.',
  'help.guide.calendar-feed.step.2': 'Klik “Aktifkan langganan kalender”. TREK membuat tautan feed pribadi.',
  'help.guide.calendar-feed.step.3':
    'Klik “Tambahkan ke Google Kalender” atau “Tambahkan ke Kalender Apple / Outlook”. Untuk aplikasi kalender lain, buka “Atau salin tautan secara manual” dan salin tautannya dari sana.',
  'help.guide.calendar-feed.result':
    'Setiap perjalanan aktif tampil di kalendermu dan diperbarui otomatis. Perjalanan yang diarsipkan dan yang sudah berakhir lebih dari 90 hari lalu tidak disertakan.',
  'help.guide.calendar-feed.tip.1':
    'Rahasiakan tautannya: siapa pun yang memilikinya bisa membaca feed itu. Jika tautan sampai ke orang lain, “Buat ulang” memberimu tautan baru dan tautan lama tidak berfungsi lagi. “Matikan” menghapus tautannya sepenuhnya.',

  // widgets
  'help.guide.widgets.title': 'Pilih widget dasbor',
  'help.guide.widgets.goal': 'Tampilkan atau sembunyikan baris statistik dan widget di sebelah kanan.',
  'help.guide.widgets.step.1': 'Buka menu avatar di pojok kanan atas, lalu pilih “Pengaturan”.',
  'help.guide.widgets.step.2': 'Beralih ke tab “Tampilan”.',
  'help.guide.widgets.step.3':
    'Di bawah “Widget dasbor”, aktifkan atau matikan setiap widget, terpisah untuk Desktop dan Seluler. Sidebar kanan mematikan seluruh kolom kanan sekaligus.',
  'help.guide.widgets.step.4': 'Kembali ke dasbor. Perubahannya langsung berlaku.',
  'help.guide.widgets.result':
    'Saat widget disembunyikan, perjalananmu mendapat ruang lebih luas. Matikan seluruh kolom kanan agar tata letaknya berada di tengah.',
  'help.guide.widgets.link': 'Buka pengaturan “Tampilan”',

  // currency-widget
  'help.guide.currency-widget.title': 'Konversi mata uang',
  'help.guide.currency-widget.goal': 'Konversi nominal antara dua mata uang dengan kurs terkini.',
  'help.guide.currency-widget.step.1': 'Ketik jumlahnya, lalu pilih dua mata uangnya.',
  'help.guide.currency-widget.step.2':
    'Panah di antara keduanya menukar pasangan mata uang; panah melingkar memperbarui kurs.',
  'help.guide.currency-widget.result': 'Pasangan mata uangmu disimpan di akun, jadi sama di semua perangkat.',
  'help.guide.currency-widget.tip.1':
    'Kurs berasal dari layanan gratis Frankfurter. Panah melingkar di sudut widget mengambil kurs terbaru.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Tambahkan jam dunia',
  'help.guide.timezones-widget.goal': 'Lihat waktu setempat di tempat tujuanmu.',
  'help.guide.timezones-widget.step.1':
    'Klik tanda + di widget “Zona waktu”, cari kota, misalnya Lisbon, lalu pilih dari daftar.',
  'help.guide.timezones-widget.step.2':
    'Untuk menghapus jam, arahkan kursor ke jam itu, lalu klik × yang muncul di sebelah kanan.',
  'help.guide.timezones-widget.result': 'Jam dunia yang kamu tambahkan tersimpan di akunmu.',
  'help.guide.search-trips.title': 'Cari perjalananmu',
  'help.guide.search-trips.goal':
    'Temukan perjalanan berdasarkan nama, tanggal, atau tempat yang kamu rencanakan di dalamnya, termasuk perjalanan yang diarsipkan.',
  'help.guide.search-trips.step.1':
    'Ketik di “Cari perjalanan atau tempat” di atas kartu. Daftar tersaring sambil kamu mengetik, mencakup perjalanan yang direncanakan, diarsipkan, dan selesai sekaligus.',
  'help.guide.search-trips.step.2':
    'Jika perjalanan cocok karena salah satu tempatnya, tempat itu ditampilkan di bawah judul perjalanan. Klik x di kotak, atau tekan Escape, untuk melihat semua perjalananmu lagi.',
  'help.guide.search-trips.result':
    'Dasbor hanya menampilkan perjalanan yang cocok. Kosongkan kotak pencarian untuk menampilkan semua perjalanan lagi.',
  'help.guide.search-trips.tip.1':
    'Kamu juga bisa mencari berdasarkan tanggal: ketik bulan dan tahun, misalnya Mei 2027, atau 2027-05, untuk menemukan perjalanan di bulan itu.',
  'help.guide.search-trips.tip.2':
    'Selama pencarian aktif, pengalih “Direncanakan”, “Diarsipkan”, dan “Selesai” tidak diterapkan, jadi tidak ada perjalanan yang tersembunyi karena filter yang salah.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay adalah perencana cuti pribadimu: berapa hari cuti yang kamu punya dalam setahun, mana yang sudah dicatat, dan berapa yang tersisa. Kisi menampilkan seluruh tahun. Sidebar berisi pemilih tahun, orang-orang yang merencanakan bersamamu, kalender yang dibagikan kepadamu, legenda, dan jatah cutimu.',
  'help.ctx.vacay.bullet.1':
    'Kisi tahunan: dua belas kartu bulan, satu sel per hari. Klik suatu hari untuk mencatat atau menghapusnya. Titik biru kecil menandai hari yang sudah tercakup oleh perjalanan.',
  'help.ctx.vacay.bullet.2':
    'Toolbar di bagian bawah: tombol pertama, dengan nama dan warnamu, untuk mencatat cuti; “Hari Libur Perusahaan” menandai hari libur untuk seluruh perusahaan. “Setengah hari” dan “Pengganti / Fleksi” mengubah apa yang dicatat saat kamu mengklik, dan “Setengah hari” juga berlaku untuk hari libur perusahaan.',
  'help.ctx.vacay.bullet.3':
    '“Jatah Cuti”: “Hari”, “Digunakan”, dan sisa untuk tahun yang dipilih, dengan cuti bawaan dari tahun lalu dan hari pengganti / fleksi di sampingnya. Klik judul kartu untuk melipatnya.',
  'help.ctx.vacay.bullet.4':
    '“Orang” adalah mereka yang berbagi rencana denganmu, masing-masing dengan warnanya sendiri. “Kalender yang Dibagikan” menampilkan hari libur orang lain sebagai lingkaran berwarna. Kamu tidak bisa mengeditnya.',
  'help.ctx.vacay.bullet.5':
    'Pengaturan mencakup akhir pekan, awal minggu, cuti bawaan dari tahun lalu, tahun cutimu, hari libur perusahaan, kalender hari libur nasional dan liburan sekolah, serta “Pisahkan Gabungan” selama kamu merencanakan bersama orang lain.',
  // log-day
  'help.guide.log-day.title': 'Catat hari cuti',
  'help.guide.log-day.goal': 'Tandai hari libur di kisi tahunan dan lihat saldo cutimu langsung diperbarui.',
  'help.guide.log-day.step.1':
    'Periksa tombol pertama di toolbar bawah. Jika tombol itu menampilkan nama dan warnamu, klik pada suatu hari akan mencatat hari cuti untukmu.',
  'help.guide.log-day.step.2':
    'Klik sebuah hari di kartu bulan mana saja. Hari itu terisi warnamu, dan “Digunakan” bertambah satu hari.',
  'help.guide.log-day.step.3': 'Klik hari yang sama lagi untuk menghapusnya.',
  'help.guide.log-day.result':
    'Hari itu tercatat. “Hari”, “Digunakan”, dan sisa cuti langsung diperbarui, dan semua orang yang tergabung dalam rencanamu langsung melihat perubahannya.',
  'help.guide.log-day.tip.1':
    'Akhir pekan tidak bisa dicatat selama “Blokir Akhir Pekan” aktif di “Pengaturan”. Hari akhir pekan yang sudah dicatat sebelumnya masih bisa dihapus.',
  'help.guide.log-day.tip.2':
    'Titik biru di sel berarti salah satu perjalananmu mencakup hari itu, jadi kamu bisa melihat di mana cuti dan perjalanan bertepatan.',
  // half-day
  'help.guide.half-day.title': 'Mencatat setengah hari',
  'help.guide.half-day.goal': 'Ambil libur sore hari dan pakai setengah hari saja dari jatah cutimu.',
  'help.guide.half-day.step.1':
    'Aktifkan “Setengah hari” di bilah alat. Titik oranyenya adalah penanda setengah hari di kisi.',
  'help.guide.half-day.step.2':
    'Klik sebuah hari. Hari itu dicatat sebagai 0,5 dan menampilkan titik oranye di pojoknya.',
  'help.guide.half-day.step.3':
    'Matikan lagi “Setengah hari” setelah selesai. Kalau kamu mengklik setengah hari yang pengaturannya berbeda, hari itu berubah mengikuti pengaturan saat ini.',
  'help.guide.half-day.result':
    '“Digunakan” bertambah 0,5. “Setengah hari” dan “Pengganti / Fleksi” tidak saling bergantung, jadi kamu juga bisa mencatat setengah hari pengganti.',
  'help.guide.half-day.tip.1':
    'Toolbar selalu menampilkan penanda yang akan dipasang oleh klikmu berikutnya, jadi kamu bisa memeriksanya sebelum mencatat.',
  // comp-day
  'help.guide.comp-day.title': 'Mencatat hari pengganti atau fleksi',
  'help.guide.comp-day.goal': 'Ambil libur pengganti tanpa memakai hari cuti.',
  'help.guide.comp-day.step.1':
    'Aktifkan “Pengganti / Fleksi” di bilah alat. Lingkaran berarsir adalah penanda hari pengganti di kisi.',
  'help.guide.comp-day.step.2': 'Klik sebuah hari. Hari itu terisi garis diagonal berwarna milikmu, bukan warna penuh.',
  'help.guide.comp-day.result':
    'Hari pengganti dihitung di samping kotak jatah cuti dan tidak pernah mengurangi “Sisa”.',
  'help.guide.comp-day.tip.1':
    'Pakai ini untuk lembur yang diganti libur, jam kerja fleksibel, atau hari libur pengganti: semua libur yang bukan cuti.',
  // entitlement
  'help.guide.entitlement.title': 'Mengatur jatah cuti',
  'help.guide.entitlement.goal': 'Beri tahu Vacay berapa hari cuti yang kamu punya dalam setahun.',
  'help.guide.entitlement.step.1':
    'Di kartu “Jatah Cuti” pada sidebar, klik kotak “Hari” di barismu. Jika kartunya terlipat, klik judulnya untuk membukanya.',
  'help.guide.entitlement.step.2':
    'Ketik jumlah harimu, lalu tekan Enter. Tekan Escape untuk tetap memakai nilai lama.',
  'help.guide.entitlement.result':
    '“Sisa” dihitung ulang dari jatah cutimu, sisa cuti yang dibawa, dan hari yang sudah kamu pakai.',
  'help.guide.entitlement.tip.1':
    'Setiap tahun punya jatah sendiri, jadi perubahan di sini hanya berlaku untuk tahun yang dipilih.',
  // years
  'help.guide.years.title': 'Tambah dan ganti tahun',
  'help.guide.years.goal': 'Rencanakan tahun depan dari sekarang, atau lihat lagi tahun lalu.',
  'help.guide.years.step.1':
    'Klik tanda + di kanan tahun untuk menambah tahun berikutnya, atau tanda + di kiri untuk tahun sebelumnya.',
  'help.guide.years.step.2': 'Berpindah antartahun dengan panah atau chip tahun di bawahnya.',
  'help.guide.years.step.3':
    'Untuk menghapus tahun, arahkan kursor ke chip-nya lalu klik tanda minus kecil. Semua entrinya juga ikut terhapus, jadi konfirmasi dengan hati-hati.',
  'help.guide.years.result':
    'Setiap tahun punya jatah dan catatannya sendiri. Sisa cuti yang dibawa menyambungkan satu tahun ke tahun berikutnya.',
  // company-holidays
  'help.guide.company-holidays.title': 'Tandai libur perusahaan',
  'help.guide.company-holidays.goal':
    'Blokir hari saat seluruh perusahaan libur, tanpa mengurangi jatah cuti siapa pun.',
  'help.guide.company-holidays.step.1':
    'Buka “Pengaturan” dan pastikan “Hari Libur Perusahaan” aktif. Pengaturan ini aktif secara default. Mode ini hanya muncul di bilah alat selama pengaturannya aktif.',
  'help.guide.company-holidays.step.2': 'Kembali ke kisi, alihkan toolbar ke “Hari Libur Perusahaan”.',
  'help.guide.company-holidays.step.3':
    'Klik hari-harinya. Hari itu berubah kuning dan muncul di legenda. Klik lagi untuk menghapusnya.',
  'help.guide.company-holidays.result':
    'Semua orang yang tergabung dalam rencana bisa melihat hari libur perusahaan, dan hari libur itu tidak pernah mengurangi sisa cuti.',
  'help.guide.company-holidays.tip.1':
    'Semua orang yang tergabung bisa mengedit hari libur perusahaan, jadi sepakati siapa yang mengelolanya.',
  // public-holidays
  'help.guide.public-holidays.title': 'Menampilkan hari libur nasional',
  'help.guide.public-holidays.goal': 'Tampilkan hari libur nasional negara atau wilayahmu di kisi.',
  'help.guide.public-holidays.step.1': 'Buka “Pengaturan” dan aktifkan “Hari Libur Nasional”.',
  'help.guide.public-holidays.step.2':
    'Klik “Tambah kalender”, lalu pilih negara dan, jika perlu, wilayahnya. Kamu juga bisa memberinya warna dan label. Lalu klik “Tambah”.',
  'help.guide.public-holidays.step.3': 'Tutup “Pengaturan”. Hari libur muncul di kisi dan di keterangan.',
  'help.guide.public-holidays.result':
    'Hari libur nasional ditandai dengan warna kalender dan tidak pernah mengurangi jatah cutimu.',
  'help.guide.public-holidays.tip.1':
    'Kamu bisa menambahkan beberapa kalender, misalnya kalender wilayahmu dan wilayah rekan yang tergabung.',
  // school-holidays
  'help.guide.school-holidays.title': 'Menampilkan liburan sekolah',
  'help.guide.school-holidays.goal': 'Lihat liburan sekolah di wilayahmu berdampingan dengan hari liburmu sendiri.',
  'help.guide.school-holidays.step.1': 'Buka “Pengaturan” dan aktifkan “Libur Sekolah”.',
  'help.guide.school-holidays.step.2':
    'Klik “Tambah kalender”, lalu pilih negaranya. Untuk negara yang kalendernya terbagi, pilih juga wilayah atau kelompoknya, lalu klik “Tambah”.',
  'help.guide.school-holidays.step.3':
    'Tutup “Pengaturan”. Liburan sekolah diarsir dengan warna kalendernya dan diberi bilah berwarna di sepanjang bagian bawah harinya.',
  'help.guide.school-holidays.result':
    'Libur sekolah hanya ditampilkan di kalender dan tidak pernah mengurangi jatah cuti siapa pun.',
  'help.guide.school-holidays.tip.1':
    'Wilayahmu tidak ada? Administrator bisa mengelola libur sekolah secara manual di “Admin”, “Personalisasi”, “Liburan sekolah”.',
  // weekends
  'help.guide.weekends.title': 'Blokir akhir pekan dan atur awal minggu',
  'help.guide.weekends.goal': 'Keluarkan akhir pekan dari hitungan dan mulai minggu di hari pilihanmu.',
  'help.guide.weekends.step.1': 'Buka “Pengaturan”.',
  'help.guide.weekends.step.2':
    'Aktifkan “Blokir Akhir Pekan”, lalu di bawah “Hari akhir pekan”, pilih hari-hari yang kamu anggap akhir pekan.',
  'help.guide.weekends.step.3': 'Di bawah “Awal minggu”, pilih “Sen” atau “Min”.',
  'help.guide.weekends.result': 'Hari yang diblokir tampil abu-abu di kisi dan tidak bisa tidak sengaja tercatat.',
  // leave-year
  'help.guide.leave-year.title': 'Atur tahun cutimu',
  'help.guide.leave-year.goal':
    'Hitung jatah cutimu berdasarkan tahun fiskal atau sejak tanggal mulai kerja, bukan dari Januari sampai Desember.',
  'help.guide.leave-year.step.1': 'Buka “Pengaturan” dan cari “Tahun cuti”.',
  'help.guide.leave-year.step.2':
    'Pilih “Kalender”, “Fiskal” (dengan bulan dan tanggal mulainya), atau “Tanggal masuk” (dengan tanggal kamu mulai bekerja).',
  'help.guide.leave-year.result':
    'Jatah cuti, hari yang digunakan, dan cuti bawaan dihitung untuk periode itu, dan kisi dimulai dari bulan pertamanya.',
  'help.guide.leave-year.tip.1':
    'Pengaturan ini bersifat pribadi: dalam rencana gabungan, setiap orang tetap punya tahun cuti dan angkanya sendiri.',
  // carry-over
  'help.guide.carry-over.title': 'Membawa sisa cuti ke tahun berikutnya',
  'help.guide.carry-over.goal': 'Pindahkan sisa cuti di akhir satu periode ke periode berikutnya.',
  'help.guide.carry-over.step.1': 'Buka “Pengaturan”.',
  'help.guide.carry-over.step.2': 'Aktifkan “Carry Over Cuti”.',
  'help.guide.carry-over.result':
    'Jumlah sisa cuti yang dibawa dihitung ulang di semua tahunmu dan ditampilkan di bawah jatah cuti.',
  'help.guide.carry-over.tip.1': 'Mematikannya mengembalikan semua saldo cuti bawaan ke nol.',
  // invite
  'help.guide.invite.title': 'Merencanakan bersama orang lain',
  'help.guide.invite.goal':
    'Gabungkan rencanamu dengan rencana pengguna TREK lain agar kalian berdua melihat hari libur masing-masing dalam satu kisi.',
  'help.guide.invite.step.1': 'Klik ikon orang di kartu “Orang”.',
  'help.guide.invite.step.2': 'Pilih penggunanya, lalu klik “Kirim Undangan”.',
  'help.guide.invite.step.3':
    'Orang itu mendapat notifikasi dan “Permintaan Penggabungan” saat berikutnya membuka Vacay. Sampai saat itu, undangannya tampil sebagai menunggu; arahkan kursor ke sana untuk membatalkannya.',
  'help.guide.invite.result':
    'Kedua rencana digabung: setiap orang punya warna sendiri, kalian bisa saling mencatatkan hari, dan semuanya tersinkron secara langsung.',
  'help.guide.invite.tip.1':
    'Untuk membatalkan penggabungan, klik “Pisahkan” di “Pengaturan”. Entri setiap orang kembali ke rencananya masing-masing.',
  'help.guide.invite.tip.2':
    'Kalau orang lain cukup melihat hari-harimu saja, bagikan kalendermu daripada menggabungkannya.',
  // share-calendar
  'help.guide.share-calendar.title': 'Bagikan kalendermu hanya untuk dilihat',
  'help.guide.share-calendar.goal': 'Izinkan orang lain melihat kapan kamu libur tanpa bisa mengubah rencanamu.',
  'help.guide.share-calendar.step.1': 'Klik ikon bagikan di kartu “Kalender yang Dibagikan”.',
  'help.guide.share-calendar.step.2': 'Pilih penggunanya, lalu klik “Bagikan”. Tidak perlu persetujuan.',
  'help.guide.share-calendar.step.3':
    'Kalender yang dibagikan kepadamu muncul di bagian atas kartu: klik salah satunya untuk menyembunyikan atau menampilkannya, atau arahkan kursor dan klik x untuk menghapusnya. Di bawah “Kamu berbagi dengan”, arahkan kursor ke sebuah nama, lalu klik “Berhenti berbagi”.',
  'help.guide.share-calendar.result':
    'Hari liburmu muncul sebagai lingkaran berwarna di kisi mereka. Mereka tidak bisa mengedit apa pun yang kamu bagikan.',
  'help.guide.share-calendar.tip.1':
    'Berbagi dan penggabungan tidak saling bergantung: kamu bisa bergabung dengan satu orang sekaligus berbagi dengan orang lain.',
  'help.guide.share-calendar.tip.2':
    'Arahkan kursor ke hari yang berlingkar untuk melihat siapa yang libur dan berapa lama.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas menunjukkan tempat-tempat yang pernah kamu kunjungi di peta dunia: setiap negara yang kamu datangi lewat perjalanan diberi warna, dan kamu bisa menambahkan sendiri negara yang kamu kunjungi sebelum memakai TREK. Perbesar peta untuk melihat wilayah, simpan bucket list tempat yang masih ingin kamu kunjungi, dan lihat angka-angkamu di panel kaca di bagian bawah.',
  'help.ctx.atlas.bullet.1':
    'Peta: setiap negara yang sudah dikunjungi punya warna tetapnya sendiri, negara yang direncanakan bergaris tepi putus-putus, negara di daftar impian berarsir diagonal, dan negara lainnya abu-abu. Arahkan kursor ke sebuah negara untuk melihat perjalanan, tempat, serta kunjungan pertama dan terakhirnya.',
  'help.ctx.atlas.bullet.2':
    'Pencarian di bagian atas: ketik negara atau tempat. Negara yang belum pernah kamu kunjungi membuka popup-nya. Untuk negara yang sudah pernah dikunjungi, kartunya muncul di panel. Jika kamu memilih tempat, peta membuka wilayahnya agar bisa kamu tandai.',
  'help.ctx.atlas.bullet.3':
    '“Tampilkan negara yang direncanakan”, di kanan atas: menampilkan negara-negara dari perjalananmu yang akan datang. Sakelar ini hanya muncul jika ada perjalanan seperti itu.',
  'help.ctx.atlas.bullet.4':
    'Panel di bagian bawah: tab “Statistik” berisi negara (beserta yang direncanakan di sebelahnya), wilayah, perjalanan, tempat, kota, hari, benua, rekor beruntunmu, dan perjalanan tahun ini; tab “Daftar Impian” berisi tempat yang masih ingin kamu kunjungi; dengan addon Tur, ada juga tab “Tur” berisi jarak dan tanjakan dari tur yang sudah kamu jalani.',
  'help.ctx.atlas.bullet.5':
    'Wilayah: saat kamu memperbesar peta, peta menampilkan negara bagian dan provinsi. Klik salah satunya untuk menandai, menghapus tanda, atau menambahkannya ke daftar impian.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: jika addon terhubung, panel di kiri statistik bisa menandai keinginan sebagai tercapai dan menambahkan negara dari rekamanmu. Semua ini hanya dilakukan setelah kamu konfirmasi.',
  // mark-country
  'help.guide.mark-country.title': 'Tandai negara sebagai sudah dikunjungi',
  'help.guide.mark-country.goal':
    'Tambahkan negara yang kamu kunjungi sebelum memakai TREK, supaya ikut tampil di peta dan terhitung.',
  'help.guide.mark-country.step.1': 'Ketik nama negara di kotak pencarian di bagian atas peta.',
  'help.guide.mark-country.step.2': 'Pilih dari daftar. Peta bergeser ke negara itu dan popup-nya terbuka.',
  'help.guide.mark-country.step.3': 'Pilih “Tandai sudah dikunjungi”.',
  'help.guide.mark-country.result':
    'Negara itu mendapat warna di peta dan hitungan “Negara” bertambah satu. Warnanya permanen: saat kamu menandai negara lain, warna negara-negara sebelumnya tidak berubah.',
  'help.guide.mark-country.tip.1':
    'Mengklik negara abu-abu di peta membuka popup yang sama. Untuk negara kecil, pencarian lebih andal.',
  'help.guide.mark-country.tip.2':
    'Negara yang kamu tandai sendiri selalu dihitung sudah dikunjungi, apa pun tanggal perjalanan ke sana.',
  // unmark-country
  'help.guide.unmark-country.title': 'Hapus tanda negara',
  'help.guide.unmark-country.goal': 'Hapus dari peta negara yang kamu tandai sendiri.',
  'help.guide.unmark-country.step.1':
    'Cari negara itu lalu pilih, atau klik negaranya di peta. Untuk negara yang kamu tandai sendiri, popup menanyakan apakah negara itu mau dihapus.',
  'help.guide.unmark-country.step.2': 'Konfirmasi dengan “Hapus”.',
  'help.guide.unmark-country.result': 'Negara itu kembali abu-abu dan tidak lagi dihitung.',
  'help.guide.unmark-country.tip.1':
    'Hanya negara yang kamu tandai secara manual yang bisa dihapus dengan cara ini. Negara yang punya perjalanan atau tempat tetap ditandai sampai perjalanan atau tempat itu dihapus. Untuk negara yang ditandai manual, “Hapus” juga ada di kartu detailnya di panel.',
  // country-details
  'help.guide.country-details.title': 'Lihat apa saja yang kamu lakukan di suatu negara',
  'help.guide.country-details.goal': 'Buka negara yang sudah dikunjungi dan lihat perjalanan yang membawamu ke sana.',
  'help.guide.country-details.step.1': 'Ketik negara yang pernah kamu kunjungi di kotak pencarian di bagian atas peta.',
  'help.guide.country-details.step.2':
    'Pilih negaranya. Peta berpindah ke sana, dan sebuah kartu muncul di panel bawah. Kartu itu menampilkan bendera negara, lencana untuk tempat, perjalanan, dan wilayah yang dikunjungi, serta chip untuk masing-masing dari tiga perjalanan pertamanya.',
  'help.guide.country-details.result': 'Klik chip perjalanan untuk membuka perjalanan itu di perencana.',
  'help.guide.country-details.tip.1':
    'Mengarahkan kursor ke negara di peta menampilkan angka yang sama, ditambah kunjungan pertama dan terakhir.',
  // planned-countries
  'help.guide.planned-countries.title': 'Menampilkan negara yang akan kamu kunjungi',
  'help.guide.planned-countries.goal':
    'Tampilkan negara-negara dari perjalananmu yang akan datang di peta tanpa menghitungnya sebagai sudah dikunjungi.',
  'help.guide.planned-countries.step.1':
    'Aktifkan “Tampilkan negara yang direncanakan” di kanan atas. Angka di sampingnya menunjukkan jumlah negara yang direncanakan.',
  'help.guide.planned-countries.step.2':
    'Cari negara yang direncanakan lalu pilih: panel menampilkan “Direncanakan” dan tooltip peta menunjukkan kapan kamu berangkat.',
  'help.guide.planned-countries.result':
    'Negara yang direncanakan tampil dengan garis tepi putus-putus, jadi tidak tertukar dengan negara yang sudah kamu kunjungi. Sakelarnya mengingat pilihanmu.',
  'help.guide.planned-countries.tip.1':
    'Negara terhitung sudah dikunjungi begitu perjalanan ke sana dimulai. Perjalanan yang sedang berlangsung juga dihitung. Perjalanan tanpa tanggal sama sekali tidak masuk statistik.',
  'help.guide.planned-countries.tip.2': 'Sakelar ini hanya ada selama kamu punya perjalanan mendatang.',
  // regions
  'help.guide.regions.title': 'Menandai wilayah',
  'help.guide.regions.goal':
    'Tandai negara bagian, provinsi, atau prefektur yang pernah kamu kunjungi, bukan hanya negaranya.',
  'help.guide.regions.step.1':
    'Perbesar peta ke suatu negara sampai batas negara bagian dan provinsinya terlihat. Jika kamu mencari negara itu lalu memilihnya, peta otomatis cukup dekat.',
  'help.guide.regions.step.2':
    'Klik sebuah wilayah. Saat kursor diarahkan ke wilayah, namanya muncul. Popup menampilkan wilayah dan negaranya.',
  'help.guide.regions.step.3': 'Pilih “Tandai sudah dikunjungi”.',
  'help.guide.regions.result':
    'Wilayah itu diberi warna negaranya. Menandai wilayah juga membuat negaranya terhitung sudah dikunjungi, kalau belum.',
  'help.guide.regions.tip.1':
    'Saat kamu mengklik wilayah yang sudah dikunjungi, muncul pilihan “Hapus”, entah wilayah itu kamu tandai sendiri atau ditambahkan karena ada tempat di sana.',
  'help.guide.regions.tip.2':
    'Wilayah yang berisi tempat nyata ditandai otomatis. Kamu tidak perlu melakukan apa pun untuk wilayah itu.',
  // search-place
  'help.guide.search-place.title': 'Mencari tempat dan menandai wilayahnya',
  'help.guide.search-place.goal':
    'Tandai Bavaria dengan mencari Munich, tanpa perlu tahu kota itu ada di wilayah mana.',
  'help.guide.search-place.step.1':
    'Ketik kota, landmark, atau alamat di kotak pencarian. Negara tampil lebih dulu; tempat yang cocok tampil di bawahnya di bagian “Tempat”.',
  'help.guide.search-place.step.2':
    'Pilih tempatnya. Peta berpindah ke sana dan menemukan wilayah tempat titik itu berada.',
  'help.guide.search-place.step.3':
    'Pilih “Tandai sudah dikunjungi” untuk wilayah itu, atau “Tambah ke bucket list” kalau kamu belum pernah ke sana.',
  'help.guide.search-place.result':
    'Wilayah itu ditandai, begitu juga negaranya. Untuk negara yang tidak punya data wilayah di paket peta, yang ditandai adalah negaranya.',
  'help.guide.search-place.tip.1':
    'Tempat diambil dari pencarian yang sama seperti di bagian lain TREK, jadi memakai penyedia yang diatur admin.',
  // bucket-country
  'help.guide.bucket-country.title': 'Masukkan negara ke bucket list',
  'help.guide.bucket-country.goal':
    'Simpan daftar negara impian di peta, terpisah dari negara yang sudah kamu kunjungi.',
  'help.guide.bucket-country.step.1': 'Cari negaranya lalu pilih, atau klik negara itu di peta.',
  'help.guide.bucket-country.step.2': 'Pilih “Tambah ke bucket list”.',
  'help.guide.bucket-country.step.3':
    'Pilih bulan dan tahun kalau kamu sudah tahu kapan, lalu konfirmasi dengan “Tambah ke bucket list”.',
  'help.guide.bucket-country.result':
    'Negara itu ditampilkan dengan garis diagonal dalam warna yang akan dipakainya setelah kamu kunjungi, dan muncul di tab “Daftar Impian” pada panel.',
  'help.guide.bucket-country.tip.1':
    'Popup yang sama menampilkan “Hapus dari bucket list” setelah negara itu masuk daftar.',
  'help.guide.bucket-country.tip.2':
    'Satu entri per tanggal target: negara yang sama bisa masuk daftar untuk dua bulan berbeda, tetapi tidak dua kali untuk bulan yang sama.',
  // bucket-place
  'help.guide.bucket-place.title': 'Menambahkan tempat ke daftar impian',
  'help.guide.bucket-place.goal':
    'Simpan kota, objek wisata, atau alamat yang ingin kamu kunjungi, lengkap dengan koordinat dan tanggal target.',
  'help.guide.bucket-place.step.1': 'Buka tab “Daftar Impian” di panel bawah.',
  'help.guide.bucket-place.step.2': 'Klik “Tambah tempat”.',
  'help.guide.bucket-place.step.3':
    'Ketik namanya lalu tekan tombol cari, kemudian pilih hasil yang cocok supaya tempat itu punya koordinat. Kamu juga bisa mengetik nama saja tanpa mencari.',
  'help.guide.bucket-place.step.4': 'Pilih bulan dan tahun kalau mau, lalu klik “Tambah”.',
  'help.guide.bucket-place.result':
    'Tempat itu muncul paling atas di daftar impianmu beserta tanggal targetnya. Arahkan kursor ke sana untuk memunculkan × yang menghapusnya.',
  'help.guide.bucket-place.tip.1':
    'Dawarich hanya bisa menandai keinginan sebagai tercapai kalau keinginan itu punya koordinat. Penandaan ini dilakukan begitu rekamanmu menunjukkan bahwa kamu pernah ke sana.',
  // stats
  'help.guide.stats.title': 'Membaca statistikmu',
  'help.guide.stats.goal': 'Pahami apa yang dihitung oleh angka-angka di panel, dan apa yang tidak.',
  'help.guide.stats.step.1':
    '“Negara” adalah jumlah negara berbeda yang benar-benar pernah kamu kunjungi. Negara yang direncanakan tampil di bawah angka itu dan tidak ikut dihitung. “Wilayah” menghitung negara bagian dan provinsi yang pernah kamu kunjungi. “Perjalanan”, “Tempat”, dan “Hari” adalah total dari semua perjalananmu. “Kota” dihitung dari alamat tempat-tempatmu, jadi angkanya perkiraan.',
  'help.guide.stats.step.2':
    'Benua menampilkan negara yang dikunjungi per benua. “Antarktika” baru muncul di baris itu setelah kamu pernah ke sana. Lalu ada rekor beruntunmu (tahun berturut-turut dengan setidaknya satu perjalanan) dan jumlah perjalananmu tahun ini.',
  'help.guide.stats.result':
    'Angkanya diperbarui otomatis selagi kamu merencanakan perjalanan. Tidak ada yang perlu kamu urus di sini.',
  'help.guide.stats.tip.1':
    'Kota diambil dari teks alamat, bukan dicari. Jadi alamat pendek seperti “Osteria Francescana, Italy”, atau yang diakhiri nama prefektur, bisa terhitung sebagai wilayah, bukan kota.',
  'help.guide.stats.tip.2':
    'Negara yang kamu tandai sendiri terhitung di “Negara” dan benua, tetapi tidak menambah jumlah perjalanan, tempat, atau hari.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Tambahkan negara dari rekamanmu',
  'help.guide.dawarich-countries.goal':
    'Pakai Dawarich untuk mengetahui negara mana saja yang kamu kunjungi selama setahun terakhir, lalu tambahkan yang kamu konfirmasi ke peta.',
  'help.guide.dawarich-countries.step.1':
    'Jika addon Dawarich terhubung, panel Dawarich dengan dua kotak muncul di bagian bawah peta, di kiri statistik. Klik “Negara”.',
  'help.guide.dawarich-countries.step.2':
    'Dialog terbuka di tab “Negara”. Klik “Cari negara”: TREK membaca negara dan kota yang tercakup rekamanmu dalam 12 bulan terakhir, sebulan demi sebulan, jadi butuh waktu sebentar. Setiap negara yang belum ada di Atlas-mu tercantum dengan benderanya, jumlah kotanya, dan nama kota pertamanya. Semua negara sudah tercentang; klik sebuah baris untuk mengecualikannya.',
  'help.guide.dawarich-countries.step.3':
    'Konfirmasi dengan tombol di kanan bawah, yang bertuliskan “Tambah 5 negara” saat lima baris dicentang. Dialog menunjukkan berapa negara yang ditambahkan. Begitu dialog ditutup, peta sudah diperbarui.',
  'help.guide.dawarich-countries.result':
    'Negara yang dikonfirmasi diberi warna di peta dan terhitung di “Negara”, dengan catatan berasal dari Dawarich. Negara yang kamu tandai sendiri tidak berubah.',
  'help.guide.dawarich-countries.tip.1':
    'Negara yang sudah tampil sebagai dikunjungi di Atlas, baik ditandai sendiri, dari perjalanan, maupun dari pemeriksaan sebelumnya, tidak diikutkan, jadi tanda buatanmu tidak pernah berubah. Negara yang sebelumnya kamu hapus dari Atlas akan ditambahkan lagi kalau kamu mengonfirmasinya di sini.',
  'help.guide.dawarich-countries.tip.2':
    'Kalau TREK tidak bisa mencocokkan nama negara, nama itu tetap dicantumkan di bawah baris-baris, tidak dibuang. “Periksa lagi” meminta data dari Dawarich sekali lagi. Catatan di bawah daftar menyebutkan bahwa yang diperiksa adalah 12 bulan terakhir. Periode ini tidak bisa diubah.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Mencoret keinginan berdasarkan rekamanmu',
  'help.guide.dawarich-wishes.goal':
    'Cari tahu tempat mana di daftar impianmu yang benar-benar sudah kamu datangi, lalu tandai beserta tanggal kamu sampai di sana.',
  'help.guide.dawarich-wishes.step.1':
    'Di panel Dawarich di bagian bawah peta, di kiri statistik, klik “Daftar keinginan”.',
  'help.guide.dawarich-wishes.step.2':
    'Dialog terbuka di tab “Daftar keinginan”. Klik “Periksa daftar keinginan”: TREK memeriksa rekamanmu untuk setiap entri yang punya koordinat. Keinginan yang sudah kamu capai muncul di daftar beserta seberapa dekat kamu ke sana, berapa lama kamu di sana, dan harinya, serta sudah dicentang secara default. Yang sudah kamu coret bertuliskan “Sudah dicoret”. Di bawah daftar, ada catatan yang menghitung entri tanpa koordinat sekaligus menampilkan aturannya: “Sebuah keinginan dianggap tercapai dalam radius 250 m dan setelah 20 menit di lokasi.”',
  'help.guide.dawarich-wishes.step.3':
    'Konfirmasi dengan tombol di kanan bawah, yang bertuliskan “Coret 2” saat dua baris dicentang. Lalu tutup dialog dan buka tab “Daftar Impian” di panel sebelahnya.',
  'help.guide.dawarich-wishes.result':
    'Setiap keinginan mendapat centang hijau dengan tanggal kunjungannya, bukan tanggal hari ini. Tooltip-nya bertuliskan “Dicoret dari rekaman Dawarich milikmu”. Klik tanggalnya untuk membatalkan.',
  'help.guide.dawarich-wishes.tip.1':
    'Sekadar lewat tidak dihitung: kamu harus berada dekat tempat itu dan tinggal di sana selama beberapa waktu. Kalau ada beberapa kunjungan yang memenuhi syarat, yang paling lama yang dipakai. Keinginan tanpa koordinat tidak bisa diperiksa, jadi tambahkan tempat lewat pencarian di “Tambah tempat”, bukan dengan nama saja.',
  'help.guide.dawarich-wishes.tip.2':
    'Satu kali pemeriksaan melihat maksimal 50 entri, dimulai dari yang belum dicoret. Jika ada lebih banyak, TREK memberi tahu. Keinginan yang sudah dicoret sebelumnya tetap memakai tanggalnya sendiri.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Koleksi',
  'help.ctx.collections.summary':
    '“Koleksi” adalah perpustakaanmu di luar perjalanan mana pun: daftar bernama berisi tempat yang kamu temukan dan ingin disimpan, masing-masing dengan status “Ide”, “Ingin ke sana”, atau “Dikunjungi”, dan, jika Tur aktif, tur-tur utuh yang kamu simpan dari perjalanan. Tempat dan tur disalin masuk dan keluar dari perjalanan, tidak pernah ditautkan, jadi daftar dan perjalanan tidak pernah saling mengubah.',
  'help.ctx.collections.bullet.1':
    'Kolom daftar di kiri menampilkan daftar milikmu, daftar yang dibagikan kepadamu, undangan yang belum kamu jawab, dan “Semua tersimpan”, yang menggabungkan isi semua daftar milikmu. “Daftar baru” dan impor file ada di bagian atas.',
  'help.ctx.collections.bullet.2':
    'Bagian atas daftar yang terbuka menampilkan warna, sampul, deskripsi, dan tautannya, para anggota, serta “Edit” (khusus pemilik), “Ekspor”, dan “Bagikan” di sebelah kanan. Pada daftar yang dibagikan kepadamu, tombol “Bagikan” bertuliskan “Dibagikan”.',
  'help.ctx.collections.bullet.3':
    'Baris filter di atas daftar tempat: tanda + untuk menambah tempat, dropdown Status, “Kategori”, “Peringkat”, dan “Urutkan”, ikon kotak centang untuk “Pilih”, serta ikon awan untuk “Impor dari perjalanan”. Filter label hanya muncul di baris ini jika peta tidak ditampilkan.',
  'help.ctx.collections.bullet.4':
    'Baris tempat: foto, nama dan alamat, label dan kategori, serta pil status di kanan. Sekali klik pada pil mengubahnya ke status berikutnya.',
  'help.ctx.collections.bullet.5':
    'Peta di sebelah kanan: satu pin untuk setiap tempat yang punya koordinat. Bar atasnya berisi “Perbesar peta” (“Tampilkan daftar” begitu peta tampil penuh), filter label dengan tombol untuk mengelola label, dan kotak “Cari tempat”. Klik pin untuk membuka tempat itu.',
  'help.ctx.collections.bullet.6':
    'Lembar detail: klik baris untuk melihat sampul, kategori, status, rating bintang, label, deskripsi, dan tautan. Ikon kamera di sampul untuk mengganti foto. Di bagian bawah ada “Edit”, “Salin ke perjalanan”, tombol navigasi, dan “Hapus dari daftar”.',
  // create-list
  'help.guide.create-list.title': 'Buat daftar',
  'help.guide.create-list.goal': 'Buat daftar baru dengan nama, warna, dan sampul, siap diisi tempat.',
  'help.guide.create-list.step.1': 'Klik “Daftar baru” di bagian atas panel samping daftar.',
  'help.guide.create-list.step.2':
    'Beri nama daftar dan pilih warna. Gambar sampul, deskripsi, dan tautan boleh dikosongkan, dan bisa ditambahkan nanti lewat “Edit”.',
  'help.guide.create-list.step.3': 'Klik “Buat”.',
  'help.guide.create-list.result':
    'Daftar terbuka dalam keadaan kosong, dengan “Tambah tempat” dan “Impor dari perjalanan” sebagai dua cara untuk mengisinya.',
  'help.guide.create-list.tip.1':
    'Sampulnya bisa berupa foto unggahanmu sendiri atau gambar hasil pencarian Unsplash di dialog yang sama.',
  // add-place
  'help.guide.add-place.title': 'Tambah tempat',
  'help.guide.add-place.goal':
    'Cari tempat dan simpan ke daftar yang sedang terbuka, lengkap dengan nama, kategori, status, dan catatan dalam satu langkah.',
  'help.guide.add-place.step.1':
    'Klik tanda + di awal baris filter di atas daftar tempat. Pada daftar yang masih kosong, klik “Tambah tempat” di tengah halaman.',
  'help.guide.add-place.step.2':
    'Ketik nama tempat di kolom pencarian lalu pilih salah satu hasil. Nama, alamat, dan koordinat terisi otomatis dari hasil itu.',
  'help.guide.add-place.step.3':
    'Atur status dan, kalau mau, kategori, deskripsi, dan tautan, lalu klik “Tambah”. Dialog tetap terbuka untuk tempat berikutnya. “Batal” menutupnya.',
  'help.guide.add-place.result': 'Tempat itu muncul di daftar dan, jika punya koordinat, sebagai pin di peta.',
  'help.guide.add-place.tip.1':
    'Dari dalam perjalanan, “Simpan ke Koleksi” di detail tempat atau di menu tempat memasukkan tempat perjalanan ke daftar tanpa keluar dari perjalanan.',
  'help.guide.add-place.tip.2':
    'Daftarnya harus milikmu atau daftar tempat kamu menjadi editor atau admin; tanda + tidak ada di “Semua tersimpan” atau di daftar yang hanya bisa kamu lihat.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Mengimpor tempat dari perjalanan',
  'help.guide.import-from-trip.goal':
    'Masukkan semua tempat dari satu perjalanan ke daftar sekaligus, tanpa perlu menyimpannya satu per satu.',
  'help.guide.import-from-trip.step.1':
    'Klik tombol impor berikon panah awan di baris filter. Di daftar yang masih kosong, tombol yang sama ada di samping “Tambah tempat”.',
  'help.guide.import-from-trip.step.2': 'Pilih salah satu perjalananmu.',
  'help.guide.import-from-trip.step.3':
    'Centang tempat yang kamu mau. Tempat yang sudah ada di daftar tampil redup. Tempat yang belum ada di hari mana pun dalam perjalanan langsung terpilih sejak awal. Jika semua tempat sudah ada di suatu hari, semua tempat baru yang terpilih. “Hanya yang baru” menyembunyikan tempat yang sudah ada di daftar.',
  'help.guide.import-from-trip.step.4': 'Klik “Impor”. Tombol selalu menunjukkan berapa tempat yang akan ditambahkan.',
  'help.guide.import-from-trip.result':
    'Tempat-tempat disalin ke daftar beserta nama, alamat, koordinat, deskripsi, dan kategorinya. Perjalanannya tidak berubah.',
  'help.guide.import-from-trip.tip.1':
    'TREK otomatis melewati tempat duplikat berdasarkan nama atau koordinat, jadi aman jika kamu mengimpor dua kali.',
  'help.guide.import-from-trip.tip.2':
    'Di daftar tempat sebuah perjalanan, mode pilih menawarkan “Simpan ke Koleksi” untuk menyimpan tempat-tempat pilihanmu sendiri.',
  // place-status
  'help.guide.place-status.title': 'Mengatur status tempat',
  'help.guide.place-status.goal':
    'Pantau mana yang masih ide, mana yang masuk daftar pilihan, dan ke mana saja kamu sudah pergi.',
  'help.guide.place-status.step.1':
    'Klik label status di ujung kanan baris tempat. “Ide” berubah menjadi “Ingin ke sana”.',
  'help.guide.place-status.step.2': 'Klik lagi untuk “Dikunjungi”, dan sekali lagi untuk kembali ke “Ide”.',
  'help.guide.place-status.result':
    'Pil dan warnanya langsung berubah, dan jumlah di filter status di atas daftar ikut diperbarui.',
  'help.guide.place-status.tip.1':
    'Status hanya ada di Koleksi. Saat tempat disalin ke perjalanan, statusnya tidak ikut disalin.',
  'help.guide.place-status.tip.2':
    'Dari sebuah perjalanan, “Simpan ke Koleksi” membuka “Simpan ke daftar” dengan pil status untuk setiap daftar yang berisi tempat itu, dan bar pilihan di panel tempat punya “Tandai dikunjungi di daftar Anda”.',
  // place-detail
  'help.guide.place-detail.title': 'Membuka tempat yang tersimpan',
  'help.guide.place-detail.goal':
    'Lihat semua informasi tentang sebuah tempat dan apa saja yang bisa kamu lakukan dengannya: edit, salin ke perjalanan, cari rute, hapus.',
  'help.guide.place-detail.step.1':
    'Klik baris tempat. Lembar detailnya terbuka di samping daftar, dan peta berpindah ke tempat itu.',
  'help.guide.place-detail.step.2':
    'Di bagian bawah ada “Edit”, “Salin ke perjalanan”, tombol navigasi yang membuka tempat itu di aplikasi peta, dan “Hapus dari daftar”. Ikon kamera di sampul mengganti foto otomatis dengan fotomu sendiri.',
  'help.guide.place-detail.result':
    'Dengan “Edit”, kamu bisa mengubah nama, kategori, label, alamat, koordinat, deskripsi, dan tautan langsung di panel itu.',
  'help.guide.place-detail.tip.1':
    'Sampul diambil otomatis jika tempat itu belum punya gambar sendiri. Foto unggahanmu bisa berformat JPG, PNG, GIF, WebP, atau HEIC hingga 20 MB. Ikon tempat sampah di samping kamera mengembalikan foto otomatis.',
  'help.guide.place-detail.tip.2':
    'Setiap anggota, termasuk kamu, bisa memberi rating bintang di bawah status; filter “Peringkat” di baris filter memakai rata-ratanya.',
  // labels
  'help.guide.labels.title': 'Kelompokkan tempat dengan label',
  'help.guide.labels.goal': 'Beri daftar label sendiri, misalnya nama daerah atau hari, selain kategori bersama.',
  'help.guide.labels.step.1':
    'Klik “Tambah label” di samping label-label di atas peta (“Kelola label” jika daftar sudah punya label). Jika peta tidak ditampilkan, tombolnya ada di ujung baris filter.',
  'help.guide.labels.step.2':
    'Ketik nama, pilih warna, lalu klik “Tambah label”. Di dialog yang sama, kamu bisa mengganti nama, mengubah warna, atau menghapus label yang sudah ada.',
  'help.guide.labels.step.3':
    'Aktifkan “Pilih”, centang tempatnya, lalu klik “Beri label” di bar pilihan. Pilih labelnya, lalu konfirmasi dengan “Beri label”. Untuk satu tempat saja, kamu juga bisa menambahkan label lewat “Edit” di lembar detailnya.',
  'help.guide.labels.step.4':
    'Klik satu atau beberapa label di atas peta agar hanya tempat yang punya salah satu label itu yang tampil, baik di daftar maupun di peta. Klik label sekali lagi untuk mengeluarkannya dari filter.',
  'help.guide.labels.result':
    'Tempat yang berlabel menampilkan labelnya di baris; filter label tersedia bagi semua anggota, termasuk peninjau.',
  'help.guide.labels.tip.1':
    'Label hanya berlaku di daftar tempat label itu dibuat. Jika kamu memindahkan tempat ke daftar lain, labelnya dihapus.',
  'help.guide.labels.tip.2': 'Mengelola dan memberi label memerlukan hak edit di daftar itu.',
  // filter-select
  'help.guide.filter-select.title': 'Filter dan pilih tempat',
  'help.guide.filter-select.goal': 'Filter daftar dan ubah banyak tempat sekaligus.',
  'help.guide.filter-select.step.1':
    'Pakai dropdown di baris filter: status, kategori, rating minimum, dan urutan. Status dan kategori menunjukkan berapa tempat yang cocok dengan setiap pilihan.',
  'help.guide.filter-select.step.2':
    'Klik ikon kotak centang, “Pilih”, setelah dropdown. Setiap baris mendapat kotak centang, dan bar pilihan muncul.',
  'help.guide.filter-select.step.3':
    'Centang tempat-tempatnya, atau pakai “Pilih semua” untuk semua tempat yang tampil di filter, lalu pilih “Beri label”, “Pindahkan ke daftar”, “Duplikat ke daftar”, “Salin ke perjalanan”, atau “Hapus”. Hanya pemilik atau admin daftar yang bisa memindahkan dan menghapus.',
  'help.guide.filter-select.result':
    'Tindakan berlaku untuk semua pilihan sekaligus. Tanda × di kanan menutup mode pilih.',
  'help.guide.filter-select.tip.1':
    '“Pilih semua” hanya memilih tempat yang cocok dengan filter. Untuk memproses semua tempat “Ingin ke sana”, filter ke “Ingin ke sana” lalu klik “Pilih semua”.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Menyalin tempat ke perjalanan',
  'help.guide.copy-to-trip.goal': 'Tambahkan tempat-tempat tersimpan sebagai perhentian di salah satu perjalananmu.',
  'help.guide.copy-to-trip.step.1':
    'Aktifkan “Pilih” dan centang tempat-tempatnya, atau buka satu tempat lalu pakai “Salin ke perjalanan” di lembar detailnya.',
  'help.guide.copy-to-trip.step.2': 'Klik “Salin ke perjalanan” di bilah pilihan.',
  'help.guide.copy-to-trip.step.3': 'Pilih perjalanannya. Pakai kotak pencarian untuk menyaring daftar yang panjang.',
  'help.guide.copy-to-trip.result':
    'Tempat-tempat ditambahkan ke daftar tempat perjalanan itu lengkap dengan nama, deskripsi, kategori, catatan, harga, koordinat, foto, dan tag. Tidak ada yang berubah di koleksi.',
  'help.guide.copy-to-trip.tip.1':
    'Peninjau daftar yang dibagikan juga bisa melakukan ini. Tempat-tempatnya disalin dari daftar tanpa mengubah daftarnya.',
  // share-list
  'help.guide.share-list.title': 'Membagikan daftar kepada orang lain',
  'help.guide.share-list.goal': 'Rencanakan daftar bersama orang lain di TREK ini, secara langsung.',
  'help.guide.share-list.step.1': 'Klik “Bagikan” di bagian atas daftarmu.',
  'help.guide.share-list.step.2': 'Pilih pengguna dan perannya: “Peninjau”, “Editor”, atau “Admin”.',
  'help.guide.share-list.step.3':
    'Klik “Kirim undangan”. Orang itu tampil dengan status menunggu sampai dia menerima undangan di rel daftarnya atau dari notifikasinya.',
  'help.guide.share-list.result':
    'Setelah undangan diterima, daftar muncul di “Dibagikan” milik mereka, dan setiap perubahan tersinkron secara langsung. Kamu tetap bisa mengubah anggota dan perannya di dialog yang sama.',
  'help.guide.share-list.tip.1':
    '“Peninjau” bisa melihat, memberi rating, dan menyalin tempat ke perjalanan mereka sendiri. Editor bisa menambah dan mengedit tempat serta label. Admin juga bisa memindahkan dan menghapus.',
  'help.guide.share-list.tip.2':
    'Hanya pemilik yang bisa mengundang dan mengeluarkan orang. Anggota bisa keluar sendiri dari daftar yang dibagikan.',
  // export-list
  'help.guide.export-list.title': 'Ekspor daftar sebagai file',
  'help.guide.export-list.goal': 'Berikan daftar kepada pengguna di server TREK lain, atau buka di aplikasi peta.',
  'help.guide.export-list.step.1': 'Klik “Ekspor” di bagian atas daftar.',
  'help.guide.export-list.step.2':
    'Pilih “Daftar TREK” untuk memakai daftar itu di TREK lain, lengkap dengan label dan status, atau GPX untuk OsmAnd, Organic Maps, Garmin, dan aplikasi lain yang bisa membaca waypoint.',
  'help.guide.export-list.result': 'File akan diunduh. Semua anggota daftar yang dibagikan boleh mengekspornya.',
  'help.guide.export-list.tip.1':
    'Tempat tanpa koordinat tidak bisa dijadikan waypoint GPX. Tempat itu dilewati dan TREK memberi tahu berapa jumlahnya.',
  'help.guide.export-list.tip.2':
    'Rating, anggota, dan foto yang diunggah memang sengaja tidak diekspor, karena semua itu milik TREK ini, bukan milik daftarnya.',
  // import-file
  'help.guide.import-file.title': 'Impor daftar dari file',
  'help.guide.import-file.goal':
    'Impor file daftar TREK atau file GPX, sebagai daftar baru atau ke daftar yang sudah ada.',
  'help.guide.import-file.step.1': 'Klik tombol impor berikon panah unggah di samping “Daftar baru” di rel daftar.',
  'help.guide.import-file.step.2':
    'Pilih filenya. Sebelum mengimpor apa pun, TREK menampilkan isi file itu: nama, jumlah tempat, dan jumlah label.',
  'help.guide.import-file.step.3':
    'Biarkan “Daftar baru” dan ganti namanya jika perlu, lalu klik “Impor”. Atau pilih “Tambahkan ke daftar” untuk memasukkan tempat ke daftar yang bisa kamu edit, lalu klik “Tambahkan ke daftar”.',
  'help.guide.import-file.result':
    'Daftar terbuka dengan tempat-tempat yang diimpor. Impor ke daftar hanya menambahkan tempat. Tempat yang sudah ada tetap dengan status, catatan, dan labelnya.',
  'help.guide.import-file.tip.1':
    'Dari file GPX, setiap waypoint yang punya nama menjadi tempat. Track berupa garis sehingga dilewati, dan pratinjau menunjukkan berapa titik yang dilewati.',
  'help.guide.import-file.tip.2':
    'File yang bukan daftar TREK maupun GPX akan ditolak, dan TREK menampilkan alasannya. Kalau ada satu tempat yang tidak bisa dibaca, hanya tempat itu yang dilewati, bukan seluruh file.',
  // edit-list
  'help.guide.edit-list.title': 'Edit atau hapus daftar',
  'help.guide.edit-list.goal': 'Ubah nama, warna, sampul, deskripsi, atau tautan daftar, atau hapus daftarnya.',
  'help.guide.edit-list.step.1': 'Klik “Edit” di bagian atas daftar. Hanya pemilik yang melihat tombol ini.',
  'help.guide.edit-list.step.2':
    'Ubah apa saja yang kamu mau, lalu klik “Simpan”. Ikon tempat sampah di kiri bawah, “Hapus daftar”, menghapus daftar beserta semua tempatnya setelah kamu konfirmasi.',
  'help.guide.edit-list.result': 'Header di bagian atas langsung menampilkan warna, sampul, dan deskripsi yang baru.',
  'help.guide.edit-list.tip.1':
    'Menghapus daftar tidak bisa dibatalkan. Ekspor dulu jika kamu ingin menyimpan salinannya.',
  // all-saved
  'help.guide.all-saved.title': 'Cari di seluruh koleksimu',
  'help.guide.all-saved.goal': 'Lihat tempat dari semua daftar milikmu sekaligus.',
  'help.guide.all-saved.step.1':
    'Klik “Semua tersimpan” di rel daftar. Di sana tampil tempat-tempat dari semua daftar yang kamu miliki atau miliki bersama, dalam satu tampilan.',
  'help.guide.all-saved.step.2':
    'Ketik di “Cari tempat” di atas peta dan pakai filternya seperti di daftar lain. “Pilih” juga bisa dipakai di sini: pindahkan, duplikat, salin ke perjalanan, atau hapus tempat dari berbagai daftar sekaligus.',
  'help.guide.all-saved.result':
    'Tampilan ini menampilkan semua tempat tersimpanmu sekaligus. Di sini kamu tidak bisa menambah atau mengimpor tempat, karena tidak ada satu daftar tertentu untuk menampungnya.',
  'help.guide.all-saved.tip.1':
    'Label dan tur yang disimpan hanya berlaku di satu daftar, jadi keduanya tidak tersedia di “Semua tersimpan”.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Jurnal perjalanan',
  'help.ctx.journey.summary':
    'Journey adalah jurnal perjalananmu yang berfokus pada foto. Setiap journey ditautkan ke satu perjalanan atau lebih, dan kamu mengisinya hari demi hari dengan entri berisi cerita, foto, suasana hati, dan cuaca. Layar ini mencantumkan journey-mu; buka salah satunya untuk mulai menulis.',
  'help.ctx.journey.bullet.1':
    'Banner di bagian atas menampilkan journey yang sedang berjalan, atau yang terakhir, beserta jumlah entri, foto, dan tempatnya. “Lanjutkan menulis” membukanya di hari ini. Jika sebuah perjalanan baru saja selesai, banner “Perjalanan baru saja selesai” di atasnya menawarkan untuk menjadikan perjalanan itu sebuah journey.',
  'help.ctx.journey.bullet.2':
    'Di bawah “Semua Journey” ada satu kartu untuk setiap journey, lengkap dengan sampul, status, tanggal, dan jumlahnya; journey yang tampil di banner tidak muncul lagi di sana. Klik kartu untuk membukanya.',
  'help.ctx.journey.bullet.3':
    'Kartu terakhir di kisi, “Buat Journey baru”, memulai journey dari perjalanan-perjalananmu.',
  // create-journey
  'help.guide.create-journey.title': 'Buat journey',
  'help.guide.create-journey.goal':
    'Mulai jurnal untuk sebuah perjalanan, dengan tempat-tempat perjalanan itu sudah ditambahkan sebagai saran.',
  'help.guide.create-journey.step.1': 'Klik “Buat Journey baru”, kartu terakhir di kisi.',
  'help.guide.create-journey.step.2':
    'Beri nama dan, kalau mau, subjudul, lalu centang perjalanan yang terkait. Penghitung menunjukkan berapa tempat yang akan ditambahkan.',
  'help.guide.create-journey.step.3': 'Klik “Buat Journey”.',
  'help.guide.create-journey.result':
    'Jurnal terbuka. Setiap tempat dari perjalanan yang ditautkan muncul di linimasa sebagai saran, satu kali untuk setiap hari tempat itu direncanakan. Kamu bisa menulis catatan untuk masing-masing.',
  'help.guide.create-journey.tip.1': 'Perjalanan lain bisa ditautkan nanti dari “Pengaturan Journey”.',
  'help.guide.create-journey.tip.2': 'Journey tanpa perjalanan juga bisa; kamu lalu menambahkan entri secara manual.',
  // open-journey
  'help.guide.open-journey.title': 'Buka journey',
  'help.guide.open-journey.goal': 'Buka jurnal dan lihat di halaman mana jurnal itu terbuka.',
  'help.guide.open-journey.step.1':
    'Klik sebuah kartu. Setiap kartu menampilkan sampul, tanggal, serta jumlah catatan, foto, dan tempat dalam journey itu.',
  'help.guide.open-journey.result':
    'Journey yang sedang berlangsung terbuka di hari ini, atau di entri terakhir sebelum hari ini jika belum ada yang ditulis untuk hari ini. Journey yang sudah selesai terbuka dari awal.',
  'help.guide.open-journey.tip.1':
    'Sampulnya adalah foto pertama journey, kecuali kamu memilih sampul di “Pengaturan Journey”.',
  // continue-writing
  'help.guide.continue-writing.title': 'Melanjutkan journey yang sedang berjalan',
  'help.guide.continue-writing.goal': 'Langsung buka halaman hari ini dari journey yang sedang kamu jalani.',
  'help.guide.continue-writing.step.1':
    'Klik “Lanjutkan menulis” di banner bagian atas. Banner ini menampilkan journey yang sedang berlangsung, atau yang terbaru kalau tidak ada yang sedang berlangsung.',
  'help.guide.continue-writing.result':
    'Jurnal terbuka di hari ini, atau di catatan terakhir sebelum hari ini kalau belum ada yang ditulis.',
  'help.guide.continue-writing.tip.1':
    'Jika sebuah perjalanan baru saja selesai, banner “Perjalanan baru saja selesai” tampil di atas banner ini: “Buat Journey” memulai journey dengan perjalanan itu sudah tercentang, dan “Tutup” menyembunyikan tawaran itu di browser ini.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Jurnal',
  'help.ctx.journey-detail.summary':
    'Satu journey yang terbuka: linimasa di kiri, hari demi hari, dan peta di kanan dengan lapisan yang bisa dinyalakan atau dimatikan untuk rencana, rekamanmu, entri, dan foto. Header menampilkan jumlah-jumlahnya, Studio, sakelar saran, dan ⋯ untuk “Pengaturan Journey”. Pakai toolbar di bawahnya untuk menambahkan entri.',
  'help.ctx.journey-detail.bullet.1':
    'Header: panah kembali dan lencana status, sampul, judul dan subjudul, jumlah hari, tempat, entri, dan foto, lalu di kanan ada Studio, ikon mata untuk menyembunyikan atau menampilkan saran, dan ⋯ untuk “Pengaturan Journey”.',
  'help.ctx.journey-detail.bullet.2':
    'Toolbar: tab “Linimasa” dan “Galeri”, “Cari di perjalanan ini”, dan “Tambah Entri”. Di “Galeri”, “Unggah” menggantikan “Tambah Entri”.',
  'help.ctx.journey-detail.bullet.3':
    '“Linimasa”: satu bagian per hari dengan nomornya, jumlah tempat, dan tanda + untuk menambah entri di hari itu. Di bawahnya ada kartu entri dengan foto, suasana hati, cuaca, dan cerita, serta kartu saran bertepi putus-putus dari perjalanan, masing-masing dengan × untuk mengabaikannya.',
  'help.ctx.journey-detail.bullet.4':
    'Peta: bar lapisan di bagian atasnya menyalakan atau mematikan “Rencana” (pin berongga dan rute GPX perjalanan berupa garis putus-putus), “Terekam” (rute utuh yang disimpan dari Dawarich), “Entri” (pin berwarna sesuai hari, dihubungkan sesuai urutan tanggal dengan garis putus-putus tipis), dan “Foto”. (i) di sampingnya menjelaskan setiap simbol.',
  'help.ctx.journey-detail.bullet.5':
    '“Pengaturan Journey” (⋯): sampul, nama dan subjudul, status, jejak GPX, hari yang terekam, tempat dari foto, kolom entri, saran yang diabaikan, perjalanan yang tersinkron, kontributor dan anggota perjalanan mana yang mendapat akses, berbagi publik, arsipkan, dan hapus.',
  'help.ctx.journey-detail.bullet.6':
    'Di bagian bawah linimasa yang panjang ada “Kembali ke atas”, hitungan hari untuk melompat ke hari atau entri mana pun, dan “Ke entri terakhir”.',
  // add-entry
  'help.guide.add-entry.title': 'Menulis entri',
  'help.guide.add-entry.goal': 'Tambahkan cerita suatu hari dengan judul, teks, suasana hati, dan cuaca.',
  'help.guide.add-entry.step.1':
    'Klik “Tambah Entri” di toolbar, atau tanda + di ujung kanan header hari untuk memulai di hari itu.',
  'help.guide.add-entry.step.2':
    'Beri judul entri dan tulis ceritanya. Toolbar di atas teks menambahkan huruf tebal, miring, judul, kutipan, tautan, dan daftar dalam format Markdown.',
  'help.guide.add-entry.step.3':
    'Di kolom kanan, periksa tanggal dan jam, cari lokasi atau pakai posisimu saat ini, lalu pilih suasana hati dan cuacanya.',
  'help.guide.add-entry.step.4': 'Klik “Simpan”.',
  'help.guide.add-entry.result':
    'Catatan muncul di harinya pada linimasa dan sebagai pin di peta. Jumlah di header ikut diperbarui.',
  'help.guide.add-entry.tip.1':
    'Saat menulis dari sebuah saran, kamu memakai editor yang sama, dengan tempat yang sudah terisi.',
  'help.guide.add-entry.tip.2':
    'Entri yang punya tempat memiliki pilihan “Kecualikan dari rute”: entrinya tetap ada di jurnal, tapi tidak dihitung dalam jarak atau negara dan tidak ditampilkan di peta di Studio.',
  // entry-photos
  'help.guide.entry-photos.title': 'Tambahkan foto dan video ke catatan',
  'help.guide.entry-photos.goal': 'Tambahkan foto ke suatu hari; foto pertama menjadi sampul entri.',
  'help.guide.entry-photos.step.1': 'Buka menu entri lewat ⋯ di kartunya, lalu pilih “Edit”.',
  'help.guide.entry-photos.step.2':
    'Klik “Unggah foto”, lalu pilih filenya. “Dari Galeri” mengambil gambar yang sudah ada di galeri journey; External photos mencari di pustaka Immich atau Synology yang terhubung untuk hari itu.',
  'help.guide.entry-photos.step.3':
    'Arahkan kursor ke foto dan klik “Jadikan ke-1” untuk memilih sampul, lalu klik “Simpan”.',
  'help.guide.entry-photos.result':
    'Foto tampil di kartu dan di galeri. Foto pertama menjadi thumbnail di semua tempat.',
  'help.guide.entry-photos.tip.1':
    'Video ditambahkan ke catatan dengan cara yang sama: mp4, m4v, webm, atau mov hingga 500 MB. Video disimpan tanpa diubah.',
  'help.guide.entry-photos.tip.2':
    'File HEIC dari iPhone dikonversi ke JPEG saat diunggah, sehingga metadata GPS dan kameranya terhapus.',
  // suggestions
  'help.guide.suggestions.title': 'Memakai atau mengabaikan saran',
  'help.guide.suggestions.goal':
    'Jadikan tempat-tempat dari perjalananmu sebagai entri, dan abaikan yang tidak akan kamu tulis.',
  'help.guide.suggestions.step.1':
    'Saran berupa kartu bertepi putus-putus dengan tombol “Tambah Entri”: tempat dari perjalanan yang ditautkan, di hari tempat itu direncanakan. Klik untuk membuka editor dengan tempat dan hari yang sudah terisi.',
  'help.guide.suggestions.step.2':
    'Klik × di ujung kanan kartu yang tidak akan kamu pakai. Kartu itu hilang dari linimasa tapi tidak dihapus, dan sinkronisasi perjalanan tidak akan menyarankannya lagi.',
  'help.guide.suggestions.step.3':
    'Berubah pikiran? Buka “Pengaturan Journey” lewat ⋯ di header: “Kembalikan saran yang diabaikan” menunjukkan jumlahnya dan mengembalikan semuanya.',
  'help.guide.suggestions.result':
    'Linimasa hanya berisi entri yang memang ingin kamu tulis. Ikon mata di header menyembunyikan semua saran sekaligus selama kamu membaca.',
  'help.guide.suggestions.tip.1': 'Tempat yang direncanakan di dua hari memberi saran di masing-masing hari itu.',
  'help.guide.suggestions.tip.2': 'Saran tidak pernah masuk statistik. Hanya catatan yang sudah ditulis yang dihitung.',
  // add-on-day
  'help.guide.add-on-day.title': 'Tambah catatan di hari sebelumnya',
  'help.guide.add-on-day.goal': 'Tulis tentang hari yang sudah lewat tanpa perlu mengubah tanggalnya setelahnya.',
  'help.guide.add-on-day.step.1': 'Klik tanda + di ujung kanan header hari itu.',
  'help.guide.add-on-day.step.2': 'Editor terbuka dengan tanggal itu sudah terisi. Tulis lalu “Simpan” seperti biasa.',
  'help.guide.add-on-day.result': 'Entri langsung ditambahkan ke hari yang tepat.',
  'help.guide.add-on-day.tip.1':
    'Untuk mengubah urutan dalam satu hari, arahkan kursor ke entri: “Pindah ke atas” dan “Pindah ke bawah” muncul di sebelah kirinya.',
  // pros-cons
  'help.guide.pros-cons.title': 'Menambahkan penilaian akhir',
  'help.guide.pros-cons.goal': 'Rangkum suatu hari dengan apa yang menyenangkan dan apa yang tidak.',
  'help.guide.pros-cons.step.1':
    'Di editor, cari “Pro & Kontra” di bawah cerita. Ketik satu poin di “Pro” atau “Kontra”, lalu pakai “Tambah lagi” untuk poin berikutnya.',
  'help.guide.pros-cons.step.2':
    'Simpan. Pada kartu, “Tampilkan lebih banyak” membuka cerita dan penilaian akhir sebagai dua daftar singkat.',
  'help.guide.pros-cons.result':
    'Jempol ke atas dan jempol ke bawah muncul di bawah cerita, jadi mudah dilihat sekilas.',
  'help.guide.pros-cons.tip.1':
    'Kalau sebuah journey tidak butuh penilaian, kamu bisa mematikan bagian ini di “Bidang catatan” pada “Pengaturan Journey”.',
  // search-journey
  'help.guide.search-journey.title': 'Cari sesuatu di jurnal yang panjang',
  'help.guide.search-journey.goal': 'Temukan entri tanpa harus menggulir entri berminggu-minggu.',
  'help.guide.search-journey.step.1':
    'Ketik di “Cari di perjalanan ini” di toolbar. Linimasa tersaring sambil kamu mengetik, mencakup judul, cerita, tempat, dan tag. Aksen dan huruf besar-kecil tidak berpengaruh.',
  'help.guide.search-journey.step.2':
    'Untuk langsung ke suatu hari, klik hitungan hari di bagian bawah linimasa, di antara “Kembali ke atas” dan “Ke entri terakhir”.',
  'help.guide.search-journey.result':
    'Linimasa menggulir ke hari atau entri yang kamu pilih, dan peta ikut berpindah ke sana. Hanya entri yang cocok yang tampil sampai kamu mengosongkan kotak pencarian.',
  'help.guide.search-journey.tip.1':
    'Journey yang sedang berjalan terbuka di halaman hari ini, jadi halaman terkini biasanya sudah terlihat.',
  'help.guide.search-journey.tip.2':
    'Ikon mata di header menyembunyikan saran, jadi yang tampil hanya entri yang kamu tulis.',
  // gallery-map
  'help.guide.gallery-map.title': 'Jelajahi galeri dan peta',
  'help.guide.gallery-map.goal': 'Lihat seluruh journey dalam bentuk foto, dan sebagai tempat di peta.',
  'help.guide.gallery-map.step.1':
    'Beralih ke “Galeri” di bilah alat. Di sini tampil semua foto dari semua catatan, ditambah gambar yang diunggah langsung ke galeri. Klik salah satunya untuk membukanya dalam tampilan besar.',
  'help.guide.gallery-map.step.2':
    '“Unggah” di sebelah kanan menambahkan gambar ke galeri. Jika Immich atau Synology terhubung, tombol dengan nama pustakanya bisa kamu pakai untuk memilih gambar dari sana.',
  'help.guide.gallery-map.result':
    'Pin berwarna sesuai harinya dan dihubungkan sesuai urutan tanggal dengan garis putus-putus tipis. Bar lapisan di bagian atas peta mengatur apa yang ditampilkan.',
  'help.guide.gallery-map.tip.1':
    'Jejak GPX perjalanan tampil sebagai garis putus-putus di lapisan “Rencana” pada peta. “Tampilkan semua jalur GPX perjalanan” di “Pengaturan Journey” untuk mematikannya.',
  'help.guide.gallery-map.tip.2':
    'Foto galeri yang punya lokasi juga muncul di peta publik, kalau “Galeri” dan “Peta” sama-sama dibagikan.',
  // entry-fields
  'help.guide.entry-fields.title': 'Mematikan kolom entri',
  'help.guide.entry-fields.goal': 'Tampilkan di editor hanya kolom-kolom yang dipakai journey ini.',
  'help.guide.entry-fields.step.1': 'Klik ⋯ di kanan atas header untuk membuka “Pengaturan Journey”.',
  'help.guide.entry-fields.step.2':
    'Di bawah “Bidang catatan”, matikan “Suasana Hati”, “Cuaca”, atau “Kelebihan & kekurangan”.',
  'help.guide.entry-fields.result':
    'Editor tidak lagi menampilkan bidang ini. Tulisanmu tidak hilang: saat bidang diaktifkan lagi, isinya yang tersimpan tampil kembali. Journey yang dibagikan juga menyembunyikan bidang yang sama.',
  'help.guide.entry-fields.tip.1':
    'Sakelarnya berlaku per journey, jadi perjalanan dinas dan liburan bisa diatur berbeda.',
  // link-trip
  'help.guide.link-trip.title': 'Tautkan perjalanan lain',
  'help.guide.link-trip.goal': 'Tambahkan tempat dari perjalanan kedua ke jurnal sebagai saran.',
  'help.guide.link-trip.step.1': 'Klik ⋯ di kanan atas header untuk membuka “Pengaturan Journey”.',
  'help.guide.link-trip.step.2': 'Di bawah “Perjalanan Tersinkron”, klik “Tambah Perjalanan”.',
  'help.guide.link-trip.step.3': 'Cari perjalanannya berdasarkan nama atau tujuan, lalu klik “Tautkan” di sampingnya.',
  'help.guide.link-trip.result':
    'Tempat-tempatnya muncul di linimasa sebagai saran pada harinya masing-masing, dan ditambahkan ke lapisan “Rencana” di peta beserta jejak GPX-nya.',
  'help.guide.link-trip.tip.1':
    'Ikon tempat sampah di samping perjalanan yang ditautkan melepas tautannya setelah konfirmasi; entri yang sudah kamu tulis tetap ada.',
  'help.guide.link-trip.tip.2':
    'Entri di suatu hari hanya dihitung sekali, berapa pun banyaknya perjalanan yang mencakup hari itu.',
  // share-public
  'help.guide.share-public.title': 'Bagikan journey secara publik',
  'help.guide.share-public.goal': 'Beri orang yang tidak punya akun TREK tautan yang hanya bisa dibaca.',
  'help.guide.share-public.step.1': 'Buka “Pengaturan Journey” lewat ⋯ di header, lalu gulir ke “Berbagi Publik”.',
  'help.guide.share-public.step.2': 'Klik “Buat tautan berbagi”.',
  'help.guide.share-public.step.3':
    'Pilih apa yang dilihat pengunjung: “Linimasa”, “Galeri”, dan “Peta”. Di bawah “Peta”, “Rencana perjalanan” menambahkan tempat dan rute yang direncanakan, dan “Rute terekam” menambahkan rute dari hari-hari yang kamu rekam. “Salin” menyalin tautannya ke clipboard.',
  'help.guide.share-public.result':
    'Siapa pun yang punya tautannya hanya bisa melihat bagian yang diaktifkan. Bidang yang kamu matikan di “Bidang catatan” juga tetap tersembunyi di sana.',
  'help.guide.share-public.tip.1':
    'Foto hanya muncul di peta publik jika “Galeri” dan “Peta” sama-sama aktif. Jika “Peta” mati, server menghapus koordinat foto sebelum mengirimnya.',
  'help.guide.share-public.tip.2': 'Klik “Hapus tautan” di samping “Salin” untuk berhenti berbagi.',
  // contributors
  'help.guide.contributors.title': 'Menulis bersama',
  'help.guide.contributors.goal': 'Izinkan teman seperjalanan menambahkan catatan dan foto mereka sendiri.',
  'help.guide.contributors.step.1': 'Buka “Pengaturan Journey” lewat ⋯ di header, lalu cari “Kontributor”.',
  'help.guide.contributors.step.2': 'Klik “Undang Kontributor”, lalu cari pengguna berdasarkan nama atau email.',
  'help.guide.contributors.step.3': 'Pilih “Peninjau” atau Editor, lalu klik “Undang”.',
  'help.guide.contributors.result':
    'Journey itu muncul di daftar mereka, dan entri mereka menampilkan nama mereka. Untuk menghapus kontributor, klik × di sampingnya.',
  'help.guide.contributors.tip.1':
    'Kontributor untuk orang-orang yang ada di TREK ini. Untuk orang lain, ada tautan publik.',
  // studio
  'help.guide.studio.title': 'Menyusun journey sebagai buku foto',
  'help.guide.studio.goal': 'Ubah jurnal menjadi halaman yang siap dicetak.',
  'help.guide.studio.step.1': 'Klik “Studio” di header. Desainer terbuka di atas journey.',
  'help.guide.studio.step.2': 'Untuk kembali, klik × di ujung kanan bar atas. Anda kembali ke tempat sebelumnya.',
  'help.guide.studio.result':
    'Panel dan isinya ada di kiri, halaman ganda di area kerja, dan properti di kanan. Tata letak otomatis membuat buku dari entri Anda. Ekspor membuat PDF siap cetak.',
  'help.guide.studio.tip.1': 'Studio butuh jendela dengan lebar minimal 1024 px dan tidak tersedia di ponsel.',
  'help.guide.studio.tip.2':
    'Bukunya punya akses yang sama dengan journey: siapa pun yang bisa membaca journey bisa membuka bukunya, dan siapa pun yang bisa mengedit journey bisa menyimpannya.',
  // archive-journey
  'help.guide.archive-journey.title': 'Mengarsipkan atau menghapus journey',
  'help.guide.archive-journey.goal': 'Tutup journey yang sudah selesai, atau hapus secara permanen.',
  'help.guide.archive-journey.step.1': 'Klik ⋯ di kanan atas header untuk membuka “Pengaturan Journey”.',
  'help.guide.archive-journey.step.2':
    'Di bagian bawah, “Arsipkan Perjalanan” mengakhiri journey dan menandainya sebagai diarsipkan, sedangkan “Pulihkan Perjalanan” memulihkannya. “Hapus” menghapusnya beserta semua catatan dan foto, setelah konfirmasi.',
  'help.guide.archive-journey.result':
    'Journey yang diarsipkan tetap bisa dibaca dan dibagikan; hanya saja tidak lagi terbuka di hari ini.',
  'help.guide.archive-journey.tip.1':
    'Penghapusan tidak bisa dibatalkan, dan tidak mengubah perjalanan yang tertaut ke journey itu.',
  'help.guide.archive-journey.tip.2': 'Sampul, nama, dan subjudul ada di dialog yang sama, di bagian atas.',
  'help.guide.journey-status.title': 'Mengatur status journey',
  'help.guide.journey-status.goal':
    'Tandai sendiri journey sebagai draf, langsung, atau selesai, tanpa mengikuti tanggal perjalanannya.',
  'help.guide.journey-status.step.1': 'Klik ⋯ di kanan atas header journey untuk membuka “Pengaturan Journey”.',
  'help.guide.journey-status.step.2':
    'Di bawah “Status”, pilih “Draf”, “Langsung”, atau “Selesai”. Pilihanmu langsung tersimpan.',
  'help.guide.journey-status.result':
    'Journey memakai status yang kamu pilih: “Draf” dan “Selesai” tampil sebagai lencana di kartu dan header-nya, dan journey “Langsung” tampil di banner bagian atas daftar journey.',
  'help.guide.journey-status.tip.1':
    '“Otomatis” kembali memakai tanggal dari perjalanan yang ditautkan. Tanpa perjalanan yang ditautkan, journey otomatis tetap berstatus draf.',
  'help.guide.journey-status.tip.2':
    'Status yang diatur manual tetap berlaku sampai kamu mengubahnya, meskipun tanggal perjalanan berubah.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio menata journey sebagai buku foto yang bisa Anda cetak. Studio terbuka di atas jurnal: panel dan isinya ada di kiri, halaman ganda yang sedang Anda kerjakan di tengah, dan propertinya di kanan. Tata letak otomatis membuat draf pertama dari entri Anda, tema memberi buku warna dan jenis hurufnya, dan asisten bisa merancang halaman bersama Anda. Setelah itu, Anda bisa memindahkan, memangkas, dan mengubah gaya semuanya, dan Anda bisa mengurungkan setiap langkah.',
  'help.ctx.journey-studio.bullet.1':
    'Bar atas: sampul dan nama journey di kiri. Di kanan ada siapa lagi yang ada di buku dan apakah buku sudah tersimpan, format halaman, urungkan, ulangi dan tempel, Tata letak otomatis, asisten, bantuan, Ekspor, dan tombol yang menutup Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Panel di kiri: Halaman, Konten (foto dan entri journey), Tata letak, Elemen (teks, bentuk, garis, bingkai, ikon, dan stiker), Perjalanan (angka, peta, negara, dan tanda yang dibuat dari journey) dan, terpisah di bawahnya, Tema dan Lapisan.',
  'help.ctx.journey-studio.bullet.3':
    'Area kerja: halaman ganda saat ini dengan bleed dan margin aman, serta bar zoom di bawahnya dengan Sesuaikan tampilan, Tampilan buku, dan Unduh halaman ganda ini.',
  'help.ctx.journey-studio.bullet.4':
    'Properti di kanan: semua tentang elemen yang dipilih, dari posisi, ukuran, dan pemangkasan hingga warna, efek, urutan tumpukan, dan kunci. Saat tidak ada yang dipilih, panel ini menampilkan latar halaman, tema, nomor halaman, dan dokumen.',
  'help.ctx.journey-studio.bullet.5':
    'Buku ditata seperti buku cetak: sampul, satu halaman pertama di seberang bagian dalam sampul yang kosong, halaman ganda, satu halaman terakhir, dan sampul belakang. Nomor halaman dihitung dari halaman pertama dan dicetak seperti yang ditampilkan.',
  'help.ctx.journey-studio.bullet.6':
    'Beberapa orang bisa mendesain bersamaan: semua orang melihat kursor orang lain beserta namanya. Jika kamu menyimpan versi yang sudah diubah orang lain, TREK menampilkan konflik dan tidak menimpa pekerjaan mereka.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: satu tampilan untuk seluruh buku, berupa kertas, tinta, dan tiga warna aksen, jenis huruf, serta motifnya. Elemen yang terhubung ke tema mengikutinya saat Anda mengubahnya.',
  'help.ctx.journey-studio.bullet.8':
    'Asisten: jika administrator telah menyiapkan AI, balon percakapan di bar atas membuka asisten yang menata halaman, menulis keterangan, dan mengubah gaya buku bersama Anda. Setiap perubahan yang dibuatnya adalah satu langkah urungkan.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Menyusun buku secara otomatis',
  'help.guide.studio-auto-layout.goal':
    'Dapatkan draf pertama yang lengkap dari catatan dan foto jurnal dengan sekali klik.',
  'help.guide.studio-auto-layout.step.1': 'Klik “Auto layout” di bilah atas.',
  'help.guide.studio-auto-layout.step.2':
    'Pilih “Seluruh buku”: semua halaman diganti, tetapi judul dan pengaturan halamanmu tetap. “Halaman ini” hanya menyusun ulang halaman ganda yang tampil di layar. Pilihan ini hanya tersedia di halaman ganda yang dibuat dari sebuah catatan.',
  'help.guide.studio-auto-layout.step.3':
    'Periksa panel halaman. Kalau kamu lebih suka versi sebelumnya, “Urungkan” mengembalikan seluruh tata letak.',
  'help.guide.studio-auto-layout.result':
    'Satu halaman ganda per entri, berurutan, dengan foto, judul, dan teksnya sudah ditempatkan. Setiap elemen tetap terhubung ke entrinya dan ikut berubah sampai kamu mengeditnya.',
  'help.guide.studio-auto-layout.tip.1':
    'Kedua pilihan itu tercatat sebagai langkah urungkan biasa, jadi kamu bisa mencobanya lalu membatalkannya.',
  'help.guide.studio-auto-layout.tip.2':
    'Saat auto layout menautkan elemen ke sebuah entri, elemen itu ikut berubah saat kamu mengedit entri tersebut. Jika kamu mengubah elemen itu di Properties, tautannya dilepas.',
  // studio-pages
  'help.guide.studio-pages.title': 'Tambah, pindahkan, dan hapus halaman ganda',
  'help.guide.studio-pages.goal': 'Edit buku halaman demi halaman.',
  'help.guide.studio-pages.step.1':
    'Buka Halaman di panel. Thumbnail menampilkan buku sesuai urutannya: sampul depan, halaman pertama, halaman ganda, halaman terakhir, dan sampul belakang. Halaman pertama dan terakhir digambar di samping bagian dalam sampulnya yang kosong, seperti buku berjilid saat dibuka.',
  'help.guide.studio-pages.step.2':
    '“Tambah halaman” di bagian bawah menambahkan halaman ganda baru sebelum halaman terakhir. Tanda + di antara dua thumbnail menyisipkannya di posisi itu.',
  'help.guide.studio-pages.step.3':
    'Arahkan kursor ke thumbnail untuk melihat tindakannya: “Pindah ke depan”, “Pindah ke belakang”, “Duplikat halaman”, dan “Hapus halaman”. Klik thumbnail untuk membuka halaman ganda itu di area kerja.',
  'help.guide.studio-pages.result':
    'Sampul depan, halaman pertama dan terakhir, serta sampul belakang tetap di posisinya. Halaman ganda baru selalu ditambahkan di antaranya.',
  'help.guide.studio-pages.tip.1':
    'Book view di bar atas menampilkan seluruh buku sebagai lembaran, seperti saat dijilid nanti.',
  'help.guide.studio-pages.tip.2':
    'Nomor halaman diaktifkan di bawah Document di Properties, saat tidak ada yang dipilih.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Terapkan tata letak ke halaman ganda',
  'help.guide.studio-layouts.goal': 'Beri halaman ganda susunan bingkai foto dan teks yang siap pakai.',
  'help.guide.studio-layouts.step.1':
    'Buka Tata letak di panel. Halaman berdesain tampil lebih dulu: sampul dan halaman ganda utuh dengan tema buku, yang dipersempit ke satu gaya oleh tombol gaya. Tata letakku dan Bawaan menyusul di bawahnya, dalam kisi yang sama.',
  'help.guide.studio-layouts.step.2':
    'Klik salah satunya. Halaman ganda di area kerja mendapat bingkai-bingkai dari tata letak ini, dan foto serta teks yang sudah ada ditempatkan ke dalamnya.',
  'help.guide.studio-layouts.result':
    'Bingkai kosong adalah tempat untuk konten: seret foto dari Content ke salah satunya, atau pakai Add to this page.',
  'help.guide.studio-my-layouts.title': 'Simpan halaman sebagai tata letak Anda sendiri',
  'help.guide.studio-my-layouts.goal': 'Pakai ulang susunan yang Anda buat di halaman lain dalam buku.',
  'help.guide.studio-my-layouts.step.1': 'Susun halaman sesuai keinginan Anda, lalu buka Tata letak di panel.',
  'help.guide.studio-my-layouts.step.2':
    'Klik Simpan halaman ini sebagai tata letak di bawah Tata letakku. Halaman muncul sebagai kartu di daftar.',
  'help.guide.studio-my-layouts.tip.1':
    'Klik tata letak Anda di halaman lain untuk menata halaman itu dengan cara yang sama, dengan foto dan teksnya sendiri.',
  'help.guide.studio-my-layouts.result':
    'Tata letak Anda disimpan bersama buku dan ditawarkan di halaman sejenis: milik sampul untuk sampul, milik halaman ganda untuk halaman ganda.',
  'help.guide.studio-layouts.tip.1': 'Tata letak juga tercatat sebagai satu langkah urungkan seperti biasa.',
  // studio-content
  'help.guide.studio-content.title': 'Taruh foto dan catatan di halaman',
  'help.guide.studio-content.goal': 'Tambahkan foto dan catatan dari journey ke halaman ganda.',
  'help.guide.studio-content.step.1':
    'Buka “Konten” di panel samping. “Foto” menampilkan semua gambar dari journey, dan “Entri” menampilkan catatan beserta teksnya.',
  'help.guide.studio-content.step.2':
    'Seret foto ke halaman atau ke bingkai kosong, atau klik “Tambahkan ke halaman ini” di bawahnya. “Unggah foto” menambahkan gambar yang belum ada di journey; “Dari Immich” atau “Dari Synology” memilihnya dari pustaka yang terhubung.',
  'help.guide.studio-content.step.3':
    'Di bawah sebuah catatan, “Title”, “Story”, dan “Place” menaruh teks itu di halaman sebagai elemen teks. Tanggal dan koordinat ditambahkan sebagai penanda, dan foto catatan itu juga tercantum di sana.',
  'help.guide.studio-content.result':
    'Foto yang dijatuhkan menjadi elemen foto. Teks tetap terhubung ke entri sampai kamu mengeditnya.',
  'help.guide.studio-theme.title': 'Beri buku sebuah tema',
  'help.guide.studio-theme.goal': 'Atur warna dan jenis huruf seluruh buku sekaligus.',
  'help.guide.studio-theme.step.1':
    'Buka Tema di panel. Setiap kartu menampilkan tema sebagai halaman kecil: kertasnya, jenis hurufnya, dan tiga warna aksennya.',
  'help.guide.studio-theme.step.2':
    'Klik tema untuk mencobanya. Di bawah kartu, Anda bisa mengubah paletnya, memilih jenis huruf lain, serta memilih motif dan dekorasi.',
  'help.guide.studio-theme.step.3': 'Klik Terapkan ke buku, atau Terapkan ke halaman ini untuk halaman ganda di layar.',
  'help.guide.studio-theme.tip.1':
    'Elemen yang terhubung ke tema mengambil warna dan jenis hurufnya serta mengikutinya saat Anda mengubahnya. Ubah juga gaya yang belum terhubung menghubungkan sisanya terlebih dahulu.',
  'help.guide.studio-theme.tip.2': 'Warna dari foto membuat palet dari gambar-gambar journey.',
  'help.guide.studio-theme.result':
    'Setiap warna dan jenis huruf yang terhubung di buku berubah sekaligus, dan menerapkan tema adalah satu langkah urungkan.',
  'help.guide.studio-content.tip.1': 'Kotak pencarian di bagian atas Content menyaring kedua daftar.',
  'help.guide.studio-content.tip.2':
    'Saat kamu menjatuhkan file dari desktop ke area kerja, TREK mengunggah dan menempatkannya sekaligus.',
  // studio-elements
  'help.guide.studio-elements.title': 'Tambahkan teks, bentuk, ikon, dan stiker',
  'help.guide.studio-elements.goal': 'Tambahkan hiasan ke halaman ganda selain foto dan cerita.',
  'help.guide.studio-elements.step.1':
    'Buka Elemen di panel. Enam tab memilah apa yang bisa Anda tambahkan: Teks, Bentuk, Garis, Bingkai, Ikon, dan Stiker.',
  'help.guide.studio-elements.step.2':
    'Klik gaya teks atau judul yang dirancang, bentuk, garis, bingkai kosong, ikon, atau stiker. Masing-masing ditempatkan di tengah halaman ganda, lalu Anda bisa memindahkannya.',
  'help.guide.studio-elements.result':
    'Klik dua kali elemen teks untuk mengetik di dalamnya; Properties berisi font, ketebalan, ukuran, spasi, dan perataan.',
  'help.guide.studio-stickers.title': 'Hias dengan stiker',
  'help.guide.studio-stickers.goal': 'Tambahkan ilustrasi, dari landmark dan makanan hingga hewan dan panah.',
  'help.guide.studio-stickers.step.1': 'Buka Elemen di panel dan pilih Stiker.',
  'help.guide.studio-stickers.step.2':
    'Cari sebuah kata atau jelajahi raknya, lalu klik stiker untuk menempatkannya di halaman ganda.',
  'help.guide.studio-stickers.tip.1':
    'Saat stiker dipilih, Properti mewarnai ulang bagian-bagiannya dan membalikkannya.',
  'help.guide.studio-stickers.result': 'Stiker adalah gambar, sehingga tetap tajam di ukuran berapa pun.',
  'help.guide.studio-elements.tip.1': '“Bingkai” adalah slot foto kosong: jatuhkan gambar ke sana nanti.',
  // studio-travel
  'help.guide.studio-travel.title': 'Tambahkan peta, angka, negara, dan tanda',
  'help.guide.studio-travel.goal': 'Ubah journey itu sendiri menjadi elemen berdesain di halaman.',
  'help.guide.studio-travel.step.1':
    'Buka Perjalanan di panel. Empat tab memilah apa yang bisa Anda tambahkan: Angka, Peta, Negara, dan Tanda.',
  'help.guide.studio-travel.step.2':
    'Setiap kartu menampilkan elemen dengan angka journey Anda sendiri, dalam warna tema: ringkasan sebagai poster, tiket, rambu jalan, atau odometer, peta dengan perhentian bernomor atau dipotong ke satu negara, negara sebagai prangko, kartu pos, atau pin, tanggal atau jarak sebagai stempel, label, atau pita.',
  'help.guide.studio-travel.step.3':
    'Klik sebuah kartu. Elemen ditempatkan di tengah halaman ganda, lalu Anda bisa memindahkan dan mengubah ukurannya.',
  'help.guide.studio-travel.result':
    'Elemen muncul di halaman ganda. Properti mengubah tampilannya, dan setiap angka, peta, dan negara diperbarui saat journey berubah.',
  'help.guide.studio-text-effects.title': 'Tambahkan efek pada teks',
  'help.guide.studio-text-effects.goal': 'Beri judul kontur, bayangan, lengkungan, atau huruf yang diisi pola.',
  'help.guide.studio-text-effects.step.1': 'Klik elemen teks di halaman untuk memilihnya.',
  'help.guide.studio-text-effects.step.2':
    'Di Properti, buka Efek untuk menambahkan kontur, bayangan, atau sorotan, atau isi huruf dengan gradien atau pola. Huruf dan posisi melengkungkan baris dan menyesuaikannya dengan kotaknya.',
  'help.guide.studio-text-effects.tip.1':
    'Sesuaikan dengan bingkai mengecilkan teks sampai muat di kotaknya, sehingga judul panjang tidak pernah meluap.',
  'help.guide.studio-text-effects.result': 'Efek digambar bersama teks, saat dicetak sama seperti di layar.',
  'help.guide.studio-background.title': 'Ubah latar halaman',
  'help.guide.studio-background.goal':
    'Warnai halaman dengan warna, gradien, atau pola, atau letakkan foto di bawahnya.',
  'help.guide.studio-background.step.1':
    'Klik bagian kosong halaman agar tidak ada yang dipilih. Latar halaman ada di bagian atas Properti.',
  'help.guide.studio-background.step.2':
    'Pilih Kertas, Polos, Gradien, atau Pola dan sebuah warna, atau klik foto di bawah Foto sebagai latar.',
  'help.guide.studio-background.tip.1': 'Terapkan ke semua halaman memberi setiap halaman buku latar yang sama.',
  'help.guide.studio-background.result': 'Latar meluas hingga bleed, sehingga tercetak sampai tepi halaman.',
  'help.guide.studio-layers.title': 'Atur, sembunyikan, dan kunci dengan lapisan',
  'help.guide.studio-layers.goal':
    'Lihat semua yang ada di halaman ganda menurut urutan tumpukan dan kerjakan langsung dari sana.',
  'help.guide.studio-layers.step.1': 'Buka Lapisan di panel. Bagian atas daftar adalah bagian depan halaman.',
  'help.guide.studio-layers.step.2':
    'Seret baris untuk mengubah urutannya, gunakan ikon mata untuk menyembunyikan elemen dan kunci agar tetap di tempatnya. Pilih beberapa elemen lalu kelompokkan agar bergerak bersama.',
  'help.guide.studio-layers.tip.1': 'Klik dua kali sebuah baris untuk memberi elemen namanya sendiri.',
  'help.guide.studio-layers.tip.2': 'Elemen yang disembunyikan tidak disertakan dalam PDF.',
  'help.guide.studio-layers.result':
    'Halaman yang padat tetap mudah diedit, dan bagian yang sudah selesai tidak bisa bergeser secara tidak sengaja.',
  'help.guide.studio-travel.tip.1':
    'Di bawah Peta, Perhentian mendaftar setiap perhentian rute. Matikan salah satunya agar tidak muncul di peta dan angka, misalnya bandara asal Anda.',
  'help.guide.studio-travel.tip.2':
    'Peta negara hanya menampilkan perhentian negara itu, sehingga negara memenuhi halaman meskipun journey dimulai dengan penerbangan panjang.',
  // studio-properties
  'help.guide.studio-properties.title': 'Mengedit elemen yang dipilih',
  'help.guide.studio-properties.goal': 'Pindahkan, potong, ubah gaya, dan atur tumpukan elemen lewat panel properti.',
  'help.guide.studio-properties.step.1':
    'Klik sebuah elemen di halaman ganda. Gagang untuk ukuran dan rotasi akan muncul. Seret elemen untuk memindahkannya.',
  'help.guide.studio-properties.step.2':
    '“Properties” di kanan menampilkan pengaturan item yang dipilih: posisi dan ukuran, “Crop” dengan titik fokus yang menentukan bagian mana yang tetap terlihat dalam bingkai, “Fill” atau “Fit”, filter “Look”, “Corner radius”, “Frame style”, urutan tumpukan, dan “Lock”.',
  'help.guide.studio-properties.step.3':
    '“Duplikat” dan “Hapus” ada di bagian atas panel properti. “Urungkan” di bilah atas membatalkan perubahan mana pun.',
  'help.guide.studio-properties.result':
    'Elemen yang dikunci tidak bisa dipilih atau dipindahkan di halaman. Ini melindungi tata letak yang sudah jadi saat kamu mengerjakan elemen lain.',
  'help.guide.studio-properties.tip.1':
    'Shift + klik memilih beberapa elemen, dan panel properti mengedit semuanya sekaligus.',
  'help.guide.studio-properties.tip.2':
    'Jika kamu mengedit elemen yang ditempatkan oleh auto layout, elemen itu tidak lagi terhubung ke entri dan tidak mengikuti perubahan entri berikutnya.',
  // studio-format
  'help.guide.studio-format.title': 'Memilih format halaman',
  'help.guide.studio-format.goal': 'Atur ukuran cetak buku sebelum kamu menyusun tata letaknya.',
  'help.guide.studio-format.step.1':
    'Klik format halaman di bar atas, di samping alat edit. Tombol ini menampilkan nama dan bentuk format.',
  'help.guide.studio-format.step.2':
    'Pilih Square 21 × 21 cm, Square 30 × 30 cm, A4 atau A5 lanskap atau potret, atau masukkan lebar dan tinggi sendiri dalam milimeter. Bleed dan margin aman ada di bawahnya.',
  'help.guide.studio-format.result':
    'Setiap halaman ganda digambar dengan ukuran itu, dengan bleed 3 mm dan margin aman 5 mm secara default.',
  'help.guide.studio-format.tip.1':
    'Ubah format dulu, baru jalankan “Auto layout”. “Auto layout” memakai format yang sedang aktif saat dijalankan.',
  'help.guide.studio-format.tip.2': 'Tanyakan nilai bleed dan area aman ke percetakanmu, lalu masukkan nilai tersebut.',
  // studio-export
  'help.guide.studio-export.title': 'Mengekspor buku sebagai PDF',
  'help.guide.studio-export.goal': 'Dapatkan file siap cetak, atau file untuk dibaca di layar.',
  'help.guide.studio-export.step.1': 'Klik “Export” di bilah atas.',
  'help.guide.studio-export.step.2':
    'Pilih “Halaman tunggal”, satu halaman per lembar sesuai urutan baca, yang dibutuhkan percetakan, atau “Halaman ganda”, dua halaman sekaligus seperti saat buku dibuka. “Tanda potong” menambahkan bleed di setiap sisi dan menunjukkan garis potongnya.',
  'help.guide.studio-export.step.3':
    'Klik “Tampilan cetak”. Browser membuka halaman-halamannya. Pilih “Simpan sebagai PDF” untuk membuat file.',
  'help.guide.studio-export.result':
    'PDF dengan jumlah lembar sesuai yang disebutkan dialog, dalam format halaman yang kamu atur.',
  'help.guide.studio-export.tip.1': 'PDF hanya bisa dibuat di desktop, sama seperti Studio itu sendiri.',
  'help.guide.studio-export.tip.2':
    'Untuk cetak coba, ekspor “Halaman ganda” tanpa tanda potong; untuk percetakan, “Halaman tunggal” dengan tanda potong.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Pakai ulang halaman ganda di buku lain',
  'help.guide.studio-spread-file.goal': 'Salin desain favoritmu dari buku satu journey ke journey lain.',
  'help.guide.studio-spread-file.step.1':
    'Saat halaman ganda ada di area kerja, klik “Unduh halaman ganda ini” di ujung kanan bilah zoom. File ini berisi desainnya, bukan fotonya.',
  'help.guide.studio-spread-file.step.2':
    'Di buku lain, buka “Pages” dan klik “Impor” di samping “Tambah halaman”, lalu pilih file-nya.',
  'help.guide.studio-spread-file.result':
    'Halaman ganda diimpor beserta bingkai dan gaya teksnya. Jatuhkan foto-foto journey baru ke dalam bingkainya.',
  'help.guide.studio-spread-file.tip.1':
    'Jika sebuah file bukan desain halaman ganda, TREK menolaknya dan menampilkan alasannya.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Pengaturan',
  'help.ctx.settings.summary':
    'Pengaturan pribadimu, dengan satu tab untuk setiap topik di sidebar kiri. Sebagian besar sakelar langsung berlaku begitu diubah. Formulir yang punya tombol “Simpan” baru tersimpan setelah kamu mengklik “Simpan”. Tidak ada yang di sini mengubah TREK bagi orang lain.',
  'help.ctx.settings.bullet.1':
    'Sidebar di kiri: “Tampilan” (umum), “Tampilan” (visual), “Peta”, “Notifikasi”, “Integrasi”, Offline, dan “Akun”. Plugin muncul begitu ada plugin yang aktif. “Tentang” muncul kecuali operator menyembunyikannya. Versinya tampil di bagian bawah.',
  'help.ctx.settings.bullet.2':
    '“Tampilan” (umum) terbuka lebih dulu. Isinya bahasa, bahasa nama tempat, satuan, format waktu, awal minggu, dan mata uang tampilan, serta cara kerja peta perjalanan. “Tampilan” (visual) berisi tema, warna, keterbacaan, ukuran teks, dan widget dasbor.',
  'help.ctx.settings.bullet.3':
    '“Peta” mengatur mesin peta dan gayanya; “Notifikasi” mengatur peristiwa mana yang dikirim ke saluran mana; “Integrasi” menghubungkan pustaka foto, AirTrail, Dawarich, dan wanderer, serta berisi kunci API dan MCP; “Offline” mengatur apa saja yang disimpan di perangkat ini.',
  'help.ctx.settings.bullet.4':
    '“Akun” berisi profil, kata sandi, autentikasi dua faktor, passkey, dan opsi untuk menghapus akunmu.',
  'help.ctx.settings-display.title': 'Tampilan',
  'help.ctx.settings-display.summary':
    'Halaman pembuka TREK, bahasa dan satuan yang dipakai, serta cara kerja peta perjalanan dan pemesanan. Setiap perubahan langsung berlaku.',
  'help.ctx.settings-display.bullet.1':
    '“Mulai”: “Halaman awal” membuka “Dasbor” atau “Perjalanan aktif”; dengan “Perjalanan aktif”, “Tab awal” menentukan tab yang dibuka perjalanan itu.',
  'help.ctx.settings-display.bullet.2':
    'Bahasa & wilayah: “Mata uang tampilan” (atau “Mata uang perjalanan” agar tidak dikonversi), “Bahasa”, “Nama tempat”, “Satuan Suhu”, “Satuan Jarak”, “Format Waktu”, dan “Awal minggu”.',
  'help.ctx.settings-display.bullet.3':
    '“Perjalanan & peta”: “Buka tempat di”, “Tanggal di depan pada judul hari”, “Label rute pemesanan”, “Selalu tampilkan rute pemesanan”, “Penanda ringkas untuk tempat yang belum direncanakan”, “Jelajahi tempat di peta”, “Sembunyikan Kode Pemesanan”, dan “Optimalkan rute dari akomodasi”.',
  'help.ctx.settings-appearance.title': 'Tampilan',
  'help.ctx.settings-appearance.summary':
    'Tampilan TREK di akun ini: terang atau gelap, warna aksen, efek kaca dan animasi, ukuran teks, serta widget yang tampil di dasbor. Semuanya langsung berlaku di setiap perangkat tempat kamu masuk.',
  'help.ctx.settings-appearance.bullet.1':
    'Tema: “Mode Warna” (“Terang”, “Gelap”, atau “Otomatis”), skema warna, dan dengan “Kustom”, warna aksenmu sendiri untuk mode terang dan gelap beserta pemeriksaan kontrasnya.',
  'help.ctx.settings-appearance.bullet.2':
    'Keterbacaan, ditandai “Eksperimental”: Transparansi, Kurangi gerakan, Kepadatan, dan “Ukuran teks” dengan satu penggeser untuk “Semua” serta satu masing-masing untuk Besar, Sedang, Normal, dan Kecil.',
  'help.ctx.settings-appearance.bullet.3':
    '“Widget dasbor”: sakelar terpisah untuk Desktop (“Di bawah hero”, Sidebar kanan) dan Seluler (“Di bawah hero”, “Bagian bawah halaman”).',
  'help.ctx.settings-appearance.bullet.4':
    '“Kembalikan ke default”, di bawah kartu, mengembalikan seluruh tab ke nilai bawaannya.',
  'help.ctx.settings-map.title': 'Peta',
  'help.ctx.settings-map.summary':
    'Mesin yang menggambar peta perencana perjalanan dan jurnal, beserta gayanya. Leaflet adalah peta raster klasik, Mapbox GL menambahkan bangunan dan medan 3D dengan token milikmu sendiri, dan MapLibre GL menggambar tile vektor OpenFreeMap tanpa token. Atlas selalu memakai Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '“Penyedia peta”: Leaflet, Mapbox GL (“Eksperimental”), atau MapLibre GL, masing-masing dengan keterangan singkat.',
  'help.ctx.settings-map.bullet.2':
    '“Template Peta” dan “Kunci API CARTO” untuk Leaflet; “Gaya peta” untuk kedua mesin GL, ditambah “Token akses Mapbox” untuk Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Khusus Mapbox GL: “Bangunan 3D & medan” dan “Mode kualitas tinggi”. Pratinjau langsung tampil di atas “Simpan Peta”. “Simpan Peta” menyimpan pilihanmu.',
  'help.ctx.settings-notifications.title': 'Notifikasi',
  'help.ctx.settings-notifications.summary':
    'Cara TREK menghubungimu di luar aplikasi. Di bagian atas, tabel dengan satu baris per peristiwa dan satu kolom per saluran menentukan apa yang dikirim ke mana. Di bawahnya ada kartu untuk webhook, ntfy, push di perangkat ini, dan saluran plugin jika ada.',
  'help.ctx.settings-notifications.bullet.1':
    '“Notifikasi”: aktifkan atau matikan setiap peristiwa per saluran. Ikon gembok berarti admin mematikannya untuk semua orang.',
  'help.ctx.settings-notifications.bullet.2':
    'URL Webhook: webhook Discord, Slack, atau kustom, dengan tombol “Uji” dan “Simpan”.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: “Topik Ntfy”, serta “URL Server Ntfy” dan Access Token yang opsional, dengan tombol “Uji” dan “Simpan”.',
  'help.ctx.settings-notifications.bullet.4':
    '“Notifikasi push di perangkat ini”: “Aktifkan untuk perangkat ini” hanya berlaku untuk browser ini; “Kirim tes” mengirim notifikasi uji. Saluran plugin menampilkan “Konfigurasi” sampai selesai diatur.',
  'help.ctx.settings-integrations.title': 'Integrasi',
  'help.ctx.settings-integrations.summary':
    'Semua yang terhubung ke TREK dari luar: pustaka foto untuk jurnal, AirTrail untuk penerbangan, Dawarich untuk tempat yang benar-benar kamu kunjungi, wanderer untuk jalur, kunci API baca saja untuk aplikasi lain, dan MCP untuk klien AI. Koneksi ke layanan lain baru muncul setelah admin mengaktifkannya.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich dan Synology Photos, AirTrail, Dawarich, dan wanderer: setiap kartu berisi alamat dan kuncinya, “Simpan” dan “Uji koneksi”, serta lencana “Terhubung” atau “Tidak terhubung”.',
  'help.ctx.settings-integrations.bullet.2':
    '“Kunci API”: kunci baca saja untuk API publik, masing-masing terbatas pada area yang kamu pilih, dengan Endpoint yang bisa disalin.',
  'help.ctx.settings-integrations.bullet.3':
    '“Konfigurasi MCP”: Endpoint MCP, dan di bawah “Klien OAuth 2.1”, klien yang sudah kamu daftarkan, “Konfigurasi Client” yang bisa disalin, serta “Sesi OAuth Aktif” dengan tombol “Cabut”.',
  'help.ctx.settings-integrations.bullet.4':
    '“Token API”: cara lama untuk terhubung ke MCP, ditandai “Usang”; pakai “Klien OAuth 2.1” sebagai gantinya.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Apa saja yang disimpan TREK di perangkat ini supaya perjalanan tetap bisa dibuka tanpa koneksi, dan apa yang terjadi saat perubahan yang dibuat offline bentrok dengan perubahan dari tempat lain.',
  'help.ctx.settings-offline.bullet.1':
    '“Mode offline”: “Paksa mode offline” mengunduh semuanya dulu, lalu hanya bekerja dari cache dan mengantrekan perubahanmu.',
  'help.ctx.settings-offline.bullet.2':
    '“Persiapkan untuk offline”: “Unduh untuk penggunaan offline” mengambil data perjalanan, dokumen, dan tile peta; “Sinkronkan ulang sekarang” menyinkronkan lagi secara manual.',
  'help.ctx.settings-offline.bullet.3':
    '“Apa yang disimpan offline”: “Simpan tile peta offline”, dan satu sakelar per perjalanan. Perjalanan yang sudah selesai hanya disimpan jika kamu mengaktifkannya.',
  'help.ctx.settings-offline.bullet.4':
    '“Konflik sinkronisasi” hanya muncul jika ada dua perubahan yang bentrok, dengan “Punya saya”, “Simpan punya server”, dan “Saat terjadi konflik”. “Cache offline” menghitung perjalanan dan perubahan yang tertunda atau gagal, dengan “Coba lagi”, “Buang”, dan “Hapus cache”.',
  'help.ctx.settings-account.title': 'Akun',
  'help.ctx.settings-account.summary':
    'Akunmu di TREK ini dan cara kamu masuk: foto profil, nama pengguna dan email, kata sandi, autentikasi dua faktor, dan passkey. “Hapus akun” ada di bagian bawah kartu “Akun”.',
  'help.ctx.settings-account.bullet.1':
    '“Akun”: klik ikon kamera pada gambar untuk mengunggah foto, dan ikon tempat sampah merah untuk menghapusnya. “Nama pengguna” dan “Email” disimpan dengan “Simpan Profil”.',
  'help.ctx.settings-account.bullet.2':
    '“Ganti Kata Sandi”: kata sandi saat ini, kata sandi baru dua kali dengan syarat-syarat yang tercentang sambil kamu mengetik, lalu “Perbarui kata sandi”. Jika TREK ini hanya bisa dimasuki lewat SSO, kartu ini tidak ditampilkan.',
  'help.ctx.settings-account.bullet.3':
    '“Autentikasi dua faktor (2FA)” dengan aplikasi autentikator dan kode cadangan, serta “Passkey” untuk masuk tanpa kata sandi.',
  'help.ctx.settings-account.bullet.4':
    '“Hapus akun” ada di kiri bagian bawah kartu “Akun” dan meminta konfirmasi. Administrator satu-satunya tidak bisa menghapus akunnya sendiri.',
  // language-region
  'help.guide.language-region.title': 'Mengatur bahasa, satuan, dan mata uang',
  'help.guide.language-region.goal': 'Pakai TREK dalam bahasamu dan dengan format wilayahmu.',
  'help.guide.language-region.step.1':
    'Di bawah Bahasa & wilayah, pilih “Bahasa” dari deretan chip. TREK langsung beralih, di semua perangkat tempat kamu masuk.',
  'help.guide.language-region.step.2':
    '“Nama tempat” menentukan bahasa yang dipakai pencarian tempat, saran, dan alamat; “Sama dengan aplikasi” mengikuti bahasa antarmuka.',
  'help.guide.language-region.result':
    'Tanggal, jarak, dan uang tampil dalam format yang kamu harapkan. Di “Biaya”, jumlah uang ditampilkan dalam mata uang tampilanmu hanya sebagai tampilan; jumlah yang dimasukkan tidak berubah.',
  'help.guide.language-region.tip.1':
    '“Mata uang perjalanan” menampilkan setiap perjalanan dalam mata uangnya sendiri, tanpa konversi.',
  'help.guide.language-region.tip.2': 'Bahasa juga menentukan nama hari dan bulan di Vacay dan jurnal.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Mengatur peta perjalanan dan judul hari',
  'help.guide.travel-map-prefs.goal':
    'Atur apa yang ditampilkan peta perjalanan dan tampilan header hari, di semua perjalanan.',
  'help.guide.travel-map-prefs.step.1':
    'Di “Perjalanan & peta”, “Buka tempat di” menentukan aplikasi peta yang langsung dibuka tombol navigasi; “Tanya setiap kali” membiarkanmu memilih aplikasi setiap kali. “Tanggal di depan pada judul hari” menampilkan tanggal kalender lebih dulu di setiap judul hari.',
  'help.guide.travel-map-prefs.step.2':
    '“Selalu tampilkan rute pemesanan” menggambar setiap penerbangan, kereta, dan pemesanan lain di peta; “Label rute pemesanan” menampilkan nama stasiun atau bandara di setiap ujungnya. “Penanda ringkas untuk tempat yang belum direncanakan” mengecilkan tempat yang belum dijadwalkan di hari mana pun, jadi perhentian yang sudah direncanakan lebih mudah terlihat.',
  'help.guide.travel-map-prefs.result':
    'Peta perjalanan memakai pengaturan ini di semua perjalanan, sampai kamu mengubahnya lagi.',
  'help.guide.travel-map-prefs.tip.1':
    'Pengaturan ini berlaku per akun, bukan per perjalanan. Setiap anggota perjalanan bersama melihat pilihannya masing-masing.',
  'help.guide.travel-map-prefs.tip.2':
    'Admin bisa mengatur default untuk semua orang; yang kamu ubah di sini hanya berlaku untukmu.',
  // startup
  'help.guide.startup.title': 'Memilih halaman pembuka TREK',
  'help.guide.startup.goal': 'Buka TREK di halaman yang paling sering kamu pakai, tidak selalu di dasbor.',
  'help.guide.startup.step.1':
    'Di bagian atas “Tampilan”, di bawah “Mulai”, atur “Halaman awal” ke “Dasbor” atau “Perjalanan aktif”.',
  'help.guide.startup.step.2': 'Dengan “Perjalanan aktif”, muncul “Tab awal”: pilih tab yang dibuka perjalanan itu.',
  'help.guide.startup.result': 'Lain kali kamu membuka TREK, halaman itu langsung terbuka.',
  'help.guide.startup.tip.1':
    '“Perjalanan aktif” adalah perjalanan yang sedang berlangsung hari ini, atau perjalanan berikutnya. Ini perjalanan yang sama dengan yang tampil di bagian atas dasbor.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Mengatur tema dan warna aksen',
  'help.guide.theme-scheme.goal': 'Buat TREK terang, gelap, atau mengikuti perangkatmu, dengan warna kesukaanmu.',
  'help.guide.theme-scheme.step.1':
    'Di bawah Tema, atur “Mode Warna” ke “Terang”, “Gelap”, atau “Otomatis”. “Otomatis” mengikuti pengaturan perangkatmu.',
  'help.guide.theme-scheme.step.2':
    'Pilih skema warna: “Bawaan”, Kontras tinggi, Indigo, Teal, Rose, Amber, Violet, atau “Kustom”.',
  'help.guide.theme-scheme.step.3':
    'Dengan “Kustom”, pilih salah satu titik warna, atau atur warna aksenmu sendiri secara terpisah untuk “Terang” dan “Gelap”. Pil di sebelahnya menunjukkan kontrasnya baik atau rendah.',
  'help.guide.theme-scheme.result':
    'Tombol, tautan, dan sorotan memakai warna aksen itu di mana saja, di setiap perangkat tempat kamu masuk.',
  'help.guide.theme-scheme.tip.1':
    'Bilah navigasi juga punya sakelar cepat terang atau gelap, yang mengatur tema yang sama.',
  'help.guide.theme-scheme.tip.2': 'Pilih skema “High contrast” kalau tampilan default terlalu sulit dibaca.',
  // readability
  'help.guide.readability.title': 'Atur keterbacaan dan ukuran teks',
  'help.guide.readability.goal': 'Kurangi efek kaca dan animasi, tambah ruang, atau perbesar teks.',
  'help.guide.readability.step.1':
    'Di bawah Keterbacaan, Transparansi mengganti panel kaca menjadi permukaan solid, Kurangi gerakan meminimalkan animasi, dan Kepadatan memilih Lega atau Ringkas.',
  'help.guide.readability.step.2':
    '“Ukuran teks”: geser “Semua” untuk mengubah ukuran semua teks sekaligus, atau atur Besar, Sedang, Normal, dan Kecil satu per satu. Setiap ukuran menampilkan contoh, jadi kamu langsung melihat hasilnya saat menggeser.',
  'help.guide.readability.result': 'Perubahannya langsung berlaku di seluruh aplikasi, termasuk panel peta dan jurnal.',
  'help.guide.readability.tip.1':
    'Sebagian bagian TREK sudah mengurangi animasi jika perangkatmu diatur untuk mengurangi gerakan. Kurangi gerakan mengurangi animasi di bagian lainnya.',
  'help.guide.readability.tip.2':
    'Ukuran teks diterapkan lewat tingkatan tipografi, jadi tidak ada yang terpotong. Teks yang tidak lagi muat akan pindah ke baris berikutnya.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Pilih widget dasbor',
  'help.guide.dashboard-widgets.goal': 'Tampilkan hanya widget yang kamu pakai, terpisah untuk desktop dan ponsel.',
  'help.guide.dashboard-widgets.step.1':
    'Di bawah “Widget dasbor”, Desktop mencantumkan widget “Di bawah hero” dan Sidebar kanan. Mematikan Sidebar kanan menyembunyikan seluruh kolom dan menengahkan dasbor; widget-widgetnya tampil redup sampai kamu mengaktifkannya lagi.',
  'help.guide.dashboard-widgets.step.2':
    'Untuk dasbor di ponselmu, tampilan seluler punya sakelarnya sendiri: “Di bawah hero” dan “Bagian bawah halaman”.',
  'help.guide.dashboard-widgets.result':
    'Dasbor langsung berubah. Kalau kolom kanan dimatikan, dasbor berada di tengah.',
  'help.guide.dashboard-widgets.tip.1': 'Widget dari suatu addon hanya muncul selama admin mengaktifkan addon itu.',
  'help.guide.dashboard-widgets.tip.2':
    'Dasbor sendiri mengingat tampilan kisi atau daftar serta urutannya per perangkat.',
  // map-provider
  'help.guide.map-provider.title': 'Memilih mesin dan gaya peta',
  'help.guide.map-provider.goal': 'Beralih antara peta klasik, tile vektor, dan peta 3D Mapbox.',
  'help.guide.map-provider.step.1':
    'Di bawah “Penyedia peta”, pilih Leaflet untuk peta 2D klasik dengan tile raster apa pun, Mapbox GL untuk tile vektor dengan bangunan dan medan 3D, atau MapLibre GL untuk tile vektor OpenFreeMap tanpa token.',
  'help.guide.map-provider.step.2':
    'Pilih “Template Peta” untuk Leaflet atau “Gaya peta” untuk mesin GL, atau tempel URL milikmu sendiri. Mapbox GL memerlukan “Token akses Mapbox”, template CARTO memerlukan “Kunci API CARTO”; tautan di bawah setiap kolom menunjukkan cara mendapatkannya.',
  'help.guide.map-provider.step.3':
    'Dengan Mapbox GL, aktifkan “Bangunan 3D & medan” dan, jika perangkatmu cukup kencang, “Mode kualitas tinggi”. Periksa pratinjaunya, lalu klik “Simpan Peta”.',
  'help.guide.map-provider.result':
    'Peta perencana perjalanan dan jurnal memakai mesin yang kamu pilih. Atlas selalu memakai Leaflet.',
  'help.guide.map-provider.tip.1': 'Tanpa token, Mapbox GL memakai Leaflet daripada menampilkan peta kosong.',
  'help.guide.map-provider.tip.2':
    'Tile peta yang kamu simpan untuk offline berasal dari penyedia yang aktif saat kamu mengunduhnya.',
  // notification-channels
  'help.guide.notification-channels.title': 'Atur tempat kamu menerima notifikasi',
  'help.guide.notification-channels.goal':
    'Terima pengingat perjalanan dan aktivitas kolaborasi di ponselmu atau di aplikasi lain.',
  'help.guide.notification-channels.step.1':
    'Untuk webhook, tempel URL Webhook Discord, Slack, atau kustom, klik “Uji”, lalu “Simpan”.',
  'help.guide.notification-channels.step.2':
    'Untuk ntfy, isi “Topik Ntfy”, lalu tambahkan “URL Server Ntfy” dan Access Token jika kamu menjalankan server sendiri. “Uji” langsung mengirim pesan; “Simpan” menyimpan pengaturannya.',
  'help.guide.notification-channels.step.3':
    'Di kartu “Notifikasi” paling atas, aktifkan atau matikan setiap peristiwa per saluran. Ikon gembok berarti admin mematikannya untuk semua orang. Saluran plugin menampilkan “Konfigurasi” sampai selesai diatur; “Kirim tes” untuk mencobanya.',
  'help.guide.notification-channels.result':
    'Peristiwa dikirim lewat saluran yang kamu aktifkan untuknya. Kolom In-App menentukan apa yang tampil di ikon lonceng pada navbar.',
  'help.guide.notification-channels.tip.1':
    '“Pengingat” untuk perjalanan tertentu, berapa hari sebelum keberangkatan, diatur di formulir edit perjalanan itu.',
  'help.guide.notification-channels.tip.2':
    'Admin bisa mengisi server ntfy default untuk semua orang; topiknya tetap kamu pilih sendiri.',
  // photo-providers
  'help.guide.photo-providers.title': 'Menghubungkan pustaka foto',
  'help.guide.photo-providers.goal': 'Biarkan jurnal memuat foto-foto hari itu dari Immich atau Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Di bawah “Integrasi”, cari kartu Immich atau Synology Photos dan isi yang diminta: “URL Server” dengan “Kunci API” untuk Immich, atau “Nama pengguna” dan “Kata sandi” untuk Synology Photos. Immich juga bisa menyalin foto journey ke pustaka Immich saat kamu mengunggahnya.',
  'help.guide.photo-providers.step.2': 'Klik “Uji koneksi”, lalu “Simpan”. Lencananya berubah menjadi “Terhubung”.',
  'help.guide.photo-providers.result':
    'Tab “External photos” di editor catatan mencari foto dari pustaka yang terhubung untuk hari catatan itu, mulai dari yang paling dekat dengan lokasinya.',
  'help.guide.photo-providers.tip.1':
    'Koneksi ini hanya untuk akunmu. Anggota lain di journey menghubungkan pustaka mereka sendiri.',
  'help.guide.photo-providers.tip.2':
    'Penyedia yang fotonya tidak punya data GPS tetap bisa dipakai. Daftarnya akan diurutkan berdasarkan waktu.',
  // api-keys
  'help.guide.api-keys.title': 'Buat kunci API',
  'help.guide.api-keys.goal': 'Izinkan aplikasi lain membaca perjalananmu lewat API publik.',
  'help.guide.api-keys.step.1':
    'Di bawah “Kunci API”, klik “Buat kunci”, beri “Nama” yang menunjukkan di mana kunci itu akan dipakai, dan di bawah “Apa yang boleh dibaca kunci ini”, sisakan hanya area yang diperlukan. Klik “Buat”.',
  'help.guide.api-keys.step.2':
    'Salin kuncinya dari “Kunci API dibuat”: kunci hanya ditampilkan sekali. Klik “Selesai”. Endpoint yang dipanggil ditampilkan di bawah daftar.',
  'help.guide.api-keys.result':
    'Aplikasi yang punya kunci ini bisa membaca area yang kamu pilih dan tidak pernah mengubah apa pun. Daftarnya menunjukkan kapan setiap kunci dibuat dan terakhir dipakai, dan ikon tempat sampah menghapusnya.',
  'help.guide.api-keys.tip.1':
    'Pakai satu kunci untuk setiap alat, agar kamu bisa mencabut satu kunci tanpa mengganggu alat lainnya.',
  'help.guide.api-keys.tip.2':
    'Agar klien AI bisa mengubah data, pakai MCP dengan OAuth; kunci API hanya bisa membaca.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Menghubungkan asisten AI lewat MCP',
  'help.guide.mcp-oauth.goal': 'Beri Claude, IDE, atau klien MCP lain akses ke perjalananmu.',
  'help.guide.mcp-oauth.step.1': 'Di bawah “Konfigurasi MCP”, salin Endpoint MCP untuk klienmu.',
  'help.guide.mcp-oauth.step.2':
    'Di bawah “Klien OAuth 2.1”, klik “Klien Baru” dan pilih Preset cepat seperti Claude Desktop atau Cursor, atau isi sendiri “Nama Aplikasi”, “Redirect URI”, dan “Cakupan yang Diizinkan”; untuk server tanpa browser, pilih Klien mesin. Klik “Daftarkan Client” dan salin “Rahasia Klien”: rahasia ini hanya ditampilkan sekali.',
  'help.guide.mcp-oauth.step.3':
    'Setiap klien punya “Putar Ulang Secret” dan “Hapus Klien”. “Sesi OAuth Aktif” mencantumkan klien yang sedang masuk, dengan tombol “Cabut”. “Konfigurasi Client” bisa dibuka untuk menampilkan cuplikan siap pakai bagi klien yang memakai JSON.',
  'help.guide.mcp-oauth.result':
    'Klien bisa membaca dan mengubah apa pun yang diizinkan cakupannya, atas namamu, dan setiap tindakannya tercatat dengan namamu.',
  'help.guide.mcp-oauth.tip.1':
    'Cakupan membatasi apa yang bisa dilakukan klien: beri klien cakupan baca saja sampai benar-benar butuh lebih.',
  'help.guide.mcp-oauth.tip.2':
    'Admin bisa mematikan MCP untuk seluruh instans. Kalau begitu, bagian ini tidak ditampilkan.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Simpan perjalanan untuk offline',
  'help.guide.offline-prepare.goal': 'Simpan perjalanan beserta petanya di perangkat ini sebelum koneksimu terputus.',
  'help.guide.offline-prepare.step.1':
    'Di bawah “Apa yang disimpan offline”, biarkan “Simpan tile peta offline” aktif, lalu aktifkan perjalanan yang ingin kamu simpan di perangkat ini. Perjalanan yang sudah selesai hanya disimpan jika kamu mengaktifkannya.',
  'help.guide.offline-prepare.step.2':
    'Kembali ke bagian atas, di bawah “Persiapkan untuk offline”, klik “Unduh untuk penggunaan offline”. TREK mengambil data perjalanan, dokumen, dan tile peta, lalu memberi tahu berapa perjalanan yang tersimpan.',
  'help.guide.offline-prepare.step.3':
    '“Paksa mode offline” mengunduh sekali lagi, lalu bekerja hanya dari perangkat ini, jadi kamu bisa memastikan semuanya tersedia sebelum berangkat.',
  'help.guide.offline-prepare.result':
    'Perjalanan bisa dibuka tanpa koneksi. Perubahan yang kamu buat disimpan dalam antrean dan dikirim saat kamu online lagi.',
  'help.guide.offline-prepare.tip.1':
    'Tile peta memakan ruang paling besar; matikan jika kamu hanya ingin menyimpan data perjalanan dan dokumen.',
  'help.guide.offline-prepare.tip.2':
    'Pasang TREK sebagai aplikasi dari browser agar mode offline berjalan paling lancar.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Tentukan versi mana yang dipakai saat terjadi konflik sinkronisasi',
  'help.guide.offline-conflicts.goal':
    'Pilih cara TREK menyelesaikan konflik antara perubahan yang dibuat offline dan perubahan dari tempat lain.',
  'help.guide.offline-conflicts.step.1':
    'Jika perubahan yang kamu buat saat offline bentrok dengan perubahan yang lebih baru, “Konflik sinkronisasi” muncul di dekat bagian atas Offline. Untuk setiap perubahan, klik “Punya saya” atau “Simpan punya server”.',
  'help.guide.offline-conflicts.step.2':
    'Di kartu yang sama, “Saat terjadi konflik” menentukan apa yang terjadi lain kali: “Tanya aku setiap kali”, “Selalu simpan versiku”, atau “Selalu simpan versi server”.',
  'help.guide.offline-conflicts.result':
    'Dengan “Tanya aku setiap kali”, konflik akan tetap ada di “Konflik sinkronisasi” sampai kamu memilih. Dengan dua opsi lainnya, TREK menyelesaikannya secara otomatis.',
  'help.guide.offline-conflicts.tip.1':
    '“Hapus cache” hanya menghapus salinan di perangkat ini. Tidak ada yang berubah di server.',
  // profile
  'help.guide.profile.title': 'Ubah profilmu',
  'help.guide.profile.goal': 'Perbarui nama, email, dan fotomu.',
  'help.guide.profile.step.1':
    'Di kartu “Akun”, klik ikon kamera pada gambarmu untuk mengunggah foto; ikon tempat sampah merah menghapusnya lagi dan memunculkan kembali inisialmu.',
  'help.guide.profile.step.2': 'Edit “Nama pengguna” dan “Email” di bawah gambar.',
  'help.guide.profile.result':
    'Nama dan fotomu langsung diperbarui di mana saja, termasuk di perjalanan yang kamu bagikan.',
  'help.guide.profile.tip.1':
    'Akun yang terhubung lewat SSO menampilkan lencana SSO dan “Terhubung dengan” beserta nama penyedianya.',
  // password
  'help.guide.password.title': 'Mengganti kata sandi',
  'help.guide.password.goal': 'Tetapkan kata sandi baru.',
  'help.guide.password.step.1':
    'Di bawah “Ganti Kata Sandi”, isi “Kata sandi saat ini”, lalu “Kata sandi baru” dan ulangi di “Konfirmasi kata sandi baru”. Daftar di bawahnya menandai setiap syarat yang terpenuhi sambil kamu mengetik.',
  'help.guide.password.step.2': 'Klik “Perbarui kata sandi”.',
  'help.guide.password.result':
    'Kata sandi baru langsung berlaku. Semua perangkat lain dikeluarkan, token API MCP-mu dihapus, dan klien OAuth harus masuk lagi; perangkat ini tetap masuk.',
  'help.guide.password.tip.1':
    'Jika TREK ini hanya bisa dimasuki lewat SSO, tidak ada kata sandi TREK dan tidak ada kartu “Ganti Kata Sandi”.',
  // mfa
  'help.guide.mfa.title': 'Aktifkan autentikasi dua faktor',
  'help.guide.mfa.goal': 'Lindungi akun dengan kode dari aplikasi autentikator.',
  'help.guide.mfa.step.1': 'Di bawah “Autentikasi dua faktor (2FA)”, klik “Atur autentikator”.',
  'help.guide.mfa.step.2':
    'Pindai kode QR dengan aplikasimu, atau masukkan kode rahasianya secara manual, lalu ketik kode enam digit yang ditampilkan dan klik “Aktifkan 2FA”.',
  'help.guide.mfa.step.3':
    'Simpan kode cadangan dengan “Salin kode”, “Unduh TXT”, atau “Cetak / PDF”, lalu klik OK. Setiap kode hanya bisa dipakai sekali. Pakai kode ini saat ponselmu tidak ada.',
  'help.guide.mfa.result': 'Setiap kali masuk, kamu diminta kode setelah kata sandi.',
  'help.guide.mfa.tip.1':
    '“Nonaktifkan 2FA” memerlukan kata sandimu dan kode yang berlaku saat ini atau kode cadangan yang belum terpakai.',
  'help.guide.mfa.tip.2':
    'Admin bisa mewajibkan 2FA untuk semua orang. Kalau begitu, 2FA tidak bisa dimatikan di sini.',
  // passkeys
  'help.guide.passkeys.title': 'Masuk dengan passkey',
  'help.guide.passkeys.goal': 'Pakai sidik jari, wajah, atau PIN perangkatmu sebagai ganti kata sandi.',
  'help.guide.passkeys.step.1':
    'Di bawah “Passkey”, klik “Tambah passkey”, konfirmasi kata sandimu saat ini dan beri nama yang menunjukkan perangkatnya, lalu ikuti petunjuk di perangkatmu.',
  'help.guide.passkeys.step.2':
    'Setiap passkey menunjukkan apakah statusnya “Tersinkron” atau terikat ke “Perangkat ini”, dan kapan terakhir dipakai. “Ganti nama” mengubah namanya, dan tombol hapus menghapusnya setelah kamu memasukkan kata sandi.',
  'help.guide.passkeys.result': 'Halaman masuk menawarkan passkey. Kamu tetap bisa masuk dengan kata sandi.',
  'help.guide.passkeys.tip.1':
    'Passkey disimpan di perangkat atau di pengelola kata sandinya, jadi tambahkan satu passkey untuk setiap perangkat.',
  'help.guide.passkeys.tip.2':
    'Passkey baru muncul setelah admin mengaktifkannya. Selama server belum punya domain WebAuthn, kartu menjelaskan hal itu dan tidak menawarkan “Tambah passkey”.',
  // delete-account
  'help.guide.delete-account.title': 'Menghapus akunmu',
  'help.guide.delete-account.goal': 'Hapus akunmu beserta data yang hanya milikmu.',
  'help.guide.delete-account.step.1': 'Di kartu “Akun”, klik “Hapus akun” di kiri bawah kartu, lalu “Hapus permanen”.',
  'help.guide.delete-account.result':
    'Akunmu dihapus, beserta perjalanan, tempat, dan file milikmu. Perjalanan milik orang lain tetap ada.',
  'help.guide.delete-account.tip.1':
    'Jika kamu satu-satunya administrator, TREK menampilkan “Penghapusan tidak memungkinkan”: jadikan pengguna lain admin terlebih dulu.',
  'help.guide.delete-account.tip.2':
    'Tindakan ini tidak bisa dibatalkan. Ekspor dulu apa yang ingin kamu simpan sebelum mengonfirmasi.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Admin', // same-as-en
  'help.ctx.admin.summary':
    'Pengaturan untuk seluruh instans TREK, berlaku bagi semua pengguna: siapa yang boleh masuk dan caranya, fitur apa yang aktif, di mana file disimpan, bagaimana server menghubungi orang, dan bagaimana datanya dicadangkan. Hanya admin yang bisa melihat halaman ini. Sidebar mengelompokkan tab di bawah “Pengguna”, Konfigurasi, “Integrasi”, dan Pemeliharaan, dan setiap tab adalah layar tersendiri.',
  'help.ctx.admin.bullet.1':
    'Header menampilkan jumlah pengguna, perjalanan, tempat, dan file di sebelah kanannya. Di bawahnya, banner “Pembaruan tersedia” muncul jika ada rilis TREK yang lebih baru.',
  'help.ctx.admin.bullet.2':
    '“Pengguna” dan “Pengaturan Default Pengguna”: akun, tautan undangan, dan izin, serta pengaturan dan peta awal untuk akun baru.',
  'help.ctx.admin.bullet.3':
    '“Personalisasi”, “Pengaturan”, “Addon”, Plugin, dan “Penyimpanan”: template daftar bawaan, kategori, dan liburan sekolah; login, passkey, 2FA, kunci API, dan penyedia pencarian; modul fitur; plugin pihak ketiga; tempat penyimpanan unggahan.',
  'help.ctx.admin.bullet.4':
    '“Notifikasi”, “Akses MCP”, dan GitHub: saluran yang boleh dipilih pengguna dan pengaturan awalnya, token dan sesi klien AI, serta riwayat rilis.',
  'help.ctx.admin.bullet.5':
    '“Cadangan” dan “Audit”: pencadangan manual dan terjadwal, serta log peristiwa yang berkaitan dengan keamanan.',
  'help.ctx.admin-users.title': 'Pengguna',
  'help.ctx.admin-users.summary':
    'Semua akun di TREK ini, dengan peran, email, dan kapan terakhir aktif, tautan undangan agar orang bisa mendaftar di instans tertutup, serta siapa yang boleh melakukan apa di perjalanan.',
  'help.ctx.admin-users.bullet.1':
    'Tabel: pengguna, email, peran, tanggal dibuat, dan “Terakhir Aktif”, dengan “Edit Pengguna” dan “Hapus pengguna” di setiap baris. Titik hijau di avatar berarti orang itu sedang online; barismu sendiri bertuliskan “(Kamu)”.',
  'help.ctx.admin-users.bullet.2':
    '“Buat Pengguna”, di kanan atas kartu “Pengguna”, menambahkan akun secara manual dengan kata sandi yang kamu berikan ke pengguna tersebut.',
  'help.ctx.admin-users.bullet.3':
    '“Tautan Undangan” di bawahnya: tautan pendaftaran dengan batas pemakaian, masa berlaku, dan, jika mau, perjalanan yang langsung diikuti pengguna baru saat mendaftar.',
  'help.ctx.admin-users.bullet.4':
    '“Pengaturan Izin” di bagian bawah: untuk setiap tindakan, siapa yang boleh melakukannya (“Semua orang”, “Anggota perjalanan”, “Pemilik perjalanan”, atau “Hanya Admin”). Klik “Simpan” di bagian atas kartu untuk menyimpannya.',
  'help.ctx.admin-defaults.title': 'Pengaturan Default Pengguna',
  'help.ctx.admin-defaults.summary':
    'Pengaturan awal akun baru, agar tidak ada yang perlu mengaturnya dulu: mode warna, satuan, format waktu, awal minggu, mata uang tampilan, dan kode pemesanan yang disamarkan, ditambah peta, kuncinya, dan server rute.',
  'help.ctx.admin-defaults.bullet.1':
    '“Pengaturan Default Pengguna” di kiri: “Mode Warna”, “Satuan Suhu”, “Satuan Jarak”, “Format Waktu”, “Awal minggu”, “Mata uang tampilan”, dan “Sembunyikan Kode Pemesanan”.',
  'help.ctx.admin-defaults.bullet.2':
    '“Peta” di kanan: “Template Peta”, “Kunci CARTO bersama”, “Mesin rute sendiri” dan “Instans Valhalla sendiri”, pratinjau, lalu “Mesin peta” dengan “Gaya peta”, “Token Mapbox bersama”, “Bangunan & medan 3D”, dan “Mode kualitas tinggi”.',
  'help.ctx.admin-config.title': 'Personalisasi',
  'help.ctx.admin-config.summary':
    'Pengaturan yang dipakai bersama oleh semua perjalanan di instans ini: template daftar bawaan, kumpulan kategori untuk tempat dan koleksi, serta katalog liburan sekolah yang dipakai Vacay.',
  'help.ctx.admin-config.bullet.1':
    '“Template Packing”: daftar bernama berisi kategori dan barang yang bisa dipakai sebagai awal daftar packing sebuah perjalanan.',
  'help.ctx.admin-config.bullet.2':
    '“Kategori”: nama, ikon, dan warna kategori yang dipakai di seluruh TREK, dari detail tempat sampai “Koleksi”, masing-masing diedit di dialog dengan pratinjau.',
  'help.ctx.admin-config.bullet.3':
    '“Liburan sekolah”: katalog negara dan wilayah beserta periode liburannya, yang bisa dipilih semua orang di Vacay.',
  'help.ctx.admin-settings.title': 'Pengaturan',
  'help.ctx.admin-settings.summary':
    'Cara orang masuk dan layanan eksternal apa saja yang boleh dipakai server. Di kiri: “Metode Autentikasi”, “Login dengan passkey”, “Wajibkan autentikasi dua faktor (2FA)”, dan Single Sign-On (OIDC). Di kanan: “Jenis File yang Diizinkan” dan “Kunci API” beserta penyedia pencarian dan transportasi umum. “Zona Berbahaya” ada di bagian bawah.',
  'help.ctx.admin-settings.bullet.1':
    '“Metode Autentikasi”: “Login dengan Kata Sandi”, “Pendaftaran dengan Kata Sandi”, dan, setelah OIDC diatur, “Login SSO” dan “Penyediaan Otomatis SSO”. “Wajibkan autentikasi dua faktor (2FA)” punya kartunya sendiri.',
  'help.ctx.admin-settings.bullet.2':
    '“Login dengan passkey”: “Aktifkan login dengan passkey”, Relying Party ID (domain), dan “Origin yang diizinkan”. Single Sign-On (OIDC): “Nama Tampilan”, Issuer URL, Discovery URL opsional, “ID Klien”, dan “Rahasia Klien”.',
  'help.ctx.admin-settings.bullet.3':
    '“Kunci API”: TREK Places API ada di urutan pertama dan tidak memerlukan kunci. Di bawahnya ada “Kunci API Google Maps” (dengan “Uji” dan “Kunci ini dipakai untuk apa”), kunci Unsplash dan Amap, dan satu tombol “Simpan” di bagian bawah kartu.',
  'help.ctx.admin-settings.bullet.4':
    '“Penyedia transportasi umum” dan “Penyedia pencarian tempat” menentukan layanan untuk pencarian transportasi umum dan tempat; “Log pencarian tempat” mencatat hasil mana yang dipilih; “Jenis File yang Diizinkan” membatasi unggahan.',
  'help.ctx.admin-addons.title': 'Addon',
  'help.ctx.admin-addons.summary':
    'Modul fitur TREK, masing-masing dengan sakelar: “Perlengkapan”, “Anggaran”, “Dokumen”, Vacay, Atlas, Collab, Journey, “Koleksi”, “Perjalanan darat”, MCP, AirTrail, Dawarich, dan “Penguraian AI”. Kalau dimatikan, menu navigasi, rute, dan API-nya dihapus untuk semua orang.',
  'help.ctx.admin-addons.bullet.1': 'Satu kotak per addon dengan sakelarnya dan, jika ada, sub-baris untuk opsinya.',
  'help.ctx.admin-addons.bullet.2':
    'Penyedia foto dan penyedia dokumen juga tampil di sini sebagai kotak, agar Immich atau Synology bisa disediakan bagi pengguna.',
  'help.ctx.admin-addons.bullet.3': '“Pelacak Tas” punya sakelarnya sendiri di bawah kotak-kotak addon.',
  'help.ctx.admin-plugins.title': 'Plugin',
  'help.ctx.admin-plugins.summary':
    'Plugin pihak ketiga yang berjalan di prosesnya sendiri di samping TREK, masing-masing dengan izin yang dimintanya saat dipasang. Pasang dari katalog, unggah paket, atau tautkan folder saat kamu sedang mengembangkan plugin.',
  'help.ctx.admin-plugins.bullet.1':
    '“Terpasang” dan “Jelajahi”, dengan “Cari plugin…” serta filter “Jenis”, Status, dan “Urutkan”. Setiap baris menampilkan versi, “Ditinjau”, “Ditandatangani” atau “Tanpa tanda tangan”, apa saja yang boleh diakses plugin, sebuah sakelar, dan menu ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Dua ikon di header kartu: “Unggah plugin” menerima file .zip, .tgz, atau .tar.gz (atau jatuhkan file .zip ke halaman); “Pindai ulang” menemukan folder plugin yang ditautkan untuk pengembangan.',
  'help.ctx.admin-plugins.bullet.3':
    '“Host yang diizinkan” per plugin: alamat yang boleh dihubungi plugin, karena koneksi keluar diblokir secara default.',
  'help.ctx.admin-storage.title': 'Penyimpanan',
  'help.ctx.admin-storage.summary':
    'Tempat unggahan disimpan: disk lokal atau bucket S3, dan bisa juga disalin ke backend lain. Setiap kategori unggahan bisa disimpan di backend yang berbeda, dan tidak ada yang berubah sampai kamu klik “Simpan perubahan”.',
  'help.ctx.admin-storage.bullet.1':
    '“Kesehatan” di bagian atas: penulisan yang gagal ke target cermin, atau “Tidak ada kegagalan replika yang tercatat.”',
  'help.ctx.admin-storage.bullet.2':
    '“Backend”: nama, jenis, pemakaian, dan tujuan pencerminannya, dengan “Uji”, “Edit”, dan “Hapus”. “Hitung sekarang” menghitung isi penyimpanan; backend yang ditentukan lewat variabel lingkungan hanya bisa dibaca.',
  'help.ctx.admin-storage.bullet.3':
    '“Kategori”: dokumen perjalanan, foto journey, sampul, foto profil, gambar tempat, cache foto, dan cadangan, masing-masing ditetapkan ke sebuah backend.',
  'help.ctx.admin-notifications.title': 'Notifikasi',
  'help.ctx.admin-notifications.summary':
    'Saluran yang disediakan instans bagi penggunanya, dan saluran yang kamu terima sebagai admin. Pengguna memilih topik dan URL mereka sendiri di “Pengaturan”; kamu menentukan saluran apa saja yang tersedia dan mengatur email.',
  'help.ctx.admin-notifications.bullet.1':
    'Email (SMTP), Webhook, Ntfy, dan Web Push masing-masing punya sakelar untuk menyediakan saluran itu bagi pengguna; email juga memerlukan pengaturan servernya. In-App selalu aktif.',
  'help.ctx.admin-notifications.bullet.2':
    '“Pengingat Perjalanan”: apakah server mengirim pengingat sebelum perjalanan dimulai.',
  'help.ctx.admin-notifications.bullet.3':
    'Webhook Admin, Ntfy Admin, dan kartu “Notifikasi”: tujuan peristiwa admin (“Versi baru tersedia”, “Kegagalan replika penyimpanan”, “Wilayah dayung diminta”), masing-masing dengan tombol uji.',
  'help.ctx.admin-mcp-tokens.title': 'Akses MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Semua token dan sesi OAuth yang dimiliki klien AI untuk TREK ini, dari semua pengguna. Kamu bisa mencabut yang mana saja.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '“Sesi OAuth”: klien, scope yang diberikan kepadanya, pemiliknya, dan tanggalnya, dengan ikon tempat sampah untuk mencabutnya.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    '“Token API”: nama, pemilik, “Dibuat”, dan “Terakhir Digunakan”, dengan ikon tempat sampah untuk menghapusnya.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Apa yang baru di TREK: riwayat rilis dari GitHub, dan apakah ada versi yang lebih baru dari versimu. Pembaruannya sendiri dilakukan di luar aplikasi, di host.',
  'help.ctx.admin-github.bullet.1':
    '“Riwayat Rilis” mencantumkan rilis dalam bentuk linimasa beserta catatannya. Rilis terbaru diberi label “Terbaru”, pra-rilis bertuliskan “Pra-rilis”, dan GitHub membuka halaman rilis.',
  'help.ctx.admin-github.bullet.2':
    '“Pembaruan tersedia” muncul di bawah header halaman begitu ada rilis yang lebih baru; “Cara Memperbarui” menampilkan perintah untuk Docker atau panduan pembaruan untuk instalasi lain.',
  'help.ctx.admin-backup.title': 'Cadangan',
  'help.ctx.admin-backup.summary':
    'Cadangan lengkap database dan unggahan, dibuat manual atau terjadwal, disimpan di server, dan bisa diunduh sebagai satu file. Pakai “Pulihkan” untuk mengembalikan cadangan.',
  'help.ctx.admin-backup.bullet.1':
    '“Pencadangan Data”: “Buat Cadangan” dan “Unggah Cadangan” di bagian atas kartu, serta daftar cadangan dengan “Unduh”, “Pulihkan”, dan ikon tempat sampah untuk menghapus.',
  'help.ctx.admin-backup.bullet.2':
    '“Unggah Cadangan” memulihkan dari file yang dibuat di instans lain atau di hari sebelumnya, setelah pertanyaan yang sama seperti “Pulihkan”.',
  'help.ctx.admin-backup.bullet.3':
    '“Cadangan Otomatis”: aktif atau mati, Interval, “Jalankan pada jam” dan harinya, serta “Hapus cadangan lama setelah” (dari 1 hari sampai “Simpan selamanya”), diterapkan dengan “Simpan”.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Log peristiwa penting terkait keamanan dan administrasi: login dan kegagalannya, perubahan MFA, perubahan pengguna dan pengaturan, pencadangan, dan pemulihan. Hanya bisa dibaca, mulai dari yang terbaru.',
  'help.ctx.admin-audit.bullet.1':
    'Satu baris per peristiwa, berisi waktu, pengguna, tindakan, sumber daya, IP, dan detail.',
  'help.ctx.admin-audit.bullet.2':
    '“Segarkan” di header kartu memuat ulang daftarnya. Lencana di samping judul menunjukkan berapa entri yang sudah dimuat dari totalnya, dan “Muat lebih banyak” memuat entri yang lebih lama.',
  // create-user
  'help.guide.create-user.title': 'Buat pengguna',
  'help.guide.create-user.goal': 'Tambahkan akun secara manual, tanpa undangan.',
  'help.guide.create-user.step.1': 'Klik “Buat Pengguna” di kanan atas kartu “Pengguna”.',
  'help.guide.create-user.step.2':
    'Isi “Nama pengguna”, “Email”, dan “Kata sandi”; daftar periksa di bawah kata sandi menunjukkan syarat mana yang sudah terpenuhi. Pilih “Peran”: “Pengguna” atau Administrator.',
  'help.guide.create-user.step.3': 'Klik “Buat Pengguna”.',
  'help.guide.create-user.result':
    'Akun muncul di tabel dan langsung bisa dipakai masuk. Berikan kata sandinya ke orang itu lewat saluran yang kamu percaya.',
  'help.guide.create-user.tip.1':
    'Untuk orang yang sebaiknya memilih kata sandinya sendiri, tautan undangan lebih cocok.',
  'help.guide.create-user.tip.2':
    'Administrator bisa melihat halaman ini dan boleh melakukan apa saja. Apa yang boleh dilakukan “Pengguna” di perjalanan diatur di “Pengaturan Izin” di bawah.',
  // edit-user
  'help.guide.edit-user.title': 'Mengubah detail atau kata sandi pengguna',
  'help.guide.edit-user.goal':
    'Ganti nama seseorang, naikkan atau turunkan perannya, atau bantu dia masuk lagi setelah lupa kata sandi.',
  'help.guide.edit-user.step.1':
    'Klik ikon pensil (“Edit Pengguna”) di baris pengguna. Dialog menampilkan email akun itu di bagian atas.',
  'help.guide.edit-user.step.2':
    'Ubah “Nama pengguna”, “Email”, atau “Peran”, atau ketik “Kata Sandi Baru” (biarkan kosong untuk tetap memakai yang sekarang), lalu klik “Simpan”. “Reset passkey”, di bagian bawah, menghapus semua passkey akun itu setelah kamu konfirmasi.',
  'help.guide.edit-user.result':
    'Perubahan langsung berlaku. Kata sandi baru juga mengeluarkan orang itu dari semua perangkat, jadi sesi lama tidak bisa dipakai lagi.',
  'help.guide.edit-user.tip.1': 'Kamu tidak bisa mencabut peran admin dari dirimu sendiri selama kamu admin terakhir.',
  'help.guide.edit-user.tip.2':
    'Mengatur ulang passkey tidak mengubah kata sandi. Pengguna itu menambahkan passkey baru lewat “Pengaturan”, “Akun”.',
  // invite-links
  'help.guide.invite-links.title': 'Undang orang lewat tautan',
  'help.guide.invite-links.goal':
    'Izinkan seseorang mendaftar di instans tertutup dan, kalau mau, langsung tambahkan ke sebuah perjalanan.',
  'help.guide.invite-links.step.1': 'Klik “Buat Tautan” di kanan atas kartu “Tautan Undangan”.',
  'help.guide.invite-links.step.2':
    'Pilih “Maks. Penggunaan” (1× sampai 5×, atau ∞) dan “Kedaluwarsa setelah” (1 hari sampai 14 hari, atau ∞), opsional sebuah perjalanan di bawah “Tambahkan ke perjalanan (opsional)”, lalu klik “Buat & Salin”.',
  'help.guide.invite-links.step.3':
    'Kirim tautannya. Setiap baris menunjukkan berapa kali tautan dipakai, kapan kedaluwarsa, perjalanan yang ditambahkannya, dan siapa pembuatnya, dengan status “Aktif”, “Kedaluwarsa”, atau “Habis dipakai” di sampingnya. “Salin tautan” menyalinnya lagi, dan ikon tempat sampah menghapusnya.',
  'help.guide.invite-links.result':
    'Siapa pun yang membuka tautan mendaftar dengan kata sandinya sendiri. Kalau ada perjalanan yang dipilih, dia langsung bergabung ke perjalanan itu.',
  'help.guide.invite-links.tip.1':
    'Tautan undangan tetap berfungsi meskipun “Pendaftaran dengan Kata Sandi” dimatikan di “Pengaturan”.',
  'help.guide.invite-links.tip.2':
    'Tautan sekali pakai dengan masa berlaku singkat adalah pilihan paling aman untuk satu orang.',
  // delete-user
  'help.guide.delete-user.title': 'Menghapus pengguna',
  'help.guide.delete-user.goal': 'Hapus akun beserta semua miliknya.',
  'help.guide.delete-user.step.1':
    'Klik ikon tempat sampah (“Hapus pengguna”) di baris pengguna, lalu konfirmasi dengan “Hapus”.',
  'help.guide.delete-user.result':
    'Akun itu dihapus, beserta semua perjalanan dan journey miliknya, termasuk perjalanan yang dibagikannya ke orang lain. Perjalanan yang hanya diikutinya sebagai anggota tetap ada pada pemiliknya.',
  'help.guide.delete-user.tip.1': 'Tindakan ini tidak bisa dibatalkan. Buat cadangan dulu kalau kamu ragu.',
  'help.guide.delete-user.tip.2':
    'Ikon tempat sampah di barismu sendiri tidak berfungsi: kamu tidak bisa menghapus akunmu sendiri. Admin lain yang harus melakukannya.',
  // permissions
  'help.guide.permissions.title': 'Atur siapa boleh melakukan apa',
  'help.guide.permissions.goal': 'Atur, per tindakan, peran mana yang boleh melakukannya di TREK ini.',
  'help.guide.permissions.step.1':
    'Di bawah “Pengaturan Izin”, cari tindakannya di kelompoknya, misalnya “Hapus perjalanan” di bawah “Manajemen Perjalanan”, lalu pilih siapa yang boleh melakukannya: “Semua orang”, “Anggota perjalanan”, “Pemilik perjalanan”, atau “Hanya Admin”. Baris yang diubah ditandai “dikustomisasi”.',
  'help.guide.permissions.step.2':
    'Klik “Simpan” di kanan atas kartu. “Kembalikan ke default” mengembalikan setiap baris ke tingkat bawaannya; setelah itu, klik “Simpan” juga.',
  'help.guide.permissions.result':
    'Aturan ini berlaku untuk semua perjalanan sekaligus. Pengguna di bawah tingkat itu tidak lagi melihat tombol dan menu terkait.',
  'help.guide.permissions.tip.1':
    '“Pemilik perjalanan” adalah orang yang membuat perjalanan; admin selalu boleh melakukan apa saja.',
  'help.guide.permissions.tip.2':
    'Setiap tindakan punya barisnya sendiri, jadi misalnya kamu bisa mengizinkan anggota merencanakan tempat dan hari, tapi hanya pemilik yang boleh menghapus perjalanan.',
  // default-map
  'help.guide.default-map.title': 'Mengatur default peta untuk pengguna baru',
  'help.guide.default-map.goal': 'Beri setiap akun baru peta yang langsung berfungsi tanpa token pribadi.',
  'help.guide.default-map.step.1':
    'Di bawah “Peta”, pilih “Template Peta” atau tempel URL tile, lalu isi “Kunci CARTO bersama” jika kamu memakai tile CARTO. Pratinjau di bawahnya menampilkan hasilnya.',
  'help.guide.default-map.step.2':
    'Lebih ke bawah, pilih “Mesin peta”: “Standar (gratis)”, Mapbox (3D), atau MapLibre (OpenFreeMap). Untuk Mapbox dan MapLibre, pilih “Gaya peta”; untuk Mapbox, tambahkan “Token Mapbox bersama” dan tentukan “Bangunan & medan 3D” serta “Mode kualitas tinggi”.',
  'help.guide.default-map.result':
    'Akun baru langsung memakai pengaturan ini. Pengguna yang sudah memilih petanya sendiri di “Pengaturan” tetap memakai pilihannya.',
  'help.guide.default-map.tip.1':
    'Token atau kunci yang diisi di sini dipakai bersama oleh semua orang yang tidak punya sendiri, jadi pantau kuotanya.',
  'help.guide.default-map.tip.2':
    'Akun lama yang belum pernah mengubah apa pun di tab peta juga memakai pengaturan default ini.',
  // packing-templates
  'help.guide.packing-templates.title': 'Buat template packing',
  'help.guide.packing-templates.goal':
    'Beri perjalanan daftar packing siap pakai sebagai titik awal, bukan daftar kosong.',
  'help.guide.packing-templates.step.1': 'Klik “Template Baru”, ketik namanya, lalu konfirmasi dengan tanda centang.',
  'help.guide.packing-templates.step.2':
    'Klik nama template untuk membukanya, lalu “Tambah kategori”. Tanda + di bagian atas kategori menambahkan item, dan item cukup diberi nama.',
  'help.guide.packing-templates.step.3':
    'Semuanya tersimpan otomatis sambil kamu bekerja. Ikon pensil mengganti nama template, kategori, atau item. Ikon tempat sampah langsung menghapus item. Untuk template atau kategori, TREK bertanya dulu, karena semua isinya ikut terhapus.',
  'help.guide.packing-templates.result':
    'Template itu tersedia di daftar bawaan setiap perjalanan; menerapkannya menyalin item-itemnya, jadi setiap perjalanan bebas mengubahnya.',
  'help.guide.packing-templates.tip.1':
    'Satu template untuk setiap jenis perjalanan (pantai, kota, pendakian) lebih praktis daripada satu daftar yang sangat panjang.',
  'help.guide.packing-templates.tip.2': 'Menghapus template tidak mengubah perjalanan yang sudah memakainya.',
  'help.guide.packing-templates.tip.3':
    '“Simpan sebagai template” pada daftar bawaan perjalanan membuat template berisi berat, jumlah, dan tas setiap item. Semua itu tampil di samping item di sini, dan saat template diterapkan, item-itemnya masuk ke tas yang sama.',
  // categories
  'help.guide.categories.title': 'Kelola daftar kategori',
  'help.guide.categories.goal': 'Tentukan kategori apa saja yang bisa dipakai tempat dan koleksi, serta tampilannya.',
  'help.guide.categories.step.1':
    'Klik “Kategori Baru”, ketik namanya di baris judul dialog, pilih “Ikon” dan “Warna”, lalu periksa “Pratinjau”. Klik “Buat”.',
  'help.guide.categories.step.2':
    'Di daftar, ikon pensil (“Edit”) membuka kategori, dan “Perbarui” menyimpannya. Ikon tempat sampah (“Hapus”) menghapusnya setelah kamu konfirmasi.',
  'help.guide.categories.result':
    'Daftar kategori ini langsung berlaku di mana saja: panel detail tempat, pin peta, Koleksi, dan filter.',
  'help.guide.categories.tip.1':
    'Tempat menyimpan ID kategorinya, jadi mengganti nama kategori juga mengganti namanya di semua tempat.',
  'help.guide.categories.tip.2':
    'Jika kamu menghapus kategori, tempat-tempatnya jadi tidak punya kategori. Jika itu penting, pindahkan dulu ke kategori lain.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Mengelola liburan sekolah secara manual',
  'help.guide.school-holiday-catalog.goal':
    'Kelola liburan sekolah suatu negara atau wilayah yang bisa dipilih semua orang di Vacay.',
  'help.guide.school-holiday-catalog.step.1':
    'Di bawah “Liburan sekolah”, pilih Negara, atau klik + (“Tambah negara”), isi Negara dan “Kode negara (mis. US)”, lalu “Simpan”. “Tambah wilayah” menambahkan setiap bagian negara yang punya tanggal liburnya sendiri.',
  'help.guide.school-holiday-catalog.step.2':
    'Klik wilayah untuk membuka “Wilayah atau distrik sekolah”: “Tambah periode liburan”, beri setiap periode “Nama liburan”, “Tanggal mulai”, dan “Tanggal selesai”, lalu “Simpan”. Ikon tempat sampah menghapus periode atau wilayah; negara bisa dihapus setelah tidak punya wilayah lagi.',
  'help.guide.school-holiday-catalog.result':
    'Pengguna bisa memilih negara dan wilayah itu di “Pengaturan” Vacay dan melihat periodenya di kisi tahunan mereka.',
  'help.guide.school-holiday-catalog.tip.1':
    'Wilayah yang sudah dipilih seseorang di kalender Vacay-nya tidak bisa dihapus.',
  // auth-methods
  'help.guide.auth-methods.title': 'Atur cara pengguna masuk',
  'help.guide.auth-methods.goal':
    'Aktifkan atau matikan login dengan kata sandi, SSO, dan pendaftaran, serta wajibkan 2FA.',
  'help.guide.auth-methods.step.1':
    'Di bawah “Metode Autentikasi”, aktifkan atau matikan “Login dengan Kata Sandi” dan “Pendaftaran dengan Kata Sandi”; setiap sakelar langsung berlaku. Jika pendaftaran dimatikan, akun baru hanya bisa dibuat lewat tautan undangan, SSO, atau “Buat Pengguna”.',
  'help.guide.auth-methods.step.2':
    '“Login SSO” dan “Penyediaan Otomatis SSO” butuh “Single Sign-On (OIDC)” yang dikonfigurasi di bawahnya. Penyediaan otomatis membuat akun saat seseorang pertama kali masuk lewat SSO.',
  'help.guide.auth-methods.step.3':
    'Aktifkan “Wajibkan autentikasi dua faktor (2FA)” agar semua orang yang belum memakai 2FA harus mengaturnya dulu di “Pengaturan” sebelum bisa memakai TREK.',
  'help.guide.auth-methods.result': 'Halaman masuk hanya menawarkan metode yang kamu biarkan aktif.',
  'help.guide.auth-methods.tip.1':
    'TREK tidak akan membiarkanmu mematikan metode login terakhir: sakelarnya menjadi abu-abu, dan tooltip-nya bertuliskan “Setidaknya satu metode login harus tetap aktif”.',
  'help.guide.auth-methods.tip.2':
    'Jika OIDC_ONLY diatur di server, sakelar kata sandi terkunci dan ada keterangan tentang hal itu.',
  // oidc
  'help.guide.oidc.title': 'Menghubungkan single sign-on',
  'help.guide.oidc.goal': 'Izinkan orang masuk dengan penyedia identitasmu.',
  'help.guide.oidc.step.1':
    'Di bawah Single Sign-On (OIDC), isi “Nama Tampilan” untuk tombolnya, Issuer URL, “ID Klien”, dan “Rahasia Klien” dari penyediamu. Isi “URL discovery (opsional)” hanya jika penyediamu tidak menerbitkannya di alamat yang biasa, seperti Authentik. Klik “Simpan”.',
  'help.guide.oidc.step.2': 'Aktifkan “Login SSO” di bawah “Metode Autentikasi”.',
  'help.guide.oidc.result':
    'Halaman masuk menampilkan tombol SSO. Kalau “Penyediaan Otomatis SSO” aktif, pengguna yang baru pertama kali masuk langsung mendapat akun.',
  'help.guide.oidc.tip.1':
    'URI pengalihan yang dibutuhkan penyedia adalah alamat TREK-mu ditambah jalur callback OIDC dari dokumentasi.',
  'help.guide.oidc.tip.2':
    'Pemetaan klaim menentukan grup SSO mana yang menjadi admin. Lihat halaman OIDC di dokumentasi.',
  // instance-keys
  'help.guide.instance-keys.title': 'Memasukkan kunci API',
  'help.guide.instance-keys.goal':
    'Tambahkan foto dan rating Google, sampul Unsplash, dan pencarian Amap untuk seluruh instans.',
  'help.guide.instance-keys.step.1':
    'Di bawah “Kunci API”, TREK Places API di bagian atas sudah menangani pencarian tempat tanpa kunci. “Apa isinya” menjelaskan apa yang dicakup dan apa yang tidak.',
  'help.guide.instance-keys.step.2':
    'Untuk foto, rating, dan jam buka, tempel “Kunci API Google Maps” lalu klik “Uji”; hasilnya “Terhubung” atau “Tidak valid”. Buka “Kunci ini dipakai untuk apa” dan aktifkan hanya yang ingin kamu bayar: “Foto Tempat”, “Pelengkapan Otomatis Tempat”, “Detail Tempat”, “Pengayaan tempat”, dan “Cari hanya dengan Google”, ditambah “Batas harian panggilan Google”.',
  'help.guide.instance-keys.step.3':
    'Tempel “Kunci API Unsplash” untuk pencarian sampul dan “Kunci API Amap (高德地图)” untuk pencarian tempat di Tiongkok daratan, lalu klik “Simpan” di bagian bawah kartu.',
  'help.guide.instance-keys.result':
    'Pengguna bisa memakai fitur-fiturnya tanpa kunci sendiri. Tanpa kunci Google, pencarian memakai TREK Places API dan OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Jika pengguna punya kunci pribadi di “Pengaturan”, TREK memakai kunci itu untuk pengguna tersebut, bukan kunci instans.',
  'help.guide.instance-keys.tip.2':
    'Kunci juga bisa berasal dari variabel lingkungan; kunci seperti itu tampil sebagai baca saja di sini.',
  'help.guide.instance-keys.tip.3':
    '“Batas harian panggilan Google” membatasi berapa banyak biaya yang boleh dipakai TREK untuk kunci itu per hari. Lencana di samping judul menghitung panggilan hari ini. Begitu batasnya tercapai, pencarian memakai OpenStreetMap sampai hari berikutnya (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Pilih penyedia pencarian dan transportasi umum',
  'help.guide.places-transit.goal':
    'Pilih layanan yang menangani pencarian tempat dan permintaan rute transportasi umum.',
  'help.guide.places-transit.step.1':
    'Di bawah “Penyedia transportasi umum”, pilih “Transitous (gratis)”, yang tidak perlu kunci dan paling lengkap di Eropa, atau Google, yang memakai kunci Google. Pilihan langsung tersimpan.',
  'help.guide.places-transit.step.2':
    'Di bawah “Penyedia pencarian tempat”, pilih layanan yang dipakai TREK jika indeks TREK dan OpenStreetMap tidak menemukan apa pun: “Otomatis” (Google jika ada kuncinya, lalu Amap), Google Places, Amap (高德地图), atau OpenStreetMap.',
  'help.guide.places-transit.result': 'Semua kotak pencarian dan rute transportasi umum di TREK memakai pilihan ini.',
  'help.guide.places-transit.tip.1':
    'Pilihan yang kuncinya belum diisi menampilkan peringatan di sini. Pencarian tempat lalu hanya memakai indeks TREK dan OpenStreetMap, dan transportasi umum hanya memakai Transitous.',
  'help.guide.places-transit.tip.2': 'Rute transportasi umum Google ditagih per permintaan; Transitous tidak.',
  // file-types
  'help.guide.file-types.title': 'Membatasi jenis file',
  'help.guide.file-types.goal': 'Tentukan ekstensi file apa saja yang boleh diunggah.',
  'help.guide.file-types.step.1':
    'Di bawah “Jenis File yang Diizinkan”, edit daftar ekstensi yang dipisahkan koma, atau isi * untuk mengizinkan semua jenis, lalu klik “Simpan”.',
  'help.guide.file-types.result':
    'Unggahan dengan jenis lain ditolak disertai pesan yang jelas, baik di dokumen, jurnal, maupun sampul.',
  'help.guide.file-types.tip.1':
    'Jangan hapus jenis gambar dari daftar, karena sampul dan foto journey juga diperiksa dengan daftar yang sama.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Aktifkan atau matikan addon',
  'help.guide.toggle-addon.goal': 'Sediakan modul fitur untuk semua orang, atau hapus.',
  'help.guide.toggle-addon.step.1':
    'Klik sakelar di kotak addon. Menu navigasinya langsung muncul atau hilang bagi semua orang.',
  'help.guide.toggle-addon.step.2':
    'Beberapa kotak punya sub-baris untuk opsinya, misalnya “Pelacak Tas” di bawah “Daftar” atau penyedia foto di bawah Journey; sub-baris itu hanya tampil selama addon aktif.',
  'help.guide.toggle-addon.result':
    'Saat addon dimatikan, datanya tetap tersimpan. Saat diaktifkan lagi, datanya muncul kembali.',
  'help.guide.toggle-addon.tip.1':
    'Mematikan MCP akan menghapus endpoint beserta bagian “Integrasi” yang bergantung padanya.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas, dan Journey adalah addon yang paling sering diminta pengguna. “Dokumen” butuh penyimpanan untuk unggahan.',
  // install-plugin
  'help.guide.install-plugin.title': 'Pasang plugin',
  'help.guide.install-plugin.goal': 'Tambahkan plugin pihak ketiga dan beri izin persis seperti yang dimintanya.',
  'help.guide.install-plugin.step.1':
    'Buka “Jelajahi”, cari plugin lewat “Cari plugin…” atau filter “Jenis”, lalu klik “Pasang”. Untuk file paket, klik “Unggah plugin” (ikon awan di kanan atas kartu), atau jatuhkan file .zip ke halaman.',
  'help.guide.install-plugin.step.2':
    'Di bawah “Terpasang”, baca barisnya: apa saja yang boleh diakses plugin, host yang dihubunginya, dan apakah sudah “Ditinjau” dan “Ditandatangani”. Lalu aktifkan “Aktifkan plugin”; barisnya menampilkan “Aktif”.',
  'help.guide.install-plugin.step.3':
    'Menu ⋯ di baris itu menawarkan “Mulai ulang”, “Lihat log error”, “Host yang diizinkan”, dan “Ubah versi…”, serta tautan ke kode sumbernya; “Hapus” mencopot plugin beserta datanya. Versi yang lebih baru tampil sebagai pembaruan di baris itu, dan versi yang meminta hak akses baru tetap mati sampai kamu menyetujuinya.',
  'help.guide.install-plugin.result':
    'Plugin berjalan di prosesnya sendiri. Apa pun yang ditambahkannya, seperti widget, lapisan peta, atau alat, muncul di tempat yang ditentukan plugin itu.',
  'help.guide.install-plugin.tip.1':
    '“Pindai ulang” menemukan folder plugin yang ditautkan untuk pengembangan tanpa paket.',
  'help.guide.install-plugin.tip.2':
    'Plugin yang tidak bertanda tangan ditandai demikian; pasang hanya jika kamu memercayai sumbernya.',
  // storage-backends
  'help.guide.storage-backends.title': 'Pindahkan unggahan ke S3 atau buat cerminannya',
  'help.guide.storage-backends.goal': 'Simpan file di penyimpanan objek, atau salin setiap unggahan ke backend kedua.',
  'help.guide.storage-backends.step.1':
    'Di bawah “Backend”, klik “Tambah backend”, beri “Nama”, pilih “Jenis”, “Lokal” atau S3, lalu isi kolom-kolomnya. Untuk menyimpan salinan di tempat lain, centang “Target cermin”. Klik “Terapkan”, lalu “Uji” pada baris baru untuk memeriksa koneksinya.',
  'help.guide.storage-backends.step.2':
    'Di bawah “Kategori”, tetapkan setiap jenis unggahan, misalnya “Dokumen perjalanan”, “Foto Journey”, atau “Cadangan”, ke sebuah backend.',
  'help.guide.storage-backends.step.3':
    'Klik “Simpan perubahan” di bagian bawah. Jika ada kategori yang sekarang mengarah ke tempat lain, TREK bertanya apakah akan “Pindahkan objek yang ada” atau “Hanya arahkan penulisan baru”.',
  'help.guide.storage-backends.result':
    'Unggahan baru masuk ke backend yang ditetapkan. File yang dipindahkan dilayani dari sana, dan yang kamu pilih untuk tidak dipindahkan tetap di tempatnya.',
  'help.guide.storage-backends.tip.1':
    'Backend yang dikonfigurasi lewat variabel lingkungan tetap ditampilkan, tetapi tidak bisa diedit di sini.',
  'help.guide.storage-backends.tip.2':
    'Target cermin mendapat salinan setiap penulisan baru; “Sinkronkan sekarang” di barisnya menyalin data yang sudah tersimpan sebelumnya. Target yang lambat akan memperlambat semua unggahan di backend itu.',
  // channels-instance
  'help.guide.channels-instance.title': 'Atur saluran notifikasi',
  'help.guide.channels-instance.goal': 'Tentukan saluran mana yang boleh dipilih pengguna, dan atur email.',
  'help.guide.channels-instance.step.1':
    'Aktifkan Email (SMTP) di header kartunya, isi SMTP Host, SMTP Port, SMTP User, SMTP Password, dan From Address, lalu klik “Simpan”. “Kirim email uji” mengirim email ke alamatmu. “Lewati pemeriksaan sertifikat TLS” hanya untuk server email lokal yang memakai sertifikatnya sendiri.',
  'help.guide.channels-instance.step.2':
    'Aktifkan Webhook, Ntfy, dan Web Push agar bisa dipakai pengguna. Pengguna lalu mengisi URL atau topik mereka sendiri, atau mengaktifkan push per perangkat, di “Pengaturan”, “Notifikasi”.',
  'help.guide.channels-instance.step.3':
    '“Pengingat Perjalanan” menyalakan atau mematikan pengingat sebelum perjalanan dimulai; In-App selalu aktif.',
  'help.guide.channels-instance.result':
    'Tab “Notifikasi” milik setiap pengguna menampilkan saluran yang kamu aktifkan.',
  'help.guide.channels-instance.tip.1':
    '“URL Server Ntfy” di kartu Ntfy Admin juga menjadi server default bagi pengguna. Pengguna tetap bisa memakai server mereka sendiri.',
  'help.guide.channels-instance.tip.2':
    'Saluran plugin otomatis muncul begitu ada plugin aktif yang punya kemampuan itu.',
  // admin-channels
  'help.guide.admin-channels.title': 'Menerima peristiwa admin di ponselmu',
  'help.guide.admin-channels.goal':
    'Dapatkan notifikasi tentang rilis baru, cermin penyimpanan yang gagal, dan permintaan wilayah dayung.',
  'help.guide.admin-channels.step.1':
    'Di bawah Ntfy Admin, isi “Topik Admin” dan, jika perlu, “URL Server Ntfy” dan “Token Akses (opsional)”; di bawah Webhook Admin, isi URL-nya. Klik “Simpan” di setiap kartu.',
  'help.guide.admin-channels.step.2': 'Klik “Kirim uji Ntfy” atau “Kirim test webhook” untuk melihat pesannya sampai.',
  'help.guide.admin-channels.result':
    'Peristiwa admin dikirim ke setiap admin di aplikasi dan, jika kamu mengaktifkannya, juga ke topik ntfy dan webhook admin.',
  'help.guide.admin-channels.tip.1':
    'Pisahkan topik admin dari topik pribadimu, supaya pesan gangguan tidak tenggelam di antara pesan perjalanan.',
  'help.guide.admin-channels.tip.2':
    'Webhook dan topik admin terpisah dari saluran pribadimu di “Pengaturan”, “Notifikasi”.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Cabut akses AI',
  'help.guide.mcp-tokens-admin.goal':
    'Lihat dan cabut semua token dan sesi yang dimiliki klien AI, untuk pengguna mana pun.',
  'help.guide.mcp-tokens-admin.step.1':
    'Di bawah “Sesi OAuth”, cari klien berdasarkan nama dan pemiliknya; chip-nya menunjukkan scope yang diberikan. Ikon tempat sampah mencabut sesi setelah kamu konfirmasi.',
  'help.guide.mcp-tokens-admin.step.2':
    'Di bawah “Token API”, hal yang sama untuk token: nama, pemilik, “Dibuat”, dan “Terakhir Digunakan”. Ikon tempat sampah menghapus token, dan kliennya langsung berhenti berfungsi.',
  'help.guide.mcp-tokens-admin.result':
    'Pengguna klien itu harus menghubungkannya lagi. Tidak ada hal lain yang berubah.',
  'help.guide.mcp-tokens-admin.tip.1':
    '“Cakupan” menunjukkan apa yang bisa dilakukan sebuah klien; cakupan baca saja aman untuk dibiarkan.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Mematikan addon MCP langsung menghentikan semua klien dan menyembunyikan tab ini, tapi tidak menghapus apa pun: token berfungsi lagi begitu addon diaktifkan kembali.',
  // release-history
  'help.guide.release-history.title': 'Memeriksa rilis baru',
  'help.guide.release-history.goal':
    'Ketahui apakah TREK-mu sudah versi terbaru dan apa saja yang dibawa versi berikutnya.',
  'help.guide.release-history.step.1':
    'Jika ada rilis yang lebih baru, “Pembaruan tersedia” tampil di bawah header halaman beserta versi yang kamu jalankan. “Lihat di GitHub” membuka rilisnya, dan “Cara Memperbarui” menampilkan perintah untuk Docker atau panduan pembaruan untuk instalasi lain.',
  'help.guide.release-history.step.2':
    '“Riwayat Rilis” menampilkan setiap rilis beserta catatannya. “Tampilkan detail” membuka catatan itu, rilis terbaru diberi label “Terbaru”, dan “Muat lebih banyak” menampilkan rilis yang lebih lama.',
  'help.guide.release-history.result':
    'Pembaruan dilakukan di host, dengan menarik image baru atau membangun tag baru. Direktori data tetap utuh.',
  'help.guide.release-history.tip.1': 'Buat cadangan sebelum memperbarui. Tab “Cadangan” ada di sebelah tab ini.',
  'help.guide.release-history.tip.2':
    'Pra-rilis ditampilkan, tetapi tidak diumumkan sebagai pembaruan, kecuali kamu sedang menjalankan versi pra-rilis.',
  // create-backup
  'help.guide.create-backup.title': 'Membuat dan memulihkan cadangan',
  'help.guide.create-backup.goal':
    'Cadangkan seluruh instans, simpan salinannya di tempat lain, dan pastikan bisa dipulihkan.',
  'help.guide.create-backup.step.1':
    'Di bawah “Pencadangan Data”, klik “Buat Cadangan” di kanan atas. Database dan unggahan disimpan dalam satu file di server.',
  'help.guide.create-backup.step.2':
    '“Unduh” menyimpan salinannya di luar server; ikon tempat sampah menghapus cadangan lama setelah kamu konfirmasi.',
  'help.guide.create-backup.step.3':
    '“Pulihkan” pada sebuah cadangan, atau “Unggah Cadangan” dengan sebuah file, akan mengganti semua data saat ini begitu kamu klik “Ya, pulihkan” di dialog “Pulihkan Cadangan?”.',
  'help.guide.create-backup.result':
    'Pemulihan mengembalikan pengguna, perjalanan, file, dan pengaturan persis seperti saat cadangan itu dibuat.',
  'help.guide.create-backup.tip.1':
    'Pemulihan adalah satu-satunya tindakan di sini yang tidak bisa dibatalkan. Buat cadangan baru dulu.',
  'help.guide.create-backup.tip.2':
    'Cadangan disimpan di direktori data. Salin ke mesin lain supaya tetap aman kalau mesin ini rusak.',
  // auto-backup
  'help.guide.auto-backup.title': 'Jadwalkan pencadangan',
  'help.guide.auto-backup.goal': 'Biarkan server membuat cadangan sendiri dan membersihkan cadangan lama.',
  'help.guide.auto-backup.step.1':
    'Di bawah “Cadangan Otomatis”, aktifkan “Aktifkan cadangan otomatis” dan pilih Interval (“Per jam”, “Harian”, “Mingguan”, atau “Bulanan”), “Jalankan pada jam”, dan untuk mingguan atau bulanan, “Hari dalam seminggu” atau “Tanggal dalam sebulan”.',
  'help.guide.auto-backup.step.2':
    'Di bawah “Hapus cadangan lama setelah”, pilih berapa lama cadangan disimpan, dari 1 hari sampai “Simpan selamanya”, lalu klik “Simpan”.',
  'help.guide.auto-backup.result':
    'Cadangan muncul di daftar sesuai jadwal. Cadangan lama dihapus begitu umurnya melewati batas yang kamu pilih.',
  'help.guide.auto-backup.tip.1':
    '“Jalankan pada jam” memakai waktu server; petunjuk di bawahnya menunjukkan zona waktu server.',
  'help.guide.auto-backup.tip.2':
    'Ruang penyimpanan di server terbatas: 7 atau 14 hari biasanya sudah cukup, dengan salinan unduhan yang disimpan di tempat lain.',
  // audit-log
  'help.guide.audit-log.title': 'Baca log audit',
  'help.guide.audit-log.goal': 'Cari tahu siapa melakukan apa, dan kapan.',
  'help.guide.audit-log.step.1':
    'Baca barisnya, mulai dari yang terbaru: “Waktu”, “Pengguna”, “Tindakan”, “Sumber Daya”, IP, dan “Detail”. Tindakan dinamai sesuai kejadiannya, misalnya login gagal, perubahan MFA, atau pemulihan.',
  'help.guide.audit-log.step.2':
    '“Segarkan” di kanan atas memuat ulang daftarnya. Lencana di samping judul menunjukkan berapa entri yang sudah dimuat dari totalnya, dan “Muat lebih banyak” memuat entri yang lebih lama.',
  'help.guide.audit-log.result':
    'Kamu punya catatan yang bisa ditunjukkan ke siapa pun yang bertanya kenapa sesuatu berubah.',
  'help.guide.audit-log.tip.1': 'Waktu ditampilkan dalam zona waktu server.',
  'help.guide.audit-log.tip.2': 'Log ini hanya bisa ditambah; tidak ada yang bisa diedit atau dihapus dari aplikasi.',
  // document-providers
  'help.guide.document-providers.title': 'Sediakan penyimpanan dokumen',
  'help.guide.document-providers.goal':
    'Tentukan penyimpanan mana saja yang bisa dipakai perjalanan untuk menyinkronkan dokumennya.',
  'help.guide.document-providers.step.1':
    'Kotak “Dokumen” mencantumkan penyimpanan sebagai baris-baris: Paperless-ngx, Papra, Nextcloud, OpenCloud, dan Synology Drive. Kelimanya mati sejak awal, dan baris-barisnya hanya tampil selama “Dokumen” sendiri aktif.',
  'help.guide.document-providers.step.2':
    'Aktifkan sakelar di baris Nextcloud. Muncul pesan “Addon diperbarui”, dan mulai saat itu pemilik perjalanan menemukan “Sinkronisasi dokumen” di tab “File” perjalanan mereka, dengan Nextcloud di bawah “Hubungkan penyedia”.',
  'help.guide.document-providers.result':
    'Penyimpanan itu tersedia di semua perjalanan di TREK ini. Tidak ada yang terhubung sampai pemilik perjalanan menghubungkannya.',
  'help.guide.document-providers.tip.1':
    'Di sini hanya ditentukan apakah sebuah penyimpanan boleh ditawarkan. Alamat dan kredensialnya milik masing-masing perjalanan dan diisi oleh pemilik perjalanan di tab “File”, tidak pernah di panel admin.',
  'help.guide.document-providers.tip.2':
    'Mematikan “Dokumen” juga mematikan semua penyimpanan, dan penyimpanan tidak bisa diaktifkan selama “Dokumen” mati: server membalas “Enable the Documents addon first”. Penyimpanan di jaringanmu sendiri juga butuh ALLOW_INTERNAL_NETWORK=true di server.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Perjalanan',
  'help.ctx.trip.summary':
    'Semua tentang satu perjalanan: rencana dengan hari, peta, dan tempatnya, serta tab untuk tur, transportasi, pemesanan, daftar, biaya, file, kolaborasi, dan jurnal yang ditautkan. Masing-masing punya layar bantuannya sendiri di bawah layar ini.',
  'help.ctx.trip.bullet.1':
    'Bar tab di bawah bar atas: “Rencana”, “Tur”, “Transportasi”, “Pemesanan”, “Daftar”, “Biaya”, “File”, “Kolab”, dan, setelah jurnal ditautkan, “Jurnal”. Addon dan plugin menentukan tab mana saja yang ada di TREK-mu.',
  'help.ctx.trip.bullet.2':
    '“Rencana” punya tiga kolom: hari di kiri, peta di tengah, dan tempat di kanan. Dengan addon “Perjalanan darat”, kolom hari diawali sakelar “Hari” dan “Perjalanan darat”; dengan addon Tur, kolom tempat diawali “Tempat” dan “Tur”. Pemesanan dan transportasi adalah bagian dari rencana, di perhentian dan di antara perhentian; tab-tabnya menampilkan daftarnya.',
  'help.ctx.trip.bullet.3':
    '“Pengaturan perjalanan”, pil di samping nama perjalanan di kiri atas, membuka pengaturan perjalanan: “Orang” (anggota dan tamu), “Berbagi” (tautan publik baca saja dan tautan undangan), dan “Jurnal”.',
  'help.ctx.trip.bullet.4':
    'Judul, tanggal, sampul, dan mata uang diedit dari “Perjalananku”, lewat ikon pensil di kartu perjalanan. Nama perjalanan di kiri atas membawamu kembali ke sana.',
  'help.ctx.trip.bullet.5':
    'Tab di tepi dalam kolom untuk melipat kolom itu, dan peta memakai ruang kosongnya. Kolom yang terlipat menampilkan kotak kecil di pojok atas peta; klik untuk menampilkan kolomnya lagi. Seret pembatas tipis di samping kolom untuk mengubah lebarnya.',
  'help.ctx.trip.bullet.6':
    'Panah urungkan di toolbar hari membatalkan perubahan terbarumu pada rencana, satu per satu.',
  // add-member
  'help.guide.add-member.title': 'Tambah anggota',
  'help.guide.add-member.goal': 'Beri akses perjalanan ini ke orang yang punya akun TREK.',
  'help.guide.add-member.step.1':
    'Klik “Pengaturan perjalanan”, pil di samping nama perjalanan di kiri atas. Halaman terbuka di “Orang”.',
  'help.guide.add-member.step.2':
    'Di bawah “Undang Pengguna”, pilih orangnya dari “Pilih pengguna…”, lalu klik “Undang”.',
  'help.guide.add-member.step.3':
    'Orang itu sekarang muncul di bawah “Akses”. Lencana “Pemilik” menandai pemiliknya. “Hapus akses” di ujung baris mengeluarkan orang itu setelah kamu konfirmasi.',
  'help.guide.add-member.result':
    'Anggota bisa melihat dan mengedit perjalanan seperti kamu, sesuai batas yang diatur admin di “Pengaturan Izin”.',
  'help.guide.add-member.tip.1':
    'Orang yang tidak ada di daftar belum punya akun TREK. Tambahkan sebagai tamu, atau minta dia mendaftar lewat tautan undangan.',
  'help.guide.add-member.tip.2':
    'Angka di samping “Akses” menunjukkan jumlah orang dalam perjalanan; tamu dicantumkan terpisah di bawahnya.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Mengundang lewat tautan',
  'help.guide.trip-invite-link.goal': 'Biarkan orang bergabung sendiri ke perjalanan.',
  'help.guide.trip-invite-link.step.1':
    'Klik “Pengaturan perjalanan” di samping nama perjalanan, lalu pilih “Berbagi” di kiri. Di bawah “Tautan undangan perjalanan”, klik “Buat tautan undangan”.',
  'help.guide.trip-invite-link.step.2':
    'Klik “Salin” lalu kirim tautannya. Siapa pun yang punya akun TREK dan membukanya akan bergabung sebagai anggota.',
  'help.guide.trip-invite-link.step.3':
    '“Buat ulang” mengganti tautan sehingga tautan lama tidak berlaku lagi. “Nonaktifkan” mematikan tautannya.',
  'help.guide.trip-invite-link.result':
    'Siapa pun yang membuka tautan akan bergabung ke perjalanan dan tercantum di “Akses”.',
  'help.guide.trip-invite-link.tip.1':
    'Orang yang belum punya akun tidak bisa memakainya. Admin membuat tautan pendaftaran di “Admin”, “Pengguna”, dan bisa menautkannya ke perjalanan ini.',
  'help.guide.trip-invite-link.tip.2':
    'Buat ulang tautannya jika kamu mengirimnya ke obrolan yang salah: tautan lama langsung tidak berfungsi.',
  // add-guest
  'help.guide.add-guest.title': 'Menambahkan tamu tanpa akun',
  'help.guide.add-guest.goal': 'Tambahkan orang yang tidak memakai TREK ke perjalanan.',
  'help.guide.add-guest.step.1':
    'Klik “Pengaturan perjalanan” di samping nama perjalanan. Di “Orang”, “Tamu” adalah bagian terakhir, di bawah “Akses”.',
  'help.guide.add-guest.step.2': 'Ketik namanya di “Nama tamu”, lalu klik “Tambah tamu”.',
  'help.guide.add-guest.result':
    'Tamu bisa dimasukkan ke biaya, barang bawaan, dan tugas, tetapi tidak bisa masuk ke akun.',
  'help.guide.add-guest.tip.1':
    '“Ganti nama” (ikon pensil) mengubah nama tamu. “Hapus akses” (ikon tempat sampah) mengeluarkan tamu setelah kamu konfirmasi: tugas-tugasnya dihapus, dan bagiannya di setiap pengeluaran dibagi ke orang lain dalam pembagian itu.',
  'help.guide.add-guest.tip.2': 'Kalau orang itu nanti punya akun, undang dia sebagai anggota dan hapus tamunya.',
  // public-link
  'help.guide.public-link.title': 'Terbitkan tautan hanya untuk dilihat',
  'help.guide.public-link.goal': 'Tunjukkan perjalanan kepada orang yang tidak boleh mengeditnya.',
  'help.guide.public-link.step.1':
    'Klik “Pengaturan perjalanan” di samping nama perjalanan, lalu pilih “Berbagi” di kiri.',
  'help.guide.public-link.step.2':
    'Di kartu “Tautan Publik”, aktifkan apa saja yang boleh ditampilkan tautan itu. “Peta & Rencana” selalu aktif; “Pemesanan”, “Perlengkapan”, “Biaya”, dan Obrolan bisa kamu pilih.',
  'help.guide.public-link.step.3':
    'Di bawah “Pilihan”, “Hanya perjalanan & penginapan” tidak menyertakan aktivitas, catatan hari, dan hari kosong. “Tanpa foto” tidak menyertakan foto tempat.',
  'help.guide.public-link.result':
    'Siapa pun yang punya tautannya bisa melihat bagian yang dipilih tanpa login dan tidak bisa mengubah apa pun.',
  'help.guide.public-link.tip.1':
    'Tautan ini tidak tercantum di mana pun, tapi siapa pun yang memilikinya bisa membukanya. Jaga kerahasiaannya seperti kata sandi.',
  'help.guide.public-link.tip.2': 'Kalau ingin memberi hak edit, tambahkan orang itu sebagai anggota.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Serahkan perjalanan atau keluar dari perjalanan',
  'help.guide.transfer-ownership.goal':
    'Jadikan orang lain sebagai pemilik, atau keluar dari perjalanan yang bukan milikmu.',
  'help.guide.transfer-ownership.step.1':
    'Klik “Pengaturan perjalanan” di samping nama perjalanan. Di bawah “Akses”, klik “Jadikan pemilik” (ikon mahkota) di baris anggota, lalu konfirmasi.',
  'help.guide.transfer-ownership.step.2':
    '“Keluar dari perjalanan” di barismu sendiri mengeluarkanmu dari perjalanan setelah kamu konfirmasi. Jika kamu pemiliknya, serahkan kepemilikan dulu.',
  'help.guide.transfer-ownership.result':
    'Pemilik baru mengelola anggota dan bisa menghapus perjalanan. Kamu tetap menjadi anggota biasa.',
  'help.guide.transfer-ownership.tip.1':
    'Pemilik adalah orang yang membuat perjalanan, sampai kepemilikannya diserahkan. Hanya pemilik yang bisa menghapus perjalanan.',
  'help.guide.transfer-ownership.tip.2':
    '“Hapus akses” di baris anggota lain bekerja sebaliknya: pemilik mengeluarkan anggota itu dari perjalanan.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Memberi ruang lebih untuk peta',
  'help.guide.collapse-columns.goal': 'Ciutkan kolom atau buat lebih lebar.',
  'help.guide.collapse-columns.step.1':
    'Klik tab berikon panel di tepi dalam kolom hari untuk menciutkan kolom itu. Peta akan memakai ruang yang kosong. Kolom tempat punya tab yang sama.',
  'help.guide.collapse-columns.step.2':
    'Saat kolom dilipat, kotak kecil berikon panel muncul di pojok atas peta; tooltip-nya bertuliskan “Rencana” atau “Tempat”. Klik kotak itu untuk menampilkan kolomnya lagi.',
  'help.guide.collapse-columns.step.3': 'Seret pembatas tipis antara kolom dan peta untuk mengubah lebar kolom.',
  'help.guide.collapse-columns.result': 'Lebar kolom diingat. Kolom terbuka lagi saat kamu kembali nanti.',
  'help.guide.collapse-columns.tip.1': 'Kamu bisa melipat kedua kolom sekaligus untuk melihat petanya saja.',
  'help.guide.collapse-columns.tip.2':
    'Di jendela yang sempit hanya muat satu kolom: membuka satu kolom akan melipat kolom lainnya. Di ponsel tidak ada kolom; “Perjalanan”, “Rencana”, dan “Tempat” di bagian atas untuk berpindah antartampilan.',
  // undo-change
  'help.guide.undo-change.title': 'Membatalkan perubahan terakhir',
  'help.guide.undo-change.goal': 'Batalkan perubahan terakhirmu pada rencana.',
  'help.guide.undo-change.step.1':
    'Klik panah urungkan di bilah alat di atas daftar hari. Tooltip-nya menyebutkan perubahan yang akan diurungkan.',
  'help.guide.undo-change.result': 'Rencana kembali seperti semula, dan pesan singkat menyebutkan apa yang dibatalkan.',
  'help.guide.undo-change.tip.1':
    '“Urungkan” berlaku untuk rencana: menambah, menjadwalkan, menghapus, mengurutkan ulang, memindahkan, dan mengunci tempat, mengosongkan hari, mengoptimalkan rute, menghapus tempat, mengubah kategori, dan impor.',
  'help.guide.undo-change.tip.2':
    'Klik lagi untuk mundur lebih jauh: TREK menyimpan 30 perubahan terakhirmu di perjalanan ini, mulai dari yang terbaru, sampai kamu keluar dari perjalanan itu.',
  'help.guide.clear-day.title': 'Kosongkan hari',
  'help.guide.clear-day.goal':
    'Hapus semua tempat dari suatu hari sekaligus, misalnya untuk merencanakan hari itu dari awal lagi.',
  'help.guide.clear-day.step.1': 'Klik kanan header hari di rencana.',
  'help.guide.clear-day.step.2': 'Pilih “Kosongkan hari”, lalu konfirmasi.',
  'help.guide.clear-day.result':
    'Hari itu kosong dan tempat-tempatnya kembali ke daftar sebagai belum direncanakan. Panah urungkan di atas daftar hari bisa mengembalikannya.',
  'help.guide.clear-day.tip.1': 'Hanya tempatnya yang dihapus. Catatan dan pemesanan di hari itu tetap ada.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Tempat',
  'help.ctx.trip-places.summary':
    'Kolom kanan rencana: semua tempat dalam perjalanan, yang sudah maupun belum direncanakan, dengan pencarian, filter, dan pengurutan, serta cara menambahkan tempat: lewat pencarian, secara manual, atau dari daftar yang dibagikan. “Tempat” dan “Tur” di bagian atasnya untuk beralih antara tempat dan tur perjalanan.',
  'help.ctx.trip-places.bullet.1':
    '“Tempat” dan “Tur” di bagian atas kolom untuk mengganti daftar. “Tempat” terbuka saat kamu masuk. “Tur” mencantumkan tur perjalanan dan mengimpor file GPX, KML, dan KMZ lewat “Impor GPX atau KML”; tur tidak tampil di daftar tempat.',
  'help.ctx.trip-places.bullet.2':
    '“Tambah Tempat/Aktivitas” membuka formulir untuk tempat yang kamu cari atau ketik. Saat ada hari yang terbuka, tombolnya bertuliskan “Tempat baru”, dan “Ke hari” di sampingnya langsung membuat tempat di hari itu.',
  'help.ctx.trip-places.bullet.3':
    '“Impor Tempat”, tombol ikon di sebelahnya, menawarkan “Impor Daftar” untuk daftar yang dibagikan dari Google Maps atau Naver Maps. Jika administrator mematikan addon Tur, tombol ini juga menawarkan “Impor file” untuk file .gpx, .kml, dan .kmz, dan file bisa langsung dijatuhkan ke kolom.',
  'help.ctx.trip-places.bullet.4':
    'Di bawahnya ada “Cari”, yang juga mencari di deskripsi dan catatan, dan kotak centang “Pilih” di sampingnya. Baris di bawahnya berisi filter: “Tampilkan” beralih antara “Semua”, “Belum direncanakan”, dan “Direncanakan”, masing-masing dengan jumlahnya. Tombol tag menyaring menurut kategori, ikon bintang menurut rating minimum, ikon globe (jika perjalanan mencakup lebih dari satu negara atau wilayah) menurut negara atau wilayah, dan “Urutkan” mengatur urutan daftarnya.',
  'help.ctx.trip-places.bullet.5':
    'Setiap baris menampilkan gambar, nama, dan deskripsi atau alamat, serta bintang dengan rating rata-rata setelah ada yang menilai tempat itu. Klik untuk melihat detail tempat, seret ke suatu hari, atau klik kanan (atau klik “Opsi lainnya”, tiga titiknya) untuk “Edit”, “+ Hari”, “Buka Situs Web”, Google Maps, “Simpan ke Koleksi”, dan “Hapus”.',
  'help.ctx.trip-places.bullet.6':
    'Saat ada hari yang terbuka, tanda + bulat di ujung baris (“+ Hari”) menambahkan tempat ke hari itu. Tombol ini muncul di setiap tempat yang belum ada di hari tersebut. “Direncanakan” lalu hanya menampilkan hari itu, dan chip “Hanya menampilkan hari yang dibuka” memberitahukannya. Tanda x pada chip itu, “Tampilkan seluruh perjalanan”, menutup hari tersebut.',
  // create-place
  'help.guide.create-place.title': 'Buat tempat',
  'help.guide.create-place.goal':
    'Tambahkan tempat atau aktivitas secara manual, lengkap dengan semua detail yang dibutuhkan rencana.',
  'help.guide.create-place.step.1':
    'Klik “Tambah Tempat/Aktivitas” di bagian atas kolom tempat (“Tempat baru” saat ada hari yang terbuka). Formulir terbuka dengan kursor di kolom pencarian.',
  'help.guide.create-place.step.2':
    'Ketik tempatnya di “Cari tempat…”, lalu pilih hasilnya. Nama di bagian atas dialog, “Alamat”, “Lintang”, “Bujur”, dan Situs web terisi otomatis, dan “Detail tempat” di kiri menampilkan gambar, jam buka, dan deskripsi. Di TREK yang punya kunci Google, Bukan tempat yang tepat? Cari di Google di bawah hasil menjalankan pencarian yang sama lewat Google. Jika Koleksi aktif, “Tempat tersimpan” di kanan menawarkan tempat-tempat dari daftarmu dengan cara yang sama.',
  'help.guide.create-place.step.3':
    'Di “Detail tempat”, klik gambar di bawah “Pilih gambar” untuk menjadikannya gambar tempat itu. “Gunakan teks ini” menyalin deskripsinya ke formulir.',
  'help.guide.create-place.step.4':
    'Periksa isi formulirnya. Nama di bagian atas dialog adalah satu-satunya kolom wajib. Pil “Kategori” di bawahnya untuk memilih salah satu kategori perjalanan, dan tanda + di sampingnya untuk membuat kategori baru. “Alamat”, “Lintang”, dan “Bujur” diisi dari hasil pencarian atau kamu ketik sendiri. “Deskripsi” dan “Catatan” untuk tulisanmu sendiri. Situs web untuk tautannya, “Lampirkan” di bawah “File” untuk menambahkan dokumen, dan “Telepon”, “Email”, serta “Tambah jam buka” untuk detail yang tidak ditemukan pencarian.',
  'help.guide.create-place.step.5':
    'Klik “Tambah”. Jika tempat dengan nama atau lokasi yang sama sudah ada di perjalanan, TREK menampilkan peringatan dan tombolnya berubah menjadi “Tetap tambahkan”.',
  'help.guide.create-place.result':
    'Tempat itu ada di daftar dan di peta, di bawah “Belum direncanakan” sampai dimasukkan ke suatu hari.',
  'help.guide.create-place.tip.1':
    '“Biaya” di bagian bawah formulir, jika addon “Anggaran” aktif, langsung membuka editor “Biaya” untuk pengeluaran tempat itu setelah disimpan. Gambar atau PDF yang ditempel ke dialog dilampirkan seperti file di bawah “File”.',
  'help.guide.create-place.tip.2':
    'Indeks TREK dan OpenStreetMap menyediakan hasil pencarian di setiap TREK, dan “Detail tempat” diisi otomatis dari Wikipedia, Wikivoyage, dan Wikimedia. TREK baru bertanya ke Google jika keduanya tidak menemukan apa pun, dan hanya Google yang menyediakan rating.',
  'help.guide.create-place.tip.3':
    'Kamu juga bisa membuat tempat dari peta: klik kanan di titik yang diinginkan, lalu formulir terbuka dengan koordinat dan alamat yang sudah terisi.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Tambah tempat langsung ke hari yang sedang dibuka',
  'help.guide.place-to-open-day.goal': 'Buat atau pilih tempat dan tambahkan ke hari itu dalam satu langkah.',
  'help.guide.place-to-open-day.step.1':
    'Klik header hari di kolom hari. Hari itu terbuka: kartunya disorot, dan kolom tempat menampilkan tombol “Ke hari” di samping “Tempat baru”.',
  'help.guide.place-to-open-day.step.2':
    '“Ke hari” membuka formulir yang sama dengan “Tempat baru”, tapi tempatnya langsung ditambahkan ke hari yang terbuka begitu kamu klik “Tambah”.',
  'help.guide.place-to-open-day.step.3':
    'Untuk menambahkan tempat yang sudah ada ke hari yang terbuka, klik tanda + bulat di ujung barisnya (“+ Hari”), atau klik kanan lalu pilih “+ Hari”. Tanda + muncul di setiap tempat yang belum ada di hari itu.',
  'help.guide.place-to-open-day.step.4':
    'Bisa juga sebaliknya, tanpa membuka hari dulu: seret baris tempat keluar dari kolom dan jatuhkan ke kartu hari. Jika dijatuhkan di antara dua perhentian, tempat itu ditaruh tepat di sana.',
  'help.guide.place-to-open-day.result':
    'Tempat itu tercantum di bawah hari tersebut, di urutan paling bawah. Seret ke atas atau ke bawah ke posisi yang tepat.',
  'help.guide.place-to-open-day.tip.1':
    'Hari yang terbuka juga memengaruhi pencarian: saat ada hari yang terbuka, peta dan pencarian di sekitar dimulai dari tempat-tempat yang sudah ada di hari itu.',
  'help.guide.place-to-open-day.tip.2': '“Urungkan” di toolbar di atas hari-hari membatalkan penjadwalan itu.',
  // filter-places
  'help.guide.filter-places.title': 'Mencari tempat di daftar',
  'help.guide.filter-places.goal': 'Tampilkan hanya tempat yang kamu cari di kolom.',
  'help.guide.filter-places.step.1':
    '“Tampilkan”, dropdown di bawah kolom pencarian, beralih antara “Semua”, “Belum direncanakan” (belum ada di hari mana pun), dan “Direncanakan” (sudah ada di suatu hari), masing-masing dengan jumlahnya. Jika addon Tur mati dan ada jejak GPX yang diimpor, pilihan “Jejak” juga tersedia.',
  'help.guide.filter-places.step.2':
    'Ketik di “Cari” di bagian atas. Daftar tersaring sambil kamu mengetik, berdasarkan nama, alamat, deskripsi, dan catatan; tanda x di kolom untuk menghapus isian.',
  'help.guide.filter-places.step.3':
    'Tombol tag di samping “Tampilkan” mencantumkan kategori: centang satu atau beberapa, termasuk “Tanpa Kategori”. Tombol itu menunjukkan berapa yang dicentang, dan “Hapus filter” di bagian bawah daftar menghapus semuanya.',
  'help.guide.filter-places.step.4':
    'Ikon bintang di sampingnya mengatur rating minimum: 5+, 4+, dan seterusnya hanya menampilkan tempat dengan rating rata-rata minimal setinggi itu. Tempat yang belum punya rating disembunyikan.',
  'help.guide.filter-places.result':
    'Angka di “Tampilkan” menunjukkan berapa tempat yang cocok, dan semua filter berlaku bersamaan.',
  'help.guide.filter-places.tip.1':
    'Saat sebuah hari dibuka, “Direncanakan” hanya menampilkan hari itu dan memberi keterangan “Hanya menampilkan hari yang dibuka”, dengan “Tampilkan seluruh perjalanan” di sebelahnya.',
  'help.guide.filter-places.tip.2':
    'Peta juga mengikuti “Tampilkan”, kategori, dan rating, dan saat ada hari yang terbuka, “Direncanakan” di peta hanya menampilkan hari itu. Pencarian dan ikon globe hanya menyaring daftarnya.',
  // edit-place
  'help.guide.edit-place.title': 'Ubah tempat',
  'help.guide.edit-place.goal': 'Perbaiki nama, pindahkan pin, tambahkan situs web, atau ganti kategori.',
  'help.guide.edit-place.step.1':
    'Klik kanan barisnya dan pilih “Edit”, atau klik “Opsi lainnya” di ujung baris, atau buka tempatnya dan klik “Edit” di detailnya.',
  'help.guide.edit-place.step.2':
    'Ubah yang perlu di “Edit Tempat”: nama dan pil “Kategori” di bagian atas dialog, “Alamat”, “Lintang” dan “Bujur”, “Deskripsi”, “Catatan”, Situs web, “Telepon”, “Email”, dan jam buka. Jika tempat itu ada di tepat satu hari, atau kamu membukanya dari suatu hari, formulir juga punya “Mulai”, “Selesai”, dan “Catatan untuk hari ini”.',
  'help.guide.edit-place.step.3': 'Klik “Perbarui”.',
  'help.guide.edit-place.result':
    'Perubahan berlaku di semua tempat tempat itu muncul: daftar, peta, dan setiap hari yang berisi tempat itu.',
  'help.guide.edit-place.tip.1':
    '“Catatan untuk hari ini” hanya berlaku untuk tempat itu di hari tersebut; “Catatan” berlaku untuk tempatnya sendiri.',
  'help.guide.edit-place.tip.2':
    'Waktu “Selesai” yang lebih awal dari “Mulai” membuat “Perbarui” tidak bisa diklik. “Waktu tumpang tindih dengan:” hanya peringatan bahwa ada perhentian lain di hari itu dengan waktu yang sama.',
  // delete-place
  'help.guide.delete-place.title': 'Hapus tempat',
  'help.guide.delete-place.goal': 'Hapus tempat dari perjalanan secara permanen.',
  'help.guide.delete-place.step.1':
    'Klik kanan barisnya lalu pilih “Hapus” (pilihan ini juga ada di “Opsi lainnya” di ujung baris), atau klik “Hapus” di detail tempat.',
  'help.guide.delete-place.step.2':
    'Klik “Hapus” di pertanyaan konfirmasi. Kalau ada malam yang dipesan di tempat itu, atau ada pemesanan yang tertaut, pertanyaannya menyebutkan apa saja yang ikut terhapus.',
  'help.guide.delete-place.result':
    'Tempat itu dihapus dari daftar, peta, dan semua hari. “Urungkan” di toolbar di atas hari-hari mengembalikannya.',
  'help.guide.delete-place.tip.1':
    'Untuk mengeluarkan tempat dari satu hari saja, pakai “Hapus dari Hari” pada perhentian itu.',
  'help.guide.delete-place.tip.2':
    'Untuk menghapus beberapa tempat sekaligus, klik tanda centang di samping pencarian untuk mulai memilih.',
  // select-places
  'help.guide.select-places.title': 'Ubah atau hapus beberapa tempat sekaligus',
  'help.guide.select-places.goal': 'Ubah banyak tempat sekaligus, tidak perlu satu per satu.',
  'help.guide.select-places.step.1':
    'Klik tanda centang di samping kolom pencarian. Setiap baris mendapat kotak centang bulat, dan bilah berisi tindakan muncul di bagian bawah kolom.',
  'help.guide.select-places.step.2':
    'Klik baris-baris untuk mencentangnya. “Pilih semua”, ikon centang ganda di bilah, memilih semua baris yang tampil sesuai filter.',
  'help.guide.select-places.step.3':
    'Bar menghitung tempat yang dicentang. “Ubah kategori” memberi semuanya satu kategori yang sama; “Simpan ke Koleksi” (jika Koleksi aktif) menyalinnya ke salah satu koleksimu; “Hapus yang dipilih” menghapusnya setelah konfirmasi.',
  'help.guide.select-places.step.4': 'Klik “Selesai”, tanda X di ujung bar, untuk mengakhiri pemilihan.',
  'help.guide.select-places.result':
    'Perubahan berlaku untuk semua tempat yang dipilih; penghapusan bisa dibatalkan dari toolbar di atas hari-hari.',
  'help.guide.select-places.tip.1':
    'Filter tetap berfungsi saat kamu memilih: saring dulu ke “Belum direncanakan”, lalu “Pilih semua” hanya memilih tempat-tempat itu.',
  'help.guide.select-places.tip.2':
    '“Tandai dikunjungi di daftar Anda” muncul di bilah saat addon Koleksi aktif. Tombol ini menandai tempat-tempat itu sebagai sudah dikunjungi di koleksi tempat mereka disimpan.',
  // import-places-file
  'help.guide.import-places-file.title': 'Impor tempat dari file GPX, KML, atau KMZ',
  'help.guide.import-places-file.goal':
    'Jika addon Tur mati, impor pin dan jalur hasil ekspor Google My Maps, Google Earth, atau pelacak GPS sebagai tempat.',
  'help.guide.import-places-file.step.1':
    'Klik “Impor Tempat”, tombol ikon di samping tombol tambah, lalu pilih “Impor file”, atau jatuhkan file di mana saja di kolom tempat. Keduanya hanya tersedia jika administrator mematikan addon Tur.',
  'help.guide.import-places-file.step.2':
    'Pilih file atau seret ke kotak. Untuk GPX, centang apa yang mau diimpor: “Titik jalan”, “Rute”, “Trek (dengan geometri jalur)”. Untuk KML dan KMZ, centang “Titik (Placemarks)” dan “Jalur (LineStrings)”.',
  'help.guide.import-places-file.step.3':
    'Kotak ini menerima beberapa file sekaligus, tapi hanya .gpx, .kml, dan .kmz. File jenis lain, atau yang lebih dari 10 MB, ditolak di dialog dan tidak diimpor.',
  'help.guide.import-places-file.step.4':
    'Klik “Impor”. Sebuah pesan menyebutkan berapa tempat yang diimpor. Untuk file KML atau KMZ, dialog tetap terbuka dengan ringkasan apa saja yang dibuat dan yang dilewati.',
  'help.guide.import-places-file.result':
    'Tempat-tempatnya sudah ada di daftar. Jejak punya garis berwarna di barisnya, digambar di peta, dan mendapat filter “Jejak” sendiri.',
  'help.guide.import-places-file.tip.1':
    'File yang terlalu besar akan ditolak, dan TREK menampilkan batas ukurannya. Ekspor ulang tanpa foto, atau pecah menjadi beberapa file.',
  'help.guide.import-places-file.tip.2': 'Kamu bisa membatalkan seluruh impor dari bilah alat di atas daftar hari.',
  // import-places-list
  'help.guide.import-places-list.title': 'Impor daftar Google Maps atau Naver Maps yang dibagikan',
  'help.guide.import-places-list.goal': 'Impor tempat dari tautan daftar yang dibagikan.',
  'help.guide.import-places-list.step.1':
    'Klik “Impor Tempat”, tombol ikon di samping tombol tambah, lalu pilih “Impor Daftar”.',
  'help.guide.import-places-list.step.2':
    'Di bawah “Penyedia”, pilih “Daftar Google” atau “Daftar Naver”, lalu tempel tautan bagikan daftar itu ke “Tautkan”. Tautan petunjuk arah Google Maps juga bisa: perhentiannya menjadi tempat, sesuai urutan berkendara.',
  'help.guide.import-places-list.step.3': 'Klik “Impor”.',
  'help.guide.import-places-list.result':
    'Semua tempat dari daftar itu sudah ada di perjalanan, dengan nama seperti di daftar; tempat yang sudah ada di perjalanan dilewati.',
  'help.guide.import-places-list.tip.1':
    'Daftarnya harus dibagikan secara publik; tautan daftar pribadi tidak mengimpor apa pun.',
  'help.guide.import-places-list.tip.2':
    '“Perkaya tempat via Google” muncul di dialog jika TREK-mu punya kunci Google: setiap tempat yang diimpor dicarikan dan dilengkapi foto, alamat, dan detailnya.',
  'help.guide.sort-places.title': 'Urutkan daftar tempat',
  'help.guide.sort-places.goal': 'Urutkan daftar berdasarkan nama, rating, atau yang terakhir ditambahkan atau diubah.',
  'help.guide.sort-places.step.1':
    'Klik “Urutkan”, tombol panah di ujung baris filter. Tanda centang menandai urutan saat ini, dan tooltip tombolnya menyebutkan nama urutan itu.',
  'help.guide.sort-places.step.2':
    'Pilih urutan, misalnya “Rating tertinggi”, atau urutkan berdasarkan nama. Daftarnya langsung diperbarui.',
  'help.guide.sort-places.result':
    'Daftar menampilkan tempat sesuai urutan yang kamu pilih, sampai kamu memilih urutan lain.',
  'help.guide.sort-places.tip.1':
    'Urutan apa pun selain “Baru ditambahkan” membuat tombolnya disorot, jadi kamu langsung tahu daftarnya diurutkan berbeda.',
  'help.guide.sort-places.tip.2':
    'Pengurutan hanya mengubah daftar. Hari-hari tetap pada urutannya sendiri, dan browsermu mengingat urutan yang kamu pilih.',
  'help.guide.place-by-hand.title': 'Tambah tempat yang tidak ditemukan pencarian',
  'help.guide.place-by-hand.goal':
    'Isi sendiri data tempat, lengkap dengan telepon, email, dan jam buka, saat pencarian tempat tidak menemukan hasil.',
  'help.guide.place-by-hand.step.1':
    'Di dialog tempat, ketik nama di kolom pencarian lalu tekan Enter. Kalau tidak ada hasil, dialog memberi tahu dan menawarkan “Tambah manual”.',
  'help.guide.place-by-hand.step.2':
    'Klik “Tambah manual”. Teks yang kamu cari menjadi nama tempat, dan dialog bergulir ke kolom kontak.',
  'help.guide.place-by-hand.step.3': 'Isi “Telepon” dan “Email” jika kamu tahu.',
  'help.guide.place-by-hand.step.4':
    'Klik “Tambah jam buka” dan atur jam buka dan tutup tempat itu setiap hari. Tombol salin memberi semua hari jam yang sama dengan hari pertama, dan sakelar setiap hari menandainya “Ditutup”.',
  'help.guide.place-by-hand.step.5': 'Klik “Tambah”.',
  'help.guide.place-by-hand.result':
    'Tempat itu masuk ke daftar. Detailnya menampilkan nomor telepon, email, dan jam buka yang kamu isi, sama seperti tempat hasil pencarian.',
  'help.guide.place-by-hand.tip.1':
    'Saat kamu mengedit tempat yang belum punya jam buka sendiri, jam buka dari “Detail tempat” di kiri otomatis disalin. Kalau sudah punya jam buka, ada tombol di sebelahnya untuk menyalin jam hasil pencarian.',
  'help.guide.place-by-hand.tip.2':
    'Jam buka yang kamu isi menggantikan jam hasil pencarian, jadi kafe dengan jam buka musiman menampilkan jam yang kamu tahu.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Hari',
  'help.ctx.trip-days.summary':
    'Kolom kiri rencana: satu kartu per hari dengan perhentian secara berurutan, catatan, pemesanan dan transportasi hari itu, serta rute di antara perhentian. Di sinilah perjalanan benar-benar direncanakan.',
  'help.ctx.trip-days.bullet.1':
    'Header di bagian atas: “Ekspor” (PDF, kalender, GPX) di kiri; di kanan ada panah urungkan, “Buka semua hari” / “Tutup semua hari”, “Atur ulang hari”, dan “Tampilkan semua rute pemesanan” begitu ada pemesanan yang punya rute untuk digambar.',
  'help.ctx.trip-days.bullet.2':
    'Kartu hari: kotak berisi nomor hari dan prakiraan cuaca, judul (Hari 1 sampai kamu memberinya nama) dan tanggal, lalu di bawahnya pil untuk penginapan malam itu (hijau saat check-in, merah saat check-out, putus-putus selama belum dikonfirmasi; ikon tiketnya membuka pemesanan) dan untuk mobil sewaan. Klik header untuk membuka hari itu, tanda panah untuk melipatnya, dan tanda + (“Tambah ke hari ini”) membuka menu: “Tambah tempat ke hari ini”, “Tambah akomodasi”, “Tambah transportasi”, “Transportasi umum”, dan “Tambah Catatan”. Klik kanan pada header menawarkan pilihan yang sama, ditambah “Kosongkan hari”.',
  'help.ctx.trip-days.bullet.3':
    'Di dalam hari: perhentian secara berurutan, masing-masing dengan gambar, ikon kategori, nama, jam, dan deskripsi, pemesanan yang tertaut dan siapa saja yang ikut; catatan; serta pemesanan dan transportasi hari itu, diwarnai sesuai jenisnya. Arahkan kursor ke perhentian untuk melihat pegangan seret, ikon gembok pada gambarnya, panah, “Tambah pemesanan”, dan tiga titik (“Opsi lainnya”). Kamu juga bisa mengklik kanan perhentian dan catatan untuk membuka menunya.',
  'help.ctx.trip-days.bullet.4':
    'Pada hari yang terbuka, begitu ada dua perhentian, bar rute muncul di bawahnya: “Rute” menampilkan hari itu di peta beserta waktu tempuh setiap ruas di antara perhentian, tiga ikonnya mengatur “Mobil”, “Jalan kaki”, atau “Bersepeda” untuk hari itu, lalu “Optimalkan”, “Buka di Google Maps”, dan “Buka di CoMaps”.',
  'help.ctx.trip-days.bullet.5':
    'Ada beberapa cara menambahkan tempat ke suatu hari: seret baris dari kolom tempat, pakai “+ Hari” di baris itu, pakai “Tambah tempat ke hari ini” dari tanda + hari itu atau di hari yang kosong, atau lewat detail tempat.',
  'help.ctx.trip-days.bullet.6':
    '“Total Biaya” di bagian bawah menjumlahkan pengeluaran dari “Biaya” yang terkait dengan perhentian dan pemesanan hari itu, masing-masing sekali, dalam mata uang tampilanmu.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Membaca rencana suatu hari',
  'help.guide.read-day-plan.goal': 'Pahami arti setiap bagian kartu hari sebelum kamu mengubah apa pun.',
  'help.guide.read-day-plan.step.1':
    'Header: kotak berisi nomor hari dan prakiraan cuaca, lalu Hari 1 atau judul yang kamu berikan, dan tanggalnya. Di bawahnya ada pil untuk penginapan malam itu (hijau saat check-in, merah saat check-out, putus-putus selama belum dikonfirmasi; ikon tiketnya membuka pemesanan) dan untuk mobil sewaan. Klik header untuk membuka hari itu (panel detailnya terbuka di atas peta). Tanda + di kanan (“Tambah ke hari ini”) menambahkan tempat, penginapan, transportasi, koneksi transportasi umum, atau catatan, dan tanda panah melipat kartunya.',
  'help.guide.read-day-plan.step.2':
    'Setiap perhentian menampilkan gambar, ikon kategori, dan namanya, lalu jamnya setelah ada “Mulai”, serta deskripsinya. “Catatan untuk hari ini” tampil di bawahnya. Saat kursor diarahkan ke baris, kontrolnya muncul: pegangan di kiri untuk menyeret, gambar berubah menjadi gembok untuk optimasi rute, dan di ujung kanan ada panah (“Pindah ke atas”, “Pindah ke bawah”), “Tambah pemesanan”, dan tiga titik (“Opsi lainnya”).',
  'help.guide.read-day-plan.step.3':
    'Pemesanan di sebuah perhentian tampil sebagai lencana “Reservasi”, hijau jika sudah dikonfirmasi dan kuning selama masih menunggu, dengan jam dan penyedianya. Klik lencana untuk membuka pemesanan; tombol rute di sampingnya menggambar rutenya. Transportasi punya barisnya sendiri, diwarnai sesuai jenisnya, dengan jamnya dan “Keberangkatan” atau “Kedatangan”. Klik pemesanan untuk membuka detailnya; “Edit” di sana untuk mengubahnya.',
  'help.guide.read-day-plan.step.4':
    'Saat “Rute” aktif, penghubung di antara dua perhentian menunjukkan berapa lama dan seberapa jauh ruas itu, sesuai moda perjalanan hari itu; klik untuk mengubah moda khusus ruas tersebut.',
  'help.guide.read-day-plan.step.5':
    'Bar rute di bawah perhentian hari yang terbuka: “Rute” menggambar rute hari itu di peta, tiga ikonnya untuk memilih “Mobil”, “Jalan kaki”, atau “Bersepeda”, lalu “Optimalkan” mengurutkan ulang perhentian, dan “Buka di Google Maps” serta “Buka di CoMaps” membuka hari itu di aplikasi tersebut.',
  'help.guide.read-day-plan.result':
    'Setiap simbol di kartu punya arti. Panduan di bawah ini menjelaskan cara mengubah masing-masing.',
  'help.guide.read-day-plan.tip.1':
    'Klik kanan perhentian, atau klik tiga titiknya, untuk membuka menunya: “Edit”, “Hapus dari hari”, “Keluarkan dari rute”, “Buka Situs Web”, “Simpan ke Koleksi”, “Hapus”. Aplikasi navigasi ada di detail tempat, di bawah “Navigasi”.',
  'help.guide.read-day-plan.tip.2':
    'Arahkan kursor ke perhentian, dan “Tambah pemesanan” muncul di ujung barisnya. Reservasi yang dibuat dari situ tertaut ke perhentian ini di hari ini.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Taruh tempat di sebuah hari',
  'help.guide.place-onto-day.goal':
    'Jadikan tempat dari daftar sebagai perhentian di suatu hari, di posisi yang tepat dalam urutannya.',
  'help.guide.place-onto-day.step.1':
    'Seret baris dari kolom tempat ke kartu hari. Jatuhkan di antara dua perhentian untuk menaruhnya tepat di sana, atau di header hari untuk menambahkannya di akhir.',
  'help.guide.place-onto-day.step.2':
    'Tanpa menyeret: buka hari dengan mengklik header-nya, lalu klik tanda + bulat di ujung baris tempat (“+ Hari”), atau klik kanan barisnya dan pilih “+ Hari”.',
  'help.guide.place-onto-day.step.3':
    '“Tambah tempat ke hari ini”, di menu + hari itu atau di hari yang kosong, membuka formulir tempat, dan tempat baru langsung ditambahkan ke hari itu.',
  'help.guide.place-onto-day.step.4':
    'Saat ada hari yang terbuka, “Tambah ke Hari” di detail tempat memasukkannya ke hari itu; “Ke hari” di header kolom tempat langsung membuat tempat baru di hari yang terbuka.',
  'help.guide.place-onto-day.result':
    'Tempat itu sekarang menjadi perhentian di hari tersebut. Tempat itu tampil di peta dengan nomor hari itu, dan kolom tempat menghitungnya di “Direncanakan”.',
  'help.guide.place-onto-day.tip.1':
    'Satu tempat bisa ada di beberapa hari: tambahkan ke hari kedua dari kolom tempat. Kalau kamu menyeret perhentian dari satu kartu hari ke kartu lain, perhentian itu justru dipindahkan.',
  'help.guide.place-onto-day.tip.2': 'Panah urungkan di header membatalkan penempatan itu.',
  'help.guide.place-onto-day.tip.3':
    'Perhentian tidak bisa ditaruh di antara dua entri yang waktunya sudah tetap, atau sebelum pemesanan yang sudah punya waktu. Rencana tetap tersusun berdasarkan urutan waktu.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Ubah urutan dalam sehari',
  'help.guide.reorder-stops.goal': 'Pindahkan perhentian ke atas atau ke bawah, atau ke hari lain.',
  'help.guide.reorder-stops.step.1':
    'Arahkan kursor ke perhentian, lalu seret lewat pegangannya ke posisi baru di kartu.',
  'help.guide.reorder-stops.step.2':
    'Atau pakai panah di ujung kanan perhentian saat kursor diarahkan ke sana (“Pindah ke atas”, “Pindah ke bawah”): satu langkah setiap klik.',
  'help.guide.reorder-stops.step.3':
    'Seret perhentian ke kartu hari lain untuk memindahkannya ke sana; perhentian itu dihapus dari hari lamanya.',
  'help.guide.reorder-stops.step.4':
    'Jika perhentian punya jam tetap dan pemindahan akan merusak urutan hari, TREK bertanya “Hapus waktu?”, karena jam itulah yang menentukan posisi perhentian. “Konfirmasi” menghapus jamnya agar perhentian bisa dipindahkan ke mana saja. “Batal” membiarkan hari tetap seperti semula.',
  'help.guide.reorder-stops.result': 'Rute dan waktu tempuh langsung menyesuaikan urutan baru.',
  'help.guide.reorder-stops.tip.1':
    'Pemesanan dengan jam tetap selalu berada di posisi sesuai jamnya. Jika kamu menjatuhkannya di posisi lain pada hari yang sama, pemesanan itu kembali ke posisinya. Jika kamu menyeretnya ke kartu hari lain, pemesanan pindah ke hari itu.',
  'help.guide.reorder-stops.tip.2':
    '“Optimalkan” di bar rute mengurutkan seluruh hari berdasarkan jalan terpendek jika hari itu punya tiga perhentian atau lebih. Kunci perhentian dulu agar tetap di posisinya.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Memberi jam pada perhentian',
  'help.guide.set-stop-times.goal': 'Atur kapan perhentian dimulai dan selesai, supaya harimu tersusun seperti jadwal.',
  'help.guide.set-stop-times.step.1':
    'Klik kanan perhentian, atau klik ikon titik tiganya, lalu pilih “Edit”. Kalau formulir dibuka dari hari itu, ada “Mulai” dan “Selesai” untuk hari tersebut, tepat di bawah lokasi.',
  'help.guide.set-stop-times.step.2':
    'Isi “Mulai” dan, kalau mau, “Selesai”. “Waktu tumpang tindih dengan:” memperingatkan bahwa ada perhentian berwaktu lain di hari itu yang bertabrakan. Waktu “Selesai” yang lebih awal dari “Mulai” membuat “Perbarui” tidak bisa diklik.',
  'help.guide.set-stop-times.step.3':
    'Klik “Perbarui”. Perhentian mendapat lencana waktu dan pindah ke posisi yang sesuai dengan waktunya di hari itu.',
  'help.guide.set-stop-times.result':
    'Perhentian yang punya jam tetap di posisinya dalam urutan; perhentian tanpa jam diurutkan di sekitarnya.',
  'help.guide.set-stop-times.tip.1':
    'Jam itu berlaku untuk perhentian di hari itu; tempat yang sama di hari lain bisa punya jam lain.',
  'help.guide.set-stop-times.tip.2':
    'Untuk memindahkan perhentian berjam secara manual, seret saja. TREK bertanya “Hapus waktu?”, dan saat kamu klik “Konfirmasi”, jamnya dihapus.',
  'help.guide.set-stop-times.tip.3':
    '“Catatan untuk hari ini” di formulir yang sama untuk info yang hanya berlaku di hari itu, misalnya reservasi meja atau nomor tiket.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Hapus perhentian dari hari',
  'help.guide.remove-from-day.goal': 'Hapus tempat dari sebuah hari tanpa menghapusnya dari perjalanan.',
  'help.guide.remove-from-day.step.1': 'Klik kanan perhentian, atau klik tiga titiknya, lalu pilih “Hapus dari hari”.',
  'help.guide.remove-from-day.step.2':
    'Perhentian dihapus dari hari itu. Tempatnya tetap ada di kolom tempat, di bawah “Belum direncanakan” kalau tidak ada di hari lain.',
  'help.guide.remove-from-day.result':
    'Hari itu, rutenya, dan biayanya diperbarui. Panah urungkan mengembalikan perhentiannya.',
  'help.guide.remove-from-day.tip.1':
    '“Hapus” di menu yang sama menghapus tempat dari seluruh perjalanan, termasuk dari semua hari.',
  'help.guide.remove-from-day.tip.2': '“Hapus dari Hari” juga ada di panel detail tempat, di samping “Tambah ke Hari”.',
  // lock-stop
  'help.guide.lock-stop.title': 'Kunci posisi perhentian',
  'help.guide.lock-stop.goal': 'Pertahankan posisi perhentian saat rute dioptimalkan.',
  'help.guide.lock-stop.step.1':
    'Arahkan kursor ke gambar perhentian dan klik ikon gembok: “Pertahankan posisi saat mengoptimalkan rute”.',
  'help.guide.lock-stop.step.2':
    '“Optimalkan” sekarang mengurutkan perhentian lain di sekitarnya. Klik ikon gembok lagi (“Klik untuk membuka kunci”) untuk membukanya.',
  'help.guide.lock-stop.result':
    'Ikon gembok tampil di gambarnya; perhentian tetap di posisinya sampai kamu membuka kuncinya.',
  'help.guide.lock-stop.tip.1':
    'Perhentian dengan jam tetap terkunci oleh jamnya; perhentian itu tidak pernah berpindah saat optimasi.',
  'help.guide.lock-stop.tip.2':
    'Kunci hanya bertahan sampai halaman dimuat ulang. Setelah dimuat ulang, semua perhentian tidak terkunci lagi; hanya perhentian berjam yang tetap di posisinya.',
  // day-note
  'help.guide.day-note.title': 'Tambahkan catatan ke hari',
  'help.guide.day-note.goal': 'Simpan pengingat, nomor tiket, atau rencana cadangan di hari itu.',
  'help.guide.day-note.step.1': 'Klik tanda + di header hari (“Tambah ke hari ini”), lalu pilih “Tambah Catatan”.',
  'help.guide.day-note.step.2':
    'Ketik nama catatan di bagian atas dialog, di kolom bertuliskan “Catatan”. Nama ini yang tampil di kartu hari. Tulis isinya di bawah “Catatan Harian”: bilah alat di atasnya untuk memformat teks (tebal, daftar, tautan, kutipan), dan “Pratinjau” di kiri menunjukkan tampilan barisnya nanti.',
  'help.guide.day-note.step.3':
    'Pilih “Ikon” dan “Warna” supaya catatan mudah dibedakan dari perhentian, lalu klik “Tambah”.',
  'help.guide.day-note.step.4':
    'Catatan tampil di hari itu seperti perhentian: seret ke posisinya atau pakai panahnya. Klik untuk mengeditnya. “Hapus” ada di dialog serta di menu tiga titik atau klik kanan, dan akan menanyakan “Hapus catatan?” dulu.',
  'help.guide.day-note.result':
    'Catatan itu menjadi bagian dari hari tersebut dan dari PDF-nya, di posisi tempat kamu menyeretnya.',
  'help.guide.day-note.tip.1': 'Tautan di catatan terbuka di tab baru, dan satu baris baru tetap menjadi baris baru.',
  'help.guide.day-note.tip.2': 'Catatan berlaku per hari. Tulis catatan untuk seluruh perjalanan di Kolab.',
  // day-route
  'help.guide.day-route.title': 'Menampilkan dan mengoptimalkan rute hari itu',
  'help.guide.day-route.goal':
    'Lihat rute di antara perhentian, pilih cara bepergian, dan biarkan TREK mengatur urutannya.',
  'help.guide.day-route.step.1':
    'Buka harinya dan klik “Rute” di bar rute di bawah perhentiannya: rute di antara perhentian digambar di peta, dan penghubung di antara perhentian menunjukkan waktu dan jarak setiap ruas.',
  'help.guide.day-route.step.2':
    'Tiga ikon di sampingnya mengatur moda perjalanan hari itu: “Mobil”, “Jalan kaki”, atau “Bersepeda”. Ruas-ruasnya dihitung ulang. Plugin bisa menambahkan modanya sendiri.',
  'help.guide.day-route.step.3':
    'Klik penghubung untuk mengubah moda ruas itu saja: pilih moda, “Transportasi umum” untuk mencari koneksi jika tersedia, atau “Gunakan bawaan hari” untuk kembali memakai moda hari itu.',
  'help.guide.day-route.step.4':
    '“Optimalkan” (panah melingkar) mengurutkan ulang perhentian berdasarkan jalan terpendek, mulai dari tiga perhentian. Perhentian yang dikunci atau punya jam tetap tidak berpindah; jika ada akomodasi di hari itu, rute dimulai dari sana.',
  'help.guide.day-route.step.5':
    '“Buka di Google Maps” atau “Buka di CoMaps” membuka seluruh hari sebagai rute di aplikasi itu, untuk navigasi di jalan; CoMaps juga memakai moda perjalanan hari itu.',
  'help.guide.day-route.result':
    'Hari itu menjadi rute lengkap dengan waktu. “Total Biaya” dan setiap ruas diperbarui saat urutannya berubah.',
  'help.guide.day-route.tip.1':
    'Secara default, rute dihitung oleh OSRM. Admin bisa mengatur TREK agar memakai mesin rute lain di “Pengaturan Default Pengguna”.',
  'help.guide.day-route.tip.2':
    'Ruas yang rutenya tidak bisa dihitung tidak menampilkan waktu. Pastikan kedua perhentiannya punya koordinat.',
  'help.guide.day-route.tip.3': 'Panah urungkan membatalkan optimasi.',
  // manage-days
  'help.guide.manage-days.title': 'Menambah, mengurutkan ulang, dan mengganti nama hari',
  'help.guide.manage-days.goal': 'Ubah hari-harinya sendiri, bukan hanya tempat-tempat di dalamnya.',
  'help.guide.manage-days.step.1':
    'Hari-hari berasal dari tanggal perjalanan. Ubah tanggalnya di formulir edit perjalanan di Dasbor, dan hari akan ditambahkan atau dihapus di awal atau akhir. Sebelum hari yang ada isinya dihapus, sebuah daftar menunjukkan hari mana saja yang akan dihapus dan apa isinya.',
  'help.guide.manage-days.step.2':
    '“Atur ulang hari” di header membuka daftar: seret hari lewat pegangannya, atau pakai “Pindah ke atas” dan “Pindah ke bawah”, dan hari itu pindah beserta tempat, catatan, dan pemesanannya. Di bawah daftar, “Tambah” dengan tanggal berikutnya menambahkan hari setelah hari bertanggal terakhir dan memperpanjang perjalanan satu hari; “Tanpa tanggal” menambahkan hari tanpa tanggal di akhir. Perjalanan tanpa tanggal hanya punya “Tambah hari”.',
  'help.guide.manage-days.step.3':
    '“Hapus hari”, ikon tempat sampah di ujung baris, bertanya dulu. Di sana tercantum apa saja yang ikut terhapus: tempat, catatan, dan pemesanannya, penginapan yang check-in atau check-out di hari itu, serta hari-hari yang tanggalnya maju satu hari. “Hapus hari” menghapusnya, “Batal” membatalkan; hari terakhir tidak bisa dihapus.',
  'help.guide.manage-days.step.4':
    'Untuk mengganti nama hari, buka hari itu dan klik ikon pensil di samping judulnya di panel detail di atas peta. Nama itu menggantikan Hari 1 di kartu dan di PDF.',
  'help.guide.manage-days.step.5':
    '“Buka semua hari” dan “Tutup semua hari” di header membuka atau melipat semua kartu sekaligus. Untuk melipat satu kartu, klik tanda panahnya.',
  'help.guide.manage-days.result':
    'Tanggal tetap mengikuti posisi: saat kamu memindahkan hari ke atas, hari itu mendapat tanggal yang lebih awal, dan perhentian, catatan, serta pemesanannya ikut pindah.',
  'help.guide.manage-days.tip.1': 'Memindahkan hari bisa dibatalkan dengan panah urungkan; menghapus hari tidak bisa.',
  'help.guide.manage-days.tip.2':
    '“Total Biaya” di bagian bawah rencana menjumlahkan seluruh perjalanan; tab “Biaya” merincinya.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Pahami pemesanan dan transportasi di rencana',
  'help.guide.bookings-in-plan.goal':
    'Ketahui di mana pemesanan muncul setelah dibuat, dan dari layar mana pemesanan itu dibuat.',
  'help.guide.bookings-in-plan.step.1':
    'Transportasi (penerbangan, kereta, feri, bus, mobil) tampil sebagai baris yang diwarnai sesuai jenisnya, dengan jamnya dan “Keberangkatan” di hari berangkat atau “Kedatangan” di hari tiba; ikon globe di sampingnya menyebutkan zona waktunya, dan penerbangan dengan transit mendapat satu baris per ruas. Untuk koneksi transportasi umum, klik tanda panah untuk menampilkan jalurnya. Klik baris untuk membuka pemesanannya; “Edit” di sana untuk mengubahnya.',
  'help.guide.bookings-in-plan.step.2':
    'Reservasi yang tertaut ke perhentian (misalnya restoran atau tur) tampil sebagai lencana “Reservasi” di perhentian itu, lengkap dengan waktunya. Lencananya hijau kalau sudah dikonfirmasi dan kuning selama masih menunggu. Pemesanan yang punya hari tetapi tidak punya perhentian tampil sebagai baris tersendiri di hari itu.',
  'help.guide.bookings-in-plan.step.3':
    'Menginap di hotel termasuk akomodasi: pilnya di header hari berwarna hijau saat check-in dan merah saat check-out, dan ikon tiketnya membuka pemesanan itu. Panel detail hari mencantumkannya di bawah “Akomodasi”, dan rute setiap hari tersebut dimulai dari sana.',
  'help.guide.bookings-in-plan.step.4':
    'Di peta, tombol rute pada baris pemesanan menggambar rutenya; “Tampilkan semua rute pemesanan” di header menggambar semuanya.',
  'help.guide.bookings-in-plan.step.5':
    'Cara membuatnya: “Tambah pemesanan” pada perhentian saat kursor diarahkan ke sana, “Tambah transportasi” dan “Transportasi umum” di menu + hari itu, serta tab “Pemesanan” dan “Transportasi” untuk daftar lengkap beserta impor dan file.',
  'help.guide.bookings-in-plan.result':
    'Setiap pemesanan muncul sekali di rencana. Tab-tabnya menampilkan pemesanan yang sama dalam bentuk daftar.',
  'help.guide.bookings-in-plan.tip.1':
    'Dikonfirmasi dan menunggu adalah status yang kamu atur pada pemesanan; rencana menampilkannya di perhentian, dan tab “Pemesanan” menghitung keduanya.',
  'help.guide.bookings-in-plan.tip.2':
    'Jika kamu menjatuhkan pemesanan berjam di posisi lain pada harinya, pemesanan itu kembali ke posisi sesuai jamnya. Jika kamu menyeretnya ke kartu hari lain, pemesanan pindah ke hari itu. Untuk mengubah jamnya, edit pemesanannya.',
  // export-plan
  'help.guide.export-plan.title': 'Mengekspor rencana',
  'help.guide.export-plan.goal': 'Ekspor rencana sebagai dokumen, ke kalendermu, atau ke perangkat GPS.',
  'help.guide.export-plan.step.1': 'Klik “Ekspor” di kiri bar header di atas hari-hari.',
  'help.guide.export-plan.step.2':
    '“Dokumen”: PDF membuka tampilan cetak setiap hari beserta perhentian, catatan, dan pemesanannya, diawali peta ringkasan rute; “Rencanaku sebagai PDF” hanya memuat agenda yang kamu ikuti. Di tampilan itu, “Pemisah halaman per hari” memulai setiap hari di halaman baru, “Catatan transportasi” menambahkan catatan transportasimu, dan “Simpan sebagai PDF” mengunduhnya.',
  'help.guide.export-plan.step.3':
    '“Kalender”: “Unduh .ics” menyimpan pemesanan sebagai file kalender, sedangkan “Berlangganan kalender” memberimu tautan yang diperbarui otomatis oleh aplikasi kalendermu.',
  'help.guide.export-plan.step.4':
    '“Peta & GPS” (GPX): “Seluruh perjalanan” mengekspor tempat, rute harian, dan jejak; “Hanya tempat” hanya pin-nya; “Hari sebagai rute” satu rute per hari, untuk peta offline dan perangkat GPS.',
  'help.guide.export-plan.result': 'File diunduh, dan tidak ada yang berubah di perjalanan.',
  'help.guide.export-plan.tip.1':
    'Untuk membuka satu hari saja di aplikasi peta, pakai bilah rutenya: “Buka di Google Maps” atau “Buka di CoMaps”.',
  'help.guide.export-plan.tip.2':
    '“Berlangganan kalender” memerlukan feed kalender yang diaktifkan di pengaturanmu serta hak untuk membagikan perjalanan; panduannya ada di bagian Dasbor.',
  'help.guide.export-plan.tip.3':
    'Untuk mengekspor cukup punya akses baca: setiap anggota perjalanan bisa mengekspor PDF, .ics, dan GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detail tempat',
  'help.ctx.trip-place.summary':
    'Kartu yang terbuka di atas peta saat kamu memilih tempat: semua yang diketahui perjalanan tentangnya, rating bintang dari semua orang, gambar dan file-nya, serta tombol untuk menambahkannya ke hari yang terbuka, membukanya di aplikasi peta, atau menyimpannya ke daftar.',
  'help.ctx.trip-place.bullet.1':
    'Klik baris di kolom tempat, perhentian di dalam hari, atau penanda di peta, dan kartunya terbuka di atas peta. Jika kamu membukanya dari suatu hari, kartu tahu perhentian mana yang kamu maksud, dan juga menampilkan peserta serta pemesanan perhentian itu. Tur (pendakian, bersepeda, atau jalan-jalan dari tab “Tur”) membuka kartu turnya sendiri.',
  'help.ctx.trip-place.bullet.2':
    'Header menampilkan gambar bulat, nama, alamat dalam satu baris, dan label untuk informasi yang diketahui: buka atau tutup, kategori, jam, harga, nomor telepon, email, dan koordinat. Klik gambarnya untuk memakai foto sendiri atau foto dari file tempat itu. Klik dua kali namanya untuk mengganti nama tempat. X di kanan menutup kartu. Mengganti gambar, mengganti nama, “Edit”, dan “Hapus” hanya tersedia bagi peserta perjalanan yang boleh mengubah tempat.',
  'help.ctx.trip-place.bullet.3':
    'Di bawahnya: bintang yang diberikan setiap peserta untuk tempat itu, deskripsi dan catatan, serta “Catatan untuk hari ini” kalau perhentian itu punya catatan.',
  'help.ctx.trip-place.bullet.4':
    'Lalu ada “Jam Buka”, “Warna jalur”, “Statistik Jalur”, dan “File”, jika relevan. “Unggah” di judul “File” menambahkan file dari komputermu, dan daftarnya juga menampilkan file yang disematkan ke perhentian ini serta file pemesanannya, termasuk konfirmasi hotel. Plugin bisa menambahkan barisnya sendiri di bawahnya.',
  'help.ctx.trip-place.bullet.5':
    'Baris di bagian bawah: “Tambah ke Hari” atau “Hapus dari Hari” saat ada hari yang terbuka, lalu “Navigasi” (atau nama aplikasi petamu, setelah kamu memilihnya di “Pengaturan”), “Buka Situs Web”, dan “Simpan ke Koleksi”. Di kanan, ikon tempat sampah merah menghapus tempat dan “Edit” membuka formulirnya.',
  'help.ctx.trip-place.bullet.6':
    'Tempat yang kamu pilih dari pencarian menampilkan informasi yang diketahui indeks TREK atau OpenStreetMap tentangnya: “Buka” atau “Ditutup” di antara pil di bagian atas, dengan lingkaran hijau atau merah di sekeliling gambar, berdasarkan waktu setempat tempat itu; nomor teleponnya, juga sebagai pil; “Jam Buka” lebih ke bawah, dengan jam hari ini di barisnya dan jadwal seminggu penuh setelah diklik; serta situs webnya di bawah “Buka Situs Web”. Rating Google hanya tampil pada tempat yang ditemukan lewat Google, di TREK yang punya kunci Google. Jam buka, nomor telepon, dan email yang kamu ketik sendiri di formulir tempat menggantikan data hasil pencarian, dan juga menentukan warna lingkarannya.',
  // read-place
  'help.guide.read-place.title': 'Informasi tentang tempat di kartunya',
  'help.guide.read-place.goal': 'Lihat semua yang diketahui perjalanan tentang satu tempat, dalam satu kartu.',
  'help.guide.read-place.step.1':
    'Di kolom hari, klik perhentian yang ingin kamu lihat. Kartunya terbuka di atas peta, dan perhentian itu tetap ditandai di harinya.',
  'help.guide.read-place.step.2':
    'Di bagian atas: gambar bulat, nama, dan alamat dalam satu baris; tooltip-nya menampilkan alamat lengkap. Pil di bawahnya menunjukkan “Buka” atau “Ditutup” saat ini, menurut waktu setempat tempat itu, dengan lingkaran hijau atau merah di sekeliling gambar yang sesuai. Pil itu juga menampilkan kategori, jam, nomor telepon, dan email (klik untuk membuka aplikasi telepon atau emailmu) dan, di layar lebar, koordinat persisnya. X di kanan untuk menutup kartu.',
  'help.guide.read-place.step.3':
    '“Peringkat” adalah bagian pertama di bawah header: bintang yang diberikan setiap peserta perjalanan untuk tempat itu, lengkap dengan rata-rata dan jumlah pemberi nilai. Selama belum ada yang menilai, tertulis “Belum dinilai”.',
  'help.guide.read-place.step.4':
    'Setelah itu ada deskripsi dan, di bawahnya, catatan. Keduanya berisi teks dari formulir tempat, lengkap dengan formatnya: daftar, tautan, dan huruf tebal semuanya berfungsi.',
  'help.guide.read-place.step.5':
    '“Peserta” menunjukkan siapa saja yang ikut ke perhentian ini. Semua orang ikut sampai kamu mengeluarkan seseorang.',
  'help.guide.read-place.step.6':
    '“Jam Buka”, lebih ke bawah: barisnya menampilkan jam buka pada hari yang sedang kamu lihat. Klik untuk melihat jadwal seminggu penuh, dengan hari itu dicetak tebal. “File” ada di sebelahnya.',
  'help.guide.read-place.result':
    'Kartu tetap terbuka sampai kamu menutupnya dengan X atau memilih tempat lain. Jam buka seminggu tetap terbuka, dan perhentian terkait tetap ditandai di kolom hari.',
  'help.guide.read-place.tip.1':
    'Jika kamu memilih tempat dari kolom tempat, kartu menampilkan tempat itu, bukan perhentiannya. Jadi tidak ada peserta yang tampil, dan hanya pemesanan milik tempat itu sendiri, misalnya penginapan di hotel. Pilih perhentian di dalam hari untuk melihat semuanya.',
  'help.guide.read-place.tip.2':
    'Jika kamu boleh mengubah tempat, klik dua kali namanya untuk mengganti nama tanpa membuka formulir. Enter menyimpan, Escape membatalkan perubahan.',
  'help.guide.read-place.tip.3':
    'Tempat yang diketik manual hanya punya detail yang diisi di formulirnya. Klik “Edit” dan isi sendiri “Telepon”, “Email”, dan jam bukanya, atau pilih tempat itu dari saran di bawah “Cari tempat…” lalu klik “Perbarui” agar datanya dicarikan. Rating Google memerlukan kunci Google.',
  // rate-place
  'help.guide.rate-place.title': 'Memberi rating tempat',
  'help.guide.rate-place.goal': 'Beri tempat itu bintang darimu, dan lihat rating yang diberikan orang lain.',
  'help.guide.rate-place.step.1':
    'Buka tempatnya. Deretan bintang ada tepat di bawah header dan menunjukkan rata-rata nilai sejauh ini, dengan jumlah pemberi nilai dalam tanda kurung.',
  'help.guide.rate-place.step.2':
    'Klik bintang yang kamu mau. Bintang terisi saat kursor digerakkan di atasnya, jadi kamu bisa melihat nilai yang akan kamu berikan.',
  'help.guide.rate-place.step.3':
    'Nilaimu langsung masuk ke rata-rata, dan foto profil di sebelahnya menunjukkan siapa yang sudah menilai. Arahkan kursor ke barisnya untuk melihat bintang dari semua orang.',
  'help.guide.rate-place.step.4':
    'Rata-rata yang sama tampil di baris tempat itu pada kolom tempat, jadi kamu mudah menemukan tempat terbaik di daftar.',
  'help.guide.rate-place.result':
    'Semua orang dalam perjalanan bisa melihat bintang yang kamu berikan pada tempat itu. Ikon bintang di baris filter di atas daftar kini bisa menampilkan hanya tempat dengan rating minimum tertentu.',
  'help.guide.rate-place.tip.1':
    'Setiap peserta boleh memberi rating, bahkan di perjalanan yang hanya sebagian anggotanya boleh mengubah tempat.',
  'help.guide.rate-place.tip.2':
    'Klik bintang yang sudah kamu berikan untuk menghapus ratingmu. Jika belum ada yang memberi rating, tempat itu kembali bertuliskan “Belum dinilai”.',
  'help.guide.rate-place.tip.3':
    'Hingga enam pemberi nilai ditampilkan sebagai foto profil di samping bintang. Tooltip-nya menampilkan semuanya dan menandai dirimu.',
  // place-image
  'help.guide.place-image.title': 'Pasang foto sendiri di tempat',
  'help.guide.place-image.goal': 'Ganti thumbnail otomatis dengan fotomu sendiri.',
  'help.guide.place-image.step.1': 'Buka tempatnya dari kolom tempat.',
  'help.guide.place-image.step.2':
    'Arahkan kursor ke gambar bulat di header: ikon kamera muncul dan tooltip-nya bertuliskan “Unggah gambar”. Klik lalu pilih filemu. Jika tempat itu sudah punya foto di file-nya, TREK bertanya dulu: “Unggah dari perangkat”, atau salah satu gambar di bawah “Dari berkas terlampir”.',
  'help.guide.place-image.step.3': 'Bagian atas kartu sekarang menampilkan gambarmu, dengan X merah kecil di sudutnya.',
  'help.guide.place-image.step.4':
    'Gambar yang sama juga tampil di baris tempat itu di kolom tempat, dan di penandanya di peta.',
  'help.guide.place-image.result':
    'Gambarmu dipakai untuk tempat itu di mana saja: di kartu, di kolom tempat, di perhentian dalam hari, di penanda peta, dan di perjalanan yang dibagikan.',
  'help.guide.place-image.tip.1':
    'Format JPG, PNG, GIF, dan WebP bisa dipakai, dan file HEIC dari iPhone dikonversi saat diunggah.',
  'help.guide.place-image.tip.2':
    'Tanda X di pojok menghapus fotomu, dan foto otomatis tampil lagi. Tempatnya sendiri tidak berubah.',
  'help.guide.place-image.tip.3':
    'Jika kamu belum menambahkan gambar, TREK mencarikannya berdasarkan koordinat tempat. Jika tidak ditemukan, yang tampil adalah ikon kategorinya. Hanya peserta perjalanan yang boleh mengubah tempat yang bisa mengatur gambarnya.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Tambahkan tempat ke hari yang dibuka, atau hapus dari hari itu',
  'help.guide.place-day-assign.goal': 'Pakai tombol di kartu, tidak perlu menyeret baris melintasi perencana.',
  'help.guide.place-day-assign.step.1':
    'Klik header hari di kolom hari. Hari itu sekarang menjadi hari yang terbuka, dan kartu berlaku untuk hari itu.',
  'help.guide.place-day-assign.step.2':
    'Klik tempat yang belum ada di hari itu di kolom tempat. Kartunya terbuka, dan baris di bagian bawah menawarkan “Tambah ke Hari”.',
  'help.guide.place-day-assign.step.3':
    'Klik “Tambah ke Hari”. Perhentian ditambahkan di akhir hari, dan tombolnya berubah menjadi “Hapus dari Hari”.',
  'help.guide.place-day-assign.step.4':
    'Perhentian itu sekarang ada di hari tersebut, di urutan paling bawah. Seret ke atas ke posisi yang tepat.',
  'help.guide.place-day-assign.step.5':
    '“Hapus dari Hari” mengeluarkan perhentian dari hari itu lagi, dan kartu kembali menampilkan “Tambah ke Hari”.',
  'help.guide.place-day-assign.result':
    'Perhentian ditambahkan ke hari itu atau dihapus darinya. Tempatnya sendiri tidak berubah.',
  'help.guide.place-day-assign.tip.1':
    'Tombol ini hanya ada selama sebuah hari dibuka. Kalau tidak ada hari yang dibuka, tidak ada hari untuk menambahkan tempatnya.',
  'help.guide.place-day-assign.tip.2':
    'Jika kamu mengeluarkan perhentian dari suatu hari, tempatnya tetap ada di perjalanan dan di kolom tempat. “Hapus” menghapusnya dari mana saja.',
  'help.guide.place-day-assign.tip.3':
    'Perhentian yang ditambahkan ke hari itu oleh pemesanan penginapan tidak menampilkan kedua tombol itu. Malam tersebut ditambah dan dihapus di bagian penginapan hari itu.',
  // place-participants
  'help.guide.place-participants.title': 'Menentukan siapa yang ikut ke perhentian ini',
  'help.guide.place-participants.goal':
    'Pilih siapa saja yang ikut ke satu perhentian tanpa mengubah peserta perjalanan.',
  'help.guide.place-participants.step.1':
    'Klik perhentian di dalam hari itu. Kartunya terbuka dan “Peserta” menampilkan semua orang dalam perjalanan.',
  'help.guide.place-participants.step.2':
    'Klik chip seorang peserta untuk mengeluarkannya dari perhentian ini. Saat kursor diarahkan ke chip, namanya tampil dicoret.',
  'help.guide.place-participants.step.3':
    'Tanda + bergaris putus-putus muncul begitu ada yang tidak ikut. Klik untuk melihat siapa yang tidak ada di perhentian itu.',
  'help.guide.place-participants.step.4':
    'Klik sebuah nama untuk menambahkan orang itu lagi. Jika semua orang sudah ditambahkan lagi, perhentian itu kembali menjadi milik seluruh rombongan.',
  'help.guide.place-participants.result':
    'Perhentian itu hanya menampilkan peserta yang kamu pilih. Anggota rombongan lainnya bebas pada jam itu.',
  'help.guide.place-participants.tip.1':
    '“Peserta” hanya muncul saat ada perhentian yang dipilih, jadi pilih tempatnya di dalam hari, bukan di kolom tempat. Bagian ini juga hanya muncul di perjalanan dengan lebih dari satu peserta.',
  'help.guide.place-participants.tip.2':
    'Kalau tidak ada yang dipilih, berarti semua orang ikut. Karena itu, peserta terakhir tidak bisa dihapus dari perhentian.',
  'help.guide.place-participants.tip.3':
    'Tamu, yang tidak punya akun sendiri, juga bisa menjadi peserta seperti yang lain.',
  // place-booking
  'help.guide.place-booking.title': 'Pemesanan di sebuah perhentian',
  'help.guide.place-booking.goal':
    'Lihat pemesanan milik sebuah perhentian, buka, dan tautkan pemesanan baru ke perhentian itu.',
  'help.guide.place-booking.step.1':
    'Buka perhentian yang terkait dengan pemesanan itu. Kartu mencantumkannya di bawah “Pemesanan” sebagai kartu kecil tersendiri, dengan nama pemesanan dan status “Dikonfirmasi” atau “Menunggu”.',
  'help.guide.place-booking.step.2':
    'Kartu pemesanan menampilkan “Tanggal”, “Waktu”, dan “Kode Pemesanan”, label untuk detail pemesanan lainnya (nomor penerbangan, peron, check-in), serta catatan pemesanan jika ada.',
  'help.guide.place-booking.step.3': 'Klik kartu pemesanan. Pemesanannya terbuka di atas peta.',
  'help.guide.place-booking.step.4':
    '“Edit” di bagian bawah pemesanan membuka formulirnya sendiri. Di formulir itu, “Hubungkan ke jadwal harian” menautkan pemesanan ke sebuah perhentian, dan sudah menampilkan perhentian ini. Tutup lagi formulirnya.',
  'help.guide.place-booking.step.5':
    'Pemesanan baru untuk perhentian dibuat dari kolom hari: arahkan kursor ke perhentian dan klik “Tambah pemesanan”, ikon tiket di ujungnya. Formulir terbuka sebagai “Reservasi Baru” dan sudah tertaut ke perhentian itu.',
  'help.guide.place-booking.result':
    'Pemesanan tertaut ke perhentian itu: tampil di kartu dan di hari tersebut, dan file-nya juga tercantum di bawah “File” di sini.',
  'help.guide.place-booking.tip.1':
    'Pemesanan tampil di perhentian tempat pemesanan itu disematkan, dan pemesanan hotel juga tampil di hotel itu di mana pun kamu membukanya. Pemesanan tanpa perhentian ditampilkan di tab “Pemesanan”.',
  'help.guide.place-booking.tip.2':
    'Satu perhentian bisa punya beberapa pemesanan, misalnya makan siang dan tur yang berangkat dari tempat yang sama.',
  'help.guide.place-booking.tip.3':
    'Untuk kereta, penerbangan, atau feri, “Edit” membuka formulir transportasi, yang juga dipakai tab “Transportasi”.',
  // place-files
  'help.guide.place-files.title': 'Simpan tiket tempat bersama tempatnya',
  'help.guide.place-files.goal': 'Lampirkan tiket, voucher, atau peta ke tempat yang bersangkutan.',
  'help.guide.place-files.step.1':
    'Buka tempatnya. “File” ada di bawah detailnya, di samping “Jam Buka” jika tempat itu punya jam buka, dan bertuliskan “File” selama tempat itu belum punya file.',
  'help.guide.place-files.step.2': 'Klik “Unggah” di kanan judul “File”, lalu pilih filenya.',
  'help.guide.place-files.step.3':
    'Tombolnya menunjukkan berapa file yang dimiliki tempat itu, dan daftarnya terbuka otomatis.',
  'help.guide.place-files.step.4': 'Setiap baris menampilkan nama dan ukuran file. Klik untuk membukanya.',
  'help.guide.place-files.result':
    'File terlampir di tempat itu dan terhitung di kartunya. File ini juga muncul di tab “File” perjalanan.',
  'help.guide.place-files.tip.1':
    '“File” juga mencantumkan file yang disematkan ke perhentian ini dan yang dilampirkan ke pemesanannya, jadi konfirmasi hotel muncul di tempat hotel itu.',
  'help.guide.place-files.tip.2':
    '“Unggah” menerima beberapa file sekaligus, dan foto di antaranya bisa dijadikan gambar tempat.',
  'help.guide.place-files.tip.3':
    'Kalau kamu tidak punya izin mengunggah file, tombol “Unggah” tidak muncul. File yang sudah ada di tempat itu tetap ditampilkan.',
  // place-navigation
  'help.guide.place-navigation.title': 'Buka tempat di aplikasi peta atau di situsnya',
  'help.guide.place-navigation.goal': 'Buka tempat di aplikasi navigasi yang kamu pakai untuk ke sana.',
  'help.guide.place-navigation.step.1': 'Buka tempatnya, lalu klik “Navigasi” di baris bawah.',
  'help.guide.place-navigation.step.2':
    'Daftarnya berisi aplikasi peta yang cocok untuk tempat ini: Google Maps, Waze, Apple Maps, OpenStreetMap, dan CoMaps, ditambah “Aplikasi peta lain” di Android.',
  'help.guide.place-navigation.step.3':
    'Klik aplikasi yang kamu pakai. Jika memungkinkan, TREK mengirim tempat itu sendiri ke aplikasinya, bukan hanya koordinatnya, jadi kamu tiba di pintu masuk yang tepat.',
  'help.guide.place-navigation.step.4':
    '“Buka Situs Web” di sampingnya membuka situs resmi tempat itu, dengan jam buka dan tiketnya, di tab baru.',
  'help.guide.place-navigation.result':
    'Aplikasi peta terbuka di tempat itu, situs web terbuka di tab baru, dan tidak ada yang berubah di perjalanan. Jika TREK dipasang sebagai aplikasi, aplikasi petanya yang terbuka, bukan tab baru.',
  'help.guide.place-navigation.tip.1':
    'Waze langsung memulai navigasi. Aplikasi lain membuka tempatnya, lalu kamu perlu mengetuk sekali lagi untuk mulai navigasi.',
  'help.guide.place-navigation.tip.2':
    'Aplikasi yang ditawarkan tergantung tempat dan perangkatmu: Apple Maps tidak tersedia di Android, 高德地图 hanya ditawarkan untuk tempat di Tiongkok, dan Waze, Apple Maps, serta CoMaps memerlukan koordinat tempat. “Aplikasi peta lain” membuka tempat itu di aplikasi peta apa pun di ponsel Android-mu.',
  'help.guide.place-navigation.tip.3':
    'Pilih aplikasi petamu sekali saja di “Pengaturan”, di bawah “Buka tempat di”. Tombolnya lalu menampilkan nama aplikasi itu dan langsung membukanya. Hal yang sama terjadi jika hanya ada satu aplikasi yang cocok untuk suatu tempat.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Simpan tempat ke salah satu daftarmu',
  'help.guide.place-to-collection.goal':
    'Simpan tempat yang kamu temukan di perjalanan ini untuk perjalanan berikutnya.',
  'help.guide.place-to-collection.step.1': 'Buka tempatnya, lalu klik “Simpan ke Koleksi” di baris bawah kartu.',
  'help.guide.place-to-collection.step.2':
    '“Simpan ke daftar” menampilkan semua daftar yang kamu miliki atau bagikan. Ikon penanda yang terisi di kanan menandai daftar yang sudah berisi tempat ini.',
  'help.guide.place-to-collection.step.3': 'Klik daftarnya. Tempat itu langsung ditambahkan ke sana.',
  'help.guide.place-to-collection.step.4': 'Tutup dialog dengan X, dan tombol di kartu bertuliskan “Tersimpan”.',
  'help.guide.place-to-collection.result':
    'Tempat itu sudah ada di daftarmu beserta gambar, catatan, dan alamatnya, siap untuk perjalanan berikutnya.',
  'help.guide.place-to-collection.tip.1':
    'Tombol ini hanya ada selama addon Koleksi aktif, yang diaktifkan admin di bawah “Addon”.',
  'help.guide.place-to-collection.tip.2':
    'Satu tempat bisa ada di beberapa daftar sekaligus, dengan status berbeda di masing-masing: ide di satu daftar, sudah dikunjungi di daftar lain.',
  'help.guide.place-to-collection.tip.3':
    '“Tandai dikunjungi”, di bawah nama tempat di bagian atas pemilih, menandai tempat itu sudah dikunjungi di daftar. Jika tempat itu ada di beberapa daftarmu, tombolnya bertuliskan “Dikunjungi di semua” dan menandainya di semua daftar sekaligus. “Tampilan” membuka daftar-daftarmu di “Koleksi”.',
  // place-track
  'help.guide.place-track.title': 'Baca jalur dan beri warna sendiri',
  'help.guide.place-track.goal':
    'Lihat panjang rute jalan kaki yang diimpor, dan cari tahu garis mana di peta yang merupakan rute itu.',
  'help.guide.place-track.step.1':
    'Baris jalur di kolom tempat menampilkan garis pendek dengan warna jalur di peta. Klik baris itu.',
  'help.guide.place-track.step.2': '“Statistik Jalur” menampilkan panjang rutenya, dalam satuan yang kamu atur.',
  'help.guide.place-track.step.3':
    '“Warna jalur” di atasnya menampilkan warna yang sedang dipakai. Klik barisnya untuk membuka pilihan warna.',
  'help.guide.place-track.step.4': 'Pilih warna. Garis di peta dan goresan di barisnya ikut berubah.',
  'help.guide.place-track.step.5':
    'Kotak bergaris putus-putus di kiri, “Warna otomatis”, mengembalikan jalur ke warna default-nya. Pipet di kanan membuka pemilih warna sistemmu untuk warna lain apa pun.',
  'help.guide.place-track.result':
    'Jalur digambar dengan warna pilihanmu, di kartu, di barisnya pada kolom tempat, dan di peta.',
  'help.guide.place-track.tip.1':
    'Hanya tempat yang punya jalur yang memiliki dua bagian ini: tempat yang diimpor dari file GPX, KML, atau KMZ sebelum fitur Tur ada, atau di TREK yang fitur Tur-nya mati. Jika Tur aktif, file GPX baru menjadi tur, yang membuka kartu turnya sendiri.',
  'help.guide.place-track.tip.2':
    'Jalur yang direkam dengan data ketinggian juga menampilkan titik tertinggi dan terendah, total meter naik dan turun, serta profil rutenya.',
  'help.guide.place-track.tip.3':
    'Setiap impor memberi warna berbeda untuk setiap jalur yang ditambahkan, jadi dua rute jalan kaki tidak pernah berwarna sama.',
  // read-place
  'help.guide.read-place.step.7':
    'Baris di bagian bawah berisi apa saja yang bisa kamu lakukan dari sini: menaruh tempat di hari yang terbuka atau mengeluarkannya, membukanya di aplikasi peta atau di situs webnya, menyimpannya ke daftar, dan di kanan, menghapusnya (ikon tempat sampah merah) atau mengeditnya.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'File',
  'help.ctx.trip-files.summary':
    'Semua dokumen perjalanan dalam satu daftar: tiket, konfirmasi, pass, dan gambar. Setiap dokumen punya catatan, tautan ke tempat atau pemesanan terkait, dan tempat sampah untuk memulihkannya.',
  'help.ctx.trip-files.bullet.1':
    '“Jatuhkan file di sini”, kotak putus-putus di bawah bar, menerima file yang kamu jatuhkan ke sana. Klik kotak itu untuk membuka pemilih file. Kotak ini menampilkan jenis file yang diterima TREK ini dan batas per file (Maks. 50 MB, kecuali administrator menetapkan batas lain).',
  'help.ctx.trip-files.bullet.2':
    'Bar di bagian atas berisi “File” dan tab filter “Semua”, PDF, “Gambar”, dan “Dokumen”, masing-masing dengan jumlahnya. Tab bintang muncul setelah “Semua” begitu ada file yang diberi bintang, dan tab “Catatan Collab” muncul di ujung begitu ada catatan yang punya lampiran.',
  'help.ctx.trip-files.bullet.3':
    'Setiap baris menampilkan thumbnail atau jenis file, siapa yang mengunggahnya, nama, catatan di bawahnya, ukuran, dan tanggal, serta satu lencana per tautan: tempat, pemesanan, atau transportasi sesuai namanya (arahkan kursor untuk melihat “Rencana Harian”, “Pemesanan”, atau “Transportasi”), dan “Dari Catatan Collab”.',
  'help.ctx.trip-files.bullet.4':
    'Di ujung baris ada hingga lima ikon, yang namanya muncul saat kursor diarahkan: “Bintang”, “Tugaskan” (ikon pensil), Buka, “Unduh”, dan “Hapus”. “Hapus” tidak meminta konfirmasi: file masuk ke tempat sampah, dan bisa dipulihkan dari sana. Saat offline, catatan, tautan, bintang, dan tempat sampah tetap berfungsi dan dikirim begitu TREK online lagi; hanya mengunggah dan melepas tautan lain yang memerlukan koneksi.',
  'help.ctx.trip-files.bullet.5':
    'Gambar atau video terbuka dalam layar penuh, dengan tombol panah dan deretan thumbnail. Dokumen lain terbuka di dialog dengan namanya di atas, serta “Buka di tab baru” dan “Unduh” di bawahnya. Wallet pass langsung diunduh.',
  'help.ctx.trip-files.bullet.6':
    'Ikon tempat sampah di ujung kanan bilah (“Sampah”) mengalihkan daftar ke file yang dihapus. Di sana kamu bisa memulihkan setiap file atau menghapusnya secara permanen, dan “Kosongkan Sampah” di bilah menghapus semuanya. “Sinkronisasi dokumen” ada di kiri ikon tempat sampah kalau perjalanan terhubung ke penyimpanan dokumen, atau bagi pemilik perjalanan dan administrator begitu ada penyimpanan yang diaktifkan.',
  // files-upload
  'help.guide.files-upload.title': 'Tambah dokumen ke perjalanan',
  'help.guide.files-upload.goal':
    'Unggah tiket, konfirmasi, atau foto dari folder unduhanmu ke perjalanan, supaya semua anggota perjalanan bisa membukanya.',
  'help.guide.files-upload.step.1':
    'Buka perjalanan dan klik “File” di bilah tab. Dokumen perjalanan tercantum di sana, dengan kotak unggah di atasnya.',
  'help.guide.files-upload.step.2':
    'Klik “Jatuhkan file di sini”, lalu pilih satu atau beberapa file. File diunggah satu per satu, dan kotaknya bertuliskan “Mengunggah...” selama proses berjalan. Di dalam kotak, di bawah “atau klik untuk memilih”, tertera jenis file yang diterima TREK ini dan ukuran maksimal per file.',
  'help.guide.files-upload.step.3':
    'Setelah file terakhir selesai diunggah, “Tugaskan File” otomatis terbuka untuknya (jika perjalanan punya tempat atau pemesanan), dengan nama file di bagian atas dialog. “Tambahkan catatan...” di bawah “Catatan” menambahkan catatan ke file itu, dan daftar di bawahnya menautkannya ke tempat atau pemesanan. Tutup dengan × di kanan atas; menutupnya tidak menghilangkan apa pun.',
  'help.guide.files-upload.step.4':
    'File baru tampil di bagian atas daftar; hanya file berbintang yang ada di atasnya. Setiap baris menunjukkan siapa yang mengunggah file, nama, ukuran, dan tanggalnya. Gambar mendapat thumbnail, file lain menampilkan jenisnya.',
  'help.guide.files-upload.result':
    'Dokumen-dokumen itu sudah ada di perjalanan, dan semua orang yang bisa melihat perjalanan itu bisa membuka dan mengunduhnya.',
  'help.guide.files-upload.tip.1':
    'Kamu juga bisa menyeret file dari desktop langsung ke kotak itu. Kotaknya disorot selama file berada di atasnya.',
  'help.guide.files-upload.tip.2':
    'Tekan Ctrl+V untuk menambahkan gambar dari clipboard ke daftar, jadi kamu tidak perlu menyimpan tangkapan layar pemesanan lebih dulu.',
  'help.guide.files-upload.tip.3':
    'Mengunggah memerlukan hak untuk mengunggah file; tanpa hak itu, kotaknya sama sekali tidak ada. Jenis file yang tidak ada di daftar ditolak dengan pesan, dan tidak ada yang diunggah. File yang melebihi batas (50 MB, kecuali administrator menetapkan batas lain) ditolak sebelum apa pun dikirim, dan pesannya menyebutkan batas tersebut. Mengunggah juga memerlukan koneksi: saat offline, TREK memberi tahu hal itu dan tidak mengunggah apa pun.',
  // files-link
  'help.guide.files-link.title': 'Tautkan dokumen ke tempat atau pemesanan',
  'help.guide.files-link.goal': 'Buat tiket mudah ditemukan dari hari terkaitnya, bukan hanya dari daftar ini.',
  'help.guide.files-link.step.1':
    'Klik ikon pensil di ujung baris (“Tugaskan”). “Tugaskan File” terbuka, dengan nama file di bagian atas dialog.',
  'help.guide.files-link.step.2':
    'Di bawah “Catatan”, “Tambahkan catatan...” menerima satu baris, yang lalu tampil di bawah nama file di daftar. Catatan tersimpan saat kamu menekan Enter atau keluar dari kotak.',
  'help.guide.files-link.step.3':
    'Di bawah “Tempat”, di kiri, ada tempat-tempat perjalanan, dikelompokkan per hari beserta tanggalnya, dan “Tidak ditugaskan” di akhir untuk tempat yang belum ada di hari mana pun. Klik salah satunya untuk mencentangnya.',
  'help.guide.files-link.step.4':
    'Di bawah “Pemesanan” dan “Transportasi” di sebelah kanan, ada daftar pemesanan perjalanan. Klik pemesanan yang terkait dengan dokumen itu, dan pemesanan itu juga akan dicentang.',
  'help.guide.files-link.step.5':
    'Tutup dengan tanda × di kanan atas. Tidak ada tombol simpan di sini, karena setiap klik langsung tersimpan.',
  'help.guide.files-link.result':
    'Baris menampilkan catatan dan satu lencana per tautan: satu dengan nama tempat dan satu dengan nama penerbangan. Saat kursor diarahkan ke lencana, muncul “Rencana Harian” atau “Transportasi”. Dokumen itu juga terlampir di tempat dan di penerbangan tersebut.',
  'help.guide.files-link.tip.1':
    'Satu file bisa punya beberapa tautan sekaligus, jadi konfirmasi yang sama bisa tertaut ke pemesanan hotel dan ke tempat hotel itu sekaligus.',
  'help.guide.files-link.tip.2':
    'Klik lagi entri yang sudah dicentang untuk melepas tautan itu; filenya sendiri tetap ada. Saat offline, catatan dan centang baru disimpan lalu dikirim begitu TREK online lagi; hanya melepas tautan lain yang memerlukan koneksi.',
  'help.guide.files-link.tip.3':
    'Ini juga berlaku sebaliknya: dokumen yang dilampirkan ke tempat atau pemesanan juga ada di daftar ini, dengan lencana yang sama di barisnya.',
  // files-star
  'help.guide.files-star.title': 'Menyimpan dokumen penting di bagian atas',
  'help.guide.files-star.goal':
    'Tandai beberapa dokumen yang benar-benar akan kamu perlukan, agar cepat ditemukan di daftar yang panjang.',
  'help.guide.files-star.step.1':
    'Klik bintang di ujung baris (“Bintang”). Bintangnya berubah keemasan, bintang kedua muncul di depan nama file, dan saat kursor diarahkan ke tombol itu, kini tertulis “Hapus bintang”.',
  'help.guide.files-star.step.2':
    'Daftar diurutkan ulang: file berbintang tampil di atas semua file lain, dan di setiap kelompok, yang terbaru di atas.',
  'help.guide.files-star.step.3':
    'Kini ada bintang di tab filter pada bilah, tepat setelah “Semua”, dengan jumlah file berbintang di sebelahnya. Klik bintang itu untuk melihat file berbintang saja.',
  'help.guide.files-star.result':
    'File berbintang tampil di bagian atas daftar, dan ada satu tab yang hanya menampilkan file berbintang.',
  'help.guide.files-star.tip.1':
    'Tab bintang hanya ada selama ada file yang diberi bintang. Jika kamu menghapus bintang dari file terakhir, tab itu hilang.',
  'help.guide.files-star.tip.2':
    'Memberi bintang memerlukan hak yang sama dengan “Tugaskan”, yaitu “Edit metadata file”. Anggota tanpa hak itu bisa melihat bintangnya, tapi mengklik “Bintang” tidak mengubah apa pun bagi mereka.',
  // files-filter
  'help.guide.files-filter.title': 'Mencari dokumen di daftar',
  'help.guide.files-filter.goal': 'Tampilkan hanya jenis dokumen yang kamu cari.',
  'help.guide.files-filter.step.1':
    'Tab filter ada di bilah atas, di samping “File”: “Semua”, “PDFs”, “Gambar”, dan “Dokumen”, masing-masing dengan jumlah file di sebelahnya.',
  'help.guide.files-filter.step.2': 'Klik “PDFs”: daftar hanya menampilkan file PDF.',
  'help.guide.files-filter.step.3':
    'Dua tab lain hanya muncul kalau perjalanan punya file yang sesuai. Klik “Catatan Collab”, yang muncul begitu ada catatan di tab Collab yang punya lampiran: daftar lalu hanya menampilkan file-file itu. Tab bintang muncul dengan cara yang sama, begitu ada file yang diberi bintang.',
  'help.guide.files-filter.step.4': '“Semua” menampilkan seluruh daftar lagi.',
  'help.guide.files-filter.result':
    'Daftar hanya menampilkan file dari tab yang dipilih, dan angka di setiap tab menunjukkan jumlahnya.',
  'help.guide.files-filter.tip.1':
    'Di sini tidak ada folder, dan file tidak bisa diganti nama. Untuk membedakan dokumen, pakai catatan di “Tugaskan File”, tautan ke tempat dan pemesanan, serta bintang.',
  'help.guide.files-filter.tip.2':
    'Daftar selalu diurutkan dengan file berbintang di atas, lalu dari yang terbaru, jadi dokumen yang diunggah hari ini tampil di atas dokumen bulan lalu.',
  // files-preview
  'help.guide.files-preview.title': 'Baca dokumen tanpa keluar dari TREK',
  'help.guide.files-preview.goal':
    'Lihat tiket atau gambar langsung, dan unduh ke perangkatmu saat kamu membutuhkannya di sana.',
  'help.guide.files-preview.step.1':
    'Klik nama gambar atau thumbnail-nya. Gambar terbuka dalam layar penuh, dengan nama file dan urutannya di antara gambar-gambar lain di kiri atas. Video terbuka dengan cara yang sama dan diputar di sana.',
  'help.guide.files-preview.step.2':
    'Pakai panah bundar di kedua sisi, tombol panah kiri dan kanan, atau deretan thumbnail di bawah untuk melihat semua gambar yang sedang tampil di daftar.',
  'help.guide.files-preview.step.3':
    '“Buka di tab baru” dan “Unduh” adalah tombol bulat di kanan atas, di samping ×. Klik ×, tekan Escape, atau klik latar gelap untuk menutup gambarnya.',
  'help.guide.files-preview.step.4':
    'Dokumen yang bukan gambar terbuka di dialog: namanya di atas dengan “Buka di tab baru” dan “Unduh” sebagai pil di bawahnya, dan untuk PDF, halamannya sendiri di bawah. × di kanan atas, Escape, atau klik di luar dialog untuk menutupnya.',
  'help.guide.files-preview.step.5':
    'Panah di ujung baris (“Unduh”) langsung menyimpan file ke perangkatmu, tanpa membukanya dulu.',
  'help.guide.files-preview.result':
    'Dokumen tampil di layar, dan dua tombol yang sama membukanya di tab browser atau menyimpannya ke perangkatmu.',
  'help.guide.files-preview.tip.1':
    'Di layar sentuh, geser untuk melihat gambar-gambarnya, tidak perlu mengklik panah.',
  'help.guide.files-preview.tip.2':
    'Wallet pass tidak pernah dibuka sebagai pratinjau. File ini langsung diunduh, supaya ponsel bisa membukanya di aplikasi dompet.',
  'help.guide.files-preview.tip.3':
    '“Buka di tab baru” dan “Unduh” sama-sama memuat file dengan sesi login-mu, jadi tautan yang disalin dari bilah alamat tidak bisa dipakai orang lain.',
  // files-trash
  'help.guide.files-trash.title': 'Menghapus dan memulihkan dokumen',
  'help.guide.files-trash.goal':
    'Hapus yang tidak lagi diperlukan perjalanan, dan pulihkan file yang ternyata masih kamu perlukan.',
  'help.guide.files-trash.step.1':
    'Klik ikon tempat sampah di ujung baris (“Hapus”). File langsung hilang dari daftar dan muncul pesan “Dipindahkan ke sampah”. Tidak ada pertanyaan konfirmasi.',
  'help.guide.files-trash.step.2':
    'Ikon tempat sampah di ujung kanan bilah (“Sampah”) mengalihkan daftar ke file yang dihapus. Judul bilah berubah menjadi “Sampah”, dan tab filter serta kotak unggah disembunyikan.',
  'help.guide.files-trash.step.3':
    'Baris di tempat sampah tampil keabuan dan punya dua ikon: “Pulihkan”, untuk memulihkan file, dan “Hapus”, untuk menghapusnya secara permanen setelah konfirmasi.',
  'help.guide.files-trash.step.4':
    'Klik “Pulihkan”. Muncul pesan “File dipulihkan”, dan file dikeluarkan dari tempat sampah. Catatan dan tautannya tetap ada.',
  'help.guide.files-trash.step.5':
    '“Kosongkan Sampah”, di bilah samping ikon tempat sampah, menghapus permanen semua yang masih ada di tempat sampah. Browser meminta konfirmasi sekali sebelum melakukannya. Ikon tempat sampah kembali menampilkan daftar file.',
  'help.guide.files-trash.result': 'File itu kembali ke posisi semula di daftar.',
  'help.guide.files-trash.tip.1':
    '“Hapus” pada baris tidak meminta konfirmasi. Itulah sebabnya ada tempat sampah: tidak ada yang benar-benar dihapus dari TREK sampai kamu menghapusnya di sini. Semua ini juga bisa dilakukan saat offline, dan dikirim begitu TREK online lagi.',
  'help.guide.files-trash.tip.2':
    'Menghapus dan memulihkan file memerlukan hak menghapus file. Anggota tanpa hak itu tidak melihat “Hapus” di baris maupun tombol-tombol di tempat sampah.',
  'help.guide.files-trash.tip.3': 'File yang dihapus permanen dari tempat sampah tidak bisa dikembalikan.',
  // files-sync
  'help.guide.files-sync.title': 'Sinkronkan dokumen dengan penyimpanan dokumenmu',
  'help.guide.files-sync.goal':
    'Hubungkan perjalanan ke penyimpanan dokumenmu sendiri, supaya file yang diunggah di sini tersimpan di sana dan file yang disimpan di sana muncul di sini.',
  'help.guide.files-sync.step.1':
    'Klik “Sinkronisasi dokumen”, di samping ikon tempat sampah di ujung kanan bilah. Dialog terbuka dengan nama perjalanan di bawah judulnya. Di kiri, di bawah “Hubungkan penyedia”, ada penyimpanan yang sudah diaktifkan administrator, masing-masing dengan keterangan cara menyimpan file: Paperless-ngx dan Papra per tag, Nextcloud dan Synology Drive dalam folder, OpenCloud dalam space. Di kanan tertulis “Belum ada yang terhubung”.',
  'help.guide.files-sync.step.2':
    'Klik penyimpananmu, dalam contoh ini Nextcloud. Dialog yang lebih kecil terbuka untuk koneksinya, dengan nama penyimpanan itu, dan meminta data login yang dibutuhkan penyimpanan tersebut.',
  'help.guide.files-sync.step.3':
    'Isi “Alamat” dan data login penyimpanan itu: “Token API” untuk Paperless-ngx, “Kunci API” dan “ID organisasi” untuk Papra, “Nama pengguna” dan “Sandi aplikasi” untuk Nextcloud, “Nama pengguna” dan “Token aplikasi” untuk OpenCloud, serta untuk Synology Drive “Nama pengguna”, “Kata sandi”, dan, jika akunnya meminta, “Kode dua faktor”. Pakai sandi aplikasi atau token jika penyimpanan menyediakannya, jangan pernah kata sandi akunmu. Nextcloud dan Synology Drive juga menerima “Folder dasar” opsional, tempat TREK mencari folder perjalanan, di sini /Reisen. “Terima sertifikat yang ditandatangani sendiri” di bagian bawah hanya untuk penyimpanan di jaringanmu sendiri yang memakai sertifikat seperti itu.',
  'help.guide.files-sync.step.4':
    'Klik “Uji koneksi”. TREK terhubung ke penyimpanan dengan data yang kamu ketik, dan bagian bawah menampilkan Terhubung, masuk sebagai diikuti nama akunnya. Jika data login ditolak atau alamatnya tidak bisa dijangkau, bagian bawah menampilkan hal itu. Dalam kedua kasus, tidak ada yang disimpan.',
  'help.guide.files-sync.step.5':
    'Klik “Hubungkan”. Koneksinya disimpan bersama perjalanan, dan TREK menanyakan di bagian mana penyimpanan dokumen perjalanan itu berada: tag, folder, atau ruang yang berisi dokumennya. Hanya isinya yang disinkronkan. “Buat yang baru” membuatnya saat kamu klik “Buat”, dengan nama dari judul perjalanan. Di bawah “Atau pakai yang sudah ada”, tercantum yang sudah ada. Klik salah satunya, di sini folder Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Dialog terbuka lagi: penyimpananmu tercantum di bawah “Perjalanan ini” di kiri, dan kartunya di kanan menunjukkan tujuan sinkronisasi, kapan terakhir dijalankan, serta “Sinkronkan sekarang”. Sinkronisasi pertama berjalan otomatis. Klik “Sinkronkan sekarang” untuk menyinkronkan kapan saja. Setelah sinkronisasi, lencana “Belum disinkronkan” di samping nama berubah menjadi titik hijau, yang menampilkan “Tersinkron” saat kursor diarahkan ke atasnya. Bilah alur menunjukkan jumlah dokumen di TREK dan di penyimpanan, dengan jalur “Keluar ke penyimpanan” dan “Masuk dari penyimpanan” di antaranya. Tutup dialog dengan tanda × di kanan atas.',
  'help.guide.files-sync.result':
    'Dokumen yang sudah ada di penyimpanan muncul di bagian atas daftar, sebagai unggahan atas namamu, dan setiap dokumen perjalanan juga ada di penyimpanan, kecuali dokumen dari “Catatan Collab”. Mulai sekarang, TREK memeriksa penyimpanan di latar belakang, dan perubahan di daftar disalin ke penyimpanan.',
  'help.guide.files-sync.tip.1':
    'Hanya pemilik perjalanan atau administrator instans yang bisa menghubungkan perjalanan, karena kredensialnya memberi akses ke seluruh akun di penyimpanan itu. Setelah perjalanan terhubung, setiap anggota bisa melihat dan membuka “Sinkronisasi dokumen”, membaca kartunya, dan menekan “Sinkronkan sekarang”.',
  'help.guide.files-sync.tip.2':
    'Penyimpanan di jaringanmu sendiri butuh ALLOW_INTERNAL_NETWORK=true di server TREK, dan alamatnya harus alamat perangkat itu di jaringan, bukan localhost. Tanpa itu, “Uji koneksi” membalas “Alamat itu tidak diizinkan.”',
  'help.guide.files-sync.tip.3':
    '“Putuskan”, ikon di samping “Sinkronkan sekarang”, meminta konfirmasi sekali. Setelah itu koneksinya diakhiri, dan semua dokumen tetap ada di kedua sisi. Jika kamu menghubungkan tag, folder, atau ruang yang sama untuk kedua kalinya, TREK menganggapnya baru dan mengimpor semua isinya lagi. Jadi setelah “Putuskan”, hubungkan yang kosong, bukan yang lama.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detail hari',
  'help.ctx.trip-day-detail.summary':
    'Panel yang terbuka di atas peta saat kamu mengklik header hari. Panel ini menampilkan hari itu secara keseluruhan: nama dan tanggalnya, cuaca di lokasimu, pemesanan di hari itu, dan malam-malam yang dipesan untuknya.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klik header hari di kolom hari, dan panelnya terbuka di tengah peta. Klik header yang sama lagi, atau X di kanannya, untuk menutup panel dan membatalkan pilihan hari itu. Membuka tempat, dari kolom tempat atau dari peta, menutup panel dan menampilkan tempat itu sebagai gantinya.',
  'help.ctx.trip-day-detail.bullet.2':
    'Header menampilkan nama dan tanggal hari itu. Ikon pensil di samping nama untuk mengganti nama hari. Tanda panah ganda melipat panel menjadi bar tipis agar peta terlihat lagi.',
  'help.ctx.trip-day-detail.bullet.3':
    'Di bagian atas, ada cuaca hari itu. “Prakiraan untuk” menunjukkan lokasi prakiraannya: perhentian pertama hari itu, atau hotel tempat kamu bangun pagi.',
  'help.ctx.trip-day-detail.bullet.4':
    '“Reservasi” mencantumkan pemesanan hari itu, masing-masing dengan jenis, perhentian terkait, dan jamnya. Hijau berarti sudah dikonfirmasi, kuning masih menunggu, dan perjalanan transportasi umum berwarna biru tanpa status. Klik baris untuk membuka pemesanannya.',
  'help.ctx.trip-day-detail.bullet.5':
    '“Akomodasi” menampilkan setiap malam yang dipesan di hari ini, dengan Check-in dan Check-out di harinya masing-masing, rentang jam check-in, jam check-out, dan nomor konfirmasi. Jika penginapan punya pemesanan, kotak “Reservasi” di bawahnya menyebutkan pemesanan itu dengan status “Menunggu” atau “Dikonfirmasi”. Klik untuk membuka pemesanannya.',
  'help.ctx.trip-day-detail.bullet.6':
    '“Tambah akomodasi” menambahkan penginapan di hari ini: pilih propertinya dari tempat-tempat perjalanan, tentukan hari mana saja yang dicakup, lalu tambahkan jam dan kodenya. Tanda + di header hari, dengan tooltip “Tambah ke hari ini”, juga punya “Tambah akomodasi”: pilihan ini membuka panel ini dengan formulir yang sudah terbuka.',
  // day-panel
  'help.guide.day-panel.title': 'Buka hari dan lihat detailnya',
  'help.guide.day-panel.goal':
    'Lihat satu hari secara lengkap, termasuk cuaca, pemesanan, dan tempat menginap, tanpa meninggalkan peta.',
  'help.guide.day-panel.step.1':
    'Klik header sebuah hari di kolom hari. Hari itu terpilih dan detailnya terbuka di tengah peta.',
  'help.guide.day-panel.step.2':
    'Header menampilkan nama hari, “Hari 1” sampai kamu memberinya nama, dengan tanggalnya di bawah.',
  'help.guide.day-panel.step.3':
    'Cuaca hari itu ada di bagian atas. “Prakiraan untuk” menunjukkan lokasinya: perhentian pertama hari itu, atau hotel tempat kamu menginap malam sebelumnya.',
  'help.guide.day-panel.step.4': '“Reservasi” di bawahnya mencantumkan pemesanan di hari ini, beserta jamnya.',
  'help.guide.day-panel.step.5':
    '“Akomodasi” menampilkan malam-malam yang dipesan di hari ini, dengan Check-in dan Check-out di harinya masing-masing.',
  'help.guide.day-panel.step.6':
    'Chevron ganda di header menciutkan panel menjadi bilah sempit. Tanda X di sebelahnya menutup panel dan membatalkan pilihan hari itu.',
  'help.guide.day-panel.result':
    'Saat panel diciutkan menjadi bilah, peta jadi lega dan hari itu tetap terpilih. Saat panel ditutup, pilihan hari dibatalkan dan rencana tetap seperti semula.',
  'help.guide.day-panel.tip.1':
    'Mengklik di mana saja pada bilah header panel juga menciutkannya. Chevron hanyalah salah satu caranya.',
  'help.guide.day-panel.tip.2':
    'Saat kamu membuka tempat, dari kolom tempat atau dari peta, panel hari tertutup dan detail tempat ditampilkan sebagai gantinya. Klik header hari itu lagi untuk menampilkan harinya kembali.',
  // day-weather
  'help.guide.day-weather.title': 'Lihat cuaca hari itu',
  'help.guide.day-weather.goal': 'Lihat cuaca di tempat kamu benar-benar berada pada hari itu.',
  'help.guide.day-weather.step.1':
    '“Prakiraan untuk” menunjukkan lokasi acuan angka-angkanya: perhentian pertama hari itu, atau, pada hari tanpa perhentian, hotel tempat kamu menginap malam sebelumnya.',
  'help.guide.day-weather.step.2':
    'Angka besar adalah suhu hari itu. Di sampingnya ada suhu terendah dan tertinggi, serta kondisi cuacanya dalam kata-kata.',
  'help.guide.day-weather.step.3':
    'Label di sebelah kanannya: peluang hujan, curah hujan, angin terkencang, serta waktu matahari terbit dan terbenam.',
  'help.guide.day-weather.step.4':
    'Di bagian bawah ada cuaca per jam, setiap dua jam: waktu, ikon, suhu, dan peluang hujan. Jam dengan peluang hujan di atas 50 persen diberi warna biru.',
  'help.guide.day-weather.result':
    'Kartu hari itu di kolom hari juga menampilkan cuaca dalam teks kecil di bawah nomornya, jadi kamu bisa melihat cuaca seluruh perjalanan dengan cepat.',
  'help.guide.day-weather.tip.1':
    'Derajat dan angin mengikuti “Satuan Suhu” di “Tampilan” pada “Pengaturan”: kalau kamu memilih °F Fahrenheit, prakiraan yang sama ditampilkan dalam °F dan mph.',
  'help.guide.day-weather.tip.2':
    'Hari yang tidak punya perhentian berlokasi dan tidak punya hotel dari malam sebelumnya sama sekali tidak menampilkan cuaca: prakiraan selalu untuk suatu tempat, tidak pernah untuk perjalanan.',
  'help.guide.day-weather.tip.3':
    'Lebih dari 16 hari ke depan, prakiraan belum tersedia. Angkanya lalu berupa rata-rata tahun-tahun sebelumnya untuk tanggal itu, ditandai dengan Ø, dan ada keterangan di bawahnya.',
  // rename-day
  'help.guide.rename-day.title': 'Memberi nama pada hari',
  'help.guide.rename-day.goal': 'Beri nama hari, misalnya “Tiba di Kyoto” atau “Hari istirahat”, alih-alih “Hari 5”.',
  'help.guide.rename-day.step.1': 'Buka harinya. Header-nya bertuliskan “Hari 5”, dengan tanggal di bawahnya.',
  'help.guide.rename-day.step.2': 'Klik ikon pensil di samping nama.',
  'help.guide.rename-day.step.3': 'Nama berubah menjadi kolom isian. Ketik nama yang kamu mau.',
  'help.guide.rename-day.step.4':
    'Tekan Enter, atau klik di tempat lain. Escape membatalkan perubahannya. Kartu hari di kolom hari juga menampilkan nama itu.',
  'help.guide.rename-day.result':
    'Nama itu menggantikan Hari 5 di panel dan di kartu hari pada kolom hari; tanggalnya tidak berubah.',
  'help.guide.rename-day.tip.1':
    'Jika kamu mengosongkan kolomnya lalu menyimpan, hari itu kembali bernama Hari 5: nomornya tampil jika tidak ada nama.',
  'help.guide.rename-day.tip.2':
    'Nama itu melekat pada harinya, bukan pada tanggalnya. Kalau urutan hari diubah, nama ikut berpindah bersama semua isi hari itu.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Pesan penginapan untuk satu hari',
  'help.guide.add-accommodation.goal':
    'Tambahkan hotel ke rencana sekali saja, lengkap dengan hari-hari menginap, waktu, dan nomor konfirmasinya.',
  'help.guide.add-accommodation.step.1':
    'Penginapannya harus sudah menjadi tempat di perjalanan. Buat di kolom tempat seperti tempat lainnya, karena pemilihnya hanya menawarkan tempat yang sudah ada.',
  'help.guide.add-accommodation.step.2': 'Buka hari kedatanganmu, lalu klik “Tambah akomodasi” di bawah “Akomodasi”.',
  'help.guide.add-accommodation.step.3':
    '“Terapkan ke hari” menentukan malam mana saja yang dicakup penginapan itu: “Mulai” adalah hari check-in, “Selesai” hari check-out, dan “Semua” mencakup seluruh perjalanan. Bagian atas dialog menampilkan rentang tanggal dan jumlah malamnya.',
  'help.guide.add-accommodation.step.4':
    'Isi Check-in, “Sampai”, dan Check-out, lalu tulis nomor pemesanan di bawah “Konfirmasi”. Keempatnya boleh dibiarkan kosong.',
  'help.guide.add-accommodation.step.5':
    'Pilih propertinya di bawah “Pilih akomodasi”. “Kategori” di atas daftar menyaringnya ke satu kategori.',
  'help.guide.add-accommodation.step.6': 'Klik “Simpan”.',
  'help.guide.add-accommodation.result':
    'Penginapan itu tampil di setiap hari yang dicakupnya, Check-in di hari pertama dan Check-out di hari terakhir. Propertinya menjadi perhentian di hari check-in, jadi peta menampilkan rute ke sana, dan pemesanan Hotel muncul di tab “Pemesanan”.',
  'help.guide.add-accommodation.tip.1':
    'Pemilih tanggal terbuka di hari asalmu, dengan check-out di hari berikutnya. Kamu bisa mengubah keduanya sebelum menyimpan.',
  'help.guide.add-accommodation.tip.2':
    'Beri hotel kategori “Hotel” saat membuatnya. Dengan begitu, “Kategori” di atas daftar bisa menampilkan semua hotelmu dengan sekali klik.',
  'help.guide.add-accommodation.tip.3':
    'Semua waktunya opsional: penginapan tanpa check-in dan tanpa kode tetap mencakup malam-malamnya, dan rutenya tetap digambar.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Mengubah atau membatalkan malam yang sudah dipesan',
  'help.guide.edit-accommodation.goal': 'Pindahkan penginapan, perbaiki jamnya, atau keluarkan dari rencana.',
  'help.guide.edit-accommodation.step.1':
    'Kartu menampilkan properti dan alamatnya, Check-in atau Check-out di harinya masing-masing beserta jamnya, nomor konfirmasi, dan di bawah “Reservasi” pemesanan yang terkait.',
  'help.guide.edit-accommodation.step.2':
    'Ikon pensil di sebelah kanannya, “Edit akomodasi”, membuka penginapan itu untuk diedit. Judul popup sekarang “Edit akomodasi”.',
  'help.guide.edit-accommodation.step.3':
    'Perbaiki Check-in, “Sampai”, Check-out, dan “Konfirmasi”. Hari-hari di atasnya dan propertinya di bawah juga bisa diubah di sini.',
  'help.guide.edit-accommodation.step.4': 'Klik “Simpan”.',
  'help.guide.edit-accommodation.step.5':
    'X di samping ikon pensil, “Hapus”, menghapus penginapan itu. Tidak ada konfirmasi, dan pemesanan Hotel milik penginapan itu ikut terhapus.',
  'help.guide.edit-accommodation.result':
    'Perubahan langsung berlaku untuk semua hari yang dicakup penginapan itu, dan untuk pemesanan Hotel di tab “Pemesanan”.',
  'help.guide.edit-accommodation.tip.1':
    'Malam di tengah masa menginap tidak punya label “Check-in” maupun “Check-out”. Hanya hari pertama dan terakhir yang punya label itu.',
  'help.guide.edit-accommodation.tip.2':
    'Membatalkan penginapan juga menghapus perhentian yang ditambahkannya di hari check-in dan biaya yang tertaut ke pemesanannya. Kalau ternyata keliru, pesan lagi malamnya.',
  // day-bookings
  'help.guide.day-bookings.title': 'Sekilas pemesanan hari itu',
  'help.guide.day-bookings.goal':
    'Lihat di satu tempat apa saja yang sudah dipesan untuk hari ini dan apakah sudah dikonfirmasi.',
  'help.guide.day-bookings.step.1':
    '“Reservasi” mencantumkan pemesanan hari itu: yang bertanggal di hari itu, dan yang disematkan ke salah satu perhentiannya. Pemesanan yang disematkan ke perhentian di hari lain hanya tampil di perhentian tersebut.',
  'help.guide.day-bookings.step.2':
    'Setiap baris menunjukkan jenis pemesanan, namanya, dan, jika terkait perhentian, nama perhentian itu dalam warna abu-abu di belakangnya. Jamnya tampil di ujung kanan, sebelum titik status.',
  'help.guide.day-bookings.step.3':
    'Warnanya menunjukkan status pemesanan: hijau sudah dikonfirmasi, kuning masih menunggu, dan perjalanan transportasi umum biru, tanpa status. Hotel tidak ada di daftar ini, karena punya bagiannya sendiri di bawah.',
  'help.guide.day-bookings.step.4':
    'Klik baris untuk membuka pemesanannya. Pil di header-nya mengubah status antara “Menunggu” dan “Dikonfirmasi”, dan “Edit” di bagian bawah untuk mengubah sisanya. Pemesanan baru dibuat di tab “Pemesanan”, transportasi di tab “Transportasi”.',
  'help.guide.day-bookings.result':
    'Semua yang bertanggal di hari itu, dan semua yang terkait salah satu perhentiannya, ada di daftar ini.',
  'help.guide.day-bookings.tip.1':
    'Pemesanan muncul di hari sesuai tanggalnya sendiri. Jika kamu mengubah tanggalnya di tab “Pemesanan” atau “Transportasi”, pemesanan itu otomatis pindah ke hari lain.',
  'help.guide.day-bookings.tip.2':
    'Kalau tidak ada blok “Reservasi”, berarti hari itu tidak punya pemesanan. Bloknya disembunyikan, bukan ditampilkan kosong.',
  'help.guide.map-lock.title': 'Kunci peta',
  'help.guide.map-lock.goal': 'Biarkan posisi peta tetap saat kamu mengklik hari dan tempat.',
  'help.guide.map-lock.step.1':
    'Ikon gembok adalah tombol atas dari dua tombol bulat di kiri bawah peta; saat kursor diarahkan, muncul “Kunci tampilan peta”. Klik tombol itu. Selama terkunci, membuka hari atau memilih tempat tidak lagi memperbesar atau menggeser peta, dan tombolnya kini bertuliskan “Biarkan peta mengikuti pilihan”.',
  'help.guide.map-lock.result': 'Peta tetap di posisi terakhirmu selama kamu mengerjakan rencana.',
  'help.guide.map-lock.tip.1':
    'Klik ikon gembok lagi, yang kini bertuliskan “Biarkan peta mengikuti pilihan”, dan peta kembali mengikuti apa yang kamu pilih. Gembok hanya ada di komputer; di ponsel, peta selalu mengikuti pilihan.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Peta',
  'help.ctx.trip-map.summary':
    'Bagian tengah rencana: setiap tempat perjalanan sebagai pin, setiap tur sebagai garis, rute di antaranya, serta tombol-tombol di tepi peta untuk mengunci tampilan, beralih ke satelit, menampilkan seluruh perjalanan sekaligus, dan menampilkan tempat-tempat di area yang sedang kamu lihat.',
  'help.ctx.trip-map.bullet.1':
    'Pin adalah tempat: menampilkan foto tempat itu jika ada, jika tidak, warna kategorinya dengan ikon kategori. Arahkan kursor ke pin untuk melihat kartu berisi gambar, nama, dan alamatnya, serta rating dan kategorinya jika ada. Seret pin ke kartu hari untuk menjadwalkan tempat itu di sana. Penginapan yang pemesanannya masih menunggu tampil pudar, dengan lingkaran putus-putus.',
  'help.ctx.trip-map.bullet.2':
    'Pin yang terlalu berdekatan dikelompokkan menjadi satu lingkaran gelap dengan angka. Klik lingkarannya, dan peta memperbesar ke pin-pin di dalamnya. Jika “Penanda ringkas untuk tempat yang belum direncanakan” aktif, di “Pengaturan” > “Tampilan” di bawah “Perjalanan & peta”, tempat yang belum ada di hari mana pun tampil sebagai titik kecil tanpa foto, sehingga perhentian yang direncanakan lebih mudah terlihat.',
  'help.ctx.trip-map.bullet.3':
    'Klik pin untuk membuka tempat itu dalam kartu di bagian bawah peta, lengkap dengan rating, file, dan tindakan berikutnya. Klik area kosong di peta untuk menutup kartu.',
  'help.ctx.trip-map.bullet.4':
    'Saat ada hari yang terbuka di kolom hari, perhentiannya diberi lencana putih kecil berisi nomor urutnya di hari itu. Tempat yang muncul dua kali di hari itu menampilkan kedua nomornya. Filter di atas daftar tempat (“Tampilkan”, kategori, dan ikon bintang untuk rating minimum) juga menyaring pin di peta.',
  'help.ctx.trip-map.bullet.5':
    'Deretan ikon di bagian atas mencari di area peta yang sedang terlihat: “Restoran”, “Kafe”, “Bar & hiburan malam”, “Akomodasi”, “Tempat wisata”, “Museum & budaya”, “Alam & taman”, dan “Aktivitas”. Kategori tambahan dari plugin menyusul setelah garis pembatas tipis. Jika deretannya lebih lebar dari peta, roda mouse menggulirnya ke samping. “Cari di area ini” menjalankan pencarian lagi setelah kamu menggeser peta.',
  'help.ctx.trip-map.bullet.6':
    'Klik kanan di mana saja di peta untuk membuka formulir tempat di titik itu, dengan alamat yang sudah dicarikan. Ada dua tombol bulat di kiri bawah: ikon gembok, “Kunci tampilan peta”, menahan tampilan peta saat kamu berpindah-pindah hari dan tempat, dan tombol di bawahnya, “Beralih ke tampilan satelit”, mengganti peta gambar dengan citra satelit.',
  'help.ctx.trip-map.bullet.7':
    '“Tampilkan seluruh perjalanan” di kanan bawah menggambar semua hari perjalanan sekaligus dan menampilkan cakupan setiap hari. Ikon rute di baris pemesanan menggambar pemesanan itu, dan ikon rute di bilah alat di atas daftar hari menggambar semua pemesanan. Klik ujung pemesanan yang tergambar untuk membuka detailnya.',
  'help.ctx.trip-map.bullet.8':
    'Jika addon Dawarich aktif, tombol bulat Dawarich di bawah “Tampilkan seluruh perjalanan” menampilkan rute yang benar-benar direkam ponselmu. “Tampilkan rute terekam” menggambarnya sebagai garis putus-putus di bawah rute rencana, satu warna per hari. Jika tidak ada garis, label tombolnya menjelaskan alasannya.',
  // map-markers
  'help.guide.map-markers.title': 'Membaca peta',
  'help.guide.map-markers.goal': 'Pahami arti setiap pin, lencana, dan gelembung di peta.',
  'help.guide.map-markers.step.1':
    'Peta menampilkan semua tempat dalam perjalanan. Kalau pin terlalu berdekatan sehingga sulit dibedakan, pin-pin itu dikelompokkan menjadi satu lingkaran gelap berisi jumlah pinnya. Klik lingkaran itu untuk memperbesar peta ke pin-pin tersebut, atau, pada zoom terdekat, untuk memisahkan pin-pinnya.',
  'help.guide.map-markers.step.2':
    'Pin menampilkan foto tempat itu jika ada; jika tidak, warna kategorinya dengan ikon kategori. Penginapan yang pemesanannya masih menunggu tampil pudar, dengan lingkaran putus-putus. Saat kursor diarahkan ke pin, sebuah kartu terbuka di sampingnya: foto yang sama dalam ukuran lebih besar, nama, dan alamat, serta rating dan kategori jika tempat itu memilikinya.',
  'help.guide.map-markers.step.3':
    'Klik pin, dan tempat itu terbuka dalam kartu di bagian bawah peta: gambar, nama, dan alamat di atas, lalu bintang, deskripsi, dan file, termasuk file pemesanannya. Di bagian bawah ada tombol-tombol tindakan: “Tambah ke Hari” saat ada hari yang terbuka (“Hapus dari Hari” jika tempat itu sudah ada di hari tersebut), “Navigasi”, “Buka Situs Web”, “Simpan ke Koleksi” (“Tersimpan” jika sudah ada di koleksi), dan di kanan ikon tempat sampah serta “Edit”. X di atas, atau klik di bagian peta yang kosong, untuk menutupnya.',
  'help.guide.map-markers.step.4':
    'Buka sebuah hari di kolom hari, dan perhentiannya akan bernomor: lencana putih kecil di pojok pin menunjukkan urutan perhentian di hari itu. Tempat yang muncul dua kali di hari itu menampilkan kedua nomornya. Kalau tidak ada hari yang dibuka, nomor tidak ditampilkan, dan pojok pin menampilkan rating tempat itu, kalau ada.',
  'help.guide.map-markers.step.5':
    'Seret pin dari peta ke kartu hari di kolom hari, dan tempat itu direncanakan di hari tersebut, sama seperti saat kamu menyeret barisnya dari daftar tempat.',
  'help.guide.map-markers.result':
    'Tidak ada yang berubah pada perjalanan: peta hanya menampilkan perjalanan. Setiap pin menunjukkan tempat apa, di hari mana, dan urutan ke berapa.',
  'help.guide.map-markers.tip.1':
    'Saat kamu melipat suatu hari di kolom hari, perhentiannya disembunyikan dari peta. Buka lagi hari itu untuk menampilkannya.',
  'help.guide.map-markers.tip.2':
    'Filter di atas daftar tempat juga menentukan apa yang tampil di peta: “Tampilkan” (“Belum direncanakan”, “Direncanakan”), kategori di bawah tombol tag, dan rating minimum di bawah ikon bintang, semuanya mengurangi jumlah pin. Filter negara hanya menyaring daftarnya.',
  'help.guide.map-markers.tip.3':
    'Peta ini tidak punya tombol zoom: roda mouse untuk memperbesar dan memperkecil, klik dua kali memperbesar satu langkah, dan menyeret peta untuk menggesernya.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Mencari tempat di sekitarmu di peta',
  'help.guide.map-nearby-places.goal':
    'Cari restoran, tempat wisata, atau hotel di area kota yang tampil di peta, lalu tambahkan salah satunya ke perjalanan.',
  'help.guide.map-nearby-places.step.1':
    'Deretan ikon di bagian atas peta adalah pencarian kategori: “Restoran”, “Kafe”, “Bar & hiburan malam”, “Akomodasi”, “Tempat wisata”, “Museum & budaya”, “Alam & taman”, dan “Aktivitas”. Kategori tambahan dari plugin menyusul setelah pembatas tipis; arahkan kursor ke ikon untuk melihat namanya.',
  'help.guide.map-nearby-places.step.2':
    'Klik sebuah kategori. TREK mencari tempat jenis itu di area peta yang terlihat dan menaruh pin berwarna kategori untuk setiap hasil. Hanya satu kategori dalam satu waktu: mengklik kategori lain akan menggantinya, dan mengklik kategori yang sedang aktif akan mematikannya.',
  'help.guide.map-nearby-places.step.3':
    'Saat kamu menggeser peta, tombol kedua muncul di bawah baris itu: “Cari di area ini” menjalankan pencarian yang sama untuk tampilan baru. Menggeser peta tidak otomatis memulai pencarian baru, supaya jumlah permintaan tetap sedikit.',
  'help.guide.map-nearby-places.step.4':
    'Arahkan kursor ke pin untuk melihat nama hasil pencariannya. Klik pin, dan formulir tempat terbuka dengan detail yang sudah terisi: nama di bagian atas dialog, “Alamat”, “Lintang” dan “Bujur”, serta situs web dan nomor telepon jika ditemukan.',
  'help.guide.map-nearby-places.step.5':
    'Periksa apa yang sudah terisi dan tambahkan yang tidak bisa diketahui pencarian. Pil kategori di bawah nama sudah diatur jika perjalanan punya kategori yang cocok, misalnya restoran untuk restoran; jika tidak, tertulis “Tanpa Kategori” sampai kamu memilihnya. Tambahkan “Deskripsi” dan catatanmu sendiri.',
  'help.guide.map-nearby-places.step.6':
    'Klik “Tambah”. Kalau tempat dengan nama yang sama atau di titik yang sama sudah ada di perjalanan, TREK memberi tahu, dan tombolnya berubah menjadi “Tetap tambahkan”.',
  'help.guide.map-nearby-places.result':
    'Tempat itu sudah ada di daftar tempat dan di peta sebagai salah satu pin perjalanan, di bawah “Belum direncanakan” sampai kamu memasukkannya ke suatu hari. Pin hasil pencarian tetap tampil sampai kamu mematikan kategorinya.',
  'help.guide.map-nearby-places.tip.1':
    'Deretan ini disembunyikan jika “Jelajahi tempat di peta” dimatikan di “Pengaturan” > “Tampilan”, di bawah “Perjalanan & peta”.',
  'help.guide.map-nearby-places.tip.2':
    'Hasilnya berasal dari indeks TREK Places dan OpenStreetMap, jadi ini salah satu dari sedikit fitur di rencana yang memerlukan koneksi.',
  'help.guide.map-nearby-places.tip.3':
    'Pencarian hanya mencakup area yang terlihat di layar, jadi perbesar peta ke jalan yang kamu minati. Pencarian di seluruh kota hanya memberi enam puluh hasil pertama, tanpa urutan yang jelas.',
  // map-add-place
  'help.guide.map-add-place.title': 'Buat tempat dengan klik kanan di peta',
  'help.guide.map-add-place.goal': 'Taruh tempat tepat di titik yang kamu mau, tanpa perlu mencarinya dulu.',
  'help.guide.map-add-place.step.1':
    'Klik kanan titik di peta. Formulir tempat terbuka dengan judul “Tambah Tempat/Aktivitas”.',
  'help.guide.map-add-place.step.2':
    '“Lintang” dan “Bujur” sudah terisi sesuai titik itu. TREK mencari koordinat tersebut dan mengisi “Alamat” dengan hasil yang ditemukan. Kalau pencarian menemukan nama, TREK juga mengisi nama di bagian atas dialog. Belum ada yang tersimpan, jadi perbaiki yang keliru.',
  'help.guide.map-add-place.step.3':
    'Ketik nama yang mudah kamu kenali di kolom bagian atas dialog. Pilih kategori dari pil di bawahnya, yang bertuliskan “Tanpa Kategori” sampai kamu memilih. Lalu tambahkan detail lain untuk rencana: “Deskripsi”, “Catatan”, Situs web.',
  'help.guide.map-add-place.step.4':
    'Klik “Tambah”. Tempat itu ditambahkan ke daftar sebagai belum direncanakan, meskipun ada hari yang terbuka: klik kanan di peta menentukan lokasinya, bukan harinya.',
  'help.guide.map-add-place.result':
    'Tempat itu ada di daftar dan di peta, di bawah “Belum direncanakan” sampai kamu memasukkannya ke suatu hari.',
  'help.guide.map-add-place.tip.1':
    'Alamat dicari berdasarkan koordinat, jadi yang muncul bisa nama jalan, bukan nama tempat, dan di daerah terpencil bisa saja kosong. Kamu bisa menimpa kedua kolom itu.',
  'help.guide.map-add-place.tip.2':
    'Di peta MapLibre GL dan Mapbox GL, klik tengah melakukan hal yang sama, begitu juga tekan lama di layar sentuh.',
  // map-satellite
  'help.guide.map-satellite.title': 'Beralih ke tampilan satelit',
  'help.guide.map-satellite.goal': 'Beralih dari peta biasa ke citra udara, dan sebaliknya.',
  'help.guide.map-satellite.step.1':
    'Sakelar lapisan dasar adalah tombol bawah dari dua tombol bulat di kiri bawah peta, di bawah ikon gembok. Ikonnya selalu menunjukkan lapisan tujuan, dan tooltip-nya menyebutkannya: “Beralih ke tampilan satelit”. Klik tombol itu.',
  'help.guide.map-satellite.step.2':
    'Peta sekarang menampilkan citra satelit. Detailnya cukup untuk melihat bangunan satu per satu, dan kamu tidak perlu kunci sendiri. Semua yang digambar TREK tetap tampil di atasnya: pin, rute hari itu, jejak, dan rute pemesanan.',
  'help.guide.map-satellite.step.3':
    'Tombolnya sekarang bertuliskan “Beralih ke tampilan peta”. Klik untuk kembali ke tampilan peta.',
  'help.guide.map-satellite.result': 'Peta digambar ulang, dan lapisan yang kamu pilih disimpan di akunmu.',
  'help.guide.map-satellite.tip.1':
    'Pilihan ini disimpan di akunmu, bukan di perjalanan, jadi setiap perjalanan terbuka seperti terakhir kamu tinggalkan, apa pun perender peta yang kamu pakai.',
  'help.guide.map-satellite.tip.2':
    'Citra satelit tidak punya label: nama jalan, nama daerah, dan nomor rumah hanya ada di peta biasa, jadi beralihlah kembali saat mencari alamat.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Melihat seluruh perjalanan dan jaraknya',
  'help.guide.map-whole-trip.goal':
    'Tampilkan semua hari perjalanan, bukan hanya hari yang terbuka, dan lihat seberapa jauh perjalanan setiap hari.',
  'help.guide.map-whole-trip.step.1':
    'Tombol bundar “Tampilkan seluruh perjalanan” ada di kanan bawah peta. Klik tombol itu dan semua hari perjalanan digambar sekaligus, masing-masing dengan warnanya sendiri, sehingga hari yang berdekatan mudah dibedakan.',
  'help.guide.map-whole-trip.step.2':
    'Kartu di atas tombol menampilkan hari-hari tersebut: titik warna, nama hari, ikon untuk setiap moda perjalanan di hari itu, dan jarak yang ditempuh. “Jarak total” ada di bagian atas.',
  'help.guide.map-whole-trip.step.3':
    'Klik sebuah hari di kartu untuk memilihnya: barisnya diberi warna latar dan hari itu terbuka di kolom hari. Putar roda mouse di atas sebuah kota untuk memperbesar. Hari-hari yang melewati kota itu ditampilkan berdampingan, masing-masing dengan warnanya.',
  'help.guide.map-whole-trip.step.4':
    'Tombolnya kini bertuliskan “Sembunyikan seluruh perjalanan”. Klik untuk kembali menampilkan hari yang sedang dibuka saja.',
  'help.guide.map-whole-trip.result':
    'Setiap hari perjalanan digambar dengan warnanya sendiri, dan kartu menunjukkan cakupan setiap hari beserta total untuk perjalanan.',
  'help.guide.map-whole-trip.tip.1':
    'Totalnya dihitung beberapa ruas sekaligus. Selama masih ada … di belakangnya, angkanya baru jumlah sebagian. Angkanya final setelah semua ruas selesai dihitung.',
  'help.guide.map-whole-trip.tip.2':
    'Jika router tidak bisa menghitung suatu ruas, ruas itu tetap berupa garis lurus dan tidak dihitung. Kartu memberitahukan hal ini, jadi totalnya tidak tampak lebih kecil tanpa peringatan.',
  'help.guide.map-whole-trip.tip.3':
    'Hari dengan kurang dari dua perhentian berlokasi dan tanpa perjalanan dari atau ke hotelnya tidak punya rute untuk digambar, jadi hari itu sama sekali tidak muncul di kartu.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Tampilkan rute pemesanan di peta',
  'help.guide.map-booking-routes.goal':
    'Tampilkan penerbangan, perjalanan kereta, dan perjalanan mobil yang sudah kamu pesan di peta, lalu sembunyikan lagi.',
  'help.guide.map-booking-routes.step.1':
    'Rute pemesanan tidak tampil sampai kamu mengaktifkannya. Di ujung kanan baris transportasi di kolom hari ada ikon rute kecil: “Tampilkan rute pemesanan”.',
  'help.guide.map-booking-routes.step.2':
    'Klik ikon itu, dan pemesanannya muncul di peta: penerbangan sebagai busur lingkaran besar, perjalanan mobil menyusuri jalan sungguhan, kereta sebagai rangkaian stasiunnya. “Dikonfirmasi” digambar dengan garis utuh, “Menunggu” putus-putus, dan ujung-ujung rutenya berupa pil biru dengan ikon transportasinya.',
  'help.guide.map-booking-routes.step.3':
    'Klik pil ujung, dan detail pemesanan terbuka: status, jenis, dan hari sebagai pil di header berwarna, jam di kedua ujung, detail lainnya di bawah, lalu di bagian bawah “Di peta”, yang mematikan rute ini lagi, “Ubah rute” untuk koneksi transportasi umum, ikon tempat sampah untuk menghapus pemesanan, dan “Edit”. X di header menutup detailnya.',
  'help.guide.map-booking-routes.step.4':
    'Ikon rute di toolbar di atas hari-hari berlaku untuk seluruh perjalanan sekaligus: “Tampilkan semua rute pemesanan” menggambar semua pemesanan yang punya rute.',
  'help.guide.map-booking-routes.step.5':
    'Ini menggantikan pilihanmu sebelumnya, jadi rute yang kamu aktifkan satu per satu akan diatur ulang. Tekan lagi, kini bertuliskan “Sembunyikan semua rute pemesanan”, untuk menyembunyikan semua rute pemesanan.',
  'help.guide.map-booking-routes.result':
    'Pemesanan yang kamu pilih digambar di peta, dan pilihan itu disimpan untuk perjalanan ini di browser ini sampai kamu mengubahnya.',
  'help.guide.map-booking-routes.tip.1':
    'Ujung-ujungnya menampilkan kode bandara atau nama stasiun hanya jika “Label rute pemesanan” aktif di “Pengaturan” > “Tampilan”, di bawah “Perjalanan & peta”; jika tidak, hanya ikonnya yang tampil.',
  'help.guide.map-booking-routes.tip.2':
    '“Selalu tampilkan rute pemesanan”, di bagian yang sama, langsung menampilkannya di setiap perjalanan yang belum kamu atur sendiri.',
  'help.guide.map-booking-routes.tip.3':
    'Pemesanan baru bisa digambar kalau titik awal dan titik akhirnya punya koordinat, jadi hotel atau restoran tidak punya ikon rute.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Tampilkan rute yang benar-benar kamu tempuh',
  'help.guide.map-dawarich-trail.goal':
    'Tampilkan rute yang direkam Dawarich di ponselmu pada peta, sebagai garis putus-putus di samping rute rencanamu, dan lihat hari demi hari bagaimana perjalanan sebenarnya berlangsung.',
  'help.guide.map-dawarich-trail.step.1':
    'Tombol bulat Dawarich ada di kanan bawah peta, di bawah “Tampilkan seluruh perjalanan”. Saat kursor diarahkan ke sana, muncul “Tampilkan rute terekam”. Klik tombol itu. TREK meminta data untuk tanggal-tanggal perjalanan dari Dawarich-mu, dan sebuah lingkaran berputar di sekeliling tombol selama TREK menunggu jawaban.',
  'help.guide.map-dawarich-trail.step.2':
    'Rute terekam tampil sebagai garis putus-putus, satu warna per hari, digambar di bawah rute rencana agar rencananya tetap terbaca. Tombolnya sekarang bertuliskan “Sembunyikan rute terekam”. Setiap hari berakhir pada tengah malam waktu setempat. Saat kamu melipat suatu hari di kolom hari, garis putus-putus dan perhentiannya disembunyikan dari peta.',
  'help.guide.map-dawarich-trail.step.3':
    'Klik juga “Tampilkan seluruh perjalanan”, dan setiap hari yang direncanakan digambar sebagai garis utuh di samping rekaman yang putus-putus. Jika kedua garis berimpit, hari itu berjalan sesuai rencana. Jika garis putus-putus keluar dari rute rencana, berarti tidak.',
  'help.guide.map-dawarich-trail.result':
    'Rencanamu dan apa yang benar-benar kamu jalani tampil bersama di peta, sebagai garis putus-putus dan garis utuh. Kartu di atas tombol tetap menampilkan hari-hari yang direncanakan beserta jaraknya.',
  'help.guide.map-dawarich-trail.tip.1':
    'Status aktif atau tidaknya disimpan per perjalanan di akunmu, jadi sama di semua browser dan perangkat. Selama rute aktif, TREK mengambil data dari Dawarich lagi setiap dua menit, sehingga perjalanan yang sedang berlangsung ikut diperbarui tanpa memuat ulang halaman. Rute itu sendiri tidak pernah disimpan, jadi tidak ada di database TREK, tidak ada di cadangan, dan tidak tersedia offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Label tombol menjelaskan kenapa peta kosong: “Memuat rute terekam…” selama sedang dimuat, “Tidak ada yang terekam pada tanggal ini”, “Rute terekam tidak dapat dimuat”, atau “Rute terekam memerlukan koneksi” saat TREK sedang offline.',
  // map-compass
  'help.guide.map-compass.title': 'Putar peta dan temukan arah utara lagi',
  'help.guide.map-compass.goal':
    'Putar peta agar menghadap arah tujuanmu, lalu kembalikan ke utara dengan sekali klik.',
  'help.guide.map-compass.step.1':
    'Putar peta dengan menyeret pakai tombol kanan, atau tahan Ctrl dan seret pakai tombol kiri; di layar sentuh, putar dengan dua jari. Kompas bulat di samping deretan ikon kategori di bagian atas peta ikut berputar: panahnya selalu menunjuk ke utara, jadi kompas miring sebesar sudut putaran peta.',
  'help.guide.map-compass.step.2':
    'Klik kompasnya. Tombol bernama Reset north ini memutar peta kembali agar utara ada di atas, membuat tampilannya datar lagi, dan panahnya kembali menunjuk ke atas.',
  'help.guide.map-compass.result':
    'Peta kembali menghadap utara dan datar lagi. Tidak ada yang berubah pada perjalanan: kompas hanya mengubah tampilan.',
  'help.guide.map-compass.tip.1':
    'Kompas hanya ada di peta MapLibre GL dan Mapbox GL. Peta Leaflet tidak bisa diputar, jadi tidak punya kompas. “Penyedia peta” di “Pengaturan”, bagian “Peta”, menentukan peta yang kamu pakai, dan “Simpan Peta” menyimpan pilihan itu.',
  'help.guide.map-compass.tip.2':
    'Klik itu juga menghilangkan kemiringan. Seret ke atas atau ke bawah dengan tombol kanan mouse untuk memiringkan tampilan, dan “Reset north” meratakannya sekaligus mengatur ulang rotasinya. Di Mapbox GL dengan “Bangunan 3D & medan” aktif, ini juga meratakan tampilan 3D sampai kamu memiringkannya lagi.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Kolab',
  'help.ctx.trip-collab.summary':
    'Tab tempat rombongan merencanakan bersama, dalam lima kartu: obrolan di kiri, “Catatan” dan “Tautan” di sampingnya, “Jajak Pendapat” dan “Berikutnya” di bawahnya. Semua yang ditulis di sini langsung muncul di layar anggota lain, tanpa perlu memuat ulang.',
  'help.ctx.trip-collab.bullet.1':
    'Chat ada di kartu sebelah kiri. Tulis di “Ketik pesan...” lalu tekan Enter. Shift + Enter membuat baris baru. Ikon wajah tersenyum menambahkan emoji, dan “Lampirkan gambar” menambahkan hingga empat gambar ke pesan.',
  'help.ctx.trip-collab.bullet.2':
    'Arahkan kursor ke pesan untuk memunculkan “Balas” dan, di pesanmu sendiri, “Hapus”. Klik kanan pesan untuk delapan reaksi cepat. Pesan yang dihapus diganti dengan keterangan siapa yang menghapusnya.',
  'help.ctx.trip-collab.bullet.3':
    '“Catatan” adalah area catatan bersama: “Catatan Baru” di header-nya membuat catatan, dan ikon roda gigi di sampingnya membuka “Kelola Kategori” untuk nama dan warna kategori. Setelah ada kategori, deretan pil di bawah header menyaring kartu: “Semua”, atau satu kategori. Kartu catatan menampilkan kategorinya sebagai titik berwarna dan tautannya sebagai tombol bulat, dan tiga titiknya (“Opsi lainnya”) berisi “Perluas”, “Sematkan”, “Edit”, dan “Hapus”.',
  'help.ctx.trip-collab.bullet.4':
    '“Tautan” mengumpulkan alamat web untuk perjalanan. “Tambah tautan” meminta judul dan alamat http atau https. “Edit tautan”, “Sematkan tautan”, dan “Hapus tautan” ada di ujung chip, dan tautan yang disematkan tetap di depan.',
  'help.ctx.trip-collab.bullet.5':
    'Pakai polling untuk mengambil keputusan. “Polling Baru” membuat pertanyaan dengan minimal dua pilihan. Klik sebuah pilihan untuk memberi suara. Ikon gembok (“Tutup”) dan tempat sampah (“Hapus”) di kanan header polling mengakhiri pemungutan suara atau menghapus polling.',
  'help.ctx.trip-collab.bullet.6':
    '“Berikutnya” mencantumkan perhentian perjalanan yang masih akan datang, maksimal delapan, dengan jam dan orang-orang yang ikut. Bagian ini hanya membaca rencana hari; jamnya diatur di sana.',
  // write-note
  'help.guide.write-note.title': 'Menulis catatan bersama',
  'help.guide.write-note.goal':
    'Taruh informasi yang perlu diketahui seluruh rombongan, seperti aturan, alamat, atau pengingat, di tempat yang mudah ditemukan semua orang.',
  'help.guide.write-note.step.1':
    'Klik “Catatan Baru” di header kartu “Catatan”. Dialog catatan terbuka, dengan kursor sudah berada di kolom judul.',
  'help.guide.write-note.step.2':
    'Ketik judul di bagian bertuliskan “Judul catatan”, di atas dialog. Hanya bagian ini yang wajib diisi: “Buat” tetap abu-abu sampai judulnya diisi, dan menekan Enter di judul langsung membuat catatan.',
  'help.guide.write-note.step.3':
    '“Konten” berisi teks dan mendukung Markdown: kata bercetak tebal, daftar, judul. Kartu menampilkan tiga baris pertama, dan “Perluas” di menunya membuka seluruh catatan.',
  'help.guide.write-note.step.4':
    'Di bawah “Kategori”, pilih kategori catatan itu. Warnanya dipakai untuk header dialog sekarang dan untuk header kartu nanti. Kategori pertama sudah terpilih untukmu. Pil-pilnya adalah kategori yang sudah ada, dan kategori baru dibuat di “Kelola Kategori”. Selama perjalanan belum punya kategori, baris ini tidak ada.',
  'help.guide.write-note.step.5':
    '“Website” untuk tautan yang terkait dengan catatan. Kartu lalu menampilkan tombol tautan bundar di bagian atas untuk membukanya.',
  'help.guide.write-note.step.6':
    'Klik “Buat”. Hanya “Batal” dan tanda silangnya yang menutup dialog, jadi klik di luar dialog atau Esc tidak menghilangkan tulisanmu.',
  'help.guide.write-note.result':
    'Catatan itu tampil sebagai kartu di panel “Catatan”, dengan bagian atas berwarna kategorinya, dan semua anggota lain langsung melihatnya.',
  'help.guide.write-note.tip.1':
    'Tiga titik di kartu (“Opsi lainnya”) membuka “Perluas”, “Sematkan”, “Edit”, dan “Hapus”. “Sematkan” menjaga catatan di bagian atas panel, dengan bingkai berwarna kategorinya. Catatan lain diurutkan berdasarkan waktu terakhir diubah.',
  'help.guide.write-note.tip.2':
    'Ikon roda gigi di sebelah “Catatan Baru” membuka “Kelola Kategori”. Di sana kamu bisa memberi warna pada kategori, mengganti namanya di semua tempat sekaligus, atau menambahkannya sebelum ada catatan yang memakainya. Tidak ada yang berubah sampai kamu mengklik “Simpan”.',
  'help.guide.write-note.tip.3':
    '“Lampirkan file” menambahkan dokumen ke catatan, jika kamu boleh mengunggah file ke perjalanan. “Lampirkan” membuka pemilih file, dan kamu juga bisa menempelkan gambar atau PDF langsung ke dialog.',
  'help.guide.write-note.tip.4':
    '“Catatan” punya sakelar sendiri di “Addon”, di bawah Collab: admin bisa mematikannya sementara chat, tautan, jajak pendapat, dan What’s Next tetap berjalan.',
  // shared-links
  'help.guide.shared-links.title': 'Kumpulkan tautan perjalanan',
  'help.guide.shared-links.goal':
    'Simpan portal pemesanan, album bersama, dan jadwal di satu tempat, supaya tidak perlu mencarinya di chat.',
  'help.guide.shared-links.step.1':
    'Klik “Tambah tautan” di header kartu “Tautan”. Dialog terbuka dengan kursor di kolom paling atas.',
  'help.guide.shared-links.step.2':
    'Ketik namanya di “Judul tautan”, tempel alamatnya di “Tautkan” di bawahnya, lalu klik “Simpan tautan”.',
  'help.guide.shared-links.step.3':
    'Chip itu menampilkan nama dan situs tujuannya. Klik untuk membuka halamannya di tab baru.',
  'help.guide.shared-links.step.4':
    'Tiga tombol bundar di ujungnya adalah “Edit tautan”, “Sematkan tautan”, dan “Hapus tautan”. “Sematkan tautan” memindahkan chip ke depan panel dan menampilkannya dengan warna aksen. “Hapus tautan” meminta konfirmasi dulu, karena tautan akan dihapus untuk semua anggota.',
  'help.guide.shared-links.result':
    'Tautan tampil sebagai chip di panel “Tautan”, disematkan di depan, dan langsung muncul di layar semua anggota.',
  'help.guide.shared-links.tip.1':
    'Hanya alamat http atau https yang diterima. Alamat lain ditolak, dan dialog tetap terbuka dengan isian yang sudah kamu ketik.',
  'help.guide.shared-links.tip.2':
    'Tautan yang disematkan tampil lebih dulu, lalu yang terbaru. Ikon kecil di samping judul adalah favicon situs itu, dimuat langsung dari situsnya, jadi tanpa internet chip menampilkan ikon tautan biasa.',
  'help.guide.shared-links.tip.3':
    '“Tautan” punya sakelarnya sendiri di bawah “Addon”, di bawah Kolab, jadi admin bisa mematikan panel itu tanpa mengubah bagian lain di tab.',
  // create-poll
  'help.guide.create-poll.title': 'Bertanya ke rombongan',
  'help.guide.create-poll.goal':
    'Ubah pertanyaan yang tidak dijawab siapa pun di obrolan menjadi polling yang bisa dipilih semua orang.',
  'help.guide.create-poll.step.1': 'Klik “Polling Baru” di header kartu “Jajak Pendapat”. Dialognya akan terbuka.',
  'help.guide.create-poll.step.2':
    'Tulis pertanyaan di bawah “Pertanyaan”. Keterangan “Mendukung Markdown” di bawah kotak berarti huruf tebal, baris baru, atau daftar pendek bisa dipakai di sini.',
  'help.guide.create-poll.step.3':
    'Isi “Pilihan 1” dan “Pilihan 2” di bawah “Pilihan”. Minimal harus ada dua pilihan yang terisi, dan satu pilihan boleh terdiri dari beberapa baris.',
  'help.guide.create-poll.step.4':
    '“Tambah pilihan” di bawahnya menambahkan pilihan ketiga, keempat, sebanyak yang kamu perlukan. Tanda silang kecil di samping baris, yang muncul kalau ada lebih dari dua pilihan, menghapus pilihan itu.',
  'help.guide.create-poll.step.5':
    '“Pilihan ganda” membuat semua orang bisa mencentang lebih dari satu pilihan. Jika dimatikan, suara seseorang pindah ke pilihan baru saat dia memilih yang lain.',
  'help.guide.create-poll.step.6': 'Klik “Buat Polling”.',
  'help.guide.create-poll.result':
    'Polling itu muncul di bagian atas panel “Jajak Pendapat”, dalam keadaan terbuka, dengan 0 suara di header-nya.',
  'help.guide.create-poll.tip.1':
    'Pertanyaan ditampilkan sebagai Markdown, sedangkan pilihan jawaban tetap berupa teks biasa.',
  'help.guide.create-poll.tip.2':
    '“Buat Polling” tetap abu-abu sampai ada pertanyaan dan minimal dua pilihan yang diisi.',
  'help.guide.create-poll.tip.3':
    'Tenggat waktu hanya bisa diatur di aplikasi ponsel. Polling dengan tenggat waktu menampilkan sisa waktunya dalam chip kuning tua di header, dan otomatis ditutup saat waktunya habis.',
  'help.guide.create-poll.tip.4':
    '“Jajak Pendapat” punya sakelar sendiri di “Addon”, di bawah Collab: admin bisa mematikannya sementara empat panel lainnya tetap aktif.',
  // vote-poll
  'help.guide.vote-poll.title': 'Memberi suara dan melihat hasilnya',
  'help.guide.vote-poll.goal': 'Beri suara, lihat hasil rombongan, dan ubah pilihanmu.',
  'help.guide.vote-poll.step.1':
    'Klik pilihan yang kamu mau. Lingkarannya menampilkan tanda centang, pilihannya mendapat bingkai berwarna aksen, dan bar di belakangnya bertambah panjang.',
  'help.guide.vote-poll.step.2':
    'Sekarang kamu bisa melihat hasil lengkapnya: batang menunjukkan porsinya, persentasenya ada di kanan, dan lingkaran kecil adalah orang-orang yang memilih opsi itu, maksimal tiga orang.',
  'help.guide.vote-poll.step.3':
    'Berubah pikiran? Klik pilihan lain. Di polling tanpa “Pilihan ganda”, suaramu pindah ke pilihan baru, bukan menambah suara kedua.',
  'help.guide.vote-poll.step.4':
    'Jumlah suara tampil dalam chip di bawah pertanyaan. Mengklik pilihan yang sudah kamu pilih akan menarik suaramu, dan jumlahnya berkurang.',
  'help.guide.vote-poll.result':
    'Pilihanmu dicentang, batang menunjukkan hasil suara grup, dan lingkaran menunjukkan siapa memilih apa.',
  'help.guide.vote-poll.tip.1':
    'Persentase dan siapa memilih apa baru tampil setelah kamu sendiri memberi suara, atau setelah polling ditutup. Jumlah suara di header terlihat oleh semua orang.',
  'help.guide.vote-poll.tip.2':
    'Suara tidak pernah anonim: arahkan kursor ke salah satu lingkaran di sebuah pilihan untuk melihat nama pemberi suaranya.',
  // close-poll
  'help.guide.close-poll.title': 'Menutup atau menghapus polling',
  'help.guide.close-poll.goal':
    'Hentikan pemungutan suara setelah grup memutuskan, dan hapus polling yang sudah tidak dibutuhkan.',
  'help.guide.close-poll.step.1':
    '“Tutup”, ikon gembok di kanan header polling, mengakhiri pemungutan suara. Pilihan tidak bisa diklik lagi.',
  'help.guide.close-poll.step.2':
    'Polling yang ditutup pindah ke bagian bawah panel, di bawah judul “Ditutup” jika masih ada polling terbuka di atasnya. Polling itu diberi chip “Ditutup” dan menampilkan hasilnya kepada semua orang, baik yang sudah memilih maupun belum. Pilihan pemenang dicetak tebal di bar hijau; jika itu pilihanmu, bar memakai warna aksenmu.',
  'help.guide.close-poll.step.3':
    '“Hapus”, ikon tempat sampah di kanan header, menghapus polling. Di polling yang sudah ditutup, hanya tombol ini yang tersisa, karena ikon gembok sudah hilang. Tidak ada konfirmasi, dan semua suaranya ikut terhapus.',
  'help.guide.close-poll.result':
    'Polling yang dihapus hilang dari panel semua anggota. Polling yang hanya ditutup tetap terlihat di bagian bawah, beserta hasilnya.',
  'help.guide.close-poll.tip.1':
    'Penutupan tidak bisa dibatalkan: polling tidak bisa dibuka lagi. Polling yang tidak sengaja ditutup harus dibuat ulang.',
  'help.guide.close-poll.tip.2':
    '“Hapus” menghapus polling beserta semua suaranya bagi semua orang, langsung dan tanpa konfirmasi.',
  // whats-next
  'help.guide.whats-next.title': 'Membaca “Berikutnya”',
  'help.guide.whats-next.goal': 'Lihat kegiatan grup berikutnya tanpa membuka rencana.',
  'help.guide.whats-next.step.1':
    'Kartu ini menampilkan perhentian perjalanan berikutnya, maksimal delapan, berurutan sesuai waktu, di bawah judul per hari: “Hari ini”, “Besok”, atau tanggalnya, dengan judul hari di sebelahnya kalau ada. Header menunjukkan jumlahnya.',
  'help.guide.whats-next.step.2':
    'Di kiri setiap perhentian ada waktunya: waktu mulai, “sampai”, dan waktu selesai kalau ada, atau TBD kalau waktunya belum diatur.',
  'help.guide.whats-next.step.3':
    'Di sebelahnya ada nama, alamat, dan orang-orang di perhentian itu dalam bentuk chip. Kalau tidak ada yang ditetapkan untuk perhentian itu, semua anggota perjalanan ditampilkan.',
  'help.guide.whats-next.result':
    'Daftar agenda yang akan datang, hanya untuk dibaca: daftarnya mengikuti rencana, dan tidak ada yang di sini mengubahnya.',
  'help.guide.whats-next.tip.1':
    'Tidak ada yang perlu diatur di sini. Jamnya berasal dari rencana hari; jika kamu mengubahnya di sana, daftar ini langsung diperbarui.',
  'help.guide.whats-next.tip.2':
    'Hanya yang masih akan datang yang tercantum: perhentian dihapus dari daftar begitu jam mulainya lewat, perhentian hari ini yang tidak punya jam tetap ada sampai hari berakhir, dan di akhir perjalanan panelnya kosong.',
  'help.guide.whats-next.tip.3':
    '“Berikutnya” punya sakelarnya sendiri di bawah “Addon”, di bawah Kolab. Ini panel khusus desktop: tab Kolab di aplikasi ponsel tidak menampilkannya.',
  // trip-chat
  'help.guide.trip-chat.title': 'Ngobrol dengan grup',
  'help.guide.trip-chat.goal':
    'Kirim pesan, balas pesan tertentu, beri reaksi ke pesan lain, dan hapus pesanmu sendiri.',
  'help.guide.trip-chat.step.1':
    'Tulis di “Ketik pesan...” lalu tekan Enter. Panah bundar di samping kotak juga mengirim pesan. Shift + Enter membuat baris baru.',
  'help.guide.trip-chat.step.2':
    'Ikon wajah tersenyum membuka pemilih emoji, berisi “Smileys”, “Reactions”, dan “Travel”. Emoji yang kamu pilih ditambahkan ke teks yang sedang kamu tulis, tidak langsung terkirim.',
  'help.guide.trip-chat.step.3':
    'Arahkan kursor ke pesan orang lain: tombol bulat kecil muncul di sudutnya. Itulah “Balas”.',
  'help.guide.trip-chat.step.4':
    'Pesan yang kamu balas dikutip di atas kotak. Tulis dan kirim pesanmu, dan kutipannya ikut terkirim. Klik tanda silang di kutipan untuk menghapusnya.',
  'help.guide.trip-chat.step.5':
    'Klik kanan sebuah pesan untuk melihat delapan reaksi cepat. Reaksimu muncul di bawah pesan. Klik reaksi yang sama lagi untuk menghapusnya.',
  'help.guide.trip-chat.step.6':
    'Pesanmu sendiri punya tombol “Hapus”, ikon tempat sampah, di samping “Balas”. Pesan langsung terhapus, dan muncul keterangan bahwa kamu menghapusnya. Tindakan ini tidak bisa dibatalkan.',
  'help.guide.trip-chat.result':
    'Balasanmu menjadi pesan terbaru, dengan kutipan pesan yang dibalas di bagian atasnya. Reaksimu muncul di bawah pesan yang lain. Untuk pesan yang kamu hapus, muncul keterangan bahwa kamu menghapusnya.',
  'help.guide.trip-chat.tip.1':
    'Enter untuk mengirim, Shift + Enter untuk baris baru. Pesan yang hanya berisi satu sampai tiga emoji ditampilkan besar.',
  'help.guide.trip-chat.tip.2':
    'Dengan “Lampirkan gambar”, kamu bisa menambahkan hingga empat gambar ke satu pesan. Kamu juga bisa menempelkan atau menyeretnya ke kotak.',
  'help.guide.trip-chat.tip.3':
    'Pesan yang berisi tautan mendapat kartu pratinjau di bawahnya, yang diambil oleh TREK-mu sendiri, jadi tautan ke sesuatu yang hanya bisa kamu akses tetap tampil sebagai tautan biasa.',
  'help.guide.trip-chat.tip.4':
    'Obrolan punya sakelarnya sendiri di bawah “Addon”, di bawah Kolab: admin bisa mematikannya dan tetap mengaktifkan catatan, tautan, polling, dan “Berikutnya”.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Daftar',
  'help.ctx.trip-lists.summary':
    'Dua daftar untuk satu perjalanan: daftar perlengkapan, berisi siapa membawa apa dan berapa beratnya, dan daftar tugas berisi semua yang harus dilakukan sebelum dan selama perjalanan. Tab ini muncul selama addon “Daftar” aktif.',
  'help.ctx.trip-lists.bullet.1':
    '“Daftar Bawaan” dan “Tugas” di bar atas untuk beralih di antara keduanya, sekaligus menghitung isinya masing-masing; tombol di ujung kanan bar berlaku untuk mana pun yang sedang terbuka.',
  'help.ctx.trip-lists.bullet.2':
    'Daftar bawaan dikelompokkan ke dalam beberapa daftar, misalnya Dokumen atau Pakaian, dengan nama apa pun yang kamu mau. Setiap daftar berupa kartu. Header-nya punya pegangan untuk menyeret seluruh daftar ke posisi lain, titik warna, lencana jumlah yang sudah dikemas dari total, tiga titik berisi “Ganti nama”, “Centang Semua”, “Hapus Centang Semua”, dan “Hapus daftar”, serta panah untuk melipat kartu. “Tambah daftar” di bar atas membuat daftar baru.',
  'help.ctx.trip-lists.bullet.3':
    'Setiap baris punya pegangan seret, kotak centang, dan nama, lalu avatar kecil orang yang membawa item itu. Item yang jumlahnya lebih dari satu juga punya penghitung barang yang sudah dikemas, misalnya 3/10, dengan tombol minus dan plus. Setelah itu ada jumlah sebagai lencana kecil dan, selama “Pelacak Tas” aktif, berat dalam gram dan lingkaran tas, lalu ikon tempat sampah dan menu tiga titik berisi “Pindahkan ke daftar”, “Berbagi”, “Ganti nama”, dan “Hapus”. Kontrol yang tidak dipakai baris itu tampil redup sampai kamu mengarahkan kursor ke atasnya.',
  'help.ctx.trip-lists.bullet.4':
    '“Dibagikan” dan “Daftar saya” membagi daftar bawaan menjadi dua: daftar yang dilihat semua orang, dan daftarmu sendiri. “Semua”, “Belum dikemas”, dan “Selesai” di sampingnya menyaring daftar mana pun yang sedang terbuka. “A ke Z” di ujung baris menampilkan item setiap daftar sesuai urutan nama, dan klik sekali lagi mengembalikan urutanmu sendiri. Kartu kemajuan di atasnya menghitung apa yang sudah dikemas.',
  'help.ctx.trip-lists.bullet.5':
    '“Terapkan template” dan “Simpan sebagai template” untuk mengisi daftar atau menyimpannya, jadi kamu tidak perlu mengetik ulang. Dua ikon setelahnya, “Ekspor” dan “Impor”, mengekspor daftar sebagai cetakan, PDF, atau file, dan mengimpor daftar. Tombol merah di ujung kanan kartu kemajuan menunjukkan jumlah item yang dicentang dan menghapusnya.',
  'help.ctx.trip-lists.bullet.6':
    '“Tugas” punya sidebar sendiri: kartu kemajuan, filter “Semua”, “Tugasku”, “Terlambat”, dan “Selesai”, satu baris per daftar, dan “Tambah daftar” di bawahnya. Tugas-tugas ada di dalam kartu. Header-nya menampilkan nama filter dan urutannya, “Prioritas” atau “Tenggat waktu”. Klik tugas untuk membukanya di panel kanan. “Tugas baru” di bar membuka dialog “Tugas baru”.',
  // packing-categories
  'help.guide.packing-categories.title': 'Susun daftar perlengkapan',
  'help.guide.packing-categories.goal':
    'Kelompokkan barang bawaan ke dalam daftar, tambahkan barangnya, dan tentukan siapa yang bertanggung jawab atas setiap daftar.',
  'help.guide.packing-categories.step.1':
    'Klik “Tambah daftar” di bilah atas daftar. Dialog kecil terbuka. Ketik nama di pita atasnya, di bagian bertuliskan “Nama daftar (mis. Pakaian)”, lalu klik “Tambah”.',
  'help.guide.packing-categories.step.2':
    'Daftar baru dimulai dengan baris placeholder yang hanya menampilkan tiga titik samar. Klik “Tambah item” di bawah baris, ketik barangnya di “Nama item...”, lalu tekan Enter: barang pertama menggantikan placeholder, dan kolomnya tetap terbuka untuk barang berikutnya.',
  'help.guide.packing-categories.step.3':
    'Ganti nama baris dengan mengklik namanya, atau lewat “Ganti nama” di tiga titik di ujung kanannya.',
  'help.guide.packing-categories.step.4':
    'Lingkaran putus-putus berikon orang di bagian atas daftar untuk menugaskan anggota perjalanan ke daftar itu. Pilih sebuah nama. Untuk menghapus orang itu lagi, klik chip yang muncul.',
  'help.guide.packing-categories.step.5':
    'Tiga titik di samping hitungan membuka opsi lainnya: “Ganti nama”, “Centang Semua”, “Hapus Centang Semua”, dan “Hapus daftar”. “Hapus daftar” menghapus daftar beserta semua itemnya tanpa bertanya lagi. Panah di ujung kanan untuk melipat daftar.',
  'help.guide.packing-categories.result':
    'Daftar baru muncul di kisi beserta barang-barangnya dan titik warnanya, dan lencananya menghitung barang yang sudah dikemas.',
  'help.guide.packing-categories.tip.1':
    'Sebuah daftar hanya ada selama punya barang. Kalau barang terakhir dihapus, barisnya berubah menjadi placeholder supaya daftar tetap di posisi dan warnanya. Kalau baris itu juga dihapus, daftarnya ikut terhapus.',
  'help.guide.packing-categories.tip.2':
    'Saat kamu menugaskan seseorang ke sebuah daftar, orang itu menerima notifikasi packing. Ini tidak mengubah siapa yang bisa melihat barangnya. Hal itu diatur di “Berbagi”, pada menu titik tiga di setiap baris.',
  'help.guide.packing-categories.tip.3':
    'Dua daftar boleh punya nama yang sama. TREK membedakannya secara internal, jadi namanya tetap seperti yang kamu ketik.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Mencentang barang sambil berkemas',
  'help.guide.check-off-packing.goal':
    'Tandai barang yang sudah masuk tas, pantau bar kemajuan, dan hapus item yang sudah dikemas.',
  'help.guide.check-off-packing.step.1': 'Klik kotak di kiri baris. Namanya dicoret, dan bar kemajuan diperbarui.',
  'help.guide.check-off-packing.step.2':
    'Kartu progres di atas daftar menunjukkan berapa barang yang sudah dikemas dari seluruh barang di daftar, dalam bentuk angka, persentase, dan bilah.',
  'help.guide.check-off-packing.step.3':
    'Untuk mencentang satu daftar sekaligus: menu titik tiga di header-nya punya “Centang Semua” dan “Hapus Centang Semua”.',
  'help.guide.check-off-packing.step.4':
    '“Semua”, “Belum”, dan “Selesai” di samping “Dibagikan” dan “Daftar saya” menyaring kisi. “Belum” hanya menampilkan yang masih kurang, jadi daftar yang sudah lengkap dikemas tidak ditampilkan.',
  'help.guide.check-off-packing.step.5':
    'Tombol merah “Hapus … tercentang” di ujung kanan kartu kemajuan, berisi jumlah item yang dicentang, menghapus semuanya sekaligus setelah satu konfirmasi dari browser.',
  'help.guide.check-off-packing.result':
    'Hanya barang yang belum dikemas yang tampil, dan bilah di atas menunjukkan seberapa banyak yang sudah dikemas.',
  'help.guide.check-off-packing.tip.1': 'Item yang sudah dicentang tetap bisa diganti namanya: klik namanya.',
  'help.guide.check-off-packing.tip.2':
    '“Centang Semua” dan “Hapus Centang Semua” hanya berlaku untuk satu daftar, lewat tiga titik di daftar itu sendiri.',
  'help.guide.check-off-packing.tip.3':
    'Jika semua item sudah dicentang, penghitungnya diganti dengan “Semua sudah dikemas!” dan bar berubah hijau.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Terapkan template perlengkapan',
  'help.guide.apply-packing-template.goal':
    'Tambahkan daftar siap pakai ke perjalanan, dan simpan daftar perjalanan ini untuk perjalanan berikutnya.',
  'help.guide.apply-packing-template.step.1': 'Klik “Terapkan template” di bilah atas daftar.',
  'help.guide.apply-packing-template.step.2':
    'Pilih template. Setiap baris menampilkan nama template dan jumlah barangnya.',
  'help.guide.apply-packing-template.step.3':
    'Item-itemnya ditambahkan ke tampilan yang sedang kamu buka: “Dibagikan” menambahkannya ke daftar bersama yang dilihat semua orang, “Daftar saya” menambahkannya ke daftarmu sendiri.',
  'help.guide.apply-packing-template.step.4':
    'Untuk menyimpan daftar perjalanan ini bagi perjalanan berikutnya, klik “Simpan sebagai template”. Dialog kecil terbuka. Ketik nama di kolom bagian atas, yang bertuliskan “Nama template”, lalu klik “Simpan”.',
  'help.guide.apply-packing-template.result':
    'Daftar dan item dari template ditambahkan ke perjalanan, di samping isi yang sudah ada.',
  'help.guide.apply-packing-template.tip.1':
    'Template menyalin daftar, jumlah, berat, dan tas setiap item, serta membuat tas yang belum ada di perjalanan. Centang tidak ikut disalin, dan tidak ada yang sudah ada di daftar yang dihapus.',
  'help.guide.apply-packing-template.tip.2':
    '“Terapkan template” baru tersedia kalau sudah ada template. Tanpa template, tombolnya sama sekali tidak muncul.',
  'help.guide.apply-packing-template.tip.3':
    '“Simpan sebagai template” hanya muncul untuk admin instans, dan hanya selama daftar berisi barang. Yang disimpan adalah barang bersama dan barang milikmu, tidak pernah barang pribadi anggota lain.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Tempel seluruh daftar perlengkapan',
  'help.guide.import-packing-list.goal':
    'Ubah daftar yang sudah kamu punya di tempat lain menjadi barang bawaan sekaligus.',
  'help.guide.import-packing-list.step.1': 'Klik “Impor”, ikon panah ke bawah di ujung kanan bar di atas daftar.',
  'help.guide.import-packing-list.step.2':
    'Satu item per baris: Kategori, Nama, Berat dalam g (opsional), Tas (opsional), checked/unchecked (opsional). Contoh abu-abu di kotak menampilkan keempat formatnya, dan angka di tepi kirinya menghitung baris yang kamu ketik. Daftar Markdown juga bisa: judul menjadi nama daftar, dan "- [ ]" serta "- [x]" menjadi item.',
  'help.guide.import-packing-list.step.3':
    'Atau muat barisnya dari file lewat “Muat CSV/TXT/MD”, di kiri bawah dialog. File .csv, .txt, atau .md diterima dan menggantikan isi kotak.',
  'help.guide.import-packing-list.step.4':
    'Klik “Impor 3” di kanan bawah. Angka di tombol itu menunjukkan jumlah baris yang berhasil dibaca TREK.',
  'help.guide.import-packing-list.result':
    'Setiap baris menjadi satu barang, di daftar yang namanya ada di kolom pertama. Barang yang sudah ada tidak berubah.',
  'help.guide.import-packing-list.tip.1':
    'Koma, titik koma, dan tab sama-sama memisahkan kolom, dan tanda kutip ganda menyatukan isi kolom, jadi "Shirt, blue" tetap jadi satu nama. Baris yang hanya berisi satu nilai dianggap sebagai nama. Baris tanpa nama daftar masuk ke “Lainnya”. "3x" di depan nama menentukan jumlahnya.',
  'help.guide.import-packing-list.tip.2':
    'Jika perjalanan belum punya tas yang disebut di kolom keempat, TREK akan membuatnya. “Impor” dan “Terapkan template” adalah dua cara untuk menambahkan berat dan tas ke banyak item sekaligus.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Cetak atau ekspor daftar perlengkapan',
  'help.guide.export-packing-list.goal':
    'Cetak daftarnya, simpan sebagai PDF, atau ekspor sebagai file untuk aplikasi lain atau perjalanan berikutnya.',
  'help.guide.export-packing-list.step.1':
    'Klik “Ekspor”, ikon panah ke atas di bar di atas daftar, tepat sebelum “Impor”.',
  'help.guide.export-packing-list.step.2':
    '“Daftar periksa Markdown (.md)” dan “CSV untuk impor (.csv)” langsung menyimpan daftar sebagai file.',
  'help.guide.export-packing-list.step.3':
    'Klik “Cetak atau simpan sebagai PDF”. Pratinjau menampilkan daftar dalam bentuk halaman: di bagian atas ada perjalanan, tanggalnya, dan berapa yang sudah dikemas, lalu setiap daftar sebagai kartu dengan kotak centang untuk setiap barang.',
  'help.guide.export-packing-list.step.4':
    'Klik “Cetak atau simpan sebagai PDF” di bawah pratinjau. Browser membuka dialog cetak: pilih printer, atau “Simpan sebagai PDF” untuk menyimpan file.',
  'help.guide.export-packing-list.result':
    'Hasil cetak dan file berisi tampilan yang sedang terbuka, “Dibagikan” atau “Daftar saya”, lengkap dengan jumlah, berat, dan tanda centang.',
  'help.guide.export-packing-list.tip.1':
    'CSV adalah format yang dibaca “Impor”, termasuk data tas, jadi kamu bisa memakainya sebagai template perlengkapan sendiri: impor ke perjalanan berikutnya.',
  'help.guide.export-packing-list.tip.2':
    'File Markdown terbuka sebagai daftar periksa di Obsidian, Notion, atau GitHub, dan bisa kamu impor lagi lewat “Impor”.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Menentukan siapa yang melihat item dan siapa yang membawanya',
  'help.guide.share-packing-item.goal':
    'Pindahkan item antara daftar bersama rombongan, daftarmu sendiri, dan orang-orang yang kamu bawakan.',
  'help.guide.share-packing-item.step.1':
    'Di atas daftar, “Dibagikan” adalah daftar yang dilihat semua orang dan “Daftar saya” adalah daftar pribadimu. Masing-masing menunjukkan jumlah barangnya. Klik “Daftar saya” untuk melihat daftarmu.',
  'help.guide.share-packing-item.step.2':
    'Kembali ke “Dibagikan”, buka menu titik tiga di ujung baris, lalu klik “Berbagi”.',
  'help.guide.share-packing-item.step.3':
    'Ada tiga tingkat: “Dibagikan”, terlihat oleh semua orang di grup; “Pribadi”, hanya kamu yang bisa melihat; dan “Bagikan dengan…”, untuk memilih orang yang terkait dengan barang itu.',
  'help.guide.share-packing-item.step.4':
    'Barang “Pribadi” hanya ada di “Daftar saya”. Beralih ke “Daftar saya” untuk menemukannya.',
  'help.guide.share-packing-item.step.5':
    'Buka lagi “Berbagi” dan centang sebuah nama di bawah “Bagikan dengan…”. Item itu juga tampil di daftar orang tersebut, dan barisnya mendapat lencana kecil berisi jumlah orang yang dibagikan.',
  'help.guide.share-packing-item.result':
    'Item itu berada di tingkat yang kamu pilih, dan barisnya menunjukkan siapa yang membawanya.',
  'help.guide.share-packing-item.tip.1':
    'Hanya orang yang membawa item yang bisa mengubah pengaturan berbaginya. Orang yang kamu bagikan melihat item itu di “Daftar saya” miliknya dengan lencana tangan kecil, yang menampilkan namamu saat kursor diarahkan ke sana. Dia bisa mencentangnya.',
  'help.guide.share-packing-item.tip.2':
    'Pada barang bersama yang dibawa orang lain, menu titik tiga menampilkan dua pilihan lain sebagai ganti “Berbagi”: “Saya juga bisa membawanya”, yang menambahkanmu di samping mereka, dan “Salin ke daftar saya”, yang membuat salinan pribadi untukmu.',
  'help.guide.share-packing-item.tip.3':
    'Pengaturan berbagi item baru mengikuti tampilan tempat kamu menambahkannya. Item yang ditambahkan di “Dibagikan” dibagikan ke semua orang. Item yang ditambahkan di “Daftar saya” bersifat “Pribadi”, kecuali semua item di daftar itu dibagikan ke orang yang sama: dalam hal itu, item baru juga dibagikan ke mereka.',
  // packing-bags
  'help.guide.packing-bags.title': 'Timbang tas',
  'help.guide.packing-bags.goal':
    'Isi berat setiap barang, kelompokkan barang ke dalam tas, dan pastikan setiap tas tidak melebihi batas maskapai.',
  'help.guide.packing-bags.step.1': 'Klik lencana berat sebelum lingkaran, lalu ketik berat barang dalam gram.',
  'help.guide.packing-bags.step.2': 'Lingkaran setelah berat adalah tas item itu. Klik lingkarannya.',
  'help.guide.packing-bags.step.3':
    'Jika belum ada tas, klik “Tambah tas”, ketik nama, lalu tekan Enter. Tasnya dibuat dan item langsung dimasukkan ke dalamnya.',
  'help.guide.packing-bags.step.4':
    'Kartu “Tas” muncul di kanan daftar begitu ada satu tas. Setiap tas menampilkan namanya, siapa yang membawanya, bar isi, berapa item di dalamnya, dan beratnya. Di bawah tas ada “Tidak ditugaskan” dan “Total berat”, dengan “Sudah dikemas” di bawahnya: berat yang sudah dikemas, dan bar tipis untuk porsinya.',
  'help.guide.packing-bags.step.5':
    'Klik “Atur batas” di samping berat tas, lalu ketik batasnya dalam kilogram, seperti yang ditetapkan maskapai.',
  'help.guide.packing-bags.step.6':
    'Tanda plus putus-putus di ujung baris nama tas, tepat sebelum tanda silang, membuka “Tetapkan anggota”. Centang anggota yang membawa tas itu: mereka tampil di samping tanda plus, dan “Per orang” di bagian bawah kartu mencantumkan apa yang dibawa masing-masing.',
  'help.guide.packing-bags.result':
    'Kartu “Tas” di kanan menunjukkan berat setiap tas dibandingkan batasnya, barang yang belum masuk tas mana pun, apa yang dibawa setiap orang, serta totalnya beserta bagian yang sudah dikemas.',
  'help.guide.packing-bags.tip.1':
    'Kolom berat, lingkaran tas, dan kartu “Tas” hanya ada selama admin mengaktifkan “Pelacak Tas” di addon “Daftar”. Di jendela yang lebih sempit, tas dibuka lewat tombol “Tas” di atas kartu progres.',
  'help.guide.packing-bags.tip.2':
    'Server menghitung berat tas dari barang semua anggota, termasuk yang tidak bisa kamu lihat, jadi angkanya adalah berat tas yang sebenarnya.',
  'help.guide.packing-bags.tip.3':
    'Tas tanpa batas dibandingkan dengan tas terberat, jadi bilahnya tetap bisa dibandingkan. Kalau tas diberi batas, bilahnya diukur terhadap batas itu.',
  // create-todo
  'help.guide.create-todo.title': 'Tambah tugas',
  'help.guide.create-todo.goal': 'Catat tugas, lengkap dengan daftar, prioritas, tanggal, dan orang yang ditugaskan.',
  'help.guide.create-todo.step.1': 'Klik “Tugas baru” di ujung kanan bar.',
  'help.guide.create-todo.step.2':
    'Dialog “Tugas baru” terbuka dengan kursor di bagian atas. Ketik namanya di kolom “Nama tugas”, dan tambahkan apa pun yang perlu diingat di bawah “Deskripsi”.',
  'help.guide.create-todo.step.3':
    '“Daftar” mengelompokkan tugas. Pilih salah satu, atau pakai tanda plus di sebelahnya untuk memberi nama daftar baru di dialog kecil.',
  'help.guide.create-todo.step.4':
    '“Prioritas” punya empat tombol: “Tidak ada”, P1, P2, dan P3, dari merah sampai biru.',
  'help.guide.create-todo.step.5':
    '“Tenggat waktu”, di samping “Daftar”, membuka kalender, dan “Ditugaskan ke” menugaskan tugas ke seseorang.',
  'help.guide.create-todo.step.6': 'Klik “Buat tugas”.',
  'help.guide.create-todo.result':
    'Tugas itu ada di daftar dengan prioritas, tenggat waktu, dan daftarnya sebagai lencana, serta avatar orang yang ditugaskan di ujung baris, dan tugas itu terbuka di panel kanan.',
  'help.guide.create-todo.tip.1': 'Hanya nama yang wajib. Semua yang lain bisa diisi nanti dari panel kanan.',
  'help.guide.create-todo.tip.2': 'Jika ada daftar yang dipilih di sidebar, tugas baru langsung masuk ke daftar itu.',
  'help.guide.create-todo.tip.3': 'Menekan Enter di kolom nama langsung membuat tugas, tanpa mengisi kolom lainnya.',
  // todo-filters
  'help.guide.todo-filters.title': 'Cari dan ubah tugas',
  'help.guide.todo-filters.goal': 'Tampilkan hanya tugas yang penting saat ini, lalu edit tugas yang kamu temukan.',
  'help.guide.todo-filters.step.1':
    '“Tugas” di panel samping: “Semua” menampilkan semua yang belum selesai, “Tugasku” menampilkan tugas yang ditugaskan kepadamu, “Terlambat” menampilkan tugas yang tanggalnya sudah lewat, dan “Selesai” menampilkan tugas yang sudah selesai. Masing-masing menunjukkan jumlahnya. Klik “Terlambat”.',
  'help.guide.todo-filters.step.2':
    'Di bawah “Daftar” ada satu baris untuk setiap daftar. Pilih salah satu untuk menampilkan daftar itu, termasuk tugas yang sudah selesai.',
  'help.guide.todo-filters.step.3':
    'Pengurutan di bagian atas daftar mengubah urutan yang tampil di layar: “Prioritas” menaruh P1 paling depan, “Tenggat waktu” menaruh tenggat terdekat paling depan. Hanya satu yang bisa dipakai sekaligus, dan klik kedua mengembalikan urutanmu sendiri.',
  'help.guide.todo-filters.step.4': 'Klik tugas untuk membukanya di panel kanan.',
  'help.guide.todo-filters.step.5':
    'Ubah yang perlu: nama, “Prioritas”, “Daftar”, “Tenggat waktu”, atau “Ditugaskan ke”. “Deskripsi” menampilkan teksnya dengan tautan yang bisa diklik; klik di dalamnya untuk mengedit. Lalu klik “Simpan perubahan” di bagian bawah panel. Kotak di header panel menandai tugas selesai, dan “Hapus” di samping “Simpan perubahan” langsung menghapusnya.',
  'help.guide.todo-filters.result':
    'Daftar hanya menampilkan tugas yang kamu cari, dan panel di kanan menampilkan tugas yang kamu pilih untuk diedit.',
  'help.guide.todo-filters.tip.1':
    'Baris daftar hanya menghitung tugas yang belum selesai, tetapi saat dipilih, tugas yang sudah selesai juga ditampilkan. “Semua”, “Tugasku”, dan “Terlambat” menyembunyikan tugas yang sudah selesai, sedangkan “Selesai” hanya menampilkan tugas yang sudah selesai.',
  'help.guide.todo-filters.tip.2':
    '“Prioritas” dan “Tenggat waktu” di pengurutan tidak bisa dipakai bersamaan. Selama salah satunya aktif, baris tidak bisa diseret untuk diurutkan sendiri.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Pemesanan',
  'help.ctx.trip-bookings.summary':
    'Tab ini berisi semua yang dipesan untuk perjalanan selain transportasi: penginapan, meja restoran, tiket, tur, dan parkir. Setiap pemesanan tampil sebagai kartu, baris daftar, atau bar di linimasa, lengkap dengan kode, dokumen, peserta, dan biayanya. Klik pemesanan untuk membuka detailnya.',
  'help.ctx.trip-bookings.bullet.1':
    '“Pemesanan Manual” di ujung kanan bar membuka “Reservasi Baru”. Di sana bisa dibuat enam jenis pemesanan: “Akomodasi”, “Restoran”, “Acara”, “Tur”, “Parkir”, dan “Lainnya”. Penerbangan, kereta, dan transportasi lainnya ada di tab “Transportasi” dan tidak pernah muncul di sini.',
  'help.ctx.trip-bookings.bullet.2':
    'Ikon unduh sebelum “Pemesanan Manual”, “Impor konfirmasi pemesanan”, mengunggah konfirmasi agar TREK bisa membacanya secara otomatis: EML, PDF, PKPass, HTML, atau TXT, maksimal lima file masing-masing 10 MB, serta foto jika model AI bisa membaca gambar. Ikon ini hanya ada jika server bisa membacanya.',
  'help.ctx.trip-bookings.bullet.3':
    '“Cari” menelusuri judul, jenis, tempat, catatan, kode pemesanan, dan peserta. “Filter”, ikon corong di sebelahnya, menyaring tab berdasarkan “Status”, berdasarkan “Jenis” beserta jumlahnya masing-masing, dan berdasarkan “Peserta” begitu ada pemesanan yang mencantumkan orang. Angka di ikon corong menunjukkan berapa filter yang aktif.',
  'help.ctx.trip-bookings.bullet.4':
    'Tiga ikon setelah Filter mengubah tampilan: “Kartu”, “Daftar”, dan “Linimasa”. “Opsi tampilan”, ikon penggeser di sampingnya, mengelompokkan dan mengurutkan kartu dan daftar atau mengatur jalur linimasa, dan ikon spreadsheet setelahnya, “Ekspor sebagai spreadsheet (CSV)”, mengunduh isi tab sebagai file. Secara default, kartu dikelompokkan ke “Dikonfirmasi” dan “Menunggu”, dan daftar per hari. Klik judul bagian untuk melipatnya.',
  'help.ctx.trip-bookings.bullet.5':
    'Setiap kartu punya header berwarna sesuai statusnya, berisi titik status (klik untuk beralih antara “Menunggu” dan “Dikonfirmasi”), jenis, judul, ikon pensil, dan ikon tempat sampah. Di bawahnya ada detail yang dimiliki pemesanan itu: “Tanggal”, “Waktu”, “Kode Pemesanan”, “Check-in” dan “Check-out”, “Lokasi / Alamat”, “Akomodasi”, “Terhubung ke” (perhentian di rencana), “Tautan”, “Catatan”, “Peserta”, “File”, dan biaya yang tertaut.',
  'help.ctx.trip-bookings.bullet.6':
    'Klik kartu, baris, atau bar untuk membuka detail pemesanan, dengan “Di peta” (jika pemesanan punya tempat), ikon tempat sampah, dan “Edit” di bagian bawahnya. Menghapus akan meminta konfirmasi sekali (“Hapus pemesanan?”, yang memberi tahu jika biaya ikut terhapus). Setelah itu, pemesanan beserta pengeluaran yang tertaut dihapus, dan untuk akomodasi, malam-malamnya dikeluarkan dari rencana hari.',
  // booking-views
  'help.guide.booking-views.title': 'Ganti tampilan dan buka pemesanan',
  'help.guide.booking-views.goal':
    'Lihat pemesanan sebagai kartu, daftar, atau linimasa, lalu buka salah satunya untuk melihat semua detailnya.',
  'help.guide.booking-views.step.1':
    'Tiga ikon setelah Filter di bar adalah pilihan tampilan, dan masing-masing menampilkan namanya saat kursor diarahkan: “Kartu”, “Daftar”, dan “Linimasa”. Tab terbuka di “Kartu”, satu kartu per pemesanan dalam bagian “Dikonfirmasi” dan “Menunggu”. Klik “Daftar”, ikon yang di tengah.',
  'help.guide.booking-views.step.2':
    '“Daftar” menampilkan satu baris per pemesanan di bawah judul per hari, dengan hari dan jam di kanan; tombol panah untuk berpindah antarbaris. Klik “Linimasa”, ikon terakhir dari ketiganya.',
  'help.guide.booking-views.step.3':
    '“Linimasa” menampilkan pemesanan di sepanjang hari-hari perjalanan: satu lajur per jenis, dan sebuah bar dari awal sampai akhir setiap pemesanan. Pemesanan yang masih menunggu bergaris tepi putus-putus. “Perjalanan” menampilkan seluruh perjalanan selebar layar; klik judul suatu hari untuk melihat hari itu per jam.',
  'help.guide.booking-views.step.4':
    '“Hari” menampilkan satu hari dalam skala jam, dan panjang setiap bar menunjukkan durasinya. Panah di samping nama hari untuk pindah ke hari sebelum dan sesudahnya. Selama perjalanan berlangsung, “Hari ini” langsung ke hari ini, dan sakelar “Perjalanan” dan “Hari” di kanan kembali ke seluruh perjalanan.',
  'help.guide.booking-views.step.5':
    'Arahkan kursor ke sebuah batang untuk melihat hari, waktu, dan tempatnya, lalu klik untuk membuka detail pemesanan. Kartu di “Kartu” dan baris di “Daftar” membuka popup yang sama.',
  'help.guide.booking-views.step.6':
    'Header tampilan detail menampilkan judul dan label untuk status (klik untuk menggantinya), jenis, hari, dan kode pemesanan, dengan tombol untuk menyalinnya. Di bawahnya ada waktu dalam bentuk kotak, lalu tempat, peserta, catatan, biaya, dan file, kalau ada, dan paling bawah ada “Di peta”, ikon tempat sampah, dan “Edit”.',
  'help.guide.booking-views.result':
    'Pemesanan terbuka di tampilan detail: “Edit” membuka formulirnya, “Di peta” menampilkannya di rencana, dan “Tutup” atau Escape mengembalikanmu ke tampilan sebelumnya.',
  'help.guide.booking-views.tip.1':
    '“Opsi tampilan”, ikon slider setelah ikon tampilan, untuk mengelompokkan dan mengurutkan “Kartu” dan “Daftar” lewat “Kelompokkan menurut” dan “Urutkan”. Di “Linimasa”, tersedia “Satu lajur per jenis” dan “Tampilkan tab lainnya”. “Tampilkan tab lainnya” menampilkan entri tab “Transportasi” secara samar di lajur tipis di bagian atas. “Atur ulang tampilan” mengembalikan pengaturan default, dan setiap tab mengingat tampilannya di browser ini.',
  'help.guide.booking-views.tip.2':
    'Pemesanan sebelum atau sesudah perjalanan, atau yang tidak bertanggal, tidak bisa tampil di linimasa. Pemesanan itu tampil di bawah diagram sebagai kartu kecil di bawah “Sebelum perjalanan”, “Setelah perjalanan”, atau “Tanpa tanggal”.',
  'help.guide.booking-views.tip.3':
    'Detail yang sama terbuka di mana pun pemesanan itu muncul: di tab “Transportasi”, di rencana hari, di detail suatu hari, dan di detail tempat. Klik judulnya untuk mengganti nama pemesanan.',
  // create-booking
  'help.guide.create-booking.title': 'Membuat pemesanan',
  'help.guide.create-booking.goal':
    'Tambahkan restoran, acara, tur, tempat parkir, atau apa pun ke perjalanan secara manual.',
  'help.guide.create-booking.step.1':
    'Klik “Pemesanan Manual” di ujung kanan bilah. “Reservasi Baru” terbuka, dengan judul dan dua label di header bagian atas.',
  'help.guide.create-booking.step.2':
    'Klik label jenis di pita atas, yang bertuliskan “Lainnya” pada pemesanan baru, lalu pilih “Jenis Pemesanan”. Tab ini bisa membuat enam jenis: “Akomodasi”, “Restoran”, “Acara”, “Tur”, “Parkir”, dan “Lainnya”. Formulir berubah sesuai pilihanmu: hanya “Akomodasi” yang memakai rentang hari, bukan tanggal.',
  'help.guide.create-booking.step.3':
    'Ketik judul di pita atas, yaitu kolom di atas label. Hanya kolom ini yang wajib diisi, dan “Tambah” tetap abu-abu sampai kamu mengisinya.',
  'help.guide.create-booking.step.4':
    'Atur “Tanggal” dan “Waktu mulai”, serta “Tanggal selesai” dan “Waktu selesai” jika pemesanan punya akhir. Kalender hanya menawarkan hari dalam rentang perjalanan. Tanggal dan jam selesai yang tidak setelah waktu mulai tampil merah dan membuat “Tambah” tidak bisa diklik. Jam selesai sebelum jam mulai tanpa tanggal selesai hanya memberi peringatan: jika pemesanan berakhir keesokan harinya, isi tanggal selesainya.',
  'help.guide.create-booking.step.5':
    'Isi “Kode Pemesanan” dari konfirmasi, lalu klik pil status di header, di samping jenisnya. Pada pemesanan baru, pil itu bertuliskan “Menunggu” dan berubah menjadi “Dikonfirmasi”. Status menentukan di bagian mana kartunya tampil.',
  'help.guide.create-booking.step.6': 'Klik “Tambah” di bagian bawah formulir.',
  'help.guide.create-booking.result':
    'Pemesanan itu tampil sebagai kartu di bagiannya. Warna header-nya menunjukkan statusnya, dan kartunya menampilkan jenis, tanggal, jam, dan kodenya. Semua orang lain dalam perjalanan langsung melihatnya.',
  'help.guide.create-booking.tip.1':
    '“Lokasi / Alamat” menyarankan alamat nyata saat kamu mengetik. Memilih salah satunya akan menggantikan yang kamu tulis, sedangkan alamat yang kamu ketik sendiri disimpan apa adanya.',
  'help.guide.create-booking.tip.2':
    'Di “Tautan”, masukkan halaman pemesanan itu di situs penyedianya. Kartu dan tampilan detail menampilkannya sebagai tautan yang terbuka di tab baru.',
  'help.guide.create-booking.tip.3':
    '“Catatan” mendukung Markdown, jadi daftar atau baris tebal tampil sebagai daftar atau teks tebal di kartu dan di tampilan detail.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Pesan tempat menginap',
  'help.guide.booking-hotel.goal':
    'Masukkan akomodasi agar sekaligus terhitung sebagai pemesanan dan sebagai malam-malam di rencana hari.',
  'help.guide.booking-hotel.step.1':
    'Klik “Pemesanan Manual” dan pilih “Akomodasi” lewat pil jenis di bagian atas. Kolom tanggal diganti dengan sekumpulan kolom hotel.',
  'help.guide.booking-hotel.step.2':
    'Pilih hotelnya di bawah “Akomodasi”. Daftarnya berisi tempat-tempat perjalanan, tanpa jejak dan tur yang diimpor. Saat kamu memilih salah satunya, namanya masuk ke judul yang masih kosong dan alamatnya ke “Lokasi / Alamat”.',
  'help.guide.booking-hotel.step.3':
    'Atur “Dari” dan “Sampai”: malam pertama dan pagi saat kamu pergi. Keduanya menawarkan hari-hari perjalanan beserta tanggalnya, dan TREK memastikan “Sampai” selalu setelah “Dari”.',
  'help.guide.booking-hotel.step.4':
    'Isi “Check-in”, “Check-in sampai”, dan “Check-out”, serta “Kode Pemesanan” dari email konfirmasi.',
  'help.guide.booking-hotel.step.5': 'Klik “Tambah”.',
  'help.guide.booking-hotel.result':
    'Kartu menampilkan rentang hari di bawah “Tanggal”, waktu check-in dan check-out, serta alamatnya. Penginapan itu kini juga muncul di hari-hari tersebut pada rencana.',
  'help.guide.booking-hotel.tip.1':
    '“Akomodasi” adalah satu-satunya jenis tanpa “Tanggal” dan “Waktu mulai”. Tanggalnya diisi lewat “Dari” dan “Sampai”, dan yang dipilih adalah hari-hari perjalanan, bukan tanggal kalender.',
  'help.guide.booking-hotel.tip.2':
    'Biarkan “Akomodasi” kosong dan ketik alamatnya saja: tempat itu dicarikan, dibuat, dan disematkan di peta untukmu.',
  'help.guide.booking-hotel.tip.3': 'Jika pemesanan dihapus, malam-malamnya juga dikeluarkan dari rencana hari.',
  // link-booking
  'help.guide.link-booking.title': 'Menautkan pemesanan ke rencana',
  'help.guide.link-booking.goal':
    'Tautkan pemesanan ke perhentian dan tempatnya, supaya muncul di tempat yang kamu butuhkan.',
  'help.guide.link-booking.step.1':
    'Arahkan kursor ke kartu yang ingin ditautkan dan klik ikon pensil di header-nya. “Edit Reservasi” terbuka.',
  'help.guide.link-booking.step.2':
    'Buka “Hubungkan ke jadwal harian”. Daftarnya menampilkan rencanamu: judul untuk setiap hari, lalu perhentian di hari itu, bernomor dan lengkap dengan waktunya. Pilih perhentian yang terkait dengan pemesanan itu.',
  'help.guide.link-booking.step.3':
    '“Tempat / Aktivitas” menautkan tempatnya langsung. Pilih di sana, dan judul serta “Lokasi / Alamat” terisi kalau masih kosong.',
  'help.guide.link-booking.step.4': 'Klik “Perbarui”.',
  'help.guide.link-booking.result':
    'Kartu menampilkan hari dan perhentiannya di bawah “Terhubung ke”, dan pemesanan itu tampil bersama perhentian tersebut di rencana hari.',
  'help.guide.link-booking.tip.1':
    '“Tanpa tautan (mandiri)” di bagian atas daftar melepas tautannya lagi. Akomodasi tidak punya pemilih perhentian: akomodasi tertaut lewat malam-malamnya.',
  'help.guide.link-booking.tip.2':
    'Memilih perhentian di hari yang punya tanggal akan mengisi “Tanggal” yang masih kosong. Tanggal yang sudah kamu atur tidak diubah.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Tentukan untuk siapa pemesanan ini',
  'help.guide.booking-travelers.goal':
    'Tandai untuk peserta siapa saja pemesanan ini, lalu tampilkan hanya pemesanan mereka.',
  'help.guide.booking-travelers.step.1':
    'Buka pemesanan lewat ikon pensil di kartunya. “Peserta” ada di samping “Kode Pemesanan”, dan bertuliskan “Tetapkan peserta” selama belum ada yang ditetapkan untuk pemesanan itu.',
  'help.guide.booking-travelers.step.2':
    'Klik kolom itu dan pilih orang-orang yang ikut dalam pemesanan ini; tamu yang sudah diberi nama juga ada di daftar. Orang yang dipilih mendapat tanda centang dan avatarnya muncul di kolom. Klik namanya lagi untuk menghapusnya.',
  'help.guide.booking-travelers.step.3': 'Klik “Perbarui”.',
  'help.guide.booking-travelers.step.4':
    'Klik Filter di bar: di bawah “Peserta”, klik seseorang untuk melihat pemesanan miliknya saja. Beberapa orang bisa dipilih sekaligus.',
  'help.guide.booking-travelers.result':
    'Kartu menampilkan orang-orang yang tercakup dalam pemesanan itu, dan “Filter” menyaring tab menjadi pemesanan milik orang yang kamu pilih.',
  'help.guide.booking-travelers.tip.1':
    'Di kartu dan tampilan detail, peserta hanya ditampilkan dan tidak bisa diubah. Kamu mengaturnya di sini, di formulir.',
  'help.guide.booking-travelers.tip.2':
    '“Peserta” muncul di “Filter” begitu perjalanan punya lebih dari satu anggota dan minimal satu pemesanan mencantumkan orang. Pilihanmu tetap berlaku sampai kamu menutup tab browser.',
  // booking-files
  'help.guide.booking-files.title': 'Simpan voucher bersama pemesanannya',
  'help.guide.booking-files.goal': 'Lampirkan konfirmasi, tiket, atau pass ke pemesanan yang bersangkutan.',
  'help.guide.booking-files.step.1':
    'Buka pemesanan lewat ikon pensil di kartunya. “File” ada di samping “Tautkan”; klik “Lampirkan file” di sana. Pada pemesanan yang sudah ada, dokumen langsung diunggah dan TREK menampilkan “File diunggah”.',
  'help.guide.booking-files.step.2':
    'Dokumen tercantum dengan namanya, dengan tombol untuk membukanya dan X di sampingnya.',
  'help.guide.booking-files.step.3':
    '“Hubungkan file yang ada” menampilkan dokumen perjalanan yang belum terlampir di pemesanan ini. Pilih salah satu dan dokumen itu langsung terlampir tanpa perlu diunggah lagi.',
  'help.guide.booking-files.step.4': 'Klik “Perbarui”.',
  'help.guide.booking-files.result':
    'Kartu dan tampilan detail mencantumkan dokumennya di bawah “File”. Klik dokumen untuk membukanya. “Tampilkan di File”, di atas daftar pada tampilan detail, membawamu ke tab “File”.',
  'help.guide.booking-files.tip.1':
    'Pada pemesanan yang masih kamu buat, dokumen diunggah saat kamu klik “Tambah”. Mengunggah memerlukan koneksi.',
  'help.guide.booking-files.tip.2':
    'Tanda X di samping dokumen hanya menghapus tautannya, bukan dokumennya. Dokumen tetap ada di tab “File” perjalanan.',
  'help.guide.booking-files.tip.3':
    'Administrator menentukan jenis file yang bisa dilampirkan di “Jenis File yang Diizinkan”. Secara default, dokumen, teks, dan gambar diizinkan.',
  // booking-cost
  'help.guide.booking-cost.title': 'Menjadikan harga pemesanan sebagai biaya',
  'help.guide.booking-cost.goal':
    'Tambahkan biaya pemesanan ke “Biaya”, dibagi di antara orang-orang yang membayarnya.',
  'help.guide.booking-cost.step.1':
    'Buka pemesanan lewat ikon pensil di kartunya, lalu gulir ke bagian bawah formulir. Di bawah “Biaya” ada “Buat pengeluaran” dan “Tautkan pengeluaran yang ada”, dengan keterangan Menyimpan pemesanan, lalu membuka editor biaya.',
  'help.guide.booking-cost.step.2':
    'Klik “Buat pengeluaran”. Pemesanan disimpan, formulirnya ditutup, lalu editor “Biaya” terbuka sebagai “Tambah pengeluaran”.',
  'help.guide.booking-cost.step.3':
    'Nama di header sudah berisi judul pemesanan, dan “Hari” sudah berisi hari pemesanannya. Isi “Jumlah total” dan periksa “Mata uang” di sampingnya.',
  'help.guide.booking-cost.step.4':
    'Label di header adalah “Kategori”, yang sudah diatur sesuai jenis pemesanan. Di bawah “Siapa yang membayar?”, pilih siapa yang membayar, dan di bawah “Pembagian”, pilih cara membagi jumlahnya.',
  'help.guide.booking-cost.step.5': 'Klik “Tambah pengeluaran”.',
  'help.guide.booking-cost.result':
    'Kartu menampilkan nominal di bagian bawah, formulir pemesanan mencantumkan pengeluaran di bawah “Pengeluaran tertaut”, dan pengeluaran yang sama muncul di tab “Biaya”, tertaut ke pemesanan ini.',
  'help.guide.booking-cost.tip.1':
    'Kategorinya mengikuti jenis pemesanan: “Restoran” menjadi “Makanan & minuman”, “Akomodasi” menjadi “Akomodasi”, “Parkir” menjadi “Parkir”, dan “Acara” serta “Tur” sama-sama menjadi “Lainnya”.',
  'help.guide.booking-cost.tip.2':
    'Satu pemesanan bisa punya beberapa pengeluaran. “Tautkan pengeluaran yang ada” menawarkan pengeluaran di “Biaya” yang belum tertaut ke apa pun. Pada pengeluaran yang tertaut, “Lepas tautan, simpan pengeluaran” melepas tautannya dan tetap menyimpan pengeluaran itu di “Biaya”, sedangkan ikon tempat sampah menghapusnya.',
  'help.guide.booking-cost.tip.3':
    '“Biaya” hanya ada di formulir selama addon Biaya aktif, yang diatur administrator di bawah “Addon”.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Cari pemesanan',
  'help.guide.filter-bookings.goal': 'Saring tab yang panjang berdasarkan kata, status, jenis, atau orang.',
  'help.guide.filter-bookings.step.1':
    'Ketik di “Cari” pada bilah. Pencarian mencakup judul, jenis, tempat dan alamat, catatan, kode pemesanan, dan nama peserta, dan hasil di tab menyempit sambil kamu mengetik. Escape mengosongkan kotaknya.',
  'help.guide.filter-bookings.step.2':
    'Klik “Filter”, ikon corong di samping pencarian. Panelnya berisi “Status”, “Jenis”, dan, begitu ada pemesanan yang mencantumkan orang, “Peserta”.',
  'help.guide.filter-bookings.step.3':
    'Di bawah Status, pilih “Dikonfirmasi” atau “Menunggu” untuk melihat yang itu saja; “Semua” menampilkan keduanya.',
  'help.guide.filter-bookings.step.4':
    'Di bawah “Jenis”, klik satu atau beberapa jenis untuk menampilkan jenis itu saja. Setiap jenis menunjukkan jumlah pemesanannya, dan tanda centang menandai yang dipilih.',
  'help.guide.filter-bookings.step.5':
    'Angka di Filter menunjukkan berapa filter yang aktif, dan chip di samping pencarian menunjukkan berapa pemesanan yang tersisa dari totalnya. Klik chip itu, atau “Atur ulang filter” di bagian bawah panel, untuk melihat semuanya lagi.',
  'help.guide.filter-bookings.result':
    'Tab hanya menampilkan yang kamu pilih, baik di “Kartu”, “Daftar”, maupun “Linimasa”, dan filternya tetap berlaku untuk perjalanan ini sampai kamu menutup tab browser.',
  'help.guide.filter-bookings.tip.1':
    '“Jenis” hanya muncul kalau tab berisi lebih dari satu jenis, dan hanya menampilkan jenis yang ada di tab. Jadi kalau tidak ada tur di tab, “Jenis” tidak punya pilihan “Tur”.',
  'help.guide.filter-bookings.tip.2':
    'Kalau tidak ada yang cocok dengan filter, tab menampilkan “Tidak ada yang cocok dengan filter ini”, dengan “Atur ulang filter” tepat di bawahnya.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Impor pemesanan dari email konfirmasi',
  'help.guide.import-booking-file.goal':
    'Biarkan TREK membaca pemesanan dari email atau PDF yang dikirim penyedianya, jadi kamu tidak perlu mengetiknya lagi.',
  'help.guide.import-booking-file.step.1':
    'Klik ikon unduh di bar, “Impor konfirmasi pemesanan”; namanya muncul saat kursor diarahkan ke sana. Dialog dengan nama yang sama terbuka.',
  'help.guide.import-booking-file.step.2':
    'Jatuhkan konfirmasinya ke kotak, atau klik kotak lalu pilih filenya: EML, PDF, PKPass, HTML, dan TXT, maksimal lima file masing-masing 10 MB, serta foto (JPG, PNG, WEBP) jika model AI bisa membaca gambar. Kotak menampilkan nama file yang kamu pilih.',
  'help.guide.import-booking-file.step.3':
    'Klik “Impor”. Dialog langsung tertutup, karena file dibaca di latar belakang.',
  'help.guide.import-booking-file.step.4':
    'Sebuah kartu di kanan bawah menampilkan progresnya di bawah nama file. Kartu ini tetap terlihat saat kamu berpindah halaman di aplikasi, bahkan setelah halaman dimuat ulang. “Memproses file…” berubah menjadi tanda centang setelah pembacaan selesai, lalu kartu menampilkan “Impor”. Klik tombol itu.',
  'help.guide.import-booking-file.step.5':
    'Setiap pemesanan yang ditemukan terbuka di “Reservasi Baru” satu per satu, dan sudah terisi. Untuk hotel, isinya adalah nama hotel sebagai judul dan, kalau tempatnya ada di perjalanan, di bawah “Akomodasi”: “Lokasi / Alamat”, “Dari” dan “Sampai” pada malam-malamnya, “Check-in” dan “Check-out”, “Kode Pemesanan”, konfirmasi di bawah “File”, dan, kalau “Biaya” aktif, harganya sebagai “Pengeluaran tertaut”. Periksa, lalu klik “Tambah”.',
  'help.guide.import-booking-file.result':
    'Pemesanan tampil sebagai kartu di “Menunggu” dengan malam-malamnya, kodenya, dan konfirmasinya di bawah “File”. Penginapan itu muncul di hari-hari tersebut pada rencana. Kalau “Biaya” aktif, harganya ditambahkan sebagai pengeluaran yang tertaut ke pemesanan.',
  'help.guide.import-booking-file.tip.1':
    'Ikon impor hanya muncul kalau server bisa membaca konfirmasi. Untuk itu dibutuhkan extractor atau addon “Analisis AI”. Administrator mengaktifkan addon “Analisis AI” di “Addon”. Tab yang belum punya pemesanan juga menampilkannya sebagai tombol “Impor dari file”.',
  'help.guide.import-booking-file.tip.2':
    'Jika tidak ada yang bisa dibaca, kartu memberi tahu hal itu. Jika “Analisis AI” aktif, kartu menawarkan “Coba baca dengan AI”, yang mengirim file yang sama langsung ke model AI. Hasil pembacaan disimpan selama sepuluh menit; mulai peninjauan dalam rentang waktu itu.',
  'help.guide.import-booking-file.tip.3':
    'Konfirmasi hanya dilampirkan jika jenis filenya ada di “Jenis File yang Diizinkan” di pengaturan admin. PDF diizinkan secara default; email (EML) harus ditambahkan dulu, atau pemesanan disimpan tanpa lampiran itu.',
  // edit-booking
  'help.guide.edit-booking.title': 'Mengubah pemesanan',
  'help.guide.edit-booking.goal':
    'Perbaiki waktu, tambahkan kode yang baru datang belakangan, atau ubah status pemesanan dari “Menunggu” ke “Dikonfirmasi”.',
  'help.guide.edit-booking.step.1':
    'Arahkan kursor ke kartu dan klik ikon pensil di header-nya. “Edit Reservasi” terbuka dengan semua detail pemesanan.',
  'help.guide.edit-booking.step.2':
    'Ubah yang perlu diubah, misalnya “Kode Pemesanan” yang baru dikirim operator belakangan.',
  'help.guide.edit-booking.step.3':
    'Klik label “Menunggu” di pita atas. Label berubah menjadi “Dikonfirmasi”, dan pitanya menjadi hijau.',
  'help.guide.edit-booking.step.4': 'Klik “Perbarui”.',
  'help.guide.edit-booking.result':
    'Kartunya berpindah: pemesanan yang dikonfirmasi tampil di bagian “Dikonfirmasi” dengan titik hijau dan bagian atas berwarna hijau, dan semua orang dalam perjalanan melihat perpindahannya.',
  'help.guide.edit-booking.tip.1':
    'Jika “Kode Pemesanan” tidak terbaca, “Sembunyikan Kode Pemesanan” sedang aktif di “Pengaturan”, di bawah “Tampilan”. Arahkan kursor ke kodenya, atau klik, untuk membacanya.',
  'help.guide.edit-booking.tip.2':
    'Kalau jenisnya diubah, kategori pengeluaran yang tertaut ikut berubah, kecuali kamu sudah memilih kategorinya sendiri di editor “Biaya”.',
  'help.guide.edit-booking.tip.3':
    '“Edit” di bagian bawah tampilan detail pemesanan membuka formulir yang sama. Kamu juga bisa mengganti status tanpa formulir: klik titik di kartu atau baris, atau label status di tampilan detail.',
  // delete-booking
  'help.guide.delete-booking.title': 'Hapus pemesanan',
  'help.guide.delete-booking.goal': 'Hapus pemesanan yang dibatalkan dari perjalanan.',
  'help.guide.delete-booking.step.1':
    'Arahkan kursor ke kartu, lalu klik ikon tempat sampah di header-nya. Ikon tempat sampah di bagian bawah detail pemesanan juga melakukan hal yang sama.',
  'help.guide.delete-booking.step.2':
    '“Hapus pemesanan?” menyebutkan pemesanan yang kamu pilih dan bahwa pemesanan itu akan dihapus permanen. Jika ada biaya yang tertaut, biaya itu juga disebutkan akan ikut terhapus.',
  'help.guide.delete-booking.step.3': 'Klik “Hapus”.',
  'help.guide.delete-booking.result':
    'Kartu itu dihapus bagi semua orang dalam perjalanan. Penghapusan pemesanan tidak bisa dibatalkan, jadi pertanyaan konfirmasi adalah kesempatan terakhirmu untuk membatalkan.',
  'help.guide.delete-booking.tip.1':
    'Menghapus pemesanan juga menghapus pengeluaran yang tertaut dengannya. Menghapus akomodasi juga menghapus malam-malamnya dari rencana hari.',
  'help.guide.delete-booking.tip.2':
    'Dokumen yang terlampir tetap ada di tab “File” perjalanan. Hanya tautannya ke pemesanan yang dihapus.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Biaya',
  'help.ctx.trip-costs.summary':
    'Keuangan perjalanan: setiap pengeluaran dalam buku kas bertanggal atau tabel, siapa yang mencatatnya dan siapa yang menanggungnya, dalam mata uang yang tertera di kuitansi. Kolom kanan menunjukkan siapa yang harus membayar ke siapa untuk menyelesaikan saldo.',
  'help.ctx.trip-costs.bullet.1':
    'Bar di bagian atas menampilkan tanggal perjalanan dan peserta yang berbagi biaya. Bar itu juga berisi “Cari pengeluaran…”, Filter (ikon corong), “Ekspor CSV” (ikon unduh), dan sakelar “Daftar” / “Tabel”.',
  'help.ctx.trip-costs.bullet.2':
    'Di ujung kanannya, “Lunasi” mencatat semua transfer yang belum lunas sekaligus, “Pindai kuitansi” mengisi pengeluaran dari foto jika addon “Analisis AI” bisa membaca gambar, dan “Tambah pengeluaran” membuka editor.',
  'help.ctx.trip-costs.bullet.3':
    'Empat kartu di bawah bilah: “Kamu berhutang” dan “Kamu dipinjami” adalah bagianmu dalam pelunasan, “Jumlah tertunda” adalah pengeluaran yang sudah dicatat tetapi belum ada pembayarnya, dan “Total pengeluaran perjalanan” menjumlahkan semuanya, dengan “Bagianmu” dan “Kamu membayar” di bawahnya.',
  'help.ctx.trip-costs.bullet.4':
    'Buku kas dikelompokkan per hari, mulai dari yang terbaru, dan setiap hari diawali jumlah entri serta total pengeluarannya. Setiap baris menampilkan kategori sebagai tab berwarna, nama, chip pembayar dengan jumlah yang dibayar masing-masing, dan di bawahnya “Pembagian” dengan bagian setiap peserta (tanda centang menandai siapa yang sudah membayar bagiannya), lalu catatan dan jumlahnya, ditambah keterangan kamu meminjamkan atau kamu meminjam jika pembagian itu berarti orang lain berutang kepadamu atau kamu berutang.',
  'help.ctx.trip-costs.bullet.5':
    'Kolom kanan menampilkan hasilnya: “Lunasi” menunjukkan siapa membayar ke siapa, “Saldo” menunjukkan kelebihan atau kekurangan setiap peserta, “Anggaran akhir” menunjukkan biaya perjalanan untuk masing-masing, dan “Per kategori” menunjukkan untuk apa saja uangnya dipakai.',
  'help.ctx.trip-costs.bullet.6':
    'Pembayaran yang dicatat muncul di buku kas yang sama sebagai barisnya sendiri, dengan ikon pensil dan “Urungkan” di sampingnya. Pengeluaran punya ikon pensil dan tempat sampah, dan tempat sampah akan bertanya dulu sebelum menghapus pengeluaran itu. Pengeluaran yang punya kuitansi diberi chip “Kuitansi” di samping namanya untuk membukanya.',
  'help.ctx.trip-costs.bullet.7':
    '“Tabel” di bilah menampilkan pengeluaran yang sama dalam bentuk lembar kerja, dikelompokkan per kategori, dengan “Orang” dan “Hari” serta nominal per orang dan per hari. “Ringkasan” lalu menggantikan “Per kategori”. “Biaya” mengingat tampilan yang kamu pilih.',
  // add-expense
  'help.guide.add-expense.title': 'Tambah pengeluaran',
  'help.guide.add-expense.goal': 'Catat biaya sesuatu, siapa yang membayarnya, dan dengan siapa saja biaya itu dibagi.',
  'help.guide.add-expense.step.1':
    'Klik “Tambah pengeluaran” di ujung kanan bar. Editor terbuka dengan tanggal hari ini, dibayar olehmu, dan semua orang sudah masuk dalam pembagian.',
  'help.guide.add-expense.step.2':
    'Ketik untuk apa pengeluaran itu di kolom bagian atas dialog. Selama kosong, kolomnya menampilkan “mis. Makan malam, oleh-oleh, bensin…”. Ini nama pengeluarannya, dan pengeluaran tidak bisa disimpan tanpa nama.',
  'help.guide.add-expense.step.3':
    'Label di bawah nama adalah “Kategori”, yaitu “Makanan & minuman” sampai kamu memilih yang lain. Ada empat belas kategori dan tidak bisa diubah. Header berubah mengikuti warna kategori yang kamu pilih, begitu juga penanda di barisnya dan batangnya di “Per kategori”.',
  'help.guide.add-expense.step.4':
    'Masukkan nominal dari struk ke “Jumlah total”. “Mata uang” di sebelahnya awalnya diatur ke mata uang yang dipakai untuk menampilkan “Biaya”. Kalau kamu mengubahnya, editor menampilkan nominal hasil konversi. “Hari” awalnya diatur ke hari ini, dan pengeluaran dikelompokkan di bawah hari itu dalam daftar.',
  'help.guide.add-expense.step.5':
    'Di bawah “Siapa yang membayar?”, klik orang yang benar-benar membayar. “Kamu” sudah terpilih secara default. “Belum ada yang membayar” mencatat nominal tanpa membuat siapa pun berutang, dan “Beberapa orang membayar” di sakelar samping judul membagi tagihan ke beberapa pembayar.',
  'help.guide.add-expense.step.6':
    '“Pembagian” di bawahnya awalnya diatur ke “Rata”, dengan semua orang dicentang dan bagian masing-masing di samping namanya. Biarkan atau ubah. Klik “Tambah pengeluaran” di bagian bawah dialog untuk menyimpan.',
  'help.guide.add-expense.result':
    'Pengeluaran itu masuk ke buku kas di bawah harinya, ikut dihitung dalam “Total pengeluaran perjalanan”, dan kolom pelunasan sudah menghitung ulang siapa berutang ke siapa.',
  'help.guide.add-expense.tip.1':
    'Jika pengaturan awalnya tidak diubah, pengeluaran bertanggal hari ini, dibayar olehmu, dan dibagi rata ke semua orang: hanya nama dan jumlahnya yang perlu diisi.',
  'help.guide.add-expense.tip.2':
    'Tanda ± di samping jumlah mengubah pengeluaran menjadi pengembalian dana. Total negatif berarti uang dikembalikan, dan pembagiannya dibalik.',
  'help.guide.add-expense.tip.3':
    '“Lampirkan”, di samping “Kuitansi & Faktur” di bagian bawah dialog, menerima gambar dan PDF. File diunggah saat kamu menyimpan dan disimpan di “File” perjalanan, lalu chip “Kuitansi” muncul di samping nama di daftar.',
  // expense-payers
  'help.guide.expense-payers.title': 'Atur siapa yang membayar',
  'help.guide.expense-payers.goal':
    'Catat siapa yang membayar sebuah pengeluaran. Ini separuh lainnya dari perhitungan pelunasan.',
  'help.guide.expense-payers.step.1':
    'Buka pengeluaran lewat ikon pensil di samping barisnya, lalu lihat “Siapa yang membayar?”. “Satu orang membayar” adalah pilihan default di sakelar samping judul: setiap peserta tampil sebagai chip, dan chip bergaris tepi adalah orang yang membayar. Klik chip lain untuk menggantinya.',
  'help.guide.expense-payers.step.2':
    '“Belum ada yang membayar”, chip bergaris putus-putus setelah daftar peserta, mencatat nominal tanpa membuat siapa pun berutang. Pengeluaran ini tetap dihitung dalam “Total pengeluaran perjalanan”.',
  'help.guide.expense-payers.step.3':
    '“Beberapa orang membayar”, pilihan lain di sakelar itu, mencantumkan setiap peserta dengan kotak centang, dan setiap orang yang dicentang mendapat kolom jumlah. Centang orang-orang yang membayar dan ketik berapa yang dibayar masing-masing; jumlahnya harus sama dengan totalnya.',
  'help.guide.expense-payers.step.4':
    'Pengeluaran yang belum dibayar siapa pun ditandai “Belum selesai” di barisnya dan dihitung di kartu “Jumlah tertunda”, yang menjumlahkan pengeluaran yang belum punya pembayar.',
  'help.guide.expense-payers.result':
    'Siapa yang membayar menentukan siapa yang mendapat penggantian, pembagian menentukan siapa yang menanggung, dan “Saldo” adalah selisih keduanya.',
  'help.guide.expense-payers.tip.1':
    '“Siapa yang membayar?” dan “Pembagian” tidak saling bergantung: kamu bisa membayar makan malam yang tidak kamu hadiri, dan ikut menanggung makan malam yang tidak kamu bayar.',
  'help.guide.expense-payers.tip.2':
    'Kalau ada beberapa pembayar, jumlah masing-masing harus sama dengan total. Saat kamu mencentang satu pembayar lagi, sisanya dibagi ulang ke nominal yang belum kamu ketik sendiri. Selama jumlahnya belum cocok, editor menampilkan total yang harus dicapai dan tidak bisa menyimpan.',
  'help.guide.expense-payers.tip.3':
    'Mengembalikan pengeluaran ke “Belum ada yang membayar” tidak menghapusnya: nominalnya tetap masuk “Total pengeluaran perjalanan” dan barisnya menjadi “Belum selesai”.',
  // split-expense
  'help.guide.split-expense.title': 'Bagi tagihan antarpeserta',
  'help.guide.split-expense.goal':
    'Tentukan siapa yang menanggung pengeluaran: semua orang sama rata, berdasarkan jumlah, atau per item dari kuitansinya.',
  'help.guide.split-expense.step.1':
    'Di editor pengeluaran, “Pembagian” mencantumkan setiap peserta dengan kotak centang. Hapus centang sebuah nama untuk mengeluarkan orang itu dari pengeluaran ini: namanya menjadi abu-abu, bagiannya hilang, dan dia tidak menanggung apa pun.',
  'help.guide.split-expense.step.2':
    '“Rata”, di sakelar samping judul, adalah default-nya: setiap peserta yang dicentang mendapat bagian yang sama, yang tampil di samping namanya. Lencana di bawah daftar menunjukkan berapa orang yang berbagi dan berapa besar setiap bagiannya.',
  'help.guide.split-expense.step.3':
    '“Kustom” mengganti bagian dengan kolom nominal. Ketik berapa yang ditanggung setiap peserta. Lencana di bawahnya diperbarui saat kamu mengetik dan berubah hijau dengan tulisan “Pembagian sudah pas dengan total”. Kamu tidak bisa menyimpan selama jumlahnya belum sama dengan total.',
  'help.guide.split-expense.step.4':
    '“Struk” membagi struk baris demi baris: “Tambah item”, lalu isi nama dan harga per baris, dan di samping “Dibagi dengan:” pilih peserta yang menanggung baris itu.',
  'help.guide.split-expense.step.5':
    '“Bagian tiap orang” di bawah baris-baris itu menunjukkan berapa yang akhirnya ditanggung setiap peserta, dan “Jumlah total” di atas adalah jumlah semua baris. Klik “Simpan” di bagian bawah dialog.',
  'help.guide.split-expense.result':
    'Semua saldo dihitung dari pembagian itu. Pembagian disimpan bersama pengeluarannya, tampil di barisnya sebagai “Pembagian” dengan bagian setiap peserta, dan bisa diubah nanti tanpa mengubah hal lain.',
  'help.guide.split-expense.tip.1':
    'Peserta yang centangnya kamu hapus tidak menanggung apa pun untuk pengeluaran ini. Peserta lain membayar bagiannya.',
  'help.guide.split-expense.tip.2':
    '“Rata” membagi sampai sen terakhir: sisa satu sen dibebankan ke orang yang berbeda di setiap pengeluaran, jadi bukan orang yang sama yang selalu menanggungnya.',
  'help.guide.split-expense.tip.3':
    'Mode “Struk” menghitung “Jumlah total” sendiri dan membuat kolomnya abu-abu: totalnya adalah jumlah baris-baris di kuitansi.',
  'help.guide.split-expense.tip.4':
    'Pembagian kustom juga bisa diisi dalam persen: ubah “Masukkan bagian sebagai” ke %, dan jumlah semua bagian harus 100 % sebelum pengeluaran bisa disimpan.',
  // expense-currency
  'help.guide.expense-currency.title': 'Catat pengeluaran dalam mata uang lain',
  'help.guide.expense-currency.goal': 'Masukkan nominal sesuai struk, dan TREK menyimpan kurs tukarnya.',
  'help.guide.expense-currency.step.1':
    'Buka “Tambah pengeluaran”. Ketik nama di bagian atas dialog, lalu isi “Jumlah total” persis seperti di struk, bukan nominal hasil konversi.',
  'help.guide.expense-currency.step.2':
    'Buka “Mata uang” di samping nominal dan pilih mata uang sesuai struk. Daftarnya berisi semua kode yang dikenal TREK dan bisa dicari: ketik tiga hurufnya.',
  'help.guide.expense-currency.step.3':
    'Deretan lencana muncul di bawah kolom-kolom itu: jumlah yang kamu ketik dan nilainya saat ini, ditandai “kurs langsung”. Ini hanya pratinjau, bukan nilai yang disimpan.',
  'help.guide.expense-currency.step.4':
    'Klik “Tambah pengeluaran” di bagian bawah dialog. Kursnya dikunci saat itu: pengeluaran ini tetap bernilai seperti pada hari kamu memasukkannya.',
  'help.guide.expense-currency.step.5':
    'Di buku kas, baris itu menampilkan kedua jumlah di bawah namanya: yang kamu ketik, sebuah panah, dan jumlahnya dalam mata uang perjalanan. Semua total, saldo, dan pelunasan di tab “Biaya” memakai jumlah yang kedua.',
  'help.guide.expense-currency.result':
    'Pengeluaran menyimpan nominal dan mata uang yang kamu ketik. Buku kas menampilkan keduanya, sedangkan total dan saldo perjalanan dihitung dalam mata uang perjalanan.',
  'help.guide.expense-currency.tip.1':
    'Kurs dikunci saat kamu menyimpan, jadi utang yang sudah lunas tidak berubah walaupun kursnya berubah minggu depannya. Kurs baru hanya disimpan kalau kamu mengubah mata uang pengeluaran.',
  'help.guide.expense-currency.tip.2':
    '“Mata uang tampilan” di “Pengaturan” hanya mengubah cara nominal ditampilkan. Nominal yang tersimpan tidak pernah berubah. Kalau dikosongkan, setiap perjalanan ditampilkan dalam mata uangnya sendiri.',
  'help.guide.expense-currency.tip.3':
    'Mata uang perjalanan diatur di perjalanannya, lewat “Edit Perjalanan”, dan butuh izin “Edit detail perjalanan”. Kalau diubah, semua kurs yang sudah dikunci dihitung ulang untuk mata uang baru. Nominalnya sendiri tidak dikonversi.',
  // filter-costs
  'help.guide.filter-costs.title': 'Mencari pengeluaran, atau belanja dalam satu hari',
  'help.guide.filter-costs.goal': 'Saring daftar pengeluaran yang panjang agar hanya menampilkan yang kamu cari.',
  'help.guide.filter-costs.step.1':
    'Ketik di “Cari pengeluaran…” di bar. Pencarian mencocokkan nama pengeluaran sambil kamu mengetik, dan Esc mengosongkannya lagi.',
  'help.guide.filter-costs.step.2':
    '“Filter”, ikon corong di sebelah pencarian, membuka filter. Sakelar di bagian atas adalah tampilan buku kas versimu: “Semua”, “Dibayar olehku” untuk yang kamu bayar, dan “Dipinjami padaku” untuk pengeluaran yang kamu bayar melebihi bagianmu.',
  'help.guide.filter-costs.step.3':
    'Di bawah “Kategori”, pilih salah satu dari empat belas kategori, dan hanya pengeluaran kategori itu yang ditampilkan. Ikon corong menunjukkan berapa filter yang aktif.',
  'help.guide.filter-costs.step.4':
    'Di bawah “Hari”, pilih salah satu hari yang punya pengeluaran. Sebuah banner menggantikan judul-judul hari dan menampilkan hari itu secara lengkap, berapa pengeluarannya, dan totalnya.',
  'help.guide.filter-costs.step.5':
    '“Ekspor CSV”, ikon unduh di samping corong, menyimpan semua pengeluaran ke file, lengkap dengan nominal asli, mata uangnya, dan nominal hasil konversi.',
  'help.guide.filter-costs.result':
    'Filter bisa dikombinasikan, dan kelompok hari diperbarui dengan total masing-masing untuk pengeluaran yang tersisa.',
  'help.guide.filter-costs.tip.1':
    'Pembayaran yang dicatat tidak punya nama dan kategori, jadi pencarian atau filter kategori menyembunyikannya, begitu juga “Dipinjami padaku”. Filter hari tetap menampilkannya, di hari pembayaran itu dilakukan.',
  'help.guide.filter-costs.tip.2':
    '“Ekspor CSV” selalu mengekspor semua pengeluaran, apa pun filter di layar, satu baris per pengeluaran.',
  'help.guide.filter-costs.tip.3':
    '“Atur ulang filter”, di bagian bawah menu filter begitu ada filter yang aktif, mematikan semuanya sekaligus.',
  // settle-up
  'help.guide.settle-up.title': 'Lihat siapa berutang ke siapa dan lunasi',
  'help.guide.settle-up.goal':
    'Ringkas banyak pengeluaran bersama menjadi transfer sesedikit mungkin untuk melunasi semua utang, lalu catat transfernya saat dilakukan.',
  'help.guide.settle-up.step.1':
    'Kartu “Lunasi” di kolom kanan menampilkan transfer yang bisa melunasi semua utang: siapa membayar ke siapa, ditampilkan sebagai dua avatar dengan nama di tooltip-nya, dan berapa nominalnya. Angka di header kartu menunjukkan berapa transfer yang belum dilakukan.',
  'help.guide.settle-up.step.2':
    '“Lunasi” di samping sebuah transfer mencatatnya sebagai selesai. Transfer itu hilang dari kartu dan saldo diperbarui.',
  'help.guide.settle-up.step.3':
    'Transfer yang dicatat tampil sebagai baris di buku kas, di bawah hari terjadinya, ditandai “Pembayaran” beserta kedua peserta dan jumlahnya.',
  'help.guide.settle-up.step.4':
    'Di samping baris itu, ikon pensil untuk memperbaiki pembayaran dan “Urungkan” untuk membatalkannya, dan transfernya kembali ke kartu “Lunasi”.',
  'help.guide.settle-up.step.5':
    '“Tambah pembayaran” di header kartu mencatat transfer yang tidak mengikuti saran. Pilih “Dari” dan “Ke”, jumlah, mata uang, dan hari terjadinya, tambahkan Catatan jika perlu, misalnya cara pembayarannya, lalu klik “Tambah pembayaran” di bagian bawah dialog.',
  'help.guide.settle-up.step.6':
    '“Lunasi” di bar atas mencatat semua transfer yang belum lunas sekaligus, tanpa bertanya, misalnya saat rombongan melunasi semua utang di akhir perjalanan.',
  'help.guide.settle-up.result':
    'Setiap transfer yang dicatat menjadi satu baris di buku kas dan menghapus satu baris dari kartu “Lunasi”. Saat kartu menampilkan “Semua sudah impas”, perjalanan sudah lunas sepenuhnya.',
  'help.guide.settle-up.tip.1':
    'Kartu ini menampilkan jumlah transfer paling sedikit, bukan setiap utang: kalau tiga orang saling berutang secara melingkar, cukup diselesaikan dengan satu atau dua pembayaran.',
  'help.guide.settle-up.tip.2':
    '“Lunasi” hanya mencatat transfer, tidak mengirim uang. Bayar dengan metode pembayaran yang biasa kamu pakai, lalu klik “Lunasi”.',
  'help.guide.settle-up.tip.3':
    'Pembayaran bisa dilakukan dalam mata uang apa pun, jadi membayar utang dalam yen dengan euro itu wajar: dialognya punya pemilih mata uang sendiri dan juga mengunci kurs tersebut.',
  // final-budget
  'help.guide.final-budget.title': 'Melihat biaya perjalanan untuk setiap peserta',
  'help.guide.final-budget.goal': 'Lihat angka untuk setiap orang: saldo hari ini, dan biaya sebenarnya per orang.',
  'help.guide.final-budget.step.1':
    '“Saldo” menunjukkan posisi setiap peserta: bar hijau ke kanan jika perjalanan berutang kepadanya, bar merah ke kiri jika dia yang berutang, dan jumlahnya di samping nama.',
  'help.guide.final-budget.step.2':
    '“Anggaran akhir” di bawahnya menjawab pertanyaan lain: bukan siapa berutang berapa saat ini, melainkan berapa biaya perjalanan untuk setiap peserta setelah semua utang dibayar.',
  'help.guide.final-budget.step.3':
    'Klik sebuah nama untuk melihat perhitungannya: “Pengeluaran yang dibayar”, lalu “Penggantian bersih” dan “Penggantian tertunda” di bawahnya.',
  'help.guide.final-budget.step.4':
    'Di bawah ketiga baris itu, ada daftar di bawah nama setiap peserta berisi rincian baris tersebut: pengeluaran yang dibayar peserta itu, transfer yang sudah dicatat, dan transfer yang belum dilakukan. Setiap daftar jumlahnya persis sama dengan baris yang bernama sama.',
  'help.guide.final-budget.result':
    '“Saldo” menunjukkan siapa yang masih harus menerima uang dan siapa yang masih berutang hari ini. “Anggaran akhir” menunjukkan biaya perjalanan untuk masing-masing setelah semuanya dibayar kembali.',
  'help.guide.final-budget.tip.1':
    'Mencatat pembayaran tidak mengubah anggaran akhir siapa pun. Pencatatan itu hanya memindahkan sejumlah uang dari penggantian yang tertunda ke penggantian bersih.',
  'help.guide.final-budget.tip.2':
    'Pengeluaran tanpa pembayar tidak masuk ke kedua kartu itu, sama seperti tidak masuk ke saran pelunasan.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Menjadikan pemesanan sebagai pengeluaran',
  'help.guide.expense-from-booking.goal':
    'Catat biaya sebenarnya dari penerbangan, hotel, atau tempat langsung di data yang bersangkutan.',
  'help.guide.expense-from-booking.step.1':
    'Cari pemesanannya di tab “Transportasi” atau “Pemesanan”, lalu klik ikon pensil di bagian atas kartunya.',
  'help.guide.expense-from-booking.step.2':
    'Gulir ke “Biaya” di dekat akhir formulir. Di sana ada “Buat pengeluaran”, yang menyimpan pemesanan lebih dulu, dan “Tautkan pengeluaran yang ada” untuk pengeluaran yang sudah ada di “Biaya”.',
  'help.guide.expense-from-booking.step.3':
    'Klik “Buat pengeluaran”. Pemesanan tersimpan, formulir tertutup, dan editor “Biaya” terbuka dengan judul pemesanan sebagai nama, jenisnya dicocokkan ke kategori, dan hari pemesanan sebagai hari pengeluaran.',
  'help.guide.expense-from-booking.step.4':
    'Isi nominal dan mata uangnya, siapa yang membayar, dan pembagiannya seperti pengeluaran lainnya, lalu klik “Tambah pengeluaran”. Saat pemesanan dibuka lagi, pengeluaran tampil di bawah “Pengeluaran tertaut”, dengan ikon pensil untuk mengeditnya, “Lepas tautan, simpan pengeluaran” untuk menghapus tautan tetapi mempertahankan pengeluarannya, dan ikon tempat sampah untuk menghapusnya.',
  'help.guide.expense-from-booking.result':
    'Pemesanan menampilkan biayanya, dan pengeluarannya menjadi baris biasa di tab “Biaya”, dengan pembayar, pembagian, dan mata uang seperti pengeluaran lainnya.',
  'help.guide.expense-from-booking.tip.1':
    'Menghapus pemesanan juga menghapus pengeluaran yang tertaut, dan pertanyaan konfirmasinya memberi tahu hal ini. “Hapus pengeluaran” di bagian “Biaya” pemesanan melakukan sebaliknya: pengeluarannya dihapus dan pemesanannya tetap ada. “Lepas tautan, simpan pengeluaran” menyimpan keduanya.',
  'help.guide.expense-from-booking.tip.2':
    'Formulir tempat juga punya bagian yang sama, dengan “Buat pengeluaran” yang menyimpan tempatnya dulu.',
  // costs-table
  'help.guide.costs-table.title': 'Merencanakan biaya dalam tabel',
  'help.guide.costs-table.goal':
    'Baca dan ubah pengeluaran dalam bentuk tabel, dikelompokkan per kategori dan dihitung per orang dan per hari.',
  'help.guide.costs-table.step.1':
    'Klik “Tabel”, ikon kedua pada pengalih “Daftar” / “Tabel” di bilah. Tabel berisi pengeluaran yang sama menggantikan buku kas, dan pencarian serta filter juga berlaku di sana.',
  'help.guide.costs-table.step.2':
    'Tabel dikelompokkan per kategori. Header setiap kelompok menampilkan nama, jumlah pengeluaran, dan subtotalnya; klik header untuk melipat kelompok itu. Kolomnya adalah “Nama”, “Tanggal”, Total, “Orang”, dan “Hari”, lalu “Per Orang”, “Per Hari”, dan “P. o / Hari”, yang dihitung dari kolom-kolom itu dengan latar abu-abu. Baris Total di bagian bawah menjumlahkan semuanya.',
  'help.guide.costs-table.step.3':
    'Klik sebuah sel untuk langsung mengubahnya: nama, total, “Orang”, atau “Hari”. Ketik, lalu tekan Enter atau klik di tempat lain untuk menyimpan, atau tekan Esc untuk membatalkan. Tanggal membuka kalender. “Per Orang” dan kolom hasil hitungan lainnya langsung diperbarui.',
  'help.guide.costs-table.step.4':
    'Total yang bergembok tidak bisa diubah di sini: seseorang sudah membayarnya, atau nominalnya dimasukkan dalam mata uang lain, dan tooltip-nya menjelaskan yang mana. Mengkliknya akan membuka pengeluarannya, supaya saldo dan kurs yang sudah dikunci tetap benar.',
  'help.guide.costs-table.step.5':
    '“Tambah pengeluaran” di akhir sebuah kategori menambahkan baris bernama “Entri Baru” ke kategori itu, dengan tanggal entri terbaru di sana. Kolom namanya sudah terbuka supaya bisa langsung kamu ubah. Isi totalnya dengan cara yang sama.',
  'help.guide.costs-table.step.6':
    'Dalam tampilan ini, kolom kanan menampilkan “Ringkasan” sebagai ganti “Per kategori”. Pengeluaran dijumlahkan dengan empat cara: “Kategori”, “Hari”, “Pembayar”, dengan “Belum ada pembayar” untuk yang belum dibayar, dan Status, “Sudah dibayar” dibandingkan “Belum dibayar”.',
  'help.guide.costs-table.result':
    'Setiap pengeluaran tampil di kategorinya dengan jumlah per orang dan per hari. Saat kamu mengubah total di sebuah sel, kartu-kartu di atas dan “Ringkasan” langsung diperbarui.',
  'help.guide.costs-table.tip.1':
    '“Biaya” mengingat tampilannya di browser ini: tab ini terbuka dalam tampilan tabel sampai kamu mengklik “Daftar” lagi.',
  'help.guide.costs-table.tip.2':
    'Pengeluaran dengan pembagian “Kustom” atau “Struk” tidak punya satu bagian tetap per orang, jadi kolom “Per Orang” dan “P. o / Hari” untuk pengeluaran itu tetap kosong.',
  'help.guide.costs-table.tip.3':
    'Pembayar, pembagian, catatan, dan struk diedit di pengeluarannya langsung: “Opsi lainnya” di ujung baris berisi “Edit”, dan “Hapus” untuk menghapus baris.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transportasi',
  'help.ctx.trip-transports.summary':
    'Semua cara kamu bepergian di antara perhentian: penerbangan, kereta, bus, mobil, taksi, sepeda, kapal pesiar, feri, kereta gantung, dan koneksi transportasi umum yang dicarikan TREK untukmu. Tab ini mencantumkan semuanya. Kamu juga bisa membuat dan melihatnya di rencana, dan semuanya digambar di peta.',
  'help.ctx.trip-transports.bullet.1':
    'Tab ini hanya menampilkan perjalanan. Akomodasi, restoran, acara, dan tiket ada di tab “Pemesanan”, jadi entri yang sama tidak pernah muncul dua kali.',
  'help.ctx.trip-transports.bullet.2':
    'Bar di bagian atas berisi “Cari”, Filter untuk status, jenis, dan peserta, tiga tampilan “Kartu”, “Daftar”, dan “Linimasa”, “Opsi tampilan”, serta “Ekspor sebagai spreadsheet (CSV)”, yang mengunduh isi yang ditampilkan. “Transportasi” di kanan untuk menambahkan perjalanan secara manual. Ikon-ikon sebelumnya, “Impor konfirmasi pemesanan” dan “Impor dari AirTrail”, muncul jika server bisa membaca konfirmasi atau AirTrail terhubung. Pada tab yang masih kosong, tindakan yang sama tampil di tengah sebagai “Transportasi”, “Impor dari file”, dan AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    '“Kartu” adalah tampilan awal tab ini: “Dikonfirmasi” dulu, lalu “Menunggu”. Setiap bagian bisa dilipat dengan mengklik judulnya. Koneksi transportasi umum yang direncanakan tidak punya status dan tampil di antara perjalanan yang dikonfirmasi sesuai urutan waktu, kecuali “Opsi tampilan” memberinya bagian sendiri, “Transportasi umum otomatis”. “Daftar” mengelompokkan per hari, dan “Linimasa” menampilkan semua perjalanan di sepanjang hari-hari perjalanan.',
  'help.ctx.trip-transports.bullet.4':
    'Bagian atas kartu diwarnai sesuai statusnya: hijau untuk dikonfirmasi, kuning untuk menunggu, biru untuk koneksi yang direncanakan. Di sana ada titik status, jenis, judul, ikon pensil, dan ikon tempat sampah. Di bawahnya: “Tanggal”, “Waktu”, “Kode Pemesanan”, “Rute”, serta maskapai dan nomor penerbangan atau nomor kereta, peron, dan kursi. Klik kartu untuk membuka detailnya.',
  'help.ctx.trip-transports.bullet.5':
    'Kamu juga bisa membuat transportasi di rencana: tanda + di header hari (tooltip-nya “Tambah ke hari ini”), atau klik kanan pada header, menawarkan “Tambah transportasi” dan “Transportasi umum”. Penghubung waktu tempuh di antara dua perhentian membuka pencarian yang sama untuk ruas itu.',
  'help.ctx.trip-transports.bullet.6':
    'Transportasi yang kedua ujungnya sudah diisi menggambar garis di peta. Ikon rute di barisnya pada rencana hari dan “Di peta” di detailnya menyalakan garis itu. “Tampilkan semua rute pemesanan” di toolbar di atas hari-hari menyalakan atau mematikan semua garis perjalanan.',
  // transports-list
  'help.guide.transports-list.title': 'Pahami tab Transportasi',
  'help.guide.transports-list.goal': 'Pahami isi daftar ini sebelum kamu mengubah apa pun di dalamnya.',
  'help.guide.transports-list.step.1':
    '“Transportasi” adalah tab perjalanan, setelah “Rencana” (dan “Tur”, jika addon itu aktif). Isinya hanya perjalanan: hotel, restoran, acara, dan tiket ada di tab “Pemesanan”.',
  'help.guide.transports-list.step.2':
    '“Cari” di kiri bar menyaring perjalanan sambil kamu mengetik. Filter, ikon corong di sebelahnya, membuka pilihan: Status dengan “Semua”, “Dikonfirmasi”, dan “Menunggu”, lalu setiap jenis yang dipakai beserta jumlahnya. Centang satu atau beberapa jenis untuk menampilkan jenis itu saja. Angka pada corong menunjukkan berapa filter yang aktif, dan bar menunjukkan berapa perjalanan yang ditampilkan, misalnya 1 dari 4. “Atur ulang filter” di bagian bawah menu menampilkan semua perjalanan lagi.',
  'help.guide.transports-list.step.3':
    '“Kartu”, “Daftar”, dan “Linimasa” di sebelahnya menampilkan transportasi sebagai kartu, sebagai baris yang dikelompokkan per hari, atau sebagai batang di sepanjang hari perjalanan. “Opsi tampilan”, ikon slider, mengatur “Kelompokkan menurut” dan “Urutkan” untuk “Kartu” dan “Daftar”, serta lajur untuk “Linimasa”. “Atur ulang tampilan” mengembalikan pengaturan default. Di “Kartu”, “Transportasi umum di bagian tersendiri” menampilkan koneksi yang direncanakan di bawah “Transportasi umum otomatis”.',
  'help.guide.transports-list.step.4':
    'Setiap kartu menampilkan semua detail. Pita di bagian atas berwarna hijau untuk “Dikonfirmasi” dan kuning untuk “Menunggu”, berisi titik status, jenis, dan judul. Di bawahnya, “Tanggal” menunjukkan hari-hari yang dicakup beserta tanggalnya. Lalu ada “Waktu”, “Kode Pemesanan”, “Rute” dengan ikon jenisnya di antara perhentian, serta maskapai dan nomor penerbangan, atau nomor kereta, peron, dan kursi. Klik kartu untuk membuka detailnya.',
  'help.guide.transports-list.step.5':
    'Klik titik status untuk mengubah status perjalanan antara “Menunggu” dan “Dikonfirmasi”; tooltip-nya menunjukkan perubahannya, misalnya “Setel ke Menunggu”. Ikon pensil di header membuka formulir transportasi, dan ikon tempat sampah menghapusnya setelah pertanyaan “Hapus pemesanan?”, yang mencantumkan apa saja yang ikut terhapus, termasuk biaya yang tertaut.',
  'help.guide.transports-list.result':
    'Setiap kartu menunjukkan apakah perjalanan sudah dipesan, dan kamu bisa memakai bar untuk menyaring atau mengurutkan daftar kapan saja.',
  'help.guide.transports-list.tip.1':
    'Tab ini mengingat pengaturanmu: tampilan, pengelompokan, dan urutan di browser ini, bagian yang dilipat di setiap perjalanan, dan filter sampai kamu menutup tab browser.',
  'help.guide.transports-list.tip.2':
    '“Impor konfirmasi pemesanan” dan “Impor dari AirTrail”, dua ikon sebelum “Transportasi”, hanya muncul jika server bisa membaca konfirmasi dan jika ada instans AirTrail yang terhubung. Tanpa keduanya, kamu mengisi daftar secara manual atau lewat pencarian transportasi umum.',
  // add-transport
  'help.guide.add-transport.title': 'Tambah transportasi ke hari',
  'help.guide.add-transport.goal':
    'Tambahkan transportasi dari satu perhentian ke perhentian berikutnya ke hari perjalanan itu berlangsung.',
  'help.guide.add-transport.step.1':
    'Di header hari perjalanan itu, klik tanda + dengan tooltip “Tambah ke hari ini”, lalu pilih “Tambah transportasi”. Klik kanan pada header hari menawarkan menu yang sama. Formulirnya terbuka dengan hari itu sudah terisi.',
  'help.guide.add-transport.step.2':
    'Pil jenis di header menunjukkan jenis transportasinya, awalnya “Penerbangan”. Klik untuk memilih “Penerbangan”, “Kereta”, Bus, “Mobil”, “Taksi”, “Sepeda”, “Kapal Pesiar”, “Feri”, “Kereta gantung”, atau “Lainnya”, dan formulirnya menyesuaikan: penerbangan mendapat bandara di setiap perhentian, kereta rangkaian stasiun, kapal pesiar “Naik kapal”, “Pelabuhan singgah”, dan “Turun kapal”, mobil “Penjemputan” dan “Pengembalian” serta “Perhentian di sepanjang jalan”.',
  'help.guide.add-transport.step.3':
    'Ketik judul langsung di pita atas, di tempat teks contoh berwarna abu-abu. Hanya kolom ini yang wajib diisi: selama belum diisi, baris di bawahnya bertuliskan “Judul *” dan “Tambah” tetap abu-abu. Pakai judul yang mudah kamu kenali di papan keberangkatan.',
  'help.guide.add-transport.step.4':
    'Di bawah “Rute”, “Dari” dan “Ke” bisa diisi stasiun, pelabuhan, atau alamat. Tempat-tempat dalam perjalanan sudah ditawarkan sebelum kamu mengetik. Ketik minimal tiga huruf untuk mencari, lalu pilih salah satu hasil. Nama yang hanya diketik tanpa dipilih dari hasil tidak akan disimpan, dan tidak ada yang tampil di peta.',
  'help.guide.add-transport.step.5':
    '“Tanggal” dan “Waktu mulai” untuk kapan perjalanan dimulai, “Tanggal selesai” dan “Waktu selesai” untuk kapan berakhir; untuk perjalanan yang tiba keesokan harinya, isi tanggal hari berikutnya di sana. “Kode Pemesanan” dan “Catatan” di bawahnya opsional. Klik pil “Menunggu” di header untuk mengubahnya menjadi “Dikonfirmasi”.',
  'help.guide.add-transport.step.6': 'Klik “Tambah”.',
  'help.guide.add-transport.result':
    'Transportasi itu tampil sebagai baris di harinya, pada jamnya di antara perhentian, dan sebagai kartu di tab “Transportasi” di bawah “Menunggu” atau “Dikonfirmasi”.',
  'help.guide.add-transport.tip.1':
    'Baris ini ditempatkan sesuai waktu mulainya, setelah perhentian terakhir yang dimulai lebih awal. Seret lewat gagangnya ke posisi lain di hari itu, atau ke hari lain.',
  'help.guide.add-transport.tip.2':
    'Pakai “Lampirkan file” di bawah “File” untuk menambahkan tiket. “Buat pengeluaran” di bawah “Biaya” menyimpan pemesanan dan membuka editor “Biaya” untuk ongkosnya.',
  'help.guide.add-transport.tip.3':
    '“Peserta”, blok pertama di formulir, menentukan siapa yang naik transportasi ini. Begitu perjalanan punya lebih dari satu anggota dan ada transportasi yang mencantumkan orang, “Filter” di tab juga menampilkan “Peserta”, untuk melihat transportasi milik satu orang saja.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Impor penerbangan dari e-tiket',
  'help.guide.import-transport-file.goal':
    'Biarkan TREK membaca penerbangan, kereta, atau feri dari tiket yang dikirim operatornya, lalu periksa sebelum disimpan.',
  'help.guide.import-transport-file.step.1':
    'Di bar tab “Transportasi”, klik ikon unduh sebelum “Transportasi”, yang tooltip-nya bertuliskan “Impor konfirmasi pemesanan”. Dialog dengan nama itu terbuka, sama seperti di tab “Pemesanan”. Pada tab yang masih kosong, “Impor dari file” di tengah melakukan hal yang sama.',
  'help.guide.import-transport-file.step.2':
    'Jatuhkan tiket ke kotak, atau klik kotak lalu pilih filenya: EML, PDF, PKPass, HTML, dan TXT, maksimal lima file masing-masing 10 MB, serta foto tiket (JPG, PNG, WEBP) jika servermu punya model AI untuk membacanya. Kotak menampilkan nama file yang kamu pilih.',
  'help.guide.import-transport-file.step.3':
    'Klik “Impor”. Dialog langsung tertutup, dan file dibaca di latar belakang.',
  'help.guide.import-transport-file.step.4':
    'Kartu di kanan bawah menampilkan kemajuannya di bawah nama file. “Memproses file…” berubah menjadi tanda centang setelah selesai dibaca, dan kartu menawarkan “Impor”. Klik tombol itu.',
  'help.guide.import-transport-file.step.5':
    'Penerbangan terbuka di “Tambah transportasi” dan sudah terisi: label jenis di “Penerbangan”, maskapai dan nomor penerbangan sebagai judul di header, kedua bandara di bawah “Rute” dengan “Keberangkatan” dan “Kedatangan”, waktu dan zona waktunya, “Maskapai” dan “No. Penerbangan”, “Kode Pemesanan”, serta tiketnya di bawah “File”. Periksa, lalu klik “Tambah”.',
  'help.guide.import-transport-file.result':
    'Penerbangan tampil sebagai kartu di bawah “Menunggu” pada tab “Transportasi” dan sebagai baris di hari keberangkatannya, dengan tiket di bawah “File”. Kalau kedua bandaranya diketahui, penerbangan digambar sebagai garis lengkung di peta.',
  'help.guide.import-transport-file.tip.1':
    'Kedua tab memakai impor yang sama. File yang berisi penerbangan dan hotel akan membuka penerbangan di “Tambah transportasi”, lalu hotelnya di “Reservasi Baru”, dari tab mana pun kamu memulai.',
  'help.guide.import-transport-file.tip.2':
    'Bandara ditempatkan berdasarkan kodenya. Kalau lokasi stasiun atau pelabuhan tidak ditemukan, namanya ditampilkan berwarna kuning di kartu impor di kanan bawah. Pilih secara manual di bawah “Rute” sebelum mengklik “Tambah”, kalau tidak, transportasinya tidak tampil di peta.',
  // plan-transit
  'help.guide.plan-transit.title': 'Merencanakan koneksi transportasi umum',
  'help.guide.plan-transit.goal':
    'Biarkan TREK mencarikan kereta dan bus sungguhan di antara dua titik dalam satu hari, lalu masukkan pilihanmu ke rencana.',
  'help.guide.plan-transit.step.1':
    'Klik tanda + di header hari, lalu pilih “Transportasi umum”. Pencarian terbuka untuk hari itu: harinya tampil sebagai pil di header, dan “Manual” serta “Otomatis” di sampingnya beralih antara pencarian ini dan formulir biasa.',
  'help.guide.plan-transit.step.2':
    '“Dari” dan “Ke” bisa diisi perhentian atau stasiun. Selama kotaknya masih kosong, TREK menyarankan akomodasi hari itu, stasiun dan bandara dari pemesanan hari itu, serta perhentian hari itu sendiri. Begitu kamu mengetik dua huruf, TREK mencari stasiun dari jadwal sebagai gantinya. “Tukar” di antara kedua kotak menukar “Dari” dan “Ke”.',
  'help.guide.plan-transit.step.3':
    '“Berangkat” atau “Tiba” beserta waktunya menentukan kapan kamu ingin bepergian, sedangkan “Rute terbaik”, “Lebih sedikit transit”, atau “Lebih sedikit jalan kaki” menentukan urutan hasilnya.',
  'help.guide.plan-transit.step.4':
    'Chip di bawahnya menunjukkan moda yang boleh dipakai: “Kereta”, “MRT”, “Trem”, “Bus”, “Feri”, dan “Kereta gantung”. Matikan salah satunya untuk mengecualikannya, tetapi minimal satu tetap aktif. Lalu klik “Cari”.',
  'help.guide.plan-transit.step.5':
    'Setiap hasil menampilkan waktu berangkat dan tiba, lama perjalanan, jumlah transit, jarak jalan kaki, dan jalur sebagai lencana, dengan warnanya masing-masing kalau tersedia di jadwal. Klik salah satu untuk membukanya dan melihat setiap ruas, termasuk halte atau stasiun tempat naik dan pindah, peron, serta jalan kaki di antara jalur.',
  'help.guide.plan-transit.step.6': 'Klik “Tambah ke hari ini”.',
  'help.guide.plan-transit.result':
    'Koneksi itu tampil sebagai baris di harinya dengan lencana jalurnya. Klik tanda panahnya untuk melihat setiap ruas. Koneksi itu juga tampil sebagai kartu biru di tab “Transportasi”, di antara perjalanan yang dikonfirmasi.',
  'help.guide.plan-transit.tip.1':
    'Koneksinya berasal dari Transitous, layanan komunitas gratis yang memakai data jadwal publik: tanpa kunci, tanpa akun. Admin bisa mengatur pencarian agar memakai Google sebagai gantinya.',
  'help.guide.plan-transit.tip.2':
    'Tidak ada hasil? Data jadwal hanya mencakup wilayah dan periode tertentu. Coba jam lain, aktifkan lebih banyak moda, atau pilih stasiun, bukan tempatnya langsung. Pesannya menyebutkan layanan yang memberi jawaban. Perjalanan tanpa tanggal tidak punya hari untuk dicari, jadi hanya formulir biasa yang tersedia.',
  'help.guide.plan-transit.tip.3':
    'Pencarian yang sama terbuka untuk satu ruas: klik penghubung waktu tempuh di antara dua perhentian dan pilih “Transportasi umum”. “Dari”, “Ke”, dan jam berangkat sudah terisi untukmu.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Buka dan ubah koneksi yang direncanakan',
  'help.guide.change-transit-route.goal':
    'Lihat detail koneksi baris demi baris, ganti namanya, atau cari ulang rutenya.',
  'help.guide.change-transit-route.step.1':
    'Di tab “Transportasi”, koneksi yang direncanakan tampil sebagai kartu dengan pita biru di atasnya, berurutan sesuai waktu bersama transportasi yang sudah dikonfirmasi. Kalau “Transportasi umum di bagian tersendiri” diaktifkan di “Opsi tampilan”, koneksi ini tampil di bawah “Transportasi umum otomatis”. Klik kartunya, dan koneksi terbuka sebagai pemesanan.',
  'help.guide.change-transit-route.step.2':
    'Kotak di bagian atas menampilkan keberangkatan dan kedatangan beserta haltenya, “Durasi”, “Transit”, dan “Jalan kaki”. Di bawahnya, “Itinerari” menampilkan koneksi baris demi baris, lengkap dengan waktu, peron, dan jalan kaki di antara jalur.',
  'help.guide.change-transit-route.step.3':
    '“Ubah rute” di bagian bawah pemesanan membuka pencarian lagi, sudah terisi dengan kedua ujung koneksi ini dan harinya.',
  'help.guide.change-transit-route.step.4':
    'Klik “Cari”, buka koneksi lain, lalu klik Tambahkan ke hari; koneksi itu menggantikan yang lama. “Edit”, di ujung kanan bagian bawah pemesanan, justru membuka formulir transportasi biasa, tempat kamu bisa mengedit “Kode Pemesanan”, peserta, catatan, dan file.',
  'help.guide.change-transit-route.result':
    'Perjalanan itu sekarang memakai jadwal baru, dan kartunya di tab “Transportasi” menampilkan jalur dan jam yang baru.',
  'help.guide.change-transit-route.tip.1':
    'Klik judul di header pemesanan untuk mengganti nama koneksi tanpa mengubah rutenya. Catatannya kamu tulis di formulir transportasi yang terbuka lewat “Edit”.',
  'help.guide.change-transit-route.tip.2':
    'Ikon tempat sampah di bagian bawah pemesanan menghapus koneksi setelah konfirmasi. Perhentian di hari itu tetap ada.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Ubah cara menempuh satu ruas',
  'help.guide.leg-travel-mode.goal':
    'Ubah satu ruas di hari berkendara menjadi jalan kaki, atau rencanakan ruas itu dengan pencarian transportasi umum.',
  'help.guide.leg-travel-mode.step.1':
    'Penghubung di antara perhentian baru muncul setelah rute hari itu diaktifkan. Klik header hari untuk membukanya, lalu klik “Rute” di bar di bawah perhentiannya.',
  'help.guide.leg-travel-mode.step.2':
    'Setiap penghubung menunjukkan waktu tempuh dan jarak ruas itu, dengan ikon moda yang dipakai untuk merutekannya: mobil untuk berkendara, telapak kaki untuk berjalan kaki, sepeda untuk bersepeda.',
  'help.guide.leg-travel-mode.step.3':
    'Klik penghubungnya. Menu menawarkan “Mobil”, “Jalan kaki”, dan “Bersepeda”, “Transportasi umum” khusus untuk ruas ini, serta “Gunakan bawaan hari”.',
  'help.guide.leg-travel-mode.step.4':
    'Pilih “Jalan kaki”. Hanya ruas ini yang berubah; bagian lain hari itu tetap memakai modanya sendiri.',
  'help.guide.leg-travel-mode.result':
    'Ruas itu menampilkan ikon telapak kaki dan waktu jalan kakinya, dan ruas-ruas lain di hari itu tetap memakai moda hari itu.',
  'help.guide.leg-travel-mode.tip.1':
    'Moda berlaku untuk ruas, bukan untuk hari: tombol “Mobil”, “Jalan kaki”, dan “Bersepeda” untuk seluruh hari tidak pernah menimpa ruas yang kamu atur sendiri. “Gunakan bawaan hari” membuat ruas itu mengikuti tombol-tombol tersebut lagi.',
  'help.guide.leg-travel-mode.tip.2':
    '“Transportasi umum” di menu yang sama membuka pencarian koneksi khusus untuk ruas ini, dengan titik awal, titik akhir, dan waktu keberangkatan yang sudah terisi.',
  'help.guide.leg-travel-mode.tip.3':
    'Waktunya dihitung oleh router publik berdasarkan jalan raya dan jalur pejalan kaki yang nyata. Kalau router tidak bisa menghitung sebuah ruas, ruas itu tetap berupa garis lurus tanpa keterangan waktu.',
  // edit-transport
  'help.guide.edit-transport.title': 'Ubah atau hapus transportasi',
  'help.guide.edit-transport.goal':
    'Perbaiki waktu, peron, atau kode pemesanan, atau hapus transportasi dari perjalanan.',
  'help.guide.edit-transport.step.1':
    'Di rencana hari, transportasi tampil sebagai baris di antara perhentian, diwarnai sesuai jenisnya. Klik untuk membuka pemesanannya: status, jenis, hari, dan “Kode Pemesanan” (dengan tombol untuk menyalinnya) sebagai pil di bagian atas, serta jam keberangkatan dan kedatangan beserta bandara atau stasiunnya di bawah.',
  'help.guide.edit-transport.step.2':
    '“Edit” di bagian bawah pemesanan membuka formulir yang dipakai untuk membuatnya, dengan “Edit transportasi” di atas judul di header-nya. Kamu bisa mengubah semuanya di sana: judul, pil status dan jenis, rute, hari dan jam, serta “Kode Pemesanan”.',
  'help.guide.edit-transport.step.3':
    'Rute penerbangan adalah rangkaian bandara, rute kereta rangkaian stasiun, dan rute kapal pesiar rangkaian pelabuhan. “Tambah persinggahan” (“Tambah pelabuhan” untuk kapal pesiar) menyisipkan satu lagi di antaranya, dan setiap ruas punya jam serta nomor penerbangan atau keretanya sendiri.',
  'help.guide.edit-transport.step.4':
    'Klik “Perbarui”. Untuk menghapus transportasi sepenuhnya, pakai ikon tempat sampah di kiri bar yang sama, di bagian bawah pemesanannya, atau di kartunya di tab “Transportasi”, lalu konfirmasi.',
  'help.guide.edit-transport.result':
    'Perubahannya tampil di semua tempat transportasi itu muncul: tab “Transportasi”, hari perjalanannya, dan garisnya di peta.',
  'help.guide.edit-transport.tip.1':
    'Formulir yang sama bisa dibuka dari dua tempat: lewat “Edit” di pemesanan yang terbuka dari baris rencana hari, dan lewat ikon pensil di kartu pada tab “Transportasi”. Koneksi transportasi umum yang direncanakan juga terbuka sebagai pemesanan. Di sana, “Ubah rute” membuka pencarian lagi, dan “Edit” membuka formulir ini.',
  'help.guide.edit-transport.tip.2':
    'Untuk memindahkan transportasi ke hari lain, kamu tidak perlu formulir: seret barisnya dari satu kartu hari ke kartu hari lain.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Tampilkan transportasi di peta',
  'help.guide.transport-on-map.goal': 'Lihat rute sebenarnya dari penerbangan, perjalanan mobil, atau koneksi.',
  'help.guide.transport-on-map.step.1':
    'Transportasi yang kedua ujungnya sudah diisi menampilkan ikon rute kecil di barisnya pada rencana hari. Klik ikon itu; tooltip-nya berubah menjadi “Sembunyikan rute pemesanan”.',
  'help.guide.transport-on-map.step.2':
    'Rutenya digambar di peta, dengan penanda berbentuk pil di setiap ujung yang menampilkan ikon transportasinya.',
  'help.guide.transport-on-map.step.3':
    'Klik penanda ujung, dan pemesanannya terbuka di atas peta. Header-nya menampilkan status, jenis, hari, dan “Kode Pemesanan”. Di bawahnya ada jam beserta bandara atau stasiunnya, maskapai, dan nomor penerbangan. Klik “Tutup” di header-nya untuk menutupnya.',
  'help.guide.transport-on-map.step.4':
    'Ikon rute di bilah alat di atas daftar hari berlaku untuk seluruh perjalanan sekaligus: “Tampilkan semua rute pemesanan”, dan “Sembunyikan semua rute pemesanan” untuk menyembunyikannya lagi.',
  'help.guide.transport-on-map.step.5':
    'Koneksi transportasi umum yang direncanakan tidak punya ikon rute sendiri. Koneksi ini digambar lewat sakelar “Rute” di hari itu, jadi “Sembunyikan semua rute pemesanan” tidak menyembunyikannya selama rute hari itu masih aktif.',
  'help.guide.transport-on-map.result':
    'Rute tampil di peta dengan penanda di setiap ujungnya, dan tetap tampil sampai kamu mematikannya.',
  'help.guide.transport-on-map.tip.1':
    'Penerbangan, kapal pesiar, dan feri digambar sebagai garis lengkung. Mobil, bus, taksi, dan sepeda mengikuti jalan sebenarnya. Kereta atau koneksi yang direncanakan melewati stasiun tempatnya berhenti.',
  'help.guide.transport-on-map.tip.2':
    'Pemesanan yang dikonfirmasi tampil sebagai garis utuh, yang menunggu sebagai garis putus-putus. Pengaturan “Label rute pemesanan” menampilkan kode bandara atau nama stasiun di penanda ujungnya.',
  'help.guide.transport-on-map.tip.3':
    '“Tampilkan semua rute pemesanan” tidak menambah rute yang sudah kamu tampilkan: tombol ini menggantikan pengaturan dari ikon-ikon tunggal. Setelah kamu menekannya, semua rute tampil atau semuanya tersembunyi.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Mengimpor penerbangan dari AirTrail',
  'help.guide.airtrail-import.goal':
    'Impor sekaligus penerbangan yang sudah ada di AirTrail ke perjalanan, dan biarkan tetap diperbarui dari AirTrail setelahnya.',
  'help.guide.airtrail-import.step.1':
    'Kalau addon AirTrail aktif dan instansmu sudah terhubung di “Integrasi” pada “Pengaturan”, bilah tab “Transportasi” menampilkan ikon pesawat, “Impor dari AirTrail”, sebelum “Transportasi”. Klik ikon itu.',
  'help.guide.airtrail-import.step.2':
    '“Impor dari AirTrail” menampilkan penerbangan dari akunmu dalam dua kelompok. “Selama perjalanan ini” berisi penerbangan yang tanggalnya ada dalam perjalanan, dan sudah dicentang. “Penerbangan lain” berisi sisanya, tanpa centang. Penerbangan yang sudah ada di perjalanan tampil keabuan dan ditandai “Diimpor”.',
  'help.guide.airtrail-import.step.3':
    'Setiap baris berupa kotak centang dengan maskapai dan nomor penerbangan, kedua bandara, dan tanggalnya. Klik baris untuk menyertakan atau mengecualikan penerbangan itu. Penerbangan di bawah “Penerbangan lain” hanya diimpor kalau kamu mencentangnya.',
  'help.guide.airtrail-import.step.4':
    'Penerbangan lanjutan dikelompokkan bersama: masing-masing berangkat dari bandara tempat penerbangan sebelumnya mendarat, dalam satu hari. Kotak centang di bawahnya, Impor sebagai satu penerbangan dengan transit di bandara itu, sudah aktif. Biarkan aktif untuk satu pemesanan dengan transit, atau matikan untuk mengimpor setiap ruas sebagai penerbangan terpisah.',
  'help.guide.airtrail-import.step.5':
    'Klik tombol di kanan bawah, yang menampilkan jumlah penerbangan yang dicentang, seperti Impor 2. Pesan sesudahnya menyebutkan berapa penerbangan yang diimpor.',
  'help.guide.airtrail-import.step.6':
    'Penerbangan tampil sebagai kartu di bawah “Dikonfirmasi”, masing-masing dengan pil biru AirTrail di samping judulnya, dan sebagai baris di hari penerbangannya. Penerbangan lanjutan tampil sebagai satu kartu, dengan rute yang melewati bandara transitnya.',
  'help.guide.airtrail-import.result':
    'Penerbangan dari AirTrail tampil sebagai kartu di tab “Transportasi” dan sebagai baris di harinya masing-masing, dengan label AirTrail yang menunjukkan asalnya.',
  'help.guide.airtrail-import.tip.1':
    'Penerbangan dengan nomor dan tanggal yang sama yang sudah ada di perjalanan akan dilewati, dan muncul pesan berapa yang dilewati. Panah urungkan di bilah alat di atas daftar hari membatalkan seluruh impor.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail tetap menjadi sumber utama data. TREK membaca perubahannya saat kamu membuka perjalanan dan setiap beberapa menit di latar belakang. Penerbangan yang dihapus di AirTrail tetap punya kartu di TREK, dan labelnya berubah menjadi “Tidak tersinkron”. Perubahan yang dibuat di TREK hanya dikirim balik ke AirTrail kalau “Tulis perubahan kembali ke AirTrail” diaktifkan di “Integrasi”.',
  'help.guide.airtrail-import.tip.3':
    'Koneksi gabungan bukan satu penerbangan AirTrail yang bisa disinkronkan, jadi impornya hanya sekali: label birunya tetap ada, dan saat kursor diarahkan ke label itu, muncul keterangan tentang hal ini. Hal yang sama terjadi pada penerbangan tersinkron kalau kamu menambahkan persinggahan secara manual.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Perjalanan darat',
  'help.ctx.trip-roadtrip.summary':
    'Rencana ditampilkan sebagai satu perjalanan berkendara: hari dan tempat yang sama, terhubung sebagai perhentian dengan rute berkendara di antaranya, pada lajur di kolom kiri dan di peta. Tampilan ini menunjukkan jarak dan waktu tempuh, di mana kamu perlu mengisi bahan bakar, dan apa saja yang ada di sepanjang jalan.',
  'help.ctx.trip-roadtrip.bullet.1':
    '“Hari” dan “Perjalanan darat” di atas kolom kiri beralih antara rencana harian dan tampilan berkendara. Tidak ada yang disalin atau diubah: “Hari” menampilkan rencana persis seperti semula.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Bagian atas rel menampilkan total perjalanan: “Jarak”, “Waktu berkendara”, dan “Perhentian”. Di bawahnya ada kartu untuk setiap hari yang punya perjalanan darat: nomor dan tanggal hari di sebuah kotak, lalu pil untuk jarak dalam kilometer dan waktu berkendaranya, jumlah perhentian, apa saja yang dilintasinya, dan lencana “Jalur”. Penerbangan, kereta, atau feri yang kamu pesan tampil di rangkaian itu sebagai kartu tersendiri.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Perhentian bernomor adalah tempat tujuan hari itu. Perhentian di jalan, seperti isi bahan bakar, isi daya, atau rest area, menampilkan ikon jenisnya, bukan nomor, dan tidak ikut dihitung. Klik nomor untuk mengubah jenisnya, klik lencana “Persinggahan” untuk mengatur lama singgah, dan seret perhentian untuk memindahkannya di hari yang sama atau ke hari lain.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Di antara dua perhentian, pita berkendara menunjukkan jarak dan waktu tempuh ruas itu. Klik pita itu untuk membuka “Rute untuk ruas ini”, atau klik rute di peta untuk membelokkan ruas lewat titik lewat.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Kolom kanan berubah menjadi “Di sepanjang rute”: pilih apa yang dicari dan harinya dalam satu baris, lebar koridornya, lalu “Cari”. Tanda plus pada hasil, “Tambah”, memasukkannya ke perjalanan darat di titik yang benar-benar kamu lewati, dan ikon tempat tidur pada hotel menambahkan penginapan. “Manual” menambahkan tempat yang tidak ditemukan pencarian, dan tiga titik di samping judul mengimpor rute Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    '“Pengaturan berkendara” di bawahnya berisi batas, mobil dan jangkauannya, waktu tempuh harian, apa yang dihindari, cara garis digambar, dan apakah peringatan terkini tampil di peta. Semua itu milik perjalanan, jadi semua orang merencanakan dengan mobil yang sama.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Lihat perjalanan sebagai satu rute berkendara',
  'help.guide.roadtrip-mode.goal': 'Alihkan rencana ke mode perjalanan darat dan pahami apa yang ditampilkan rel.',
  'help.guide.roadtrip-mode.step.1':
    'Klik “Perjalanan darat” di sakelar “Hari” dan “Perjalanan darat” di bagian atas kolom kiri. Rencana hari diganti dengan perjalanan darat, dan peta menampilkan semua hari yang punya rute.',
  'help.guide.roadtrip-mode.step.2':
    'Kartu di bagian atas rel menjumlahkan seluruh perjalanan: “Jarak”, “Waktu berkendara”, dan “Perhentian”. Kartu ini tetap di tempatnya saat kamu menggulir hari-hari.',
  'help.guide.roadtrip-mode.step.3':
    'Di bawahnya ada kartu untuk setiap hari yang punya perjalanan darat; hari tanpa perjalanan darat tidak ditampilkan. Header kartu menampilkan nomor hari dengan tanggal di bawahnya, lalu pil untuk jarak dan waktu berkendara serta jumlah perhentian hari itu.',
  'help.guide.roadtrip-mode.step.4':
    'Di dalam kartu, hari itu ditampilkan sebagai rangkaian: perhentian bernomor untuk setiap tempat, bagian perjalanan di antara setiap pasang perhentian, dan jam tiba di tepi kanan. Penerbangan, kereta, atau feri yang kamu pesan tampil di rangkaian itu sebagai kartu tersendiri.',
  'help.guide.roadtrip-mode.step.5':
    'Klik header hari untuk melipatnya; panah di ujungnya ikut berputar. Hari yang terlipat juga disembunyikan dari peta. Klik header itu lagi untuk menampilkannya.',
  'help.guide.roadtrip-mode.result':
    'Kolom kiri menampilkan perjalanan darat, dan peta menampilkan semua harinya. “Hari” langsung mengembalikan rencana, tanpa perubahan.',
  'help.guide.roadtrip-mode.tip.1':
    'Pilihan ini disimpan per perjalanan di akunmu, jadi setelah dimuat ulang, di browser lain, atau di perangkat lain, perjalanan tetap terbuka dalam tampilan perjalanan darat.',
  'help.guide.roadtrip-mode.tip.2':
    'Sakelar ini baru muncul setelah admin mengaktifkan addon “Perjalanan darat” di “Addon” pada panel admin.',
  'help.guide.roadtrip-mode.tip.3':
    'Di ponsel tidak ada sakelar: addon ini menambahkan tab “Perjalanan darat” sendiri di samping “Rencana”.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Perhentian di jalan, dan berapa lama kamu singgah',
  'help.guide.roadtrip-stops.goal':
    'Jadikan tempat di perjalanan darat sebagai perhentian di jalan, dan atur lama singgah di setiap perhentian.',
  'help.guide.roadtrip-stops.step.1':
    'Klik nomor di depan perhentian di rel. Labelnya “Jadikan perhentian di jalan”, dan pilihan jenis perhentian terbuka sebagai deretan lingkaran berwarna di bawahnya.',
  'help.guide.roadtrip-stops.step.2':
    'Pilih jenisnya. Arahkan kursor ke lingkaran untuk melihat namanya: “Akomodasi”, “Bahan bakar”, “Pengisian daya”, “Tempat istirahat”, “Perkemahan”, “Makanan”, atau “Tempat wisata”. Nomornya berubah menjadi ikon jenis itu, dan perhentian di bawahnya dinomori ulang.',
  'help.guide.roadtrip-stops.step.3':
    'Perhentian di jalan bukan tujuan, jadi header hari itu menghitung satu perhentian lebih sedikit.',
  'help.guide.roadtrip-stops.step.4':
    'Klik ikonnya lagi, “Ubah jenis perhentian”, lalu pilih “Kembali jadi tujuan” untuk mengembalikan nomor perhentiannya.',
  'help.guide.roadtrip-stops.step.5':
    'Setiap perhentian punya lencana “Persinggahan”, yang menampilkan tanda plus selama belum ada rencana. Klik untuk membuka “Waktu di perhentian ini”.',
  'help.guide.roadtrip-stops.step.6':
    'Atur durasinya dengan slider, dengan tombol minus dan plus, atau dengan salah satu pilihan cepat. “Berangkat” ikut berubah, sedangkan “Tiba” tetap di waktu kedatangan. Lalu klik “Simpan”.',
  'help.guide.roadtrip-stops.result':
    'Lencana “Persinggahan” di perhentian yang kamu ubah menampilkan durasi baru, dan setiap waktu tiba setelahnya ikut menyesuaikan. Perhentian yang kamu ubah jenisnya lalu kembalikan lagi menjadi tujuan bernomor seperti semula.',
  'help.guide.roadtrip-stops.tip.1':
    'Lama singgah berlaku untuk tempatnya, bukan untuk satu kunjungan: tempat yang direncanakan di dua hari punya lama singgah yang sama di kedua hari itu.',
  'help.guide.roadtrip-stops.tip.2':
    'Perhentian di jalan juga tampil di “Hari”. Mematikan “Tampilkan juga di Hari”, di bawah “Perhentian layanan” pada “Pengaturan berkendara”, membuatnya hanya tampil di “Perjalanan darat”.',
  'help.guide.roadtrip-stops.tip.3': '“Tanpa singgah”, di dialog yang sama, menghapus waktunya lagi.',
  'help.guide.roadtrip-stops.tip.4':
    'Klik perhentian di jalan atau malam yang sudah dipesan untuk membuka kartunya di atas peta. Saat “Perjalanan darat” aktif, “Edit” di sana membuka dialog ringkas yang dipakai pencarian, bukan formulir tempat, dan “Detail lainnya” di dialog itu membuka formulir lengkapnya.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Cari bahan bakar, makanan, dan tempat menginap di sepanjang rute',
  'help.guide.roadtrip-corridor.goal':
    'Cari di sepanjang jalan yang benar-benar kamu lewati, dan tambahkan temuanmu ke ruas yang tepat.',
  'help.guide.roadtrip-corridor.step.1':
    'Di bawah “Mencari”, buka daftarnya dan centang yang kamu butuhkan. Kamu bisa menggabungkan “Bahan bakar”, “Pengisian daya”, “Tempat istirahat”, “Perkemahan”, “Akomodasi”, “Makanan”, dan “Tempat wisata”: daftarnya tetap terbuka untuk pilihan kedua, lalu kolomnya menampilkan ikon untuk setiap jenis.',
  'help.guide.roadtrip-corridor.step.2':
    'Pilih harinya di dropdown di ujung baris yang sama. Pilihannya adalah hari-hari yang punya kartu di rel, dan “Cari” menunggu sampai rute hari yang kamu pilih selesai dihitung.',
  'help.guide.roadtrip-corridor.step.3':
    'Di bawah “Dalam”, pilih seberapa jauh di kiri dan kanan jalan yang ingin dicari, 2 km, 5 km, atau 10 km, lalu klik “Cari”.',
  'help.guide.roadtrip-corridor.step.4':
    'Hasilnya dikelompokkan per jenis, sesuai urutan kamu melewatinya. Setiap hasil menunjukkan seberapa jauh dari rute dan di kilometer berapa dalam perjalanan hari itu.',
  'help.guide.roadtrip-corridor.step.5':
    'Klik “Tambah”, tanda plus pada hasil. “Tambahkan sebagai perhentian” menunjukkan hari dan posisi tempat itu akan ditambahkan, lalu meminta “Jenis perhentian” dan “Waktu di perhentian ini”; untuk pengisian daya juga tampil “Ketersediaan dan tarif”. “Tambah” memasukkannya ke perjalanan darat, sedangkan “Detail lainnya” membuka formulir tempat lengkap.',
  'help.guide.roadtrip-corridor.result':
    'Perhentian yang kamu tambahkan muncul di rute pada titik yang kamu lewati, dengan ikon jenisnya. Rute hari itu dihitung ulang melewati perhentian itu, dan daftarnya dikosongkan: cari lagi untuk perhentian berikutnya.',
  'help.guide.roadtrip-corridor.tip.1':
    'Pencarian baru berjalan setelah kamu menekan “Cari”, karena satu pencarian mengirim banyak permintaan ke layanan bersama.',
  'help.guide.roadtrip-corridor.tip.2':
    '“Saring menurut nama” menyaring hasil tanpa pencarian baru, dan “Hapus hasil” mengosongkan daftar dan menghapus pin-pinnya. Klik sebuah hasil untuk menampilkannya di peta.',
  'help.guide.roadtrip-corridor.tip.3':
    'Kamu juga bisa menyeret hasil dari peta ke rute. Dengan begitu, kamu bisa memilih ruasnya sendiri saat melewati jalan yang sama dua kali. “Manual”, di samping “Cari”, menambahkan tempat yang tidak ditemukan pencarian dengan mencarinya berdasarkan nama.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Arahkan ruas lewat titik lewat',
  'help.guide.roadtrip-via.goal': 'Arahkan suatu ruas agar melewati jalan yang kamu mau, tanpa menambahkan perhentian.',
  'help.guide.roadtrip-via.step.1':
    'Tampilkan ruas yang kamu mau di peta: klik sebuah perhentian di rel, lalu tutup kartu yang terbuka di atas peta.',
  'help.guide.roadtrip-via.step.2':
    'Klik rute yang tergambar. Titik via ditambahkan di ruas yang kamu klik, dan ruas itu dihitung ulang melewatinya.',
  'help.guide.roadtrip-via.step.3':
    'Lajur diperbarui: header hari menampilkan jarak dan waktu tempuh yang baru, dan setiap waktu tiba setelah titik lewat ikut berubah.',
  'help.guide.roadtrip-via.step.4':
    'Arahkan kursor ke gagang untuk melihat fungsinya: “Seret untuk mengubah rute, klik kanan untuk menghapus”. Seret ke tempat lain, dan ruas itu digambar ulang melewati titik baru.',
  'help.guide.roadtrip-via.step.5': 'Klik kanan gagangnya untuk menghapusnya. Ruas itu kembali memakai rute langsung.',
  'help.guide.roadtrip-via.result':
    'Ruas itu mengikuti jalan yang kamu pilih, lalu jarak, waktu tempuh, dan waktu tiba di hari itu dihitung ulang.',
  'help.guide.roadtrip-via.tip.1':
    'Titik via bukan perhentian: titik ini tidak punya nomor, lama singgah, atau jam tiba, dan tidak dihitung sebagai perhentian hari itu.',
  'help.guide.roadtrip-via.tip.2':
    'Pegangannya baru tampil mulai level zoom 9, jadi peta yang menampilkan seluruh perjalanan menampilkan garisnya tanpa pegangan.',
  'help.guide.roadtrip-via.tip.3':
    'Klik yang lebih dari dua kilometer dari ruas mana pun yang tergambar diabaikan, begitu juga klik pada penerbangan, kereta, atau feri.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Coba rute lain untuk satu ruas',
  'help.guide.roadtrip-alternatives.goal':
    'Lihat rute lain yang ditawarkan router untuk satu bagian perjalanan, lalu pilih salah satunya.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klik pita berkendara di panel samping, yaitu baris di antara dua perhentian yang menunjukkan jarak dan waktu tempuh ruas itu. Labelnya “Rute lain”.',
  'help.guide.roadtrip-alternatives.step.2':
    '“Rute untuk ruas ini” terbuka di atas peta, dengan satu entri per jalan beserta panjangnya. Peta menggambar setiap jalan dengan waktu tempuhnya: jalan yang sedang dipakai berwarna biru pekat, yang lain biru lebih muda.',
  'help.guide.roadtrip-alternatives.step.3':
    'Arahkan kursor ke sebuah entri untuk menyorot jalan itu. “Saat ini” adalah jalan yang sedang kamu pakai, dan “Tercepat” adalah yang paling cepat; yang lain menunjukkan seberapa lebih lambat, atau kelas jalan mana yang dihindarinya.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klik sebuah entri untuk memakai rute itu, atau “Tutup” untuk tetap memakai rute saat ini.',
  'help.guide.roadtrip-alternatives.result':
    'Ruas itu sekarang melewati jalan yang kamu pilih, dan jarak di kolom samping serta jam tiba sesudahnya ikut berubah.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Saat kamu memilih jalan lain, TREK lebih dulu memeriksanya dengan router perjalanan darat. Lalu ruas itu dipertahankan di jalan tersebut dengan titik lewat sesedikit mungkin, dan titik lewat yang sudah ada di ruas itu diganti. Jalan yang tidak bisa diikuti router tidak disimpan. Memilih jalan usulan router akan menghapus titik lewat itu lagi.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“Tanpa jalan tol cepat”, “Tanpa tol”, dan “Tanpa feri” berasal dari mesin kedua dengan model kecepatannya sendiri, jadi waktunya tidak bisa dibandingkan dengan rute lain.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Atur mobil dan batas berkendara',
  'help.guide.roadtrip-limits.goal':
    'Beri tahu TREK kendaraan apa yang kamu pakai dan seberapa jauh kamu mau berkendara tanpa istirahat.',
  'help.guide.roadtrip-limits.step.1':
    '“Pengaturan berkendara” ada di bawah pencarian di kolom kanan. Lencananya menunjukkan apa saja yang sudah diatur; klik untuk membukanya.',
  'help.guide.roadtrip-limits.step.2':
    'Di bawah Mengemudi, “Perjalanan terlama sekali jalan” dan “Mengemudi per hari” dalam menit. Kolom kosong berarti mati, dan tidak ada yang ditandai.',
  'help.guide.roadtrip-limits.step.3':
    'Di bawah “Kendaraan”, pilih kendaraanmu. “Bensin” hanya mengisi di perhentian bahan bakar, “Listrik” hanya di perhentian isi daya, “Keduanya” di keduanya.',
  'help.guide.roadtrip-limits.step.4':
    'Ketik sendiri “Jarak per tangki”, atau “Jarak per pengisian”. Atau buka “Hitung dari data mobil”, di bawah “Isi sampai”: isi “Kapasitas tangki” dan “Konsumsi”, atau “Baterai”, “Konsumsi”, dan “Penurunan baterai”, lalu jangkauannya dihitung.',
  'help.guide.roadtrip-limits.step.5':
    '“Hindari bila bisa”, di kolom kiri, adalah preferensi, bukan larangan: jika suatu hari tidak punya jalan lain, jalan itu tetap dipakai dan ada keterangannya di header hari tersebut.',
  'help.guide.roadtrip-limits.step.6':
    'Klik “Tutup”. Lencana di kartu menunjukkan apa saja yang diatur, dan rel menandai setiap ruas dan setiap hari yang melewati batas.',
  'help.guide.roadtrip-limits.result':
    'Lencana di kartu menunjukkan apa saja yang sudah diatur, dan setiap ruas dan hari yang melewati batas diberi lencana di lajur.',
  'help.guide.roadtrip-limits.tip.1':
    'Pengaturan ini milik perjalanan, jadi semua peserta merencanakan dengan mobil dan batasan yang sama.',
  'help.guide.roadtrip-limits.tip.2':
    '“Isi sampai” menentukan seberapa penuh tangki atau baterai diisi di setiap perhentian, karena di jalan tidak ada yang mengisi sampai 100 %. Perhentian isi bahan bakar atau isi daya bisa memakai nilai sendiri lewat lencana baterai di barisnya.',
  'help.guide.roadtrip-limits.tip.3':
    'Di bawah “Garis rute”, “Hubungkan hari” juga membuat rute dari perhentian terakhir satu hari ke perhentian pertama hari berikutnya. “Mulai dan akhiri setiap hari di penginapan Anda” memulai dan mengakhiri setiap hari di akomodasi yang dipesan untuk malam-malam itu. “Satu warna per hari” menampilkan setiap hari dengan warnanya sendiri.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Atur waktu mulai dan selesai berkendara setiap hari',
  'help.guide.roadtrip-day-window.goal':
    'Berhenti berkendara pada jam yang kamu pilih, dan tentukan di mana hari itu berakhir.',
  'help.guide.roadtrip-day-window.step.1':
    'Buka “Pengaturan berkendara” di kolom kanan, lalu cari “Waktu perjalanan harian” di kolom kiri dialog.',
  'help.guide.roadtrip-day-window.step.2':
    'Isi “Awal hari”. Sendirian, isian ini tidak berpengaruh apa pun: kedua waktu diperlukan, seperti dijelaskan di keterangan di bawahnya.',
  'help.guide.roadtrip-day-window.step.3':
    'Isi “Akhir hari”. Perjalanan sekarang berhenti pada jam itu dan berlanjut keesokan paginya, ditampilkan sebagai baris “Akhir hari” dan baris “Lanjutkan perjalanan” di kolom samping.',
  'help.guide.roadtrip-day-window.step.4':
    'Di bawah “Akhir hari”, pilih “Di sepanjang rute” untuk berhenti di jalan saat waktu akhir tiba, atau “Di tempat terakhir” untuk berhenti sebelum perjalanan berikutnya melewati batas itu.',
  'help.guide.roadtrip-day-window.step.5':
    'Klik “Tutup”. Kartu “Pengaturan berkendara” menampilkan kedua waktu itu sebagai lencana.',
  'help.guide.roadtrip-day-window.result':
    'Perjalanan dibagi menjadi hari-hari berkendara sesuai durasi yang kamu atur, dan sisanya berlanjut ke hari-hari hasil hitungan setelah hari terakhir. Hari-harimu dan tempatnya tidak berubah.',
  'help.guide.roadtrip-day-window.tip.1':
    'Kalau salah satu waktunya dikosongkan, fitur ini mati lagi. Waktu yang kamu atur sendiri di sebuah perhentian selalu diutamakan.',
  'help.guide.roadtrip-day-window.tip.2':
    'Kalau waktu perjalanan harian diatur, hari-hari selalu terhubung: perjalanan dari perhentian terakhir satu hari ke perhentian pertama hari berikutnya dihitung rutenya dan ikut dijumlahkan.',
  'help.guide.roadtrip-day-window.tip.3':
    'Setiap akhir hari juga tampil sebagai penanda di peta: ikon bulan dengan nomor hari. Seret di sepanjang rute, atau ke sebuah tempat, untuk mengakhiri hari di tempat lain. Klik kanan untuk mengembalikan akhir hari otomatis. “Pulihkan akhir hari otomatis” di dialog ini membatalkan semua perubahan itu. Untuk mengakhiri hari di suatu perhentian, klik perhentian itu dan aktifkan “Akhiri hari di sini” di kartunya.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Mengisi ulang sebelum tangki habis',
  'help.guide.roadtrip-refuel.goal':
    'Cari tempat isi ulang di bagian rute yang masih terjangkau mobil, lalu tambahkan ke perjalanan darat.',
  'help.guide.roadtrip-refuel.step.1':
    'Jika jangkauan sudah diatur, kolom samping menampilkan pita di ruas tempat bahan bakar atau baterai habis: “Tangki habis di sini”, atau “Baterai habis di sini” untuk mobil listrik. Di bawahnya terlihat di titik mana dalam ruas itu habisnya.',
  'help.guide.roadtrip-refuel.step.2':
    'Ikon lampu di pita itu adalah tombolnya: “Cari bahan bakar”, atau “Cari pengisian daya” untuk mobil listrik. Pencarian dilakukan di sepanjang jalan sebelum titik itu dan menampilkan “Mencari di sepanjang rute…” selama berlangsung.',
  'help.guide.roadtrip-refuel.step.3':
    'Maksimal tiga stasiun ditampilkan, masing-masing dengan jaraknya dari rute dan sisa jarak tempuh yang masih kamu punya.',
  'help.guide.roadtrip-refuel.step.4':
    'Tanda plus di sebuah hasil menambahkannya sebagai perhentian isi bahan bakar. “Tambahkan sebagai perhentian” terbuka dengan jenis dan waktu yang sudah terisi, dan “Tambah” menaruhnya di ruas, tepat di titik yang benar-benar dilewati rute.',
  'help.guide.roadtrip-refuel.result':
    'Perhentian muncul di ruas yang tepat dengan ikonnya sendiri, dan jarak tempuh dihitung lagi mulai dari perhentian itu. Pita pindah ke titik saat tangki kini habis, atau hilang kalau kamu bisa sampai di akhir perjalanan tanpa berhenti lagi.',
  'help.guide.roadtrip-refuel.tip.1':
    'Jangkauan dihitung dari perhentian isi bahan bakar atau isi daya terakhir, lintas hari. Jenis kendaraanmu menentukan perhentian mana yang dihitung: “Bensin” hanya pengisian bahan bakar, “Listrik” hanya pengisian daya.',
  'help.guide.roadtrip-refuel.tip.2':
    'Pencarian melihat jalan sebelum titik bahan bakar habis, menyisakan cadangan, dan menghitung jalan memutar dua kali, jadi setiap tempat yang ditawarkan benar-benar bisa dicapai.',
  'help.guide.roadtrip-refuel.tip.3':
    'Jika tidak ada hasil, kamu bisa mencari lagi: ikon lampunya berubah menjadi “Coba lagi”, karena pencarian tempat adalah layanan bersama yang kadang kehabisan waktu.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Buat hari mengikuti jalur yang diimpor',
  'help.guide.roadtrip-track.goal':
    'Pakai rute indah yang kamu impor sebagai jalur GPX atau KML untuk perjalanan berkendara satu hari.',
  'help.guide.roadtrip-track.step.1': 'Klik lencana “Jalur” di header sebuah hari. Dialog terbuka untuk hari itu.',
  'help.guide.roadtrip-track.step.2':
    'Pilih jalur. Setiap jalur menampilkan panjangnya dan apakah jalur itu mengikuti rute hari ini atau seberapa jauh letaknya. Jalur terdekat tampil paling atas.',
  'help.guide.roadtrip-track.step.3':
    'Klik “Ikuti jalur ini”. TREK menambahkan titik via di bagian yang paling jauh dari jejak, lalu menghitung ulang rutenya, dan mengulanginya beberapa kali.',
  'help.guide.roadtrip-track.step.4':
    'Dialog menyebutkan berapa titik via yang ditempatkan dan seberapa dekat perjalanan darat kini mengikuti jejak, atau bahwa perjalanan darat sudah mengikuti jejak. “Buang titik via”, di kiri bawah, menghapus titik-titik itu, lalu router merencanakan ulang hari tersebut. Menutup dialog tetap mempertahankan jejaknya.',
  'help.guide.roadtrip-track.result':
    'Perjalanan darat hari itu mengikuti jejak, bukan jalan yang akan dipilih router. Arahkan kursor ke lencana “Jalur” untuk melihat nama jejaknya. Jika titik via menjaga perjalanan tetap di jejak, lencananya juga disorot.',
  'help.guide.roadtrip-track.tip.1':
    'Dialog ini mencantumkan tempat-tempat perjalanan yang punya jalur: GPX atau KML yang diimpor dengan “Impor file” di kolom tempat di bawah “Hari”, dengan “Rute” atau “Trek (dengan geometri jalur)” dicentang untuk GPX, atau “Jalur (LineStrings)” untuk KML. “Impor file” hanya tersedia selama addon Tur mati; jika Tur aktif, GPX menjadi tur, dan tur tidak tercantum di dialog ini. Selama perjalanan belum punya jejak, tidak ada hari yang menampilkan lencananya.',
  'help.guide.roadtrip-track.tip.2':
    'Mengikuti jejak menggantikan titik via yang sudah dimiliki ruas-ruas hari itu, jadi bentuk ruas secara manual setelah mengikuti jejak, bukan sebelumnya.',
  'help.guide.dateless-trip.step.1': 'Klik “Perjalanan Baru”, lalu beri nama perjalanannya.',
  'help.guide.edit-trip.tip.2':
    'Teman perjalanan yang kamu tambahkan atau hapus di sini langsung berlaku, tanpa perlu klik “Perbarui”.',
  'help.guide.trip-reminder.result':
    'Pengingat akan kamu terima sesuai jumlah hari yang dipilih sebelum perjalanan dimulai, lewat saluran notifikasi yang kamu pakai.',
  'help.guide.upcoming-reservations.step.1':
    'Cari “Reservasi mendatang” di kolom kanan. Di sana ada enam pemesanan terdekat dari semua perjalananmu, diurutkan dari yang paling dekat, lengkap dengan tanggal, jam, dan jenisnya.',
  'help.guide.half-company-holiday.step.1': 'Alihkan toolbar ke “Hari Libur Perusahaan”.',
  'help.guide.edit-holiday-calendar.result': 'Kisi dan legenda langsung diperbarui setiap kali ada perubahan.',
  'help.guide.person-color.result': 'Semua hari yang dicatat orang itu kini tampil dengan warna baru.',
  'help.guide.answer-fusion-request.step.1':
    'Buka Vacay setelah seseorang mengundangmu. Dialog “Permintaan Penggabungan” akan terbuka sendiri.',
  'help.guide.log-for-partner.step.1':
    'Di kartu “Orang”, klik nama orangnya. Tanda centang menunjukkan bahwa orang itu sedang dipilih.',
  'help.guide.dissolve-fusion.step.1': 'Buka “Pengaturan”.',
  'help.guide.country-places.step.2': 'Klik lencana “Tempat” di kartu, yang bergambar pin.',
  'help.guide.search-place.tip.2':
    'Jika wilayahnya sudah ditandai, popup akan menanyakan apakah kamu ingin menghapus tandanya.',
  'help.guide.tour-activity-stats.step.4':
    'Lencana di sebelah kanan menunjukkan dasar penjumlahannya: “Direncanakan” untuk tur yang dihitung dari rencana perjalananmu, “Terekam” untuk tur yang sudah ditautkan ke jejak sebenarnya. “Masih akan datang”, “Tanpa hari”, dan “Tanpa tanggal” menghitung tur yang belum ikut dijumlahkan. Ikon i menjelaskan aturannya.',
  'help.guide.move-to-list.step.2':
    'Klik “Duplikat ke daftar” agar tempatnya tetap ada di sini juga, atau “Pindahkan ke daftar” untuk mengeluarkannya dari daftar ini.',
  'help.guide.accept-list-invite.title': 'Menerima undangan ke daftar',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Di bawah “Titik jalan”, pilih kotak yang berisi titik jalan untuk menambahkan awal, perhentian, dan akhir sesuai urutannya, atau “Hanya garis” untuk menambahkan garis yang tersimpan saja.',
  'help.guide.tour-collection-manage.step.1':
    'Buka sebuah daftar. Setiap tur yang tersimpan menampilkan tingkat kesulitan, jenis, perjalanan asal tur itu disimpan, jarak dan tanjakannya, serta jumlah titik jalannya. Arahkan kursor ke nama perjalanan untuk melihat siapa yang menyimpannya.',
  'help.guide.entry-draft.step.1': 'Di editor, aktifkan “Draf” di kolom kanan.',
  'help.guide.journey-map-layers.step.3':
    'Klik pin berongga atau titik kecil di peta. Sebuah kartu akan menjelaskan apa itu: tempat yang direncanakan beserta harinya, atau persinggahan dengan “Buka catatan”, yang membawamu ke laporan harian tempat persinggahan itu berada.',
  'help.guide.journey-keep-route.step.3': 'Klik “Simpan rute”.',
  'help.guide.journey-day-stays.step.3':
    'Klik “Bukan tempat yang saya kunjungi” pada persinggahan yang tidak kamu inginkan. Persinggahan itu akan dihapus dari daftar.',
  'help.guide.journey-take-over-day.step.3':
    'Kalau kamu mau satu entri untuk seharian penuh, ubah “Entri” ke “Laporan harian”: satu entri akan mencantumkan semua persinggahan yang dipilih beserta waktunya.',
  'help.guide.journey-auto-prepare.step.2':
    'Di bawah “Hari yang terekam”, aktifkan “Siapkan hari yang terekam secara otomatis”.',
  'help.guide.photo-location.step.2': 'Di bawah “Foto”, aktifkan “Tentukan lokasi entri dari fotonya”.',
  'help.guide.link-trip.tip.3':
    'Jika kamu menulis entri pada hari dari perjalanan yang belum ditautkan, editor langsung menawarkan “Tautkan Perjalanan” di entri itu.',
  'help.ctx.settings-plugins.summary':
    'Pengaturanmu sendiri untuk plugin yang dipasang admin: kunci dan preferensi yang diminta tiap plugin, serta log tentang apa saja yang dilakukan plugin atas namamu. Tab ini hanya muncul selama ada plugin yang aktif.',
  'help.ctx.settings-about.bullet.3':
    'Lewat Ko-fi, Buy Me a Coffee, dan Discord, kamu bisa mendukung TREK atau mengobrol dengan orang-orang yang membuatnya.',
  'help.guide.language-region.step.3':
    'Atur “Mata uang tampilan”, atau biarkan “Mata uang perjalanan” agar setiap perjalanan tampil dalam mata uangnya sendiri. Lalu pilih “Satuan Suhu”, “Satuan Jarak”, “Format Waktu”, dan hari “Awal minggu”.',
  'help.guide.travel-map-prefs.step.3':
    '“Jelajahi tempat di peta” menampilkan pil kategori untuk mencari tempat di sekitar. “Sembunyikan Kode Pemesanan” menyamarkan nomor konfirmasi sampai kamu mengarahkan kursor ke atasnya atau mengetuknya. “Optimalkan rute dari akomodasi” membuat setiap hari dimulai dan diakhiri di hotelmu.',
  'help.guide.web-push-device.step.2':
    'Di kartu “Notifikasi” paling atas, kolom Push mengatur peristiwa mana yang dikirim ke perangkatmu.',
  'help.guide.connect-airtrail.goal': 'Izinkan TREK mengimpor dan menyinkronkan penerbangan dari AirTrail milikmu.',
  'help.guide.connect-dawarich.goal':
    'Izinkan TREK membaca ke mana saja kamu benar-benar pergi, dari Dawarich milikmu.',
  'help.guide.tour-connect-wanderer.goal':
    'Izinkan TREK membaca jalur dari wanderer milikmu agar bisa kamu impor sebagai tur.',
  'help.guide.tour-wanderer-watch.title': 'Dapatkan notifikasi saat jalur wanderer-mu berubah',
  'help.guide.plugin-settings.tip.2':
    'Saluran plugin di bawah “Notifikasi” punya tombol “Konfigurasi” yang membuka halaman ini.',
  'help.guide.default-user-settings.result':
    'Akun baru, dan semua orang yang belum pernah mengubah pengaturan ini, akan melihat pilihanmu.',
  'help.guide.own-routing-engine.goal':
    'Hitung rute harian dan road trip lewat server OSRM atau Valhalla milikmu sendiri, bukan server publik.',
  'help.guide.admin-passkeys.tip.1':
    'Jika TREK belum bisa menentukan domain, akan muncul peringatan, dan passkey tetap disembunyikan sampai kamu mengatur APP_URL atau Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Di bagian bawah tab “Pengaturan”, di bawah “Zona Berbahaya”, klik “Putar Ulang” di samping “Putar Secret JWT”.',
  'help.guide.storage-backends.tip.3':
    'TREK bisa mengunduh ulang cache foto, jadi mencerminkannya biasanya hanya membuang ruang penyimpanan.',
  'help.guide.admin-channels.step.3':
    'Di kartu “Notifikasi” di bawahnya, tentukan untuk setiap peristiwa saluran mana yang mengirimkannya: “Versi baru tersedia”, “Kegagalan replika penyimpanan”, dan “Wilayah dayung diminta”. Setiap sakelar langsung tersimpan.',
  'help.guide.notification-defaults.tip.1':
    '“Mati” adalah default yang masih bisa diaktifkan sendiri oleh setiap pengguna; “Diblokir” mematikannya untuk semua orang.',
  'help.ctx.notifications.bullet.4':
    'Di samping waktu setiap notifikasi, “Tandai sudah dibaca” (centang ganda) dan “Hapus” (tempat sampah) hanya berlaku untuk notifikasi itu. “Tandai semua dibaca” dan “Hapus semua” di bagian atas berlaku untuk seluruh daftar.',
  'help.guide.read-notifications.tip.2':
    'Notifikasi tanpa tombol hanya berisi informasi. Baca di panel, lalu tandai sudah dibaca di sana.',
  'help.guide.filter-notifications.result':
    'Daftar hanya menampilkan notifikasi yang belum dibaca, mulai dari yang terbaru.',
  'help.guide.delete-notifications.title': 'Menghapus notifikasi',
  'help.guide.notification-settings.goal':
    'Tentukan peristiwa mana yang muncul di ikon lonceng dan mana yang juga dikirim kepadamu lewat email, webhook, ntfy, atau push.',
  'help.guide.public-link.step.4': 'Klik “Buat tautan”, lalu “Salin”, dan kirimkan tautannya.',
  'help.guide.link-journal.step.2': 'Klik “Tautkan jurnal”, lalu pilih salah satu jurnalmu di “Pilih jurnal”.',
  'help.guide.dawarich-stays.title': 'Jadikan persinggahan yang terekam sebagai tempat',
  'help.guide.dawarich-stays.tip.2':
    'Jika kamu menghapus tempat yang berasal dari persinggahan, persinggahan itu kembali ke daftar dengan status menunggu.',
  'help.guide.leave-stop-off-route.goal':
    'Biarkan perhentian tetap ada di hari itu tanpa dilewati rute, untuk tempat yang kamu lalui dengan jalan kaki atau yang cukup ada di peta saja.',
  'help.guide.day-route.tip.4':
    'Untuk perhentian yang ingin tetap ada di hari itu tapi tidak dilewati rute, pilih “Keluarkan dari rute” di menunya.',
  'help.guide.move-booking-day.step.2':
    'Seret barisnya ke header kartu hari lain. Pemesanan satu hari akan pindah seluruhnya ke hari itu. Untuk pemesanan yang mencakup beberapa hari, baris “Keberangkatan” memindahkan hari mulainya dan baris “Kedatangan” memindahkan hari berakhirnya.',
  'help.guide.place-image-from-file.title': 'Pakai foto lampiran sebagai gambar tempat',
  'help.guide.place-image-from-file.tip.2':
    'Foto yang disematkan ke perhentian atau dilampirkan ke pemesanannya juga ikut ditawarkan.',
  'help.guide.place-own-hours.step.5':
    'Klik “Perbarui”. Kartu sekarang menampilkan jam buatanmu di bawah “Jam Buka”, dan status “Buka” atau “Ditutup” di bagian atas mengikuti jam tersebut.',
  'help.guide.confirm-stay-booking.step.3':
    'Klik “Menunggu” di bagian atas. Tooltipnya menampilkan “Setel ke Dikonfirmasi”, dan titiknya berubah hijau.',
  'help.guide.map-nearby-places.tip.4':
    'Kategori yang pencariannya gagal diberi titik merah, dan “Cari di area ini” berubah merah dengan tanda peringatan: klik untuk mencoba lagi.',
  'help.guide.tour-map-lines.tip.1':
    'Saat kamu melipat suatu hari di kolom hari, tur dan perhentiannya disembunyikan dari peta.',
  'help.guide.car-stops.step.3':
    'Ketik judul di header. Di bawah “Rute”, pilih tempat kamu mengambil mobil di “Dari” dan tempat kamu mengembalikannya di “Ke”; tempat-tempat perjalanan langsung ditawarkan sebelum kamu mengetik. “Penjemputan” dan “Waktu jemput” untuk kapan kamu mengambil mobil, “Pengembalian” dan “Waktu kembali” untuk kapan kamu mengembalikannya.',
  'help.guide.transport-details.step.1':
    'Di tab “Transportasi”, klik sebuah kartu. Detailnya terbuka di atas tab, dengan header berwarna sama seperti kartunya. Baris transportasi di rencana hari membuka detail yang sama.',
  'help.guide.export-transports-csv.tip.2':
    'Tab “Pemesanan” punya ikon yang sama dan membuat filenya sendiri, yang namanya berakhiran bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Di bawah “Kelompokkan menurut”, pilih Status, “Hari”, “Jenis”, atau “Tanpa pengelompokan”. Tab langsung tersusun ke dalam bagian-bagian tersebut.',
  'help.guide.export-bookings-csv.result':
    'Browsermu mengunduh file yang dinamai sesuai perjalanan dan tabnya, misalnya autumn-in-japan-bookings.csv, dengan satu baris untuk setiap pemesanan yang tampil di tab itu.',
  'help.guide.arrange-packing-list.result':
    'Daftar tersusun sesuai urutan yang kamu seret, dan item diurutkan dari A ke Z sampai kamu mematikannya. TREK tetap menyimpan urutan buatanmu sendiri.',
  'help.guide.count-packed-pieces.step.2':
    'Penghitung muncul sebelum jumlahnya: 0/5, dengan tombol minus dan plus. Klik plus untuk setiap barang yang masuk ke tas.',
  'help.guide.expense-receipts.step.4':
    'Kembali di buku kas, baris itu kini punya chip “Kuitansi” di samping namanya, dengan jumlahnya dalam kurung jika ada beberapa. Klik untuk membuka kuitansinya.',
  'help.guide.final-budget.tip.3':
    'Orang yang sudah keluar dari perjalanan tetap punya baris di “Saldo” dan “Anggaran akhir” selama masih ada uang yang harus dibayar kepadanya atau olehnya.',
  'help.guide.files-sync-settings.step.2':
    'Bar alur menampilkan TREK dan penyimpananmu beserta dokumen yang ada di masing-masing, dan dua jalur di antaranya: “Keluar ke penyimpanan” dan “Masuk dari penyimpanan”. Klik “Keluar ke penyimpanan” untuk mematikannya. Jalurnya menjadi redup dan baris di bawah jalur bertuliskan “Hanya masuk”. Klik lagi untuk mengaktifkannya kembali.',
  'help.guide.files-sync-settings.tip.4':
    'Hanya pemilik perjalanan atau administrator yang bisa mengubah semua ini. Anggota lain melihat bar alur dengan keterangan seperti “Dokumen bergerak dua arah”, tapi tanpa “Pengaturan”.',
  'help.guide.manage-notes.step.2':
    '“Perluas” membuka catatan secara lengkap: seluruh teksnya, Situs web, dan “File”-nya. Klik file untuk melihat pratinjaunya. “Edit” di bagian bawah langsung beralih ke editor; tanda silang di kanan atas menutup catatan lagi.',
  'help.guide.note-categories.goal':
    'Beri catatan grup kategori yang punya nama dan warna, lalu tampilkan satu kategori saja.',
  'help.guide.note-categories.tip.1':
    'Tempat sampah hanya bisa menghapus kategori yang tidak dipakai catatan mana pun. Kategori yang masih dipakai catatan tetap ada di daftar sampai catatan-catatan itu dipindahkan ke kategori lain.',
  'help.guide.roadtrip-reorder.title': 'Ubah urutan perhentian atau pindahkan ke hari lain',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK tidak bertanya soal jam yang sudah kamu sematkan: rel langsung menghitung ulang hari itu dan menandai perhentian yang tidak lagi bisa dicapai tepat waktu.',
  'help.guide.roadtrip-overnight.step.3':
    'Di bagian atas dialog, “Menginap” menambahkan penginapan semalam, dan “Istirahat” menjadikannya perhentian sementara. Hotel terbuka dengan “Menginap”, tempat berkemah dengan “Istirahat”. Untuk menginap, hanya Check-in yang diminta, dan boleh dikosongkan.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Pada perhentian isi bahan bakar atau isi daya di rel, klik lencana baterai. Lencana itu menunjukkan level pengisian di perhentian tersebut: samar selama masih memakai nilai “Isi sampai” milikmu, tegas begitu punya nilai sendiri.',
  'help.guide.roadtrip-bookings.step.1':
    'Pesan perjalanannya sebagai pemesanan “Penerbangan”, “Kereta”, “Feri”, “Kapal Pesiar”, atau Bus pada harinya, dengan lokasi kedua ujungnya terisi. Perjalanan darat otomatis menyertakannya: jalan berakhir di terminal keberangkatan dan berlanjut lagi dari tempat kedatangan.',
  'help.guide.roadtrip-google-import.result':
    'Perhentian dari rute itu ditambahkan setelah perhentian terakhir hari tersebut, dan rute di rel serta di peta melewati semuanya.',
  'help.guide.roadtrip-hazards.step.3':
    'Peringatan digambar di peta sebagai area. Klik salah satunya untuk melihat isinya, layanan mana yang melaporkannya, dan kapan terakhir diperbarui.',
  'help.ctx.trip-tours.bullet.2':
    'Di bagian atas, “Impor GPX atau KML” memasukkan file sebagai tur. Tombol filter di bawahnya (awalnya bertuliskan “Semua”, dengan jumlah tur) menyaring daftar menurut status, sumber, batas rute, dan jenis.',
  'help.guide.tour-show-list.step.2':
    'Setiap baris adalah satu tur. Bilah berwarna menunjukkan garisnya di peta, dan kotak bulat menampilkan batas rute (T1 sampai T6) untuk pendakian yang direncanakan di TREK, atau ikon jenisnya. Lencana di bawah nama menunjukkan hari-harinya, waktu, jarak, dan tanjakannya. Pada tur beberapa hari, ikon bulan dengan angka menunjukkan jumlah etapenya.',
  'help.guide.tour-add-to-day.title': 'Masukkan tur ke suatu hari',
  'help.guide.tour-add-to-day.tip.2':
    'Jika perjalanan berakhir sebelum etape terakhir, pilihannya menunjukkan etape terakhir yang masih muat, dan etape sesudahnya tetap tanpa hari.',
  'help.guide.tour-day-times.step.3':
    'Klik “Perbarui”. Baris sekarang menampilkan mulai → selesai. Jam selesai hasil hitungan tampil lebih terang, dengan ≈ untuk perkiraan, ≥ selama ada persinggahan yang belum punya jam, dan +1 jika lewat tengah malam. Arahkan kursor ke sana untuk melihat cara menghitungnya.',
  'help.guide.tour-remove-from-day.goal': 'Batalkan jadwal tur tanpa menghapusnya.',
  'help.guide.tour-filter-list.goal':
    'Saring daftar yang panjang sampai tersisa tur yang kamu cari: yang belum direncanakan, yang dari file, atau yang satu jenis.',
  'help.guide.tour-filter-list.result':
    'Hanya tur hasil filter yang ada di daftar; tur lainnya tetap ada di perjalanan.',
  'help.guide.tour-hide-on-map.result':
    'Hanya tur yang kamu pilih yang tampil di peta, sedangkan yang disembunyikan tetap ada di daftar dalam keadaan redup.',
  'help.guide.tour-import-plan-tab.result':
    'Jejak itu kini menjadi tur perjalanan: satu baris di daftar dengan lencana GPX, dan satu garis di peta.',
  'help.guide.tour-detail-read.title': 'Membuka tur dan membaca kartunya',
  'help.guide.tour-detail-read.step.7': 'Tutup kartu dengan X di bagian atasnya, atau tekan Escape.',
  'help.guide.tour-rename-colour.goal':
    'Beri tur nama yang mudah kamu kenali dan warna garis yang jelas terlihat di peta.',
  'help.guide.tour-take-along.title': 'Unduh tur ke ponsel atau GPS-mu',
  'help.guide.tour-take-along.tip.4':
    'Di tab “Tur”, tombol unduh yang sama ada di bagian atas kolom kiri. Selama tur punya perubahan yang belum disimpan, kamu akan diminta menyimpannya dulu sebelum mengunduh.',
  'help.guide.tour-copy-keep.tip.1':
    'Keduanya adalah salinan: perubahan pada tur nanti tidak mengubah salinannya maupun versi yang kamu simpan di koleksi.',
  'help.guide.tour-packing-link.step.2':
    'Di bawah “Tautkan ke”, pilih “Seluruh daftar bawaan” atau salah satu daftarnya. Setiap baris menunjukkan berapa item di dalamnya.',
  'help.guide.tour-files.title': 'Lampirkan file ke tur',
  'help.guide.tour-activity-link.title': 'Tautkan jejak yang benar-benar kamu tempuh',
  'help.guide.tour-activity-link.tip.2':
    'Kamu hanya bisa menautkan jejak impor yang belum dipakai untuk merencanakan tur, dan setiap jejak hanya bisa ditautkan ke satu tur.',
  'help.guide.tour-activity-compare.step.4':
    '“Ganti” di bawah jejak untuk memilih rekaman lain. “Lepas Tautan” melepaskannya dari tur, dan jejaknya tetap ada di perjalanan sebagai impor.',
  'help.guide.tour-origin-check.step.3':
    'Tur yang kamu gambar di tab “Tur” bertuliskan “direncanakan di TREK”, beserta tanggal “Dibuat”-nya.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Rel kiri adalah editornya. Jika belum ada yang terbuka, tersedia “Rencanakan tur baru”. Tur yang terbuka menampilkan nama, jenis, titik jalan, kartu-kartu sesuai jenisnya, dan detailnya, dengan “Buang” dan “Simpan” di bagian bawah.',
  'help.guide.tour-open-workspace.step.2':
    'Rel kiri adalah editornya. Jika belum ada tur yang terbuka, tersedia “Rencanakan tur baru” untuk memulai tur di peta.',
  'help.guide.tour-open-workspace.tip.3':
    'Jika kamu membuka tur lain saat editor masih punya perubahan yang belum disimpan, TREK akan bertanya dulu: “Buang perubahan”, atau lanjut mengedit.',
  'help.guide.tour-draw-route.step.5':
    'Klik titik-titik berikutnya sesuai urutan kamu melewatinya. Setiap klik menambahkan titik itu sebagai ujung baru, dan begitu ada dua titik, TREK merencanakan rute menyusuri jalan setapak.',
  'help.guide.tour-type-profile.goal':
    'Pilih jenis tur, dan untuk tur sepeda juga profilnya, agar rute melewati jalan yang sesuai.',
  'help.guide.tour-edit-points.title': 'Pindahkan, urutkan ulang, dan hapus titik',
  'help.guide.tour-edit-points.tip.1':
    'Titik pertama diberi lencana “Mulai” dan yang terakhir “Selesai”. Memindahkan titik ke paling atas atau paling bawah menjadikannya titik awal atau akhir.',
  'help.guide.tour-shaping-points.step.4':
    'Untuk mengubah perhentian menjadi titik bentuk atau sebaliknya, buka “Tindakan lainnya” di barisnya, lalu pilih “Jadikan titik bentuk” atau “Jadikan perhentian”.',
  'help.guide.tour-loop-reverse.step.2':
    'Baris terakhir kini bertuliskan “Kembali ke awal”, dan rute di peta berakhir di titik awalnya.',
  'help.guide.tour-leg-by-hand.step.1':
    'Buka “Tindakan lainnya” pada titik awal ruas itu, lalu pilih “Gambar ruas berikutnya dengan tangan”.',
  'help.guide.tour-trip-places.goal': 'Jadikan tempat yang sudah kamu rencanakan di perjalanan sebagai perhentian tur.',
  'help.guide.tour-trip-places.result': 'Tur punya perhentian baru untuk tempat perjalanan itu, dengan nama yang sama.',
  'help.guide.tour-details-times.tip.2':
    'Pada pendakian, “Detail” juga berisi “Tingkat kesulitan jalur maksimum” dan “Pilihan rute”, yang dijelaskan di panduan pendakian. Jalan-jalan kota tidak punya “Istirahat”: lama singgah di setiap perhentiannya yang dipakai.',
  'help.guide.tour-save.step.4': 'Tur sekarang tercantum di bawah “Tur dalam perjalanan ini”, belum di hari mana pun.',
  'help.guide.tour-edit-saved.step.2':
    'Ubah yang perlu, sama seperti pada tur baru: pindahkan atau tambah titik, ganti jenisnya, atau edit detailnya, misalnya “Deskripsi” seperti di sini.',
  'help.guide.tour-summary-profile.goal':
    'Lihat seberapa panjang dan curam turnya, dan di bagian rute mana setiap ketinggian berada.',
  'help.guide.tour-summary-profile.result':
    'Kamu tahu panjang tur, total tanjakannya, lama perjalanannya, dan bagian mana yang curam.',
  'help.guide.tour-list-manage.tip.1':
    'Setiap tur dihitung sekali dalam total, meskipun ada di beberapa hari. Jumlah yang diawali ≥ belum mencakup beberapa tur. Arahkan kursor ke sana untuk melihat berapa banyak.',
  'help.guide.tour-delete.tip.1': 'Tindakan ini tidak bisa dibatalkan, dan “Urungkan” tidak bisa mengembalikan tur.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Jika kamu tetap mengklik “Simpan”, yang terbuka justru “Diubah sementara itu”, dan tidak ada yang tertimpa.',
  'help.ctx.trip-tour-import.bullet.2':
    '“Pratinjau impor” menampilkan setiap jejak dari file di peta, dengan jarak, tanjakan, turunan, dan jumlah titiknya, sebelum apa pun disimpan. Di bawah “Impor sebagai”, kamu menentukan jejak itu apa.',
  'help.guide.tour-import-gpx.step.3':
    '“Pratinjau impor” terbuka, dan belum ada yang disimpan. Peta menampilkan seluruh lintasan, dan setiap jejak dari file menjadi baris bernomor dengan jarak, tanjakan, turunan, dan jumlah titiknya. Jejak hasil rekaman juga menunjukkan kapan direkam dan berapa lama durasinya.',
  'help.guide.tour-import-gpx.result':
    'Tur ada di “Tur dalam perjalanan ini”, belum di hari mana pun. Jika hanya satu, tur langsung terbuka di peta sebagai “Tur GPX”.',
  'help.guide.tour-view-import.tip.3': 'Jalur dari wanderer terbuka dengan cara yang sama, sebagai “Tur wanderer”.',
  'help.guide.tour-plan-from-import.tip.1':
    '“Buang” menghapus sarannya. Tidak ada yang tersimpan sampai kamu menyimpannya.',
  'help.guide.tour-restore-recorded.step.2': 'Klik “Pulihkan jejak yang direkam”.',
  'help.guide.tour-take-over.step.2': 'Pilih “Ambil tur dari perjalanan lain”.',
  'help.guide.tour-take-over.result':
    'Sebuah pesan mengonfirmasi pengambilan tur, dan tur terbuka di editor, siap dimasukkan ke suatu hari.',
  'help.guide.tour-import-wanderer.tip.2':
    'Hasil impor adalah salinan: perubahan di wanderer nanti tidak mengubah tur ini. “Periksa sumber” di “Asal” tur memberi tahu kapan jalurnya berubah.',
  'help.ctx.trip-tour-map.bullet.3':
    '“Cari tempat atau alamat” di bagian atas peta memindahkan peta ke kota, pondok, atau puncak tanpa menambahkan apa pun ke tur.',
  'help.guide.tour-map-layers.result':
    'Tur digambar di peta yang sesuai, dan pil menunjukkan peta mana yang sedang aktif.',
  'help.guide.tour-along-search.step.3':
    'Di bawah “Dalam jarak ini dari rute”, pilih seberapa jauh dari garis pencarian dilakukan: 250 m, 500 m, 1 km, atau 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Arahkan tur agar melewati titik pandang, pondok, atau mata air yang kamu temukan di sepanjang rute.',
  'help.guide.tour-along-add-stop.tip.3':
    'Ruas yang tidak bisa diberi perhentian (via ferrata atau angkut perahu yang ditambahkan sebagai garis tetap, atau ruas yang digambar dengan tangan) tetap redup di daftar, dengan alasannya di sampingnya.',
  'help.guide.tour-3d-terrain.result':
    'Kamu sudah melihat tur di medan 3D dengan bagian curamnya yang berwarna, dan peta datar sudah kembali untuk perencanaan.',
  'help.guide.tour-3d-flyover.step.3':
    '“Jeda” menghentikan penerbangan di posisinya, dan “Putar penerbangan” melanjutkannya dari situ. “Mulai ulang” kembali ke awal dan memulai penerbangan lagi.',
  'help.guide.tour-map-overlays.step.1':
    'Buka tur ski di tab “Tur”. Lintasan ski langsung tampil sejak awal: sakelarnya adalah ikon gunung bersalju di pil kiri bawah, “Lintasan ski, jalur ski lintas alam, dan lift”. Klik untuk menyembunyikannya dari peta, dan klik lagi untuk menampilkannya.',
  'help.ctx.trip-tour-stages.title': 'Tur beberapa hari',
  'help.guide.tour-multi-day.goal': 'Bagi satu rute menjadi beberapa etape, satu untuk setiap hari perjalananmu.',
  'help.guide.tour-multi-day.tip.2':
    'Untuk menggabungkan dua etape lagi, pilih “Hapus akhir etape” di menu perhentian yang berikon bulan. Menghapus perhentian itu juga menggabungkannya, dan muncul pemberitahuan dengan pilihan “Urungkan”.',
  'help.guide.tour-stages-on-days.step.3':
    'Pilih “Etape mulai hari tersebut”: etape 1 masuk ke hari itu dan setiap etape berikutnya ke hari sesudahnya. “Seluruh tur di hari tersebut” justru menaruh seluruh rute di satu hari itu saja.',
  'help.guide.tour-stages-on-days.result':
    'Setiap etape ada di harinya masing-masing dalam perjalanan, dan etape yang kamu buka tampil di editor.',
  'help.ctx.trip-tour-hike.bullet.6':
    '“Ringkasan tur” di sebelah kanan menampilkan jarak, tanjakan, perkiraan waktu berjalan atau berlari, istirahat, dan total yang direncanakan, dengan profil ketinggian di bawahnya. “Simpan” di bagian bawah editor menyimpan tur.',
  'help.guide.tour-hike-plan.step.6': 'Klik “Simpan” di bagian bawah kolom kiri.',
  'help.guide.tour-hike-trail-details.step.1':
    'Buka pendakian dari “Tur dalam perjalanan ini”, lalu cari “Detail jalur” di bawah kartu “Titik jalan”. Aktifkan “Tampilkan di sepanjang rute”.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Isi kartu ini tidak mengubah apa pun pada tur, dan kartunya memerlukan koneksi. Pendakian hasil impor menampilkan kartu yang sama di tampilannya, tanpa batas rute.',
  'help.guide.tour-hike-round.result':
    'Pendakian mengikuti putaran yang kamu pilih dan kembali ke titik awalnya. “Putaran diambil” di bagian bawah peta punya “Urungkan”, dan “Simpan” untuk menyimpannya.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Lencana pada baris menunjukkan seberapa lebih panjang, lebih tinggi, atau lebih lama jalur itu dibanding jalur saat ini. Klik yang kamu mau.',
  'help.guide.tour-ferrata-add.step.1':
    'Saat pendakian terbuka, klik “Jalur via ferrata” di deretan tombol peta di kiri bawah. Lencananya menghitung via ferrata yang terlihat; perbesar peta jika diminta.',
  'help.guide.tour-ferrata-add.tip.3':
    'Ruas via ferrata disorot di profil ketinggian, jadi kamu bisa melihat di bagian mana dalam hari itu kamu mencapainya.',
  'help.guide.tour-run-plan.step.5': 'Beri nama rute lari itu di bawah “Nama tur”, lalu klik “Simpan”.',
  'help.guide.tour-run-ways.step.1':
    'Buka rute lari dari “Tur dalam perjalanan ini”, lalu aktifkan “Tampilkan di sepanjang rute” di “Detail jalur”, di bawah kartu “Titik jalan”.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Jenis tur “Jalan-jalan kota / wisata” mengubah tur menjadi jalan-jalan. Titik-titiknya adalah perhentian dengan Label, lama singgah, dan tingkat kepentingan. Jalan-jalan tidak punya batas pendakian dan tidak punya kolom “Istirahat”: lama singgah yang dipakai sebagai gantinya.',
  'help.guide.tour-walk-plan.step.2':
    'Tambahkan perhentiannya: pastikan “Tambah titik” aktif lalu klik peta di setiap perhentian, atau klik “Tempat perjalanan” untuk memakai tempat yang sudah ada di perjalanan.',
  'help.guide.tour-walk-plan.result':
    'Jalan-jalan mencantumkan perhentiannya beserta lama singgahnya, dan “Ringkasan tur” menjumlahkannya. Masukkan ke suatu hari untuk melihat kapan kamu tiba di setiap perhentian.',
  'help.guide.tour-walk-sights.tip.1': 'Tempat itu menjadi perhentian jalan-jalan, bukan tempat perjalanan.',
  'help.guide.tour-walk-day-times.step.3':
    'Buka lagi jalan-jalan itu di tab “Tur”. Di bagian atas “Titik jalan”, “Waktu untuk” menampilkan hari dan jam mulainya. Pada jalan-jalan yang direncanakan di beberapa hari, klik untuk memilih hari lain.',
  'help.guide.tour-walk-google-import.goal':
    'Tempel rute jalan kaki yang dibagikan dari Google Maps dan jadikan perhentiannya sebuah jalan-jalan.',
  'help.guide.tour-walk-google-import.result':
    'Jalan-jalan kota baru terbuka di editor dengan perhentian dari Google Maps, siap disimpan.',
  'help.guide.tour-walk-check-off.tip.2':
    'Baris jalan-jalan di rencana hari juga menampilkan hitungannya, misalnya 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Pada profil MTB, kartu yang sama menampilkan tingkat jalur (mtb:scale) jika pemeta sudah menambahkannya. Jalan tanpa tingkat berarti tidak diketahui, bukan mudah.',
  'help.guide.tour-bike-profile.step.6': 'Ketik nama di bawah “Nama tur”, lalu klik “Simpan” di bagian bawah rel kiri.',
  'help.guide.tour-bike-surfaces.goal':
    'Cari tahu berapa bagian rute yang beraspal, berkerikil, atau tidak diketahui, dan jenis jalan apa saja yang dilalui.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Kartu ini memakai rute sesuai rencana router dan tidak mengubah apa pun pada tur. Kartunya memerlukan koneksi; saat offline, kartu memberi tahu hal itu, dan rutenya tidak terpengaruh.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '“Tidak ada tingkat di data” berarti tidak diketahui, bukan mudah. Tingkat jalur juga tidak menunjukkan apakah jalur itu cocok untukmu.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Setiap titik yang kamu klik di peta disambungkan ke titik sebelumnya lewat lintasan, lift, dan jalur. Di bawah setiap titik, ruasnya tercantum sebagai chip, lintasan dengan warna tingkatnya, beserta durasinya dalam menit. Ruas yang tidak bisa direncanakan berubah merah, menyebutkan alasannya, dan menawarkan perbaikan atau “Gambar lurus”.',
  'help.guide.tour-ski-plan.step.4':
    'Pastikan “Tambah titik” aktif, lalu klik peta di titik awal dan di setiap tempat yang ingin kamu tuju, secara berurutan. Router lintasan ski menyambungkan setiap titik ke titik sebelumnya lewat lintasan, lift, dan jalur.',
  'help.guide.tour-ski-options.title': 'Atur router lintasan sesuai gaya skimu',
  'help.guide.tour-ski-options.tip.2':
    '“Naik lift” aktif secara default untuk “Alpen” dan “Papan seluncur salju”, dan mati untuk disiplin lainnya. “Kecualikan” dan “Turun dengan lift bila perlu” hanya tampil selama lift dipakai.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Kamu juga bisa menyeret titik di peta agar lebih dekat ke lintasan, jalur, atau lift. Ruasnya direncanakan ulang begitu kamu melepasnya.',
  'help.guide.tour-ski-summary.step.2':
    '“Bermain ski”, “Di lift”, “Menunggu”, dan “Jalan kaki” menunjukkan waktu masing-masing. “Lintasan”, “Turun di lintasan”, dan “Naik lift” menunjukkan panjang lintasan, ketinggian yang kamu turuni di sana, dan berapa kali kamu naik lift.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Lihat lintasan ski, jalur ski lintas alam, dan lift di sekitar tur skimu, beserta arti warnanya.',
  'help.guide.tour-ski-import.title': 'Impor jejak ski dan tentukan jenisnya',
  'help.guide.tour-ski-import.tip.1':
    'Jejak yang diimpor disimpan apa adanya sesuai rekaman: TREK tidak mencocokkannya dengan lintasan ski, dan kartunya menampilkan “Waktu ski” sebagai “Tidak dihitung”.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '“Tindakan lainnya” pada sebuah titik berisi alat-alat dayung: rencanakan ruas berikutnya di air atau gambar dengan tangan, “Angkut perahu dari sini”, dan “Pintu air di titik ini”.',
  'help.guide.tour-paddle-setup.step.3':
    'Di bawah “Perahu”, pilih Kayak, “Kano”, SUP, atau “Lainnya”. Jenis perahu menentukan kecepatan yang disarankan TREK.',
  'help.guide.tour-paddle-setup.tip.4':
    '“Mendayung punya risiko”, baris di bagian bawah kolom, membuka “Keselamatan di air”. Baca sekali sebelum tur pertamamu.',
  'help.guide.tour-paddle-water-route.step.5':
    'Untuk merencanakan semua ruas yang digambar dengan tangan sekaligus, klik “Rencanakan di air bagian yang digambar tangan”, ikon ombak di header “Titik jalan”.',
  'help.guide.tour-paddle-portage.step.1':
    'Arahkan kursor ke perhentian tempat kamu naik ke darat, lalu klik “Tindakan lainnya”, ikon tiga titik.',
  'help.guide.tour-paddle-portage.result':
    'Ruas itu menjadi angkut perahu di peta dan di titik jalan, dan “Perkiraan waktu” menghitungnya sebagai waktu mengangkut.',
  'help.guide.tour-paddle-lock.tip.2':
    'Jika ada angkut perahu yang memutari pintu air, pintu air itu tampil redup dan ditandai “Diangkut memutar”. Waktu angkut perahu yang dihitung, dan menit pintu air tidak ikut dihitung.',
  'help.guide.tour-paddle-time.step.4':
    'Jika tur punya angkut perahu, baris “Mengangkut” menghitung waktunya. Klik kecepatannya dan ketik seberapa cepat kamu mengangkut perahu. “Keluar dan masuk kembali” menambahkan menit di setiap angkut perahu.',
  'help.guide.tour-paddle-wind.step.1':
    'Masukkan tur dayung ke salah satu hari perjalanan. Kartu “Angin” di kolom kiri lalu menampilkan prakiraan hari itu di titik awal tur.',
  'help.guide.tour-paddle-wind.result': 'Kamu tahu kondisi angin hari itu di titik awalmu, jam demi jam.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Untuk setiap rintangan, pilih apa yang akan kamu lakukan: “Dayung melewatinya”, “Angkut memutar”, “Lewat jalur lain”, atau “Tidak terdampak”. “Berikutnya” membawamu ke entri berikutnya yang belum diisi.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Di tab “Tur”, klik “Tambah tur” di kolom kanan, pilih “Impor GPX atau KML”, lalu pilih filenya.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '“Buang” menghapus tanda yang belum kamu simpan. Jejak rekamannya sendiri tidak pernah digambar ulang.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK tidak menghitung waktu berkuda. Isi waktu di bawah “Direncanakan” di “Detail” jika kamu ingin waktunya tampil di hari itu.',
  'help.guide.tour-horse-plan.step.5':
    'Pilih bagian di bawah “Bagian”. Periksa “Arah” yang kamu lalui dan keterangan “Akses berkuda” di sepanjangnya.',
  'help.guide.tour-horse-plan.tip.5':
    'Tur berkuda tidak dirutekan sama sekali: klik pada garis yang digambar tidak menambahkan titik bentuk, dan titik di ujung setiap bagian tetap di posisi yang ditentukan rute.',
  'help.guide.tour-horse-gap.tip.1':
    'Bagian manual tidak diperiksa oleh router maupun rute berkuda mana pun. Lihat peta untuk mengetahui di mana jalurnya sebenarnya.',
  'help.guide.tour-horse-recorded.step.4':
    'Tur berkuda terbuka di kolom kiri. Kartu “Tur berkuda terekam” menampilkan “Sesuai rekaman”, “Tanpa waktu berkuda”, dan “Akses belum diperiksa”. Arahkan kursor ke lencana untuk membaca alasannya.',
  'help.guide.dateless-trip.step.2':
    'Biarkan “Tanggal Mulai” dan “Tanggal Selesai” kosong. Kolom “Jumlah Hari” akan muncul di bawahnya: isi berapa hari yang ingin kamu rencanakan.',
  'help.guide.trip-reminder.tip.1':
    'Hanya pemilik perjalanan (atau administrator) yang bisa melihat bagian “Pengingat”. Jika tampil redup, administrator harus mengaktifkan pengingat perjalanan dulu di Admin, “Notifikasi”.',
  'help.guide.upcoming-reservations.step.2': 'Klik pemesanan untuk membuka perjalanan tempat pemesanan itu berada.',
  'help.guide.timezones-widget.tip.1':
    'Daftarnya memakai nama zona waktu resmi, seperti Europe/Lisbon atau America/New_York, jadi cari nama kota yang ada di nama zona itu.',
  'help.guide.half-company-holiday.step.2': 'Aktifkan “Setengah hari” di toolbar yang sama.',
  'help.guide.edit-holiday-calendar.tip.1': 'Setiap perubahan langsung tersimpan. Tidak ada tombol “Simpan”.',
  'help.guide.person-color.tip.1': 'Warna yang sama menandai orang itu di toolbar dan di kartu “Jatah Cuti”.',
  'help.guide.answer-fusion-request.step.2':
    'Baca dulu arti penggabungan: satu kalender bersama, entri yang bisa saling kalian edit, dan pengaturan hari libur bersama.',
  'help.guide.log-for-partner.step.2':
    'Lihat toolbar: tombol pertamanya sekarang menampilkan nama dan warna orang itu.',
  'help.guide.dissolve-fusion.step.2': 'Di bawah “Pisahkan Gabungan” di bagian bawah, klik “Pisahkan”.',
  'help.guide.country-places.step.3':
    'Dialog mencantumkan semua tempat yang dihitung untuk negara itu, dikelompokkan per perjalanan; jika lebih dari enam, “Cari tempat” di bagian atas bisa menyaring daftarnya. Klik tempat atau judul perjalanan untuk membuka perjalanan itu di perencana.',
  'help.guide.tour-activity-stats.step.5':
    'Klik “Tampilkan tur”. “Tur yang sudah kulakukan” terbuka dengan totalnya, rincian “Menurut jenis”, dan semua tur dalam periode itu beserta hari, perjalanan, jarak, dan tanjakannya. Pil di header-nya juga bisa mengubah periode dan jenis di sini.',
  'help.guide.move-to-list.step.3':
    'Pilih daftar tujuannya. Jika ada lebih dari tiga daftar, kotak pencarian di bagian atas bisa menyaringnya.',
  'help.guide.accept-list-invite.goal': 'Bergabunglah ke daftar yang dibagikan kepadamu, atau tolak undangannya.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Ubah “Nama di perjalanan” jika perlu, lalu klik “Tambahkan ke perjalanan”.',
  'help.guide.tour-collection-manage.step.2':
    'Ketik di “Cari tempat”. Pencarian ini menyaring tur berdasarkan nama, sekaligus tempat-tempatnya.',
  'help.guide.create-journey.tip.3':
    'Jika sebuah perjalanan baru saja selesai, “Buat Journey” di banner “Perjalanan baru saja selesai” di bagian atas akan memulai journey dengan perjalanan itu sudah terpilih.',
  'help.guide.entry-draft.step.2': 'Klik “Simpan”. Kartunya sekarang menampilkan lencana “Draf”.',
  'help.guide.gallery-map.step.3':
    'Kembali di “Linimasa”, peta di sebelah kanan mengikuti guliranmu: entri yang sedang terlihat diberi lingkaran dengan warna harinya. Klik pin untuk menggulir linimasa ke entri tersebut.',
  'help.guide.journey-map-layers.tip.1':
    'Garis berwarna putus-putus adalah rute GPX perjalanan, bagian dari rencana; garis utuh adalah rute yang direkam pada hari itu.',
  'help.guide.journey-keep-route.tip.1':
    'Di titik rekaman berhenti, garisnya juga berhenti. TREK hanya menggambar apa yang terekam.',
  'help.guide.journey-day-stays.tip.1':
    'Baris ini hanya muncul bagi orang yang boleh mengedit jurnal dan sudah menghubungkan Dawarich miliknya sendiri, dan hanya pada hari yang masih ada yang perlu diputuskan.',
  'help.guide.journey-take-over-day.step.4':
    'Biarkan “Simpan juga rute hari ini” aktif agar rutenya ikut disimpan, lalu klik tombol “Ambil”. Tombol itu menunjukkan berapa draf yang akan dibuat.',
  'help.guide.journey-auto-prepare.step.3':
    'Keterangan di bawahnya menunjukkan kapan persinggahanmu terakhir diambil, atau kenapa gagal. Klik “Ambil sekarang” untuk langsung meminta data ke Dawarich.',
  'help.guide.photo-location.tip.1': 'Tempat yang kamu tentukan sendiri tidak akan pernah dipindahkan.',
  'help.ctx.settings-plugins.bullet.1':
    '“Pengaturan plugin”: di bawahnya ada satu kartu untuk setiap plugin yang memerlukan isian darimu, dengan kolom-kolomnya dan tombol “Simpan”. Kolom rahasia tidak akan ditampilkan lagi setelah disimpan.',
  'help.guide.dashboard-widgets.step.3':
    '“Kembalikan ke default”, di bawah kartu, mengembalikan seluruh tab “Tampilan” ke pengaturan awalnya.',
  'help.guide.web-push-device.result':
    'Kartu menampilkan “Aktif untuk perangkat ini”, dan peristiwa yang diaktifkan di kolom Push tetap sampai meskipun TREK sedang ditutup.',
  'help.guide.connect-airtrail.step.1':
    'Di bawah “Integrasi”, cari AirTrail, lalu isi “URL Instans” dan kunci API-nya. Kunci itu kamu buat di AirTrail, di Settings, Security.',
  'help.guide.connect-dawarich.step.1':
    'Di bawah “Integrasi”, cari Dawarich, lalu isi “Alamat instans” dan kunci API dari Dawarich, yang ada di Account, API key.',
  'help.guide.tour-connect-wanderer.step.1':
    'Di bawah “Integrasi”, cari wanderer, lalu isi “URL Instans” dan token API-nya. Token itu kamu buat di wanderer, di Settings, Account, API tokens; awalannya wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'Biarkan TREK memantau perubahan pada jalur yang kamu impor di latar belakang.',
  'help.guide.mcp-oauth.tip.3': '“Token API” masih berfungsi tapi ditandai “Usang”; beralihlah ke klien OAuth.',
  'help.guide.offline-conflicts.tip.2': 'Pilihan ini hanya berlaku untuk perangkat ini.',
  'help.guide.default-user-settings.tip.1':
    'Pilihan pengguna sendiri di “Pengaturan” selalu diutamakan; default ini berlaku bagi semua orang yang belum mengubah pengaturan tersebut.',
  'help.guide.own-routing-engine.step.1':
    'Di bagian “Peta” pada “Pengaturan Default Pengguna”, isi alamat server OSRM-mu di bawah “Mesin rute sendiri”.',
  'help.guide.admin-passkeys.tip.2':
    'Jika nanti kamu mengganti domain, semua passkey yang sudah ditambahkan orang tidak akan berfungsi lagi.',
  'help.guide.instance-keys.tip.4': 'Kunci Amap harus berupa kunci Web 服务 (layanan web), bukan kunci JS API.',
  'help.guide.rotate-jwt-secret.step.2': 'Baca peringatannya, lalu klik “Putar & Keluar”.',
  'help.guide.notification-defaults.tip.2': 'Default hanya berlaku bagi orang yang belum mengubah sel itu sendiri.',
  'help.ctx.notifications.bullet.5':
    'Di “Pengaturan”, bagian “Notifikasi”, kamu menentukan peristiwa mana yang kamu terima di sini dan mana yang dikirim lewat email, webhook, ntfy, atau push.',
  'help.guide.read-notifications.result':
    'Kamu sampai di layar yang dimaksud notifikasi itu, dan angka di ikon lonceng berkurang satu.',
  'help.guide.mark-notifications-read.title': 'Menandai notifikasi sudah dibaca',
  'help.guide.delete-notifications.goal':
    'Jaga daftarnya tetap ringkas dengan menghapus yang tidak kamu perlukan lagi.',
  'help.guide.notification-settings.step.1': 'Klik namamu di kanan atas.',
  'help.guide.public-link.step.5':
    'Kamu bisa mengubah pilihannya selama tautan masih ada. “Hapus tautan” menonaktifkan tautan itu.',
  'help.guide.link-journal.step.3':
    'Untuk setiap orang dalam perjalanan, pilih “Tanpa akses”, “Baca”, atau “Edit”. “Semua bisa membaca” dan “Tidak ada” mengatur semuanya sekaligus.',
  'help.guide.collapse-columns.tip.3':
    'Saat pembatas sedang difokuskan, kamu juga bisa menggesernya dengan tombol panah.',
  'help.guide.edit-place.tip.3':
    'Jika kamu mengklik di luar dialog, perubahanmu tidak hilang: TREK akan bertanya “Buang perubahan?” dulu, dan “Lanjut mengedit” membawamu kembali ke formulir.',
  'help.guide.dawarich-stays.goal':
    'Tambahkan tempat-tempat persinggahanmu yang terekam Dawarich selama perjalanan, setelah kamu memeriksanya satu per satu.',
  'help.guide.leave-stop-off-route.step.1':
    'Klik kanan perhentian, atau klik ikon tiga titiknya, lalu pilih “Keluarkan dari rute”.',
  'help.guide.move-booking-day.step.3':
    'Barisnya sekarang muncul di hari baru, pada jamnya sendiri. Buka pemesanannya jika jamnya juga perlu diubah.',
  'help.guide.place-image-from-file.goal':
    'Pakai foto yang sudah ada di file tempat itu sebagai gambarnya, tanpa perlu mengunggahnya lagi.',
  'help.guide.place-image-from-file.tip.3':
    'Hanya peserta perjalanan yang boleh mengubah tempat yang bisa mengganti gambarnya.',
  'help.guide.place-own-hours.result':
    'Kartu menampilkan nomor telepon, email, dan jam buka yang kamu isi, dan lingkaran di sekeliling gambar berwarna hijau atau merah sesuai jam tersebut.',
  'help.guide.confirm-stay-booking.step.4':
    'Tutup pemesanan dengan X di kanan atasnya. Di bawah “Reservasi”, kartu penginapan sekarang menampilkan “Dikonfirmasi”.',
  'help.guide.tour-map-lines.title': 'Menemukan turmu di peta',
  'help.guide.tour-map-lines.tip.2':
    'Menyembunyikan tur hanya berlaku untukmu dan disimpan di browser ini untuk perjalanan ini: tur, harinya, dan warnanya tetap sama bagi semua orang. “Tampilkan semua”, di atas daftar “Tur”, menampilkan lagi semua tur yang disembunyikan, dan peta di ponsel selalu menampilkan semua tur.',
  'help.guide.car-stops.step.4':
    'Di bawah “Perhentian di sepanjang jalan”, klik “Tambah persinggahan” untuk setiap tempat yang dilewati perjalanan lalu pilih tempatnya, dengan jam di sampingnya jika perlu. Persinggahan yang tempatnya belum dipilih akan dihapus saat kamu menyimpan.',
  'help.guide.transport-details.step.2':
    'Pil di header menampilkan status, jenis, hari, dan “Kode Pemesanan”. Klik pil status untuk beralih antara “Menunggu” dan “Dikonfirmasi”. Ikon salin kecil di pil kode, “Salin kode pemesanan”, menyalin kodenya ke clipboard.',
  'help.guide.group-sort-bookings.step.3':
    'Di bawah “Urutkan”, pilih “Tanggal”, “Judul”, “Jenis”, atau Status. Baris di bawahnya membalik urutannya: “Paling awal dulu” atau “Paling akhir dulu” untuk tanggal, “A ke Z” atau “Z ke A” untuk yang lain.',
  'help.guide.booking-on-map.title': 'Menemukan pemesanan di peta',
  'help.guide.export-bookings-csv.tip.1':
    'Kolomnya adalah “Jenis”, “Judul”, Status, “Mulai”, “Selesai”, “Dari”, “Ke”, “Lokasi”, “Konfirmasi”, dan “Catatan”.',
  'help.guide.arrange-packing-list.tip.1':
    'Selama “A ke Z” aktif, item tidak bisa diseret, tapi seluruh daftar masih bisa.',
  'help.guide.count-packed-pieces.step.3':
    'Selama baru sebagian barang yang dikemas, penghitung tampil dengan warna aksenmu dan kotak centang diberi garis tepi berwarna sama. Klik minus untuk mengurangi satu barang dari hitungan.',
  'help.guide.expense-receipts.step.5':
    'Pratinjau menampilkan kuitansinya, dengan “Buka di tab baru” dan “Unduh” di bagian atas. Jika ada beberapa kuitansi, tombol panah untuk berpindah di antaranya, dan Esc menutup pratinjau.',
  'help.guide.files-sync-settings.step.3': 'Klik “Pengaturan” di bawah bar alur untuk menampilkan opsi lainnya.',
  'help.guide.manage-notes.step.3':
    '“Sematkan”, di menu yang sama, membuat catatan tetap di bagian atas panel, dengan bingkai berwarna kategorinya dan ikon pin di samping judul. “Lepas sematan” di menu yang sama mengembalikan catatan ke posisi biasanya.',
  'help.guide.note-categories.step.1':
    'Klik ikon roda gigi di samping “Catatan Baru” di header kartu “Catatan”. “Kelola Kategori” terbuka, dengan satu baris untuk setiap kategori: warnanya, namanya, enam titik warna, dan ikon tempat sampah.',
  'help.guide.note-categories.tip.2':
    'Kategori yang belum punya catatan hanya disimpan di browsermu. Anggota lain baru melihatnya setelah ada catatan yang dimasukkan ke kategori itu.',
  'help.guide.roadtrip-reorder.goal':
    'Ubah urutan perjalanan darat, atau pindahkan perhentian ke hari lain, langsung di rel.',
  'help.guide.roadtrip-overnight.step.4':
    '“Cari penginapan”, di sampingnya, menampilkan nama untuk disalin dan tautan ke situs pemesanan: trivago atau CHECK24 untuk hotel, PiNCAMP atau Pitchup untuk tempat berkemah. Periksa tempat, tanggal, dan jumlah tamunya di situs tersebut.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Di bawah “Isi sampai”, pilih 50 sampai 100. Keterangan di bawah tombol menunjukkan seberapa jauh kamu bisa berkendara dari sini dengan isi itu.',
  'help.guide.roadtrip-bookings.step.2':
    'Di rel, perjalanan itu tampil sebagai kartu berwarna sesuai jenisnya, dengan jadwal di kolom kedatangan serta titik awal dan akhirnya di bawah judul.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK menghitung rutenya sendiri di antara perhentian; jalur dari Google tidak disalin.',
  'help.guide.roadtrip-hazards.result':
    'Peta menampilkan peringatan terkini di sekitar perjalananmu, dan rutenya tidak berubah.',
  'help.ctx.trip-tours.bullet.3':
    'Setiap baris: bilah berwarna adalah garis tur di peta, kotak bulat menampilkan batas rute (T1 sampai T6) atau jenisnya, lencana kecil GPX atau wanderer menandai hasil impor, dan lencana lainnya menunjukkan hari, waktu, jarak, dan tanjakan. Ikon bulan dengan angka menunjukkan jumlah etape tur beberapa hari.',
  'help.guide.tour-show-list.step.3': 'Klik sebuah baris. Kartu tur terbuka di atas peta.',
  'help.guide.tour-add-to-day.goal':
    'Tentukan kapan kamu menjalani tur, agar tur itu muncul di harinya dengan garisnya di peta.',
  'help.guide.tour-add-to-day.tip.3':
    'Satu tur hanya bisa dimasukkan sekali ke hari yang sama. Jika kamu menjatuhkannya ke hari yang sudah berisi tur itu, TREK hanya menampilkan “Tur ini sudah ada di hari tersebut.”',
  'help.guide.tour-day-times.step.4':
    'Jika tur berakhir setelah agenda berikutnya di hari itu dimulai, keterangan di bawah baris memberitahumu, misalnya Berakhir pukul 13:30, setelah Makan siang di Gostner Schwaige dimulai pukul 12:30. Tidak ada yang dipindahkan.',
  'help.guide.tour-remove-from-day.step.1':
    'Di kolom hari, arahkan kursor ke baris tur, klik “Opsi lainnya”, lalu pilih “Hapus dari hari”.',
  'help.guide.tour-filter-list.step.1':
    'Klik tombol filter di bawah “Impor GPX atau KML”. Tombol itu menampilkan status yang dipakai untuk menyaring, awalnya “Semua”, dengan jumlah tur di sampingnya.',
  'help.guide.tour-hide-on-map.title': 'Menyembunyikan garis tur di peta',
  'help.guide.tour-import-plan-tab.title': 'Mengimpor jejak dari tab Rencana',
  'help.ctx.trip-tour-detail.title': 'Detail tur',
  'help.guide.tour-detail-read.goal':
    'Lihat semua informasi perjalanan tentang sebuah tur: hari, jarak dan ketinggian, profil, serta sumbernya.',
  'help.guide.tour-detail-read.tip.1':
    'Pil kuning bertuliskan gunakan dengan hati-hati berarti data ketinggian atau ukuran hasil impornya tidak lengkap. Ingat hal ini saat membaca tanjakan dan profilnya.',
  'help.guide.tour-rename-colour.step.1':
    'Buka kartu tur, lalu klik ikon pensil di samping namanya. Nama itu berubah menjadi kolom isian.',
  'help.guide.tour-take-along.goal':
    'Dapatkan petunjuk arah ke titik awal tur, buka halamannya di web, atau unduh rutenya sebagai file GPX.',
  'help.guide.tour-take-along.result':
    'Kamu punya rute ke titik awal di aplikasi petamu dan seluruh rute tur sebagai file GPX.',
  'help.guide.tour-copy-keep.tip.2':
    '“Simpan ke Koleksi” di menu tur pada rencana hari membuka dialog yang sama, jadi rutenya juga ikut tersimpan di sana.',
  'help.guide.tour-packing-link.step.3': 'Klik “Tautkan”.',
  'help.guide.tour-files.goal': 'Tambahkan pemesanan, peta, atau deskripsi rute ke tur, lalu buka lagi dari kartu tur.',
  'help.guide.tour-activity-link.goal':
    'Tautkan jejak GPX hasil rekaman ke tur yang direncanakan tanpa mengubah rencananya.',
  'help.guide.tour-activity-link.tip.3':
    '“Waktu tempuh” dihitung dari cap waktu pertama sampai terakhir di jejak, termasuk istirahat.',
  'help.guide.tour-activity-compare.tip.1':
    '“Bandingkan di peta” hanya tersedia saat kartu tampil di samping peta, tidak di ponsel.',
  'help.guide.tour-origin-check.tip.1':
    'Tur yang diambil dari perjalanan lain menyebutkan perjalanan dan tur asalnya di bawah “Diambil dari”.',
  'help.ctx.trip-tour-planner.bullet.3':
    '“Tur dalam perjalanan ini”, rel kanan, mencantumkan semua tur dengan filter dan “Total perjalanan” di atas daftarnya. Saat sebuah tur terbuka, “Ringkasan tur” di bagian atas menampilkan jarak, tanjakan, waktu, dan profil ketinggiannya. Tanda plus di atas, “Tambah tur”, untuk merencanakan, mengimpor, atau mengambil tur.',
  'help.guide.tour-open-workspace.step.3':
    'Rel kanan, “Tur dalam perjalanan ini”, mencantumkan semua tur perjalanan, dengan filter dan “Total perjalanan” di atas daftarnya.',
  'help.guide.tour-open-workspace.result':
    'Tab “Tur”: editor di kiri, tur-tur perjalanan di kanan, dan peta di antaranya.',
  'help.guide.tour-draw-route.step.6':
    'Di bawah “Titik jalan”, setiap titik mendapat baris bernomor, yang diberi nama tempat begitu namanya selesai dimuat. Selama TREK bekerja, titik kecil di samping “Tur baru” menunjukkan statusnya.',
  'help.guide.tour-type-profile.step.1':
    'Klik “Jenis tur” di bawah “Nama tur”. Di sana tampil jenis saat ini beserta keterangan singkat tentang cara perencanaannya.',
  'help.guide.tour-edit-points.goal': 'Ubah arah tur dengan memindahkan titik-titiknya di peta atau di daftar.',
  'help.guide.tour-edit-points.tip.2':
    'Baris menampilkan koordinat sampai nama tempatnya selesai dimuat. “Urungkan” dan Ulangi tidak punya pintasan keyboard.',
  'help.guide.tour-shaping-points.tip.1': 'Titik awal dan akhir selalu berupa perhentian.',
  'help.guide.tour-loop-reverse.step.3':
    'Klik “Balik arah” di sampingnya untuk menempuh seluruh tur ke arah sebaliknya.',
  'help.guide.tour-leg-by-hand.step.2':
    'Ruas itu menjadi garis lurus putus-putus, dan di bawah barisnya, daftar menampilkan “Digambar tangan, tidak dirutekan” beserta panjangnya.',
  'help.guide.tour-trip-places.step.1':
    'Klik “Tempat perjalanan” di samping “Tambah titik” di bawah “Titik jalan”. Tempat-tempat perjalanan muncul di bawahnya.',
  'help.guide.tour-details-times.title': 'Beri nama tur dan rencanakan waktunya',
  'help.guide.tour-details-times.tip.3':
    'Klik panah di samping “Detail” untuk melipatnya. Bagian ini terbuka otomatis jika salah satu kolomnya berisi nilai yang tidak diterima “Simpan”.',
  'help.guide.tour-save.tip.1':
    '“Buang” di samping “Simpan” membuang perubahan yang belum disimpan setelah konfirmasi. Tur yang sudah tersimpan tidak berubah.',
  'help.guide.tour-edit-saved.step.3':
    'Klik “Simpan”. Muncul “Tur disimpan”, dan tur tetap mempertahankan hari, file, dan catatannya.',
  'help.guide.tour-summary-profile.step.1':
    '“Ringkasan tur” di bagian atas “Tur dalam perjalanan ini” menampilkan “Jarak”, “Total kenaikan elevasi”, dan “Total penurunan elevasi” tur yang ada di editor, perkiraan waktunya, istirahat, dan total yang direncanakan.',
  'help.guide.tour-list-manage.title': 'Mengelola tur dalam perjalanan',
  'help.guide.tour-list-manage.tip.2':
    'Hari yang sudah berisi tur itu tampil redup di menu hari. Untuk tur beberapa hari, TREK bertanya apakah etapenya dimulai di hari itu atau seluruh tur masuk ke hari itu.',
  'help.guide.tour-delete.tip.2':
    'Kalau hanya ingin mengeluarkannya dari satu hari, pakai “Hapus dari hari” di menu hari.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Pilih “Simpan sebagai tur baru” untuk menyimpan keduanya, “Muat yang terbaru” untuk memuat versi lain itu, atau “Timpa” untuk mengganti versi lain itu dengan versimu.',
  'help.ctx.trip-tour-import.bullet.3':
    'Hasil impor terbuka sebagai “Tur GPX” atau “Tur wanderer”: garisnya, “Ringkasan tur”, dan profil ketinggiannya, persis seperti saat diimpor. Barisnya di daftar diberi lencana “Impor GPX”.',
  'help.guide.tour-import-gpx.step.4':
    'Di bawah “Impor sebagai”, tentukan jejak itu apa. “Pendakian” sudah dipilih sejak awal. “Tur sepeda” atau “Lari” meminta profilnya, “Tur dayung” meminta perahu dan perairannya, dan “Ski & musim dingin” meminta disiplinnya.',
  'help.guide.tour-view-import.title': 'Melihat jejak hasil impor',
  'help.guide.tour-view-import.result':
    'Kamu melihat jejak rekaman persis seperti saat diimpor, tanpa ada yang dihitung ulang.',
  'help.guide.tour-plan-from-import.tip.2':
    'Jika kartu menyebutkan bahwa saran rutenya jauh dari jejak di bagian-bagian yang panjang, periksa bagian itu di peta sebelum merencanakan dengannya.',
  'help.guide.tour-restore-recorded.step.3':
    'Konfirmasi dengan “Pulihkan jejak yang direkam”. Titik jalan dan garis rute dihapus, sedangkan hari dan catatan tetap ada.',
  'help.guide.tour-take-over.step.3':
    'Cari turnya: ketik di “Cari berdasarkan nama”, atau saring daftarnya dengan filter “Perjalanan” dan “Jenis”.',
  'help.guide.tour-import-wanderer.title': 'Mengimpor jalur dari wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Jalur yang sudah ada di perjalanan ditandai “Dalam perjalanan ini” dan menawarkan “Buka tur”. Jalur yang berubah sejak diimpor menawarkan “Impor sebagai versi baru” di samping versi lamanya.',
  'help.ctx.trip-tour-map.bullet.4':
    '“Di sepanjang tur”, sebuah kartu di panel kiri, mencari titik pandang, sumber air, pondok, tempat makan, dan lainnya di dekat rute, lalu mencantumkan hasilnya. Tempat dari daftar itu bisa kamu tambahkan ke tur sebagai perhentian.',
  'help.guide.tour-map-layers.tip.1':
    'Peta yang kamu pilih tetap dipakai untuk setiap tur yang kamu buka sampai halaman dimuat ulang. Tur yang jenisnya tidak menyediakan peta itu terbuka di “Peta”, dan peta di tab “Rencana” serta pengaturan di “Pengaturan” tidak berubah.',
  'help.guide.tour-along-search.step.4': 'Klik “Cari di sepanjang tur”. TREK hanya mencari: turnya tidak berubah.',
  'help.guide.tour-along-add-stop.step.1':
    'Klik tempat di daftar “Di sepanjang tur”, atau pin-nya di peta. Kartunya terbuka di atas peta: apa tempat itu, seberapa jauh dari rute, dan di bagian mana sepanjang tur.',
  'help.guide.tour-3d-terrain.title': 'Melihat tur dalam 3D',
  'help.guide.tour-3d-terrain.tip.1':
    '“Ikhtisar” di baris yang sama menampilkan lagi seluruh rute setelah kamu menggeser tampilan.',
  'help.guide.tour-3d-flyover.step.4': 'Klik “Ikhtisar” untuk menampilkan lagi seluruh tur.',
  'help.guide.tour-map-overlays.step.2':
    'Klik “Keterangan lintasan”, kotak kecil berisi titik-titik berwarna di samping sakelar.',
  'help.ctx.trip-tour-stages.summary':
    'Tur beberapa hari adalah satu rute yang dibagi menjadi beberapa etape, satu untuk setiap hari perjalanan. Di sini kamu menentukan di mana setiap hari berakhir, melihat ukuran setiap etape, dan memasukkan etape ke hari-hari perjalanan.',
  'help.guide.tour-multi-day.step.1': 'Di “Tur dalam perjalanan ini”, klik tur untuk membukanya di editor.',
  'help.guide.tour-multi-day.tip.3':
    'Waktu etape tidak termasuk istirahat. Waktu yang tampil dengan warna peringatan, “Lebih dari sehari bergerak”, lebih lama dari satu hari.',
  'help.guide.tour-stages-on-days.step.4':
    'Klik tombol berikon bulan dengan jumlah etape, “Tampilkan etape”, untuk menampilkannya.',
  'help.ctx.trip-tour-hike.title': 'Pendakian dan lari',
  'help.guide.tour-hike-plan.title': 'Rencanakan pendakian sesuai tingkat kesulitan pilihanmu',
  'help.guide.tour-hike-plan.result':
    'Pendakian tercantum di bawah “Tur dalam perjalanan ini” dengan jarak, tanjakan, dan waktu jalannya, siap dimasukkan ke suatu hari.',
  'help.guide.tour-hike-trail-details.step.2':
    'Pilih apa yang ingin ditampilkan: SAC untuk tingkat pendakian, “Permukaan”, atau “Jenis jalan”. Rute di peta memakai warna yang sama dengan daftarnya.',
  'help.guide.tour-hike-round.title': 'Mencari pendakian melingkar dengan panjang tertentu',
  'help.guide.tour-hike-round.tip.1':
    'Putaran selalu berada dalam “Tingkat kesulitan jalur maksimum” pendakian itu; pil T di kartu menunjukkan tingkatnya.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Klik “Pakai jalan ini”. TREK memeriksa lewat router bahwa rutenya benar-benar mengikuti jalan itu.',
  'help.guide.tour-ferrata-add.step.2':
    'Klik via ferrata di peta, pada garis putus-putusnya atau tandanya. Kartunya menampilkan nama, tingkat kesulitan, dan panjangnya.',
  'help.guide.tour-ferrata-add.tip.4':
    '“Lihat di OpenStreetMap” pada kartu membuka data asli via ferrata itu. Lencananya berubah kuning jika tidak ada yang bisa dimuat, dengan alasannya di tooltip.',
  'help.guide.tour-run-plan.result':
    'Rute lari tercantum di bawah “Tur dalam perjalanan ini” dengan “Waktu lari (rencana)”, dan profil serta kecepatannya ikut tersimpan.',
  'help.guide.tour-run-ways.step.2':
    'Bagian atas kartu sekarang menunjukkan berapa bagian rute lari yang tidak beraspal dan jalur bertingkat tersulit yang dilaluinya.',
  'help.ctx.trip-tour-walk.bullet.2':
    '“Titik jalan” mencantumkan perhentian secara berurutan. Lingkaran di sekeliling nomor perhentian menandainya “Wajib dikunjungi” (utuh) atau “Opsional” (putus-putus), perisai kecil menandainya “Dilindungi”, dan pil di bawah namanya menunjukkan lama singgahnya.',
  'help.guide.tour-walk-plan.step.3':
    'Arahkan kursor ke perhentian di “Titik jalan”, klik “Tindakan lainnya” di sampingnya, lalu pilih “Edit titik singgah”.',
  'help.guide.tour-walk-sights.title': 'Menambahkan objek wisata di sepanjang jalan-jalan kota',
  'help.guide.tour-walk-sights.tip.2':
    'Setelah kamu mengubah rute, tombolnya bertuliskan “Cari lagi”, karena tempat yang ditemukan masih untuk rute lama.',
  'help.guide.tour-walk-day-times.step.4':
    'Di bawah setiap perhentian terlihat kapan kamu tiba dan berapa lama kamu singgah. Peringatan muncul jika tempat itu tutup pada jam tersebut atau tutup selama kamu singgah.',
  'help.guide.tour-walk-google-import.step.1':
    'Di “Tur dalam perjalanan ini”, klik “Tambah tur” (tanda + di bagian atas), lalu pilih “Impor rute jalan kaki dari Google Maps”.',
  'help.guide.tour-walk-check-off.title': 'Mencentang perhentian jalan-jalan pada harinya',
  'help.guide.tour-walk-check-off.tip.3':
    'Jika kamu memasukkan jalan-jalan ke suatu hari saat offline, kamu bisa mencentangnya setelah tersinkron.',
  'help.guide.tour-bike-profile.title': 'Rencanakan tur sepeda sesuai gaya bersepedamu',
  'help.guide.tour-bike-profile.result':
    'Tur sepeda tersimpan dan tercantum di bawah “Tur dalam perjalanan ini”, dirutekan sesuai profilnya, dengan waktu bersepedanya di “Ringkasan tur”.',
  'help.guide.tour-bike-surfaces.step.1':
    'Di “Tur dalam perjalanan ini” di sebelah kanan, klik tur sepeda untuk membukanya. Setelah rutenya dihitung, kartu “Permukaan dan jalan” muncul di bawah “Titik jalan”.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Klik judul kartu untuk melipatnya. Kartu tetap terlipat di browser ini meskipun halaman dimuat ulang.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Jika pemeta sudah menilai tanjakannya, “Tingkat tanjakan (mtb:scale:uphill)” menyusul di bawahnya dengan barisnya sendiri.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Kartu “Rute lintasan” di bawah titik jalan membagi hari menjadi “Bermain ski”, “Di lift”, “Menunggu”, dan “Jalan kaki”, dengan panjang lintasan, ketinggian yang kamu turuni di sana, dan jumlah naik lift. “Waktu ski” di “Ringkasan tur” di sebelah kanan menjumlahkannya begitu semua ruas selesai direncanakan.',
  'help.guide.tour-ski-plan.step.5':
    'Di bawah setiap titik, ruasnya tercantum sebagai chip: setiap lintasan, lift, dan bagian jalan kaki menurut nama atau jenisnya, lintasan dengan titik berwarna sesuai tingkatnya, beserta durasi masing-masing dalam menit.',
  'help.guide.tour-ski-options.goal':
    'Atur lintasan tersulit, apa yang diutamakan, kecepatanmu, dan lift mana yang dipakai, agar ruas-ruasnya sesuai denganmu.',
  'help.guide.tour-ski-options.tip.3':
    '“Hindari sambungan yang hanya ditebak” menjauhkan rute dari sambungan yang hanya diperkirakan oleh data peta, misalnya bagian yang belum dipetakan di antara dua lintasan.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Selama data lintasan untuk suatu area masih diunduh, perencana menunggu lalu mencoba lagi secara otomatis.',
  'help.guide.tour-ski-summary.step.3':
    'Di “Ringkasan tur” di sebelah kanan, “Waktu ski” menjumlahkan semuanya. Titik info di sampingnya menjelaskan cara menghitungnya.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Selama tur “Ski & musim dingin” terbuka, peta otomatis menampilkan lintasan ski. Sakelar gunung bersalju di deretan kiri bawah peta untuk mematikan dan menyalakannya; tooltip-nya bertuliskan “Lintasan ski, jalur ski lintas alam, dan lift”.',
  'help.guide.tour-ski-import.goal':
    'Impor jejak rekaman ski, ski lintas alam, atau sepatu salju, lalu beri disiplin yang tepat.',
  'help.guide.tour-ski-import.tip.2':
    'Untuk mengeditnya seperti tur yang direncanakan, pakai “Rencanakan versi yang dapat diedit” di kartu “Versi yang dapat diedit”. Titik-titiknya disambung dengan garis lurus.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '“Perkiraan waktu” menjumlahkan waktu di air, mengangkut perahu, keluar dan masuk lagi, pintu air, serta istirahat, berdasarkan kecepatan dan menit yang bisa kamu ubah.',
  'help.guide.tour-paddle-setup.step.4':
    'Di bawah “Perairan”, pilih “Sungai” atau “Danau”. Tur baru bisa disimpan setelah kamu memilih perahu dan jenis perairan.',
  'help.guide.tour-paddle-setup.result':
    'Tur dayung baru dengan perahu, perairan, dan kecepatannya, siap diberi titik pertama di peta.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Jika data perairannya belum ada, TREK akan mengunduhnya untuk wilayah itu secara otomatis atau memintanya ke admin, tergantung pengaturan instans. Ruasnya lalu menampilkan Memuat data perairan dan direncanakan otomatis begitu datanya tersedia, biasanya dalam satu sampai tiga menit.',
  'help.guide.tour-paddle-portage.step.2':
    'Pilih “Angkut perahu dari sini”. Bagian sampai titik berikutnya menjadi angkut perahu, digambar di darat.',
  'help.guide.tour-paddle-lock.title': 'Menambahkan pintu air dan waktu tunggunya',
  'help.guide.tour-paddle-lock.tip.3':
    '“Hapus pintu air” ada di bagian bawah kartu yang terbuka dan di “Tindakan lainnya”.',
  'help.guide.tour-paddle-time.step.5':
    'Selama belum semua pintu air punya waktunya, perkiraan menampilkan “Belum lengkap”, dan catatan di bawah baris mencantumkan apa yang masih kurang.',
  'help.guide.tour-paddle-wind.step.2':
    'Periksa arah angin, “Rata-rata”, dan “Embusan”-nya. “Rata-rata” adalah rata-rata per jam yang paling kuat hari itu, “Embusan” adalah embusan terkuatnya.',
  'help.guide.tour-paddle-checklist.title': 'Memeriksa daftar rintangan',
  'help.guide.tour-paddle-checklist.tip.2':
    '“Angkut memutar” tidak otomatis merencanakan angkut perahu. Klik “Rencanakan angkut perahu” untuk mengaturnya di peta.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Di “Pratinjau impor”, atur “Impor sebagai” ke “Tur dayung”, lalu pilih “Perahu” dan “Perairan”. Impor baru bisa dilanjutkan setelah keduanya dipilih.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Pada jejak rekaman, baris “Perairan” di “Perkiraan waktu” punya kecepatannya sendiri: klik, lalu ketik seberapa cepat kamu mendayung.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Tur berkuda yang diimpor dari file GPX tetap persis seperti rekamannya, dan kartu “Tur berkuda terekam” menyebutkan apa yang tidak bisa dihitung dari impor itu.',
  'help.guide.tour-horse-plan.step.6':
    'Klik “Ambil bagian”. Bagian itu ditambahkan ke tur berkuda sebagai lencana dengan nama rutenya di kartu “Titik jalan”. Tambahkan bagian lain dengan cara yang sama.',
  'help.guide.tour-horse-gap.title': 'Menyambung celah antar rute berkuda',
  'help.guide.tour-horse-gap.tip.2':
    'Titik yang kamu klik di peta ditambahkan ke tur berkuda dengan cara yang sama, sebagai ruas lurus yang tidak diperiksa.',
  'help.guide.tour-horse-recorded.result':
    'Tur berkuda tersimpan di perjalanan persis seperti yang kamu jalani, dengan jarak dan ketinggian dari filenya.',
  'help.guide.dateless-trip.step.3': 'Klik “Buat Perjalanan Baru”.',
  'help.guide.trip-reminder.tip.2':
    'Perjalanan baru otomatis punya pengingat 3 hari sebelum keberangkatan. Salurannya kamu atur di “Pengaturan”, “Notifikasi”.',
  'help.guide.upcoming-reservations.result':
    'Perjalanannya terbuka. Saat kembali ke dasbor, widget tetap menampilkan apa yang akan datang berikutnya.',
  'help.guide.entitlement.tip.2':
    'Dalam rencana gabungan, setiap orang punya barisnya sendiri, dan kamu juga bisa mengatur jatah cuti orang lain.',
  'help.guide.half-company-holiday.step.3': 'Klik harinya. Setengah selnya berubah kuning.',
  'help.guide.school-holidays.tip.2':
    'Arahkan kursor ke salah satu hari libur untuk melihat namanya di bawah “Liburan sekolah”.',
  'help.guide.answer-fusion-request.step.3':
    'Klik “Terima & Gabung” untuk menggabungkan rencana, atau “Tolak” agar rencanamu tetap terpisah.',
  'help.guide.log-for-partner.step.3': 'Klik hari-hari yang ingin dicatat, lalu klik lagi namamu sendiri di “Orang”.',
  'help.guide.dissolve-fusion.result':
    'Semua orang kembali ke rencananya masing-masing dengan entrinya sendiri, dan “Orang” hanya mencantumkan dirimu.',
  'help.guide.country-places.result': 'Perencana terbuka di perjalanan tempat itu berada.',
  'help.guide.tour-activity-stats.step.6':
    'Untuk tur yang batal, klik “Kecualikan”, tombol bulat di ujung barisnya. Tur itu tetap ada di daftar, tampil redup dan ditandai “Dikecualikan”. Tombol yang sama, kini bertuliskan “Hitung lagi”, untuk menghitungnya kembali.',
  'help.guide.move-to-list.tip.1':
    'Label hanya berlaku di satu daftar, jadi tempat yang dipindahkan atau diduplikat tidak membawa label di daftar barunya.',
  'help.guide.accept-list-invite.step.1':
    'Cari undangannya di bawah “Undangan” di rel daftar. Jika kamu membuka lewat notifikasi undangan, kartunya ada di bagian atas halaman. Kartu itu menyebutkan nama daftar dan pengirimnya.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Tur baru itu belum ada di hari mana pun dan tidak menambahkan tempat. Daftar maupun tur aslinya tidak berubah.',
  'help.guide.tour-collection-manage.step.3':
    'Klik ikon tempat sampah di ujung baris tur, lalu konfirmasi dengan “Hapus dari koleksi”.',
  'help.ctx.journey-detail.bullet.7':
    'Jika Dawarich terhubung, header hari juga menampilkan “Ambil rekaman” (atau jarak rute yang disimpan untuk hari itu) dan “Ambil hari”. Pada hari yang punya persinggahan menunggu, persinggahan itu dikelompokkan dalam satu baris di akhir hari.',
  'help.guide.entry-draft.tip.1':
    'Kontributor tetap bisa melihat draf. Hanya tautan publik yang menyembunyikannya sampai kamu mematikan “Draf”.',
  'help.guide.journey-map-layers.tip.2':
    'Sakelar yang redup belum punya apa pun untuk ditampilkan, dan tooltip-nya menjelaskan alasannya. Pilihanmu disimpan per journey di browser ini.',
  'help.guide.journey-keep-route.tip.2':
    'Nanti, klik jarak di header hari untuk membandingkannya lagi dengan Dawarich: “Ganti” memakai versi baru, “Hapus rute” menghapus rute hari itu dari journey.',
  'help.guide.journey-day-stays.tip.2':
    'Untuk hari yang padat, “Ambil hari” di ujung baris memproses semua persinggahannya sekaligus.',
  'help.guide.journey-take-over-day.tip.1':
    'Tidak ada yang disimpan sebelum kamu klik tombol itu, dan tidak ada yang tersimpan dua kali: persinggahan yang sudah ada di jurnal ditandai dan tidak bisa dipilih lagi.',
  'help.guide.journey-auto-prepare.tip.1':
    'Hanya hari dari perjalanan tertaut yang punya tanggal yang disiapkan, dan tidak ada yang otomatis ditambahkan ke jurnal.',
  'help.guide.photo-location.result':
    'Entri yang belum punya tempat mendapat lokasi dari foto pertamanya yang punya data GPS, dan muncul di peta.',
  'help.guide.contributors.tip.2':
    '“Melalui perjalanan” mencantumkan orang yang punya akses lewat perjalanan yang ditautkan. Ubah akses mereka di pengaturan perjalanan itu, bukan di sini.',
  'help.ctx.settings-plugins.bullet.2':
    'Plugin bisa menambahkan “Tindakan” ke kartunya, yang dijalankan setelah kamu konfirmasi, serta “Hubungkan” atau “Putuskan” jika plugin itu masuk ke layanan lain atas namamu.',
  'help.guide.web-push-device.tip.1':
    'Push berlaku per browser: ulangi langkah ini di setiap ponsel dan komputer yang ingin menerima notifikasi. “Nonaktifkan untuk perangkat ini” hanya menghentikannya di perangkat itu.',
  'help.guide.connect-airtrail.step.2':
    '“Izinkan sertifikat yang ditandatangani sendiri” hanya untuk instans tepercaya di jaringanmu sendiri. “Tulis perubahan kembali ke AirTrail” mati secara default, jadi TREK hanya membaca; aktifkan untuk mengirim hasil editmu kembali.',
  'help.guide.connect-dawarich.step.2':
    '“Periksa persinggahan baru secara otomatis” membuat TREK memeriksa sendiri. Jika dimatikan, TREK hanya membaca Dawarich saat kamu memintanya. “Izinkan sertifikat yang ditandatangani sendiri” hanya untuk instans yang tidak dipercaya servermu.',
  'help.guide.tour-connect-wanderer.step.2':
    'Aktifkan “Izinkan sertifikat yang ditandatangani sendiri” hanya untuk instans di jaringanmu sendiri.',
  'help.guide.tour-wanderer-watch.step.1':
    'Di kartu wanderer, aktifkan “Periksa perubahan jalur saya”. Fitur ini memerlukan koneksi yang sudah tersimpan.',
  'help.guide.plugin-settings.title': 'Atur plugin untuk dirimu sendiri',
  'help.guide.default-user-settings.tip.2':
    '“Mata uang tampilan” hanya mengonversi jumlah untuk tampilan. Jumlah yang dimasukkan di “Biaya” tetap seperti aslinya.',
  'help.guide.own-routing-engine.step.2':
    'Untuk rute yang menghindari jalan tol, jalan bebas hambatan, atau feri, isi alamat Valhalla-mu di bawah “Instans Valhalla sendiri”. Setiap kolom tersimpan begitu kamu meninggalkannya; lalu mulai ulang server TREK dan muat ulang halaman.',
  'help.guide.admin-passkeys.tip.3':
    'Jika pengguna kehilangan perangkat yang menyimpan passkey-nya, hapus passkey itu dengan “Reset passkey” di “Edit Pengguna”.',
  'help.guide.rotate-jwt-secret.result':
    'Secret penandatanganan baru sudah aktif, dan semua pengguna, termasuk kamu, harus masuk lagi.',
  'help.guide.read-notifications.title': 'Membaca notifikasi',
  'help.guide.filter-notifications.title': 'Melihat semua notifikasi, atau yang belum dibaca saja',
  'help.guide.mark-notifications-read.goal':
    'Hilangkan sorotan dan angka di ikon lonceng setelah kamu melihat kabar terbaru.',
  'help.guide.delete-notifications.step.1':
    'Klik “Hapus”, ikon tempat sampah di samping waktu notifikasi, untuk menghapus notifikasi itu saja.',
  'help.guide.notification-settings.step.2': 'Klik “Pengaturan” di menu.',
  'help.guide.public-link.tip.3': 'Arahkan kursor ke sebuah opsi untuk membaca apa yang disembunyikannya.',
  'help.guide.link-journal.step.4':
    'Baca catatan kuningnya: di sana disebutkan siapa saja yang baru pertama kali mendapat akses ke jurnal. Lalu klik “Tautkan jurnal”.',
  'help.guide.dawarich-stays.step.1':
    'Jika Dawarich terhubung di “Pengaturan”, “Integrasi”, “Dari Dawarich” tampil di atas daftar tempat. Header-nya menunjukkan kapan TREK terakhir memeriksa dan berapa persinggahan yang menunggu. Klik untuk membuka daftarnya.',
  'help.guide.leave-stop-off-route.step.2':
    'Lencana “Di luar rute” muncul di samping nama. Perhentian tetap ada di hari itu dan di peta, tapi rute hari itu dan waktu tempuh ruasnya melewatkannya.',
  'help.guide.move-booking-day.result':
    'Di rencana, pemesanan itu kini masuk ke hari yang baru, dengan jam yang tetap sama.',
  'help.guide.clear-day.tip.2': 'Pilihan menu ini hanya muncul pada hari yang berisi tempat.',
  'help.guide.place-image-from-file.step.1':
    'Buka tempat yang punya foto di “File”-nya. Bagian “File” di dekat bawah kartu menunjukkan berapa file yang dimiliki tempat itu.',
  'help.guide.place-own-hours.title': 'Memperbaiki jam buka, telepon, atau email tempat',
  'help.guide.place-own-hours.tip.1':
    'Jam yang kamu isi menggantikan jam hasil pencarian TREK, jadi kafe dengan jam buka musiman menampilkan jam yang kamu ketahui.',
  'help.guide.day-panel.tip.3':
    'Lebih suka merencanakan berdasarkan kalender? Aktifkan “Tanggal di depan pada judul hari” di “Pengaturan”, di bawah “Tampilan”, maka header menampilkan tanggal lebih dulu, dengan Hari 1 atau nama hari di bawahnya.',
  'help.guide.confirm-stay-booking.result':
    'Pemesanan hotel sudah dikonfirmasi, baik di kartu penginapan maupun di tab “Pemesanan”.',
  'help.guide.tour-map-lines.goal':
    'Bedakan tur-tur perjalanan di peta, buka tur dari garisnya, dan sembunyikan yang sedang tidak kamu perlukan.',
  'help.guide.tour-map-lines.tip.3':
    '“Keluarkan dari rute”, di menu baris tur pada rencana hari, membuat rute hari itu tidak lagi menuju titik awal dan akhir tur. “Masukkan kembali ke rute” menyambungkannya lagi.',
  'help.guide.car-stops.step.5':
    'Urutan persinggahan adalah rutenya. “Pindah ke atas” dan “Pindah ke bawah” di kiri persinggahan untuk mengubah urutannya, dan “Hapus perhentian”, tanda silang di kanannya, untuk menghapusnya.',
  'help.guide.transport-details.step.3':
    'Kotak-kotak di bawahnya menampilkan keberangkatan dan kedatangan beserta stasiun atau bandaranya, lalu peron dan kursi jika sudah diisi. Perjalanan dengan perhentian di antaranya mencantumkannya di bawah “Rute”, dan perjalanan yang dipesan per ruas mencantumkan kode setiap ruas di bawah “Kode per ruas”. Setelah itu ada “Peserta”, “Catatan”, “Biaya”, dan “File”; “Tampilkan di File” membuka tiketnya di tab “File”.',
  'help.guide.export-transports-csv.title': 'Mengekspor transportasi sebagai spreadsheet',
  'help.guide.group-sort-bookings.step.4':
    'Klik judul bagian untuk melipatnya. Angka di sampingnya menunjukkan berapa pemesanan di dalamnya, dan klik sekali lagi untuk membukanya.',
  'help.guide.booking-on-map.goal': 'Langsung buka tempat pemesanan di rencana dan di peta.',
  'help.guide.export-bookings-csv.tip.2':
    'Kolom-kolomnya dipisahkan titik koma, dan Excel membuka file ini dengan huruf beraksen tetap utuh.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK mengingat “A ke Z” di browser ini, jadi lain kali daftarnya juga terbuka dalam keadaan terurut. Ini hanya mengubah tampilanmu, tidak pernah mengubah urutan yang dilihat orang lain.',
  'help.guide.count-packed-pieces.step.4':
    'Begitu penghitung mencapai jumlahnya, item otomatis tercentang dan dihitung sudah dikemas.',
  'help.guide.expense-receipts.result':
    'Kuitansi tersimpan bersama pengeluarannya: chip di barisnya untuk membukanya, dan filenya juga ada di “File” perjalanan.',
  'help.guide.files-sync-settings.step.4':
    'Di bawah “Saat sebuah dokumen dihapus”, pilih apa yang terjadi pada salinan di sisi lain. “Simpan kedua salinan” membiarkan salinan di penyimpanan tetap ada. “Pindahkan ke tempat sampah” memindahkannya ke tempat sampah penyimpanan saat dokumen dihapus di TREK.',
  'help.ctx.trip-collab.bullet.7':
    'Semua yang ada di sini memerlukan koneksi. Saat offline, pesan, catatan, tautan, polling, atau suara tidak tersimpan, dan TREK menampilkan Ini memerlukan koneksi. Coba lagi setelah TREK online kembali. Anggota yang tidak boleh mengedit Kolab bisa membaca semuanya, tapi “Catatan Baru”, “Tambah tautan”, dan “Polling Baru” tidak tersedia bagi mereka dan kotak pesannya tampil redup.',
  'help.guide.manage-notes.step.4':
    '“Edit” membuka dialog catatan dengan semua isinya. Ubah yang perlu, misalnya satu baris tambahan di bawah “Konten”, lalu klik “Simpan”.',
  'help.guide.note-categories.step.2':
    'Ketik nama di “Kategori baru...” di bagian bawah, lalu tekan Enter atau klik tanda plus di sampingnya. Kategori baru mendapat warna berikutnya dan barisnya sendiri.',
  'help.guide.note-categories.tip.3':
    'Pada kartu, kategori hanya tampil sebagai titik berwarna di header-nya. Arahkan kursor ke titik itu untuk melihat namanya.',
  'help.guide.roadtrip-reorder.step.1':
    'Seret perhentian lewat barisnya dan jatuhkan di perhentian lain pada hari yang sama. Perhentian itu menggantikan posisi perhentian tujuan, dan rute hari itu dihitung ulang sesuai urutan baru.',
  'help.guide.roadtrip-overnight.step.5':
    'Klik “Tambah”. Penginapan dipesan dari hari ini sampai hari berikutnya, dan tempat itu ditambahkan ke perjalanan darat sebagai penginapan malam itu.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Untuk memakai lagi pengaturanmu sendiri di perhentian itu, buka lencananya lagi dan klik “Pakai bawaan saya”.',
  'help.guide.roadtrip-bookings.step.3':
    'Pil Check-in atau Boarding menunjukkan paling lambat kapan perjalanan darat harus mengantarmu ke terminal: keberangkatan diatur lebih awal dari jadwal sebanyak waktu itu.',
  'help.guide.roadtrip-google-import.title': 'Mengimpor rute dari Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Tautannya harus berisi minimal dua perhentian yang bisa ditempatkan TREK, dan maksimal 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Peringatan bukan penutupan jalan: rute tidak pernah berubah karenanya, dan isinya adalah pemberitahuan terkini, bukan prakiraan untuk tanggal perjalananmu.',
  'help.ctx.trip-tours.bullet.4':
    'Arahkan kursor ke sebuah baris untuk memunculkan ikon mata (“Sembunyikan di peta”) dan tanda + bulat (“Tambah ke hari ini”). Seret baris ke salah satu hari di kolom kiri untuk menjadwalkannya di sana, atau klik untuk membuka kartu tur di atas peta.',
  'help.guide.tour-show-list.step.4':
    'Kartu menampilkan ukuran tur dan, di bawah “Hari perjalanan”, hari-hari tur itu dijadwalkan. Untuk mengubah rutenya, buka tab “Tur” dan klik tur itu di bawah “Tur dalam perjalanan ini”.',
  'help.guide.tour-add-to-day.step.1':
    'Arahkan kursor ke tur di daftar, lalu klik tanda + bulat di kanan barisnya (“Tambah ke hari ini”).',
  'help.guide.tour-add-to-day.tip.4':
    'Saat ada hari yang terbuka (klik header-nya), kartu tur juga menawarkan “Tambah ke Hari” untuk hari itu. Panah urungkan di atas hari-hari membatalkan penjadwalan itu.',
  'help.guide.tour-day-times.tip.1': 'Jam selesai yang kamu isi menggantikan hasil hitungan.',
  'help.guide.tour-remove-from-day.step.2':
    'Tur tetap ada di daftar sebelah kanan. Lencana harinya hilang, dan filter kembali menghitungnya di “Belum direncanakan”.',
  'help.guide.tour-filter-list.step.2':
    'Di bawah Status, pilih “Belum direncanakan” untuk tur yang belum ada di hari mana pun, atau “Direncanakan” untuk tur yang sudah dijadwalkan. Setiap baris menunjukkan berapa tur yang cocok.',
  'help.guide.tour-hide-on-map.goal':
    'Sembunyikan dari peta tur yang sedang tidak kamu perlukan, tanpa mengubahnya bagi orang lain.',
  'help.guide.tour-import-plan-tab.goal':
    'Impor jejak GPX atau KML sebagai tur sambil merencanakan hari-hari perjalanan.',
  'help.ctx.trip-tour-detail.summary':
    'Kartu yang terbuka di atas peta saat kamu memilih tur di tab “Rencana”: hari, ukuran dan profilnya, asal tur, serta tombol untuk mengirimnya ke ponselmu, menyalinnya, menyimpannya ke koleksi, atau menautkannya ke daftar bawaan.',
  'help.guide.tour-detail-read.step.1':
    'Di bagian atas kolom kanan, beralih dari “Tempat” ke “Tur”, lalu klik sebuah tur. Kartunya terbuka di atas peta. Baris tur di dalam suatu hari, atau garisnya di peta, membuka kartu yang sama.',
  'help.guide.tour-detail-read.tip.2':
    'Tur dayung tidak menampilkan ketinggian maupun profil: titik-titiknya ada di tepi perairan, jadi data ketinggiannya tidak akan akurat.',
  'help.guide.tour-rename-colour.step.2':
    'Ketik nama baru lalu klik tombol centang bulat, atau tekan Enter. Tekan Escape untuk tetap memakai nama lama.',
  'help.guide.tour-take-along.step.1':
    'Buka kartu tur. “Navigasi” di bagian bawah kartu membuka titik awal tur di aplikasi peta, dan menampilkan daftar aplikasi dulu jika ada beberapa. Navigasi ini mengantarmu ke titik awal, bukan menyusuri rutenya.',
  'help.guide.tour-copy-keep.title': 'Menyalin tur atau menyimpannya di koleksi',
  'help.guide.tour-copy-keep.tip.3':
    'Di tab “Tur”, ikon penanda di bagian atas kolom kiri melakukan hal yang sama untuk tur yang sedang terbuka. Jika tur masih punya perubahan yang belum disimpan, kamu akan diminta menyimpannya dulu.',
  'help.guide.tour-packing-link.step.4':
    'Kartu sekarang menampilkan daftar itu, berapa itemnya yang sudah dikemas, sebuah bar, dan beberapa item pertama. Item yang sudah dikemas dicoret.',
  'help.guide.tour-files.step.1':
    'Buka kartu tur dan gulir ke “File” di bagian akhirnya. Klik “Unggah” di header bagian itu, lalu pilih satu file atau lebih.',
  'help.guide.tour-activity-link.step.1':
    'Buka kartu tur yang direncanakan dan gulir ke “Jejak aktual”. Klik “Tambah jejak aktual”.',
  'help.guide.tour-activity-link.result':
    'Jejak tertaut ke tur, dan kartu menampilkan rencana serta apa yang benar-benar kamu jalani secara berdampingan.',
  'help.guide.tour-activity-compare.tip.2':
    'Aktivitas tur di Atlas memakai jejak yang tertaut sebagai pengganti nilai rencana.',
  'help.guide.tour-origin-check.tip.2':
    'Tur dari wanderer punya ikon panah di samping sumbernya, “Buka di wanderer”, dan “Periksa sumber” di header bagian itu. Pemeriksaan ini menanyakan ke wanderer apakah jalurnya berubah sejak diimpor. “Impor sebagai snapshot baru” lalu mengimpor versi baru sebagai tur terpisah. Tur ini tetap mempertahankan hari dan catatannya.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Selama “Tambah titik” aktif (“Tempatkan titik” di pil peta), klik di peta untuk menempatkan titik. Seret pin untuk memindahkannya, klik rute yang tergambar untuk menambahkan titik bentuk di sana, dan pilih tempat dari perjalanan lewat “Tempat perjalanan”.',
  'help.guide.tour-open-workspace.step.4':
    'Tanda plus di bagian atas rel kanan, “Tambah tur”, menawarkan “Impor GPX atau KML”, “Impor rute jalan kaki dari Google Maps”, dan “Ambil tur dari perjalanan lain”. Saat ada tur yang terbuka, “Rencanakan tur baru” juga tersedia di sana.',
  'help.guide.tour-draw-route.title': 'Menggambar tur baru',
  'help.guide.tour-draw-route.tip.1':
    'Selama “Tempatkan titik” aktif, kursor berbentuk tanda bidik. Matikan untuk menggeser peta tanpa menambah titik. Dalam 3D, fitur ini mati sejak awal, karena di sana kamu menyeret peta untuk melihat sekeliling.',
  'help.guide.tour-type-profile.step.2':
    'Pilih jenisnya di daftar: “Pendakian”, “Jalan-jalan kota / wisata”, “Lari”, “Tur sepeda”, “Tur dayung”, “Tur berkuda”, atau “Ski & musim dingin”. Setiap jenis menjelaskan apa yang direncanakannya, dan jenis baru akan merencanakan ulang rutenya.',
  'help.guide.tour-edit-points.step.1':
    'Seret pin bernomor di peta ke posisi yang seharusnya. Rute direncanakan ulang melewati titik baru itu.',
  'help.guide.tour-edit-points.result':
    'Titik-titiknya berada di posisi dan urutan yang kamu mau, dan rutenya sudah direncanakan ulang.',
  'help.guide.tour-shaping-points.tip.2': 'Titik bentuk tidak bisa menjadi akhir etape pada tur beberapa hari.',
  'help.guide.tour-loop-reverse.tip.1':
    'Begitu tur sudah melingkar, “Kembali ke awal” menampilkan “Tur sudah kembali ke titik awal”.',
  'help.guide.tour-leg-by-hand.step.3':
    'Agar router merencanakannya lagi, buka menu yang sama dan pilih “Rutekan lagi ruas berikutnya”.',
  'help.guide.tour-trip-places.step.2':
    'Cari di tempat-tempat perjalanan, atau lihat di bawah “Dekat tur”: tempat dalam radius dua kilometer dari rute, mulai dari yang terdekat, masing-masing dengan jaraknya.',
  'help.guide.tour-details-times.goal':
    'Beri tur nama, deskripsi, dan tautan, lalu tambahkan waktu istirahat ke durasinya.',
  'help.guide.tour-details-times.result': 'Tur sekarang punya nama, catatan, dan waktu yang kamu rencanakan.',
  'help.guide.tour-save.tip.2':
    '“Kembali ke daftar tur” di bagian atas rel menutup editor, dan bertanya dulu jika ada perubahan yang belum disimpan.',
  'help.guide.tour-edit-saved.step.4':
    'Klik “Kembali ke daftar tur” untuk menutupnya. Jika ada perubahan yang belum disimpan, TREK bertanya “Buang perubahan tur yang belum disimpan?” dulu.',
  'help.guide.tour-summary-profile.step.2': 'Titik info di samping perkiraan waktu menjelaskan cara menghitungnya.',
  'help.guide.tour-list-manage.goal':
    'Lihat total tur dalam perjalanan, masukkan tur ke suatu hari, dan saring daftarnya sesuai kebutuhan.',
  'help.guide.tour-list-manage.tip.3':
    'Ikon tempat sampah pada baris menghapus tur. Tab “Rencana” menampilkan tur yang sama jika kolom kanannya dialihkan ke “Tur”.',
  'help.guide.tour-delete.tip.3':
    'Tur dihapus di sini, di tab “Tur”. Ikon tempat sampah hanya tersedia bagi peserta perjalanan yang boleh mengedit tempat-tempat perjalanan.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '“Simpan sebagai tur baru” menamai salinanmu sesuai nama tur, dengan (my version) di belakangnya.',
  'help.ctx.trip-tour-import.bullet.4':
    '“Versi yang dapat diedit” mengubah hasil impor menjadi tur dengan titik jalan yang bisa kamu pindahkan. “Ganti impor” tetap menyimpan jejak rekamannya, dan kartu “Jejak yang direkam” di editor membawamu kembali ke jejak itu.',
  'help.guide.tour-import-gpx.step.5': 'Klik Impor 1 tur (atau Impor 3 tur untuk file berisi tiga jejak).',
  'help.guide.tour-view-import.goal': 'Lihat lintasan, ukuran, dan ketinggian tur hasil impor persis seperti aslinya.',
  'help.guide.tour-plan-from-import.title': 'Merencanakan tur yang bisa diedit dari hasil impor',
  'help.guide.tour-plan-from-import.tip.3':
    'Impor dayung atau ski disambung dengan garis lurus di antara titik-titiknya, tidak dirutekan.',
  'help.guide.tour-restore-recorded.tip.1':
    'Kartu ini hanya tampil untuk tur yang sudah diganti dengan “Ganti impor” lalu disimpan.',
  'help.guide.tour-take-over.step.4': 'Klik turnya. Sisi kanan menampilkan garis, ukuran, dan perjalanan asalnya.',
  'help.guide.tour-import-wanderer.goal': 'Impor salah satu jalur dari wanderer milikmu ke perjalanan sebagai tur.',
  'help.guide.tour-import-wanderer.tip.4': '“Buka di wanderer” membuka jalurnya di instans milikmu.',
  'help.ctx.trip-tour-map.bullet.5':
    'Dalam 3D, rute tampil di atas medan dengan warna sesuai kecuramannya, disertai legenda yang merangkum tingkat kecuramannya dan penerbangan yang menyusurinya dari awal sampai akhir.',
  'help.guide.tour-map-layers.tip.2':
    '“Pendakian” dan “Bersepeda” berasal dari server sukarelawan dan hanya tersedia selama admin mengizinkannya. Jika salah satunya berhenti merespons, segmennya menampilkan tanda ! dan kamu bisa beralih ke peta lain; turmu tetap seperti semula.',
  'help.guide.tour-along-search.step.5':
    'Tempat yang ditemukan dicantumkan dengan jaraknya dari rute dan digambar di peta dengan warnanya masing-masing. Bintang menandai tempat yang paling terkenal, dan “Di tur” menandai yang sudah menjadi perhentian. Tombolnya sekarang bertuliskan “Cari lagi”.',
  'help.guide.tour-along-add-stop.step.2':
    '“Masuk di mana” menyarankan bagian rute yang paling cocok untuk tempat itu. Klik untuk memilih di antara dua perhentian mana tempat itu dimasukkan, atau “Sebagai titik akhir baru”. Peta menampilkan rute baru sebagai garis putus-putus sebelum ada yang berubah.',
  'help.guide.tour-3d-terrain.goal': 'Lihat tur di atas lanskap aslinya, dengan warna sesuai kecuramannya.',
  'help.guide.tour-3d-terrain.tip.2':
    'Peta yang kamu pilih juga dipakai dalam 3D, begitu pula via ferrata, lintasan ski, dan rambu laut. Saat mengedit tur, kamu bisa menyeret titik-titiknya di atas medan, dan saat “Tempatkan titik” aktif, sekali klik menambahkan titik.',
  'help.guide.tour-3d-flyover.result':
    'Kamu sudah melihat tur dari udara, dari awal sampai akhir, dengan kecepatan pilihanmu.',
  'help.guide.tour-map-overlays.step.3':
    'Keterangannya menjelaskan arti setiap warna: lintasan turun dari “Pemula” sampai Freeride, “Jalur ski lintas alam”, “Jalur musim dingin dan sepatu salju”, “Lintasan kereta luncur”, serta “Lift dan kereta gantung”. “Keterangan lengkap di OpenSnowMap” membuka semua simbolnya. Tekan Escape untuk menutupnya.',
  'help.ctx.trip-tour-stages.bullet.1':
    '“Hari” di editor menjadikan tur yang terbuka “Satu hari” atau “Beberapa hari”. Jika kamu beralih kembali ke tur satu hari, semua akhir etape dihapus setelah kamu konfirmasi, dan rutenya tetap seperti semula.',
  'help.guide.tour-multi-day.step.2':
    'Di bawah “Hari”, klik “Beberapa hari”. Sebuah keterangan menunjukkan di mana akhir etape pertama ditempatkan.',
  'help.guide.tour-multi-day.tip.4':
    'Etape tersimpan saat kamu klik “Simpan”. Jika suatu perubahan menghapus etape yang sudah dijadwalkan di salah satu hari perjalanan, muncul pemberitahuan bahwa menyimpan akan mengeluarkan etape itu dari hari tersebut.',
  'help.guide.tour-stages-on-days.step.5':
    'Setiap etape menampilkan harinya. Klik harinya untuk memindahkan etape ke hari lain, atau pilih “Tanpa hari” untuk mengeluarkannya.',
  'help.ctx.trip-tour-hike.summary':
    'Pendakian atau lari yang terbuka di tab “Tur”: editor di kiri, peta di tengah, ringkasan tur dan tur-tur lain dalam perjalanan di kanan. Pendakian tetap dalam batas tingkat kesulitan jalur yang kamu izinkan, waktu lari dihitung dari kecepatanmu sendiri, dan keduanya menampilkan data OpenStreetMap di sepanjang rute.',
  'help.guide.tour-hike-plan.goal':
    'Mulai pendakian, tentukan perhentiannya, pilih tingkat jalur tersulit yang boleh dilalui rute, lalu simpan.',
  'help.guide.tour-hike-plan.tip.1':
    'Pendakian baru dimulai di T2 (“Pendakian gunung”). T3 menambahkan peringatan bahwa jalur seperti itu bisa terbuka dan curam, sehingga butuh pijakan yang mantap dan tidak takut ketinggian.',
  'help.guide.tour-hike-trail-details.step.3':
    'Lencana-lencananya merangkum semua itu: berapa bagian rute yang “Diketahui”, tingkat “Tertinggi diketahui”, dan, terpisah, “Batas rute” yang dipakai saat merencanakan pendakian.',
  'help.guide.tour-hike-round.goal':
    'Biarkan TREK menyarankan rute melingkar dengan panjang yang kamu mau, mulai dari salah satu perhentian pendakian.',
  'help.guide.tour-hike-round.tip.2':
    'Jarak dari 1 sampai 60 km bisa dipakai, dan yang ditawarkan adalah putaran yang selisihnya maksimal 20 % dari jarak pilihanmu.',
  'help.guide.tour-hike-compare-ways.result':
    'Hanya bagian itu yang mengikuti jalan pilihanmu, dan sisa pendakian tetap seperti semula. “Jalan dipakai” di bagian bawah peta punya “Urungkan”.',
  'help.guide.tour-ferrata-add.step.3':
    'Klik “Tambahkan ke tur”. Via ferrata ditambahkan di akhir rute sebagai ruas tersendiri, dengan titik di setiap ujungnya.',
  'help.guide.tour-run-plan.title': 'Rencanakan lari dengan kecepatanmu sendiri',
  'help.guide.tour-run-plan.tip.1': 'Rute lari tidak bisa disimpan tanpa kecepatan.',
  'help.guide.tour-run-ways.step.3':
    'Klik “Permukaan”, lalu pilih salah satu permukaan di daftar agar hanya bagian itu yang tampil di peta.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Begitu jalan-jalan dijadwalkan di hari dengan jam mulai, “Waktu untuk” di bagian atas “Titik jalan” menyebutkan hari itu, dan setiap perhentian menampilkan jam tiba, lama singgah, dan keterangan jam bukanya.',
  'help.guide.tour-walk-plan.step.4':
    'Beri perhentian Label dan “Lama singgah dalam menit”. Biarkan lama singgah kosong selama kamu belum tahu, dan isi 0 untuk titik yang hanya dilewati.',
  'help.guide.tour-walk-sights.goal':
    'Pilih tema, cari di sepanjang rute jalan-jalan, dan tambahkan tempat sebagai perhentian.',
  'help.guide.tour-walk-sights.tip.3':
    'Jam buka dan situs web berasal dari sumber datanya, kebanyakan OpenStreetMap. Periksa dulu sebelum berangkat.',
  'help.guide.tour-walk-day-times.tip.1':
    'Jika belum ada jam mulai, keterangannya memberi tahu: Beri jalan-jalan waktu pada hari ini untuk melihat kedatangan dan jam buka.',
  'help.guide.tour-walk-google-import.step.2':
    'Tempel tautannya di bawah “Tautan ke rute jalan kaki”, lalu klik “Baca tautan”.',
  'help.guide.tour-walk-check-off.goal':
    'Tandai perhentian yang sudah dikunjungi atau dilewati pada harinya, dan lihat sisa jalan kakinya.',
  'help.guide.tour-walk-check-off.result':
    'Perhentian yang sudah dikunjungi tercentang, yang dilewati dicoret, dan sisa waktu hanya menghitung yang belum dijalani.',
  'help.guide.tour-bike-profile.goal':
    'Mulai tur sepeda dan biarkan TREK merutekannya untuk touring, sepeda jalan raya, gravel, atau MTB.',
  'help.guide.tour-bike-profile.tip.1':
    'Jika profilnya diubah nanti, seluruh rute direncanakan ulang sesuai profil baru.',
  'help.guide.tour-bike-surfaces.step.2':
    'Lencana di header kartu menunjukkan porsi rute yang diketahui tidak beraspal.',
  'help.guide.tour-bike-mtb-grades.title': 'Memeriksa tingkat jalur tur sepeda gunung',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Jika tingkat jalurnya tidak bisa dibaca, kartu akan memberi tahu. Klik “Coba lagi”.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Selama tur “Ski & musim dingin” terbuka, peta menampilkan lintasan ski dari OpenSnowMap, dengan “Keterangan lintasan” di samping sakelarnya. Semua itu adalah data peta: tidak ada yang menunjukkan apakah lintasan atau lift sedang buka, bagaimana kondisi saljunya, atau apa pun tentang longsor salju.',
  'help.guide.tour-ski-plan.step.6': 'Beri nama tur di bawah “Nama tur”, lalu klik “Simpan”.',
  'help.guide.tour-ski-options.step.1':
    'Di tur “Ski & musim dingin”, opsi router ada di bawah “Disiplin”. Kamu hanya melihat opsi yang dipakai disiplinmu: misalnya, “Ski lintas alam” tidak punya “Lintasan tersulit”.',
  'help.guide.tour-ski-options.result':
    'Tur direncanakan ulang sesuai batasmu, dan kartu “Rute lintasan” mencantumkan lintasan lebih sulit yang dihindarinya.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Saat offline, ruas-ruasnya digambar lurus untuk sementara. Baris abu-abu tentang jalur musim panas hanyalah keterangan, bukan kesalahan.',
  'help.guide.tour-ski-summary.tip.1':
    '“Dihindari” mencantumkan lintasan lebih sulit yang dihindari router karena batas “Lintasan tersulit” milikmu.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Klik “Keterangan lintasan”, tombol dengan empat titik berwarna di samping sakelar.',
  'help.guide.tour-ski-import.step.1':
    'Di tab “Tur”, klik “Tambah tur” (tanda plus di atas “Tur dalam perjalanan ini”), pilih “Impor GPX atau KML”, lalu pilih filenya.',
  'help.guide.tour-ski-import.tip.3':
    'Kamu juga bisa menjatuhkan file GPX, KML, atau KMZ di mana saja di tab “Tur” untuk membuka pratinjau yang sama.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '“Angin” menampilkan prakiraan di titik awal tur untuk hari tur itu dijadwalkan. “Daftar periksa” mencantumkan rintangan di rute yang tersimpan dan keputusanmu untuk masing-masing.',
  'help.guide.tour-paddle-setup.step.5':
    'Di danau, “Melintasi danau” menentukan rutenya: “Lurus” adalah yang terpendek, “Dekat tepi” tetap dekat tepian untuk hari berangin.',
  'help.guide.tour-paddle-water-route.title': 'Merencanakan ruas di air',
  'help.guide.tour-paddle-water-route.tip.2':
    'Di tempat rute mengangkut perahu memutari bendungan atau melewati pintu air, TREK menempatkan titiknya sendiri di sana, ditandai “Ditemukan”. Jika kamu memindahkan atau mengubahnya, titik itu menjadi titikmu sendiri.',
  'help.guide.tour-paddle-portage.step.3':
    'Kartu “Angkut perahu” muncul di bawah titik itu dengan panjang dan menit tambahannya. Klik untuk membukanya.',
  'help.guide.tour-paddle-lock.goal':
    'Tambahkan pintu air ke tur dan masukkan waktu tunggu serta waktu melintasnya ke dalam durasi tur.',
  'help.guide.tour-paddle-lock.result':
    'Pintu air sudah ada di tur dengan menitnya, dan “Perkiraan waktu” ikut menjumlahkannya.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK memulai dengan 4 km/jam di air, 2 km/jam saat mengangkut, dan 10 menit di setiap angkut perahu. Ini nilai awal untuk disesuaikan, bukan hasil pengukuran.',
  'help.guide.tour-paddle-wind.step.3':
    'Bar menunjukkan jam-jam dalam sehari, dengan embusan di belakang angin rata-rata. Arahkan kursor ke bar untuk melihat angka dan arah angin pada jam itu.',
  'help.guide.tour-paddle-checklist.goal':
    'Lihat informasi yang diketahui tentang bendungan, pintu air, dan aturan akses di rute yang tersimpan, lalu putuskan apa yang akan kamu lakukan di masing-masing.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Entri bertanda “Periksa lagi” diputuskan sebelum rute atau datanya berubah. Putuskan lagi, atau pilih “Pertahankan keputusan” atau “Hapus keputusan”. Keputusan yang sudah tidak berlaku dicantumkan di bawah “Keputusan sebelumnya”.',
  'help.guide.tour-paddle-track-marks.step.3': 'Klik Impor 1 tur.',
  'help.guide.tour-paddle-track-marks.result':
    'Jejak rekaman kini berisi angkut perahu dan pintu airnya, dan “Perkiraan waktu”-nya ikut menghitungnya.',
  'help.guide.tour-horse-plan.title': 'Merencanakan tur berkuda di sepanjang rute berkuda',
  'help.guide.tour-horse-plan.step.7':
    'Beri nama tur berkuda di bawah “Nama tur”, lalu klik “Simpan” di bagian bawah kolom kiri.',
  'help.guide.tour-horse-gap.goal': 'Lanjutkan dengan bagian yang dimulai jauh dari titik akhir tur berkudamu.',
  'help.guide.tour-horse-gap.tip.3':
    'Bagian yang dimulai dalam jarak 25 m dari titik akhir tur berkudamu langsung tersambung, dan “Sambungan ke tur Anda” menampilkan “Tersambung ke akhir tur Anda”.',
  'help.guide.tour-horse-recorded.tip.1':
    'Garisnya tetap persis seperti yang terekam di file. Tidak ada yang dirutekan ulang, dan tur berkuda hasil rekaman tidak punya versi yang bisa diedit.',
  'help.guide.dateless-trip.result':
    'Kartu menampilkan “Ide” dan “Tanggal belum diatur”, dan perjalanan punya hari kosong sebanyak yang kamu minta.',
  'help.guide.trip-reminder.title': 'Mendapat pengingat sebelum perjalanan',
  'help.guide.upcoming-reservations.tip.1':
    'Menginap di hotel muncul dua kali, sekali untuk check-in dan sekali untuk check-out.',
  'help.guide.half-company-holiday.result':
    'Perusahaan libur setengah hari, dan cuti yang dicatat di hari itu hanya dihitung setengah hari.',
  'help.guide.edit-holiday-calendar.title': 'Mengubah atau menghapus kalender hari libur',
  'help.guide.answer-fusion-request.result':
    'Setelah “Terima & Gabung”, kedua rencana tampil dalam satu kisi, setiap orang dengan warnanya sendiri.',
  'help.guide.log-for-partner.result':
    'Hari-hari itu tampil dengan warna orang tersebut dan memotong jatah cutinya, bukan jatahmu.',
  'help.guide.dissolve-fusion.tip.1':
    '“Batal” di jendela itu membiarkan rencana tetap seperti semula; entrimu tetap tersimpan dalam kedua kasus.',
  'help.guide.country-places.tip.1':
    'Tempat yang masuk ke negara yang salah biasanya punya alamat atau koordinat yang keliru. Buka perjalanannya dari sini dan perbaiki tempat itu di sana.',
  'help.guide.tour-activity-stats.title': 'Melihat apa saja yang sudah kamu jalani dalam tur',
  'help.guide.tour-activity-stats.result':
    'Jumlah di dialog dan di tab “Tur” tidak lagi mencakup tur yang kamu kecualikan. Rute, hari, dan perjalanannya tetap seperti semula.',
  'help.guide.move-to-list.tip.2':
    'Memindahkan berarti mengeluarkan tempat dari daftar, jadi hanya pemilik daftar atau admin yang melihat “Pindahkan ke daftar”. “Duplikat ke daftar” bisa dipakai dari daftar mana pun yang bisa kamu buka.',
  'help.guide.accept-list-invite.step.2': 'Klik “Terima” untuk bergabung, atau “Tolak” untuk menolak undangannya.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Jika tur disimpan tanpa garis, titik jalannya harus ikut ditambahkan. Dialog akan memberi tahu hal ini dan memilihkan opsi itu untukmu.',
  'help.guide.tour-collection-manage.tip.1':
    'Menghapus tur dari daftar tidak mengubah tur yang sudah dibuat darinya di perjalananmu.',
  'help.guide.entry-draft.tip.2':
    'Saat kamu mengambil hari dari Dawarich, entri-entrinya berupa draf. Periksa lencananya sebelum membagikan.',
  'help.guide.journey-map-layers.result':
    'Peta hanya menampilkan lapisan yang kamu mau, dan setiap pin, titik, dan garis bisa dipahami lewat keterangannya.',
  'help.guide.journey-keep-route.result':
    'Header hari menampilkan jaraknya, dan rute digambar sebagai garis utuh di lapisan “Terekam” pada peta bagi semua orang di journey. Tautan yang dibagikan hanya menampilkannya jika “Rute terekam” aktif.',
  'help.guide.journey-day-stays.result':
    'Persinggahan yang sudah kamu putuskan dihapus dari baris. Entri yang kamu tulis muncul di harinya seperti entri lain, dan kamu bisa menambahkan foto dan teks seperti biasa.',
  'help.guide.journey-take-over-day.tip.2':
    'Draf tidak tampil di tautan yang dibagikan. Tambahkan foto dan teks, lalu matikan “Draf” di setiap entri.',
  'help.guide.journey-auto-prepare.tip.2':
    'Titik pada tombol daftar hari berarti hari itu belum final; tooltip-nya menjelaskan alasannya.',
  'help.ctx.settings-plugins.bullet.3':
    '“Aktivitas plugin” di bagian bawah mencantumkan setiap tindakan yang dilakukan plugin atas namamu, mulai dari yang terbaru, dengan tombol “Segarkan”.',
  'help.guide.language-region.tip.3':
    '“Awal minggu” menentukan kolom pertama di setiap pemilih tanggal; Vacay punya pengaturannya sendiri.',
  'help.guide.web-push-device.tip.2': 'Di iPhone dan iPad, tambahkan TREK ke Layar Utama dulu, lalu buka dari sana.',
  'help.guide.connect-airtrail.step.3':
    'Klik “Simpan”, lalu “Uji koneksi”. Hasilnya menunjukkan berapa penerbangan yang ditemukan, dan lencananya berubah menjadi “Terhubung”.',
  'help.guide.connect-dawarich.step.3':
    'Klik “Simpan”, lalu “Uji koneksi”: hasilnya menghitung persinggahan dalam 30 hari terakhir. Setelah terhubung, “Periksa sekarang” langsung memeriksa, dan “Putuskan” di kanan mengakhiri koneksinya.',
  'help.guide.tour-connect-wanderer.step.3':
    'Klik “Simpan”, lalu “Uji koneksi”. Hasilnya menunjukkan berapa jalurmu yang bisa diimpor, dan lencananya berubah menjadi “Terhubung”.',
  'help.guide.tour-wanderer-watch.step.2':
    'Maksimal sekali sehari, TREK membaca ringkasan setiap jalur yang kamu impor, dan barisnya menunjukkan kapan terakhir diperiksa. Jika ada jalur yang mungkin berubah, kamu mendapat notifikasi dan “Petunjuk” ikut menghitungnya: klik “Petunjuk” untuk melihat setiap tur dengan status “Mungkin berubah”, “Berubah”, atau “Tidak dapat diperiksa”, lalu buka dari sana.',
  'help.guide.plugin-settings.goal':
    'Isi kunci dan preferensimu sendiri untuk plugin, dan lihat apa saja yang dilakukannya atas namamu.',
  'help.guide.own-routing-engine.result': 'Rute di semua perjalanan dihitung di servermu.',
  'help.guide.admin-passkeys.title': 'Menyediakan login dengan passkey',
  'help.guide.rotate-jwt-secret.tip.1': 'Kamu juga ikut keluar, jadi langsung masuk lagi sesudahnya.',
  'help.guide.notification-defaults.title': 'Mengatur default notifikasi untuk pengguna',
  'help.ctx.notifications.title': 'Notifikasi',
  'help.guide.read-notifications.goal':
    'Lihat apa yang terjadi di perjalananmu selama kamu tidak membuka TREK, lalu langsung buka.',
  'help.guide.filter-notifications.goal': 'Lihat semua notifikasimu, atau yang belum kamu baca saja.',
  'help.guide.mark-notifications-read.step.1':
    'Klik “Tandai sudah dibaca”, ikon centang ganda di samping waktu notifikasi, untuk menandai notifikasi itu saja.',
  'help.guide.delete-notifications.step.2':
    '“Hapus semua” di bagian atas menghapus seluruh daftar sekaligus, setelah dialog meminta konfirmasi.',
  'help.guide.notification-settings.step.3':
    'Klik “Notifikasi” di sidebar “Pengaturan”. Kartu pertamanya punya satu baris untuk setiap peristiwa, dan kolom In-App menentukan apa yang tampil di ikon lonceng.',
  'help.guide.link-journal.result':
    'Tab “Jurnal” muncul di bar tab perjalanan. Semua orang yang kamu beri akses “Baca” atau “Edit” bisa membuka jurnal di tab itu, dengan pembaruan langsung.',
  'help.guide.create-place.tip.4':
    'Tautan yang disalin dari Google Maps juga bisa dipakai di pencarian: tempel, tekan Enter, dan TREK membaca tempatnya dari tautan itu. Setelah formulir punya posisi, “Tempat di dekat pin ini”, ikon bidik di samping pencarian, mencantumkan apa saja yang ada di sekitarnya.',
  'help.guide.dawarich-stays.step.2':
    'Persinggahan dikelompokkan per hari, masing-masing dengan jam tiba dan jam pergi; ikon pengukur menandai persinggahan yang tidak diyakini Dawarich. Klik “Tambahkan sebagai tempat”, ikon pin di samping persinggahan.',
  'help.guide.leave-stop-off-route.step.3':
    'Untuk memasukkannya ke rute lagi, buka menu yang sama dan pilih “Masukkan kembali ke rute”.',
  'help.guide.move-booking-day.tip.1':
    'Baris pudar di hari-hari tengah pemesanan beberapa hari tidak bisa diseret, begitu juga satu ruas dari penerbangan dengan transit.',
  'help.guide.place-image-from-file.step.2':
    'Klik gambar bulat di header. Karena tempat itu punya foto, jendela kecil menanyakan dari mana gambarnya akan diambil.',
  'help.guide.place-own-hours.goal':
    'Tampilkan jam yang sudah kamu cek sendiri di kartu, jika jam hasil pencarian salah atau tidak ada.',
  'help.guide.place-own-hours.tip.2':
    'Nomor telepon dan email tampil sebagai pil di header kartu. Klik salah satunya untuk membukanya di aplikasi telepon atau emailmu.',
  'help.guide.edit-accommodation.tip.3':
    'Jika “Sembunyikan Kode Pemesanan” aktif di “Pengaturan”, di bawah “Tampilan”, nomor konfirmasi tetap disamarkan. Arahkan kursor ke atasnya atau klik untuk membacanya.',
  'help.guide.confirm-stay-booking.tip.1': 'Klik pil itu lagi, dan pemesanan kembali ke “Menunggu”.',
  'help.guide.map-markers.tip.4':
    'Jika “Penanda ringkas untuk tempat yang belum direncanakan” aktif, di “Pengaturan” > “Tampilan” di bawah “Perjalanan & peta”, tempat yang belum ada di hari mana pun tampil sebagai titik kecil tanpa foto atau rating. Tempat yang kamu pilih selalu digambar lengkap.',
  'help.guide.tour-map-lines.step.1':
    'Setiap tur dalam perjalanan digambar di peta sebagai garis dengan warnanya, dengan pin di titik awalnya. Jika kamu memilih warna untuk tur, garisnya memakai warna itu. Jika tidak, garisnya memakai warna kategorinya.',
  'help.guide.car-stops.step.6': 'Klik “Tambah”.',
  'help.guide.transport-details.step.4':
    'Klik judulnya untuk mengganti nama perjalanan tanpa membuka formulir. “Ganti nama” terbuka dengan nama yang sudah terisi: ketik nama baru, lalu klik “Simpan”.',
  'help.guide.export-transports-csv.goal':
    'Ekspor semua perjalanan dalam trip dari TREK sebagai file CSV, untuk spreadsheet, agen perjalanan, atau dicetak.',
  'help.guide.group-sort-bookings.result':
    'Pemesanan tampil dalam bagian dan urutan yang kamu pilih, dan browser ini mengingat pilihan itu untuk kunjungan berikutnya.',
  'help.guide.booking-on-map.step.1':
    'Klik kartu pemesanan yang punya tempat, yang ditautkan di bawah “Tempat / Aktivitas” atau, untuk penginapan, di bawah “Akomodasi”. Detailnya terbuka.',
  'help.guide.export-bookings-csv.title': 'Mengekspor pemesanan sebagai spreadsheet',
  'help.guide.export-bookings-csv.tip.3':
    'Tombolnya muncul begitu tab berisi satu pemesanan. Tab “Transportasi” mengekspor entrinya sendiri dengan cara yang sama.',
  'help.guide.arrange-packing-list.title': 'Menyusun daftar bawaan sesuai urutanmu',
  'help.guide.count-packed-pieces.result':
    'Barisnya menunjukkan berapa barang yang sudah dikemas, dan item otomatis tercentang begitu barang terakhir masuk.',
  'help.guide.expense-receipts.title': 'Melampirkan kuitansi ke pengeluaran',
  'help.guide.expense-receipts.tip.1':
    'Di editor, klik nama file yang tercantum untuk membuka pratinjau yang sama. Esc lalu hanya menutup pratinjaunya, bukan pengeluarannya.',
  'help.guide.files-sync-settings.step.5':
    '“Saat kedua sisi berubah” menentukan salinan mana yang dipertahankan jika dokumen diedit di kedua tempat: “Tanya saya”, “Simpan salinan TREK”, atau “Simpan salinan penyimpanan”. “Sinkronkan otomatis” membuat TREK memeriksa perubahan di latar belakang; jika dimatikan, kartu bertuliskan “Dijeda” dan sinkronisasi hanya berjalan lewat “Sinkronkan sekarang”. Setiap perubahan di sini langsung tersimpan.',
  'help.guide.manage-notes.step.5':
    '“Hapus” bertanya dulu, “Hapus catatan?”, karena catatan akan terhapus bagi semua anggota beserta file-nya. Klik “Hapus” untuk mengonfirmasi.',
  'help.guide.note-categories.step.3':
    'Klik nama kategori untuk menggantinya. Ketik nama baru dan tekan Enter; Esc membatalkan dan memakai nama lama.',
  'help.guide.roadtrip-reorder.step.2':
    'Untuk memindahkan perhentian ke hari lain, jatuhkan ke salah satu perhentian di kartu hari itu. Saat kamu menyeret, hari yang perhentiannya kurang dari dua muncul sebagai kartu putus-putus di ujung rel, dan kamu juga bisa menjatuhkannya di sana.',
  'help.guide.roadtrip-corridor.tip.4':
    'Di bawah filter, pilih satu perhentian hari itu, atau titik tengah di antara dua perhentian, agar hanya tampil hasil dalam radius 25, 50, atau 100 km dari titik itu. Jika ada tempat pengisian daya di daftar, “Semua colokan” dan “Semua daya” bisa menyaringnya menurut jenis colokan dan daya.',
  'help.guide.roadtrip-overnight.result':
    'Tempat itu muncul di perjalanan darat sebagai tempat menginap hari itu, dan penginapannya dipesan di perjalanan seperti pemesanan lain.',
  'help.guide.roadtrip-stop-fill.result':
    'Di perhentian ini, tangki diisi sampai level yang kamu pilih. Jangkauan sesudahnya, termasuk pita “Tangki habis di sini” jika ada, dihitung dari level itu.',
  'help.guide.roadtrip-bookings.step.4': 'Klik kartunya untuk membuka pemesanan.',
  'help.guide.roadtrip-google-import.goal':
    'Jadikan rute yang kamu rencanakan di Google Maps sebagai perhentian di salah satu harimu.',
  'help.guide.roadtrip-google-import.tip.3': 'Impor memerlukan koneksi dan izin untuk mengedit tempat sekaligus hari.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD mencakup Jerman, dan GDACS melaporkan bencana di seluruh dunia. Peringatan yang hanya berupa titik berarti area terdampaknya tidak diketahui.',
  'help.ctx.trip-tours.bullet.5':
    'Di kolom hari, tur tampil sebagai baris seperti perhentian. Jika punya “Mulai”, barisnya menampilkan mulai → selesai, dengan jam selesai dihitung dari durasi tur, dan “Opsi lainnya” berisi “Edit”, “Hapus dari hari”, “Keluarkan dari rute”, dan “Simpan ke Koleksi”.',
  'help.guide.tour-show-list.step.5': 'Klik “Tempat” di sakelar yang sama untuk kembali ke daftar tempat.',
  'help.guide.tour-add-to-day.step.2':
    'Pilih harinya. Menu mencantumkan semua hari perjalanan dengan tanggal dan judulnya; hari yang sudah berisi tur itu tampil redup.',
  'help.guide.tour-add-to-day.result':
    'Tur tercantum di bawah harinya, dan garisnya menjadi bagian dari hari itu di peta.',
  'help.guide.tour-day-times.tip.2':
    'Hari yang berisi satu etape dari tur beberapa hari tidak mendapat jam selesai hasil hitungan, karena durasi tur adalah durasi seluruh rute.',
  'help.guide.tour-remove-from-day.step.3':
    'Atau klik header hari untuk membukanya, klik tur di daftar, lalu klik “Hapus dari Hari” di bagian bawah kartunya.',
  'help.guide.tour-filter-list.step.3':
    'Jika daftarnya campuran, “Sumber” (TREK, “Impor GPX”, wanderer), “Batas rute” (T1 sampai T6), dan “Jenis” (“Pendakian”, “Tur sepeda”, dan seterusnya) bisa menyaringnya lebih jauh. Klik lagi nilai yang dicentang untuk menghapusnya.',
  'help.guide.tour-hide-on-map.step.1':
    'Arahkan kursor ke tur di daftar, lalu klik ikon mata yang muncul di kanan barisnya (“Sembunyikan di peta”).',
  'help.guide.tour-import-plan-tab.step.1': 'Di tab “Rencana”, klik “Tur” di sakelar bagian atas kolom kanan.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Klik tur di daftar “Tur” (alihkan dulu kolom kanan dari “Tempat” ke “Tur”), barisnya di dalam hari, atau garisnya di peta, dan kartunya terbuka di atas peta. Peta tetap bisa dipakai selama kartu terbuka.',
  'help.guide.tour-detail-read.step.2':
    'Header menampilkan nama tur dan ringkasannya dalam bentuk pil: jenis tur, asalnya jika diimpor, rencana durasinya, jarak, tanjakan, dan turunannya.',
  'help.guide.tour-detail-read.tip.3':
    'Beberapa tur menampilkan lebih banyak: jalan-jalan kota menampilkan perhentiannya, tur dayung pemeriksaan dan anginnya, tur yang sudah dijalani “Jejak aktual”-nya, dan tur yang ditautkan ke daftar menampilkan “Daftar bawaan”-nya.',
  'help.guide.tour-rename-colour.step.3':
    'Klik titik berwarna di sudut kotak bulat tur, Warna jejak. Bagian Warna jejak terbuka di bawah header.',
  'help.guide.tour-take-along.step.2':
    'Jika tur punya halaman web, tombol di sampingnya menampilkan nama situsnya (Komoot, AllTrails, Outdooractive, atau Wanderer), atau Situs web untuk situs lain. Tombol itu membuka halamannya di tab baru.',
  'help.guide.tour-copy-keep.goal':
    'Buat variasi tur di perjalanan ini, atau simpan tur di salah satu koleksimu untuk perjalanan berikutnya.',
  'help.guide.tour-copy-keep.tip.4':
    '“Koleksi” hanya tersedia selama addon Koleksi aktif. Daftar yang hanya boleh kamu baca tidak bisa dipilih, dan jika belum ada daftar, dialog menawarkan “Buka koleksi”.',
  'help.guide.tour-packing-link.step.5':
    'Klik “Buka daftar bawaan” untuk mencentang barang. TREK beralih ke tab “Daftar”, di daftar bawaan.',
  'help.guide.tour-files.step.2': 'Baris di bawahnya sekarang menunjukkan jumlah file, dan daftarnya terbuka.',
  'help.guide.tour-activity-link.step.2':
    'Di bawah “Dilakukan pada”, periksa hari kamu menjalaninya. Pilih “Tanpa hari” jika tidak termasuk hari mana pun.',
  'help.guide.tour-activity-compare.title': 'Membandingkan rencana dengan yang benar-benar kamu jalani',
  'help.guide.tour-activity-compare.result':
    'Kamu bisa dengan cepat membandingkan hari itu dengan rencananya, di kartu maupun di peta.',
  'help.guide.tour-origin-check.tip.3':
    '“Tidak ada koneksi wanderer” berarti akunmu belum terhubung. Hubungkan di “Pengaturan”, di bawah “Integrasi”.',
  'help.ctx.trip-tour-planner.bullet.5':
    '“Cari tempat atau alamat” di bagian atas peta memindahkan peta. Pil di kiri bawah beralih di antara peta yang tersedia untuk jenis tur itu, misalnya Topo atau “Satelit”, dan berisi sakelar untuk tur yang terbuka, misalnya “Tempatkan titik” dan 3D.',
  'help.guide.tour-open-workspace.step.5':
    '“Cari tempat atau alamat” di bagian atas peta memindahkan peta ke suatu tempat, jadi kamu bisa mulai di lokasi tur itu.',
  'help.guide.tour-draw-route.goal':
    'Tempatkan titik-titik tur baru di peta dan biarkan TREK menghitung rute di antaranya.',
  'help.guide.tour-draw-route.tip.2':
    'Topo atau “Pendakian” di pil peta menampilkan jalan setapak, jadi lebih mudah mengklik salah satunya. Titik yang terlalu jauh dari jalan yang bisa dipakai jenis tur itu akan mendapat pemberitahuan, bukan rute.',
  'help.guide.tour-type-profile.step.3':
    'Tur sepeda meminta “Profil” di bawah jenisnya: Touring, Road, Gravel, atau MTB. Keterangan di bawahnya menjelaskan apa yang diutamakan profil itu.',
  'help.guide.tour-edit-points.step.2':
    'Klik baris di bawah “Titik jalan” untuk memilih titiknya. Pin-nya disorot di peta.',
  'help.guide.tour-shaping-points.title': 'Mengubah rute dengan titik bentuk',
  'help.guide.tour-shaping-points.tip.3':
    'Pada tur berkuda, klik di garis tidak menambahkan apa pun, karena tidak ada router yang membentuk rutenya.',
  'help.guide.tour-loop-reverse.tip.2':
    'Hapus baris “Kembali ke awal” untuk menjadikannya tur satu arah lagi. Ruas yang digambar dengan tangan tetap seperti itu saat arah tur dibalik.',
  'help.guide.tour-leg-by-hand.step.4':
    '“Hitung ulang bagian berikutnya” meminta router menghitung ulang ruas itu saja, tanpa mengubah ruas lainnya.',
  'help.guide.tour-trip-places.step.3':
    'Klik sebuah tempat. Tempat itu ditambahkan sebagai titik akhir baru tur, dan daftarnya tetap terbuka untuk tempat berikutnya.',
  'help.guide.tour-details-times.step.1':
    '“Nama tur” di bagian atas rel kiri berisi namanya. Pada tur baru, teks abu-abu di sana, misalnya “Pendakian tanpa judul”, hanya contoh: ketik nama milikmu sendiri.',
  'help.guide.tour-save.title': 'Menyimpan tur',
  'help.guide.tour-save.tip.3':
    '“Simpan” juga tidak berfungsi selama ada kolom berisi nilai yang tidak valid, misalnya situs web yang bukan alamat. “Detail” terbuka otomatis untuk menunjukkannya.',
  'help.guide.tour-edit-saved.tip.1': '“Simpan” tetap abu-abu pada tur yang belum kamu ubah.',
  'help.guide.tour-summary-profile.step.3':
    'Gerakkan kursor di sepanjang “Profil elevasi”. Di sana tampil jarak dan ketinggian di titik itu, dan sebuah titik menandai lokasi yang sama di peta.',
  'help.guide.tour-list-manage.step.1':
    '“Total perjalanan” ada di atas daftar. Saat terlipat, bagian ini menunjukkan jumlah tur dan berapa yang “Direncanakan” dan “Belum direncanakan”. Panah di kanannya membuka satu baris per jenis dengan jumlah jarak, tanjakan, turunan, dan waktunya.',
  'help.guide.tour-list-manage.result':
    'Kamu melihat total untuk tur yang ditampilkan filter, dan setiap tur ada di hari yang kamu inginkan.',
  'help.guide.tour-delete.result': 'Tur hilang dari daftar, peta, dan semua hari.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Hal yang sama terjadi jika kamu mengubah tur di perangkat lain. Tur yang belum kamu ubah langsung dimuat ulang, dan ada keterangan tentang hal itu.',
  'help.ctx.trip-tour-import.bullet.5':
    'Setelah wanderer terhubung di “Pengaturan”, “Integrasi”, tombol wanderer muncul di samping “Rencanakan tur baru” selama tidak ada tur yang terbuka. Tombol itu mencantumkan jalur-jalurmu sendiri untuk diimpor.',
  'help.guide.tour-import-gpx.tip.1':
    'Kamu juga bisa menyeret file dari komputermu ke tab “Tur” dan menjatuhkannya di sana. Pratinjau yang sama akan terbuka.',
  'help.guide.tour-view-import.step.1': 'Di tab “Tur”, klik tur berlencana “Impor GPX” di “Tur dalam perjalanan ini”.',
  'help.guide.tour-plan-from-import.goal':
    'Dapatkan titik jalan yang bisa dipindahkan dari jejak rekaman, dan lihat seberapa dekat rute baru mengikuti jejak itu.',
  'help.guide.tour-plan-from-import.tip.4':
    '“Tur berkuda” tidak punya versi yang bisa diedit: tur itu disimpan persis seperti saat dijalani.',
  'help.guide.tour-restore-recorded.tip.2':
    'Tur yang dibuat dengan “Rencanakan sebagai tur baru” tidak punya jejak rekaman sendiri. Impor asalnya masih ada di daftar.',
  'help.guide.tour-take-over.step.5': 'Beri nama lain di bawah “Nama di perjalanan ini” jika perlu.',
  'help.guide.tour-import-wanderer.step.1':
    'Di tab “Tur”, saat tidak ada tur yang terbuka, klik wanderer di samping “Rencanakan tur baru”.',
  'help.guide.tour-import-wanderer.result':
    'Jalur itu menjadi tur perjalanan dan terbuka di peta sebagai “Tur wanderer”.',
  'help.guide.tour-map-layers.title': 'Memilih peta untuk tur',
  'help.guide.tour-map-layers.tip.3':
    'Tur dayung dan jalan-jalan kota hanya menyediakan “Peta” dan “Satelit”; lari, tur ski, dan tur berkuda menyediakan “Peta”, Topo, dan “Satelit”.',
  'help.guide.tour-along-search.result':
    'Tempat-tempat di sepanjang rute tampil di daftar dan di peta, siap untuk dilihat.',
  'help.guide.tour-along-add-stop.step.3':
    'Klik “Tambahkan sebagai perhentian”. Lencana di sampingnya adalah perkiraan kasar jarak memutarnya, diukur dalam garis lurus.',
  'help.guide.tour-3d-terrain.step.1':
    'Buka tur di tab “Tur”, lalu klik 3D di ujung pil di kiri bawah. Peta miring dan menampilkan medan dalam 3D, dengan rute tergambar di atasnya.',
  'help.guide.tour-3d-terrain.tip.3':
    'Lanskap memerlukan koneksi: data ketinggiannya berasal dari tile medan Mapzen yang terbuka. Tur dayung digambar dengan warnanya sendiri tanpa tingkat kecuraman, karena permukaan air datar.',
  'help.guide.tour-3d-flyover.tip.1':
    'Putar roda mouse selama penerbangan untuk memperbesar atau memperkecil; kamera tetap mengikuti titiknya. Peta tidak bisa diseret sampai kamu menjedanya.',
  'help.guide.tour-map-overlays.step.4':
    'Pada tur dayung, pil itu menawarkan “Rambu laut” sebagai gantinya. Klik untuk menampilkan pelampung, suar, dan tanda pelabuhan di perairan.',
  'help.ctx.trip-tour-stages.bullet.2':
    '“Akhiri etape di sini” di menu “Tindakan lainnya” pada perhentian mengakhiri etape di perhentian itu. “Titik jalan” lalu menampilkan judul Etape N untuk setiap etape beserta jarak dan waktunya, dan perhentian yang mengakhiri etape diberi ikon bulan.',
  'help.guide.tour-multi-day.step.3':
    'Arahkan kursor ke perhentian tempat hari pertama berakhir, klik “Tindakan lainnya”, lalu pilih “Akhiri etape di sini”.',
  'help.guide.tour-multi-day.result':
    'Satu rute dengan etape-etapenya, masing-masing diukur tersendiri. Klik “Simpan” untuk menyimpannya.',
  'help.guide.tour-stages-on-days.step.6':
    'Panah di sampingnya, “Buka etape ini di perencana”, membuka tur di editor pada etape tersebut.',
  'help.ctx.trip-tour-hike.bullet.1':
    '“Jenis tur” di bagian atas editor menentukan cara rute direncanakan. “Pendakian” memakai jalan setapak sampai “Tingkat kesulitan jalur maksimum” di bawah “Detail”; “Lari” memakai jalan yang bisa dilalui sambil berlari dan meminta “Pace rencana”-mu.',
  'help.guide.tour-hike-plan.step.1':
    'Klik “Rencanakan tur baru” di bagian atas kolom kiri. Editor terbuka sebagai “Tur baru”.',
  'help.guide.tour-hike-plan.tip.2':
    'Untuk T4 ke atas, TREK bertanya dulu “Aktifkan perhitungan rute alpin?”. Konfirmasi hanya jika rute boleh melewati medan yang terbuka atau tanpa penanda; pertanyaan ini muncul sekali setiap sesi pengeditan.',
  'help.guide.tour-hike-trail-details.step.4':
    'Klik salah satu tingkat di daftar agar hanya bagian itu yang tampil di peta. Klik lagi untuk menampilkan seluruh rute.',
  'help.guide.tour-hike-round.step.1':
    'Saat pendakian terbuka, klik “Rute melingkar dari awal” di header kartu “Titik jalan”. Dari perhentian lain, buka “Tindakan lainnya” miliknya dan pilih “Rute melingkar dari sini”.',
  'help.guide.tour-hike-round.tip.3':
    '“Cari lagi” kembali ke pilihan jarak, dan “Batal” menutup kartu tanpa mengubah apa pun.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Fitur ini hanya ada untuk pendakian, dan hanya untuk ruas yang direncanakan router, bukan yang digambar dengan tangan.',
  'help.guide.tour-ferrata-add.step.4':
    'Di “Titik jalan”, ruas di antara kedua titik itu menampilkan nama, tingkat kesulitan, dan panjang via ferrata.',
  'help.guide.tour-run-plan.goal':
    'Rencanakan rute lari di jalan yang bisa dilalui sambil berlari, dan dapatkan durasinya dari pace-mu.',
  'help.guide.tour-run-plan.tip.2':
    'Tanjakan, turunan, dan tingkat teknis jalan tidak ikut dihitung: durasinya hanya jarak dikali pace.',
  'help.guide.tour-run-ways.result':
    'Sebelum berangkat, kamu sudah tahu bagian mana dari rute lari yang tidak beraspal.',
  'help.ctx.trip-tour-walk.bullet.4':
    '“Di sepanjang tur” mencari objek wisata menurut “Tema rute” dalam jarak tertentu dari rute, dan “Tambahkan sebagai perhentian” memasukkannya ke jalan-jalan di posisi yang kamu pilih.',
  'help.guide.tour-walk-plan.step.5':
    'Atur “Tingkat penting” ke “Biasa”, “Opsional”, atau “Wajib dikunjungi”. Aktifkan “Dilindungi” untuk perhentian yang harus tetap di posisinya jika nanti ada usulan perubahan, lalu klik “Simpan”.',
  'help.guide.tour-walk-sights.step.1':
    'Saat jalan-jalan kota terbuka, cari “Di sepanjang tur” di kolom kiri dan pilih “Tema rute”: “Budaya dan sejarah”, “Taman dan pemandangan”, “Kuliner dan kehidupan lokal”, atau “Sedikit dari semuanya”.',
  'help.guide.tour-walk-sights.result':
    'Objek wisata itu menjadi perhentian jalan-jalan, dimasukkan ke rute di antara perhentian yang kamu pilih.',
  'help.guide.tour-walk-day-times.tip.2':
    'Jika ada perhentian yang belum punya lama singgah, jam tiba sesudahnya ditampilkan sebagai waktu paling awal yang mungkin.',
  'help.guide.tour-walk-google-import.step.3':
    'Periksa “Titik singgah dalam tautan”. Perhentian yang tidak punya posisi di tautan ditandai dan dilewatkan.',
  'help.guide.tour-walk-check-off.step.1':
    'Di tab “Rencana”, klik jalan-jalan kota di harinya. Kartunya terbuka di samping peta.',
  'help.ctx.trip-tour-bike.title': 'Tur sepeda',
  'help.guide.tour-bike-profile.step.1': 'Di tab “Tur”, klik “Rencanakan tur baru” di bagian atas rel kiri.',
  'help.guide.tour-bike-profile.tip.2':
    'Profil hanya mengarahkan router. Profil tidak menunjukkan apakah suatu jalan bisa dilalui sepeda: kartu “Permukaan dan jalan” menunjukkan jenis jalan yang dilalui rute.',
  'help.guide.tour-bike-surfaces.step.3':
    'Di bawah “Permukaan”, klik baris seperti Gravel atau “Tanah alami”. Bagian-bagiannya disorot di peta. Klik baris itu lagi untuk menghapus sorotannya.',
  'help.guide.tour-bike-mtb-grades.goal': 'Lihat seberapa sulit jalur di tur MTB sebelum kamu menempuhnya.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Ganti “Profil” dari MTB ke profil lain, dan bagian tingkat jalurnya hilang. Rutenya lalu direncanakan ulang sesuai profil baru.',
  'help.guide.tour-ski-plan.title': 'Merencanakan tur ski dan musim dingin',
  'help.guide.tour-ski-plan.tip.1':
    'Untuk “Ski lintas alam”, pilih juga “Teknik”: “Klasik”, “Gaya bebas”, atau “Tidak diketahui”. Pemberitahuan di bawah kolom-kolomnya menunjukkan apa yang masih kurang.',
  'help.guide.tour-ski-options.step.2':
    'Buka “Lintasan tersulit” dan pilih tingkat tertinggi yang ingin kamu luncuri, dari “Pemula” sampai “Ahli”. Defaultnya “Menengah”.',
  'help.guide.tour-ski-fix-leg.title': 'Memperbaiki ruas ski yang tidak bisa direncanakan',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Selama belum semua ruas direncanakan, kartu “Rute lintasan” menunjukkan bahwa waktu ski belum tersedia.',
  'help.guide.tour-ski-summary.tip.2':
    '“Waktu ski” tetap “Tidak dihitung” sampai semua ruas direncanakan. Untuk tetap memberi tur durasi, isi total rencana di detailnya.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Keterangannya menampilkan lintasan turun menurut tingkat kesulitan, jalur ski lintas alam, jalur musim dingin dan sepatu salju, lintasan kereta luncur, dan lift. “Keterangan lengkap di OpenSnowMap” membuka keterangan selengkapnya.',
  'help.guide.tour-ski-import.step.2': 'Di “Pratinjau impor”, buka “Impor sebagai” dan pilih “Ski & musim dingin”.',
  'help.guide.tour-ski-import.result':
    'Jejaknya ada di “Tur dalam perjalanan ini”, dengan disiplin dan tekniknya di kartu “Jalur ski”.',
  'help.ctx.trip-tour-paddle.bullet.6':
    '“Mendayung punya risiko”, baris di bagian bawah kolom kiri, membuka “Keselamatan di air”. Petanya menyediakan “Peta” dan “Satelit”, serta “Rambu laut” sebagai lapisan tambahan.',
  'help.guide.tour-paddle-setup.step.6':
    '“Kecepatan mendayung” menampilkan saran sesuai perahu dalam warna abu-abu. Ketik kecepatanmu sendiri, dan kolomnya bertuliskan “Kecepatan sendiri”; tautan di bawahnya, Pakai yang disarankan, mengembalikan kecepatan sesuai perahu.',
  'help.guide.tour-paddle-water-route.goal':
    'Biarkan TREK merencanakan ruas menyusuri sungai atau danau, dan pahami keterangan pada ruas yang tidak bisa direncanakannya.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Keterangan di bawah ruas yang direncanakan menandai arus deras (whitewater) beserta tingkatnya, “Jalur perahu”, atau “Celah di data peta” yang dijembatani dengan garis lurus.',
  'help.guide.tour-paddle-portage.step.4':
    'Di bawah “Rute”, “Ikuti jalan setapak” memakai jalan yang ada di peta, dan “Garis lurus” langsung memotong. TREK mencari jalan setapaknya sendiri dan memberi tahu jika tidak ada jalan tanpa memutar jauh.',
  'help.guide.tour-paddle-lock.step.1':
    'Arahkan kursor ke perhentian di pintu air, lalu klik “Tindakan lainnya”, ikon tiga titik.',
  'help.guide.tour-paddle-time.title': 'Membaca dan menyesuaikan durasi tur dayung',
  'help.guide.tour-paddle-time.tip.2': 'Arus dan angin tidak ikut dihitung dalam perkiraan.',
  'help.guide.tour-paddle-wind.step.4':
    'Buka “Arti angin saat mendayung” untuk mengetahui pengaruh angin depan, angin samping, penyeberangan di perairan terbuka, dan embusan pada perahu.',
  'help.guide.tour-paddle-checklist.step.1':
    'Simpan tur dayung, lalu cari “Daftar periksa” di kolom kiri. Lencana di header-nya merangkum status daftar itu.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Data rintangan berasal dari OpenStreetMap untuk wilayah yang dimiliki TREK. Jika datanya tidak ada, kartu memberi tahu hal itu, dan kamu perlu memeriksa sendiri bendungan, pintu air, dan angkut perahunya.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Klik jejaknya di “Tur dalam perjalanan ini”. Kolom kiri menampilkannya persis seperti rekamannya, dengan kartu “Angkut perahu dan pintu air”.',
  'help.ctx.trip-tour-horse.title': 'Tur berkuda',
  'help.guide.tour-horse-plan.goal': 'Susun tur berkuda dari bagian-bagian rute berkuda bertanda di tampilan peta.',
  'help.guide.tour-horse-plan.result':
    'Tur berkuda mengikuti bagian-bagian yang kamu ambil, masing-masing dengan nama rute, titik akses, dan panjangnya, dan tercantum di bawah “Tur dalam perjalanan ini”.',
  'help.guide.tour-horse-gap.step.1':
    'Setelah ada satu bagian di tur berkuda, buka rute lain dan pilih bagian yang tidak bersambung dengan titik akhir tur berkudamu. Di bawah “Sambungan ke tur Anda”, sebuah pemberitahuan menunjukkan seberapa jauh jaraknya.',
  'help.guide.tour-horse-recorded.title': 'Menyimpan tur berkuda hasil rekaman dari file GPX',
  'help.guide.tour-horse-recorded.tip.2':
    'File tanpa data ketinggian menampilkan “Tidak ada ketinggian di berkas”, bukan tanjakan nol.',
  'help.guide.dateless-trip.tip.1':
    'Begitu kamu tahu kapan berangkat, buka formulirnya lewat ikon pensil di kartu dan pilih tanggalnya. Hari-hari yang sudah kamu rencanakan tetap urut dan mendapat tanggal sesuai urutan itu.',
  'help.guide.trip-reminder.goal': 'Dapatkan pengingat beberapa hari sebelum berangkat.',
  'help.guide.upcoming-reservations.tip.2':
    '“Menunggu” menandai pemesanan yang belum dikonfirmasi. Pemesanan yang dibatalkan dan perjalanan yang diarsipkan tidak ditampilkan.',
  'help.guide.half-company-holiday.tip.1':
    'Cuti yang sudah dicatat di hari itu dipotong menjadi setengah hari. Siapa pun yang mencatat cuti di hari itu nanti hanya memakai 0,5 hari.',
  'help.guide.edit-holiday-calendar.goal':
    'Ganti nama, ganti warna, pindahkan, atau hapus kalender hari libur nasional atau liburan sekolah yang kamu tambahkan.',
  'help.guide.person-color.title': 'Mengubah warna seseorang',
  'help.guide.answer-fusion-request.tip.1':
    'Permintaan tetap terbuka sampai kamu menjawabnya. Jika ada beberapa permintaan, semuanya muncul satu per satu.',
  'help.guide.log-for-partner.tip.1': '“Setengah hari” dan “Pengganti / Fleksi” juga berlaku untuk orang yang dipilih.',
  'help.guide.dissolve-fusion.tip.2': 'Kalau kamu hanya ingin orang lain melihat hari-harimu, bagikan kalendermu saja.',
  'help.guide.country-details.tip.2':
    'Klik lencana “Tempat” untuk melihat semua tempat yang dihitung untuk negara itu, dikelompokkan per perjalanan.',
  'help.guide.country-places.tip.2':
    'Lencana ini hanya muncul jika negara itu punya tempat sendiri. Negara yang hanya kamu tandai secara manual tidak punya tempat.',
  'help.guide.tour-activity-stats.goal':
    'Lihat jarak, tanjakan, dan jumlah tur yang sudah kamu jalani di semua perjalananmu, untuk periode dan jenis tertentu, dan kecualikan tur yang batal.',
  'help.guide.tour-activity-stats.tip.1':
    'Tur baru dihitung setelah hari terakhirnya lewat. Tur yang tidak ada di hari mana pun, atau hanya ada di hari tanpa tanggal, tidak pernah dihitung. Agar dihitung, masukkan tur itu ke hari bertanggal di perjalanannya.',
  'help.guide.move-to-list.result':
    'Tempat-tempatnya sudah ada di daftar lain, dan keterangan singkat menyebutkan berapa yang dipindahkan atau diduplikat.',
  'help.guide.accept-list-invite.tip.1':
    'Apa yang bisa kamu lakukan di daftar itu tergantung peran yang diberikan pemilik: “Peninjau”, Editor, atau Admin.',
  'help.guide.tour-collection-add-to-trip.title': 'Menambahkan tur dari daftar ke perjalanan',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Untuk menyimpan tur ke daftar, buka tur yang tersimpan di perjalanan dan klik “Koleksi” di bagian bawahnya.',
  'help.guide.tour-collection-manage.tip.2': 'Hanya pemilik dan admin daftar yang melihat ikon tempat sampah.',
  'help.guide.entry-draft.result':
    'Entri tetap ada di linimasamu dengan tanda “Draf”, dan tidak tampil di tautan yang dibagikan.',
  'help.guide.journey-map-layers.title': 'Memilih isi peta journey',
  'help.guide.journey-keep-route.title': 'Menyimpan rute yang kamu rekam pada suatu hari',
  'help.guide.journey-day-stays.title': 'Menulis entri dari persinggahan yang direkam Dawarich',
  'help.guide.journey-take-over-day.title': 'Mengambil satu hari rekaman sekaligus',
  'help.guide.journey-take-over-day.result':
    'Hari itu sekarang punya satu draf untuk setiap persinggahan atau kelompok gabungan, atau satu laporan harian, dan persinggahannya tidak lagi tercantum sebagai belum diputuskan.',
  'help.guide.journey-auto-prepare.result':
    'Selama perjalanan yang ditautkan berlangsung, persinggahan setiap hari dicantumkan di hari itu, siap untuk “Ambil hari”.',
  'help.ctx.settings-about.title': 'Tentang',
  'help.guide.web-push-device.tip.3':
    'Push hanya berfungsi jika TREK dibuka lewat HTTPS. Jika notifikasi diblokir, izinkan di pengaturan browser, lalu coba lagi.',
  'help.guide.connect-airtrail.result':
    'Lencananya menampilkan “Terhubung”, dan tab “Transportasi” di perjalanan menawarkan “Impor dari AirTrail”.',
  'help.guide.connect-dawarich.result':
    'Lencananya menampilkan “Terhubung”, dan perencana perjalanan, jurnal, serta Atlas bisa menawarkan data yang direkam Dawarich.',
  'help.guide.tour-connect-wanderer.result':
    'Lencananya menampilkan “Terhubung”, dan tab “Tur” di perjalanan bisa mencari di wanderer-mu dan mengimpor jalurnya.',
  'help.guide.tour-wanderer-watch.result':
    'TREK memeriksa jalur yang kamu impor dan memberi tahu jika ada yang mungkin berubah. Tur hanya berubah jika kamu menerima perubahannya.',
  'help.guide.plugin-settings.step.1':
    'Buka Plugin di sidebar pengaturan. Di bawah “Pengaturan plugin”, setiap plugin yang memerlukan isian darimu punya kartu dengan kolom-kolomnya: isi, lalu klik “Simpan”. “Tindakan” di kartu dijalankan setelah kamu konfirmasi.',
  'help.guide.profile.step.3': 'Klik “Simpan Profil” di kanan bawah kartu.',
  'help.guide.default-user-settings.title': 'Mengatur pengaturan awal untuk pengguna baru',
  'help.guide.own-routing-engine.tip.1':
    'Server OSRM publik hanya mengizinkan sekitar satu permintaan per detik. Itu cukup untuk satu hari, tapi bisa terlalu lambat untuk road trip.',
  'help.guide.admin-passkeys.goal': 'Izinkan orang masuk dengan sidik jari, wajah, atau PIN perangkat.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Untuk mengeluarkan satu orang saja, beri dia “Kata Sandi Baru” di “Edit Pengguna”. Cara ini hanya mengakhiri sesi orang itu.',
  'help.guide.notification-defaults.goal':
    'Tentukan pengaturan awal notifikasi untuk setiap pengguna, dan blokir saluran untuk suatu peristiwa sepenuhnya.',
  'help.ctx.notifications.summary':
    'Semua notifikasi yang ditampilkan TREK di dalam aplikasi, mulai dari yang terbaru: pemesanan yang diubah seseorang, pesan baru di obrolan perjalanan, kalender yang dibagikan kepadamu. Ikon lonceng di kanan atas menampilkan sepuluh yang terbaru, halaman ini menampilkan semuanya.',
  'help.guide.read-notifications.step.1':
    'Klik ikon lonceng di kanan atas. Angka merah di atasnya menunjukkan jumlah notifikasi yang belum kamu baca.',
  'help.guide.filter-notifications.step.1': 'Klik ikon lonceng di kanan atas.',
  'help.guide.mark-notifications-read.step.2':
    'Klik “Tandai semua dibaca” di bagian atas untuk menandai semua notifikasi sudah dibaca sekaligus.',
  'help.guide.delete-notifications.tip.1':
    'Menghapus notifikasi hanya berlaku untukmu. Pemesanan, pesan, atau berbagi yang dimaksud tetap seperti semula.',
  'help.guide.notification-settings.tip.1':
    'Ikon gembok di sebuah sel berarti admin mematikan peristiwa itu untuk semua orang.',
  'help.guide.add-guest.tip.3':
    'Hanya pemilik perjalanan yang bisa menambah, mengganti nama, dan menghapus tamu. Tamu yang membayar suatu pengeluaran baru bisa dihapus setelah kamu mengganti pembayarnya atau menghapus pembayaran itu.',
  'help.guide.link-journal.tip.1':
    'Kamu hanya bisa menautkan jurnal milikmu sendiri. Jurnal yang hanya bisa kamu isi tidak bisa ditautkan.',
  'help.ctx.trip-places.bullet.7':
    'Centang di samping pencarian untuk mulai memilih. Pakai bar di bagian bawah kolom untuk memberi kategori baru ke beberapa baris sekaligus, menambahkannya ke koleksi, menandainya sudah dikunjungi, atau menghapusnya.',
  'help.guide.filter-places.step.5':
    'Jika perjalanan mencakup lebih dari satu negara atau wilayah, ikon globe menyaring daftar ke satu negara, atau satu wilayah di dalamnya, masing-masing dengan jumlahnya. “Hapus filter” mengembalikannya ke “Semua negara”.',
  'help.guide.import-places-file.tip.3':
    'Jika Tur aktif, yang merupakan default, file diimpor lewat “Tur” di bagian atas kolom, dengan “Impor GPX atau KML”, dan garis-garisnya menjadi tur. Pin di dalam file tidak diimpor di sana, karena tur hanya berisi garis.',
  'help.guide.dawarich-stays.step.3':
    'Periksa “Nama”, “Tiba”, dan “Pergi”, pilih “Hari” atau biarkan “Belum pada suatu hari”, tambahkan “Catatan” jika perlu, lalu klik “Tambah tempat”.',
  'help.guide.leave-stop-off-route.result':
    'Perhentian itu tetap menjadi bagian dari hari dan PDF-nya; selama ditandai “Di luar rute”, rute langsung menyambung dari perhentian sebelumnya ke perhentian sesudahnya.',
  'help.guide.move-booking-day.tip.2':
    'Di harinya sendiri, pemesanan yang punya jam selalu kembali ke posisi sesuai jamnya.',
  'help.guide.place-image-from-file.step.3':
    'Di bawah “Dari berkas terlampir”, klik foto yang kamu mau. “Unggah dari perangkat” di atasnya untuk memilih foto baru dari komputermu.',
  'help.guide.place-own-hours.step.1': 'Buka tempatnya dan klik “Edit” di kanan bawah kartu. Formulir tempat terbuka.',
  'help.guide.place-own-hours.tip.3':
    'Klik “Hapus jam buka”, lalu “Perbarui”, untuk menampilkan lagi jam buka hasil pencarian otomatis di kartu.',
  'help.guide.confirm-stay-booking.title': 'Mengonfirmasi pemesanan penginapan',
  'help.guide.confirm-stay-booking.tip.2':
    'Pil yang sama berfungsi di setiap pemesanan, termasuk pemesanan di bawah “Reservasi” pada hari itu.',
  'help.guide.map-lock.tip.2':
    'Browser ini mengingat status kunci untuk setiap perjalanan. Saat kamu membuka perjalanan, peta tetap memperbesar ke perjalanan itu sekali, jadi peta tidak pernah terbuka di area kosong.',
  'help.guide.tour-map-lines.step.2':
    'Klik garisnya, atau pin di titik awalnya. Kartu tur terbuka di bagian bawah peta, dan garisnya digambar lebih tebal dengan tepi putih, jadi mudah terlihat di antara garis lainnya. X di header kartu untuk menutupnya.',
  'help.guide.car-stops.title': 'Merencanakan perjalanan bermobil dengan perhentian di jalan',
  'help.guide.car-stops.result':
    'Perjalanan itu tampil sebagai kartu di tab “Transportasi” dan baris di harinya, dan garisnya di peta berjalan dari tempat penjemputan melewati setiap perhentian sesuai urutannya, sampai tempat pengembalian.',
  'help.guide.transport-details.step.5':
    '“Di peta” di bagian bawah detail menampilkan garis perjalanan dan membuka “Rencana” di harinya. “Edit” di paling kanan membuka formulir lengkap, dan ikon tempat sampah di sampingnya menghapus perjalanan setelah kamu konfirmasi.',
  'help.guide.export-transports-csv.step.1':
    'Saring daftarnya dulu jika kamu hanya mau sebagian. “Cari”, Filter, dan urutan di “Opsi tampilan” semuanya berpengaruh: file berisi apa yang tampil di tab, dengan urutan yang sama.',
  'help.guide.group-sort-bookings.tip.1':
    '“Kartu” dan “Daftar” punya pengelompokannya sendiri: “Kartu” dimulai dengan Status, “Daftar” dengan “Hari”. Titik pada “Opsi tampilan” menandakan ada pengaturan yang berbeda dari default, dan “Atur ulang tampilan” di bagian bawah panel mengembalikan default-nya.',
  'help.guide.booking-on-map.step.2': 'Klik “Di peta” di bagian bawah detail.',
  'help.guide.export-bookings-csv.goal':
    'Ekspor pemesanan perjalanan sebagai file CSV untuk dibuka di Excel, Numbers, atau aplikasi spreadsheet lain.',
  'help.guide.arrange-packing-list.goal':
    'Pindahkan seluruh daftar atau satu per satu item ke posisi yang kamu mau, atau lihat setiap daftar sesuai urutan nama.',
  'help.guide.check-off-packing.tip.4':
    'Untuk item yang jumlahnya lebih dari satu, kamu juga bisa menandai barangnya satu per satu sebagai sudah dikemas. Lihat Kemas beberapa barang yang sama.',
  'help.guide.count-packed-pieces.tip.1':
    'Mencentang kotak menandai semua barang sudah dikemas sekaligus, dan menghapus centangnya membatalkan semuanya lagi.',
  'help.guide.expense-receipts.goal':
    'Simpan kuitansi atau faktur bersama pengeluarannya, dan buka lagi dari buku kas.',
  'help.guide.expense-receipts.tip.2':
    'Ikon tempat sampah di samping kuitansi melepasnya dari pengeluaran saat kamu menyimpan. Filenya sendiri tetap ada di “File”; hapus di sana jika ingin menghapusnya sepenuhnya.',
  'help.guide.files-sync.tip.4':
    'Jika kartu menampilkan pemberitahuan kuning dengan “Hubungkan ulang”, penyimpanan tidak lagi menerima login yang tersimpan. Klik “Hubungkan ulang”, masukkan kata sandi aplikasi atau token baru, dan sinkronisasi berjalan lagi.',
  'help.guide.files-sync-settings.result':
    'Mulai sinkronisasi berikutnya, perjalanan hanya disinkronkan ke arah yang kamu pilih, dan penghapusan serta perubahan yang bentrok ditangani sesuai aturan yang kamu tetapkan.',
  'help.guide.manage-notes.result':
    'Catatan itu hilang dari kartu “Catatan” untuk semua anggota sekaligus. Catatan yang hanya kamu sematkan atau ubah tetap ada, dan anggota lain melihatnya seperti yang kamu tinggalkan.',
  'help.guide.note-categories.step.4':
    'Titik-titik warna di satu baris mengatur warna kategori itu: Indigo, “Merah”, Kuning, Zamrud, “Biru”, atau Ungu. Di sini, “Akomodasi” berubah menjadi kuning.',
  'help.guide.roadtrip-reorder.step.3':
    'Dengan keyboard, fokuskan perhentian lalu tekan Alt dan panah atas atau bawah untuk memindahkannya satu posisi di harinya.',
  'help.guide.roadtrip-overnight.title': 'Menginap semalam di sepanjang rute',
  'help.guide.roadtrip-overnight.tip.1':
    'Penginapan berlaku sampai hari berikutnya. Untuk tanggal lain, ubah pemesanannya: ganti tanggalnya di bawah “Hari”, bersama data penginapan lainnya.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Lencana hanya muncul di perhentian tempat mobilmu bisa mengisi ulang: perhentian bahan bakar untuk “Bensin”, perhentian isi daya untuk “Listrik”, dan keduanya untuk “Keduanya”.',
  'help.guide.roadtrip-bookings.result':
    'Setiap perjalanan yang dipesan muncul di perjalanan darat pada titik terjadinya, dan rute sebelum dan sesudahnya menuju dan berangkat dari terminalnya.',
  'help.guide.roadtrip-google-import.step.1':
    'Klik tiga titik di bagian atas “Di sepanjang rute”, lalu pilih “Impor rute Google Maps”.',
  'help.guide.roadtrip-hazards.title': 'Menampilkan peringatan terkini di peta',
  'help.guide.roadtrip-hazards.tip.3':
    'Data peringatan diperbarui setiap sepuluh menit dan memerlukan koneksi. Seperti pengaturan berkendara lainnya, sakelarnya disimpan untuk perjalanan itu.',
  'help.ctx.trip-tours.bullet.6':
    'Mengubah rute dan menghapus tur dilakukan di tab “Tur”, di bawah “Tur dalam perjalanan ini”.',
  'help.guide.tour-show-list.tip.1': 'Klik garis tur di peta, dan daftarnya menandai tur itu lalu menggulir ke sana.',
  'help.guide.tour-add-to-day.step.3':
    'Keterangan Ditambahkan ke hari 10 mengonfirmasinya, baris itu mendapat lencana hari, dan hari di kolom kiri mencantumkan tur beserta waktu, jarak, dan tanjakannya.',
  'help.guide.tour-day-times.title': 'Memberi tur jam mulai di harinya',
  'help.guide.tour-day-times.tip.3':
    '“Keluarkan dari rute” di menu yang sama membiarkan tur tetap di hari itu, tapi tidak memasukkannya ke rute hari itu di peta. “Masukkan kembali ke rute” membatalkannya.',
  'help.guide.tour-remove-from-day.tip.1':
    'Tur beberapa hari dikeluarkan satu hari demi satu hari, karena setiap hari punya etapenya sendiri.',
  'help.guide.tour-filter-list.step.4':
    'Tutup menunya. Tombolnya sekarang menampilkan status, jumlah tur yang tersisa, dan +1 untuk setiap filter tambahan yang kamu atur.',
  'help.guide.tour-hide-on-map.step.2':
    'Garis tur disembunyikan dari peta. Barisnya tetap ada di daftar dalam keadaan redup, dengan ikon mata dicoret (“Tampilkan di peta”). Klik ikon itu untuk menampilkan garisnya lagi.',
  'help.guide.tour-import-plan-tab.step.2':
    'Klik “Impor GPX atau KML” di bagian atas daftar, lalu pilih filemu (GPX, KML, atau KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'Header menampilkan kotak bulat tur, namanya dengan ikon pensil untuk menggantinya, titik berwarna untuk warna garisnya, dan pil untuk jenis, asal, rencana durasi, jarak, tanjakan, dan turunan. X di kanan menutup kartu, begitu juga tombol Escape.',
  'help.guide.tour-detail-read.step.3':
    'Arahkan kursor ke waktunya untuk melihat rinciannya: waktu bergerak, istirahat, dan total yang direncanakan.',
  'help.guide.tour-detail-read.tip.4':
    'Kartu ini tidak mengubah rute. Untuk memindahkan titik atau menggambar ulang ruas, buka tab “Tur” dan klik tur itu di bawah “Tur dalam perjalanan ini”.',
  'help.guide.tour-rename-colour.step.4':
    'Pilih warna. “Warna otomatis”, kotak pertama, mengembalikan garis ke warna default-nya, dan “Pilih warna kustom”, kotak terakhir, memungkinkanmu memilih warna apa pun. Garis di peta dan strip di daftar “Tur” langsung berubah.',
  'help.guide.tour-take-along.step.3':
    'Klik GPX untuk mengunduh tur yang tersimpan sebagai file GPX: seluruh rutenya beserta data ketinggiannya, siap dipakai di aplikasi navigasi atau perangkat GPS.',
  'help.guide.tour-copy-keep.step.1':
    'Buka kartu tur dan klik “Salin” di bagian bawah. TREK membuat tur baru yang berdiri sendiri tanpa harinya, dan tur aslinya tetap seperti semula.',
  'help.guide.tour-copy-keep.result':
    'Perjalanan punya tur kedua yang bisa diubah sesukamu, dan koleksi menyimpan salinannya sendiri, siap ditambahkan ke perjalanan lain.',
  'help.guide.tour-packing-link.tip.1':
    'Ini hanya tautan. Tidak ada yang disalin atau dipindahkan, dan item tetap ada di “Daftar”. Centang item di sana, dan tur langsung menampilkannya.',
  'help.guide.tour-files.step.3': 'Klik file untuk membukanya.',
  'help.guide.tour-activity-link.step.3':
    'Pilih rekamannya di bawah “Jalur”, atau klik “Impor GPX” untuk memasukkan file baru.',
  'help.guide.tour-activity-compare.goal':
    'Lihat di bagian mana jejak aktual berbeda dari rencana, lalu ganti atau lepaskan tautannya.',
  'help.guide.tour-origin-check.title': 'Melihat asal sebuah tur',
  'help.guide.tour-origin-check.result':
    'Kamu tahu dari mana tur berasal, kapan, dan apakah sudah berubah sejak saat itu.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Draf yang belum disimpan tetap tersimpan: buka lagi tab “Tur”, dan draf itu dipulihkan dengan tanda “Draf yang belum disimpan telah dipulihkan”. “Kembali ke daftar tur” dan “Buang” bertanya dulu sebelum membuang perubahan.',
  'help.guide.tour-open-workspace.step.6':
    'Pil di kiri bawah untuk mengganti peta, awalnya “Peta” atau “Satelit”. Saat ada tur yang terbuka, pil itu menawarkan peta sesuai jenis turnya, misalnya Topo atau “Pendakian”, serta sakelar seperti “Tempatkan titik” dan 3D.',
  'help.guide.tour-draw-route.step.1':
    'Klik “Rencanakan tur baru” di bagian atas rel kiri. Rel berubah menjadi “Tur baru”, berupa pendakian kecuali kamu memilih jenis lain.',
  'help.guide.tour-draw-route.tip.3':
    'Jika draf punya perubahan yang belum disimpan, “Rencanakan tur baru” di menu “Tambah tur” bertanya dulu: “Mulai tur baru?”, dengan pilihan “Buang dan mulai”.',
  'help.guide.tour-type-profile.step.4':
    'Rute direncanakan ulang sesuai profil itu, dan “Ringkasan tur” di kanan menampilkan jarak dan waktunya.',
  'help.guide.tour-edit-points.step.3':
    'Untuk mengubah urutan, arahkan kursor ke sebuah baris dan seret lewat pegangan yang muncul di tepi kirinya.',
  'help.guide.tour-shaping-points.goal': 'Pindahkan rute ke jalan lain tanpa menambah perhentian.',
  'help.guide.tour-shaping-points.result':
    'Rute melewati jalan tempat kamu menyeretnya, dan nomor perhentian tetap seperti sebelumnya.',
  'help.guide.tour-loop-reverse.tip.3':
    'Pada pendakian, “Rute melingkar dari awal” di sampingnya mencarikan pendakian melingkar dengan panjang pilihanmu.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Ruas yang digambar dengan tangan tidak diperiksa router: ruas itu bisa saja melintasi perairan, lahan pribadi, atau tebing.',
  'help.guide.tour-trip-places.step.4':
    'Barisnya bertuliskan “Tempat perjalanan” di bawah nama. “Lepas dari tempat” di “Tindakan lainnya” mempertahankan titiknya tapi menghapus tautannya.',
  'help.guide.tour-details-times.step.2': 'Di bawah “Detail”, tulis “Deskripsi” dan tambahkan Situs web jika ada.',
  'help.guide.tour-save.goal': 'Simpan tur yang sudah digambar ke perjalanan.',
  'help.guide.tour-save.result': 'Tur tersimpan di perjalanan, siap dimasukkan ke suatu hari.',
  'help.guide.tour-edit-saved.tip.2':
    'Jejak GPX atau KML hasil impor terbuka sebagai “Tur GPX”, untuk dilihat saja. “Rencanakan versi yang dapat diedit” di sana membuat tur yang bisa kamu ubah.',
  'help.guide.tour-summary-profile.step.4':
    '“Ciutkan profil elevasi”, panah di samping judulnya, menyembunyikan profil; klik lagi untuk menampilkannya.',
  'help.guide.tour-list-manage.step.2':
    'Arahkan kursor ke tur dan klik tanda plus bulat di barisnya, “Tambah ke hari ini”, untuk membuka daftar hari perjalanan.',
  'help.guide.tour-delete.title': 'Menghapus tur',
  'help.guide.tour-saved-elsewhere.title': 'Jika tur disimpan di tempat lain',
  'help.guide.tour-saved-elsewhere.result':
    'Tidak ada perubahan yang hilang, kecuali ada yang sengaja memilih untuk membuangnya.',
  'help.guide.tour-import-gpx.title': 'Mengimpor file GPX, KML, atau KMZ sebagai tur',
  'help.guide.tour-import-gpx.tip.2':
    'Setiap jejak atau rute dalam file menjadi tur tersendiri. Jejak tidak pernah digabungkan.',
  'help.guide.tour-view-import.step.2':
    'Kolom kiri menampilkannya sebagai “Tur GPX”: “Ringkasan tur” dengan jarak, ketinggian, dan waktu rekamannya, serta profil elevasi di bawahnya. Peta menampilkan garisnya.',
  'help.guide.tour-plan-from-import.step.1':
    'Buka tur hasil impor di tab “Tur”. Di kartu “Versi yang dapat diedit” di kiri, klik “Rencanakan versi yang dapat diedit”.',
  'help.guide.tour-plan-from-import.result':
    'Tur sekarang punya titik jalan yang bisa diseret, dan “Asal”-nya bertuliskan “Direncanakan ulang, jejak rekaman disimpan”.',
  'help.guide.tour-restore-recorded.result': 'Tur kembali menjadi “Tur GPX” dan menampilkan garis sesuai rekamannya.',
  'help.guide.tour-take-over.step.6': 'Klik “Ambil”.',
  'help.guide.tour-import-wanderer.step.2':
    'Ketik di “Cari jalur”. “Cari di area peta ini” hanya menampilkan jalur yang ada di bagian peta yang terlihat.',
  'help.ctx.trip-tour-map.title': 'Peta tur',
  'help.guide.tour-map-layers.goal':
    'Rencanakan di peta yang paling cocok untuk jenis turnya: garis kontur untuk tanjakan, jalur bertanda atau rute sepeda, atau citra udara.',
  'help.guide.tour-along-search.title': 'Mencari tempat di sepanjang tur',
  'help.guide.tour-along-search.tip.1':
    'Setelah kamu mengubah rute, jenis tempat, atau jaraknya, “Cari lagi” disorot dan memberi tahu bahwa daftar itu dicari untuk rute sebelumnya. Klik untuk memperbarui daftarnya.',
  'help.guide.tour-along-add-stop.step.4':
    'Rute direncanakan ulang melewati tempat itu, dan “Di sepanjang tur” menunjukkan berapa jarak dan waktu yang bertambah. “Urungkan” di baris yang sama menghapus perhentian itu lagi.',
  'help.guide.tour-3d-terrain.step.2':
    'Rute diwarnai sesuai kemiringannya. Klik “Kemiringan” di baris bawah untuk menggambarnya dengan warna tur, dan klik lagi untuk menampilkan kemiringannya kembali.',
  'help.guide.tour-3d-flyover.title': 'Terbang menyusuri tur',
  'help.guide.tour-3d-flyover.tip.2':
    'Penerbangan baru dimulai setelah lanskap di sepanjang seluruh rute selesai dimuat, jadi tidak berhenti di tengah jalan untuk memuat data peta. Arahkan kursor ke lingkarannya untuk melihat berapa yang sudah dimuat.',
  'help.guide.tour-map-overlays.result':
    'Lintasan ski atau rambu laut digambar di atas peta, dan legendanya menjelaskan artinya.',
  'help.ctx.trip-tour-stages.bullet.3':
    '“Ringkasan tur” mencantumkan setiap etape di bawah “Etape”, dari perhentian awal sampai perhentian akhirnya. Klik etape untuk memilih perhentian terakhirnya dan menandai posisinya di profil elevasi.',
  'help.guide.tour-multi-day.step.4':
    '“Titik jalan” sekarang terbagi menjadi Etape 1 dan Etape 2, masing-masing dengan jarak dan waktunya. Perhentian yang mengakhiri etape diberi ikon bulan.',
  'help.guide.tour-stages-on-days.title': 'Memasukkan tur beberapa hari ke hari-hari perjalanan',
  'help.guide.tour-stages-on-days.tip.1':
    'Jika perjalanan berakhir sebelum etape terakhir, pilihannya menyebutkan etape terakhir yang masih muat. Etape sesudahnya tidak mendapat hari.',
  'help.ctx.trip-tour-hike.bullet.2':
    '“Titik jalan” mencantumkan perhentian secara berurutan. “Tambah titik” aktif sejak awal, jadi klik di peta menempatkan titik berikutnya; “Tempat perjalanan” di sampingnya menjadikan pondok atau hotel dalam perjalanan sebagai perhentian.',
  'help.guide.tour-hike-plan.step.2':
    'Buka “Jenis tur” dan pilih “Pendakian”: berjalan kaki, dalam batas tingkat kesulitan yang kamu tentukan.',
  'help.guide.tour-hike-plan.tip.3':
    '“Pilihan rute” di bawah tingkat kesulitan mengatur preferensi rute: “Hindari tanjakan curam”, “Hindari tangga”, dan “Hindari feri”. Jika tidak ada jalan lain, rute tetap melewatinya.',
  'help.guide.tour-hike-trail-details.step.5':
    'Klik “Permukaan” untuk melihat rute yang sama berdasarkan jenis pijakannya, dari aspal sampai tanah alami dan batu.',
  'help.guide.tour-hike-round.step.2':
    'Kartu “Pendakian melingkar” terbuka di atas peta. Periksa titik awal di bawah “Dari”, lalu ketik “Jarak” yang kamu mau. Pil di sampingnya menunjukkan rentang panjang yang mungkin untuk pendakian melingkar.',
  'help.guide.tour-hike-compare-ways.title': 'Membandingkan jalan lain untuk satu bagian pendakian',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Jika router tidak tahu jalan lain, kartu akan memberi tahu. Jika router tidak bisa mengikuti jalan yang kamu pilih, bagian itu tetap seperti semula dan kartu memberi tahumu.',
  'help.guide.tour-ferrata-add.step.5':
    '“Ringkasan tur” di kanan menampilkan lencana “Jalur via ferrata” beserta tingkatnya, dan bagian atas editor memperingatkan “Rute melewati via ferrata”.',
  'help.guide.tour-run-plan.step.1': 'Klik “Rencanakan tur baru”, buka “Jenis tur”, lalu pilih “Lari”.',
  'help.guide.tour-run-plan.tip.3': 'Jika jarakmu dalam mil, pace-nya juga dihitung per mil.',
  'help.guide.tour-run-ways.tip.1': 'Tidak ada yang di sini mengubah rute atau durasi lari.',
  'help.ctx.trip-tour-walk.bullet.5':
    '“Tambah tur” di “Tur dalam perjalanan ini” mengimpor rute jalan kaki yang dibagikan dari Google Maps. Di tab “Rencana”, jalan-jalan yang dibuka dari harinya bisa kamu centang perhentiannya untuk hari itu.',
  'help.guide.tour-walk-plan.step.6':
    '“Ringkasan tur” di kanan menampilkan “Perk. waktu jalan”, “Persinggahan”, dan “Direncanakan”, yaitu jumlah keduanya. Klik “Simpan” di bagian bawah kolom kiri untuk menyimpan jalan-jalan.',
  'help.guide.tour-walk-sights.step.2':
    'Tema mengisi “Apa yang dicari”. Buka untuk mencentang atau menghapus centang jenis tempat, dan tentukan jarak pencarian di bawah “Dalam jarak ini dari rute”.',
  'help.guide.tour-walk-day-times.title': 'Melihat jam tiba dan jam buka untuk hari itu',
  'help.guide.tour-walk-day-times.tip.3':
    'Jam buka berasal dari OpenStreetMap atau dari tempat perjalanan yang terkait dengan perhentian, dan pil di sampingnya menunjukkan sumbernya. Periksa dulu sebelum berangkat.',
  'help.guide.tour-walk-google-import.step.4':
    'Klik “Muat sebagai rute jalan kaki”. TREK sendiri yang merencanakan jalan kaki di antara perhentian. Klik “Simpan” untuk menyimpan jalan-jalan.',
  'help.guide.tour-walk-check-off.step.2':
    'Gulir ke “Titik singgah rute”. Setiap perhentian menunjukkan lama singgahnya dan, jika jalan-jalan punya jam mulai, kapan kamu tiba.',
  'help.ctx.trip-tour-bike.summary':
    'Tur sepeda yang terbuka di editor pada tab “Tur”: profil yang dipakai untuk merutekannya, waktu bersepedanya, jenis permukaan rutenya, dan, pada tur sepeda gunung, seberapa sulit tingkat jalurnya.',
  'help.guide.tour-bike-profile.step.2': 'Buka kolom “Jenis tur” dan pilih “Tur sepeda”.',
  'help.guide.tour-bike-profile.tip.3':
    'Jika tidak ada jalan untuk sepeda di dekat suatu titik, rel menampilkan Tidak ada jalan untuk sepeda yang mencapai titik N. Pindahkan titiknya, atau buka “Tindakan lainnya” pada titik sebelumnya dan pilih “Gambar ruas berikutnya dengan tangan”.',
  'help.guide.tour-bike-surfaces.step.4':
    'Di bawah “Jenis jalan”, klik baris seperti “Jalan tani atau hutan” atau “Jalan ramai” untuk melihat di mana rute melewatinya.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Buka tur sepeda di editor dan pastikan “Profil” diatur ke MTB. Tingkat jalur hanya dibaca pada profil itu.',
  'help.ctx.trip-tour-ski.title': 'Tur ski & musim dingin',
  'help.guide.tour-ski-plan.goal':
    'Rencanakan sehari di lintasan ski, putaran ski lintas alam, tur ski, atau jalan-jalan dengan sepatu salju di sepanjang lintasan, lift, dan jalur yang terpetakan.',
  'help.guide.tour-ski-plan.tip.2':
    'Titik info di samping “Disiplin” menjelaskan apa yang dilakukan TREK dengan tur ski. Tidak ada informasi di sana, atau di mana pun di sini, tentang salju, longsor salju, atau apakah lintasan, lift, dan jalur sedang buka.',
  'help.guide.tour-ski-options.step.3':
    'Di bawah “Utamakan”, pilih “Tercepat”, “Paling banyak ski”, atau “Termudah”. Di bawah “Kecepatan”, pilih “Santai”, Normal, atau “Sportif”: pilihan ini mengubah waktu yang diberikan router untuk setiap lintasan.',
  'help.guide.tour-ski-fix-leg.goal': 'Rencanakan ruas merah dengan sekali klik, atau gambar lurus.',
  'help.guide.tour-ski-fix-leg.result':
    'Tidak ada lagi ruas merah: setiap ruas mengikuti lintasan ski atau berjalan lurus di antara titik-titiknya.',
  'help.guide.tour-ski-summary.tip.3':
    'Tur yang tersimpan terbuka persis seperti saat disimpan. Pindahkan titik atau ubah opsi untuk merencanakannya ulang dengan data lintasan terbaru.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Jika sakelarnya tetap abu-abu dan bertuliskan “Perbesar peta untuk melihat lintasan ski”, perbesar peta di area ski.',
  'help.guide.tour-ski-import.step.3':
    'Pilih “Disiplin”, dan untuk “Ski lintas alam”, pilih juga “Teknik”. Sebelum itu, dialog menampilkan Pilih disiplin untuk mengimpor jejak sebagai ski.',
  'help.ctx.trip-tour-paddle.title': 'Tur dayung',
  'help.guide.tour-paddle-setup.title': 'Merencanakan tur dayung',
  'help.guide.tour-paddle-setup.step.7':
    'Pastikan “Tambah titik” aktif, lalu klik peta: titik awal mendayung dulu, lalu titik-titik di sepanjang jalan, dan titik akhirnya.',
  'help.guide.tour-paddle-water-route.step.1':
    'Ruas yang digambar dengan tangan menampilkan “Digambar tangan, tidak dirutekan” di bawah titiknya, beserta panjangnya. TREK mempertahankan garisnya persis seperti yang kamu gambar.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Tur tidak bisa disimpan selama ada ruas yang belum direncanakan. Rencanakan ruas itu di air atau gambar dengan tangan dulu.',
  'help.guide.tour-paddle-portage.step.5':
    'Di bawah “Keluar dan masuk”, ketik berapa menit yang kamu perlukan untuk turun, membongkar muatan, dan masuk lagi ke air. Jika dibiarkan kosong, TREK memakai 10 menit.',
  'help.guide.tour-paddle-lock.step.2':
    'Pilih “Pintu air di titik ini”. Kartu pintu air muncul di bawah titik itu dengan tanda “Waktu belum diisi”.',
  'help.guide.tour-paddle-time.goal':
    'Lihat bagaimana waktu di air, mengangkut perahu, pintu air, dan istirahat dijumlahkan, lalu atur nilaimu sendiri.',
  'help.guide.tour-paddle-time.tip.3':
    'Istirahat dan total rencana milikmu sendiri diatur di bawah “Detail”. Jika ada total rencana, kartu menampilkan “Total rencanamu” di samping perkiraannya.',
  'help.guide.tour-paddle-wind.tip.1':
    'Prakiraan hanya tersedia untuk 16 hari ke depan. Untuk hari yang lebih jauh, tertulis mulai tanggal berapa prakiraannya tersedia. Untuk hari yang sudah lewat, tertulis bahwa hari itu sudah berlalu.',
  'help.guide.tour-paddle-checklist.step.2':
    'Keterangan di bawahnya menunjukkan seberapa baru datanya: “OSM per” untuk data OpenStreetMap, “Diambil” untuk kapan TREK membacanya, dan “Data rintangan” jika datanya tidak mencakup seluruh rute.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Daftar periksa bukan izin keselamatan atau izin hukum. Keputusanmu tidak menghapus larangan atau lahan pribadi yang tercatat di OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Klik “Angkut perahu”, lalu klik garis di titik kamu naik ke darat dan titik kamu masuk lagi ke air.',
  'help.ctx.trip-tour-horse.summary':
    'Tur berkuda tidak pernah dirutekan. Tur ini disusun dari bagian-bagian rute berkuda bertanda yang tercatat di OpenStreetMap, disambung dengan bagian yang kamu gambar sendiri, atau disimpan persis seperti rekamanmu.',
  'help.guide.tour-horse-plan.step.1':
    'Tampilkan area tempat kamu ingin berkuda di peta, lalu klik “Rencanakan tur baru” di bagian atas kolom kiri.',
  'help.guide.tour-horse-plan.tip.1':
    'Rute berkuda tidak berarti kamu boleh berkuda di sana. “Akses berkuda” hanya menampilkan tanda dari OpenStreetMap. Selalu ikuti rambu di lokasi.',
  'help.guide.tour-horse-gap.step.2':
    'Aktifkan “Sambungkan dengan bagian manual”. Celahnya digambar lurus dan tidak diperiksa.',
  'help.guide.tour-horse-recorded.goal':
    'Impor tur berkuda yang kamu rekam di perangkat GPS atau aplikasi, dan simpan persis seperti yang kamu jalani.',
  'help.guide.tour-horse-recorded.tip.3':
    'Kamu juga bisa menjatuhkan file di mana saja di tab “Tur” untuk membuka pratinjau yang sama.',
  'help.guide.create-trip.tip.3':
    'Di bawah “Teman perjalanan”, kamu bisa menambahkan orang yang sudah punya akun di sini. Mereka langsung menjadi anggota perjalanan begitu perjalanan dibuat.',
  'help.guide.trip-reminder.step.1':
    'Klik ikon pensil di kartu perjalanan. Untuk perjalanan baru, formulir “Perjalanan Baru” punya bagian yang sama.',
  'help.guide.company-holidays.tip.2':
    'Hari libur perusahaan sehari penuh menghapus cuti yang sudah dicatat di hari itu, jadi tidak ada yang memakai jatah cuti untuknya.',
  'help.guide.half-company-holiday.tip.2':
    'Klik hari itu lagi dengan pengaturan yang sama untuk menghapusnya, atau dengan “Setengah hari” dimatikan untuk menjadikannya hari libur perusahaan sehari penuh.',
  'help.guide.edit-holiday-calendar.step.1':
    'Buka “Pengaturan” dan cari kalendernya di bawah “Hari Libur Nasional” atau “Liburan sekolah”.',
  'help.guide.person-color.goal': 'Beri dirimu sendiri atau rekan perencanaanmu warna yang lebih mudah dibedakan.',
  'help.guide.answer-fusion-request.tip.2':
    'Kalian berdua bisa memisahkan gabungan nanti, dan entri kalian tetap tersimpan.',
  'help.guide.log-for-partner.tip.2':
    'Orang itu langsung melihat perubahannya, dan baris “Jatah Cuti”-nya langsung diperbarui.',
  'help.guide.country-places.title': 'Melihat semua tempat di suatu negara',
  'help.guide.tour-activity-stats.step.1':
    'Di panel bagian bawah peta, buka tab “Tur” di samping “Statistik” dan “Daftar Impian”.',
  'help.guide.tour-activity-stats.tip.2':
    'Tautkan jejak yang benar-benar kamu tempuh lewat “Tambah jejak aktual” di detail tur, dan nilai rekamannya akan menggantikan nilai rencana di sini. Tur yang direncanakan di beberapa hari dihitung sekali.',
  'help.ctx.collections.bullet.7':
    'Tur yang disimpan: tur yang kamu simpan dari perjalanan menjadi baris-baris pertama daftar, dengan tingkat kesulitan, jenis, perjalanan asal, dan ukurannya. “Tambahkan ke perjalanan” membuat tur baru dari tur itu, dan ikon tempat sampah menghapusnya dari daftar.',
  'help.guide.move-to-list.title': 'Memindahkan atau menduplikat tempat ke daftar lain',
  'help.guide.copy-to-trip.tip.2':
    'Tempat yang sudah ada di perjalanan dilewati, dan TREK menunjukkan berapa yang dilewati.',
  'help.guide.accept-list-invite.tip.2':
    'Klik “Dibagikan” di bagian atas daftar untuk melihat anggotanya. Klik “Tinggalkan daftar” di sana untuk keluar dari daftar itu.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Buat tur baru di salah satu perjalananmu dari tur yang tersimpan di daftar, dengan atau tanpa titik jalannya.',
  'help.guide.tour-collection-add-to-trip.result':
    'Dialog mengonfirmasi bahwa tur itu sekarang milik perjalanan tersebut. “Buka perjalanan” membawamu ke sana. “Tutup” membuatmu tetap di “Koleksi”.',
  'help.guide.tour-collection-manage.tip.3':
    'Tur yang disimpan hanya tampil di daftarnya sendiri, tidak di “Semua tersimpan”.',
  'help.guide.search-journey.step.3':
    'Klik suatu hari untuk menggulir ke sana, atau panahnya untuk melihat daftar entri hari itu dan memilih salah satunya.',
  'help.guide.journey-map-layers.goal':
    'Bandingkan rencana dengan apa yang benar-benar terjadi, dan nyalakan atau matikan lapisan.',
  'help.guide.journey-keep-route.goal':
    'Tambahkan rute nyata suatu hari dari Dawarich ke peta journey dan simpan di sana.',
  'help.guide.journey-day-stays.goal': 'Ubah persinggahan yang direkam Dawarich menjadi entri, satu per satu.',
  'help.guide.journey-take-over-day.goal':
    'Ubah persinggahan satu hari menjadi entri draf, atau satu laporan harian, sekaligus.',
  'help.guide.journey-auto-prepare.title': 'Membiarkan TREK menyiapkan hari yang terekam',
  'help.guide.photo-location.title': 'Menempatkan entri di lokasi fotonya diambil',
  'help.ctx.settings-about.summary':
    'Apa itu TREK, versi yang dijalankan server ini, dan tempat menemukan proyeknya: dokumentasi, tempat melaporkan bug, dan cara mendukung proyek ini.',
  'help.guide.startup.tip.2': 'Jika tab awal milik addon yang sudah kamu matikan, yang terbuka adalah rencana.',
  'help.guide.web-push-device.title': 'Menerima notifikasi push di perangkat ini',
  'help.guide.connect-airtrail.tip.1': 'Kartu ini hanya muncul selama admin mengaktifkan addon AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK hanya menyarankan entri, tempat, dan negara; tidak ada yang ditambahkan sampai kamu konfirmasi, dan tidak ada yang ditulis kembali ke Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1': 'Kartu ini hanya muncul selama admin mengizinkan wanderer di bawah “Tur”.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Petunjuk tidak pernah mengubah tur; pemeriksaan sumber tur menunjukkan apa yang sebenarnya berubah.',
  'help.guide.api-keys.tip.3':
    'Kirim kuncinya sebagai Authorization: Bearer atau X-API-Key ke /api/v1. Satu akun bisa punya maksimal 10 kunci.',
  'help.guide.plugin-settings.step.2':
    '“Aktivitas plugin” mencantumkan setiap tindakan yang dilakukan plugin atas namamu, mulai dari yang terbaru; “Segarkan” memuat data terbaru.',
  'help.ctx.admin-github.bullet.3':
    '“Tentang”: Ko-fi, Buy Me a Coffee, Discord, “Laporkan Bug”, “Permintaan Fitur”, dan Wiki.',
  'help.guide.default-user-settings.goal':
    'Beri setiap akun satuan, mode warna, dan mata uang yang masuk akal tanpa ada yang perlu membuka “Pengaturan”.',
  'help.guide.default-map.step.3':
    'Setiap kolom tersimpan begitu kamu meninggalkannya. Tautan “atur ulang” di samping nama kolom mengembalikan nilai default TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Jika hanya mesin rute milikmu yang diatur, Valhalla publik juga tidak dipakai. Tautan “atur ulang” di samping kolom mengosongkannya lagi.',
  'help.guide.admin-passkeys.step.1':
    'Di tab “Pengaturan”, di bawah “Login dengan passkey”, aktifkan “Aktifkan login dengan passkey”.',
  'help.guide.storage-backends.step.4':
    '“Kesehatan” di bagian atas mencantumkan penulisan yang gagal ke target cermin. Jika tertulis “Tidak ada kegagalan replika yang tercatat.”, semuanya berjalan baik.',
  'help.guide.channels-instance.tip.3':
    'Web Push memerlukan HTTPS. Di iPhone dan iPad, pengguna perlu menambahkan TREK ke Layar Utama dulu.',
  'help.guide.notification-defaults.step.1':
    'Di tab “Notifikasi”, gulir ke “Bawaan untuk pengguna” di bagian bawah. Setiap baris adalah peristiwa, setiap kolom adalah saluran.',
  'help.ctx.notifications.bullet.1':
    'Ikon lonceng di kanan atas menunjukkan jumlah notifikasi yang belum kamu baca. Klik untuk melihat sepuluh yang terbaru, dan “Tampilkan semua notifikasi” di bagian bawahnya untuk membuka halaman ini.',
  'help.guide.read-notifications.step.2':
    'Panel menampilkan sepuluh notifikasi terbaru. Setiap notifikasi menyebutkan siapa melakukan apa dan di mana, dan yang belum dibaca punya latar berwarna.',
  'help.guide.filter-notifications.step.2': 'Di bagian bawah panel, klik “Tampilkan semua notifikasi”.',
  'help.guide.mark-notifications-read.tip.1': 'Membuka notifikasi lewat tombolnya juga menandainya sudah dibaca.',
  'help.guide.delete-notifications.tip.2':
    'Notifikasi yang dihapus tidak bisa dikembalikan. Untuk menyembunyikan notifikasi tapi tetap menyimpannya, tandai sudah dibaca dan pakai “Belum dibaca”.',
  'help.guide.notification-settings.tip.2':
    'Tidak ada pengaturan per perjalanan: satu sakelar berlaku untuk semua perjalananmu.',
  'help.guide.link-journal.title': 'Menautkan jurnal ke perjalanan',
  'help.guide.link-journal.tip.2':
    'Sejak saat itu, orang yang kamu beri akses juga melihat jurnal itu di daftar Journey mereka sendiri.',
  'help.ctx.trip-places.bullet.8':
    'Jika Dawarich terhubung, “Dari Dawarich” di bagian atas daftar menampilkan persinggahan yang direkam Dawarich selama perjalanan. “Tambahkan sebagai tempat” menjadikan persinggahan itu tempat. “Bukan tempat yang saya kunjungi” menghapusnya dari daftar.',
  'help.guide.dawarich-stays.step.4':
    'Jika persinggahan itu bukan kunjungan sungguhan, klik “Bukan tempat yang saya kunjungi”, tanda x di sampingnya, untuk menghapusnya. “Tampilkan … yang sudah ditangani” di bagian bawah daftar menampilkan persinggahan yang sudah kamu tambahkan atau hapus. “Kembalikan” memasukkan lagi persinggahan yang dihapus ke daftar.',
  'help.guide.leave-stop-off-route.tip.1':
    'Pilihan ini hanya ada untuk perhentian yang punya koordinat, dan pengaturannya hanya berlaku untuk hari ini: tempat yang sama di hari lain tetap dilewati rute.',
  'help.guide.move-booking-day.title': 'Memindahkan pemesanan ke hari lain',
  'help.guide.place-image-from-file.step.4':
    'Foto itu sekarang menjadi gambar tempat. Klik X merah kecil di sudutnya untuk menghapusnya lagi.',
  'help.guide.place-own-hours.step.2': 'Di bawah Situs web, isi “Telepon” dan “Email” jika kamu tahu.',
  'help.guide.add-accommodation.tip.4':
    'Cara yang lebih cepat: tanda + di header hari, dengan tooltip “Tambah ke hari ini”, punya “Tambah akomodasi”. Pilihan ini membuka hari itu dengan formulirnya sudah terbuka.',
  'help.guide.confirm-stay-booking.goal':
    'Tandai pemesanan hotel untuk sebuah penginapan sebagai sudah dikonfirmasi, langsung dari harinya.',
  'help.guide.map-whole-trip.tip.4':
    'Pilihan menampilkan seluruh perjalanan disimpan per perjalanan di akunmu, jadi perjalanan itu terbuka dengan cara yang sama di browser lain.',
  'help.guide.tour-map-lines.step.3':
    'Buka hari tempat tur itu dijadwalkan di kolom hari, dan tur menjadi bagian dari rute hari itu: rute menuju titik awal tur dan berlanjut dari titik akhirnya.',
  'help.guide.car-stops.goal':
    'Atur tempat penjemputan, pengembalian, dan tempat singgah di antaranya untuk mobil sewaan atau mobilmu sendiri.',
  'help.guide.car-stops.tip.1':
    'Tidak ada jenis khusus untuk mobil sewaan: mobil sewaan maupun mobil sendiri sama-sama “Mobil”.',
  'help.guide.transport-details.result':
    '“Rencana” terbuka di hari perjalanan itu, dengan garisnya tergambar di peta dan ikon rute di barisnya menyala.',
  'help.guide.export-transports-csv.step.2':
    'Klik ikon spreadsheet setelah “Opsi tampilan”, yang tooltip-nya bertuliskan “Ekspor sebagai spreadsheet (CSV)”.',
  'help.guide.group-sort-bookings.title': 'Mengelompokkan dan mengurutkan pemesanan',
  'help.guide.group-sort-bookings.tip.2':
    'Di “Linimasa”, tombol yang sama berisi “Satu lajur per jenis” dan “Tampilkan tab lainnya”.',
  'help.guide.booking-on-map.result':
    'Detailnya tertutup dan tab “Rencana” terbuka di hari pemesanan, dengan tempatnya terpilih di peta.',
  'help.guide.export-bookings-csv.step.1':
    'Untuk mengekspor sebagian isi tab saja, saring dulu dengan “Cari” atau Filter. File berisi persis apa yang ditampilkan tab.',
  'help.guide.import-booking-file.tip.4':
    'Membaca konfirmasi memerlukan koneksi. Saat offline, “Impor” memberi tahu hal itu, dan kamu bisa mencoba lagi setelah TREK online kembali.',
  'help.guide.arrange-packing-list.step.1':
    'Seret pegangan di ujung kiri header daftar, sebelum titik warnanya, lalu jatuhkan daftar ke kartu lain. Garis tepi berwarna aksenmu menandai kartu tujuan, dan daftar itu menempati posisi kartu tersebut bagi semua orang dalam perjalanan.',
  'help.guide.count-packed-pieces.title': 'Mengemas beberapa barang yang sama',
  'help.guide.count-packed-pieces.tip.2':
    'Jika “Pelacak Tas” aktif, “Sudah dikemas” di kartu “Tas” hanya menghitung barang yang sudah masuk hitungan.',
  'help.guide.packing-bags.tip.4':
    'Berat tas yang dibawa beberapa orang dibagi rata di antara mereka di bawah “Per orang”. Berat ini bergaris bawah titik-titik dan menampilkan keterangan tentang hal itu saat kursor diarahkan ke sana.',
  'help.guide.expense-receipts.step.1':
    'Klik ikon pensil di samping baris pengeluaran. Editor terbuka untuk pengeluaran itu, dengan “Kuitansi & Faktur” di dekat bagian bawah.',
  'help.guide.expense-receipts.tip.3':
    'Melampirkan memerlukan koneksi dan izin mengunggah file, karena kuitansi disimpan sebagai salah satu file perjalanan.',
  'help.guide.files-sync-settings.title': 'Memilih arah sinkronisasi dokumen',
  'help.guide.files-sync-settings.tip.1':
    'Satu jalur selalu tetap aktif: mengklik satu-satunya jalur yang masih aktif tidak berpengaruh apa pun.',
  'help.guide.manage-notes.title': 'Membaca, menyematkan, dan mengedit catatan',
  'help.guide.manage-notes.tip.1':
    '“Perluas” hanya ada di menu jika catatan berisi teks. Anggota yang tidak boleh mengedit Kolab hanya melihat “Perluas”.',
  'help.guide.note-categories.step.5':
    'Klik “Simpan”. Semua catatan di kategori yang diganti nama atau warnanya langsung berubah, bagi semua anggota. “Batal” membuang perubahanmu.',
  'help.guide.trip-chat.tip.5':
    'Obrolan menampilkan pesan terbaru lebih dulu. “Muat pesan lebih lama” di bagian atas obrolan memuat pesan-pesan sebelumnya.',
  'help.guide.roadtrip-reorder.result':
    'Perhentian tersusun sesuai urutan yang kamu tentukan, dan jarak, waktu berkendara, serta jam tiba di setiap hari yang kamu ubah dihitung ulang.',
  'help.guide.roadtrip-overnight.goal':
    'Cari tempat menginap di perjalanan dan tambahkan malam itu ke perjalanan darat sebagai pemesanan.',
  'help.guide.roadtrip-overnight.tip.2':
    'Mengubah malam yang sudah dipesan kembali menjadi “Istirahat”, lewat “Edit” di kartunya, akan bertanya “Hapus menginap semalam?” dulu. “Jadikan jeda” menghapus malam itu beserta pemesanan dan pengeluaran yang tertaut, dan tetap mempertahankan perhentiannya di perjalanan darat.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Jika kamu memilih nilai yang sudah dipakai perhentian itu, perhentian kembali memakai nilai default-mu.',
  'help.guide.roadtrip-bookings.tip.1':
    'Jam di terminal diatur lebih awal dari jadwal untuk memberi waktu check-in: satu jam untuk penerbangan atau kapal pesiar, setengah jam untuk feri, sepuluh menit untuk kereta atau bus.',
  'help.guide.roadtrip-google-import.step.2':
    'Tempel tautan rute yang kamu bagikan dari Google Maps, lalu klik “Pratinjau”.',
  'help.guide.roadtrip-hazards.goal':
    'Lihat peringatan cuaca dan peringatan bencana di sekitar rute perjalananmu di peta.',
  'help.ctx.trip-tours.title': 'Tur di rencana',
  'help.guide.tour-show-list.title': 'Menampilkan tur perjalanan di rencana',
  'help.guide.tour-show-list.tip.2':
    'Belum ada tur? “Impor GPX atau KML” di bagian atas daftar untuk mengimpor file, dan “Rencanakan tur baru” di tab “Tur” untuk membuat tur baru.',
  'help.guide.tour-add-to-day.step.4':
    'Atau seret baris keluar dari daftar dan jatuhkan ke salah satu hari di kolom kiri. Jika dijatuhkan di antara dua perhentian, tur ditempatkan di sana.',
  'help.guide.tour-day-times.goal': 'Lihat kapan tur berakhir dan apakah bentrok dengan agenda berikutnya di hari itu.',
  'help.guide.tour-day-times.tip.4':
    '“Simpan ke Koleksi” di menu yang sama menyimpan tur beserta rutenya ke koleksi, sama seperti tombol “Koleksi” di kartu.',
  'help.guide.tour-remove-from-day.tip.2':
    'Tidak ada “Hapus” di menu-menu ini maupun di kartu. Tur dihapus di tab “Tur”, lewat ikon tempat sampah di barisnya di bawah “Tur dalam perjalanan ini”.',
  'help.guide.tour-filter-list.tip.1':
    '“Batas rute” adalah tingkat kesulitan tertinggi yang diizinkan saat rute direncanakan, bukan tingkat kesulitan yang diukur di jalur.',
  'help.guide.tour-hide-on-map.step.3':
    'Selama ada tur yang disembunyikan, keterangan di atas daftar menampilkan “Disembunyikan di peta” beserta jumlahnya. “Tampilkan semua” menampilkan lagi semua tur sekaligus.',
  'help.guide.tour-import-plan-tab.step.3':
    '“Pratinjau impor” menampilkan setiap jejak sebelum apa pun disimpan. Di bawah “Impor sebagai”, pilih jenisnya (“Pendakian”, “Tur sepeda”, dan seterusnya), lalu klik Impor 1 tur.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Di bawahnya ada “Hari perjalanan”, dengan kotak untuk setiap hari tur itu dijadwalkan, ukuran dengan profil elevasi, lalu, jika ada: perhentian jalan-jalan kota, pemeriksaan dan angin tur dayung, “Jejak aktual”, “Daftar bawaan”, “Deskripsi”, “Catatan”, “Asal”, dan “File”.',
  'help.guide.tour-detail-read.step.4':
    '“Hari perjalanan” menampilkan kotak untuk setiap hari tur itu dijadwalkan, beserta tanggalnya. Belum ada di hari mana pun dalam perjalanan berarti tur itu belum direncanakan.',
  'help.guide.tour-detail-read.tip.5':
    'Di ponsel, kartu terbuka sebagai lembar dari bawah, untuk dibaca dan untuk membawa tur bersamamu.',
  'help.guide.tour-rename-colour.tip.1':
    'Nama dan warna berlaku untuk seluruh perjalanan, jadi semua orang di dalamnya melihatnya. Untuk menyembunyikan tur di petamu sendiri tanpa mengubahnya bagi orang lain, pakai ikon mata di daftar “Tur”.',
  'help.guide.tour-take-along.tip.1':
    'Di perangkat yang bisa berbagi file, “Bagikan” muncul di samping GPX dan langsung mengirim file yang sama ke aplikasi lain.',
  'help.guide.tour-copy-keep.step.2':
    'Salinannya langsung terbuka, dengan nama aslinya diikuti (salinan). Klik ikon pensil untuk memberinya nama sendiri.',
  'help.guide.tour-packing-link.title': 'Menautkan tur ke daftar bawaan',
  'help.guide.tour-packing-link.tip.2':
    '“Ganti” di header bagian itu menautkan tur ke daftar lain. “Hapus tautan” di dialog itu melepas tautannya, dan daftarnya tetap seperti semula.',
  'help.guide.tour-files.tip.1': 'File-file itu juga merupakan file perjalanan, jadi juga tampil di tab “File”.',
  'help.guide.tour-activity-link.step.4': 'Periksa hasil pengukurannya di bawah “Aktual”, lalu klik “Tautkan”.',
  'help.guide.tour-activity-compare.step.1':
    'Buka kartu tur. “Rencana dan aktual” menampilkan “Jarak”, “Total kenaikan elevasi”, “Total penurunan elevasi”, dan “Waktu dengan istirahat” dari rencana di samping data jejaknya, beserta “Selisih”.',
  'help.guide.tour-origin-check.goal':
    'Cari tahu apakah tur digambar di TREK atau diimpor, dari file mana, dan apakah sudah berubah sejak itu.',
  'help.ctx.trip-tour-planner.title': 'Tur',
  'help.guide.tour-open-workspace.title': 'Mengenal tab Tur',
  'help.guide.tour-open-workspace.step.7':
    'Klik tur di rel kanan. Tur yang direncanakan di TREK terbuka di editor. Jejak hasil impor terbuka apa adanya, sebagai “Tur GPX”, untuk dilihat.',
  'help.guide.tour-draw-route.step.2':
    'Ketik titik awal tur di “Cari tempat atau alamat”, lalu pilih hasilnya. Peta berpindah ke sana.',
  'help.guide.tour-draw-route.tip.4':
    'Draf yang belum disimpan tetap tersimpan. Buka lagi tab “Tur” di perjalanan itu, dan draf dipulihkan dengan tanda “Draf yang belum disimpan telah dipulihkan”.',
  'help.guide.tour-type-profile.tip.1':
    'Mengganti jenis dihitung sebagai satu langkah dalam riwayat: “Urungkan perubahan titik lintasan” di bagian atas rel mengembalikan jenis lama beserta rutenya.',
  'help.guide.tour-edit-points.step.4':
    'Atau buka “Tindakan lainnya” (tiga titik) di baris itu dan pilih “Pindahkan titik lintasan ke atas” atau “Pindahkan titik lintasan ke bawah”.',
  'help.guide.tour-shaping-points.step.1':
    'Klik rute yang tergambar di peta di bagian yang seharusnya lewat jalan lain. Titik kecil muncul di sana: titik bentuk.',
  'help.guide.tour-loop-reverse.title': 'Membuat rute pulang-pergi atau membalik arah tur',
  'help.guide.tour-loop-reverse.result':
    'Rute melingkar yang berakhir di titik awalnya, atau tur yang sama ke arah sebaliknya.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Titik yang tidak terjangkau jalan mana pun menampilkan pemberitahuan dengan Tampilkan titik dan nomornya. Pindahkan titik itu ke jalan setapak, atau gambar ruas ke sana dengan tangan.',
  'help.guide.tour-trip-places.tip.1':
    'Tempat yang sudah ada di tur ditandai “Di tur” dan tidak bisa dipilih dua kali.',
  'help.guide.tour-details-times.step.3': 'Isi “Istirahat”, misalnya 0:45. Waktu itu ditambahkan ke perkiraan waktu.',
  'help.guide.tour-save.step.1': 'Ketik nama di “Nama tur”. Tanpa nama, “Simpan” tetap abu-abu.',
  'help.guide.tour-edit-saved.title': 'Mengubah tur yang tersimpan',
  'help.guide.tour-edit-saved.tip.3':
    '“Unduh GPX” dan “Simpan di koleksi” di bagian atas rel baru bisa dipakai setelah perubahannya disimpan.',
  'help.guide.tour-summary-profile.tip.1': 'Klik judul kartu untuk melipat seluruh ringkasan.',
  'help.guide.tour-list-manage.step.3':
    'Pilih harinya. Tur ditambahkan ke hari itu, dan barisnya menampilkan hari tersebut.',
  'help.guide.tour-delete.goal': 'Hapus tur dari perjalanan secara permanen.',
  'help.guide.tour-saved-elsewhere.goal':
    'Tentukan apa yang terjadi jika orang lain menyimpan tur saat kamu sedang mengubahnya.',
  'help.ctx.trip-tour-import.title': 'Mengimpor tur',
  'help.guide.tour-import-gpx.goal':
    'Jadikan jejak dari jam GPS, aplikasi, atau Google Earth sebagai tur perjalanan, yang diperiksa dulu sebelum disimpan.',
  'help.guide.tour-import-gpx.tip.3':
    'Jejak yang sudah ada di perjalanan tampil abu-abu dengan tanda “Sudah ada di perjalanan” dan dilewati.',
  'help.guide.tour-view-import.step.3': '“Kembali ke daftar tur”, panah di kiri atas, untuk menutupnya lagi.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK mengambil titik-titik kendali dari jejak dan merutekannya ulang. Peta menggambar hasil impor dengan garis titik-titik dan saran rutenya dengan garis utuh, dan kartu membandingkan panjangnya, porsi rute dalam 50 m dari jejak, dan “Penyimpangan terbesar”.',
  'help.guide.tour-restore-recorded.title': 'Kembali ke jejak rekaman',
  'help.guide.tour-take-over.title': 'Mengambil tur dari perjalanan lain',
  'help.guide.tour-take-over.tip.1':
    'Salinannya adalah tur tersendiri. Tur itu belum ada di hari mana pun, dan perubahan pada tur asli nanti tidak memengaruhi salinannya, begitu juga sebaliknya. “Asal”-nya menyebutkan perjalanan tempat tur itu diambil.',
  'help.guide.tour-import-wanderer.step.3':
    'Klik sebuah jalur. Jalur itu tampil di peta, dan kolomnya menunjukkan hasil pengukuran file GPX-nya, deskripsinya, dan apakah jalur itu publik atau pribadi di wanderer.',
  'help.ctx.trip-tour-map.summary':
    'Peta di tengah tab “Tur” untuk tur yang sedang kamu buka: peta yang cocok untuk jenisnya, lintasan ski atau rambu laut di atasnya, tempat-tempat di sepanjang rutenya, dan tur yang sama dalam 3D di atas lanskap aslinya.',
  'help.guide.tour-map-layers.step.1':
    'Buka tab “Tur” dan klik tur di bawah “Tur dalam perjalanan ini” di sebelah kanan. Tur terbuka di perencana, dan pil di kiri bawah peta mencantumkan peta yang tersedia untuk jenis tur ini.',
  'help.guide.tour-along-search.goal':
    'Cari titik pandang, sumber air, pondok, atau tempat makan di dekat rute tur yang sedang kamu rencanakan.',
  'help.guide.tour-along-search.tip.2':
    'Pada jalan-jalan kota, empat tema di atas daftar memilihkan jenis tempat yang tepat untukmu.',
  'help.guide.tour-along-add-stop.result':
    'Tur sekarang melewati tempat itu, dengan jarak dan waktu barunya di “Ringkasan tur”. Simpan tur untuk mempertahankan perubahannya.',
  'help.guide.tour-3d-terrain.step.3':
    'Klik pil “Sebaran kemiringan” di sebelah kanan. Pil itu terbuka dan menunjukkan berapa bagian tur yang kemiringannya di bawah 5 %, 5 hingga 10 %, 10 hingga 18 %, 18 hingga 27 %, dan 27 % atau lebih. Saat terlipat, pil menunjukkan titik tertinggi dan ruas paling curam.',
  'help.guide.tour-3d-flyover.goal':
    'Tonton seluruh tur dari awal sampai akhir sebelum kamu berjalan, bersepeda, atau bermain ski di sana.',
  'help.guide.tour-3d-flyover.tip.3':
    'Saat penerbangan dijeda, gerakkan kursor di sepanjang profil elevasi untuk memindahkan titiknya ke posisi itu. “Putar penerbangan” melanjutkan dari sana.',
  'help.guide.tour-map-overlays.tip.1':
    'Lintasan ski adalah data peta, bukan laporan langsung: tidak ada informasi tentang apa yang buka atau sudah dirapikan, kondisi salju, atau longsor salju. Jika kamu memperkecil peta melewati area ski, sakelarnya bertuliskan “Perbesar peta untuk melihat lintasan ski”.',
  'help.ctx.trip-tour-stages.bullet.4':
    'Di “Tur dalam perjalanan ini”, tur beberapa hari menampilkan ikon bulan dengan jumlah etapenya. Tombol itu, “Tampilkan etape”, membuka daftar etape beserta hari setiap etape dan total “Seluruh tur”.',
  'help.guide.tour-multi-day.step.5':
    '“Ringkasan tur” mencantumkan setiap etape di bawah “Etape”. Klik salah satunya untuk melihat di mana etape itu berakhir: perhentian terakhirnya terpilih dan profil elevasi menandai posisinya.',
  'help.guide.tour-stages-on-days.goal': 'Tempatkan setiap etape di harinya sendiri, atau seluruh tur di satu hari.',
  'help.guide.tour-stages-on-days.tip.2':
    '“Seluruh tur di hari tersebut” tampil abu-abu di hari yang sudah berisi tur itu. “Etape mulai hari tersebut” tetap bisa dipakai di sana dan menggantikan seluruh tur di hari itu.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Header kartu “Titik jalan” berisi alat-alat rute: “Balik arah”, “Kembali ke awal”, dan, pada pendakian, “Rute melingkar dari awal”. “Tindakan lainnya” pada perhentian berisi “Bandingkan jalan untuk bagian berikutnya”.',
  'help.guide.tour-hike-plan.step.3': 'Ketik nama di bawah “Nama tur”.',
  'help.guide.tour-hike-plan.tip.4':
    'Waktu berjalan mengikuti aturan papan petunjuk jalur pendakian (DIN 33466) dan tidak termasuk istirahat. Tambahkan istirahat di bawah “Istirahat” di “Detail”, dan istirahat itu tampil di total yang direncanakan.',
  'help.guide.tour-hike-trail-details.result':
    'Kamu tahu bagian mana dari pendakian yang bertingkat berapa, permukaannya apa, dan di mana letaknya di peta.',
  'help.guide.tour-hike-round.step.3':
    'Klik “Cari putaran”. Putaran A, Putaran B, dan seterusnya muncul di daftar dan di peta, masing-masing dengan warnanya sendiri.',
  'help.guide.tour-hike-compare-ways.goal':
    'Lihat jalan lain yang bisa dilalui pendakian di antara dua perhentian, lalu pilih salah satunya.',
  'help.guide.tour-hike-compare-ways.tip.3': '“Batal” menutup kartu tanpa mengubah rute.',
  'help.guide.tour-ferrata-add.result':
    'Pendakian mengikuti via ferrata pada garisnya sendiri dari OpenStreetMap. Klik peta untuk melanjutkan dari puncaknya. Router hanya merencanakan jalan menuju via ferrata dan jalan sesudahnya.',
  'help.guide.tour-run-plan.step.2':
    'Pilih “Profil”: “Lari” untuk jalan yang kebanyakan beraspal di kota, taman, dan tepi sungai, “Lari trail” untuk jalan hutan dan jalur alami.',
  'help.guide.tour-run-plan.tip.4':
    '“Lari trail” memakai jalur sampai jalur gunung (T2), tidak pernah yang lebih sulit.',
  'help.guide.tour-run-ways.tip.2':
    'Ganti “Profil” ke “Lari trail” agar rute lebih banyak melewati jalur alami, atau ke “Lari” agar tetap di permukaan yang keras.',
  'help.guide.tour-walk-plan.title': 'Merencanakan jalan-jalan kota dari satu perhentian ke perhentian lain',
  'help.guide.tour-walk-plan.tip.1':
    'Lingkaran di sekeliling nomor perhentian menunjukkan tingkat pentingnya: utuh untuk “Wajib dikunjungi”, putus-putus untuk “Opsional”. Perisai kecil menandai perhentian yang “Dilindungi”.',
  'help.guide.tour-walk-sights.step.3':
    'Klik “Cari di sepanjang tur”. Bintang di depan nama menandai “Sorotan”, salah satu tempat paling terkenal di sana.',
  'help.guide.tour-walk-day-times.goal':
    'Ketahui kapan kamu tiba di setiap perhentian pada hari jalan-jalan, dan tempat mana yang tutup saat itu.',
  'help.guide.tour-walk-day-times.tip.4':
    'Dua jalan-jalan di hari yang sama: di tab “Rencana”, klik ruas di antara keduanya (“Ubah moda transportasi”) dan pilih “Transportasi umum”. Pencarian dimulai dari titik akhir jalan-jalan pertama, pada jam berakhirnya, dan memperingatkanmu jika koneksi tiba setelah jalan-jalan berikutnya dimulai.',
  'help.guide.tour-walk-google-import.tip.1':
    'Hanya rute yang direncanakan untuk jalan kaki yang bisa dibaca. Ubah Google Maps ke mode jalan kaki sebelum membagikannya.',
  'help.guide.tour-walk-check-off.step.3':
    'Klik “Tandai dikunjungi” pada perhentian yang sudah kamu kunjungi, atau “Lewati” pada perhentian yang kamu lewatkan.',
  'help.ctx.trip-tour-bike.bullet.1':
    '“Profil” di bawah “Jenis tur” menentukan gaya bersepeda yang direncanakan router: Touring, Road, Gravel, atau MTB. Keterangan di bawahnya menjelaskan apa yang dicari router, dan menggantinya akan merencanakan ulang seluruh rute.',
  'help.guide.tour-bike-profile.step.3':
    'Di bawah “Profil”, pilih Touring, Road, Gravel, atau MTB. Keterangan di bawahnya menjelaskan apa yang dicari router dengan profil itu.',
  'help.guide.tour-bike-profile.tip.4':
    '“Simpan” tetap abu-abu sampai tur punya nama dan rute serta ketinggiannya selesai dihitung.',
  'help.guide.tour-bike-surfaces.result':
    'Peta menandai bagian-bagian dari baris yang kamu pilih, dan kamu tahu jenis permukaan yang dilalui rute. Turnya sendiri tidak berubah.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'Di kartu “Permukaan dan jalan”, baca “Tingkat jalur (mtb:scale)”: porsi rute dari “S0, tanpa kesulitan khusus” sampai “S4 ke atas, medan ahli”.',
  'help.ctx.trip-tour-ski.summary':
    'Tur berjenis “Ski & musim dingin” di tab “Tur”: sehari di lintasan ski, putaran ski lintas alam, tur ski, jalan dengan sepatu salju, atau jalan-jalan musim dingin. Ruas-ruasnya mengikuti lintasan, lift, dan jalur yang dipetakan di OpenStreetMap, direncanakan oleh router lintasan sesuai disiplin dan batasmu, dan jejak ski hasil rekaman diimpor beserta disiplinnya.',
  'help.guide.tour-ski-plan.step.1': 'Di tab “Tur”, klik “Rencanakan tur baru” di bagian atas rel kiri.',
  'help.guide.tour-ski-plan.tip.3':
    'Jika disiplinnya diganti nanti, titik-titikmu tetap ada dan ruas-ruasnya direncanakan ulang dengan opsi disiplin baru itu.',
  'help.guide.tour-ski-options.step.4':
    'Pakai sakelar-sakelarnya: “Naik lift”, “Izinkan rute freeride”, “Turun dengan lift bila perlu”, dan “Hindari sambungan yang hanya ditebak”. “Ski lintas alam” menambahkan “Hanya jalur yang dirawat” dan “Hanya jalur berlampu”, dan “Tur ski” menambahkan “Naik di tepi lintasan”.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Ruas yang tidak bisa direncanakan router menampilkan baris merah di bawah titiknya beserta alasannya, misalnya Hanya lift yang kamu kecualikan yang menyambung titik-titik ini, dan lintasan atau lift yang dimaksud.',
  'help.guide.tour-ski-summary.title': 'Membaca rute lintasan tur ski',
  'help.guide.tour-ski-summary.tip.4':
    'Bagian bawah kartu menyebutkan area ski dan tanggal data peta yang dipakai saat merencanakan tur.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Jika lintasan ski berhenti dimuat, sakelarnya menampilkan tanda peringatan. Peta dan rutemu tetap berfungsi.',
  'help.guide.tour-ski-import.step.4': 'Klik Impor 1 tur.',
  'help.ctx.trip-tour-paddle.summary':
    'Tur kayak, kano, atau SUP di sungai atau danau. Tur ini mencatat jenis perahu dan perairannya, mengikuti alur air di tempat TREK punya datanya, memasukkan angkut perahu dan pintu air ke dalam durasinya, serta menampilkan kondisi angin di hari kamu mendayung dan informasi tentang rintangan di sepanjang rute.',
  'help.guide.tour-paddle-setup.goal':
    'Mulai tur kayak, kano, atau SUP, lalu tentukan perahunya, perairannya, dan kecepatannya.',
  'help.guide.tour-paddle-setup.tip.1':
    'Jika “Perahu” diatur ke “Lainnya”, tidak ada saran kecepatan. Isi kecepatannya, atau waktu di air akan tetap kosong.',
  'help.guide.tour-paddle-water-route.step.2':
    'Agar satu ruas direncanakan di air, arahkan kursor ke perhentian sebelumnya dan klik “Tindakan lainnya”, ikon tiga titik.',
  'help.guide.tour-paddle-water-route.result':
    'Setiap ruas mengikuti alur air atau sengaja digambar dengan tangan, dan ruas yang tidak bisa direncanakan TREK menjelaskan alasannya.',
  'help.guide.tour-paddle-portage.tip.1':
    'Untuk tetap mendayung di bagian itu, buka lagi “Tindakan lainnya” pada titiknya dan pilih “Dayung lagi ruas ini”. Bagian itu kembali menjadi ruas yang digambar dengan tangan.',
  'help.guide.tour-paddle-lock.step.3': 'Klik kartu pintu air untuk membukanya.',
  'help.guide.tour-paddle-time.step.1':
    '“Perkiraan waktu” ada di kolom kiri di bawah titik jalan. Lencana di header-nya adalah totalnya, termasuk istirahat.',
  'help.guide.tour-paddle-time.result': 'Perkiraan menghitung apa yang kamu isi dan menyebutkan apa yang masih kurang.',
  'help.guide.tour-paddle-wind.tip.2':
    'Tur beberapa hari menampilkan chip hari untuk masing-masing hari di header kartu. Klik salah satunya untuk melihat hari itu.',
  'help.guide.tour-paddle-checklist.step.3':
    'Entri-entrinya mengikuti urutan rute: bendungan, pintu air, jeram, titik masuk air, dan aturan akses dari OpenStreetMap, serta angkut perahu dan pintu air buatanmu sendiri, yang ditandai “Rencanamu”.',
  'help.guide.tour-paddle-checklist.result':
    'Setiap entri di rute sudah punya keputusan, dan kamu sudah membaca catatan keselamatannya.',
  'help.guide.tour-paddle-track-marks.step.6': 'Klik pintu air, lalu klik garis di lokasi pintu air itu.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Atur “Jenis tur” ke “Tur berkuda” di editor, dan kartu “Rute berkuda” muncul di kolom kiri. “Cari di tampilan peta” mencantumkan rute-rute yang ada di tampilan peta.',
  'help.guide.tour-horse-plan.step.2':
    'Klik kolom “Jenis tur” di bawah “Nama tur” dan pilih “Tur berkuda”. Kartu “Rute berkuda” muncul di bawah “Titik jalan”.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK tidak menghitung waktu berkuda. Isi waktu di bawah “Direncanakan” di “Detail” jika kamu ingin waktunya tampil di hari itu.',
  'help.guide.tour-horse-gap.step.3': 'Klik “Ambil bagian”. Selama sakelarnya belum aktif, tombol ini tetap abu-abu.',
  'help.guide.tour-horse-recorded.step.1':
    'Di “Tur dalam perjalanan ini”, klik “Tambah tur” (tanda +), pilih “Impor GPX atau KML”, lalu pilih file tur berkudamu.',
  'help.guide.dateless-trip.title': 'Merencanakan perjalanan tanpa tanggal',
  'help.guide.trip-reminder.step.2':
    'Di bawah “Pengingat”, pilih 1, 3, atau 9 hari. Untuk jangka waktu lain, klik “Kustom” dan ketik jumlah hari antara 1 dan 30.',
  'help.guide.upcoming-reservations.title': 'Langsung ke pemesanan berikutnya',
  'help.guide.half-company-holiday.title': 'Menandai setengah hari libur perusahaan',
  'help.guide.edit-holiday-calendar.step.2':
    'Klik kotak warna untuk memilih warna baru, atau ketik label baru dan tekan Enter.',
  'help.guide.person-color.step.1': 'Di kartu “Orang”, klik titik berwarna di depan nama.',
  'help.guide.answer-fusion-request.title': 'Menjawab permintaan penggabungan',
  'help.guide.log-for-partner.title': 'Mencatat hari untuk rekan perencanaanmu',
  'help.guide.dissolve-fusion.title': 'Berhenti merencanakan bersama',
  'help.guide.country-places.goal':
    'Lihat daftar tempat yang dihitung TREK untuk suatu negara, untuk memeriksa apa saja yang kamu lakukan di sana atau menemukan tempat yang dimasukkan TREK ke negara yang salah.',
  'help.guide.regions.tip.3':
    '“Tambah ke bucket list” juga bisa dipakai untuk wilayah. Wilayah itu tampil dengan arsiran yang sama seperti negara di daftar impianmu.',
  'help.guide.tour-activity-stats.step.2':
    'Pilih periode dan jenis dengan dua pil di kiri. “Periode” menawarkan “Sepanjang waktu”, “Tahun ini”, “12 bulan terakhir”, dan setiap tahun sebelumnya yang punya tur; “Jenis” membatasi angkanya ke satu jenis tur, atau “Semua jenis”.',
  'help.guide.tour-activity-stats.tip.3':
    'Hari yang mencantumkan peserta hanya dihitung untuk mereka; hari yang tidak mencantumkan siapa pun dihitung untuk semua orang dalam perjalanan. Tab ini memuat data langsung dan memerlukan koneksi internet.',
  'help.guide.move-to-list.goal':
    'Rapikan daftarmu dengan memindahkan tempat antardaftar atau menyalinnya ke daftar kedua.',
  'help.guide.accept-list-invite.result':
    'Daftar itu muncul di bawah “Dibagikan” di rel dan terbuka beserta tempat-tempatnya. Perubahan dari anggotanya langsung terlihat.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Buka daftarnya. Tur yang disimpan ada di baris-baris pertama, di atas tempat. Klik “Tambahkan ke perjalanan” pada tur itu, atau klik barisnya.',
  'help.guide.tour-collection-manage.title': 'Mencari dan menghapus tur yang disimpan',
  'help.guide.tour-collection-manage.result': 'Tur dihapus dari daftar, dan pesan singkat mengonfirmasinya.',
  'help.guide.entry-draft.title': 'Menyimpan entri sebagai draf',
  'help.guide.journey-map-layers.step.1':
    'Di bagian atas peta, bar lapisan berisi “Rencana”, “Terekam”, “Entri”, dan “Foto”, masing-masing dengan jumlahnya. Klik salah satunya untuk menyembunyikan atau menampilkannya.',
  'help.guide.journey-keep-route.step.1': 'Di header hari, klik tombol Dawarich, “Ambil rekaman”.',
  'help.guide.journey-day-stays.step.1':
    'Hari yang punya persinggahan untuk ditinjau diakhiri dengan baris seperti 4 persinggahan dari Dawarich beserta rentang waktunya. Klik untuk menampilkan persinggahannya.',
  'help.guide.journey-take-over-day.step.1':
    'Klik “Ambil hari” di ujung baris persinggahan hari itu, atau tombol daftar di header hari, yang menunjukkan berapa persinggahan yang menunggu.',
  'help.guide.journey-auto-prepare.goal':
    'Biarkan persinggahan setiap hari disiapkan otomatis untuk ditinjau selama perjalanan berlangsung.',
  'help.guide.photo-location.goal': 'Tampilkan entri di peta tanpa perlu mencari tempat untuk setiap entri.',
  'help.ctx.settings-about.bullet.1': 'Versi yang dijalankan server ini tampil di samping judul.',
  'help.guide.readability.tip.3':
    'Keterbacaan ditandai “Eksperimental”. Jika ada yang terlihat aneh, klik “Kembalikan ke default” di bagian bawah tab untuk mengembalikan pengaturan awalnya.',
  'help.guide.web-push-device.goal': 'Terima notifikasi TREK di ponsel atau komputermu meskipun TREK sedang ditutup.',
  'help.guide.connect-airtrail.tip.2':
    'Kuncinya disimpan dalam bentuk terenkripsi dan tidak pernah ditampilkan lagi; titik-titik di kolom berarti sudah ada kunci yang tersimpan.',
  'help.guide.connect-dawarich.tip.2':
    'Di bawah tombol, kartu menunjukkan kapan TREK terakhir memeriksa dan fitur apa yang tidak tersedia di versi Dawarich-mu.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Instans dengan alamat privat mungkin memerlukan izin admin untuk jaringan internal.',
  'help.guide.tour-wanderer-watch.tip.2':
    '“Dijeda sampai” berarti wanderer tidak merespons; “Token ditolak” berarti token itu perlu lolos uji koneksi atau diganti dengan token baru.',
  'help.guide.plugin-settings.result':
    'Plugin bekerja dengan pengaturanmu, dan setiap tindakan yang dilakukannya untukmu tercantum di bawah “Aktivitas plugin”.',
  'help.ctx.admin-defaults.bullet.3':
    'Tautan “atur ulang” di samping kolom yang sudah kamu atur mengembalikan nilai default TREK. Pengaturan pengguna sendiri selalu diutamakan di atas ini.',
  'help.ctx.admin-settings.bullet.5':
    '“Zona Berbahaya”: “Putar Secret JWT” mengeluarkan semua pengguna, termasuk kamu.',
  'help.guide.default-user-settings.step.1':
    'Di bawah “Pengaturan Default Pengguna”, pilih “Mode Warna” (“Terang”, “Gelap”, atau “Otomatis”), “Satuan Suhu”, “Satuan Jarak”, “Format Waktu”, “Awal minggu”, “Mata uang tampilan”, dan apakah “Sembunyikan Kode Pemesanan” “Aktif” atau “Mati”. Setiap pilihan langsung tersimpan.',
  'help.guide.admin-passkeys.step.2':
    'Isi Relying Party ID (domain), misalnya trek.example.org, dan “Origin yang diizinkan” tempat TREK-mu diakses, lalu klik “Simpan”. Biarkan keduanya kosong untuk memakai APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Mengeluarkan semua orang sekaligus',
  'help.guide.notification-defaults.step.2':
    'Klik sel untuk mengubahnya ke status berikutnya: “Aktif”, “Mati”, “Diblokir”. Tooltip-nya menyebutkan status berikutnya, dan setiap klik langsung tersimpan.',
  'help.ctx.notifications.bullet.2':
    '“Semua” dan “Belum dibaca” di bagian atas beralih antara semua notifikasi dan yang belum kamu baca saja. Daftar memuat lebih banyak saat kamu menggulir.',
  'help.guide.read-notifications.step.3':
    'Klik tombol di bawah notifikasi, di sini “Lihat Vacay”, untuk membuka hal yang dimaksud. Ini juga menandainya sudah dibaca.',
  'help.guide.filter-notifications.step.3':
    'Klik “Belum dibaca” untuk melihat notifikasi yang belum kamu baca saja. “Semua” menampilkan semuanya lagi.',
  'help.guide.mark-notifications-read.tip.2':
    'Menandai sudah dibaca hanya mengubah warna latar dan hitungannya. Notifikasi tetap ada di daftar sampai kamu menghapusnya.',
  'help.guide.delete-notifications.result': 'Notifikasi dihapus dari daftar dan dari ikon lonceng.',
  'help.guide.notification-settings.result':
    '“Pengaturan” terbuka di “Notifikasi”, dengan sakelar untuk setiap peristiwa dan saluran.',
  'help.guide.link-journal.goal':
    'Tampilkan salah satu jurnal Journey-mu di dalam perjalanan, bagi orang-orang yang kamu pilih.',
  'help.guide.link-journal.tip.3':
    'Nanti, “Jurnal” di “Pengaturan perjalanan” punya “Ubah akses”, “Ganti jurnal”, dan “Lepas Tautan”. Melepas tautan menghapus tab itu; orang yang kamu tambahkan langsung di jurnal tetap punya aksesnya.',
  'help.guide.dawarich-stays.result':
    'Persinggahan itu menjadi tempat dalam perjalanan, di hari yang kamu pilih atau di bawah “Belum direncanakan”, dan panel menandainya sudah ditangani.',
  'help.ctx.trip-days.bullet.7':
    'Selama perjalanan berlangsung, rencana terbuka di hari ini dan langsung menggulir ke sana.',
  'help.guide.leave-stop-off-route.tip.2':
    '“Hapus dari hari” mengeluarkan perhentian dari hari itu; “Keluarkan dari rute” tetap menyimpannya di rencana.',
  'help.guide.move-booking-day.goal':
    'Pindahkan transportasi atau pemesanan ke hari lain langsung dari rencana, tanpa membuka formulirnya.',
  'help.guide.place-image-from-file.result':
    'Foto itu menjadi gambar tempat di kartu, di kolom tempat, di hari, dan di peta.',
  'help.guide.place-own-hours.step.3':
    '“Jam Buka” di bawahnya menampilkan satu minggu, satu baris per hari. Jika TREK menemukan jam buka tempat itu, jamnya sudah terisi; jika tidak, klik “Tambah jam buka” dulu. Ketik jam buka dan tutup setiap hari, dan klik “Ditutup” di hari tempat itu tidak buka.',
  'help.guide.add-accommodation.tip.5':
    'Jejak GPX dan tempat tur tidak pernah ditawarkan sebagai tempat menginap, hanya tempat biasa dalam perjalanan.',
  'help.guide.confirm-stay-booking.step.1':
    'Buka hari check-in. Di kartu penginapan, di bawah “Reservasi”, ada pemesanan Hotel untuk malam itu dengan status “Menunggu” atau “Dikonfirmasi”. Klik kotak itu.',
  'help.guide.tour-map-lines.step.4':
    'Untuk menyembunyikan tur dari peta, alihkan kolom kanan ke “Tur”, arahkan kursor ke tur itu, lalu klik ikon mata, “Sembunyikan di peta”. Garis dan pin-nya hilang dari peta, dan barisnya tetap ada di daftar dalam keadaan redup, dengan ikon mata dicoret, “Tampilkan di peta”, untuk menampilkannya lagi.',
  'help.guide.car-stops.step.1':
    'Di header hari pengambilan mobil, klik tanda + dengan tooltip “Tambah ke hari ini”, lalu pilih “Tambah transportasi”.',
  'help.guide.car-stops.tip.2':
    '“Pindah ke atas” dan “Pindah ke bawah” baru muncul setelah perjalanan punya dua perhentian atau lebih.',
  'help.guide.transport-details.title': 'Membuka transportasi dan memakai detailnya',
  'help.guide.transport-details.tip.1':
    'Klik “Di peta” lagi pada perjalanan yang garisnya sedang tampil untuk mematikan garis itu.',
  'help.guide.export-transports-csv.result':
    'Browsermu menyimpan file yang dinamai sesuai perjalanan, misalnya autumn-in-japan-transports.csv, dengan satu baris per perjalanan: “Jenis”, “Judul”, Status, “Mulai”, “Selesai”, “Dari”, “Ke”, “Lokasi”, “Konfirmasi”, dan “Catatan”.',
  'help.guide.group-sort-bookings.goal':
    'Susun kartu atau daftar berdasarkan status, hari, atau jenis, dalam urutan yang kamu mau.',
  'help.guide.booking-on-map.tip.1':
    '“Di peta” hanya tersedia untuk pemesanan yang punya tempat. Pilih tempat di bawah “Tempat / Aktivitas” di formulir, dan tombolnya akan muncul.',
  'help.guide.export-bookings-csv.step.2':
    'Buka “Opsi tampilan”, ikon penggeser setelah ikon tampilan, lalu pilih urutan di bawah “Urutkan”. Baris-barisnya mengikuti urutan itu, satu baris per pemesanan tanpa pembagian bagian.',
  'help.guide.edit-booking.tip.4':
    'Jika kamu sudah mengubah sesuatu, klik di luar formulir, atau Escape, akan bertanya “Buang perubahan?”. “Lanjut mengedit” membawamu kembali ke formulir.',
  'help.guide.arrange-packing-list.step.2':
    'Di dalam daftar, pegangan di kiri baris untuk menyeret item itu ke atas atau ke bawah. Garis berwarna aksenmu di tepi kiri baris menunjukkan posisi tujuannya.',
  'help.guide.count-packed-pieces.goal': 'Beri item jumlah dan tandai barangnya sudah dikemas satu per satu.',
  'help.guide.count-packed-pieces.tip.3': 'Item dengan jumlah satu tidak punya penghitung; cukup kotak centang saja.',
  'help.guide.expense-receipts.step.2':
    'Klik “Lampirkan” di samping “Kuitansi & Faktur”, lalu pilih foto atau PDF-nya; kamu juga bisa memilih beberapa sekaligus. Setiap file tercantum di bawah judul itu, dengan ikon tempat sampah untuk menghapusnya.',
  'help.guide.files-sync-settings.goal':
    'Tentukan apakah dokumen hanya diimpor dari penyimpananmu, hanya diekspor ke sana, atau keduanya, dan apa yang terjadi saat dokumen dihapus atau diubah di kedua tempat.',
  'help.guide.files-sync-settings.tip.2':
    'Dengan “Tanya saya”, dokumen yang diedit di kedua tempat menunggu di “Perlu dilihat”, di bawah kartu. Klik Selesaikan dan pilih “Pertahankan versi TREK”, “Pertahankan versi penyedia”, atau “Pertahankan keduanya”.',
  'help.guide.manage-notes.goal':
    'Buka catatan secara lengkap, sematkan yang penting di atas, dan perbaiki atau hapus yang sudah tidak berlaku.',
  'help.guide.manage-notes.tip.2':
    'Saat mengedit, tanda silang merah pada file yang sudah terlampir langsung menghapusnya, sebelum kamu klik “Simpan”, dan file itu tidak masuk ke tempat sampah. Setiap file catatan juga tampil di tab “File” perjalanan.',
  'help.guide.note-categories.step.6':
    'Kembali di kartu “Catatan”, pil di bawah header menyaring kartu-kartunya. Klik kategori untuk melihat catatan di kategori itu saja; “Semua”, atau pil yang sama sekali lagi, menampilkan semuanya.',
  'help.guide.roadtrip-reorder.tip.1':
    'Memindahkan perhentian di sini juga memindahkannya di rencana hari: “Hari” menampilkan urutan yang sama.',
  'help.guide.roadtrip-overnight.step.1':
    'Di “Di sepanjang rute”, centang “Akomodasi” di bawah “Mencari”, atau “Perkemahan” untuk lahan kemah, pilih hari kamu ingin berhenti, lalu klik “Cari”.',
  'help.guide.roadtrip-overnight.tip.3':
    'Jika “Mulai dan akhiri setiap hari di penginapan Anda” aktif, di bawah “Garis rute” pada “Pengaturan berkendara”, perjalanan hari berikutnya dimulai dari tempat kamu menginap.',
  'help.guide.roadtrip-stop-fill.title': 'Mengatur level pengisian di satu perhentian',
  'help.guide.roadtrip-bookings.title': 'Memasukkan penerbangan, kereta, atau feri ke perjalanan darat',
  'help.guide.roadtrip-bookings.tip.2':
    'Meja atau tiket yang dipesan di suatu perhentian tampil sebagai pil di perhentian itu; pemesanan yang tidak terkait perhentian mana pun tercantum di bawah “Juga dipesan hari ini”.',
  'help.guide.roadtrip-google-import.step.3':
    'Periksa perhentian yang ditemukan. Setiap perhentian menunjukkan lokasinya; perhentian bertanda Lokasi belum ditemukan akan dilewati.',
  'help.guide.roadtrip-hazards.step.1': 'Buka “Pengaturan berkendara” di kolom kanan.',
  'help.ctx.trip-tours.summary':
    'Kolom kanan tab “Rencana” dalam mode “Tur”: semua tur perjalanan dalam satu daftar, di samping hari-hari. Dari sini kamu memasukkan tur ke hari, menyaring daftar, menyembunyikan garis di peta, dan mengimpor file GPX atau KML. Rute digambar dan diubah di tab “Tur”.',
  'help.guide.tour-show-list.goal':
    'Ganti kolom tempat dengan daftar tur perjalanan, agar bisa melihat dan memilihnya di samping hari-hari.',
  'help.guide.tour-show-list.tip.3':
    'Jika addon Tur aktif, jejak tidak pernah muncul di daftar “Tempat”: setiap jejak yang diimpor menjadi tur dan tercantum di sini.',
  'help.guide.tour-add-to-day.step.5':
    'Untuk tur dengan etape, menu yang sama lalu bertanya. “Etape mulai hari tersebut” menaruh etape 1 di hari itu dan setiap etape berikutnya di hari sesudahnya; “Seluruh tur di hari tersebut” menaruh semuanya di satu hari itu.',
  'help.guide.tour-day-times.step.1':
    'Di kolom hari, arahkan kursor ke baris tur, klik “Opsi lainnya” (tiga titik), lalu pilih “Edit”.',
  'help.guide.tour-day-times.result':
    'Tur tampil di linimasa hari itu dengan jam mulai dan selesainya, seperti perhentian berjam lainnya.',
  'help.guide.tour-remove-from-day.result':
    'Hari itu tidak lagi mencantumkan tur, dan barisnya di daftar tidak punya lencana hari.',
  'help.guide.tour-filter-list.tip.2':
    'Suatu bagian hanya muncul jika tur-tur berbeda dalam hal itu, jadi daftar yang pendek mungkin hanya menawarkan Status.',
  'help.guide.tour-hide-on-map.tip.1':
    'Menyembunyikan hanya berlaku untukmu dan disimpan di browser ini untuk perjalanan ini: tur, harinya, dan warnanya tidak berubah, dan tur tetap terlihat di peta orang lain.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Jejak yang sudah ada di perjalanan ditandai “Sudah ada di perjalanan” dan tidak diimpor dua kali.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Baris di bagian bawah: “Tambah ke Hari” atau “Hapus dari Hari” saat ada hari yang terbuka, “Navigasi” ke titik awal, halaman web tur, GPX, “Bagikan” jika perangkatmu bisa berbagi file, “Koleksi”, dan “Salin”.',
  'help.guide.tour-detail-read.step.5':
    'Di bawahnya ada ukurannya: “Jarak”, “Ketinggian minimum”, “Ketinggian maksimum”, “Total kenaikan elevasi”, dan “Total penurunan elevasi”, waktu-waktu di bawahnya, dan profil elevasi dengan warna garis tur.',
  'help.guide.tour-detail-read.result':
    'Kartu tur terbuka di samping rencana, dan kamu tahu tur itu ada di hari mana saja, seberapa panjang dan curam, dan dari mana asalnya.',
  'help.guide.tour-rename-colour.tip.2':
    'Ikon pensil dan titik warna hanya berfungsi bagi anggota yang boleh mengedit tempat.',
  'help.guide.tour-take-along.tip.2':
    'Pilih aplikasi peta favorit di “Pengaturan”, dan “Navigasi” langsung membuka aplikasi itu tanpa menampilkan daftar.',
  'help.guide.tour-copy-keep.step.3':
    'Untuk menyimpan tur bagi perjalanan lain, buka tur itu dan klik “Koleksi” di bagian bawah kartunya.',
  'help.guide.tour-packing-link.goal':
    'Tampilkan barang bawaan untuk tur langsung di kartunya, dari daftar bawaan perjalanan atau salah satu daftarnya.',
  'help.guide.tour-packing-link.tip.3':
    'Menautkan memerlukan hak mengedit tempat. Orang lain bisa melihat daftar yang ditautkan tapi tidak bisa mengubah tautannya.',
  'help.guide.tour-files.tip.2': '“Unggah” hanya tampil bagi anggota yang boleh mengubah tur dan menambahkan file.',
  'help.guide.tour-activity-link.step.5':
    'Jejaknya sekarang tampil di bawah “Jejak aktual”, dengan nilai dan profilnya sendiri di samping rencana.',
  'help.guide.tour-activity-compare.step.2':
    '“Jarak terjauh dari rencana” menunjukkan jarak terbesar antara jejak dan garis rencana, dan “Di luar rencana” menunjukkan berapa bagian jejak yang keluar dari garis itu.',
  'help.guide.tour-origin-check.step.1':
    'Buka kartu tur dan gulir ke “Asal”. “Sumber” menyebutkan asalnya: “Impor GPX” dengan nama filenya, impor KML atau KMZ, atau wanderer dengan alamatnya.',
  'help.ctx.trip-tour-planner.summary':
    'Perencana tur perjalanan: editor di kiri, semua tur perjalanan di kanan, dan peta di antaranya. Di sini kamu menggambar tur titik demi titik, merutekannya di jalan setapak dan jalan sungguhan, menambahkan detailnya, lalu menyimpannya ke perjalanan.',
  'help.guide.tour-open-workspace.goal': 'Buka perencana tur dan kenali fungsi setiap bagiannya.',
  'help.guide.tour-open-workspace.tip.1':
    '“Ciutkan”, pada tab di tepi dalam setiap rel, menyembunyikan rel agar peta lebih luas; “Rencana” dan “Tur dalam perjalanan ini” menampilkan relnya lagi. Seret tepi rel untuk memperlebar atau mempersempitnya.',
  'help.guide.tour-draw-route.step.3':
    'Pastikan “Tambah titik” di bawah “Titik jalan” aktif (sakelarnya sama dengan “Tempatkan titik” di pil peta), lalu klik peta di titik awal tur.',
  'help.guide.tour-draw-route.result':
    'Rute bernomor di peta dan titik-titiknya di bawah “Titik jalan”, siap diberi nama dan disimpan.',
  'help.guide.tour-type-profile.tip.2':
    'Beberapa jenis memerlukan isian tambahan sebelum bisa disimpan: “Lari” memerlukan “Pace rencana”, “Tur dayung” memerlukan perahu dan perairannya, dan tur “Ski & musim dingin” memerlukan disiplinnya.',
  'help.guide.tour-edit-points.step.5':
    '“Hapus titik lintasan”, ikon tempat sampah di sampingnya, mengeluarkan titik itu dari tur.',
  'help.guide.tour-shaping-points.step.2':
    'Seret titik itu ke jalan yang seharusnya dilalui rute. Rute direncanakan ulang melewatinya.',
  'help.guide.tour-loop-reverse.goal': 'Buat tur berakhir di titik awalnya, atau balik arahnya.',
  'help.guide.tour-leg-by-hand.title': 'Menggambar ruas dengan tangan, atau merencanakannya ulang',
  'help.guide.tour-leg-by-hand.result':
    'Ruas itu menjadi garis lurus di tempat yang kamu pilih, ditandai digambar tangan, atau dirutekan ulang.',
  'help.guide.tour-trip-places.tip.2':
    'Menghapus perhentian atau melepas tautannya tidak mengubah tempat di perjalanan, termasuk hari-harinya.',
  'help.guide.tour-details-times.step.4':
    '“Direncanakan” menampilkan totalnya. Ketik nilaimu sendiri untuk menggantinya; nilai itu lalu ditandai “Penggantian manual”.',
  'help.guide.tour-save.step.2':
    'Tunggu sampai titik di samping “Tur baru” hilang. “Simpan” memerlukan rute beserta semua data ketinggiannya.',
  'help.guide.tour-edit-saved.goal': 'Buka tur yang pernah kamu rencanakan, ubah, lalu simpan lagi.',
  'help.guide.tour-edit-saved.result': 'Tur yang tersimpan sekarang berisi perubahanmu.',
  'help.guide.tour-summary-profile.tip.2':
    'Rute yang melewati via ferrata mendapat lencana peringatan dengan tingkatnya di atas angka-angkanya.',
  'help.guide.tour-list-manage.step.4':
    'Tombol di atas “Total perjalanan” adalah filternya. Tombol itu menampilkan status yang dipakai, awalnya “Semua”, dengan jumlah tur.',
  'help.guide.tour-delete.step.1':
    'Arahkan kursor ke tur di bawah “Tur dalam perjalanan ini”, lalu klik ikon tempat sampah di kanan barisnya, “Hapus” dengan nama tur itu.',
  'help.guide.tour-saved-elsewhere.step.1':
    '“Tur ini disimpan di tempat lain” muncul di bagian atas rel saat kamu mengedit. Perubahanmu tetap ada sampai kamu memutuskan.',
  'help.ctx.trip-tour-import.summary':
    'Di sini kamu mengimpor tur yang sudah ada di tempat lain ke perjalanan: file GPX, KML, atau KMZ dari jam atau aplikasi, tur dari perjalananmu yang lain, atau jalur dari wanderer milikmu sendiri. Hasil impor disimpan persis seperti rekamannya, dan kamu bisa merencanakan versi yang bisa diedit darinya.',
  'help.guide.tour-import-gpx.step.1':
    'Buka tab “Tur” di perjalanan. Di bagian atas “Tur dalam perjalanan ini” di sebelah kanan, klik tanda + (“Tambah tur”).',
  'help.guide.tour-import-gpx.tip.4':
    'File KML atau KMZ juga mencantumkan di bawah “Tidak diimpor” apa saja isinya selain garis: pin, area, dan item lainnya.',
  'help.guide.tour-view-import.tip.1':
    'Hasil impor tidak bisa diedit titik demi titik. “Rencanakan versi yang dapat diedit”, di kartu “Versi yang dapat diedit” di atasnya, membuat tur yang bisa kamu ubah dari impor itu.',
  'help.guide.tour-plan-from-import.step.3':
    'Klik “Ganti impor” untuk merencanakan ulang tur ini di tempatnya: hari dan catatannya tetap ada, dan jejak rekamannya disimpan agar bisa dipulihkan. “Rencanakan sebagai tur baru” tidak mengubah impornya dan membuat tur kedua di sampingnya.',
  'help.guide.tour-restore-recorded.goal':
    'Batalkan perencanaan ulang hasil impor dan kembalikan jejak aslinya, bahkan lama setelahnya.',
  'help.guide.tour-take-over.goal':
    'Pakai ulang tur yang sudah kamu rencanakan atau impor di perjalananmu yang lain, tanpa menggambarnya lagi.',
  'help.guide.tour-take-over.tip.2':
    'Hanya perjalananmu yang lain yang tercantum, dan hanya 100 tur pertama. Pakai pencarian atau filter untuk menemukan sisanya.',
  'help.guide.tour-import-wanderer.step.4': 'Klik “Impor ke perjalanan”.',
  'help.ctx.trip-tour-map.bullet.1':
    'Pil di kiri bawah peta berisi peta dasar yang tersedia untuk jenis tur yang terbuka: “Peta”, Topo, “Pendakian” untuk pendakian, “Bersepeda” untuk tur sepeda, dan “Satelit”. Pilihanmu di sana hanya berlaku untuk perencana dan tidak pernah mengubah pengaturan peta di “Pengaturan”.',
  'help.guide.tour-map-layers.step.2':
    'Klik Topo untuk garis kontur dan relief berbayang, peta yang menunjukkan kecuraman medan. Peta yang kamu pilih tetap disorot di pil.',
  'help.guide.tour-along-search.step.1':
    'Buka tur di tab “Tur” dan gulir panel kiri ke bawah sampai “Di sepanjang tur”, di bawah perhentian tur. Kartunya muncul begitu tur punya rute.',
  'help.guide.tour-along-search.tip.3':
    'Hasilnya berasal dari OpenStreetMap dan indeks tempat TREK, jadi pencarian memerlukan koneksi. Jika tidak ada hasil, Perlebar ke mencoba jarak berikutnya; jika server sedang sibuk, “Coba lagi” menampilkan hitung mundur sampai kamu bisa mencoba lagi.',
  'help.guide.tour-along-add-stop.tip.1':
    'Tempat itu menjadi perhentian tur, bukan tempat perjalanan, jadi tidak muncul di daftar tempat.',
  'help.guide.tour-3d-terrain.step.4':
    'Geser penggeser Relief untuk membuat bukit hingga tiga kali lebih tinggi, yang membantu di medan landai.',
  'help.guide.tour-3d-flyover.step.1':
    'Alihkan tur ke 3D. Selama lanskap di sepanjang rute dimuat, sebuah lingkaran terisi di tempat tombol putar akan muncul; begitu penuh, klik “Putar penerbangan”. Kamera mengikuti titik di sepanjang rute, dan kursor di profil elevasi pada “Ringkasan tur” ikut bergerak.',
  'help.guide.tour-map-overlays.title': 'Menampilkan lintasan ski atau rambu laut di atas peta',
  'help.guide.tour-map-overlays.tip.2':
    'Sakelar lintasan ski juga ada saat tidak ada tur yang terbuka, jadi kamu bisa melihat area ski sebelum merencanakan apa pun. Pada pendakian, pil itu menawarkan “Jalur via ferrata” sebagai gantinya, dengan jumlah rute yang terlihat.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Tanda plus di baris tur, “Tambah ke hari ini”, menaruh etape-etapenya satu per hari mulai dari hari yang kamu pilih, atau seluruh tur di satu hari itu.',
  'help.guide.tour-multi-day.step.6':
    'Untuk menjadikannya tur satu hari lagi, klik “Satu hari” dan konfirmasi “Jadikan tur sehari?” dengan “Hapus semua akhir etape”. Rutenya tetap seperti semula.',
  'help.guide.tour-stages-on-days.step.1':
    'Di “Tur dalam perjalanan ini”, arahkan kursor ke tur beberapa hari, lalu klik tanda plus, “Tambah ke hari ini”.',
  'help.guide.tour-stages-on-days.tip.3':
    'Menyeret tur beberapa hari ke suatu hari di tab “Rencana” juga menanyakan hal yang sama lewat dialog, begitu juga “Tambah ke Hari” di kartu tur.',
  'help.ctx.trip-tour-hike.bullet.4':
    '“Detail jalur”, di bawah titik jalan, menampilkan tingkat SAC, permukaan, dan jenis jalan setiap bagian dari OpenStreetMap, lalu mewarnai rute di peta sesuai data itu. Tidak ada yang di sini mengubah tur.',
  'help.guide.tour-hike-plan.step.4':
    '“Tambah titik” aktif sejak awal: klik peta di titik awal dan titik akhir pendakian. “Tempat perjalanan” di sampingnya untuk memilih pondok atau hotel dalam perjalanan. Begitu ada dua titik, TREK menghitung rute jalan kakinya.',
  'help.guide.tour-hike-trail-details.title': 'Melihat tingkat, permukaan, dan jenis jalan di sepanjang pendakian',
  'help.guide.tour-hike-trail-details.tip.1':
    'Jalan yang tidak punya nilai di OpenStreetMap tercantum di bawah “Tidak diketahui”, dan tidak diketahui bukan berarti mudah. Jika ada yang bertuliskan “Tidak dapat ditanyakan kali ini”, klik “Coba lagi”.',
  'help.guide.tour-hike-round.step.4':
    'Klik salah satu putaran untuk memilihnya. Barisnya menunjukkan jarak, tanjakan, dan waktu, serta selisihnya dari jarak yang kamu minta.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Arahkan kursor ke perhentian awal bagian itu, klik “Tindakan lainnya” di barisnya, lalu pilih “Bandingkan jalan untuk bagian berikutnya”.',
  'help.guide.tour-ferrata-add.title': 'Menambahkan via ferrata ke pendakian',
  'help.guide.tour-ferrata-add.tip.1':
    'Via ferrata memerlukan perlengkapan dan pengalaman. Tooltip lencananya menunjukkan berapa panjang via ferrata yang didaki rute.',
  'help.guide.tour-run-plan.step.3': 'Ketik “Pace rencana”-mu dalam menit dan detik per kilometer, misalnya 7:30.',
  'help.guide.tour-run-ways.title': 'Melihat jenis jalan yang dilalui rute lari',
  'help.ctx.trip-tour-walk.title': 'Jalan-jalan kota',
  'help.guide.tour-walk-plan.goal':
    'Susun jalan-jalan wisata dari beberapa perhentian, lengkap dengan lama singgah di masing-masing dan mana yang penting.',
  'help.guide.tour-walk-plan.tip.2':
    'Jalan-jalan kota tidak punya batas pendakian dan tidak punya kolom “Istirahat”: lama singgah yang dipakai sebagai gantinya.',
  'help.guide.tour-walk-sights.step.4':
    'Klik tempat di daftar. Kartunya terbuka di atas peta: di bawah “Masuk di mana”, pilih dua perhentian yang mengapit tempat itu.',
  'help.guide.tour-walk-day-times.step.1':
    'Masukkan jalan-jalan ke suatu hari: di “Tur dalam perjalanan ini”, klik tanda + bulat di barisnya (“Tambah ke hari ini”) dan pilih harinya.',
  'help.guide.tour-walk-day-times.result':
    'Kamu bisa mengatur ulang urutan perhentian atau mengubah lama singgah sampai semua tempat buka saat kamu tiba.',
  'help.guide.tour-walk-google-import.tip.2':
    '“Pakai tautan lain” membawamu kembali ke kolom tautan. Memuat rute mengganti perubahan yang belum disimpan di perencana, dan dialog memperingatkanmu dulu.',
  'help.guide.tour-walk-check-off.step.4':
    'Bagian atas daftar menghitung perhentian yang sudah dikunjungi dan menampilkan sisa waktu jalan kaki. “Batalkan” pada perhentian menghapus tandanya.',
  'help.ctx.trip-tour-bike.bullet.2':
    '“Ringkasan tur” di kanan menampilkan “Waktu bersepeda (perkiraan)”, yaitu waktu dari router untuk profil itu, termasuk tanjakan. Istirahat tidak termasuk.',
  'help.guide.tour-bike-profile.step.4':
    'Di bawah “Titik jalan”, klik “Tempat perjalanan” dan pilih titik awal dan akhirnya, di sini Hotel Alpenroyal lalu Hotel Greif. Kamu juga bisa memastikan “Tambah titik” aktif lalu mengklik peta. Begitu ada dua titik, TREK menghitung rutenya.',
  'help.guide.tour-bike-profile.tip.5':
    'Jika admin mengizinkan peta CyclOSM, deretan lapisan di peta juga menawarkan “Bersepeda” selama tur sepeda terbuka. Jika petanya berhenti dimuat, beralih ke “Peta”. Turnya tidak berubah.',
  'help.guide.tour-bike-surfaces.tip.1':
    '“Tidak ada di data” berarti OpenStreetMap tidak mencatat permukaan di sana. Permukaannya tidak diketahui, belum tentu bagus.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Klik baris tingkat untuk menyorot jalur-jalur itu di peta.',
  'help.ctx.trip-tour-ski.bullet.1':
    '“Disiplin” dipilih lebih dulu, dan tidak ada yang terpilih otomatis: “Alpen”, “Papan seluncur salju”, “Ski lintas alam”, “Tur ski”, “Sepatu salju”, atau “Pendakian salju”. “Ski lintas alam” juga meminta “Teknik”: “Klasik”, “Gaya bebas”, atau “Tidak diketahui”. Tanpa disiplin, tur tidak bisa disimpan.',
  'help.guide.tour-ski-plan.step.2': 'Buka “Jenis tur” dan pilih “Ski & musim dingin”.',
  'help.guide.tour-ski-plan.tip.4':
    'Jika tidak ada data lintasan, ruas berupa garis lurus di antara titik-titiknya. Untuk sepatu salju dan pendakian salju, ruas itu mungkin memakai jalur musim panas, dan keterangan abu-abu pada ruas memberitahukannya.',
  'help.guide.tour-ski-options.step.5':
    'Di bawah “Kecualikan”, tekan setiap jenis lift yang tidak ingin kamu naiki: “Lift seret”, “Kursi gantung terbuka”, “Kabin gondola”, “Kereta gantung”, atau “Funikular dan kereta”. Yang sudah ditekan tampil dicoret.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Klik perbaikan yang ditawarkan baris itu: “Izinkan lintasan lebih sulit”, “Izinkan lift ini”, “Turun dengan lift”, “Ganti teknik”, atau “Ganti disiplin”. Opsinya berubah dan ruas direncanakan ulang.',
  'help.guide.tour-ski-summary.goal':
    'Lihat pembagian hari itu antara bermain ski, naik lift, menunggu, dan berjalan kaki.',
  'help.guide.tour-ski-summary.result':
    'Kamu tahu berapa lama hari itu dihabiskan di lintasan, di lift, dan menunggu lift.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Lapisan ini adalah data peta, bukan laporan langsung: tidak ada informasi tentang apa yang buka atau sudah dirapikan, kondisi salju, atau longsor salju. Sakelarnya juga ada saat tidak ada tur yang terbuka, jadi kamu bisa melihat area ski sebelum merencanakan.',
  'help.guide.tour-ski-import.step.5':
    'Klik jejak di “Tur dalam perjalanan ini” untuk membukanya. Untuk memperbaiki disiplinnya nanti, klik “Ganti” di kartu “Jalur ski”.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Di bawah “Jenis tur”, “Tur dayung” meminta “Perahu” (Kayak, “Kano”, SUP, atau “Lainnya”) dan “Perairan” (“Sungai” atau “Danau”). Tur baru bisa disimpan setelah keduanya dipilih.',
  'help.guide.tour-paddle-setup.step.1': 'Di tab “Tur”, klik “Rencanakan tur baru” di bagian atas kolom kiri.',
  'help.guide.tour-paddle-setup.tip.2':
    'Peta tur dayung menyediakan “Peta” dan “Satelit”, serta “Rambu laut” dari OpenSeaMap sebagai lapisan tambahan.',
  'help.guide.tour-paddle-water-route.step.3':
    'Pilih “Rencanakan bagian berikutnya di air”. TREK merencanakan ruas itu menyusuri sungai atau danau dari titik ini ke titik berikutnya.',
  'help.guide.tour-paddle-portage.title': 'Mengangkut perahu memutari rintangan',
  'help.guide.tour-paddle-portage.tip.2':
    'Pada titik terakhir, “Angkut perahu dari sini” baru berlaku setelah kamu menempatkan titik berikutnya. Barisnya bertuliskan “Pikul dari sini”, dan tanda silangnya, “Batal memikul”, membatalkannya.',
  'help.guide.tour-paddle-lock.step.4':
    'Ketik menit untuk “Menunggu” dan “Melintas”. Setelah keduanya terisi, kartu menampilkan jumlahnya.',
  'help.guide.tour-paddle-time.step.2':
    'Strip itu menunjukkan rute dari awal sampai akhir: perairan, angkut perahu berwarna cokelat, dan pintu air sebagai garis kecil. Rintangan di rute berupa tanda yang bisa diklik untuk menemukannya di peta.',
  'help.guide.tour-paddle-wind.title': 'Memeriksa angin untuk hari mendayung',
  'help.guide.tour-paddle-wind.tip.3':
    'Pada hari berangin dengan penyeberangan danau, kartu menawarkan “Rencanakan dekat tepi”, yang merencanakan rute di danau menyusuri tepiannya.',
  'help.guide.tour-paddle-checklist.step.4':
    'Klik sebuah entri. Peta berpindah ke sana: untuk rintangan, kartunya terbuka beserta keputusanmu; untuk angkut perahu atau pintu air buatanmu sendiri, titiknya terpilih.',
  'help.guide.tour-paddle-track-marks.title': 'Menandai angkut perahu dan pintu air di jejak dayung hasil rekaman',
  'help.guide.tour-paddle-track-marks.step.7': 'Buka kartu-kartunya, ketik menitnya, lalu klik “Simpan”.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Rute terbuka di dialognya sendiri: pilih bagian dan “Arah” yang kamu lalui, periksa “Akses berkuda”, lalu klik “Ambil bagian”.',
  'help.guide.tour-horse-plan.step.3':
    'Di kartu “Rute berkuda”, klik “Cari di tampilan peta”. Setiap rute berkuda bertanda di tampilan itu tercantum beserta panjangnya di sana.',
  'help.guide.tour-horse-plan.tip.3':
    'Menggeser peta setelah mencari? Tombolnya bertuliskan “Cari di tampilan ini”. Jika tampilannya terlalu luas, kamu diminta memperbesar peta dulu.',
  'help.guide.tour-horse-gap.step.4':
    'Di kartu “Titik jalan”, sambungan itu menampilkan “Manual, belum diperiksa” beserta panjangnya. Arahkan kursor ke sana untuk membaca alasannya.',
  'help.guide.tour-horse-recorded.step.2':
    '“Pratinjau impor” terbuka, dan belum ada yang disimpan. Di bawah “Impor sebagai”, atur “Jenis tur” ke “Tur berkuda”. Tiga lencana menunjukkan apa yang dipertahankan impor dan apa yang tidak dihitungnya.',
  'help.guide.dateless-trip.goal': 'Mulai merencanakan meskipun belum tahu kapan berangkat.',
  'help.guide.trip-reminder.step.3': 'Klik “Perbarui”.',
  'help.guide.upcoming-reservations.goal': 'Lihat pemesanan terdekat dari semua perjalananmu dan buka perjalanannya.',
  'help.guide.log-day.tip.3':
    'Hari yang ditandai sebagai hari libur perusahaan sehari penuh tidak bisa dicatat. Pada setengah hari libur perusahaan, satu hari cuti hanya dihitung 0,5.',
  'help.guide.half-company-holiday.goal':
    'Beri semua orang libur setengah hari, misalnya di Malam Natal, tanpa meliburkan seharian penuh.',
  'help.guide.public-holidays.tip.2': 'Arahkan kursor ke hari libur di kisi untuk melihat namanya.',
  'help.guide.edit-holiday-calendar.step.3':
    'Ubah negara atau wilayah di daftarnya, atau klik ikon tempat sampah untuk menghapus kalender itu.',
  'help.guide.person-color.step.2': 'Pilih warna. Warnanya langsung tersimpan dan dialog tertutup.',
  'help.guide.answer-fusion-request.goal':
    'Putuskan apakah rencana cutimu akan digabung dengan orang yang mengundangmu.',
  'help.guide.log-for-partner.goal':
    'Catat hari libur untuk orang yang tergabung dalam rencanamu, misalnya saat dia memintamu.',
  'help.guide.dissolve-fusion.goal': 'Pisahkan rencana gabungan kembali menjadi rencana masing-masing.',
  'help.guide.country-places.step.1':
    'Cari negara yang pernah kamu kunjungi, lalu pilih. Kartunya muncul di panel bawah.',
  'help.guide.tour-activity-stats.step.3':
    'Baca angkanya: jarak, dengan jumlah tur di sudutnya, lalu “Total kenaikan elevasi” dan “Total penurunan elevasi”. Dengan “Semua jenis”, tiga jenis yang paling sering kamu jalani tercantum berikutnya, masing-masing dengan jumlah dan jaraknya.',
  'help.guide.move-to-list.step.1': 'Klik ikon kotak centang, “Pilih”, di baris filter, lalu centang tempat-tempatnya.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Di bawah “Ke perjalanan”, pilih perjalanannya. Perjalanan yang tidak boleh kamu tambahi tur tampil redup.',
  'help.guide.tour-collection-manage.goal':
    'Lihat tur apa saja yang ada di daftar dan asalnya, lalu hapus yang tidak kamu perlukan lagi.',
  'help.guide.entry-draft.goal': 'Tulis entri sekarang dan sembunyikan dari journey yang dibagikan sampai siap.',
  'help.guide.journey-map-layers.step.2':
    'Klik (i) di ujung bar untuk melihat keterangan peta: semua pin, titik, dan garis dijelaskan di sana.',
  'help.guide.journey-keep-route.step.2':
    'Periksa “Zona waktu hari ini”, yang menentukan kapan hari dimulai dan berakhir, lalu periksa rekamannya: jarak, rentang waktu, potongan, dan celah.',
  'help.guide.journey-day-stays.step.2':
    'Klik “Tulis entri jurnal” pada sebuah persinggahan. Entri ditambahkan ke hari itu pada jam kedatangan, dengan nama dan posisi persinggahannya.',
  'help.guide.journey-take-over-day.step.2':
    'Centang persinggahan yang ingin disimpan dan perbaiki namanya. “Gabungkan jadi satu catatan” di antara dua persinggahan yang dicentang menggabungkannya, “Biarkan terpisah” memisahkannya lagi.',
  'help.guide.journey-auto-prepare.step.1': 'Klik ⋯ di kanan atas header untuk membuka “Pengaturan Journey”.',
  'help.guide.photo-location.step.1': 'Klik ⋯ di kanan atas header untuk membuka “Pengaturan Journey”.',
  'help.guide.share-public.tip.3':
    'Draf tidak pernah muncul di tautan, dan rute terekam hanya tampil di hari yang punya entri yang sudah diterbitkan.',
  'help.ctx.settings-plugins.title': 'Plugin',
  'help.ctx.settings-about.bullet.2':
    '“Laporkan Bug” dan “Permintaan Fitur” membuka proyek di GitHub; Wiki membuka dokumentasinya.',
  'help.guide.map-provider.tip.3':
    'Di peta GL, klik kanan dan seret untuk memutar dan memiringkan peta; klik tengah menambahkan tempat.',
  'help.guide.web-push-device.step.1':
    'Di bawah “Notifikasi push di perangkat ini”, klik “Aktifkan untuk perangkat ini” dan izinkan notifikasi saat browser memintanya. “Kirim tes” memastikan notifikasinya sampai.',
  'help.guide.connect-airtrail.title': 'Menghubungkan AirTrail-mu',
  'help.guide.connect-dawarich.title': 'Menghubungkan Dawarich-mu',
  'help.guide.tour-connect-wanderer.title': 'Menghubungkan wanderer-mu',
  'help.guide.tour-connect-wanderer.tip.3': '“Putuskan”, di sebelah kanan, menghapus tokennya lagi.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Saluran untuk petunjuk ini kamu atur di “Notifikasi”, di baris “wanderer: petunjuk tentang jalur Anda”.',
  'help.guide.plugin-settings.tip.1':
    'Pengaturan ini hanya milikmu; anggota lain mengatur plugin untuk diri mereka sendiri.',
  'help.guide.offline-conflicts.step.3':
    'Perubahan yang terus ditolak server muncul di bawah “Cache offline” sebagai “Perubahan gagal”: “Coba lagi” mengirimnya sekali lagi, “Buang” mempertahankan versi server.',
  'help.ctx.admin-notifications.bullet.4':
    '“Bawaan untuk pengguna”, di bagian bawah: per peristiwa dan saluran, “Aktif”, “Mati”, atau “Diblokir” bagi semua orang yang belum mengubahnya.',
  'help.guide.default-user-settings.step.2':
    'Kolom yang sudah kamu atur mendapat tautan “atur ulang” di samping namanya; tautan itu mengembalikan nilai bawaan TREK.',
  'help.guide.own-routing-engine.title': 'Memakai server rute milikmu sendiri',
  'help.guide.admin-passkeys.result':
    'Halaman masuk menawarkan “Masuk dengan passkey”, dan pengguna bisa menambahkan passkey di pengaturan mereka.',
  'help.guide.rotate-jwt-secret.goal': 'Akhiri semua sesi jika ada dugaan kebocoran.',
  'help.guide.notification-defaults.result':
    'Semua orang yang belum mengubah sel itu memakai pilihanmu sebagai awal, dan sel yang diblokir tampil terkunci di pengaturan mereka.',
  'help.ctx.notifications.bullet.3':
    'Setiap notifikasi menyebutkan siapa melakukan apa dan di mana. Yang belum dibaca punya latar berwarna. Tombol di bawahnya, seperti “Lihat Perjalanan” atau “Lihat Vacay”, membawamu ke sana dan menandainya sudah dibaca.',
  'help.guide.read-notifications.tip.1':
    'Ikon lonceng ada di setiap layar yang punya bar navigasi, dan angkanya otomatis diperbarui saat ada yang baru.',
  'help.guide.filter-notifications.tip.1':
    'Halaman memuat notifikasi yang lebih lama saat kamu menggulir ke bawah, jadi tidak ada yang terpotong setelah layar pertama.',
  'help.guide.mark-notifications-read.result':
    'Tidak ada lagi notifikasi berlatar warna, dan angka merah di ikon lonceng hilang.',
  'help.guide.notification-settings.title': 'Memilih notifikasi yang ingin diterima',
  'help.guide.link-journal.step.1':
    'Klik “Pengaturan perjalanan” di samping nama perjalanan, lalu pilih “Jurnal” di kiri.',
  'help.guide.dawarich-stays.tip.1':
    'Tidak ada yang masuk ke perjalanan sampai kamu klik “Tambah tempat”. Tempat yang ditambahkan dari persinggahan menampilkan keterangan ini di detailnya: “Ditambahkan dari rekaman Dawarich-mu”.',
  'help.guide.leave-stop-off-route.title': 'Mengeluarkan perhentian dari rute',
  'help.guide.move-booking-day.step.1':
    'Arahkan kursor ke baris pemesanan di hari itu: pegangan di kirinya menunjukkan bahwa baris itu bisa diseret.',
  'help.guide.place-image-from-file.tip.1': 'Hanya file JPG, PNG, GIF, dan WebP yang ditawarkan; tiket PDF tidak.',
  'help.guide.place-own-hours.step.4':
    'Tombol di kanan “Jam Buka”: tombol salin memberi semua hari jam yang sama dengan hari Senin, dan X menghapus jam buatanmu lagi. Jika TREK menemukan jam bukanya sendiri, “Ambil dari detail tempat” mengembalikannya.',
  'help.guide.confirm-stay-booking.step.2':
    'Pemesanan terbuka di atas rencana. Pil pertama di header-nya menunjukkan statusnya.',
  'help.ctx.trip-map.bullet.9':
    'Setiap tur dalam perjalanan tampil sebagai garis dengan warnanya, dengan pin di titik awalnya. Klik garisnya untuk membuka kartu tur. Pada hari yang punya tur, rute hari itu menuju titik awal tur dan berlanjut dari titik akhirnya. Ikon mata di samping tur di daftar “Tur”, “Sembunyikan di peta”, menghapus garisnya dari petamu.',
  'help.guide.tour-map-lines.result':
    'Tur yang kamu mau tampil di peta, masing-masing dengan warnanya, dan tur yang kamu sembunyikan tampil redup di daftar “Tur”.',
  'help.guide.car-stops.step.2':
    'Klik pil jenis di header dan pilih “Mobil”. Formulirnya berubah: “Tanggal” dan “Waktu mulai” menjadi “Penjemputan” dan “Waktu jemput”, “Tanggal selesai” dan “Waktu selesai” menjadi “Pengembalian” dan “Waktu kembali”, dan “Perhentian di sepanjang jalan” muncul di bawah “Dari” dan “Ke”.',
  'help.guide.transport-details.goal':
    'Lihat semua detail perjalanan di satu tempat, salin kode pemesanannya, ganti namanya, atau langsung lihat di peta.',
  'help.guide.transport-details.tip.2':
    'Escape atau klik di luar detail menutupnya. Jika “Ganti nama” atau pertanyaan hapus sedang terbuka, itu yang tertutup lebih dulu.',
  'help.guide.export-transports-csv.tip.1': 'Ikonnya hanya ada di bar selama tab berisi setidaknya satu perjalanan.',
  'help.guide.group-sort-bookings.step.1':
    'Di “Kartu” atau “Daftar”, klik “Opsi tampilan”, ikon penggeser setelah tiga ikon tampilan.',
  'help.guide.create-booking.tip.4':
    'Saat offline, pemesanan disimpan di perangkat ini dan disinkronkan begitu kamu online lagi. File baru memerlukan koneksi, jadi hapus dulu atau simpan nanti. Jika kamu tidak sengaja mengklik di luar formulir, atau menekan Escape, TREK bertanya “Buang perubahan?” sebelum isianmu hilang.',
  'help.guide.booking-on-map.tip.2': 'Penginapan terbuka di malam pertamanya.',
  'help.guide.export-bookings-csv.step.3':
    'Klik “Ekspor sebagai spreadsheet (CSV)”, ikon spreadsheet setelah “Opsi tampilan”.',
  'help.guide.arrange-packing-list.step.3':
    '“A ke Z” di ujung kanan baris yang berisi “Dibagikan” dan “Daftar saya” menampilkan item setiap daftar sesuai urutan nama, jadi kamu bisa cepat melihat apakah sesuatu sudah ada. Klik lagi untuk kembali ke urutanmu sendiri.',
  'help.guide.count-packed-pieces.step.1':
    'Klik lencana jumlah di baris, angka kecil dengan x di belakangnya, ketik berapa yang kamu bawa, misalnya 5, lalu tekan Enter.',
  'help.guide.expense-receipts.step.3':
    'Klik “Simpan” di bagian bawah dialog. File diunggah bersama pengeluaran dan juga muncul di “File” perjalanan.',
  'help.guide.files-sync-settings.step.1':
    'Klik “Sinkronisasi dokumen” di ujung kanan bar. Jika perjalanan sudah terhubung, kartu penyimpananmu terbuka di kanan; jika ada lebih dari satu penyimpanan, klik yang kamu mau di bawah “Perjalanan ini” di kiri.',
  'help.guide.files-sync-settings.tip.3':
    '“Pembaruan seketika”, tautan dengan tombol “Salin” di sampingnya, hanya ada untuk penyimpanan yang perubahannya tidak bisa dipantau TREK secara otomatis. Tempel tautan itu di penyimpanan, dan perubahan langsung sampai, tidak menunggu pemeriksaan berikutnya.',
  'help.guide.manage-notes.step.1':
    'Klik tiga titik di header kartu catatan (“Opsi lainnya”). Menunya berisi “Perluas”, “Sematkan”, “Edit”, dan “Hapus”.',
  'help.guide.note-categories.title': 'Mengelompokkan catatan ke dalam kategori',
  'help.guide.note-categories.result':
    'Catatan tampil dengan nama dan warna baru, dan kartu “Catatan” hanya menampilkan kategori yang kamu pilih.',
  'help.guide.roadtrip-stops.tip.5':
    'Perhentian yang punya jam selesai di rencana hari berlangsung sampai jam itu. Dialognya menunjukkan kapan perjalanan berangkat lagi, dan “Hapus waktu selesai” membuatmu bisa mengatur sendiri lama singgahnya lagi.',
  'help.guide.roadtrip-reorder.tip.2':
    'Perjalanan yang dipesan dan terminalnya tetap di posisi yang ditentukan pemesanannya; hanya tempat yang bisa diseret.',
  'help.guide.roadtrip-overnight.step.2':
    'Hotel menampilkan ikon tempat tidur, bukan tanda plus. Klik ikon itu, “Tambahkan sebagai menginap”, untuk membuka “Tambahkan sebagai perhentian” untuk malam itu. Tempat berkemah punya tombol “Tambah” seperti biasa.',
  'help.guide.roadtrip-stop-fill.goal':
    'Beri satu perhentian isi bahan bakar atau isi daya level pengisiannya sendiri, misalnya 80 % di pengisi daya cepat atau 100 % semalaman.',
  'help.guide.roadtrip-bookings.goal':
    'Lihat posisi perjalanan yang dipesan dalam perjalanan darat, dan kapan kamu harus sudah tiba di sana.',
  'help.guide.roadtrip-bookings.tip.3':
    'Perjalanan yang tidak ada di hari mana pun dalam trip tidak ikut dalam perjalanan darat: keterangan di bagian atas rel menyebutkannya, dengan “Buka pemesanan” untuk memberinya tanggal.',
  'help.guide.roadtrip-google-import.step.4':
    'Di bawah “Hari”, pilih hari untuk perhentian-perhentian itu, lalu klik “Impor”.',
  'help.guide.roadtrip-hazards.step.2':
    'Di bawah “Peringatan terkini”, di bagian bawah kolom kanan dialog, aktifkan “Tampilkan area bahaya”, lalu klik “Tutup”.',
  'help.ctx.trip-tours.bullet.1':
    'Sakelar “Tempat” dan “Tur” di bagian atas kolom kanan menukar daftar tempat dengan daftar tur. Sakelar ini hanya ada selama addon Tur aktif, dan saat itu tur tidak pernah tampil di daftar “Tempat”.',
  'help.guide.tour-show-list.step.1':
    'Di tab “Rencana”, klik “Tur” di sakelar bagian atas kolom kanan. Kolom itu sekarang mencantumkan tur, bukan tempat.',
  'help.guide.tour-show-list.result':
    'Kolom kanan mencantumkan tur-tur perjalanan, dan tur yang kamu klik terbuka di kartunya.',
  'help.guide.tour-add-to-day.tip.1':
    'Menyeret tur yang punya etape ke suatu hari juga menanyakan hal yang sama lewat dialog kecil. “Batal” membiarkan rencana tetap seperti semula.',
  'help.guide.tour-day-times.step.2':
    'Isi “Mulai” dan biarkan “Selesai” kosong. Keterangan di bawah kolom menunjukkan jam selesai yang dihitung TREK: jam mulai ditambah durasi tur.',
  'help.guide.tour-remove-from-day.title': 'Mengeluarkan tur dari suatu hari',
  'help.guide.tour-filter-list.title': 'Menyaring daftar tur',
  'help.guide.tour-filter-list.tip.3':
    'Jika tidak ada yang tersisa, daftar menampilkan Tidak ada tur yang cocok dengan filter ini, dan “Atur ulang filter” menghapus semuanya. Filter hanya mengubah apa yang ditampilkan daftar, tidak pernah mengubah tur atau hari.',
  'help.guide.tour-hide-on-map.tip.2':
    'Peta di ponsel selalu menampilkan semua tur, dan tab “Tur” tidak punya ikon mata: fitur sembunyikan hanya ada di tab “Rencana” ini.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Hasil impor tetap di daftar ini dan tidak terbuka di perencana. Masukkan ke suatu hari lewat tanda + bulatnya, atau buka tab “Tur” untuk melihatnya di sana.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Kartu ini untuk membaca dan untuk hal-hal pelengkap tur. Rutenya sendiri diubah di tab “Tur”: buka tab itu dan klik tur di bawah “Tur dalam perjalanan ini”. Tur juga dihapus di sana, bukan di sini.',
  'help.guide.tour-detail-read.step.6':
    'Gulir terus untuk melihat “Deskripsi” dan “Catatan”, lalu “Asal”: “direncanakan di TREK”, file asal impornya, atau jalur wanderer asalnya, beserta tanggalnya.',
  'help.guide.tour-rename-colour.title': 'Mengganti nama dan warna tur',
  'help.guide.tour-rename-colour.result':
    'Tur tampil dengan nama barunya di seluruh perjalanan, dan garisnya digambar dengan warna yang kamu pilih.',
  'help.guide.tour-take-along.tip.3':
    'File diambil dari server, jadi memerlukan koneksi. Tur yang dibuat saat offline bisa diunduh setelah tersinkron.',
  'help.guide.tour-copy-keep.step.4':
    'Pilih daftarnya di bawah “Koleksi”, periksa “Nama di koleksi”, lalu klik “Simpan”.',
  'help.guide.tour-packing-link.step.1': 'Buka kartu tur dan gulir ke “Daftar bawaan”. Klik “Tautkan daftar bawaan”.',
  'help.guide.tour-packing-link.result':
    'Kamu berada di daftar bawaan di tab “Daftar”, dan kartu tur menampilkan setiap item yang kamu centang.',
  'help.guide.tour-files.result': 'File-file itu terlampir di tur dan bisa dibuka dari kartunya.',
  'help.guide.tour-activity-link.tip.1':
    'Rencananya tetap seperti semula. Jejak hanya ditautkan, dan “Lepas Tautan” melepasnya lagi.',
  'help.guide.tour-activity-compare.step.3':
    'Klik “Bandingkan di peta” untuk menggambar jejak aktual dengan garis titik-titik di samping rencana. “Akhiri perbandingan” menghapusnya lagi.',
  'help.guide.tour-origin-check.step.2':
    '“Diimpor” menunjukkan tanggal impornya. “Di sini” menunjukkan kondisinya saat ini: “Seperti saat diimpor”, “Diedit di TREK”, atau “Direncanakan ulang, jejak rekaman disimpan”.',
  'help.ctx.trip-tour-planner.bullet.1':
    '“Tur” ada di bar tab perjalanan tepat setelah “Rencana” selama addon Tur aktif. Tab ini tersedia di komputer dan tablet; di ponsel, tur bisa dilihat dan dimasukkan ke hari dari tab “Rencana”, tapi tidak bisa digambar.',
  'help.guide.tour-open-workspace.step.1':
    'Klik “Tur” di bar tab perjalanan, tepat setelah “Rencana”. Peta memenuhi layar, dengan rel di masing-masing sisi.',
  'help.guide.tour-open-workspace.tip.2':
    'Jatuhkan file GPX, KML, atau KMZ di mana saja di tab ini untuk mengimpornya sebagai tur perjalanan.',
  'help.guide.tour-draw-route.step.4':
    '“Titik ditempatkan” muncul di bagian bawah peta. “Urungkan” di sampingnya menghapus titik itu lagi.',
  'help.guide.tour-type-profile.title': 'Memilih jenis tur',
  'help.guide.tour-type-profile.result': 'Tur dirutekan sesuai jenis dan profil yang kamu pilih.',
  'help.guide.tour-edit-points.step.6':
    '“Urungkan perubahan titik lintasan” dan “Ulangi perubahan titik lintasan” di header rel membatalkan atau mengulangi setiap perubahan, satu per satu.',
  'help.guide.tour-shaping-points.step.3':
    'Di bawah “Titik jalan”, titik itu tercantum dengan lencana “Titik bentuk” tanpa nomor, jadi nomor perhentian tetap sama.',
  'help.guide.tour-loop-reverse.step.1':
    'Klik “Kembali ke awal” di header kartu “Titik jalan”. Tur mendapat ruas terakhir yang kembali ke titik pertamanya.',
  'help.guide.tour-leg-by-hand.goal':
    'Sambungkan dua titik dengan garis lurus jika router tidak menemukan jalan, atau rencanakan ulang ruasnya.',
  'help.guide.tour-trip-places.title': 'Memakai tempat perjalanan sebagai perhentian',
  'help.guide.tour-trip-places.tip.3': 'Tur lain dalam perjalanan tidak pernah ditawarkan sebagai perhentian.',
  'help.guide.tour-details-times.tip.1': 'Waktu bisa diketik sebagai 2:56, 2 j 56, atau 176 menit.',
  'help.guide.tour-save.step.3':
    'Klik “Simpan” di bagian bawah rel kiri. Muncul “Tur disimpan”, dan judul rel berubah menjadi “Edit tur”.',
  'help.guide.tour-edit-saved.step.1':
    'Klik tur di bawah “Tur dalam perjalanan ini”. Tur terbuka di rel kiri sebagai “Edit tur”, dan peta menampilkan rutenya.',
  'help.guide.tour-summary-profile.title': 'Membaca ringkasan tur dan profil elevasi',
  'help.guide.tour-summary-profile.tip.3':
    'Tur dayung tidak menampilkan ketinggian, karena di air satu-satunya data ketinggian yang tersedia adalah ketinggian tepiannya.',
  'help.guide.tour-list-manage.step.5':
    'Pilih “Belum direncanakan” untuk tur yang belum ada di hari mana pun, atau saring berdasarkan “Sumber”, “Batas rute”, atau “Jenis”. Setiap baris menunjukkan berapa tur yang cocok, dan totalnya mengikuti filter.',
  'help.guide.tour-delete.step.2':
    'Baca apa saja yang ikut terhapus: rute, titik jalan yang bisa diedit, dan penjadwalan harinya. Klik “Hapus permanen”.',
  'help.guide.tour-saved-elsewhere.step.2':
    '“Muat yang terbaru” mengganti perubahanmu dengan versi yang lebih baru, setelah konfirmasi.',
  'help.ctx.trip-tour-import.bullet.1':
    'Tanda + di bagian atas “Tur dalam perjalanan ini” adalah “Tambah tur”. Isinya “Impor GPX atau KML”, “Impor rute jalan kaki dari Google Maps”, dan “Ambil tur dari perjalanan lain”. File juga bisa dijatuhkan di mana saja di tab “Tur”.',
  'help.guide.tour-import-gpx.step.2':
    'Pilih “Impor GPX atau KML”, lalu pilih satu atau beberapa file .gpx, .kml, atau .kmz, masing-masing maksimal 10 MB.',
  'help.guide.tour-import-gpx.tip.5':
    'File tanpa data ketinggian menampilkan “Tidak ada ketinggian di berkas”. Garis dan jaraknya tetap benar, tapi tanjakan dan turunannya tidak diketahui.',
  'help.guide.tour-view-import.tip.2':
    'Ikon unduh di header menyimpannya lagi sebagai file GPX, dan ikon penanda menyimpannya ke koleksi.',
  'help.guide.tour-plan-from-import.step.4':
    'Tur terbuka di editor beserta titik jalannya. Ubah jika perlu, lalu klik “Simpan” di bagian bawah kolom.',
  'help.guide.tour-restore-recorded.step.1':
    'Di “Tur dalam perjalanan ini”, klik tur yang sudah kamu rencanakan ulang. Kartu “Jejak yang direkam” di editor menunjukkan bahwa jejak rekaman aslinya masih disimpan.',
  'help.guide.tour-take-over.step.1':
    'Buka tab “Tur” di perjalanan tujuan. Di bagian atas “Tur dalam perjalanan ini”, klik tanda + (“Tambah tur”).',
  'help.guide.tour-take-over.tip.3':
    '“Mengambil tur memerlukan koneksi.” Jika editor masih punya perubahan yang belum disimpan, salinannya tetap ditambahkan ke daftar, tapi tidak dibuka, jadi pekerjaanmu tetap terbuka.',
  'help.guide.tour-import-wanderer.tip.1':
    'Tombol ini muncul setelah wanderer terhubung di “Pengaturan”, “Integrasi”. Sebelum itu, daftarnya menawarkan “Hubungkan di pengaturan”.',
  'help.ctx.trip-tour-map.bullet.2':
    'Setelah pembatas di pil ada sakelar sesuai jenis tur: “Tempatkan titik” saat kamu mengedit tur, “Jalur via ferrata” untuk pendakian, “Rambu laut” untuk tur dayung, dan lintasan ski untuk tur ski. 3D di ujung menampilkan tur di atas lanskap 3D.',
  'help.guide.tour-map-layers.step.3':
    'Pada pendakian, klik “Pendakian” untuk jalur bertanda beserta nomornya; tur sepeda menawarkan “Bersepeda” untuk rute sepeda. “Satelit” menampilkan citra udara, dan “Peta” mengembalikanmu ke peta standar.',
  'help.guide.tour-along-search.step.2':
    'Klik “Apa yang dicari” dan centang jenis tempat yang kamu mau, maksimal enam sekaligus: “Titik pandang”, “Puncak”, “Pondok dan tempat berteduh”, “Air minum”, “Makanan”, dan lainnya. Pilihannya disesuaikan dengan jenis tur, dan setiap tur dimulai dengan tiga di antaranya sudah tercentang.',
  'help.guide.tour-along-add-stop.title': 'Menambahkan tempat di sepanjang tur sebagai perhentian',
  'help.guide.tour-along-add-stop.tip.2':
    'Tempat yang menjadi titik akhir baru ditandai “Memperpanjang tur”: titik akhir lama tidak lagi menjadi akhir, dan tur berlanjut ke tempat ini.',
  'help.guide.tour-3d-terrain.step.5': 'Klik 3D lagi untuk kembali ke peta datar dan melanjutkan perencanaan.',
  'help.guide.tour-3d-flyover.step.2':
    'Di bawah “Kecepatan”, pilih 1×, 2×, atau 4×. Pada 1×, kebanyakan tur memakan waktu sekitar 45 detik dari awal sampai akhir.',
  'help.guide.tour-map-overlays.goal':
    'Tampilkan lintasan ski dan lift, atau pelampung dan tanda pelabuhan, di peta saat merencanakan tur ski atau tur dayung.',
  'help.guide.tour-map-overlays.tip.3':
    'Jika suatu lapisan berhenti dimuat, sakelarnya menampilkan tanda ! beserta penjelasannya; peta dan rutemu tetap berfungsi tanpa lapisan itu.',
  'help.guide.tour-multi-day.title': 'Merencanakan tur selama beberapa hari',
  'help.guide.tour-multi-day.tip.1':
    '“Akhiri etape di sini” juga bisa dipakai pada tur satu hari: tur itu otomatis menjadi tur beberapa hari. Perhentian pertama dan terakhir serta titik bentuk tidak bisa menjadi akhir etape.',
  'help.guide.tour-stages-on-days.step.2': 'Pilih hari untuk memulai etape pertama.',
  'help.guide.tour-stages-on-days.tip.4':
    'Di rencana hari, setiap etape tampil sebagai Etape N dengan jarak dan waktunya sendiri. “Urungkan” di atas hari-hari di tab “Rencana” membatalkan seluruh pembagian itu dalam satu langkah.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Pada pendakian, “Jalur via ferrata” di deretan tombol peta di kiri bawah menampilkan via ferrata di sekitar. Kartu via ferrata menambahkannya ke rute sebagai ruas tersendiri.',
  'help.guide.tour-hike-plan.step.5':
    'Di bawah “Detail”, buka “Tingkat kesulitan jalur maksimum” dan pilih seberapa sulit jalurnya boleh, dari T1 (“Pendakian”) sampai T6 (“Pendakian alpin sulit”). Rute direncanakan ulang sesuai batas itu.',
  'help.guide.tour-hike-trail-details.goal':
    'Baca data OpenStreetMap untuk jalan-jalan yang dilalui pendakian, dan temukan bagian-bagian itu di peta.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Tingkat yang lebih tinggi dari batas pendakian menampilkan lencana “Di atas batas” di barisnya.',
  'help.guide.tour-hike-round.step.5':
    'Klik “Ambil putaran ini”, lalu “Ganti” saat ditanya apakah rute yang direncanakan akan diganti.',
  'help.guide.tour-hike-compare-ways.step.2':
    '“Jalan lain untuk bagian ini” terbuka di atas peta dengan “Jalan saat ini” dan Jalan A, Jalan B, dan seterusnya. Masing-masing digambar di peta dengan warnanya sendiri, dan mengarahkan kursor ke sebuah baris menyorot garisnya.',
  'help.guide.tour-ferrata-add.goal':
    'Temukan via ferrata di sekitar pendakianmu dan jadikan salah satunya bagian dari rute.',
  'help.guide.tour-ferrata-add.tip.2':
    'Via ferrata hanya ditawarkan untuk pendakian. Via ferrata yang sudah dilalui rute menampilkan “Bagian dari tur” di kartunya, bukan “Tambahkan ke tur”.',
  'help.guide.tour-run-plan.step.4':
    'Tentukan titik awal dan akhir di peta, atau pilih lewat “Tempat perjalanan”. Di bawah pace, kamu melihat waktu larinya: jarak dikali pace.',
  'help.guide.tour-run-ways.goal': 'Periksa berapa bagian rute lari yang tidak beraspal dan seberapa sulit jalurnya.',
  'help.ctx.trip-tour-walk.summary':
    'Tur jalan kaki dari satu perhentian ke perhentian lain, direncanakan di tab “Tur”: lama singgah di setiap perhentian, mana yang penting, objek wisata di sepanjang jalan, dan kapan kamu tiba di setiap perhentian pada hari jalan-jalan, dicocokkan dengan jam bukanya.',
  'help.guide.tour-walk-plan.step.1':
    'Klik “Rencanakan tur baru” di bagian atas kolom kiri, lalu buka “Jenis tur” dan pilih “Jalan-jalan kota / wisata”.',
  'help.guide.tour-walk-plan.tip.3':
    '“Lepas dari tempat”, di “Tindakan lainnya” pada perhentian, hanya melepas tautan ke tempat perjalanan. Tempatnya sendiri tetap ada di perjalanan.',
  'help.guide.tour-walk-sights.step.5':
    'Klik “Tambahkan sebagai perhentian”. Sebuah pemberitahuan menunjukkan berapa lama jalan-jalan itu bertambah, dengan “Urungkan” di sampingnya.',
  'help.guide.tour-walk-day-times.step.2':
    'Beri jam mulai di hari itu: di tab “Rencana”, klik kanan jalan-jalan di harinya, pilih “Edit”, lalu isi “Mulai”.',
  'help.guide.tour-walk-google-import.title': 'Menjadikan rute jalan kaki Google Maps sebagai jalan-jalan kota',
  'help.guide.tour-walk-google-import.tip.3':
    'Hanya perhentiannya yang diambil, bukan garis yang digambar di Google Maps. Tautan pendek maps.app.goo.gl memerlukan koneksi untuk dibuka.',
  'help.guide.tour-walk-check-off.tip.1':
    'Tanda disimpan per hari: buka jalan-jalan dari harinya di rencana, bukan dari daftar tur.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Kartu “Permukaan dan jalan” di bawah “Titik jalan” menunjukkan permukaan rute: jenis permukaan, jenis jalan, dan porsi yang diketahui tidak beraspal. Klik baris untuk menyorot bagian-bagiannya di peta.',
  'help.guide.tour-bike-profile.step.5':
    'Lihat “Waktu bersepeda (perkiraan)” di “Ringkasan tur” di sebelah kanan. Arahkan kursor ke titik infonya untuk melihat cara menghitungnya.',
  'help.guide.tour-bike-surfaces.title': 'Melihat permukaan rute tur sepeda',
  'help.guide.tour-bike-surfaces.tip.2':
    'Pada profil Road, peringatan di atas bar menunjukkan berapa jauh rute yang diketahui tidak beraspal. “Tampilkan di peta” menandai bagian-bagian itu.',
  'help.guide.tour-bike-mtb-grades.result':
    'Peta menandai jalur dengan tingkat yang kamu pilih, dan kamu tahu bagian mana dari tur yang sulit.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Di bawah disiplin ada opsi router lintasan, hanya yang dipakai disiplinmu: “Lintasan tersulit”, “Utamakan”, “Kecepatan”, sakelar seperti “Naik lift”, dan “Kecualikan” untuk jenis lift yang tidak ingin kamu naiki. Setiap perubahan merencanakan ulang tur.',
  'help.guide.tour-ski-plan.step.3':
    'Di bawah “Disiplin”, pilih yang akan kamu lakukan: “Alpen”, “Papan seluncur salju”, “Ski lintas alam”, “Tur ski”, “Sepatu salju”, atau “Pendakian salju”. Tidak ada yang terpilih otomatis, dan tur tidak bisa disimpan tanpa disiplin.',
  'help.guide.tour-ski-plan.result':
    'Tur “Ski & musim dingin” tersimpan di “Tur dalam perjalanan ini”, dengan ruas-ruas yang mengikuti lintasan, lift, dan jalur terpetakan, serta durasinya dihitung di “Ringkasan tur”.',
  'help.guide.tour-ski-options.tip.1': 'Setiap perubahan merencanakan ulang tur, ruas demi ruas.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Jika tidak ada perbaikan yang cocok, klik “Gambar lurus”. Ruasnya menjadi garis lurus di antara kedua titiknya.',
  'help.guide.tour-ski-summary.step.1':
    'Di bawah titik jalan, cari kartu “Rute lintasan”. Klik judulnya untuk melipat atau membukanya lagi.',
  'help.guide.tour-ski-pistes-layer.title': 'Menampilkan lintasan ski di peta',
  'help.guide.tour-ski-pistes-layer.result': 'Lintasan ski digambar di bawah tur, dan kamu bisa membaca arti warnanya.',
  'help.guide.tour-ski-import.step.6':
    'Di “Klasifikasikan jalur ski”, pilih disiplin atau teknik yang tepat, lalu klik “Simpan”.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Setiap titik menampilkan perannya sebagai lencana: “Titik masuk”, “Titik keluar”, “Masuk kembali”, atau “Titik keluar akhir”. Di bawah titik terlihat apa yang ada sesudahnya: ruas yang digambar dengan tangan, angkut perahu, pintu air, atau alasan ruas tidak bisa direncanakan.',
  'help.guide.tour-paddle-setup.step.2':
    'Buka “Jenis tur” dan pilih “Tur dayung”, “Di air, dengan kayak, kano, atau SUP”.',
  'help.guide.tour-paddle-setup.tip.3':
    'Pada tur dayung, “Di sepanjang tur” mencari “Titik masuk air”, “Penyewaan perahu”, dan “Air minum” lebih dulu.',
  'help.guide.tour-paddle-water-route.step.4':
    'Ruas yang tidak bisa direncanakan TREK berubah merah dan menjelaskan alasannya, misalnya belum ada data perairan untuk area itu. Klik “Gambar lurus” untuk menggambarnya dengan tangan untuk sementara.',
  'help.guide.tour-paddle-portage.goal':
    'Tandai bagian yang kamu lalui sambil mengangkut perahu, agar dihitung sebagai jalan darat, dengan waktu untuk turun dan naik perahu lagi.',
  'help.guide.tour-paddle-portage.tip.3':
    'Mengangkut dihitung 2 km/jam sampai kamu mengatur “Kecepatan mengangkut” sendiri di kartu “Perkiraan waktu”.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK tidak tahu jadwal pintu air. Waktunya hanya yang kamu isi, jadi periksa sendiri jam operasional pintu air.',
  'help.guide.tour-paddle-time.step.3':
    'Baris air adalah jarak di air dengan “Kecepatan mendayung”-mu. Ubah kecepatannya di kolom “Kecepatan mendayung” di bagian atas kolom.',
  'help.guide.tour-paddle-wind.goal': 'Lihat prakiraan angin di titik awal tur pada hari kamu mendayung.',
  'help.guide.tour-paddle-wind.tip.4': 'Tidak adanya nilai prakiraan bukan berarti aman. Periksa kondisi di lokasi.',
  'help.guide.tour-paddle-checklist.step.5':
    'Di bagian bawah kolom, klik “Mendayung punya risiko” untuk membaca “Keselamatan di air” sebelum berangkat.',
  'help.guide.tour-paddle-track-marks.goal':
    'Impor jejak dayung dari jam tanganmu, lalu tambahkan bagian tempat kamu mengangkut perahu dan melewati pintu air.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klik tepat di jejaknya: klik yang terlalu jauh dari garis ditolak, dan kartu memberitahukannya.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Setiap bagian tampil sebagai lencana di kartu “Titik jalan” dengan nama rute, titik akses, dan panjangnya. Bagian yang tidak tercakup rute berkuda mana pun bertuliskan “Manual, belum diperiksa”.',
  'help.guide.tour-horse-plan.step.4':
    'Klik rute di daftar. Rute itu terbuka di petanya sendiri, dengan bagian-bagian bernomor.',
  'help.guide.tour-horse-plan.tip.4':
    '“Urungkan perubahan titik lintasan” di header kolom kiri membatalkan satu bagian utuh dalam satu langkah.',
  'help.guide.tour-horse-gap.result':
    'Tur berkuda tidak punya celah lagi, dan bagian sambungannya ditandai sebagai digambar dengan tangan.',
  'help.guide.tour-horse-recorded.step.3': 'Klik Impor 1 tur.',
  'help.guide.dissolve-fusion.step.3': 'Konfirmasi dengan “Pisahkan” di jendela yang muncul.',
};

export default help;

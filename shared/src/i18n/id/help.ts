import type { TranslationStrings } from '../types';

// English fallback until 'id' is translated.
const help: TranslationStrings = {
  'help.title': 'Bantuan & Dokumentasi',
  'help.search': 'Cari di dokumentasi…',
  'help.contents': 'Daftar isi',
  'help.noResults': 'Tidak ada halaman yang cocok.',
  'help.errorTitle': 'Halaman ini tidak dapat dimuat',
  'help.errorBody': 'Konten bantuan diambil dari wiki TREK. Periksa koneksi Anda lalu coba lagi.',

  // center
  'help.center.button': 'Bantuan untuk layar ini',
  'help.center.title': 'Bantuan',
  'help.center.onThisScreen': 'Di layar ini',
  'help.center.screens': 'Layar',
  'help.center.thisScreen': 'Layar ini',
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
  'help.center.noContextHint': 'Cari di dokumentasi, atau beri tahu kami apa yang Anda cari.',
  'help.center.feedback': 'Ada yang kurang?',
  'help.center.feedbackLink': 'Beri tahu kami di GitHub',
  'help.center.discord': 'Tanya di Discord',
  'help.center.quick': 'Singkat',
  'help.center.guide': 'Panduan',
  'help.center.tour': 'Demo',
  'help.center.imageAlt': 'Langkah {n} dari “{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Dasbor',
  'help.ctx.dashboard.summary':
    'Dasbor adalah pintu masuk ke setiap perjalanan. Boarding pass di atas menyorot perjalanan yang sedang berlangsung atau berikutnya, baris di bawahnya menghitung sejauh apa Anda sudah bepergian, dan kartu-kartunya memuat semua yang Anda rencanakan, arsipkan, atau sudah selesai.',
  'help.ctx.dashboard.bullet.1':
    'Boarding pass: perjalanan yang berlangsung atau berikutnya beserta tanggal, peserta, tempat, dan hitung mundur. Klik untuk membuka perjalanan.',
  'help.ctx.dashboard.bullet.2':
    'Statistik perjalanan: negara yang dikunjungi, jumlah perjalanan, hari di jalan, dan jarak terbang, dari semua perjalanan Anda.',
  'help.ctx.dashboard.bullet.3':
    'Kartu perjalanan, disaring menurut Direncanakan, Diarsipkan, dan Selesai, dalam bentuk kisi atau daftar. Kotak pencarian di atasnya mencari di semua perjalanan sekaligus, menurut judul, tanggal, atau tempat di dalamnya. Arahkan kursor ke kartu untuk mengedit, menduplikasi, mengarsipkan, dan menghapus.',
  'help.ctx.dashboard.bullet.4':
    'Widget di kanan: konverter mata uang, jam dunia, reservasi mendatang, dan koleksi. Semuanya bisa dimatikan.',
  'help.ctx.dashboard.bullet.5':
    'Kartu “Perjalanan Baru” dan tombol di pojok kanan bawah sama-sama memulai perjalanan baru.',

  // create-trip
  'help.guide.create-trip.title': 'Membuat perjalanan',
  'help.guide.create-trip.goal': 'Memulai perjalanan baru dengan nama, tanggal, dan foto sampul.',
  'help.guide.create-trip.step.1':
    'Klik “Perjalanan Baru”. Kartu di ujung daftar perjalanan dan tombol di pojok kanan bawah melakukan hal yang sama.',
  'help.guide.create-trip.step.2':
    'Beri nama perjalanan. Itu satu-satunya kolom wajib; sisanya bisa ditambahkan nanti.',
  'help.guide.create-trip.step.3':
    'Pilih tanggal mulai dan selesai. TREK membuat satu hari per tanggal, jadi rencana perjalanan siap diisi.',
  'help.guide.create-trip.step.4':
    'Opsional: tambahkan foto sampul. Unggah milik sendiri, seret ke sini, atau cari tujuannya di Unsplash.',
  'help.guide.create-trip.step.5': 'Klik “Buat Perjalanan Baru”.',
  'help.guide.create-trip.result':
    'Perjalanan muncul di dasbor. Jika ini perjalanan berikutnya, ia mengambil alih boarding pass di atas.',
  'help.guide.create-trip.tip.1':
    'Tanggal bisa diubah nanti. Jika sudah ada reservasi, TREK akan bertanya apakah reservasi ikut dipindahkan bersama harinya.',
  'help.guide.create-trip.tip.2':
    'Mata uang perjalanan yang dipilih di sini adalah tujuan konversi setiap pengeluaran. Pilih mata uang tujuan.',

  // edit-trip
  'help.guide.edit-trip.title': 'Mengedit perjalanan',
  'help.guide.edit-trip.goal': 'Mengganti nama perjalanan, mengubah tanggal, atau menyesuaikan pengaturannya.',
  'help.guide.edit-trip.step.1': 'Arahkan kursor ke kartu perjalanan (atau boarding pass) dan klik ikon pensil.',
  'help.guide.edit-trip.step.2':
    'Ubah yang diperlukan: nama, deskripsi, tanggal, sampul, mata uang, pengingat, atau anggota.',
  'help.guide.edit-trip.step.3': 'Klik “Perbarui”.',
  'help.guide.edit-trip.result': 'Kartu langsung diperbarui, untuk setiap anggota perjalanan.',
  'help.guide.edit-trip.tip.1':
    'Memindahkan tanggal perjalanan yang sudah punya reservasi membuka langkah kedua yang menanyakan apakah reservasi ikut dipindahkan.',

  // cover-image
  'help.guide.cover-image.title': 'Mengatur foto sampul',
  'help.guide.cover-image.goal': 'Memberi perjalanan gambar yang tampil di kartunya dan di boarding pass.',
  'help.guide.cover-image.step.1': 'Buka formulir edit perjalanan lewat ikon pensil di kartunya.',
  'help.guide.cover-image.step.2':
    'Di “Gambar Sampul”, jatuhkan foto, klik untuk mengunggah, atau ketik tujuan di pencarian Unsplash.',
  'help.guide.cover-image.step.3': 'Pilih foto dan klik “Perbarui”.',
  'help.guide.cover-image.result': 'Foto disimpan bersama perjalanan dan tampil di mana pun perjalanan itu terdaftar.',
  'help.guide.cover-image.tip.1':
    'Foto dari pencarian Unsplash diberi kredit otomatis; unggahan Anda sendiri tetap di server Anda.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Menduplikasi perjalanan',
  'help.guide.duplicate-trip.goal': 'Menggunakan kembali perjalanan sebagai templat untuk yang baru.',
  'help.guide.duplicate-trip.step.1': 'Arahkan kursor ke kartu dan klik ikon duplikat.',
  'help.guide.duplicate-trip.step.2': 'Baca apa yang akan disalin dan tidak, lalu konfirmasi.',
  'help.guide.duplicate-trip.result': 'Salinan muncul di samping aslinya, siap diganti nama dan tanggalnya.',
  'help.guide.duplicate-trip.tip.1':
    'Hari, tempat, reservasi, item anggaran, daftar bawaan, dan catatan harian ikut disalin. Anggota, obrolan, jajak pendapat, berkas, dan tautan berbagi tidak.',

  // archive-trip
  'help.guide.archive-trip.title': 'Mengarsipkan dan memulihkan perjalanan',
  'help.guide.archive-trip.goal': 'Menyingkirkan perjalanan tanpa menghapusnya, dan mengembalikannya nanti.',
  'help.guide.archive-trip.step.1': 'Arahkan kursor ke kartu dan klik “Arsipkan”.',
  'help.guide.archive-trip.step.2': 'Ubah filter di atas kartu ke “Diarsipkan” untuk melihatnya lagi.',
  'help.guide.archive-trip.step.3': 'Klik “Pulihkan” di kartu untuk mengembalikannya ke “Direncanakan”.',
  'help.guide.archive-trip.result':
    'Perjalanan yang diarsipkan tetap utuh. Ia hanya berhenti memenuhi dasbor dan umpan kalender semua perjalanan.',

  // delete-trip
  'help.guide.delete-trip.title': 'Menghapus perjalanan',
  'help.guide.delete-trip.goal': 'Menghapus perjalanan untuk selamanya.',
  'help.guide.delete-trip.step.1': 'Arahkan kursor ke kartu dan klik ikon tempat sampah.',
  'help.guide.delete-trip.step.2': 'Konfirmasi. Dialognya menyebut nama perjalanan, jadi Anda tahu itu yang benar.',
  'help.guide.delete-trip.result':
    'Perjalanan beserta hari, tempat, reservasi, dan berkasnya hilang. Tidak bisa dibatalkan; jika ragu, arsipkan saja.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Menemukan perjalanan selesai, beralih kisi dan daftar',
  'help.guide.filter-and-view.goal':
    'Melihat perjalanan yang selesai atau diarsipkan dan memilih tata letak yang Anda suka.',
  'help.guide.filter-and-view.step.1':
    'Gunakan “Direncanakan”, “Diarsipkan”, dan “Selesai” di atas kartu. Selesai berarti semua perjalanan yang tanggal akhirnya sudah lewat.',
  'help.guide.filter-and-view.step.2':
    'Klik ikon daftar untuk beralih ke daftar ringkas; klik lagi untuk kembali ke kisi.',
  'help.guide.filter-and-view.result': 'Dasbor mengingat tata letak Anda di perangkat ini.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Berlangganan semua perjalanan di kalender Anda',
  'help.guide.calendar-feed.goal':
    'Melihat hari dan reservasi setiap perjalanan aktif di aplikasi kalender Anda, selalu tersinkron.',
  'help.guide.calendar-feed.step.1': 'Klik ikon kalender di samping tombol pengalih tampilan.',
  'help.guide.calendar-feed.step.2': 'Klik “Enable calendar subscription”. TREK membuat tautan umpan pribadi.',
  'help.guide.calendar-feed.step.3':
    'Tambahkan umpan dengan salah satu tombol (Google, Apple, Outlook) atau salin tautannya ke aplikasi kalender apa pun yang bisa berlangganan URL.',
  'help.guide.calendar-feed.result':
    'Setiap perjalanan aktif tampil di kalender Anda dan diperbarui sendiri. Perjalanan yang diarsipkan dan yang berakhir lebih dari 90 hari lalu tidak disertakan.',
  'help.guide.calendar-feed.tip.1':
    'Tautannya rahasia. Siapa pun yang memilikinya bisa membaca umpan; cabut dari dialog yang sama jika bocor.',

  // widgets
  'help.guide.widgets.title': 'Memilih widget dasbor',
  'help.guide.widgets.goal': 'Menampilkan atau menyembunyikan baris statistik dan widget di kanan.',
  'help.guide.widgets.step.1': 'Buka menu avatar di pojok kanan atas dan pilih “Pengaturan”.',
  'help.guide.widgets.step.2': 'Beralih ke tab “Appearance”.',
  'help.guide.widgets.step.3':
    'Di bawah “Dashboard widgets”, nyalakan atau matikan setiap widget. Desktop dan ponsel diatur terpisah.',
  'help.guide.widgets.step.4': 'Kembali ke dasbor. Perubahan langsung berlaku.',
  'help.guide.widgets.result':
    'Widget yang disembunyikan memberi ruang untuk perjalanan Anda; matikan seluruh kolom kanan untuk memusatkan tata letak.',
  'help.guide.widgets.link': 'Buka pengaturan tampilan',

  // currency-widget
  'help.guide.currency-widget.title': 'Mengonversi mata uang',
  'help.guide.currency-widget.goal': 'Mengonversi jumlah antara dua mata uang dengan kurs terkini.',
  'help.guide.currency-widget.step.1': 'Ketik jumlahnya dan pilih dua mata uang.',
  'help.guide.currency-widget.step.2': 'Panah di antaranya menukar pasangan; panah melingkar menyegarkan kurs.',
  'help.guide.currency-widget.result': 'Pasangan mata uang Anda diingat di akun, jadi sama di setiap perangkat.',
  'help.guide.currency-widget.tip.1': 'Kurs berasal dari Bank Sentral Eropa dan diperbarui sekali sehari.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Menambahkan jam dunia',
  'help.guide.timezones-widget.goal': 'Memantau waktu setempat di tujuan Anda.',
  'help.guide.timezones-widget.step.1': 'Klik + di widget “Zona waktu” dan cari sebuah kota.',
  'help.guide.timezones-widget.step.2': 'Hapus jam dengan tanda × di sebelahnya.',
  'help.guide.timezones-widget.result': 'Jam Anda disimpan bersama akun Anda.',
  'help.guide.search-trips.title': 'Mencari perjalanan Anda',
  'help.guide.search-trips.goal':
    'Temukan perjalanan menurut namanya, tanggal, atau tempat yang Anda rencanakan di dalamnya, termasuk perjalanan yang diarsipkan.',
  'help.guide.search-trips.step.1':
    'Ketik di “Cari perjalanan atau tempat” di atas kartu. Daftar menyempit saat Anda mengetik, mencakup perjalanan yang direncanakan, diarsipkan, dan selesai sekaligus.',
  'help.guide.search-trips.step.2':
    'Perjalanan yang ditemukan lewat salah satu tempatnya menyebut tempat itu di bawah judulnya. Klik x di kotak, atau tekan Escape, untuk melihat semua perjalanan Anda lagi.',
  'help.guide.search-trips.result':
    'Hanya perjalanan yang cocok yang tetap di dasbor, dan kotak kosong menampilkan kembali semua perjalanan.',
  'help.guide.search-trips.tip.1':
    'Tanggal juga bisa: ketik bulan dan tahun, misalnya Mei 2027, atau 2027-05, untuk menemukan perjalanan yang jatuh di bulan itu.',
  'help.guide.search-trips.tip.2':
    'Selama pencarian aktif, pengalih “Direncanakan”, “Diarsipkan”, dan “Selesai” menyingkir, agar tidak ada perjalanan yang tersembunyi di balik filter yang salah.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay adalah perencana cuti pribadi Anda: berapa hari cuti yang Anda punya dalam setahun, mana yang sudah dicatat, dan berapa yang tersisa. Kisi menampilkan seluruh tahun sekilas; bilah samping memuat pemilih tahun, orang yang berencana bersama Anda, kalender yang dibagikan kepada Anda, legenda, dan jatah Anda.',
  'help.ctx.vacay.bullet.1':
    'Kisi tahunan: dua belas kartu bulan, satu sel per hari. Klik sebuah hari untuk mencatat atau menghapusnya. Titik biru kecil menandai hari yang sudah tercakup perjalanan.',
  'help.ctx.vacay.bullet.2':
    'Bilah alat di bawah: mode “Cuti” atau “Hari Libur Perusahaan”, plus sakelar “Setengah hari” dan “Pengganti / Fleksi” yang mengubah apa yang dicatat sebuah klik.',
  'help.ctx.vacay.bullet.3':
    '“Jatah Cuti”: hari Anda untuk tahun ini, berapa yang terpakai dan berapa yang tersisa, dengan sisa yang dibawa dari periode sebelumnya.',
  'help.ctx.vacay.bullet.4':
    '“Orang” adalah mereka yang digabung ke rencana Anda, masing-masing dengan warnanya. “Kalender yang Dibagikan” adalah cincin hanya-baca dari hari libur orang lain.',
  'help.ctx.vacay.bullet.5':
    '“Pengaturan” mencakup akhir pekan, awal minggu, sisa cuti, tahun cuti Anda, libur perusahaan, serta kalender hari libur nasional atau libur sekolah.',
  // log-day
  'help.guide.log-day.title': 'Mencatat hari cuti',
  'help.guide.log-day.goal': 'Tandai hari libur di kisi tahunan dan lihat saldo mengikuti.',
  'help.guide.log-day.step.1':
    'Lihat bilah alat di bawah: tombol kiri, dengan warna Anda, berarti satu klik mencatat hari cuti untuk Anda.',
  'help.guide.log-day.step.2':
    'Klik sebuah hari di kartu bulan mana pun. Ia terisi warna Anda dan “Terpakai” bertambah satu hari.',
  'help.guide.log-day.step.3': 'Klik hari yang sama lagi untuk menghapusnya.',
  'help.guide.log-day.result':
    'Hari tercatat, “Hari”, “Terpakai”, dan “Sisa” langsung diperbarui, dan siapa pun yang digabung ke rencana Anda melihatnya secara langsung.',
  'help.guide.log-day.tip.1': 'Akhir pekan tidak bisa dicatat selama “Blokir Akhir Pekan” aktif di “Pengaturan”.',
  'help.guide.log-day.tip.2':
    'Titik biru di sel berarti salah satu perjalanan Anda mencakup hari itu, jadi Anda melihat di mana cuti dan perjalanan bertemu.',
  // half-day
  'help.guide.half-day.title': 'Mencatat setengah hari',
  'help.guide.half-day.goal': 'Ambil libur sore tanpa menghabiskan satu hari penuh jatah.',
  'help.guide.half-day.step.1':
    'Nyalakan “Setengah hari” di bilah alat. Titik oranyenya adalah penanda yang diterima setengah hari di kisi.',
  'help.guide.half-day.step.2': 'Klik sebuah hari. Ia dicatat sebagai 0,5 dan membawa titik oranye di sudutnya.',
  'help.guide.half-day.step.3':
    'Matikan lagi “Setengah hari” setelah selesai; mengklik setengah hari dengan pengaturan lain mengubahnya di tempat.',
  'help.guide.half-day.result':
    '“Terpakai” bertambah 0,5. “Setengah hari” dan “Pengganti / Fleksi” independen, jadi setengah hari kompensasi juga bisa.',
  'help.guide.half-day.tip.1':
    'Bilah alat selalu menampilkan penanda yang akan dipasang klik berikutnya, jadi Anda bisa memeriksa sebelum mencatat.',
  // comp-day
  'help.guide.comp-day.title': 'Mencatat kompensasi atau waktu fleksibel',
  'help.guide.comp-day.goal': 'Ambil libur pengganti yang tidak mengurangi hari cuti.',
  'help.guide.comp-day.step.1':
    'Nyalakan “Pengganti / Fleksi” di bilah alat. Cakram berarsir adalah tampilan hari kompensasi di kisi.',
  'help.guide.comp-day.step.2': 'Klik sebuah hari. Ia terisi arsiran diagonal dengan warna Anda, bukan blok padat.',
  'help.guide.comp-day.result': 'Hari kompensasi dihitung di samping ubin jatah dan tidak pernah mengurangi “Sisa”.',
  'help.guide.comp-day.tip.1':
    'Lembur yang diganti, jam fleksibel, hari libur pengganti: semua yang libur tapi bukan cuti masuk di sini.',
  // entitlement
  'help.guide.entitlement.title': 'Mengatur jatah cuti',
  'help.guide.entitlement.goal': 'Beri tahu Vacay berapa hari cuti yang Anda miliki dalam setahun.',
  'help.guide.entitlement.step.1': 'Di bilah samping, klik ubin “Hari” di bawah “Jatah Cuti”.',
  'help.guide.entitlement.step.2': 'Ketik jumlah hari Anda dan tekan Enter.',
  'help.guide.entitlement.result': '“Sisa” dihitung ulang dari jatah Anda, sisa yang dibawa, dan hari yang terpakai.',
  'help.guide.entitlement.tip.1':
    'Setiap tahun punya jatah sendiri, jadi perubahan di sini hanya memengaruhi tahun yang dipilih.',
  // years
  'help.guide.years.title': 'Menambah dan berpindah tahun',
  'help.guide.years.goal': 'Rencanakan tahun depan dari sekarang, atau lihat kembali tahun lalu.',
  'help.guide.years.step.1':
    'Klik + di kanan tahun untuk menambah tahun berikutnya, atau + di kiri untuk tahun sebelumnya.',
  'help.guide.years.step.2': 'Berpindah tahun dengan panah atau chip tahun di bawahnya.',
  'help.guide.years.step.3':
    'Untuk menghapus tahun, arahkan kursor ke chip-nya dan klik minus kecil. Entrinya ikut hilang, jadi konfirmasi dengan hati-hati.',
  'help.guide.years.result': 'Setiap tahun menyimpan jatah dan entrinya sendiri; sisa cuti menghubungkannya.',
  // company-holidays
  'help.guide.company-holidays.title': 'Menandai libur perusahaan',
  'help.guide.company-holidays.goal': 'Blokir hari saat seluruh perusahaan libur tanpa menghabiskan jatah siapa pun.',
  'help.guide.company-holidays.step.1':
    'Buka “Pengaturan” dan pastikan “Hari Libur Perusahaan” aktif. Ini aktif secara bawaan; bilah alat hanya menawarkan modenya selama aktif.',
  'help.guide.company-holidays.step.2': 'Kembali di kisi, alihkan bilah alat ke mode “Hari Libur Perusahaan”.',
  'help.guide.company-holidays.step.3': 'Klik hari-harinya. Warnanya jadi kuning ambar dan muncul di legenda.',
  'help.guide.company-holidays.result':
    'Libur perusahaan terlihat oleh semua yang digabung ke rencana dan tidak pernah mengurangi “Sisa”.',
  'help.guide.company-holidays.tip.1':
    'Siapa pun yang digabung bisa mengedit libur perusahaan, jadi sepakati siapa yang mengelolanya.',
  // public-holidays
  'help.guide.public-holidays.title': 'Menampilkan hari libur nasional',
  'help.guide.public-holidays.goal': 'Tampilkan hari libur nasional negara atau wilayah Anda di kisi.',
  'help.guide.public-holidays.step.1': 'Buka “Pengaturan” dan nyalakan “Hari Libur Nasional”.',
  'help.guide.public-holidays.step.2':
    'Klik “Tambah kalender”, lalu pilih negara dan, jika perlu, wilayah. Beri warna dan label jika mau.',
  'help.guide.public-holidays.step.3': 'Tutup “Pengaturan”. Hari libur muncul di kisi dan di legenda.',
  'help.guide.public-holidays.result':
    'Hari libur nasional ditandai dengan warna kalender dan tidak pernah dihitung terhadap jatah Anda.',
  'help.guide.public-holidays.tip.1':
    'Anda bisa menambahkan beberapa kalender, misalnya wilayah Anda dan wilayah rekan yang digabung.',
  // school-holidays
  'help.guide.school-holidays.title': 'Menampilkan libur sekolah',
  'help.guide.school-holidays.goal': 'Lihat libur sekolah wilayah Anda berdampingan dengan hari libur Anda sendiri.',
  'help.guide.school-holidays.step.1': 'Buka “Pengaturan” dan nyalakan “School Holidays”.',
  'help.guide.school-holidays.step.2':
    'Klik “Tambah kalender” dan pilih negara. Jika negara membagi kalendernya, pilih juga wilayah atau kelompoknya.',
  'help.guide.school-holidays.step.3':
    'Tutup “Pengaturan”. Setiap libur mendapat pita berwarna di bagian bawah hari-harinya.',
  'help.guide.school-holidays.result': 'Libur sekolah murni visual: tidak pernah mengurangi jatah siapa pun.',
  'help.guide.school-holidays.tip.1':
    'Wilayah tidak ada? Administrator dapat mengelola libur sekolah secara manual di “Admin”, “Personalisasi”, “Liburan sekolah”.',
  // weekends
  'help.guide.weekends.title': 'Memblokir akhir pekan dan mengatur awal minggu',
  'help.guide.weekends.goal': 'Jauhkan akhir pekan dari hitungan dan mulai minggu di hari yang biasa Anda pakai.',
  'help.guide.weekends.step.1': 'Buka “Pengaturan”.',
  'help.guide.weekends.step.2':
    'Nyalakan “Blokir Akhir Pekan” dan pilih hari mana yang dihitung sebagai akhir pekan Anda.',
  'help.guide.weekends.step.3': 'Di “Awal minggu”, pilih Senin atau Minggu.',
  'help.guide.weekends.result':
    'Hari yang diblokir tampak abu-abu di kisi dan tidak bisa dicatat secara tidak sengaja.',
  // leave-year
  'help.guide.leave-year.title': 'Mengatur tahun cuti',
  'help.guide.leave-year.goal':
    'Hitung jatah Anda berdasarkan tahun fiskal atau sejak tanggal mulai kerja, bukan Januari sampai Desember.',
  'help.guide.leave-year.step.1': 'Buka “Pengaturan” dan cari “Tahun cuti”.',
  'help.guide.leave-year.step.2':
    'Pilih “Kalender”, “Fiskal” (dengan bulan dan hari mulainya), atau “Tanggal masuk” (dengan tanggal Anda dipekerjakan).',
  'help.guide.leave-year.result':
    'Jatah, hari terpakai, dan sisa cuti mengikuti periode itu, dan kisi dimulai dari bulan pertamanya.',
  'help.guide.leave-year.tip.1':
    'Pengaturan ini bersifat pribadi: dalam rencana gabungan, setiap orang menyimpan tahun cuti dan angkanya sendiri.',
  // carry-over
  'help.guide.carry-over.title': 'Membawa sisa hari yang tak terpakai',
  'help.guide.carry-over.goal': 'Tambahkan sisa di akhir periode ke periode berikutnya.',
  'help.guide.carry-over.step.1': 'Buka “Pengaturan”.',
  'help.guide.carry-over.step.2': 'Nyalakan “Carry Over Cuti”.',
  'help.guide.carry-over.result':
    'Jumlah yang dibawa dihitung ulang di semua tahun Anda dan ditampilkan di bawah jatah.',
  'help.guide.carry-over.tip.1': 'Mematikannya mengembalikan setiap saldo bawaan ke nol.',
  // invite
  'help.guide.invite.title': 'Berencana bersama seseorang',
  'help.guide.invite.goal':
    'Gabungkan rencana Anda dengan pengguna TREK lain agar Anda saling melihat hari libur dalam satu kisi.',
  'help.guide.invite.step.1': 'Klik ikon orang di panel “Orang”.',
  'help.guide.invite.step.2': 'Pilih pengguna dan kirim undangan.',
  'help.guide.invite.step.3':
    'Ia menerima notifikasi dan menyetujui. Sampai saat itu undangan tampil sebagai tertunda.',
  'help.guide.invite.result':
    'Kedua rencana menyatu: setiap orang punya warna, Anda bisa saling mencatat hari, dan semuanya tersinkron langsung.',
  'help.guide.invite.tip.1':
    'Untuk membatalkan penggabungan, gunakan “Pisahkan” di “Pengaturan”. Entri setiap orang kembali ke rencananya sendiri.',
  'help.guide.invite.tip.2':
    'Jika orang lain hanya perlu melihat hari Anda, bagikan kalender Anda alih-alih menggabung.',
  // share-calendar
  'help.guide.share-calendar.title': 'Membagikan kalender hanya-baca',
  'help.guide.share-calendar.goal':
    'Biarkan seseorang melihat kapan Anda libur tanpa memberinya kendali atas rencana Anda.',
  'help.guide.share-calendar.step.1': 'Klik ikon bagikan di panel “Kalender yang Dibagikan”.',
  'help.guide.share-calendar.step.2': 'Pilih pengguna dan klik “Bagikan”. Tidak perlu persetujuan.',
  'help.guide.share-calendar.step.3':
    'Kalender yang dibagikan kepada Anda muncul di panel yang sama; ikon mata menyembunyikan satu, “Berhenti berbagi” mencabut milik Anda.',
  'help.guide.share-calendar.result':
    'Hari libur Anda muncul sebagai cincin berwarna di kisinya. Tidak ada yang Anda bagikan bisa diedit dari sana.',
  'help.guide.share-calendar.tip.1':
    'Berbagi dan menggabung independen: Anda bisa digabung dengan satu orang dan berbagi dengan yang lain.',
  'help.guide.share-calendar.tip.2': 'Arahkan kursor ke hari bercincin untuk melihat siapa yang libur dan berapa lama.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas adalah jejak perjalanan Anda di peta dunia: setiap negara yang pernah Anda datangi lewat sebuah perjalanan diwarnai, dan negara yang Anda kunjungi sebelum TREK bisa ditambahkan secara manual. Perbesar peta untuk melihat wilayah, simpan daftar impian berisi tempat yang masih ingin Anda lihat, dan baca angka-angka Anda di panel kaca di bagian bawah.',
  'help.ctx.atlas.bullet.1':
    'Peta: negara yang dikunjungi memakai warna yang tetap menjadi miliknya, negara yang direncanakan bergaris tepi putus-putus, negara di daftar impian berarsir diagonal, sisanya abu-abu. Arahkan kursor ke sebuah negara untuk melihat perjalanan, tempat, serta kunjungan pertama dan terakhirnya.',
  'help.ctx.atlas.bullet.2':
    'Pencarian di atas: ketik nama negara atau tempat. Memilih negara membawa peta terbang ke sana dan membuka popup-nya; memilih tempat mendarat di wilayahnya sehingga Anda bisa menandainya.',
  'help.ctx.atlas.bullet.3':
    '“Tampilkan negara yang direncanakan”, di kanan atas: menampilkan negara dari perjalanan Anda yang akan datang. Sakelar ini hanya muncul selama Anda memilikinya.',
  'help.ctx.atlas.bullet.4':
    'Panel di bawah: tab Statistik dengan negara, perjalanan, tempat, kota, hari, benua, dan rentetan Anda; tab Daftar Impian dengan apa yang masih menanti.',
  'help.ctx.atlas.bullet.5':
    'Wilayah: mulai tingkat zoom 5, peta beralih ke negara bagian dan provinsi, masing-masing bisa diklik untuk ditandai atau dihapus tandanya.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: dengan addon terhubung, sebuah panel di kiri statistik mencentang impian dan menambahkan negara dari rekaman Anda, tidak pernah tanpa konfirmasi Anda.',
  // mark-country
  'help.guide.mark-country.title': 'Menandai negara sebagai sudah dikunjungi',
  'help.guide.mark-country.goal':
    'Tambahkan negara yang pernah Anda kunjungi sebelum TREK, agar peta dan hitungan Anda menyertakannya.',
  'help.guide.mark-country.step.1': 'Ketik nama negara di kotak pencarian di bagian atas peta.',
  'help.guide.mark-country.step.2':
    'Pilih dari daftar. Peta terbang ke sana dan sebuah popup terbuka untuk negara itu.',
  'help.guide.mark-country.step.3': 'Pilih “Tandai sudah dikunjungi”.',
  'help.guide.mark-country.result':
    'Negara itu mendapat warnanya di peta dan Negara bertambah satu. Warna itu permanen: menandai negara lain tidak pernah mengacak warna yang sudah ada.',
  'help.guide.mark-country.tip.1':
    'Mengklik negara abu-abu di peta membuka popup yang sama; pencarian adalah jalan yang pasti untuk negara kecil.',
  'help.guide.mark-country.tip.2':
    'Negara yang Anda tandai secara manual selalu dihitung sebagai sudah dikunjungi, apa pun tanggal perjalanan ke sana.',
  // unmark-country
  'help.guide.unmark-country.title': 'Menghapus negara yang Anda tandai',
  'help.guide.unmark-country.goal': 'Mengeluarkan kembali negara yang ditandai manual dari peta.',
  'help.guide.unmark-country.step.1':
    'Cari negara itu dan pilih, atau klik di peta. Untuk negara yang Anda tandai sendiri, popup bertanya apakah negara itu mau dihapus.',
  'help.guide.unmark-country.step.2': 'Konfirmasi dengan “Hapus”.',
  'help.guide.unmark-country.result': 'Negara kembali abu-abu dan keluar dari hitungan Anda.',
  'help.guide.unmark-country.tip.1':
    'Hanya negara yang ditandai manual yang bisa dihapus dengan cara ini. Negara dengan perjalanan atau tempat tetap ada selama perjalanan atau tempat itu ada; “Hapus” juga tersedia di kartu detailnya di panel jika negara itu ditandai manual.',
  // country-details
  'help.guide.country-details.title': 'Melihat apa yang Anda lakukan di sebuah negara',
  'help.guide.country-details.goal':
    'Buka negara yang sudah dikunjungi dan lompat ke perjalanan yang membawa Anda ke sana.',
  'help.guide.country-details.step.1': 'Cari negara yang pernah Anda kunjungi.',
  'help.guide.country-details.step.2':
    'Pilih. Peta terbang ke sana dan panel di bawah memunculkan kartu dengan bendera, tempat, perjalanan, dan satu chip per perjalanan.',
  'help.guide.country-details.result': 'Klik chip perjalanan untuk membuka perjalanan itu di perencana.',
  'help.guide.country-details.tip.1':
    'Mengarahkan kursor ke negara di peta menampilkan angka yang sama ditambah kunjungan pertama dan terakhir.',
  // planned-countries
  'help.guide.planned-countries.title': 'Menampilkan negara yang akan Anda kunjungi',
  'help.guide.planned-countries.goal':
    'Bawa negara dari perjalanan Anda yang akan datang ke peta tanpa menghitungnya sebagai sudah dikunjungi.',
  'help.guide.planned-countries.step.1':
    'Nyalakan “Tampilkan negara yang direncanakan” di kanan atas. Angka di sebelahnya adalah jumlah negara yang menanti.',
  'help.guide.planned-countries.step.2':
    'Cari negara yang direncanakan dan pilih: panel menampilkan Direncanakan dan tooltip peta menunjukkan kapan Anda berangkat.',
  'help.guide.planned-countries.result':
    'Negara yang direncanakan tampil dengan garis tepi putus-putus, jadi tidak pernah terlihat seperti tempat yang sudah Anda datangi. Sakelar mengingat pilihan Anda.',
  'help.guide.planned-countries.tip.1':
    'Sebuah negara dihitung sebagai sudah dikunjungi begitu perjalanan ke sana dimulai; perjalanan yang sedang berlangsung juga dihitung. Perjalanan tanpa tanggal sama sekali tidak masuk statistik.',
  'help.guide.planned-countries.tip.2': 'Sakelar ini hanya ada selama Anda punya perjalanan yang akan datang.',
  // regions
  'help.guide.regions.title': 'Menandai wilayah',
  'help.guide.regions.goal':
    'Lebih rinci daripada negara: tandai negara bagian, provinsi, atau prefektur yang pernah Anda kunjungi.',
  'help.guide.regions.step.1':
    'Perbesar sebuah negara sampai wilayahnya muncul, mulai tingkat zoom 5. Mencari negara itu dan memilihnya membawa Anda cukup dekat.',
  'help.guide.regions.step.2':
    'Klik sebuah wilayah. Mengarahkan kursor menampilkan namanya; popup menunjukkan wilayah dan negaranya.',
  'help.guide.regions.step.3': 'Pilih “Tandai sudah dikunjungi”.',
  'help.guide.regions.result':
    'Wilayah terisi warna negaranya. Menandai wilayah juga menghitung negaranya sebagai sudah dikunjungi jika belum.',
  'help.guide.regions.tip.1':
    'Mengklik wilayah yang sudah dikunjungi menawarkan “Hapus”, baik Anda yang menandainya maupun sebuah tempat yang menempatkannya di sana.',
  'help.guide.regions.tip.2':
    'Wilayah yang berisi tempat sungguhan ditandai otomatis untuk Anda; tidak ada yang perlu dilakukan di sana.',
  // search-place
  'help.guide.search-place.title': 'Menemukan tempat dan menandai wilayahnya',
  'help.guide.search-place.goal':
    'Tandai Lombardia dengan mencari Milan, tanpa perlu tahu sebuah kota ada di wilayah mana.',
  'help.guide.search-place.step.1':
    'Ketik kota, landmark, atau alamat di kotak pencarian. Negara muncul lebih dulu; tempat yang cocok tampil di bawahnya di bagian Tempat.',
  'help.guide.search-place.step.2':
    'Pilih tempat itu. Peta terbang ke sana dan menentukan titik itu ada di wilayah mana.',
  'help.guide.search-place.step.3':
    'Pilih “Tandai sudah dikunjungi” untuk wilayah itu, atau “Tambah ke bucket list” jika masih menanti Anda.',
  'help.guide.search-place.result':
    'Wilayah ditandai, dan negaranya ikut. Negara tanpa data wilayah di paket peta kembali ke negara itu sendiri.',
  'help.guide.search-place.tip.1':
    'Tempat berasal dari pencarian yang sama seperti di seluruh TREK, jadi mengikuti penyedia yang disiapkan admin Anda.',
  // bucket-country
  'help.guide.bucket-country.title': 'Memasukkan negara ke daftar impian',
  'help.guide.bucket-country.goal':
    'Simpan daftar impian berisi negara langsung di peta, terpisah dari negara yang sudah Anda kunjungi.',
  'help.guide.bucket-country.step.1': 'Cari negara itu dan pilih, atau klik di peta.',
  'help.guide.bucket-country.step.2': 'Pilih “Tambah ke bucket list”.',
  'help.guide.bucket-country.step.3':
    'Pilih bulan dan tahun jika Anda sudah tahu kapan, lalu konfirmasi dengan “Tambah ke bucket list”.',
  'help.guide.bucket-country.result':
    'Negara digambar dengan arsiran diagonal dalam warna yang akan dipakainya begitu Anda tiba di sana, dan muncul di tab Daftar Impian di panel.',
  'help.guide.bucket-country.tip.1':
    'Popup yang sama menawarkan “Hapus dari bucket list” begitu negara itu ada di daftar.',
  'help.guide.bucket-country.tip.2':
    'Satu entri per tanggal target: negara yang sama bisa ada di daftar untuk dua bulan berbeda, tetapi tidak dua kali untuk bulan yang sama.',
  // bucket-place
  'help.guide.bucket-place.title': 'Menambahkan tempat ke daftar impian',
  'help.guide.bucket-place.goal':
    'Simpan kota, objek wisata, atau alamat yang Anda impikan, lengkap dengan koordinat dan tanggal target.',
  'help.guide.bucket-place.step.1': 'Buka tab Daftar Impian di panel bawah.',
  'help.guide.bucket-place.step.2': 'Klik “Tambah tempat”.',
  'help.guide.bucket-place.step.3':
    'Ketik namanya dan tekan tombol cari; pilih hasil yang cocok agar tempat itu punya koordinat. Mengetik nama saja dan melewati pencarian juga bisa.',
  'help.guide.bucket-place.step.4': 'Pilih bulan dan tahun jika mau, lalu klik “Tambah”.',
  'help.guide.bucket-place.result':
    'Tempat itu berada di urutan teratas daftar impian Anda dengan tanggal targetnya; tanda × di sebelahnya menghapusnya lagi.',
  'help.guide.bucket-place.tip.1':
    'Impian yang punya koordinat adalah yang nanti bisa dicentang Dawarich untuk Anda, begitu rekaman Anda menunjukkan Anda pernah di sana.',
  // stats
  'help.guide.stats.title': 'Membaca statistik Anda',
  'help.guide.stats.goal': 'Ketahui apa yang dihitung angka-angka di panel, dan apa yang tidak.',
  'help.guide.stats.step.1':
    'Negara adalah jumlah negara berbeda yang benar-benar pernah Anda kunjungi; yang direncanakan ditampilkan di sebelahnya, bukan di dalamnya. Perjalanan, Tempat, dan Hari adalah total dari semua perjalanan Anda. Kota dihitung dari alamat tempat-tempat Anda, jadi berupa perkiraan.',
  'help.guide.stats.step.2':
    'Benua menampilkan negara yang dikunjungi per benua; Antarktika bergabung ke barisan begitu Anda pernah ke sana. Lalu rentetan Anda, tahun berturut-turut dengan setidaknya satu perjalanan, dan berapa perjalanan yang Anda lakukan tahun ini.',
  'help.guide.stats.result':
    'Angka-angka mengikuti perjalanan Anda seiring Anda merencanakannya; tidak ada yang perlu dirawat di sini.',
  'help.guide.stats.tip.1':
    'Kota dibaca dari teks alamat, bukan dicari, jadi alamat pendek seperti “Osteria Francescana, Italy” atau yang berakhir dengan prefektur bisa menghasilkan wilayah, bukan kota.',
  'help.guide.stats.tip.2':
    'Negara yang Anda tandai manual dihitung di Negara dan benua, tetapi tidak membawa perjalanan, tempat, atau hari.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Menambahkan negara dari rekaman Anda',
  'help.guide.dawarich-countries.goal':
    'Biarkan Dawarich mengatakan negara mana saja yang Anda kunjungi selama setahun terakhir, dan taruh yang Anda konfirmasi di peta.',
  'help.guide.dawarich-countries.step.1':
    'Dengan addon Dawarich terhubung, sebuah panel Dawarich duduk di bagian bawah peta, di kiri statistik, dengan dua ubin. Klik “Negara”.',
  'help.guide.dawarich-countries.step.2':
    'Dialog terbuka pada tab “Negara”-nya. Klik “Cari negara”: TREK membaca negara dan kota yang dicakup rekaman Anda dalam 12 bulan terakhir, sebulan demi sebulan, jadi beri waktu sejenak. Setiap negara yang belum dimiliki Atlas Anda didaftar dengan benderanya, berapa banyak kota, dan kota pertamanya dengan nama, dan mulai dalam keadaan tercentang; klik sebuah baris untuk mengecualikannya.',
  'help.guide.dawarich-countries.step.3':
    'Konfirmasi dengan tombol di kanan bawah, yang berbunyi “Tambah 5 negara” ketika lima baris tercentang. Dialog mengatakan berapa banyak yang ditambahkan; tutup dialog itu dan peta sudah membaca ulang dirinya.',
  'help.guide.dawarich-countries.result':
    'Negara yang dikonfirmasi membawa warna di peta dan terhitung dalam “Negara”, tercatat sebagai berasal dari Dawarich. Apa yang Anda tandai dengan tangan tidak tersentuh.',
  'help.guide.dawarich-countries.tip.1':
    'Negara yang sudah ditampilkan Atlas sebagai dikunjungi, dengan tangan, dari sebuah perjalanan atau dari pemeriksaan sebelumnya, dikecualikan, sehingga tanda Anda sendiri tidak pernah dilabeli ulang. Negara yang Anda hapus dari Atlas sebelumnya kembali ketika Anda mengonfirmasinya di sini.',
  'help.guide.dawarich-countries.tip.2':
    'Nama negara yang tidak dapat TREK cocokkan didaftar di bawah baris-baris itu alih-alih dibuang, dan “Periksa lagi” bertanya kepada Dawarich sekali lagi. Catatan di bawah daftar mengatakan bahwa yang diperiksa adalah 12 bulan terakhir; jendela waktu itu tetap.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Mencoret keinginan dari rekaman Anda',
  'help.guide.dawarich-wishes.goal':
    'Cari tahu tempat mana di daftar impian Anda yang benar-benar sudah Anda capai, dan coret pada hari kejadiannya.',
  'help.guide.dawarich-wishes.step.1':
    'Di panel Dawarich di bagian bawah peta, di kiri statistik, klik “Daftar keinginan”.',
  'help.guide.dawarich-wishes.step.2':
    'Dialog terbuka pada tab “Daftar keinginan”-nya. Klik “Periksa daftar keinginan”: TREK menelusuri rekaman Anda untuk setiap entri yang punya koordinat. Keinginan yang Anda capai didaftar dengan seberapa dekat Anda sampai, berapa lama Anda tinggal dan harinya, dan mulai dalam keadaan tercentang; yang sudah Anda coret berbunyi “Sudah dicoret”. Di bawah daftar sebuah catatan menghitung entri tanpa koordinat, dan aturannya juga berdiri di sana: “Sebuah keinginan dianggap tercapai dalam radius 250 m dan setelah 20 menit di lokasi.”',
  'help.guide.dawarich-wishes.step.3':
    'Konfirmasi dengan tombol di kanan bawah, yang berbunyi “Coret 2” ketika dua baris tercentang. Lalu tutup dialog dan buka tab “Daftar Impian” pada panel di sebelahnya.',
  'help.guide.dawarich-wishes.result':
    'Setiap keinginan membawa centang hijau dengan tanggal kunjungan, bukan tanggal hari ini; tooltip-nya berbunyi “Dicoret dari rekaman Dawarich milikmu”, dan klik pada tanggal itu membatalkannya.',
  'help.guide.dawarich-wishes.tip.1':
    'Sekadar lewat tidak dihitung: aturannya menuntut kedekatan sekaligus waktu, dan dari beberapa kunjungan yang memenuhi syarat, yang terlama yang menang. Keinginan tanpa koordinat tidak dapat diperiksa, jadi tambahkan tempat lewat pencarian di “Tambah tempat” alih-alih hanya dengan nama.',
  'help.guide.dawarich-wishes.tip.2':
    'Satu pemeriksaan melihat sampai 50 entri, yang belum dicoret lebih dulu, dan mengatakannya bila ada lebih banyak. Keinginan yang sudah dicoret sebelumnya mempertahankan tanggalnya sendiri.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Koleksi',
  'help.ctx.collections.summary':
    'Collections adalah pustaka tempat Anda di luar perjalanan mana pun: daftar bernama berisi tempat yang Anda temukan dan ingin simpan, tiap tempat dengan status “Ide”, “Ingin ke sana”, atau “Dikunjungi”. Tempat disalin ke dalam dan ke luar perjalanan, tidak pernah ditautkan, sehingga daftar dan perjalanan tidak pernah saling mengubah.',
  'help.ctx.collections.bullet.1':
    'Bilah daftar di kiri: daftar Anda sendiri, daftar yang dibagikan kepada Anda, undangan yang menunggu persetujuan, “Semua tersimpan” sebagai gabungan semua yang Anda miliki, serta “Daftar baru” dan impor berkas di bagian atas.',
  'help.ctx.collections.bullet.2':
    'Header daftar yang terbuka: warna, sampul, deskripsi, dan tautannya, para anggota, serta aksi “Sunting”, “Ekspor”, dan “Bagikan” di kanan.',
  'help.ctx.collections.bullet.3':
    'Baris filter di atas tempat: status, kategori, penilaian, dan urutan, filter label, tombol + untuk menambah tempat, impor perjalanan, dan “Pilih” untuk aksi massal.',
  'help.ctx.collections.bullet.4':
    'Baris tempat: avatar, nama dan alamat, label dan kategori, serta pil status di kanan yang berganti dengan satu klik.',
  'help.ctx.collections.bullet.5':
    'Peta di kanan: satu pin per tempat yang punya koordinat, sakelar daftar atau peta, kotak pencarian, dan filter label. Mengklik pin membuka tempat itu.',
  'help.ctx.collections.bullet.6':
    'Lembar detail: klik sebuah baris untuk melihat sampul, kategori, label, status, deskripsi, dan tautan, dengan “Sunting”, “Salin ke perjalanan”, dan “Hapus dari daftar”.',
  // create-list
  'help.guide.create-list.title': 'Membuat daftar',
  'help.guide.create-list.goal': 'Mulai daftar bernama yang baru, dengan warna dan sampul, siap diisi tempat.',
  'help.guide.create-list.step.1': 'Klik “Daftar baru” di bagian atas bilah daftar.',
  'help.guide.create-list.step.2':
    'Beri nama daftar dan pilih warna. Gambar sampul, deskripsi, dan tautan bersifat opsional; Anda bisa menambahkannya nanti lewat “Sunting”.',
  'help.guide.create-list.step.3': 'Klik “Buat”.',
  'help.guide.create-list.result':
    'Daftar terbuka dalam keadaan kosong, dengan “Tambah tempat” dan “Impor dari perjalanan” sebagai dua cara mengisinya.',
  'help.guide.create-list.tip.1':
    'Sampul bisa berupa unggahan Anda sendiri atau gambar yang ditemukan lewat pencarian Unsplash di dialog yang sama.',
  // add-place
  'help.guide.add-place.title': 'Menambah tempat',
  'help.guide.add-place.goal':
    'Temukan sebuah tempat dan simpan ke daftar yang terbuka dengan nama, kategori, status, dan catatan sekaligus.',
  'help.guide.add-place.step.1': 'Klik + di baris filter di atas tempat.',
  'help.guide.add-place.step.2':
    'Ketik tempat di kolom pencarian dan pilih sebuah hasil. Nama, alamat, dan koordinat terisi darinya.',
  'help.guide.add-place.step.3':
    'Atur status dan, jika mau, kategori, deskripsi, dan tautan, lalu klik “Tambah”. Dialog tetap terbuka untuk tempat berikutnya; “Batal” menutupnya.',
  'help.guide.add-place.result': 'Tempat muncul di daftar dan, jika punya koordinat, sebagai pin di peta.',
  'help.guide.add-place.tip.1':
    'Dari dalam perjalanan, “Simpan ke Koleksi” di inspektur tempat atau menu tempat memasukkan tempat perjalanan ke sebuah daftar tanpa meninggalkan perjalanan.',
  'help.guide.add-place.tip.2':
    'Daftar harus milik Anda atau daftar tempat Anda menjadi editor atau admin; tombol + tidak ada di “Semua tersimpan” atau di daftar yang hanya Anda tinjau.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Mengimpor tempat dari perjalanan',
  'help.guide.import-from-trip.goal':
    'Bawa semua tempat dari satu perjalanan ke sebuah daftar sekaligus, alih-alih menyimpannya satu per satu.',
  'help.guide.import-from-trip.step.1':
    'Klik tombol impor dengan panah awan di baris filter. Pada daftar kosong, aksi yang sama ada di sebelah “Tambah tempat”.',
  'help.guide.import-from-trip.step.2': 'Pilih salah satu perjalanan Anda.',
  'help.guide.import-from-trip.step.3':
    'Centang tempat yang Anda inginkan. Tempat yang sudah ada di daftar tampak redup; tempat yang tidak dipegang hari mana pun dalam perjalanan sudah terpilih sejak awal. “Hanya yang baru” menyembunyikan yang sudah Anda miliki.',
  'help.guide.import-from-trip.step.4': 'Klik “Impor”. Tombol selalu menyebutkan berapa banyak yang akan ditambahkan.',
  'help.guide.import-from-trip.result':
    'Tempat disalin ke daftar dengan nama, alamat, koordinat, deskripsi, dan kategorinya. Perjalanan tetap seperti semula.',
  'help.guide.import-from-trip.tip.1':
    'Duplikat berdasarkan nama atau koordinat dilewati secara otomatis, jadi mengimpor dua kali tidak merugikan.',
  'help.guide.import-from-trip.tip.2':
    'Di dalam daftar tempat sebuah perjalanan, mode pilih menawarkan “Simpan ke Koleksi” untuk sekumpulan tempat yang Anda pilih sendiri.',
  // place-status
  'help.guide.place-status.title': 'Mengatur status tempat',
  'help.guide.place-status.goal':
    'Pantau mana yang masih ide, mana yang ada di daftar pendek, dan ke mana Anda sudah pergi.',
  'help.guide.place-status.step.1': 'Klik pil status di ujung kanan baris tempat. “Ide” menjadi “Ingin ke sana”.',
  'help.guide.place-status.step.2': 'Klik lagi untuk “Dikunjungi”, dan sekali lagi untuk kembali ke “Ide”.',
  'help.guide.place-status.result': 'Pil dan warnanya langsung berubah; filter status di atas daftar ikut menghitung.',
  'help.guide.place-status.tip.1':
    'Status adalah urusan Collections: menyalin tempat ke perjalanan tidak membawanya serta.',
  'help.guide.place-status.tip.2':
    'Dari sebuah perjalanan, “Simpan ke Koleksi” menampilkan pil status untuk tiap daftar yang memuat tempat itu, dan panel tempat punya aksi “Tandai dikunjungi” untuk sebuah pilihan.',
  // place-detail
  'help.guide.place-detail.title': 'Membuka tempat tersimpan',
  'help.guide.place-detail.goal':
    'Lihat semua hal tentang sebuah tempat dan lakukan sesuatu: sunting, salin ke perjalanan, hapus.',
  'help.guide.place-detail.step.1':
    'Klik baris tempat. Lembar detail terbuka di samping daftar dan peta bergeser ke tempat itu.',
  'help.guide.place-detail.step.2':
    'Di bagian bawah ada “Sunting”, “Salin ke perjalanan”, dan “Hapus dari daftar”; ikon kamera di sampul menukar foto otomatis dengan foto Anda sendiri.',
  'help.guide.place-detail.result':
    '“Sunting” membuka nama, kategori, label, alamat, koordinat, deskripsi, dan tautan untuk diubah langsung di lembar itu.',
  'help.guide.place-detail.tip.1':
    'Sampul diambil secara otomatis jika tempat tidak punya gambar sendiri. Unggahan Anda bisa berupa JPG, PNG, GIF, atau WebP hingga 20 MB.',
  'help.guide.place-detail.tip.2':
    'Anggota daftar yang dibagikan juga bisa memberi penilaian bintang di sini, dan filter penilaian di baris filter memakai rata-ratanya.',
  // labels
  'help.guide.labels.title': 'Mengelompokkan tempat dengan label',
  'help.guide.labels.goal': 'Beri daftar label miliknya sendiri, misalnya distrik atau hari, di luar kategori bersama.',
  'help.guide.labels.step.1': 'Buka pengelola label dari kontrol label di baris filter.',
  'help.guide.labels.step.2':
    'Ketik nama, pilih warna, dan klik “Tambah label”. Ubah nama, ganti warna, atau hapus label yang ada di dialog yang sama.',
  'help.guide.labels.step.3':
    'Nyalakan “Pilih”, centang tempat, dan klik “Beri label” di bilah pilihan. Satu tempat juga bisa menerima label lewat “Sunting” di lembar detailnya.',
  'help.guide.labels.step.4':
    'Pilih satu atau beberapa label di baris filter untuk mempersempit daftar dan peta ke tempat yang membawa salah satunya.',
  'help.guide.labels.result':
    'Tempat berlabel menampilkan labelnya di baris; filter label tersedia untuk setiap anggota, termasuk peninjau.',
  'help.guide.labels.tip.1':
    'Label hanya milik daftar tempat label itu dibuat. Memindahkan tempat ke daftar lain akan melepaskannya.',
  'help.guide.labels.tip.2': 'Mengelola dan memberi label memerlukan hak sunting pada daftar.',
  // filter-select
  'help.guide.filter-select.title': 'Memfilter dan memilih tempat',
  'help.guide.filter-select.goal': 'Persempit daftar dan lakukan aksi pada banyak tempat sekaligus.',
  'help.guide.filter-select.step.1':
    'Gunakan dropdown di baris filter: status, kategori, penilaian minimum, dan urutan. Masing-masing menunjukkan berapa banyak tempat yang akan tersisa.',
  'help.guide.filter-select.step.2': 'Klik “Pilih”. Setiap baris mendapat kotak centang dan bilah pilihan muncul.',
  'help.guide.filter-select.step.3':
    'Centang tempat atau gunakan “Pilih semua” untuk semua yang sedang terfilter, lalu pilih “Beri label”, “Pindahkan ke daftar”, “Duplikat ke daftar”, “Salin ke perjalanan”, atau “Hapus”.',
  'help.guide.filter-select.result':
    'Aksi berlaku untuk seluruh pilihan sekaligus. Tanda × di kanan keluar dari mode pilih.',
  'help.guide.filter-select.tip.1':
    '“Pilih semua” mengikuti filter, jadi memfilter ke “Ingin ke sana” lalu memilih semua adalah cara cepat untuk menangani daftar pendek.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Menyalin tempat ke perjalanan',
  'help.guide.copy-to-trip.goal': 'Ubah tempat tersimpan menjadi persinggahan di salah satu perjalanan Anda.',
  'help.guide.copy-to-trip.step.1':
    'Nyalakan “Pilih” dan centang tempat, atau buka satu tempat dan gunakan “Salin ke perjalanan” di lembar detailnya.',
  'help.guide.copy-to-trip.step.2': 'Klik “Salin ke perjalanan” di bilah pilihan.',
  'help.guide.copy-to-trip.step.3': 'Pilih perjalanannya. Kotak pencarian mempersempit daftar yang panjang.',
  'help.guide.copy-to-trip.result':
    'Tempat mendarat di daftar tempat perjalanan itu dengan nama, deskripsi, kategori, catatan, harga, koordinat, foto, dan tag. Tidak ada yang berubah di koleksi.',
  'help.guide.copy-to-trip.tip.1':
    'Peninjau daftar yang dibagikan juga bisa melakukannya; ini menyalin keluar dari daftar, bukan mengubahnya.',
  // share-list
  'help.guide.share-list.title': 'Membagikan daftar kepada seseorang',
  'help.guide.share-list.goal': 'Rencanakan sebuah daftar bersama orang lain di TREK ini, secara langsung.',
  'help.guide.share-list.step.1': 'Klik “Bagikan” di header daftar Anda.',
  'help.guide.share-list.step.2': 'Pilih pengguna dan sebuah peran: “Peninjau”, “Editor”, atau “Admin”.',
  'help.guide.share-list.step.3':
    'Klik “Kirim undangan”. Orang itu tampil sebagai “undangan tertunda” sampai ia menerima undangan di bilah daftarnya.',
  'help.guide.share-list.result':
    'Setelah diterima, daftar muncul di bawah “Dibagikan” untuknya dan setiap perubahan tersinkron langsung. Anggota dan perannya tetap bisa diubah di dialog yang sama.',
  'help.guide.share-list.tip.1':
    'Peninjau bisa melihat, menilai, dan menyalin tempat ke perjalanan mereka sendiri. Editor menambah dan menyunting tempat serta label. Admin juga bisa menghapus.',
  'help.guide.share-list.tip.2':
    'Hanya pemilik yang mengundang dan mengeluarkan orang; seorang anggota bisa keluar sendiri dari daftar yang dibagikan.',
  // export-list
  'help.guide.export-list.title': 'Mengekspor daftar sebagai berkas',
  'help.guide.export-list.goal': 'Serahkan daftar kepada seseorang di TREK lain, atau bawa ke aplikasi peta.',
  'help.guide.export-list.step.1': 'Klik “Ekspor” di header daftar.',
  'help.guide.export-list.step.2':
    'Pilih “Daftar TREK” untuk TREK lain, dengan label dan status, atau GPX untuk OsmAnd, Organic Maps, perangkat Garmin, dan aplikasi lain yang membaca waypoint.',
  'help.guide.export-list.result': 'Berkas terunduh. Setiap anggota daftar yang dibagikan boleh mengekspornya.',
  'help.guide.export-list.tip.1':
    'Tempat tanpa koordinat tidak bisa menjadi waypoint GPX; tempat itu dilewati dan TREK memberi tahu berapa banyak yang dilewati.',
  'help.guide.export-list.tip.2':
    'Penilaian, anggota, dan foto unggahan sengaja tidak ikut; semuanya milik TREK ini, bukan milik daftar.',
  // import-file
  'help.guide.import-file.title': 'Mengimpor daftar dari berkas',
  'help.guide.import-file.goal':
    'Masukkan berkas daftar TREK atau berkas GPX, sebagai daftar baru atau ke dalam daftar yang Anda miliki.',
  'help.guide.import-file.step.1': 'Klik tombol impor dengan panah unggah di sebelah “Daftar baru” di bilah daftar.',
  'help.guide.import-file.step.2':
    'Pilih berkasnya. TREK menunjukkan isinya sebelum terjadi apa pun: nama, berapa banyak tempat dan label.',
  'help.guide.import-file.step.3':
    'Pertahankan “Daftar baru” dan ubah namanya jika mau, atau pilih “Tambahkan ke daftar” untuk memasukkan tempat ke daftar yang bisa Anda sunting, lalu klik “Impor”.',
  'help.guide.import-file.result':
    'Anda tiba di daftar dengan tempat yang diimpor. Menambahkan ke daftar hanya pernah menambah; tempat yang sudah ada tetap mempertahankan status, catatan, dan labelnya.',
  'help.guide.import-file.tip.1':
    'Dari GPX, setiap waypoint yang bernama menjadi tempat; track adalah garis dan dilewati, dan pratinjau menyebutkan berapa banyak titiknya.',
  'help.guide.import-file.tip.2':
    'Berkas yang bukan daftar TREK maupun GPX ditolak dengan alasannya; satu tempat yang tidak terbaca dilewati, bukan seluruh berkas.',
  // edit-list
  'help.guide.edit-list.title': 'Menyunting atau menghapus daftar',
  'help.guide.edit-list.goal': 'Ubah nama, warna, sampul, deskripsi, atau tautan daftar, atau hapus daftarnya.',
  'help.guide.edit-list.step.1': 'Klik “Sunting” di header daftar. Hanya pemilik yang melihatnya.',
  'help.guide.edit-list.step.2':
    'Ubah apa yang Anda mau dan klik “Simpan”. “Hapus daftar” di kiri bawah menghapus daftar beserta semua tempatnya, setelah konfirmasi.',
  'help.guide.edit-list.result': 'Header langsung memakai warna, sampul, dan deskripsi yang baru.',
  'help.guide.edit-list.tip.1':
    'Menghapus daftar tidak bisa dibatalkan. Ekspor dulu jika Anda ingin menyimpan salinannya.',
  // all-saved
  'help.guide.all-saved.title': 'Mencari di seluruh pustaka Anda',
  'help.guide.all-saved.goal': 'Lihat semua daftar yang Anda miliki sekaligus.',
  'help.guide.all-saved.step.1':
    'Klik “Semua tersimpan” di bilah daftar. Ini menggabungkan tempat dari setiap daftar yang Anda miliki atau miliki bersama.',
  'help.guide.all-saved.step.2':
    'Gunakan kotak pencarian dan filter seperti di daftar mana pun; “Pilih” juga berfungsi di sini untuk menyalin ke perjalanan.',
  'help.guide.all-saved.result':
    'Satu tampilan atas semua tempat tersimpan Anda, tanpa menambah atau mengimpor, karena tidak ada satu daftar tertentu untuk menampungnya.',
  'help.guide.all-saved.tip.1': 'Label berlaku per daftar, jadi filter label tidak ditawarkan di “Semua tersimpan”.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey',
  'help.ctx.journey.summary':
    'Journey adalah jurnal perjalanan Anda yang mengutamakan foto. Setiap journey terikat pada satu perjalanan atau lebih dan tumbuh hari demi hari dari entri berisi cerita, foto, suasana hati, dan cuaca. Layar ini mencantumkan journey Anda; buka salah satunya untuk menulis.',
  'help.ctx.journey.bullet.1':
    'Banner di bagian atas menampilkan journey yang sedang berjalan, atau yang terbaru, beserta jumlah entri, foto, dan tempatnya. “Lanjutkan menulis” membukanya di hari ini.',
  'help.ctx.journey.bullet.2':
    'Di bawahnya, satu kartu per journey dengan sampul, subjudul, tanggal, dan jumlahnya. Klik sebuah kartu untuk membukanya.',
  'help.ctx.journey.bullet.3': 'Kartu terakhir di grid, “Buat Journey baru”, memulai journey dari perjalanan Anda.',
  // create-journey
  'help.guide.create-journey.title': 'Membuat journey',
  'help.guide.create-journey.goal':
    'Mulai jurnal untuk sebuah perjalanan, dengan tempat-tempat perjalanan itu sudah menunggu sebagai saran.',
  'help.guide.create-journey.step.1': 'Klik “Buat Journey baru”, kartu terakhir di grid.',
  'help.guide.create-journey.step.2':
    'Beri nama dan, jika mau, subjudul, lalu centang perjalanan yang menjadi bagiannya. Penghitung menunjukkan berapa banyak tempat yang akan masuk.',
  'help.guide.create-journey.step.3': 'Klik “Buat Journey”.',
  'help.guide.create-journey.result':
    'Jurnal terbuka. Setiap tempat dari perjalanan yang ditautkan duduk di linimasa sebagai saran, satu untuk setiap hari tempat itu berada, siap untuk ditulis.',
  'help.guide.create-journey.tip.1': 'Perjalanan lain bisa ditautkan belakangan dari “Pengaturan Journey”.',
  'help.guide.create-journey.tip.2': 'Journey tanpa perjalanan juga bisa; Anda lalu menambahkan entri secara manual.',
  // open-journey
  'help.guide.open-journey.title': 'Membuka journey',
  'help.guide.open-journey.goal': 'Masuk ke sebuah jurnal, dan tahu di mana ia terbuka.',
  'help.guide.open-journey.step.1':
    'Klik sebuah kartu. Masing-masing menampilkan sampul, tanggal, dan berapa banyak entri, foto, dan tempat yang dimiliki journey itu.',
  'help.guide.open-journey.result':
    'Journey yang sedang berjalan terbuka di hari ini, atau di entri terakhir sebelum hari ini jika belum ada yang ditulis; journey yang sudah selesai terbuka di awal.',
  'help.guide.open-journey.tip.1':
    'Sampulnya adalah foto pertama journey kecuali Anda menetapkannya di “Pengaturan Journey”.',
  // continue-writing
  'help.guide.continue-writing.title': 'Melanjutkan journey yang sedang berjalan',
  'help.guide.continue-writing.goal': 'Langsung masuk ke halaman hari ini dari journey yang sedang Anda jalani.',
  'help.guide.continue-writing.step.1':
    'Klik “Lanjutkan menulis” di banner bagian atas. Banner itu menampilkan journey yang sedang berjalan, atau yang terbaru jika tidak ada.',
  'help.guide.continue-writing.result':
    'Jurnal terbuka di hari ini, atau di entri terakhir sebelum hari ini jika belum ada yang ditulis.',
  'help.guide.continue-writing.tip.1':
    'Banner juga menawarkan saran untuk perjalanan yang belum punya journey; “Tutup” menyembunyikan saran itu.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Jurnal',
  'help.ctx.journey-detail.summary':
    'Satu journey yang terbuka: linimasa di kiri, hari demi hari, dan peta di kanan dengan setiap entri serta tempat-tempat dari perjalanan yang ditautkan. Semua yang menambah isi jurnal ada di bagian atas; header memuat jumlah, “Studio”, sakelar saran, dan “Pengaturan Journey”.',
  'help.ctx.journey-detail.bullet.1':
    'Header: sampul, judul dan subjudul, jumlah hari, tempat, entri, dan foto, serta di kanan “Studio”, sakelar saran, dan “Pengaturan Journey”.',
  'help.ctx.journey-detail.bullet.2':
    'Toolbar: tab “Linimasa” dan “Galeri”, “Cari di perjalanan ini”, dan “Tambah Entri”.',
  'help.ctx.journey-detail.bullet.3':
    'Linimasa: satu bagian per hari dengan + untuk menambah entri di hari itu; kartu entri dengan foto, suasana hati, cuaca, dan cerita; saran dari perjalanan dalam gaya yang lebih terang dengan “Abaikan saran ini”.',
  'help.ctx.journey-detail.bullet.4':
    'Peta: entri sebagai pin, dihubungkan berdasarkan urutan tanggal oleh garis putus-putus, tempat-tempat perjalanan, jalur GPX apa pun yang diimpor ke perjalanan itu, dan foto entri yang memiliki geotag.',
  'help.ctx.journey-detail.bullet.5':
    '“Pengaturan Journey”: sampul, nama dan subjudul, status, jalur di peta, bidang entri, saran yang diabaikan, perjalanan yang ditautkan, kontributor, berbagi publik, arsip, dan hapus.',
  'help.ctx.journey-detail.bullet.6':
    'Dua tombol bulat melayang di atas linimasa yang panjang: kembali ke atas, dan lompat ke entri terakhir.',
  // add-entry
  'help.guide.add-entry.title': 'Menulis entri',
  'help.guide.add-entry.goal': 'Tambahkan cerita sebuah hari dengan judul, teks, suasana hati, dan cuaca.',
  'help.guide.add-entry.step.1': 'Klik “Tambah Entri” di toolbar, atau + di header hari untuk memulai di hari itu.',
  'help.guide.add-entry.step.2':
    'Beri nama momen itu dan tulis ceritanya. Toolbar di atas teks menambahkan tebal, miring, judul, kutipan, tautan, dan daftar dalam Markdown.',
  'help.guide.add-entry.step.3':
    'Pilih suasana hati dan cuaca, periksa tanggalnya, dan sematkan lokasi jika mau: cari tempat atau gunakan posisi Anda saat ini.',
  'help.guide.add-entry.step.4': 'Klik “Simpan”.',
  'help.guide.add-entry.result':
    'Entri muncul di harinya di linimasa dan sebagai pin di peta. Jumlahnya diperbarui di header.',
  'help.guide.add-entry.tip.1': 'Menulis ke dalam saran memakai editor yang sama, dengan tempat yang sudah ditetapkan.',
  'help.guide.add-entry.tip.2':
    'Tag di bagian bawah adalah teks bebas, “hidden gem” atau “best meal”, dan pencarian menemukannya.',
  // entry-photos
  'help.guide.entry-photos.title': 'Menambahkan foto dan video ke entri',
  'help.guide.entry-photos.goal': 'Letakkan gambar di sebuah hari; yang pertama menjadi sampul entri.',
  'help.guide.entry-photos.step.1': 'Buka menu entri dengan ⋯ di kartunya dan pilih “Sunting”.',
  'help.guide.entry-photos.step.2':
    'Klik “Unggah foto” dan pilih berkasnya. “Dari Galeri” mengambil gambar yang sudah ada di galeri journey; “External photos” mencari pustaka Immich atau Synology yang terhubung untuk hari itu.',
  'help.guide.entry-photos.step.3':
    'Arahkan kursor ke sebuah gambar untuk “Jadikan ke-1” guna memilih sampul, lalu klik “Simpan”.',
  'help.guide.entry-photos.result': 'Foto tampil di kartu dan di galeri; yang pertama menjadi thumbnail di mana-mana.',
  'help.guide.entry-photos.tip.1':
    'Video masuk ke entri dengan cara yang sama: mp4, m4v, webm, atau mov hingga 500 MB, disimpan apa adanya seperti saat diunggah.',
  'help.guide.entry-photos.tip.2':
    'Berkas HEIC dari iPhone dikonversi ke JPEG saat diunggah, yang menghilangkan metadata GPS dan kameranya.',
  // suggestions
  'help.guide.suggestions.title': 'Memakai atau mengabaikan saran',
  'help.guide.suggestions.goal':
    'Ubah tempat-tempat perjalanan Anda menjadi entri, dan singkirkan yang tidak akan Anda tulis.',
  'help.guide.suggestions.step.1':
    'Saran adalah kartu yang lebih terang dengan nama tempat dalam huruf miring. Klik untuk membuka editor dengan tempat dan hari yang sudah ditetapkan.',
  'help.guide.suggestions.step.2':
    'Klik “Abaikan saran ini” pada kartu yang tidak akan Anda pakai. Kartu itu keluar dari linimasa tanpa dihapus, dan sinkronisasi perjalanan tidak akan menawarkannya lagi.',
  'help.guide.suggestions.step.3':
    'Berubah pikiran? “Pengaturan Journey” menunjukkan berapa banyak yang diabaikan, dan “Kembalikan saran yang diabaikan” mengembalikan semuanya.',
  'help.guide.suggestions.result':
    'Linimasa hanya berisi apa yang memang ingin Anda tulis; sakelar di header menyembunyikan semua saran sekaligus saat Anda membaca.',
  'help.guide.suggestions.tip.1': 'Tempat yang berlangsung selama dua hari memberi saran di masing-masing hari.',
  'help.guide.suggestions.tip.2':
    'Saran tidak pernah dihitung dalam statistik; hanya entri yang ditulis yang dihitung.',
  // add-on-day
  'help.guide.add-on-day.title': 'Menambahkan entri di hari yang sudah lewat',
  'help.guide.add-on-day.goal': 'Menulis tentang hari yang sudah berlalu tanpa memperbaiki tanggalnya belakangan.',
  'help.guide.add-on-day.step.1': 'Klik + di header hari itu.',
  'help.guide.add-on-day.step.2':
    'Editor terbuka dengan tanggal itu sudah ditetapkan. Tulis dan “Simpan” seperti biasa.',
  'help.guide.add-on-day.result': 'Entri langsung mendarat di hari yang tepat.',
  'help.guide.add-on-day.tip.1': 'Dalam satu hari, panah di menu entri memindahkannya lebih awal atau lebih akhir.',
  // pros-cons
  'help.guide.pros-cons.title': 'Menambahkan penilaian',
  'help.guide.pros-cons.goal': 'Rangkum sebuah hari dengan apa yang hebat dan apa yang tidak.',
  'help.guide.pros-cons.step.1':
    'Di editor, cari “Pro & Kontra” di bawah cerita. Ketik satu poin ke “Pro” atau “Kontra” dan gunakan “Tambah lagi” untuk poin berikutnya.',
  'help.guide.pros-cons.step.2': 'Simpan. Penilaian tampil di kartu sebagai dua daftar pendek.',
  'help.guide.pros-cons.result': 'Jempol ke atas dan jempol ke bawah sekali pandang, di bawah cerita.',
  'help.guide.pros-cons.tip.1':
    'Journey yang tidak memakai penilaian bisa mematikan bagian ini di bawah “Bidang catatan” di “Pengaturan Journey”.',
  // search-journey
  'help.guide.search-journey.title': 'Menemukan sesuatu di jurnal yang panjang',
  'help.guide.search-journey.goal': 'Sampai ke entri yang Anda maksud tanpa menggulir berminggu-minggu.',
  'help.guide.search-journey.step.1':
    'Ketik ke “Cari di perjalanan ini” di toolbar. Linimasa tersaring saat Anda mengetik, mencakup judul, cerita, tempat, dan tag. Aksen dan huruf besar-kecil tidak berpengaruh.',
  'help.guide.search-journey.step.2':
    'Sakelar saran di header menyembunyikan kartu yang belum ditulis saat Anda membaca. Begitu linimasa panjang, dua tombol bulat melayang di atas tepi bawahnya: kembali ke atas, dan lompat ke entri terakhir.',
  'help.guide.search-journey.result':
    'Hanya entri yang cocok yang tinggal; kosongkan kotaknya untuk melihat semuanya lagi.',
  'help.guide.search-journey.tip.1':
    'Journey yang sedang berjalan terbuka di hari ini, jadi halaman saat ini biasanya sudah terlihat.',
  'help.guide.search-journey.tip.2':
    'Tag juga dihitung: mencari “hidden gem” menemukan setiap entri yang diberi tag itu.',
  // gallery-map
  'help.guide.gallery-map.title': 'Menjelajahi galeri dan peta',
  'help.guide.gallery-map.goal': 'Lihat seluruh journey sebagai gambar, dan sebagai tempat di peta.',
  'help.guide.gallery-map.step.1':
    'Beralih ke “Galeri” di toolbar: setiap foto dari setiap entri, ditambah gambar yang diunggah langsung ke galeri. Klik salah satunya untuk lightbox.',
  'help.guide.gallery-map.step.2':
    'Peta di kanan menampilkan entri sebagai pin dalam urutan tanggal, tempat-tempat dari perjalanan yang ditautkan, dan jalur GPX apa pun yang diimpor ke perjalanan itu, dalam warna yang dimilikinya di perencana.',
  'help.guide.gallery-map.result':
    'Arahkan kursor ke sebuah jalur untuk melihat namanya. Garis putus-putus antar entri digambar oleh TREK; jalur adalah rute yang benar-benar Anda rekam.',
  'help.guide.gallery-map.tip.1': 'Jalur bisa dimatikan untuk sebuah journey di bawah “Pengaturan Journey”.',
  'help.guide.gallery-map.tip.2':
    'Foto galeri yang punya lokasi juga muncul di peta publik, jika “Galeri” dan “Peta” sama-sama dibagikan.',
  // entry-fields
  'help.guide.entry-fields.title': 'Mematikan bidang entri',
  'help.guide.entry-fields.goal': 'Batasi editor pada apa yang dipakai journey ini.',
  'help.guide.entry-fields.step.1': 'Buka “Pengaturan Journey” dari header.',
  'help.guide.entry-fields.step.2':
    'Di bawah “Bidang catatan”, matikan “Suasana hati”, “Cuaca”, atau “Kelebihan & kekurangan”.',
  'help.guide.entry-fields.result':
    'Editor berhenti menanyakannya. Tidak ada tulisan yang hilang: menyalakan kembali sebuah bidang memunculkan nilai yang tersimpan, dan journey yang dibagikan menyembunyikan bidang yang sama.',
  'help.guide.entry-fields.tip.1': 'Sakelarnya berlaku per journey, jadi perjalanan kerja dan liburan bisa berbeda.',
  // link-trip
  'help.guide.link-trip.title': 'Menautkan perjalanan lain',
  'help.guide.link-trip.goal': 'Bawa tempat-tempat dari perjalanan kedua ke dalam jurnal sebagai saran.',
  'help.guide.link-trip.step.1': 'Buka “Pengaturan Journey” dari header.',
  'help.guide.link-trip.step.2': 'Di bawah perjalanan yang ditautkan, klik “Tambah Perjalanan”.',
  'help.guide.link-trip.step.3': 'Pilih perjalanannya.',
  'help.guide.link-trip.result':
    'Tempat-tempatnya tiba di linimasa sebagai saran pada hari masing-masing, dan jalur GPX-nya bergabung ke peta.',
  'help.guide.link-trip.tip.1':
    'Tanda × di sebelah perjalanan yang ditautkan melepas tautannya lagi; entri yang Anda tulis tetap ada.',
  'help.guide.link-trip.tip.2':
    'Entri pada sebuah hari hanya dihitung sekali, berapa pun perjalanan yang mencakup hari itu.',
  // share-public
  'help.guide.share-public.title': 'Membagikan journey secara publik',
  'help.guide.share-public.goal': 'Beri orang tanpa akun TREK sebuah tautan hanya-baca.',
  'help.guide.share-public.step.1': 'Buka “Pengaturan Journey” dan cari “Berbagi Publik”.',
  'help.guide.share-public.step.2': 'Klik “Buat tautan berbagi”.',
  'help.guide.share-public.step.3':
    'Pilih apa yang dilihat pengunjung: “Linimasa”, “Galeri”, dan “Peta” adalah sakelar terpisah. “Salin” menaruh tautan di papan klip Anda.',
  'help.guide.share-public.result':
    'Siapa pun yang punya tautan melihat bagian yang diaktifkan dan tidak ada yang lain; bidang yang Anda matikan di “Bidang catatan” tetap tersembunyi di sana juga.',
  'help.guide.share-public.tip.1':
    'Foto muncul di peta publik hanya jika “Galeri” dan “Peta” sama-sama menyala; dengan “Peta” mati, koordinatnya dihapus sebelum meninggalkan server.',
  'help.guide.share-public.tip.2': 'Hapus tautan di tempat yang sama untuk mengakhiri berbagi.',
  // contributors
  'help.guide.contributors.title': 'Menulis bersama',
  'help.guide.contributors.goal': 'Biarkan teman seperjalanan menambahkan entri dan foto mereka sendiri.',
  'help.guide.contributors.step.1': 'Buka “Pengaturan Journey” dan gulir ke kontributor.',
  'help.guide.contributors.step.2': 'Klik “Undang Kontributor” dan cari pengguna berdasarkan nama atau email.',
  'help.guide.contributors.step.3': 'Pilih peran dan konfirmasi.',
  'help.guide.contributors.result':
    'Journey muncul di daftar mereka dan entri mereka membawa nama mereka. Hapus kontributor dengan tanda × di sebelahnya.',
  'help.guide.contributors.tip.1':
    'Kontributor adalah untuk orang-orang di TREK ini. Untuk yang lain ada tautan publik.',
  // studio
  'help.guide.studio.title': 'Menata journey sebagai buku foto',
  'help.guide.studio.goal': 'Ubah jurnal menjadi halaman yang bisa dicetak.',
  'help.guide.studio.step.1': 'Klik “Studio” di header. Perancang terbuka di atas journey.',
  'help.guide.studio.step.2':
    'Nama journey di sisi kiri bilah atas adalah jalan kembali; ia mengantar Anda ke tempat semula.',
  'help.guide.studio.result':
    'Rel halaman di kiri, spread di meja kerja, properti di kanan. “Auto layout” membangun buku dari entri Anda; “Export” membuat PDF siap cetak.',
  'help.guide.studio.tip.1': 'Studio membutuhkan jendela selebar minimal 1024 px dan tidak ditawarkan di ponsel.',
  'help.guide.studio.tip.2':
    'Buku mewarisi akses journey: siapa pun yang boleh membaca journey boleh membukanya, siapa pun yang boleh menyunting boleh menyimpan.',
  // archive-journey
  'help.guide.archive-journey.title': 'Mengarsipkan atau menghapus journey',
  'help.guide.archive-journey.goal': 'Tutup journey yang sudah selesai, atau hapus untuk selamanya.',
  'help.guide.archive-journey.step.1': 'Buka “Pengaturan Journey”.',
  'help.guide.archive-journey.step.2':
    'Di bagian bawah, “Arsipkan Perjalanan” mengakhirinya dan menandainya sebagai diarsipkan; “Pulihkan Perjalanan” mengembalikannya. “Hapus” menghapusnya beserta semua entri dan foto, setelah konfirmasi.',
  'help.guide.archive-journey.result':
    'Journey yang diarsipkan tetap bisa dibaca dan dibagikan; hanya saja tidak lagi terbuka di hari ini.',
  'help.guide.archive-journey.tip.1':
    'Penghapusan tidak bisa dibatalkan, dan tidak menyentuh perjalanan yang pernah ditautkan ke journey itu.',
  'help.guide.archive-journey.tip.2': 'Sampul, nama, dan subjudul ada di dialog yang sama, di bagian atas.',
  'help.guide.journey-status.title': 'Mengatur status journey',
  'help.guide.journey-status.goal':
    'Tandai sendiri sebuah journey sebagai “Draf”, “Langsung”, atau “Selesai”, alih-alih mengikuti tanggal perjalanannya.',
  'help.guide.journey-status.step.1': 'Buka “Pengaturan Journey” di header journey.',
  'help.guide.journey-status.step.2':
    'Di bawah “Status”, pilih “Draf”, “Langsung”, atau “Selesai”. Pilihan Anda segera tersimpan.',
  'help.guide.journey-status.result':
    'Journey tetap memakai status yang Anda pilih, dan kartunya di daftar journey menampilkannya.',
  'help.guide.journey-status.tip.1':
    '“Otomatis” kembali mengikuti tanggal perjalanan yang ditautkan. Tanpa perjalanan yang ditautkan, journey otomatis tetap berupa draf.',
  'help.guide.journey-status.tip.2':
    'Status yang diatur manual tetap berlaku sampai Anda mengubahnya, juga saat tanggal perjalanan bergeser.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio menata sebuah perjalanan menjadi buku foto yang siap cetak. Studio terbuka di atas jurnal: bilah halaman dan konten di kiri, halaman ganda yang sedang Anda kerjakan di tengah, propertinya di kanan. Auto layout membangun draf pertama dari entri Anda; setelah itu semuanya terserah Anda untuk dipindahkan, dipotong, dan ditata ulang, dengan Undo untuk setiap langkah.',
  'help.ctx.journey-studio.bullet.1':
    'Bilah atas: Back to the journey, Book view, Undo dan Redo, Page format, Auto layout, dan Export. Tanda “Tersimpan” di samping judul memberi tahu Anda kapan buku sudah disimpan.',
  'help.ctx.journey-studio.bullet.2':
    'Bilah samping di kiri dengan lima bagian: Pages, Content (foto dan entri perjalanan), Elements (teks, bentuk, garis, kisi, bingkai, ikon), “Perjalanan” (peta, negara, bendera, dan tanda yang dibangun dari perjalanan), dan Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Area kerja: halaman ganda saat ini dengan margin bleed dan margin amannya, bilah zoom di bawahnya, Fit to view, dan “Unduh halaman ganda ini” di kanan.',
  'help.ctx.journey-studio.bullet.4':
    'Properties di kanan: posisi dan ukuran, potongan dan titik fokus, Fill atau Fit, tampilan, sudut, bingkai, urutan tumpukan, dan kunci dari apa pun yang dipilih; nomor halaman dan dokumen jika tidak ada yang dipilih.',
  'help.ctx.journey-studio.bullet.5':
    'Buku ini berbentuk buku jilid: sampul, satu halaman pertama, halaman-halaman ganda, satu halaman terakhir, dan sampul belakang. Nomor halaman dihitung dari halaman pertama dan dicetak seperti yang ditampilkan.',
  'help.ctx.journey-studio.bullet.6':
    'Beberapa orang bisa mendesain sekaligus: semua orang melihat penunjuk orang lain beserta namanya, dan menyimpan versi yang sudah diubah orang lain akan kembali sebagai konflik, bukan menimpa pekerjaan mereka.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Membangun buku secara otomatis',
  'help.guide.studio-auto-layout.goal':
    'Dapatkan draf pertama yang lengkap dari entri dan foto jurnal dengan satu klik.',
  'help.guide.studio-auto-layout.step.1': 'Klik Auto layout di bilah atas.',
  'help.guide.studio-auto-layout.step.2':
    'Pilih “Seluruh buku”: ini mengganti setiap halaman, dengan tetap mempertahankan judul dan pengaturan halaman Anda. “Halaman ini” hanya membangun ulang halaman yang ada di layar, dan ditawarkan pada halaman ganda yang berasal dari sebuah entri.',
  'help.guide.studio-auto-layout.step.3':
    'Periksa bilah halaman. Undo mengembalikan seluruh tata letak jika Anda lebih suka yang sebelumnya.',
  'help.guide.studio-auto-layout.result':
    'Satu halaman ganda per entri, berurutan, dengan foto, judul, dan kisahnya sudah ditempatkan untuk Anda. Setiap elemen tetap mengikuti entrinya sampai Anda mengeditnya.',
  'help.guide.studio-auto-layout.tip.1': 'Kedua pilihan itu adalah langkah undo biasa, jadi cobalah dengan bebas.',
  'help.guide.studio-auto-layout.tip.2':
    'Elemen yang diikat Auto layout ke sebuah entri terus mengikuti perubahan entri itu sampai Anda menyentuhnya di Properties; itu memutus tautannya.',
  // studio-pages
  'help.guide.studio-pages.title': 'Menambah, memindahkan, dan menghapus halaman ganda',
  'help.guide.studio-pages.goal': 'Bentuk buku halaman demi halaman.',
  'help.guide.studio-pages.step.1':
    'Buka Pages di bilah samping. Thumbnail-nya adalah buku dalam urutannya: sampul, halaman pertama, halaman ganda, halaman terakhir, sampul belakang.',
  'help.guide.studio-pages.step.2':
    '“Tambah halaman” di bagian bawah menempatkan halaman ganda baru sebelum halaman terakhir; tanda + di antara dua thumbnail menyisipkannya tepat di sana.',
  'help.guide.studio-pages.step.3':
    'Arahkan kursor ke thumbnail untuk melihat tindakannya: “Pindah ke depan”, “Pindah ke belakang”, “Duplikat halaman”, dan “Hapus halaman”. Klik thumbnail untuk membuka halaman ganda itu di area kerja.',
  'help.guide.studio-pages.result':
    'Sampul, halaman pertama dan terakhir, serta sampul belakang tetap di tempatnya; halaman ganda baru selalu masuk di antaranya.',
  'help.guide.studio-pages.tip.1':
    'Book view di bilah atas menampilkan seluruh buku sebagai lembaran, seperti saat dijilid.',
  'help.guide.studio-pages.tip.2':
    'Nomor halaman diaktifkan di bawah “Dokumen” di Properties, saat tidak ada yang dipilih.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Menerapkan tata letak ke halaman ganda',
  'help.guide.studio-layouts.goal': 'Beri halaman ganda susunan bingkai foto dan teks yang sudah jadi.',
  'help.guide.studio-layouts.step.1':
    'Buka Layouts di bilah samping. Tiga belas tata letak halaman ganda, dan satu set terpisah untuk sampul, sampul belakang, dan halaman tunggal.',
  'help.guide.studio-layouts.step.2':
    'Klik salah satu. Halaman ganda di area kerja mengambil bingkainya; foto dan teks yang sudah Anda miliki dituangkan ke dalamnya.',
  'help.guide.studio-layouts.result':
    'Bingkai kosong menunggu konten: seret foto dari Content ke salah satunya, atau gunakan Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Tata letak adalah langkah undo seperti yang lain.',
  // studio-content
  'help.guide.studio-content.title': 'Menempatkan foto dan entri di halaman',
  'help.guide.studio-content.goal': 'Bawa materi perjalanan itu sendiri ke halaman ganda.',
  'help.guide.studio-content.step.1':
    'Buka Content di bilah samping. Photos mencantumkan setiap gambar dari perjalanan; Entries mencantumkan entri beserta teksnya.',
  'help.guide.studio-content.step.2':
    'Seret foto ke halaman ganda, atau ke bingkai kosong, atau klik Add to this page di bawahnya. “Unggah foto” menambahkan gambar yang belum ada di perjalanan.',
  'help.guide.studio-content.step.3':
    'Di bawah sebuah entri, Title, Story, dan Place menempatkan teks itu di halaman sebagai elemen teks; tanggal dan koordinat datang sebagai tanda, dan foto entri itu tercantum tepat di sana.',
  'help.guide.studio-content.result':
    'Foto yang dijatuhkan menjadi elemen foto; teks terus mengikuti entri sampai Anda mengeditnya.',
  'help.guide.studio-content.tip.1': 'Kotak pencarian di bagian atas Content menyaring kedua daftar.',
  'help.guide.studio-content.tip.2':
    'Menjatuhkan berkas dari desktop Anda ke area kerja mengunggah dan menempatkannya sekaligus.',
  // studio-elements
  'help.guide.studio-elements.title': 'Menambahkan teks, bentuk, dan ikon',
  'help.guide.studio-elements.goal': 'Hiasi halaman ganda lebih dari sekadar foto dan kisah.',
  'help.guide.studio-elements.step.1': 'Buka Elements di bilah samping.',
  'help.guide.studio-elements.step.2':
    'Klik gaya teks untuk judul atau keterangan, sebuah bentuk, garis, kisi, bingkai kosong dengan gaya bingkai, atau ikon dari pustaka yang bisa dicari. Masing-masing mendarat di tengah halaman ganda, siap dipindahkan.',
  'help.guide.studio-elements.result':
    'Klik dua kali elemen teks untuk mengetik di dalamnya; Properties memuat font, ketebalan, ukuran, spasi, dan perataan.',
  'help.guide.studio-elements.tip.1': 'Bingkai adalah slot foto kosong: jatuhkan gambar ke dalamnya nanti.',
  // studio-travel
  'help.guide.studio-travel.title': 'Menambahkan peta, bendera, dan angka',
  'help.guide.studio-travel.goal': 'Ubah perjalanan itu sendiri menjadi angka di halaman.',
  'help.guide.studio-travel.step.1': 'Buka “Perjalanan” di bilah samping.',
  'help.guide.studio-travel.step.2':
    'Pilih yang ingin ditambahkan: peta rute dari entri, garis luar negara, daftar atau kisi negara, bendera, tanda tanggal, hari, atau jarak, atau ringkasan seluruh perjalanan. Masing-masing dibangun dari data perjalanan dan diperbarui bersamanya.',
  'help.guide.studio-travel.result':
    'Elemen muncul di halaman ganda; Properties menyesuaikan gayanya, dan peta menyesuaikan areanya.',
  'help.guide.studio-travel.tip.1':
    'Tanda mengikuti entri asal halaman ganda itu, jadi tanda tanggal pada halaman ganda hasil auto layout sudah menampilkan hari itu.',
  // studio-properties
  'help.guide.studio-properties.title': 'Mengedit yang Anda pilih',
  'help.guide.studio-properties.goal': 'Pindahkan, potong, tata, dan susun elemen dengan panel properti.',
  'help.guide.studio-properties.step.1':
    'Klik sebuah elemen di halaman ganda. Pegangan muncul untuk ukuran dan rotasi; seret untuk memindahkannya.',
  'help.guide.studio-properties.step.2':
    'Properties di kanan mengikuti pilihan: posisi dan ukuran, Crop dengan titik fokus yang menentukan apa yang tetap dalam bingkai, Fill atau Fit, filter Look, radius Corner, gaya Bingkai, urutan tumpukan, dan Lock.',
  'help.guide.studio-properties.step.3':
    'Duplikat dan Delete ada di bagian atas panel properti; Undo di bilah atas membatalkan semuanya.',
  'help.guide.studio-properties.result':
    'Elemen yang dikunci tidak bisa lagi diambil di halaman, sehingga tata letak yang sudah selesai tetap aman saat Anda bekerja di sekitarnya.',
  'help.guide.studio-properties.tip.1':
    'Shift-klik memilih beberapa elemen; panel properti lalu mengeditnya bersama-sama.',
  'help.guide.studio-properties.tip.2':
    'Mengedit elemen yang ditempatkan Auto layout memutus tautannya ke entri; elemen itu berhenti mengikuti perubahan berikutnya pada entri tersebut.',
  // studio-format
  'help.guide.studio-format.title': 'Memilih format halaman',
  'help.guide.studio-format.goal': 'Tetapkan ukuran cetak buku, sebelum tata letak bergantung padanya.',
  'help.guide.studio-format.step.1': 'Klik Page format di bilah atas.',
  'help.guide.studio-format.step.2':
    'Pilih Square 21 × 21 cm, Square 30 × 30 cm, A4 atau A5 lanskap atau potret, atau masukkan lebar dan tinggi sendiri dalam milimeter. Bleed dan margin aman ada di bawahnya.',
  'help.guide.studio-format.result':
    'Setiap halaman ganda digambar pada ukuran itu, dengan bleed 3 mm dan margin aman 5 mm secara bawaan.',
  'help.guide.studio-format.tip.1':
    'Ubah format lebih dulu, lalu jalankan Auto layout; tata letak dibangun untuk ukuran yang ditemukannya.',
  'help.guide.studio-format.tip.2': 'Tanyakan nilai bleed dan margin aman ke percetakan Anda dan masukkan nilai itu.',
  // studio-export
  'help.guide.studio-export.title': 'Mengekspor buku sebagai PDF',
  'help.guide.studio-export.goal': 'Dapatkan berkas siap cetak, atau berkas untuk dibaca di layar.',
  'help.guide.studio-export.step.1': 'Klik Export di bilah atas.',
  'help.guide.studio-export.step.2':
    'Pilih “Halaman tunggal”, satu lembar per halaman dalam urutan baca, yang diinginkan percetakan, atau “Halaman ganda”, dua halaman sekaligus seperti buku terbuka. “Tanda potong” menambahkan bleed di setiap tepi dan menandai tempat memotong.',
  'help.guide.studio-export.step.3':
    'Klik “Tampilan cetak”. Browser Anda membuka halaman-halamannya dan “Simpan sebagai PDF” mengubahnya menjadi berkas.',
  'help.guide.studio-export.result':
    'PDF dengan jumlah lembar sebanyak yang diumumkan dialog, pada format halaman yang Anda tetapkan.',
  'help.guide.studio-export.tip.1': 'Membuat PDF hanya bisa di desktop, seperti Studio itu sendiri.',
  'help.guide.studio-export.tip.2':
    'Untuk contoh cetak, ekspor “Halaman ganda” tanpa tanda potong; untuk percetakan, “Halaman tunggal” dengan tanda potong.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Menggunakan ulang halaman ganda di buku lain',
  'help.guide.studio-spread-file.goal': 'Bawa desain yang Anda sukai dari buku satu perjalanan ke perjalanan lain.',
  'help.guide.studio-spread-file.step.1':
    'Dengan halaman ganda di area kerja, klik “Unduh halaman ganda ini” di ujung kanan bilah zoom. Berkas itu berisi desainnya, bukan fotonya.',
  'help.guide.studio-spread-file.step.2':
    'Di buku lain, buka Pages dan klik “Impor” di samping “Tambah halaman”, lalu pilih berkasnya.',
  'help.guide.studio-spread-file.result':
    'Halaman ganda tiba dengan bingkai dan gaya teksnya; jatuhkan foto perjalanan baru ke dalam bingkainya.',
  'help.guide.studio-spread-file.tip.1': 'Berkas yang bukan desain halaman ganda ditolak dengan alasannya.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Pengaturan',
  'help.ctx.settings.summary':
    'Pengaturan pribadi Anda, satu tab per topik di bilah samping kiri. Sebagian besar sakelar langsung berlaku begitu Anda mengubahnya; formulir dengan tombol “Simpan” di bawahnya menunggu tombol itu ditekan. Tidak ada yang di sini mengubah TREK milik orang lain.',
  'help.ctx.settings.bullet.1':
    'Bilah samping kiri: “Tampilan”, “Appearance”, “Peta”, “Notifikasi”, “Integrasi”, “Offline”, dan “Akun”. “Plugin” muncul begitu ada satu yang terpasang, “Tentang” di mana pun operatornya tidak menghapusnya.',
  'help.ctx.settings.bullet.2':
    '“Tampilan” berisi bahasa, satuan, mata uang, dan apa yang dibuka aplikasi saat mulai; “Appearance” berisi tema, warna, ukuran teks, dan widget dasbor.',
  'help.ctx.settings.bullet.3':
    '“Peta” memilih mesin peta dan gayanya; “Notifikasi” saluran yang menjangkau Anda; “Integrasi” pustaka foto, kunci API, dan MCP; “Offline” apa yang disimpan aplikasi di perangkat ini.',
  'help.ctx.settings.bullet.4':
    '“Akun” memuat profil, kata sandi, autentikasi dua faktor, passkey, dan penghapusan akun Anda.',
  'help.ctx.settings-display.title': 'Tampilan',
  'help.ctx.settings-display.summary':
    'Bahasa, satuan, dan mata uang, cara peta dan pemesanan berperilaku, serta apa yang dibuka TREK saat mulai. Setiap perubahan di sini langsung berlaku.',
  'help.ctx.settings-display.bullet.1':
    '“Language & region”: bahasa antarmuka, format waktu, hari pertama dalam seminggu, mata uang tampilan, serta satuan jarak dan suhu.',
  'help.ctx.settings-display.bullet.2':
    '“Travel & map”: rute pemesanan selalu di peta, pil Jelajahi tempat, optimalisasi rute dari akomodasi Anda, kode pemesanan yang disamarkan, dan rute pemesanan berlabel.',
  'help.ctx.settings-display.bullet.3':
    '“Mulai”: apakah TREK membuka dasbor atau perjalanan aktif, dan tab perjalanan mana yang muncul pertama.',
  'help.ctx.settings-appearance.title': 'Tampilan',
  'help.ctx.settings-appearance.summary':
    'Tampilan TREK di akun ini: terang atau gelap, warna aksen, kaca dan gerakan, ukuran teks, dan widget mana yang ditampilkan dasbor. Semuanya berlaku langsung, di setiap perangkat tempat Anda masuk.',
  'help.ctx.settings-appearance.bullet.1':
    '“Theme”: “Terang”, “Gelap”, atau “Otomatis”, dan “Color scheme” dengan “Custom accent” pilihan Anda sendiri.',
  'help.ctx.settings-appearance.bullet.2':
    '“Readability”: “Transparency”, “Reduce motion”, “Density”, dan “Text size”, dengan ukuran lanjutan per tingkat.',
  'help.ctx.settings-appearance.bullet.3':
    '“Dashboard widgets”: satu sakelar per widget, terpisah untuk “Desktop” dan “Mobile”.',
  'help.ctx.settings-appearance.bullet.4': '“Reset to defaults” di bagian bawah mengembalikan semuanya.',
  'help.ctx.settings-map.title': 'Peta',
  'help.ctx.settings-map.summary':
    'Mesin mana yang menggambar peta dan dengan gaya apa. Leaflet adalah peta raster klasik, MapLibre menggambar tile vektor tanpa token apa pun, Mapbox menambahkan bangunan 3D dan medan dengan token Anda sendiri.',
  'help.ctx.settings-map.bullet.1':
    '“Penyedia peta”: Leaflet, MapLibre, atau Mapbox, masing-masing dengan satu baris tentang apa yang dibutuhkannya.',
  'help.ctx.settings-map.bullet.2':
    '“Gaya peta” dan “Template Peta”: tampilan tile, ditambah token atau kunci yang diminta penyedia.',
  'help.ctx.settings-map.bullet.3':
    '“Mode kualitas tinggi” untuk antialiasing dan proyeksi bola dunia; “Simpan Peta” menulis pilihannya.',
  'help.ctx.settings-notifications.title': 'Notifikasi',
  'help.ctx.settings-notifications.summary':
    'Di mana TREK menjangkau Anda di luar aplikasi: notifikasi push di perangkat ini, topik ntfy, webhook, atau saluran yang disediakan plugin. Di bawah saluran, satu baris per peristiwa menentukan apa yang dikirim ke mana.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: topik, server Anda sendiri yang opsional, dan token akses yang opsional, dengan “Uji” untuk langsung mengirim satu pesan.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook: satu URL yang menerima setiap peristiwa sebagai JSON, dengan “Uji”.',
  'help.ctx.settings-notifications.bullet.3':
    'Notifikasi push di perangkat ini: “Aktifkan untuk perangkat ini” hanya berlaku untuk browser yang sedang Anda gunakan, jadi ulangi di setiap ponsel atau komputer. “Kirim tes” sampai ke semuanya.',
  'help.ctx.settings-notifications.bullet.4':
    'Baris preferensi: per peristiwa, saluran mana yang aktif. Saluran plugin menampilkan “Konfigurasi” sampai selesai disiapkan.',
  'help.ctx.settings-integrations.title': 'Integrasi',
  'help.ctx.settings-integrations.summary':
    'Semua yang terhubung ke TREK dari luar: pustaka foto untuk jurnal, kunci API untuk skrip, dan endpoint MCP dengan token serta klien OAuth-nya untuk asisten AI.',
  'help.ctx.settings-integrations.bullet.1':
    'Penyedia foto: Immich dan Synology Photos, masing-masing dengan URL dan kuncinya, “Uji koneksi”, dan “Simpan”.',
  'help.ctx.settings-integrations.bullet.2':
    '“Kunci API”: kunci pribadi untuk skrip dan alat lain yang memanggil API TREK atas nama Anda.',
  'help.ctx.settings-integrations.bullet.3':
    '“Konfigurasi MCP”: endpoint, konfigurasi klien siap salin, dan token API.',
  'help.ctx.settings-integrations.bullet.4':
    '“Klien OAuth 2.1”: aplikasi yang masuk lewat TREK, dengan redirect URI, cakupan yang diizinkan, klien mesin, dan sesi yang aktif.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Apa yang disimpan TREK di perangkat ini agar perjalanan tetap bisa dibuka tanpa koneksi, dan apa yang terjadi ketika perubahan yang dibuat offline bertabrakan dengan perubahan yang dibuat di tempat lain.',
  'help.ctx.settings-offline.bullet.1':
    '“Mode offline”: “Paksa mode offline” membuat aplikasi berperilaku seolah jaringan hilang, untuk pengujian atau koneksi berkuota.',
  'help.ctx.settings-offline.bullet.2':
    '“Persiapkan untuk offline”: “Unduh untuk penggunaan offline” mengambil perjalanan Anda dan tile petanya sekarang.',
  'help.ctx.settings-offline.bullet.3':
    '“Apa yang disimpan offline”: tile peta aktif atau nonaktif, dan satu sakelar per perjalanan.',
  'help.ctx.settings-offline.bullet.4':
    '“Konflik sinkronisasi” dan “Cache offline”: strategi untuk tabrakan, jumlah yang tertunda dan gagal, “Sinkronkan ulang sekarang”, dan “Hapus cache”.',
  'help.ctx.settings-account.title': 'Akun',
  'help.ctx.settings-account.summary':
    'Siapa Anda di TREK ini dan cara Anda masuk: profil dan avatar, kata sandi, autentikasi dua faktor, passkey, dan di paling bawah penghapusan akun.',
  'help.ctx.settings-account.bullet.1': 'Profil: nama pengguna, email, dan avatar, disimpan dengan “Simpan Profil”.',
  'help.ctx.settings-account.bullet.2':
    '“Ganti Kata Sandi”: kata sandi saat ini, kata sandi baru dua kali, “Perbarui kata sandi”.',
  'help.ctx.settings-account.bullet.3':
    '“Autentikasi dua faktor (2FA)” dengan aplikasi autentikator dan kode cadangan; “Passkey” untuk masuk tanpa kata sandi.',
  'help.ctx.settings-account.bullet.4':
    '“Hapus akun” di bagian bawah, di balik sebuah konfirmasi. Admin terakhir tidak bisa menghapus dirinya sendiri.',
  // language-region
  'help.guide.language-region.title': 'Mengatur bahasa, satuan, dan mata uang',
  'help.guide.language-region.goal': 'Buat TREK berbicara dalam bahasa Anda dan menghitung seperti cara Anda.',
  'help.guide.language-region.step.1':
    'Pilih bahasa antarmuka di “Language & region”. TREK langsung beralih, di setiap perangkat tempat Anda masuk.',
  'help.guide.language-region.step.2':
    'Di bawahnya, pilih format waktu, hari yang mengawali minggu di setiap pemilih tanggal, mata uang tampilan, serta satuan jarak dan suhu.',
  'help.guide.language-region.result':
    'Tanggal, jarak, dan uang terbaca seperti yang Anda harapkan; mata uang perjalanan itu sendiri tetap tampil di samping jumlah yang dikonversi.',
  'help.guide.language-region.tip.1':
    'Mata uang tampilan dipakai untuk total lintas perjalanan; setiap perjalanan mempertahankan mata uang yang Anda berikan.',
  'help.guide.language-region.tip.2': 'Bahasa juga menentukan nama hari dan bulan di Vacay dan jurnal.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Menyetel perilaku peta dan pemesanan',
  'help.guide.travel-map-prefs.goal': 'Tentukan apa yang ditampilkan peta perjalanan secara default.',
  'help.guide.travel-map-prefs.step.1':
    'Di “Travel & map”, “Selalu tampilkan rute pemesanan” mempertahankan penerbangan dan kereta di peta bahkan saat harinya tidak sedang dibuka; “Jelajahi tempat di peta” menampilkan pil untuk mencari tempat; “Optimalkan rute dari akomodasi” memulai rute dari tempat Anda menginap.',
  'help.guide.travel-map-prefs.step.2':
    '“Sembunyikan Kode Pemesanan” menyamarkan nomor konfirmasi sampai Anda mengarahkan kursor; “Label rute pemesanan” menaruh kode bandara atau nama stasiun pada pil di setiap ujung rute sebuah pemesanan, yang kalau tidak hanya menampilkan ikon.',
  'help.guide.travel-map-prefs.result':
    'Peta perjalanan mengikuti pilihan ini di setiap perjalanan, sampai Anda mengubahnya kembali.',
  'help.guide.travel-map-prefs.tip.1':
    'Ini berlaku per akun, bukan per perjalanan. Anggota perjalanan bersama masing-masing melihat pilihannya sendiri.',
  'help.guide.travel-map-prefs.tip.2':
    '“Buka tempat di” memilih aplikasi peta yang langsung dibuka oleh tombol navigasi; “Tanya setiap kali” tetap menawarkan pilihan semua aplikasi peta.',
  // startup
  'help.guide.startup.title': 'Memilih apa yang dibuka TREK saat mulai',
  'help.guide.startup.goal': 'Mendarat di tempat Anda paling sering bekerja, bukan di dasbor setiap kali.',
  'help.guide.startup.step.1': 'Di “Mulai”, atur “Halaman awal” ke “Dasbor” atau “Perjalanan aktif”.',
  'help.guide.startup.step.2':
    '“Tab awal” memilih tab perjalanan mana yang muncul pertama saat Anda membuka satu perjalanan.',
  'help.guide.startup.result': 'Login berikutnya dan ketukan berikutnya pada logo langsung menuju ke sana.',
  'help.guide.startup.tip.1':
    '“Perjalanan aktif” berarti perjalanan yang sedang berlangsung hari ini, atau yang berikutnya jika tidak ada.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Mengatur tema dan warna aksen',
  'help.guide.theme-scheme.goal': 'Buat TREK terang, gelap, atau mengikuti perangkat Anda, dalam warna yang Anda suka.',
  'help.guide.theme-scheme.step.1':
    'Di “Theme”, pilih “Terang”, “Gelap”, atau “Otomatis”. “Otomatis” mengikuti perangkat Anda.',
  'help.guide.theme-scheme.step.2':
    'Pilih “Color scheme”: “Default”, “High contrast”, “Indigo”, “Teal”, “Rose”, “Amber”, “Violet”, atau “Custom”.',
  'help.guide.theme-scheme.step.3':
    'Dengan “Custom”, pilih aksen dari preset atau masukkan warna Anda sendiri. Pemeriksaan kontras di sebelahnya memberi tahu apakah teks tetap terbaca di atasnya.',
  'help.guide.theme-scheme.result':
    'Tombol, tautan, dan sorotan memakai aksen itu di mana-mana, di setiap perangkat tempat Anda masuk.',
  'help.guide.theme-scheme.tip.1':
    'Bilah navigasi juga punya sakelar cepat terang atau gelap; sakelar itu mengatur tema yang sama.',
  'help.guide.theme-scheme.tip.2':
    '“High contrast” adalah skema yang dipilih ketika yang default terasa terlalu lembut untuk dibaca.',
  // readability
  'help.guide.readability.title': 'Menyesuaikan keterbacaan dan ukuran teks',
  'help.guide.readability.goal':
    'Lebih sedikit kaca, lebih sedikit gerakan, lebih banyak ruang, atau huruf yang lebih besar.',
  'help.guide.readability.step.1':
    'Di “Readability”, “Transparency” mengganti panel kaca menjadi permukaan pekat, “Reduce motion” meminimalkan animasi, dan “Density” memilih “Comfortable” atau “Compact”.',
  'help.guide.readability.step.2':
    '“Text size” menskalakan “Everything” sekaligus; “Advanced text sizes” membiarkan judul, subjudul, isi, dan keterangan berbeda.',
  'help.guide.readability.result': 'Seluruh aplikasi langsung mengikuti, termasuk panel peta dan jurnal.',
  'help.guide.readability.tip.1': '“Reduce motion” juga mengikuti pengaturan sistem Anda ketika Anda membiarkannya.',
  'help.guide.readability.tip.2':
    'Ukuran teks diterapkan lewat tingkatan tipografi, jadi tidak ada yang terpotong; ukuran yang tidak lagi muat akan turun baris.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Memilih widget dasbor',
  'help.guide.dashboard-widgets.goal': 'Tampilkan hanya widget yang Anda pakai, terpisah di desktop dan di ponsel.',
  'help.guide.dashboard-widgets.step.1':
    'Di “Dashboard widgets”, nyalakan atau matikan setiap widget untuk “Desktop” dan untuk “Mobile”: bilah samping kanan secara keseluruhan, mata uang, Collections, zona waktu, reservasi mendatang, negara Atlas, dan angka perjalanan.',
  'help.guide.dashboard-widgets.step.2':
    '“Reset to defaults” di bagian bawah mengembalikan seluruh tab ke kondisi bawaannya.',
  'help.guide.dashboard-widgets.result':
    'Dasbor langsung menata ulang; dengan bilah samping kanan mati, dasbor berada di tengah.',
  'help.guide.dashboard-widgets.tip.1': 'Widget dari sebuah addon hanya muncul selama admin mengaktifkan addon itu.',
  'help.guide.dashboard-widgets.tip.2':
    'Dasbor sendiri mengingat tampilan kisi atau daftar dan urutan pengurutan per perangkat.',
  // map-provider
  'help.guide.map-provider.title': 'Memilih mesin dan gaya peta',
  'help.guide.map-provider.goal': 'Beralih antara peta klasik, tile vektor, dan peta 3D Mapbox.',
  'help.guide.map-provider.step.1':
    'Di “Penyedia peta”, pilih Leaflet untuk peta 2D klasik dengan tile raster apa pun, MapLibre untuk tile vektor OpenFreeMap tanpa token, atau Mapbox untuk tile vektor dengan bangunan 3D dan medan.',
  'help.guide.map-provider.step.2':
    'Pilih “Gaya peta” atau “Template Peta” untuk tampilannya. Mapbox membutuhkan “Token akses Mapbox”, beberapa gaya raster membutuhkan “Kunci API CARTO”; tautan di sebelah kolom mengarah ke tempat Anda mendapatkannya.',
  'help.guide.map-provider.step.3':
    '“Mode kualitas tinggi” menambahkan antialiasing dan proyeksi bola dunia. Klik “Simpan Peta”.',
  'help.guide.map-provider.result':
    'Setiap peta di TREK, perjalanan, Atlas, Collections, dan jurnal, digambar oleh mesin yang Anda pilih.',
  'help.guide.map-provider.tip.1': 'Tanpa token, Mapbox kembali ke peta default alih-alih tidak menampilkan apa pun.',
  'help.guide.map-provider.tip.2':
    'Tile peta yang Anda simpan offline berasal dari penyedia yang aktif saat Anda mengunduhnya.',
  // notification-channels
  'help.guide.notification-channels.title': 'Menyiapkan tempat notifikasi menjangkau Anda',
  'help.guide.notification-channels.goal':
    'Dapatkan pengingat perjalanan dan peristiwa kolaborasi di ponsel Anda atau di alat lain.',
  'help.guide.notification-channels.step.1':
    'Di “Notifikasi”, isi “Topik Ntfy”; tambahkan “URL Server Ntfy” Anda sendiri dan “Token Akses” jika Anda menjalankannya. “Uji” langsung mengirim pesan.',
  'help.guide.notification-channels.step.2':
    'Atau berikan “Webhook URL” yang menerima setiap peristiwa sebagai JSON, dan “Uji” dengan cara yang sama.',
  'help.guide.notification-channels.step.3':
    'Di baris-baris di bawahnya, nyalakan atau matikan setiap peristiwa per saluran. Saluran plugin menampilkan “Konfigurasi” sampai disiapkan di pengaturan plugin; “Kirim tes” mencoba satu.',
  'help.guide.notification-channels.result':
    'Peristiwa dikirim lewat saluran yang aktif. Lonceng di bilah navigasi tetap menampilkannya di dalam aplikasi apa pun yang terjadi.',
  'help.guide.notification-channels.tip.1':
    'Preferensi per perjalanan ada di perjalanan itu sendiri, di bawah pengaturan notifikasinya.',
  'help.guide.notification-channels.tip.2':
    'Admin bisa mengisi server ntfy default untuk semua orang; Anda tetap memilih topik Anda sendiri.',
  // photo-providers
  'help.guide.photo-providers.title': 'Menghubungkan pustaka foto',
  'help.guide.photo-providers.goal': 'Biarkan jurnal menarik foto hari itu dari Immich atau Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Di “Integrasi”, cari bagian penyedia dan masukkan URL serta kunci API-nya. Immich juga menawarkan untuk mencerminkan unggahan journey kembali ke pustaka.',
  'help.guide.photo-providers.step.2': 'Klik “Uji koneksi”, lalu “Simpan”.',
  'help.guide.photo-providers.result':
    'Tab “External photos” di editor entri mencari pustaka yang terhubung untuk hari entri itu, yang terdekat dengan lokasi entri lebih dulu.',
  'help.guide.photo-providers.tip.1':
    'Koneksi ini milik Anda: anggota lain dari sebuah journey menghubungkan pustaka mereka sendiri.',
  'help.guide.photo-providers.tip.2':
    'Penyedia tanpa data GPS di fotonya tetap berfungsi; daftarnya lalu berurutan menurut waktu.',
  // api-keys
  'help.guide.api-keys.title': 'Membuat kunci API',
  'help.guide.api-keys.goal': 'Biarkan skrip atau alat lain memanggil API TREK sebagai Anda.',
  'help.guide.api-keys.step.1':
    'Di “Kunci API”, klik “Buat kunci” dan beri nama yang menunjukkan di mana kunci itu akan dipakai.',
  'help.guide.api-keys.step.2':
    'Salin kunci dari dialog: kunci hanya ditampilkan sekali. Hapus kunci dari daftar ketika alat itu tidak lagi membutuhkannya.',
  'help.guide.api-keys.result':
    'Permintaan dengan kunci itu bertindak dengan izin Anda; daftar menunjukkan kapan setiap kunci dibuat dan terakhir dipakai.',
  'help.guide.api-keys.tip.1': 'Satu kunci per alat membuat pencabutan tidak merepotkan.',
  'help.guide.api-keys.tip.2':
    'Untuk asisten AI, gunakan MCP dengan OAuth; kunci API ditujukan untuk klien HTTP biasa.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Menghubungkan asisten AI lewat MCP',
  'help.guide.mcp-oauth.goal': 'Beri Claude, IDE, atau klien MCP lain akses ke perjalanan Anda.',
  'help.guide.mcp-oauth.step.1':
    'Di “Konfigurasi MCP”, salin “MCP Endpoint”, atau seluruh “Konfigurasi Client” untuk klien yang menerima potongan JSON.',
  'help.guide.mcp-oauth.step.2':
    'Klien yang masuk lewat browser memakai OAuth 2.1: “Klien Baru” di bawah “Klien OAuth 2.1”, dengan “Redirect URI”, “Cakupan yang Diizinkan”, dan, untuk server tanpa browser, “Klien mesin”.',
  'help.guide.mcp-oauth.step.3':
    '“Putar Ulang Secret” dan “Hapus Klien” ada di setiap klien; “Sesi OAuth Aktif” mencantumkan apa yang sedang masuk dan memungkinkan Anda mencabutnya. “API Tokens” dengan “Buat Token Baru” adalah jalan masuk yang lebih lama.',
  'help.guide.mcp-oauth.result':
    'Klien bisa membaca dan mengubah apa yang diizinkan cakupannya, sebagai Anda, dan setiap tindakan tampil atas nama Anda.',
  'help.guide.mcp-oauth.tip.1':
    'Cakupan adalah jaring pengaman: beri klien hanya cakupan baca sampai ia membutuhkan lebih.',
  'help.guide.mcp-oauth.tip.2': 'Admin bisa mematikan MCP untuk seluruh instans; bagian ini lalu tidak ada.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Membawa perjalanan offline',
  'help.guide.offline-prepare.goal': 'Miliki perjalanan Anda dan petanya di perangkat ini sebelum koneksi terputus.',
  'help.guide.offline-prepare.step.1':
    'Di “Apa yang disimpan offline”, biarkan “Simpan tile peta offline” menyala dan nyalakan perjalanan yang Anda inginkan di perangkat ini.',
  'help.guide.offline-prepare.step.2':
    'Klik “Unduh untuk penggunaan offline” di bawah “Persiapkan untuk offline”. Ini mengambil perjalanan dan tile di sekitar tempat-tempatnya.',
  'help.guide.offline-prepare.step.3':
    '“Paksa mode offline” di bawah “Mode offline” memungkinkan Anda memeriksa bahwa semuanya sudah ada sebelum berangkat.',
  'help.guide.offline-prepare.result':
    'Perjalanan terbuka tanpa koneksi; perubahan yang Anda buat menunggu dalam antrean dan dikirim saat tersambung kembali.',
  'help.guide.offline-prepare.tip.1':
    'Tile memakan ruang paling banyak: bagian “Cache offline” menunjukkan apa yang tersimpan, per perjalanan.',
  'help.guide.offline-prepare.tip.2': 'Pasang TREK sebagai aplikasi dari browser untuk awal offline yang paling mulus.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Menentukan siapa yang menang saat konflik sinkronisasi',
  'help.guide.offline-conflicts.goal':
    'Pilih cara TREK menyelesaikan perubahan yang dibuat offline terhadap perubahan yang dibuat di tempat lain.',
  'help.guide.offline-conflicts.step.1':
    'Di “Konflik sinkronisasi”, pilih “Tanya aku setiap kali”, “Selalu simpan versiku”, atau “Selalu simpan versi server”.',
  'help.guide.offline-conflicts.step.2':
    '“Cache offline” menampilkan perjalanan, perubahan yang tertunda dan gagal, serta konflik; “Sinkronkan ulang sekarang” mendorong antrean, “Hapus cache” mengosongkan perangkat.',
  'help.guide.offline-conflicts.result':
    'Dengan “Tanya aku setiap kali”, konflik menampilkan kedua versi dan membiarkan Anda memilih; dengan dua pilihan lainnya, konflik diselesaikan diam-diam.',
  'help.guide.offline-conflicts.tip.1':
    '“Hapus cache” hanya menghapus salinan di perangkat ini; tidak ada yang disentuh di server.',
  // profile
  'help.guide.profile.title': 'Mengubah profil Anda',
  'help.guide.profile.goal': 'Perbarui nama, email, dan foto Anda.',
  'help.guide.profile.step.1':
    'Di “Akun”, ubah “Nama pengguna” dan “Email”. Avatar menerima unggahan Anda sendiri; hapus untuk kembali ke inisial.',
  'help.guide.profile.step.2': 'Klik “Simpan Profil”.',
  'help.guide.profile.result':
    'Nama dan foto Anda langsung diperbarui di mana-mana, termasuk di perjalanan yang Anda bagikan.',
  'help.guide.profile.tip.1':
    'Akun yang masuk lewat OIDC menunjukkan hal itu di sini; email lalu berasal dari penyedia.',
  // password
  'help.guide.password.title': 'Mengganti kata sandi Anda',
  'help.guide.password.goal': 'Tetapkan kata sandi baru.',
  'help.guide.password.step.1': 'Di “Ganti Kata Sandi”, masukkan kata sandi Anda saat ini, lalu yang baru dua kali.',
  'help.guide.password.step.2': 'Klik “Perbarui kata sandi”.',
  'help.guide.password.result': 'Kata sandi baru berlaku pada login berikutnya; sesi lain tetap masuk.',
  'help.guide.password.tip.1': 'Akun yang masuk lewat OIDC tidak punya kata sandi TREK untuk diganti.',
  // mfa
  'help.guide.mfa.title': 'Mengaktifkan autentikasi dua faktor',
  'help.guide.mfa.goal': 'Lindungi akun dengan kode dari aplikasi autentikator.',
  'help.guide.mfa.step.1': 'Di “Autentikasi dua faktor (2FA)”, klik “Atur autentikator”.',
  'help.guide.mfa.step.2':
    'Pindai kode QR dengan aplikasi Anda, atau masukkan rahasianya secara manual, lalu ketik kode enam digit yang ditampilkan dan klik “Aktifkan 2FA”.',
  'help.guide.mfa.step.3':
    'Simpan kode cadangan: salin, unduh, atau cetak. Masing-masing berlaku sekali, saat ponsel tidak ada di tangan Anda.',
  'help.guide.mfa.result': 'Setiap login meminta kode setelah kata sandi.',
  'help.guide.mfa.tip.1': '“Nonaktifkan 2FA” membutuhkan kata sandi Anda dan kode yang sedang berlaku.',
  'help.guide.mfa.tip.2': 'Admin bisa mewajibkan 2FA untuk semua orang; 2FA lalu tidak bisa dimatikan di sini.',
  // passkeys
  'help.guide.passkeys.title': 'Masuk dengan passkey',
  'help.guide.passkeys.goal': 'Gunakan sidik jari, wajah, atau PIN perangkat Anda alih-alih kata sandi.',
  'help.guide.passkeys.step.1':
    'Di “Passkey”, klik “Tambah passkey” dan konfirmasi dengan perangkat Anda. Beri nama yang menunjukkan perangkat mana itu.',
  'help.guide.passkeys.step.2':
    'Daftar menampilkan setiap passkey dengan namanya dan kapan terakhir dipakai; tombol hapus menghilangkan satu.',
  'help.guide.passkeys.result': 'Halaman login menawarkan passkey; kata sandi tetap ada sebagai cadangan.',
  'help.guide.passkeys.tip.1':
    'Passkey tersimpan di perangkat atau di pengelola kata sandinya, jadi tambahkan satu per perangkat.',
  'help.guide.passkeys.tip.2':
    'Passkey membutuhkan HTTPS; pada instans HTTP biasa, bagian ini menjelaskan mengapa passkey tidak tersedia.',
  // delete-account
  'help.guide.delete-account.title': 'Menghapus akun Anda',
  'help.guide.delete-account.goal': 'Hapus akun Anda dan data yang hanya milik Anda.',
  'help.guide.delete-account.step.1': 'Di paling bawah “Akun”, klik “Hapus akun” dan konfirmasi.',
  'help.guide.delete-account.result':
    'Akun Anda, perjalanan Anda sendiri, dan journey Anda hilang; perjalanan yang Anda bagikan dengan orang lain tetap ada pada mereka.',
  'help.guide.delete-account.tip.1':
    'Admin terakhir dari sebuah instans tidak bisa menghapus dirinya sendiri; jadikan orang lain admin lebih dulu.',
  'help.guide.delete-account.tip.2': 'Tidak ada pembatalan. Ekspor apa yang ingin Anda simpan sebelum mengonfirmasi.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrasi',
  'help.ctx.admin.summary':
    'Instans di balik TREK semua orang: siapa yang boleh masuk dan bagaimana caranya, apa yang aktif, di mana file disimpan, bagaimana server menghubungi orang, dan bagaimana semuanya dicadangkan. Hanya admin yang melihat halaman ini; setiap tab adalah layar tersendiri di bilah samping.',
  'help.ctx.admin.bullet.1':
    'Empat kartu di atas menghitung pengguna, perjalanan, tempat, dan file; sebuah spanduk di atasnya mengumumkan rilis TREK yang lebih baru.',
  'help.ctx.admin.bullet.2':
    '“Pengguna” dan “Pengaturan Default Pengguna”: akun, tautan undangan, dan pengaturan peta yang menjadi awal sebuah akun baru.',
  'help.ctx.admin.bullet.3':
    '“Personalisasi”, “Pengaturan”, “Addon”, dan “Plugins”: template packing, kategori, dan liburan sekolah; metode masuk dan kunci API; modul fitur; plugin pihak ketiga.',
  'help.ctx.admin.bullet.4':
    '“Penyimpanan”, “Notifikasi”, “Akses MCP”, dan “GitHub”: ke mana unggahan pergi, saluran seluruh instans, token dan sesi klien AI, serta riwayat rilis.',
  'help.ctx.admin.bullet.5':
    '“Backup” dan “Audit”: cadangan sesuai permintaan dan terjadwal, serta log peristiwa yang relevan bagi keamanan.',
  'help.ctx.admin-users.title': 'Pengguna',
  'help.ctx.admin-users.summary':
    'Setiap akun di TREK ini, dengan peran, email, dan login terakhir, serta tautan undangan yang memungkinkan orang mendaftar di instans yang tertutup.',
  'help.ctx.admin-users.bullet.1':
    'Tabel: nama pengguna, email, peran, tanggal pembuatan, login terakhir, dan tindakan per baris. Anda ditandai sebagai diri Anda sendiri.',
  'help.ctx.admin-users.bullet.2':
    '“Buat Pengguna” di atas menambahkan akun secara manual, dengan kata sandi yang Anda serahkan.',
  'help.ctx.admin-users.bullet.3':
    '“Tautan Undangan” di bawah: tautan pendaftaran sekali pakai dengan batas penggunaan, masa berlaku, dan, jika Anda mau, perjalanan yang langsung diikuti pengguna baru saat tiba.',
  'help.ctx.admin-users.bullet.4':
    '“Pengaturan Izin” di bagian bawah: per tindakan, siapa yang boleh melakukannya, “Semua orang”, “Anggota perjalanan”, “Pemilik perjalanan”, atau “Hanya Admin”.',
  'help.ctx.admin-defaults.title': 'Pengaturan Default Pengguna',
  'help.ctx.admin-defaults.summary':
    'Pengaturan awal sebuah akun baru, agar tidak ada yang harus mencari tab peta lebih dulu: penyedia peta, gaya, token, dan kualitas.',
  'help.ctx.admin-defaults.bullet.1':
    'Penyedia peta, gaya dan token Mapbox, kunci CARTO, dan kualitas Mapbox, persis seperti yang diatur pengguna di “Pengaturan”, “Peta”.',
  'help.ctx.admin-defaults.bullet.2':
    '“atur ulang” per bidang mengembalikan pilihan bawaan TREK; pengaturan milik pengguna sendiri selalu menang atas nilai ini.',
  'help.ctx.admin-config.title': 'Personalisasi',
  'help.ctx.admin-config.summary':
    'Apa yang dibagi setiap perjalanan di instans ini: template packing, kumpulan kategori untuk tempat dan koleksi, serta katalog liburan sekolah yang dipakai Vacay.',
  'help.ctx.admin-config.bullet.1':
    '“Template Packing”: daftar bernama berisi kategori dan barang yang bisa menjadi awal daftar packing sebuah perjalanan.',
  'help.ctx.admin-config.bullet.2':
    '“Kategori”: nama, ikon, dan warna kategori yang dipakai di seluruh TREK, dari inspektur tempat hingga Koleksi.',
  'help.ctx.admin-config.bullet.3':
    '“Liburan sekolah”: katalog negara dan wilayah, untuk tempat yang tidak dicakup feed bawaan.',
  'help.ctx.admin-settings.title': 'Pengaturan',
  'help.ctx.admin-settings.summary':
    'Bagaimana orang masuk dan dengan apa server boleh berbicara: metode masuk dan pendaftaran, SSO, passkey, kebijakan dua faktor, kunci API untuk peta, tempat, dan gambar, penyedia pencarian dan transportasi umum, serta jenis file yang boleh diunggah.',
  'help.ctx.admin-settings.bullet.1':
    '“Metode Autentikasi”: “Login dengan Kata Sandi”, “Pendaftaran dengan Kata Sandi”, “Login SSO”, “Penyediaan Otomatis SSO”, dan “Wajibkan autentikasi dua faktor (2FA)”.',
  'help.ctx.admin-settings.bullet.2':
    '“Single Sign-On (OIDC)” dengan issuer, klien, dan nama tampilan; “Login dengan passkey” dengan Relying Party ID dan origin.',
  'help.ctx.admin-settings.bullet.3':
    '“Kunci API”: Google Maps, Unsplash, dan Amap, masing-masing dengan “Uji”; “Kunci ini dipakai untuk apa” membatasi kunci Google pada fitur yang mau Anda bayar.',
  'help.ctx.admin-settings.bullet.4':
    '“Penyedia pencarian tempat” dan “Penyedia transportasi umum” memilih siapa yang menjawab pencarian dan rute; “Jenis File yang Diizinkan” membatasi unggahan.',
  'help.ctx.admin-addons.title': 'Addon',
  'help.ctx.admin-addons.summary':
    'Modul fitur TREK, masing-masing dengan sakelar: Daftar, Biaya, Dokumen, Vacay, Atlas, Collab, Journey, Koleksi, Perjalanan darat, MCP, AirTrail, Dawarich, dan penguraian AI. Nonaktif berarti entri navigasi, rute, dan API-nya hilang bagi semua orang.',
  'help.ctx.admin-addons.bullet.1': 'Satu ubin per addon dengan sakelarnya dan, jika ada, sub-baris untuk opsinya.',
  'help.ctx.admin-addons.bullet.2':
    'Penyedia foto dan penyedia dokumen juga muncul di sini sebagai ubin, sehingga Immich atau Synology bisa ditawarkan kepada pengguna.',
  'help.ctx.admin-addons.bullet.3': '“Pelacak Tas” punya sakelar sendiri di bawah ubin.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Plugin pihak ketiga yang berjalan di proses sendiri di samping TREK, masing-masing dengan izin yang dimintanya saat dipasang. Pasang dari katalog, unggah paket, atau tautkan folder saat sedang mengembangkan satu.',
  'help.ctx.admin-plugins.bullet.1':
    'Daftar: setiap plugin terpasang dengan versi, status, tanda tangan, dan izin yang dipegangnya; aktifkan, nonaktifkan, perbarui, atau copot per baris.',
  'help.ctx.admin-plugins.bullet.2':
    '“Unggah plugin” menerima file paket; “Pindai ulang” mengambil folder plugin yang ditautkan untuk pengembangan.',
  'help.ctx.admin-plugins.bullet.3':
    '“Host yang diizinkan” per plugin: alamat yang boleh dipanggil sebuah plugin, karena akses keluar ditolak secara default.',
  'help.ctx.admin-storage.title': 'Penyimpanan',
  'help.ctx.admin-storage.summary':
    'Tempat unggahan disimpan: disk lokal, bucket S3, atau cermin yang menulis ke keduanya. Setiap kategori unggahan bisa ke backend yang berbeda, dan “Kesehatan” memberi tahu apakah setiap backend menjawab.',
  'help.ctx.admin-storage.bullet.1':
    '“Backend”: nama dan tipe masing-masing, dengan “Uji”, “Sunting”, dan “Hapus”; yang diatur lewat lingkungan hanya bisa dibaca di sini.',
  'help.ctx.admin-storage.bullet.2':
    '“Kategori”: sampul, dokumen, foto journey, dan sisanya, masing-masing ditugaskan ke sebuah backend; mengubah satu menawarkan untuk memindahkan file yang ada.',
  'help.ctx.admin-storage.bullet.3':
    '“Kesehatan”: satu pemeriksaan per backend, dan file benih yang membuktikan bahwa konfigurasinya sama dengan yang dilihat server.',
  'help.ctx.admin-notifications.title': 'Notifikasi',
  'help.ctx.admin-notifications.summary':
    'Saluran yang ditawarkan instans kepada penggunanya, dan saluran yang menjangkau Anda sebagai admin. Pengguna memilih topik dan URL mereka sendiri di “Pengaturan”; Anda menentukan apa yang tersedia dan mengonfigurasi email.',
  'help.ctx.admin-notifications.bullet.1':
    '“In-App”, “Email (SMTP)”, “Ntfy”, “Webhook”, dan “Web Push”: satu panel masing-masing, dengan sakelar yang menawarkan saluran itu kepada pengguna dan konfigurasi sisi server yang dibutuhkannya.',
  'help.ctx.admin-notifications.bullet.2':
    '“Pengingat Perjalanan”: apakah server mengirim pengingat sebelum perjalanan dimulai.',
  'help.ctx.admin-notifications.bullet.3':
    '“Admin Ntfy” dan “Admin Webhook”: ke mana peristiwa admin seperti cadangan yang gagal atau rilis baru dikirim, dengan “Uji”.',
  'help.ctx.admin-mcp-tokens.title': 'Akses MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Setiap token dan sesi OAuth yang dipegang klien AI terhadap TREK ini, di semua pengguna, dengan kewenangan untuk mencabut salah satunya.',
  'help.ctx.admin-mcp-tokens.bullet.1': '“Token API”: siapa yang membuatnya, kapan terakhir dipakai, dan “Hapus”.',
  'help.ctx.admin-mcp-tokens.bullet.2': '“Sesi OAuth”: klien, pengguna, dan cakupan yang diberikan, serta “Cabut”.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Apa yang baru di TREK: riwayat rilis dari GitHub, versi yang Anda jalankan, dan apakah ada versi yang lebih baru. Pembaruan itu sendiri terjadi di luar aplikasi, di host.',
  'help.ctx.admin-github.bullet.1':
    '“Riwayat Rilis” mencantumkan rilis beserta catatannya; yang terbaru membawa “Terbaru”, dan versi Anda ditandai.',
  'help.ctx.admin-github.bullet.2':
    '“Pembaruan tersedia” muncul di header begitu ada rilis yang lebih baru, dengan cara memperbarui untuk Docker dan instalasi lainnya.',
  'help.ctx.admin-backup.title': 'Backup',
  'help.ctx.admin-backup.summary':
    'Cadangan penuh basis data dan unggahan, dibuat secara manual atau terjadwal, disimpan di server dan bisa diunduh sebagai satu file. “Pulihkan” mengembalikan salah satunya.',
  'help.ctx.admin-backup.bullet.1':
    '“Pencadangan Data”: “Buat Cadangan”, dan daftar cadangan yang ada dengan “Unduh”, “Pulihkan”, dan hapus.',
  'help.ctx.admin-backup.bullet.2':
    '“Unggah Cadangan” membawa file yang dibuat di instans lain atau pada hari sebelumnya.',
  'help.ctx.admin-backup.bullet.3':
    '“Cadangan Otomatis”: aktif atau nonaktif, interval, jam dan hari, serta berapa banyak yang disimpan.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Log peristiwa keamanan dan administratif: login dan kegagalannya, perubahan MFA, perubahan pengguna dan pengaturan, pencadangan dan pemulihan. Hanya bisa dibaca, yang terbaru di atas.',
  'help.ctx.admin-audit.bullet.1':
    'Satu baris per peristiwa dengan waktu, pengguna, tindakan, sumber daya, IP, dan detail.',
  'help.ctx.admin-audit.bullet.2': '“Segarkan” memuat ulang; “Muat lebih banyak” menelusuri lebih jauh ke belakang.',
  // create-user
  'help.guide.create-user.title': 'Membuat pengguna',
  'help.guide.create-user.goal': 'Tambahkan akun secara manual, tanpa undangan.',
  'help.guide.create-user.step.1': 'Klik “Buat Pengguna” di bagian atas tab “Pengguna”.',
  'help.guide.create-user.step.2':
    'Masukkan “Nama pengguna”, “Email”, dan “Kata sandi”, lalu pilih “Peran”: “Pengguna” atau “Administrator”.',
  'help.guide.create-user.step.3': 'Klik “Buat Pengguna”.',
  'help.guide.create-user.result':
    'Akun muncul di tabel dan bisa langsung masuk; serahkan kata sandi lewat saluran yang Anda percaya.',
  'help.guide.create-user.tip.1':
    'Untuk orang yang sebaiknya memilih kata sandinya sendiri, tautan undangan adalah jalan masuk yang lebih baik.',
  'help.guide.create-user.tip.2': 'Admin melihat halaman ini dan log audit; selebihnya sama untuk kedua peran.',
  // edit-user
  'help.guide.edit-user.title': 'Mengubah peran atau kata sandi pengguna',
  'help.guide.edit-user.goal':
    'Naikkan atau turunkan peran seseorang, atau bantu mereka masuk lagi setelah kata sandi hilang.',
  'help.guide.edit-user.step.1': 'Klik pensil di baris pengguna. “Edit Pengguna” terbuka dengan detail akun.',
  'help.guide.edit-user.step.2':
    'Ubah “Peran”, atur “Kata Sandi Baru”, atau klik “Reset passkey” jika orang itu kehilangan perangkat tempat passkey-nya berada, lalu “Simpan”.',
  'help.guide.edit-user.result':
    'Perubahan berlaku pada permintaan berikutnya; kata sandi baru berfungsi mulai login berikutnya.',
  'help.guide.edit-user.tip.1': 'Anda tidak bisa mencabut peran admin dari diri sendiri selama Anda admin terakhir.',
  'help.guide.edit-user.tip.2':
    'Mereset passkey tidak mengubah kata sandi; orang itu menambahkan passkey baru di “Pengaturan”, “Akun”.',
  // invite-links
  'help.guide.invite-links.title': 'Mengundang seseorang dengan tautan',
  'help.guide.invite-links.goal':
    'Biarkan seseorang mendaftar di instans yang tertutup, dan langsung masuk ke sebuah perjalanan jika Anda mau.',
  'help.guide.invite-links.step.1': 'Di bawah “Tautan Undangan”, klik “Buat Tautan”.',
  'help.guide.invite-links.step.2':
    'Atur “Maks. Penggunaan” dan “Kedaluwarsa setelah”, jika perlu “Tambahkan ke perjalanan (opsional)”, lalu klik “Buat & Salin”.',
  'help.guide.invite-links.step.3':
    'Kirim tautannya. Setiap baris menunjukkan berapa kali tautan dipakai dan siapa yang membuatnya; “Salin tautan” menyalinnya lagi, dan tautan yang habis dipakai atau kedaluwarsa ditandai.',
  'help.guide.invite-links.result':
    'Siapa pun yang membuka tautan mendaftar dengan kata sandinya sendiri dan, jika ada perjalanan yang dipilih, langsung bergabung.',
  'help.guide.invite-links.tip.1':
    'Tautan undangan tetap berfungsi meski “Pendaftaran dengan Kata Sandi” dinonaktifkan di “Pengaturan”.',
  'help.guide.invite-links.tip.2':
    'Tautan dengan satu kali pakai dan masa berlaku singkat adalah default paling aman untuk satu orang.',
  // delete-user
  'help.guide.delete-user.title': 'Menghapus pengguna',
  'help.guide.delete-user.goal': 'Hapus sebuah akun dan semua yang hanya dimilikinya.',
  'help.guide.delete-user.step.1': 'Klik ikon tempat sampah di baris pengguna dan konfirmasi “Hapus pengguna”.',
  'help.guide.delete-user.result':
    'Akun, perjalanan miliknya sendiri, dan journey-nya hilang; perjalanan yang dibagikan dengan orang lain tetap ada pada anggota yang tersisa.',
  'help.guide.delete-user.tip.1': 'Tidak ada pembatalan. Buat cadangan dulu jika Anda tidak yakin.',
  'help.guide.delete-user.tip.2': 'Admin terakhir tidak bisa dihapus; jadikan orang lain admin lebih dulu.',
  // permissions
  'help.guide.permissions.title': 'Menentukan siapa boleh melakukan apa',
  'help.guide.permissions.goal': 'Tetapkan, per tindakan, peran mana yang boleh melakukannya di TREK ini.',
  'help.guide.permissions.step.1':
    'Di bawah “Pengaturan Izin”, cari tindakan di grupnya, misalnya “Hapus perjalanan” di bawah “Manajemen Perjalanan”, lalu pilih tingkatnya: “Semua orang”, “Anggota perjalanan”, “Pemilik perjalanan”, atau “Hanya Admin”. Baris yang diubah ditandai “dikustomisasi”.',
  'help.guide.permissions.step.2':
    'Klik “Simpan”. “Kembalikan ke default” mengembalikan setiap baris ke tingkat bawaan.',
  'help.guide.permissions.result':
    'Aturan berlaku untuk semua perjalanan sekaligus; tombol dan menu orang di bawah tingkat itu menghilang.',
  'help.guide.permissions.tip.1':
    '“Pemilik perjalanan” berarti orang yang membuat perjalanan; admin selalu boleh melakukan segalanya.',
  'help.guide.permissions.tip.2':
    'Turunkan tingkatnya alih-alih menghapus anggota: anggota yang tidak boleh mengedit masih bisa membaca dan berkomentar.',
  // default-map
  'help.guide.default-map.title': 'Mengatur default peta untuk pengguna baru',
  'help.guide.default-map.goal': 'Beri setiap akun baru peta yang berfungsi tanpa token pribadi.',
  'help.guide.default-map.step.1':
    'Di bawah “Peta”, pilih “Mesin peta” dan, untuk Mapbox atau MapLibre, “Gaya peta”, “Token Mapbox bersama”, dan “Mode kualitas tinggi”; untuk peta raster, “Template Peta” dan “Kunci CARTO bersama”.',
  'help.guide.default-map.step.2':
    'Di samping bidang mana pun yang Anda ubah, “atur ulang” mengembalikan pilihan bawaan TREK. “Pengaturan Default Pengguna” di kiri melakukan hal yang sama untuk “Mode Warna”, satuan, dan mata uang.',
  'help.guide.default-map.result':
    'Akun baru memulai dengan pengaturan ini; siapa pun yang mengatur petanya sendiri di “Pengaturan” tetap memakai miliknya.',
  'help.guide.default-map.tip.1':
    'Token yang dimasukkan di sini dipakai bersama oleh semua orang yang tidak punya token sendiri, jadi perhatikan kuotanya.',
  'help.guide.default-map.tip.2': 'Akun lama yang tidak pernah menyentuh tab peta juga mengikuti default ini.',
  // packing-templates
  'help.guide.packing-templates.title': 'Membuat template packing',
  'help.guide.packing-templates.goal': 'Beri perjalanan daftar packing sebagai titik awal, bukan daftar kosong.',
  'help.guide.packing-templates.step.1': 'Klik “Template Baru”, ketik nama, dan konfirmasi dengan tanda centang.',
  'help.guide.packing-templates.step.2':
    'Buka template dan klik “Tambah kategori”; di bawah setiap kategori, tanda + menambahkan barang, dan sebuah barang hanya butuh nama.',
  'help.guide.packing-templates.step.3':
    'Semuanya tersimpan seketika. Pensil mengganti nama template, kategori, atau barang, tempat sampah menghapusnya.',
  'help.guide.packing-templates.result':
    'Template ditawarkan di daftar packing setiap perjalanan; menerapkannya menyalin barang-barangnya, sehingga perjalanan bisa mengubahnya dengan bebas.',
  'help.guide.packing-templates.tip.1':
    'Satu template per jenis perjalanan, pantai, kota, pendakian, lebih baik daripada satu daftar raksasa.',
  'help.guide.packing-templates.tip.2': 'Menghapus template tidak memengaruhi perjalanan yang sudah menerapkannya.',
  'help.guide.packing-templates.tip.3':
    'Template mengingat berat, jumlah, dan tas setiap barang, sehingga perjalanan yang menerapkannya mendapat tas yang terisi dengan cara yang sama.',
  // categories
  'help.guide.categories.title': 'Mengelola kumpulan kategori',
  'help.guide.categories.goal':
    'Tentukan kategori mana yang bisa dimiliki tempat dan koleksi, dan seperti apa tampilannya.',
  'help.guide.categories.step.1':
    'Klik “Kategori Baru”, beri nama, pilih ikon dan warna; “Pratinjau” menunjukkan hasilnya. Klik “Buat”.',
  'help.guide.categories.step.2':
    'Arahkan kursor ke sebuah kategori di daftar untuk menyunting atau menghapusnya. Menghapus meminta konfirmasi.',
  'help.guide.categories.result':
    'Kumpulan ini berlaku di mana-mana sekaligus: inspektur tempat, pin peta, Koleksi, dan filter.',
  'help.guide.categories.tip.1':
    'Tempat menyimpan id kategorinya, jadi mengganti nama kategori mengganti namanya di setiap tempat.',
  'help.guide.categories.tip.2':
    'Kategori yang dihapus meninggalkan tempat-tempatnya tanpa kategori; tugaskan ulang dulu jika itu penting.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Mengelola liburan sekolah secara manual',
  'help.guide.school-holiday-catalog.goal': 'Lengkapi negara atau wilayah yang tidak dicakup feed liburan bawaan.',
  'help.guide.school-holiday-catalog.step.1':
    'Di bawah “Liburan sekolah”, klik “Tambah negara”, masukkan “Negara” dan “Kode negara (mis. US)”, lalu “Simpan”; kemudian “Tambah wilayah” untuk setiap bagiannya yang berbeda.',
  'help.guide.school-holiday-catalog.step.2':
    'Klik sebuah wilayah untuk membuka “Wilayah atau distrik sekolah”: “Tambah periode liburan”, beri masing-masing “Nama liburan”, “Tanggal mulai”, dan “Tanggal selesai”, lalu “Simpan”. Tempat sampah menghapus sebuah periode, sebuah wilayah, atau, begitu tidak ada wilayah tersisa, sebuah negara.',
  'help.guide.school-holiday-catalog.result':
    'Pengguna menemukan negara dan wilayah itu di “Pengaturan” Vacay dan melihat periodenya di kisi tahunan mereka.',
  'help.guide.school-holiday-catalog.tip.1':
    'Wilayah dari feed bawaan tidak bisa disunting di sini; tambahkan wilayah manual di sampingnya jika ada tanggal yang salah.',
  // auth-methods
  'help.guide.auth-methods.title': 'Menentukan cara orang masuk',
  'help.guide.auth-methods.goal': 'Buka atau tutup login dengan kata sandi, SSO, dan pendaftaran, serta wajibkan 2FA.',
  'help.guide.auth-methods.step.1':
    'Di bawah “Metode Autentikasi”, aktifkan atau nonaktifkan “Login dengan Kata Sandi” dan “Pendaftaran dengan Kata Sandi”. Pendaftaran nonaktif berarti akun baru hanya lewat tautan undangan, SSO, atau secara manual.',
  'help.guide.auth-methods.step.2':
    '“Login SSO” dan “Penyediaan Otomatis SSO” membutuhkan “Single Sign-On (OIDC)” yang dikonfigurasi di bawah; penyediaan otomatis membuat akun saat seseorang pertama kali masuk lewat SSO.',
  'help.guide.auth-methods.step.3':
    '“Wajibkan autentikasi dua faktor (2FA)” membuat setiap login dengan kata sandi harus menyiapkan aplikasi autentikator pada login berikutnya. “Login dengan passkey” membutuhkan Relying Party ID dan origin tempat TREK Anda diakses.',
  'help.guide.auth-methods.result': 'Halaman masuk menawarkan persis metode yang Anda biarkan aktif.',
  'help.guide.auth-methods.tip.1':
    'Sebuah peringatan muncul sebelum Anda mengunci diri sendiri: setidaknya satu jalan masuk untuk admin tetap aktif.',
  'help.guide.auth-methods.tip.2': 'Nilai yang diatur lewat variabel lingkungan tampil hanya-baca di sini.',
  // oidc
  'help.guide.oidc.title': 'Menghubungkan single sign-on',
  'help.guide.oidc.goal': 'Biarkan orang masuk dengan penyedia identitas Anda.',
  'help.guide.oidc.step.1':
    'Di bawah “Single Sign-On (OIDC)”, masukkan “Nama Tampilan” untuk tombolnya serta “Issuer URL”, “Client ID”, dan “Client Secret” dari penyedia Anda, lalu “Simpan”.',
  'help.guide.oidc.step.2': 'Aktifkan “Login SSO” di bawah “Metode Autentikasi”.',
  'help.guide.oidc.result':
    'Halaman masuk menampilkan tombol SSO; dengan “Penyediaan Otomatis SSO” aktif, pengguna yang baru pertama kali masuk mendapat akun secara otomatis.',
  'help.guide.oidc.tip.1':
    'URI pengalihan yang dibutuhkan penyedia Anda adalah alamat TREK Anda ditambah jalur callback OIDC dari dokumentasi.',
  'help.guide.oidc.tip.2':
    'Pemetaan klaim menentukan grup SSO mana yang menjadi admin; lihat halaman OIDC di dokumentasi.',
  // instance-keys
  'help.guide.instance-keys.title': 'Memasukkan kunci API',
  'help.guide.instance-keys.goal': 'Aktifkan pencarian tempat Google, sampul Unsplash, dan Amap untuk seluruh instans.',
  'help.guide.instance-keys.step.1':
    'Di bawah “Kunci API”, tempel “Kunci API Google Maps” dan klik “Uji”; bidangnya memberi tahu apakah kunci itu menjawab.',
  'help.guide.instance-keys.step.2':
    'Di bawah “Kunci ini dipakai untuk apa”, aktifkan hanya fitur yang mau Anda tagihkan ke kunci itu: pelengkapan otomatis, detail, foto, pengayaan, log pencarian tempat.',
  'help.guide.instance-keys.step.3':
    '“Kunci API Unsplash” menggerakkan pencarian sampul; “Kunci API Amap (高德地图)” pencarian tempat di Tiongkok. Uji masing-masing dengan cara yang sama.',
  'help.guide.instance-keys.result':
    'Pengguna mendapat fitur-fitur itu tanpa kunci sendiri; tanpa kunci Google, TREK mencari lewat tumpukan OpenStreetMap yang gratis dan TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'Kunci pribadi seorang pengguna di “Pengaturan” menang atas kunci instans bagi pengguna itu.',
  'help.guide.instance-keys.tip.2':
    'Kunci juga bisa berasal dari variabel lingkungan; yang seperti itu tampil hanya-baca di sini.',
  'help.guide.instance-keys.tip.3':
    '“Batas harian panggilan Google” membatasi berapa banyak yang boleh dihabiskan TREK untuk kunci itu per hari; lencana di samping judul menghitung panggilan hari ini. Setelah batas tercapai, pencarian memakai OpenStreetMap sampai hari berikutnya (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Memilih penyedia pencarian dan transportasi umum',
  'help.guide.places-transit.goal': 'Tentukan siapa yang menjawab pencarian tempat dan rute transportasi umum.',
  'help.guide.places-transit.step.1':
    'Di bawah “Penyedia pencarian tempat”, pilih “Otomatis”, “Google Places”, “Amap (高德地图)”, atau “OpenStreetMap”. “Otomatis” memakai kunci terbaik yang ada.',
  'help.guide.places-transit.step.2':
    'Di bawah “Penyedia transportasi umum”, pilih “Transitous (gratis)”, mencakup seluruh dunia dan tanpa kunci, atau “Google”, yang membutuhkan kunci Google.',
  'help.guide.places-transit.result':
    'Setiap kotak pencarian dan setiap rute transportasi umum di TREK mengikuti pilihan ini.',
  'help.guide.places-transit.tip.1':
    'Penyedia tanpa kuncinya menampilkan peringatan di sini dan kembali ke OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Rute transportasi umum Google ditagih per permintaan; Transitous tidak.',
  // file-types
  'help.guide.file-types.title': 'Membatasi jenis file',
  'help.guide.file-types.goal': 'Tentukan ekstensi file mana yang boleh diunggah.',
  'help.guide.file-types.step.1':
    'Di bawah “Jenis File yang Diizinkan”, sunting daftar ekstensi yang dipisahkan koma dan simpan.',
  'help.guide.file-types.result':
    'Unggahan jenis lain ditolak dengan pesan yang jelas, di dokumen, jurnal, dan sampul.',
  'help.guide.file-types.tip.1':
    'Pertahankan jenis gambar di daftar; sampul dan foto journey melewati pemeriksaan yang sama.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Mengaktifkan atau menonaktifkan addon',
  'help.guide.toggle-addon.goal': 'Tawarkan sebuah modul fitur kepada semua orang, atau tarik kembali.',
  'help.guide.toggle-addon.step.1':
    'Geser sakelar di ubin addon. Entri navigasinya muncul atau hilang bagi semua orang sekaligus.',
  'help.guide.toggle-addon.step.2':
    'Beberapa ubin membawa sub-baris untuk opsinya, seperti “Pelacak Tas” di bawah “Daftar” atau penyedia foto di bawah “Journey”; sub-baris hanya tampil selama addon aktif.',
  'help.guide.toggle-addon.result':
    'Data addon yang dinonaktifkan tetap tersimpan; mengaktifkannya kembali menampilkannya lagi.',
  'help.guide.toggle-addon.tip.1': 'MCP nonaktif menghapus endpoint dan bagian “Integrasi” yang bergantung padanya.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas, dan Journey adalah addon yang paling sering diminta pengguna; Dokumen membutuhkan penyimpanan untuk unggahan.',
  // install-plugin
  'help.guide.install-plugin.title': 'Memasang plugin',
  'help.guide.install-plugin.goal': 'Tambahkan plugin pihak ketiga dan beri persis izin yang dimintanya.',
  'help.guide.install-plugin.step.1':
    'Buka “Jelajahi”, pilih plugin dan klik “Pasang”; atau klik “Unggah plugin” dan pilih paket .zip atau .tar.gz.',
  'help.guide.install-plugin.step.2':
    'Kembali ke “Terpasang”, baca barisnya: apa yang boleh dibaca atau ditulis plugin, host yang dipanggilnya, dan apakah ia ditandatangani. Aktifkan “Aktifkan plugin”.',
  'help.guide.install-plugin.step.3':
    'Menu baris menawarkan “Mulai ulang”, “Lihat log error”, “Host yang diizinkan”, dan “Ubah versi…”; “Hapus” mencopotnya. Pembaruan ditawarkan di baris saat ada versi yang lebih baru, dan yang meminta hak baru tetap nonaktif sampai Anda menyetujuinya.',
  'help.guide.install-plugin.result':
    'Plugin berjalan di prosesnya sendiri; apa yang ditambahkannya, widget, lapisan peta, alat, muncul di tempat yang dideklarasikan plugin.',
  'help.guide.install-plugin.tip.1':
    '“Pindai ulang” mengambil folder plugin yang ditautkan untuk pengembangan tanpa paket.',
  'help.guide.install-plugin.tip.2':
    'Plugin tanpa tanda tangan ditandai demikian; pasang hanya jika Anda memercayai sumbernya.',
  // storage-backends
  'help.guide.storage-backends.title': 'Memindahkan unggahan ke S3 atau cermin',
  'help.guide.storage-backends.goal': 'Simpan file di penyimpanan objek, atau di disk dan bucket sekaligus.',
  'help.guide.storage-backends.step.1':
    'Di bawah “Backend”, klik “Tambah backend”, beri “Nama”, pilih “Tipe”, “Lokal”, “S3”, atau “Cermin”, isi bidangnya dan “Terapkan”. “Uji” memeriksa koneksi, “Simpan perubahan” menuliskannya.',
  'help.guide.storage-backends.step.2':
    'Di bawah “Kategori”, tugaskan setiap kategori unggahan ke sebuah backend. Mengubah satu menanyakan apakah “Pindahkan objek yang ada” atau “Hanya arahkan penulisan baru”.',
  'help.guide.storage-backends.step.3':
    '“Kesehatan” di atas memeriksa setiap backend; entri merah menyebutkan apa yang gagal.',
  'help.guide.storage-backends.result':
    'Unggahan baru masuk ke backend yang ditugaskan; file yang dipindahkan disajikan dari sana.',
  'help.guide.storage-backends.tip.1':
    'Backend yang dikonfigurasi lewat variabel lingkungan ditampilkan tetapi tidak bisa disunting di sini.',
  'help.guide.storage-backends.tip.2':
    'Cermin menulis ke kedua target dan membaca dari yang pertama; gunakan untuk migrasi tanpa waktu henti.',
  // channels-instance
  'help.guide.channels-instance.title': 'Mengonfigurasi saluran notifikasi',
  'help.guide.channels-instance.goal': 'Tentukan saluran mana yang boleh dipilih pengguna, dan siapkan email.',
  'help.guide.channels-instance.step.1':
    'Di bawah “Email (SMTP)”, masukkan SMTP Host, SMTP Port, SMTP User, SMTP Password, dan From Address; “Kirim email uji” mengirim surat kepada Anda.',
  'help.guide.channels-instance.step.2':
    'Aktifkan “Web Push”, “Ntfy” dan “Webhook” untuk menawarkannya; pengguna lalu mengaktifkan push per perangkat, atau memasukkan topik atau URL mereka sendiri, di “Pengaturan”, “Notifikasi”.',
  'help.guide.channels-instance.step.3':
    '“Pengingat Perjalanan” mengatur pengingat sebelum perjalanan dimulai; “In-App” selalu aktif dan di sini hanya dijelaskan.',
  'help.guide.channels-instance.result': 'Tab “Notifikasi” setiap pengguna menampilkan saluran yang Anda aktifkan.',
  'help.guide.channels-instance.tip.1':
    'Server ntfy default yang dimasukkan di sini diisi otomatis untuk pengguna; mereka tetap bisa menyebutkan server mereka sendiri.',
  'help.guide.channels-instance.tip.2':
    'Saluran plugin muncul dengan sendirinya begitu plugin dengan kemampuan itu aktif.',
  // admin-channels
  'help.guide.admin-channels.title': 'Menerima peristiwa admin di ponsel Anda',
  'help.guide.admin-channels.goal':
    'Dapatkan kabar tentang cadangan yang gagal, rilis baru, dan peristiwa instans lainnya.',
  'help.guide.admin-channels.step.1':
    'Di bawah “Admin Ntfy”, masukkan topik dan, jika perlu, server dan token; di bawah “Admin Webhook” sebuah URL.',
  'help.guide.admin-channels.step.2': 'Klik “Kirim uji Ntfy” atau “Kirim test webhook” untuk melihat pesan tiba.',
  'help.guide.admin-channels.result':
    'Peristiwa admin dikirim ke sana, di samping lonceng dalam aplikasi setiap admin.',
  'help.guide.admin-channels.tip.1':
    'Pisahkan topik admin dari topik pribadi Anda, agar sebuah gangguan tidak tenggelam di antara obrolan perjalanan.',
  'help.guide.admin-channels.tip.2':
    '“Bawaan untuk pengguna” menentukan keadaan awal notifikasi setiap pengguna, per peristiwa dan saluran: “Nyala”, “Mati”, atau “Diblokir”, yang mematikannya untuk semua orang dan tampil terkunci di pengaturan mereka.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Mencabut akses AI',
  'help.guide.mcp-tokens-admin.goal':
    'Lihat dan putus setiap token dan sesi yang dipegang klien AI, untuk pengguna mana pun.',
  'help.guide.mcp-tokens-admin.step.1':
    'Di bawah “Token API”, temukan token berdasarkan pengguna dan nama; tempat sampah menghapusnya dan klien berhenti seketika.',
  'help.guide.mcp-tokens-admin.step.2':
    'Di bawah “Sesi OAuth”, hal yang sama untuk klien berbasis browser: klien, pengguna, dan tanggal, dan tempat sampah mencabut sesinya.',
  'help.guide.mcp-tokens-admin.result':
    'Klien harus dihubungkan lagi oleh penggunanya; tidak ada hal lain yang berubah.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Cakupan memberi tahu Anda apa yang bisa dilakukan klien; cakupan hanya-baca tidak berbahaya jika dibiarkan.',
  'help.guide.mcp-tokens-admin.tip.2': 'Menonaktifkan addon MCP mencabut semuanya sekaligus.',
  // release-history
  'help.guide.release-history.title': 'Memeriksa rilis baru',
  'help.guide.release-history.goal': 'Ketahui apakah TREK Anda mutakhir dan apa yang dibawa versi berikutnya.',
  'help.guide.release-history.step.1':
    'Saat ada rilis yang lebih baru, “Pembaruan tersedia” tampil di bagian atas halaman admin; “Lihat di GitHub” membukanya, dan “Cara Memperbarui” menjelaskan pembaruan untuk Docker dan instalasi lainnya.',
  'help.guide.release-history.step.2':
    '“Riwayat Rilis” mencantumkan setiap rilis beserta catatannya; “Tampilkan detail” membentangkannya, yang terbaru membawa “Terbaru”, dan “Muat lebih banyak” menelusuri lebih jauh ke belakang.',
  'help.guide.release-history.result':
    'Pembaruan terjadi di host, dengan menarik image baru atau membangun tag baru; direktori data tetap ada.',
  'help.guide.release-history.tip.1': 'Buat cadangan sebelum memperbarui; tab “Backup” ada di sebelah.',
  'help.guide.release-history.tip.2':
    'Pra-rilis ditampilkan tetapi tidak diumumkan sebagai pembaruan kecuali Anda menjalankan salah satunya.',
  // create-backup
  'help.guide.create-backup.title': 'Membuat dan memulihkan cadangan',
  'help.guide.create-backup.goal':
    'Ambil potret seluruh instans, simpan salinannya di tempat lain, dan pastikan bisa dikembalikan.',
  'help.guide.create-backup.step.1':
    'Di bawah “Pencadangan Data”, klik “Buat Cadangan”. Basis data dan unggahan dikemas menjadi satu file di server.',
  'help.guide.create-backup.step.2':
    '“Unduh” menyimpan salinan di luar mesin ini; tempat sampah menghapus yang lama untuk membebaskan ruang.',
  'help.guide.create-backup.step.3':
    '“Pulihkan” pada sebuah cadangan, atau “Unggah Cadangan” dengan sebuah file, menggantikan data saat ini setelah “Pulihkan Cadangan?” bertanya sekali.',
  'help.guide.create-backup.result':
    'Pemulihan mengembalikan pengguna, perjalanan, file, dan pengaturan seperti pada cadangan itu; semua orang dikeluarkan dari sesi.',
  'help.guide.create-backup.tip.1':
    'Memulihkan adalah satu-satunya tindakan di sini yang tidak bisa dibatalkan. Buat cadangan baru lebih dulu.',
  'help.guide.create-backup.tip.2':
    'Cadangan tersimpan di direktori data; salinan di mesin lain yang menjadikannya cadangan sungguhan.',
  // auto-backup
  'help.guide.auto-backup.title': 'Menjadwalkan cadangan',
  'help.guide.auto-backup.goal':
    'Biarkan server mencadangkan dirinya sendiri dan hanya menyimpan beberapa yang terakhir.',
  'help.guide.auto-backup.step.1':
    'Di bawah “Cadangan Otomatis”, aktifkan “Aktifkan cadangan otomatis” dan pilih “Interval”, “Jalankan pada jam”, dan, untuk mingguan atau bulanan, “Hari dalam seminggu” atau “Tanggal dalam sebulan”.',
  'help.guide.auto-backup.step.2':
    '“Hapus cadangan lama setelah” mengatur berapa lama sebuah cadangan disimpan; yang lebih lama dihapus saat cadangan baru dibuat.',
  'help.guide.auto-backup.result': 'Cadangan muncul di daftar sesuai jadwal; kegagalan disampaikan ke saluran admin.',
  'help.guide.auto-backup.tip.1': 'Waktu mengikuti zona waktu server, yang ditampilkan di tab “Audit”.',
  'help.guide.auto-backup.tip.2': 'Penyimpanan di server terbatas; menyimpan tiga sampai lima biasanya cukup.',
  // audit-log
  'help.guide.audit-log.title': 'Membaca log audit',
  'help.guide.audit-log.goal': 'Cari tahu siapa melakukan apa, dan kapan.',
  'help.guide.audit-log.step.1':
    'Baca barisnya: waktu, pengguna, tindakan, sumber daya, IP, dan detail, yang terbaru di atas. Tindakan dinamai menurut apa yang terjadi, seperti kegagalan login, perubahan MFA, atau pemulihan.',
  'help.guide.audit-log.step.2':
    '“Segarkan” memuat ulang bagian atas; “Muat lebih banyak” menelusuri lebih jauh ke belakang.',
  'help.guide.audit-log.result':
    'Jejak yang bisa Anda serahkan kepada siapa pun yang bertanya mengapa sesuatu berubah.',
  'help.guide.audit-log.tip.1': 'Waktu ditampilkan dalam zona waktu server, yang disebutkan di atas tabel.',
  'help.guide.audit-log.tip.2': 'Log hanya bisa ditambah; tidak ada yang bisa disunting atau dihapus dari aplikasi.',
  // document-providers
  'help.guide.document-providers.title': 'Menawarkan penyimpanan dokumen',
  'help.guide.document-providers.goal':
    'Tentukan penyimpanan mana yang boleh dipakai sebuah perjalanan untuk menjaga dokumennya tetap sejalan.',
  'help.guide.document-providers.step.1':
    'Ubin “Dokumen” membawa penyimpanan-penyimpanan itu sebagai baris di raknya: Paperless-ngx, Papra, Nextcloud, OpenCloud dan Synology Drive. Kelimanya mulai dalam keadaan mati, dan rak itu hanya ada selama “Dokumen” sendiri menyala.',
  'help.guide.document-providers.step.2':
    'Geser sakelar pada baris Nextcloud. Pesannya berbunyi “Addon diperbarui”, dan sejak itu pemilik perjalanan menemukan “Sinkronisasi dokumen” di tab “File” perjalanan mereka, dengan Nextcloud di bawah “Hubungkan penyedia”.',
  'help.guide.document-providers.result':
    'Penyimpanan itu ditawarkan pada setiap perjalanan di TREK ini; tidak ada yang terhubung sampai seorang pemilik perjalanan melakukannya.',
  'help.guide.document-providers.tip.1':
    'Yang ditentukan di sini hanyalah apakah sebuah penyimpanan boleh ditawarkan. Alamat dan kredensialnya milik sebuah perjalanan dan dimasukkan di tab “File”-nya oleh pemilik perjalanan itu, tidak pernah di panel admin.',
  'help.guide.document-providers.tip.2':
    'Mematikan “Dokumen” mematikan setiap penyimpanan bersamanya, dan sebuah penyimpanan tidak dapat dinyalakan selama “Dokumen” mati: server menjawab “Enable the Documents addon first”. Penyimpanan di jaringan Anda sendiri juga membutuhkan ALLOW_INTERNAL_NETWORK=true di server.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Perjalanan',
  'help.ctx.trip.summary':
    'Satu perjalanan, seluruhnya: rencana dengan hari-harinya, peta dan tempat, serta tab untuk transportasi, pemesanan, daftar, biaya, file, dan kolaborasi. Masing-masing punya layar bantuan sendiri di bawah layar ini.',
  'help.ctx.trip.bullet.1':
    'Bilah tab: “Rencana”, “Transportasi”, “Pesan”, “Daftar”, “Biaya”, “File”, dan “Collab”. Addon dan plugin menentukan tab mana yang ada di TREK Anda.',
  'help.ctx.trip.bullet.2':
    '“Rencana” terdiri dari tiga kolom: hari di kiri, peta di tengah, tempat di kanan. Pemesanan dan transportasi hidup di dalam rencana, pada perhentian dan di antara perhentian; tab-tab itu mendaftarnya.',
  'help.ctx.trip.bullet.3':
    '“Bagikan” di kanan atas membuka orang-orang dalam perjalanan: anggota, tamu, tautan undangan, dan tautan publik hanya-baca.',
  'help.ctx.trip.bullet.4':
    'Judul, tanggal, sampul, dan mata uang disunting dari “Perjalananku”, dengan ikon pensil di kartu perjalanan.',
  'help.ctx.trip.bullet.5':
    'Tab di tepi dalam sebuah kolom melipatnya dan peta mengambil ruangnya; pembatas tipis di sebelah kolom mengubah lebarnya.',
  'help.ctx.trip.bullet.6': 'Panah batalkan di bilah alat hari mengembalikan perubahan terakhir pada rencana.',
  // add-member
  'help.guide.add-member.title': 'Menambahkan anggota',
  'help.guide.add-member.goal': 'Beri seseorang yang punya akun TREK akses ke perjalanan ini.',
  'help.guide.add-member.step.1': 'Klik “Bagikan” di kanan atas.',
  'help.guide.add-member.step.2': 'Di bawah “Undang Pengguna”, pilih orangnya dari daftar dan klik “Undang”.',
  'help.guide.add-member.step.3':
    'Orang itu kini muncul di bawah “Akses”. Mahkota menandai pemilik; ikon di ujung baris menghapus akses lagi.',
  'help.guide.add-member.result':
    'Anggota melihat dan menyunting perjalanan seperti Anda, dalam batas tingkat yang ditetapkan admin di bawah “Pengaturan Izin”.',
  'help.guide.add-member.tip.1':
    'Seseorang yang tidak ada di daftar belum punya akun TREK: tambahkan sebagai tamu, atau biarkan mereka mendaftar lewat tautan undangan.',
  'help.guide.add-member.tip.2':
    'Angka di sebelah “Akses” menghitung orang dalam perjalanan; tamu didaftar terpisah di bawahnya.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Mengundang lewat tautan',
  'help.guide.trip-invite-link.goal': 'Biarkan orang bergabung ke perjalanan sendiri.',
  'help.guide.trip-invite-link.step.1':
    'Klik “Bagikan”, lalu di bawah “Tautan undangan perjalanan” klik “Buat tautan undangan”.',
  'help.guide.trip-invite-link.step.2':
    'Klik “Salin” dan kirim tautannya. Siapa pun yang punya akun TREK dan membukanya bergabung sebagai anggota.',
  'help.guide.trip-invite-link.step.3':
    '“Buat ulang” mengganti tautan dan membuat yang lama tidak berguna; “Nonaktifkan” mematikannya.',
  'help.guide.trip-invite-link.result':
    'Siapa pun yang membuka tautan masuk ke perjalanan dan muncul di bawah “Akses”.',
  'help.guide.trip-invite-link.tip.1':
    'Orang tanpa akun tidak bisa memakainya. Admin membagikan tautan pendaftaran di bawah “Administrasi”, “Pengguna”, dan bisa mengaitkan satu tautan ke perjalanan ini.',
  'help.guide.trip-invite-link.tip.2':
    'Buat ulang ketika tautan terkirim ke chat yang salah: yang lama langsung berhenti bekerja.',
  // add-guest
  'help.guide.add-guest.title': 'Menambahkan tamu tanpa akun',
  'help.guide.add-guest.goal': 'Ikutkan seseorang yang tidak memakai TREK.',
  'help.guide.add-guest.step.1': 'Klik “Bagikan” dan gulir ke “Tamu”.',
  'help.guide.add-guest.step.2': 'Ketik namanya di “Nama tamu” dan klik “Tambah tamu”.',
  'help.guide.add-guest.result': 'Tamu bisa ditugaskan ke biaya, barang bawaan, dan tugas, tetapi tidak bisa masuk.',
  'help.guide.add-guest.tip.1':
    'Pensil mengganti nama tamu; ikon di ujung baris menghapusnya beserta bagian dan penugasannya.',
  'help.guide.add-guest.tip.2': 'Jika orang itu nanti punya akun, undang sebagai anggota dan hapus tamunya.',
  // public-link
  'help.guide.public-link.title': 'Menerbitkan tautan hanya-baca',
  'help.guide.public-link.goal': 'Tunjukkan perjalanan kepada orang yang tidak boleh menyuntingnya.',
  'help.guide.public-link.step.1':
    'Klik “Bagikan”; di kanan, di bawah “Tautan Publik”, centang apa yang boleh ditampilkan tautan. “Peta & Rencana” selalu aktif; “Pemesanan”, “Bawaan”, “Biaya”, dan “Chat” terserah Anda.',
  'help.guide.public-link.step.2': 'Klik “Buat tautan”, lalu “Salin”.',
  'help.guide.public-link.step.3': 'Centangnya bisa diubah selama tautan ada; “Hapus tautan” menghentikannya.',
  'help.guide.public-link.result':
    'Siapa pun yang punya tautan melihat bagian yang dipilih tanpa masuk dan tidak bisa mengubah apa pun.',
  'help.guide.public-link.tip.1':
    'Tautan ini tidak terdaftar di mana pun; siapa pun yang memegangnya bisa membukanya, jadi perlakukan seperti kata sandi.',
  'help.guide.public-link.tip.2': 'Untuk hak menyunting, tambahkan orang itu sebagai anggota saja.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Menyerahkan perjalanan atau keluar darinya',
  'help.guide.transfer-ownership.goal':
    'Jadikan orang lain pemilik, atau keluar dari perjalanan yang bukan milik Anda.',
  'help.guide.transfer-ownership.step.1':
    'Klik “Bagikan”. Di bawah “Akses”, mahkota di baris seorang anggota menjadikan orang itu pemilik; konfirmasi pertanyaannya.',
  'help.guide.transfer-ownership.step.2':
    '“Keluar dari perjalanan” di baris Anda sendiri mengeluarkan Anda dari perjalanan; sebagai pemilik, serahkan dulu.',
  'help.guide.transfer-ownership.result':
    'Pemilik baru mengelola anggota dan bisa menghapus perjalanan; Anda tetap anggota biasa.',
  'help.guide.transfer-ownership.tip.1':
    'Pemilik adalah siapa pun yang membuat perjalanan sampai diserahkan; menghapus perjalanan hanya bisa dilakukan olehnya.',
  'help.guide.transfer-ownership.tip.2':
    '“Hapus akses” di baris orang lain adalah tombol yang sama dari arah sebaliknya: pemilik mengeluarkan seorang anggota.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Memberi ruang untuk peta',
  'help.guide.collapse-columns.goal': 'Lipat sebuah kolom atau beri lebar lebih.',
  'help.guide.collapse-columns.step.1':
    'Klik tab di tepi dalam kolom hari, yang berikon panel, untuk melipat kolom itu; peta mengambil ruangnya. Kolom tempat punya tab yang sama.',
  'help.guide.collapse-columns.step.2':
    'Kolom yang terlipat meninggalkan sebuah ubin di sudut peta, “Rencana” untuk hari dan “Tempat” untuk tempat. Klik ubin itu untuk mengembalikan kolom.',
  'help.guide.collapse-columns.step.3': 'Seret pembatas tipis antara kolom dan peta untuk mengubah lebar kolom.',
  'help.guide.collapse-columns.result': 'Lebarnya diingat; kolom kembali terbuka pada kunjungan berikutnya.',
  'help.guide.collapse-columns.tip.1': 'Kedua kolom bisa dilipat sekaligus untuk tampilan peta saja.',
  'help.guide.collapse-columns.tip.2':
    'Di ponsel tidak ada kolom: “Rencana” dan “Tempat” adalah dua tombol di bagian bawah peta.',
  // undo-change
  'help.guide.undo-change.title': 'Membatalkan perubahan terakhir',
  'help.guide.undo-change.goal': 'Tarik kembali apa yang baru saja Anda lakukan pada rencana.',
  'help.guide.undo-change.step.1':
    'Klik panah batalkan di bilah alat di atas hari; tooltip-nya menyebut perubahan yang akan ditarik kembali.',
  'help.guide.undo-change.result':
    'Rencana kembali seperti semula, dan panahnya berubah abu-abu sampai perubahan berikutnya.',
  'help.guide.undo-change.tip.1':
    'Batalkan mencakup rencana: menugaskan, menghapus, mengurutkan ulang, dan memindahkan tempat, mengoptimalkan rute, menghapus tempat, perubahan kategori, dan impor.',
  'help.guide.undo-change.tip.2':
    'Dalamnya satu langkah: hanya perubahan terakhir yang bisa ditarik kembali, dan perubahan baru menggantikannya.',
  'help.guide.clear-day.title': 'Mengosongkan hari',
  'help.guide.clear-day.goal':
    'Lepaskan semua tempat dari sebuah hari sekaligus, misalnya untuk merencanakannya ulang dari awal.',
  'help.guide.clear-day.step.1': 'Klik kanan kepala hari di rencana.',
  'help.guide.clear-day.step.2': 'Pilih “Kosongkan hari” lalu konfirmasi.',
  'help.guide.clear-day.result':
    'Hari itu kosong dan tempat-tempatnya kembali ke daftar sebagai belum direncanakan. Panah batalkan di atas hari mengembalikannya.',
  'help.guide.clear-day.tip.1':
    'Hanya tempat-tempatnya yang dilepas. Hari itu tetap menyimpan catatan dan pemesanannya.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Tempat',
  'help.ctx.trip-places.summary':
    'Kolom kanan rencana: setiap tempat perjalanan, direncanakan atau belum, dengan pencarian dan filter, serta cara-cara memasukkan tempat, dengan tangan, dari sebuah file atau dari daftar yang dibagikan.',
  'help.ctx.trip-places.bullet.1':
    '“Tambah Tempat/Aktivitas” di atas membuka formulir untuk tempat yang Anda ketik atau cari. Selama sebuah hari terbuka, tombol itu berbunyi “Tempat baru”, dan “Ke hari” di sebelahnya membuat tempat langsung pada hari tersebut.',
  'help.ctx.trip-places.bullet.2':
    'Tombol impor di sebelahnya menawarkan “Impor file”, untuk file .gpx, .kml dan .kmz, dan “Daftar Google” (“Impor Daftar” bila daftar Naver juga aktif) untuk daftar yang dibagikan dari Google Maps atau Naver Maps. Sebuah file juga bisa cukup dijatuhkan ke kolom ini.',
  'help.ctx.trip-places.bullet.3':
    'Di bawahnya ada pencarian, dengan tanda centang di sebelahnya yang memulai pemilihan, dan sebaris filter: “Tampilkan” beralih antara “Semua”, “Belum direncanakan”, “Direncanakan” dan, setelah sebuah trek diimpor, “Trek”, masing-masing dengan jumlahnya; tombol tag menyaring menurut kategori, bintang menurut penilaian minimum, bola dunia menurut negara atau wilayah, dan “Urutkan” mengatur urutan daftar.',
  'help.ctx.trip-places.bullet.4':
    'Sebuah baris menampilkan gambar, nama dan deskripsi atau alamat. Klik untuk melihat detail tempat, seret ke sebuah hari, atau klik kanan (atau klik tiga titiknya) untuk “Sunting”, “+ Hari”, “Buka Situs Web”, “Google Maps”, “Simpan ke Koleksi” dan “Hapus”.',
  'help.ctx.trip-places.bullet.5':
    'Dengan sebuah hari terbuka, “+ Hari” di ujung baris yang belum direncanakan menaruh tempat itu pada hari tersebut, dan “Direncanakan” hanya mendaftar hari itu, dengan “Tampilkan seluruh perjalanan” untuk melebarkan lagi.',
  'help.ctx.trip-places.bullet.6':
    'Tanda centang di sebelah pencarian memulai pemilihan: dari bilah di kaki kolom, beberapa baris sekaligus mendapat kategori baru, masuk ke sebuah koleksi, ditandai sudah dikunjungi atau dihapus.',
  // create-place
  'help.guide.create-place.title': 'Membuat tempat',
  'help.guide.create-place.goal':
    'Tambahkan tempat atau aktivitas dengan tangan, lengkap dengan semua yang perlu diketahui rencana tentangnya.',
  'help.guide.create-place.step.1':
    'Klik “Tambah Tempat/Aktivitas” di atas kolom tempat (“Tempat baru” selama sebuah hari terbuka). Formulir terbuka.',
  'help.guide.create-place.step.2':
    'Ketik tempatnya di “Cari tempat...” dan pilih satu hasil. Nama di kepala dialog, “Alamat”, “Lintang”, “Bujur” dan “Situs web” terisi, dan “Detail tempat” di sebelah kiri menampilkan gambar, jam buka dan sebuah deskripsi tentangnya. Di TREK yang punya kunci Google, “Bukan tempat yang tepat? Cari di Google saja” berada di bawah daftar dan menjalankan pencarian yang sama lewat Google. “Tempat tersimpan” di sebelah kanan menawarkan tempat-tempat dari koleksi Anda dengan cara yang sama.',
  'help.guide.create-place.step.3':
    'Di “Detail tempat”, klik pada sebuah gambar di bawah “Pilih gambar” menjadikannya gambar tempat itu; “Gunakan teks ini” memindahkan deskripsinya ke formulir.',
  'help.guide.create-place.step.4':
    'Periksa isi formulirnya: nama ada di kepala dialog dan merupakan satu-satunya kolom wajib; pil “Kategori” di bawahnya memilih salah satu kategori perjalanan, dan tanda + di sebelahnya membuat kategori baru saat itu juga. “Alamat”, “Lintang” dan “Bujur” datang dari pencarian atau diketik; “Deskripsi” dan “Catatan” milik Anda; “Situs web” menerima tautannya.',
  'help.guide.create-place.step.5':
    'Klik “Tambah”. Jika tempat dengan nama yang sama atau di titik yang sama sudah ada di perjalanan, TREK mengatakannya dan tombolnya berubah menjadi “Tetap tambahkan”.',
  'help.guide.create-place.result':
    'Tempat itu ada di daftar dan di peta, di bawah “Belum direncanakan” sampai ditaruh pada sebuah hari.',
  'help.guide.create-place.tip.1':
    '“File” dan “Biaya” di bagian bawah formulir melampirkan dokumen ke tempat itu, atau membuka editor “Biaya” untuk pengeluarannya tepat setelah menyimpan.',
  'help.guide.create-place.tip.2':
    'Indeks TREK dan OpenStreetMap yang menjawab pencarian di setiap TREK, dan “Detail tempat” mengisi dirinya dari Wikipedia, Wikivoyage dan Wikimedia. Google baru ditanya di tempat yang keduanya tidak menemukan apa pun, dan hanya Google yang membawa penilaian.',
  'help.guide.create-place.tip.3':
    'Sebuah tempat juga bisa dimulai dari peta: klik kanan titiknya, dan formulir terbuka dengan koordinat serta alamat sudah terisi.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Menambahkan tempat langsung ke hari yang dibuka',
  'help.guide.place-to-open-day.goal':
    'Lewati langkah kedua: buat atau pilih tempatnya dan langsung taruh pada hari itu.',
  'help.guide.place-to-open-day.step.1':
    'Klik judul sebuah hari di kolom hari. Hari itu terbuka: kartunya disorot, dan kolom tempat mendapat tombol “Ke hari”.',
  'help.guide.place-to-open-day.step.2':
    '“Ke hari” membuka formulir yang sama seperti “Tempat baru”, hanya saja tempat itu mendarat pada hari yang dibuka begitu Anda klik “Tambah”.',
  'help.guide.place-to-open-day.step.3':
    'Tempat yang sudah ada masuk ke hari yang dibuka lewat “+ Hari” di ujung barisnya, atau dengan klik kanan, “+ Hari”.',
  'help.guide.place-to-open-day.step.4':
    'Sebaliknya juga bisa, dan tanpa membuka hari lebih dulu: seret baris tempat itu keluar dari kolom lalu jatuhkan ke kartu sebuah hari. Dijatuhkan di antara dua perhentian, ia mendarat tepat di situ.',
  'help.guide.place-to-open-day.result':
    'Tempat itu terdaftar di bawah hari tersebut, di urutan terakhir; seret ke atas atau ke bawah ke posisi yang semestinya.',
  'help.guide.place-to-open-day.tip.1':
    'Hari yang terbuka juga mengarahkan pencarian: dengan satu hari terbuka, peta dan pencarian di sekitar berangkat dari tempat yang memang dilalui hari itu.',
  'help.guide.place-to-open-day.tip.2': '“Batalkan” di bilah alat di atas hari-hari menarik kembali penugasan itu.',
  // filter-places
  'help.guide.filter-places.title': 'Menemukan tempat dalam daftar',
  'help.guide.filter-places.goal': 'Persempit kolom ke tempat-tempat yang Anda cari.',
  'help.guide.filter-places.step.1':
    '“Tampilkan”, menu tarik-turun di bawah pencarian, beralih antara “Semua”, “Belum direncanakan” (belum ada di hari mana pun), “Direncanakan” (ada di sebuah hari) dan “Trek” (trek GPX yang diimpor), masing-masing dengan jumlahnya.',
  'help.guide.filter-places.step.2': 'Ketik di “Cari” di bagian atas; daftarnya menyempit sambil Anda mengetik.',
  'help.guide.filter-places.step.3':
    'Tombol tag di sebelah “Tampilkan” mendaftar kategori: centang satu atau lebih, termasuk “Tanpa Kategori”. Tombol itu menghitung apa yang dicentang, dan “Hapus filter” di kaki daftar mencabut semuanya.',
  'help.guide.filter-places.step.4':
    'Bintang di sebelahnya mengatur penilaian minimum: 5+, 4+ dan seterusnya hanya menampilkan tempat yang Anda beri nilai setidaknya setinggi itu.',
  'help.guide.filter-places.result':
    'Angka di atas baris-baris itu mengatakan berapa tempat yang cocok; filternya saling menggabung.',
  'help.guide.filter-places.tip.1':
    'Dengan sebuah hari terbuka, “Direncanakan” hanya mendaftar hari itu dan mengatakannya: “Hanya menampilkan hari yang dibuka”, dengan “Tampilkan seluruh perjalanan” di sebelahnya.',
  'help.guide.filter-places.tip.2':
    'Peta juga menyempit ke hari yang dibuka; “Semua” di daftar tetap menampilkan setiap tempat perjalanan.',
  // edit-place
  'help.guide.edit-place.title': 'Mengubah tempat',
  'help.guide.edit-place.goal': 'Perbaiki nama, geser pin, tambahkan situs web atau ganti kategori.',
  'help.guide.edit-place.step.1':
    'Klik kanan barisnya dan pilih “Sunting”, atau buka tempatnya dan klik “Sunting” di detailnya.',
  'help.guide.edit-place.step.2':
    'Ubah yang Anda perlukan: nama dan pil “Kategori” di kepala dialog, “Alamat”, “Lintang” dan “Bujur”, “Deskripsi”, “Catatan” dan “Situs web”. Bila dibuka dari sebuah hari, formulir juga punya “Mulai” dan “Selesai” serta “Catatan untuk hari ini”.',
  'help.guide.edit-place.step.3': 'Klik “Perbarui”.',
  'help.guide.edit-place.result':
    'Perubahan berlaku di mana pun tempat itu muncul: daftar, peta dan setiap hari yang memuatnya.',
  'help.guide.edit-place.tip.1':
    '“Catatan untuk hari ini” milik tempat itu pada satu hari tersebut; “Catatan” milik tempat itu sendiri.',
  'help.guide.edit-place.tip.2':
    '“Selesai” sebelum “Mulai” memblokir “Perbarui”; “Waktu tumpang tindih dengan:” hanya memperingatkan bahwa perhentian lain pada hari itu punya waktu yang sama.',
  // delete-place
  'help.guide.delete-place.title': 'Menghapus tempat',
  'help.guide.delete-place.goal': 'Keluarkan sebuah tempat dari perjalanan untuk selamanya.',
  'help.guide.delete-place.step.1': 'Klik kanan barisnya dan pilih “Hapus”, atau klik “Hapus” di detail tempat itu.',
  'help.guide.delete-place.step.2':
    'Klik “Hapus” di pertanyaan itu. Jika sebuah malam dipesan di tempat itu, atau sebuah pemesanan terkait dengannya, pertanyaannya mengatakan apa saja yang ikut terbawa.',
  'help.guide.delete-place.result':
    'Tempat itu hilang dari daftar, peta dan setiap hari; “Batalkan” di bilah alat di atas hari-hari mengembalikannya.',
  'help.guide.delete-place.tip.1':
    'Untuk mengeluarkan tempat dari satu hari saja, gunakan “Hapus dari Hari” pada perhentian itu sebagai gantinya.',
  'help.guide.delete-place.tip.2': 'Beberapa tempat sekaligus: tanda centang di sebelah pencarian memulai pemilihan.',
  // select-places
  'help.guide.select-places.title': 'Mengubah atau menghapus beberapa tempat sekaligus',
  'help.guide.select-places.goal': 'Rapikan daftar dalam satu kali jalan alih-alih satu per satu.',
  'help.guide.select-places.step.1':
    'Klik tanda centang di sebelah kolom pencarian. Baris-baris mendapat kotak centang bulat, dan sebuah bilah berisi tindakannya naik di kaki kolom.',
  'help.guide.select-places.step.2':
    'Klik baris-barisnya untuk mencentangnya. “Pilih semua”, tanda centang ganda di bilah itu, mengambil setiap baris yang tersisa setelah filter.',
  'help.guide.select-places.step.3':
    'Bilah itu menghitung tempat yang dicentang. “Ubah kategori” memberi semuanya satu kategori; “Simpan ke Koleksi” menyalinnya ke salah satu koleksi Anda; “Hapus yang dipilih” menghapusnya setelah sebuah konfirmasi.',
  'help.guide.select-places.step.4': '“Selesai”, tanda X di ujung bilah, mengakhiri pemilihan.',
  'help.guide.select-places.result':
    'Perubahan berlaku untuk setiap tempat yang terpilih; penghapusan bisa dibatalkan dari bilah alat di atas hari-hari.',
  'help.guide.select-places.tip.1':
    'Filter tetap bekerja sambil Anda memilih: saring ke “Belum direncanakan” dulu, lalu “Pilih semua” menangkap persis yang itu.',
  'help.guide.select-places.tip.2':
    '“Tandai dikunjungi di daftar Anda” muncul di bilah itu saat addon Koleksi aktif: ia mencentang tempat-tempat itu di koleksi tempat mereka disimpan.',
  // import-places-file
  'help.guide.import-places-file.title': 'Mengimpor tempat dari file GPX, KML atau KMZ',
  'help.guide.import-places-file.goal': 'Masukkan apa yang diekspor Google My Maps, Google Earth atau pelacak GPS.',
  'help.guide.import-places-file.step.1':
    'Klik tombol impor di sebelah tombol tambah dan pilih “Impor file”, atau jatuhkan filenya di mana saja pada kolom tempat.',
  'help.guide.import-places-file.step.2':
    'Pilih filenya atau seret ke dalam kotak. Untuk GPX, centang apa yang akan diimpor: “Titik jalan”, “Rute”, “Trek (dengan geometri jalur)”; untuk KML dan KMZ, “Titik (Placemarks)” dan “Jalur (LineStrings)”.',
  'help.guide.import-places-file.step.3':
    'Kotak itu menerima beberapa file sekaligus, dan hanya .gpx, .kml dan .kmz. Jenis file lain, atau file di atas 10 MB, ditolak di dalam dialog dan tidak diimpor.',
  'help.guide.import-places-file.step.4':
    'Klik “Impor”. Sebuah pesan mengatakan berapa tempat yang masuk; untuk file KML atau KMZ, dialognya tetap terbuka dengan ringkasan tentang apa yang dibuat dan apa yang dilewati.',
  'help.guide.import-places-file.result':
    'Tempat-tempatnya ada di daftar; sebuah trek membawa penanda rute di barisnya, tergambar di peta dan mendapat filter “Trek” sendiri.',
  'help.guide.import-places-file.tip.1':
    'File yang terlalu besar ditolak dengan menyebut batas ukurannya; ekspor ulang tanpa foto, atau pecah menjadi beberapa bagian.',
  'help.guide.import-places-file.tip.2': 'Impor itu bisa dibatalkan seluruhnya dari bilah alat di atas hari-hari.',
  // import-places-list
  'help.guide.import-places-list.title': 'Mengimpor daftar Google Maps atau Naver Maps yang dibagikan',
  'help.guide.import-places-list.goal': 'Ubah tautan daftar yang dibagikan menjadi tempat.',
  'help.guide.import-places-list.step.1':
    'Klik tombol impor di sebelah tombol tambah dan pilih “Daftar Google”. Bila daftar Naver juga aktif, entri itu bernama “Impor Daftar” dan dialognya menanyakan yang mana dari keduanya.',
  'help.guide.import-places-list.step.2':
    'Tempelkan tautan berbagi daftar itu. Tautan rute Google Maps juga bisa: perhentiannya menjadi tempat, dalam urutan berkendara.',
  'help.guide.import-places-list.step.3': 'Klik “Impor”.',
  'help.guide.import-places-list.result':
    'Setiap tempat dari daftar itu ada di perjalanan, dengan nama seperti di daftar; tempat yang sudah ada di perjalanan dilewati.',
  'help.guide.import-places-list.tip.1':
    'Daftarnya harus dibagikan secara publik; tautan daftar pribadi tidak mengimpor apa pun.',
  'help.guide.import-places-list.tip.2':
    '“Perkaya tempat via Google” muncul di dialog ketika TREK Anda punya kunci Google: ia mencari setiap tempat yang diimpor dan mengisi foto, alamat dan detail.',
  'help.guide.sort-places.title': 'Mengurutkan daftar tempat',
  'help.guide.sort-places.goal':
    'Susun daftar dalam urutan yang paling membantu saat ini: menurut nama, menurut rating, atau menurut yang terakhir ditambahkan atau diubah.',
  'help.guide.sort-places.step.1':
    'Buka “Urutkan” di kepala kolom. Labelnya menunjukkan bagaimana daftar sedang diurutkan.',
  'help.guide.sort-places.step.2': 'Pilih urutan, misalnya “Nama” atau “Rating tertinggi”. Daftar langsung mengikuti.',
  'help.guide.sort-places.result':
    'Daftar menampilkan tempat dalam urutan yang Anda pilih, sampai Anda memilih urutan lain.',
  'help.guide.sort-places.tip.1':
    'Urutan apa pun selain “Baru ditambahkan” menandai tombolnya, sehingga Anda langsung tahu daftar sedang diurutkan secara berbeda.',
  'help.guide.sort-places.tip.2': 'Pengurutan hanya mengubah daftar. Hari-hari tetap memakai urutannya sendiri.',
  'help.guide.place-by-hand.title': 'Menambah tempat yang tidak dikenal pencarian',
  'help.guide.place-by-hand.goal':
    'Masukkan sendiri sebuah tempat, lengkap dengan telepon, email, dan jam buka, saat pencarian tempat tidak menemukan apa pun.',
  'help.guide.place-by-hand.step.1':
    'Di dialog tempat, ketik nama di pencarian dan tekan Enter. Jika tidak ada yang ditemukan, dialog memberi tahu dan menawarkan “Tambah manual”.',
  'help.guide.place-by-hand.step.2':
    'Klik “Tambah manual”. Yang Anda cari menjadi nama, dan dialog bergulir ke kolom kontak.',
  'help.guide.place-by-hand.step.3': 'Isi “Telepon” dan “Email” sejauh yang Anda tahu.',
  'help.guide.place-by-hand.step.4':
    'Klik “Tambah jam buka” dan atur kapan tempat itu buka dan tutup setiap hari. Tombol salin memberi setiap hari jam dari hari pertama, dan sakelar sebuah hari menandainya “Tutup”.',
  'help.guide.place-by-hand.step.5': 'Klik “Tambah”.',
  'help.guide.place-by-hand.result':
    'Tempat masuk ke daftar. Detailnya menampilkan telepon, email, dan jam buka yang Anda masukkan, sama seperti tempat yang ditemukan pencarian.',
  'help.guide.place-by-hand.tip.1':
    'Saat mengedit tempat yang belum punya jam sendiri, jam buka dari “Detail tempat” di sebelah kiri diambil alih dengan sendirinya; jika sudah punya jam, tombol di sebelahnya mengambil alih jam hasil pencarian.',
  'help.guide.place-by-hand.tip.2':
    'Jam yang Anda masukkan menang atas jam hasil pencarian, jadi kafe dengan jam musiman menampilkan apa yang Anda tahu.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Hari',
  'help.ctx.trip-days.summary':
    'Kolom kiri rencana: satu kartu per hari dengan perhentiannya secara berurutan, catatan, pemesanan dan transportasi hari itu, dan rute di antara perhentian. Di sinilah perjalanan benar-benar direncanakan.',
  'help.ctx.trip-days.bullet.1':
    'Bilah alat di atas: “Ekspor” (PDF, kalender, GPX), “Expand all days” / “Collapse all days”, panah pembatalan, “Atur ulang hari” dan “Tampilkan semua rute pemesanan”.',
  'help.ctx.trip-days.bullet.2':
    'Sebuah kartu hari: sebuah ubin dengan nomor hari dan prakiraan cuaca, judul dan tanggal, serta pil untuk malam yang dipesan, mobil sewaan dan biaya hari itu. Klik kepala kartu untuk membuka hari itu, tanda panahnya melipatnya, dan tanda + membuka menu: “Tambah tempat ke hari ini”, “Tambah akomodasi”, “Tambah transportasi”, “Transportasi umum” dan “Tambah Catatan”.',
  'help.ctx.trip-days.bullet.3':
    'Di dalam sebuah hari: perhentian secara berurutan, masing-masing dengan gambar, nama, waktu, sebuah kunci pada gambarnya dan pemesanan yang disematkan padanya; catatan; pemesanan dan transportasi hari itu, diberi warna menurut jenisnya; dan di antara perhentian, waktu tempuh setiap ruas. Setiap baris punya menu tiga titik, sama dengan yang dibuka klik kanan.',
  'help.ctx.trip-days.bullet.4':
    'Di bawah perhentian ada bilah rute: “Rute” menggambar hari itu di peta, “Optimalkan” mengurutkan perhentian, “Berkendara”, “Jalan kaki” atau “Bersepeda” menetapkan moda perjalanan hari itu, “Buka di Google Maps” dan “Buka di CoMaps” menyerahkan hari itu.',
  'help.ctx.trip-days.bullet.5':
    'Tempat masuk ke sebuah hari dengan menyeret baris dari kolom tempat, dengan “+ Hari” pada baris itu, dengan “Tambah tempat ke hari ini” dari tanda + hari itu atau pada hari yang kosong, atau dari detail tempat.',
  'help.ctx.trip-days.bullet.6':
    '“Total Biaya” di bawah menjumlahkan pengeluaran dari “Biaya” yang termasuk perhentian dan pemesanan hari itu, masing-masing sekali, dalam mata uang perjalanan.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Membaca sebuah hari',
  'help.guide.read-day-plan.goal':
    'Ketahui apa yang diberitahukan setiap bagian kartu hari sebelum Anda mengubah apa pun.',
  'help.guide.read-day-plan.step.1':
    'Kepala kartu: sebuah ubin dengan nomor hari dan prakiraan cuaca, lalu “Hari 1” atau judul yang Anda berikan, tanggal, dan pil untuk malam yang dipesan (check-in atau check-out), mobil sewaan dan biaya hari itu. Klik kepala kartu untuk membuka hari itu (panel “Detail hari” terbuka di atas peta); tanda + di kanan menambahkan tempat, penginapan, transportasi, koneksi transportasi umum atau catatan, dan tanda panah melipat kartu.',
  'help.guide.read-day-plan.step.2':
    'Sebuah perhentian: pegangan di kiri menyeretnya, gambarnya membawa kunci untuk optimasi rute, lalu nama, sebuah lencana waktu bila perhentian itu punya “Mulai” dan “Selesai”, deskripsi dan, jika diisi, “Catatan untuk hari ini”. Panah di ujung kanannya memindahkannya ke atas atau ke bawah, dan tiga titik membuka menunya.',
  'help.guide.read-day-plan.step.3':
    'Pemesanan pada sebuah perhentian duduk di atasnya sebagai lencana “Reservasi”, hijau bila sudah dikonfirmasi dan amber selama masih tertunda, dengan waktu dan penyedianya; klik lencana itu untuk membuka pemesanannya, dan tombol rute di sebelahnya menggambar rutenya. Transportasi menjadi barisnya sendiri, diberi warna menurut jenisnya, dengan “Keberangkatan” atau “Kedatangan” dan waktunya. Klik sebuah pemesanan dan detailnya terbuka; “Sunting” di sana mengubahnya.',
  'help.guide.read-day-plan.step.4':
    'Di antara dua perhentian, penghubungnya menyebutkan berapa lama ruas itu dan berapa jauh, dalam moda perjalanan hari itu; klik untuk mengubah moda ruas yang satu itu.',
  'help.guide.read-day-plan.step.5':
    'Bilah rute di ujung: “Rute” menggambar jalan hari itu di peta, “Optimalkan” menyusun ulang perhentian, tombol moda memilih “Berkendara” atau “Jalan kaki”, “Buka di Google Maps” dan “Buka di CoMaps” membuka hari itu di sana.',
  'help.guide.read-day-plan.result':
    'Setiap simbol pada kartu punya arti; panduan di bawah mengubah masing-masing dari simbol itu.',
  'help.guide.read-day-plan.tip.1':
    'Klik kanan sebuah perhentian, atau klik tiga titiknya, untuk menunya: “Sunting”, “Hapus dari hari”, “Buka Situs Web”, aplikasi navigasi (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), “Simpan ke Koleksi”, “Hapus”.',
  'help.guide.read-day-plan.tip.2':
    'Arahkan kursor ke sebuah perhentian dan “Tambah pemesanan” muncul di ujungnya: reservasi yang dibuat di situ terikat pada perhentian ini di hari ini.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Menaruh tempat pada sebuah hari',
  'help.guide.place-onto-day.goal':
    'Ubah tempat dari daftar menjadi perhentian sebuah hari, di posisi yang semestinya dalam urutan.',
  'help.guide.place-onto-day.step.1':
    'Seret sebuah baris dari kolom tempat ke kartu hari. Jatuhkan di antara dua perhentian untuk menaruhnya tepat di sana, atau di mana saja pada kartu untuk menambahkannya di akhir.',
  'help.guide.place-onto-day.step.2':
    'Tanpa menyeret: buka hari itu dengan mengklik kepalanya, lalu klik “+ Hari” di ujung baris tempat, atau klik kanan baris itu dan pilih “+ Hari”.',
  'help.guide.place-onto-day.step.3':
    '“Tambah tempat ke hari ini”, di menu + hari itu atau pada hari yang kosong, membuka formulir tempat, dan tempat baru itu langsung mendarat di hari tersebut.',
  'help.guide.place-onto-day.step.4':
    'Dari detail sebuah tempat, “Tambah ke Hari” menanyakan hari mana; selama sebuah hari terbuka, “Ke hari” di kolom tempat membuat tempat baru pada hari yang terbuka itu.',
  'help.guide.place-onto-day.result':
    'Tempat itu kini perhentian hari tersebut, ada di peta dengan nomor hari itu, dan kolom tempat menghitungnya di bawah “Direncanakan”.',
  'help.guide.place-onto-day.tip.1':
    'Sebuah tempat bisa ada di beberapa hari: taruh lagi pada hari kedua dari kolom tempat. Menyeret sebuah perhentian dari satu kartu hari ke kartu lain justru memindahkannya.',
  'help.guide.place-onto-day.tip.2': 'Panah pembatalan di bilah alat menarik kembali penugasan itu.',
  'help.guide.place-onto-day.tip.3':
    'Sebuah perhentian tidak bisa dijatuhkan di antara dua entri yang punya waktu tetap, atau sebelum pemesanan yang sudah berwaktu; rencana menjaga kronologinya.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Mengubah urutan sebuah hari',
  'help.guide.reorder-stops.goal': 'Pindahkan perhentian ke atas atau ke bawah, atau ke hari lain.',
  'help.guide.reorder-stops.step.1': 'Seret perhentian pada pegangannya ke posisi baru di dalam kartu.',
  'help.guide.reorder-stops.step.2':
    'Atau gunakan panah di ujung kanan perhentian: satu langkah ke atas atau ke bawah setiap klik.',
  'help.guide.reorder-stops.step.3':
    'Seret perhentian ke kartu hari lain untuk memindahkannya ke sana; ia meninggalkan hari yang lama.',
  'help.guide.reorder-stops.step.4':
    'Perhentian dengan waktu tetap menanyakan “Hapus waktu?” bila pemindahan itu akan merusak urutan hari tersebut, karena waktulah yang menentukan posisinya: “Konfirmasi” membuang waktu itu dan membiarkannya pergi ke mana saja.',
  'help.guide.reorder-stops.result': 'Rute dan waktu tempuh langsung mengikuti urutan yang baru.',
  'help.guide.reorder-stops.tip.1':
    'Pemesanan dengan waktu tetap tidak bisa diurutkan ulang; mereka duduk di tempat yang ditentukan waktunya.',
  'help.guide.reorder-stops.tip.2':
    '“Optimalkan” di bilah rute mengurutkan seluruh hari menurut jalan terpendek; kunci dulu sebuah perhentian agar tetap di tempatnya.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Memberi waktu pada perhentian',
  'help.guide.set-stop-times.goal':
    'Tetapkan kapan sebuah perhentian mulai dan selesai, supaya hari itu terbaca seperti jadwal.',
  'help.guide.set-stop-times.step.1':
    'Klik kanan perhentian, atau klik tiga titiknya, dan pilih “Sunting”. Dibuka dari hari itu, formulirnya punya “Mulai” dan “Selesai” untuk hari itu, tepat di bawah lokasi.',
  'help.guide.set-stop-times.step.2':
    'Isi “Mulai” dan, kalau mau, “Selesai”. “Waktu tumpang tindih dengan:” memperingatkan bahwa perhentian berwaktu lain pada hari itu bertumpang tindih; “Selesai” yang lebih awal dari “Mulai” menghalangi “Perbarui”.',
  'help.guide.set-stop-times.step.3':
    'Klik “Perbarui”. Perhentian itu mendapat lencana waktu dan berpindah ke tempat yang sesuai dengan waktunya di dalam hari itu.',
  'help.guide.set-stop-times.result':
    'Perhentian berwaktu mempertahankan tempatnya dalam urutan; perhentian tanpa waktu tersusun di sekitarnya.',
  'help.guide.set-stop-times.tip.1':
    'Waktu itu milik perhentian pada hari tersebut; tempat yang sama pada hari lain bisa punya waktu lain.',
  'help.guide.set-stop-times.tip.2':
    'Untuk memindahkan perhentian berwaktu dengan tangan, seret saja: pertanyaan “Hapus waktu?” membuang waktunya di tengah jalan, begitu Anda menekan “Konfirmasi”.',
  'help.guide.set-stop-times.tip.3':
    '“Catatan untuk hari ini” di formulir yang sama memuat apa yang hanya berlaku pada hari ini, sebuah meja yang dipesan, sebuah nomor tiket.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Mengeluarkan perhentian dari sebuah hari',
  'help.guide.remove-from-day.goal': 'Batalkan rencana sebuah tempat tanpa menghapusnya dari perjalanan.',
  'help.guide.remove-from-day.step.1': 'Klik kanan perhentian dan pilih “Hapus dari hari”.',
  'help.guide.remove-from-day.step.2':
    'Perhentian itu hilang dari hari tersebut; tempatnya tetap ada di kolom tempat, di bawah “Belum direncanakan” bila ia tidak ada pada hari lain.',
  'help.guide.remove-from-day.result':
    'Hari itu, rutenya dan biayanya diperbarui; panah pembatalan membawa perhentian itu kembali.',
  'help.guide.remove-from-day.tip.1':
    '“Hapus” di menu yang sama mengeluarkan tempat itu dari seluruh perjalanan, termasuk setiap hari.',
  'help.guide.remove-from-day.tip.2': '“Hapus dari Hari” juga ada di panel detail tempat, di sebelah “Tambah ke Hari”.',
  // lock-stop
  'help.guide.lock-stop.title': 'Mengunci perhentian di tempatnya',
  'help.guide.lock-stop.goal': 'Biarkan sebuah perhentian tetap di tempatnya saat rute dioptimalkan.',
  'help.guide.lock-stop.step.1':
    'Arahkan kursor ke gambar perhentian dan klik kuncinya: “Pertahankan posisi saat mengoptimalkan rute”.',
  'help.guide.lock-stop.step.2':
    'Kini “Optimalkan” menyusun perhentian lain di sekitarnya; klik kunci itu sekali lagi (“Klik untuk membuka kunci”) untuk melepaskannya.',
  'help.guide.lock-stop.result':
    'Kunci itu terlihat pada gambar; perhentian mempertahankan posisinya sampai Anda membuka kuncinya.',
  'help.guide.lock-stop.tip.1':
    'Perhentian dengan waktu tetap terkunci oleh waktunya; ia tidak pernah bergerak selama optimasi.',
  'help.guide.lock-stop.tip.2':
    'Kunci itu bertahan untuk kunjungan ini: setelah halaman dimuat ulang setiap perhentian bebas lagi, hanya perhentian berwaktu yang tetap terpaku.',
  // day-note
  'help.guide.day-note.title': 'Menambahkan catatan pada sebuah hari',
  'help.guide.day-note.goal': 'Simpan sebuah pengingat, nomor tiket atau rencana cadangan langsung di dalam hari itu.',
  'help.guide.day-note.step.1': 'Klik tanda + di kepala kartu hari dan pilih “Tambah Catatan”.',
  'help.guide.day-note.step.2':
    'Ketik nama catatan di kepala dialog, di tempat bertuliskan “Catatan”; itulah yang ditampilkan kartu hari. Tulis selebihnya di bawah “Catatan Harian”: bilah alat di atasnya mengatur bentuk teks (tebal, daftar, tautan, kutipan), dan “Pratinjau” di sebelah kiri memperlihatkan baris yang akan terbentuk darinya.',
  'help.guide.day-note.step.3':
    'Pilih sebuah “Ikon” dan sebuah “Warna”, supaya catatan menonjol di antara perhentian, lalu “Tambah”.',
  'help.guide.day-note.step.4':
    'Catatan duduk di dalam hari itu seperti sebuah perhentian: seret ke tempatnya, dan klik kanan atau pakai tiga titiknya untuk “Sunting” dan “Hapus”.',
  'help.guide.day-note.result':
    'Catatan adalah bagian dari hari itu, termasuk di PDF; catatan berwaktu tersusun bersama perhentian berwaktu.',
  'help.guide.day-note.tip.1':
    'Catatan dengan waktu bisa menggantikan transportasi yang tidak Anda pesan: “08:15 S3 dari stasiun pusat”.',
  'help.guide.day-note.tip.2': 'Catatan berlaku per hari; catatan untuk seluruh perjalanan tempatnya di Collab.',
  // day-route
  'help.guide.day-route.title': 'Menampilkan dan mengoptimalkan rute hari itu',
  'help.guide.day-route.goal':
    'Lihat jalan di antara perhentian, pilih cara Anda bepergian, dan biarkan TREK menyusun urutannya.',
  'help.guide.day-route.step.1':
    'Buka hari itu dan klik “Rute” di bilah rute: jalan di antara perhentian tergambar di peta, dan penghubung di antara perhentian menampilkan waktu dan jarak setiap ruas.',
  'help.guide.day-route.step.2':
    '“Berkendara” dan “Jalan kaki” di sebelahnya menetapkan moda perjalanan hari itu; ruas-ruasnya dihitung ulang. Plugin bisa menambahkan moda mereka sendiri.',
  'help.guide.day-route.step.3':
    'Klik sebuah penghubung untuk mengubah moda ruas yang satu itu: pilih sebuah moda, atau “Gunakan bawaan hari” untuk kembali ke moda hari itu.',
  'help.guide.day-route.step.4':
    '“Optimalkan” menyusun ulang perhentian menurut jalan terpendek. Perhentian dengan kunci atau waktu tetap mempertahankan tempatnya; bila ada akomodasi pada hari itu, rute dimulai dari sana.',
  'help.guide.day-route.step.5':
    '“Buka di Google Maps” atau “Buka di CoMaps” membuka seluruh hari sebagai satu rute di aplikasi tersebut, untuk navigasi di perjalanan.',
  'help.guide.day-route.result':
    'Hari itu menjadi sebuah rute dengan waktu; “Total Biaya” dan ruas-ruasnya diperbarui saat urutannya berubah.',
  'help.guide.day-route.tip.1':
    'Rute secara bawaan berasal dari OSRM; admin dapat mengarahkan TREK ke mesin rute lain di “Pengaturan Default Pengguna”.',
  'help.guide.day-route.tip.2':
    'Ruas yang rutenya tidak bisa dihitung tidak menampilkan waktu; periksa apakah kedua perhentian punya koordinat.',
  'help.guide.day-route.tip.3': 'Panah pembatalan menarik kembali sebuah optimasi.',
  // manage-days
  'help.guide.manage-days.title': 'Menambah, mengurutkan dan mengganti nama hari',
  'help.guide.manage-days.goal': 'Bentuk harinya sendiri, bukan hanya apa yang ada di dalamnya.',
  'help.guide.manage-days.step.1':
    'Hari berasal dari tanggal perjalanan; ubah tanggalnya pada kartu perjalanan di “Dasbor” dan hari akan ditambahkan atau dikurangi di kedua ujungnya. Sebelum hari yang berisi dihapus, sebuah daftar menunjukkan hari mana yang hilang dan apa isinya.',
  'help.guide.manage-days.step.2':
    '“Atur ulang hari” di bilah alat membuka sebuah daftar: “Pindah ke atas” dan “Pindah ke bawah” menggeser sebuah hari beserta segala isinya, dan “Hapus hari”, tempat sampah di sebelahnya, menghapusnya. Di bawah daftar, tombol dengan tanggal berikutnya menambahkan satu hari tepat setelah hari bertanggal terakhir dan memperpanjang perjalanan satu hari; “Tanpa tanggal” menambahkan hari tanpa tanggal di akhir.',
  'help.guide.manage-days.step.3':
    '“Hapus hari” bertanya dulu: daftarnya menunjukkan apa yang ikut hilang bersama hari itu, tempat, catatan, dan pemesanannya, penginapan dengan check-in atau check-out di hari itu, serta hari-hari yang maju satu tanggal. “Hapus hari” menghapusnya, “Batal” menyimpannya; hari terakhir tidak bisa dihapus.',
  'help.guide.manage-days.step.4':
    'Untuk mengganti nama sebuah hari, buka hari itu dan klik pensil di sebelah judulnya pada panel detail di atas peta; nama itu menggantikan “Hari 1” di kartu dan di PDF.',
  'help.guide.manage-days.step.5':
    '“Expand all days” dan “Collapse all days” di bilah alat melipat semua kartu sekaligus; satu kartu dilipat dengan tanda panahnya.',
  'help.guide.manage-days.result':
    'Tanggal tetap melekat pada posisi: hari yang dipindahkan ke atas mengambil tanggal yang lebih awal, dan perhentian, catatan serta pemesanannya ikut berpindah.',
  'help.guide.manage-days.tip.1': 'Memindahkan hari bisa dibatalkan dari bilah alat; menghapus hari tidak bisa.',
  'help.guide.manage-days.tip.2':
    'Biaya di kepala kartu sebuah hari menjumlahkan perhentian dan pemesanan hari itu yang membawa harga.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Membaca pemesanan dan transportasi di rencana',
  'help.guide.bookings-in-plan.goal':
    'Ketahui di mana sebuah pemesanan muncul begitu ia ada, dan layar mana yang membuatnya.',
  'help.guide.bookings-in-plan.step.1':
    'Sebuah transportasi (penerbangan, kereta, feri, bus, mobil) adalah baris yang diberi warna menurut jenisnya: “Keberangkatan” pada hari ia berangkat, “Kedatangan” pada hari ia tiba, dengan waktu dan rute; yang berlangsung beberapa hari membentang melewati hari-hari di antaranya. Klik barisnya dan pemesanannya terbuka.',
  'help.guide.bookings-in-plan.step.2':
    'Reservasi yang terikat pada sebuah perhentian (sebuah restoran, sebuah tur) menjadi lencana “Reservasi” pada perhentian itu, hijau bila dikonfirmasi dan amber selama tertunda, dengan waktunya; pemesanan yang punya hari tetapi tanpa perhentian menjadi barisnya sendiri di hari itu.',
  'help.guide.bookings-in-plan.step.3':
    'Bermalam di hotel adalah akomodasi: ia duduk di panel detail hari di bawah “Akomodasi”, dari “Check-in” sampai “Check-out”, dan rute setiap hari tersebut dimulai dari sana.',
  'help.guide.bookings-in-plan.step.4':
    'Di peta, sakelar pada baris transportasi menggambar rutenya; “Tampilkan semua rute pemesanan” di bilah alat menggambar semuanya.',
  'help.guide.bookings-in-plan.step.5':
    'Membuatnya: “Tambah pemesanan” pada perhentian yang disorot kursor, “Tambah transportasi” dan “Transportasi umum” di menu + hari itu, dan tab “Pesan” serta “Transportasi” untuk daftar lengkap dengan impor dan file.',
  'help.guide.bookings-in-plan.result':
    'Satu pemesanan, satu tempat di dalam rencana; tab itu berisi pemesanan yang sama dalam bentuk daftar.',
  'help.guide.bookings-in-plan.tip.1':
    '“Dikonfirmasi” dan “Tertunda” adalah status yang Anda tetapkan pada pemesanan; rencana menampilkannya pada perhentian, tab “Pesan” menghitung keduanya.',
  'help.guide.bookings-in-plan.tip.2':
    'Transportasi dengan waktu tetap tidak bisa diseret; ubah waktunya di pemesanannya saja.',
  // export-plan
  'help.guide.export-plan.title': 'Mengekspor rencana',
  'help.guide.export-plan.goal': 'Bawa rencana sebagai dokumen, ke dalam kalender Anda atau ke sebuah GPS.',
  'help.guide.export-plan.step.1': 'Klik “Ekspor” di bilah alat di atas hari-hari.',
  'help.guide.export-plan.step.2':
    '“Dokumen”: “PDF” membuka tampilan cetak setiap hari beserta perhentian, catatan dan pemesanannya; “Pemisah halaman per hari” memulai setiap hari pada halaman baru, “Simpan sebagai PDF” mengunduhnya.',
  'help.guide.export-plan.step.3':
    '“Kalender”: “Unduh .ics” menyimpan pemesanan sebagai berkas kalender; “Berlangganan kalender” memberi sebuah tautan yang disegarkan sendiri oleh aplikasi kalender Anda.',
  'help.guide.export-plan.step.4':
    '“Peta & GPS · GPX”: “Seluruh perjalanan” mengekspor tempat, rute harian dan trek; “Hanya tempat” hanya pinnya; “Hari sebagai rute” satu rute per hari, untuk peta luring dan perangkat GPS.',
  'help.guide.export-plan.result': 'Berkasnya terunduh; tidak ada yang berubah di dalam perjalanan.',
  'help.guide.export-plan.tip.1':
    'Satu hari saja bisa dikirim ke aplikasi peta dari bilah rutenya: “Buka di Google Maps” atau “Buka di CoMaps”.',
  'help.guide.export-plan.tip.2':
    '“Berlangganan kalender” memerlukan langganan kalender yang dinyalakan di pengaturan Anda; “Dasbor” punya panduannya.',
  'help.guide.export-plan.tip.3': 'Mengekspor adalah membaca: setiap anggota perjalanan bisa melakukannya.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detail tempat',
  'help.ctx.trip-place.summary':
    'Kartu yang terbuka di atas peta ketika Anda memilih sebuah tempat: semua yang perjalanan ketahui tentangnya, bintang yang diberikan semua orang, gambar dan file-nya, serta tombol-tombol yang menaruhnya pada hari yang dibuka, ke dalam sebuah daftar atau ke dalam aplikasi peta.',
  'help.ctx.trip-place.bullet.1':
    'Klik sebuah baris di kolom tempat, sebuah perhentian di dalam sebuah hari, atau sebuah penanda di peta, dan kartu terbuka di atas peta. Memilihnya di dalam sebuah hari memberi tahu kartu itu perhentian mana yang Anda maksud, dan itulah yang membawa serta peserta perhentian tersebut beserta pemesanannya.',
  'help.ctx.trip-place.bullet.2':
    'Bagian kepala membawa gambar bulat, nama, alamat dalam satu baris dan pil untuk apa yang diketahui: buka atau tutup, kategori, harga, nomor telepon dan koordinat. Klik gambarnya untuk memakai gambar Anda sendiri, klik ganda namanya untuk mengganti nama tempat di tempat itu juga, dan tanda X di sebelah kanan menutup kartu.',
  'help.ctx.trip-place.bullet.3':
    'Di bawahnya: bintang yang diberikan setiap pelancong kepada tempat itu, deskripsi dan catatan, serta “Catatan untuk hari ini” bila perhentian itu membawanya.',
  'help.ctx.trip-place.bullet.4':
    '“Jam Buka”, “Warna jalur”, “Statistik Jalur” dan “File” menyusul, sejauh berlaku. “File” menerima apa pun dari folder Anda dan juga mendaftar apa yang menggantung pada pemesanan perhentian ini.',
  'help.ctx.trip-place.bullet.5':
    'Baris di bagian bawah: “Tambah ke Hari” atau “Hapus dari Hari” selama sebuah hari terbuka, lalu “Simpan ke Koleksi”, “Navigasi”, “Buka Situs Web”, “Sunting” dan “Hapus”.',
  'help.ctx.trip-place.bullet.6':
    'Tempat yang dipilih dari pencarian membawa apa yang diketahui indeks TREK atau OpenStreetMap tentangnya: “Buka” atau “Tutup” di antara pil di bagian kepala, dengan cincin hijau atau merah di sekeliling gambar, dinilai menurut jam tempat itu sendiri, nomor teleponnya juga sebagai pil, “Jam Buka” lebih ke bawah dengan jam hari itu pada barisnya dan sepekan penuh di balik satu klik, serta situs webnya di balik “Buka Situs Web”. Penilaian Google hanya tampil pada tempat yang ditemukan lewat Google, di TREK dengan kunci Google.',
  // read-place
  'help.guide.read-place.title': 'Apa yang kartu ceritakan tentang sebuah tempat',
  'help.guide.read-place.goal': 'Baca semua yang perjalanan ketahui tentang satu tempat, dalam satu kartu.',
  'help.guide.read-place.step.1':
    'Di kolom hari, klik perhentian yang ingin Anda baca. Kartu terbuka di atas peta dan perhentian itu tetap ditandai pada harinya.',
  'help.guide.read-place.step.2':
    'Bagian kepala: gambar bulat, nama dan alamat dalam satu baris; tooltip-nya memuat alamat lengkap. Pil di bawahnya mengatakan apakah tempat itu “Buka” atau “Tutup” saat ini, menurut jamnya sendiri, dengan cincin hijau atau merah yang serasi di sekeliling gambar, dan membawa nomor telepon, yang dengan satu klik diserahkan ke aplikasi telepon Anda, serta koordinat persisnya. Tanda X di sebelah kanan menutup kartu lagi.',
  'help.guide.read-place.step.3':
    '“Peringkat” muncul pertama di bawah bagian kepala: bintang yang diberikan setiap pelancong kepada tempat itu, dengan rata-ratanya dan berapa banyak yang memilih. “Belum dinilai” selama belum ada yang memberi.',
  'help.guide.read-place.step.4':
    'Lalu deskripsinya dan, di bawahnya, catatannya. Keduanya adalah teks dari formulir tempat, ditampilkan apa adanya: daftar, tautan dan huruf tebal semuanya bekerja.',
  'help.guide.read-place.step.5':
    '“Peserta” menyebut siapa yang pergi ke perhentian ini. Semua orang ikut sampai Anda mengeluarkan seseorang.',
  'help.guide.read-place.step.6':
    '“Jam Buka”, lebih ke bawah: barisnya membawa jam pada hari yang sedang Anda lihat, dan klik padanya membentangkan sepekan penuh dengan hari itu dalam huruf tebal. “File” berdiri di sebelahnya.',
  'help.guide.read-place.result':
    'Kartu tetap terbuka sampai Anda menutupnya dengan tanda X atau memilih tempat lain, jam sepekan tetap terbentang, dan perhentian yang memilikinya tetap ditandai di kolom hari.',
  'help.guide.read-place.tip.1':
    'Dipilih dari kolom tempat, kartu mengenal tempatnya tetapi bukan sebuah perhentian, jadi tidak ada peserta dan tidak ada pemesanan yang ditampilkan. Pilihlah perhentian di dalam harinya, maka keduanya ada.',
  'help.guide.read-place.tip.2':
    'Klik ganda namanya untuk mengganti nama tempat tanpa membuka formulir. Enter menyimpan, Escape membatalkan perubahan.',
  'help.guide.read-place.tip.3':
    'Tempat yang diketik dengan tangan tidak menampilkan semua itu: kartu hanya mengenal apa yang ada di formulirnya. Buka dengan “Sunting”, pilih tempat itu dari saran di bawah “Cari tempat...” dan klik “Perbarui”, maka jam buka, nomor telepon dan situs webnya ikut serta. Penilaian Google membutuhkan kunci Google.',
  // rate-place
  'help.guide.rate-place.title': 'Menilai sebuah tempat',
  'help.guide.rate-place.goal': 'Beri tempat itu bintang Anda sendiri, dan lihat apa yang diberikan orang lain.',
  'help.guide.rate-place.step.1':
    'Buka tempatnya. Baris bintang ada tepat di bawah bagian kepala dan membawa rata-rata suara sejauh ini, dengan jumlahnya dalam tanda kurung.',
  'help.guide.rate-place.step.2':
    'Klik bintang yang Anda maksud. Bintang-bintang terisi saat Anda bergerak melintasinya, jadi Anda melihat apa yang akan Anda berikan.',
  'help.guide.rate-place.step.3':
    'Suara Anda langsung masuk ke rata-rata, dan wajah-wajah di sebelahnya adalah yang memberi suara. Arahkan kursor ke barisnya untuk melihat bintang semua orang.',
  'help.guide.rate-place.step.4':
    'Rata-rata yang sama ada di baris tempat itu pada kolom tempat, jadi yang bagus menonjol dalam daftar.',
  'help.guide.rate-place.result':
    'Bintang Anda ada pada tempat itu untuk dilihat seluruh perjalanan, dan bintang di baris filter di atas daftar kini bisa menyisakan hanya tempat-tempat yang mencapai batas bawah.',
  'help.guide.rate-place.tip.1':
    'Setiap pelancong boleh menilai, bahkan pada perjalanan yang hanya sebagian dari Anda boleh “Tambah / edit / hapus tempat”.',
  'help.guide.rate-place.tip.2':
    'Klik bintang yang sudah Anda berikan untuk menarik kembali suara Anda. Bila tidak ada lagi yang memberi suara, tempat itu kembali berbunyi “Belum dinilai”.',
  'help.guide.rate-place.tip.3':
    'Hingga enam pemberi suara muat di samping bintang sebagai wajah; tooltipnya menyebut semuanya, dan menandai milik Anda.',
  // place-image
  'help.guide.place-image.title': 'Menaruh gambar Anda sendiri pada sebuah tempat',
  'help.guide.place-image.goal': 'Ganti gambar mini otomatis dengan foto Anda sendiri.',
  'help.guide.place-image.step.1': 'Buka tempatnya dari kolom tempat.',
  'help.guide.place-image.step.2':
    'Arahkan kursor ke gambar bulat di bagian kepala: sebuah kamera muncul dan tooltipnya berbunyi “Unggah gambar”. Klik dan pilih file Anda.',
  'help.guide.place-image.step.3':
    'Bagian kepala kini menampilkan gambar Anda, dengan tanda X merah kecil di sudutnya.',
  'help.guide.place-image.step.4':
    'Gambar yang sama ada di baris tempat itu pada kolom tempat, dan pada penandanya di peta.',
  'help.guide.place-image.result':
    'Gambar Anda menjadi gambar tempat itu di mana-mana: di kartu, di kolom tempat, di perhentian dalam hari, di penanda pada peta dan pada perjalanan yang dibagikan.',
  'help.guide.place-image.tip.1': 'JPG, PNG, GIF dan WebP diterima, dan HEIC dari iPhone dikonversi saat masuk.',
  'help.guide.place-image.tip.2':
    'Tanda X di sudut menghapus gambar Anda lagi dan yang otomatis kembali. Tempatnya sendiri tidak tersentuh.',
  'help.guide.place-image.tip.3':
    'Tanpa gambar Anda sendiri, TREK mencarikan satu dari koordinat tempat itu, dan jatuh kembali ke ikon kategorinya.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Menaruh tempat pada hari yang dibuka, atau mengeluarkannya',
  'help.guide.place-day-assign.goal': 'Pakai tombol kartu itu sendiri, bukan menyeret barisnya melintasi perencana.',
  'help.guide.place-day-assign.step.1':
    'Klik judul sebuah hari di kolom hari. Hari itu sekarang yang terbuka, dan kartu bekerja terhadapnya.',
  'help.guide.place-day-assign.step.2':
    'Klik sebuah tempat yang belum ada pada hari itu di kolom tempat. Kartunya terbuka dan baris di bagian bawah menawarkan “Tambah ke Hari”.',
  'help.guide.place-day-assign.step.3':
    'Klik “Tambah ke Hari”. Perhentian itu mendarat di akhir hari dan tombolnya berubah menjadi “Hapus dari Hari”.',
  'help.guide.place-day-assign.step.4':
    'Perhentian itu sekarang ada dalam hari tersebut, paling akhir dalam daftar. Seret ke atas ke tempat yang semestinya.',
  'help.guide.place-day-assign.step.5':
    '“Hapus dari Hari” mengeluarkan perhentian itu dari hari tersebut lagi, dan kartu menawarkan “Tambah ke Hari” sekali lagi.',
  'help.guide.place-day-assign.result':
    'Hari itu membawa perhentian tersebut, atau tidak lagi membawanya, dan tempatnya sendiri tidak tersentuh dalam kedua hal itu.',
  'help.guide.place-day-assign.tip.1':
    'Tombol itu hanya ada selama sebuah hari terbuka. Tanpa hari yang terbuka, kartu tidak punya tujuan untuk menambahkan tempatnya.',
  'help.guide.place-day-assign.tip.2':
    'Mengeluarkan perhentian dari sebuah hari tetap meninggalkan tempatnya di perjalanan dan di kolom tempat. “Hapus” adalah yang menghilangkannya di mana-mana.',
  'help.guide.place-day-assign.tip.3':
    'Perhentian yang ditaruh pada hari itu oleh pemesanan penginapan tidak menawarkan kedua tombol tersebut: malam itu ditambah dan dihapus di blok “Akomodasi” hari tersebut.',
  // place-participants
  'help.guide.place-participants.title': 'Menyebut siapa yang pergi ke perhentian ini',
  'help.guide.place-participants.goal': 'Pecah kelompok untuk satu perhentian tanpa memecah perjalanannya.',
  'help.guide.place-participants.step.1':
    'Klik perhentian di dalam harinya. Kartu terbuka dan “Peserta” mendaftar semua orang dalam perjalanan.',
  'help.guide.place-participants.step.2':
    'Klik chip seorang pelancong untuk mengeluarkannya dari perhentian ini. Namanya dicoret saat Anda mengarahkan kursor ke sana.',
  'help.guide.place-participants.step.3':
    'Tanda + bergaris putus-putus muncul begitu ada yang tidak ikut. Klik untuk melihat siapa yang tidak ada di perhentian itu.',
  'help.guide.place-participants.step.4':
    'Klik sebuah nama untuk memasukkannya kembali. Dengan semua orang kembali, perhentian itu jadi milik seluruh kelompok lagi.',
  'help.guide.place-participants.result':
    'Perhentian itu membawa pelancong yang Anda pilih, dan sisa kelompok punya sore itu untuk mereka sendiri.',
  'help.guide.place-participants.tip.1':
    '“Peserta” hanya muncul dengan sebuah perhentian terpilih, jadi pilihlah tempatnya di dalam hari dan bukan di kolom tempat, dan hanya pada perjalanan dengan lebih dari satu pelancong.',
  'help.guide.place-participants.tip.2':
    'Tidak memilih siapa pun berarti semua orang pergi, dan karena itulah pelancong terakhir yang tersisa pada sebuah perhentian tidak bisa dikeluarkan.',
  'help.guide.place-participants.tip.3':
    'Seorang “Tamu”, yang tidak punya akun sendiri, bisa menjadi peserta seperti orang lain.',
  // place-booking
  'help.guide.place-booking.title': 'Pemesanan pada sebuah perhentian',
  'help.guide.place-booking.goal':
    'Baca pemesanan yang menjadi milik sebuah perhentian, buka, dan sematkan yang baru padanya.',
  'help.guide.place-booking.step.1':
    'Buka perhentian yang memiliki pemesanan itu. Kartu mendaftarnya di bawah “Pemesanan” sebagai kartu kecil tersendiri, dengan nama pemesanan dan “Dikonfirmasi” atau “Tertunda”.',
  'help.guide.place-booking.step.2':
    'Kartu pemesanan itu membawa “Tanggal”, “Waktu” dan “Kode Pemesanan”, serta catatan apa pun yang dimiliki pemesanan itu.',
  'help.guide.place-booking.step.3': 'Klik kartu pemesanan itu. Pemesanan itu terbuka di atas peta.',
  'help.guide.place-booking.step.4':
    '“Sunting” di kaki pemesanan membuka formulirnya sendiri. “Hubungkan ke jadwal harian” di sana adalah yang menyematkan sebuah pemesanan ke sebuah perhentian, dan di sini sudah menyebut perhentian ini. Tutup formulirnya lagi.',
  'help.guide.place-booking.step.5':
    'Pemesanan baru untuk sebuah perhentian dimulai di kolom hari: arahkan kursor ke perhentian itu dan klik “Tambah pemesanan”, tiket di ujungnya. Formulir terbuka sebagai “Reservasi Baru”, sudah terhubung dengannya.',
  'help.guide.place-booking.result':
    'Pemesanan itu menggantung pada perhentian tersebut: ada di kartu, ada di hari itu, dan file-filenya juga terdaftar di bawah “File” di sini.',
  'help.guide.place-booking.tip.1':
    'Kartu pemesanan itu hanya tampil untuk perhentian tempat pemesanannya disematkan. Pemesanan tanpa perhentian tinggal di tab “Pesan”.',
  'help.guide.place-booking.tip.2':
    'Beberapa pemesanan bisa berbagi satu perhentian: makan siangnya dan turnya yang berangkat dari pintu yang sama.',
  'help.guide.place-booking.tip.3':
    'Kereta, penerbangan atau feri membuka formulir transportasi sebagai gantinya, yang dipakai tab “Transportasi”.',
  // place-files
  'help.guide.place-files.title': 'Menyimpan tiket sebuah tempat bersama tempatnya',
  'help.guide.place-files.goal': 'Taruh tiket, voucher atau peta untuk sebuah tempat di mana Anda akan mencarinya.',
  'help.guide.place-files.step.1':
    'Buka tempatnya. “File” ada di kaki kartu dan berbunyi “File” selama tempat itu belum punya satu pun.',
  'help.guide.place-files.step.2': 'Klik “Unggah” di sebelahnya dan pilih file-nya.',
  'help.guide.place-files.step.3':
    'Tombol itu menghitung apa yang dimiliki tempat tersebut, dan daftarnya terbuka sendiri.',
  'help.guide.place-files.step.4': 'Setiap baris adalah nama file dengan ukurannya. Klik untuk membuka file-nya.',
  'help.guide.place-files.result':
    'File itu ada pada tempatnya, terhitung di kartu, dan ada juga di tab “File” perjalanan.',
  'help.guide.place-files.tip.1':
    '“File” juga mendaftar apa yang menggantung pada pemesanan perhentian ini, jadi konfirmasi hotel muncul pada hotelnya.',
  'help.guide.place-files.tip.2': '“Unggah” menerima beberapa file sekaligus.',
  'help.guide.place-files.tip.3':
    'Tanpa hak “Unggah file”, tombol “Unggah” tidak ada; file yang sudah ada pada tempat itu tetap ada.',
  // place-navigation
  'help.guide.place-navigation.title': 'Membuka tempat di aplikasi peta atau di situsnya',
  'help.guide.place-navigation.goal': 'Serahkan tempatnya kepada aplikasi yang benar-benar akan membawa Anda ke sana.',
  'help.guide.place-navigation.step.1': 'Buka tempatnya dan klik “Navigasi” di baris bagian bawah.',
  'help.guide.place-navigation.step.2':
    'Daftarnya adalah aplikasi peta yang cocok untuk tempat ini: Google Maps, Waze, Apple Maps, OpenStreetMap dan CoMaps.',
  'help.guide.place-navigation.step.3':
    'Klik yang Anda pakai. TREK menyerahkan tempatnya sendiri jika bisa, bukan hanya sepasang koordinat, jadi Anda mendarat di pintu masuk yang tepat.',
  'help.guide.place-navigation.step.4':
    '“Buka Situs Web” di sebelahnya membuka halaman tempat itu sendiri, jam bukanya dan tiketnya, di tab baru.',
  'help.guide.place-navigation.result':
    'Aplikasi peta terbuka pada tempatnya, situsnya di tab tersendiri, dan tidak ada yang berubah di perjalanan.',
  'help.guide.place-navigation.tip.1':
    'Waze langsung mulai menavigasi. Yang lain membuka tempatnya, dan memulai dari sana adalah satu ketukan lagi.',
  'help.guide.place-navigation.tip.2':
    'Aplikasi mana yang ditawarkan bergantung pada tempatnya dan pada perangkat Anda: Apple Maps ditinggalkan di Android, 高德地图 hanya muncul untuk tempat di Tiongkok, dan Waze, Apple Maps serta CoMaps memerlukan koordinat tempatnya.',
  'help.guide.place-navigation.tip.3':
    'Ketika hanya satu aplikasi yang berlaku, tombolnya membawa nama aplikasi itu dan langsung membukanya.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Menyimpan tempat ke salah satu daftar Anda',
  'help.guide.place-to-collection.goal':
    'Simpan tempat yang Anda temukan di perjalanan ini untuk perjalanan berikutnya.',
  'help.guide.place-to-collection.step.1': 'Buka tempatnya dan klik “Simpan ke Koleksi” di bagian bawah kartu.',
  'help.guide.place-to-collection.step.2':
    '“Simpan ke daftar” menampilkan setiap daftar yang Anda miliki atau bagikan. Tanda centang menandai yang sudah memuat tempat ini.',
  'help.guide.place-to-collection.step.3': 'Klik daftarnya. Tempat itu langsung ada di dalamnya.',
  'help.guide.place-to-collection.step.4': 'Tutup, dan tombol di kartu berbunyi “Tersimpan”.',
  'help.guide.place-to-collection.result':
    'Tempat itu ada di daftar Anda dengan gambarnya, catatannya dan alamatnya, siap untuk perjalanan berikutnya.',
  'help.guide.place-to-collection.tip.1':
    'Tombol itu hanya ada selama addon “Koleksi” aktif, yang dinyalakan admin di bawah “Addon”.',
  'help.guide.place-to-collection.tip.2':
    'Sebuah tempat bisa berada di beberapa daftar sekaligus, dengan statusnya sendiri di masing-masing: “Ide” di satu, “Dikunjungi” di yang lain.',
  'help.guide.place-to-collection.tip.3':
    '“Tandai dikunjungi”, di samping nama tempat itu di pemilihnya, mencentangnya di daftar tersebut; bila tempatnya ada di beberapa daftar Anda, pilnya berbunyi “Dikunjungi di semua” dan melakukannya sekaligus untuk semuanya.',
  // place-track
  'help.guide.place-track.title': 'Membaca sebuah jalur dan memberinya warna sendiri',
  'help.guide.place-track.goal':
    'Lihat berapa panjang sebuah jalan kaki yang diimpor, dan bedakan garisnya dari yang lain di peta.',
  'help.guide.place-track.step.1':
    'Baris sebuah jalur di kolom tempat membawa goresan pendek dengan warna garisnya digambar. Klik baris itu.',
  'help.guide.place-track.step.2':
    '“Statistik Jalur” memberi panjang lintasannya, dalam “Satuan Jarak” yang Anda tetapkan.',
  'help.guide.place-track.step.3':
    '“Warna jalur” di atasnya menampilkan warna yang dipakai. Klik barisnya untuk membuka contoh-contoh warnanya.',
  'help.guide.place-track.step.4': 'Pilih sebuah warna. Garis di peta dan goresan di barisnya berubah bersamanya.',
  'help.guide.place-track.step.5':
    'Sel bergaris putus-putus di sebelah kiri, “Warna otomatis”, mengembalikan kepada jalur itu warna yang diwarisinya; pipet di sebelah kanan, “Pilih warna kustom”, membuka pemilih warna sistem Anda untuk apa pun selain itu.',
  'help.guide.place-track.result':
    'Jalur itu digambar dengan warna yang Anda pilih, di kartu, di barisnya pada kolom tempat dan di peta.',
  'help.guide.place-track.tip.1':
    'Hanya tempat yang membawa sebuah lintasan, yang diimpor dari file GPX, KML atau KMZ, memiliki kedua blok ini.',
  'help.guide.place-track.tip.2':
    'Jalur yang direkam dengan ketinggian juga menampilkan titik tertinggi dan terendahnya, meter naik dan turun, serta profil jalan kakinya.',
  'help.guide.place-track.tip.3':
    'Sebuah impor memberi setiap jalur yang dibawanya warna tersendiri, jadi dua jalan kaki tidak pernah tiba dengan warna yang sama.',
  // read-place
  'help.guide.read-place.step.7':
    'Baris di bagian bawah adalah apa yang bisa Anda lakukan dari sini: mengeluarkan tempat itu dari hari yang dibuka atau menaruhnya di sana, menyimpannya ke sebuah daftar, membukanya di aplikasi peta, menyuntingnya atau menghapusnya.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'File',
  'help.ctx.trip-files.summary':
    'Setiap dokumen perjalanan dalam satu daftar: tiket, konfirmasi, pas dan gambar, masing-masing dengan sebuah catatan, sebuah tautan ke tempat atau pemesanan yang memilikinya, dan sebuah sampah yang bisa mengeluarkannya kembali.',
  'help.ctx.trip-files.bullet.1':
    '“Jatuhkan file di sini”, kotak putus-putus di bawah bilah, menerima file; sebuah klik padanya membuka pemilih file. Di dalamnya tertera tipe file yang diterima TREK ini dan “Max 50 MB”, batas per file.',
  'help.ctx.trip-files.bullet.2':
    'Bilah di atas memuat “File” dan tab filter “Semua”, “PDFs”, “Gambar” dan “Dokumen”, masing-masing dengan jumlahnya. Sebuah bintang ikut muncul sesudah “Semua” begitu ada file yang ditandai bintang, dan “Catatan Collab” di ujung begitu sebuah catatan membawa lampiran.',
  'help.ctx.trip-files.bullet.3':
    'Sebuah baris memuat thumbnail atau tipe file, siapa yang mengunggahnya, namanya, catatan di bawahnya, ukuran dan tanggal, serta satu lencana per tautan: tempat, pemesanan atau transportasi menurut namanya (saat ditunjuk tertulis “Rencana Harian”, “Pemesanan” atau “Transportasi”), dan “Dari Catatan Collab”.',
  'help.ctx.trip-files.bullet.4':
    'Di ujung sebuah baris ada hingga lima ikon, masing-masing menyebut namanya saat Anda menunjuknya: “Bintang”, “Tugaskan” (pensil), “Buka”, “Unduh” dan “Hapus”. “Hapus” tidak bertanya: file itu masuk ke sampah, dan dari sana bisa dibawa kembali.',
  'help.ctx.trip-files.bullet.5':
    'Sebuah gambar atau video terbuka layar penuh, dengan tombol panah dan sederet thumbnail; setiap dokumen lain terbuka dalam sebuah dialog dengan namanya di atas serta “Buka di tab baru” dan “Unduh” di bawahnya. Sebuah wallet pass langsung diunduh.',
  'help.ctx.trip-files.bullet.6':
    'Ikon tempat sampah di ujung kanan bilah (“Sampah”) mengalihkan daftar ke file yang dihapus, di mana setiap file dipulihkan atau dihapus untuk selamanya dan “Kosongkan Sampah” di bilah membersihkan semuanya. Bila perjalanan terikat pada penyimpanan dokumen, atau bagi pemiliknya atau seorang administrator begitu sebuah penyimpanan dinyalakan, “Sinkronisasi dokumen” berdiri di kiri ikon tempat sampah.',
  // files-upload
  'help.guide.files-upload.title': 'Memasukkan dokumen ke dalam perjalanan',
  'help.guide.files-upload.goal':
    'Bawa tiket, konfirmasi atau foto dari folder unduhan Anda ke dalam perjalanan, tempat semua orang di dalamnya bisa menjangkaunya.',
  'help.guide.files-upload.step.1':
    'Buka perjalanan dan klik “File” di bilah tab. Dokumen perjalanan itu terdaftar di sana, dengan kotak unggah di atasnya.',
  'help.guide.files-upload.step.2':
    'Klik “Jatuhkan file di sini” dan pilih satu atau beberapa file. File diunggah satu demi satu dan kotak itu berbunyi “Mengunggah...” selama berlangsung. Di dalam kotak, di bawah “atau klik untuk memilih”, tertera tipe yang diterima TREK ini dan “Max 50 MB”, ukuran terbesar sebuah file.',
  'help.guide.files-upload.step.3':
    'Begitu file terakhir selesai, “Tugaskan File” terbuka sendiri untuknya (selama perjalanan punya tempat atau pemesanan), dengan nama file di kepala dialog. “Tambahkan catatan...” di bawah “Catatan” memberi file itu satu barisnya sendiri, dan daftar di bawahnya mengikatnya ke sebuah tempat atau sebuah pemesanan. Tutup dengan tanda × di kanan atas; menutupnya tidak menghilangkan apa pun.',
  'help.guide.files-upload.step.4':
    'File baru berdiri di puncak daftar; hanya file bertanda bintang yang berdiri di atasnya. Sebuah baris menunjukkan siapa yang mengunggahnya, namanya, ukuran dan tanggal; sebuah gambar mendapat thumbnail, setiap file lain mendapat tipenya.',
  'help.guide.files-upload.result':
    'Dokumen sudah ada di dalam perjalanan, dan semua orang yang bisa melihat perjalanan itu bisa membuka dan mengunduhnya.',
  'help.guide.files-upload.tip.1':
    'Sebuah file juga bisa diseret dari desktop langsung ke kotak itu, yang disorot selama file berada di atasnya.',
  'help.guide.files-upload.tip.2':
    'Sebuah gambar di papan klip masuk ke daftar dengan Ctrl+V, jadi tangkapan layar sebuah pemesanan tidak perlu disimpan lebih dulu.',
  'help.guide.files-upload.tip.3':
    'Mengunggah memerlukan hak “Unggah file”; tanpa itu kotaknya sama sekali tidak ada. Tipe yang tidak ada dalam daftar ditolak dengan sebuah pesan dan tidak ada yang diunggah. File di atas 50 MB dijatuhkan oleh kotak itu sendiri, sebelum apa pun dikirim.',
  // files-link
  'help.guide.files-link.title': 'Mengikat dokumen ke sebuah tempat atau pemesanan',
  'help.guide.files-link.goal':
    'Buat tiket itu bisa ditemukan dari hari yang memilikinya, bukan hanya dari daftar ini.',
  'help.guide.files-link.step.1':
    'Klik pensil di ujung baris (“Tugaskan”). “Tugaskan File” terbuka, dengan nama file di bawahnya di kepala dialog.',
  'help.guide.files-link.step.2':
    'Di bawah “Catatan”, “Tambahkan catatan...” menerima satu baris, yang lalu berdiri di bawah nama file dalam daftar. Baris itu tersimpan saat Anda menekan Enter atau meninggalkan kotaknya.',
  'help.guide.files-link.step.3':
    'Di bawah “Tempat”, di sebelah kiri, berdiri tempat-tempat perjalanan, dikelompokkan menurut hari yang memuatnya beserta tanggalnya, dan “Tidak ditugaskan” di akhir untuk yang tidak ada di hari mana pun. Klik salah satu dan ia mendapat tanda centang.',
  'help.guide.files-link.step.4':
    'Di bawah “Pemesanan” dan “Transportasi”, di sebelah kanan, berdiri pemesanan-pemesanan perjalanan. Klik yang memiliki dokumen itu; ia pun mendapat tanda centangnya.',
  'help.guide.files-link.step.5':
    'Tutup dengan tanda × di kanan atas. Tidak ada tombol simpan di sini: setiap klik sudah ditulis saat Anda melakukannya.',
  'help.guide.files-link.result':
    'Baris itu membawa catatannya dan satu lencana per tautan, satu dengan nama tempatnya dan satu dengan nama penerbangannya (saat sebuah lencana ditunjuk tertulis “Rencana Harian” atau “Transportasi”), dan dokumen itu juga menggantung pada tempat dan pada penerbangan itu.',
  'help.guide.files-link.tip.1':
    'Sebuah file bisa memegang beberapa tautan sekaligus, jadi konfirmasi yang sama bisa menjadi milik pemesanan hotel dan milik tempat hotel itu pada saat yang sama.',
  'help.guide.files-link.tip.2':
    'Mengklik lagi entri yang sudah tercentang mencabut tautan itu; filenya sendiri tetap ada.',
  'help.guide.files-link.tip.3':
    'Sebaliknya juga berlaku: dokumen yang dilampirkan ke sebuah tempat atau ke sebuah pemesanan ada dalam daftar ini juga, dengan lencana yang sama pada barisnya.',
  // files-star
  'help.guide.files-star.title': 'Menjaga dokumen penting tetap di atas',
  'help.guide.files-star.goal':
    'Tarik dua atau tiga kertas yang benar-benar akan Anda perlukan keluar dari daftar yang terus tumbuh sepanjang perjalanan.',
  'help.guide.files-star.step.1':
    'Klik bintang di ujung sebuah baris (“Bintang”). Bintang itu terisi keemasan, bintang kedua muncul di depan nama file, dan saat tombol itu ditunjuk kini tertulis “Hapus bintang”.',
  'help.guide.files-star.step.2':
    'Daftar menyusun dirinya lagi: file bertanda bintang berdiri di atas semua yang lain, yang terbaru lebih dulu di dalam setiap kelompok.',
  'help.guide.files-star.step.3':
    'Sebuah bintang bergabung dengan tab filter di bilah, tepat sesudah “Semua”, dengan jumlah file bertanda bintang di sebelahnya. Klik untuk melihat hanya file-file itu.',
  'help.guide.files-star.result':
    'Kertas yang Anda perlukan di loket berdiri di puncak daftar, dan satu tab tidak menampilkan apa pun selain itu.',
  'help.guide.files-star.tip.1':
    'Tab bintang hanya ada selama ada sesuatu yang bertanda bintang. Hapus bintang pada file terakhir dan tab itu ikut hilang.',
  'help.guide.files-star.tip.2':
    'Memberi bintang butuh hak yang sama dengan “Tugaskan”, yaitu “Edit metadata file”. Anggota tanpa hak itu melihat bintangnya, tetapi klik pada “Bintang” tidak mengubah apa pun bagi mereka.',
  // files-filter
  'help.guide.files-filter.title': 'Menemukan sebuah dokumen dalam daftar',
  'help.guide.files-filter.goal': 'Persempit daftar yang berisi segalanya menjadi satu jenis kertas yang Anda cari.',
  'help.guide.files-filter.step.1':
    'Tab filter berada di bilah di atas, di sebelah “File”: “Semua”, “PDFs”, “Gambar” dan “Dokumen”, masing-masing dengan jumlah file di sebelahnya.',
  'help.guide.files-filter.step.2': 'Klik “PDFs”: daftar menyimpan file PDF dan tidak ada yang lain.',
  'help.guide.files-filter.step.3':
    'Dua tab lagi datang dan pergi mengikuti apa yang ada di perjalanan. Klik “Catatan Collab”, yang ada begitu sebuah catatan di tab Collab membawa lampiran: daftarnya menyimpan file-file itu dan tidak ada yang lain. Sebuah bintang bergabung ke deretan itu dengan cara yang sama, begitu ada file yang ditandai bintang.',
  'help.guide.files-filter.step.4': '“Semua” membawa kembali seluruh daftar.',
  'help.guide.files-filter.result':
    'Daftar hanya menampilkan apa yang disebut tab itu, dan angka pada setiap tab mengatakan berapa banyaknya.',
  'help.guide.files-filter.tip.1':
    'Di sini tidak ada folder dan tidak ada penggantian nama: catatan di “Tugaskan File”, tautan ke tempat dan pemesanan, serta bintangnya, itulah cara Anda membedakan dokumen satu sama lain.',
  'help.guide.files-filter.tip.2':
    'Daftarnya sendiri selalu bertanda bintang lebih dulu, lalu yang terbaru lebih dulu, jadi dokumen yang diunggah hari ini berdiri di atas yang dari bulan lalu.',
  // files-preview
  'help.guide.files-preview.title': 'Membaca dokumen tanpa meninggalkan TREK',
  'help.guide.files-preview.goal':
    'Lihat sebuah tiket atau gambar di tempatnya, dan bawa ke mesin Anda sendiri saat Anda memerlukannya di sana.',
  'help.guide.files-preview.step.1':
    'Klik nama sebuah gambar atau thumbnailnya. Gambar terbuka layar penuh, dengan nama file dan posisinya di antara gambar-gambar itu di kiri atas.',
  'help.guide.files-preview.step.2':
    'Panah bundar di sisi-sisinya, tombol panah kiri dan kanan serta deretan thumbnail di bawah membawa Anda melewati setiap gambar yang sedang ditampilkan daftar.',
  'help.guide.files-preview.step.3':
    '“Buka di tab baru” dan “Unduh” adalah tombol bundar di kanan atas, di sebelah tanda ×. Tanda ×, Escape atau klik pada latar gelap menutup gambar itu lagi.',
  'help.guide.files-preview.step.4':
    'Dokumen yang bukan gambar justru terbuka dalam sebuah dialog: namanya di atas dengan “Buka di tab baru” dan “Unduh” sebagai pil di bawahnya, dan untuk PDF halamannya sendiri di bawah. Tanda × di kanan atas, Escape atau klik di sebelah dialog menutupnya.',
  'help.guide.files-preview.step.5':
    'Panah di ujung sebuah baris (“Unduh”) menyimpan file langsung ke mesin Anda, tanpa membuka apa pun lebih dulu.',
  'help.guide.files-preview.result':
    'Dokumen ada di layar, dan dua tombol yang sama menaruhnya di sebuah tab browser atau di disk Anda.',
  'help.guide.files-preview.tip.1':
    'Di layar sentuh Anda menggeser untuk melewati gambar-gambar itu, bukan mengklik panahnya.',
  'help.guide.files-preview.tip.2':
    'Sebuah wallet pass tidak pernah membuka pratinjau: ia langsung diunduh, supaya ponsel bisa menyerahkannya ke aplikasi dompetnya.',
  'help.guide.files-preview.tip.3':
    '“Buka di tab baru” dan “Unduh” keduanya mengambil file dengan sesi Anda, jadi tautan yang disalin dari bilah alamat tidak berguna bagi orang lain.',
  // files-trash
  'help.guide.files-trash.title': 'Membuang dokumen, dan mengambilnya kembali',
  'help.guide.files-trash.goal':
    'Bersihkan apa yang tidak lagi diperlukan perjalanan, tanpa kehilangan apa pun yang ternyata Anda perlukan.',
  'help.guide.files-trash.step.1':
    'Klik tempat sampah di ujung sebuah baris (“Hapus”). File langsung meninggalkan daftar dan pesannya berbunyi “Dipindahkan ke sampah”. Tidak ada yang bertanya lebih dulu.',
  'help.guide.files-trash.step.2':
    'Ikon tempat sampah di ujung kanan bilah (“Sampah”) mengalihkan daftar ke apa yang sudah dibuang. Judul bilah berbunyi “Sampah”, dan tab filter serta kotak unggah menghilang.',
  'help.guide.files-trash.step.3':
    'Baris yang dibuang tampil kelabu dan menyisakan dua ikon: “Pulihkan”, yang membawa file kembali, dan “Hapus”, yang menyingkirkannya untuk selamanya setelah sebuah pertanyaan.',
  'help.guide.files-trash.step.4':
    'Klik “Pulihkan”. Pesannya berbunyi “File dipulihkan” dan baris itu meninggalkan sampah, dengan catatan dan tautannya masih melekat.',
  'help.guide.files-trash.step.5':
    '“Kosongkan Sampah”, di bilah di sebelah ikon tempat sampah, membersihkan untuk selamanya semua yang masih ada di sini, dan browser bertanya sekali sebelum melakukannya. Ikon tempat sampah beralih kembali ke daftar file.',
  'help.guide.files-trash.result': 'File kembali ke dalam daftar di tempatnya semula, seolah tidak terjadi apa-apa.',
  'help.guide.files-trash.tip.1':
    '“Hapus” pada sebuah baris tidak bertanya lebih dulu, dan untuk itulah sampahnya ada: tidak ada yang meninggalkan TREK sampai Anda mengatakannya di sini.',
  'help.guide.files-trash.tip.2':
    'Membuang sebuah file dan mengambilnya kembali memerlukan hak “Hapus file”. Anggota tanpa hak itu tidak melihat “Hapus” pada baris maupun tombol-tombol di dalam sampah.',
  'help.guide.files-trash.tip.3': 'File yang dihapus untuk selamanya di dalam sampah tidak bisa dibawa kembali.',
  // files-sync
  'help.guide.files-sync.title': 'Menjaga dokumen tetap sejalan dengan penyimpanan dokumen Anda',
  'help.guide.files-sync.goal':
    'Ikat perjalanan ke penyimpanan dokumen Anda sendiri, sehingga yang diunggah di sini mendarat di sana dan yang diarsipkan di sana muncul di sini.',
  'help.guide.files-sync.step.1':
    'Klik “Sinkronisasi dokumen”, di sebelah ikon tempat sampah di ujung kanan bilah. Dialog terbuka dengan nama perjalanan di bawah judulnya. Di kiri, di bawah “Hubungkan penyedia”, berdiri penyimpanan yang telah dinyalakan administrator, masing-masing dengan satu baris tentang cara ia mengarsipkan: Paperless-ngx dan Papra per tag, Nextcloud dan Synology Drive di dalam folder, OpenCloud di dalam sebuah ruang. Di kanan berbunyi “Belum ada yang terhubung”.',
  'help.guide.files-sync.step.2':
    'Klik penyimpanan Anda, di sini Nextcloud. Dialog yang lebih kecil terbuka untuk koneksinya, dinamai menurut penyimpanan itu, dan meminta data masuk yang dipakai penyimpanan tersebut.',
  'help.guide.files-sync.step.3':
    'Isi “Alamat” dan data masuk milik penyimpanan itu sendiri: “Token API” untuk Paperless-ngx, “Kunci API” dan “ID organisasi” untuk Papra, “Nama pengguna” dan “Sandi aplikasi” untuk Nextcloud, “Nama pengguna” dan “Token aplikasi” untuk OpenCloud, serta untuk Synology Drive “Nama pengguna”, “Kata sandi” dan, jika akunnya memintanya, “Kode dua faktor”. Pakai sandi aplikasi atau token di mana pun penyimpanan menawarkannya, jangan pernah sandi akun Anda. Nextcloud dan Synology Drive juga menerima “Folder dasar” yang opsional, tempat TREK mencari folder perjalanan, di sini /Reisen. “Terima sertifikat yang ditandatangani sendiri” di bagian bawah hanya untuk penyimpanan di jaringan Anda sendiri dengan sertifikat semacam itu.',
  'help.guide.files-sync.step.4':
    'Klik “Uji koneksi”. TREK menjangkau penyimpanan itu dengan apa yang Anda ketik dan kakinya berbunyi “Terjangkau, masuk sebagai” diikuti nama akunnya. Kredensial yang ditolak atau alamat yang tidak dapat dijangkau disebut di sana sebagai gantinya, dan bagaimanapun tidak ada yang disimpan.',
  'help.guide.files-sync.step.5':
    'Klik “Hubungkan”. Koneksi disimpan bersama perjalanan dan TREK bertanya di mana perjalanan ini disimpan di penyimpanan itu: tag, folder, atau ruang yang menampung dokumennya. Hanya yang ada di dalamnya yang disinkronkan. “Buat yang baru” membuatnya saat “Buat”, dengan nama yang sudah diisi dari judul perjalanan; di bawah “Atau pakai yang sudah ada” berdiri yang sudah ada. Klik salah satunya, di sini folder Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Dialog kembali: penyimpanan Anda berdiri di bawah “Perjalanan ini” di kiri, dan kartunya di kanan membawa tujuan sinkronisasinya, kapan terakhir dijalankan dan “Sinkronkan sekarang”. Proses pertama mulai dengan sendirinya; “Sinkronkan sekarang” menjalankan satu kapan pun Anda mau. Begitu satu proses selesai, lencana “Belum disinkronkan” di sebelah nama berganti menjadi titik hijau, “Tersinkron” ketika Anda mengarahkan penunjuk ke atasnya, dan bilah alur menghitung dokumen yang dipegang TREK dan penyimpanan masing-masing, dengan jalur “Keluar ke penyimpanan” dan “Masuk dari penyimpanan” di antaranya. Tutup dialog dengan tanda × di kanan atas.',
  'help.guide.files-sync.result':
    'Dokumen yang sudah ada di sana berdiri di puncak daftar, diunggah atas nama Anda, dan setiap dokumen perjalanan juga ada di penyimpanan, kecuali yang berasal dari “Catatan Collab”. Sejak itu TREK memeriksa penyimpanan di latar belakang dan penyimpanan mengikuti daftar.',
  'help.guide.files-sync.tip.1':
    'Hanya pemilik perjalanan atau administrator instans yang dapat mengikat sebuah perjalanan, karena kredensialnya menjangkau seluruh akun itu di penyimpanan. Setiap anggota melihat “Sinkronisasi dokumen” begitu perjalanan terikat, dan dapat membukanya, membaca kartunya dan menekan “Sinkronkan sekarang”.',
  'help.guide.files-sync.tip.2':
    'Penyimpanan di jaringan Anda sendiri membutuhkan ALLOW_INTERNAL_NETWORK=true di server TREK, dan alamatnya harus alamat mesin itu di jaringan, tidak pernah localhost. Tanpa itu, “Uji koneksi” menjawab “Alamat itu tidak diizinkan.”',
  'help.guide.files-sync.tip.3':
    '“Putuskan”, ikon di sebelah “Sinkronkan sekarang”, bertanya sekali, lalu mengakhiri pemasangan dan mempertahankan setiap dokumen di kedua sisi. Tag, folder, atau ruang yang diikat untuk kedua kalinya diperlakukan sebagai baru, dan semua isinya masuk lagi, jadi setelah “Putuskan” ikatlah yang kosong alih-alih yang lama.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detail hari',
  'help.ctx.trip-day-detail.summary':
    'Panel yang dibuka oleh kepala sebuah hari di atas peta: hari itu secara keseluruhan, namanya dan tanggalnya, cuaca di tempat Anda akan berada, pemesanan yang jatuh pada hari itu dan malam-malam yang dipesan untuknya.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klik kepala sebuah hari di kolom hari dan panel terbuka di atas bagian tengah peta. Kepala yang sama sekali lagi, atau tanda X di kanannya, menutupnya dan melepaskan hari itu.',
  'help.ctx.trip-day-detail.bullet.2':
    'Kepala itu membawa nama hari dan tanggalnya. Ikon pensil di sebelah nama mengganti nama hari, chevron ganda melipat panel menjadi bilah tipis sehingga peta bebas lagi.',
  'help.ctx.trip-day-detail.bullet.3':
    'Di atas, cuaca hari itu. “Prakiraan untuk” menyebut tempat yang dimaksud: perhentian pertama hari itu, atau hotel tempat Anda bangun.',
  'help.ctx.trip-day-detail.bullet.4':
    '“Reservasi” mendaftar pemesanan hari itu, masing-masing dengan jenisnya, perhentian yang memilikinya dan waktunya. Hijau berarti dikonfirmasi, amber masih tertunda, dan satu klik pada sebuah baris membuka pemesanannya.',
  'help.ctx.trip-day-detail.bullet.5':
    '“Akomodasi” menampilkan setiap malam yang dipesan pada hari ini, dengan “Check-in” dan “Check-out” pada hari terjadinya, jendela check-in, waktu check-out dan nomor konfirmasi.',
  'help.ctx.trip-day-detail.bullet.6':
    '“Tambah akomodasi” memesan satu malam pada hari ini: pilih propertinya dari tempat-tempat perjalanan, tentukan hari mana saja yang tercakup, lalu tambahkan waktu dan kodenya.',
  // day-panel
  'help.guide.day-panel.title': 'Membuka sebuah hari dan membaca detailnya',
  'help.guide.day-panel.goal':
    'Lihat satu hari secara utuh, cuacanya, pemesanannya dan tempat Anda tidur, tanpa meninggalkan peta.',
  'help.guide.day-panel.step.1':
    'Klik kepala sebuah hari di kolom hari. Hari itu terpilih dan detailnya terbuka di atas bagian tengah peta.',
  'help.guide.day-panel.step.2':
    'Kepala itu menamai hari, “Hari 1” sampai Anda memberinya nama, dengan tanggalnya di bawah.',
  'help.guide.day-panel.step.3':
    'Di atas, cuaca hari itu. “Prakiraan untuk” mengatakan tempat mana yang dimaksud: perhentian pertama hari itu, atau hotel tempat Anda bangun.',
  'help.guide.day-panel.step.4':
    '“Reservasi” di bawahnya mendaftar pemesanan yang jatuh pada hari ini, beserta waktunya.',
  'help.guide.day-panel.step.5':
    '“Akomodasi” menampilkan malam-malam yang dipesan pada hari ini, dengan “Check-in” dan “Check-out” pada hari terjadinya.',
  'help.guide.day-panel.step.6':
    'Chevron ganda di kepala melipat panel menjadi bilah tipis. Tanda X di sebelahnya menutup panel dan melepaskan hari itu.',
  'help.guide.day-panel.result':
    'Terlipat menjadi bilah, panel membiarkan peta bebas dan hari tetap terpilih; tertutup, hari itu tidak lagi terpilih dan rencana kembali seperti semula.',
  'help.guide.day-panel.tip.1':
    'Mengklik di mana saja pada bilah kepala panel juga melipatnya. Chevron hanyalah tombol untuk itu.',
  'help.guide.day-panel.tip.2':
    'Membuka sebuah tempat dari kolom tempat menaruh detail tempat itu di posisi panel. Tutup detailnya dan hari itu kembali.',
  // day-weather
  'help.guide.day-weather.title': 'Membaca cuaca hari itu',
  'help.guide.day-weather.goal': 'Ketahui akan seperti apa hari itu di tempat Anda benar-benar berada pada hari itu.',
  'help.guide.day-weather.step.1':
    '“Prakiraan untuk” menyebut tempat yang menjadi acuan angka-angka itu: perhentian pertama hari itu, atau, pada hari tanpa perhentian, hotel tempat Anda bangun.',
  'help.guide.day-weather.step.2':
    'Angka besar adalah suhu hari itu, di sebelahnya suhu terendah dan tertinggi, serta kondisinya dalam kata-kata.',
  'help.guide.day-weather.step.3':
    'Pil di sebelah kanannya: peluang hujan, seberapa banyak hujannya, angin terkuat, serta matahari terbit dan terbenam.',
  'help.guide.day-weather.step.4':
    'Di bagian bawah, hari itu jam demi jam, setiap dua jam: waktunya, ikonnya, suhunya dan peluang hujannya. Jam dengan lebih dari 50% diberi warna biru.',
  'help.guide.day-weather.result':
    'Kartu hari itu di kolom hari membawa cuaca yang sama dalam ukuran kecil di bawah nomornya, sehingga seluruh perjalanan terbaca sekali pandang.',
  'help.guide.day-weather.tip.1':
    'Derajat dan angin mengikuti “Satuan Suhu” di bawah “Tampilan” dalam Pengaturan: pilih “°F Fahrenheit” dan prakiraan yang sama dibacakan dalam °F dan mph.',
  'help.guide.day-weather.tip.2':
    'Hari tanpa perhentian berkoordinat dan tanpa hotel tempat bangun sama sekali tidak menampilkan cuaca: prakiraan selalu untuk sebuah tempat, tidak pernah untuk perjalanan.',
  'help.guide.day-weather.tip.3':
    'Lebih dari 16 hari ke depan tidak ada prakiraan yang bisa didapat. Angkanya lalu berupa rata-rata tahun-tahun sebelumnya untuk tanggal itu, ditandai dengan Ø dan disebutkan di bawahnya.',
  // rename-day
  'help.guide.rename-day.title': 'Memberi nama pada sebuah hari',
  'help.guide.rename-day.goal':
    'Sebut sebuah hari sesuai isinya, “Tiba di Kyoto” atau “Hari istirahat”, alih-alih “Hari 5”.',
  'help.guide.rename-day.step.1': 'Buka hari itu. Kepalanya berbunyi “Hari 5”, dengan tanggal di bawahnya.',
  'help.guide.rename-day.step.2': 'Klik ikon pensil di sebelah nama.',
  'help.guide.rename-day.step.3': 'Nama berubah menjadi kolom isian. Ketik nama yang Anda inginkan.',
  'help.guide.rename-day.step.4':
    'Tekan Enter, atau cukup klik di tempat lain; Escape membuang perubahan itu. Kartu hari di kolom hari juga membawa nama tersebut.',
  'help.guide.rename-day.result':
    'Nama itu menggantikan “Hari 5” di panel dan di kartu hari pada kolom hari; tanggalnya tetap di tempatnya.',
  'help.guide.rename-day.tip.1':
    'Kosongkan kolom isian lalu simpan, dan hari itu menjadi “Hari 5” lagi: nomornya yang muncul ketika tidak ada nama.',
  'help.guide.rename-day.tip.2':
    'Nama itu milik hari, bukan milik tanggalnya. Urutkan ulang hari-harinya dan nama itu ikut berpindah bersama semua isi hari tersebut.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Memesan satu malam pada sebuah hari',
  'help.guide.add-accommodation.goal':
    'Masukkan hotel ke dalam rencana satu kali saja, dengan hari-hari yang dicakupnya, waktunya dan nomor konfirmasinya.',
  'help.guide.add-accommodation.step.1':
    'Properti itu harus lebih dulu menjadi tempat dalam perjalanan. Buat di kolom tempat seperti Anda membuat tempat lain: pemilihnya hanya menawarkan apa yang sudah ada.',
  'help.guide.add-accommodation.step.2': 'Buka hari kedatangan Anda dan klik “Tambah akomodasi” di bawah “Akomodasi”.',
  'help.guide.add-accommodation.step.3':
    '“Terapkan ke hari” menentukan malam mana yang dicakup masa menginap itu: “Mulai” adalah hari check-in, “Selesai” hari check-out, dan “Semua” mencakup seluruh perjalanan. Kepala dialog menampilkan rentangnya dan jumlah malamnya.',
  'help.guide.add-accommodation.step.4':
    'Isi “Check-in”, “Sampai” dan “Check-out”, dan tulis nomor pemesanan di bawah “Konfirmasi”. Keempatnya boleh tetap kosong.',
  'help.guide.add-accommodation.step.5':
    'Pilih propertinya dari tempat-tempat perjalanan. “Kategori” di atas daftar mempersempitnya ke satu kategori.',
  'help.guide.add-accommodation.step.6': 'Klik “Simpan”.',
  'help.guide.add-accommodation.result':
    'Masa menginap itu tampil pada setiap hari yang dicakupnya, “Check-in” pada hari pertama dan “Check-out” pada hari terakhir. Propertinya menjadi perhentian pada hari check-in, sehingga peta menggambar jalan ke sana, dan sebuah pemesanan “Akomodasi” muncul di tab “Pesan”.',
  'help.guide.add-accommodation.tip.1':
    'Pemilih terbuka pada hari asal Anda, dengan check-out sehari sesudahnya; keduanya bisa digeser sebelum Anda menyimpan.',
  'help.guide.add-accommodation.tip.2':
    'Beri hotel itu kategori Hotel saat Anda membuatnya, dan “Kategori” di atas daftar mempersempitnya ke hotel-hotel Anda dengan satu klik.',
  'help.guide.add-accommodation.tip.3':
    'Waktunya semua opsional: masa menginap tanpa check-in dan tanpa kode tetap mencakup malam-malamnya dan tetap menggambar rutenya.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Mengubah atau membatalkan malam yang sudah dipesan',
  'help.guide.edit-accommodation.goal':
    'Pindahkan sebuah masa menginap, betulkan waktunya, atau keluarkan lagi dari rencana.',
  'help.guide.edit-accommodation.step.1':
    'Kartunya menampilkan properti dan nomor konfirmasi, pada hari kedatangan beserta jendela check-in dan pada hari keberangkatan beserta waktu check-out.',
  'help.guide.edit-accommodation.step.2':
    'Ikon pensil di kanannya membuka masa menginap itu lagi. Pop-up sekarang berbunyi “Edit akomodasi”.',
  'help.guide.edit-accommodation.step.3':
    'Perbaiki “Check-in”, “Sampai”, “Check-out” dan “Konfirmasi”. Hari-hari di atasnya dan properti di bawahnya juga bisa diubah di sini.',
  'help.guide.edit-accommodation.step.4': 'Klik “Simpan”.',
  'help.guide.edit-accommodation.step.5':
    'Tanda X di sebelah pensil mengakhiri masa menginap itu. Ia tidak bertanya apa pun, dan pemesanan “Akomodasi” yang menyertainya ikut hilang.',
  'help.guide.edit-accommodation.result':
    'Perubahan itu sampai ke setiap hari yang dicakup masa menginap sekaligus, dan ke pemesanan “Akomodasi” di tab “Pesan” bersamanya.',
  'help.guide.edit-accommodation.tip.1':
    'Malam di tengah masa menginap tidak membawa label “Check-in” maupun “Check-out”: hanya hari pertama dan hari terakhir rentang itu yang membawanya.',
  'help.guide.edit-accommodation.tip.2':
    'Membatalkan masa menginap juga mengambil perhentian yang ditaruhnya pada hari check-in dan biaya apa pun yang melekat pada pemesanannya. Pesan lagi malamnya bila itu sebuah kekeliruan.',
  // day-bookings
  'help.guide.day-bookings.title': 'Pemesanan hari itu sekali pandang',
  'help.guide.day-bookings.goal':
    'Lihat di satu tempat apa yang sudah dipesan untuk hari ini dan apakah sudah dikonfirmasi.',
  'help.guide.day-bookings.step.1':
    '“Reservasi” mendaftar pemesanan hari itu: yang bertanggal pada hari itu, dan yang menggantung pada salah satu perhentiannya.',
  'help.guide.day-bookings.step.2':
    'Sebuah baris menampilkan jenis pemesanannya, namanya dan, bila ia milik sebuah perhentian, perhentian itu berwarna abu-abu setelahnya. Waktunya berada di ujung kanan, sebelum titik status.',
  'help.guide.day-bookings.step.3':
    'Warnanya mengatakan posisi sebuah pemesanan: baris hijau sudah dikonfirmasi, baris amber masih tertunda. Hotel tidak ada dalam daftar ini, mereka punya blok sendiri di bawah.',
  'help.guide.day-bookings.step.4':
    'Klik sebuah baris dan pemesanan itu terbuka. “Sunting” di kakinya mengubahnya; pemesanan baru dibuat di tab “Pesan”.',
  'help.guide.day-bookings.result':
    'Semua yang bertanggal pada hari itu, dan semua yang menggantung pada salah satu perhentiannya, ada dalam satu daftar ini.',
  'help.guide.day-bookings.tip.1':
    'Sebuah pemesanan mendarat pada sebuah hari menurut tanggalnya sendiri. Ubah tanggalnya di tab “Pesan” dan ia berpindah ke hari lain dengan sendirinya.',
  'help.guide.day-bookings.tip.2':
    'Tidak adanya blok “Reservasi” berarti hari itu tidak punya pemesanan: ia disembunyikan alih-alih ditampilkan kosong.',
  'help.guide.map-lock.title': 'Mengunci peta',
  'help.guide.map-lock.goal': 'Biarkan peta tetap di tempatnya saat Anda mengeklik hari dan tempat satu per satu.',
  'help.guide.map-lock.step.1':
    'Klik gembok di peta. Selama tertutup, membuka hari atau memilih tempat tidak lagi memperbesar atau menggeser peta.',
  'help.guide.map-lock.result': 'Peta tetap di tempat Anda meninggalkannya selama Anda mengerjakan rencana.',
  'help.guide.map-lock.tip.1': 'Klik gembok lagi agar peta mengikuti pilihan.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Peta',
  'help.ctx.trip-map.summary':
    'Bagian tengah rencana: setiap tempat perjalanan sebagai pin, rute yang menghubungkannya, dan sakelar di sepanjang tepi peta untuk satelit, untuk seluruh perjalanan sekaligus, dan untuk tempat-tempat di sekitar bagian kota yang sedang Anda lihat.',
  'help.ctx.trip-map.bullet.1':
    'Sebuah pin adalah sebuah tempat: fotonya sendiri jika ada, jika tidak warna kategorinya dengan ikon kategori. Arahkan penunjuk ke salah satunya untuk mendapatkan kartu berisi gambar, nama dan alamatnya, ditambah penilaian dan kategorinya bila tempat itu membawanya. Seret sebuah pin ke kartu hari untuk merencanakan tempat itu di sana.',
  'help.ctx.trip-map.bullet.2':
    'Pin yang terlalu berdekatan untuk dibedakan melipat menjadi satu gelembung gelap dengan sebuah angka. Klik gelembung itu dan peta memperbesar ke isinya.',
  'help.ctx.trip-map.bullet.3':
    'Klik sebuah pin untuk membuka tempat itu dalam sebuah kartu di kaki peta, dengan penilaiannya, “File” miliknya dan apa yang bisa dilakukan dengannya berikutnya; klik bagian kosong peta untuk melepaskannya lagi.',
  'help.ctx.trip-map.bullet.4':
    'Dengan sebuah hari terbuka di kolom hari, perhentiannya membawa lencana putih kecil berisi nomornya pada hari itu, dan tempat yang muncul dua kali pada hari itu membawa kedua nomornya.',
  'help.ctx.trip-map.bullet.5':
    'Baris ikon di bagian atas mencari di bagian peta yang terlihat: “Restoran”, “Kafe”, “Bar & hiburan malam”, “Penginapan”, “Tempat wisata”, “Museum & budaya”, “Alam & taman” dan “Aktivitas”. “Cari di area ini” menjalankannya lagi setelah Anda menggeser peta.',
  'help.ctx.trip-map.bullet.6':
    'Klik kanan di mana saja pada peta untuk membuka formulir tempat pada titik itu, dengan alamat yang sudah dicarikan. Tombol bundar di kiri bawah menukar peta gambar dengan citra udara, dan gembok menahan tampilan di tempatnya saat Anda mengeklik hari dan tempat.',
  'help.ctx.trip-map.bullet.7':
    '“Tampilkan seluruh perjalanan” di kanan bawah menggambar setiap hari perjalanan sekaligus dan mendaftar apa yang ditempuh masing-masing; ikon rute pada baris sebuah pemesanan menggambar pemesanan itu, dan ikon di bilah alat di atas hari menggambar semuanya. Klik ujung sebuah pemesanan yang tergambar untuk membuka detailnya.',
  'help.ctx.trip-map.bullet.8':
    'Dengan addon Dawarich menyala, tombol Dawarich bundar di bawah “Tampilkan seluruh perjalanan” menggambar rute yang benar-benar direkam ponsel Anda: “Tampilkan rute terekam” meletakkannya putus-putus di bawah rute yang direncanakan, satu warna per hari, dan label tombol itu mengatakan mengapa tidak ada garis ketika memang tidak ada.',
  // map-markers
  'help.guide.map-markers.title': 'Membaca peta',
  'help.guide.map-markers.goal': 'Ketahui apa yang dikatakan setiap pin, lencana dan gelembung di peta kepada Anda.',
  'help.guide.map-markers.step.1':
    'Peta memuat setiap tempat perjalanan. Di tempat pin duduk terlalu berdekatan untuk dibedakan, mereka melipat menjadi satu gelembung gelap yang membawa jumlahnya di dalamnya; klik gelembung itu dan peta memperbesar ke apa yang tadi ada di dalamnya, atau, pada perbesaran terdalam, mengipaskan pin-pin itu.',
  'help.guide.map-markers.step.2':
    'Sebuah pin adalah foto tempat itu sendiri jika ada, jika tidak warna kategorinya dengan ikon kategori. Arahkan penunjuk ke salah satunya dan sebuah kartu terbuka di sebelahnya: foto yang sama dalam ukuran lebih besar, nama dan alamatnya, dengan penilaian dan kategorinya bila tempat itu membawanya.',
  'help.guide.map-markers.step.3':
    'Klik sebuah pin dan tempat itu terbuka dalam sebuah kartu di kaki peta: gambar, nama dan alamat di kepalanya, lalu bintang, deskripsi dan file, dan di sepanjang bagian bawah apa yang bisa dilakukan berikutnya dengannya, di antaranya “Navigasi”, “Simpan ke Koleksi” (“Tersimpan” begitu tempat itu ada di sebuah koleksi), “Sunting” dan “Hapus”, serta selama sebuah hari terbuka “Tambah ke Hari”, atau “Hapus dari Hari” bila tempat itu sudah ada di hari tersebut. Tanda X di kepalanya, atau klik pada bagian kosong peta, menutupnya lagi.',
  'help.guide.map-markers.step.4':
    'Buka sebuah hari di kolom hari dan perhentiannya mendapat nomor: lencana putih kecil di sudut pin adalah urutan perhentian itu pada hari tersebut. Tempat yang muncul dua kali pada hari itu membawa kedua nomornya. Tanpa hari terbuka tidak ada nomor, dan sudut itu membawa penilaian tempat tersebut sebagai gantinya, bila ada.',
  'help.guide.map-markers.step.5':
    'Seret sebuah pin dari peta ke kartu hari di kolom hari dan tempat itu direncanakan pada hari tersebut, persis seperti menyeret barisnya keluar dari daftar tempat.',
  'help.guide.map-markers.result':
    'Tidak ada yang berubah pada perjalanan: peta adalah tampilannya, dan setiap pin mengatakan tempat mana, hari mana dan dalam urutan mana.',
  'help.guide.map-markers.tip.1':
    'Hari yang dilipat tertutup di kolom hari membawa perhentiannya turun dari peta juga; buka hari itu lagi dan mereka kembali.',
  'help.guide.map-markers.tip.2':
    'Filter di atas daftar tempat juga menentukan apa yang digambar peta: pilih “Belum direncanakan” dan hanya tempat yang masih tanpa hari yang tersisa di atasnya.',
  'help.guide.map-markers.tip.3':
    'Tidak ada tombol perbesaran pada peta ini: roda tetikus memperbesar dan memperkecil, klik ganda memperbesar satu langkah, dan menyeret petanya sendiri memindahkannya.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Menemukan tempat di sekitar Anda pada peta',
  'help.guide.map-nearby-places.goal':
    'Biarkan peta mencari restoran, tempat wisata atau hotel di bagian kota yang sedang Anda lihat, lalu bawa salah satunya ke perjalanan.',
  'help.guide.map-nearby-places.step.1':
    'Baris ikon di bagian atas peta adalah pencarian kategori: “Restoran”, “Kafe”, “Bar & hiburan malam”, “Penginapan”, “Tempat wisata”, “Museum & budaya”, “Alam & taman” dan “Aktivitas”.',
  'help.guide.map-nearby-places.step.2':
    'Klik sebuah kategori. TREK mencari tempat jenis itu di bagian peta yang terlihat dan menjatuhkan pin dalam warna kategori untuk setiap temuan. Satu kategori pada satu waktu: mengklik yang lain menukarnya, dan mengklik yang sedang aktif mematikannya.',
  'help.guide.map-nearby-places.step.3':
    'Geser peta dan tombol kedua muncul di bawah baris itu: “Cari di area ini” menjalankan pencarian yang sama untuk tampilan baru. Menggeser saja tidak pernah mencari lagi, sehingga jumlah permintaan tetap rendah.',
  'help.guide.map-nearby-places.step.4':
    'Arahkan penunjuk ke sebuah pin untuk melihat nama dari apa yang ditemukannya. Klik pin itu dan formulir tempat terbuka sudah terisi dari situ: nama di kepala dialog, “Alamat”, “Lintang” dan “Bujur”, serta “Situs web” bila pencarian menemukannya.',
  'help.guide.map-nearby-places.step.5':
    'Periksa apa yang terisi dan tambahkan apa yang tidak bisa diketahui pencarian: sebuah kategori dari pil di bawah nama, yang bertuliskan “Tanpa Kategori” sampai Anda memilihnya, sebuah “Deskripsi”, catatan Anda sendiri.',
  'help.guide.map-nearby-places.step.6':
    'Klik “Tambah”. Jika tempat dengan nama yang sama atau di titik yang sama sudah ada di perjalanan, TREK mengatakannya dan tombol berubah menjadi “Tetap tambahkan”.',
  'help.guide.map-nearby-places.result':
    'Tempat itu ada di daftar tempat dan di peta sebagai salah satu pin milik perjalanan, di bawah “Belum direncanakan” sampai Anda menaruhnya pada sebuah hari. Pin pencarian tetap ada sampai Anda mematikan kategorinya.',
  'help.guide.map-nearby-places.tip.1':
    'Baris itu hilang ketika “Jelajahi tempat di peta” dimatikan di “Pengaturan”, di bawah “Travel & map”.',
  'help.guide.map-nearby-places.tip.2':
    'Jawabannya datang dari indeks tempat TREK dan dari OpenStreetMap, jadi ini salah satu dari sedikit hal pada rencana yang membutuhkan koneksi.',
  'help.guide.map-nearby-places.tip.3':
    'Sebuah pencarian mencakup apa yang ada di layar, jadi perbesar ke jalan yang Anda tanyakan: satu kota penuh menjawab dengan enam puluh temuan pertama dan sedikit keteraturan di antaranya.',
  // map-add-place
  'help.guide.map-add-place.title': 'Membuat tempat dengan klik kanan pada peta',
  'help.guide.map-add-place.goal':
    'Taruh sebuah tempat tepat di mana Anda menginginkannya, tanpa mencarinya lebih dulu.',
  'help.guide.map-add-place.step.1':
    'Klik kanan titik pada peta yang Anda maksud. Formulir tempat terbuka, dengan “Tambah Tempat/Aktivitas” di kepalanya.',
  'help.guide.map-add-place.step.2':
    '“Lintang” dan “Bujur” sudah berada pada titik itu, dan TREK mencari koordinat tersebut lalu mengisi “Alamat” dari apa yang ditemukannya di sana, dan nama di kepala dialog juga bila pencarian itu punya satu untuk diberikan. Belum ada yang tersimpan, jadi timpa apa pun yang keliru.',
  'help.guide.map-add-place.step.3':
    'Ketik nama yang akan Anda kenali ke kepala dialog, pilih sebuah kategori dari pil di bawahnya, yang bertuliskan “Tanpa Kategori” sampai Anda memilih, dan tambahkan selebihnya yang perlu diketahui rencana: “Deskripsi”, “Catatan”, “Situs web”.',
  'help.guide.map-add-place.step.4':
    'Klik “Tambah”. Tempat itu mendarat di daftar sebagai belum direncanakan bahkan dengan sebuah hari terbuka: klik kanan pada peta mengatakan di mana, bukan kapan.',
  'help.guide.map-add-place.result':
    'Tempat itu ada di daftar dan di peta, di bawah “Belum direncanakan” sampai Anda menaruhnya pada sebuah hari.',
  'help.guide.map-add-place.tip.1':
    'Alamat berasal dari pencarian balik koordinat, jadi bisa terbaca sebagai sebuah jalan alih-alih sebuah nama, dan di atas daerah terbuka bisa kembali kosong. Kedua bidang itu milik Anda untuk ditimpa.',
  'help.guide.map-add-place.tip.2':
    'Pada peta MapLibre GL dan Mapbox GL klik tengah melakukan hal yang sama, dan pada layar sentuh tekan lama.',
  // map-satellite
  'help.guide.map-satellite.title': 'Beralih ke satelit',
  'help.guide.map-satellite.goal': 'Tukar peta gambar dengan citra udara, dan kembali lagi.',
  'help.guide.map-satellite.step.1':
    'Tombol bundar di kiri bawah peta adalah sakelar lapisan dasar. Ikonnya selalu menunjukkan lapisan yang akan dituju, dan mengarahkan penunjuk ke sana mengatakan yang mana: “Beralih ke tampilan satelit”. Klik tombol itu.',
  'help.guide.map-satellite.step.2':
    'Peta kini adalah citra udara, cukup dalam untuk membedakan satu bangunan dan tanpa kunci milik Anda sendiri. Semua yang digambar TREK tetap berada di atasnya: pin, rute hari itu, trek dan rute pemesanan.',
  'help.guide.map-satellite.step.3':
    'Tombol itu kini berbunyi “Beralih ke tampilan peta”. Klik untuk kembali ke peta yang digambar.',
  'help.guide.map-satellite.result': 'Peta digambar lagi, dan lapisan yang Anda tinggalkan diingat pada akun Anda.',
  'help.guide.map-satellite.tip.1':
    'Pilihan itu disimpan pada akun Anda, bukan pada perjalanan, jadi setiap perjalanan terbuka seperti Anda meninggalkannya, apa pun perender peta yang Anda pakai.',
  'help.guide.map-satellite.tip.2':
    'Citra itu tidak membawa tulisan: nama jalan, distrik dan nomor rumah ada pada peta gambar, jadi beralihlah kembali ketika Anda mencari sebuah alamat.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Melihat seluruh perjalanan dan jaraknya',
  'help.guide.map-whole-trip.goal':
    'Tukar satu hari yang terbuka dengan setiap hari perjalanan, dan baca seberapa jauh masing-masing menempuh.',
  'help.guide.map-whole-trip.step.1':
    'Tombol bundar “Tampilkan seluruh perjalanan” berada di kanan bawah peta. Klik tombol itu dan setiap hari perjalanan digambar sekaligus, masing-masing dalam warnanya sendiri, sehingga hari yang bertetangga tetap terpisah.',
  'help.guide.map-whole-trip.step.2':
    'Kartu di atas tombol mendaftar hari-hari itu: sebuah titik warna, nama hari, sebuah ikon untuk setiap cara Anda menempuhnya, dan jarak yang dicakupnya. “Jarak total” ada di bagian atas.',
  'help.guide.map-whole-trip.step.3':
    'Klik sebuah hari di kartu untuk memilihnya: barisnya disorot dan hari itu terbuka di kolom hari. Putar roda tetikus di atas sebuah kota untuk memperbesar, dan hari-hari yang melewatinya terbentang berdampingan, masing-masing dalam warnanya.',
  'help.guide.map-whole-trip.step.4':
    'Tombol itu kini berbunyi “Sembunyikan seluruh perjalanan”. Tekan untuk turun kembali ke satu hari yang terbuka.',
  'help.guide.map-whole-trip.result':
    'Setiap hari perjalanan digambar dalam warnanya sendiri, dan kartu itu mengatakan apa yang ditempuh masing-masing dan berapa jumlahnya bagi perjalanan.',
  'help.guide.map-whole-trip.tip.1':
    'Totalnya tiba beberapa ruas sekaligus. Selama sebuah … mengikutinya, angka itu masih jumlah sebagian; ia mengendap begitu setiap ruas menjawab.',
  'help.guide.map-whole-trip.tip.2':
    'Ruas yang ditolak perute tetap berupa garis lurus dan tidak dihitung, dan kartu itu mengatakannya alih-alih diam-diam terbaca rendah.',
  'help.guide.map-whole-trip.tip.3':
    'Hari tanpa apa pun untuk disambung (kurang dari dua perhentian berkoordinat dan tanpa perjalanan ke atau dari hotelnya) tidak punya rute untuk digambar, jadi ia ditinggalkan dari kartu sepenuhnya.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Menampilkan rute sebuah pemesanan di peta',
  'help.guide.map-booking-routes.goal':
    'Gambar penerbangan, kereta dan perjalanan mobil yang Anda pesan di peta, lalu singkirkan lagi.',
  'help.guide.map-booking-routes.step.1':
    'Rute pemesanan mati sampai Anda meminta salah satunya. Di ujung kanan baris sebuah transportasi di kolom hari duduk ikon rute kecil: “Tampilkan rute pemesanan”.',
  'help.guide.map-booking-routes.step.2':
    'Klik ikon itu. Pemesanan muncul di peta: penerbangan sebagai busur lingkaran besar, perjalanan mobil menyusuri jalan sungguhan, kereta sebagai rangkaian stasiunnya. “Dikonfirmasi” digambar padat, “Tertunda” putus-putus, dan ujung-ujung rute adalah pil biru dengan ikon transportasinya.',
  'help.guide.map-booking-routes.step.3':
    'Klik sebuah pil ujung dan detail pemesanan terbuka: status, jenis dan hari sebagai pil di kepala yang berwarna, waktu di kedua ujung, selebihnya di bawah, dan di kaki “Di peta”, yang mematikan rute ini lagi, tempat sampah yang menghapus pemesanan, dan “Sunting”. Tanda X di kepala menutupnya.',
  'help.guide.map-booking-routes.step.4':
    'Ikon rute di bilah alat di atas hari melakukannya untuk seluruh perjalanan sekaligus: “Tampilkan semua rute pemesanan” menggambar setiap pemesanan yang punya rute.',
  'help.guide.map-booking-routes.step.5':
    'Itu adalah papan bersih alih-alih lapisan di atasnya, jadi apa pun yang Anda pilih pemesanan demi pemesanan akan gugur. Tekan lagi, yang kini berbunyi “Sembunyikan semua rute pemesanan”, dan peta menjadi bersih.',
  'help.guide.map-booking-routes.result':
    'Pemesanan yang Anda minta digambar di peta, dan pilihan itu disimpan untuk perjalanan ini di peramban ini sampai Anda mengubahnya.',
  'help.guide.map-booking-routes.tip.1':
    'Ujung-ujung itu membawa kode bandara atau nama stasiun hanya ketika “Label rute pemesanan” aktif di “Pengaturan”, di bawah “Travel & map”; jika tidak, mereka hanya menampilkan ikonnya.',
  'help.guide.map-booking-routes.tip.2':
    '“Selalu tampilkan rute pemesanan”, di pengaturan yang sama, menggambarnya sejak awal pada setiap perjalanan yang belum Anda putuskan.',
  'help.guide.map-booking-routes.tip.3':
    'Sebuah pemesanan butuh dua ujung berkoordinat sebelum bisa digambar, jadi hotel atau restoran tidak membawa ikon rute.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Menampilkan rute yang benar-benar Anda tempuh',
  'help.guide.map-dawarich-trail.goal':
    'Letakkan rute yang direkam Dawarich di ponsel Anda di atas peta, putus-putus di samping rute yang Anda rencanakan, dan baca perjalanan hari demi hari sebagaimana yang sebenarnya terjadi.',
  'help.guide.map-dawarich-trail.step.1':
    'Tombol Dawarich bundar duduk di kanan bawah peta, di bawah “Tampilkan seluruh perjalanan”; mengarahkan penunjuk ke atasnya berbunyi “Tampilkan rute terekam”. Klik tombol itu. TREK meminta tanggal perjalanan kepada Dawarich Anda, dan sebuah cincin berputar di sekeliling tombol selama jawabannya dalam perjalanan.',
  'help.guide.map-dawarich-trail.step.2':
    'Rute terekam mendarat sebagai garis putus-putus, satu warna per hari, digambar di bawah rute yang direncanakan agar rencananya tetap terbaca. Tombol itu kini berbunyi “Sembunyikan rute terekam”. Hari dipotong pada tengah malam waktu setempat, dan hari yang dilipat tertutup di kolom hari membawa garis putus-putusnya turun dari peta bersama perhentiannya.',
  'help.guide.map-dawarich-trail.step.3':
    'Klik “Tampilkan seluruh perjalanan” juga, maka setiap hari yang direncanakan digambar utuh di samping rekaman yang putus-putus. Di mana keduanya berjalan bersama, hari itu berjalan sesuai rencana; di mana garis putus-putus menyimpang, di situlah tidak.',
  'help.guide.map-dawarich-trail.result':
    'Apa yang Anda rencanakan dan apa yang benar-benar Anda lakukan ada di peta bersama-sama, putus-putus berhadapan dengan utuh, dan kartu di atas tombol-tombol masih mendaftar hari-hari yang direncanakan beserta jaraknya.',
  'help.guide.map-dawarich-trail.tip.1':
    'Menyala atau mati diingat per perjalanan untuk sesi peramban ini. Selama rute menyala, TREK bertanya lagi kepada Dawarich setiap dua menit, sehingga perjalanan yang sedang berlangsung menyusul tanpa pemuatan ulang; rutenya sendiri tidak pernah disimpan, jadi tidak ada di basis data TREK, tidak di cadangan dan tidak ada saat luring.',
  'help.guide.map-dawarich-trail.tip.2':
    'Label tombol menjelaskan peta yang kosong: “Memuat rute terekam…” selama masih dalam perjalanan, “Tidak ada yang terekam pada tanggal ini”, “Rute terekam tidak dapat dimuat”, atau “Rute terekam memerlukan koneksi” ketika TREK luring.',
  // map-compass
  'help.guide.map-compass.title': 'Memutar peta dan menemukan utara lagi',
  'help.guide.map-compass.goal':
    'Putar peta agar menghadap ke arah tujuan Anda, dan kembalikan ke utara dengan satu klik.',
  'help.guide.map-compass.step.1':
    'Putar peta dengan menyeret memakai tombol kanan, atau tahan Ctrl dan seret dengan tombol kiri; di layar sentuh, putar dengan dua jari. Kompas bundar di sebelah baris ikon kategori di bagian atas peta ikut berputar: panahnya selalu menunjuk utara, jadi ia miring sejauh Anda memutar.',
  'help.guide.map-compass.step.2':
    'Klik kompas itu. “Reset north”, begitu nama tombolnya, mengembalikan peta perlahan ke utara di atas dan ke tampilan datar, dan panahnya berdiri tegak lagi.',
  'help.guide.map-compass.result':
    'Peta kembali dengan utara di atas dan rata, dan tidak ada yang berubah pada perjalanan: kompas hanya menggerakkan kamera.',
  'help.guide.map-compass.tip.1':
    'Kompas hanya ada di peta MapLibre GL dan Mapbox GL; peta Leaflet tidak dapat diputar, jadi tidak memilikinya. “Penyedia peta” di “Pengaturan”, di bawah “Peta”, menentukan mana yang Anda pakai, dan “Simpan Peta” menyimpan pilihan itu.',
  'help.guide.map-compass.tip.2':
    'Klik itu juga menghilangkan kemiringan: seret dengan tombol kanan ke atas atau ke bawah memiringkan tampilan, dan “Reset north” meratakannya bersama putarannya. Di Mapbox GL dengan “Bangunan 3D & medan” menyala, itu juga meratakan tampilan 3D, sampai Anda memiringkannya lagi.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    'Tab tempat kelompok merencanakan bersama, dalam lima kartu: “Chat” di kiri, “Catatan” dan “Tautan” di sebelahnya, “Polling” dan “Berikutnya” di bawahnya. Semua yang ditulis di sini langsung ada di layar setiap anggota lain, tanpa memuat ulang.',
  'help.ctx.trip-collab.bullet.1':
    '“Chat” adalah kartu di kiri. Tulis di “Ketik pesan...” lalu tekan Enter; Shift dan Enter membuat baris baru. Wajah tersenyum menambahkan emoji, “Lampirkan gambar” menggantungkan sampai empat gambar pada pesan.',
  'help.ctx.trip-collab.bullet.2':
    'Arahkan kursor ke sebuah pesan untuk “Balas” dan, pada pesan Anda sendiri, “Hapus”; klik kanan untuk delapan reaksi cepat. Pesan yang dihapus meninggalkan satu baris yang menyebut siapa yang menghapusnya.',
  'help.ctx.trip-collab.bullet.3':
    '“Catatan” adalah papan bersama: “Catatan Baru” di kepalanya menulis satu, dan roda gigi di sebelahnya membuka “Kelola Kategori” untuk nama dan warnanya. Kartu catatan menampilkan kategorinya sebagai titik berwarna dan tautannya sebagai tombol bundar, dan tiga titiknya (“Opsi lainnya”) memuat “Perluas”, “Sematkan”, “Edit” dan “Hapus”.',
  'help.ctx.trip-collab.bullet.4':
    '“Tautan” mengumpulkan alamat yang menjadi sandaran perjalanan. “Tambah tautan” menerima sebuah judul dan alamat http atau https; “Edit tautan”, “Sematkan tautan” dan “Hapus tautan” ada di ekor chip, dan tautan yang disematkan tetap di depan.',
  'help.ctx.trip-collab.bullet.5':
    '“Polling” memutuskan perkara. “Polling Baru” mengajukan sebuah pertanyaan dengan sedikitnya dua pilihan; satu klik pada sebuah pilihan adalah suara Anda, dan gembok (“Tutup”) serta tempat sampah (“Hapus”) di kanan kepala sebuah polling mengakhiri pemungutan suara atau menyingkirkan polling itu.',
  'help.ctx.trip-collab.bullet.6':
    '“Berikutnya” mendaftar perhentian perjalanan yang masih di depan, paling banyak delapan, dengan waktunya dan orang-orang di dalamnya. Ia hanya membaca rencana harian; waktunya diatur di sana.',
  // write-note
  'help.guide.write-note.title': 'Menulis catatan bersama',
  'help.guide.write-note.goal':
    'Taruh apa yang dibutuhkan seluruh kelompok, sebuah aturan, sebuah alamat, sebuah pengingat, di tempat semua orang menemukannya lagi.',
  'help.guide.write-note.step.1':
    'Klik “Catatan Baru” di kepala kartu “Catatan”. Dialog catatan terbuka, dengan kursor sudah berada di kepalanya.',
  'help.guide.write-note.step.2':
    'Ketik judulnya di tempat yang bertuliskan “Judul catatan”, di kepala dialog. Itu satu-satunya yang diwajibkan dialog: “Buat” tetap abu-abu selama belum ada isinya, dan Enter di judul langsung membuat catatannya.',
  'help.guide.write-note.step.3':
    '“Konten” memuat teks dan menerima Markdown: sebuah kata tebal, sebuah daftar, sebuah judul. Kartu menampilkan tiga baris pertama, dan “Perluas” di menunya membuka seluruh catatan.',
  'help.guide.write-note.step.4':
    'Di bawah “Kategori”, pilih yang sesuai untuk catatan itu; warnanya mewarnai kepala dialog sekarang dan kepala kartu nanti. Pil-pil itu adalah kategori yang sudah ada, dan yang baru dibuat di bawah “Kelola Kategori”.',
  'help.guide.write-note.step.5':
    '“Website” menerima sebuah tautan yang menjadi milik catatan. Kartu lalu membawa tombol tautan bundar di kepalanya yang membukanya.',
  'help.guide.write-note.step.6':
    'Klik “Buat”. Tidak ada yang menutup dialog selain “Batal” dan tanda silangnya, jadi klik nyasar di sebelahnya atau Esc tidak menghilangkan apa yang sudah Anda tulis.',
  'help.guide.write-note.result':
    'Catatan menjadi sebuah kartu di panel “Catatan”, kepalanya diberi warna kategorinya, dan sudah ada di layar setiap anggota lain.',
  'help.guide.write-note.tip.1':
    'Tiga titik pada sebuah kartu (“Opsi lainnya”) memuat “Perluas”, “Sematkan”, “Edit” dan “Hapus”. “Sematkan” menahan catatan di atas panel dalam bingkai berwarna kategorinya; semua yang di bawahnya diurutkan menurut kapan terakhir diubah.',
  'help.guide.write-note.tip.2':
    'Roda gigi di sebelah “Catatan Baru” membuka “Kelola Kategori”: di sana sebuah kategori mendapat warnanya, diganti namanya di semua tempat sekaligus, atau ditambahkan sebelum ada catatan yang memakainya. Tidak ada yang berubah sampai Anda mengklik “Simpan”.',
  'help.guide.write-note.tip.3':
    '“Lampirkan file” menggantungkan sebuah dokumen pada catatan. “Lampirkan” membuka pemilih file, dan sebuah gambar atau PDF juga bisa cukup ditempelkan ke dialog.',
  'help.guide.write-note.tip.4':
    '“Catatan” adalah sakelar tersendiri di bawah “Addon”, di bawah “Collab”: admin bisa mematikannya dan membiarkan “Chat”, “Tautan”, “Jajak Pendapat” dan “Selanjutnya” tetap berjalan.',
  // shared-links
  'help.guide.shared-links.title': 'Mengumpulkan tautan perjalanan',
  'help.guide.shared-links.goal':
    'Simpan portal pemesanan, album bersama dan jadwal di satu tempat alih-alih menggulir chat untuk mencarinya.',
  'help.guide.shared-links.step.1':
    'Klik “Tambah tautan” di kepala kartu “Tautan”. Dialog terbuka dengan kursor di kepalanya.',
  'help.guide.shared-links.step.2':
    'Ketik namanya di tempat yang bertuliskan “Judul tautan”, tempelkan alamatnya ke “Tautan” di bawahnya, lalu klik “Simpan tautan”.',
  'help.guide.shared-links.step.3':
    'Chip menampilkan nama dan situs yang dituju. Satu klik padanya membuka halaman itu di tab baru.',
  'help.guide.shared-links.step.4':
    'Tiga tombol bundar di ekornya adalah “Edit tautan”, “Sematkan tautan” dan “Hapus tautan”. “Sematkan tautan” memindahkan chip ke depan panel, dengan warna aksen; “Hapus tautan” bertanya lebih dulu, karena tautan itu hilang bagi setiap anggota.',
  'help.guide.shared-links.result':
    'Tautan itu menjadi sebuah chip di panel “Tautan”, tersemat di depan, dan langsung ada di layar setiap anggota.',
  'help.guide.shared-links.tip.1':
    'Hanya alamat http atau https yang diterima: yang lain ditolak, dan dialog tetap terbuka dengan apa yang Anda ketik.',
  'help.guide.shared-links.tip.2':
    'Tautan yang disematkan datang lebih dulu, lalu yang terbaru. Ikon kecil di sebelah sebuah judul adalah favicon situs itu sendiri, diambil dari situsnya, jadi tanpa internet chip menampilkan lambang tautan biasa sebagai gantinya.',
  'help.guide.shared-links.tip.3':
    '“Tautan” adalah sakelar tersendiri di bawah “Addon”, di bawah “Collab”, jadi admin bisa mematikan panel itu tanpa menyentuh sisa tab.',
  // create-poll
  'help.guide.create-poll.title': 'Bertanya kepada kelompok',
  'help.guide.create-poll.goal':
    'Ubah pertanyaan yang tak dijawab siapa pun di chat menjadi polling yang bisa dicentang semua orang.',
  'help.guide.create-poll.step.1': 'Klik “Polling Baru” di kepala kartu “Polling”. Dialog terbuka.',
  'help.guide.create-poll.step.2':
    'Tulis pertanyaannya di bawah “Pertanyaan”. “Mendukung Markdown” di bawah kotak berarti sebuah kata tebal, sebuah pemutus baris atau daftar pendek berfungsi di sini.',
  'help.guide.create-poll.step.3':
    'Isi “Pilihan 1” dan “Pilihan 2” di bawah “Pilihan”. Dua pilihan yang ada isinya adalah minimumnya, dan sebuah pilihan bisa terdiri dari beberapa baris.',
  'help.guide.create-poll.step.4':
    '“Tambah pilihan” di bawahnya menambahkan yang ketiga, yang keempat, sebanyak yang Anda perlukan; tanda silang kecil di sebelah sebuah baris, yang ada begitu Anda punya lebih dari dua, menghapusnya lagi.',
  'help.guide.create-poll.step.5':
    '“Pilihan ganda” membuat semua orang bisa mencentang lebih dari satu pilihan. Kalau dibiarkan mati, sebuah suara berpindah ketika seseorang memilih yang lain.',
  'help.guide.create-poll.step.6': 'Klik “Buat Polling”.',
  'help.guide.create-poll.result':
    'Polling itu berdiri di atas panel “Polling”, terbuka, dengan “0 suara” di kepalanya.',
  'help.guide.create-poll.tip.1': 'Pertanyaan ditampilkan sebagai Markdown; pilihan tetap teks biasa.',
  'help.guide.create-poll.tip.2':
    '“Buat Polling” tetap abu-abu selama belum ada pertanyaan dan sedikitnya dua pilihan yang ada isinya.',
  'help.guide.create-poll.tip.3':
    'Tenggat waktu hanya bisa diatur di aplikasi ponsel. Polling yang punya tenggat menampilkan sisa waktu dalam chip kuning tua di kepalanya dan dihitung tertutup begitu waktunya habis.',
  'help.guide.create-poll.tip.4':
    '“Jajak Pendapat” adalah sakelar tersendiri di bawah “Addon”, di bawah “Collab”: admin bisa mematikannya dan membiarkan empat panel lainnya tetap berjalan.',
  // vote-poll
  'help.guide.vote-poll.title': 'Memberi suara dan membaca hasilnya',
  'help.guide.vote-poll.goal': 'Berikan suara Anda, lihat di mana kelompok berdiri, dan ubah pikiran Anda.',
  'help.guide.vote-poll.step.1':
    'Klik pilihan yang Anda mau. Lingkarannya terisi dengan tanda centang, pilihan itu mendapat bingkai berwarna aksen dan batang di belakangnya tumbuh.',
  'help.guide.vote-poll.step.2':
    'Sekarang seluruh hasilnya terbaca: batang adalah porsinya, persentase berdiri di kanan, dan lingkaran-lingkaran kecil adalah orang-orang yang memilih pilihan itu, sampai tiga orang.',
  'help.guide.vote-poll.step.3':
    'Berubah pikiran? Klik pilihan lain. Pada polling tanpa “Pilihan ganda”, suara Anda berpindah alih-alih menambah suara kedua.',
  'help.guide.vote-poll.step.4':
    'Berapa suara yang dimiliki polling itu tertera dalam chip di bawah pertanyaan. Satu klik pada pilihan yang sudah Anda pilih menarik kembali suara Anda, dan hitungannya turun lagi.',
  'help.guide.vote-poll.result':
    'Centang Anda ada pada satu pilihan, batang-batang menunjukkan bagaimana kelompok terbagi, dan lingkaran-lingkaran mengatakan siapa memilih apa.',
  'help.guide.vote-poll.tip.1':
    'Persentase dan siapa memilih apa baru muncul setelah Anda sendiri memberi suara, atau setelah polling ditutup. Jumlah suara di kepala polling terlihat oleh semua orang.',
  'help.guide.vote-poll.tip.2':
    'Sebuah suara tidak pernah anonim: arahkan kursor ke salah satu lingkaran pada sebuah pilihan untuk melihat nama di baliknya.',
  // close-poll
  'help.guide.close-poll.title': 'Menutup polling, atau menyingkirkannya',
  'help.guide.close-poll.goal':
    'Hentikan pemungutan suara begitu kelompok memutuskan, dan bersihkan polling yang tak lagi dibutuhkan siapa pun.',
  'help.guide.close-poll.step.1':
    '“Tutup”, gembok di kanan kepala sebuah polling, mengakhiri pemungutan suara. Pilihan-pilihan berhenti menerima klik.',
  'help.guide.close-poll.step.2':
    'Polling yang ditutup turun ke bawah judul “Ditutup” di dasar panel, mengenakan chip “Ditutup” dan menunjukkan hasilnya kepada semua orang, entah mereka memberi suara atau tidak. Pilihan yang menang dicetak tebal di atas batang hijau; jika itu pilihan Anda, batangnya justru mempertahankan warna aksen Anda.',
  'help.guide.close-poll.step.3':
    '“Hapus”, tempat sampah di kanan kepala, menyingkirkan polling itu; pada polling yang ditutup ia berdiri sendirian di sana, karena gemboknya sudah hilang. Tidak ada yang bertanya dua kali, dan suara-suaranya ikut pergi.',
  'help.guide.close-poll.result':
    'Polling itu lenyap dari panel setiap anggota. Yang hanya Anda tutup tetap terbaca di bawah, beserta hasilnya.',
  'help.guide.close-poll.tip.1':
    'Penutupan tidak bisa dibatalkan: tidak ada buka kembali. Polling yang tertutup karena keliru harus ditanyakan lagi.',
  'help.guide.close-poll.tip.2':
    '“Hapus” membawa pergi polling dan setiap suara di dalamnya untuk semua orang, langsung dan tanpa pertanyaan.',
  // whats-next
  'help.guide.whats-next.title': 'Membaca “Berikutnya”',
  'help.guide.whats-next.goal': 'Lihat apa yang akan dilakukan kelompok berikutnya tanpa membuka rencana.',
  'help.guide.whats-next.step.1':
    'Kartu ini mendaftar perhentian perjalanan yang masih di depan, paling banyak delapan, urut waktu, di bawah satu judul per hari: “Hari ini”, “Besok” atau tanggalnya, dengan judul hari itu di sebelahnya bila ada. Kepala kartu menghitungnya.',
  'help.guide.whats-next.step.2':
    'Di kiri setiap perhentian berdiri waktunya: awalnya, “sampai”, dan akhirnya bila perhentian itu punya, atau TBD bila belum ada waktu yang diatur padanya.',
  'help.guide.whats-next.step.3':
    'Di sebelahnya berdiri nama, alamat dan, sebagai chip, orang-orang pada perhentian itu. Bila tidak ada yang dipilih untuknya, semua orang dalam perjalanan didaftar.',
  'help.guide.whats-next.result':
    'Sebuah daftar tentang apa yang akan datang, hanya untuk dibaca: ia mengikuti rencana, dan tidak ada di sini yang mengubahnya.',
  'help.guide.whats-next.tip.1':
    'Tidak ada yang diatur di sini. Waktunya datang dari rencana harian; ubah di sana dan daftar ini langsung mengikuti.',
  'help.guide.whats-next.tip.2':
    'Hanya yang masih di depan yang didaftar: perhentian yang waktunya sudah lewat rontok, dan di akhir perjalanan panel ini kosong.',
  'help.guide.whats-next.tip.3':
    '“Selanjutnya” adalah sakelar tersendiri di bawah “Addon”, di bawah “Collab”, dan ia adalah panel desktop: tab “Collab” aplikasi ponsel tidak menawarkannya.',
  // trip-chat
  'help.guide.trip-chat.title': 'Berbicara dengan kelompok',
  'help.guide.trip-chat.goal':
    'Katakan sesuatu, jawab satu pesan tertentu, beri reaksi pada yang lain, dan tarik kembali pesan Anda sendiri.',
  'help.guide.trip-chat.step.1':
    'Tulis di “Ketik pesan...” lalu tekan Enter. Panah bundar di sebelah kotak melakukan hal yang sama; Shift dan Enter justru membuat baris baru.',
  'help.guide.trip-chat.step.2':
    'Wajah tersenyum membuka pemilih emoji, dengan Smileys, Reactions dan Travel di dalamnya. Yang Anda pilih ditambahkan ke apa yang sedang Anda tulis, bukan dikirim sendiri.',
  'help.guide.trip-chat.step.3':
    'Arahkan kursor ke pesan orang lain: sebuah tombol bulat kecil muncul di sudutnya. Itulah “Balas”.',
  'help.guide.trip-chat.step.4':
    'Pesan yang Anda jawab dikutip di atas kotak. Tulis dan kirim, dan kutipan itu ikut dalam gelembung Anda; tanda silang pada kutipan membuangnya lagi.',
  'help.guide.trip-chat.step.5':
    'Klik kanan sebuah pesan untuk delapan reaksi cepat. Reaksi Anda duduk di bawah gelembung, dan klik kedua pada reaksi yang sama menariknya kembali.',
  'help.guide.trip-chat.step.6':
    'Pesan Anda sendiri membawa “Hapus”, tempat sampah, di sebelah “Balas”. Itu langsung membawa pergi pesannya dan meninggalkan satu baris yang berbunyi “menghapus pesan”: tidak ada jalan kembali.',
  'help.guide.trip-chat.result':
    'Jawaban Anda adalah pesan terbaru, dengan pesan yang dikutipnya di bagian atasnya; sebuah reaksi menggantung pada pesan ketiga, dan yang Anda tarik kembali meninggalkan satu baris yang mengatakannya.',
  'help.guide.trip-chat.tip.1':
    'Enter mengirim, Shift dan Enter membuat baris baru. Pesan yang berisi satu sampai tiga emoji dan tidak ada yang lain ditampilkan besar.',
  'help.guide.trip-chat.tip.2':
    '“Lampirkan gambar” menerima sampai empat gambar untuk satu pesan; gambar juga bisa cukup ditempelkan atau dijatuhkan ke kotak.',
  'help.guide.trip-chat.tip.3':
    'Pesan yang berisi tautan mendapat kartu pratinjau di bawahnya, diambil oleh TREK Anda sendiri, jadi tautan ke sesuatu yang hanya bisa Anda capai tetap berupa tautan biasa.',
  'help.guide.trip-chat.tip.4':
    '“Chat” adalah sakelar tersendiri di bawah “Addon”, di bawah “Collab”: admin bisa mematikannya dan membiarkan “Catatan”, “Tautan”, “Jajak Pendapat” dan “Selanjutnya” tetap berjalan.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Daftar',
  'help.ctx.trip-lists.summary':
    'Dua daftar untuk satu perjalanan: daftar bawaan, dengan siapa membawa apa dan berapa beratnya, dan daftar tugas berisi semua yang harus terjadi sebelum dan selama perjalanan. Tab ini ada selama addon “Daftar” menyala.',
  'help.ctx.trip-lists.bullet.1':
    '“Daftar Perlengkapan” dan “Tugas” di bilah atas berganti antara keduanya dan menghitung isi masing-masing; tombol di ujung kanan bilah milik mana pun yang sedang terbuka.',
  'help.ctx.trip-lists.bullet.2':
    'Daftar bawaan dikelompokkan ke dalam daftar, Dokumen, Pakaian, terserah Anda menamainya, masing-masing sebuah kartu yang pita kepalanya memuat titik warna, lencana sudah dikemas dari total, tiga titik berisi “Ganti Nama”, “Centang Semua”, “Hapus Centang Semua” dan “Hapus daftar”, serta panah yang melipat kartu. “Tambah daftar” di bilah atas membuat yang baru.',
  'help.ctx.trip-lists.bullet.3':
    'Sebuah baris adalah kotak centang dan nama, lalu siapa yang membawanya sebagai avatar kecil dan jumlahnya sebagai lencana kecil, selama “Pelacak Tas” menyala juga berat dalam gram dan lingkaran tas, lalu tempat sampah dan tiga titik berisi “Pindahkan ke daftar”, “Berbagi”, “Ganti nama” dan “Hapus”. Yang tidak dipakai sebuah baris tetap redup sampai Anda menunjuknya, dan pegangan di sebelah kiri menyeretnya naik atau turun di dalam daftarnya.',
  'help.ctx.trip-lists.bullet.4':
    '“Bersama” dan “Daftar saya” membelah daftar bawaan menjadi dua: kumpulan yang dilihat semua orang, dan milik Anda sendiri. “Semua”, “Belum” dan “Selesai” di sebelahnya mempersempit mana pun yang terbuka, dan kartu kemajuan di atas menghitung apa yang sudah dikemas.',
  'help.ctx.trip-lists.bullet.5':
    '“Terapkan template” dan “Simpan sebagai template” mengisi atau menyimpan sebuah daftar tanpa mengetiknya, dan dua ikon sesudahnya, “Ekspor” dan “Impor”, mengeluarkan daftar sebagai cetakan, PDF, atau file, dan memasukkan sebuah daftar. Tombol merah di ujung kanan kartu kemajuan menyebut berapa item yang tercentang lalu menyingkirkannya.',
  'help.ctx.trip-lists.bullet.6':
    '“Tugas” punya bilah sisi sendiri: kartu kemajuan, filter “Semua”, “Tugasku”, “Terlambat” dan “Selesai”, satu baris per daftar dan “Tambah daftar” di bawahnya. Tugas-tugas berada di sebuah kartu yang kepalanya menyebut nama filter dan memuat pengurutan, “Prioritas” atau “Tenggat waktu”. Klik pada sebuah tugas membukanya di panel sebelah kanan, dan “Tugas baru” di bilah membuka dialog “Tugas baru”.',
  // packing-categories
  'help.guide.packing-categories.title': 'Membangun daftar bawaan',
  'help.guide.packing-categories.goal':
    'Kelompokkan apa yang Anda bawa ke dalam daftar, isi dengan item, dan tentukan siapa yang mengurus tiap daftar.',
  'help.guide.packing-categories.step.1':
    'Klik “Tambah daftar” di bilah di atas daftar. Sebuah dialog kecil terbuka: ketik namanya ke pita kepalanya, tempat tertulis “Nama daftar (mis. Pakaian)”, dan klik “Tambah”.',
  'help.guide.packing-categories.step.2':
    'Daftar baru dimulai dengan baris pengganti yang hanya menampilkan tiga titik samar. Klik “Tambah item” di kakinya, ketik item ke “Nama item...” lalu tekan Enter: item pertama menggantikan baris pengganti itu, dan kolomnya tetap terbuka untuk item berikutnya.',
  'help.guide.packing-categories.step.3':
    'Ganti nama sebuah baris dengan mengklik namanya, atau dengan “Ganti nama” di tiga titik di ujung kanannya.',
  'help.guide.packing-categories.step.4':
    'Lingkaran putus-putus bergambar orang di pita kepala daftar menetapkan anggota perjalanan ke daftar itu. Pilih sebuah nama; chip yang muncul menghapus orang itu lagi dengan satu klik.',
  'help.guide.packing-categories.step.5':
    'Tiga titik di sebelah hitungan memuat sisanya: “Ganti Nama”, “Centang Semua”, “Hapus Centang Semua”, dan “Hapus daftar”, yang mengambil daftar itu beserta seluruh isinya tanpa bertanya lagi. Panah di ujung kanan melipat daftar itu.',
  'help.guide.packing-categories.result':
    'Daftar baru duduk di kisi dengan item-itemnya di bawahnya dan titik warnanya, dan lencananya menghitung apa yang sudah dikemas.',
  'help.guide.packing-categories.tip.1':
    'Sebuah daftar hanyalah item-itemnya. Hapus yang terakhir dan baris itu berubah menjadi penampung sehingga daftar mempertahankan tempat dan warnanya; hapus baris itu juga dan daftarnya lenyap.',
  'help.guide.packing-categories.tip.2':
    'Menetapkan seseorang ke sebuah daftar mengirimkan notifikasi daftar bawaan kepadanya. Itu tidak mengubah siapa yang bisa melihat item, itu urusan “Berbagi” di tiga titik sebuah baris.',
  'help.guide.packing-categories.tip.3':
    'Dua daftar boleh memakai nama yang sama. TREK memisahkan keduanya secara internal, jadi namanya tetap seperti yang Anda ketik.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Mencentang sambil berkemas',
  'help.guide.check-off-packing.goal':
    'Tandai apa yang sudah masuk tas, perhatikan bilahnya, dan bersihkan item yang sudah dikemas.',
  'help.guide.check-off-packing.step.1':
    'Klik kotak di sebelah kiri sebuah baris. Namanya dicoret dan bilahnya bergerak.',
  'help.guide.check-off-packing.step.2':
    'Kartu kemajuan di atas daftar menghitung apa yang sudah dikemas terhadap seluruh isi daftar, sebagai angka, sebagai persentase dan sebagai bilah.',
  'help.guide.check-off-packing.step.3':
    'Satu daftar penuh sekaligus: tiga titik di pita kepalanya memuat “Centang Semua” dan “Hapus Centang Semua”.',
  'help.guide.check-off-packing.step.4':
    '“Semua”, “Belum” dan “Selesai” di sebelah “Bersama” dan “Daftar saya” mempersempit kisi. “Belum” hanya menyisakan yang masih kurang, jadi daftar yang sudah terkemas penuh keluar dari situ.',
  'help.guide.check-off-packing.step.5':
    '“Hapus 3 yang dicentang” di ujung kanan kartu kemajuan menghapus setiap item tercentang sekaligus, setelah satu konfirmasi dari peramban.',
  'help.guide.check-off-packing.result':
    'Hanya yang masih terbuka yang terdaftar, dan bilah di atas mengatakan sejauh mana pengemasan sudah berjalan.',
  'help.guide.check-off-packing.tip.1': 'Item yang tercentang tetap bisa diganti namanya: klik namanya.',
  'help.guide.check-off-packing.tip.2':
    '“Centang Semua” dan “Hapus Centang Semua” bekerja pada satu daftar saja, dari tiga titik milik daftar itu sendiri.',
  'help.guide.check-off-packing.tip.3':
    'Ketika setiap item tercentang, penghitungnya digantikan oleh “Semua sudah dikemas!” dan bilahnya menjadi hijau.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Menerapkan template bawaan',
  'help.guide.apply-packing-template.goal':
    'Bawa daftar siap pakai ke dalam perjalanan, dan simpan daftar perjalanan ini untuk perjalanan berikutnya.',
  'help.guide.apply-packing-template.step.1': 'Klik “Terapkan template” di bilah atas daftar.',
  'help.guide.apply-packing-template.step.2':
    'Pilih sebuah template. Tiap baris menyebut namanya dan berapa item yang dimuatnya.',
  'help.guide.apply-packing-template.step.3':
    'Item mendarat di tampilan tempat Anda berada: “Bersama” menaruhnya di kumpulan yang dilihat semua orang, “Daftar saya” menjadikannya milik Anda.',
  'help.guide.apply-packing-template.step.4':
    'Simpan daftar perjalanan ini untuk perjalanan berikutnya: “Simpan sebagai template” membuka dialog kecil. Ketik sebuah nama ke pita kepalanya, tempat tertulis “Nama template”, dan klik “Simpan”.',
  'help.guide.apply-packing-template.result':
    'Daftar dan item dari template ada di perjalanan, di samping apa yang sudah ada sebelumnya.',
  'help.guide.apply-packing-template.tip.1':
    'Sebuah template hanya membawa nama dan daftar. Jumlah, berat, tas dan apa yang sudah tercentang tertinggal.',
  'help.guide.apply-packing-template.tip.2':
    '“Terapkan template” baru ada begitu sebuah template ada. Tanpa template, tombolnya tidak muncul sama sekali.',
  'help.guide.apply-packing-template.tip.3':
    '“Simpan sebagai template” hanya muncul untuk admin instans, dan hanya selama daftarnya berisi item. Ia menyimpan kumpulan bersama ditambah item Anda sendiri, tidak pernah item pribadi anggota lain.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Menempelkan seluruh daftar bawaan',
  'help.guide.import-packing-list.goal':
    'Ubah daftar yang sudah Anda punya di tempat lain menjadi item bawaan sekaligus.',
  'help.guide.import-packing-list.step.1':
    'Klik “Impor”, ikon dengan panah ke bawah di ujung kanan bilah di atas daftar.',
  'help.guide.import-packing-list.step.2':
    'Satu item per baris: Kategori, Nama, Berat dalam g (opsional), Tas (opsional), checked/unchecked (opsional). Contoh abu-abu di dalam kotak memperlihatkan keempat bentuknya, dan angka di sepanjang tepi kirinya menghitung baris yang Anda ketik. Daftar Markdown juga bisa: judul menjadi nama daftar, dan "- [ ]" serta "- [x]" menjadi item.',
  'help.guide.import-packing-list.step.3':
    'Atau muat barisnya dari sebuah file dengan “Muat CSV/TXT/MD”, di kiri bawah dialog. Ia menerima .csv, .txt, atau .md dan menggantikan apa pun yang ada di kotak.',
  'help.guide.import-packing-list.step.4':
    'Klik “Impor 3” di kanan bawah; angka padanya menghitung baris yang dipahami TREK.',
  'help.guide.import-packing-list.result':
    'Setiap baris menjadi satu baris item, di daftar yang disebut bidang pertamanya, dan tidak ada yang sudah ada di sana yang tersentuh.',
  'help.guide.import-packing-list.tip.1':
    'Koma, titik koma dan tab sama-sama memisahkan bidang, dan tanda kutip ganda menyatukan sebuah bidang, jadi “Shirt, blue” tetap satu nama. Baris dengan satu nilai hanyalah sebuah nama, baris tanpa daftar sendiri mendarat di “Lainnya”, dan "3x" di depan nama menentukan jumlahnya.',
  'help.guide.import-packing-list.tip.2':
    'Tas yang disebut di bidang keempat dibuat jika perjalanan belum memilikinya. Ini satu-satunya tempat yang memuat berat dan tas secara massal; sebuah template hanya membawa nama dan daftar.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Mencetak atau mengekspor daftar bawaan',
  'help.guide.export-packing-list.goal':
    'Bawa daftar di atas kertas, sebagai PDF, atau sebagai file untuk aplikasi lain atau perjalanan berikutnya.',
  'help.guide.export-packing-list.step.1':
    'Klik “Ekspor”, ikon dengan panah ke atas di bilah di atas daftar, tepat sebelum “Impor”.',
  'help.guide.export-packing-list.step.2':
    '“Daftar periksa Markdown (.md)” dan “CSV untuk impor (.csv)” langsung menyimpan daftar sebagai file.',
  'help.guide.export-packing-list.step.3':
    'Klik “Cetak atau simpan sebagai PDF”. Pratinjau menampilkan daftar sebagai satu halaman: perjalanan, tanggalnya dan berapa yang sudah dikemas di atas, lalu setiap daftar sebagai kartu, setiap item dengan kotak untuk dicentang.',
  'help.guide.export-packing-list.step.4':
    'Klik “Cetak atau simpan sebagai PDF” di bawah pratinjau. Browser membuka dialog cetaknya: pilih printer, atau “Simpan sebagai PDF” untuk menyimpan file.',
  'help.guide.export-packing-list.result':
    'Hasil cetak dan file berisi tampilan yang sedang terbuka, “Bersama” atau “Daftar saya”, lengkap dengan jumlah, berat, dan tanda centang.',
  'help.guide.export-packing-list.tip.1':
    'CSV adalah format yang dibaca “Impor”, termasuk tas, jadi bisa dipakai sebagai template bawaan milik Anda sendiri: impor ke perjalanan berikutnya.',
  'help.guide.export-packing-list.tip.2':
    'File Markdown terbuka sebagai daftar periksa di Obsidian, Notion, atau GitHub, dan bisa masuk kembali lewat “Impor” dengan cara yang sama.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Menentukan siapa melihat sebuah item dan siapa membawanya',
  'help.guide.share-packing-item.goal':
    'Pindahkan sebuah item antara kumpulan grup, daftar Anda sendiri dan orang-orang yang Anda bawakan.',
  'help.guide.share-packing-item.step.1':
    '“Bersama” di atas daftar adalah kumpulan yang dilihat semua orang, “Daftar saya” adalah milik Anda, dan masing-masing menghitung isinya. Klik “Daftar saya” untuk melihat milik Anda.',
  'help.guide.share-packing-item.step.2':
    'Kembali di “Bersama”, buka tiga titik di ujung sebuah baris dan klik “Berbagi”.',
  'help.guide.share-packing-item.step.3':
    'Tiga tingkat: “Bersama”, di kumpulan grup dan terlihat oleh semua orang; “Pribadi”, yang hanya Anda yang melihatnya; dan “Bagikan dengan…”, tempat Anda memilih orang-orang yang tercakup item itu.',
  'help.guide.share-packing-item.step.4':
    'Item “Pribadi” hanya ada di “Daftar saya”. Pindah ke sana untuk menemukannya.',
  'help.guide.share-packing-item.step.5':
    'Buka “Berbagi” lagi dan centang sebuah nama di bawah “Bagikan dengan…”. Item itu tampil di daftar orang tersebut juga, dan barisnya mendapat lencana kecil yang menghitung dengan berapa orang item itu dibagikan.',
  'help.guide.share-packing-item.result':
    'Item itu berada di tingkat yang Anda pilih, dan barisnya mengatakan siapa yang membawanya.',
  'help.guide.share-packing-item.tip.1':
    'Hanya orang yang membawa sebuah item yang mengubah berbaginya. Orang yang Anda beri bagian melihatnya di “Daftar saya” miliknya sendiri dengan lencana tangan kecil yang menyebut nama Anda saat ia menunjuknya, dan bisa mencentangnya.',
  'help.guide.share-packing-item.tip.2':
    'Pada item bersama yang dibawa orang lain, tiga titik memuat dua entri lain sebagai ganti “Berbagi”: “Saya juga bisa membawanya”, yang menambahkan Anda di sebelahnya, dan “Salin ke daftar saya”, yang membuat salinan pribadi milik Anda sendiri.',
  'help.guide.share-packing-item.tip.3':
    'Item baru mewarisi tampilan tempat Anda menambahkannya. Ditambahkan di “Daftar saya” item menjadi “Pribadi”, ditambahkan di “Bersama” item masuk ke kumpulan.',
  // packing-bags
  'help.guide.packing-bags.title': 'Menimbang tas',
  'help.guide.packing-bags.goal':
    'Beri berat pada setiap item, pilah item ke dalam tas, dan jaga tiap tas tetap di bawah batas maskapai.',
  'help.guide.packing-bags.step.1': 'Klik lencana berat sebelum lingkaran dan ketik berat item dalam gram.',
  'help.guide.packing-bags.step.2': 'Lingkaran sesudah berat adalah tas item itu. Klik lingkaran itu.',
  'help.guide.packing-bags.step.3':
    'Belum ada tas: “Tambah tas”, sebuah nama, Enter. Tas itu dibuat dan itemnya langsung masuk ke dalamnya.',
  'help.guide.packing-bags.step.4':
    'Kartu “Tas” muncul di sebelah kanan daftar begitu satu tas ada: nama, siapa yang membawanya, bilah isian, berapa item di dalamnya dan beratnya, lalu “Belum ditugaskan” dan “Total berat”.',
  'help.guide.packing-bags.step.5':
    'Klik “Atur batas” di sebelah berat tas dan ketik batasnya dalam kilogram, sebagaimana maskapai menyebutkannya.',
  'help.guide.packing-bags.step.6':
    'Tanda plus putus-putus di ujung baris nama tas, tepat sebelum tanda silang, membuka “Tetapkan anggota”: centang siapa yang membawa tas itu, dan mereka muncul di sebelah tanda plus.',
  'help.guide.packing-bags.result':
    'Kartu “Tas” di sebelah kanan memperlihatkan berat tiap tas terhadap batasnya, apa yang tidak berada di tas mana pun, dan totalnya.',
  'help.guide.packing-bags.tip.1':
    'Kolom berat, lingkaran tas dan kartu “Tas” hanya ada selama seorang admin menyalakan “Pelacak Tas” di bawah addon “Daftar”. Di jendela yang lebih sempit, tas justru dibuka dari tombol “Tas” di atas kartu kemajuan.',
  'help.guide.packing-bags.tip.2':
    'Berat sebuah tas dijumlahkan di server atas item setiap anggota, termasuk yang tidak bisa Anda lihat, jadi angkanya benar-benar berat tas itu.',
  'help.guide.packing-bags.tip.3':
    'Tas tanpa batas digambarkan terhadap tas terberat, sehingga bilahnya tetap bisa dibandingkan. Beri batas dan bilahnya dibaca terhadap batas itu.',
  // create-todo
  'help.guide.create-todo.title': 'Menambahkan tugas',
  'help.guide.create-todo.goal':
    'Catat sesuatu yang harus terjadi, dengan sebuah daftar, prioritas, tanggal dan nama di belakangnya.',
  'help.guide.create-todo.step.1': 'Klik “Tugas baru” di ujung kanan bilah.',
  'help.guide.create-todo.step.2':
    'Dialog “Tugas baru” terbuka dengan kursor di pita kepalanya: ketik namanya di tempat tertulis “Nama tugas”, dan taruh apa pun yang layak diingat di bawah “Deskripsi”.',
  'help.guide.create-todo.step.3':
    '“Daftar” mengelompokkan tugas. Pilih satu, atau gunakan tanda plus di sebelahnya untuk menamai daftar baru di sebuah dialog kecil.',
  'help.guide.create-todo.step.4':
    '“Prioritas” adalah empat tombol: “Tidak ada”, P1, P2 dan P3, dari merah turun ke biru.',
  'help.guide.create-todo.step.5':
    '“Tenggat waktu”, di sebelah “Daftar”, membuka kalender, dan “Ditugaskan ke” menaruh sebuah nama pada tugas.',
  'help.guide.create-todo.step.6': 'Klik “Buat tugas”.',
  'help.guide.create-todo.result':
    'Tugas itu ada di daftar dengan prioritas, tenggat waktu dan daftar sebagai lencana serta avatar orang yang ditugaskan di ujung baris, dan ia terbuka di panel sebelah kanan.',
  'help.guide.create-todo.tip.1':
    'Hanya namanya yang wajib. Semua yang lain bisa diisi belakangan dari panel di sebelah kanan.',
  'help.guide.create-todo.tip.2': 'Dengan sebuah daftar terpilih di bilah sisi, tugas baru dimulai di daftar itu.',
  'help.guide.create-todo.tip.3': 'Enter di kolom nama langsung membuat tugasnya, tanpa menyentuh kolom yang lain.',
  // todo-filters
  'help.guide.todo-filters.title': 'Menemukan dan mengubah tugas',
  'help.guide.todo-filters.goal':
    'Pangkas daftar tugas sampai tinggal yang penting sekarang, lalu sunting tugas yang Anda dapati.',
  'help.guide.todo-filters.step.1':
    '“Tugas” di bilah sisi: “Semua” adalah semua yang masih terbuka, “Tugasku” apa yang menjadi tanggungan Anda, “Terlambat” apa yang tanggalnya sudah lewat, “Selesai” apa yang sudah rampung. Masing-masing membawa jumlahnya; klik “Terlambat”.',
  'help.guide.todo-filters.step.2':
    'Di bawah “Daftar” duduk satu baris per daftar. Memilih salah satunya menampilkan daftar itu, termasuk tugas yang sudah selesai.',
  'help.guide.todo-filters.step.3':
    'Pengurutan di kepala daftar menata ulang apa yang ada di layar: “Prioritas” menaruh P1 di depan, “Tenggat waktu” menaruh tenggat terdekat di depan. Hanya satu dari keduanya pada satu waktu, dan klik kedua mengembalikan urutan Anda sendiri.',
  'help.guide.todo-filters.step.4': 'Klik sebuah tugas untuk membukanya di panel sebelah kanan.',
  'help.guide.todo-filters.step.5':
    'Ubah apa yang perlu, nama, “Deskripsi”, “Prioritas”, “Daftar”, “Tenggat waktu” atau “Ditugaskan ke”, lalu “Simpan perubahan” di kaki panel. Kotak di kepala panel menandai tugas sebagai selesai, dan “Hapus” di sebelah “Simpan perubahan” menyingkirkannya seketika.',
  'help.guide.todo-filters.result':
    'Daftar hanya menampilkan tugas yang Anda minta, dan panel di sebelah kanan menyunting yang Anda pilih.',
  'help.guide.todo-filters.tip.1':
    'Baris daftar hanya menghitung yang masih terbuka, tetapi memilihnya menampilkan tugas yang sudah selesai juga. “Semua”, “Tugasku” dan “Terlambat” menyembunyikan yang sudah rampung; “Selesai” tidak menampilkan yang lain.',
  'help.guide.todo-filters.tip.2':
    '“Prioritas” dan “Tenggat waktu” dalam pengurutan saling meniadakan, dan selama salah satunya menyala baris tidak bisa lagi diseret ke urutan Anda sendiri.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Pemesanan',
  'help.ctx.trip-bookings.summary':
    'Tab yang memuat segala sesuatu yang dipesan untuk perjalanan ini selain cara berpindah: tempat menginap, meja restoran, tiket, tur, parkir. Setiap pemesanan adalah sebuah kartu, sebuah baris daftar atau sebuah batang di linimasa, membawa kodenya, dokumennya, pesertanya dan biayanya, dan satu klik membuka detailnya.',
  'help.ctx.trip-bookings.bullet.1':
    '“Pemesanan Manual” di ujung kanan bilah membuka “Reservasi Baru”. Enam jenis yang dibuatnya adalah “Akomodasi”, “Restoran”, “Acara”, “Tur”, “Parkir” dan “Lainnya”; penerbangan, kereta dan selebihnya ada di tab “Transportasi” dan tidak pernah muncul di sini.',
  'help.ctx.trip-bookings.bullet.2':
    'Ikon unduh sebelum “Pemesanan Manual”, “Impor konfirmasi pemesanan”, menyerahkan konfirmasi kepada pengurai: EML, PDF, PKPass, HTML atau TXT, paling banyak lima file berukuran 10 MB. Ikon itu hanya ada bila server dapat membacanya.',
  'help.ctx.trip-bookings.bullet.3':
    '“Cari” menelusuri judul, jenis, tempat, catatan, kode pemesanan dan peserta. “Filter”, corong di sebelahnya, mempersempit tab menurut “Status”, menurut “Jenis” dengan jumlah untuk masing-masing, dan menurut “Peserta” begitu sebuah pemesanan menyebut orang; angka pada corong menghitung apa yang menyala.',
  'help.ctx.trip-bookings.bullet.4':
    'Tiga ikon sesudah “Filter” mengganti tampilan: “Kartu”, “Daftar” dan “Linimasa”. “Opsi tampilan”, ikon penggeser di sebelahnya, mengelompokkan dan mengurutkan kartu dan daftar atau mengatur lajur linimasa. Secara bawaan kartu berdiri di “Dikonfirmasi” dan “Tertunda”, dan satu klik pada judul sebuah bagian melipatnya.',
  'help.ctx.trip-bookings.bullet.5':
    'Sebuah kartu punya pita kepala yang diberi warna menurut statusnya, dengan titik status (satu klik beralih antara “Tertunda” dan “Dikonfirmasi”), jenis, judul, pensil dan tempat sampah. Di bawahnya, apa pun yang dimiliki pemesanan itu: “Tanggal”, “Waktu”, “Kode Pemesanan”, “Check-in” dan “Check-out”, “Lokasi / Alamat”, “Akomodasi”, “Terhubung ke” (perhentian di rencana), “Tautan”, “Catatan”, “Peserta”, “File” dan biaya yang tertaut.',
  'help.ctx.trip-bookings.bullet.6':
    'Satu klik pada sebuah kartu, baris atau batang membuka detail pemesanan, dengan “Di peta”, tempat sampah dan “Sunting” di kakinya. Menghapus bertanya sekali, lalu pemesanan itu hilang bersama pengeluaran yang tertaut dengannya, dan sebuah akomodasi mengeluarkan malam-malamnya dari “Rencana Hari”.',
  // booking-views
  'help.guide.booking-views.title': 'Mengganti tampilan dan membuka sebuah pemesanan',
  'help.guide.booking-views.goal':
    'Lihat pemesanan sebagai kartu, sebagai daftar atau pada linimasa, dan buka salah satunya untuk melihat segala isinya.',
  'help.guide.booking-views.step.1':
    'Tiga ikon sesudah “Filter” di bilah adalah tampilannya, dan masing-masing menunjukkan namanya saat Anda menunjuknya: “Kartu”, “Daftar” dan “Linimasa”. Tab terbuka di “Kartu”, satu kartu per pemesanan di bagian “Dikonfirmasi” dan “Tertunda”. Klik “Daftar”, yang di tengah.',
  'help.guide.booking-views.step.2':
    '“Daftar” menaruh satu baris per pemesanan di bawah satu judul per hari, dengan hari dan waktu di sebelah kanan; tombol panah berpindah dari baris ke baris. Klik “Linimasa”, yang terakhir dari ketiganya.',
  'help.guide.booking-views.step.3':
    '“Linimasa” membentangkan pemesanan di atas hari-hari perjalanan, satu lajur per jenis dan sebuah batang dari setiap awal sampai akhirnya, sedangkan pemesanan yang tertunda bergaris tepi putus-putus. “Perjalanan” memuat seluruh perjalanan ke dalam lebarnya; klik judul sebuah hari untuk melihat hari itu per jam.',
  'help.guide.booking-views.step.4':
    '“Hari” membentangkan satu hari di atas skala jam, dan batang-batangnya memanjang untuk menunjukkan waktunya. Panah di sebelah nama hari melangkah ke hari sebelumnya dan hari sesudahnya, dan sakelar “Perjalanan” dan “Hari” di kanan kembali ke seluruh perjalanan.',
  'help.guide.booking-views.step.5':
    'Arahkan penunjuk ke sebuah batang untuk melihat hari, waktu dan tempatnya, lalu klik untuk membuka detail pemesanan. Sebuah kartu di “Kartu” dan sebuah baris di “Daftar” membuka popup yang sama.',
  'help.guide.booking-views.step.6':
    'Pita kepala detail memuat judul dan pil untuk status (satu klik menggantinya), jenis, hari dan kode pemesanan, dengan tombol yang menyalinnya. Di bawahnya datang waktu sebagai ubin, lalu tempat, peserta, catatan, biaya dan file, apa pun yang dimiliki pemesanan itu, dan di kaki “Di peta”, tempat sampah dan “Sunting”.',
  'help.guide.booking-views.result':
    'Pemesanan itu terbuka dalam detailnya: “Sunting” membuka formulirnya, “Di peta” menampilkannya di rencana, dan “Tutup” atau Escape membawa Anda kembali ke tampilan asal Anda.',
  'help.guide.booking-views.tip.1':
    '“Opsi tampilan”, ikon penggeser sesudah ikon tampilan, mengelompokkan dan mengurutkan “Kartu” dan “Daftar” dengan “Kelompokkan menurut” dan “Urutkan menurut”. Di “Linimasa” ia menyalakan atau mematikan “Satu lajur per jenis” dan “Tampilkan tab lainnya”, yang menaruh entri tab “Transportasi” secara redup di sebuah lajur tipis di atas. “Atur ulang tampilan” mengembalikan pengaturan bawaan, dan setiap tab mengingat tampilannya di peramban ini.',
  'help.guide.booking-views.tip.2':
    'Pemesanan sebelum atau sesudah perjalanan, atau tanpa tanggal, tidak bisa duduk di linimasa: ia menunggu di bawah diagram sebagai kartu kecil di bawah “Sebelum perjalanan”, “Setelah perjalanan” atau “Tanpa tanggal”.',
  'help.guide.booking-views.tip.3':
    'Detail yang sama terbuka di mana pun sebuah pemesanan muncul: di tab “Transportasi”, di rencana hari, di detail sebuah hari dan di detail sebuah tempat. Satu klik pada judulnya mengganti nama pemesanan itu.',
  // create-booking
  'help.guide.create-booking.title': 'Membuat sebuah pemesanan',
  'help.guide.create-booking.goal':
    'Masukkan sebuah restoran, acara, tur, tempat parkir atau apa pun lainnya ke dalam perjalanan dengan tangan.',
  'help.guide.create-booking.step.1':
    'Klik “Pemesanan Manual” di ujung kanan bilah. “Reservasi Baru” terbuka, dengan judul dan dua pil di pita kepala di bagian atas.',
  'help.guide.create-booking.step.2':
    'Klik pil jenis di pita kepala, yang bertuliskan “Lainnya” pada pemesanan baru, lalu pilih “Jenis Pemesanan”. “Akomodasi”, “Restoran”, “Acara”, “Tur”, “Parkir” dan “Lainnya” adalah enam jenis yang dibuat tab ini, dan formulirnya berubah mengikuti pilihan: hanya “Akomodasi” yang menukar tanggalnya dengan rentang hari.',
  'help.guide.create-booking.step.3':
    'Ketik judulnya ke pita kepala, kolom di atas pil-pil itu. Inilah satu-satunya isian yang diharuskan oleh formulir, dan “Tambah” tetap abu-abu sampai ia terisi.',
  'help.guide.create-booking.step.4':
    'Atur “Tanggal” dan “Waktu mulai”, serta “Tanggal selesai” dan “Waktu selesai” bila pemesanan itu punya akhir. Kalender hanya menawarkan hari di dalam perjalanan, dan akhir yang tidak sesudah awal dikatakan dengan warna merah lalu menghalangi “Tambah”.',
  'help.guide.create-booking.step.5':
    'Masukkan “Kode Pemesanan” dari konfirmasi, lalu klik pil status di pita kepala, di samping jenis. Pil itu bertuliskan “Tertunda” pada pemesanan baru dan berubah menjadi “Dikonfirmasi”, dan itulah yang menentukan di bagian mana kartu itu mendarat.',
  'help.guide.create-booking.step.6': 'Klik “Tambah” di kaki formulir.',
  'help.guide.create-booking.result':
    'Pemesanan itu menjadi sebuah kartu di bagiannya, pita kepalanya diberi warna menurut statusnya, dengan jenisnya, tanggal dan waktunya serta kodenya, dan semua orang lain di perjalanan melihatnya muncul.',
  'help.guide.create-booking.tip.1':
    '“Lokasi / Alamat” menawarkan alamat nyata sementara Anda mengetik; memilih salah satunya menggantikan apa yang Anda tulis, dan alamat yang Anda ketik sendiri dibiarkan apa adanya.',
  'help.guide.create-booking.tip.2':
    '“Tautan” memuat halaman pemesanan itu sendiri di penyedianya. Kartu dan detail mengubahnya menjadi tautan yang terbuka di tab baru.',
  'help.guide.create-booking.tip.3':
    '“Catatan” memakai Markdown, jadi sebuah daftar atau baris tebal ditampilkan sebagaimana mestinya di kartu dan di detail.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Memesan tempat menginap',
  'help.guide.booking-hotel.goal':
    'Masukkan sebuah akomodasi supaya ia sekaligus terhitung sebagai pemesanan dan sebagai malam-malam di “Rencana Hari”.',
  'help.guide.booking-hotel.step.1':
    'Klik “Pemesanan Manual” dan pilih “Akomodasi” dengan pil jenis di pita kepala. Isian tanggal menghilang dan sekelompok isian hotel menggantikan tempatnya.',
  'help.guide.booking-hotel.step.2':
    'Pilih hotelnya di bawah “Akomodasi”. Daftarnya adalah tempat-tempat milik perjalanan ini, dan memilih salah satunya menuliskan namanya ke judul yang masih kosong dan alamatnya ke “Lokasi / Alamat”.',
  'help.guide.booking-hotel.step.3':
    'Atur “Dari” dan “Sampai”: malam pertama dan pagi Anda pergi. Keduanya menawarkan hari-hari perjalanan beserta tanggalnya, dan keduanya saling menjaga urutan.',
  'help.guide.booking-hotel.step.4':
    'Isi “Check-in”, “Check-in sampai” dan “Check-out”, serta “Kode Pemesanan” dari konfirmasi.',
  'help.guide.booking-hotel.step.5': 'Klik “Tambah”.',
  'help.guide.booking-hotel.result':
    'Kartu itu membawa rentang hari di bawah “Tanggal”, waktu check-in dan check-out serta alamatnya, dan menginap yang sama kini duduk pada hari-hari itu di rencana.',
  'help.guide.booking-hotel.tip.1':
    '“Akomodasi” adalah satu-satunya jenis tanpa “Tanggal” dan “Waktu mulai”. Tanggalnya adalah “Dari” dan “Sampai”, dan itu hari-hari perjalanan, bukan kalender.',
  'help.guide.booking-hotel.tip.2':
    'Biarkan “Akomodasi” kosong dan ketik alamatnya saja: tempat itu dicari, dibuat dan disematkan di peta untuk Anda.',
  'help.guide.booking-hotel.tip.3': 'Menghapus pemesanan itu membawa serta malam-malamnya keluar dari “Rencana Hari”.',
  // link-booking
  'help.guide.link-booking.title': 'Mengikat pemesanan ke rencana',
  'help.guide.link-booking.goal':
    'Gantungkan sebuah pemesanan pada perhentian dan tempat yang menjadi miliknya, supaya ia muncul di tempat Anda akan menginginkannya.',
  'help.guide.link-booking.step.1':
    'Arahkan penunjuk ke kartu yang ingin Anda hubungkan dan klik pensil di pita kepalanya. “Edit Reservasi” terbuka.',
  'help.guide.link-booking.step.2':
    'Buka “Hubungkan ke jadwal harian”. Daftarnya adalah rencana Anda: satu judul per hari, lalu perhentian hari itu, bernomor dan dengan waktunya. Pilih yang menjadi milik pemesanan itu.',
  'help.guide.link-booking.step.3':
    '“Tempat / Aktivitas” menghubungkan tempatnya sendiri. Pilih di sana, dan judul serta “Lokasi / Alamat” terisi di mana pun Anda meninggalkannya kosong.',
  'help.guide.link-booking.step.4': 'Klik “Perbarui”.',
  'help.guide.link-booking.result':
    'Kartu itu menyebut hari dan perhentiannya di bawah “Terhubung ke”, dan pemesanan itu ikut bersama perhentian tersebut di “Rencana Hari”.',
  'help.guide.link-booking.tip.1':
    '“Tanpa tautan (mandiri)” di puncak daftar melepaskan hubungan itu lagi. “Akomodasi” sama sekali tidak punya pemilih perhentian: ia terhubung lewat malam-malamnya.',
  'help.guide.link-booking.tip.2':
    'Memilih sebuah perhentian pada hari yang bertanggal mengisikan “Tanggal” yang kosong untuk Anda. Tanggal yang sudah Anda atur dibiarkan saja.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Menyebut untuk siapa sebuah pemesanan dibuat',
  'help.guide.booking-travelers.goal': 'Tandai peserta yang dicakup sebuah pemesanan, lalu lihat hanya milik mereka.',
  'help.guide.booking-travelers.step.1':
    'Buka pemesanan itu dengan pensil pada kartunya. “Peserta” ada di samping “Kode Pemesanan”, dan bertuliskan “Tetapkan peserta” selama belum ada siapa pun di pemesanan itu.',
  'help.guide.booking-travelers.step.2':
    'Klik itu dan pilih orang-orang yang menjadi tujuan pemesanan ini; “Tamu” yang bernama juga ada di daftar. Yang terpilih mendapat centang dan avatarnya muncul di kolom itu. Klik namanya lagi untuk melepasnya.',
  'help.guide.booking-travelers.step.3': 'Klik “Perbarui”.',
  'help.guide.booking-travelers.step.4':
    'Klik “Filter” di bilah: di bawah “Peserta”, klik seseorang untuk melihat hanya pemesanan miliknya. Beberapa orang bisa menyala sekaligus.',
  'help.guide.booking-travelers.result':
    'Kartu itu mendaftar orang-orang yang menjadi tujuannya, dan “Filter” mempersempit tab ke pemesanan milik orang-orang yang Anda pilih.',
  'help.guide.booking-travelers.tip.1':
    'Di kartu dan di detail, peserta hanya ditampilkan, tidak pernah diubah. Mereka diatur di sini, di formulir.',
  'help.guide.booking-travelers.tip.2':
    '“Peserta” muncul di “Filter” begitu perjalanan punya lebih dari satu anggota dan setidaknya satu pemesanan menyebut seseorang. Apa yang Anda pilih bertahan sampai Anda menutup tab peramban.',
  // booking-files
  'help.guide.booking-files.title': 'Menyimpan vocer bersama pemesanannya',
  'help.guide.booking-files.goal': 'Lampirkan konfirmasi, tiket atau pas ke pemesanan yang menjadi miliknya.',
  'help.guide.booking-files.step.1':
    'Buka pemesanan itu dengan pensil pada kartunya. “File” ada di samping “Tautan”; klik “Lampirkan file” di sana. Pada pemesanan yang sudah ada, dokumen itu langsung naik dan TREK mengatakan “File diunggah”.',
  'help.guide.booking-files.step.2':
    'Dokumen itu terdaftar dengan namanya, dengan sebuah tombol untuk membukanya dan sebuah X di sebelahnya.',
  'help.guide.booking-files.step.3':
    '“Hubungkan file yang ada” menawarkan dokumen perjalanan yang belum ada pada pemesanan ini. Pilih satu dan ia terlampir tanpa mengunggah apa pun lagi.',
  'help.guide.booking-files.step.4': 'Klik “Perbarui”.',
  'help.guide.booking-files.result':
    'Kartu dan detail mendaftar dokumen di bawah “File”, dan satu klik pada salah satunya membukanya.',
  'help.guide.booking-files.tip.1':
    'Pada pemesanan yang masih Anda buat, dokumen itu menunggu dan naik pada saat Anda mengklik “Tambah”.',
  'help.guide.booking-files.tip.2':
    'X di sebelah dokumen melepaskan hubungannya, bukan dokumennya. Dokumen itu tetap ada di tab “File” perjalanan.',
  'help.guide.booking-files.tip.3':
    'Jenis file mana yang boleh dilampirkan adalah daftar milik administrator di bawah “Jenis File yang Diizinkan”; dokumen, teks dan gambar diizinkan sejak awal.',
  // booking-cost
  'help.guide.booking-cost.title': 'Mengubah harga sebuah pemesanan menjadi biaya',
  'help.guide.booking-cost.goal':
    'Bawa apa yang dihabiskan sebuah pemesanan ke “Biaya”, terbagi di antara orang-orang yang membayarnya.',
  'help.guide.booking-cost.step.1':
    'Buka pemesanan itu dengan pensil pada kartunya dan pergi ke kaki formulir. Di bawah “Biaya” berdiri “Buat pengeluaran” dan “Tautkan pengeluaran yang ada”, dengan catatan “Menyimpan pemesanan, lalu membuka editor biaya.”',
  'help.guide.booking-cost.step.2':
    'Klik “Buat pengeluaran”. Pemesanan itu tersimpan, formulirnya tertutup dan penyunting biaya terbuka sebagai “Tambah pengeluaran”.',
  'help.guide.booking-cost.step.3':
    'Nama di pita kepala sudah berisi judul pemesanan itu. Masukkan “Jumlah total” dan periksa “Mata uang” serta “Hari” di sebelahnya.',
  'help.guide.booking-cost.step.4':
    'Pil di pita kepala adalah “Kategori”, sudah berisi yang tersirat dari jenis pemesanannya. Di bawah “Siapa yang membayar?” pilih siapa yang membayar, dan di bawah “Pembagian” bagaimana jumlahnya dibagi.',
  'help.guide.booking-cost.step.5': 'Klik “Tambah pengeluaran”.',
  'help.guide.booking-cost.result':
    'Kartu itu membawa jumlahnya di kakinya, formulir pemesanan mencantumkan pengeluarannya di bawah “Pengeluaran tertaut”, dan pengeluaran yang sama berdiri di tab “Biaya”, terikat pada pemesanan ini.',
  'help.guide.booking-cost.tip.1':
    'Kategorinya mengikuti jenisnya: “Restoran” menjadi “Makanan & minuman”, “Akomodasi” menjadi “Akomodasi”, “Parkir” menjadi “Parkir”, dan “Acara” serta “Tur” keduanya mendarat di “Lainnya”.',
  'help.guide.booking-cost.tip.2':
    'Satu pemesanan bisa membawa beberapa pengeluaran. “Tautkan pengeluaran yang ada” menawarkan pengeluaran di “Biaya” yang belum menjadi milik apa pun. Pada pengeluaran yang tertaut, “Lepas tautan, simpan pengeluaran” melepasnya dan membiarkannya di “Biaya”, sementara tempat sampah menghapusnya.',
  'help.guide.booking-cost.tip.3':
    '“Biaya” ada di formulir hanya selama addon “Biaya” menyala, yang dialihkan administrator di bawah “Addon”.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Menemukan sebuah pemesanan',
  'help.guide.filter-bookings.goal':
    'Persempit tab yang panjang ke sebuah kata, sebuah keadaan, sebuah jenis atau seseorang.',
  'help.guide.filter-bookings.step.1':
    'Ketik ke “Cari” di bilah. Ia menelusuri judul, jenis, tempat dan alamat, catatan, kode pemesanan dan nama peserta, dan tab menyempit sambil Anda mengetik; Escape mengosongkan kotaknya.',
  'help.guide.filter-bookings.step.2':
    'Klik “Filter”, corong di sebelah pencarian. Panelnya memuat “Status”, “Jenis” dan, begitu sebuah pemesanan menyebut orang, “Peserta”.',
  'help.guide.filter-bookings.step.3':
    'Di bawah “Status”, pilih “Dikonfirmasi” atau “Tertunda” untuk melihat hanya itu; “Semua” menampilkan keduanya.',
  'help.guide.filter-bookings.step.4':
    'Di bawah “Jenis”, klik satu jenis atau lebih untuk menyisakan hanya jenis itu. Masing-masing menunjukkan berapa pemesanan yang dimuatnya, dan tanda centang menandai yang menyala.',
  'help.guide.filter-bookings.step.5':
    'Angka pada “Filter” menghitung apa yang dinyalakan, dan sebuah chip di sebelah pencarian menyebut berapa dari semua pemesanan yang tersisa. Klik chip itu, atau “Atur ulang filter” di kaki panel, untuk melihat semuanya lagi.',
  'help.guide.filter-bookings.result':
    'Tab itu hanya menampilkan apa yang Anda pilih, sama saja di “Kartu”, “Daftar” dan “Linimasa”, dan filternya bertahan untuk perjalanan ini sampai Anda menutup tab peramban.',
  'help.guide.filter-bookings.tip.1':
    '“Jenis” hanya ada bila tab memuat lebih dari satu jenis, dan ia hanya mendaftar jenis yang dimuat tab, jadi tab tanpa satu pun tur tidak punya “Tur” di dalamnya.',
  'help.guide.filter-bookings.tip.2':
    'Filter yang tidak cocok dengan apa pun meninggalkan “Tidak ada yang cocok dengan filter ini” di tab, dengan “Atur ulang filter” tepat di bawahnya.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Membaca sebuah pemesanan dari konfirmasinya',
  'help.guide.import-booking-file.goal':
    'Biarkan TREK menarik pemesanan itu keluar dari surel atau PDF yang dikirim penyedianya, alih-alih mengetiknya lagi.',
  'help.guide.import-booking-file.step.1':
    'Klik ikon unduh di bilah, “Impor konfirmasi pemesanan”; namanya muncul saat Anda menunjuknya. Dialog dengan nama yang sama terbuka.',
  'help.guide.import-booking-file.step.2':
    'Jatuhkan konfirmasinya ke kotak itu, atau klik kotaknya lalu pilih: EML, PDF, PKPass, HTML dan TXT, sampai lima file berukuran 10 MB masing-masing. Yang Anda pilih disebut namanya di kotak itu.',
  'help.guide.import-booking-file.step.3':
    'Klik “Impor”. Dialog itu langsung tertutup, karena pembacaannya terjadi di latar belakang.',
  'help.guide.import-booking-file.step.4':
    'Sebuah kartu di kanan bawah melaporkan jalannya proses di bawah nama file, dan ia mengikuti Anda melintasi aplikasi dan melewati pemuatan ulang. “Memproses file…” berubah menjadi centang ketika pembacaan selesai, dan kartu itu menawarkan “Impor”. Klik itu.',
  'help.guide.import-booking-file.step.5':
    'Setiap pemesanan yang ditemukan terbuka di “Reservasi Baru”, satu demi satu, sudah terisi. Untuk hotel itu berarti namanya sebagai judul dan, bila perjalanan memiliki tempatnya, di bawah “Akomodasi”, “Lokasi / Alamat”-nya, “Dari” dan “Sampai” pada malam-malamnya, “Check-in” dan “Check-out”, “Kode Pemesanan”, konfirmasi di bawah “File” dan, dengan “Biaya” menyala, harganya sebagai “Pengeluaran tertaut”. Periksa lalu klik “Tambah”.',
  'help.guide.import-booking-file.result':
    'Pemesanan itu menjadi kartu di “Tertunda” dengan malam-malamnya, kodenya dan konfirmasi di bawah “File”, penginapannya duduk pada hari-hari itu di rencana, dan dengan “Biaya” menyala harganya menjadi pengeluaran yang terikat padanya.',
  'help.guide.import-booking-file.tip.1':
    'Ikon impor hanya ada bila server dapat membaca konfirmasi, dan itu menuntut pengekstrak atau addon “Analisis AI”; yang terakhir dialihkan administrator di bawah “Addon”. Tab tanpa pemesanan apa pun juga menawarkannya sebagai tombol “Impor dari file”.',
  'help.guide.import-booking-file.tip.2':
    'Bila tidak ada yang dapat dibaca, kartu itu mengatakannya dan, dengan “Analisis AI” menyala, menawarkan “Coba baca dengan AI”, yang mengirimkan file yang sama langsung ke modelnya. Penguraian yang selesai disimpan selama sepuluh menit; mulailah peninjauan di dalam jendela waktu itu.',
  'help.guide.import-booking-file.tip.3':
    'Konfirmasi hanya dilampirkan bila jenisnya ada di “Jenis File yang Diizinkan” di pengaturan admin. PDF ada di sana sejak awal; surel, EML, harus ditambahkan lebih dulu, atau pemesanan disimpan tanpanya.',
  // edit-booking
  'help.guide.edit-booking.title': 'Mengubah sebuah pemesanan',
  'help.guide.edit-booking.goal':
    'Perbaiki sebuah waktu, tambahkan kode yang datang belakangan, atau pindahkan sebuah pemesanan dari “Tertunda” ke “Dikonfirmasi”.',
  'help.guide.edit-booking.step.1':
    'Arahkan penunjuk ke kartu dan klik pensil di pita kepalanya. “Edit Reservasi” terbuka dengan segala yang diketahui pemesanan itu.',
  'help.guide.edit-booking.step.2':
    'Ubah apa yang perlu diubah, di sini “Kode Pemesanan” yang akhirnya dikirim operatornya.',
  'help.guide.edit-booking.step.3':
    'Klik pil “Tertunda” di pita kepala. Pil itu berubah menjadi “Dikonfirmasi”, dan pitanya berubah hijau.',
  'help.guide.edit-booking.step.4': 'Klik “Perbarui”.',
  'help.guide.edit-booking.result':
    'Kartu itu berpindah: pemesanan yang dikonfirmasi berdiri di bagian “Dikonfirmasi” dengan titik hijau dan pita kepala hijau, dan semua orang di perjalanan melihatnya berpindah.',
  'help.guide.edit-booking.tip.1':
    '“Kode Pemesanan” yang tidak bisa Anda baca adalah “Sembunyikan Kode Pemesanan” di Pengaturan, di bawah “Tampilan”. Arahkan tetikus ke sana, atau klik, dan ia terbaca.',
  'help.guide.edit-booking.tip.2':
    'Ubah jenisnya dan kategori pengeluaran yang terhubung mengikutinya, kecuali Anda sudah memilih kategori dengan tangan di penyunting biaya.',
  'help.guide.edit-booking.tip.3':
    '“Sunting” di kaki detail sebuah pemesanan membuka formulir yang sama. Status juga bisa diganti tanpa formulir apa pun: klik titik pada sebuah kartu atau baris, atau pil status di detail.',
  // delete-booking
  'help.guide.delete-booking.title': 'Menghapus sebuah pemesanan',
  'help.guide.delete-booking.goal': 'Keluarkan dari perjalanan sebuah pemesanan yang batal.',
  'help.guide.delete-booking.step.1':
    'Arahkan penunjuk ke kartu dan klik tempat sampah di pita kepalanya. Tempat sampah di kaki detail sebuah pemesanan menanyakan hal yang sama.',
  'help.guide.delete-booking.step.2':
    '“Hapus pemesanan?” menyebut yang Anda pilih dan mengatakan bahwa ia akan dihapus permanen.',
  'help.guide.delete-booking.step.3': 'Klik “Hapus”.',
  'help.guide.delete-booking.result':
    'Kartu itu hilang, bagi semua orang di perjalanan. Sebuah pemesanan tidak punya pembatalan, jadi pertanyaan itulah perhentian terakhir.',
  'help.guide.delete-booking.tip.1':
    'Menghapus sebuah pemesanan juga membuang pengeluaran yang tertaut dengannya, dan sebuah akomodasi mengeluarkan malam-malamnya dari “Rencana Hari”.',
  'help.guide.delete-booking.tip.2':
    'Dokumen yang pernah dilampirkan tetap ada di tab “File” perjalanan; hanya hubungannya dengan pemesanan itu yang pergi.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Biaya',
  'help.ctx.trip-costs.summary':
    'Uang perjalanan: setiap pengeluaran dalam buku besar bertanggal atau dalam sebuah tabel, siapa yang mengeluarkannya dan siapa yang menanggungnya, dalam mata uang apa pun yang tertera di kuitansi, dan, di kolom kanan, siapa harus membayar siapa agar semuanya impas lagi.',
  'help.ctx.trip-costs.bullet.1':
    'Bilah di atas menyebut tanggal perjalanan dan para pelancong yang menanggung biaya bersama, lalu memuat “Cari pengeluaran…”, “Filter” (corong), “Ekspor CSV” (ikon unduh) dan sakelar “Daftar” / “Tabel”.',
  'help.ctx.trip-costs.bullet.2':
    'Di ujung kanannya, “Lunasi” mencatat semua transfer terbuka sekaligus, “Pindai kuitansi” mengisi sebuah pengeluaran dari foto bila addon “Analisis AI” dapat membaca gambar, dan “Tambah pengeluaran” membuka editor.',
  'help.ctx.trip-costs.bullet.3':
    'Empat kartu di bawah bilah: “Kamu berhutang” dan “Kamu dipinjami” adalah sisi Anda sendiri dari pelunasan, “Jumlah tertunda” adalah yang sudah dicatat tetapi belum ada pembayarnya, dan “Total pengeluaran perjalanan” menjumlahkan semuanya, dengan “Bagianmu” dan “Kamu membayar” di bawahnya.',
  'help.ctx.trip-costs.bullet.4':
    'Buku besar dikelompokkan per hari, yang terbaru lebih dulu, setiap hari diawali dengan berapa entri yang dimuatnya dan berapa yang dibelanjakan pada hari itu. Sebuah baris membawa kategori sebagai tab berwarna, nama, chip pembayar, catatan dan jumlahnya, ditambah “kamu meminjamkan” atau “kamu meminjam” bila pembagiannya membuat Anda kelebihan atau kekurangan padanya.',
  'help.ctx.trip-costs.bullet.5':
    'Kolom kanan adalah jawabannya: “Lunasi” mendaftar siapa membayar siapa, “Saldo” menunjukkan surplus atau defisit tiap pelancong, “Anggaran akhir” berapa biaya perjalanan untuk masing-masing dari mereka, dan “Per kategori” ke mana uangnya pergi.',
  'help.ctx.trip-costs.bullet.6':
    'Pembayaran yang sudah dicatat duduk di buku besar yang sama sebagai baris tersendiri, dengan pensil dan “Urungkan” di sebelahnya; sebuah pengeluaran punya pensil dan tempat sampah, dan tempat sampah itu menghapusnya tanpa bertanya.',
  'help.ctx.trip-costs.bullet.7':
    '“Tabel” di bilah menampilkan pengeluaran yang sama sebagai lembar kerja, dikelompokkan menurut kategori, dengan “Orang” dan “Hari” serta berapa hasilnya per orang dan per hari; “Ringkasan” lalu menggantikan “Per kategori”. “Biaya” mengingat tampilan yang Anda pilih.',
  // add-expense
  'help.guide.add-expense.title': 'Tambah sebuah pengeluaran',
  'help.guide.add-expense.goal': 'Catat berapa biaya sesuatu, siapa yang membayarnya dan dengan siapa itu dibagi.',
  'help.guide.add-expense.step.1':
    'Klik “Tambah pengeluaran” di ujung kanan bilah. Editor terbuka, bertanggal hari ini, dibayar oleh Anda dan dengan semua orang sudah ada di pembagiannya.',
  'help.guide.add-expense.step.2':
    'Ketik untuk apa itu ke kepala dialog, kolom yang bertuliskan “mis. Makan malam, oleh-oleh, bensin…” selama masih kosong. Itulah nama pengeluaran, dan pengeluaran tidak bisa disimpan tanpanya.',
  'help.guide.add-expense.step.3':
    'Pil di bawah nama adalah “Kategori”, “Makanan & minuman” sampai Anda memilih yang lain. Ada empat belas dan tidak bisa diubah: kepala dialog mengambil warna kategori yang Anda pilih, begitu pula tab pada barisnya dan batangnya di “Per kategori”.',
  'help.guide.add-expense.step.4':
    'Masukkan angka dari kuitansi ke “Jumlah total”. “Mata uang” di sebelahnya dimulai pada mata uang yang dipakai untuk menampilkan “Biaya”; ubah itu dan editor menunjukkan berapa nilai jumlah tersebut. “Hari” dimulai pada hari ini dan itulah yang dipakai buku besar untuk mengelompokkan pengeluarannya.',
  'help.guide.add-expense.step.5':
    'Di bawah “Siapa yang membayar?”, klik orang yang benar-benar mengeluarkan uangnya. “Kamu” sudah terpilih; “Belum ada yang membayar” mencatat jumlahnya tanpa membuat siapa pun menanggungnya, dan “Beberapa orang membayar” pada sakelar di sebelah judul membagi tagihannya di antara beberapa pembayar.',
  'help.guide.add-expense.step.6':
    '“Pembagian” di bawahnya dimulai pada “Rata”, dengan semua orang tercentang dan bagian masing-masing di sebelah namanya; biarkan atau ubah. Klik “Tambah pengeluaran” di kaki dialog untuk menyimpan.',
  'help.guide.add-expense.result':
    'Pengeluaran itu ada di buku besar di bawah harinya, dihitung ke dalam “Total pengeluaran perjalanan”, dan kolom pelunasan sudah menghitung ulang siapa berhutang kepada siapa.',
  'help.guide.add-expense.tip.1':
    'Dibiarkan seperti saat terbuka, pengeluaran itu bertanggal hari ini, dibayar oleh Anda dan dibagi rata di antara semua orang: hanya nama dan jumlahnya yang benar-benar harus diisi.',
  'help.guide.add-expense.tip.2':
    'Tanda ± di sebelah jumlahnya mengubah pengeluaran menjadi pengembalian dana. Total negatif mengembalikan uang alih-alih mengambilnya, dan pembagiannya berjalan ke arah sebaliknya.',
  'help.guide.add-expense.tip.3':
    '“Lampirkan”, di sebelah “Kuitansi & Faktur” di bagian bawah dialog, menerima gambar dan PDF. Semuanya diunggah saat Anda menyimpan, mendarat di File perjalanan, dan sebuah chip “Kuitansi” muncul di sebelah nama di daftar.',
  // expense-payers
  'help.guide.expense-payers.title': 'Katakan siapa yang membayar tagihannya',
  'help.guide.expense-payers.goal':
    'Catat siapa yang merogoh koceknya untuk sebuah pengeluaran, separuh lainnya dari hitungan pelunasan.',
  'help.guide.expense-payers.step.1':
    'Buka sebuah pengeluaran dengan pensil di sebelah barisnya dan lihat “Siapa yang membayar?”. “Satu orang membayar” adalah bawaan pada sakelar di sebelah judul: setiap pelancong adalah sebuah chip, dan yang bergaris tepi adalah orang yang mengeluarkan uangnya. Klik chip lain untuk menggantinya.',
  'help.guide.expense-payers.step.2':
    '“Belum ada yang membayar”, chip putus-putus sesudah para pelancong, mencatat jumlahnya tanpa membuat siapa pun berhutang apa pun. Pengeluaran itu tetap dihitung ke “Total pengeluaran perjalanan”.',
  'help.guide.expense-payers.step.3':
    '“Beberapa orang membayar”, sisi lain sakelar itu, mendaftar setiap pelancong dengan kotak untuk dicentang, dan setiap yang tercentang mendapat kolom jumlah. Centang mereka yang membayar dan ketik berapa yang dimasukkan masing-masing; jumlah-jumlah itu harus berjumlah totalnya.',
  'help.guide.expense-payers.step.4':
    'Pengeluaran yang belum dibayar siapa pun ditandai “Belum selesai” pada barisnya dan dihitung ke kartu “Jumlah tertunda”, tempat berkumpulnya pengeluaran yang belum punya pembayar.',
  'help.guide.expense-payers.result':
    'Siapa yang membayar menentukan siapa yang dibayar kembali, pembagiannya menentukan siapa yang membayar, dan “Saldo” adalah selisih antara keduanya.',
  'help.guide.expense-payers.tip.1':
    '“Siapa yang membayar?” dan Split saling bebas: Anda bisa membayar makan malam yang tidak Anda hadiri, dan ikut dibagi pada makan malam yang tidak Anda bayar.',
  'help.guide.expense-payers.tip.2':
    'Dengan beberapa pembayar, jumlah-jumlah itu harus berjumlah totalnya. Centang satu orang lagi dan jumlah yang tidak Anda ketik sendiri membagi ulang sisanya; selama belum cocok, editor menyebutkan berapa yang harus menjadi jumlahnya dan menolak menyimpan.',
  'help.guide.expense-payers.tip.3':
    'Mengembalikan sebuah pengeluaran ke “Belum ada yang membayar” tidak menghapusnya: jumlahnya tetap ada di “Total pengeluaran perjalanan” dan barisnya menjadi “Belum selesai”.',
  // split-expense
  'help.guide.split-expense.title': 'Bagi sebuah tagihan di antara para pelancong',
  'help.guide.split-expense.goal':
    'Putuskan siapa menanggung sebuah pengeluaran: semua orang sama rata, per jumlah, atau baris demi baris dari kuitansinya.',
  'help.guide.split-expense.step.1':
    'Di editor pengeluaran, “Pembagian” mendaftar setiap pelancong dengan kotak untuk dicentang. Hapus centang sebuah nama untuk mengeluarkannya dari pengeluaran ini: nama itu menjadi abu-abu, kehilangan bagiannya dan tidak menanggung apa pun untuknya.',
  'help.guide.split-expense.step.2':
    '“Rata”, pada sakelar di sebelah judul, adalah bawaannya: setiap pelancong yang tercentang mendapat bagian yang sama, ditampilkan di sebelah namanya, dan lencana di bawah daftar menyebut berapa orang yang berbagi dan berapa besar tiap bagiannya.',
  'help.guide.split-expense.step.3':
    '“Kustom” menukar bagian-bagian itu dengan kolom jumlah. Ketik berapa yang ditanggung tiap pelancong; lencana di bawahnya ikut menghitung dan berubah hijau pada “Pembagian sudah pas dengan total”. Selama belum pas, itu tidak akan tersimpan.',
  'help.guide.split-expense.step.4':
    '“Struk” membagi kuitansinya baris demi baris: “Tambah item”, lalu sebuah nama dan sebuah harga per baris, dan di sebelah “Dibagi dengan:” para pelancong yang berbagi baris itu.',
  'help.guide.split-expense.step.5':
    '“Bagian tiap orang” di bawah baris-baris itu menunjukkan berapa yang akhirnya ditanggung tiap pelancong, dan “Jumlah total” di atas dijumlahkan dari baris-barisnya. Klik “Simpan” di kaki dialog.',
  'help.guide.split-expense.result':
    'Pembagian adalah dasar dari setiap saldo. Ia tersimpan bersama pengeluarannya dan bisa diubah nanti tanpa menyentuh apa pun yang lain.',
  'help.guide.split-expense.tip.1':
    'Pelancong yang centangnya Anda hapus tidak menanggung apa pun untuk pengeluaran yang satu ini; yang lain mengambil bagiannya.',
  'help.guide.split-expense.tip.2':
    'Equally tepat sampai sen terakhir: sen sisa berputar dari pengeluaran ke pengeluaran, jadi tidak ada satu orang yang selalu membayarnya.',
  'help.guide.split-expense.tip.3':
    'Mode Ticket menjumlahkan “Jumlah total” sendiri dan mengabukan kolomnya: baris-baris kuitansi itulah totalnya.',
  'help.guide.split-expense.tip.4':
    'Pembagian kustom juga bisa dimasukkan dalam persen: ubah “Masukkan bagian sebagai” ke %, dan jumlah bagian-bagiannya harus 100% sebelum pengeluaran tersimpan.',
  // expense-currency
  'help.guide.expense-currency.title': 'Masukkan pengeluaran dalam mata uang lain',
  'help.guide.expense-currency.goal':
    'Masukkan apa yang benar-benar tertulis di kuitansi dan biarkan TREK yang memegang kursnya.',
  'help.guide.expense-currency.step.1':
    'Buka “Tambah pengeluaran”, lalu ketik nama ke kepala dialog dan jumlahnya ke “Jumlah total” persis seperti yang tertulis di kuitansi, angkanya sendiri dan bukan hasil konversinya.',
  'help.guide.expense-currency.step.2':
    'Buka “Mata uang” di sebelah jumlahnya dan pilih mata uang kuitansinya. Daftarnya memuat setiap kode yang dikenal TREK dan bisa dicari: ketik tiga hurufnya.',
  'help.guide.expense-currency.step.3':
    'Sebaris lencana muncul di bawah kolom-kolom itu: apa yang Anda ketik dan berapa nilainya sekarang, ditandai “kurs langsung”. Itu pratinjau, bukan yang tersimpan.',
  'help.guide.expense-currency.step.4':
    'Klik “Tambah pengeluaran” di kaki dialog. Kursnya dibekukan saat itu juga: mulai sekarang pengeluaran ini bernilai sebesar nilainya pada hari Anda memasukkannya.',
  'help.guide.expense-currency.step.5':
    'Di buku besar, barisnya membawa kedua angka di bawah namanya: yang Anda ketik, sebuah panah, dan berapa nilainya dalam mata uang perjalanan. Setiap total, saldo dan pelunasan di tab “Biaya” dibangun dari yang kedua.',
  'help.guide.expense-currency.result':
    'Pengeluaran itu menyimpan jumlah dan mata uang yang Anda ketik. Buku besar menunjukkan keduanya, dan total serta saldo perjalanan dihitung dalam mata uang perjalanan.',
  'help.guide.expense-currency.tip.1':
    'Kursnya dibekukan saat Anda menyimpan, sehingga hutang yang sudah lunas tidak terbuka lagi karena pasar bergerak seminggu kemudian. Hanya mengubah mata uang pengeluarannya yang membekukan kurs baru.',
  'help.guide.expense-currency.tip.2':
    '“Mata uang tampilan” di Pengaturan hanya mengubah apa yang Anda baca; jumlah yang tersimpan tidak pernah bergeser. Dibiarkan kosong, tiap perjalanan ditampilkan dalam mata uangnya sendiri.',
  'help.guide.expense-currency.tip.3':
    'Mata uang perjalanan itu sendiri ada pada perjalanannya, di bawah “Edit Perjalanan”, dan butuh izin “Edit detail perjalanan”. Mengubahnya menambatkan ulang setiap kurs yang beku, bukan mengganti denominasi jumlahnya.',
  // filter-costs
  'help.guide.filter-costs.title': 'Temukan sebuah pengeluaran, atau belanja satu hari',
  'help.guide.filter-costs.goal': 'Persempit buku besar yang panjang ke apa yang benar-benar Anda cari.',
  'help.guide.filter-costs.step.1':
    'Ketik ke “Cari pengeluaran…” di bilah. Ia mencocokkan nama pengeluarannya sambil Anda mengetik, dan Esc menghapusnya lagi.',
  'help.guide.filter-costs.step.2':
    '“Filter”, corong di sebelah pencarian, membuka filternya. Sakelar di bagian atas adalah pandangan Anda sendiri atas buku besar: “Semua”, “Dibayar olehku” untuk apa yang Anda bayar, dan “Dipinjami padaku” untuk pengeluaran yang Anda bayar lebih dari bagian Anda.',
  'help.guide.filter-costs.step.3':
    'Di bawah “Kategori”, pilih salah satu dari keempat belas kategori dan hanya pengeluaran kategori itu yang tersisa. Corong itu menghitung berapa filter yang menyala.',
  'help.guide.filter-costs.step.4':
    'Di bawah “Hari”, pilih salah satu hari yang ada pengeluarannya. Sebuah spanduk menggantikan judul-judul hari dengan hari itu secara lengkap, berapa pengeluaran yang dimuatnya dan totalnya.',
  'help.guide.filter-costs.step.5':
    '“Ekspor CSV”, ikon unduh di sebelah corong, menulis setiap pengeluaran ke sebuah file, dengan jumlah aslinya, mata uangnya dan jumlah hasil konversinya.',
  'help.guide.filter-costs.result':
    'Filter-filter itu bergabung, dan kelompok hari digambar ulang dengan totalnya sendiri untuk apa pun yang tersisa.',
  'help.guide.filter-costs.tip.1':
    'Pembayaran yang dicatat tidak membawa nama dan tidak membawa kategori, jadi sebuah pencarian atau filter kategori menyembunyikannya. Filter hari tetap menahannya, di bawah hari pembayaran itu terjadi.',
  'help.guide.filter-costs.tip.2':
    '“Ekspor CSV” selalu mengekspor setiap pengeluaran, apa pun yang sedang difilter di layar, satu baris per pengeluaran.',
  'help.guide.filter-costs.tip.3':
    '“Atur ulang filter”, di kaki menu filter begitu sebuah filter menyala, mematikan semuanya sekaligus.',
  // settle-up
  'help.guide.settle-up.title': 'Hitung siapa berhutang kepada siapa, lalu lunasi',
  'help.guide.settle-up.goal':
    'Ubah tumpukan pengeluaran bersama menjadi transfer paling sedikit yang membuat semua orang impas, dan catat transfernya saat terjadi.',
  'help.guide.settle-up.step.1':
    'Kartu “Lunasi” di kolom kanan mendaftar transfer yang akan membuat semua orang impas: siapa membayar siapa, sebagai dua avatar dengan nama di tooltipnya, dan berapa. Angka di kepalanya adalah berapa yang masih terbuka.',
  'help.guide.settle-up.step.2':
    '“Lunasi” di sebelah sebuah transfer mencatatnya sebagai selesai. Aliran itu hilang dari kartunya dan saldo digambar ulang.',
  'help.guide.settle-up.step.3':
    'Transfer yang dicatat menjadi sebuah baris di buku besar, di bawah hari terjadinya, ditandai “Pembayaran” dengan kedua pelancong dan jumlahnya.',
  'help.guide.settle-up.step.4':
    'Di sebelah baris itu, pensil mengoreksi sebuah pembayaran dan “Urungkan” menariknya kembali, lalu transfernya kembali ke kartu “Lunasi”.',
  'help.guide.settle-up.step.5':
    '“Tambah pembayaran” di kepala kartu mencatat transfer yang tidak mengikuti sebuah saran. Pilih “Dari” dan “Ke”, jumlahnya, mata uangnya dan hari terjadinya, lalu klik “Tambah pembayaran” di kaki dialog.',
  'help.guide.settle-up.step.6':
    '“Lunasi” di bilah atas mencatat setiap transfer terbuka sekaligus, tanpa bertanya, seperti sekelompok orang membereskan hitungan di akhir perjalanan.',
  'help.guide.settle-up.result':
    'Setiap transfer yang dicatat adalah sebuah baris di buku besar dan satu baris hilang dari kartu “Lunasi”. Saat kartunya bertuliskan “Semua sudah impas”, perjalanan itu sudah lunas.',
  'help.guide.settle-up.tip.1':
    'Kartunya menunjukkan transfer paling sedikit, bukan setiap hutang: tiga orang yang saling berhutang dalam lingkaran menciut menjadi satu atau dua pembayaran.',
  'help.guide.settle-up.tip.2':
    '“Lunasi” mencatat sebuah transfer, ia tidak memindahkan uang. Kirimkan dengan cara apa pun yang Anda pakai, lalu klik.',
  'help.guide.settle-up.tip.3':
    'Sebuah pembayaran bisa dilakukan dalam mata uang apa pun, jadi membayar hutang yen dengan euro itu biasa: dialognya punya pemilih mata uangnya sendiri dan membekukan kurs itu juga.',
  // final-budget
  'help.guide.final-budget.title': 'Lihat berapa biaya perjalanan untuk tiap pelancong',
  'help.guide.final-budget.goal': 'Baca sisi per orang dari buku besar: saldo hari ini, dan biaya nyata per orang.',
  'help.guide.final-budget.step.1':
    '“Saldo” menunjukkan posisi setiap pelancong: batang hijau ke kanan bila perjalanan berhutang kepadanya, batang merah ke kiri bila dia yang berhutang kepada perjalanan, dan jumlahnya di sebelah namanya.',
  'help.guide.final-budget.step.2':
    '“Anggaran akhir” di bawahnya menjawab pertanyaan lain: bukan siapa berhutang apa saat ini, melainkan berapa biaya perjalanan untuk tiap pelancong setelah semuanya dibayar kembali.',
  'help.guide.final-budget.step.3':
    'Klik sebuah nama untuk membuka hitungannya: “Pengeluaran yang dibayar”, lalu “Penggantian bersih” dan “Penggantian tertunda” di bawahnya.',
  'help.guide.final-budget.step.4':
    'Di bawah ketiga baris itu, sebuah daftar di bawah nama masing-masing memuat baris-baris penyusunnya: pengeluaran yang dibayar pelancong itu, transfer yang sudah dicatat dan yang masih terbuka. Setiap daftar berjumlah persis sama dengan baris yang bernama sama.',
  'help.guide.final-budget.result':
    '“Saldo” adalah siapa yang kelebihan atau kekurangan hari ini; “Anggaran akhir” adalah berapa akhirnya biaya perjalanan ini untuk masing-masing dari Anda setelah semuanya dibayar kembali.',
  'help.guide.final-budget.tip.1':
    'Mencatat sebuah pembayaran tidak mengubah anggaran akhir siapa pun. Ia hanya memindahkan sejumlah uang dari penggantian tertunda ke penggantian bersih.',
  'help.guide.final-budget.tip.2':
    'Pengeluaran tanpa pembayar tetap berada di luar kedua kartu itu, sama seperti ia berada di luar saran pelunasan.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Ubah sebuah pemesanan menjadi pengeluaran',
  'help.guide.expense-from-booking.goal':
    'Lekatkan berapa biaya sebenarnya sebuah penerbangan, hotel atau tempat ke catatan yang memilikinya.',
  'help.guide.expense-from-booking.step.1':
    'Temukan pemesanan itu di tab “Transportasi” atau “Pesan” dan klik pensil di kepala kartunya.',
  'help.guide.expense-from-booking.step.2':
    'Gulir ke “Biaya” di dekat akhir formulir. Ia menawarkan “Buat pengeluaran”, yang menyimpan pemesanannya lebih dulu, dan “Tautkan pengeluaran yang ada” untuk pengeluaran yang sudah ada di “Biaya”.',
  'help.guide.expense-from-booking.step.3':
    'Klik “Buat pengeluaran”. Pemesanannya disimpan, formulirnya menutup, dan editor Biaya terbuka dengan judul pemesanan sebagai namanya dan jenisnya sudah dicocokkan ke sebuah kategori.',
  'help.guide.expense-from-booking.step.4':
    'Isi jumlahnya dan mata uangnya, siapa yang membayar dan pembagiannya seperti pengeluaran mana pun, lalu klik “Tambah pengeluaran”. Membuka lagi pemesanannya kini menunjukkannya di bawah “Pengeluaran tertaut”, dengan pensil untuk menyuntingnya, “Lepas tautan, simpan pengeluaran” untuk melepasnya dan tempat sampah untuk membuangnya.',
  'help.guide.expense-from-booking.result':
    'Pemesanannya membawa biayanya, dan pengeluarannya adalah baris biasa di tab Biaya, dengan pembayar, pembagian dan mata uang seperti yang lain.',
  'help.guide.expense-from-booking.tip.1':
    'Menghapus pemesanannya ikut menghapus pengeluaran yang tertaut padanya. “Hapus pengeluaran” di blok “Biaya” pemesanan itu melakukan kebalikannya: pengeluarannya hilang, pemesanannya tinggal. “Lepas tautan, simpan pengeluaran” mempertahankan keduanya.',
  'help.guide.expense-from-booking.tip.2':
    'Sebuah tempat punya blok yang sama di formulirnya, dengan “Buat pengeluaran” yang menyimpan tempatnya lebih dulu.',
  // costs-table
  'help.guide.costs-table.title': 'Merencanakan biaya dalam tabel',
  'help.guide.costs-table.goal':
    'Baca dan ubah pengeluaran sebagai lembar kerja, diurutkan menurut kategori dan dihitung per orang dan per hari.',
  'help.guide.costs-table.step.1':
    'Klik “Tabel”, ikon kedua dari sakelar “Daftar” / “Tabel” di bilah. Buku besar berganti menjadi tabel berisi pengeluaran yang sama, dan pencarian serta filter juga berlaku untuknya.',
  'help.guide.costs-table.step.2':
    'Tabel dikelompokkan menurut kategori, setiap kelompok diawali namanya, berapa pengeluaran yang dimuatnya dan subtotalnya; klik kepalanya untuk melipatnya. Kolomnya adalah “Nama”, “Tanggal”, “Total”, “Orang” dan “Hari”, lalu “Per Orang”, “Per Hari” dan “P. o / Hari”, yang dihitung dari kolom-kolom itu di atas latar abu-abu.',
  'help.guide.costs-table.step.3':
    'Klik sebuah sel untuk mengubahnya langsung di tempat: sebuah nama, sebuah total, “Orang” atau “Hari”. Ketik, lalu tekan Enter atau klik di tempat lain untuk menyimpannya, atau Esc untuk membiarkannya seperti semula; tanggal membuka kalender. “Per Orang” dan kolom hasil hitungan lainnya langsung menyesuaikan.',
  'help.guide.costs-table.step.4':
    'Total dengan gembok tidak bisa diubah di sini: seseorang sudah membayarnya, atau ia dimasukkan dalam mata uang lain, dan tooltipnya menyebut yang mana. Satu klik padanya justru membuka pengeluarannya, agar saldo dan kurs yang dibekukan tetap benar.',
  'help.guide.costs-table.step.5':
    '“Tambah pengeluaran” di akhir sebuah kategori menambahkan baris bernama “Entri Baru” ke dalamnya, bertanggal seperti entri terakhir di sana, dengan nama yang sudah terbuka untuk diubah. Beri total dengan cara yang sama.',
  'help.guide.costs-table.step.6':
    'Dalam tampilan ini kolom kanan menampilkan “Ringkasan” sebagai ganti “Per kategori”. Ia menjumlahkan pengeluaran dengan empat cara: “Kategori”, “Hari”, “Pembayar”, dengan “Belum ada pembayar” untuk yang belum dibayar, dan “Status”, “Dibayar” lawan “Terbuka”.',
  'help.guide.costs-table.result':
    'Setiap pengeluaran berdiri di kategorinya dengan hasilnya per orang dan per hari, dan total yang diubah di sebuah sel langsung terhitung ke kartu-kartu di atas dan ke “Ringkasan”.',
  'help.guide.costs-table.tip.1':
    '“Biaya” mengingat tampilannya di peramban ini: ia terbuka pada tabel sampai Anda mengklik “Daftar” lagi.',
  'help.guide.costs-table.tip.2':
    'Pengeluaran dengan pembagian “Kustom” atau “Struk” tidak punya satu bagian tunggal per orang, jadi “Per Orang” dan “P. o / Hari” miliknya tetap kosong.',
  'help.guide.costs-table.tip.3':
    'Pembayar, pembagian, catatan dan kuitansi disunting di pengeluarannya sendiri: “Opsi lainnya” di akhir sebuah baris menawarkan “Sunting”, dan “Hapus” untuk membuang barisnya.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transportasi',
  'help.ctx.trip-transports.summary':
    'Semua yang membawa Anda di antara perhentian: penerbangan, kereta, bus, mobil, taksi, sepeda, kapal pesiar, feri dan koneksi transportasi umum yang dicarikan TREK untuk Anda. Tab ini adalah daftarnya; semuanya juga dibuat dan dibaca di rencana, dan digambar di peta.',
  'help.ctx.trip-transports.bullet.1':
    'Tab ini hanya memuat perjalanan. Akomodasi, restoran, acara dan tiket ada di tab “Pesan”, jadi entri yang sama tidak pernah muncul dua kali.',
  'help.ctx.trip-transports.bullet.2':
    'Bilah di atas memuat pencarian, “Filter” untuk status, jenis dan peserta, tiga tampilan “Kartu”, “Daftar” dan “Linimasa”, serta “Opsi tampilan”. “Transportasi” di sebelah kanan menambah sebuah perjalanan dengan tangan, dan ikon-ikon sebelumnya, “Impor konfirmasi pemesanan” dan “Impor dari AirTrail”, muncul bila server dapat membaca konfirmasi atau sebuah AirTrail terhubung.',
  'help.ctx.trip-transports.bullet.3':
    '“Kartu” adalah tampilan saat tab terbuka: “Dikonfirmasi” lebih dulu, lalu “Tertunda”, masing-masing bagian bisa dilipat lewat judulnya. Koneksi transportasi umum yang direncanakan tidak punya status dan berada di antara perjalanan yang dikonfirmasi menurut urutan waktu, kecuali “Opsi tampilan” memberinya bagian tersendiri, “Transportasi umum otomatis”. “Daftar” mengelompokkan per hari, dan “Linimasa” membentangkan setiap perjalanan di sepanjang hari-hari perjalanan.',
  'help.ctx.trip-transports.bullet.4':
    'Pita kepala sebuah kartu diberi warna menurut statusnya, hijau untuk yang dikonfirmasi, amber untuk yang tertunda, biru untuk koneksi yang direncanakan, dan memuat titik status, jenis, judul, pensil dan tempat sampah. Di bawahnya: “Tanggal”, “Waktu”, “Kode Pemesanan”, “Rute” serta “Maskapai” dan “No. Penerbangan” atau “No. Kereta”, “Peron” dan “Kursi”. Satu klik pada kartu membuka detailnya.',
  'help.ctx.trip-transports.bullet.5':
    'Transportasi juga dibuat di rencana: tanda + di kepala sebuah hari menawarkan “Tambah transportasi” dan “Transportasi umum”, dan penghubung waktu tempuh antara dua perhentian membuka pencarian yang sama untuk satu ruas itu.',
  'help.ctx.trip-transports.bullet.6':
    'Transportasi dengan kedua ujung terisi menggambar garis di peta. Ikon rute di barisnya dalam rencana hari dan “Di peta” di detailnya menyalakan garis itu, dan “Tampilkan semua rute pemesanan” di bilah alat di atas hari-hari membalik seluruh perjalanan.',
  // transports-list
  'help.guide.transports-list.title': 'Membaca tab Transportasi',
  'help.guide.transports-list.goal': 'Ketahui apa yang dikatakan daftar itu sebelum Anda mengubah apa pun di dalamnya.',
  'help.guide.transports-list.step.1':
    '“Transportasi” adalah tab kedua perjalanan. Isinya hanya perjalanan: hotel, restoran, acara dan tiket ada di tab “Pesan”.',
  'help.guide.transports-list.step.2':
    '“Filter”, corong di bilah, membuka pilihannya: “Status” dengan “Semua”, “Dikonfirmasi” dan “Tertunda”, lalu setiap jenis yang dipakai dengan jumlahnya. Centang satu jenis atau lebih untuk menyisakan hanya jenis itu; angka pada corong menghitung apa yang menyala, dan bilah menyebut berapa perjalanan yang ditampilkan, misalnya “1 dari 4”. “Atur ulang filter” di kaki menu membawa semuanya kembali.',
  'help.guide.transports-list.step.3':
    '“Kartu”, “Daftar” dan “Linimasa” di sebelahnya menata perjalanan sebagai kartu, sebagai baris yang dikelompokkan per hari, atau sebagai batang di sepanjang hari-hari perjalanan. “Opsi tampilan”, ikon penggeser, mengatur “Kelompokkan menurut” dan “Urutkan menurut” untuk “Kartu” dan “Daftar” serta lajur untuk “Linimasa”, dan “Atur ulang tampilan” kembali ke pengaturan bawaan. Di “Kartu”, “Transportasi umum di bagian tersendiri” mengumpulkan koneksi yang direncanakan di bawah “Transportasi umum otomatis”.',
  'help.guide.transports-list.step.4':
    'Sebuah kartu mengatakan semuanya. Pita kepalanya hijau untuk “Dikonfirmasi” dan amber untuk “Tertunda” dan membawa titik status, jenis dan judul. Di bawahnya “Tanggal” memberi hari-hari yang dicakupnya beserta tanggalnya, lalu datang “Waktu”, “Kode Pemesanan”, “Rute” dengan ikon jenisnya di antara perhentian, serta “Maskapai” dan “No. Penerbangan” atau “No. Kereta”, “Peron” dan “Kursi”. Klik kartunya dan detailnya terbuka.',
  'help.guide.transports-list.step.5':
    'Satu klik pada titik status mengganti perjalanan itu antara “Tertunda” dan “Dikonfirmasi”. Pensil di pita kepala membuka formulir transportasi, dan tempat sampah menghapusnya setelah pertanyaan “Hapus pemesanan?”, yang menyebut apa yang akan hilang.',
  'help.guide.transports-list.result':
    'Setiap kartu mengatakan sekilas apakah perjalanan itu sudah dipesan, dan bilah mempersempit atau menata ulang daftar kapan pun Anda membutuhkannya.',
  'help.guide.transports-list.tip.1':
    'Tab mengingat bagaimana Anda meninggalkannya: tampilan, pengelompokan dan pengurutan di peramban ini, bagian yang terlipat untuk setiap perjalanan, dan filter sampai Anda menutup tab peramban.',
  'help.guide.transports-list.tip.2':
    '“Impor konfirmasi pemesanan” dan “Impor dari AirTrail”, dua ikon sebelum “Transportasi”, hanya ada bila server dapat membaca konfirmasi dan bila ada instans AirTrail yang terhubung. Tanpa keduanya, daftar diisi dengan tangan dan lewat pencarian transportasi umum.',
  // add-transport
  'help.guide.add-transport.title': 'Menambah transportasi ke sebuah hari',
  'help.guide.add-transport.goal':
    'Taruh perjalanan yang membawa Anda dari satu perhentian ke perhentian berikutnya pada hari perjalanan itu terjadi.',
  'help.guide.add-transport.step.1':
    'Di kepala hari tempat perjalanan itu berlangsung, klik tanda +, yang tooltipnya berbunyi “Tambah ke hari ini”, dan pilih “Tambah transportasi”. Formulir terbuka dengan hari itu sudah terisi.',
  'help.guide.add-transport.step.2':
    'Pil jenis di pita kepala menyebut apa yang Anda naiki, “Penerbangan” sebagai awalnya. Klik pil itu untuk “Penerbangan”, “Kereta”, “Bus”, “Mobil”, “Taksi”, “Sepeda”, “Kapal Pesiar”, “Feri” atau “Lainnya”, dan formulir mengikuti: penerbangan mendapat sebuah bandara di setiap perhentian, kereta sebuah rantai stasiun, mobil “Penjemputan” dan “Pengembalian” serta “Perhentian di sepanjang jalan”.',
  'help.guide.add-transport.step.3':
    'Ketik judulnya langsung ke pita kepala, tempat contoh abu-abu berada. Itu satu-satunya bidang yang harus diisi: selama belum, baris di bawahnya bertuliskan “Judul *” dan “Tambah” tetap abu-abu. Tulis apa yang akan Anda kenali di papan peron.',
  'help.guide.add-transport.step.4':
    'Di bawah “Rute”, “Dari” dan “Ke” menerima stasiun, pelabuhan atau alamat. Tempat-tempat milik perjalanan ditawarkan sebelum Anda mengetik; ketik setidaknya tiga huruf untuk mencari, lalu pilih satu hasil. Nama yang hanya diketik dan tidak pernah dipilih tidak disimpan, dan tidak menggambar apa pun di peta.',
  'help.guide.add-transport.step.5':
    '“Tanggal” dan “Waktu mulai” mengatakan kapan perjalanan berlangsung, “Tanggal selesai” dan “Waktu selesai” kapan berakhir; perjalanan yang mendarat keesokan hari mengambil hari berikutnya di sana. “Kode Pemesanan” dan “Catatan” lebih ke bawah bersifat opsional, dan satu klik pada pil “Tertunda” di pita kepala mengubahnya menjadi “Dikonfirmasi”.',
  'help.guide.add-transport.step.6': 'Klik “Tambah”.',
  'help.guide.add-transport.result':
    'Transportasi menjadi sebuah baris pada hari itu, pada waktunya di antara perhentian, dan sebuah kartu di tab “Transportasi” di bawah “Tertunda” atau “Dikonfirmasi”.',
  'help.guide.add-transport.tip.1':
    'Baris itu mendarat di tempat yang ditentukan waktu mulainya, setelah perhentian terakhir yang mulai lebih awal. Pegangannya menyeretnya ke mana pun di dalam hari itu, atau ke hari lain.',
  'help.guide.add-transport.tip.2':
    '“Lampirkan file” di bawah “File” menerima tiketnya, dan “Buat pengeluaran” di bawah “Biaya” menyimpan pemesanan dan membuka editor “Biaya” untuk ongkosnya.',
  'help.guide.add-transport.tip.3':
    '“Peserta”, blok pertama formulir, menandai siapa yang ikut dalam perjalanan ini. Begitu perjalanan punya lebih dari satu anggota dan sebuah transportasi menyebut seseorang, “Filter” di tab juga menawarkan “Peserta”, yang mempersempit daftar ke perjalanan milik satu orang.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Membaca sebuah penerbangan dari e-tiketnya',
  'help.guide.import-transport-file.goal':
    'Biarkan TREK menarik sebuah penerbangan, kereta atau feri dari tiket yang dikirim operatornya, dan periksa sebelum disimpan.',
  'help.guide.import-transport-file.step.1':
    'Di bilah tab “Transportasi”, klik ikon unduh sebelum “Transportasi”, yang tooltipnya berbunyi “Impor konfirmasi pemesanan”. Dialog dengan nama itu terbuka, dialog yang sama dengan yang dimiliki tab “Pesan”.',
  'help.guide.import-transport-file.step.2':
    'Jatuhkan tiketnya ke kotak itu, atau klik kotaknya lalu pilih: EML, PDF, PKPass, HTML dan TXT, sampai lima file berukuran 10 MB masing-masing. File yang Anda pilih disebut namanya di kotak itu.',
  'help.guide.import-transport-file.step.3':
    'Klik “Impor”. Dialog itu langsung tertutup; pembacaannya terjadi di latar belakang.',
  'help.guide.import-transport-file.step.4':
    'Sebuah kartu di kanan bawah melaporkan jalannya proses di bawah nama file. “Memproses file…” berubah menjadi centang ketika pembacaan selesai, dan kartu itu menawarkan “Impor”. Klik itu.',
  'help.guide.import-transport-file.step.5':
    'Sebuah penerbangan terbuka di “Tambah transportasi”, sudah terisi: pil jenis pada “Penerbangan”, maskapai dan nomor penerbangan sebagai judul di pita kepala, kedua bandara di bawah “Rute” dengan “Keberangkatan” dan “Kedatangan”, waktunya dan zona waktunya, “Maskapai” dan “No. Penerbangan”, “Kode Pemesanan” dan tiketnya di bawah “File”. Periksa lalu klik “Tambah”.',
  'help.guide.import-transport-file.result':
    'Penerbangan itu menjadi kartu di bawah “Tertunda” pada tab “Transportasi” dan baris pada hari keberangkatannya, dengan tiket di bawah “File”, dan dengan kedua bandara dikenal ia menggambar lengkungannya di peta.',
  'help.guide.import-transport-file.tip.1':
    'Kedua tab berbagi satu impor: file yang memuat sebuah penerbangan dan sebuah hotel membuka penerbangan itu di “Tambah transportasi” dan hotelnya di “Reservasi Baru”, satu demi satu, dari tab mana pun Anda memulai.',
  'help.guide.import-transport-file.tip.2':
    'Bandara ditempatkan berdasarkan kodenya. Stasiun atau pelabuhan yang lokasinya tidak dapat ditemukan oleh pembacaan disebut dalam warna kuning ambar di kartu impor di kanan bawah; pilih dengan tangan di bawah “Rute” sebelum Anda mengklik “Tambah”, atau transportasi itu tidak menggambar apa pun di peta.',
  // plan-transit
  'help.guide.plan-transit.title': 'Merencanakan koneksi transportasi umum',
  'help.guide.plan-transit.goal':
    'Biarkan TREK mencari kereta dan bus sungguhan di antara dua titik sebuah hari dan menaruh yang Anda pilih ke dalam rencana.',
  'help.guide.plan-transit.step.1':
    'Klik tanda + di kepala hari dan pilih “Transportasi umum”. Pencarian terbuka untuk hari itu: hari itu adalah pil di pita kepala, dan “Manual” serta “Otomatis” di sebelahnya beralih antara pencarian ini dan formulir biasa.',
  'help.guide.plan-transit.step.2':
    '“Dari” dan “Ke” menerima sebuah halte atau stasiun. Selama kotaknya masih kosong, perhentian hari itu sendiri dan penginapan perjalanan ini yang ditawarkan; mengetik dua huruf justru mencari stasiun pada jadwal. “Tukar” di antara kedua kotak membalik arah koneksi.',
  'help.guide.plan-transit.step.3':
    '“Berangkat” atau “Tiba” dengan sebuah waktu mengatakan kapan Anda ingin bepergian, dan “Rute terbaik”, “Lebih sedikit transit” atau “Lebih sedikit jalan kaki” mengatakan bagaimana jawabannya diurutkan.',
  'help.guide.plan-transit.step.4':
    'Chip di bawahnya mengatakan moda mana yang boleh dipakai: “Kereta”, “MRT”, “Trem”, “Bus”, “Feri” dan “Kereta gantung”. Matikan satu untuk mengeluarkannya, setidaknya satu tetap menyala. Lalu klik “Cari”.',
  'help.guide.plan-transit.step.5':
    'Setiap hasil memberi keberangkatan dan kedatangan, berapa lama, berapa kali transit dan berapa banyak jalan kaki, serta jalurnya sebagai lencana, dalam warnanya sendiri bila jadwal memberikannya. Klik satu untuk membukanya ruas demi ruas, dengan perhentian tempat Anda naik dan berganti, peron dan jalan kaki di antara jalur.',
  'help.guide.plan-transit.step.6': 'Klik “Tambahkan ke hari”.',
  'help.guide.plan-transit.result':
    'Koneksi menjadi sebuah baris pada hari itu dengan lencana jalurnya, yang tanda panahnya membukanya ruas demi ruas, dan sebuah kartu di tab “Transportasi” di antara perjalanan yang dikonfirmasi, berwarna biru.',
  'help.guide.plan-transit.tip.1':
    'Koneksi berasal dari Transitous, layanan komunitas gratis di atas data jadwal publik: tanpa kunci, tanpa akun. Seorang admin bisa mengarahkan pencarian ke Google sebagai gantinya.',
  'help.guide.plan-transit.tip.2':
    'Tidak ada yang ditemukan? Umpan datanya mencakup sebuah wilayah dan sebuah periode. Coba waktu lain, nyalakan lebih banyak moda, atau pilih sebuah stasiun alih-alih tempatnya sendiri. Pesannya menyebut layanan yang menjawab.',
  'help.guide.plan-transit.tip.3':
    'Pencarian yang sama terbuka untuk satu ruas: klik penghubung waktu tempuh antara dua perhentian dan pilih “Transportasi umum”. “Dari”, “Ke” dan waktu keberangkatan sudah diisikan untuk Anda.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Membuka dan mengubah koneksi yang direncanakan',
  'help.guide.change-transit-route.goal': 'Baca koneksi jalur demi jalur, ganti namanya, atau cari rutenya lagi.',
  'help.guide.change-transit-route.step.1':
    'Di tab “Transportasi”, koneksi yang direncanakan adalah kartu dengan pita kepala biru, di antara perjalanan yang dikonfirmasi menurut urutan waktu; dengan “Transportasi umum di bagian tersendiri” dinyalakan di bawah “Opsi tampilan”, ia justru berada di bawah “Transportasi umum otomatis”. Klik kartunya; koneksi itu terbuka sebagai pemesanan.',
  'help.guide.change-transit-route.step.2':
    'Ubin di bagian atas memberi keberangkatan dan kedatangan dengan perhentiannya, “Durasi”, “Transit” dan “Jalan kaki”. “Itinerari” di bawahnya menelusuri koneksi jalur demi jalur, dengan waktu, peron dan jalan kaki di antara jalur.',
  'help.guide.change-transit-route.step.3':
    '“Ubah rute” di kaki pemesanan membuka pencarian lagi, sudah terisi dengan kedua ujung koneksi ini dan harinya.',
  'help.guide.change-transit-route.step.4':
    'Klik “Cari”, buka koneksi lain dan klik “Tambahkan ke hari”; koneksi itu mengambil tempat yang lama. “Sunting”, di ujung kanan kaki pemesanan, justru membuka formulir transportasi biasa, tempat “Kode Pemesanan”, peserta, catatan dan file berada.',
  'help.guide.change-transit-route.result':
    'Perjalanan itu membawa itinerari baru, dan kartunya di tab “Transportasi” menampilkan jalur dan waktu yang baru.',
  'help.guide.change-transit-route.tip.1':
    'Klik judul di kepala pemesanan untuk mengganti nama koneksi tanpa menyentuh rutenya. Catatannya ditulis di formulir transportasi di balik “Sunting”.',
  'help.guide.change-transit-route.tip.2':
    'Tempat sampah di kaki pemesanan menghapus koneksi itu setelah sebuah pertanyaan; hari itu tetap punya perhentiannya.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Mengubah cara satu ruas ditempuh',
  'help.guide.leg-travel-mode.goal':
    'Tempuh satu ruas sebuah hari dengan jalan kaki padahal sisanya dikendarai, atau serahkan ruas itu ke pencarian transportasi umum.',
  'help.guide.leg-travel-mode.step.1':
    'Penghubung di antara perhentian baru muncul setelah rute hari itu menyala. Klik kepala hari itu untuk membukanya, lalu “Rute” di bilah di bawah perhentiannya.',
  'help.guide.leg-travel-mode.step.2':
    'Setiap penghubung menyebut waktu tempuh dan jarak ruas itu, dengan ikon moda yang dipakai untuk menghitung rutenya: mobil untuk berkendara, telapak kaki untuk jalan kaki.',
  'help.guide.leg-travel-mode.step.3':
    'Klik penghubung itu. Menu menawarkan “Berkendara” dan “Jalan kaki”, “Transportasi umum”, dan “Gunakan bawaan hari”.',
  'help.guide.leg-travel-mode.step.4':
    'Pilih “Jalan kaki”. Hanya ruas ini yang berubah; sisa hari itu tetap dengan modanya sendiri.',
  'help.guide.leg-travel-mode.result':
    'Ruas itu menampilkan ikon telapak kaki dan waktu jalan kakinya, dan ruas-ruas lain hari itu tetap memakai moda hari itu.',
  'help.guide.leg-travel-mode.tip.1':
    'Moda milik ruas, bukan milik hari: tombol “Berkendara” dan “Jalan kaki” untuk seluruh hari tidak pernah menimpa ruas yang Anda setel dengan tangan. “Gunakan bawaan hari” mengembalikan ruas itu kepada mereka.',
  'help.guide.leg-travel-mode.tip.2':
    '“Transportasi umum” di menu yang sama membuka pencarian koneksi persis untuk ruas ini, dengan kedua ujung dan waktu keberangkatan sudah terisi.',
  'help.guide.leg-travel-mode.tip.3':
    'Waktunya berasal dari perute publik di atas jalan dan jalur pejalan kaki sungguhan. Ruas yang tidak bisa dijawabnya tetap memakai garis lurusnya dan tidak menampilkan waktu.',
  // edit-transport
  'help.guide.edit-transport.title': 'Mengubah atau menghapus transportasi',
  'help.guide.edit-transport.goal':
    'Perbaiki waktu, peron atau kode pemesanan, atau keluarkan perjalanan itu dari rencana perjalanan.',
  'help.guide.edit-transport.step.1':
    'Di rencana hari, sebuah transportasi adalah baris di antara perhentian, diberi warna menurut jenisnya. Klik baris itu dan pemesanannya terbuka: status, jenis, hari dan “Kode Pemesanan” sebagai pil di kepalanya, waktu keberangkatan dan kedatangan dengan bandara atau stasiunnya di bawah.',
  'help.guide.edit-transport.step.2':
    '“Sunting” di kaki pemesanan membuka formulir yang membuatnya, dengan “Edit transportasi” di atas judul di pita kepalanya. Semuanya bisa diubah di sana: judul, pil status dan jenis, rutenya, hari dan waktunya, “Kode Pemesanan”.',
  'help.guide.edit-transport.step.3':
    'Rute sebuah penerbangan adalah rantai bandara, rute kereta rantai stasiun. “Tambah persinggahan” menaruh satu lagi di antaranya, dan setiap ruas menyimpan waktunya sendiri dan nomor penerbangan atau nomor keretanya sendiri.',
  'help.guide.edit-transport.step.4':
    'Klik “Perbarui”. Untuk menghapus transportasi sama sekali, pakai tempat sampah di kiri bilah yang sama, yang di kaki pemesanannya atau yang pada kartunya di tab “Transportasi”, lalu konfirmasikan.',
  'help.guide.edit-transport.result':
    'Perubahan tampak di semua tempat transportasi itu muncul: tab “Transportasi”, hari perjalanannya berlangsung, dan garisnya di peta.',
  'help.guide.edit-transport.tip.1':
    'Formulir yang sama terbuka dari kedua sisi: lewat “Sunting” di pemesanan yang dibuka oleh sebuah baris di rencana hari, dan lewat pensil pada kartu di tab “Transportasi”. Koneksi transportasi umum yang direncanakan juga terbuka sebagai pemesanan; “Ubah rute” di sana membuka pencarian lagi, dan “Sunting” menuju formulir ini.',
  'help.guide.edit-transport.tip.2':
    'Memindahkan transportasi ke hari lain sama sekali tidak memerlukan formulir: seret barisnya dari satu kartu hari ke kartu berikutnya.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Menggambar transportasi di peta',
  'help.guide.transport-on-map.goal':
    'Lihat ke mana sebenarnya sebuah penerbangan, sebuah perjalanan berkendara atau sebuah koneksi berjalan.',
  'help.guide.transport-on-map.step.1':
    'Transportasi dengan kedua ujung terisi membawa ikon rute kecil di barisnya dalam rencana hari. Klik ikon itu; tooltipnya berubah menjadi “Sembunyikan rute pemesanan”.',
  'help.guide.transport-on-map.step.2':
    'Rutenya digambar di peta, dengan penanda berbentuk pil di setiap ujung yang membawa ikon transportasi itu.',
  'help.guide.transport-on-map.step.3':
    'Klik penanda ujung dan pemesanan terbuka tepat di atas peta: status, jenis, hari dan “Kode Pemesanan” di kepalanya, di bawahnya waktu dengan bandara atau stasiunnya, maskapai dan nomor penerbangan. “Tutup” di pita kepalanya menyingkirkannya.',
  'help.guide.transport-on-map.step.4':
    'Ikon rute di bilah alat di atas hari-hari melakukannya untuk seluruh perjalanan sekaligus: “Tampilkan semua rute pemesanan”, dan “Sembunyikan semua rute pemesanan” untuk membersihkannya lagi.',
  'help.guide.transport-on-map.step.5':
    'Koneksi transportasi umum yang direncanakan tidak punya ikon rute sendiri. Ia digambar lewat sakelar “Rute” hari itu, dan karena itu “Sembunyikan semua rute pemesanan” tidak membersihkannya selama rute hari itu masih menyala.',
  'help.guide.transport-on-map.result':
    'Rute-rute itu ada di peta dengan penanda di setiap ujung, dan tetap di sana sampai Anda mematikannya lagi.',
  'help.guide.transport-on-map.tip.1':
    'Penerbangan, kapal pesiar dan feri digambar sebagai lengkungan, mobil, bus, taksi dan sepeda mengikuti jalan sungguhan, dan kereta atau koneksi yang direncanakan melewati stasiun-stasiun yang disinggahinya.',
  'help.guide.transport-on-map.tip.2':
    'Pemesanan yang “Dikonfirmasi” adalah garis utuh, yang “Tertunda” garis putus-putus. Pengaturan “Label rute pemesanan” mencetak kode bandara atau nama stasiun ke dalam penanda ujung.',
  'help.guide.transport-on-map.tip.3':
    '“Tampilkan semua rute pemesanan” adalah papan bersih, bukan lapisan: ia membuang apa yang telah disetel ikon-ikon tunggal, jadi menekannya dua kali meninggalkan Anda dengan semuanya menyala atau semuanya mati.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Mengimpor penerbangan dari AirTrail',
  'help.guide.airtrail-import.goal':
    'Bawa penerbangan yang sudah Anda simpan di AirTrail ke dalam perjalanan sekaligus, dan biarkan mereka mengikuti AirTrail sejak saat itu.',
  'help.guide.airtrail-import.step.1':
    'Dengan addon AirTrail menyala dan instans Anda terhubung di bawah “Integrasi” di “Pengaturan”, bilah tab “Transportasi” membawa ikon pesawat sebelum “Transportasi”, “Impor dari AirTrail”. Klik ikon itu.',
  'help.guide.airtrail-import.step.2':
    '“Impor dari AirTrail” mendaftar penerbangan akun Anda dalam dua kelompok. “Selama perjalanan ini” memuat yang bertanggal di dalam perjalanan, sudah tercentang; “Penerbangan lain” memuat sisanya, tidak tercentang. Penerbangan yang sudah ada di perjalanan diredupkan dan ditandai “Diimpor”.',
  'help.guide.airtrail-import.step.3':
    'Setiap baris adalah kotak centang dengan maskapai dan nomor penerbangan, kedua bandara dan tanggalnya. Klik sebuah baris untuk mengikutsertakan penerbangan itu atau mengecualikannya; yang di bawah “Penerbangan lain” hanya ikut bila Anda mencentangnya.',
  'help.guide.airtrail-import.step.4':
    'Penerbangan yang bersambung, masing-masing berangkat dari bandara tempat yang sebelumnya mendarat dalam satu hari, dibingkai bersama. Centang di bawahnya, “Impor sebagai satu penerbangan dengan transit di” bandara itu, sudah menyala: biarkan menyala untuk satu pemesanan dengan persinggahan, atau matikan untuk mengimpor tiap ruas sebagai penerbangan terpisah.',
  'help.guide.airtrail-import.step.5':
    'Klik tombol di kanan bawah, yang menghitung penerbangan yang tercentang, seperti pada “Impor 2”. Pesan sesudahnya mengatakan berapa banyak yang masuk.',
  'help.guide.airtrail-import.step.6':
    'Penerbangan-penerbangan itu menjadi kartu di bawah “Dikonfirmasi”, masing-masing dengan pil AirTrail biru di sebelah judulnya, dan baris pada hari-hari mereka beroperasi. Sambungan yang digabung adalah satu kartu, dengan rutenya melewati persinggahan.',
  'help.guide.airtrail-import.result':
    'Penerbangan dari AirTrail adalah kartu di tab “Transportasi” dan baris pada harinya, masing-masing mengenakan pil AirTrail yang mengatakan dari mana asalnya.',
  'help.guide.airtrail-import.tip.1':
    'Penerbangan yang sudah ada di perjalanan dengan nomor dan tanggal yang sama dilewati, dan sebuah pesan mengatakan berapa banyak. Panah pembatalan di bilah alat di atas hari menarik kembali seluruh impor.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail tetap menjadi sumber kebenaran. TREK membaca perubahannya ketika Anda membuka perjalanan dan setiap beberapa menit di latar belakang; penerbangan yang dihapus di sana mempertahankan kartunya, dengan pilnya berubah menjadi “Tidak tersinkron”. Suntingan yang dibuat di TREK hanya berjalan kembali dengan “Tulis perubahan kembali ke AirTrail” menyala di bawah “Integrasi”.',
  'help.guide.airtrail-import.tip.3':
    'Sambungan yang digabung tidak punya satu penerbangan AirTrail tunggal untuk diikuti, jadi ia adalah impor sekali jalan: ia mempertahankan pil biru, dan menunjuk pil itu mengatakannya. Hal yang sama terjadi pada penerbangan tersinkron yang Anda beri persinggahan dengan tangan.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Perjalanan darat',
  'help.ctx.trip-roadtrip.summary':
    'Rencana dibaca sebagai satu kali berkendara: hari yang sama dan tempat yang sama, dirangkai menjadi perhentian dengan jarak berkendara di antaranya, pada bilah perjalanan di kolom kiri dan di peta. Ia menyebutkan seberapa jauh dan seberapa lama, di mana bahan bakar habis, dan apa saja yang ada di sepanjang jalan.',
  'help.ctx.trip-roadtrip.bullet.1':
    '“Hari” dan “Perjalanan darat” di atas kolom kiri beralih antara rencana harian dan perjalanan berkendara. Tidak ada yang disalin dan tidak ada yang diubah: “Hari” mengembalikan rencana persis seperti semula.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Kepala bilah perjalanan menjumlahkan seluruh perjalanan: “Jarak”, “Waktu berkendara” dan “Perhentian”. Di bawahnya ada sebuah kartu untuk setiap hari yang punya perjalanan berkendara, dengan kilometer hari itu sendiri, untuk berapa perhentian hari itu, apa saja yang dilampauinya, dan lencana “Jalur”.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Perhentian bernomor adalah tempat yang menjadi tujuan hari itu. Perhentian di jalan, bahan bakar, pengisian daya, tempat istirahat, memakai ikon jenisnya alih-alih nomor dan tidak ikut dihitung. Klik sebuah nomor untuk mengubah jenisnya, dan lencana “Singgah” untuk menyatakan berapa lama.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Di antara dua perhentian, bilah berkendara memberikan ruas itu sebagai jarak dan waktu. Klik untuk membuka “Rute untuk ruas ini”, atau klik rute yang tergambar di peta untuk membelokkan ruas melalui sebuah titik lintas.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Kolom kanan menjadi “Sepanjang rute”: pilih apa yang dicari dan harinya dalam satu baris, seberapa lebar koridornya, lalu “Cari”. Tanda plus pada sebuah hasil, “Tambah”, membuka dialog singkat yang menaruhnya pada perjalanan di titik tempat ia benar-benar dilewati.',
  'help.ctx.trip-roadtrip.bullet.6':
    '“Pengaturan berkendara” di bawahnya memuat batasan, mobil dan jarak jangkaunya, waktu perjalanan harian, apa yang dihindari, dan bagaimana garisnya digambar. Semuanya milik perjalanan, jadi semua orang merencanakan dengan mobil yang sama.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Membaca perjalanan sebagai satu kali berkendara',
  'help.guide.roadtrip-mode.goal':
    'Alihkan rencana ke mode perjalanan darat dan baca apa yang dikatakan bilah perjalanan.',
  'help.guide.roadtrip-mode.step.1':
    'Klik “Perjalanan darat” pada sakelar “Hari” dan “Perjalanan darat” di atas kolom kiri. Rencana harian digantikan perjalanan berkendara, dan peta menggambar setiap hari yang sudah punya rute.',
  'help.guide.roadtrip-mode.step.2':
    'Kepala bilah perjalanan menjumlahkan seluruh perjalanan: “Jarak”, “Waktu berkendara” dan “Perhentian”.',
  'help.guide.roadtrip-mode.step.3':
    'Di bawahnya ada sebuah kartu untuk setiap hari yang punya perjalanan berkendara; hari tanpa apa pun untuk dikendarai ditinggalkan. Kepalanya memuat nomor dan tanggal hari itu, berkendara sebagai jarak dan waktu, serta untuk berapa perhentian hari itu.',
  'help.guide.roadtrip-mode.step.4':
    'Di dalam kartu, hari itu adalah sebuah rantai: satu perhentian bernomor per tempat, satu bilah berkendara di antara tiap pasangan, dan waktu tiba di tepi kanan.',
  'help.guide.roadtrip-mode.step.5':
    'Klik kepala sebuah hari untuk melipatnya. Hari yang terlipat juga hilang dari peta; klik kepalanya lagi untuk memunculkannya kembali.',
  'help.guide.roadtrip-mode.result':
    'Kolom kiri adalah perjalanan berkendara dan peta menampilkan setiap harinya. “Hari” langsung mengembalikan rencana, tanpa perubahan.',
  'help.guide.roadtrip-mode.tip.1':
    'Pilihan itu diingat per perjalanan selama tab peramban terbuka, jadi memuat ulang akan kembali ke perjalanan berkendara.',
  'help.guide.roadtrip-mode.tip.2':
    'Sakelar itu baru ada setelah admin menyalakan addon “Perjalanan darat”, di bawah “Addon” pada “Administrasi”.',
  'help.guide.roadtrip-mode.tip.3':
    'Di ponsel tidak ada sakelar: addon itu menambahkan tab “Perjalanan darat” sendiri di samping “Rencana”.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Perhentian di jalan, dan berapa lama Anda singgah',
  'help.guide.roadtrip-stops.goal':
    'Ubah sebuah tempat pada perjalanan menjadi perhentian di jalan, dan tentukan berapa lama tiap perhentian berlangsung.',
  'help.guide.roadtrip-stops.step.1':
    'Klik nomor di depan sebuah perhentian pada bilah perjalanan. Labelnya “Jadikan perhentian di jalan”, dan ia membuka jenis-jenis perhentian sebagai sebaris cakram berwarna di bawahnya.',
  'help.guide.roadtrip-stops.step.2':
    'Pilih jenisnya; setiap cakram menyebut namanya saat Anda menunjuknya: “Penginapan”, “Bahan bakar”, “Pengisian daya”, “Tempat istirahat”, “Perkemahan”, “Makanan” atau “Objek wisata”. Nomornya berubah menjadi ikon jenis itu dan perhentian di bawahnya dinomori ulang.',
  'help.guide.roadtrip-stops.step.3':
    'Perhentian di jalan bukan tujuan, jadi kepala hari itu menghitung satu perhentian lebih sedikit.',
  'help.guide.roadtrip-stops.step.4':
    'Klik ikonnya lagi, “Ubah jenis perhentian”, lalu pilih “Kembali jadi tujuan” untuk mengembalikan nomor perhentian itu.',
  'help.guide.roadtrip-stops.step.5':
    'Setiap perhentian membawa lencana “Singgah”. Klik untuk membuka “Waktu di perhentian ini”.',
  'help.guide.roadtrip-stops.step.6':
    'Atur lamanya dengan penggeser, dengan tombol minus dan plus, atau dengan salah satu nilai siap pakai, perhatikan “Berangkat” bergeser sementara “Tiba” tetap pada waktu perjalanan sampai di sana, lalu klik “Simpan”.',
  'help.guide.roadtrip-stops.result':
    'Perhentian yang Anda beri waktu membawa lama singgahnya yang baru pada lencana “Singgah” miliknya dan setiap waktu tiba sesudahnya ikut bergeser, sedangkan yang Anda kirim ke sebuah jenis lalu kembali menjadi tujuan bernomor lagi.',
  'help.guide.roadtrip-stops.tip.1':
    'Lama singgah melekat pada tempat, bukan pada satu kunjungan: tempat yang direncanakan pada dua hari disinggahi sama lamanya pada keduanya.',
  'help.guide.roadtrip-stops.tip.2':
    'Perhentian di jalan juga tampil di “Hari”. “Tampilkan juga di Hari”, di bawah “Perhentian layanan” pada “Pengaturan berkendara”, kalau dimatikan membuat perhentian itu hanya ada di “Perjalanan darat”.',
  'help.guide.roadtrip-stops.tip.3': '“Tanpa singgah”, pada dialog yang sama, menghapus waktunya lagi.',
  'help.guide.roadtrip-stops.tip.4':
    'Klik sebuah perhentian di jalan atau malam yang dipesan untuk membuka kartunya di atas peta. Dengan “Perjalanan darat” menyala, “Sunting” di sana membuka dialog ringkas yang dipakai pencarian sebagai ganti formulir tempat, dan “Detail lainnya” di dialog itu membuka formulir lengkapnya.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Temukan bahan bakar, makanan dan tempat menginap di sepanjang rute',
  'help.guide.roadtrip-corridor.goal':
    'Cari di jalan yang benar-benar Anda lewati, dan taruh temuan itu pada ruas yang tepat.',
  'help.guide.roadtrip-corridor.step.1':
    'Di bawah “Mencari”, buka daftarnya dan centang apa yang Anda butuhkan. “Bahan bakar”, “Pengisian daya”, “Tempat istirahat”, “Perkemahan”, “Penginapan”, “Makanan” dan “Objek wisata” bisa digabungkan: daftarnya tetap terbuka untuk pilihan kedua, dan barisnya lalu menampilkan setiap jenis dengan ikonnya.',
  'help.guide.roadtrip-corridor.step.2':
    'Pilih harinya di menu tarik-turun di ujung baris yang sama. Ia menawarkan hari-hari yang punya kartu di bilah perjalanan, dan “Cari” menunggu sampai hari yang Anda pilih sudah punya rute.',
  'help.guide.roadtrip-corridor.step.3':
    'Di bawah “Dalam”, pilih seberapa jauh ke kiri dan kanan jalan yang dicari, 2 km, 5 km atau 10 km, lalu klik “Cari”.',
  'help.guide.roadtrip-corridor.step.4':
    'Hasilnya kembali dikelompokkan menurut jenis, dalam urutan Anda melewatinya, masing-masing dengan seberapa jauh letaknya di sepanjang hari itu dan seberapa jauh dari rute.',
  'help.guide.roadtrip-corridor.step.5':
    'Tanda plus pada sebuah hasil, “Tambah”, membuka “Tambahkan sebagai perhentian”. Ia menyebutkan hari mana dan posisi keberapa perhentian itu jatuh, lalu menanyakan “Jenis perhentian” serta “Waktu di perhentian ini”. “Tambah” menaruhnya pada perjalanan; “Detail lainnya” justru membuka formulir tempat lengkap. Hasil berupa penginapan membawa ikon tempat tidur sebagai ganti tanda plus, “Tambahkan sebagai menginap”, dan dialognya menawarkan “Istirahat” atau “Menginap”; sebuah malam hanya menanyakan “Check-in”-nya.',
  'help.guide.roadtrip-corridor.result':
    'Perhentian yang Anda tambahkan duduk pada perjalanan di titik tempat ia benar-benar dilewati, dengan ikon jenisnya. Hari itu dirutekan lagi melaluinya, yang mengosongkan daftar: cari lagi untuk yang berikutnya.',
  'help.guide.roadtrip-corridor.tip.1':
    'Tidak ada yang dicari sampai Anda menekan “Cari”: satu kali jalan berarti banyak permintaan ke sebuah layanan bersama.',
  'help.guide.roadtrip-corridor.tip.2':
    '“Saring menurut nama” mempersempit apa yang sudah kembali tanpa bertanya lagi, dan “Hapus hasil” mengosongkan daftar beserta pinnya. Klik sebuah hasil untuk membawanya ke tampilan peta.',
  'help.guide.roadtrip-corridor.tip.3':
    'Sebuah hasil juga bisa diseret dari peta ke rute yang tergambar, dan begitulah Anda sendiri memilih ruasnya di tempat jalan yang sama dilewati dua kali. “Manual”, di samping “Cari”, menambahkan tempat yang tidak ditemukan pencarian dengan mencarinya berdasarkan nama.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Membelokkan ruas melalui titik lintas',
  'help.guide.roadtrip-via.goal':
    'Arahkan sebuah ruas ke jalan yang benar-benar Anda inginkan, tanpa menambahkan perhentian padanya.',
  'help.guide.roadtrip-via.step.1':
    'Bawa ruas yang Anda inginkan ke tampilan: klik sebuah perhentian pada bilah perjalanan, lalu tutup kartu yang terbuka di atas peta.',
  'help.guide.roadtrip-via.step.2':
    'Klik rute yang tergambar. Sebuah titik lintas dijatuhkan pada ruas yang Anda klik, dan ruas itu dirutekan ulang melewatinya.',
  'help.guide.roadtrip-via.step.3':
    'Bilah perjalanan mengikuti: kepala hari itu memuat jarak dan waktu berkendara yang baru, dan setiap waktu tiba setelah titik lintas ikut bergeser.',
  'help.guide.roadtrip-via.step.4':
    'Arahkan kursor ke pegangannya dan ia menyebutkan apa yang bisa dilakukan: “Seret untuk mengubah rute, klik kanan untuk menghapus”. Seret ke tempat lain dan ruas itu digambar ulang melalui titik baru.',
  'help.guide.roadtrip-via.step.5':
    'Klik kanan pegangannya untuk menghapusnya. Ruas itu kembali menempuh jalan langsung.',
  'help.guide.roadtrip-via.result':
    'Ruas itu mengikuti jalan yang Anda pilih, dan jarak, waktu berkendara serta waktu tiba hari itu dihitung ulang untuknya.',
  'help.guide.roadtrip-via.tip.1':
    'Titik lintas bukan perhentian: ia tidak punya nomor, tidak punya lama singgah dan tidak punya waktu tiba, serta tidak dihitung dalam perhentian hari itu.',
  'help.guide.roadtrip-via.tip.2':
    'Pegangannya digambar mulai dari tingkat zum 9, jadi peta yang dipaskan ke seluruh perjalanan menampilkan garisnya tanpa pegangan.',
  'help.guide.roadtrip-via.tip.3':
    'Klik yang berjarak lebih dari dua kilometer dari setiap ruas yang tergambar diabaikan, begitu pula klik pada penerbangan, kereta atau feri.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Mencoba cara lain menempuh sebuah ruas',
  'help.guide.roadtrip-alternatives.goal': 'Lihat apa lagi yang ditawarkan mesin rute untuk satu penggal, lalu ambil.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klik sebuah bilah berkendara pada bilah perjalanan, baris di antara dua perhentian yang memberikan ruas sebagai jarak dan waktu. Labelnya “Rute lain”.',
  'help.guide.roadtrip-alternatives.step.2':
    '“Rute untuk ruas ini” terbuka di atas peta, satu entri per jalan dengan panjangnya. Peta menggambar setiap jalan dengan waktu berkendaranya: jalan yang sedang Anda tempuh dalam biru penuh, yang lain dalam biru yang lebih pucat.',
  'help.guide.roadtrip-alternatives.step.3':
    'Arahkan kursor ke sebuah entri untuk menyalakan jalan itu. “Saat ini” adalah jalan yang sedang ditempuh dan “Tercepat” yang paling cepat; yang lain menyebut berapa lebih lambatnya, atau kelas jalan mana yang mereka tinggalkan.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klik sebuah entri untuk menempuh jalan itu, atau “Tutup” untuk tetap di jalan yang sekarang.',
  'help.guide.roadtrip-alternatives.result':
    'Ruas itu menempuh jalan yang Anda pilih, dan jarak pada bilah perjalanan serta waktu tiba sesudahnya ikut berubah.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Memilih jalan lain lebih dulu memeriksanya dengan mesin rute perjalanan darat, lalu menahan ruas itu di jalan tersebut dengan titik lintas sesedikit mungkin, menggantikan titik lintas yang sudah ada pada ruas itu. Jalan yang tidak mau diikuti mesin rute tidak disimpan. Memilih jalan mesin rute sendiri menghapus titik lintas itu lagi.',
  'help.guide.roadtrip-alternatives.tip.2':
    '“Tanpa jalan tol cepat”, “Tanpa tol” dan “Tanpa feri” berasal dari mesin kedua dengan model kecepatannya sendiri, jadi waktunya tidak sebanding dengan yang lain.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Mengatur mobil dan batasan berkendara',
  'help.guide.roadtrip-limits.goal':
    'Beri tahu TREK Anda mengemudi apa dan seberapa jauh Anda bersedia mengemudi sekali jalan.',
  'help.guide.roadtrip-limits.step.1':
    '“Pengaturan berkendara” berada di bawah pencarian pada kolom kanan. Lencananya menyebutkan apa yang sudah diatur; klik untuk membukanya.',
  'help.guide.roadtrip-limits.step.2':
    'Di bawah “Mengemudi”, “Perjalanan terlama sekali jalan” dan “Mengemudi per hari” dalam menit. Kolom kosong berarti “mati”, dan tidak ada yang ditandai.',
  'help.guide.roadtrip-limits.step.3':
    'Di bawah “Kendaraan”, sebutkan Anda mengemudi apa. “Bensin” mengisi hanya di perhentian bahan bakar, “Listrik” hanya di perhentian pengisian daya, “Keduanya” di kedua-duanya.',
  'help.guide.roadtrip-limits.step.4':
    'Ketik sendiri “Jarak per tangki”, atau “Jarak per pengisian”. “Hitung dari data mobil” lebih ke bawah mengambil “Kapasitas tangki” dan “Konsumsi”, atau “Baterai”, “Konsumsi” dan “Penurunan baterai”, lalu menghitungnya.',
  'help.guide.roadtrip-limits.step.5':
    '“Hindari bila bisa” adalah preferensi, bukan larangan: hari yang tidak punya jalan memutar tetap memakai jalan itu, dan mengatakannya di kepalanya.',
  'help.guide.roadtrip-limits.step.6':
    'Tutup dialognya. Kartu itu menyebutkan apa yang sudah diatur, dan bilah perjalanan menandai setiap ruas dan setiap hari yang melampauinya.',
  'help.guide.roadtrip-limits.result':
    'Lencana kartu itu menyebutkan apa yang sudah diatur, dan setiap ruas dan hari yang melewati batas membawa lencana pada bilah perjalanan.',
  'help.guide.roadtrip-limits.tip.1':
    'Pengaturan itu milik perjalanan, jadi semua orang di dalamnya merencanakan dengan mobil dan batasan yang sama.',
  'help.guide.roadtrip-limits.tip.2':
    '“Isi sampai” menyatakan seberapa penuh sebuah perhentian mengisi, karena tidak ada yang mengisi sampai 100 % di jalan. Perhentian bahan bakar atau pengisian daya bisa menimpanya untuk dirinya sendiri.',
  'help.guide.roadtrip-limits.tip.3':
    'Di bawah “Garis rute”, “Hubungkan hari” juga merutekan perjalanan dari perhentian terakhir satu hari ke perhentian pertama hari berikutnya, “Mulai dan akhiri setiap hari di penginapan Anda” memulai dan mengakhiri sebuah hari di malam-malam yang dipesan di sekitarnya, dan “Satu warna per hari” menggambar setiap hari dalam warnanya sendiri.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Memberi hari berkendara awal dan akhir',
  'help.guide.roadtrip-day-window.goal':
    'Berhentilah mengemudi pada jam yang Anda pilih, dan tentukan di mana hari itu harus berakhir.',
  'help.guide.roadtrip-day-window.step.1':
    'Buka “Pengaturan berkendara” di kolom kanan dan cari “Waktu perjalanan harian”.',
  'help.guide.roadtrip-day-window.step.2':
    'Tetapkan “Awal hari”. Sendirian ia tidak melakukan apa-apa: kedua waktu dibutuhkan, seperti kata catatan di bawahnya.',
  'help.guide.roadtrip-day-window.step.3':
    'Tetapkan “Akhir hari”. Perjalanan kini berhenti pada jam itu dan membawa sisanya ke pagi berikutnya, sebagai baris “Akhir hari” dan baris “Lanjutkan perjalanan” pada bilah perjalanan.',
  'help.guide.roadtrip-day-window.step.4':
    'Di bawah “Akhir hari”, pilih “Di sepanjang rute” untuk berhenti di jalan pada waktu akhir, atau “Di tempat terakhir” untuk berhenti sebelum perjalanan berikutnya melewatinya.',
  'help.guide.roadtrip-day-window.step.5':
    'Tutup dialognya. Kartu “Pengaturan berkendara” membawa kedua waktu itu sebagai lencana.',
  'help.guide.roadtrip-day-window.result':
    'Perjalanan dipotong menjadi hari-hari perjalanan sepanjang yang Anda tetapkan, dan apa yang tidak muat berlanjut pada hari-hari hasil perhitungan setelah hari terakhir. Hari Anda dan tempat-tempatnya tidak berubah.',
  'help.guide.roadtrip-day-window.tip.1':
    'Mengosongkan salah satu waktu mematikan semuanya lagi. Waktu yang Anda sematkan sendiri pada sebuah perhentian selalu diutamakan.',
  'help.guide.roadtrip-day-window.tip.2':
    'Dengan waktu perjalanan harian yang ditetapkan, hari selalu terhubung: perjalanan dari perhentian terakhir suatu hari ke perhentian pertama hari berikutnya dirutekan dan dihitung.',
  'help.guide.roadtrip-day-window.tip.3':
    'Setiap akhir hari juga menjadi penanda di peta, sebuah bulan dengan nomor harinya. Seret di sepanjang rute, atau ke sebuah tempat, agar hari berakhir di tempat lain; klik kanan untuk mengembalikan akhir otomatis, dan “Pulihkan akhir hari otomatis” pada dialog ini membatalkan semuanya.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Mengisi bahan bakar sebelum tangki habis',
  'help.guide.roadtrip-refuel.goal':
    'Temukan tempat mengisi bahan bakar pada penggal yang masih bisa dicapai mobil, lalu taruh pada perjalanan.',
  'help.guide.roadtrip-refuel.step.1':
    'Dengan jarak jangkau yang ditetapkan, bilah perjalanan menggambar sebuah bilah melintang pada ruas tempat bahan bakar habis: “Tangki habis di sini”, atau “Baterai habis di sini” pada mobil listrik, dan di bawahnya seberapa jauh itu di dalam ruas.',
  'help.guide.roadtrip-refuel.step.2':
    'Lampu pada bilah itu adalah tombolnya: “Cari bahan bakar”, atau “Cari pengisian daya” pada mobil listrik. Ia menelusuri jalan sebelum titik itu dan menyebut “Mencari di sepanjang rute…” selama ia bekerja.',
  'help.guide.roadtrip-refuel.step.3':
    'Paling banyak tiga stasiun kembali, masing-masing dengan seberapa jauh dari rute dan berapa sisa jarak jangkau yang akan tertinggal.',
  'help.guide.roadtrip-refuel.step.4':
    'Tanda plus pada sebuah tawaran menambahkannya sebagai perhentian bahan bakar. “Tambahkan sebagai perhentian” terbuka dengan jenis dan waktunya sudah terisi, dan “Tambah” menaruhnya pada ruas di titik tempat ia benar-benar dilewati.',
  'help.guide.roadtrip-refuel.result':
    'Perhentian itu duduk pada ruas yang tepat dengan ikonnya sendiri, dan jarak jangkau dihitung lagi mulai dari situ: bilahnya pindah ke tempat tangki kini habis, atau hilang begitu sisa perjalanan sudah terjangkau.',
  'help.guide.roadtrip-refuel.tip.1':
    'Jarak jangkau dihitung dari perhentian bahan bakar atau pengisian daya terakhir, lintas hari. Anda mengemudi apa menentukan perhentian mana yang dihitung: “Bensin” hanya bahan bakar, “Listrik” hanya pengisian daya.',
  'help.guide.roadtrip-refuel.tip.2':
    'Pencarian melihat jalan sebelum titik kehabisan, menyisakan cadangan dan menghitung jalan memutar dua kali, jadi semua yang ditawarkannya benar-benar terjangkau.',
  'help.guide.roadtrip-refuel.tip.3':
    'Jawaban kosong bukan jalan buntu: lampunya berubah menjadi “Coba lagi”, karena pencarian tempat adalah layanan bersama yang memang bisa kehabisan waktu.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Membuat sebuah hari mengikuti jalur yang diimpor',
  'help.guide.roadtrip-track.goal':
    'Taruh perjalanan sebuah hari pada rute indah yang Anda impor sebagai jalur GPX atau KML.',
  'help.guide.roadtrip-track.step.1': 'Klik lencana “Jalur” pada kepala sebuah hari. Dialognya terbuka pada hari itu.',
  'help.guide.roadtrip-track.step.2':
    'Pilih sebuah jalur. Masing-masing menyebutkan panjangnya dan apakah ia berjalan sepanjang hari ini atau seberapa jauh letaknya, yang terdekat lebih dulu.',
  'help.guide.roadtrip-track.step.3':
    'Klik “Ikuti jalur ini”. TREK menjatuhkan titik lintas di tempat perjalanan paling menyimpang dari jalur, lalu merutekan lagi, putaran demi putaran.',
  'help.guide.roadtrip-track.step.4':
    'Dialog menyebutkan berapa titik lintas yang ditempatkan dan seberapa dekat perjalanan sekarang bertahan, atau bahwa perjalanan sudah mengikuti jalur itu. Bila ada yang ditempatkan, tombol di bawahnya membuangnya lagi dan mengembalikan hari itu kepada mesin rute; menutup dialog mempertahankan jalurnya.',
  'help.guide.roadtrip-track.result':
    'Perjalanan hari itu mengikuti jalur alih-alih jalan yang akan dipilih mesin rute, dan saat Anda menunjuk lencana “Jalur” miliknya, lencana itu menyebut nama jalurnya. Bila titik lintas menahan perjalanan di jalur itu, lencananya juga menyala.',
  'help.guide.roadtrip-track.tip.1':
    'Impor berkasnya di bawah “Hari”: di kolom tempat, “Impor file” di balik tombol impor, dengan “Rute” atau “Trek (dengan geometri jalur)” dicentang untuk GPX, atau “Jalur (LineStrings)” untuk KML. Sampai perjalanan ini memuat sebuah jalur, tidak ada hari yang membawa lencana itu.',
  'help.guide.roadtrip-track.tip.2':
    'Mengikuti jalur menggantikan titik lintas yang sudah dimiliki ruas-ruas hari itu, jadi bentuklah sebuah ruas dengan tangan setelah jalur, bukan sebelumnya.',
};

export default help;

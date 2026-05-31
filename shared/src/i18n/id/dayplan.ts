import type { TranslationStrings } from '../types';

const dayplan: TranslationStrings = {
  'dayplan.icsTooltip': 'Ekspor kalender (ICS)',
  'dayplan.emptyDay': 'Belum ada tempat yang direncanakan untuk hari ini',
  'dayplan.cannotReorderTransport':
    'Pemesanan dengan waktu tetap tidak bisa diurutkan ulang',
  'dayplan.confirmRemoveTimeTitle': 'Hapus waktu?',
  'dayplan.confirmRemoveTimeBody':
    'Tempat ini memiliki waktu tetap ({time}). Memindahkannya akan menghapus waktu dan mengizinkan pengurutan bebas.',
  'dayplan.confirmRemoveTimeAction': 'Hapus waktu & pindahkan',
  'dayplan.cannotDropOnTimed':
    'Item tidak dapat ditempatkan di antara entri yang terikat waktu',
  'dayplan.cannotBreakChronology':
    'Ini akan merusak urutan kronologis item bertanggal dan pemesanan',
  'dayplan.addNote': 'Tambah Catatan',
  'dayplan.editNote': 'Edit Catatan',
  'dayplan.noteAdd': 'Tambah Catatan',
  'dayplan.noteEdit': 'Edit Catatan',
  'dayplan.noteTitle': 'Catatan',
  'dayplan.noteSubtitle': 'Catatan Harian',
  'dayplan.totalCost': 'Total Biaya',
  'dayplan.days': 'Hari',
  'dayplan.dayN': 'Hari {n}',
  'dayplan.calculating': 'Menghitung...',
  'dayplan.route': 'Rute',
  'dayplan.optimize': 'Optimalkan',
  'dayplan.optimized': 'Rute dioptimalkan',
  'dayplan.routeError': 'Gagal menghitung rute',
  'dayplan.toast.needTwoPlaces':
    'Diperlukan minimal dua tempat untuk optimasi rute',
  'dayplan.toast.routeOptimized': 'Rute dioptimalkan',
  'dayplan.toast.noGeoPlaces':
    'Tidak ditemukan tempat dengan koordinat untuk kalkulasi rute',
  'dayplan.confirmed': 'Dikonfirmasi',
  'dayplan.pendingRes': 'Menunggu',
  'dayplan.pdf': 'PDF',
  'dayplan.pdfTooltip': 'Ekspor rencana hari sebagai PDF',
  'dayplan.pdfError': 'Gagal mengekspor PDF',
  'dayplan.mobile.addPlace': 'Tambah Tempat',
  'dayplan.mobile.searchPlaces': 'Cari tempat...',
  'dayplan.mobile.allAssigned': 'Semua tempat sudah ditugaskan',
  'dayplan.mobile.noMatch': 'Tidak ditemukan',
  'dayplan.mobile.createNew': 'Buat tempat baru',
  'dayplan.expandAll': 'Expand all days', // en-fallback
  'dayplan.collapseAll': 'Collapse all days', // en-fallback
};
export default dayplan;

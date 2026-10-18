export const KATEGORI_LIST = [
  'Jaringan',
  'Server & Infrastruktur',
  'Aplikasi',
  'Database',
  'Keamanan Siber',
  'Perangkat Keras',
];

export const STATUS_LIST = [
  'Terbuka',
  'Dalam Penanganan',
  'Menunggu Pihak Ketiga',
  'Selesai',
  'Ditutup',
];

export const PRIORITAS_LIST = ['Rendah', 'Sedang', 'Tinggi', 'Kritis'];

export const KATEGORI_OPTIONS = KATEGORI_LIST.map((item) => ({
  label: item,
  value: item,
}));

export const STATUS_OPTIONS = STATUS_LIST.map((item) => ({
  label: item,
  value: item,
}));

export const PRIORITAS_OPTIONS = PRIORITAS_LIST.map((item) => ({
  label: item,
  value: item,
}));

export const FILTER_KATEGORI_OPTIONS = [
  { label: 'Semua Kategori', value: 'SEMUA' },
  ...KATEGORI_OPTIONS,
];

export const FILTER_STATUS_OPTIONS = [
  { label: 'Semua Status', value: 'SEMUA' },
  ...STATUS_OPTIONS,
];

export const FILTER_PRIORITAS_OPTIONS = [
  { label: 'Semua Prioritas', value: 'SEMUA' },
  ...PRIORITAS_OPTIONS,
];

export const SORT_OPTIONS = [
  { label: 'Tanggal Kejadian (Terbaru)', value: 'tanggal_kejadian:desc' },
  { label: 'Tanggal Kejadian (Terlama)', value: 'tanggal_kejadian:asc' },
  { label: 'Kode Gangguan (A-Z)', value: 'kode_gangguan:asc' },
  { label: 'Kode Gangguan (Z-A)', value: 'kode_gangguan:desc' },
  { label: 'Downtime Terlama', value: 'durasi_downtime:desc' },
  { label: 'Dampak Pengguna Terbanyak', value: 'jumlah_pengguna_terdampak:desc' },
];

/**
 * Pemetaan status gangguan ke variant komponen Badge @idds/react
 * Variant yang didukung @idds/react Badge: 'brand' | 'info' | 'warning' | 'success' | 'error' | 'neutral'
 */
export function getStatusBadgeVariant(status) {
  switch (status) {
    case 'Terbuka':
      return 'error';
    case 'Dalam Penanganan':
      return 'warning';
    case 'Menunggu Pihak Ketiga':
      return 'info';
    case 'Selesai':
      return 'success';
    case 'Ditutup':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getPriorityBadgeVariant(prioritas) {
  switch (prioritas) {
    case 'Kritis':
      return 'error';
    case 'Tinggi':
      return 'warning';
    case 'Sedang':
      return 'info';
    case 'Rendah':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function getCategoryBadgeVariant(kategori) {
  switch (kategori) {
    case 'Keamanan Siber':
      return 'brand';
    case 'Database':
      return 'info';
    case 'Jaringan':
      return 'warning';
    case 'Server & Infrastruktur':
      return 'info';
    case 'Aplikasi':
      return 'success';
    case 'Perangkat Keras':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts.map(Number);
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    return `${day} ${months[month - 1] || ''} ${year}`;
  } catch {
    return dateStr;
  }
}

export function formatCurrencyIDR(amount) {
  const num = Number(amount ?? 0);
  if (Number.isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDurationMinutes(minutes) {
  const m = Number(minutes ?? 0);
  if (Number.isNaN(m) || m <= 0) return '0 menit (Tanpa Downtime)';
  if (m < 60) return `${m} menit`;
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${hours} jam ${rem} menit (${m} mnt)` : `${hours} jam (${m} mnt)`;
}


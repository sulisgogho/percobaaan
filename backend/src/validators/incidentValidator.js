const ALLOWED_CATEGORIES = [
  'Jaringan',
  'Server & Infrastruktur',
  'Aplikasi',
  'Database',
  'Keamanan Siber',
  'Perangkat Keras',
];

const ALLOWED_STATUSES = [
  'Terbuka',
  'Dalam Penanganan',
  'Menunggu Pihak Ketiga',
  'Selesai',
  'Ditutup',
];

const ALLOWED_PRIORITIES = ['Rendah', 'Sedang', 'Tinggi', 'Kritis'];

/**
 * Validasi dan normalisasi tanggal ke format YYYY-MM-DD.
 * Menerima YYYY-MM-DD atau DD/MM/YYYY, dan menolak tanggal tidak valid seperti 2026-02-30.
 */
function parseAndValidateDate(rawDate) {
  if (rawDate === undefined || rawDate === null || String(rawDate).trim() === '') {
    return { valid: false, reason: 'required' };
  }

  const str = String(rawDate).trim();
  let year, month, day;

  // Format YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  // Format DD/MM/YYYY (default IDDS DatePicker)
  const dmyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);

  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else if (dmyMatch) {
    day = Number(dmyMatch[1]);
    month = Number(dmyMatch[2]);
    year = Number(dmyMatch[3]);
  } else {
    return { valid: false, reason: 'invalid_format' };
  }

  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, reason: 'out_of_range' };
  }

  const constructed = new Date(Date.UTC(year, month - 1, day));
  if (
    constructed.getUTCFullYear() !== year ||
    constructed.getUTCMonth() + 1 !== month ||
    constructed.getUTCDate() !== day
  ) {
    return { valid: false, reason: 'impossible_calendar_date' };
  }

  const normalized = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')}`;

  return { valid: true, normalized };
}

/**
 * Validasi angka >= 0 (nol atau lebih)
 */
function validateNonNegativeNumber(rawVal, { integerOnly = false } = {}) {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return { valid: false, reason: 'required' };
  }

  const str = String(rawVal).trim();
  const num = Number(str);

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { valid: false, reason: 'not_a_number' };
  }

  if (num < 0) {
    return { valid: false, reason: 'negative' };
  }

  if (integerOnly && !Number.isInteger(num)) {
    return { valid: false, reason: 'not_integer' };
  }

  return { valid: true, value: num };
}

async function validateIncidentPayload(payload, db, currentId = null) {
  const errors = {};
  const cleaned = {};

  // 1. Kode Gangguan (Wajib & Unik)
  const kode = payload.kode_gangguan !== undefined && payload.kode_gangguan !== null
    ? String(payload.kode_gangguan).trim().toUpperCase()
    : '';

  if (!kode) {
    errors.kode_gangguan = 'Kode gangguan wajib diisi (contoh: INC-2026-021).';
  } else if (kode.length < 3 || kode.length > 40) {
    errors.kode_gangguan = 'Kode gangguan harus terdiri dari 3 hingga 40 karakter.';
  } else if (!/^[A-Z0-9-_]+$/.test(kode)) {
    errors.kode_gangguan =
      'Kode gangguan hanya boleh mengandung huruf kapital, angka, tanda hubung (-), atau garis bawah (_).';
  } else {
    // Periksa keunikan di database
    const existingRes = currentId
      ? await db.query(
          'SELECT id FROM gangguan_ti WHERE UPPER(kode_gangguan) = $1 AND id != $2 LIMIT 1',
          [kode, currentId]
        )
      : await db.query('SELECT id FROM gangguan_ti WHERE UPPER(kode_gangguan) = $1 LIMIT 1', [
          kode,
        ]);

    if (existingRes.rows.length > 0) {
      errors.kode_gangguan = `Kode gangguan "${kode}" sudah terdaftar. Gunakan kode unik lainnya.`;
    } else {
      cleaned.kode_gangguan = kode;
    }
  }

  // 2. Judul Gangguan (Wajib)
  const judul = payload.judul !== undefined && payload.judul !== null
    ? String(payload.judul).trim()
    : '';
  if (!judul) {
    errors.judul = 'Judul gangguan wajib diisi.';
  } else if (judul.length < 5) {
    errors.judul = 'Judul gangguan minimal terdiri dari 5 karakter.';
  } else if (judul.length > 200) {
    errors.judul = 'Judul gangguan maksimal 200 karakter.';
  } else {
    cleaned.judul = judul;
  }

  // 3. Deskripsi Gangguan (Wajib)
  const deskripsi = payload.deskripsi !== undefined && payload.deskripsi !== null
    ? String(payload.deskripsi).trim()
    : '';
  if (!deskripsi) {
    errors.deskripsi = 'Deskripsi gangguan wajib diisi.';
  } else if (deskripsi.length < 10) {
    errors.deskripsi = 'Deskripsi gangguan minimal terdiri dari 10 karakter agar informatif.';
  } else {
    cleaned.deskripsi = deskripsi;
  }

  // 4. Kategori (Wajib & Sesuai Pilihan)
  const kategori = payload.kategori !== undefined && payload.kategori !== null
    ? String(payload.kategori).trim()
    : '';
  if (!kategori) {
    errors.kategori = 'Kategori gangguan wajib dipilih.';
  } else if (!ALLOWED_CATEGORIES.includes(kategori)) {
    errors.kategori = `Kategori "${kategori}" tidak sesuai pilihan. Pilih salah satu dari: ${ALLOWED_CATEGORIES.join(
      ', '
    )}.`;
  } else {
    cleaned.kategori = kategori;
  }

  // 5. Status (Wajib & Sesuai Pilihan)
  const status = payload.status !== undefined && payload.status !== null
    ? String(payload.status).trim()
    : '';
  if (!status) {
    errors.status = 'Status penanganan wajib dipilih.';
  } else if (!ALLOWED_STATUSES.includes(status)) {
    errors.status = `Status "${status}" tidak sesuai pilihan. Pilih salah satu dari: ${ALLOWED_STATUSES.join(
      ', '
    )}.`;
  } else {
    cleaned.status = status;
  }

  // 6. Prioritas (Wajib & Sesuai Pilihan)
  const prioritas = payload.prioritas !== undefined && payload.prioritas !== null && String(payload.prioritas).trim() !== ''
    ? String(payload.prioritas).trim()
    : '';
  if (!prioritas) {
    errors.prioritas = 'Tingkat prioritas wajib dipilih.';
  } else if (!ALLOWED_PRIORITIES.includes(prioritas)) {
    errors.prioritas = `Prioritas "${prioritas}" tidak sesuai pilihan. Pilih salah satu dari: ${ALLOWED_PRIORITIES.join(
      ', '
    )}.`;
  } else {
    cleaned.prioritas = prioritas;
  }

  // 7. Tanggal Kejadian (Wajib & Tanggal Valid)
  const dateCheck = parseAndValidateDate(payload.tanggal_kejadian);
  if (!dateCheck.valid) {
    if (dateCheck.reason === 'required') {
      errors.tanggal_kejadian = 'Tanggal kejadian wajib diisi.';
    } else {
      errors.tanggal_kejadian =
        'Tanggal kejadian tidak valid. Gunakan tanggal kalender yang benar (YYYY-MM-DD atau DD/MM/YYYY).';
    }
  } else {
    cleaned.tanggal_kejadian = dateCheck.normalized;
  }

  // 8. Durasi Downtime dalam Menit (Wajib & Nilai Angka >= 0)
  const downtimeCheck = validateNonNegativeNumber(payload.durasi_downtime, { integerOnly: true });
  if (!downtimeCheck.valid) {
    if (downtimeCheck.reason === 'required') {
      errors.durasi_downtime = 'Durasi downtime wajib diisi (masukkan 0 jika tidak ada downtime).';
    } else if (downtimeCheck.reason === 'negative') {
      errors.durasi_downtime = 'Durasi downtime tidak boleh bernilai negatif (minimal 0 menit).';
    } else {
      errors.durasi_downtime = 'Durasi downtime harus berupa bilangan bulat 0 atau lebih (dalam menit).';
    }
  } else {
    cleaned.durasi_downtime = downtimeCheck.value;
  }

  // 9. Jumlah Pengguna Terdampak (Wajib & Nilai Angka >= 0)
  const usersCheck = validateNonNegativeNumber(payload.jumlah_pengguna_terdampak, {
    integerOnly: true,
  });
  if (!usersCheck.valid) {
    if (usersCheck.reason === 'required') {
      errors.jumlah_pengguna_terdampak =
        'Jumlah pengguna terdampak wajib diisi (masukkan 0 jika tidak ada).';
    } else if (usersCheck.reason === 'negative') {
      errors.jumlah_pengguna_terdampak =
        'Jumlah pengguna terdampak tidak boleh bernilai negatif (minimal 0).';
    } else {
      errors.jumlah_pengguna_terdampak =
        'Jumlah pengguna terdampak harus berupa bilangan bulat 0 atau lebih.';
    }
  } else {
    cleaned.jumlah_pengguna_terdampak = usersCheck.value;
  }

  // 10. Biaya Pemulihan / Dampak Rp (Wajib & Nilai Angka >= 0)
  const costInput =
    payload.biaya_pemulihan === undefined || payload.biaya_pemulihan === null || payload.biaya_pemulihan === ''
      ? 0
      : payload.biaya_pemulihan;
  const costCheck = validateNonNegativeNumber(costInput, { integerOnly: false });
  if (!costCheck.valid) {
    if (costCheck.reason === 'negative') {
      errors.biaya_pemulihan = 'Estimasi biaya pemulihan tidak boleh bernilai negatif (minimal Rp 0).';
    } else {
      errors.biaya_pemulihan = 'Estimasi biaya pemulihan harus berupa angka 0 atau lebih.';
    }
  } else {
    cleaned.biaya_pemulihan = costCheck.value;
  }

  // 11. Sistem / Layanan Terdampak (Wajib)
  const sistem = payload.sistem_terdampak !== undefined && payload.sistem_terdampak !== null
    ? String(payload.sistem_terdampak).trim()
    : '';
  if (!sistem) {
    errors.sistem_terdampak = 'Nama sistem atau layanan terdampak wajib diisi.';
  } else if (sistem.length > 150) {
    errors.sistem_terdampak = 'Nama sistem terdampak maksimal 150 karakter.';
  } else {
    cleaned.sistem_terdampak = sistem;
  }

  // 12. Pelapor (Wajib)
  const pelapor = payload.pelapor !== undefined && payload.pelapor !== null
    ? String(payload.pelapor).trim()
    : '';
  if (!pelapor) {
    errors.pelapor = 'Nama pelapor / unit pelapor wajib diisi.';
  } else if (pelapor.length > 120) {
    errors.pelapor = 'Nama pelapor maksimal 120 karakter.';
  } else {
    cleaned.pelapor = pelapor;
  }

  // 13. Penanggung Jawab (Wajib / Default)
  const pj = payload.penanggung_jawab !== undefined && payload.penanggung_jawab !== null
    ? String(payload.penanggung_jawab).trim()
    : '';
  if (!pj) {
    errors.penanggung_jawab = 'Tim / penanggung jawab penanganan wajib diisi.';
  } else if (pj.length > 120) {
    errors.penanggung_jawab = 'Penanggung jawab maksimal 120 karakter.';
  } else {
    cleaned.penanggung_jawab = pj;
  }

  // 14. Akar Masalah & Tindakan Perbaikan (Opsional)
  cleaned.akar_masalah =
    payload.akar_masalah !== undefined && payload.akar_masalah !== null
      ? String(payload.akar_masalah).trim()
      : '';
  cleaned.tindakan_perbaikan =
    payload.tindakan_perbaikan !== undefined && payload.tindakan_perbaikan !== null
      ? String(payload.tindakan_perbaikan).trim()
      : '';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cleaned,
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_STATUSES,
  ALLOWED_PRIORITIES,
  parseAndValidateDate,
  validateNonNegativeNumber,
  validateIncidentPayload,
};


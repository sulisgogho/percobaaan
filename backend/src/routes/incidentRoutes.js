const express = require('express');
const { getDb, normalizeIncidentRow, reseedSampleData } = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const {
  ALLOWED_CATEGORIES,
  ALLOWED_STATUSES,
  ALLOWED_PRIORITIES,
  validateIncidentPayload,
} = require('../validators/incidentValidator');

const router = express.Router();

// Semua endpoint gangguan TI dilindungi autentikasi JWT
router.use(authenticateToken);

// GET /api/incidents/meta — Daftar opsi valid & kode otomatis berikutnya
router.get('/meta', async (req, res) => {
  try {
    const db = getDb();
    const resCodes = await db.query(
      "SELECT kode_gangguan FROM gangguan_ti WHERE kode_gangguan LIKE 'INC-2026-%' ORDER BY kode_gangguan DESC LIMIT 50"
    );

    let maxNum = 20;
    for (const row of resCodes.rows) {
      const match = /^INC-2026-(\d+)$/i.exec(row.kode_gangguan);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const suggestedCode = `INC-2026-${String(maxNum + 1).padStart(3, '0')}`;

    return res.json({
      success: true,
      data: {
        categories: ALLOWED_CATEGORIES,
        statuses: ALLOWED_STATUSES,
        priorities: ALLOWED_PRIORITIES,
        suggestedCode,
      },
    });
  } catch (err) {
    console.error('[GET META ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat metadata pilihan formulir.',
    });
  }
});

// POST /api/incidents/seed — Pulihkan 20 data contoh jika diperlukan
router.post('/seed', async (req, res) => {
  try {
    const total = await reseedSampleData();
    return res.json({
      success: true,
      message: `20 data contoh berhasil dipastikan tersedia di database (total catatan saat ini: ${total}).`,
      data: { total },
    });
  } catch (err) {
    console.error('[SEED ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat ulang data contoh.',
    });
  }
});

// GET /api/incidents — Daftar gangguan TI beserta filter, pencarian, pengurutan, dan ringkasan
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const {
      search = '',
      kategori = '',
      status = '',
      prioritas = '',
      sortBy = 'tanggal_kejadian',
      sortOrder = 'desc',
      page = '1',
      limit = '25',
    } = req.query;

    const conditions = [];
    const params = [];

    if (search && String(search).trim() !== '') {
      params.push(`%${String(search).trim()}%`);
      const idx = params.length;
      conditions.push(
        `(kode_gangguan ILIKE $${idx} OR judul ILIKE $${idx} OR deskripsi ILIKE $${idx} OR sistem_terdampak ILIKE $${idx} OR pelapor ILIKE $${idx})`
      );
    }

    if (kategori && String(kategori).trim() !== '' && kategori !== 'SEMUA') {
      params.push(String(kategori).trim());
      conditions.push(`kategori = $${params.length}`);
    }

    if (status && String(status).trim() !== '' && status !== 'SEMUA') {
      params.push(String(status).trim());
      conditions.push(`status = $${params.length}`);
    }

    if (prioritas && String(prioritas).trim() !== '' && prioritas !== 'SEMUA') {
      params.push(String(prioritas).trim());
      conditions.push(`prioritas = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortColumns = {
      kode_gangguan: 'kode_gangguan',
      judul: 'judul',
      kategori: 'kategori',
      status: 'status',
      prioritas: 'prioritas',
      tanggal_kejadian: 'tanggal_kejadian',
      durasi_downtime: 'durasi_downtime',
      jumlah_pengguna_terdampak: 'jumlah_pengguna_terdampak',
      biaya_pemulihan: 'biaya_pemulihan',
      created_at: 'created_at',
      id: 'id',
    };

    const sortCol = allowedSortColumns[sortBy] || 'tanggal_kejadian';
    const orderDir = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `SELECT COUNT(*)::int AS total FROM gangguan_ti ${whereClause}`;
    const countRes = await db.query(countQuery, params);
    const totalFiltered = countRes.rows[0]?.total ?? 0;

    const dataQuery = `
      SELECT *
      FROM gangguan_ti
      ${whereClause}
      ORDER BY ${sortCol} ${orderDir}, id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataRes = await db.query(dataQuery, [...params, limitNum, offset]);

    // Hitung ringkasan keseluruhan data di database
    const summaryRes = await db.query(`
      SELECT
        COUNT(*)::int AS total_semua,
        COUNT(*) FILTER (WHERE status IN ('Terbuka', 'Dalam Penanganan', 'Menunggu Pihak Ketiga'))::int AS total_aktif,
        COUNT(*) FILTER (WHERE status IN ('Selesai', 'Ditutup'))::int AS total_selesai,
        COUNT(*) FILTER (WHERE prioritas = 'Kritis')::int AS total_kritis,
        COALESCE(SUM(durasi_downtime), 0)::int AS total_downtime,
        COALESCE(SUM(jumlah_pengguna_terdampak), 0)::int AS total_pengguna_terdampak
      FROM gangguan_ti
    `);

    const items = dataRes.rows.map(normalizeIncidentRow);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages: Math.max(1, Math.ceil(totalFiltered / limitNum)),
      },
      summary: summaryRes.rows[0] || {
        total_semua: 0,
        total_aktif: 0,
        total_selesai: 0,
        total_kritis: 0,
        total_downtime: 0,
        total_pengguna_terdampak: 0,
      },
    });
  } catch (err) {
    console.error('[GET INCIDENTS ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar catatan gangguan TI.',
    });
  }
});

// GET /api/incidents/:id — Detail satu catatan gangguan TI
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID catatan gangguan tidak valid.',
      });
    }

    const result = await db.query('SELECT * FROM gangguan_ti WHERE id = $1 LIMIT 1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Catatan gangguan TI dengan ID #${id} tidak ditemukan.`,
      });
    }

    return res.json({
      success: true,
      data: normalizeIncidentRow(result.rows[0]),
    });
  } catch (err) {
    console.error('[GET INCIDENT DETAIL ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil detail catatan gangguan TI.',
    });
  }
});

// POST /api/incidents — Tambah catatan gangguan TI baru
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const validation = await validateIncidentPayload(req.body || {}, db, null);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal. Mohon periksa kembali isian formulir yang ditandai merah.',
        errors: validation.errors,
      });
    }

    const c = validation.cleaned;

    const insertRes = await db.query(
      `INSERT INTO gangguan_ti (
        kode_gangguan,
        judul,
        deskripsi,
        kategori,
        status,
        prioritas,
        tanggal_kejadian,
        durasi_downtime,
        jumlah_pengguna_terdampak,
        biaya_pemulihan,
        sistem_terdampak,
        pelapor,
        penanggung_jawab,
        akar_masalah,
        tindakan_perbaikan,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        c.kode_gangguan,
        c.judul,
        c.deskripsi,
        c.kategori,
        c.status,
        c.prioritas,
        c.tanggal_kejadian,
        c.durasi_downtime,
        c.jumlah_pengguna_terdampak,
        c.biaya_pemulihan,
        c.sistem_terdampak,
        c.pelapor,
        c.penanggung_jawab,
        c.akar_masalah,
        c.tindakan_perbaikan,
      ]
    );

    const created = normalizeIncidentRow(insertRes.rows[0]);

    return res.status(201).json({
      success: true,
      message: `Catatan gangguan "${created.kode_gangguan} - ${created.judul}" berhasil ditambahkan.`,
      data: created,
    });
  } catch (err) {
    console.error('[CREATE INCIDENT ERROR]', err);
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Kode gangguan sudah terdaftar di database.',
        errors: {
          kode_gangguan: 'Kode gangguan sudah digunakan. Gunakan kode unik lainnya.',
        },
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menyimpan catatan gangguan baru.',
    });
  }
});

// PUT /api/incidents/:id — Ubah catatan gangguan TI berdasarkan ID
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID catatan gangguan tidak valid.',
      });
    }

    // Pastikan data yang akan diubah memang ada
    const existingRes = await db.query('SELECT * FROM gangguan_ti WHERE id = $1 LIMIT 1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Catatan gangguan TI dengan ID #${id} tidak ditemukan.`,
      });
    }

    const validation = await validateIncidentPayload(req.body || {}, db, id);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validasi perubahan gagal. Mohon periksa kembali isian formulir yang ditandai.',
        errors: validation.errors,
      });
    }

    const c = validation.cleaned;

    const updateRes = await db.query(
      `UPDATE gangguan_ti
       SET
         kode_gangguan = $1,
         judul = $2,
         deskripsi = $3,
         kategori = $4,
         status = $5,
         prioritas = $6,
         tanggal_kejadian = $7,
         durasi_downtime = $8,
         jumlah_pengguna_terdampak = $9,
         biaya_pemulihan = $10,
         sistem_terdampak = $11,
         pelapor = $12,
         penanggung_jawab = $13,
         akar_masalah = $14,
         tindakan_perbaikan = $15,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        c.kode_gangguan,
        c.judul,
        c.deskripsi,
        c.kategori,
        c.status,
        c.prioritas,
        c.tanggal_kejadian,
        c.durasi_downtime,
        c.jumlah_pengguna_terdampak,
        c.biaya_pemulihan,
        c.sistem_terdampak,
        c.pelapor,
        c.penanggung_jawab,
        c.akar_masalah,
        c.tindakan_perbaikan,
        id,
      ]
    );

    const updated = normalizeIncidentRow(updateRes.rows[0]);

    return res.json({
      success: true,
      message: `Catatan gangguan "${updated.kode_gangguan}" berhasil diperbarui.`,
      data: updated,
    });
  } catch (err) {
    console.error('[UPDATE INCIDENT ERROR]', err);
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Kode gangguan sudah digunakan oleh data lain.',
        errors: {
          kode_gangguan: 'Kode gangguan sudah digunakan. Gunakan kode unik lainnya.',
        },
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memperbarui catatan gangguan.',
    });
  }
});

// DELETE /api/incidents/:id — Hapus satu catatan gangguan TI berdasarkan ID
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID catatan gangguan tidak valid.',
      });
    }

    const deleteRes = await db.query(
      'DELETE FROM gangguan_ti WHERE id = $1 RETURNING *',
      [id]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Catatan gangguan TI dengan ID #${id} tidak ditemukan atau sudah dihapus.`,
      });
    }

    const deleted = normalizeIncidentRow(deleteRes.rows[0]);

    return res.json({
      success: true,
      message: `Catatan gangguan "${deleted.kode_gangguan} - ${deleted.judul}" berhasil dihapus permanen.`,
      data: deleted,
    });
  } catch (err) {
    console.error('[DELETE INCIDENT ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menghapus catatan gangguan.',
    });
  }
});

module.exports = router;


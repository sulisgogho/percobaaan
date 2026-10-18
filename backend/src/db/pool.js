const fs = require('fs');
const path = require('path');
const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');

// Pastikan kolom DATE (OID 1082) dikembalikan sebagai string YYYY-MM-DD tanpa pergeseran zona waktu
types.setTypeParser(1082, (val) => val);
// Pastikan NUMERIC (OID 1700) dikembalikan sebagai float/number
types.setTypeParser(1700, (val) => (val === null ? 0 : parseFloat(val)));

let dbClient = null;
let dbMode = 'postgres'; // 'postgres' | 'pglite-persistent'

const pgConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'gangguan_ti_db',
      connectionTimeoutMillis: 3000,
    };

async function initDatabase() {
  if (dbClient) return dbClient;

  // 1. Coba koneksi ke server PostgreSQL utama (Docker / lokal)
  const pool = new Pool(pgConfig);
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    dbMode = 'postgres';
    dbClient = {
      query: (text, params) => pool.query(text, params),
      exec: (sql) => pool.query(sql),
      mode: 'PostgreSQL Server (pg)',
    };
    console.log('[DB] Terhubung ke server PostgreSQL utama.');
  } catch (err) {
    await pool.end().catch(() => {});
    console.log(
      `[DB] Server PostgreSQL eksternal tidak terjangkau (${err.message}). Menggunakan mesin PostgreSQL lokal persisten (PGlite) pada direktori data...`
    );
    const { PGlite } = await import('@electric-sql/pglite');
    const dataDir = process.env.PGLITE_DATA_DIR || path.join(__dirname, '../../pgdata');
    fs.mkdirSync(dataDir, { recursive: true });
    const pglite = new PGlite(dataDir, {
      parsers: {
        // Pastikan DATE dikembalikan sebagai string YYYY-MM-DD
        1082: (val) => val,
        1700: (val) => (val === null ? 0 : parseFloat(val)),
      },
    });
    await pglite.waitReady;
    dbMode = 'pglite-persistent';
    dbClient = {
      query: (text, params) => pglite.query(text, params),
      exec: (sql) => pglite.exec(sql),
      mode: 'PostgreSQL Persisten (PGlite On-Disk)',
    };
    console.log(`[DB] Mesin PostgreSQL persisten aktif di: ${dataDir}`);
  }

  await ensureSchemaAndSeed();
  return dbClient;
}

async function ensureSchemaAndSeed() {
  // Buat tabel metadata aplikasi untuk melacak status seed awal
  await dbClient.exec(`
    CREATE TABLE IF NOT EXISTS _app_metadata (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Baca file init.sql
  const initSqlPath = path.join(__dirname, '../../db/init.sql');
  const fullSql = fs.readFileSync(initSqlPath, 'utf8');

  // Pisahkan bagian DDL (CREATE TABLE) dan bagian INSERT seed
  const [schemaPart] = fullSql.split('-- 20 Data Contoh Gangguan TI');
  await dbClient.exec(schemaPart);

  // Pastikan akun pengguna default tersedia
  const userCountRes = await dbClient.query('SELECT COUNT(*)::int AS count FROM users');
  const userCount = userCountRes.rows[0]?.count ?? 0;

  if (userCount === 0) {
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const teknisiHash = await bcrypt.hash('Teknisi123!', 10);

    await dbClient.query(
      `INSERT INTO users (username, email, password_hash, nama_lengkap, unit_kerja, peran)
       VALUES
         ($1, $2, $3, $4, $5, $6),
         ($7, $8, $9, $10, $11, $12)
       ON CONFLICT (username) DO NOTHING`,
      [
        'admin',
        'admin@inadigital.go.id',
        adminHash,
        'Budi Raharjo, S.Kom.',
        'Direktorat Operasional Infrastruktur TI',
        'Admin Utama TI',
        'teknisi',
        'teknisi@inadigital.go.id',
        teknisiHash,
        'Rina Kartika, M.T.',
        'Pusat Kendali Jaringan & Insiden (NOC)',
        'Teknisi Respon Insiden',
      ]
    );
    console.log('[DB] Akun default berhasil disiapkan (admin / teknisi).');
  }

  // Periksa apakah seed 20 data contoh sudah pernah dijalankan
  const seedFlagRes = await dbClient.query(
    "SELECT value FROM _app_metadata WHERE key = 'initial_seed_completed'"
  );
  const incidentCountRes = await dbClient.query(
    'SELECT COUNT(*)::int AS count FROM gangguan_ti'
  );
  const incidentCount = incidentCountRes.rows[0]?.count ?? 0;

  if (seedFlagRes.rows.length === 0) {
    if (incidentCount === 0) {
      await dbClient.exec(fullSql);
      console.log('[DB] 20 data contoh gangguan TI berhasil dimasukkan ke database.');
    }
    await dbClient.query(
      `INSERT INTO _app_metadata (key, value)
       VALUES ('initial_seed_completed', 'true')
       ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = CURRENT_TIMESTAMP`
    );
  }
}

async function reseedSampleData() {
  const initSqlPath = path.join(__dirname, '../../db/init.sql');
  const fullSql = fs.readFileSync(initSqlPath, 'utf8');
  await dbClient.exec(fullSql);
  const countRes = await dbClient.query('SELECT COUNT(*)::int AS count FROM gangguan_ti');
  return countRes.rows[0]?.count ?? 0;
}

function normalizeIncidentRow(row) {
  if (!row) return null;
  let tanggal = row.tanggal_kejadian;
  if (tanggal instanceof Date) {
    const year = tanggal.getFullYear();
    const month = String(tanggal.getMonth() + 1).padStart(2, '0');
    const day = String(tanggal.getDate()).padStart(2, '0');
    tanggal = `${year}-${month}-${day}`;
  } else if (typeof tanggal === 'string' && tanggal.includes('T')) {
    tanggal = tanggal.split('T')[0];
  }
  return {
    ...row,
    id: Number(row.id),
    tanggal_kejadian: tanggal,
    durasi_downtime: Number(row.durasi_downtime ?? 0),
    jumlah_pengguna_terdampak: Number(row.jumlah_pengguna_terdampak ?? 0),
    biaya_pemulihan: Number(row.biaya_pemulihan ?? 0),
    akar_masalah: row.akar_masalah || '',
    tindakan_perbaikan: row.tindakan_perbaikan || '',
  };
}

module.exports = {
  initDatabase,
  getDb: () => dbClient,
  reseedSampleData,
  normalizeIncidentRow,
};


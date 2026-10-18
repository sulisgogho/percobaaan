require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getDb } = require('./db/pool');
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Endpoint Pemeriksaan Kesehatan Layanan (Healthcheck)
app.get('/api/health', async (req, res) => {
  try {
    const db = getDb();
    const countRes = await db.query('SELECT COUNT(*)::int AS total FROM gangguan_ti');
    return res.json({
      success: true,
      status: 'healthy',
      databaseMode: db.mode,
      totalIncidents: countRes.rows[0]?.total ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: err.message,
    });
  }
});

// Rute API Utama
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);

// Penanganan Rute Tidak Ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
});

// Penanganan Kesalahan Global
app.use((err, req, res, _next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
  });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Backend Catatan Gangguan TI berjalan di http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[SERVER FATAL] Gagal menjalankan server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };


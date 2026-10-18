const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/pool');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const db = getDb();
    const { username, password } = req.body || {};
    const errors = {};

    const identifier = username ? String(username).trim() : '';
    const rawPassword = password ? String(password) : '';

    if (!identifier) {
      errors.username = 'Nama pengguna (username) atau email wajib diisi.';
    }
    if (!rawPassword) {
      errors.password = 'Kata sandi (password) wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi nama pengguna dan kata sandi Anda.',
        errors,
      });
    }

    const userRes = await db.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1',
      [identifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Nama pengguna atau kata sandi yang Anda masukkan salah.',
        errors: {
          username: 'Akun tidak ditemukan atau kata sandi salah.',
        },
      });
    }

    const user = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(rawPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Nama pengguna atau kata sandi yang Anda masukkan salah.',
        errors: {
          password: 'Kata sandi tidak sesuai.',
        },
      });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      nama_lengkap: user.nama_lengkap,
      unit_kerja: user.unit_kerja,
      peran: user.peran,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: `Selamat datang kembali, ${user.nama_lengkap}!`,
      data: {
        token,
        user: tokenPayload,
      },
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memproses autentikasi.',
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const db = getDb();
    const { username, email, password, nama_lengkap, unit_kerja, peran } = req.body || {};
    const errors = {};

    const cleanUsername = username ? String(username).trim().toLowerCase() : '';
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanNama = nama_lengkap ? String(nama_lengkap).trim() : '';
    const cleanUnit = unit_kerja ? String(unit_kerja).trim() : 'Pusat Data & Operasional TI';
    const cleanPeran = peran ? String(peran).trim() : 'Teknisi TI';
    const rawPassword = password ? String(password) : '';

    if (!cleanNama || cleanNama.length < 3) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi (minimal 3 karakter).';
    }
    if (!cleanUsername || !/^[a-z0-9_.-]{3,30}$/.test(cleanUsername)) {
      errors.username = 'Username wajib diisi (3-30 karakter, huruf kecil/angka/titik/garis bawah).';
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Alamat email wajib diisi dengan format yang valid.';
    }
    if (!rawPassword || rawPassword.length < 6) {
      errors.password = 'Kata sandi wajib diisi (minimal 6 karakter).';
    }

    if (cleanUsername && !errors.username) {
      const checkUser = await db.query('SELECT id FROM users WHERE LOWER(username) = $1 LIMIT 1', [
        cleanUsername,
      ]);
      if (checkUser.rows.length > 0) {
        errors.username = 'Username sudah digunakan oleh pengguna lain.';
      }
    }

    if (cleanEmail && !errors.email) {
      const checkEmail = await db.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [
        cleanEmail,
      ]);
      if (checkEmail.rows.length > 0) {
        errors.email = 'Alamat email sudah terdaftar.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validasi pendaftaran akun gagal. Periksa kembali formulir Anda.',
        errors,
      });
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const insertRes = await db.query(
      `INSERT INTO users (username, email, password_hash, nama_lengkap, unit_kerja, peran)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, nama_lengkap, unit_kerja, peran`,
      [cleanUsername, cleanEmail, passwordHash, cleanNama, cleanUnit, cleanPeran]
    );

    const newUser = insertRes.rows[0];
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '24h' });

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran akun berhasil dan Anda telah masuk secara otomatis.',
      data: {
        token,
        user: newUser,
      },
    });
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mendaftarkan akun.',
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const userRes = await db.query(
      'SELECT id, username, email, nama_lengkap, unit_kerja, peran, created_at FROM users WHERE id = $1 LIMIT 1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    return res.json({
      success: true,
      data: userRes.rows[0],
    });
  } catch (err) {
    console.error('[AUTH ME ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat profil pengguna.',
    });
  }
});

module.exports = router;


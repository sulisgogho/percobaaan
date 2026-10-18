const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'idds-gangguan-ti-secret-key-2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Silakan masuk (login) terlebih dahulu untuk mengakses layanan ini.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Sesi Anda telah berakhir atau token tidak valid. Silakan masuk kembali.',
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
};


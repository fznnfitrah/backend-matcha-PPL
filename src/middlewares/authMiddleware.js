const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Cek apakah header Authorization ada dan berformat Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Tidak ada token, akses ditolak. Silakan login terlebih dahulu.', 401);
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Simpan data payload user ke objek req agar bisa dipakai di controller berikutnya
    req.user = decoded;
    next();
  } catch (error) {
    throw new AppError('Token tidak valid atau sudah kedaluwarsa', 401);
  }
});

// Middleware untuk membatasi hak akses berdasarkan Role (Contoh: ADMIN)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Anda tidak memiliki izin untuk melakukan aksi ini', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');

// GET: Mendapatkan semua user (Biasanya untuk Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      // Password disembunyikan demi keamanan
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Berhasil mengambil daftar pengguna',
    data: users,
  });
});

// GET: Mendapatkan detail user berdasarkan ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('Pengguna tidak ditemukan', 404);
  }

  return res.status(200).json({
    success: true,
    message: 'Berhasil mengambil detail pengguna',
    data: user,
  });
});

// POST: Registrasi User Baru
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Cek apakah email sudah terdaftar
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email sudah terdaftar digunakan oleh akun lain', 409);
  }

  // Enskripsi password (atau jika mengikuti backlog, bisa disesuaikan)
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'CUSTOMER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Registrasi pengguna berhasil',
    data: newUser,
  });
});

// DELETE: Menghapus user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan', 404);
  }

  await prisma.user.delete({ where: { id } });

  return res.status(200).json({
    success: true,
    message: 'Pengguna berhasil dihapus',
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  // Verifikasi password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Email atau password salah', 401);
  }

  // Buat JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  registerUser,
  loginUser,
  deleteUser,
};
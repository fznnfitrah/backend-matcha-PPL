const { z } = require('zod');

// Skema untuk Registrasi User
const registerSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal harus 6 karakter' }),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(), // Opsional, default di DB bisa CUSTOMER
});

// Skema untuk Login User
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password wajib diisi' }),
});

// Skema untuk Update User
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'Minimal satu field harus diisi untuk pembaruan data',
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
};
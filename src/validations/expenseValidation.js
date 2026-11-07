const { z } = require('zod');

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Keterangan pengeluaran wajib diisi'),
  
  // [BUG 1 FIX] Batasi nilai maksimum agar sesuai dengan kapasitas Decimal(10,2)
  amount: z
    .number({ invalid_type_error: 'Jumlah pengeluaran harus berupa angka' })
    .positive('Jumlah pengeluaran harus lebih dari 0')
    .max(99999999.99, 'Jumlah pengeluaran terlalu besar (maksimal 99.999.999,99)'),

  // [BUG 3 FIX] Izinkan null selain undefined menggunakan .nullable().optional()
  expenseDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Format tanggal tidak valid',
    })
    .nullable()
    .optional(),

  notes: z.string().nullable().optional(),
});

// Tambahan skema untuk validasi Update Expense (jika menggunakan endpoint update)
const updateExpenseSchema = createExpenseSchema.partial();

const expenseIdParamSchema = z.object({
  id: z.string().uuid('ID pengeluaran tidak valid'),
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
};
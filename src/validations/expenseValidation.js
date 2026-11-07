const { z } = require('zod');

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Keterangan pengeluaran wajib diisi'),
  amount: z.number().positive('Jumlah pengeluaran harus lebih dari 0'),
  expenseDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Format tanggal tidak valid',
    })
    .optional(),
  notes: z.string().optional(),
});

const expenseIdParamSchema = z.object({
  id: z.string().uuid('ID pengeluaran tidak valid'),
});

module.exports = {
  createExpenseSchema,
  expenseIdParamSchema,
};
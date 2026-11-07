const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

// GET: Mengambil semua data pengeluaran
const getAllExpenses = asyncHandler(async (req, res) => {
  const expenses = await prisma.expense.findMany({
    orderBy: { expenseDate: 'desc' },
  });

  return res.status(200).json({ success: true, data: expenses });
});

// POST: Menambahkan data pengeluaran baru
const createExpense = asyncHandler(async (req, res) => {
  const { title, amount, expenseDate, notes } = req.body;

  const newExpense = await prisma.expense.create({
    data: {
      title,
      amount,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      notes,
    },
  });

  return res.status(201).json({ success: true, data: newExpense });
});

// DELETE: Menghapus data pengeluaran berdasarkan ID
const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.expense.delete({ where: { id } });

  return res.status(200).json({
    success: true,
    message: 'Pengeluaran berhasil dihapus',
  });
});

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense,
};
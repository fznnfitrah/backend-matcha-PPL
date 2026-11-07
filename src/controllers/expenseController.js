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

const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, amount, expenseDate, notes } = req.body;

  // Cek apakah data pengeluaran ada
  const existingExpense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existingExpense) {
    return res.status(404).json({
      success: false,
      message: 'Data pengeluaran tidak ditemukan',
    });
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: {
      title: title !== undefined ? title : undefined,
      amount: amount !== undefined ? amount : undefined,
      expenseDate: expenseDate ? new Date(expenseDate) : expenseDate === null ? null : undefined,
      notes: notes !== undefined ? notes : undefined,
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Pengeluaran berhasil diperbarui',
    data: updatedExpense,
  });
});

module.exports = {
  getAllExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
};
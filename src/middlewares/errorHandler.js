const { Prisma } = require('@prisma/client');

// Handler error terpusat. Parameter `next` wajib ada agar Express
// mengenali fungsi ini sebagai error handler.
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';

  // Menerjemahkan error Prisma yang umum menjadi respons HTTP yang sesuai
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      status = 404;
      message = 'Data tidak ditemukan';
    } else if (err.code === 'P2002') {
      status = 409;
      message = 'Data sudah ada (duplikat)';
    } else if (err.code === 'P2003') {
      status = 400;
      message = 'Data masih berelasi dengan data lain';
    } else if (err.code === 'P2020') { // <-- Ubah dari P2004 ke P2020
      status = 400;
      message = 'Nilai data melebihi batas kapasitas yang diizinkan database (Out of range).';
    }
  }

  // Jangan bocorkan detail error internal ke client
  if (status >= 500) {
    console.error(err);
    message = 'Terjadi kesalahan pada server';
  }

  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware agar server bisa menerima request berformat JSON
app.use(cors());
app.use(express.json());

// Route pengujian awal
app.get('/', (req, res) => {
  res.json({ message: 'Backend Matcha API is running!' });
});

// Menangani endpoint yang tidak dikenal
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Menangani error yang tidak terduga
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Terjadi kesalahan pada server',
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

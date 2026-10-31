const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware agar server bisa menerima request berformat JSON
app.use(express.json());

// Route pengujian awal
app.get('/', (req, res) => {
  res.json({ message: 'Backend Matcha API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
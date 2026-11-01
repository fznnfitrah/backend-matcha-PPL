const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// Kumpulan endpoint API
app.use('/api', routes);

// Route pengujian awal
app.get('/', (req, res) => {
  res.json({ message: 'Backend Matcha API is running!' });
});

// Handler 404 dan error terpusat
app.use(notFound);
app.use(errorHandler);

module.exports = app;

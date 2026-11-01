const express = require('express');

const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Pusat pendaftaran seluruh router API
router.use('/products', productRoutes);
router.use('/users', userRoutes);

module.exports = router;

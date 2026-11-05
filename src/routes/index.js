const express = require('express');

const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRouter');

const router = express.Router();

// Pusat pendaftaran seluruh router API
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);

module.exports = router;

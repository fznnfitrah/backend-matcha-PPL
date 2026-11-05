const express = require('express');

const productRoutes = require('./productRoutes');
const userRoutes = require('./userRoutes');
const orderRoutes = require('./orderRouter');
const paymentRoutes = require('./paymentRoute');

const router = express.Router();

// Pusat pendaftaran seluruh router API
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;

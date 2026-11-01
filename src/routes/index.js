const express = require('express');

const productRoutes = require('./productRoutes');

const router = express.Router();

// Pusat pendaftaran seluruh router API
router.use('/products', productRoutes);

module.exports = router;

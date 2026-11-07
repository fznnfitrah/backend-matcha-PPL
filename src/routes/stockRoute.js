const express = require('express');
const router = express.Router();
// [P0 FIX] Pastikan restockProduct ikut ter-import dengan benar
const { checkStockLevels, restockProduct } = require('../controllers/stockController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { restockSchema, variantIdParamSchema } = require('../validations/stockValidation');

// Endpoint untuk mengecek stok menipis (Wajib Login & ADMIN)
router.get('/check-stock', protect, restrictTo('ADMIN'), checkStockLevels);

// Endpoint untuk restok varian produk (Wajib Login & ADMIN)
router.post(
  '/:variantId/restok',
  protect,
  restrictTo('ADMIN'),
  validate(variantIdParamSchema, 'params'),
  validate(restockSchema),
  restockProduct
);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const validate = require('../middlewares/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../validations/orderValidation');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Semua rute order wajib login (protect)
router.use(protect);

router.post('/', validate(createOrderSchema), createOrder);       // POST /api/orders (Checkout)
router.get('/', getOrders);                                       // GET /api/orders (Lihat riwayat/semua pesanan)
router.patch('/:id/status', restrictTo('ADMIN'), validate(updateOrderStatusSchema), updateOrderStatus); // PATCH /api/orders/:id/status (Admin ubah status)

module.exports = router;
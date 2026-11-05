const express = require('express');
const router = express.Router();
const {
  createPaymentToken,
  handleMidtransWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createPaymentTokenSchema } = require('../validations/paymentValidation');

// Endpoint untuk membuat token pembayaran (Wajib Login)
router.post('/token', protect, validate(createPaymentTokenSchema), createPaymentToken);

// Endpoint webhook callback dari Midtrans (Tanpa protect, diakses otomatis oleh server Midtrans)
router.post('/webhook', handleMidtransWebhook);

module.exports = router;

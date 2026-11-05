const { z } = require('zod');

const createPaymentTokenSchema = z.object({
  orderId: z.string().uuid('ID pesanan tidak valid'),
});

module.exports = {
  createPaymentTokenSchema,
};

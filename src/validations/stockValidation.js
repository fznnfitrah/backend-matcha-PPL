const { z } = require('zod');

const restockSchema = z.object({
  additionalStock: z
    .number({ invalid_type_error: 'Jumlah penambahan stok harus berupa angka' })
    .int('Jumlah penambahan stok harus bilangan bulat')
    .positive('Jumlah penambahan stok harus lebih dari 0'),
});

const variantIdParamSchema = z.object({
  variantId: z.string().uuid('ID varian produk tidak valid'),
});

module.exports = {
  restockSchema,
  variantIdParamSchema,
};
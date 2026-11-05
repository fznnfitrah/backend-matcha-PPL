const { z } = require('zod');

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string({ error: 'ID Produk wajib diisi' }).min(1),
        productVariantId: z.string().nullable().optional(), // Opsional jika produk punya varian
        quantity: z.number().int().positive({ message: 'Jumlah minimal 1' }),
      }),
    )
    .min(1, { message: 'Keranjang belanja tidak boleh kosong' }),
  customerName: z.string().min(1, { message: 'Nama pelanggan tidak boleh kosong' }).optional(),
  customerPhone: z
    .string()
    .min(8, { message: 'Nomor telepon minimal 8 karakter' })
    .max(20, { message: 'Nomor telepon maksimal 20 karakter' })
    .regex(/^[0-9+\-\s()]+$/, { message: 'Format nomor telepon tidak valid' }),
  shippingAddress: z
    .string()
    .min(5, { message: 'Alamat pengiriman wajib diisi dengan lengkap' })
    .optional(),
  shippingFee: z.number().min(0, { message: 'Biaya pengiriman tidak boleh negatif' }).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'PROCESSING', 'COMPLETED', 'CANCELLED'], {
    message: 'Status pesanan tidak valid',
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};

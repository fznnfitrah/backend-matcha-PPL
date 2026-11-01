const { z } = require('zod');

const variantSchema = z.object({
  variantName: z.string().min(1, 'Nama varian wajib diisi'),
  additionalPrice: z.number().min(0, 'Harga tambahan tidak boleh negatif').optional(),
  stock: z.number().int('Stok harus berupa bilangan bulat').min(0, 'Stok tidak boleh negatif').optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  description: z.string().optional(),
  basePrice: z.number().positive('Harga dasar harus lebih dari 0'),
  costPrice: z.number().positive('Harga modal harus lebih dari 0'),
  imageUrl: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  minThreshold: z
    .number()
    .int('Minimal stok harus berupa bilangan bulat')
    .min(0, 'Minimal stok tidak boleh negatif')
    .optional(),
});

const updateProductSchema = z
  .object({
    name: z.string().min(1, 'Nama produk wajib diisi').optional(),
    description: z.string().nullable().optional(),
    basePrice: z.number().positive('Harga dasar harus lebih dari 0').optional(),
    costPrice: z.number().positive('Harga modal harus lebih dari 0').optional(),
    imageUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

const idParamSchema = z.object({
  id: z.string().uuid('ID tidak valid'),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  idParamSchema,
};

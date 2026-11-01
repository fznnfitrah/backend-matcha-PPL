const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// 1. GET: Mendapatkan semua produk (beserta varian dan stok alert)
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      lowStockAlert: true,
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Berhasil mengambil semua data produk',
    data: products,
  });
});

// 2. GET: Mendapatkan detail produk berdasarkan ID
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, lowStockAlert: true },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  return res.status(200).json({
    success: true,
    message: 'Berhasil mengambil detail produk',
    data: product,
  });
});

// 3. POST: Menambah produk baru (validasi dilakukan oleh middleware)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, basePrice, costPrice, imageUrl, variants, minThreshold } = req.body;

  const newProduct = await prisma.product.create({
    data: {
      name,
      description,
      basePrice,
      costPrice,
      imageUrl,
      variants:
        variants && variants.length > 0
          ? {
              create: variants.map((variant) => ({
                variantName: variant.variantName,
                additionalPrice: variant.additionalPrice ?? 0,
                stock: variant.stock ?? 0,
              })),
            }
          : undefined,
      lowStockAlert: {
        create: {
          minThreshold: minThreshold ?? 5,
          isNotified: false,
        },
      },
    },
    include: { variants: true, lowStockAlert: true },
  });

  return res.status(201).json({
    success: true,
    message: 'Produk berhasil ditambahkan',
    data: newProduct,
  });
});

// 4. PUT: Memperbarui produk berdasarkan ID
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, basePrice, costPrice, imageUrl, isActive } = req.body;

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      description,
      basePrice,
      costPrice,
      imageUrl,
      isActive,
    },
    include: { variants: true, lowStockAlert: true },
  });

  return res.status(200).json({
    success: true,
    message: 'Produk berhasil diperbarui',
    data: updatedProduct,
  });
});

// 5. DELETE: Menghapus produk berdasarkan ID
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  await prisma.product.delete({ where: { id } });

  return res.status(200).json({
    success: true,
    message: 'Produk berhasil dihapus',
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

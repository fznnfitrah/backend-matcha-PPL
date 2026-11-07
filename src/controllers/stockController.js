const prisma = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');

// GET: Memeriksa stok produk berdasarkan varian individu dan membuat alert/notifikasi admin
const checkStockLevels = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      variants: true,
      lowStockAlert: true,
    },
  });

  const alertsTriggered = [];

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  });

  for (const product of products) {
    const threshold = product.lowStockAlert?.minThreshold ?? 5;

    // Filter varian yang stoknya di bawah atau sama dengan threshold
    const lowVariants = product.variants.filter((v) => v.stock <= threshold);
    const hasLowStockVariant = lowVariants.length > 0;
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    let alert = product.lowStockAlert;

    if (hasLowStockVariant) {
      if (!alert) {
        alert = await prisma.lowStockAlert.create({
          data: {
            productId: product.id,
            minThreshold: threshold,
            isNotified: false,
          },
        });
      }

      if (!alert.isNotified && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          await prisma.userNotification.create({
            data: {
              userId: admin.id,
              title: 'Stok Produk Menipis!',
              message: `Produk "${product.name || 'Tanpa Nama'}" memiliki ${lowVariants.length} varian yang stoknya di bawah batas minimum (${threshold}).`,
            },
          });
        }

        alert = await prisma.lowStockAlert.update({
          where: { id: alert.id },
          data: { isNotified: true },
        });
      }

      // [P2 FIX] Menyertakan detail varian yang menipis dan total stok di respons
      alertsTriggered.push({
        productId: product.id,
        productName: product.name,
        totalStock,
        threshold,
        lowVariants: lowVariants.map(v => ({ variantId: v.id, name: v.name, stock: v.stock }))
      });
    } else {
      if (alert && alert.isNotified) {
        await prisma.lowStockAlert.update({
          where: { id: alert.id },
          data: { isNotified: false },
        });
      }
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Pemeriksaan dan sinkronisasi stok varian selesai',
    data: alertsTriggered,
  });
});

// POST: Endpoint untuk restok varian produk
const restockProduct = asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  const { additionalStock } = req.body; // Sudah divalidasi Zod (integer positif)

  // Cari varian produk beserta produk utamanya
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        include: {
          variants: true,
          lowStockAlert: true,
        },
      },
    },
  });

  if (!variant) {
    return res.status(404).json({
      success: false,
      message: 'Varian produk tidak ditemukan',
    });
  }

  // Update stok varian
  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      stock: {
        increment: Number(additionalStock),
      },
    },
  });

  // [P1 FIX] Evaluasi ulang status alert produk setelah restok (Reset isNotified jika stok sudah aman)
  const product = variant.product;
  if (product.lowStockAlert) {
    // Ambil ulang data varian terbaru setelah penambahan stok
    const updatedVariants = await prisma.productVariant.findMany({
      where: { productId: product.id },
    });

    const threshold = product.lowStockAlert.minThreshold;
    const stillHasLowStock = updatedVariants.some((v) => v.stock <= threshold);

    // Jika setelah restok sudah tidak ada varian yang di bawah threshold, reset isNotified ke false
    if (!stillHasLowStock && product.lowStockAlert.isNotified) {
      await prisma.lowStockAlert.update({
        where: { id: product.lowStockAlert.id },
        data: { isNotified: false },
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Restok berhasil dilakukan dan status alert diperbarui',
    data: updatedVariant,
  });
});

module.exports = {
  checkStockLevels,
  restockProduct,
};
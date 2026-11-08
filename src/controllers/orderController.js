const { Prisma } = require('@prisma/client');

const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// POST: Membuat Pesanan Baru (Checkout)
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, shippingFee, customerPhone, customerName } = req.body;
  const userId = req.user.id; // Didapat dari middleware 'protect' (JWT)

  // Nama pelanggan: dari body, token, atau database (token lama belum tentu punya name)
  let resolvedCustomerName = customerName || req.user.name;
  if (!resolvedCustomerName) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    resolvedCustomerName = user?.name;
  }

  if (!resolvedCustomerName) {
    throw new AppError('Nama pelanggan tidak ditemukan', 400);
  }

  let subtotalAmount = new Prisma.Decimal(0);
  const orderItemsData = [];

  // Validasi produk dan hitung total harga secara aman di server
  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    });

    if (!product || !product.isActive) {
      throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan atau sudah tidak aktif`, 404);
    }

    let unitPrice = new Prisma.Decimal(product.basePrice);

    // Jika produk menggunakan varian
    if (item.productVariantId) {
      const variant = product.variants.find((v) => v.id === item.productVariantId);
      if (!variant) {
        throw new AppError(`Varian untuk produk ${product.name} tidak ditemukan`, 404);
      }
      unitPrice = unitPrice.plus(variant.additionalPrice);
    }

    subtotalAmount = subtotalAmount.plus(unitPrice.mul(item.quantity));

    orderItemsData.push({
      productId: product.id,
      productVariantId: item.productVariantId || null,
      quantity: item.quantity,
      unitPrice,
    });
  }

  const shippingFeeAmount = new Prisma.Decimal(shippingFee ?? 0);
  const totalAmount = subtotalAmount.plus(shippingFeeAmount);

  // Simpan Order beserta OrderItems ke database menggunakan Prisma Transaction
  const newOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        customerName: resolvedCustomerName,
        customerPhone,
        shippingAddress: shippingAddress || 'Ambil di tempat (Dine-in/Takeaway)',
        shippingFee: shippingFeeAmount,
        totalAmount,
        orderStatus: 'PENDING_PAYMENT',
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    return order;
  });

  return res.status(201).json({
    success: true,
    message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran.',
    data: newOrder,
  });
});

// GET: Mendapatkan Riwayat Pesanan User yang sedang login (atau semua order jika Admin)
const getOrders = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;

  const queryOptions = {
    include: {
      orderItems: {
        include: {
          product: true,
          productVariant: true,
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  };

  // Jika pembeli biasa (CUSTOMER), hanya lihat pesanan miliknya sendiri
  if (role !== 'ADMIN') {
    queryOptions.where = { userId };
  }

  const orders = await prisma.order.findMany(queryOptions);

  return res.status(200).json({
    success: true,
    message: 'Berhasil mengambil daftar pesanan',
    data: orders,
  });
});

// PATCH: Mengubah Status Pesanan (Khusus Admin / Update Pembayaran)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { orderStatus: status },
  });

  return res.status(200).json({
    success: true,
    message: `Status pesanan berhasil diperbarui menjadi ${status}`,
    data: updatedOrder,
  });
});

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
};

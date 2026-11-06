const prisma = require('../lib/prisma');
const snap = require('../services/midtransService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildMidtransOrderId,
  extractOrderId,
  verifySignature,
  mapTransactionStatus,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
} = require('../utils/midtransUtils');

// Status order yang masih boleh dibayar
const PAYABLE_STATUSES = ['PENDING_PAYMENT'];

// Batas waktu pembayaran (harus sama dengan countdown di frontend)
const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

// POST: Membuat Snap Token Midtrans untuk sebuah Order
const createPaymentToken = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  // Cari data order beserta item dan status pembayarannya
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  // Pastikan pesanan milik user yang sedang login (kecuali Admin)
  if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
    throw new AppError('Anda tidak memiliki akses ke pesanan ini', 403);
  }

  if (order.payment?.paymentStatus === 'SUCCESS') {
    throw new AppError('Pesanan ini sudah dibayar', 409);
  }

  if (!PAYABLE_STATUSES.includes(order.orderStatus)) {
    throw new AppError(
      `Pesanan berstatus ${order.orderStatus} tidak dapat dibayar`,
      409,
    );
  }

  // Harga Midtrans wajib bilangan bulat (IDR)
  const itemDetails = order.orderItems.map((item) => ({
    id: item.productId,
    price: Math.round(Number(item.unitPrice)),
    quantity: item.quantity,
    name: item.product.name.substring(0, 50), // Batas karakter nama produk oleh Midtrans
  }));

  const shippingFee = Math.round(Number(order.shippingFee));
  if (shippingFee > 0) {
    itemDetails.push({
      id: 'SHIPPING_FEE',
      price: shippingFee,
      quantity: 1,
      name: 'Biaya Pengiriman',
    });
  }

  const grossAmount = Math.round(Number(order.totalAmount));

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new AppError('Total pesanan tidak valid', 400);
  }

  // Midtrans menolak transaksi jika jumlah item_details != gross_amount
  const itemsSum = itemDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (itemsSum !== grossAmount) {
    throw new AppError(
      'Total pesanan tidak konsisten dengan rincian item. Silakan buat ulang pesanan.',
      500,
    );
  }

  // Masa berlaku pembayaran mengikuti countdown frontend (15 menit sejak order dibuat).
  // Sisa waktu dibulatkan ke atas agar tidak lebih pendek dari yang dilihat user.
  const expiresAt = new Date(order.createdAt).getTime() + PAYMENT_WINDOW_MS;
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) {
    throw new AppError('Batas waktu pembayaran sudah habis', 410);
  }
  const expiryMinutes = Math.max(1, Math.min(15, Math.ceil(remainingMs / 60000)));

  // Suffix timestamp base36 menjaga order_id tetap unik untuk pembayaran ulang,
  // sekaligus aman dari batas 50 karakter Midtrans.
  // Pemisah "__" agar tidak bentrok dengan tanda "-" di dalam UUID.
  const midtransOrderId = buildMidtransOrderId(order.id);

  const parameter = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: grossAmount,
    },
    expiry: {
      unit: 'minutes',
      duration: expiryMinutes,
    },
    customer_details: {
      first_name: order.customerName.substring(0, 50),
      phone: order.customerPhone,
      shipping_address: {
        address: order.shippingAddress,
      },
    },
    item_details: itemDetails,
  };

  const transaction = await snap.createTransaction(parameter);

  // Catat/segarkan data pembayaran (satu baris Payment per order)
  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: {
      paymentGateway: 'MIDTRANS',
      transactionId: null,
      paymentStatus: 'PENDING',
      amount: grossAmount,
      rawResponse: JSON.stringify(transaction),
    },
    create: {
      orderId: order.id,
      paymentGateway: 'MIDTRANS',
      paymentStatus: 'PENDING',
      amount: grossAmount,
      rawResponse: JSON.stringify(transaction),
    },
  });

  return res.status(200).json({
    success: true,
    message: 'Berhasil membuat token pembayaran Midtrans',
    data: {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: midtransOrderId,
    },
  });
});

// GET: Status pembayaran ringkas untuk halaman pembayaran frontend
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) {
    throw new AppError('Pesanan tidak ditemukan', 404);
  }

  if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
    throw new AppError('Anda tidak memiliki akses ke pesanan ini', 403);
  }

  let status = 'pending';
  const paymentStatus = order.payment?.paymentStatus;

  if (paymentStatus === 'SUCCESS') {
    status = 'paid';
  } else if (paymentStatus === 'FAILED' || paymentStatus === 'REFUNDED') {
    status = 'failed';
  } else if (order.orderStatus === 'CANCELLED') {
    status = 'expired';
  } else if (
    order.orderStatus === 'PENDING_PAYMENT' &&
    Date.now() - new Date(order.createdAt).getTime() > PAYMENT_WINDOW_MS
  ) {
    status = 'expired';
  }

  return res.status(200).json({
    success: true,
    message: 'Berhasil mengambil status pembayaran',
    data: {
      status,
      orderStatus: order.orderStatus,
      paymentStatus: paymentStatus || null,
    },
  });
});

// POST: Webhook Notification Handler dari Midtrans
const handleMidtransWebhook = asyncHandler(async (req, res) => {
  const notification = req.body || {};

  if (!process.env.MIDTRANS_SERVER_KEY) {
    throw new AppError('MIDTRANS_SERVER_KEY belum dikonfigurasi', 500);
  }

  // Midtrans memakai Signature Secret Key untuk menandatangani webhook.
  // Server Key tetap dipakai untuk memanggil API Midtrans, bukan untuk signature.
  const signatureKey =
    process.env.MIDTRANS_SIGNATURE_SECRET || process.env.MIDTRANS_SERVER_KEY;

  if (
    !notification.transaction_id ||
    !notification.order_id ||
    !notification.signature_key
  ) {
    throw new AppError('Payload notifikasi Midtrans tidak lengkap', 400);
  }

  // Tolak notifikasi yang tidak memiliki signature valid
  if (!verifySignature(notification, signatureKey)) {
    throw new AppError('Signature notifikasi tidak valid', 401);
  }

  // Ambil status transaksi langsung dari Midtrans (otoritatif)
  const statusResponse = await snap.transaction.notification(notification);

  const orderId = extractOrderId(statusResponse.order_id);
  if (!orderId) {
    console.warn('[midtrans] order_id tidak dikenali:', statusResponse.order_id);
    return res.status(200).json({
      success: true,
      message: 'Notifikasi diabaikan (order_id tidak dikenali)',
    });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order) {
    console.warn('[midtrans] order tidak ditemukan:', orderId);
    return res.status(200).json({
      success: true,
      message: 'Notifikasi diabaikan (order tidak ditemukan)',
    });
  }

  const paidAmount = Number(statusResponse.gross_amount);
  if (
    !Number.isFinite(paidAmount) ||
    Math.round(paidAmount) !== Math.round(Number(order.totalAmount))
  ) {
    console.warn(
      `[midtrans] nominal tidak sesuai untuk order ${orderId}: ` +
        `dibayar=${statusResponse.gross_amount}, tagihan=${order.totalAmount}`,
    );
    return res.status(200).json({
      success: true,
      message: 'Notifikasi diabaikan (nominal tidak sesuai)',
    });
  }

  const mappedStatus = mapTransactionStatus(statusResponse);
  if (!mappedStatus) {
    console.warn(
      '[midtrans] status transaksi tidak dikenali:',
      statusResponse.transaction_status,
    );
    return res.status(200).json({
      success: true,
      message: 'Notifikasi diabaikan (status tidak dikenali)',
    });
  }

  const shouldUpdateOrder = canTransitionOrderStatus(
    order.orderStatus,
    mappedStatus.orderStatus,
  );

  const shouldUpdatePaymentStatus = canTransitionPaymentStatus(
    order.payment?.paymentStatus,
    mappedStatus.paymentStatus,
  );

  const paymentData = {
    transactionId: statusResponse.transaction_id,
    amount: Math.round(paidAmount),
    rawResponse: JSON.stringify(statusResponse),
  };

  if (shouldUpdatePaymentStatus) {
    paymentData.paymentStatus = mappedStatus.paymentStatus;
  }

  await prisma.$transaction(async (tx) => {
    if (shouldUpdateOrder) {
      await tx.order.update({
        where: { id: orderId },
        data: { orderStatus: mappedStatus.orderStatus },
      });
    }

    await tx.payment.upsert({
      where: { orderId },
      update: paymentData,
      create: {
        orderId,
        paymentGateway: 'MIDTRANS',
        paymentStatus: mappedStatus.paymentStatus,
        ...paymentData,
      },
    });
  });

  return res.status(200).json({
    success: true,
    message: 'Notifikasi berhasil diproses',
  });
});

module.exports = {
  createPaymentToken,
  getPaymentStatus,
  handleMidtransWebhook,
};

const crypto = require('crypto');

// UUID di awal string, mis. "156b81d6-e96e-44d6-8ee8-6b7e83c1e21d__1730850000000"
// Format lama memakai "-" sebagai pemisah, jadi regex ini kompatibel dengan keduanya.
const UUID_PREFIX =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

function extractOrderId(midtransOrderId) {
  const match = String(midtransOrderId || '').match(UUID_PREFIX);
  return match ? match[1] : null;
}

// Midtrans membatasi order_id maksimal 50 karakter.
// UUID (36) + "__" (2) + timestamp base36 (~8) = ~46 karakter.
function buildMidtransOrderId(orderId) {
  return `${orderId}__${Date.now().toString(36)}`;
}

// signature_key = SHA512(order_id + status_code + gross_amount + serverKey)
function verifySignature(notification, serverKey) {
  const { order_id, status_code, gross_amount, signature_key } = notification || {};

  if (!order_id || !status_code || !gross_amount || !signature_key || !serverKey) {
    return false;
  }

  const expected = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  const received = String(signature_key);
  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

// Menerjemahkan status Midtrans menjadi status order + payment milik aplikasi
function mapTransactionStatus({ transaction_status, fraud_status } = {}) {
  switch (transaction_status) {
    case 'capture':
      return fraud_status === 'accept'
        ? { orderStatus: 'PROCESSING', paymentStatus: 'SUCCESS' }
        : { orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING' };
    case 'settlement':
      return { orderStatus: 'PROCESSING', paymentStatus: 'SUCCESS' };
    case 'pending':
      return { orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING' };
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'failure':
      return { orderStatus: 'CANCELLED', paymentStatus: 'FAILED' };
    case 'refund':
    case 'partial_refund':
      return { orderStatus: 'CANCELLED', paymentStatus: 'REFUNDED' };
    default:
      return null;
  }
}

const STATUS_RANK = {
  PENDING_PAYMENT: 0,
  PROCESSING: 1,
  COMPLETED: 2,
};

// Mencegah status "turun" (mis. PROCESSING kembali ke PENDING_PAYMENT)
// dan mencegah perubahan dari status terminal.
function canTransitionOrderStatus(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) return false;
  if (currentStatus === 'CANCELLED' || currentStatus === 'COMPLETED') return false;
  if (nextStatus === 'CANCELLED') return true;

  return (STATUS_RANK[nextStatus] ?? -1) > (STATUS_RANK[currentStatus] ?? -1);
}

// Mencegah notifikasi yang datang terlambat menurunkan status pembayaran.
// SUCCESS hanya boleh berubah menjadi REFUNDED, REFUNDED bersifat final.
function canTransitionPaymentStatus(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) return false;
  if (currentStatus === 'REFUNDED') return false;
  if (currentStatus === 'SUCCESS') return nextStatus === 'REFUNDED';
  if (currentStatus === 'FAILED') {
    return nextStatus === 'SUCCESS' || nextStatus === 'REFUNDED';
  }

  return true; // PENDING boleh ke status apa pun
}

module.exports = {
  buildMidtransOrderId,
  extractOrderId,
  verifySignature,
  mapTransactionStatus,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
};

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Password default untuk data seeding (dipakai untuk login saat demo).
const ADMIN_PASSWORD = 'admin123';
const CUSTOMER_PASSWORD = 'password123';

async function main() {
  console.log('🌱 Memulai proses seeding database Matcha...');

  // 1. Bersihkan data lama dengan urutan yang aman dari foreign key constraint
  await prisma.userNotification.deleteMany();
  await prisma.lowStockAlert.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.expense.deleteMany();

  // ==========================================
  // 2. SEED USERS (Minimal 5 data)
  // ==========================================
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const customerPasswordHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin Matcha',
        email: 'admin@matcha.com',
        password: adminPasswordHash,
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Achmad Fauzan',
        email: 'fauzan@gmail.com',
        password: customerPasswordHash,
        role: 'CUSTOMER',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Vanka Rahma',
        email: 'vanka@gmail.com',
        password: customerPasswordHash,
        role: 'CUSTOMER',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Muhammad Arfian',
        email: 'arfian@gmail.com',
        password: customerPasswordHash,
        role: 'CUSTOMER',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Siti Aminah',
        email: 'siti@gmail.com',
        password: customerPasswordHash,
        role: 'CUSTOMER',
      },
    }),
  ]);
  console.log('✅ 5 Data User berhasil dimasukkan.');

  // ==========================================
  // 3. SEED PRODUCTS & VARIANTS & LOW STOCK ALERT (Minimal 5 data produk)
  // ==========================================
  const productsData = [
    {
      name: 'Matcha Latte Original',
      description: 'Minuman matcha klasik dengan susu segar pilihan berkualitas.',
      basePrice: 25000,
      costPrice: 12000,
      imageUrl: 'https://example.com/matcha-latte.jpg',
      variants: [
        { variantName: 'Cup Reguler (Normal Sugar)', additionalPrice: 0, stock: 50 },
        { variantName: 'Cup Besar (Less Sugar)', additionalPrice: 5000, stock: 40 },
      ],
      minThreshold: 10,
    },
    {
      name: 'Ice Matcha Espresso',
      description: 'Perpaduan unik bubuk matcha premium dan shot espresso kuat.',
      basePrice: 30000,
      costPrice: 15000,
      imageUrl: 'https://example.com/matcha-espresso.jpg',
      variants: [
        { variantName: 'Cup Reguler', additionalPrice: 0, stock: 30 },
        { variantName: 'Cup Besar', additionalPrice: 6000, stock: 25 },
      ],
      minThreshold: 15,
    },
    {
      name: 'Matcha Cheese Cream',
      description: 'Matcha manis dengan topping krim keju gurih di atasnya.',
      basePrice: 32000,
      costPrice: 16000,
      imageUrl: 'https://example.com/matcha-cheese.jpg',
      variants: [
        { variantName: 'Regular Size', additionalPrice: 0, stock: 4 }, // Stok sengaja dibuat di bawah ambang batas (Low Stock)
      ],
      minThreshold: 10, // Memicu low stock alert karena stok hanya 4
    },
    {
      name: 'Matcha Red Bean',
      description: 'Matcha autentik disajikan dengan tambahan topping kacang merah.',
      basePrice: 28000,
      costPrice: 13000,
      imageUrl: 'https://example.com/matcha-redbean.jpg',
      variants: [
        { variantName: 'Standard Cup', additionalPrice: 0, stock: 60 },
      ],
      minThreshold: 10,
    },
    {
      name: 'Matcha Strawberry Silk',
      description: 'Kombinasi menyegarkan antara matcha, susu, dan selai stroberi.',
      basePrice: 35000,
      costPrice: 18000,
      imageUrl: 'https://example.com/matcha-strawberry.jpg',
      variants: [
        { variantName: 'Medium', additionalPrice: 0, stock: 45 },
        { variantName: 'Large', additionalPrice: 5000, stock: 35 },
      ],
      minThreshold: 10,
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const { variants, minThreshold, ...productInfo } = p;
    const product = await prisma.product.create({
      data: {
        ...productInfo,
        variants: {
          create: variants,
        },
        lowStockAlert: {
          create: {
            minThreshold: minThreshold,
            isNotified: p.variants.some(v => v.stock < minThreshold),
          },
        },
      },
      include: { variants: true },
    });
    createdProducts.push(product);
  }
  console.log('✅ 5 Data Product, Variant, dan LowStockAlert berhasil dimasukkan.');

  // ==========================================
  // 4. SEED EXPENSES (Minimal 5 data pengeluaran operasional UMKM)
  // ==========================================
  await prisma.expense.createMany({
    data: [
      { title: 'Beli Bubuk Matcha Premium 1kg', amount: 150000, notes: 'Suplier utama Jakarta' },
      { title: 'Beli Susu Segar UHT 20 Liter', amount: 360000, notes: 'Stok mingguan' },
      { title: 'Cup Plastik & Sedotan Biodegradable', amount: 120000, notes: 'Belanja di toko kemasan' },
      { title: 'Token Listrik Kedai Bulanan', amount: 250000, notes: 'Pembayaran PLN' },
      { title: 'Biaya Perawatan Mesin Espresso', amount: 200000, notes: 'Servis rutin bulanan' },
    ],
  });
  console.log('✅ 5 Data Expense berhasil dimasukkan.');

  // ==========================================
  // 5. SEED ORDERS, ORDER ITEMS & PAYMENT (Minimal 5 data transaksi)
  // ==========================================
  const customerUsers = users.filter(u => u.role === 'CUSTOMER');

  for (let i = 0; i < 5; i++) {
    const randomCustomer = customerUsers[i % customerUsers.length];
    const randomProduct = createdProducts[i % createdProducts.length];
    const randomVariant = randomProduct.variants[0];
    
    const shippingFee = 10000;
    const unitPrice = Number(randomProduct.basePrice) + Number(randomVariant.additionalPrice);
    const quantity = 2;
    const totalAmount = (unitPrice * quantity) + shippingFee;

    const order = await prisma.order.create({
      data: {
        userId: randomCustomer.id,
        customerName: randomCustomer.name,
        customerPhone: `08123456789${i}`,
        shippingAddress: `Jl. Melati No. ${i + 1}, Malang, Jawa Timur`,
        shippingFee: shippingFee,
        totalAmount: totalAmount,
        orderStatus: i === 4 ? 'COMPLETED' : 'PROCESSING',
        orderItems: {
          create: [
            {
              productId: randomProduct.id,
              productVariantId: randomVariant.id,
              quantity: quantity,
              unitPrice: unitPrice,
            },
          ],
        },
        payment: {
          create: {
            paymentGateway: 'MIDTRANS',
            transactionId: `TRX-MATCH-2026-00${i + 1}`,
            paymentStatus: i === 4 ? 'SUCCESS' : 'PENDING',
            amount: totalAmount,
            rawResponse: JSON.stringify({ status_message: 'Success dummy response MIDTRANS' }),
          },
        },
      },
    });
  }
  console.log('✅ 5 Data Order, OrderItem, dan Payment berhasil dimasukkan.');

  // ==========================================
  // 6. SEED USER NOTIFICATIONS (Minimal 5 data notifikasi)
  // ==========================================
  for (let i = 0; i < 5; i++) {
    const targetUser = customerUsers[i % customerUsers.length];
    await prisma.userNotification.create({
      data: {
        userId: targetUser.id,
        title: `Status Pesanan #${i + 1}`,
        message: `Halo ${targetUser.name}, pesanan produk matcha Anda sedang diproses oleh kedai.`,
        isRead: i % 2 === 0,
      },
    });
  }
  console.log('✅ 5 Data UserNotification berhasil dimasukkan.');

  console.log('🎉 Proses Seeding Database Sempurna! Semua tabel terisi minimal 5 data.');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
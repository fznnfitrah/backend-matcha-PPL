const { PrismaClient } = require('@prisma/client');

// Membuat instance Prisma Client untuk dipakai di seluruh controller
const prisma = new PrismaClient();

module.exports = prisma;
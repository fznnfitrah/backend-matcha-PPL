# Backend Matcha

Backend API untuk aplikasi UMKM Matcha. Proyek ini dibangun dengan **Express**, **Prisma ORM**, dan **MySQL**.

> Catatan: repo ini memang **tidak menyertakan Docker**. Pemilik repo memakai Docker untuk database di laptopnya sendiri, tetapi siapa pun (termasuk kontributor frontend) cukup memakai **MySQL lokal** seperti dijelaskan di bawah.

## Tech Stack

- Node.js
- Express 5
- Prisma ORM 6
- MySQL 8

## Struktur Proyek

```
backend-matcha/
├── prisma/
│   ├── schema.prisma        # Definisi model/tabel database
│   └── migrations/          # Riwayat migrasi database
├── src/
│   ├── server.js            # Entry point aplikasi Express
│   └── lib/prisma.js        # Instance Prisma Client
├── uploads/                 # (Rencana) penyimpanan file/gambar produk
├── .env.example             # Contoh konfigurasi environment
├── package.json
└── README.md
```

## Prasyarat

Pastikan sudah terpasang di komputer Anda:

- **Node.js 18.18+** (disarankan 20 atau lebih baru) — cek dengan `node -v`
- **npm** — cek dengan `npm -v`
- **MySQL 8** yang berjalan di `localhost:3306`
  - Bisa memakai MySQL Server langsung, atau lewat XAMPP/Laragon/MAMP (bagian MySQL saja).
- **Git**

## Setup (Tanpa Docker)

### 1. Clone repository

```bash
git clone <URL_REPOSITORY>
cd backend-matcha
```

### 2. Install dependensi

```bash
npm install
```

Perintah ini juga otomatis menjalankan `prisma generate` untuk membuat Prisma Client.

### 3. Siapkan database MySQL

Buat database dan user (jalankan di MySQL client/phpMyAdmin):

```sql
CREATE DATABASE matcha_db;
CREATE USER 'matcha_user'@'localhost' IDENTIFIED BY 'matchapassword';
GRANT ALL PRIVILEGES ON matcha_db.* TO 'matcha_user'@'localhost';
FLUSH PRIVILEGES;
```

> Jika ingin memakai user MySQL yang sudah ada (misalnya `root`), silakan sesuaikan `DATABASE_URL` di langkah berikutnya.

### 4. Buat file `.env`

```bash
cp .env.example .env
```

Lalu sesuaikan isinya dengan MySQL lokal Anda:

```env
PORT=5000
DATABASE_URL="mysql://matcha_user:matchapassword@127.0.0.1:3306/matcha_db"
MIDTRANS_SERVER_KEY="sandbox-xxxxxx"
MIDTRANS_CLIENT_KEY="sandbox-xxxxxx"
```

Contoh jika memakai user `root` tanpa password:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/matcha_db"
```

> Pengguna Windows (CMD) dapat memakai `copy .env.example .env` sebagai ganti `cp`.

### 5. Jalankan migrasi database

```bash
npx prisma migrate dev
```

Perintah ini membuat tabel-tabel di database sesuai `prisma/schema.prisma` dan membuat Prisma Client.

### 6. Jalankan backend

```bash
npm run dev
```

Atau tanpa auto-reload:

```bash
npm start
```

### 7. Tes backend

Buka `http://localhost:5000/` di browser, atau:

```bash
curl http://localhost:5000/
```

Respons yang diharapkan:

```json
{ "message": "Backend Matcha API is running!" }
```

## Environment Variables

| Variable              | Wajib         | Deskripsi                                                                        |
| --------------------- | ------------- | -------------------------------------------------------------------------------- |
| `PORT`                | Tidak         | Port server Express (default `3000`, contoh `.env` memakai `5000`).              |
| `DATABASE_URL`        | Ya            | Connection string MySQL, format `mysql://user:password@host:port/nama_database`. |
| `MIDTRANS_SERVER_KEY` | Belum dipakai | Server key Midtrans untuk pembayaran.                                            |
| `MIDTRANS_CLIENT_KEY` | Belum dipakai | Client key Midtrans untuk pembayaran.                                            |

## NPM Scripts

| Script                    | Fungsi                                           |
| ------------------------- | ------------------------------------------------ |
| `npm run dev`             | Menjalankan server dengan auto-reload (nodemon). |
| `npm start`               | Menjalankan server tanpa auto-reload.            |
| `npm run prisma:generate` | Membuat ulang Prisma Client.                     |
| `npm run prisma:migrate`  | Membuat & menerapkan migrasi baru (development). |
| `npm run prisma:deploy`   | Menerapkan migrasi yang sudah ada (production).  |
| `npm run prisma:studio`   | Membuka Prisma Studio untuk melihat data.        |

## Endpoint yang Tersedia

| Method | Endpoint | Deskripsi                             |
| ------ | -------- | ------------------------------------- |
| GET    | `/`      | Menampilkan pesan bahwa API berjalan. |

> Endpoint fitur (auth, produk, pesanan, pembayaran, dll.) akan ditambahkan pada tahap berikutnya.

## Troubleshooting

- **`Can't reach database server` / `P1001`** — pastikan MySQL sudah berjalan di `localhost:3306` dan `DATABASE_URL` sudah benar.
- **`Access denied for user`** — periksa username/password di `DATABASE_URL`, atau buat user seperti pada langkah 3.
- **`Port 5000 is already in use`** — ubah `PORT` di `.env` atau hentikan proses yang memakai port tersebut.
- **`@prisma/client did not initialize yet`** — jalankan `npx prisma generate`.
- **CORS error saat diakses frontend** — server sudah mengaktifkan CORS; pastikan frontend memanggil URL backend yang benar.

## Catatan untuk Kontributor Frontend

- Backend berjalan di `http://localhost:5000`.
- Pastikan MySQL lokal aktif dan migrasi sudah dijalankan sebelum memanggil API.
- File `.env` tidak ikut di-commit; buat sendiri dari `.env.example`.

testing pull request oke mas github+discordnya

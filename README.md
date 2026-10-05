# SIRAGU Trace

Sistem Informasi Keterlacakan (Traceability) Gula Semut Organik, dari tingkat petani hingga ke tangan pembeli (B2B) dan konsumen akhir (B2C).

## Struktur Repositori

- `frontend/` - Aplikasi React / Vite dengan Tailwind CSS (Antarmuka Pengguna)
- `backend/` - (Opsional) Service NestJS

## Cara Menjalankan Secara Lokal

1. Masuk ke folder frontend:
   ```bash
   cd frontend
   ```
2. Install dependensi:
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```

## Panduan Deployment ke Vercel

Repositori ini telah disiapkan agar siap di-deploy (di-host) di Vercel:

1. Buat project baru di dashboard Vercel.
2. Hubungkan repository GitHub ini.
3. Pada bagian **Build and Output Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Klik **Deploy**!

Sistem secara otomatis akan menggunakan `vite build` dan mengkompilasi aplikasi Anda untuk environment produksi.

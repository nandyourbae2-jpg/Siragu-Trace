# SIRAGU TRACE — DOKUMENTASI FINAL GO-LIVE & PANDUAN KOMPETISI (BPC)

Dokumen ini merangkum seluruh implementasi end-to-end yang telah selesai dari **WS0 sampai WS8**, menjadikan platform **SIRAGU Trace** siap digunakan di dunia nyata (*production-ready*), siap diuji oleh pembeli (*buyer pilot*), dan siap dipresentasikan di hadapan dewan juri **Business Plan Competition (BPC)**.

---

## 1. Rangkuman Eksekutif & Status Sistem

| Komponen | Status Sebelum Audit | Status Saat Ini (Go-Live) |
|---|---|---|
| **Database** | Tidak ada migrasi, tidak ada DB lokal | PostgreSQL (`embedded-postgres` UTF-8) aktif di `localhost:5432/siragu_trace` dengan 2 migrasi Prisma lengkap. |
| **Backend Build** | ❌ Gagal (`complaints.service.ts` error) | ✅ **100% Lulus Typecheck & Build** (`tsc --noEmit`). |
| **Backend Tests** | 26 unit tests | ✅ **61 unit & integration tests lulus (100% green)**. |
| **Frontend Build** | Mock 100%, 0 real API fetch | ✅ **100% Lulus Build (`tsc -b && vite build`)**, terhubung ke API backend via TanStack Query. |
| **QR & Passport** | Serial sederhana, tanpa token acak | ✅ Token Crockford base32 10 karakter, decoupled dari serial fisik. |
| **Keamanan & Privasi** | Data pribadi petani terbuka | ✅ UU PDP No. 27/2022 compliant (anonimisasi petani tanpa izin publik, hashing IP SHA-256 dengan daily salt). |
| **IoT Cold-Chain** | Simulasi statis di memori | ✅ Klasifikasi suhu resmi (20-26°C normal, >26-27°C warning, >27°C deviasi, RH < 65%), live simulator & auto-alerts. |
| **Sertifikasi Dokumen** | Sertifikat Halal kedaluwarsa ditampilkan valid | ✅ *Certificates Vault* (Single Source of Truth), status dihitung dinamis (ACTIVE, EXPIRING, EXPIRED), link BPOM & BPJPH resmi. |
| **Ekspor PDF** | Simulasi alert kosong | ✅ *Server-side PDF Engine* (`pdf-lib` + `qrcode`), stempel digest kriptografis SHA-256 di footer, tersimpan di `PdfSnapshot`. |
| **Demo Backup** | Tidak ada | ✅ 1-Click Reset Golden Path + Snapshot Offline `public/offline-passport.html`. |

---

## 2. Kredensial Login & Akun Akses Demo

Seluruh data awal terisi melalui seed Golden Path (`backend/prisma/seed.ts`):

| Role | Email Login | Password | Hak Akses Utama |
|---|---|---|---|
| **Owner (Pemilik Koperasi)** | `owner@siragu.id` | `Siragu2026!` | Akses penuh: Finansial, rilis mutu, sensor, kemasan, buyer, reset demo. |
| **QA Inspector** | `qa@siragu.id` | `Siragu2026!` | Inspeksi laboratorium SNI 3743, rilis lot mutu, brankas sertifikat. |
| **Operator Pabrik** | `operator@siragu.id` | `Siragu2026!` | Penerimaan bahan nira, pencatatan olah & oven, kemasan, surat jalan. |
| **Manajer Operasional** | `manager@siragu.id` | `Siragu2026!` | Supervisi operasional pabrik dan inspeksi QA. |
| *Legacy Demo Login* | `owner@siragu.demo` | `demo1234` | Kompatibilitas mundur login lokal. |

---

## 3. Rute & URL Penting untuk Presentasi Juri

### A. Rute Publik (Tanpa Login / Scan Kamera HP)
1. **Paspor Konsumen Lot (`/v/DEMOPASSPORT`):**
   - Tampilan *mobile-first* (360px+ portrait).
   - Banner verifikasi nira kelapa organik murni Banyumas.
   - Hasil uji laboratorium **SNI 3743:2021** (Kadar Air 1.82%, Mesh 16 Lolos 98.5%, Bagian Tak Larut 0.12%, Lulus Mutu I).
   - Asal-usul petani penderes binaan (*UU PDP compliant*).
   - Integrasi legalitas: BPOM MD (tautan ke `cekbpom.pom.go.id`), Halal BPJPH Kemenag (tautan ke `bpjph.halal.go.id`), dan sertifikat EU Organic.
   - Riwayat suhu IoT boks logistik & grafik sparkline.
   - Tombol **Unduh Paspor Resmi (PDF)** berstempel SHA-256.
   - Pengalih bahasa instan (**ID / EN**).
2. **Paspor B2B Box & Cold-Chain (`/s/BOXDEMO0001`):**
   - Ditujukan untuk pembeli B2B / eksportir (BioFoods Europe / PT Megah Rasa Pangan).
   - Jejak perjalanan *Chain of Custody* (Gudang Pabrik Somagede ➔ Hub Distribusi Purwokerto ➔ Retail Hub Jakarta).
   - Analisis sensor IoT: suhu minimum, rata-rata, maksimum, durasi deviasi, dan kelembaban (RH).
   - Tombol unduh berkas kepatuhan ekspor (PDF).
3. **Stimulus Penelitian & Evaluasi Pembeli:**
   - `/stimulus/low`: Tampilan paspor dasar dengan transparansi minimal (baseline pembanding).
   - `/stimulus/high`: Tampilan paspor ultra-transparan dengan telemetri sensor, profil petani, dan bukti lab.
4. **Backup Presentasi Tanpa Internet:**
   - `/offline-passport.html`: Paspor HTML statis mandiri, siap dibuka offline jika koneksi internet di lokasi lomba bermasalah.

### B. Rute Aplikasi Internal (`/app`)
- `/app/dashboard`: Dasbor utama peran (Owner, QA, Operator).
- `/app/operations/receiving`: Input penerimaan bahan nira kelapa dari petani penderes (validasi bruto - tara = netto).
- `/app/lots`: Daftar lot olahan (kunci edit setelah lot berstatus `RELEASED`).
- `/app/operations/packaging`: Pemecahan lot olahan ke kemasan ritel + cetak stiker label thermal (50x30mm) atau A4 (grid 24 stiker).
- `/app/distribution`: Pembuatan surat jalan pengiriman dan pemantauan boks telemetri.
- `/app/settings/certificates`: *Certificates Vault* dengan status masa berlaku dinamis (Aktif, Segera Berakhir, Kedaluwarsa).
- `/app/iot`: Pemantauan sensor lingkungan gudang + **Live Simulation Bar** untuk memicu simulasi suhu normal (22-25°C), peringatan (26-27°C), atau deviasi kritis (>27°C) secara langsung di hadapan juri.

---

## 4. Cara Menjalankan Layanan Secara Lokal

### 1. Database (PostgreSQL Embedded)
Database berjalan di background menggunakan `scripts/dev-db.mjs`:
```bash
cd backend
npm run db:dev
```
*Port:* `5432` | *User:* `siragu` | *Password:* `siragupassword` | *Database:* `siragu_trace`

### 2. Backend NestJS
```bash
cd backend
npm run start:dev
```
*API berjalan pada:* `http://localhost:3000` (Global prefix `/api`)

### 3. Frontend Vite
```bash
cd frontend
npm run dev
```
*Frontend berjalan pada:* `http://localhost:5173` (dengan Vite proxy otomatis meneruskan `/api` ke backend).

### 4. Satu-Klik Reset Demo State (Golden Path)
Jika saat latihan atau presentasi data telah berubah dan ingin dikembalikan ke kondisi awal yang sempurna:
- **Cara 1 (Melalui UI):** Buka avatar profil di pojok kiri bawah `AppShell`, klik tombol **"↺ Reset Golden Path (1-Click)"**.
- **Cara 2 (Melalui Terminal):**
  ```bash
  cd backend
  npx tsx prisma/seed.ts
  ```

---

## 5. Ringkasan Pengujian Kualitas Kode (QA & Testing)

- **Backend Unit & Integration Tests:** 61 tests passed across 9 test suites (`vitest`).
  - `common.spec.ts`: Crockford Base32 generator, format batch `B{YY}-{MMDD}-{NN}`, BPOM validator, validasi Halal, perhitungan Netto.
  - `lots.service.spec.ts` & `lots-integrity.spec.ts`: Penguncian lot RELEASED, pembatasan kuantitas kemasan, mass balance balance.
  - `temp-scoring.spec.ts`: Klasifikasi suhu, akumulasi menit deviasi, simulator PRNG deterministik.
  - `public.service.spec.ts`: DTO Whitelist, anonimisasi UU PDP, generasi PDF dengan SHA-256.
  - `auth.service.spec.ts` & `release-gate.service.spec.ts`: Hierarki peran, release gate rules.
- **TypeScript Static Verification:**
  - Backend: `npm run typecheck` (`tsc --noEmit`) ➔ **0 errors**.
  - Frontend: `npm run build` (`tsc -b && vite build`) ➔ **0 errors**, bundle siap produksi.

# AUDIT GO-LIVE — SIRAGU Trace (WS0)

Tanggal audit: 2026-10-22 · Commit dasar: `d9a6555` (+ perubahan lokal belum di-commit: `frontend/index.html`, `vercel.json`, `frontend/vercel.json`)
Cakupan: pembacaan repo + menjalankan `tsc`, lint, test, build. **Tidak ada kode produksi yang diubah.**

> Catatan metode: temuan di bawah diverifikasi dengan membaca kode atau menjalankan perintah. Hal yang belum dibaca mendalam ditandai "belum diverifikasi".

---

## 1. Ringkasan eksekutif

| Area | Kondisi nyata |
|---|---|
| Frontend | 21 komponen/halaman memakai `DemoDataContext` (state + `localStorage`). **Tidak ada satu pun panggilan `fetch`/axios/`import.meta.env`** di `frontend/src`. Frontend 100% mock. |
| Auth frontend | `mockAuthAdapter.ts`: 2 user demo hardcoded (owner, operator), password `demo1234`, session di `sessionStorage`. Tidak ada user QA/Manager. |
| Backend | NestJS + Prisma lebih lengkap dari dugaan: auth JWT+refresh, RBAC (`RolesGuard`), `TenantScopeInterceptor`, Lots + state machine, ProcessEvents + mass balance, Trace, Quality (release gate), Packaging + QR, Shipments, Complaints, IoT (read-only), Reports. Namun **belum dihubungkan ke frontend**. |
| Build backend | **GAGAL** (`nest build` / `tsc`): 3 error di `complaints.service.ts`. |
| Test | Backend 26/26 lulus (5 file). Frontend: tidak ada test. Tidak ada e2e. |
| Lint | Backend: 0 error, 6 warning. Frontend `eslint`: **84 error** (unused vars / `any`, banyak di kode orphan); `tsc -b` bersih. |
| Migrasi DB | **Tidak ada folder `prisma/migrations`.** Tidak ada riwayat migrasi → tidak aman untuk produksi. |
| Deploy | Hanya `vercel.json` rewrite SPA (`/(.*)` → `/index.html`). Tidak ada konfigurasi backend, CI, env per lingkungan, health check, atau domain kustom. |
| Design system | `DESIGN-notion.md` **tidak ditemukan** di repo. Token di `frontend/src/index.css` (primary `#0075DE`, bg `#FAF9F6`, Inter) bernuansa Notion, tetapi banyak halaman memakai warna Tailwind langsung (`indigo-*`, `slate-*`, `emerald-*`). |

Kesimpulan: kerja terbesar bukan membangun backend dari nol, melainkan (a) memperbaiki build & integritas aturan bisnis backend, (b) **memindahkan frontend dari mock ke API**, (c) menambah fitur baru (Lot Passport, QR token, PDF, IoT per box) di atas fondasi tersebut.

---

## 2. Peta modul: mock vs nyata

### 2.1 Frontend — halaman → sumber data

Legenda: **MOCK** = `DemoDataContext`/data hardcoded · **STUB** = placeholder tanpa fungsi · **ORPHAN** = file ada tetapi tidak terpasang di router.

| Route | Komponen | Sumber data | Endpoint backend yang tersedia | Catatan |
|---|---|---|---|---|
| `/` | `LandingPage` | Statis | – | Teks pemasaran; klaim perlu ditinjau sebelum BPC. |
| `/login` | `Login` | MOCK (`mockAuthAdapter`) | `POST /auth/login` | Kredensial demo ditampilkan di UI. |
| `/403` | `Unauthorized` | Statis | – | |
| `/verify/:serial` | `PublicQrPage` | MOCK | `GET /verify/:serial` | **P0:** jika serial tidak ditemukan memakai `packages[0]` sebagai fallback → paket lain tampil seolah valid. Unggah file hanya `setTimeout` palsu. |
| `/shared-dossier/:token` | `SharedDossierPage` | MOCK | tidak ada (belum ada model magic link) | Token tidak divalidasi server. |
| `/app/dashboard` | `RoleDashboard` → `OwnerHome` / `QaHome` / `OperatorHome` | MOCK (Owner, QA); Operator: tidak memakai DemoData (belum diverifikasi detail) | – | Angka KPI dari data demo. |
| `/app/operations/receiving` | `ReceivingPage` + `ReceivingForm` | MOCK | `POST /lots`, `POST /process-events`, `GET /suppliers` | Netto = bruto − tara dihitung **hanya di klien**. |
| `/app/lots` | `LotsPage` | MOCK | `GET/POST/PATCH /lots` | |
| `/app/operations/packaging` | `PackagingPage` | MOCK | `POST /packaging/lot/:id`, `GET …/qr` | URL QR memakai `window.location.origin`. |
| `/app/distribution` | `DistributionPage` | MOCK | `POST /distribution/shipments` | |
| `/app/operations/release` | `ReleaseQueuePage` | **STUB** | `POST /quality/release/:lotId`, `GET …/check` | Teks menyatakan "seluruh lot otomatis dirilis tanpa QA" — bertentangan dengan aturan lot hanya bisa dikemas jika RELEASED. |
| `/app/inventory/inspections` | `WarehouseInspectionPage` | MOCK | `POST /quality/inspections` | |
| `/app/trace` | `TracePage` + `TraceGraph` | MOCK (`lib/trace.ts` menghitung di klien) | `GET /lots/:id/trace` | React Flow dimuat statis. |
| `/app/iot` | `environment/IotPage` | MOCK (sensor simulasi di context) | `GET /iot/sensors`, `…/readings` | `traceability/IotPage` adalah STUB dan tidak dipakai route. |
| `/app/buyers` | `BuyerAccessPage` (+ `BuyerPortal`) | MOCK | `GET/POST/PATCH /buyers` | Magic link dibangun di klien dari `window.location.origin`. |
| `/app/settings/certificates` | `CertificatesVaultPage` | **Array hardcoded 3 sertifikat** | tidak ada model/endpoint | **P0 kejujuran:** sertifikat Halal `exp 2024-11-10` sudah lewat (hari ini 2026-10-22) tetapi ditampilkan "Segera Kedaluwarsa", bukan "Kedaluwarsa". Tombol Unggah/Lihat PDF tidak berfungsi. |
| `/app/reports/suppliers` | `SupplierAnalyticsPage` | MOCK | – | |
| – | `ComplaintsPage` | MOCK, **ORPHAN** | `POST /distribution/complaints`, `…/analyze`, `…/action` | Modul Complaint/Recall tidak bisa dibuka dari UI. |
| – | `QAInspectionsPage`, `ReportsPage`, `Actions`, `pages/{QA,More,Trace,Settings}` | MOCK, **ORPHAN** | – | Kode mati; sumber banyak error lint. |

### 2.2 Backend — endpoint

Controller bisnis memakai `@UseGuards(JwtAuthGuard, RolesGuard)`; pengecualian: `auth/*`, `verify/*`, dan `GET /`.

| Modul | Endpoint | Catatan |
|---|---|---|
| auth | `POST /auth/login`, `/refresh`, `/logout` | Access token 15 m, refresh token di-hash di DB. |
| lots | `GET/POST /lots`, `GET/PATCH/DELETE /lots/:id`, `GET /lots/:id/events` | Kunci lot `RELEASED` tidak terlihat di `lots.service` (perlu dicek bersama `lot-state-machine`). |
| trace | `GET /lots/:id/trace` | |
| process-events | `GET/POST /process-events`, `GET :id` | Mass balance via `MassBalanceService` (BALANCED/WARNING/BLOCKED). |
| quality | `inspections`, `release/:lotId(/check)`, `evidence` | `ReleaseGateService` + 9 unit test. |
| packaging | `POST packaging/lot/:id`, `GET …`, `GET :id/qr`, `POST qr/:serial/activate` | Kemas boleh saat `READY` **atau** `RELEASED`; tidak ada cek total berat ≤ output lot. |
| verify (publik) | `GET /verify/:serial` | **Tanpa rate limit, tanpa cache, tanpa ScanEvent.** Serial `QR-<16 hex>` acak, tetapi bukan format token spesifikasi. |
| distribution | `POST shipments`, `GET shipments/buyer/:id`, complaints `POST/analyze/action` | Satu lot per shipment; `shipmentCode` = `SHP-` + 4 digit terakhir `Date.now()` → **rawan tabrakan**. Tidak ada Box/Leg. |
| iot | `GET sensors`, `GET sensors/:id/readings` | Hanya baca. Tidak ada ingest, device token, CSV, simulator. |
| suppliers, buyers | CRUD | Spread `...dto` memicu 6 warning lint. |
| reports | `POST export`, `GET jobs`, `GET jobs/:id` | Belum diverifikasi apakah job benar-benar diproses. |
| `GET /` | Hello World | Belum ada health check sebenarnya. |

### 2.3 Model Prisma

Ada (25 model): Organization, Site, Location, Supplier, Buyer, User, RefreshToken, Lot, LotRelation, ProcessEvent, ProcessEventInput, ProcessEventOutput, LotEvent, AuditLog, Inspection, Evidence, Package, QrSerial, Shipment, ShipmentLine, Complaint, Gateway, Sensor, SensorReading, ExportJob.

**Belum ada** (dibutuhkan spesifikasi): `Certificate`, `ScanEvent`, `Box`, `ShipmentLeg`, `IotDevice`, `TempReading`, `TempSummary`, `BatchSequence` (urutan harian atomik), `ShareLink` (magic link), `Farmer`/`FarmerConsent` (persetujuan UU PDP), `PrintJob`, `Alert`; field `bpomType/bpomNumber`, `distributorName`, `tempSpec`, `batchNumber`, `publicToken`; kolom bruto/tara (Lot hanya punya `quantity`).

Catatan skema: enum `Role` = `ADMIN, OWNER, OPERATOR, QA, BUYER, CONSUMER` — **tidak ada `MANAGER`**. `AuditLog` hanya terlihat dipakai di `complaints.service.ts`; mutasi lain belum diaudit.

### 2.4 Env & skrip

- Backend `.env` (git-ignored, benar): `DATABASE_URL` (Postgres lokal via `docker-compose.yml`), `JWT_SECRET`, `SESSION_SECRET`. Tidak ada `.env.example`, `PUBLIC_BASE_URL`, `CORS_ORIGINS`.
- Skrip backend: `build`, `start:prod`, `test`, `lint`, `db:migrate`, `db:seed`, `db:reset`. Tidak ada skrip `typecheck`.
- `main.ts`: CORS di-hardcode ke `localhost`; **tidak ada helmet, rate limit, prefix `/api`, health check**; `forbidNonWhitelisted: false`.
- Frontend: `build = tsc -b && vite build`; tidak ada `VITE_API_URL`.
- `prisma/seed.ts` **menghapus seluruh tabel** (`deleteMany` pada semua model) lalu mengisi data dengan password `password123`. Aman untuk dev, **berbahaya jika terjalankan di produksi**.

---

## 3. Temuan & risiko

### P0 — blokir go-live / pelanggaran aturan non-negosiabel

| # | Temuan | Dampak | WS |
|---|---|---|---|
| P0-1 | Frontend sepenuhnya mock; tidak ada klien API | Tujuan utama tidak tercapai | WS1 |
| P0-2 | `nest build` gagal (`TraceNode`, `traceLineage` tidak ada di `TraceService`) | Backend tidak bisa di-deploy | WS1 |
| P0-3 | Tidak ada migrasi Prisma | Tidak bisa deploy/rollback DB terkontrol | WS1 |
| P0-4 | `PublicQrPage` menampilkan `packages[0]` untuk serial tak dikenal | Konsumen bisa melihat lot yang salah sebagai "terverifikasi" | WS2/3 |
| P0-5 | Vault sertifikat hardcoded; Halal kedaluwarsa tampil "segera kedaluwarsa" | Data/sertifikat tidak jujur | WS1/2 |
| P0-6 | Netto hanya di klien; kemas boleh dari `READY`; tidak ada cek total kemasan ≤ output; lot `RELEASED` tidak terbukti terkunci | Integritas data & aturan inti | WS1 |
| P0-7 | Data contoh tidak berlabel DEMO (label hanya di `Login`, `BuyerAccessPage`, `mockAuthAdapter`) | Melanggar "Kejujuran data" | WS1/8 |
| P0-8 | `GET /verify/:serial` tanpa DTO whitelist formal, rate limit, cache, ScanEvent | Risiko kebocoran & abuse | WS2 |
| P0-9 | QR berisi `window.location.origin/verify/<serial>`, bukan `PUBLIC_BASE_URL/v/<token>` | QR cetak mati jika domain berubah | WS3 |
| P0-10 | Seed menghapus semua data tanpa guard environment | Risiko hapus DB produksi | WS1/7 |

### P1 — wajib sebelum demo BPC

| # | Temuan | WS |
|---|---|---|
| P1-1 | Tidak ada `MANAGER`; frontend punya 2 user demo, backend 6 role; izin belum sinkron | WS1 |
| P1-2 | Audit log hanya di 1 service | WS1 |
| P1-3 | Tenant isolation hanya diuji pada `lots.service`; `qrSerial.findUnique({serial})` global | WS1 |
| P1-4 | `shipmentCode`/`packageCode` memakai `Date.now()` 4 digit → tabrakan | WS1 |
| P1-5 | `ComplaintsPage` & QA inspections tidak terpasang di router | WS1 |
| P1-6 | Belum ada PWA; `useOfflineSync` hanya antrean localStorage | WS7/8 |
| P1-7 | React Flow dimuat statis; belum ada code-splitting halaman publik (target < 2 s) | WS2 |
| P1-8 | Tidak ada test frontend maupun e2e | WS7 |
| P1-9 | Frontend `eslint` 84 error | WS1 |
| P1-10 | Tidak ada OG meta untuk `/v/*` & `/s/*` | WS3 |
| P1-11 | Tidak ada persetujuan petani / privasi / retensi ScanEvent (UU PDP) | WS2/7 |
| P1-12 | `DESIGN-notion.md` tidak ada; halaman memakai warna Tailwind langsung | Semua |

### P2 — perbaikan lanjutan

- 6 warning `no-misused-spread` (spread DTO class ke Prisma `data`).
- `test/app.e2e-spec.ts` gagal typecheck (`supertest/types` tidak ditemukan).
- `backend/README.md` masih boilerplate NestJS; README root belum menjelaskan backend/deploy.
- `@nestjs/observe` ada di dependensi tetapi tidak dipakai di `AppModule`.
- `main.ts` memakai top-level `await`; pastikan runtime target mendukung ESM.

---

## 4. Baseline hasil perintah

| Perintah | Hasil |
|---|---|
| `backend: npx tsc --noEmit` | ❌ 4 error (3 di `complaints.service.ts`, 1 di `test/app.e2e-spec.ts`) |
| `backend: npx nest build` | ❌ 3 error (complaints) |
| `backend: npx vitest run` | ✅ 26/26 |
| `backend: npm run lint` | ✅ 0 error, 6 warning |
| `frontend: npx tsc -b` | ✅ bersih |
| `frontend: npx eslint .` | ❌ 84 error |
| DB / e2e | Tidak dijalankan (tidak ada Postgres aktif & tidak ada suite e2e) |

---

## 5. Asumsi

1. **Hosting**: Frontend → Vercel; backend → Railway (Nest + Postgres terkelola). Dapat diganti Render/Fly tanpa perubahan kode.
2. **Domain**: `PUBLIC_BASE_URL` diisi domain kustom pemilik; **QR cetak final tidak boleh dicetak sebelum domain tetap**.
3. **Peran**: `MANAGER` ditambahkan ke enum `Role` lewat migrasi; role lain dipertahankan (backward compatible).
4. **Batch** `B{YY}-{MMDD}-{NN}` diurutkan per tenant per hari (zona `Asia/Jakarta`) lewat tabel `BatchSequence` dengan upsert atomik (`INSERT … ON CONFLICT DO UPDATE … RETURNING`).
5. **Token QR**: 10 karakter Crockford base32 (±50 bit), kolom `publicToken` unique; nomor seri terbaca manusia terpisah.
6. **Jenis nomor BPOM**: default `MD` (pangan olahan dalam negeri). Nomor `NA…` pada contoh dianggap stimulus penelitian dan diberi label DEMO sampai pemilik mengonfirmasi (Keputusan 1).
7. **Design system**: karena `DESIGN-notion.md` tidak ada, token `index.css` dijadikan acuan; halaman baru memakai token tersebut.
8. **Generator PDF**: library server-side ringan (mis. `pdf-lib`/`pdfkit`), bukan headless Chrome, agar file < 1 MB. Dipilih final di WS4.
9. **Migrasi**: dibuat migrasi baseline `0_init` dari skema saat ini, lalu migrasi inkremental per workstream.
10. **Waktu**: timestamp UTC di DB; tampilan WIB.

---

## 6. Rencana urutan kerja

Urutan: WS0 → WS8. Prioritas minimum demo: **WS0, WS1 (alur inti), WS2, WS3, WS5 (simulator), WS6, WS8**.

### WS1 — Backend nyata (commit kecil)

1. **1a Perbaiki build**: perbaiki `complaints.service.ts` terhadap API `TraceService`, typecheck bersih, tambah skrip `typecheck`, `.env.example`.
2. **1b Migrasi baseline** `0_init` + role `MANAGER`; seed menolak jalan saat `NODE_ENV=production`.
3. **1c Integritas data**: netto = bruto − tara (server), kunci lot `RELEASED` (koreksi lewat endpoint bertanda audit), kemas hanya `RELEASED`, total kemasan ≤ output lot, kode `SHP`/`PKG` atomik, transaksi multi-tabel, `AuditLog` untuk semua mutasi. Test unit + lintas-tenant.
4. **1d Certificates**: model `Certificate` + endpoint; status Aktif / Segera berakhir / Kedaluwarsa dihitung server.
5. **1e Klien API frontend**: `lib/api.ts` (`VITE_API_URL`, refresh token), `realAuthAdapter`, migrasi halaman dari `DemoDataContext` ke React Query: Receiving → Lots → QA release → Packaging → Distribution → Certificates → Complaints (pasang route). Hapus kode orphan.
6. **1f Seed golden path** berlabel DEMO + test e2e alur utama.

**Risiko WS1**: refactor 21 file; mitigasi: `DemoDataContext` tetap ada di balik flag `VITE_USE_MOCK=true` sampai halaman terakhir pindah, lalu dihapus.

### WS2–WS8
Sesuai prompt, dengan tambahan dari audit:
- WS2: `/api/public/v1/lots/:token` menggantikan `/verify/:serial` (endpoint lama mengembalikan 404 jika serial tak ada — tanpa fallback).
- WS3: `vercel.json` sudah punya rewrite SPA; tambahkan edge function OG khusus `/v/*` & `/s/*`.
- WS5: perluas `Sensor`/`SensorReading` (gudang, ambang RH 65%) tanpa merusaknya; model baru untuk box.
- WS7: tambahkan CI (lint, typecheck, test, build); saat ini belum ada workflow.

---

## 7. Checklist AC WS0

- [x] Dokumen audit ada (`docs/AUDIT-GOLIVE.md`).
- [x] Setiap halaman terpeta ke sumber datanya (Bagian 2.1).
- [x] Tidak ada perubahan kode produksi.

## 8. Keputusan yang butuh persetujuan pemilik

1. **Jenis nomor BPOM**: konfirmasi nomor resmi produk (MD / P-IRT / lainnya). Sampai itu, `NA…` berlabel DEMO.
2. **Domain kustom & hosting backend** (Railway/Render/Fly): domain final harus ada sebelum QR dicetak.
3. **`DESIGN-notion.md`**: tidak ada di repo — mohon ditambahkan; jika tidak, token `index.css` dipakai sebagai acuan.

# 🏥 Klinik Bekam Sehat — Sistem Manajemen Klinik

Aplikasi manajemen klinik berbasis web untuk **Klinik Bekam Sehat dr. Abdurrahman**, klinik pengobatan islami dan alami di Medan, Indonesia.

🌐 **Live:** [klinikbekamsehat.pages.dev](https://klinikbekamsehat.pages.dev)

---

## Fitur Utama

- **Manajemen Pasien** — data pasien, kode otomatis (P0001, P0002...), riwayat kunjungan terintegrasi
- **Kunjungan & Checkout** — input layanan/produk, edit harga fleksibel, checkout otomatis generate nota PDF + kirim WA
- **Konsultasi** — rekam konsultasi, generate surat konsultasi PDF bernomor otomatis
- **Hasil Lab** — input gula darah, asam urat, kolesterol, generate surat hasil lab PDF profesional
- **Keuangan** — laporan harian otomatis dari checkout, pengeluaran manual, laporan bulanan (owner only)
- **Laporan** — grafik pendapatan, layanan terpopuler (owner only)
- **Portal Pasien** — pasien bisa cek riwayat kunjungan & download hasil lab sendiri
- **PWA** — bisa diinstall di HP layaknya aplikasi native
- **PDF Profesional** — kop surat, watermark, TTD + stempel dokter, stempel LUNAS

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| PDF | jsPDF (client-side) |
| Charts | Recharts |
| PWA | vite-plugin-pwa |
| Hosting | Cloudflare Pages (auto-deploy dari GitHub) |

---

## Cara Menjalankan

### 1. Clone & Install

```bash
git clone https://github.com/zaafirrahman/klinik-bekam-sehat.git
cd klinik-bekam-sehat
npm install
```

### 2. Setup Environment Variables

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

> Credentials bisa didapat dari Supabase Dashboard → Project Settings → API

### 3. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

---

## Scripts

```bash
npm run dev      # Dev server
npm run build    # Build production
npm run preview  # Preview hasil build
npm run lint     # ESLint
```

---

## Role & Akses

| Fitur | Admin | Owner |
|-------|-------|-------|
| Pasien, Kunjungan, Konsultasi, Lab | ✅ | ✅ |
| Keuangan Harian | ✅ | ✅ |
| Keuangan Bulanan | ❌ | ✅ |
| Laporan | ❌ | ✅ |
| Settings Info Klinik | ❌ | ✅ |
| Settings Pengguna | ❌ | ✅ |

---

## Deploy

Push ke branch `main` → Cloudflare Pages otomatis build & deploy (~1 menit).

Pastikan environment variables sudah di-set di Cloudflare Pages → Settings → Environment Variables.

---

## Struktur Database (Supabase)

| Tabel | Keterangan |
|-------|-----------|
| `profiles` | Akun staff (role: owner/admin) |
| `patients` | Data pasien |
| `visits` | Kunjungan pasien |
| `visit_services` | Layanan/produk per kunjungan |
| `services` | Master layanan & produk |
| `daily_income` | Pendapatan harian (auto dari checkout) |
| `daily_expenses` | Pengeluaran harian manual |
| `monthly_expenses` | Pengeluaran bulanan besar |
| `consultations` | Rekam konsultasi |
| `lab_results` | Hasil pemeriksaan lab |
| `clinic_settings` | Info klinik + asset PDF (singleton) |

---

## Lisensi

Private — dikembangkan khusus untuk Klinik Bekam Sehat dr. Abdurrahman, Medan.
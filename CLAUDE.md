# Klinik Bekam Sehat - Web Application

Sistem manajemen klinik berbasis web untuk **Klinik Bekam Sehat dr. Abdurrahman**, klinik pengobatan islami dan alami di Medan, Indonesia. Dibangun dengan React + Supabase, di-deploy ke Cloudflare.

**Live:** https://klinikbekamsehat.pages.dev
**Repo:** Public GitHub (zaafirrahman)  
**Database:** Supabase (Klinik Bekam Sehat)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 + shadcn/ui (Vega preset) |
| UI Components | shadcn/ui (Radix UI) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| PDF Generation | jsPDF (browser-side) |
| Charts | Recharts |
| Hijri Calendar | hijri-converter |
| PWA | vite-plugin-pwa |
| Hosting | Cloudflare (auto-deploy from GitHub) |

---

## Project Structure
```
klinik-bekam-sehat/
├── src/
│   ├── pages/
│   │   ├── Auth/
│   │   │   └── Login.jsx              # Staff login (email + password)
│   │   ├── Landing/
│   │   │   └── Landing.jsx            # Public landing page
│   │   ├── Portal/
│   │   │   ├── PortalLogin.jsx        # Patient login (patient_code + phone)
│   │   │   └── PortalDashboard.jsx    # Patient self-service dashboard
│   │   ├── Patients/
│   │   │   ├── Patients.jsx           # Patient list + CRUD
│   │   │   └── PatientDetail.jsx      # Patient profile + unified timeline
│   │   ├── Visits/
│   │   │   ├── Visits.jsx             # Visit list
│   │   │   └── VisitDetail.jsx        # Visit detail + checkout + nota PDF + WA
│   │   ├── Consultations/
│   │   │   ├── Consultations.jsx      # Consultation list
│   │   │   └── ConsultationDetail.jsx # Consultation detail + surat konsul PDF
│   │   ├── Lab/
│   │   │   ├── LabResults.jsx         # Lab result list
│   │   │   └── LabDetail.jsx          # Lab detail + surat lab PDF + WA
│   │   ├── Finance/
│   │   │   ├── Finance.jsx            # Daily finance (income + expense + breakdown)
│   │   │   └── FinanceMonthly.jsx     # Monthly finance + net profit (owner only)
│   │   ├── Reports/
│   │   │   └── Reports.jsx            # Charts + top services (owner only)
│   │   ├── Akupuntur/
│   │   │   ├── AkupunturPackages.jsx  # Acupuncture package list + create
│   │   │   └── AkupunturPackageDetail.jsx # Package detail + progress + visit tracking
│   │   └── Settings/
│   │       └── Settings.jsx           # Services/products, clinic info, user management
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (DO NOT edit manually)
│   │   └── AppLayout.jsx              # Sidebar layout for authenticated admin pages
│   ├── hooks/
│   │   └── use-mobile.js              # useIsMobile hook
│   ├── lib/
│   │   └── supabase.js                # Supabase client (uses VITE_ env vars)
│   └── assets/                        # Static assets
├── public/                            # PWA icons, manifest
├── netlify.toml                       # Netlify redirect config (switched to Cloudflare)
├── .env                               # Never commit! Contains Supabase credentials
└── CLAUDE.md                          # This file
```
---

## Database Schema

### Tables
| Table | Description |
|-------|-------------|
| `profiles` | Staff accounts (id FK→auth.users, full_name, role: owner/admin) |
| `patients` | Patient master data (patient_code: P0001, name, birth_date (DATE), phone, address) |
| `visits` | Patient visits (patient_id, visit_date, blood_pressure, chief_complaint) |
| `visit_services` | Services/products per visit (status: pending/done, final_price editable) |
| `services` | Master services & products (category: layanan/produk, service_code, base_price) |
| `daily_income` | Auto-populated on checkout via trigger |
| `daily_expenses` | Manual expense entries |
| `monthly_expenses` | Monthly big expenses (salary, rent, etc.) |
| `consultations` | Consultation records (reg_number auto-generated: 00.XX.YY format) |
| `lab_results` | Lab results (blood_sugar+type, uric_acid+gender, cholesterol) |
| `clinic_settings` | Single-row clinic info (singleton, id=1) — includes `layout_url`, `stamp_url`, `signature_url`, `sip_number`, `doctor` |
| `akupuntur_packages` | Paket akupuntur pasien (customizable sessions via `total_sessions`, progress via `visited_ids` UUID array, package_code: AKU-YYYY-XXX) |

### Key Design Decisions
- **`visit_services.status`**: `pending` → `done` triggers auto-insert to `daily_income`
- **`final_price`** is fully editable at checkout — no fixed pricing enforced
- **`patient_code`** auto-generated (P0001, P0002...) via sequence + trigger
- **`reg_number`** format: `00.XX.YY` where XX=sequence mod 100, first two digits=hundreds
- **`birth_date`** (DATE type) — age calculated exactly using date of birth
- **`lab_results.blood_sugar_type`**: `puasa` | `sewaktu`
- **`lab_results.uric_acid_gender`**: `pria` | `wanita`
- **`clinic_settings`** stored in Supabase (NOT localStorage) — syncs across devices

### RLS Policies
- All `authenticated` users: full CRUD on patients, visits, visit_services, consultations, lab_results, services
- `owner` only: read daily_income, daily_expenses, monthly_expenses, reports
- `anon`: read-only on patients, visits, visit_services, services, lab_results, clinic_settings, akupuntur_packages (for patient portal)
- Storage bucket `konsultasi`: authenticated can upload, public can read

---

## Role System

| Feature | Admin | Owner |
|---------|-------|-------|
| Pasien, Kunjungan, Konsultasi, Lab | ✅ | ✅ |
| Paket Akupuntur | ✅ | ✅ |
| Keuangan Harian (view + input) | ✅ | ✅ |
| Keuangan Bulanan | ❌ | ✅ |
| Laporan | ❌ | ✅ |
| Settings → Layanan & Produk | ✅ | ✅ |
| Settings → Info Klinik | ❌ | ✅ |
| Settings → Pengguna | ❌ | ✅ |

---

## Key Workflows

### Checkout Flow

Visit → tambah layanan (status: pending)
→ Checkout dialog (edit harga, tambah catatan)
→ Konfirmasi → status: done
→ AUTO: insert ke daily_income (via DB trigger)
→ AUTO: download nota PDF

### Nota / Surat PDF
- **Nota kunjungan**: generated client-side (jsPDF), auto-download saat checkout, format A5
- **Surat konsultasi**: generated client-side, uploaded ke Supabase Storage bucket `konsultasi/surat-konsul/`
- **Surat lab**: generated client-side, uploaded ke Supabase Storage bucket `konsultasi/hasil-lab/`, format A4
- Semua PDF bisa di-download ulang dari halaman detail

### PDF Assets (Supabase Storage bucket: `assets`, public)
- `layout_url` — kop surat full page (A5 untuk nota, A4 untuk lab), format JPEG, di-compress via canvas (quality 0.75, maxW 800px) → ukuran PDF ~55-82KB
- `stamp_url` — stempel LUNAS merah (untuk nota), format PNG
- `signature_url` — TTD + stempel gabungan dokter (untuk surat lab), format JPEG
- `sip_number` — nomor SIP dokter, ditampilkan di bawah nama dokter di surat lab
- Asset di-fetch via `fetch(url)` langsung (bukan Supabase SDK) karena bucket public
- Semua gambar dikonversi base64 via `FileReader`, lalu di-compress via canvas sebelum di-embed ke PDF
- Urutan render: `addImage(layout)` dulu (layer bawah) → teks → `addImage(signature/stamp)` terakhir

### WA Integration
- **Nota**: kirim teks ringkas + drag & drop PDF ke WA Web
- **Lab**: kirim hasil lab + link portal pasien + kode pasien
- Format: `wa.me/{phone}?text={encoded_message}`
- Nomor diformat otomatis: `08xx` → `628xx`

### Patient Portal (No Supabase Auth)
- Login: `patient_code` + `phone` → validated against `patients` table
- Session: stored in `localStorage` (patient_id, name, logged_in_at)
- Session expires: 24 jam
- Can view: riwayat kunjungan, hasil lab, download surat lab PDF, paket akupuntur + riwayat sesi
- Cannot view: konsultasi, data finansial, data pasien lain

---

## Responsive Design

All pages have dual layout:
- **Mobile** (`md:hidden`): Card list layout
- **Desktop** (`hidden md:block`): Table layout

Sidebar: auto-close on mobile via `useSidebar().setOpenMobile(false)` on menu click.

Key mobile fixes applied:
- `line-clamp-2 break-words` for long text
- `overflow-hidden` on card containers
- `shrink-0` on numeric values to prevent wrapping
- `min-w-0 flex-1` on text containers

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

Never use `process.env` — always use `import.meta.env.VITE_*`.

---

## Import Conventions

```js
// Always use @ alias
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

// Never use relative paths like ../../
```

---

## Critical Rules for Claude Code

### DO
- Use `@/` import alias for all internal imports
- Keep mobile card list + desktop table pattern for all list pages
- Use `e.stopPropagation()` on action buttons inside clickable rows/cards
- Use `sonner` toast (not the deprecated `toast` from shadcn)
- Fetch `clinic_settings` from Supabase for PDF headers (not localStorage)
- Use `line-clamp-2 break-words` for potentially long text in cards
- Add `overflow-y-auto max-h-[90vh]` to Dialog with long forms
- Keep `security definer` on all PostgreSQL functions that create sequences
- Always add both mobile (`md:hidden`) and desktop (`hidden md:block`) versions for list pages

### DON'T
- Don't define components inside other components (causes re-render/refocus bugs)
- Don't use `localStorage` for clinic settings (use Supabase)
- Don't use `process.env` (use `import.meta.env.VITE_*`)
- Don't add new tables without also adding RLS policies + GRANT
- Don't hardcode clinic name/address/phone in PDFs (fetch from `clinic_settings`)
- Don't use `react-router-dom` `<Link>` — use `useNavigate()` hook
- Don't edit files in `src/components/ui/` unless fixing shadcn bugs

### Common Pitfalls
- **Input refocus bug**: Never define form components inside parent component — always define outside
- **RLS 403**: New tables need both `create policy` AND `grant ... to authenticated/anon`
- **Trigger permission error**: DB functions that create sequences need `security definer`
- **Mobile overflow**: Card containers need `overflow-hidden`, text needs `min-w-0 flex-1`
- **TableRow onClick conflict**: Action buttons need `e.stopPropagation()`
- **Portal auth**: Uses localStorage session, NOT Supabase Auth — anon role for DB access
- **PDF image size**: jsPDF embed raw pixel data — PNG 45KB bisa jadi 3MB di PDF. Selalu compress via canvas `toDataURL('image/jpeg', 0.75)` sebelum `addImage`
- **PDF layer order**: `addImage(layout)` harus dipanggil PERTAMA sebelum teks apapun, TTD/stempel TERAKHIR
- **PDF fetch asset**: Gunakan `fetch(url)` langsung untuk public bucket, bukan `supabase.storage.download()`

---

## Supabase Storage

Bucket: `konsultasi` (public)
- `surat-konsul/` — consultation letters
- `hasil-lab/` — lab result letters

Bucket: `assets` (public)
- `layout_url` — kop surat (JPEG, A5/A4)
- `stamp_url` — stempel LUNAS (PNG)
- `signature_url` — TTD + stempel dokter (JPEG)

---

## Scripts

```bash
npm run dev      # Start dev server at localhost:5173
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

Push to `main` → Cloudflare auto-deploys in ~1 minute.
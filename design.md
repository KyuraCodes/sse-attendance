---
name: SSEP FinTech Executive
colors:
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#f1f5f9'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#cbd5e1'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  inverse-surface: '#090d16'
  inverse-on-surface: '#f8fafc'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  surface-tint: '#059669'
  primary: '#059669'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#ffffff'
  inverse-primary: '#34d399'
  secondary: '#0f172a'
  on-secondary: '#ffffff'
  secondary-container: '#1e293b'
  on-secondary-container: '#f8fafc'
  tertiary: '#0284c7'
  on-tertiary: '#ffffff'
  tertiary-container: '#e0f2fe'
  on-tertiary-container: '#0369a1'
  error: '#e11d48'
  on-error: '#ffffff'
  error-container: '#ffe4e6'
  on-error-container: '#9f1239'
  primary-fixed: '#d1fae5'
  primary-fixed-dim: '#a7f3d0'
  on-primary-fixed: '#064e3b'
  on-primary-fixed-variant: '#047857'
  secondary-fixed: '#e2e8f0'
  secondary-fixed-dim: '#cbd5e1'
  on-secondary-fixed: '#0f172a'
  on-secondary-fixed-variant: '#334155'
  tertiary-fixed: '#e0f2fe'
  tertiary-fixed-dim: '#bae6fd'
  on-tertiary-fixed: '#082f49'
  on-tertiary-fixed-variant: '#0369a1'
  background: '#f8fafc'
  on-background: '#0f172a'
  surface-variant: '#f1f5f9'
  status-paid: '#047857'
  status-paid-bg: '#ecfdf5'
  status-paid-border: '#a7f3d0'
  status-unpaid: '#334155'
  status-unpaid-bg: '#f1f5f9'
  status-unpaid-border: '#cbd5e1'
  status-stored: '#b45309'
  status-stored-bg: '#fffbeb'
  status-stored-border: '#fde68a'
  status-partial: '#0369a1'
  status-partial-bg: '#f0f9ff'
  status-partial-border: '#bae6fd'
  status-void: '#be123c'
  status-void-bg: '#fff1f2'
  status-void-border: '#fecdd3'
  text-primary: '#0f172a'
  text-secondary: '#475569'
  text-muted: '#94a3b8'
  success: '#10b981'
  warning: '#f59e0b'
  danger: '#e11d48'
  white: '#ffffff'
typography:
  hero-heading:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  section-heading:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.015em
  card-heading:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  stat-figure:
    fontFamily: Geist Mono
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.04em
  tabular-data:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-xs: 8px
  stack-sm: 16px
  stack-md: 24px
  stack-lg: 32px
  stack-xl: 48px
---

# SSEP Attendance & Payroll - Modern FinTech Design System Specification

Reka bentuk sistem ini direka khusus untuk menaik taraf tapak web **Sepakat Silaturrahim Enterprise (SSEP)** menjadi platform pengurusan kehadiran dan penggajian harian bertaraf perusahaan (*Enterprise FinTech*). Dokumen ini serasi sepenuhnya dengan **Google Stitch** (melalui struktur YAML frontmatter) dan rangka kerja **Next.js 15 + Tailwind CSS v4**.

---

## 1. Brand & Personality

### 1.1 Identiti Visual & Falsafah
Sistem ini direka untuk memancarkan imej **Kewibawaan Kewangan, Ketepatan Operasi, dan Kebolehpercayaan**. Memandangkan sistem ini mengendalikan rekod tunai pekerja harian, liabiliti syarikat, dan pengeluaran gaji oleh pihak eksekutif (CEO & Pengurus), antaramukanya mesti menggabungkan ketelitian perisian perbankan moden dengan kemudahan penggunaan lapangan.

* **Aesthetic Tone:** *Executive Modern FinTech* (bersih, berstruktur, kontras jitu, sifar kekusutan visual).
* **Prinsip Utama:**
  1. **Data Accuracy First:** Angka kewangan (RM), jam bekerja, dan baki tertunggak mestilah menonjol, mudah disemak, dan tersusun rapi menggunakan nombor tabular monospaced.
  2. **Zero Muddy Shadows:** Mengelakkan bayang gelap yang kotor. Mengutamakan *Tonal Layering*, sempadan halus 1px (`#E2E8F0` / `#1E293B`), dan *micro-glow* lembut pada elemen berinteraksi.
  3. **Balanced Hybrid Ergonomics:** Antaramuka yang luas, padat, dan analitikal untuk skrin desktop pejabat, serta pantas, mesra ibu jari (*thumb-friendly*), dan berbutang sentuh jelas untuk penyelia di tapak projek.

---

## 2. Color System & Dynamic Palettes

### 2.1 Palet Utama (Primary & Financial Accent)
* **Emerald Green (`#059669` / Dark: `#10B981`):** Warna teras identiti SSE. Digunakan untuk tindakan utama (*Call-to-Action*), metrik pembayaran berjaya, status lunas, dan indikator kehadiran aktif.
* **Deep Obsidian Navy (`#090D16`):** Kanvas asas mod gelap untuk pengalaman eksekutif premium tanpa silau.
* **Clean Slate (`#F8FAFC` & `#FFFFFF`):** Kanvas asas mod cerah dengan latar berkualiti tinggi yang selesa di mata.

### 2.2 Token Status Kewangan (Financial Status Tokens)
Status kerja dan pembayaran dikodkan dengan warna semantik yang konsisten di semua jadual, kad ringkasan, dan resit:

| Status Kod | Maksud Operasi | Latar Belakang (Light/Dark) | Warna Teks | Warna Sempadan (Border) |
| :--- | :--- | :--- | :--- | :--- |
| **`PAID`** | Gaji telah dibayar sepenuhnya | `#ECFDF5` / `rgba(6,78,59,0.35)` | `#047857` / `#34D399` | `#A7F3D0` / `#065F46` |
| **`UNPAID`** | Kerja direkodkan, belum dibayar | `#F1F5F9` / `#1E293B` | `#334155` / `#94A3B8` | `#CBD5E1` / `#334155` |
| **`STORED`** | Pekerja memilih simpan gaji | `#FFFBEB` / `rgba(120,53,15,0.35)` | `#B45309` / `#FBBF24` | `#FDE68A` / `#92400E` |
| **`PARTIAL`**| Bayaran sebahagian direkod | `#F0F9FF` / `rgba(12,74,110,0.35)` | `#0369A1` / `#38BDF8` | `#BAE6FD` / `#075985` |
| **`VOID`** | Rekod kehadiran dibatalkan | `#FFF1F2` / `rgba(136,19,55,0.35)` | `#BE123C` / `#FB7185` | `#FECDD3` / `#9F1239` |

---

## 3. Typography & Numerals

Tipografi menggunakan strategi dwi-fon moden:

1. **Plus Jakarta Sans (Tajuk & Metrik Eksekutif):**
   * Memberikan personaliti tegas, berwibawa, dan sofistikated.
   * Digunakan pada: Tajuk halaman, tajuk kad KPI, angka ringkasan eksekutif, dan tajuk modal.
   * *Letter-spacing:* `-0.02em` untuk tajuk besar agar lebih padat dan kemas.

2. **Inter (Teks Antaramuka & Penerangan):**
   * Neutral, amat jelas pada saiz kecil (12px-14px), dan mudah dibaca pada pelbagai jenis skrin mudah alih.
   * Digunakan pada: Label borang, menu navigasi, teks butang, dan perenggan maklumat.

3. **Geist Mono (Data Kewangan Tabular):**
   * Wajib digunakan untuk semua jumlah Ringgit Malaysia (`RM XX.XX`), jam bekerja (`4.50 jam`), kod ID pekerja (`EMP-001`), dan tarikh rekod.
   * Dilengkapi `font-variant-numeric: tabular-nums` supaya nombor sentiasa sejajar tegak dalam lajur jadual kewangan.

---

## 4. Layout Architecture & Responsive Grid

### 4.1 Desktop Architecture (>= 1024px)
* **Sidebar Kiri Tetap (260px):**
   * Latar belakang `#FFFFFF` (mod cerah) atau `#0F172A` (mod gelap) dengan sempadan 1px berterusan.
   * Pengepala jenama mengandungi lencana SSE dengan ikon `Building` dan sub-label syarikat.
   * Pautan navigasi dengan ruang sentuh 40px, ikon Phosphor, dan *active state* bergaris hijau halus.
   * Kad profil terapung di bahagian bawah memaparkan avatar, nama, tag peranan (`CEO`, `ADMIN`, `MANAGER`), serta butang *Log Keluar*.
* **Top Header Melekat (Sticky 64px):**
   * Efek kaca *glassmorphism* lembut: `backdrop-blur-md bg-white/85 dark:bg-slate-900/85`.
   * Breadcrumb laluan semasa dan paparan tarikh rasmi Malaysia (*cth: Jumaat, 16 Oktober 2026*).
   * Suis tukar tema (Dark/Light mode) dengan animasi ikon matahari/bulan yang lancar.
* **Kawasan Kandungan Utama (`max-w-7xl`):**
   * Lebar maksimum 1280px berpusat.
   * Grid 12-kolum responsif dengan jurang standard `gap-4` hingga `gap-6`.

### 4.2 Mobile & Field Supervisor Experience (< 1024px)
* **Mobile Quick Action Bar (Bawah Skrin):**
   * Ditetapkan pada `bottom-0 z-30` dengan sokongan *safe-area-inset* telefon pintar.
   * Memaparkan 4 butang akses pantas zon ibu jari:
     1. **Dashboard** (Ringkasan hari ini)
     2. **+ Kehadiran** (Kemasukan cepat kerja tapak projek)
     3. **Bayar Gaji** (Pelunasan segera gaji pekerja)
     4. **Pekerja / Laporan**
   * Ketinggian butang minimum 44px-48px untuk memudahkan sentuhan pantas semasa memakai sarung tangan kerja atau di lapangan.
* **Bottom Sheet Modals:**
   * Dialog modal pada peranti mudah alih dibuka dari bahagian bawah skrin (*Bottom Sheet*) dengan pemegang leret (*drag indicator*), memudahkan pengisian borang dengan satu tangan.

---

## 5. Elevation, Borders & Glassmorphism

Untuk mengekalkan gaya perisian moden bertaraf dunia, kedalaman visual dicapai tanpa menggunakan bayang tebal:

1. **Permukaan Kad Bertingkat (Surface Layering):**
   * *Layer 0 (Canvas):* `#F8FAFC` (Light) / `#090D16` (Dark)
   * *Layer 1 (Cards & Tables):* `#FFFFFF` (Light) / `#0F172A` (Dark)
   * *Layer 2 (Modals & Popovers):* `#FFFFFF` (Light) / `#1E293B` (Dark)
2. **Definisi Garisan (Borders):**
   * Kad dan panel dibatasi garisan nipis berketepatan tinggi: `border border-slate-200/80 dark:border-slate-800/80`.
3. **Ambient Glow (Micro-Highlight):**
   * Butang utama Emerald dan kad aktif mempunyai bayangan cahaya lembut (`box-shadow: 0 1px 3px rgba(5, 150, 105, 0.2)`).

---

## 6. Shapes & Corner Roundness

* **Buttons & Inputs:** `rounded-lg` (8px / `0.5rem`) - memberikan rasa kemas, taktikal, dan moden.
* **Cards & Containers:** `rounded-xl` (12px / `0.75rem`) hingga `rounded-2xl` (16px / `1rem`) untuk membezakan modul utama.
* **Status Badges & Avatar:** `rounded-full` (9999px) - bentuk pil bulat penuh untuk tanda pengenalan status visual yang mesra.

---

## 7. Component Design Specifications

### 7.1 Executive Metric Cards (KPI Cards)
* **Susun Atur:** Grid 4 kad di bahagian atas Dashboard:
  1. **Pekerja Aktif** (Ikon `Users`, warna aksen Blue-600)
  2. **Bekerja Hari Ini** (Ikon `CalendarCheck`, warna aksen Emerald-600 dengan indikator denyut *Live*)
  3. **Gaji Hari Ini (RM)** (Ikon `Money`, warna aksen Indigo-600)
  4. **Liabiliti Tertunggak (RM)** (Ikon `Wallet`, warna aksen Amber-600)
* **Kandungan Kad:**
  * Pengepala kecil dengan tajuk & ikon latar belakang lembut (`p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50`).
  * Angka metrik bersaiz 28px-32px menggunakan fon Geist Mono tebal.
  * Keterangan trend atau sub-label di bahagian bawah dengan teks `text-xs text-slate-500`.

### 7.2 Modal Rekod Kehadiran, Kerja Harian & Sistem OT (Field Attendance & Overtime Modal)
* **Pilihan Kadar Fleksibel:**
  * Sokongan 4 jenis kadar: Sejam (`HOURLY`), Harian (`DAILY`), Mingguan (`WEEKLY`), Bulanan (`MONTHLY`).
  * Apabila pekerja kadar sejam dipilih, kotak input jam bekerja (`hours_worked`) muncul serta-merta dengan kalkulator automatik (`Jam x Kadar = Amaun`).
* **Sistem Kerja Lebih Masa (Overtime / OT):**
  * Suis togol **"Tambah Kerja Lebih Masa (Overtime / OT)"** dengan panel beraksen Amber (`bg-amber-50/60 dark:bg-amber-950/20`).
  * Pengiraan kadar OT lalai automatik (`1.5x` kadar asas sejam) yang boleh disunting mengikut persetujuan tapak.
  * Pratonton pengiraan langsung: `Gaji Asas + OT = Jumlah Keseluruhan` dalam fon monospaced `tabular-nums`.
  * Lencana visual `+X.Xj OT` berwarna Amber dalam jadual Rekod Kerja dan Laporan.
* **Kemasukan Pantas Pukal (*Bulk Logging*):**
  * Jadual semakan pantas bagi semua pekerja aktif: kotak tanda pilih (*checkbox*), status hadir, jam bekerja, input pantas `OT (jam)`, dan jumlah gaji (termasuk OT) yang dikira secara masa nyata.

### 7.3 Modal Pembayaran Gaji & Pelunasan Penuh (Disbursement Modal)
* **Ciri Khas CEO - "Pelunasan Penuh (Settle in Full)":**
  * Kotak semak beraksen Emerald: `[x] Anggap Lunas Sepenuhnya (Lupuskan baki tertunggak / Tiada baki tergantung)`.
  * Apabila ditanda, sebarang perbezaan jumlah bayaran akan dimasukkan ke dalam `waived_amount` dan status rekod bertukar kepada `PAID` (tiada baki tertunggak berpanjangan).
* **Ringkasan Sebelum Sahkan:**
  * Paparan kad kecil menunjukkan: Baki sedia ada, Amaun hendak dibayar, Baki selepas bayaran (RM 0.00 jika lunas penuh), dan Kaedah bayaran (Tunai / Pindahan Bank).

### 7.4 Jadual Data Kewangan (High-Density Financial Tables)
* **Struktur:**
  * Bar carian pantas pekerja, penapis tarikh mengikut kalendar, dan penapis status (`Semua`, `Tertunggak`, `Lunas`, `Disimpan`).
  * Pengepala jadual berwarna pudar (`bg-slate-50/75 dark:bg-slate-900/75 text-[11px] font-semibold uppercase tracking-wider`).
  * Setiap baris mempunyai ketinggian ergonomik (48px pada desktop, 56px pada skrin sentuh).
  * Lajur amaun kewangan sentiasa diletakkan di sebelah kanan (*right-aligned*) menggunakan fon monospaced.
  * Baris jadual mempunyai kesan hover lembut (`hover:bg-slate-50/60 dark:hover:bg-slate-800/40`).

### 7.5 Modul Eksport Laporan (Excel & CSV)
* **Butang Tindakan Pantas di Halaman Laporan:**
  * Butang hijau lembut: `Eksport Excel (.xlsx)` dengan ikon helaian hamparan.
  * Butang outline slate: `Eksport CSV (.csv)` serasi perisian perakaunan luaran.
* **Format Fail Muat Turun:**
  * Pengepala rasmi SSE, julat tarikh laporan, jumlah keseluruhan pusingan gaji, dan senarai lengkap rekod kerja pekerja.

---

## 8. Micro-Interactions, Feedback & Accessibility

* **Maklum Balas Butang:** Keadaan aktif menggunakan `active:scale-[0.98]` untuk memberikan rasa klik fizikal yang memuaskan.
* **Keadaan Memuatkan (Loading States):**
  * Menggunakan *Skeleton Shimmer* beranimasi halus (`animate-pulse bg-slate-200 dark:bg-slate-800`) berbanding skrin kosong.
  * Ikon putaran `CircleNotch` semasa transaksi pembayaran sedang diproses.
* **Kontras Aksesibiliti:** Mematuhi standard WCAG 2.1 AA dengan nisbah kontras minimum 4.5:1 bagi semua teks biasa dan 3:1 bagi teks besar serta ikon kawalan.

---

## 9. Panduan Penggunaan dalam Google Stitch & Next.js

1. **Untuk Google Stitch:**
   * Fail ini boleh dimuat naik terus ke mana-mana projek Stitch menggunakan fungsi `upload_design_md`.
   * Skrin antaramuka baharu yang dijana oleh Stitch akan secara automatik mengguna pakai warna Emerald FinTech, susun atur grid, dan fon yang dinyatakan dalam frontmatter di atas.

2. **Untuk Pembangunan Kod Frontend (Next.js & Tailwind v4):**
   * Token warna dan pembolehubah CSS di atas disepadukan secara langsung dengan pembolehubah `:root` dan `.dark` dalam `frontend/app/globals.css`.
   * Komponen UI boleh memanfaatkan kelas utiliti yang sedia ada seperti `badge-paid`, `badge-unpaid`, `badge-stored`, `tabular-nums`, dan palet `emerald-600`.

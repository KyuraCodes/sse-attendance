# Product Requirements Document (PRD) - SSEP v3.0
**System Name:** Sistem Pengurusan Kehadiran & Gaji Sepakat Silaturrahim Enterprise (SSEP)
**Company:** Sepakat Silaturrahim Enterprise (SSE)
**Version:** 3.0 (Overtime Engine, Flexible Rates, Settle-in-Full & FinTech Executive UI)
**Architecture:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Supabase PostgreSQL

---

## 1. Ringkasan Eksekutif (Executive Summary)

**SSEP v3.0** ialah platform pengurusan operasi kehadiran harian, kerja lebih masa (*Overtime / OT*), penyimpanan gaji (*Tabung Simpanan Gaji*), dan pelunasan pembayaran gaji pekerja bagi **Sepakat Silaturrahim Enterprise**. Sistem ini direka khusus untuk menggantikan kiraan manual buku log tapak projek dengan sistem kewangan digital bertaraf *Enterprise FinTech* yang tepat, selamat, dan pantas digunakan sama ada di pejabat mahupun di tapak kerja melalui telefon pintar.

### Matlamat Utama v3.0
1. **Kiraan Gaji Fleksibel & Automatik:** Menyokong 4 jenis kadar gaji pekerja (`HOURLY`, `DAILY`, `WEEKLY`, `MONTHLY`) dengan kiraan prorata dan jam bekerja secara automatik.
2. **Sistem Kerja Lebih Masa (Overtime / OT) Bersepadu:** Membolehkan penyelia dan pentadbir merekodkan jam OT dan kadar OT sejam (lalai `1.5x` kadar asas sejam, boleh diubah suai) secara individu mahupun pukal (*Bulk Attendance*), lengkap dengan lencana visual `+Xj OT` dan pecahan laporan.
3. **Pelunasan Penuh (*Settle-in-Full / Lunas Penuh*):** Menyelesaikan isu baki sen/ringgit tergantung apabila majikan membayar jumlah genap yang dipersetujui bersama pekerja melalui pelupusan baki automatik (`waived_amount`).
4. **Reka Bentuk Eksekutif FinTech (*Impeccable Design System*):** Menggunakan tipografi `Plus Jakarta Sans`, `Inter`, dan `Geist Mono` (`tabular-nums`), palet *Emerald Green* & *Deep Obsidian Slate*, serta *Mobile QuickBar* untuk kegunaan satu tangan di lapangan.
5. **Keselamatan Siber Bertaraf Perusahaan (OWASP Top 10):** Dilengkapi pengesahan JWT HMAC-SHA256, kawalan akses berasaskan peranan (RBAC), perlindungan *CSV/Excel Formula Injection*, sanitasi input XSS, had kadar (*Rate Limiting*), dan pengepala keselamatan HTTP penuh.

---

## 2. Peranan Pengguna & Kawalan Akses (RBAC)

Sistem melaksanakan kawalan akses tiga peringkat yang dikuatkuasakan pada peringkat UI dan API pelayan:

| Peranan | Skop Tanggungjawab | Akses Modul |
| :--- | :--- | :--- |
| **CEO** | Pemilik / Eksekutif Utama. Kawalan penuh ke atas operasi, kewangan, akaun pengguna, dan jejak audit keselamatan. | Dashboard, Pekerja, Rekod Kerja & OT, Bayaran Gaji, Laporan Kewangan, Pengurusan Akaun, Peranan, Log Audit, Tetapan |
| **ADMIN** | Pentadbir Kewangan & Operasi. Mengurus pekerja, merekod kehadiran/OT, dan mengeluarkan bayaran gaji. | Dashboard, Pekerja, Rekod Kerja & OT, Bayaran Gaji, Peranan, Tetapan |
| **MANAGER** | Penyelia Tapak (*Field Supervisor*). Merekod kehadiran harian/pukal dan menyemak laporan kehadiran tanpa akses pengeluaran wang atau pengurusan akaun. | Dashboard, Pekerja (Lihat), Rekod Kerja & OT, Laporan Kewangan, Peranan |

---

## 3. Spesifikasi Modul Teras (Core Functional Modules)

### 3.1 Pengurusan Pekerja & Jenis Kadar Gaji (`Employees`)
* **Kod Pekerja Automatik:** Dijana secara berurutan (`EMP-001`, `EMP-002`, dst.).
* **4 Jenis Kadar Gaji (`rate_type`):**
  * **Sejam (`HOURLY`):** Gaji dikira mengikut `Jam Bekerja x Kadar Sejam`.
  * **Harian (`DAILY`):** Kadar tetap bagi satu syif kerja harian (standard 8 jam).
  * **Mingguan (`WEEKLY`):** Kadar mingguan dengan cadangan prorata harian (`Kadar Mingguan / 6 hari`).
  * **Bulanan (`MONTHLY`):** Kadar bulanan dengan cadangan prorata harian (`Kadar Bulanan / 26 hari`).
* **Status Pekerja:** `ACTIVE` (Aktif bekerja) atau `INACTIVE` (Tidak aktif / berhenti).

### 3.2 Rekod Kerja Harian, Pukal & Sistem Overtime (`Work Records & OT`)
* **Kemasukan Individu (`DailyRecordModal`):**
  * Memilih pekerja aktif, tarikh kerja, jam bekerja (bagi pekerja `HOURLY`), status permulaan (`UNPAID` atau `STORED`), dan catatan.
  * **Panel Overtime (OT):**
    * Suis togol **"Tambah Kerja Lebih Masa (Overtime / OT)"**.
    * **Kadar Asas Sejam:** Dikira secara automatik mengikut jenis kadar pekerja:
      * `HOURLY`: `dailyRate`
      * `DAILY`: `dailyRate / 8`
      * `WEEKLY`: `(dailyRate / 6) / 8`
      * `MONTHLY`: `(dailyRate / 26) / 8`
    * **Kadar OT Sejam Lalai:** `Kadar Asas Sejam x 1.5` (dibundarkan kepada 2 titik perpuluhan) dan boleh diubah suai secara manual oleh pengguna.
    * **Pratonton Langsung:** Memaparkan `Gaji Asas + OT = Jumlah Keseluruhan (RM)` secara masa nyata.
* **Kemasukan Pukal (`BulkRecordModal`):**
  * Membolehkan pemilihan ramai pekerja serentak pada satu tarikh.
  * Setiap baris pekerja yang ditanda mempunyai kotak input pantas `OT (jam)` (langkah `0.5` jam) dan `Jam` (untuk pekerja `HOURLY`).
  * Bar bawah modal memaparkan jumlah pekerja dipilih, jumlah kos OT terkumpul, dan jumlah keseluruhan gaji hari tersebut.
* **Penyimpanan Tanpa Gangguan Skema (*Zero-Migration OT Persistence*):**
  * Jumlah `amount` dalam jadual `work_records` menyimpan `Gaji Asas + Amaun OT` supaya semua pengiraan baki tertunggak dan peruntukan bayaran FIFO mengambil kira kos OT secara automatik.
  * Butiran terperinci OT disimpan secara berstruktur di dalam medan `notes` dengan format `[OT: X.X jam @ RM Y.YY/jam = RM Z.ZZ]` dan dihuraikan secara automatik oleh `otUtils.ts` untuk dipaparkan sebagai lencana `+X.Xj OT` berwarna Amber.

### 3.3 Sistem Tabung Simpanan Gaji (`STORED`)
* Pekerja boleh meminta majikan menyimpan gaji harian mereka (`status = STORED`).
* Gaji berstatus `STORED` dijejak secara berasingan pada Dashboard (*Stored Salary Alert*) dan Laporan Baki Tertunggak supaya pihak pengurusan tahu jumlah wang tabung pekerja yang dipegang oleh syarikat.

### 3.4 Pengurusan Pembayaran FIFO & Lunas Penuh (`Payments`)
* **Peruntukan FIFO Automatik:** Setiap bayaran (`PAY-001`, dst.) diagihkan secara automatik kepada rekod kerja tertunggak (`UNPAID`, `STORED`, `PARTIALLY_PAID`) mengikut urutan tarikh kerja paling lama dahulu (*First-In, First-Out*).
* **Pilihan Lunas Penuh (`settleInFull`):**
  * Kotak semak **"Anggap Lunas (Lupuskan baki tertunggak / Tiada baki hutang)"** ditanda secara lalai.
  * Apabila aktif, sebarang baki perbezaan antara jumlah rekod kerja dan jumlah bayaran direkodkan ke dalam `waived_amount` dan kesemua rekod terlibat ditandakan `PAID` serta-merta, menjadikan baki hutang pekerja `RM 0.00`.
  * Jika dinyaktifkan, bayaran separa akan menandakan rekod sebagai `PARTIALLY_PAID` dan mengekalkan baki tertunggak sebenar.
* **Resit Rasmi & Cetakan PDF (`PaymentReceiptModal`):**
  * Menjana resit pembayaran rasmi lengkap dengan lencana `LUNAS PENUH`, jadual rekod kerja yang diselesaikan, ruang tandatangan majikan/pekerja, serta fungsi muat turun PDF dan cetakan terus.

### 3.5 Laporan Kewangan & Eksport Multi-Format (`Reports`)
* **3 Jenis Laporan Eksekutif:**
  1. **Penyata Bulanan (`Monthly Statement`):** Ringkasan jumlah rekod kerja, gaji kasar (termasuk jumlah OT), jumlah telah dibayar, baki tertunggak, bar peratusan penyelesaian, dan jadual terperinci.
  2. **Baki Tertunggak (`Outstanding Balances`):** Senarai pekerja yang mempunyai baki gaji belum selesai atau gaji disimpan (`Tabung`), lengkap dengan butang tindakan pantas `Pay`.
  3. **Daftar Harian (`Daily Register`):** Senarai kehadiran pekerja, kadar gaji, jam OT, amaun OT, dan jumlah gaji pada tarikh pilihan.
* **3 Format Eksport:**
  * **Excel (`.xlsx`):** Menggunakan pustaka `xlsx` dengan lebar lajur automatik, lajur `Jam OT` & `Amaun OT (RM)`, dan baris ringkasan `JUMLAH`.
  * **CSV (`.csv`):** Dilengkapi *UTF-8 BOM* (`\uFEFF`) untuk keserasian penuh Microsoft Excel serta sanitasi sel anti-injeksi formula.
  * **PDF (`.pdf`):** Dokumen A4 rasmi berjenama Sepakat Silaturrahim Enterprise menggunakan `jsPDF`.

---

## 4. Sistem Reka Bentuk (SSEP FinTech Executive Design System)

Reka bentuk antaramuka mematuhi spesifikasi [design.md](file:///d:/Files%20Ammar/coding/website/Attendance/design.md) dan prinsip kraf `impeccable`:

1. **Hierarki Tipografi Tiga Lapisan:**
   * **Tajuk & Metrik Utama:** `Plus Jakarta Sans` (`--font-jakarta`, ketebalan 600-700, `letter-spacing: -0.02em`).
   * **Antaramuka & Borang:** `Inter` (`--font-inter`, kejelasan tinggi pada saiz 12px-14px).
   * **Angka Kewangan, Jam, Kod & Tarikh:** `Geist Mono` (`--font-geist-mono`) dengan `font-variant-numeric: tabular-nums` supaya semua nilai `RM`, jam bekerja, dan jam OT sejajar secara menegak.
2. **Palet Warna Semantik:**
   * **Aksen Utama:** *Emerald Green* (`#059669` Light / `#10B981` Dark).
   * **Kanvas & Permukaan:** *Clean Slate* (`#F8FAFC` / `#FFFFFF`) pada mod cerah dan *Deep Obsidian Slate* (`#09090B` / `#0F172A`) pada mod gelap.
   * **Aksen Overtime (OT) & Simpanan:** *Amber* (`#D97706` / `#F59E0B`).
   * **Aksen Liabiliti & Bahaya:** *Rose* (`#E11D48`).
3. **Ergonomik Hibrid (Pejabat & Tapak Projek):**
   * **Desktop (`>= 1024px`):** Sidebar tetap `260px` di sebelah kiri, pengepala kaca (*glassmorphic sticky header*) `64px`, dan jadual ketumpatan tinggi.
   * **Mudah Alih (`< 1024px`):** Kad responsif mesra ibu jari dan **Mobile QuickBar** tetap di bahagian bawah skrin untuk navigasi pantas satu tangan.

---

## 5. Seni Bina Keselamatan Siber (Cybersecurity Architecture)

Sistem ini telah diaudit dan diperkukuh mengikut piawaian **OWASP API Security Top 10 (2023)**:

1. **Pengesahan & Pengurusan Sesi (Authentication & JWT):**
   * Kata laluan di-hash menggunakan `bcryptjs`.
   * Token sesi JWT ditandatangani menggunakan algoritma eksplisit `HS256` (`HMAC-SHA256`) melalui pustaka `jose` dan disimpan di dalam kuki `HttpOnly`, `SameSite=Lax`, `Secure` (dalam produksi).
2. **Had Kadar & Perlindungan Brute-Force (Rate Limiting):**
   * Titik akhir `/api/auth/login` dan API sensitif dilindungi oleh pengehad kadar tetingkap gelongsor (*Sliding-Window Rate Limiter*) berasaskan IP berserta pengepala `Retry-After`.
3. **Sanitasi Input & Pencegahan Injeksi (XSS, SQLi & PostgREST):**
   * Semua input teks disanitasi melalui `sanitizeInput` / `sanitizeNullable` (`frontend/lib/security.ts`) yang melucutkan tag HTML/skrip berbahaya dan mengehadkan panjang rentetan.
   * Parameter carian melucutkan operator khas PostgREST (`[,()]`) sebelum dihantar ke pangkalan data.
   * Pengesahan julat angka yang ketat pada semua API: `hoursWorked` (`0.5` - `24`), `otHours` (`0` - `24`), `otRate` (`0` - `10,000`), dan `amount` (`0.01` - `1,000,000`).
4. **Perlindungan Injeksi Formula Spreadsheet (CSV/Excel Formula Injection):**
   * Utiliti eksport (`frontend/lib/exportUtils.ts`) menggunakan `sanitizeSpreadsheetCell()` untuk menambah awalan apostrof (`'`) pada mana-mana nilai teks yang bermula dengan aksara pencetus formula (`=`, `+`, `@`, `\t`, `\r`, atau `-` bukan nombor).
5. **Pelindung Ralat Pelayan (`safeServerError`):**
   * Semua titik akhir API menggunakan `safeServerError()` (`frontend/lib/apiResponse.ts`) yang mencatat ralat teknikal di pelayan tetapi hanya memulangkan mesej selamat dan mesra pengguna kepada klien tanpa mendedahkan struktur jadual Supabase/PostgreSQL.
6. **Pengepala Keselamatan HTTP (`next.config.ts`):**
   * Menguatkuasakan `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, dan `Permissions-Policy`.
7. **Jejak Audit Tidak Boleh Diubah (`audit_logs`):**
   * Setiap tindakan penting (`LOGIN`, `CREATE`, `UPDATE`, `UPDATE_STATUS`, `BULK_CREATE`, `DELETE`) bagi pekerja, rekod kerja, pembayaran, dan akaun pengguna direkodkan bersama ID pelaku, nilai lama, nilai baharu, dan cap masa.

---

## 6. Rujukan Skema Pangkalan Data & Titik Akhir API

### 6.1 Jadual Utama Supabase PostgreSQL
* **`users`**: `id`, `name`, `username`, `email`, `password_hash`, `role` (`CEO` | `ADMIN` | `MANAGER`), `avatar_url`, `created_at`
* **`employees`**: `id`, `employee_code`, `name`, `phone`, `address`, `daily_rate`, `rate_type` (`HOURLY` | `DAILY` | `WEEKLY` | `MONTHLY`), `start_date`, `status`, `notes`, `created_at`, `updated_at`
* **`work_records`**: `id`, `employee_id`, `work_date`, `daily_rate`, `hours_worked`, `waived_amount`, `amount`, `status` (`UNPAID` | `STORED` | `PARTIALLY_PAID` | `PAID` | `VOID`), `notes` (termasuk metadata berstruktur `[OT: ...]`), `created_by`, `created_at`, `updated_at`
* **`payments`**: `id`, `payment_code`, `employee_id`, `payment_date`, `amount`, `payment_method` (`CASH` | `BANK_TRANSFER` | `DUITNOW` | `OTHER`), `reference`, `notes`, `settle_in_full`, `created_by`, `created_at`
* **`payment_items`**: `id`, `payment_id`, `work_record_id`, `amount_applied`
* **`audit_logs`**: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `created_at`

### 6.2 Senarai Titik Akhir API Dalaman (`/api/*`)
* `POST /api/auth/login` - Pengesahan pengguna & penjanaan kuki JWT
* `POST /api/auth/logout` - Pembersihan sesi & kuki JWT
* `GET /api/auth/me` - Pengesahan sesi pengguna semasa
* `GET, POST /api/employees` - Senarai & pendaftaran pekerja baharu
* `GET, PUT, DELETE /api/employees/[id]` - Kemas kini & pemadaman pekerja
* `GET, POST /api/work-records` - Senarai & kemasukan rekod kehadiran harian + kiraan OT
* `POST /api/work-records/bulk` - Kemasukan kehadiran & OT secara pukal
* `PATCH /api/work-records/[id]/status` - Kemas kini status rekod kerja (memelihara metadata OT)
* `GET, POST /api/payments` - Senarai & pengeluaran bayaran gaji FIFO + `settleInFull`
* `GET /api/payments/[id]/receipt` - Data resit pembayaran terperinci
* `GET /api/reports/monthly` - Laporan kewangan bulanan + ringkasan OT
* `GET /api/reports/daily` - Daftar kehadiran & gaji harian + ringkasan OT
* `GET /api/reports/outstanding` - Laporan baki gaji belum bayar & tabung simpanan
* `GET /api/dashboard/summary` - Ringkasan KPI eksekutif & trend 7 hari
* `GET /api/audit-logs` - Senarai log audit keselamatan (khusus `CEO`)

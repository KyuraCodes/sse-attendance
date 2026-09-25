# Reka Bentuk Spesifikasi: Kadar Gaji Pelbagai, Pengiraan Sejam, Pelunasan Penuh Pembayaran, dan Eksport Laporan (Excel & CSV)

Tarikh: 2026-09-25  
Sistem: Sistem Pengurusan Gaji & Kehadiran Sepakat Silaturrahim Enterprise (SSE)  
Cabang Kerja: `testing` (Khas untuk ujian, tidak di-push ke `main` sehingga disahkan)

---

## 1. Pengenalan & Matlamat Sistem

Sistem ini dipertingkatkan untuk memenuhi 4 keperluan utama pengurusan operasi SSE:
1. **Eksport Laporan ke Excel (.xlsx) dan CSV (.csv)** bagi memudahkan pengurusan rekod kewangan di luar talian (offline).
2. **Kadar Gaji Fleksibel pada Pekerja**: Sokongan kadar Per Jam (`HOURLY`), Harian (`DAILY`), Mingguan (`WEEKLY`), dan Bulanan (`MONTHLY`).
3. **Pengiraan Automatik Rekod Kerja Per Jam**: Membolehkan kemasukan jam bekerja (contoh: 4 jam @ RM 10.00/jam = RM 40.00).
4. **Pelunasan Penuh Pembayaran (Settle in Full / Waive Balance)**: Pilihan untuk menganggap bayaran sebagai lunas sepenuhnya walaupun jumlah bayaran kurang daripada kadar penuh (tiada baki tertunggak tergantung).

---

## 2. Skema Pangkalan Data Supabase (PostgreSQL)

### 2.1 Perubahan Jadual `employees`
- Tambah lajur `rate_type` VARCHAR(20) NOT NULL DEFAULT 'DAILY'.
  - Nilai sah: `'HOURLY'`, `'DAILY'`, `'WEEKLY'`, `'MONTHLY'`.
- Lajur `daily_rate` NUMERIC(10,2) NOT NULL berfungsi sebagai kadar asas (`rate_amount`).

### 2.2 Perubahan Jadual `work_records`
- Tambah lajur `hours_worked` NUMERIC(5,2) NULLABLE (diisi apabila `rate_type` adalah `HOURLY`).
- Tambah lajur `waived_amount` NUMERIC(10,2) NOT NULL DEFAULT 0.00 (jumlah perbezaan yang dilupuskan semasa pembayaran lunas penuh).

### 2.3 Perubahan Jadual `payments`
- Tambah lajur `settle_in_full` BOOLEAN NOT NULL DEFAULT FALSE (menandakan sama ada bayaran ini melunaskan baki rekod secara penuh).

---

## 3. Logik Pengiraan & Spesifikasi API

### 3.1 Pengurusan Pekerja (`/api/employees`)
- **GET `/api/employees`**:
  - Mengembalikan senarai pekerja dengan medan `rateType` (`HOURLY`, `DAILY`, `WEEKLY`, `MONTHLY`) dan `dailyRate` (kadar bayaran).
- **POST `/api/employees`**:
  - Menerima `rateType` (lalai: `DAILY`) dan `dailyRate` (> 0).
- **PUT `/api/employees/[id]`**:
  - Menerima kemas kini `rateType` dan `dailyRate`.

### 3.2 Rekod Kerja (`/api/work-records`)
- **Pengiraan Amaun Kerja**:
  - **HOURLY**: `amount = hoursWorked * rateAmount`.
  - **DAILY**: `amount = rateAmount`.
  - **WEEKLY**: Lalai prorata `amount = round(rateAmount / 6, 2)`. Pengguna boleh ubahsuai amaun manual jika perlu.
  - **MONTHLY**: Lalai prorata `amount = round(rateAmount / 26, 2)`. Pengguna boleh ubahsuai amaun manual jika perlu.
- **GET `/api/work-records`**:
  - Mengembalikan `hoursWorked`, `waivedAmount`, dan `rateType`.
- **POST `/api/work-records` (Tunggal)**:
  - Menerima `employeeId`, `workDate`, `hoursWorked`, `amount`, `notes`.
- **POST `/api/work-records/bulk` (Pukal)**:
  - Menyokong kemasukan `hoursWorked` bagi pekerja kadar jam dalam senarai pilihan.

### 3.3 Pembayaran & Pengagihan Lunas Penuh (`/api/payments`)
- Menerima parameter `settleInFull` (Boolean, lalai: `true`).
- **Aliran Pelunasan Penuh (`settleInFull === true`)**:
  - Bayaran diagihkan mengikut FIFO kepada rekod kerja tertunggak.
  - Bagi rekod kerja yang menerima agihan (atau sebarang baki yang tidak terbayar):
    - `waived_amount` dikemas kini dengan baki yang tidak dibayar (`rec.unpaid - allocation`).
    - Status rekod kerja ditukar terus kepada `PAID`.
    - Tiada lagi baki tertunggak bagi pekerja tersebut (`totalOutstanding = 0.00`).
- **Aliran Biasa (`settleInFull === false`)**:
  - Agihan separa menetapkan status `PARTIALLY_PAID`, dan baki selebihnya kekal tertunggak.

### 3.4 Laporan Kewangan (`/api/reports/...`)
- Menyesuaikan pengiraan `grossPayroll`, `paidAmount`, dan `outstandingAmount` mengambil kira `waived_amount` dan status `PAID`.

---

## 4. Antaramuka Pengguna (Frontend UI)

### 4.1 Modul Pekerja
- Borang Tambah & Sunting Pekerja:
  - Pilihan radio atau dropdown: Per Jam (`HOURLY`), Harian (`DAILY`), Mingguan (`WEEKLY`), Bulanan (`MONTHLY`).
  - Label dinamik: "Kadar Sejam (RM)", "Kadar Harian (RM)", dll.
  - Jadual pekerja memaparkan unit kadar dengan jelas (cth: `RM 10.00 / jam`, `RM 80.00 / hari`, `RM 500.00 / minggu`, `RM 2,000.00 / bulan`).

### 4.2 Modul Rekod Kerja
- Borang Rekod Harian:
  - Medan "Jam Bekerja" muncul apabila pekerja kadar jam dipilih.
  - Pengiraan langsung jumlah gaji di skrin.
- Borang Rekod Pukal:
  - Lajur jam bekerja untuk pekerja kadar jam.

### 4.3 Modul Pembayaran
- Kotak semak (checkbox) di modal bayaran:
  - "[x] Anggap Lunas (Lupuskan baki tertunggak / Tiada baki hutang)".
  - Aktif secara lalai untuk memudahkan operasi CEO.

### 4.4 Modul Eksport Laporan (Excel & CSV)
- Menyediakan butang muat turun berasingan di setiap tab Laporan:
  - `Eksport Excel (.xlsx)`
  - `Eksport CSV (.csv)`
- Format merangkumi:
  - Pengepala rasmi SSE.
  - Tarikh dan tempoh laporan.
  - Lajur tersusun (Kod Pekerja, Nama, Jenis Kadar, Jam Bekerja, Amaun, Status, Tarikh).
  - Format mata wang RM yang seragam.

---

## 5. Pelan Pengesahan & Ujian

1. Ujian Unit & Integrasi:
   - Ujian pengiraan kadar jam, harian, mingguan, dan bulanan.
   - Ujian pembayaran separa dengan mod lunas penuh (`settleInFull = true`) memastikan baki tertunggak = RM 0.00.
2. Ujian Eksport Fail:
   - Pengesahan fail CSV mengandungi UTF-8 BOM dan dibuka dengan betul di Excel.
   - Pengesahan fail XLSX dimuat turun dan mempunyai susun atur yang tepat.
3. Kawalan Cabang:
   - Dilakukan sepenuhnya di cabang `testing`.
   - Tiada perubahan ditolak (pushed) ke cabang `main` sehingga kelulusan pengguna.

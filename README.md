# ORION Frontend — KSM AIoT UPN "Veteran" Jakarta

Antarmuka web interaktif untuk **Kelompok Studi Mahasiswa (KSM) Artificial Intelligence of Things (AIoT)**, Fakultas Ilmu Komputer, UPN "Veteran" Jakarta.

---

## 🌟 Gambaran Umum
Aplikasi frontend ORION menyajikan dua pengalaman pengguna utama:
1. **Laman Publik & Pendaftaran Calon Anggota:** Portal informasi organisasi, etalase riset & proyek AI/IoT, pengenalan divisi, serta formulir pendaftaran interaktif untuk mahasiswa baru.
2. **Panel CRM Pengurus:** Dashboard terproteksi khusus pengurus organisasi untuk meninjau seleksi berkas, mengelola anggota aktif, memonitor perangkat riset, mencatat arus kas keuangan, dan mengarsipkan surat resmi.

---

## 🧭 Struktur Halaman & Fitur

### 🌐 Laman Publik
- **Beranda (`/index.html`):** Informasi visi, statistik organisasi, struktur kepengurusan, etalase riset AIoT, serta tombol akses masuk pengurus.
- **Pendaftaran (`/pages/registration.html`):** Formulir pendaftaran calon anggota baru dengan validasi data diri, pilihan fokus riset, dan unggah portofolio.

### 🔒 Panel CRM Khusus Pengurus
- **Seleksi Calon Anggota (`/pages/selection.html`):** Panel peninjauan berkas pendaftaran calon anggota, verifikasi motivasi & komitmen, serta persetujuan penerbitan Member ID.
- **Manajemen Anggota & Alumni (`/pages/members.html`):** Basis data anggota aktif terdaftar lintas divisi lengkap dengan pencarian, filter, dan rekam jejak karir alumni.
- **Inventaris Lab IoT (`/pages/inventory.html`):** Pencatatan stok perangkat riset (NVIDIA Jetson, Raspberry Pi, Sensor, Alat Lab) dan peminjaman alat.
- **Transparansi Keuangan (`/pages/finance.html`):** Pencatatan arus kas masuk/keluar, iuran anggota, dan transparansi dana hibah riset.
- **Arsip Surat & Dokumen (`/pages/archive.html`):** Penomoran surat resmi universitas dan generator template dokumen LaTeX standar fakultas.

---

## 🛠️ Persiapan & Menjalankan Frontend

### 1. Salin Konfigurasi Lingkungan
Buat file `.env` dari template yang tersedia:
```bash
cp .env.example .env
```
*(Secara default mengarah ke backend API lokal: `http://localhost:8000/orion/api/v1`)*

### 2. Pasang Dependensi
Pastikan Node.js dan pnpm sudah terpasang di komputer Anda:
```bash
pnpm install
```

### 3. Jalankan Server Development
```bash
pnpm run dev
```
Aplikasi akan aktif dan dapat dibuka melalui browser pada alamat [http://localhost:3000](http://localhost:3000).

### 4. Build untuk Production
Untuk membuat bundle siap rilis di server produksi:
```bash
pnpm run build
```
Hasil kompilasi siap saji akan tersimpan pada folder `dist/`.

## 📚 Spesifikasi Kebutuhan

Dokumen SKPL/SRS yang dihasilkan dari implementasi backend dan frontend tersedia di [orion-backend/docs/SKPL.md](../orion-backend/docs/SKPL.md).

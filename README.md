# SIGAP-TI — Sistem Catatan Gangguan TI (INA Digital Design System)

Aplikasi web pencatatan dan pemantauan gangguan layanan Teknologi Informasi (TI) yang dibangun menggunakan:
- **Backend**: Node.js & Express (`backend/`)
- **Database**: PostgreSQL (`postgres:16-alpine` dengan volume persisten & fallback otomatis `PGlite` untuk pengembangan lokal tanpa daemon PostgreSQL)
- **Frontend**: React 18, Tailwind CSS v4, dan pustaka resmi **INA Digital Design System (`@idds/react` & `@idds/styles`)** (https://design.inadigital.go.id/)
- **Kontainerisasi**: Docker & Docker Compose (`docker-compose.yml`)
- **Keamanan**: Autentikasi berbasis JWT (Login, Registrasi, dan Proteksi Endpoint CRUD)

---

## Fitur Utama yang Tersedia

1. **20 Data Contoh Siap Pakai (Daftar & Detail)**
   - Saat pertama kali dijalankan, database otomatis terisi dengan **20 catatan gangguan TI realistis** (`INC-2026-001` s.d. `INC-2026-020`).
   - Pengguna dapat melihat daftar lengkap beserta statistik ringkasan, mencari, memfilter berdasarkan **Kategori**, **Status**, **Prioritas**, serta melihat **Detail Satu Data** secara lengkap.

2. **Tambah, Ubah, dan Hapus (CRUD Persisten)**
   - Setiap aksi bekerja secara presisi pada ID data yang dipilih.
   - Menampilkan **Modal Konfirmasi Penghapusan** sebelum data dihapus permanen.
   - Seluruh perubahan tersimpan di volume persisten PostgreSQL sehingga tetap ada meskipun halaman dimuat ulang (*reload*) atau kontainer/aplikasi dijalankan ulang (*restart*).

3. **Validasi Backend Menyeluruh**
   - **Isian Wajib**: Memeriksa `kode_gangguan`, `judul`, `deskripsi`, `kategori`, `status`, `prioritas`, `tanggal_kejadian`, `durasi_downtime`, `jumlah_pengguna_terdampak`, `biaya_pemulihan`, `sistem_terdampak`, `pelapor`, dan `penanggung_jawab`.
   - **Kode Unik**: Menolak `kode_gangguan` yang sudah terdaftar di database.
   - **Tanggal Valid**: Memastikan tanggal merupakan tanggal kalender yang sah (menolak tanggal mustahil seperti `2026-02-30`).
   - **Nilai Angka Nol atau Lebih (`>= 0`)**: Memastikan `durasi_downtime`, `jumlah_pengguna_terdampak`, dan `biaya_pemulihan` bernilai `0` atau lebih (menolak angka negatif atau teks).
   - **Kategori & Status Sesuai Pilihan**: Hanya menerima nilai yang termasuk dalam daftar pilihan resmi.
   - **Pesan Kesalahan Formulir**: Setiap kesalahan dikembalikan dalam format terstruktur per kolom dan langsung ditampilkan pada masing-masing komponen input `@idds/react` (`status="error"`, `statusMessage`) serta ringkasan `<Alert variant="critical" />`.

4. **Antarmuka INA Digital Design System (IDDS) & Responsivitas**
   - Menggunakan komponen resmi `@idds/react`: `Button`, `TextField`, `PasswordInput`, `TextArea`, `SelectDropdown`, `Badge`, `Alert`, `Modal`, `Pagination`, `Avatar`, `Divider`, `Spinner`, `Skeleton`, `ToastProvider` (`useToast`), dan `ConfirmationProvider`.
   - Nyaman digunakan di layar komputer (Mode Tabel & Kartu) maupun layar ponsel (otomatis beralih ke Mode Kartu Responsif).

5. **Umpan Balik & Aksesibilitas**
   - Menampilkan keadaan **Sedang Memuat** (`Spinner` & `Skeleton`), **Berhasil** (`Alert` & `Toast`), **Gagal** (`Alert` & pesan kesalahan input), dan **Data Kosong** (*Empty State* dengan tombol aksi cepat).
   - Setiap input memiliki label yang jelas dan seluruh tombol dapat dioperasikan menggunakan *keyboard* (`Tab`, `Enter`, `Space`, `Escape`).

---

## Akun Demo Autentikasi

Anda dapat langsung mengeklik tombol **Isi Cepat** di halaman Login atau memasukkan kredensial berikut:

| Peran | Username / Email | Kata Sandi |
| :--- | :--- | :--- |
| **Admin Utama TI** | `admin` atau `admin@inadigital.go.id` | `Admin123!` |
| **Teknisi NOC** | `teknisi` atau `teknisi@inadigital.go.id` | `Teknisi123!` |

---

## Cara Menjalankan dengan Docker Compose (Direkomendasikan)

```bash
docker compose up --build -d
```

Setelah seluruh kontainer berjalan:
- **Frontend (React + IDDS)**: http://localhost:3000
- **Backend API (Node.js)**: http://localhost:5000/api/health
- **Database PostgreSQL**: `localhost:5432` (Database: `gangguan_ti_db`)

---

## Cara Menjalankan Secara Lokal (Tanpa Docker)

1. **Jalankan Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   *(Catatan: Jika server PostgreSQL lokal pada port 5432 tidak aktif, backend secara otomatis menggunakan mesin PostgreSQL persisten `PGlite` yang menyimpan data di `backend/pgdata` sehingga seluruh fitur SQL PostgreSQL dan persistensi data tetap berjalan 100%).*

2. **Jalankan Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Buka http://localhost:5173 di peramban Anda.

# percobaaan
# percobaaan

# Masjid Digital — GitHub Pages + Supabase

Website statis untuk menampilkan:
- Waktu shalat otomatis.
- Program/kegiatan masjid dan detail saat diklik.
- Transparansi kas: pemasukan, pengeluaran, dan saldo.
- Pengumuman.
- Profil/alamat/kontak masjid.
- Dashboard admin untuk mengelola program, kas, pengumuman, dan profil.

## Arsitektur

Frontend: HTML + CSS + JavaScript → GitHub Pages  
Database/Auth: Supabase PostgreSQL + Supabase Auth  
Jadwal shalat: API Aladhan

GitHub Pages hanya menyajikan file frontend. Database tidak ditaruh di GitHub. Supabase menyediakan database dan Data API yang dipanggil oleh `supabase-js`.

## 1. Buat database

1. Buat project di Supabase.
2. Buka SQL Editor.
3. Salin seluruh isi `supabase/schema.sql`.
4. Jalankan SQL.
5. Buka Authentication → Users → buat akun pengurus/admin dengan email dan password.

## 2. Konfigurasi website

Buka `config.js` lalu ubah:

```js
SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
SUPABASE_PUBLISHABLE_KEY: "YOUR_SUPABASE_PUBLISHABLE_KEY",
```

Gunakan publishable/anon key, bukan `service_role`.

Atur juga koordinat masjid:

```js
mosque: {
  name: "Nama Masjid",
  city: "Kota",
  country: "Indonesia",
  latitude: -7.1543,
  longitude: 113.4746,
  timezone: "Asia/Jakarta",
  calculationMethod: 20
}
```

`calculationMethod: 20` digunakan sebagai metode Kementerian Agama pada konfigurasi Aladhan. Jika pengurus memiliki jadwal resmi yang berbeda, koordinat/metode/tuning dapat disesuaikan.

## 3. Upload ke GitHub

Buat repository baru, misalnya `website-masjid`.

Upload:
- `index.html`
- `admin.html`
- `app.js`
- `admin.js`
- `styles.css`
- `config.js`
- folder `supabase/`
- `README.md`

Commit ke branch utama.

## 4. Aktifkan GitHub Pages

Di repository:
Settings → Pages → Build and deployment → Source: Deploy from a branch → pilih branch utama dan folder `/ (root)` → Save.

Setelah deployment selesai, website dapat dibuka dari URL GitHub Pages.

## 5. Keamanan

Jangan pernah memasukkan:
- Supabase `service_role` key.
- password admin.
- secret key API.

`config.js` boleh berisi publishable/anon key karena keamanan data dilakukan dengan Row Level Security (RLS). Policy di `schema.sql` membuat data publik yang dipublikasikan dapat dibaca, sedangkan perubahan data membutuhkan user yang sudah login.

Untuk produksi, sebaiknya batasi hak admin lebih lanjut menggunakan tabel role/profiles. Starter ini menganggap setiap akun Supabase yang authenticated sebagai pengurus.

## Struktur

```text
masjid-digital/
├── index.html
├── admin.html
├── app.js
├── admin.js
├── config.js
├── styles.css
├── README.md
└── supabase/
    └── schema.sql
```

## Kustomisasi berikutnya

Situs ini sengaja dibuat tanpa framework agar mudah di-host di GitHub Pages. Fitur lanjutan dapat ditambahkan tanpa mengganti arsitektur:
- kalender agenda;
- jadwal imam/khatib;
- donasi dan QRIS;
- laporan kas per bulan;
- grafik pemasukan/pengeluaran;
- galeri kegiatan;
- struktur kepengurusan;
- layanan wakaf/zakat;
- formulir pendaftaran kegiatan;
- notifikasi WhatsApp.

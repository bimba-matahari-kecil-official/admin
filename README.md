# Bimba Mahatari Kecil

Aplikasi monitoring Bimba: dashboard admin, pengajar, dan orang tua; pendaftaran siswa baru; laporan belajar harian dan rapor LPMB; absensi berfoto + geotagging; administrasi pembayaran; slip gaji pengajar; serta pengingat biaya les lewat WhatsApp Fonnte.

- **Database**: Google Sheets (lewat Google Apps Script)
- **File foto/video**: Google Drive
- **Frontend**: HTML/CSS/JS murni, tanpa build, siap di-hosting di GitHub Pages
- **WhatsApp**: Fonnte (token hanya disimpan di Script Properties Apps Script)

## 1. Struktur proyek

```
backend/
  Code.gs          # setup database, sesi, upload Drive, pengiriman Fonnte
  Api.gs           # semua aksi API per peran (admin, guru, ortu, publik)
  appsscript.json  # manifest Web App (timezone Asia/Jakarta, akses anonim)
frontend/
  index.html
  assets/css/app.css
  assets/img/logo-bimba.png
  assets/js/       # config, api, ui, shared, auth, admin, guru, ortu, app
dev/
  mock-server.js   # server lokal + data contoh untuk uji tanpa Apps Script
docs/              # ruang untuk dokumentasi tambahan
```

## 2. Prasyarat

1. Akun Google (Sheets, Drive, Apps Script).
2. Akun [Fonnte](https://fonnte.com) dan token perangkat WhatsApp.
3. Akun GitHub untuk hosting frontend.
4. Untuk uji lokal: Node.js 18+.

## 3. Menyiapkan backend (Google Apps Script)

1. Buat Google Spreadsheet baru, beri nama misalnya `Database Bimba Mahatari Kecil`.
2. Buka **Extensions → Apps Script** dari spreadsheet tersebut.
3. Buat file `Code.gs` dan `Api.gs` pada editor Apps Script, lalu salin seluruh isi dari folder `backend/` proyek ini.
4. Tampilkan manifest: **Project Settings → centang Show "appsscript.json"**, lalu sesuaikan isinya dengan `backend/appsscript.json`.
5. Simpan, pilih fungsi `setupDatabase`, lalu klik **Run** satu kali. Izinkan akses Sheets, Drive, dan external request saat diminta.
6. Setelah selesai, sheet berikut otomatis dibuat: `Settings, Users, Sessions, Children, Teachers, Packages, Slots, Enrollments, Attendance, DailyReports, LPMB, Bills, Salaries, WALogs`.
7. Login awal admin: **admin / admin123**. Segera ganti kata sandi lewat **Pengaturan → Akun**.

> `setupDatabase()` aman dijalankan ulang: sheet dan header yang hilang akan dilengkapi tanpa menghapus data.

### Deploy Web App

1. Klik **Deploy → New deployment → Web app**.
2. Isi:
   - **Execute as**: `Me` (pemilik script)
   - **Who has access**: `Anyone` / `Siapa saja`
3. Klik **Deploy**, lalu salin URL yang berakhiran `/exec`.
4. Uji dengan membuka URL tersebut di browser; akan tampil JSON status `"API Bimba Mahatari Kecil aktif"`.
5. Setiap kali `Code.gs`/`Api.gs` diubah: **Deploy → Manage deployments → Edit → New version**, agar URL tetap sama.

## 4. Mengatur token Fonnte

1. Masuk aplikasi sebagai admin → **Pengaturan**.
2. Pada bagian WhatsApp, tempel token Fonnte lalu simpan. Token disimpan sebagai Script Property `FONNTE_TOKEN`.
3. Gunakan tombol **Uji koneksi** untuk memastikan pesan terkirim.
4. Jangan menaruh token di `config.js`, repo GitHub, atau file mana pun yang di-commit. Jika token bocor, ganti di dashboard Fonnte lalu simpan ulang.

Pengiriman pengingat biaya les dilakukan dari **Biaya Les → Kirim WA**; setiap pengiriman tercatat di sheet `WALogs`.

## 5. Menyiapkan frontend

1. Buka `frontend/assets/js/config.js`.
2. Ganti `API_URL` dengan URL deployment Apps Script:

   ```js
   API_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```

3. Jangan mengubah `API_URL` di file lain.

### Hosting GitHub Pages

1. Buat repository GitHub baru.
2. Salin **isi** folder `frontend/` (bukan foldernya) ke root repository, sehingga `index.html` berada di root.
3. Commit dan push.
4. Buka **Settings → Pages**, pilih **Source: Deploy from a branch**, branch `main`, folder `/ (root)`, lalu simpan.
5. Tunggu beberapa menit, buka URL `https://username.github.io/nama-repo/`.
6. Aplikasi memakai hash routing (`#/masuk`, `#/admin/...`), jadi tidak perlu konfigurasi rewrite server.

Alternatif: letakkan isi `frontend/` di folder `docs/` lalu pilih folder `/docs` pada pengaturan Pages.

## 6. Uji lokal tanpa Apps Script

1. Jalankan dari root proyek:

   ```
   node dev/mock-server.js
   ```

2. Buka `http://localhost:5180`.
3. `config.js` otomatis memakai `/api` saat hostname `localhost`, sehingga tidak perlu mengubah `API_URL`.
4. Akun demo:
   - Admin: `admin / admin123`
   - Pengajar: `guru1 / guru123`, `guru2 / guru123`
   - Orang tua: `ortu1 / ortu123`, `ortu2 / ortu123`
5. Data mock hanya tersimpan di memori; restart server akan mengembalikan data awal.

## 7. Alur pendaftaran siswa baru

1. Buka **Daftar siswa baru** dari halaman masuk.
2. **Langkah 1**: buat akun orang tua (nama, username, nomor WhatsApp, sandi).
3. **Langkah 2**: isi data anak.
4. **Langkah 3**: pilih paket belajar.
5. **Langkah 4**: pilih jadwal. Jadwal yang sudah diambil siswa lain ditandai **Sudah diambil** dan tidak dapat dipilih.
6. Setelah mendaftar, akun langsung masuk ke dashboard orang tua. Admin dapat menyesuaikan pengajar/paket/jadwal dari panel admin.

## 8. Pengaturan awal yang disarankan (admin)

1. **Pengaturan → Data Bimba**: nama, tagline, alamat, kontak, rekening, tahun ajaran, dan logo.
2. **Pengaturan → Lokasi**: koordinat Bimba dan radius geotagging (meter). Dipakai saat pengajar mengambil absensi.
3. **Pengaturan → Tanda tangan**: unggah tanda tangan admin untuk ACC rapor LPMB.
4. **Data pengajar**: buat akun pengajar, tarif per sesi, foto, dan tanda tangan.
5. **Paket & Jadwal**: atur paket serta slot jadwal beserta pengajarnya.
6. **Data anak**: tautkan anak ke paket/jadwal dan pengajar yang benar.
7. **Pengaturan → Akun**: ganti kata sandi admin, tinjau akun pengguna, dan reset kata sandi bila perlu.

## 9. Catatan keamanan

1. Token Fonnte hanya berada di Script Properties Apps Script; jangan pernah menuliskannya di frontend.
2. Sesi login berupa token acak dengan masa berlaku 7 hari, disimpan di sheet `Sessions`.
3. Kata sandi disimpan sebagai hash + salt, bukan teks asli.
4. Endpoint Web App bersifat publik, tetapi setiap aksi memeriksa token dan peran pengguna.
5. Batas unggah: foto 8 MB, video 20 MB, tanda tangan 2 MB.
6. Jika pengajar/orang tua lupa sandi, admin dapat mereset dari **Pengaturan → Akun**.
7. Disarankan memakai spreadsheet khusus Bimba dan tidak membagikan akses edit ke publik.

## 10. Pemecahan masalah singkat

1. **Frontend menampilkan "API belum disetel"** — pastikan `API_URL` di `config.js` sudah diganti dan tidak diawali `PASTE_`.
2. **Login gagal padahal akun ada** — pastikan deployment Web App memakai versi terbaru dan akses `Anyone`.
3. **Foto/video gagal diunggah** — periksa ukuran berkas, izin Drive, dan kuota penyimpanan akun Google.
4. **Pesan WhatsApp gagal** — periksa token, status perangkat di dashboard Fonnte, serta format nomor (08…/62…).
5. **Geotagging tidak akurat** — atur koordinat Bimba dan radius di Pengaturan; pengajar perlu mengizinkan akses lokasi di browser.
6. **Slip gaji/rapor tidak tercetak** — gunakan tombol cetak lalu pilih "Save as PDF" pada dialog cetak browser.

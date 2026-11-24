# Bimba Matahari Kecil

Aplikasi monitoring Bimba: dashboard admin, pengajar, dan orang tua; pendaftaran siswa baru; laporan belajar harian dan rapor LPMB; absensi berfoto + geotagging; administrasi pembayaran; slip gaji pengajar per paket belajar siswa; serta pengingat biaya les lewat WhatsApp Fonnte.

- **Database**: Google Sheets (lewat Google Apps Script)
- **File foto/video**: Google Drive
- **Frontend**: HTML/CSS/JS murni, tanpa build, siap di-hosting di GitHub Pages
- **WhatsApp**: Fonnte (token hanya disimpan di Script Properties Apps Script)

## 1. Struktur proyek

```
package.json       # script dev/start untuk mock server
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

1. Buat Google Spreadsheet baru, beri nama misalnya `Database Bimba Matahari Kecil`.
2. Buka **Extensions → Apps Script** dari spreadsheet tersebut.
3. Buat file `Code.gs` dan `Api.gs` pada editor Apps Script, lalu salin seluruh isi dari folder `backend/` proyek ini.
4. Tampilkan manifest: **Project Settings → centang Show "appsscript.json"**, lalu sesuaikan isinya dengan `backend/appsscript.json`.
5. Simpan, pilih fungsi `setupDatabase`, lalu klik **Run** satu kali. Izinkan akses Sheets, Drive, dan external request saat diminta.
6. Setelah selesai, sheet berikut otomatis dibuat: `Settings, Users, Sessions, Children, Teachers, Packages, Slots, Enrollments, Attendance, DailyReports, LPMB, Bills, Salaries, WALogs`.
7. Login awal admin: **admin / admin123**. Segera ganti kata sandi lewat **Pengaturan → Akun**.

> `setupDatabase()` aman dijalankan ulang: sheet dan header yang hilang akan dilengkapi tanpa menghapus data. Jalankan `setupDatabase()` sekali setelah pembaruan versi, atau biarkan sistem melengkapinya otomatis pada permintaan pertama.

### Deploy Web App

1. Klik **Deploy → New deployment → Web app**.
2. Isi:
   - **Execute as**: `Me` (pemilik script)
   - **Who has access**: `Anyone` / `Siapa saja`
3. Klik **Deploy**, lalu salin URL yang berakhiran `/exec`.
4. Uji dengan membuka URL tersebut di browser; akan tampil JSON status `"API Bimba Matahari Kecil aktif"`.
5. Setiap kali `Code.gs`/`Api.gs` diubah: **Deploy → Manage deployments → Edit → New version**, agar URL tetap sama.

## 4. Mengatur token Fonnte

1. Masuk aplikasi sebagai admin → **Pengaturan**.
2. Pada bagian WhatsApp, tempel token Fonnte lalu simpan. Token disimpan sebagai Script Property `FONNTE_TOKEN`.
3. Gunakan tombol **Uji koneksi** untuk memastikan pesan terkirim.
4. Jangan menaruh token di `config.js`, repo GitHub, atau file mana pun yang di-commit. Jika token bocor, ganti di dashboard Fonnte lalu simpan ulang.

Pengiriman pengingat biaya les dilakukan dari **Biaya Les → Kirim WA**; setiap pengiriman tercatat di sheet `WALogs`. Tanpa mencentang baris, pengingat otomatis hanya dikirim ke tagihan berstatus **belum bayar, dibayar sebagian, atau ditolak** yang tanggal jatuh temponya sudah tiba/lewat. Admin tetap dapat mengirim manual ke tagihan mana pun lewat ikon WA pada baris atau dengan mencentang baris terlebih dahulu.

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
   npm run dev
   ```

   (setara dengan `node dev/mock-server.js`; port bisa diganti lewat `PORT`, mis. `PORT=3000 npm run dev`)

2. Buka `http://localhost:5180`.
3. `config.js` otomatis memakai `/api` saat hostname `localhost`, sehingga tidak perlu mengubah `API_URL`.
4. Akun demo:
   - Admin: `admin / admin123`
   - Pengajar: `guru1 / guru123`, `guru2 / guru123`
   - Orang tua: `ortu1 / ortu123`, `ortu2 / ortu123`
5. Data mock hanya tersimpan di memori; restart server akan mengembalikan data awal.

## 7. Alur pendaftaran siswa baru

1. Buka **Daftar siswa baru** dari halaman masuk.
2. **Langkah 1**: buat akun orang tua (nama, username, nomor WhatsApp, sandi; email dan pekerjaan opsional).
3. **Langkah 2**: isi data anak.
4. **Langkah 3**: pilih paket belajar.
5. **Langkah 4**: pilih **area lokasi**, lalu **nama miss**, lalu centang satu atau beberapa sesi. Jumlah sesi maksimal per pendaftaran diatur admin di **Pengaturan → Data Bimba** (bawaan 3, rentang 1–7); penghitung "Sesi dipilih x/N" dan pesan peringatan mengikuti nilai tersebut, dan server juga menolak jumlah sesi yang melebihi batas. Pengajar yang mengajar di beberapa area muncul pada masing-masing area tersebut.
6. Jadwal yang sudah diambil siswa lain ditandai **Sudah diambil** dan tidak dapat dipilih. Jadwal yang jamnya sudah dipakai pengajar tersebut pada paket lain (mis. sesi **Paket Belajar (Demo)** di hari dan jam yang sama) ditandai **Tidak tersedia** dan juga tidak dapat dipilih. Bila tidak ada jadwal yang dicentang, pesan peringatan tampil inline di panel (bukan popup berulang).
7. Setelah mendaftar, pendaftaran berstatus **Menunggu ACC**. Orang tua belum bisa masuk, dan data anak/jadwal **belum tampil di akun pengajar**. Admin membuka **Pengaturan → Akun pengguna**, lalu menekan **Setujui** (akun aktif, jadwal dikunci, dan tagihan pendaftaran dibuat) atau **Tolak** (data pendaftaran dihapus dan jadwal dibebaskan). Setelah disetujui, orang tua dapat masuk dan anak/jadwalnya muncul di akun pengajar.

## 8. Pengaturan awal yang disarankan (admin)

1. **Pengaturan → Data Bimba**: nama, tagline, alamat, kontak, rekening, tahun ajaran, logo, serta **maks. sesi per pendaftaran** (1–7).
2. **Pengaturan → Lokasi**: koordinat Bimba dan radius geotagging (meter). Dipakai saat pengajar mengambil absensi.
3. **Pengaturan → Tanda tangan**: unggah tanda tangan admin untuk ACC rapor LPMB.
4. **Data pengajar**: buat akun pengajar, tarif per sesi, foto, dan tanda tangan. Area lokasi boleh lebih dari satu — pisahkan dengan titik koma, contoh `Sukamaju; Cibiru`.
5. **Paket & Jadwal**: atur paket serta slot jadwal beserta pengajarnya. Input jam memakai format 24 jam (dropdown 00:00–23:45), dan sistem menolak jadwal dengan paket + pengajar + hari + jam yang sama persis.
6. **Data anak**: tautkan anak ke paket/jadwal dan pengajar yang benar.
7. **Pengaturan → Akun**: setujui atau tolak pendaftaran orang tua baru (badge **Menunggu ACC**), ganti kata sandi admin, tinjau akun pengguna, dan reset kata sandi bila perlu.
8. **Pengaturan → Penyimpanan Drive**: menampilkan kuota Drive, ukuran folder unggahan, jumlah foto/video/absensi/bukti, dan berkas yatim. Tombol **Hapus berkas yatim** memindahkan ke Trash Drive berkas yang tidak dipakai data mana pun dan lebih tua dari 30 hari; tidak ada data laporan yang terdampak.

## 9. Catatan keamanan

1. Token Fonnte hanya berada di Script Properties Apps Script; jangan pernah menuliskannya di frontend.
2. Sesi login berupa token acak dengan masa berlaku 7 hari, disimpan di sheet `Sessions`.
3. Kata sandi disimpan sebagai hash + salt, bukan teks asli.
4. Endpoint Web App bersifat publik, tetapi setiap aksi memeriksa token dan peran pengguna.
5. Batas unggah: foto 8 MB (dikompres otomatis ke ±1024 px, kualitas 0,7), video 8 MB dan maksimal 1 video per laporan harian, tanda tangan 2 MB.
6. Jika pengajar/orang tua lupa sandi, admin dapat mereset dari **Pengaturan → Akun**.
7. Disarankan memakai spreadsheet khusus Bimba dan tidak membagikan akses edit ke publik.

## 10. Pemecahan masalah singkat

1. **Frontend menampilkan "API belum disetel"** — pastikan `API_URL` di `config.js` sudah diganti dan tidak diawali `PASTE_`.
2. **Login gagal padahal akun ada** — pastikan deployment Web App memakai versi terbaru dan akses `Anyone`.
3. **Foto/video gagal diunggah** — periksa ukuran berkas, izin Drive, dan kuota penyimpanan akun Google.
4. **Pesan WhatsApp gagal** — periksa token, status perangkat di dashboard Fonnte, serta format nomor (08…/62…).
5. **Geotagging tidak akurat** — atur koordinat Bimba dan radius di Pengaturan; pengajar perlu mengizinkan akses lokasi di browser.
6. **Slip gaji/rapor tidak tercetak** — gunakan tombol cetak lalu pilih "Save as PDF" pada dialog cetak browser.

## 11. Catatan perilaku aplikasi

1. **Cache menu tanpa batas waktu**: halaman yang sudah dibuka tampil seketika saat dibuka kembali (tanpa memanggil ulang API). Cache hanya dibersihkan saat ada operasi simpan/hapus/bayar/ACC/ubah pengaturan, atau saat ganti akun/keluar; tombol refresh tetap mengambil data terbaru.
2. **Logout**: keluar dari akun mengarah ke halaman index (`#/beranda`). Bila sesi kedaluwarsa sendiri, pengguna diarahkan ke `#/masuk` untuk login kembali.
3. **Gaji per paket belajar**: honor pengajar dihitung dari harga paket belajar siswa (mis. Rp 450.000 atau Rp 500.000 sesuai paket), bukan dari jumlah sesi. Harga paket masuk slip setelah rapor LPMB anak untuk periode tersebut disetujui admin; pengajar menerima seluruh harga paket. Slip dibayar per anak yang sudah ACC tanpa menunggu anak lain, dan setelah LPMB anak berikutnya disetujui, klik **Generate dari LPMB** lagi untuk membuat slip tambahan. Menandai slip dibayar cukup lewat konfirmasi — tidak perlu melampirkan bukti transfer. Di dashboard pengajar, kartu **Kehadiran bulan ini** menampilkan daftar slip gaji 12 bulan terakhir beserta tombol **Unduh** untuk menyimpan slip sebagai PDF.
4. **Pengajar multi-area**: pengajar bisa mengajar di beberapa area; jadwalnya muncul pada tiap area saat pendaftaran siswa baru.
5. **Validasi jadwal**: jadwal identik (paket, pengajar, hari, jam mulai, jam selesai) ditolak dengan pesan yang jelas; baris kembar lama perlu dihapus manual satu kali.
6. **Video kegiatan diputar langsung**: video disimpan di Google Drive sebagai tautan preview dan diputar di dalam website (pemutar tersemat) untuk semua peran — tanpa mengunduh. Video lama bertautan `export=download` juga otomatis dibuka dengan pemutar yang sama. Foto kegiatan menerima JPG/PNG/WebP.
7. **Absensi & sesi harian hanya hari ini**: halaman **Absensi** menampilkan daftar sesi **hari ini**, **besok**, dan **lusa** sekaligus, tetapi tombol absen hanya aktif pada hari ini — baris besok/lusa nonaktif dengan label "Bisa absen besok/lusa". Setiap baris memiliki tombol pengingat **WhatsApp** ke nomor orang tua berisi nama anak, hari/tanggal, jam, dan paket sesuai jadwal hari tersebut. Kartu **Sesi hari ini** di **Laporan Harian** hanya menampilkan siswa yang terjadwal hari ini. Hari dihitung dengan zona waktu Asia/Jakarta di server. Server menolak absensi bertanggal lain atau di luar hari jadwal.
8. **Absensi & laporan per sesi jam**: bila seorang anak punya beberapa jadwal jam pada hari yang sama (paket, pengajar, dan lokasi sama), absensi **dan laporan harian** dicatat **satu kali per jadwal jam** — bukan sekali per anak per hari. Halaman Absensi dan Laporan Harian menampilkan satu baris/kartu untuk setiap sesi beserta rentang jamnya (mis. Kamis, 12:00–13:00 dan Kamis, 13:00–14:00), tombol **Absen/Perbarui** dan **Isi/Perbarui laporan** berlaku untuk sesi pada baris tersebut, dan modal menyebutkan jam sesinya. Server menyimpan kolom `slotId` pada sheet Attendance dan DailyReports (skema v4); data lama tanpa `slotId` dianggap milik sesi pertama pada hari itu. Jadwal hari ini pada dashboard pengajar dihitung per sesi, sedangkan kartu kehadiran admin tetap dihitung per anak. Rapor LPMB juga mengikuti aturan ini: tabel **Rekap Pembelajaran Harian** pada cetak A4 menampilkan satu baris per sesi dengan kolom **Sesi** (rentang jam) dan status absensi per sesi, serta daftar pilih siswa pengajar menampilkan jam jadwal anak.
9. **Aspek tambahan rapor LPMB**: selain 6 aspek utama (wajib), pengajar dapat menambah maksimal 6 aspek lain (mis. Bahasa Inggris) lewat tombol **Tambah aspek lain**. Nama dan nilai 0–100 divalidasi, aspek tambahan ikut dihitung dalam rata-rata, dan tampil di detail rapor, halaman orang tua, serta cetak rapor A4. Tersimpan di dalam JSON nilai rapor (`__extra`), tanpa perubahan struktur sheet.
10. **Sesi berikutnya di dashboard orang tua**: kartu **Sesi berikutnya** kini menampilkan hari, tanggal, dan jam. Begitu absensi sesi hari itu sudah dicatat pengajar, jadwal otomatis bergeser ke pertemuan minggu berikutnya (mis. Rabu 18 Nov → Rabu 25 Nov), sehingga orang tua tidak melihat sesi yang sudah terlaksana.
11. **Rapor hanya untuk paket selesai**: tombol **Buat rapor** pada menu LPMB pengajar hanya menampilkan anak yang sudah menyelesaikan paket belajarnya (status enrollment `selesai` atau jumlah sesi hadir sudah mencapai `sesiPerBulan` paket). Server juga menolak pembuatan rapor baru untuk anak yang paketnya belum selesai; rapor lama tetap bisa dibuka dan diedit. Setelah rapor disetujui admin, enrollment berstatus `selesai` dan slot jadwal dilepas untuk pendaftaran paket berikutnya.
12. **Hemat penyimpanan Drive**: foto otomatis dikompres ke maksimal 1024 px kualitas 0,7 (termasuk foto kamera absensi), video dibatasi 8 MB dan satu per laporan, serta file foto/video/logo lama otomatis dipindahkan ke Trash Drive saat diganti. Halaman **Pengaturan → Penyimpanan Drive** memindai kuota dan folder unggahan, lalu menyediakan pembersihan berkas yatim (tidak dirujuk data dan lebih tua dari 30 hari).
12. **Pengingat biaya otomatis vs manual**: tombol **Kirim WA terpilih** tanpa mencentang baris hanya mengirim pengingat ke tagihan berstatus **belum bayar, dibayar sebagian, atau ditolak** yang sudah mencapai/melewati tanggal jatuh tempo — tagihan lunas, menunggu verifikasi, atau belum jatuh tempo dilewati. Admin tetap bisa mengirim manual ke tagihan mana pun dengan mencentang baris atau lewat ikon WA di baris tagihan.
13. **ACC rapor menunggu pembayaran lunas**: rapor LPMB hanya dapat disetujui admin setelah seluruh tagihan terkait anak tersebut lunas (termasuk pembayaran yang masih menunggu verifikasi). Baris rapor menampilkan sisa tagihan, tombol ACC nonaktif, dan server menolak persetujuan dengan pesan yang jelas. Setelah pembayaran diverifikasi lunas di **Biaya Les**, ACC dapat dilakukan.
14. **Jadwal Demo mengunci pengajar pada hari dan jam yang sama**: bila orang tua memilih paket **Demo** (nama paket mengandung kata "Demo") pada suatu hari dan jam, semua jadwal paket lain untuk pengajar yang sama di hari dan jam itu ditandai **Tidak tersedia** sebelum sempat dipilih, dan sebaliknya jadwal Demo juga tidak tersedia bila pengajar sudah terisi. Pembatasan berlaku di pendaftaran publik, penambahan paket orang tua, serta pengaturan paket/jadwal oleh admin; server tetap menolak pendaftaran yang bentrok.
15. **Sesi paket = target pertemuan**: jumlah sesi pada paket belajar (mis. 8 sesi) menentukan berapa kali pertemuan yang harus diselesaikan anak. Angka ini tidak membatasi jumlah jadwal mingguan (pendaftaran tetap maksimal 3 sesi). Progres **sesi terlaksana / total sesi** dan **kurang pertemuan** tampil untuk admin (dashboard, Data Anak, detail anak), pengajar (agenda sesi hari ini), dan orang tua (beranda, Paket belajar, Administrasi). Sesi terhitung dari absensi berstatus **hadir**; absensi izin/sakit/alpha tidak mengurangi sisa pertemuan.
16. **Sesi penuh menghentikan jadwal dan absensi**: begitu jumlah sesi hadir mencapai total sesi paket, siswa tidak lagi muncul pada agenda/absensi/laporan pengajar, hitungan "terjadwal" di dashboard admin, maupun kartu **Sesi berikutnya** orang tua. Sesi terakhir pada hari pelaksanaannya tetap bisa dilengkapi absensi dan laporan hari itu; mulai hari berikutnya jadwal berhenti dan server menolak **absensi baru maupun laporan harian baru** untuk anak tersebut, termasuk laporan bertanggal mundur. Laporan lama tetap bisa diedit. Rapor LPMB tetap dapat dibuat sampai paket di-ACC, dan slot jadwal baru dilepas setelah rapor disetujui admin.
17. **Satu paket selesai = satu rapor baru**: rapor LPMB disimpan per paket belajar (enrollment), bukan per periode. Anak yang menyelesaikan beberapa paket memperoleh satu rapor untuk tiap paket, masing-masing dengan nama paketnya sendiri di daftar, detail, cetak, dan halaman orang tua. Dialog **Buat rapor** menampilkan daftar paket selesai yang belum punya rapor, mengedit rapor hanya mengubah paket tersebut, dan paket yang rapornya sudah di-ACC tidak dapat diubah lagi (server menolak dengan pesan konflik). Rapor lama tanpa tautan paket tetap dapat dibuka dan diedit; backend versi skema 6 menambahkan kolom `enrollmentId` pada sheet LPMB secara otomatis.
18. **Satu paket selesai = satu slip gaji**: tombol **Generate dari LPMB** pada menu Gaji membuat satu slip untuk setiap paket belajar yang rapornya sudah di-ACC admin (per enrollment), bukan satu slip gabungan per periode. Slip menampilkan nama anak dan paket beserta sesi terlaksana, serta dapat dicetak dan dibayar sendiri tanpa menunggu paket lain. Generate ulang memperbarui slip paket yang belum dibayar dan melewati slip yang sudah dibayar; kartu **Honor berjalan** pengajar menjumlahkan seluruh slip periode itu. Slip lama tanpa tautan paket tetap tampil dan bisa dibayar; backend versi skema 7 menambahkan kolom `enrollmentId` pada sheet Salaries secara otomatis.
19. **Status jadwal admin mengikuti pengajar**: pada menu **Paket & Jadwal** akun admin, slot yang belum diambil siswa tetap ditampilkan **Terisi** bila pengajar yang sama sudah mengisi hari dan jam tersebut di paket lain (termasuk jam yang bertumpuk), lengkap dengan tooltip paket yang menempati. Hitungan "terisi" dan tombol hapus hanya mengikuti slot yang benar-benar dipakai siswa, sehingga jadwal kosong masih bisa diedit atau dihapus.
20. **Jatuh tempo tagihan 3 hari sebelum akhir sesi paket**: tagihan pendaftaran, tagihan otomatis, dan tagihan manual tanpa tanggal jatuh tempo dihitung otomatis tiga hari sebelum perkiraan pertemuan terakhir paket belajar — mengikuti jadwal mingguan enrollment dan sisa sesi (target sesi paket dikurangi sesi berstatus hadir). Bila seluruh sesi sudah terlaksana atau tanggal hasil perhitungan sudah lewat, jatuh tempo menjadi hari ini. Pengaturan tanggal jatuh tempo bulanan (1–28) tidak lagi dipakai untuk tagihan baru, dan admin tetap dapat mengisi tanggal jatuh tempo manual di form tagihan. Tagihan lama tidak diubah otomatis.
21. **Pendaftaran baru menunggu persetujuan admin**: formulir pendaftaran publik kini membuat akun, data anak, dan jadwal berstatus **pending**. Slot yang dipilih langsung dikunci agar tidak diambil orang lain, tetapi belum tampil di akun pengajar dan tagihan belum dibuat. Orang tua yang mencoba masuk mendapat pesan "menunggu persetujuan admin". Admin menyetujui lewat **Pengaturan → Akun pengguna → Setujui** (akun aktif, jadwal muncul di akun pengajar, tagihan pendaftaran dibuat, dan WA pemberitahuan dikirim) atau **Tolak** (slot dibebaskan dan data pendaftaran dihapus).

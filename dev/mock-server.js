/* Mock API + static server untuk pengujian lokal (bukan bagian produksi). */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 5180);
const ROOT = path.join(__dirname, '..', 'frontend');

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
function daysAgo(n) { const d = new Date(now); d.setDate(d.getDate() - n); return iso(d); }
function monthShift(n, day) { const d = new Date(now.getFullYear(), now.getMonth() + n, day || 1); return iso(d); }
const TODAY = iso(now);
const PERIOD = TODAY.slice(0, 7);
const PREV = monthShift(-1, 15).slice(0, 7);
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const TODAY_NAME = HARI[now.getDay()];

function stamp(n) {
  const d = new Date(now);
  d.setDate(d.getDate() + (n || 0));
  return d.toISOString();
}

function svg(label, bg, fg) {
  const s = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">' +
    '<rect width="100%" height="100%" fill="' + (bg || '#dcefe8') + '"/>' +
    '<circle cx="160" cy="96" r="38" fill="' + (fg || '#0f5a4e') + '" opacity=".18"/>' +
    '<text x="160" y="150" font-family="Arial" font-size="26" fill="' + (fg || '#0f5a4e') + '" text-anchor="middle">' + label + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}
function sig(label) {
  const s = '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="90">' +
    '<rect width="100%" height="100%" fill="#ffffff"/>' +
    '<path d="M14 62 C50 8, 78 82, 110 38 S170 10, 196 54 S232 66, 246 30" stroke="#123c36" stroke-width="3" fill="none"/>' +
    '<text x="128" y="82" font-family="Arial" font-size="9" fill="#777" text-anchor="middle">' + label + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}

const settings = {
  bimbelNama: 'Bimba Mahatari Kecil',
  bimbelTagline: 'Learning and playing.',
  bimbelAlamat: 'Jl. Melati No. 12, Sukamaju, Bandung',
  bimbelPhone: '081234567890',
  bimbelEmail: 'halo@mahatarkecil.id',
  jamOperasional: 'Senin–Sabtu, 08.00–18.00',
  tahunAjaran: '2026/2027',
  rekening: 'BCA 1234567890 a.n. Bimba Mahatari Kecil',
  waAdmin: '081234567890',
  jatuhTempoHari: '10',
  appUrl: 'https://bimba-mahatarkecil.github.io/',
  logoUrl: '/assets/img/logo-bimba.png',
  ttdAdminUrl: sig('Admin Bimba'),
  waToken: 'mock-fonnte-token-123',
  waEnabled: '1'
};

const users = [
  { id: 'USR-ADM', role: 'admin', username: 'admin', nama: 'Mustiono', phone: '081200000001', email: 'admin@mahatarkecil.id', password: 'admin123', status: 'aktif', fotoUrl: svg('M', '#f5a524', '#543400'), ttdUrl: sig('Mustiono'), alamat: 'Jl. Melati No. 12, Bandung', createdAt: stamp(-220), lastLogin: stamp(0) },
  { id: 'USR-G1', role: 'guru', username: 'guru1', nama: 'Rani Puspita', phone: '081200000002', email: 'rani@mahatarkecil.id', password: 'guru123', status: 'aktif', fotoUrl: svg('RP', '#cde8d8', '#0f5a4e'), ttdUrl: sig('Rani'), alamat: 'Jl. Kenanga No. 4, Bandung', createdAt: stamp(-180), lastLogin: stamp(-1) },
  { id: 'USR-G2', role: 'guru', username: 'guru2', nama: 'Dimas Pratama', phone: '081200000003', email: 'dimas@mahatarkecil.id', password: 'guru123', status: 'aktif', fotoUrl: svg('DP', '#d9e5fa', '#284a8a'), ttdUrl: sig('Dimas'), alamat: 'Jl. Anggrek No. 8, Bandung', createdAt: stamp(-150), lastLogin: stamp(-2) },
  { id: 'USR-O1', role: 'ortu', username: 'ortu1', nama: 'Siti Rahmawati', phone: '081200000004', email: 'siti.rahma@mail.com', password: 'ortu123', status: 'aktif', fotoUrl: svg('SR', '#f3e3c8', '#7a4a00'), alamat: 'Jl. Dahlia No. 21, Sukamaju, Bandung', createdAt: stamp(-140), lastLogin: stamp(0) },
  { id: 'USR-O2', role: 'ortu', username: 'ortu2', nama: 'Hendra Wijaya', phone: '081200000005', email: 'hendra@mail.com', password: 'ortu123', status: 'aktif', fotoUrl: svg('HW', '#e6ddf6', '#5a3a8a'), alamat: 'Jl. Cempaka No. 7, Bandung', createdAt: stamp(-120), lastLogin: stamp(-4) }
];

const teachers = [
  { id: 'T1', userId: 'USR-G1', nama: 'Rani Puspita', phone: '081200000002', email: 'rani@mahatarkecil.id', spesialisasi: 'Calistung & Matematika SD', area: 'Sukamaju · Bandung Utara', tarifPerSesi: 75000, fotoUrl: users[1].fotoUrl, ttdUrl: users[1].ttdUrl, status: 'aktif', createdAt: stamp(-180), updatedAt: stamp(-2) },
  { id: 'T2', userId: 'USR-G2', nama: 'Dimas Pratama', phone: '081200000003', email: 'dimas@mahatarkecil.id', spesialisasi: 'Bahasa Inggris & Sains', area: 'Cempaka · Bandung Tengah', tarifPerSesi: 65000, fotoUrl: users[2].fotoUrl, ttdUrl: users[2].ttdUrl, status: 'aktif', createdAt: stamp(-150), updatedAt: stamp(-3) }
];

const children = [
  { id: 'CH1', ortuId: 'USR-O1', nama: 'Aisyah Putri Rahmawati', panggilan: 'Aisyah', gender: 'perempuan', tglLahir: '2018-04-12', sekolah: 'SDN Sukamaju 2', kelas: '2 SD', fotoUrl: svg('Aisyah', '#f6dfc8', '#7a4a00'), catatan: 'Perlu penguatan membaca lancar dan berhitung.', alamatRumah: 'Jl. Dahlia No. 21, Sukamaju, Bandung', rumahLat: '-6.8957', rumahLng: '107.6160', fotoRumahUrl: svg('Rumah Aisyah', '#f3e3c8', '#7a4a00'), status: 'aktif', createdAt: stamp(-130), updatedAt: stamp(-5) },
  { id: 'CH2', ortuId: 'USR-O1', nama: 'Bima Ardi Rahmawati', panggilan: 'Bima', gender: 'laki', tglLahir: '2019-09-03', sekolah: 'SDN Sukamaju 2', kelas: '1 SD', fotoUrl: svg('Bima', '#d9e5fa', '#284a8a'), catatan: 'Mudah bosan, perlu variasi aktivitas.', alamatRumah: 'Jl. Dahlia No. 21, Sukamaju, Bandung', rumahLat: '-6.8957', rumahLng: '107.6160', fotoRumahUrl: svg('Rumah Bima', '#f3e3c8', '#7a4a00'), status: 'aktif', createdAt: stamp(-100), updatedAt: stamp(-6) },
  { id: 'CH3', ortuId: 'USR-O2', nama: 'Nadia Wijaya', panggilan: 'Nadia', gender: 'perempuan', tglLahir: '2017-11-21', sekolah: 'SD Santo Yusuf', kelas: '3 SD', fotoUrl: svg('Nadia', '#e6ddf6', '#5a3a8a'), catatan: '', alamatRumah: 'Jl. Cempaka No. 7, Bandung', rumahLat: '-6.9025', rumahLng: '107.6187', fotoRumahUrl: svg('Rumah Nadia', '#e6ddf6', '#5a3a8a'), status: 'aktif', createdAt: stamp(-90), updatedAt: stamp(-7) }
];

const packages = [
  { id: 'PKG1', nama: 'Reguler Calistung', sesiPerBulan: 8, durasiMenit: 90, harga: 450000, deskripsi: 'Pendampingan membaca, menulis, dan berhitung dua kali seminggu.', aktif: true, createdAt: stamp(-200) },
  { id: 'PKG2', nama: 'Privat Fokus', sesiPerBulan: 4, durasiMenit: 60, harga: 600000, deskripsi: 'Sesi privat intensif sesuai kebutuhan belajar anak.', aktif: true, createdAt: stamp(-190) },
  { id: 'PKG3', nama: 'Intensif Ujian', sesiPerBulan: 12, durasiMenit: 120, harga: 750000, deskripsi: 'Persiapan ulangan dan pendampingan belajar intensif.', aktif: true, createdAt: stamp(-100) }
];

const slots = [
  { id: 'SL1', paketId: 'PKG1', pengajarId: 'T1', hari: 'Senin', jamMulai: '15:00', jamSelesai: '16:30', kuota: 1, status: 'terisi', anakId: 'CH1' },
  { id: 'SL2', paketId: 'PKG1', pengajarId: 'T1', hari: 'Rabu', jamMulai: '15:00', jamSelesai: '16:30', kuota: 1, status: 'terisi', anakId: 'CH2' },
  { id: 'SL3', paketId: 'PKG1', pengajarId: 'T2', hari: 'Selasa', jamMulai: '16:00', jamSelesai: '17:30', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL4', paketId: 'PKG2', pengajarId: 'T2', hari: 'Kamis', jamMulai: '16:00', jamSelesai: '17:00', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL5', paketId: 'PKG2', pengajarId: 'T1', hari: 'Jumat', jamMulai: '15:30', jamSelesai: '16:30', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL6', paketId: 'PKG3', pengajarId: 'T2', hari: 'Sabtu', jamMulai: '09:00', jamSelesai: '11:00', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL7', paketId: 'PKG3', pengajarId: 'T1', hari: 'Senin', jamMulai: '17:00', jamSelesai: '19:00', kuota: 1, status: 'tersedia', anakId: '' }
];

const enrollments = [
  { id: 'EN1', anakId: 'CH1', ortuId: 'USR-O1', paketId: 'PKG1', slotId: 'SL1', slotIds: 'SL1', pengajarId: 'T1', tanggalMulai: monthShift(-3, 1), sesiTerpakai: 2, status: 'aktif', selesaiAt: '', createdAt: stamp(-130) },
  { id: 'EN2', anakId: 'CH2', ortuId: 'USR-O1', paketId: 'PKG1', slotId: 'SL2', slotIds: 'SL2', pengajarId: 'T1', tanggalMulai: monthShift(-2, 1), sesiTerpakai: 1, status: 'aktif', selesaiAt: '', createdAt: stamp(-100) },
  { id: 'EN3', anakId: 'CH3', ortuId: 'USR-O2', paketId: 'PKG2', slotId: 'SL4', slotIds: 'SL4', pengajarId: 'T2', tanggalMulai: monthShift(-1, 1), sesiTerpakai: 1, status: 'aktif', selesaiAt: '', createdAt: stamp(-90) }
];

const attendance = [
  { id: 'ATT1', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: TODAY, status: 'hadir', jam: '15:05', fotoUrl: svg('Absensi Aisyah', '#cde8d8', '#0f5a4e'), catatan: 'Membaca suku kata dan penjumlahan.' },
  { id: 'ATT2', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(3), status: 'hadir', jam: '15:02', fotoUrl: svg('Absensi Aisyah', '#cde8d8', '#0f5a4e'), catatan: 'Latihan menulis tegak bersambung.' },
  { id: 'ATT3', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(7), status: 'izin', jam: '15:00', fotoUrl: '', catatan: 'Izin acara keluarga.' },
  { id: 'ATT4', enrollmentId: 'EN2', anakId: 'CH2', pengajarId: 'T1', tanggal: daysAgo(1), status: 'hadir', jam: '15:10', fotoUrl: svg('Absensi Bima', '#d9e5fa', '#284a8a'), catatan: 'Mengenal huruf dan angka.' },
  { id: 'ATT5', enrollmentId: 'EN2', anakId: 'CH2', pengajarId: 'T1', tanggal: daysAgo(5), status: 'sakit', jam: '15:00', fotoUrl: '', catatan: 'Demam, istirahat di rumah.' },
  { id: 'ATT6', enrollmentId: 'EN3', anakId: 'CH3', pengajarId: 'T2', tanggal: daysAgo(2), status: 'hadir', jam: '16:03', fotoUrl: svg('Absensi Nadia', '#e6ddf6', '#5a3a8a'), catatan: 'Latihan percakapan bahasa Inggris.' },
  { id: 'ATT7', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(28), status: 'hadir', jam: '15:06', fotoUrl: svg('Absensi Aisyah', '#cde8d8', '#0f5a4e'), catatan: 'Evaluasi bulan lalu.' }
];

function nilai(a, b, c, d, e, f) {
  return { membaca: a, menulis: b, berhitung: c, kognitif: d, sikap: e, motorik: f };
}

const reports = [
  { id: 'DR1', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: TODAY, materi: 'Membaca suku kata ba-bi-bu dan penjumlahan 1–10.', capaian: 'Aisyah membaca lebih lancar dan mampu menjumlahkan dengan jari.', catatan: 'Perlu latihan membaca nyaring di rumah 10 menit setiap hari.', fotoUrls: [svg('Kegiatan Aisyah', '#cde8d8', '#0f5a4e'), svg('Latihan menulis', '#f6e7c8', '#7a4a00')], videoUrls: ['https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'], parafUrl: sig('Rani'), createdAt: stamp(0), updatedAt: stamp(0) },
  { id: 'DR2', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(3), materi: 'Menulis tegak bersambung dan mengenal kata benda.', capaian: 'Tulisan semakin rapi, sudah bisa menulis lima kata tanpa bantuan.', catatan: '', fotoUrls: [svg('Menulis', '#f6e7c8', '#7a4a00')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(-3), updatedAt: stamp(-3) },
  { id: 'DR3', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(7), materi: 'Membaca cerita pendek dan menjawab pertanyaan.', capaian: 'Mampu menjawab tiga dari empat pertanyaan dengan benar.', catatan: 'Tambahkan buku cerita bergambar di rumah.', fotoUrls: [svg('Membaca cerita', '#dcefe8', '#0f5a4e')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(-7), updatedAt: stamp(-7) },
  { id: 'DR4', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(28), materi: 'Evaluasi membaca dan berhitung awal.', capaian: 'Kemampuan dasar sudah terbentuk, siap masuk materi lanjutan.', catatan: '', fotoUrls: [svg('Evaluasi', '#e6ddf6', '#5a3a8a')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(-28), updatedAt: stamp(-28) },
  { id: 'DR5', enrollmentId: 'EN2', anakId: 'CH2', pengajarId: 'T1', tanggal: daysAgo(1), materi: 'Mengenal huruf vokal dan berhitung 1–20.', capaian: 'Bima antusias mengikuti permainan angka dan mengenal semua huruf vokal.', catatan: 'Gunakan kartu huruf saat belajar di rumah.', fotoUrls: [svg('Bima belajar', '#d9e5fa', '#284a8a')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(-1), updatedAt: stamp(-1) },
  { id: 'DR6', enrollmentId: 'EN2', anakId: 'CH2', pengajarId: 'T1', tanggal: daysAgo(5), materi: 'Latihan motorik halus dan mewarnai bentuk.', capaian: 'Bima lebih sabar dan rapi saat mewarnai.', catatan: '', fotoUrls: [svg('Mewarnai', '#f6dfc8', '#7a4a00')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(-5), updatedAt: stamp(-5) },
  { id: 'DR7', enrollmentId: 'EN3', anakId: 'CH3', pengajarId: 'T2', tanggal: daysAgo(2), materi: 'Percakapan perkenalan dalam bahasa Inggris.', capaian: 'Nadia mampu memperkenalkan diri dengan percaya diri.', catatan: '', fotoUrls: [svg('Nadia belajar', '#e6ddf6', '#5a3a8a')], videoUrls: [], parafUrl: sig('Dimas'), createdAt: stamp(-2), updatedAt: stamp(-2) }
];

const lpmb = [
  { id: 'LPMB1', anakId: 'CH1', pengajarId: 'T1', periode: PREV, tanggal: monthShift(-1, 28), nilai: nilai(82, 80, 78, 85, 90, 84), catatan: 'Aisyah menunjukkan kemajuan stabil pada kemampuan membaca dan sikap belajar yang baik.', rekomendasi: 'Lanjutkan latihan membaca nyaring dan berhitung setiap hari.', parafGuruUrl: sig('Rani'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-10), approvedBy: 'Mustiono', catatanAdmin: 'Rapor sudah lengkap, disetujui.', createdAt: stamp(-14), updatedAt: stamp(-10) },
  { id: 'LPMB2', anakId: 'CH1', pengajarId: 'T1', periode: PERIOD, tanggal: TODAY, nilai: nilai(86, 84, 82, 88, 92, 87), catatan: 'Perkembangan sangat baik pada kelancaran membaca dan kemandirian belajar.', rekomendasi: 'Berikan bahan bacaan tingkat lanjut dan latihan soal cerita.', parafGuruUrl: sig('Rani'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-1), approvedBy: 'Mustiono', catatanAdmin: 'Disetujui.', createdAt: stamp(-1), updatedAt: stamp(0) },
  { id: 'LPMB3', anakId: 'CH2', pengajarId: 'T1', periode: PERIOD, tanggal: TODAY, nilai: nilai(74, 72, 76, 78, 84, 80), catatan: 'Bima mulai mengenal huruf dengan baik dan lebih fokus saat belajar.', rekomendasi: 'Variasi aktivitas belajar agar tidak cepat bosan.', parafGuruUrl: sig('Rani'), status: 'menunggu_acc', ttdAdminUrl: '', approvedAt: '', approvedBy: '', catatanAdmin: '', createdAt: stamp(-2), updatedAt: stamp(-1) },
  { id: 'LPMB4', anakId: 'CH3', pengajarId: 'T2', periode: PERIOD, tanggal: TODAY, nilai: nilai(88, 85, 84, 89, 90, 86), catatan: 'Nadia percaya diri berbicara bahasa Inggris dan aktif bertanya.', rekomendasi: 'Latihan percakapan singkat setiap hari.', parafGuruUrl: sig('Dimas'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-1), approvedBy: 'Mustiono', catatanAdmin: 'Disetujui.', createdAt: stamp(-1), updatedAt: stamp(-1) }
];

const bills = [
  { id: 'B1', anakId: 'CH1', ortuId: 'USR-O1', paketId: 'PKG1', enrollmentId: 'EN1', periode: PERIOD, jumlah: 450000, dibayar: 150000, jatuhTempo: PERIOD + '-10', status: 'sebagian', tanggalBayar: daysAgo(2), metode: 'transfer', buktiUrl: svg('Cicilan 1', '#e8f0e3', '#2f5c2f'), catatan: '', waSentAt: '', createdAt: stamp(-8), updatedAt: stamp(-2) },
  { id: 'B2', anakId: 'CH2', ortuId: 'USR-O1', paketId: 'PKG1', enrollmentId: 'EN2', periode: PERIOD, jumlah: 450000, dibayar: 0, jatuhTempo: PERIOD + '-10', status: 'menunggu_verifikasi', tanggalBayar: TODAY, metode: 'transfer', buktiUrl: svg('Bukti Transfer', '#e8f0e3', '#2f5c2f'), catatan: 'Transfer BCA a.n. Siti Rahmawati.', waSentAt: '', createdAt: stamp(-8), updatedAt: stamp(0) },
  { id: 'B3', anakId: 'CH1', ortuId: 'USR-O1', paketId: 'PKG1', enrollmentId: 'EN1', periode: PREV, jumlah: 450000, dibayar: 450000, jatuhTempo: PREV + '-10', status: 'lunas', tanggalBayar: PREV + '-09', metode: 'transfer', buktiUrl: svg('Lunas', '#cde8d8', '#0f5a4e'), catatan: '', waSentAt: stamp(-20), createdAt: stamp(-40), updatedAt: stamp(-30) },
  { id: 'B4', anakId: 'CH2', ortuId: 'USR-O1', paketId: 'PKG1', enrollmentId: 'EN2', periode: PREV, jumlah: 450000, dibayar: 450000, jatuhTempo: PREV + '-10', status: 'lunas', tanggalBayar: PREV + '-08', metode: 'transfer', buktiUrl: svg('Lunas', '#cde8d8', '#0f5a4e'), catatan: '', waSentAt: stamp(-20), createdAt: stamp(-40), updatedAt: stamp(-30) },
  { id: 'B5', anakId: 'CH3', ortuId: 'USR-O2', paketId: 'PKG2', enrollmentId: 'EN3', periode: PERIOD, jumlah: 600000, dibayar: 0, jatuhTempo: PERIOD + '-10', status: 'belum', tanggalBayar: '', metode: '', buktiUrl: '', catatan: '', waSentAt: '', createdAt: stamp(-7), updatedAt: stamp(-7) }
];

const payments = [
  { id: 'PY1', billId: 'B1', anakId: 'CH1', ortuId: 'USR-O1', jumlah: 150000, metode: 'transfer', buktiUrl: svg('Cicilan 1', '#e8f0e3', '#2f5c2f'), catatan: 'Cicilan sesi 1–3.', status: 'diterima', tanggalBayar: daysAgo(2), verifiedAt: stamp(-2), verifiedBy: 'Mustiono', createdAt: stamp(-2), updatedAt: stamp(-2) },
  { id: 'PY2', billId: 'B2', anakId: 'CH2', ortuId: 'USR-O1', jumlah: 250000, metode: 'transfer', buktiUrl: svg('Bukti Transfer', '#e8f0e3', '#2f5c2f'), catatan: 'Transfer BCA a.n. Siti Rahmawati.', status: 'menunggu_verifikasi', tanggalBayar: TODAY, verifiedAt: '', verifiedBy: '', createdAt: stamp(0), updatedAt: stamp(0) },
  { id: 'PY3', billId: 'B3', anakId: 'CH1', ortuId: 'USR-O1', jumlah: 450000, metode: 'transfer', buktiUrl: svg('Lunas', '#cde8d8', '#0f5a4e'), catatan: '', status: 'diterima', tanggalBayar: PREV + '-09', verifiedAt: stamp(-30), verifiedBy: 'Mustiono', createdAt: stamp(-30), updatedAt: stamp(-30) },
  { id: 'PY4', billId: 'B4', anakId: 'CH2', ortuId: 'USR-O1', jumlah: 450000, metode: 'transfer', buktiUrl: svg('Lunas', '#cde8d8', '#0f5a4e'), catatan: '', status: 'diterima', tanggalBayar: PREV + '-08', verifiedAt: stamp(-30), verifiedBy: 'Mustiono', createdAt: stamp(-30), updatedAt: stamp(-30) }
];

const salaries = [
  { id: 'SAL1', pengajarId: 'T1', periode: PERIOD, jumlahSesi: 2, tarif: 75000, bonus: 0, potongan: 0, total: 150000, status: 'belum', rincianJson: '', slipNo: 'SLP-' + PERIOD.replace('-', '') + '-T1', tanggalBayar: '', catatan: 'Aisyah sudah ACC, Bima menunggu ACC.', createdAt: stamp(-2), updatedAt: stamp(0) },
  { id: 'SAL2', pengajarId: 'T2', periode: PERIOD, jumlahSesi: 1, tarif: 65000, bonus: 0, potongan: 0, total: 65000, status: 'belum', rincianJson: '', slipNo: 'SLP-' + PERIOD.replace('-', '') + '-T2', tanggalBayar: '', catatan: '', createdAt: stamp(-2), updatedAt: stamp(-2) },
  { id: 'SAL3', pengajarId: 'T1', periode: PREV, jumlahSesi: 1, tarif: 75000, bonus: 0, potongan: 0, total: 75000, status: 'dibayar', rincianJson: '', slipNo: 'SLP-' + PREV.replace('-', '') + '-T1', tanggalBayar: PREV + '-28', catatan: '', createdAt: stamp(-25), updatedAt: stamp(-24) }
];

const sessions = new Map();
let seq = 1000;
const nextId = p => p + (++seq);

/* ---------- bentuk respons ---------- */
function publicUser(u) {
  if (u.role === 'guru') {
    const t = teachers.find(x => x.userId === u.id);
    return Object.assign({}, u, {
      role: 'guru', teacherId: t ? t.id : '', tarifPerSesi: t ? t.tarifPerSesi : 0,
      spesialisasi: t ? t.spesialisasi : '', area: t ? (t.area || '') : '',
      fotoUrl: (t && t.fotoUrl) || u.fotoUrl, ttdUrl: (t && t.ttdUrl) || u.ttdUrl,
      password: undefined
    });
  }
  const out = Object.assign({}, u, { password: undefined });
  if (u.role === 'ortu') {
    out.childNames = children.filter(c => c.ortuId === u.id).map(c => c.nama).join(', ');
  }
  return out;
}
function bimbel() {
  return {
    nama: settings.bimbelNama, tagline: settings.bimbelTagline, alamat: settings.bimbelAlamat,
    phone: settings.bimbelPhone, email: settings.bimbelEmail, jamOperasional: settings.jamOperasional,
    logoUrl: settings.logoUrl, waAdmin: settings.waAdmin, rekening: settings.rekening,
    tahunAjaran: settings.tahunAjaran
  };
}
const userById = id => users.find(u => u.id === id);
const childById = id => children.find(c => c.id === id);
const teacherById = id => teachers.find(t => t.id === id);
const pkgById = id => packages.find(p => p.id === id);
const slotById = id => slots.find(s => s.id === id);
const enrById = id => enrollments.find(e => e.id === id);
const teacherForUser = u => teachers.find(t => t.userId === u.id) || null;
const teacherName = id => { const t = teacherById(id); return t ? t.nama : ''; };

function slotIdsOf(e) {
  if (!e) return [];
  const raw = e.slotIds ? String(e.slotIds) : '';
  let ids = raw.split(',').map(v => v.trim()).filter(Boolean);
  if (!ids.length && e.slotId) ids = [String(e.slotId)];
  return ids.filter((v, i, arr) => arr.indexOf(v) === i);
}
function enrollmentSlots(e) { return slotIdsOf(e).map(slotById).filter(Boolean); }
function jadwalTeks(slots) {
  return (slots || []).map(s => s.hari + ', ' + s.jamMulai + '–' + s.jamSelesai).join(' & ');
}
function enrollDetail(e) {
  if (!e) return null;
  const list = enrollmentSlots(e);
  return {
    id: e.id, anakId: e.anakId, ortuId: e.ortuId, paketId: e.paketId, slotId: e.slotId,
    slotIds: slotIdsOf(e), pengajarId: e.pengajarId, tanggalMulai: e.tanggalMulai, status: e.status,
    sesiTerpakai: Number(e.sesiTerpakai || 0), selesaiAt: e.selesaiAt || '',
    paket: pkgById(e.paketId) || null, slot: list[0] || null, slots: list,
    pengajar: teacherById(e.pengajarId) || null,
    jadwalTeks: jadwalTeks(list)
  };
}
function dailyRow(r) {
  const child = childById(r.anakId);
  const parent = child ? userById(child.ortuId) : null;
  const e = enrById(r.enrollmentId);
  const pkg = e ? pkgById(e.paketId) : null;
  return Object.assign({}, r, {
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
    pengajarNama: teacherName(r.pengajarId), paketNama: pkg ? pkg.nama : '',
    jadwalTeks: e ? jadwalTeks(enrollmentSlots(e)) : ''
  });
}
function lpmbRow(l) {
  const child = childById(l.anakId);
  const parent = child ? userById(child.ortuId) : null;
  return Object.assign({}, l, {
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    gender: child ? child.gender : '', kelas: child ? child.kelas : '', sekolah: child ? child.sekolah : '',
    ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
    pengajarNama: teacherName(l.pengajarId)
  });
}
function billPaid(b) {
  if (!b) return 0;
  const total = Number(b.jumlah || 0);
  let v = b.dibayar === '' || b.dibayar == null ? (String(b.status) === 'lunas' ? total : 0) : Number(b.dibayar);
  if (!isFinite(v)) v = 0;
  if (String(b.status) === 'lunas' && v < total) v = total;
  return Math.min(total, Math.max(0, v));
}
function syncBillTotals(b) {
  const list = payments.filter(p => p.billId === b.id);
  const accepted = list.filter(p => p.status === 'diterima').reduce((s, p) => s + Number(p.jumlah || 0), 0);
  const pending = list.some(p => p.status === 'menunggu_verifikasi');
  const total = Number(b.jumlah || 0);
  const paid = Math.min(total, Math.max(0, accepted));
  if (paid >= total && total > 0) b.status = 'lunas';
  else if (pending) b.status = 'menunggu_verifikasi';
  else if (paid > 0) b.status = 'sebagian';
  else if (list.length && list.every(p => p.status === 'ditolak')) b.status = 'ditolak';
  else b.status = 'belum';
  b.dibayar = paid;
  b.updatedAt = new Date().toISOString();
}
function billRow(b) {
  const child = childById(b.anakId);
  const parent = child ? userById(child.ortuId) : null;
  const pkg = pkgById(b.paketId);
  const paid = billPaid(b);
  const total = Number(b.jumlah || 0);
  const sesi = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
  return Object.assign({}, b, {
    dibayar: paid, sisa: Math.max(0, total - paid),
    sesiPaket: sesi, hargaPerSesi: sesi > 0 ? Math.round(total / sesi) : 0,
    payments: payments.filter(p => p.billId === b.id).sort((a, b2) => String(b2.createdAt).localeCompare(String(a.createdAt))),
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
    paketNama: pkg ? pkg.nama : ''
  });
}
function attRow(a) {
  const child = childById(a.anakId);
  const e = enrById(a.enrollmentId);
  const pkg = e ? pkgById(e.paketId) : null;
  return {
    id: a.id, enrollmentId: a.enrollmentId, anakId: a.anakId, pengajarId: a.pengajarId,
    tanggal: a.tanggal, status: a.status, jam: a.jam, fotoUrl: a.fotoUrl, catatan: a.catatan,
    createdAt: a.createdAt, updatedAt: a.updatedAt,
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    pengajarNama: teacherName(a.pengajarId), paketNama: pkg ? pkg.nama : '',
    jadwalTeks: e ? jadwalTeks(enrollmentSlots(e)) : ''
  };
}
function salaryEntries(teacherId, periode) {
  const t = teacherById(teacherId);
  const tarif = Number((t && t.tarifPerSesi) || 0);
  const sessions = {};
  attendance.filter(a => a.pengajarId === teacherId && a.status === 'hadir' && a.tanggal.slice(0, 7) === periode).forEach(a => {
    if (!sessions[a.enrollmentId]) sessions[a.enrollmentId] = { count: 0, last: '' };
    sessions[a.enrollmentId].count++;
    if (a.tanggal > sessions[a.enrollmentId].last) sessions[a.enrollmentId].last = a.tanggal;
  });
  const approved = [], pending = [];
  Object.keys(sessions).forEach(eid => {
    const e = enrById(eid);
    if (!e) return;
    const c = childById(e.anakId);
    const pkg = pkgById(e.paketId);
    const l = lpmb.find(x => x.anakId === e.anakId && x.periode === periode && x.pengajarId === teacherId);
    const it = {
      enrollmentId: eid, anakId: e.anakId, anakNama: c ? c.nama : 'Siswa', anakFoto: c ? c.fotoUrl : '',
      paketId: e.paketId, paketNama: pkg ? pkg.nama : '', sesiPaket: pkg ? Number(pkg.sesiPerBulan || 0) : 0,
      sesiHadir: sessions[eid].count, tanggalTerakhir: sessions[eid].last, tarif: tarif,
      subtotal: sessions[eid].count * tarif, lpmbId: l ? l.id : '', lpmbStatus: l ? l.status : 'belum',
      lpmbPeriode: l ? l.periode : periode
    };
    if (l && l.status === 'disetujui') approved.push(it); else pending.push(it);
  });
  const byName = (a, b) => String(a.anakNama).localeCompare(String(b.anakNama));
  approved.sort(byName); pending.sort(byName);
  return { approved, pending, jumlahSesi: approved.reduce((s, it) => s + it.sesiHadir, 0) };
}
function salaryDetail(s) {
  if (s.rincianJson) {
    try {
      const p = JSON.parse(s.rincianJson);
      if (p && Array.isArray(p.approved)) return { approved: p.approved, pending: Array.isArray(p.pending) ? p.pending : [] };
    } catch (e) { /* abaikan */ }
  }
  const br = salaryEntries(s.pengajarId, s.periode);
  return { approved: br.approved, pending: br.pending };
}
function salaryRow(s) {
  const t = teacherById(s.pengajarId);
  const detail = salaryDetail(s);
  const status = s.status === 'menunggu_acc' && detail.approved.length ? 'belum' : s.status;
  return Object.assign({}, s, {
    status: status,
    pengajarNama: t ? t.nama : '', pengajarFoto: t ? t.fotoUrl : '',
    spesialisasi: t ? t.spesialisasi : '', periodeLabel: s.periode === PERIOD ? 'Bulan ini' : s.periode,
    rincian: detail, jumlahAnak: detail.approved.length, menungguAcc: detail.pending.length,
    bisaBayar: s.status !== 'dibayar' && detail.approved.length > 0
  });
}
function childLite(c) { return { id: c.id, nama: c.nama }; }

function studentsForTeacher(t) {
  return enrollments.filter(e => e.pengajarId === t.id && e.status === 'aktif').map(e => {
    const c = childById(e.anakId);
    const pkg = pkgById(e.paketId);
    const list = enrollmentSlots(e);
    const parent = c ? userById(c.ortuId) : null;
    return {
      id: c.id, enrollmentId: e.id, nama: c.nama, fotoUrl: c.fotoUrl, paketNama: pkg ? pkg.nama : '',
      jadwalTeks: jadwalTeks(list), hari: list[0] ? list[0].hari : '',
      hariIni: list.some(s => s.hari === TODAY_NAME), kelas: c.kelas,
      ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
      alamatRumah: c.alamatRumah || '', rumahLat: c.rumahLat || '', rumahLng: c.rumahLng || '',
      fotoRumahUrl: c.fotoRumahUrl || ''
    };
  });
}
function attendanceTodayFor(eid) {
  return attendance.find(a => a.enrollmentId === eid && a.tanggal === TODAY) || null;
}
function reportTodayFor(childId) {
  return reports.find(r => r.anakId === childId && r.tanggal === TODAY) || null;
}
function nextSchedule(slotOrSlots) {
  const list = Array.isArray(slotOrSlots) ? slotOrSlots : (slotOrSlots ? [slotOrSlots] : []);
  const candidates = [];
  list.forEach(s => {
    const idx = HARI.indexOf(s.hari);
    if (idx === -1) return;
    const d = new Date(now);
    const diff = (idx - d.getDay() + 7) % 7;
    const parts = String(s.jamMulai || '00:00').split(':');
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, Number(parts[0] || 0), Number(parts[1] || 0), 0, 0);
    if (diff === 0 && target <= now) target.setDate(target.getDate() + 7);
    candidates.push({ tanggal: iso(target), hari: s.hari, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai });
  });
  candidates.sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  return candidates[0] || null;
}
function overview(child) {
  const e = enrollments.find(x => x.anakId === child.id && x.status === 'aktif') || null;
  const att = attendance.filter(a => a.anakId === child.id && a.tanggal.slice(0, 7) === PERIOD);
  const rs = reports.filter(r => r.anakId === child.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const ls = lpmb.filter(l => l.anakId === child.id).sort((a, b) => b.periode.localeCompare(a.periode));
  const bs = bills.filter(b => b.anakId === child.id);
  const unpaid = bs.filter(b => billPaid(b) < Number(b.jumlah || 0));
  return {
    child: child,
    enrollment: enrollDetail(e),
    attendanceMonth: {
      hadir: att.filter(a => a.status === 'hadir').length, izin: att.filter(a => a.status === 'izin').length,
      sakit: att.filter(a => a.status === 'sakit').length, alpha: att.filter(a => a.status === 'alpha').length, total: att.length
    },
    reportsMonth: rs.filter(r => r.tanggal.slice(0, 7) === PERIOD).length,
    lastReport: rs[0] ? rs[0].tanggal : '',
    lpmbLatest: ls[0] ? lpmbRow(ls[0]) : null,
    unpaidCount: unpaid.length,
    unpaidTotal: unpaid.reduce((s, b) => s + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0),
    nextSchedule: e ? nextSchedule(enrollmentSlots(e)) : null
  };
}
function menuFor(childList) {
  return childList.map(c => {
    const e = enrollments.find(x => x.anakId === c.id && x.status === 'aktif');
    const pkg = e ? pkgById(e.paketId) : null;
    return { child: c, paketNama: pkg ? pkg.nama : '', jadwalTeks: e ? jadwalTeks(enrollmentSlots(e)) : '' };
  });
}
const sum = (list, key) => list.reduce((s, x) => s + Number(x[key] || 0), 0);

/* ---------- autentikasi ---------- */
function login(data) {
  const identity = String(data.identity || '').trim().toLowerCase();
  const password = String(data.password || '');
  const u = users.find(x => x.username.toLowerCase() === identity || x.phone === identity);
  if (!u || u.password !== password) throw apiError('Username/nomor atau kata sandi tidak sesuai.', 'AUTH_FAILED');
  if (u.status !== 'aktif') throw apiError('Akun dinonaktifkan. Hubungi admin.', 'FORBIDDEN');
  u.lastLogin = new Date().toISOString();
  const token = 'mock-' + u.id + '-' + Date.now();
  sessions.set(token, u.id);
  return { token: token, user: publicUser(u) };
}
function apiError(message, code) {
  const e = new Error(message); e.code = code || 'ERROR'; return e;
}
function userFromToken(token) {
  const id = sessions.get(token);
  if (!id) return null;
  return userById(id) || null;
}
function upload(value) {
  if (!value) return '';
  if (/^https?:/i.test(value)) return value;
  if (/^data:/i.test(value)) return value;
  return svg('Berkas');
}
function addBillFor(enr, periode) {
  const pkg = pkgById(enr.paketId);
  const due = (periode || PERIOD) + '-' + pad(Number(settings.jatuhTempoHari || 10));
  const row = {
    id: nextId('B'), anakId: enr.anakId, ortuId: enr.ortuId, paketId: enr.paketId, enrollmentId: enr.id,
    periode: periode || PERIOD, jumlah: pkg ? pkg.harga : 0, dibayar: 0, jatuhTempo: due, status: 'belum',
    tanggalBayar: '', metode: '', buktiUrl: '', catatan: '', waSentAt: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  bills.push(row);
  return row;
}
function buildSlots(paketId) {
  const pkg = pkgById(paketId);
  if (!pkg) throw apiError('Paket tidak ditemukan.', 'NOT_FOUND');
  return {
    slots: slots.filter(s => s.paketId === pkg.id && s.status !== 'nonaktif').map(s => {
      const t = teacherById(s.pengajarId);
      const taken = s.status === 'terisi' || !!s.anakId;
      return {
        id: s.id, hari: s.hari, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai,
        pengajarId: s.pengajarId, pengajarNama: teacherName(s.pengajarId),
        pengajarArea: t ? (t.area || '') : '', pengajarSpesialisasi: t ? (t.spesialisasi || '') : '',
        pengajarFoto: t ? (t.fotoUrl || '') : '', terisi: taken,
        status: taken ? 'terisi' : 'tersedia'
      };
    }),
    paket: pkg
  };
}
function timeMinutes(hhmm) {
  const p = String(hhmm || '0:0').split(':');
  return Number(p[0] || 0) * 60 + Number(p[1] || 0);
}
function resolveSlots(paketId, data) {
  const raw = Array.isArray(data.slotIds) ? data.slotIds : (data.slotId ? [data.slotId] : []);
  const ids = raw.map(v => String(v || '').trim()).filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
  if (!ids.length) throw apiError('Pilih minimal satu jadwal belajar.', 'VALIDATION');
  if (ids.length > 3) throw apiError('Maksimal 3 sesi belajar dalam satu pendaftaran.', 'VALIDATION');
  const pkg = pkgById(paketId);
  if (!pkg) throw apiError('Paket belajar tidak ditemukan.', 'NOT_FOUND');
  const list = ids.map(id => {
    const s = slotById(id);
    if (!s) throw apiError('Jadwal tidak ditemukan.', 'NOT_FOUND');
    if (s.paketId !== paketId) throw apiError('Jadwal tidak sesuai dengan paket yang dipilih.', 'VALIDATION');
    if (s.status === 'nonaktif') throw apiError('Jadwal tidak tersedia.', 'SLOT_TAKEN');
    if (s.status === 'terisi' || s.anakId) {
      throw apiError('Maaf, jadwal ' + s.hari + ' ' + s.jamMulai + '–' + s.jamSelesai + ' baru saja diambil siswa lain. Silakan pilih jadwal lain.', 'SLOT_TAKEN');
    }
    return s;
  });
  if (list.some(s => s.pengajarId !== list[0].pengajarId)) {
    throw apiError('Semua sesi harus bersama pengajar yang sama.', 'VALIDATION');
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (list[i].hari === list[j].hari &&
        timeMinutes(list[i].jamMulai) < timeMinutes(list[j].jamSelesai) &&
        timeMinutes(list[j].jamMulai) < timeMinutes(list[i].jamSelesai)) {
        throw apiError('Jadwal ' + list[i].hari + ' ' + list[i].jamMulai + '–' + list[i].jamSelesai +
          ' bertabrakan dengan ' + list[j].jamMulai + '–' + list[j].jamSelesai + '. Pilih jam berbeda.', 'SESSION_OVERLAP');
      }
    }
  }
  list.sort((a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari) || String(a.jamMulai).localeCompare(String(b.jamMulai)));
  return { pkg: pkg, slots: list };
}
function createEnrollment(child, resolved) {
  const slotsSel = resolved.slots;
  const first = slotsSel[0];
  const e = {
    id: nextId('EN'), anakId: child.id, ortuId: child.ortuId, paketId: resolved.pkg.id, slotId: first.id,
    slotIds: slotsSel.map(s => s.id).join(','), pengajarId: first.pengajarId, tanggalMulai: TODAY,
    sesiTerpakai: 0, status: 'aktif', selesaiAt: '', createdAt: new Date().toISOString()
  };
  enrollments.push(e);
  slotsSel.forEach(s => { s.status = 'terisi'; s.anakId = child.id; });
  return e;
}
function freeEnrollmentSlots(e) {
  slotIdsOf(e).forEach(id => {
    const s = slotById(id);
    if (s && s.anakId === e.anakId) { s.status = 'tersedia'; s.anakId = ''; }
  });
}

/* ---------- aksi ---------- */
const actions = {};

actions['public.bootstrap'] = () => {
  const aktif = packages.filter(p => p.aktif);
  return { bimbel: bimbel(), stats: { siswa: children.length, pengajar: teachers.filter(t => t.status === 'aktif').length, paket: aktif.length }, paket: aktif };
};
actions['public.slots'] = data => buildSlots(data.paketId);
actions['auth.login'] = login;
actions['auth.me'] = (data, user) => ({ user: publicUser(user), bimbel: bimbel() });
actions['auth.logout'] = (data, user, token) => { sessions.delete(token); return { ok: true }; };
actions['auth.changePassword'] = (data, user) => {
  if (String(data.newPassword || '').length < 6) throw apiError('Kata sandi baru minimal 6 karakter.', 'VALIDATION');
  if (user.password !== data.oldPassword) throw apiError('Kata sandi lama tidak sesuai.', 'AUTH_FAILED');
  user.password = data.newPassword;
  return { ok: true, message: 'Kata sandi berhasil diubah.' };
};
actions['auth.register'] = data => {
  const acc = data.account || {};
  const child = data.child || {};
  if (!acc.username || users.some(u => u.username.toLowerCase() === String(acc.username).toLowerCase())) {
    throw apiError('Username sudah digunakan.', 'CONFLICT');
  }
  const resolved = resolveSlots(data.paketId, data);
  const u = {
    id: nextId('USR'), role: 'ortu', username: String(acc.username).trim(), nama: String(acc.nama || '').trim(),
    phone: String(acc.phone || '').trim(), email: String(acc.email || '').trim(), password: String(acc.password || ''),
    status: 'aktif', fotoUrl: '', alamat: '', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
  };
  users.push(u);
  const c = {
    id: nextId('CH'), ortuId: u.id, nama: String(child.nama || '').trim(), panggilan: child.panggilan || '',
    gender: child.gender || 'laki', tglLahir: child.tglLahir || '', sekolah: child.sekolah || '', kelas: child.kelas || '',
    catatan: child.catatan || '', alamatRumah: child.alamatRumah || '', rumahLat: child.rumahLat || '',
    rumahLng: child.rumahLng || '', fotoRumahUrl: '', fotoUrl: '', status: 'aktif',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  children.push(c);
  const e = createEnrollment(c, resolved);
  addBillFor(e, PERIOD);
  const token = 'mock-' + u.id + '-' + Date.now();
  sessions.set(token, u.id);
  return { token: token, user: publicUser(u) };
};

/* ---------- admin ---------- */
actions['dashboard.admin'] = () => {
  const aktif = packages.filter(p => p.aktif);
  const att = attendance.filter(a => a.tanggal === TODAY);
  const rep = reports.filter(r => r.tanggal === TODAY);
  const pLpmb = lpmb.filter(l => l.status === 'menunggu_acc');
  const pBills = bills.filter(b => b.status === 'menunggu_verifikasi');
  const monthBills = bills.filter(b => b.periode === PERIOD);
  const active = enrollments.filter(e => e.status === 'aktif');
  return {
    bimbel: bimbel(), role: 'admin', periode: PERIOD,
    stats: {
      siswa: children.filter(c => c.status !== 'nonaktif').length,
      pengajar: teachers.filter(t => t.status === 'aktif').length,
      paket: aktif.length, enrollmentAktif: active.length,
      tagihanBulan: sum(monthBills, 'jumlah'),
      tagihanLunas: monthBills.reduce((s, b) => s + billPaid(b), 0),
      outstanding: monthBills.reduce((s, b) => s + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0),
      tagihanCount: monthBills.length,
      tagihanLunasCount: monthBills.filter(b => billPaid(b) >= Number(b.jumlah || 0)).length,
      menungguVerifikasi: pBills.length,
      hadirHariIni: att.filter(a => a.status === 'hadir').length,
      absenHariIni: att.length,
      laporanHariIni: rep.length,
      lpmbMenunggu: pLpmb.length
    },
    attendanceToday: {
      hadir: att.filter(a => a.status === 'hadir').length, izin: att.filter(a => a.status === 'izin').length,
      sakit: att.filter(a => a.status === 'sakit').length, alpha: att.filter(a => a.status === 'alpha').length,
      belum: Math.max(0, active.length - att.length)
    },
    students: active.map(e => {
      const c = childById(e.anakId); const p = c ? userById(c.ortuId) : null;
      const pkg = pkgById(e.paketId); const s = slotById(e.slotId);
      return {
        enrollmentId: e.id, id: c.id, nama: c.nama, panggilan: c.panggilan, fotoUrl: c.fotoUrl, kelas: c.kelas,
        ortuNama: p ? p.nama : '', ortuPhone: p ? p.phone : '', paketNama: pkg ? pkg.nama : '',
        pengajarNama: teacherName(e.pengajarId), jadwalTeks: s ? s.hari + ', ' + s.jamMulai + '–' + s.jamSelesai : '',
        hari: s ? s.hari : '', mulai: s ? s.jamMulai : ''
      };
    }),
    pendingBills: pBills.map(billRow),
    lpmbPending: pLpmb.map(lpmbRow),
    reports: rep.map(dailyRow),
    defaultPasswordWarning: users.find(u => u.id === 'USR-ADM').password === 'admin123',
    wa: { configured: !!settings.waToken }
  };
};

actions['anak.list'] = () => {
  const rows = children.filter(c => c.status !== 'nonaktif').map(c => {
    const parent = userById(c.ortuId);
    const e = enrollments.find(x => x.anakId === c.id && x.status === 'aktif');
    const pkg = e ? pkgById(e.paketId) : null;
    const s = e ? slotById(e.slotId) : null;
    const unpaid = bills.filter(b => b.anakId === c.id && billPaid(b) < Number(b.jumlah || 0));
    return Object.assign({}, c, {
      ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
      ortuUsername: parent ? parent.username : '', enrollmentId: e ? e.id : '',
      paketNama: pkg ? pkg.nama : '', jadwalTeks: s ? s.hari + ', ' + s.jamMulai + '–' + s.jamSelesai : '',
      pengajarNama: e ? teacherName(e.pengajarId) : '',
      unpaidTotal: unpaid.reduce((s2, b) => s2 + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0), unpaidCount: unpaid.length
    });
  });
  return { children: rows, parents: users.filter(u => u.role === 'ortu' && u.status === 'aktif').map(u => ({ id: u.id, nama: u.nama })) };
};
actions['anak.save'] = data => {
  let c = data.id ? childById(data.id) : null;
  if (!c) {
    c = { id: nextId('CH'), createdAt: new Date().toISOString(), fotoUrl: '' };
    children.push(c);
  }
  Object.assign(c, {
    ortuId: data.ortuId || c.ortuId, nama: data.nama, panggilan: data.panggilan || '', gender: data.gender,
    tglLahir: data.tglLahir, sekolah: data.sekolah || '', kelas: data.kelas || '', catatan: data.catatan || '',
    status: data.status || 'aktif', updatedAt: new Date().toISOString(),
    fotoUrl: upload(data.foto) || c.fotoUrl
  });
  return { ok: true, child: c };
};
actions['anak.enroll'] = data => {
  const c = childById(data.anakId);
  if (!c) throw apiError('Data anak tidak ditemukan.', 'NOT_FOUND');
  if (enrollments.some(e => e.anakId === c.id && e.status === 'aktif')) {
    throw apiError('Anak sudah memiliki paket aktif.', 'CONFLICT');
  }
  const resolved = resolveSlots(data.paketId, data);
  const e = createEnrollment(c, resolved);
  if (!bills.some(b => b.anakId === c.id && b.periode === PERIOD && b.status !== 'ditolak')) addBillFor(e, PERIOD);
  return { ok: true, enrollment: enrollDetail(e) };
};
actions['guru.list'] = () => ({
  teachers: teachers.map(t => {
    const u = userById(t.userId) || {};
    return Object.assign({}, t, {
      username: u.username, siswa: enrollments.filter(e => e.pengajarId === t.id && e.status === 'aktif').length,
      hadirBulan: attendance.filter(a => a.pengajarId === t.id && a.status === 'hadir' && a.tanggal.slice(0, 7) === PERIOD).length
    });
  })
});
actions['guru.save'] = data => {
  let t = data.id ? teacherById(data.id) : null;
  let u = t ? userById(t.userId) : null;
  if (!u) {
    u = { id: nextId('USR'), role: 'guru', username: data.username, password: data.password || 'guru123', status: data.status || 'aktif', createdAt: new Date().toISOString(), fotoUrl: '', ttdUrl: '' };
    users.push(u);
  }
  Object.assign(u, {
    nama: data.nama, username: data.username || u.username, phone: data.phone || '', email: data.email || '',
    status: data.status || 'aktif', alamat: data.alamat || '', fotoUrl: upload(data.foto) || u.fotoUrl || ''
  });
  if (!t) { t = { id: nextId('T'), userId: u.id, createdAt: new Date().toISOString() }; teachers.push(t); }
  Object.assign(t, {
    nama: data.nama, phone: data.phone || '', email: data.email || '', spesialisasi: data.spesialisasi || '',
    area: data.area || '', tarifPerSesi: Number(data.tarifPerSesi || 0), status: data.status || 'aktif', updatedAt: new Date().toISOString(),
    fotoUrl: upload(data.foto) || t.fotoUrl || '', ttdUrl: upload(data.ttd) || t.ttdUrl || ''
  });
  return { ok: true, teacher: t };
};
actions['paket.list'] = () => ({
  packages: packages.map(p => Object.assign({}, p, {
    siswaAktif: enrollments.filter(e => e.paketId === p.id && e.status === 'aktif').length
  }))
});
actions['paket.save'] = data => {
  let p = data.id ? pkgById(data.id) : null;
  if (!p) { p = { id: nextId('PKG'), createdAt: new Date().toISOString() }; packages.push(p); }
  Object.assign(p, {
    nama: data.nama, sesiPerBulan: Number(data.sesiPerBulan || 8), durasiMenit: Number(data.durasiMenit || 90),
    harga: Number(data.harga || 0), deskripsi: data.deskripsi || '', aktif: !!data.aktif, updatedAt: new Date().toISOString()
  });
  return { ok: true, package: p };
};
actions['jadwal.list'] = () => ({
  slots: slots.map(s => {
    const c = s.anakId ? childById(s.anakId) : null;
    return Object.assign({}, s, {
      paketNama: (pkgById(s.paketId) || {}).nama || '', pengajarNama: teacherName(s.pengajarId),
      anakNama: c ? c.nama : ''
    });
  }),
  packages: packages.map(p => ({ id: p.id, nama: p.nama, aktif: p.aktif })),
  teachers: teachers.map(t => ({ id: t.id, nama: t.nama }))
});
actions['jadwal.save'] = data => {
  let s = data.id ? slotById(data.id) : null;
  if (!s) { s = { id: nextId('SL'), anakId: '' }; slots.push(s); }
  Object.assign(s, {
    paketId: data.paketId, pengajarId: data.pengajarId, hari: data.hari,
    jamMulai: data.jamMulai, jamSelesai: data.jamSelesai, kuota: Number(data.kuota || 1),
    status: s.anakId ? 'terisi' : (data.status || 'tersedia')
  });
  return { ok: true, slot: s };
};
actions['jadwal.remove'] = data => {
  const s = slotById(data.id);
  if (!s) throw apiError('Jadwal tidak ditemukan.', 'NOT_FOUND');
  if (s.status === 'terisi') throw apiError('Jadwal yang sudah terisi tidak dapat dihapus.', 'CONFLICT');
  slots.splice(slots.indexOf(s), 1);
  return { ok: true };
};
actions['harian.list'] = (data, user) => {
  const t = teacherForUser(user);
  let rows = reports.map(dailyRow);
  if (t) rows = rows.filter(r => r.pengajarId === t.id);
  if (data && data.anakId) rows = rows.filter(r => r.anakId === data.anakId);
  if (data && data.periode) rows = rows.filter(r => r.tanggal.slice(0, 7) === data.periode);
  rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return { reports: rows, filters: { children: children.filter(c => c.status !== 'nonaktif').map(childLite) } };
};
actions['lpmb.list'] = (data, user) => {
  const t = teacherForUser(user);
  let rows = lpmb.map(lpmbRow);
  if (t) rows = rows.filter(r => r.pengajarId === t.id);
  if (data && data.status) rows = rows.filter(r => r.status === data.status);
  if (data && data.anakId) rows = rows.filter(r => r.anakId === data.anakId);
  if (data && data.periode) rows = rows.filter(r => r.periode === data.periode);
  rows.sort((a, b) => b.periode.localeCompare(a.periode));
  return { lpmb: rows, pending: rows.filter(r => r.status === 'menunggu_acc').length, filters: { children: children.map(childLite) } };
};
actions['lpmb.approve'] = (data, user) => {
  const l = lpmb.find(x => x.id === data.id);
  if (!l) throw apiError('Rapor tidak ditemukan.', 'NOT_FOUND');
  if (data.action === 'approve') {
    l.status = 'disetujui'; l.ttdAdminUrl = user.ttdUrl || settings.ttdAdminUrl;
    l.approvedAt = new Date().toISOString(); l.approvedBy = user.nama;
    const e = enrollments.find(x => x.anakId === l.anakId && x.status === 'aktif' && x.pengajarId === l.pengajarId);
    const pkg = e ? pkgById(e.paketId) : null;
    const hadir = e ? attendance.filter(a => a.enrollmentId === e.id && a.status === 'hadir').length : 0;
    if (e && pkg && Number(pkg.sesiPerBulan || 0) > 0 && hadir >= Number(pkg.sesiPerBulan)) {
      e.status = 'selesai'; e.selesaiAt = new Date().toISOString();
      freeEnrollmentSlots(e);
    }
  } else {
    l.status = 'ditolak';
  }
  l.catatanAdmin = data.catatan || '';
  l.updatedAt = new Date().toISOString();
  return { ok: true, lpmb: lpmbRow(l) };
};
actions['biaya.list'] = data => {
  const periode = data.periode || PERIOD;
  let rows = bills.map(billRow);
  if (periode !== 'semua') rows = rows.filter(b => b.periode === periode);
  if (data.status) rows = rows.filter(b => b.status === data.status);
  const periods = Array.from(new Set(bills.map(b => b.periode).concat([PERIOD]))).sort().reverse();
  const scope = periode === 'semua' ? bills : bills.filter(b => b.periode === periode);
  return {
    bills: rows, periode: periode, periodeLabel: periode === 'semua' ? 'Semua periode' : periode,
    summary: {
      total: sum(scope, 'jumlah'), paid: scope.reduce((s, b) => s + billPaid(b), 0),
      outstanding: scope.reduce((s, b) => s + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0),
      count: scope.length, paidCount: scope.filter(b => billPaid(b) >= Number(b.jumlah || 0)).length
    },
    unpaid: rows.filter(b => Number(b.sisa || 0) > 0),
    waConfigured: !!settings.waToken, waEnabled: settings.waEnabled === '1',
    periods: periods, children: children.filter(c => c.status !== 'nonaktif').map(childLite)
  };
};
actions['biaya.save'] = data => {
  let b = data.id ? bills.find(x => x.id === data.id) : null;
  if (!b) {
    const c = childById(data.anakId);
    if (!c) throw apiError('Data anak tidak ditemukan.', 'NOT_FOUND');
    const e = enrollments.find(x => x.anakId === c.id && x.status === 'aktif');
    const pkg = e ? pkgById(e.paketId) : null;
    b = {
      id: nextId('B'), anakId: c.id, ortuId: c.ortuId, paketId: pkg ? pkg.id : '', enrollmentId: e ? e.id : '',
      dibayar: 0, status: 'belum', tanggalBayar: '', metode: '', buktiUrl: '', waSentAt: '',
      createdAt: new Date().toISOString()
    };
    bills.push(b);
  }
  const jumlah = Number(data.jumlah || (pkgById(b.paketId) || {}).harga || 450000);
  const paidSoFar = billPaid(b);
  if (jumlah < paidSoFar) throw apiError('Jumlah tagihan tidak boleh lebih kecil dari total pembayaran yang sudah diterima (Rp ' + paidSoFar + ').', 'VALIDATION');
  Object.assign(b, {
    periode: data.periode, jumlah: jumlah,
    jatuhTempo: data.jatuhTempo || (data.periode + '-' + pad(Number(settings.jatuhTempoHari || 10))),
    catatan: data.catatan || '', updatedAt: new Date().toISOString()
  });
  if (paidSoFar > 0) {
    b.dibayar = Math.min(jumlah, paidSoFar);
    b.status = b.dibayar >= jumlah ? 'lunas' : 'sebagian';
  }
  return { ok: true, bill: billRow(b) };
};
actions['biaya.markPaid'] = data => {
  const b = bills.find(x => x.id === data.id);
  if (!b) throw apiError('Tagihan tidak ditemukan.', 'NOT_FOUND');
  const sisa = Math.max(0, Number(b.jumlah || 0) - billPaid(b));
  if (sisa <= 0) throw apiError('Tagihan ini sudah lunas.', 'CONFLICT');
  const now = new Date().toISOString();
  payments.push({
    id: nextId('PY'), billId: b.id, anakId: b.anakId, ortuId: b.ortuId, jumlah: sisa,
    metode: data.metode || 'manual', buktiUrl: '', catatan: data.catatan || 'Pelunasan manual admin',
    status: 'diterima', tanggalBayar: TODAY, verifiedAt: now, verifiedBy: 'Admin', createdAt: now, updatedAt: now
  });
  b.tanggalBayar = TODAY; b.metode = data.metode || 'manual';
  if (data.catatan) b.catatan = data.catatan;
  syncBillTotals(b);
  return { ok: true, bill: billRow(b) };
};
actions['biaya.verify'] = (data, user) => {
  const b = bills.find(x => x.id === data.id);
  if (!b) throw apiError('Tagihan tidak ditemukan.', 'NOT_FOUND');
  const action = data.action;
  if (action !== 'terima' && action !== 'tolak') throw apiError('Aksi verifikasi tidak valid.', 'VALIDATION');
  const catatan = String(data.catatan || '').trim();
  if (action === 'tolak' && !catatan) throw apiError('Catatan alasan penolakan wajib diisi.', 'VALIDATION');
  let targets = payments.filter(p => p.billId === b.id && p.status === 'menunggu_verifikasi');
  if (data.paymentId) targets = targets.filter(p => p.id === data.paymentId);
  const now = new Date().toISOString();
  if (!targets.length) {
    if (action === 'tolak') {
      b.status = 'ditolak'; b.catatan = catatan; b.updatedAt = now;
    } else {
      const sisa = Math.max(0, Number(b.jumlah || 0) - billPaid(b));
      if (!sisa) throw apiError('Tagihan ini sudah lunas.', 'CONFLICT');
      payments.push({
        id: nextId('PY'), billId: b.id, anakId: b.anakId, ortuId: b.ortuId, jumlah: sisa,
        metode: 'manual', buktiUrl: b.buktiUrl || '', catatan: catatan || 'Verifikasi pembayaran admin',
        status: 'diterima', tanggalBayar: TODAY, verifiedAt: now, verifiedBy: (user && user.nama) || 'Admin',
        createdAt: now, updatedAt: now
      });
      b.tanggalBayar = TODAY;
      syncBillTotals(b);
    }
  } else {
    targets.forEach(p => {
      p.status = action === 'terima' ? 'diterima' : 'ditolak';
      p.catatan = catatan || p.catatan;
      p.verifiedAt = now; p.verifiedBy = (user && user.nama) || 'Admin'; p.updatedAt = now;
    });
    if (catatan) b.catatan = catatan;
    if (action === 'terima') b.tanggalBayar = TODAY;
    syncBillTotals(b);
  }
  return { ok: true, bill: billRow(b) };
};
actions['biaya.generate'] = data => {
  const periode = data.periode || PERIOD;
  let created = 0, skipped = 0;
  enrollments.filter(e => e.status === 'aktif').forEach(e => {
    if (bills.some(b => b.anakId === e.anakId && b.periode === periode && b.status !== 'ditolak')) { skipped++; return; }
    addBillFor(e, periode); created++;
  });
  return { created: created, skipped: skipped };
};
actions['biaya.sendWa'] = data => {
  const ids = data.ids || [];
  const results = ids.map(id => {
    const b = bills.find(x => x.id === id);
    if (!b) return { ok: false, error: 'Tagihan tidak ditemukan.' };
    const r = billRow(b);
    if (!settings.waToken || settings.waEnabled !== '1') {
      return { ok: false, anakNama: r.anakNama, ortuNama: r.ortuNama, phone: r.ortuPhone, error: 'WhatsApp belum diaktifkan.', waLink: 'https://wa.me/62' + String(r.ortuPhone || '').replace(/^0/, '') };
    }
    b.waSentAt = new Date().toISOString();
    return { ok: true, anakNama: r.anakNama, ortuNama: r.ortuNama, phone: r.ortuPhone };
  });
  return { sent: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length, results: results };
};
actions['gaji.list'] = data => {
  const periode = data.periode || PERIOD;
  let rows = salaries.map(salaryRow);
  if (periode !== 'semua') rows = rows.filter(r => r.periode === periode);
  const periods = Array.from(new Set(salaries.map(s => s.periode).concat([periode]))).sort().reverse();
  return {
    salaries: rows, periode: periode,
    summary: {
      count: rows.length, total: sum(rows, 'total'),
      dibayar: sum(rows.filter(r => r.status === 'dibayar'), 'total'),
      belum: sum(rows.filter(r => r.status !== 'dibayar'), 'total')
    },
    periods: periods
  };
};
actions['gaji.generate'] = data => {
  const periode = data.periode || PERIOD;
  let created = 0, updated = 0, skipped = 0, pendingChildren = 0;
  teachers.forEach(t => {
    const br = salaryEntries(t.id, periode);
    pendingChildren += br.pending.length;
    const rows = salaries.filter(s => s.pengajarId === t.id && s.periode === periode);
    if (!br.approved.length && !br.pending.length) {
      if (!rows.length) skipped++;
      return;
    }
    const covered = {};
    rows.forEach(s => {
      if (s.status !== 'dibayar') return;
      salaryDetail(s).approved.forEach(it => { covered[it.enrollmentId] = true; });
    });
    const approvedNow = br.approved.filter(it => !covered[it.enrollmentId]);
    const count = approvedNow.reduce((n, it) => n + Number(it.sesiHadir || 0), 0);
    const draft = rows.find(s => s.status !== 'dibayar');
    const status = approvedNow.length ? 'belum' : 'menunggu_acc';
    const rincianJson = JSON.stringify({ approved: approvedNow, pending: br.pending });
    if (draft) {
      draft.jumlahSesi = count;
      draft.tarif = t.tarifPerSesi;
      draft.total = count * t.tarifPerSesi + Number(draft.bonus || 0) - Number(draft.potongan || 0);
      draft.status = status;
      draft.rincianJson = rincianJson;
      draft.updatedAt = new Date().toISOString();
      updated++;
    } else if (!approvedNow.length) {
      if (rows.length) { skipped++; return; }
      salaries.push({
        id: nextId('SAL'), pengajarId: t.id, periode: periode, jumlahSesi: 0, tarif: t.tarifPerSesi,
        bonus: 0, potongan: 0, total: 0, status: 'menunggu_acc', rincianJson: rincianJson,
        slipNo: 'SLP-' + periode.replace('-', '') + '-' + t.id + '-' + (rows.length + 1), tanggalBayar: '', catatan: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      created++;
    } else {
      salaries.push({
        id: nextId('SAL'), pengajarId: t.id, periode: periode, jumlahSesi: count, tarif: t.tarifPerSesi,
        bonus: 0, potongan: 0, total: count * t.tarifPerSesi, status: 'belum', rincianJson: rincianJson,
        slipNo: 'SLP-' + periode.replace('-', '') + '-' + t.id + '-' + (rows.length + 1), tanggalBayar: '', catatan: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      created++;
    }
  });
  return {
    created: created, updated: updated, skipped: skipped,
    pending: pendingChildren
  };
};
actions['gaji.update'] = data => {
  const s = salaries.find(x => x.id === data.id);
  if (!s) throw apiError('Slip tidak ditemukan.', 'NOT_FOUND');
  Object.assign(s, {
    jumlahSesi: Number(data.jumlahSesi || 0), tarif: Number(data.tarif || 0),
    bonus: Number(data.bonus || 0), potongan: Number(data.potongan || 0), catatan: data.catatan || '',
    updatedAt: new Date().toISOString()
  });
  s.total = s.jumlahSesi * s.tarif + s.bonus - s.potongan;
  return { ok: true, salary: salaryRow(s) };
};
actions['gaji.markPaid'] = data => {
  const s = salaries.find(x => x.id === data.id);
  if (!s) throw apiError('Slip tidak ditemukan.', 'NOT_FOUND');
  if (s.status === 'dibayar') throw apiError('Slip gaji ini sudah ditandai dibayar.', 'CONFLICT');
  const detail = salaryDetail(s);
  if (!detail.approved.length) {
    throw apiError('Gaji belum dapat dibayarkan. Belum ada anak dengan LPMB yang di-ACC pada slip ini. Setujui LPMB anak lalu generate ulang slip.', 'LPMB_PENDING');
  }
  s.status = 'dibayar'; s.tanggalBayar = TODAY; s.updatedAt = new Date().toISOString();
  s.rincianJson = JSON.stringify({ approved: detail.approved, pending: [] });
  return { ok: true, salary: salaryRow(s) };
};
actions['settings.get'] = () => ({
  settings: settings, bimbel: bimbel(),
  wa: { configured: !!settings.waToken, enabled: settings.waEnabled === '1', masked: settings.waToken ? settings.waToken.slice(0, 4) + '…' + settings.waToken.slice(-3) : '' },
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock-bimbel-mahatari-kecil',
  defaultPasswordWarning: users.find(u => u.id === 'USR-ADM').password === 'admin123'
});
actions['settings.saveBimbel'] = data => {
  const keys = ['bimbelNama', 'bimbelTagline', 'bimbelAlamat', 'bimbelPhone', 'bimbelEmail', 'jamOperasional', 'tahunAjaran', 'rekening', 'waAdmin', 'jatuhTempoHari', 'appUrl'];
  keys.forEach(k => { if (data[k] !== undefined) settings[k] = String(data[k]); });
  if (data.logo) settings.logoUrl = upload(data.logo);
  if (data.ttdAdmin) settings.ttdAdminUrl = upload(data.ttdAdmin);
  return { ok: true };
};
actions['settings.saveWa'] = data => {
  if (data.token) settings.waToken = String(data.token);
  settings.waEnabled = data.enabled ? '1' : '0';
  return { ok: true };
};
actions['settings.testWa'] = data => {
  if (!data.phone) throw apiError('Nomor uji wajib diisi.', 'VALIDATION');
  if (!settings.waToken) throw apiError('Token Fonnte belum diatur.', 'VALIDATION');
  return { ok: true, sent: true };
};
actions['users.list'] = () => ({ users: users.map(publicUser) });
actions['users.save'] = data => {
  let u = data.id ? userById(data.id) : null;
  if (!u) {
    if (users.some(x => x.username.toLowerCase() === String(data.username).toLowerCase())) throw apiError('Username sudah digunakan.', 'CONFLICT');
    u = { id: nextId('USR'), role: data.role === 'guru' ? 'guru' : data.role, password: data.password, createdAt: new Date().toISOString(), fotoUrl: '', ttdUrl: '' };
    users.push(u);
  }
  Object.assign(u, {
    role: data.role || u.role, nama: data.nama, username: data.username || u.username, phone: data.phone || '',
    email: data.email || '', status: data.status || 'aktif', alamat: data.alamat || '',
    fotoUrl: upload(data.foto) || u.fotoUrl || ''
  });
  if (data.password) u.password = data.password;
  if (u.role === 'guru' && !teachers.some(t => t.userId === u.id)) {
    teachers.push({ id: nextId('T'), userId: u.id, nama: u.nama, phone: u.phone, email: u.email, spesialisasi: '', tarifPerSesi: 0, fotoUrl: u.fotoUrl, ttdUrl: '', status: 'aktif', createdAt: new Date().toISOString() });
  }
  return { ok: true, user: publicUser(u) };
};
actions['users.resetPassword'] = data => {
  const u = userById(data.id);
  if (!u) throw apiError('Akun tidak ditemukan.', 'NOT_FOUND');
  const pwd = 'bmk' + Math.floor(1000 + Math.random() * 9000);
  u.password = pwd;
  return { nama: u.nama, username: u.username, password: pwd };
};
actions['users.setActive'] = data => {
  const u = userById(data.id);
  if (!u) throw apiError('Akun tidak ditemukan.', 'NOT_FOUND');
  u.status = data.status === 'nonaktif' ? 'nonaktif' : 'aktif';
  if (u.status === 'nonaktif') {
    Array.from(sessions.entries()).forEach(([tok, id]) => { if (id === u.id) sessions.delete(tok); });
  }
  return { ok: true };
};

/* ---------- pengajar ---------- */
actions['guru.dashboard'] = (data, user) => {
  const t = teacherForUser(user);
  if (!t) throw apiError('Data pengajar tidak ditemukan.', 'NOT_FOUND');
  const list = studentsForTeacher(t).map(s => Object.assign({}, s, {
    absensi: attendanceTodayFor(s.enrollmentId), laporan: reportTodayFor(s.id)
  }));
  const attMonth = attendance.filter(a => a.pengajarId === t.id && a.status === 'hadir' && a.tanggal.slice(0, 7) === PERIOD);
  const rep = reports.filter(r => r.pengajarId === t.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return {
    hariIni: TODAY_NAME, today: TODAY, periode: PERIOD,
    teacher: t,
    stats: {
      siswa: list.length, jadwalHariIni: list.filter(s => s.hariIni).length,
      hadirHariIni: list.filter(s => s.absensi && s.absensi.status === 'hadir').length,
      belumAbsen: list.filter(s => !s.absensi).length,
      laporanHariIni: list.filter(s => s.laporan).length,
      gajiBulan: sum(salaries.filter(s => s.pengajarId === t.id && s.periode === PERIOD), 'total'),
      tarifPerSesi: t.tarifPerSesi, hadirBulan: attMonth.length,
      lpmbMenunggu: lpmb.filter(l => l.pengajarId === t.id && l.status === 'menunggu_acc').length
    },
    students: list,
    recentReports: rep.slice(0, 5).map(dailyRow),
    lpmbPending: lpmb.filter(l => l.pengajarId === t.id && l.status === 'menunggu_acc').map(lpmbRow)
  };
};
actions['guru.students'] = (data, user) => {
  const t = teacherForUser(user);
  if (!t) throw apiError('Data pengajar tidak ditemukan.', 'NOT_FOUND');
  return {
    students: studentsForTeacher(t),
    teacher: { nama: t.nama, area: t.area || '', fotoUrl: t.fotoUrl || '' }
  };
};
actions['absensi.list'] = (data, user) => {
  const t = teacherForUser(user);
  let rows = attendance.filter(a => a.pengajarId === (t ? t.id : a.pengajarId)).map(attRow);
  if (data.periode) rows = rows.filter(r => r.tanggal.slice(0, 7) === data.periode);
  rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return { attendance: rows };
};
actions['absensi.save'] = (data, user) => {
  const e = enrById(data.enrollmentId);
  if (!e) throw apiError('Pendaftaran tidak ditemukan.', 'NOT_FOUND');
  let a = attendance.find(x => x.enrollmentId === e.id && x.tanggal === data.tanggal);
  if (!a) {
    a = { id: nextId('ATT'), enrollmentId: e.id, anakId: e.anakId, pengajarId: e.pengajarId, tanggal: data.tanggal };
    attendance.push(a);
  }
  const fotoUrl = upload(data.foto) || a.fotoUrl || '';
  if (data.status === 'hadir' && !fotoUrl) {
    throw apiError('Foto absensi wajib diambil atau diunggah untuk status hadir.', 'VALIDATION');
  }
  Object.assign(a, {
    status: data.status, jam: data.jam || '', fotoUrl: fotoUrl, catatan: data.catatan || '',
    updatedAt: new Date().toISOString()
  });
  return { ok: true, attendance: attRow(a) };
};
actions['harian.save'] = (data, user) => {
  const e = enrById(data.enrollmentId);
  if (!e) throw apiError('Pendaftaran tidak ditemukan.', 'NOT_FOUND');
  let r = reports.find(x => x.enrollmentId === e.id && x.tanggal === data.tanggal);
  if (!r) {
    r = {
      id: nextId('DR'), enrollmentId: e.id, anakId: e.anakId, pengajarId: e.pengajarId,
      tanggal: data.tanggal, fotoUrls: [], videoUrls: [], createdAt: new Date().toISOString()
    };
    reports.push(r);
  }
  Object.assign(r, {
    materi: data.materi, capaian: data.capaian, catatan: data.catatan || '',
    fotoUrls: (data.foto || []).map(upload).filter(Boolean),
    videoUrls: (data.video || []).map(upload).filter(Boolean),
    parafUrl: upload(data.paraf) || r.parafUrl || '',
    updatedAt: new Date().toISOString()
  });
  return { ok: true, report: dailyRow(r) };
};
actions['lpmb.save'] = (data, user) => {
  const t = teacherForUser(user);
  let l = lpmb.find(x => x.anakId === data.anakId && x.periode === data.periode);
  if (!l) {
    l = {
      id: nextId('LPMB'), anakId: data.anakId, pengajarId: t ? t.id : '', periode: data.periode,
      createdAt: new Date().toISOString()
    };
    lpmb.push(l);
  }
  if (l.status === 'disetujui') throw apiError('Rapor yang sudah disetujui tidak dapat diubah.', 'CONFLICT');
  Object.assign(l, {
    tanggal: data.tanggal, nilai: data.nilai, catatan: data.catatan, rekomendasi: data.rekomendasi || '',
    parafGuruUrl: upload(data.paraf) || l.parafGuruUrl || '', status: data.status || 'draft',
    updatedAt: new Date().toISOString()
  });
  return { ok: true, lpmb: lpmbRow(l) };
};
actions['guru.profile'] = (data, user) => {
  const t = teacherForUser(user);
  Object.assign(user, {
    nama: data.nama, phone: data.phone || '', email: data.email || '', alamat: data.alamat || '',
    fotoUrl: upload(data.foto) || user.fotoUrl || ''
  });
  if (t) {
    Object.assign(t, {
      nama: data.nama, phone: data.phone || '', email: data.email || '', spesialisasi: data.spesialisasi || '',
      area: data.area || '', fotoUrl: upload(data.foto) || t.fotoUrl || '', ttdUrl: upload(data.ttd) || t.ttdUrl || ''
    });
    user.ttdUrl = t.ttdUrl;
  }
  return { ok: true, user: publicUser(user) };
};

/* ---------- orang tua ---------- */
actions['dashboard.ortu'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id);
  let activeId = String(data.anakId || '');
  if (!activeId || !kids.some(c => String(c.id) === activeId)) activeId = kids[0] ? String(kids[0].id) : '';
  let ov = null, recent = [], att = [], ls = [], bs = [];
  if (activeId) {
    const c = kids.find(x => String(x.id) === activeId);
    ov = overview(c);
    recent = reports.filter(r => r.anakId === activeId).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5).map(dailyRow);
    att = attendance.filter(a => a.anakId === activeId).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5).map(attRow);
    ls = lpmb.filter(l => l.anakId === activeId && l.status === 'disetujui').sort((a, b) => b.periode.localeCompare(a.periode)).map(lpmbRow);
    bs = bills.filter(b => b.anakId === activeId).sort((a, b) => b.periode.localeCompare(a.periode)).map(billRow);
  }
  return {
    bimbel: bimbel(), role: 'ortu', children: kids, activeChildId: activeId,
    overview: ov, reports: recent, attendance: att, lpmb: ls, bills: bs,
    unpaid: bs.filter(b => Number(b.sisa || 0) > 0),
    menu: menuFor(kids)
  };
};
actions['ortu.children'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id);
  return {
    children: kids.map(c => Object.assign({}, c, overview(c).child ? {} : {})),
    menus: menuFor(kids)
  };
};
actions['ortu.child.save'] = (data, user) => {
  let c = data.id ? childById(data.id) : null;
  if (data.id && (!c || c.ortuId !== user.id)) throw apiError('Data anak tidak ditemukan.', 'NOT_FOUND');
  if (!c) {
    c = { id: nextId('CH'), ortuId: user.id, status: 'aktif', fotoUrl: '', fotoRumahUrl: '', createdAt: new Date().toISOString() };
    children.push(c);
  }
  Object.assign(c, {
    nama: data.nama, panggilan: data.panggilan || '', gender: data.gender, tglLahir: data.tglLahir,
    sekolah: data.sekolah || '', kelas: data.kelas || '', catatan: data.catatan || '',
    alamatRumah: data.alamatRumah || '', rumahLat: data.rumahLat || '', rumahLng: data.rumahLng || '',
    fotoUrl: upload(data.foto) || c.fotoUrl || '',
    fotoRumahUrl: upload(data.fotoRumah) || c.fotoRumahUrl || '',
    updatedAt: new Date().toISOString()
  });
  return { ok: true, child: c };
};
actions['ortu.slots'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id && c.status !== 'nonaktif');
  const res = buildSlots(data.paketId);
  return {
    slots: res.slots, paket: res.paket,
    children: kids.map(c => {
      const e = enrollments.find(x => x.anakId === c.id && x.status === 'aktif');
      return {
        id: c.id, nama: c.nama, panggilan: c.panggilan, fotoUrl: c.fotoUrl,
        paketAktif: e ? ((pkgById(e.paketId) || {}).nama || '') : ''
      };
    })
  };
};
actions['ortu.enroll'] = (data, user) => {
  const c = childById(data.anakId);
  if (!c || c.ortuId !== user.id) throw apiError('Data anak tidak ditemukan.', 'NOT_FOUND');
  if (c.status === 'nonaktif') throw apiError('Data anak sudah nonaktif. Hubungi admin terlebih dahulu.', 'VALIDATION');
  const current = enrollments.find(x => x.anakId === c.id && x.status === 'aktif');
  if (current) {
    const pkg = pkgById(current.paketId);
    throw apiError('Anak masih memiliki paket aktif' + (pkg ? ' (' + pkg.nama + ')' : '') +
      '. Paket baru dapat ditambahkan setelah paket sebelumnya selesai.', 'CONFLICT');
  }
  const resolved = resolveSlots(data.paketId, data);
  const e = createEnrollment(c, resolved);
  const bill = addBillFor(e, PERIOD);
  bill.catatan = 'Pendaftaran paket ' + resolved.pkg.nama;
  return { ok: true, enrollment: enrollDetail(e), bill: billRow(bill) };
};
actions['ortu.profile'] = (data, user) => {
  if (!data.nama) throw apiError('Nama wajib diisi.', 'VALIDATION');
  Object.assign(user, {
    nama: data.nama, phone: data.phone || '', email: data.email || '', alamat: data.alamat || '',
    fotoUrl: upload(data.foto) || user.fotoUrl || '', updatedAt: new Date().toISOString()
  });
  return { ok: true, user: publicUser(user) };
};
actions['ortu.attendance'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id);
  const ids = kids.map(c => c.id);
  let rows = attendance.filter(a => ids.indexOf(a.anakId) !== -1);
  if (data.anakId) rows = rows.filter(a => a.anakId === data.anakId);
  rows = rows.map(attRow).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return {
    attendance: rows, children: kids.map(childLite),
    summary: {
      hadir: rows.filter(r => r.status === 'hadir').length, izin: rows.filter(r => r.status === 'izin').length,
      sakit: rows.filter(r => r.status === 'sakit').length, alpha: rows.filter(r => r.status === 'alpha').length
    }
  };
};
actions['ortu.daily'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id);
  const ids = kids.map(c => c.id);
  let rows = reports.filter(r => ids.indexOf(r.anakId) !== -1);
  if (data.anakId) rows = rows.filter(r => r.anakId === data.anakId);
  if (data.periode) rows = rows.filter(r => r.tanggal.slice(0, 7) === data.periode);
  rows = rows.map(dailyRow).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return { reports: rows, children: kids.map(childLite) };
};
actions['ortu.lpmb'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id);
  const ids = kids.map(c => c.id);
  let all = lpmb.filter(l => ids.indexOf(l.anakId) !== -1);
  if (data.anakId) all = all.filter(l => l.anakId === data.anakId);
  const approved = all.filter(l => l.status === 'disetujui').sort((a, b) => b.periode.localeCompare(a.periode));
  return {
    lpmb: approved.map(lpmbRow), pendingCount: all.filter(l => l.status === 'menunggu_acc').length,
    children: kids.map(childLite), bimbel: bimbel()
  };
};
actions['ortu.bills'] = (data, user) => {
  const kids = children.filter(c => c.ortuId === user.id);
  const ids = kids.map(c => c.id);
  let rows = bills.filter(b => ids.indexOf(b.anakId) !== -1);
  if (data.anakId) rows = rows.filter(b => b.anakId === data.anakId);
  rows.sort((a, b) => b.periode.localeCompare(a.periode));
  const rowsR = rows.map(billRow);
  return {
    bills: rowsR,
    summary: {
      total: sum(rows, 'jumlah'), paid: rows.reduce((s, b) => s + billPaid(b), 0),
      outstanding: rows.reduce((s, b) => s + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0)
    },
    children: kids.map(childLite),
    enrollments: kids.map(c => enrollDetail(enrollments.find(e => e.anakId === c.id && e.status === 'aktif'))).filter(Boolean),
    rekening: settings.rekening, bimbel: bimbel()
  };
};
actions['ortu.bayar'] = (data, user) => {
  const b = bills.find(x => x.id === data.id);
  if (!b) throw apiError('Tagihan tidak ditemukan.', 'NOT_FOUND');
  if (b.ortuId !== user.id) throw apiError('Tagihan ini bukan milik akun Anda.', 'FORBIDDEN');
  const sisa = Math.max(0, Number(b.jumlah || 0) - billPaid(b));
  if (sisa <= 0) throw apiError('Tagihan ini sudah lunas.', 'CONFLICT');
  if (!data.bukti) throw apiError('Unggah bukti pembayaran terlebih dahulu.', 'VALIDATION');
  if (payments.some(p => p.billId === b.id && p.status === 'menunggu_verifikasi')) {
    throw apiError('Bukti pembayaran sebelumnya masih menunggu verifikasi admin.', 'CONFLICT');
  }
  let jumlah = data.jumlah === undefined || data.jumlah === '' ? sisa : Number(data.jumlah);
  if (!isFinite(jumlah) || jumlah <= 0) throw apiError('Nominal pembayaran tidak valid.', 'VALIDATION');
  if (jumlah > sisa) jumlah = sisa;
  const now = new Date().toISOString();
  payments.push({
    id: nextId('PY'), billId: b.id, anakId: b.anakId, ortuId: b.ortuId, jumlah: jumlah,
    metode: data.metode || 'transfer', buktiUrl: upload(data.bukti), catatan: data.catatan || '',
    status: 'menunggu_verifikasi', tanggalBayar: TODAY, verifiedAt: '', verifiedBy: '',
    createdAt: now, updatedAt: now
  });
  b.status = 'menunggu_verifikasi'; b.buktiUrl = upload(data.bukti); b.metode = data.metode || 'transfer';
  b.catatan = data.catatan || ''; b.tanggalBayar = TODAY; b.updatedAt = now;
  return { ok: true, bill: billRow(b) };
};

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json' };

function sendJSON(res, code, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' });
    res.end();
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 40 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      let body;
      try { body = JSON.parse(raw || '{}'); } catch (e) { return sendJSON(res, 400, { ok: false, error: 'JSON tidak valid.', code: 'BAD_REQUEST' }); }
      const action = body.action;
      const fn = actions[action];
      if (!fn) return sendJSON(res, 404, { ok: false, error: 'Aksi mock belum tersedia: ' + action, code: 'NOT_FOUND' });
      let user = null;
      if (!/^(public\.|auth\.login|auth\.register)/.test(action)) {
        user = userFromToken(body.token);
        if (!user) return sendJSON(res, 200, { ok: false, error: 'Sesi berakhir. Silakan masuk kembali.', code: 'UNAUTH' });
        if (user.status !== 'aktif') return sendJSON(res, 200, { ok: false, error: 'Akun dinonaktifkan.', code: 'UNAUTH' });
      }
      try {
        const data = fn(body.data || {}, user, body.token) || {};
        if (data && data.ok === false) delete data.ok;
        sendJSON(res, 200, { ok: true, data: data });
      } catch (err) {
        sendJSON(res, 200, { ok: false, error: err.message || 'Terjadi kesalahan.', code: err.code || 'ERROR' });
      }
    });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); res.end(); return; }
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.toLowerCase().startsWith(ROOT.toLowerCase())) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('BMK mock server: http://localhost:' + PORT);
  console.log('Akun: admin/admin123 · guru1/guru123 · ortu1/ortu123');
});

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

function splitAreas(v) {
  const seen = new Set();
  return String(v == null ? '' : v).split(/[;|\n]+/).map(s => s.trim()).filter(s => {
    const k = s.toLowerCase();
    if (!s || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function joinAreas(v) { return splitAreas(v).join(', '); }
function storeAreas(v) { return splitAreas(v).join(' | '); }

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
  bimbelNama: 'Bimba Matahari Kecil',
  bimbelTagline: 'Learning and playing.',
  bimbelAlamat: 'Jl. Melati No. 12, Sukamaju, Bandung',
  bimbelPhone: '081234567890',
  bimbelEmail: 'halo@mataharikecil.id',
  jamOperasional: 'Senin–Sabtu, 08.00–18.00',
  tahunAjaran: '2026/2027',
  rekening: 'BCA 1234567890 a.n. Bimba Matahari Kecil',
  waAdmin: '081234567890',
  jatuhTempoHari: '10',
  maxSesiPendaftaran: '3',
  appUrl: 'https://matahari-kecil-official.github.io/',
  logoUrl: '/assets/img/logo-bimba.png',
  ttdAdminUrl: sig('Admin Bimba'),
  waToken: 'mock-fonnte-token-123',
  waEnabled: '1'
};

const users = [
  { id: 'USR-ADM', role: 'admin', username: 'admin', nama: 'Mustiono', phone: '081200000001', email: 'admin@mataharikecil.id', password: 'admin123', status: 'aktif', fotoUrl: svg('M', '#f5a524', '#543400'), ttdUrl: sig('Mustiono'), alamat: 'Jl. Melati No. 12, Bandung', createdAt: stamp(-220), lastLogin: stamp(0) },
  { id: 'USR-G1', role: 'guru', username: 'guru1', nama: 'Rani Puspita', phone: '081200000002', email: 'rani@mataharikecil.id', password: 'guru123', status: 'aktif', fotoUrl: svg('RP', '#cde8d8', '#0f5a4e'), ttdUrl: sig('Rani'), alamat: 'Jl. Kenanga No. 4, Bandung', createdAt: stamp(-180), lastLogin: stamp(-1) },
  { id: 'USR-G2', role: 'guru', username: 'guru2', nama: 'Dimas Pratama', phone: '081200000003', email: 'dimas@mataharikecil.id', password: 'guru123', status: 'aktif', fotoUrl: svg('DP', '#d9e5fa', '#284a8a'), ttdUrl: sig('Dimas'), alamat: 'Jl. Anggrek No. 8, Bandung', createdAt: stamp(-150), lastLogin: stamp(-2) },
  { id: 'USR-O1', role: 'ortu', username: 'ortu1', nama: 'Siti Rahmawati', phone: '081200000004', email: 'siti.rahma@mail.com', password: 'ortu123', status: 'aktif', fotoUrl: svg('SR', '#f3e3c8', '#7a4a00'), alamat: 'Jl. Dahlia No. 21, Sukamaju, Bandung', pekerjaan: 'Guru TK', createdAt: stamp(-140), lastLogin: stamp(0) },
  { id: 'USR-O2', role: 'ortu', username: 'ortu2', nama: 'Hendra Wijaya', phone: '081200000005', email: 'hendra@mail.com', password: 'ortu123', status: 'aktif', fotoUrl: svg('HW', '#e6ddf6', '#5a3a8a'), alamat: 'Jl. Cempaka No. 7, Bandung', pekerjaan: 'Wiraswasta', createdAt: stamp(-120), lastLogin: stamp(-4) }
];

const teachers = [
  { id: 'T1', userId: 'USR-G1', nama: 'Rani Puspita', phone: '081200000002', email: 'rani@mataharikecil.id', spesialisasi: 'Calistung & Matematika SD', area: 'Sukamaju · Bandung Utara', tarifPerSesi: 75000, fotoUrl: users[1].fotoUrl, ttdUrl: users[1].ttdUrl, status: 'aktif', createdAt: stamp(-180), updatedAt: stamp(-2) },
  { id: 'T2', userId: 'USR-G2', nama: 'Dimas Pratama', phone: '081200000003', email: 'dimas@mataharikecil.id', spesialisasi: 'Bahasa Inggris & Sains', area: 'Cempaka · Bandung Tengah', tarifPerSesi: 65000, fotoUrl: users[2].fotoUrl, ttdUrl: users[2].ttdUrl, status: 'aktif', createdAt: stamp(-150), updatedAt: stamp(-3) }
];

const children = [
  { id: 'CH1', ortuId: 'USR-O1', nama: 'Aisyah Putri Rahmawati', panggilan: 'Aisyah', gender: 'perempuan', tglLahir: '2018-04-12', sekolah: 'SDN Sukamaju 2', kelas: '2 SD', fotoUrl: svg('Aisyah', '#f6dfc8', '#7a4a00'), catatan: 'Perlu penguatan membaca lancar dan berhitung.', alamatRumah: 'Jl. Dahlia No. 21, Sukamaju, Bandung', rumahLat: '-6.8957', rumahLng: '107.6160', fotoRumahUrl: svg('Rumah Aisyah', '#f3e3c8', '#7a4a00'), status: 'aktif', createdAt: stamp(-130), updatedAt: stamp(-5) },
  { id: 'CH2', ortuId: 'USR-O1', nama: 'Bima Ardi Rahmawati', panggilan: 'Bima', gender: 'laki', tglLahir: '2019-09-03', sekolah: 'SDN Sukamaju 2', kelas: '1 SD', fotoUrl: svg('Bima', '#d9e5fa', '#284a8a'), catatan: 'Mudah bosan, perlu variasi aktivitas.', alamatRumah: 'Jl. Dahlia No. 21, Sukamaju, Bandung', rumahLat: '-6.8957', rumahLng: '107.6160', fotoRumahUrl: svg('Rumah Bima', '#f3e3c8', '#7a4a00'), status: 'aktif', createdAt: stamp(-100), updatedAt: stamp(-6) },
  { id: 'CH3', ortuId: 'USR-O2', nama: 'Nadia Wijaya', panggilan: 'Nadia', gender: 'perempuan', tglLahir: '2017-11-21', sekolah: 'SD Santo Yusuf', kelas: '3 SD', fotoUrl: svg('Nadia', '#e6ddf6', '#5a3a8a'), catatan: '', alamatRumah: 'Jl. Cempaka No. 7, Bandung', rumahLat: '-6.9025', rumahLng: '107.6187', fotoRumahUrl: svg('Rumah Nadia', '#e6ddf6', '#5a3a8a'), status: 'aktif', createdAt: stamp(-90), updatedAt: stamp(-7) },
  { id: 'CH4', ortuId: 'USR-O1', nama: 'Sandi Sanjaya', panggilan: 'Sandi', gender: 'laki', tglLahir: '2018-02-14', sekolah: 'SDN Sukamaju 2', kelas: '2 SD', fotoUrl: svg('Sandi', '#dcefe8', '#0f5a4e'), catatan: 'Jadwal malam dua sesi berurutan.', alamatRumah: 'Jl. Dahlia No. 21, Sukamaju, Bandung', rumahLat: '-6.8957', rumahLng: '107.6160', fotoRumahUrl: svg('Rumah Sandi', '#f3e3c8', '#7a4a00'), status: 'aktif', createdAt: stamp(-80), updatedAt: stamp(-4) }
];

const packages = [
  { id: 'PKG1', nama: 'Reguler Calistung', sesiPerBulan: 8, durasiMenit: 90, harga: 450000, deskripsi: 'Pendampingan membaca, menulis, dan berhitung dua kali seminggu.', aktif: true, createdAt: stamp(-200) },
  { id: 'PKG2', nama: 'Privat Fokus', sesiPerBulan: 4, durasiMenit: 60, harga: 600000, deskripsi: 'Sesi privat intensif sesuai kebutuhan belajar anak.', aktif: true, createdAt: stamp(-190) },
  { id: 'PKG3', nama: 'Intensif Ujian', sesiPerBulan: 12, durasiMenit: 120, harga: 750000, deskripsi: 'Persiapan ulangan dan pendampingan belajar intensif.', aktif: true, createdAt: stamp(-100) },
  { id: 'PKG4', nama: 'Kelas Demo', sesiPerBulan: 1, durasiMenit: 60, harga: 0, deskripsi: 'Sesi percobaan gratis untuk calon siswa.', aktif: true, createdAt: stamp(-80) }
];

const slots = [
  { id: 'SL1', paketId: 'PKG1', pengajarId: 'T1', hari: 'Senin', jamMulai: '15:00', jamSelesai: '16:30', kuota: 1, status: 'terisi', anakId: 'CH1' },
  { id: 'SL2', paketId: 'PKG1', pengajarId: 'T1', hari: 'Rabu', jamMulai: '15:00', jamSelesai: '16:30', kuota: 1, status: 'terisi', anakId: 'CH2' },
  { id: 'SL3', paketId: 'PKG1', pengajarId: 'T2', hari: 'Selasa', jamMulai: '16:00', jamSelesai: '17:30', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL4', paketId: 'PKG2', pengajarId: 'T2', hari: 'Kamis', jamMulai: '16:00', jamSelesai: '17:00', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL5', paketId: 'PKG2', pengajarId: 'T1', hari: 'Jumat', jamMulai: '15:30', jamSelesai: '16:30', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL6', paketId: 'PKG3', pengajarId: 'T2', hari: 'Sabtu', jamMulai: '09:00', jamSelesai: '11:00', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL7', paketId: 'PKG3', pengajarId: 'T1', hari: 'Senin', jamMulai: '17:00', jamSelesai: '19:00', kuota: 1, status: 'tersedia', anakId: '' },
  { id: 'SL8', paketId: 'PKG1', pengajarId: 'T1', hari: TODAY_NAME, jamMulai: '22:00', jamSelesai: '22:30', kuota: 1, status: 'terisi', anakId: 'CH4' },
  { id: 'SL9', paketId: 'PKG1', pengajarId: 'T1', hari: TODAY_NAME, jamMulai: '23:00', jamSelesai: '23:30', kuota: 1, status: 'terisi', anakId: 'CH4' },
  { id: 'SL10', paketId: 'PKG4', pengajarId: 'T2', hari: 'Senin', jamMulai: '13:00', jamSelesai: '14:00', kuota: 1, status: 'tersedia', anakId: '' }
];

const enrollments = [
  { id: 'EN1', anakId: 'CH1', ortuId: 'USR-O1', paketId: 'PKG1', slotId: 'SL1', slotIds: 'SL1', pengajarId: 'T1', tanggalMulai: monthShift(-3, 1), sesiTerpakai: 2, status: 'aktif', selesaiAt: '', createdAt: stamp(-130) },
  { id: 'EN2', anakId: 'CH2', ortuId: 'USR-O1', paketId: 'PKG1', slotId: 'SL2', slotIds: 'SL2', pengajarId: 'T1', tanggalMulai: monthShift(-2, 1), sesiTerpakai: 1, status: 'aktif', selesaiAt: '', createdAt: stamp(-100) },
  { id: 'EN3', anakId: 'CH3', ortuId: 'USR-O2', paketId: 'PKG2', slotId: 'SL4', slotIds: 'SL4', pengajarId: 'T2', tanggalMulai: monthShift(-1, 1), sesiTerpakai: 1, status: 'aktif', selesaiAt: '', createdAt: stamp(-90) },
  { id: 'EN4', anakId: 'CH4', ortuId: 'USR-O1', paketId: 'PKG1', slotId: 'SL8', slotIds: 'SL8,SL9', pengajarId: 'T1', tanggalMulai: monthShift(-1, 5), sesiTerpakai: 0, status: 'aktif', selesaiAt: '', createdAt: stamp(-70) }
];

const attendance = [
  { id: 'ATT1', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: TODAY, status: 'hadir', jam: '15:05', fotoUrl: svg('Absensi Aisyah', '#cde8d8', '#0f5a4e'), catatan: 'Membaca suku kata dan penjumlahan.' },
  { id: 'ATT2', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(3), status: 'hadir', jam: '15:02', fotoUrl: svg('Absensi Aisyah', '#cde8d8', '#0f5a4e'), catatan: 'Latihan menulis tegak bersambung.' },
  { id: 'ATT3', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(7), status: 'izin', jam: '15:00', fotoUrl: '', catatan: 'Izin acara keluarga.' },
  { id: 'ATT4', enrollmentId: 'EN2', anakId: 'CH2', pengajarId: 'T1', tanggal: daysAgo(1), status: 'hadir', jam: '15:10', fotoUrl: svg('Absensi Bima', '#d9e5fa', '#284a8a'), catatan: 'Mengenal huruf dan angka.' },
  { id: 'ATT5', enrollmentId: 'EN2', anakId: 'CH2', pengajarId: 'T1', tanggal: daysAgo(5), status: 'sakit', jam: '15:00', fotoUrl: '', catatan: 'Demam, istirahat di rumah.' },
  { id: 'ATT6', enrollmentId: 'EN3', anakId: 'CH3', pengajarId: 'T2', tanggal: daysAgo(2), status: 'hadir', jam: '16:03', fotoUrl: svg('Absensi Nadia', '#e6ddf6', '#5a3a8a'), catatan: 'Latihan percakapan bahasa Inggris.' },
  { id: 'ATT7', enrollmentId: 'EN1', anakId: 'CH1', pengajarId: 'T1', tanggal: daysAgo(28), status: 'hadir', jam: '15:06', fotoUrl: svg('Absensi Aisyah', '#cde8d8', '#0f5a4e'), catatan: 'Evaluasi bulan lalu.' },
  { id: 'ATT8', enrollmentId: 'EN4', anakId: 'CH4', pengajarId: 'T1', tanggal: TODAY, slotId: 'SL8', status: 'hadir', jam: '22:05', fotoUrl: svg('Absensi Sandi sesi 1', '#dcefe8', '#0f5a4e'), catatan: 'Sesi malam pertama.' },
  { id: 'ATT9', enrollmentId: 'EN4', anakId: 'CH4', pengajarId: 'T1', tanggal: TODAY, slotId: 'SL9', status: 'hadir', jam: '23:03', fotoUrl: svg('Absensi Sandi sesi 2', '#dcefe8', '#0f5a4e'), catatan: 'Sesi malam kedua.' }
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
  { id: 'DR7', enrollmentId: 'EN3', anakId: 'CH3', pengajarId: 'T2', tanggal: daysAgo(2), materi: 'Percakapan perkenalan dalam bahasa Inggris.', capaian: 'Nadia mampu memperkenalkan diri dengan percaya diri.', catatan: '', fotoUrls: [svg('Nadia belajar', '#e6ddf6', '#5a3a8a')], videoUrls: [], parafUrl: sig('Dimas'), createdAt: stamp(-2), updatedAt: stamp(-2) },
  { id: 'DR8', enrollmentId: 'EN4', anakId: 'CH4', pengajarId: 'T1', tanggal: TODAY, slotId: 'SL8', materi: 'Membaca nyaring dan latihan konsentrasi sesi malam pertama.', capaian: 'Sandi mampu membaca kalimat pendek tanpa bantuan.', catatan: 'Sesi pertama dari dua jadwal malam.', fotoUrls: [svg('Sesi malam Sandi', '#dcefe8', '#0f5a4e')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(0), updatedAt: stamp(0) },
  { id: 'DR9', enrollmentId: 'EN4', anakId: 'CH4', pengajarId: 'T1', tanggal: TODAY, slotId: 'SL9', materi: 'Latihan menulis dan bercerita pada sesi malam kedua.', capaian: 'Sandi menulis lima kata sederhana dan bercerita urut.', catatan: 'Sesi kedua dari dua jadwal malam.', fotoUrls: [svg('Sesi kedua Sandi', '#e6ddf6', '#5a3a8a')], videoUrls: [], parafUrl: sig('Rani'), createdAt: stamp(0), updatedAt: stamp(0) }
];

const lpmb = [
  { id: 'LPMB1', anakId: 'CH1', pengajarId: 'T1', periode: PREV, tanggal: monthShift(-1, 28), nilai: nilai(82, 80, 78, 85, 90, 84), catatan: 'Aisyah menunjukkan kemajuan stabil pada kemampuan membaca dan sikap belajar yang baik.', rekomendasi: 'Lanjutkan latihan membaca nyaring dan berhitung setiap hari.', parafGuruUrl: sig('Rani'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-10), approvedBy: 'Mustiono', catatanAdmin: 'Rapor sudah lengkap, disetujui.', createdAt: stamp(-14), updatedAt: stamp(-10) },
  { id: 'LPMB2', anakId: 'CH1', enrollmentId: 'EN1', pengajarId: 'T1', periode: PERIOD, tanggal: TODAY, nilai: nilai(86, 84, 82, 88, 92, 87), catatan: 'Perkembangan sangat baik pada kelancaran membaca dan kemandirian belajar.', rekomendasi: 'Berikan bahan bacaan tingkat lanjut dan latihan soal cerita.', parafGuruUrl: sig('Rani'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-1), approvedBy: 'Mustiono', catatanAdmin: 'Disetujui.', createdAt: stamp(-1), updatedAt: stamp(0) },
  { id: 'LPMB3', anakId: 'CH2', enrollmentId: 'EN2', pengajarId: 'T1', periode: PERIOD, tanggal: TODAY, nilai: nilai(74, 72, 76, 78, 84, 80), catatan: 'Bima mulai mengenal huruf dengan baik dan lebih fokus saat belajar.', rekomendasi: 'Variasi aktivitas belajar agar tidak cepat bosan.', parafGuruUrl: sig('Rani'), status: 'menunggu_acc', ttdAdminUrl: '', approvedAt: '', approvedBy: '', catatanAdmin: '', createdAt: stamp(-2), updatedAt: stamp(-1) },
  { id: 'LPMB4', anakId: 'CH3', enrollmentId: 'EN3', pengajarId: 'T2', periode: PERIOD, tanggal: TODAY, nilai: nilai(88, 85, 84, 89, 90, 86), catatan: 'Nadia percaya diri berbicara bahasa Inggris dan aktif bertanya.', rekomendasi: 'Latihan percakapan singkat setiap hari.', parafGuruUrl: sig('Dimas'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-1), approvedBy: 'Mustiono', catatanAdmin: 'Disetujui.', createdAt: stamp(-1), updatedAt: stamp(-1) },
  { id: 'LPMB5', anakId: 'CH4', enrollmentId: 'EN4', pengajarId: 'T1', periode: PERIOD, tanggal: TODAY, nilai: nilai(78, 76, 74, 80, 85, 79), catatan: 'Sandi mengikuti dua sesi malam dengan semangat dan menunjukkan kemajuan membaca serta menulis.', rekomendasi: 'Jaga rutinitas dua sesi dan beri waktu istirahat cukup.', parafGuruUrl: sig('Rani'), status: 'disetujui', ttdAdminUrl: sig('Admin Bimba'), approvedAt: stamp(-1), approvedBy: 'Mustiono', catatanAdmin: 'Disetujui.', createdAt: stamp(-1), updatedAt: stamp(0) }
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
  { id: 'SAL1', pengajarId: 'T1', enrollmentId: 'EN1', periode: PERIOD, jumlahSesi: 2, tarif: 0, bonus: 0, potongan: 0, total: 450000, status: 'belum', rincianJson: '', slipNo: 'SLP-' + PERIOD.replace('-', '') + '-T1', tanggalBayar: '', catatan: 'Paket Aisyah sudah ACC.', createdAt: stamp(-2), updatedAt: stamp(0) },
  { id: 'SAL2', pengajarId: 'T2', enrollmentId: 'EN3', periode: PERIOD, jumlahSesi: 1, tarif: 0, bonus: 0, potongan: 0, total: 600000, status: 'belum', rincianJson: '', slipNo: 'SLP-' + PERIOD.replace('-', '') + '-T2', tanggalBayar: '', catatan: '', createdAt: stamp(-2), updatedAt: stamp(-2) },
  { id: 'SAL3', pengajarId: 'T1', enrollmentId: 'EN1', periode: PREV, jumlahSesi: 1, tarif: 0, bonus: 0, potongan: 0, total: 450000, status: 'dibayar', rincianJson: '', slipNo: 'SLP-' + PREV.replace('-', '') + '-T1', tanggalBayar: PREV + '-28', catatan: '', createdAt: stamp(-25), updatedAt: stamp(-24) }
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
      spesialisasi: t ? t.spesialisasi : '', area: t ? joinAreas(t.area) : '',
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
  const pkg = pkgById(e.paketId) || null;
  const sesiPaket = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
  const sesiHadir = hadirCount(e.id);
  return {
    id: e.id, anakId: e.anakId, ortuId: e.ortuId, paketId: e.paketId, slotId: e.slotId,
    slotIds: slotIdsOf(e), pengajarId: e.pengajarId, tanggalMulai: e.tanggalMulai, status: e.status,
    sesiTerpakai: Number(e.sesiTerpakai || 0), selesaiAt: e.selesaiAt || '', pengajarChangedAt: e.pengajarChangedAt || '',
    sesiPaket: sesiPaket, sesiHadir: sesiHadir, sesiSisa: Math.max(0, sesiPaket - sesiHadir),
    paket: pkg, slot: list[0] || null, slots: list,
    pengajar: teacherById(e.pengajarId) || null,
    jadwalTeks: jadwalTeks(list)
  };
}
function dailyRow(r) {
  const child = childById(r.anakId);
  const parent = child ? userById(child.ortuId) : null;
  const e = enrById(r.enrollmentId);
  const pkg = e ? pkgById(e.paketId) : null;
  const slot = (r.slotId && slotById(r.slotId)) || (e ? slotById(e.slotId) : null);
  return Object.assign({}, r, {
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
    pengajarNama: teacherName(r.pengajarId), paketNama: pkg ? pkg.nama : '',
    jadwalTeks: slot ? slot.hari + ', ' + slot.jamMulai + '–' + slot.jamSelesai : (e ? jadwalTeks(enrollmentSlots(e)) : '')
  });
}
function lpmbBills(l) {
  const enr = enrollmentForLpmb(l);
  return bills.filter(b => {
    if (b.anakId !== l.anakId) return false;
    if (enr) return b.enrollmentId === enr.id || (b.paketId === enr.paketId && b.periode === l.periode);
    return b.periode === l.periode;
  });
}
function lpmbOutstanding(l) {
  return lpmbBills(l).reduce((sum, b) => sum + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0);
}
function lpmbRow(l) {
  const child = childById(l.anakId);
  const parent = child ? userById(child.ortuId) : null;
  const enr = enrollmentForLpmb(l);
  const pkg = enr ? pkgById(enr.paketId) : null;
  const sisa = lpmbOutstanding(l);
  return Object.assign({}, l, {
    enrollmentId: l.enrollmentId || '',
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    gender: child ? child.gender : '', kelas: child ? child.kelas : '', sekolah: child ? child.sekolah : '',
    ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
    pengajarNama: teacherName(l.pengajarId),
    paketId: enr ? enr.paketId : '', paketNama: pkg ? pkg.nama : '',
    biayaSelesai: sisa <= 0, biayaSisa: sisa
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
  const slot = (a.slotId && slotById(a.slotId)) || (e ? slotById(e.slotId) : null);
  return {
    id: a.id, enrollmentId: a.enrollmentId, anakId: a.anakId, pengajarId: a.pengajarId, slotId: a.slotId || '',
    tanggal: a.tanggal, status: a.status, jam: a.jam, fotoUrl: a.fotoUrl, catatan: a.catatan,
    createdAt: a.createdAt, updatedAt: a.updatedAt,
    anakNama: child ? child.nama : '', anakFoto: child ? child.fotoUrl : '',
    pengajarNama: teacherName(a.pengajarId), paketNama: pkg ? pkg.nama : '',
    jadwalTeks: slot ? slot.hari + ', ' + slot.jamMulai + '–' + slot.jamSelesai : (e ? jadwalTeks(enrollmentSlots(e)) : '')
  };
}
function salaryItemSubtotal(it) {
  if (!it) return 0;
  if (it.subtotal != null) return Number(it.subtotal || 0);
  return Number(it.sesiHadir || 0) * Number(it.tarif || 0);
}
function enrollmentForLpmb(l, teacherId) {
  if (!l) return null;
  if (l.enrollmentId) {
    const direct = enrById(l.enrollmentId);
    if (direct) return direct;
  }
  const tid = teacherId || l.pengajarId;
  const list = enrollments
    .filter(e => e.anakId === l.anakId && e.pengajarId === tid)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const when = String(l.createdAt || l.tanggal || '');
  return list.find(e => String(e.createdAt || '') <= when) || list[0] || null;
}
function hadirCount(enrollmentId) {
  return attendance.filter(a => a.enrollmentId === enrollmentId && a.status === 'hadir').length;
}
function sessionCompleted(e) {
  if (!e) return false;
  if (String(e.status) === 'selesai') return true;
  const pkg = pkgById(e.paketId);
  const target = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
  return target > 0 && hadirCount(e.id) >= target;
}
function sessionEnded(e) {
  if (!sessionCompleted(e)) return false;
  let last = '';
  attendance.forEach(a => {
    if (a.enrollmentId !== e.id || a.status !== 'hadir') return;
    const t = String(a.tanggal || '').slice(0, 10);
    if (t > last) last = t;
  });
  return !!last && last < TODAY;
}
function salaryEntries(teacherId, periode) {
  const approved = [], pending = [];
  lpmb.filter(l => l.pengajarId === teacherId && l.periode === periode).forEach(l => {
    const e = enrollmentForLpmb(l, teacherId);
    if (!e) return;
    const c = childById(e.anakId);
    const pkg = pkgById(e.paketId);
    const harga = pkg ? Number(pkg.harga || 0) : 0;
    const it = {
      enrollmentId: e.id, anakId: e.anakId, anakNama: c ? c.nama : 'Siswa', anakFoto: c ? c.fotoUrl : '',
      paketId: e.paketId, paketNama: pkg ? pkg.nama : '', sesiPaket: pkg ? Number(pkg.sesiPerBulan || 0) : 0,
      sesiHadir: hadirCount(e.id), hargaPaket: harga, tarif: 0, subtotal: harga,
      lpmbId: l.id, lpmbStatus: l.status, lpmbPeriode: l.periode, tanggalLpmb: l.tanggal || ''
    };
    if (l.status === 'disetujui') approved.push(it); else pending.push(it);
  });
  const byName = (a, b) => String(a.anakNama).localeCompare(String(b.anakNama));
  approved.sort(byName); pending.sort(byName);
  return { approved, pending, jumlahPaket: approved.length };
}
function salaryDetail(s) {
  if (s.rincianJson) {
    try {
      const p = JSON.parse(s.rincianJson);
      if (p && Array.isArray(p.approved)) return { approved: p.approved, pending: Array.isArray(p.pending) ? p.pending : [] };
    } catch (e) { /* abaikan */ }
  }
  const br = salaryEntries(s.pengajarId, s.periode);
  if (s.enrollmentId) {
    return {
      approved: br.approved.filter(it => it.enrollmentId === s.enrollmentId),
      pending: br.pending.filter(it => it.enrollmentId === s.enrollmentId)
    };
  }
  return { approved: br.approved, pending: br.pending };
}
function salaryRow(s) {
  const t = teacherById(s.pengajarId);
  const detail = salaryDetail(s);
  const status = s.status === 'menunggu_acc' && detail.approved.length ? 'belum' : s.status;
  const single = detail.approved.length === 1 ? detail.approved[0] : null;
  return Object.assign({}, s, {
    status: status,
    enrollmentId: s.enrollmentId || (single ? single.enrollmentId || '' : ''),
    anakNama: single ? single.anakNama || '' : '',
    paketNama: single ? single.paketNama || '' : '',
    sesiHadir: single ? Number(single.sesiHadir || 0) : 0,
    sesiPaket: single ? Number(single.sesiPaket || 0) : 0,
    pengajarNama: t ? t.nama : '', pengajarFoto: t ? t.fotoUrl : '',
    spesialisasi: t ? t.spesialisasi : '', periodeLabel: s.periode === PERIOD ? 'Bulan ini' : s.periode,
    rincian: detail, jumlahAnak: detail.approved.length, jumlahPaket: detail.approved.length,
    honor: detail.approved.reduce((s, it) => s + salaryItemSubtotal(it), 0),
    menungguAcc: detail.pending.length,
    bisaBayar: s.status !== 'dibayar' && detail.approved.length > 0
  });
}
function childLite(c) { return { id: c.id, nama: c.nama }; }

function studentsForTeacher(t) {
  return enrollments.filter(e => e.pengajarId === t.id && e.status === 'aktif' && !sessionEnded(e)).map(e => {
    const c = childById(e.anakId);
    const pkg = pkgById(e.paketId);
    const list = enrollmentSlots(e);
    const parent = c ? userById(c.ortuId) : null;
    const todaySlots = list.filter(s => s.hari === TODAY_NAME);
    const firstSlotId = todaySlots[0] ? todaySlots[0].id : '';
    const bySlot = {};
    attendance.filter(a => a.enrollmentId === e.id && a.tanggal === TODAY).forEach(a => {
      const sid = String(a.slotId || '') || firstSlotId;
      if (sid && !bySlot[sid]) bySlot[sid] = a;
    });
    const sesiPaket = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
    const sesiHadir = hadirCount(e.id);
    return {
      id: c.id, enrollmentId: e.id, nama: c.nama, fotoUrl: c.fotoUrl, paketNama: pkg ? pkg.nama : '',
      sesiPaket: sesiPaket, sesiHadir: sesiHadir, sesiSisa: Math.max(0, sesiPaket - sesiHadir),
      jadwalTeks: jadwalTeks(list), hari: list[0] ? list[0].hari : '',
      days: list.map(s => s.hari),
      slots: list.map(s => ({ slotId: s.id, hari: s.hari, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai })),
      absensiHariIni: todaySlots.map(sl => {
        const a = bySlot[sl.id];
        if (!a) return null;
        const row = attRow(a);
        row.slotId = sl.id;
        return row;
      }).filter(Boolean),
      hariIni: todaySlots.length > 0, kelas: c.kelas,
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
function nextSchedule(slotOrSlots, attendanceRecords) {
  const list = Array.isArray(slotOrSlots) ? slotOrSlots : (slotOrSlots ? [slotOrSlots] : []);
  const recs = (attendanceRecords || []).map(r => {
    if (r && typeof r === 'object') return { tanggal: String(r.tanggal || '').slice(0, 10), slotId: String(r.slotId || '') };
    return { tanggal: String(r || '').slice(0, 10), slotId: '' };
  }).filter(r => !!r.tanggal);
  const firstSlotIdOn = dayName => {
    const s = list.find(x => x.hari === dayName);
    return s ? String(s.id || '') : '';
  };
  const slotRecorded = (dateStr, slot) => {
    const slotId = String(slot.id || '');
    return recs.some(r => r.tanggal === dateStr && (r.slotId === slotId || (!r.slotId && slotId === firstSlotIdOn(slot.hari))));
  };
  const candidates = [];
  list.forEach(s => {
    const idx = HARI.indexOf(s.hari);
    if (idx === -1) return;
    const d = new Date(now);
    const diff = (idx - d.getDay() + 7) % 7;
    const parts = String(s.jamMulai || '00:00').split(':');
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, Number(parts[0] || 0), Number(parts[1] || 0), 0, 0);
    if (diff === 0 && target <= now) target.setDate(target.getDate() + 7);
    let guard = 0;
    while (slotRecorded(iso(target), s) && guard < 8) { target.setDate(target.getDate() + 7); guard += 1; }
    candidates.push({ tanggal: iso(target), hari: s.hari, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai });
  });
  candidates.sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  return candidates[0] || null;
}
function overview(child) {
  const e = enrollments.find(x => x.anakId === child.id && x.status === 'aktif') || null;
  const att = attendance.filter(a => a.anakId === child.id && a.tanggal.slice(0, 7) === PERIOD);
  const rs = reports.filter(r => r.anakId === child.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const ls = lpmb.filter(l => l.anakId === child.id).sort((a, b) => String(b.periode).localeCompare(String(a.periode)) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
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
    nextSchedule: e && !sessionCompleted(e) ? nextSchedule(enrollmentSlots(e), attendance.filter(a => a.anakId === child.id).map(a => ({ tanggal: a.tanggal, slotId: a.slotId || '' }))) : null
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
  if (u.status === 'pending') throw apiError('Akun Anda menunggu persetujuan admin Bimba. Silakan coba masuk kembali setelah mendapat kabar.', 'PENDING');
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
function packageEndDate(e) {
  const pkg = e ? pkgById(e.paketId) : null;
  const total = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
  if (!e || !total) return '';
  const list = enrollmentSlots(e);
  if (!list.length) return '';
  const remaining = total - hadirCount(e.id);
  if (remaining <= 0) return TODAY;
  const start = new Date((e.tanggalMulai || TODAY) + 'T00:00:00');
  const t = new Date(TODAY + 'T00:00:00');
  const base = start > t ? start : t;
  const baseDay = base.getDay();
  const dates = [];
  list.forEach(s => {
    const di = HARI.indexOf(s.hari);
    if (di === -1) return;
    let first = (di - baseDay + 7) % 7;
    if (first === 0) {
      const parts = String(s.jamMulai || '00:00').split(':');
      const slotMs = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(parts[0] || 0), Number(parts[1] || 0)).getTime();
      if (slotMs <= now.getTime()) first = 7;
    }
    for (let w = 0; w < 104; w++) {
      dates.push(new Date(base.getFullYear(), base.getMonth(), base.getDate() + first + w * 7).getTime());
    }
  });
  if (!dates.length) return '';
  dates.sort((a, b) => a - b);
  const end = dates[Math.min(remaining, dates.length) - 1];
  return end ? iso(new Date(end)) : '';
}
function billDue(e, periode) {
  const end = packageEndDate(e);
  if (!end) return (periode || PERIOD) + '-' + pad(Number(settings.jatuhTempoHari || 10));
  const d = new Date(end + 'T00:00:00');
  d.setDate(d.getDate() - 3);
  const due = iso(d);
  return due < TODAY ? TODAY : due;
}
function addBillFor(enr, periode) {
  const pkg = pkgById(enr.paketId);
  const due = billDue(enr, periode || PERIOD);
  const row = {
    id: nextId('B'), anakId: enr.anakId, ortuId: enr.ortuId, paketId: enr.paketId, enrollmentId: enr.id,
    periode: periode || PERIOD, jumlah: pkg ? pkg.harga : 0, dibayar: 0, jatuhTempo: due, status: 'belum',
    tanggalBayar: '', metode: '', buktiUrl: '', catatan: '', waSentAt: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  bills.push(row);
  return row;
}
bills.forEach(b => {
  const e = b.enrollmentId ? enrById(b.enrollmentId) : null;
  if (e) b.jatuhTempo = billDue(e, b.periode);
});
function slotTaken(s) {
  return !!s && (s.status === 'terisi' || !!s.anakId);
}
function slotOverlaps(a, b) {
  return a.hari === b.hari &&
    timeMinutes(a.jamMulai) < timeMinutes(b.jamSelesai) &&
    timeMinutes(b.jamMulai) < timeMinutes(a.jamSelesai);
}
function buildSlots(paketId) {
  const pkg = pkgById(paketId);
  if (!pkg) throw apiError('Paket tidak ditemukan.', 'NOT_FOUND');
  const takenAll = slots.filter(slotTaken);
  return {
    slots: slots.filter(s => s.paketId === pkg.id && s.status !== 'nonaktif').map(s => {
      const t = teacherById(s.pengajarId);
      const taken = slotTaken(s);
      const clash = taken ? null : takenAll.filter(o => o.id !== s.id && o.pengajarId === s.pengajarId && slotOverlaps(o, s))[0];
      const clashPkg = clash ? pkgById(clash.paketId) : null;
      return {
        id: s.id, hari: s.hari, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai,
        pengajarId: s.pengajarId, pengajarNama: teacherName(s.pengajarId),
        pengajarArea: t ? joinAreas(t.area) : '', pengajarAreas: t ? splitAreas(t.area) : [],
        pengajarSpesialisasi: t ? (t.spesialisasi || '') : '',
        pengajarFoto: t ? (t.fotoUrl || '') : '', terisi: taken,
        bentrok: !!clash, bentrokPaket: clashPkg ? clashPkg.nama : '',
        bentrokPaketDemo: clashPkg ? /demo/i.test(String(clashPkg.nama || '')) : false,
        status: taken ? 'terisi' : (clash ? 'bentrok' : 'tersedia')
      };
    }),
    paket: pkg
  };
}
function timeMinutes(hhmm) {
  const p = String(hhmm || '0:0').split(':');
  return Number(p[0] || 0) * 60 + Number(p[1] || 0);
}
function maxSesiPendaftaran() {
  const n = Math.round(Number(settings.maxSesiPendaftaran || 3));
  return Number.isFinite(n) && n >= 1 ? Math.min(7, n) : 3;
}
function resolveSlots(paketId, data) {
  const raw = Array.isArray(data.slotIds) ? data.slotIds : (data.slotId ? [data.slotId] : []);
  const ids = raw.map(v => String(v || '').trim()).filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
  if (!ids.length) throw apiError('Pilih minimal satu jadwal belajar.', 'VALIDATION');
  if (ids.length > maxSesiPendaftaran()) throw apiError('Maksimal ' + maxSesiPendaftaran() + ' sesi belajar dalam satu pendaftaran.', 'VALIDATION');
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
  const chosen = new Set(list.map(s => s.id));
  const takenElse = slots.filter(slotTaken);
  list.forEach(s => {
    const clash = takenElse.filter(o => !chosen.has(o.id) && o.pengajarId === s.pengajarId && slotOverlaps(o, s))[0];
    if (!clash) return;
    const clashPkg = pkgById(clash.paketId);
    const teacher = teacherById(s.pengajarId);
    throw apiError('Jadwal ' + s.hari + ' ' + s.jamMulai + '–' + s.jamSelesai + ' tidak tersedia karena ' +
      (teacher ? teacher.nama : 'pengajar') + ' sudah terisi' +
      (clashPkg ? ' (paket ' + clashPkg.nama + ')' : '') +
      ' pada jam tersebut. Silakan pilih jam lain.', 'SLOT_TAKEN');
  });
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
  return { bimbel: bimbel(), stats: { siswa: children.length, pengajar: teachers.filter(t => t.status === 'aktif').length, paket: aktif.length }, paket: aktif, maxSesiPendaftaran: maxSesiPendaftaran() };
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
    status: 'pending', fotoUrl: '', alamat: '', pekerjaan: String(acc.pekerjaan || '').trim(), createdAt: new Date().toISOString(), lastLogin: ''
  };
  users.push(u);
  const c = {
    id: nextId('CH'), ortuId: u.id, nama: String(child.nama || '').trim(), panggilan: child.panggilan || '',
    gender: child.gender || 'laki', tglLahir: child.tglLahir || '', sekolah: child.sekolah || '', kelas: child.kelas || '',
    catatan: child.catatan || '', alamatRumah: child.alamatRumah || '', rumahLat: child.rumahLat || '',
    rumahLng: child.rumahLng || '', fotoRumahUrl: '', fotoUrl: '', status: 'pending',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  children.push(c);
  const e = createEnrollment(c, resolved);
  e.status = 'pending';
  return { pending: true, message: 'Pendaftaran diterima. Akun akan aktif setelah disetujui admin Bimba.' };
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
  const scheduledToday = active.filter(e => !sessionEnded(e) && enrollmentSlots(e).some(s => s.hari === TODAY_NAME));
  const scheduledIds = new Set(scheduledToday.map(e => e.id));
  const attScheduled = att.filter(a => scheduledIds.has(a.enrollmentId));
  const firstByEnrollment = {};
  attScheduled.slice().sort((a, b) => String(a.jam || '').localeCompare(String(b.jam || ''))).forEach(a => {
    if (!firstByEnrollment[a.enrollmentId]) firstByEnrollment[a.enrollmentId] = a;
  });
  const attRecorded = Object.keys(firstByEnrollment).map(k => firstByEnrollment[k]);
  return {
    bimbel: bimbel(), role: 'admin', periode: PERIOD,
    stats: {
      siswa: children.filter(c => c.status === 'aktif').length,
      pengajar: teachers.filter(t => t.status === 'aktif').length,
      paket: aktif.length, enrollmentAktif: active.length,
      jadwalHariIni: scheduledToday.length,
      tagihanBulan: sum(monthBills, 'jumlah'),
      tagihanLunas: monthBills.reduce((s, b) => s + billPaid(b), 0),
      outstanding: monthBills.reduce((s, b) => s + Math.max(0, Number(b.jumlah || 0) - billPaid(b)), 0),
      tagihanCount: monthBills.length,
      tagihanLunasCount: monthBills.filter(b => billPaid(b) >= Number(b.jumlah || 0)).length,
      menungguVerifikasi: pBills.length,
      hadirHariIni: attRecorded.filter(a => a.status === 'hadir').length,
      absenHariIni: attRecorded.length,
      laporanHariIni: rep.length,
      lpmbMenunggu: pLpmb.length
    },
    attendanceToday: {
      hadir: attRecorded.filter(a => a.status === 'hadir').length, izin: attRecorded.filter(a => a.status === 'izin').length,
      sakit: attRecorded.filter(a => a.status === 'sakit').length, alpha: attRecorded.filter(a => a.status === 'alpha').length,
      belum: Math.max(0, scheduledToday.length - attRecorded.length)
    },
    students: active.map(e => {
      const c = childById(e.anakId); const p = c ? userById(c.ortuId) : null;
      const pkg = pkgById(e.paketId); const s = slotById(e.slotId);
      const allSlots = enrollmentSlots(e);
      const sesiPaket = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
      const sesiHadir = hadirCount(e.id);
      return {
        enrollmentId: e.id, id: c.id, nama: c.nama, panggilan: c.panggilan, fotoUrl: c.fotoUrl, kelas: c.kelas,
        ortuNama: p ? p.nama : '', ortuPhone: p ? p.phone : '', paketNama: pkg ? pkg.nama : '',
        sesiPaket: sesiPaket, sesiHadir: sesiHadir, sesiSisa: Math.max(0, sesiPaket - sesiHadir),
        pengajarNama: teacherName(e.pengajarId), jadwalTeks: jadwalTeks(allSlots) || (s ? s.hari + ', ' + s.jamMulai + '–' + s.jamSelesai : ''),
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
    const sesiPaket = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
    const sesiHadir = e ? hadirCount(e.id) : 0;
    const unpaid = bills.filter(b => b.anakId === c.id && billPaid(b) < Number(b.jumlah || 0));
    return Object.assign({}, c, {
      ortuNama: parent ? parent.nama : '', ortuPhone: parent ? parent.phone : '',
      ortuUsername: parent ? parent.username : '', enrollmentId: e ? e.id : '',
      paketNama: pkg ? pkg.nama : '',
      sesiPaket: sesiPaket, sesiHadir: sesiHadir, sesiSisa: Math.max(0, sesiPaket - sesiHadir),
      jadwalTeks: s ? s.hari + ', ' + s.jamMulai + '–' + s.jamSelesai : '',
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
      area: joinAreas(t.area), areas: splitAreas(t.area),
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
    area: storeAreas(data.area), tarifPerSesi: Number(data.tarifPerSesi || 0), status: data.status || 'aktif', updatedAt: new Date().toISOString(),
    fotoUrl: upload(data.foto) || t.fotoUrl || '', ttdUrl: upload(data.ttd) || t.ttdUrl || ''
  });
  return { ok: true, teacher: Object.assign({}, t, { area: joinAreas(t.area), areas: splitAreas(t.area) }) };
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
actions['jadwal.list'] = () => {
  const takenAll = slots.filter(slotTaken);
  return {
    slots: slots.map(s => {
      const c = s.anakId ? childById(s.anakId) : null;
      const taken = slotTaken(s);
      const clash = taken ? null : takenAll.filter(o => o.id !== s.id && o.pengajarId === s.pengajarId && slotOverlaps(o, s))[0];
      const clashPkg = clash ? pkgById(clash.paketId) : null;
      return Object.assign({}, s, {
        paketNama: (pkgById(s.paketId) || {}).nama || '', pengajarNama: teacherName(s.pengajarId),
        anakNama: c ? c.nama : '',
        status: taken ? 'terisi' : (s.status === 'nonaktif' ? 'nonaktif' : (clash ? 'terisi' : 'tersedia')),
        terisi: taken,
        bentrok: !!clash, bentrokPaket: clashPkg ? clashPkg.nama : ''
      });
    }),
    packages: packages.map(p => ({ id: p.id, nama: p.nama, aktif: p.aktif })),
    teachers: teachers.map(t => ({ id: t.id, nama: t.nama }))
  };
};
actions['jadwal.save'] = data => {
  let s = data.id ? slotById(data.id) : null;
  if (data.id && !s) throw apiError('Jadwal tidak ditemukan.', 'NOT_FOUND');
  const oldPkg = s ? pkgById(s.paketId) : null;
  const pkg = pkgById(data.paketId) || {};
  if (s && /demo/i.test(String((oldPkg || {}).nama || '')) && s.paketId !== data.paketId) {
    throw apiError('Jenis paket pada jadwal demo tidak dapat diubah. Pengajar, hari, jam, dan kuota tetap dapat diperbarui.', 'FORBIDDEN');
  }
  if (s && /demo/i.test(String(pkg.nama || '')) && s.paketId !== data.paketId) {
    throw apiError('Jadwal tidak dapat dipindahkan ke paket demo.', 'FORBIDDEN');
  }
  const taken = !!s && slotTaken(s);
  if (taken && s.paketId !== data.paketId) {
    throw apiError('Paket pada jadwal yang sedang dipakai siswa tidak dapat diubah.', 'CONFLICT');
  }
  const newStatus = taken ? 'terisi' : (data.status === 'nonaktif' ? 'nonaktif' : 'tersedia');
  if (taken && newStatus === 'nonaktif') throw apiError('Jadwal sedang dipakai siswa. Lepaskan siswa terlebih dahulu.', 'CONFLICT');

  const enrollment = taken ? enrollments.find(e => slotIdsOf(e).indexOf(String(s.id)) !== -1) : null;
  const ownIds = enrollment ? slotIdsOf(enrollment) : (s ? [String(s.id)] : []);
  const ownSet = {};
  ownIds.forEach(id => { ownSet[String(id)] = true; });
  const siblings = ownIds.filter(id => String(id) !== String(s.id)).map(slotById).filter(Boolean);
  const movingTeacher = !!enrollment && String(s.pengajarId) !== String(data.pengajarId);
  const candidate = { hari: data.hari, jamMulai: data.jamMulai, jamSelesai: data.jamSelesai, pengajarId: data.pengajarId };
  const takenAll = slots.filter(slotTaken);
  let clash = null;
  for (const o of takenAll) {
    if (ownSet[String(o.id)] || String(o.pengajarId) !== String(data.pengajarId)) continue;
    if (slotOverlaps(o, candidate)) { clash = { busy: o, target: candidate }; break; }
  }
  if (!clash && movingTeacher) {
    for (const sib of siblings) {
      for (const o of takenAll) {
        if (ownSet[String(o.id)] || String(o.pengajarId) !== String(data.pengajarId)) continue;
        if (slotOverlaps(o, sib)) { clash = { busy: o, target: sib }; break; }
      }
      if (clash) break;
    }
  }
  if (clash) {
    const busyPkg = pkgById(clash.busy.paketId);
    throw apiError('Jadwal ' + clash.target.hari + ' ' + clash.target.jamMulai + '–' + clash.target.jamSelesai + ' bentrok: ' +
      teacherName(data.pengajarId) + ' sudah mengajar paket ' + ((busyPkg || {}).nama || 'lain') + ' pada ' +
      clash.busy.hari + ' ' + clash.busy.jamMulai + '–' + clash.busy.jamSelesai +
      '. Pilih hari, jam, atau pengajar lain yang masih kosong.', 'SLOT_TAKEN');
  }
  if (enrollment) {
    for (const sib of siblings) {
      if (slotOverlaps(sib, candidate)) {
        throw apiError('Jadwal ' + data.hari + ' ' + data.jamMulai + '–' + data.jamSelesai + ' bertabrakan dengan sesi lain anak ini (' +
          sib.hari + ' ' + sib.jamMulai + '–' + sib.jamSelesai + '). Pilih jam berbeda.', 'SESSION_OVERLAP');
      }
    }
  }
  const dup = slots.find(x => x !== s && x.paketId === data.paketId && x.pengajarId === data.pengajarId &&
    x.hari === data.hari && x.jamMulai === data.jamMulai && x.jamSelesai === data.jamSelesai);
  if (dup) {
    throw apiError('Jadwal ' + data.hari + ' ' + data.jamMulai + '–' + data.jamSelesai + ' untuk ' + teacherName(data.pengajarId) +
      ' pada paket ' + (pkg.nama || '') + ' sudah ada. Gunakan jadwal tersebut atau ubah/hapus jadwal lama terlebih dahulu.', 'DUPLICATE');
  }
  if (!s) { s = { id: nextId('SL'), anakId: '' }; slots.push(s); }
  Object.assign(s, {
    paketId: data.paketId, pengajarId: data.pengajarId, hari: data.hari,
    jamMulai: data.jamMulai, jamSelesai: data.jamSelesai, kuota: Number(data.kuota || 1),
    status: newStatus
  });
  if (taken && movingTeacher) {
    const stamp = new Date().toISOString();
    siblings.forEach(sib => { sib.pengajarId = data.pengajarId; });
    enrollment.pengajarId = data.pengajarId;
    enrollment.pengajarChangedAt = stamp;
    lpmb.filter(l => l.anakId === enrollment.anakId && l.status !== 'disetujui')
      .forEach(l => { l.pengajarId = data.pengajarId; });
  }
  return { ok: true, slot: s, pengajarDipindah: !!(taken && movingTeacher) };
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
function lpmbCandidates(t) {
  const hadir = {};
  attendance.forEach(a => {
    if (a.status !== 'hadir') return;
    const k = String(a.enrollmentId || '');
    if (k) hadir[k] = (hadir[k] || 0) + 1;
  });
  const out = [];
  enrollments.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).forEach(e => {
    if (t && e.pengajarId !== t.id) return;
    const pkg = pkgById(e.paketId);
    const target = pkg ? Number(pkg.sesiPerBulan || 0) : 0;
    const h = hadir[e.id] || 0;
    if (e.status !== 'selesai' && !(target > 0 && h >= target)) return;
    const c = childById(e.anakId);
    if (!c) return;
    const rapor = lpmb.find(l => {
      if (l.anakId !== e.anakId || l.pengajarId !== e.pengajarId) return false;
      if (l.enrollmentId) return l.enrollmentId === e.id;
      const legacy = enrollmentForLpmb(l);
      return !!legacy && legacy.id === e.id;
    }) || null;
    if (rapor && rapor.status === 'disetujui') return;
    out.push({
      id: c.id, nama: c.nama, fotoUrl: c.fotoUrl, kelas: c.kelas, sekolah: c.sekolah,
      paketNama: pkg ? pkg.nama : '', jadwalTeks: jadwalTeks(enrollmentSlots(e)),
      enrollmentId: e.id, selesai: true, selesaiAt: e.selesaiAt || '',
      sesiPaket: target, sesiHadir: h,
      lpmbId: rapor ? rapor.id : '', lpmbStatus: rapor ? rapor.status : ''
    });
  });
  return out;
}
actions['lpmb.list'] = (data, user) => {
  const t = teacherForUser(user);
  let rows = lpmb.map(lpmbRow);
  if (t) rows = rows.filter(r => r.pengajarId === t.id);
  if (data && data.status) rows = rows.filter(r => r.status === data.status);
  if (data && data.anakId) rows = rows.filter(r => r.anakId === data.anakId);
  if (data && data.periode) rows = rows.filter(r => r.periode === data.periode);
  rows.sort((a, b) => b.periode.localeCompare(a.periode));
  return { lpmb: rows, pending: rows.filter(r => r.status === 'menunggu_acc').length, filters: { children: lpmbCandidates(t) } };
};
actions['lpmb.approve'] = (data, user) => {
  const l = lpmb.find(x => x.id === data.id);
  if (!l) throw apiError('Rapor tidak ditemukan.', 'NOT_FOUND');
  if (data.action === 'approve') {
    const sisa = lpmbOutstanding(l);
    if (sisa > 0) {
      throw apiError('Rapor belum dapat disetujui. Orang tua belum menyelesaikan pembayaran (sisa Rp ' +
        Math.round(sisa).toLocaleString('id-ID') +
        '). Verifikasi pembayaran di menu Biaya Les hingga lunas terlebih dahulu.', 'PAYMENT_REQUIRED');
    }
    l.status = 'disetujui'; l.ttdAdminUrl = user.ttdUrl || settings.ttdAdminUrl;
    l.approvedAt = new Date().toISOString(); l.approvedBy = user.nama;
    const e = enrollmentForLpmb(l);
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
  const enr = b.enrollmentId ? enrById(b.enrollmentId) : enrollments.find(x => x.anakId === b.anakId && x.status === 'aktif');
  Object.assign(b, {
    periode: data.periode, jumlah: jumlah,
    jatuhTempo: data.jatuhTempo || billDue(enr, data.periode),
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
  let list;
  if (ids.length) {
    list = ids.map(id => bills.find(x => x.id === id)).filter(Boolean);
  } else if (data.periode && data.periode !== 'semua') {
    const today = new Date().toISOString().slice(0, 10);
    list = bills.filter(b => b.periode === data.periode && ['belum', 'sebagian', 'ditolak'].indexOf(b.status) !== -1 && b.jatuhTempo && String(b.jatuhTempo).slice(0, 10) <= today);
  } else {
    list = [];
  }
  if (!list.length) throw apiError('Tidak ada tagihan jatuh tempo berstatus belum bayar, dibayar sebagian, atau ditolak untuk dikirim.', 'VALIDATION');
  const results = list.map(b => {
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
    if (!br.approved.length) return;
    const rows = salaries.filter(s => s.pengajarId === t.id && s.periode === periode);
    const byEnrollment = {};
    const covered = {};
    rows.forEach(s => {
      if (s.enrollmentId) {
        byEnrollment[String(s.enrollmentId)] = s;
        return;
      }
      salaryDetail(s).approved.forEach(it => {
        if (it.lpmbId) covered['L' + it.lpmbId] = true;
        if (it.enrollmentId) covered['E' + it.enrollmentId] = true;
      });
    });
    br.approved.forEach(it => {
      const enrId = String(it.enrollmentId || '');
      const existing = enrId ? byEnrollment[enrId] : null;
      if (existing) {
        if (existing.status === 'dibayar') { skipped++; return; }
        existing.jumlahSesi = Number(it.sesiHadir || 0);
        existing.tarif = 0;
        existing.total = salaryItemSubtotal(it) + Number(existing.bonus || 0) - Number(existing.potongan || 0);
        existing.status = 'belum';
        existing.rincianJson = JSON.stringify({ approved: [it], pending: [] });
        existing.updatedAt = new Date().toISOString();
        updated++;
        return;
      }
      if (covered['L' + it.lpmbId] || covered['E' + it.enrollmentId]) { skipped++; return; }
      salaries.push({
        id: nextId('SAL'), pengajarId: t.id, enrollmentId: enrId, periode: periode,
        jumlahSesi: Number(it.sesiHadir || 0), tarif: 0, bonus: 0, potongan: 0,
        total: salaryItemSubtotal(it), status: 'belum',
        rincianJson: JSON.stringify({ approved: [it], pending: [] }),
        slipNo: 'SLP-' + periode.replace('-', '') + '-' + (salaries.filter(s => s.periode === periode).length + 1),
        tanggalBayar: '', catatan: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      created++;
    });
  });
  return {
    created: created, updated: updated, skipped: skipped,
    pending: pendingChildren
  };
};
actions['gaji.update'] = data => {
  const s = salaries.find(x => x.id === data.id);
  if (!s) throw apiError('Slip tidak ditemukan.', 'NOT_FOUND');
  if (s.status === 'dibayar' && (data.bonus !== undefined || data.potongan !== undefined)) {
    throw apiError('Slip yang sudah dibayar tidak dapat diubah nominalnya.', 'CONFLICT');
  }
  const detail = salaryDetail(s);
  const honor = detail.approved.reduce((n, it) => n + salaryItemSubtotal(it), 0);
  s.bonus = data.bonus !== undefined ? Number(data.bonus || 0) : Number(s.bonus || 0);
  s.potongan = data.potongan !== undefined ? Number(data.potongan || 0) : Number(s.potongan || 0);
  s.catatan = data.catatan || '';
  s.total = honor + s.bonus - s.potongan;
  s.updatedAt = new Date().toISOString();
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
  s.status = 'dibayar';
  s.tanggalBayar = data.tanggalBayar || TODAY;
  s.updatedAt = new Date().toISOString();
  s.rincianJson = JSON.stringify({ approved: detail.approved, pending: [] });
  return { ok: true, salary: salaryRow(s) };
};
actions['settings.get'] = () => ({
  settings: settings, bimbel: bimbel(),
  wa: { configured: !!settings.waToken, enabled: settings.waEnabled === '1', masked: settings.waToken ? settings.waToken.slice(0, 4) + '…' + settings.waToken.slice(-3) : '' },
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/mock-bimbel-matahari-kecil',
  defaultPasswordWarning: users.find(u => u.id === 'USR-ADM').password === 'admin123'
});
actions['settings.saveBimbel'] = data => {
  const keys = ['bimbelNama', 'bimbelTagline', 'bimbelAlamat', 'bimbelPhone', 'bimbelEmail', 'jamOperasional', 'tahunAjaran', 'rekening', 'waAdmin', 'jatuhTempoHari', 'appUrl'];
  keys.forEach(k => { if (data[k] !== undefined) settings[k] = String(data[k]); });
  if (data.maxSesiPendaftaran !== undefined) {
    const n = Math.round(Number(data.maxSesiPendaftaran));
    if (!Number.isFinite(n) || n < 1 || n > 7) throw apiError('Batas sesi per pendaftaran harus antara 1 dan 7.', 'VALIDATION');
    settings.maxSesiPendaftaran = String(n);
  }
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
(() => {
  const MB = 1024 * 1024;
  let orphansFiles = 37;
  let orphansBytes = Math.round(1.42 * 1024 * MB);
  let uploadFiles = 812;
  let uploadBytes = Math.round(2.35 * 1024 * MB);
  const folderBase = [
    { name: 'Laporan Harian', files: 512, bytes: Math.round(1.58 * 1024 * MB) },
    { name: 'Laporan Harian (video)', files: 24, bytes: Math.round(0.41 * 1024 * MB) },
    { name: 'Absensi', files: 246, bytes: Math.round(0.22 * 1024 * MB) },
    { name: 'Bukti Pembayaran', files: 96, bytes: Math.round(0.09 * 1024 * MB) },
    { name: 'Tanda Tangan', files: 18, bytes: Math.round(0.01 * 1024 * MB) }
  ];
  function storagePayload(clean) {
    let cleaned = null;
    if (clean && orphansFiles) {
      cleaned = { files: orphansFiles, bytes: orphansBytes, failed: 0, remaining: 0 };
      uploadFiles -= orphansFiles;
      uploadBytes -= orphansBytes;
      const take = Math.min(folderBase[0].bytes, orphansBytes);
      folderBase[0].bytes -= take;
      folderBase[0].files = Math.max(0, folderBase[0].files - orphansFiles);
      orphansFiles = 0;
      orphansBytes = 0;
    }
    const at = new Date().toISOString();
    return {
      drive: { usedBytes: Math.round(6.1 * 1024 * MB), maxBytes: 15 * 1024 * MB, scopedOnly: false },
      uploads: { files: uploadFiles, bytes: uploadBytes, truncated: false },
      folders: folderBase,
      media: { fotoLaporan: 388, videoLaporan: 24, absensi: 246, bukti: 96, fotoAnak: 28, tandaTangan: 18, lain: 12 },
      orphans: { files: orphansFiles, bytes: orphansBytes, sample: ['Laporan-Harian-20241012-a1b2c3.jpg', 'Absensi-20241015-d4e5f6.jpg'] },
      retentionDays: 14,
      clean: !!cleaned,
      cleaned: cleaned,
      scanAt: at,
      lastScan: { at: at, clean: !!cleaned, orphans: cleaned ? cleaned.files : orphansFiles, orphanBytes: cleaned ? cleaned.bytes : orphansBytes, trashedFiles: cleaned ? cleaned.files : 0, trashedBytes: cleaned ? cleaned.bytes : 0 }
    };
  }
  actions['settings.storage'] = () => storagePayload(false);
  actions['settings.storageCleanup'] = data => storagePayload(!!data.clean);
})();
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
  if (data.pekerjaan !== undefined) u.pekerjaan = String(data.pekerjaan || '').trim();
  if (u.role === 'guru' && !teachers.some(t => t.userId === u.id)) {
    teachers.push({ id: nextId('T'), userId: u.id, nama: u.nama, phone: u.phone, email: u.email, spesialisasi: '', area: storeAreas(data.area), tarifPerSesi: 0, fotoUrl: u.fotoUrl, ttdUrl: '', status: 'aktif', createdAt: new Date().toISOString() });
  }
  return { ok: true, user: publicUser(u) };
};
actions['users.approve'] = data => {
  const u = userById(data.id);
  if (!u || u.role !== 'ortu') throw apiError('Akun orang tua tidak ditemukan.', 'NOT_FOUND');
  if (u.status !== 'pending') throw apiError('Akun ini tidak sedang menunggu persetujuan.', 'VALIDATION');
  const c = children.find(x => x.ortuId === u.id && x.status === 'pending');
  if (!c) throw apiError('Data anak dari pendaftaran ini tidak ditemukan.', 'NOT_FOUND');
  const e = enrollments.find(x => x.anakId === c.id && x.status === 'pending');
  if (!e) throw apiError('Data jadwal dari pendaftaran ini tidak ditemukan.', 'NOT_FOUND');
  const pkg = pkgById(e.paketId);
  if (!pkg) throw apiError('Paket belajar tidak ditemukan.', 'NOT_FOUND');
  slotIdsOf(e).forEach(id => {
    const s = slotById(id);
    if (s && s.anakId && s.anakId !== c.id) throw apiError('Jadwal ' + s.hari + ' ' + s.jamMulai + '–' + s.jamSelesai + ' sudah diambil siswa lain. Atur ulang jadwal terlebih dahulu.', 'SLOT_TAKEN');
  });
  if (!bills.some(b => b.enrollmentId === e.id)) addBillFor(e, PERIOD);
  slotIdsOf(e).forEach(id => {
    const s = slotById(id);
    if (s) { s.status = 'terisi'; s.anakId = c.id; }
  });
  u.status = 'aktif';
  c.status = 'aktif';
  e.status = 'aktif';
  e.tanggalMulai = TODAY;
  return { ok: true, user: publicUser(u) };
};
actions['users.reject'] = data => {
  const u = userById(data.id);
  if (!u || u.role !== 'ortu') throw apiError('Akun orang tua tidak ditemukan.', 'NOT_FOUND');
  if (u.status !== 'pending') throw apiError('Akun ini tidak sedang menunggu persetujuan.', 'VALIDATION');
  const c = children.find(x => x.ortuId === u.id);
  if (c) {
    const e = enrollments.find(x => x.anakId === c.id && x.status === 'pending');
    if (e) {
      freeEnrollmentSlots(e);
      enrollments.splice(enrollments.indexOf(e), 1);
    }
    children.splice(children.indexOf(c), 1);
  }
  users.splice(users.indexOf(u), 1);
  return { ok: true };
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
  if (u.status === 'pending') throw apiError('Akun masih menunggu persetujuan. Gunakan tombol Setujui atau Tolak.', 'VALIDATION');
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
  const list = studentsForTeacher(t).map(s => {
    const todaySlots = s.slots.filter(x => x.hari === TODAY_NAME);
    const firstSlotId = todaySlots[0] ? todaySlots[0].slotId : '';
    const repBySlot = {};
    reports.filter(r => r.enrollmentId === s.enrollmentId && r.tanggal === TODAY).forEach(r => {
      const sid = String(r.slotId || '') || firstSlotId;
      if (sid && !repBySlot[sid]) repBySlot[sid] = r;
    });
    return Object.assign({}, s, {
      absensi: attendanceTodayFor(s.enrollmentId), laporan: reportTodayFor(s.id),
      laporanHariIni: todaySlots.map(sl => {
        const r = repBySlot[sl.slotId];
        if (!r) return null;
        const row = dailyRow(r);
        row.slotId = sl.slotId;
        return row;
      }).filter(Boolean)
    });
  });
  const slotsToday = list.reduce((n, s) => n + s.slots.filter(x => x.hari === TODAY_NAME).length, 0);
  const recordedSessions = list.reduce((n, s) => n + (s.absensiHariIni || []).length, 0);
  const hadirSessions = list.reduce((n, s) => n + (s.absensiHariIni || []).filter(a => a.status === 'hadir').length, 0);
  const reportedSessions = list.reduce((n, s) => n + (s.laporanHariIni || []).length, 0);
  const attMonth = attendance.filter(a => a.pengajarId === t.id && a.status === 'hadir' && a.tanggal.slice(0, 7) === PERIOD);
  const rep = reports.filter(r => r.pengajarId === t.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const [pelYear, pelMonth] = PERIOD.split('-').map(Number);
  const start = new Date(pelYear, pelMonth - 1 - 11, 1);
  const cutoff = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0');
  const slipHistory = salaries
    .filter(s => s.pengajarId === t.id && s.periode >= cutoff && s.periode <= PERIOD)
    .sort((a, b) => b.periode.localeCompare(a.periode))
    .map(salaryRow);
  return {
    hariIni: TODAY_NAME, today: TODAY, periode: PERIOD,
    teacher: t, bimbel: bimbel(),
    stats: {
      siswa: list.length, jadwalHariIni: slotsToday,
      hadirHariIni: hadirSessions,
      belumAbsen: Math.max(0, slotsToday - recordedSessions),
      laporanHariIni: reportedSessions,
      gajiBulan: sum(salaries.filter(s => s.pengajarId === t.id && s.periode === PERIOD), 'total'),
      hadirBulan: attMonth.length,
      lpmbMenunggu: lpmb.filter(l => l.pengajarId === t.id && l.status === 'menunggu_acc').length,
      lpmbDisetujui: lpmb.filter(l => l.pengajarId === t.id && l.status === 'disetujui' && l.periode === PERIOD).length
    },
    students: list,
    salaries: slipHistory,
    recentReports: rep.slice(0, 5).map(dailyRow),
    lpmbPending: lpmb.filter(l => l.pengajarId === t.id && l.status === 'menunggu_acc').map(lpmbRow)
  };
};
actions['guru.students'] = (data, user) => {
  const t = teacherForUser(user);
  if (!t) throw apiError('Data pengajar tidak ditemukan.', 'NOT_FOUND');
  return {
    students: studentsForTeacher(t),
    todayName: TODAY_NAME,
    teacher: { nama: t.nama, area: joinAreas(t.area), fotoUrl: t.fotoUrl || '' }
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
  if ((data.tanggal || TODAY) !== TODAY) throw apiError('Absensi hanya dapat diinput pada hari berlangsung (' + TODAY + ').', 'VALIDATION');
  const slotList = enrollmentSlots(e);
  if (!slotList.length) throw apiError('Jadwal anak belum diatur. Hubungi admin sebelum mencatat absensi.', 'VALIDATION');
  const todaySlots = slotList.filter(t => t.hari === TODAY_NAME);
  if (!todaySlots.length) {
    throw apiError('Absensi hanya dapat diinput pada hari jadwal anak (' + slotList.map(t => t.hari + ', ' + t.jamMulai + '–' + t.jamSelesai).join(' & ') + '). Hari ini ' + TODAY_NAME + '.', 'VALIDATION');
  }
  const slotId = String(data.slotId || '');
  let slot = null;
  if (slotId) {
    slot = todaySlots.find(t => t.id === slotId) || null;
    if (!slot) throw apiError('Jadwal jam yang dipilih bukan jadwal hari ini.', 'VALIDATION');
  } else if (todaySlots.length === 1) {
    slot = todaySlots[0];
  } else {
    throw apiError('Pilih jadwal jam sesi yang akan diabsen.', 'VALIDATION');
  }
  const firstSlotId = todaySlots[0].id;
  let a = attendance.find(x => x.enrollmentId === e.id && x.tanggal === data.tanggal && (String(x.slotId || '') === slot.id || (!x.slotId && slot.id === firstSlotId)));
  if (!a) {
    if (sessionCompleted(e)) throw apiError('Sesi paket anak sudah terpenuhi. Absensi tidak dapat ditambahkan lagi.', 'VALIDATION');
    a = { id: nextId('ATT'), enrollmentId: e.id, anakId: e.anakId, pengajarId: e.pengajarId, tanggal: data.tanggal };
    attendance.push(a);
  }
  const fotoUrl = upload(data.foto) || a.fotoUrl || '';
  if (data.status === 'hadir' && !fotoUrl) {
    throw apiError('Foto absensi wajib diambil atau diunggah untuk status hadir.', 'VALIDATION');
  }
  Object.assign(a, {
    slotId: slot.id, status: data.status, jam: data.jam || '', fotoUrl: fotoUrl, catatan: data.catatan || '',
    updatedAt: new Date().toISOString()
  });
  return { ok: true, attendance: attRow(a) };
};
actions['harian.save'] = (data, user) => {
  const e = enrById(data.enrollmentId);
  if (!e) throw apiError('Pendaftaran tidak ditemukan.', 'NOT_FOUND');
  const tanggal = data.tanggal || TODAY;
  const dayName = HARI[new Date(tanggal + 'T00:00:00').getDay()];
  const daySlots = enrollmentSlots(e).filter(s => s.hari === dayName);
  const slotId = String(data.slotId || '');
  let slot = null;
  if (slotId) {
    slot = daySlots.find(s => s.id === slotId) || null;
    if (!slot) throw apiError('Jadwal jam yang dipilih bukan jadwal pada tanggal laporan.', 'VALIDATION');
  } else if (daySlots.length === 1) {
    slot = daySlots[0];
  } else if (daySlots.length > 1) {
    throw apiError('Pilih jadwal jam sesi untuk laporan ini.', 'VALIDATION');
  }
  const firstSlotId = daySlots[0] ? daySlots[0].id : '';
  let r = reports.find(x => x.enrollmentId === e.id && x.tanggal === tanggal && (!slot || String(x.slotId || '') === slot.id || (!x.slotId && slot.id === firstSlotId)));
  if (!r && sessionEnded(e)) throw apiError('Sesi paket anak sudah terpenuhi. Laporan baru tidak dapat ditambahkan.', 'VALIDATION');
  if (!r) {
    r = {
      id: nextId('DR'), enrollmentId: e.id, anakId: e.anakId, pengajarId: e.pengajarId,
      tanggal: tanggal, slotId: slot ? slot.id : '', fotoUrls: [], videoUrls: [], createdAt: new Date().toISOString()
    };
    reports.push(r);
  }
  Object.assign(r, {
    slotId: slot ? slot.id : (r.slotId || ''),
    materi: data.materi, capaian: data.capaian, catatan: data.catatan || '',
    fotoUrls: (data.foto || []).map(upload).filter(Boolean),
    videoUrls: (data.video || []).slice(0, 1).map(upload).filter(Boolean),
    parafUrl: upload(data.paraf) || r.parafUrl || '',
    updatedAt: new Date().toISOString()
  });
  return { ok: true, report: dailyRow(r) };
};
actions['lpmb.save'] = (data, user) => {
  const t = teacherForUser(user);
  const owned = enrollments
    .filter(e => e.anakId === data.anakId && (!t || e.pengajarId === t.id))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!owned.length) throw apiError('Siswa ini bukan bimbingan Anda.', 'FORBIDDEN');
  let l = data.lpmbId ? (lpmb.find(x => x.id === data.lpmbId) || null) : null;
  if (l && (l.anakId !== data.anakId || (t && l.pengajarId !== t.id))) throw apiError('Rapor tidak ditemukan untuk pengajar ini.', 'NOT_FOUND');
  let target = null;
  if (data.enrollmentId) {
    target = owned.find(e => e.id === data.enrollmentId) || null;
    if (!target) throw apiError('Paket belajar tidak ditemukan.', 'NOT_FOUND');
  } else if (l) {
    target = enrollmentForLpmb(l);
  } else {
    target = owned.find(sessionCompleted) || null;
  }
  if (!l && target) l = lpmb.find(x => String(x.enrollmentId || '') === target.id) || null;
  if (l && l.status === 'disetujui') throw apiError('Rapor paket ini sudah disetujui admin dan tidak dapat diubah.', 'CONFLICT');
  if (!l && (!target || !sessionCompleted(target))) throw apiError('Rapor hanya dapat dibuat untuk anak yang telah menyelesaikan paket belajar.', 'VALIDATION');
  if (!l) {
    l = {
      id: nextId('LPMB'), anakId: data.anakId, enrollmentId: target.id, pengajarId: t ? t.id : '',
      periode: data.periode, createdAt: new Date().toISOString()
    };
    lpmb.push(l);
  }
  const nilai = Object.assign({}, data.nilai || {});
  const extras = [];
  (Array.isArray(data.aspekTambahan) ? data.aspekTambahan : []).slice(0, 6).forEach(x => {
    const label = String((x && x.label) || '').trim();
    const v = Number(x && x.nilai);
    if (!label) throw apiError('Nama aspek tambahan wajib diisi.', 'VALIDATION');
    if (!isFinite(v) || v < 0 || v > 100) throw apiError('Nilai aspek ' + label + ' harus 0–100.', 'VALIDATION');
    if (extras.some(e => e.label.toLowerCase() === label.toLowerCase())) return;
    extras.push({ label: label, nilai: Math.round(v) });
  });
  if (extras.length) nilai.__extra = extras; else delete nilai.__extra;
  Object.assign(l, {
    tanggal: data.tanggal, nilai: nilai, catatan: data.catatan, rekomendasi: data.rekomendasi || '',
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
      area: storeAreas(data.area), fotoUrl: upload(data.foto) || t.fotoUrl || '', ttdUrl: upload(data.ttd) || t.ttdUrl || ''
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
    ls = lpmb.filter(l => l.anakId === activeId && l.status === 'disetujui').sort((a, b) => b.periode.localeCompare(a.periode) || String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).map(lpmbRow);
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
    maxSesiPendaftaran: maxSesiPendaftaran(),
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
  const approved = all.filter(l => l.status === 'disetujui').sort((a, b) => b.periode.localeCompare(a.periode) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
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

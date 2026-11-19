/* Konfigurasi aplikasi — ganti API_URL dengan URL deployment Apps Script Anda. */
window.CONFIG = {
  APP_NAME: 'Bimbel Matahari Kecil',
  APP_TAGLINE: 'Learning and playing.',
  LOGO_URL: 'assets/img/logo-bimba.png',
  API_URL: 'https://script.google.com/macros/s/AKfycbzf70mDTOlTx2EpcIX1_FcJM2SNMU7rTpb0X3pSd4Zsn8PVhQXhvXvU1RwiiXK7OeuKLg/exec',
  LOCAL_API_URL: '/api',
  FONNTE_SITE: 'https://fonnte.com',
  SUPPORT_WA: ''
};

(function () {
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var configured = CONFIG.API_URL && CONFIG.API_URL.indexOf('PASTE_') !== 0;
  CONFIG.IS_LOCAL = isLocal;
  CONFIG.RESOLVED_API = configured ? CONFIG.API_URL : (isLocal ? CONFIG.LOCAL_API_URL : '');
  CONFIG.SHOW_DEMO_ACCOUNTS = isLocal;
  CONFIG.MAX_IMAGE_MB = 8;
  CONFIG.MAX_VIDEO_MB = 20;

  window.BMK = window.BMK || {};
  BMK.const = {
    HARI: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    HARI_SINGKAT: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    BULAN: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    BULAN_SINGKAT: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    ASPECTS: [
      { key: 'membaca', label: 'Membaca & Bahasa', hint: 'Kelancaran membaca, pemahaman bacaan, kosakata' },
      { key: 'menulis', label: 'Menulis', hint: 'Ketepatan menulis, kerapian, menyusun kalimat' },
      { key: 'berhitung', label: 'Berhitung & Logika', hint: 'Operasi hitung, penalaran, pemecahan masalah' },
      { key: 'kognitif', label: 'Daya Ingat & Fokus', hint: 'Konsentrasi, daya ingat, kecepatan memahami' },
      { key: 'sikap', label: 'Sikap & Kedisiplinan', hint: 'Kemandirian, sopan santun, tanggung jawab' },
      { key: 'motorik', label: 'Motorik & Kreativitas', hint: 'Koordinasi, kerapian gerak, kreativitas' }
    ],
    STATUS_ABSEN: [
      { value: 'hadir', label: 'Hadir', tone: 'green' },
      { value: 'izin', label: 'Izin', tone: 'amber' },
      { value: 'sakit', label: 'Sakit', tone: 'blue' },
      { value: 'alpha', label: 'Tanpa Keterangan', tone: 'red' }
    ],
    PASSWORD_MIN: 6
  };
})();

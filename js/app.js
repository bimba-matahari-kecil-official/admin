/* ============================================================
   BIMBA MATAHARI KECIL - Aplikasi Management
   Login multi-role (admin / pengajar / orang_tua)
   Frontend SPA + Google Apps Script (Google Sheets sebagai DB)
   ============================================================ */

const MODULES = {
  siswa: {
    title: 'Data Siswa', icon: 'bi-people', sheet: 'Siswa',
    columns: ['nama', 'kelas', 'periode', 'hari', 'jam', 'nama_pengajar', 'status'],
    fields: [
      { key: 'nama', label: 'Nama Anak', type: 'text', required: true },
      { key: 'tempat_lahir', label: 'Tempat Lahir', type: 'text' },
      { key: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date' },
      { key: 'kelas', label: 'Kelas', type: 'text', placeholder: 'mis. 1 (Satu)' },
      { key: 'periode', label: 'Periode', type: 'text' },
      { key: 'hari', label: 'Hari Belajar', type: 'text', placeholder: 'mis. Selasa & Rabu' },
      { key: 'jam', label: 'Jam Belajar', type: 'text', placeholder: 'mis. 08.00-09.00' },
      { key: 'nama_pengajar', label: 'Nama Pengajar', type: 'datalist', ref: 'pengajar' },
      { key: 'nama_ortu', label: 'Nama Orang Tua', type: 'text' },
      { key: 'hp_ortu', label: 'HP Orang Tua', type: 'text' },
      { key: 'alamat', label: 'Alamat', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] }
    ]
  },
  pengajar: {
    title: 'Data Pengajar', icon: 'bi-person-badge', sheet: 'Pengajar',
    columns: ['nama', 'hp', 'status', 'kontrak_mulai', 'kontrak_selesai'],
    fields: [
      { key: 'nama', label: 'Nama Pengajar', type: 'text', required: true },
      { key: 'hp', label: 'No. HP', type: 'text' },
      { key: 'alamat', label: 'Alamat', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] },
      { key: 'kontrak_mulai', label: 'Kontrak Mulai', type: 'date' },
      { key: 'kontrak_selesai', label: 'Kontrak Selesai', type: 'date' }
    ]
  },
  absensi_siswa: {
    title: 'Absensi Siswa', icon: 'bi-check2-square', sheet: 'AbsensiSiswa',
    columns: ['tanggal', 'siswa', 'status', 'keterangan'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'siswa', label: 'Nama Siswa', type: 'datalist', ref: 'siswa', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Hadir', 'Izin', 'Sakit', 'Alpha'] },
      { key: 'keterangan', label: 'Keterangan', type: 'text' }
    ]
  },
  absensi_pengajar: {
    title: 'Absensi Pengajar', icon: 'bi-person-check', sheet: 'AbsensiPengajar',
    columns: ['tanggal', 'pengajar', 'paraf', 'keterangan'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'pengajar', label: 'Nama Pengajar', type: 'datalist', ref: 'pengajar', required: true },
      { key: 'paraf', label: 'Kehadiran', type: 'select', options: ['Hadir', 'Izin', 'Sakit'] },
      { key: 'keterangan', label: 'Keterangan', type: 'text' }
    ]
  },
  media: {
    title: 'Media Playtime', icon: 'bi-puzzle', sheet: 'MediaPlaytime',
    columns: ['tanggal', 'kelas', 'siswa', 'media', 'ceklis'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'kelas', label: 'Kelas', type: 'text' },
      { key: 'siswa', label: 'Nama Siswa', type: 'datalist', ref: 'siswa' },
      { key: 'media', label: 'Media / Permainan', type: 'text', required: true, placeholder: 'mis. Alfabet Lepas Magnet' },
      { key: 'ceklis', label: 'Ceklis', type: 'select', options: ['Selesai', 'Belum'] }
    ]
  },
  spp: {
    title: 'Keuangan SPP', icon: 'bi-cash-stack', sheet: 'SPP',
    columns: ['tanggal', 'siswa', 'periode_bulan', 'jumlah', 'metode'],
    fields: [
      { key: 'tanggal', label: 'Tanggal Bayar', type: 'date', required: true },
      { key: 'siswa', label: 'Nama Siswa', type: 'datalist', ref: 'siswa', required: true },
      { key: 'periode_bulan', label: 'Periode Bulan', type: 'text', placeholder: 'mis. November 2026' },
      { key: 'jumlah', label: 'Jumlah (Rp)', type: 'number', required: true },
      { key: 'metode', label: 'Metode', type: 'select', options: ['Tunai', 'Transfer', 'QRIS'] },
      { key: 'keterangan', label: 'Keterangan', type: 'text' }
    ]
  },
  lpmb: {
    title: 'LPMB', icon: 'bi-file-earmark-text', sheet: 'LPMB',
    columns: ['tanggal', 'siswa', 'periode', 'educator', 'status'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'siswa', label: 'Nama Siswa', type: 'datalist', ref: 'siswa', required: true },
      { key: 'periode', label: 'Periode', type: 'text', required: true },
      { key: 'membaca', label: 'Membaca', type: 'textarea' },
      { key: 'menulis', label: 'Menulis', type: 'textarea' },
      { key: 'berhitung', label: 'Berhitung', type: 'textarea' },
      { key: 'kesopanan', label: 'Kesopanan', type: 'textarea' },
      { key: 'belajar', label: 'Belajar', type: 'textarea' },
      { key: 'ringkasan', label: 'Ringkasan Laporan', type: 'textarea' },
      { key: 'rekomendasi', label: 'Rekomendasi Belajar di Rumah', type: 'textarea' },
      { key: 'educator', label: 'Educator', type: 'datalist', ref: 'pengajar' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Selesai'] }
    ]
  },
  dokumentasi: {
    title: 'Dokumentasi', icon: 'bi-camera', sheet: 'Dokumentasi',
    columns: ['tanggal', 'kelas', 'jenis', 'kirim_ke', 'keterangan'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date', required: true },
      { key: 'kelas', label: 'Kelas', type: 'text' },
      { key: 'jenis', label: 'Jenis', type: 'select', options: ['Foto', 'Video'] },
      { key: 'kirim_ke', label: 'Dikirim ke', type: 'select', options: ['Grup Dokumentasi', 'Instagram', 'Wali Murid'] },
      { key: 'link', label: 'Link Foto/Video', type: 'text', placeholder: 'https://...' },
      { key: 'keterangan', label: 'Keterangan', type: 'textarea' }
    ]
  },
  pengingat: {
    title: 'Log Pengingat SPP', icon: 'bi-bell', sheet: 'PengingatSPP', hideCreate: true,
    columns: ['tanggal', 'bulan', 'siswa', 'hp', 'status'],
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'date' },
      { key: 'bulan', label: 'Bulan', type: 'text' },
      { key: 'siswa', label: 'Siswa', type: 'text' },
      { key: 'hp', label: 'HP', type: 'text' },
      { key: 'pesan', label: 'Pesan', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'text' }
    ]
  },
  users: {
    title: 'Akun Pengguna', icon: 'bi-shield-lock', sheet: 'Users',
    columns: ['username', 'role', 'nama', 'siswa', 'hp'],
    fields: [
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'newpassword' },
      { key: 'role', label: 'Level Akun', type: 'select', options: ['admin', 'pengajar', 'orang_tua'] },
      { key: 'nama', label: 'Nama', type: 'text' },
      { key: 'siswa', label: 'Nama Anak (khusus orang tua)', type: 'datalist', ref: 'siswa' },
      { key: 'hp', label: 'No. HP', type: 'text' }
    ]
  }
};

const ROLE_MENUS = {
  admin:     ['dashboard', 'siswa', 'pengajar', 'absensi_siswa', 'absensi_pengajar', 'media', 'spp', 'pengingat', 'lpmb', 'dokumentasi', 'users'],
  pengajar:  ['dashboard', 'siswa', 'absensi_siswa', 'absensi_pengajar', 'media', 'lpmb', 'dokumentasi'],
  orang_tua: ['anak']
};

const ROLE_LABELS = { admin: 'Admin', pengajar: 'Pengajar', orang_tua: 'Orang Tua' };

const SESSION_KEY = 'bmk_session';
let session = null;
const state = { module: 'dashboard', rows: [], editingId: null, deleteId: null, search: '' };
const cache = {};

/* ==================== INIT & LOGIN ==================== */

document.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      session = JSON.parse(saved);
      showApp();
      return;
    } catch (e) { sessionStorage.removeItem(SESSION_KEY); }
  }
  const gate = document.getElementById('loginGate');
  gate.classList.remove('d-none');
  document.getElementById('loginApiUrl').value = getApiUrl();
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('loginUser').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

async function doLogin() {
  const url = document.getElementById('loginApiUrl').value.trim();
  if (url) localStorage.setItem('bmk_api_url', url);
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('d-none');
  if (!username || !password) { showLoginError('Username dan password wajib diisi.'); return; }
  try {
    session = await apiCall({ action: 'login', username: username, password: password });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    showApp();
  } catch (err) {
    showLoginError(err.message);
  }
}

function showLoginError(msg) {
  const errEl = document.getElementById('loginError');
  errEl.textContent = msg;
  errEl.classList.remove('d-none');
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function showApp() {
  document.getElementById('loginGate').classList.add('d-none');
  document.getElementById('app').classList.remove('d-none');
  buildNav();
  navigate(session.role === 'orang_tua' ? 'anak' : 'dashboard');
}

function buildNav() {
  const nav = document.getElementById('mainNav');
  let html = '';
  ROLE_MENUS[session.role].forEach(key => {
    if (key === 'dashboard') html += `<button class="nav-btn" data-module="dashboard"><i class="bi bi-speedometer2"></i> Dashboard</button>`;
    else if (key === 'anak') html += `<button class="nav-btn" data-module="anak"><i class="bi bi-heart"></i> Anak Saya</button>`;
    else html += `<button class="nav-btn" data-module="${key}"><i class="bi ${MODULES[key].icon}"></i> ${MODULES[key].title}</button>`;
  });
  nav.innerHTML = html;
  nav.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.module));
  });
  let footer = `<button class="nav-btn w-100" onclick="logout()"><i class="bi bi-box-arrow-left"></i> Keluar (${esc(session.nama || session.username)})</button>`;
  if (session.role === 'admin') {
    footer = `<button class="nav-btn w-100" data-module="pengaturan"><i class="bi bi-gear"></i> Pengaturan</button>` + footer;
  }
  document.querySelector('.sidebar-footer').innerHTML = footer;
  document.querySelector('.sidebar-footer .nav-btn[data-module="pengaturan"]')
    ?.addEventListener('click', () => navigate('pengaturan'));
}

function navigate(module) {
  const allowed = ROLE_MENUS[session.role].slice();
  if (session.role === 'admin') allowed.push('pengaturan');
  if (!allowed.includes(module)) module = ROLE_MENUS[session.role][0];
  state.module = module;
  state.search = '';
  document.querySelectorAll('.nav-btn[data-module]').forEach(b => {
    b.classList.toggle('active', b.dataset.module === module);
  });
  const titles = { dashboard: 'Dashboard', pengaturan: 'Pengaturan', anak: 'Anak Saya' };
  document.getElementById('topbarTitle').textContent = titles[module] || MODULES[module].title;
  document.getElementById('sidebar').classList.remove('open');
  if (module === 'dashboard') renderDashboard();
  else if (module === 'anak') renderAnak();
  else if (module === 'pengaturan') renderSettings();
  else renderModule(module);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ==================== API ==================== */

function getApiUrl() {
  return localStorage.getItem('bmk_api_url') || window.API_URL || '';
}

async function apiCall(payload) {
  const url = getApiUrl();
  if (!url || url.indexOf('http') !== 0) throw new Error('URL API belum diatur. Isi di kolom URL API pada halaman login.');
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    throw new Error('Tidak bisa terhubung ke server. Cek koneksi & URL API.');
  }
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Terjadi kesalahan server.');
  return json.data;
}

async function loadSheet(sheet) {
  if (!cache[sheet]) cache[sheet] = await apiCall({ action: 'list', sheet: sheet });
  return cache[sheet];
}

function invalidate(sheet) { delete cache[sheet]; }

/* ==================== DASHBOARD ==================== */

async function renderDashboard() {
  const el = document.getElementById('content');
  el.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-warning"></div><p class="mt-2 text-muted">Memuat data...</p></div>`;
  try {
    const isPengajar = session.role === 'pengajar';
    const sheets = ['Siswa', 'Pengajar', 'AbsensiSiswa', 'AbsensiPengajar', 'MediaPlaytime', 'LPMB'];
    if (!isPengajar) sheets.push('SPP');
    const [siswa, pengajar, absS, absP, media, lpmb, spp] = await Promise.all(sheets.map(loadSheet));
    const today = todayStr();
    const bulanIni = today.slice(0, 7);
    const siswaAktif = siswa.filter(r => r.status !== 'Nonaktif').length;
    const pengajarAktif = pengajar.filter(r => r.status !== 'Nonaktif').length;
    const hadirHariIni = absS.filter(r => r.tanggal === today && r.status === 'Hadir').length;
    const absenPengajarHariIni = absP.filter(r => r.tanggal === today).length;
    const mediaBulanIni = media.filter(r => String(r.tanggal).slice(0, 7) === bulanIni).length;
    const lpmbSelesai = lpmb.filter(r => r.status === 'Selesai').length;

    const stat = (icon, label, value) => `
      <div class="col-6 col-md-4 col-xl-3">
        <div class="card card-stat h-100"><div class="card-body d-flex align-items-center gap-3">
          <div class="icon-wrap"><i class="bi ${icon}"></i></div>
          <div><div class="value">${value}</div><small class="text-muted">${label}</small></div>
        </div></div>
      </div>`;

    let sppCard = '', sppTable = '';
    if (!isPengajar) {
      const sppBulanIni = spp.filter(r => String(r.tanggal).slice(0, 7) === bulanIni)
        .reduce((a, b) => a + (Number(b.jumlah) || 0), 0);
      sppCard = stat('bi-cash-stack', 'SPP Bulan Ini', 'Rp ' + fmtNum(sppBulanIni));
      sppTable = `<div class="col-lg-6">
          <div class="table-card">
            <div class="p-3 fw-bold border-bottom"><i class="bi bi-cash text-warning"></i> Pembayaran SPP Terbaru</div>
            ${miniTable(spp.slice(-7).reverse().map(r => ({ ...r, jumlah: 'Rp ' + fmtNum(r.jumlah) })), ['tanggal', 'siswa', 'jumlah'])}
          </div></div>`;
    }

    el.innerHTML = `
      <div class="page-head"><h4><i class="bi bi-sun-fill text-warning"></i> Dashboard</h4></div>
      <div class="row g-3 mb-4">
        ${stat('bi-people', 'Siswa Aktif', siswaAktif)}
        ${stat('bi-person-badge', 'Pengajar Aktif', pengajarAktif)}
        ${stat('bi-check2-circle', 'Siswa Hadir Hari Ini', hadirHariIni)}
        ${stat('bi-person-check', 'Absen Pengajar Hari Ini', absenPengajarHariIni)}
        ${stat('bi-puzzle', 'Media Bulan Ini', mediaBulanIni)}
        ${stat('bi-file-earmark-text', 'LPMB Selesai', lpmbSelesai)}
        ${sppCard}
      </div>
      <div class="row g-3">
        <div class="col-lg-6">
          <div class="table-card">
            <div class="p-3 fw-bold border-bottom"><i class="bi bi-clock-history text-warning"></i> Absensi Siswa Terbaru</div>
            ${miniTable(absS.slice(-7).reverse(), ['tanggal', 'siswa', 'status'])}
          </div>
        </div>
        ${sppTable}
      </div>`;
  } catch (err) {
    el.innerHTML = errorHtml(err.message);
  }
}

function miniTable(rows, cols) {
  if (!rows.length) return '<div class="p-3 text-muted small">Belum ada data.</div>';
  const labels = cols.map(c => fieldLabel(c));
  return `<div class="table-responsive"><table class="table table-sm table-hover">
    <thead><tr>${labels.map(l => `<th>${l}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(displayVal(r[c]))}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

/* ==================== HALAMAN ORANG TUA ==================== */

async function renderAnak() {
  const el = document.getElementById('content');
  el.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-warning"></div><p class="mt-2 text-muted">Memuat data anak...</p></div>`;
  try {
    const [siswa, absS, spp, lpmb] = await Promise.all(
      ['Siswa', 'AbsensiSiswa', 'SPP', 'LPMB'].map(loadSheet));
    const s = siswa.find(x => x.nama === session.siswa);
    if (!s) {
      el.innerHTML = `<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i>
        Data anak "<b>${esc(session.siswa || '-')}</b>" tidak ditemukan. Hubungi admin untuk memperbaiki tautan akun Anda.</div>`;
      return;
    }
    const bulanIni = todayStr().slice(0, 7);
    const absen = absS.filter(r => r.siswa === s.nama).reverse();
    const bayar = spp.filter(r => r.siswa === s.nama).reverse();
    const laporan = lpmb.filter(r => r.siswa === s.nama).reverse();
    const hadirBulanIni = absen.filter(r => String(r.tanggal).slice(0, 7) === bulanIni && r.status === 'Hadir').length;
    const lunasBulanIni = bayar.some(r => String(r.tanggal).slice(0, 7) === bulanIni);

    el.innerHTML = `
      <div class="page-head"><h4><i class="bi bi-heart-fill text-warning"></i> Anak Saya: ${esc(s.nama)}</h4></div>
      <div class="card mb-3"><div class="card-body">
        <div class="row g-2 small">
          <div class="col-md-6"><b>Tempat, Tgl Lahir:</b> ${esc(s.tempat_lahir || '-')}, ${esc(fmtTanggal(s.tanggal_lahir) || '-')}</div>
          <div class="col-md-6"><b>Kelas / Periode:</b> ${esc(s.kelas || '-')} / ${esc(s.periode || '-')}</div>
          <div class="col-md-6"><b>Hari & Jam:</b> ${esc(s.hari || '-')}, ${esc(s.jam || '-')}</div>
          <div class="col-md-6"><b>Pengajar:</b> ${esc(s.nama_pengajar || '-')}</div>
        </div>
      </div></div>
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3"><div class="card card-stat"><div class="card-body d-flex align-items-center gap-3">
          <div class="icon-wrap"><i class="bi bi-check2-circle"></i></div>
          <div><div class="value">${hadirBulanIni}</div><small class="text-muted">Hadir Bulan Ini</small></div>
        </div></div></div>
        <div class="col-6 col-md-3"><div class="card card-stat"><div class="card-body d-flex align-items-center gap-3">
          <div class="icon-wrap"><i class="bi bi-cash-stack"></i></div>
          <div><div class="value fs-6">${lunasBulanIni ? '<span class="text-success">Lunas</span>' : '<span class="text-danger">Belum</span>'}</div>
          <small class="text-muted">SPP Bulan Ini</small></div>
        </div></div></div>
      </div>
      <div class="row g-3">
        <div class="col-lg-6">
          <div class="table-card"><div class="p-3 fw-bold border-bottom"><i class="bi bi-clock-history text-warning"></i> Riwayat Absensi</div>
            ${miniTable(absen.slice(0, 10), ['tanggal', 'status', 'keterangan'])}</div>
        </div>
        <div class="col-lg-6">
          <div class="table-card"><div class="p-3 fw-bold border-bottom"><i class="bi bi-cash text-warning"></i> Riwayat Pembayaran SPP</div>
            ${miniTable(bayar.slice(0, 10).map(r => ({ ...r, jumlah: 'Rp ' + fmtNum(r.jumlah) })), ['tanggal', 'jumlah', 'metode'])}</div>
        </div>
        <div class="col-12">
          <div class="table-card"><div class="p-3 fw-bold border-bottom"><i class="bi bi-file-earmark-text text-warning"></i> Laporan LPMB</div>
            ${laporan.length ? `<div class="table-responsive"><table class="table table-hover align-middle">
              <thead><tr><th>Tanggal</th><th>Periode</th><th>Educator</th><th>Status</th><th class="text-end">Aksi</th></tr></thead>
              <tbody>${laporan.map(r => `<tr>
                <td>${esc(r.tanggal)}</td><td>${esc(r.periode)}</td><td>${esc(r.educator)}</td>
                <td>${cellHtml('status', r.status)}</td>
                <td class="text-end"><button class="btn btn-sm btn-outline-secondary" onclick="printLPMB('${r.id}')"><i class="bi bi-printer"></i> Cetak</button></td>
              </tr>`).join('')}</tbody></table></div>`
            : '<div class="p-3 text-muted small">Belum ada LPMB.</div>'}</div>
        </div>
      </div>`;
  } catch (err) {
    el.innerHTML = errorHtml(err.message);
  }
}

/* ==================== MODULE CRUD ==================== */

async function renderModule(key) {
  const mod = MODULES[key];
  const el = document.getElementById('content');
  el.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-warning"></div><p class="mt-2 text-muted">Memuat data...</p></div>`;
  try {
    await loadRefs(mod);
    const rows = await loadSheet(mod.sheet);
    state.rows = rows.slice().reverse();
    const remindBtn = key === 'spp' && session.role === 'admin'
      ? `<button class="btn btn-success" onclick="sendReminders()"><i class="bi bi-whatsapp"></i> Kirim Pengingat WA</button>` : '';
    el.innerHTML = `
      <div class="page-head">
        <h4><i class="bi ${mod.icon} text-warning"></i> ${mod.title}</h4>
        <div class="d-flex gap-2 flex-wrap">
          <input type="text" id="searchBox" class="form-control search-input" placeholder="Cari...">
          ${remindBtn}
          ${mod.hideCreate ? '' : `<button class="btn btn-sun" onclick="openForm()"><i class="bi bi-plus-lg"></i> Tambah</button>`}
        </div>
      </div>
      <div id="tableWrap"></div>`;
    document.getElementById('searchBox').addEventListener('input', e => {
      state.search = e.target.value.toLowerCase();
      renderTable(key);
    });
    renderTable(key);
  } catch (err) {
    el.innerHTML = errorHtml(err.message);
  }
}

async function loadRefs(mod) {
  const refs = (mod.fields || []).filter(f => f.ref).map(f => f.ref);
  const sheetMap = { siswa: 'Siswa', pengajar: 'Pengajar' };
  for (const r of refs) {
    try { await loadSheet(sheetMap[r]); } catch (e) { /* ref sheet opsional */ }
  }
}

function renderTable(key) {
  const mod = MODULES[key];
  const wrap = document.getElementById('tableWrap');
  let rows = state.rows;
  if (state.search) {
    rows = rows.filter(r => mod.columns.some(c => String(r[c] || '').toLowerCase().includes(state.search)));
  }
  if (!rows.length) {
    wrap.innerHTML = '<div class="table-card p-4 text-center text-muted">Belum ada data.</div>';
    return;
  }
  const head = mod.columns.map(c => `<th>${fieldLabel(c)}</th>`).join('');
  const body = rows.map(r => {
    const cells = mod.columns.map(c => `<td>${cellHtml(c, r[c])}</td>`).join('');
    const printBtn = key === 'lpmb'
      ? `<button class="btn btn-sm btn-outline-secondary" title="Cetak LPMB" onclick="printLPMB('${r.id}')"><i class="bi bi-printer"></i></button>` : '';
    return `<tr>${cells}<td class="text-nowrap text-end">
      ${printBtn}
      <button class="btn btn-sm btn-outline-warning" title="Ubah" onclick="openForm('${r.id}')"><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" title="Hapus" onclick="askDelete('${r.id}')"><i class="bi bi-trash"></i></button>
    </td></tr>`;
  }).join('');
  wrap.innerHTML = `<div class="table-card"><div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead><tr>${head}<th class="text-end">Aksi</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div></div>`;
}

function cellHtml(col, val) {
  const s = displayVal(val);
  if (col === 'role') return `<span class="badge badge-status bg-warning-subtle text-warning-emphasis">${esc(ROLE_LABELS[s] || s)}</span>`;
  if (col === 'status' || col === 'paraf' || col === 'ceklis') {
    const cls = /hadir|selesai|aktif|terkirim|lunas/i.test(s) ? 'bg-success-subtle text-success-emphasis'
      : /nonaktif|alpha|belum|gagal/i.test(s) ? 'bg-danger-subtle text-danger-emphasis'
      : 'bg-warning-subtle text-warning-emphasis';
    return `<span class="badge badge-status ${cls}">${esc(s)}</span>`;
  }
  if (col === 'jumlah') return '<b>Rp ' + fmtNum(s) + '</b>';
  if (col === 'link' && s && s.indexOf('http') === 0)
    return `<a href="${esc(s)}" target="_blank" rel="noopener">Buka link</a>`;
  const out = esc(s);
  return s.length > 60 ? `<span class="text-truncate-cell d-inline-block" title="${out}">${out}</span>` : out;
}

function fieldLabel(key) {
  for (const m of Object.values(MODULES)) {
    const f = m.fields.find(f => f.key === key);
    if (f) return f.label;
  }
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ---------- Form ---------- */

function openForm(id) {
  const mod = MODULES[state.module];
  state.editingId = id || null;
  let row = id ? Object.assign({}, state.rows.find(r => r.id === id)) : {};
  if (state.module === 'users') row.password = ''; // password has di backend; isi ulang bila ganti
  document.getElementById('formModalTitle').textContent =
    (id ? 'Ubah ' : 'Tambah ') + mod.title;
  document.getElementById('formModalBody').innerHTML = `
    <form id="crudForm" class="row g-3">
      ${mod.fields.map(f => formFieldHtml(f, row ? row[f.key] : '')).join('')}
    </form>`;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('formModal')).show();
}

function formFieldHtml(f, value) {
  let v = value !== undefined && value !== null ? value : (f.type === 'date' ? todayStr() : '');
  const req = f.required ? 'required' : '';
  let input = '';
  if (f.type === 'textarea') {
    input = `<textarea class="form-control" id="f_${f.key}" rows="2" ${req}>${esc(v)}</textarea>`;
  } else if (f.type === 'select') {
    input = `<select class="form-select" id="f_${f.key}" ${req}>
      ${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}
    </select>`;
  } else if (f.type === 'datalist') {
    const list = (cache[{ siswa: 'Siswa', pengajar: 'Pengajar' }[f.ref]] || [])
      .filter(r => r.status === undefined || r.status === 'Aktif');
    input = `<input class="form-control" id="f_${f.key}" list="dl_${f.ref}" value="${esc(v)}" ${req} placeholder="Ketik untuk mencari...">
      <datalist id="dl_${f.ref}">${list.map(r => `<option value="${esc(r.nama)}">`).join('')}</datalist>`;
  } else if (f.type === 'newpassword') {
    const hint = state.editingId ? 'Kosongkan jika tidak diganti' : 'Minimal 6 karakter';
    input = `<input type="password" class="form-control" id="f_${f.key}" value="" placeholder="${hint}" autocomplete="new-password">`;
  } else {
    input = `<input type="${f.type}" class="form-control" id="f_${f.key}" value="${esc(v)}" ${req}
      ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''} ${f.type === 'number' ? 'min="0"' : ''}>`;
  }
  return `<div class="col-md-6">
    <label class="form-label fw-semibold">${f.label}${f.required ? ' <span class="text-danger">*</span>' : ''}</label>
    ${input}</div>`;
}

async function saveForm() {
  const mod = MODULES[state.module];
  const form = document.getElementById('crudForm');
  if (!form.reportValidity()) return;
  const data = {};
  mod.fields.forEach(f => { data[f.key] = document.getElementById('f_' + f.key).value.trim(); });
  if (state.module === 'users' && !state.editingId && !data.password) {
    toast('Password wajib diisi untuk akun baru.', 'danger');
    return;
  }
  const btn = document.getElementById('formModalSave');
  btn.disabled = true;
  try {
    if (state.editingId) await apiCall({ action: 'update', sheet: mod.sheet, id: state.editingId, data: data });
    else await apiCall({ action: 'create', sheet: mod.sheet, data: data });
    invalidate(mod.sheet);
    bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
    toast('Data berhasil disimpan.', 'success');
    await renderModule(state.module);
  } catch (err) {
    toast(err.message, 'danger');
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Hapus ---------- */

function askDelete(id) {
  state.deleteId = id;
  document.getElementById('deleteConfirmBtn').onclick = confirmDelete;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteModal')).show();
}

async function confirmDelete() {
  const mod = MODULES[state.module];
  try {
    await apiCall({ action: 'remove', sheet: mod.sheet, id: state.deleteId });
    invalidate(mod.sheet);
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    toast('Data berhasil dihapus.', 'success');
    await renderModule(state.module);
  } catch (err) {
    toast(err.message, 'danger');
  }
}

/* ---------- Kirim Pengingat SPP ---------- */

async function sendReminders() {
  if (!window.confirm('Kirim pengingat SPP via WhatsApp ke orang tua yang belum membayar bulan ini?\n\nYang sudah lunas atau sudah dikirim pengingat bulan ini akan dilewati.')) return;
  try {
    const res = await apiCall({ action: 'remind_spp' });
    invalidate('PengingatSPP');
    showInfo('Hasil Pengingat SPP — ' + res.bulan, `
      <p>Terkirim: <b class="text-success">${res.terkirim}</b> ·
         Gagal: <b class="text-danger">${res.gagal}</b> ·
         Dilewati: <b class="text-muted">${res.dilewati}</b></p>
      ${res.detail.length ? `<ul class="small mb-0">${res.detail.map(d =>
        `<li>${esc(d.siswa)} — ${esc(d.status)}</li>`).join('')}</ul>` : ''}`);
  } catch (err) {
    toast(err.message, 'danger');
  }
}

function showInfo(title, html) {
  document.getElementById('infoModalTitle').textContent = title;
  document.getElementById('infoModalBody').innerHTML = html;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('infoModal')).show();
}

/* ==================== CETAK LPMB ==================== */

async function printLPMB(id) {
  try {
    const [lpmbRows, siswaRows] = await Promise.all([loadSheet('LPMB'), loadSheet('Siswa')]);
    const r = lpmbRows.find(x => x.id === id);
    if (!r) throw new Error('LPMB tidak ditemukan.');
    const s = siswaRows.find(x => x.nama === r.siswa) || {};
    const aspek = [['Membaca', r.membaca], ['Menulis', r.menulis], ['Berhitung', r.berhitung],
                   ['Kesopanan', r.kesopanan], ['Belajar', r.belajar]];
    document.getElementById('printArea').innerHTML = `
      <div class="lpmb-doc">
        <div class="lpmb-header">
          <h3>BIMBA MATAHARI KECIL</h3>
          <p><i>"Temani Tumbuh, Temani Bersinar"</i></p>
          <p>${esc(window.BIMBA_ADDRESS || '')}</p>
        </div>
        <h5>LEMBAR PERKEMBANGAN MATAHARI BELAJAR (LPMB)</h5>
        <table class="bio-table">
          <tr><td style="width:180px">Nama Anak</td><td>: ${esc(r.siswa)}</td></tr>
          <tr><td>Tempat, Tanggal Lahir</td><td>: ${esc(s.tempat_lahir || '-')}, ${esc(fmtTanggal(s.tanggal_lahir || '-'))}</td></tr>
          <tr><td>Kelas / Periode</td><td>: ${esc(s.kelas || '-')} / ${esc(r.periode)}</td></tr>
          <tr><td>Hari dan Jam</td><td>: ${esc(s.hari || '-')}, ${esc(s.jam || '-')}</td></tr>
          <tr><td>Educator</td><td>: ${esc(r.educator || '-')}</td></tr>
        </table>
        <h5>LAPORAN PERKEMBANGAN</h5>
        <table class="aspek-table" style="width:100%">
          <tr><th style="width:150px">Aspek</th><th>Deskripsi Perkembangan</th></tr>
          ${aspek.map(a => `<tr><td><b>${a[0]}</b></td><td>${esc(a[1] || '-')}</td></tr>`).join('')}
        </table>
        <h5>RINGKASAN</h5>
        <p style="text-align:justify">${esc(r.ringkasan || '-')}</p>
        <h5>REKOMENDASI BELAJAR DI RUMAH</h5>
        <p style="text-align:justify">${esc(r.rekomendasi || '-')}</p>
        <div class="ttd-row">
          <div>Orang Tua/Wali<div class="ttd-space"></div>( ........................ )</div>
          <div>Head of Bimba<div class="ttd-space"></div><u><b>${esc(window.HEAD_NAME || '( ........................ )')}</b></u></div>
          <div>Educator<div class="ttd-space"></div><u><b>${esc(r.educator || '( ........................ )')}</b></u></div>
        </div>
      </div>`;
    window.print();
  } catch (err) {
    toast(err.message, 'danger');
  }
}

/* ==================== PENGATURAN ==================== */

function renderSettings() {
  document.getElementById('content').innerHTML = `
    <div class="page-head"><h4><i class="bi bi-gear text-warning"></i> Pengaturan</h4></div>
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card"><div class="card-body">
          <h6 class="fw-bold">Koneksi API (Google Apps Script)</h6>
          <p class="text-muted small">Tempel URL Web App dari deployment Apps Script Anda.</p>
          <div class="input-group mb-2">
            <input type="text" id="apiUrlInput" class="form-control" value="${esc(getApiUrl())}"
              placeholder="https://script.google.com/macros/s/.../exec">
            <button class="btn btn-sun" onclick="saveApiUrl()">Simpan</button>
          </div>
          <button class="btn btn-outline-secondary btn-sm" onclick="testConnection()">
            <i class="bi bi-plug"></i> Tes Koneksi</button>
          <span id="testResult" class="ms-2 small"></span>
        </div></div>
      </div>
      <div class="col-lg-6">
        <div class="card"><div class="card-body">
          <h6 class="fw-bold">Pengingat SPP WhatsApp</h6>
          <ol class="small text-muted mb-2">
            <li>Buka <b>Code.gs</b>, isi <code>WA_CONFIG.MODE</code>: <code>'fonnte'</code> (gratis, daftar di fonnte.com), <code>'twilio'</code>, atau <code>'custom'</code> (gateway sendiri).</li>
            <li>Isi token/kredensial sesuai mode, dan ubah <code>MESSAGE</code> bila perlu.</li>
            <li>(Opsional) Di editor Apps Script, jalankan <code>setupReminderTrigger</code> sekali untuk kirim otomatis tiap tanggal 1 jam 06:00.</li>
            <li>Klik tombol <b>Kirim Pengingat WA</b> di menu Keuangan SPP untuk kirim manual.</li>
          </ol>
          <button class="btn btn-success btn-sm" onclick="sendReminders()"><i class="bi bi-whatsapp"></i> Kirim Pengingat Sekarang</button>
        </div></div>
      </div>
      <div class="col-lg-12">
        <div class="card"><div class="card-body">
          <h6 class="fw-bold">Level Akun & Hak Akses</h6>
          <ul class="small text-muted mb-0">
            <li><b>Admin</b> — akses semua menu termasuk Keuangan SPP, Akun Pengguna, dan Pengaturan.</li>
            <li><b>Pengajar</b> — mengelola absensi siswa/pengajar, media playtime, LPMB, dokumentasi; tidak melihat keuangan.</li>
            <li><b>Orang Tua</b> — hanya melihat data anak sendiri: biodata, absensi, riwayat SPP, dan LPMB (bisa dicetak).</li>
            <li>Buat akun baru dari menu <b>Akun Pengguna</b>. Untuk orang tua, isi <b>Nama Anak</b> persis seperti di Data Siswa.</li>
          </ul>
        </div></div>
      </div>
    </div>`;
}

function saveApiUrl() {
  const v = document.getElementById('apiUrlInput').value.trim();
  localStorage.setItem('bmk_api_url', v);
  Object.keys(cache).forEach(k => delete cache[k]);
  toast('URL API disimpan.', 'success');
}

async function testConnection() {
  const out = document.getElementById('testResult');
  out.innerHTML = '<span class="text-muted">Mengetes...</span>';
  try {
    await apiCall({ action: 'list', sheet: 'Siswa' });
    out.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Terhubung!</span>`;
  } catch (err) {
    out.innerHTML = `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> ${esc(err.message)}</span>`;
  }
}

/* ==================== UTIL ==================== */

function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function displayVal(v) { return v === undefined || v === null ? '' : String(v); }

function fmtNum(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n) || 0);
}

function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtTanggal(iso) {
  if (!iso || iso.indexOf('-') !== 4) return iso;
  const [y, m, d] = iso.split('-');
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${Number(d)} ${bulan[Number(m) - 1]} ${y}`;
}

function toast(msg, type) {
  const id = 't' + Date.now();
  document.getElementById('toastArea').insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert">
      <div class="d-flex"><div class="toast-body">${esc(msg)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>
    </div>`);
  bootstrap.Toast.getOrCreateInstance(document.getElementById(id), { delay: 3500 }).show();
}

function errorHtml(msg) {
  return `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${esc(msg)}</div>
    <button class="btn btn-outline-secondary btn-sm" onclick="navigate('${state.module}')"><i class="bi bi-arrow-clockwise"></i> Coba Lagi</button>`;
}

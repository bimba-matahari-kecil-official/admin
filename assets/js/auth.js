(function () {
  window.BMK = window.BMK || {};
  BMK.pages = BMK.pages || {};
  var ui = BMK.ui;
  var C = BMK.const;
  var api = BMK.api;

  function brand(href, extra) {
    return '<a class="brand ' + (extra || '') + '" href="' + (href || '#/') + '" data-route>' +
      '<span class="brand-mark"><img src="' + CONFIG.LOGO_URL + '" alt="Logo Bimba Mahatari Kecil" /></span>' +
      '<span class="brand-text"><span class="brand-name">Bimba Mahatari Kecil</span><span class="brand-sub">Learning &amp; Playing</span></span>' +
    '</a>';
  }

  function setupWarning() {
    if (CONFIG.RESOLVED_API) return '';
    return '<div class="setup-warning">' + ui.icon('alert', 18) + '<div><b>URL API belum diatur.</b><br>' +
      'Isi <code>API_URL</code> pada <code>assets/js/config.js</code> dengan URL Web App Apps Script, lalu buka ulang halaman ini.</div></div>';
  }

  function dashPathFor(user) {
    var role = (user && user.role) || '';
    if (role === 'admin') return '#/admin/dashboard';
    if (role === 'guru' || role === 'pengajar') return '#/guru/dashboard';
    return '#/ortu/dashboard';
  }

  BMK.dashPathFor = dashPathFor;

  /* -----------------------------------------------------
     BERANDA
     ----------------------------------------------------- */
  BMK.pages.home = function () {
    var user = BMK.store.user();
    var sessionNav = user
      ? '<a class="btn btn-primary btn-sm" href="' + dashPathFor(user) + '" data-route>Buka Dashboard ' + ui.icon('arrowRight', 15) + '</a>'
      : '<a class="btn btn-ghost btn-sm" href="#/masuk" data-route>Masuk</a><a class="btn btn-sun btn-sm" href="#/daftar" data-route>Daftar Sekarang</a>';

    var html =
      '<div class="public">' +
        '<header class="public-nav"><div class="public-nav-inner">' + brand() +
          '<nav class="public-nav-links">' +
            '<a href="#" data-scroll="fitur">Fitur</a>' +
            '<a href="#" data-scroll="paket">Paket Belajar</a>' +
            '<a href="#" data-scroll="alur">Cara Daftar</a>' +
            '<a href="#" data-scroll="kontak">Kontak</a>' +
          '</nav>' +
          '<div class="public-nav-cta">' + sessionNav + '</div>' +
        '</div></header>' +

        '<div class="landing-shell">' +
          '<section class="landing-hero">' +
            '<div class="hero-copy">' +
              '<span class="hero-kicker"><span class="dot"></span> Pendaftaran siswa baru dibuka</span>' +
              '<h1 class="hero-title">Tumbuh percaya diri, <em>belajar</em> dengan hati.</h1>' +
              '<p class="hero-sub">Bimba Mahatari Kecil mendampingi buah hati Anda dengan laporan belajar yang transparan, absensi berfoto, dan komunikasi langsung dengan pengajar.</p>' +
              '<div class="hero-actions">' +
                '<a class="btn btn-primary btn-lg" href="#/daftar" data-route>Daftar Siswa Baru ' + ui.icon('arrowRight', 17) + '</a>' +
                '<a class="btn btn-outline btn-lg" href="#/masuk" data-route>Masuk Akun</a>' +
              '</div>' +
              '<div class="hero-note">' +
                '<span>' + ui.icon('checkCircle', 15) + ' Laporan harian & rapor</span>' +
                '<span>' + ui.icon('checkCircle', 15) + ' Absensi kamera GPS</span>' +
                '<span>' + ui.icon('checkCircle', 15) + ' Notifikasi WhatsApp</span>' +
              '</div>' +
            '</div>' +
            '<div class="hero-visual">' +
              '<span class="hero-sun-decor"></span>' +
              '<div class="hero-board">' +
                '<div class="hero-board-head"><span class="hero-board-brand"><span class="mini-sun">' + ui.icon('sun', 17) + '</span> Ruang Belajar</span><span class="hero-board-dots"><i></i><i></i><i></i></span></div>' +
                '<div class="hero-greet">Selamat pagi, Bunda!<small>Pantau perkembangan belajar hari ini</small></div>' +
                '<div class="hero-mini-stats">' +
                  '<div class="hero-mini-stat"><b id="heroSiswa">—</b><span>Siswa aktif</span></div>' +
                  '<div class="hero-mini-stat accent"><b id="heroGuru">—</b><span>Pengajar</span></div>' +
                '</div>' +
                '<div class="hero-chart" aria-hidden="true"><i style="height:34%"></i><i style="height:52%"></i><i style="height:45%"></i><i style="height:78%"></i><i style="height:64%"></i><i style="height:88%"></i><i style="height:72%"></i></div>' +
                '<div class="hero-board-foot"><span class="status-dot"></span> Laporan hari ini sudah tersedia untuk dilihat</div>' +
              '</div>' +
              '<div class="float-card float-one"><span class="fc-ic" style="background:var(--green-soft);color:var(--green)">' + ui.icon('checkCircle', 18) + '</span><div><b>Absensi tercatat</b><span>Foto &amp; peta GPS</span></div></div>' +
              '<div class="float-card float-two"><span class="fc-ic" style="background:var(--sun-soft);color:var(--sun-dark)">' + ui.icon('award', 18) + '</span><div><b>Rapor LPMB</b><span>Siap diunduh &amp; dicetak</span></div></div>' +
              '<div class="float-card float-three"><span class="fc-ic" style="background:var(--blue-soft);color:var(--blue)">' + ui.icon('message', 18) + '</span><div><b>Notifikasi WA</b><span>Laporan biaya les</span></div></div>' +
            '</div>' +
          '</section>' +

          '<div class="stats-strip">' +
            '<div class="strip-item"><b id="stripSiswa">—</b><span>Buah hati yang belajar</span></div>' +
            '<div class="strip-item"><b id="stripGuru">—</b><span>Pengajar pendamping</span></div>' +
            '<div class="strip-item"><b>3</b><span>Peran terhubung</span></div>' +
            '<div class="strip-item"><b>100%</b><span>Laporan transparan</span></div>' +
          '</div>' +

          '<section class="section" id="fitur">' +
            '<div class="section-head"><div><div class="section-kicker">Satu ruang, tiga peran</div>' +
              '<h2 class="section-title">Semua yang dibutuhkan Bimba,<br>tanpa tumpang tindih.</h2>' +
              '<p class="section-sub">Admin mengelola operasional, pengajar fokus mengajar, dan orang tua mendapat kabar belajar anak secara rutin.</p></div></div>' +
            '<div class="feature-grid">' +
              '<article class="feature-card"><div class="feature-ic" style="background:var(--sun-soft);color:var(--sun-dark)">' + ui.icon('shield', 23) + '</div><h3>Admin</h3><p>Kelola data anak, pengajar, paket, tagihan, gaji, hingga persetujuan rapor dari satu dashboard.</p>' +
                '<ul class="feature-list"><li>' + ui.icon('check', 14) + ' Tagihan SPP &amp; kirim laporan via WA</li><li>' + ui.icon('check', 14) + ' Slip gaji otomatis dari absensi</li><li>' + ui.icon('check', 14) + ' ACC tanda tangan rapor LPMB</li></ul></article>' +
              '<article class="feature-card"><div class="feature-ic" style="background:var(--teal-soft);color:var(--teal)">' + ui.icon('graduation', 23) + '</div><h3>Pengajar</h3><p>Catat kehadiran dengan kamera GPS, isi laporan harian, dan susun hasil perkembangan siswa.</p>' +
                '<ul class="feature-list"><li>' + ui.icon('check', 14) + ' Absensi kamera GPS &amp; keterangan</li><li>' + ui.icon('check', 14) + ' Foto, video, dan paraf digital</li><li>' + ui.icon('check', 14) + ' Rapor akhir periode</li></ul></article>' +
              '<article class="feature-card"><div class="feature-ic" style="background:var(--blue-soft);color:var(--blue)">' + ui.icon('heart', 23) + '</div><h3>Orang Tua</h3><p>Ikuti perkembangan anak lewat laporan harian, rapor, jadwal, dan administrasi yang jelas.</p>' +
                '<ul class="feature-list"><li>' + ui.icon('check', 14) + ' Foto &amp; video belajar</li><li>' + ui.icon('check', 14) + ' Bayar SPP &amp; unggah bukti</li><li>' + ui.icon('check', 14) + ' Rapor A4 siap cetak</li></ul></article>' +
            '</div>' +
          '</section>' +

          '<section class="section" id="paket">' +
            '<div class="section-head"><div><div class="section-kicker">Paket belajar</div><h2 class="section-title">Pilih ritme belajar<br>yang paling pas.</h2></div>' +
              '<a class="btn btn-outline" href="#/daftar" data-route>Tanya paket lain ' + ui.icon('arrowRight', 15) + '</a></div>' +
            '<div class="landing-packages" id="homePackages"><div class="card"><div class="card-body">' + ui.loadingBlock('Memuat paket…') + '</div></div></div>' +
          '</section>' +

          '<section class="section" id="alur">' +
            '<div class="section-head"><div><div class="section-kicker">Cara daftar</div><h2 class="section-title">Empat langkah,<br>langsung terhubung.</h2><p class="section-sub">Pilih jadwal yang belum terisi. Satu jadwal hanya untuk satu siswa agar pendampingan tetap fokus.</p></div></div>' +
            '<div class="steps-grid">' +
              '<div class="step-card"><div class="step-num">1</div><h4>Daftar akun</h4><p>Isi data orang tua dan buat akun untuk masuk ke dashboard.</p></div>' +
              '<div class="step-card"><div class="step-num">2</div><h4>Data anak</h4><p>Lengkapi identitas buah hati, sekolah, dan kelasnya.</p></div>' +
              '<div class="step-card"><div class="step-num">3</div><h4>Pilih paket</h4><p>Tentukan jumlah sesi dan durasi belajar yang diinginkan.</p></div>' +
              '<div class="step-card"><div class="step-num">4</div><h4>Pilih jadwal</h4><p>Jadwal yang sudah dipilih siswa lain tidak dapat diambil.</p></div>' +
            '</div>' +
          '</section>' +

          '<section class="cta-banner">' +
            '<div><h2>Siap menemani langkah kecil jadi besar?</h2><p>Mulai pendaftaran hari ini. Tim Mahatari Kecil akan menyambut dan menyiapkan jadwal belajar terbaik untuk anak Anda.</p></div>' +
            '<div class="cta-actions"><a class="btn btn-sun btn-lg" href="#/daftar" data-route>Daftar Sekarang ' + ui.icon('arrowRight', 16) + '</a><a class="btn btn-outline btn-lg" href="#/masuk" data-route style="background:transparent;color:#fff;border-color:rgba(255,255,255,.25)">Masuk</a></div>' +
          '</section>' +
        '</div>' +

        '<footer class="public-footer" id="kontak"><div class="footer-inner">' +
          '<div class="footer-grid">' +
            '<div class="footer-brand">' + brand() + '<p id="footerAbout">Pendamping belajar anak usia sekolah dengan suasana hangat, terarah, dan penuh perhatian.</p></div>' +
            '<div class="footer-col"><h5>Kontak</h5><span id="footerPhone">Memuat kontak…</span><span id="footerAddress">Alamat Bimba</span><a id="footerWa" href="#" target="_blank" rel="noopener">WhatsApp admin</a></div>' +
            '<div class="footer-col"><h5>Navigasi</h5><a href="#/masuk" data-route>Masuk akun</a><a href="#/daftar" data-route>Pendaftaran siswa</a><a href="#" data-scroll="paket">Paket belajar</a></div>' +
          '</div>' +
          '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' Bimba Mahatari Kecil. Dibuat untuk pendampingan belajar yang lebih dekat.</span><span id="footerHours">Jam operasional</span></div>' +
        '</div></footer>' +
      '</div>';

    function mount(root) {
      document.title = 'Bimba Mahatari Kecil — Learning and playing';
      Array.prototype.forEach.call(root.querySelectorAll('[data-scroll]'), function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var target = document.getElementById(a.getAttribute('data-scroll'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      loadPublic();
    }

    function loadPublic() {
      var box = document.getElementById('homePackages');
      var retry = '<div class="card"><div class="card-body">' + ui.empty('alert', 'Gagal memuat paket', 'Periksa koneksi atau pengaturan URL API.', '<button class="btn btn-outline" id="homeRetry">' + ui.icon('refresh', 15) + ' Coba lagi</button>') + '</div></div>';
      api.publicHome().then(function (data) {
        applyBimbel(data && data.bimbel || {});
        var stats = data && data.stats || {};
        ['heroSiswa', 'stripSiswa'].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = ui.angka(stats.siswa || 0); });
        ['heroGuru', 'stripGuru'].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = ui.angka(stats.pengajar || 0); });
        renderPackages((data && data.paket) || []);
      }).catch(function (err) {
        if (box) box.innerHTML = retry;
        var b = document.getElementById('homeRetry');
        if (b) b.onclick = function () { if (box) box.innerHTML = '<div class="card"><div class="card-body">' + ui.loadingBlock('Memuat paket…') + '</div></div>'; loadPublic(); };
        if (err.code === 'CONFIG') ui.toast(err.message, 'info', 6000);
      });
    }

    function applyBimbel(b) {
      var name = b.nama || 'Bimba Mahatari Kecil';
      var phone = b.phone || b.phoneAdmin || '';
      var addr = b.alamat || 'Alamat Bimba belum diatur';
      var hours = b.jamOperasional || 'Senin–Sabtu';
      var el = document.getElementById('footerAbout');
      if (el) el.textContent = (b.tagline || 'Pendamping belajar anak usia sekolah dengan suasana hangat, terarah, dan penuh perhatian.') + ' ' + name + '.';
      var fp = document.getElementById('footerPhone');
      if (fp) fp.textContent = phone ? 'Telp/WA: ' + phone : 'Kontak belum diatur';
      var fa = document.getElementById('footerAddress');
      if (fa) fa.textContent = addr;
      var fw = document.getElementById('footerWa');
      if (fw) {
        if (phone) { fw.href = ui.waLink(phone, 'Halo ' + name + ', saya ingin bertanya tentang pendaftaran.'); fw.textContent = 'WhatsApp admin'; }
        else { fw.textContent = 'Kontak belum diatur'; fw.removeAttribute('href'); }
      }
      var fh = document.getElementById('footerHours');
      if (fh) fh.textContent = 'Jam operasional: ' + hours;
    }

    function renderPackages(packages) {
      var box = document.getElementById('homePackages');
      if (!box) return;
      if (!packages.length) {
        box.innerHTML = '<div class="card" style="grid-column:1/-1"><div class="card-body">' + ui.empty('book', 'Paket belajar belum tersedia', 'Silakan hubungi admin Bimba untuk informasi paket dan jadwal terbaru.') + '</div></div>';
        return;
      }
      var shown = packages.slice(0, 3);
      box.innerHTML = shown.map(function (p, i) {
        var featured = shown.length > 1 && i === 1;
        return '<article class="pkg-card ' + (featured ? 'featured' : '') + '">' +
          (featured ? '<span class="pkg-flag">' + ui.badge('Favorit', 'amber') + '</span>' : '') +
          '<div class="pkg-name">' + ui.esc(p.nama) + '</div>' +
          '<p class="pkg-desc">' + ui.esc(p.deskripsi || 'Pendampingan belajar terarah sesuai kebutuhan anak.') + '</p>' +
          '<div class="pkg-price">' + ui.rupiah(p.harga) + ' <small>/bulan</small></div>' +
          '<div class="pkg-meta"><span>' + ui.esc(p.sesiPerBulan || p.sesi || 8) + ' sesi</span><span>' + ui.esc(p.durasiMenit || 90) + ' menit</span><span>Laporan rutin</span></div>' +
          '<a class="btn ' + (featured ? 'btn-primary' : 'btn-outline') + '" href="#/daftar?paket=' + encodeURIComponent(p.id) + '" data-route>Pilih paket ' + ui.icon('arrowRight', 15) + '</a>' +
        '</article>';
      }).join('');
    }

    return { html: html, mount: mount };
  };

  /* -----------------------------------------------------
     LOGIN
     ----------------------------------------------------- */
  BMK.pages.login = function () {
    var demo = CONFIG.SHOW_DEMO_ACCOUNTS
      ? '<div class="demo-hint"><b>Akun demo untuk uji lokal</b><br>Admin: <code>admin</code> / <code>admin123</code> · Pengajar: <code>guru1</code> / <code>guru123</code> · Orang tua: <code>ortu1</code> / <code>ortu123</code></div>'
      : '';
    var html =
      '<div class="auth-page">' +
        '<aside class="auth-aside">' +
          brand('#/') +
          '<div class="auth-aside-body">' +
            '<h2>Selamat datang kembali di <em>ruang belajar</em>.</h2>' +
            '<p>Pantau kehadiran, hasil belajar, dan administrasi anak dalam satu tempat yang tenang dan teratur.</p>' +
            '<div class="auth-points">' +
              '<div class="auth-point"><span class="ap-ic">' + ui.icon('chart', 17) + '</span><div><b>Perkembangan terukur</b><span>Laporan harian hingga rapor periode.</span></div></div>' +
              '<div class="auth-point"><span class="ap-ic">' + ui.icon('mapPin', 17) + '</span><div><b>Kehadiran terpercaya</b><span>Absensi dengan foto dan peta GPS.</span></div></div>' +
              '<div class="auth-point"><span class="ap-ic">' + ui.icon('message', 17) + '</span><div><b>Komunikasi lebih dekat</b><span>Informasi biaya les langsung ke WhatsApp.</span></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="auth-aside-foot">Bimba Mahatari Kecil · Learning and playing.</div>' +
        '</aside>' +
        '<main class="auth-main">' +
          '<div class="auth-top"><a class="back-link" href="#/" data-route>' + ui.icon('arrowLeft', 16) + ' Kembali ke beranda</a><span class="brand-sub">Portal Bimba</span></div>' +
          '<div class="auth-card">' +
            '<h1>Masuk ke akun</h1><p>Gunakan akun yang terdaftar untuk membuka dashboard Anda.</p>' +
            setupWarning() +
            '<form class="auth-form" id="loginForm" novalidate>' +
              '<div class="field"><label for="loginIdentity">Username atau nomor HP <span class="req">*</span></label><input class="input" id="loginIdentity" name="identity" autocomplete="username" placeholder="contoh: bunda.sari" required></div>' +
              '<div class="field"><label for="loginPassword">Kata sandi <span class="req">*</span></label>' +
                '<div class="input-wrap"><input class="input" id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="Masukkan kata sandi" required>' +
                '<span class="input-suffix"><button type="button" class="icon-btn plain" id="togglePw" aria-label="Tampilkan kata sandi">' + ui.icon('eye', 17) + '</button></span></div></div>' +
              '<div class="row-between"><label class="check"><input type="checkbox" id="showPwCheck"> Tampilkan kata sandi</label><button type="button" class="btn-link" id="forgotBtn">Lupa sandi?</button></div>' +
              '<button class="btn btn-primary btn-lg btn-block" type="submit" id="loginSubmit">Masuk ' + ui.icon('arrowRight', 16) + '</button>' +
            '</form>' +
            '<div class="auth-foot">Belum punya akun? <a href="#/daftar" data-route>Daftar siswa baru</a></div>' +
            demo +
          '</div>' +
        '</main>' +
      '</div>';

    function mount(root) {
      document.title = 'Masuk — Bimba Mahatari Kecil';
      var form = root.querySelector('#loginForm');
      var pw = root.querySelector('#loginPassword');
      var toggle = root.querySelector('#togglePw');
      var check = root.querySelector('#showPwCheck');
      function setVisible(v) {
        pw.type = v ? 'text' : 'password';
        check.checked = v;
        toggle.innerHTML = ui.icon(v ? 'eye' : 'lock', 17);
        toggle.setAttribute('aria-label', v ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
      }
      toggle.onclick = function () { setVisible(pw.type === 'password'); };
      check.onchange = function () { setVisible(check.checked); };
      root.querySelector('#forgotBtn').onclick = function () {
        ui.modal({
          title: 'Lupa kata sandi',
          size: 'sm',
          body: '<p class="confirm-text">Untuk keamanan, kata sandi diatur ulang oleh admin Bimba. Silakan hubungi admin melalui WhatsApp atau datang langsung ke Bimba dengan membawa identitas.</p>' +
            '<div class="note-box mt-16">Admin dapat membuka menu <b>Pengaturan → Akun</b> untuk mengatur ulang kata sandi Anda.</div>',
          footer: '<button class="btn btn-primary" data-close>Mengerti</button>',
          onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; }
        });
      };
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        ui.clearErrors(form);
        var data = ui.serialize(form);
        var valid = true;
        if (!data.identity) { ui.fieldError(form, 'identity', 'Masukkan username atau nomor HP.'); valid = false; }
        if (!data.password) { ui.fieldError(form, 'password', 'Masukkan kata sandi.'); valid = false; }
        if (!valid) return;
        var btn = root.querySelector('#loginSubmit');
        ui.busy(btn, true, 'Memeriksa akun…');
        try {
          var res = await api.login(data.identity, data.password);
          BMK.store.setSession(res.token, res.user);
          ui.toast('Selamat datang, ' + (res.user.nama || 'Sahabat Mahatari') + '.', 'success');
          BMK.app.enterApp(res.user);
        } catch (err) {
          ui.busy(btn, false);
          ui.toast(err.message, 'error', 5200);
        }
      });
      var ident = root.querySelector('#loginIdentity');
      if (ident && !CONFIG.IS_LOCAL) setTimeout(function () { ident.focus(); }, 200);
    }
    return { html: html, mount: mount };
  };

  /* -----------------------------------------------------
     PENDAFTARAN — wizard publik & perpanjangan paket ortu
     ----------------------------------------------------- */
  BMK.pages.register = function (params) {
    params = params || {};
    var sessionUser = BMK.store.user();
    var extend = !!(sessionUser && sessionUser.role === 'ortu' && (params.extend === '1' || params.embedded === '1'));
    var embedded = !!params.embedded;
    var steps = extend ? ['Data Anak', 'Paket', 'Jadwal'] : ['Akun', 'Data Anak', 'Paket', 'Jadwal'];
    var state = {
      step: 1,
      account: { nama: '', username: '', phone: '', email: '', password: '', password2: '' },
      child: { nama: '', panggilan: '', gender: '', tglLahir: '', sekolah: '', kelas: '', catatan: '' },
      children: [],
      menus: [],
      childrenLoaded: false,
      childrenError: '',
      childMode: 'existing',
      anakId: '',
      paketId: params.paket || '',
      slotIds: [],
      areaFilter: '',
      teacherFilter: '',
      packages: [],
      slots: [],
      loaded: false,
      loadError: '',
      slotsError: '',
      submitting: false
    };
    var rootEl = null;

    function selectedPackage() {
      return state.packages.filter(function (p) { return p.id === state.paketId; })[0] || null;
    }
    function selectedSlots() {
      return state.slots.filter(function (s) { return state.slotIds.indexOf(s.id) !== -1; });
    }
    function selectedChild() {
      return state.children.filter(function (c) { return String(c.id) === String(state.anakId); })[0] || null;
    }
    function menusById() {
      var map = {};
      (state.menus || []).forEach(function (m) {
        var id = m.child ? m.child.id : m.id;
        if (id) map[id] = m;
      });
      return map;
    }
    function timeMin(v) {
      var parts = String(v || '0:0').split(':');
      return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
    }
    function overlaps(a, b) {
      return a.hari === b.hari &&
        timeMin(a.jamMulai) < timeMin(b.jamSelesai) &&
        timeMin(b.jamMulai) < timeMin(a.jamSelesai);
    }
    function conflictWith(slot) {
      return selectedSlots().some(function (s) { return s.id !== slot.id && overlaps(s, slot); });
    }
    function slotAreas(s) {
      if (s.pengajarAreas && s.pengajarAreas.length) return s.pengajarAreas;
      var raw = String(s.pengajarArea || '').trim();
      return raw ? [raw] : [];
    }
    function areaList() {
      var seen = {};
      var list = [];
      state.slots.forEach(function (s) {
        slotAreas(s).forEach(function (area) {
          area = String(area || '').trim();
          if (area && !seen[area]) { seen[area] = true; list.push(area); }
        });
      });
      return list.sort();
    }
    function teacherList() {
      if (!state.areaFilter) return [];
      var seen = {};
      var list = [];
      state.slots.forEach(function (s) {
        if (slotAreas(s).indexOf(state.areaFilter) === -1) return;
        if (seen[s.pengajarId]) return;
        seen[s.pengajarId] = true;
        list.push({
          id: s.pengajarId, nama: s.pengajarNama || 'Pengajar', area: s.pengajarArea || '',
          spesialisasi: s.pengajarSpesialisasi || ''
        });
      });
      return list.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); });
    }
    function ageText(birth) {
      if (!birth) return '';
      var d = ui.toDate(birth);
      if (!d) return '';
      var now = new Date();
      var months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (now.getDate() < d.getDate()) months--;
      if (months < 0) return '';
      if (months < 12) return months + ' bulan';
      return Math.floor(months / 12) + ' tahun' + (months % 12 ? ' ' + (months % 12) + ' bln' : '');
    }

    function stepper() {
      return '<div class="stepper">' + steps.map(function (label, i) {
        var idx = i + 1;
        var cls = state.step === idx ? 'active' : (state.step > idx ? 'done' : '');
        return '<div class="step ' + cls + '"><span class="step-dot">' + (state.step > idx ? ui.icon('check', 14) : idx) + '</span><span class="step-label">' + label + '</span></div>' +
          (idx < steps.length ? '<span class="step-line"></span>' : '');
      }).join('') + '</div>';
    }

    function stepHead(title, desc) {
      return '<div class="wizard-panel-head"><span class="wiz-step-label">Langkah ' + state.step + ' dari ' + steps.length + '</span><h2>' + title + '</h2>' +
        (desc ? '<p>' + desc + '</p>' : '') + '</div>';
    }

    function summaryHTML() {
      var p = selectedPackage();
      var picked = selectedSlots().sort(function (a, b) {
        var order = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        return order.indexOf(a.hari) - order.indexOf(b.hari) || String(a.jamMulai).localeCompare(String(b.jamMulai));
      });
      var childName = extend && state.childMode !== 'new'
        ? (selectedChild() ? selectedChild().nama : '')
        : state.child.nama;
      var acc = state.account;
      return '<div class="wizard-summary">' +
        '<h3>' + (extend ? 'Ringkasan Paket Baru' : 'Ringkasan Pendaftaran') + '</h3>' +
        (extend ? '' :
          '<div class="summary-section"><div class="summary-label">Akun orang tua</div><div class="summary-value ' + (acc.nama ? '' : 'muted') + '">' + ui.esc(acc.nama || 'Belum diisi') + '</div>' +
            (acc.username ? '<div class="summary-value muted" style="font-size:10.5px">@' + ui.esc(acc.username) + '</div>' : '') + '</div>') +
        '<div class="summary-section"><div class="summary-label">Anak</div><div class="summary-value ' + (childName ? '' : 'muted') + '">' + ui.esc(childName || 'Belum dipilih') + '</div>' +
          (!extend && ageText(state.child.tglLahir) ? '<div class="summary-value muted" style="font-size:10.5px">' + ui.esc(ageText(state.child.tglLahir)) + '</div>' : '') + '</div>' +
        '<div class="summary-section"><div class="summary-label">Paket</div><div class="summary-value ' + (p ? '' : 'muted') + '">' + (p ? ui.esc(p.nama) : 'Belum dipilih') + '</div>' +
          (p ? '<div class="summary-value muted" style="font-size:10.5px">' + ui.esc(p.sesiPerBulan || p.sesi || 8) + ' sesi · ' + ui.esc(p.durasiMenit || 90) + ' menit</div>' : '') + '</div>' +
        '<div class="summary-section"><div class="summary-label">Jadwal (' + picked.length + ' sesi)</div>' +
          (picked.length
            ? picked.map(function (s) {
                return '<div class="summary-value" style="font-size:11.5px">' + ui.esc(s.hari) + ', ' + ui.esc(s.jamMulai) + '–' + ui.esc(s.jamSelesai) + '</div>' +
                  '<div class="summary-value muted" style="font-size:10px">' + ui.esc(s.pengajarNama || '') + '</div>';
              }).join('')
            : '<div class="summary-value muted">Belum dipilih</div>') + '</div>' +
        '<div class="summary-total"><span>' + (extend ? 'Tagihan paket baru' : 'Biaya bulan pertama') + '</span><b>' + (p ? ui.rupiah(p.harga) : '—') + '</b></div>' +
      '</div>';
    }

    function accountFields() {
      return '<div class="form-grid">' +
        '<div class="field"><label for="accNama">Nama lengkap orang tua <span class="req">*</span></label><input class="input" id="accNama" name="nama" value="' + ui.attr(state.account.nama) + '" placeholder="Nama sesuai identitas" autocomplete="name" required></div>' +
        '<div class="form-grid two" style="gap:12px">' +
          '<div class="field"><label for="accUsername">Username <span class="req">*</span></label><input class="input" id="accUsername" name="username" value="' + ui.attr(state.account.username) + '" placeholder="contoh: bunda.sari" autocomplete="username" required><span class="hint">4–20 karakter, tanpa spasi (huruf, angka, titik, garis bawah).</span></div>' +
          '<div class="field"><label for="accPhone">Nomor WhatsApp <span class="req">*</span></label><input class="input" id="accPhone" name="phone" value="' + ui.attr(state.account.phone) + '" placeholder="08xxxxxxxxxx" inputmode="tel" autocomplete="tel" required><span class="hint">Digunakan untuk notifikasi biaya les.</span></div>' +
        '</div>' +
        '<div class="field"><label for="accEmail">Email <span class="text-soft">(opsional)</span></label><input class="input" id="accEmail" name="email" type="email" value="' + ui.attr(state.account.email) + '" placeholder="nama@email.com" autocomplete="email"></div>' +
        '<div class="form-grid two" style="gap:12px">' +
          '<div class="field"><label for="accPassword">Kata sandi <span class="req">*</span></label><input class="input" id="accPassword" name="password" type="password" autocomplete="new-password" placeholder="Minimal 6 karakter" required></div>' +
          '<div class="field"><label for="accPassword2">Ulangi kata sandi <span class="req">*</span></label><input class="input" id="accPassword2" name="password2" type="password" autocomplete="new-password" placeholder="Ketik ulang kata sandi" required></div>' +
        '</div>' +
        '<div class="alert alert-info">' + ui.icon('info', 16) + '<span>Belum ada biaya pada langkah ini. Anda akan melihat paket dan jadwal tersedia sebelum menyelesaikan pendaftaran.</span></div>' +
      '</div>';
    }

    function stepAccount() {
      return stepHead('Daftar akun orang tua', 'Akun ini untuk masuk ke dashboard dan menerima informasi belajar anak.') +
        '<div class="wizard-panel-body">' + accountFields() + '</div>' +
        '<div class="wizard-panel-foot"><a class="btn btn-ghost" href="#/masuk" data-route>Sudah punya akun? Masuk</a><button type="submit" class="btn btn-primary">Lanjut ke data anak ' + ui.icon('arrowRight', 15) + '</button></div>';
    }

    function childFields() {
      return '<div class="form-grid">' +
        '<div class="form-grid two" style="gap:12px">' +
          '<div class="field"><label for="childNama">Nama lengkap anak <span class="req">*</span></label><input class="input" id="childNama" name="nama" value="' + ui.attr(state.child.nama) + '" placeholder="Nama anak" required></div>' +
          '<div class="field"><label for="childPanggilan">Nama panggilan</label><input class="input" id="childPanggilan" name="panggilan" value="' + ui.attr(state.child.panggilan) + '" placeholder="Nama yang disukai anak"></div>' +
        '</div>' +
        '<div class="form-grid two" style="gap:12px">' +
          '<div class="field"><label>Jenis kelamin <span class="req">*</span></label><div class="radio-row" style="padding-top:3px">' +
            '<label class="radio-pill"><input type="radio" name="gender" value="laki" ' + (state.child.gender === 'laki' ? 'checked' : '') + '><span>Laki-laki</span></label>' +
            '<label class="radio-pill"><input type="radio" name="gender" value="perempuan" ' + (state.child.gender === 'perempuan' ? 'checked' : '') + '><span>Perempuan</span></label>' +
          '</div></div>' +
          '<div class="field"><label for="childTgl">Tanggal lahir <span class="req">*</span></label><input class="input" id="childTgl" name="tglLahir" type="date" value="' + ui.attr(state.child.tglLahir) + '" required></div>' +
        '</div>' +
        '<div class="form-grid two" style="gap:12px">' +
          '<div class="field"><label for="childSekolah">Sekolah</label><input class="input" id="childSekolah" name="sekolah" value="' + ui.attr(state.child.sekolah) + '" placeholder="Nama sekolah"></div>' +
          '<div class="field"><label for="childKelas">Kelas</label><input class="input" id="childKelas" name="kelas" value="' + ui.attr(state.child.kelas) + '" placeholder="contoh: 2 SD"></div>' +
        '</div>' +
        '<div class="field"><label for="childCatatan">Catatan kebutuhan belajar <span class="text-soft">(opsional)</span></label><textarea class="textarea" id="childCatatan" name="catatan" placeholder="Contoh: perlu penguatan membaca, mudah bosan jika terlalu lama duduk.">' + ui.esc(state.child.catatan) + '</textarea></div>' +
      '</div>';
    }

    function stepChild() {
      return stepHead('Data diri anak', 'Informasi ini membantu pengajar menyiapkan pendampingan yang sesuai.') +
        '<div class="wizard-panel-body">' + childFields() + '</div>' +
        '<div class="wizard-panel-foot"><button type="button" class="btn btn-outline" data-back="1">' + ui.icon('arrowLeft', 15) + ' Kembali</button><button type="submit" class="btn btn-primary">Lanjut pilih paket ' + ui.icon('arrowRight', 15) + '</button></div>';
    }

    function stepChildExtend() {
      if (!state.childrenLoaded) {
        return stepHead('Pilih anak atau tambah anak baru', 'Memuat data anak pada akun Anda…') +
          '<div class="wizard-panel-body">' + (state.childrenError
            ? ui.empty('alert', 'Data anak gagal dimuat', state.childrenError, '<button type="button" class="btn btn-outline" data-retry-children="1">' + ui.icon('refresh', 15) + ' Coba lagi</button>')
            : ui.loadingBlock()) + '</div>';
      }
      var menus = menusById();
      var options = state.children.map(function (c) {
        var menu = menus[c.id];
        var active = menu && menu.paketNama;
        var checked = state.childMode !== 'new' && String(state.anakId) === String(c.id);
        return '<label class="package-choice' + (active ? ' is-taken' : '') + '">' +
          '<input type="radio" name="anakId" value="' + ui.attr(c.id) + '" ' + (active ? 'disabled' : '') + ' ' + (checked ? 'checked' : '') + '>' +
          '<span class="package-choice-inner"><span class="pk-radio"></span>' +
            ui.avatar(c.nama, c.fotoUrl, 'sm', 'sun') +
            '<span class="pk-body"><b>' + ui.esc(c.nama) + '</b><span>' + ui.esc([c.kelas, c.sekolah].filter(Boolean).join(' · ') || 'Data anak tersimpan') + '</span></span>' +
            '<span class="pk-price"><small>' + (active ? 'Paket aktif: ' + ui.esc(menu.paketNama) : 'Siap menambah paket') + '</small></span>' +
          '</span></label>';
      }).join('');
      var addNew = '<label class="package-choice"><input type="radio" name="anakId" value="new" ' + (state.childMode === 'new' ? 'checked' : '') + '>' +
        '<span class="package-choice-inner"><span class="pk-radio"></span>' +
          '<span class="pk-body"><b>Tambah anak baru</b><span>Daftarkan anak lain pada akun yang sama — tanpa membuat akun baru.</span></span>' +
        '</span></label>';
      var newFields = state.childMode === 'new' ? '<div class="mt-20">' + childFields() + '</div>' : '';
      return stepHead('Pilih anak & tambah paket', 'Gunakan data anak yang sudah tersimpan, atau tambahkan anak baru pada akun yang sama.') +
        '<div class="wizard-panel-body">' +
          (state.children.length ? '<div class="package-pick-grid">' + options + addNew + '</div>' : '<div class="alert alert-info mb-16">' + ui.icon('info', 16) + '<span>Belum ada data anak pada akun ini. Isi data anak baru di bawah.</span></div>' + addNew) +
          newFields +
        '</div>' +
        '<div class="wizard-panel-foot"><a class="btn btn-ghost" href="#/ortu/dashboard" data-route>' + ui.icon('arrowLeft', 15) + ' Batal</a><button type="submit" class="btn btn-primary">Lanjut pilih paket ' + ui.icon('arrowRight', 15) + '</button></div>';
    }

    function stepPackage() {
      if (!state.loaded) {
        return stepHead('Pilih paket belajar', 'Memuat pilihan paket…') + '<div class="wizard-panel-body">' + ui.loadingBlock() + '</div>';
      }
      if (state.loadError) {
        return stepHead('Pilih paket belajar') + '<div class="wizard-panel-body">' +
          ui.empty('alert', 'Paket gagal dimuat', state.loadError, '<button type="button" class="btn btn-outline" data-retry="1">' + ui.icon('refresh', 15) + ' Coba lagi</button>') + '</div>';
      }
      var packages = state.packages;
      var packagesBody = packages.length
        ? '<div class="package-pick-grid">' + packages.map(function (p) {
            return '<label class="package-choice"><input type="radio" name="paketId" value="' + ui.attr(p.id) + '" ' + (state.paketId === p.id ? 'checked' : '') + '>' +
              '<span class="package-choice-inner"><span class="pk-radio"></span><span class="pk-body"><b>' + ui.esc(p.nama) + '</b><span>' + ui.esc(p.deskripsi || 'Pendampingan belajar sesuai kebutuhan.') + '</span></span>' +
              '<span class="pk-price"><strong>' + ui.rupiah(p.harga) + '</strong><small>' + ui.esc(p.sesiPerBulan || p.sesi || 8) + ' sesi · ' + ui.esc(p.durasiMenit || 90) + ' menit</small></span></span></label>';
          }).join('') + '</div>'
        : ui.empty('book', 'Belum ada paket aktif', 'Hubungi admin Bimba untuk informasi paket dan jadwal.');
      return stepHead('Pilih paket belajar', 'Harga sudah termasuk pendampingan, laporan berkala, dan akses dashboard orang tua.') +
        '<div class="wizard-panel-body">' + packagesBody + '</div>' +
        '<div class="wizard-panel-foot"><button type="button" class="btn btn-outline" data-back="1">' + ui.icon('arrowLeft', 15) + ' Kembali</button><button type="submit" class="btn btn-primary" ' + (packages.length ? '' : 'disabled') + '>Lanjut pilih jadwal ' + ui.icon('arrowRight', 15) + '</button></div>';
    }

    function slotGroups() {
      var order = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      var groups = {};
      state.slots.filter(function (s) { return s.pengajarId === state.teacherFilter; }).forEach(function (s) {
        var day = s.hari || 'Lainnya';
        (groups[day] = groups[day] || []).push(s);
      });
      if (!Object.keys(groups).length) {
        return ui.empty('calendar', 'Belum ada jam tersedia', 'Pengajar ini belum memiliki jadwal pada paket yang dipilih.');
      }
      return order.filter(function (d) { return groups[d] && groups[d].length; }).map(function (day) {
        var list = groups[day].sort(function (a, b) { return String(a.jamMulai).localeCompare(String(b.jamMulai)); });
        return '<div class="slot-day"><h4>' + ui.icon('calendar', 14) + ' ' + ui.esc(day) + ' <span>' + list.filter(function (s) { return !s.terisi; }).length + ' jadwal</span></h4><div class="slot-choices">' +
          list.map(function (s) {
            var taken = !!s.terisi;
            var checked = state.slotIds.indexOf(s.id) !== -1;
            var conflict = !taken && !checked && conflictWith(s);
            var full = !taken && !checked && state.slotIds.length >= 3;
            var disabled = taken || conflict || full;
            var nama = s.pengajarNama || 'Pengajar';
            var status = taken ? 'Sudah diambil' : (checked ? 'Dipilih' : (conflict ? 'Bentrok jam' : (full ? 'Maksimal 3' : 'Tersedia')));
            return '<label class="slot-choice ' + (taken ? 'is-taken ' : '') + (conflict ? 'is-conflict ' : '') + '">' +
              '<input type="checkbox" name="slotIds" value="' + ui.attr(s.id) + '" ' + (disabled ? 'disabled' : '') + ' ' + (checked ? 'checked' : '') + '>' +
              '<span class="slot-choice-inner"><span class="slot-time">' + ui.esc(s.jamMulai) + '–' + ui.esc(s.jamSelesai) + '</span>' +
              '<span class="slot-teacher">' +
                (s.pengajarFoto ? '<img class="slot-avatar" src="' + ui.attr(s.pengajarFoto) + '" alt="Foto ' + ui.attr(nama) + '" />' : '<span class="slot-avatar slot-avatar-text">' + ui.esc(nama.charAt(0).toUpperCase()) + '</span>') +
                '<span class="slot-teacher-info"><b>' + ui.esc(nama) + '</b><span class="slot-area">' + ui.icon('mapPin', 10) + '<span>' + ui.esc(s.pengajarArea || 'Area belum diatur') + '</span></span></span>' +
              '</span>' +
              '<span class="slot-status ' + (taken || conflict || full ? 'taken' : 'free') + '">' + status + '</span></span></label>';
          }).join('') + '</div></div>';
      }).join('');
    }

    function pickedBlock() {
      var picked = selectedSlots().sort(function (a, b) {
        var order = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        return order.indexOf(a.hari) - order.indexOf(b.hari) || String(a.jamMulai).localeCompare(String(b.jamMulai));
      });
      if (!picked.length) return '';
      return '<div class="slot-picked"><div class="sp-head">' + ui.icon('check', 13) + ' Sesi dipilih <b>' + picked.length + '/3</b></div><div class="sp-chips">' +
        picked.map(function (s) {
          return '<span class="sp-chip">' + ui.esc(s.hari) + ', ' + ui.esc(s.jamMulai) + '–' + ui.esc(s.jamSelesai) +
            ' <button type="button" data-remove-slot="' + ui.attr(s.id) + '" aria-label="Hapus sesi">' + ui.icon('x', 11) + '</button></span>';
        }).join('') + '</div><div class="hint">Anda dapat memilih lebih dari satu sesi belajar (maksimal 3) dengan pengajar yang sama.</div></div>';
    }

    function stepSchedule() {
      if (!state.loaded) {
        return stepHead('Pilih jadwal belajar') + '<div class="wizard-panel-body">' + ui.loadingBlock() + '</div>';
      }
      if (!selectedPackage()) {
        return stepHead('Pilih jadwal belajar') + '<div class="wizard-panel-body">' +
          ui.empty('book', 'Pilih paket terlebih dahulu', 'Kembali ke langkah paket untuk memilih paket belajar.', '<button type="button" class="btn btn-outline" data-back="1">Pilih paket</button>') + '</div>';
      }
      var p = selectedPackage();
      var body;
      if (state.slotsError) {
        body = ui.empty('alert', 'Jadwal gagal dimuat', state.slotsError, '<button type="button" class="btn btn-outline" data-retry-slots="1">' + ui.icon('refresh', 15) + ' Coba lagi</button>');
      } else if (!state.slots.length) {
        body = ui.empty('calendar', 'Belum ada jadwal untuk paket ini', 'Silakan hubungi admin Bimba. Jadwal baru akan segera dibuka.');
      } else {
        var areas = areaList();
        var teachers = teacherList();
        var teacher = teachers.filter(function (t) { return t.id === state.teacherFilter; })[0];
        var filter = '<div class="slot-filter"><div class="form-grid two" style="gap:12px">' +
          '<div class="field"><label for="slotAreaSelect">Area lokasi les <span class="req">*</span></label><select class="select" id="slotAreaSelect"><option value="">Pilih area lokasi…</option>' +
            areas.map(function (a) { return '<option value="' + ui.attr(a) + '"' + (state.areaFilter === a ? ' selected' : '') + '>' + ui.esc(a) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="slotTeacher">Nama miss <span class="req">*</span></label><select class="select" id="slotTeacher" ' + (state.areaFilter ? '' : 'disabled') + '><option value="">' +
            (state.areaFilter ? 'Pilih nama miss…' : 'Pilih area terlebih dahulu') + '</option>' +
            teachers.map(function (t) { return '<option value="' + ui.attr(t.id) + '"' + (state.teacherFilter === t.id ? ' selected' : '') + '>' + ui.esc(t.nama) + '</option>'; }).join('') + '</select></div>' +
          '</div></div>';
        var detail;
        if (!state.areaFilter) {
          detail = '<div class="note-box slot-note">' + ui.icon('mapPin', 14) + ' Pilih area lokasi les untuk melihat nama miss yang tersedia di area tersebut.</div>';
        } else if (!state.teacherFilter) {
          detail = '<div class="note-box slot-note">' + ui.icon('users', 14) + ' Pilih nama miss untuk melihat rincian hari dan jam belajar yang tersedia.</div>';
        } else {
          detail = '<div class="slot-teacher-head">' +
            (teacher ? ui.avatar(teacher.nama, (state.slots.filter(function (s) { return s.pengajarId === teacher.id; })[0] || {}).pengajarFoto, 'sm', 'sun') : '') +
            '<div class="sth-info"><b>' + ui.esc(teacher ? teacher.nama : '') + '</b><span>' + ui.icon('mapPin', 10) + ' ' + ui.esc(teacher ? teacher.area : '') +
            (teacher && teacher.spesialisasi ? ' · ' + ui.esc(teacher.spesialisasi) : '') + '</span></div>' +
            '<span class="sth-count">' + state.slots.filter(function (s) { return s.pengajarId === state.teacherFilter && !s.terisi; }).length + ' jadwal tersedia</span></div>' + slotGroups();
        }
        body = '<div class="slot-toolbar"><div class="note-box" style="flex:1">Pilih area, miss, lalu centang satu atau beberapa sesi hari &amp; jam yang tersedia.</div>' +
          '<div class="slot-legend"><span><i class="legend-dot"></i> Tersedia</span><span><i class="legend-dot taken"></i> Terisi / bentrok</span></div></div>' +
          filter + detail + pickedBlock();
      }
      var back = state.step > 1 ? '<button type="button" class="btn btn-outline" data-back="1">' + ui.icon('arrowLeft', 15) + ' Kembali</button>' : '<span></span>';
      return stepHead('Pilih jadwal belajar', 'Paket ' + ui.esc(p.nama) + ' · ' + ui.rupiah(p.harga) + ' · area lokasi, miss, dan jam tersedia') +
        '<div class="wizard-panel-body" id="slotArea">' + body +
          '<div class="field-error" id="slotError" style="display:none;margin-top:8px"></div>' +
          '<label class="check reg-terms"><input type="checkbox" name="terms" id="regTerms"> <span>Saya menyetujui data yang diisi benar dan bersedia mengikuti ketentuan jadwal serta pembayaran Bimba Mahatari Kecil.</span></label>' +
          '<div class="field-error" id="termsError" style="display:none;margin-top:6px"></div>' +
        '</div>' +
        '<div class="wizard-panel-foot">' + back + '<button type="submit" class="btn btn-sun" id="registerSubmit">' +
          (extend ? 'Simpan &amp; aktifkan paket ' : 'Daftar &amp; buat akun ') + ui.icon('check', 15) + '</button></div>';
    }

    function stepHTML() {
      if (!extend && state.step === 1) return stepAccount();
      if (extend && state.step === 1) return stepChildExtend();
      if (!extend && state.step === 2) return stepChild();
      if (state.step === steps.length - 1) return stepPackage();
      return stepSchedule();
    }

    function render() {
      if (!rootEl) return;
      rootEl.querySelector('#wizardPanel').innerHTML = stepHTML();
      rootEl.querySelector('#wizardStepper').innerHTML = stepper();
      rootEl.querySelector('#wizardAside').innerHTML = summaryHTML();
      bindStep();
      var panel = rootEl.querySelector('#wizardPanel');
      var y = panel.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    function updateStateFromForm(form) {
      var d = ui.serialize(form);
      if (!extend && state.step === 1) {
        state.account = {
          nama: d.nama || '', username: d.username || '', phone: d.phone || '', email: d.email || '',
          password: d.password || '', password2: d.password2 || ''
        };
        return;
      }
      var isChildStep = (!extend && state.step === 2) || (extend && state.step === 1);
      if (isChildStep) {
        if (extend) {
          var val = String(d.anakId || '');
          state.childMode = val === 'new' ? 'new' : 'existing';
          state.anakId = val === 'new' ? '' : val;
        }
        if (!extend || state.childMode === 'new') {
          state.child = {
            nama: d.nama || '', panggilan: d.panggilan || '', gender: d.gender || '',
            tglLahir: d.tglLahir || '', sekolah: d.sekolah || '', kelas: d.kelas || '', catatan: d.catatan || ''
          };
        }
        return;
      }
      if (state.step === steps.length - 1) {
        state.paketId = d.paketId || '';
        return;
      }
      if (state.step === steps.length) {
        state.slotIds = Array.prototype.map.call(form.querySelectorAll('input[name="slotIds"]:checked'), function (x) { return x.value; });
      }
    }

    function validateChild(d, form) {
      if ((d.nama || '').length < 2) { ui.fieldError(form, 'nama', 'Masukkan nama lengkap anak.'); return false; }
      if (!d.gender) { ui.toast('Pilih jenis kelamin anak.', 'error'); return false; }
      if (!d.tglLahir) { ui.fieldError(form, 'tglLahir', 'Masukkan tanggal lahir anak.'); return false; }
      var birth = ui.toDate(d.tglLahir);
      if (!birth || birth > new Date()) { ui.fieldError(form, 'tglLahir', 'Tanggal lahir tidak boleh di masa depan.'); return false; }
      return true;
    }

    function setSlotError(msg) {
      var el = document.getElementById('slotError');
      if (!el) return;
      el.style.display = msg ? 'block' : 'none';
      el.textContent = msg || '';
      if (msg && el.scrollIntoView) {
        try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* abaikan */ }
      }
    }

    function validateStep(form) {
      ui.clearErrors(form);
      var d = ui.serialize(form);
      if (!extend && state.step === 1) {
        if ((d.nama || '').length < 2) { ui.fieldError(form, 'nama', 'Masukkan nama lengkap orang tua.'); return false; }
        if (!/^[A-Za-z0-9._-]{4,20}$/.test(d.username || '')) { ui.fieldError(form, 'username', 'Username 4–20 karakter: huruf, angka, titik, garis bawah, atau strip.'); return false; }
        var phone = String(d.phone || '').replace(/[^\d+]/g, '');
        if (phone.length < 9 || phone.length > 16) { ui.fieldError(form, 'phone', 'Masukkan nomor WhatsApp yang valid (contoh 081234567890).'); return false; }
        if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { ui.fieldError(form, 'email', 'Format email belum benar.'); return false; }
        if ((d.password || '').length < C.PASSWORD_MIN) { ui.fieldError(form, 'password', 'Kata sandi minimal ' + C.PASSWORD_MIN + ' karakter.'); return false; }
        if (d.password !== d.password2) { ui.fieldError(form, 'password2', 'Ulangi kata sandi dengan benar.'); return false; }
        return true;
      }
      var isChildStep = (!extend && state.step === 2) || (extend && state.step === 1);
      if (isChildStep) {
        if (extend) {
          var val = String(d.anakId || '');
          if (!val) { ui.toast('Pilih anak yang akan ditambahkan paketnya.', 'error'); return false; }
          if (val === 'new') { state.childMode = 'new'; return validateChild(d, form); }
          state.childMode = 'existing';
          state.anakId = val;
          var menu = menusById()[val];
          if (menu && menu.paketNama) {
            ui.toast('Anak ini masih memiliki paket aktif (' + menu.paketNama + '). Paket baru dapat ditambahkan setelah paket sebelumnya selesai.', 'error', 6500);
            return false;
          }
          return true;
        }
        return validateChild(d, form);
      }
      if (state.step === steps.length - 1) {
        if (!d.paketId) { ui.toast('Pilih salah satu paket belajar.', 'error'); return false; }
        return true;
      }
      if (state.step === steps.length) {
        var ids = Array.prototype.map.call(form.querySelectorAll('input[name="slotIds"]:checked'), function (x) { return x.value; });
        if (!ids.length) { setSlotError('Pilih minimal satu jadwal yang tersedia.'); return false; }
        setSlotError('');
        if (!form.elements.terms || !form.elements.terms.checked) {
          var te = document.getElementById('termsError');
          if (te) { te.style.display = 'block'; te.textContent = 'Centang persetujuan sebelum melanjutkan.'; }
          ui.toast('Centang persetujuan terlebih dahulu.', 'error');
          return false;
        }
        state.slotIds = ids;
        return true;
      }
      return true;
    }

    async function loadChildren(force) {
      if (state.childrenLoaded && !force) return;
      if (force) { state.childrenLoaded = false; }
      state.childrenError = '';
      if (state.step === 1 && extend) render();
      try {
        var data = await api.call('ortu.children', {});
        state.children = (data && data.children) || [];
        state.menus = (data && data.menus) || [];
        state.childrenLoaded = true;
        var firstMenu = state.children.length === 1 ? menusById()[state.children[0].id] : null;
        if (!state.children.length) state.childMode = 'new';
        if (!state.anakId && state.children.length === 1 && !(firstMenu && firstMenu.paketNama)) {
          state.anakId = state.children[0].id;
        }
      } catch (err) {
        state.childrenError = err.message;
        state.childrenLoaded = true;
      }
      if (state.step === 1 && extend) render();
    }

    async function ensurePackages(force) {
      if (state.loaded && !force) { maybeLoadSlots(); return; }
      state.loaded = false;
      state.loadError = '';
      if (state.step >= 2) render();
      try {
        var data = await api.publicHome();
        state.packages = (data && data.paket) || [];
        state.loaded = true;
        if (!state.paketId && state.packages.length === 1) state.paketId = state.packages[0].id;
        if (state.paketId && !state.packages.some(function (p) { return p.id === state.paketId; })) state.paketId = '';
      } catch (err) {
        state.loadError = err.message;
        state.loaded = true;
      }
      if (state.step >= 2) render();
      else if (rootEl && rootEl.querySelector('#wizardAside')) rootEl.querySelector('#wizardAside').innerHTML = summaryHTML();
      maybeLoadSlots();
    }

    async function maybeLoadSlots(force) {
      if (state.step !== steps.length || !state.paketId) return;
      if (state.slots.length && !force) return;
      state.slotsError = '';
      state.slots = [];
      state.slotIds = [];
      state.areaFilter = '';
      state.teacherFilter = '';
      render();
      try {
        var data = extend
          ? await api.call('ortu.slots', { paketId: state.paketId })
          : await api.publicSlots(state.paketId);
        state.slots = (data && data.slots) || [];
        if (extend && data && data.children) {
          state.children = data.children;
          if (data.paket && !state.packages.some(function (p) { return p.id === data.paket.id; })) state.packages.push(data.paket);
        }
      } catch (err) {
        state.slotsError = err.message;
      }
      render();
    }

    function bindStep() {
      var form = rootEl.querySelector('#wizardForm');
      if (!form) return;
      Array.prototype.forEach.call(form.querySelectorAll('[data-back]'), function (b) {
        b.onclick = function () {
          updateStateFromForm(form);
          state.step = Math.max(1, state.step - Number(b.getAttribute('data-back')));
          if (state.step < steps.length) state.slotIds = [];
          render();
        };
      });
      var retry = form.querySelector('[data-retry]');
      if (retry) retry.onclick = function () { ensurePackages(true); };
      var retryChildren = form.querySelector('[data-retry-children]');
      if (retryChildren) retryChildren.onclick = function () { loadChildren(true); };
      var retrySlots = form.querySelector('[data-retry-slots]');
      if (retrySlots) retrySlots.onclick = function () { maybeLoadSlots(true); };
      var terms = form.querySelector('#regTerms');
      if (terms) terms.onchange = function () {
        var te = document.getElementById('termsError');
        if (terms.checked && te) { te.style.display = 'none'; te.textContent = ''; }
      };
      Array.prototype.forEach.call(form.querySelectorAll('input[name="paketId"]'), function (input) {
        input.onchange = function () {
          state.paketId = input.value;
          state.slots = [];
          state.slotIds = [];
          rootEl.querySelector('#wizardAside').innerHTML = summaryHTML();
        };
      });
      Array.prototype.forEach.call(form.querySelectorAll('input[name="anakId"]'), function (input) {
        input.onchange = function () {
          state.childMode = input.value === 'new' ? 'new' : 'existing';
          state.anakId = input.value === 'new' ? '' : input.value;
          render();
        };
      });
      var areaSel = form.querySelector('#slotAreaSelect');
      if (areaSel) areaSel.onchange = function () {
        state.areaFilter = areaSel.value;
        state.teacherFilter = '';
        state.slotIds = [];
        render();
      };
      var teacherSel = form.querySelector('#slotTeacher');
      if (teacherSel) teacherSel.onchange = function () {
        state.teacherFilter = teacherSel.value;
        state.slotIds = [];
        render();
      };
      Array.prototype.forEach.call(form.querySelectorAll('input[name="slotIds"]'), function (input) {
        input.onchange = function () {
          var ids = Array.prototype.map.call(form.querySelectorAll('input[name="slotIds"]:checked'), function (x) { return x.value; });
          if (ids.length > 3) {
            input.checked = false;
            ui.toast('Maksimal 3 sesi belajar dalam satu pendaftaran.', 'info');
            return;
          }
          state.slotIds = ids;
          render();
        };
      });
      Array.prototype.forEach.call(form.querySelectorAll('[data-remove-slot]'), function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute('data-remove-slot');
          state.slotIds = state.slotIds.filter(function (x) { return x !== id; });
          render();
        };
      });
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = state.submitting;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (state.submitting) return;
        if (!validateStep(form)) return;
        updateStateFromForm(form);
        if (state.step < steps.length) {
          state.step += 1;
          render();
          if (state.step === steps.length - 1) ensurePackages(false);
          if (state.step === steps.length) maybeLoadSlots(false);
          return;
        }
        finish(form);
      });
    }

    async function finish(form) {
      state.submitting = true;
      var btn = form.querySelector('#registerSubmit');
      ui.busy(btn, true, extend ? 'Menyimpan paket…' : 'Mendaftarkan…');
      try {
        if (extend) {
          var anakId = state.anakId;
          if (state.childMode === 'new') {
            var saved = await api.call('ortu.child.save', {
              nama: state.child.nama, panggilan: state.child.panggilan, gender: state.child.gender,
              tglLahir: state.child.tglLahir, sekolah: state.child.sekolah, kelas: state.child.kelas, catatan: state.child.catatan
            });
            anakId = saved.child.id;
          }
          await api.call('ortu.enroll', { anakId: anakId, paketId: state.paketId, slotIds: state.slotIds });
          state.submitting = false;
          ui.busy(btn, false);
          BMK.store.setActiveChild(anakId);
          ui.toast('Paket belajar berhasil ditambahkan. Tagihan baru tersedia di menu Administrasi.', 'success', 6000);
          BMK.app.navigate('#/ortu/administrasi', true);
          return;
        }
        var payload = {
          account: {
            nama: state.account.nama, username: state.account.username, phone: state.account.phone,
            email: state.account.email, password: state.account.password
          },
          child: state.child,
          paketId: state.paketId,
          slotIds: state.slotIds
        };
        var res = await api.register(payload);
        BMK.store.setSession(res.token, res.user);
        ui.toast('Pendaftaran berhasil. Selamat bergabung!', 'success', 5000);
        BMK.app.enterApp(res.user);
      } catch (err) {
        state.submitting = false;
        ui.busy(btn, false);
        if (err.code === 'SLOT_TAKEN' || err.code === 'SESSION_OVERLAP') {
          state.slotIds = [];
          ui.toast(err.message, 'error', 6500);
          maybeLoadSlots(true);
        } else if (err.code === 'CONFLICT') {
          ui.toast(err.message, 'error', 6500);
          if (extend) loadChildren(true);
        } else {
          ui.toast(err.message, 'error', 5600);
        }
      }
    }

    function mount(root) {
      rootEl = root;
      document.title = extend ? 'Tambah Paket Belajar — Bimba Mahatari Kecil' : 'Pendaftaran Siswa Baru — Bimba Mahatari Kecil';
      render();
      if (extend) loadChildren(false);
      ensurePackages(false);
    }

    var html =
      '<div class="' + (embedded ? 'register-embed' : 'register-page') + '">' +
        (embedded ? '' :
          '<div class="register-nav">' + brand() +
            '<div class="row small text-muted">Sudah punya akun? <a href="#/masuk" data-route class="bold">Masuk</a></div>' +
          '</div>') +
        '<div class="wizard-wrap">' +
          (embedded
            ? '<div class="wizard-head wizard-head-embed"><h1>Tambah / perpanjang paket</h1><p>Pilih anak, paket, dan jadwal belajar. Tidak perlu membuat akun atau mengisi ulang data anak.</p></div>'
            : '<div class="wizard-head"><h1>Mulai perjalanan belajar anak</h1><p>Empat langkah singkat untuk bergabung dengan Bimba Mahatari Kecil.</p></div>') +
          '<div id="wizardStepper">' + stepper() + '</div>' +
          '<div class="wizard-grid">' +
            '<form class="wizard-panel" id="wizardForm" novalidate><div id="wizardPanel">' + stepHTML() + '</div></form>' +
            '<aside class="wizard-aside" id="wizardAside">' + summaryHTML() + '</aside>' +
          '</div>' +
          (embedded ? '' : '<p class="form-note text-center mt-20">Dengan mendaftar, data Anda disimpan aman di Google Sheets milik Bimba dan hanya digunakan untuk layanan pembelajaran.</p>') +
        '</div>' +
      '</div>';

    return { html: html, mount: mount };
  };

})();

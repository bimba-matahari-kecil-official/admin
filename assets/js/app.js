(function () {
  window.BMK = window.BMK || {};
  var ui = BMK.ui;
  var api = BMK.api;
  var store = BMK.store;

  var NAV = {
    admin: [
      { label: 'Utama' },
      { key: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
      { label: 'Manajemen' },
      { key: 'anak', title: 'Data Anak', icon: 'child' },
      { key: 'guru', title: 'Data Pengajar', icon: 'graduation' },
      { key: 'paket', title: 'Paket & Jadwal', icon: 'book' },
      { label: 'Pembelajaran' },
      { key: 'harian', title: 'Laporan Harian', icon: 'clipboard' },
      { key: 'lpmb', title: 'Laporan LPMB', icon: 'fileCheck' },
      { label: 'Keuangan' },
      { key: 'biaya', title: 'Biaya Les', icon: 'wallet' },
      { key: 'gaji', title: 'Gaji Pengajar', icon: 'banknote' },
      { label: 'Sistem' },
      { key: 'pengaturan', title: 'Pengaturan', icon: 'settings' }
    ],
    guru: [
      { label: 'Utama' },
      { key: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
      { label: 'Pembelajaran' },
      { key: 'absensi', title: 'Absensi Siswa', icon: 'mapPin' },
      { key: 'harian', title: 'Laporan Harian', icon: 'clipboard' },
      { key: 'lpmb', title: 'Laporan LPMB', icon: 'fileCheck' },
      { label: 'Akun' },
      { key: 'pengaturan', title: 'Pengaturan', icon: 'settings' }
    ],
    ortu: [
      { label: 'Utama' },
      { key: 'dashboard', title: 'Dashboard', icon: 'dashboard' },
      { key: 'administrasi', title: 'Administrasi', icon: 'wallet' },
      { key: 'perpanjang', title: 'Tambah Paket', icon: 'book' },
      { label: 'Perkembangan Anak' },
      { key: 'harian', title: 'Hasil Belajar Harian', icon: 'clipboard' },
      { key: 'lpmb', title: 'Rapor LPMB', icon: 'award' },
      { label: 'Akun' },
      { key: 'pengaturan', title: 'Pengaturan', icon: 'settings' }
    ]
  };

  var HELP_TEXT = {
    admin: { title: 'Butuh bantuan?', text: 'Kelola data secara berkala. Perubahan penting akan tercatat di Google Sheets.' },
    guru: { title: 'Tips pengajar', text: 'Lengkapi foto absensi dan laporan harian agar orang tua mendapat kabar terbaik.' },
    ortu: { title: 'Untuk orang tua', text: 'Laporan tersimpan rapi. Anda dapat mengunduh rapor dan memantau tagihan kapan saja.' }
  };

  var state = {
    user: null,
    booting: true,
    seq: 0,
    unauthHandled: false
  };

  function normalizeRole(role) {
    return role === 'pengajar' ? 'guru' : (role || 'ortu');
  }

  function homePath(role) {
    role = normalizeRole(role);
    return '#/' + role + '/dashboard';
  }

  function parseHash() {
    var raw = location.hash || '';
    if (raw.indexOf('#') === 0) raw = raw.slice(1);
    if (raw.indexOf('/') === 0) raw = raw.slice(1);
    var q = '';
    var qi = raw.indexOf('?');
    if (qi >= 0) { q = raw.slice(qi + 1); raw = raw.slice(0, qi); }
    var parts = raw.split('/').filter(Boolean);
    var params = {};
    if (q) {
      try {
        new URLSearchParams(q).forEach(function (v, k) { params[k] = v; });
      } catch (e) { /* abaikan */ }
    }
    return { path: '/' + parts.join('/'), parts: parts, params: params, raw: raw };
  }

  function roleFromParts(parts) {
    var first = parts[0] || '';
    if (first === 'admin') return 'admin';
    if (first === 'guru' || first === 'pengajar') return 'guru';
    if (first === 'ortu') return 'ortu';
    return '';
  }

  function findNav(role, key) {
    return (NAV[role] || []).filter(function (item) { return item.key === key; })[0] || null;
  }

  function navHTML(role, activeKey) {
    return (NAV[role] || []).map(function (item) {
      if (!item.key) return '<div class="side-label">' + ui.esc(item.label || '') + '</div>';
      var active = item.key === activeKey;
      return '<a class="side-link ' + (active ? 'active' : '') + '" href="#/' + role + '/' + item.key + '" data-route>' +
        ui.icon(item.icon, 17) + '<span>' + ui.esc(item.title) + '</span>' +
      '</a>';
    }).join('');
  }

  function shellHTML(role, activeKey) {
    var user = state.user || {};
    var help = HELP_TEXT[role] || HELP_TEXT.ortu;
    var roleName = ui.roleLabel(role);
    return '<div class="app-shell">' +
      '<aside class="sidebar" id="appSidebar">' +
        '<a class="brand" href="' + homePath(role) + '" data-route>' +
          '<span class="brand-mark"><img src="' + CONFIG.LOGO_URL + '" alt="Logo Bimba Mahatari Kecil" /></span>' +
          '<span class="brand-text"><span class="brand-name">Bimba Mahatari Kecil</span><span class="brand-sub">Learning &amp; Playing</span></span>' +
        '</a>' +
        '<div class="side-profile">' + ui.avatar(user.nama, user.fotoUrl, 'sm', 'sun') +
          '<div class="sp-info"><b id="shellUserName">' + ui.esc(user.nama || 'Pengguna') + '</b><span>' + ui.esc(roleName) + '</span></div>' +
          '<span class="side-dot" style="width:7px;height:7px;border-radius:50%;background:#66d9a6;flex:none"></span>' +
        '</div>' +
        '<nav class="side-nav">' + navHTML(role, activeKey) + '</nav>' +
        '<div class="side-foot">' +
          '<div class="side-help"><b>' + ui.icon('heart', 13) + ' ' + ui.esc(help.title) + '</b>' + ui.esc(help.text) + '</div>' +
          '<button type="button" class="side-logout" data-action="logout">' + ui.icon('logout', 16) + ' Keluar dari akun</button>' +
        '</div>' +
      '</aside>' +
      '<div class="sidebar-overlay" id="sidebarOverlay"></div>' +
      '<div class="app-main">' +
        '<header class="topbar">' +
          '<button type="button" class="icon-btn plain menu-btn" id="menuBtn" aria-label="Buka menu">' + ui.icon('menu', 20) + '</button>' +
          '<div class="topbar-title">Bimba Mahatari Kecil <span>/ ' + ui.esc((findNav(role, activeKey) || {}).title || 'Dashboard') + '</span></div>' +
          '<div class="topbar-spacer"></div>' +
          '<div class="top-actions">' +
            '<div class="top-date">' + ui.icon('calendar', 14) + ' ' + ui.esc(ui.todayLong()) + '</div>' +
            '<button type="button" class="icon-btn plain" data-action="logout" aria-label="Keluar" title="Keluar">' + ui.icon('logout', 18) + '</button>' +
            '<a class="top-user" href="#/' + role + '/pengaturan" data-route title="Buka pengaturan akun">' +
              '<span class="top-user-info"><b>' + ui.esc(user.nama || 'Pengguna') + '</b><span>' + ui.esc(roleName) + '</span></span>' +
              ui.avatar(user.nama, user.fotoUrl, 'sm', 'sun') +
            '</a>' +
          '</div>' +
        '</header>' +
        '<main class="view" id="view" tabindex="-1"></main>' +
      '</div>' +
    '</div>';
  }

  function bindShell(root) {
    var sidebar = root.querySelector('#appSidebar');
    var overlay = root.querySelector('#sidebarOverlay');
    var menu = root.querySelector('#menuBtn');
    function closeMenu() {
      if (!sidebar) return;
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    }
    if (menu) menu.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show', sidebar.classList.contains('open'));
    });
    if (overlay) overlay.addEventListener('click', closeMenu);
    Array.prototype.forEach.call(root.querySelectorAll('.side-link'), function (a) { a.addEventListener('click', closeMenu); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-action="logout"]'), function (b) {
      b.addEventListener('click', function () { BMK.app.logout(true); });
    });
  }

  function errorPage(err, retry) {
    var isConfig = err && err.code === 'CONFIG';
    return '<div class="page-head"><div><div class="eyebrow">Terjadi kendala</div><h1>Halaman belum bisa dimuat</h1></div></div>' +
      '<div class="card"><div class="card-body">' + ui.empty(isConfig ? 'settings' : 'alert', isConfig ? 'Konfigurasi API belum lengkap' : 'Gagal memuat data', (err && err.message) || 'Silakan coba lagi.', '<button class="btn btn-primary" id="retryPage">' + ui.icon('refresh', 15) + ' Coba lagi</button>') + '</div></div>';
  }

  function notFoundPage() {
    return '<div class="page-head"><div><div class="eyebrow">404</div><h1>Halaman tidak ditemukan</h1><p class="page-sub">Tautan yang Anda buka tidak tersedia atau sudah berubah.</p></div></div>' +
      '<div class="card"><div class="card-body">' + ui.empty('info', 'Kembali ke dashboard', 'Gunakan menu di samping untuk melanjutkan.', '<a class="btn btn-primary" href="' + homePath(state.user && state.user.role) + '" data-route>Buka dashboard</a>') + '</div></div>';
  }

  function bindRetry(root) {
    var b = root.querySelector('#retryPage');
    if (b) b.addEventListener('click', function () { BMK.app.refresh(); });
  }

  async function renderPublic(route) {
    var pageName = '';
    if (route.path === '/' || route.path === '/beranda') pageName = 'home';
    else if (route.path === '/masuk') pageName = 'login';
    else if (route.path === '/daftar') pageName = 'register';
    var app = document.getElementById('app');
    if (state.user && (pageName === 'login' || pageName === 'register')) {
      var loggedRole = normalizeRole(state.user.role);
      BMK.app.navigate(pageName === 'register' && loggedRole === 'ortu' ? '#/ortu/perpanjang' : homePath(loggedRole), true);
      return;
    }
    if (state.user && route.path === '/') {
      BMK.app.navigate(homePath(state.user.role), true);
      return;
    }
    if (!pageName) {
      app.innerHTML = '<div class="public" style="min-height:100vh;display:grid;place-items:center;padding:24px"><div class="card" style="max-width:560px;width:100%"><div class="card-body">' +
        notFoundPage() + '</div></div></div>';
      document.title = 'Halaman tidak ditemukan — Bimba Mahatari Kecil';
      return;
    }
    var page;
    if (pageName === 'register') page = BMK.pages.register(route.params);
    else page = BMK.pages[pageName]();
    app.innerHTML = page.html;
    if (page.mount) await page.mount(app);
    window.scrollTo(0, 0);
  }

  async function renderProtected(route, keepScroll) {
    var app = document.getElementById('app');
    var role = roleFromParts(route.parts);
    if (!state.user) {
      BMK.app.navigate('#/masuk', true);
      return;
    }
    var userRole = normalizeRole(state.user.role);
    if (role !== userRole) {
      BMK.app.navigate(homePath(userRole), true);
      return;
    }
    var key = route.parts[1] || 'dashboard';
    var navItem = findNav(userRole, key);
    var restoreY = keepScroll ? window.scrollY : 0;
    var seq = ++state.seq;

    var shell = document.createElement('div');
    app.innerHTML = shellHTML(userRole, navItem ? key : '');
    bindShell(app);
    var view = app.querySelector('#view');
    view.innerHTML = '<div class="page-head"><div><div class="eyebrow">' + ui.esc(ui.roleLabel(userRole)) + '</div><h1>' + ui.esc(navItem ? navItem.title : 'Halaman') + '</h1></div></div>' + ui.skeletonRows(5);

    if (!navItem) {
      view.innerHTML = notFoundPage();
      return;
    }
    var mod = BMK.views && BMK.views[userRole];
    var fn = mod && mod[key];
    if (typeof fn !== 'function') {
      view.innerHTML = notFoundPage();
      return;
    }
    var ctx = {
      user: state.user,
      route: route,
      params: route.params,
      key: key,
      role: userRole,
      refresh: function (opts) {
        opts = opts || {};
        return renderRoute({ keepScroll: opts.keepScroll !== false, refresh: true });
      }
    };
    try {
      var page = await fn(ctx);
      if (seq !== state.seq) return;
      if (!page || typeof page.html !== 'string') throw new Error('Halaman tidak mengembalikan konten.');
      view.innerHTML = page.html;
      document.title = (navItem.title || 'Dashboard') + ' — Bimba Mahatari Kecil';
      if (page.mount) await page.mount(view, ctx);
      if (seq !== state.seq) return;
      window.scrollTo(0, keepScroll ? restoreY : 0);
      view.focus({ preventScroll: true });
    } catch (err) {
      if (seq !== state.seq) return;
      if (err && (err.code === 'UNAUTH' || err.code === 'SESSION_EXPIRED')) return;
      view.innerHTML = errorPage(err);
      bindRetry(view);
    }
  }

  async function renderRoute(opts) {
    opts = opts || {};
    var route = parseHash();
    var role = roleFromParts(route.parts);
    try {
      if (!role) await renderPublic(route);
      else await renderProtected(route, opts.keepScroll);
    } catch (err) {
      var app = document.getElementById('app');
      app.innerHTML = errorPage(err);
      bindRetry(app);
    }
  }

  function bootError(err) {
    var app = document.getElementById('app');
    var configHint = err && err.code === 'CONFIG'
      ? '<p class="small text-muted mt-12">Buka <b>frontend/assets/js/config.js</b>, isi <b>API_URL</b> dengan URL deployment Web App Apps Script, lalu muat ulang halaman.</p>'
      : '<p class="small text-muted mt-12">Periksa koneksi internet dan pastikan Web App Apps Script dapat diakses publik.</p>';
    app.innerHTML = '<div class="boot-screen"><div class="card" style="max-width:460px;width:calc(100% - 36px);box-shadow:var(--shadow-lg)">' +
      '<div class="card-body" style="text-align:center;padding:30px 26px">' +
        '<div class="feature-ic" style="margin:0 auto 14px;background:var(--red-soft);color:var(--red)">' + ui.icon('alert', 24) + '</div>' +
        '<h2 style="font-family:var(--display);font-size:24px;font-weight:600;margin-bottom:6px">Tidak dapat terhubung</h2>' +
        '<p class="small text-muted">' + ui.esc((err && err.message) || 'Server belum merespons.') + '</p>' + configHint +
        '<div class="row" style="justify-content:center;margin-top:20px;flex-wrap:wrap">' +
          '<button class="btn btn-primary" id="bootRetry">' + ui.icon('refresh', 15) + ' Coba lagi</button>' +
          '<button class="btn btn-outline" id="bootReset">Masuk ulang</button>' +
        '</div>' +
      '</div></div></div>';
    var retry = document.getElementById('bootRetry');
    if (retry) retry.onclick = function () { location.reload(); };
    var reset = document.getElementById('bootReset');
    if (reset) reset.onclick = function () {
      store.clear();
      state.user = null;
      if (location.hash && location.hash !== '#/' && location.hash !== '#/beranda') location.hash = '#/masuk';
      else location.reload();
    };
  }

  async function init() {
    document.addEventListener('bmk:unauth', function () {
      if (state.unauthHandled) return;
      state.unauthHandled = true;
      state.user = null;
      if (parseHash().parts[0]) {
        ui.toast('Sesi Anda berakhir. Silakan masuk kembali.', 'info', 5000);
        BMK.app.navigate('#/masuk', true);
      }
    });
    window.addEventListener('hashchange', function () {
      if (state.booting) return;
      state.unauthHandled = false;
      renderRoute({});
    });
    var route = parseHash();
    var protectedRoute = !!roleFromParts(route.parts);
    if (store.token()) {
      try {
        var data = await api.me();
        state.user = data.user;
        store.setSession(store.token(), data.user);
      } catch (err) {
        if (err.code === 'NETWORK' || err.code === 'TIMEOUT' || err.code === 'CONFIG' || err.code === 'DEPLOYMENT' || err.code === 'BAD_RESPONSE') {
          state.booting = false;
          bootError(err);
          return;
        }
        store.clear();
        state.user = null;
      }
    }
    state.booting = false;
    if (!state.user) {
      if (protectedRoute) {
        ui.toast('Silakan masuk untuk membuka dashboard.', 'info');
        BMK.app.navigate('#/masuk', true);
      } else {
        await renderRoute({});
      }
      return;
    }
    if (!route.parts.length) {
      BMK.app.navigate(homePath(state.user.role), true);
      return;
    }
    await renderRoute({});
  }

  BMK.app = {
    init: init,
    navigate: function (path, replace) {
      var target = path.charAt(0) === '#' ? path : '#' + path;
      if (location.hash === target) { renderRoute({}); return; }
      if (replace && history.replaceState) {
        history.replaceState(null, '', target);
        renderRoute({});
      } else {
        location.hash = target;
      }
    },
    render: function () { return renderRoute({}); },
    refresh: function (opts) { return renderRoute(Object.assign({ keepScroll: true, refresh: true }, opts || {})); },
    enterApp: function (user) {
      state.user = user;
      state.unauthHandled = false;
      var role = normalizeRole(user.role);
      var target = homePath(role);
      if (location.hash === target) renderRoute({});
      else BMK.app.navigate(target, true);
    },
    logout: async function (ask) {
      if (ask) {
        var yes = await ui.confirm({
          title: 'Keluar dari akun?',
          message: 'Anda perlu masuk kembali untuk membuka dashboard.',
          confirmText: 'Ya, keluar',
          tone: 'danger'
        });
        if (!yes) return;
      }
      try { await api.logout(); } catch (e) { /* sesi lokal tetap dibersihkan */ }
      store.clear();
      state.user = null;
      state.unauthHandled = true;
      ui.toast('Anda telah keluar.', 'info');
      if (location.hash === '#/masuk') renderRoute({});
      else BMK.app.navigate('#/masuk', true);
    },
    currentUser: function () { return state.user; },
    patchUser: function (patch) {
      if (!state.user) return;
      state.user = Object.assign({}, state.user, patch || {});
      store.setSession(store.token(), state.user);
    },
    homePath: homePath
  };

  BMK.app.init();
})();

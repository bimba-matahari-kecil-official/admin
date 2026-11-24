(function () {
  window.BMK = window.BMK || {};
  var C = BMK.const;

  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="8" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="15" width="7" height="6" rx="1.6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    child: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/><path d="M9 8h.01M15 8h.01M9.5 10.5c.8.7 1.6 1 2.5 1s1.7-.3 2.5-1"/>',
    graduation: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    fileCheck: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    map: '<path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    printer: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M8 7h8M8 11h5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
    receipt: '<path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M15 4l5 5M17 6l2 2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    school: '<path d="m3 9 9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7M3 9h18"/>',
    creditCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="2" y="6" width="13" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/>',
    sparkles: '<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/><path d="m5 3 .6 1.4L7 5l-1.4.6L5 7l-.6-1.4L3 5l1.4-.6Z"/>',
    alert: '<path d="M10.3 3.8 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    external: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    filter: '<path d="M4 5h16l-6 7v6l-4 2v-8Z"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 21v-7h6v7"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10 21h4"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="m8.5 13.5-1.5 7 5-3 5 3-1.5-7"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    circleDollar: '<circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v2M12 16v2"/>',
    baby: '<path d="M9 12h.01M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a8 8 0 1 0-14 0"/><path d="M12 2v4"/><path d="M12 22v-4"/>',
    coffee: '<path d="M18 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h15v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    circle: '<circle cx="12" cy="12" r="9"/>'
  };

  function icon(name, size, cls) {
    var p = ICONS[name] || ICONS.circle;
    return '<svg class="ico ' + (cls || '') + '" width="' + (size || 20) + '" height="' + (size || 20) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function attr(value) { return esc(value); }

  function n(value) {
    var x = Number(value);
    return isFinite(x) ? x : 0;
  }

  function rupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n(value));
  }

  function angka(value) { return new Intl.NumberFormat('id-ID').format(n(value)); }

  function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  function isoDate(value) {
    var d = value ? toDate(value) : new Date();
    if (!d) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function tanggal(value, style) {
    var d = toDate(value);
    if (!d) return '—';
    var day = d.getDate();
    var month = style === 'short' ? C.BULAN_SINGKAT[d.getMonth()] : C.BULAN[d.getMonth()];
    var year = d.getFullYear();
    if (style === 'long') return C.HARI[d.getDay()] + ', ' + day + ' ' + month + ' ' + year;
    if (style === 'numeric') return String(day).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + year;
    return day + ' ' + month + ' ' + year;
  }

  function tanggalWaktu(value) {
    var d = toDate(value);
    if (!d) return '—';
    var raw = String(value);
    var time = raw.match(/T(\d{2}):(\d{2})/);
    if (!time) return tanggal(value);
    return tanggal(value, 'short') + ' · ' + time[1] + ':' + time[2];
  }

  function periodeNow() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function periodeLabel(periode) {
    if (!periode) return '—';
    var parts = String(periode).split('-');
    if (parts.length < 2) return periode;
    var idx = Number(parts[1]) - 1;
    return (C.BULAN[idx] || parts[1]) + ' ' + parts[0];
  }

  function periodeOptions(count) {
    var out = [];
    var now = new Date();
    for (var i = 0; i < (count || 14); i++) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      out.push({ value: value, label: C.BULAN[d.getMonth()] + ' ' + d.getFullYear() });
    }
    return out;
  }

  function todayLong() { return tanggal(new Date(), 'long'); }

  function avatar(name, url, size, cls) {
    var s = size || 'md';
    if (url) {
      return '<span class="avatar avatar-' + s + ' ' + (cls || '') + '"><img src="' + esc(url) + '" alt="' + esc(name || '') + '" loading="lazy" /></span>';
    }
    return '<span class="avatar avatar-' + s + ' avatar-logo ' + (cls || '') + '" aria-label="' + esc(name || '') + '"><img src="' + esc(CONFIG.LOGO_URL) + '" alt="Logo Bimba Matahari Kecil" loading="lazy" /></span>';
  }

  function badge(text, tone) {
    return '<span class="badge badge-' + (tone || 'gray') + '">' + esc(text) + '</span>';
  }

  var STATUS = {
    hadir: ['Hadir', 'green'], izin: ['Izin', 'amber'], sakit: ['Sakit', 'blue'], alpha: ['Tanpa Keterangan', 'red'],
    belum: ['Belum Bayar', 'amber'], menunggu_verifikasi: ['Menunggu Verifikasi', 'blue'], sebagian: ['Dibayar Sebagian', 'blue'], lunas: ['Lunas', 'green'], ditolak: ['Ditolak', 'red'],
    diterima: ['Diterima', 'green'],
    draft: ['Draft', 'gray'], menunggu_acc: ['Menunggu ACC', 'amber'], disetujui: ['Disetujui', 'green'],
    aktif: ['Aktif', 'green'], nonaktif: ['Nonaktif', 'gray'], pending: ['Menunggu ACC', 'amber'], selesai: ['Selesai', 'blue'],
    tersedia: ['Tersedia', 'green'], terisi: ['Terisi', 'gray'], dibayar: ['Sudah Dibayar', 'green'],
    ortu: ['Orang Tua', 'blue'], guru: ['Pengajar', 'green'], pengajar: ['Pengajar', 'green'], admin: ['Admin', 'amber'],
    laki: ['Laki-laki', 'blue'], perempuan: ['Perempuan', 'pink']
  };

  function statusBadge(value) {
    var s = STATUS[value] || [value || '—', 'gray'];
    return badge(s[0], s[1]);
  }

  function roleLabel(role) {
    return ({ admin: 'Admin', guru: 'Pengajar', pengajar: 'Pengajar', ortu: 'Orang Tua' })[role] || role || '—';
  }

  function predikat(score) {
    var v = Number(score);
    if (!isFinite(v)) return { label: '—', tone: 'gray', grade: '-' };
    if (v >= 90) return { label: 'Sangat Baik', tone: 'green', grade: 'A' };
    if (v >= 80) return { label: 'Baik', tone: 'teal', grade: 'B' };
    if (v >= 70) return { label: 'Cukup', tone: 'amber', grade: 'C' };
    return { label: 'Perlu Bimbingan', tone: 'red', grade: 'D' };
  }

  function toast(message, type, timeout) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var t = type || 'success';
    var ic = t === 'error' ? 'alert' : (t === 'info' ? 'info' : 'checkCircle');
    var el = document.createElement('div');
    el.className = 'toast toast-' + t;
    el.innerHTML = '<span class="toast-ico">' + icon(ic, 20) + '</span><div class="toast-msg">' + esc(message) + '</div><button class="toast-x" aria-label="Tutup">' + icon('x', 16) + '</button>';
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    var timer = setTimeout(remove, timeout || 4200);
    el.querySelector('.toast-x').onclick = remove;
    function remove() {
      clearTimeout(timer);
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 220);
    }
  }

  function modal(opts) {
    opts = opts || {};
    var root = document.getElementById('modal-root');
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML =
      '<div class="modal modal-' + (opts.size || 'md') + '" role="dialog" aria-modal="true" aria-label="' + attr(opts.title || 'Dialog') + '">' +
        '<div class="modal-head">' +
          '<div><h2>' + esc(opts.title || '') + '</h2>' + (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
          '<button type="button" class="icon-btn modal-x" aria-label="Tutup">' + icon('x', 20) + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    document.body.appendChild(wrap);
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () { wrap.classList.add('show'); });
    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      wrap.classList.remove('show');
      document.body.classList.remove('modal-open');
      setTimeout(function () { wrap.remove(); }, 180);
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.querySelector('.modal-x').onclick = close;
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    var api = { el: wrap, close: close };
    if (opts.onMount) opts.onMount(wrap, close);
    var focusable = wrap.querySelector('input:not([type=hidden]), select, textarea, button');
    if (focusable) setTimeout(function () { focusable.focus(); }, 120);
    return api;
  }

  function confirmDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var done = false;
      var m = modal({
        title: opts.title || 'Konfirmasi',
        size: 'sm',
        body: '<p class="confirm-text">' + esc(opts.message || 'Lanjutkan tindakan ini?') + '</p>',
        footer: '<button type="button" class="btn btn-ghost" data-x="no">' + esc(opts.cancelText || 'Batal') + '</button>' +
                '<button type="button" class="btn ' + (opts.tone === 'danger' ? 'btn-danger' : 'btn-primary') + '" data-x="yes">' + esc(opts.confirmText || 'Ya, lanjutkan') + '</button>',
        onClose: function () { if (!done) resolve(false); },
        onMount: function (el, close) {
          el.querySelector('[data-x="no"]').onclick = close;
          el.querySelector('[data-x="yes"]').onclick = function () { done = true; close(); resolve(true); };
        }
      });
      return m;
    });
  }

  function emptyState(ic, title, text, action) {
    return '<div class="empty-state"><div class="empty-ic">' + icon(ic || 'info', 28) + '</div><h3>' + esc(title || 'Belum ada data') + '</h3>' +
      (text ? '<p>' + esc(text) + '</p>' : '') + (action || '') + '</div>';
  }

  function pageHead(opts) {
    return '<div class="page-head">' +
      '<div><div class="eyebrow">' + esc(opts.eyebrow || '') + '</div><h1>' + esc(opts.title || '') + '</h1>' +
      (opts.subtitle ? '<p class="page-sub">' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
      (opts.actions ? '<div class="page-actions">' + opts.actions + '</div>' : '') +
    '</div>';
  }

  function stat(ic, label, value, opts) {
    opts = opts || {};
    return '<div class="stat-card ' + (opts.tone ? 'stat-' + opts.tone : '') + '">' +
      '<div class="stat-top"><span class="stat-ic">' + icon(ic, 20) + '</span>' +
      (opts.badge || '') + '</div>' +
      '<div class="stat-value">' + (opts.raw ? value : esc(value)) + '</div>' +
      '<div class="stat-label">' + esc(label) + '</div>' +
      (opts.hint ? '<div class="stat-hint">' + esc(opts.hint) + '</div>' : '') +
    '</div>';
  }

  function card(opts) {
    return '<section class="card ' + (opts.cls || '') + '">' +
      (opts.title || opts.actions ? '<div class="card-head"><div><h2>' + esc(opts.title || '') + '</h2>' +
        (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' + (opts.actions || '') + '</div>' : '') +
      '<div class="card-body">' + (opts.body || '') + '</div></section>';
  }

  function tabs(items, active, opts) {
    opts = opts || {};
    return '<div class="tabs" role="tablist">' + items.map(function (t) {
      var isActive = t.value === active;
      return '<button type="button" class="tab ' + (isActive ? 'active' : '') + '" data-tab="' + attr(t.value) + '"' +
        (opts.name ? ' data-tab-group="' + attr(opts.name) + '"' : '') + '>' +
        (t.icon ? icon(t.icon, 16) : '') + '<span>' + esc(t.label) + '</span>' +
        (t.count != null ? '<span class="tab-count">' + esc(t.count) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }

  function spinner(size) {
    return '<span class="spinner" style="width:' + (size || 18) + 'px;height:' + (size || 18) + 'px"></span>';
  }

  function loadingBlock(text) {
    return '<div class="loading-block">' + spinner(22) + '<span>' + esc(text || 'Memuat data…') + '</span></div>';
  }

  function skeletonRows(count) {
    var out = '<div class="skeleton-list">';
    for (var i = 0; i < (count || 4); i++) out += '<div class="skeleton-row"><span class="sk sk-avatar"></span><span class="sk sk-line"></span><span class="sk sk-line short"></span></div>';
    return out + '</div>';
  }

  function loadingBrand(text) {
    return '<div class="loading-brand" role="status" aria-live="polite">' +
      '<img class="boot-logo" src="' + attr(CONFIG.LOGO_URL) + '" alt="Logo Bimba Matahari Kecil" />' +
      '<div class="boot-title">Bimba Matahari Kecil</div>' +
      '<div class="boot-sub">' + esc(text || 'Menyiapkan ruang belajar…') + '</div>' +
      '<div class="boot-bar"><span></span></div>' +
    '</div>';
  }

  function serialize(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || el.type === 'file') return;
      if (el.type === 'checkbox') { data[el.name] = el.checked; return; }
      if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; return; }
      data[el.name] = typeof el.value === 'string' ? el.value.trim() : el.value;
    });
    return data;
  }

  function setFormValues(form, values) {
    Object.keys(values || {}).forEach(function (key) {
      var els = form.elements[key];
      if (!els) return;
      if (els.length && els[0].type === 'radio') {
        Array.prototype.forEach.call(els, function (el) { el.checked = String(el.value) === String(values[key]); });
      } else if (els.type === 'checkbox') {
        els.checked = !!values[key];
      } else {
        els.value = values[key] == null ? '' : values[key];
      }
    });
  }

  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('.field.has-error'), function (f) { f.classList.remove('has-error'); });
    Array.prototype.forEach.call(form.querySelectorAll('.field-error'), function (f) { f.textContent = ''; });
  }

  function fieldError(form, name, message) {
    var input = form.elements[name];
    if (!input) { toast(message, 'error'); return; }
    var el = input.nodeType === 1 ? input : input[0];
    var field = el.closest('.field');
    if (field) {
      field.classList.add('has-error');
      var err = field.querySelector('.field-error');
      if (err) err.textContent = message;
      else {
        err = document.createElement('div');
        err.className = 'field-error';
        err.textContent = message;
        field.appendChild(err);
      }
    }
    if (el.focus) el.focus();
    toast(message, 'error');
  }

  function busy(btn, isBusy, label) {
    if (!btn) return;
    if (isBusy) {
      if (!btn.dataset.original) btn.dataset.original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = spinner(16) + '<span>' + esc(label || 'Memproses…') + '</span>';
    } else {
      btn.disabled = false;
      if (btn.dataset.original) { btn.innerHTML = btn.dataset.original; delete btn.dataset.original; }
    }
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait || 250);
    };
  }

  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result || '')); };
      fr.onerror = function () { reject(new Error('Gagal membaca file.')); };
      fr.readAsDataURL(file);
    });
  }

  function mimeFromName(name, fallback) {
    var ext = String(name || '').split('.').pop().toLowerCase();
    var map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg' };
    return map[ext] || fallback || '';
  }

  function withMime(dataUrl, mime) {
    return String(dataUrl || '').replace(/^data:([^;,]*)?;/, 'data:' + mime + ';');
  }

  function compressImage(file, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('Pilih file gambar (JPG/PNG).')); return; }
      var type = file.type || opts.mime || mimeFromName(file.name);
      if (!/^image\//.test(type)) { reject(new Error('Pilih file gambar (JPG/PNG).')); return; }
      var maxMB = opts.maxMB || CONFIG.MAX_IMAGE_MB || 8;
      if (file.size > maxMB * 1024 * 1024) { reject(new Error('Ukuran foto maksimal ' + maxMB + ' MB.')); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var maxW = opts.maxWidth || 1024;
          var maxH = opts.maxHeight || 1024;
          var ratio = Math.min(1, maxW / img.width, maxH / img.height);
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var out = canvas.toDataURL('image/jpeg', opts.quality || 0.7);
          URL.revokeObjectURL(url);
          resolve(out);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(new Error('Gambar tidak dapat dibuka. Coba foto lain.'));
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Gambar tidak dapat dibuka. Coba foto lain.'));
      };
      img.src = url;
    });
  }

  var uploadCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function validateVideo(file) {
    var maxMB = CONFIG.MAX_VIDEO_MB || 8;
    if (file.size > maxMB * 1024 * 1024) throw new Error('Ukuran video maksimal ' + maxMB + ' MB (±30 detik). Pilih klip yang lebih pendek.');
  }

  async function processFileInput(input) {
    var file = input.files && input.files[0];
    if (!file) return '';
    var data, isImage = input.hasAttribute('data-image'), isVideo = input.hasAttribute('data-video');
    if (isImage) data = await compressImage(file);
    else {
      if (isVideo) validateVideo(file);
      data = await readAsDataURL(file);
      var mime = file.type || mimeFromName(file.name, 'video/mp4');
      if (isVideo || /^video\//.test(mime)) data = withMime(data, mime);
    }
    var info = { dataUrl: data, name: file.name, type: file.type, size: file.size };
    if (uploadCache) uploadCache.set(input, info);
    input.dataset.uploadReady = '1';
    var targetId = input.getAttribute('data-upload-for');
    if (targetId) {
      var main = document.getElementById(targetId);
      if (main) {
        try {
          var dt = new DataTransfer();
          dt.items.add(file);
          main.files = dt.files;
        } catch (e) { /* DataTransfer tidak tersedia */ }
        if (uploadCache) uploadCache.set(main, info);
        main.dataset.uploadReady = '1';
      }
    }
    var preview = input.getAttribute('data-preview');
    if (preview) {
      var target = document.querySelector(preview);
      if (target) {
        if (target.tagName === 'IMG') {
          target.src = data;
          target.hidden = false;
          target.classList.add('is-visible');
        } else {
          target.innerHTML = isImage
            ? '<img src="' + esc(data) + '" alt="Pratinjau" />'
            : '<video src="' + esc(data) + '" controls playsinline></video>';
          target.classList.add('has-media');
        }
      }
    }
    var tile = input.closest('.upload-tile, .upload-box');
    if (tile) tile.classList.add('has-file');
    return data;
  }

  async function getUpload(input) {
    if (!input) return '';
    if (uploadCache && uploadCache.has(input)) return uploadCache.get(input).dataUrl;
    if (input.files && input.files[0]) return await processFileInput(input);
    return '';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-cam-for]');
    if (!btn) return;
    e.preventDefault();
    var cam = document.getElementById(btn.getAttribute('data-cam-for'));
    if (cam) cam.click();
  });

  document.addEventListener('change', async function (e) {
    var input = e.target.closest && e.target.closest('input[type="file"]');
    if (!input || (!input.hasAttribute('data-image') && !input.hasAttribute('data-video'))) return;
    try {
      await processFileInput(input);
    } catch (err) {
      input.value = '';
      if (uploadCache) uploadCache.delete(input);
      toast(err.message || 'File gagal diproses.', 'error');
    }
  });

  function signaturePad(container, opts) {
    opts = opts || {};
    container.classList.add('sigpad');
    container.innerHTML = '<div class="sigpad-head"><span>' + icon('pencil', 15) + ' Tanda tangan di sini</span>' +
      '<button type="button" class="link-btn" data-sig-clear>Hapus</button></div>' +
      '<canvas aria-label="Area tanda tangan"></canvas>';
    var canvas = container.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var dirty = false, drawing = false, last = null, dpr = 1;

    function resize() {
      var snapshot = dirty ? canvas.toDataURL() : null;
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#16211f';
      if (snapshot) {
        var img = new Image();
        img.onload = function () {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        };
        img.src = snapshot;
      }
    }

    function point(e) {
      var r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function down(e) {
      e.preventDefault();
      drawing = true;
      dirty = true;
      last = point(e);
      ctx.beginPath();
      ctx.arc(last.x, last.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#16211f';
      ctx.fill();
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = point(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }
    function up() { drawing = false; last = null; }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    canvas.addEventListener('pointercancel', up);
    container.querySelector('[data-sig-clear]').addEventListener('click', function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dirty = false;
    });
    var resizeTimer;
    window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); });
    requestAnimationFrame(resize);

    return {
      clear: function () { ctx.clearRect(0, 0, canvas.width, canvas.height); dirty = false; },
      isEmpty: function () { return !dirty; },
      toDataURL: function () { return dirty ? canvas.toDataURL('image/png') : ''; }
    };
  }

  function loadScript(src, id) {
    return new Promise(function (resolve, reject) {
      if (id && document.getElementById(id)) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      if (id) s.id = id;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Gagal memuat pustaka. Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
  }

  function loadStyle(href, id) {
    if (id && document.getElementById(id)) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    if (id) l.id = id;
    document.head.appendChild(l);
  }

  function geolocate() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) { reject(new Error('Perangkat ini tidak mendukung lokasi GPS.')); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy || 0) });
      }, function (err) {
        var msg = 'Lokasi tidak dapat diambil.';
        if (err && err.code === 1) msg = 'Izin lokasi ditolak. Aktifkan izin lokasi pada browser, lalu coba lagi.';
        if (err && err.code === 2) msg = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
        if (err && err.code === 3) msg = 'Pengambilan lokasi habis waktu. Coba lagi di area terbuka.';
        reject(new Error(msg));
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    });
  }

  var chartPromise = null;
  function loadChart() {
    if (window.Chart) return Promise.resolve();
    if (chartPromise) return chartPromise;
    chartPromise = loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'chartjs');
    return chartPromise;
  }

  async function chart(canvas, config) {
    if (!canvas) return null;
    try {
      await loadChart();
      return new Chart(canvas, config);
    } catch (err) {
      var wrap = canvas.parentElement;
      if (wrap) wrap.innerHTML = '<div class="chart-fallback">' + icon('chart', 22) + '<span>Grafik tidak dapat dimuat.</span></div>';
      return null;
    }
  }

  function printHTML(html) {
    var root = document.getElementById('print-root');
    root.innerHTML = '<div class="print-doc">' + html + '</div>';
    document.body.classList.add('printing');
    var cleanup = function () {
      document.body.classList.remove('printing');
      root.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(function () { window.print(); }, 350);
    setTimeout(cleanup, 120000);
  }

  function waLink(phone, message) {
    var p = String(phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    if (p.indexOf('0') === 0) p = '62' + p.slice(1);
    return 'https://wa.me/' + p + (message ? '?text=' + encodeURIComponent(message) : '');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Teks disalin.', 'success');
    } catch (e) {
      toast('Gagal menyalin. Salin manual ya.', 'error');
    }
  }

  function nl2br(text) { return esc(text).replace(/\n/g, '<br>'); }

  function progress(percent, tone) {
    var p = Math.max(0, Math.min(100, Number(percent) || 0));
    return '<div class="progress ' + (tone ? 'progress-' + tone : '') + '"><span style="width:' + p + '%"></span></div>';
  }

  window.BMK.ui = {
    icon: icon, esc: esc, attr: attr, rupiah: rupiah, angka: angka,
    tanggal: tanggal, tanggalWaktu: tanggalWaktu, isoDate: isoDate, toDate: toDate,
    periodeNow: periodeNow, periodeLabel: periodeLabel, periodeOptions: periodeOptions, todayLong: todayLong,
    avatar: avatar, badge: badge, statusBadge: statusBadge, roleLabel: roleLabel, predikat: predikat,
    toast: toast, modal: modal, confirm: confirmDialog, empty: emptyState, pageHead: pageHead, stat: stat, card: card,
    tabs: tabs, spinner: spinner, loadingBlock: loadingBlock, skeletonRows: skeletonRows, loadingBrand: loadingBrand,
    serialize: serialize, setFormValues: setFormValues, clearErrors: clearErrors, fieldError: fieldError, busy: busy,
    debounce: debounce, readAsDataURL: readAsDataURL, compressImage: compressImage, getUpload: getUpload,
    signaturePad: signaturePad, geolocate: geolocate,
    chart: chart, printHTML: printHTML, waLink: waLink, copy: copyText, nl2br: nl2br, progress: progress,
    loadScript: loadScript, loadStyle: loadStyle
  };
})();

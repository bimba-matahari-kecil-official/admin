(function () {
  var TOKEN_KEY = 'bmk.token';
  var USER_KEY = 'bmk.user';
  var CHILD_KEY = 'bmk.activeChild';

  function ApiError(message, code, details) {
    this.name = 'ApiError';
    this.message = message || 'Terjadi kesalahan.';
    this.code = code || 'ERROR';
    this.details = details || null;
  }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.constructor = ApiError;

  var store = {
    token: function () {
      try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
    },
    user: function () {
      try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
    },
    setSession: function (token, user) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    updateUser: function (patch) {
      var user = store.user() || {};
      var next = Object.assign({}, user, patch || {});
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    },
    clear: function () {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(CHILD_KEY);
    },
    activeChild: function () {
      try { return localStorage.getItem(CHILD_KEY) || ''; } catch (e) { return ''; }
    },
    setActiveChild: function (id) {
      if (id) localStorage.setItem(CHILD_KEY, id);
      else localStorage.removeItem(CHILD_KEY);
    }
  };

  function friendlyFetchError(err) {
    if (err && err.name === 'AbortError') {
      return new ApiError('Koneksi ke server terlalu lama. Periksa internet lalu coba lagi.', 'TIMEOUT');
    }
    return new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet dan URL API pada config.js.', 'NETWORK');
  }

  async function post(action, data, options) {
    options = options || {};
    if (!CONFIG.RESOLVED_API) {
      throw new ApiError('Alamat API belum diatur. Buka assets/js/config.js dan isi API_URL dengan URL Web App Apps Script.', 'CONFIG');
    }
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, options.timeout || 60000) : null;
    var res, text;
    try {
      res = await fetch(CONFIG.RESOLVED_API, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, token: store.token(), data: data || {} }),
        signal: controller ? controller.signal : undefined
      });
      text = await res.text();
    } catch (err) {
      throw friendlyFetchError(err);
    } finally {
      if (timer) clearTimeout(timer);
    }

    var json = null;
    try { json = JSON.parse(text); } catch (e) { /* respons bukan JSON */ }
    if (!json) {
      if (/accounts\.google\.com|ServiceLogin/i.test(text)) {
        throw new ApiError('Akses Web App Apps Script belum dibuka untuk umum. Deploy ulang dengan akses "Siapa saja".', 'DEPLOYMENT');
      }
      throw new ApiError('Respons server tidak dikenali. Pastikan URL Web App Apps Script sudah benar dan sudah di-deploy ulang.', 'BAD_RESPONSE');
    }
    if (json.ok === false) {
      if (json.code === 'UNAUTH' || json.code === 'SESSION_EXPIRED') {
        store.clear();
        try { document.dispatchEvent(new CustomEvent('bmk:unauth')); } catch (e) { /* abaikan */ }
      }
      throw new ApiError(json.error || 'Permintaan gagal.', json.code, json.details);
    }
    if (!res.ok) throw new ApiError('Server menolak permintaan (' + res.status + ').', 'HTTP_' + res.status);
    return json.data;
  }

  window.BMK = window.BMK || {};
  BMK.ApiError = ApiError;
  BMK.store = store;
  BMK.api = {
    call: post,
    login: function (identity, password) {
      return post('auth.login', { identity: identity, password: password });
    },
    me: function () { return post('auth.me', {}, { timeout: 20000 }); },
    logout: function () { return post('auth.logout', {}).catch(function () {}); },
    changePassword: function (oldPassword, newPassword) {
      return post('auth.changePassword', { oldPassword: oldPassword, newPassword: newPassword });
    },
    publicHome: function () { return post('public.bootstrap', {}, { timeout: 20000 }); },
    publicSlots: function (paketId) { return post('public.slots', { paketId: paketId }); },
    register: function (payload) {
      return post('auth.register', payload, { timeout: 90000 });
    }
  };
})();

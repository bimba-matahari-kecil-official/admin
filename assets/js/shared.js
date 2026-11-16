(function () {
  window.BMK = window.BMK || {};
  var ui = BMK.ui;

  function options(items, selected, placeholder) {
    var out = placeholder ? '<option value="">' + ui.esc(placeholder) + '</option>' : '';
    (items || []).forEach(function (it) {
      var value = it.value !== undefined ? it.value : it.id;
      var label = it.label !== undefined ? it.label : it.nama;
      out += '<option value="' + ui.attr(value) + '"' + (String(selected) === String(value) ? ' selected' : '') + '>' + ui.esc(label) + '</option>';
    });
    return out;
  }

  function periodSelect(name, selected, count) {
    var list = ui.periodeOptions(count || 18).map(function (p) { return { value: p.value, label: p.label }; });
    var has = list.some(function (p) { return p.value === selected; });
    if (selected && !has) list.unshift({ value: selected, label: ui.periodeLabel(selected) });
    return '<select class="select" name="' + ui.attr(name) + '">' + options(list, selected) + '</select>';
  }

  function uploadTile(id, o) {
    o = o || {};
    var kind = o.video ? 'video' : 'image';
    var accept = o.video ? 'video/*' : 'image/*';
    var attrs = o.video ? 'data-video' : 'data-image';
    var existing = o.existing || '';
    var hasMedia = !!existing;
    return '<label class="upload-tile ' + (o.wide ? 'wide ' : '') + (hasMedia ? 'has-file' : '') + '" id="' + ui.attr(id) + 'Tile">' +
      '<input type="file" id="' + ui.attr(id) + '" accept="' + accept + '" ' + attrs + ' data-preview="#' + ui.attr(id) + 'Preview" />' +
      '<div class="upload-preview ' + (hasMedia ? 'has-media' : '') + '" id="' + ui.attr(id) + 'Preview">' +
        (hasMedia ? (o.video ? '<video src="' + ui.attr(existing) + '" controls playsinline></video>' : '<img src="' + ui.attr(existing) + '" alt="Pratinjau" />') : '') +
      '</div>' +
      '<span class="ut-ic">' + ui.icon(o.video ? 'video' : (o.icon || 'camera'), 19) + '</span>' +
      '<span class="ut-title">' + ui.esc(o.title || (o.video ? 'Unggah video' : 'Unggah foto')) + '</span>' +
      '<span class="ut-hint">' + ui.esc(o.hint || (o.video ? 'MP4/WebM, maks 20 MB' : 'JPG/PNG, otomatis dikompres')) + '</span>' +
      '<span class="ut-replace">Ketuk untuk ganti</span>' +
    '</label>';
  }

  async function uploadValue(id, existing) {
    var input = document.getElementById(id);
    if (!input) return existing || '';
    var data = await ui.getUpload(input);
    return data || existing || '';
  }

  function signaturePanel(padId, existingUrl, title) {
    return '<div class="field"><label>' + ui.esc(title || 'Paraf digital') + '</label>' +
      (existingUrl
        ? '<div class="sig-preview"><img src="' + ui.attr(existingUrl) + '" alt="Tanda tangan tersimpan" /></div><div class="hint">Tanda tangan tersimpan akan dipakai bila area baru dikosongkan.</div>'
        : '<div class="hint">Tanda tangan langsung pada area di bawah.</div>') +
      '<div id="' + ui.attr(padId) + '" style="margin-top:7px"></div></div>';
  }

  function photo(url, name, size) {
    return ui.avatar(name, url, size || 'sm', 'sun');
  }

  function status(value) { return ui.statusBadge(value); }

  function mediaGrid(urls, type) {
    var list = (urls || []).filter(Boolean);
    if (!list.length) return '';
    return '<div class="media-grid mt-12">' + list.map(function (u, i) {
      var isVideo = type === 'video' || /\.(mp4|webm|mov|ogv)(\?|$)/i.test(u) || u.indexOf('export=download') !== -1;
      return '<div class="media-item"><a href="' + ui.attr(u) + '" target="_blank" rel="noopener" data-media="' + (isVideo ? 'video' : 'image') + '" data-url="' + ui.attr(u) + '">' +
        (isVideo
          ? '<video src="' + ui.attr(u) + '" muted playsinline preload="metadata"></video><span class="media-tag">' + ui.icon('play', 10) + ' Video</span>'
          : '<img src="' + ui.attr(u) + '" alt="Dokumentasi belajar ' + (i + 1) + '" loading="lazy" /><span class="media-tag">' + ui.icon('image', 10) + ' Foto</span>') +
      '</a></div>';
    }).join('') + '</div>';
  }

  function openMedia(url, type) {
    if (!url) return;
    var isVideo = type === 'video' || /\.(mp4|webm|mov|ogv)(\?|$)/i.test(url) || url.indexOf('export=download') !== -1;
    ui.modal({
      title: isVideo ? 'Video kegiatan belajar' : 'Foto kegiatan belajar',
      size: 'lg',
      body: '<div style="background:#0f1614;border-radius:12px;overflow:hidden;display:grid;place-items:center;min-height:240px">' +
        (isVideo
          ? '<video src="' + ui.attr(url) + '" controls playsinline style="width:100%;max-height:70vh"></video>'
          : '<img src="' + ui.attr(url) + '" alt="Dokumentasi" style="width:100%;max-height:70vh;object-fit:contain" />') +
        '</div><div class="mt-12"><a class="btn btn-outline btn-sm" href="' + ui.attr(url) + '" target="_blank" rel="noopener">' + ui.icon('external', 14) + ' Buka di tab baru</a></div>'
    });
  }

  function photoModal(url, meta) {
    if (!url) { ui.toast('Foto tidak tersedia.', 'info'); return; }
    ui.modal({
      title: 'Foto absensi',
      size: 'lg',
      body: '<div style="border-radius:12px;overflow:hidden;background:#0f1614"><img src="' + ui.attr(url) + '" alt="Foto absensi" style="width:100%;max-height:68vh;object-fit:contain" /></div>' +
        (meta ? '<div class="info-list mt-16">' + meta.map(function (m) {
          return '<div class="info-item"><div class="ii-label">' + ui.esc(m[0]) + '</div><div class="ii-value">' + ui.esc(m[1] || '—') + '</div></div>';
        }).join('') + '</div>' : '')
    });
  }

  function bindMedia(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[data-media]'), function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openMedia(a.getAttribute('data-url'), a.getAttribute('data-media'));
      });
    });
  }

  function reportCard(r, o) {
    o = o || {};
    var photos = mediaGrid((r.fotoUrls || []).slice(0, 4), 'image');
    var videos = mediaGrid((r.videoUrls || []).slice(0, 2), 'video');
    return '<article class="report-card">' +
      '<div class="report-card-head"><div class="person-cell">' +
        photo(r.anakFoto, r.anakNama, 'sm') +
        '<div class="pc-info"><b>' + ui.esc(r.anakNama || 'Siswa') + '</b><span>' + ui.esc(r.paketNama || '') + (r.jadwalTeks ? ' · ' + ui.esc(r.jadwalTeks) : '') + '</span></div>' +
      '</div><span class="badge badge-teal">' + ui.icon('calendar', 11) + ' ' + ui.esc(ui.tanggal(r.tanggal, 'short')) + '</span></div>' +
      '<div class="report-card-body">' +
        '<div class="report-meta"><span>' + ui.icon('user', 11) + ' ' + ui.esc(r.pengajarNama || '—') + '</span>' +
          (o.showChild && r.ortuNama ? '<span>' + ui.icon('users', 11) + ' ' + ui.esc(r.ortuNama) + '</span>' : '') + '</div>' +
        '<div class="report-text"><b>Materi:</b> ' + ui.esc(r.materi || '—') + '</div>' +
        '<div class="report-text mt-8"><b>Capaian:</b> ' + ui.esc(r.capaian || '—') + '</div>' +
        (r.catatan ? '<div class="report-text mt-8 text-muted"><b>Catatan:</b> ' + ui.esc(r.catatan) + '</div>' : '') +
        photos + videos +
      '</div>' +
      '<div class="report-footer"><span>' + ui.icon('clock', 11) + ' ' + ui.esc(ui.tanggalWaktu(r.createdAt)) + '</span>' +
        (r.parafUrl ? '<img class="paraf-img" src="' + ui.attr(r.parafUrl) + '" alt="Paraf pengajar" title="Paraf pengajar" />' : '<span>Paraf pengajar</span>') +
      '</div>' +
    '</article>';
  }

  function lpmbScoreRows(nilai) {
    var A = BMK.const.ASPECTS;
    return A.map(function (a) {
      var v = nilai && nilai[a.key] != null ? Number(nilai[a.key]) : null;
      var p = ui.predikat(v);
      return '<tr><td><b>' + ui.esc(a.label) + '</b><span class="cell-sub">' + ui.esc(a.hint || '') + '</span></td>' +
        '<td class="num">' + (v == null ? '—' : v) + '</td>' +
        '<td>' + (v == null ? '—' : ui.badge(p.label + ' · ' + p.grade, p.tone)) + '</td></tr>';
    }).join('');
  }

  function emptyRow(cols, text) {
    return '<tr class="empty-row"><td colspan="' + cols + '">' + ui.esc(text || 'Belum ada data.') + '</td></tr>';
  }

  function infoItem(label, value, raw) {
    return '<div class="info-item"><div class="ii-label">' + ui.esc(label) + '</div><div class="ii-value">' + (raw ? value : ui.esc(value || '—')) + '</div></div>';
  }

  function waButton(phone, message, label, cls) {
    if (!phone) return '';
    return '<a class="btn ' + (cls || 'btn-outline btn-sm') + '" href="' + ui.attr(ui.waLink(phone, message)) + '" target="_blank" rel="noopener">' + ui.icon('message', 14) + ' ' + ui.esc(label || 'WA') + '</a>';
  }

  function parseNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  window.BMK.shared = {
    options: options,
    periodSelect: periodSelect,
    uploadTile: uploadTile,
    uploadValue: uploadValue,
    signaturePanel: signaturePanel,
    photo: photo,
    status: status,
    mediaGrid: mediaGrid,
    openMedia: openMedia,
    photoModal: photoModal,
    bindMedia: bindMedia,
    reportCard: reportCard,
    lpmbScoreRows: lpmbScoreRows,
    emptyRow: emptyRow,
    infoItem: infoItem,
    waButton: waButton,
    parseNum: parseNum
  };
})();

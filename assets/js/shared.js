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

  function time24Options(selected) {
    var list = [];
    for (var m = 0; m < 24 * 60; m += 15) {
      list.push(('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2));
    }
    var val = String(selected || '');
    if (val && list.indexOf(val) === -1) { list.push(val); list.sort(); }
    return list.map(function (t) {
      return '<option value="' + ui.attr(t) + '"' + (t === val ? ' selected' : '') + '>' + ui.esc(t) + '</option>';
    }).join('');
  }

  function driveFileId(u) {
    u = String(u || '');
    var m = u.match(/drive\.google\.com\/file\/d\/([-\w]{10,})/) || u.match(/[?&]id=([-\w]{10,})/);
    return m ? m[1] : '';
  }

  function driveViewUrl(id) {
    return 'https://drive.google.com/file/d/' + id + '/preview';
  }

  function uploadTile(id, o) {
    o = o || {};
    var kind = o.video ? 'video' : 'image';
    var accept = o.video ? 'video/*,.mp4,.m4v,.webm,.mov,.ogv' : 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif,.avif';
    var attrs = o.video ? 'data-video' : 'data-image';
    var canCamera = !o.video && o.camera !== false;
    var existing = o.existing || '';
    var hasMedia = !!existing;
    var preview = '';
    if (hasMedia) {
      if (o.video) {
        var dId = driveFileId(existing);
        preview = dId
          ? '<img src="https://drive.google.com/thumbnail?id=' + ui.attr(dId) + '&sz=w400" alt="Pratinjau video" /><span class="ut-play">' + ui.icon('play', 16) + '</span>'
          : '<video src="' + ui.attr(existing) + '" controls playsinline></video>';
      } else {
        preview = '<img src="' + ui.attr(existing) + '" alt="Pratinjau" />';
      }
    }
    var camInput = canCamera
      ? '<input type="file" class="ut-cam-input" id="' + ui.attr(id) + 'Camera" accept="image/*" capture="environment" data-image data-preview="#' + ui.attr(id) + 'Preview" data-upload-for="' + ui.attr(id) + '" />'
      : '';
    var camBtn = canCamera
      ? '<button type="button" class="ut-cam-btn" data-cam-for="' + ui.attr(id) + 'Camera" title="Ambil dari kamera" aria-label="Ambil dari kamera">' + ui.icon('camera', 14) + '<span class="ut-cam-label">Ambil foto</span></button>'
      : '';
    return '<label class="upload-tile ' + (o.wide ? 'wide ' : '') + (hasMedia ? 'has-file' : '') + '" id="' + ui.attr(id) + 'Tile">' +
      '<input type="file" id="' + ui.attr(id) + '" accept="' + accept + '" ' + attrs + ' data-preview="#' + ui.attr(id) + 'Preview" />' +
      camInput +
      '<div class="upload-preview ' + (hasMedia ? 'has-media' : '') + '" id="' + ui.attr(id) + 'Preview">' + preview + '</div>' +
      '<span class="ut-ic">' + ui.icon(o.video ? 'video' : (o.icon || 'camera'), 19) + '</span>' +
      '<span class="ut-title">' + ui.esc(o.title || (o.video ? 'Unggah video' : 'Unggah foto')) + '</span>' +
      '<span class="ut-hint">' + ui.esc(o.hint || (o.video ? 'MP4/MOV/WebM, maks 20 MB — bisa diputar langsung' : 'JPG/PNG/WebP/HEIC, otomatis dikompres')) + '</span>' +
      '<span class="ut-replace">Ketuk untuk ganti</span>' +
      camBtn +
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
      var driveId = type === 'video' ? driveFileId(u) : '';
      var isVideo = !!driveId || type === 'video' || /\.(mp4|webm|mov|ogv|m4v)(\?|$)/i.test(u) || u.indexOf('export=download') !== -1;
      var inner;
      if (driveId) {
        inner = '<img src="https://drive.google.com/thumbnail?id=' + ui.attr(driveId) + '&sz=w400" alt="Video kegiatan ' + (i + 1) + '" loading="lazy" /><span class="media-tag">' + ui.icon('play', 10) + ' Video — ketuk untuk memutar</span>';
      } else if (isVideo) {
        inner = '<video src="' + ui.attr(u) + '" muted playsinline preload="metadata"></video><span class="media-tag">' + ui.icon('play', 10) + ' Video</span>';
      } else {
        inner = '<img src="' + ui.attr(u) + '" alt="Dokumentasi belajar ' + (i + 1) + '" loading="lazy" /><span class="media-tag">' + ui.icon('image', 10) + ' Foto</span>';
      }
      return '<div class="media-item"><a href="' + ui.attr(driveId ? driveViewUrl(driveId) : u) + '" target="_blank" rel="noopener" data-media="' + (isVideo ? 'video' : 'image') + '" data-url="' + ui.attr(u) + '">' + inner + '</a></div>';
    }).join('') + '</div>';
  }

  function openMedia(url, type) {
    if (!url) return;
    var driveId = type === 'video' ? driveFileId(url) : '';
    var isVideo = driveId || type === 'video' || /\.(mp4|webm|mov|ogv|m4v)(\?|$)/i.test(url) || url.indexOf('export=download') !== -1;
    var linkUrl = driveId ? driveViewUrl(driveId) : url;
    var streamUrl = driveId ? 'https://drive.google.com/uc?id=' + driveId : url;
    ui.modal({
      title: isVideo ? 'Video kegiatan belajar' : 'Foto kegiatan belajar',
      size: 'lg',
      body: '<div style="background:#0f1614;border-radius:12px;overflow:hidden;display:grid;place-items:center;min-height:240px">' +
        (driveId
          ? '<video src="' + ui.attr(streamUrl) + '" controls playsinline style="width:100%;max-height:70vh;background:#000"></video>'
          : isVideo
            ? '<video src="' + ui.attr(url) + '" controls playsinline style="width:100%;max-height:70vh"></video>'
            : '<img src="' + ui.attr(url) + '" alt="Dokumentasi" style="width:100%;max-height:70vh;object-fit:contain" />') +
        '</div><div class="mt-12"><a class="btn btn-outline btn-sm" href="' + ui.attr(linkUrl) + '" target="_blank" rel="noopener">' + ui.icon('external', 14) + ' Buka di tab baru</a></div>',
      onMount: driveId ? function (el) {
        var v = el.querySelector('video');
        if (!v) return;
        v.addEventListener('error', function () {
          if (!v.isConnected) return;
          var f = document.createElement('iframe');
          f.src = driveViewUrl(driveId);
          f.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
          f.style.cssText = 'width:100%;aspect-ratio:16/9;max-height:70vh;border:0;background:#000';
          v.replaceWith(f);
        });
      } : undefined
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
        (o.action ? '<span class="report-actions">' + o.action + '</span>' : '') +
        (r.parafUrl ? '<img class="paraf-img" src="' + ui.attr(r.parafUrl) + '" alt="Paraf pengajar" title="Paraf pengajar" />' : '<span>Paraf pengajar</span>') +
      '</div>' +
    '</article>';
  }

  function extraAspects(nilai) {
    var x = nilai && nilai.__extra;
    return Array.isArray(x) ? x : [];
  }

  function lpmbScoreRows(nilai) {
    var A = BMK.const.ASPECTS;
    var fixed = A.map(function (a) {
      var v = nilai && nilai[a.key] != null ? Number(nilai[a.key]) : null;
      var p = ui.predikat(v);
      return '<tr><td><b>' + ui.esc(a.label) + '</b><span class="cell-sub">' + ui.esc(a.hint || '') + '</span></td>' +
        '<td class="num">' + (v == null ? '—' : v) + '</td>' +
        '<td>' + (v == null ? '—' : ui.badge(p.label + ' · ' + p.grade, p.tone)) + '</td></tr>';
    }).join('');
    return fixed + extraAspects(nilai).map(function (a) {
      var v = Number(a.nilai);
      var p = ui.predikat(v);
      return '<tr><td><b>' + ui.esc(a.label) + '</b><span class="cell-sub">Aspek tambahan</span></td>' +
        '<td class="num">' + v + '</td>' +
        '<td>' + ui.badge(p.label + ' · ' + p.grade, p.tone) + '</td></tr>';
    }).join('');
  }

  function statusAbsen(value) {
    var s = (BMK.const.STATUS_ABSEN || []).filter(function (x) { return x.value === value; })[0];
    return s ? s.label : (value || '—');
  }

  function avgScore(nilai) {
    var keys = BMK.const.ASPECTS.map(function (a) { return a.key; });
    var vals = keys.map(function (k) { return Number(nilai && nilai[k]); }).filter(function (v) { return isFinite(v) && v > 0; });
    extraAspects(nilai).forEach(function (a) { var v = Number(a.nilai); if (isFinite(v) && v > 0) vals.push(v); });
    if (!vals.length) return 0;
    return Math.round(vals.reduce(function (s, v) { return s + v; }, 0) / vals.length);
  }

  function raporHTML(r, reports, att, bimbel) {
    var C = BMK.const;
    reports = reports || [];
    att = att || [];
    var avg = avgScore(r.nilai);
    var p = ui.predikat(avg);
    var attByDate = {};
    (att || []).forEach(function (a) { (attByDate[a.tanggal] = attByDate[a.tanggal] || []).push(a); });
    function sessionTimeOf(x) {
      var t = String((x && x.jadwalTeks) || '');
      var i = t.indexOf(',');
      return i >= 0 ? t.slice(i + 1).trim() : '';
    }
    Object.keys(attByDate).forEach(function (k) {
      attByDate[k].sort(function (a, b) {
        return sessionTimeOf(a).localeCompare(sessionTimeOf(b)) || String(a.jam || '').localeCompare(String(b.jam || ''));
      });
    });
    function attForReport(d, firstOnDate) {
      var list = attByDate[d.tanggal] || [];
      if (!list.length) return null;
      var sid = String(d.slotId || '');
      if (!sid) return list[0];
      var exact = list.filter(function (a) { return String(a.slotId || '') === sid; })[0];
      if (exact) return exact;
      var legacy = list.filter(function (a) { return !a.slotId; })[0];
      return legacy && firstOnDate ? legacy : null;
    }
    var orderedReports = reports.slice().sort(function (a, b) {
      var t = String(b.tanggal).localeCompare(String(a.tanggal));
      return t || sessionTimeOf(a).localeCompare(sessionTimeOf(b));
    });
    var hadir = att.filter(function (a) { return a.status === 'hadir'; }).length;
    var b = bimbel || {};
    var logoSrc = b.logoUrl ? '<img src="' + ui.attr(b.logoUrl) + '" alt="Logo" />' : '<img src="' + CONFIG.LOGO_URL + '" alt="Logo Bimbel" />';
    var rowsHtml = C.ASPECTS.map(function (a) {
      var v = r.nilai && r.nilai[a.key] != null ? Number(r.nilai[a.key]) : 0;
      var pr = ui.predikat(v);
      return '<tr><td><b>' + ui.esc(a.label) + '</b><br><span style="color:#777;font-size:7.4pt">' + ui.esc(a.hint || '') + '</span></td>' +
        '<td class="num">' + v + '</td><td>' + ui.esc(pr.label) + ' (' + pr.grade + ')</td></tr>';
    }).join('');
    rowsHtml += extraAspects(r.nilai).map(function (a) {
      var v = Number(a.nilai);
      var pr = ui.predikat(v);
      return '<tr><td><b>' + ui.esc(a.label) + '</b><br><span style="color:#777;font-size:7.4pt">Aspek tambahan</span></td>' +
        '<td class="num">' + v + '</td><td>' + ui.esc(pr.label) + ' (' + pr.grade + ')</td></tr>';
    }).join('');
    var rekapSeen = {};
    var rekap = orderedReports.length ? orderedReports.map(function (d, i) {
      var firstOnDate = !rekapSeen[d.tanggal];
      rekapSeen[d.tanggal] = true;
      var a = attForReport(d, firstOnDate);
      return '<tr><td class="center">' + (i + 1) + '</td><td>' + ui.esc(ui.tanggal(d.tanggal, 'short')) + '</td>' +
        '<td class="center">' + ui.esc(sessionTimeOf(d) || '—') + '</td>' +
        '<td>' + ui.esc(d.materi || '—') + '</td><td>' + ui.esc(d.capaian || '—') + '</td><td class="center">' + (a ? statusAbsen(a.status) : '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="6" class="center" style="color:#888">Belum ada laporan harian pada periode ini.</td></tr>';
    var photos = orderedReports.reduce(function (all, d) { return all.concat(d.fotoUrls || []); }, []).slice(0, 8);
    var photoHtml = photos.length ? '<div class="rapor-section"><h3>Dokumentasi kegiatan</h3><div class="rapor-photos">' +
      photos.map(function (u) { return '<div class="rp-item"><img src="' + ui.attr(u) + '" alt="Dokumentasi" /></div>'; }).join('') + '</div></div>' : '';
    var contact = [b.alamat, b.phone, b.email].filter(Boolean).join(' · ');
    return '<div class="rapor">' +
      '<div class="rapor-head"><div class="rapor-logo">' + logoSrc + '</div><div class="rapor-brand"><h1>' + ui.esc(b.nama || 'Bimbel Matahari Kecil') + '</h1>' +
        '<p>' + ui.esc(b.tagline || 'Learning and playing') + '</p><p class="rapor-contact">' + ui.esc(contact) + '</p></div></div>' +
      '<div class="rapor-title"><h2>Laporan Perkembangan Belajar</h2><span>Periode ' + ui.esc(ui.periodeLabel(r.periode)) + (b.tahunAjaran ? ' · Tahun Ajaran ' + ui.esc(b.tahunAjaran) : '') + '</span></div>' +
      '<div class="rapor-ident"><table><tr><td>Nama Anak</td><td>:</td><td><b>' + ui.esc(r.anakNama) + '</b></td></tr>' +
        '<tr><td>Kelas / Sekolah</td><td>:</td><td>' + ui.esc([r.kelas, r.sekolah].filter(Boolean).join(' / ') || '—') + '</td></tr>' +
        '<tr><td>Orang Tua</td><td>:</td><td>' + ui.esc(r.ortuNama || '—') + '</td></tr>' +
        '<tr><td>Pengajar</td><td>:</td><td>' + ui.esc(r.pengajarNama || '—') + '</td></tr>' +
        '<tr><td>Tanggal Rapor</td><td>:</td><td>' + ui.esc(ui.tanggal(r.tanggal, 'long')) + '</td></tr></table>' +
        '<div class="rapor-photo">' + (r.anakFoto ? '<img src="' + ui.attr(r.anakFoto) + '" alt="Foto anak" />' : 'Foto anak') + '</div></div>' +
      '<div class="rapor-summary"><div><span>Rata-rata</span><b>' + avg + '</b></div><div><span>Predikat</span><b>' + p.grade + '</b></div>' +
        '<div><span>Sesi Hadir</span><b>' + hadir + '</b></div><div><span>Laporan Harian</span><b>' + reports.length + '</b></div></div>' +
      '<div class="rapor-section"><h3>Nilai Aspek Perkembangan</h3><table class="rapor-table"><thead><tr><th>Aspek</th><th style="width:45px" class="center">Nilai</th><th style="width:120px">Predikat</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' +
      '<div class="rapor-section"><h3>Rekap Pembelajaran Harian</h3><table class="rapor-table"><thead><tr><th style="width:26px" class="center">No</th><th style="width:66px">Tanggal</th><th style="width:64px" class="center">Sesi</th><th>Materi</th><th>Capaian</th><th style="width:64px" class="center">Absensi</th></tr></thead><tbody>' + rekap + '</tbody></table></div>' +
      '<div class="rapor-section"><h3>Catatan Perkembangan</h3><div class="rapor-notes">' + ui.esc(r.catatan || '—') + '</div></div>' +
      (r.rekomendasi ? '<div class="rapor-section"><h3>Rekomendasi</h3><div class="rapor-notes">' + ui.esc(r.rekomendasi) + '</div></div>' : '') +
      '<div class="rapor-section"><h3>Ringkasan Kehadiran</h3><div class="rapor-att"><span>Hadir: ' + hadir + '</span><span>Izin: ' + att.filter(function (a) { return a.status === 'izin'; }).length + '</span>' +
        '<span>Sakit: ' + att.filter(function (a) { return a.status === 'sakit'; }).length + '</span><span>Alpha: ' + att.filter(function (a) { return a.status === 'alpha'; }).length + '</span></div></div>' +
      photoHtml +
      '<div class="rapor-sign"><div><div class="sign-space"></div><div class="sign-name">Orang Tua</div></div>' +
        '<div><div class="sign-space">' + (r.parafGuruUrl ? '<img src="' + ui.attr(r.parafGuruUrl) + '" alt="Paraf pengajar" />' : '') + '</div><div class="sign-name">' + ui.esc(r.pengajarNama || 'Pengajar') + '</div></div>' +
        '<div><div class="sign-space">' + (r.ttdAdminUrl ? '<img src="' + ui.attr(r.ttdAdminUrl) + '" alt="Tanda tangan admin" />' : '') + '</div><div class="sign-name">Admin Bimbel</div></div></div>' +
      '<div class="rapor-foot"><span>Dicetak ' + ui.esc(ui.tanggal(ui.isoDate(new Date()), 'long')) + '</span><span>' + ui.esc(b.nama || 'Bimbel Matahari Kecil') + '</span></div>' +
    '</div>';
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

  function homeModal(s) {
    s = s || {};
    var name = s.nama || s.anakNama || 'Anak';
    var lat = s.rumahLat || '';
    var lng = s.rumahLng || '';
    var hasPoint = !!(lat && lng);
    var point = lat + ',' + lng;
    var mapsUrl = hasPoint ? 'https://www.google.com/maps?q=' + encodeURIComponent(point) : '';
    var routeUrl = hasPoint ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(point) : '';
    var body = '<div class="stack">' +
      (s.fotoRumahUrl
        ? '<div class="home-modal-photo"><img src="' + ui.attr(s.fotoRumahUrl) + '" alt="Foto halaman depan rumah" /></div>'
        : '<div class="home-modal-empty">' + ui.icon('home', 26) + '<span>Orang tua belum mengunggah foto halaman depan rumah.</span></div>') +
      '<div class="info-list">' +
        infoItem('Anak', name) + infoItem('Orang tua', s.ortuNama || '—') +
        infoItem('Alamat rumah', s.alamatRumah || 'Belum diisi') +
        infoItem('Titik lokasi', hasPoint ? lat + ', ' + lng : 'Belum diatur') +
      '</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        (mapsUrl ? '<a class="btn btn-primary btn-sm" href="' + ui.attr(mapsUrl) + '" target="_blank" rel="noopener">' + ui.icon('mapPin', 14) + ' Buka di Maps</a>' : '') +
        (routeUrl ? '<a class="btn btn-outline btn-sm" href="' + ui.attr(routeUrl) + '" target="_blank" rel="noopener">' + ui.icon('map', 14) + ' Rute perjalanan</a>' : '') +
        waButton(s.ortuPhone, 'Halo Bapak/Ibu, saya pengajar ' + name + ' di Bimbel Matahari Kecil. Saya ingin menanyakan lokasi rumah untuk jadwal belajar.', 'Chat orang tua') +
      '</div>' +
      (!hasPoint && !s.alamatRumah ? '<div class="note-box">Alamat dan titik lokasi belum diisi. Minta orang tua melengkapinya melalui menu Pengaturan.</div>' : '') +
    '</div>';
    ui.modal({
      title: 'Lokasi rumah ' + name,
      subtitle: 'Akses kunjungan pengajar',
      size: 'md',
      body: body,
      footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button>',
      onMount: function (el, close) {
        var b = el.querySelector('[data-close]');
        if (b) b.onclick = close;
      }
    });
  }

  window.BMK.shared = {
    options: options,
    periodSelect: periodSelect,
    time24Options: time24Options,
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
    statusAbsen: statusAbsen,
    avgScore: avgScore,
    raporHTML: raporHTML,
    emptyRow: emptyRow,
    infoItem: infoItem,
    waButton: waButton,
    homeModal: homeModal,
    parseNum: parseNum
  };
})();

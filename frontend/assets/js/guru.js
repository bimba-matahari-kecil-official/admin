(function () {
  window.BMK = window.BMK || {};
  BMK.views = BMK.views || {};
  var V = BMK.views.guru = {};
  var ui = BMK.ui;
  var api = BMK.api;
  var S = BMK.shared;
  var C = BMK.const;

  function call(action, data) { return api.call(action, data); }
  function firstName(name) { return String(name || 'Pengajar').trim().split(/\s+/)[0]; }
  function todayIso() { return ui.isoDate(new Date()); }
  function timeNow() { return new Date().toTimeString().slice(0, 5); }
  function scoreAvg(nilai) {
    var keys = C.ASPECTS.map(function (a) { return a.key; });
    var vals = keys.map(function (k) { return Number(nilai && nilai[k]); }).filter(function (v) { return isFinite(v) && v > 0; });
    if (!vals.length) return 0;
    return Math.round(vals.reduce(function (s, v) { return s + v; }, 0) / vals.length);
  }
  function studentById(students, id, key) {
    key = key || 'id';
    return (students || []).filter(function (s) { return String(s[key]) === String(id); })[0] || null;
  }
  function statusLabel(value) {
    var s = (C.STATUS_ABSEN || []).filter(function (x) { return x.value === value; })[0];
    return s ? s.label : (value || '—');
  }

  /* =====================================================
     DASHBOARD PENGAJAR
     ===================================================== */
  V.dashboard = async function (ctx) {
    var data = await call('guru.dashboard');
    var st = data.stats;
    var todayStudents = data.students.filter(function (s) { return s.hariIni; });
    var agenda = todayStudents.length ? todayStudents : data.students;

    var html = ui.pageHead({
      eyebrow: ui.tanggal(data.today, 'long'),
      title: 'Selamat datang, ' + firstName(ctx.user.nama),
      subtitle: 'Siapkan absensi dan laporan belajar agar perkembangan anak terpantau orang tua.',
      actions: '<a class="btn btn-outline" href="#/guru/harian" data-route>' + ui.icon('clipboard', 15) + ' Laporan harian</a>' +
        '<a class="btn btn-primary" href="#/guru/absensi" data-route>' + ui.icon('mapPin', 15) + ' Absensi</a>'
    });

    if (st.lpmbMenunggu) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('fileCheck', 16) + '<span><b>' + st.lpmbMenunggu + ' rapor LPMB</b> masih menunggu persetujuan admin. <a class="bold" href="#/guru/lpmb" data-route>Lihat rapor</a></span></div>';
    }

    html += '<div class="welcome-card"><div class="welcome-copy">' +
        '<div class="welcome-kicker">Jadwal hari ini · ' + ui.esc(data.hariIni) + '</div>' +
        '<h2>' + st.jadwalHariIni + ' sesi terjadwal, ' + st.siswa + ' anak bimbingan</h2>' +
        '<p>Absensi tercatat ' + st.hadirHariIni + ' anak. ' + (st.belumAbsen ? st.belumAbsen + ' anak belum diabsen hari ini.' : 'Semua anak sudah memiliki catatan absensi hari ini.') + '</p>' +
        '<div class="welcome-actions">' +
          '<a class="btn btn-sun btn-sm" href="#/guru/absensi" data-route>' + ui.icon('camera', 14) + ' Mulai absensi</a>' +
          '<a class="btn btn-sm" style="background:rgba(255,255,255,.1);color:#fff" href="#/guru/harian" data-route>' + ui.icon('pencil', 14) + ' Isi laporan</a>' +
        '</div></div>' +
        '<div class="welcome-art">' + ui.icon('graduation', 46) + '<span class="orbit"></span></div>' +
      '</div>';

    html += '<div class="stat-grid">' +
      ui.stat('child', 'Anak bimbingan', ui.angka(st.siswa), { hint: st.jadwalHariIni + ' jadwal hari ini', tone: 'blue' }) +
      ui.stat('checkCircle', 'Hadir hari ini', ui.angka(st.hadirHariIni), { hint: st.belumAbsen + ' belum absen' }) +
      ui.stat('clipboard', 'Laporan hari ini', ui.angka(st.laporanHariIni), { hint: 'dari ' + st.jadwalHariIni + ' sesi' }) +
      ui.stat('banknote', 'Honor bulan ini', ui.rupiah(st.gajiBulan), { hint: 'tarif ' + ui.rupiah(st.tarifPerSesi) + '/sesi', tone: 'amber' }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>' + (todayStudents.length ? 'Agenda hari ini' : 'Anak bimbingan') + '</h2><p>Status absensi dan laporan sesi hari ini.</p></div><a class="link-btn" href="#/guru/absensi" data-route>Buka absensi</a></div><div class="card-body">' +
        (agenda.length ? agenda.map(function (s) {
          var att = s.absensi;
          var rep = s.laporan;
          return '<div class="list-row"><div class="person-cell">' + S.photo(s.fotoUrl, s.nama, 'sm') +
              '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.jadwalTeks || 'Jadwal belum diatur') + '</span></div></div>' +
              '<div class="list-end" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">' +
                (att ? ui.statusBadge(att.status) : ui.badge('Belum absen', 'gray')) +
                (rep ? ui.badge('Laporan siap', 'teal') : ui.badge('Belum laporan', 'gray')) +
                '<a class="btn btn-outline btn-sm" href="#/guru/absensi?enrollment=' + ui.attr(s.enrollmentId) + '" data-route>Absen</a>' +
                '<a class="btn btn-ghost btn-sm" href="#/guru/harian?enrollment=' + ui.attr(s.enrollmentId) + '" data-route>Laporan</a>' +
              '</div></div>';
        }).join('') : ui.empty('users', 'Belum ada siswa', 'Admin belum menautkan siswa ke jadwal Anda.')) +
      '</div></section>' +

      '<section class="card"><div class="card-head"><div><h2>Laporan terbaru</h2><p>Ringkasan aktivitas belajar yang Anda input.</p></div><a class="link-btn" href="#/guru/harian" data-route>Semua laporan</a></div><div class="card-body">' +
        (data.recentReports.length ? '<div class="grid grid-2">' + data.recentReports.slice(0, 2).map(function (r) { return S.reportCard(r); }).join('') + '</div>' : ui.empty('clipboard', 'Belum ada laporan', 'Laporan yang Anda isi akan tampil di sini.')) +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Rapor menunggu ACC</h2><p>Rapor yang sudah diajukan ke admin.</p></div></div><div class="card-body">' +
        (data.lpmbPending.length ? data.lpmbPending.map(function (l) {
          return '<div class="list-row">' + S.photo(l.anakFoto, l.anakNama, 'sm') +
            '<div class="list-main"><b>' + ui.esc(l.anakNama) + '</b><span>' + ui.esc(ui.periodeLabel(l.periode)) + '</span></div>' +
            '<div class="list-end">' + ui.statusBadge(l.status) + '</div></div>';
        }).join('') : ui.empty('checkCircle', 'Tidak ada antrean', 'Rapor yang diajukan akan muncul di sini.')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Kehadiran bulan ini</h2></div></div><div class="card-body">' +
        '<div class="info-list">' + S.infoItem('Sesi hadir', st.hadirBulan + ' sesi') + S.infoItem('Periode', ui.periodeLabel(data.periode)) +
          S.infoItem('Honor berjalan', ui.rupiah(st.gajiBulan)) + S.infoItem('Tarif per sesi', ui.rupiah(st.tarifPerSesi)) + '</div>' +
        '<div class="note-box mt-16">Slip gaji dibuat admin setiap akhir periode. Hubungi admin bila ada sesi yang belum tercatat.</div>' +
      '</div></section>' +
    '</div></div>';

    return { html: html, mount: function (root) { S.bindMedia(root); } };
  };

  /* =====================================================
     ABSENSI SISWA
     ===================================================== */
  V.absensi = async function (ctx) {
    var res = await Promise.all([
      call('guru.students'),
      call('absensi.list', { periode: ui.periodeNow() })
    ]);
    var students = res[0].students || [];
    var attendance = res[1].attendance || [];
    var today = todayIso();
    var todayByEnrollment = {};

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Absensi siswa',
      subtitle: 'Ambil foto dan lokasi GPS saat mencatat kehadiran. Catatan tersimpan otomatis ke Google Sheets.',
      actions: '<a class="btn btn-outline" href="#/guru/harian" data-route>' + ui.icon('clipboard', 15) + ' Laporan harian</a>'
    });
    html += '<div class="alert alert-info mb-16">' + ui.icon('mapPin', 16) + '<span>Izinkan akses lokasi pada browser. Status <b>Hadir</b> membutuhkan foto dan titik GPS. Jika berada di luar radius, catatan tetap tersimpan dengan peringatan untuk admin.</span></div>';

    html += '<section class="card"><div class="card-head"><div><h2>Daftar absensi hari ini</h2><p>' + ui.esc(ui.todayLong()) + ' · ' + students.length + ' anak bimbingan</p></div><span class="badge badge-teal">' + ui.icon('calendar', 11) + ' ' + ui.esc(today) + '</span></div><div class="card-body" id="todayAttendance"></div></section>';

    html += '<section class="card mt-16"><div class="card-head"><div><h2>Riwayat absensi</h2><p>Catatan bulan ' + ui.esc(ui.periodeLabel(ui.periodeNow())) + '.</p></div></div><div class="card-body">' +
      (attendance.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Anak</th><th>Tanggal</th><th>Status</th><th>Jam</th><th>Lokasi</th><th>Catatan</th><th></th></tr></thead><tbody id="attendanceRows"></tbody></table></div>' : ui.empty('mapPin', 'Belum ada riwayat', 'Absensi yang dicatat akan tampil di sini.')) +
    '</div></section>';

    return {
      html: html,
      mount: function (root) {
        attendance.forEach(function (a) {
          if (a.tanggal === today) todayByEnrollment[a.enrollmentId] = a;
        });
        drawToday();
        drawHistory();

        var prefill = ctx.params && ctx.params.enrollment;
        if (prefill) {
          var s = studentById(students, prefill, 'enrollmentId');
          ctx.params.enrollment = '';
          if (s) openAbsen(s, todayByEnrollment[s.enrollmentId] || null);
        }

        function drawToday() {
          var box = root.querySelector('#todayAttendance');
          if (!students.length) { box.innerHTML = ui.empty('users', 'Belum ada siswa', 'Admin belum menautkan siswa ke jadwal Anda.'); return; }
          box.innerHTML = students.map(function (s) {
            var a = todayByEnrollment[s.enrollmentId];
            return '<div class="attendance-row" style="flex-wrap:wrap">' +
              '<div class="person-cell" style="flex:1;min-width:0">' + S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.paketNama || '') + ' · ' + ui.esc(s.jadwalTeks || 'Jadwal belum diatur') + '</span></div></div>' +
              '<div class="row" style="gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' +
                (s.hariIni ? ui.badge('Jadwal hari ini', 'teal') : ui.badge(s.hari || 'Tanpa jadwal', 'gray')) +
                (a ? ui.statusBadge(a.status) : ui.badge('Belum absen', 'gray')) +
                (a && a.fotoUrl ? '<button type="button" class="icon-btn" data-view-photo="' + ui.attr(a.id) + '" title="Foto absensi">' + ui.icon('image', 15) + '</button>' : '') +
                '<button type="button" class="btn ' + (a ? 'btn-outline' : 'btn-primary') + ' btn-sm" data-absen="' + ui.attr(s.enrollmentId) + '">' + (a ? 'Perbarui' : ui.icon('camera', 13) + ' Absen') + '</button>' +
              '</div></div>';
          }).join('');
        }

        function drawHistory() {
          var body = root.querySelector('#attendanceRows');
          if (!body) return;
          var list = attendance.slice(0, 60);
          if (!list.length) return;
          body.innerHTML = list.map(function (a) {
            return '<tr><td><div class="person-cell">' + S.photo(a.anakFoto, a.anakNama, 'sm') + '<div class="pc-info"><b>' + ui.esc(a.anakNama) + '</b><span>' + ui.esc(a.paketNama || '') + '</span></div></div></td>' +
              '<td><b class="cell-strong">' + ui.esc(ui.tanggal(a.tanggal, 'short')) + '</b><span class="cell-sub">' + ui.esc(a.jadwalTeks || '') + '</span></td>' +
              '<td>' + ui.statusBadge(a.status) + '</td>' +
              '<td>' + ui.esc(a.jam || '—') + '</td>' +
              '<td>' + (a.lat !== '' && a.lat != null && a.lng !== '' && a.lng != null ? '<a class="link-btn" href="https://maps.google.com/?q=' + ui.attr(a.lat + ',' + a.lng) + '" target="_blank" rel="noopener">' + (a.jarakMeter != null ? a.jarakMeter + ' m' : 'Lihat peta') + '</a>' : '—') + '</td>' +
              '<td class="small">' + ui.esc(a.catatan || '—') + '</td>' +
              '<td><div class="cell-actions">' + (a.fotoUrl ? '<button type="button" class="icon-btn" data-view-photo="' + ui.attr(a.id) + '" title="Foto">' + ui.icon('image', 15) + '</button>' : '') + '</div></td></tr>';
          }).join('');
        }

        root.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-absen]');
          if (btn) {
            var s = studentById(students, btn.getAttribute('data-absen'), 'enrollmentId');
            if (s) openAbsen(s, todayByEnrollment[s.enrollmentId] || null);
            return;
          }
          var photoBtn = e.target.closest('[data-view-photo]');
          if (photoBtn) {
            var a = attendance.filter(function (x) { return x.id === photoBtn.getAttribute('data-view-photo'); })[0];
            if (a) S.photoModal(a.fotoUrl, [['Tanggal', ui.tanggal(a.tanggal)], ['Status', statusLabel(a.status)], ['Jam', a.jam], ['Jarak', a.jarakMeter != null ? a.jarakMeter + ' meter' : '—'], ['Catatan', a.catatan || '—']]);
          }
        });

        function openAbsen(s, existing) {
          var geo = existing && existing.lat !== '' && existing.lat != null && existing.lng !== '' && existing.lng != null ? { lat: existing.lat, lng: existing.lng, accuracy: null } : null;
          ui.modal({
            title: existing ? 'Perbarui absensi' : 'Absensi siswa',
            subtitle: s.nama + ' · ' + (s.jadwalTeks || 'Jadwal belum diatur'),
            size: 'lg',
            body: '<form id="absentForm"><div class="grid grid-2" style="gap:16px">' +
              '<div class="form-grid">' +
                '<div class="form-grid two">' +
                  '<div class="field"><label>Status <span class="req">*</span></label><select class="select" name="status">' +
                    C.STATUS_ABSEN.map(function (st) { return '<option value="' + st.value + '"' + (existing && existing.status === st.value ? ' selected' : '') + '>' + st.label + '</option>'; }).join('') + '</select></div>' +
                  '<div class="field"><label>Tanggal</label><input class="input" type="date" name="tanggal" max="' + ui.attr(today) + '" value="' + ui.attr(existing ? existing.tanggal : today) + '" /></div>' +
                '</div>' +
                '<div class="field"><label>Jam</label><input class="input" type="time" name="jam" value="' + ui.attr(existing ? existing.jam : timeNow()) + '" /></div>' +
                '<div class="field"><label>Keterangan</label><textarea class="textarea" name="catatan" placeholder="Materi yang dipelajari atau alasan izin/sakit.">' + ui.esc(existing ? existing.catatan : '') + '</textarea></div>' +
                '<div class="form-section"><div class="form-section-title">' + ui.icon('mapPin', 14) + ' Lokasi geotagging</div>' +
                  '<div class="note-box" id="attGeoInfo">Lokasi belum diambil.</div>' +
                  '<button type="button" class="btn btn-outline btn-sm mt-12" id="attGeoBtn">' + ui.icon('mapPin', 14) + ' Ambil lokasi GPS</button>' +
                  '<div id="attMap" class="map-picker mt-12"></div>' +
                '</div>' +
              '</div>' +
              '<div class="form-grid">' +
                '<div class="field"><label>Foto absensi ' + (existing && existing.status === 'hadir' ? '' : '') + '</label>' + S.uploadTile('attPhoto', { existing: existing ? existing.fotoUrl : '', icon: 'camera', title: 'Ambil / unggah foto', hint: 'Wajib untuk status hadir. Otomatis dikompres.' }) + '</div>' +
                '<div class="note-box">Status <b>Hadir</b> wajib memiliki foto dan GPS. Status izin, sakit, atau alpha tetap dapat dicatat tanpa foto.</div>' +
              '</div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="attSave">' + ui.icon('check', 15) + ' Simpan absensi</button>',
            onMount: async function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#absentForm');
              var info = el.querySelector('#attGeoInfo');
              var mapHandle = null;
              function paintGeo() {
                if (!geo) {
                  info.innerHTML = 'Lokasi belum diambil. Tekan tombol GPS atau pilih titik pada peta.';
                  return;
                }
                info.innerHTML = '<b>Lokasi tercatat</b><br>' + geo.lat.toFixed(6) + ', ' + geo.lng.toFixed(6) +
                  (geo.accuracy ? '<br>Akurasi ±' + geo.accuracy + ' m' : '') +
                  (existing && existing.jarakMeter != null ? '<br>Jarak dari Bimba: ' + existing.jarakMeter + ' m' : '');
              }
              function setGeo(lat, lng, accuracy) {
                geo = { lat: lat, lng: lng, accuracy: accuracy || null };
                paintGeo();
              }
              paintGeo();
              try {
                mapHandle = await ui.mountMap(el.querySelector('#attMap'), {
                  lat: geo ? geo.lat : '', lng: geo ? geo.lng : '',
                  onChange: function (lat, lng) { setGeo(lat, lng, null); }
                });
              } catch (err) { /* peta opsional */ }
              el.querySelector('#attGeoBtn').onclick = async function () {
                var btn = this;
                ui.busy(btn, true, 'Mengambil lokasi…');
                try {
                  var pos = await ui.geolocate();
                  setGeo(pos.lat, pos.lng, pos.accuracy);
                  if (mapHandle) mapHandle.setPoint({ lat: pos.lat, lng: pos.lng });
                  ui.toast('Lokasi berhasil diambil.', 'success');
                } catch (err) { ui.toast(err.message, 'error', 5000); }
                ui.busy(btn, false);
              };
              el.querySelector('#attSave').onclick = async function () {
                var btn = this;
                var d = ui.serialize(form);
                if (d.status === 'hadir' && !geo) { ui.toast('Ambil lokasi GPS terlebih dahulu untuk status hadir.', 'error'); return; }
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  var foto = await S.uploadValue('attPhoto', existing ? existing.fotoUrl : '');
                  if (d.status === 'hadir' && !foto) { ui.busy(btn, false); ui.toast('Foto absensi wajib diunggah untuk status hadir.', 'error'); return; }
                  var res = await call('absensi.save', {
                    enrollmentId: s.enrollmentId, tanggal: d.tanggal, status: d.status, jam: d.jam,
                    lat: geo ? geo.lat : '', lng: geo ? geo.lng : '', foto: foto, catatan: d.catatan
                  });
                  close();
                  if (res.warning) ui.toast(res.warning, 'info', 9000);
                  else ui.toast('Absensi ' + s.nama + ' tersimpan.', 'success');
                  BMK.app.navigate('#/guru/absensi', true);
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 6000); }
              };
            }
          });
        }
      }
    };
  };

  /* =====================================================
     LAPORAN HARIAN
     ===================================================== */
  V.harian = async function (ctx) {
    var res = await Promise.all([call('guru.students'), call('harian.list')]);
    var students = res[0].students || [];
    var reports = res[1].reports || [];
    var today = todayIso();

    var reportsToday = {};
    reports.forEach(function (r) { if (r.tanggal === today) reportsToday[r.anakId] = r; });

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Laporan hasil harian',
      subtitle: 'Isi materi, capaian, dokumentasi foto/video, dan paraf digital setiap sesi.',
      actions: '<button type="button" class="btn btn-primary" id="newReport">' + ui.icon('plus', 15) + ' Tulis laporan</button>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('users', 'Anak bimbingan', String(students.length), { hint: 'aktif' }) +
      ui.stat('clipboard', 'Laporan hari ini', String(Object.keys(reportsToday).length), { tone: 'blue', hint: students.length - Object.keys(reportsToday).length + ' belum diisi' }) +
      ui.stat('file', 'Total laporan', String(reports.length), { hint: 'seluruh periode' }) +
      ui.stat('calendar', 'Hari ini', ui.todayLong(), { hint: 'tanggal input' }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Sesi hari ini</h2><p>Laporan yang sudah diisi dapat diperbarui pada hari yang sama.</p></div></div><div class="card-body" id="studentSessions"></div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Dokumentasi laporan</h2><p>Foto dan video yang Anda unggah.</p></div><select class="select" id="reportStudent" style="max-width:220px"><option value="">Semua anak</option>' + S.options(students, '') + '</select></div><div class="card-body" id="reportGrid"></div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Panduan singkat</h2></div></div><div class="card-body">' +
        '<div class="info-list"><div class="info-item"><div class="ii-label">Materi</div><div class="ii-value">Tulis topik yang dipelajari.</div></div>' +
        '<div class="info-item"><div class="ii-label">Capaian</div><div class="ii-value">Jelaskan hasil belajar anak.</div></div>' +
        '<div class="info-item"><div class="ii-label">Dokumentasi</div><div class="ii-value">Unggah maks 3 foto dan 2 video.</div></div>' +
        '<div class="info-item"><div class="ii-label">Paraf</div><div class="ii-value">Tanda tangan pada area yang tersedia.</div></div></div>' +
        '<div class="note-box mt-16">Laporan langsung terlihat oleh orang tua melalui dashboard mereka.</div>' +
      '</div></section>' +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        drawSessions();
        drawGrid();
        root.querySelector('#newReport').onclick = function () { pickStudent(); };
        root.querySelector('#reportStudent').onchange = drawGrid;

        var prefill = ctx.params && ctx.params.enrollment;
        if (prefill) {
          var s = studentById(students, prefill, 'enrollmentId');
          ctx.params.enrollment = '';
          if (s) openReport(s, reportsToday[s.id] || null);
        }

        function drawSessions() {
          var box = root.querySelector('#studentSessions');
          if (!students.length) { box.innerHTML = ui.empty('users', 'Belum ada siswa', 'Admin belum menautkan siswa ke jadwal Anda.'); return; }
          box.innerHTML = '<div class="grid grid-2">' + students.map(function (s) {
            var r = reportsToday[s.id];
            return '<div class="slip-card"><div class="slip-top"><div class="person-cell">' + S.photo(s.fotoUrl, s.nama, 'sm') +
                '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.jadwalTeks || 'Jadwal belum diatur') + '</span></div></div>' +
                (r ? ui.badge('Sudah diisi', 'green') : ui.badge('Belum diisi', 'gray')) + '</div>' +
              '<div class="small text-muted">' + ui.esc(s.paketNama || '') + (s.hariIni ? ' · <b class="text-teal">jadwal hari ini</b>' : '') + '</div>' +
              '<div class="row mt-12" style="gap:6px;flex-wrap:wrap">' +
                '<button type="button" class="btn ' + (r ? 'btn-outline' : 'btn-primary') + ' btn-sm" data-write="' + ui.attr(s.enrollmentId) + '">' + ui.icon(r ? 'pencil' : 'plus', 13) + ' ' + (r ? 'Perbarui laporan' : 'Isi laporan') + '</button>' +
                (s.hariIni ? '<span class="badge badge-teal">' + ui.icon('calendar', 11) + ' hari ini</span>' : '') +
              '</div></div>';
          }).join('') + '</div>';
        }

        function drawGrid() {
          var box = root.querySelector('#reportGrid');
          var filter = root.querySelector('#reportStudent').value;
          var list = reports.filter(function (r) { return !filter || String(r.anakId) === filter; });
          if (!list.length) { box.innerHTML = ui.empty('clipboard', 'Belum ada laporan', 'Laporan yang diisi akan tampil di sini beserta dokumentasinya.'); return; }
          box.innerHTML = '<div class="grid grid-2">' + list.slice(0, 8).map(function (r) { return S.reportCard(r); }).join('') + '</div>';
          S.bindMedia(box);
        }

        root.addEventListener('click', function (e) {
          var b = e.target.closest('[data-write]');
          if (!b) return;
          var s = studentById(students, b.getAttribute('data-write'), 'enrollmentId');
          if (s) openReport(s, reportsToday[s.id] || null);
        });

        function pickStudent() {
          if (!students.length) { ui.toast('Belum ada siswa bimbingan.', 'info'); return; }
          ui.modal({
            title: 'Pilih siswa',
            subtitle: 'Laporan akan dibuat untuk sesi hari ini.',
            size: 'md',
            body: '<div class="stack-sm">' + students.map(function (s) {
              return '<button type="button" class="list-row" data-pick="' + ui.attr(s.enrollmentId) + '" style="width:100%;background:none;border:0;text-align:left;cursor:pointer">' +
                S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="list-main"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.jadwalTeks || 'Jadwal belum diatur') + '</span></div>' +
                '<div class="list-end">' + iconArrow() + '</div></button>';
            }).join('') + '</div>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              el.addEventListener('click', function (ev) {
                var b = ev.target.closest('[data-pick]');
                if (!b) return;
                var s = studentById(students, b.getAttribute('data-pick'), 'enrollmentId');
                close();
                if (s) openReport(s, reportsToday[s.id] || null);
              });
            }
          });
        }
        function iconArrow() { return ui.icon('chevronRight', 16); }

        function openReport(s, existing) {
          ui.modal({
            title: existing ? 'Perbarui laporan harian' : 'Laporan hasil harian',
            subtitle: s.nama + ' · ' + (s.jadwalTeks || 'Jadwal belum diatur'),
            size: 'xl',
            body: '<form id="dailyForm"><div class="form-grid">' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Tanggal <span class="req">*</span></label><input class="input" type="date" name="tanggal" max="' + ui.attr(today) + '" value="' + ui.attr(existing ? existing.tanggal : today) + '" /></div>' +
                '<div class="field"><label>Anak</label><input class="input" value="' + ui.attr(s.nama + ' · ' + (s.paketNama || '')) + '" disabled /></div>' +
              '</div>' +
              '<div class="field"><label>Materi pembelajaran <span class="req">*</span></label><textarea class="textarea" name="materi" placeholder="Contoh: Membaca suku kata ba-bi-bu, berhitung penjumlahan 1–10.">' + ui.esc(existing ? existing.materi : '') + '</textarea></div>' +
              '<div class="field"><label>Capaian belajar <span class="req">*</span></label><textarea class="textarea" name="capaian" placeholder="Jelaskan perkembangan dan capaian anak pada sesi ini.">' + ui.esc(existing ? existing.capaian : '') + '</textarea></div>' +
              '<div class="field"><label>Catatan tambahan</label><textarea class="textarea" name="catatan" placeholder="Catatan untuk orang tua (opsional).">' + ui.esc(existing ? existing.catatan : '') + '</textarea></div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('image', 14) + ' Foto kegiatan (maks 3)</div><div class="grid grid-3">' +
                S.uploadTile('dailyPhoto1', { existing: existing && existing.fotoUrls ? existing.fotoUrls[0] : '', icon: 'camera', title: 'Foto 1' }) +
                S.uploadTile('dailyPhoto2', { existing: existing && existing.fotoUrls ? existing.fotoUrls[1] : '', icon: 'camera', title: 'Foto 2' }) +
                S.uploadTile('dailyPhoto3', { existing: existing && existing.fotoUrls ? existing.fotoUrls[2] : '', icon: 'camera', title: 'Foto 3' }) +
              '</div></div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('video', 14) + ' Video kegiatan (maks 2)</div><div class="grid grid-2">' +
                S.uploadTile('dailyVideo1', { existing: existing && existing.videoUrls ? existing.videoUrls[0] : '', video: true, title: 'Video 1' }) +
                S.uploadTile('dailyVideo2', { existing: existing && existing.videoUrls ? existing.videoUrls[1] : '', video: true, title: 'Video 2' }) +
              '</div><div class="hint">Video maksimal 20 MB per berkas.</div></div>' +
              S.signaturePanel('dailyParaf', existing ? existing.parafUrl : (ctx.user.ttdUrl || ''), 'Paraf digital pengajar') +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="dailySave">' + ui.icon('check', 15) + ' Simpan laporan</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#dailyForm');
              var pad = ui.signaturePad(el.querySelector('#dailyParaf'));
              el.querySelector('#dailySave').onclick = async function () {
                var btn = this;
                var d = ui.serialize(form);
                if (!d.materi || d.materi.length < 2) { ui.fieldError(form, 'materi', 'Materi pembelajaran wajib diisi.'); return; }
                if (!d.capaian || d.capaian.length < 2) { ui.fieldError(form, 'capaian', 'Capaian belajar wajib diisi.'); return; }
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  var foto = [];
                  for (var i = 1; i <= 3; i++) {
                    var f = await S.uploadValue('dailyPhoto' + i, existing && existing.fotoUrls ? existing.fotoUrls[i - 1] : '');
                    if (f) foto.push(f);
                  }
                  var video = [];
                  for (var j = 1; j <= 2; j++) {
                    var v = await S.uploadValue('dailyVideo' + j, existing && existing.videoUrls ? existing.videoUrls[j - 1] : '');
                    if (v) video.push(v);
                  }
                  var paraf = pad.isEmpty() ? (existing ? existing.parafUrl : (ctx.user.ttdUrl || '')) : pad.toDataURL();
                  await call('harian.save', {
                    enrollmentId: s.enrollmentId, tanggal: d.tanggal, materi: d.materi, capaian: d.capaian,
                    catatan: d.catatan, foto: foto, video: video, paraf: paraf
                  });
                  close();
                  ui.toast('Laporan harian ' + s.nama + ' disimpan.', 'success');
                  BMK.app.navigate('#/guru/harian', true);
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 6000); }
              };
            }
          });
        }
      }
    };
  };

  /* =====================================================
     RAPOR LPMB
     ===================================================== */
  V.lpmb = async function (ctx) {
    var res = await Promise.all([call('lpmb.list'), call('guru.students')]);
    var rows = res[0].lpmb || [];
    var students = res[0].filters && res[0].filters.children ? res[0].filters.children : res[1].students || [];
    var enriched = students.map(function (s) {
      var full = res[1].students ? studentById(res[1].students, s.id) : null;
      return Object.assign({}, full || {}, s);
    });
    var currentPeriod = ui.periodeNow();
    var today = todayIso();

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Rapor LPMB',
      subtitle: 'Susun nilai enam aspek perkembangan. Rapor yang diajukan akan ditinjau dan ditandatangani admin.',
      actions: '<button type="button" class="btn btn-primary" id="newLpmb">' + ui.icon('plus', 15) + ' Buat rapor</button>'
    });
    html += '<div class="alert alert-info mb-16">' + ui.icon('fileCheck', 16) + '<span>Rapor yang sudah <b>disetujui</b> tidak dapat diubah. Orang tua dapat mengunduh rapor dalam format A4.</span></div>';
    html += '<div class="stat-grid">' +
      ui.stat('fileCheck', 'Total rapor', String(rows.length), { hint: 'semua periode' }) +
      ui.stat('clock', 'Menunggu ACC', String(rows.filter(function (r) { return r.status === 'menunggu_acc'; }).length), { tone: 'amber' }) +
      ui.stat('checkCircle', 'Disetujui', String(rows.filter(function (r) { return r.status === 'disetujui'; }).length), { tone: 'dark' }) +
      ui.stat('calendar', 'Periode aktif', ui.periodeLabel(currentPeriod), { hint: 'buat rapor periode ini' }) +
    '</div>';
    html += '<div class="card mt-16"><div class="card-body">' +
      '<div class="data-toolbar"><div class="filter-row"><select class="select" id="lpmbFilter"><option value="">Semua status</option><option value="draft">Draft</option><option value="menunggu_acc">Menunggu ACC</option><option value="disetujui">Disetujui</option><option value="ditolak">Ditolak</option></select></div><span class="small text-muted">Nilai diisi 0–100 untuk setiap aspek.</span></div>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Anak</th><th>Periode</th><th>Rata-rata</th><th>Status</th><th>Diperbarui</th><th></th></tr></thead><tbody id="lpmbRows"></tbody></table></div>' +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        var filterEl = root.querySelector('#lpmbFilter');
        var body = root.querySelector('#lpmbRows');
        function draw() {
          var list = rows.filter(function (r) { return !filterEl.value || r.status === filterEl.value; });
          if (!list.length) { body.innerHTML = S.emptyRow(6, 'Belum ada rapor untuk filter ini.'); return; }
          body.innerHTML = list.map(function (r) {
            var avg = scoreAvg(r.nilai);
            var p = ui.predikat(avg);
            return '<tr><td><div class="person-cell">' + S.photo(r.anakFoto, r.anakNama, 'sm') + '<div class="pc-info"><b>' + ui.esc(r.anakNama) + '</b><span>' + ui.esc([r.kelas, r.sekolah].filter(Boolean).join(' · ')) + '</span></div></div></td>' +
              '<td><b class="cell-strong">' + ui.esc(ui.periodeLabel(r.periode)) + '</b></td>' +
              '<td class="num"><b>' + avg + '</b> ' + ui.badge(p.grade, p.tone) + '</td>' +
              '<td>' + ui.statusBadge(r.status) + '</td>' +
              '<td>' + ui.esc(ui.tanggal(r.updatedAt, 'short')) + '</td>' +
              '<td><div class="cell-actions">' +
                '<button type="button" class="btn btn-outline btn-sm" data-lpmb-view="' + ui.attr(r.id) + '">Lihat</button>' +
                (r.status !== 'disetujui' ? '<button type="button" class="btn btn-ghost btn-sm" data-lpmb-edit="' + ui.attr(r.id) + '">Edit</button>' : '') +
              '</div></td></tr>';
          }).join('');
        }
        draw();
        filterEl.onchange = draw;
        root.querySelector('#newLpmb').onclick = function () { pickStudent(); };

        root.addEventListener('click', function (e) {
          var view = e.target.closest('[data-lpmb-view]');
          if (view) { viewLpmb(rows.filter(function (r) { return r.id === view.getAttribute('data-lpmb-view'); })[0]); return; }
          var edit = e.target.closest('[data-lpmb-edit]');
          if (edit) {
            var r = rows.filter(function (x) { return x.id === edit.getAttribute('data-lpmb-edit'); })[0];
            if (!r) return;
            var s = studentById(enriched, r.anakId);
            if (!s) { ui.toast('Data anak tidak ditemukan.', 'error'); return; }
            openEditor(s, r);
          }
        });

        function pickStudent() {
          if (!enriched.length) { ui.toast('Belum ada siswa bimbingan.', 'info'); return; }
          ui.modal({
            title: 'Pilih siswa',
            subtitle: 'Buat rapor untuk periode yang dipilih di form berikutnya.',
            size: 'md',
            body: '<div class="stack-sm">' + enriched.map(function (s) {
              var cur = rows.filter(function (r) { return String(r.anakId) === String(s.id) && r.periode === currentPeriod; })[0];
              return '<button type="button" class="list-row" data-pick="' + ui.attr(s.id) + '" style="width:100%;background:none;border:0;text-align:left;cursor:pointer">' +
                S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="list-main"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.jadwalTeks || 'Jadwal belum diatur') + '</span></div>' +
                '<div class="list-end">' + (cur ? ui.statusBadge(cur.status) : ui.badge('Belum ada', 'gray')) + '</div></button>';
            }).join('') + '</div>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              el.addEventListener('click', function (ev) {
                var b = ev.target.closest('[data-pick]');
                if (!b) return;
                var s = studentById(enriched, b.getAttribute('data-pick'));
                close();
                if (!s) return;
                var cur = rows.filter(function (r) { return String(r.anakId) === String(s.id) && r.periode === currentPeriod; })[0];
                if (cur && cur.status === 'disetujui') { viewLpmb(cur); return; }
                openEditor(s, cur || null);
              });
            }
          });
        }

        function scoreRowsHtml(nilai) {
          return C.ASPECTS.map(function (a) {
            var v = nilai && nilai[a.key] != null ? nilai[a.key] : '';
            var p = ui.predikat(v);
            return '<div class="aspect-row"><div><b>' + ui.esc(a.label) + '</b><span>' + ui.esc(a.hint || '') + '</span></div>' +
              '<div class="score-input"><input class="input" type="number" min="0" max="100" name="s_' + a.key + '" value="' + ui.attr(v) + '" placeholder="0–100" /><span class="pred">' + (v === '' ? '—' : p.label) + '</span></div></div>';
          }).join('');
        }

        function openEditor(s, existing) {
          ui.modal({
            title: existing ? 'Edit rapor LPMB' : 'Buat rapor LPMB',
            subtitle: s.nama + ' · ' + (s.paketNama || ''),
            size: 'lg',
            body: '<form id="lpmbForm"><div class="form-grid">' +
              (existing ? '<div class="alert alert-info">' + ui.icon('info', 16) + '<span>Status saat ini: ' + ui.statusBadge(existing.status) + '. Anda dapat memperbarui lalu mengajukan ulang.</span></div>' : '') +
              '<div class="form-grid two">' +
                '<div class="field"><label>Periode rapor <span class="req">*</span></label>' + S.periodSelect('periode', existing ? existing.periode : currentPeriod, 12) + '</div>' +
                '<div class="field"><label>Tanggal rapor</label><input class="input" type="date" name="tanggal" max="' + ui.attr(today) + '" value="' + ui.attr(existing ? existing.tanggal : today) + '" /></div>' +
              '</div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('chart', 14) + ' Nilai aspek perkembangan</div>' + scoreRowsHtml(existing ? existing.nilai : null) + '</div>' +
              '<div class="field"><label>Catatan perkembangan <span class="req">*</span></label><textarea class="textarea" name="catatan" placeholder="Ringkasan perkembangan anak selama periode ini (minimal 5 karakter).">' + ui.esc(existing ? existing.catatan : '') + '</textarea></div>' +
              '<div class="field"><label>Rekomendasi untuk orang tua</label><textarea class="textarea" name="rekomendasi" placeholder="Saran latihan di rumah, target periode berikutnya.">' + ui.esc(existing ? existing.rekomendasi : '') + '</textarea></div>' +
              S.signaturePanel('lpmbParaf', existing ? existing.parafGuruUrl : (ctx.user.ttdUrl || ''), 'Paraf digital pengajar') +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-outline" id="lpmbDraft">Simpan draft</button><button type="button" class="btn btn-primary" id="lpmbSubmit">' + ui.icon('send', 14) + ' Ajukan ke admin</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#lpmbForm');
              var pad = ui.signaturePad(el.querySelector('#lpmbParaf'));
              Array.prototype.forEach.call(form.querySelectorAll('.score-input input'), function (inp) {
                inp.addEventListener('input', function () {
                  var p = ui.predikat(this.value);
                  var span = this.parentNode.querySelector('.pred');
                  if (span) span.textContent = this.value === '' ? '—' : p.label;
                });
              });
              el.querySelector('#lpmbDraft').onclick = function () { save('draft', this); };
              el.querySelector('#lpmbSubmit').onclick = function () { save('menunggu_acc', this); };

              async function save(status, btn) {
                var d = ui.serialize(form);
                var nilai = {};
                for (var i = 0; i < C.ASPECTS.length; i++) {
                  var key = C.ASPECTS[i].key;
                  var raw = d['s_' + key];
                  if (raw === '' || raw === undefined) { ui.toast('Lengkapi nilai ' + C.ASPECTS[i].label + '.', 'error'); return; }
                  var n = Number(raw);
                  if (!isFinite(n) || n < 0 || n > 100) { ui.toast('Nilai ' + C.ASPECTS[i].label + ' harus 0–100.', 'error'); return; }
                  nilai[key] = Math.round(n);
                }
                if (!d.catatan || d.catatan.length < 5) { ui.fieldError(form, 'catatan', 'Catatan perkembangan minimal 5 karakter.'); return; }
                if (!d.periode) { ui.toast('Pilih periode rapor.', 'error'); return; }
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  var paraf = pad.isEmpty() ? (existing ? existing.parafGuruUrl : (ctx.user.ttdUrl || '')) : pad.toDataURL();
                  await call('lpmb.save', {
                    anakId: s.id, periode: d.periode, tanggal: d.tanggal, nilai: nilai,
                    catatan: d.catatan, rekomendasi: d.rekomendasi, paraf: paraf, status: status
                  });
                  close();
                  ui.toast(status === 'draft' ? 'Rapor disimpan sebagai draft.' : 'Rapor diajukan ke admin untuk ACC.', 'success', 5000);
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 6000); }
              }
            }
          });
        }

        function viewLpmb(r) {
          if (!r) return;
          var avg = scoreAvg(r.nilai);
          var p = ui.predikat(avg);
          ui.modal({
            title: 'Rapor ' + r.anakNama,
            subtitle: ui.periodeLabel(r.periode) + ' · rata-rata ' + avg + ' (' + p.label + ')',
            size: 'lg',
            body: '<div class="grid grid-2" style="gap:16px"><div><div class="section-head-sm"><h3>Identitas</h3>' + ui.statusBadge(r.status) + '</div>' +
                '<div class="info-list">' + S.infoItem('Anak', r.anakNama) + S.infoItem('Kelas', r.kelas || '—') +
                  S.infoItem('Sekolah', r.sekolah || '—') + S.infoItem('Orang tua', r.ortuNama) +
                  S.infoItem('Periode', ui.periodeLabel(r.periode)) + S.infoItem('Diperbarui', ui.tanggalWaktu(r.updatedAt)) + '</div></div>' +
              '<div><div class="section-head-sm"><h3>Nilai aspek</h3></div><div class="table-wrap"><table class="data-table"><tbody>' + S.lpmbScoreRows(r.nilai) + '</tbody></table></div></div></div>' +
            '<div class="form-section"><div class="form-section-title">' + ui.icon('file', 14) + ' Catatan perkembangan</div><div class="report-text">' + ui.esc(r.catatan || '—') + '</div></div>' +
            (r.rekomendasi ? '<div class="form-section"><div class="form-section-title">' + ui.icon('target', 14) + ' Rekomendasi</div><div class="report-text">' + ui.esc(r.rekomendasi) + '</div></div>' : '') +
            (r.catatanAdmin ? '<div class="alert alert-info mt-12">' + ui.icon('info', 16) + '<span><b>Catatan admin:</b> ' + ui.esc(r.catatanAdmin) + '</span></div>' : '') +
            '<div class="grid grid-2 mt-16"><div class="sig-preview">' + (r.parafGuruUrl ? '<img src="' + ui.attr(r.parafGuruUrl) + '" alt="Paraf pengajar" />' : '<span class="sig-empty">Paraf pengajar belum ada</span>') + '</div>' +
              '<div class="sig-preview">' + (r.ttdAdminUrl ? '<img src="' + ui.attr(r.ttdAdminUrl) + '" alt="Tanda tangan admin" />' : '<span class="sig-empty">Belum disetujui admin</span>') + '</div></div>',
            footer: '<button type="button" class="btn btn-primary" data-close>Tutup</button>',
            onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; }
          });
        }
      }
    };
  };

  /* =====================================================
     PENGATURAN PENGAJAR
     ===================================================== */
  V.pengaturan = async function (ctx) {
    var res = await Promise.all([api.me(), call('guru.dashboard')]);
    var user = res[0].user;
    var teacher = res[1].teacher;
    var st = res[1].stats;

    var html = ui.pageHead({
      eyebrow: 'Akun',
      title: 'Pengaturan akun',
      subtitle: 'Perbarui data diri, foto, tanda tangan, dan kata sandi akun pengajar.',
      actions: '<a class="btn btn-outline" href="#/guru/dashboard" data-route>' + ui.icon('dashboard', 15) + ' Dashboard</a>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('child', 'Anak bimbingan', String(st.siswa), { hint: 'aktif' }) +
      ui.stat('checkCircle', 'Hadir bulan ini', String(st.hadirBulan) + ' sesi', { tone: 'blue' }) +
      ui.stat('banknote', 'Tarif per sesi', ui.rupiah(teacher.tarifPerSesi), { hint: 'diatur admin' }) +
      ui.stat('wallet', 'Honor bulan ini', ui.rupiah(st.gajiBulan), { tone: 'amber' }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Data diri pengajar</h2><p>Nama dan kontak digunakan pada laporan dan slip gaji.</p></div></div><div class="card-body">' +
        '<form id="teacherForm"><div class="form-grid">' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(teacher.nama) + '" /></div>' +
            '<div class="field"><label>Username</label><input class="input" value="' + ui.attr(user.username) + '" disabled /><div class="hint">Username tidak dapat diubah sendiri.</div></div>' +
          '</div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>WhatsApp</label><input class="input" name="phone" value="' + ui.attr(teacher.phone) + '" placeholder="08xxxxxxxxxx" /></div>' +
            '<div class="field"><label>Email</label><input class="input" type="email" name="email" value="' + ui.attr(teacher.email) + '" /></div>' +
          '</div>' +
          '<div class="field"><label>Spesialisasi</label><input class="input" name="spesialisasi" value="' + ui.attr(teacher.spesialisasi) + '" placeholder="Contoh: Calistung, Matematika SD" /></div>' +
          '<div class="field"><label>Alamat</label><textarea class="textarea" name="alamat">' + ui.esc(user.alamat || '') + '</textarea></div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Foto pengajar</label>' + S.uploadTile('teacherProfilePhoto', { existing: teacher.fotoUrl, icon: 'camera', title: 'Unggah foto', hint: 'JPG/PNG' }) + '</div>' +
            '<div class="field"><label>Tanda tangan</label>' + S.uploadTile('teacherProfileTtd', { existing: teacher.ttdUrl, icon: 'pencil', title: 'Unggah tanda tangan', hint: 'Dipakai sebagai paraf otomatis' }) + '</div>' +
          '</div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary" id="teacherSave">' + ui.icon('check', 15) + ' Simpan data diri</button></div>' +
        '</div></form>' +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Keamanan akun</h2><p>Ganti kata sandi secara berkala.</p></div></div><div class="card-body">' +
        '<form id="passwordForm"><div class="form-grid">' +
          '<div class="field"><label>Kata sandi saat ini <span class="req">*</span></label><input class="input" type="password" name="oldPassword" autocomplete="current-password" /></div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Kata sandi baru <span class="req">*</span></label><input class="input" type="password" name="newPassword" autocomplete="new-password" placeholder="minimal 6 karakter" /></div>' +
            '<div class="field"><label>Ulangi kata sandi baru <span class="req">*</span></label><input class="input" type="password" name="confirmPassword" autocomplete="new-password" /></div>' +
          '</div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary" id="passwordSave">' + ui.icon('lock', 15) + ' Perbarui kata sandi</button></div>' +
        '</div></form>' +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Profil pengajar</h2></div></div><div class="card-body">' +
        '<div style="text-align:center;padding:6px 0 14px">' + ui.avatar(teacher.nama, teacher.fotoUrl, 'xl', 'sun') +
          '<h3 style="margin-top:10px">' + ui.esc(teacher.nama) + '</h3><div class="small text-muted">' + ui.esc(teacher.spesialisasi || 'Pengajar') + '</div>' +
          '<div class="mt-8">' + ui.statusBadge(teacher.status) + '</div></div>' +
        '<div class="info-list">' + S.infoItem('Username', '@' + user.username) + S.infoItem('Bergabung', ui.tanggal(teacher.createdAt, 'short')) +
          S.infoItem('Siswa aktif', String(st.siswa)) + S.infoItem('Gaji berjalan', ui.rupiah(st.gajiBulan)) + '</div>' +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Catatan</h2></div></div><div class="card-body">' +
        '<div class="note-box">Foto dan tanda tangan yang diunggah di sini dipakai pada laporan harian dan rapor. Pastikan gambar jelas dan latar putih.</div>' +
        '<div class="alert alert-info mt-12">' + ui.icon('shield', 16) + '<span>Sesi berlaku 7 hari. Jika perangkat hilang, minta admin menonaktifkan akun Anda.</span></div>' +
      '</div></section>' +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        var form = root.querySelector('#teacherForm');
        form.addEventListener('submit', async function (e) {
          e.preventDefault();
          var d = ui.serialize(form);
          if (!d.nama) { ui.fieldError(form, 'nama', 'Nama wajib diisi.'); return; }
          var btn = root.querySelector('#teacherSave');
          ui.busy(btn, true, 'Menyimpan…');
          try {
            var r = await call('guru.profile', {
              nama: d.nama, phone: d.phone, email: d.email, spesialisasi: d.spesialisasi, alamat: d.alamat,
              foto: await S.uploadValue('teacherProfilePhoto', teacher.fotoUrl),
              ttd: await S.uploadValue('teacherProfileTtd', teacher.ttdUrl)
            });
            BMK.app.patchUser({ nama: r.user.nama, phone: r.user.phone, email: r.user.email, fotoUrl: r.user.fotoUrl, ttdUrl: r.user.ttdUrl });
            ui.toast('Data diri diperbarui.', 'success');
            ctx.refresh();
          } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
        });

        var pwd = root.querySelector('#passwordForm');
        pwd.addEventListener('submit', async function (e) {
          e.preventDefault();
          var d = ui.serialize(pwd);
          if (!d.oldPassword) { ui.fieldError(pwd, 'oldPassword', 'Masukkan kata sandi saat ini.'); return; }
          if (!d.newPassword || d.newPassword.length < 6) { ui.fieldError(pwd, 'newPassword', 'Kata sandi baru minimal 6 karakter.'); return; }
          if (d.newPassword !== d.confirmPassword) { ui.fieldError(pwd, 'confirmPassword', 'Ulangi kata sandi baru dengan benar.'); return; }
          var btn = root.querySelector('#passwordSave');
          ui.busy(btn, true, 'Memperbarui…');
          try {
            await api.changePassword(d.oldPassword, d.newPassword);
            pwd.reset();
            ui.toast('Kata sandi berhasil diperbarui.', 'success');
          } catch (err) { ui.toast(err.message, 'error', 5500); }
          ui.busy(btn, false);
        });
      }
    };
  };
})();

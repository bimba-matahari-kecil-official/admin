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
    var extras = nilai && nilai.__extra;
    if (Array.isArray(extras)) extras.forEach(function (x) { var v = Number(x && x.nilai); if (isFinite(v) && v > 0) vals.push(v); });
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
  function hasHome(s) {
    return !!(s && (s.alamatRumah || (s.rumahLat && s.rumahLng) || s.fotoRumahUrl));
  }
  function studentsWithToday(res) {
    var names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var dayName = (res && res.todayName) || names[new Date().getDay()];
    var list = (res && res.students) || [];
    list.forEach(function (s) {
      if (typeof s.hariIni !== 'boolean') s.hariIni = String(s.jadwalTeks || s.hari || '').indexOf(dayName) !== -1;
    });
    return list;
  }
  function dayAt(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return { date: d, iso: ui.isoDate(d), name: C.HARI[d.getDay()], label: ui.tanggal(d, 'long') };
  }
  function studentOnDay(s, dayName) {
    if (s && Array.isArray(s.days)) return s.days.indexOf(dayName) !== -1;
    return String((s && (s.jadwalTeks || s.hari)) || '').indexOf(dayName) !== -1;
  }
  function daySlots(s, dayName) {
    var list = s && Array.isArray(s.slots) ? s.slots.filter(function (sl) { return sl.hari === dayName; }) : [];
    if (!list.length && s && s.hari === dayName) list = [{ slotId: s.slotId || '', hari: s.hari, jamMulai: s.jamMulai, jamSelesai: s.jamSelesai }];
    return list;
  }
  function slotTimesOnDay(s, dayName) {
    return daySlots(s, dayName).map(function (sl) { return sl.jamMulai + '–' + sl.jamSelesai; }).join(' & ');
  }
  function sessionCountFor(list, dayName) {
    return (list || []).reduce(function (n, s) { return n + daySlots(s, dayName).length; }, 0);
  }
  function waReminderLink(s, when, dayName, dateLabel, timeText) {
    if (!s || !s.ortuPhone) return '';
    var times = timeText || slotTimesOnDay(s, dayName);
    var msg = 'Halo Bapak/Ibu ' + (s.ortuNama || 'Orang Tua') + ', mengingatkan jadwal belajar ' + (s.nama || 'anak') + ' ' + when + ', ' + dateLabel +
      (times ? ', pukul ' + times : '') + (s.paketNama ? ' (' + s.paketNama + ')' : '') + '. Mohon ' + (s.nama || 'anak') + ' agar mempersiapkan diri. Terima kasih.';
    return ui.waLink(s.ortuPhone, msg);
  }
  function waButton(s, when, dayName, dateLabel, timeText) {
    if (!s || !s.ortuPhone) return '';
    return '<a class="icon-btn" title="Pengingat jadwal via WhatsApp ke orang tua" href="' + ui.attr(waReminderLink(s, when, dayName, dateLabel, timeText)) + '" target="_blank" rel="noopener">' + ui.icon('message', 15) + '</a>';
  }

  /* =====================================================
     DASHBOARD PENGAJAR
     ===================================================== */
  V.dashboard = async function (ctx) {
    var data = await call('guru.dashboard');
    var st = data.stats;
    var slips = data.salaries || [];
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
        '<p>Absensi tercatat ' + st.hadirHariIni + ' sesi. ' + (st.belumAbsen ? st.belumAbsen + ' sesi belum diabsen hari ini.' : 'Semua sesi hari ini sudah diabsen.') + '</p>' +
        '<div class="welcome-actions">' +
          '<a class="btn btn-sun btn-sm" href="#/guru/absensi" data-route>' + ui.icon('camera', 14) + ' Mulai absensi</a>' +
          '<a class="btn btn-sm" style="background:rgba(255,255,255,.1);color:#fff" href="#/guru/harian" data-route>' + ui.icon('pencil', 14) + ' Isi laporan</a>' +
        '</div></div>' +
        '<div class="welcome-art">' + ui.icon('graduation', 46) + '<span class="orbit"></span></div>' +
      '</div>';

    html += '<div class="stat-grid">' +
      ui.stat('child', 'Anak bimbingan', ui.angka(st.siswa), { hint: st.jadwalHariIni + ' sesi hari ini', tone: 'blue' }) +
      ui.stat('checkCircle', 'Hadir hari ini', ui.angka(st.hadirHariIni), { hint: st.belumAbsen + ' belum absen' }) +
      ui.stat('clipboard', 'Laporan hari ini', ui.angka(st.laporanHariIni), { hint: 'dari ' + st.jadwalHariIni + ' sesi' }) +
      ui.stat('banknote', 'Honor bulan ini', ui.rupiah(st.gajiBulan), { hint: 'dari paket yang LPMB-nya ACC', tone: 'amber' }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>' + (todayStudents.length ? 'Agenda hari ini' : 'Anak bimbingan') + '</h2><p>Status absensi dan laporan sesi hari ini.</p></div><a class="link-btn" href="#/guru/absensi" data-route>Buka absensi</a></div><div class="card-body">' +
        (agenda.length ? agenda.map(function (s) {
          var sessions = s.hariIni ? daySlots(s, data.hariIni) : [];
          var items = sessions.length ? sessions.map(function (sl) {
            var rec = (s.absensiHariIni || []).filter(function (a) { return String(a.slotId || '') === String(sl.slotId || ''); })[0] || null;
            var rep = (s.laporanHariIni || []).filter(function (r) { return String(r.slotId || '') === String(sl.slotId || ''); })[0] || null;
            return { slot: sl, att: rec, rep: rep };
          }) : [{ slot: null, att: s.absensi || null, rep: s.laporan || null }];
          return items.map(function (it) {
            var times = it.slot ? it.slot.jamMulai + '–' + it.slot.jamSelesai : '';
            return '<div class="list-row"><div class="person-cell">' + S.photo(s.fotoUrl, s.nama, 'sm') +
              '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.paketNama || '') + ' · ' + ui.esc(times ? data.hariIni + ', ' + times : (s.jadwalTeks || 'Jadwal belum diatur')) + '</span>' +
                (s.sesiPaket ? '<span class="cell-sub">Sesi ' + Number(s.sesiHadir || 0) + '/' + Number(s.sesiPaket) + (Number(s.sesiSisa || 0) ? ' · kurang ' + Number(s.sesiSisa || 0) + ' pertemuan' : ' · selesai') + '</span>' : '') + '</div></div>' +
              '<div class="list-end list-actions">' +
                (times ? ui.badge(times, 'teal') : '') +
                (it.att ? ui.statusBadge(it.att.status) : ui.badge('Belum absen', 'gray')) +
                (it.rep ? ui.badge('Laporan siap', 'teal') : ui.badge('Belum laporan', 'gray')) +
                (hasHome(s) ? '<button type="button" class="icon-btn" data-home="' + ui.attr(s.enrollmentId) + '" title="Lokasi rumah">' + ui.icon('home', 16) + '</button>' : '') +
                (s.hariIni ? '<a class="btn btn-outline btn-sm" href="#/guru/absensi?enrollment=' + ui.attr(s.enrollmentId) + (it.slot ? '&slot=' + ui.attr(it.slot.slotId) : '') + '" data-route>' + (it.att ? 'Perbarui' : 'Absen') + '</a>' : '') +
                '<a class="btn btn-ghost btn-sm" href="#/guru/harian?enrollment=' + ui.attr(s.enrollmentId) + (it.slot ? '&slot=' + ui.attr(it.slot.slotId) : '') + '" data-route>' + (it.rep ? 'Laporan' : 'Isi laporan') + '</a>' +
              '</div></div>';
          }).join('');
        }).join('') : ui.empty('users', 'Belum ada siswa', 'Admin belum menautkan siswa ke jadwal Anda.')) +
      '</div></section>' +

      '<section class="card"><div class="card-head"><div><h2>Laporan terbaru</h2><p>Ringkasan aktivitas belajar yang Anda input.</p></div><a class="link-btn" href="#/guru/harian" data-route>Semua laporan</a></div><div class="card-body">' +
        (data.recentReports.length ? '<div class="grid grid-2">' + data.recentReports.slice(0, 2).map(function (r) { return S.reportCard(r); }).join('') + '</div>' : ui.empty('clipboard', 'Belum ada laporan', 'Laporan yang Anda isi akan tampil di sini.')) +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Rapor menunggu ACC</h2><p>Rapor yang sudah diajukan ke admin.</p></div></div><div class="card-body">' +
        (data.lpmbPending.length ? data.lpmbPending.map(function (l) {
          return '<div class="list-row">' + S.photo(l.anakFoto, l.anakNama, 'sm') +
            '<div class="list-main"><b>' + ui.esc(l.anakNama) + '</b><span>' + ui.esc(ui.periodeLabel(l.periode) + (l.paketNama ? ' · ' + l.paketNama : '')) + '</span></div>' +
            '<div class="list-end">' + ui.statusBadge(l.status) + '</div></div>';
        }).join('') : ui.empty('checkCircle', 'Tidak ada antrean', 'Rapor yang diajukan akan muncul di sini.')) +
      '</div></section>' +
      '<section class="card salary-slips-card"><div class="card-head"><div><h2>Kehadiran bulan ini</h2></div></div><div class="card-body">' +
        '<div class="info-list">' + S.infoItem('Sesi hadir', st.hadirBulan + ' sesi') + S.infoItem('Periode', ui.periodeLabel(data.periode)) +
          S.infoItem('Paket ACC', st.lpmbDisetujui + ' paket') + S.infoItem('Honor berjalan', ui.rupiah(st.gajiBulan)) + '</div>' +
        '<div class="note-box mt-16">Slip gaji dibuat admin per paket belajar: honor sebesar harga paket masuk slip setelah rapor LPMB anak disetujui. Setiap anak yang sudah ACC dapat dibayar tanpa menunggu anak lain; hubungi admin bila ada paket atau ACC yang belum tercatat.</div>' +
        '<div class="section-head-sm" style="margin-top:18px"><h3>Slip gaji 12 bulan</h3></div>' +
        (slips.length ? '<div class="stack-sm">' + slips.map(function (s) {
          var paid = s.status === 'dibayar';
          return '<div class="list-row">' +
            '<div class="list-main"><b>' + ui.esc(s.paketNama || ui.periodeLabel(s.periode)) + '</b><span>' + ui.esc((s.anakNama ? s.anakNama + ' · ' : '') + ui.periodeLabel(s.periode)) + ' · ' + ui.rupiah(s.total) + '</span></div>' +
            '<div class="list-end list-actions">' +
              (paid ? ui.badge('Dibayar ' + ui.tanggal(s.tanggalBayar, 'short'), 'green') : ui.badge('Belum dibayar', 'gray')) +
              '<button type="button" class="btn btn-outline btn-sm" data-slip-dl="' + ui.attr(s.id) + '" title="Unduh slip (simpan sebagai PDF)">' + ui.icon('download', 13) + ' Unduh</button>' +
            '</div></div>';
        }).join('') + '</div>' : '<p class="small text-muted">Belum ada slip gaji dalam 12 bulan terakhir.</p>') +
      '</div></section>' +
    '</div></div>';

    function slipDownloadHTML(s) {
      var b = data.bimbel || {};
      var items = s.rincian && Array.isArray(s.rincian.approved) ? s.rincian.approved : [];
      var nama = data.teacher.nama || '';
      var paketCount = s.jumlahPaket != null ? s.jumlahPaket : items.length;
      return '<div class="slip-doc">' +
        '<div class="slip-head"><div class="slip-brand">' +
          '<div class="rapor-logo">' + (b.logoUrl ? '<img src="' + ui.attr(b.logoUrl) + '" alt="Logo" />' : '<img src="' + CONFIG.LOGO_URL + '" alt="Logo Bimba" />') + '</div>' +
          '<div><h1>' + ui.esc(b.nama || 'Bimba Matahari Kecil') + '</h1><p>' + ui.esc(b.alamat || '') + '</p><p>' + ui.esc(b.phone || '') + '</p></div>' +
        '</div><div class="slip-title"><h2>Slip Gaji</h2><p>No. ' + ui.esc(s.slipNo || '—') + '</p><p>Periode ' + ui.esc(ui.periodeLabel(s.periode)) + '</p></div></div>' +
        '<div class="slip-meta">' +
          '<div><span>Nama pengajar</span><b>' + ui.esc(nama) + '</b></div>' +
          '<div><span>Spesialisasi</span><b>' + ui.esc(data.teacher.spesialisasi || '—') + '</b></div>' +
          (s.paketNama
            ? '<div><span>Anak</span><b>' + ui.esc(s.anakNama || '—') + '</b></div><div><span>Paket</span><b>' + ui.esc(s.paketNama) + '</b></div>'
            : '<div><span>Paket belajar (ACC)</span><b>' + paketCount + ' paket</b></div>') +
          '<div><span>Status</span><b>' + (s.status === 'dibayar' ? 'Sudah dibayar' : 'Belum dibayar') + '</b></div>' +
        '</div>' +
        '<table class="slip-table"><thead><tr><th>Komponen</th><th>Keterangan</th><th style="text-align:right">Jumlah</th></tr></thead><tbody>' +
          '<tr><td>Honor paket belajar</td><td>' + ui.esc(s.paketNama || (paketCount + ' paket disetujui')) + '</td><td class="num">' + ui.rupiah(s.honor != null ? s.honor : 0) + '</td></tr>' +
          '<tr><td>Bonus</td><td>' + ui.esc(s.catatan || '—') + '</td><td class="num">' + ui.rupiah(s.bonus) + '</td></tr>' +
          '<tr><td>Potongan</td><td>—</td><td class="num">-' + ui.rupiah(s.potongan) + '</td></tr>' +
        '</tbody></table>' +
        (items.length ? '<div class="slip-subhead">Rincian paket belajar yang disetujui</div>' +
          '<table class="slip-table"><thead><tr><th>Anak</th><th>Paket</th><th style="width:70px;text-align:center">Sesi</th><th style="width:110px;text-align:right">Harga paket</th></tr></thead><tbody>' +
          items.map(function (it) {
            var amount = it.subtotal != null ? Number(it.subtotal) : (Number(it.sesiHadir || 0) * Number(it.tarif || 0));
            return '<tr><td>' + ui.esc(it.anakNama || 'Anak') + '</td><td>' + ui.esc(it.paketNama || 'Paket belajar') + '</td>' +
              '<td class="num" style="text-align:center">' + Number(it.sesiHadir || 0) + (it.sesiPaket ? '/' + Number(it.sesiPaket) : '') + '</td><td class="num">' + ui.rupiah(amount) + '</td></tr>';
          }).join('') + '</tbody></table>' : '') +
        '<div class="slip-total"><div class="slip-total-inner"><span>Total diterima</span><b>' + ui.rupiah(s.total) + '</b></div></div>' +
        '<div class="slip-sign">' +
          '<div><div class="sign-space"></div><div class="sign-name">Admin Bimba</div></div>' +
          '<div><div class="sign-space">' + (s.status === 'dibayar' ? '<span style="font-size:8pt">Dibayar ' + ui.esc(ui.tanggal(s.tanggalBayar)) + '</span>' : '') + '</div><div class="sign-name">' + ui.esc(nama) + '</div></div>' +
        '</div>' +
        '<div class="slip-note">Slip ini dibuat otomatis oleh sistem Bimba Matahari Kecil. Status: ' + (s.status === 'dibayar' ? 'Sudah dibayar' : 'Belum dibayar') + '.</div>' +
      '</div>';
    }

    return {
      html: html,
      mount: function (root) {
        S.bindMedia(root);
        root.addEventListener('click', function (e) {
          var dl = e.target.closest('[data-slip-dl]');
          if (dl) {
            var slip = slips.filter(function (x) { return String(x.id) === dl.getAttribute('data-slip-dl'); })[0];
            if (slip) {
              ui.printHTML(slipDownloadHTML(slip));
              ui.toast('Pilih "Simpan sebagai PDF" pada dialog cetak untuk mengunduh slip.', 'info', 6000);
            }
            return;
          }
          var b = e.target.closest('[data-home]');
          if (!b) return;
          var s = studentById(data.students, b.getAttribute('data-home'), 'enrollmentId');
          if (s) S.homeModal(s);
        });
      }
    };
  };

  /* =====================================================
     ABSENSI SISWA
     ===================================================== */
  V.absensi = async function (ctx) {
    var res = await Promise.all([
      call('guru.students'),
      call('absensi.list', { periode: ui.periodeNow() })
    ]);
    var students = studentsWithToday(res[0]);
    var todayStudents = students.filter(function (s) { return s.hariIni; });
    var hariIni = dayAt(0);
    var besok = dayAt(1);
    var lusa = dayAt(2);
    var besokStudents = students.filter(function (s) { return studentOnDay(s, besok.name); });
    var lusaStudents = students.filter(function (s) { return studentOnDay(s, lusa.name); });
    var attendance = res[1].attendance || [];
    var today = todayIso();
    var teacherArea = (res[0].teacher && res[0].teacher.area) || (ctx.user && ctx.user.area) || '';

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Absensi siswa',
      subtitle: 'Ambil foto absensi langsung dari kamera dengan cap GPS, waktu, dan peta lokasi. Catatan tersimpan otomatis ke Google Sheets.',
      actions: '<a class="btn btn-outline" href="#/guru/harian" data-route>' + ui.icon('clipboard', 15) + ' Laporan harian</a>'
    });
    html += '<div class="alert alert-info mb-16">' + ui.icon('camera', 16) + '<span>Status <b>Hadir</b> membutuhkan foto. Gunakan kamera GPS Map agar foto otomatis memuat tanggal, jam, koordinat, dan peta lokasi. Jika kamera tidak tersedia, foto dapat diunggah dari galeri.</span></div>';

    html += '<section class="card"><div class="card-head"><div><h2>Absensi hari ini</h2><p>' + ui.esc(ui.todayLong()) + ' · ' + sessionCountFor(todayStudents, hariIni.name) + ' sesi terjadwal</p></div><span class="badge badge-teal">' + ui.icon('calendar', 11) + ' ' + ui.esc(today) + '</span></div><div class="card-body" id="todayAttendance"></div></section>';

    html += '<section class="card mt-16"><div class="card-head"><div><h2>Besok</h2><p>' + ui.esc(besok.label) + ' · ' + sessionCountFor(besokStudents, besok.name) + ' sesi terjadwal</p></div><span class="badge badge-gray">' + ui.icon('calendar', 11) + ' ' + ui.esc(besok.iso) + '</span></div><div class="card-body" id="besokAttendance"></div></section>';

    html += '<section class="card mt-16"><div class="card-head"><div><h2>Lusa</h2><p>' + ui.esc(lusa.label) + ' · ' + sessionCountFor(lusaStudents, lusa.name) + ' sesi terjadwal</p></div><span class="badge badge-gray">' + ui.icon('calendar', 11) + ' ' + ui.esc(lusa.iso) + '</span></div><div class="card-body" id="lusaAttendance"></div></section>';

    html += '<section class="card mt-16"><div class="card-head"><div><h2>Riwayat absensi</h2><p>Catatan bulan ' + ui.esc(ui.periodeLabel(ui.periodeNow())) + '.</p></div></div><div class="card-body">' +
      (attendance.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Anak</th><th>Tanggal</th><th>Status</th><th>Jam</th><th>Catatan</th><th></th></tr></thead><tbody id="attendanceRows"></tbody></table></div>' : ui.empty('camera', 'Belum ada riwayat', 'Absensi yang dicatat akan tampil di sini.')) +
    '</div></section>';

    return {
      html: html,
      mount: function (root) {
        drawToday();
        drawFuture('besokAttendance', besokStudents, 'besok', besok.name, besok.label);
        drawFuture('lusaAttendance', lusaStudents, 'lusa', lusa.name, lusa.label);
        drawHistory();

        var prefill = ctx.params && ctx.params.enrollment;
        if (prefill) {
          var s = studentById(students, prefill, 'enrollmentId');
          var slotParam = (ctx.params && ctx.params.slot) || '';
          ctx.params.enrollment = '';
          ctx.params.slot = '';
          if (s && s.hariIni) {
            var picks = todaySessions().filter(function (x) { return String(x.s.enrollmentId) === String(s.enrollmentId); });
            var pick = (slotParam && picks.filter(function (x) { return String(x.slot.slotId) === String(slotParam); })[0]) ||
              picks.filter(function (x) { return !x.att; })[0] || picks[0];
            if (pick) openAbsen(pick.s, pick.att, pick.slot);
          } else if (s) ui.toast('Absensi hanya bisa diisi pada hari jadwal anak (' + (s.jadwalTeks || 'jadwal belum diatur') + ').', 'error', 6000);
        }

        function todaySessions() {
          var list = [];
          todayStudents.forEach(function (s) {
            var recs = s.absensiHariIni || [];
            daySlots(s, hariIni.name).forEach(function (sl) {
              var rec = recs.filter(function (a) { return String(a.slotId || '') === String(sl.slotId || ''); })[0] || null;
              list.push({ s: s, slot: sl, att: rec });
            });
          });
          return list;
        }

        function slotTime(sl) { return sl.jamMulai + '–' + sl.jamSelesai; }

        function drawFuture(boxId, list, mode, dayName, dateLabel) {
          var box = root.querySelector('#' + boxId);
          if (!list.length) { box.innerHTML = ui.empty('calendar', 'Tidak ada sesi', 'Tidak ada siswa yang terjadwal pada hari tersebut.'); return; }
          box.innerHTML = list.map(function (s) {
            var times = slotTimesOnDay(s, dayName) || 'jadwal belum diatur';
            return '<div class="attendance-row">' +
              '<div class="person-cell">' + S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.paketNama || '') + ' · ' + ui.esc(dayName + ', ' + times) + '</span></div></div>' +
              '<div class="att-actions">' +
                ui.badge(dayName, 'teal') +
                ui.badge('Terjadwal', 'gray') +
                (hasHome(s) ? '<button type="button" class="icon-btn" data-home="' + ui.attr(s.enrollmentId) + '" title="Lokasi rumah">' + ui.icon('home', 15) + '</button>' : '') +
                waButton(s, mode, dayName, dateLabel, times) +
                '<button type="button" class="btn btn-outline btn-sm" disabled title="Absensi hanya bisa diisi pada hari jadwal">' + ui.icon('clock', 13) + ' Bisa absen ' + mode + '</button>' +
              '</div></div>';
          }).join('');
        }

        function drawToday() {
          var box = root.querySelector('#todayAttendance');
          if (!students.length) { box.innerHTML = ui.empty('users', 'Belum ada siswa', 'Admin belum menautkan siswa ke jadwal Anda.'); return; }
          var list = todaySessions();
          if (!list.length) { box.innerHTML = ui.empty('calendar', 'Tidak ada sesi hari ini', 'Absensi hanya tersedia pada hari jadwal siswa. Daftar sesi hari ini muncul otomatis sesuai jadwal.'); return; }
          box.innerHTML = list.map(function (item) {
            var s = item.s, sl = item.slot, a = item.att;
            var times = slotTime(sl);
            return '<div class="attendance-row">' +
              '<div class="person-cell">' + S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(s.paketNama || '') + ' · ' + ui.esc(hariIni.name + ', ' + times) + '</span></div></div>' +
              '<div class="att-actions">' +
                ui.badge(times, 'teal') +
                (a ? ui.statusBadge(a.status) : ui.badge('Belum absen', 'gray')) +
                (a && a.fotoUrl ? '<button type="button" class="icon-btn" data-view-photo="' + ui.attr(a.id) + '" title="Foto absensi">' + ui.icon('image', 15) + '</button>' : '') +
                (hasHome(s) ? '<button type="button" class="icon-btn" data-home="' + ui.attr(s.enrollmentId) + '" title="Lokasi rumah">' + ui.icon('home', 15) + '</button>' : '') +
                waButton(s, 'hari ini', hariIni.name, hariIni.label, times) +
                '<button type="button" class="btn ' + (a ? 'btn-outline' : 'btn-primary') + ' btn-sm" data-absen="' + ui.attr(s.enrollmentId) + '" data-slot="' + ui.attr(sl.slotId || '') + '">' + (a ? 'Perbarui' : ui.icon('camera', 13) + ' Absen') + '</button>' +
              '</div></div>';
          }).join('');
        }

        function drawHistory() {
          var body = root.querySelector('#attendanceRows');
          if (!body) return;
          var list = attendance.slice(0, 60);
          if (!list.length) return;
          body.innerHTML = list.map(function (a) {
            var st = studentById(students, a.enrollmentId, 'enrollmentId');
            return '<tr><td><div class="person-cell">' + S.photo(a.anakFoto, a.anakNama, 'sm') + '<div class="pc-info"><b>' + ui.esc(a.anakNama) + '</b><span>' + ui.esc(a.paketNama || '') + '</span></div></div></td>' +
              '<td><b class="cell-strong">' + ui.esc(ui.tanggal(a.tanggal, 'short')) + '</b><span class="cell-sub">' + ui.esc(a.jadwalTeks || '') + '</span></td>' +
              '<td>' + ui.statusBadge(a.status) + '</td>' +
              '<td>' + ui.esc(a.jam || '—') + '</td>' +
              '<td class="small">' + ui.esc(a.catatan || '—') + '</td>' +
              '<td><div class="cell-actions">' + (a.fotoUrl ? '<button type="button" class="icon-btn" data-view-photo="' + ui.attr(a.id) + '" title="Foto">' + ui.icon('image', 15) + '</button>' : '') +
                (a.tanggal === today && st && st.hariIni ? '<button type="button" class="icon-btn" data-edit-att="' + ui.attr(a.id) + '" title="Edit absensi">' + ui.icon('pencil', 15) + '</button>' : '') + '</div></td></tr>';
          }).join('');
        }

        root.addEventListener('click', function (e) {
          var homeBtn = e.target.closest('[data-home]');
          if (homeBtn) {
            var hs = studentById(students, homeBtn.getAttribute('data-home'), 'enrollmentId');
            if (hs) S.homeModal(hs);
            return;
          }
          var btn = e.target.closest('[data-absen]');
          if (btn) {
            var eid = btn.getAttribute('data-absen');
            var sid = btn.getAttribute('data-slot') || '';
            var pick = todaySessions().filter(function (x) { return String(x.s.enrollmentId) === String(eid) && String(x.slot.slotId || '') === String(sid); })[0];
            if (pick) openAbsen(pick.s, pick.att, pick.slot);
            return;
          }
          var editBtn = e.target.closest('[data-edit-att]');
          if (editBtn) {
            var rec = attendance.filter(function (x) { return x.id === editBtn.getAttribute('data-edit-att'); })[0];
            var st = rec ? studentById(students, rec.enrollmentId, 'enrollmentId') : null;
            if (st) {
              var sl = null;
              if (rec.slotId) {
                sl = (st.slots || []).filter(function (x) { return String(x.slotId) === String(rec.slotId); })[0] || null;
              } else if (rec.tanggal === today) {
                sl = daySlots(st, hariIni.name)[0] || null;
              }
              openAbsen(st, rec, sl);
            } else ui.toast('Data siswa untuk absensi ini tidak ditemukan.', 'error');
            return;
          }
          var photoBtn = e.target.closest('[data-view-photo]');
          if (photoBtn) {
            var a = attendance.filter(function (x) { return x.id === photoBtn.getAttribute('data-view-photo'); })[0];
            if (a) S.photoModal(a.fotoUrl, [['Tanggal', ui.tanggal(a.tanggal)], ['Status', statusLabel(a.status)], ['Jam', a.jam], ['Catatan', a.catatan || '—']]);
          }
        });

        function openAbsen(s, existing, slot) {
          var gps = null, gpsPromise = null, stream = null, liveTimer = null, captured = '';
          var sesiTeks = slot ? (slot.hari + ', ' + slot.jamMulai + '–' + slot.jamSelesai) : (s.jadwalTeks || 'Jadwal belum diatur');
          ui.modal({
            title: existing ? 'Perbarui absensi' : 'Absensi siswa',
            subtitle: s.nama + ' · ' + sesiTeks,
            size: 'lg',
            body: '<form id="absentForm"><div class="form-grid">' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Status <span class="req">*</span></label><select class="select" name="status">' +
                  C.STATUS_ABSEN.map(function (st) { return '<option value="' + st.value + '"' + (existing && existing.status === st.value ? ' selected' : '') + '>' + st.label + '</option>'; }).join('') + '</select></div>' +
                '<div class="field"><label>Tanggal (hari ini)</label><input class="input" type="date" max="' + ui.attr(today) + '" value="' + ui.attr(today) + '" disabled title="Absensi hanya bisa diisi pada hari jadwal anak" /></div>' +
              '</div>' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Jam</label><select class="select" name="jam">' + S.time24Options(existing ? existing.jam : (slot ? slot.jamMulai : timeNow())) + '</select></div>' +
                '<div class="field"><label>Keterangan</label><input class="input" name="catatan" placeholder="Materi atau alasan izin/sakit." value="' + ui.attr(existing ? existing.catatan : '') + '" /></div>' +
              '</div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('camera', 14) + ' Kamera GPS Map</div>' +
                '<div class="gps-cam" id="attCamWrap">' +
                  '<video id="attCamVideo" playsinline autoplay muted></video>' +
                  '<canvas id="attShotCanvas" style="display:none"></canvas>' +
                  '<img id="attShotPreview" alt="Hasil foto absensi" style="display:none" />' +
                  '<div class="gps-cam-empty" id="attCamEmpty">' + ui.icon('camera', 28) + '<span>Kamera belum aktif. Tekan <b>Aktifkan kamera</b> untuk memotret dengan cap tanggal, jam, koordinat GPS, dan peta lokasi.</span></div>' +
                  '<div class="gps-cam-overlay" id="attCamOverlay" style="display:none">' +
                    '<div class="gcl-map"><img id="attLiveMapImg" alt="Peta lokasi" /><span class="gcl-pin">' + ui.icon('mapPin', 16) + '</span></div>' +
                    '<div class="gcl-info"><b class="gcl-brand">BIMBA MATAHARI KECIL</b><span id="attLiveTime">—</span><span id="attLiveGps">Mengambil GPS…</span><span id="attLiveArea">Area: ' + ui.esc(teacherArea || 'belum diatur') + '</span></div>' +
                  '</div>' +
                '</div>' +
                '<div class="row mt-12" style="gap:8px;flex-wrap:wrap">' +
                  '<button type="button" class="btn btn-outline btn-sm" id="attCamStart">' + ui.icon('camera', 14) + ' Aktifkan kamera</button>' +
                  '<button type="button" class="btn btn-primary btn-sm" id="attCamShoot" disabled>' + ui.icon('camera', 14) + ' Ambil foto</button>' +
                  '<button type="button" class="btn btn-outline btn-sm" id="attCamRetake" style="display:none">' + ui.icon('refresh', 14) + ' Ambil ulang</button>' +
                  '<button type="button" class="btn btn-ghost btn-sm" id="attCamStop" disabled>Hentikan</button>' +
                '</div>' +
                '<div class="hint" id="attCamHint">Foto hasil kamera otomatis diberi cap tanggal, jam, koordinat, dan peta lokasi. Jika kamera tidak tersedia, gunakan unggah foto di bawah.</div>' +
              '</div>' +
              '<div class="field"><label>Unggah foto dari galeri (opsional)</label>' + S.uploadTile('attPhoto', { existing: existing ? existing.fotoUrl : '', icon: 'image', title: 'Pilih foto absensi', hint: 'Wajib untuk status hadir bila kamera tidak digunakan.' }) + '</div>' +
              '<div class="note-box">Status <b>Hadir</b> wajib memiliki foto. Status izin, sakit, atau alpha tetap dapat dicatat tanpa foto.</div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="attSave">' + ui.icon('check', 15) + ' Simpan absensi</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#absentForm');
              var video = el.querySelector('#attCamVideo');
              var canvas = el.querySelector('#attShotCanvas');
              var preview = el.querySelector('#attShotPreview');
              var empty = el.querySelector('#attCamEmpty');
              var overlay = el.querySelector('#attCamOverlay');
              var liveMap = el.querySelector('#attLiveMapImg');
              var liveTime = el.querySelector('#attLiveTime');
              var liveGps = el.querySelector('#attLiveGps');
              var hint = el.querySelector('#attCamHint');
              var startBtn = el.querySelector('#attCamStart');
              var shootBtn = el.querySelector('#attCamShoot');
              var retakeBtn = el.querySelector('#attCamRetake');
              var stopBtn = el.querySelector('#attCamStop');

              liveTimer = setInterval(paintClock, 1000);
              paintClock();
              if (existing && existing.fotoUrl) {
                preview.src = existing.fotoUrl;
                preview.style.display = 'block';
                empty.style.display = 'none';
                hint.textContent = 'Foto absensi tersimpan ditampilkan. Aktifkan kamera untuk mengambil foto baru.';
              }
              var photoInput = el.querySelector('#attPhoto');
              if (photoInput) photoInput.addEventListener('change', function () {
                if (photoInput.files && photoInput.files[0]) {
                  captured = '';
                  retakeBtn.style.display = 'none';
                  if (stream) { video.style.display = 'block'; overlay.style.display = 'flex'; shootBtn.disabled = false; }
                  preview.style.display = 'none';
                }
              });

              function paintClock() {
                var now = new Date();
                try {
                  liveTime.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
                    ' · ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');
                } catch (e) { liveTime.textContent = now.toLocaleString(); }
              }
              function paintGps() {
                if (!gps) { liveGps.textContent = 'GPS belum tersedia'; return; }
                liveGps.textContent = gps.lat.toFixed(6) + ', ' + gps.lng.toFixed(6) + (gps.accuracy ? ' · ±' + gps.accuracy + ' m' : '');
                liveMap.src = tileUrl(gps, 16);
              }
              function ensureGps() {
                if (gps) return Promise.resolve(gps);
                if (!gpsPromise) {
                  gpsPromise = ui.geolocate().then(function (pos) {
                    gps = pos; paintGps(); return pos;
                  }).catch(function (err) {
                    gpsPromise = null; liveGps.textContent = err.message; return null;
                  });
                }
                return gpsPromise;
              }
              function setCamButtons(active) {
                startBtn.disabled = active;
                stopBtn.disabled = !active;
                shootBtn.disabled = !active;
              }
              function stopStream() {
                if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
                stream = null;
                video.srcObject = null;
              }
              function showVideo() {
                preview.style.display = 'none';
                video.style.display = 'block';
                overlay.style.display = 'flex';
                empty.style.display = 'none';
                retakeBtn.style.display = 'none';
                captured = '';
                shootBtn.disabled = false;
                setCamButtons(true);
              }
              function showCaptured(url) {
                captured = url;
                preview.src = url;
                preview.style.display = 'block';
                video.style.display = 'none';
                overlay.style.display = 'none';
                empty.style.display = 'none';
                retakeBtn.style.display = '';
                shootBtn.disabled = true;
                startBtn.disabled = !!stream;
                stopBtn.disabled = !stream;
              }
              function showExistingOrEmpty() {
                retakeBtn.style.display = 'none';
                shootBtn.disabled = true;
                startBtn.disabled = false;
                stopBtn.disabled = true;
                if (existing && existing.fotoUrl) {
                  preview.src = existing.fotoUrl;
                  preview.style.display = 'block';
                  empty.style.display = 'none';
                } else {
                  preview.style.display = 'none';
                  empty.style.display = 'flex';
                }
                video.style.display = 'none';
                overlay.style.display = 'none';
              }

              startBtn.onclick = async function () {
                var btn = this;
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                  hint.textContent = 'Kamera tidak didukung browser ini. Silakan unggah foto dari galeri.';
                  ui.toast('Kamera tidak tersedia pada perangkat/browser ini.', 'info', 5000);
                  return;
                }
                ui.busy(btn, true, 'Menyiapkan…');
                ensureGps();
                try {
                  stopStream();
                  stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
                    audio: false
                  });
                  video.srcObject = stream;
                  try { await video.play(); } catch (e) { /* autoplay muted */ }
                  showVideo();
                  hint.textContent = 'Kamera aktif. Arahkan ke kegiatan belajar, lalu tekan Ambil foto.';
                } catch (err) {
                  hint.textContent = 'Izin kamera ditolak atau kamera tidak tersedia. Gunakan unggah foto dari galeri.';
                  ui.toast('Kamera tidak dapat diakses. Periksa izin kamera pada browser.', 'error', 6000);
                  showExistingOrEmpty();
                }
                ui.busy(btn, false);
                btn.disabled = !!stream;
              };

              shootBtn.onclick = async function () {
                var btn = this;
                ui.busy(btn, true, 'Memproses…');
                try {
                  var pos = await ensureGps();
                  captured = await composeShot(pos);
                  showCaptured(captured);
                  hint.textContent = pos ? 'Foto kamera siap dengan cap GPS dan peta lokasi.' : 'Foto siap, tetapi koordinat GPS tidak tersedia.';
                  ui.toast(pos ? 'Foto absensi berhasil diambil.' : 'Foto diambil tanpa koordinat GPS.', pos ? 'success' : 'info', 5000);
                } catch (err) {
                  ui.toast(err.message, 'error', 6000);
                }
                ui.busy(btn, false);
                shootBtn.disabled = !!captured;
              };

              retakeBtn.onclick = function () {
                if (!stream) { startBtn.click(); return; }
                showVideo();
                hint.textContent = 'Silakan ambil ulang foto.';
              };

              stopBtn.onclick = function () {
                stopStream();
                hint.textContent = 'Kamera dihentikan.';
                if (captured) showCaptured(captured);
                else showExistingOrEmpty();
              };

              async function composeShot(pos) {
                var vw = video.videoWidth || 0, vh = video.videoHeight || 0;
                if (!vw || !vh) throw new Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
                var W = Math.min(1280, vw), H = Math.round(vh * W / vw);
                canvas.width = W; canvas.height = H;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, W, H);
                var tile = pos ? await loadTile(pos) : null;
                drawStamp(ctx, W, H, pos, tile);
                try {
                  return canvas.toDataURL('image/jpeg', 0.88);
                } catch (e) {
                  var c2 = document.createElement('canvas');
                  c2.width = W; c2.height = H;
                  var x2 = c2.getContext('2d');
                  x2.drawImage(video, 0, 0, W, H);
                  drawStamp(x2, W, H, pos, null);
                  return c2.toDataURL('image/jpeg', 0.88);
                }
              }

              function drawStamp(ctx, W, H, pos, tile) {
                var pad = Math.round(W * 0.028);
                var panelH = Math.min(240, Math.max(124, Math.round(H * 0.24)));
                var panelW = W - pad * 2;
                var py = H - pad - panelH;
                var inner = Math.round(panelH * 0.12);
                var barW = Math.max(4, Math.round(panelW * 0.007));
                rr(ctx, pad, py, panelW, panelH, Math.round(panelH * 0.07));
                ctx.fillStyle = 'rgba(6, 30, 25, 0.87)';
                ctx.fill();
                ctx.fillStyle = '#6ee7b7';
                rr(ctx, pad, py, barW, panelH, Math.round(barW / 2));
                ctx.fill();

                var mapH = panelH - inner * 2;
                var mapW = Math.min(Math.round(panelW * 0.3), Math.round(mapH * 1.35));
                var mx = pad + panelW - inner - mapW;
                var my = py + inner;
                ctx.save();
                rr(ctx, mx, my, mapW, mapH, Math.round(mapH * 0.08));
                ctx.clip();
                if (tile) {
                  ctx.drawImage(tile, mx, my, mapW, mapH);
                } else {
                  ctx.fillStyle = '#1b4238'; ctx.fillRect(mx, my, mapW, mapH);
                  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
                  for (var gx = mx + 12; gx < mx + mapW; gx += 22) { ctx.beginPath(); ctx.moveTo(gx, my); ctx.lineTo(gx, my + mapH); ctx.stroke(); }
                  for (var gy = my + 12; gy < my + mapH; gy += 22) { ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx + mapW, gy); ctx.stroke(); }
                }
                var pcx = mx + mapW / 2, pcy = my + mapH / 2;
                ctx.beginPath(); ctx.arc(pcx, pcy + 2, 10, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
                ctx.beginPath(); ctx.arc(pcx, pcy, 8, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill();
                ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.font = '9px system-ui, sans-serif';
                ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
                ctx.fillText('© OpenStreetMap', mx + mapW - 5, my + mapH - 4);
                ctx.restore();
                ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
                rr(ctx, mx, my, mapW, mapH, Math.round(mapH * 0.08)); ctx.stroke();

                var tx = pad + inner + barW + inner * 0.5;
                var maxTW = mx - tx - inner;
                var brandSize = Math.max(12, Math.round(panelH * 0.1));
                var lineSize = Math.max(11, Math.round(panelH * 0.092));
                var y = py + inner;
                ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                ctx.fillStyle = '#a7f3d0';
                ctx.font = '700 ' + brandSize + 'px system-ui, sans-serif';
                ctx.fillText('BIMBA MATAHARI KECIL', tx, y, maxTW);
                y += brandSize * 1.45;
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 ' + lineSize + 'px system-ui, sans-serif';
                ctx.fillText(stampClock(), tx, y, maxTW);
                y += lineSize * 1.5;
                ctx.fillStyle = '#d1fae5';
                ctx.font = lineSize + 'px system-ui, sans-serif';
                ctx.fillText(pos ? pos.lat.toFixed(6) + ', ' + pos.lng.toFixed(6) + (pos.accuracy ? '  ±' + pos.accuracy + ' m' : '') : 'Koordinat GPS tidak tersedia', tx, y, maxTW);
                y += lineSize * 1.5;
                ctx.fillStyle = '#a7f3d0';
                ctx.font = lineSize + 'px system-ui, sans-serif';
                ctx.fillText('Area: ' + (teacherArea || 'belum diatur'), tx, y, maxTW);
              }

              function stampClock() {
                var d = new Date();
                try {
                  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
                    ' · ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:/g, '.');
                } catch (e) { return d.toLocaleString(); }
              }

              el.querySelector('#attSave').onclick = async function () {
                var btn = this;
                var d = ui.serialize(form);
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  var foto = captured || await S.uploadValue('attPhoto', existing ? existing.fotoUrl : '');
                  if (d.status === 'hadir' && !foto) { ui.busy(btn, false); ui.toast('Foto absensi wajib diambil atau diunggah untuk status hadir.', 'error'); return; }
                  await call('absensi.save', {
                    enrollmentId: s.enrollmentId, slotId: slot ? slot.slotId : '', tanggal: today, status: d.status, jam: d.jam,
                    foto: foto, catatan: d.catatan
                  });
                  close();
                  ui.toast('Absensi ' + s.nama + ' tersimpan.', 'success');
                  BMK.app.navigate('#/guru/absensi', true);
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 6000); }
              };

              function onCloseCleanup() {
                if (liveTimer) clearInterval(liveTimer);
                stopStream();
              }
              var origClose = close;
              el.addEventListener('click', function (ev) { if (ev.target.closest('[data-close]') || ev.target.closest('.modal-x')) onCloseCleanup(); });
              el.addEventListener('mousedown', function (ev) { if (ev.target.classList.contains('modal-backdrop')) onCloseCleanup(); });
              // onMount close is used by save; ensure tracks are released after save too
              close = function () { onCloseCleanup(); origClose(); };
              el.querySelector('[data-close]').onclick = close;
            }
          });
        }

        function tileUrl(pos, z) {
          var n = Math.pow(2, z);
          var x = Math.floor((pos.lng + 180) / 360 * n);
          var latR = pos.lat * Math.PI / 180;
          var y = Math.floor((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n);
          return 'https://tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png';
        }
        function loadTile(pos) {
          return new Promise(function (resolve) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            var done = false;
            var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 5000);
            img.onload = function () { if (done) return; done = true; clearTimeout(timer); resolve(img); };
            img.onerror = function () { if (done) return; done = true; clearTimeout(timer); resolve(null); };
            img.src = tileUrl(pos, 16);
          });
        }
        function rr(ctx, x, y, w, h, r) {
          r = Math.min(r, w / 2, h / 2);
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + w, y, x + w, y + h, r);
          ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r);
          ctx.arcTo(x, y, x + w, y, r);
          ctx.closePath();
        }
      }
    };
  };

  /* =====================================================
     LAPORAN HARIAN
     ===================================================== */
  V.harian = async function (ctx) {
    var res = await Promise.all([call('guru.students'), call('harian.list')]);
    var students = studentsWithToday(res[0]);
    var todayStudents = students.filter(function (s) { return s.hariIni; });
    var todaySessionsCount = sessionCountFor(todayStudents, dayAt(0).name);
    var reports = res[1].reports || [];
    var today = todayIso();
    var hariIni = dayAt(0);

    var reportsByEnrollment = {};
    reports.forEach(function (r) {
      if (r.tanggal !== today) return;
      var key = String(r.enrollmentId);
      (reportsByEnrollment[key] = reportsByEnrollment[key] || []).push(r);
    });
    function reportForSlot(s, sl, isFirst) {
      var recs = reportsByEnrollment[String(s.enrollmentId)] || [];
      return recs.filter(function (r) {
        var sid = String(r.slotId || '');
        return sid ? sid === String(sl.slotId || '') : isFirst;
      })[0] || null;
    }
    function todaySessionList() {
      var list = [];
      todayStudents.forEach(function (s) {
        daySlots(s, hariIni.name).forEach(function (sl, i) {
          list.push({ s: s, slot: sl, rep: reportForSlot(s, sl, i === 0) });
        });
      });
      return list;
    }
    var filledToday = todaySessionList().filter(function (x) { return !!x.rep; }).length;

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Laporan hasil harian',
      subtitle: 'Isi materi, capaian, dokumentasi foto/video, dan paraf digital setiap sesi.',
      actions: '<button type="button" class="btn btn-primary" id="newReport">' + ui.icon('plus', 15) + ' Tulis laporan</button>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('users', 'Anak bimbingan', String(students.length), { hint: 'aktif' }) +
      ui.stat('clipboard', 'Laporan hari ini', String(filledToday), { tone: 'blue', hint: Math.max(0, todaySessionsCount - filledToday) + ' sesi belum diisi' }) +
      ui.stat('file', 'Total laporan', String(reports.length), { hint: 'seluruh periode' }) +
      ui.stat('calendar', 'Hari ini', ui.todayLong(), { hint: 'tanggal input' }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Sesi hari ini</h2><p>' + todaySessionsCount + ' sesi terjadwal · ' + todayStudents.length + ' anak. Laporan yang sudah diisi dapat diperbarui pada hari yang sama.</p></div></div><div class="card-body" id="studentSessions"></div></section>' +
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
          var slotParam = (ctx.params && ctx.params.slot) || '';
          var s = studentById(students, prefill, 'enrollmentId');
          ctx.params.enrollment = '';
          ctx.params.slot = '';
          if (s && s.hariIni) {
            var picks = todaySessionList().filter(function (x) { return String(x.s.enrollmentId) === String(s.enrollmentId); });
            var pick = (slotParam && picks.filter(function (x) { return String(x.slot.slotId) === String(slotParam); })[0]) ||
              picks.filter(function (x) { return !x.rep; })[0] || picks[0];
            if (pick) openReport(pick.s, pick.slot, pick.rep);
          } else if (s) ui.toast('Laporan sesi hanya bisa diisi pada hari jadwal siswa (' + (s.jadwalTeks || 'jadwal belum diatur') + ').', 'error', 6000);
        }

        function drawSessions() {
          var box = root.querySelector('#studentSessions');
          if (!students.length) { box.innerHTML = ui.empty('users', 'Belum ada siswa', 'Admin belum menautkan siswa ke jadwal Anda.'); return; }
          var list = todaySessionList();
          if (!list.length) { box.innerHTML = ui.empty('calendar', 'Tidak ada sesi hari ini', 'Laporan harian hanya ditampilkan untuk siswa yang terjadwal hari ini.'); return; }
          box.innerHTML = '<div class="grid grid-2">' + list.map(function (item) {
            var s = item.s, sl = item.slot, r = item.rep;
            var times = sl.jamMulai + '–' + sl.jamSelesai;
            return '<div class="slip-card"><div class="slip-top"><div class="person-cell">' + S.photo(s.fotoUrl, s.nama, 'sm') +
                '<div class="pc-info"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc((sl.hari || hariIni.name) + ', ' + times) + '</span></div></div>' +
                (r ? ui.badge('Sudah diisi', 'green') : ui.badge('Belum diisi', 'gray')) + '</div>' +
              '<div class="small text-muted">' + ui.esc(s.paketNama || '') + '</div>' +
              '<div class="row mt-12" style="gap:6px;flex-wrap:wrap">' +
                '<button type="button" class="btn ' + (r ? 'btn-outline' : 'btn-primary') + ' btn-sm" data-write="' + ui.attr(s.enrollmentId) + '" data-slot="' + ui.attr(sl.slotId || '') + '">' + ui.icon(r ? 'pencil' : 'plus', 13) + ' ' + (r ? 'Perbarui laporan' : 'Isi laporan') + '</button>' +
              '</div></div>';
          }).join('') + '</div>';
        }

        function drawGrid() {
          var box = root.querySelector('#reportGrid');
          var filter = root.querySelector('#reportStudent').value;
          var list = reports.filter(function (r) { return !filter || String(r.anakId) === filter; });
          if (!list.length) { box.innerHTML = ui.empty('clipboard', 'Belum ada laporan', 'Laporan yang diisi akan tampil di sini beserta dokumentasinya.'); return; }
          box.innerHTML = '<div class="grid grid-2">' + list.slice(0, 8).map(function (r) {
            return S.reportCard(r, { action: '<button type="button" class="btn btn-outline btn-sm" data-edit-report="' + ui.attr(r.id) + '">' + ui.icon('pencil', 13) + ' Edit</button>' });
          }).join('') + '</div>';
          S.bindMedia(box);
        }

        root.addEventListener('click', function (e) {
          var edit = e.target.closest('[data-edit-report]');
          if (edit) {
            var rec = reports.filter(function (x) { return x.id === edit.getAttribute('data-edit-report'); })[0];
            var st = rec ? studentById(students, rec.enrollmentId, 'enrollmentId') : null;
            if (st) {
              var esl = null;
              if (rec.slotId) esl = (st.slots || []).filter(function (x) { return String(x.slotId) === String(rec.slotId); })[0] || null;
              else if (rec.tanggal === today) esl = daySlots(st, hariIni.name)[0] || null;
              openReport(st, esl, rec);
            } else ui.toast('Data siswa untuk laporan ini tidak ditemukan.', 'error');
            return;
          }
          var b = e.target.closest('[data-write]');
          if (!b) return;
          var eid = b.getAttribute('data-write');
          var sid = b.getAttribute('data-slot') || '';
          var pick = todaySessionList().filter(function (x) { return String(x.s.enrollmentId) === String(eid) && String(x.slot.slotId || '') === sid; })[0];
          if (pick) openReport(pick.s, pick.slot, pick.rep);
        });

        function pickStudent() {
          if (!students.length) { ui.toast('Belum ada siswa bimbingan.', 'info'); return; }
          var list = todaySessionList();
          if (!list.length) { ui.toast('Tidak ada sesi jadwal hari ini.', 'info'); return; }
          ui.modal({
            title: 'Pilih sesi',
            subtitle: 'Satu laporan untuk setiap sesi jadwal hari ini.',
            size: 'md',
            body: '<div class="stack-sm">' + list.map(function (item) {
              var s = item.s, sl = item.slot;
              return '<button type="button" class="list-row" data-pick="' + ui.attr(s.enrollmentId) + '" data-pick-slot="' + ui.attr(sl.slotId || '') + '" style="width:100%;background:none;border:0;text-align:left;cursor:pointer">' +
                S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="list-main"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc((sl.hari || hariIni.name) + ', ' + sl.jamMulai + '–' + sl.jamSelesai + (item.rep ? ' · sudah diisi' : '')) + '</span></div>' +
                '<div class="list-end">' + iconArrow() + '</div></button>';
            }).join('') + '</div>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              el.addEventListener('click', function (ev) {
                var b = ev.target.closest('[data-pick]');
                if (!b) return;
                var eid = b.getAttribute('data-pick');
                var sid = b.getAttribute('data-pick-slot') || '';
                var pick = todaySessionList().filter(function (x) { return String(x.s.enrollmentId) === String(eid) && String(x.slot.slotId || '') === sid; })[0];
                close();
                if (pick) openReport(pick.s, pick.slot, pick.rep);
              });
            }
          });
        }
        function iconArrow() { return ui.icon('chevronRight', 16); }

        function openReport(s, slot, existing) {
          var sesiTeks = slot ? (slot.hari + ', ' + slot.jamMulai + '–' + slot.jamSelesai) : (s.jadwalTeks || 'Jadwal belum diatur');
          ui.modal({
            title: existing ? 'Perbarui laporan harian' : 'Laporan hasil harian',
            subtitle: s.nama + ' · ' + sesiTeks,
            size: 'xl',
            body: '<form id="dailyForm"><div class="form-grid">' +
              '<div class="form-grid two">' +
                '<div class="field"><label>Tanggal <span class="req">*</span></label><input class="input" type="date" name="tanggal" max="' + ui.attr(today) + '" value="' + ui.attr(existing ? existing.tanggal : today) + '"' + (slot ? ' disabled title="Laporan milik sesi ' + ui.attr(sesiTeks) + '"' : '') + ' /></div>' +
                '<div class="field"><label>Anak</label><input class="input" value="' + ui.attr(s.nama + ' · ' + (s.paketNama || '')) + '" disabled /></div>' +
              '</div>' +
              '<div class="field"><label>Materi pembelajaran <span class="req">*</span></label><textarea class="textarea" name="materi" placeholder="Contoh: Membaca suku kata ba-bi-bu, berhitung penjumlahan 1–10.">' + ui.esc(existing ? existing.materi : '') + '</textarea></div>' +
              '<div class="field"><label>Capaian belajar <span class="req">*</span></label><textarea class="textarea" name="capaian" placeholder="Jelaskan perkembangan dan capaian anak pada sesi ini.">' + ui.esc(existing ? existing.capaian : '') + '</textarea></div>' +
              '<div class="field"><label>Catatan tambahan</label><textarea class="textarea" name="catatan" placeholder="Catatan untuk orang tua (opsional).">' + ui.esc(existing ? existing.catatan : '') + '</textarea></div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('image', 14) + ' Foto kegiatan (maks 3)</div><div class="grid grid-3">' +
                S.uploadTile('dailyPhoto1', { existing: existing && existing.fotoUrls ? existing.fotoUrls[0] : '', icon: 'camera', title: 'Foto 1', hint: 'Galeri atau kamera, otomatis dikompres' }) +
                S.uploadTile('dailyPhoto2', { existing: existing && existing.fotoUrls ? existing.fotoUrls[1] : '', icon: 'camera', title: 'Foto 2', hint: 'Galeri atau kamera, otomatis dikompres' }) +
                S.uploadTile('dailyPhoto3', { existing: existing && existing.fotoUrls ? existing.fotoUrls[2] : '', icon: 'camera', title: 'Foto 3', hint: 'Galeri atau kamera, otomatis dikompres' }) +
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
                    enrollmentId: s.enrollmentId, slotId: slot ? slot.slotId : ((existing && existing.slotId) || ''),
                    tanggal: slot ? today : (d.tanggal || today), materi: d.materi, capaian: d.capaian,
                    catatan: d.catatan, foto: foto, video: video, paraf: paraf
                  });
                  close();
                  ui.toast('Laporan ' + s.nama + (slot ? ' (' + slot.jamMulai + '–' + slot.jamSelesai + ')' : '') + ' disimpan.', 'success');
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
    var hasCandidates = !!(res[0].filters && Array.isArray(res[0].filters.children));
    var students = hasCandidates ? res[0].filters.children : (res[1].students || []);
    var enriched = students.map(function (s) {
      var full = studentById(res[1].students, s.id);
      return Object.assign({}, full || {}, s);
    });
    rows.forEach(function (r) {
      if (studentById(enriched, r.anakId)) return;
      enriched.push({ id: r.anakId, nama: r.anakNama, fotoUrl: r.anakFoto, kelas: r.kelas, sekolah: r.sekolah, selesai: false });
    });
    var currentPeriod = ui.periodeNow();
    var today = todayIso();

    var html = ui.pageHead({
      eyebrow: 'Pembelajaran',
      title: 'Rapor LPMB',
      subtitle: 'Susun nilai aspek perkembangan. Rapor yang diajukan akan ditinjau dan ditandatangani admin.',
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
              '<td><b class="cell-strong">' + ui.esc(ui.periodeLabel(r.periode)) + '</b>' + (r.paketNama ? '<span class="cell-sub">' + ui.esc(r.paketNama) + '</span>' : '') + '</td>' +
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
            var s = (r.enrollmentId ? enriched.filter(function (x) { return String(x.enrollmentId || '') === String(r.enrollmentId); })[0] : null) ||
              studentById(enriched, r.anakId) || { id: r.anakId, nama: r.anakNama };
            s = Object.assign({}, s, { enrollmentId: r.enrollmentId || s.enrollmentId || '', paketNama: r.paketNama || s.paketNama || '' });
            openEditor(s, r);
          }
        });

        function rowForCandidate(s) {
          if (s.lpmbId) { var byId = rows.filter(function (r) { return r.id === s.lpmbId; })[0]; if (byId) return byId; }
          if (s.enrollmentId) return rows.filter(function (r) { return String(r.enrollmentId || '') === String(s.enrollmentId); })[0] || null;
          return null;
        }

        function pickStudent() {
          var eligible = hasCandidates ? enriched.filter(function (s) { return s.selesai === true; }) : enriched.slice();
          if (!eligible.length) { ui.toast('Belum ada paket selesai yang menunggu rapor.', 'info', 5000); return; }
          ui.modal({
            title: 'Pilih paket selesai',
            subtitle: 'Satu paket belajar yang selesai dibuatkan satu rapor baru.',
            size: 'md',
            body: '<div class="stack-sm">' + eligible.map(function (s) {
              var cur = rowForCandidate(s);
              var meta = [s.paketNama, s.sesiPaket ? (s.sesiHadir || 0) + '/' + s.sesiPaket + ' sesi' : '', s.jadwalTeks].filter(Boolean).join(' · ') || 'Jadwal belum diatur';
              return '<button type="button" class="list-row" data-pick="' + ui.attr(s.enrollmentId || s.id) + '" style="width:100%;background:none;border:0;text-align:left;cursor:pointer">' +
                S.photo(s.fotoUrl, s.nama, 'sm') + '<div class="list-main"><b>' + ui.esc(s.nama) + '</b><span>' + ui.esc(meta) + '</span></div>' +
                '<div class="list-end">' + (cur ? ui.statusBadge(cur.status) : ui.badge('Belum ada', 'gray')) + '</div></button>';
            }).join('') + '</div>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              el.addEventListener('click', function (ev) {
                var b = ev.target.closest('[data-pick]');
                if (!b) return;
                var key = b.getAttribute('data-pick');
                var s = eligible.filter(function (x) { return String(x.enrollmentId || x.id) === key; })[0];
                close();
                if (!s) return;
                var cur = rowForCandidate(s);
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

        function extraAspects(nilai) {
          var x = nilai && nilai.__extra;
          return Array.isArray(x) ? x : [];
        }

        function extraRowHtml(x) {
          x = x || {};
          var v = x.nilai != null && x.nilai !== '' ? Number(x.nilai) : null;
          return '<div class="aspect-row extra-aspect">' +
            '<div class="aspect-label-cell"><div class="aspect-label-main">' +
              '<input class="input aspect-label-input" data-extra-label maxlength="60" placeholder="Nama aspek tambahan" value="' + ui.attr(x.label || '') + '" />' +
              '<span class="aspect-err"></span></div>' +
              '<button type="button" class="icon-btn danger" data-extra-remove title="Hapus aspek">' + ui.icon('x', 14) + '</button>' +
            '</div>' +
            '<div class="score-input">' +
              '<input class="input" type="number" min="0" max="100" data-extra-value placeholder="0–100" value="' + ui.attr(v == null ? '' : v) + '" />' +
              '<span class="pred">' + (v == null ? '—' : ui.predikat(v).label) + '</span>' +
            '</div></div>';
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
              '<div class="form-section"><div class="form-section-title">' + ui.icon('chart', 14) + ' Nilai aspek perkembangan</div>' +
                '<div class="aspect-head"><span>Aspek perkembangan</span><span class="aspect-vals"><span>Nilai</span><span>Predikat</span></span></div>' +
                scoreRowsHtml(existing ? existing.nilai : null) +
                '<div id="lpmbExtraRows">' + extraAspects(existing ? existing.nilai : null).map(extraRowHtml).join('') + '</div>' +
                '<div class="extra-tools"><button type="button" class="btn btn-outline btn-sm" id="lpmbAddAspect">' + ui.icon('plus', 13) + ' Tambah aspek lain</button><span class="small text-muted">Opsional — aspek utama di atas wajib diisi.</span></div>' +
              '</div>' +
              '<div class="field"><label>Catatan perkembangan <span class="req">*</span></label><textarea class="textarea" name="catatan" placeholder="Ringkasan perkembangan anak selama periode ini (minimal 5 karakter).">' + ui.esc(existing ? existing.catatan : '') + '</textarea></div>' +
              '<div class="field"><label>Rekomendasi untuk orang tua</label><textarea class="textarea" name="rekomendasi" placeholder="Saran latihan di rumah, target periode berikutnya.">' + ui.esc(existing ? existing.rekomendasi : '') + '</textarea></div>' +
              S.signaturePanel('lpmbParaf', existing ? existing.parafGuruUrl : (ctx.user.ttdUrl || ''), 'Paraf digital pengajar') +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-outline" id="lpmbDraft">Simpan draft</button><button type="button" class="btn btn-primary" id="lpmbSubmit">' + ui.icon('send', 14) + ' Ajukan ke admin</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#lpmbForm');
              var pad = ui.signaturePad(el.querySelector('#lpmbParaf'));
              function bindScoreInputs(scope) {
                Array.prototype.forEach.call(scope.querySelectorAll('.score-input input'), function (inp) {
                  if (inp.__scoreBound) return;
                  inp.__scoreBound = true;
                  inp.addEventListener('input', function () {
                    var p = ui.predikat(this.value);
                    var span = this.parentNode.querySelector('.pred');
                    if (span) span.textContent = this.value === '' ? '—' : p.label;
                  });
                });
              }
              bindScoreInputs(form);
              var extraBox = el.querySelector('#lpmbExtraRows');
              el.querySelector('#lpmbAddAspect').onclick = function () {
                extraBox.insertAdjacentHTML('beforeend', extraRowHtml(null));
                var rows = extraBox.querySelectorAll('.extra-aspect');
                var last = rows[rows.length - 1];
                bindScoreInputs(last);
                var labelInp = last.querySelector('[data-extra-label]');
                if (labelInp) labelInp.focus();
              };
              extraBox.addEventListener('click', function (ev) {
                var rm = ev.target.closest('[data-extra-remove]');
                if (rm) rm.closest('.extra-aspect').remove();
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
                var extras = [];
                var extraBad = false;
                Array.prototype.forEach.call(form.querySelectorAll('.extra-aspect'), function (row) {
                  var labelEl = row.querySelector('[data-extra-label]');
                  var valEl = row.querySelector('[data-extra-value]');
                  var errEl = row.querySelector('.aspect-err');
                  var label = String(labelEl.value || '').trim();
                  var raw = String(valEl.value || '').trim();
                  errEl.style.display = 'none';
                  errEl.textContent = '';
                  if (!label && !raw) return;
                  var msg = '';
                  if (!label) msg = 'Isi nama aspek tambahan.';
                  else if (!raw) msg = 'Isi nilainya (0–100).';
                  else {
                    var nv = Number(raw);
                    if (!isFinite(nv) || nv < 0 || nv > 100) msg = 'Nilai harus 0–100.';
                  }
                  if (msg) { errEl.textContent = msg; errEl.style.display = 'block'; extraBad = true; return; }
                  extras.push({ label: label, nilai: Math.round(Number(raw)) });
                });
                if (extraBad) return;
                if (!d.catatan || d.catatan.length < 5) { ui.fieldError(form, 'catatan', 'Catatan perkembangan minimal 5 karakter.'); return; }
                if (!d.periode) { ui.toast('Pilih periode rapor.', 'error'); return; }
                ui.busy(btn, true, 'Menyimpan…');
                try {
                  var paraf = pad.isEmpty() ? (existing ? existing.parafGuruUrl : (ctx.user.ttdUrl || '')) : pad.toDataURL();
                  await call('lpmb.save', {
                    anakId: s.id, enrollmentId: s.enrollmentId || '', lpmbId: existing ? existing.id : '',
                    periode: d.periode, tanggal: d.tanggal, nilai: nilai, aspekTambahan: extras,
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
            subtitle: ui.periodeLabel(r.periode) + (r.paketNama ? ' · ' + r.paketNama : '') + ' · rata-rata ' + avg + ' (' + p.label + ')',
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
      ui.stat('banknote', 'Paket ACC', String(st.lpmbDisetujui) + ' paket', { hint: 'LPMB disetujui admin' }) +
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
          '<div class="form-grid two">' +
            '<div class="field"><label>Spesialisasi</label><input class="input" name="spesialisasi" value="' + ui.attr(teacher.spesialisasi) + '" placeholder="Contoh: Calistung, Matematika SD" /></div>' +
            '<div class="field"><label>Area lokasi mengajar <span class="req">*</span></label><input class="input" name="area" value="' + ui.attr(teacher.areas && teacher.areas.length ? teacher.areas.join('; ') : (teacher.area || '')) + '" placeholder="Contoh: Sukamaju; Cibiru" /><div class="hint">Bisa lebih dari satu area — pisahkan dengan titik koma (;).</div></div>' +
          '</div>' +
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
        '<div class="info-list">' + S.infoItem('Username', '@' + user.username) + S.infoItem('Area lokasi', teacher.area || 'Belum diatur') +
          S.infoItem('Bergabung', ui.tanggal(teacher.createdAt, 'short')) +
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
          if (!d.area) { ui.fieldError(form, 'area', 'Area lokasi mengajar wajib diisi.'); return; }
          var btn = root.querySelector('#teacherSave');
          ui.busy(btn, true, 'Menyimpan…');
          try {
            var r = await call('guru.profile', {
              nama: d.nama, phone: d.phone, email: d.email, spesialisasi: d.spesialisasi,
              area: d.area, alamat: d.alamat,
              foto: await S.uploadValue('teacherProfilePhoto', teacher.fotoUrl),
              ttd: await S.uploadValue('teacherProfileTtd', teacher.ttdUrl)
            });
            BMK.app.patchUser({ nama: r.user.nama, phone: r.user.phone, email: r.user.email, area: r.user.area, fotoUrl: r.user.fotoUrl, ttdUrl: r.user.ttdUrl });
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

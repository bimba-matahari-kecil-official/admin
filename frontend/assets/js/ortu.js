(function () {
  window.BMK = window.BMK || {};
  BMK.views = BMK.views || {};
  var V = BMK.views.ortu = {};
  var ui = BMK.ui;
  var api = BMK.api;
  var S = BMK.shared;
  var C = BMK.const;

  function call(action, data) { return api.call(action, data); }
  function firstName(name) { return String(name || 'Orang Tua').trim().split(/\s+/)[0]; }
  function activeChildId(ctx) { return (ctx.params && ctx.params.anak) || BMK.store.activeChild() || ''; }

  async function resolveChild(ctx) {
    var pref = activeChildId(ctx);
    var res = await call('ortu.children');
    var list = res.children || [];
    var id = '';
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(pref)) { id = String(list[i].id); break; }
    }
    if (!id && list.length) id = String(list[0].id);
    if (id) BMK.store.setActiveChild(id);
    return { children: list, menus: res.menus || [], id: id };
  }

  function childSwitchHTML(children, active) {
    if (!children || children.length < 2) return '';
    return '<select class="select" id="childSwitch" aria-label="Pilih anak" style="min-width:170px">' +
      children.map(function (c) {
        return '<option value="' + ui.attr(c.id) + '"' + (String(c.id) === String(active) ? ' selected' : '') + '>' + ui.esc(c.nama) + '</option>';
      }).join('') + '</select>';
  }

  function bindChildSwitch(root, ctx, fallback) {
    var el = root.querySelector('#childSwitch');
    if (!el) {
      if (fallback) BMK.store.setActiveChild(fallback);
      return;
    }
    var id = fallback || activeChildId(ctx) || '';
    el.value = id;
    el.onchange = function () {
      BMK.store.setActiveChild(this.value);
      BMK.app.navigate('#/ortu/' + ctx.key + '?anak=' + encodeURIComponent(this.value), true);
    };
  }

  function statusAbsen(value) {
    var s = (C.STATUS_ABSEN || []).filter(function (x) { return x.value === value; })[0];
    return s ? s.label : (value || '—');
  }

  function avgScore(nilai) {
    var keys = C.ASPECTS.map(function (a) { return a.key; });
    var vals = keys.map(function (k) { return Number(nilai && nilai[k]); }).filter(function (v) { return isFinite(v) && v > 0; });
    if (!vals.length) return 0;
    return Math.round(vals.reduce(function (s, v) { return s + v; }, 0) / vals.length);
  }

  /* =====================================================
     DASHBOARD ORANG TUA
     ===================================================== */
  V.dashboard = async function (ctx) {
    var data = await call('dashboard.ortu', { anakId: activeChildId(ctx) });
    if (data.activeChildId) BMK.store.setActiveChild(data.activeChildId);
    if (!data.children.length) {
      return {
        html: ui.pageHead({ eyebrow: 'Dashboard', title: 'Selamat datang, ' + firstName(ctx.user.nama), subtitle: 'Pantau perkembangan belajar anak dalam satu tempat.' }) +
          '<div class="card"><div class="card-body">' + ui.empty('baby', 'Belum ada data anak', 'Data anak akan muncul setelah proses pendaftaran selesai.', '<a class="btn btn-primary" href="#/ortu/pengaturan" data-route>Lengkapi data</a>') + '</div></div>'
      };
    }
    var ov = data.overview;
    var child = ov.child;
    var enr = ov.enrollment;
    var unpaid = data.unpaid || [];
    var next = ov.nextSchedule;

    var html = ui.pageHead({
      eyebrow: 'Dashboard · ' + ui.periodeLabel(ui.periodeNow()),
      title: 'Selamat datang, ' + firstName(ctx.user.nama),
      subtitle: 'Perkembangan ' + child.nama + ' terpantau rapi di sini.',
      actions: childSwitchHTML(data.children, data.activeChildId) +
        '<a class="btn btn-outline" href="#/ortu/lpmb" data-route>' + ui.icon('award', 15) + ' Rapor LPMB</a>'
    });

    if (ov.unpaidCount) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('wallet', 16) + '<span><b>' + ov.unpaidCount + ' tagihan belum lunas</b> total ' + ui.rupiah(ov.unpaidTotal) + '. <a class="bold" href="#/ortu/administrasi" data-route>Selesaikan pembayaran</a></span></div>';
    }

    html += '<div class="welcome-card"><div class="welcome-copy">' +
        '<div class="welcome-kicker">' + ui.icon('sun', 12) + ' ' + ui.esc(child.nama) + ' · ' + ui.esc(child.kelas || 'Anak bimbingan') + '</div>' +
        '<h2>' + (next ? 'Sesi berikutnya ' + ui.esc(next.hari) + ', ' + ui.esc(next.jamMulai) + '–' + ui.esc(next.jamSelesai) : 'Semangat belajar hari ini!') + '</h2>' +
        '<p>' + (enr ? 'Paket ' + ui.esc(enr.paket ? enr.paket.nama : 'belajar') + ' bersama ' + ui.esc(enr.pengajar ? enr.pengajar.nama : 'pengajar') + '. ' : '') +
          'Laporan harian dan rapor dapat dilihat kapan saja melalui menu di samping.</p>' +
        '<div class="welcome-actions">' +
          '<a class="btn btn-sun btn-sm" href="#/ortu/harian" data-route>' + ui.icon('clipboard', 14) + ' Hasil belajar</a>' +
          '<a class="btn btn-sm" style="background:rgba(255,255,255,.1);color:#fff" href="#/ortu/administrasi" data-route>' + ui.icon('wallet', 14) + ' Administrasi</a>' +
        '</div></div>' +
        '<div class="welcome-art">' + S.photo(child.fotoUrl, child.nama, 'xl') + '<span class="orbit"></span></div>' +
      '</div>';

    html += '<div class="stat-grid">' +
      ui.stat('checkCircle', 'Hadir bulan ini', ui.angka(ov.attendanceMonth.hadir), { hint: 'dari ' + ov.attendanceMonth.total + ' catatan', tone: 'blue' }) +
      ui.stat('clipboard', 'Laporan bulan ini', ui.angka(ov.reportsMonth), { hint: 'aktivitas belajar' }) +
      ui.stat('wallet', 'Tagihan belum lunas', ui.rupiah(ov.unpaidTotal), { hint: ov.unpaidCount + ' tagihan', tone: ov.unpaidCount ? 'amber' : 'dark' }) +
      ui.stat('calendar', 'Jadwal berikutnya', next ? next.hari : '—', { hint: next ? ui.tanggal(next.tanggal, 'short') + ' · ' + next.jamMulai : 'belum diatur' }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Hasil belajar terbaru</h2><p>Materi, capaian, dan dokumentasi dari pengajar.</p></div><a class="link-btn" href="#/ortu/harian" data-route>Semua hasil</a></div><div class="card-body" id="homeReports">' +
        (data.reports.length ? '<div class="grid grid-2">' + data.reports.slice(0, 4).map(function (r) { return S.reportCard(r); }).join('') + '</div>' : ui.empty('clipboard', 'Belum ada laporan', 'Laporan harian akan tampil setelah pengajar mengisi sesi belajar.')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Kehadiran terbaru</h2><p>Absensi disertai foto dan lokasi.</p></div></div><div class="card-body">' +
        (data.attendance.length ? data.attendance.map(function (a) {
          return '<div class="list-row">' + (a.fotoUrl ? '<button type="button" class="avatar avatar-md" data-home-photo="' + ui.attr(a.id) + '" style="border:0;padding:0;overflow:hidden;background:#0f1614"><img src="' + ui.attr(a.fotoUrl) + '" alt="Foto absensi" /></button>' : '<span class="avatar avatar-md avatar-text">' + ui.esc((a.anakNama || 'A').charAt(0)) + '</span>') +
            '<div class="list-main"><b>' + ui.esc(ui.tanggal(a.tanggal, 'long')) + '</b><span>' + ui.esc(a.jam || '—') + (a.jarakMeter != null ? ' · ' + a.jarakMeter + ' m' : '') + '</span></div>' +
            '<div class="list-end">' + ui.statusBadge(a.status) + '</div></div>';
        }).join('') : ui.empty('mapPin', 'Belum ada absensi', 'Catatan kehadiran akan tampil di sini.')) +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Paket belajar</h2></div><a class="link-btn" href="#/ortu/administrasi" data-route>Detail</a></div><div class="card-body">' +
        (enr ? '<div class="info-list">' + S.infoItem('Paket', enr.paket ? enr.paket.nama : '—') +
            S.infoItem('Jadwal', enr.jadwalTeks || '—') + S.infoItem('Pengajar', enr.pengajar ? enr.pengajar.nama : '—') +
            S.infoItem('Biaya', enr.paket ? ui.rupiah(enr.paket.harga) + ' / bulan' : '—') + '</div>' +
            (next ? '<div class="alert alert-info mt-12">' + ui.icon('calendar', 15) + '<span>Sesi berikutnya <b>' + ui.esc(next.hari + ', ' + next.jamMulai) + '</b> pada ' + ui.esc(ui.tanggal(next.tanggal, 'long')) + '.</span></div>' : '')
          : ui.empty('book', 'Belum terdaftar paket', 'Hubungi admin untuk memilih paket dan jadwal.')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Tagihan</h2></div><a class="link-btn" href="#/ortu/administrasi" data-route>Administrasi</a></div><div class="card-body">' +
        (unpaid.length ? unpaid.slice(0, 4).map(function (b) {
          return '<div class="list-row"><span class="stat-ic" style="width:34px;height:34px;background:var(--amber-soft);color:#8a5a00">' + ui.icon('receipt', 15) + '</span>' +
            '<div class="list-main"><b>' + ui.esc(ui.periodeLabel(b.periode)) + '</b><span>Jatuh tempo ' + ui.esc(ui.tanggal(b.jatuhTempo, 'short')) + '</span></div>' +
            '<div class="list-end"><b class="money">' + ui.rupiah(b.jumlah) + '</b>' + ui.statusBadge(b.status) + '</div></div>';
        }).join('') : '<div class="alert alert-success">' + ui.icon('checkCircle', 16) + '<span>Semua tagihan sudah lunas. Terima kasih.</span></div>') +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Rapor terbaru</h2></div><a class="link-btn" href="#/ortu/lpmb" data-route>Semua rapor</a></div><div class="card-body">' +
        (data.lpmb.length ? data.lpmb.slice(0, 2).map(function (l) {
          return '<div class="list-row"><span class="stat-ic" style="width:34px;height:34px;background:var(--teal-soft);color:var(--teal-dark)">' + ui.icon('award', 15) + '</span>' +
            '<div class="list-main"><b>' + ui.esc(ui.periodeLabel(l.periode)) + '</b><span>' + ui.esc(l.pengajarNama) + '</span></div>' +
            '<div class="list-end">' + ui.statusBadge(l.status) + '</div></div>';
        }).join('') : ui.empty('award', 'Belum ada rapor', 'Rapor tampil setelah disetujui admin.')) +
      '</div></section>' +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        bindChildSwitch(root, ctx, data.activeChildId);
        S.bindMedia(root);
        root.addEventListener('click', function (e) {
          var b = e.target.closest('[data-home-photo]');
          if (!b) return;
          var a = data.attendance.filter(function (x) { return x.id === b.getAttribute('data-home-photo'); })[0];
          if (a) S.photoModal(a.fotoUrl, [['Tanggal', ui.tanggal(a.tanggal)], ['Status', statusAbsen(a.status)], ['Jam', a.jam], ['Catatan', a.catatan || '—']]);
        });
      }
    };
  };

  /* =====================================================
     ADMINISTRASI (TAGIHAN & PAKET)
     ===================================================== */
  V.administrasi = async function (ctx) {
    var info = await resolveChild(ctx);
    var active = info.id;
    var data = await call('ortu.bills', active ? { anakId: active } : {});
    var children = info.children.length ? info.children : (data.children || []);
    var activeChild = children.filter(function (c) { return String(c.id) === String(active); })[0];
    var bills = data.bills || [];
    var enrollments = (data.enrollments || []).filter(function (e) { return !active || String(e.anakId) === String(active); });
    var sm = data.summary || { total: 0, paid: 0, outstanding: 0 };

    var html = ui.pageHead({
      eyebrow: 'Keuangan',
      title: 'Administrasi',
      subtitle: 'Lihat tagihan, unggah bukti pembayaran, dan cek jadwal paket belajar.',
      actions: childSwitchHTML(children, active) +
        '<a class="btn btn-outline" href="#/ortu/dashboard" data-route>' + ui.icon('dashboard', 15) + ' Dashboard</a>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('receipt', 'Total tagihan', ui.rupiah(sm.total), { hint: bills.length + ' tagihan' }) +
      ui.stat('checkCircle', 'Sudah dibayar', ui.rupiah(sm.paid), { tone: 'dark' }) +
      ui.stat('wallet', 'Perlu dibayar', ui.rupiah(sm.outstanding), { tone: sm.outstanding ? 'red' : '' }) +
      ui.stat('calendar', 'Tahun ajaran', ui.esc(data.bimbel.tahunAjaran || '—'), { hint: data.bimbel.nama }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Tagihan SPP</h2><p>' + (activeChild ? ui.esc(activeChild.nama) : 'Semua anak') + ' · unggah bukti transfer untuk diverifikasi admin.</p></div>' + ui.badge('SPP', 'teal') + '</div><div class="card-body">' +
        (bills.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Periode</th><th>Jatuh tempo</th><th class="num">Jumlah</th><th>Status</th><th></th></tr></thead><tbody id="billRows"></tbody></table></div>' : ui.empty('checkCircle', 'Belum ada tagihan', 'Tagihan bulanan akan muncul di sini setelah admin menerbitkannya.')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Paket & jadwal belajar</h2><p>Informasi paket yang sedang berjalan.</p></div></div><div class="card-body">' +
        (enrollments.length ? enrollments.map(function (e) {
          return '<div class="slip-card mb-12"><div class="slip-top"><div><h3 style="font-size:14px">' + ui.esc(e.paket ? e.paket.nama : 'Paket belajar') + '</h3><span class="small text-muted">' + ui.esc(e.jadwalTeks || 'Jadwal belum diatur') + '</span></div>' + ui.badge('Aktif', 'green') + '</div>' +
            '<div class="info-list">' + S.infoItem('Pengajar', e.pengajar ? e.pengajar.nama : '—') +
              S.infoItem('Sesi per bulan', e.paket ? e.paket.sesiPerBulan + ' sesi' : '—') +
              S.infoItem('Durasi', e.paket ? e.paket.durasiMenit + ' menit' : '—') +
              S.infoItem('Biaya', e.paket ? ui.rupiah(e.paket.harga) + ' / bulan' : '—') +
              S.infoItem('Mulai', e.tanggalMulai ? ui.tanggal(e.tanggalMulai) : '—') + S.infoItem('Status', 'Aktif') + '</div></div>';
        }).join('') : ui.empty('book', 'Belum ada paket aktif', 'Hubungi admin untuk mendaftarkan paket belajar.')) +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Pembayaran</h2></div></div><div class="card-body">' +
        '<div class="info-list">' + S.infoItem('Rekening', data.rekening || 'Hubungi admin') + S.infoItem('Konfirmasi', 'Unggah bukti transfer') + '</div>' +
        '<div class="note-box mt-12">Setelah bukti diunggah, admin akan memverifikasi. Status tagihan berubah menjadi <b>Lunas</b> setelah disetujui.</div>' +
        (data.bimbel.waAdmin ? '<a class="btn btn-outline mt-12" style="width:100%" href="' + ui.attr(ui.waLink(data.bimbel.waAdmin, 'Halo admin ' + data.bimbel.nama + ', saya ingin bertanya tentang pembayaran.')) + '" target="_blank" rel="noopener">' + ui.icon('message', 14) + ' Hubungi admin via WA</a>' : '') +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Bantuan</h2></div></div><div class="card-body">' +
        '<div class="note-box">Pembayaran resmi hanya melalui rekening Bimba. Simpan bukti transfer sampai status tagihan berubah menjadi lunas.</div>' +
      '</div></section>' +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        bindChildSwitch(root, ctx, active);
        drawBills();
        root.addEventListener('click', function (e) {
          var pay = e.target.closest('[data-pay]');
          if (pay) {
            var b = bills.filter(function (x) { return x.id === pay.getAttribute('data-pay'); })[0];
            if (b) openPay(b);
            return;
          }
          var proof = e.target.closest('[data-bill-proof]');
          if (proof) {
            var p = bills.filter(function (x) { return x.id === proof.getAttribute('data-bill-proof'); })[0];
            if (p) proofModal(p);
          }
        });

        function drawBills() {
          var body = root.querySelector('#billRows');
          if (!body) return;
          if (!bills.length) return;
          body.innerHTML = bills.map(function (b) {
            return '<tr><td><b class="cell-strong">' + ui.esc(ui.periodeLabel(b.periode)) + '</b><span class="cell-sub">' + ui.esc(b.anakNama || '') + '</span></td>' +
              '<td>' + ui.esc(ui.tanggal(b.jatuhTempo, 'short')) + '</td>' +
              '<td class="num money">' + ui.rupiah(b.jumlah) + '</td>' +
              '<td>' + ui.statusBadge(b.status) + (b.status === 'ditolak' && b.catatan ? '<span class="cell-sub text-red">' + ui.esc(b.catatan) + '</span>' : '') + '</td>' +
              '<td><div class="cell-actions">' +
                (b.status === 'lunas' ? '' : '<button type="button" class="btn btn-primary btn-sm" data-pay="' + ui.attr(b.id) + '">' + (b.status === 'menunggu_verifikasi' ? 'Ganti bukti' : ui.icon('upload', 13) + ' Bayar') + '</button>') +
                (b.buktiUrl ? '<button type="button" class="btn btn-outline btn-sm" data-bill-proof="' + ui.attr(b.id) + '">' + ui.icon('image', 13) + ' Bukti</button>' : '') +
              '</div></td></tr>';
          }).join('');
        }

        function proofModal(b) {
          ui.modal({
            title: 'Bukti pembayaran',
            subtitle: ui.periodeLabel(b.periode) + ' · ' + ui.rupiah(b.jumlah),
            size: 'lg',
            body: '<div style="border-radius:12px;overflow:hidden;background:#0f1614"><img src="' + ui.attr(b.buktiUrl) + '" alt="Bukti pembayaran" style="width:100%;max-height:66vh;object-fit:contain" /></div>' +
              '<div class="info-list mt-16">' + S.infoItem('Status', b.status) + S.infoItem('Metode', b.metode || '—') +
                S.infoItem('Tanggal bayar', b.tanggalBayar ? ui.tanggal(b.tanggalBayar) : '—') + S.infoItem('Catatan', b.catatan || '—') + '</div>',
            footer: '<button type="button" class="btn btn-primary" data-close>Tutup</button>',
            onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; }
          });
        }

        function openPay(b) {
          ui.modal({
            title: 'Unggah bukti pembayaran',
            subtitle: ui.periodeLabel(b.periode) + ' · ' + ui.rupiah(b.jumlah),
            size: 'md',
            body: '<form id="payForm"><div class="form-grid">' +
              '<div class="info-list">' + S.infoItem('Anak', b.anakNama) + S.infoItem('Jumlah', ui.rupiah(b.jumlah)) +
                S.infoItem('Jatuh tempo', ui.tanggal(b.jatuhTempo)) + S.infoItem('Rekening', data.rekening || 'Hubungi admin') + '</div>' +
              '<div class="field"><label>Metode pembayaran</label><select class="select" name="metode"><option value="transfer">Transfer bank</option><option value="qris">QRIS</option><option value="tunai">Tunai / langsung</option></select></div>' +
              '<div class="field"><label>Foto bukti pembayaran <span class="req">*</span></label>' + S.uploadTile('payProof', { icon: 'camera', title: 'Unggah bukti transfer', hint: 'JPG/PNG, pastikan nominal terbaca' }) + '</div>' +
              '<div class="field"><label>Catatan</label><textarea class="textarea" name="catatan" placeholder="Contoh: transfer dari rekening BCA a.n. ...">' + ui.esc(b.status === 'ditolak' ? '' : (b.catatan || '')) + '</textarea></div>' +
              '<div class="note-box">Jumlah pembayaran harus sesuai tagihan. Bukti akan diverifikasi admin sebelum status berubah menjadi lunas.</div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="paySave">' + ui.icon('send', 14) + ' Kirim bukti</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#payForm');
              el.querySelector('#paySave').onclick = async function () {
                var btn = this;
                var d = ui.serialize(form);
                ui.busy(btn, true, 'Mengunggah…');
                try {
                  var bukti = await S.uploadValue('payProof', '');
                  if (!bukti) { ui.busy(btn, false); ui.toast('Unggah foto bukti pembayaran terlebih dahulu.', 'error'); return; }
                  await call('ortu.bayar', { id: b.id, jumlah: b.jumlah, metode: d.metode, catatan: d.catatan, bukti: bukti });
                  close();
                  ui.toast('Bukti pembayaran terkirim. Menunggu verifikasi admin.', 'success', 6000);
                  ctx.refresh();
                } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 6000); }
              };
            }
          });
        }
      }
    };
  };

  /* =====================================================
     HASIL BELAJAR HARIAN
     ===================================================== */
  V.harian = async function (ctx) {
    var info = await resolveChild(ctx);
    var active = info.id;
    var res = await Promise.all([
      call('ortu.daily', active ? { anakId: active } : {}),
      call('ortu.attendance', active ? { anakId: active } : {})
    ]);
    var reports = res[0].reports || [];
    var children = info.children;
    var attendance = res[1].attendance || [];
    var activeChild = children.filter(function (c) { return String(c.id) === String(active); })[0];
    var periods = Object.keys(reports.reduce(function (acc, r) { acc[String(r.tanggal).slice(0, 7)] = 1; return acc; }, {})).sort().reverse();
    var attByDate = {};
    attendance.forEach(function (a) { if (!attByDate[a.tanggal]) attByDate[a.tanggal] = a; });

    var html = ui.pageHead({
      eyebrow: 'Perkembangan anak',
      title: 'Hasil belajar harian',
      subtitle: 'Materi, capaian, foto absensi, serta dokumentasi foto/video dari pengajar.',
      actions: childSwitchHTML(children, active) + '<a class="btn btn-outline" href="#/ortu/lpmb" data-route>' + ui.icon('award', 15) + ' Rapor LPMB</a>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('clipboard', 'Total laporan', String(reports.length), { hint: activeChild ? activeChild.nama : '' }) +
      ui.stat('calendar', 'Bulan ini', String(reports.filter(function (r) { return String(r.tanggal).slice(0, 7) === ui.periodeNow(); }).length), { tone: 'blue', hint: 'laporan belajar' }) +
      ui.stat('checkCircle', 'Kehadiran', String(attendance.filter(function (a) { return a.status === 'hadir'; }).length), { hint: 'sesi hadir tercatat', tone: 'dark' }) +
      ui.stat('image', 'Dokumentasi', String(reports.reduce(function (n, r) { return n + (r.fotoUrls || []).length + (r.videoUrls || []).length; }, 0)), { hint: 'foto & video' }) +
    '</div>';

    html += '<div class="card mt-16"><div class="card-body">' +
      '<div class="data-toolbar"><div class="filter-row"><select class="select" id="dailyPeriod"><option value="">Semua periode</option>' +
        periods.map(function (p) { return '<option value="' + ui.attr(p) + '">' + ui.esc(ui.periodeLabel(p)) + '</option>'; }).join('') +
      '</select></div><span class="small text-muted">Ditampilkan terbaru lebih dulu.</span></div>' +
      '<div id="dailyList"></div>' +
    '</div></div>';

    html += '<section class="card mt-16"><div class="card-head"><div><h2>Riwayat absensi</h2><p>Foto kehadiran dan catatan pengajar.</p></div></div><div class="card-body">' +
      (attendance.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Status</th><th>Jam</th><th>Lokasi</th><th>Catatan</th><th></th></tr></thead><tbody>' +
        attendance.slice(0, 40).map(function (a) {
          return '<tr><td><b class="cell-strong">' + ui.esc(ui.tanggal(a.tanggal, 'short')) + '</b></td><td>' + ui.statusBadge(a.status) + '</td>' +
            '<td>' + ui.esc(a.jam || '—') + '</td><td>' + (a.jarakMeter != null ? a.jarakMeter + ' m' : (a.lat !== '' && a.lat != null ? 'Tercatat' : '—')) + '</td>' +
            '<td class="small">' + ui.esc(a.catatan || '—') + '</td>' +
            '<td>' + (a.fotoUrl ? '<button type="button" class="btn btn-outline btn-sm" data-att-photo="' + ui.attr(a.id) + '">' + ui.icon('image', 13) + ' Foto</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : ui.empty('mapPin', 'Belum ada absensi', 'Kehadiran akan tercatat setelah pengajar mengisi absensi.')) +
    '</div></section>';

    return {
      html: html,
      mount: function (root) {
        bindChildSwitch(root, ctx, active);
        var filterEl = root.querySelector('#dailyPeriod');
        draw();
        filterEl.onchange = draw;
        root.addEventListener('click', function (e) {
          var p = e.target.closest('[data-att-photo]');
          if (p) {
            var a = attendance.filter(function (x) { return x.id === p.getAttribute('data-att-photo'); })[0];
            if (a) S.photoModal(a.fotoUrl, [['Tanggal', ui.tanggal(a.tanggal)], ['Status', statusAbsen(a.status)], ['Jam', a.jam], ['Jarak', a.jarakMeter != null ? a.jarakMeter + ' meter' : '—'], ['Catatan', a.catatan || '—']]);
          }
        });

        function draw() {
          var box = root.querySelector('#dailyList');
          var p = filterEl.value;
          var list = reports.filter(function (r) { return !p || String(r.tanggal).slice(0, 7) === p; });
          if (!list.length) { box.innerHTML = ui.empty('clipboard', 'Belum ada laporan', 'Laporan belajar harian akan tampil di sini.'); return; }
          box.innerHTML = '<div class="grid grid-2">' + list.map(function (r) { return dailyCard(r, attByDate[r.tanggal]); }).join('') + '</div>';
          S.bindMedia(box);
        }

        function dailyCard(r, att) {
          var photos = S.mediaGrid(r.fotoUrls, 'image');
          var videos = S.mediaGrid(r.videoUrls, 'video');
          var attBlock = '';
          if (att) {
            attBlock = '<div class="list-row mt-12" style="align-items:flex-start">' +
              (att.fotoUrl ? '<a href="' + ui.attr(att.fotoUrl) + '" data-media="image" data-url="' + ui.attr(att.fotoUrl) + '" style="flex:none"><img src="' + ui.attr(att.fotoUrl) + '" alt="Foto absensi" style="width:64px;height:64px;border-radius:9px;object-fit:cover" /></a>' : '<span class="stat-ic" style="width:40px;height:40px;background:var(--green-soft);color:var(--green)">' + ui.icon('check', 16) + '</span>') +
              '<div class="list-main"><b>Absensi · ' + ui.esc(statusAbsen(att.status)) + '</b><span>' + ui.esc(att.jam || '—') + (att.jarakMeter != null ? ' · ' + att.jarakMeter + ' m dari Bimba' : '') + '</span>' +
                (att.catatan ? '<span>' + ui.esc(att.catatan) + '</span>' : '') + '</div>' +
              '<div class="list-end">' + ui.statusBadge(att.status) + '</div></div>';
          }
          return '<article class="report-card"><div class="report-card-head"><div class="person-cell">' + S.photo(r.anakFoto, r.anakNama, 'sm') +
              '<div class="pc-info"><b>' + ui.esc(r.anakNama) + '</b><span>' + ui.esc(r.paketNama || '') + '</span></div></div>' +
              '<span class="badge badge-teal">' + ui.icon('calendar', 11) + ' ' + ui.esc(ui.tanggal(r.tanggal, 'short')) + '</span></div>' +
            '<div class="report-card-body"><div class="report-meta"><span>' + ui.icon('user', 11) + ' ' + ui.esc(r.pengajarNama || '—') + '</span><span>' + ui.icon('clock', 11) + ' ' + ui.esc(r.jadwalTeks || '') + '</span></div>' +
              '<div class="report-text"><b>Materi:</b> ' + ui.esc(r.materi || '—') + '</div>' +
              '<div class="report-text mt-8"><b>Capaian:</b> ' + ui.esc(r.capaian || '—') + '</div>' +
              (r.catatan ? '<div class="report-text mt-8 text-muted"><b>Catatan:</b> ' + ui.esc(r.catatan) + '</div>' : '') +
              photos + videos + attBlock +
            '</div><div class="report-footer"><span>' + ui.icon('clock', 11) + ' ' + ui.esc(ui.tanggalWaktu(r.updatedAt)) + '</span>' +
              (r.parafUrl ? '<img class="paraf-img" src="' + ui.attr(r.parafUrl) + '" alt="Paraf pengajar" />' : '<span>Paraf pengajar</span>') +
            '</div></article>';
        }
      }
    };
  };

  /* =====================================================
     RAPOR LPMB (A4)
     ===================================================== */
  V.lpmb = async function (ctx) {
    var info = await resolveChild(ctx);
    var active = info.id;
    var data = await call('ortu.lpmb', active ? { anakId: active } : {});
    var children = info.children;
    var rows = data.lpmb || [];
    var bimbel = data.bimbel || {};

    var html = ui.pageHead({
      eyebrow: 'Perkembangan anak',
      title: 'Rapor LPMB',
      subtitle: 'Rapor hasil belajar periode yang sudah disetujui admin, siap dicetak dalam format A4.',
      actions: childSwitchHTML(children, active) + '<a class="btn btn-outline" href="#/ortu/harian" data-route>' + ui.icon('clipboard', 15) + ' Hasil harian</a>'
    });
    if (data.pendingCount) {
      html += '<div class="alert alert-info mb-16">' + ui.icon('clock', 16) + '<span><b>' + data.pendingCount + ' rapor</b> sedang menunggu persetujuan admin. Rapor akan muncul di sini setelah disetujui.</span></div>';
    }
    html += '<div class="stat-grid">' +
      ui.stat('award', 'Rapor tersedia', String(rows.length), { hint: 'sudah disetujui' }) +
      ui.stat('clock', 'Menunggu ACC', String(data.pendingCount || 0), { tone: data.pendingCount ? 'amber' : '' }) +
      ui.stat('calendar', 'Periode terbaru', rows.length ? ui.periodeLabel(rows[0].periode) : '—', { tone: 'blue' }) +
      ui.stat('school', 'Bimba', ui.esc(bimbel.nama || 'Mahatari Kecil'), { hint: bimbel.tahunAjaran || '' }) +
    '</div>';

    html += '<div class="card mt-16"><div class="card-body">' +
      (rows.length ? '<div class="grid grid-2">' + rows.map(function (r) {
        var avg = avgScore(r.nilai);
        var p = ui.predikat(avg);
        return '<div class="slip-card"><div class="slip-top"><div class="person-cell">' + S.photo(r.anakFoto, r.anakNama, 'sm') +
            '<div class="pc-info"><b>' + ui.esc(r.anakNama) + '</b><span>' + ui.esc(ui.periodeLabel(r.periode)) + '</span></div></div>' + ui.statusBadge(r.status) + '</div>' +
          '<div class="slip-amount">' + avg + ' <span style="font-size:11px;font-weight:600;color:var(--muted)">/ 100</span></div>' +
          '<div class="row-between mt-8"><span class="small text-muted">Rata-rata nilai</span>' + ui.badge(p.label + ' · ' + p.grade, p.tone) + '</div>' +
          '<div class="slip-lines"><div><span>Pengajar</span><b>' + ui.esc(r.pengajarNama) + '</b></div>' +
            '<div><span>Tanggal rapor</span><b>' + ui.esc(ui.tanggal(r.tanggal, 'short')) + '</b></div></div>' +
          '<div class="row mt-12" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn btn-primary btn-sm" data-rapor="' + ui.attr(r.id) + '">' + ui.icon('fileCheck', 13) + ' Buka rapor A4</button></div></div>';
      }).join('') + '</div>' : ui.empty('award', 'Rapor belum tersedia', 'Rapor LPMB akan tampil di sini setelah pengajar mengisi dan admin menyetujuinya.')) +
    '</div></div>';

    return {
      html: html,
      mount: function (root) {
        bindChildSwitch(root, ctx, active);
        root.addEventListener('click', function (e) {
          var b = e.target.closest('[data-rapor]');
          if (!b) return;
          var r = rows.filter(function (x) { return x.id === b.getAttribute('data-rapor'); })[0];
          if (r) openRapor(r, b);
        });

        async function openRapor(r, btn) {
          ui.busy(btn, true, 'Menyiapkan…');
          try {
            var res = await Promise.all([
              call('ortu.daily', { anakId: r.anakId }),
              call('ortu.attendance', { anakId: r.anakId })
            ]);
            var reports = (res[0].reports || []).filter(function (d) { return String(d.tanggal).slice(0, 7) === r.periode; });
            var att = (res[1].attendance || []).filter(function (a) { return String(a.tanggal).slice(0, 7) === r.periode; });
            var attByDate = {};
            att.forEach(function (a) { attByDate[a.tanggal] = a; });
            var html = raporHTML(r, reports, att, attByDate);
            ui.modal({
              title: 'Rapor ' + r.anakNama,
              subtitle: ui.periodeLabel(r.periode) + ' · siap dicetak A4',
              size: 'xl',
              body: '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:26px;max-width:820px;margin:0 auto">' + html + '</div>',
              footer: '<button type="button" class="btn btn-ghost" data-close>Tutup</button><button type="button" class="btn btn-primary" id="raporPrint">' + ui.icon('printer', 15) + ' Cetak / Simpan PDF</button>',
              onMount: function (el, close) {
                el.querySelector('[data-close]').onclick = close;
                el.querySelector('#raporPrint').onclick = function () { ui.printHTML(html); };
              }
            });
          } catch (err) { ui.toast(err.message, 'error', 6000); }
          ui.busy(btn, false);
        }

        function raporHTML(r, reports, att, attByDate) {
          var avg = avgScore(r.nilai);
          var p = ui.predikat(avg);
          var hadir = att.filter(function (a) { return a.status === 'hadir'; }).length;
          var b = bimbel;
          var logoSrc = b.logoUrl ? '<img src="' + ui.attr(b.logoUrl) + '" alt="Logo" />' : '<img src="' + CONFIG.LOGO_URL + '" alt="Logo Bimba" />';
          var rowsHtml = C.ASPECTS.map(function (a) {
            var v = r.nilai && r.nilai[a.key] != null ? Number(r.nilai[a.key]) : 0;
            var pr = ui.predikat(v);
            return '<tr><td><b>' + ui.esc(a.label) + '</b><br><span style="color:#777;font-size:7.4pt">' + ui.esc(a.hint || '') + '</span></td>' +
              '<td class="num">' + v + '</td><td>' + ui.esc(pr.label) + ' (' + pr.grade + ')</td></tr>';
          }).join('');
          var rekap = reports.length ? reports.map(function (d, i) {
            var a = attByDate[d.tanggal];
            return '<tr><td class="center">' + (i + 1) + '</td><td>' + ui.esc(ui.tanggal(d.tanggal, 'short')) + '</td>' +
              '<td>' + ui.esc(d.materi || '—') + '</td><td>' + ui.esc(d.capaian || '—') + '</td><td class="center">' + (a ? statusAbsen(a.status) : '—') + '</td></tr>';
          }).join('') : '<tr><td colspan="5" class="center" style="color:#888">Belum ada laporan harian pada periode ini.</td></tr>';
          var photos = reports.reduce(function (all, d) { return all.concat(d.fotoUrls || []); }, []).slice(0, 8);
          var photoHtml = photos.length ? '<div class="rapor-section"><h3>Dokumentasi kegiatan</h3><div class="rapor-photos">' +
            photos.map(function (u) { return '<div class="rp-item"><img src="' + ui.attr(u) + '" alt="Dokumentasi" /></div>'; }).join('') + '</div></div>' : '';
          var contact = [b.alamat, b.phone, b.email].filter(Boolean).join(' · ');
          return '<div class="rapor">' +
            '<div class="rapor-head"><div class="rapor-logo">' + logoSrc + '</div><div class="rapor-brand"><h1>' + ui.esc(b.nama || 'Bimba Mahatari Kecil') + '</h1>' +
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
            '<div class="rapor-section"><h3>Rekap Pembelajaran Harian</h3><table class="rapor-table"><thead><tr><th style="width:26px" class="center">No</th><th style="width:72px">Tanggal</th><th>Materi</th><th>Capaian</th><th style="width:70px" class="center">Absensi</th></tr></thead><tbody>' + rekap + '</tbody></table></div>' +
            '<div class="rapor-section"><h3>Catatan Perkembangan</h3><div class="rapor-notes">' + ui.esc(r.catatan || '—') + '</div></div>' +
            (r.rekomendasi ? '<div class="rapor-section"><h3>Rekomendasi</h3><div class="rapor-notes">' + ui.esc(r.rekomendasi) + '</div></div>' : '') +
            '<div class="rapor-section"><h3>Ringkasan Kehadiran</h3><div class="rapor-att"><span>Hadir: ' + hadir + '</span><span>Izin: ' + att.filter(function (a) { return a.status === 'izin'; }).length + '</span>' +
              '<span>Sakit: ' + att.filter(function (a) { return a.status === 'sakit'; }).length + '</span><span>Alpha: ' + att.filter(function (a) { return a.status === 'alpha'; }).length + '</span></div></div>' +
            photoHtml +
            '<div class="rapor-sign"><div><div class="sign-space"></div><div class="sign-name">Orang Tua</div></div>' +
              '<div><div class="sign-space">' + (r.parafGuruUrl ? '<img src="' + ui.attr(r.parafGuruUrl) + '" alt="Paraf pengajar" />' : '') + '</div><div class="sign-name">' + ui.esc(r.pengajarNama || 'Pengajar') + '</div></div>' +
              '<div><div class="sign-space">' + (r.ttdAdminUrl ? '<img src="' + ui.attr(r.ttdAdminUrl) + '" alt="Tanda tangan admin" />' : '') + '</div><div class="sign-name">Admin Bimba</div></div></div>' +
            '<div class="rapor-foot"><span>Dicetak ' + ui.esc(ui.tanggal(ui.isoDate(new Date()), 'long')) + '</span><span>' + ui.esc(b.nama || 'Bimba Mahatari Kecil') + '</span></div>' +
          '</div>';
        }
      }
    };
  };

  /* =====================================================
     PENGATURAN ORANG TUA
     ===================================================== */
  V.pengaturan = async function (ctx) {
    var res = await Promise.all([call('ortu.children'), api.me()]);
    var children = res[0].children || [];
    var user = res[1].user;
    var active = activeChildId(ctx);
    var current = children.filter(function (c) { return String(c.id) === String(active); })[0] || children[0];
    if (current) BMK.store.setActiveChild(current.id);

    var html = ui.pageHead({
      eyebrow: 'Akun',
      title: 'Pengaturan',
      subtitle: 'Data anak, data orang tua, alamat lengkap dengan peta, dan keamanan akun.',
      actions: '<a class="btn btn-outline" href="#/ortu/dashboard" data-route>' + ui.icon('dashboard', 15) + ' Dashboard</a>'
    });

    html += '<div class="grid grid-main-aside"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Data orang tua</h2><p>Nama dan kontak yang digunakan pada administrasi.</p></div></div><div class="card-body">' +
        '<form id="parentForm"><div class="form-grid">' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(user.nama) + '" /></div>' +
            '<div class="field"><label>Username</label><input class="input" value="' + ui.attr(user.username) + '" disabled /></div>' +
          '</div>' +
          '<div class="form-grid two">' +
            '<div class="field"><label>Nomor HP / WhatsApp <span class="req">*</span></label><input class="input" name="phone" value="' + ui.attr(user.phone) + '" placeholder="08xxxxxxxxxx" /></div>' +
            '<div class="field"><label>Email</label><input class="input" type="email" name="email" value="' + ui.attr(user.email) + '" /></div>' +
          '</div>' +
          '<div class="field"><label>Alamat lengkap</label><textarea class="textarea" name="alamat" placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota.">' + ui.esc(user.alamat || '') + '</textarea></div>' +
          '<div class="field"><label>Foto profil</label>' + S.uploadTile('parentPhoto', { existing: user.fotoUrl, icon: 'camera', title: 'Unggah foto', hint: 'JPG/PNG' }) + '</div>' +
          '<div class="form-section"><div class="form-section-title">' + ui.icon('mapPin', 14) + ' Titik lokasi alamat</div>' +
            '<div id="parentMap" class="map-picker"></div>' +
            '<div class="map-coords"><span>Klik peta atau geser pin untuk menandai lokasi rumah.</span><span>Lat: <code id="parentLatLabel">' + ui.esc(user.lat || '—') + '</code></span><span>Lng: <code id="parentLngLabel">' + ui.esc(user.lng || '—') + '</code></span></div>' +
            '<div class="form-grid two mt-12"><div class="field"><label>Latitude</label><input class="input" name="lat" value="' + ui.attr(user.lat) + '" /></div><div class="field"><label>Longitude</label><input class="input" name="lng" value="' + ui.attr(user.lng) + '" /></div></div>' +
            '<button type="button" class="btn btn-outline btn-sm" id="parentGeo">' + ui.icon('mapPin', 14) + ' Gunakan lokasi saat ini</button>' +
          '</div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary" id="parentSave">' + ui.icon('check', 15) + ' Simpan data orang tua</button></div>' +
        '</div></form>' +
      '</div></section>' +

      '<section class="card"><div class="card-head"><div><h2>Data anak</h2><p>Data diri dan foto anak.</p></div>' + (children.length > 1 ? '<select class="select" id="childSelect" style="max-width:220px">' + S.options(children, current ? current.id : '') + '</select>' : '') + '</div><div class="card-body" id="childFormArea"></div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Keamanan akun</h2></div></div><div class="card-body">' +
        '<form id="passwordForm"><div class="form-grid">' +
          '<div class="field"><label>Kata sandi saat ini *</label><input class="input" type="password" name="oldPassword" autocomplete="current-password" /></div>' +
          '<div class="field"><label>Kata sandi baru *</label><input class="input" type="password" name="newPassword" autocomplete="new-password" placeholder="minimal 6 karakter" /></div>' +
          '<div class="field"><label>Ulangi kata sandi baru *</label><input class="input" type="password" name="confirmPassword" autocomplete="new-password" /></div>' +
          '<div class="form-actions"><button type="submit" class="btn btn-primary" id="passwordSave">' + ui.icon('lock', 15) + ' Perbarui kata sandi</button></div>' +
        '</div></form>' +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Catatan</h2></div></div><div class="card-body">' +
        '<div class="note-box">Perubahan data anak dan foto akan terlihat pada rapor dan laporan. Pastikan nama sesuai dokumen.</div>' +
      '</div></section>' +
    '</div></div>';

    return {
      html: html,
      mount: async function (root) {
        /* map alamat orang tua */
        var latInput = root.querySelector('[name="lat"]');
        var lngInput = root.querySelector('[name="lng"]');
        var latLabel = root.querySelector('#parentLatLabel');
        var lngLabel = root.querySelector('#parentLngLabel');
        var mapHandle = null;
        function setCoords(lat, lng) {
          latInput.value = Number(lat).toFixed(6);
          lngInput.value = Number(lng).toFixed(6);
          latLabel.textContent = Number(lat).toFixed(6);
          lngLabel.textContent = Number(lng).toFixed(6);
        }
        try {
          mapHandle = await ui.mountMap(root.querySelector('#parentMap'), {
            lat: user.lat, lng: user.lng,
            onChange: function (lat, lng) { setCoords(lat, lng); }
          });
        } catch (err) { /* peta opsional */ }
        root.querySelector('#parentGeo').onclick = async function () {
          var btn = this;
          ui.busy(btn, true, 'Mengambil lokasi…');
          try {
            var pos = await ui.geolocate();
            if (mapHandle) mapHandle.setPoint({ lat: pos.lat, lng: pos.lng });
            else setCoords(pos.lat, pos.lng);
            ui.toast('Lokasi diperbarui. Simpan data orang tua.', 'success');
          } catch (err) { ui.toast(err.message, 'error', 5000); }
          ui.busy(btn, false);
        };

        var parentForm = root.querySelector('#parentForm');
        parentForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          var d = ui.serialize(parentForm);
          if (!d.nama) { ui.fieldError(parentForm, 'nama', 'Nama wajib diisi.'); return; }
          if (!d.phone) { ui.fieldError(parentForm, 'phone', 'Nomor HP wajib diisi.'); return; }
          var btn = root.querySelector('#parentSave');
          ui.busy(btn, true, 'Menyimpan…');
          try {
            var r = await call('ortu.profile', {
              nama: d.nama, phone: d.phone, email: d.email, alamat: d.alamat, lat: d.lat, lng: d.lng,
              foto: await S.uploadValue('parentPhoto', user.fotoUrl)
            });
            BMK.app.patchUser({ nama: r.user.nama, phone: r.user.phone, email: r.user.email, alamat: r.user.alamat, fotoUrl: r.user.fotoUrl, lat: r.user.lat, lng: r.user.lng });
            ui.toast('Data orang tua diperbarui.', 'success');
            ctx.refresh();
          } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
        });

        /* data anak */
        var childArea = root.querySelector('#childFormArea');
        var childSelect = root.querySelector('#childSelect');
        var selectedChild = current;
        function drawChild() {
          if (!selectedChild) { childArea.innerHTML = ui.empty('baby', 'Belum ada data anak', 'Hubungi admin untuk menambahkan data anak.'); return; }
          var c = selectedChild;
          childArea.innerHTML = '<form id="childForm"><div class="form-grid">' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="' + ui.attr(c.nama) + '" /></div>' +
              '<div class="field"><label>Nama panggilan</label><input class="input" name="panggilan" value="' + ui.attr(c.panggilan) + '" /></div>' +
            '</div>' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Jenis kelamin <span class="req">*</span></label><select class="select" name="gender"><option value="">Pilih</option><option value="laki"' + (c.gender === 'laki' ? ' selected' : '') + '>Laki-laki</option><option value="perempuan"' + (c.gender === 'perempuan' ? ' selected' : '') + '>Perempuan</option></select></div>' +
              '<div class="field"><label>Tanggal lahir <span class="req">*</span></label><input class="input" type="date" name="tglLahir" max="' + ui.attr(ui.isoDate(new Date())) + '" value="' + ui.attr(c.tglLahir) + '" /></div>' +
            '</div>' +
            '<div class="form-grid two">' +
              '<div class="field"><label>Sekolah</label><input class="input" name="sekolah" value="' + ui.attr(c.sekolah) + '" /></div>' +
              '<div class="field"><label>Kelas</label><input class="input" name="kelas" value="' + ui.attr(c.kelas) + '" /></div>' +
            '</div>' +
            '<div class="field"><label>Catatan</label><textarea class="textarea" name="catatan" placeholder="Catatan khusus tentang anak.">' + ui.esc(c.catatan || '') + '</textarea></div>' +
            '<div class="field"><label>Foto anak</label>' + S.uploadTile('childPhotoSetting', { existing: c.fotoUrl, icon: 'camera', title: 'Unggah foto anak', hint: 'JPG/PNG, tampil di rapor' }) + '</div>' +
            '<div class="form-actions"><button type="submit" class="btn btn-primary" id="childSave">' + ui.icon('check', 15) + ' Simpan data anak</button></div>' +
          '</div></form>';
          var form = childArea.querySelector('#childForm');
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var d = ui.serialize(form);
            if (!d.nama) { ui.fieldError(form, 'nama', 'Nama anak wajib diisi.'); return; }
            if (!d.gender) { ui.fieldError(form, 'gender', 'Pilih jenis kelamin.'); return; }
            if (!d.tglLahir) { ui.fieldError(form, 'tglLahir', 'Tanggal lahir wajib diisi.'); return; }
            var btn = childArea.querySelector('#childSave');
            ui.busy(btn, true, 'Menyimpan…');
            try {
              await call('ortu.child.save', {
                id: c.id, nama: d.nama, panggilan: d.panggilan, gender: d.gender, tglLahir: d.tglLahir,
                sekolah: d.sekolah, kelas: d.kelas, catatan: d.catatan,
                foto: await S.uploadValue('childPhotoSetting', c.fotoUrl)
              });
              ui.toast('Data anak diperbarui.', 'success');
              ctx.refresh();
            } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
          });
        }
        drawChild();
        if (childSelect) childSelect.onchange = function () {
          var value = childSelect.value;
          selectedChild = children.filter(function (c) { return String(c.id) === String(value); })[0] || selectedChild;
          if (selectedChild) {
            BMK.store.setActiveChild(selectedChild.id);
            ctx.params.anak = selectedChild.id;
          }
          drawChild();
        };

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

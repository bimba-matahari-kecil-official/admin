(function () {
  window.BMK = window.BMK || {};
  BMK.views = BMK.views || {};
  var V = BMK.views.ortu = {};

  V.perpanjang = function () {
    return BMK.pages.register({ embedded: true, extend: '1' });
  };
  var ui = BMK.ui;
  var api = BMK.api;
  var S = BMK.shared;

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
        '<a class="btn btn-outline" href="#/ortu/perpanjang" data-route>' + ui.icon('book', 15) + ' Tambah Paket</a>' +
        '<a class="btn btn-outline" href="#/ortu/lpmb" data-route>' + ui.icon('award', 15) + ' Rapor LPMB</a>'
    });

    if (ov.unpaidCount) {
      html += '<div class="alert alert-warning mb-16">' + ui.icon('wallet', 16) + '<span><b>' + ov.unpaidCount + ' tagihan belum lunas</b> total ' + ui.rupiah(ov.unpaidTotal) + '. <a class="bold" href="#/ortu/administrasi" data-route>Selesaikan pembayaran</a></span></div>';
    }

    var changedAt = enr && enr.pengajarChangedAt ? new Date(String(enr.pengajarChangedAt).replace(' ', 'T')) : null;
    if (changedAt && !isNaN(changedAt.getTime()) && (Date.now() - changedAt.getTime()) <= 30 * 86400000) {
      html += '<div class="alert alert-info mb-16">' + ui.icon('refresh', 16) + '<span><b>Pengajar ' + ui.esc(child.nama) + ' kini ' +
        ui.esc(enr.pengajar ? enr.pengajar.nama : 'pengajar baru') + '</b> mulai ' + ui.esc(ui.tanggal(String(enr.pengajarChangedAt).slice(0, 10), 'long')) +
        '. Laporan harian dan rapor LPMB dilanjutkan oleh pengajar baru.</span></div>';
    }

    html += '<div class="welcome-card"><div class="welcome-copy">' +
        '<div class="welcome-kicker">' + ui.icon('sun', 12) + ' ' + ui.esc(child.nama) + ' · ' + ui.esc(child.kelas || 'Anak bimbingan') + '</div>' +
        '<h2>' + (next ? 'Sesi berikutnya ' + ui.esc(next.hari) + ', ' + ui.esc(ui.tanggal(next.tanggal, 'short')) + ' · ' + ui.esc(next.jamMulai) + '–' + ui.esc(next.jamSelesai) : 'Semangat belajar hari ini!') + '</h2>' +
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
      '<section class="card"><div class="card-head"><div><h2>Kehadiran terbaru</h2><p>Absensi disertai foto kegiatan.</p></div></div><div class="card-body">' +
        (data.attendance.length ? data.attendance.map(function (a) {
          return '<div class="list-row">' + (a.fotoUrl ? '<button type="button" class="avatar avatar-md" data-home-photo="' + ui.attr(a.id) + '" style="border:0;padding:0;overflow:hidden;background:#0f1614"><img src="' + ui.attr(a.fotoUrl) + '" alt="Foto absensi" /></button>' : '<span class="avatar avatar-md avatar-text">' + ui.esc((a.anakNama || 'A').charAt(0)) + '</span>') +
            '<div class="list-main"><b>' + ui.esc(ui.tanggal(a.tanggal, 'long')) + '</b><span>' + ui.esc(a.jam || '—') + '</span></div>' +
            '<div class="list-end">' + ui.statusBadge(a.status) + '</div></div>';
        }).join('') : ui.empty('camera', 'Belum ada absensi', 'Catatan kehadiran akan tampil di sini.')) +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Paket belajar</h2></div><div class="row" style="gap:6px"><a class="link-btn" href="#/ortu/perpanjang" data-route>Tambah paket</a><a class="link-btn" href="#/ortu/administrasi" data-route>Detail</a></div></div><div class="card-body">' +
        (enr ? '<div class="info-list">' + S.infoItem('Paket', enr.paket ? enr.paket.nama : '—') +
            S.infoItem('Jadwal', enr.jadwalTeks || '—') + S.infoItem('Pengajar', enr.pengajar ? enr.pengajar.nama : '—') +
            S.infoItem('Biaya', enr.paket ? ui.rupiah(enr.paket.harga) + ' / bulan' : '—') + '</div>' +
            (next ? '<div class="alert alert-info mt-12">' + ui.icon('calendar', 15) + '<span>Sesi berikutnya <b>' + ui.esc(next.hari + ', ' + next.jamMulai) + '</b> pada ' + ui.esc(ui.tanggal(next.tanggal, 'long')) + '.</span></div>' : '')
          : ui.empty('book', 'Belum terdaftar paket', 'Pilih paket dan jadwal belajar langsung dari akun Anda.', '<a class="btn btn-primary" href="#/ortu/perpanjang" data-route>Tambah paket belajar</a>')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Tagihan</h2></div><a class="link-btn" href="#/ortu/administrasi" data-route>Administrasi</a></div><div class="card-body">' +
        (unpaid.length ? unpaid.slice(0, 4).map(function (b) {
          var sisa = b.sisa != null ? b.sisa : b.jumlah;
          return '<div class="list-row"><span class="stat-ic" style="width:34px;height:34px;background:var(--amber-soft);color:#8a5a00">' + ui.icon('receipt', 15) + '</span>' +
            '<div class="list-main"><b>' + ui.esc(ui.periodeLabel(b.periode)) + '</b><span>Jatuh tempo ' + ui.esc(ui.tanggal(b.jatuhTempo, 'short')) + (Number(b.dibayar) > 0 ? ' · Dibayar ' + ui.rupiah(b.dibayar) : '') + '</span></div>' +
            '<div class="list-end"><b class="money">' + ui.rupiah(sisa) + '</b>' + ui.statusBadge(b.status) + '</div></div>';
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
          if (a) S.photoModal(a.fotoUrl, [['Tanggal', ui.tanggal(a.tanggal)], ['Status', S.statusAbsen(a.status)], ['Jam', a.jam], ['Catatan', a.catatan || '—']]);
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
        '<a class="btn btn-outline" href="#/ortu/perpanjang" data-route>' + ui.icon('book', 15) + ' Tambah paket</a>' +
        '<a class="btn btn-outline" href="#/ortu/dashboard" data-route>' + ui.icon('dashboard', 15) + ' Dashboard</a>'
    });
    html += '<div class="stat-grid">' +
      ui.stat('receipt', 'Total tagihan', ui.rupiah(sm.total), { hint: bills.length + ' tagihan' }) +
      ui.stat('checkCircle', 'Sudah dibayar', ui.rupiah(sm.paid), { tone: 'dark' }) +
      ui.stat('wallet', 'Perlu dibayar', ui.rupiah(sm.outstanding), { tone: sm.outstanding ? 'red' : '' }) +
      ui.stat('calendar', 'Tahun ajaran', ui.esc(data.bimbel.tahunAjaran || '—'), { hint: data.bimbel.nama }) +
    '</div>';

    html += '<div class="grid grid-main-aside mt-16"><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Tagihan SPP</h2><p>' + (activeChild ? ui.esc(activeChild.nama) : 'Semua anak') + ' · pembayaran boleh dicicil beberapa kali, unggah bukti tiap pembayaran.</p></div>' + ui.badge('SPP', 'teal') + '</div><div class="card-body">' +
        (bills.length ? '<div class="table-wrap"><table class="data-table bill-table ortu-bill-table"><thead><tr><th>Periode</th><th>Jatuh tempo</th><th class="num">Jumlah</th><th class="num">Dibayar</th><th class="num">Sisa</th><th>Status</th><th></th></tr></thead><tbody id="billRows"></tbody></table></div>' : ui.empty('checkCircle', 'Belum ada tagihan', 'Tagihan bulanan akan muncul di sini setelah admin menerbitkannya.')) +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Paket & jadwal belajar</h2><p>Informasi paket yang sedang berjalan.</p></div><a class="link-btn" href="#/ortu/perpanjang" data-route>Tambah paket</a></div><div class="card-body">' +
        (enrollments.length ? enrollments.map(function (e) {
          return '<div class="slip-card mb-12"><div class="slip-top"><div><h3 style="font-size:14px">' + ui.esc(e.paket ? e.paket.nama : 'Paket belajar') + '</h3><span class="small text-muted">' + ui.esc(e.jadwalTeks || 'Jadwal belum diatur') + '</span></div>' + ui.badge('Aktif', 'green') + '</div>' +
            '<div class="info-list">' + S.infoItem('Pengajar', e.pengajar ? e.pengajar.nama : '—') +
              S.infoItem('Sesi per bulan', e.paket ? e.paket.sesiPerBulan + ' sesi' : '—') +
              S.infoItem('Durasi', e.paket ? e.paket.durasiMenit + ' menit' : '—') +
              S.infoItem('Biaya', e.paket ? ui.rupiah(e.paket.harga) + ' / bulan' : '—') +
              S.infoItem('Mulai', e.tanggalMulai ? ui.tanggal(e.tanggalMulai) : '—') + S.infoItem('Status', 'Aktif') + '</div></div>';
        }).join('') : ui.empty('book', 'Belum ada paket aktif', 'Tambahkan paket belajar dan pilih jadwal langsung dari akun Anda.', '<a class="btn btn-primary" href="#/ortu/perpanjang" data-route>Tambah paket belajar</a>')) +
      '</div></section>' +
    '</div><div class="stack">' +
      '<section class="card"><div class="card-head"><div><h2>Pembayaran</h2></div></div><div class="card-body">' +
        '<div class="info-list">' + S.infoItem('Rekening', data.rekening || 'Hubungi admin') + S.infoItem('Konfirmasi', 'Unggah bukti transfer') + '</div>' +
        '<div class="note-box mt-12">Setelah bukti diunggah, admin akan memverifikasi. Status tagihan berubah menjadi <b>Lunas</b> setelah disetujui.</div>' +
        (data.bimbel.waAdmin ? '<a class="btn btn-outline mt-12" style="width:100%" href="' + ui.attr(ui.waLink(data.bimbel.waAdmin, 'Halo admin ' + data.bimbel.nama + ', saya ingin bertanya tentang pembayaran.')) + '" target="_blank" rel="noopener">' + ui.icon('message', 14) + ' Hubungi admin via WA</a>' : '') +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2>Bantuan</h2></div></div><div class="card-body">' +
        '<div class="note-box">Pembayaran resmi hanya melalui rekening Bimbel. Simpan bukti transfer sampai status tagihan berubah menjadi lunas.</div>' +
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

        function sisaOf(b) {
          var n = b.sisa != null ? Number(b.sisa) : Number(b.jumlah || 0) - Number(b.dibayar || 0);
          return isFinite(n) ? Math.max(0, n) : 0;
        }

        function historyHTML(b) {
          var list = b.payments || [];
          if (!list.length) return '<div class="note-box">Belum ada pembayaran tercatat. Riwayat pembayaran akan tampil di sini.</div>';
          return '<div class="payment-list">' + list.map(function (p) {
            return '<div class="payment-row">' +
              '<div class="payment-info"><b>' + ui.rupiah(p.jumlah) + '</b>' +
                '<span>' + ui.esc(ui.tanggal(p.createdAt || p.tanggalBayar)) + ' · ' + ui.esc(p.metode || 'transfer') + '</span>' +
                (p.catatan ? '<span>' + ui.esc(p.catatan) + '</span>' : '') +
              '</div><div class="payment-side">' + ui.statusBadge(p.status) + '</div></div>';
          }).join('') + '</div>';
        }

        function drawBills() {
          var body = root.querySelector('#billRows');
          if (!body) return;
          if (!bills.length) return;
          body.innerHTML = bills.map(function (b) {
            var sisa = sisaOf(b);
            var pending = b.status === 'menunggu_verifikasi';
            var cicilan = (b.payments || []).filter(function (p) { return p.status === 'diterima'; }).length;
            return '<tr><td><b class="cell-strong">' + ui.esc(ui.periodeLabel(b.periode)) + '</b><span class="cell-sub">' + ui.esc(b.anakNama || '') + '</span>' +
              '<span class="bill-mobile-status">' + ui.statusBadge(b.status) + (cicilan ? ' <span class="cell-sub">' + cicilan + '× bayar</span>' : '') + '</span></td>' +
              '<td>' + ui.esc(ui.tanggal(b.jatuhTempo, 'short')) + '</td>' +
              '<td class="num money">' + ui.rupiah(b.jumlah) + '</td>' +
              '<td class="num money">' + ui.rupiah(b.dibayar || 0) + (cicilan ? '<span class="cell-sub">' + cicilan + '× bayar</span>' : '') + '</td>' +
              '<td class="num money">' + ui.rupiah(sisa) + '</td>' +
              '<td>' + ui.statusBadge(b.status) + (b.status === 'ditolak' && b.catatan ? '<span class="cell-sub text-red">' + ui.esc(b.catatan) + '</span>' : '') + '</td>' +
              '<td><div class="cell-actions">' +
                (sisa > 0 && !pending ? '<button type="button" class="btn btn-primary btn-sm" data-pay="' + ui.attr(b.id) + '">' + ui.icon('upload', 13) + ' ' + (Number(b.dibayar) > 0 ? 'Cicil lagi' : 'Bayar') + '</button>' : '') +
                (pending ? '<span class="cell-sub text-muted">Menunggu verifikasi</span>' : '') +
                (b.buktiUrl ? '<button type="button" class="btn btn-outline btn-sm" data-bill-proof="' + ui.attr(b.id) + '">' + ui.icon('image', 13) + ' Bukti</button>' : '') +
              '</div></td></tr>';
          }).join('');
        }

        function proofModal(b) {
          ui.modal({
            title: 'Bukti pembayaran',
            subtitle: ui.periodeLabel(b.periode) + ' · ' + ui.rupiah(b.jumlah),
            size: 'lg',
            body: '<div style="border-radius:12px;overflow:hidden;background:#0f1614"><img src="' + ui.attr(b.buktiUrl) + '" alt="Bukti pembayaran" style="width:100%;max-height:60vh;object-fit:contain" /></div>' +
              '<div class="info-list mt-16">' + S.infoItem('Status', ui.statusBadge(b.status), true) + S.infoItem('Sudah dibayar', ui.rupiah(b.dibayar || 0)) +
                S.infoItem('Sisa tagihan', ui.rupiah(sisaOf(b))) + S.infoItem('Metode', b.metode || '—') +
                S.infoItem('Tanggal bayar', b.tanggalBayar ? ui.tanggal(b.tanggalBayar) : '—') + S.infoItem('Catatan', b.catatan || '—') + '</div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('receipt', 14) + ' Riwayat pembayaran</div>' + historyHTML(b) + '</div>',
            footer: '<button type="button" class="btn btn-primary" data-close>Tutup</button>',
            onMount: function (el, close) { el.querySelector('[data-close]').onclick = close; }
          });
        }

        function openPay(b) {
          var sisa = sisaOf(b);
          if (sisa <= 0) { ui.toast('Tagihan ini sudah lunas.', 'success'); return; }
          if (b.status === 'menunggu_verifikasi') { ui.toast('Bukti pembayaran sebelumnya masih menunggu verifikasi admin.', 'error', 6000); return; }
          var sesiNote = (b.hargaPerSesi && b.sesiPaket)
            ? 'Paket ' + b.sesiPaket + ' sesi · ' + ui.rupiah(b.hargaPerSesi) + ' per sesi. Anda bisa membayar per sesi atau beberapa sesi sekaligus.'
            : 'Pembayaran dapat dilakukan beberapa kali hingga sisa tagihan habis.';
          ui.modal({
            title: Number(b.dibayar) > 0 ? 'Pembayaran cicilan' : 'Unggah bukti pembayaran',
            subtitle: ui.periodeLabel(b.periode) + ' · sisa ' + ui.rupiah(sisa),
            size: 'md',
            body: '<form id="payForm"><div class="form-grid">' +
              '<div class="info-list">' + S.infoItem('Anak', b.anakNama) + S.infoItem('Jumlah tagihan', ui.rupiah(b.jumlah)) +
                S.infoItem('Sudah dibayar', ui.rupiah(b.dibayar || 0)) + S.infoItem('Sisa tagihan', ui.rupiah(sisa)) +
                S.infoItem('Jatuh tempo', ui.tanggal(b.jatuhTempo)) + S.infoItem('Rekening', data.rekening || 'Hubungi admin') + '</div>' +
              '<div class="field"><label>Nominal pembayaran <span class="req">*</span></label><input class="input" type="number" name="jumlah" min="1" max="' + ui.attr(sisa) + '" step="1000" inputmode="numeric" value="' + ui.attr(sisa) + '" /><div class="hint">Boleh sebagian (cicilan), maksimal ' + ui.rupiah(sisa) + '.</div></div>' +
              '<div class="field"><label>Metode pembayaran</label><select class="select" name="metode"><option value="transfer">Transfer bank</option><option value="qris">QRIS</option><option value="tunai">Tunai / langsung</option></select></div>' +
              '<div class="field"><label>Foto bukti pembayaran <span class="req">*</span></label>' + S.uploadTile('payProof', { icon: 'camera', title: 'Unggah bukti transfer', hint: 'JPG/PNG, pastikan nominal terbaca' }) + '</div>' +
              '<div class="field"><label>Catatan</label><textarea class="textarea" name="catatan" placeholder="Contoh: cicilan sesi 1–3, transfer dari rekening BCA a.n. ..."></textarea></div>' +
              '<div class="note-box">' + ui.esc(sesiNote) + ' Tagihan otomatis berstatus <b>lunas</b> setelah total pembayaran terverifikasi mencapai jumlah tagihan.</div>' +
              '<div class="form-section"><div class="form-section-title">' + ui.icon('receipt', 14) + ' Riwayat pembayaran</div>' + historyHTML(b) + '</div>' +
            '</div></form>',
            footer: '<button type="button" class="btn btn-ghost" data-close>Batal</button><button type="button" class="btn btn-primary" id="paySave">' + ui.icon('send', 14) + ' Kirim bukti</button>',
            onMount: function (el, close) {
              el.querySelector('[data-close]').onclick = close;
              var form = el.querySelector('#payForm');
              el.querySelector('#paySave').onclick = async function () {
                var btn = this;
                var d = ui.serialize(form);
                var nominal = Number(d.jumlah);
                if (!isFinite(nominal) || nominal <= 0) { ui.fieldError(form, 'jumlah', 'Nominal pembayaran wajib diisi.'); return; }
                if (nominal > sisa) { ui.fieldError(form, 'jumlah', 'Nominal melebihi sisa tagihan ' + ui.rupiah(sisa) + '.'); return; }
                ui.busy(btn, true, 'Mengunggah…');
                try {
                  var bukti = await S.uploadValue('payProof', '');
                  if (!bukti) { ui.busy(btn, false); ui.toast('Unggah foto bukti pembayaran terlebih dahulu.', 'error'); return; }
                  await call('ortu.bayar', { id: b.id, jumlah: nominal, metode: d.metode, catatan: d.catatan, bukti: bukti });
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
      (attendance.length ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Status</th><th>Jam</th><th>Catatan</th><th></th></tr></thead><tbody>' +
        attendance.slice(0, 40).map(function (a) {
          return '<tr><td><b class="cell-strong">' + ui.esc(ui.tanggal(a.tanggal, 'short')) + '</b></td><td>' + ui.statusBadge(a.status) + '</td>' +
            '<td>' + ui.esc(a.jam || '—') + '</td>' +
            '<td class="small">' + ui.esc(a.catatan || '—') + '</td>' +
            '<td>' + (a.fotoUrl ? '<button type="button" class="btn btn-outline btn-sm" data-att-photo="' + ui.attr(a.id) + '">' + ui.icon('image', 13) + ' Foto</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : ui.empty('camera', 'Belum ada absensi', 'Kehadiran akan tercatat setelah pengajar mengisi absensi.')) +
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
            if (a) S.photoModal(a.fotoUrl, [['Tanggal', ui.tanggal(a.tanggal)], ['Status', S.statusAbsen(a.status)], ['Jam', a.jam], ['Catatan', a.catatan || '—']]);
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
              '<div class="list-main"><b>Absensi · ' + ui.esc(S.statusAbsen(att.status)) + '</b><span>' + ui.esc(att.jam || '—') + '</span>' +
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
      ui.stat('school', 'Bimbel', ui.esc(bimbel.nama || 'Matahari Kecil'), { hint: bimbel.tahunAjaran || '' }) +
    '</div>';

    html += '<div class="card mt-16"><div class="card-body">' +
      (rows.length ? '<div class="grid grid-2">' + rows.map(function (r) {
        var avg = S.avgScore(r.nilai);
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
            var html = S.raporHTML(r, reports, att, bimbel);
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
      subtitle: 'Data anak, data orang tua, alamat, dan keamanan akun.',
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
          '<div class="form-actions"><button type="submit" class="btn btn-primary" id="parentSave">' + ui.icon('check', 15) + ' Simpan data orang tua</button></div>' +
        '</div></form>' +
      '</div></section>' +

      '<section class="card"><div class="card-head"><div><h2>Data anak</h2><p>Data diri, alamat rumah, dan foto halaman depan.</p></div><div class="row" style="gap:8px">' +
        (children.length ? '<select class="select" id="childSelect" style="max-width:200px">' + S.options(children, current ? current.id : '') + '</select>' : '') +
        '<button type="button" class="btn btn-outline btn-sm" id="addChildBtn">' + ui.icon('plus', 14) + ' Tambah anak</button>' +
      '</div></div><div class="card-body" id="childFormArea"></div></section>' +
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
              nama: d.nama, phone: d.phone, email: d.email, alamat: d.alamat,
              foto: await S.uploadValue('parentPhoto', user.fotoUrl)
            });
            BMK.app.patchUser({ nama: r.user.nama, phone: r.user.phone, email: r.user.email, alamat: r.user.alamat, fotoUrl: r.user.fotoUrl });
            ui.toast('Data orang tua diperbarui.', 'success');
            ctx.refresh();
          } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
        });

        /* data anak */
        var childArea = root.querySelector('#childFormArea');
        var childSelect = root.querySelector('#childSelect');
        var addChildBtn = root.querySelector('#addChildBtn');
        var selectedChild = current;
        var childMode = selectedChild ? 'edit' : 'new';

        function mapsLink(lat, lng) {
          if (!lat || !lng) return '';
          return 'https://www.google.com/maps?q=' + encodeURIComponent(lat + ',' + lng);
        }

        function childFieldsHTML(c) {
          c = c || {};
          var link = mapsLink(c.rumahLat, c.rumahLng);
          return '<div class="form-grid two">' +
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
            '<div class="field"><label>Alamat rumah</label><textarea class="textarea" name="alamatRumah" placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kota.">' + ui.esc(c.alamatRumah || '') + '</textarea><p class="hint">Dibagikan ke pengajar untuk kunjungan belajar.</p></div>' +
            '<div class="field"><label>Titik lokasi rumah</label>' +
              '<div class="form-grid two" style="gap:8px">' +
                '<input class="input" name="rumahLat" value="' + ui.attr(c.rumahLat) + '" placeholder="Latitude, mis. -6.8957" inputmode="decimal" />' +
                '<input class="input" name="rumahLng" value="' + ui.attr(c.rumahLng) + '" placeholder="Longitude, mis. 107.6160" inputmode="decimal" />' +
              '</div>' +
              '<div class="row mt-8" style="gap:8px;flex-wrap:wrap;align-items:center">' +
                '<button type="button" class="btn btn-outline btn-sm" data-geo>' + ui.icon('mapPin', 14) + ' Ambil lokasi saat ini</button>' +
                (link ? '<a class="btn btn-ghost btn-sm" href="' + ui.attr(link) + '" target="_blank" rel="noopener">' + ui.icon('mapPin', 14) + ' Lihat di Maps</a>' : '') +
              '</div>' +
              '<p class="hint">Izinkan akses lokasi pada browser, atau isi koordinat secara manual.</p>' +
            '</div>' +
            '<div class="field"><label>Foto anak</label>' + S.uploadTile('childPhotoSetting', { existing: c.fotoUrl, icon: 'camera', title: 'Unggah foto anak', hint: 'JPG/PNG, tampil di rapor' }) + '</div>' +
            '<div class="field"><label>Foto halaman depan rumah</label>' + S.uploadTile('childHousePhoto', { existing: c.fotoRumahUrl, icon: 'home', title: 'Unggah foto rumah', hint: 'Bantu pengajar mengenali rumah' }) + '</div>';
        }

        function drawChild() {
          if (childMode === 'new') {
            childArea.innerHTML = '<div class="row-between" style="margin-bottom:12px;align-items:flex-start">' +
              '<div><b style="font-family:var(--display);font-size:17px">Anak baru</b><p class="small text-muted" style="margin:2px 0 0">Satu akun dapat menampung lebih dari dua anak.</p></div>' +
              (children.length ? '<button type="button" class="btn btn-ghost btn-sm" data-cancel-new>Batal</button>' : '') +
            '</div>' +
            '<form id="childForm"><div class="form-grid">' + childFieldsHTML(null) +
              '<div class="form-actions"><button type="submit" class="btn btn-primary" id="childSave">' + ui.icon('check', 15) + ' Simpan anak baru</button></div>' +
            '</div></form>';
          } else if (!selectedChild) {
            childArea.innerHTML = '<div style="padding:6px 0">' + ui.empty('baby', 'Belum ada data anak', 'Tambahkan anak untuk mulai mendaftarkan paket belajar.', '<button type="button" class="btn btn-primary" id="emptyAddChild">' + ui.icon('plus', 15) + ' Tambah anak</button>') + '</div>';
          } else {
            childArea.innerHTML = '<form id="childForm"><div class="form-grid">' + childFieldsHTML(selectedChild) +
              '<div class="form-actions"><button type="submit" class="btn btn-primary" id="childSave">' + ui.icon('check', 15) + ' Simpan data anak</button>' +
                '<a class="btn btn-outline" href="#/ortu/perpanjang" data-route>' + ui.icon('book', 15) + ' Tambah paket belajar</a>' +
              '</div>' +
            '</div></form>';
          }
          bindChildForm();
        }

        function bindChildForm() {
          var form = childArea.querySelector('#childForm');
          var cancel = childArea.querySelector('[data-cancel-new]');
          if (cancel) cancel.onclick = function () { childMode = 'edit'; drawChild(); };
          var emptyAdd = childArea.querySelector('#emptyAddChild');
          if (emptyAdd) emptyAdd.onclick = startNewChild;
          if (!form) return;
          var geoBtn = form.querySelector('[data-geo]');
          if (geoBtn) geoBtn.onclick = function () {
            if (!navigator.geolocation) { ui.toast('Perangkat tidak mendukung lokasi otomatis.', 'error'); return; }
            geoBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(function (p) {
              form.querySelector('[name="rumahLat"]').value = p.coords.latitude.toFixed(6);
              form.querySelector('[name="rumahLng"]').value = p.coords.longitude.toFixed(6);
              geoBtn.disabled = false;
              ui.toast('Titik lokasi rumah terisi dari GPS.', 'success');
            }, function () {
              geoBtn.disabled = false;
              ui.toast('Izin lokasi ditolak. Isi koordinat secara manual.', 'error', 5000);
            }, { enableHighAccuracy: true, timeout: 10000 });
          };
          form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var d = ui.serialize(form);
            if (!d.nama) { ui.fieldError(form, 'nama', 'Nama anak wajib diisi.'); return; }
            if (!d.gender) { ui.fieldError(form, 'gender', 'Pilih jenis kelamin.'); return; }
            if (!d.tglLahir) { ui.fieldError(form, 'tglLahir', 'Tanggal lahir wajib diisi.'); return; }
            var isNew = childMode === 'new' || !selectedChild;
            var c = isNew ? {} : selectedChild;
            var btn = childArea.querySelector('#childSave');
            ui.busy(btn, true, 'Menyimpan…');
            try {
              var payload = {
                nama: d.nama, panggilan: d.panggilan, gender: d.gender, tglLahir: d.tglLahir,
                sekolah: d.sekolah, kelas: d.kelas, catatan: d.catatan,
                alamatRumah: d.alamatRumah, rumahLat: d.rumahLat, rumahLng: d.rumahLng,
                foto: await S.uploadValue('childPhotoSetting', c.fotoUrl),
                fotoRumah: await S.uploadValue('childHousePhoto', c.fotoRumahUrl)
              };
              if (!isNew) payload.id = c.id;
              await call('ortu.child.save', payload);
              ui.toast(isNew ? 'Anak baru berhasil ditambahkan.' : 'Data anak diperbarui.', 'success');
              ctx.refresh();
            } catch (err) { ui.busy(btn, false); ui.toast(err.message, 'error', 5500); }
          });
        }

        function startNewChild() {
          childMode = 'new';
          drawChild();
          var input = childArea.querySelector('[name="nama"]');
          if (input) input.focus();
        }

        drawChild();
        if (addChildBtn) addChildBtn.onclick = startNewChild;
        if (childSelect) childSelect.onchange = function () {
          var value = childSelect.value;
          selectedChild = children.filter(function (c) { return String(c.id) === String(value); })[0] || selectedChild;
          childMode = 'edit';
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
